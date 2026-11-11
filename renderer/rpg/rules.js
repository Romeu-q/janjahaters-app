// Regras do d2Trinities V1.2 (Guia Definitivo), sem nada de tela: dados, críticos, ficha, defesas, ataques e
// a situação no mapa (flanco, surpresa, caído…). O compêndio (raças, armas, monstros…) vem de rpg-data.json.

export const AT = [
  { id: 'f', n: 'Força', s: 'FOR', c: '#f05454' },
  { id: 'a', n: 'Agilidade', s: 'AGI', c: '#4fd18b' },
  { id: 'i', n: 'Inteligência', s: 'INT', c: '#3aa8f0' },
  { id: 'v', n: 'Vontade', s: 'VON', c: '#b07cff' },
];
export const AT_BY = Object.fromEntries(AT.map((a) => [a.id, a]));
export const THREATS = ['6,6', '6,5', '5,5', '6,4', '5,4', '4,4'];
export const CELL_M = 1.5; // cada quadrado do mapa vale 1,5 m (alcance corpo a corpo)
export const DMG_TYPES = ['Contusão', 'Corte', 'Perfuração', 'Fogo', 'Frio', 'Eletricidade', 'Ácido', 'Veneno', 'Necrótico', 'Radiante', 'Psíquico', 'Sônico'];

export const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const int = (v, def = 0) => (Number.isFinite(+v) ? Math.trunc(+v) : def);
export const rid = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');

// ---------------------------------------------------------------- dados
export function die(sides = 6) {
  const max = Math.floor(0x100000000 / sides) * sides;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= max);
  return (buf[0] % sides) + 1;
}
export const rollDice = (n, sides = 6) => Array.from({ length: Math.max(0, n) }, () => die(sides));

// Crítico: dois dados dentro da margem de ameaça (6,6 por padrão). Falha crítica: dois dados em 1 (ou o único
// dado em 1). Saiu os dois na mesma rolagem (4+ dados): um anula o outro.
export function evalCrit(dice, threat = '6,6') {
  const [hi, lo] = String(threat).split(',').map(Number).sort((x, y) => y - x);
  const s = [...dice].sort((x, y) => y - x);
  const crit = s.length >= 2 && s[0] >= (hi || 6) && s[1] >= (lo || 6);
  const ones = dice.filter((d) => d === 1).length;
  const fumble = dice.length === 1 ? ones === 1 : ones >= 2;
  if (crit && fumble) return '';
  return crit ? 'crit' : fumble ? 'fumble' : '';
}
// Pontos de perícia -> dados: 0 = só o atributo; 1-2 = 1d6 (inapto); 3-4 = 2d6 (apto); 5 = 3d6 (super apto)
export const skillDice = (pts) => (pts >= 5 ? 3 : pts >= 3 ? 2 : pts >= 1 ? 1 : 0);
export const ptsText = (pts) => (pts >= 5 ? '◈◈◈◈☗' : '◈'.repeat(Math.max(0, pts)) || '—');

// "2d6+3", "d20", "3d6 + 1d4 - 2" -> { dice: [{n, s, r:[…]}], flat, total }
export function rollFormula(text) {
  const src = String(text || '').replace(/\s+/g, '').toLowerCase();
  if (!/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(src)) return null;
  const out = { dice: [], flat: 0, total: 0 };
  for (const m of src.matchAll(/([+-]?)(?:(\d*)d(\d+)|(\d+))/g)) {
    const sign = m[1] === '-' ? -1 : 1;
    if (m[3]) {
      const n = clamp(int(m[2] || 1), 1, 30);
      const s = clamp(int(m[3]), 2, 1000);
      const r = rollDice(n, s);
      out.dice.push({ n, s, r, sign });
      out.total += sign * r.reduce((x, y) => x + y, 0);
    } else {
      out.flat += sign * int(m[4]);
      out.total += sign * int(m[4]);
    }
  }
  return out;
}

// ---------------------------------------------------------------- ficha
export function newChar(name = '') {
  return {
    name, player: '', race: '', cls: '', opt: 0, paths: [], lv: 1, xp: 0, height: '', weight: '',
    at: { f: 3, a: 3, i: 3, v: 3 },
    pv: 60, pvMax: 60, pm: 60, pmMax: 60,
    bon: { esq: 0, blq: 0, det: 0, rd: 0 },
    sk: {}, prof: {}, ab: [], inv: [], money: 400, threat: '6,6', cast: 'i',
    lang: '', notes: '', conds: [], trk: 0, on: false,
  };
}
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
export function cleanChar(raw) {
  const b = newChar();
  const r = raw && typeof raw === 'object' ? raw : {};
  const c = { ...b };
  c.name = str(r.name, 60);
  c.player = str(r.player, 60);
  c.race = str(r.race, 40);
  c.cls = str(r.cls, 40);
  c.opt = clamp(int(r.opt), 0, 3);
  c.paths = Array.isArray(r.paths) ? r.paths.map((p) => str(p, 40)).filter(Boolean).slice(0, 6) : [];
  c.lv = clamp(int(r.lv, 1), 1, 20);
  c.xp = clamp(int(r.xp), 0, 99999);
  c.height = str(r.height, 20);
  c.weight = str(r.weight, 20);
  for (const k of 'faiv') c.at[k] = clamp(int(r.at?.[k], 3), 0, 30);
  c.at = { ...c.at };
  c.pvMax = clamp(int(r.pvMax, 60), 1, 9999);
  c.pmMax = clamp(int(r.pmMax, 60), 0, 9999);
  c.pv = clamp(int(r.pv, c.pvMax), 0, c.pvMax);
  c.pm = clamp(int(r.pm, c.pmMax), 0, c.pmMax);
  c.bon = {};
  for (const k of ['esq', 'blq', 'det', 'rd']) c.bon[k] = clamp(int(r.bon?.[k]), -20, 50);
  c.sk = {};
  for (const [k, v] of Object.entries(r.sk || {}).slice(0, 40)) if (int(v) > 0) c.sk[str(k, 60)] = clamp(int(v), 0, 5);
  c.prof = {};
  for (const [k, v] of Object.entries(r.prof || {}).slice(0, 30)) if (int(v) > 0) c.prof[str(k, 40)] = clamp(int(v), 0, 5);
  c.ab = Array.isArray(r.ab) ? r.ab.map((a) => str(a, 90)).filter(Boolean).slice(0, 120) : [];
  c.inv = Array.isArray(r.inv)
    ? r.inv.slice(0, 80).map((x) => ({ n: str(x?.n, 80), q: clamp(int(x?.q, 1), 0, 9999), eq: x?.eq ? 1 : 0, ...(x?.note ? { note: str(x.note, 200) } : {}) })).filter((x) => x.n)
    : [];
  c.money = clamp(int(r.money, 400), 0, 99999999);
  c.threat = THREATS.includes(r.threat) ? r.threat : '6,6';
  c.cast = r.cast === 'v' ? 'v' : 'i';
  c.lang = str(r.lang, 300);
  c.notes = str(r.notes, 6000);
  c.conds = Array.isArray(r.conds) ? r.conds.map((x) => str(x, 40)).filter(Boolean).slice(0, 20) : [];
  c.trk = clamp(int(r.trk), 0, 5);
  c.on = !!r.on;
  if (typeof r.img === 'string' && /^f:[a-z0-9]{6,40}$/i.test(r.img)) c.img = r.img; // sprite do token
  return c;
}

const gearOf = (D, name) => D?.gearBy?.get(norm(name));
// Tudo o que sai da ficha por conta: defesas, RD, deslocamento, armas em uso
export function derive(c, D) {
  const eq = c.inv.filter((x) => x.eq).map((x) => gearOf(D, x.n)).filter(Boolean);
  const armor = eq.filter((g) => g.k === 'armadura');
  const heavy = armor.some((g) => /pesada/i.test(g.pr || ''));
  const rigid = armor.some((g) => /r[ií]gida/i.test(g.pr || ''));
  const def = Math.min(8, armor.reduce((s, g) => s + (g.df || 0), 0));
  const rd = armor.reduce((s, g) => s + (g.rd || 0), 0) + (heavy ? 2 : 0) + c.bon.rd;
  const esq = 5 + c.at.a + c.bon.esq;
  const blq = esq + Math.floor(c.at.f / 2) + def + c.bon.blq;
  const det = 8 + Math.max(c.at.v, c.at.i) + c.bon.det;
  const desl = Math.floor(c.at.a / 2) + 5;
  const weapons = eq.filter((g) => g.k === 'arma' && g.dm);
  const unarmed = D?.gear?.find((g) => /^soco/i.test(g.n)) || { n: 'Desarmado', k: 'arma', g: 'Armas Naturais', fn: 0, dm: '1d4 + Força', tp: 'Contusão' };
  const fnOver = armor.some((g) => (g.fn || 0) > c.at.f);
  return { esq, blq, det, rd, def, desl, run: desl * (rigid ? 2 : heavy ? 3 : 4), heavy, rigid, fnOver, weapons: [...weapons, unarmed], canBlock: def > 0 || weapons.length > 0, shield: armor.some((g) => g.sh) };
}
// pontos para gastar até o nível atual (o nível 1 dá 25 de perícia + 2 da classe e 4 habilidades + a racial)
export function budget(c, D) {
  const b = { sk: 27, ab: 5, tal: 0, prof: 0, attr: 0 };
  for (const l of D?.levels || []) {
    if (l.lv < 2 || l.lv > c.lv) continue;
    for (const t of l.b) {
      const n = int(/^(\d+)/.exec(t)?.[1], 1);
      if (/Per[ií]cia/i.test(t)) b.sk += n;
      else if (/Talento/i.test(t)) b.tal += n;
      else if (/Profici[êe]ncia/i.test(t)) b.prof += n;
      else if (/Habilidade/i.test(t)) b.ab += n;
      else if (/^Atributo/i.test(t)) b.attr += 1;
    }
  }
  return b;
}
export const usedSkill = (c) => Object.values(c.sk).reduce((s, v) => s + v, 0);
export const usedProf = (c) => Object.values(c.prof).reduce((s, v) => s + v, 0);
export const xpFor = (D, lv) => (D?.levels || []).filter((l) => l.lv <= lv).reduce((s, l) => s + l.xp, 0);

// ---------------------------------------------------------------- armas e dano
const ATTR_WORD = { forca: 'f', agilidade: 'a', inteligencia: 'i', vontade: 'v' };
// "2d8+Força/Contusão + 1d10/Perfuração" -> { dice: [[2,8],[1,10]], attrs: ['f'], flat: 0, types: [...] }
export function parseDamage(text, tp = '') {
  const out = { dice: [], attrs: [], flat: 0, types: [] };
  const s = String(text || '');
  for (const m of s.matchAll(/(\d+)\s*d\s*(\d+)|(For[çc]a|Agilidade|Intelig[êe]ncia|Vontade)|(\d+)/gi)) {
    if (m[1]) out.dice.push([clamp(int(m[1]), 1, 20), clamp(int(m[2]), 2, 100)]);
    else if (m[3]) out.attrs.push(ATTR_WORD[norm(m[3])]);
    else out.flat += int(m[4]);
  }
  const all = norm(s + ' ' + tp);
  for (const t of DMG_TYPES) if (all.includes(norm(t))) out.types.push(t);
  return out;
}
export function weaponAttr(g) {
  if (g.rg) return 'a';
  return parseDamage(g.dm).attrs[0] || 'f';
}
export function profGroup(D, weaponName) {
  const n = norm(weaponName);
  return (D?.profs || []).find((p) => p.w.some((w) => norm(w) === n || n.startsWith(norm(w)) || norm(w).startsWith(n)))?.n || '';
}
// rola o dano: dados + atributo + fixo; a proficiência soma um dado a mais por ponto; crítico dobra tudo
export function rollDamage(dmg, at, { extraDice = 0, crit = false, bonus = 0, half = false } = {}) {
  const rolls = [];
  let total = dmg.flat + bonus;
  dmg.dice.forEach(([n, s], idx) => {
    const r = rollDice(n + (idx === 0 ? extraDice : 0), s);
    rolls.push({ s, r });
    total += r.reduce((x, y) => x + y, 0);
  });
  for (const a of dmg.attrs) total += at?.[a] || 0;
  if (crit) total *= 2;
  if (half) total = Math.floor(total / 2);
  return { rolls, total: Math.max(0, total), type: dmg.types[0] || '' };
}

// Ataque x defesa. Até a Esquiva: errou. Até o Bloqueio: pega na proteção (dano menos a RD). Acima: dano cheio.
// Monstros do livro têm só "Def": passou, acertou.
export function resolveHit(total, crit, tgt, dmg) {
  if (crit === 'fumble') return { out: 'fumble', final: 0 };
  if (tgt.npc) {
    if (crit !== 'crit' && total <= tgt.def) return { out: 'miss', final: 0 };
    return { out: 'hit', final: Math.max(0, dmg - (tgt.rd || 0)) };
  }
  if (crit !== 'crit' && total <= tgt.esq) return { out: 'miss', final: 0 };
  if (total <= tgt.blq && tgt.canBlock !== false) return { out: 'block', final: Math.max(0, dmg - tgt.rd) };
  return { out: 'hit', final: dmg };
}

// ---------------------------------------------------------------- mapa: distância, flanco e condições
// tokens: { x, y, sz, side, conds: [ids], down }
export function cellDist(a, b) {
  const gap = (p, ps, q, qs) => Math.max(0, p > q ? p - (q + qs - 1) : q - (p + ps - 1));
  return Math.max(gap(a.x, a.sz || 1, b.x, b.sz || 1), gap(a.y, a.sz || 1, b.y, b.sz || 1));
}
export const metersBetween = (a, b) => cellDist(a, b) * CELL_M;
const center = (t) => ({ x: t.x + (t.sz || 1) / 2, y: t.y + (t.sz || 1) / 2 });
// flanco: um aliado do atacante também colado no alvo, do lado oposto
export function flankers(att, tgt, all) {
  if (cellDist(att, tgt) > 1) return [];
  const c = center(tgt), a = center(att);
  const va = { x: a.x - c.x, y: a.y - c.y };
  const la = Math.hypot(va.x, va.y) || 1;
  return all.filter((o) => {
    if (o === att || o === tgt || o.id === att.id || o.id === tgt.id || o.side !== att.side || o.down || cellDist(o, tgt) > 1) return false;
    const b = center(o);
    const vb = { x: b.x - c.x, y: b.y - c.y };
    const lb = Math.hypot(vb.x, vb.y) || 1;
    return (va.x * vb.x + va.y * vb.y) / (la * lb) <= -0.7;
  });
}
const has = (t, ...ids) => ids.some((id) => (t.conds || []).includes(id));
// O que a posição e as condições mudam num ataque: dados a mais/menos, bônus fixo, Esquiva do alvo e avisos
export function situation(att, tgt, all, { melee = true, physical = true } = {}) {
  const s = { dice: 0, flat: 0, esq: 0, notes: [], autoCrit: false };
  const add = (k, v, note) => {
    s[k] += v;
    s.notes.push(note);
  };
  if (att) {
    if (has(att, 'caido', 'cego', 'amedrontado', 'envenenado-naturalmente', 'exausto', 'inapto', 'distraido', 'enregelado-congelando', 'fatigado')) add('dice', -1, 'Atacante em desvantagem (condição): −1d6');
    if (has(att, 'invisivel')) add('dice', 1, 'Atacante invisível: +1d6');
    if (has(att, 'atordoado')) add('flat', -2, 'Atacante atordoado: −2');
    if (has(att, 'ofuscado')) add('flat', -1, 'Atacante ofuscado: −1');
  }
  if (!tgt) return s;
  const adj = att ? cellDist(att, tgt) <= 1 : melee;
  if (physical && has(tgt, 'surpreso-desprevenido')) add('dice', 1, 'Alvo surpreso: +1d6');
  if (has(tgt, 'caido')) adj ? add('dice', 1, 'Alvo caído e ao alcance: +1d6') : add('dice', -1, 'Alvo caído, de longe: −1d6');
  if (has(tgt, 'cego', 'paralisado', 'petrificado')) add('dice', 1, 'Alvo cego/paralisado: +1d6');
  if (has(tgt, 'invisivel')) add('dice', -1, 'Alvo invisível: −1d6');
  if (has(tgt, 'cobertura')) add('esq', 2, 'Alvo com cobertura: Esquiva +2');
  if (has(tgt, 'defesa-total')) add('esq', 4, 'Alvo em Defesa Total: Esquiva +4');
  if (has(tgt, 'atordoado')) add('esq', -2, 'Alvo atordoado: Defesa −2');
  if (has(tgt, 'impedido') && adj) {
    s.autoCrit = true;
    s.notes.push('Alvo impedido e ao alcance: acerto vira crítico');
  }
  if (has(tgt, 'indefeso', 'por-um-fio')) s.notes.push('Alvo indefeso: pode sofrer morte instantânea');
  if (melee && att) {
    const fl = flankers(att, tgt, all);
    if (fl.length) add('flat', 2, `Flanqueando com ${fl[0].name || 'aliado'}: +2`);
  }
  return s;
}

// condições que a mesa usa além das do livro
export const EXTRA_CONDS = [
  { id: 'por-um-fio', n: 'Por um Fio', x: 'Sem Pontos de Vida: inconsciente e Indefeso. Resiste 1 minuto por ponto de Determinação; depois, teste de Vontade (Dificuldade 15) para estabilizar.' },
  { id: 'defesa-total', n: 'Defesa Total', x: 'Manobra: +4 de Esquiva contra todos os ataques até o começo do próximo turno.' },
];
// só as condições que fazem sentido marcar num token
const SKIP_CONDS = new Set(['flanqueando', 'imunidade-a-dano', 'resistencia-a-dano', 'vulneravel-a-dano', 'inapto']);
export const condList = (D) => [...EXTRA_CONDS, ...(D?.conds || []).filter((c) => !SKIP_CONDS.has(c.id))];

// manobras de combate do capítulo 1.9
export const MANEUVERS = [
  { id: 'agarrar', n: 'Agarrar', act: 'Padrão', x: 'Ataque desarmado que ignora o Bloqueio. Com as duas mãos: +2. Acertou: em vez de dano, o alvo fica Agarrado.' },
  { id: 'apertar', n: 'Apertar', act: 'Padrão', x: 'Agarrando com as duas mãos: confronto de Força. Venceu: dano = Força + a margem.' },
  { id: 'derrubar', n: 'Derrubar', act: 'Completa', x: 'Agarrando: confronto de Agilidade ou Força. Venceu: o alvo fica Caído.' },
  { id: 'desarmar', n: 'Desarmar', act: 'Ataque', x: 'Ataque que ignora o Bloqueio; acertou: confronto de Força/Agilidade + FN para tirar o item do alvo.' },
  { id: 'encontrao', n: 'Encontrão', act: 'Completa', x: 'Avança 3 m ou mais e ataca: dano + FN da arma/armadura + 1 por metro. Sua Esquiva fica −2 até o próximo turno.' },
  { id: 'fintar', n: 'Fintar', act: 'Movimento', x: 'O ataque causa metade do dano; seus outros ataques contra o alvo neste turno ganham +1d6.' },
  { id: 'defesa-total', n: 'Defesa Total', act: 'Padrão', x: '+4 de Esquiva contra todos os ataques até o começo do seu próximo turno.' },
];
export const CALLED = [
  { id: '', n: 'Ataque normal' },
  { id: 'vital', n: 'Área vital (dano x2)', x: 'Dano em dobro.' },
  { id: 'perna', n: 'Perna', x: 'Deslocamento pela metade; perde 10 PV ao usar Ação de Movimento.' },
  { id: 'braco', n: 'Braço', x: 'Solta o que segura e não usa mais o braço.' },
  { id: 'especial', n: 'Asa, cauda…', x: 'O membro não pode ser usado.' },
];

// ---------------------------------------------------------------- ficha em texto (modelo do Discord, Apêndice C)
export function sheetText(c, D) {
  const d = derive(c, D);
  const sk = (D?.skills || []).map((s) => `- ${s.n}: ${ptsText(c.sk[s.id] || 0)}`).join('\n');
  return [
    '[ Geral ]',
    `**Jogador:** ${c.player}`, `**Nome:** ${c.name}`, `**Altura:** ${c.height}`, `**Peso:** ${c.weight}`, `**Raça:** ${c.race}`, `**Classe:** ${c.cls}`,
    `**Caminhos:** ${c.paths.join(', ')}`, `**Nível:** ${c.lv}`, `**XP:** ${c.xp}`,
    '-Status-',
    `• **Vida:** ${c.pv}/${c.pvMax}`, `• **Mana:** ${c.pm}/${c.pmMax}`, '• **Defesa:**', `- Esquiva: ${d.esq}`, `- Bloqueio: ${d.blq}`, `- Determinação: ${d.det}`,
    `• **Redução de Dano:** ${d.rd}`,
    '• **Atributos:**', `- Força: ${c.at.f}`, `- Agilidade: ${c.at.a}`, `- Inteligência: ${c.at.i}`, `- Vontade: ${c.at.v}`,
    '• **Deslocamento:**', `- Comum: ${d.desl}`, `- Corrida: ${d.run}`,
    `• **Dinheiro:** ${c.money}`,
    '[ PROFICIÊNCIAS ]', ...Object.entries(c.prof).map(([k, v]) => `- ${k}: ${v}`),
    'PERÍCIAS (◈☗)', sk,
    '[ HABILIDADES ]', ...c.ab.map((a) => `- ${a}`),
    '[ EQUIPAMENTO ]', ...c.inv.map((x) => `- ${x.n}${x.q > 1 ? ' x' + x.q : ''}${x.eq ? ' (em uso)' : ''}`),
    c.lang ? `**Idiomas:** ${c.lang}` : '',
  ].filter((x) => x !== '').join('\n');
}
// lê uma ficha colada do Discord (ou a exportada acima) por cima da ficha atual
export function parseSheet(text, base, D) {
  const c = cleanChar(base);
  const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/[*`_]/g, '').replace(/^[•\-–>\s]+/, '').trim()).filter(Boolean);
  const num = (s) => int(/-?\d+/.exec(s)?.[0], NaN);
  const pair = (s) => {
    const m = /(\d+)\s*\/\s*(\d+)/.exec(s);
    return m ? [int(m[1]), int(m[2])] : Number.isFinite(num(s)) ? [num(s), num(s)] : null;
  };
  let sect = '';
  for (const l of lines) {
    const m = /^([^:]{2,60}):\s*(.*)$/.exec(l);
    if (!m) {
      const n = norm(l);
      if (n.includes('habilidades')) sect = 'ab';
      else if (n.includes('equipamento') || n.includes('inventario')) sect = 'inv';
      else if (n.includes('proficiencias')) sect = 'prof';
      else if (n.includes('pericias')) sect = 'sk';
      else if (n.includes('status') || n.includes('geral')) sect = '';
      else if (sect === 'ab' && l.length < 90) c.ab.includes(l) || c.ab.push(l);
      else if (sect === 'inv' && l.length < 80) {
        const q = /\s+x(\d+)/i.exec(l);
        const name = l.replace(/\s+x\d+/i, '').replace(/\(em uso\)/i, '').trim();
        if (!c.inv.some((x) => norm(x.n) === norm(name))) c.inv.push({ n: name, q: q ? int(q[1]) : 1, eq: /em uso/i.test(l) ? 1 : 0 });
      }
      continue;
    }
    const k = norm(m[1]), v = m[2].trim();
    const skill = (D?.skills || []).find((s) => norm(s.n) === k || (k.length > 4 && norm(s.n).includes(k)));
    if (skill && (sect === 'sk' || /[◈☗]/.test(v) || /^\d$/.test(v))) {
      const pts = /☗/.test(v) ? 5 : (v.match(/◈/g) || []).length || clamp(int(v), 0, 5);
      if (pts) c.sk[skill.id] = pts;
      else delete c.sk[skill.id];
      continue;
    }
    if (sect === 'prof' && Number.isFinite(num(v))) {
      c.prof[m[1].trim().slice(0, 40)] = clamp(num(v), 0, 5);
      continue;
    }
    if (k === 'jogador') c.player = v.slice(0, 60);
    else if (k === 'nome') c.name = v.slice(0, 60) || c.name;
    else if (k === 'altura') c.height = v.slice(0, 20);
    else if (k === 'peso') c.weight = v.slice(0, 20);
    else if (k === 'raca') c.race = (D?.races || []).find((r) => norm(r.n) === norm(v) || norm(r.pl) === norm(v))?.n || v.slice(0, 40);
    else if (k === 'classe') c.cls = (D?.classes || []).find((r) => norm(r.n) === norm(v))?.n || v.slice(0, 40);
    else if (k === 'caminhos' || k === 'caminho') c.paths = v.split(/[,/]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
    else if (k === 'nivel' && Number.isFinite(num(v))) c.lv = clamp(num(v), 1, 20);
    else if (k === 'xp' && Number.isFinite(num(v))) c.xp = Math.max(0, num(v));
    else if (k === 'vida' && pair(v)) [c.pv, c.pvMax] = pair(v);
    else if (k === 'mana' && pair(v)) [c.pm, c.pmMax] = pair(v);
    else if (k === 'forca' && Number.isFinite(num(v))) c.at.f = num(v);
    else if (k === 'agilidade' && Number.isFinite(num(v))) c.at.a = num(v);
    else if (k === 'inteligencia' && Number.isFinite(num(v))) c.at.i = num(v);
    else if (k === 'vontade' && Number.isFinite(num(v))) c.at.v = num(v);
    else if (k === 'dinheiro' && Number.isFinite(num(v))) c.money = Math.max(0, num(v));
    else if (k === 'idiomas') c.lang = v.slice(0, 300);
  }
  const out = cleanChar(c);
  // defesas escritas na ficha viram bônus em cima da conta automática
  for (const [key, re] of [['esq', /^Esquiva:\s*(\d+)/i], ['blq', /^Bloqueio:\s*(\d+)/i], ['det', /^Determina[çc][ãa]o:\s*(\d+)/i]]) {
    const m = lines.map((l) => re.exec(l)).find(Boolean);
    if (m) out.bon[key] = clamp(out.bon[key] + int(m[1]) - derive(out, D)[key], -20, 50);
  }
  return out;
}
