// janja-sysaudio: som do PC para a stream, separado por programa (como o Discord faz).
//
//   janja-sysaudio.exe window <hwnd> <pid-do-app>   sÃ³ o som do programa dessa janela
//   janja-sysaudio.exe screen 0 <pid-do-app>        o som de todos os programas, menos o prÃ³prio app e
//                                                   os de chamada de voz (Discord, TeamSpeak...): senÃ£o
//                                                   quem assiste ouve a prÃ³pria voz de volta
//
// Sai em stdout: float32 estÃ©reo intercalado, 48 kHz, em blocos de 10 ms, num ritmo fixo de relÃ³gio.
// Termina quando o stdin fecha (o app fechou ou parou a stream). Precisa do Windows 10 2004+ (build 19041).
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <mmsystem.h>
#include <algorithm>
#include <audioclient.h>
#include <audioclientactivationparams.h>
#include <audiopolicy.h>
#include <mmdeviceapi.h>
#include <fcntl.h>
#include <io.h>
#include <tlhelp32.h>
#include <atomic>
#include <cstdio>
#include <cwchar>
#include <map>
#include <memory>
#include <mutex>
#include <set>
#include <string>
#include <thread>
#include <vector>

#pragma comment(lib, "mmdevapi.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "winmm.lib")

static const int RATE = 48000, CH = 2, BLOCK = RATE / 100; // 10 ms
static const size_t MAX_BUF = RATE / 5 * CH;               // 200 ms: mais que isso Ã© atraso, joga fora
static std::atomic<bool> running{true};

// ---------- ativaÃ§Ã£o do "process loopback" (ActivateAudioInterfaceAsync) ----------
class Done : public IActivateAudioInterfaceCompletionHandler, public IAgileObject {
  LONG refs = 1;

 public:
  HANDLE ev = CreateEventW(nullptr, TRUE, FALSE, nullptr);
  ~Done() { CloseHandle(ev); }
  STDMETHODIMP QueryInterface(REFIID id, void** out) override {
    if (id == __uuidof(IUnknown) || id == __uuidof(IActivateAudioInterfaceCompletionHandler))
      *out = static_cast<IActivateAudioInterfaceCompletionHandler*>(this);
    else if (id == __uuidof(IAgileObject))
      *out = static_cast<IAgileObject*>(this);
    else
      return *out = nullptr, E_NOINTERFACE;
    AddRef();
    return S_OK;
  }
  STDMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement(&refs); }
  STDMETHODIMP_(ULONG) Release() override {
    LONG n = InterlockedDecrement(&refs);
    if (!n) delete this;
    return n;
  }
  STDMETHODIMP ActivateCompleted(IActivateAudioInterfaceAsyncOperation*) override {
    SetEvent(ev);
    return S_OK;
  }
};

struct Source {
  DWORD pid = 0;
  IAudioClient* client = nullptr;
  IAudioCaptureClient* cap = nullptr;
  std::vector<float> buf; // amostras esperando a mistura
  bool dead = false;
  ~Source() {
    if (client) client->Stop();
    if (cap) cap->Release();
    if (client) client->Release();
  }
};

static std::unique_ptr<Source> openSource(DWORD pid, bool exclude) {
  AUDIOCLIENT_ACTIVATION_PARAMS p = {};
  p.ActivationType = AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK;
  p.ProcessLoopbackParams.TargetProcessId = pid;
  p.ProcessLoopbackParams.ProcessLoopbackMode =
      exclude ? PROCESS_LOOPBACK_MODE_EXCLUDE_TARGET_PROCESS_TREE : PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE;
  PROPVARIANT pv = {};
  pv.vt = VT_BLOB;
  pv.blob.cbSize = sizeof(p);
  pv.blob.pBlobData = reinterpret_cast<BYTE*>(&p);
  Done* done = new Done();
  IActivateAudioInterfaceAsyncOperation* op = nullptr;
  HRESULT hr = ActivateAudioInterfaceAsync(VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK, __uuidof(IAudioClient), &pv, done, &op);
  if (FAILED(hr)) return done->Release(), nullptr;
  WaitForSingleObject(done->ev, 5000);
  HRESULT ar = E_FAIL;
  IUnknown* unk = nullptr;
  op->GetActivateResult(&ar, &unk);
  op->Release();
  done->Release();
  if (FAILED(ar) || !unk) return nullptr;
  auto s = std::make_unique<Source>();
  s->pid = pid;
  unk->QueryInterface(__uuidof(IAudioClient), reinterpret_cast<void**>(&s->client));
  unk->Release();
  if (!s->client) return nullptr;
  WAVEFORMATEX f = {};
  f.wFormatTag = WAVE_FORMAT_IEEE_FLOAT;
  f.nChannels = CH;
  f.nSamplesPerSec = RATE;
  f.wBitsPerSample = 32;
  f.nBlockAlign = CH * 4;
  f.nAvgBytesPerSec = RATE * f.nBlockAlign;
  hr = s->client->Initialize(AUDCLNT_SHAREMODE_SHARED, AUDCLNT_STREAMFLAGS_LOOPBACK | AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM,
                             200000, 0, &f, nullptr);
  if (FAILED(hr)) return nullptr;
  if (FAILED(s->client->GetService(__uuidof(IAudioCaptureClient), reinterpret_cast<void**>(&s->cap)))) return nullptr;
  if (FAILED(s->client->Start())) return nullptr;
  return s;
}

static void pull(Source& s) {
  UINT32 n = 0;
  while (SUCCEEDED(s.cap->GetNextPacketSize(&n)) && n) {
    BYTE* data;
    UINT32 frames;
    DWORD flags;
    if (FAILED(s.cap->GetBuffer(&data, &frames, &flags, nullptr, nullptr))) return void(s.dead = true);
    const float* f = reinterpret_cast<const float*>(data);
    if (flags & AUDCLNT_BUFFERFLAGS_SILENT)
      s.buf.insert(s.buf.end(), size_t(frames) * CH, 0.f);
    else
      s.buf.insert(s.buf.end(), f, f + size_t(frames) * CH);
    s.cap->ReleaseBuffer(frames);
  }
  if (s.buf.size() > MAX_BUF) s.buf.erase(s.buf.begin(), s.buf.end() - MAX_BUF);
}

// ---------- quem estÃ¡ tocando som (modo tela) ----------
struct Proc {
  DWORD parent;
  std::wstring exe;
};
static std::map<DWORD, Proc> processes() {
  std::map<DWORD, Proc> m;
  HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  if (snap == INVALID_HANDLE_VALUE) return m;
  PROCESSENTRY32W e = {sizeof(e)};
  for (BOOL ok = Process32FirstW(snap, &e); ok; ok = Process32NextW(snap, &e)) {
    std::wstring exe = e.szExeFile;
    for (auto& c : exe) c = towlower(c);
    m[e.th32ProcessID] = {e.th32ParentProcessID, exe};
  }
  CloseHandle(snap);
  return m;
}
// programas de chamada de voz: o som deles Ã© a voz dos amigos
static bool voiceApp(const std::wstring& exe) {
  static const wchar_t* names[] = {L"discord", L"teamspeak", L"ts3client", L"skype", L"zoom", L"slack", L"teams",
                                   L"ms-teams", L"mumble", L"guilded", L"element", L"whatsapp", L"telegram",
                                   L"signal", L"viber", L"vesktop", L"webcord", L"legcord", L"armcord", L"janjahaters"};
  for (auto n : names)
    if (exe.rfind(n, 0) == 0) return true;
  return false;
}
// sobe pelos pais (cuidando de ids reaproveitados que formam ciclos)
template <class F>
static bool anyAncestor(const std::map<DWORD, Proc>& ps, DWORD pid, F test) {
  std::set<DWORD> seen;
  while (pid && seen.insert(pid).second) {
    auto it = ps.find(pid);
    if (it == ps.end()) return false;
    if (test(pid, it->second)) return true;
    pid = it->second.parent;
  }
  return false;
}
static std::set<DWORD> soundPids() {
  std::set<DWORD> out;
  IMMDeviceEnumerator* en = nullptr;
  if (FAILED(CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator),
                              reinterpret_cast<void**>(&en))))
    return out;
  IMMDeviceCollection* devs = nullptr;
  if (SUCCEEDED(en->EnumAudioEndpoints(eRender, DEVICE_STATE_ACTIVE, &devs))) {
    UINT nd = 0;
    devs->GetCount(&nd);
    for (UINT d = 0; d < nd; d++) {
      IMMDevice* dev = nullptr;
      IAudioSessionManager2* mgr = nullptr;
      IAudioSessionEnumerator* list = nullptr;
      if (SUCCEEDED(devs->Item(d, &dev)) &&
          SUCCEEDED(dev->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, nullptr, reinterpret_cast<void**>(&mgr))) &&
          SUCCEEDED(mgr->GetSessionEnumerator(&list))) {
        int n = 0;
        list->GetCount(&n);
        for (int i = 0; i < n; i++) {
          IAudioSessionControl* c = nullptr;
          IAudioSessionControl2* c2 = nullptr;
          if (SUCCEEDED(list->GetSession(i, &c)) &&
              SUCCEEDED(c->QueryInterface(__uuidof(IAudioSessionControl2), reinterpret_cast<void**>(&c2)))) {
            DWORD pid = 0;
            AudioSessionState st;
            if (c2->IsSystemSoundsSession() != S_OK && SUCCEEDED(c2->GetProcessId(&pid)) && pid &&
                SUCCEEDED(c2->GetState(&st)) && st != AudioSessionStateExpired)
              out.insert(pid);
          }
          if (c2) c2->Release();
          if (c) c->Release();
        }
      }
      if (list) list->Release();
      if (mgr) mgr->Release();
      if (dev) dev->Release();
    }
    devs->Release();
  }
  en->Release();
  return out;
}
// os pids a capturar: quem toca som, menos o app, apps de voz e quem jÃ¡ entra pela Ã¡rvore de um pai
static std::set<DWORD> screenTargets(DWORD self) {
  auto ps = processes();
  std::set<DWORD> raw;
  for (DWORD pid : soundPids()) {
    if (anyAncestor(ps, pid, [&](DWORD p, const Proc& pr) { return p == self || voiceApp(pr.exe); })) continue;
    raw.insert(pid);
  }
  std::set<DWORD> out;
  for (DWORD pid : raw) {
    DWORD parent = ps.count(pid) ? ps[pid].parent : 0;
    if (!anyAncestor(ps, parent, [&](DWORD p, const Proc&) { return raw.count(p) > 0; })) out.insert(pid);
  }
  return out;
}

int wmain(int argc, wchar_t** argv) {
  if (argc < 4) {
    fwprintf(stderr, L"uso: janja-sysaudio window|screen <hwnd> <pid-do-app>\n");
    return 2;
  }
  bool screen = wcscmp(argv[1], L"screen") == 0;
  HWND hwnd = reinterpret_cast<HWND>(static_cast<INT_PTR>(_wcstoui64(argv[2], nullptr, 10)));
  DWORD self = wcstoul(argv[3], nullptr, 10);
  CoInitializeEx(nullptr, COINIT_MULTITHREADED);
  _setmode(_fileno(stdout), _O_BINARY);
  std::thread([] {
    char b[64];
    while (fread(b, 1, sizeof b, stdin) > 0) {
    }
    running = false;
  }).detach();

  std::map<DWORD, std::unique_ptr<Source>> sources;
  std::set<DWORD> failed;
  auto want = [&](const std::set<DWORD>& pids) {
    for (auto it = sources.begin(); it != sources.end();) {
      if (!pids.count(it->first) || it->second->dead)
        it = sources.erase(it);
      else
        ++it;
    }
    for (DWORD pid : pids) {
      if (sources.count(pid) || failed.count(pid)) continue;
      if (auto s = openSource(pid, false)) {
        sources[pid] = std::move(s);
        fwprintf(stderr, L"+%lu\n", pid); // para o log: quem entrou na mistura
        fflush(stderr);
      } else
        failed.insert(pid);
    }
  };
  if (!screen) {
    DWORD pid = 0;
    if (!IsWindow(hwnd) || !GetWindowThreadProcessId(hwnd, &pid) || !pid) {
      fwprintf(stderr, L"janela nÃ£o encontrada\n");
      return 3;
    }
    want({pid});
    if (sources.empty()) {
      fwprintf(stderr, L"nÃ£o deu para capturar o processo %lu\n", pid);
      return 4;
    }
  } else {
    // o Windows sem process loopback falha aqui, e o app volta para a captura antiga
    auto probe = openSource(self, true);
    if (!probe) {
      fwprintf(stderr, L"process loopback indisponÃ­vel\n");
      return 4;
    }
    probe.reset();
    want(screenTargets(self));
  }
  fwprintf(stderr, L"ok\n");
  fflush(stderr);

  LARGE_INTEGER freq, t0, now;
  QueryPerformanceFrequency(&freq);
  QueryPerformanceCounter(&t0);
  long long written = 0, lastScan = 0;
  std::vector<float> out(size_t(BLOCK) * CH);
  timeBeginPeriod(1);
  while (running) {
    Sleep(2);
    for (auto& [pid, s] : sources) pull(*s);
    QueryPerformanceCounter(&now);
    long long due = (now.QuadPart - t0.QuadPart) * RATE / freq.QuadPart;
    if (due - written > RATE) written = due - BLOCK; // o PC travou: nÃ£o tenta recuperar um segundo de atraso
    while (due - written >= BLOCK) {
      std::fill(out.begin(), out.end(), 0.f);
      for (auto& [pid, s] : sources) {
        size_t n = std::min(out.size(), s->buf.size());
        for (size_t i = 0; i < n; i++) out[i] += s->buf[i];
        s->buf.erase(s->buf.begin(), s->buf.begin() + n);
      }
      for (auto& x : out) x = x > 1.f ? 1.f : x < -1.f ? -1.f : x;
      if (fwrite(out.data(), sizeof(float), out.size(), stdout) != out.size()) running = false;
      fflush(stdout);
      written += BLOCK;
    }
    // modo tela: programas que comeÃ§am ou param de tocar som entram e saem da mistura
    if (screen && due - lastScan > RATE * 2) {
      lastScan = due;
      if (failed.size() > 64) failed.clear();
      want(screenTargets(self));
    }
  }
  timeEndPeriod(1);
  sources.clear();
  CoUninitialize();
  return 0;
}
