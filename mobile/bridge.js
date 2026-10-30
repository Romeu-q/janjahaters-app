// App Android (Capacitor): faz no celular o papel do main.js/preload.js do PC.
// Carrega antes do bundle.js e monta o mesmo `window.desk` que a interface já usa.
import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Innertube } from 'youtubei.js/web';
import yt from '../yt.js';

/* global __APP_VERSION__, __GOOGLE_CLIENT_ID__ */
const VERSION = __APP_VERSION__;
const REPO = 'Romeu-q/janjahaters-app';
const native = Capacitor.isNativePlatform();
document.documentElement.classList.add('mobile');

// O navegador não deixa a página falar com o YouTube direto (CORS); no app as requisições saem pelo Android.
// (não recria um Request: além de o navegador tirar cabeçalhos, o YouTube recusa a busca montada assim)
async function nativeFetch(input, init = {}) {
  if (!native) return fetch(input, init);
  const isReq = input instanceof Request;
  const url = isReq ? input.url : String(input);
  const method = init.method || (isReq ? input.method : 'GET');
  const headers = {};
  new Headers(isReq ? input.headers : init.headers).forEach((v, k) => (headers[k] = v));
  const body = init.body ?? (isReq && method !== 'GET' && method !== 'HEAD' ? await input.text() : undefined);
  const r = await CapacitorHttp.request({ url, method, headers, data: body, responseType: 'text' });
  const text = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
  const outHeaders = {};
  for (const [k, v] of Object.entries(r.headers || {})) if (!/^content-(encoding|length)$/i.test(k)) outHeaders[k] = v;
  return new Response(r.status === 204 || r.status === 304 ? null : text, { status: r.status, headers: outHeaders });
}

let client = null;
const ytClient = () =>
  (client ||= Innertube.create({ retrieve_player: false, generate_session_locally: true, lang: 'pt', location: 'BR', fetch: nativeFetch }).catch((err) => {
    client = null;
    throw err;
  }));

// ----- convite por link: janjahaters://join/CODIGO -----
const inviteFrom = (url) => decodeURIComponent(String(url || '')).match(/^janjahaters:\/\/join\/?([A-Za-z0-9-]{16,60})/i)?.[1] || null;
let launchInvite = native ? App.getLaunchUrl().then((r) => inviteFrom(r?.url)) : Promise.resolve(null);

// ----- atualização: confere a última Release do GitHub e baixa o .apk novo -----
let update = null; // { version, url }
let onReady = null;
const newer = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
};
async function checkUpdate() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error('O GitHub respondeu ' + r.status);
  const rel = await r.json();
  const version = String(rel.tag_name || '').replace(/^v/, '');
  const apk = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
  if (apk && newer(version, VERSION)) {
    update = { version, url: apk.browser_download_url };
    onReady?.(version);
    return { status: 'ready', version };
  }
  return { status: 'latest', version: VERSION };
}

// ----- selo do Google dos amigos: confere a assinatura com o Web Crypto -----
const GOOGLE_ID = __GOOGLE_CLIENT_ID__;
const b64urlBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const jwtPart = (t, i) => JSON.parse(new TextDecoder().decode(b64urlBytes(String(t).split('.')[i] || '')));
const sha256hex = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
let certs = null;
const verified = new Map();
async function googleVerify(token, uid) {
  if (!GOOGLE_ID || typeof token !== 'string' || token.length > 4096 || typeof uid !== 'string') return null;
  const key = token + '|' + uid;
  if (verified.has(key)) return verified.get(key);
  let out = null;
  try {
    const [h, p, s] = token.split('.');
    const head = jwtPart(token, 0);
    const body = jwtPart(token, 1);
    if (!certs || !certs.keys.some((k) => k.kid === head.kid)) certs = await (await nativeFetch('https://www.googleapis.com/oauth2/v3/certs')).json();
    const jwk = certs.keys.find((k) => k.kid === head.kid);
    if (jwk && head.alg === 'RS256') {
      const pub = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pub, b64urlBytes(s), new TextEncoder().encode(h + '.' + p));
      if (ok && body.aud === GOOGLE_ID && /^(https:\/\/)?accounts\.google\.com$/.test(body.iss) && body.nonce === (await sha256hex('janja-google:' + uid))) {
        out = { sub: body.sub, email: body.email, picture: /^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(body.picture || '') ? body.picture : '' };
      }
    }
  } catch {}
  verified.set(key, out);
  return out;
}

// ----- call com a tela desligada: serviço em primeiro plano (notificação "Na call") -----
const CallService = registerPlugin('CallService');

const listeners = [];
window.desk = {
  platform: 'android',
  sources: async () => [],
  pick: async () => {},
  ytSearch: async (q) => yt.search(await ytClient(), q),
  ytRelated: async (id) => yt.related(await ytClient(), id),
  openExternal: (url) => /^https:\/\//.test(url) && Browser.open({ url }),
  win: () => {},
  flash: () => {},
  takeInvite: async () => {
    const code = await launchInvite;
    launchInvite = Promise.resolve(null);
    return code;
  },
  onInvite: (fn) =>
    native &&
    App.addListener('appUrlOpen', (e) => {
      const code = inviteFrom(e.url);
      if (code) fn(code);
    }),
  appInfo: async () => ({ version: VERSION, updateReady: update?.version || null, google: false, prefs: { tray: false, hotkeys: false, autostart: false } }),
  onUpdateReady: (fn) => (onReady = fn),
  onUpdateProgress: () => {},
  checkUpdate,
  installUpdate: () => update && Browser.open({ url: update.url }),
  setPrefs: async (p) => p,
  onHotkey: (fn) => listeners.push(fn),
  googleVerify,
  onMaximized: () => {},
  callActive: (on, channel) => native && (on ? CallService.start({ title: 'Na call', text: channel || 'janjahaters' }) : CallService.stop()).catch(() => {}),
  backButton: (fn) => native && App.addListener('backButton', fn),
  minimize: () => native && App.minimizeApp(),
};

// procura atualização ao abrir, como no PC
setTimeout(() => checkUpdate().catch(() => {}), 4000);
