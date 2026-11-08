// Sala de games: uma sala 3D com sofá, TV, poltronas e fliperama, onde cada um do grupo aparece como um boneco.
// Móveis: "Furniture Kit" e bonecos: "Mini Characters" do Kenney (CC0, renderer/room/). Vai num arquivo separado
// (room.bundle.js, com o three.js dentro) e só carrega quando alguém abre a sala: com a sala desligada nas
// configurações, nada disso fica na memória.
//
// O app chama window.JanjaRoom.mount(caixa, api) e recebe { handlePos, bubble, refresh, resendPos, destroy }.
// api: me(), people(), sendPos(estado), tv()
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FIG, cleanFig } from './figure.js';

const BASE = 'room/';
const S = 3.1; // escala dos bonecos e móveis do Kenney (um boneco de 0,78 vira ~2,4 na sala)
const F = S / 2.4; // os móveis foram posicionados com 2,4; tudo cresce junto
const SPEED = 3.6;
const RUN = 6.2;
const ROOM = { x0: -6.6, x1: 6.6, z0: -5.0, z1: 5.2 }; // onde dá para andar
const RADIUS = 0.4;
// emotes nas teclas 1 a 4: animação do Kenney e se repete
export const EMOTES = { tchau: 'interact-right', sim: 'emote-yes', nao: 'emote-no', pulo: 'jump' };

// ------------------------------------------------------------------ carregamento
const loader = new GLTFLoader();
const gltfCache = new Map();
function loadGltf(url) {
  if (!gltfCache.has(url))
    gltfCache.set(
      url,
      loader.loadAsync(BASE + url).catch((err) => {
        gltfCache.delete(url);
        throw err;
      }),
    );
  return gltfCache.get(url);
}
function prepare(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      for (const m of [].concat(o.material)) if (m) m.roughness = Math.max(m.roughness ?? 1, 0.7);
    }
  });
  return obj;
}

// ------------------------------------------------------------------ peças feitas aqui (paredes, fliperama)
const mats = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...opts }));
  return mats.get(key);
}
function mesh(geo, material, { shadow = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}
const rbox = (w, h, d, color, r = 0.06, opts) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat(color, opts));
const at = (o, x, y, z, ry = 0) => {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  return o;
};
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ------------------------------------------------------------------ a sala
function buildRoom(scene) {
  const obstacles = []; // [x0, z0, x1, z1] ou { c: [x, z], r }
  const seats = []; // { x, z, r, y }

  // chão de tábuas
  const floorTex = canvasTex(512, 512, (g, w) => {
    const cols = ['#c9925e', '#c48b57', '#cf9a66', '#bf8652'];
    for (let i = 0; i < 8; i++) {
      g.fillStyle = cols[i % 4];
      g.fillRect(0, i * 64, w, 64);
      g.fillStyle = 'rgba(80,40,10,.25)';
      g.fillRect(0, i * 64, w, 2);
      g.fillRect((i * 197) % w, i * 64, 2, 64);
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(3, 3);
  const floor = mesh(new THREE.PlaneGeometry(14.4, 11.4), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85 }), { shadow: false });
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0.2);
  scene.add(floor);

  // paredes com papel de parede listrado
  const wallTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f3e3cf';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ecd6bd';
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, h);
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(5, 1.5);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
  scene.add(at(mesh(new THREE.PlaneGeometry(14.4, 4.2), wallMat, { shadow: false }), 0, 2.1, -5.5));
  const left = mesh(new THREE.PlaneGeometry(11.4, 4.2), wallMat, { shadow: false });
  left.rotation.y = Math.PI / 2;
  left.position.set(-7.2, 2.1, 0.2);
  scene.add(left);
  scene.add(at(rbox(14.4, 0.18, 0.08, '#a8744a', 0.02), 0, 0.09, -5.46), at(rbox(0.08, 0.18, 11.4, '#a8744a', 0.02), -7.16, 0.09, 0.2));

  // janela com luz do dia
  const win = new THREE.Group();
  win.add(rbox(2.4, 1.7, 0.12, '#ffffff', 0.04));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.4), new THREE.MeshBasicMaterial({ color: '#bfe6ff' }));
  glass.position.z = 0.07;
  win.add(glass, at(rbox(0.06, 1.4, 0.04, '#ffffff', 0.01), 0, 0, 0.09), at(rbox(2.1, 0.06, 0.04, '#ffffff', 0.01), 0, 0, 0.09));
  scene.add(at(win, -4.2, 2.4, -5.45));

  // tela da TV (desenhada aqui por cima do modelo da TV)
  const tvCanvas = document.createElement('canvas');
  tvCanvas.width = 512;
  tvCanvas.height = 288;
  const tvTex = new THREE.CanvasTexture(tvCanvas);
  tvTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5625), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false }));
  screen.visible = false;
  scene.add(screen);
  const tvLight = new THREE.PointLight('#9fb8ff', 2.5, 6, 2);
  tvLight.position.set(0, 1.6, -4.2);
  scene.add(tvLight);

  // fliperama no canto (o kit não tem)
  const arc = new THREE.Group();
  arc.add(at(rbox(0.95, 1.9, 0.85, '#3a0ca3', 0.05), 0, 0.95, 0));
  arc.add(at(rbox(0.97, 0.3, 0.6, '#f72585', 0.04), 0, 1.98, 0.08));
  arc.add(at(rbox(0.9, 0.12, 0.45, '#22223b', 0.03), 0, 1.05, 0.38));
  const arcCanvas = document.createElement('canvas');
  arcCanvas.width = 128;
  arcCanvas.height = 112;
  const arcTex = new THREE.CanvasTexture(arcCanvas);
  arcTex.colorSpace = THREE.SRGBColorSpace;
  arcTex.magFilter = THREE.NearestFilter;
  const arcScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.62), new THREE.MeshBasicMaterial({ map: arcTex, toneMapped: false }));
  arcScreen.position.set(0, 1.52, 0.432);
  arc.add(arcScreen);
  for (const [x, c] of [[-0.25, '#ffd166'], [0.05, '#ef476f'], [0.22, '#06d6a0']]) arc.add(at(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), mat(c)), x, 1.13, 0.45));
  scene.add(at(arc, -6.5, 0, -4.4, Math.PI / 4));
  obstacles.push([-7.1, -5.0, -5.9, -3.8]);

  // pôsteres e varal de luzinhas
  const poster = (x, color, accent) => {
    const t = canvasTex(160, 220, (g, w, h) => {
      g.fillStyle = color;
      g.fillRect(0, 0, w, h);
      g.fillStyle = accent;
      g.beginPath();
      g.arc(w / 2, h * 0.42, 46, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffffff';
      g.fillRect(24, h - 50, w - 48, 10);
      g.fillRect(40, h - 32, w - 80, 8);
    });
    scene.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.25), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })), x, 2.6, -5.47));
  };
  poster(-2.4, '#264653', '#e9c46a');
  poster(2.5, '#6d597a', '#ff8fab');
  const bulbs = [];
  for (let i = 0; i < 26; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0'][i % 4] }));
    b.position.set(-6.8 + i * 0.54, 3.75 - Math.sin(((i % 6) / 5) * Math.PI) * 0.18, -5.4);
    scene.add(b);
    bulbs.push(b);
  }
  const lamp = new THREE.PointLight('#ffcf8a', 7, 9, 1.6);
  lamp.position.set(5.9, 2.1, 1.7);
  scene.add(lamp);

  return { obstacles, seats, floor, screen, tvCanvas, tvTex, tvLight, arcCanvas, arcTex, bulbs };
}

// Móveis do Kenney. Cada um: arquivo, escala, posição (centro no chão), giro, se bloqueia e lugares para sentar
// (em coordenadas do móvel já centrado: x para o lado, z para a frente).
const FURNITURE = [
  { f: 'rugRounded', s: 4.4, x: 0, z: -1.2, solid: false },
  { f: 'cabinetTelevision', s: 3.4, x: 0, z: -5.05 },
  { f: 'televisionModern', s: 3.6, x: 0, z: -5.05, y: 'cabinetTelevision', tv: true, solid: false },
  { f: 'speaker', s: 2.6, x: -2.6, z: -5.1 },
  { f: 'speaker', s: 2.6, x: 2.6, z: -5.1 },
  { f: 'tableCoffee', s: 2.6, x: 0, z: -1.4 },
  { f: 'loungeSofa', s: 3.2, x: 0, z: 1.5, r: Math.PI, seats: [-0.25, 0.25] },
  { f: 'loungeChair', s: 3.0, x: -3.9, z: -1.4, r: Math.PI / 2, seats: [0] },
  { f: 'loungeChair', s: 3.0, x: 3.9, z: -1.4, r: -Math.PI / 2, seats: [0] },
  { f: 'pillow', s: 2.4, x: -1.5, z: 2.0, r: Math.PI, solid: false, y: 0.8 },
  { f: 'pillowBlue', s: 2.4, x: 1.5, z: 2.05, r: Math.PI, solid: false, y: 0.8 },
  { f: 'bookcaseOpen', s: 3.0, x: 4.1, z: -5.15 },
  { f: 'bookcaseOpen', s: 3.0, x: 5.75, z: -5.15 },
  { f: 'books', s: 3.0, x: 4.1, z: -5.1, solid: false, y: 'bookcaseOpen' },
  { f: 'pottedPlant', s: 1.6, x: 6.5, z: -4.8 },
  { f: 'pottedPlant', s: 1.4, x: -6.6, z: 4.6 },
  { f: 'plantSmall2', s: 3, x: 6.5, z: 4.6 },
  { f: 'lampRoundFloor', s: 2.6, x: 5.9, z: 1.7 },
  { f: 'sideTable', s: 2.6, x: -6.7, z: 0.6, r: Math.PI / 2 },
  { f: 'radio', s: 2.6, x: -6.7, z: 0.6, r: Math.PI / 2, solid: false, y: 'sideTable' },
  { f: 'cardboardBoxOpen', s: 2.6, x: 6.2, z: -2.6, r: 0.4 },
];
async function furnish(scene, R) {
  const heights = {};
  // primeiro as peças de baixo (o que fica em cima precisa da altura delas)
  const order = [...FURNITURE].sort((a, b) => (typeof a.y === 'string') - (typeof b.y === 'string'));
  await Promise.all(
    order
      .filter((d) => typeof d.y !== 'string')
      .map(async (d) => place(d)),
  );
  await Promise.all(order.filter((d) => typeof d.y === 'string').map(place));

  async function place(d) {
    let g;
    try {
      g = await loadGltf('furn/' + d.f + '.glb');
    } catch {
      return; // sem o modelo, a sala continua sem ele
    }
    const obj = prepare(g.scene.clone(true));
    obj.scale.multiplyScalar(d.s * (d.f.startsWith('rug') ? 1 : F));
    // centraliza no chão
    const box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -box.min.y, -c.z);
    const wrap = new THREE.Group();
    wrap.add(obj);
    const y = typeof d.y === 'string' ? heights[d.y] || 0 : d.y || 0;
    wrap.position.set(d.x, y, d.z);
    wrap.rotation.y = d.r || 0;
    scene.add(wrap);
    const size = box.getSize(new THREE.Vector3());
    heights[d.f] = Math.max(heights[d.f] || 0, y + size.y);
    if (d.solid !== false) {
      const wb = new THREE.Box3().setFromObject(wrap);
      R.obstacles.push([wb.min.x, wb.min.z, wb.max.x, wb.max.z]);
    }
    if (d.seats) {
      const cos = Math.cos(d.r || 0);
      const sin = Math.sin(d.r || 0);
      for (const sx of d.seats) {
        const lx = sx * size.x;
        const lz = size.z * 0.12; // um pouco para a frente do centro
        R.seats.push({ x: d.x + lx * cos + lz * sin, z: d.z - lx * sin + lz * cos, r: d.r || 0, y: size.y * 0.42 });
      }
    }
    if (d.tv) {
      // a tela fica na frente do modelo da TV
      const sw = size.x * 0.86;
      R.screen.scale.set(sw, sw, 1);
      R.screen.position.set(d.x, y + size.y * 0.56, d.z + size.z / 2 + 0.01);
      R.screen.visible = true;
      R.tvLight.position.set(d.x, y + size.y * 0.5, d.z + 0.9);
    }
  }
}

// ------------------------------------------------------------------ bonecos (Mini Characters)
async function buildFigure(fig) {
  const g = await loadGltf('chars/character-' + fig.char + '.glb');
  const model = cloneSkinned(g.scene);
  prepare(model);
  model.scale.setScalar(S);
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.add(model);
  root.add(body);
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  for (const clip of g.animations) actions[clip.name] = mixer.clipAction(clip);
  let head = null;
  model.traverse((o) => {
    if (o.name === 'head') head = o;
  });
  if (fig.acc !== 'nada' && head) {
    try {
      const a = await loadGltf('chars/aid-' + fig.acc + '.glb');
      head.add(prepare(a.scene.clone(true)));
    } catch {}
  }
  // anel verde no chão quando a pessoa fala na call
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), new THREE.MeshBasicMaterial({ color: '#3ddc84', transparent: true, opacity: 0.85 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.visible = false;
  root.add(ring);
  return { root, body, model, mixer, actions, head, ring, height: 0.8 * S };
}
function play(P, name, fade = 0.2) {
  const next = P.actions[name] || P.actions.idle;
  if (!next || P.current === next) return;
  next.reset();
  const once = name in ONCE;
  next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
  next.clampWhenFinished = once;
  next.fadeIn(fade).play();
  P.current?.fadeOut(fade);
  P.current = next;
}
const ONCE = { 'emote-yes': 1, 'emote-no': 1, 'interact-right': 1 };

function labelSprite(text, color) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = '600 34px system-ui, sans-serif';
  g.font = font;
  const w = Math.min(460, Math.ceil(g.measureText(text).width) + 44);
  c.width = w;
  c.height = 56;
  g.font = font;
  g.fillStyle = 'rgba(20,22,30,.72)';
  roundRect(g, 0, 0, w, 56, 28);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.arc(24, 28, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.textBaseline = 'middle';
  g.fillText(text, 40, 30, w - 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set((w / 56) * 0.28, 0.28, 1);
  s.renderOrder = 10;
  return s;
}
function bubbleSprite(text) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = '500 30px system-ui, sans-serif';
  g.font = font;
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const tryLine = line ? line + ' ' + w : w;
    if (g.measureText(tryLine).width > 380 && line) {
      lines.push(line);
      line = w;
      if (lines.length === 3) break;
    } else line = tryLine;
  }
  if (lines.length < 3 && line) lines.push(line);
  if (lines.length === 3 && words.join(' ').length > lines.join(' ').length) lines[2] = lines[2].slice(0, 28) + '…';
  const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 48;
  const h = lines.length * 38 + 40;
  c.width = w;
  c.height = h;
  g.font = font;
  g.fillStyle = '#ffffff';
  roundRect(g, 0, 0, w, h - 14, 24);
  g.fill();
  g.beginPath();
  g.moveTo(w / 2 - 12, h - 15);
  g.lineTo(w / 2 + 12, h - 15);
  g.lineTo(w / 2, h);
  g.fill();
  g.fillStyle = '#1b1b22';
  g.textBaseline = 'top';
  lines.forEach((l, i) => g.fillText(l, 24, 14 + i * 38));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(w / 150, h / 150, 1);
  s.renderOrder = 11;
  s.center.set(0.5, 0);
  return s;
}
// libera só o que é deste boneco (geometria e texturas dos modelos ficam no cache, compartilhadas)
function disposeOwn(o) {
  o.traverse((x) => {
    if (x.isSprite) {
      x.material.map?.dispose();
      x.material.dispose();
    } else if (x.isMesh && x.geometry?.type === 'RingGeometry') x.geometry.dispose();
  });
}

// ------------------------------------------------------------------ montagem
export function mount(box, api) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'room-canvas';
  renderer.domElement.tabIndex = 0;
  box.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2a2238');
  scene.add(new THREE.HemisphereLight('#fff3e0', '#6b5a7a', 1.4));
  const sun = new THREE.DirectionalLight('#fff1d6', 2.2);
  sun.position.set(-5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 8, bottom: -8 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const R = buildRoom(scene);
  let alive = true;
  furnish(scene, R)
    .then(() => {
      if (!blocked(self.x, self.z)) return;
      for (let d = 0.5; d < 6; d += 0.5)
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          const x = self.x + Math.sin(a) * d;
          const z = self.z + Math.cos(a) * d;
          if (!blocked(x, z)) {
            Object.assign(self, { x, z });
            sendNow();
            return;
          }
        }
    })
    .catch((err) => console.warn('móveis da sala', err));

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 60);
  let zoom = 1;
  const camTarget = new THREE.Vector3(0, 0.8, 0);

  // ---------------- bonecos
  const avatars = new Map(); // key -> { x, z, r, parts, figKey, label, target, ... }
  const meKey = 'me';
  // cada um entra num lugar diferente da frente da sala (pelo id), virado para a câmera
  const meId = String(api.me().uid || '');
  let hh = 0;
  for (const c of meId) hh = (hh * 31 + c.charCodeAt(0)) >>> 0;
  const self = { x: -4 + (hh % 9), z: 3.2 + ((hh >> 4) % 3) * 0.6, r: 0, s: -1, w: false, run: false, e: '', et: 0 };
  let walkTo = null;
  function setFigure(a, fig) {
    const figKey = JSON.stringify(fig);
    if (a.figKey === figKey) return;
    a.figKey = figKey;
    const token = (a.token = {});
    buildFigure(fig)
      .then((parts) => {
        if (!alive || a.token !== token || !avatars.has(a.key)) return;
        if (a.parts) a.holder.remove(a.parts.root);
        a.parts = parts;
        a.holder.add(parts.root);
        a.label.position.y = parts.height + 0.25;
        play(parts, 'idle', 0);
      })
      .catch((err) => console.warn('boneco', err));
  }
  function ensureAvatar(key, p) {
    let a = avatars.get(key);
    if (!a) {
      a = { key, x: p.pos?.x ?? 0, z: p.pos?.z ?? 3, r: p.pos?.r ?? 0, holder: new THREE.Group() };
      avatars.set(key, a);
      scene.add(a.holder);
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.18, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.012;
      a.holder.add(shadow);
    }
    setFigure(a, cleanFig(p.fig, p.color, p.uid));
    const labelKey = p.name + p.color;
    if (a.labelKey !== labelKey) {
      if (a.label) {
        a.holder.remove(a.label);
        disposeOwn(a.label);
      }
      a.label = labelSprite(p.name, p.color || '#5b7bf0');
      a.label.position.y = 0.8 * S + 0.25;
      a.holder.add(a.label);
      a.labelKey = labelKey;
    }
    a.speaking = !!p.speaking;
    return a;
  }
  function refresh() {
    const keep = new Set([meKey]);
    ensureAvatar(meKey, { ...api.me(), pos: self });
    let i = 0;
    for (const p of api.people()) {
      keep.add(p.key);
      if (!avatars.has(p.key)) {
        i++;
        const st = p.pos || { x: -3 + (i % 5) * 1.5, z: 3.8 + Math.floor(i / 5) * 0.8, r: 0, s: -1, w: false, e: '' };
        ensureAvatar(p.key, { ...p, pos: st }).target = st;
      } else ensureAvatar(p.key, p);
    }
    for (const [key, a] of avatars)
      if (!keep.has(key)) {
        scene.remove(a.holder);
        disposeOwn(a.holder);
        avatars.delete(key);
      }
  }

  // ---------------- colisão
  function blocked(x, z) {
    if (x < ROOM.x0 || x > ROOM.x1 || z < ROOM.z0 || z > ROOM.z1) return true;
    for (const o of R.obstacles) {
      if (Array.isArray(o)) {
        if (x > o[0] - RADIUS && x < o[2] + RADIUS && z > o[1] - RADIUS && z < o[3] + RADIUS) return true;
      } else if (Math.hypot(x - o.c[0], z - o.c[1]) < o.r + RADIUS) return true;
    }
    return false;
  }

  // ---------------- teclado e mouse
  const keys = new Set();
  const typing = () => {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
  };
  const visible = () => box.offsetParent !== null && !document.hidden;
  const MOVE = { KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1 };
  const EMOTE_KEYS = { Digit1: 'tchau', Digit2: 'sim', Digit3: 'nao', Digit4: 'pulo' };
  const onKeyDown = (e) => {
    if (!visible() || typing() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (MOVE[e.code]) {
      keys.add(e.code);
      walkTo = null;
      if (self.s >= 0) standUp();
      e.preventDefault();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.add('Shift');
    else if (e.code === 'KeyE' && !e.repeat) {
      toggleSit();
      e.preventDefault();
    } else if (EMOTE_KEYS[e.code] && !e.repeat) {
      emote(EMOTE_KEYS[e.code]);
      e.preventDefault();
    }
  };
  const onKeyUp = (e) => keys.delete(e.code === 'ShiftLeft' || e.code === 'ShiftRight' ? 'Shift' : e.code);
  const onBlur = () => keys.clear();
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  addEventListener('blur', onBlur);
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();
  renderer.domElement.addEventListener('pointerdown', (e) => {
    renderer.domElement.focus();
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(ground, hitPoint)) return;
    const seat = nearestSeat(hitPoint.x, hitPoint.z, 1.3);
    walkTo = seat != null ? { x: R.seats[seat].x, z: R.seats[seat].z, sit: seat } : { x: hitPoint.x, z: hitPoint.z };
    if (self.s >= 0) standUp();
  });
  renderer.domElement.addEventListener(
    'wheel',
    (e) => {
      zoom = Math.min(1.6, Math.max(0.55, zoom * (e.deltaY > 0 ? 1.08 : 0.93)));
      e.preventDefault();
    },
    { passive: false },
  );

  function nearestSeat(x, z, max) {
    let best = null;
    let bd = max;
    const taken = new Set([...avatars.entries()].filter(([k]) => k !== meKey).map(([, a]) => a.target?.s));
    R.seats.forEach((s, i) => {
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < bd && !taken.has(i)) (bd = d), (best = i);
    });
    return best;
  }
  function sitOn(i) {
    const s = R.seats[i];
    Object.assign(self, { s: i, x: s.x, z: s.z, r: s.r, e: '' });
    walkTo = null;
    sendNow();
  }
  function standUp() {
    if (self.s < 0) return;
    const s = R.seats[self.s];
    self.s = -1;
    const fx = s.x + Math.sin(s.r) * 0.9;
    const fz = s.z + Math.cos(s.r) * 0.9;
    if (!blocked(fx, fz)) Object.assign(self, { x: fx, z: fz });
    sendNow();
  }
  function toggleSit() {
    if (self.s >= 0) return standUp();
    const i = nearestSeat(self.x, self.z, 2.4);
    if (i != null) sitOn(i);
  }
  function emote(e) {
    if (self.s >= 0 && e === 'pulo') return;
    self.e = e;
    self.et = performance.now();
    sendNow();
  }

  // ---------------- rede (10 por segundo andando, 1 a cada 3 s parado)
  let lastSent = 0;
  let lastState = '';
  const packed = () => ({ x: +self.x.toFixed(2), z: +self.z.toFixed(2), r: +self.r.toFixed(2), s: self.s, w: self.w, run: self.run, e: self.e });
  function sendNow() {
    const st = packed();
    lastState = JSON.stringify(st);
    lastSent = performance.now();
    api.sendPos(st);
  }
  function maybeSend(now) {
    const st = packed();
    const js = JSON.stringify(st);
    if ((js !== lastState && now - lastSent > 100) || now - lastSent > 3000) {
      lastState = js;
      lastSent = now;
      api.sendPos(st);
    }
  }

  // ---------------- TV e fliperama
  let tvKey = '';
  let tvImg = null;
  function drawTv() {
    const info = api.tv();
    const key = info ? info.title + '|' + info.thumb + '|' + info.playing : 'none';
    if (key === tvKey) return;
    tvKey = key;
    const g = R.tvCanvas.getContext('2d');
    const { width: w, height: h } = R.tvCanvas;
    const paint = () => {
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#3a0ca3');
      grad.addColorStop(1, '#f72585');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff';
      g.textBaseline = 'middle';
      if (!info) {
        g.font = '800 54px system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText('janjahaters', w / 2, h / 2 - 18);
        g.font = '500 24px system-ui, sans-serif';
        g.fillText('ponha uma música na call para ver aqui', w / 2, h / 2 + 34);
        g.textAlign = 'left';
      } else {
        if (tvImg?.complete && tvImg.naturalWidth) g.drawImage(tvImg, 24, 44, 200, 200);
        else {
          g.fillStyle = 'rgba(255,255,255,.18)';
          g.fillRect(24, 44, 200, 200);
          g.fillStyle = '#fff';
          g.font = '90px system-ui';
          g.textAlign = 'center';
          g.fillText('♪', 124, 150);
          g.textAlign = 'left';
        }
        g.font = '600 20px system-ui, sans-serif';
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.fillText(info.playing ? 'TOCANDO AGORA' : 'PAUSADA', 248, 80);
        g.fillStyle = '#fff';
        g.font = '800 30px system-ui, sans-serif';
        let line = '';
        let y = 128;
        for (const wd of info.title.split(' ')) {
          const t = line ? line + ' ' + wd : wd;
          if (g.measureText(t).width > 240 && line) {
            g.fillText(line, 248, y);
            y += 36;
            line = wd;
            if (y > 200) break;
          } else line = t;
        }
        if (y <= 200) g.fillText(line, 248, y);
        g.font = '500 22px system-ui, sans-serif';
        g.fillStyle = 'rgba(255,255,255,.85)';
        g.fillText((info.artist || '').slice(0, 26), 248, Math.min(y + 40, 250));
      }
      R.tvTex.needsUpdate = true;
    };
    tvImg = null;
    if (info?.thumb) {
      tvImg = new Image();
      tvImg.crossOrigin = 'anonymous';
      tvImg.onload = paint;
      tvImg.onerror = () => {
        tvImg = null;
        paint();
      };
      tvImg.src = info.thumb;
    }
    paint();
  }
  function drawArcade(t) {
    const g = R.arcCanvas.getContext('2d');
    g.fillStyle = '#0b0b1a';
    g.fillRect(0, 0, 128, 112);
    const bx = 64 + Math.sin(t * 1.7) * 52;
    const by = 56 + Math.sin(t * 2.3) * 44;
    g.fillStyle = '#4cc9f0';
    g.fillRect(8, 30 + Math.sin(t * 2.3) * 30, 6, 26);
    g.fillRect(114, 30 + Math.sin(t * 2.3 + 0.6) * 30, 6, 26);
    g.fillStyle = '#ffd166';
    g.fillRect(bx - 4, by - 4, 8, 8);
    g.fillStyle = '#f72585';
    for (let y = 0; y < 112; y += 12) g.fillRect(63, y, 2, 6);
    R.arcTex.needsUpdate = true;
  }

  // ---------------- animação
  const clock = new THREE.Clock();
  let raf = 0;
  let running = true;
  let lastTv = 0;
  let arcT = 0;
  function animate(a, dt, t, isMe) {
    const st = isMe ? self : a.target || { x: a.x, z: a.z, r: a.r, s: -1, w: false, e: '' };
    if (!isMe) {
      const k = 1 - Math.exp(-dt * 10);
      a.x += (st.x - a.x) * k;
      a.z += (st.z - a.z) * k;
    } else {
      a.x = self.x;
      a.z = self.z;
    }
    let dr = st.r - a.r;
    dr = Math.atan2(Math.sin(dr), Math.cos(dr));
    a.r += dr * (1 - Math.exp(-dt * 12));
    const seat = st.s >= 0 ? R.seats[st.s] : null;
    a.holder.position.set(a.x, seat ? seat.y : 0, a.z);
    a.holder.rotation.y = a.r;
    const P = a.parts;
    if (P) {
      const moving = !seat && (isMe ? self.w : st.w || Math.hypot(st.x - a.x, st.z - a.z) > 0.08);
      let anim = 'idle';
      if (seat) anim = 'sit';
      else if (moving) anim = st.run ? 'sprint' : 'walk';
      else if (st.e && EMOTES[st.e]) anim = EMOTES[st.e];
      play(P, anim);
      P.mixer.update(dt);
      // falando na call: anel verde e a cabeça balança de leve
      P.ring.visible = !!a.speaking;
      if (P.head) P.head.rotation.z = a.speaking ? Math.sin(t * 9) * 0.08 : P.head.rotation.z * 0.8;
    }
    if (a.bubble) {
      if (t > a.bubbleUntil) {
        a.holder.remove(a.bubble);
        disposeOwn(a.bubble);
        a.bubble = null;
        a.label.visible = true;
      } else {
        a.bubble.position.y = (P ? P.height : 1.9) + 0.2;
        a.label.visible = false;
      }
    }
  }
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!running || !visible()) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    const now = performance.now();

    let mx = 0;
    let mz = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) mz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (!mx && !mz && walkTo) {
      const dx = walkTo.x - self.x;
      const dz = walkTo.z - self.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.12) {
        if (walkTo.sit != null) sitOn(walkTo.sit);
        walkTo = null;
      } else {
        mx = dx / d;
        mz = dz / d;
      }
    }
    self.w = false;
    self.run = false;
    if ((mx || mz) && self.s < 0) {
      const len = Math.hypot(mx, mz);
      const run = keys.has('Shift');
      const sp = (run ? RUN : SPEED) * dt;
      const vx = (mx / len) * sp;
      const vz = (mz / len) * sp;
      let moved = false;
      const stuck = blocked(self.x, self.z);
      if (stuck) {
        self.x += vx;
        self.z += vz;
        moved = true;
      } else if (!blocked(self.x + vx, self.z)) {
        self.x += vx;
        moved = true;
      }
      if (!stuck && !blocked(self.x, self.z + vz)) {
        self.z += vz;
        moved = true;
      }
      if (!moved && walkTo) {
        if (walkTo.sit != null && Math.hypot(walkTo.x - self.x, walkTo.z - self.z) < 2.4) sitOn(walkTo.sit);
        walkTo = null;
      }
      self.r = Math.atan2(mx, mz);
      self.w = moved;
      self.run = moved && run;
      if (moved) self.e = '';
    }
    if (self.e && now - self.et > (self.e === 'pulo' ? 1100 : 2200)) self.e = '';
    maybeSend(now);

    const mine = avatars.get(meKey);
    if (mine) mine.speaking = api.me().speaking;
    for (const [key, a] of avatars) animate(a, dt, t, key === meKey);

    const focus = new THREE.Vector3(self.x * 0.7, 0.8, self.z * 0.6 - 0.6);
    camTarget.lerp(focus, 1 - Math.exp(-dt * 4));
    camera.position.set(camTarget.x, camTarget.y + 7.6 * zoom, camTarget.z + 8.4 * zoom);
    camera.lookAt(camTarget);

    if (now - lastTv > 1000) {
      lastTv = now;
      drawTv();
    }
    arcT += dt;
    if (Math.floor(arcT * 20) !== Math.floor((arcT - dt) * 20)) drawArcade(arcT);
    R.bulbs.forEach((b, i) => b.scale.setScalar(0.8 + Math.max(0, Math.sin(t * 2 + i)) * 0.5));
    R.tvLight.intensity = tvKey === 'none' ? 1.2 : 2.5 + Math.sin(t * 3) * 0.4;
    renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(() => {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 58 : 44; // celular em pé: abre mais
    camera.updateProjectionMatrix();
  });
  ro.observe(box);

  refresh();
  frame();
  sendNow();

  return {
    handlePos(key, st) {
      if (!avatars.has(key)) refresh();
      const a = avatars.get(key);
      if (!a) return;
      if (!a.target) Object.assign(a, { x: st.x, z: st.z, r: st.r });
      a.target = st;
    },
    bubble(key, text) {
      const a = avatars.get(key);
      if (!a || !text) return;
      if (a.bubble) {
        a.holder.remove(a.bubble);
        disposeOwn(a.bubble);
      }
      a.bubble = bubbleSprite(text.slice(0, 140));
      a.bubble.position.y = (a.parts ? a.parts.height : 1.9) + 0.2;
      a.bubbleUntil = clock.elapsedTime + Math.min(9, 3 + text.length / 15);
      a.holder.add(a.bubble);
    },
    refresh,
    resendPos: sendNow,
    debug: () => [...avatars].map(([k, a]) => ({ k, x: +a.x.toFixed(2), z: +a.z.toFixed(2), parts: !!a.parts, model: a.parts && a.parts.model.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)), label: a.label.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(2)) })),
    destroy() {
      alive = false;
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
      removeEventListener('blur', onBlur);
      // modelos ficam no cache (abrir a sala de novo é rápido); o resto sai da placa de vídeo
      scene.traverse((o) => {
        if (o.isSkinnedMesh) return;
        if (o.isSprite || o.geometry?.type?.endsWith('Geometry')) {
          o.geometry?.dispose();
          for (const m of [].concat(o.material || [])) (m.map?.dispose(), m.dispose());
        }
      });
      mats.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

// ------------------------------------------------------------------ prévia girando no editor
export function preview(box, fig) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  box.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff3e0', '#6b5a7a', 1.8));
  const key = new THREE.DirectionalLight('#ffffff', 2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.2, 4.6);
  camera.lookAt(0, 0.9, 0);
  let parts = null;
  let token = 0;
  let drag = null;
  let rot = 0.4;
  function set(f) {
    const my = ++token;
    buildFigure(cleanFig(f)).then((p) => {
      if (my !== token) return;
      if (parts) scene.remove(parts.root);
      parts = p;
      parts.ring.visible = false;
      scene.add(parts.root);
      play(parts, 'idle', 0);
    });
  }
  set(fig);
  const c = renderer.domElement;
  c.addEventListener('pointerdown', (e) => ((drag = e.clientX), c.setPointerCapture(e.pointerId)));
  c.addEventListener('pointermove', (e) => {
    if (drag == null) return;
    rot += (e.clientX - drag) * 0.01;
    drag = e.clientX;
  });
  c.addEventListener('pointerup', () => (drag = null));
  let raf = 0;
  const clock = new THREE.Clock();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = clock.getDelta();
    if (drag == null) rot += 0.006;
    if (parts) {
      parts.root.rotation.y = rot;
      parts.mixer.update(dt);
    }
    renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(() => {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(box);
  loop();
  return {
    set,
    destroy() {
      token++;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.forceContextLoss();
      c.remove();
    },
  };
}

export { FIG };
window.JanjaRoom = { mount, preview, FIG, EMOTES };
