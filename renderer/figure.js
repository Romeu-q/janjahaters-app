// Boneco da sala de games: o que dá para escolher e a validação do que chega dos amigos.
// Os bonecos são os "Mini Characters" do Kenney (CC0, renderer/room/chars). Fica fora do room.js (que traz o
// three.js) para o app validar e guardar o boneco mesmo com a sala desligada.
export const FIG = {
  char: [
    ['female-a', 'Ela A'],
    ['female-b', 'Ela B'],
    ['female-c', 'Ela C'],
    ['female-d', 'Ela D'],
    ['female-e', 'Ela E'],
    ['female-f', 'Ela F'],
    ['male-a', 'Ele A'],
    ['male-b', 'Ele B'],
    ['male-c', 'Ele C'],
    ['male-d', 'Ele D'],
    ['male-e', 'Ele E'],
    ['male-f', 'Ele F'],
    ['male-g', 'Ele G'],
    ['worker', 'Operário'],
    ['soldier', 'Soldado'],
    ['knight', 'Cavaleiro'],
    ['raider', 'Saqueador'],
    ['robot', 'Robô'],
    ['alien', 'Alien'],
    ['zombie', 'Zumbi'],
  ],
  acc: [
    ['nada', 'Nada'],
    ['glasses', 'Óculos'],
    ['sunglasses', 'Óculos escuros'],
    ['mask', 'Máscara'],
  ],
};
const ids = (list) => list.map((x) => x[0]);
const pick = (v, list, def) => (list.includes(v) ? v : def);

// boneco inicial: cada um já começa com um diferente (sai do id)
export function defaultFig(seed, id = '') {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { char: FIG.char[h % 13][0], acc: 'nada' };
}
export function cleanFig(f, seed, id) {
  const d = defaultFig(seed, id);
  if (!f || typeof f !== 'object') return d;
  return { char: pick(f.char, ids(FIG.char), d.char), acc: pick(f.acc, ids(FIG.acc), d.acc) };
}
// posição na sala que chega dos amigos (ação 'pos')
export function cleanPos(p) {
  const n = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null);
  if (!p || typeof p !== 'object') return null;
  const x = n(p.x, -7, 7), z = n(p.z, -6, 6), r = n(p.r, -10, 10);
  if (x == null || z == null) return null;
  return { x, z, r: r ?? 0, s: Number.isInteger(p.s) && p.s >= 0 && p.s < 16 ? p.s : -1, w: !!p.w, run: !!p.run, e: typeof p.e === 'string' ? p.e.slice(0, 12) : '' };
}
