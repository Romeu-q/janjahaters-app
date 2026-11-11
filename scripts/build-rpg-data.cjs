// Monta renderer/rpg-data.json (o compêndio da mesa de RPG) a partir do texto do livro "Guia Definitivo d2Trinities".
// Uso: node scripts/build-rpg-data.cjs <livro.txt>      (o .txt é o document.xml do .docx convertido, um parágrafo por
// linha, títulos com #, ##, ###, #### e tabelas com | a | b |)
const fs = require('fs');
const path = require('path');
const src = process.argv[2];
if (!src) throw new Error('faltou o caminho do livro.txt');
const L = fs.readFileSync(src, 'utf8').split('\n').map((s) => s.replace(/\s+$/, ''));

const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-');
const title = (s) =>
  s
    .toLowerCase()
    .replace(/(^|[\s(/'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E|Em|A|Ou)\b/g, (m) => m.toLowerCase())
    .replace(/^./, (c) => c.toUpperCase());
const find = (re, from = 0) => {
  for (let i = from; i < L.length; i++) if (re.test(L[i])) return i;
  throw new Error('não achei ' + re);
};
const head = (i) => {
  const m = /^(#+) (.*)$/.exec(L[i] || '');
  return m ? { lv: m[1].length, t: m[2].trim() } : null;
};
const stripNum = (t) => t.replace(/^(FALTA FAZER )?\d+(\.\d+)*\)\s*/, '');

// ---------------------------------------------------------------- marcos do livro
const iCh = (n) => find(new RegExp('^# CAPÍTULO ' + n + ':'));
const C1 = iCh(1), C2 = iCh(2), C3 = iCh(3), C4 = iCh(4), C5 = iCh(5), C6 = iCh(6), C7 = iCh(7), C8 = iCh(8), C9 = iCh(9);
const AA = find(/^# APÊNDICE A/), AB = find(/^# APÊNDICE B/), AC = find(/^# APÊNDICE C/);
const S31 = find(/^## 3\.1\)/, C3), S32 = find(/^## 3\.2\)/, C3), S33 = find(/^## 3\.3\)/, C3), S34 = find(/^## 3\.4\)/, C3);
const S81 = find(/^## 8\.1\)/, C8), S82 = find(/^## 8\.2\)/, C8), S83 = find(/^## 8\.3\)/, C8), S84 = find(/^## 8\.4\)/, C8);
const MAB = find(/^## HABILIDADES DE CRIATURAS/, AB);

// ---------------------------------------------------------------- livro em seções (para ler e buscar)
// Tudo menos as listas de habilidades (cap. 4, 5, 6 e 8.3) e as fichas de monstros, que viram dados.
const book = [];
function addBook(a, b, part) {
  let cur = null;
  const trail = [];
  for (let i = a; i < b; i++) {
    const h = head(i);
    if (h) {
      trail.length = Math.max(0, h.lv - 1);
      trail[h.lv - 1] = title(stripNum(h.t));
      cur = { id: 'b' + book.length, part, t: title(stripNum(h.t)), lv: h.lv, path: trail.filter(Boolean).slice(0, -1).join(' › '), x: '' };
      book.push(cur);
    } else if (cur) cur.x += (cur.x ? '\n' : '') + L[i];
  }
}
addBook(C1, C2, 'Regras');
addBook(C2, C3, 'Mecânicas');
addBook(C3, C4, 'Personagem');
addBook(C7, C8, 'Profissões');
addBook(S81, S83, 'Aditivos');
addBook(S84, C9, 'Aditivos');
addBook(C9, AA, 'Equipamentos');
addBook(AA, AB, 'Regras opcionais');
addBook(AB, find(/^## ANIMAIS/, AB), 'Monstros');
addBook(AC, find(/^## LAYOUT DE FICHA/, AC), 'Níveis');

// ---------------------------------------------------------------- raças
const RACE_ONE = {
  aesires: 'Aesir', anoes: 'Anão', asterios: 'Astério', dopplers: 'Doppler', draconianos: 'Draconiano', elfos: 'Elfo', faens: 'Faen', faunos: 'Fauno',
  firas: 'Fira', goblins: 'Goblin', grotons: 'Groton', hamelins: 'Hamelin', herminatos: 'Herminato', humanos: 'Humano', jubans: 'Juban', levents: 'Levent',
  mahoks: 'Mahok', metadilios: 'Metadílio', nagas: 'Naga', orcs: 'Orc', 'scathens drows': 'Scathen (Drow)', tailox: 'Tailox', tieflings: 'Tiefling',
};
const races = [];
for (let i = S31; i < S32; i++) {
  const h = head(i);
  if (!h || h.lv !== 3) continue;
  const r = { id: slug(h.t), n: RACE_ONE[norm(h.t)] || title(h.t), pl: title(h.t), at: {} };
  for (let j = i + 1; j < S32 && !head(j); j++) {
    const m = /^(Força|Agilidade|Inteligência|Vontade):\s*(\d+)/.exec(L[j]);
    if (m) r.at[{ Força: 'f', Agilidade: 'a', Inteligência: 'i', Vontade: 'v' }[m[1]]] = +m[2];
  }
  if (!Object.keys(r.at).length) r.free = 13; // Metadílios: 13 pontos para distribuir (mínimo 2 em cada)
  races.push(r);
}

// ---------------------------------------------------------------- classes
const AT = { forca: 'f', agilidade: 'a', inteligencia: 'i', vontade: 'v' };
const classes = [];
for (let i = S32; i < S33; i++) {
  const h = head(i);
  if (!h || h.lv !== 3) continue;
  const c = { id: slug(h.t), n: title(h.t), pick: 2, sk: [], op: [] };
  let mode = '';
  for (let j = i + 1; j < S33 && !head(j); j++) {
    const s = L[j];
    if (/^Perícias/i.test(s)) {
      mode = 'sk';
      const m = /Escolha (\d+)/i.exec(s);
      if (m) c.pick = +m[1];
    } else if (/^Bônus de Talento/i.test(s)) mode = 'op';
    else if (/^Descrição/i.test(s)) mode = '';
    else if (mode === 'sk' && /^◈/.test(s)) c.sk.push(s.replace(/^◈\s*/, '').trim());
    else if (mode === 'op') {
      // "Opção N:" abre uma opção; sem opções, as linhas somam num bônus só
      if (/^Opção/i.test(s)) c.op.push({});
      else {
        if (!c.op.length) c.op.push({});
        const o = c.op[c.op.length - 1];
        for (const m of s.matchAll(/(Força|Agilidade|Inteligência|Vontade)\s*\+\s*(\d)|\+\s*(\d)\s*(Força|Agilidade|Inteligência|Vontade)/g)) o[AT[norm(m[1] || m[4])]] = +(m[2] || m[3]);
      }
    }
  }
  c.op = c.op.filter((o) => Object.keys(o).length);
  classes.push(c);
}

// ---------------------------------------------------------------- caminhos
const paths = [];
for (let i = S33; i < S34; i++) {
  const h = head(i);
  if (!h || h.lv !== 3) continue;
  const p = { id: slug(h.t), n: title(h.t), req: [] };
  let on = false;
  for (let j = i + 1; j < S34 && !head(j); j++) {
    if (/^Requisitos?:/i.test(L[j])) on = true;
    else if (on && /^[•\-–]/.test(L[j])) p.req.push(L[j].replace(/^[•\-–]\s*/, '').trim());
  }
  paths.push(p);
}

// ---------------------------------------------------------------- perícias e perks
const skills = [];
{
  const a = find(/^### 2\.1\.1\)/, C2), b = find(/^### 2\.1\.2\)/, C2);
  let cur = null, perk = null;
  for (let i = a + 1; i < b; i++) {
    const h = head(i);
    if (h) {
      const m = /^(.*?)\s*\((.*)\)\s*$/.exec(h.t);
      const attrs = norm(m ? m[2] : '').split(' ou ').map((x) => AT[x.trim()]).filter(Boolean);
      cur = { id: slug(m ? m[1] : h.t), n: title(m ? m[1] : h.t), at: attrs.length ? attrs : ['i'], x: '', pk: [] };
      skills.push(cur);
      perk = null;
      continue;
    }
    if (!cur) continue;
    const m = /^(◈+☗?)\s*[-–]\s*(.+)$/.exec(L[i]);
    if (m) {
      perk = { p: m[1].includes('☗') ? 5 : m[1].length, n: m[2].trim(), x: '' };
      cur.pk.push(perk);
    } else if (perk) perk.x += (perk.x ? '\n' : '') + L[i];
    else cur.x += (cur.x ? '\n' : '') + L[i];
  }
}

// ---------------------------------------------------------------- habilidades (raça, classe, caminho, profissão, talentos…)
const AB_LINE = /^habilidades?\s*(\(([^)]*)\))?\s*[-–—]+\s*(Ação|Reação|Suporte)\s*$/i;
const FIELD = /^(Requisitos?|Mana|Duração|Alcance|Alvos?|Dificuldade da Magia|Dificuldade|Tempo de Execução|Teste de Resistência):\s*(.*)$/i;
const abil = [];
function parseAbil(a, b, kind, fixed) {
  let srcName = fixed || '', sub = '', cur = null;
  const intro = {};
  for (let i = a; i < b; i++) {
    const h = head(i);
    if (h) {
      cur = null;
      if (h.lv === 2 && !fixed) {
        srcName = title(stripNum(h.t));
        sub = '';
      } else sub = title(stripNum(h.t));
      continue;
    }
    if (AB_LINE.test(L[i + 1] || '') && !AB_LINE.test(L[i])) {
      const m = AB_LINE.exec(L[i + 1]);
      cur = { n: L[i].trim(), k: kind, s: srcName, c: title((m[2] || 'Padrão').replace('Caracteristica', 'Característica')), t: title(m[3]), x: '' };
      if (sub) cur.g = sub;
      abil.push(cur);
      i++;
      continue;
    }
    if (!cur) continue;
    const f = FIELD.exec(L[i]);
    if (f) {
      const key = norm(f[1]);
      if (key.startsWith('requisito')) cur.rq = (cur.rq ? cur.rq + '; ' : '') + f[2].trim();
      else if (key === 'mana') cur.pm = f[2].trim();
      else if (key.startsWith('dificuldade')) cur.df = f[2].trim();
      else if (key === 'duracao') cur.du = f[2].trim().replace(/;$/, '');
      else if (key === 'alcance') cur.al = f[2].trim().replace(/;$/, '');
      else if (key.startsWith('alvo')) cur.av = f[2].trim().replace(/;$/, '');
      else cur.x += (cur.x ? '\n' : '') + L[i];
    } else cur.x += (cur.x ? '\n' : '') + L[i].replace(/^Descrição:\s*/i, '');
  }
}
parseAbil(C4, C5, 'raca');
parseAbil(C5, C6, 'classe');
parseAbil(C6, C7, 'caminho');
parseAbil(C7, C8, 'profissao');
parseAbil(S81, S82, 'dogma', 'Dogmas e Bênçãos');
parseAbil(S82, S83, 'espirito', 'Espíritos Animais');
parseAbil(S83, S84, 'talento', 'Talentos');
// nomes das raças das habilidades no singular, iguais aos da lista de raças
for (const a of abil) if (a.k === 'raca') a.s = RACE_ONE[norm(a.s)] || a.s;
// a primeira habilidade de cada raça é a automática
{
  const seen = new Set();
  for (const a of abil) if (a.k === 'raca' && !seen.has(a.s)) {
    seen.add(a.s);
    a.auto = 1;
  }
}

// habilidades de criaturas
const mabil = [];
{
  const before = abil.length;
  parseAbil(MAB + 1, AC, 'criatura', 'Criaturas');
  mabil.push(...abil.splice(before));
}

// ---------------------------------------------------------------- truques
const tricks = [];
{
  const a = find(/^### 8\.4\.1\)/, S84);
  let cur = null;
  for (let i = a + 1; i < C9; i++) {
    if (head(i)) break;
    const s = L[i];
    const next = L[i + 1] || '';
    const nameLike = s.length < 45 && !/[.:;]$/.test(s) && !/^(Material|Duração|Alvo|Alcance)/.test(s);
    if (nameLike && (/^(Material|Duração|Alvo|Alcance|Área)/.test(next) || next.length > 80)) {
      cur = { n: s.trim(), x: '' };
      tricks.push(cur);
    } else if (cur) cur.x += (cur.x ? '\n' : '') + s;
  }
}

// ---------------------------------------------------------------- equipamentos
const EQ_FIELD = /^(Custo|Preço de Mercado|Preço|FN|Dano|Tipo|Propriedades|Redução de Dano|Bônus de Defesa|Peso|Efeito Especial|Requisito|Quantidade|Obs|Observações|Descrição):\s*(.*)$/i;
const gear = [];
function parseGear(a, b, kind, baseGroup) {
  let group = baseGroup, cur = null, free = [];
  const flush = () => {
    if (cur && free.length) cur.x = [cur.x, ...free].filter(Boolean).join('\n');
    free = [];
  };
  for (let i = a; i < b; i++) {
    const h = head(i);
    if (h) {
      flush();
      cur = null;
      group = title(stripNum(h.t)).replace(/^Lista de /, '');
      continue;
    }
    const f = EQ_FIELD.exec(L[i]);
    if (!f) {
      free.push(L[i]);
      continue;
    }
    if (free.length || !cur) {
      // linhas soltas antes de um campo: a primeira é o nome do item, o resto é a descrição
      const name = free.shift();
      if (name && name.length < 80 && !name.includes(':')) {
        cur = { n: name.trim(), k: kind, g: group, x: free.join('\n') };
        gear.push(cur);
      } else if (cur) cur.x = [cur.x, name, ...free].filter(Boolean).join('\n');
      free = [];
    }
    if (!cur) continue;
    const key = norm(f[1]), val = f[2].trim();
    if (key === 'custo' || key.startsWith('preco')) cur.$ = val;
    else if (key === 'fn') cur.fn = parseInt(val, 10) || 0;
    else if (key === 'dano') cur.dm = val;
    else if (key === 'tipo') cur.tp = val;
    else if (key === 'propriedades') cur.pr = val;
    else if (key === 'reducao de dano') cur.rd = parseInt(val, 10) || 0;
    else if (key === 'bonus de defesa') cur.df = parseInt(val.replace('+', ''), 10) || 0;
    else cur.x = [cur.x, L[i]].filter(Boolean).join('\n');
  }
  flush();
}
const sec = (re, from) => find(re, from);
const E = {
  melee: sec(/^### 9\.1\.2\)/, C9), conj: sec(/^### 9\.2\.2\)/, C9), s93: sec(/^## 9\.3\)/, C9), dist: sec(/^### 9\.3\.2\)/, C9), s94: sec(/^## 9\.4\)/, C9),
  exo: sec(/^### 9\.4\.1\)/, C9), s95: sec(/^## 9\.5\)/, C9), inst: sec(/^### 9\.5\.2\)/, C9), tarot: sec(/^### 9\.5\.3\)/, C9), s96: sec(/^## 9\.6\)/, C9),
  arm: sec(/^### 9\.6\.2\)/, C9), s97: sec(/^## 9\.7\)/, C9), s912: sec(/^## 9\.12\)/, C9), s92: sec(/^## 9\.2\)/, C9),
};
parseGear(E.melee, E.s92, 'arma', 'Armas Corporais');
parseGear(E.conj, E.s93, 'arma', 'Armas de Conjuração');
parseGear(E.dist, E.s94, 'arma', 'Armas de Distância');
parseGear(E.exo, E.s95, 'arma', 'Armas Exóticas');
parseGear(E.inst, E.tarot, 'arma', 'Instrumentos Musicais');
parseGear(E.arm, E.s97, 'armadura', 'Armaduras e Escudos');
parseGear(E.s97, AA, 'item', 'Kits');
for (const g of gear) {
  if (g.k === 'armadura') g.sh = /escudo|broquel/i.test(g.n) || /ocupa uma m[ãa]o/i.test(g.pr || '') ? 1 : 0;
  if (g.k === 'arma') g.rg = /Distância/.test(g.g) || /^(Lançamento|Arcos|Bestas)/.test(g.g) ? 1 : 0;
  if (g.k === 'arma' && !g.dm && g.rd == null && !g.fn) g.k = 'item'; // munição, acessórios…
  if (!g.x) delete g.x;
}

// ---------------------------------------------------------------- monstros
const monsters = [];
{
  const KIND = /^(Besta|Troglodita|Humanoide|Esfinge|Qualquer|Variável)\b/;
  const starts = [];
  let group = '';
  const groupAt = [];
  for (let i = AB; i < MAB; i++) {
    const h = head(i);
    if (h) group = title(h.t);
    groupAt[i] = group;
    if (!/^For:\s*\S/.test(L[i])) continue;
    let k = -1;
    for (let j = i - 1; j > i - 16 && j > AB; j--) if (KIND.test(L[j]) && !/:/.test(L[j].slice(0, 14))) { k = j; break; }
    if (k > 0) starts.push({ name: k - 1, kind: k, at: i });
    else if (L[i - 1] && !/[:[\]]|; Dano/.test(L[i - 1]) && L[i - 1].length < 60) starts.push({ name: i - 1, kind: i - 1, at: i }); // ficha curta: só o nome
  }
  const num = (s, re) => {
    const m = re.exec(s);
    return m ? parseInt(m[1], 10) : null;
  };
  starts.forEach((st, idx) => {
    const end = idx + 1 < starts.length ? starts[idx + 1].name : MAB;
    const m = { n: L[st.name].trim(), kd: st.kind === st.name ? '' : L[st.kind].trim(), g: groupAt[st.at], at: {}, atk: [], ab: [], info: [] };
    for (let j = st.kind + 1; j < st.at; j++) m.info.push(L[j]);
    const a = L[st.at] + ' ' + (L[st.at + 1] || '');
    m.at = { f: num(a, /For:\s*(\d+)/), a: num(a, /Agi:\s*(\d+)/), i: num(a, /Int:\s*(\d+)/), v: num(a, /Von:\s*(\d+)/) };
    m.pv = num(a, /PV:\s*\+?(\d+)/) ?? 10;
    m.pm = num(a, /PM:\s*\+?(\d+)/) ?? 0;
    m.df = num(a, /Def:\s*\+?(\d+)/) ?? 8;
    m.ds = num(a, /Desloc:\s*\+?(\d+)/);
    let mode = '';
    const extra = [];
    for (let j = st.at + 1; j < end; j++) {
      const s = L[j];
      if (head(j)) break;
      if (/^PV:/.test(s)) continue;
      if (/^Ataques?:/i.test(s)) mode = 'atk';
      else if (/^Habilidades?:/i.test(s)) mode = 'ab';
      else if (mode === 'atk') {
        const x = /^(.*?)\s*\((.*?);\s*Dano:\s*([^)]*)\)/.exec(s);
        if (x) {
          const [dv, dt] = x[3].split('/');
          m.atk.push({ n: x[1].trim(), k: /dist/i.test(x[2]) ? 'd' : 'c', d: dv.trim(), t: (dt || '').trim() });
        } else extra.push(s);
      } else if (mode === 'ab') {
        const x = /^(.*?)\s*\[(.*?)\]\s*$/.exec(s);
        if (x) m.ab.push(x[1].trim());
        else extra.push(s);
      } else extra.push(s);
    }
    if (extra.length) m.x = extra.join('\n');
    m.info = m.info.join('\n');
    for (const k of Object.keys(m.at)) if (m.at[k] == null) delete m.at[k];
    if (m.ds == null) delete m.ds;
    monsters.push(m);
  });
}

// ---------------------------------------------------------------- níveis
const levels = [];
{
  const a = find(/^\| Nível \| Requisito \| Benefícios/, AC);
  for (let i = a + 1; /^\|/.test(L[i]); i++) {
    const c = L[i].split('|').map((s) => s.trim());
    levels.push({ lv: +c[1], xp: parseInt(c[2], 10) || 0, b: c[3].split(/\s\/\s/).map((s) => s.replace(/^•\s*/, '').trim()).filter(Boolean) });
  }
}
const money = {};
{
  const a = find(/^\| Nível \| Dinheiro Inicial/, C1);
  for (let i = a + 1; /^\|/.test(L[i]); i++) {
    const c = L[i].split('|').map((s) => s.trim());
    money[parseInt(c[1], 10)] = +c[2];
    money[parseInt(c[3], 10)] = +c[4];
  }
}
// proficiências: grupo -> armas
const profs = [];
{
  const a = find(/^### 2\.2\.1\)/, C2);
  for (let i = a + 1; !head(i); i += 2) if (L[i] && L[i + 1]) profs.push({ n: L[i].trim(), w: L[i + 1].replace(/\.$/, '').split(/,\s*/).map((s) => s.trim()) });
}
// condições
const conds = [];
{
  const a = find(/^## 2\.3\)/, C2), b = find(/^## 2\.4\)/, C2);
  let cur = null;
  for (let i = a + 1; i < b; i++) {
    const h = head(i);
    if (h) {
      cur = { id: slug(h.t), n: title(h.t), x: '' };
      conds.push(cur);
    } else if (cur) cur.x += (cur.x ? '\n' : '') + L[i];
  }
}

const data = { v: 'V1.2', races, classes, paths, skills, abil, mabil, tricks, gear, monsters, levels, money, profs, conds, book };
const out = path.join(__dirname, '..', 'renderer', 'rpg-data.json');
fs.writeFileSync(out, JSON.stringify(data));
const cnt = (k) => abil.filter((a) => a.k === k).length;
console.log(
  `raças ${races.length} · classes ${classes.length} · caminhos ${paths.length} · perícias ${skills.length} · habilidades ${abil.length} (raça ${cnt('raca')}, classe ${cnt('classe')}, caminho ${cnt('caminho')}, profissão ${cnt('profissao')}, talento ${cnt('talento')}, dogma ${cnt('dogma')}, espírito ${cnt('espirito')}) · de criaturas ${mabil.length} · truques ${tricks.length} · equipamentos ${gear.length} · monstros ${monsters.length} · níveis ${levels.length} · seções do livro ${book.length} · ${(fs.statSync(out).size / 1024).toFixed(0)} KB`,
);
