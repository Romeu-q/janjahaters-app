// Sprites dos tokens do mapa, em pixel art 12x12 desenhada aqui mesmo (sem arquivos). Cada criatura cai num tipo
// pelo nome (lobo -> fera, aranha -> aracnídeo…) e ganha uma cor; o Mestre e os jogadores podem trocar por imagem.
// Letras: a = cor principal, b = sombra, s = pele, w = branco, k = escuro, . = vazio
const ART = {
  heroi: ['....kkkk....', '...kssssk...', '...swsswk...', '...kssssk...', '..kkaaaakk..', '.kaaaaaaaak.', '.sakaaaakas.', '.s.kaaaak.s.', '...kabbak...', '...kb..bk...', '...kb..bk...', '..kkk..kkk..'],
  humanoide: ['....aaaa....', '...aaaaaa...', '...awaawa...', '...aaaaaa...', '....abba....', '..aaaaaaaa..', '.aabaaaabaa.', '.aa.aaaa.aa.', '.w..abba..w.', '....a..a....', '....a..a....', '...bb..bb...'],
  fera: ['............', '.a.a........', '.aaaa.......', 'awaaaa....a.', 'aaaaaaaaaaa.', 'kaaaaaaaaaa.', '.waaaaaaaaa.', '..aaaaaaaab.', '..ab.ab.ab..', '..a..a..a...', '..a..a..a...', '..b..b..b...'],
  ave: ['............', '.....aa.....', '....awaa....', '...kkaaa....', '....aaaa....', 'a..aaaaaa..a', 'aaaaaaaaaaaa', '.aaabaabaaa.', '..aabaabaa..', '....aaaa....', '....b..b....', '...kk..kk...'],
  cobra: ['............', '....aaa.....', '...awaaa....', '...aaaaa....', '..kkk.aa....', '......aa....', '.....aab....', '....aab..aa.', '...aab..aaa.', '..aaaaaaab..', '..baaaaab...', '............'],
  aracnideo: ['............', 'a..........a', '.a..a..a..a.', '..a.aaaa.a..', '...aawwaa...', 'aaaaaaaaaaaa', '...aabbaa...', '..aaaaaaaa..', '.a.abaaba.a.', 'a...aaaa...a', '.....bb.....', '............'],
  elemental: ['.....a......', '....aa..a...', '...aaa.aa...', '...aaaaaa...', '..aaawwaaa..', '..aawkkwaa..', '.aaaaaaaaaa.', '.aabaaaabaa.', '.aaaabbaaaa.', '..aaaaaaaa..', '...baaaab...', '....bbbb....'],
  golem: ['...aaaaaa...', '...awaawa...', '...aaaaaa...', '.aaabbbbaaa.', 'aaaaaaaaaaaa', 'aa.aaaaaa.aa', 'aa.abaaba.aa', 'bb.aaaaaa.bb', '...aaaaaa...', '...aa..aa...', '...aa..aa...', '..bbb..bbb..'],
  planta: ['....a..a....', '.a.aaaaaa.a.', '.aaawaawaaa.', '..aaaaaaaa..', '.aaakkkkaaa.', '..aaaaaaaa..', '.....bb.....', '..a..bb..a..', '..aa.bb.aa..', '...aabbaa...', '.....bb.....', '...bbbbbb...'],
  peixe: ['............', '.....a......', '....aaa.....', 'a..aaaaaa...', 'aa.aaaaaaaa.', 'aaaaaaaaawa.', 'aaaaaaaaaaaa', 'aa.aaaaakkk.', 'a..aaaaaa...', '....baa.....', '.....b......', '............'],
  fantasma: ['....aaaa....', '...aaaaaa...', '..aaaaaaaa..', '..akkaakka..', '..akkaakka..', '..aaaaaaaa..', '..aaakkaaa..', '..aaaaaaaa..', '..aaaaaaaa..', '..aaaaaaaa..', '..a.aa.aa.a.', '.....a..a...'],
};
const TYPE = [
  [/espectro|fantasma|alma/, 'fantasma', '#b9c6e8'],
  [/elemental do fogo|magma|blazekin/, 'elemental', '#ef6a2c'],
  [/elemental do raio/, 'elemental', '#f2d13a'],
  [/elemental do vento/, 'elemental', '#b5e3d8'],
  [/elemental d[ao] agua/, 'elemental', '#3f8fe0'],
  [/elemental da luz/, 'elemental', '#f5efc4'],
  [/elemental das trevas/, 'elemental', '#6a4a9c'],
  [/gelo/, 'elemental', '#9fd8f2'],
  [/elemental/, 'elemental', '#c98a4a'],
  [/golem de ferro|homunculo mineral/, 'golem', '#8e99a6'],
  [/golem de barro/, 'golem', '#b0764a'],
  [/golem de madeira/, 'golem', '#8a6a3c'],
  [/golem de carne|berliargos/, 'golem', '#c47a7a'],
  [/golem/, 'golem', '#8b8f96'],
  [/aranha|escorpiao/, 'aracnideo', '#7b5aa6'],
  [/serpente|naga|cobra|hidra/, 'cobra', '#5fae4e'],
  [/aguia|coruja|corvo|morcego/, 'ave', '#8f7a5c'],
  [/tubarao|baleia|peixe/, 'peixe', '#5f8fb5'],
  [/mandragora|flora|azaleia|engolfadora|parasita|vegeta|planta/, 'planta', '#58a85a'],
  [/imp |^imp|homunculo|soldado|bandido|guarda|orc|goblin|zumbi|esqueleto/, 'humanoide', '#b8524e'],
  [/urso|gorila|mamute|elefante|rinoceronte/, 'fera', '#8a5c38'],
  [/lobo|worg|cao|hiena|raposa/, 'fera', '#8d9199'],
  [/leao|tigre|guepardo|gato/, 'fera', '#d99a3c'],
  [/alce|bode|burro|camelo|cavalo|montaria|ponei|touro|javali|crocodilo|rato|ratazana|esquilo|macaco/, 'fera', '#9a7650'],
];
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
};
const cache = new Map();
// kind 'heroi' para personagens (cor = a do jogador); para criaturas, o tipo sai do nome
export function spriteUrl(name, { hero = false, color = '' } = {}) {
  let type = 'humanoide', col = '#b8524e';
  if (hero) [type, col] = ['heroi', /^#[0-9a-f]{6}$/i.test(color) ? color : '#5b7bf0'];
  else {
    const n = norm(name);
    const hit = TYPE.find(([re]) => re.test(n));
    if (hit) [, type, col] = hit;
  }
  const key = type + col;
  if (cache.has(key)) return cache.get(key);
  const rows = ART[type];
  const cv = document.createElement('canvas');
  cv.width = cv.height = 12;
  const g = cv.getContext('2d');
  const pal = { a: col, b: shade(col, 0.62), s: '#eec39a', w: '#ffffff', k: '#16181c' };
  rows.forEach((row, y) => {
    for (let x = 0; x < 12; x++) {
      const p = pal[row[x]];
      if (!p) continue;
      g.fillStyle = p;
      g.fillRect(x, y, 1, 1);
    }
  });
  const url = cv.toDataURL();
  cache.set(key, url);
  return url;
}
