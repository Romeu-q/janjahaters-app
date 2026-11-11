// Sistema de RPG de mesa: d2Trinities V1.2 (Drakon).
// Regras oficiais do Guia Definitivo d2Trinities:
// - 4 Atributos: Força, Agilidade, Inteligência e Vontade.
// - 25 Perícias com pontos de 0 a 5 (◈◈◈◈☗):
//     0 pontos     -> apenas o valor do Atributo (0d6 + Atributo)
//     ◈ a ◈◈       -> Inapto: 1d6 + Atributo
//     ◈◈◈ a ◈◈◈◈   -> Apto: 2d6 + Atributo
//     ◈◈◈◈☗        -> Super Apto: 3d6 + Atributo
// - Crítico Decisivo: 2+ dados caindo em 6 (ou dentro da Margem de Ameaça da arma, ex.: (6,5), (5,5)).
// - Falha Crítica: 2+ dados caindo em 1 (ou 1 único quando rola 1d6).
// - Confronto Crítico: quando saem Sucesso Crítico e Falha Crítica juntos (4+ dados), eles se anulam.
// - Ajudar Aliado (mínimo ◈): cada 5 pontos no resultado soma +1 no teste do amigo.

export const ATTRS = [
  { id: 'forca', name: 'Força', short: 'FOR', sub: 'Físico · Vigor · Saúde', color: '#f05454' },
  { id: 'agilidade', name: 'Agilidade', short: 'AGI', sub: 'Destreza · Reflexos · Precisão', color: '#4fd18b' },
  { id: 'inteligencia', name: 'Inteligência', short: 'INT', sub: 'Intelecto · Raciocínio · Percepção', color: '#3aa8f0' },
  { id: 'vontade', name: 'Vontade', short: 'VON', sub: 'Presença · Perseverança · Espírito', color: '#b07cff' },
];

export const RACES = [
  'Humano', 'Aesir', 'Anão', 'Astério', 'Doppler', 'Draconiano', 'Elfo', 'Faen', 'Fauno',
  'Fira', 'Goblin', 'Groton', 'Hamelin', 'Herminato', 'Juban', 'Levent', 'Mahok',
  'Metadílio', 'Naga', 'Orc', 'Scathen (Drow)', 'Tailox', 'Tiefling',
];

export const CLASSES = [
  'Guerreiro', 'Artista Marcial', 'Bardo', 'Bruxo', 'Druída', 'Feiticeiro',
  'Místico', 'Paladino', 'Patrulheiro', 'Sacerdote', 'Skirmisher', 'Rúnico',
];

export const PATHS = [
  '', 'Algoz', 'Anakin', 'Apostador', 'Arborium', 'Arco Zênite', 'Astromante',
  "Azulao'zai", 'Combatente Fantasma', 'Desilusionista', 'Duelista', 'Espiritualista',
  'Giatzo', 'Guardião', 'Masoquista de Batalha', 'Montaria de Haste', 'Janízaro',
  'Kyoshi', 'Ragnaros', 'Quantum', 'Tritanus', 'Vingador', 'Volture',
];

export const THREAT_MARGINS = [
  '6,6', '6,5', '5,5', '6,4', '5,4', '4,4', '6,3', '5,3', '4,3', '3,3',
];

export const CONDITIONS = [
  { id: 'por_um_fio', name: 'Por um Fio', inapto: true, desc: '0 PV · Inconsciente/Indefeso' },
  { id: 'exausto', name: 'Exausto', inapto: true, desc: '0 PM · Todos os testes são Inaptos (-1d6)' },
  { id: 'amedrontado', name: 'Amedrontado', inapto: true, desc: 'Ataques e ações ofensivas com desvantagem (-1d6)' },
  { id: 'atordoado', name: 'Atordoado', inapto: false, desc: '-2 Ataque/Defesa/Agilidade, 1 ação por turno' },
  { id: 'caido', name: 'Caído', inapto: true, desc: 'Ataques sofrem desvantagem (-1d6); só rasteja' },
  { id: 'cego', name: 'Cego', inapto: true, desc: 'Ataques com desvantagem (-1d6); sem Reações' },
  { id: 'distraido', name: 'Distraído', inapto: true, desc: 'Testes como Inapto (-1d6); falha em Magias' },
  { id: 'enregelado', name: 'Enregelado', inapto: true, desc: 'Testes como Inapto (-1d6); metade do deslocamento' },
  { id: 'envenenado_nat', name: 'Envenenado (Natural)', inapto: false, desc: 'Desvantagem em Ataques, Força e Agilidade' },
  { id: 'envenenado_mag', name: 'Envenenado (Mágico)', inapto: false, desc: 'Desvantagem em Magias, Inteligência e Vontade' },
  { id: 'flamejante', name: 'Flamejante', inapto: false, desc: '1d6 de dano de fogo no início do turno' },
  { id: 'sangrando', name: 'Sangrando', inapto: false, desc: 'Perde PV por turno até receber Cura' },
  { id: 'surpreso', name: 'Surpreso/Desprevenido', inapto: false, desc: 'Não pode reagir nem esquivar no 1º turno' },
];

// As 25 perícias oficiais do Capítulo 2.1.1 + Perks (◈ = 1..4, ◈◈◈◈☗ = 5)
export const SKILLS = [
  {
    id: 'atletismo',
    name: 'Atletismo',
    attr: 'forca',
    perks: [
      [1, 'Corrida'],
      [2, 'Saltar'],
      [3, 'Escalada'],
      [5, 'Natação'],
    ],
  },
  {
    id: 'acrobacia',
    name: 'Acrobacia',
    attr: 'agilidade',
    perks: [
      [1, 'Amortecer Queda'],
      [2, 'Cambalhota'],
      [4, 'Levantar Rapidamente'],
      [5, 'Corpo Maleável'],
    ],
  },
  {
    id: 'cavalgar',
    name: 'Cavalgar',
    attr: 'agilidade',
    perks: [
      [1, 'Montar e Desmontar Rapidamente'],
      [2, 'Cavalgar Rapidamente'],
      [3, 'Guiar com os Joelhos'],
      [4, 'Permanecer na Sela'],
      [5, 'Saltar'],
    ],
  },
  {
    id: 'furtividade',
    name: 'Furtividade',
    attr: 'agilidade',
    perks: [],
  },
  {
    id: 'ladinagem',
    name: 'Ladinagem',
    attr: 'agilidade',
    perks: [
      [1, 'Abrir Fechadura'],
      [2, 'Ocultar Item'],
      [3, 'Operar Mecanismos'],
      [4, 'Prestidigitação'],
      [5, 'Forçar Item Mágico'],
    ],
  },
  {
    id: 'iniciativa',
    name: 'Iniciativa',
    attr: 'agi_int',
    perks: [[3, 'Evitar Finta']],
  },
  {
    id: 'alquimia',
    name: 'Alquimia',
    attr: 'inteligencia',
    perks: [
      [1, 'Despertar da Matéria'],
      [2, 'A Dança dos Catalisadores'],
      [3, 'O Códice da Transgressão'],
      [4, 'Quinta Essência'],
      [5, 'Bioética'],
    ],
  },
  {
    id: 'arcano',
    name: 'Conhecimento Arcano',
    attr: 'inteligencia',
    perks: [
      [2, 'Escrever Runa'],
      [3, 'Troca Equivalente'],
      [4, 'Planar'],
      [5, 'Astrologia'],
    ],
  },
  {
    id: 'historia',
    name: 'Conhecimento de História e Religião',
    short: 'História e Religião',
    attr: 'inteligencia',
    perks: [
      [1, 'Decifrar Escrituras'],
      [2, 'Escrever Runa'],
      [3, 'Mitos e Lendas'],
      [4, 'Realizar Ritos'],
      [5, 'Sinais da Morte'],
    ],
  },
  {
    id: 'natureza',
    name: 'Conhecimento de Natureza e Geografia',
    short: 'Natureza e Geografia',
    attr: 'inteligencia',
    perks: [
      [1, 'Identificar Criatura ou Fenômeno'],
      [2, 'Entender Mistérios Naturais'],
      [3, 'Escrever Runa'],
      [5, 'Troca Equivalente'],
    ],
  },
  {
    id: 'engenharia',
    name: 'Conhecimento de Artes Militares e Engenharia',
    short: 'Artes Militares e Eng.',
    attr: 'inteligencia',
    perks: [
      [1, 'Aprendiz de Forja e Costura'],
      [2, 'Analisar Batalhas e Projetos'],
      [3, 'Procurar Vantagem Estratégica'],
      [4, 'Forja e Alfaiataria Avançada'],
      [5, 'Ferreiro Lendário'],
    ],
  },
  {
    id: 'nobreza',
    name: 'Conhecimento Local e de Nobreza',
    short: 'Local e Nobreza',
    attr: 'inteligencia',
    perks: [[3, 'Geopolítica e Povos']],
  },
  {
    id: 'cura',
    name: 'Cura',
    attr: 'inteligencia',
    perks: [
      [1, 'Primeiros Socorros'],
      [2, 'Cuidados Prolongados'],
      [3, 'Tratar Doenças'],
      [4, 'Tratar Venenos'],
      [5, 'Realizar Implante'],
    ],
  },
  {
    id: 'id_magia',
    name: 'Identificar Magia',
    attr: 'inteligencia',
    perks: [
      [2, 'Identificar Magia'],
      [3, 'Identificar Poção'],
      [5, 'Forçar Item Mágico'],
    ],
  },
  {
    id: 'intuicao',
    name: 'Intuição',
    attr: 'inteligencia',
    perks: [
      [3, 'Desacreditar'],
      [5, 'Sentir Motivação'],
    ],
  },
  {
    id: 'percepcao',
    name: 'Percepção',
    attr: 'inteligencia',
    perks: [
      [1, 'Observar'],
      [2, 'Ouvir'],
      [3, 'Ver Através de Disfarce'],
      [4, 'Procurar'],
      [5, 'Perceber Criaturas Invisíveis'],
    ],
  },
  {
    id: 'sobrevivencia',
    name: 'Sobrevivência',
    attr: 'inteligencia',
    perks: [
      [3, 'Pilhar Presa'],
      [5, 'Rastrear'],
    ],
  },
  {
    id: 'animais',
    name: 'Adestrar Animais',
    attr: 'vontade',
    perks: [
      [2, 'Domesticar Animais Selvagens'],
      [3, 'Ensinar Truque'],
      [4, 'Forçar Truque'],
      [5, 'Manejar Animal para Montaria'],
    ],
  },
  {
    id: 'dramaturgia',
    name: 'Atuação em Dramaturgia e Oratória',
    short: 'Dramaturgia e Oratória',
    attr: 'vontade',
    perks: [[5, 'Identificar Personagem']],
  },
  {
    id: 'musica',
    name: 'Atuação em Música e Dança',
    short: 'Música e Dança',
    attr: 'vontade',
    perks: [[5, 'A Arte Imita a Vida']],
  },
  {
    id: 'diplomacia',
    name: 'Diplomacia',
    attr: 'vontade',
    perks: [
      [2, 'Barganhar'],
      [4, 'Mudar Atitude'],
    ],
  },
  {
    id: 'enganacao',
    name: 'Enganação',
    attr: 'vontade',
    perks: [
      [1, 'Blefar'],
      [2, 'Disfarce'],
      [4, 'Falsificação'],
      [5, 'Fintar'],
    ],
  },
  {
    id: 'intimidacao',
    name: 'Intimidação',
    attr: 'vontade',
    perks: [],
  },
  {
    id: 'meditacao',
    name: 'Meditação',
    attr: 'vontade',
    perks: [
      [2, 'Memorizar'],
      [3, 'Força de Vontade'],
      [4, 'Lançar Magia de Armadura'],
      [5, 'Resistir a Medo e Magia'],
    ],
  },
  {
    id: 'informacoes',
    name: 'Obter Informações',
    attr: 'vontade',
    perks: [],
  },
];

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));
export const ATTR_BY_ID = new Map(ATTRS.map((a) => [a.id, a]));

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(Number(v)) ? Math.round(Number(v)) : lo));
const cleanStr = (s, max = 60) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);

// Símbolos do livro para pontos de perícia (0..5)
export function ptsSymbols(pts) {
  const n = clamp(pts, 0, 5);
  if (n === 0) return '—';
  if (n === 5) return '◈◈◈◈☗';
  return '◈'.repeat(n);
}

// Quantos d6 uma perícia rola naturalmente pelos pontos (Cap. 2.1 - Perícias e Aptidão)
export function skillBaseDice(pts) {
  const n = clamp(pts, 0, 5);
  if (n === 0) return 0;
  if (n <= 2) return 1; // Inapto (◈ a ◈◈)
  if (n <= 4) return 2; // Apto (◈◈◈ a ◈◈◈◈)
  return 3; // Super Apto (◈◈◈◈☗)
}

export function skillRankLabel(pts) {
  const n = clamp(pts, 0, 5);
  if (n === 0) return 'Sem pontos';
  if (n <= 2) return 'Inapto';
  if (n <= 4) return 'Apto';
  return 'Super Apto';
}

// Perks desbloqueados em uma perícia de acordo com os pontos atuais
export function unlockedPerks(skillId, pts) {
  const sk = SKILL_BY_ID.get(skillId);
  if (!sk) return [];
  const n = clamp(pts, 0, 5);
  return sk.perks.filter(([req]) => n >= req).map(([, name]) => name);
}

// Valor e nome do atributo usado por uma perícia ou teste
export function resolveAttr(sheet, attrKey) {
  const a = sheet?.attrs || {};
  if (attrKey === 'agi_int') {
    const agi = clamp(a.agilidade ?? 3, 0, 30);
    const int = clamp(a.inteligencia ?? 3, 0, 30);
    return agi >= int
      ? { id: 'agilidade', name: 'Agilidade', short: 'AGI', val: agi }
      : { id: 'inteligencia', name: 'Inteligência', short: 'INT', val: int };
  }
  const meta = ATTR_BY_ID.get(attrKey) || ATTRS[0];
  return { id: meta.id, name: meta.name, short: meta.short, val: clamp(a[meta.id] ?? 3, 0, 30) };
}

// Ficha padrão de Nível 1 (60 PV, 60 PM, atributos base 3)
export function defaultSheet(playerName = '') {
  const skills = {};
  for (const s of SKILLS) skills[s.id] = 0;
  skills.percepcao = 3; // Apto por padrão para já testar de cara
  skills.atletismo = 1;
  skills.iniciativa = 3;
  return {
    charName: cleanStr(playerName, 40) || 'Aventureiro',
    race: 'Humano',
    cls: 'Guerreiro',
    path: '',
    level: 1,
    xp: 0,
    isGm: false,
    pv: 60,
    pvMax: 60,
    pm: 60,
    pmMax: 60,
    attrs: {
      forca: 3,
      agilidade: 3,
      inteligencia: 3,
      vontade: 3,
    },
    defBonus: {
      esquiva: 0,
      armadura: 0,
      bloqueio: 0,
      determinacao: 0,
    },
    rd: {
      fisico: 0,
      magico: 0,
      elemental: 0,
    },
    inspiration: 0,
    tricksUsed: 0,
    money: 400,
    threat: '6,6',
    armorFn: 0,
    skills,
    conditions: [],
    weapons: [
      { id: 'w1', name: 'Espada Curta', attr: 'forca', dmg: '2d4', prof: 1, fn: 1, threat: '6,6' },
    ],
    notes: '',
  };
}

export function cleanSheet(raw, fallbackName = '') {
  const d = defaultSheet(fallbackName);
  if (!raw || typeof raw !== 'object') return d;
  const skills = {};
  for (const s of SKILLS) skills[s.id] = clamp(raw.skills?.[s.id] ?? 0, 0, 5);
  const condIds = new Set(CONDITIONS.map((c) => c.id));
  const conditions = Array.isArray(raw.conditions) ? raw.conditions.filter((c) => condIds.has(c)).slice(0, 12) : [];
  const weapons = Array.isArray(raw.weapons)
    ? raw.weapons
        .filter((w) => w && typeof w === 'object')
        .slice(0, 8)
        .map((w, i) => ({
          id: cleanStr(w.id, 20) || 'w' + (i + 1),
          name: cleanStr(w.name, 40) || 'Arma',
          attr: ATTR_BY_ID.has(w.attr) ? w.attr : 'forca',
          dmg: /^\d{1,2}d\d{1,2}(?:[+-]\d{1,2})?$/i.test(String(w.dmg || '').trim()) ? String(w.dmg).trim().toLowerCase() : '1d6',
          prof: clamp(w.prof ?? 0, 0, 10),
          fn: clamp(w.fn ?? 1, 0, 12),
          threat: THREAT_MARGINS.includes(w.threat) ? w.threat : '6,6',
        }))
    : d.weapons;
  const pvMax = clamp(raw.pvMax ?? 60, 1, 9999);
  const pmMax = clamp(raw.pmMax ?? 60, 0, 9999);
  return {
    charName: cleanStr(raw.charName, 40) || d.charName,
    race: cleanStr(raw.race, 32) || 'Humano',
    cls: cleanStr(raw.cls, 32) || 'Guerreiro',
    path: cleanStr(raw.path, 32),
    level: clamp(raw.level ?? 1, 1, 20),
    xp: clamp(raw.xp ?? 0, 0, 99999),
    isGm: !!raw.isGm,
    pv: clamp(raw.pv ?? pvMax, -99, pvMax),
    pvMax,
    pm: clamp(raw.pm ?? pmMax, 0, pmMax),
    pmMax,
    attrs: {
      forca: clamp(raw.attrs?.forca ?? 3, 0, 30),
      agilidade: clamp(raw.attrs?.agilidade ?? 3, 0, 30),
      inteligencia: clamp(raw.attrs?.inteligencia ?? 3, 0, 30),
      vontade: clamp(raw.attrs?.vontade ?? 3, 0, 30),
    },
    defBonus: {
      esquiva: clamp(raw.defBonus?.esquiva ?? 0, -20, 30),
      armadura: clamp(raw.defBonus?.armadura ?? 0, 0, 8), // Cap. 1.12: Bônus de Armadura+Escudo máx 8
      bloqueio: clamp(raw.defBonus?.bloqueio ?? 0, -20, 30),
      determinacao: clamp(raw.defBonus?.determinacao ?? 0, -20, 30),
    },
    rd: {
      fisico: clamp(raw.rd?.fisico ?? 0, 0, 999),
      magico: clamp(raw.rd?.magico ?? 0, 0, 999),
      elemental: clamp(raw.rd?.elemental ?? 0, 0, 999),
    },
    inspiration: clamp(raw.inspiration ?? 0, 0, 3),
    tricksUsed: clamp(raw.tricksUsed ?? 0, 0, 5),
    money: clamp(raw.money ?? 400, 0, 9999999),
    threat: THREAT_MARGINS.includes(raw.threat) ? raw.threat : '6,6',
    armorFn: clamp(raw.armorFn ?? 0, 0, 15),
    skills,
    conditions,
    weapons,
    notes: String(raw.notes || '').slice(0, 1500),
  };
}

// Cálculos derivados (Cap. 1.8 Deslocamento, Cap. 1.12 Defesa, Cap. 2.1.2 Truques)
export function calcDerived(sheet) {
  const forca = sheet.attrs.forca;
  const agi = sheet.attrs.agilidade;
  const int = sheet.attrs.inteligencia;
  const von = sheet.attrs.vontade;
  const esquiva = 5 + agi + (sheet.defBonus.esquiva || 0);
  const arm = Math.min(8, Math.max(0, sheet.defBonus.armadura || 0));
  const bloqueio = esquiva + Math.floor(forca / 2) + arm + (sheet.defBonus.bloqueio || 0);
  const determinacao = 8 + Math.max(von, int) + (sheet.defBonus.determinacao || 0);
  const deslocamento = 5 + Math.floor(agi / 2);
  const corrida = deslocamento * 4;
  const tricksMax = clamp(sheet.skills.arcano || 0, 0, 5);
  const hasTrocaEquivalente = (sheet.skills.arcano || 0) >= 3 || (sheet.skills.natureza || 0) >= 5;
  return {
    esquiva,
    bloqueio,
    determinacao,
    deslocamento,
    corrida,
    tricksMax,
    hasTrocaEquivalente,
  };
}

// Resumo compacto da ficha para mandar no "hi" aos amigos da call
export function sheetSummary(sheet) {
  if (!sheet) return null;
  const d = calcDerived(sheet);
  return {
    cn: cleanStr(sheet.charName, 32),
    rc: cleanStr(sheet.race, 24),
    cl: cleanStr(sheet.cls, 24),
    lv: clamp(sheet.level, 1, 20),
    gm: !!sheet.isGm,
    pv: clamp(sheet.pv, -99, 9999),
    pvm: clamp(sheet.pvMax, 1, 9999),
    pm: clamp(sheet.pm, 0, 9999),
    pmm: clamp(sheet.pmMax, 0, 9999),
    esq: d.esquiva,
    blq: d.bloqueio,
    det: d.determinacao,
  };
}

export function cleanSheetSummary(s) {
  if (!s || typeof s !== 'object' || typeof s.cn !== 'string') return null;
  return {
    cn: cleanStr(s.cn, 32),
    rc: cleanStr(s.rc, 24),
    cl: cleanStr(s.cl, 24),
    lv: clamp(s.lv ?? 1, 1, 20),
    gm: !!s.gm,
    pv: clamp(s.pv ?? 60, -99, 9999),
    pvm: clamp(s.pvm ?? 60, 1, 9999),
    pm: clamp(s.pm ?? 60, 0, 9999),
    pmm: clamp(s.pmm ?? 60, 0, 9999),
    esq: clamp(s.esq ?? 8, 0, 99),
    blq: clamp(s.blq ?? 9, 0, 99),
    det: clamp(s.det ?? 11, 0, 99),
  };
}

// Criptograficamente aleatório 1..sides
function randDie(sides = 6) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] % sides) + 1;
}

// Avalia Sucesso Crítico, Falha Crítica e Confronto Crítico (Seções 1.10 e 1.14)
export function evalCrit(dice, threat = '6,6') {
  if (!Array.isArray(dice) || !dice.length) return 'normal';
  const [t1, t2] = String(threat || '6,6')
    .split(',')
    .map((x) => clamp(x, 2, 6));
  const sorted = [...dice].sort((a, b) => b - a);
  const hasCrit = dice.length >= 2 && sorted[0] >= (t1 || 6) && sorted[1] >= (t2 || 6);
  const ones = dice.filter((d) => d === 1).length;
  const hasFumble = dice.length === 1 ? ones === 1 : ones >= 2;
  if (hasCrit && hasFumble) return 'clash'; // Confronto Crítico: anulam-se!
  if (hasCrit) return 'crit';
  if (hasFumble) return 'fumble';
  return 'normal';
}

// ============================================================
// CAPÍTULO 1.9 & 1.11: COMBATE, ECONOMIA DE AÇÕES E MANOBRAS
// ============================================================

export const ACTION_TYPES = [
  { id: 'standard', name: 'Ação Padrão', short: 'Padrão', badge: 'PADRÃO', desc: '1 por turno (ou pode ser convertida em 1 Ação de Movimento)' },
  { id: 'move', name: 'Ação de Movimento', short: 'Movimento', badge: 'MOVIMENTO', desc: '1 por turno (deslocar-se, levantar, sacar FN ≥ 2, escapar de agarrão)' },
  { id: 'full', name: 'Ação de Rodada Completa', short: 'Rodada Completa', badge: 'COMPLETA', desc: 'Consome a Ação Padrão + Ação de Movimento do turno (ex.: Encontrão, Derrubar)' },
  { id: 'free', name: 'Ação Livre', short: 'Livre', badge: 'AÇÃO LIVRE', desc: 'Não gasta Padrão nem Movimento (máx. 1x cada tipo de ação livre por turno)' },
  { id: 'reaction', name: 'Reação', short: 'Reação', badge: 'REAÇÃO', desc: 'Resposta rápida no turno ou fora dele (ex.: Fintar, Defesa Total, Habilidade de Reação)' },
];

export const ACTION_TYPE_BY_ID = new Map(ACTION_TYPES.map((a) => [a.id, a]));

// Ataques Localizados / Alvo Específico (Cap. 1.9)
export const CALLED_SHOTS = [
  { id: 'none', name: 'Ataque Normal', esqMod: 0, dmgMult: 1, effect: '' },
  { id: 'vital', name: 'Área Vital / Cabeça (+4 Esq alvo · 2x Dano)', esqMod: 4, dmgMult: 2, effect: 'Área Vital: Causa o dobro do dano!' },
  { id: 'leg', name: 'Perna / Locomotor (+4 Esq alvo · ½ Desloc.)', esqMod: 4, dmgMult: 1, effect: 'Perna atingida: Deslocamento à metade e -10 PV por Ação de Movimento!' },
  { id: 'arm', name: 'Braço / Mão (+4 Esq alvo · Solta itens)', esqMod: 4, dmgMult: 1, effect: 'Braço atingido: Alvo solta o que segura na mão e não pode usar o braço!' },
  { id: 'wing', name: 'Asa / Membro Especial (+4 Esq alvo)', esqMod: 4, dmgMult: 1, effect: 'Membro especial atingido: Inutilizado (-10 PV e -10 PM/turno se voando)!' },
];

export const CALLED_SHOT_BY_ID = new Map(CALLED_SHOTS.map((c) => [c.id, c]));

// Catálogo oficial de Ações e Manobras de Combate (Cap. 1.9 e 1.11)
export const COMBAT_ACTIONS = [
  // Ações Padrão (Cap. 1.9 / 1.11.3)
  { id: 'attack', type: 'standard', name: 'Atacar com Arma', desc: '2d6 + Atributo + Proficiência contra Esquiva/Bloqueio do alvo.', roll: true },
  { id: 'grapple', type: 'standard', name: 'Agarrar', desc: 'Ataque Desarmado (FOR/AGI) que ignora Bloqueio (+2 se usar as 2 mãos). Deixa o alvo Agarrado.', roll: true, ignoresBlock: true },
  { id: 'squeeze', type: 'standard', name: 'Apertar (Alvo Agarrado)', desc: 'Confronto de Força contra alvo Agarrado. Se vencer, causa FOR + margem vencida de dano.', roll: true },
  { id: 'disarm', type: 'standard', name: 'Desarmar', desc: 'Ataque (FOR/AGI + FN da arma) ignorando Bloqueio para arrancar arma ou escudo do alvo.', roll: true, ignoresBlock: true },
  { id: 'total_def', type: 'standard', name: 'Defesa Total', desc: 'Assume postura defensiva: +4 de Esquiva como Reação contra todos os ataques até seu próximo turno.', roll: false },
  { id: 'cast_skill', type: 'standard', name: 'Habilidade de Ação / Magia', desc: 'Ativa uma Habilidade de Ação ou conjura magia no turno.', roll: true },
  { id: 'std_to_move', type: 'standard', name: 'Converter Padrão → Movimento', desc: 'Cap. 1.11.3: Usa sua Ação Padrão para realizar uma 2ª Ação de Movimento neste turno.', roll: false },

  // Ações de Movimento (Cap. 1.11.2)
  { id: 'move_walk', type: 'move', name: 'Deslocar-se', desc: 'Move até o seu Deslocamento em metros (terreno difícil ou rastejar reduz à metade).', roll: false },
  { id: 'stand_up', type: 'move', name: 'Levantar-se', desc: 'Levanta do chão, removendo a condição Caído.', roll: false },
  { id: 'draw_heavy', type: 'move', name: 'Sacar Arma/Item (FN ≥ 2)', desc: 'Saca arma pesada (FN 2 ou mais) ou pega um item do chão.', roll: false },
  { id: 'escape_grapple', type: 'move', name: 'Escapar de Agarrão', desc: 'Cap. 1.9: Confronto de Força ou Agilidade (o maior) para se soltar de quem está Agarrando.', roll: true },

  // Ações de Rodada Completa (Cap. 1.11.4 — consome Padrão + Movimento)
  { id: 'charge', type: 'full', name: 'Encontrão (Investida ≥ 3m)', desc: 'Avança ≥3m e ataca: soma maior FN (arma/armadura) + metros ao dano, mas sofre -2 Esquiva até o próximo turno.', roll: true },
  { id: 'takedown', type: 'full', name: 'Derrubar (Alvo Agarrado)', desc: 'Confronto de FOR ou AGI para derrubar o alvo Agarrado, deixando-o Caído.', roll: true },
  { id: 'use_item_full', type: 'full', name: 'Beber Poção / Ler Tomo / Mochila', desc: 'Procura item na mochila, bebe poção ou lança magia a partir de um tomo.', roll: false },

  // Ações Livres (Cap. 1.11.1 — 1x cada tipo por turno, sem gastar Padrão ou Movimento)
  { id: 'free_draw_light', type: 'free', name: 'Sacar Arma Leve (FN ≤ 1) / Flecha', desc: 'Saca item do cinto/aljava ou arma leve de FN 1 ou menos.', roll: false },
  { id: 'free_drop', type: 'free', name: 'Soltar Item das Mãos', desc: 'Larga imediatamente o que estiver segurando.', roll: false },
  { id: 'free_release', type: 'free', name: 'Soltar Alvo Agarrado', desc: 'Cap. 1.9: Solta voluntariamente um oponente que você esteja Agarrando.', roll: false },
  { id: 'free_speak', type: 'free', name: 'Falar / Gritar Alerta Curto', desc: 'Frase rápida em combate (ex.: "Cuidado, atrás de você!").', roll: false },
  { id: 'free_dismount', type: 'free', name: 'Desmontar Rápido', desc: 'Desce rapidamente da montaria como Ação Livre.', roll: false },

  // Reações (Cap. 1.9 / Cap. 4 e 5)
  { id: 'feint', type: 'reaction', name: 'Fintar (+1d6 nos ataques do turno)', desc: 'Reação + consome Ação de Movimento: ataque causa metade do dano, mas dá +1d6 nos outros ataques deste turno.', roll: true },
  { id: 'reaction_ability', type: 'reaction', name: 'Habilidade de Reação / Contra-Ataque', desc: 'Usa uma Habilidade do tipo Reação (1x por rodada/turno em resposta a um gatilho).', roll: false },
];

export const COMBAT_ACTION_BY_ID = new Map(COMBAT_ACTIONS.map((a) => [a.id, a]));

// Estado da economia de ações de um personagem no turno atual (Cap. 1.11)
export function defaultTurnState() {
  return {
    standard: 1,
    move: 1,
    reaction: 1,
    freeUsed: [], // cada Ação Livre distinta pode ser usada 1x por turno (Cap. 1.11.1)
    stance: '', // '' | 'total_def' (+4 Esq) | 'charge' (-2 Esq)
    feintBonus: false, // +1d6 nos próximos ataques do turno após Fintar
  };
}

// Verifica se o personagem pode executar determinada ação no turno atual (Cap. 1.11)
export function canUseAction(turn, actionType, actionId = '') {
  const t = turn || defaultTurnState();
  if (actionType === 'standard') return t.standard >= 1;
  if (actionType === 'move') return t.move >= 1;
  if (actionType === 'full') return t.standard >= 1 && t.move >= 1; // Ação Completa exige Padrão + Movimento livres
  if (actionType === 'free') return !(t.freeUsed || []).includes(actionId); // 1x cada ação livre por turno
  if (actionType === 'reaction') {
    if (actionId === 'feint') return t.reaction >= 1 && t.move >= 1; // Fintar exige Reação e consome Ação de Movimento (Cap. 1.9)
    return t.reaction >= 1;
  }
  return true;
}

// Consome a ação no estado do turno e aplica posturas/efeitos (Cap. 1.9 e 1.11)
export function consumeAction(turn, actionType, actionId = '') {
  const next = {
    standard: clamp(turn?.standard ?? 1, 0, 2),
    move: clamp(turn?.move ?? 1, 0, 3),
    reaction: clamp(turn?.reaction ?? 1, 0, 2),
    freeUsed: Array.isArray(turn?.freeUsed) ? [...turn.freeUsed] : [],
    stance: turn?.stance || '',
    feintBonus: !!turn?.feintBonus,
  };
  if (actionType === 'standard') {
    next.standard = Math.max(0, next.standard - 1);
    if (actionId === 'std_to_move') next.move += 1; // Cap. 1.11.3: usa Padrão para ganhar 1 Movimento
    if (actionId === 'total_def') {
      next.stance = 'total_def';
      next.reaction = Math.max(0, next.reaction - 1);
    }
  } else if (actionType === 'move') {
    next.move = Math.max(0, next.move - 1);
  } else if (actionType === 'full') {
    next.standard = 0;
    next.move = 0;
    if (actionId === 'charge') next.stance = 'charge'; // Encontrão reduz Esquiva em 2 até o próximo turno
  } else if (actionType === 'free') {
    if (actionId && !next.freeUsed.includes(actionId)) next.freeUsed.push(actionId);
  } else if (actionType === 'reaction') {
    next.reaction = Math.max(0, next.reaction - 1);
    if (actionId === 'feint') {
      next.move = Math.max(0, next.move - 1);
      next.feintBonus = true;
    }
  }
  return next;
}

// Compara o resultado de um ataque contra as Defesas do Alvo (Cap. 1.12: Esquiva vs Bloqueio vs Direto)
export function evalAttackVsDefense(attackTotal, crit, rawDmg, target, opts = {}) {
  if (!target || typeof target !== 'object') return null;
  const called = CALLED_SHOT_BY_ID.get(opts.calledShot || 'none') || CALLED_SHOTS[0];
  const ignoresBlock = !!opts.ignoresBlock;
  const esq = clamp((target.esq ?? 8) + called.esqMod, 0, 99);
  const blq = clamp(target.blq ?? esq, 0, 99);
  const rd = clamp(target.rd ?? 0, 0, 999);
  const baseDmg = Math.max(0, Number(rawDmg) || 0);

  if (crit === 'fumble' || (crit !== 'crit' && attackTotal <= esq)) {
    return {
      targetName: cleanStr(target.name, 32) || 'Alvo',
      outcome: 'miss',
      label: `Errou (≤ Esq ${esq})`,
      esq,
      blq,
      rd,
      finalDmg: 0,
      calledEffect: '',
    };
  }
  if (!ignoresBlock && crit !== 'crit' && attackTotal <= blq) {
    const finalDmg = baseDmg > 0 ? Math.max(0, baseDmg - rd) : 0;
    return {
      targetName: cleanStr(target.name, 32) || 'Alvo',
      outcome: 'block',
      label: `Bloqueado (≤ Blq ${blq}${rd ? ` · RD -${rd}` : ''})`,
      esq,
      blq,
      rd,
      finalDmg,
      calledEffect: called.effect || '',
    };
  }
  return {
    targetName: cleanStr(target.name, 32) || 'Alvo',
    outcome: 'direct',
    label: ignoresBlock ? `Acertou (> Esq ${esq} · Ignora Bloqueio)` : `Acerto Direto (> Blq ${blq} · Ignora RD!)`,
    esq,
    blq,
    rd,
    finalDmg: baseDmg,
    calledEffect: called.effect || '',
  };
}

// Executa uma rolagem de Perícia, Atributo, Ataque ou Manobra de Combate baseada na ficha do jogador
export function rollFromSheet(sheet, opts = {}) {
  const {
    kind = 'skill', // 'skill' | 'attr' | 'weapon' | 'maneuver'
    id = 'percepcao',
    actionType = '', // '' | 'standard' | 'move' | 'full' | 'free' | 'reaction'
    maneuverId = '', // 'grapple' | 'squeeze' | 'disarm' | 'charge' | 'takedown' | 'escape_grapple' | 'feint'
    calledShot = 'none', // 'none' | 'vital' | 'leg' | 'arm' | 'wing'
    chargeMeters = 3, // metros deslocados no Encontrão (mín 3m, Cap. 1.9)
    twoHands = false, // +2 em Agarrar com as duas mãos (Cap. 1.9)
    target = null, // { name, esq, blq, rd } opcional para comparar contra Esquiva e Bloqueio (Cap. 1.12)
    diceMod = 0, // +1 (vantagem), -1 (desvantagem/inapto), etc.
    flatBonus = 0, // modificador numérico extra
    dif = 0, // dificuldade
    helping = false, // regra "Ajudando" (Cap. 2.1: cada 5 pts no resultado = +1 para o aliado)
    reqId = '',
    forcedDice = null, // apenas para testes automatizados determinísticos
  } = opts;

  let label = '';
  let attrInfo = { id: 'inteligencia', name: 'Inteligência', short: 'INT', val: 3 };
  let pts = 0;
  let baseDice = 2;
  let rank = '';
  let perks = [];
  let threat = '6,6';
  let profBonus = 0;
  let dmgResult = null;
  let actBadge = ACTION_TYPE_BY_ID.get(actionType)?.badge || '';
  let ignoresBlock = false;
  const called = CALLED_SHOT_BY_ID.get(calledShot) || CALLED_SHOTS[0];

  const getBestPhysAttr = () => {
    const f = resolveAttr(sheet, 'forca');
    const a = resolveAttr(sheet, 'agilidade');
    return f.val >= a.val ? f : a;
  };
  const primaryWeapon = (sheet.weapons || []).find((x) => x.id === id) || sheet.weapons?.[0] || {
    id: 'w0',
    name: 'Ataque Desarmado',
    attr: 'forca',
    dmg: '1d4',
    prof: 0,
    fn: 0,
    threat: sheet.threat || '6,6',
  };

  if (kind === 'skill') {
    const sk = SKILL_BY_ID.get(id) || SKILL_BY_ID.get('percepcao');
    label = sk.name;
    attrInfo = resolveAttr(sheet, sk.attr);
    pts = clamp(sheet.skills?.[sk.id] ?? 0, 0, 5);
    baseDice = skillBaseDice(pts);
    rank = skillRankLabel(pts);
    perks = unlockedPerks(sk.id, pts);
    if (!actBadge && sk.id === 'iniciativa') actBadge = 'INICIATIVA';
  } else if (kind === 'attr') {
    attrInfo = resolveAttr(sheet, id);
    label = `Teste de ${attrInfo.name}`;
    baseDice = 2;
    rank = 'Atributo puro';
  } else if (kind === 'maneuver') {
    const man = COMBAT_ACTION_BY_ID.get(maneuverId || id);
    actBadge = ACTION_TYPE_BY_ID.get(actionType || man?.type || 'standard')?.badge || 'COMBATE';
    baseDice = 2;
    if (maneuverId === 'grapple' || id === 'grapple') {
      attrInfo = getBestPhysAttr();
      label = `Manobra: Agarrar${twoHands ? ' (2 Mãos)' : ''}`;
      profBonus = twoHands ? 2 : 0;
      rank = 'Ignora Bloqueio';
      ignoresBlock = true;
    } else if (maneuverId === 'squeeze' || id === 'squeeze') {
      attrInfo = resolveAttr(sheet, 'forca');
      label = 'Manobra: Apertar (Confronto FOR)';
      rank = `Dano base FOR (${attrInfo.val}) + margem`;
    } else if (maneuverId === 'disarm' || id === 'disarm') {
      attrInfo = getBestPhysAttr();
      const wFn = clamp(primaryWeapon.fn ?? 1, 0, 12);
      profBonus = wFn;
      label = `Manobra: Desarmar (${primaryWeapon.name})`;
      rank = `FN +${wFn} · Ignora Bloqueio`;
      ignoresBlock = true;
    } else if (maneuverId === 'takedown' || id === 'takedown') {
      attrInfo = getBestPhysAttr();
      label = 'Manobra: Derrubar (Alvo Agarrado)';
      rank = 'Ação Completa';
    } else if (maneuverId === 'escape_grapple' || id === 'escape_grapple') {
      attrInfo = getBestPhysAttr();
      label = 'Escapar de Agarrão';
      rank = 'Ação de Movimento';
    } else {
      attrInfo = getBestPhysAttr();
      label = man?.name || 'Manobra de Combate';
      rank = actBadge;
    }
  } else if (kind === 'weapon') {
    const w = primaryWeapon;
    const isCharge = maneuverId === 'charge';
    const isFeint = maneuverId === 'feint';
    label = isCharge
      ? `Encontrão com ${w.name} (${clamp(chargeMeters, 3, 40)}m)`
      : isFeint
        ? `Fintar com ${w.name}`
        : called.id !== 'none'
          ? `${w.name} → ${called.name.split(' (')[0]}`
          : w.name;
    attrInfo = resolveAttr(sheet, w.attr);
    baseDice = 2;
    profBonus = clamp(w.prof ?? 0, 0, 10);
    threat = w.threat || sheet.threat || '6,6';
    rank = profBonus ? `Proficiência +${profBonus}` : 'Ataque';
    if (!actBadge) actBadge = isCharge ? 'COMPLETA' : isFeint ? 'REAÇÃO' : 'PADRÃO';
  }

  // Condições que deixam Inapto automaticamente se o jogador ainda não aplicou diceMod
  const numDice = Math.max(0, clamp(baseDice + clamp(diceMod, -3, 5), 0, 10));
  const dice = Array.isArray(forcedDice)
    ? forcedDice.slice(0, numDice).map((d) => clamp(d, 1, 6))
    : Array.from({ length: numDice }, () => randDie(6));
  const diceSum = dice.reduce((a, b) => a + b, 0);
  const bonus = clamp(flatBonus, -50, 50) + profBonus;
  const total = diceSum + attrInfo.val + bonus;
  const crit = evalCrit(dice, threat);

  // Se for ataque com arma, calcula os dados de dano (Cap. 2.2: +1 dado por proficiência; Cap. 1.10: soma multiplicadores no crítico!)
  if (kind === 'weapon') {
    const w = primaryWeapon;
    const m = String(w?.dmg || '1d4').match(/^(\d{1,2})d(\d{1,2})([+-]\d{1,2})?$/i);
    if (m) {
      const baseCount = clamp(m[1], 1, 20);
      const sides = clamp(m[2], 2, 100);
      const extraFlat = m[3] ? Number(m[3]) : 0;
      const isCharge = maneuverId === 'charge';
      const isFeint = maneuverId === 'feint';
      // Encontrão (Cap. 1.9): adiciona maior FN (arma ou armadura) + +1 por metro deslocado (mín. 3m)
      const chargeBonus = isCharge ? Math.max(clamp(w.fn ?? 1, 0, 12), clamp(sheet.armorFn ?? 0, 0, 15)) + clamp(chargeMeters, 3, 40) : 0;
      const totalDmgDice = baseCount + profBonus;
      const dmgRolls = Array.from({ length: totalDmgDice }, () => randDie(sides));
      const flatDmg = attrInfo.val + extraFlat + chargeBonus;
      const rawDmg = dmgRolls.reduce((a, b) => a + b, 0) + flatDmg;
      // Cap. 1.9 e 1.10: Crítico (2x) e Área Vital (2x). Se ambos, soma multiplicadores (2+2 = 4x ou dobro sobre base)
      let mult = 1;
      if (crit === 'crit' && called.dmgMult > 1) mult = 2 + called.dmgMult; // Cap. 1.10: some os multiplicadores
      else if (crit === 'crit') mult = 2;
      else if (called.dmgMult > 1) mult = called.dmgMult;
      let finalDmg = rawDmg * mult;
      if (isFeint) finalDmg = Math.max(1, Math.floor(finalDmg / 2)); // Cap. 1.9: Finta causa metade do dano
      dmgResult = {
        formula: `${totalDmgDice}d${sides}+${flatDmg}${isFeint ? ' (÷2 Finta)' : ''}`,
        rolls: dmgRolls,
        total: Math.max(1, finalDmg),
        doubled: mult > 1,
      };
    }
  }

  // Comparação automática contra as Defesas do Alvo (Esquiva / Bloqueio / RD - Cap. 1.12)
  const hitEval =
    (kind === 'weapon' || (kind === 'maneuver' && (maneuverId === 'grapple' || maneuverId === 'disarm'))) && target
      ? evalAttackVsDefense(total, crit, dmgResult?.total ?? 0, target, { calledShot: called.id, ignoresBlock })
      : null;

  // Regra "Ajudando" (Cap. 2.1): para cada 5 pontos no resultado, soma +1 na rolagem do aliado
  const helpBonus = helping ? Math.floor(Math.max(0, total) / 5) : 0;
  const targetDif = clamp(dif ?? 0, 0, 99);
  const passed = targetDif > 0 ? (crit === 'fumble' ? false : crit === 'crit' ? true : total >= targetDif) : null;

  return {
    t: 'roll',
    id: kind === 'skill' ? id : kind === 'attr' ? id : id,
    kind,
    actionType: cleanStr(actionType, 16),
    actBadge: cleanStr(actBadge, 20),
    maneuverId: cleanStr(maneuverId, 24),
    calledShot: called.id,
    charName: cleanStr(sheet.charName, 40),
    label,
    attrShort: attrInfo.short,
    attrVal: attrInfo.val,
    pts,
    ptsSym: kind === 'skill' ? ptsSymbols(pts) : '',
    rank,
    baseDice,
    diceMod: clamp(diceMod, -3, 5),
    numDice,
    dice,
    diceSum,
    bonus,
    total,
    crit, // 'normal' | 'crit' | 'fumble' | 'clash'
    threat,
    dif: targetDif,
    passed,
    helping: !!helping,
    helpBonus,
    perks: perks.slice(0, 5),
    dmg: dmgResult,
    hit: hitEval,
    reqId: cleanStr(reqId, 32),
  };
}

// Formata um texto legível da rolagem
export function formatRollText(r) {
  const diceStr = r.dice.length ? `[${r.dice.join(', ')}]` : '[0d6]';
  const modStr = r.bonus ? (r.bonus > 0 ? ` + ${r.bonus}` : ` - ${Math.abs(r.bonus)}`) : '';
  const tag =
    r.crit === 'crit'
      ? ' 🔥 SUCESSO DECISIVO!'
      : r.crit === 'fumble'
        ? ' 💀 FALHA CRÍTICA!'
        : r.crit === 'clash'
          ? ' ⚖️ CONFRONTO CRÍTICO (anulado)'
          : '';
  const difStr = r.dif > 0 ? ` (Dif ${r.dif}: ${r.passed ? 'PASSOU' : 'FALHOU'})` : '';
  const helpStr = r.helping ? ` → Ajudando aliado: +${r.helpBonus}` : '';
  const hitStr = r.hit ? ` → vs ${r.hit.targetName}: ${r.hit.label}` : '';
  const dmgVal = r.hit ? r.hit.finalDmg : r.dmg?.total;
  const dmgStr = r.dmg && (!r.hit || r.hit.outcome !== 'miss') ? ` · Dano: ${dmgVal}${r.dmg.doubled ? ' (Crítico/Vital!)' : ''}` : '';
  return `🎲 ${r.charName} rolou ${r.label}${r.ptsSym ? ' (' + r.ptsSym + ')' : ''}: ${diceStr} + ${r.attrVal} (${r.attrShort})${modStr} = ${r.total}${tag}${difStr}${helpStr}${hitStr}${dmgStr}`;
}

// Valida um objeto `rpg` recebido na sessão P2P (rolagens, ações de turno e estado de combate)
export function cleanRpgPayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.t === 'act') {
    // Ação de combate sem rolagem (Ação Livre, Ação de Movimento, Defesa Total, etc.) publicada no feed da sessão
    return {
      t: 'act',
      actId: cleanStr(raw.actId, 32) || 'act',
      actionType: ['standard', 'move', 'full', 'free', 'reaction'].includes(raw.actionType) ? raw.actionType : 'free',
      actBadge: cleanStr(raw.actBadge, 20) || 'AÇÃO LIVRE',
      charName: cleanStr(raw.charName, 40) || 'Personagem',
      label: cleanStr(raw.label, 60) || 'Ação',
      detail: cleanStr(raw.detail, 140),
    };
  }
  if (raw.t === 'combat') {
    // Sincronização do Rastreador de Combate e Iniciativa da Mesa
    const order = Array.isArray(raw.order)
      ? raw.order
          .filter((x) => x && typeof x === 'object')
          .slice(0, 24)
          .map((x, i) => ({
            id: cleanStr(x.id, 40) || 'c' + i,
            uid: cleanStr(x.uid, 64),
            name: cleanStr(x.name, 40) || 'Combatente',
            init: clamp(x.init ?? 10, -10, 99),
            pv: clamp(x.pv ?? 60, -99, 9999),
            pvMax: clamp(x.pvMax ?? 60, 1, 9999),
            esq: clamp(x.esq ?? 8, 0, 99),
            blq: clamp(x.blq ?? 10, 0, 99),
            rd: clamp(x.rd ?? 0, 0, 999),
            npc: !!x.npc,
          }))
      : [];
    return {
      t: 'combat',
      active: !!raw.active,
      round: clamp(raw.round ?? 1, 1, 999),
      turnIdx: clamp(raw.turnIdx ?? 0, 0, Math.max(0, order.length - 1)),
      order,
    };
  }
  if (raw.t === 'req') {
    const kind = raw.kind === 'attr' ? 'attr' : 'skill';
    const validId = kind === 'attr' ? ATTR_BY_ID.has(raw.id) : SKILL_BY_ID.has(raw.id);
    if (!validId) return null;
    const label = kind === 'attr' ? ATTR_BY_ID.get(raw.id).name : SKILL_BY_ID.get(raw.id).name;
    return {
      t: 'req',
      reqId: cleanStr(raw.reqId, 32) || 'rq',
      kind,
      id: raw.id,
      label,
      dif: clamp(raw.dif ?? 0, 0, 99),
      note: cleanStr(raw.note, 100),
      byName: cleanStr(raw.byName, 32),
    };
  }
  if (raw.t === 'roll') {
    const dice = Array.isArray(raw.dice) ? raw.dice.slice(0, 10).map((d) => clamp(d, 1, 6)) : [];
    const crit = ['normal', 'crit', 'fumble', 'clash'].includes(raw.crit) ? raw.crit : 'normal';
    const dif = clamp(raw.dif ?? 0, 0, 99);
    const total = clamp(raw.total ?? 0, -50, 500);
    return {
      t: 'roll',
      kind: ['skill', 'attr', 'weapon', 'maneuver'].includes(raw.kind) ? raw.kind : 'skill',
      id: cleanStr(raw.id, 32),
      actionType: cleanStr(raw.actionType, 16),
      actBadge: cleanStr(raw.actBadge, 20),
      maneuverId: cleanStr(raw.maneuverId, 24),
      calledShot: cleanStr(raw.calledShot, 16) || 'none',
      charName: cleanStr(raw.charName, 40) || 'Personagem',
      label: cleanStr(raw.label, 60) || 'Teste',
      attrShort: cleanStr(raw.attrShort, 8) || 'ATR',
      attrVal: clamp(raw.attrVal ?? 0, 0, 50),
      pts: clamp(raw.pts ?? 0, 0, 5),
      ptsSym: cleanStr(raw.ptsSym, 10),
      rank: cleanStr(raw.rank, 24),
      baseDice: clamp(raw.baseDice ?? 0, 0, 5),
      diceMod: clamp(raw.diceMod ?? 0, -3, 5),
      numDice: dice.length,
      dice,
      diceSum: dice.reduce((a, b) => a + b, 0),
      bonus: clamp(raw.bonus ?? 0, -50, 50),
      total,
      crit,
      threat: cleanStr(raw.threat, 8) || '6,6',
      dif,
      passed: dif > 0 ? !!raw.passed : null,
      helping: !!raw.helping,
      helpBonus: clamp(raw.helpBonus ?? 0, 0, 50),
      perks: Array.isArray(raw.perks) ? raw.perks.slice(0, 5).map((p) => cleanStr(p, 40)) : [],
      dmg:
        raw.dmg && typeof raw.dmg === 'object'
          ? {
              formula: cleanStr(raw.dmg.formula, 24),
              rolls: Array.isArray(raw.dmg.rolls) ? raw.dmg.rolls.slice(0, 20).map((x) => clamp(x, 1, 100)) : [],
              total: clamp(raw.dmg.total ?? 1, 0, 9999),
              doubled: !!raw.dmg.doubled,
            }
          : null,
      hit:
        raw.hit && typeof raw.hit === 'object'
          ? {
              targetName: cleanStr(raw.hit.targetName, 32),
              outcome: ['miss', 'block', 'direct'].includes(raw.hit.outcome) ? raw.hit.outcome : 'direct',
              label: cleanStr(raw.hit.label, 60),
              esq: clamp(raw.hit.esq ?? 8, 0, 99),
              blq: clamp(raw.hit.blq ?? 10, 0, 99),
              rd: clamp(raw.hit.rd ?? 0, 0, 999),
              finalDmg: clamp(raw.hit.finalDmg ?? 0, 0, 9999),
              calledEffect: cleanStr(raw.hit.calledEffect, 120),
            }
          : null,
      reqId: cleanStr(raw.reqId, 32),
    };
  }
  return null;
}

// Remove acentos e símbolos para comparar nomes de campos e perícias na importação
const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Conta quantos pontos (0..5) existem no valor de uma linha de perícia do Discord (ex.: "◈◈◈", "◈◈◈◈☗", "3", "4 pontos")
function parseSkillPoints(valStr) {
  if (!valStr) return 0;
  const gems = (valStr.match(/[◈◆◇•*]/g) || []).length;
  const master = /[☗★👑]/.test(valStr) ? 1 : 0;
  if (gems + master > 0) return clamp(gems + master, 0, 5);
  const num = valStr.match(/\b([0-5])\b/);
  if (num) return clamp(Number(num[1]), 0, 5);
  return 0;
}

// Importa uma ficha colada no formato do Apêndice C do livro (LAYOUT DE FICHA DISCORD ou TEXTO CORRIDO)
export function parseDiscordSheet(text, currentSheet) {
  const s = cleanSheet(currentSheet);
  const lines = String(text || '').split(/\r?\n/);

  // Mapa de nomes normalizados das 25 perícias
  const skillMatchers = SKILLS.map((sk) => ({
    id: sk.id,
    key: norm(sk.name),
    shortKey: sk.short ? norm(sk.short) : '',
  }));

  for (const rawLine of lines) {
    // Tira formatação markdown (**negrito**, *itálico*, bullets •, -)
    const clean = rawLine.replace(/[*_`~>]+/g, '').trim();
    if (!clean || !clean.includes(':')) continue;
    const idx = clean.indexOf(':');
    const leftRaw = clean.slice(0, idx).replace(/^[•\-+]\s*/, '').trim();
    const rightRaw = clean.slice(idx + 1).trim();
    if (!leftRaw) continue;

    // Tira "(Força)", "(Inteligência)" etc. do nome da perícia
    const leftNoParen = leftRaw.replace(/\([^)]*\)/g, '').trim();
    const k = norm(leftNoParen);

    // 1. Confere se é uma das 25 perícias
    const skMatch = skillMatchers.find((m) => k === m.key || (m.shortKey && k === m.shortKey) || (k.length >= 4 && m.key.startsWith(k)));
    if (skMatch) {
      s.skills[skMatch.id] = parseSkillPoints(rightRaw);
      continue;
    }

    // 2. Campos gerais, status, defesas e atributos
    const firstInt = (str) => {
      const m = String(str).match(/-?\d+/);
      return m ? Number(m[0]) : null;
    };
    const slashInts = (str) => {
      const m = String(str).match(/(-?\d+)\s*\/\s*(\d+)/);
      return m ? [Number(m[1]), Number(m[2])] : null;
    };

    if (k === 'nome' || k === 'personagem') {
      if (rightRaw) s.charName = cleanStr(rightRaw, 40);
    } else if (k === 'raca') {
      if (rightRaw) s.race = cleanStr(rightRaw, 32);
    } else if (k === 'classe') {
      if (rightRaw) s.cls = cleanStr(rightRaw, 32);
    } else if (k === 'caminhos' || k === 'caminho') {
      s.path = cleanStr(rightRaw, 32);
    } else if (k === 'nivel') {
      const v = firstInt(rightRaw);
      if (v != null) s.level = clamp(v, 1, 20);
    } else if (k === 'xp' || k === 'experiencia') {
      const v = firstInt(rightRaw);
      if (v != null) s.xp = clamp(v, 0, 99999);
    } else if (k === 'vida' || k === 'pv' || k === 'pvs' || k === 'pontos de vida') {
      const pair = slashInts(rightRaw);
      if (pair) {
        s.pv = clamp(pair[0], -99, 9999);
        s.pvMax = clamp(pair[1], 1, 9999);
      } else {
        const v = firstInt(rightRaw);
        if (v != null) s.pv = s.pvMax = clamp(v, 1, 9999);
      }
    } else if (k === 'mana' || k === 'pm' || k === 'pms' || k === 'pontos de mana') {
      const pair = slashInts(rightRaw);
      if (pair) {
        s.pm = clamp(pair[0], 0, 9999);
        s.pmMax = clamp(pair[1], 0, 9999);
      } else {
        const v = firstInt(rightRaw);
        if (v != null) s.pm = s.pmMax = clamp(v, 0, 9999);
      }
    } else if (k === 'forca') {
      const v = firstInt(rightRaw);
      if (v != null) s.attrs.forca = clamp(v, 0, 30);
    } else if (k === 'agilidade') {
      const v = firstInt(rightRaw);
      if (v != null) s.attrs.agilidade = clamp(v, 0, 30);
    } else if (k === 'inteligencia') {
      const v = firstInt(rightRaw);
      if (v != null) s.attrs.inteligencia = clamp(v, 0, 30);
    } else if (k === 'vontade') {
      const v = firstInt(rightRaw);
      if (v != null) s.attrs.vontade = clamp(v, 0, 30);
    } else if (k === 'pontos de inspiracao' || k === 'inspiracao') {
      const v = firstInt(rightRaw);
      if (v != null) s.inspiration = clamp(v, 0, 3);
    } else if (k === 'dinheiro' || k === 'moedas') {
      const v = firstInt(rightRaw);
      if (v != null) s.money = clamp(v, 0, 9999999);
    } else if (k === 'fisico') {
      const v = firstInt(rightRaw);
      if (v != null) s.rd.fisico = clamp(v, 0, 999);
    } else if (k === 'magico') {
      const v = firstInt(rightRaw);
      if (v != null) s.rd.magico = clamp(v, 0, 999);
    } else if (k === 'elemental') {
      const v = firstInt(rightRaw);
      if (v != null) s.rd.elemental = clamp(v, 0, 999);
    }
  }

  // Segundo passe para Esquiva, Bloqueio e Determinação (calcula o bônus em cima dos atributos já lidos)
  for (const rawLine of lines) {
    const clean = rawLine.replace(/[*_`~>]+/g, '').trim();
    if (!clean.includes(':')) continue;
    const idx = clean.indexOf(':');
    const k = norm(clean.slice(0, idx).replace(/^[•\-+]\s*/, ''));
    const m = clean.slice(idx + 1).match(/-?\d+/);
    if (!m) continue;
    const val = Number(m[0]);
    if (k === 'esquiva') {
      s.defBonus.esquiva = clamp(val - (5 + s.attrs.agilidade), -20, 30);
    } else if (k === 'bloqueio') {
      const esq = 5 + s.attrs.agilidade + (s.defBonus.esquiva || 0);
      const baseBlq = esq + Math.floor(s.attrs.forca / 2) + (s.defBonus.armadura || 0);
      s.defBonus.bloqueio = clamp(val - baseBlq, -20, 30);
    } else if (k === 'determinacao') {
      const baseDet = 8 + Math.max(s.attrs.vontade, s.attrs.inteligencia);
      s.defBonus.determinacao = clamp(val - baseDet, -20, 30);
    }
  }

  return cleanSheet(s);
}

// Exporta a ficha exatamente no LAYOUT DE FICHA (DISCORD) do Apêndice C (pág. 763 do livro)
export function exportDiscordSheet(sheet, playerName = '') {
  const s = cleanSheet(sheet, playerName);
  const d = calcDerived(s);
  const skillLines = SKILLS.map((sk) => {
    const attrLabel = sk.attr === 'agi_int' ? 'Agilidade/Inteligência' : ATTR_BY_ID.get(sk.attr)?.name || '';
    const pts = s.skills[sk.id] || 0;
    return `**• ${sk.name}** *(${attrLabel}):* ${pts ? ptsSymbols(pts) : ''}`;
  });
  const perkBlocks = SKILLS.map((sk) => {
    const pts = s.skills[sk.id] || 0;
    const active = sk.perks.filter(([req]) => pts >= req);
    if (!active.length) return null;
    const attrLabel = sk.attr === 'agi_int' ? 'Agilidade/Inteligência' : ATTR_BY_ID.get(sk.attr)?.name || '';
    return `**${sk.name} (${attrLabel})**\n` + active.map(([req, name]) => `- ${name} ${ptsSymbols(req)}`).join('\n');
  }).filter(Boolean);

  return [
    '```ini',
    '[ Geral ]',
    '```',
    `**Jogador:** ${playerName || ''}`,
    `**Nome:** ${s.charName}`,
    `**Raça:** ${s.race}`,
    `**Classe:** ${s.cls}`,
    `**Caminhos:** ${s.path || '-'}`,
    `**Nível:** ${s.level}`,
    `**XP:** ${s.xp}`,
    '```diff',
    '-Status-',
    '```',
    `• **Vida:** ${s.pv}/${s.pvMax}`,
    `• **Mana:** ${s.pm}/${s.pmMax}`,
    `• **Defesa:**`,
    `- Esquiva: ${d.esquiva}`,
    `- Bloqueio: ${d.bloqueio}`,
    `- Determinação: ${d.determinacao}`,
    `• **Redução de Dano:**`,
    `-Físico: ${s.rd.fisico}`,
    `-Mágico: ${s.rd.magico}`,
    `-Elemental: ${s.rd.elemental}`,
    `• **Atributos:**`,
    `- Força: ${s.attrs.forca}`,
    `- Agilidade: ${s.attrs.agilidade}`,
    `- Inteligência: ${s.attrs.inteligencia}`,
    `- Vontade: ${s.attrs.vontade}`,
    `• **Deslocamento:**`,
    `- Comum: ${d.deslocamento}m`,
    `- Corrida: ${d.corrida}m`,
    `• **Truques**`,
    `- Máximo: ${d.tricksMax}`,
    `- Usados: ${s.tricksUsed}`,
    `• **Pontos de Inspiração:** ${s.inspiration}`,
    '```fix',
    'PERÍCIAS (◈☗)',
    '```',
    ...skillLines,
    ...(perkBlocks.length ? ['```bash', '"Perks"', '```', ...perkBlocks] : []),
  ].join('\n');
}

