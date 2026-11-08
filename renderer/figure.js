// Boneco do acampamento (voxel): o que dá para escolher e a validação do que chega dos amigos.
// Fica fora do room.js (que traz o three.js) para o app validar e guardar o boneco mesmo com a sala desligada.
export const FIG = {
  skin: ['#ffe3cc', '#f7cba4', '#e3aa7c', '#c08156', '#8e5a37', '#5e3b22', '#b8e0c8', '#c9c2f2'],
  hair: [
    ['curto', 'Curto'],
    ['franja', 'Franja'],
    ['espetado', 'Espetado'],
    ['moicano', 'Moicano'],
    ['coque', 'Coque'],
    ['longo', 'Longo'],
    ['rabo', 'Rabo de cavalo'],
    ['careca', 'Sem cabelo'],
  ],
  hairColor: ['#2b1d14', '#5a3a22', '#a8642b', '#e8c06a', '#f2efe9', '#e0567a', '#5b7bf0', '#3dbf8a', '#9b5de5', '#ff7a1a'],
  eyes: [
    ['bolinha', 'Bolinha'],
    ['feliz', 'Feliz'],
    ['brilho', 'Brilhando'],
    ['sono', 'Sonolento'],
  ],
  acc: [
    ['nada', 'Nada'],
    ['gorro', 'Gorro'],
    ['bone', 'Boné'],
    ['chapeu', 'Chapéu'],
    ['oculos', 'Óculos'],
    ['fone', 'Fone'],
    ['flor', 'Flor'],
  ],
  // arsenal do PvP (o room.js tem os números de cada uma)
  wp: [
    ['curta', 'Espada curta'],
    ['longa', 'Espada longa'],
    ['lanca', 'Lança'],
    ['machado', 'Machado'],
    ['arco', 'Arco'],
    ['fogo', 'Cajado de fogo'],
    ['gelo', 'Cajado de gelo'],
  ],
};
// armas de uma mão: aceitam escudo na outra
export const ONE_HAND = new Set(['curta', 'lanca']);
const HEX = /^#[0-9a-f]{6}$/i;
const ids = (list) => list.map((x) => x[0]);
const pick = (v, list, def) => (list.includes(v) ? v : def);
const color = (v, def) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : def);

// boneco inicial: sai do id e da cor do perfil, para cada um já começar diferente
export function defaultFig(seed = '#5b7bf0', id = '') {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return {
    skin: FIG.skin[h % 6],
    hair: ids(FIG.hair)[h % 7],
    hairColor: FIG.hairColor[(h >> 3) % FIG.hairColor.length],
    eyes: ids(FIG.eyes)[(h >> 5) % 3],
    acc: 'nada',
    shirt: color(seed, '#5b7bf0'),
    pants: '#3a4258',
    shoes: '#f2efe9',
    wp: 'curta',
    sh: true,
  };
}
export function cleanFig(f, seed, id) {
  const d = defaultFig(seed, id);
  if (!f || typeof f !== 'object') return d;
  return {
    skin: color(f.skin, d.skin),
    hair: pick(f.hair, ids(FIG.hair), d.hair),
    hairColor: color(f.hairColor, d.hairColor),
    eyes: pick(f.eyes, ids(FIG.eyes), d.eyes),
    acc: pick(f.acc, ids(FIG.acc), d.acc),
    shirt: color(f.shirt, d.shirt),
    pants: color(f.pants, d.pants),
    shoes: color(f.shoes, d.shoes),
    wp: pick(f.wp, ids(FIG.wp), d.wp),
    sh: f.sh === undefined ? d.sh : !!f.sh,
  };
}
// escudo só vale com arma de uma mão
export const hasShield = (fig) => !!fig.sh && ONE_HAND.has(fig.wp);
// posição no acampamento que chega dos amigos (ação 'pos')
export function cleanPos(p) {
  const n = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null);
  if (!p || typeof p !== 'object') return null;
  const x = n(p.x, -12, 12), z = n(p.z, -12, 12), r = n(p.r, -10, 10);
  if (x == null || z == null) return null;
  return {
    x,
    z,
    r: r ?? 0,
    s: Number.isInteger(p.s) && p.s >= 0 && p.s < 16 ? p.s : -1,
    w: !!p.w,
    run: !!p.run,
    e: typeof p.e === 'string' ? p.e.slice(0, 12) : '',
    pvp: !!p.pvp,
    hp: n(p.hp, 0, 100) ?? 100,
  };
}
