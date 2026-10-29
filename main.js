'use strict';
const { app, BrowserWindow, ipcMain, desktopCapturer, shell, session } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Para testar dois "amigos" na mesma máquina: $env:JANJA_PROFILE='2'; npx electron .
const PROFILE = Number(process.env.JANJA_PROFILE) || 0;
if (PROFILE) app.setPath('userData', app.getPath('userData') + '-' + PROFILE);

if (!app.requestSingleInstanceLock()) app.quit();

// Em alguns PCs (antivírus/drivers) o sandbox da GPU derruba o processo de GPU na hora.
// Se isso acontecer, o app lembra e reabre sem esse sandbox; nos outros PCs ele continua ligado.
const GPU_FLAG = path.join(app.getPath('userData'), 'gpu-no-sandbox');
if (fs.existsSync(GPU_FLAG)) app.commandLine.appendSwitch('disable-gpu-sandbox');
app.on('child-process-gone', (e, details) => {
  if (details.type !== 'GPU' || fs.existsSync(GPU_FLAG) || details.reason === 'clean-exit' || details.reason === 'killed') return;
  try {
    fs.mkdirSync(path.dirname(GPU_FLAG), { recursive: true });
    fs.writeFileSync(GPU_FLAG, details.reason);
  } catch {
    return;
  }
  app.relaunch();
  app.exit(0);
});

// A interface é servida em http://127.0.0.1 (porta fixa para o localStorage não se perder):
// o player do YouTube não funciona a partir de file://.
const UI_PORT = 47610 + PROFILE;
const RENDERER = path.join(__dirname, 'renderer');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

// O YouTube recusa embed vindo de um IP (erro 150), então a janela abre em "localhost".
// Escuta só no loopback (IPv4 e, se existir, IPv6), nunca na rede.
function serveFile(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const file = path.normalize(path.join(RENDERER, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!file.startsWith(RENDERER + path.sep) || !MIME[path.extname(file)]) return res.writeHead(404).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)], 'Cache-Control': 'no-store' }).end(data);
  });
}
function listen(host) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(serveFile);
    server.once('error', reject);
    server.listen(UI_PORT, host, () => resolve(server));
  });
}
async function startUiServer() {
  await listen('127.0.0.1');
  await listen('::1').catch(() => {}); // máquina sem IPv6
}

let win;
let pickedSource = null; // { id, audio } escolhido no seletor de tela do app

function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 820,
    minWidth: 1000,
    minHeight: 620,
    frame: false,
    backgroundColor: '#141619',
    title: 'janjahaters',
    icon: path.join(__dirname, 'renderer', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false, // a call e a música continuam com a janela minimizada
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  win.loadURL(`http://localhost:${UI_PORT}/`);
  win.once('ready-to-show', () => win.show());
  win.on('maximize', () => win.webContents.send('maximized', true));
  win.on('unmaximize', () => win.webContents.send('maximized', false));
  win.on('focus', () => win.flashFrame(false));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`http://localhost:${UI_PORT}/`)) e.preventDefault();
  });
}

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(async () => {
  const allowed = new Set(['media', 'display-capture', 'notifications', 'clipboard-sanitized-write', 'fullscreen']);
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(allowed.has(permission)));
  session.defaultSession.setPermissionCheckHandler((wc, permission) => allowed.has(permission));

  // getDisplayMedia() usa a fonte escolhida no seletor de tela do app
  session.defaultSession.setDisplayMediaRequestHandler(async (request, cb) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
      const source = sources.find((s) => s.id === pickedSource?.id);
      if (!source) return cb({});
      cb(pickedSource.audio ? { video: source, audio: 'loopback' } : { video: source });
    } catch {
      cb({});
    }
  });

  try {
    await startUiServer();
  } catch (err) {
    console.error(`Não consegui abrir a porta ${UI_PORT}:`, err.message);
    app.quit();
    return;
  }
  createWindow();
});

app.on('window-all-closed', () => app.quit());

// ----- atualização automática pelas Releases do GitHub (só no app instalado) -----
let updateReady = null;
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  const { autoUpdater } = require('electron-updater');
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // se não reiniciar agora, instala ao fechar
  autoUpdater.on('update-downloaded', (info) => {
    updateReady = info.version;
    win?.webContents.send('update-ready', info.version);
  });
  autoUpdater.on('error', (err) => console.warn('atualização:', err?.message));
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  check();
  setInterval(check, 30 * 60 * 1000);
  ipcMain.on('install-update', () => autoUpdater.quitAndInstall(true, true));
}
app.whenReady().then(setupAutoUpdate);
ipcMain.handle('app-info', () => ({ version: app.getVersion(), updateReady }));

ipcMain.handle('sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true,
  });
  return sources
    .filter((s) => s.name !== 'janjahaters')
    .map((s) => ({
      id: s.id,
      name: s.name,
      screen: s.id.startsWith('screen:'),
      thumb: s.thumbnail.toDataURL(),
      icon: s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : null,
    }));
});

ipcMain.handle('pick', (e, id, audio) => {
  pickedSource = { id, audio: !!audio };
});

// Busca no YouTube Music (sem chave de API) pela mesma interface que o site usa
let innertube = null;
function ytClient() {
  innertube ||= import('youtubei.js')
    .then(({ Innertube }) => Innertube.create({ retrieve_player: false, generate_session_locally: true, lang: 'pt', location: 'BR' }))
    .catch((err) => {
      innertube = null;
      throw err;
    });
  return innertube;
}
function mapResults(res) {
  const shelf = res?.contents?.find((c) => Array.isArray(c?.contents)) || res?.contents?.[0];
  return (shelf?.contents || [])
    .filter((i) => typeof i?.id === 'string' && /^[\w-]{11}$/.test(i.id))
    .map((i) => ({
      id: i.id,
      title: String(i.title || '').slice(0, 200),
      artist: (i.artists || i.authors || [])
        .map((a) => a?.name)
        .filter(Boolean)
        .join(', ')
        .slice(0, 100),
      album: String(i.album?.name || '').slice(0, 100),
      dur: (i.duration?.seconds || 0) * 1000,
      thumb: i.thumbnail?.contents?.[0]?.url || '',
    }));
}
ipcMain.handle('yt-search', async (e, query) => {
  const q = String(query || '')
    .trim()
    .slice(0, 100);
  if (!q) return [];
  const client = await ytClient();
  const [songs, videos] = await Promise.allSettled([client.music.search(q, { type: 'song' }), client.music.search(q, { type: 'video' })]);
  const list = [
    ...(songs.status === 'fulfilled' ? mapResults(songs.value).slice(0, 6).map((r) => ({ ...r, kind: 'song' })) : []),
    ...(videos.status === 'fulfilled' ? mapResults(videos.value).slice(0, 4).map((r) => ({ ...r, kind: 'video' })) : []),
  ];
  if (!list.length && songs.status === 'rejected') throw songs.reason;
  return list;
});

ipcMain.on('open-external', (e, url) => {
  if (/^https:\/\//.test(url)) shell.openExternal(url);
});

ipcMain.on('win', (e, cmd) => {
  if (!win) return;
  if (cmd === 'min') win.minimize();
  else if (cmd === 'max') win.isMaximized() ? win.unmaximize() : win.maximize();
  else if (cmd === 'close') win.close();
});

ipcMain.on('flash', () => {
  if (win && !win.isFocused()) win.flashFrame(true);
});
