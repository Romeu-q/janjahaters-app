import { joinRoom, selfId } from 'trystero';
import { TURN } from './turn.gen.js';
import { animate, stagger } from 'motion';
import { buildMicChain } from './mic-chain.js';
import { FIG, ONE_HAND, cleanFig, cleanPos } from './figure.js';
import * as ident from './identity.js';
import { initDM } from './dm.js';
import {
  createElement,
  ArrowDown,
  Video,
  VideoOff,
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
  Maximize2,
  Minimize2,
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
  BellRing,
  ArrowDownToLine,
  Moon,
  Server,
  Crown,
  Sprout,
  PinOff,
  CornerUpLeft,
  ChevronDown,
  ChevronRight,
  Shield,
  Ban,
  UserMinus,
  Sparkles,
  Sofa,
  Shirt,
  GripVertical,
  Tent,
  Swords,
  Gamepad2,
  Dices,
  BookOpen,
  Ruler,
  Target,
  Scroll,
  Heart,
  Flame,
  Wand2,
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
  video: Video,
  'video-off': VideoOff,
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
  'maximize-2': Maximize2,
  'minimize-2': Minimize2,
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
  'pin-off': PinOff,
  crown: Crown,
  sprout: Sprout,
  'corner-up-left': CornerUpLeft,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  shield: Shield,
  ban: Ban,
  'user-minus': UserMinus,
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
  'bell-ring': BellRing,
  'arrow-down-to-line': ArrowDownToLine,
  moon: Moon,
  server: Server,
  sparkles: Sparkles,
  sofa: Sofa,
  shirt: Shirt,
  'grip-vertical': GripVertical,
  tent: Tent,
  swords: Swords,
  'gamepad-2': Gamepad2,
  dices: Dices,
  book: BookOpen,
  ruler: Ruler,
  target: Target,
  scroll: Scroll,
  heart: Heart,
  flame: Flame,
  wand: Wand2,
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
// estilo "Bolha" (o padrão): as coisas aparecem com um pulinho de mola, como uma bolha
const bubbly = () => document.body.classList.contains('style-bolha');
const noMotion = () => typeof look !== 'undefined' && look.noAnim;
const SPRING = { type: 'spring', stiffness: 460, damping: 22 };
function popIn(els, opts = {}) {
  if (noMotion()) return Promise.resolve();
  if (!bubbly()) return animate(els, { opacity: [0, 1], y: [6, 0] }, { duration: 0.22, ease: EASE, ...opts });
  const { duration, ease, ...rest } = opts;
  return animate(els, { opacity: [0, 1], scale: [0.86, 1], y: [8, 0] }, { ...SPRING, ...rest });
}
function springIn(els, opts = {}) {
  if (noMotion()) return Promise.resolve();
  return animate(els, { opacity: [0, 1], scale: [bubbly() ? 0.8 : 0.9, 1] }, bubbly() ? { ...SPRING, ...opts } : { type: 'spring', stiffness: 380, damping: 26, ...opts });
}
// abrir janela/menu: com mola no estilo Bolha
const openAnim = (node, from = 0.95) =>
  noMotion() ? null : bubbly() ? animate(node, { opacity: [0, 1], scale: [from - 0.07, 1] }, SPRING) : animate(node, { opacity: [0, 1], scale: [from, 1] }, { duration: 0.15, ease: EASE });
// Janelas (dialogs): uma janela que ficasse aberta e invisível (animação de fechar interrompida) bloquearia
// os cliques e a digitação das outras. Por isso: fechar sempre de verdade e, ao abrir, limpar as travadas.
function hardClose(dlg) {
  if (dlg.open) dlg.close();
  dlg.style.opacity = '';
  dlg.style.transform = '';
  dlg.dataset.closing = '';
}
function openDialog(dlg) {
  for (const other of document.querySelectorAll('dialog[open]')) {
    if (other !== dlg && (other.dataset.closing || Number(getComputedStyle(other).opacity) < 0.05)) hardClose(other);
  }
  if (dlg.open) hardClose(dlg); // reabrindo a mesma: começa limpa e fica por cima
  dlg.showModal();
  if (bubbly()) openAnim(dlg, 0.96);
  else if (!noMotion()) animate(dlg, { opacity: [0, 1], scale: [0.96, 1], y: [10, 0] }, { duration: 0.22, ease: EASE });
}
async function closeDialog(dlg) {
  if (!dlg.open) return;
  dlg.dataset.closing = '1';
  // fecha quando a animação acabar, ou em 250 ms se ela travar (janela minimizada, aba em segundo plano…)
  await Promise.race([animate(dlg, { opacity: 0, scale: 0.97 }, { duration: 0.12 }), new Promise((r) => setTimeout(r, 250))]);
  if (dlg.dataset.closing) hardClose(dlg);
}
// erro inesperado aparece na tela (ajuda a descobrir bug relatado pelos amigos)
addEventListener('error', (e) => e.message && toast('Erro no app: ' + e.message));
addEventListener('unhandledrejection', (e) => toast('Erro no app: ' + (e.reason?.message || e.reason)));

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
  s.style.color = cleanColor((uid && roleColorOf(uid)) || color);
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
    if (bubbly() && !noMotion()) animate(t, { opacity: [0, 1], scale: [0.7, 1], y: [16, 0] }, SPRING);
    else animate(t, { opacity: [0, 1], y: [12, 0] }, { duration: 0.2, ease: EASE });
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(async () => {
    await animate(t, { opacity: 0, y: 8 }, { duration: 0.15 });
    t.hidden = true;
  }, 3500);
}

// ============================================================ estado local
const freshProfile = !store.get('profile', null);
const me = store.get('profile', { id: randId(16), name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] });
const settings = Object.assign(
  { mic: '', out: '', noise: 'strong', echo: true, sounds: true, musicVol: 0.6, musicMuted: false, sndVol: 0.7, volumes: {},
    netMode: 'auto', antiPing: true,
    stream: { preset: 'std', res: 1080, fps: 30, rate: 0, codec: 'auto', mode: 'balanced', audio: false, audioRate: 192 } },
  store.get('settings', {}),
);
if (!['cloudflare', 'auto', 'p2p'].includes(settings.netMode)) settings.netMode = 'auto';
// 2.10.3: a 2.10.2 mandava todo mundo pelo TURN (mais atraso, sem aliviar quem transmite e gastando a cota).
// Volta todos para o Automático uma vez; quem quiser o servidor escolhe de novo no menu do ping.
if ((settings.netVersion || 0) < 1) {
  settings.netMode = 'auto';
  settings.netVersion = 1;
}
if (typeof settings.antiPing !== 'boolean') settings.antiPing = true;
if (typeof settings.noise === 'boolean') settings.noise = settings.noise ? 'strong' : 'off'; // versão 1.0 guardava sim/não
// v1.12: o DeepFilterNet3 deixou o mic ruim para a galera: todo mundo volta para o RNNoise (Forte).
// v1.19: o DeepFilterNet3 saiu do app; quem ainda estava nele vai para o RNNoise.
if ((settings.nsVersion || 0) < 3 || settings.noise === 'dfn') {
  if (settings.noise === 'dfn') settings.noise = 'strong';
  settings.nsVersion = 3;
  store.set('settings', settings);
}
// v2.1: o Janja Voice saiu do app (só o RNNoise, com o anti-impacto na frente). Quem estava nele volta para o RNNoise.
if ((settings.nsVersion || 0) < 5 || settings.noise === 'janja') {
  if (settings.noise === 'janja') settings.noise = 'strong';
  settings.nsVersion = 5;
  store.set('settings', settings);
}
// aparência (só deste PC) e plugins ligados
const LOOK_DEFAULTS = { style: 'bolha', theme: 'padrao', accent: '', bg: '', dim: 50, blur: 0, glass: 25, font: 100, family: '', radius: '', compact: false, noAnim: false, noFx: false, css: '', themes: [], room: !isMobile };
settings.look = { ...LOOK_DEFAULTS, ...settings.look };
settings.plugins = { ...settings.plugins };
settings.gate = { on: true, auto: true, db: -50, impact: true, ...settings.gate }; // sensibilidade do mic e anti-impacto
settings.localMute = { ...settings.localMute }; // uid -> silenciado só para mim
settings.streamMute = { ...settings.streamMute }; // uid -> som da stream dele mutado só para mim
settings.streamVolumes = { ...settings.streamVolumes }; // uid -> volume do áudio da stream
settings.mutedCh = { ...settings.mutedCh }; // canais sem notificação
settings.ptt = { vk: 0, label: '', ...settings.ptt };
settings.sfxFiles = { join: '', leave: '', ...settings.sfxFiles }; // nome do arquivo escolhido para entrar/sair ('' = padrão) // aperte para falar: tecla virtual do Windows (0 = desligado)
const look = settings.look;
// plugins vêm ligados: só fica desligado o que a pessoa desligou em Opções > Plugins
const plug = (id) => settings.plugins[id] !== false;
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
// Toques do app (entrar/sair da call, mensagem…): notas com "sino" (dois osciladores e eco curto),
// altos o bastante para ouvir por cima do jogo/música. Volume em Configurações → Voz e áudio.
function beep(freqs, dur = 0.12, vol = 0.22) {
  if (!settings.sounds) return;
  try {
    const ctx = audioCtx();
    const master = ctx.createGain();
    master.gain.value = vol * (settings.sfxVol ?? 0.8);
    master.connect(ctx.destination);
    const start = ctx.currentTime + 0.03; // logo depois de o áudio acordar
    freqs.forEach((f, i) => {
      const t = start + i * dur;
      for (const [type, mult, amp] of [
        ['triangle', 1, 1],
        ['sine', 2, 0.25],
      ]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = f * mult;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amp, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 2.2);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + dur * 2.3);
      }
    });
    setTimeout(() => master.disconnect(), (freqs.length * dur * 2.5 + 0.3) * 1000);
  } catch (err) {
    console.warn('som', err);
  }
}
// Entrar/sair: som de marimba macio, no estilo dos toques do Skype (fundamental + parcial 4x que some
// rápido, ataque curto). Se a pessoa escolheu um arquivo em Voz e áudio, toca o arquivo no lugar.
const sfxBuf = { join: null, leave: null };
async function loadSfxFile(kind) {
  sfxBuf[kind] = null;
  if (!settings.sfxFiles[kind]) return;
  const blob = await blobGet('sfx:' + kind); // fica só neste PC (os amigos só pedem ids "f:...")
  if (!blob) return;
  try {
    sfxBuf[kind] = await audioCtx().decodeAudioData(await blob.arrayBuffer());
  } catch {
    sfxBuf[kind] = null;
  }
}
function marimba(freqs) {
  if (!settings.sounds) return;
  try {
    const ctx = audioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.3 * (settings.sfxVol ?? 0.8);
    master.connect(ctx.destination);
    const start = ctx.currentTime + 0.03;
    freqs.forEach((f, n) => {
      const t = start + n * 0.11;
      for (const [mult, amp, dec] of [
        [1, 1, 0.42],
        [3.93, 0.35, 0.09],
        [10.1, 0.08, 0.035],
      ]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f * mult * 1.012, t);
        o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.04);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amp, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + dec + 0.02);
      }
    });
    setTimeout(() => master.disconnect(), 1200);
  } catch (err) {
    console.warn('som', err);
  }
}
function joinLeaveSound(kind) {
  if (!settings.sounds) return;
  const buf = sfxBuf[kind];
  if (!buf) return marimba(kind === 'join' ? [659, 988] : [880, 587]);
  const ctx = audioCtx();
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = settings.sfxVol ?? 0.8;
  src.buffer = buf;
  src.connect(g).connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + 4); // toque, não música
}
const sfx = {
  join: () => joinLeaveSound('join'), // sobe: entrou
  leave: () => joinLeaveSound('leave'), // desce: saiu
  msg: () => beep([988, 1319], 0.07, 0.2),
  mute: () => beep([440], 0.06, 0.2),
  unmute: () => beep([660], 0.06, 0.2),
  streamOn: () => beep([392, 523, 659, 1047], 0.09), // arpejo subindo: ao vivo
  streamOff: () => beep([1047, 659, 392], 0.09),
  poke: () => beep([880, 1175, 880, 1175], 0.08, 0.3),
  dice: (crit) => beep(crit === 'crit' ? [523, 659, 784, 1047] : crit === 'fumble' ? [330, 247, 196] : [587, 740, 880], 0.065, 0.25),
};

// ============================================================ dados sincronizados
// Tudo que o grupo compartilha é um "registro" com versão (o mais novo vence):
//   grp  nome do grupo            ch  canal (texto/voz)       msg  mensagem
//   q    música na fila de um canal de voz                   pb   o que está tocando num canal de voz
//   snd  som do soundboard (o áudio em si vai pelo armazenamento de arquivos)
const KINDS = new Set(['grp', 'ch', 'msg', 'q', 'pb', 'snd', 'rx', 'emo', 'pin', 'cat', 'role', 'mem', 'ban', 'rekey', 'rpgc', 'rpgk', 'rpgs', 'rpgr']);
const recs = new Map();
let clock = 0;
const tick = () => (clock = Math.max(Date.now(), clock + 1));
const newer = (a, b) => !b || a.v > b.v || (a.v === b.v && String(a.by) > String(b.by));

function validRec(r) {
  if (!r || typeof r !== 'object' || !KINDS.has(r.k) || typeof r.id !== 'string' || r.id.length > 80 || !Number.isFinite(r.v)) return false;
  return JSON.stringify(r).length < (r.k === 'rpgc' ? 40000 : r.k === 'rpgs' || r.k === 'rpgk' ? 16000 : 8000); // ficha de RPG é maior
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
// Depois desta data, registro sem assinatura não vale (até lá, quem ainda não atualizou continua aparecendo).
const SIGNED_SINCE = Date.UTC(2026, 10, 8, 12);
// tipos em que o "uid" do registro é o autor: tem que ser quem assinou
const AUTHORED = new Set(['msg', 'rx', 'pin']);
let rejectedRecs = 0;
function put(rec) {
  // a minha mudança sempre vence a versão que tenho agora, mesmo que o relógio de um amigo esteja
  // adiantado (senão renomear um canal criado por ele era descartado sem aviso)
  rec.v = Math.max(tick(), (recs.get(rec.id)?.v || 0) + 1);
  clock = Math.max(clock, rec.v);
  rec.by = me.id;
  rec.pk = me.pk;
  delete rec.sig;
  merge([rec]);
  if (recs.get(rec.id) !== rec) return toast('Você não tem permissão para isso neste grupo');
  // assina e só então manda (a assinatura cobre o registro inteiro)
  ident.signRecord(rec).then(() => {
    if (recs.get(rec.id) === rec) persist([rec]);
    A.recs?.send([rec]);
  });
}
// registros que chegaram de outro PC: só entra o que tem assinatura válida de quem diz ter escrito
async function acceptRemote(list) {
  const out = [];
  await Promise.all(
    list.map(async (r) => {
      if (!validRec(r)) return;
      if (!r.sig) {
        if (r.v < SIGNED_SINCE) out.push(r); // antigo, de antes das assinaturas
        else rejectedRecs++;
        return;
      }
      if (typeof r.by !== 'string' || !(await ident.bindKey(r.by, r.pk)) || !(await ident.verifyRecord(r))) {
        rejectedRecs++;
        return;
      }
      const imported = r.k === 'msg' && r.imp === 'dc' && /^dc:\d{1,25}$/.test(r.uid);
      if (AUTHORED.has(r.k) && r.uid && r.uid !== r.by && !(r.k === 'msg' && r.del) && !imported) {
        rejectedRecs++;
        return;
      }
      out.push(r);
    }),
  );
  return out;
}
// chaves deste PC e a prova do "hi" (ligada ao id da conexão: não dá para copiar o "hi" de outra pessoa)
let hiSig = '';
async function initIdentity() {
  ident.initBindings(store);
  await ident.loadKeys(store);
  me.pk = ident.publicKey;
  if (freshProfile) me.id = await ident.idFromKey(me.pk); // quem é novo: o id sai da chave
  await ident.bindKey(me.id, me.pk);
  hiSig = await ident.signText(`janja-hi:${me.id}:${selfId}`);
  dm = initDM({
    me, store, el, icon, avatar, nameEl, toast, sfx, format, hydrateEmojis, openDialog, randId, getMic, turnServers,
    myStatus: () => myStatus(),
    keyOf: (uid) => ident.keyOf(uid),
    pidsOf: (uid) => [...peers.values()].filter((p) => p.user?.id === uid && p.user.verified).map((p) => p.pid),
    sendFrq: (body, pid) => A?.frq?.send(body, { target: pid }),
    speaker: () => settings.speaker || '',
  });
  await dm.start();
}
let dm = null;
// ============================================================ cargos e permissões (nomes do Stoat)
// O grupo tem um dono; cargos dão permissões; "todos" (@everyone) tem as permissões básicas. Cada PC confere
// as permissões de quem assinou o registro antes de aceitar (no P2P não há servidor para barrar).
// Grupo sem dono (os antigos, até alguém reivindicar) funciona como antes: todo mundo pode tudo.
const P = {
  ManageChannel: 1,
  ManageServer: 2,
  ManagePermissions: 4,
  ManageRole: 8,
  ManageCustomisation: 16,
  KickMembers: 32,
  BanMembers: 64,
  ManageMessages: 128,
  SendMessage: 256,
  React: 512,
  Connect: 1024,
  Speak: 2048,
  Video: 4096,
  Stream: 8192,
  MuteMembers: 16384,
  MoveMembers: 32768,
};
const PERM_LABELS = [
  [P.SendMessage, 'Mandar mensagens'],
  [P.React, 'Reagir'],
  [P.Connect, 'Entrar nas calls'],
  [P.Speak, 'Falar'],
  [P.Video, 'Câmera'],
  [P.Stream, 'Transmitir a tela'],
  [P.ManageChannel, 'Gerenciar canais e categorias'],
  [P.ManageCustomisation, 'Gerenciar emojis'],
  [P.ManageMessages, 'Gerenciar mensagens (apagar de outros, fixar)'],
  [P.MoveMembers, 'Mover pessoas de canal'],
  [P.MuteMembers, 'Silenciar pessoas'],
  [P.KickMembers, 'Expulsar'],
  [P.BanMembers, 'Banir'],
  [P.ManageRole, 'Gerenciar cargos'],
  [P.ManagePermissions, 'Gerenciar permissões de todos'],
  [P.ManageServer, 'Gerenciar o perfil do grupo'],
];
const ALL_PERMS = Object.values(P).reduce((a, b) => a | b, 0);
// o que todo mundo podia fazer até agora continua liberado por padrão
const EVERYONE_DEFAULT = P.SendMessage | P.React | P.Connect | P.Speak | P.Video | P.Stream | P.ManageChannel | P.ManageCustomisation | P.MoveMembers;
let deniedRecs = 0;
const groupOwner = () => recs.get('grp')?.owner || null;
const everyonePerms = () => {
  const p = recs.get('grp')?.perms;
  return Number.isInteger(p) ? p : EVERYONE_DEFAULT;
};
const roleList = () => all('role').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
function rolesOf(uid) {
  const m = recs.get('mem:' + uid);
  const ids = new Set(m && !m.del && Array.isArray(m.roles) ? m.roles : []);
  return roleList().filter((r) => ids.has(r.id));
}
function banOf(uid) {
  const b = recs.get('ban:' + uid);
  return b && !b.del && (!b.until || b.until > Date.now()) ? b : null;
}
function permsOf(uid) {
  const owner = groupOwner();
  if (!owner || uid === owner) return ALL_PERMS;
  if (banOf(uid)) return 0;
  let p = everyonePerms();
  for (const r of rolesOf(uid)) p |= r.perms | 0;
  return p;
}
const can = (uid, perm) => (permsOf(uid) & perm) === perm;
const iCan = (perm) => can(me.id, perm);
// posição na hierarquia: dono acima de todos; depois o cargo mais alto (menor "order")
const rankOf = (uid) => (uid === groupOwner() ? -1 : Math.min(Infinity, ...rolesOf(uid).map((r) => r.order ?? 0)));
const outranks = (a, b) => rankOf(a) < rankOf(b);
const roleColorOf = (uid) => rolesOf(uid).find((r) => cleanHex(r.color))?.color || '';
const canClaimOwner = (uid) => !all('msg').some((m) => !m.bot) || badgesOf(uid).some(([ic]) => ic === 'sprout');

// pode aceitar este registro de quem assinou? (cur = a versão que tenho agora)
function permitted(r, cur) {
  const by = r.by;
  if (r.k === 'grp') {
    const before = cur?.owner || null;
    const after = r.owner || null;
    if (before !== after) return before ? by === before : by === after && canClaimOwner(after); // só o dono passa a coroa
    if (!!cur?.rpg !== !!r.rpg) return after ? by === after : canClaimOwner(by); // só o dono (mestre da mesa) ativa/desativa o RPG
    if (!before) return true;
    const permsChanged = (Number.isInteger(cur?.perms) ? cur.perms : EVERYONE_DEFAULT) !== (Number.isInteger(r.perms) ? r.perms : EVERYONE_DEFAULT);
    return can(by, permsChanged ? P.ManagePermissions : P.ManageServer);
  }
  if (!groupOwner()) return true; // grupo sem dono: como antes
  if (banOf(by)) return false;
  switch (r.k) {
    case 'ch':
    case 'cat':
      return can(by, P.ManageChannel);
    case 'emo':
      return can(by, P.ManageCustomisation) || (!!r.del && cur?.by === by);
    case 'pin':
      return can(by, P.ManageMessages);
    case 'rx':
      return !!r.del || can(by, P.React);
    case 'msg':
      if (r.imp || cur?.imp) return r.del ? can(by, P.ManageServer) || can(by, P.ManageMessages) : can(by, P.ManageServer);
      if (!cur) return r.del || can(by, P.SendMessage);
      if (by === cur.uid) return true;
      return !!r.del && can(by, P.ManageMessages) && outranks(by, cur.uid);
    case 'role': {
      if (!can(by, P.ManageRole)) return false;
      if (by === groupOwner()) return true;
      const mine = rankOf(by);
      return mine < (r.order ?? 0) && (!cur || mine < (cur.order ?? 0)) && ((r.perms | 0) & ~permsOf(by)) === 0;
    }
    case 'mem': {
      if (!can(by, P.ManageRole)) return false;
      if (by === groupOwner()) return true;
      if (r.uid !== by && !outranks(by, r.uid)) return false;
      const a = new Set(cur?.roles || []);
      const b = new Set(r.del ? [] : r.roles || []);
      const changed = [...a, ...b].filter((x) => a.has(x) !== b.has(x));
      return changed.every((id) => (recs.get(id)?.order ?? -Infinity) > rankOf(by));
    }
    case 'ban':
      if (r.uid === groupOwner()) return false;
      if (r.del) return can(by, P.BanMembers) || can(by, P.KickMembers);
      return can(by, r.until ? P.KickMembers : P.BanMembers) && outranks(by, r.uid);
    case 'q':
    case 'pb':
      return can(by, P.Connect);
    case 'rekey':
      return can(by, P.BanMembers);
    // mesa de RPG: o Mestre (dono) mexe em tudo; cada um só na própria ficha, no próprio token e nas próprias rolagens
    case 'rpgs':
      return by === groupOwner();
    case 'rpgc':
      return by === groupOwner() || (cur ? cur.uid === by && r.uid === by : r.uid === by);
    case 'rpgk':
      return by === groupOwner() || (!!r.uid && r.uid === by && (!cur || cur.uid === by) && !r.npc);
    case 'rpgr':
      return cur ? r.uid === cur.uid || by === groupOwner() : r.uid === by;
  }
  return true;
}

function merge(list, quiet) {
  const changed = [];
  for (const r of list) {
    if (!validRec(r)) continue;
    const cur = recs.get(r.id);
    if (!newer(r, cur)) continue;
    if (cur?.k === 'msg' && cur.uid !== r.uid) continue; // a mensagem continua sendo de quem escreveu
    if (r.by && !permitted(r, cur)) {
      deniedRecs++;
      continue;
    }
    if (cur?.k === 'msg' && !cur.del && plug('messageLogger')) logMessageChange(cur, r);
    recs.set(r.id, r);
    clock = Math.max(clock, Math.min(r.v, Date.now() + 60_000));
    changed.push(r);
  }
  if (!changed.length) return;
  persist(changed);
  if (!quiet) onRecsChanged(changed);
}
// Os registros de cada servidor ficam no IndexedDB, um por linha (o localStorage só aguentava uns poucos MB e
// regravava tudo a cada mudança; com o histórico do Discord isso estourava). Só o que mudou é gravado.
let recsDbP;
function recsDb() {
  return (recsDbP ||= new Promise((ok, no) => {
    const q = indexedDB.open('janja-recs', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('r', { keyPath: 'k' }).createIndex('h', 'h');
    q.onsuccess = () => ok(q.result);
    q.onerror = () => no(q.error);
  }));
}
async function recsLoad(hash) {
  try {
    const db = await recsDb();
    return await new Promise((ok) => {
      const q = db.transaction('r').objectStore('r').index('h').getAll(IDBKeyRange.only(hash));
      q.onsuccess = () => ok(q.result.map((x) => x.r));
      q.onerror = () => ok([]);
    });
  } catch {
    return [];
  }
}
async function recsWrite(hash, list) {
  const db = await recsDb();
  await new Promise((ok, no) => {
    const t = db.transaction('r', 'readwrite');
    const s = t.objectStore('r');
    for (const r of list) s.put({ k: hash + '|' + r.id, h: hash, r });
    t.oncomplete = ok;
    t.onerror = () => no(t.error);
  });
}
async function recsDrop(hash) {
  try {
    const db = await recsDb();
    await new Promise((ok) => {
      const t = db.transaction('r', 'readwrite');
      const s = t.objectStore('r');
      const q = s.index('h').openKeyCursor(IDBKeyRange.only(hash));
      q.onsuccess = () => {
        const c = q.result;
        if (!c) return;
        s.delete(c.primaryKey);
        c.continue();
      };
      t.oncomplete = ok;
      t.onerror = ok;
    });
  } catch {}
  store.del('recs:' + hash);
}
let persistTimer;
const dirtyRecs = new Set();
function persist(list) {
  for (const r of list || []) dirtyRecs.add(r.id);
  clearTimeout(persistTimer);
  persistTimer = setTimeout(flushRecs, 400);
}
function flushRecs() {
  clearTimeout(persistTimer);
  if (!R || !dirtyRecs.size) return Promise.resolve();
  const list = [...dirtyRecs].map((id) => recs.get(id)).filter(Boolean);
  dirtyRecs.clear();
  return recsWrite(R.hash, list).catch((err) => console.warn('não salvei os registros', err));
}
const all = (k) => [...recs.values()].filter((r) => r.k === k && !r.del);
const channels = (type) => all('ch').filter((c) => c.type === type).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
const channel = (id) => {
  const c = recs.get(id);
  return c?.k === 'ch' && !c.del ? c : null;
};
const messagesOf = (ch) => {
  let list = all('msg').filter((m) => m.ch === ch);
  if (plug('hideBot')) list = list.filter((m) => !m.bot || m.via); // esconde o DJ, não os bots de verdade
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
  if (kinds.has('emo')) {
    emojiMapCache = null;
    renderEmojiAdmin();
  }
  if (kinds.has('role') || kinds.has('mem') || kinds.has('ban') || kinds.has('grp') || kinds.has('cat')) {
    checkBanned();
    syncRpgVisibility();
    renderSidebar();
    renderPresence();
    for (const { box, ch } of chatBoxes()) renderChat(box, ch, true);
    if ($('#serverDlg').open) renderAdmin();
  }
  if (kinds.has('rekey')) onRekey(list.find((r) => r.k === 'rekey'));
  if (kinds.has('rpgc') || kinds.has('rpgk') || kinds.has('rpgs') || kinds.has('rpgr') || kinds.has('grp')) onRpgRecs(list);
  if (kinds.has('emo') || kinds.has('pin')) for (const { box, ch } of chatBoxes()) renderChat(box, ch, true);
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
      else if (!isCall && !shownIn.length && (!settings.mutedCh[m.ch] || pingsMe(m))) S.unread.add(m.ch);
    }
    for (const box of rerender) renderChat(box, boxes.find((b) => b.box === box).ch, true);
    renderCallBadge();
    const notifyMsgs = fresh.filter((m) => !m.del && !m.edited && m.uid !== me.id && Date.now() - m.ts < 60_000 && myStatus() !== 'dnd' && (!settings.mutedCh[m.ch] || pingsMe(m)));
    if (textChatCh() && document.hasFocus()) markRead(textChatCh());
    for (const m of notifyMsgs) pluginEmit('message', m);
    if (G3.ctl) for (const m of fresh) if (!m.del && !m.edited && Date.now() - m.ts < 30_000) roomBubble(m);
    if (notifyMsgs.some((m) => pingsMe(m) || (plug('mentions') && mentionsMe(m.text)))) {
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
  return C.ch ? { ch: C.ch, muted: C.muted || !C.mic, deafened: C.deafened, streaming: !!C.screen, cam: !!C.cam, watch: [...C.watching] } : null;
}
let appVersion = ''; // versão deste app (vai no "hi" para os amigos)
const hiPayload = () => ({ user: { id: me.id, name: me.name, color: me.color, g: me.google?.idToken, p: me.p, st: myStatus(), pk: me.pk, hs: hiSig, fig: myFig(), act: myActivity(), ...(dm?.hiFields() || {}) }, voice: myVoice(), ver: appVersion });
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

async function sendRecs(list, target) {
  const prio = (r) => (r.k === 'msg' ? 1 : 0);
  list = [...list].sort((a, b) => prio(a) - prio(b) || (b.ts || 0) - (a.ts || 0));
  for (let i = 0; i < list.length; i += 300) {
    A.recs?.send(list.slice(i, i + 300), target ? { target } : undefined);
    // histórico grande (importado do Discord): manda aos poucos para não travar a call
    if (list.length > 900) await new Promise((ok) => setTimeout(ok, 60));
  }
}

// ----- TURN (Cloudflare) e Rota da Conexão (Cloudflare Relay / Automático / Direto P2P) -----
// O usuário pode escolher em Configurações → Voz e áudio, na janela de Transmitir ou clicando no ping da call:
//   - 'cloudflare': força iceTransportPolicy = 'relay' (todo o tráfego de voz e stream passa pelo servidor Anycast da Cloudflare,
//     evitando rotas ruins entre operadoras e quedas de conexão; cai para 'all' automaticamente se a rede bloquear TURN).
//   - 'auto': tenta conexão direta e usa o servidor da Cloudflare se precisar.
//   - 'p2p': conexão direta entre os PCs (sem servidor intermediário).
const NET_MODE_LABELS = {
  cloudflare: 'Servidor Cloudflare',
  auto: 'Automático (Híbrido)',
  p2p: 'Direto P2P',
};
const DEFAULT_STUN = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
];
const turnServers = [];
const TURN_TTL = 48 * 3600;
const livePcs = new Set();
let reconnectingNetUntil = 0;

function setTurn(list) {
  turnServers.splice(0, turnServers.length, ...(list || []).filter((x) => x && x.username));
}
function buildRtcConfig(base = {}) {
  const mode = settings.netMode || 'auto';
  const hasTurn = turnServers.length > 0;
  if (mode === 'p2p') {
    return {
      ...base,
      iceServers: DEFAULT_STUN,
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 2,
    };
  }
  if (mode === 'cloudflare' && hasTurn) {
    return {
      ...base,
      iceServers: [...turnServers, ...DEFAULT_STUN],
      iceTransportPolicy: 'relay',
      iceCandidatePoolSize: 2,
    };
  }
  return {
    ...base,
    iceServers: hasTurn ? [...turnServers, ...DEFAULT_STUN] : base.iceServers?.length ? base.iceServers : DEFAULT_STUN,
    iceTransportPolicy: 'all',
    iceCandidatePoolSize: 2,
  };
}

// Proteção contra quedas em PC fraco: o Trystero fecha a conexão inteira se connectionState/iceConnectionState ficar
// "disconnected" por apenas 5 segundos (o que acontece fácil quando um PC fraco começa a transmitir ou abre um jogo pesado).
// Aqui estendemos a janela de recuperação para 25 s, disparamos restartIce() sozinho e fazemos fallback se o relay falhar.
const NativeRTCPeerConnection = window.RTCPeerConnection;
const nativeConnDesc = Object.getOwnPropertyDescriptor(NativeRTCPeerConnection.prototype, 'connectionState');
const nativeIceDesc = Object.getOwnPropertyDescriptor(NativeRTCPeerConnection.prototype, 'iceConnectionState');
const DISC_GRACE_MS = 10_000; // mais que isso, a pessoa aparecia na call sem estar

class JanjaPeerConnection extends NativeRTCPeerConnection {
  constructor(cfg) {
    const finalCfg = buildRtcConfig(cfg);
    super(finalCfg);
    this._usedRelayOnly = finalCfg.iceTransportPolicy === 'relay';
    this._discSince = 0;
    this._discExpired = false;
    this._discTimer = null;
    this._retryIceTimer = null;
    this._relayFallbackUntil = 0;
    livePcs.add(this);

    const onState = () => {
      const rawConn = this._rawConnectionState;
      const rawIce = this._rawIceConnectionState;
      if (rawConn === 'closed' || rawIce === 'closed') {
        this._clearDiscTimers();
        livePcs.delete(this);
        return;
      }
      // Se estava em 'relay' (Cloudflare forçado) e a rede bloqueou a porta TURN dando 'failed', cai para 'all' sem derrubar a call
      if ((rawIce === 'failed' || rawConn === 'failed') && this._usedRelayOnly) {
        this._usedRelayOnly = false;
        this._relayFallbackUntil = Date.now() + 10_000;
        try {
          this.setConfiguration({ ...buildRtcConfig(), iceTransportPolicy: 'all' });
          this.restartIce?.();
        } catch {}
        return;
      }
      if (rawConn === 'connected' || rawIce === 'connected' || rawIce === 'completed') {
        this._relayFallbackUntil = 0;
        this._clearDiscTimers();
        return;
      }
      if (rawConn === 'disconnected' || rawIce === 'disconnected') {
        if (!this._discSince) {
          this._discSince = Date.now();
          this._discExpired = false;
          try {
            this.restartIce?.();
          } catch {}
          this._retryIceTimer = setTimeout(() => {
            if (this._discSince && !this._discExpired) {
              if (this._usedRelayOnly) {
                this._usedRelayOnly = false;
                try {
                  this.setConfiguration({ ...buildRtcConfig(), iceTransportPolicy: 'all' });
                } catch {}
              }
              try {
                this.restartIce?.();
              } catch {}
            }
          }, 6000);
          this._discTimer = setTimeout(() => {
            this._discTimer = null;
            if (this._rawConnectionState === 'disconnected' || this._rawIceConnectionState === 'disconnected') {
              this._discExpired = true;
              this.dispatchEvent(new Event('iceconnectionstatechange'));
              this.dispatchEvent(new Event('connectionstatechange'));
            }
          }, DISC_GRACE_MS);
        }
      }
    };
    this.addEventListener('connectionstatechange', onState);
    this.addEventListener('iceconnectionstatechange', onState);
  }
  _clearDiscTimers() {
    this._discSince = 0;
    this._discExpired = false;
    clearTimeout(this._discTimer);
    clearTimeout(this._retryIceTimer);
    this._discTimer = null;
    this._retryIceTimer = null;
  }
  get _rawConnectionState() {
    return nativeConnDesc ? nativeConnDesc.get.call(this) : super.connectionState;
  }
  get _rawIceConnectionState() {
    return nativeIceDesc ? nativeIceDesc.get.call(this) : super.iceConnectionState;
  }
  get connectionState() {
    const raw = this._rawConnectionState;
    if (raw === 'disconnected' && this._discSince && !this._discExpired) return 'connected';
    if (raw === 'failed' && Date.now() < this._relayFallbackUntil) return 'connecting';
    return raw;
  }
  get iceConnectionState() {
    const raw = this._rawIceConnectionState;
    if (raw === 'disconnected' && this._discSince && !this._discExpired) return 'connected';
    if (raw === 'failed' && Date.now() < this._relayFallbackUntil) return 'checking';
    return raw;
  }
  close() {
    this._clearDiscTimers();
    livePcs.delete(this);
    return super.close();
  }
}
window.RTCPeerConnection = JanjaPeerConnection;

async function refreshTurn() {
  const hadTurn = turnServers.length > 0;
  const cached = store.get('turn', null);
  if (cached?.exp > Date.now() && cached?.servers?.length) setTurn(cached.servers);
  if (!TURN.id) return;
  if (cached?.exp > Date.now() + 24 * 3600e3 && turnServers.length) return;
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${TURN.id}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + TURN.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: TURN_TTL }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const { iceServers } = await r.json();
    setTurn(iceServers);
    store.set('turn', { exp: Date.now() + TURN_TTL * 1000, servers: turnServers });
    if (!hadTurn && turnServers.length && room && settings.netMode !== 'p2p') {
      for (const pc of livePcs) {
        try {
          pc.setConfiguration(buildRtcConfig());
          pc._usedRelayOnly = settings.netMode === 'cloudflare';
          pc.restartIce?.();
        } catch {}
      }
      if (!peers.size) reconnectRoom(true);
    }
  } catch (err) {
    console.warn('TURN indisponível', err);
  }
}
const turnReady = Promise.race([refreshTurn(), new Promise((r) => setTimeout(r, 1800))]);
setInterval(refreshTurn, 6 * 3600e3);

function connectRoom() {
  const rtcConfig = buildRtcConfig();
  room = joinRoom(
    {
      appId: 'toca-voice-p2p-v2',
      password: R.key,
      turnConfig: settings.netMode === 'p2p' ? [] : turnServers,
      rtcConfig,
      rtcPolyfill: JanjaPeerConnection,
    },
    R.hash,
    {
      onJoinError: (d) => console.warn('falha ao conectar com um amigo', d),
    },
  );
  A = {
    hi: room.makeAction('hi'),
    sum: room.makeAction('sum'),
    recs: room.makeAction('recs'),
    typing: room.makeAction('typing'),
    freq: room.makeAction('freq'), // pedido de arquivo
    fdat: room.makeAction('fdat'), // arquivo (ou "não tenho")
    sndp: room.makeAction('sndp'), // tocar som do soundboard
    poke: room.makeAction('poke'), // cutucar
    move: room.makeAction('move'), // "vai para o canal X" (arrastaram você)
    frq: room.makeAction('frq'), // pedido de amizade (assinado)
    clk: room.makeAction('clk'), // acerto do relógio (para a música tocar no mesmo ponto em todo mundo)
    pos: room.makeAction('pos'), // onde eu estou na sala de games
    pvp: room.makeAction('pvp'), // golpes, tiros e parry do PvP do acampamento
    rpg: room.makeAction('rpg'), // pedido de teste e rolagem de dados d2Trinities
  };
  A.pos.onMessage = (d, { peerId }) => onRoomPos(d, peerId);
  A.pvp.onMessage = (d, { peerId }) => onRoomAct(d, peerId);
  A.rpg.onMessage = (d, { peerId }) => onRpgNet(d, peerId);
  A.clk.onMessage = (d, { peerId }) => onClk(d, peerId);
  A.frq.onMessage = (d, { peerId }) => dm?.onFriendMsg(d, peerId);
  listenOldRooms();
  A.poke.onMessage = (d, { peerId }) => onPoke(d, peerId);
  A.move.onMessage = (d, { peerId }) => onMove(d, peerId);
  room.onPeerJoin = (pid) => {
    ensurePeer(pid);
    A.hi.send(hiPayload(), { target: pid });
    A.sum.send([...recs.values()].map((r) => [r.id, r.v]), { target: pid });
    for (const ms of [500, 2000, 5000]) setTimeout(() => pingClock(pid), ms);
    if (G3.ctl) setTimeout(() => G3.ctl?.resendPos(), 1500);
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
    if (C.ch && p.voice?.ch === C.ch && Date.now() > reconnectingNetUntil) sfx.leave();
    dropMedia(p);
    peers.delete(pid);
    C.sent.delete(pid);
    updateClock();
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
  A.recs.onMessage = (list) => Array.isArray(list) && acceptRemote(list.slice(0, 300)).then((ok) => ok.length && merge(ok));
  A.typing.onMessage = (d, { peerId }) => {
    const p = peers.get(peerId);
    if (!p?.user || typeof d?.ch !== 'string') return;
    typingOf.set(p.user.id, { name: p.user.name, ch: d.ch, until: Date.now() + 4000 });
    renderTyping();
  };
  room.onPeerStream = onPeerStream;
}

function reconnectRoom(silent = false) {
  if (!R || !room) return;
  reconnectingNetUntil = Date.now() + 8000;
  for (const [, p] of peers) dropMedia(p);
  peers.clear();
  C.sent.clear();
  net.clear();
  for (const pc of [...livePcs]) {
    try {
      pc.close();
    } catch {}
  }
  try {
    room.leave();
  } catch {}
  connectRoom();
  renderPresence();
  if (!silent) paintNet();
}

function syncNetUi() {
  for (const sel of [$('#stNetMode'), $('#sqNetMode')]) if (sel) sel.value = settings.netMode || 'auto';
  for (const cb of [$('#stAntiPing'), $('#sqAntiPing')]) if (cb) cb.checked = settings.antiPing !== false;
}

function setNetMode(mode, notify = true) {
  if (!['cloudflare', 'auto', 'p2p'].includes(mode)) return;
  const changed = settings.netMode !== mode;
  settings.netMode = mode;
  saveSettings();
  syncNetUi();
  if (changed && room) reconnectRoom();
  else paintNet();
  if (notify && changed) {
    const msg =
      mode === 'cloudflare'
        ? 'Rota alterada: Servidor Cloudflare (tráfego protegido contra quedas e rotas ruins)'
        : mode === 'auto'
          ? 'Rota alterada: Automático (conexão direta + Cloudflare se precisar)'
          : 'Rota alterada: Direto P2P (sem servidor intermediário)';
    toast(msg);
  }
}

function setAntiPing(on, notify = true) {
  const val = !!on;
  const changed = settings.antiPing !== val;
  settings.antiPing = val;
  saveSettings();
  syncNetUi();
  if (C.screen) applyStreamQuality();
  else tuneSenders();
  if (notify && changed) {
    toast(val ? 'Proteção Anti-Ping ativada (prioriza a voz e alivia o PC/upload na stream)' : 'Proteção Anti-Ping desativada');
  }
}

// confere se quem diz ser fulano tem a chave de fulano; se o id já tem chave e a prova não bate, é impostor
async function verifyHi(p, u) {
  const uid = p.user?.id;
  const ok = !!u?.pk && !!u?.hs && (await ident.verifyText(`janja-hi:${uid}:${p.pid}`, u.hs, u.pk)) && (await ident.bindKey(uid, u.pk));
  const fake = !ok && !!ident.keyOf(uid);
  if (p.user?.id !== uid) return;
  p.user.verified = ok;
  if (ok) dm?.onGroupHi(uid, u, p.pid);
  if (fake && !p.user.fake) {
    p.user.fake = true;
    p.user.name = p.user.name + ' (não verificado)';
    renderPresence();
  }
}
function onHi(pid, d) {
  const p = ensurePeer(pid);
  checkFriendVersion(d?.ver);
  const wasIn = C.ch && p.voice?.ch === C.ch;
  const wasLive = wasIn && p.voice.streaming;
  p.user = { id: String(d?.user?.id || pid).slice(0, 64), name: cleanName(d?.user?.name) || 'Anônimo', color: cleanColor(d?.user?.color), st: ['idle', 'dnd'].includes(d?.user?.st) ? d.user.st : 'online', bot: !!d?.user?.bot };
  if (d?.user?.fig) p.user.fig = cleanFig(d.user.fig, p.user.color, p.user.id);
  p.user.act = cleanAct(d?.user?.act);
  checkGoogle(p, d?.user?.g);
  updateProfile(p.user.id, d?.user?.p);
  verifyHi(p, d?.user);
  const v = d?.voice;
  p.voice =
    v && typeof v.ch === 'string'
      ? {
          ch: v.ch,
          muted: !!v.muted,
          deafened: !!v.deafened,
          streaming: !!v.streaming,
          cam: !!v.cam,
          watch: Array.isArray(v.watch) ? v.watch.filter((x) => typeof x === 'string').slice(0, 12) : [],
        }
      : null;
  const isIn = C.ch && p.voice?.ch === C.ch;
  const isLive = isIn && p.voice.streaming;
  const quietReconnect = Date.now() <= reconnectingNetUntil;
  if (!wasIn && isIn) {
    if (!quietReconnect) sfx.join();
    pluginEmit('join', { id: p.user.id, name: p.user.name, channel: C.ch });
  }
  if (wasIn && !isIn) {
    if (!quietReconnect) sfx.leave();
    pluginEmit('leave', { id: p.user.id, name: p.user.name, channel: C.ch });
  }
  if (!wasLive && isLive && !quietReconnect) {
    sfx.streamOn();
    toast(`${p.user.name} começou uma stream. Clique nele para assistir.`);
  }
  if (wasLive && !isLive && isIn && !quietReconnect) sfx.streamOff();
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

// Modos de supressão de ruído (Configurações → Voz e áudio):
//   'strong' RNNoise. Supressão do navegador desligada (não empilha dois removedores).
//   'basic'  só o WebRTC (supressão de ruído do próprio Chromium).
//   'off'    nada.
// O cancelamento de eco do WebRTC (AEC3) é independente e vale em todos.
const engineOf = (noise) => (noise === 'strong' ? 'rnnoise' : 'none');
function getRawMic(deviceId = settings.mic, opts = settings) {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      channelCount: 1,
      echoCancellation: opts.echo,
      noiseSuppression: opts.noise === 'basic',
      autoGainControl: true,
    },
  });
}

// Um AudioContext só, de 48 kHz (o RNNoise trabalha nessa taxa), para tudo do mic.
let micCtx;
async function processMic(raw, opts = settings) {
  const stopRaw = () => raw.getTracks().forEach((t) => t.stop());
  micCtx ||= new AudioContext({ sampleRate: 48000 });
  if (micCtx.state === 'suspended') await micCtx.resume();
  const src = micCtx.createMediaStreamSource(raw);
  const chain = await buildMicChain(micCtx, src, {
    engine: engineOf(opts.noise),
    gate: opts.gate,
  });
  const dest = micCtx.createMediaStreamDestination();
  dest.channelCount = 1;
  chain.output.connect(dest);
  return {
    stream: dest.stream,
    gate: chain.gate,
    setGate: chain.setGate, // portão e anti-impacto (são dois nós)
    engine: chain.engine,
    stop() {
      stopRaw();
      chain.output.disconnect();
      chain.dispose();
      src.disconnect();
      dest.stream.getTracks().forEach((t) => t.stop());
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
  if (!iCan(P.Connect)) return toast('Você não tem permissão para entrar nas calls deste grupo');
  if (C.ch) leaveVoice(true);
  try {
    const m = await getMic();
    C.mic = m.stream;
    C.micStop = m.stop;
    C.micGate = m.gate || null;
    C.micSetGate = m.setGate || null;
    C.micEngine = m.engine || null; // qual removedor de ruído está ativo (rnnoise, none)
  } catch {
    C.mic = null;
    C.micStop = null;
    toast('Sem microfone: você entrou só para ouvir');
  }
  C.ch = ch;
  C.joinedAt = Date.now();
  saveRejoin();
  window.desk?.callActive?.(true, channel(ch)?.name, !!C.cam);
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

// Atualizou ou reiniciou o app no meio da call: ao abrir de novo, volta para a mesma call.
// Vale se o app estava na call até uns minutos atrás; sair da call pelo botão desliga isso.
let keepRejoin = false;
const REJOIN_MS = 3 * 60_000;
function saveRejoin() {
  if (C.ch) store.set('rejoin', { hash: R.hash, ch: C.ch, at: Date.now() });
}
setInterval(saveRejoin, 20_000);
function leaveVoice(switching) {
  if (!C.ch) return;
  if (!switching) window.desk?.callActive?.(false);
  if (!switching && !keepRejoin) store.del('rejoin'); // saiu de propósito: não volta sozinho
  stopStream(false);
  stopCam(false);
  C.ch = null;
  C.watching.clear();
  syncMedia();
  C.micStop?.();
  C.mic = null;
  C.micStop = null;
  C.micGate = null;
  C.micSetGate = null;
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
  const ptt = !!settings.ptt.vk && !!window.desk?.pttSet;
  C.mic?.getAudioTracks().forEach((t) => (t.enabled = !C.muted && !C.deafened && (!ptt || C.pttDown)));
}
// aperte para falar: abre o mic enquanto a tecla está apertada e segura mais 250 ms para não cortar a última sílaba
let pttRelease = 0;
window.desk?.onPtt?.((down) => {
  clearTimeout(pttRelease);
  if (down) {
    C.pttDown = true;
    applyMicEnabled();
  } else
    pttRelease = setTimeout(() => {
      C.pttDown = false;
      applyMicEnabled();
    }, 250);
});
const applyPtt = () => window.desk?.pttSet?.(settings.ptt.vk).catch(() => false);
applyPtt();

// cada amigo no mesmo canal de voz recebe exatamente os streams certos
function syncMedia() {
  if (!room) return;
  for (const p of peers.values()) {
    const both = !!C.ch && p.voice?.ch === C.ch;
    // a tela só vai para quem clicou em "Assistir"
    // a câmera vai para todo mundo da call (como no Discord); a tela só para quem clicou em Assistir
    const out = both ? { mic: C.mic, cam: C.cam, screen: p.voice.watch?.includes(selfId) ? C.screen : null } : {};
    if (!C.sent.has(p.pid)) C.sent.set(p.pid, new Map());
    const sent = C.sent.get(p.pid);
    for (const kind of ['mic', 'cam', 'screen']) {
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
// ----- ping e estado da conexão com cada amigo -----
// Lê o tempo de ida e volta (RTT) do par de candidatos que o WebRTC escolheu: é o caminho real do
// áudio, inclusive quando passa pelo servidor TURN. Atualiza só os números na tela, sem redesenhar tudo.
const net = new Map(); // peerId -> { ping, relay, state }
const pingClass = (ms) => (ms == null ? '' : ms < 80 ? 'good' : ms < 160 ? 'ok' : 'bad');
async function pollNet() {
  if (!room) return;
  const live = new Set();
  for (const [pid, pc] of peerConnections()) {
    live.add(pid);
    try {
      const st = await pc.getStats();
      let pair = null;
      st.forEach((x) => {
        if (x.type === 'transport' && x.selectedCandidatePairId) pair = st.get(x.selectedCandidatePairId);
      });
      if (!pair) st.forEach((x) => x.type === 'candidate-pair' && x.nominated && x.state === 'succeeded' && (pair ||= x));
      const local = pair && st.get(pair.localCandidateId);
      const remote = pair && st.get(pair.remoteCandidateId);
      const rtt = pair?.currentRoundTripTime;
      net.set(pid, {
        ping: rtt != null ? Math.round(rtt * 1000) : (net.get(pid)?.ping ?? null),
        relay: local?.candidateType === 'relay' || remote?.candidateType === 'relay',
        state: pc.connectionState,
      });
    } catch {}
  }
  for (const pid of net.keys()) if (!live.has(pid)) net.delete(pid);
  paintNet();
}
setInterval(pollNet, 2000);
const netDown = (n) => !!n && !['connected', 'new', 'connecting'].includes(n.state);
function netTitle(n) {
  if (!n || n.state === 'new' || n.state === 'connecting') return 'Conectando…';
  if (netDown(n)) return 'Conexão caiu, tentando de novo…';
  return `Ping ${n.ping ?? '?'} ms · ${n.relay ? 'Servidor Cloudflare (Relay)' : 'Conexão direta (P2P)'}`;
}
function paintPing(e) {
  const n = net.get(e.dataset.ping);
  e.textContent = netDown(n) ? 'caiu' : n?.ping != null ? n.ping + ' ms' : '…';
  e.className = 'ping ' + (netDown(n) ? 'bad' : pingClass(n?.ping)) + (n?.relay ? ' relay' : '');
  e.title = netTitle(n);
}
function pingEl(pid) {
  const e = el('span', 'ping');
  e.dataset.ping = pid;
  paintPing(e);
  return e;
}
// resumo da minha call: ping médio e com quantos ainda está conectando
function callNet() {
  if (!C.ch) return null;
  const others = voiceMembers(C.ch).filter((m) => m.peer);
  const ok = others.map((m) => net.get(m.key)).filter((n) => n?.state === 'connected' && n.ping != null);
  const avg = ok.length ? Math.round(ok.reduce((a, n) => a + n.ping, 0) / ok.length) : null;
  return { people: others.length + 1, avg, bad: others.length - ok.length, relay: ok.filter((n) => n.relay).length };
}
function renderCallStatus() {
  const c = callNet();
  if (!c) return;
  const modeTag = settings.netMode === 'cloudflare' ? 'Cloudflare' : settings.netMode === 'p2p' ? 'P2P' : 'Auto';
  let text = `Voz (${modeTag})`;
  let cls = c.avg != null ? pingClass(c.avg) : 'good';
  if (c.people === 1) text = `Só você (${modeTag})`;
  else if (c.bad) {
    text = c.bad === c.people - 1 ? 'Conectando…' : `Conectando com ${c.bad}`;
    if (cls === 'good') cls = 'ok';
  }
  $('#vbStatusText').textContent = text;
  const p = $('#vbPing');
  p.textContent = c.avg != null ? c.avg + ' ms' : modeTag;
  p.className = 'ping ' + cls + (c.relay || settings.netMode === 'cloudflare' ? ' relay' : '');
  p.style.cursor = 'pointer';
  $('#vbStatusText').style.cursor = 'pointer';
  const routeInfo = `Rota: ${NET_MODE_LABELS[settings.netMode] || 'Automático (Híbrido)'}${settings.antiPing !== false ? ' · Anti-Ping ativo' : ''} (clique para escolher)`;
  p.title = c.avg != null ? `Ping médio: ${c.avg} ms (${c.people - 1 - c.bad} pessoa(s)${c.relay ? `, ${c.relay} via Cloudflare` : ''}) · ${routeInfo}` : routeInfo;
  $('#vbStatusText').title = p.title;
  $('#voiceBar').dataset.quality = cls;
  if (!isMobile) {
    $('#sbVoice').textContent = `Conectado em ${channel(C.ch)?.name || ''} · ${c.people} na call · ${modeTag}${c.avg != null ? ` · ping ${c.avg} ms` : ''}${c.bad ? ` · conectando com ${c.bad}` : ''}`;
  }
}
function openNetQuickMenu(e) {
  openMenu(e, [
    el('div', 'ctx-head', 'Rota da conexão e Anti-Ping'),
    menuItem(`Servidor Cloudflare${settings.netMode === 'cloudflare' ? '  ✓' : ''}`, 'globe', () => setNetMode('cloudflare')),
    menuItem(`Automático (Híbrido)${settings.netMode === 'auto' ? '  ✓' : ''}`, 'zap', () => setNetMode('auto')),
    menuItem(`Direto P2P${settings.netMode === 'p2p' ? '  ✓' : ''}`, 'users', () => setNetMode('p2p')),
    el('div', 'ctx-sep'),
    menuItem(`Proteção Anti-Ping (PC Fraco)${settings.antiPing !== false ? '  ✓' : ''}`, 'shield', () => setAntiPing(settings.antiPing === false)),
  ]);
}
$('#vbPing')?.addEventListener('click', openNetQuickMenu);
$('#vbStatusText')?.addEventListener('click', openNetQuickMenu);
function paintNet() {
  $$('[data-ping]').forEach(paintPing);
  renderCallStatus();
}

function activeScreenViewers() {
  let n = 0;
  for (const [, sent] of C.sent) if (sent.has('screen')) n++;
  return Math.max(1, n);
}
function tuneSenders() {
  if (!room) return;
  const viewers = activeScreenViewers();
  const antiPing = settings.antiPing !== false;
  for (const [, pc] of peerConnections()) {
    for (const sender of pc.getSenders?.() || []) {
      const t = sender.track;
      if (!t) continue;
      const params = sender.getParameters();
      if (!params.encodings?.length) continue;
      if (C.screen?.getVideoTracks().includes(t)) {
        const q = streamTarget();
        // No modo Anti-Ping, divide o bitrate automaticamente quando mais de 1 amigo assiste para não saturar o upload
        const viewerScale = antiPing && viewers > 1 ? Math.max(0.38, 1 / Math.pow(viewers, 0.65)) : 1;
        const maxCap = q.preset === 'ultralight' ? 900_000 : q.preset === 'potato' ? 1_800_000 : Infinity;
        params.encodings[0].maxBitrate = Math.min(maxCap, Math.round(q.bitrate * viewerScale));
        params.encodings[0].maxFramerate = q.fps;
        params.encodings[0].scaleResolutionDownBy = 1;
        // Prioridade baixa na rede para o vídeo: sua voz e os pacotes de ping (ICE/STUN) passam sempre na frente!
        params.encodings[0].priority = params.encodings[0].networkPriority = antiPing ? 'low' : 'medium';
        params.degradationPreference = { motion: 'maintain-framerate', detail: 'maintain-resolution', balanced: 'balanced' }[q.mode];
      } else if (C.cam?.getVideoTracks().includes(t)) {
        params.encodings[0].maxBitrate = antiPing ? 1_000_000 : 1_500_000; // câmera 720p
        params.encodings[0].maxFramerate = 30;
        params.encodings[0].priority = params.encodings[0].networkPriority = 'low';
      } else if (C.screen?.getAudioTracks().includes(t)) {
        params.encodings[0].maxBitrate = (settings.stream.audioRate || 192) * 1000; // som do PC na stream
        params.encodings[0].priority = params.encodings[0].networkPriority = antiPing ? 'medium' : 'high';
      } else if (C.mic?.getAudioTracks().includes(t)) {
        params.encodings[0].maxBitrate = 64_000;
        // Prioridade máxima para o microfone nunca atrasar nem picotar durante streams
        params.encodings[0].priority = params.encodings[0].networkPriority = 'high';
      } else continue;
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
  const kind = meta?.kind === 'screen' || meta?.kind === 'cam' ? meta.kind : 'mic';
  if (kind === 'screen' && !C.watching.has(pid)) return;
  // sem permissão (ou banido): o áudio/vídeo dessa pessoa não toca aqui
  const uid = peers.get(pid)?.user?.id;
  if (uid && (!can(uid, P.Connect) || !can(uid, { mic: P.Speak, cam: P.Video, screen: P.Stream }[kind]))) return;
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

// ----- botão rápido da supressão de ruído (ao lado de sair da call) -----
// Liga/desliga o RNNoise sem abrir as configurações. Desligar vai para "Desligada".
function renderNoiseBtn() {
  const on = settings.noise === 'strong';
  const title = on ? 'Supressão de ruído ligada (RNNoise): clique para desligar' : 'Supressão de ruído desligada: clique para remover o ruído de fundo';
  for (const b of [$('#vbNoise'), $('#ctlNoise')]) {
    if (!b) continue;
    b.classList.toggle('on', on);
    b.classList.toggle('off', !on);
    b.title = title;
  }
}
async function restartMic() {
  if (!C.ch) return;
  try {
    const next = await getMic();
    C.micStop?.();
    C.mic = next.stream;
    C.micStop = next.stop;
    C.micGate = next.gate || null;
    C.micSetGate = next.setGate || null;
    C.micEngine = next.engine || null;
    applyMicEnabled();
    meter('me', next.stream);
    syncMedia();
  } catch (err) {
    toast('Não consegui trocar o microfone: ' + err.message);
  }
}
let noiseBusy = false;
async function toggleNoise() {
  if (noiseBusy) return;
  noiseBusy = true;
  settings.noise = settings.noise === 'strong' ? 'off' : 'strong';
  saveSettings();
  renderNoiseBtn();
  try {
    await restartMic();
  } finally {
    noiseBusy = false;
  }
  toast(settings.noise === 'strong' ? 'Supressão de ruído ligada' : 'Supressão de ruído desligada');
}
$('#vbNoise').onclick = $('#ctlNoise').onclick = toggleNoise;
renderNoiseBtn();
// no PC o botão fica na barra de ferramentas: com a call aberta ele sempre desconecta, de qualquer canal
const callBtnLeaves = () => !!C.ch && (C.ch === S.view || !isMobile);
$('#ctlCall').onclick = () => (callBtnLeaves() ? leaveVoice() : channel(S.view)?.type === 'voice' && joinVoice(S.view));
$('#ctlMusic').onclick = () => selectTab('music');

// ============================================================ stream de tela
// ----- qualidade da stream -----
const STREAM_PRESETS = {
  ultralight: { res: 480, fps: 20, rate: 0.8, codec: 'h264', mode: 'motion' },
  potato: { res: 720, fps: 24, rate: 1.5, codec: 'h264', mode: 'motion' },
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
const FPS_OPTS = [5, 10, 15, 20, 24, 30, 48, 60, 90, 120, 144];
const CODEC_OPTS = [
  ['h264', 'H.264 (usa a placa de vídeo; mais leve para o processador)'],
  ['vp8', 'VP8 (o mais fluido e compatível)'],
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
  syncNetUi();
  renderRateLabel();
}
function renderRateLabel() {
  const q = readQualityForm();
  const h = q.res || 1080;
  $('#sqRateVal').textContent = q.rate ? `${q.rate} Mbps` : `Automático (~${(autoBitrate(q, Math.round((h * 16) / 9), h) / 1e6).toFixed(1)} Mbps)`;
}
$('#sqPreset').onchange = () => {
  const presetKey = $('#sqPreset').value;
  const p = STREAM_PRESETS[presetKey];
  if (p) {
    if ((presetKey === 'potato' || presetKey === 'ultralight') && settings.antiPing === false) {
      setAntiPing(true, false);
    }
    fillQualityForm({ ...readQualityForm(), ...p, preset: presetKey });
  }
};
$('#sqNetMode')?.addEventListener('change', () => setNetMode($('#sqNetMode').value));
$('#sqAntiPing')?.addEventListener('change', () => setAntiPing($('#sqAntiPing').checked));
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
  if (!iCan(P.Stream)) return toast('Você não tem permissão para transmitir neste grupo');
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

// Som do PC separado por programa (Windows 10 2004+): a janela leva só o som do programa dela; a tela
// inteira leva tudo menos o app e os programas de chamada (Discord...). Devolve uma faixa ou null.
const sysAudioFeeds = new Map(); // token -> AudioWorkletNode
let sysAudioCtx = null;
if (window.desk?.onSysAudio) {
  window.desk.onSysAudio((token, data) => {
    const node = sysAudioFeeds.get(token);
    if (!node) return;
    const f = new Float32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    node.port.postMessage(f, [f.buffer]);
  });
  window.desk.onSysAudioEnd((token) => sysAudioFeeds.has(token) && toast('O som do PC parou na stream'));
}
async function captureSysAudio(sourceId) {
  if (!window.desk?.sysAudioStart) return null;
  const token = await window.desk.sysAudioStart(sourceId).catch(() => null);
  if (!token) return null;
  try {
    sysAudioCtx ||= new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
    await sysAudioCtx.audioWorklet.addModule('pcm-worklet.js').catch(() => {}); // já carregado: tudo bem
    if (sysAudioCtx.state === 'suspended') await sysAudioCtx.resume();
    const node = new AudioWorkletNode(sysAudioCtx, 'janja-pcm', { numberOfInputs: 0, outputChannelCount: [2] });
    const dest = sysAudioCtx.createMediaStreamDestination();
    dest.channelCount = 2;
    node.connect(dest);
    sysAudioFeeds.set(token, node);
    const track = dest.stream.getAudioTracks()[0];
    // quem para a stream chama track.stop(): aí fecha o programa de captura junto
    const stop = track.stop.bind(track);
    track.stop = () => {
      stop();
      sysAudioFeeds.delete(token);
      node.disconnect();
      window.desk.sysAudioStop(token);
    };
    return track;
  } catch (err) {
    console.warn('som do PC', err);
    window.desk.sysAudioStop(token);
    return null;
  }
}

// som do PC sem os filtros de voz (eles estragam música/jogo) e, quando o Windows deixa,
// sem o som do próprio app (senão quem assiste ouve a call e a própria voz de volta)
const LOOPBACK_AUDIO = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 2,
  sampleRate: 48000,
  restrictOwnAudio: true,
};
// Vídeo da tela no PC pelo caminho "desktop" do Chromium. O getDisplayMedia do Electron entregava só 2 a 5
// quadros por segundo mesmo pedindo 30 (medido no mesmo PC e na mesma tela: getDisplayMedia 2 fps, desktop
// 22 fps), e a stream parecia travada para quem assistia.
function desktopVideo(sourceId, q) {
  const h = q.res || 1080;
  const antiPing = settings.antiPing !== false || q.preset === 'potato' || q.preset === 'ultralight';
  const mandatory = {
    chromeMediaSource: 'desktop',
    chromeMediaSourceId: sourceId,
    maxWidth: Math.round((h * 16) / 9),
    maxHeight: h,
    maxFrameRate: q.fps,
  };
  if (!antiPing) mandatory.minFrameRate = q.fps;
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { mandatory },
  });
}
async function captureScreen(sourceId, withAudio) {
  const q = settings.stream;
  const pc = isDesktop && !isMobile;
  const sys = pc && withAudio ? await captureSysAudio(sourceId) : null;
  let s;
  if (pc) {
    try {
      s = await desktopVideo(sourceId, q);
    } catch (err) {
      sys?.stop();
      throw err;
    }
    if (sys) {
      // o som vem do janja-sysaudio (separado por programa)
      sys.contentHint = 'music';
      s.addTrack(sys);
    } else if (withAudio) {
      // Windows sem o janja-sysaudio: o som vem do loopback do Chromium (o vídeo dessa captura é descartado)
      await window.desk.pick(sourceId, true);
      const a = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: LOOPBACK_AUDIO }).catch(() => null);
      a?.getVideoTracks().forEach((t) => t.stop());
      for (const at of a?.getAudioTracks() || []) s.addTrack(at);
    }
  } else {
    if (isDesktop) await window.desk.pick(sourceId, withAudio);
    s = await navigator.mediaDevices.getDisplayMedia({ video: videoConstraints(q), audio: withAudio && LOOPBACK_AUDIO });
  }
  for (const at of s.getAudioTracks()) {
    if (at === sys) continue;
    // Nunca transmitir a call: se o Windows não separou o som do app (deviceId "loopbackWithoutChrome"),
    // a stream vai sem o som do PC em vez de os amigos ouvirem a própria voz de volta.
    if (pc && at.getSettings().restrictOwnAudio !== true) {
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
  sfx.streamOn();
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
  if (notify) sfx.streamOff();
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

// ============================================================ relógio do grupo
// A música guarda "começou às X" e cada PC calcula onde ela está pelo próprio relógio. Se o relógio do
// Windows de um amigo estiver adiantado, ele achava que a música já tinha acabado e pulava para todo mundo;
// atrasado, ele ficava preso no começo, voltando sem parar (sem som). Agora cada PC mede a diferença para
// os outros (ida e volta, como o NTP) e usa a mediana dos relógios de todos, inclusive o próprio: todo
// mundo chega ao mesmo relógio sem ninguém precisar mandar.
let clockOff = 0;
const netNow = () => Date.now() + clockOff;
function pingClock(pid) {
  A.clk?.send({ t0: Date.now() }, pid ? { target: pid } : undefined);
}
function onClk(d, pid) {
  if (!d || typeof d.t0 !== 'number' || !Number.isFinite(d.t0)) return;
  if (!d.r) return A.clk.send({ t0: d.t0, t1: Date.now(), r: 1 }, { target: pid });
  if (typeof d.t1 !== 'number' || !Number.isFinite(d.t1)) return;
  const t2 = Date.now();
  const rtt = t2 - d.t0;
  const p = peers.get(pid);
  if (!p || rtt < 0 || rtt > 5000) return;
  const off = d.t1 + rtt / 2 - t2;
  // relógio que pulou (alguém acertou o do Windows): as medidas antigas não valem mais
  p.clk = (p.clk || []).filter((x) => Math.abs(x.off - off) < 1000).slice(-7);
  p.clk.push({ rtt, off });
  updateClock();
}
function updateClock() {
  // de cada amigo vale a medida mais rápida (a de menos atraso na rede)
  const offs = [0];
  for (const p of peers.values()) if (p.clk?.length) offs.push(p.clk.reduce((a, b) => (b.rtt < a.rtt ? b : a)).off);
  offs.sort((a, b) => a - b);
  const m = offs.length >> 1;
  const med = offs.length % 2 ? offs[m] : (offs[m - 1] + offs[m]) / 2;
  if (Math.abs(med - clockOff) > 200) clockOff = Math.round(med);
}
setInterval(() => pingClock(), 30000);

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
const musicPos = (pb) => (pb.pausedAt != null ? pb.pausedAt : netNow() - pb.startedAt);
const queueOf = (ch) => {
  const cur = recs.get('pb:' + ch)?.item;
  return all('q')
    .filter((q) => q.ch === ch && q.id !== cur)
    .sort((a, b) => !!a.auto - !!b.auto || a.at - b.at);
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
    const raw = musicPos(pb) / 1000;
    // começa "no futuro" (relógio de quem pôs ainda diferente): espera a hora em vez de voltar ao 0 sem parar
    const early = raw < -0.5;
    const pos = Math.max(0, raw);
    const paused = pb.pausedAt != null || early;
    if (Y.vid !== item.ref) {
      Y.vid = item.ref;
      Y.progT = -1;
      Y.progAt = Date.now();
      paused ? p.cueVideoById({ videoId: item.ref, startSeconds: pos }) : p.loadVideoById({ videoId: item.ref, startSeconds: pos });
    } else {
      const st = p.getPlayerState();
      if (st === 0 && !paused) return advance(item.id);
      // Player travado: devia tocar, mas o tempo não anda há 12 s (rede, erro do YouTube, player perdido).
      // Era o "sair e entrar na call" que resolvia: recarrega a música sozinho no ponto certo.
      const ct = p.getCurrentTime() || 0;
      if (paused || Math.abs(ct - Y.progT) > 0.2) {
        Y.progT = ct;
        Y.progAt = Date.now();
      } else if (Date.now() - Y.progAt > 12000) {
        console.warn('música travada, recarregando', item.ref, st, ct);
        Y.progAt = Date.now();
        p.loadVideoById({ videoId: item.ref, startSeconds: pos });
        return;
      }
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
  watchStall(C.ch);
  fillAutoplay(C.ch);
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
// 100 (vídeo removido/privado), 101 e 150 (dono não deixa tocar fora do YouTube) valem para todo mundo:
// pula sozinho. Outros erros podem ser só da rede/PC de um, então só avisa.
function onYtError(code) {
  const { item } = C.ch ? pbOf(C.ch) : {};
  if (item && (code === 100 || code === 101 || code === 150)) {
    toast(`O YouTube não deixa tocar "${item.title}" fora do site. Pulei.`);
    return advance(item.id, true);
  }
  toast('Não deu para tocar essa música aqui.');
}

function advance(fromId, broken) {
  const ch = C.ch;
  const { pb } = pbOf(ch);
  if (!pb || pb.item !== fromId) return;
  const cur = recs.get(fromId);
  if (cur && !cur.del) put({ ...cur, del: true, ...(broken ? { broken: true } : {}) });
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
  put({ k: 'pb', id: 'pb:' + ch, ch, item: null, startedAt: netNow(), pausedAt: null, auto: old?.auto, hist: old?.hist || [], ...fields });
}
// quem da call busca a próxima do autoplay: o de menor id (todos chegam à mesma conta)
function djRank(ch) {
  const ids = [selfId, ...[...peers.values()].filter((p) => p.voice?.ch === ch).map((p) => p.pid)].sort();
  return ids.indexOf(selfId);
}
const isDjLeader = (ch) => djRank(ch) === 0;
// A música acabou, mas ninguém pôs a próxima. Acontecia sempre que o "DJ" (o de menor id) terminava a
// música depois de outro da call: o outro já tirava a música e o DJ nem ficava sabendo que ela acabou.
// Também cobre o DJ que caiu ou saiu e a busca do autoplay que falhou. Cada um espera a sua vez (pela
// ordem de id) e assume: o DJ na hora, o segundo depois de uns segundos e assim por diante.
const AP = { item: null, since: 0, tries: 0, busy: false };
function watchStall(ch) {
  const pb = recs.get('pb:' + ch);
  const cur = pb?.item ? recs.get(pb.item) : null;
  if (!pb?.item || pb.pausedAt != null || !cur?.del) return (AP.item = null);
  if (AP.busy) return;
  if (AP.item !== pb.item) Object.assign(AP, { item: pb.item, since: Date.now(), tries: 0 });
  if (Date.now() - AP.since < djRank(ch) * 5000 + AP.tries * 6000) return;
  AP.tries++;
  AP.since = Date.now();
  const hist = [...(pb.hist || []), cur?.ref].filter(Boolean).slice(-40);
  const next = queueOf(ch)[0];
  if (next) return writePb(ch, { item: next.id, hist });
  const seed = cur?.ref || hist[hist.length - 1];
  if (pb.auto === false || !seed || !window.desk?.ytRelated || AP.tries > 4) return writePb(ch, { item: null, hist });
  autoplayNext(ch, cur || { id: pb.item, ref: seed }, hist);
}
// Autoplay ligado: a fila sempre mostra as próximas parecidas (como a rádio do Spotify). Quem busca é o
// DJ da call (o de menor id), uma busca por vez; as músicas que alguém põe entram antes delas.
const AUTO_FILL = 5;
async function fillAutoplay(ch) {
  const pb = recs.get('pb:' + ch);
  if (!pb?.item || pb.auto === false || !window.desk?.ytRelated || AP.busy || AP.filling || djRank(ch) !== 0) return;
  if (Date.now() - (AP.fillAt || 0) < 4000) return;
  const q = queueOf(ch);
  const autos = q.filter((x) => x.auto);
  if (autos.length >= AUTO_FILL) return;
  const cur = recs.get(pb.item);
  const seed = autos.length ? autos[autos.length - 1].ref : cur?.ref || (pb.hist || []).slice(-1)[0];
  if (!seed) return;
  AP.filling = true;
  AP.fillAt = Date.now();
  try {
    const list = await ytRelated(seed);
    const now = recs.get('pb:' + ch);
    if (now?.auto === false || C.ch !== ch) return;
    const skip = new Set([...(now?.hist || []), cur?.ref, ...queueOf(ch).map((x) => x.ref)]);
    for (const x of recs.values()) if (x.k === 'q' && x.ch === ch && x.broken) skip.add(x.ref);
    let n = AUTO_FILL - queueOf(ch).filter((x) => x.auto).length;
    let at = Date.now();
    for (const r of list) {
      if (n <= 0) break;
      if (skip.has(r.id)) continue;
      skip.add(r.id);
      put({ k: 'q', id: 'q:' + randId(), ch, ref: r.id, title: r.title || PLACEHOLDER, artist: r.artist, dur: r.dur || 0, thumb: r.thumb, addedBy: 'Autoplay', auto: true, at: at++ });
      n--;
    }
  } catch (err) {
    console.warn('autoplay', err);
  } finally {
    AP.filling = false;
  }
}
// a busca de parecidas com prazo: se travasse, o autoplay ficava esperando para sempre
const ytRelated = (id) => Promise.race([window.desk.ytRelated(id), new Promise((_, no) => setTimeout(() => no(new Error('o YouTube demorou para responder')), 20000))]);
async function autoplayNext(ch, cur, hist) {
  if (AP.busy) return;
  AP.busy = true;
  try {
    await autoplayPick(ch, cur, hist);
  } finally {
    AP.busy = false;
  }
}
async function autoplayPick(ch, cur, hist) {
  const recent = new Set([...hist, cur.ref]);
  // músicas que o YouTube não deixa tocar aqui não voltam
  for (const q of recs.values()) if (q.k === 'q' && q.ch === ch && q.broken) recent.add(q.ref);
  // parecidas com a última; se todas já tocaram, parecidas com as anteriores
  const seeds = [cur.ref, ...hist.slice(-6).reverse()].filter((r, i, a) => r && a.indexOf(r) === i).slice(0, 4);
  let pick = null;
  let list = [];
  for (const seed of seeds) {
    try {
      list = await ytRelated(seed);
    } catch (err) {
      console.warn('autoplay', err);
      continue;
    }
    pick = list.find((r) => !recent.has(r.id));
    if (pick) break;
  }
  const pb = recs.get('pb:' + ch);
  if (pb?.item !== cur.id || queueOf(ch).length) return; // alguém já pôs outra coisa
  if (!pick) return; // a busca falhou: watchStall tenta de novo daqui a pouco (e desiste depois de algumas)
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
  if (!on) {
    for (const x of queueOf(ch)) if (x.auto) put({ ...x, del: true });
  } else {
    AP.fillAt = 0;
    fillAutoplay(ch);
  }
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

// Spotify, Deezer e playlists do YouTube (o link de uma música só do YouTube continua indo direto)
const MUSIC_LINK = /(open\.spotify\.com\/|spotify:(track|album|playlist):|spotify\.link\/|spotify\.app\.link\/|deezer\.com\/|link\.deezer\.com\/|deezer\.page\.link\/|dzr\.page\.link\/|(youtube\.com|youtu\.be)\S*[?&]list=(?!RD))/i;
const SRC_NAME = { spotify: 'Spotify', deezer: 'Deezer', youtube: 'YouTube' };
// Lê as músicas do link e acha cada uma no YouTube Music. Procura 3 por vez, mas entra na fila na ordem
// do link; a primeira já começa a tocar enquanto as outras ainda estão sendo procuradas.
let linkBusy = false;
async function addMusicLink(text) {
  if (!C.ch) return toast('Entre em um canal de voz primeiro');
  if (!window.desk?.musicLink) return toast('Links do Spotify e do Deezer só funcionam no app');
  if (linkBusy) return toast('Calma, ainda estou colocando o último link na fila');
  linkBusy = true;
  const ch = C.ch;
  try {
    toast('Lendo o link…');
    let info;
    try {
      info = await window.desk.musicLink(text);
    } catch (err) {
      return toast(String(err?.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, '') || 'Não consegui abrir esse link');
    }
    if (!info) return toast('Não reconheci esse link');
    const n = info.tracks.length;
    const from = SRC_NAME[info.src] || '';
    if (n > 1) toast(`Colocando ${n} músicas de "${info.name}" (${from}) na fila…`);
    const find = (t) => (t.id ? Promise.resolve(t) : window.desk.musicMatch(t).catch(() => null));
    const jobs = info.tracks.slice(0, 3).map(find);
    let added = 0;
    let missing = 0;
    let first = null;
    for (let i = 0; i < n; i++) {
      if (i + 3 < n) jobs[i + 3] = find(info.tracks[i + 3]);
      const m = await jobs[i];
      if (C.ch !== ch) break; // saiu da call no meio
      if (!m?.id) {
        missing++;
        continue;
      }
      const item = enqueue({ ref: m.id, title: m.title || PLACEHOLDER, artist: m.artist || '', dur: m.dur || 0, thumb: m.thumb || '' }, n > 1);
      first ||= item;
      added++;
    }
    if (n > 1 || missing) toast(added ? `${added} música${added > 1 ? 's' : ''} de "${info.name}" na fila${missing ? ` (${missing} não achei no YouTube)` : ''}` : 'Não achei essas músicas no YouTube');
    return { first, added, name: info.name, from, many: n > 1 };
  } finally {
    linkBusy = false;
  }
}

function enqueue(fields, quiet) {
  if (!C.ch) return toast('Entre em um canal de voz primeiro');
  const item = { k: 'q', id: 'q:' + randId(), ch: C.ch, title: PLACEHOLDER, artist: '', dur: 0, thumb: '', addedBy: me.name, at: Date.now(), ...fields };
  put(item);
  const { item: playing } = pbOf(C.ch);
  if (!playing) writePb(C.ch, { item: item.id });
  else if (!quiet) toast(`"${item.title}" entrou na fila`);
  return item;
}
async function addLink(text) {
  if (!C.ch) return toast('Entre em um canal de voz primeiro');
  if (MUSIC_LINK.test(text)) return (await addMusicLink(text))?.first;
  const yt = parseYouTube(text);
  if (yt?.playlist) return toast('Esse tipo de playlist (mix automático) não dá. Cole o link de uma música ou de uma playlist.');
  if (!yt) return toast('Não reconheci esse link. Use um link do YouTube Music, Spotify ou Deezer.');
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
  if (!v || parseYouTube(v) || MUSIC_LINK.test(v)) {
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
  if (parseYouTube(v) || MUSIC_LINK.test(v)) {
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
  if (pb.pausedAt != null) setPb({ startedAt: netNow() - pb.pausedAt, pausedAt: null });
  else setPb({ pausedAt: netNow() - pb.startedAt });
};
$('#plRestart').onclick = () => {
  const { pb } = pbOf(C.ch);
  if (pb) setPb(pb.pausedAt != null ? { pausedAt: 0 } : { startedAt: netNow() });
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
  setPb(pb.pausedAt != null ? { pausedAt: ms } : { startedAt: netNow() - ms });
};
// Barra de volume como a do YouTube: arrastar até o fim muta; o botão de mudo guarda o volume e,
// ao desmutar, volta para ele. A parte preenchida da barra mostra o volume.
function paintMusicVol() {
  const v = settings.musicMuted ? 0 : Math.round(settings.musicVol * 100);
  const r = $('#plVol');
  r.value = v;
  r.style.setProperty('--fill', v + '%');
  r.title = v ? `Volume da música para você: ${v}%` : 'Música mutada (só para você)';
}
$('#plVol').oninput = (e) => {
  const v = e.target.value / 100;
  settings.musicVol = v;
  settings.musicMuted = v === 0;
  if (v > 0) settings.musicVolPrev = v;
  saveSettings();
  applyMusicVolume();
};
paintMusicVol();
$('#plVol').onwheel = (e) => {
  e.preventDefault();
  const cur = settings.musicMuted ? 0 : settings.musicVol;
  const v = clamp(Math.round((cur - Math.sign(e.deltaY) * 0.05) * 100) / 100, 0, 1);
  settings.musicVol = v;
  settings.musicMuted = v === 0;
  if (v > 0) settings.musicVolPrev = v;
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

// Reordenar a fila arrastando (mouse ou dedo). A ordem é o "at" de cada música; a que foi arrastada ganha um
// "at" entre as vizinhas. Solta no meio do autoplay, vira do autoplay; solta acima, vira escolhida.
const QD = { drag: null };
function moveQueueItem(id, beforeId) {
  const ch = C.ch;
  const q = queueOf(ch);
  const item = q.find((x) => x.id === id);
  if (!item || id === beforeId) return;
  const rest = q.filter((x) => x.id !== id);
  let idx = beforeId ? rest.findIndex((x) => x.id === beforeId) : rest.length;
  if (idx < 0) idx = rest.length;
  const prev = rest[idx - 1];
  const next = rest[idx];
  const auto = !!prev?.auto;
  const same = rest.filter((x) => !!x.auto === auto);
  const prevS = [...same].reverse().find((x) => rest.indexOf(x) < idx);
  const nextS = same.find((x) => rest.indexOf(x) >= idx);
  const at = prevS && nextS ? (prevS.at + nextS.at) / 2 : prevS ? prevS.at + 1 : nextS ? nextS.at - 1 : Date.now();
  if (at === item.at && auto === !!item.auto) return;
  const moved = { ...item, at };
  if (auto) moved.auto = true;
  else delete moved.auto;
  if (!auto && item.auto) moved.addedBy = me.name; // tirou do autoplay: agora é escolha de quem arrastou
  put(moved);
}
$('#queue').addEventListener('pointerdown', (e) => {
  const li = e.target.closest('li[data-qid]');
  if (!li || e.button !== 0 || e.target.closest('button')) return;
  if (e.pointerType !== 'mouse' && !e.target.closest('.q-grip')) return; // no toque, só pela alça (o resto rola a lista)
  QD.drag = { li, id: li.dataset.qid, y0: e.clientY, on: false, pid: e.pointerId };
});
addEventListener('pointermove', (e) => {
  const d = QD.drag;
  if (!d || e.pointerId !== d.pid) return;
  const dy = e.clientY - d.y0;
  if (!d.on) {
    if (Math.abs(dy) < 6) return;
    d.on = true;
    d.li.classList.add('q-dragging');
    $('#queue').classList.add('q-sorting');
    try {
      d.li.setPointerCapture(e.pointerId);
    } catch {}
  }
  d.li.style.transform = `translateY(${dy}px)`;
  // onde vai cair: antes da primeira linha cujo meio está abaixo do dedo
  const rows = [...$('#queue').querySelectorAll('li[data-qid]')].filter((r) => r !== d.li);
  let before = null;
  for (const r of rows) {
    const b = r.getBoundingClientRect();
    if (e.clientY < b.top + b.height / 2) {
      before = r;
      break;
    }
  }
  for (const r of rows) r.classList.toggle('q-drop-before', r === before);
  $('#queue').classList.toggle('q-drop-end', !before);
  d.before = before?.dataset.qid || null;
  // perto da borda, a lista rola sozinha
  const box = $('#queue').getBoundingClientRect();
  if (e.clientY < box.top + 30) $('#queue').scrollTop -= 8;
  else if (e.clientY > box.bottom - 30) $('#queue').scrollTop += 8;
});
function endQueueDrag(e) {
  const d = QD.drag;
  if (!d || (e && e.pointerId !== d.pid)) return;
  QD.drag = null;
  for (const r of $('#queue').querySelectorAll('.q-drop-before')) r.classList.remove('q-drop-before');
  $('#queue').classList.remove('q-sorting', 'q-drop-end');
  if (!d.on) return;
  d.li.classList.remove('q-dragging');
  d.li.style.transform = '';
  // um clique que virou arrasto não toca a música
  addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
  if (e?.type === 'pointerup') moveQueueItem(d.id, d.before);
  lastQueueIds = '';
  renderMusic();
}
addEventListener('pointerup', endQueueDrag);
addEventListener('pointercancel', endQueueDrag);

let lastQueueIds = '';
function renderMusic() {
  $('#musicOff').hidden = !!C.ch;
  $('#musicOn').hidden = !C.ch;
  if (!C.ch) return;
  const { pb, item } = pbOf(C.ch);
  $('#plAuto').classList.toggle('on', pb?.auto !== false);
  $('#plAuto').title = pb?.auto !== false ? 'Autoplay ligado: quando a fila acabar, toca músicas parecidas (clique para desligar)' : 'Autoplay desligado (clique para ligar)';
  $('#mediaEmpty').hidden = !!item;
  const art = $('#plArt');
  art.hidden = !item;
  if (item) {
    const src = THUMB_OK.test(item.thumb || '') ? item.thumb.replace(/=w\d+-h\d+/, '=w544-h544') : `https://i.ytimg.com/vi/${item.ref}/hqdefault.jpg`;
    if (art.getAttribute('src') !== src) art.src = src;
  }
  $('#plTitle').textContent = item ? item.title : 'Nada tocando';
  $('#plSub').textContent = item ? [item.artist, 'adicionada por ' + item.addedBy].filter(Boolean).join(' · ') : 'Busque ou cole um link do YouTube Music, Spotify ou Deezer';
  setIcon($('#plPlay'), item && pb.pausedAt == null ? 'pause' : 'play');
  const q = queueOf(C.ch);
  const ids = q.map((x) => x.id + x.v).join();
  if (ids !== lastQueueIds && !QD.drag) {
    const prev = new Set(lastQueueIds.split(','));
    lastQueueIds = ids;
    const list = $('#queue');
    const rows = q.map((x) => {
      const li = trackRow(x, true);
      li.dataset.qid = x.id;
      const grip = el('span', 'q-grip');
      grip.title = 'Arraste para mudar a ordem';
      grip.append(icon('grip-vertical', 'sm'));
      li.prepend(grip);
      return li;
    });
    const firstAuto = q.findIndex((x) => x.auto);
    const nodes = [...rows];
    if (firstAuto >= 0) {
      const sep = el('li', 'queue-sep');
      sep.append(icon('infinity', 'sm'), document.createTextNode('A seguir pelo autoplay'));
      nodes.splice(firstAuto, 0, sep);
    }
    list.replaceChildren(...nodes);
    const fresh = rows.filter((li, i) => !prev.has(q[i].id + q[i].v));
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
    // Barra em decibéis, como em mesa de som: 100 = volume cheio, cada 10 da barra = -5 dB,
    // 60 = -20 dB (um décimo), 1 = quase nada. No PC o app controla o volume de verdade dentro do player
    // (o do YouTube não baixa de ~4%); no celular sobra o volume do YouTube com uma curva.
    const v = settings.musicVol;
    const gain = v <= 0 ? 0 : Math.pow(10, ((v - 1) * 50) / 20);
    if (window.desk?.musicGain) {
      p.setVolume(100);
      window.desk.musicGain(gain).catch(() => {});
    } else p.setVolume(Math.round(Math.pow(v, 2.5) * 100));
    C.deafened || settings.musicMuted || settings.musicVol === 0 ? p.mute() : p.unMute();
  }
  const muted = settings.musicMuted || settings.musicVol === 0;
  paintMusicVol();
  for (const b of [$('#plMute'), $('#npMute')]) {
    setIcon(b, muted ? 'volume-x' : 'volume-2');
    b.classList.toggle('off', muted);
    b.title = muted ? 'Desmutar música' : 'Mutar música (só para você)';
  }
}
function toggleMusicMute(e) {
  e?.stopPropagation();
  const muted = settings.musicMuted || settings.musicVol === 0;
  settings.musicMuted = !muted;
  if (muted && settings.musicVol === 0) settings.musicVol = settings.musicVolPrev || 0.6; // volta ao volume de antes
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
const customSounds = () => all('snd').sort((a, b) => a.at - b.at);
function soundName(id) {
  return recs.get(id)?.name || 'som';
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
  if (!C.ch || p?.voice?.ch !== C.ch || recs.get(id)?.k !== 'snd') return;
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
  grid.replaceChildren(...customSounds().map((r) => btn(r.id, r.name, cleanColor(r.color), r)));
  const fresh = [...grid.children].filter((b) => !prev.has(b.dataset.id));
  if (fresh.length && fresh.length < grid.children.length) springIn(fresh);
  $('#soundsHint').textContent = !customSounds().length
    ? 'Nenhum som ainda. Clique em "Adicionar som" e escolha um áudio ou vídeo do PC.'
    : C.ch
      ? 'Clique num som para tocar para todo mundo na call.'
      : 'Entre em um canal de voz para tocar os sons para a galera.';
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
// <t:1700000000:R> (como no Stoat/Discord): data e hora no fuso de quem lê
const relTime = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
function timeTag(sec, f) {
  const d = new Date(Number(sec) * 1000);
  if (!Number.isFinite(d.getTime())) return '';
  const full = d.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
  let text;
  if (f === 'R') {
    const diff = (d.getTime() - Date.now()) / 1000;
    const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
    const [u, n] = units.find(([, n]) => Math.abs(diff) >= n) || ['second', 1];
    text = relTime.format(Math.round(diff / n), u);
  } else if (f === 't') text = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  else if (f === 'T') text = d.toLocaleTimeString('pt-BR');
  else if (f === 'd') text = d.toLocaleDateString('pt-BR');
  else if (f === 'D') text = d.toLocaleDateString('pt-BR', { dateStyle: 'long' });
  else if (f === 'F') text = full;
  else text = d.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  return `<time class="md-time" title="${escapeHtml(full)}">${escapeHtml(text)}</time>`;
}
function format(text) {
  const keep = [];
  const hold = (h) => `\u0000${keep.push(h) - 1}\u0000`;
  let s = escapeHtml(text.replace(/\u0000/g, ''));
  s = s.replace(/```(?:[\w+-]*\n)?([\s\S]*?)```/g, (_, c) => hold(`<pre><code>${c}</code></pre>`));
  s = s.replace(/`([^`\n]+)`/g, (_, c) => hold(`<code>${c}</code>`));
  s = s.replace(/&lt;t:(-?\d{1,12})(?::([tTdDfFR]))?&gt;/g, (m0, n, f) => hold(timeTag(n, f)) || m0);
  // [texto](link): o endereço aparece ao passar o mouse
  s = s.replace(/\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)<]+)\)/g, (_, t, u) => hold(`<a href="${u}" target="_blank" title="${u}">${t}</a>`));
  s = s.replace(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g, (u) => hold(`<a href="${u}" target="_blank">${u}</a>`));
  // :nome: = emoji do grupo
  const emo = emojiMap();
  s = s.replace(/:([a-z0-9_]{2,32}):/g, (m0, n) => {
    const e = emo.get(n);
    return e ? hold(`<img class="cemoji" data-file="${e.file}" data-owner="${e.by}" alt=":${n}:" title=":${n}:">`) : m0;
  });
  // lista com "* " vira "- " antes do itálico (senão o * vira itálico)
  s = s.replace(/^\* /gm, '- ');
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/~~(.+?)~~/g, '<s>$1</s>');
  s = s.replace(/(^|\s)@([^\s@<&]{1,32})/g, '$1<span class="mention-tag">@$2</span>');
  s = s.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler" title="Spoiler: clique para ver">$1</span>');
  s = s.replace(/^&gt; ?(.*)$/gm, '<span class="quote">$1</span>'); // "> citação"
  // títulos, texto pequeno e listas (cada um é uma linha inteira)
  s = s.replace(/^(#{1,3}) (.+)$/gm, (_, h, t) => `<span class="md-h${h.length}">${t}</span>`);
  s = s.replace(/^-# (.+)$/gm, '<span class="md-sub">$1</span>');
  s = s.replace(/^- (.+)$/gm, '<span class="md-li">$1</span>');
  s = s.replace(/^(\d{1,3})\. (.+)$/gm, '<span class="md-li md-ol" data-n="$1.">$2</span>');
  s = s.replace(/(<span class="(?:quote|md-h[123]|md-sub|md-li[^"]*)"[^>]*>[^\n]*<\/span>)\n/g, '$1');
  s = s.replace(/\n/g, '<br>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
}
// emojis do grupo (registros "emo"): nome -> registro
const EMO_NAME = /^[a-z0-9_]{2,32}$/;
let emojiMapCache = null;
function emojiMap() {
  if (emojiMapCache) return emojiMapCache;
  const m = new Map();
  for (const e of all('emo').sort((a, b) => a.v - b.v)) if (EMO_NAME.test(e.name) && FILE_ID.test(e.file)) m.set(e.name, e);
  return (emojiMapCache = m);
}
// carrega as imagens dos emojis do grupo depois que o texto entra na tela
function hydrateEmojis(root) {
  for (const img of root.querySelectorAll('img.cemoji:not([src])')) fileUrl(img.dataset.file, img.dataset.owner).then((u) => u && (img.src = u));
  return root;
}
// só emojis (até 6 do grupo ou 16 caracteres normais): aparecem grandes
const isJumbo = (t) => {
  const rest = t.replace(/:([a-z0-9_]{2,32}):/g, (m0, n) => (emojiMap().has(n) ? '' : m0));
  return t.length <= 220 && rest.length <= 16 && (rest.trim() !== '' || rest !== t) && /^(\p{Extended_Pictographic}|️|‍|\s)*$/u.test(rest);
};
const repliedToMe = (m) => !!m.reply && recs.get(m.reply)?.uid === me.id;
const pingsMe = (m) => mentionedMe(m.text) || repliedToMe(m);
// mensagens fixadas (registros "pin:<id da mensagem>")
const pinOf = (msgId) => {
  const p = recs.get('pin:' + msgId);
  return p && !p.del ? p : null;
};
function togglePin(m) {
  const cur = recs.get('pin:' + m.id);
  if (cur && !cur.del) {
    put({ ...cur, del: true });
    toast('Mensagem desafixada');
  } else {
    put({ k: 'pin', id: ('pin:' + m.id).slice(0, 80), msg: m.id, ch: m.ch, uid: me.id, name: me.name, at: Date.now() });
    toast('Mensagem fixada');
  }
}
// leva até a mensagem (rola e pisca)
function jumpTo(msgId) {
  const node = [...$$(`.msg[data-id="${msgId}"]`)].find((n) => n.offsetParent);
  if (!node) return toast('Essa mensagem não está mais aqui');
  node.scrollIntoView({ block: 'center', behavior: 'smooth' });
  node.classList.remove('flash');
  void node.offsetWidth;
  node.classList.add('flash');
}
// ----- prévia de link (título, descrição e imagem da página) -----
const previewCache = new Map();
const firstUrl = (text) => String(text || '').replace(/```[\s\S]*?```|`[^`\n]*`/g, '').match(/https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/)?.[0];
function previewEl(url) {
  const box = el('div', 'embed-slot');
  if (!window.desk?.linkPreview) return box;
  if (!previewCache.has(url)) previewCache.set(url, window.desk.linkPreview(url).catch(() => null));
  previewCache.get(url).then((p) => {
    if (!p || !box.isConnected) return;
    const chatBox = box.closest('.chat-scroll');
    const stick = chatBox && chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 80;
    const card = el('div', 'embed' + (p.big ? ' big' : ''));
    if (p.color) card.style.setProperty('--embed', p.color);
    const info = el('div', 'embed-info');
    if (p.site) info.append(el('div', 'embed-site', p.site));
    if (p.title) {
      const a = el('a', 'embed-title', p.title);
      a.href = p.url;
      a.target = '_blank';
      info.append(a);
    }
    if (p.desc) info.append(el('div', 'embed-desc', p.desc));
    card.append(info);
    if (p.image) {
      const img = el('img', 'embed-img');
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.onerror = () => img.remove();
      img.onload = () => stick && (chatBox.scrollTop = chatBox.scrollHeight);
      img.src = p.image;
      if (p.big) img.onclick = () => openLightbox(p.image);
      card.append(img);
    }
    box.replaceChildren(card);
    if (stick) chatBox.scrollTop = chatBox.scrollHeight;
  });
  return box;
}
// selos do perfil (como no Stoat): fundador = escreveu na primeira semana do grupo
function badgesOf(uid) {
  const out = [];
  if (uid === recs.get('grp')?.owner) out.push(['crown', 'Dono do grupo']);
  const msgs = all('msg').filter((m) => !m.bot);
  if (msgs.length) {
    let start = Infinity;
    let mine = Infinity;
    for (const m of msgs) {
      if (m.ts < start) start = m.ts;
      if (m.uid === uid && m.ts < mine) mine = m.ts;
    }
    if (mine - start < 7 * 86400_000) out.push(['sprout', 'Fundador: está no grupo desde a primeira semana']);
  }
  return out;
}

function messageEl(m, prev) {
  const grouped = prev && prev.uid === m.uid && !!prev.bot === !!m.bot && m.ts - prev.ts < 5 * 60_000;
  const d = el('div', 'msg' + (grouped ? ' grouped' : ''));
  const pinned = pinOf(m.id);
  d.dataset.id = m.id;
  d.dataset.ts = m.ts;
  d.dataset.uid = m.uid;
  if (m.uid === me.id && !m.bot) d.classList.add('mine');
  if (m.bot) {
    d.classList.add('bot');
    d.dataset.bot = '1';
  }
  // o DJ não usa o perfil de quem chamou o comando; bot do gateway (via: 'stoat') tem perfil próprio
  const isDJ = (x) => x.bot && !x.via;
  const uid = isDJ(m) || m.imp ? null : m.uid;
  const who = { id: m.uid, name: m.name, color: m.color };
  const av = avatar(m.name, m.color, '', uid);
  if (m.imp && /^https:\/\/cdn\.discordapp\.com\/(avatars|embed\/avatars)\//.test(m.av || '')) {
    const img = el('img');
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => img.remove();
    img.src = m.av;
    av.append(img);
  }
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
    if (m.imp === 'dc') {
      const tag = el('span', 'dc-tag', 'Discord');
      tag.title = 'Mensagem importada do Discord';
      head.append(tag);
    }
    head.append(t);
    if (pinned) {
      const pi = icon('pin', 'sm pin-mark');
      pi.setAttribute('aria-label', `Fixada por ${pinned.name}`);
      head.append(pi);
    }
    body.append(head);
  } else {
    const gt = el('time', 'gtime', hhmm.format(m.ts)); // horário ao passar o mouse
    gt.title = new Date(m.ts).toLocaleString('pt-BR');
    d.append(gt);
  }
  if (m.ghost) d.classList.add('ghost');
  if (m.uid !== me.id && !m.bot && (pingsMe(m) || (plug('mentions') && mentionsMe(m.text)))) d.classList.add('mention');
  if (pinned) d.classList.add('pinned');
  // respondendo a uma mensagem: a citação em cima (clique leva até ela)
  if (m.reply) {
    const ref = recs.get(m.reply);
    const r = el('div', 'reply-ref');
    r.append(icon('corner-up-left', 'sm'));
    if (ref && !ref.del) {
      r.append(nameEl(ref.bot && !ref.via ? 'DJ' : ref.name, ref.color, ref.bot && !ref.via ? null : ref.uid, 'reply-name'));
      const snip = el('span', 'reply-text');
      snip.innerHTML = format(String(ref.text || (ref.att?.length ? '[anexo]' : '')).replace(/\s+/g, ' ').slice(0, 120));
      r.append(hydrateEmojis(snip));
      r.onclick = () => jumpTo(ref.id);
    } else r.append(el('span', 'reply-text muted', 'mensagem apagada'));
    body.append(r);
  }
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
  if (!m.ghost && iCan(P.ManageMessages)) action(pinned ? 'pin-off' : 'pin', pinned ? 'Desafixar' : 'Fixar no canal', () => togglePin(m));
  if (!m.ghost && !m.bot && m.uid !== me.id && iCan(P.ManageMessages) && outranks(me.id, m.uid))
    action('trash-2', 'Apagar mensagem (moderação)', (e) => deleteMessage(m, e.shiftKey), 'danger');
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
    hydrateEmojis(text);
    if (m.edited) text.append(el('span', 'edited', '(editado)'));
    if (m.ghost) text.append(el('span', 'edited', '(apagada)'));
    body.append(text);
    const url = !m.bot && !m.ghost && firstUrl(m.text);
    if (url) body.append(previewEl(url));
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
const MSG_PAGE = 250;
const msgShown = {}; // canal -> quantas mensagens mostrar
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
  const lim = msgShown[ch] || MSG_PAGE;
  const older = searching ? 0 : Math.max(0, list.length - lim);
  if (older) {
    list = list.slice(-lim);
    const more = el('button', 'ghost sm load-older');
    more.type = 'button';
    more.append(icon('arrow-down-to-line', 'sm flip-v'), document.createTextNode(`Carregar mensagens mais antigas (${older.toLocaleString('pt-BR')})`));
    more.onclick = () => {
      msgShown[ch] = lim + 500;
      renderChat(box, ch, true);
    };
    frag.append(more);
  } else if (box.id === 'messages') {
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
// respondendo a: caixa do chat -> id da mensagem (aparece uma barra em cima do campo)
const replying = new Map();
function replyTo(m, node) {
  const box = node.closest('.chat-scroll');
  replying.set(box?.id === 'callMessages' ? 'callMessages' : 'messages', m.id);
  renderReplyBars();
  const field = composerOf(box);
  field.focus();
}
function renderReplyBars() {
  for (const [boxId, form] of [['messages', $('#composer')], ['callMessages', $('#callComposer')]]) {
    let bar = form.querySelector('.reply-bar');
    const m = recs.get(replying.get(boxId));
    if (!m || m.del) {
      replying.delete(boxId);
      bar?.remove();
      continue;
    }
    if (!bar) {
      bar = el('div', 'reply-bar');
      form.prepend(bar);
      popIn(bar, { duration: 0.15 });
    }
    const x = el('button', 'icon-btn sm');
    x.type = 'button';
    x.title = 'Cancelar resposta (Esc)';
    x.append(icon('x', 'sm'));
    x.onclick = () => {
      replying.delete(boxId);
      renderReplyBars();
    };
    const label = el('span', 'reply-bar-text');
    label.append(document.createTextNode('Respondendo a '), nameEl(m.bot && !m.via ? 'DJ' : m.name, m.color, m.bot && !m.via ? null : m.uid));
    bar.replaceChildren(icon('corner-up-left', 'sm'), label, x);
  }
}
// tira a resposta pendente do campo e devolve o id (para a mensagem que vai sair agora)
function takeReply(boxId) {
  const id = replying.get(boxId);
  replying.delete(boxId);
  renderReplyBars();
  return id && recs.get(id) && !recs.get(id).del ? id : undefined;
}
for (const [field, boxId] of [[$('#input'), 'messages'], [$('#callInput'), 'callMessages']])
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && replying.has(boxId)) {
      replying.delete(boxId);
      renderReplyBars();
    }
  });
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
  if (m.uid !== me.id && !(iCan(P.ManageMessages) && outranks(me.id, m.uid))) return;
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
  const reply = takeReply('messages');
  put({ k: 'msg', id: 'm:' + randId(), ch: S.view, uid: me.id, name: me.name, color: me.color, text: text.slice(0, 2000), att, ts: Date.now(), ...(reply ? { reply } : {}) });
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
  const reply = takeReply('callMessages');
  put({ k: 'msg', id: 'm:' + randId(), ch, uid: me.id, name: me.name, color: me.color, text: text.slice(0, 2000), att: [], ts: Date.now(), ...(reply ? { reply } : {}) });
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
    settings.musicMuted = v === 0;
    if (v > 0) settings.musicVolPrev = v / 100;
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
      if (MUSIC_LINK.test(arg)) {
        const r = await addMusicLink(arg);
        if (r?.many && r.added) return botSay(ch, `${who} colocou **${r.added} músicas** de **${r.name}** (${r.from}) na fila`);
        added = r?.first;
      } else if (parseYouTube(arg)) added = await addLink(arg);
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
      setPb({ pausedAt: netNow() - pb.startedAt });
      return botSay(ch, `${who} pausou a música`);
    case 'resume':
      if (!item || pb.pausedAt == null) return note(box, 'Nada pausado.');
      setPb({ startedAt: netNow() - pb.pausedAt, pausedAt: null });
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
  openAnim(pop);
}
document.addEventListener('mousedown', (e) => {
  if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true;
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && (pop.hidden = true));
function openEmoji(anchor, pick) {
  const wrap = el('div', 'emoji-pop');
  const custom = [...emojiMap().values()];
  if (custom.length) {
    wrap.append(el('div', 'emoji-sec', 'Do grupo'));
    const cg = el('div', 'emoji-grid custom');
    for (const e of custom) {
      const b = el('button');
      b.type = 'button';
      b.title = `:${e.name}:`;
      const img = el('img', 'cemoji');
      img.dataset.file = e.file;
      img.dataset.owner = e.by;
      img.alt = `:${e.name}:`;
      b.append(img);
      b.onclick = () => {
        pick(`:${e.name}:`);
        pop.hidden = true;
      };
      cg.append(b);
    }
    wrap.append(hydrateEmojis(cg), el('div', 'emoji-sec', 'Emojis'));
  }
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
  wrap.append(grid);
  openPopover(anchor, wrap);
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
  if (!opts.preview)
    for (const [ic, title] of badgesOf(user.id)) {
      const b = icon(ic, 'pc-badge');
      b.setAttribute('aria-label', title);
      const wrapB = el('span', 'pc-badge-wrap');
      wrapB.title = title;
      wrapB.append(b);
      nameRow.append(wrapB);
    }
  const g = googleOf(user.id);
  if (g && !opts.preview) {
    const b = icon('badge-check', 'g-badge');
    b.setAttribute('aria-label', 'Conta Google: ' + g.email);
    nameRow.append(b);
  }
  body.append(nameRow);
  if (prof.pronouns) body.append(el('div', 'pc-pron', prof.pronouns));
  if (prof.status || prof.statusEmoji) body.append(el('div', 'pc-status', `${prof.statusEmoji || ''} ${prof.status || ''}`.trim()));
  const act = !opts.preview && actOf(user.id);
  if (act) {
    body.append(el('div', 'pc-sec', act.k === 'music' ? 'Ouvindo agora' : 'Jogando agora'));
    const box = el('div', 'pc-act');
    const pic = el('div', 'pc-act-img');
    if (act.i) {
      const img = el('img');
      img.referrerPolicy = 'no-referrer';
      img.onerror = () => img.remove();
      img.src = act.i;
      pic.append(img);
    } else pic.append(icon(act.k === 'music' ? 'list-music' : 'gamepad-2'));
    const txt = el('div', 'pc-act-txt');
    txt.append(el('b', '', act.n));
    if (act.d) txt.append(el('span', '', act.d));
    if (act.s) txt.append(el('span', '', act.s));
    if (act.t) txt.append(el('span', 'muted', 'há ' + sinceText(act.t)));
    box.append(pic, txt);
    body.append(box);
  }
  if (g && !opts.preview) body.append(el('div', 'pc-mail', g.email));
  if (prof.bio) {
    body.append(el('div', 'pc-sec', 'Sobre mim'));
    const bio = el('div', 'pc-bio');
    bio.innerHTML = format(prof.bio);
    body.append(hydrateEmojis(bio));
  }
  const live = [...peers.values()].find((p) => p.user?.id === user.id && p.voice?.ch);
  const vch = user.id === me.id ? C.ch : live?.voice.ch;
  if (vch && channel(vch)) body.append(el('div', 'pc-sec', 'Na call'), el('div', 'pc-call', channel(vch).name));
  // cargos (e, para quem pode, botões de moderação)
  const userRoles = rolesOf(user.id);
  if (userRoles.length && !opts.preview) {
    body.append(el('div', 'pc-sec', 'Cargos'));
    const chips = el('div', 'role-chips');
    for (const r of userRoles) {
      const chip = el('span', 'role-chip', r.name);
      chip.style.setProperty('--rc', cleanHex(r.color) || '#8a8f98');
      chips.append(chip);
    }
    body.append(chips);
  }
  if (!opts.preview && user.id !== me.id && groupOwner() && outranks(me.id, user.id) && (iCan(P.KickMembers) || iCan(P.BanMembers))) {
    const mod = el('div', 'pc-mod');
    if (iCan(P.KickMembers)) {
      const k = el('button', 'ghost sm');
      k.type = 'button';
      k.append(icon('user-minus', 'sm'), document.createTextNode('Expulsar (10 min)'));
      k.onclick = () => confirm(`Expulsar ${user.name} por 10 minutos?`) && banUser(user, 10 * 60_000);
      mod.append(k);
    }
    if (iCan(P.BanMembers)) {
      const b = el('button', 'ghost sm danger-text');
      b.type = 'button';
      b.append(icon('ban', 'sm'), document.createTextNode('Banir'));
      b.onclick = () => confirm(`Banir ${user.name} do grupo?`) && banUser(user);
      mod.append(b);
    }
    body.append(mod);
  }
  if (!opts.preview && user.id !== me.id && dm) {
    const fb = dm.profileButtons({ ...user, bot: user.bot || [...peers.values()].some((p) => p.user?.id === user.id && p.user.bot) });
    if (fb) {
      const row = el('div', 'pc-mod pc-friend');
      row.append(fb);
      body.append(row);
    }
  }
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
  // quem está ao vivo na minha call: popup para entrar na live (como no Discord)
  const live = [...peers.values()].find((p) => p.user?.id === user.id && p.voice?.streaming && C.ch && p.voice.ch === C.ch);
  if (live && !C.watching.has(live.pid)) return openLivePopup(user, live, anchor);
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
  if (tab === 'rpg') {
    openRpgSession();
    return;
  }
  setPane('right');
  if (tab === currentTab) return;
  currentTab = tab;
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  const panes = { people: $('#panePeople'), chat: $('#paneChat'), music: $('#paneMusic'), sounds: $('#paneSounds') };
  for (const [name, pane] of Object.entries(panes)) if (pane) pane.hidden = name !== tab;
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
  for (const p of peers.values()) if (p.user && p.user.id !== me.id && !banOf(p.user.id) && filter(p)) byUser.set(p.user.id, p);
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
// Trocar, pausar ou pular música (e o autoplay buscando a próxima) deixa o DJ "fora" por um instante:
// só conta como saída se ele continuar fora por 8 s, e aí sim toca o som de sair.
let djHere = false;
let djLeaveTimer = 0;
function checkDj() {
  const here = !!C.ch && voiceMembers(C.ch).some((m) => m.key === 'dj');
  if (here) {
    clearTimeout(djLeaveTimer);
    djLeaveTimer = 0;
    if (!djHere) sfx.join();
    djHere = true;
  } else if (djHere && !djLeaveTimer) {
    djLeaveTimer = setTimeout(() => {
      djLeaveTimer = 0;
      if (!C.ch || voiceMembers(C.ch).some((m) => m.key === 'dj')) return;
      djHere = false;
      sfx.leave();
    }, 8000);
  }
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
  const cats = all('cat').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const catIds = new Set(cats.map((c) => c.id));
  const textRow = (c) => {
      const li = el('li');
      const row = el('div', 'ch' + (S.view === c.id ? ' active' : '') + (S.unread.has(c.id) && S.view !== c.id ? ' unread' : '') + (settings.mutedCh[c.id] ? ' muted-ch' : ''));
      row.dataset.chid = c.id;
      row.append(icon('hash'), el('span', 'label', c.name));
      if (S.unread.has(c.id) && S.view !== c.id) row.append(el('span', 'unread-dot'));
      row.append(editBtn(c));
      row.onclick = () => openView(c.id);
      dragChannel(row, c);
      li.append(row);
      rows.push([c.id, li]);
      return li;
  };
  textList.replaceChildren(...channels('text').filter((c) => !catIds.has(c.cat)).map(textRow));
  const voiceList = $('#voiceList');
  const voiceRow = (c) => {
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
      // soltar um amigo arrastado aqui move ele para este canal; soltar você mesmo troca de canal
      dragChannel(row, c);
      row.addEventListener('dragover', (e) => {
        if (!e.dataTransfer.types.includes('janja/uid')) return;
        e.preventDefault();
        row.classList.add('drop-here');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drop-here'));
      row.addEventListener('drop', (e) => {
        row.classList.remove('drop-here');
        const uid = e.dataTransfer.getData('janja/uid');
        if (!uid) return;
        e.preventDefault();
        if (uid === me.id) return C.ch !== c.id && (openView(c.id), joinVoice(c.id));
        const u = userFromUid(uid);
        if (u) moveUser(u, c.id);
      });
      li.append(row);
      if (members.length) {
        const ul = el('ul', 'voice-users');
        for (const m of members) {
          const u = el('li' + '');
          u.dataset.speak = m.key;
          u.dataset.uid = m.user.id;
          u.classList.toggle('speaking', C.speaking.has(m.key));
          const pn = el('span', 'pname', m.user.name);
          const rc = !m.dj && roleColorOf(m.user.id);
          if (rc) pn.style.color = rc;
          u.append(avatar(m.user.name, m.user.color, 'xs', m.user.id), pn);
          if (!m.dj && m.user.id === groupOwner()) u.append(icon('crown', 'owner-crown'));
          if (m.dj) u.append(el('span', 'bot-tag', 'BOT'));
          u.append(flagsEl(m.voice, m.key));
          if (m.peer) u.append(pingEl(m.key));
          if (!m.dj && iCan(P.MoveMembers)) {
            u.draggable = true;
            u.ondragstart = (e) => {
              e.dataTransfer.setData('janja/uid', m.user.id);
              e.dataTransfer.effectAllowed = 'move';
            };
          }
          u.onclick = (e) => (e.stopPropagation(), openProfile(m.user, u));
          ul.append(u);
          rows.push([c.id + ':' + m.user.id, u]);
        }
        li.append(ul);
      }
      rows.push([c.id, li]);
      return li;
  };
  voiceList.replaceChildren(...channels('voice').filter((c) => !catIds.has(c.cat)).map(voiceRow));
  // categorias (como no Stoat): clique no nome recolhe; arraste canais para dentro e para fora
  $('#catList').replaceChildren(
    ...cats.map((cat) => {
      const box = el('div', 'cat' + (settings.collapsedCats?.[cat.id] ? ' collapsed' : ''));
      const head = el('div', 'cat-head');
      head.append(icon(settings.collapsedCats?.[cat.id] ? 'chevron-right' : 'chevron-down', 'sm'), el('span', 'label', cat.name));
      if (iCan(P.ManageChannel)) {
        const add = el('button', 'icon-btn sm');
        add.title = 'Criar canal nesta categoria';
        add.append(icon('plus', 'sm'));
        add.onclick = (e) => {
          e.stopPropagation();
          const menu = el('div', 'menu');
          for (const [type, label] of [['text', 'Canal de texto'], ['voice', 'Canal de voz']]) {
            const b = el('button', 'menu-item', label);
            b.type = 'button';
            b.onclick = () => {
              pop.hidden = true;
              openChannelDialog(type, null, cat.id);
            };
            menu.append(b);
          }
          openPopover(add, menu);
        };
        const edit = el('button', 'icon-btn sm ch-edit');
        edit.title = 'Editar categoria';
        edit.append(icon('pencil', 'sm'));
        edit.onclick = (e) => {
          e.stopPropagation();
          openChannelDialog('cat', cat);
        };
        head.append(add, edit);
      }
      head.onclick = () => {
        settings.collapsedCats = { ...settings.collapsedCats, [cat.id]: !settings.collapsedCats?.[cat.id] };
        saveSettings();
        renderSidebar();
      };
      dropZone(head, cat.id);
      const ul = el('ul', 'ch-list');
      if (!settings.collapsedCats?.[cat.id])
        ul.append(
          ...all('ch')
            .filter((c) => c.cat === cat.id)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
            .map((c) => (c.type === 'voice' ? voiceRow(c) : textRow(c))),
        );
      box.append(head, ul);
      rows.push([cat.id, box]);
      return box;
    }),
  );
  for (const b of $$('[data-add]')) b.hidden = !iCan(P.ManageChannel);
  $('#btnAddCat').hidden = !iCan(P.ManageChannel);
  // anima só o que apareceu agora
  const fresh = rows.filter(([k]) => !seenRows.has(k)).map(([, e]) => e);
  if (fresh.length) S.firstRender ? animate(fresh, { opacity: [0, 1], x: [-10, 0] }, { delay: stagger(0.03), duration: 0.25, ease: EASE }) : popIn(fresh);
  seenRows = new Set(rows.map(([k]) => k));
  S.firstRender = false;

  $('#voiceBar').hidden = !C.ch;
  if (C.ch) $('#vbChannel').textContent = channel(C.ch)?.name || '';
  if (C.ch) renderCallStatus();
  renderStatusBar();
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
    rememberServer({ name: gname, color: g.color || '', icon: g.icon || '', by: g.by || '' });
  }
  $('#groupDesc').hidden = !g.desc;
  $('#groupDesc').textContent = g.desc || '';
  $('.group-card').title = g.desc || '';
  $('#tbGroup').textContent = gname;
}
// arrastar canais: soltar em cima de outro canal põe antes dele (na mesma categoria); na categoria, no fim dela
function dragChannel(row, c) {
  if (!iCan(P.ManageChannel)) return;
  row.draggable = true;
  row.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('janja/ch', c.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  row.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('janja/ch')) return;
    e.preventDefault();
    row.classList.add('drop-before');
  });
  row.addEventListener('dragleave', () => row.classList.remove('drop-before'));
  row.addEventListener('drop', (e) => {
    row.classList.remove('drop-before');
    const id = e.dataTransfer.getData('janja/ch');
    const moved = channel(id);
    if (!moved || id === c.id) return;
    e.preventDefault();
    e.stopPropagation();
    put({ ...moved, cat: channel(c.id)?.cat || null, order: (c.order ?? 0) - 0.5 });
  });
}
function dropZone(node, catId) {
  node.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('janja/ch')) return;
    e.preventDefault();
    node.classList.add('drop-here');
  });
  node.addEventListener('dragleave', () => node.classList.remove('drop-here'));
  node.addEventListener('drop', (e) => {
    node.classList.remove('drop-here');
    const moved = channel(e.dataTransfer.getData('janja/ch'));
    if (!moved) return;
    e.preventDefault();
    const order = Math.max(0, ...all('ch').filter((c) => (c.cat || null) === catId).map((c) => c.order ?? 0)) + 1;
    put({ ...moved, cat: catId, order });
  });
}
function editBtn(c) {
  const b = el('button', 'icon-btn sm ch-edit');
  if (!iCan(P.ManageChannel)) b.hidden = true;
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
  // quem tem cargo "separado na lista" aparece embaixo do nome do cargo, do mais alto para o mais baixo
  const hoistOf = (uid) => rolesOf(uid).find((r) => r.hoist) || null;
  everyone.sort((a, b) => (hoistOf(a.user.id)?.order ?? Infinity) - (hoistOf(b.user.id)?.order ?? Infinity) || a.user.name.localeCompare(b.user.name));
  const prev = new Set([...list.children].map((li) => li.dataset.uid));
  let lastGroup;
  const withHeads = [];
  for (const m of everyone) {
    const h = hoistOf(m.user.id);
    const key = h?.id || '@all';
    if (key !== lastGroup) {
      lastGroup = key;
      const n = everyone.filter((x) => (hoistOf(x.user.id)?.id || '@all') === key).length;
      const head = el('li', 'role-head', `${h ? h.name : 'Online'} — ${n}`);
      head.dataset.uid = 'head:' + key;
      if (h?.color) head.style.color = h.color;
      withHeads.push({ head });
    }
    withHeads.push(m);
  }
  list.replaceChildren(
    ...withHeads.map((m) => {
      if (m.head) return m.head;
      const li = el('li', 'st-' + statusOf(m.user.id));
      li.dataset.uid = m.user.id;
      if (settings.localMute[m.user.id]) li.classList.add('lmuted');
      const who = el('div', 'who');
      const pname = el('div', 'pname');
      pname.append(nameEl(m.user.name, m.user.color, m.user.id));
      if (m.user.id === groupOwner()) pname.append(icon('crown', 'owner-crown'));
      if (m.user.bot) pname.append(el('span', 'bot-tag', 'BOT'));
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
      const act = actOf(m.user.id);
      if (act) {
        const line = el('div', 'pact');
        line.append(icon(act.k === 'music' ? 'list-music' : 'gamepad-2', 'sm'), el('span', '', actLabel(act)));
        line.title = [actLabel(act), act.d, act.s].filter(Boolean).join(' · ');
        who.append(line);
      }
      const rpgSum = rpgOf(m.user.id);
      if (rpgSum) {
        const rline = el('div', 'pact rpg-mini-line');
        rline.append(icon('dices', 'sm'), el('span', '', rpgSum.pvm ? `${rpgSum.gm ? 'Mestre · ' : ''}${rpgSum.cn} (${rpgSum.cl} nv. ${rpgSum.lv}) · PV ${rpgSum.pv}/${rpgSum.pvm}` : 'Mestre da mesa'));
        if (rpgSum.pvm) rline.title = `${rpgSum.cn} · ${rpgSum.rc} ${rpgSum.cl} nv. ${rpgSum.lv} · PV ${rpgSum.pv}/${rpgSum.pvm} · PM ${rpgSum.pm}/${rpgSum.pmm}`;
        who.append(rline);
      }
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
  // câmera maximizada: ocupa o palco; o resto fica pequeno embaixo
  const fm = C.camFocus ? members.find((m) => m.key === C.camFocus) : null;
  const fcs = fm && camOf(fm);
  if (C.camFocus && !fcs) C.camFocus = null;
  if (fcs) {
    if (document.fullscreenElement && document.fullscreenElement === C.camTile) {
      stageKeys = keysNow;
      return renderControls();
    }
    const main = el('div', 'stream-focus');
    const t = el('div', 'focus cam-focus' + (C.speaking.has(fm.key) ? ' speaking' : ''));
    t.dataset.speak = fm.key;
    C.camTile = t;
    const v = camVideo(fcs, fm.key === 'me');
    const tag = el('div', 'tag');
    tag.textContent = fm.user.name + (fm.key === 'me' ? ' (você)' : '');
    const tools = el('div', 'tile-tools');
    const tbtn = (name, title, fn) => {
      const b = el('button', 'fs');
      b.type = 'button';
      b.title = title;
      b.append(icon(name, 'sm'));
      b.onclick = (e) => {
        e.stopPropagation();
        fn();
      };
      tools.append(b);
      return b;
    };
    tbtn('minimize-2', 'Minimizar a câmera (Esc)', () => setCamFocus(null));
    if (document.pictureInPictureEnabled)
      tbtn('pip', 'Janela flutuante (fica por cima dos outros programas)', () =>
        (document.pictureInPictureElement === v ? document.exitPictureInPicture() : v.requestPictureInPicture()).catch((err) => toast('Não deu para abrir a janela flutuante: ' + err.message)),
      );
    const fsb = tbtn('maximize', 'Tela cheia', () => (document.fullscreenElement ? document.exitFullscreen() : t.requestFullscreen()));
    t.ondblclick = () => fsb.click();
    t.append(v, tag, tools);
    main.append(t);
    const strip = el('div', 'strip');
    for (const s of shown) {
      const st = fillStreamTile(s, shown.length);
      st.classList.add('mini');
      st.onclick = (e) => {
        if (e.target.closest('button')) return;
        C.focus = s.key;
        setCamFocus(null);
      };
      strip.append(st);
    }
    for (const m of unwatched) {
      const w = el('div', 'watch-tile');
      w.append(icon('eye'), el('span', '', `Assistir ${m.user.name}`));
      w.onclick = () => watchStream(m.key);
      strip.append(w);
    }
    for (const m of members) if (m.key !== fm.key) strip.append(memberThumb(m));
    stage.replaceChildren(main, stripResizer(), strip);
    if (!stageKeys.has('camfocus:' + fm.key)) springIn(t);
    keysNow.add('camfocus:' + fm.key);
    for (const vid of stage.querySelectorAll('video')) vid.play().catch(() => {});
    stageKeys = keysNow;
    return renderControls();
  }
  C.camTile = null;
  if (!shown.length) {
    const grid = el('div', 'grid');
    const fresh = [];
    for (const m of members) {
      const isLive = m.key !== 'me' && m.voice?.streaming;
      const card = el('div', 'pcard' + (C.speaking.has(m.key) ? ' speaking' : '') + (isLive ? ' live-card' : ''));
      card.dataset.speak = m.key;
      card.dataset.uid = m.user.id;
      const cs = camOf(m);
      card.append(flagsEl(m.voice), cs ? camVideo(cs, m.key === 'me') : avatar(m.user.name, m.user.color, '', m.user.id), wrapEl('div', 'pc-name', nameEl(m.user.name + (m.key === 'me' ? ' (você)' : ''), m.user.color, m.user.id)));
      if (cs) {
        card.classList.add('cam');
        card.append(camMaxBtn(m.key));
        card.ondblclick = (e) => !e.target.closest('button') && setCamFocus(m.key);
      }
      if (m.peer) card.append(pingEl(m.key));
      if (isLive) card.append(watchBtn(m, 'primary sm watch-btn'));
      if (m.dj) {
        card.classList.add('dj-card');
        card.classList.toggle('speaking', djPlaying(c.id));
        if (m.dj.item) {
          card.style.setProperty('--dj-art', `url("${thumbOf(m.dj.item)}")`);
          card.append(el('div', 'pc-sub', (m.dj.paused ? 'Pausado · ' : '') + m.dj.item.title));
        } else card.append(el('div', 'pc-sub', 'Esperando a próxima…'));
      } else {
        const rSum = rpgOf(m.user.id);
        if (rSum) {
          const pill = el('div', 'pc-rpg' + (rSum.pv <= 0 ? ' danger' : ''));
          pill.append(icon('dices', 'sm'), el('span', '', rSum.pvm ? `${rSum.cn} · PV ${rSum.pv}/${rSum.pvm} · PM ${rSum.pm}/${rSum.pmm}` : 'Mestre da mesa'));
          card.append(pill);
        }
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
    for (const m of members) strip.append(memberThumb(m));
    stage.append(main, stripResizer(), strip);
    for (const vid of stage.querySelectorAll('video')) vid.play().catch(() => {});
  }
  stageKeys = keysNow;
  renderControls();
}

// quadrinho de quem está na call (embaixo do palco); quem tem câmera pode ser maximizado
function memberThumb(m) {
  const t = el('div', 'thumb' + (C.speaking.has(m.key) ? ' speaking' : ''));
  t.dataset.speak = m.key;
  t.dataset.uid = m.user.id;
  const cs = camOf(m);
  t.append(cs ? camVideo(cs, m.key === 'me') : avatar(m.user.name, m.user.color, '', m.user.id), Object.assign(el('div', 'tag'), { textContent: m.user.name }));
  if (cs) {
    t.classList.add('cam');
    t.append(camMaxBtn(m.key));
    t.onclick = (e) => !e.target.closest('button') && setCamFocus(m.key);
  }
  return t;
}
function camMaxBtn(key) {
  const b = el('button', 'cam-max');
  b.type = 'button';
  b.title = 'Maximizar a câmera';
  b.append(icon('maximize-2', 'sm'));
  b.onclick = (e) => {
    e.stopPropagation();
    setCamFocus(key);
  };
  return b;
}
function setCamFocus(key) {
  if (!key && document.fullscreenElement === C.camTile) document.exitFullscreen().catch(() => {});
  C.camFocus = key || null;
  renderStage();
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && C.camFocus && !document.fullscreenElement && !document.querySelector('dialog[open]')) setCamFocus(null);
});

// ----- painéis que mudam de tamanho (arrastando a borda; duplo clique volta ao padrão) -----
settings.layout = { ...settings.layout };
function applyLayout() {
  const app = $('#app');
  const L = settings.layout;
  if (isMobile) return;
  app.style.setProperty('--side-w', L.side ? L.side + 'px' : '');
  app.style.setProperty('--right-w', L.right ? L.right + 'px' : '');
  app.style.gridTemplateColumns = L.side || L.right ? `${L.side ? L.side + 'px' : 'var(--side-def, 300px)'} minmax(0, 1fr) ${L.right ? L.right + 'px' : 'var(--right-def, 320px)'}` : '';
  if (L.thumb) document.documentElement.style.setProperty('--thumb-h', L.thumb + 'px');
  else document.documentElement.style.removeProperty('--thumb-h');
}
function dragResize(handle, { rows, onMove, onReset }) {
  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    handle.classList.add('dragging');
    document.body.classList.add('resizing');
    document.body.classList.toggle('rows', !!rows);
    const move = (ev) => {
      onMove(ev);
      applyLayout();
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.classList.remove('dragging');
      document.body.classList.remove('resizing', 'rows');
      saveSettings();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up, { once: true });
    handle.addEventListener('pointercancel', up, { once: true });
  });
  handle.addEventListener('dblclick', () => {
    onReset();
    applyLayout();
    saveSettings();
  });
}
if (!isMobile) {
  const centerMin = 420;
  const sideH = el('div', 'resizer');
  sideH.title = 'Arraste para mudar a largura (duplo clique: padrão)';
  $('#side').append(sideH);
  dragResize(sideH, {
    onMove: (ev) => {
      const left = $('#side').getBoundingClientRect().left;
      const rightW = $('#right').getBoundingClientRect().width;
      settings.layout.side = Math.round(clamp(ev.clientX - left, 200, Math.min(520, innerWidth - rightW - centerMin)));
    },
    onReset: () => delete settings.layout.side,
  });
  const rightH = el('div', 'resizer');
  rightH.title = 'Arraste para mudar a largura (duplo clique: padrão)';
  $('#right').append(rightH);
  dragResize(rightH, {
    onMove: (ev) => {
      const r = $('#right').getBoundingClientRect().right;
      const sideW = $('#side').getBoundingClientRect().width;
      settings.layout.right = Math.round(clamp(r - ev.clientX, 260, Math.min(760, innerWidth - sideW - centerMin)));
    },
    onReset: () => delete settings.layout.right,
  });
  applyLayout();
}
// a fileira de baixo do palco (câmeras e streams pequenas): arraste para cima para aumentar
function stripResizer() {
  const h = el('div', 'strip-resizer');
  h.title = 'Arraste para mudar o tamanho dos quadrinhos (duplo clique: padrão)';
  dragResize(h, {
    rows: true,
    onMove: (ev) => {
      const stage = $('#stage').getBoundingClientRect();
      settings.layout.thumb = Math.round(clamp(stage.bottom - 18 - ev.clientY, 64, Math.max(80, stage.height * 0.55)));
    },
    onReset: () => delete settings.layout.thumb,
  });
  return h;
}

// ----- interface do PC (estilo TeamSpeak): barra de ferramentas em cima, barra de status embaixo -----
if (!isMobile) {
  $('#toolbar').hidden = false;
  $('#statusBar').hidden = false;
  $('#toolbar').prepend(...$('#controls').children); // os botões da call viram ferramentas
  $('#statusBar').prepend($('.tb-status'));
  $('#tbInvite').onclick = () => $('#btnInvite').click();
  $('#tbFriends').onclick = () => dm?.open();
  $('#tbServer').onclick = () => $('#btnServer').click();
  $('#tbSettings').onclick = () => $('#btnSettings').click();
  $('#tbAway').onclick = () => setStatus(myStatus() === 'idle' ? 'online' : 'idle');
}
function renderStatusBar() {
  if (isMobile) return;
  const c = C.ch && channel(C.ch);
  $('#sbVoice').textContent = c ? `Conectado em ${c.name}` : 'Fora da call';
  $('#sbVoice').classList.toggle('on', !!c);
  if (c) renderCallStatus();
  $('#sbPtt').hidden = !settings.ptt.vk;
  $('#sbPtt').textContent = settings.ptt.vk ? `Aperte para falar: ${settings.ptt.label}` : '';
  $('#tbAway').classList.toggle('on', myStatus() === 'idle');
}
function renderControls() {
  const inThis = callBtnLeaves();
  const call = $('#ctlCall');
  call.classList.toggle('leave', inThis);
  setIcon(call, inThis ? 'phone-off' : 'phone');
  call.querySelector('span').textContent = inThis ? (isMobile ? 'Sair' : 'Desconectar') : isMobile ? 'Entrar' : 'Conectar';
  call.disabled = !inThis && channel(S.view)?.type !== 'voice';
  call.title = call.disabled ? 'Abra um canal de voz para conectar' : '';
  renderStatusBar();
  const off = C.muted || C.deafened || (C.ch && !C.mic);
  const mute = $('#ctlMute');
  mute.classList.toggle('off', !!off);
  setIcon(mute, off ? 'mic-off' : 'mic');
  const deaf = $('#ctlDeafen');
  deaf.classList.toggle('off', C.deafened);
  setIcon(deaf, C.deafened ? 'headphone-off' : 'headphones');
  const cam = $('#ctlCam');
  cam.classList.toggle('on', !!C.cam);
  setIcon(cam, C.cam ? 'video' : 'video-off');
  cam.querySelector('span').textContent = C.cam ? 'Desligar' : 'Câmera';
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
  G3.ctl?.refresh();
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
  closeRoom();
  closeRpgSession(false);
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
  if ($('#btnPins')) $('#btnPins').hidden = !text;
}
addEventListener('focus', () => textChatCh() && markRead(textChatCh()));

// ============================================================ canais
let chDlgState = null;
function openChannelDialog(type, existing, catId) {
  if (!iCan(P.ManageChannel)) return toast('Você não tem permissão para mexer nos canais');
  chDlgState = { type, existing };
  $('#chDlgTitle').textContent = type === 'cat' ? (existing ? 'Editar categoria' : 'Nova categoria') : existing ? 'Editar canal' : type === 'text' ? 'Novo canal de texto' : 'Novo canal de voz';
  const sel = $('#chDlgCat');
  sel.replaceChildren(new Option('Sem categoria', ''), ...all('cat').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c) => new Option(c.name, c.id)));
  sel.value = (existing ? existing.cat : catId) || '';
  if (sel.selectedIndex < 0) sel.value = '';
  $('#chDlgCatWrap').hidden = type === 'cat';
  $('#chDlgName').value = existing?.name || '';
  $('#chDlgName').placeholder = type === 'text' ? 'ex.: memes' : 'ex.: Jogatina';
  $('#chDlgSave').textContent = existing ? 'Salvar' : 'Criar';
  $('#chDlgDelete').hidden = !existing;
  openDialog($('#channelDlg'));
  $('#chDlgName').focus();
}
$$('[data-add]').forEach((b) => (b.onclick = () => openChannelDialog(b.dataset.add)));
$('#btnAddCat').onclick = () => openChannelDialog('cat');
// soltar um canal no título "Canais de texto/voz" tira ele da categoria
for (const h of $$('#channels > .ch-head')) dropZone(h, null);
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
  const cat = $('#chDlgCat').value || null;
  if (type === 'cat') {
    if (existing) put({ ...existing, name: name.slice(0, 40) });
    else put({ k: 'cat', id: 'cat:' + randId(), name: name.slice(0, 40), order: Math.max(0, ...all('cat').map((c) => c.order ?? 0)) + 1 });
  } else if (existing) put({ ...existing, name: fixName(type, name), cat });
  else {
    const order = Math.max(0, ...all('ch').map((c) => c.order)) + 1;
    const id = 'c:' + randId();
    put({ k: 'ch', id, name: fixName(type, name), type, order, cat });
    if (type === 'text') openView(id);
  }
  closeDialog($('#channelDlg'));
};
// corpo com chaves: um "false" devolvido por onkeydown cancela a tecla (não dava para digitar)
$('#chDlgName').onkeydown = (e) => {
  if (e.key === 'Enter') $('#chDlgSave').click();
};
$('#chDlgDelete').onclick = () => {
  const c = chDlgState.existing;
  if (chDlgState.type === 'cat') {
    if (!confirm(`Apagar a categoria "${c.name}"? Os canais dela continuam, sem categoria.`)) return;
    put({ ...c, del: true });
    return closeDialog($('#channelDlg'));
  }
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
  renderEmojiAdmin();
  renderAdmin();
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
  if (!iCan(P.ManageServer)) return toast('Você não tem permissão para mudar o perfil do grupo');
  renderServerPreview();
  const g = grpRec();
  put({ ...g, k: 'grp', id: 'grp', name: srvDraft.name, desc: srvDraft.desc, icon: srvDraft.icon, banner: srvDraft.banner, color: srvDraft.color });
  closeDialog($('#serverDlg'));
  toast('Perfil do servidor salvo');
};
$('#groupName').onclick = $('#groupAvatar').onclick = $('#btnServer').onclick = openServerDialog;

// ----- moderação: expulsar (banimento com prazo) e banir -----
// ============================================================ trocar o código do grupo (ban de verdade)
// Quem pode banir sorteia um código novo e manda, cifrado com a chave X25519 de cada um, para quem não está
// banido. Cada PC abre a sua parte e muda de sala. O banido recebe o registro mas não consegue abrir.
// A sala antiga fica "escutando" por 14 dias só para entregar o aviso a quem estava offline.
async function rekeyGroup() {
  const users = knownUsers().filter((u) => u.id !== me.id && !banOf(u.id));
  const ok = users.filter((u) => dm?.dhOf(u.id));
  const left = users.filter((u) => !dm?.dhOf(u.id));
  const msg =
    `Trocar o código do grupo?\n\n${ok.length} pessoa(s) recebem o código novo automaticamente.` +
    (left.length ? `\n\nSem a versão nova (vão precisar de um convite novo): ${left.map((u) => u.name).join(', ')}` : '') +
    '\n\nQuem está banido fica de fora. O convite antigo para de funcionar.';
  if (!confirm(msg)) return;
  const key = newKey();
  const keys = {};
  for (const u of ok) keys[u.id] = await ident.seal(dm.dhOf(u.id), key);
  keys[me.id] = await ident.seal(ident.dhPublic, key);
  put({ k: 'rekey', id: 'rekey', keys, dh: ident.dhPublic, at: Date.now() });
}
let rekeying = false;
async function onRekey(r) {
  if (!r || r.del || rekeying || !r.keys?.[me.id] || typeof r.dh !== 'string') return;
  if (store.get('rekeyDone', {})[r.v]) return;
  const key = await ident.unseal(r.dh, r.keys[me.id]);
  if (!key || !parseCode(key) || key === R.key) return;
  rekeying = true;
  const done = store.get('rekeyDone', {});
  done[r.v] = 1;
  store.set('rekeyDone', done);
  const hash = (await sha256('toca-room:' + key)).slice(0, 40);
  await recsWrite(hash, [...recs.values()].filter((x) => x.k !== 'rekey')).catch(() => {});
  store.set('view:' + hash, S.view);
  const olds = store.get('oldRooms', []).filter((o) => o.until > Date.now() && o.hash !== R.hash);
  olds.push({ key: R.key, hash: R.hash, rec: r, until: Date.now() + 14 * 864e5 });
  store.set('oldRooms', olds);
  saveServers(servers().map((x) => (x.hash === R.hash ? { ...x, key, hash } : x)));
  R = { key, hash };
  store.set('room', R);
  if (C.ch) leaveVoice();
  toast('O grupo trocou de código. Reconectando…');
  setTimeout(() => location.reload(), 1500);
}
// sala antiga: só entrega o aviso do código novo para quem chega nela
function listenOldRooms() {
  const olds = store.get('oldRooms', []).filter((o) => o.until > Date.now());
  store.set('oldRooms', olds);
  for (const o of olds) {
    const r = joinRoom({ appId: 'toca-voice-p2p-v2', password: o.key, turnConfig: turnServers }, o.hash);
    const rc = r.makeAction('recs');
    r.makeAction('sum');
    r.onPeerJoin = (pid) => rc.send([o.rec], { target: pid });
  }
}
function banUser(user, ms) {
  put({ k: 'ban', id: 'ban:' + user.id, uid: user.id, name: user.name, ...(ms ? { until: Date.now() + ms } : {}), at: Date.now() });
  toast(ms ? `${user.name} foi expulso por 10 minutos` : `${user.name} foi banido`);
}
// fui banido/expulso: sai da call e mostra o aviso (os outros já ignoram o que eu mandar)
let bannedShown = false;
function checkBanned() {
  const b = banOf(me.id);
  if (!b || bannedShown) return;
  bannedShown = true;
  if (C.ch) leaveVoice();
  const box = el('div', 'banned-overlay');
  const card = el('div', 'banned-card');
  card.append(icon('ban'), el('h2', '', b.until ? 'Você foi expulso do grupo' : 'Você foi banido do grupo'));
  card.append(el('p', 'muted', b.until ? `Dá para voltar às ${hhmm.format(b.until)}.` : 'Quem tem permissão no grupo te baniu. Peça para alguém de lá se achar que foi engano.'));
  const leave = el('button', 'primary', 'Sair deste grupo');
  leave.onclick = () => $('#btnLeaveGroup').click();
  card.append(leave);
  if (b.until) setTimeout(() => location.reload(), Math.max(1000, b.until - Date.now() + 1000));
  box.append(card);
  document.body.append(box);
}
// quem já apareceu no grupo (online agora ou que escreveu): para a lista de membros da administração
function knownUsers() {
  const map = new Map();
  for (const m of all('msg')) if (!m.bot && m.uid && !map.has(m.uid)) map.set(m.uid, { id: m.uid, name: m.name, color: m.color });
  for (const m of all('msg').sort((a, b) => a.ts - b.ts)) if (!m.bot && m.uid) map.set(m.uid, { id: m.uid, name: m.name, color: m.color });
  for (const p of peers.values()) if (p.user && !p.user.fake) map.set(p.user.id, { id: p.user.id, name: p.user.name, color: p.user.color });
  map.set(me.id, { id: me.id, name: me.name, color: me.color });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
let roleEditing = null;
function renderAdmin() {
  const box = $('#srvAdmin');
  if (!box) return;
  const owner = groupOwner();
  const ownerName = owner && knownUsers().find((u) => u.id === owner)?.name;
  const parts = [];
  const sec = (title, hint) => {
    const s = el('div', 'adm-sec');
    s.append(el('h3', 'srv-sec', title));
    if (hint) s.append(el('p', 'muted small', hint));
    parts.push(s);
    return s;
  };
  // dono
  const so = sec('Dono do grupo', owner ? '' : 'Este grupo ainda não tem dono: todo mundo pode tudo, como antes. Quem está no grupo desde a primeira semana pode reivindicar.');
  if (owner) {
    so.append(el('p', '', `Dono: ${ownerName || 'alguém fora do ar'}`));
    if (owner === me.id) {
      const sel = el('select');
      sel.append(new Option('Passar a coroa para…', ''), ...knownUsers().filter((u) => u.id !== me.id).map((u) => new Option(u.name, u.id)));
      sel.onchange = () => {
        const u = knownUsers().find((x) => x.id === sel.value);
        if (u && confirm(`Passar o grupo para ${u.name}? Você deixa de ser o dono.`)) put({ ...grpRec(), owner: u.id });
        sel.value = '';
      };
      so.append(sel);
    }
  } else if (canClaimOwner(me.id)) {
    const b = el('button', 'primary sm');
    b.type = 'button';
    b.append(icon('crown', 'sm'), document.createTextNode('Reivindicar o grupo'));
    b.onclick = () => confirm('Virar o dono deste grupo? Depois disso só quem tiver permissão pode mexer em canais, cargos etc.') && put({ ...grpRec(), owner: me.id });
    so.append(b);
  }
  if (canToggleServerRpg()) {
    const rpgRow = el('div', 'adm-rpg-row');
    const rpgInfo = el('div', 'adm-rpg-info');
    rpgInfo.append(
      el('b', '', 'Mesa de RPG (d2Trinities)'),
      el('span', 'muted small', isRpgEnabled() ? 'Aberta neste servidor: você é o Mestre.' : 'Fechada. Só o dono do servidor abre a mesa, e vira o Mestre.'),
    );
    const rpgBtn = el('button', (isRpgEnabled() ? 'ghost' : 'primary') + ' sm');
    rpgBtn.type = 'button';
    rpgBtn.id = 'admRpgToggleBtn';
    rpgBtn.append(icon('dices', 'sm'), document.createTextNode(isRpgEnabled() ? 'Encerrar a mesa' : 'Abrir a mesa'));
    rpgBtn.onclick = () => setServerRpg(!isRpgEnabled());
    rpgRow.append(rpgInfo, rpgBtn);
    so.append(rpgRow);
  }
  if (!owner) {
    box.replaceChildren(...parts);
    return;
  }
  // permissões de todos
  const se = sec('Permissões de todos', 'O que qualquer pessoa do grupo pode fazer (os cargos somam a isso).');
  const evPerms = everyonePerms();
  const canPerm = iCan(P.ManagePermissions);
  const grid = el('div', 'perm-grid');
  for (const [bit, label] of PERM_LABELS) {
    if ([P.ManageRole, P.ManagePermissions, P.ManageServer, P.BanMembers, P.KickMembers].includes(bit)) continue;
    const l = el('label', 'check');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = (evPerms & bit) === bit;
    cb.disabled = !canPerm;
    cb.onchange = () => put({ ...grpRec(), perms: cb.checked ? everyonePerms() | bit : everyonePerms() & ~bit });
    l.append(cb, document.createTextNode(' ' + label));
    grid.append(l);
  }
  se.append(grid);
  // cargos
  const sr = sec('Cargos', 'Do mais alto para o mais baixo. Quem tem um cargo só mexe nos cargos abaixo do seu.');
  const canRoles = iCan(P.ManageRole);
  for (const r of roleList()) {
    const row = el('div', 'role-row');
    const dot = el('span', 'role-dot');
    dot.style.background = cleanHex(r.color) || '#8a8f98';
    const count = all('mem').filter((m) => Array.isArray(m.roles) && m.roles.includes(r.id)).length;
    row.append(dot, el('b', '', r.name), el('span', 'muted small', `${count} ${count === 1 ? 'pessoa' : 'pessoas'}`));
    if (canRoles && (owner === me.id || rankOf(me.id) < (r.order ?? 0))) {
      const ed = el('button', 'ghost sm', roleEditing === r.id ? 'Fechar' : 'Editar');
      ed.type = 'button';
      ed.onclick = () => {
        roleEditing = roleEditing === r.id ? null : r.id;
        renderAdmin();
      };
      row.append(ed);
    }
    sr.append(row);
    if (roleEditing === r.id) sr.append(roleEditor(r));
  }
  if (canRoles) {
    const add = el('button', 'ghost sm');
    add.type = 'button';
    add.append(icon('plus', 'sm'), document.createTextNode('Novo cargo'));
    add.onclick = () => {
      const order = Math.max(rankOf(me.id) + 1, ...all('role').map((r) => (r.order ?? 0) + 1));
      const id = 'role:' + randId(6);
      put({ k: 'role', id, name: 'Novo cargo', color: '#3aa8f0', perms: 0, order, hoist: true });
      roleEditing = id;
    };
    sr.append(add);
  }
  // membros
  const sm = sec('Membros', 'Marque os cargos de cada um. Quem tem permissão também expulsa ou bane pelo perfil da pessoa.');
  for (const u of knownUsers()) {
    if (banOf(u.id)) continue;
    const row = el('div', 'mem-row');
    row.append(avatar(u.name, u.color, 'xs', u.id), nameEl(u.name, u.color, u.id));
    if (u.id === owner) row.append(icon('crown', 'owner-crown'));
    const chips = el('div', 'mem-roles');
    const cur = recs.get('mem:' + u.id);
    const have = new Set(cur && !cur.del ? cur.roles || [] : []);
    for (const r of roleList()) {
      const can2 = canRoles && (owner === me.id || rankOf(me.id) < (r.order ?? 0)) && (u.id === me.id || outranks(me.id, u.id));
      const l = el('label', 'role-toggle');
      l.style.setProperty('--rc', cleanHex(r.color) || '#8a8f98');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.checked = have.has(r.id);
      cb.disabled = !can2;
      cb.onchange = () => {
        const next = new Set(have);
        cb.checked ? next.add(r.id) : next.delete(r.id);
        put({ k: 'mem', id: 'mem:' + u.id, uid: u.id, roles: [...next] });
      };
      l.append(cb, document.createTextNode(' ' + r.name));
      chips.append(l);
    }
    row.append(chips);
    sm.append(row);
  }
  // banidos
  const bans = all('ban').filter((b) => !b.until || b.until > Date.now());
  if (bans.length) {
    const sb = sec('Banidos e expulsos');
    if (iCan(P.BanMembers) && bans.some((b) => !b.until)) {
      const p = el('p', 'muted small', 'No P2P, quem tem o código do grupo ainda consegue entrar na sala (só não vê nada do que vocês fazem). Para tirar de vez, troque o código: quem não está banido recebe o novo sozinho.');
      const rk = el('button', 'ghost sm danger-text');
      rk.type = 'button';
      rk.append(icon('refresh', 'sm'), document.createTextNode('Trocar o código do grupo'));
      rk.onclick = rekeyGroup;
      sb.append(p, rk);
    }
    for (const b of bans) {
      const row = el('div', 'mem-row');
      row.append(el('span', '', b.name || b.uid), el('span', 'muted small', b.until ? `expulso até ${hhmm.format(b.until)}` : 'banido'));
      if (iCan(P.BanMembers) || (b.until && iCan(P.KickMembers))) {
        const un = el('button', 'ghost sm', 'Desfazer');
        un.type = 'button';
        un.onclick = () => put({ ...b, del: true });
        row.append(un);
      }
      sb.append(row);
    }
  }
  box.replaceChildren(...parts);
}
function roleEditor(r) {
  const box = el('div', 'role-editor');
  const name = el('input');
  name.value = r.name;
  name.maxLength = 32;
  const color = el('input');
  color.type = 'color';
  color.value = cleanHex(r.color) || '#3aa8f0';
  const hoist = el('label', 'check');
  const hcb = el('input');
  hcb.type = 'checkbox';
  hcb.checked = !!r.hoist;
  hoist.append(hcb, document.createTextNode(' Separar na lista de pessoas'));
  const grid = el('div', 'perm-grid');
  const boxes = PERM_LABELS.map(([bit, label]) => {
    const l = el('label', 'check');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = ((r.perms | 0) & bit) === bit;
    cb.disabled = groupOwner() !== me.id && !iCan(bit); // não dá para dar o que você não tem
    l.append(cb, document.createTextNode(' ' + label));
    grid.append(l);
    return [bit, cb];
  });
  const save = el('button', 'primary sm', 'Salvar cargo');
  save.type = 'button';
  save.onclick = () => {
    const perms = boxes.reduce((p, [bit, cb]) => (cb.checked ? p | bit : p), 0);
    put({ ...r, name: cleanName(name.value) || r.name, color: color.value, hoist: hcb.checked, perms });
    roleEditing = null;
    renderAdmin();
  };
  const up = el('button', 'ghost sm', '↑ Subir');
  up.type = 'button';
  up.onclick = () => {
    const list = roleList();
    const i = list.findIndex((x) => x.id === r.id);
    const above = list[i - 1];
    if (above && (groupOwner() === me.id || rankOf(me.id) < (above.order ?? 0))) {
      put({ ...above, order: r.order });
      put({ ...r, order: above.order });
    }
  };
  const del = el('button', 'ghost sm danger-text', 'Apagar cargo');
  del.type = 'button';
  del.onclick = () => {
    if (!confirm(`Apagar o cargo "${r.name}"?`)) return;
    put({ ...r, del: true });
    roleEditing = null;
  };
  box.append(wrapEl('div', 'role-ed-row', name, color), hoist, grid, wrapEl('div', 'role-ed-row', save, up, del));
  return box;
}

// ----- emojis do grupo: qualquer um adiciona; quem adicionou apaga -----
function renderEmojiAdmin() {
  const list = $('#srvEmojis');
  if (!list) return;
  $('#srvEmoAdd').disabled = !iCan(P.ManageCustomisation);
  const items = [...emojiMap().values()].sort((a, b) => a.name.localeCompare(b.name));
  list.replaceChildren(
    ...items.map((e) => {
      const row = el('div', 'emo-row');
      const img = el('img', 'cemoji');
      img.dataset.file = e.file;
      img.dataset.owner = e.by;
      row.append(img, el('code', '', `:${e.name}:`), el('span', 'muted small', 'por ' + (e.addedBy || '?')));
      if (e.by === me.id) {
        const del = el('button', 'icon-btn sm danger');
        del.type = 'button';
        del.title = 'Apagar emoji';
        del.append(icon('trash-2', 'sm'));
        del.onclick = () => put({ ...e, del: true });
        row.append(del);
      }
      return row;
    }),
  );
  if (!items.length) list.append(el('p', 'muted small', 'Nenhum emoji ainda. Use :nome: no chat depois de adicionar.'));
  hydrateEmojis(list);
}
$('#srvEmoAdd').onclick = () => {
  const name = $('#srvEmoName').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!EMO_NAME.test(name)) return toast('Nome do emoji: 2 a 32 letras, números ou _');
  if (emojiMap().has(name)) return toast(`Já existe :${name}:`);
  $('#srvEmoFile').click();
};
$('#srvEmoFile').onchange = async () => {
  const file = $('#srvEmoFile').files[0];
  $('#srvEmoFile').value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast('Escolha uma imagem (PNG, GIF ou WebP)');
  if (file.size > 512 * 1024) return toast('O emoji passa de 512 KB');
  const name = $('#srvEmoName').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const id = 'f:' + randId(12);
  await blobPut(id, file);
  put({ k: 'emo', id: 'e:' + randId(), name, file: id, addedBy: me.name, at: Date.now() });
  $('#srvEmoName').value = '';
  toast(`Emoji :${name}: adicionado`);
};

// ----- mensagens fixadas do canal (botão no topo) -----
function openPins(anchor) {
  const ch = S.view;
  const list = all('pin')
    .filter((p) => p.ch === ch && recs.get(p.msg) && !recs.get(p.msg).del)
    .sort((a, b) => b.at - a.at);
  const box = el('div', 'pins-pop');
  box.append(el('div', 'pins-head', `Fixadas em #${channel(ch)?.name || ''}`));
  if (!list.length) box.append(el('p', 'muted small', 'Nenhuma mensagem fixada. Passe o mouse numa mensagem e clique no alfinete.'));
  for (const p of list) {
    const m = recs.get(p.msg);
    const row = el('div', 'pin-row');
    const top = el('div', 'pin-top');
    top.append(nameEl(m.bot && !m.via ? 'DJ' : m.name, m.color, m.bot && !m.via ? null : m.uid), el('time', 'muted small', fullTime.format(m.ts)));
    const text = el('div', 'pin-text');
    text.innerHTML = format(String(m.text || (m.att?.length ? '[anexo]' : '')).slice(0, 300));
    hydrateEmojis(text);
    const go = el('button', 'ghost sm', 'Ir até ela');
    go.type = 'button';
    go.onclick = () => {
      pop.hidden = true;
      jumpTo(m.id);
    };
    const un = el('button', 'icon-btn sm');
    un.type = 'button';
    un.title = 'Desafixar';
    un.append(icon('pin-off', 'sm'));
    un.onclick = () => {
      put({ ...p, del: true });
      row.remove();
    };
    row.append(top, text, wrapEl('div', 'pin-actions', go, un));
    box.append(row);
  }
  openPopover(anchor, box);
}
{
  const b = el('button', 'icon-btn');
  b.type = 'button';
  b.id = 'btnPins';
  b.title = 'Mensagens fixadas';
  b.append(icon('pin'));
  b.onclick = () => openPins(b);
  $('#btnChatSearch').before(b);
}

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
$('#btnFriends').onclick = () => dm?.open();

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
  fill($('#stCam'), 'videoinput', settings.cam || '');
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
  $('#stImpact').checked = g.impact !== false;
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
  for (const set of [testStream?.setGate, C.micSetGate]) set?.(settings.gate);
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
$('#stImpact').onchange = () => {
  settings.gate.impact = $('#stImpact').checked;
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
  syncNetUi();
  renderPttKey();
  renderSfxFiles();
  $('#stSfxVol').value = Math.round((settings.sfxVol ?? 0.8) * 100);
  $('#stSfxVal').textContent = $('#stSfxVol').value + '%';
  $('#stHotkeys').checked = desktopPrefs.hotkeys;
  $('#stTray').checked = desktopPrefs.tray;
  $('#stAutostart').checked = desktopPrefs.autostart;
  await fillDevices();
  if (!$('#settingsDlg').open) openDialog($('#settingsDlg'));
  showStPage(page);
}
$('#btnSettings').onclick = () => openSettings(stPage === 'voice' ? 'voice' : 'profile');
$('#stMic').onchange = $('#stNoise').onchange = $('#stEcho').onchange = $('#stHear').onchange = startMicTest;
$('#stNetMode')?.addEventListener('change', () => setNetMode($('#stNetMode').value));
$('#stAntiPing')?.addEventListener('change', () => setAntiPing($('#stAntiPing').checked));
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
  settings.cam = $('#stCam').value;
  settings.noise = $('#stNoise').value;
  settings.echo = $('#stEcho').checked;
  settings.sounds = $('#stSounds').checked;
  if ($('#stNetMode')) setNetMode($('#stNetMode').value, false);
  if ($('#stAntiPing')) setAntiPing($('#stAntiPing').checked, false);
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
  renderNoiseBtn();
  if (micChanged) await restartMic();
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
// estilo: "Bolha" (cantos redondos, balões e animações com mola) ou "Clássico" (o visual de antes)
$('#lkStyle').onchange = () => {
  look.style = $('#lkStyle').value;
  saveSettings();
  applyLook();
};
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
  b.classList.toggle('style-bolha', look.style !== 'classico');
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
  $('#lkRoom').checked = look.room !== false;
  $('#lkStyle').value = look.style === 'classico' ? 'classico' : 'bolha';
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
// v1.12: liga todos os plugins de uma vez para todo mundo (uma vez só; depois cada um desliga o que quiser)
if ((settings.pluginsVersion || 0) < 2) {
  for (const p of BUILTIN_PLUGINS) settings.plugins[p.id] = true;
  settings.pluginsVersion = 2;
  saveSettings();
}
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

$('#btnLeaveGroup').onclick = async () => {
  if (!confirm('Sair deste servidor? Você vai precisar do código de convite para voltar.')) return;
  leaveVoice();
  room?.leave();
  await recsDrop(R.hash);
  const rest = servers().filter((x) => x.hash !== R.hash);
  saveServers(rest);
  if (rest[0]) store.set('room', { key: rest[0].key, hash: rest[0].hash });
  else store.del('room');
  store.del('rejoin');
  location.reload();
};

// barra de título
if (isDesktop) {
  $$('[data-win]').forEach((b) => (b.onclick = () => window.desk.win(b.dataset.win)));
} else $('#winButtons').hidden = true;

// atualização automática: o app baixa sozinho; aqui só oferece reiniciar
// ----- atualização obrigatória -----
// Saiu versão nova: o app trava numa tela que só sai atualizando. No PC baixa e reinicia sozinho;
// no celular o Android exige que a pessoa toque para instalar o .apk.
const verNewer = (a, b) => {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
};
// um amigo apareceu numa versão mais nova: só avisa (uma vez por versão); atualizar é quando a pessoa quiser
const askedFor = new Set();
function checkFriendVersion(ver) {
  if (typeof ver !== 'string' || !/^\d+\.\d+\.\d+$/.test(ver) || !appVersion || !verNewer(ver, appVersion) || askedFor.has(ver) || !window.desk?.checkUpdate) return;
  askedFor.add(ver);
  toast(`Um amigo está na versão ${ver}. Para atualizar, clique no ícone ↻ lá em cima quando quiser.`);
}
let updVersion = '';
let updState = ''; // '' | 'available' (tem versão nova) | 'downloading' | 'ready' (baixada, falta reiniciar)
function showUpdate(version) {
  updVersion = version;
  updState = 'ready';
  $('#tbUpdate').hidden = false;
  $('#tbUpdate').classList.remove('avail');
  $('#tbUpdateText').textContent = isMobile ? `Baixar a versão ${version}` : `Reiniciar para a ${version}`;
}
// tem versão nova: só avisa; baixa quando a pessoa clicar
function showAvailable(version) {
  if (!version || updState === 'ready' || updState === 'downloading') return;
  const first = updState !== 'available' || updVersion !== version;
  updVersion = version;
  updState = 'available';
  $('#tbUpdate').hidden = false;
  $('#tbUpdate').classList.add('avail');
  $('#tbUpdateText').textContent = `Atualizar para a ${version}`;
  if (first) toast(`Tem uma versão nova do janja (${version}). Clique em "Atualizar" lá em cima quando quiser.`);
}
$('#tbUpdate').onclick = async () => {
  if (updState === 'available' && window.desk?.downloadUpdate) {
    updState = 'downloading';
    $('#tbUpdateText').textContent = 'Baixando…';
    try {
      await window.desk.downloadUpdate();
    } catch (err) {
      updState = 'available';
      $('#tbUpdateText').textContent = `Atualizar para a ${updVersion}`;
      toast('Não consegui baixar a atualização: ' + ipcError(err));
    }
    return;
  }
  if (updState === 'downloading') return;
  if (!isMobile && C.ch && !confirm('O app vai reiniciar para atualizar e te colocar de volta na call. Atualizar agora?')) return;
  keepRejoin = true;
  saveRejoin();
  if (isMobile) toast('Baixando… quando terminar, abra o arquivo para instalar por cima');
  window.desk?.installUpdate();
};
// o app procura sozinho ao abrir (só avisa); este botão procura na hora
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
    } else if (r.status === 'available') {
      showAvailable(r.version);
      setUpdStatus(`Versão ${r.version} disponível: clique em Atualizar lá em cima`);
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
// ícone de atualização na barra de título: sempre à mão, sem abrir as configurações
if (window.desk?.checkUpdate) {
  const tb = $('#tbCheckUpdate');
  tb.hidden = false;
  tb.onclick = async () => {
    if (tb.classList.contains('busy')) return;
    tb.classList.add('busy');
    toast('Procurando atualizações…');
    try {
      const r = await checkUpdateNow();
      if (r?.status === 'latest') toast(`Você já está na versão mais nova${appVersion ? ` (${appVersion})` : ''}`);
      else if (r?.status === 'downloading') toast(`Baixando a versão ${r.version}…`);
      else if (r?.status === 'available') toast(`Versão ${r.version} disponível: clique em "Atualizar" lá em cima`);
      else if (r?.status === 'dev') toast('Modo de desenvolvimento: sem atualizações');
      else if (!r) toast('Não consegui procurar atualizações agora');
    } finally {
      tb.classList.remove('busy');
    }
  };
}

let desktopPrefs = { tray: true, hotkeys: true, autostart: false };
if (window.desk?.appInfo) {
  $$('[data-desk]').forEach((e) => (e.hidden = false));
  window.desk.onUpdateReady((v) => showUpdate(v));
  window.desk.onUpdateAvailable?.((v) => showAvailable(v));
  window.desk.onUpdateProgress((pct) => {
    setUpdStatus(`Baixando atualização… ${pct}%`);
    if (updState === 'downloading') $('#tbUpdateText').textContent = `Baixando… ${pct}%`;
  });
  window.desk.onUpdateReady((v) => toast(`Versão ${v} baixada. Clique em "Reiniciar" lá em cima quando quiser.`));
  window.desk.onUpdateError?.((msg) => {
    if (updState !== 'downloading') return;
    updState = 'available';
    $('#tbUpdateText').textContent = `Atualizar para a ${updVersion}`;
    toast('Não consegui baixar a atualização: ' + msg);
  });
  window.desk.appInfo().then(({ version, updateReady, updateAvail, google, prefs }) => {
    appVersion = version;
    $('#appVersion').textContent = `janjahaters v${version}`;
    $('#sbVersion').textContent = `v${version}`;
    $$('[data-google]').forEach((e) => (e.hidden = !google));
    if (prefs) desktopPrefs = prefs;
    if (updateReady) showUpdate(updateReady);
    else if (updateAvail) showAvailable(updateAvail);
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
    peer && menuItem('Cutucar', 'bell-ring', () => openPoke(user)),
    peer?.voice && C.ch && peer.voice.ch !== C.ch && menuItem('Trazer para o meu canal', 'arrow-down-to-line', () => moveUser(user, C.ch)),
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
  renderStatusBar();
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
  else put({ k: 'rx', id, msg: m.id, ch: m.ch, emoji: String(emoji).slice(0, /^:[a-z0-9_]{2,32}:$/.test(emoji) ? 34 : 16), uid: me.id, name: me.name, at: Date.now() });
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
    const ce = /^:([a-z0-9_]{2,32}):$/.exec(emoji);
    const e = ce && emojiMap().get(ce[1]);
    const face = el('span', 'rx-e', e ? '' : emoji);
    if (e) {
      const img = el('img', 'cemoji');
      img.dataset.file = e.file;
      img.dataset.owner = e.by;
      img.alt = emoji;
      face.append(img);
      hydrateEmojis(face);
    }
    b.append(face, el('span', 'rx-n', String(list.length)));
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
    for (const node of $$(`.reactions[data-rx="${id}"]`)) {
      if (!m) continue;
      const before = new Map([...node.querySelectorAll('.rx:not(.rx-add)')].map((b) => [b.title + b.textContent, true]));
      const next = reactionsEl(m);
      node.replaceWith(next);
      // só a reação que mudou dá o pulinho
      const changed = [...next.querySelectorAll('.rx:not(.rx-add)')].filter((b) => !before.has(b.title + b.textContent));
      if (changed.length) springIn(changed);
    }
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
// ============================================================ sala de games (room.js)
// Uma sala 3D (sofá, TV, puffs, fliperama) com um boneco de cada um do grupo, andando com WASD.
// O three.js vem num arquivo à parte (room.bundle.js) que só carrega quando alguém abre a sala, e a sala é
// desmontada (memória e placa de vídeo liberadas) quando você sai dela. Desligada em Aparência, nem aparece.
const G3 = { ctl: null, loading: null, preview: null, open: false };
const roomOn = () => look.room !== false;
function myFig() {
  return cleanFig(store.get('fig', null), me.color, me.id);
}
function loadRoom() {
  if (window.JanjaRoom) return Promise.resolve(window.JanjaRoom);
  return (G3.loading ||= new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = 'room.bundle.js';
    s.onload = () => ok(window.JanjaRoom);
    s.onerror = () => {
      G3.loading = null;
      no(new Error('não carregou a sala'));
    };
    document.head.append(s);
  }));
}
const roomPeople = () =>
  [...peers.values()]
    .filter((p) => p.user && p.user.verified && !p.user.bot && !banOf(p.user.id))
    .map((p) => ({ key: p.pid, uid: p.user.id, name: p.user.name, color: p.user.color, fig: p.user.fig, speaking: C.speaking.has(p.pid), pos: p.roomPos }));
const roomApi = {
  me: () => ({ uid: me.id, name: me.name || 'Eu', color: me.color, fig: myFig(), speaking: C.speaking.has('me') }),
  people: roomPeople,
  sendPos: (st) => A.pos?.send(st),
  tv() {
    if (!C.ch) return null;
    const { pb, item } = pbOf(C.ch);
    return item ? { title: item.title, artist: item.artist, thumb: thumbOf(item), playing: pb.pausedAt == null } : null;
  },
  sendAct: (ev) => A.pvp?.send(ev),
  selfId: () => selfId,
  onPvp(on, kills, mobs = 0) {
    $('#roomPvp').classList.toggle('on', on);
    $('#roomHint').hidden = on;
    $('#pvpHint').hidden = !on;
    $('#pvpPad').hidden = !on;
    $('#pvpKills').textContent = kills;
    $('#pvpMobs').textContent = mobs;
  },
  openArsenal: () => openFigEditor(),
  // projetor: a live que estou assistindo na call (ou a minha), e quem está transmitindo
  live() {
    if (!C.ch) return null;
    const inCall = [...peers.values()].filter((p) => p.voice?.ch === C.ch && p.user);
    const streamers = inCall.filter((p) => p.voice.streaming).map((p) => ({ key: p.pid, name: p.user.name }));
    const watched = inCall.filter((p) => p.media.screen);
    const cur = watched.find((p) => p.pid === C.focus) || watched[0];
    if (cur) return { key: cur.pid, name: cur.user.name, stream: cur.media.screen, streamers };
    if (C.screen) return { key: 'me', name: me.name, stream: C.screen, streamers };
    return { streamers };
  },
  watch: (pid) => peers.has(pid) && watchStream(pid),
  // perto do telão: botões para escolher a stream e ampliar
  onScreen(info) {
    G3.screen = info;
    const bar = $('#screenBar');
    const st = info?.streamers || [];
    bar.hidden = !st.length;
    if (!bar.hidden) {
      const chips = st.map((x) => {
        const b = el('button', 'chip' + (x.key === info.key ? ' on' : ''), x.name);
        b.type = 'button';
        b.title = 'Ver a tela de ' + x.name;
        b.onclick = () => watchStream(x.key);
        return b;
      });
      const big = el('button', 'chip big');
      big.type = 'button';
      big.append(icon('maximize', 'sm'), document.createTextNode('Ampliar'));
      big.onclick = () => openLiveBig();
      bar.replaceChildren(el('span', 'sb-title', 'Telão'), ...chips, big);
    }
    if (!$('#liveBig').hidden) openLiveBig();
  },
  // telão do chat: últimas mensagens do chat da call
  chat() {
    const ch = callChatCh();
    const c = ch ? channel(ch) : null;
    const plain = (m) => {
      let t = String(m.text || '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_~`|>#]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (m.att?.length) t = (t ? t + ' ' : '') + '📎';
      return t || '…';
    };
    const msgs = ch
      ? all('msg')
          .filter((m) => m.ch === ch && !m.del)
          .sort((a, b) => a.ts - b.ts)
          .slice(-10)
          .map((m) => ({ id: m.id, name: m.name || '?', color: m.color, text: plain(m) }))
      : [];
    return { title: c ? 'Chat de ' + c.name : 'Chat da call', msgs };
  },
};
// live em tamanho grande por cima do acampamento (com a troca de stream em cima)
function openLiveBig() {
  const live = roomApi.live();
  const box = $('#liveBig');
  if (!live?.stream) {
    box.hidden = true;
    return toast(live?.streamers?.length ? 'Clique num nome no telão para começar a assistir' : 'Ninguém está transmitindo agora');
  }
  box.hidden = false;
  const v = $('#liveBigVideo');
  if (v.srcObject !== live.stream) v.srcObject = live.stream;
  v.play().catch(() => {});
  $('#liveBigTitle').textContent = live.name ? 'Tela de ' + live.name : 'Live';
}
$('#liveBigClose').onclick = () => {
  $('#liveBig').hidden = true;
  $('#liveBigVideo').srcObject = null;
};
// golpes, tiros e parry de quem está no PvP (quem apanha é quem decide; aqui só confere o formato)
function onRoomAct(d, pid) {
  const p = peers.get(pid);
  if (!G3.ctl || !p?.user?.verified || !d || typeof d.t !== 'string') return;
  const num = (v) => typeof v === 'number' && Number.isFinite(v);
  const who = (v) => (v === selfId ? 'me' : typeof v === 'string' ? v.slice(0, 40) : '');
  const ev = { t: d.t };
  if (d.t === 'atk' || d.t === 'shot') {
    if (!num(d.x) || !num(d.z) || !num(d.r) || typeof d.w !== 'string') return;
    Object.assign(ev, { x: d.x, z: d.z, r: d.r, w: d.w.slice(0, 12) });
    if (d.t === 'shot') {
      if (!Number.isInteger(d.n) || d.n < 0) return;
      ev.n = d.n;
    }
  } else if (d.t === 'hit') {
    if (!num(d.hp)) return;
    Object.assign(ev, { by: who(d.by), hp: Math.max(0, Math.min(100, d.hp)), ko: !!d.ko, dmg: num(d.dmg) ? Math.max(0, Math.min(60, Math.round(d.dmg))) : 20 });
    if (Number.isInteger(d.pn)) ev.pn = d.pn;
  } else if (d.t === 'pry') {
    ev.to = who(d.to);
    if (Number.isInteger(d.pn)) Object.assign(ev, { pn: d.pn, ranged: true });
  } else if (d.t === 'mob') {
    // estado dos monstros (de quem controla): [id, tipo, x, z, r, vida, estado]
    if (!Array.isArray(d.l) || d.l.length > 12) return;
    ev.l = d.l.filter((m) => Array.isArray(m) && m.length === 7 && m.every(num) && Number.isInteger(m[0]) && m[1] >= 0 && m[1] <= 2).map((m) => [m[0], m[1] | 0, m[2], m[3], m[4], Math.max(0, Math.min(200, m[5])), m[6] | 0]);
  } else if (d.t === 'matk') {
    if (!Number.isInteger(d.id) || !num(d.x) || !num(d.z) || !num(d.r)) return;
    Object.assign(ev, { id: d.id, x: d.x, z: d.z, r: d.r });
  } else if (d.t === 'mhit') {
    if (!Number.isInteger(d.id) || !num(d.dmg)) return;
    Object.assign(ev, { id: d.id, dmg: Math.max(0, Math.min(60, Math.round(d.dmg))), ...(num(d.slow) ? { slow: Math.min(3, d.slow) } : {}) });
  } else if (d.t === 'mdie') {
    if (!Number.isInteger(d.id)) return;
    Object.assign(ev, { id: d.id, by: who(d.by) });
  } else if (d.t !== 'grd') return;
  G3.ctl.handleAct(pid, ev);
}
function onRoomPos(d, pid) {
  const st = cleanPos(d);
  const p = peers.get(pid);
  if (!st || !p?.user?.verified) return;
  p.roomPos = st;
  G3.ctl?.handlePos(pid, st);
}
function roomBubble(m) {
  if (m.bot || typeof m.text !== 'string' || !m.text.trim()) return;
  const key = m.uid === me.id ? 'me' : [...peers.values()].find((p) => p.user?.id === m.uid)?.pid;
  if (key) G3.ctl.bubble(key, m.text.replace(/\s+/g, ' ').trim()); // junta espaços e quebras de linha
}
async function openRoom(edit) {
  if (!roomOn()) return;
  closeRpgSession(false);
  setPane('center');
  $('#textView').hidden = true;
  $('#voiceView').hidden = true;
  $('#roomView').hidden = false;
  $('#viewHead').hidden = true;
  G3.open = true;
  $('#roomLoading').hidden = !!G3.ctl;
  try {
    const R3 = await loadRoom();
    if (!G3.open) return;
    if (!G3.ctl) G3.ctl = R3.mount($('#roomStage'), roomApi);
    $('#roomLoading').hidden = true;
    $('#roomStage canvas')?.focus();
    if (edit) openFigEditor();
  } catch (err) {
    console.warn('sala', err);
    toast('Não deu para abrir o acampamento');
    closeRoom(true);
  }
}
function closeRoom(back) {
  if (!G3.open) return;
  G3.open = false;
  closeFigEditor();
  G3.ctl?.destroy();
  G3.ctl = null;
  roomApi.onPvp(false, 0, 0);
  roomApi.onScreen(null);
  $('#liveBigClose').click();
  $('#roomView').hidden = true;
  $('#viewHead').hidden = false;
  if (back) openView(S.view);
}
// editor do boneco: escolhe e já aparece na sala e na prévia girando
function openFigEditor() {
  const box = $('#figEditor');
  box.hidden = false;
  const f = myFig();
  const chips = (key, list) => {
    $('#fig-' + key).replaceChildren(
      ...list.map(([id, label]) => {
        const b = el('button', 'chip' + (f[key] === id ? ' on' : ''), label);
        b.type = 'button';
        b.onclick = () => setFig({ [key]: id });
        return b;
      }),
    );
  };
  const swatches = (key, list) => {
    $('#fig-' + key).replaceChildren(
      ...list.map((c) => {
        const b = el('button', 'swatch' + (f[key] === c ? ' on' : ''));
        b.type = 'button';
        b.style.background = c;
        b.title = c;
        b.onclick = () => setFig({ [key]: c });
        return b;
      }),
    );
  };
  swatches('skin', FIG.skin);
  chips('hair', FIG.hair);
  swatches('hairColor', FIG.hairColor);
  chips('eyes', FIG.eyes);
  chips('acc', FIG.acc);
  chips('wp', FIG.wp);
  const sh = $('#fig-sh');
  sh.checked = !!f.sh;
  sh.disabled = !ONE_HAND.has(f.wp);
  sh.onchange = () => setFig({ sh: sh.checked });
  $('#fig-wpinfo').textContent = window.JanjaRoom?.WEAPONS?.[f.wp]?.info || '';
  for (const k of ['shirt', 'pants', 'shoes']) {
    const inp = $('#fig-' + k);
    inp.value = f[k];
    inp.oninput = () => setFig({ [k]: inp.value }, true);
  }
  if (!G3.preview && window.JanjaRoom) G3.preview = window.JanjaRoom.preview($('#figPreview'), f);
}
function closeFigEditor() {
  $('#figEditor').hidden = true;
  G3.preview?.destroy();
  G3.preview = null;
}
let figHiTimer = 0;
function setFig(change, typing) {
  const f = { ...myFig(), ...change };
  store.set('fig', f);
  G3.preview?.set(f);
  G3.ctl?.refresh();
  if (!typing) openFigEditor();
  clearTimeout(figHiTimer);
  figHiTimer = setTimeout(sendHi, 600); // os amigos recebem o boneco novo
}
function renderRoomButtons() {
  for (const b of $$('[data-room]')) b.hidden = !roomOn();
  if (!roomOn()) closeRoom(true);
}
$$('[data-room]').forEach((b) => (b.onclick = () => (G3.open ? closeRoom(true) : openRoom())));
$('#roomClose').onclick = () => closeRoom(true);
$('#roomEdit').onclick = () => ($('#figEditor').hidden ? openFigEditor() : closeFigEditor());
$('#roomPvp').onclick = () => G3.ctl?.togglePvp();
$('#pvpAtk').onclick = () => G3.ctl?.attack();
$('#pvpParry').onclick = () => G3.ctl?.parry();
$('#figClose').onclick = closeFigEditor;
$('#lkRoom').onchange = () => {
  look.room = $('#lkRoom').checked;
  saveLook();
  renderRoomButtons();
};
renderRoomButtons();

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
  // prévia do perfil: muda enquanto a pessoa digita e escolhe a cor
  const preview = () => {
    const name = $('#suName').value.trim();
    $('#obName').textContent = name || 'Seu nome';
    $('#obName').style.color = me.color;
    $('#obAv').textContent = (name || '?')[0].toUpperCase();
    $('#obAv').style.background = me.color;
  };
  colorPicker($('#suColors'), me.color, (c) => {
    me.color = c;
    preview();
    animate($('#obAv'), { scale: [0.85, 1] }, { type: 'spring', stiffness: 500, damping: 14 });
  });
  $('#suName').oninput = preview;
  preview();
  const sync = () => {
    if (invitedKey) $('input[name=suMode][value=join]').checked = true;
    const mode = $('input[name=suMode]:checked').value;
    $('#suInviteNote').hidden = !invitedKey;
    $('#suCodeLabel').hidden = mode !== 'join' || !!invitedKey;
    $('#suGroupLabel').hidden = mode !== 'new';
    $('#suDiscordBox').hidden = mode !== 'discord';
    $('#suError').textContent = '';
    obStep(obCur);
  };
  $$('input[name=suMode]').forEach((r) => (r.onchange = sync));
  $('#obBack').onclick = () => obStep(1);
  obCur = 1;
  sync();
  animate(setup.querySelector('.ob'), { opacity: [0, 1], y: [24, 0], scale: [0.97, 1] }, { type: 'spring', stiffness: 260, damping: 24 });
}
// passo 1: perfil; passo 2: servidor (com convite na mão, só o passo 1)
let obCur = 1;
function obStep(n) {
  obCur = n;
  for (const st of $$('.ob-step')) st.hidden = Number(st.dataset.step) !== n;
  $('#obSteps').hidden = !!invitedKey;
  [...$('#obSteps').children].forEach((d, i) => d.classList.toggle('on', i < n));
  $('#obBack').hidden = n === 1;
  const mode = $('input[name=suMode]:checked').value;
  $('#obNext').textContent = n === 1 && !invitedKey ? 'Continuar' : mode === 'join' || invitedKey ? 'Entrar' : mode === 'discord' ? 'Importar e entrar' : 'Criar servidor';
  const cur = $(`.ob-step[data-step="${n}"]`);
  animate(cur, { opacity: [0, 1], x: [16, 0] }, { duration: 0.22 });
  (n === 1 ? $('#suName') : mode === 'join' ? $('#suCode') : mode === 'discord' ? $('#suDiscord') : $('#suGroup')).focus();
}
$('#setupForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = cleanName($('#suName').value);
  const shake = (msg) => {
    $('#suError').textContent = msg;
    animate($('#setupForm'), { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.35 });
  };
  if (!name) {
    if (obCur !== 1) obStep(1);
    return shake('Escolha um nome.');
  }
  $('#suError').textContent = '';
  if (obCur === 1 && !invitedKey) return obStep(2);
  const mode = invitedKey ? 'join' : $('input[name=suMode]:checked').value;
  const join = mode === 'join';
  const key = invitedKey || (join ? parseCode($('#suCode').value.trim().split('/').pop()) : newKey());
  if (!key) return shake('Código inválido. Confira o que te mandaram.');
  let tpl = null;
  if (mode === 'discord') {
    // lê o modelo do Discord antes de entrar (o servidor é montado no start, como no botão "+")
    const code = discordCode($('#suDiscord').value);
    if (!code) return shake('Cole o link do modelo (discord.new/…).');
    if (!window.desk?.discordTemplate) return shake('A importação só funciona no app.');
    $('#obNext').disabled = true;
    try {
      tpl = (await window.desk.discordTemplate(code))?.serialized_source_guild || null;
    } catch (err) {
      $('#obNext').disabled = false;
      return shake(ipcError(err));
    }
    $('#obNext').disabled = false;
    if (!tpl) return shake('Não achei esse modelo. Confira o link.');
  }
  me.name = name;
  store.set('profile', me);
  R = { key, hash: (await sha256('toca-room:' + key)).slice(0, 40) };
  store.set('room', R);
  if (tpl) store.set('newSrv:' + R.hash, { name: tpl.name, tpl });
  await animate($('#setup'), { opacity: 0 }, { duration: 0.2 });
  $('#setup').hidden = true;
  await start();
  if (mode === 'new') {
    put({ k: 'grp', id: 'grp', name: cleanName($('#suGroup').value) || `Servidor de ${name}`, owner: me.id });
    $('#btnInvite').click();
  }
};

async function start() {
  let saved = await recsLoad(R.hash);
  // quem vem de uma versão antiga: os registros estavam no localStorage; passam para o IndexedDB
  const old = store.get('recs:' + R.hash, null);
  if (old?.length) {
    if (!saved.length) {
      saved = old;
      await recsWrite(R.hash, old.filter(validRec)).catch(() => {});
    }
    store.del('recs:' + R.hash);
  }
  for (const r of saved) if (validRec(r)) recs.set(r.id, r);
  loadLogger();
  for (const r of recs.values()) clock = Math.max(clock, Math.min(r.v, Date.now()));
  seed();
  await turnReady;
  connectRoom();
  rememberServer({});
  const fresh = store.get('newSrv:' + R.hash, null);
  if (fresh) {
    store.del('newSrv:' + R.hash);
    put({ k: 'grp', id: 'grp', name: cleanName(fresh.name) || `Servidor de ${me.name}`, owner: me.id });
    if (fresh.tpl) applyDiscordTemplate(fresh.tpl);
  }
  openView(store.get('view:' + R.hash, 'c:geral'));
  syncRpgVisibility();
  renderPresence();
  renderMusic();
  renderSounds();
  renderServers();
  if (fresh) setTimeout(() => $('#btnInvite').click(), 400);
  setInterval(sendHi, 15_000);
  const rj = store.get('rejoin');
  if (rj?.hash === R.hash && Date.now() - rj.at < REJOIN_MS && channel(rj.ch)?.type === 'voice') {
    openView(rj.ch);
    joinVoice(rj.ch).then(() => toast(`De volta na call ${channel(rj.ch)?.name || ''}`));
  } else if (rj) store.del('rejoin');
}

window.addEventListener('beforeunload', () => {
  flushRecs();
  keepRejoin = true; // recarregou / fechou / atualizou: ao abrir de novo em poucos minutos, volta para a call
  saveRejoin();
  if (C.ch) leaveVoice();
  room?.leave();
});

window.__toca = {
  peers,
  C,
  recs,
  Y,
  AP,
  advance,
  pbOf,
  queueOf,
  addLink,
  toggleAutoplay,
  djRank,
  musicPos,
  netNow,
  clock: () => clockOff,
  G3,
  roomBubble: (m) => roomBubble(m),
  netMode: () => settings.netMode,
  setNetMode,
  antiPing: () => settings.antiPing !== false,
  setAntiPing,
  buildRtcConfig,
  turnServers,
}; // para depurar pelo DevTools (Ctrl+Shift+I)

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
  const known = servers().find((x) => x.key === key);
  if (known) return switchServer(known);
  if (!confirm('Você recebeu um convite para outro servidor. Entrar nele? (você continua nos que já está)')) return;
  joinServer(key);
}

// ============================================================ importar mensagens do Discord (bot)
// O dono cria um bot no portal do Discord, coloca no servidor com "ver canais" e "ler histórico" e cola o token.
// O app lê canal por canal, 100 mensagens por vez, e cria as mensagens no janja (assinadas por quem importou, com o
// nome e a foto de quem escreveu). Imagens e anexos (até 8 MB) são baixados, porque o link do Discord expira.
const DC = { token: '', guild: null, chans: [], busy: false, cancel: false };
const dcColor = (id) => COLORS[[...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % COLORS.length];
function openDcImport() {
  if (!window.desk?.discordApi) return toast('A importação só funciona no app do PC');
  if (groupOwner() && !iCan(P.ManageServer)) return toast('Só quem gerencia o servidor pode importar mensagens');
  Object.assign(DC, { token: '', guild: null, chans: [], cancel: false });
  $('#dcToken').value = '';
  $('#dcPick').hidden = true;
  $('#dcGo').hidden = true;
  $('#dcStatus').textContent = '';
  $('#dcError').textContent = '';
  $('#dcBarBox').hidden = true;
  openDialog($('#dcImpDlg'));
}
const dcApi = (path) => window.desk.discordApi(DC.token, path);
$('#dcConnect').onclick = async () => {
  DC.token = $('#dcToken').value.trim();
  $('#dcError').textContent = '';
  $('#dcStatus').textContent = 'Conectando…';
  try {
    const bot = await dcApi('/users/@me');
    const guilds = await dcApi('/users/@me/guilds');
    if (!guilds.length) throw new Error(`O bot ${bot.username} ainda não está em nenhum servidor. Use o link do OAuth2 para adicionar.`);
    $('#dcGuild').replaceChildren(...guilds.map((g) => Object.assign(el('option', '', g.name), { value: g.id })));
    $('#dcStatus').textContent = `Conectado como ${bot.username}.`;
    $('#dcPick').hidden = false;
    await dcLoadChannels();
  } catch (err) {
    $('#dcStatus').textContent = '';
    $('#dcError').textContent = ipcError(err);
  }
};
$('#dcGuild').onchange = () => dcLoadChannels().catch((err) => ($('#dcError').textContent = ipcError(err)));
// canais de texto do Discord e para onde vão no janja (mesmo nome = mesmo canal; senão cria)
async function dcLoadChannels() {
  const gid = $('#dcGuild').value;
  DC.guild = { id: gid, name: $('#dcGuild').selectedOptions[0]?.textContent || 'Discord' };
  const all = await dcApi(`/guilds/${gid}/channels`);
  const cats = new Map(all.filter((c) => c.type === 4).map((c) => [c.id, c]));
  DC.chans = all
    .filter((c) => c.type === 0 || c.type === 5)
    .sort((a, b) => (cats.get(a.parent_id)?.position ?? -1) - (cats.get(b.parent_id)?.position ?? -1) || a.position - b.position)
    .map((c) => ({ id: c.id, name: c.name, cat: cats.get(c.parent_id)?.name || null }));
  DC.names = new Map(all.map((c) => [c.id, c.name]));
  const box = $('#dcChans');
  box.replaceChildren(
    ...DC.chans.map((c) => {
      const same = channels('text').find((x) => x.name === fixName('text', c.name));
      const row = el('label', 'check dc-ch');
      const cb = Object.assign(el('input'), { type: 'checkbox', checked: true });
      cb.dataset.id = c.id;
      row.append(cb, el('span', '', '#' + c.name), el('small', 'muted', same ? `→ #${same.name}` : '→ canal novo'));
      return row;
    }),
  );
  $('#dcGo').hidden = !DC.chans.length;
  if (!DC.chans.length) $('#dcError').textContent = 'O bot não vê nenhum canal de texto nesse servidor.';
}
function dcTextOf(m) {
  const users = new Map((m.mentions || []).map((u) => [u.id, u.global_name || u.username]));
  let t = String(m.content || '')
    .replace(/<@!?(\d+)>/g, (_, id) => '@' + (users.get(id) || 'alguém'))
    .replace(/<#(\d+)>/g, (_, id) => '#' + (DC.names?.get(id) || 'canal'))
    .replace(/<@&(\d+)>/g, '@cargo')
    .replace(/<a?:(\w+):\d+>/g, ':$1:')
    .replace(/<t:(\d+)(?::[a-zA-Z])?>/g, (_, s) => new Date(s * 1000).toLocaleString('pt-BR'));
  for (const e of (m.embeds || []).slice(0, 2)) {
    const parts = [e.title, e.description].filter(Boolean).join('\n');
    if (parts) t += (t ? '\n' : '') + parts.split('\n').map((l) => '> ' + l).join('\n');
  }
  if (m.sticker_items?.length) t += (t ? ' ' : '') + `[figurinha: ${m.sticker_items[0].name}]`;
  return t.slice(0, 3500);
}
async function dcAttachments(m, withFiles) {
  const att = [];
  const links = [];
  for (const a of (m.attachments || []).slice(0, 6)) {
    const file = withFiles && a.size <= 8e6 ? await window.desk.discordFile(a.url).catch(() => null) : null;
    if (file) {
      const id = 'f:' + randId(12);
      const type = String(a.content_type || file.type || 'application/octet-stream').slice(0, 100);
      await blobPut(id, new Blob([file.data], { type }));
      att.push({ id, name: String(a.filename || 'arquivo').slice(0, 200), size: file.data.byteLength, type });
    } else links.push(`[anexo: ${a.filename}]`);
  }
  return { att, links };
}
// grava um lote de mensagens importadas: assina tudo, junta e manda para quem está online
async function importRecs(list) {
  for (const rec of list) {
    rec.v = Math.max(tick(), (recs.get(rec.id)?.v || 0) + 1);
    rec.by = me.id;
    rec.pk = me.pk;
    delete rec.sig;
  }
  await Promise.all(list.map((r) => ident.signRecord(r)));
  merge(list);
  const ok = list.filter((r) => recs.get(r.id) === r);
  if (ok.length) sendRecs(ok);
  return ok.length;
}
// canal do janja para um canal do Discord: o de mesmo nome, ou um novo (na categoria de mesmo nome)
function dcTargetChannel(c) {
  const name = fixName('text', c.name);
  const same = channels('text').find((x) => x.name === name);
  if (same) return same.id;
  let cat = null;
  if (c.cat) {
    cat = all('cat').find((x) => x.name.toLowerCase() === c.cat.toLowerCase())?.id;
    if (!cat) {
      cat = 'cat:' + randId();
      put({ k: 'cat', id: cat, name: c.cat.slice(0, 40), order: Math.max(0, ...all('cat').map((x) => x.order ?? 0)) + 1 });
    }
  }
  const id = 'c:' + randId();
  put({ k: 'ch', id, name, type: 'text', order: Math.max(0, ...all('ch').map((x) => x.order)) + 1, cat });
  return id;
}
$('#dcGo').onclick = async () => {
  if (DC.busy) return;
  const pick = new Set([...$$('#dcChans input:checked')].map((x) => x.dataset.id));
  const chans = DC.chans.filter((c) => pick.has(c.id));
  if (!chans.length) return ($('#dcError').textContent = 'Marque pelo menos um canal.');
  const withFiles = $('#dcFiles').checked;
  Object.assign(DC, { busy: true, cancel: false });
  $('#dcGo').hidden = true;
  $('#dcError').textContent = '';
  $('#dcBarBox').hidden = false;
  let total = 0;
  try {
    for (let i = 0; i < chans.length && !DC.cancel; i++) {
      const c = chans[i];
      const ch = dcTargetChannel(c);
      let before = '';
      let n = 0;
      // do mais novo para o mais antigo, 100 por vez
      while (!DC.cancel) {
        const page = await dcApi(`/channels/${c.id}/messages?limit=100${before ? '&before=' + before : ''}`);
        if (!page.length) break;
        before = page[page.length - 1].id;
        const batch = [];
        for (const m of page) {
          if (m.type !== 0 && m.type !== 19) continue; // pula avisos do sistema (entrou, fixou...)
          const id = 'm:dc' + m.id;
          if (recs.has(id)) continue; // já importada
          const { att, links } = await dcAttachments(m, withFiles);
          const text = [dcTextOf(m), ...links].filter(Boolean).join(' ');
          if (!text && !att.length) continue;
          const a = m.author || {};
          batch.push({
            k: 'msg',
            id,
            ch,
            uid: 'dc:' + a.id,
            name: cleanName(a.global_name || a.username) || 'alguém',
            color: dcColor(a.id),
            text,
            att,
            ts: Date.parse(m.timestamp) || Date.now(),
            imp: 'dc',
            ...(a.avatar ? { av: `https://cdn.discordapp.com/avatars/${a.id}/${a.avatar}.png?size=64` } : {}),
            ...(a.bot ? { bot: true, via: 'discord' } : {}),
            ...(m.message_reference?.message_id ? { reply: 'm:dc' + m.message_reference.message_id } : {}),
          });
        }
        n += batch.length ? await importRecs(batch) : 0;
        total += batch.length;
        $('#dcStatus').textContent = `#${c.name} (${i + 1} de ${chans.length}): ${n.toLocaleString('pt-BR')} mensagens · total ${total.toLocaleString('pt-BR')}`;
        $('#dcBar').style.width = ((i + Math.min(0.95, n / (n + 300))) / chans.length) * 100 + '%';
        if (page.length < 100) break;
      }
    }
    $('#dcBar').style.width = '100%';
    $('#dcStatus').textContent = DC.cancel ? `Parei. ${total.toLocaleString('pt-BR')} mensagens importadas.` : `Pronto! ${total.toLocaleString('pt-BR')} mensagens importadas do ${DC.guild.name}.`;
    if (!DC.cancel) toast(`${total.toLocaleString('pt-BR')} mensagens importadas do Discord`);
  } catch (err) {
    $('#dcError').textContent = ipcError(err) + ` (${total.toLocaleString('pt-BR')} já importadas; dá para importar de novo, as repetidas são puladas)`;
  } finally {
    DC.busy = false;
    $('#dcGo').hidden = false;
    flushRecs();
  }
};
$('#dcClose').onclick = () => {
  DC.cancel = true;
  DC.token = '';
  $('#dcToken').value = '';
  closeDialog($('#dcImpDlg'));
};
$('#btnDcImport').onclick = () => {
  closeDialog($('#serverDlg'));
  openDcImport();
};

// ============================================================ atividade ("Jogando X")
// O app do PC detecta o jogo aberto (lista de jogos do Discord) e o rich presence dos jogos (activity.js).
// Sem jogo e com música tocando na call, aparece "Ouvindo". Vai para os amigos no "hi"; dá para desligar.
settings.activity = { on: true, custom: [], ...settings.activity };
let gameAct = null;
const ACT_IMG = /^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net|i\.ytimg\.com|yt3\.googleusercontent\.com|lh3\.googleusercontent\.com)\//;
function cleanAct(a) {
  if (!a || typeof a !== 'object' || typeof a.n !== 'string' || !a.n.trim()) return null;
  const s = (v, n) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined);
  return {
    k: a.k === 'music' ? 'music' : 'game',
    n: a.n.trim().slice(0, 80),
    d: s(a.d, 128),
    s: s(a.s, 128),
    t: Number.isFinite(a.t) && a.t > 0 && a.t <= Date.now() + 60_000 ? a.t : undefined,
    i: typeof a.i === 'string' && a.i.length < 400 && ACT_IMG.test(a.i) ? a.i : undefined,
  };
}
function myActivity() {
  if (!settings.activity.on) return null;
  if (gameAct) return gameAct;
  if (C.ch) {
    const { pb, item } = pbOf(C.ch);
    if (item && pb.pausedAt == null) return { k: 'music', n: item.title, d: item.artist || undefined, i: THUMB_OK.test(item.thumb || '') ? item.thumb : `https://i.ytimg.com/vi/${item.ref}/mqdefault.jpg` };
  }
  return null;
}
function actOf(uid) {
  if (uid === me.id) return cleanAct(myActivity());
  for (const p of peers.values()) if (p.user?.id === uid && p.user.act) return p.user.act;
  return null;
}
const actLabel = (a) => (a.k === 'music' ? 'Ouvindo ' : 'Jogando ') + a.n;
function sinceText(t) {
  const min = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  return h + ' h' + (min % 60 ? ' ' + (min % 60) + ' min' : '');
}
if (window.desk?.onActivity) {
  window.desk.onActivity((a) => {
    gameAct = cleanAct(a);
    sendHi();
    renderPresence();
  });
  window.desk.activityConfig?.(settings.activity).catch(() => {});
  window.desk.activityNow?.().then((a) => (gameAct = cleanAct(a)), () => {});
}
// configurações: mostrar ou não, e jogos cadastrados à mão
function renderActSettings() {
  $('#stAct').checked = settings.activity.on;
  $('#stActList').replaceChildren(
    ...settings.activity.custom.map((c, i) => {
      const row = el('div', 'act-row');
      const rm = el('button', 'icon-btn sm');
      rm.type = 'button';
      rm.title = 'Tirar';
      rm.append(icon('x', 'sm'));
      rm.onclick = () => {
        settings.activity.custom.splice(i, 1);
        saveActSettings();
      };
      row.append(icon('gamepad-2', 'sm'), el('b', '', c.name), el('span', 'muted', c.exe), rm);
      return row;
    }),
  );
}
function saveActSettings() {
  saveSettings();
  window.desk?.activityConfig?.(settings.activity).catch(() => {});
  renderActSettings();
  sendHi();
  renderPresence();
}
$('#stAct').onchange = () => {
  settings.activity.on = $('#stAct').checked;
  if (!settings.activity.on) gameAct = null;
  saveActSettings();
};
$('#stActAdd').onclick = () => {
  const exe = $('#stActExe').value.trim().split(/[\\/]/).pop().toLowerCase();
  const name = $('#stActName').value.trim();
  if (!exe.endsWith('.exe') || !name) return toast('Coloque o nome do jogo e o arquivo .exe (ex.: jogo.exe)');
  settings.activity.custom = [...settings.activity.custom.filter((c) => c.exe !== exe), { exe, name: name.slice(0, 60) }].slice(-30);
  $('#stActExe').value = '';
  $('#stActName').value = '';
  saveActSettings();
};
renderActSettings();

// ============================================================ servidores
// Cada servidor é um grupo com o próprio código. A pessoa pode estar em vários, com um aberto por vez: trocar
// recarrega o app naquele servidor (os registros de cada um ficam guardados separados, por hash).
const servers = () => store.get('servers', []);
const saveServers = (list) => store.set('servers', list);
function rememberServer(info) {
  if (!R?.key) return;
  const list = servers();
  const i = list.findIndex((x) => x.hash === R.hash);
  const next = { ...(i >= 0 ? list[i] : {}), key: R.key, hash: R.hash, ...info };
  if (!next.name) next.name = groupName();
  if (i >= 0 && JSON.stringify(list[i]) === JSON.stringify(next)) return;
  if (i >= 0) list[i] = next;
  else list.push(next);
  saveServers(list);
  renderServers();
}
function renderServers() {
  const box = $('#servers');
  const nodes = servers().map((sv) => {
    const b = el('button', 'srv' + (sv.hash === R?.hash ? ' active' : ''));
    b.type = 'button';
    b.title = sv.name || 'Servidor';
    const av = el('span', 'srv-av');
    paintGroupAvatar(av, sv);
    b.append(av);
    b.onclick = () => switchServer(sv);
    b.oncontextmenu = (e) => {
      e.preventDefault();
      if (sv.hash === R?.hash) return $('#btnLeaveGroup').click();
      if (!confirm(`Sair do servidor "${sv.name || 'Servidor'}"? Você vai precisar do convite para voltar.`)) return;
      saveServers(servers().filter((x) => x.hash !== sv.hash));
      recsDrop(sv.hash);
      renderServers();
    };
    return b;
  });
  const add = el('button', 'srv add');
  add.type = 'button';
  add.title = 'Criar ou entrar em um servidor';
  add.append(icon('plus'));
  add.onclick = openNewServer;
  box.replaceChildren(...nodes, add);
}
async function switchServer(sv) {
  if (sv.hash === R?.hash) return;
  if (C.ch && !confirm('Você está numa call. Trocar de servidor sai dela. Trocar mesmo assim?')) return;
  if (C.ch) leaveVoice();
  room?.leave();
  await flushRecs();
  store.set('room', { key: sv.key, hash: sv.hash });
  store.del('rejoin');
  location.reload();
}
async function joinServer(key, fresh) {
  const hash = (await sha256('toca-room:' + key)).slice(0, 40);
  const list = servers();
  if (!list.some((x) => x.hash === hash)) saveServers([...list, { key, hash, name: fresh?.name || 'Servidor' }]);
  if (fresh) store.set('newSrv:' + hash, fresh);
  switchServer({ key, hash });
}

// ----- criar, entrar ou importar do Discord -----
let dcTemplate = null;
function openNewServer() {
  dcTemplate = null;
  $('#nsName').value = '';
  $('#nsCode').value = '';
  $('#nsDiscord').value = '';
  $('#nsError').textContent = '';
  $('#nsPreview').hidden = true;
  syncNewServer();
  openDialog($('#newSrvDlg'));
}
function syncNewServer() {
  const mode = $('input[name=nsMode]:checked').value;
  for (const p of $$('[data-ns]')) p.hidden = p.dataset.ns !== mode;
  $('#nsGo').textContent = mode === 'join' ? 'Entrar' : mode === 'discord' ? 'Importar e criar' : 'Criar servidor';
}
$$('input[name=nsMode]').forEach((r) => (r.onchange = syncNewServer));
const discordCode = (s) => String(s || '').trim().match(/(?:discord\.new\/|discord(?:app)?\.com\/template\/|^)([A-Za-z0-9-]{2,40})\/?$/)?.[1] || null;
const DC_TEXT = new Set([0, 5, 15]);
const DC_VOICE = new Set([2, 13]);
async function loadDiscordTemplate() {
  const code = discordCode($('#nsDiscord').value);
  if (!code) throw new Error('Cole o link do modelo (discord.new/…)');
  if (!window.desk?.discordTemplate) throw new Error('A importação só funciona no app');
  const tpl = await window.desk.discordTemplate(code);
  const g = tpl?.serialized_source_guild;
  if (!g) throw new Error('Não achei esse modelo. Confira o link.');
  dcTemplate = g;
  const ch = g.channels || [];
  const n = (set) => ch.filter((c) => set.has(c.type)).length;
  $('#nsPreview').hidden = false;
  $('#nsPreview').textContent = `"${g.name}": ${ch.filter((c) => c.type === 4).length} categorias, ${n(DC_TEXT)} canais de texto, ${n(DC_VOICE)} de voz e ${Math.max(0, (g.roles || []).length - 1)} cargos.`;
  return g;
}
$('#nsDiscordLoad').onclick = () => loadDiscordTemplate().then(() => ($('#nsError').textContent = ''), (err) => ($('#nsError').textContent = ipcError(err)));
$('#newSrvForm').onsubmit = async (e) => {
  e.preventDefault();
  const mode = $('input[name=nsMode]:checked').value;
  try {
    if (mode === 'join') {
      const raw = $('#nsCode').value.trim();
      const key = parseCode(raw.split('/').pop());
      if (!key) throw new Error('Código inválido. Confira o que te mandaram.');
      if (servers().some((x) => x.key === key)) throw new Error('Você já está nesse servidor.');
      return joinServer(key);
    }
    if (mode === 'discord') {
      const g = dcTemplate || (await loadDiscordTemplate());
      return joinServer(newKey(), { name: g.name, tpl: g });
    }
    joinServer(newKey(), { name: cleanName($('#nsName').value) || `Servidor de ${me.name}` });
  } catch (err) {
    $('#nsError').textContent = ipcError(err);
  }
};
// permissões do Discord (bits) nas do janja; administrador = todas
function discordPerms(str) {
  let b = 0n;
  try {
    b = BigInt(str || 0);
  } catch {}
  const has = (n) => ((b >> BigInt(n)) & 1n) === 1n;
  if (has(3)) return ALL_PERMS;
  const map = [
    [4, P.ManageChannel],
    [5, P.ManageServer],
    [28, P.ManageRole | P.ManagePermissions],
    [30, P.ManageCustomisation],
    [1, P.KickMembers],
    [2, P.BanMembers],
    [13, P.ManageMessages],
    [11, P.SendMessage],
    [6, P.React],
    [20, P.Connect],
    [21, P.Speak],
    [9, P.Video | P.Stream],
    [22, P.MuteMembers],
    [24, P.MoveMembers],
  ];
  let p = 0;
  for (const [bit, perm] of map) if (has(bit)) p |= perm;
  return p;
}
// monta o servidor a partir do modelo: descrição, permissões de todos, cargos, categorias e canais
function applyDiscordTemplate(g) {
  const roles = (g.roles || []).slice(0, 60);
  const everyone = roles.find((r) => r.id === 0);
  put({ ...grpRec(), desc: String(g.description || '').slice(0, 200), ...(everyone ? { perms: discordPerms(everyone.permissions) } : {}) });
  roles
    .filter((r) => r.id !== 0)
    .forEach((r, i) => {
      const color = r.color ? '#' + Number(r.color).toString(16).padStart(6, '0') : '#99aab5';
      put({ k: 'role', id: 'role:' + randId(6), name: String(r.name || 'Cargo').slice(0, 32), color, perms: discordPerms(r.permissions), order: i + 1, hoist: !!r.hoist });
    });
  const chans = [...(g.channels || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).slice(0, 120);
  const cats = new Map();
  chans
    .filter((c) => c.type === 4)
    .forEach((c, i) => {
      const id = 'cat:' + randId();
      cats.set(c.id, id);
      put({ k: 'cat', id, name: String(c.name || 'Categoria').slice(0, 40), order: i + 1 });
    });
  // no Discord a posição conta separada para texto e voz: ordena por categoria, texto antes de voz, posição
  const catPos = new Map(chans.filter((c) => c.type === 4).map((c, i) => [c.id, i]));
  const rank = (c) => [c.parent_id == null ? -1 : catPos.get(c.parent_id) ?? 999, DC_VOICE.has(c.type) ? 1 : 0, c.position ?? 0];
  chans.sort((x, y) => {
    const a = rank(x), b = rank(y);
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  });
  let order = 1;
  let text = 0;
  let voice = 0;
  for (const c of chans) {
    const type = DC_TEXT.has(c.type) ? 'text' : DC_VOICE.has(c.type) ? 'voice' : null;
    if (!type) continue;
    type === 'text' ? text++ : voice++;
    put({ k: 'ch', id: 'c:' + randId(), name: fixName(type, String(c.name || 'canal')), type, order: order++, cat: cats.get(c.parent_id) || null });
  }
  // os canais de exemplo saem quando o modelo trouxe os dele
  if (text) put({ ...recs.get('c:geral'), del: true });
  if (voice) put({ ...recs.get('c:sala'), del: true });
  if (text) store.del('view:' + R.hash);
  toast(`Servidor "${g.name}" importado do Discord: ${text} canais de texto, ${voice} de voz e ${Math.max(0, roles.length - 1)} cargos`);
}

(async () => {
  await initIdentity();
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

// volume dos toques do app: muda na hora e toca um exemplo
$('#stSfxVol').addEventListener('input', () => {
  settings.sfxVol = $('#stSfxVol').value / 100;
  $('#stSfxVal').textContent = $('#stSfxVol').value + '%';
  saveSettings();
  clearTimeout(sfxPreview);
  sfxPreview = setTimeout(sfx.join, 150);
});
let sfxPreview;

// ----- som de entrar/sair escolhido pela pessoa (ex.: os do Skype que ela tiver no PC) -----
function renderSfxFiles() {
  for (const kind of ['join', 'leave']) {
    $(`#stSfx-${kind} .sfx-file`).textContent = settings.sfxFiles[kind] || 'Padrão';
    $(`#stSfx-${kind} [data-reset]`).hidden = !settings.sfxFiles[kind];
  }
}
for (const kind of ['join', 'leave']) {
  const row = $(`#stSfx-${kind}`);
  row.querySelector('input[type=file]').onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 3e6) return toast('Arquivo grande demais para um toque (máximo 3 MB)');
    try {
      await audioCtx().decodeAudioData(await f.arrayBuffer());
    } catch {
      return toast('Não consegui abrir esse áudio');
    }
    await blobPut('sfx:' + kind, f);
    settings.sfxFiles[kind] = f.name.slice(0, 60);
    saveSettings();
    await loadSfxFile(kind);
    renderSfxFiles();
    sfx[kind]();
  };
  row.querySelector('[data-play]').onclick = () => sfx[kind]();
  row.querySelector('[data-reset]').onclick = () => {
    settings.sfxFiles[kind] = '';
    saveSettings();
    sfxBuf[kind] = null;
    renderSfxFiles();
    sfx[kind]();
  };
  loadSfxFile(kind);
}

// ----- aperte para falar: escolher a tecla (vale na hora, sem precisar salvar) -----
const MOUSE_VK = { 1: [4, 'Botão do meio'], 3: [5, 'Mouse 4'], 4: [6, 'Mouse 5'] };
function renderPttKey() {
  $('#stPttKey').textContent = settings.ptt.vk ? settings.ptt.label || 'Tecla ' + settings.ptt.vk : 'Desligado (escolher tecla)';
  $('#stPttOff').hidden = !settings.ptt.vk;
}
function setPttKey(vk, label) {
  settings.ptt = { vk, label };
  saveSettings();
  applyPtt();
  C.pttDown = false;
  applyMicEnabled();
  renderPttKey();
  renderStatusBar();
  toast(vk ? `Aperte para falar: segure ${label}` : 'Aperte para falar desligado: o mic abre sozinho');
}
$('#stPttKey').onclick = (ev) => {
  const btn = ev.currentTarget;
  btn.textContent = 'Aperte a tecla ou o botão do mouse… (Esc cancela)';
  btn.classList.add('listening');
  const done = () => {
    btn.classList.remove('listening');
    removeEventListener('keydown', onKey, true);
    removeEventListener('mousedown', onMouse, true);
    renderPttKey();
  };
  const onKey = (e) => {
    e.preventDefault();
    e.stopPropagation();
    done();
    if (e.key === 'Escape') return;
    const label = e.code.replace(/^Key|^Digit/, '').replace(/^Numpad/, 'Num ') || e.key;
    setPttKey(e.keyCode, label);
  };
  const onMouse = (e) => {
    const m = MOUSE_VK[e.button];
    if (!m) return;
    e.preventDefault();
    done();
    setPttKey(m[0], m[1]);
  };
  setTimeout(() => {
    addEventListener('keydown', onKey, true);
    addEventListener('mousedown', onMouse, true);
  });
};
$('#stPttOff').onclick = () => setPttKey(0, '');

// ----- cutucar (poke do TeamSpeak): aparece na frente do amigo com som, mesmo minimizado -----
let pokeTarget = null;
function openPoke(user) {
  pokeTarget = user;
  $('#pokeTo').textContent = user.name;
  $('#pokeText').value = '';
  openDialog($('#pokeDlg'));
  $('#pokeText').focus();
}
$('#pokeSend').onclick = () => {
  const peer = [...peers.values()].find((p) => p.user?.id === pokeTarget?.id);
  closeDialog($('#pokeDlg'));
  if (!peer) return toast(`${pokeTarget?.name || 'Ele'} não está online`);
  A.poke.send({ text: $('#pokeText').value.trim().slice(0, 100) }, { target: peer.pid });
  toast(`Você cutucou ${peer.user.name}`);
};
$('#pokeText').onkeydown = (e) => {
  if (e.key === 'Enter') $('#pokeSend').click();
};
function onPoke(d, pid) {
  const p = peers.get(pid);
  if (!p?.user || settings.localMute[p.user.id]) return;
  $('#pokeFrom').textContent = p.user.name;
  $('#pokeMsg').textContent = typeof d?.text === 'string' ? d.text.slice(0, 100) : '';
  $('#pokeReply').onclick = () => {
    closeDialog($('#pokeInDlg'));
    openPoke(p.user);
  };
  if (!$('#pokeInDlg').open) openDialog($('#pokeInDlg'));
  if (myStatus() !== 'dnd') sfx.poke();
  window.desk?.flash();
  if (document.hidden && 'Notification' in window) new Notification(`${p.user.name} cutucou você`, { body: $('#pokeMsg').textContent || undefined });
}

// ----- mover amigos de canal (arrastar, como no TeamSpeak) -----
function moveUser(user, ch) {
  if (!iCan(P.MoveMembers)) return toast('Você não tem permissão para mover pessoas');
  const peer = [...peers.values()].find((p) => p.user?.id === user.id);
  if (!peer?.voice || peer.voice.ch === ch) return;
  A.move.send({ ch }, { target: peer.pid });
  toast(`${user.name} foi movido para ${channel(ch)?.name || 'o canal'}`);
}
function onMove(d, pid) {
  const p = peers.get(pid);
  const c = channel(d?.ch);
  if (!p?.user || !c || c.type !== 'voice' || !C.ch || C.ch === c.id) return; // só quem já está numa call
  if (!p.user.verified || !can(p.user.id, P.MoveMembers)) return; // só quem pode mover (e é quem diz ser)
  joinVoice(c.id);
  openView(c.id);
  toast(`${p.user.name} moveu você para ${c.name}`);
}

// popup de quem está ao vivo: entrar na live ou ver o perfil
function openLivePopup(user, peer, anchor) {
  const box = el('div', 'live-pop');
  const head = el('div', 'live-pop-head');
  head.append(avatar(user.name, user.color, '', user.id), wrapEl('div', 'live-pop-who', nameEl(user.name, user.color, user.id), el('span', 'live', 'AO VIVO')));
  const art = el('div', 'live-pop-art');
  art.append(icon('screen-share'), el('span', '', `${user.name} está transmitindo a tela`));
  const go = el('button', 'primary wide');
  go.type = 'button';
  go.append(icon('eye', 'sm'), document.createTextNode('Assistir stream'));
  go.onclick = () => {
    pop.hidden = true;
    watchStream(peer.pid);
    if (S.view !== C.ch) openView(C.ch);
  };
  const prof = el('button', 'ghost sm wide', 'Ver perfil');
  prof.type = 'button';
  prof.onclick = () => openPopover(anchor, profileCard(user));
  box.append(head, art, go, prof);
  openPopover(anchor, box);
}

// ============================================================ câmera
// Vai para todo mundo da call (como no Discord) e aparece no lugar do avatar.
const camOf = (m) => (m.key === 'me' ? C.cam : m.peer?.voice?.cam && m.peer?.media.cam) || null;
function camVideo(stream, mirror) {
  const v = videoFor(stream);
  v.classList.add('cam-video');
  v.classList.toggle('mirror', !!mirror); // a sua própria imagem aparece espelhada, como num espelho
  v.play().catch(() => {});
  return v;
}
async function toggleCam() {
  if (C.cam) return stopCam(true);
  if (!iCan(P.Video)) return toast('Você não tem permissão para ligar a câmera neste grupo');
  if (!C.ch) return toast('Entre em um canal de voz para ligar a câmera');
  // No celular: câmera da frente e 640x480 (o 720p esquenta e trava em muito Android).
  // Se a câmera escolhida sumiu ou não aceita o formato, tenta de novo com qualquer câmera.
  const size = isMobile ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } } : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
  const tries = [
    settings.cam && !isMobile ? { deviceId: { exact: settings.cam }, ...size } : isMobile ? { facingMode: 'user', ...size } : size,
    size,
    true,
  ];
  let lastErr = null;
  for (const video of tries) {
    try {
      C.cam = await navigator.mediaDevices.getUserMedia({ video });
      break;
    } catch (err) {
      lastErr = err;
      C.cam = null;
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') break; // sem permissão: não adianta tentar outra
    }
  }
  if (!C.cam) {
    const denied = lastErr?.name === 'NotAllowedError' || lastErr?.name === 'SecurityError';
    return toast(denied ? (isMobile ? 'Sem permissão de câmera: libere em Configurações > Apps > janjahaters > Permissões' : 'Sem permissão de câmera') : 'Não consegui abrir a câmera: ' + (lastErr?.message || 'sem câmera'));
  }
  window.desk?.callActive?.(true, channel(C.ch)?.name, true); // Android: câmera continua com o app em segundo plano
  const t = C.cam.getVideoTracks()[0];
  t.contentHint = 'motion';
  t.addEventListener('ended', () => stopCam(true)); // câmera desconectada
  syncMedia();
  sendHi();
  renderPresence();
}
function stopCam(notify) {
  if (!C.cam) return;
  const s = C.cam;
  C.cam = null;
  syncMedia();
  s.getTracks().forEach((t) => t.stop());
  if (C.ch) window.desk?.callActive?.(true, channel(C.ch)?.name, false);
  if (notify) {
    sendHi();
    renderPresence();
  }
}
$('#ctlCam').onclick = toggleCam;

// ============================================================ mesa de RPG (rpg/table.js)
// d2Trinities V1.2: mapa com tokens, fichas, iniciativa, rolagens, livro e painel do Mestre. A tela e as regras
// ficam no rpg.bundle.js e o livro em rpg-data.json; os dois só carregam quando alguém abre a mesa.
// O dono do servidor é o Mestre: é ele quem liga a mesa (grp.rpg). Fichas (rpgc), tokens (rpgk), a cena (rpgs) e
// as rolagens (rpgr) são registros do grupo, assinados e replicados como o resto.
const RPG = { ctl: null, loading: null, data: null, open: false };
const isRpgEnabled = () => !!recs.get('grp')?.rpg;
function canToggleServerRpg() {
  const owner = groupOwner();
  return owner ? owner === me.id : canClaimOwner(me.id);
}
const isRpgGm = () => isRpgEnabled() && groupOwner() === me.id;
function setServerRpg(on) {
  if (!canToggleServerRpg()) return toast('Só o dono do servidor (o Mestre) liga ou desliga a mesa de RPG');
  const g = grpRec();
  put({ ...g, k: 'grp', id: 'grp', owner: g.owner || me.id, rpg: !!on });
  if (on) openRpgSession();
  else closeRpgSession(true);
  syncRpgVisibility();
  if ($('#serverDlg')?.open) renderAdmin();
  toast(on ? 'Mesa de RPG aberta. Você é o Mestre.' : 'Mesa de RPG encerrada neste servidor.');
}
function loadRpg() {
  if (window.JanjaRpg) return Promise.resolve(window.JanjaRpg);
  return (RPG.loading ||= new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = 'rpg.bundle.js';
    s.onload = () => ok(window.JanjaRpg);
    s.onerror = () => {
      RPG.loading = null;
      no(new Error('não carregou a mesa de RPG'));
    };
    document.head.append(s);
  }));
}
const rpgApi = {
  me: () => ({ id: me.id, name: me.name || 'Eu', color: me.color }),
  gm: () => groupOwner(),
  isGm: isRpgGm,
  user: (uid) => (uid === me.id ? { id: me.id, name: me.name, color: me.color } : knownUsers().find((u) => u.id === uid) || null),
  recs: (k) => all(k),
  get: (id) => {
    const r = recs.get(id);
    return r && !r.del ? r : null;
  },
  put,
  send: (d) => A.rpg?.send(d),
  icon,
  toast,
  sfx: (crit) => sfx.dice(crit),
  fileUrl,
  async addFile(file) {
    const id = 'f:' + randId(12);
    await blobPut(id, file);
    blobUrls.set(id, URL.createObjectURL(file));
    return id;
  },
  loadData: () => (RPG.data ||= fetch('rpg-data.json').then((r) => r.json())),
  // a rolagem também aparece em cima do boneco no acampamento
  onRoll(d) {
    G3.ctl?.roll?.('me', rollForRoom(d));
  },
  // ficha feita na mesa antiga (2.9.1 e 2.9.2), que ficava só neste PC: entregue uma vez para virar personagem
  legacy() {
    const old = store.get('rpgSheet', null);
    if (!old || store.get('rpgSheetMoved', false)) return null;
    store.set('rpgSheetMoved', true);
    return old;
  },
  close: () => closeRpgSession(true),
  endSession: () => confirm('Encerrar a sessão de RPG? As fichas e o mapa ficam guardados.') && setServerRpg(false),
};
function rollForRoom(d) {
  const p = d.parts?.[0] || {};
  return { label: d.label || 'Rolagem', ptsSym: '', dice: d.dice || [], bonus: (d.parts || []).slice(1).reduce((s, x) => s + x.v, 0), attrVal: p.v ?? 0, attrShort: p.l || '', total: d.total, crit: d.crit, passed: d.df ? !!d.ok : null, dif: d.df || 0 };
}
async function openRpgSession() {
  if (!isRpgEnabled() && !canToggleServerRpg()) return toast('A mesa de RPG não está aberta neste servidor');
  closeRoom();
  setPane('center');
  for (const id of ['#textView', '#voiceView', '#roomView', '#viewHead']) $(id).hidden = true;
  const view = $('#rpgSessionView');
  view.hidden = false;
  RPG.open = true;
  document.body.classList.add('rpg-open');
  for (const b of $$('[data-rpg-session], #ctlRpg')) b.classList.add('on');
  if (!isRpgEnabled()) {
    // mesa desligada: só o dono chega aqui, e vê o convite para abrir
    RPG.ctl?.destroy();
    RPG.ctl = null;
    const start = el('button', 'primary');
    start.type = 'button';
    start.append(icon('crown', 'sm'), document.createTextNode('Abrir a mesa de RPG'));
    start.onclick = () => setServerRpg(true);
    const back = el('button', 'ghost', 'Voltar');
    back.type = 'button';
    back.onclick = () => closeRpgSession(true);
    const card = el('div', 'rpg-start');
    const row = el('div', 'rpg-start-row');
    row.append(start, back);
    card.append(icon('dices'), el('b', '', 'Mesa de RPG · d2Trinities V1.2'), el('p', 'muted', 'Você é o dono deste servidor, então é o Mestre. Abrindo a mesa, todos ganham o mapa com tokens, as fichas, a iniciativa, as rolagens e o livro de regras.'), row);
    view.replaceChildren(card);
    return;
  }
  if (RPG.ctl) return;
  view.replaceChildren(el('div', 'rpg-start', 'Abrindo a mesa…'));
  try {
    const mod = await loadRpg();
    if (!RPG.open || RPG.ctl) return;
    view.replaceChildren();
    RPG.ctl = mod.mount(view, rpgApi);
  } catch (err) {
    view.replaceChildren(el('div', 'rpg-start', 'Não consegui abrir a mesa de RPG: ' + (err?.message || err)));
  }
}
function closeRpgSession(back = true) {
  if (!RPG.open) return;
  RPG.open = false;
  RPG.ctl?.destroy();
  RPG.ctl = null;
  document.body.classList.remove('rpg-open');
  $('#rpgSessionView').hidden = true;
  $('#viewHead').hidden = false;
  for (const b of $$('[data-rpg-session], #ctlRpg')) b.classList.toggle('on', isRpgEnabled());
  if (back) openView(S.view);
}
function syncRpgVisibility() {
  const on = isRpgEnabled();
  const show = on || canToggleServerRpg();
  for (const b of $$('[data-rpg-session], #ctlRpg')) {
    b.hidden = !show;
    b.classList.toggle('on', RPG.open || on);
  }
  if ($('#roomRpg')) $('#roomRpg').hidden = !on;
  if (RPG.open && !on && !canToggleServerRpg()) closeRpgSession(true); // o Mestre encerrou
  else if (RPG.open && on && !RPG.ctl) openRpgSession(); // o Mestre acabou de abrir
  else if (RPG.open && !on && RPG.ctl) openRpgSession();
}
// resumo do personagem de alguém, para a lista de pessoas e o cartão na call
function rpgOf(uid) {
  if (!isRpgEnabled()) return null;
  const mine = all('rpgc').filter((r) => r.uid === uid && r.d);
  const c = (mine.find((r) => r.d.on) || mine[0])?.d;
  const gm = uid === groupOwner();
  if (!c) return gm ? { gm, cn: 'Mesa de RPG' } : null;
  return { gm, cn: String(c.name || 'Sem nome').slice(0, 40), rc: String(c.race || '').slice(0, 30), cl: String(c.cls || '').slice(0, 30), lv: c.lv | 0, pv: c.pv | 0, pvm: c.pvMax | 0, pm: c.pm | 0, pmm: c.pmMax | 0 };
}
function onRpgNet(d, pid) {
  const uid = peers.get(pid)?.user?.id;
  if (uid && d && typeof d === 'object') RPG.ctl?.onNet(d, uid);
}
function onRpgRecs(list) {
  const kinds = new Set(list.map((r) => r.k));
  // rolagem nova de um amigo: som (com a mesa aberta) e balão no acampamento
  for (const r of list) {
    if (r.k !== 'rpgr' || r.del || r.by === me.id || !r.d || Date.now() - r.ts > 15_000 || r.d.ap) continue;
    if (RPG.open && r.d.total != null) sfx.dice(r.d.crit);
    const p = [...peers.values()].find((x) => x.user?.id === r.uid);
    if (p && r.d.total != null) G3.ctl?.roll?.(p.pid, rollForRoom(r.d));
  }
  RPG.ctl?.onRecs(kinds);
  if (kinds.has('rpgc')) renderPresence();
}
for (const b of $$('[data-rpg-session], #ctlRpg, #roomRpg')) b.addEventListener('click', () => (RPG.open && b.id !== 'roomRpg' ? closeRpgSession(true) : openRpgSession()));
window.__janjaRpg = { open: openRpgSession, close: closeRpgSession, enable: setServerRpg, api: rpgApi, state: RPG };
