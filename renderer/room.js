// Acampamento (a "sala de games"): uma clareira à noite com fogueira no meio, troncos para sentar, barracas e
// pinheiros, onde cada um do grupo aparece como um boneco. Tudo é voxel feito aqui no código: cada objeto é uma
// lista de cubinhos com cor que vira uma malha só (sem arquivos de modelo). Vai num arquivo separado
// (room.bundle.js, com o three.js dentro) e só carrega quando alguém abre: desligada nas configurações, nada
// disso fica na memória.
//
// O app chama window.JanjaRoom.mount(caixa, api) e recebe { handlePos, bubble, refresh, resendPos, destroy }.
// api: me(), people(), sendPos(estado), tv()
import * as THREE from 'three';
import { FIG, cleanFig, hasShield } from './figure.js';

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

// ------------------------------------------------------------------ arsenal do PvP
// kind: 'melee' (golpe na hora) ou 'shot' (projétil). arc: cosseno mínimo do ângulo do golpe (maior = mais reto)
export const WEAPONS = {
  curta: { kind: 'melee', dmg: 15, range: 1.7, arc: 0.4, cd: 0.4, anim: 'swing', info: 'Rápida e leve: dano 15, alcance curto. Aceita escudo.' },
  longa: { kind: 'melee', dmg: 28, range: 2.4, arc: 0.15, cd: 0.85, anim: 'swing', info: 'Duas mãos: dano 28, alcance grande e golpe largo, mas lenta.' },
  lanca: { kind: 'melee', dmg: 20, range: 2.8, arc: 0.8, cd: 0.65, anim: 'thrust', info: 'Estocada de longe, bem reta: dano 20. Aceita escudo.' },
  machado: { kind: 'melee', dmg: 34, range: 1.8, arc: 0.3, cd: 1.05, anim: 'swing', info: 'Duas mãos: dano 34, muito lento.' },
  arco: { kind: 'shot', dmg: 18, speed: 17, cd: 0.9, anim: 'bow', hit: 0.5, color: '#e8c38a', info: 'Flecha rápida de longe: dano 18.' },
  fogo: { kind: 'shot', dmg: 26, speed: 9, cd: 1.4, anim: 'cast', hit: 0.8, color: '#ff8a1f', info: 'Bola de fogo lenta e forte: dano 26.' },
  gelo: { kind: 'shot', dmg: 12, speed: 12, cd: 1.0, anim: 'cast', hit: 0.6, color: '#8fdcff', slow: 2, info: 'Dano 12 e deixa o alvo lento por 2 s.' },
};
const W = (w) => WEAPONS[w] || WEAPONS.curta;
// arma na mão direita: feita "em pé" (y para cima) a partir do cabo e virada para a frente
function weaponMesh(wp) {
  const g = new THREE.Group();
  const add = (v, glow) => g.add(voxMesh(v, { size: U, origin: [0.5, 0, 0.5], jitter: 0, glow }));
  const steel = (x, y) => (y % 3 ? '#dfe6ee' : '#c4ccd6');
  let upright = false;
  if (wp === 'curta') add(new Vox().box(0, -2, 0, 1, 0, 1, '#5b3a22').box(-1, 0, 0, 2, 1, 1, '#c9a227').box(0, 1, 0, 1, 8, 1, steel).set(0, 8, 0, '#ffffff'));
  else if (wp === 'longa') add(new Vox().box(0, -3, 0, 1, 0, 1, '#3b2a1e').box(-2, 0, 0, 3, 1, 1, '#c9a227').box(-1, 1, 0, 2, 13, 1, steel).set(0, 13, 0, '#ffffff').set(0, 14, 0, '#ffffff'));
  else if (wp === 'lanca') add(new Vox().box(0, -7, 0, 1, 15, 1, '#7a5236').set(0, 14, 0, '#c9a227').box(-1, 15, 0, 2, 17, 1, '#c4ccd6').box(0, 17, 0, 1, 19, 1, '#dfe6ee'));
  else if (wp === 'machado') add(new Vox().box(0, -3, 0, 1, 11, 1, '#7a5236').box(1, 7, 0, 5, 11, 1, (x) => (x === 4 ? '#f2f2f2' : '#9aa3ad')).box(-2, 8, 0, 0, 10, 1, '#9aa3ad'));
  else if (wp === 'arco') {
    // arco em pé: o meio fica na mão e as pontas voltam para quem atira; a corda liga as pontas
    upright = true;
    const v = new Vox();
    for (let z = -9; z <= 9; z++) {
      const y = Math.round(3 * (z / 9) ** 2);
      v.set(0, y, z, Math.abs(z) <= 1 ? '#3b2a1e' : '#8b5e3c');
      v.set(0, 3, z, '#f2efe9');
    }
    add(v);
  } else {
    // cajado com a pedra brilhando na ponta (fogo laranja, gelo azul)
    add(new Vox().box(0, -4, 0, 1, 12, 1, '#6b4429').box(-1, 11, -1, 2, 12, 2, '#c9a227'));
    const tones = wp === 'fogo' ? ['#ffb347', '#ff7a1a', '#ffe066'] : ['#bdf0ff', '#7fd6ff', '#e8fbff'];
    add(new Vox().ball(0, 14, 0, 1.6, (x, y, z) => tones[Math.abs(x * 3 + y * 5 + z * 7) % 3]), true);
  }
  if (!upright) g.rotation.x = Math.PI / 2;
  g.position.set(0, -4.5 * U, 0);
  return g;
}
// escudo redondo no braço esquerdo, virado para a frente
function shieldMesh() {
  const v = new Vox();
  for (let x = -4; x <= 4; x++)
    for (let y = -4; y <= 4; y++) {
      const d = Math.hypot(x, y);
      if (d > 4.4) continue;
      v.set(x, y, 0, d > 3.4 ? '#9aa3ad' : x === 0 || y === 0 ? '#c9a227' : '#8b5e3c');
    }
  v.set(0, 0, 1, '#c9a227');
  const m = voxMesh(v, { size: U, origin: [0.5, 0.5, 0], jitter: 0.03 });
  m.position.set(-1.4 * U, -4 * U, 1.4 * U);
  return m;
}
// guarda-roupa do acampamento: portas abertas, roupas penduradas e armas do lado
function wardrobe() {
  const v = new Vox();
  const wood = pickC(['#8b5e3c', '#7f5537', '#94653f']);
  v.box(-4, 0, -2, 4, 1, 2, wood).box(-4, 12, -2, 4, 13, 2, wood); // base e topo
  v.box(-4, 1, -2, -3, 12, 2, wood).box(3, 1, -2, 4, 12, 2, wood).box(-3, 1, -2, 3, 12, -1, wood); // laterais e fundo
  v.box(-3, 10, 0, 3, 11, 1, '#c9a227'); // cabideiro
  ['#ef476f', '#3f7fd8', '#06d6a0', '#ffd166', '#9b5de5'].forEach((c, i) => v.box(-3 + i + (i > 2 ? 0 : 0), 5, 0, -2 + i, 10, 1, c)); // roupas
  v.box(-7, 1, 2, -4, 12, 3, wood).box(4, 1, 2, 7, 12, 3, wood); // portas abertas
  v.set(-6, 7, 3, '#c9a227').set(5, 7, 3, '#c9a227'); // puxadores
  // espada e escudo encostados do lado
  v.box(5, 0, 4, 6, 9, 5, (x, y) => (y < 2 ? '#5b3a22' : y === 2 ? '#c9a227' : '#dfe6ee'));
  for (let x = -7; x <= -3; x++) for (let y = 0; y <= 4; y++) if (Math.hypot(x + 5, y - 2) <= 2.6) v.set(x, y, 4, Math.hypot(x + 5, y - 2) > 1.8 ? '#9aa3ad' : '#8b5e3c');
  return v;
}

// ------------------------------------------------------------------ monstros
// hp: vida, dmg: dano do golpe, reach: alcance, cd: tempo entre golpes, h: altura (para a barra de vida)
const MOBS = [
  { name: 'Slime', hp: 30, dmg: 8, speed: 1.7, reach: 1.1, cd: 1.5, h: 1.0 },
  { name: 'Esqueleto', hp: 50, dmg: 12, speed: 2.1, reach: 1.4, cd: 1.7, h: 2.2 },
  { name: 'Morcego', hp: 20, dmg: 6, speed: 3.3, reach: 1.1, cd: 1.2, h: 2.3, fly: true },
];
const MU = 0.1; // cubinho dos monstros
// cada monstro: lista de partes { vox, pivot } (como o boneco), para animar e para desmontar quando morre
function mobParts(type) {
  const parts = {};
  if (type === 0) {
    const greens = ['#5ad35a', '#4cc24f', '#69e06a', '#43b246'];
    const v = new Vox().ball(0, 4, 0, 4, (x, y, z) => greens[Math.abs(x * 7 + y * 3 + z * 5) % 4], 0.8);
    for (const x of [-2, 1]) v.set(x, 5, 3, '#14321a').set(x + 1, 5, 3, '#14321a').set(x, 4, 3, '#14321a').set(x + 1, 4, 3, '#14321a').set(x + 1, 5, 3, '#ffffff');
    v.set(0, 2, 4, '#14321a').set(-1, 2, 4, '#14321a');
    parts.body = { vox: v, pivot: [0, 0, 0] };
  } else if (type === 1) {
    const bone = (x, y, z) => ((x + y + z) % 5 ? '#ebe6d6' : '#d6d0bd');
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -2 : 1;
      parts[s < 0 ? 'legL' : 'legR'] = { vox: new Vox().box(x0, 0, 0, x0 + 1, 6, 1, bone).box(x0 - 1, 0, 0, x0 + 1, 1, 2, bone), pivot: [x0 + 0.5, 6, 0.5] };
      const ax = s < 0 ? -5 : 4;
      parts[s < 0 ? 'armL' : 'armR'] = { vox: new Vox().box(ax, 6, 0, ax + 1, 12, 1, bone), pivot: [ax + 0.5, 12, 0.5] };
    }
    const torso = new Vox();
    torso.box(0, 6, 0, 1, 13, 1, '#d6d0bd'); // coluna
    for (let y = 8; y < 13; y += 2) torso.box(-3, y, -1, 4, y + 1, 2, bone); // costelas
    torso.box(-2, 6, -1, 3, 7, 2, bone); // bacia
    parts.torso = { vox: torso, pivot: [0, 0, 0] };
    const head = new Vox().box(-3, 13, -3, 4, 20, 4, bone);
    for (const x of [-2, 1]) head.box(x, 16, 3, x + 2, 18, 4, '#1b1b22');
    head.set(0, 15, 3, '#3a3a40');
    for (let x = -2; x <= 2; x++) head.set(x, 13, 3, x % 2 ? '#3a3a40' : '#ebe6d6');
    parts.head = { vox: head, pivot: [0, 13, 0] };
  } else {
    const fur = (x, y, z) => ((x + y + z) % 3 ? '#3b2a4f' : '#4a3762');
    const body = new Vox().ball(0, 0, 0, 2.2, fur);
    body.set(-1, 0, 2, '#ff3b3b').set(1, 0, 2, '#ff3b3b'); // olhos
    body.set(-1, 3, 0, '#3b2a4f').set(1, 3, 0, '#3b2a4f'); // orelhas
    parts.body = { vox: body, pivot: [0, 0, 0] };
    for (const s of [-1, 1]) {
      const w = new Vox();
      for (let i = 1; i <= 6; i++) for (let z = -2; z <= Math.max(-1, 2 - Math.floor(i / 2)); z++) w.set(s * (i + 1), 0, z, i % 3 === 0 ? '#2a1d38' : '#5a4378');
      parts[s < 0 ? 'wingL' : 'wingR'] = { vox: w, pivot: [s * 1.5, 0, 0] };
    }
  }
  return parts;
}
function buildMob(type) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const groups = {};
  const parts = mobParts(type);
  for (const [name, p] of Object.entries(parts)) {
    const g = new THREE.Group();
    g.position.set(p.pivot[0] * MU, p.pivot[1] * MU, p.pivot[2] * MU);
    g.add(voxMesh(p.vox, { size: MU, origin: p.pivot, jitter: 0.03 }));
    body.add(g);
    groups[name] = g;
  }
  return { root, body, groups, parts };
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
  // arma (e escudo, se for de uma mão): só aparecem no PvP
  const weapon = weaponMesh(fig.wp);
  weapon.visible = false;
  groups.armR.add(weapon);
  const shield = hasShield(fig) ? shieldMesh() : null;
  if (shield) {
    shield.visible = false;
    groups.armL.add(shield);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 32), new THREE.MeshBasicMaterial({ color: '#3ddc84', transparent: true, opacity: 0.85 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  ring.visible = false;
  root.add(ring);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);
  return { root, body, ...groups, mouth, ring, weapon, shield, wp: fig.wp, armRz: groups.armR.position.z, height: 22 * U };
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
function rollSprite(r) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const isCrit = r.crit === 'crit';
  const isFumble = r.crit === 'fumble';
  const accent = isCrit ? '#ff9a1f' : isFumble ? '#f05454' : r.passed === false ? '#f05454' : r.passed === true ? '#4fd18b' : '#5b7bf0';
  const title = `${r.label}${r.ptsSym ? ' ' + r.ptsSym : ''}`;
  const dicePart = r.dice?.length ? `[${r.dice.join(' · ')}]` : '[0d6]';
  const mod = r.bonus ? (r.bonus > 0 ? `+${r.bonus}` : `${r.bonus}`) : '';
  const sub = `${dicePart} + ${r.attrVal} ${r.attrShort}${mod} = ${r.total}`;
  const badge = isCrit ? 'CRÍTICO DECISIVO!' : isFumble ? 'FALHA CRÍTICA!' : r.dif ? (r.passed ? `PASSOU (Dif ${r.dif})` : `FALHOU (Dif ${r.dif})`) : '';
  g.font = '700 28px system-ui, sans-serif';
  const w1 = g.measureText(title).width;
  g.font = '800 34px system-ui, sans-serif';
  const w2 = g.measureText(sub).width;
  g.font = '800 22px system-ui, sans-serif';
  const w3 = badge ? g.measureText(badge).width : 0;
  const w = Math.max(260, Math.ceil(Math.max(w1, w2, w3)) + 56);
  const h = (badge ? 132 : 102) + 16;
  c.width = w;
  c.height = h;
  g.fillStyle = '#161822';
  roundRect(g, 0, 0, w, h - 14, 24);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = accent;
  roundRect(g, 2, 2, w - 4, h - 18, 22);
  g.stroke();
  g.fillStyle = accent;
  g.beginPath();
  g.moveTo(w / 2 - 12, h - 15);
  g.lineTo(w / 2 + 12, h - 15);
  g.lineTo(w / 2, h);
  g.fill();
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.fillStyle = '#b9c0d4';
  g.font = '700 24px system-ui, sans-serif';
  g.fillText(title, w / 2, 14);
  g.fillStyle = '#ffffff';
  g.font = '800 34px system-ui, sans-serif';
  g.fillText(sub, w / 2, 46);
  if (badge) {
    g.fillStyle = accent;
    g.font = '800 22px system-ui, sans-serif';
    g.fillText(badge, w / 2, 90);
  }
  const s = spriteFrom(c, h / 145, 12);
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

  // projetor: tela no fundo da clareira (atrás da fogueira) com a live que a pessoa está assistindo
  const SW = 6.6;
  const SH = SW * (9 / 16);
  const SZ = -8.4;
  const SY = 1.0;
  const frame = new Vox();
  const PX = Math.round(SW / 2 / V) + 1;
  for (const x of [-PX, PX - 1]) frame.box(x, 0, 0, x + 1, Math.round((SY + SH) / V) + 1, 1, '#3b2a1e'); // postes
  frame.box(-PX, Math.round((SY + SH) / V), 0, PX, Math.round((SY + SH) / V) + 1, 1, '#3b2a1e'); // travessa
  add(frame, 0, SZ - 0.15);
  const screenMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat);
  screen.position.set(0, SY + SH / 2, SZ + 0.05);
  scene.add(screen);
  for (let x = -SW / 2; x <= SW / 2; x += 0.8) circles.push({ x, z: SZ, r: 0.45 });

  // telão do chat: quadro no lado direito, virado para o meio da clareira
  const CW = 4.4;
  const CH = CW * 0.75;
  const chatPos = { x: 8.1, z: -1.6 };
  const chatRy = Math.atan2(0 - chatPos.x, 3 - chatPos.z);
  const board = new Vox();
  const BX = Math.round(CW / 2 / V) + 1;
  for (const x of [-BX, BX - 1]) board.box(x, 0, 0, x + 1, Math.round((0.9 + CH) / V) + 1, 1, '#3b2a1e');
  board.box(-BX, Math.round((0.9 + CH) / V), 0, BX, Math.round((0.9 + CH) / V) + 1, 1, '#3b2a1e');
  add(board, chatPos.x - Math.sin(chatRy) * 0.15, chatPos.z - Math.cos(chatRy) * 0.15, { ry: chatRy });
  const chatCanvas = document.createElement('canvas');
  chatCanvas.width = 768;
  chatCanvas.height = 576;
  const chatTex = new THREE.CanvasTexture(chatCanvas);
  chatTex.colorSpace = THREE.SRGBColorSpace;
  chatTex.anisotropy = 4;
  const chatScreen = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshBasicMaterial({ map: chatTex, toneMapped: false }));
  chatScreen.position.set(chatPos.x, 0.9 + CH / 2, chatPos.z);
  chatScreen.rotation.y = chatRy;
  scene.add(chatScreen);
  for (let k = -CW / 2; k <= CW / 2; k += 0.8) circles.push({ x: chatPos.x + Math.cos(chatRy) * k, z: chatPos.z - Math.sin(chatRy) * k, r: 0.4 });
  const proj = new Vox();
  proj.box(-1, 0, -1, 2, 2, 2, '#6b4429'); // toco
  proj.box(-1, 2, -1, 2, 3, 2, '#c9a06a');
  proj.box(-1, 3, -1, 2, 5, 2, '#2b2d42'); // projetor
  proj.box(0, 3, -2, 1, 4, -1, '#9aa3ad'); // lente
  add(proj, 0, SZ + 3.4, { solid: 0.45 });
  // facho de luz da lente até a tela
  const beamLen = 3.3;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, SW * 0.32, beamLen, 4, 1, true),
    new THREE.MeshBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }),
  );
  beam.rotation.x = Math.PI / 2;
  beam.rotation.y = Math.PI / 4;
  beam.position.set(0, (SY + SH / 2 + 0.9) / 2, SZ + 3.4 - beamLen / 2 - 0.2);
  scene.add(beam);
  const projSpot = { x: 0, z: SZ + 3.4 };

  // guarda-roupa (E perto dele abre o arsenal e a personalização)
  add(wardrobe(), -8.3, 0.4, { ry: Math.PI / 2, solid: 1.1 });
  const wardrobeSpot = { x: -8.3, z: 0.4 };
  const wardrobeLabel = labelSprite('Guarda-roupa · E', '#ffd166');
  wardrobeLabel.position.set(-8.3, 3.8, 0.4);
  scene.add(wardrobeLabel);

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

  return { circles, seats, radio: radioMesh, lanternLight, wardrobeSpot, screen, screenMat, beam, projSpot, screenSpot: { x: 0, z: SZ }, chatCanvas, chatTex };
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

// ------------------------------------------------------------------ sons do PvP (feitos na hora, sem arquivos)
function makeSfx() {
  let ctx = null;
  const ac = () => {
    ctx ||= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const env = (g, t0, a, d, v) => {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  };
  const noise = (c, dur) => {
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = b;
    return src;
  };
  const tone = (type, f0, f1, dur, vol, at = 0) => {
    const c = ac();
    const t = c.currentTime + at;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    env(g, t, 0.005, dur, vol);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  return {
    swing(vol = 1) {
      const c = ac();
      const t = c.currentTime;
      const src = noise(c, 0.25);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 2.5;
      bp.frequency.setValueAtTime(500, t);
      bp.frequency.exponentialRampToValueAtTime(2800, t + 0.18);
      const g = c.createGain();
      env(g, t, 0.03, 0.17, 0.22 * vol);
      src.connect(bp).connect(g).connect(c.destination);
      src.start(t);
    },
    clang() {
      for (const fr of [1240, 1870, 2610, 3320]) tone('triangle', fr, fr * 0.985, 0.55, 0.09);
    },
    hit() {
      tone('sine', 190, 55, 0.18, 0.35);
      const c = ac();
      const src = noise(c, 0.08);
      const g = c.createGain();
      env(g, c.currentTime, 0.002, 0.07, 0.12);
      src.connect(g).connect(c.destination);
      src.start();
    },
    shot(w, vol = 1) {
      if (w === 'arco') {
        tone('triangle', 260, 110, 0.16, 0.18 * vol);
        tone('sine', 900, 400, 0.08, 0.06 * vol);
      } else if (w === 'fogo') {
        const c = ac();
        const src = noise(c, 0.45);
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(300, c.currentTime);
        lp.frequency.exponentialRampToValueAtTime(1500, c.currentTime + 0.3);
        const g = c.createGain();
        env(g, c.currentTime, 0.05, 0.38, 0.3 * vol);
        src.connect(lp).connect(g).connect(c.destination);
        src.start();
      } else {
        tone('sine', 1700, 2600, 0.25, 0.08 * vol);
        tone('sine', 2300, 3400, 0.2, 0.05 * vol, 0.05);
      }
    },
    ko() {
      tone('square', 420, 70, 0.6, 0.08);
      tone('square', 300, 50, 0.6, 0.06, 0.12);
    },
    close() {
      ctx?.close().catch(() => {});
      ctx = null;
    },
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

  // ---------------- projetor: mostra a live que a pessoa está assistindo na call
  const video = document.createElement('video');
  video.muted = true; // o som da live já toca pela call
  video.playsInline = true;
  let videoTex = null;
  let liveKey = '';
  let liveInfo = null;
  const noteCanvas = document.createElement('canvas');
  noteCanvas.width = 640;
  noteCanvas.height = 360;
  const noteTex = new THREE.CanvasTexture(noteCanvas);
  noteTex.colorSpace = THREE.SRGBColorSpace;
  function drawNote(title, sub) {
    const g = noteCanvas.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, '#1c2340');
    grad.addColorStop(1, '#3a1c4a');
    g.fillStyle = grad;
    g.fillRect(0, 0, 640, 360);
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.font = '800 40px system-ui, sans-serif';
    g.fillText(title, 320, 165, 600);
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.font = '500 26px system-ui, sans-serif';
    g.fillText(sub, 320, 215, 600);
    noteTex.needsUpdate = true;
  }
  let nearScreen = false;
  let screenKey = '';
  function syncProjector() {
    liveInfo = api.live?.() || null;
    // perto do telão (ou sentado vendo): o app mostra os botões de escolher a stream e ampliar
    nearScreen = Math.hypot(self.x - CAMP.screenSpot.x, self.z - CAMP.screenSpot.z) < 8.5;
    const sk = (nearScreen ? 1 : 0) + '|' + (liveInfo?.key || '') + '|' + (liveInfo?.streamers || []).map((x) => x.key).join();
    if (sk !== screenKey) {
      screenKey = sk;
      api.onScreen?.(nearScreen && liveInfo ? liveInfo : null);
    }
    const key = liveInfo?.stream ? 'v:' + liveInfo.key : liveInfo?.streamers?.length ? 'w:' + liveInfo.streamers.map((x) => x.key + x.name).join() : 'none';
    if (key === liveKey) return;
    liveKey = key;
    if (liveInfo?.stream) {
      video.srcObject = liveInfo.stream;
      video.play().catch(() => {});
      videoTex ||= new THREE.VideoTexture(video);
      videoTex.colorSpace = THREE.SRGBColorSpace;
      CAMP.screenMat.map = videoTex;
      CAMP.beam.material.opacity = 0.09;
    } else {
      video.srcObject = null;
      const st = liveInfo?.streamers || [];
      if (st.length) drawNote(`${st[0].name} está ao vivo`, st.length > 1 ? `e mais ${st.length - 1} · clique na tela para assistir` : 'clique na tela para assistir');
      else drawNote('Sem live agora', 'quando alguém transmitir a tela na call, ela aparece aqui');
      CAMP.screenMat.map = noteTex;
      CAMP.beam.material.opacity = 0.04;
    }
    CAMP.screenMat.needsUpdate = true;
  }
  // clique no telão: começa a assistir; com mais de uma stream, passa para a próxima
  function watchOnScreen() {
    const st = liveInfo?.streamers || [];
    if (!st.length) return;
    if (!liveInfo?.stream) return api.watch?.(st[0].key);
    const i = st.findIndex((x) => x.key === liveInfo.key);
    if (st.length > 1) api.watch?.(st[(i + 1) % st.length].key);
  }

  // telão do chat: as últimas mensagens do chat da call
  let chatKey = '';
  function wrapText(g, text, maxW, maxLines) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) {
        lines.push(line);
        line = w;
        if (lines.length === maxLines) break;
      } else line = t;
    }
    if (lines.length < maxLines && line) lines.push(line);
    else if (lines.length === maxLines) lines[maxLines - 1] = lines[maxLines - 1].replace(/.{2}$/, '') + '…';
    return lines;
  }
  function drawChat() {
    const info = api.chat?.() || { title: 'Chat', msgs: [] };
    const key = info.title + '|' + info.msgs.map((m) => m.id + m.text.length).join();
    if (key === chatKey) return;
    chatKey = key;
    const c = CAMP.chatCanvas;
    const g = c.getContext('2d');
    g.fillStyle = '#10142a';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#1c2340';
    g.fillRect(0, 0, c.width, 64);
    g.fillStyle = '#ffd166';
    g.font = '800 30px system-ui, sans-serif';
    g.textBaseline = 'middle';
    g.fillText('💬 ' + info.title, 24, 34, c.width - 48);
    // de baixo para cima: as mais novas embaixo
    let y = c.height - 20;
    const items = [];
    for (const m of [...info.msgs].reverse()) {
      g.font = '500 26px system-ui, sans-serif';
      const lines = wrapText(g, m.text, c.width - 48, 2);
      const h = 34 + lines.length * 32;
      if (y - h < 74) break;
      y -= h;
      items.push({ m, lines, y });
    }
    for (const { m, lines, y: yy } of items) {
      g.font = '800 26px system-ui, sans-serif';
      g.fillStyle = m.color || '#9ab0ff';
      g.textBaseline = 'top';
      g.fillText(m.name, 24, yy, c.width - 48);
      g.font = '500 26px system-ui, sans-serif';
      g.fillStyle = '#e8ebf5';
      lines.forEach((l, i) => g.fillText(l, 24, yy + 32 + i * 32, c.width - 48));
    }
    if (!items.length) {
      g.fillStyle = 'rgba(255,255,255,.6)';
      g.font = '500 28px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText('Nada no chat ainda. Mande algo na aba Chat!', c.width / 2, c.height / 2);
      g.textAlign = 'left';
    }
    CAMP.chatTex.needsUpdate = true;
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

  // ---------------- PvP: arsenal, ataque, parry e tiros
  // Só luta quem ligou o PvP (F). Quem decide se apanhou é quem leva o golpe: o atacante avisa "ataquei daqui,
  // virado para lá, com tal arma" (ou "atirei") e cada um confere na própria tela se estava no alcance e se
  // defendeu a tempo. Assim o parry vale pelo que a pessoa vê, mesmo com atraso de rede.
  const PVP = { on: false, hp: 100, kills: 0, atkAt: -9, parryAt: -9, guardAt: -9, parryCd: 0, stunUntil: 0, koUntil: 0, slowUntil: 0, shake: 0, stopUntil: 0 };
  const hitStop = (sec) => (PVP.stopUntil = Math.max(PVP.stopUntil, nowS() + sec));
  const spawn = { x: self.x, z: self.z };
  const nowS = () => performance.now() / 1000;
  const sfx = makeSfx();
  const frozen = () => nowS() < PVP.stunUntil || nowS() < PVP.koUntil;
  const pvpOf = (a, isMe) => (isMe ? PVP.on : !!a.target?.pvp);
  const hpOf = (a, isMe) => (isMe ? PVP.hp : a.target?.hp ?? 100);
  const myFig = () => {
    const m = api.me();
    return cleanFig(m.fig, m.color, m.uid);
  };
  function setPvp(on) {
    PVP.on = !!on;
    self.pvp = PVP.on;
    PVP.hp = 100;
    PVP.koUntil = 0;
    PVP.stunUntil = 0;
    if (PVP.on && self.s >= 0) standUp();
    api.onPvp?.(PVP.on, PVP.kills);
    sendNow();
  }
  function markAv(key, what) {
    const a = avatars.get(key);
    if (a) a[what] = clock.elapsedTime;
  }
  let shotN = 0;
  function attack() {
    const t = nowS();
    const fig = myFig();
    const w = W(fig.wp);
    if (!PVP.on || frozen() || t - PVP.atkAt < w.cd) return;
    PVP.atkAt = t;
    if (aim.touch || !aim.on) autoAim();
    if (self.s >= 0) standUp();
    markAv('me', 'swing');
    if (w.kind === 'shot') {
      const n = ++shotN;
      spawnProj('me', n, self.x, self.z, self.r, fig.wp);
      sfx.shot(fig.wp);
      api.sendAct({ t: 'shot', n, x: +self.x.toFixed(2), z: +self.z.toFixed(2), r: +self.r.toFixed(2), w: fig.wp });
      return;
    }
    const fx = self.x + Math.sin(self.r) * 0.25;
    const fz = self.z + Math.cos(self.r) * 0.25;
    if (!blocked(fx, fz)) Object.assign(self, { x: fx, z: fz });
    sfx.swing(fig.wp === 'longa' || fig.wp === 'machado' ? 1.3 : 1);
    slashFx('me', fig.wp);
    for (const v of [...views.values()]) {
      const dx = v.x - self.x;
      const dz = v.z - self.z;
      const d = Math.hypot(dx, dz);
      if (d < w.range + 0.3 && d > 0.01 && (dx * Math.sin(self.r) + dz * Math.cos(self.r)) / d >= w.arc) hitMob(v.id, w.dmg);
    }
    api.sendAct({ t: 'atk', x: +self.x.toFixed(2), z: +self.z.toFixed(2), r: +self.r.toFixed(2), w: fig.wp });
  }
  function parry() {
    const t = nowS();
    if (!PVP.on || frozen() || t < PVP.parryCd) return;
    PVP.parryAt = t;
    PVP.guardAt = t;
    PVP.parryCd = t + (hasShield(myFig()) ? 0.55 : 0.75); // defendeu fora de hora: um tempinho sem poder defender
    markAv('me', 'guard');
    api.sendAct({ t: 'grd' });
  }
  // levei um golpe ou um tiro: parry no tempo certo, bloqueio com escudo (metade do dano) ou dano cheio
  function takeHit(from, dmg, dirx, dirz, extra = {}) {
    const t = nowS();
    const shield = hasShield(myFig());
    const ranged = extra.pn != null;
    if (t - PVP.parryAt < (shield ? 0.4 : 0.25)) {
      PVP.parryCd = t; // acertou o parry: pode defender de novo na hora
      parryFx('me', ranged ? null : from);
      if (String(from).startsWith('m:')) mobParried(from);
      PVP.shake = 0.15;
      api.sendAct({ t: 'pry', to: from, ...(ranged ? { pn: extra.pn, ranged: true } : {}) });
      return;
    }
    if (shield && t - PVP.guardAt < 0.8) {
      dmg = Math.ceil(dmg / 2);
      floatText('me', 'BLOQUEIO', '#9ad1ff');
    }
    PVP.hp = Math.max(0, PVP.hp - dmg);
    if (self.s >= 0) standUp();
    const kx = self.x + dirx * 0.7;
    const kz = self.z + dirz * 0.7;
    if (!blocked(kx, kz)) Object.assign(self, { x: kx, z: kz });
    if (extra.slow) {
      PVP.slowUntil = t + extra.slow;
      floatText('me', 'LENTO', '#8fdcff');
    }
    const ko = PVP.hp <= 0;
    if (ko) PVP.koUntil = t + 3;
    hitFx('me', dmg, ko);
    PVP.shake = ko ? 0.45 : 0.25;
    api.sendAct({ t: 'hit', by: from, hp: PVP.hp, ko, dmg, ...(ranged ? { pn: extra.pn } : {}) });
    sendNow();
  }
  // efeitos: faíscas de cubinhos, textos subindo e tremida da câmera
  const SPK = 120;
  const sparkMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ toneMapped: false }), SPK);
  sparkMesh.frustumCulled = false;
  scene.add(sparkMesh);
  const sparks = Array.from({ length: SPK }, () => ({ life: 0 }));
  let sparkI = 0;
  const sm = new THREE.Matrix4();
  const sq = new THREE.Quaternion();
  const ss = new THREE.Vector3();
  const sp = new THREE.Vector3();
  function burst(x, y, z, color, n = 14, power = 1) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const p = sparks[sparkI++ % SPK];
      Object.assign(p, { x, y, z, vx: (Math.random() - 0.5) * 5 * power, vy: (1.5 + Math.random() * 3) * power, vz: (Math.random() - 0.5) * 5 * power, life: 0.45 + Math.random() * 0.3, size: 0.05 + Math.random() * 0.06, c });
    }
  }
  const texts = [];
  function floatText(key, text, color, big) {
    const a = avatars.get(key);
    if (!a) return;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const font = `900 ${big ? 64 : 48}px system-ui, sans-serif`;
    g.font = font;
    c.width = Math.ceil(g.measureText(text).width) + 24;
    c.height = big ? 84 : 64;
    g.font = font;
    g.textBaseline = 'middle';
    g.lineWidth = 8;
    g.strokeStyle = 'rgba(0,0,0,.75)';
    g.strokeText(text, 12, c.height / 2);
    g.fillStyle = color;
    g.fillText(text, 12, c.height / 2);
    const s = spriteFrom(c, big ? 0.55 : 0.4, 12);
    s.position.set(a.x + (Math.random() - 0.5) * 0.5, (a.parts?.height || 2) + 0.6, a.z);
    scene.add(s);
    texts.push({ s, life: 0, max: big ? 1.4 : 1 });
  }
  // rastro do golpe: arco brilhante deitado na altura do peito, varrendo de um lado ao outro na frente de quem bate
  const slashes = [];
  const SLASH = {
    curta: { r0: 0.85, r1: 1.35, arc: 2.6, color: '#f2f8ff' },
    longa: { r0: 1.35, r1: 2.15, arc: 3.0, color: '#d6ecff' },
    machado: { r0: 0.95, r1: 1.55, arc: 2.7, color: '#ffb066' },
  };
  // spritesheets da forja-vfx (pixel art): [quadros, fps]. Cortes tocam mais rápido que o padrão (golpe seco).
  const VFX = {
    corte: [5, 22],
    corte_longo: [7, 24],
    corte_machado: [7, 20],
    estocada: [4, 24],
    acerto: [4, 24],
    estilhacos: [7, 24],
    parry: [4, 24],
    poof: [8, 16],
    fogo: [6, 20],
    gelo: [10, 18],
    flecha: [5, 24],
  };
  const vfxTex = {};
  const texLoader = new THREE.TextureLoader();
  for (const name of Object.keys(VFX)) {
    const t = texLoader.load('vfx/' + name + '.png');
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.repeat.set(1 / VFX[name][0], 1);
    vfxTex[name] = t;
  }
  const vfxPlaying = [];
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  // efeito deitado no chão, virado para "dir" (a frente da imagem é para cima; estocada é para a direita)
  function vfxFlat(name, x, y, z, dir, size, { right = false, flip = false } = {}) {
    if (!vfxTex[name]) return;
    const tex = vfxTex[name].clone();
    tex.needsUpdate = true; // cópia precisa subir para a placa de vídeo
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.rotation.set(-Math.PI / 2, 0, right ? Math.PI / 2 : 0);
    mesh.scale.set(flip ? -size : size, size, 1);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = dir + Math.PI;
    g.add(mesh);
    g.renderOrder = 8;
    scene.add(g);
    vfxPlaying.push({ obj: g, tex, mat, name, t: 0 });
  }
  // efeito de frente para a câmera (acerto, parry, explosões)
  function vfxSprite(name, x, y, z, size) {
    if (!vfxTex[name]) return;
    const tex = vfxTex[name].clone();
    tex.needsUpdate = true; // cópia precisa subir para a placa de vídeo
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, toneMapped: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(size, size, 1);
    sp.position.set(x, y, z);
    sp.renderOrder = 13;
    scene.add(sp);
    vfxPlaying.push({ obj: sp, tex, mat, name, t: 0 });
  }
  function updateVfx(dt) {
    for (let i = vfxPlaying.length - 1; i >= 0; i--) {
      const v = vfxPlaying[i];
      v.t += dt;
      const [frames, fps] = VFX[v.name];
      const fr = Math.floor(v.t * fps);
      if (fr >= frames) {
        scene.remove(v.obj);
        v.tex.dispose();
        v.mat.dispose();
        vfxPlaying.splice(i, 1);
        continue;
      }
      v.tex.offset.x = fr / frames;
    }
  }

  // meia-lua do golpe: fina no começo, grossa e brilhante na borda de fora no fim, apagando para dentro
  // (cor nos vértices + mistura aditiva: preto = transparente)
  function crescent(r0, r1, arc, color, segs = 44) {
    const c = new THREE.Color(color);
    const pos = [];
    const col = [];
    const idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const a = -Math.PI / 2 - arc / 2 + arc * t;
      const w = Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.7 * (0.3 + 0.7 * t);
      const inner = r1 - (r1 - r0) * w;
      const k = 0.15 + 0.85 * t ** 1.4;
      pos.push(Math.cos(a) * r1, Math.sin(a) * r1, 0, Math.cos(a) * inner, Math.sin(a) * inner, 0);
      col.push(c.r * k, c.g * k, c.b * k, 0, 0, 0);
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }
  const SLASH_VFX = {
    curta: ['corte', 2.8, 0.9],
    longa: ['corte_longo', 4.6, 1.3],
    machado: ['corte_machado', 3.8, 1.0],
    lanca: ['estocada', 3.6, 1.6],
  };
  function slashFx(key, wp) {
    const a = avatars.get(key);
    if (!a) return;
    const v = SLASH_VFX[wp];
    if (v) {
      const [name, size, ahead] = v;
      const fx = Math.sin(a.r);
      const fz = Math.cos(a.r);
      vfxFlat(name, a.x + fx * ahead, 1.0, a.z + fz * ahead, a.r, size, { right: wp === 'lanca', flip: Math.random() < 0.5 });
      return;
    }
    const outer = new THREE.Group();
    outer.position.set(a.x, 1.05, a.z);
    outer.rotation.y = a.r;
    const tilt = new THREE.Group();
    tilt.rotation.z = (Math.random() - 0.5) * 0.25; // quase reto, só uma variação leve
    outer.add(tilt);
    let mesh;
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    if (wp === 'lanca') {
      // estocada: risco reto para a frente
      mat.color.set('#e8f4ff');
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 2.4), mat);
      mesh.position.set(0, 0.05, 1.5);
    } else {
      const c = SLASH[wp] || SLASH.curta;
      mat.color.set(c.color);
      // anel deitado (plano do chão), centrado na frente do boneco
      mat.color.set('#ffffff');
      mat.vertexColors = true;
      mesh = new THREE.Mesh(crescent(c.r0, c.r1, c.arc, c.color), mat);
      mesh.rotation.x = -Math.PI / 2;
      // faíscas na ponta onde o golpe termina
      const end = -Math.PI / 2 + c.arc / 2;
      const tip = new THREE.Vector3(Math.cos(end) * c.r1, 0, -Math.sin(end) * c.r1).applyEuler(new THREE.Euler(0, a.r, 0));
      burst(a.x + tip.x, 1.05, a.z + tip.z, c.color, 6, 0.6);
    }
    tilt.add(mesh);
    scene.add(outer);
    slashes.push({ obj: outer, mat, life: 0, max: 0.22 });
  }
  // nocaute: o boneco desmonta em todos os cubinhos, que voam, quicam no chão e somem
  const debris = [];
  const dummy = new THREE.Object3D();
  function shatter(key) {
    const a = avatars.get(key);
    if (!a?.parts || !a.fig) return;
    a.holder.updateMatrixWorld(true);
    shatterParts(figureParts(a.fig), a.parts, U, new THREE.Vector3(a.x, 0.9, a.z));
    a.parts.root.visible = false;
    a.shattered = true;
    burst(a.x, 1, a.z, '#ffffff', 12, 1.2);
    vfxSprite('poof', a.x, 1.0, a.z, 3.0);
  }
  function shatterParts(partsList, groups, size, center) {
    const items = [];
    for (const [name, p] of Object.entries(partsList)) {
      const group = groups[name];
      if (!group) continue;
      for (const [k, c] of p.vox.m) {
        const [x, y, z] = k.split(',').map(Number);
        // só os de fora (os de dentro nem aparecem)
        if (p.vox.has(x + 1, y, z) && p.vox.has(x - 1, y, z) && p.vox.has(x, y + 1, z) && p.vox.has(x, y - 1, z) && p.vox.has(x, y, z + 1) && p.vox.has(x, y, z - 1)) continue;
        const pos = new THREE.Vector3((x + 0.5 - p.pivot[0]) * size, (y + 0.5 - p.pivot[1]) * size, (z + 0.5 - p.pivot[2]) * size).applyMatrix4(group.matrixWorld);
        const out = pos.clone().sub(center);
        out.y = Math.max(0.15, out.y);
        out.normalize().multiplyScalar(1.5 + Math.random() * 3.5);
        out.y += 2 + Math.random() * 3;
        items.push({ p: pos, v: out, c, rx: Math.random() * 6, ry: Math.random() * 6, spin: (Math.random() - 0.5) * 16 });
      }
    }
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshLambertMaterial(), items.length);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    const col = new THREE.Color();
    items.forEach((it, i) => mesh.setColorAt(i, col.set(it.c)));
    scene.add(mesh);
    debris.push({ mesh, items, life: 0, size });
  }
  function updateDebris(dt) {
    for (let d = debris.length - 1; d >= 0; d--) {
      const D = debris[d];
      D.life += dt;
      const shrink = D.life < 2.2 ? 1 : Math.max(0, 1 - (D.life - 2.2) / 0.6);
      D.items.forEach((it, i) => {
        it.v.y -= 14 * dt;
        it.p.addScaledVector(it.v, dt);
        if (it.p.y < D.size / 2) {
          it.p.y = D.size / 2;
          it.v.y *= -0.35;
          it.v.x *= 0.7;
          it.v.z *= 0.7;
          it.spin *= 0.7;
        }
        it.rx += it.spin * dt;
        it.ry += it.spin * 0.6 * dt;
        dummy.position.copy(it.p);
        dummy.rotation.set(it.rx, it.ry, 0);
        dummy.scale.setScalar(shrink);
        dummy.updateMatrix();
        D.mesh.setMatrixAt(i, dummy.matrix);
      });
      D.mesh.instanceMatrix.needsUpdate = true;
      if (D.life > 2.8) {
        scene.remove(D.mesh);
        D.mesh.geometry.dispose();
        D.mesh.material.dispose();
        debris.splice(d, 1);
      }
    }
    for (let i = slashes.length - 1; i >= 0; i--) {
      const S = slashes[i];
      S.life += dt;
      const k = S.life / S.max;
      S.mat.opacity = Math.max(0, 0.95 * (1 - k * k));
      S.obj.scale.setScalar(0.85 + k * 0.3);
      if (S.life >= S.max) {
        scene.remove(S.obj);
        disposeTree(S.obj);
        S.mat.dispose();
        slashes.splice(i, 1);
      }
    }
  }
  function textAt(x, y, z, text, color, big) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const font = `900 ${big ? 64 : 48}px system-ui, sans-serif`;
    g.font = font;
    c.width = Math.ceil(g.measureText(text).width) + 24;
    c.height = big ? 84 : 64;
    g.font = font;
    g.textBaseline = 'middle';
    g.lineWidth = 8;
    g.strokeStyle = 'rgba(0,0,0,.75)';
    g.strokeText(text, 12, c.height / 2);
    g.fillStyle = color;
    g.fillText(text, 12, c.height / 2);
    const sp2 = spriteFrom(c, big ? 0.55 : 0.4, 12);
    sp2.position.set(x + (Math.random() - 0.5) * 0.5, y, z);
    scene.add(sp2);
    texts.push({ s: sp2, life: 0, max: big ? 1.4 : 1 });
  }
  function hitFx(key, dmg, ko) {
    hitStop(ko ? 0.16 : 0.07);
    const a = avatars.get(key);
    if (!a) return;
    markAv(key, 'hurt');
    vfxSprite('acerto', a.x, 1.15, a.z, 1.7);
    vfxSprite('estilhacos', a.x, 1.0, a.z, 1.9);
    burst(a.x, 1.1, a.z, '#ff4d4d', 6);
    floatText(key, '-' + dmg, '#ff6b6b');
    if (ko) {
      floatText(key, 'K.O.!', '#ffd166', true);
      sfx.ko();
    } else sfx.hit();
  }
  function parryFx(defKey, atkKey) {
    hitStop(0.1);
    const d = avatars.get(defKey);
    markAv(defKey, 'guard');
    if (atkKey) markAv(atkKey, 'stun');
    if (d) {
      vfxSprite('parry', d.x + Math.sin(d.r) * 0.5, 1.3, d.z + Math.cos(d.r) * 0.5, 2.4);
      burst(d.x + Math.sin(d.r) * 0.5, 1.3, d.z + Math.cos(d.r) * 0.5, '#ffe066', 10);
    }
    floatText(defKey, 'PARRY!', '#ffd166', true);
    sfx.clang();
  }
  // projéteis: flecha, bola de fogo e de gelo. Todo mundo desenha; só o alvo decide se acertou.
  const projs = new Map(); // "dono:n" -> { owner, n, x, z, dx, dz, w, dist, mesh }
  function projMesh(w) {
    if (w === 'arco') {
      const v = new Vox().box(0, 0, -4, 1, 1, 4, '#8b5e3c').box(0, 0, 4, 1, 1, 6, '#c4ccd6').box(-1, 0, -6, 2, 1, -4, '#f2efe9');
      return voxMesh(v, { size: U, origin: [0.5, 0.5, 0], jitter: 0 });
    }
    const tones = w === 'fogo' ? ['#ffb347', '#ff7a1a', '#ffe066'] : ['#bdf0ff', '#7fd6ff', '#e8fbff'];
    return voxMesh(new Vox().ball(0, 0, 0, w === 'fogo' ? 2.6 : 2, (x, y, z) => tones[Math.abs(x * 3 + y * 5 + z * 7) % 3]), { size: U, glow: true });
  }
  function spawnProj(owner, n, x, z, r, w) {
    const key = owner + ':' + n;
    if (W(w).kind !== 'shot' || projs.has(key)) return;
    const dx = Math.sin(r);
    const dz = Math.cos(r);
    const mesh = projMesh(w);
    mesh.rotation.y = r;
    scene.add(mesh);
    projs.set(key, { owner, n, x: x + dx * 0.6, z: z + dz * 0.6, dx, dz, w, dist: 0, mesh });
  }
  function removeProj(key, fx) {
    const p = projs.get(key);
    if (!p) return;
    scene.remove(p.mesh);
    disposeTree(p.mesh);
    projs.delete(key);
    if (fx) {
      burst(p.x, 1.15, p.z, W(p.w).color, 6, 0.7);
      if (p.w === 'fogo') vfxSprite('fogo', p.x, 1.2, p.z, 2.8);
      else if (p.w === 'gelo') vfxSprite('gelo', p.x, 1.1, p.z, 2.4);
      else vfxSprite('flecha', p.x, 1.15, p.z, 1.3);
    }
  }
  const hitsThing = (x, z) => Math.hypot(x, z) > 16 || CAMP.circles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r);
  function handleAct(from, ev) {
    if (ev.t === 'mob' || ev.t === 'matk' || ev.t === 'mhit' || ev.t === 'mdie') return mobAct(from, ev);
    const a = avatars.get(from);
    if (!a) return;
    const t = nowS();
    if (ev.t === 'atk') {
      markAv(from, 'swing');
      sfx.swing(0.45);
      slashFx(from, ev.w);
      const w = W(ev.w);
      if (!PVP.on || !a.target?.pvp || t < PVP.koUntil || w.kind !== 'melee') return;
      const dx = self.x - ev.x;
      const dz = self.z - ev.z;
      const d = Math.hypot(dx, dz);
      if (d > w.range || d < 0.01) return;
      if ((dx * Math.sin(ev.r) + dz * Math.cos(ev.r)) / d < w.arc) return; // fora do arco do golpe
      takeHit(from, w.dmg, dx / d, dz / d);
    } else if (ev.t === 'shot') {
      markAv(from, 'swing');
      spawnProj(from, ev.n, ev.x, ev.z, ev.r, ev.w);
      sfx.shot(ev.w, 0.5);
    } else if (ev.t === 'grd') markAv(from, 'guard');
    else if (ev.t === 'hit') {
      if (ev.pn != null) removeProj(ev.by + ':' + ev.pn, true);
      hitFx(from, ev.dmg || 20, ev.ko);
      if (ev.by === 'me') {
        PVP.shake = Math.max(PVP.shake, 0.1);
        if (ev.ko) {
          PVP.kills++;
          api.onPvp?.(PVP.on, PVP.kills);
        }
      }
    } else if (ev.t === 'pry') {
      if (ev.pn != null) removeProj(ev.to + ':' + ev.pn, true);
      parryFx(from, ev.ranged ? null : ev.to);
      if (String(ev.to).startsWith('m:')) mobParried(ev.to);
      if (ev.to === 'me' && !ev.ranged) {
        PVP.stunUntil = t + 1; // o parry deixa quem atacou tonto (de perto)
        PVP.shake = 0.3;
      }
    }
  }
  // ---------------- monstros
  // Um PC só controla (o de menor id entre quem está no acampamento): ele faz os monstros andarem, atacarem e
  // nascerem, e manda o estado para todo mundo. Quem apanha de monstro decide como sempre (parry, escudo, dano).
  // Quem bate num monstro avisa o controlador, que tira a vida e anuncia a morte.
  const sim = new Map(); // só no controlador: id -> estado de verdade
  const views = new Map(); // em todos: id -> { obj, type, x, z, r, hp, st, ... }
  let mobSeq = 1;
  let leaderWas = false;
  let lastMobSend = 0;
  let nextSpawn = 0;
  PVP.mobKills = 0;
  const myId = () => api.selfId?.() || 'me';
  function mobLeader() {
    const now = performance.now();
    let best = myId();
    let key = 'me';
    for (const [k, a] of avatars) if (k !== 'me' && a.seenAt && now - a.seenAt < 6000 && k < best) (best = k), (key = k);
    return key;
  }
  // quem está lutando (com PvP e vivo) e onde está
  function fighters() {
    const list = [];
    if (PVP.on && PVP.hp > 0) list.push({ key: 'me', x: self.x, z: self.z });
    const now = performance.now();
    for (const [k, a] of avatars) if (k !== 'me' && a.target?.pvp && (a.target.hp ?? 100) > 0 && now - (a.seenAt || 0) < 6000) list.push({ key: k, x: a.x, z: a.z });
    return list;
  }
  function mobView(id, type) {
    let v = views.get(id);
    if (v) return v;
    const m = buildMob(type);
    const mark = labelSprite('!', '#ff4d4d');
    mark.visible = false;
    m.root.add(mark);
    mark.position.y = MOBS[type].h + 0.5;
    scene.add(m.root);
    v = { id, type, obj: m, mark, x: 0, z: 0, r: 0, tx: 0, tz: 0, tr: 0, hp: MOBS[type].hp, st: 0, hurt: -9, atk: -9, phase: Math.random() * 6, bar: null, barHp: null };
    views.set(id, v);
    return v;
  }
  function removeView(id, how) {
    const v = views.get(id);
    if (!v) return;
    if (how === 'die') {
      v.obj.root.updateMatrixWorld(true);
      shatterParts(v.obj.parts, v.obj.groups, MU, new THREE.Vector3(v.x, 0.8, v.z));
      vfxSprite('poof', v.x, 0.9, v.z, 2.6);
    } else vfxSprite('poof', v.x, 0.9, v.z, 1.8);
    scene.remove(v.obj.root);
    disposeTree(v.obj.root);
    views.delete(id);
  }
  function mobBar(v) {
    const max = MOBS[v.type].hp;
    if (v.barHp === v.hp && v.bar) return;
    if (v.bar) {
      v.obj.root.remove(v.bar);
      disposeTree(v.bar);
    }
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 14;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,.65)';
    roundRect(g, 0, 0, 96, 14, 7);
    g.fill();
    g.fillStyle = '#ff5c5c';
    if (v.hp > 0) {
      roundRect(g, 2, 2, Math.max(8, 92 * (v.hp / max)), 10, 5);
      g.fill();
    }
    v.bar = spriteFrom(c, 0.09, 10);
    v.bar.position.y = MOBS[v.type].h + 0.25;
    v.obj.root.add(v.bar);
    v.barHp = v.hp;
  }
  // eu acertei um monstro (golpe ou tiro meu)
  function hitMob(id, dmg, slow) {
    const v = views.get(id);
    if (!v) return;
    mobHitFx(v, dmg);
    if (mobLeader() === 'me') applyMobHit(id, dmg, 'me', slow);
    else api.sendAct({ t: 'mhit', id, dmg, ...(slow ? { slow } : {}) });
  }
  function mobHitFx(v, dmg) {
    v.hurt = clock.elapsedTime;
    vfxSprite('acerto', v.x, MOBS[v.type].h * 0.55, v.z, 1.5);
    textAt(v.x, MOBS[v.type].h + 0.5, v.z, '-' + dmg, '#ffb4b4');
    sfx.hit();
    hitStop(0.05);
  }
  function applyMobHit(id, dmg, by, slow) {
    const m = sim.get(id);
    if (!m) return;
    m.hp -= dmg;
    m.stunUntil = Math.max(m.stunUntil, nowS() + 0.25);
    if (slow) m.slowUntil = nowS() + slow;
    if (m.hp <= 0) {
      sim.delete(id);
      api.sendAct({ t: 'mdie', id, by: by === 'me' ? myId() : by });
      mobDie(id, by);
    }
  }
  function mobDie(id, by) {
    removeView(id, 'die');
    if (by === 'me') {
      PVP.mobKills++;
      api.onPvp?.(PVP.on, PVP.kills, PVP.mobKills);
    }
  }
  // parry num monstro: ele fica tonto (quem controla aplica)
  function mobParried(key) {
    const id = Number(String(key).slice(2));
    const m = sim.get(id);
    if (m) m.stunUntil = nowS() + 1.5;
    const v = views.get(id);
    if (v) v.stunAt = clock.elapsedTime;
  }
  function mobAct(from, ev) {
    const t = nowS();
    if (ev.t === 'mob') {
      if (mobLeader() !== from) return; // só vale de quem controla
      const seen = new Set();
      for (const [id, type, x, z, r, hp, st] of ev.l) {
        seen.add(id);
        const v = mobView(id, type);
        if (!v.placed) Object.assign(v, { x, z, r, placed: true });
        Object.assign(v, { tx: x, tz: z, tr: r, hp, st });
      }
      for (const id of [...views.keys()]) if (!seen.has(id)) removeView(id, 'gone');
    } else if (ev.t === 'matk') {
      const v = views.get(ev.id);
      if (v) mobSwing(v);
      // o golpe chegou em mim?
      if (!PVP.on || t < PVP.koUntil) return;
      const M = MOBS[v?.type ?? 0];
      const dx = self.x - ev.x;
      const dz = self.z - ev.z;
      const d = Math.hypot(dx, dz);
      if (d > M.reach + 0.45 || d < 0.01) return;
      if ((dx * Math.sin(ev.r) + dz * Math.cos(ev.r)) / d < 0.2) return;
      takeHit('m:' + ev.id, M.dmg, dx / d, dz / d);
    } else if (ev.t === 'mhit') {
      const v = views.get(ev.id);
      if (v) mobHitFx(v, ev.dmg);
      if (mobLeader() === 'me') applyMobHit(ev.id, ev.dmg, from, ev.slow);
    } else if (ev.t === 'mdie') mobDie(ev.id, ev.by);
  }
  function mobSwing(v) {
    v.atk = clock.elapsedTime;
    const fx = Math.sin(v.r);
    const fz = Math.cos(v.r);
    vfxFlat('corte', v.x + fx * 0.7, 0.8, v.z + fz * 0.7, v.r, 2.2, { flip: Math.random() < 0.5 });
    sfx.swing(0.5);
  }
  const mobBlocked = (x, z) => Math.hypot(x, z) > 12 || CAMP.circles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 0.35);
  // só no controlador: nascer, andar, atacar e mandar o estado
  function simulate(dt, now) {
    const F = fighters();
    // nasce na beira da floresta enquanto tem alguém lutando
    if (F.length && now > nextSpawn && sim.size < Math.min(6, 2 + F.length)) {
      nextSpawn = now + 5 + Math.random() * 4;
      const a = Math.random() * Math.PI * 2;
      const type = Math.random() < 0.45 ? 0 : Math.random() < 0.55 ? 1 : 2;
      const id = mobSeq++;
      sim.set(id, { id, type, x: Math.cos(a) * 11, z: Math.sin(a) * 11, r: 0, hp: MOBS[type].hp, st: 0, stUntil: 0, cd: now + 1, stunUntil: 0, slowUntil: 0, idle: 0 });
    }
    for (const m of sim.values()) {
      const M = MOBS[m.type];
      let target = null;
      let bd = 1e9;
      for (const p of F) {
        const d = Math.hypot(p.x - m.x, p.z - m.z);
        if (d < bd) (bd = d), (target = p);
      }
      if (now < m.stunUntil) {
        m.st = 2;
        continue;
      }
      if (m.st === 1) {
        // fim do aviso "!": golpeia
        if (now >= m.stUntil) {
          m.st = 0;
          m.cd = now + M.cd;
          api.sendAct({ t: 'matk', id: m.id, x: +m.x.toFixed(2), z: +m.z.toFixed(2), r: +m.r.toFixed(2) });
          mobAct(myId(), { t: 'matk', id: m.id, x: m.x, z: m.z, r: m.r });
        }
        continue;
      }
      m.st = 0;
      if (!target) {
        // ninguém lutando: volta para a floresta e some
        m.idle += dt;
        const away = Math.atan2(m.x, m.z);
        m.r = away;
        m.x += Math.sin(away) * M.speed * dt;
        m.z += Math.cos(away) * M.speed * dt;
        if (m.idle > 8 || Math.hypot(m.x, m.z) > 13) sim.delete(m.id);
        continue;
      }
      m.idle = 0;
      const dx = target.x - m.x;
      const dz = target.z - m.z;
      m.r = Math.atan2(dx, dz);
      if (bd <= M.reach && now >= m.cd) {
        m.st = 1; // avisa antes de bater (dá tempo de defender)
        m.stUntil = now + 0.5;
        continue;
      }
      if (bd > M.reach * 0.8) {
        const sp = M.speed * dt * (now < m.slowUntil ? 0.5 : 1);
        let dir = m.r;
        for (const turn of [0, 0.7, -0.7, 1.4, -1.4]) {
          const nx = m.x + Math.sin(m.r + turn) * sp;
          const nz = m.z + Math.cos(m.r + turn) * sp;
          if (!mobBlocked(nx, nz) || Math.hypot(m.x, m.z) > 10) {
            dir = m.r + turn;
            break;
          }
        }
        m.x += Math.sin(dir) * sp;
        m.z += Math.cos(dir) * sp;
      }
    }
    // o que eu calculo é o que eu desenho
    for (const m of sim.values()) {
      const v = mobView(m.id, m.type);
      if (!v.placed) Object.assign(v, { x: m.x, z: m.z, r: m.r, placed: true });
      Object.assign(v, { tx: m.x, tz: m.z, tr: m.r, hp: m.hp, st: m.st });
    }
    for (const id of [...views.keys()]) if (!sim.has(id)) removeView(id, 'gone');
    if (now - lastMobSend > 0.1) {
      lastMobSend = now;
      api.sendAct({ t: 'mob', l: [...sim.values()].map((m) => [m.id, m.type, +m.x.toFixed(2), +m.z.toFixed(2), +m.r.toFixed(2), Math.max(0, Math.round(m.hp)), m.st]) });
    }
  }
  function monstersFrame(dt, t, now) {
    const leader = mobLeader() === 'me';
    if (leader && !leaderWas) {
      // virei o controlador: assumo os monstros que já estavam aí
      for (const v of views.values()) sim.set(v.id, { id: v.id, type: v.type, x: v.tx, z: v.tz, r: v.tr, hp: v.hp, st: 0, stUntil: 0, cd: now + 1, stunUntil: 0, slowUntil: 0, idle: 0 });
      mobSeq = Math.max(mobSeq, ...[...views.keys()].map((id) => id + 1), 1) + Math.floor(Math.random() * 1000);
    }
    if (!leader && leaderWas) sim.clear();
    leaderWas = leader;
    if (leader) simulate(dt, now);
    // desenho
    for (const v of views.values()) {
      const k = 1 - Math.exp(-dt * 10);
      v.x += (v.tx - v.x) * k;
      v.z += (v.tz - v.z) * k;
      let dr = v.tr - v.r;
      dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      v.r += dr * (1 - Math.exp(-dt * 10));
      const M = MOBS[v.type];
      const o = v.obj;
      v.phase += dt * 8;
      o.root.position.set(v.x, M.fly ? 1.5 + Math.sin(t * 3 + v.phase) * 0.2 : 0, v.z);
      o.root.rotation.y = v.r;
      const G = o.groups;
      const atk = t - v.atk;
      if (v.type === 0) {
        // slime pula e amassa
        const hop = Math.abs(Math.sin(v.phase * 0.7));
        o.body.position.y = hop * 0.35;
        o.body.scale.set(1 + (1 - hop) * 0.15, 1 - (1 - hop) * 0.2, 1 + (1 - hop) * 0.15);
        if (atk < 0.3) o.body.position.z = Math.sin((atk / 0.3) * Math.PI) * 0.5;
        else o.body.position.z = 0;
      } else if (v.type === 1) {
        const sw = Math.sin(v.phase);
        G.legL.rotation.x = sw * 0.6;
        G.legR.rotation.x = -sw * 0.6;
        const reach = atk < 0.3 ? -2.6 + (atk / 0.3) * 2 : -1.4; // braços para a frente (zumbi)
        G.armL.rotation.x = reach;
        G.armR.rotation.x = reach;
        G.head.rotation.y = Math.sin(t * 2 + v.phase) * 0.2;
      } else {
        const flap = Math.sin(t * 22 + v.phase) * 0.9;
        G.wingL.rotation.z = flap;
        G.wingR.rotation.z = -flap;
        if (atk < 0.3) o.body.position.z = Math.sin((atk / 0.3) * Math.PI) * 0.6;
        else o.body.position.z = 0;
      }
      // aviso antes do golpe, tonto e piscada de dano
      v.mark.visible = v.st === 1 && Math.floor(t * 10) % 2 === 0;
      o.body.rotation.z = v.st === 2 ? Math.sin(t * 20) * 0.25 : 0;
      o.body.position.x = t - v.hurt < 0.18 ? Math.sin(t * 90) * 0.06 : 0;
      mobBar(v);
    }
  }

  // ---------------- mira
  const aimRing = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.32, 24), new THREE.MeshBasicMaterial({ color: '#ff5c5c', transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
  aimRing.rotation.x = -Math.PI / 2;
  const aimDot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), aimRing.material);
  aimDot.rotation.x = -Math.PI / 2;
  const aimLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]);
  const aimLine = new THREE.Line(aimLineGeo, new THREE.LineDashedMaterial({ color: '#ffd1d1', dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.8, toneMapped: false }));
  const reachArc = new THREE.Mesh(new THREE.RingGeometry(0.4, 1, 32, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  reachArc.rotation.x = -Math.PI / 2;
  let reachKey = '';
  for (const o of [aimRing, aimDot, aimLine, reachArc]) {
    o.visible = false;
    o.renderOrder = 7;
    scene.add(o);
  }
  // no toque (celular) não tem mouse: mira sozinho no alvo mais perto
  function autoAim() {
    let best = null;
    let bd = 9;
    for (const v of views.values()) {
      const d = Math.hypot(v.x - self.x, v.z - self.z);
      if (d < bd) (bd = d), (best = v);
    }
    for (const [k, a] of avatars) {
      if (k === 'me' || !a.target?.pvp || (a.target.hp ?? 100) <= 0) continue;
      const d = Math.hypot(a.x - self.x, a.z - self.z);
      if (d < bd) (bd = d), (best = a);
    }
    if (best) self.r = Math.atan2(best.x - self.x, best.z - self.z);
  }
  function updateAim() {
    const show = PVP.on && aim.on && !aim.touch && PVP.hp > 0;
    if (show) self.r = Math.atan2(aim.x - self.x, aim.z - self.z);
    const w = W(myFig().wp);
    aimRing.visible = aimDot.visible = show;
    aimLine.visible = show && w.kind === 'shot';
    reachArc.visible = PVP.on && w.kind === 'melee' && PVP.hp > 0;
    if (show) {
      aimRing.position.set(aim.x, 0.04, aim.z);
      aimDot.position.set(aim.x, 0.045, aim.z);
      aimRing.scale.setScalar(1 + Math.sin(performance.now() / 160) * 0.08);
    }
    if (aimLine.visible) {
      // linha da arma até onde o tiro chega (15) na direção da mira
      const len = Math.min(15, Math.hypot(aim.x - self.x, aim.z - self.z) + 2);
      const p = aimLineGeo.attributes.position;
      p.setXYZ(0, self.x + Math.sin(self.r) * 0.5, 1.15, self.z + Math.cos(self.r) * 0.5);
      p.setXYZ(1, self.x + Math.sin(self.r) * len, 1.15, self.z + Math.cos(self.r) * len);
      p.needsUpdate = true;
      aimLineGeo.computeBoundingSphere();
      aimLine.computeLineDistances();
    }
    if (reachArc.visible) {
      // meia-lua no chão mostrando até onde o golpe pega
      const key = myFig().wp;
      if (key !== reachKey) {
        reachKey = key;
        const half = Math.acos(Math.max(-1, Math.min(1, w.arc)));
        reachArc.geometry.dispose();
        reachArc.geometry = new THREE.RingGeometry(0.45, w.range, 32, 1, -Math.PI / 2 - half, half * 2);
      }
      reachArc.position.set(self.x, 0.03, self.z);
      reachArc.rotation.set(-Math.PI / 2, 0, self.r);
    }
  }

  // barra de vida em cima da cabeça de quem está no PvP
  function hpBar(a, hp) {
    if (a.barHp === hp && a.bar) return;
    if (a.bar) {
      a.holder.remove(a.bar);
      disposeTree(a.bar);
    }
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 18;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,.65)';
    roundRect(g, 0, 0, 128, 18, 9);
    g.fill();
    g.fillStyle = hp > 50 ? '#4ade80' : hp > 20 ? '#facc15' : '#f43f5e';
    if (hp > 0) {
      roundRect(g, 3, 3, Math.max(12, 122 * (hp / 100)), 12, 6);
      g.fill();
    }
    a.bar = spriteFrom(c, 0.11, 10);
    a.bar.position.y = a.parts.height + 0.7;
    a.holder.add(a.bar);
    a.barHp = hp;
  }
  function pvpFrame(dt, t) {
    const now = nowS();
    // nocaute acabou: volta na trilha com a vida cheia
    if (PVP.on && PVP.hp <= 0 && now >= PVP.koUntil) {
      PVP.hp = 100;
      Object.assign(self, { x: spawn.x, z: spawn.z, r: 0, s: -1 });
      sendNow();
    }
    for (const [key, a] of avatars) {
      const isMe = key === 'me';
      const on = pvpOf(a, isMe);
      if (a.parts?.weapon) a.parts.weapon.visible = on;
      if (a.parts?.shield) a.parts.shield.visible = on;
      const down = on && hpOf(a, isMe) <= 0;
      if (down && !a.shattered && a.parts) shatter(key);
      if (!down && a.shattered && a.parts) {
        a.shattered = false;
        a.parts.root.visible = true;
        a.popAt = t;
        burst(a.x, 1, a.z, '#ffe066', 14, 0.8);
      }
      if (a.parts && a.popAt != null) {
        const k = Math.min(1, (t - a.popAt) / 0.35);
        a.parts.root.scale.setScalar(k < 1 ? 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2 : 1);
        if (k >= 1) a.popAt = null;
      }
      if (on && a.parts && !down) hpBar(a, hpOf(a, isMe));
      else if (down && a.bar) {
        a.holder.remove(a.bar);
        disposeTree(a.bar);
        a.bar = null;
        a.barHp = null;
      }
      else if (a.bar) {
        a.holder.remove(a.bar);
        disposeTree(a.bar);
        a.bar = null;
        a.barHp = null;
      }
    }
    for (const [key, p] of projs) {
      const w = W(p.w);
      const step = w.speed * dt;
      p.x += p.dx * step;
      p.z += p.dz * step;
      p.dist += step;
      p.mesh.position.set(p.x, 1.15, p.z);
      if (p.w !== 'arco') {
        p.mesh.rotation.x += dt * 6;
        p.mesh.rotation.z += dt * 4;
        if (Math.random() < 0.6) burst(p.x, 1.15, p.z, w.color, 1, 0.3);
      }
      if (p.dist > 15 || hitsThing(p.x, p.z)) {
        removeProj(key, true);
        continue;
      }
      // um tiro meu pegou num monstro?
      if (p.owner === 'me') {
        const hit = [...views.values()].find((v) => Math.hypot(v.x - p.x, v.z - p.z) < w.hit + 0.35);
        if (hit) {
          removeProj(key, true);
          hitMob(hit.id, w.dmg, w.slow);
          continue;
        }
      }
      // um tiro de outra pessoa chegou em mim?
      if (p.owner !== 'me' && PVP.on && now >= PVP.koUntil && avatars.get(p.owner)?.target?.pvp && Math.hypot(self.x - p.x, self.z - p.z) < w.hit) {
        removeProj(key, true);
        takeHit(p.owner, w.dmg, p.dx, p.dz, { pn: p.n, slow: w.slow });
      }
    }
    for (let i = 0; i < SPK; i++) {
      const p = sparks[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 9 * dt;
        p.x += p.vx * dt;
        p.y = Math.max(0.03, p.y + p.vy * dt);
        p.z += p.vz * dt;
        sp.set(p.x, p.y, p.z);
        ss.setScalar(p.life > 0 ? p.size : 0);
        sparkMesh.setColorAt(i, p.c);
      } else ss.setScalar(0);
      sm.compose(sp, sq, ss);
      sparkMesh.setMatrixAt(i, sm);
    }
    sparkMesh.instanceMatrix.needsUpdate = true;
    if (sparkMesh.instanceColor) sparkMesh.instanceColor.needsUpdate = true;
    for (let i = texts.length - 1; i >= 0; i--) {
      const x = texts[i];
      x.life += dt;
      x.s.position.y += dt * 0.9;
      x.s.material.opacity = Math.max(0, 1 - x.life / x.max);
      if (x.life >= x.max) {
        scene.remove(x.s);
        disposeTree(x.s);
        texts.splice(i, 1);
      }
    }
    updateAim();
    monstersFrame(dt, t, now);
    updateDebris(dt);
    updateVfx(dt);
    PVP.shake = Math.max(0, PVP.shake - dt);
  }
  function ensureAvatar(key, p) {
    let a = avatars.get(key);
    if (!a) {
      a = { key, x: p.pos?.x ?? 0, z: p.pos?.z ?? 6.5, r: p.pos?.r ?? 0, phase: Math.random() * 6, walkAmt: 0, holder: new THREE.Group() };
      avatars.set(key, a);
      scene.add(a.holder);
    }
    const fig = cleanFig(p.fig, p.color, p.uid);
    const figKey = JSON.stringify(fig);
    a.fig = fig;
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
    if (e.code === 'KeyF' && !e.repeat) return setPvp(!PVP.on);
    if (PVP.on && e.code === 'KeyJ' && !e.repeat) return attack();
    if (PVP.on && e.code === 'KeyK' && !e.repeat) return parry();
    if (frozen() && MOVE[e.code]) return;
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
    {
      const r0 = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r0.left) / r0.width) * 2 - 1, -((e.clientY - r0.top) / r0.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
    }
    if (!PVP.on && e.button === 0 && ray.intersectObject(CAMP.screen).length) {
      watchOnScreen();
      return;
    }
    if (PVP.on && (e.button === 0 || e.button === 2)) {
      e.button === 2 ? parry() : attack();
      return;
    }
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(groundPlane, hitPoint)) return;
    const seat = nearestSeat(hitPoint.x, hitPoint.z, 1.1);
    walkTo = seat != null ? { x: CAMP.seats[seat].x, z: CAMP.seats[seat].z, sit: seat } : { x: hitPoint.x, z: hitPoint.z };
    if (self.s >= 0) standUp();
  });
  renderer.domElement.addEventListener('contextmenu', (e) => PVP.on && e.preventDefault());
  // mira: ponto do chão embaixo do mouse
  const aim = { on: false, x: 0, z: 0, touch: false };
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r0 = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r0.left) / r0.width) * 2 - 1, -((e.clientY - r0.top) / r0.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(groundPlane, hitPoint)) Object.assign(aim, { on: true, x: hitPoint.x, z: hitPoint.z });
  });
  renderer.domElement.addEventListener('pointerleave', () => (aim.on = false));
  renderer.domElement.addEventListener('pointerdown', (e) => (aim.touch = e.pointerType === 'touch'));
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
    if (Math.hypot(self.x - CAMP.wardrobeSpot.x, self.z - CAMP.wardrobeSpot.z) < 2.4) return api.openArsenal?.();
    if (Math.hypot(self.x - CAMP.projSpot.x, self.z - CAMP.projSpot.z) < 2.4) return watchOnScreen();
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
  const packed = () => ({ x: +self.x.toFixed(2), z: +self.z.toFixed(2), r: +self.r.toFixed(2), s: self.s, w: self.w, run: self.run, e: self.e, pvp: PVP.on, hp: PVP.hp });
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
    // PvP: golpe de cada arma, guarda, tonto, apanhando e nocaute
    P.body.position.x = 0;
    P.armR.position.z = P.armRz;
    if (pvpOf(a, isMe)) {
      const w = W(P.wp);
      const swing = t - (a.swing ?? -9);
      if (w.anim === 'swing' && swing < 0.3) {
        const k = swing / 0.3;
        P.armR.rotation.set(-1.45, 0, 0.5 - k * 0.6);
        P.body.rotation.y = 1.0 - k * 2.0;
      } else if (w.anim === 'thrust' && swing < 0.3) {
        const k = Math.sin((swing / 0.3) * Math.PI);
        P.armR.rotation.set(-1.55, 0, 0);
        P.armR.position.z = P.armRz + k * 0.32;
        P.body.rotation.y = -k * 0.25;
      } else if (w.anim === 'bow' && swing < 0.45) {
        P.armR.rotation.set(-1.55, 0, 0);
        P.armL.rotation.set(-1.45, 0, 0.35);
      } else if (w.anim === 'cast' && swing < 0.4) P.armR.rotation.set(-2.7 + (swing / 0.4) * 1.2, 0, 0);
      else if (t - (a.guard ?? -9) < 0.4) {
        P.armR.rotation.set(-1.55, 0, -0.95);
        if (P.shield) P.armL.rotation.set(-1.35, 0, 0.55);
      } else if (!moving && !seat && !e) P.armR.rotation.set(w.anim === 'bow' ? -0.2 : -0.55, 0, 0.1);
      if (t - (a.stun ?? -9) < 1) {
        P.head.rotation.z = Math.sin(t * 22) * 0.28;
        P.body.rotation.y = Math.sin(t * 9) * 0.35;
      }
      if (t - (a.hurt ?? -9) < 0.18) P.body.position.x = Math.sin(t * 90) * 0.05;
    }
    const ko = pvpOf(a, isMe) && hpOf(a, isMe) <= 0;
    P.root.rotation.z += ((ko ? -Math.PI / 2 : 0) - P.root.rotation.z) * (1 - Math.exp(-dt * 10));
    P.root.position.y = ko ? 0.35 : 0;
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
    let dt = Math.min(0.05, clock.getDelta());
    if (nowS() < PVP.stopUntil) dt *= 0.06; // congelada de impacto (hit stop)
    const t = clock.elapsedTime;
    const now = performance.now();

    let mx = 0;
    let mz = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) mz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (frozen()) {
      mx = 0;
      mz = 0;
      walkTo = null;
    }
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
      const sp = (run ? RUN : SPEED) * dt * (nowS() < PVP.slowUntil ? 0.5 : 1);
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
      if (!(PVP.on && aim.on)) self.r = Math.atan2(mx, mz);
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
    pvpFrame(dt, t);
    CAMP.lanternLight.intensity = 3 + Math.sin(t * 2.3) * 0.3;

    const focus = new THREE.Vector3(self.x * 0.6, 0.8, self.z * 0.55 - 0.4);
    camTarget.lerp(focus, 1 - Math.exp(-dt * 4));
    camera.position.set(camTarget.x, camTarget.y + 7.6 * zoom, camTarget.z + 9.4 * zoom);
    if (PVP.shake > 0) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * PVP.shake * 0.8, (Math.random() - 0.5) * PVP.shake * 0.8, 0));
    camera.lookAt(camTarget);

    if (now - lastRadio > 1000) {
      lastRadio = now;
      drawRadio();
      syncProjector();
      drawChat();
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
      a.seenAt = performance.now();
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
    roll(key, r) {
      const a = avatars.get(key);
      if (!a || !r) return;
      if (a.bubble) {
        a.holder.remove(a.bubble);
        disposeTree(a.bubble);
      }
      a.bubble = rollSprite(r);
      a.bubble.position.y = a.parts.height + 0.38;
      a.bubbleUntil = clock.elapsedTime + 7.5;
      a.holder.add(a.bubble);
      if (r.crit === 'crit') {
        vfxSprite('fogo', a.x, 1.35, a.z, 2.5);
        vfxSprite('parry', a.x, 1.5, a.z, 2.1);
      } else if (r.crit === 'fumble') {
        vfxSprite('poof', a.x, 1.0, a.z, 2.4);
      } else {
        vfxSprite('acerto', a.x, 1.3, a.z, 1.4);
      }
    },
    refresh,
    resendPos: sendNow,
    handleAct,
    togglePvp: () => setPvp(!PVP.on),
    watchNext: () => watchOnScreen(),
    // para testar pelo DevTools: põe o meu boneco num lugar
    debugMove: (x, z, r) => (Object.assign(self, { x, z, r, s: -1 }), sendNow()),
    debugState: () => ({ ...PVP, x: self.x, z: self.z, projs: projs.size }),
    pvp: () => PVP.on,
    attack,
    parry,
    debug: () => [...avatars].map(([k, a]) => ({ k, x: +a.x.toFixed(2), z: +a.z.toFixed(2), s: k === meKey ? self.s : a.target?.s })),
    destroy() {
      if (PVP.on) {
        PVP.on = false; // os outros param de me ver de espada
        sendNow();
      }
      sfx.close();
      for (const t of Object.values(vfxTex)) t.dispose();
      video.srcObject = null;
      videoTex?.dispose();
      noteTex.dispose();
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
window.JanjaRoom = { mount, preview, FIG, EMOTES, WEAPONS };
