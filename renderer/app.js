import { joinRoom, selfId } from 'trystero';
import { animate, stagger } from 'motion';
import { loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import {
  createElement,
  ArrowDown,
  AudioLines,
  Check,
  PictureInPicture2,
  RefreshCw,
  Reply,
  BadgeCheck,
  Brush,
  Image as ImageIcon,
  Pin,
  Shuffle,
  Infinity as InfinityIcon,
  Palette,
  Puzzle,
  User,
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
function wrapEl(tag, cls, ...kids) {
  const e = el(tag, cls);
  e.append(...kids);
  return e;
}
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
const isMobile = window.desk?.platform === 'android'; // app Android (mobile/bridge.js)
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
  'arrow-down': ArrowDown,
  'audio-lines': AudioLines,
  check: Check,
  pip: PictureInPicture2,
  refresh: RefreshCw,
  reply: Reply,
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
  brush: Brush,
  image: ImageIcon,
  pin: Pin,
  shuffle: Shuffle,
  infinity: InfinityIcon,
  palette: Palette,
  puzzle: Puzzle,
  user: User,
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

// uid: usa o avatar escolhido no perfil (arquivo P2P) ou a foto conferida da conta Google,
// e a decoração do perfil
const avatarMiss = new Map(); // arquivo de avatar que ninguém online tem: não pergunta de novo por 30 s
function avatar(name, color, cls = '', uid) {
  const a = el('span', 'avatar ' + cls, (name || '?').trim()[0] || '?');
  a.style.background = color;
  if (!uid) return a;
  if (uid === 'dj') {
    a.textContent = '';
    a.classList.add('dj-avatar');
    a.append(icon('disc-3'));
    return a;
  }
  const prof = profileOf(uid);
  const addImg = (src) => {
    const img = el('img');
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => img.remove();
    img.src = src;
    a.append(img);
  };
  if (prof.avatar && !(Date.now() - (avatarMiss.get(prof.avatar) || 0) < 30_000)) {
    if (blobUrls.has(prof.avatar)) addImg(blobUrls.get(prof.avatar));
    else
      fileUrl(prof.avatar, uid).then((url) => {
        if (url) addImg(url);
        else avatarMiss.set(prof.avatar, Date.now());
      });
  } else if (googleOf(uid)?.picture) addImg(googleOf(uid).picture);
  if (prof.deco && !(look.noFx && uid !== me.id)) {
    a.classList.add('deco', 'deco-' + prof.deco);
    a.style.setProperty('--deco', cleanColor(color));
  }
  return a;
}
// nome com a cor, fonte, degradê e efeito do perfil
function nameEl(name, color, uid, cls = '') {
  const s = el('span', ('uname ' + cls).trim(), name);
  const prof = uid ? profileOf(uid) : {};
  s.style.color = cleanColor(color);
  if (prof.font) s.classList.add('nf-' + prof.font);
  if (prof.grad) {
    s.classList.add('name-grad');
    s.style.setProperty('--n1', cleanColor(color));
    s.style.setProperty('--n2', prof.grad);
  }
  if (prof.nameFx && !(look.noFx && uid !== me.id)) s.classList.add('nfx-' + prof.nameFx);
  return s;
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
    stream: { preset: 'std', res: 1080, fps: 30, rate: 0, codec: 'auto', mode: 'balanced', audio: false, audioRate: 192 } },
  store.get('settings', {}),
);
if (typeof settings.noise === 'boolean') settings.noise = settings.noise ? 'strong' : 'off'; // versão 1.0 guardava sim/não
// aparência (só deste PC) e plugins ligados
const LOOK_DEFAULTS = { theme: 'padrao', accent: '', bg: '', dim: 50, blur: 0, glass: 25, font: 100, family: '', radius: '', compact: false, noAnim: false, noFx: false, css: '', themes: [] };
settings.look = { ...LOOK_DEFAULTS, ...settings.look };
settings.plugins = { ...settings.plugins };
settings.gate = { on: true, auto: true, db: -50, ...settings.gate }; // sensibilidade do mic
settings.localMute = { ...settings.localMute }; // uid -> silenciado só para mim
settings.streamMute = { ...settings.streamMute }; // uid -> som da stream dele mutado só para mim
settings.streamVolumes = { ...settings.streamVolumes }; // uid -> volume do áudio da stream
settings.mutedCh = { ...settings.mutedCh }; // canais sem notificação
const look = settings.look;
const plug = (id) => !!settings.plugins[id];
const saveSettings = () => store.set('settings', settings);
// contas Google conferidas dos amigos (uid -> { email, picture }), lembradas para as mensagens antigas
const googleUsers = store.get('googleUsers', {});
const googleOf = (uid) => (uid === me.id ? me.google : googleUsers[uid]) || null;

// ----- perfil personalizável (tipo Nitro, de graça): vai junto no "hi" para os amigos -----
const NAME_FONTS = ['serif', 'mono', 'round', 'hand', 'display', 'elegant'];
const NAME_FX = ['glow', 'shine', 'wave'];
const DECOS = ['ring', 'glow', 'rainbow', 'fire', 'ice', 'gold', 'pulse'];
const EFFECTS = ['sparkle', 'snow', 'hearts', 'stars', 'confetti'];
const cleanHex = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : '');
function cleanProfile(p) {
  if (!p || typeof p !== 'object') return {};
  const str = (s, n) => (typeof s === 'string' ? s.slice(0, n) : '');
  const pick = (v, list) => (list.includes(v) ? v : '');
  const fid = (v) => (typeof v === 'string' && /^f:[0-9a-f]{24}$/.test(v) ? v : '');
  const theme = Array.isArray(p.theme) && cleanHex(p.theme[0]) && cleanHex(p.theme[1]) ? [cleanHex(p.theme[0]), cleanHex(p.theme[1])] : null;
  return {
    avatar: fid(p.avatar),
    banner: fid(p.banner),
    bannerColor: cleanHex(p.bannerColor),
    bio: str(p.bio, 300),
    pronouns: str(p.pronouns, 40),
    status: str(p.status, 60),
    statusEmoji: str(p.statusEmoji, 16),
    theme,
    font: pick(p.font, NAME_FONTS),
    grad: cleanHex(p.grad),
    nameFx: pick(p.nameFx, NAME_FX),
    deco: pick(p.deco, DECOS),
    effect: pick(p.effect, EFFECTS),
  };
}
me.p = cleanProfile(me.p);
const profiles = store.get('profiles', {}); // uid -> perfil dos amigos (para mensagens antigas também)
const profileOf = (uid) => (uid === me.id ? me.p : profiles[uid]) || {};
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
const KINDS = new Set(['grp', 'ch', 'msg', 'q', 'pb', 'snd', 'rx']);
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
    if (cur?.k === 'msg' && !cur.del && plug('messageLogger')) logMessageChange(cur, r);
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
const messagesOf = (ch) => {
  let list = all('msg').filter((m) => m.ch === ch);
  if (plug('hideBot')) list = list.filter((m) => !m.bot);
  if (plug('messageLogger')) list = list.concat(Object.values(ghosts).filter((g) => g.ch === ch && recs.get(g.id)?.del));
  return list.sort((a, b) => a.ts - b.ts);
};
// plugin "Mensagens apagadas": guarda neste PC o texto antes de apagar/editar
const ghosts = {}; // id -> mensagem apagada
const editLog = {}; // id -> textos anteriores
function loadLogger() {
  if (!R) return;
  Object.assign(ghosts, store.get('ghosts:' + R.hash, {}));
  Object.assign(editLog, store.get('edits:' + R.hash, {}));
}
function logMessageChange(cur, next) {
  if (next.del && cur.uid !== me.id && (cur.text || cur.att?.length)) ghosts[cur.id] = { ...cur, ghost: true };
  else if (next.text !== cur.text && cur.text) editLog[cur.id] = [...(editLog[cur.id] || []), cur.text].slice(-5);
  else return;
  const trim = (o) => Object.keys(o).length > 300 && delete o[Object.keys(o)[0]];
  trim(ghosts);
  trim(editLog);
  store.set('ghosts:' + R.hash, ghosts);
  store.set('edits:' + R.hash, editLog);
}
const groupName = () => recs.get('grp')?.name || 'Grupo';

function onRecsChanged(list) {
  const kinds = new Set(list.map((r) => r.k));
  if (kinds.has('grp') || kinds.has('ch')) {
    if (S.view && !channel(S.view)) openView(channels('text')[0]?.id);
    renderSidebar();
    renderHeader();
  }
  if (kinds.has('rx')) refreshReactions(new Set(list.filter((r) => r.k === 'rx').map((r) => r.msg)));
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
      if (m.del || m.edited || m.uid === me.id) continue;
      const isCall = channel(m.ch)?.type === 'voice';
      if (isCall && m.ch === callChatCh() && currentTab !== 'chat') S.callUnread++;
      else if (!isCall && !shownIn.length && (!settings.mutedCh[m.ch] || mentionedMe(m.text))) S.unread.add(m.ch);
    }
    for (const box of rerender) renderChat(box, boxes.find((b) => b.box === box).ch, true);
    renderCallBadge();
    const notifyMsgs = fresh.filter((m) => !m.del && !m.edited && m.uid !== me.id && Date.now() - m.ts < 60_000 && myStatus() !== 'dnd' && (!settings.mutedCh[m.ch] || mentionedMe(m.text)));
    if (textChatCh() && document.hasFocus()) markRead(textChatCh());
    for (const m of notifyMsgs) pluginEmit('message', m);
    if (notifyMsgs.some((m) => mentionedMe(m.text) || (plug('mentions') && mentionsMe(m.text)))) {
      if (!plug('noTypingSounds')) sfx.msg();
      window.desk?.flash();
    } else if (notifyMsgs.length && (!document.hasFocus() || notifyMsgs.some((m) => !boxes.some((b) => b.ch === m.ch)) || (currentTab !== 'chat' && notifyMsgs.some((m) => m.ch === callChatCh())))) {
      if (!plug('noTypingSounds')) sfx.msg();
      window.desk?.flash();
    }
    renderSidebar();
  }
  if (kinds.has('q') || kinds.has('pb')) {
    checkDj();
    renderPresence();
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
const hiPayload = () => ({ user: { id: me.id, name: me.name, color: me.color, g: me.google?.idToken, p: me.p, st: myStatus() }, voice: myVoice() });
// guarda o perfil do amigo; se mudou, redesenha quem mostra avatar/nome
function updateProfile(uid, raw) {
  const prof = cleanProfile(raw);
  if (JSON.stringify(prof) === JSON.stringify(profiles[uid] || {})) return;
  profiles[uid] = prof;
  store.set('profiles', profiles);
  clearTimeout(updateProfile.t);
  updateProfile.t = setTimeout(() => {
    for (const box of chatBoxes()) renderChat(box.box, box.ch, true);
    renderPresence();
  }, 50);
}

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
  p.user = { id: String(d?.user?.id || pid).slice(0, 64), name: cleanName(d?.user?.name) || 'Anônimo', color: cleanColor(d?.user?.color), st: ['idle', 'dnd'].includes(d?.user?.st) ? d.user.st : 'online' };
  checkGoogle(p, d?.user?.g);
  updateProfile(p.user.id, d?.user?.p);
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
  if (!wasIn && isIn) {
    sfx.join();
    pluginEmit('join', { id: p.user.id, name: p.user.name, channel: C.ch });
  }
  if (wasIn && !isIn) {
    sfx.leave();
    pluginEmit('leave', { id: p.user.id, name: p.user.name, channel: C.ch });
  }
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
// Caminho do som: mic -> corta grave (batida na mesa/teclado) -> RNNoise -> portão (sensibilidade)
// -> limitador (segura estouro) -> amigos.
let gateLoaded;
const gateParams = (opts = settings) => ({ on: opts.gate.on, auto: opts.gate.auto, thr: opts.gate.db });
async function processMic(raw, opts = settings) {
  const stopRaw = () => raw.getTracks().forEach((t) => t.stop());
  micCtx ||= new AudioContext({ sampleRate: 48000 }); // o RNNoise trabalha em 48 kHz
  if (micCtx.state === 'suspended') await micCtx.resume();
  gateLoaded ||= micCtx.audioWorklet.addModule('gate-worklet.js').catch((err) => {
    gateLoaded = null;
    throw err;
  });
  const strong = opts.noise === 'strong';
  if (strong)
    rnnoiseLoaded ||= Promise.all([
      loadRnnoise({ url: 'vendor/rnnoise.wasm', simdUrl: 'vendor/rnnoise_simd.wasm' }).then((w) => (rnnoiseWasm = w)),
      micCtx.audioWorklet.addModule('vendor/rnnoiseWorklet.js'),
    ]).catch((err) => {
      rnnoiseLoaded = null;
      throw err;
    });
  await Promise.all([gateLoaded, strong && rnnoiseLoaded]);
  const src = micCtx.createMediaStreamSource(raw);
  // a "batida" do teclado e da mesa é quase toda grave; a voz quase não tem nada abaixo de 90 Hz
  const lowCut = micCtx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = 90;
  lowCut.Q.value = 0.7;
  const rnn = strong ? new RnnoiseWorkletNode(micCtx, { wasmBinary: rnnoiseWasm, maxChannels: 1 }) : null;
  const gate = new AudioWorkletNode(micCtx, 'janja-gate', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
  gate.port.postMessage(gateParams(opts));
  // limitador: estalo alto não chega estourado no ouvido dos amigos
  const limiter = micCtx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 4;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  const dest = micCtx.createMediaStreamDestination();
  dest.channelCount = 1;
  let chain = src.connect(lowCut);
  if (rnn) chain = chain.connect(rnn);
  chain.connect(gate).connect(limiter).connect(dest);
  return {
    stream: dest.stream,
    gate,
    stop() {
      stopRaw();
      for (const node of [src, lowCut, rnn, gate, limiter]) node?.disconnect();
      rnn?.destroy();
      gate.port.close();
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
    C.micGate = m.gate || null;
  } catch {
    C.mic = null;
    C.micStop = null;
    toast('Sem microfone: você entrou só para ouvir');
  }
  C.ch = ch;
  C.joinedAt = Date.now();
  window.desk?.callActive?.(true, channel(ch)?.name);
  djHere = voiceMembers(ch).some((m) => m.key === 'dj'); // já estava lá: sem som
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
  if (!switching) window.desk?.callActive?.(false);
  stopStream(false);
  C.ch = null;
  C.watching.clear();
  syncMedia();
  C.micStop?.();
  C.mic = null;
  C.micStop = null;
  C.micGate = null;
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
      } else if (C.screen?.getAudioTracks().includes(t)) {
        params.encodings[0].maxBitrate = (settings.stream.audioRate || 192) * 1000; // som do PC na stream
        params.encodings[0].priority = params.encodings[0].networkPriority = 'high';
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

// Áudio em alta: o padrão do WebRTC é pensado para voz (Opus mono, ~32 kbps). Aqui a conexão
// já combina estéreo e até 256 kbps; quanto cada som usa de fato é o tuneSenders que decide
// (mic 64 kbps, som da stream 192 kbps por padrão).
function hifiOpus(sdp) {
  for (const [, pt] of sdp.matchAll(/a=rtpmap:(\d+) opus\/48000\/2/gi)) {
    sdp = sdp.replace(new RegExp(`a=fmtp:${pt} ([^\\r\\n]*)`), (line, params) => {
      const kv = new Map(
        params
          .split(';')
          .map((x) => x.trim())
          .filter(Boolean)
          .map((x) => x.split('=')),
      );
      for (const [k, v] of [
        ['stereo', '1'],
        ['sprop-stereo', '1'],
        ['maxaveragebitrate', '256000'],
        ['maxplaybackrate', '48000'],
        ['useinbandfec', '1'],
      ])
        kv.set(k, v);
      return `a=fmtp:${pt} ` + [...kv].map(([k, v]) => `${k}=${v}`).join(';');
    });
  }
  return sdp;
}
const nativeSetLocal = RTCPeerConnection.prototype.setLocalDescription;
RTCPeerConnection.prototype.setLocalDescription = async function (desc) {
  // a biblioteca de P2P chama sem argumento; aqui a oferta/resposta é gerada para poder ser ajustada
  if (!desc) {
    if (this.signalingState === 'have-remote-offer' || this.signalingState === 'have-local-pranswer') desc = await this.createAnswer();
    else if (this.signalingState === 'stable' || this.signalingState === 'have-local-offer') desc = await this.createOffer();
  }
  if (desc?.sdp && (desc.type === 'offer' || desc.type === 'answer')) desc = { type: desc.type, sdp: hifiOpus(desc.sdp) };
  return nativeSetLocal.call(this, desc);
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
  if (a._boost) {
    a._boost.src.disconnect();
    a._boost.gain.disconnect();
  }
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
    for (const [kind, a] of p.audios) {
      const uid = p.user?.id;
      const base = kind === 'screen' ? settings.streamVolumes[uid] ?? 1 : settings.volumes[uid] ?? 1;
      const silenced = settings.localMute[uid] || (kind === 'screen' && settings.streamMute[uid]);
      const v = silenced ? 0 : clamp(base, 0, plug('volumeBoost') ? 3 : 2);
      const off = C.deafened || !C.ch;
      // acima de 100% o som passa por um amplificador (Web Audio) e o <audio> fica mudo
      if (v > 1 && a.srcObject) {
        if (!a._boost) {
          const ctx = audioCtx();
          const src = ctx.createMediaStreamSource(a.srcObject);
          const gain = ctx.createGain();
          src.connect(gain).connect(ctx.destination);
          a._boost = { src, gain };
        }
        a._boost.gain.gain.value = off ? 0 : v;
        a.muted = true;
      } else {
        if (a._boost) a._boost.gain.gain.value = 0;
        a.volume = v;
        a.muted = off;
      }
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
    audio: true, // o som do PC sempre vai junto na stream
    audioRate: Number($('#sqAudioRate').value),
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
  $('#sqAudioRate').value = String(q.audioRate || 192);
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

// modo do diálogo: 'new' (começar), 'adjust' (qualidade ao vivo) ou 'swap' (trocar janela/tela ao vivo)
let sqMode = 'new';
function openStreamDlg(mode) {
  sqMode = mode;
  sqAdjust = mode === 'adjust';
  const swap = mode === 'swap';
  $('#streamDlgTitle').textContent = sqAdjust ? 'Qualidade da stream' : swap ? 'Trocar o que está sendo transmitido' : 'Transmitir';
  $('#srcPick').hidden = sqAdjust || !isDesktop;
  $('#streamDlg .sq').hidden = swap;
  $('#btnGoLive').textContent = sqAdjust ? 'Aplicar' : swap ? 'Trocar' : 'Transmitir';
  $('#btnGoLive').disabled = !sqAdjust && isDesktop;
  $('#streamDlg [data-close]').textContent = sqAdjust ? 'Fechar' : 'Cancelar';
  fillQualityForm(settings.stream);
  $('#sqLive').hidden = !sqAdjust;
  openDialog($('#streamDlg'));
  if (sqAdjust) startLiveStats();
}
async function loadSources() {
  pickedSource = null;
  if (!isDesktop) return; // modo navegador (testes): o navegador pergunta a tela
  $('#sources').replaceChildren(el('p', 'muted', 'Carregando…'));
  allSources = await window.desk.sources();
  renderSources(true);
}
async function openStreamPicker() {
  if (C.screen) return stopStream(true);
  if (!C.ch) return toast('Entre em um canal de voz para transmitir');
  openStreamDlg('new');
  loadSources();
}
$('#ctlStream').onclick = $('#vbStream').onclick = openStreamPicker;
$('#ctlStreamCfg').onclick = () => C.screen && openStreamDlg('adjust');
$('#ctlStreamSwap').onclick = () => {
  if (!C.screen) return;
  openStreamDlg('swap');
  loadSources();
};
// troca a janela/tela sem parar a stream: quem assiste continua assistindo
async function swapSource(id) {
  if (!C.screen) return;
  streamSource = id;
  await restartStream();
  const name = allSources.find((x) => x.id === id)?.name;
  startFollow(name || '');
  if (name) toast('Agora transmitindo: ' + name);
}
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
  if (sqMode === 'swap') {
    closeDialog($('#streamDlg'));
    return swapSource(pickedSource);
  }
  const prev = settings.stream;
  settings.stream = readQualityForm();
  saveSettings();
  if (!sqAdjust) {
    closeDialog($('#streamDlg'));
    return startStream(pickedSource, true); // o som do PC sempre vai junto
  }
  if (!C.screen) return closeDialog($('#streamDlg'));
  // o codec só muda reiniciando a captura; o resto muda na hora
  if (prev.codec !== settings.stream.codec) await restartStream();
  else await applyStreamQuality();
  toast('Qualidade da stream atualizada');
};
$('#streamDlg').addEventListener('close', stopLiveStats);

async function captureScreen(sourceId, withAudio) {
  const q = settings.stream;
  if (isDesktop) await window.desk.pick(sourceId, withAudio);
  // som do PC sem os filtros de voz (eles estragam música/jogo) e, quando o Windows deixa,
  // sem o som do próprio app (senão quem assiste ouve a call e a própria voz de volta)
  const audio = withAudio && {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 2,
    sampleRate: 48000,
    restrictOwnAudio: true,
  };
  const s = await navigator.mediaDevices.getDisplayMedia({ video: videoConstraints(q), audio });
  for (const at of s.getAudioTracks()) {
    // Nunca transmitir a call: se o Windows não separou o som do app (deviceId "loopbackWithoutChrome"),
    // a stream vai sem o som do PC em vez de os amigos ouvirem a própria voz de volta.
    if (isDesktop && !isMobile && at.getSettings().restrictOwnAudio !== true) {
      at.stop();
      s.removeTrack(at);
      toast('Este Windows não deixa separar o som do app: a stream vai sem o som do PC para ninguém se ouvir de volta');
      continue;
    }
    at.contentHint = 'music';
  }
  const vt = s.getVideoTracks()[0];
  if (vt) {
    vt.contentHint = CONTENT_HINT[q.mode] || '';
    // a janela fechou: no LoL é a partida acabando, então troca para o cliente em vez de parar
    vt.addEventListener('ended', () => C.screen === s && (follow ? followEnded(s) : stopStream(true)));
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
  startFollow(allSources.find((x) => x.id === sourceId)?.name || '');
  C.focus = 'me';
  if (S.view !== C.ch) openView(C.ch);
  sendHi();
  syncMedia();
  renderPresence();
}
// ----- League of Legends: a stream acompanha o cliente e a partida sozinha -----
// O jogo e o cliente são janelas diferentes; quando a partida começa a janela do jogo aparece,
// e quando acaba ela fecha. A cada 3 s a stream vai para a janela certa (quem assiste continua assistindo).
const LOL_GAME = /^League of Legends \(TM\) Client$/i;
const LOL_CLIENT = /^League of Legends$/i;
let follow = null;
function startFollow(name) {
  stopFollow();
  if (!window.desk?.windows || !(LOL_GAME.test(name) || LOL_CLIENT.test(name))) return;
  follow = { timer: setInterval(followTick, 3000), busy: false };
  toast('Stream do LoL: troca sozinha entre o cliente e a partida');
}
function stopFollow() {
  clearInterval(follow?.timer);
  follow = null;
}
async function followTick() {
  if (!C.screen || !follow || follow.busy) return false;
  const wins = await window.desk.windows().catch(() => []);
  const target = wins.find((w) => LOL_GAME.test(w.name)) || wins.find((w) => LOL_CLIENT.test(w.name));
  if (!target || target.id === streamSource) return false;
  follow.busy = true;
  streamSource = target.id;
  try {
    await restartStream();
    toast(LOL_GAME.test(target.name) ? 'A partida começou: transmitindo o jogo' : 'A partida acabou: transmitindo o cliente');
  } finally {
    if (follow) follow.busy = false;
  }
  return true;
}
// a janela transmitida fechou: espera o cliente/jogo aparecer por até ~15 s antes de parar a stream
async function followEnded(s) {
  for (let i = 0; i < 8 && C.screen === s && follow; i++) {
    if (await followTick()) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (C.screen === s) stopStream(true);
}

// troca a captura sem avisar "parou": quem está assistindo continua assistindo
async function restartStream() {
  const old = C.screen;
  let next;
  try {
    next = await captureScreen(streamSource, true);
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
  stopFollow();
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
  const hist = [...(pb.hist || []), cur?.ref].filter(Boolean).slice(-40);
  // fila acabou: o DJ continua com músicas parecidas (só um PC da call busca, para não repetir)
  if (!next && pb.auto !== false && cur?.ref && window.desk?.ytRelated) {
    if (isDjLeader(ch)) autoplayNext(ch, cur, hist);
    return;
  }
  writePb(ch, { item: next?.id || null, hist });
}
// estado do player do canal, sem perder o autoplay e o histórico
function writePb(ch, fields) {
  const old = recs.get('pb:' + ch);
  put({ k: 'pb', id: 'pb:' + ch, ch, item: null, startedAt: Date.now(), pausedAt: null, auto: old?.auto, hist: old?.hist || [], ...fields });
}
// quem da call busca a próxima do autoplay: o de menor id (todos chegam à mesma conta)
function isDjLeader(ch) {
  const ids = [selfId, ...[...peers.values()].filter((p) => p.voice?.ch === ch).map((p) => p.pid)];
  return ids.sort()[0] === selfId;
}
async function autoplayNext(ch, cur, hist) {
  let list = [];
  try {
    list = await window.desk.ytRelated(cur.ref);
  } catch (err) {
    console.warn('autoplay', err);
  }
  const pb = recs.get('pb:' + ch);
  if (pb?.item !== cur.id || queueOf(ch).length) return; // alguém já pôs outra coisa
  const recent = new Set([...hist, cur.ref]);
  const pick = list.find((r) => !recent.has(r.id));
  if (!pick) return writePb(ch, { item: null, hist });
  const item = { k: 'q', id: 'q:' + randId(), ch, ref: pick.id, title: pick.title || PLACEHOLDER, artist: pick.artist, dur: pick.dur || 0, thumb: pick.thumb, addedBy: 'Autoplay', auto: true, at: Date.now() };
  put(item);
  writePb(ch, { item: item.id, hist });
  botSay(ch, `Autoplay: tocando **${item.title}**${item.artist ? ' · ' + item.artist : ''}`);
}
// embaralha a fila para todo mundo: só troca a ordem (o "at" de cada música)
function shuffleQueue(ch = C.ch) {
  const q = ch ? queueOf(ch) : [];
  if (q.length < 2) return q.length;
  const order = q.map((x) => x.at).sort((a, b) => a - b);
  const mixed = [...q];
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
  }
  mixed.forEach((x, i) => put({ ...x, at: order[i] }));
  return q.length;
}
function toggleAutoplay(ch = C.ch) {
  if (!ch) return null;
  const old = recs.get('pb:' + ch);
  const on = old?.auto === false;
  if (old) put({ ...old, auto: on });
  else writePb(ch, { auto: on });
  renderMusic();
  return on;
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
  if (!playing) writePb(C.ch, { item: item.id });
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
$('#plShuffle').onclick = () => {
  const n = shuffleQueue();
  if (n < 2) return toast('Precisa de pelo menos 2 músicas na fila para embaralhar');
  botSay(C.ch, `**${me.name}** embaralhou a fila (${n} músicas)`);
  animate($('#plShuffle'), { rotate: [0, 360] }, { duration: 0.4 });
};
$('#plAuto').onclick = () => {
  const on = toggleAutoplay();
  if (on != null) toast(on ? 'Autoplay ligado: quando a fila acabar, toco músicas parecidas' : 'Autoplay desligado');
};
$('#plPlay').onclick = () => {
  if (!C.ch) return;
  const { pb, item } = pbOf(C.ch);
  if (!item) {
    const first = queueOf(C.ch)[0];
    if (first) writePb(C.ch, { item: first.id });
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
  $('#plAuto').classList.toggle('on', pb?.auto !== false);
  $('#plAuto').title = pb?.auto !== false ? 'Autoplay ligado: quando a fila acabar, toca músicas parecidas (clique para desligar)' : 'Autoplay desligado (clique para ligar)';
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
const fullTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const mentionsMe = (text) => {
  const n = me.name?.trim();
  return !!n && new RegExp(`(^|[^\\p{L}\\p{N}])@?${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu').test(String(text || ''));
};
document.addEventListener('click', (e) => e.target.closest?.('.spoiler')?.classList.add('shown'));

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
  s = s.replace(/(^|\s)@([^\s@<&]{1,32})/g, '$1<span class="mention-tag">@$2</span>');
  s = s.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler" title="Spoiler: clique para ver">$1</span>');
  s = s.replace(/^&gt; ?(.*)(\n|$)/gm, '<span class="quote">$1</span>'); // "> citação" (o Responder usa)
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
  const uid = m.bot ? null : m.uid; // o DJ não usa o perfil de quem chamou o comando
  const who = { id: m.uid, name: m.name, color: m.color };
  const av = avatar(m.name, m.color, '', uid);
  if (uid) av.onclick = () => openProfile(who, av);
  d.append(av);
  const body = el('div');
  const when = plug('fullTime') ? fullTime.format(m.ts) : hhmm.format(m.ts);
  if (!grouped) {
    const head = el('div', 'head');
    const a = nameEl(m.name, m.color, uid, 'author');
    if (uid) a.onclick = () => openProfile(who, a);
    const t = el('time', '', when);
    t.title = new Date(m.ts).toLocaleString('pt-BR');
    head.append(a);
    if (m.bot) head.append(el('span', 'bot-tag', 'BOT'));
    head.append(t);
    body.append(head);
  } else {
    const gt = el('time', 'gtime', hhmm.format(m.ts)); // horário ao passar o mouse
    gt.title = new Date(m.ts).toLocaleString('pt-BR');
    d.append(gt);
  }
  if (m.ghost) d.classList.add('ghost');
  if (m.uid !== me.id && !m.bot && (mentionedMe(m.text) || (plug('mentions') && mentionsMe(m.text)))) d.classList.add('mention');
  if (plug('dblClick') && !m.ghost && !m.bot)
    d.ondblclick = (e) => {
      if (e.target.closest('a, button, img, video, audio, textarea')) return;
      getSelection()?.removeAllRanges();
      m.uid === me.id && m.text ? startEdit(m, d) : replyTo(m, d);
    };
  const actions = el('div', 'msg-actions');
  const action = (name, title, fn, cls = '') => {
    const b = el('button', 'icon-btn ' + cls);
    b.title = title;
    b.append(icon(name, 'sm'));
    b.onclick = (e) => fn(e, b);
    actions.append(b);
  };
  if (!m.ghost) action('face-slightly-smiling-plus', 'Reagir', (e, b) => openEmoji(b, (emoji) => toggleReaction(m, emoji)));
  if (!m.ghost) action('reply', 'Responder', () => replyTo(m, d));
  if (m.text) action('copy', 'Copiar texto', (e, b) => copyText(m.text, b));
  if (m.uid === me.id && !m.bot && !m.ghost) {
    if (m.text) action('pencil', 'Editar (ou seta para cima no campo vazio)', () => startEdit(m, d));
    action('trash-2', 'Apagar mensagem (Shift+clique apaga sem perguntar)', (e) => deleteMessage(m, e.shiftKey), 'danger');
  }
  d.append(actions);
  if (plug('messageLogger') && editLog[m.id]) for (const old of editLog[m.id]) body.append(el('div', 'edit-old', old));
  if (m.text) {
    const text = el('div', 'text' + (isJumbo(m.text) ? ' jumbo' : ''));
    text.innerHTML = format(String(m.text));
    if (m.edited) text.append(el('span', 'edited', '(editado)'));
    if (m.ghost) text.append(el('span', 'edited', '(apagada)'));
    body.append(text);
  }
  const atts = Array.isArray(m.att) ? m.att.filter(validAtt).slice(0, 10) : [];
  if (atts.length) {
    const box = el('div', 'atts');
    atts.forEach((a) => box.append(attachmentEl(a, m.uid)));
    body.append(box);
  }
  if (!m.ghost) body.append(reactionsEl(m));
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
  let list = messagesOf(ch);
  const searching = box.id === 'messages' && S.filter;
  if (searching) {
    const q = plainText(S.filter);
    list = list.filter((m) => plainText(m.text + ' ' + m.name).includes(q));
  }
  const frag = document.createDocumentFragment();
  if (box.id === 'messages') {
    const empty = el('div', 'empty-ch');
    const big = el('div', 'big');
    big.append(icon('hash'));
    empty.append(big, el('h2', '', `Bem-vindo a #${c?.name || ''}`), el('div', 'muted', 'Este é o começo do canal.'));
    frag.append(empty);
  } else if (!list.length) frag.append(el('p', 'hint', `Chat de ${c?.name || 'voz'}. Digite /ajuda para ver os comandos de música.`));
  const divAt = box.id === 'messages' && S.divider?.ch === ch && !searching ? S.divider.at : null;
  let divDone = false;
  list.forEach((m, i) => {
    if (divAt != null && !divDone && m.ts > divAt && m.uid !== me.id) {
      divDone = true;
      frag.append(el('div', 'new-divider', 'Novas mensagens'));
    }
    frag.append(messageEl(m, divDone && list[i - 1]?.ts <= divAt ? null : list[i - 1]));
  });
  if (searching) $('#chatSearchCount').textContent = list.length ? `${list.length} ${list.length === 1 ? 'resultado' : 'resultados'}` : 'Nada encontrado';
  box.replaceChildren(frag);
  const divEl = !keepScroll && box.querySelector(':scope > .new-divider');
  if (divEl) box.scrollTop = Math.max(0, divEl.offsetTop - 80);
  else box.scrollTop = keepScroll ? box.scrollHeight - fromBottom : box.scrollHeight;
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
// ----- ações rápidas das mensagens -----
const composerOf = (box) => (box?.id === 'callMessages' ? callInput : input);
function replyTo(m, node) {
  const box = node.closest('.chat-scroll');
  const field = composerOf(box);
  const quoted = String(m.text || (m.att?.length ? '[anexo]' : '')).replace(/\s+/g, ' ').slice(0, 90);
  field.value = `> **${m.name}**: ${quoted}${m.text?.length > 90 ? '…' : ''}\n` + field.value.replace(/^>.*\n/, '');
  field.dispatchEvent(new Event('input'));
  field.focus();
  field.setSelectionRange(field.value.length, field.value.length);
}
async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    setIcon(btn, 'check');
    setTimeout(() => btn.isConnected && setIcon(btn, 'copy'), 1200);
  } catch {
    toast('Não consegui copiar');
  }
}
function startEdit(m, node) {
  const textEl = node.querySelector('.text');
  if (!textEl || node.querySelector('.edit-box')) return;
  const box = el('div', 'edit-box');
  const ta = el('textarea');
  ta.value = m.text;
  ta.maxLength = 2000;
  const hint = el('div', 'edit-hint', 'Enter salva · Esc cancela');
  box.append(ta, hint);
  textEl.replaceWith(box);
  const fit = () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(220, ta.scrollHeight) + 'px';
  };
  fit();
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
  const close = () => box.isConnected && box.replaceWith(textEl);
  ta.oninput = fit;
  ta.onblur = close;
  ta.onkeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      const text = ta.value.trim();
      close();
      if (!text) return deleteMessage(m);
      if (text !== m.text) put({ ...m, text: text.slice(0, 2000), edited: true });
    }
  };
}
// seta para cima com o campo vazio: edita a sua última mensagem (como no Discord)
function editLast(field, box, e) {
  if (e.key !== 'ArrowUp' || field.value) return;
  const node = [...box.querySelectorAll(`.msg[data-uid="${me.id}"]:not([data-bot])`)].pop();
  const m = node && recs.get(node.dataset.id);
  if (!m?.text) return;
  e.preventDefault();
  startEdit(m, node);
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
    if (!plug('silentTyping')) A.typing?.send({ ch: S.view });
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
input.addEventListener('keydown', (e) => editLast(input, $('#messages'), e));
callInput.addEventListener('keydown', (e) => editLast(callInput, $('#callMessages'), e));

// botão "ir para as mensagens novas" quando você rolou para cima
for (const box of $$('.chat-scroll')) {
  const btn = el('button', 'jump-down');
  btn.type = 'button';
  btn.hidden = true;
  btn.append(icon('arrow-down', 'sm'), el('span', '', 'Ir para as mais recentes'));
  btn.onclick = () => box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  box.parentElement.classList.add('has-jump');
  box.after(btn);
  box.addEventListener('scroll', () => {
    const away = box.scrollHeight - box.scrollTop - box.clientHeight > 250;
    if (away === !btn.hidden) return;
    btn.hidden = !away;
    if (away) springIn(btn);
  });
}

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
    autoplay: ['autoplay', 'auto', 'ap'],
    shuffle: ['shuffle', 'embaralhar', 'aleatorio'],
  }).flatMap(([cmd, aliases]) => aliases.map((a) => [a, cmd])),
);
const isCommand = (text) => {
  const m = text.match(CMD);
  return !!m && (DJ_CMDS.has(m[1].toLowerCase()) || pluginCommands.has(m[1].toLowerCase()));
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
  '/autoplay  liga/desliga músicas parecidas quando a fila acaba',
  '/shuffle  embaralha a fila',
].join('\n');
async function runCommand(text, ch, box) {
  const [, name, rawArg] = text.match(CMD);
  const cmd = DJ_CMDS.get(name.toLowerCase());
  const arg = rawArg.trim();
  const pc = !cmd && pluginCommands.get(name.toLowerCase());
  if (pc) {
    try {
      const out = await pc.fn(arg, { channel: ch });
      if (out) note(box, String(out));
    } catch (err) {
      note(box, 'O comando do plugin deu erro: ' + err.message);
    }
    return;
  }
  if (cmd === 'help') return note(box, HELP + [...pluginCommands].map(([n, c]) => `
/${n}  ${c.desc}`).join(''));
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
    case 'shuffle': {
      const n = shuffleQueue(C.ch);
      if (n < 2) return note(box, 'Precisa de pelo menos 2 músicas na fila para embaralhar.');
      return botSay(ch, `${who} embaralhou a fila (${n} músicas)`);
    }
    case 'autoplay': {
      const on = toggleAutoplay(C.ch);
      return botSay(ch, `${who} ${on ? 'ligou' : 'desligou'} o autoplay${on ? ': quando a fila acabar, toco músicas parecidas' : ''}`);
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
      writePb(C.ch, { item: null });
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
  pop.classList.toggle('bare', content.classList.contains('profile-card'));
  pop.hidden = false;
  const r = anchor.getBoundingClientRect();
  const h = pop.offsetHeight;
  // cartão de perfil abre ao lado de quem foi clicado; o resto abre em cima/embaixo
  if (content.classList.contains('profile-card')) {
    const right = r.right + 10 + pop.offsetWidth < innerWidth;
    pop.style.left = (right ? r.right + 10 : Math.max(8, r.left - pop.offsetWidth - 10)) + 'px';
    pop.style.top = clamp(r.top - 20, 40, innerHeight - h - 8) + 'px';
  } else {
    pop.style.left = clamp(r.left, 8, innerWidth - pop.offsetWidth - 8) + 'px';
    pop.style.top = clamp(r.top - h - 8 > 40 ? r.top - h - 8 : r.bottom + 8, 8, innerHeight - h - 8) + 'px';
  }
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
// ----- cartão de perfil (clicar em alguém) -----
// user: { id, name, color }; prof: perfil a mostrar (a prévia do editor passa o rascunho)
function profileCard(user, prof = profileOf(user.id), opts = {}) {
  const card = el('div', 'profile-card');
  const theme = prof.theme;
  if (theme) {
    card.classList.add('themed');
    card.style.setProperty('--pc1', theme[0]);
    card.style.setProperty('--pc2', theme[1]);
  }
  const banner = el('div', 'pc-banner');
  banner.style.background = prof.bannerColor || cleanColor(user.color);
  if (prof.banner) {
    const setBg = (url) => url && (banner.style.backgroundImage = `url("${url}")`);
    opts.bannerUrl ? setBg(opts.bannerUrl) : fileUrl(prof.banner, user.id).then(setBg);
  }
  card.append(banner);
  if (prof.effect && !(look.noFx && user.id !== me.id)) card.append(effectLayer(prof.effect));
  // a prévia do editor usa o rascunho; o resto usa o perfil salvo
  const av = opts.avatarEl || avatar(user.name, user.color, 'pc-avatar', user.id);
  av.classList.add('pc-avatar');
  card.append(av);
  const body = el('div', 'pc-body');
  const nameRow = el('div', 'pc-name-row');
  nameRow.append(opts.nameEl || nameEl(user.name, user.color, user.id, 'pc-uname'));
  const g = googleOf(user.id);
  if (g && !opts.preview) {
    const b = icon('badge-check', 'g-badge');
    b.setAttribute('aria-label', 'Conta Google: ' + g.email);
    nameRow.append(b);
  }
  body.append(nameRow);
  if (prof.pronouns) body.append(el('div', 'pc-pron', prof.pronouns));
  if (prof.status || prof.statusEmoji) body.append(el('div', 'pc-status', `${prof.statusEmoji || ''} ${prof.status || ''}`.trim()));
  if (g && !opts.preview) body.append(el('div', 'pc-mail', g.email));
  if (prof.bio) {
    body.append(el('div', 'pc-sec', 'Sobre mim'));
    const bio = el('div', 'pc-bio');
    bio.innerHTML = format(prof.bio);
    body.append(bio);
  }
  const live = [...peers.values()].find((p) => p.user?.id === user.id && p.voice?.ch);
  const vch = user.id === me.id ? C.ch : live?.voice.ch;
  if (vch && channel(vch)) body.append(el('div', 'pc-sec', 'Na call'), el('div', 'pc-call', channel(vch).name));
  if (!opts.preview && user.id !== me.id) {
    const max = plug('volumeBoost') ? 300 : 100;
    const label = el('label', 'pc-vol');
    const val = el('b');
    const range = el('input');
    range.type = 'range';
    range.min = 0;
    range.max = max;
    range.value = Math.min(max, Math.round((settings.volumes[user.id] ?? 1) * 100));
    const show = () => (val.textContent = range.value + '%');
    range.oninput = () => {
      settings.volumes[user.id] = range.value / 100;
      show();
      saveSettings();
      applyVolumes();
    };
    show();
    label.append(wrapEl('span', 'pc-vol-head', document.createTextNode('Volume do usuário'), val), range);
    body.append(label);
  }
  if (!opts.preview && user.id === me.id) {
    const sts = el('div', 'pc-status-pick');
    for (const [st, label] of STATUSES) {
      const b = el('button', 'st-btn st-' + st + (myStatus() === st ? ' active' : ''));
      b.type = 'button';
      b.append(el('span', 'st-dot'), el('span', '', label));
      b.onclick = () => {
        setStatus(st);
        openProfile(me, anchorOf(card));
      };
      sts.append(b);
    }
    body.append(el('div', 'pc-sec', 'Status'), sts);
    const edit = el('button', 'primary sm wide', 'Editar perfil');
    edit.onclick = () => {
      pop.hidden = true;
      openSettings('profile');
    };
    body.append(edit);
  }
  card.append(body);
  return card;
}
const anchorOf = (node) => {
  const r = node.getBoundingClientRect();
  return { getBoundingClientRect: () => ({ left: r.left - 10, right: r.left - 10, top: r.top + 20, bottom: r.top + 20 }) };
};
function openProfile(user, anchor) {
  if (!user?.id) return;
  if (user.id === 'dj') return selectTab('music');
  openPopover(anchor, profileCard(user));
}
// partículas do "efeito de perfil"
function effectLayer(kind) {
  const layer = el('div', 'pfx pfx-' + kind);
  const glyph = { sparkle: '✦', snow: '❄', hearts: '❤', stars: '★', confetti: '▮' }[kind] || '✦';
  const colors = ['#ff7a1a', '#ffd166', '#4fd18b', '#3aa8f0', '#b07cff', '#ff6fb5'];
  for (let i = 0; i < 16; i++) {
    const p = el('span', '', glyph);
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = -Math.random() * 6 + 's';
    p.style.animationDuration = 4 + Math.random() * 4 + 's';
    p.style.fontSize = 8 + Math.random() * 10 + 'px';
    if (kind === 'confetti' || kind === 'sparkle') p.style.color = colors[i % colors.length];
    layer.append(p);
  }
  return layer;
}

// ============================================================ abas da direita
let currentTab = 'people';
function selectTab(tab) {
  setPane('right');
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
  // o DJ "entra na call" enquanto tem música tocando ou na fila, como os bots do Discord
  const { pb, item } = pbOf(ch);
  if (item || queueOf(ch).length) list.push({ key: 'dj', user: DJ_USER, voice: { ch, muted: !item || pb?.pausedAt != null }, dj: { item, paused: pb?.pausedAt != null } });
  return list;
}
const DJ_USER = { id: 'dj', name: 'DJ', color: '#ff7a1a' };
const djPlaying = (ch) => {
  const { pb, item } = pbOf(ch);
  return !!item && pb?.pausedAt == null;
};
// som de entrar/sair quando o DJ chega ou vai embora da minha call
let djHere = false;
function checkDj() {
  const here = !!C.ch && voiceMembers(C.ch).some((m) => m.key === 'dj');
  if (here === djHere) return;
  djHere = here;
  here ? sfx.join() : sfx.leave();
}
setInterval(() => {
  const on = !!C.ch && djPlaying(C.ch) && !settings.musicMuted;
  on ? C.speaking.add('dj') : C.speaking.delete('dj');
  $$('[data-speak="dj"]').forEach((e) => e.classList.toggle('speaking', on));
}, 500);
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
  renderMobileNav();
  const rows = [];
  const textList = $('#textList');
  textList.replaceChildren(
    ...channels('text').map((c) => {
      const li = el('li');
      const row = el('div', 'ch' + (S.view === c.id ? ' active' : '') + (S.unread.has(c.id) && S.view !== c.id ? ' unread' : '') + (settings.mutedCh[c.id] ? ' muted-ch' : ''));
      row.dataset.chid = c.id;
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
      row.dataset.chid = c.id;
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
          u.dataset.uid = m.user.id;
          u.classList.toggle('speaking', C.speaking.has(m.key));
          u.append(avatar(m.user.name, m.user.color, 'xs', m.user.id), el('span', 'pname', m.user.name));
          if (m.dj) u.append(el('span', 'bot-tag', 'BOT'));
          u.append(flagsEl(m.voice, m.key));
          u.onclick = (e) => (e.stopPropagation(), openProfile(m.user, u));
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
  const g = grpRec();
  $('#groupName').textContent = gname;
  // só repinta ícone/banner quando mudam (evita piscar a cada atualização da barra lateral)
  const gLook = [g.icon, g.banner, g.color, gname].join('|');
  if ($('#groupAvatar').dataset.look !== gLook) {
    $('#groupAvatar').dataset.look = gLook;
    paintGroupAvatar($('#groupAvatar'), g);
    paintGroupBanner($('.group-card'), g);
  }
  $('#groupDesc').hidden = !g.desc;
  $('#groupDesc').textContent = g.desc || '';
  $('.group-card').title = g.desc || '';
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
      const li = el('li', 'st-' + statusOf(m.user.id));
      li.dataset.uid = m.user.id;
      if (settings.localMute[m.user.id]) li.classList.add('lmuted');
      const who = el('div', 'who');
      const pname = el('div', 'pname');
      pname.append(nameEl(m.user.name, m.user.color, m.user.id));
      if (m.key === 'me') pname.append(el('span', 'muted', ' (você)'));
      const g = googleOf(m.user.id);
      if (g) {
        pname.append(icon('badge-check', 'g-badge'));
        li.title = 'Conta Google: ' + g.email;
      }
      who.append(pname);
      const sub = el('div', 'psub');
      const vch = m.voice && channel(m.voice.ch);
      if (vch) sub.append(icon(m.voice.streaming ? 'screen-share' : 'volume-2'), el('span', '', (m.voice.streaming ? 'Ao vivo em ' : '') + vch.name));
      else {
        const st = profileOf(m.user.id);
        sub.append(el('span', '', st.status || st.statusEmoji ? `${st.statusEmoji} ${st.status}`.trim() : 'Online'));
      }
      who.append(sub);
      li.append(avatar(m.user.name, m.user.color, '', m.user.id), who, flagsEl(m.voice));
      li.onclick = () => openProfile(m.user, li);
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
  $('#meName').replaceChildren(nameEl(me.name, me.color, me.id));
  $('#meAvatar').dataset.uid = me.id;
  $('.me-card').dataset.st = myStatus();
  $('#meAvatar').onclick = $('#meName').onclick = () => openProfile(me, $('#meAvatar'));
  $('#meSub').textContent = C.ch ? (C.screen ? 'Ao vivo' : 'Na call') : `${me.p.statusEmoji || ''} ${me.p.status || ''}`.trim() || 'Online';
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
// Cada stream tem um quadro fixo (o mesmo elemento entre redesenhos), para a tela cheia não fechar sozinha
const streamTiles = new Map(); // chave (peerId ou 'me') -> elemento
const uidOfKey = (key) => (key === 'me' ? me.id : peers.get(key)?.user?.id);
function toggleStreamMute(uid) {
  if (!uid) return;
  settings.streamMute[uid] = !settings.streamMute[uid];
  if (!settings.streamMute[uid]) delete settings.streamMute[uid];
  saveSettings();
  applyVolumes();
  renderStage();
}
function fillStreamTile(s, total) {
  let t = streamTiles.get(s.key);
  if (!t) {
    t = el('div', 'focus');
    streamTiles.set(s.key, t);
  }
  t.className = 'focus';
  t.onclick = null;
  t.replaceChildren();
  const uid = uidOfKey(s.key);
  const tag = el('div', 'tag');
  if (s.key !== 'me') tag.append(el('span', 'live', 'AO VIVO'));
  tag.append(el('span', '', s.name));
  const tools = el('div', 'tile-tools');
  const btn = (iconName, title, fn, cls = '') => {
    const b = el('button', 'fs ' + cls);
    b.type = 'button';
    b.title = title;
    b.append(icon(iconName, 'sm'));
    b.onclick = (e) => {
      e.stopPropagation();
      fn();
    };
    tools.append(b);
    return b;
  };
  if (s.stream) {
    const video = videoFor(s.stream);
    t.append(video);
    // som da stream: mutar só para mim (o meu próprio preview já é sempre mudo)
    if (s.key !== 'me' && s.stream.getAudioTracks().length) {
      const muted = !!settings.streamMute[uid];
      // volume da stream (só para você): barrinha ao lado do botão de mutar
      const vol = el('label', 'tile-vol');
      const range = el('input');
      range.type = 'range';
      range.min = 0;
      range.max = plug('volumeBoost') ? 300 : 200;
      range.value = Math.round((settings.streamVolumes[uid] ?? 1) * 100);
      const val = el('span', 'tile-vol-val', range.value + '%');
      range.title = 'Volume da stream (só para você)';
      range.onclick = (e) => e.stopPropagation();
      range.oninput = () => {
        settings.streamVolumes[uid] = range.value / 100;
        val.textContent = range.value + '%';
        if (settings.streamMute[uid] && range.value > 0) {
          delete settings.streamMute[uid];
          muteBtn.classList.remove('off');
          setIcon(muteBtn, 'volume-2');
        }
        saveSettings();
        applyVolumes();
      };
      vol.append(range, val);
      tools.append(vol);
      const muteBtn = btn(muted ? 'volume-x' : 'volume-2', muted ? 'Desmutar a stream' : 'Mutar a stream (só para você)', () => toggleStreamMute(uid), muted ? 'off' : '');
    }
    if (document.pictureInPictureEnabled && s.stream.getVideoTracks().length)
      btn('pip', 'Janela flutuante (fica por cima dos outros programas)', () =>
        (document.pictureInPictureElement === video ? document.exitPictureInPicture() : video.requestPictureInPicture()).catch((err) => toast('Não deu para abrir a janela flutuante: ' + err.message)),
      );
  } else {
    const wait = el('div', 'connecting');
    wait.append(icon('loader', 'spin'), el('span', '', `Conectando à stream de ${s.name}…`));
    t.append(wait);
  }
  if (total > 1 && settings.streamLayout !== 'focus')
    btn('pin', 'Destacar esta stream', () => {
      C.focus = s.key;
      settings.streamLayout = 'focus';
      saveSettings();
      renderStage();
    });
  const fs = btn('maximize', 'Tela cheia', () => (document.fullscreenElement ? document.exitFullscreen() : t.requestFullscreen()));
  t.append(tag, tools);
  if (s.key !== 'me') {
    const stop = el('button', 'stop-watch');
    stop.type = 'button';
    stop.append(icon('eye-off', 'sm'), document.createTextNode('Parar de assistir'));
    stop.onclick = (e) => {
      e.stopPropagation();
      unwatchStream(s.key);
    };
    t.append(stop);
  }
  t.ondblclick = () => fs.click();
  return t;
}
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
      card.dataset.uid = m.user.id;
      card.append(flagsEl(m.voice), avatar(m.user.name, m.user.color, '', m.user.id), wrapEl('div', 'pc-name', nameEl(m.user.name + (m.key === 'me' ? ' (você)' : ''), m.user.color, m.user.id)));
      if (isLive) card.append(watchBtn(m, 'primary sm watch-btn'));
      if (m.dj) {
        card.classList.add('dj-card');
        card.classList.toggle('speaking', djPlaying(c.id));
        if (m.dj.item) {
          card.style.setProperty('--dj-art', `url("${thumbOf(m.dj.item)}")`);
          card.append(el('div', 'pc-sub', (m.dj.paused ? 'Pausado · ' : '') + m.dj.item.title));
        } else card.append(el('div', 'pc-sub', 'Esperando a próxima…'));
      }
      card.onclick = (e) => !e.target.closest('button') && openProfile(m.user, card);
      grid.append(card);
      const k = 'card:' + m.key + (isLive ? ':live' : '');
      keysNow.add(k);
      if (!stageKeys.has(k)) fresh.push(card);
    }
    stage.replaceChildren(grid);
    if (fresh.length) springIn(fresh, { delay: stagger(0.05) });
  } else {
    // Em tela cheia, só atualiza o quadro que está em tela cheia: mexer na página tiraria da tela cheia
    const fsTile = document.fullscreenElement && [...streamTiles.values()].find((t) => t === document.fullscreenElement);
    if (fsTile) {
      const s = shown.find((x) => streamTiles.get(x.key) === fsTile);
      if (s) fillStreamTile(s, shown.length);
      stageKeys = keysNow;
      renderControls();
      return;
    }
    for (const key of [...streamTiles.keys()]) if (!shown.some((s) => s.key === key)) streamTiles.delete(key);
    const grid = shown.length > 1 && settings.streamLayout !== 'focus';
    const focus = shown.find((s) => s.key === C.focus) || shown[0];
    const main = el('div', grid ? 'stream-grid n' + Math.min(shown.length, 4) : 'stream-focus');
    if (shown.length > 1) {
      // alternar entre todas lado a lado e uma em destaque
      const bar = el('div', 'stream-bar');
      const mk = (mode, iconName, label) => {
        const b = el('button', 'ghost sm' + ((settings.streamLayout || 'grid') === mode ? ' on' : ''));
        b.type = 'button';
        b.append(icon(iconName, 'sm'), document.createTextNode(label));
        b.onclick = () => {
          settings.streamLayout = mode;
          saveSettings();
          renderStage();
        };
        return b;
      };
      bar.append(el('span', 'muted small', `${shown.length} streams`), mk('grid', 'users', 'Lado a lado'), mk('focus', 'maximize', 'Destaque'));
      stage.replaceChildren(bar);
    } else stage.replaceChildren();
    const strip = el('div', 'strip');
    for (const s of shown) {
      const t = fillStreamTile(s, shown.length);
      if (grid || s === focus) main.append(t);
      else {
        // modo destaque: as outras streams ficam pequenas embaixo; clicar traz para o centro
        t.classList.add('mini');
        t.onclick = (e) => {
          if (e.target.closest('button')) return;
          C.focus = s.key;
          renderStage();
        };
        strip.append(t);
      }
      const k = 'stream:' + s.key + ':' + (s.stream?.id || 'wait');
      keysNow.add(k);
      if (!stageKeys.has(k)) springIn(t);
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
      t.dataset.uid = m.user.id;
      t.append(avatar(m.user.name, m.user.color, '', m.user.id), Object.assign(el('div', 'tag'), { textContent: m.user.name }));
      strip.append(t);
    }
    stage.append(main, strip);
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
  $('#ctlStreamSwap').hidden = !C.screen || isMobile;
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
  setPane('center');
  const changed = S.view !== c.id;
  if (changed) {
    S.divider = S.unread.has(c.id) ? { ch: c.id, at: readAt[c.id] || 0 } : null;
    if (S.filter) {
      S.filter = '';
      $('#chatSearchInput').value = '';
    }
    $('#chatSearch').hidden = true;
  }
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
  if (text) {
    input.focus();
    markRead(c.id);
  }
  $('#btnChatSearch').hidden = !text;
}
addEventListener('focus', () => textChatCh() && markRead(textChatCh()));

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
// renomear o canal aberto: clicando no nome lá em cima ou no lápis
$('#viewTitle').onclick = $('#btnRenameCh').onclick = () => {
  const c = channel(S.view);
  if (c) openChannelDialog(c.type, c);
};
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
  if (c.type === 'voice' && voiceMembers(c.id).some((m) => m.key !== 'dj')) return toast('Tem gente nesse canal de voz');
  if (!confirm(`Apagar "${c.name}"?`)) return;
  put({ ...c, del: true });
  closeDialog($('#channelDlg'));
};

// ============================================================ grupo, convite, configurações
// ----- perfil do servidor: nome, descrição, ícone, banner e cor (sincroniza com todo mundo) -----
const grpRec = () => recs.get('grp') || { k: 'grp', id: 'grp', name: 'Grupo' };
const GRP_FILE = /^f:[0-9a-f]{24}$/;
// ícone do servidor (imagem ou a inicial na cor escolhida); o arquivo vem P2P de quem trocou
function paintGroupAvatar(node, g, urls = {}) {
  node.textContent = (g.name || 'G')[0];
  node.style.background = cleanHex(g.color) || '';
  node.classList.remove('has-img');
  if (!GRP_FILE.test(g.icon || '')) return;
  const set = (url) => {
    if (!url) return;
    node.textContent = '';
    node.classList.add('has-img');
    node.replaceChildren(Object.assign(el('img'), { src: url, alt: '' }));
  };
  urls[g.icon] ? set(urls[g.icon]) : fileUrl(g.icon, g.by).then(set);
}
function paintGroupBanner(node, g, urls = {}) {
  node.style.backgroundImage = '';
  node.classList.remove('has-banner');
  if (!GRP_FILE.test(g.banner || '')) return;
  const set = (url) => {
    if (!url) return;
    node.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.65)), url("${url}")`;
    node.classList.add('has-banner');
  };
  urls[g.banner] ? set(urls[g.banner]) : fileUrl(g.banner, g.by).then(set);
}
let srvDraft = null;
const srvUrls = {};
function openServerDialog() {
  if (!R) return;
  const g = grpRec();
  srvDraft = { name: g.name || 'Grupo', desc: g.desc || '', icon: g.icon || '', banner: g.banner || '', color: cleanHex(g.color) || '#ff7a1a' };
  $('#srvName').value = srvDraft.name;
  $('#srvDesc').value = srvDraft.desc;
  $('#srvColor').value = srvDraft.color;
  renderServerPreview();
  openDialog($('#serverDlg'));
}
function renderServerPreview() {
  srvDraft.name = cleanName($('#srvName').value) || 'Grupo';
  srvDraft.desc = $('#srvDesc').value.slice(0, 200);
  srvDraft.color = $('#srvColor').value;
  $('#srvDescCount').textContent = `${srvDraft.desc.length}/200`;
  $('#srvIconDel').hidden = !srvDraft.icon;
  $('#srvBannerDel').hidden = !srvDraft.banner;
  const card = el('div', 'group-card');
  const av = el('div', 'group-avatar');
  const info = el('div', 'group-info');
  info.append(el('div', 'group-name', srvDraft.name), el('div', 'group-sub', 'prévia'));
  if (srvDraft.desc) info.append(el('div', 'group-desc', srvDraft.desc));
  card.append(av, info);
  const g = { ...srvDraft, by: me.id };
  paintGroupAvatar(av, g, srvUrls);
  paintGroupBanner(card, g, srvUrls);
  $('#srvPreview').replaceChildren(card);
}
for (const id of ['#srvName', '#srvDesc', '#srvColor']) $(id).addEventListener('input', renderServerPreview);
let srvFileTarget = 'icon';
$('#srvIconBtn').onclick = () => {
  srvFileTarget = 'icon';
  $('#srvFile').click();
};
$('#srvBannerBtn').onclick = () => {
  srvFileTarget = 'banner';
  $('#srvFile').click();
};
$('#srvIconDel').onclick = () => {
  srvDraft.icon = '';
  renderServerPreview();
};
$('#srvBannerDel').onclick = () => {
  srvDraft.banner = '';
  renderServerPreview();
};
$('#srvFile').onchange = async () => {
  const file = $('#srvFile').files[0];
  $('#srvFile').value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast('Escolha uma imagem (PNG, JPG, GIF ou WebP)');
  if (file.size > 6 * 1024 * 1024) return toast('A imagem passa de 6 MB');
  const id = 'f:' + randId(12);
  await blobPut(id, file);
  srvUrls[id] = URL.createObjectURL(file);
  blobUrls.set(id, srvUrls[id]);
  srvDraft[srvFileTarget] = id;
  renderServerPreview();
};
$('#srvSave').onclick = () => {
  renderServerPreview();
  const g = grpRec();
  put({ ...g, k: 'grp', id: 'grp', name: srvDraft.name, desc: srvDraft.desc, icon: srvDraft.icon, banner: srvDraft.banner, color: srvDraft.color });
  closeDialog($('#serverDlg'));
  toast('Perfil do servidor salvo');
};
$('#groupName').onclick = $('#groupAvatar').onclick = $('#btnServer').onclick = openServerDialog;

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
const testOpts = () => ({ noise: $('#stNoise').value, echo: $('#stEcho').checked, gate: settings.gate });
// medidor da sensibilidade: -80 dB (esquerda) a -10 dB (direita)
const dbToPct = (db) => clamp(((db + 80) / 70) * 100, 0, 100);
function renderGateUi(level, thr, open) {
  const g = settings.gate;
  $('#stGateOn').checked = g.on;
  $('#stGateAuto').checked = g.auto;
  $('#stGateDb').value = g.db;
  $('#stGateDb').disabled = !g.on || g.auto;
  $('#sensBox').classList.toggle('off', !g.on);
  const t = g.auto && thr != null ? thr : g.db;
  $('#sensThr').style.left = dbToPct(t) + '%';
  $('#stGateVal').textContent = !g.on ? 'desligada (mic sempre aberto)' : g.auto ? `automática (${Math.round(t)} dB)` : `${g.db} dB`;
  if (level != null) {
    $('#sensLevel').style.width = dbToPct(level) + '%';
    $('#sensLevel').classList.toggle('pass', !!open);
  }
}
// muda na hora: no teste e na call
function applyGate() {
  saveSettings();
  for (const node of [testStream?.gate, C.micGate]) node?.port.postMessage(gateParams());
  renderGateUi();
}
$('#stGateOn').onchange = () => {
  settings.gate.on = $('#stGateOn').checked;
  applyGate();
};
$('#stGateAuto').onchange = () => {
  settings.gate.auto = $('#stGateAuto').checked;
  applyGate();
};
$('#stGateDb').oninput = () => {
  settings.gate.db = Number($('#stGateDb').value);
  applyGate();
};
async function startMicTest() {
  stopMicTest();
  renderGateUi(-100);
  try {
    const m = await getMic($('#stMic').value, testOpts());
    testStream = m;
    if (m.gate) {
      m.gate.port.onmessage = (e) => renderGateUi(e.data.level, e.data.thr, e.data.open);
      m.gate.port.postMessage({ report: true });
    }
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
  $('#sensLevel').style.width = '0';
}
// ============================================================ configurações (em abas, como no Discord)
let stPage = 'profile';
function showStPage(page) {
  stPage = page;
  $$('.st-tab[data-st]').forEach((t) => t.classList.toggle('active', t.dataset.st === page));
  $$('.st-page').forEach((p) => (p.hidden = p.dataset.page !== page));
  // Salvar só faz sentido onde há coisa para salvar
  const saves = ['profile', 'voice', 'app'].includes(page);
  $('#btnSaveSettings').hidden = !saves;
  $('#stFootNote').textContent = saves ? '' : 'Isto é salvo na hora.';
  $('.st-foot [data-close]').textContent = saves ? 'Cancelar' : 'Fechar';
  if (page === 'voice') startMicTest();
  else stopMicTest();
  if (page === 'plugins') renderPluginList();
  if (page === 'themes') renderThemeList();
  if (page === 'look') fillLookForm();
  popIn($(`.st-page[data-page="${page}"]`), { duration: 0.16 });
}
$$('.st-tab[data-st]').forEach((t) => (t.onclick = () => showStPage(t.dataset.st)));

async function openSettings(page = 'profile') {
  renderGoogleAcc();
  $$('[data-nogoogle]').forEach((e) => (e.hidden = !$('[data-google]').hidden));
  fillProfileForm();
  $('#stNoise').value = settings.noise;
  $('#stEcho').checked = settings.echo;
  $('#stHear').checked = false;
  $('#stSounds').checked = settings.sounds;
  $('#stHotkeys').checked = desktopPrefs.hotkeys;
  $('#stTray').checked = desktopPrefs.tray;
  $('#stAutostart').checked = desktopPrefs.autostart;
  await fillDevices();
  if (!$('#settingsDlg').open) openDialog($('#settingsDlg'));
  showStPage(page);
}
$('#btnSettings').onclick = () => openSettings(stPage === 'voice' ? 'voice' : 'profile');
$('#stMic').onchange = $('#stNoise').onchange = $('#stEcho').onchange = $('#stHear').onchange = startMicTest;
$('#settingsDlg').addEventListener('close', stopMicTest);
$('#btnSaveSettings').onclick = async () => {
  // perfil
  me.name = cleanName($('#stName').value) || me.name;
  me.color = cleanHex(draft.color) || me.color;
  me.p = cleanProfile(draft);
  store.set('profile', me);
  // voz
  const micChanged = settings.mic !== $('#stMic').value || settings.noise !== $('#stNoise').value || settings.echo !== $('#stEcho').checked;
  settings.mic = $('#stMic').value;
  settings.out = $('#stOut').value;
  settings.noise = $('#stNoise').value;
  settings.echo = $('#stEcho').checked;
  settings.sounds = $('#stSounds').checked;
  if (window.desk?.setPrefs) {
    window.desk
      .setPrefs({ hotkeys: $('#stHotkeys').checked, tray: $('#stTray').checked, autostart: $('#stAutostart').checked })
      .then((p) => (desktopPrefs = p))
      .catch(() => {});
  }
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
      C.micGate = next.gate || null;
      applyMicEnabled();
      meter('me', next.stream);
      syncMedia();
    } catch (err) {
      toast('Não consegui trocar o microfone: ' + err.message);
    }
  }
  sendHi();
  renderPresence();
  for (const box of chatBoxes()) renderChat(box.box, box.ch, true);
};

// ----- editor de perfil com prévia ao vivo -----
let draft = {};
const MAX_PROFILE_IMG = 6 * 1024 * 1024;
const draftUrls = {}; // prévia das imagens novas antes de salvar
function fillProfileForm() {
  draft = { ...me.p, color: me.color };
  $('#stName').value = me.name;
  $('#pfPronouns').value = draft.pronouns || '';
  $('#pfStatus').value = draft.status || '';
  $('#pfStatusEmoji').textContent = draft.statusEmoji || '🙂';
  $('#pfStatusEmoji').classList.toggle('unset', !draft.statusEmoji);
  $('#pfBio').value = draft.bio || '';
  $('#pfBannerColor').value = draft.bannerColor || me.color;
  $('#pfNameColor').value = me.color;
  $('#pfGradOn').checked = !!draft.grad;
  $('#pfGrad').value = draft.grad || '#ffffff';
  $('#pfFont').value = draft.font || '';
  $('#pfNameFx').value = draft.nameFx || '';
  $('#pfThemeOn').checked = !!draft.theme;
  $('#pfTheme1').value = draft.theme?.[0] || '#2a1d14';
  $('#pfTheme2').value = draft.theme?.[1] || me.color;
  $('#pfDeco').value = draft.deco || '';
  $('#pfEffect').value = draft.effect || '';
  renderProfilePreview();
}
function readProfileForm() {
  draft.pronouns = $('#pfPronouns').value;
  draft.status = $('#pfStatus').value;
  draft.bio = $('#pfBio').value;
  draft.bannerColor = $('#pfBannerColor').value;
  draft.color = $('#pfNameColor').value;
  draft.grad = $('#pfGradOn').checked ? $('#pfGrad').value : '';
  draft.font = $('#pfFont').value;
  draft.nameFx = $('#pfNameFx').value;
  draft.theme = $('#pfThemeOn').checked ? [$('#pfTheme1').value, $('#pfTheme2').value] : null;
  draft.deco = $('#pfDeco').value;
  draft.effect = $('#pfEffect').value;
  renderProfilePreview();
}
for (const id of ['#stName', '#pfPronouns', '#pfStatus', '#pfBio', '#pfBannerColor', '#pfNameColor', '#pfGradOn', '#pfGrad', '#pfFont', '#pfNameFx', '#pfThemeOn', '#pfTheme1', '#pfTheme2', '#pfDeco', '#pfEffect'])
  $(id).addEventListener('input', readProfileForm);
function renderProfilePreview() {
  $('#pfBioCount').textContent = `${$('#pfBio').value.length}/300`;
  $('#pfGradWrap').hidden = !$('#pfGradOn').checked;
  $('#pfThemeWrap').hidden = !$('#pfThemeOn').checked;
  $('#pfAvatarDel').hidden = !draft.avatar;
  $('#pfBannerDel').hidden = !draft.banner;
  const prof = cleanProfile(draft);
  const user = { id: me.id, name: cleanName($('#stName').value) || me.name, color: cleanHex(draft.color) || me.color };
  // avatar e nome do rascunho (os do perfil salvo continuam iguais até Salvar)
  const av = el('span', 'avatar', user.name[0] || '?');
  av.style.background = user.color;
  const avUrl = prof.avatar && (draftUrls[prof.avatar] || blobUrls.get(prof.avatar));
  if (avUrl) av.append(Object.assign(el('img'), { src: avUrl }));
  else if (!prof.avatar && me.google?.picture) av.append(Object.assign(el('img'), { src: me.google.picture, referrerPolicy: 'no-referrer' }));
  if (prof.deco) {
    av.classList.add('deco', 'deco-' + prof.deco);
    av.style.setProperty('--deco', user.color);
  }
  const nm = el('span', 'uname pc-uname', user.name);
  nm.style.color = user.color;
  if (prof.font) nm.classList.add('nf-' + prof.font);
  if (prof.grad) {
    nm.classList.add('name-grad');
    nm.style.setProperty('--n1', user.color);
    nm.style.setProperty('--n2', prof.grad);
  }
  if (prof.nameFx) nm.classList.add('nfx-' + prof.nameFx);
  const bannerUrl = prof.banner && (draftUrls[prof.banner] || blobUrls.get(prof.banner));
  $('#pfPreview').replaceChildren(profileCard(user, prof, { preview: true, avatarEl: av, nameEl: nm, bannerUrl }));
}
let pfFileTarget = 'avatar';
$('#pfAvatarBtn').onclick = () => {
  pfFileTarget = 'avatar';
  $('#pfFile').click();
};
$('#pfBannerBtn').onclick = () => {
  pfFileTarget = 'banner';
  $('#pfFile').click();
};
$('#pfAvatarDel').onclick = () => {
  draft.avatar = '';
  renderProfilePreview();
};
$('#pfBannerDel').onclick = () => {
  draft.banner = '';
  renderProfilePreview();
};
$('#pfFile').onchange = async () => {
  const file = $('#pfFile').files[0];
  $('#pfFile').value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast('Escolha uma imagem (PNG, JPG, GIF ou WebP)');
  if (file.size > MAX_PROFILE_IMG) return toast('A imagem passa de 6 MB');
  const id = 'f:' + randId(12);
  await blobPut(id, file);
  draftUrls[id] = URL.createObjectURL(file);
  draft[pfFileTarget] = id;
  renderProfilePreview();
};
$('#pfStatusEmoji').onclick = (e) =>
  openEmoji(e.currentTarget, (emoji) => {
    draft.statusEmoji = draft.statusEmoji === emoji ? '' : emoji;
    $('#pfStatusEmoji').textContent = draft.statusEmoji || '🙂';
    $('#pfStatusEmoji').classList.toggle('unset', !draft.statusEmoji);
    renderProfilePreview();
  });

// ============================================================ aparência
const THEMES = {
  padrao: { name: 'Janja', accent: '#ff7a1a', bg: '#141619', panel: '#1c1f23', panel2: '#23272c', panel3: '#2c3137', line: '#2a2e34', text: '#e4e6ea', muted: '#8b929c', faint: '#5d636c', input: '#121416', code: '#0f1113' },
  grafite: { name: 'Grafite', accent: '#5865f2', bg: '#1e1f22', panel: '#2b2d31', panel2: '#313338', panel3: '#3f4147', line: '#3a3c42', text: '#f2f3f5', muted: '#b5bac1', faint: '#80848e', input: '#1e1f22', code: '#1e1f22' },
  meianoite: { name: 'Meia-noite', accent: '#ff7a1a', bg: '#000000', panel: '#0a0a0c', panel2: '#121215', panel3: '#1c1c20', line: '#1c1c21', text: '#e8e8ec', muted: '#8a8a94', faint: '#55555e', input: '#000000', code: '#050506' },
  roxo: { name: 'Uva', accent: '#b07cff', bg: '#15111c', panel: '#1d1726', panel2: '#251d31', panel3: '#30263f', line: '#2c2338', text: '#ece6f5', muted: '#9d93ad', faint: '#665c75', input: '#120e18', code: '#100c15' },
  oceano: { name: 'Oceano', accent: '#3aa8f0', bg: '#0c141c', panel: '#111c26', panel2: '#162330', panel3: '#1e2e3e', line: '#1b2a38', text: '#e2ecf5', muted: '#8aa0b4', faint: '#566a7c', input: '#0a1118', code: '#081016' },
  floresta: { name: 'Floresta', accent: '#4fd18b', bg: '#0f1712', panel: '#141f18', panel2: '#1a271f', panel3: '#223328', line: '#1f2d24', text: '#e3efe7', muted: '#8fa597', faint: '#5a6e61', input: '#0c140f', code: '#0a110d' },
  sakura: { name: 'Sakura', accent: '#ff6fb5', bg: '#1a1216', panel: '#22171d', panel2: '#2b1d25', panel3: '#382530', line: '#33222c', text: '#f5e6ee', muted: '#b096a4', faint: '#7a6170', input: '#160f13', code: '#130d11' },
  claro: { name: 'Claro', light: true, accent: '#e8640c', bg: '#e3e5e8', panel: '#f2f3f5', panel2: '#ffffff', panel3: '#e3e5e8', line: '#d4d7dc', text: '#1e1f22', muted: '#5c6370', faint: '#8a919c', input: '#ffffff', code: '#e8eaee' },
};
const FONT_FAMILIES = {
  inter: 'system-ui, -apple-system, "Segoe UI Variable Text", sans-serif',
  round: '"Segoe UI Variable Display", "Arial Rounded MT Bold", "Segoe UI", sans-serif',
  mono: 'Consolas, "Cascadia Mono", monospace',
  serif: 'Georgia, "Times New Roman", serif',
};
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgba = (h, a) => `rgba(${hexRgb(h).join(', ')}, ${a})`;
const mixHex = (h, w, t) => '#' + hexRgb(h).map((c, i) => Math.round(c + (hexRgb(w)[i] - c) * t).toString(16).padStart(2, '0')).join('');
const isLight = (h) => {
  const [r, g, b] = hexRgb(h).map((c) => c / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
};
let lookBgUrl = null;
async function applyLook() {
  const t = THEMES[look.theme] || THEMES.padrao;
  const accent = cleanHex(look.accent) || t.accent;
  const glassA = look.bg ? 1 - look.glass / 100 : 1;
  const panel = (h) => (look.bg ? rgba(h, glassA) : h);
  const vars = {
    '--bg': look.bg ? rgba(t.bg, Math.max(0, glassA - 0.25)) : t.bg,
    '--titlebar': look.bg ? rgba(mixHex(t.bg, t.light ? '#ffffff' : '#000000', 0.3), glassA) : mixHex(t.bg, t.light ? '#ffffff' : '#000000', 0.3),
    '--panel': panel(t.panel),
    '--panel-2': panel(t.panel2),
    '--panel-3': t.panel3,
    '--line': t.line,
    '--text': t.text,
    '--muted': t.muted,
    '--faint': t.faint,
    '--input': look.bg ? rgba(t.input, Math.min(1, glassA + 0.15)) : t.input,
    '--code': t.code,
    '--accent': accent,
    '--accent-2': mixHex(accent, t.light ? '#000000' : '#ffffff', 0.25),
    '--accent-soft': rgba(accent, 0.14),
    '--on-accent': isLight(accent) ? '#1a0d02' : '#ffffff',
    '--font-ui': FONT_FAMILIES[look.family] || '"Segoe UI", system-ui, sans-serif',
  };
  let tag = $('#lookVars');
  if (!tag) {
    tag = el('style');
    tag.id = 'lookVars';
    document.head.append(tag);
  }
  tag.textContent = `:root {${Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ')} color-scheme: ${t.light ? 'light' : 'dark'}; }`;
  const b = document.body;
  b.classList.toggle('light', !!t.light);
  b.classList.toggle('compact', !!look.compact);
  b.classList.toggle('no-anim', !!look.noAnim);
  b.classList.toggle('r-square', look.radius === 'square');
  b.classList.toggle('r-round', look.radius === 'round');
  b.classList.toggle('has-bg', !!look.bg);
  $('#app').style.zoom = look.font === 100 ? '' : look.font / 100;
  // fundo
  let layer = $('#bgLayer');
  if (look.bg) {
    if (!layer) {
      layer = el('div');
      layer.id = 'bgLayer';
      document.body.prepend(layer);
    }
    const url = blobUrls.get(look.bg) || (await fileUrl(look.bg, me.id));
    lookBgUrl = url;
    layer.style.backgroundImage = url ? `url("${url}")` : '';
    layer.style.filter = look.blur ? `blur(${look.blur}px)` : '';
    layer.style.setProperty('--dim', look.dim / 100);
  } else layer?.remove();
  // temas importados e CSS rápido vêm por último para poder sobrescrever tudo
  $$('style[data-user-theme]').forEach((s) => s.remove());
  for (const th of look.themes.filter((x) => x.on)) {
    const s = el('style');
    s.dataset.userTheme = th.id;
    s.textContent = th.css;
    document.head.append(s);
  }
  let quick = $('#quickCssTag');
  if (!quick) {
    quick = el('style');
    quick.id = 'quickCssTag';
  }
  quick.textContent = look.css || '';
  document.head.append(quick); // sempre o último
}
const saveLook = () => {
  saveSettings();
  applyLook();
};
function fillLookForm() {
  const grid = $('#lkThemes');
  grid.replaceChildren(
    ...Object.entries(THEMES).map(([id, t]) => {
      const b = el('button', 'theme-tile' + (look.theme === id ? ' active' : ''));
      b.type = 'button';
      const sw = el('span', 'theme-swatch');
      sw.style.background = `linear-gradient(135deg, ${t.bg} 0 45%, ${t.panel2} 45% 75%, ${t.accent} 75%)`;
      b.append(sw, el('span', '', t.name));
      b.onclick = () => {
        look.theme = id;
        saveLook();
        fillLookForm();
      };
      return b;
    }),
  );
  $('#lkAccent').value = cleanHex(look.accent) || (THEMES[look.theme] || THEMES.padrao).accent;
  $('#lkDim').value = look.dim;
  $('#lkBlur').value = look.blur;
  $('#lkGlass').value = look.glass;
  $('#lkFont').value = look.font;
  $('#lkFontFamily').value = look.family;
  $('#lkRadius').value = look.radius;
  $('#lkCompact').checked = look.compact;
  $('#lkNoAnim').checked = look.noAnim;
  $('#lkNoFx').checked = look.noFx;
  $('#lkBgDel').hidden = !look.bg;
  $('#lkBgOpts').hidden = !look.bg;
  renderLookLabels();
}
function renderLookLabels() {
  $('#lkDimVal').textContent = look.dim + '%';
  $('#lkBlurVal').textContent = look.blur + 'px';
  $('#lkGlassVal').textContent = look.glass + '%';
  $('#lkFontVal').textContent = look.font + '%';
}
const lookInputs = {
  '#lkAccent': (v) => (look.accent = v),
  '#lkDim': (v) => (look.dim = +v),
  '#lkBlur': (v) => (look.blur = +v),
  '#lkGlass': (v) => (look.glass = +v),
  '#lkFont': (v) => (look.font = +v),
  '#lkFontFamily': (v) => (look.family = v),
  '#lkRadius': (v) => (look.radius = v),
};
for (const [id, set] of Object.entries(lookInputs))
  $(id).addEventListener('input', () => {
    set($(id).value);
    renderLookLabels();
    saveLook();
  });
for (const [id, key] of [
  ['#lkCompact', 'compact'],
  ['#lkNoAnim', 'noAnim'],
  ['#lkNoFx', 'noFx'],
])
  $(id).addEventListener('change', () => {
    look[key] = $(id).checked;
    saveLook();
    renderPresence();
    for (const box of chatBoxes()) renderChat(box.box, box.ch, true);
  });
$('#lkAccentReset').onclick = () => {
  look.accent = '';
  saveLook();
  fillLookForm();
};
$('#lkBgBtn').onclick = () => $('#lkBgFile').click();
$('#lkBgDel').onclick = () => {
  look.bg = '';
  saveLook();
  fillLookForm();
};
$('#lkBgFile').onchange = async () => {
  const file = $('#lkBgFile').files[0];
  $('#lkBgFile').value = '';
  if (!file?.type.startsWith('image/')) return;
  if (file.size > 30 * 1024 * 1024) return toast('A imagem passa de 30 MB');
  const id = 'f:' + randId(12);
  await blobPut(id, file);
  blobUrls.set(id, URL.createObjectURL(file));
  look.bg = id;
  saveLook();
  fillLookForm();
};

// ----- temas importados (formato do BetterDiscord) e CSS rápido -----
function parseMeta(src) {
  const block = String(src).match(/\/\*\*([\s\S]*?)\*\//)?.[1] || '';
  const meta = {};
  for (const m of block.matchAll(/@(\w+)\s+([^\n\r]*)/g)) meta[m[1]] = m[2].replace(/\s*\*?\s*$/, '').trim().slice(0, 200);
  return meta;
}
async function readImport(fileInput, urlPrompt) {
  if (fileInput) {
    const f = fileInput.files[0];
    fileInput.value = '';
    if (!f) return null;
    if (f.size > 1024 * 1024) throw new Error('Arquivo grande demais (máximo 1 MB)');
    return f.text();
  }
  const url = prompt(urlPrompt);
  if (!url) return null;
  if (!/^https:\/\//.test(url)) throw new Error('Use um link https://');
  const r = await fetch(url.replace(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\//, 'https://raw.githubusercontent.com/$1/$2/'));
  if (!r.ok) throw new Error('O link respondeu ' + r.status);
  const text = await r.text();
  if (text.length > 1024 * 1024) throw new Error('Arquivo grande demais (máximo 1 MB)');
  return text;
}
async function importTheme(fromUrl) {
  try {
    const css = await readImport(fromUrl ? null : $('#thFile'), 'Link do tema (.theme.css), ex.: um arquivo raw do GitHub');
    if (css == null) return;
    const meta = parseMeta(css);
    const th = { id: 't:' + randId(6), name: meta.name || 'Tema sem nome', author: meta.author || '', description: meta.description || '', version: meta.version || '', css, on: true };
    look.themes = look.themes.filter((x) => x.name !== th.name).concat(th);
    saveLook();
    renderThemeList();
    toast(`Tema "${th.name}" instalado`);
  } catch (err) {
    toast('Não deu para importar: ' + err.message);
  }
}
$('#thImport').onclick = () => $('#thFile').click();
$('#thFile').onchange = () => importTheme(false);
$('#thFromUrl').onclick = () => importTheme(true);
function renderThemeList() {
  const list = $('#thList');
  list.replaceChildren(
    ...look.themes.map((th) =>
      pluginRow({
        name: th.name,
        desc: th.description,
        author: th.author,
        version: th.version,
        on: th.on,
        onToggle: (on) => {
          th.on = on;
          saveLook();
        },
        onDelete: () => {
          look.themes = look.themes.filter((x) => x !== th);
          saveLook();
          renderThemeList();
        },
      }),
    ),
  );
  if (!look.themes.length) list.append(el('p', 'muted small', 'Nenhum tema instalado.'));
  $('#quickCss').value = look.css;
}
let quickTimer;
$('#quickCss').addEventListener('input', () => {
  clearTimeout(quickTimer);
  quickTimer = setTimeout(() => {
    look.css = $('#quickCss').value;
    saveLook();
  }, 150);
});
$('#quickCss').addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const ta = e.target;
  ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
  ta.dispatchEvent(new Event('input'));
});

// linha de plugin/tema com interruptor
function pluginRow({ name, desc, author, version, on, onToggle, onDelete, error }) {
  const row = el('div', 'plugin-row' + (on ? ' on' : ''));
  const info = el('div', 'pl-info');
  const title = el('div', 'pl-name', name);
  if (version) title.append(el('span', 'pl-ver', 'v' + version));
  info.append(title);
  if (author) info.append(el('div', 'pl-author', 'por ' + author));
  if (desc) info.append(el('div', 'pl-desc', desc));
  if (error) info.append(el('div', 'pl-error', error));
  const sw = el('label', 'switch');
  const cb = el('input');
  cb.type = 'checkbox';
  cb.checked = on;
  cb.onchange = () => {
    row.classList.toggle('on', cb.checked);
    onToggle(cb.checked);
  };
  sw.append(cb, el('span', 'slider'));
  row.append(info);
  if (onDelete) {
    const del = el('button', 'icon-btn danger');
    del.type = 'button';
    del.title = 'Remover';
    del.append(icon('trash-2', 'sm'));
    del.onclick = () => confirm(`Remover "${name}"?`) && onDelete();
    row.append(del);
  }
  row.append(sw);
  return row;
}

// ============================================================ plugins embutidos (estilo Vencord)
const BUILTIN_PLUGINS = [
  { id: 'messageLogger', name: 'Mensagens apagadas', desc: 'Guarda neste PC o que os outros apagaram ou editaram e mostra riscado/em vermelho. Só funciona para o que chegar depois de ligar.' },
  { id: 'volumeBoost', name: 'Volume até 300%', desc: 'O volume de cada amigo (clique na pessoa) vai até 300%, para quem tem o mic baixinho.' },
  { id: 'imageZoom', name: 'Zoom nas imagens', desc: 'Na imagem aberta em tela cheia: roda do mouse dá zoom e arrastar move.' },
  { id: 'fullTime', name: 'Horário completo', desc: 'Mostra data e horário com segundos nas mensagens.' },
  { id: 'dblClick', name: 'Clique duplo', desc: 'Clique duplo na sua mensagem edita; na dos outros, responde.' },
  { id: 'charCount', name: 'Contador de caracteres', desc: 'Mostra quantos caracteres faltam (máximo 2000) enquanto você digita.' },
  { id: 'mentions', name: 'Destacar quando falam de você', desc: 'Mensagem com o seu nome (ou @nome) fica destacada e toca o som mesmo com o chat aberto.' },
  { id: 'silentTyping', name: 'Digitação silenciosa', desc: 'Os outros não veem "está digitando…" quando você escreve.' },
  { id: 'hideBot', name: 'Esconder o DJ', desc: 'Esconde as mensagens do DJ no chat (os comandos continuam funcionando).' },
  { id: 'callTimer', name: 'Tempo de call', desc: 'Mostra há quanto tempo você está na call, embaixo do nome do canal.' },
  { id: 'noTypingSounds', name: 'Sem som de mensagem', desc: 'Não toca som quando chega mensagem (a janela ainda pisca).' },
];
function renderPluginList() {
  const q = $('#plSearch').value.trim().toLowerCase();
  const match = (p) => !q || (p.name + ' ' + p.desc).toLowerCase().includes(q);
  $('#plBuiltin').replaceChildren(
    ...BUILTIN_PLUGINS.filter(match).map((p) =>
      pluginRow({
        name: p.name,
        desc: p.desc,
        on: plug(p.id),
        onToggle: (on) => {
          settings.plugins[p.id] = on;
          saveSettings();
          onPluginToggled(p.id);
        },
      }),
    ),
  );
  $('#plUser').replaceChildren(
    ...userPlugins.filter(match).map((p) =>
      pluginRow({
        name: p.name,
        desc: p.desc,
        author: p.author,
        version: p.version,
        on: p.on,
        error: pluginErrors.get(p.id),
        onToggle: (on) => {
          p.on = on;
          saveUserPlugins();
          on ? startUserPlugin(p) : stopUserPlugin(p.id);
          setTimeout(renderPluginList, 50);
        },
        onDelete: () => {
          stopUserPlugin(p.id);
          userPlugins = userPlugins.filter((x) => x !== p);
          saveUserPlugins();
          renderPluginList();
        },
      }),
    ),
  );
  if (!userPlugins.length) $('#plUser').append(el('p', 'muted small', 'Nenhum plugin seu instalado ainda. Veja o exemplo no README do projeto.'));
}
$('#plSearch').addEventListener('input', renderPluginList);
function onPluginToggled(id) {
  if (['messageLogger', 'fullTime', 'mentions', 'dblClick', 'hideBot'].includes(id)) for (const box of chatBoxes()) renderChat(box.box, box.ch, true);
  if (id === 'volumeBoost') applyVolumes();
  if (id === 'charCount') updateCharCounts();
  if (id === 'callTimer') renderCallTimer();
}

// contador de caracteres
function updateCharCounts() {
  for (const field of [input, callInput]) {
    let c = field.parentElement.querySelector(':scope > .char-count');
    if (!c) {
      c = el('span', 'char-count');
      field.parentElement.append(c);
      field.addEventListener('input', updateCharCounts);
    }
    const n = field.value.length;
    c.hidden = !plug('charCount') || !n;
    c.textContent = `${n}/2000`;
    c.classList.toggle('over', n > 2000);
  }
}
updateCharCounts();

// tempo de call
function renderCallTimer() {
  let t = $('#vbTimer');
  if (!t) {
    t = el('span', 'vb-timer');
    t.id = 'vbTimer';
    $('#vbChannel').after(t);
  }
  t.hidden = !plug('callTimer') || !C.ch || !C.joinedAt;
  if (t.hidden) return;
  const s = Math.floor((Date.now() - C.joinedAt) / 1000);
  const p2 = (n) => String(n).padStart(2, '0');
  t.textContent = `${Math.floor(s / 3600)}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`;
}
setInterval(renderCallTimer, 1000);

// zoom nas imagens
{
  const img = $('#lightboxImg');
  const z = { s: 1, x: 0, y: 0, drag: null, moved: false };
  const apply = () => (img.style.transform = `translate(${z.x}px, ${z.y}px) scale(${z.s})`);
  $('#lightbox').addEventListener('click', (e) => {
    if (plug('imageZoom') && (e.target === img || z.moved)) e.stopImmediatePropagation();
    z.moved = false;
  }, true);
  img.addEventListener('wheel', (e) => {
    if (!plug('imageZoom')) return;
    e.preventDefault();
    z.s = clamp(z.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, 8);
    if (z.s === 1) z.x = z.y = 0;
    apply();
  });
  img.addEventListener('pointerdown', (e) => {
    if (!plug('imageZoom') || z.s === 1) return;
    z.drag = { x: e.clientX - z.x, y: e.clientY - z.y };
    img.setPointerCapture(e.pointerId);
  });
  img.addEventListener('pointermove', (e) => {
    if (!z.drag) return;
    z.x = e.clientX - z.drag.x;
    z.y = e.clientY - z.drag.y;
    z.moved = true;
    apply();
  });
  img.addEventListener('pointerup', () => (z.drag = null));
  new MutationObserver(() => {
    if (!$('#lightbox').hidden) return;
    Object.assign(z, { s: 1, x: 0, y: 0 });
    img.style.transform = '';
  }).observe($('#lightbox'), { attributes: true, attributeFilter: ['hidden'] });
}

// ============================================================ plugins do usuário (estilo BetterDiscord)
// Um plugin é um .plugin.js com cabeçalho /** @name … */ e module.exports = class { start() {} stop() {} }.
// Ele recebe a API em `janja` (veja o README).
let userPlugins = store.get('userPlugins', []);
const saveUserPlugins = () => store.set('userPlugins', userPlugins);
const pluginErrors = new Map();
const running = new Map(); // id -> { inst, cleanup: [] }
const pluginHooks = { message: new Map(), join: new Map(), leave: new Map() }; // evento -> Map(pluginId -> Set(fn))
const pluginCommands = new Map(); // nome -> { plugin, desc, fn }
function pluginEmit(event, payload) {
  for (const [pid, fns] of pluginHooks[event] || []) {
    for (const fn of fns) {
      try {
        fn(payload);
      } catch (err) {
        console.warn('plugin', pid, err);
      }
    }
  }
}
function pluginApi(pid) {
  const cleanup = () => running.get(pid)?.cleanup;
  const on = (event, fn) => {
    const map = pluginHooks[event];
    if (!map || typeof fn !== 'function') throw new Error('Evento desconhecido: ' + event);
    if (!map.has(pid)) map.set(pid, new Set());
    map.get(pid).add(fn);
    const off = () => map.get(pid)?.delete(fn);
    cleanup()?.push(off);
    return off;
  };
  const msgOut = (m) => ({ id: m.id, channel: m.ch, author: m.name, authorId: m.uid, text: m.text, mine: m.uid === me.id, bot: !!m.bot, time: m.ts });
  return Object.freeze({
    version: () => $('#appVersion').textContent.replace('janjahaters v', ''),
    me: () => ({ id: me.id, name: me.name, color: me.color }),
    channel: () => {
      const c = channel(S.view);
      return c ? { id: c.id, name: c.name, type: c.type } : null;
    },
    friends: () => uniquePeers(() => true).map((p) => ({ id: p.user.id, name: p.user.name, inCall: !!p.voice?.ch })),
    toast: (text) => toast(String(text).slice(0, 200)),
    send(text, ch) {
      const target = ch || textChatCh() || callChatCh();
      if (!target || !channel(target)) throw new Error('Nenhum canal aberto');
      put({ k: 'msg', id: 'm:' + randId(), ch: target, uid: me.id, name: me.name, color: me.color, text: String(text).slice(0, 2000), att: [], ts: Date.now() });
    },
    messages: (ch = S.view) => messagesOf(ch).map(msgOut),
    onMessage: (fn) => on('message', (m) => fn(msgOut(m))),
    on,
    command(name, desc, fn) {
      const n = String(name).toLowerCase();
      if (!/^\w{1,24}$/.test(n) || DJ_CMDS.has(n)) throw new Error('Nome de comando inválido ou já usado: ' + name);
      pluginCommands.set(n, { plugin: pid, desc: String(desc || ''), fn });
      const off = () => pluginCommands.get(n)?.plugin === pid && pluginCommands.delete(n);
      cleanup()?.push(off);
      return off;
    },
    addCSS(id, css) {
      const tagId = `plugcss-${pid}-${id}`.replace(/[^\w-]/g, '');
      let tag = document.getElementById(tagId);
      if (!tag) {
        tag = el('style');
        tag.id = tagId;
        document.head.append(tag);
        cleanup()?.push(() => tag.remove());
      }
      tag.textContent = String(css);
    },
    removeCSS: (id) => document.getElementById(`plugcss-${pid}-${id}`.replace(/[^\w-]/g, ''))?.remove(),
    storage: {
      get: (k, d) => store.get(`plug:${pid}:${k}`, d),
      set: (k, v) => store.set(`plug:${pid}:${k}`, v),
    },
  });
}
// o código roda como <script> (blob) para os erros apontarem a linha certa
window.__janjaLoad = (pid, factory) => {
  const slot = running.get(pid);
  if (!slot) return;
  const p = userPlugins.find((x) => x.id === pid);
  const module = { exports: {} };
  factory(module, module.exports, pluginApi(pid));
  let ex = module.exports;
  const meta = { name: p?.name, author: p?.author, version: p?.version };
  const inst = typeof ex === 'function' ? (ex.prototype?.start ? new ex(meta) : ex(meta)) : ex;
  slot.inst = inst;
  inst?.start?.();
};
function startUserPlugin(p) {
  if (running.has(p.id)) return;
  pluginErrors.delete(p.id);
  running.set(p.id, { inst: null, cleanup: [] });
  const src = `try { window.__janjaLoad(${JSON.stringify(p.id)}, function (module, exports, janja) {\n${p.code}\n}); } catch (err) { window.__janjaFail(${JSON.stringify(p.id)}, err); }`;
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  const s = el('script');
  s.src = url;
  s.onload = s.onerror = () => {
    URL.revokeObjectURL(url);
    s.remove();
  };
  document.head.append(s);
}
window.__janjaFail = (pid, err) => {
  pluginErrors.set(pid, 'Erro: ' + (err?.message || err));
  stopUserPlugin(pid);
  const p = userPlugins.find((x) => x.id === pid);
  toast(`O plugin "${p?.name || pid}" deu erro: ${err?.message || err}`);
  if ($('#settingsDlg').open && stPage === 'plugins') renderPluginList();
};
function stopUserPlugin(pid) {
  const slot = running.get(pid);
  if (!slot) return;
  running.delete(pid);
  try {
    slot.inst?.stop?.();
  } catch (err) {
    console.warn('plugin stop', err);
  }
  for (const fn of slot.cleanup) fn();
  for (const map of Object.values(pluginHooks)) map.delete(pid);
}
async function importPlugin(fromUrl) {
  try {
    const code = await readImport(fromUrl ? null : $('#plFile'), 'Link do plugin (.plugin.js), ex.: um arquivo raw do GitHub');
    if (code == null) return;
    const meta = parseMeta(code);
    if (!confirm(`Instalar o plugin "${meta.name || 'sem nome'}"${meta.author ? ' de ' + meta.author : ''}?\n\nEle vai rodar com acesso total ao app. Só continue se você confia em quem fez.`)) return;
    const p = { id: 'p:' + randId(6), name: meta.name || 'Plugin sem nome', author: meta.author || '', desc: meta.description || '', version: meta.version || '', code, on: true };
    const old = userPlugins.find((x) => x.name === p.name);
    if (old) {
      stopUserPlugin(old.id);
      userPlugins = userPlugins.filter((x) => x !== old);
    }
    userPlugins.push(p);
    saveUserPlugins();
    startUserPlugin(p);
    setTimeout(renderPluginList, 100);
    toast(`Plugin "${p.name}" instalado`);
  } catch (err) {
    toast('Não deu para importar: ' + err.message);
  }
}
$('#plImport').onclick = () => $('#plFile').click();
$('#plFile').onchange = () => importPlugin(false);
$('#plFromUrl').onclick = () => importPlugin(true);

applyLook();
for (const p of userPlugins) if (p.on) startUserPlugin(p);

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
  $('#tbUpdateText').textContent = isMobile ? `Versão ${version}: baixar` : `Versão ${version} pronta. Reiniciar`;
  if (b.hidden) {
    b.hidden = false;
    springIn(b);
    toast(isMobile ? `Saiu a versão ${version}. Toque no botão verde para baixar.` : `Nova versão ${version} baixada. Clique no botão verde para atualizar.`);
  }
}
$('#tbUpdate').onclick = () => {
  if (!isMobile && C.ch && !confirm('Reiniciar agora vai te tirar da call. Atualizar mesmo assim?')) return;
  if (isMobile) toast('Baixando… quando terminar, abra o arquivo para instalar por cima');
  window.desk?.installUpdate();
};
// o app só procura sozinho ao abrir; este botão procura na hora
const setUpdStatus = (t) => ($('#updStatus').textContent = t);
async function checkUpdateNow() {
  const b = $('#btnCheckUpdate');
  b.disabled = true;
  b.classList.add('busy');
  setUpdStatus('Procurando…');
  try {
    const r = await window.desk.checkUpdate();
    if (r.status === 'ready') {
      showUpdate(r.version);
      setUpdStatus(`Versão ${r.version} pronta: clique em Reiniciar lá em cima`);
    } else if (r.status === 'downloading') setUpdStatus(`Baixando a versão ${r.version}…`);
    else if (r.status === 'latest') setUpdStatus('Você já está na versão mais nova');
    else setUpdStatus('Modo de desenvolvimento: sem atualizações');
    return r;
  } catch (err) {
    setUpdStatus(ipcError(err));
  } finally {
    b.disabled = false;
    b.classList.remove('busy');
  }
}
$('#btnCheckUpdate').onclick = checkUpdateNow;

let desktopPrefs = { tray: true, hotkeys: true, autostart: false };
if (window.desk?.appInfo) {
  $$('[data-desk]').forEach((e) => (e.hidden = false));
  window.desk.onUpdateReady((v) => {
    showUpdate(v);
    setUpdStatus(`Versão ${v} pronta: clique em Reiniciar lá em cima`);
  });
  window.desk.onUpdateProgress((pct) => setUpdStatus(`Baixando atualização… ${pct}%`));
  window.desk.appInfo().then(({ version, updateReady, google, prefs }) => {
    $('#appVersion').textContent = `janjahaters v${version}`;
    $$('[data-google]').forEach((e) => (e.hidden = !google));
    if (prefs) desktopPrefs = prefs;
    if (updateReady) showUpdate(updateReady);
  });
  // atalhos globais e menu da bandeja
  window.desk.onHotkey((action) => {
    if (action === 'mute') {
      toggleMute();
      toast(C.muted ? 'Microfone mutado' : 'Microfone ligado');
    } else if (action === 'deafen') {
      toggleDeafen();
      toast(C.deafened ? 'Áudio desligado' : 'Áudio ligado');
    } else if (action === 'check-update') {
      openSettings('app');
      checkUpdateNow();
    }
  });
}

// ============================================================ qualidade de vida
// ----- menu do botão direito (pessoas, DJ, canais e mensagens) -----
function menuItem(label, iconName, fn, cls = '') {
  const b = el('button', 'ctx-item ' + cls);
  b.type = 'button';
  if (iconName) b.append(icon(iconName, 'sm'));
  b.append(el('span', '', label));
  b.onclick = () => {
    pop.hidden = true;
    fn();
  };
  return b;
}
function menuSlider(label, value, max, onInput) {
  const wrap = el('label', 'ctx-slider');
  const val = el('b', '', Math.round(value * 100) + '%');
  const r = el('input');
  r.type = 'range';
  r.min = 0;
  r.max = max;
  r.value = Math.min(max, Math.round(value * 100));
  r.oninput = () => {
    val.textContent = r.value + '%';
    onInput(r.value / 100);
  };
  wrap.append(wrapEl('span', 'ctx-slider-head', document.createTextNode(label), val), r);
  return wrap;
}
function openMenu(e, items) {
  e.preventDefault();
  const box = el('div', 'ctx-menu');
  box.append(...items.filter(Boolean));
  // abre onde o mouse está
  const anchor = { getBoundingClientRect: () => ({ left: e.clientX, right: e.clientX, top: e.clientY, bottom: e.clientY }) };
  openPopover(anchor, box);
  const r = pop.getBoundingClientRect();
  pop.style.top = clamp(e.clientY, 8, innerHeight - r.height - 8) + 'px';
}
function userFromUid(uid) {
  if (uid === me.id) return me;
  if (uid === 'dj') return DJ_USER;
  const p = [...peers.values()].find((x) => x.user?.id === uid);
  if (p) return p.user;
  const m = all('msg')
    .filter((x) => x.uid === uid && !x.bot)
    .pop();
  return m ? { id: uid, name: m.name, color: m.color } : null;
}
function userMenu(e, user) {
  const uid = user.id;
  const peer = [...peers.values()].find((p) => p.user?.id === uid);
  const head = el('div', 'ctx-head');
  head.append(avatar(user.name, user.color, 'xs', uid), nameEl(user.name, user.color, uid));
  if (uid === 'dj') {
    const { pb, item } = pbOf(C.ch);
    return openMenu(e, [
      head,
      menuItem('Abrir a música', 'list-music', () => selectTab('music')),
      item && menuItem(pb?.pausedAt != null ? 'Continuar' : 'Pausar', pb?.pausedAt != null ? 'play' : 'pause', () => $('#plPlay').click()),
      item && menuItem('Pular', 'skip-forward', () => $('#plSkip').click()),
      menuItem('Embaralhar a fila', 'shuffle', () => $('#plShuffle').click()),
      menuItem(recs.get('pb:' + C.ch)?.auto === false ? 'Ligar autoplay' : 'Desligar autoplay', 'infinity', () => $('#plAuto').click()),
    ]);
  }
  if (uid === me.id) {
    return openMenu(e, [
      head,
      ...STATUSES.map(([st, label]) => menuItem(label + (myStatus() === st ? '  ✓' : ''), null, () => setStatus(st), 'st-' + st)),
      el('div', 'ctx-sep'),
      menuItem('Ver perfil', 'user', () => openProfile(me, e.target)),
      menuItem('Editar perfil', 'pencil', () => openSettings('profile')),
    ]);
  }
  const muted = !!settings.localMute[uid];
  const streaming = peer?.voice?.streaming && C.ch && peer.voice.ch === C.ch;
  const max = plug('volumeBoost') ? 300 : 200;
  openMenu(e, [
    head,
    menuItem('Ver perfil', 'user', () => openProfile(user, e.target)),
    menuItem('Mencionar', 'message-square', () => mention(user.name)),
    el('div', 'ctx-sep'),
    menuSlider('Volume do usuário', settings.volumes[uid] ?? 1, max, (v) => {
      settings.volumes[uid] = v;
      saveSettings();
      applyVolumes();
    }),
    streaming &&
      menuSlider('Volume da stream', settings.streamVolumes[uid] ?? 1, max, (v) => {
        settings.streamVolumes[uid] = v;
        saveSettings();
        applyVolumes();
      }),
    menuItem(muted ? 'Voltar a ouvir' : 'Silenciar para mim', muted ? 'volume-2' : 'volume-x', () => {
      settings.localMute[uid] = !muted;
      if (muted) delete settings.localMute[uid];
      saveSettings();
      applyVolumes();
      renderPresence();
    }, muted ? '' : 'danger'),
    streaming && (C.watching.has(peer.pid) ? menuItem('Parar de assistir', 'eye-off', () => unwatchStream(peer.pid)) : menuItem('Assistir a stream', 'eye', () => watchStream(peer.pid))),
    streaming && C.watching.has(peer.pid) && menuItem(settings.streamMute[uid] ? 'Desmutar a stream' : 'Mutar a stream', settings.streamMute[uid] ? 'volume-2' : 'volume-x', () => toggleStreamMute(uid)),
    el('div', 'ctx-sep'),
    menuItem('Copiar nome', 'copy', () => navigator.clipboard.writeText(user.name).catch(() => {})),
  ]);
}
function channelMenu(e, c) {
  const muted = !!settings.mutedCh[c.id];
  openMenu(e, [
    el('div', 'ctx-head', (c.type === 'text' ? '# ' : '') + c.name),
    c.type === 'voice' && menuItem(C.ch === c.id ? 'Sair da call' : 'Entrar na call', C.ch === c.id ? 'phone-off' : 'phone', () => (C.ch === c.id ? leaveVoice() : (openView(c.id), joinVoice(c.id)))),
    c.type === 'text' &&
      menuItem('Marcar como lido', 'check', () => {
        S.unread.delete(c.id);
        markRead(c.id);
        renderSidebar();
      }),
    menuItem(muted ? 'Voltar a notificar' : 'Silenciar canal', muted ? 'volume-2' : 'volume-x', () => {
      settings.mutedCh[c.id] = !muted;
      if (muted) delete settings.mutedCh[c.id];
      saveSettings();
      renderSidebar();
    }),
    menuItem('Editar canal', 'pencil', () => openChannelDialog(c.type, c)),
  ]);
}
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('input, textarea, a, .text')) return; // deixa copiar/colar e selecionar texto
  const ch = e.target.closest('[data-chid]');
  if (ch) return channel(ch.dataset.chid) && channelMenu(e, channel(ch.dataset.chid));
  const u = e.target.closest('[data-uid]');
  if (!u) return;
  const user = userFromUid(u.dataset.uid);
  if (user) userMenu(e, user);
});

// ----- status: Online / Ausente / Não perturbe -----
const STATUSES = [
  ['online', 'Online'],
  ['idle', 'Ausente'],
  ['dnd', 'Não perturbe'],
];
let autoIdle = false;
const myStatus = () => (autoIdle && me.status !== 'dnd' ? 'idle' : me.status || 'online');
function setStatus(st) {
  me.status = st;
  autoIdle = false;
  store.set('profile', me);
  sendHi();
  renderPresence();
  toast(st === 'dnd' ? 'Não perturbe: sem sons nem piscar de mensagens' : `Status: ${STATUSES.find((x) => x[0] === st)[1]}`);
}
const statusOf = (uid) => (uid === me.id ? myStatus() : [...peers.values()].find((p) => p.user?.id === uid)?.user?.st || 'online');
// ausente sozinho depois de 10 min sem mexer no PC
let lastActive = Date.now();
for (const ev of ['mousemove', 'keydown', 'mousedown', 'wheel']) addEventListener(ev, () => {
  lastActive = Date.now();
  if (autoIdle) {
    autoIdle = false;
    sendHi();
    renderPresence();
  }
}, { passive: true });
setInterval(() => {
  if (!autoIdle && (me.status || 'online') === 'online' && !C.ch && Date.now() - lastActive > 10 * 60_000) {
    autoIdle = true;
    sendHi();
    renderPresence();
  }
}, 30_000);

// ----- reações -----
const emojiKey = (e) => [...e].map((c) => c.codePointAt(0).toString(16)).join('-');
const reactionsOf = (msgId) => all('rx').filter((r) => r.msg === msgId);
function toggleReaction(m, emoji) {
  if (!R || !emoji) return;
  const id = `rx:${m.id}:${me.id.slice(0, 16)}:${emojiKey(emoji)}`.slice(0, 80);
  const cur = recs.get(id);
  if (cur && !cur.del) put({ ...cur, del: true });
  else put({ k: 'rx', id, msg: m.id, ch: m.ch, emoji: String(emoji).slice(0, 16), uid: me.id, name: me.name, at: Date.now() });
}
function reactionsEl(m) {
  const box = el('div', 'reactions');
  box.dataset.rx = m.id;
  const groups = new Map();
  for (const r of reactionsOf(m.id).sort((a, b) => a.at - b.at)) {
    if (!groups.has(r.emoji)) groups.set(r.emoji, []);
    groups.get(r.emoji).push(r);
  }
  for (const [emoji, list] of groups) {
    const mine = list.some((r) => r.uid === me.id);
    const b = el('button', 'rx' + (mine ? ' mine' : ''));
    b.type = 'button';
    b.title = list.map((r) => r.name).join(', ');
    b.append(el('span', 'rx-e', emoji), el('span', 'rx-n', String(list.length)));
    b.onclick = () => toggleReaction(m, emoji);
    box.append(b);
  }
  if (groups.size) {
    const add = el('button', 'rx rx-add');
    add.type = 'button';
    add.title = 'Reagir';
    add.append(icon('face-slightly-smiling-plus', 'sm'));
    add.onclick = (e) => openEmoji(e.currentTarget, (emoji) => toggleReaction(m, emoji));
    box.append(add);
  }
  return box;
}
function refreshReactions(msgIds) {
  for (const id of msgIds) {
    const m = recs.get(id);
    for (const node of $$(`.reactions[data-rx="${id}"]`)) if (m) node.replaceWith(reactionsEl(m));
  }
}

// ----- @menções: completar o nome enquanto digita -----
function knownNames() {
  const names = new Map();
  for (const p of peers.values()) if (p.user) names.set(p.user.id, p.user);
  for (const m of all('msg')) if (!m.bot && !names.has(m.uid)) names.set(m.uid, { id: m.uid, name: m.name, color: m.color });
  names.delete(me.id);
  return [...names.values()];
}
function mention(name) {
  const field = channel(S.view)?.type === 'text' ? input : callInput;
  field.value = (field.value && !field.value.endsWith(' ') ? field.value + ' ' : field.value) + '@' + name + ' ';
  field.dispatchEvent(new Event('input'));
  field.focus();
}
const mentionBox = el('div', 'mention-box');
mentionBox.hidden = true;
document.body.append(mentionBox);
let mentionState = null;
function updateMentions(field) {
  const before = field.value.slice(0, field.selectionStart);
  const m = before.match(/(^|\s)@([^\s@]{0,32})$/);
  if (!m) return hideMentions();
  const q = plainText(m[2]);
  const list = knownNames()
    .filter((u) => plainText(u.name).includes(q))
    .slice(0, 6);
  if (!list.length) return hideMentions();
  mentionState = { field, start: before.length - m[2].length - 1, list, sel: 0 };
  renderMentions();
}
const plainText = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
function renderMentions() {
  const { field, list, sel } = mentionState;
  mentionBox.replaceChildren(
    el('div', 'mention-head', 'Pessoas'),
    ...list.map((u, i) => {
      const b = el('button', 'mention-item' + (i === sel ? ' sel' : ''));
      b.type = 'button';
      b.append(avatar(u.name, u.color, 'xs', u.id), nameEl(u.name, u.color, u.id));
      b.onmousedown = (e) => {
        e.preventDefault();
        pickMention(i);
      };
      return b;
    }),
  );
  mentionBox.hidden = false;
  const r = field.closest('form').getBoundingClientRect();
  mentionBox.style.left = r.left + 'px';
  mentionBox.style.width = Math.min(360, r.width) + 'px';
  mentionBox.style.top = r.top - mentionBox.offsetHeight - 6 + 'px';
}
function hideMentions() {
  mentionState = null;
  mentionBox.hidden = true;
}
function pickMention(i) {
  const { field, start } = mentionState;
  const u = mentionState.list[i];
  const end = field.selectionStart;
  field.value = field.value.slice(0, start) + '@' + u.name + ' ' + field.value.slice(end);
  const pos = start + u.name.length + 2;
  field.setSelectionRange(pos, pos);
  hideMentions();
  field.dispatchEvent(new Event('input'));
  field.focus();
}
for (const field of [input, callInput]) {
  field.addEventListener('input', () => updateMentions(field));
  field.addEventListener('blur', () => setTimeout(hideMentions, 100));
  // pega antes do Enter de enviar
  field.addEventListener(
    'keydown',
    (e) => {
      if (!mentionState || mentionState.field !== field) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const n = mentionState.list.length;
        mentionState.sel = (mentionState.sel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
        renderMentions();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopImmediatePropagation();
        pickMention(mentionState.sel);
      } else if (e.key === 'Escape') hideMentions();
    },
    true,
  );
}
const mentionedMe = (text) => {
  const n = me.name?.trim();
  return !!n && String(text || '').toLowerCase().includes('@' + n.toLowerCase());
};

// ----- "novas mensagens": onde você parou de ler -----
const readAt = store.get('readAt', {}); // canal -> horário da última mensagem vista
function markRead(ch) {
  const last = messagesOf(ch).pop();
  readAt[ch] = Math.max(readAt[ch] || 0, last?.ts || Date.now());
  store.set('readAt', readAt);
}

// ----- buscar no canal (Ctrl+F) -----
function toggleChatSearch(open = $('#chatSearch').hidden) {
  if (channel(S.view)?.type !== 'text') return;
  $('#chatSearch').hidden = !open;
  if (open) {
    $('#chatSearchInput').focus();
    $('#chatSearchInput').select();
  } else {
    $('#chatSearchInput').value = '';
    S.filter = '';
    renderMessages();
  }
}
$('#btnChatSearch').onclick = () => toggleChatSearch();
$('#chatSearchInput').addEventListener('input', () => {
  S.filter = $('#chatSearchInput').value.trim();
  renderMessages();
});
$('#chatSearchInput').addEventListener('keydown', (e) => e.key === 'Escape' && toggleChatSearch(false));

// ----- trocar de canal rápido (Ctrl+K) e atalhos -----
function openSwitcher() {
  const dlg = $('#switcherDlg');
  const inp = $('#swInput');
  inp.value = '';
  let sel = 0;
  const items = () => {
    const q = plainText(inp.value.trim());
    return [...channels('text'), ...channels('voice')].filter((c) => plainText(c.name).includes(q));
  };
  const render = () => {
    const list = items();
    sel = clamp(sel, 0, Math.max(0, list.length - 1));
    $('#swList').replaceChildren(
      ...list.map((c, i) => {
        const b = el('button', 'sw-item' + (i === sel ? ' sel' : ''));
        b.type = 'button';
        b.append(icon(c.type === 'text' ? 'hash' : 'volume-2', 'sm'), el('span', '', c.name));
        if (S.unread.has(c.id)) b.append(el('span', 'unread-dot'));
        if (c.type === 'voice') b.append(el('span', 'sw-hint', C.ch === c.id ? 'na call' : `${voiceMembers(c.id).length} na call`));
        b.onclick = () => go(c);
        return b;
      }),
    );
    if (!list.length) $('#swList').append(el('p', 'muted small', 'Nenhum canal com esse nome.'));
  };
  const go = (c) => {
    dlg.close();
    openView(c.id);
    if (c.type === 'voice' && C.ch !== c.id) joinVoice(c.id);
  };
  inp.oninput = () => {
    sel = 0;
    render();
  };
  inp.onkeydown = (e) => {
    const list = items();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % Math.max(1, list.length);
      render();
    } else if (e.key === 'Enter' && list[sel]) go(list[sel]);
  };
  render();
  openDialog(dlg);
  inp.focus();
}
function moveChannel(dir) {
  const list = [...channels('text'), ...channels('voice')];
  const i = list.findIndex((c) => c.id === S.view);
  const next = list[(i + dir + list.length) % list.length];
  if (next) openView(next.id);
}
function nextUnread() {
  const c = channels('text').find((x) => S.unread.has(x.id));
  c ? openView(c.id) : toast('Nenhum canal com mensagem nova');
}
document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && k === 'k') {
    e.preventDefault();
    if (R) openSwitcher();
  } else if (ctrl && k === 'f' && channel(S.view)?.type === 'text') {
    e.preventDefault();
    toggleChatSearch(true);
  } else if (ctrl && (k === '/' || k === ';')) {
    e.preventDefault();
    openDialog($('#keysDlg'));
  } else if (ctrl && e.shiftKey && k === 'm' && !window.desk) {
    e.preventDefault();
    toggleMute(); // no app os atalhos globais já fazem isso
  } else if (ctrl && e.shiftKey && k === 'd' && !window.desk) {
    e.preventDefault();
    toggleDeafen();
  } else if (e.altKey && (k === 'arrowup' || k === 'arrowdown')) {
    e.preventDefault();
    e.shiftKey ? nextUnread() : moveChannel(k === 'arrowup' ? -1 : 1);
  } else if (ctrl && k === ',') {
    e.preventDefault();
    openSettings();
  } else if (e.key === 'Escape' && !$('#chatSearch').hidden && document.activeElement !== $('#chatSearchInput')) toggleChatSearch(false);
});

// ============================================================ celular (app Android)
// Uma tela por vez: Canais | Conversa | Painel (pessoas, chat da call, música, sons)
function setPane(p) {
  if (!isMobile) return;
  $('#app').dataset.pane = p;
  $$('#mobileNav button').forEach((b) => b.classList.toggle('active', b.dataset.pane === p));
}
if (isMobile) {
  setPane('center');
  $$('#mobileNav button').forEach((b) => (b.onclick = () => setPane(b.dataset.pane)));
  // sem stream de tela, janela, login com Google e opções do PC
  for (const sel of ['#ctlStream', '#vbStream', '#winButtons', '#ctlStreamCfg']) $(sel).hidden = true;
  $$('[data-pc]').forEach((e) => e.remove());
  // toque na mensagem mostra os botões (no PC aparecem ao passar o mouse)
  document.addEventListener('click', (e) => {
    const m = e.target.closest('.msg');
    if (e.target.closest('.msg-actions, a, button, img, video, audio, textarea')) return;
    $$('.msg.tapped').forEach((x) => x !== m && x.classList.remove('tapped'));
    m?.classList.toggle('tapped');
  });
  // botão voltar do Android: fecha o que estiver aberto, depois volta para a conversa, depois minimiza
  window.desk.backButton(() => {
    const dlg = $$('dialog').find((d) => d.open);
    if (!pop.hidden) pop.hidden = true;
    else if (!$('#lightbox').hidden) $('#lightbox').click();
    else if (dlg) closeDialog(dlg);
    else if ($('#app').dataset.pane !== 'center') setPane('center');
    else window.desk.minimize();
  });
}
function renderMobileNav() {
  if (!isMobile) return;
  const unread = channels('text').some((c) => S.unread.has(c.id) && c.id !== S.view);
  $('#mnUnread').hidden = !unread;
  $('#mnCall').hidden = !C.ch;
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
  loadLogger();
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

window.__toca = { peers, C, recs, Y, advance, pbOf, queueOf }; // para depurar pelo DevTools (Ctrl+Shift+I)

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
