// Mesa de RPG do janja (d2Trinities V1.2): mapa com tokens, iniciativa, rolagens, ficha, livro e painel do Mestre.
// Vira o rpg.bundle.js, que só carrega quando alguém abre a mesa. O app entrega a "api" (registros, rede, ícones).
//
// Registros replicados (assinados, como o resto do grupo):
//   rpgc  personagem  { uid: dono, d: ficha }           dono ou Mestre alteram
//   rpgk  token       { uid: quem controla, cid | npc, x, y, sz, side, hid, cond }   Mestre; o dono só o seu
//   rpgs  mesa        { map, combat, req }               só o Mestre
//   rpgr  rolagem     { uid, ts, d }                     cada um as suas
import * as R from './rules.js';
import { installPanels } from './panels.js';

const CELL = 56; // px de um quadrado com zoom 1

export function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (typeof props === 'string') e.className = props;
  else if (props)
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (k.startsWith('on') || k in e) e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) e.append(kid);
  if (tag === 'button' && !e.getAttribute('type')) e.type = 'button';
  return e;
}
// troca/acrescenta filhos ignorando null e false (o DOM escreveria "null" na tela)
const kidsOf = (kids) => kids.flat(Infinity).filter((k) => k != null && k !== false);
export const fill = (node, ...kids) => node.replaceChildren(...kidsOf(kids));
export const add = (node, ...kids) => node.append(...kidsOf(kids));

function mount(root, api) {
  const me = api.me();
  const T = {
    api, root, h, R, me, fill, add,
    D: null,
    S: {
      tab: 'mesa', actor: '', target: '', cid: '', mod: { dice: 0, flat: 0, df: '' }, called: '', man: '', charge: 3, tool: '', secret: false,
      view: { x: 20, y: 20, z: 1 }, turnUsed: { tok: '', std: false, mov: false, moved: 0 }, local: [], livro: { cat: 'regras', q: '', src: '', sel: null }, gmQ: '', selfPut: false, dirty: false,
    },
  };
  const S = T.S;
  const ic = (n, cls = 'sm') => api.icon(n, cls);
  T.ic = ic;
  const btn = (cls, iconName, text, onclick, title) => h('button', { class: cls, onclick, title }, iconName && ic(iconName), text);
  T.btn = btn;

  // ------------------------------------------------------------ dados (registros)
  const cache = new Map();
  T.chars = () =>
    api.recs('rpgc').map((r) => {
      let c = cache.get(r.id);
      if (!c || c.v !== r.v) cache.set(r.id, (c = { v: r.v, d: R.cleanChar(r.d) }));
      return { id: r.id, uid: r.uid, d: c.d, rec: r };
    });
  T.charById = (id) => T.chars().find((c) => c.id === id);
  T.myChars = () => T.chars().filter((c) => c.uid === me.id);
  T.myChar = () => T.myChars().find((c) => c.d.on) || T.myChars()[0] || null;
  T.isGm = () => api.isGm();
  T.canEditChar = (c) => !!c && (T.isGm() || c.uid === me.id);
  T.putChar = (c, d) => {
    S.selfPut = true;
    try {
      api.put({ k: 'rpgc', id: c.id, uid: c.uid, d: R.cleanChar(d) });
    } finally {
      S.selfPut = false;
    }
  };
  T.state = () => api.get('rpgs') || { k: 'rpgs', id: 'rpgs', map: { cols: 30, rows: 20 }, combat: { on: false, round: 1, turn: 0, order: [] } };
  T.putState = (patch) => api.put({ ...T.state(), k: 'rpgs', id: 'rpgs', ...patch });
  T.tokens = () => api.recs('rpgk').filter((t) => T.isGm() || !t.hid);
  T.canCtl = (t) => !!t && (T.isGm() || (t.uid && t.uid === me.id));
  T.putTok = (t, patch) => api.put({ ...t, ...patch });
  T.userName = (uid) => api.user(uid)?.name || 'Alguém';

  // tudo o que a mesa precisa saber de um token (personagem ou criatura do Mestre)
  T.info = (t) => {
    if (!t) return null;
    const base = { id: t.id, x: t.x, y: t.y, sz: t.sz || 1, side: t.side || 'e', hid: !!t.hid, tok: t };
    if (t.cid) {
      const c = T.charById(t.cid);
      if (!c) return { ...base, name: '(sem ficha)', color: '#666', conds: [], pv: 0, pvMax: 1, pm: 0, pmMax: 0, npc: true, def: 8, at: {}, down: false, desl: 6 };
      const d = R.derive(c.d, T.D);
      return { ...base, side: t.side || 'a', name: c.d.name || T.userName(c.uid), color: api.user(c.uid)?.color || '#5b7bf0', conds: c.d.conds, pv: c.d.pv, pvMax: c.d.pvMax, pm: c.d.pm, pmMax: c.d.pmMax, npc: false, char: c, der: d, esq: d.esq, blq: d.blq, rd: d.rd, det: d.det, canBlock: d.canBlock, at: c.d.at, down: c.d.pv <= 0, desl: d.desl };
    }
    const n = t.npc || {};
    return { ...base, name: n.n || 'Criatura', color: base.side === 'a' ? '#3c9d6b' : base.side === 'n' ? '#6b7280' : '#b8423f', conds: t.cond || [], pv: n.pv ?? 0, pvMax: n.pvMax || 1, pm: n.pm || 0, pmMax: n.pmMax || 0, npc: true, def: n.df ?? 8, rd: n.rd || 0, det: n.df ?? 8, at: n.at || {}, down: (n.pv ?? 0) <= 0, desl: n.ds || 6, mon: n };
  };
  T.infos = () => T.tokens().map(T.info);
  T.setConds = (inf, conds) => {
    if (inf.char) T.putChar(inf.char, { ...inf.char.d, conds });
    else T.putTok(inf.tok, { cond: conds });
  };
  T.setVital = (inf, key, val) => {
    if (inf.char) {
      const d = { ...inf.char.d, [key]: R.clamp(val, 0, inf.char.d[key + 'Max']) };
      if (key === 'pv') d.conds = d.pv <= 0 ? [...new Set([...d.conds, 'por-um-fio'])] : d.conds.filter((x) => x !== 'por-um-fio');
      T.putChar(inf.char, d);
    } else T.putTok(inf.tok, { npc: { ...inf.tok.npc, [key]: R.clamp(val, 0, inf.tok.npc[key + 'Max'] ?? 9999) } });
  };

  // ------------------------------------------------------------ registro de rolagens
  T.log = (d, secret) => {
    const rec = { k: 'rpgr', id: 'rpgr:' + R.rid(12), uid: me.id, ts: Date.now(), d };
    if (secret) {
      S.local.push({ ...rec, secret: true });
      renderLog();
    } else api.put(rec);
    api.sfx?.(d.crit || '');
    if (!secret && d.total != null) api.onRoll?.(d);
    return rec;
  };
  T.note = (text, kind = 'note') => T.log({ t: kind, who: T.isGm() ? 'Mestre' : me.name, text });
  const whoOf = (inf) => (inf ? inf.name : T.myChar()?.d.name || me.name);

  // Teste: n dados + partes fixas (atributo, bônus…). Usa e zera os modificadores do painel.
  T.rollTest = ({ label, n, parts = [], df, threat, tok, kind = 'test', extra = {}, sub }) => {
    const mods = [];
    if (S.mod.dice) mods.push({ l: S.mod.dice > 0 ? 'Vantagem' : 'Desvantagem', d: S.mod.dice });
    if (S.mod.flat) parts = [...parts, { l: 'Bônus', v: S.mod.flat }];
    n = Math.max(0, n + S.mod.dice + (extra.dice || 0));
    const dice = R.rollDice(n);
    const total = dice.reduce((a, b) => a + b, 0) + parts.reduce((a, p) => a + p.v, 0);
    const crit = R.evalCrit(dice, threat);
    const dif = df ?? (R.int(S.mod.df) || 0);
    const d = { t: kind, who: whoOf(tok), tok: tok?.id, label, sub, dice, parts, total, crit, mods };
    if (dif) {
      d.df = dif;
      d.ok = crit === 'crit' ? true : crit === 'fumble' ? false : total >= dif;
    }
    S.mod = { dice: 0, flat: 0, df: '' };
    return d;
  };
  T.testAttr = (inf, attr, label) => {
    const a = R.AT_BY[attr];
    const d = T.rollTest({ label: label || 'Teste de ' + a.n, n: 2, parts: [{ l: a.s, v: inf?.at?.[attr] || 0 }], tok: inf });
    T.log(d, S.secret);
    renderDock();
  };
  T.testSkill = (c, skillId, inf, df) => {
    const sk = T.D.skills.find((s) => s.id === skillId);
    if (!sk || !c) return;
    const pts = c.d.sk[skillId] || 0;
    const attr = sk.at.reduce((best, a) => (c.d.at[a] > c.d.at[best] ? a : best), sk.at[0]);
    const exhausted = c.d.pm <= 0 && c.d.pmMax > 0;
    const d = T.rollTest({ label: sk.n, sub: R.ptsText(pts), n: R.skillDice(pts), parts: [{ l: R.AT_BY[attr].s, v: c.d.at[attr] }], df, tok: inf, kind: skillId === 'iniciativa' ? 'init' : 'test', extra: { dice: exhausted ? -1 : 0 } });
    if (exhausted) d.mods.push({ l: 'Exausto (sem Mana)', d: -1 });
    T.log(d, S.secret && skillId !== 'iniciativa');
    renderDock();
    return d;
  };

  // Ataque de um token em outro: junta arma, proficiência, condições e posição no mapa, rola e compara com a defesa
  T.attack = (att, weapon, tgt) => {
    const all = T.infos();
    const isNpc = !!att.npc && !att.char;
    const ranged = isNpc ? weapon.k === 'd' : !!weapon.rg;
    const attr = isNpc ? (ranged ? 'a' : 'f') : R.weaponAttr(weapon);
    const parts = [{ l: R.AT_BY[attr].s, v: att.at?.[attr] || 0 }];
    const notes = [];
    let extraDice = 0, profPts = 0;
    if (att.char) {
      const c = att.char.d;
      profPts = c.prof[R.profGroup(T.D, weapon.n)] || 0;
      if (profPts) parts.push({ l: 'Proficiência', v: profPts });
      if ((weapon.fn || 0) > c.at.f) {
        extraDice -= 1;
        notes.push(`FN ${weapon.fn} maior que a Força: −1d6`);
      }
      if (att.der?.fnOver) notes.push('Armadura com FN acima da Força: −1 em Força e Agilidade') && parts.push({ l: 'Armadura', v: -1 });
      if (c.pm <= 0 && c.pmMax > 0) {
        extraDice -= 1;
        notes.push('Exausto (sem Mana): −1d6');
      }
    }
    const man = S.man;
    if (man === 'agarrar') parts.push({ l: 'Duas mãos', v: 2 });
    const sit = R.situation(att, tgt, all, { melee: !ranged });
    extraDice += sit.dice;
    if (sit.flat) parts.push({ l: 'Situação', v: sit.flat });
    notes.push(...sit.notes);
    let esqPlus = sit.esq;
    if (S.called) {
      esqPlus += 4;
      notes.push('Ataque localizado: Esquiva do alvo +4');
    }
    if (ranged && att.char?.d.conds.includes('montado')) parts.push({ l: 'Montado', v: -2 });
    const d = T.rollTest({ label: weapon.n, n: 2, parts, threat: att.char?.d.threat, tok: att, kind: 'atk', extra: { dice: extraDice } });
    d.notes = notes;
    if (tgt) {
      const defs = tgt.npc ? { npc: true, def: tgt.def + esqPlus, rd: tgt.rd } : { esq: tgt.esq + esqPlus, blq: tgt.blq + esqPlus, rd: tgt.rd, canBlock: man === 'agarrar' || man === 'desarmar' ? false : tgt.canBlock };
      if ((man === 'agarrar' || man === 'desarmar') && !tgt.npc) defs.blq = defs.esq; // ignora o Bloqueio
      let res = R.resolveHit(d.total, d.crit, defs, 0);
      if (res.out !== 'miss' && res.out !== 'fumble' && sit.autoCrit) d.crit = 'crit';
      d.tgt = tgt.id;
      d.tgtName = tgt.name;
      d.out = res.out;
      if (res.out === 'hit' || res.out === 'block') {
        if (man === 'agarrar') d.eff = `${tgt.name} fica Agarrado`;
        else {
          const dmg = isNpc ? R.parseDamage(weapon.d + ' ' + (weapon.t || '')) : R.parseDamage(weapon.dm, weapon.tp);
          const mult = 1 + (d.crit === 'crit' ? 1 : 0) + (S.called === 'vital' ? 1 : 0);
          let bonus = 0;
          if (man === 'encontrao') bonus = (weapon.fn || 0) + Math.max(3, R.int(S.charge, 3));
          const rolled = R.rollDamage(dmg, att.at, { extraDice: profPts, bonus });
          let raw = rolled.total * mult;
          if (man === 'fintar') raw = Math.floor(raw / 2);
          res = R.resolveHit(d.total, d.crit, defs, raw);
          d.dmg = { rolls: rolled.rolls, raw, mult, type: rolled.type || weapon.t || '' };
          d.final = res.final;
          if (res.out === 'block') d.rd = tgt.rd;
          if (S.called && S.called !== 'vital') d.eff = R.CALLED.find((x) => x.id === S.called)?.x;
        }
      }
    }
    if (man) d.sub = R.MANEUVERS.find((m) => m.id === man)?.n;
    if (S.called) d.sub = [d.sub, R.CALLED.find((x) => x.id === S.called)?.n].filter(Boolean).join(' · ');
    S.man = '';
    S.called = '';
    markUsed(att.id, 'std');
    T.log(d, S.secret);
    renderDock();
  };
  // usar uma habilidade da ficha: magia com Dificuldade rola o teste (só gasta Mana se passar); o resto gasta direto
  T.useAbility = (c, ab, inf) => {
    const cost = R.int(/\d+/.exec(ab.pm || '')?.[0]);
    const dif = R.int(/\d+/.exec(ab.df || '')?.[0]);
    const d0 = c.d;
    if (cost && d0.pm < cost) return api.toast(`Mana insuficiente: ${ab.n} custa ${cost} e você tem ${d0.pm}`);
    let d;
    if (dif && /magia/i.test(ab.c)) {
      const attr = d0.cast;
      d = T.rollTest({ label: ab.n, sub: 'Magia', n: 2, parts: [{ l: R.AT_BY[attr].s, v: d0.at[attr] }], df: Math.max(8, dif), threat: '6,6', tok: inf, kind: 'abil' });
      d.cost = d.ok ? cost : 0;
    } else d = { t: 'abil', who: whoOf(inf) || d0.name, tok: inf?.id, label: ab.n, sub: `${ab.c} · ${ab.t}`, cost };
    d.text = [ab.al && 'Alcance: ' + ab.al, ab.du && 'Duração: ' + ab.du, ab.x].filter(Boolean).join('\n').slice(0, 900);
    if (d.cost) T.putChar(c, { ...T.charById(c.id).d, pm: d0.pm - d.cost });
    if (ab.t === 'Ação' && inf) markUsed(inf.id, 'std');
    T.log(d, S.secret);
  };
  T.applyDamage = (entry) => {
    const inf = T.info(api.get(entry.d.tgt));
    if (!inf) return api.toast('Esse alvo não está mais no mapa');
    T.setVital(inf, 'pv', inf.pv - entry.d.final);
    if (!entry.secret) api.put({ ...entry, d: { ...entry.d, ap: 1 } });
    else entry.d.ap = 1;
    if (inf.pv - entry.d.final <= 0) T.note(inf.npc && !inf.char ? `${inf.name} caiu!` : `${inf.name} está Por um Fio!`, 'sys');
  };

  // ------------------------------------------------------------ combate (iniciativa e turnos)
  const combat = () => T.state().combat || { on: false, round: 1, turn: 0, order: [] };
  const order = () => combat().order.filter((o) => api.get(o.t));
  T.curTok = () => (combat().on ? order()[combat().turn]?.t : '');
  function markUsed(tokId, what, meters) {
    if (!combat().on || T.curTok() !== tokId) return;
    if (S.turnUsed.tok !== tokId) S.turnUsed = { tok: tokId, std: false, mov: false, moved: 0 };
    if (what === 'std') S.turnUsed.std = true;
    if (what === 'mov') {
      S.turnUsed.mov = true;
      S.turnUsed.moved += meters || 0;
    }
  }
  T.startCombat = () => {
    const list = [];
    for (const inf of T.infos()) {
      if (inf.char || inf.down) continue; // criaturas do Mestre: 2d6 + Agilidade
      const dice = R.rollDice(2);
      list.push({ t: inf.id, i: dice[0] + dice[1] + (inf.at.a || 0) });
    }
    list.sort((a, b) => b.i - a.i);
    T.putState({ combat: { on: true, round: 1, turn: 0, order: list, ts: Date.now() } });
    T.note('Combate iniciado! Rolem a Iniciativa.', 'sys');
  };
  T.endCombat = () => {
    T.putState({ combat: { on: false, round: 1, turn: 0, order: [] } });
    T.note('Fim do combate.', 'sys');
  };
  T.nextTurn = () => {
    const c = combat();
    const ord = order();
    if (!ord.length) return;
    let turn = c.turn + 1, round = c.round;
    if (turn >= ord.length) {
      turn = 0;
      round++;
      // surpresa só vale na primeira rodada
      for (const inf of T.infos()) if (inf.conds.includes('surpreso-desprevenido')) T.setConds(inf, inf.conds.filter((x) => x !== 'surpreso-desprevenido'));
    }
    T.putState({ combat: { ...c, order: ord, turn, round } });
    const inf = T.info(api.get(ord[turn].t));
    if (!inf) return;
    const warn = [];
    if (inf.conds.includes('flamejante')) warn.push('Flamejante: 1d6 de dano de fogo agora');
    if (inf.conds.includes('sangrando')) warn.push('Sangrando: 1d6 de dano agora');
    if (inf.conds.includes('defesa-total')) T.setConds(inf, inf.conds.filter((x) => x !== 'defesa-total'));
    if (warn.length) T.note(`${inf.name}: ${warn.join('; ')}.`, 'sys');
  };
  // o Mestre recolhe as iniciativas roladas pelos jogadores e põe na ordem
  function collectInits() {
    const c = combat();
    if (!T.isGm() || !c.on) return;
    const ord = order();
    let changed = false;
    for (const r of api.recs('rpgr')) {
      if (r.d?.t !== 'init' || r.ts < (c.ts || 0) || !r.d.tok || ord.some((o) => o.t === r.d.tok)) continue;
      const tok = api.get(r.d.tok);
      if (!tok || (tok.uid !== r.uid && r.uid !== api.gm())) continue;
      const cur = ord[c.turn]?.t;
      ord.push({ t: r.d.tok, i: R.int(r.d.total) });
      ord.sort((a, b) => b.i - a.i);
      c.turn = Math.max(0, ord.findIndex((o) => o.t === cur));
      changed = true;
    }
    if (changed) T.putState({ combat: { ...c, order: ord } });
  }
  T.rollInit = (inf) => {
    if (inf.char) return T.testSkill(inf.char, 'iniciativa', inf);
    const d = T.rollTest({ label: 'Iniciativa', n: 2, parts: [{ l: 'AGI', v: inf.at.a || 0 }], tok: inf, kind: 'init' });
    T.log(d);
  };

  // ------------------------------------------------------------ tela
  const TABS = [
    ['mesa', 'swords', 'Mesa'],
    ['ficha', 'scroll', 'Ficha'],
    ['livro', 'book', 'Livro'],
    ['mestre', 'crown', 'Mestre'],
  ];
  const top = h('div', 'rt-top');
  const body = h('div', 'rt-body');
  root.replaceChildren(top, body);
  root.classList.add('rt');

  function renderTop() {
    const c = T.myChar();
    top.replaceChildren(
      h('div', 'rt-tabs', TABS.filter(([id]) => id !== 'mestre' || T.isGm()).map(([id, icn, label]) => h('button', { class: 'rt-tab' + (S.tab === id ? ' on' : ''), onclick: () => T.go(id) }, ic(icn), label))),
      h('div', 'rt-me',
        T.isGm() && h('span', 'rt-badge gm', ic('crown'), 'Mestre'),
        c && h('button', { class: 'rt-mechip', title: 'Abrir a minha ficha', onclick: () => ((S.cid = c.id), T.go('ficha')) },
          h('b', null, c.d.name || 'Sem nome'),
          h('span', 'rt-bar pv', h('i', { style: { width: (100 * c.d.pv) / c.d.pvMax + '%' } }), h('em', null, `PV ${c.d.pv}/${c.d.pvMax}`)),
          h('span', 'rt-bar pm', h('i', { style: { width: (100 * c.d.pm) / Math.max(1, c.d.pmMax) + '%' } }), h('em', null, `PM ${c.d.pm}/${c.d.pmMax}`)),
        ),
        btn('rt-btn ghost', 'x', 'Sair da mesa', () => api.close(), 'Voltar para o chat e a call'),
      ),
    );
  }
  T.go = (tab) => {
    S.tab = tab;
    renderTop();
    renderTab();
  };
  function renderTab() {
    S.dirty = false;
    if (!T.D) return body.replaceChildren(h('div', 'rt-empty', 'Abrindo o livro…'));
    if (S.tab === 'mesa') renderMesa();
    else if (S.tab === 'ficha') T.renderFicha(body);
    else if (S.tab === 'livro') T.renderLivro(body);
    else if (S.tab === 'mestre' && T.isGm()) T.renderMestre(body);
    else T.go('mesa');
  }
  T.renderTab = renderTab;

  // ------------------------------------------------------------ aba Mesa
  let M = null; // nós da mesa (mapa, tokens, log, painel)
  function renderMesa() {
    M = { toks: new Map() };
    M.init = h('div', 'rt-init');
    M.map = h('div', 'rt-map');
    M.grid = h('div', 'rt-grid');
    M.bg = h('img', { class: 'rt-mapimg', draggable: false, hidden: true });
    M.layer = h('div', 'rt-layer');
    M.ruler = h('div', { class: 'rt-ruler', hidden: true });
    M.map.append(M.bg, M.grid, M.layer, M.ruler);
    M.wrap = h('div', { class: 'rt-mapwrap', oncontextmenu: (e) => e.preventDefault() }, M.map);
    M.tools = h('div', 'rt-maptools',
      btn('rt-ib', 'plus', null, () => zoomBy(1.2), 'Aproximar'),
      btn('rt-ib', 'minus', null, () => zoomBy(1 / 1.2), 'Afastar'),
      btn('rt-ib', 'maximize', null, fitMap, 'Ver o mapa inteiro'),
      (M.rulerBtn = btn('rt-ib', 'ruler', null, () => { S.tool = S.tool === 'ruler' ? '' : 'ruler'; M.rulerBtn.classList.toggle('on', S.tool === 'ruler'); }, 'Régua: arraste no mapa para medir em metros')),
    );
    M.hint = h('div', 'rt-maphint');
    M.req = h('div', { class: 'rt-req', hidden: true });
    M.log = h('div', 'rt-log');
    M.dice = h('form', { class: 'rt-dice', onsubmit: onDiceSubmit },
      (M.diceIn = h('input', { placeholder: T.isGm() ? '2d6+3, ou escreva uma narração' : '2d6+3, ou escreva uma mensagem', maxLength: 300 })),
      T.isGm() && (M.secretBtn = btn('rt-ib' + (S.secret ? ' on' : ''), S.secret ? 'eye-off' : 'eye', null, () => { S.secret = !S.secret; renderMesa(); }, 'Rolagem secreta: só você vê')),
      h('button', { class: 'rt-btn primary', type: 'submit' }, ic('dices'), 'Rolar'),
    );
    M.dock = h('div', 'rt-dock');
    body.replaceChildren(
      h('div', 'rt-mesa',
        M.init,
        h('div', 'rt-main',
          h('div', 'rt-mapcol', h('div', 'rt-mapbox', M.wrap, M.tools, M.hint, M.req), M.dock),
          h('div', 'rt-side', h('div', 'rt-side-h', ic('dices'), 'Rolagens da mesa', T.isGm() && btn('rt-link', null, 'Limpar', clearLog)), M.log, M.dice),
        ),
      ),
    );
    bindMap();
    syncMap();
    syncTokens();
    renderInit();
    renderLog(true);
    renderDock();
    renderReq();
    requestAnimationFrame(() => S.fitted || (fitMap(), (S.fitted = true)));
  }
  function applyView() {
    if (M) M.map.style.transform = `translate(${S.view.x}px, ${S.view.y}px) scale(${S.view.z})`;
  }
  function zoomBy(f, cx, cy) {
    const r = M.wrap.getBoundingClientRect();
    cx ??= r.width / 2;
    cy ??= r.height / 2;
    const z = R.clamp(S.view.z * f, 0.25, 3);
    S.view.x = cx - ((cx - S.view.x) * z) / S.view.z;
    S.view.y = cy - ((cy - S.view.y) * z) / S.view.z;
    S.view.z = z;
    applyView();
  }
  function fitMap() {
    const m = T.state().map || {};
    const r = M.wrap.getBoundingClientRect();
    if (!r.width) return;
    const w = (m.cols || 30) * CELL, hh = (m.rows || 20) * CELL;
    const z = R.clamp(Math.min(r.width / w, r.height / hh) * 0.96, 0.25, 2);
    S.view = { z, x: (r.width - w * z) / 2, y: (r.height - hh * z) / 2 };
    applyView();
  }
  function syncMap() {
    const m = T.state().map || {};
    M.map.style.width = (m.cols || 30) * CELL + 'px';
    M.map.style.height = (m.rows || 20) * CELL + 'px';
    M.grid.style.backgroundSize = `${CELL}px ${CELL}px`;
    M.grid.classList.toggle('off', !!m.nogrid);
    // mudou o tamanho da grade: enquadra o mapa de novo
    const dims = (m.cols || 30) + 'x' + (m.rows || 20);
    if (M.dims && M.dims !== dims) requestAnimationFrame(fitMap);
    M.dims = dims;
    if (m.img && M.imgId !== m.img) {
      M.imgId = m.img;
      api.fileUrl(m.img, api.gm()).then((url) => {
        if (!url || M.imgId !== m.img) return;
        M.bg.src = url;
        M.bg.hidden = false;
      });
    } else if (!m.img) {
      M.imgId = '';
      M.bg.hidden = true;
    }
    applyView();
  }
  const toMap = (e) => {
    const r = M.wrap.getBoundingClientRect();
    return { x: (e.clientX - r.left - S.view.x) / S.view.z / CELL, y: (e.clientY - r.top - S.view.y) / S.view.z / CELL };
  };
  function bindMap() {
    M.wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = M.wrap.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    M.wrap.addEventListener('pointerdown', (e) => {
      const tokEl = e.target.closest('.rt-tok');
      if (tokEl) return tokDown(e, tokEl);
      if (e.button === 2) {
        S.target = '';
        return refreshSel();
      }
      M.wrap.setPointerCapture(e.pointerId);
      const start = { x: e.clientX, y: e.clientY, vx: S.view.x, vy: S.view.y, p: toMap(e) };
      const ruler = S.tool === 'ruler' || e.shiftKey;
      const move = (ev) => {
        if (ruler) drawRuler(start.p, toMap(ev));
        else {
          S.view.x = start.vx + ev.clientX - start.x;
          S.view.y = start.vy + ev.clientY - start.y;
          applyView();
        }
      };
      const up = () => {
        M.wrap.removeEventListener('pointermove', move);
        M.wrap.removeEventListener('pointerup', up);
        if (ruler) setTimeout(() => (M.ruler.hidden = true), 1500);
      };
      M.wrap.addEventListener('pointermove', move);
      M.wrap.addEventListener('pointerup', up);
    });
    M.wrap.addEventListener('dblclick', (e) => {
      if (e.target.closest('.rt-tok')) return;
      const p = toMap(e);
      api.send({ t: 'ping', x: p.x, y: p.y, c: me.color });
      showPing(p.x, p.y, me.color);
    });
  }
  function drawRuler(a, b, label) {
    const dx = (b.x - a.x) * CELL, dy = (b.y - a.y) * CELL;
    const len = Math.hypot(dx, dy);
    const cells = Math.max(Math.abs(Math.round(b.x - a.x)), Math.abs(Math.round(b.y - a.y)));
    M.ruler.hidden = false;
    Object.assign(M.ruler.style, { left: a.x * CELL + 'px', top: a.y * CELL + 'px', width: len + 'px', transform: `rotate(${Math.atan2(dy, dx)}rad)` });
    M.ruler.dataset.m = label || `${(cells * R.CELL_M).toLocaleString('pt-BR')} m`;
    M.ruler.style.setProperty('--rot', `${-Math.atan2(dy, dx)}rad`);
  }
  function showPing(x, y, color) {
    if (!M) return;
    const p = h('div', { class: 'rt-ping', style: { left: x * CELL + 'px', top: y * CELL + 'px', borderColor: color || '#fff' } });
    M.layer.append(p);
    setTimeout(() => p.remove(), 1600);
  }
  function tokDown(e, tokEl) {
    const tok = api.get(tokEl.dataset.id);
    if (!tok) return;
    if (e.button === 2) {
      S.target = S.target === tok.id ? '' : tok.id;
      return refreshSel();
    }
    e.preventDefault();
    const can = T.canCtl(tok);
    const start = toMap(e);
    const off = { x: start.x - tok.x, y: start.y - tok.y };
    let dragging = false;
    tokEl.setPointerCapture(e.pointerId);
    const cellOf = (ev) => {
      const p = toMap(ev);
      const m = T.state().map || {};
      const sz = tok.sz || 1;
      return { x: R.clamp(Math.round(p.x - off.x), 0, (m.cols || 30) - sz), y: R.clamp(Math.round(p.y - off.y), 0, (m.rows || 20) - sz) };
    };
    const move = (ev) => {
      if (!can) return;
      const p = toMap(ev);
      if (!dragging && Math.hypot(p.x - start.x, p.y - start.y) < 0.2) return;
      dragging = true;
      tokEl.classList.add('drag');
      const c = cellOf(ev);
      tokEl.style.left = c.x * CELL + 'px';
      tokEl.style.top = c.y * CELL + 'px';
      const cells = Math.max(Math.abs(c.x - tok.x), Math.abs(c.y - tok.y));
      const sz = (tok.sz || 1) / 2;
      const inf = T.info(tok);
      const over = combat().on && cells * R.CELL_M > inf.desl;
      drawRuler({ x: tok.x + sz, y: tok.y + sz }, { x: c.x + sz, y: c.y + sz }, `${(cells * R.CELL_M).toLocaleString('pt-BR')} m${over ? ' (passa do deslocamento ' + inf.desl + ' m)' : ''}`);
      M.ruler.classList.toggle('over', over);
    };
    const up = (ev) => {
      tokEl.removeEventListener('pointermove', move);
      tokEl.removeEventListener('pointerup', up);
      tokEl.classList.remove('drag');
      M.ruler.hidden = true;
      if (dragging) {
        const c = cellOf(ev);
        if (c.x !== tok.x || c.y !== tok.y) {
          markUsed(tok.id, 'mov', Math.max(Math.abs(c.x - tok.x), Math.abs(c.y - tok.y)) * R.CELL_M);
          T.putTok(tok, c);
        } else syncTokens();
        return;
      }
      if (ev.shiftKey || !can) S.target = S.target === tok.id ? '' : tok.id;
      else S.actor = tok.id;
      if (S.target === S.actor) S.target = '';
      refreshSel();
    };
    tokEl.addEventListener('pointermove', move);
    tokEl.addEventListener('pointerup', up);
  }
  function refreshSel() {
    syncTokens();
    renderDock();
  }
  function syncTokens() {
    if (!M) return;
    const infos = T.infos();
    const cur = T.curTok();
    const seen = new Set();
    // o alvo que sumiu do mapa deixa de ser alvo
    if (S.target && !infos.some((i) => i.id === S.target)) S.target = '';
    if (S.actor && !infos.some((i) => i.id === S.actor)) S.actor = '';
    if (!S.actor) S.actor = infos.find((i) => i.char && i.char.uid === me.id)?.id || '';
    const actor = infos.find((i) => i.id === S.actor);
    const target = infos.find((i) => i.id === S.target);
    const fl = actor && target ? R.flankers(actor, target, infos).map((f) => f.id) : [];
    for (const inf of infos) {
      seen.add(inf.id);
      let n = M.toks.get(inf.id);
      if (!n) {
        n = { el: h('div', { class: 'rt-tok', dataset: { id: inf.id } }) };
        n.body = h('div', 'rt-tok-body');
        n.hp = h('i');
        n.name = h('div', 'rt-tok-name');
        n.conds = h('div', 'rt-tok-conds');
        n.el.append(n.body, h('div', 'rt-tok-hp', n.hp), n.name, n.conds);
        M.layer.append(n.el);
        M.toks.set(inf.id, n);
      }
      if (!n.el.classList.contains('drag')) Object.assign(n.el.style, { left: inf.x * CELL + 'px', top: inf.y * CELL + 'px', width: inf.sz * CELL + 'px', height: inf.sz * CELL + 'px' });
      n.el.className = ['rt-tok', 'side-' + inf.side, inf.id === S.actor && 'sel', inf.id === S.target && 'tgt', inf.id === cur && 'turn', inf.down && 'down', inf.hid && 'hid', fl.includes(inf.id) && 'flank', n.el.classList.contains('drag') && 'drag', T.canCtl(inf.tok) && 'mine'].filter(Boolean).join(' ');
      n.body.style.background = inf.color;
      n.body.textContent = (inf.name.trim()[0] || '?').toUpperCase() + (/\s(\d+)$/.exec(inf.name)?.[1] || '');
      n.hp.style.width = R.clamp((100 * inf.pv) / inf.pvMax, 0, 100) + '%';
      n.hp.className = inf.pv / inf.pvMax < 0.34 ? 'low' : inf.pv / inf.pvMax < 0.67 ? 'mid' : '';
      n.name.textContent = inf.name;
      n.conds.textContent = inf.conds.length ? '●'.repeat(Math.min(4, inf.conds.length)) : '';
      n.el.title = inf.conds.map((id) => R.condList(T.D).find((c) => c.id === id)?.n || id).join(', ');
    }
    for (const [id, n] of M.toks) if (!seen.has(id)) {
      n.el.remove();
      M.toks.delete(id);
    }
    M.hint.textContent = infos.length ? (T.isGm() ? 'Clique: quem age · Botão direito: alvo · Arraste para mover · Duplo clique: sinalizar' : 'Clique num inimigo para mirar · Arraste o seu token para mover · Duplo clique: sinalizar') : T.isGm() ? 'Mapa vazio. Na aba Mestre você escolhe a imagem e coloca os monstros.' : 'O Mestre ainda não colocou nada no mapa.';
  }
  T.syncTokens = syncTokens;

  // faixa da iniciativa
  function renderInit() {
    if (!M) return;
    const c = combat();
    const ord = order();
    const gm = T.isGm();
    const mine = T.infos().filter((i) => i.char && i.char.uid === me.id);
    const kids = [];
    if (!c.on) {
      kids.push(h('span', 'rt-init-t', ic('swords'), 'Fora de combate'));
      if (gm) kids.push(btn('rt-btn primary', 'swords', 'Iniciar combate', T.startCombat, 'Rola a iniciativa dos monstros e pede a dos jogadores'));
    } else {
      kids.push(h('span', 'rt-init-t on', ic('swords'), `Rodada ${c.round}`));
      kids.push(h('div', 'rt-order', ord.map((o, idx) => {
        const inf = T.info(api.get(o.t));
        if (!inf || (inf.hid && !gm)) return null;
        return h('button', { class: 'rt-oi' + (idx === c.turn ? ' cur' : '') + (inf.down ? ' down' : ''), title: `${inf.name}: iniciativa ${o.i}`, onclick: () => { S[T.canCtl(inf.tok) ? 'actor' : 'target'] = inf.id; refreshSel(); } },
          h('span', { class: 'rt-oi-av', style: { background: inf.color } }, inf.name[0]), h('span', 'rt-oi-n', inf.name), h('em', null, o.i));
      })));
      for (const inf of mine) if (!ord.some((o) => o.t === inf.id)) kids.push(btn('rt-btn primary pulse', 'dices', 'Rolar iniciativa', () => T.rollInit(inf)));
      const curInf = T.info(api.get(T.curTok()));
      if (curInf && !gm && T.canCtl(curInf.tok)) kids.push(btn('rt-btn primary', 'check', 'Encerrar meu turno', () => api.send({ t: 'endturn', tok: curInf.id })));
      if (gm) kids.push(btn('rt-btn primary', 'skip-forward', 'Próximo turno', T.nextTurn), btn('rt-btn ghost', 'x', 'Encerrar', T.endCombat));
    }
    M.init.replaceChildren(...kids);
  }

  // pedido de teste do Mestre
  function renderReq() {
    if (!M) return;
    const q = T.state().req;
    const c = T.myChar();
    const fresh = q && Date.now() - q.ts < 15 * 60e3;
    const done = fresh && api.recs('rpgr').some((r) => r.uid === me.id && r.d?.req === q.id);
    M.req.hidden = !fresh || T.isGm() || done;
    if (M.req.hidden) return;
    const sk = T.D.skills.find((s) => s.id === q.sk);
    const name = sk ? sk.n : R.AT_BY[q.sk]?.n || 'Teste';
    M.req.replaceChildren(
      h('span', null, ic('crown'), h('b', null, 'O Mestre pediu: '), `teste de ${name}${q.df && !q.hide ? ` (Dificuldade ${q.df})` : ''}`),
      btn('rt-btn primary', 'dices', 'Rolar', () => {
        const inf = T.infos().find((i) => i.char?.id === c?.id);
        let d;
        if (sk && c) d = T.rollTest({ label: sk.n, sub: R.ptsText(c.d.sk[sk.id] || 0), n: R.skillDice(c.d.sk[sk.id] || 0), parts: [{ l: R.AT_BY[sk.at[0]].s, v: Math.max(...sk.at.map((a) => c.d.at[a])) }], df: q.df || undefined, tok: inf });
        else d = T.rollTest({ label: 'Teste de ' + name, n: 2, parts: [{ l: R.AT_BY[q.sk]?.s || '', v: c?.d.at[q.sk] ?? 3 }], df: q.df || undefined, tok: inf });
        d.req = q.id;
        if (q.hide) {
          delete d.df;
          delete d.ok;
        }
        T.log(d);
      }),
    );
  }

  // ---- registro
  function clearLog() {
    if (!confirm('Apagar todas as rolagens da mesa para todo mundo?')) return;
    for (const r of api.recs('rpgr')) api.put({ k: 'rpgr', id: r.id, uid: r.uid, ts: r.ts, del: true });
    S.local = [];
  }
  function onDiceSubmit(e) {
    e.preventDefault();
    const text = M.diceIn.value.trim();
    if (!text) return;
    const f = R.rollFormula(text);
    if (f) {
      const dice = f.dice.flatMap((g) => g.r);
      const six = f.dice.every((g) => g.s === 6 && g.sign > 0);
      T.log({ t: 'free', who: whoOf(T.info(api.get(S.actor))), label: text.replace(/\s+/g, ''), dice, sides: six ? 6 : f.dice[0]?.s, parts: f.flat ? [{ l: '', v: f.flat }] : [], total: f.total, crit: six ? R.evalCrit(dice) : '' }, S.secret);
    } else T.note(text.slice(0, 300), T.isGm() ? 'narr' : 'note');
    M.diceIn.value = '';
  }
  const OUT = { miss: ['Errou', 'bad'], fumble: ['Falha crítica', 'bad'], block: ['Pegou na proteção', 'mid'], hit: ['Acertou', 'ok'] };
  function logCard(r) {
    const d = r.d;
    if (d.t === 'sys' || d.t === 'note' || d.t === 'narr') return h('div', 'rt-note ' + d.t, d.t !== 'sys' && h('b', null, d.who + ': '), d.text);
    const card = h('div', 'rt-card' + (d.crit ? ' ' + d.crit : '') + (r.secret ? ' secret' : ''));
    card.append(h('div', 'rt-card-h', h('b', null, d.who), h('span', null, d.label), d.sub && h('em', null, d.sub), r.secret && h('em', 'sec', 'secreta')));
    if (d.dice || d.total != null) {
      const row = h('div', 'rt-roll');
      for (const v of d.dice || []) row.append(h('span', 'rt-die' + ((d.sides || 6) === 6 && v === 6 ? ' six' : v === 1 ? ' one' : ''), v));
      for (const p of d.parts || []) row.append(h('span', 'rt-part', (p.v >= 0 ? '+' : '−') + Math.abs(p.v), p.l && h('small', null, p.l)));
      row.append(h('span', 'rt-eq', '='), h('span', 'rt-total', d.total));
      if (d.crit === 'crit') row.append(h('span', 'rt-tag crit', 'Crítico!'));
      if (d.crit === 'fumble') row.append(h('span', 'rt-tag bad', 'Falha crítica'));
      if (d.df && !d.out) row.append(h('span', 'rt-tag ' + (d.ok ? 'ok' : 'bad'), `${d.ok ? 'Passou' : 'Falhou'} (Dif. ${d.df})`));
      card.append(row);
    }
    if (d.out) {
      const [txt, cls] = OUT[d.out] || OUT.miss;
      const line = h('div', 'rt-atk', h('span', 'rt-tag ' + cls, txt), h('span', null, ' em ', h('b', null, d.tgtName)));
      if (d.dmg) {
        const dice = d.dmg.rolls.flatMap((x) => x.r).join(' + ');
        line.append(h('span', { class: 'rt-dmg', title: `Dano: ${dice || 'fixo'}${d.dmg.mult > 1 ? ' (x' + d.dmg.mult + ')' : ''} = ${d.dmg.raw}${d.rd ? ` − RD ${d.rd}` : ''}` }, `${d.final} de dano`, d.dmg.type && h('small', null, ' ' + d.dmg.type), d.rd ? h('small', null, ` (${d.dmg.raw} − RD ${d.rd})`) : null));
      }
      card.append(line);
      if (d.eff) card.append(h('div', 'rt-eff', d.eff));
      const tgt = api.get(d.tgt);
      if (d.final > 0 && !d.ap && tgt && T.canCtl(tgt)) card.append(btn('rt-btn primary sm', 'heart', `Aplicar ${d.final} de dano em ${d.tgtName}`, () => T.applyDamage(r)));
      if (d.ap) card.append(h('div', 'rt-applied', ic('check'), 'Dano aplicado'));
    }
    if (d.cost) card.append(h('div', 'rt-eff', `Gastou ${d.cost} de Mana`));
    if (d.cost === 0 && d.df && !d.ok) card.append(h('div', 'rt-eff', 'A magia falhou: não gasta Mana'));
    if (d.text) card.append(h('div', 'rt-card-x', d.text));
    for (const m of d.mods || []) card.append(h('div', 'rt-mod', `${m.l}: ${m.d > 0 ? '+' : '−'}${Math.abs(m.d)}d6`));
    for (const n of d.notes || []) card.append(h('div', 'rt-mod', n));
    return card;
  }
  function renderLog(force) {
    if (!M) return;
    const stick = force || M.log.scrollHeight - M.log.scrollTop - M.log.clientHeight < 80;
    const list = [...api.recs('rpgr'), ...S.local].filter((r) => r.d).sort((a, b) => a.ts - b.ts).slice(-150);
    M.log.replaceChildren(...(list.length ? list.map(logCard) : [h('div', 'rt-empty', 'Nenhuma rolagem ainda. Clique num atributo, perícia ou arma, ou digite 2d6+3 aqui embaixo.')]));
    if (stick) M.log.scrollTop = M.log.scrollHeight;
  }

  // ---- painel de ações (quem age, alvo, ataques, testes, modificadores)
  const stepper = (val, set, title) =>
    h('span', { class: 'rt-step', title }, btn('rt-ib', 'minus', null, () => set(val - 1)), h('input', { type: 'number', value: val, onchange: (e) => set(R.int(e.target.value, val)) }), btn('rt-ib', 'plus', null, () => set(val + 1)));
  T.stepper = stepper;
  T.vital = (label, cls, cur, max, set) => h('div', 'rt-vital ' + cls, h('label', null, label), stepper(cur, set), h('span', 'rt-vmax', '/ ' + max));
  function condPicker(inf) {
    const all = R.condList(T.D);
    const box = h('div', 'rt-pop');
    for (const c of all) {
      const on = inf.conds.includes(c.id);
      box.append(h('button', { class: 'rt-chip' + (on ? ' on' : ''), title: c.x.slice(0, 400), onclick: () => { T.setConds(inf, on ? inf.conds.filter((x) => x !== c.id) : [...inf.conds, c.id]); } }, c.n));
    }
    return box;
  }
  function renderDock() {
    if (!M) return;
    const infos = T.infos();
    const actor = infos.find((i) => i.id === S.actor);
    const target = infos.find((i) => i.id === S.target);
    const gm = T.isGm();
    const c = actor?.char || (!actor && T.myChar()) || null;
    const col1 = h('div', 'rt-dk actor');
    const col2 = h('div', 'rt-dk acts');
    const col3 = h('div', 'rt-dk mods');
    // quem age
    if (!actor && !c) add(col1, h('div', 'rt-empty', gm ? 'Clique num token para agir com ele.' : 'Crie o seu personagem na aba Ficha e peça para o Mestre colocar você no mapa.'), !gm && btn('rt-btn primary', 'scroll', 'Abrir a ficha', () => T.go('ficha')));
    else {
      const name = actor?.name || c.d.name || 'Sem nome';
      const can = actor ? T.canCtl(actor.tok) : true;
      const st = actor || { pv: c.d.pv, pvMax: c.d.pvMax, pm: c.d.pm, pmMax: c.d.pmMax, conds: c.d.conds, char: c };
      col1.append(h('div', 'rt-dk-h', h('b', null, name), actor && h('span', 'muted', actor.npc ? `Def ${actor.def}` : `Esq ${actor.esq} · Blq ${actor.blq} · Det ${actor.det} · RD ${actor.rd}`)));
      if (can) {
        col1.append(T.vital('PV', 'pv', st.pv, st.pvMax, (v) => T.setVital(actor || { char: c }, 'pv', v)));
        if (st.pmMax) col1.append(T.vital('PM', 'pm', st.pm, st.pmMax, (v) => T.setVital(actor || { char: c }, 'pm', v)));
        if (!actor && c) col1.append(btn('rt-btn primary sm', 'plus', 'Pôr meu personagem no mapa', () => T.placeChar(c)));
      } else col1.append(h('div', 'muted', 'Você não controla este token.'));
      const condNames = st.conds.map((id) => R.condList(T.D).find((x) => x.id === id)?.n || id);
      const cbtn = h('button', { class: 'rt-chip', onclick: () => { const open = col1.querySelector('.rt-pop'); open ? open.remove() : col1.append(condPicker(actor || { char: c, conds: c.d.conds })); } }, ic('flame'), condNames.length ? condNames.join(', ') : 'Condições');
      if (can) col1.append(cbtn);
      if (combat().on && actor && T.curTok() === actor.id) {
        const u = S.turnUsed.tok === actor.id ? S.turnUsed : { std: false, mov: false, moved: 0 };
        col1.append(h('div', 'rt-turn', h('span', 'rt-tag ok', 'Seu turno'), h('span', 'rt-ae' + (u.std ? ' used' : ''), 'Padrão'), h('span', 'rt-ae' + (u.mov ? ' used' : ''), `Movimento${u.moved ? ' ' + u.moved + ' m' : ''} / ${actor.desl} m`)));
      }
      if (gm && actor && !actor.char) {
        col1.append(h('div', 'rt-row',
          btn('rt-chip', actor.hid ? 'eye-off' : 'eye', actor.hid ? 'Escondido' : 'Visível', () => T.putTok(actor.tok, { hid: !actor.hid }), 'Jogadores só veem tokens visíveis'),
          h('select', { class: 'rt-sel', title: 'De que lado luta (conta para o flanco)', onchange: (e) => T.putTok(actor.tok, { side: e.target.value }) }, [['e', 'Inimigo'], ['a', 'Aliado'], ['n', 'Neutro']].map(([v, l]) => h('option', { value: v, selected: actor.side === v }, l))),
          h('select', { class: 'rt-sel', title: 'Tamanho no mapa', onchange: (e) => T.putTok(actor.tok, { sz: R.int(e.target.value, 1) }) }, [1, 2, 3, 4].map((v) => h('option', { value: v, selected: actor.sz === v }, v + 'x' + v))),
          btn('rt-chip danger', 'x', 'Tirar', () => api.put({ k: 'rpgk', id: actor.id, del: true })),
        ));
      } else if (gm && actor) col1.append(h('div', 'rt-row', btn('rt-chip danger', 'x', 'Tirar do mapa', () => api.put({ k: 'rpgk', id: actor.id, del: true }))));
    }
    // ações
    const src = actor || (c && { char: c, at: c.d.at, der: R.derive(c.d, T.D), id: '', name: c.d.name, conds: c.d.conds, x: 0, y: 0, npc: false });
    if (src) {
      const can = actor ? T.canCtl(actor.tok) : true;
      if (can) {
        const atkRow = h('div', 'rt-acts-row');
        const weapons = src.char ? src.der.weapons : (src.mon?.atk || []).map((a) => ({ ...a, npcAtk: true }));
        for (const w of weapons) {
          const dmg = src.char ? w.dm : `${w.d}${w.t ? '/' + w.t : ''}`;
          atkRow.append(h('button', { class: 'rt-act atk', title: target ? `Atacar ${target.name}` : 'Sem alvo: só rola o ataque', onclick: () => T.attack(src, w, target) }, ic('swords'), h('span', null, h('b', null, w.n), h('small', null, dmg))));
        }
        if (!weapons.length) atkRow.append(h('span', 'muted', 'Sem ataques.'));
        col2.append(h('div', 'rt-dk-h', h('b', null, 'Atacar'), target ? h('span', 'rt-tgt', ic('target'), target.name, target.npc ? ` · Def ${gm ? target.def : '?'}` : ` · Esq ${target.esq} · Blq ${target.blq}`) : h('span', 'muted', gm ? 'botão direito num token para mirar' : 'clique num inimigo para mirar')), atkRow);
        // atributos e perícias
        const tests = h('div', 'rt-acts-row');
        for (const a of R.AT) tests.append(h('button', { class: 'rt-act attr', style: { '--c': a.c }, title: `Teste de ${a.n}: 2d6 + ${src.at?.[a.id] ?? 0}`, onclick: () => T.testAttr(src, a.id) }, h('b', null, a.s), h('small', null, src.at?.[a.id] ?? '—')));
        if (src.char) {
          const sel = h('select', { class: 'rt-sel grow' }, h('option', { value: '' }, 'Perícia…'), T.D.skills.map((s) => h('option', { value: s.id }, `${s.n} ${R.ptsText(src.char.d.sk[s.id] || 0)}`)));
          sel.onchange = () => {
            if (sel.value) T.testSkill(src.char, sel.value, actor);
            sel.value = '';
          };
          tests.append(sel);
          const abs = src.char.d.ab.map((n) => T.findAbility(n, src.char.d)).filter((a) => a && a.t !== 'Suporte');
          if (abs.length) {
            const asel = h('select', { class: 'rt-sel grow' }, h('option', { value: '' }, 'Usar habilidade…'), abs.map((a, i) => h('option', { value: i }, `${a.n}${a.pm ? ' (' + a.pm + ' PM)' : ''}`)));
            asel.onchange = () => {
              if (asel.value !== '') T.useAbility(src.char, abs[+asel.value], actor);
              asel.value = '';
            };
            tests.append(asel);
          }
        }
        col2.append(h('div', 'rt-dk-h', h('b', null, 'Testes')), tests);
        if (src.mon?.ab?.length) col2.append(h('div', 'rt-mabs', src.mon.ab.map((n) => h('button', { class: 'rt-chip', onclick: () => T.openEntry('mabil', n) }, n))));
      } else col2.append(h('div', 'muted', 'Token de outra pessoa.'));
    }
    // modificadores
    const m = S.mod;
    const seg = h('div', 'rt-seg', [[-1, 'Desvantagem'], [0, 'Normal'], [1, 'Vantagem']].map(([v, l]) => h('button', { class: m.dice === v ? 'on' : '', title: v ? `${v > 0 ? '+' : '−'}1d6 na próxima rolagem` : '', onclick: () => { m.dice = v; renderDock(); } }, l)));
    col3.append(h('div', 'rt-dk-h', h('b', null, 'Próxima rolagem')), seg,
      h('div', 'rt-row', h('label', null, 'Bônus'), stepper(m.flat, (v) => { m.flat = R.clamp(v, -30, 30); renderDock(); }), h('label', null, 'Dif.'), h('input', { class: 'rt-in sm', type: 'number', min: 0, value: m.df, placeholder: '—', onchange: (e) => (m.df = e.target.value) })),
      h('div', 'rt-row',
        h('select', { class: 'rt-sel grow', title: 'Manobras de combate (cap. 1.9)', onchange: (e) => { S.man = e.target.value; if (S.man === 'defesa-total' && actor) { T.setConds(actor, [...new Set([...actor.conds, 'defesa-total'])]); T.note(`${actor.name} assume Defesa Total: +4 de Esquiva até o próximo turno.`, 'sys'); S.man = ''; } renderDock(); } }, h('option', { value: '' }, 'Manobra…'), R.MANEUVERS.map((x) => h('option', { value: x.id, selected: S.man === x.id }, `${x.n} (${x.act})`))),
        h('select', { class: 'rt-sel grow', title: 'Ataque localizado: Esquiva do alvo +4', onchange: (e) => { S.called = e.target.value; renderDock(); } }, R.CALLED.map((x) => h('option', { value: x.id, selected: S.called === x.id }, x.n))),
      ),
    );
    if (S.man) {
      const mv = R.MANEUVERS.find((x) => x.id === S.man);
      add(col3, h('div', 'rt-mod', mv.x), S.man === 'encontrao' && h('div', 'rt-row', h('label', null, 'Metros percorridos'), stepper(S.charge, (v) => { S.charge = R.clamp(v, 3, 60); renderDock(); })));
      if (['apertar', 'derrubar', 'desarmar'].includes(S.man) && src) col3.append(btn('rt-btn primary sm', 'dices', 'Rolar o confronto', () => { const a = (src.at.f || 0) >= (src.at.a || 0) ? 'f' : 'a'; S.man = ''; T.testAttr(src, a, 'Confronto: ' + mv.n); }));
    }
    if (actor && target) {
      const sit = R.situation(actor, target, infos, { melee: R.cellDist(actor, target) <= 1 });
      col3.append(h('div', 'rt-sit', h('b', null, `${R.metersBetween(actor, target).toLocaleString('pt-BR')} m até ${target.name}`), sit.notes.map((n) => h('div', 'rt-mod', n))));
    }
    M.dock.replaceChildren(col1, col2, col3);
  }
  T.renderDock = renderDock;

  // ficha da mesa antiga (2.9.1/2.9.2): vira um personagem, se a pessoa tinha mexido nela
  function migrateLegacy() {
    if (T.myChars().length) return;
    const o = api.legacy?.();
    if (!o || typeof o !== 'object') return;
    const sk = {};
    for (const [k, v] of Object.entries(o.skills || {})) {
      const id = String(k).replace(/_/g, '-');
      const hit = T.D.skills.find((s) => s.id === id || s.id.endsWith(id) || s.id.includes(id));
      if (hit && v > 0) sk[hit.id] = v;
    }
    const a = o.attrs || {};
    const touched = o.level > 1 || o.xp > 0 || o.notes || [a.forca, a.agilidade, a.inteligencia, a.vontade].some((x) => x !== 3) || Object.values(sk).reduce((s, v) => s + v, 0) !== 7;
    if (!touched) return;
    const d = R.newChar(o.charName || me.name);
    Object.assign(d, { player: me.name, race: o.race || '', cls: o.cls || '', paths: o.path ? [o.path] : [], lv: o.level || 1, xp: o.xp || 0, pv: o.pv, pvMax: o.pvMax, pm: o.pm, pmMax: o.pmMax, at: { f: a.forca, a: a.agilidade, i: a.inteligencia, v: a.vontade }, sk, money: o.money, threat: o.threat, notes: o.notes || '', on: true,
      bon: { esq: o.defBonus?.esquiva || 0, blq: (o.defBonus?.bloqueio || 0) + (o.defBonus?.armadura || 0), det: o.defBonus?.determinacao || 0, rd: o.rd?.fisico || 0 }, inv: (o.weapons || []).map((w) => ({ n: w.name, q: 1, eq: 1 })) });
    api.put({ k: 'rpgc', id: 'rpgc:' + R.rid(12), uid: me.id, d: R.cleanChar(d) });
    api.toast('Sua ficha da mesa antiga virou o personagem ' + d.name);
  }

  // ------------------------------------------------------------ ligações com o app
  installPanels(T);
  const ctl = {
    T,
    onRecs(kinds) {
      if (kinds.has('rpgr')) collectInits();
      if (kinds.has('rpgc') || kinds.has('grp')) renderTop();
      if (S.tab === 'mesa' && M) {
        if (kinds.has('rpgs')) {
          syncMap();
          renderInit();
          renderReq();
        }
        if (kinds.has('rpgk') || kinds.has('rpgc') || kinds.has('rpgs')) {
          syncTokens();
          renderInit();
          renderDock();
        }
        if (kinds.has('rpgr')) {
          renderLog();
          renderReq();
          renderInit();
        }
        return;
      }
      if (S.selfPut) return T.refreshComputed?.();
      const a = document.activeElement;
      if (root.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) S.dirty = true;
      else if (kinds.has('rpgc') || kinds.has('rpgk') || kinds.has('rpgs')) renderTab();
    },
    onNet(d, uid) {
      if (d?.t === 'ping' && Number.isFinite(d.x) && Number.isFinite(d.y)) showPing(d.x, d.y, String(d.c || '#fff').slice(0, 9));
      else if (d?.t === 'endturn' && T.isGm() && d.tok === T.curTok() && api.get(d.tok)?.uid === uid) T.nextTurn();
    },
    destroy() {
      root.classList.remove('rt');
      root.replaceChildren();
      M = null;
    },
  };
  root.addEventListener('focusout', () => setTimeout(() => S.dirty && !root.contains(document.activeElement) && renderTab(), 50));
  renderTop();
  renderTab();
  api.loadData().then((D) => {
    D.gearBy = new Map(D.gear.map((g) => [R.norm(g.n), g]));
    T.D = D;
    migrateLegacy();
    renderTab();
  }, () => body.replaceChildren(h('div', 'rt-empty', 'Não consegui abrir o livro de regras.')));
  return ctl;
}

window.JanjaRpg = { mount, rules: R };
