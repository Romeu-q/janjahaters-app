// Acampamento (a "sala de games"): uma clareira à noite com fogueira no meio, troncos para sentar, barracas e
// pinheiros, onde cada um do grupo aparece como um boneco. Tudo é voxel feito aqui no código: cada objeto é uma
// lista de cubinhos com cor que vira uma malha só (sem arquivos de modelo). Vai num arquivo separado
// (room.bundle.js, com o three.js dentro) e só carrega quando alguém abre: desligada nas configurações, nada
// disso fica na memória.
//
// O app chama window.JanjaRoom.mount(caixa, api) e recebe { handlePos, bubble, refresh, resendPos, destroy }.
// api: me(), people(), sendPos(estado), tv()
import * as THREE from 'three';
import { FIG, cleanFig } from './figure.js';

const V = 0.25; // tamanho do cubinho do cenário
const U = 0.09; // tamanho do cubinho dos bonecos (mais fino, para ter rosto)
const SPEED = 3.4;
const RUN = 6;
const RADIUS = 0.35;
const CLEARING = 9.6; // até onde dá para andar (raio a partir da fogueira)
export const EMOTES = ['tchau', 'danca', 'pulo', 'sim'];

// ------------------------------------------------------------------ voxel
// Vox guarda cubinhos (x, y, z inteiros) com cor; voxGeometry junta tudo numa malha só, desenhando só as faces que
// ficam para fora (a de dentro, encostada em outro cubinho, nunca aparece).
let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
class Vox {
  constructor() {
    this.m = new Map();
  }
  set(x, y, z, c) {
    this.m.set(x + ',' + y + ',' + z, c);
    return this;
  }
  has(x, y, z) {
    return this.m.has(x + ',' + y + ',' + z);
  }
  // caixa [x0, x1) × [y0, y1) × [z0, z1); a cor pode ser uma função (x, y, z) => cor
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
    return this;
  }
  ball(cx, cy, cz, r, c, sy = 1) {
    const R = Math.ceil(r);
    for (let x = -R; x <= R; x++)
      for (let y = -R; y <= R; y++)
        for (let z = -R; z <= R; z++) if (x * x + (y / sy) * (y / sy) + z * z <= r * r) this.set(cx + x, cy + y, cz + z, typeof c === 'function' ? c(x, y, z) : c);
    return this;
  }
}
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], s: 0.82 },
  { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], s: 0.78 },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.55 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: 0.92 },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: 0.7 },
];
// confere a ordem dos cantos (anti-horária vista de fora) uma vez só
for (const f of FACES) {
  const [a, b, c] = f.c;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (cr[0] * f.n[0] + cr[1] * f.n[1] + cr[2] * f.n[2] < 0) f.c.reverse();
}
const tmpColor = new THREE.Color();
function voxGeometry(vox, size, origin = [0, 0, 0], jitter = 0.05) {
  const pos = [];
  const nor = [];
  const col = [];
  const idx = [];
  for (const [key, c] of vox.m) {
    const [x, y, z] = key.split(',').map(Number);
    tmpColor.set(c);
    // cada cubinho com uma variação leve de tom (textura de voxel)
    const j = 1 + ((Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 100) / 100 - 0.5) * jitter * 2;
    for (const f of FACES) {
      if (vox.has(x + f.n[0], y + f.n[1], z + f.n[2])) continue;
      const base = pos.length / 3;
      for (const k of f.c) {
        pos.push((x + k[0] - origin[0]) * size, (y + k[1] - origin[1]) * size, (z + k[2] - origin[2]) * size);
        nor.push(...f.n);
        col.push(tmpColor.r * f.s * j, tmpColor.g * f.s * j, tmpColor.b * f.s * j);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
const VOX_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const GLOW_MAT = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
function voxMesh(vox, { size = V, origin, glow = false, shadow = true, jitter } = {}) {
  const m = new THREE.Mesh(voxGeometry(vox, size, origin, jitter), glow ? GLOW_MAT : VOX_MAT);
  m.castShadow = shadow && !glow;
  m.receiveShadow = !glow;
  return m;
}
// tom aleatório numa lista (folhas, pedras...)
const pickC = (list) => () => list[Math.floor(rnd() * list.length)];

// ------------------------------------------------------------------ modelos do cenário (em cubinhos de V)
function pine(h = 1) {
  const v = new Vox();
  const trunk = pickC(['#5b3a22', '#6b4429', '#4e3120']);
  const leaf = pickC(['#1f5c3a', '#24693f', '#1b5234', '#2c7a46']);
  v.box(-1, 0, -1, 1, 5, 1, trunk);
  let y = 4;
  for (const r of [5, 4.2, 3.4, 2.6, 1.8, 1]) {
    const R = Math.round(r * h);
    for (let dy = 0; dy < 3; dy++) {
      const rr = R - dy * 0.6;
      for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) if (x * x + z * z <= rr * rr) v.set(x, y + dy, z, leaf());
    }
    y += 2;
  }
  v.box(0, y, 0, 1, y + 2, 1, leaf);
  return v;
}
function roundTree() {
  const v = new Vox();
  v.box(-1, 0, -1, 1, 7, 1, pickC(['#6b4429', '#5b3a22']));
  v.ball(0, 9, 0, 4.2, pickC(['#3a8f4a', '#2f7d40', '#45a056', '#36884a']), 0.85);
  return v;
}
function rock(r = 2) {
  return new Vox().ball(0, 0, 0, r, pickC(['#7d828c', '#6c717b', '#8e939c', '#5f646d']), 0.6);
}
function bush() {
  return new Vox().ball(0, 1, 0, 2.2, pickC(['#2f7d40', '#3a8f4a', '#28703a']), 0.8);
}
function mushroom() {
  const v = new Vox();
  v.box(0, 0, 0, 1, 2, 1, '#f1e7d6');
  v.box(-1, 2, -1, 2, 3, 2, (x, y, z) => ((x + z) % 2 ? '#ffffff' : '#d64545'));
  v.set(0, 3, 0, '#d64545');
  return v;
}
function flower(c) {
  const v = new Vox();
  v.set(0, 0, 0, '#3a8f4a').set(0, 1, 0, '#3a8f4a').set(0, 2, 0, '#ffd166');
  for (const [x, z] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) v.set(x, 2, z, c);
  return v;
}
// tronco deitado para sentar (ao longo de x, centrado), 2 de altura
function log(len = 10) {
  const v = new Vox();
  const bark = pickC(['#6b4429', '#5b3a22', '#704a2d']);
  const x0 = -Math.floor(len / 2);
  for (let x = x0; x < x0 + len; x++)
    for (let y = 0; y < 2; y++) for (let z = -1; z < 2; z++) v.set(x, y, z, x === x0 || x === x0 + len - 1 ? (y === 1 && z === 0 ? '#c9a06a' : '#b88a55') : bark());
  return v;
}
function stump() {
  const v = new Vox();
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) for (let y = 0; y < 2; y++) v.set(x, y, z, y === 1 ? (x === 0 && z === 0 ? '#a77a4a' : '#c9a06a') : '#6b4429');
  return v;
}
// barraca em "A" virada para +z
function tent(color, dark) {
  const v = new Vox();
  const W = 7;
  const H = 9;
  for (let y = 0; y < H; y++) {
    const half = Math.round(W * (1 - y / H));
    for (let x = -half; x <= half; x++)
      for (let z = -6; z <= 6; z++) {
        const edge = Math.abs(x) >= half - 1 || z === -6 || z === 6;
        if (!edge) continue; // casca: por dentro é vazia
        let c = color;
        if (z === 6 && Math.abs(x) < half - 1 && y < H - 3) c = dark; // porta escura na frente
        v.set(x, y, z, c);
      }
  }
  for (const x of [-W - 2, W + 2]) for (const z of [-6, 6]) v.set(x, 0, z, '#8d6e4a'); // estaquinhas
  return v;
}
function lanternPost() {
  const v = new Vox();
  v.box(0, 0, 0, 1, 9, 1, '#5b3a22');
  v.box(0, 8, 0, 3, 9, 1, '#5b3a22');
  return v;
}
function lanternGlow() {
  return new Vox().box(0, 0, 0, 2, 3, 2, (x, y) => (y === 0 || y === 2 ? '#3a2a1a' : '#ffd27a'));
}
function cooler() {
  const v = new Vox();
  v.box(0, 0, 0, 4, 2, 3, '#3f7fd8');
  v.box(0, 2, 0, 4, 3, 3, '#f2f2f2');
  v.box(1, 3, 1, 3, 4, 2, '#d9d9d9');
  return v;
}
function radio() {
  const v = new Vox();
  v.box(0, 0, 0, 5, 3, 2, (x, y, z) => (z === 1 && (x === 1 || x === 3) && y === 1 ? '#111' : '#3d3d46'));
  v.box(0, 3, 0, 1, 7, 1, '#9aa0aa');
  return v;
}
function guitar() {
  const v = new Vox();
  v.ball(0, 2, 0, 2, '#c47a2c', 1);
  v.box(-1, 2, 2, 2, 3, 3, '#2b1d14'); // boca
  v.box(0, 4, 0, 1, 10, 1, '#5b3a22');
  v.box(-1, 10, 0, 2, 12, 1, '#2b1d14');
  return v;
}
function moon() {
  return new Vox().ball(0, 0, 0, 6, pickC(['#fff6d5', '#f3e9c3', '#fff9e6']));
}

// ------------------------------------------------------------------ boneco (em cubinhos de U)
// Coordenadas do boneco: x para a direita dele, y para cima, z para a frente (rosto em +z).
// Partes separadas para animar: pernas (pivô no quadril), braços (ombro), cabeça (pescoço).
function figureParts(fig) {
  const skin = fig.skin;
  const hairC = fig.hairColor;
  const eyeC = '#1b1b22';
  const parts = {};
  // pernas: 3 de largura, quadril em y=5
  for (const s of [-1, 1]) {
    const v = new Vox();
    const x0 = s < 0 ? -3 : 0;
    v.box(x0, 0, -1, x0 + 3, 5, 2, (x, y) => (y < 2 ? fig.shoes : fig.pants));
    v.box(x0, 0, 2, x0 + 3, 1, 3, fig.shoes); // biqueira
    parts[s < 0 ? 'legL' : 'legR'] = { vox: v, pivot: [x0 + 1.5, 5, 0.5] };
  }
  // tronco
  const torso = new Vox();
  torso.box(-4, 5, -2, 4, 11, 2, (x, y) => (y === 5 ? fig.pants : fig.shirt));
  parts.torso = { vox: torso, pivot: [0, 0, 0] };
  // braços: 2 de largura, ombro em y=11, mão embaixo
  for (const s of [-1, 1]) {
    const v = new Vox();
    const x0 = s < 0 ? -6 : 4;
    v.box(x0, 6, -1, x0 + 2, 11, 1, (x, y) => (y < 7 ? skin : fig.shirt));
    parts[s < 0 ? 'armL' : 'armR'] = { vox: v, pivot: [x0 + 1, 11, 0] };
  }
  // cabeça grandona: 10×10×10, pescoço em y=11
  const h = new Vox();
  h.box(-5, 11, -5, 5, 21, 5, skin);
  const F = 4; // camada do rosto (z = 4)
  const eye = (x0) => {
    if (fig.eyes === 'feliz') h.set(x0, 15, F, eyeC).set(x0 + 1, 16, F, eyeC).set(x0 + 2, 15, F, eyeC);
    else if (fig.eyes === 'sono') h.set(x0, 15, F, eyeC).set(x0 + 1, 15, F, eyeC).set(x0 + 2, 15, F, eyeC);
    else {
      const tall = fig.eyes === 'brilho' ? 3 : 2;
      for (let y = 15; y < 15 + tall; y++) h.set(x0, y, F, eyeC).set(x0 + 1, y, F, eyeC);
      h.set(x0 + 1, 14 + tall, F, '#ffffff');
      if (fig.eyes === 'brilho') h.set(x0, 15, F, '#ffffff');
    }
  };
  const wide = fig.eyes === 'feliz' || fig.eyes === 'sono';
  eye(wide ? -4 : -4);
  eye(wide ? 1 : 2);
  h.set(-4, 14, F, '#ff8fa3').set(3, 14, F, '#ff8fa3'); // bochechas
  if (fig.hair !== 'careca') {
    h.box(-5, 20, -5, 5, 22, 5, hairC); // topo
    h.box(-5, 13, -6, 5, 21, -5, hairC); // nuca
    for (const x of [-6, 5]) h.box(x, 16, -5, x + 1, 21, 1, hairC); // laterais
    h.box(-5, 19, F, 5, 20, F + 1, hairC); // franjinha
    if (fig.hair === 'franja' || fig.hair === 'longo') h.box(-5, 18, F, 5, 20, F + 1, hairC).box(-5, 17, F, -1, 18, F + 1, hairC);
    if (fig.hair === 'espetado') for (const [x, z] of [[-4, -3], [-1, -4], [2, -3], [-3, 1], [1, 0], [3, 2], [-1, 3]]) h.box(x, 22, z, x + 2, 24 + ((x + z + 8) % 2), z + 2, hairC);
    if (fig.hair === 'moicano') h.box(-1, 22, -5, 1, 25, 5, hairC);
    if (fig.hair === 'coque') h.box(-2, 22, -3, 2, 25, 1, hairC);
    if (fig.hair === 'longo') {
      h.box(-6, 8, -6, 6, 16, -4, hairC);
      for (const x of [-6, 5]) h.box(x, 10, -5, x + 1, 16, 2, hairC);
    }
    if (fig.hair === 'rabo') h.box(-1, 18, -7, 1, 20, -6, hairC).box(-1, 11, -8, 1, 19, -6, hairC);
  }
  if (fig.acc === 'gorro') {
    h.box(-6, 19, -6, 6, 24, 6, (x, y) => (y === 19 ? '#f2efe9' : y % 2 ? '#ef476f' : '#d63a5f'));
    h.box(-1, 24, -1, 1, 26, 1, '#f2efe9');
  } else if (fig.acc === 'bone') {
    h.box(-6, 20, -6, 6, 23, 6, '#ef476f');
    h.box(-5, 20, 6, 5, 21, 10, '#d63a5f');
  } else if (fig.acc === 'chapeu') {
    h.box(-8, 21, -8, 8, 22, 8, '#8b5e3c');
    h.box(-5, 22, -5, 5, 25, 5, '#9c6a44');
    h.box(-5, 22, -5, 5, 23, 5, '#2b1d14');
  } else if (fig.acc === 'oculos') {
    for (const x0 of [-5, 0]) {
      for (let x = x0; x < x0 + 5; x++) h.set(x, 18, F + 1, eyeC).set(x, 14, F + 1, eyeC);
      for (let y = 14; y < 19; y++) h.set(x0, y, F + 1, eyeC).set(x0 + 4, y, F + 1, eyeC);
    }
  } else if (fig.acc === 'fone') {
    h.box(-6, 22, 0, 6, 23, 1, '#2b2d42');
    for (const x of [-7, 5]) h.box(x, 14, -1, x + 2, 19, 2, '#ef476f');
  } else if (fig.acc === 'flor') {
    for (const [x, y] of [[3, 22], [5, 22], [4, 23], [4, 21]]) h.set(x, y, 2, '#ff8fab');
    h.set(4, 22, 2, '#ffd166');
  }
  parts.head = { vox: h, pivot: [0, 11, 0] };
  return parts;
}
function buildFigure(fig) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const groups = {};
  for (const [name, p] of Object.entries(figureParts(fig))) {
    const g = new THREE.Group();
    g.position.set(p.pivot[0] * U, p.pivot[1] * U, p.pivot[2] * U);
    g.add(voxMesh(p.vox, { size: U, origin: p.pivot, jitter: 0.02 }));
    body.add(g);
    groups[name] = g;
  }
  // boca separada (abre quando a pessoa fala)
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(2 * U, U, 0.3 * U), new THREE.MeshLambertMaterial({ color: '#5a2330' }));
  mouth.position.set(0, (13.5 - 11) * U, 5 * U + 0.01);
  groups.head.add(mouth);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), new THREE.MeshBasicMaterial({ color: '#3ddc84', transparent: true, opacity: 0.85 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  ring.visible = false;
  root.add(ring);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);
  return { root, body, ...groups, mouth, ring, height: 22 * U };
}
function disposeTree(o) {
  o.traverse((x) => {
    x.geometry?.dispose();
    if (x.isSprite) {
      x.material.map?.dispose();
      x.material.dispose();
    } else if (x.material && x.material !== VOX_MAT && x.material !== GLOW_MAT) x.material.dispose?.();
  });
}

// ------------------------------------------------------------------ etiquetas e balões
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function spriteFrom(c, scaleH, order) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set((c.width / c.height) * scaleH, scaleH, 1);
  s.renderOrder = order;
  return s;
}
function labelSprite(text, color) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = '600 34px system-ui, sans-serif';
  g.font = font;
  const w = Math.min(460, Math.ceil(g.measureText(text).width) + 44);
  c.width = w;
  c.height = 56;
  g.font = font;
  g.fillStyle = 'rgba(12,14,24,.72)';
  roundRect(g, 0, 0, w, 56, 28);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.arc(24, 28, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.textBaseline = 'middle';
  g.fillText(text, 40, 30, w - 52);
  return spriteFrom(c, 0.28, 10);
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
  const s = spriteFrom(c, h / 150, 11);
  s.center.set(0.5, 0);
  return s;
}

// ------------------------------------------------------------------ o acampamento
function buildCamp(scene) {
  seed = 7;
  const circles = []; // obstáculos: { x, z, r }
  const seats = []; // { x, z, r, y }
  const add = (vox, x, z, { ry = 0, y = 0, s = 1, solid = 0, glow = false, shadow = true } = {}) => {
    const m = voxMesh(vox, { glow, shadow });
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.scale.setScalar(s);
    scene.add(m);
    if (solid) circles.push({ x, z, r: solid * s });
    return m;
  };

  // chão: grama em blocos de 0,5 (topo em y=0), com a clareira de terra em volta da fogueira e a trilha
  const ground = new Vox();
  const grass = ['#3f7d3a', '#447f3c', '#3a7536', '#4a8a40', '#37702f'];
  const dirt = ['#7a5a3a', '#6e5133', '#836141', '#735638'];
  for (let x = -34; x < 34; x++)
    for (let z = -34; z < 34; z++) {
      const d = Math.hypot(x + 0.5, z + 0.5) / 2;
      if (d > 17) continue;
      const nearFire = d < 3 + Math.sin(x * 1.3 + z) * 0.4;
      const path = Math.abs(x + 0.5) < 1.6 && z > 8 && d < 15;
      const list = nearFire || path ? dirt : grass;
      ground.set(x, -1, z, list[Math.floor(rnd() * list.length)]);
    }
  scene.add(voxMesh(ground, { size: 0.5, shadow: false, jitter: 0.08 }));
  // tufinhos de grama
  const tufts = new Vox();
  for (let i = 0; i < 280; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 3.5 + rnd() * 12;
    const x = Math.round((Math.cos(a) * d) / V);
    const z = Math.round((Math.sin(a) * d) / V);
    if (Math.abs(x * V) < 0.9 && z * V > 4) continue;
    tufts.set(x, 0, z, rnd() < 0.5 ? '#4f9a45' : '#5aa84d');
    if (rnd() < 0.4) tufts.set(x, 1, z, '#62b154');
  }
  scene.add(voxMesh(tufts, { shadow: false }));

  // fogueira: anel de pedras, lenha cruzada e brasas (as chamas animadas vêm em makeFire)
  const ring = new Vox();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
    const x = Math.round(Math.cos(a) * 4.5);
    const z = Math.round(Math.sin(a) * 4.5);
    ring.box(x, 0, z, x + 1, 1 + (Math.round(a * 3) % 2), z + 1, pickC(['#7d828c', '#6c717b', '#8e939c']));
  }
  add(ring, 0, 0, { solid: 1.45 });
  const wood = new Vox();
  wood.box(-4, 0, -1, 4, 1, 1, '#5b3a22').box(-1, 1, -4, 1, 2, 4, '#6b4429').box(-3, 0, 2, 3, 1, 3, '#704a2d');
  add(wood, 0, 0);
  const embers = new Vox();
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (x * x + z * z <= 5 && rnd() < 0.8) embers.set(x, 0, z, rnd() < 0.5 ? '#ff7a1a' : '#ffb347');
  add(embers, 0, 0.02, { glow: true });

  // troncos e tocos em volta da fogueira (de frente para ela)
  const R = 3.4;
  const face = (a) => Math.atan2(-Math.cos(a), -Math.sin(a));
  const logAt = (a) => {
    const x = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    add(log(10), x, z, { ry: -(a + Math.PI / 2) });
    const tx = -Math.sin(a);
    const tz = Math.cos(a);
    for (const o of [-0.6, 0.6]) {
      seats.push({ x: x + tx * o, z: z + tz * o, r: face(a), y: 2 * V });
      circles.push({ x: x + tx * o, z: z + tz * o, r: 0.45 });
    }
  };
  logAt(Math.PI * 0.5 + 0.55);
  logAt(Math.PI * 0.5 - 0.55);
  logAt(Math.PI * 1.5 - 0.6);
  logAt(Math.PI * 1.5 + 0.6);
  const stumpAt = (a) => {
    const x = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    add(stump(), x, z, { solid: 0.4 });
    seats.push({ x, z, r: face(a), y: 2 * V });
  };
  stumpAt(0);
  stumpAt(Math.PI);

  // barracas
  add(tent('#f28c28', '#5a2d0c'), -5.6, -5.2, { ry: 0.75, solid: 2.1 });
  add(tent('#3f7fd8', '#14305c'), 5.4, -5.6, { ry: -0.7, solid: 2.1 });

  // coisas de acampamento
  add(cooler(), 2.4, -5.6, { ry: -0.4, solid: 0.55 });
  const radioMesh = add(radio(), -2.6, -5.9, { ry: 0.3, solid: 0.5 });
  add(guitar(), 5.2, 1.4, { ry: 0.6, s: 0.7 });
  add(lanternPost(), -3.4, 5.6, { solid: 0.25 });
  add(lanternGlow(), -3.4 + 0.5, 5.6 - 0.05, { y: 1.25, glow: true });
  const lanternLight = new THREE.PointLight('#ffcf7a', 3, 7, 1.6);
  lanternLight.position.set(-2.8, 1.7, 5.65);
  scene.add(lanternLight);
  for (let i = 0; i < 4; i++) add(mushroom(), -8 + rnd() * 2, 1 + rnd() * 3, { s: 0.6 });
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 5.5 + rnd() * 3.5;
    add(flower(['#ff8fab', '#ffd166', '#c9c2f2', '#ffffff'][i % 4]), Math.cos(a) * d, Math.sin(a) * d, { shadow: false, s: 0.45 });
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 6.5 + rnd() * 3;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (Math.abs(x) < 2 && z > 5) continue;
    add(rock(1.5 + rnd() * 1.5), x, z, { solid: 0.4 });
  }

  // anel de árvores em volta da clareira (a trilha da frente fica aberta para a câmera)
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + rnd() * 0.12;
    const d = 10.4 + rnd() * 4.5;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (Math.abs(x) < 3 && z > 0) continue;
    const round = rnd() < 0.25;
    add(round ? roundTree() : pine(0.9 + rnd() * 0.3), x, z, { s: 0.9 + rnd() * 0.5, solid: 0.5, ry: rnd() * 6 });
    if (rnd() < 0.5) add(bush(), x + (rnd() - 0.5) * 2, z + (rnd() - 0.5) * 2, { shadow: false });
  }

  // céu: lua e estrelas
  add(moon(), -16, -30, { y: 18, glow: true, shadow: false });
  const starPos = [];
  for (let i = 0; i < 500; i++) {
    const a = rnd() * Math.PI * 2;
    const e = 0.15 + rnd() * 0.85;
    starPos.push(Math.cos(a) * 60 * Math.cos(e), 8 + Math.sin(e) * 40, Math.sin(a) * 60 * Math.cos(e));
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.25, fog: false })));

  return { circles, seats, radio: radioMesh, lanternLight };
}

// chamas: cubinhos que sobem, encolhem e mudam de cor (amarelo -> laranja -> vermelho), mais faíscas
function makeFire(scene) {
  const N = 46;
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ toneMapped: false }), N);
  inst.frustumCulled = false;
  scene.add(inst);
  const ps = Array.from({ length: N }, () => ({}));
  const reset = (p) => {
    p.x = (Math.random() - 0.5) * 0.7;
    p.z = (Math.random() - 0.5) * 0.7;
    p.y = 0.1;
    p.v = 0.9 + Math.random() * 0.9;
    p.size = 0.18 + Math.random() * 0.16;
    p.life = 0;
    p.max = 0.7 + Math.random() * 0.6;
  };
  ps.forEach((p) => (reset(p), (p.life = Math.random() * p.max)));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const sc = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const cY = new THREE.Color('#ffe066');
  const cO = new THREE.Color('#ff8a1f');
  const cR = new THREE.Color('#c8321e');
  const c = new THREE.Color();
  const light = new THREE.PointLight('#ff9a3c', 22, 16, 1.5);
  light.position.set(0, 1.1, 0);
  scene.add(light);
  const SN = 40;
  const sparkGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(SN * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: '#ffcf70', size: 0.08, toneMapped: false }));
  sparks.frustumCulled = false;
  scene.add(sparks);
  const sv = Array.from({ length: SN }, () => Math.random() * 3);
  return (dt, t) => {
    for (let i = 0; i < N; i++) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.max) reset(p);
      const k = p.life / p.max;
      p.y += p.v * dt;
      p.x *= 1 - dt * 1.2;
      p.z *= 1 - dt * 1.2;
      const s = p.size * (1 - k * 0.85);
      pos.set(p.x + Math.sin(t * 7 + i) * 0.03, p.y, p.z);
      q.setFromAxisAngle(up, i);
      sc.set(s, s, s);
      m.compose(pos, q, sc);
      inst.setMatrixAt(i, m);
      c.copy(k < 0.4 ? cY : cO).lerp(k < 0.4 ? cO : cR, k < 0.4 ? k / 0.4 : (k - 0.4) / 0.6);
      inst.setColorAt(i, c);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    for (let i = 0; i < SN; i++) {
      sv[i] += dt;
      const life = (sv[i] % 2.6) / 2.6;
      const a = i * 2.39;
      sp[i * 3] = Math.cos(a) * (0.2 + life * 0.6) + Math.sin(t + i) * 0.1;
      sp[i * 3 + 1] = 0.5 + life * 3.2;
      sp[i * 3 + 2] = Math.sin(a) * (0.2 + life * 0.6);
    }
    sparkGeo.attributes.position.needsUpdate = true;
    light.intensity = 20 + Math.sin(t * 13) * 2.5 + Math.sin(t * 7.3) * 2 + Math.random() * 1.5;
  };
}
// vaga-lumes piscando perto das árvores
function makeFireflies(scene) {
  const N = 36;
  const geo = new THREE.BufferGeometry();
  const p = new Float32Array(N * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ color: '#d8ff7a', size: 0.12, transparent: true, opacity: 0.9, toneMapped: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  const f = Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2 + Math.random(), d: 6 + Math.random() * 5, h: 0.6 + Math.random() * 2, s: 0.2 + Math.random() * 0.4 }));
  return (dt, t) => {
    for (let i = 0; i < N; i++) {
      const o = f[i];
      const a = o.a + t * o.s * 0.15;
      p[i * 3] = Math.cos(a) * o.d + Math.sin(t * o.s * 2 + i) * 0.5;
      p[i * 3 + 1] = o.h + Math.sin(t * 1.3 + i) * 0.3;
      p[i * 3 + 2] = Math.sin(a) * o.d + Math.cos(t * o.s * 2 + i) * 0.5;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = 0.55 + Math.sin(t * 3) * 0.35;
  };
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
  scene.background = new THREE.Color('#0d1430');
  scene.fog = new THREE.Fog('#0d1430', 20, 46);
  scene.add(new THREE.HemisphereLight('#6a80c4', '#2a1e14', 1.25));
  const moonLight = new THREE.DirectionalLight('#a9bfff', 1.2);
  moonLight.position.set(-8, 14, -10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  Object.assign(moonLight.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 50 });
  moonLight.shadow.bias = -0.001;
  scene.add(moonLight);
  // luz fraquinha do lado da câmera: o rosto dos bonecos aparece mesmo de costas para o fogo
  const fill = new THREE.DirectionalLight('#ffd9b0', 0.55);
  fill.position.set(0, 6, 14);
  scene.add(fill);
  const CAMP = buildCamp(scene);
  const fire = makeFire(scene);
  const flies = makeFireflies(scene);

  // placa da música em cima do rádio
  let radioSign = null;
  let radioKey = '';
  function drawRadio() {
    const info = api.tv();
    const key = info ? info.title + '|' + info.artist + '|' + info.playing : '';
    if (key === radioKey) return;
    radioKey = key;
    if (radioSign) {
      scene.remove(radioSign);
      disposeTree(radioSign);
      radioSign = null;
    }
    if (!info) return;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const t1 = (info.playing ? '♪ ' : '❚❚ ') + info.title.slice(0, 40);
    const t2 = (info.artist || '').slice(0, 40);
    g.font = '700 30px system-ui, sans-serif';
    c.width = Math.min(640, Math.max(g.measureText(t1).width, 200) + 40);
    c.height = t2 ? 92 : 58;
    g.fillStyle = 'rgba(12,14,24,.78)';
    roundRect(g, 0, 0, c.width, c.height, 18);
    g.fill();
    g.fillStyle = '#ffd166';
    g.font = '700 30px system-ui, sans-serif';
    g.textBaseline = 'top';
    g.fillText(t1, 20, 12, c.width - 40);
    if (t2) {
      g.fillStyle = 'rgba(255,255,255,.8)';
      g.font = '500 24px system-ui, sans-serif';
      g.fillText(t2, 20, 52, c.width - 40);
    }
    radioSign = spriteFrom(c, c.height / 190, 9);
    radioSign.position.copy(CAMP.radio.position).add(new THREE.Vector3(0.6, 2.4, 0));
    scene.add(radioSign);
  }

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
  let zoom = 1;
  const camTarget = new THREE.Vector3(0, 0.8, 0);

  // ---------------- bonecos
  const avatars = new Map();
  const meKey = 'me';
  const meId = String(api.me().uid || '');
  let hh = 0;
  for (const c of meId) hh = (hh * 31 + c.charCodeAt(0)) >>> 0;
  // cada um chega por um lugar diferente da trilha da frente, virado para a câmera
  const self = { x: -1.2 + (hh % 7) * 0.4, z: 6.4 + ((hh >> 4) % 3) * 0.7, r: 0, s: -1, w: false, run: false, e: '', et: 0 };
  let walkTo = null;
  function ensureAvatar(key, p) {
    let a = avatars.get(key);
    if (!a) {
      a = { key, x: p.pos?.x ?? 0, z: p.pos?.z ?? 6.5, r: p.pos?.r ?? 0, phase: Math.random() * 6, walkAmt: 0, holder: new THREE.Group() };
      avatars.set(key, a);
      scene.add(a.holder);
    }
    const fig = cleanFig(p.fig, p.color, p.uid);
    const figKey = JSON.stringify(fig);
    if (a.figKey !== figKey) {
      if (a.parts) {
        a.holder.remove(a.parts.root);
        disposeTree(a.parts.root);
      }
      a.parts = buildFigure(fig);
      a.holder.add(a.parts.root);
      a.figKey = figKey;
    }
    const labelKey = p.name + p.color;
    if (a.labelKey !== labelKey) {
      if (a.label) {
        a.holder.remove(a.label);
        disposeTree(a.label);
      }
      a.label = labelSprite(p.name, p.color || '#5b7bf0');
      a.label.position.y = a.parts.height + 0.45;
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
        const st = p.pos || { x: -1.2 + (i % 5) * 0.7, z: 7 + Math.floor(i / 5) * 0.8, r: 0, s: -1, w: false, e: '' };
        ensureAvatar(p.key, { ...p, pos: st }).target = st;
      } else ensureAvatar(p.key, p);
    }
    for (const [key, a] of avatars)
      if (!keep.has(key)) {
        scene.remove(a.holder);
        disposeTree(a.holder);
        avatars.delete(key);
      }
  }

  // ---------------- colisão (clareira redonda + trilha da frente + obstáculos redondos)
  function blocked(x, z) {
    if (Math.hypot(x, z) > CLEARING && !(Math.abs(x) < 1.4 && z > 0 && z < 12)) return true;
    for (const o of CAMP.circles) if (Math.hypot(x - o.x, z - o.z) < o.r + RADIUS) return true;
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
  const EMOTE_KEYS = { Digit1: 'tchau', Digit2: 'danca', Digit3: 'pulo', Digit4: 'sim' };
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
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();
  renderer.domElement.addEventListener('pointerdown', (e) => {
    renderer.domElement.focus();
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(groundPlane, hitPoint)) return;
    const seat = nearestSeat(hitPoint.x, hitPoint.z, 1.1);
    walkTo = seat != null ? { x: CAMP.seats[seat].x, z: CAMP.seats[seat].z, sit: seat } : { x: hitPoint.x, z: hitPoint.z };
    if (self.s >= 0) standUp();
  });
  renderer.domElement.addEventListener(
    'wheel',
    (e) => {
      zoom = Math.min(1.7, Math.max(0.5, zoom * (e.deltaY > 0 ? 1.08 : 0.93)));
      e.preventDefault();
    },
    { passive: false },
  );
  function nearestSeat(x, z, max) {
    let best = null;
    let bd = max;
    const taken = new Set([...avatars.entries()].filter(([k]) => k !== meKey).map(([, a]) => a.target?.s));
    CAMP.seats.forEach((s, i) => {
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < bd && !taken.has(i)) (bd = d), (best = i);
    });
    return best;
  }
  function sitOn(i) {
    const s = CAMP.seats[i];
    Object.assign(self, { s: i, x: s.x, z: s.z, r: s.r, e: '' });
    walkTo = null;
    sendNow();
  }
  function standUp() {
    if (self.s < 0) return;
    const s = CAMP.seats[self.s];
    self.s = -1;
    // levanta para trás do tronco (longe do fogo); se não der, para a frente
    for (const k of [-0.9, 0.9]) {
      const fx = s.x + Math.sin(s.r) * k;
      const fz = s.z + Math.cos(s.r) * k;
      if (!blocked(fx, fz)) {
        Object.assign(self, { x: fx, z: fz });
        break;
      }
    }
    sendNow();
  }
  function toggleSit() {
    if (self.s >= 0) return standUp();
    const i = nearestSeat(self.x, self.z, 1.6);
    if (i != null) sitOn(i);
  }
  function emote(e) {
    if (self.s >= 0 && (e === 'pulo' || e === 'danca')) return;
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

  // ---------------- animação
  const clock = new THREE.Clock();
  let raf = 0;
  let running = true;
  let lastRadio = 0;
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
    const seat = st.s >= 0 ? CAMP.seats[st.s] : null;
    const P = a.parts;
    const moving = !seat && (isMe ? self.w : st.w || Math.hypot(st.x - a.x, st.z - a.z) > 0.06);
    a.walkAmt += ((moving ? 1 : 0) - a.walkAmt) * (1 - Math.exp(-dt * 10));
    a.phase += dt * (moving ? (st.run ? 15 : 10) : 2);
    const sw = Math.sin(a.phase) * a.walkAmt;
    // sentado: o quadril (y = 5U) fica na altura do assento
    a.holder.position.set(a.x, seat ? seat.y - 5 * U + 0.02 : 0, a.z);
    a.holder.rotation.y = a.r;
    P.body.position.y = Math.abs(Math.sin(a.phase)) * 0.07 * a.walkAmt + (moving ? 0 : Math.sin(t * 2 + a.phase) * 0.008);
    P.body.rotation.y *= 0.85;
    P.legL.rotation.x = seat ? -Math.PI / 2 : sw * 0.7;
    P.legR.rotation.x = seat ? -Math.PI / 2 : -sw * 0.7;
    P.armL.rotation.set(seat ? -0.5 : -sw * 0.8, 0, 0);
    P.armR.rotation.set(seat ? -0.5 : sw * 0.8, 0, 0);
    P.head.rotation.set(0, 0, 0);
    const e = st.e;
    if (e === 'tchau') P.armR.rotation.set(0, 0, 2.7 + Math.sin(t * 14) * 0.35);
    else if (e === 'danca') {
      P.body.rotation.y = Math.sin(t * 6) * 0.6;
      P.body.position.y = Math.abs(Math.sin(t * 6)) * 0.14;
      P.armL.rotation.set(0, 0, -2.4 + Math.sin(t * 12) * 0.4);
      P.armR.rotation.set(0, 0, 2.4 - Math.sin(t * 12) * 0.4);
    } else if (e === 'pulo') {
      P.body.position.y = Math.abs(Math.sin(t * 7)) * 0.5;
      P.armL.rotation.set(0, 0, -2.8);
      P.armR.rotation.set(0, 0, 2.8);
    } else if (e === 'sim') P.head.rotation.x = Math.sin(t * 12) * 0.25;
    // falando na call: boca abre e fecha, cabeça balança e anel verde no chão
    const talk = a.speaking;
    P.mouth.scale.y = talk ? 1 + Math.abs(Math.sin(t * 18)) * 1.8 : 1;
    if (talk && e !== 'sim') P.head.rotation.z = Math.sin(t * 5) * 0.06;
    P.ring.visible = !!talk;
    if (a.bubble) {
      if (t > a.bubbleUntil) {
        a.holder.remove(a.bubble);
        disposeTree(a.bubble);
        a.bubble = null;
        a.label.visible = true;
      } else a.label.visible = false;
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
      if (blocked(self.x, self.z)) {
        // nasceu ou ficou dentro de algo: deixa sair
        self.x += vx;
        self.z += vz;
        moved = true;
      } else {
        if (!blocked(self.x + vx, self.z)) {
          self.x += vx;
          moved = true;
        }
        if (!blocked(self.x, self.z + vz)) {
          self.z += vz;
          moved = true;
        }
      }
      if (!moved && walkTo) {
        if (walkTo.sit != null && Math.hypot(walkTo.x - self.x, walkTo.z - self.z) < 1.6) sitOn(walkTo.sit);
        walkTo = null;
      }
      self.r = Math.atan2(mx, mz);
      self.w = moved;
      self.run = moved && run;
      if (moved) self.e = '';
    }
    if (self.e && now - self.et > 2400) self.e = '';
    maybeSend(now);

    const mine = avatars.get(meKey);
    if (mine) mine.speaking = api.me().speaking;
    for (const [key, a] of avatars) animate(a, dt, t, key === meKey);

    fire(dt, t);
    flies(dt, t);
    CAMP.lanternLight.intensity = 3 + Math.sin(t * 2.3) * 0.3;

    const focus = new THREE.Vector3(self.x * 0.6, 0.8, self.z * 0.55 - 0.4);
    camTarget.lerp(focus, 1 - Math.exp(-dt * 4));
    camera.position.set(camTarget.x, camTarget.y + 7.6 * zoom, camTarget.z + 9.4 * zoom);
    camera.lookAt(camTarget);

    if (now - lastRadio > 1000) {
      lastRadio = now;
      drawRadio();
    }
    renderer.render(scene, camera);
  }
  const ro = new ResizeObserver(() => {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 60 : 44; // celular em pé: abre mais
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
        disposeTree(a.bubble);
      }
      a.bubble = bubbleSprite(text.slice(0, 140));
      a.bubble.position.y = a.parts.height + 0.35;
      a.bubbleUntil = clock.elapsedTime + Math.min(9, 3 + text.length / 15);
      a.holder.add(a.bubble);
    },
    refresh,
    resendPos: sendNow,
    debug: () => [...avatars].map(([k, a]) => ({ k, x: +a.x.toFixed(2), z: +a.z.toFixed(2), s: k === meKey ? self.s : a.target?.s })),
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
      removeEventListener('blur', onBlur);
      disposeTree(scene);
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
  box.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff3e0', '#6b5a7a', 2.2));
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(2, 3, 4);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.2, 6.2);
  camera.lookAt(0, 1.05, 0);
  let parts = null;
  let drag = null;
  let rot = 0.4;
  function set(f) {
    if (parts) {
      scene.remove(parts.root);
      disposeTree(parts.root);
    }
    parts = buildFigure(cleanFig(f));
    parts.ring.visible = false;
    scene.add(parts.root);
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
    const t = clock.getElapsedTime();
    if (drag == null) rot += 0.006;
    parts.root.rotation.y = rot;
    parts.body.position.y = Math.sin(t * 2) * 0.01;
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
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposeTree(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      c.remove();
    },
  };
}

export { FIG };
window.JanjaRoom = { mount, preview, FIG, EMOTES };
