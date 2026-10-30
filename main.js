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
const MIME = { '.wasm': 'application/wasm', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

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

// a janela abre do tamanho e no lugar em que foi fechada
const BOUNDS_FILE = path.join(app.getPath('userData'), 'window.json');
function savedBounds() {
  try {
    const b = JSON.parse(fs.readFileSync(BOUNDS_FILE, 'utf8'));
    const { screen } = require('electron');
    // só usa se ainda couber em algum monitor (o monitor pode ter sido desligado)
    const visible = screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return b.x < a.x + a.width - 100 && b.x + b.width > a.x + 100 && b.y >= a.y - 10 && b.y < a.y + a.height - 100;
    });
    return visible ? b : null;
  } catch {
    return null;
  }
}
function keepBounds() {
  let t;
  const save = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (!win || win.isDestroyed() || win.isMinimized()) return;
      try {
        fs.writeFileSync(BOUNDS_FILE, JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() }));
      } catch {}
    }, 400);
  };
  for (const ev of ['resize', 'move', 'maximize', 'unmaximize']) win.on(ev, save);
}

function createWindow() {
  const saved = savedBounds();
  win = new BrowserWindow({
    width: saved?.width || 1320,
    height: saved?.height || 820,
    ...(saved ? { x: saved.x, y: saved.y } : {}),
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
  if (saved?.maximized) win.maximize();
  keepBounds();
  win.loadURL(`http://localhost:${UI_PORT}/`);
  // aberto pelo "iniciar com o Windows": fica só na bandeja
  win.once('ready-to-show', () => !(process.argv.includes('--hidden') && prefs().tray) && win.show());
  // com a bandeja ligada, o X só esconde a janela (a call e a música continuam)
  win.on('close', (e) => {
    if (quitting || !prefs().tray) return;
    e.preventDefault();
    win.hide();
  });
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

// ----- convite por link: janjahaters://join/CODIGO -----
// A página do convite (GitHub Pages) abre esse endereço; o Windows chama o app com ele nos argumentos.
const PROTOCOL = 'janjahaters';
// só o app instalado se registra (o instalador também registra); o modo de desenvolvimento não toma o lugar dele
if (app.isPackaged) app.setAsDefaultProtocolClient(PROTOCOL);
let pendingInvite = null;
function inviteFrom(argv) {
  const url = argv.find((a) => String(a).toLowerCase().startsWith(PROTOCOL + '://'));
  const m = url && decodeURIComponent(url).match(/join\/?([A-Za-z0-9-]{16,60})/);
  return m ? m[1] : null;
}
function deliverInvite(code) {
  if (!code) return;
  pendingInvite = code;
  if (win && !win.webContents.isLoading()) win.webContents.send('invite', code);
}
deliverInvite(inviteFrom(process.argv));
ipcMain.handle('take-invite', () => {
  const code = pendingInvite;
  pendingInvite = null;
  return code;
});

app.on('second-instance', (e, argv) => {
  if (!win) return;
  showWindow();
  deliverInvite(inviteFrom(argv));
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

// ----- atualização pelas Releases do GitHub (só no app instalado) -----
// Procura uma vez ao abrir o app; depois, só quando a pessoa clica em "Procurar atualizações".
let updateReady = null;
let updater = null;
let checking = null;
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  const { autoUpdater } = require('electron-updater');
  updater = autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // se não reiniciar agora, instala ao fechar
  autoUpdater.on('download-progress', (p) => win?.webContents.send('update-progress', Math.round(p.percent)));
  autoUpdater.on('update-downloaded', (info) => {
    updateReady = info.version;
    win?.webContents.send('update-ready', info.version);
  });
  autoUpdater.on('error', (err) => console.warn('atualização:', err?.message));
  checkForUpdates().catch(() => {});
}
// resposta: { status: 'dev' | 'latest' | 'downloading' | 'ready', version }
async function checkForUpdates() {
  if (!updater) return { status: 'dev', version: app.getVersion() };
  if (updateReady) return { status: 'ready', version: updateReady };
  checking ||= updater.checkForUpdates().finally(() => (checking = null));
  const res = await checking;
  const next = res?.isUpdateAvailable ? res.updateInfo?.version : null;
  if (updateReady) return { status: 'ready', version: updateReady };
  return next ? { status: 'downloading', version: next } : { status: 'latest', version: app.getVersion() };
}
app.whenReady().then(setupAutoUpdate);
ipcMain.handle('check-update', async () => {
  try {
    return await checkForUpdates();
  } catch (err) {
    throw new Error('Não consegui falar com o GitHub: ' + (err?.message || err));
  }
});
ipcMain.on('install-update', () => {
  quitting = true;
  updater?.quitAndInstall(true, true);
});
ipcMain.handle('app-info', () => ({ version: app.getVersion(), updateReady, google: !!oauthConfig(), prefs: prefs() }));

// ----- bandeja, atalhos globais e iniciar com o Windows -----
const { Tray, Menu, globalShortcut, nativeImage } = require('electron');
const PREFS_FILE = path.join(app.getPath('userData'), 'desktop-prefs.json');
const PREF_DEFAULTS = { tray: true, hotkeys: true, autostart: false };
let prefsCache = null;
function prefs() {
  if (!prefsCache) {
    try {
      prefsCache = { ...PREF_DEFAULTS, ...JSON.parse(fs.readFileSync(PREFS_FILE, 'utf8')) };
    } catch {
      prefsCache = { ...PREF_DEFAULTS };
    }
  }
  return prefsCache;
}
let quitting = false;
let tray = null;
const HOTKEYS = { 'CommandOrControl+Shift+M': 'mute', 'CommandOrControl+Shift+D': 'deafen' };

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
function applyPrefs() {
  const p = prefs();
  globalShortcut.unregisterAll();
  if (p.hotkeys) for (const [accel, action] of Object.entries(HOTKEYS)) globalShortcut.register(accel, () => win?.webContents.send('hotkey', action));
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!p.autostart, args: ['--hidden'] });
  if (p.tray && !tray) {
    tray = new Tray(nativeImage.createFromBuffer(fs.readFileSync(path.join(__dirname, 'renderer', 'icon.png'))).resize({ width: 16, height: 16 }));
    tray.setToolTip('janjahaters');
    tray.on('click', showWindow);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Abrir janjahaters', click: showWindow },
        { type: 'separator' },
        { label: 'Mutar / desmutar microfone', click: () => win?.webContents.send('hotkey', 'mute') },
        { label: 'Ensurdecer / voltar a ouvir', click: () => win?.webContents.send('hotkey', 'deafen') },
        { label: 'Procurar atualizações', click: () => (showWindow(), win?.webContents.send('hotkey', 'check-update')) },
        { type: 'separator' },
        {
          label: 'Sair',
          click: () => {
            quitting = true;
            app.quit();
          },
        },
      ]),
    );
  } else if (!p.tray && tray) {
    tray.destroy();
    tray = null;
  }
}
ipcMain.handle('set-prefs', (e, next) => {
  const p = prefs();
  for (const k of Object.keys(PREF_DEFAULTS)) if (typeof next?.[k] === 'boolean') p[k] = next[k];
  try {
    fs.writeFileSync(PREFS_FILE, JSON.stringify(p));
  } catch {}
  applyPrefs();
  return p;
});
app.whenReady().then(applyPrefs);
app.on('before-quit', () => (quitting = true));
app.on('will-quit', () => globalShortcut.unregisterAll());

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
const yt = require('./yt');
ipcMain.handle('yt-search', async (e, query) => yt.search(await ytClient(), query));
ipcMain.handle('yt-related', async (e, id) => yt.related(await ytClient(), id));

// ----- login com Google (OAuth para apps de desktop: navegador + retorno em 127.0.0.1 + PKCE) -----
// O ID e o "segredo" do cliente vêm de oauth.json (gerado pelo workflow a partir dos secrets do GitHub)
// ou das variáveis GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. Em app de desktop o Google não trata o segredo como sigiloso.
const crypto = require('crypto');
function oauthConfig() {
  let file = {};
  try {
    file = JSON.parse(fs.readFileSync(path.join(__dirname, 'oauth.json'), 'utf8'));
  } catch {}
  // valores colados no GitHub costumam vir com espaço ou quebra de linha no fim
  const id = String(process.env.GOOGLE_CLIENT_ID || file.clientId || '').trim();
  const secret = String(process.env.GOOGLE_CLIENT_SECRET || file.clientSecret || '').trim();
  return id && secret ? { id, secret } : null;
}
const b64url = (buf) => buf.toString('base64url');
const nonceFor = (uid) => crypto.createHash('sha256').update('janja-google:' + uid).digest('hex');
const jwtPart = (token, i) => JSON.parse(Buffer.from(String(token).split('.')[i] || '', 'base64url').toString('utf8'));

const DONE_PAGE = (ok) =>
  `<!doctype html><meta charset="utf-8"><title>janjahaters</title><body style="margin:0;height:100vh;display:grid;place-items:center;background:#141619;color:#e4e6ea;font:16px 'Segoe UI',sans-serif"><div style="text-align:center"><h2>${
    ok ? 'Pronto! Pode voltar para o janjahaters.' : 'O login não deu certo.'
  }</h2><p style="color:#8b929c">Você já pode fechar esta aba.</p></div>`;

let loginInProgress = null;
ipcMain.handle('google-login', (e, uid) => {
  const cfg = oauthConfig();
  if (!cfg) throw new Error('O login com Google não foi configurado nesta versão do app.');
  loginInProgress?.cancel();
  return new Promise((resolve, reject) => {
    const verifier = b64url(crypto.randomBytes(48));
    const state = b64url(crypto.randomBytes(16));
    let redirect;
    const finish = (err, val) => {
      clearTimeout(timer);
      server.close();
      loginInProgress = null;
      win?.show();
      win?.focus();
      err ? reject(err) : resolve(val);
    };
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, redirect);
      if (url.pathname !== '/') return res.writeHead(404).end();
      const code = url.searchParams.get('code');
      if (url.searchParams.get('state') !== state || !code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' }).end(DONE_PAGE(false));
        return finish(new Error(url.searchParams.get('error') === 'access_denied' ? 'Login cancelado.' : 'Resposta inválida do Google.'));
      }
      try {
        const r = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ code, client_id: cfg.id, client_secret: cfg.secret, redirect_uri: redirect, grant_type: 'authorization_code', code_verifier: verifier }),
        });
        const tok = await r.json();
        if (!tok.id_token) throw new Error(tok.error_description || tok.error || 'O Google não devolveu o login.');
        // veio direto do Google por HTTPS, então dá para ler sem verificar a assinatura aqui
        const p = jwtPart(tok.id_token, 1);
        if (p.nonce !== nonceFor(uid)) throw new Error('Resposta inválida do Google.');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(DONE_PAGE(true));
        finish(null, { idToken: tok.id_token, sub: p.sub, email: p.email, name: p.given_name || p.name || '', picture: p.picture || '' });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' }).end(DONE_PAGE(false));
        finish(err);
      }
    });
    const timer = setTimeout(() => finish(new Error('O login demorou demais. Tente de novo.')), 5 * 60 * 1000);
    loginInProgress = { cancel: () => finish(new Error('Login cancelado.')) };
    server.listen(0, '127.0.0.1', () => {
      redirect = `http://127.0.0.1:${server.address().port}`;
      const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      auth.search = new URLSearchParams({
        client_id: cfg.id,
        redirect_uri: redirect,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce: nonceFor(uid),
        code_challenge: b64url(crypto.createHash('sha256').update(verifier).digest()),
        code_challenge_method: 'S256',
        prompt: 'select_account',
      });
      shell.openExternal(auth.toString());
    });
  });
});
ipcMain.on('google-cancel', () => loginInProgress?.cancel());

// Confere o login que um amigo mandou: assinatura do Google, feito para este app e ligado ao ID dele no grupo.
let googleKeys = null;
async function googleKey(kid) {
  if (!googleKeys || Date.now() - googleKeys.at > 6 * 3600_000 || !googleKeys.keys[kid]) {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    const { keys } = await r.json();
    googleKeys = { at: Date.now(), keys: Object.fromEntries(keys.map((k) => [k.kid, crypto.createPublicKey({ key: k, format: 'jwk' })])) };
  }
  return googleKeys.keys[kid];
}
const verified = new Map(); // token -> resultado
ipcMain.handle('google-verify', async (e, token, uid) => {
  const cfg = oauthConfig();
  if (!cfg || typeof token !== 'string' || token.length > 4096 || typeof uid !== 'string') return null;
  const cacheKey = token + '|' + uid;
  if (verified.has(cacheKey)) return verified.get(cacheKey);
  let out = null;
  try {
    const [h, p, s] = token.split('.');
    const head = jwtPart(token, 0);
    const body = jwtPart(token, 1);
    const key = head.alg === 'RS256' && (await googleKey(head.kid));
    const okSig = key && crypto.verify('RSA-SHA256', Buffer.from(h + '.' + p), key, Buffer.from(s, 'base64url'));
    // o vencimento (1 h) é ignorado: o token serve como "carteirinha" assinada pelo Google
    if (okSig && body.aud === cfg.id && /^(https:\/\/)?accounts\.google\.com$/.test(body.iss) && body.nonce === nonceFor(uid)) {
      out = { sub: body.sub, email: body.email, picture: /^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(body.picture || '') ? body.picture : '' };
    }
  } catch {}
  if (verified.size > 500) verified.clear();
  verified.set(cacheKey, out);
  return out;
});

ipcMain.on('open-external', (e, url) => {
  if (/^https:\/\//.test(url)) shell.openExternal(url);
});

ipcMain.on('win', (e, cmd) => {
  if (!win) return;
  if (cmd === 'min') win.minimize();
  else if (cmd === 'max') win.isMaximized() ? win.unmaximize() : win.maximize();
  else if (cmd === 'close') win.close();
  else if (cmd === 'quit') {
    quitting = true;
    app.quit();
  }
});

ipcMain.on('flash', () => {
  if (win && !win.isFocused()) win.flashFrame(true);
});
