import { joinRoom, selfId } from 'trystero';
import { animate, stagger } from 'motion';
import { loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import {
  createElement,
  AudioLines,
  BadgeCheck,
  Bot,
  LogOut,
  SlidersHorizontal,
  CircleX,
  Copy,
  Disc3,
  Download,
  Drum,
  Eye,
  EyeOff,
  File as FileIcon,
  LoaderCircle,
  MessageSquare,
  Paperclip,
  Search,
  Upload,
  FaceSlightlySmilingPlus,
  Hash,
  HeadphoneOff,
  Headphones,
  Link,
  ListMusic,
  Maximize,
  Mic,
  MicOff,
  Minus,
  Pause,
  Pencil,
  Phone,
  PhoneOff,
  Play,
  Plus,
  ScreenShare,
  ScreenShareOff,
  Settings,
  SkipBack,
  SkipForward,
  Square,
  Trash2,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide';

// ============================================================ utilidades
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('toca:' + k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('toca:' + k, JSON.stringify(v));
    } catch {}
  },
  del(k) {
    try {
      localStorage.removeItem('toca:' + k);
    } catch {}
  },
};
const randId = (n = 8) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const COLORS = ['#ff7a1a', '#4fd18b', '#3aa8f0', '#b07cff', '#f05454', '#f2c94c', '#ff6fb5', '#2ec4b6'];
const EMOJIS = ['😂', '🤣', '😭', '😎', '🤔', '😡', '🥲', '😏', '👍', '👎', '❤️', '🔥', '💀', '🎉', '👀', '🙏', '💯', '🤡', '🫡', '👏', '🍕', '🎮', '🎧', '🎵'];
const isDesktop = !!window.desk;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 32);
const cleanColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : COLORS[0]);
function fmtTime(ms) {
  if (!isFinite(ms) || ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ----- ícones (lucide) -----
const ICONS = {
  'audio-lines': AudioLines,
  copy: Copy,
  'disc-3': Disc3,
  'face-slightly-smiling-plus': FaceSlightlySmilingPlus,
  hash: Hash,
  'headphone-off': HeadphoneOff,
  headphones: Headphones,
  link: Link,
  'list-music': ListMusic,
  maximize: Maximize,
  mic: Mic,
  'mic-off': MicOff,
  minus: Minus,
  pause: Pause,
  pencil: Pencil,
  phone: Phone,
  'phone-off': PhoneOff,
  play: Play,
  plus: Plus,
  'screen-share': ScreenShare,
  'screen-share-off': ScreenShareOff,
  settings: Settings,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  square: Square,
  'trash-2': Trash2,
  'user-plus': UserPlus,
  users: Users,
  'volume-2': Volume2,
  'badge-check': BadgeCheck,
  bot: Bot,
  'log-out': LogOut,
  sliders: SlidersHorizontal,
  'circle-x': CircleX,
  'message-square': MessageSquare,
  'volume-x': VolumeX,
  download: Download,
  drum: Drum,
  eye: Eye,
  'eye-off': EyeOff,
  file: FileIcon,
  loader: LoaderCircle,
  paperclip: Paperclip,
  search: Search,
  upload: Upload,
  x: X,
};
function icon(name, cls = '') {
  return createElement(ICONS[name] || Square, { class: ('lucide ' + cls).trim() });
}
function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach((i) => i.replaceWith(icon(i.dataset.icon, i.className)));
}
function setIcon(btn, name) {
  const old = btn.querySelector('svg.lucide');
  const next = icon(name, old?.getAttribute('class').replace('lucide', '').trim());
  old ? old.replaceWith(next) : btn.prepend(next);
}

// ----- animações (motion) -----
const EASE = [0.2, 0.8, 0.2, 1];
const popIn = (els, opts = {}) => animate(els, { opacity: [0, 1], y: [6, 0] }, { duration: 0.22, ease: EASE, ...opts });
const springIn = (els, opts = {}) => animate(els, { opacity: [0, 1], scale: [0.9, 1] }, { type: 'spring', stiffness: 380, damping: 26, ...opts });
function openDialog(dlg) {
  dlg.showModal();
  animate(dlg, { opacity: [0, 1], scale: [0.96, 1], y: [10, 0] }, { duration: 0.22, ease: EASE });
}
async function closeDialog(dlg) {
  await animate(dlg, { opacity: 0, scale: 0.97 }, { duration: 0.12 });
  dlg.close();
  dlg.style.opacity = '';
  dlg.style.transform = '';
}

// uid: mostra a foto da conta Google, se a pessoa entrou com Google (só fotos conferidas)
function avatar(name, color, cls = '', uid) {
  const a = el('span', 'avatar ' + cls, (name || '?').trim()[0] || '?');
  a.style.background = color;
  const pic = uid && googleOf(uid)?.picture;
  if (pic) {
    const img = el('img');
    img.referrerPolicy = 'no-referrer';
    img.src = pic;
    img.onerror = () => img.remove();
    a.append(img);
  }
  return a;
}
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  if (t.hidden) {
    t.hidden = false;
    animate(t, { opacity: [0, 1], y: [12, 0] }, { duration: 0.2, ease: EASE });
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(async () => {
    await animate(t, { opacity: 0, y: 8 }, { duration: 0.15 });
    t.hidden = true;
  }, 3500);
}

// ============================================================ estado local
const me = store.get('profile', { id: randId(16), name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] });
const settings = Object.assign(
  { mic: '', out: '', noise: 'strong', echo: true, sounds: true, musicVol: 0.6, musicMuted: false, sndVol: 0.7, volumes: {},
    stream: { preset: 'std', res: 1080, fps: 30, rate: 0, codec: 'auto', mode: 'balanced', audio: false } },
  store.get('settings', {}),
);
if (typeof settings.noise === 'boolean') settings.noise = settings.noise ? 'strong' : 'off'; // versão 1.0 guardava sim/não
const saveSettings = () => store.set('settings', settings);
// contas Google conferidas dos amigos (uid -> { email, picture }), lembradas para as mensagens antigas
const googleUsers = store.get('googleUsers', {});
const googleOf = (uid) => (uid === me.id ? me.google : googleUsers[uid]) || null;
let R = store.get('room', null); // { key, hash }
const S = { view: null, unread: new Set(), callUnread: 0, firstRender: true };

// ============================================================ sons
let actx;
function audioCtx() {
  actx ||= new AudioContext();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function beep(freqs, dur = 0.09, vol = 0.1) {
  if (!settings.sounds) return;
  try {
    const ctx = audioCtx();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * dur;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    });
  } catch {}
}
const sfx = {
  join: () => beep([523, 784]),
  leave: () => beep([784, 523]),
  msg: () => beep([988], 0.06, 0.06),
  mute: () => beep([440], 0.05),
  unmute: () => beep([660], 0.05),
};

// ============================================================ dados sincronizados
// Tudo que o grupo compartilha é um "registro" com versão (o mais novo vence):
//   grp  nome do grupo            ch  canal (texto/voz)       msg  mensagem
//   q    música na fila de um canal de voz                   pb   o que está tocando num canal de voz
//   snd  som do soundboard (o áudio em si vai pelo armazenamento de arquivos)
const KINDS = new Set(['grp', 'ch', 'msg', 'q', 'pb', 'snd']);
const recs = new Map();
let clock = 0;
const tick = () => (clock = Math.max(Date.now(), clock + 1));
const newer = (a, b) => !b || a.v > b.v || (a.v === b.v && String(a.by) > String(b.by));

function validRec(r) {
  if (!r || typeof r !== 'object' || !KINDS.has(r.k) || typeof r.id !== 'string' || r.id.length > 80 || !Number.isFinite(r.v)) return false;
  return JSON.stringify(r).length < 8000;
}
function seed() {
  merge(
    [
      { k: 'grp', id: 'grp', name: 'Grupo', v: 1, by: '' },
      { k: 'ch', id: 'c:geral', name: 'geral', type: 'text', order: 0, v: 1, by: '' },
      { k: 'ch', id: 'c:sala', name: 'Sala da galera', type: 'voice', order: 1, v: 1, by: '' },
    ],
    true,
  );
}
function put(rec) {
  rec.v = tick();
  rec.by = me.id;
  merge([rec]);
  A.recs?.send([rec]);
}
function merge(list, quiet) {
  const changed = [];
  for (const r of list) {
    if (!validRec(r)) continue;
    const cur = recs.get(r.id);
    if (!newer(r, cur)) continue;
    if (cur?.k === 'msg' && cur.uid !== r.uid) continue; // só o autor muda a própria mensagem
    recs.set(r.id, r);
    clock = Math.max(clock, Math.min(r.v, Date.now() + 60_000));
    changed.push(r);
  }
  if (!changed.length) return;
  persist();
  if (!quiet) onRecsChanged(changed);
}
let persistTimer;
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => store.set('recs:' + R.hash, [...recs.values()]), 400);
}
const all = (k) => [...recs.values()].filter((r) => r.k === k && !r.del);
const channels = (type) => all('ch').filter((c) => c.type === type).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
const channel = (id) => {
  const c = recs.get(id);
  return c?.k === 'ch' && !c.del ? c : null;
};
const messagesOf = (ch) => all('msg').filter((m) => m.ch === ch).sort((a, b) => a.ts - b.ts);
const groupName = () => recs.get('grp')?.name || 'Grupo';

function onRecsChanged(list) {
  const kinds = new Set(list.map((r) => r.k));
  if (kinds.has('grp') || kinds.has('ch')) {
    if (S.view && !channel(S.view)) openView(channels('text')[0]?.id);
    renderSidebar();
    renderHeader();
  }
  if (kinds.has('msg')) {
    const fresh = list.filter((r) => r.k === 'msg');
    const boxes = chatBoxes();
    const rerender = new Set();
    for (const m of fresh) {
      typingOf.delete(m.uid);
      const shownIn = boxes.filter((b) => b.ch === m.ch);
      for (const { box } of shownIn) {
        const last = [...box.querySelectorAll(':scope > .msg')].pop()?.dataset.ts;
        if (m.del || box.querySelector(`[data-id="${m.id}"]`)) rerender.add(box);
        else if (last && m.ts >= Number(last)) appendMessage(m, box);
        else rerender.add(box);
      }
      if (m.del || m.uid === me.id) continue;
      const isCall = channel(m.ch)?.type === 'voice';
      if (isCall && m.ch === callChatCh() && currentTab !== 'chat') S.callUnread++;
      else if (!isCall && !shownIn.length) S.unread.add(m.ch);
    }
    for (const box of rerender) renderChat(box, boxes.find((b) => b.box === box).ch, true);
    renderCallBadge();
    const notifyMsgs = fresh.filter((m) => !m.del && m.uid !== me.id && Date.now() - m.ts < 60_000);
    if (notifyMsgs.length && (!document.hasFocus() || notifyMsgs.some((m) => !boxes.some((b) => b.ch === m.ch)) || (currentTab !== 'chat' && notifyMsgs.some((m) => m.ch === callChatCh())))) {
      sfx.msg();
      window.desk?.flash();
    }
    renderSidebar();
  }
  if (kinds.has('q') || kinds.has('pb')) {
    syncMusic();
    renderMusic();
    renderNowPlaying();
  }
  if (kinds.has('snd')) renderSounds();
}

// ============================================================ rede P2P
let room = null;
const peers = new Map(); // peerId -> { pid, user, voice, media, audios }
let A = {};
const sha256 = async (s) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');

function ensurePeer(pid) {
  if (!peers.has(pid)) peers.set(pid, { pid, user: null, voice: null, media: {}, audios: new Map() });
  return peers.get(pid);
}
function myVoice() {
  return C.ch ? { ch: C.ch, muted: C.muted || !C.mic, deafened: C.deafened, streaming: !!C.screen, watch: [...C.watching] } : null;
}
const hiPayload = () => ({ user: { id: me.id, name: me.name, color: me.color, g: me.google?.idToken }, voice: myVoice() });

// o login Google do amigo é conferido no processo principal (assinatura do Google + ligado ao uid dele)
async function checkGoogle(p, token) {
  const uid = p.user.id;
  if (typeof token !== 'string' || !window.desk?.googleVerify) {
    if (!token && googleUsers[uid] && p.gToken) {
      delete googleUsers[uid]; // desconectou a conta
      store.set('googleUsers', googleUsers);
      p.gToken = null;
      renderPresence();
    }
    return;
  }
  if (p.gToken === token) return;
  p.gToken = token;
  const res = await window.desk.googleVerify(token, uid).catch(() => null);
  if (!res) return;
  const prev = googleUsers[uid];
  googleUsers[uid] = { email: res.email, picture: res.picture };
  store.set('googleUsers', googleUsers);
  if (prev?.picture !== res.picture || prev?.email !== res.email) {
    renderPresence();
    for (const box of chatBoxes()) renderChat(box.box, box.ch, true);
  }
}
const sendHi = () => A.hi?.send(hiPayload());

function sendRecs(list, target) {
  for (let i = 0; i < list.length; i += 300) A.recs.send(list.slice(i, i + 300), { target });
}

function connectRoom() {
  room = joinRoom({ appId: 'toca-voice-p2p-v2', password: R.key }, R.hash, {
    onJoinError: (d) => console.warn('falha ao conectar com um amigo', d),
  });
  A = {
    hi: room.makeAction('hi'),
    sum: room.makeAction('sum'),
    recs: room.makeAction('recs'),
    typing: room.makeAction('typing'),
    freq: room.makeAction('freq'), // pedido de arquivo
    fdat: room.makeAction('fdat'), // arquivo (ou "não tenho")
    sndp: room.makeAction('sndp'), // tocar som do soundboard
  };
  room.onPeerJoin = (pid) => {
    ensurePeer(pid);
    A.hi.send(hiPayload(), { target: pid });
    A.sum.send([...recs.values()].map((r) => [r.id, r.v]), { target: pid });
    setTimeout(retryMissingFiles, 3000);
  };
  A.freq.onMessage = async (d, { peerId }) => {
    if (typeof d?.id !== 'string' || !FILE_ID.test(d.id)) return;
    const blob = await blobGet(d.id);
    if (blob) A.fdat.send(blob, { target: peerId, metadata: { id: d.id, type: blob.type } });
    else A.fdat.send(new Uint8Array(0), { target: peerId, metadata: { id: d.id, miss: true } });
  };
  A.fdat.onMessage = (data, { metadata, peerId }) => onFileData(data, metadata, peerId);
  A.fdat.onReceiveProgress = (pct, { metadata }) => onFileProgress(metadata?.id, pct);
  A.sndp.onMessage = (d, { peerId }) => onRemoteSound(d, peerId);
  room.onPeerLeave = (pid) => {
    const p = peers.get(pid);
    if (!p) return;
    if (C.ch && p.voice?.ch === C.ch) sfx.leave();
    dropMedia(p);
    peers.delete(pid);
    C.sent.delete(pid);
    renderPresence();
  };
  A.hi.onMessage = (d, { peerId }) => onHi(peerId, d);
  // o amigo diz o que tem; eu mando o que ele não tem ou tem desatualizado
  A.sum.onMessage = (sum, { peerId }) => {
    if (!Array.isArray(sum)) return;
    const theirs = new Map(sum.filter((x) => Array.isArray(x)));
    const out = [...recs.values()].filter((r) => !(theirs.get(r.id) >= r.v));
    if (out.length) sendRecs(out, peerId);
  };
  A.recs.onMessage = (list) => Array.isArray(list) && merge(list);
  A.typing.onMessage = (d, { peerId }) => {
    const p = peers.get(peerId);
    if (!p?.user || typeof d?.ch !== 'string') return;
    typingOf.set(p.user.id, { name: p.user.name, ch: d.ch, until: Date.now() + 4000 });
    renderTyping();
  };
  room.onPeerStream = onPeerStream;
}

function onHi(pid, d) {
  const p = ensurePeer(pid);
  const wasIn = C.ch && p.voice?.ch === C.ch;
  const wasLive = wasIn && p.voice.streaming;
  p.user = { id: String(d?.user?.id || pid).slice(0, 64), name: cleanName(d?.user?.name) || 'Anônimo', color: cleanColor(d?.user?.color) };
  checkGoogle(p, d?.user?.g);
  const v = d?.voice;
  p.voice =
    v && typeof v.ch === 'string'
      ? {
          ch: v.ch,
          muted: !!v.muted,
          deafened: !!v.deafened,
          streaming: !!v.streaming,
          watch: Array.isArray(v.watch) ? v.watch.filter((x) => typeof x === 'string').slice(0, 12) : [],
        }
      : null;
  const isIn = C.ch && p.voice?.ch === C.ch;
  const isLive = isIn && p.voice.streaming;
  if (!wasIn && isIn) sfx.join();
  if (wasIn && !isIn) sfx.leave();
  if (!wasLive && isLive) toast(`${p.user.name} começou uma stream. Clique em Assistir para ver.`);
  if (!isLive && C.watching.delete(pid)) sendHi();
  if (!isIn) dropMedia(p);
  else if (!isLive && p.media.screen) {
    delete p.media.screen;
    detachAudio(p, 'screen');
  }
  syncMedia();
  renderPresence();
}
function watchStream(pid) {
  C.watching.add(pid);
  C.focus = pid;
  sendHi();
  renderStage();
  renderSidebar();
}
function unwatchStream(pid) {
  C.watching.delete(pid);
  const p = peers.get(pid);
  if (p?.media.screen) {
    delete p.media.screen;
    detachAudio(p, 'screen');
  }
  sendHi();
  renderStage();
  renderSidebar();
}

// ============================================================ arquivos P2P (anexos e sons)
// Cada arquivo fica no IndexedDB de quem tem. Quem precisa pede aos amigos online,
// começando pelo dono, e guarda a cópia para repassar depois.
const FILE_ID = /^f:[0-9a-f]{24}$/;
const MAX_ATTACH = 25 * 1024 * 1024;
const blobMem = new Map();
const blobUrls = new Map();
let idbPromise;
function idb() {
  return (idbPromise ||= new Promise((resolve, reject) => {
    const req = indexedDB.open('toca-files', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('f');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}
async function blobGet(id) {
  if (blobMem.has(id)) return blobMem.get(id);
  try {
    const db = await idb();
    const blob = await new Promise((resolve) => {
      const q = db.transaction('f').objectStore('f').get(id);
      q.onsuccess = () => resolve(q.result || null);
      q.onerror = () => resolve(null);
    });
    if (blob && blob.size < 8e6) blobMem.set(id, blob);
    return blob;
  } catch {
    return null;
  }
}
async function blobPut(id, blob) {
  if (blob.size < 8e6) blobMem.set(id, blob);
  try {
    const db = await idb();
    await new Promise((resolve, reject) => {
      const t = db.transaction('f', 'readwrite');
      t.objectStore('f').put(blob, id);
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  } catch (err) {
    console.warn('não salvei o arquivo', err);
  }
}

const fileWait = new Map(); // id -> pedido em andamento
const fileFetches = new Map(); // id -> Promise<Blob|null>
const missingFiles = new Set();
function getFile(id, ownerUid) {
  if (fileFetches.has(id)) return fileFetches.get(id);
  const p = (async () => {
    const local = await blobGet(id);
    if (local) return local;
    const candidates = [...peers.values()].filter((x) => x.user).sort((a, b) => (b.user.id === ownerUid) - (a.user.id === ownerUid));
    for (const peer of candidates) {
      if (!peers.has(peer.pid)) continue;
      const blob = await askPeer(id, peer.pid);
      if (blob) {
        await blobPut(id, blob);
        missingFiles.delete(id);
        return blob;
      }
    }
    missingFiles.add(id);
    return null;
  })();
  fileFetches.set(id, p);
  p.then((b) => !b && fileFetches.delete(id)); // dá para tentar de novo quando alguém entrar
  return p;
}
function askPeer(id, pid) {
  return new Promise((resolve) => {
    const w = { pid, timer: null };
    w.finish = (blob) => {
      clearTimeout(w.timer);
      fileWait.delete(id);
      resolve(blob);
    };
    w.arm = () => {
      clearTimeout(w.timer);
      w.timer = setTimeout(() => w.finish(null), 15_000);
    };
    fileWait.set(id, w);
    w.arm();
    A.freq.send({ id }, { target: pid });
  });
}
function onFileData(data, meta, peerId) {
  const w = meta && fileWait.get(meta.id);
  if (!w || w.pid !== peerId) return;
  if (meta.miss) return w.finish(null);
  w.finish(new Blob([data], { type: String(meta.type || '').slice(0, 100) }));
}
function onFileProgress(id, pct) {
  fileWait.get(id)?.arm(); // ainda chegando: estende o prazo
  $$(`[data-wait="${id}"] .pct`).forEach((e) => (e.textContent = Math.round(pct * 100) + '%'));
}
async function fileUrl(id, ownerUid) {
  if (blobUrls.has(id)) return blobUrls.get(id);
  const blob = await getFile(id, ownerUid);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  blobUrls.set(id, url);
  return url;
}
function retryMissingFiles() {
  if (!missingFiles.size) return;
  missingFiles.clear();
  if (channel(S.view)?.type === 'text') renderMessages(true);
  renderSounds();
}
function fmtSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

// ============================================================ voz
const C = {
  ch: null, // canal de voz em que estou
  mic: null,
  screen: null,
  muted: store.get('muted', false),
  deafened: false,
  sent: new Map(), // peerId -> Map(tipo -> stream enviada)
  meters: new Map(),
  speaking: new Set(),
  watching: new Set(), // peerIds cujas streams eu escolhi assistir
  focus: null,
};

function getRawMic(deviceId = settings.mic, opts = settings) {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: opts.echo,
      noiseSuppression: opts.noise !== 'off',
      autoGainControl: true,
    },
  });
}

// Supressão "forte": o áudio do mic passa pelo RNNoise (rede neural pequena, roda no PC)
// antes de ir para os amigos. Devolve o stream tratado e uma função para desligar tudo.
let micCtx;
let rnnoiseWasm;
let rnnoiseLoaded;
async function processMic(raw, opts = settings) {
  const stopRaw = () => raw.getTracks().forEach((t) => t.stop());
  if (opts.noise !== 'strong') return { stream: raw, stop: stopRaw };
  micCtx ||= new AudioContext({ sampleRate: 48000 }); // o RNNoise trabalha em 48 kHz
  if (micCtx.state === 'suspended') await micCtx.resume();
  rnnoiseLoaded ||= Promise.all([
    loadRnnoise({ url: 'vendor/rnnoise.wasm', simdUrl: 'vendor/rnnoise_simd.wasm' }).then((w) => (rnnoiseWasm = w)),
    micCtx.audioWorklet.addModule('vendor/rnnoiseWorklet.js'),
  ]).catch((err) => {
    rnnoiseLoaded = null;
    throw err;
  });
  await rnnoiseLoaded;
  const src = micCtx.createMediaStreamSource(raw);
  const node = new RnnoiseWorkletNode(micCtx, { wasmBinary: rnnoiseWasm, maxChannels: 1 });
  const dest = micCtx.createMediaStreamDestination();
  dest.channelCount = 1;
  src.connect(node).connect(dest);
  return {
    stream: dest.stream,
    stop() {
      stopRaw();
      src.disconnect();
      node.disconnect();
      node.destroy();
    },
  };
}
async function getMic(deviceId = settings.mic, opts = settings) {
  const raw = await getRawMic(deviceId, opts).catch(() => getRawMic('', opts));
  try {
    return await processMic(raw, opts);
  } catch (err) {
    console.warn('supressão forte indisponível, usando a básica', err);
    return { stream: raw, stop: () => raw.getTracks().forEach((t) => t.stop()) };
  }
}

async function joinVoice(ch) {
  if (C.ch === ch) return;
  if (C.ch) leaveVoice(true);
  try {
    const m = await getMic();
    C.mic = m.stream;
    C.micStop = m.stop;
  } catch {
    C.mic = null;
    C.micStop = null;
    toast('Sem microfone: você entrou só para ouvir');
  }
  C.ch = ch;
  applyMicEnabled();
  if (C.mic) meter('me', C.mic);
  sfx.join();
  sendHi();
  syncMedia();
  syncMusic();
  renderPresence();
  renderMusic();
  renderSounds();
  renderCallChat();
}

function leaveVoice(switching) {
  if (!C.ch) return;
  stopStream(false);
  C.ch = null;
  C.watching.clear();
  syncMedia();
  C.micStop?.();
  C.mic = null;
  C.micStop = null;
  C.meters.clear();
  C.speaking.clear();
  for (const p of peers.values()) dropMedia(p);
  if (!switching) {
    sfx.leave();
    sendHi();
    syncMusic();
    renderPresence();
    renderMusic();
    renderSounds();
    renderCallChat();
  }
}

function applyMicEnabled() {
  C.mic?.getAudioTracks().forEach((t) => (t.enabled = !C.muted && !C.deafened));
}

// cada amigo no mesmo canal de voz recebe exatamente os streams certos
function syncMedia() {
  if (!room) return;
  for (const p of peers.values()) {
    const both = !!C.ch && p.voice?.ch === C.ch;
    // a tela só vai para quem clicou em "Assistir"
    const out = both ? { mic: C.mic, screen: p.voice.watch?.includes(selfId) ? C.screen : null } : {};
    if (!C.sent.has(p.pid)) C.sent.set(p.pid, new Map());
    const sent = C.sent.get(p.pid);
    for (const kind of ['mic', 'screen']) {
      const want = out[kind] || null;
      const has = sent.get(kind);
      if (has && has !== want) {
        try {
          room.removeStream(has, { target: p.pid });
        } catch {}
        sent.delete(kind);
      }
      if (want && !sent.has(kind)) {
        room.addStream(want, { target: p.pid, metadata: { kind } });
        sent.set(kind, want);
      }
    }
    if (!both) dropMedia(p);
  }
  setTimeout(tuneSenders, 1500);
  setTimeout(tuneSenders, 5000);
}

function peerConnections() {
  const pcs = room?.getPeers() || {};
  return pcs instanceof Map ? [...pcs.entries()] : Object.entries(pcs);
}
function tuneSenders() {
  if (!room) return;
  for (const [, pc] of peerConnections()) {
    for (const sender of pc.getSenders?.() || []) {
      const t = sender.track;
      if (!t) continue;
      const params = sender.getParameters();
      if (!params.encodings?.length) continue;
      if (C.screen?.getVideoTracks().includes(t)) {
        const q = streamTarget();
        params.encodings[0].maxBitrate = q.bitrate;
        params.encodings[0].maxFramerate = q.fps;
        params.encodings[0].scaleResolutionDownBy = 1;
        params.degradationPreference = { motion: 'maintain-framerate', detail: 'maintain-resolution', balanced: 'balanced' }[q.mode];
      } else if (C.mic?.getAudioTracks().includes(t)) params.encodings[0].maxBitrate = 64_000;
      else continue;
      sender.setParameters(params).catch(() => {
        delete params.degradationPreference; // versões que não aceitam esse campo
        sender.setParameters(params).catch(() => {});
      });
    }
  }
}

// Codec escolhido: a stream de tela entra na conexão com ele em primeiro lugar na negociação
const CODEC_MIME = { h264: 'video/H264', vp8: 'video/VP8', vp9: 'video/VP9', av1: 'video/AV1' };
const nativeAddTrack = RTCPeerConnection.prototype.addTrack;
RTCPeerConnection.prototype.addTrack = function (track, ...streams) {
  const sender = nativeAddTrack.call(this, track, ...streams);
  const mime = CODEC_MIME[settings.stream.codec];
  if (mime && track.kind === 'video' && C.screen?.getVideoTracks().includes(track)) {
    try {
      const caps = RTCRtpReceiver.getCapabilities('video')?.codecs || [];
      const first = caps.filter((c) => c.mimeType === mime);
      const tr = this.getTransceivers().find((x) => x.sender === sender);
      if (first.length && tr?.setCodecPreferences) tr.setCodecPreferences([...first, ...caps.filter((c) => c.mimeType !== mime)]);
    } catch (err) {
      console.warn('codec', err);
    }
  }
  return sender;
};

function onPeerStream(stream, pid, meta) {
  const p = ensurePeer(pid);
  const kind = meta?.kind === 'screen' ? 'screen' : 'mic';
  if (kind === 'screen' && !C.watching.has(pid)) return;
  p.media[kind] = stream;
  if (stream.getAudioTracks().length) attachAudio(p, kind, stream);
  if (kind === 'mic') meter(pid, stream);
  const gone = () => {
    if (stream.getTracks().some((t) => t.readyState === 'live')) return;
    if (p.media[kind] === stream) {
      delete p.media[kind];
      detachAudio(p, kind);
      renderStage();
    }
  };
  stream.addEventListener('removetrack', gone);
  stream.getTracks().forEach((t) => t.addEventListener('ended', gone));
  renderStage();
}
function attachAudio(p, kind, stream) {
  detachAudio(p, kind);
  const a = new Audio();
  a.autoplay = true;
  a.srcObject = stream;
  if (settings.out && a.setSinkId) a.setSinkId(settings.out).catch(() => {});
  p.audios.set(kind, a);
  applyVolumes();
  a.play().catch(() => {});
}
function detachAudio(p, kind) {
  const a = p.audios.get(kind);
  if (!a) return;
  a.pause();
  a.srcObject = null;
  p.audios.delete(kind);
}
function dropMedia(p) {
  for (const kind of [...p.audios.keys()]) detachAudio(p, kind);
  p.media = {};
  C.meters.delete(p.pid);
  C.speaking.delete(p.pid);
}
function applyVolumes() {
  for (const p of peers.values()) {
    for (const a of p.audios.values()) {
      a.volume = clamp(settings.volumes[p.user?.id] ?? 1, 0, 1);
      a.muted = C.deafened || !C.ch;
    }
  }
  applyMusicVolume();
}

function meter(key, stream) {
  try {
    const ctx = audioCtx();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(an);
    C.meters.set(key, { an, buf: new Uint8Array(an.fftSize) });
  } catch {}
}
function level({ an, buf }) {
  an.getByteTimeDomainData(buf);
  let sum = 0;
  for (const v of buf) sum += (v - 128) ** 2;
  return Math.sqrt(sum / buf.length);
}
setInterval(() => {
  if (!C.ch) return;
  let changed = false;
  for (const [key, m] of C.meters) {
    const talking = level(m) > 4 && !(key === 'me' && (C.muted || C.deafened));
    if (talking !== C.speaking.has(key)) {
      talking ? C.speaking.add(key) : C.speaking.delete(key);
      changed = true;
    }
  }
  if (changed) $$('[data-speak]').forEach((e) => e.classList.toggle('speaking', C.speaking.has(e.dataset.speak)));
}, 100);

function toggleMute() {
  if (C.deafened) {
    C.deafened = false;
    C.muted = false;
  } else C.muted = !C.muted;
  store.set('muted', C.muted);
  applyMicEnabled();
  applyVolumes();
  C.muted ? sfx.mute() : sfx.unmute();
  sendHi();
  renderPresence();
}
function toggleDeafen() {
  C.deafened = !C.deafened;
  applyMicEnabled();
  applyVolumes();
  C.deafened ? sfx.mute() : sfx.unmute();
  sendHi();
  renderPresence();
}
$('#btnMute').onclick = $('#ctlMute').onclick = toggleMute;
$('#btnDeafen').onclick = $('#ctlDeafen').onclick = toggleDeafen;
$('#vbLeave').onclick = () => leaveVoice();
$('#ctlCall').onclick = () => (C.ch === S.view ? leaveVoice() : joinVoice(S.view));
$('#ctlMusic').onclick = () => selectTab('music');

// ============================================================ stream de tela
// ----- qualidade da stream -----
const STREAM_PRESETS = {
  light: { res: 720, fps: 30, rate: 0, codec: 'auto', mode: 'balanced' },
  std: { res: 1080, fps: 30, rate: 0, codec: 'auto', mode: 'balanced' },
  games: { res: 1080, fps: 60, rate: 0, codec: 'auto', mode: 'motion' },
  text: { res: 1080, fps: 15, rate: 0, codec: 'auto', mode: 'detail' },
  max: { res: 1440, fps: 60, rate: 0, codec: 'auto', mode: 'motion' },
};
const RES_OPTS = [
  [480, '480p'],
  [720, '720p (HD)'],
  [1080, '1080p (Full HD)'],
  [1440, '1440p (2K)'],
  [2160, '2160p (4K)'],
  [0, 'Original da tela'],
];
const FPS_OPTS = [5, 10, 15, 24, 30, 48, 60, 90, 120, 144];
const CODEC_OPTS = [
  ['h264', 'H.264 (leve, usa a placa de vídeo)'],
  ['vp8', 'VP8 (o mais compatível)'],
  ['vp9', 'VP9 (mais nítido, pesa mais)'],
  ['av1', 'AV1 (o mais eficiente, pesa bastante)'],
];
const CONTENT_HINT = { motion: 'motion', detail: 'detail', balanced: '' };

function codecOptions() {
  const have = new Set((window.RTCRtpReceiver?.getCapabilities?.('video')?.codecs || []).map((c) => c.mimeType));
  return [['auto', 'Automático'], ...CODEC_OPTS.filter(([k]) => have.has(CODEC_MIME[k]))];
}
function autoBitrate(q, w, h) {
  const perPixel = q.codec === 'vp9' || q.codec === 'av1' ? 0.045 : 0.07;
  return Math.round(clamp(w * h * q.fps * perPixel, 800_000, 30_000_000));
}
// o que a stream deve usar agora (a taxa automática sai da resolução real capturada)
function streamTarget(q = settings.stream) {
  const s = C.screen?.getVideoTracks()[0]?.getSettings?.() || {};
  const h = q.res ? Math.min(q.res, s.height || q.res) : s.height || 1080;
  const w = s.width && s.height ? Math.round((s.width / s.height) * h) : Math.round((h * 16) / 9);
  return { ...q, bitrate: q.rate ? Math.round(q.rate * 1_000_000) : autoBitrate(q, w, h) };
}
function videoConstraints(q) {
  const v = { frameRate: { ideal: q.fps, max: q.fps } };
  if (q.res) Object.assign(v, { height: { max: q.res }, width: { max: Math.round((q.res * 16) / 9) } });
  return v;
}

function fillSelect(sel, opts, value) {
  sel.replaceChildren(...opts.map(([v, label]) => new Option(label, v)));
  sel.value = String(value);
  if (sel.selectedIndex < 0) sel.selectedIndex = 0;
}
function readQualityForm() {
  return {
    preset: $('#sqPreset').value,
    res: Number($('#sqRes').value),
    fps: Number($('#sqFps').value),
    rate: Number($('#sqRate').value),
    codec: $('#sqCodec').value,
    mode: $('#sqMode').value,
    audio: $('#streamAudio').checked,
  };
}
function fillQualityForm(q) {
  $('#sqPreset').value = q.preset;
  fillSelect($('#sqRes'), RES_OPTS, q.res);
  fillSelect(
    $('#sqFps'),
    FPS_OPTS.map((f) => [f, f + ' fps']),
    q.fps,
  );
  fillSelect($('#sqCodec'), codecOptions(), q.codec);
  $('#sqMode').value = q.mode;
  $('#sqRate').value = q.rate;
  $('#streamAudio').checked = !!q.audio;
  renderRateLabel();
}
function renderRateLabel() {
  const q = readQualityForm();
  const h = q.res || 1080;
  $('#sqRateVal').textContent = q.rate ? `${q.rate} Mbps` : `Automático (~${(autoBitrate(q, Math.round((h * 16) / 9), h) / 1e6).toFixed(1)} Mbps)`;
}
$('#sqPreset').onchange = () => {
  const p = STREAM_PRESETS[$('#sqPreset').value];
  if (p) fillQualityForm({ ...readQualityForm(), ...p, preset: $('#sqPreset').value });
};
for (const id of ['#sqRes', '#sqFps', '#sqCodec', '#sqMode', '#sqRate']) {
  $(id).addEventListener('input', () => {
    const q = readQualityForm();
    const match = Object.entries(STREAM_PRESETS).find(([, p]) => p.res === q.res && p.fps === q.fps && p.rate === q.rate && p.codec === q.codec && p.mode === q.mode);
    $('#sqPreset').value = match ? match[0] : 'custom';
    renderRateLabel();
  });
}

// ----- seletor de tela / ajuste ao vivo -----
let pickedSource = null;
let streamSource = null; // fonte da stream atual (para reiniciar com outro codec)
let allSources = [];
let srcType = 'screen';
let sqAdjust = false;

function openStreamDlg(adjust) {
  sqAdjust = adjust;
  $('#streamDlgTitle').textContent = adjust ? 'Qualidade da stream' : 'Transmitir';
  $('#srcPick').hidden = adjust || !isDesktop;
  $('#btnGoLive').textContent = adjust ? 'Aplicar' : 'Transmitir';
  $('#btnGoLive').disabled = !adjust && isDesktop;
  $('#streamDlg [data-close]').textContent = adjust ? 'Fechar' : 'Cancelar';
  fillQualityForm(settings.stream);
  $('#sqLive').hidden = !adjust;
  openDialog($('#streamDlg'));
  if (adjust) startLiveStats();
}
async function openStreamPicker() {
  if (C.screen) return stopStream(true);
  if (!C.ch) return toast('Entre em um canal de voz para transmitir');
  pickedSource = null;
  openStreamDlg(false);
  if (!isDesktop) return; // modo navegador (testes): o navegador pergunta a tela
  $('#sources').replaceChildren(el('p', 'muted', 'Carregando…'));
  allSources = await window.desk.sources();
  renderSources(true);
}
$('#ctlStream').onclick = $('#vbStream').onclick = openStreamPicker;
$('#ctlStreamCfg').onclick = () => C.screen && openStreamDlg(true);
$$('.src-tab').forEach(
  (b) =>
    (b.onclick = () => {
      srcType = b.dataset.src;
      $$('.src-tab').forEach((x) => x.classList.toggle('active', x === b));
      renderSources(true);
    }),
);
function renderSources(animateIn) {
  const box = $('#sources');
  box.replaceChildren();
  for (const s of allSources.filter((x) => x.screen === (srcType === 'screen'))) {
    const b = el('button', 'src' + (s.id === pickedSource ? ' sel' : ''));
    const img = el('img', 'th');
    img.src = s.thumb;
    const name = el('div', 'sn');
    if (s.icon) {
      const ic = el('img');
      ic.src = s.icon;
      name.append(ic);
    }
    name.append(el('span', '', s.name));
    b.append(img, name);
    b.onclick = () => {
      pickedSource = s.id;
      $('#btnGoLive').disabled = false;
      box.querySelectorAll('.src').forEach((x) => x.classList.toggle('sel', x === b));
    };
    b.ondblclick = () => $('#btnGoLive').click();
    box.append(b);
  }
  if (!box.children.length) box.append(el('p', 'muted', 'Nada encontrado.'));
  else if (animateIn) popIn([...box.children], { delay: stagger(0.025) });
}
$('#btnGoLive').onclick = async () => {
  const prev = settings.stream;
  settings.stream = readQualityForm();
  saveSettings();
  if (!sqAdjust) {
    closeDialog($('#streamDlg'));
    return startStream(pickedSource, settings.stream.audio);
  }
  if (!C.screen) return closeDialog($('#streamDlg'));
  // codec e áudio só mudam reiniciando a captura; o resto muda na hora
  if (prev.codec !== settings.stream.codec || !!prev.audio !== settings.stream.audio) await restartStream();
  else await applyStreamQuality();
  toast('Qualidade da stream atualizada');
};
$('#streamDlg').addEventListener('close', stopLiveStats);

async function captureScreen(sourceId, withAudio) {
  const q = settings.stream;
  if (isDesktop) await window.desk.pick(sourceId, withAudio);
  const s = await navigator.mediaDevices.getDisplayMedia({ video: videoConstraints(q), audio: withAudio });
  const vt = s.getVideoTracks()[0];
  if (vt) {
    vt.contentHint = CONTENT_HINT[q.mode] || '';
    vt.addEventListener('ended', () => C.screen === s && stopStream(true));
  }
  return s;
}
async function startStream(sourceId, withAudio) {
  try {
    C.screen = await captureScreen(sourceId, withAudio);
    streamSource = sourceId;
  } catch (err) {
    C.screen = null;
    return toast('Não foi possível transmitir: ' + err.message);
  }
  C.focus = 'me';
  if (S.view !== C.ch) openView(C.ch);
  sendHi();
  syncMedia();
  renderPresence();
}
// troca a captura sem avisar "parou": quem está assistindo continua assistindo
async function restartStream() {
  const old = C.screen;
  let next;
  try {
    next = await captureScreen(streamSource, settings.stream.audio);
  } catch (err) {
    return toast('Não consegui reiniciar a stream: ' + err.message);
  }
  if (C.screen !== old) return next.getTracks().forEach((t) => t.stop());
  C.screen = next;
  syncMedia();
  old.getTracks().forEach((t) => t.stop());
  renderPresence();
}
async function applyStreamQuality() {
  const q = settings.stream;
  const vt = C.screen?.getVideoTracks()[0];
  if (!vt) return;
  vt.contentHint = CONTENT_HINT[q.mode] || '';
  try {
    await vt.applyConstraints(videoConstraints(q));
  } catch (err) {
    toast('A tela não aceitou essa resolução/fps: ' + err.message);
  }
  tuneSenders();
}
function stopStream(notify) {
  if (!C.screen) return;
  const s = C.screen;
  C.screen = null;
  syncMedia();
  s.getTracks().forEach((t) => t.stop());
  if (sqAdjust && $('#streamDlg').open) closeDialog($('#streamDlg'));
  if (notify) {
    sendHi();
    renderPresence();
  }
}

// números reais da stream (o que a tela entrega e o que chega a cada amigo)
let statsTimer = null;
const lastSent = new Map();
const LIMIT = { bandwidth: 'limitado pela internet', cpu: 'limitado pelo processador', other: 'limitado' };
function startLiveStats() {
  stopLiveStats();
  liveStats();
  statsTimer = setInterval(liveStats, 1000);
}
function stopLiveStats() {
  clearInterval(statsTimer);
  statsTimer = null;
  lastSent.clear();
}
async function liveStats() {
  const box = $('#sqLive');
  const vt = C.screen?.getVideoTracks()[0];
  if (!vt) return box.replaceChildren(el('p', 'muted', 'A stream acabou.'));
  const s = vt.getSettings();
  const t = streamTarget();
  const rows = [
    el('div', 'sq-live-head', `Capturando ${s.width || '?'}×${s.height || '?'} a ${Math.round(s.frameRate || 0)} fps · teto de ${(t.bitrate / 1e6).toFixed(1)} Mbps por amigo`),
  ];
  for (const [pid, pc] of peerConnections()) {
    const sender = pc.getSenders?.().find((x) => x.track === vt);
    if (!sender) continue;
    const stats = await sender.getStats().catch(() => null);
    let out = null;
    stats?.forEach((r) => {
      if (r.type === 'outbound-rtp' && r.kind === 'video') out = r;
    });
    if (!out) continue;
    const codec = out.codecId && stats.get(out.codecId);
    const prev = lastSent.get(pid);
    lastSent.set(pid, { b: out.bytesSent, t: out.timestamp });
    const mbps = prev && out.timestamp > prev.t ? ((out.bytesSent - prev.b) * 8) / (out.timestamp - prev.t) / 1000 : 0;
    const parts = [
      out.frameWidth ? `${out.frameWidth}×${out.frameHeight}` : 'iniciando',
      `${Math.round(out.framesPerSecond || 0)} fps`,
      `${mbps.toFixed(1)} Mbps`,
      codec?.mimeType?.replace('video/', '') || '',
      out.powerEfficientEncoder === true ? 'placa de vídeo' : out.powerEfficientEncoder === false ? 'processador' : '',
    ].filter(Boolean);
    const row = el('div', 'sq-live-row');
    row.append(el('b', '', peers.get(pid)?.user?.name || 'Amigo'), el('span', '', parts.join(' · ')));
    if (out.qualityLimitationReason && out.qualityLimitationReason !== 'none') row.append(el('em', '', LIMIT[out.qualityLimitationReason] || LIMIT.other));
    rows.push(row);
  }
  if (rows.length === 1) rows.push(el('p', 'muted', 'Ninguém está assistindo agora. O que chega em cada amigo aparece aqui quando alguém clicar em Assistir.'));
  if (statsTimer || !box.children.length) box.replaceChildren(...rows);
}

// ============================================================ música (YouTube Music)
// A fila e o "tocando agora" são registros do canal de voz. Cada PC toca no próprio
// player do YouTube, todos no mesmo ponto da música (pelo relógio).
const Y = { api: null, creating: null, player: null, vid: null, lastSeek: 0, syncing: false };
const PLACEHOLDER = 'Música do YouTube';

function ytApi() {
  return (Y.api ||= new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => {
      Y.api = null;
      reject(new Error('Sem conexão com o YouTube'));
    };
    document.head.append(s);
  }));
}
async function ytPlayer() {
  if (Y.player) return Y.player;
  const YT = await ytApi();
  return (Y.creating ||= new Promise((resolve) => {
    const p = new YT.Player('ytPlayer', {
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, rel: 0, playsinline: 1, iv_load_policy: 3, fs: 0 },
      events: {
        onReady: () => {
          Y.player = p;
          resolve(p);
        },
        onStateChange: (e) => onYtState(e.data),
        onError: (e) => onYtError(e.data),
      },
    });
  }));
}
function pbOf(ch) {
  const pb = recs.get('pb:' + ch);
  const item = pb?.item ? recs.get(pb.item) : null;
  return { pb, item: item && !item.del ? item : null };
}
const musicPos = (pb) => (pb.pausedAt != null ? pb.pausedAt : Date.now() - pb.startedAt);
const queueOf = (ch) => {
  const cur = recs.get('pb:' + ch)?.item;
  return all('q')
    .filter((q) => q.ch === ch && q.id !== cur)
    .sort((a, b) => a.at - b.at);
};

async function syncMusic() {
  if (Y.syncing) return;
  Y.syncing = true;
  try {
    const { pb, item } = C.ch ? pbOf(C.ch) : {};
    if (!item) {
      if (Y.player && Y.vid) {
        Y.player.stopVideo();
        Y.vid = null;
      }
      return;
    }
    const p = await ytPlayer();
    const pos = musicPos(pb) / 1000;
    const paused = pb.pausedAt != null;
    if (Y.vid !== item.ref) {
      Y.vid = item.ref;
      paused ? p.cueVideoById({ videoId: item.ref, startSeconds: pos }) : p.loadVideoById({ videoId: item.ref, startSeconds: pos });
    } else {
      const st = p.getPlayerState();
      if (st === 0 && !paused) return advance(item.id);
      if (paused) {
        if (st === 1 || st === 3) p.pauseVideo();
        if (Math.abs(p.getCurrentTime() - pos) > 1) p.seekTo(pos, true);
      } else if (st !== 1 && st !== 3) {
        p.seekTo(pos, true);
        p.playVideo();
      } else if (Math.abs(p.getCurrentTime() - pos) > 2.5 && Date.now() - Y.lastSeek > 4000) {
        Y.lastSeek = Date.now();
        p.seekTo(pos, true);
      }
    }
    applyMusicVolume();
    // completa título/duração com o que o player sabe
    const data = p.getVideoData?.();
    const dur = p.getDuration?.() * 1000;
    if (data?.video_id === item.ref && data.title && dur > 0 && (item.title === PLACEHOLDER || !item.dur)) {
      put({ ...item, title: data.title, artist: data.author || item.artist, dur: Math.round(dur) });
    }
  } catch (err) {
    console.warn('música', err);
  } finally {
    Y.syncing = false;
  }
}
setInterval(() => {
  if (!C.ch) return;
  const { pb, item } = pbOf(C.ch);
  // se ninguém conseguiu tocar até o fim, avança pelo relógio
  if (item?.dur && pb.pausedAt == null && musicPos(pb) > item.dur + 4000) advance(item.id);
  syncMusic();
}, 2000);
setInterval(renderProgress, 500);

function onYtState(state) {
  if (state === 0 && C.ch) {
    const { item } = pbOf(C.ch);
    if (item) advance(item.id);
  }
  renderMusic();
  renderNowPlaying();
}
// erro só aqui: não pula para o grupo (pode ser coisa da rede/PC de um só)
function onYtError(code) {
  toast(code === 101 || code === 150 ? 'O YouTube não deixou tocar essa música aqui. Use Pular se ninguém ouvir.' : 'Não deu para tocar essa música aqui.');
}

function advance(fromId) {
  const ch = C.ch;
  const { pb } = pbOf(ch);
  if (!pb || pb.item !== fromId) return;
  const cur = recs.get(fromId);
  if (cur && !cur.del) put({ ...cur, del: true });
  const next = queueOf(ch).find((q) => q.id !== fromId);
  put({ k: 'pb', id: 'pb:' + ch, ch, item: next?.id || null, startedAt: Date.now(), pausedAt: null });
}

function parseYouTube(text) {
  const s = String(text || '').trim();
  let m = s.match(/(?:youtube\.com|music\.youtube\.com)\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)([\w-]{11})/i) || s.match(/youtu\.be\/([\w-]{11})/i);
  if (m) return { id: m[1] };
  if (/^[\w-]{11}$/.test(s)) return { id: s };
  if (/[?&]list=/.test(s)) return { playlist: true };
  return null;
}
const THUMB_OK = /^https:\/\/(i\.ytimg\.com|yt3\.googleusercontent\.com|lh3\.googleusercontent\.com)\//;
const thumbOf = (item) => (THUMB_OK.test(item.thumb || '') ? item.thumb : `https://i.ytimg.com/vi/${item.ref}/mqdefault.jpg`);

function enqueue(fields) {
  if (!C.ch) return toast('Entre em um canal de voz primeiro');
  const item = { k: 'q', id: 'q:' + randId(), ch: C.ch, title: PLACEHOLDER, artist: '', dur: 0, thumb: '', addedBy: me.name, at: Date.now(), ...fields };
  put(item);
  const { item: playing } = pbOf(C.ch);
  if (!playing) put({ k: 'pb', id: 'pb:' + C.ch, ch: C.ch, item: item.id, startedAt: Date.now(), pausedAt: null });
  else toast(`"${item.title}" entrou na fila`);
  return item;
}
async function addLink(text) {
  if (!C.ch) return toast('Entre em um canal de voz primeiro');
  const yt = parseYouTube(text);
  if (yt?.playlist) return toast('Playlists ainda não. Cole o link de uma música.');
  if (!yt) return toast('Não reconheci esse link. Use um link do YouTube Music.');
  const fields = { ref: yt.id };
  try {
    const res = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + yt.id));
    if (res.ok) {
      const data = await res.json();
      fields.title = String(data.title || PLACEHOLDER).slice(0, 200);
      fields.artist = String(data.author_name || '')
        .replace(/ - Topic$/, '')
        .slice(0, 100);
    }
  } catch {}
  return enqueue(fields);
}

// ----- busca digitando -----
const addInput = $('#addInput');
const resultsBox = $('#searchResults');
let results = [];
let resSel = -1;
let searchSeq = 0;
let searchTimer;
function hideResults() {
  resultsBox.hidden = true;
  resSel = -1;
}
function resultsMessage(text, loading) {
  const li = el('li', 'empty');
  if (loading) li.append(icon('loader', 'spin sm'));
  li.append(el('span', '', text));
  resultsBox.replaceChildren(li);
  resultsBox.hidden = false;
}
function renderResults() {
  if (!results.length) return resultsMessage('Nada encontrado.');
  const items = [];
  let lastKind = null;
  results.forEach((r, i) => {
    if (r.kind !== lastKind) {
      items.push(el('li', 'res-head', r.kind === 'song' ? 'Músicas' : 'Clipes'));
      lastKind = r.kind;
    }
    const li = el('li', i === resSel ? 'sel' : '');
    const img = el('img');
    img.src = THUMB_OK.test(r.thumb) ? r.thumb : `https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`;
    img.alt = '';
    const info = el('div', 'trk');
    info.append(el('b', '', r.title), el('span', '', [r.artist, r.album, r.dur ? fmtTime(r.dur) : ''].filter(Boolean).join(' · ')));
    li.append(img, info);
    li.onmousedown = (e) => e.preventDefault(); // não tira o foco do campo
    li.onclick = () => pickResult(r);
    items.push(li);
  });
  const wasHidden = resultsBox.hidden;
  resultsBox.replaceChildren(...items);
  resultsBox.hidden = false;
  if (wasHidden) animate(resultsBox, { opacity: [0, 1], y: [-6, 0] }, { duration: 0.16, ease: EASE });
}
function pickResult(r) {
  enqueue({ ref: r.id, title: r.title || PLACEHOLDER, artist: r.artist, dur: r.dur || 0, thumb: r.thumb });
  addInput.value = '';
  results = [];
  hideResults();
}
async function doSearch(q) {
  if (!window.desk?.ytSearch) return resultsMessage('A busca funciona no app. Aqui, cole um link.');
  const seq = ++searchSeq;
  if (resultsBox.hidden || !results.length) resultsMessage('Buscando…', true);
  try {
    const list = await window.desk.ytSearch(q);
    if (seq !== searchSeq) return;
    results = list;
    resSel = -1;
    renderResults();
  } catch {
    if (seq === searchSeq) resultsMessage('Não consegui buscar agora. Tente de novo.');
  }
}
addInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const v = addInput.value.trim();
  if (!v || parseYouTube(v)) {
    searchSeq++;
    results = [];
    return hideResults();
  }
  if (v.length >= 2) searchTimer = setTimeout(() => doSearch(v), 300);
});
addInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!results.length) return;
    e.preventDefault();
    resSel = (resSel + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
    renderResults();
    resultsBox.querySelector('li.sel')?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Escape') hideResults();
});
addInput.addEventListener('focus', () => results.length && renderResults());
addInput.addEventListener('blur', () => setTimeout(hideResults, 120));
$('#addForm').onsubmit = (e) => {
  e.preventDefault();
  const v = addInput.value.trim();
  if (!v) return;
  if (parseYouTube(v)) {
    addInput.value = '';
    hideResults();
    return addLink(v);
  }
  if (results.length) return pickResult(results[Math.max(0, resSel)]);
  clearTimeout(searchTimer);
  doSearch(v);
};

function setPb(change) {
  const { pb } = pbOf(C.ch);
  if (!pb?.item) return;
  put({ ...pb, ...change });
}
$('#plPlay').onclick = () => {
  if (!C.ch) return;
  const { pb, item } = pbOf(C.ch);
  if (!item) {
    const first = queueOf(C.ch)[0];
    if (first) put({ k: 'pb', id: 'pb:' + C.ch, ch: C.ch, item: first.id, startedAt: Date.now(), pausedAt: null });
    return;
  }
  if (pb.pausedAt != null) setPb({ startedAt: Date.now() - pb.pausedAt, pausedAt: null });
  else setPb({ pausedAt: Date.now() - pb.startedAt });
};
$('#plRestart').onclick = () => {
  const { pb } = pbOf(C.ch);
  if (pb) setPb(pb.pausedAt != null ? { pausedAt: 0 } : { startedAt: Date.now() });
};
$('#plSkip').onclick = () => {
  const { item } = pbOf(C.ch);
  if (item) advance(item.id);
};
$('#plProgress').onclick = (e) => {
  const { pb, item } = pbOf(C.ch);
  if (!item?.dur) return;
  const r = e.currentTarget.getBoundingClientRect();
  const ms = clamp((e.clientX - r.left) / r.width, 0, 1) * item.dur;
  setPb(pb.pausedAt != null ? { pausedAt: ms } : { startedAt: Date.now() - ms });
};
$('#plVol').value = settings.musicVol * 100;
$('#plVol').oninput = (e) => {
  settings.musicVol = e.target.value / 100;
  if (settings.musicMuted && e.target.value > 0) settings.musicMuted = false;
  saveSettings();
  applyMusicVolume();
};

function trackRow(item, removable) {
  const li = el('li');
  const img = el('img');
  img.src = thumbOf(item);
  img.alt = '';
  const info = el('div', 'trk');
  info.append(el('b', '', item.title), el('span', '', [item.artist, item.dur ? fmtTime(item.dur) : '', 'por ' + item.addedBy].filter(Boolean).join(' · ')));
  li.append(img, info);
  if (removable) {
    const rm = el('button', 'icon-btn sm');
    rm.title = 'Tirar da fila';
    rm.append(icon('x', 'sm'));
    rm.onclick = (e) => {
      e.stopPropagation();
      animate(li, { opacity: 0, x: 20 }, { duration: 0.15 }).then(() => put({ ...item, del: true }));
    };
    li.append(rm);
  }
  return li;
}

let lastQueueIds = '';
function renderMusic() {
  $('#musicOff').hidden = !!C.ch;
  $('#musicOn').hidden = !C.ch;
  if (!C.ch) return;
  const { pb, item } = pbOf(C.ch);
  $('#mediaEmpty').hidden = !!item;
  $('#ytBox').style.visibility = item ? 'visible' : 'hidden';
  $('#plTitle').textContent = item ? item.title : 'Nada tocando';
  $('#plSub').textContent = item ? [item.artist, 'adicionada por ' + item.addedBy].filter(Boolean).join(' · ') : 'Cole um link do YouTube Music abaixo';
  setIcon($('#plPlay'), item && pb.pausedAt == null ? 'pause' : 'play');
  const q = queueOf(C.ch);
  const ids = q.map((x) => x.id + x.v).join();
  if (ids !== lastQueueIds) {
    const prev = new Set(lastQueueIds.split(','));
    lastQueueIds = ids;
    const list = $('#queue');
    list.replaceChildren(...q.map((x) => trackRow(x, true)));
    const fresh = [...list.children].filter((li, i) => !prev.has(q[i].id + q[i].v));
    if (fresh.length && fresh.length < 10) popIn(fresh, { delay: stagger(0.04) });
  }
  $('#queueEmpty').hidden = q.length > 0;
  $('#queueCount').textContent = q.length ? String(q.length) : '';
  renderProgress();
}
function renderProgress() {
  if (!C.ch) return;
  const { pb, item } = pbOf(C.ch);
  const pos = item ? musicPos(pb) : 0;
  const dur = item?.dur || 0;
  $('#plBar').style.width = dur ? clamp((pos / dur) * 100, 0, 100) + '%' : '0';
  $('#plCur').textContent = fmtTime(pos);
  $('#plDur').textContent = fmtTime(dur);
}

function renderNowPlaying() {
  const ch = S.view && channel(S.view)?.type === 'voice' ? S.view : null;
  const { pb, item } = ch ? pbOf(ch) : {};
  const bar = $('#nowPlaying');
  const was = !bar.hidden;
  bar.hidden = !item;
  if (!item) return;
  $('#npArt').src = thumbOf(item);
  $('#npTitle').textContent = item.title;
  $('#npSub').textContent = (item.artist ? item.artist + ' · ' : '') + (C.ch === ch ? 'tocando na call' : 'entre na call para ouvir');
  bar.querySelector('.np-eq').classList.toggle('paused', pb.pausedAt != null || C.ch !== ch);
  if (!was) animate(bar, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.25, ease: EASE });
}
$('#nowPlaying').onclick = () => selectTab('music');

// mudo da música: só para mim, a fila continua tocando para os outros
function applyMusicVolume() {
  const p = Y.player;
  if (p?.setVolume) {
    p.setVolume(Math.round(settings.musicVol * 100));
    C.deafened || settings.musicMuted ? p.mute() : p.unMute();
  }
  const muted = settings.musicMuted || settings.musicVol === 0;
  for (const b of [$('#plMute'), $('#npMute')]) {
    setIcon(b, muted ? 'volume-x' : 'volume-2');
    b.classList.toggle('off', muted);
    b.title = muted ? 'Desmutar música' : 'Mutar música (só para você)';
  }
}
function toggleMusicMute(e) {
  e?.stopPropagation();
  settings.musicMuted = !settings.musicMuted;
  if (!settings.musicMuted && settings.musicVol === 0) settings.musicVol = 0.5;
  $('#plVol').value = settings.musicVol * 100;
  saveSettings();
  applyMusicVolume();
}
$('#plMute').onclick = toggleMusicMute;
$('#npMute').onclick = toggleMusicMute;

// ============================================================ soundboard
// Quem clica avisa os amigos do mesmo canal de voz; cada PC toca o som localmente
// (som limpo, sem passar pelo microfone). Sons próprios vão pelo armazenamento P2P.
const MAX_SOUND_INPUT = 40 * 1024 * 1024; // o arquivo original pode ser uma música inteira: o recorte é que vira o som
const MAX_SOUND_SECONDS = 15;
const SOUND_RATE = 24000; // o recorte é salvo como WAV mono 24 kHz (15 s ≈ 700 KB)
const BUILTIN = [
  { id: 'b:buzina', name: 'Buzina', color: '#ff7a1a' },
  { id: 'b:badumtss', name: 'Ba dum tss', color: '#3aa8f0' },
  { id: 'b:vitoria', name: 'Vitória', color: '#4fd18b' },
  { id: 'b:fail', name: 'Fail', color: '#f05454' },
  { id: 'b:grilos', name: 'Grilos', color: '#b07cff' },
  { id: 'b:rufar', name: 'Rufar', color: '#f2c94c' },
];
const sndBuffers = new Map(); // fileId -> AudioBuffer
const lastSoundFrom = new Map();
let sndGain;
function sndOut() {
  const ctx = audioCtx();
  if (!sndGain) {
    sndGain = ctx.createGain();
    sndGain.connect(ctx.destination);
  }
  sndGain.gain.value = C.deafened ? 0 : settings.sndVol;
  return { ctx, out: sndGain };
}
function noiseBuffer(ctx, seconds) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
function tone(ctx, out, { type = 'sine', f, f2, t, dur, vol = 0.3, attack = 0.01, filter }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o.connect(g);
  if (filter) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    node = g.connect(lp);
  }
  node.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}
function noise(ctx, out, { t, dur, vol = 0.3, type = 'highpass', freq = 6000 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}
const SYNTH = {
  'b:buzina'(ctx, out, t) {
    [0, 0.22, 0.44].forEach((s, i) => {
      const dur = i === 2 ? 0.9 : 0.16;
      for (const f of [466, 470, 587]) tone(ctx, out, { type: 'sawtooth', f, t: t + s, dur, vol: 0.12, attack: 0.02, filter: 2400 });
    });
  },
  'b:badumtss'(ctx, out, t) {
    tone(ctx, out, { f: 160, f2: 45, t, dur: 0.3, vol: 0.9 });
    noise(ctx, out, { t: t + 0.22, dur: 0.18, vol: 0.5, type: 'bandpass', freq: 1800 });
    tone(ctx, out, { type: 'triangle', f: 190, f2: 120, t: t + 0.22, dur: 0.12, vol: 0.3 });
    tone(ctx, out, { f: 150, f2: 45, t: t + 0.5, dur: 0.3, vol: 0.8 });
    noise(ctx, out, { t: t + 0.5, dur: 1.4, vol: 0.35, type: 'highpass', freq: 7000 });
  },
  'b:vitoria'(ctx, out, t) {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(ctx, out, { type: 'square', f, t: t + i * 0.12, dur: 0.14, vol: 0.12, filter: 3500 }));
    for (const f of [523, 659, 784, 1047]) tone(ctx, out, { type: 'square', f, t: t + 0.5, dur: 0.9, vol: 0.08, filter: 3000 });
  },
  'b:fail'(ctx, out, t) {
    const notes = [392, 370, 349];
    notes.forEach((f, i) => tone(ctx, out, { type: 'sawtooth', f, t: t + i * 0.42, dur: 0.38, vol: 0.18, attack: 0.04, filter: 1200 }));
    const o = tone(ctx, out, { type: 'sawtooth', f: 330, t: t + 1.26, dur: 1.2, vol: 0.18, attack: 0.04, filter: 1200 });
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 6;
    depth.gain.value = 10;
    lfo.connect(depth).connect(o.frequency);
    lfo.start(t + 1.26);
    lfo.stop(t + 2.5);
  },
  'b:grilos'(ctx, out, t) {
    for (let c = 0; c < 4; c++)
      for (let i = 0; i < 3; i++) tone(ctx, out, { f: 4300, t: t + c * 0.55 + i * 0.05, dur: 0.035, vol: 0.12, attack: 0.005 });
  },
  'b:rufar'(ctx, out, t) {
    let at = t;
    for (let i = 0; i < 22; i++) {
      noise(ctx, out, { t: at, dur: 0.07, vol: 0.12 + i * 0.012, type: 'bandpass', freq: 2000 });
      at += Math.max(0.035, 0.09 - i * 0.003);
    }
    tone(ctx, out, { f: 150, f2: 50, t: at, dur: 0.35, vol: 0.8 });
    noise(ctx, out, { t: at, dur: 1.6, vol: 0.4, type: 'highpass', freq: 6000 });
  },
};

const customSounds = () => all('snd').sort((a, b) => a.at - b.at);
function soundName(id) {
  return BUILTIN.find((b) => b.id === id)?.name || recs.get(id)?.name || 'som';
}
async function soundBuffer(rec) {
  if (sndBuffers.has(rec.file)) return sndBuffers.get(rec.file);
  const blob = await getFile(rec.file, rec.owner);
  if (!blob) return null;
  try {
    const buf = await audioCtx().decodeAudioData(await blob.arrayBuffer());
    sndBuffers.set(rec.file, buf);
    return buf;
  } catch {
    return null;
  }
}
async function playSound(id) {
  const { ctx, out } = sndOut();
  if (SYNTH[id]) return SYNTH[id](ctx, out, ctx.currentTime + 0.02);
  const rec = recs.get(id);
  if (rec?.k !== 'snd' || rec.del) return;
  const buf = await soundBuffer(rec);
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(out);
  src.start();
  src.stop(ctx.currentTime + MAX_SOUND_SECONDS);
}
function soundFeed(who, id) {
  const feed = $('#sndFeed');
  const pill = el('div', 'snd-pill');
  pill.append(icon('drum'), el('span', '', `${who} · ${soundName(id)}`));
  feed.append(pill);
  while (feed.children.length > 4) feed.firstChild.remove();
  animate(pill, { opacity: [0, 1], x: [20, 0] }, { type: 'spring', stiffness: 400, damping: 28 });
  setTimeout(() => animate(pill, { opacity: 0, x: 20 }, { duration: 0.25 }).then(() => pill.remove()), 2600);
}
function triggerSound(id, btn) {
  if (!C.ch) return toast('Entre em um canal de voz para usar o soundboard');
  const now = Date.now();
  if (now - (lastSoundFrom.get('me') || 0) < 250) return;
  lastSoundFrom.set('me', now);
  const targets = [...peers.values()].filter((p) => p.voice?.ch === C.ch).map((p) => p.pid);
  if (targets.length) A.sndp.send({ id }, { target: targets });
  playSound(id);
  if (S.view === C.ch) soundFeed('Você', id);
  if (btn) {
    const r = btn.querySelector('.ripple');
    animate(r, { opacity: [0.35, 0] }, { duration: 0.5 });
    animate(btn, { scale: [0.94, 1] }, { type: 'spring', stiffness: 500, damping: 15 });
  }
}
function onRemoteSound(d, pid) {
  const p = peers.get(pid);
  const id = String(d?.id || '');
  if (!C.ch || p?.voice?.ch !== C.ch || !(SYNTH[id] || recs.get(id)?.k === 'snd')) return;
  const now = Date.now();
  if (now - (lastSoundFrom.get(pid) || 0) < 250) return;
  lastSoundFrom.set(pid, now);
  playSound(id);
  if (S.view === C.ch) soundFeed(p.user?.name || 'Alguém', id);
}

function renderSounds() {
  const grid = $('#soundGrid');
  const prev = new Set([...grid.children].map((b) => b.dataset.id));
  const btn = (id, name, color, rec) => {
    const b = el('button', 'snd');
    b.dataset.id = id;
    b.title = rec ? `Adicionado por ${rec.addedBy}` : 'Som do janjahaters';
    const dot = el('span', 'snd-dot');
    dot.style.background = color;
    b.append(el('span', 'ripple'), dot, el('span', 'snd-name', name));
    if (rec) {
      const del = el('span', 'icon-btn sm snd-del');
      del.title = 'Apagar som';
      del.append(icon('x', 'sm'));
      del.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Apagar o som "${rec.name}" para todo mundo?`)) put({ ...rec, del: true });
      };
      b.append(del);
      // baixa antes para tocar na hora
      soundBuffer(rec).then((buf) => b.classList.toggle('missing', !buf));
    }
    b.onclick = () => triggerSound(id, b);
    return b;
  };
  grid.replaceChildren(...BUILTIN.map((s) => btn(s.id, s.name, s.color)), ...customSounds().map((r) => btn(r.id, r.name, cleanColor(r.color), r)));
  const fresh = [...grid.children].filter((b) => !prev.has(b.dataset.id));
  if (fresh.length && fresh.length < grid.children.length) springIn(fresh);
  $('#soundsHint').textContent = C.ch ? 'Clique num som para tocar para todo mundo na call.' : 'Entre em um canal de voz para tocar os sons para a galera.';
}
$('#sndVol').value = settings.sndVol * 100;
$('#sndVol').oninput = (e) => {
  settings.sndVol = e.target.value / 100;
  saveSettings();
  if (sndGain) sndGain.gain.value = C.deafened ? 0 : settings.sndVol;
};
// ----- adicionar som: escolher o trecho (recorte) -----
$('#sndFile').onchange = async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  for (const f of files) {
    if (f.size > MAX_SOUND_INPUT) {
      toast(`"${f.name}" é grande demais (máx. 40 MB)`);
      continue;
    }
    let buf;
    try {
      buf = await audioCtx().decodeAudioData(await f.arrayBuffer());
    } catch {
      toast(`Não consegui ler "${f.name}"`);
      continue;
    }
    const result = await openTrim(buf, f.name.replace(/\.[^.]+$/, ''));
    if (result) await saveSound(buf, result);
  }
};

const T = { buf: null, a: 0, b: 0, drag: null, src: null, raf: 0, resolve: null };
const trimLenOf = () => T.b - T.a;
function fmtSec(s) {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
}
function openTrim(buf, name) {
  stopTrimPreview();
  T.buf = buf;
  T.a = 0;
  T.b = Math.min(buf.duration, MAX_SOUND_SECONDS);
  $('#trimName').value = cleanName(name).slice(0, 24) || 'Som';
  openDialog($('#trimDlg'));
  requestAnimationFrame(() => {
    drawWave();
    renderTrim();
  });
  return new Promise((resolve) => (T.resolve = resolve));
}
function closeTrim(result) {
  stopTrimPreview();
  closeDialog($('#trimDlg'));
  T.resolve?.(result);
  T.resolve = null;
}
$('#trimCancel').onclick = () => closeTrim(null);
$('#trimDlg').addEventListener('cancel', (e) => {
  e.preventDefault();
  closeTrim(null);
});
$('#trimSave').onclick = () => closeTrim({ a: T.a, b: T.b, name: cleanName($('#trimName').value).slice(0, 24) || 'Som' });

function drawWave() {
  const cv = $('#trimCanvas');
  const dpr = devicePixelRatio || 1;
  cv.width = cv.clientWidth * dpr;
  cv.height = cv.clientHeight * dpr;
  const g = cv.getContext('2d');
  const data = T.buf.getChannelData(0);
  const cols = cv.width / (2 * dpr);
  const step = Math.max(1, Math.floor(data.length / cols));
  const mid = cv.height / 2;
  g.fillStyle = '#5d636c';
  for (let x = 0; x < cols; x++) {
    let peak = 0;
    for (let i = x * step, end = Math.min(data.length, i + step); i < end; i += 4) peak = Math.max(peak, Math.abs(data[i]));
    const h = Math.max(1, peak * mid * 0.95);
    g.fillRect(x * 2 * dpr, mid - h, dpr * 1.2, h * 2);
  }
}
function renderTrim() {
  const d = T.buf.duration;
  const sel = $('#trimSel');
  sel.style.left = (T.a / d) * 100 + '%';
  sel.style.width = ((T.b - T.a) / d) * 100 + '%';
  $('#trimRange').textContent = `${fmtSec(T.a)} – ${fmtSec(T.b)}`;
  $('#trimLen').textContent = `${trimLenOf().toFixed(1)} s de ${MAX_SOUND_SECONDS} s`;
}
// arrastar: bordas mudam início/fim; o meio move o trecho todo; clicar fora começa um trecho novo
{
  const wave = $('#trimWave');
  const timeAt = (e) => {
    const r = wave.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1) * T.buf.duration;
  };
  wave.addEventListener('pointerdown', (e) => {
    if (!T.buf) return;
    const t = timeAt(e);
    const h = e.target.closest('.trim-h')?.dataset.h;
    if (h) T.drag = { kind: h };
    else if (e.target.closest('.trim-sel')) T.drag = { kind: 'move', offset: t - T.a };
    else {
      T.a = t;
      T.b = Math.min(T.buf.duration, t + 0.05);
      T.drag = { kind: 'b' };
    }
    stopTrimPreview();
    $('#trimSel').classList.toggle('drag', T.drag.kind === 'move');
    wave.setPointerCapture(e.pointerId);
    renderTrim();
  });
  wave.addEventListener('pointermove', (e) => {
    if (!T.drag) return;
    const t = timeAt(e);
    const d = T.buf.duration;
    const MIN = 0.1;
    if (T.drag.kind === 'a') T.a = clamp(t, Math.max(0, T.b - MAX_SOUND_SECONDS), T.b - MIN);
    else if (T.drag.kind === 'b') T.b = clamp(t, T.a + MIN, Math.min(d, T.a + MAX_SOUND_SECONDS));
    else {
      const len = T.b - T.a;
      T.a = clamp(t - T.drag.offset, 0, d - len);
      T.b = T.a + len;
    }
    renderTrim();
  });
  const end = () => {
    if (!T.drag) return;
    T.drag = null;
    $('#trimSel').classList.remove('drag');
    playTrimPreview(); // ouve o trecho na hora que solta
  };
  wave.addEventListener('pointerup', end);
  wave.addEventListener('pointercancel', end);
}
function playTrimPreview() {
  stopTrimPreview();
  const { ctx, out } = sndOut();
  const src = ctx.createBufferSource();
  src.buffer = T.buf;
  src.connect(out);
  const startAt = ctx.currentTime;
  src.start(startAt, T.a, trimLenOf());
  src.onended = () => T.src === src && stopTrimPreview();
  T.src = src;
  setIcon($('#trimPlay'), 'pause');
  const head = $('#trimHead');
  head.hidden = false;
  const tickHead = () => {
    const pos = T.a + (ctx.currentTime - startAt);
    head.style.left = (pos / T.buf.duration) * 100 + '%';
    T.raf = requestAnimationFrame(tickHead);
  };
  tickHead();
}
function stopTrimPreview() {
  cancelAnimationFrame(T.raf);
  if (T.src) {
    const s = T.src;
    T.src = null;
    try {
      s.stop();
    } catch {}
  }
  $('#trimHead').hidden = true;
  setIcon($('#trimPlay'), 'play');
}
$('#trimPlay').onclick = () => (T.src ? stopTrimPreview() : playTrimPreview());

// recorta, junta os canais em mono, reduz para 24 kHz, faz fade de 8 ms nas pontas e gera WAV
async function cutSound(buf, a, b) {
  const len = Math.max(1, Math.round((b - a) * SOUND_RATE));
  const off = new OfflineAudioContext(1, len, SOUND_RATE);
  const src = off.createBufferSource();
  src.buffer = buf;
  const g = off.createGain();
  const fade = Math.min(0.008, (b - a) / 4);
  g.gain.setValueAtTime(0, 0);
  g.gain.linearRampToValueAtTime(1, fade);
  g.gain.setValueAtTime(1, b - a - fade);
  g.gain.linearRampToValueAtTime(0, b - a);
  src.connect(g).connect(off.destination);
  src.start(0, a, b - a);
  return off.startRendering();
}
function encodeWav(audio) {
  const data = audio.getChannelData(0);
  const out = new DataView(new ArrayBuffer(44 + data.length * 2));
  const str = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  out.setUint32(4, 36 + data.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 1, true);
  out.setUint32(24, audio.sampleRate, true);
  out.setUint32(28, audio.sampleRate * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  str(36, 'data');
  out.setUint32(40, data.length * 2, true);
  for (let i = 0; i < data.length; i++) out.setInt16(44 + i * 2, clamp(data[i], -1, 1) * 0x7fff, true);
  return new Blob([out.buffer], { type: 'audio/wav' });
}
async function saveSound(buf, { a, b, name }) {
  const cut = await cutSound(buf, a, b);
  const blob = encodeWav(cut);
  const file = 'f:' + randId(12);
  await blobPut(file, blob);
  sndBuffers.set(file, cut);
  put({
    k: 'snd',
    id: 's:' + randId(),
    name,
    file,
    owner: me.id,
    addedBy: me.name,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    at: Date.now(),
  });
  toast(`"${name}" adicionado ao soundboard`);
}
$('#ctlSounds').onclick = () => selectTab('sounds');

// ============================================================ chat
const typingOf = new Map(); // userId -> { name, ch, until }
const hhmm = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function format(text) {
  const keep = [];
  const hold = (h) => `\u0000${keep.push(h) - 1}\u0000`;
  let s = escapeHtml(text.replace(/\u0000/g, ''));
  s = s.replace(/```(?:[\w+-]*\n)?([\s\S]*?)```/g, (_, c) => hold(`<pre><code>${c}</code></pre>`));
  s = s.replace(/`([^`\n]+)`/g, (_, c) => hold(`<code>${c}</code>`));
  s = s.replace(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g, (u) => hold(`<a href="${u}" target="_blank">${u}</a>`));
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/~~(.+?)~~/g, '<s>$1</s>');
  s = s.replace(/\n/g, '<br>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
}
const isJumbo = (t) => t.length <= 16 && /^(\p{Extended_Pictographic}|️|‍|\s)+$/u.test(t);

function messageEl(m, prev) {
  const grouped = prev && prev.uid === m.uid && !!prev.bot === !!m.bot && m.ts - prev.ts < 5 * 60_000;
  const d = el('div', 'msg' + (grouped ? ' grouped' : ''));
  d.dataset.id = m.id;
  d.dataset.ts = m.ts;
  d.dataset.uid = m.uid;
  if (m.bot) {
    d.classList.add('bot');
    d.dataset.bot = '1';
  }
  d.append(avatar(m.name, m.color, '', m.uid));
  const body = el('div');
  if (!grouped) {
    const head = el('div', 'head');
    const a = el('span', 'author', m.name);
    a.style.color = cleanColor(m.color);
    const t = el('time', '', hhmm.format(m.ts));
    t.title = new Date(m.ts).toLocaleString('pt-BR');
    head.append(a);
    if (m.bot) head.append(el('span', 'bot-tag', 'BOT'));
    head.append(t);
    body.append(head);
  }
  if (m.uid === me.id) {
    const actions = el('div', 'msg-actions');
    const del = el('button', 'icon-btn');
    del.title = 'Apagar mensagem';
    del.append(icon('trash-2', 'sm'));
    del.onclick = (e) => deleteMessage(m, e.shiftKey);
    actions.append(del);
    d.append(actions);
  }
  if (m.text) {
    const text = el('div', 'text' + (isJumbo(m.text) ? ' jumbo' : ''));
    text.innerHTML = format(String(m.text));
    body.append(text);
  }
  const atts = Array.isArray(m.att) ? m.att.filter(validAtt).slice(0, 10) : [];
  if (atts.length) {
    const box = el('div', 'atts');
    atts.forEach((a) => box.append(attachmentEl(a, m.uid)));
    body.append(box);
  }
  d.append(body);
  return d;
}
const validAtt = (a) => a && FILE_ID.test(a.id) && typeof a.name === 'string' && Number.isFinite(a.size) && typeof a.type === 'string';

function attachmentEl(a, ownerUid) {
  const wrap = el('div');
  const wait = el('div', 'att-wait');
  wait.dataset.wait = a.id;
  wait.append(icon('loader', 'spin'), el('span', '', a.name.slice(0, 80)), el('span', 'pct', ''));
  wrap.append(wait);
  fileUrl(a.id, ownerUid).then((url) => {
    if (!url) {
      wait.replaceChildren(icon('circle-x'), el('span', '', `${a.name.slice(0, 80)}: ninguém online tem esse arquivo agora`));
      return;
    }
    const box = wrap.closest('.chat-scroll') || $('#messages');
    const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    const kind = a.type.split('/')[0];
    let node;
    if (kind === 'image') {
      node = el('img', 'att-img');
      node.alt = a.name;
      node.onclick = () => openLightbox(url);
      node.onload = () => stick && (box.scrollTop = box.scrollHeight);
      node.src = url;
    } else if (kind === 'video') {
      node = el('video');
      node.controls = true;
      node.preload = 'metadata';
      node.src = url;
    } else if (kind === 'audio') {
      node = el('audio');
      node.controls = true;
      node.src = url;
    } else {
      node = el('a', 'att-file');
      node.href = url;
      node.download = a.name;
      const fi = el('span', 'fi');
      fi.append(icon('file'));
      const fn = el('span', 'fn');
      fn.append(el('b', '', a.name), el('span', '', fmtSize(a.size)));
      node.append(fi, fn, icon('download'));
    }
    wrap.replaceChildren(node);
    if (stick) box.scrollTop = box.scrollHeight;
  });
  return wrap;
}

function openLightbox(url) {
  const lb = $('#lightbox');
  $('#lightboxImg').src = url;
  lb.hidden = false;
  animate(lb, { opacity: [0, 1] }, { duration: 0.15 });
  animate($('#lightboxImg'), { scale: [0.94, 1] }, { type: 'spring', stiffness: 400, damping: 30 });
}
$('#lightbox').onclick = async () => {
  await animate($('#lightbox'), { opacity: 0 }, { duration: 0.12 });
  $('#lightbox').hidden = true;
};
document.addEventListener('keydown', (e) => e.key === 'Escape' && !$('#lightbox').hidden && $('#lightbox').click());

// ----- os dois chats na tela: o do canal de texto aberto e o da call (aba Chat) -----
const textChatCh = () => (channel(S.view)?.type === 'text' ? S.view : null);
const callChatCh = () => C.ch || (channel(S.view)?.type === 'voice' ? S.view : null);
function chatBoxes() {
  return [
    { box: $('#messages'), ch: textChatCh() },
    { box: $('#callMessages'), ch: callChatCh() },
  ].filter((b) => b.ch);
}
function renderChat(box, ch, keepScroll) {
  const fromBottom = box.scrollHeight - box.scrollTop;
  const c = channel(ch);
  const list = messagesOf(ch);
  const frag = document.createDocumentFragment();
  if (box.id === 'messages') {
    const empty = el('div', 'empty-ch');
    const big = el('div', 'big');
    big.append(icon('hash'));
    empty.append(big, el('h2', '', `Bem-vindo a #${c?.name || ''}`), el('div', 'muted', 'Este é o começo do canal.'));
    frag.append(empty);
  } else if (!list.length) frag.append(el('p', 'hint', `Chat de ${c?.name || 'voz'}. Digite /ajuda para ver os comandos de música.`));
  list.forEach((m, i) => frag.append(messageEl(m, list[i - 1])));
  box.replaceChildren(frag);
  box.scrollTop = keepScroll ? box.scrollHeight - fromBottom : box.scrollHeight;
}
function renderMessages(keepScroll) {
  if (textChatCh()) renderChat($('#messages'), S.view, keepScroll);
}
function renderCallChat() {
  const ch = callChatCh();
  const head = $('#callChatHead');
  head.replaceChildren(icon(C.ch ? 'audio-lines' : 'volume-2'), el('span', '', ch ? `Chat de ${channel(ch)?.name}` : 'Entre em um canal de voz para conversar com a call'));
  $('#callComposer').hidden = !ch;
  if (ch) renderChat($('#callMessages'), ch);
  else $('#callMessages').replaceChildren();
}
async function deleteMessage(m, skipConfirm) {
  if (m.uid !== me.id) return;
  if (!skipConfirm && !confirm('Apagar esta mensagem para todo mundo?')) return;
  for (const n of $$(`.msg[data-id="${m.id}"]`)) animate(n, { opacity: 0, x: -12 }, { duration: 0.15 });
  await new Promise((r) => setTimeout(r, 160));
  put({ ...m, text: '', att: [], del: true });
}
function appendMessage(m, box = $('#messages')) {
  const last = box.lastElementChild;
  // um aviso só-meu no meio quebra o agrupamento (o próximo autor aparece de novo)
  const prev = last?.dataset.uid ? { uid: last.dataset.uid, ts: Number(last.dataset.ts), bot: !!last.dataset.bot } : null;
  const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 80 || m.uid === me.id;
  const node = messageEl(m, prev);
  box.append(node);
  popIn(node, { duration: 0.18 });
  if (stick) box.scrollTop = box.scrollHeight;
}
function renderTyping() {
  const now = Date.now();
  const names = [...typingOf.values()].filter((t) => t.until > now && t.ch === S.view).map((t) => t.name);
  $('#typing').textContent = !names.length ? '' : names.length === 1 ? `${names[0]} está digitando…` : `${names.join(', ')} estão digitando…`;
}
setInterval(renderTyping, 1000);

const input = $('#input');
function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(160, input.scrollHeight) + 'px';
}
let lastTyping = 0;
input.addEventListener('input', () => {
  autosize();
  if (input.value && Date.now() - lastTyping > 2500) {
    lastTyping = Date.now();
    A.typing?.send({ ch: S.view });
  }
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  }
});
async function sendMessage() {
  const text = input.value.trim();
  if (!pendingFiles.length && isCommand(text)) {
    input.value = '';
    autosize();
    return runCommand(text, S.view, $('#messages'));
  }
  const files = pendingFiles.splice(0);
  if ((!text && !files.length) || !channel(S.view)) return;
  input.value = '';
  autosize();
  renderPending();
  lastTyping = 0;
  const att = [];
  for (const f of files) {
    const id = 'f:' + randId(12);
    await blobPut(id, f);
    att.push({ id, name: (f.name || 'imagem.png').slice(0, 200), size: f.size, type: (f.type || 'application/octet-stream').slice(0, 100) });
  }
  put({ k: 'msg', id: 'm:' + randId(), ch: S.view, uid: me.id, name: me.name, color: me.color, text: text.slice(0, 2000), att, ts: Date.now() });
}

// ----- chat da call (aba Chat da direita) -----
const callInput = $('#callInput');
callInput.addEventListener('input', () => {
  callInput.style.height = 'auto';
  callInput.style.height = Math.min(120, callInput.scrollHeight) + 'px';
});
callInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  const text = callInput.value.trim();
  const ch = callChatCh();
  if (!text || !ch) return;
  callInput.value = '';
  callInput.style.height = 'auto';
  if (isCommand(text)) return runCommand(text, ch, $('#callMessages'));
  put({ k: 'msg', id: 'm:' + randId(), ch, uid: me.id, name: me.name, color: me.color, text: text.slice(0, 2000), att: [], ts: Date.now() });
});
$('#callEmoji').onclick = (e) =>
  openEmoji(e.currentTarget, (emoji) => {
    const pos = callInput.selectionStart ?? callInput.value.length;
    callInput.value = callInput.value.slice(0, pos) + emoji + callInput.value.slice(pos);
    callInput.focus();
  });

// ----- DJ: comandos de música no chat, no estilo dos bots de música (/play, m!play, !play) -----
const CMD = /^(?:\/|m!|!)(\w+)\s*([\s\S]*)$/i;
const DJ_CMDS = new Map(
  Object.entries({
    play: ['play', 'p', 'tocar'],
    skip: ['skip', 's', 'next', 'pular'],
    pause: ['pause', 'pausar'],
    resume: ['resume', 'r', 'continuar', 'unpause'],
    stop: ['stop', 'parar', 'leave', 'dc'],
    clear: ['clear', 'limpar'],
    queue: ['queue', 'q', 'fila'],
    np: ['np', 'nowplaying', 'agora', 'tocando'],
    remove: ['remove', 'rm', 'tirar'],
    volume: ['volume', 'vol', 'v'],
    help: ['help', 'ajuda', 'h', 'comandos'],
  }).flatMap(([cmd, aliases]) => aliases.map((a) => [a, cmd])),
);
const isCommand = (text) => {
  const m = text.match(CMD);
  return !!m && DJ_CMDS.has(m[1].toLowerCase());
};
function botSay(ch, text) {
  put({ k: 'msg', id: 'm:' + randId(), ch, uid: me.id, name: 'DJ', color: '#ff7a1a', bot: true, text, att: [], ts: Date.now() });
}
// resposta que só eu vejo (fila, ajuda, erros)
function note(box, text) {
  const line = el('div', 'sys-line', text);
  line.append(el('span', 'muted', 'Só você está vendo isto'));
  box.append(line);
  box.scrollTop = box.scrollHeight;
  popIn(line);
}
const HELP = [
  '/play <nome ou link>  coloca uma música na fila (também m!play, !p)',
  '/skip  pula a música',
  '/pause  e  /resume  pausa e continua',
  '/queue  mostra a fila',
  '/np  mostra o que está tocando',
  '/remove <nº>  tira uma música da fila',
  '/clear  limpa a fila  ·  /stop  para tudo',
  '/volume <0-100>  volume da música só para você',
].join('\n');
async function runCommand(text, ch, box) {
  const [, name, rawArg] = text.match(CMD);
  const cmd = DJ_CMDS.get(name.toLowerCase());
  const arg = rawArg.trim();
  if (cmd === 'help') return note(box, HELP);
  if (cmd === 'volume') {
    const v = parseInt(arg, 10);
    if (!(v >= 0 && v <= 100)) return note(box, `Volume da música: ${Math.round(settings.musicVol * 100)}. Use /volume 0 a 100.`);
    settings.musicVol = v / 100;
    settings.musicMuted = false;
    $('#plVol').value = v;
    saveSettings();
    applyMusicVolume();
    return note(box, `Volume da música (só para você): ${v}`);
  }
  if (!C.ch) return note(box, 'Entre em um canal de voz para usar os comandos de música.');
  const { pb, item } = pbOf(C.ch);
  const who = `**${me.name}**`;
  switch (cmd) {
    case 'play': {
      if (!arg) {
        if (item && pb.pausedAt != null) return runCommand('/resume', ch, box);
        return note(box, 'Use /play seguido do nome da música ou de um link.');
      }
      let added;
      if (parseYouTube(arg)) added = await addLink(arg);
      else {
        if (!window.desk?.ytSearch) return note(box, 'A busca só funciona no app. Aqui, cole um link.');
        let r;
        try {
          [r] = await window.desk.ytSearch(arg);
        } catch {
          return note(box, 'Não consegui buscar agora. Tente de novo.');
        }
        if (!r) return note(box, `Nada encontrado para "${arg}".`);
        added = enqueue({ ref: r.id, title: r.title || PLACEHOLDER, artist: r.artist, dur: r.dur || 0, thumb: r.thumb });
      }
      if (added) botSay(ch, `${who} colocou **${added.title}**${added.artist ? ' · ' + added.artist : ''} na fila`);
      return;
    }
    case 'skip':
      if (!item) return note(box, 'Nada tocando agora.');
      advance(item.id);
      return botSay(ch, `${who} pulou **${item.title}**`);
    case 'pause':
      if (!item || pb.pausedAt != null) return note(box, 'Nada tocando para pausar.');
      setPb({ pausedAt: Date.now() - pb.startedAt });
      return botSay(ch, `${who} pausou a música`);
    case 'resume':
      if (!item || pb.pausedAt == null) return note(box, 'Nada pausado.');
      setPb({ startedAt: Date.now() - pb.pausedAt, pausedAt: null });
      return botSay(ch, `${who} continuou a música`);
    case 'clear': {
      const q = queueOf(C.ch);
      if (!q.length) return note(box, 'A fila já está vazia.');
      q.forEach((x) => put({ ...x, del: true }));
      return botSay(ch, `${who} limpou a fila (${q.length} ${q.length === 1 ? 'música' : 'músicas'})`);
    }
    case 'stop':
      queueOf(C.ch).forEach((x) => put({ ...x, del: true }));
      if (item) put({ ...item, del: true });
      put({ k: 'pb', id: 'pb:' + C.ch, ch: C.ch, item: null, startedAt: Date.now(), pausedAt: null });
      return botSay(ch, `${who} parou a música e limpou a fila`);
    case 'remove': {
      const q = queueOf(C.ch);
      const n = parseInt(arg, 10);
      if (!(n >= 1 && n <= q.length)) return note(box, q.length ? `Use /remove 1 a ${q.length}.` : 'A fila está vazia.');
      put({ ...q[n - 1], del: true });
      return botSay(ch, `${who} tirou **${q[n - 1].title}** da fila`);
    }
    case 'np':
      if (!item) return note(box, 'Nada tocando agora.');
      return note(box, `Tocando: ${item.title}${item.artist ? ' · ' + item.artist : ''}  [${fmtTime(musicPos(pb))} / ${fmtTime(item.dur)}]${pb.pausedAt != null ? '  (pausada)' : ''}`);
    case 'queue': {
      const q = queueOf(C.ch);
      const lines = [item ? `Tocando: ${item.title}` : 'Nada tocando.'];
      q.slice(0, 15).forEach((x, i) => lines.push(`${i + 1}. ${x.title}${x.artist ? ' · ' + x.artist : ''}  (${x.addedBy})`));
      if (q.length > 15) lines.push(`… e mais ${q.length - 15}`);
      if (!q.length) lines.push('A fila está vazia.');
      return note(box, lines.join('\n'));
    }
  }
}

// ----- anexos esperando envio -----
let pendingFiles = [];
const previewUrls = new WeakMap();
function addPending(files) {
  for (const f of files) {
    if (f.size > MAX_ATTACH) {
      toast(`"${f.name}" passa de ${MAX_ATTACH / 1024 / 1024} MB`);
      continue;
    }
    if (pendingFiles.length >= 10) {
      toast('No máximo 10 anexos por mensagem');
      break;
    }
    pendingFiles.push(f);
  }
  renderPending();
  input.focus();
}
function renderPending() {
  const box = $('#pending');
  const before = box.children.length;
  box.replaceChildren(
    ...pendingFiles.map((f, i) => {
      const chip = el('div', 'chip');
      if (f.type.startsWith('image/')) {
        const img = el('img');
        if (!previewUrls.has(f)) previewUrls.set(f, URL.createObjectURL(f));
        img.src = previewUrls.get(f);
        chip.append(img);
      } else {
        const ic = el('span', 'chip-ic');
        ic.append(icon('file'));
        chip.append(ic);
      }
      chip.append(el('span', 'chip-name', f.name || 'imagem colada'));
      const x = el('button', 'icon-btn sm');
      x.type = 'button';
      x.title = 'Remover';
      x.append(icon('x', 'sm'));
      x.onclick = () => {
        pendingFiles.splice(i, 1);
        renderPending();
      };
      chip.append(x);
      return chip;
    }),
  );
  if (box.children.length > before) springIn([...box.children].slice(before));
}
$('#fileInput').onchange = (e) => {
  addPending([...e.target.files]);
  e.target.value = '';
};
input.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files || [])];
  if (files.length) {
    e.preventDefault();
    addPending(files);
  }
});
{
  const view = $('#textView');
  const hint = $('#dropHint');
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  view.addEventListener('dragenter', (e) => {
    if (!hasFiles(e)) return;
    if (depth++ === 0) {
      hint.hidden = false;
      animate(hint, { opacity: [0, 1], scale: [0.98, 1] }, { duration: 0.15 });
    }
  });
  view.addEventListener('dragleave', () => {
    if (--depth <= 0) {
      depth = 0;
      hint.hidden = true;
    }
  });
  view.addEventListener('dragover', (e) => hasFiles(e) && e.preventDefault());
  view.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    hint.hidden = true;
    addPending([...e.dataTransfer.files]);
  });
}
$('#btnEmoji').onclick = (e) =>
  openEmoji(e.currentTarget, (emoji) => {
    const pos = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, pos) + emoji + input.value.slice(pos);
    input.focus();
    input.selectionStart = input.selectionEnd = pos + emoji.length;
  });

// ============================================================ popovers
const pop = $('#popover');
function openPopover(anchor, content) {
  pop.replaceChildren(content);
  pop.hidden = false;
  const r = anchor.getBoundingClientRect();
  pop.style.left = clamp(r.left, 8, innerWidth - pop.offsetWidth - 8) + 'px';
  pop.style.top = (r.top - pop.offsetHeight - 8 > 40 ? r.top - pop.offsetHeight - 8 : r.bottom + 8) + 'px';
  animate(pop, { opacity: [0, 1], scale: [0.95, 1] }, { duration: 0.15, ease: EASE });
}
document.addEventListener('mousedown', (e) => {
  if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true;
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && (pop.hidden = true));
function openEmoji(anchor, pick) {
  const grid = el('div', 'emoji-grid');
  for (const e of EMOJIS) {
    const b = el('button', '', e);
    b.type = 'button';
    b.onclick = () => {
      pick(e);
      pop.hidden = true;
    };
    grid.append(b);
  }
  openPopover(anchor, grid);
}
function openVolume(user, anchor) {
  const box = el('div', 'vol-pop');
  box.append(el('b', '', user.name));
  const label = el('label', '', 'Volume');
  const range = el('input');
  range.type = 'range';
  range.min = 0;
  range.max = 100;
  range.value = Math.round((settings.volumes[user.id] ?? 1) * 100);
  range.oninput = () => {
    settings.volumes[user.id] = range.value / 100;
    saveSettings();
    applyVolumes();
  };
  label.append(range);
  box.append(label);
  openPopover(anchor, box);
}

// ============================================================ abas da direita
let currentTab = 'people';
function selectTab(tab) {
  if (tab === currentTab) return;
  currentTab = tab;
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  const panes = { people: $('#panePeople'), chat: $('#paneChat'), music: $('#paneMusic'), sounds: $('#paneSounds') };
  for (const [name, pane] of Object.entries(panes)) pane.hidden = name !== tab;
  const ink = $('#tabInk');
  const idx = Object.keys(panes).indexOf(tab);
  animate(ink, { x: idx * ink.offsetWidth }, { type: 'spring', stiffness: 500, damping: 38 });
  popIn(panes[tab], { duration: 0.18 });
  if (tab === 'sounds') renderSounds();
  if (tab === 'chat') {
    S.callUnread = 0;
    renderCallBadge();
    renderCallChat();
    $('#callInput').focus();
  }
}
function renderCallBadge() {
  const b = $('#callBadge');
  b.hidden = !S.callUnread;
  b.textContent = S.callUnread > 9 ? '9+' : S.callUnread;
}
$$('.tab').forEach((t) => (t.onclick = () => selectTab(t.dataset.tab)));

// ============================================================ renderização
function uniquePeers(filter) {
  const byUser = new Map();
  for (const p of peers.values()) if (p.user && p.user.id !== me.id && filter(p)) byUser.set(p.user.id, p);
  return [...byUser.values()].sort((a, b) => a.user.name.localeCompare(b.user.name));
}
function voiceMembers(ch) {
  const list = uniquePeers((p) => p.voice?.ch === ch).map((p) => ({ key: p.pid, user: p.user, voice: p.voice, peer: p }));
  if (C.ch === ch) list.unshift({ key: 'me', user: me, voice: myVoice() });
  return list;
}
function flagsEl(voice, key) {
  const f = el('span', 'flags');
  if (voice?.streaming) {
    const badge = el('span', 'live', 'AO VIVO');
    // na barra lateral, clicar no "AO VIVO" de quem está na mesma call começa a assistir
    if (key && key !== 'me' && C.ch && voice.ch === C.ch && !C.watching.has(key)) {
      badge.title = 'Assistir';
      badge.style.cursor = 'pointer';
      badge.onclick = (e) => {
        e.stopPropagation();
        if (S.view !== C.ch) openView(C.ch);
        watchStream(key);
      };
    }
    f.append(badge);
  }
  if (voice?.deafened) f.append(icon('headphone-off', 'red'));
  else if (voice?.muted) f.append(icon('mic-off', 'red'));
  return f;
}

let seenRows = new Set();
function renderSidebar() {
  const rows = [];
  const textList = $('#textList');
  textList.replaceChildren(
    ...channels('text').map((c) => {
      const li = el('li');
      const row = el('div', 'ch' + (S.view === c.id ? ' active' : '') + (S.unread.has(c.id) && S.view !== c.id ? ' unread' : ''));
      row.append(icon('hash'), el('span', 'label', c.name));
      if (S.unread.has(c.id) && S.view !== c.id) row.append(el('span', 'unread-dot'));
      row.append(editBtn(c));
      row.onclick = () => openView(c.id);
      li.append(row);
      rows.push([c.id, li]);
      return li;
    }),
  );
  const voiceList = $('#voiceList');
  voiceList.replaceChildren(
    ...channels('voice').map((c) => {
      const li = el('li');
      const members = voiceMembers(c.id);
      const row = el('div', 'ch' + (S.view === c.id ? ' active' : ''));
      row.append(icon(C.ch === c.id ? 'audio-lines' : 'volume-2'), el('span', 'label', c.name));
      if (members.length) row.append(el('span', 'count', String(members.length)));
      row.append(editBtn(c));
      row.onclick = () => {
        openView(c.id);
        if (C.ch !== c.id) joinVoice(c.id);
      };
      li.append(row);
      if (members.length) {
        const ul = el('ul', 'voice-users');
        for (const m of members) {
          const u = el('li' + '');
          u.dataset.speak = m.key;
          u.classList.toggle('speaking', C.speaking.has(m.key));
          u.append(avatar(m.user.name, m.user.color, 'xs', m.user.id), el('span', 'pname', m.user.name), flagsEl(m.voice, m.key));
          if (m.key !== 'me') u.onclick = () => openVolume(m.user, u);
          ul.append(u);
          rows.push([c.id + ':' + m.user.id, u]);
        }
        li.append(ul);
      }
      rows.push([c.id, li]);
      return li;
    }),
  );
  // anima só o que apareceu agora
  const fresh = rows.filter(([k]) => !seenRows.has(k)).map(([, e]) => e);
  if (fresh.length) S.firstRender ? animate(fresh, { opacity: [0, 1], x: [-10, 0] }, { delay: stagger(0.03), duration: 0.25, ease: EASE }) : popIn(fresh);
  seenRows = new Set(rows.map(([k]) => k));
  S.firstRender = false;

  $('#voiceBar').hidden = !C.ch;
  if (C.ch) $('#vbChannel').textContent = channel(C.ch)?.name || '';
  setIcon($('#vbStream'), C.screen ? 'screen-share-off' : 'screen-share');
  $('#vbStream').classList.toggle('on', !!C.screen);
  const gname = groupName();
  $('#groupName').textContent = gname;
  $('#groupAvatar').textContent = gname[0] || 'T';
  $('#tbGroup').textContent = gname;
}
function editBtn(c) {
  const b = el('button', 'icon-btn sm ch-edit');
  b.title = 'Editar canal';
  b.append(icon('pencil', 'sm'));
  b.onclick = (e) => {
    e.stopPropagation();
    openChannelDialog(c.type, c);
  };
  return b;
}

function renderPeopleList() {
  const list = $('#peopleList');
  const everyone = [{ key: 'me', user: me, voice: myVoice() }, ...uniquePeers(() => true).map((p) => ({ key: p.pid, user: p.user, voice: p.voice }))];
  const prev = new Set([...list.children].map((li) => li.dataset.uid));
  list.replaceChildren(
    ...everyone.map((m) => {
      const li = el('li');
      li.dataset.uid = m.user.id;
      const who = el('div', 'who');
      const pname = el('div', 'pname', m.user.name + (m.key === 'me' ? ' (você)' : ''));
      const g = googleOf(m.user.id);
      if (g) {
        pname.append(icon('badge-check', 'g-badge'));
        li.title = 'Conta Google: ' + g.email;
      }
      who.append(pname);
      const sub = el('div', 'psub');
      const vch = m.voice && channel(m.voice.ch);
      if (vch) sub.append(icon(m.voice.streaming ? 'screen-share' : 'volume-2'), el('span', '', (m.voice.streaming ? 'Ao vivo em ' : '') + vch.name));
      else sub.append(el('span', '', 'Online'));
      who.append(sub);
      li.append(avatar(m.user.name, m.user.color, '', m.user.id), who, flagsEl(m.voice));
      if (m.key !== 'me') li.onclick = () => openVolume(m.user, li);
      return li;
    }),
  );
  const fresh = [...list.children].filter((li) => !prev.has(li.dataset.uid));
  if (fresh.length && prev.size) popIn(fresh);
  const friends = everyone.length - 1;
  $('#aloneHint').hidden = friends > 0;
  $('#groupSub').textContent = `${friends + 1} online`;
  $('#connDot').classList.toggle('ok', friends > 0);
  $('#connText').textContent = friends ? `${friends} ${friends === 1 ? 'amigo conectado' : 'amigos conectados'}` : 'Esperando amigos…';
}

function renderMeCard() {
  $('#meAvatar').replaceWith(Object.assign(avatar(me.name, me.color, '', me.id), { id: 'meAvatar' }));
  $('#meName').textContent = me.name;
  $('#meSub').textContent = C.ch ? (C.screen ? 'Ao vivo' : 'Na call') : 'Online';
  const off = C.muted || C.deafened || (C.ch && !C.mic);
  setIcon($('#btnMute'), off ? 'mic-off' : 'mic');
  $('#btnMute').classList.toggle('off', off);
  setIcon($('#btnDeafen'), C.deafened ? 'headphone-off' : 'headphones');
  $('#btnDeafen').classList.toggle('off', C.deafened);
}

const videoEls = new Map(); // stream.id -> <video>
function videoFor(stream) {
  let v = videoEls.get(stream.id);
  if (!v) {
    v = el('video');
    v.autoplay = true;
    v.playsInline = true;
    v.muted = true; // o som da tela toca pelos elementos <audio>
    v.srcObject = stream;
    videoEls.set(stream.id, v);
  }
  return v;
}

let stageKeys = new Set();
function renderStage() {
  const stage = $('#stage');
  const c = channel(S.view);
  if (!c || c.type !== 'voice') return;
  const members = voiceMembers(c.id);
  if (C.ch !== c.id) {
    const lobby = el('div', 'lobby');
    lobby.append(el('h2', '', members.length ? `${members.length} ${members.length === 1 ? 'pessoa' : 'pessoas'} em ${c.name}` : `${c.name} está vazia`));
    if (members.length) {
      const faces = el('div', 'faces');
      members.forEach((m) => faces.append(avatar(m.user.name, m.user.color, '', m.user.id)));
      lobby.append(faces, el('p', 'muted', members.map((m) => m.user.name).join(', ')));
    } else lobby.append(el('p', 'muted', 'Entre e chame a galera.'));
    const join = el('button', 'primary big-btn');
    join.append(icon('phone'), document.createTextNode('Entrar na call'));
    join.onclick = () => joinVoice(c.id);
    lobby.append(join);
    stage.replaceChildren(lobby);
    springIn(lobby);
    stageKeys = new Set();
    renderControls();
    return;
  }

  // streams na tela: a minha (prévia) e as que eu escolhi assistir; as outras viram botão "Assistir"
  const shown = [];
  if (C.screen) shown.push({ key: 'me', name: 'Sua tela', stream: C.screen });
  const unwatched = [];
  for (const m of members) {
    if (m.key === 'me' || !m.voice?.streaming) continue;
    if (!C.watching.has(m.key)) {
      unwatched.push(m);
      continue;
    }
    const s = m.peer?.media.screen;
    const ok = s?.getVideoTracks().some((t) => t.readyState === 'live');
    shown.push({ key: m.key, name: m.user.name, stream: ok ? s : null });
  }
  const live = new Set(shown.filter((s) => s.stream).map((s) => s.stream.id));
  for (const id of videoEls.keys()) if (!live.has(id)) videoEls.delete(id);
  const watchBtn = (m, cls = 'primary sm watch-btn') => {
    const b = el('button', cls);
    b.append(icon('eye', 'sm'), document.createTextNode(`Assistir ${m.user.name}`));
    b.onclick = (e) => {
      e.stopPropagation();
      watchStream(m.key);
    };
    return b;
  };

  const keysNow = new Set();
  if (!shown.length) {
    const grid = el('div', 'grid');
    const fresh = [];
    for (const m of members) {
      const isLive = m.key !== 'me' && m.voice?.streaming;
      const card = el('div', 'pcard' + (C.speaking.has(m.key) ? ' speaking' : '') + (isLive ? ' live-card' : ''));
      card.dataset.speak = m.key;
      card.append(flagsEl(m.voice), avatar(m.user.name, m.user.color, '', m.user.id), el('div', 'pc-name', m.user.name + (m.key === 'me' ? ' (você)' : '')));
      if (isLive) card.append(watchBtn(m, 'primary sm watch-btn'));
      if (m.key !== 'me') card.onclick = () => openVolume(m.user, card);
      grid.append(card);
      const k = 'card:' + m.key + (isLive ? ':live' : '');
      keysNow.add(k);
      if (!stageKeys.has(k)) fresh.push(card);
    }
    stage.replaceChildren(grid);
    if (fresh.length) springIn(fresh, { delay: stagger(0.05) });
  } else {
    const focus = shown.find((s) => s.key === C.focus) || shown[0];
    const big = el('div', 'focus');
    const tag = el('div', 'tag');
    if (focus.key !== 'me') tag.append(el('span', 'live', 'AO VIVO'));
    tag.append(el('span', '', focus.name));
    const fs = el('button', 'fs');
    fs.title = 'Tela cheia';
    fs.append(icon('maximize', 'sm'));
    fs.onclick = () => (document.fullscreenElement ? document.exitFullscreen() : big.requestFullscreen());
    if (focus.stream) big.append(videoFor(focus.stream));
    else {
      const wait = el('div', 'connecting');
      wait.append(icon('loader', 'spin'), el('span', '', `Conectando à stream de ${focus.name}…`));
      big.append(wait);
    }
    big.append(tag, fs);
    if (focus.key !== 'me') {
      const stop = el('button', 'stop-watch');
      stop.append(icon('eye-off', 'sm'), document.createTextNode('Parar de assistir'));
      stop.onclick = () => unwatchStream(focus.key);
      big.append(stop);
    }
    big.ondblclick = () => fs.click();
    const strip = el('div', 'strip');
    for (const s of shown) {
      if (s === focus) continue;
      const t = el('div', 'thumb');
      const tg = el('div', 'tag');
      tg.append(el('span', 'live', 'AO VIVO'), el('span', '', s.name));
      if (s.stream) t.append(videoFor(s.stream));
      t.append(tg);
      t.onclick = () => {
        C.focus = s.key;
        renderStage();
      };
      strip.append(t);
    }
    for (const m of unwatched) {
      const t = el('div', 'watch-tile');
      t.append(icon('eye'), el('span', '', `Assistir ${m.user.name}`));
      t.onclick = () => watchStream(m.key);
      strip.append(t);
    }
    for (const m of members) {
      const t = el('div', 'thumb' + (C.speaking.has(m.key) ? ' speaking' : ''));
      t.dataset.speak = m.key;
      t.append(avatar(m.user.name, m.user.color, '', m.user.id), Object.assign(el('div', 'tag'), { textContent: m.user.name }));
      strip.append(t);
    }
    stage.replaceChildren(big, strip);
    const k = 'focus:' + focus.key + ':' + (focus.stream?.id || 'wait');
    keysNow.add(k);
    if (!stageKeys.has(k)) springIn(big);
    for (const vid of stage.querySelectorAll('video')) vid.play().catch(() => {});
  }
  stageKeys = keysNow;
  renderControls();
}

function renderControls() {
  const inThis = C.ch && C.ch === S.view;
  const call = $('#ctlCall');
  call.classList.toggle('leave', !!inThis);
  setIcon(call, inThis ? 'phone-off' : 'phone');
  call.querySelector('span').textContent = inThis ? 'Sair' : 'Entrar';
  const off = C.muted || C.deafened || (C.ch && !C.mic);
  const mute = $('#ctlMute');
  mute.classList.toggle('off', !!off);
  setIcon(mute, off ? 'mic-off' : 'mic');
  const deaf = $('#ctlDeafen');
  deaf.classList.toggle('off', C.deafened);
  setIcon(deaf, C.deafened ? 'headphone-off' : 'headphones');
  const st = $('#ctlStream');
  st.classList.toggle('on', !!C.screen);
  setIcon(st, C.screen ? 'screen-share-off' : 'screen-share');
  st.querySelector('span').textContent = C.screen ? 'Parar' : 'Stream';
  $('#ctlStreamCfg').hidden = !C.screen;
}

function renderHeader() {
  const c = channel(S.view);
  if (!c) return;
  const head = $('#viewHead');
  const ic = head.querySelector('svg.lucide');
  const nic = icon(c.type === 'text' ? 'hash' : 'volume-2');
  ic ? ic.replaceWith(nic) : head.prepend(nic);
  $('#viewTitle').textContent = c.name;
  $('#viewSub').textContent = c.type === 'voice' ? `${voiceMembers(c.id).length} na call` : '';
  input.placeholder = `Conversar em #${c.name}`;
}

function renderPresence() {
  renderSidebar();
  renderPeopleList();
  renderMeCard();
  renderStage();
  renderHeader();
  renderNowPlaying();
}

function openView(id) {
  const c = channel(id) || channels('text')[0];
  if (!c) return;
  const changed = S.view !== c.id;
  S.view = c.id;
  store.set('view:' + R.hash, c.id);
  S.unread.delete(c.id);
  const text = c.type === 'text';
  $('#textView').hidden = !text;
  $('#voiceView').hidden = text;
  if (text) renderMessages();
  else {
    stageKeys = new Set();
    renderStage();
  }
  renderHeader();
  renderSidebar();
  renderTyping();
  renderNowPlaying();
  if (!C.ch) renderCallChat(); // sem call, a aba Chat mostra o canal de voz que estou vendo
  if (changed) popIn(text ? $('#textView') : $('#voiceView'), { duration: 0.2 });
  if (text) input.focus();
}

// ============================================================ canais
let chDlgState = null;
function openChannelDialog(type, existing) {
  chDlgState = { type, existing };
  $('#chDlgTitle').textContent = existing ? 'Editar canal' : type === 'text' ? 'Novo canal de texto' : 'Novo canal de voz';
  $('#chDlgName').value = existing?.name || '';
  $('#chDlgName').placeholder = type === 'text' ? 'ex.: memes' : 'ex.: Jogatina';
  $('#chDlgSave').textContent = existing ? 'Salvar' : 'Criar';
  $('#chDlgDelete').hidden = !existing;
  openDialog($('#channelDlg'));
  $('#chDlgName').focus();
}
$$('[data-add]').forEach((b) => (b.onclick = () => openChannelDialog(b.dataset.add)));
const fixName = (type, name) => (type === 'text' ? name.toLowerCase().replace(/\s+/g, '-') : name).slice(0, 40);
$('#chDlgSave').onclick = () => {
  const name = cleanName($('#chDlgName').value.slice(0, 40));
  if (!name) return $('#chDlgName').focus();
  const { type, existing } = chDlgState;
  if (existing) put({ ...existing, name: fixName(type, name) });
  else {
    const order = Math.max(0, ...all('ch').map((c) => c.order)) + 1;
    const id = 'c:' + randId();
    put({ k: 'ch', id, name: fixName(type, name), type, order });
    if (type === 'text') openView(id);
  }
  closeDialog($('#channelDlg'));
};
$('#chDlgName').onkeydown = (e) => e.key === 'Enter' && $('#chDlgSave').click();
$('#chDlgDelete').onclick = () => {
  const c = chDlgState.existing;
  if (c.type === 'text' && channels('text').length <= 1) return toast('O grupo precisa de pelo menos um canal de texto');
  if (c.type === 'voice' && voiceMembers(c.id).length) return toast('Tem gente nesse canal de voz');
  if (!confirm(`Apagar "${c.name}"?`)) return;
  put({ ...c, del: true });
  closeDialog($('#channelDlg'));
};

// ============================================================ grupo, convite, configurações
$('#groupName').onclick = () => {
  const name = $('#groupName');
  if (name.querySelector('input')) return;
  const inp = el('input');
  inp.value = groupName();
  inp.maxLength = 32;
  name.replaceChildren(inp);
  inp.focus();
  inp.select();
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    if (save && cleanName(inp.value) && cleanName(inp.value) !== groupName()) put({ k: 'grp', id: 'grp', name: cleanName(inp.value) });
    renderSidebar();
  };
  inp.onkeydown = (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  };
  inp.onblur = () => finish(true);
};

const inviteCode = () => 'JANJA-' + R.key.match(/.{1,4}/g).join('-');
// o código vai depois do #: a página do convite nunca o envia a nenhum servidor
const INVITE_PAGE = 'https://romeu-q.github.io/janjahaters-app/';
const inviteLink = () => INVITE_PAGE + '#' + inviteCode();
$('#btnInvite').onclick = () => {
  $('#inviteLink').value = inviteLink();
  $('#inviteCode').value = inviteCode();
  openDialog($('#inviteDlg'));
};
$('#btnCopyLink').onclick = async () => {
  await navigator.clipboard.writeText(inviteLink());
  toast('Link copiado. Manda pros amigos!');
};
$('#btnCopyCode').onclick = async () => {
  await navigator.clipboard.writeText(inviteCode());
  toast('Código copiado');
};
$$('[data-close]').forEach((b) => (b.onclick = () => closeDialog(b.closest('dialog'))));

function colorPicker(box, current, onPick) {
  box.replaceChildren();
  for (const c of COLORS) {
    const b = el('button', c === current ? 'sel' : '');
    b.type = 'button';
    b.style.background = c;
    b.onclick = () => {
      onPick(c);
      box.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b));
      animate(b, { scale: [0.8, 1] }, { type: 'spring', stiffness: 500, damping: 15 });
    };
    box.append(b);
  }
}

let testStream = null;
let testTimer = null;
let pendingColor = me.color;
async function fillDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
  const fill = (sel, kind, value) => {
    sel.replaceChildren(new Option('Padrão do Windows', ''));
    devices
      .filter((d) => d.kind === kind && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications')
      .forEach((d, i) => sel.append(new Option(d.label || `Dispositivo ${i + 1}`, d.deviceId)));
    sel.value = value;
  };
  fill($('#stMic'), 'audioinput', settings.mic);
  fill($('#stOut'), 'audiooutput', settings.out);
}
// teste do mic com as opções escolhidas na tela (antes de salvar), para ouvir a diferença
let testAudio = null;
const testOpts = () => ({ noise: $('#stNoise').value, echo: $('#stEcho').checked });
async function startMicTest() {
  stopMicTest();
  try {
    const m = await getMic($('#stMic').value, testOpts());
    testStream = m;
    const ctx = audioCtx();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    ctx.createMediaStreamSource(m.stream).connect(an);
    const meterData = { an, buf: new Uint8Array(512) };
    testTimer = setInterval(() => ($('#micMeter').style.width = Math.min(100, level(meterData) * 4) + '%'), 80);
    if ($('#stHear').checked) {
      testAudio = new Audio();
      testAudio.srcObject = m.stream;
      if (settings.out) testAudio.setSinkId?.(settings.out).catch(() => {});
      testAudio.play().catch(() => {});
    }
  } catch {}
}
function stopMicTest() {
  clearInterval(testTimer);
  if (testAudio) {
    testAudio.pause();
    testAudio.srcObject = null;
    testAudio = null;
  }
  testStream?.stop();
  testStream = null;
  $('#micMeter').style.width = '0';
}
$('#btnSettings').onclick = async () => {
  renderGoogleAcc();
  $('#stName').value = me.name;
  pendingColor = me.color;
  colorPicker($('#stColors'), me.color, (c) => (pendingColor = c));
  $('#stNoise').value = settings.noise;
  $('#stEcho').checked = settings.echo;
  $('#stHear').checked = false;
  $('#stSounds').checked = settings.sounds;
  await fillDevices();
  openDialog($('#settingsDlg'));
  startMicTest();
};
$('#stMic').onchange = $('#stNoise').onchange = $('#stEcho').onchange = $('#stHear').onchange = startMicTest;
$('#settingsDlg').addEventListener('close', stopMicTest);
$('#btnSaveSettings').onclick = async () => {
  me.name = cleanName($('#stName').value) || me.name;
  me.color = pendingColor;
  store.set('profile', me);
  const micChanged = settings.mic !== $('#stMic').value || settings.noise !== $('#stNoise').value || settings.echo !== $('#stEcho').checked;
  settings.mic = $('#stMic').value;
  settings.out = $('#stOut').value;
  settings.noise = $('#stNoise').value;
  settings.echo = $('#stEcho').checked;
  settings.sounds = $('#stSounds').checked;
  saveSettings();
  for (const p of peers.values()) for (const a of p.audios.values()) a.setSinkId?.(settings.out).catch(() => {});
  audioCtx()
    .setSinkId?.(settings.out)
    .catch(() => {});
  closeDialog($('#settingsDlg'));
  if (micChanged && C.ch) {
    try {
      const next = await getMic();
      C.micStop?.();
      C.mic = next.stream;
      C.micStop = next.stop;
      applyMicEnabled();
      meter('me', next.stream);
      syncMedia();
    } catch (err) {
      toast('Não consegui trocar o microfone: ' + err.message);
    }
  }
  sendHi();
  renderPresence();
};
// ----- conta Google (opcional): nome e foto, com selo conferido pelos amigos -----
const ipcError = (err) => String(err?.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
const GOOGLE_PIC = /^https:\/\/[\w.-]+\.googleusercontent\.com\//;
let googleBusy = null;
async function googleLogin(btn) {
  if (!window.desk?.googleLogin) return null;
  const label = btn.lastElementChild;
  label.textContent = 'Continue no navegador…';
  const run = (googleBusy = window.desk.googleLogin(me.id));
  try {
    const g = await run;
    me.google = { idToken: g.idToken, email: g.email, picture: GOOGLE_PIC.test(g.picture) ? g.picture : '' };
    store.set('profile', me);
    renderGoogleAcc();
    if (R) {
      sendHi();
      renderPresence();
    }
    toast('Conta Google conectada: ' + g.email);
    return g;
  } catch (err) {
    if (googleBusy === run) toast(ipcError(err));
    return null;
  } finally {
    if (googleBusy === run) {
      googleBusy = null;
      renderGoogleAcc();
    }
  }
}
function googleLogout() {
  delete me.google;
  store.set('profile', me);
  renderGoogleAcc();
  if (R) {
    sendHi();
    renderPresence();
  }
}
function renderGoogleAcc() {
  const pairs = [
    [$('#suGoogle'), $('#suGoogleAcc'), 'Entrar com Google'],
    [$('#stGoogle'), $('#stGoogleAcc'), 'Conectar conta Google'],
  ];
  for (const [btn, acc, text] of pairs) {
    const g = me.google;
    btn.hidden = !!g;
    btn.lastElementChild.textContent = text;
    acc.hidden = !g;
    if (!g) continue;
    const out = el('button', 'icon-btn', null);
    out.type = 'button';
    out.title = 'Desconectar a conta Google';
    out.append(icon('log-out'));
    out.onclick = googleLogout;
    const txt = el('div', 'ga-text');
    txt.append(el('div', 'ga-title', 'Conta Google'), el('div', 'ga-mail', g.email));
    acc.replaceChildren(avatar(me.name || g.email, me.color, '', me.id), txt, out);
  }
}
$('#suGoogle').onclick = async () => {
  const g = await googleLogin($('#suGoogle'));
  if (g?.name && !cleanName($('#suName').value)) $('#suName').value = cleanName(g.name);
};
$('#stGoogle').onclick = async () => {
  const g = await googleLogin($('#stGoogle'));
  if (g?.name && !cleanName($('#stName').value)) $('#stName').value = cleanName(g.name);
};
renderGoogleAcc();

$('#btnLeaveGroup').onclick = () => {
  if (!confirm('Sair deste grupo? Você vai precisar do código de convite para voltar.')) return;
  leaveVoice();
  room?.leave();
  store.del('recs:' + R.hash);
  store.del('room');
  location.reload();
};

// barra de título
if (isDesktop) {
  $$('[data-win]').forEach((b) => (b.onclick = () => window.desk.win(b.dataset.win)));
} else $('#winButtons').hidden = true;

// atualização automática: o app baixa sozinho; aqui só oferece reiniciar
function showUpdate(version) {
  const b = $('#tbUpdate');
  $('#tbUpdateText').textContent = `Versão ${version} pronta. Reiniciar`;
  if (b.hidden) {
    b.hidden = false;
    springIn(b);
    toast(`Nova versão ${version} baixada. Clique no botão verde para atualizar.`);
  }
}
$('#tbUpdate').onclick = () => {
  if (C.ch && !confirm('Reiniciar agora vai te tirar da call. Atualizar mesmo assim?')) return;
  window.desk?.installUpdate();
};
if (window.desk?.appInfo) {
  window.desk.onUpdateReady(showUpdate);
  window.desk.appInfo().then(({ version, updateReady, google }) => {
    $('#appVersion').textContent = `janjahaters v${version}`;
    $$('[data-google]').forEach((e) => (e.hidden = !google));
    if (updateReady) showUpdate(updateReady);
  });
}

// ============================================================ entrada
function parseCode(s) {
  const k = String(s || '')
    .toUpperCase()
    .replace(/^\s*(JANJA|TOCA)/, '')
    .replace(/[^A-Z0-9]/g, '');
  return k.length >= 16 ? k : null;
}
function newKey() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return [...crypto.getRandomValues(new Uint8Array(20))].map((b) => abc[b % abc.length]).join('');
}

// invitedKey: veio de um link de convite, então só falta o nome
let invitedKey = null;
function showSetup() {
  const setup = $('#setup');
  setup.hidden = false;
  $('#suName').value = me.name;
  colorPicker($('#suColors'), me.color, (c) => (me.color = c));
  const sync = () => {
    if (invitedKey) $('input[name=suMode][value=join]').checked = true;
    const join = $('input[name=suMode]:checked').value === 'join';
    $('#suInviteNote').hidden = !invitedKey;
    $('#suSeg').hidden = !!invitedKey;
    $('#suCodeLabel').hidden = !join || !!invitedKey;
    $('#suGroupLabel').hidden = join;
  };
  $$('input[name=suMode]').forEach((r) => (r.onchange = sync));
  sync();
  animate(setup.querySelector('.card'), { opacity: [0, 1], y: [24, 0], scale: [0.97, 1] }, { type: 'spring', stiffness: 260, damping: 24 });
}
$('#setupForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = cleanName($('#suName').value);
  if (!name) return ($('#suError').textContent = 'Escolha um nome.');
  const join = $('input[name=suMode]:checked').value === 'join';
  const key = invitedKey || (join ? parseCode($('#suCode').value) : newKey());
  if (!key) {
    $('#suError').textContent = 'Código inválido. Confira o que te mandaram.';
    return animate($('#setupForm'), { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.35 });
  }
  me.name = name;
  store.set('profile', me);
  R = { key, hash: (await sha256('toca-room:' + key)).slice(0, 40) };
  store.set('room', R);
  await animate($('#setup'), { opacity: 0 }, { duration: 0.2 });
  $('#setup').hidden = true;
  start();
  if (!join) {
    put({ k: 'grp', id: 'grp', name: cleanName($('#suGroup').value) || `Grupo de ${name}` });
    $('#btnInvite').click();
  }
};

function start() {
  for (const r of store.get('recs:' + R.hash, [])) if (validRec(r)) recs.set(r.id, r);
  for (const r of recs.values()) clock = Math.max(clock, Math.min(r.v, Date.now()));
  seed();
  connectRoom();
  openView(store.get('view:' + R.hash, 'c:geral'));
  renderPresence();
  renderMusic();
  renderSounds();
  setInterval(sendHi, 15_000);
}

window.addEventListener('beforeunload', () => {
  if (C.ch) leaveVoice();
  room?.leave();
});

window.__toca = { peers, C, recs, Y }; // para depurar pelo DevTools (Ctrl+Shift+I)

hydrateIcons();
// ----- convite por link (janjahaters://join/CODIGO) -----
async function onInvite(code) {
  const key = parseCode(code);
  if (!key) return toast('Esse convite não é válido');
  if (R?.key === key) return toast('Você já está nesse grupo');
  if (!R?.key) {
    invitedKey = key;
    if ($('#setup').hidden) showSetup();
    else $('input[name=suMode]').dispatchEvent(new Event('change'));
    $('#suName').focus();
    return;
  }
  if (!confirm('Você recebeu um convite para outro grupo. Sair do grupo atual e entrar no novo?')) return;
  leaveVoice();
  room?.leave();
  R = { key, hash: (await sha256('toca-room:' + key)).slice(0, 40) };
  store.set('room', R);
  location.reload();
}

(async () => {
  const code = await window.desk?.takeInvite?.();
  window.desk?.onInvite?.((c) => {
    window.desk.takeInvite(); // já tratado aqui
    onInvite(c);
  });
  if (code && !R?.key) invitedKey = parseCode(code);
  if (me.name && R?.key) {
    start();
    if (code) onInvite(code);
  } else showSetup();
})();
