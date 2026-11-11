// Abas Ficha, Livro e Mestre da mesa de RPG, mais as janelas de escolha (habilidades, equipamentos, monstros).
export function installPanels(T) {
  const { h, R, api, S, ic, btn, me, fill, add } = T;
  const norm = R.norm;

  // texto do livro: parágrafos e tabelas ("| a | b |")
  function prose(text) {
    const box = h('div', 'rt-prose');
    let table = null;
    for (const line of String(text || '').split('\n')) {
      if (/^\|.*\|$/.test(line)) {
        const cells = line.slice(1, -1).split('|').map((s) => s.trim());
        if (!table) box.append((table = h('table')));
        table.append(h('tr', null, cells.map((c) => h(table.rows.length ? 'td' : 'th', null, c))));
        continue;
      }
      table = null;
      if (line.trim()) box.append(h('p', null, line));
    }
    return box;
  }
  T.prose = prose;

  // ------------------------------------------------------------ janela por cima da mesa
  function modal(title, content, { wide } = {}) {
    const close = () => ov.remove();
    const ov = h('div', { class: 'rt-ov', onpointerdown: (e) => e.target === ov && close() },
      h('div', 'rt-modal' + (wide ? ' wide' : ''), h('div', 'rt-modal-h', h('b', null, title), btn('rt-ib', 'x', null, close, 'Fechar')), content));
    T.root.append(ov);
    return { close, el: ov };
  }
  T.modal = modal;

  // ------------------------------------------------------------ compêndio: achar e mostrar
  const KIND_LABEL = { raca: 'Raça', classe: 'Classe', caminho: 'Caminho', profissao: 'Profissão', talento: 'Talento', dogma: 'Dogma', criatura: 'Criatura' };
  T.findAbility = (name, c) => {
    const n = norm(name);
    const all = T.D.abil.filter((a) => norm(a.n) === n);
    if (!all.length) return null;
    return all.find((a) => c && (a.s === c.race || a.s === c.cls || c.paths.includes(a.s))) || all[0];
  };
  const abMeta = (a) => [a.rq && 'Requisito: ' + a.rq, a.pm && 'Mana: ' + a.pm, a.df && 'Dificuldade: ' + a.df, a.al && 'Alcance: ' + a.al, a.av && 'Alvo: ' + a.av, a.du && 'Duração: ' + a.du].filter(Boolean);
  function abilityView(a) {
    return h('div', 'rt-entry',
      h('div', 'rt-entry-h', h('b', null, a.n), h('span', 'rt-tag', a.c), h('span', 'rt-tag ' + (a.t === 'Ação' ? 'ok' : a.t === 'Reação' ? 'mid' : ''), a.t), h('span', 'muted', `${KIND_LABEL[a.k] || ''}${a.s && a.s !== 'Talentos' && a.s !== 'Criaturas' ? ': ' + a.s : ''}${a.auto ? ' (automática)' : ''}`)),
      abMeta(a).length ? h('div', 'rt-meta', abMeta(a).map((m) => h('span', null, m))) : null,
      prose(a.x));
  }
  function gearView(g) {
    const meta = [g.$ && 'Custo: ' + g.$, g.fn != null && 'FN: ' + g.fn, g.dm && 'Dano: ' + g.dm, g.tp && 'Tipo: ' + g.tp, g.rd != null && 'Redução de Dano: ' + g.rd, g.df != null && 'Bônus de Defesa: ' + g.df, g.pr && 'Propriedades: ' + g.pr].filter(Boolean);
    return h('div', 'rt-entry', h('div', 'rt-entry-h', h('b', null, g.n), h('span', 'rt-tag', g.g)), h('div', 'rt-meta', meta.map((m) => h('span', null, m))), prose(g.x));
  }
  function monsterView(m) {
    return h('div', 'rt-entry',
      h('div', 'rt-entry-h', h('b', null, m.n), m.kd && h('span', 'rt-tag', m.kd), h('span', 'muted', m.g)),
      h('div', 'rt-meta', h('span', null, `For ${m.at.f ?? '—'} · Agi ${m.at.a ?? '—'} · Int ${m.at.i ?? '—'} · Von ${m.at.v ?? '—'}`), h('span', null, `PV ${m.pv} · PM ${m.pm} · Def ${m.df}${m.ds ? ' · Desloc. ' + m.ds : ''}`)),
      m.atk.length ? h('div', 'rt-meta', m.atk.map((a) => h('span', null, `${a.n} (${a.k === 'd' ? 'Distância' : 'Corporal'}): ${a.d}${a.t ? '/' + a.t : ''}`))) : null,
      m.ab.length ? h('div', 'rt-mabs', m.ab.map((n) => h('button', { class: 'rt-chip', onclick: () => T.openEntry('mabil', n) }, n))) : null,
      prose([m.info, m.x].filter(Boolean).join('\n')));
  }
  T.openEntry = (kind, name) => {
    const n = norm(name);
    const a = kind === 'mabil' ? T.D.mabil.find((x) => norm(x.n) === n) || T.D.abil.find((x) => norm(x.n) === n) : T.findAbility(name);
    if (!a) return api.toast('Não achei "' + name + '" no livro');
    modal(a.n, abilityView(a));
  };

  // ------------------------------------------------------------ escolher do compêndio (habilidade, item)
  function picker({ title, items, label, sub, view, filters, onPick, pickLabel }) {
    let q = '', f = filters?.[0]?.[0] || '', sel = null;
    const list = h('div', 'rt-pick-list');
    const detail = h('div', 'rt-pick-detail');
    const draw = () => {
      const nq = norm(q);
      const fn = filters?.find((x) => x[0] === f)?.[2];
      const res = items.filter((it) => (!fn || fn(it)) && (!nq || norm(label(it)).includes(nq) || (nq.length > 3 && norm(it.x || '').includes(nq))));
      fill(list, ...res.slice(0, 250).map((it) => h('button', { class: 'rt-pick-i' + (it === sel ? ' on' : ''), onclick: () => { sel = it; draw(); } }, h('b', null, label(it)), h('small', null, sub(it)))), res.length > 250 ? h('div', 'muted', `Mais ${res.length - 250}: refine a busca.`) : null, res.length ? null : h('div', 'rt-empty', 'Nada encontrado.'));
      fill(detail, ...(sel ? [view(sel), btn('rt-btn primary', 'plus', pickLabel || 'Adicionar', () => onPick(sel, m))] : [h('div', 'rt-empty', 'Escolha um item da lista para ver os detalhes.')]));
    };
    const m = modal(title, h('div', 'rt-pick',
      h('div', 'rt-pick-top', h('input', { class: 'rt-in grow', placeholder: 'Buscar…', oninput: (e) => { q = e.target.value; draw(); } }), filters && h('select', { class: 'rt-sel', onchange: (e) => { f = e.target.value; draw(); } }, filters.map(([id, l]) => h('option', { value: id }, l)))),
      h('div', 'rt-pick-body', list, detail)), { wide: true });
    draw();
    m.el.querySelector('input').focus();
    return m;
  }

  // ------------------------------------------------------------ aba Ficha
  let F = null; // nós que mudam com as contas (defesas, pontos, fórmulas)
  T.refreshComputed = () => F?.refresh();
  T.renderFicha = (body) => {
    const gm = T.isGm();
    const mine = T.myChars();
    const list = gm ? T.chars() : mine;
    let c = T.charById(S.cid);
    if (!c || !(gm || c.uid === me.id)) c = T.myChar() || list[0] || null;
    S.cid = c?.id || '';
    const head = h('div', 'rt-fhead',
      h('select', { class: 'rt-sel', onchange: (e) => { S.cid = e.target.value; T.renderTab(); } }, list.length ? list.map((x) => h('option', { value: x.id, selected: x.id === S.cid }, `${x.d.name || 'Sem nome'}${gm && x.uid !== me.id ? ' — ' + T.userName(x.uid) : ''}${x.d.on ? ' ★' : ''}`)) : h('option', null, 'Nenhum personagem')),
      btn('rt-btn primary', 'plus', 'Novo personagem', () => wizard()),
      c && T.canEditChar(c) && btn('rt-btn ghost', 'image', c.d.img ? 'Trocar sprite' : 'Sprite do token', () => T.pickImage((id) => { T.putChar(c, { ...T.charById(c.id).d, img: id }); api.toast('Sprite trocado: veja no mapa'); T.renderTab(); }), 'Imagem que aparece no seu token no mapa'),
      c && btn('rt-btn ghost', 'copy', 'Ficha em texto', () => sheetDialog(c), 'Copiar ou colar a ficha no modelo do Discord'),
      c && c.uid === me.id && !c.d.on && btn('rt-btn ghost', 'check', 'Jogar com este', () => { for (const o of mine) if (o.d.on && o.id !== c.id) T.putChar(o, { ...o.d, on: false }); T.putChar(c, { ...c.d, on: true }); T.renderTab(); }),
      c && T.canEditChar(c) && btn('rt-btn ghost danger', 'x', 'Apagar', () => { if (confirm(`Apagar a ficha de ${c.d.name || 'sem nome'}? Não dá para desfazer.`)) { for (const t of api.recs('rpgk')) if (t.cid === c.id) api.put({ k: 'rpgk', id: t.id, del: true }); api.put({ k: 'rpgc', id: c.id, uid: c.uid, del: true }); S.cid = ''; T.renderTab(); } }),
    );
    if (!c) {
      F = null;
      return body.replaceChildren(h('div', 'rt-ficha', head, h('div', 'rt-empty big', h('b', null, 'Você ainda não tem personagem.'), h('span', null, 'Crie um em três passos: raça, classe e perícias da classe. O resto você preenche na ficha.'), btn('rt-btn primary', 'plus', 'Criar personagem', () => wizard()))));
    }
    const can = T.canEditChar(c);
    const D = T.D;
    const cur = () => T.charById(c.id)?.d || c.d;
    const save = (patch) => T.putChar(c, { ...cur(), ...patch });
    const full = (patch) => {
      save(patch);
      T.renderTab();
    };
    const inp = (key, props = {}) => h('input', { class: 'rt-in', value: cur()[key], disabled: !can, onchange: (e) => save({ [key]: props.type === 'number' ? R.int(e.target.value) : e.target.value }), ...props });
    const field = (label, node) => h('label', 'rt-f', h('span', null, label), node);
    const refs = {};

    // --- identidade
    const race = D.races.find((r) => r.n === c.d.race);
    const cls = D.classes.find((r) => r.n === c.d.cls);
    const optList = (list, val) => [h('option', { value: '' }, '—'), ...list.map((r) => h('option', { value: r.n, selected: r.n === val }, r.n)), val && !list.some((r) => r.n === val) ? h('option', { value: val, selected: true }, val) : null];
    const nextXp = D.levels.find((l) => l.lv === c.d.lv + 1);
    const ident = h('section', 'rt-sec',
      h('h3', null, 'Personagem'),
      h('div', 'rt-grid2',
        field('Nome', inp('name', { maxLength: 60 })), field('Jogador', inp('player', { maxLength: 60, placeholder: T.userName(c.uid) })),
        field('Raça', h('select', { class: 'rt-sel', disabled: !can, onchange: (e) => full({ race: e.target.value }) }, optList(D.races, c.d.race))),
        field('Classe', h('select', { class: 'rt-sel', disabled: !can, onchange: (e) => full({ cls: e.target.value }) }, optList(D.classes, c.d.cls))),
        field('Altura', inp('height', { maxLength: 20 })), field('Peso', inp('weight', { maxLength: 20 })),
      ),
      field('Caminhos', h('div', 'rt-chips', c.d.paths.map((p) => h('span', 'rt-chip on', p, can && h('button', { class: 'rt-x', onclick: () => full({ paths: cur().paths.filter((x) => x !== p) }) }, '×'))),
        can && h('select', { class: 'rt-sel', onchange: (e) => e.target.value && full({ paths: [...cur().paths, e.target.value] }) }, h('option', { value: '' }, '+ Caminho'), D.paths.filter((p) => !c.d.paths.includes(p.n)).map((p) => h('option', { value: p.n, title: p.req.join('\n') }, p.n))))),
      h('div', 'rt-lvl',
        h('div', 'rt-lvl-n', h('small', null, 'Nível'), h('b', null, c.d.lv)),
        field('XP', inp('xp', { type: 'number', min: 0 })),
        h('span', 'muted', nextXp ? `Nível ${nextXp.lv} com ${R.xpFor(D, nextXp.lv)} XP` : 'Nível máximo'),
        can && nextXp && btn('rt-btn ' + (c.d.xp >= R.xpFor(D, nextXp.lv) ? 'primary pulse' : 'ghost'), 'sparkles', 'Subir de nível', () => levelUp(c)),
      ),
    );

    // --- atributos, vida e defesas
    const attrs = h('div', 'rt-attrs', R.AT.map((a) =>
      h('div', { class: 'rt-attr', style: { '--c': a.c } },
        h('button', { class: 'rt-attr-roll', title: `Rolar teste de ${a.n}`, onclick: () => { T.testAttr({ at: cur().at, name: cur().name, id: T.infos().find((i) => i.char?.id === c.id)?.id }, a.id); api.toast(`Teste de ${a.n} rolado: veja na aba Mesa`); } }, h('small', null, a.s), ic('dices')),
        T.stepper(c.d.at[a.id], (v) => full({ at: { ...cur().at, [a.id]: R.clamp(v, 0, 30) } })),
        h('em', null, a.n))));
    const vit = h('div', 'rt-vitals',
      T.vital('PV', 'pv', c.d.pv, c.d.pvMax, (v) => full({ pv: R.clamp(v, 0, cur().pvMax) })), field('PV máx.', inp('pvMax', { type: 'number', min: 1 })),
      T.vital('PM', 'pm', c.d.pm, c.d.pmMax, (v) => full({ pm: R.clamp(v, 0, cur().pmMax) })), field('PM máx.', inp('pmMax', { type: 'number', min: 0 })),
    );
    const defBox = (key, label, formula) => {
      refs[key] = h('b');
      return h('div', 'rt-def', h('small', null, label), refs[key], h('span', { class: 'rt-def-b', title: 'Bônus extra (habilidades, nível, itens mágicos)' }, '+', h('input', { type: 'number', value: c.d.bon[key], disabled: !can, onchange: (e) => save({ bon: { ...cur().bon, [key]: R.int(e.target.value) } }) })), h('em', null, formula));
    };
    refs.desl = h('b');
    const defs = h('div', 'rt-defs', defBox('esq', 'Esquiva', '5 + Agi'), defBox('blq', 'Bloqueio', 'Esq + For/2 + armadura'), defBox('det', 'Determinação', '8 + Von ou Int'), defBox('rd', 'Red. de Dano', 'armadura'), h('div', 'rt-def', h('small', null, 'Deslocamento'), refs.desl, h('em', null, 'Agi/2 + 5')));
    const rest = can && h('div', 'rt-row', btn('rt-btn ghost sm', 'moon', 'Descansar 1 h (+6)', () => full({ pv: Math.min(cur().pvMax, cur().pv + 6), pm: Math.min(cur().pmMax, cur().pm + 6) })), btn('rt-btn ghost sm', 'moon', 'Dormir 8 h', () => full({ pv: cur().pvMax, pm: cur().pmMax, trk: 0 }), 'Dormindo recupera 12 por hora; também zera os truques usados'),
      field('Margem de ameaça', h('select', { class: 'rt-sel', onchange: (e) => save({ threat: e.target.value }) }, R.THREATS.map((t) => h('option', { value: t, selected: t === c.d.threat }, `(${t})`)))),
      field('Magias com', h('select', { class: 'rt-sel', onchange: (e) => save({ cast: e.target.value }) }, [['i', 'Inteligência'], ['v', 'Vontade']].map(([v, l]) => h('option', { value: v, selected: v === c.d.cast }, l)))));
    const stats = h('section', 'rt-sec', h('h3', null, 'Atributos e defesas', race && h('small', null, race.free ? ' Metadílio: 13 pontos livres' : ` ${race.n}: ${R.AT.map((a) => a.s + ' ' + race.at[a.id]).join(' · ')}`)), attrs, vit, defs, rest);

    // --- perícias
    refs.skBudget = h('small');
    const skills = h('section', 'rt-sec', h('h3', null, 'Perícias ', refs.skBudget), h('div', 'rt-skills', D.skills.map((s) => {
      const pts = c.d.sk[s.id] || 0;
      const attr = s.at.reduce((b, a) => (c.d.at[a] > c.d.at[b] ? a : b), s.at[0]);
      const perks = s.pk.filter((p) => p.p <= pts).map((p) => p.n);
      return h('div', 'rt-skill' + (pts ? ' has' : ''),
        h('button', { class: 'rt-skill-n', title: s.x.slice(0, 500), onclick: () => { T.testSkill(T.charById(c.id), s.id, T.infos().find((i) => i.char?.id === c.id)); api.toast(`${s.n} rolado: veja na aba Mesa`); } }, h('b', null, s.n), h('small', null, `${R.skillDice(pts) ? R.skillDice(pts) + 'd6 + ' : ''}${c.d.at[attr]} ${R.AT_BY[attr].s}${perks.length ? ' · ' + perks.join(', ') : ''}`)),
        h('span', 'rt-dots', [1, 2, 3, 4, 5].map((n) => h('button', { class: (n <= pts ? 'on' : '') + (n === 5 ? ' top' : ''), disabled: !can, title: s.pk.find((p) => p.p === n)?.n || '', onclick: () => { const sk = { ...cur().sk, [s.id]: pts === n ? n - 1 : n }; full({ sk }); } }, n === 5 ? '☗' : '◈'))));
    })));
    refs.profBudget = h('small');
    const profs = h('section', 'rt-sec', h('h3', null, 'Proficiências ', refs.profBudget), h('div', 'rt-profs', D.profs.map((p) => h('div', { class: 'rt-prof', title: p.w.join(', ') }, h('span', null, p.n), T.stepper(c.d.prof[p.n] || 0, (v) => full({ prof: { ...cur().prof, [p.n]: R.clamp(v, 0, 5) } }))))));

    // --- habilidades
    refs.abBudget = h('small');
    const abList = h('div', 'rt-ablist', c.d.ab.map((name) => {
      const a = T.findAbility(name, c.d);
      const row = h('details', 'rt-ab', h('summary', null, h('b', null, name), a ? h('span', 'rt-tag ' + (a.t === 'Ação' ? 'ok' : a.t === 'Reação' ? 'mid' : ''), a.t) : h('span', 'rt-tag', 'fora do livro'), a?.pm && h('span', 'rt-tag pm', a.pm + ' PM'),
        a && a.t !== 'Suporte' && can && h('button', { class: 'rt-btn primary sm', onclick: (e) => { e.preventDefault(); T.useAbility(T.charById(c.id), a, T.infos().find((i) => i.char?.id === c.id)); api.toast(`${a.n} usada: veja na aba Mesa`); } }, 'Usar'),
        can && h('button', { class: 'rt-x', title: 'Tirar da ficha', onclick: (e) => { e.preventDefault(); full({ ab: cur().ab.filter((x) => x !== name) }); } }, '×')));
      if (a) add(row, abMeta(a).length ? h('div', 'rt-meta', abMeta(a).map((m) => h('span', null, m))) : null, prose(a.x));
      return row;
    }));
    const addAb = () => picker({
      title: 'Adicionar habilidade', items: D.abil, label: (a) => a.n, sub: (a) => `${KIND_LABEL[a.k]}${a.s !== 'Talentos' ? ' ' + a.s : ''} · ${a.c} · ${a.t}${a.rq ? ' · Req.: ' + a.rq : ''}`, view: abilityView,
      filters: [['mine', 'Da minha raça, classe e caminhos', (a) => a.s === cur().race || a.s === cur().cls || cur().paths.includes(a.s)], ['raca', 'Da minha raça', (a) => a.s === cur().race], ['classe', 'Da minha classe', (a) => a.s === cur().cls], ['tal', 'Talentos', (a) => a.k === 'talento'], ['prof', 'Profissões', (a) => a.k === 'profissao'], ['all', 'Todas as do livro', null]],
      onPick: (a) => { if (cur().ab.some((x) => norm(x) === norm(a.n))) return api.toast('Já está na ficha'); full({ ab: [...cur().ab, a.n] }); api.toast(a.n + ' adicionada'); },
    });
    const abilities = h('section', 'rt-sec', h('h3', null, 'Habilidades ', refs.abBudget, can && btn('rt-btn ghost sm', 'plus', 'Adicionar', addAb)), c.d.ab.length ? abList : h('div', 'rt-empty', 'Nenhuma habilidade. No nível 1 você escolhe 4, além da habilidade automática da raça.'));

    // --- equipamento
    const invRow = (it, idx) => {
      const g = D.gearBy.get(norm(it.n));
      const setIt = (patch) => full({ inv: cur().inv.map((x, i) => (i === idx ? { ...x, ...patch } : x)) });
      return h('div', 'rt-inv' + (it.eq ? ' eq' : ''),
        h('button', { class: 'rt-inv-n', title: 'Ver no livro', onclick: () => g && T.modal(g.n, gearView(g)) }, h('b', null, it.n), h('small', null, g ? [g.dm && 'Dano ' + g.dm, g.rd != null && 'RD ' + g.rd, g.df != null && 'Defesa +' + g.df, g.fn != null && 'FN ' + g.fn].filter(Boolean).join(' · ') : 'item próprio')),
        g && (g.k === 'arma' || g.k === 'armadura') && can && h('button', { class: 'rt-chip' + (it.eq ? ' on' : ''), onclick: () => setIt({ eq: it.eq ? 0 : 1 }) }, it.eq ? 'Em uso' : 'Usar'),
        can ? T.stepper(it.q, (v) => setIt({ q: R.clamp(v, 0, 9999) }), 'Quantidade') : h('span', null, 'x' + it.q),
        can && h('button', { class: 'rt-x', onclick: () => full({ inv: cur().inv.filter((_, i) => i !== idx) }) }, '×'));
    };
    const addGear = () => {
      let buy = true;
      picker({
        title: 'Adicionar equipamento', items: D.gear, label: (g) => g.n, sub: (g) => `${g.g}${g.$ ? ' · ' + g.$ + ' moedas' : ''}${g.dm ? ' · ' + g.dm : ''}`, view: (g) => h('div', null, gearView(g), h('label', 'rt-check', h('input', { type: 'checkbox', checked: buy, onchange: (e) => (buy = e.target.checked) }), `Comprar: descontar do dinheiro (você tem ${cur().money})`)),
        filters: [['all', 'Tudo', null], ['arma', 'Armas', (g) => g.k === 'arma'], ['armadura', 'Armaduras e escudos', (g) => g.k === 'armadura'], ['item', 'Itens', (g) => g.k === 'item']],
        onPick: (g) => {
          const price = R.int(/\d+/.exec(g.$ || '')?.[0]);
          if (buy && price > cur().money) return api.toast(`Custa ${price} e você tem ${cur().money} moedas`);
          const inv = [...cur().inv];
          const have = inv.findIndex((x) => norm(x.n) === norm(g.n));
          if (have >= 0) inv[have] = { ...inv[have], q: inv[have].q + 1 };
          else inv.push({ n: g.n, q: 1, eq: 0 });
          full({ inv, money: buy ? cur().money - price : cur().money });
          api.toast(g.n + (buy && price ? ` comprado por ${price}` : ' adicionado'));
        },
      });
    };
    const custom = h('input', { class: 'rt-in grow', placeholder: 'Item que não está no livro', maxLength: 80, onkeydown: (e) => { if (e.key === 'Enter' && custom.value.trim()) full({ inv: [...cur().inv, { n: custom.value.trim(), q: 1, eq: 0 }] }); } });
    const gear = h('section', 'rt-sec', h('h3', null, 'Equipamento', can && btn('rt-btn ghost sm', 'plus', 'Do livro', addGear)),
      field('Dinheiro (moedas)', inp('money', { type: 'number', min: 0 })),
      c.d.inv.length ? h('div', 'rt-invlist', c.d.inv.map(invRow)) : h('div', 'rt-empty', `Sem itens. Um personagem de nível ${c.d.lv} começa com ${D.money[c.d.lv] || 400} moedas.`),
      can && h('div', 'rt-row', custom));

    // --- truques e anotações
    const arc = c.d.sk['conhecimento-arcano'] || 0;
    const tricks = h('section', 'rt-sec', h('h3', null, 'Truques ', h('small', null, `${c.d.trk} de ${arc} usados (1 por ponto em Conhecimento Arcano, por descanso longo)`)),
      arc ? h('div', 'rt-chips', D.tricks.map((t) => h('button', { class: 'rt-chip', title: t.x.slice(0, 500), onclick: () => { if (cur().trk >= arc) return api.toast('Você já usou todos os truques deste descanso'); save({ trk: cur().trk + 1 }); T.log({ t: 'abil', who: cur().name, label: t.n, sub: 'Truque', text: t.x.slice(0, 900) }); api.toast(`${t.n}: veja na aba Mesa`); T.renderTab(); } }, t.n))) : h('div', 'muted', 'Ponha pontos em Conhecimento Arcano para usar truques.'));
    const notes = h('section', 'rt-sec', h('h3', null, 'Idiomas e anotações'), field('Idiomas', inp('lang', { maxLength: 300 })), h('textarea', { class: 'rt-in', rows: 6, maxLength: 6000, disabled: !can, placeholder: 'História, aparência, objetivos…', value: c.d.notes, onchange: (e) => save({ notes: e.target.value }) }));

    F = {
      refresh() {
        const d = cur();
        const der = R.derive(d, D);
        const b = R.budget(d, D);
        refs.esq.textContent = der.esq;
        refs.blq.textContent = der.blq;
        refs.det.textContent = der.det;
        refs.rd.textContent = der.rd;
        refs.desl.textContent = `${der.desl} m (corrida ${der.run} m)`;
        const used = R.usedSkill(d);
        refs.skBudget.textContent = `${used} de ${b.sk} pontos`;
        refs.skBudget.className = used > b.sk ? 'over' : '';
        refs.profBudget.textContent = `${R.usedProf(d)} de ${b.prof} pontos`;
        refs.abBudget.textContent = `${d.ab.length} de ${b.ab + b.tal} (com talentos)`;
      },
    };
    F.refresh();
    body.replaceChildren(h('div', 'rt-ficha', head, h('div', 'rt-fcols', h('div', 'rt-fcol', ident, stats, gear), h('div', 'rt-fcol', skills, profs), h('div', 'rt-fcol', abilities, tricks, notes))));
  };

  // criar personagem: raça, classe e perícias da classe
  function wizard() {
    const D = T.D;
    const st = { name: '', race: D.races.find((r) => r.n === 'Humano') || D.races[0], cls: D.classes[0], opt: 0, sk: ['', ''], free: { f: 3, a: 3, i: 3, v: 4 } };
    const box = h('div', 'rt-wiz');
    const classSkills = (cl) => {
      const out = [];
      for (const raw of cl.sk) {
        const n = norm(raw);
        if (n.includes('qualquer conhecimento')) out.push(...D.skills.filter((s) => s.id.startsWith('conhecimento')));
        else {
          const words = n.split(' ').filter((w) => w.length >= 4 && w !== 'conhecimento');
          const hit = D.skills.filter((s) => words.some((w) => norm(s.n).split(' ').some((x) => x.startsWith(w.slice(0, 5)))));
          out.push(...hit);
        }
      }
      const uniq = [...new Set(out)];
      return uniq.length >= 2 ? uniq : D.skills;
    };
    const draw = () => {
      const at = st.race.free ? st.free : st.race.at;
      const bonus = st.cls.op[st.opt] || st.cls.op[0] || {};
      const fin = Object.fromEntries(R.AT.map((a) => [a.id, (at[a.id] || 0) + (bonus[a.id] || 0)]));
      const opts = classSkills(st.cls);
      const autoAb = D.abil.find((a) => a.k === 'raca' && a.s === st.race.n && a.auto);
      const freeSum = R.AT.reduce((s, a) => s + st.free[a.id], 0);
      const freeMax = Object.values(st.free).some((v) => v >= 5) ? 12 : 13;
      const freeOk = !st.race.free || (freeSum === freeMax && Object.values(st.free).every((v) => v >= 2));
      box.replaceChildren(
        h('label', 'rt-f', h('span', null, 'Nome do personagem'), h('input', { class: 'rt-in', value: st.name, maxLength: 60, oninput: (e) => (st.name = e.target.value) })),
        h('div', 'rt-wiz-2',
          h('div', null, h('h4', null, '1. Raça'), h('div', 'rt-wiz-list', D.races.map((r) => h('button', { class: 'rt-pick-i' + (r === st.race ? ' on' : ''), onclick: () => { st.race = r; draw(); } }, h('b', null, r.n), h('small', null, r.free ? '13 pontos para distribuir' : R.AT.map((a) => `${a.s} ${r.at[a.id]}`).join(' · ')))))),
          h('div', null, h('h4', null, '2. Classe'), h('div', 'rt-wiz-list', D.classes.map((cl) => h('button', { class: 'rt-pick-i' + (cl === st.cls ? ' on' : ''), onclick: () => { st.cls = cl; st.opt = 0; st.sk = ['', '']; draw(); } }, h('b', null, cl.n), h('small', null, cl.op.map((o) => Object.entries(o).map(([k, v]) => `${R.AT_BY[k].s} +${v}`).join(' e ')).join(' ou ')))))),
        ),
        st.race.free && h('div', 'rt-row', h('span', null, `Metadílio: distribua ${freeMax} pontos (mínimo 2 em cada; com um atributo em 5 ou mais são 12). Usados: ${freeSum}.`), R.AT.map((a) => h('label', 'rt-f inline', h('span', null, a.s), T.stepper(st.free[a.id], (v) => { st.free[a.id] = R.clamp(v, 2, 9); draw(); })))),
        st.cls.op.length > 1 && h('div', 'rt-row', h('span', null, 'Bônus da classe:'), st.cls.op.map((o, i) => h('button', { class: 'rt-chip' + (st.opt === i ? ' on' : ''), onclick: () => { st.opt = i; draw(); } }, Object.entries(o).map(([k, v]) => `${R.AT_BY[k].n} +${v}`).join(' e ')))),
        h('div', 'rt-row', h('span', null, `3. Perícias da classe (escolha ${st.cls.pick}):`), [0, 1].map((i) => h('select', { class: 'rt-sel', onchange: (e) => (st.sk[i] = e.target.value) }, h('option', { value: '' }, '—'), opts.map((s) => h('option', { value: s.id, selected: st.sk[i] === s.id }, s.n))))),
        h('div', 'rt-wiz-sum', h('b', null, 'Resultado: '), R.AT.map((a) => h('span', { class: 'rt-tag', style: { color: a.c } }, `${a.n} ${fin[a.id]}`)), h('span', 'rt-tag', 'PV 60 · PM 60'), h('span', 'rt-tag', `${D.money[1] || 400} moedas`), autoAb && h('span', 'rt-tag ok', 'Habilidade da raça: ' + autoAb.n)),
        h('p', 'muted', 'Depois, na ficha: distribua 25 pontos de perícia, escolha 4 habilidades e compre o equipamento.'),
        btn('rt-btn primary', 'check', 'Criar personagem', () => {
          if (!st.name.trim()) return api.toast('Dê um nome ao personagem');
          if (!freeOk) return api.toast(`Distribua exatamente ${freeMax} pontos, com 2 ou mais em cada atributo`);
          const d = R.newChar(st.name.trim());
          Object.assign(d, { player: me.name, race: st.race.n, cls: st.cls.n, opt: st.opt, at: fin, money: D.money[1] || 400, on: !T.myChars().some((x) => x.d.on), ab: autoAb ? [autoAb.n] : [] });
          for (const id of st.sk) if (id) d.sk[id] = (d.sk[id] || 0) + 1;
          const id = 'rpgc:' + R.rid(12);
          api.put({ k: 'rpgc', id, uid: me.id, d: R.cleanChar(d) });
          S.cid = id;
          m.close();
          T.go('ficha');
        }),
      );
    };
    const m = modal('Novo personagem', box, { wide: true });
    draw();
  }
  T.wizard = wizard;

  // subir de nível: mostra o que o nível dá e aplica o que é conta
  function levelUp(c) {
    const D = T.D;
    const lv = D.levels.find((l) => l.lv === c.d.lv + 1);
    if (!lv) return;
    const cur = () => T.charById(c.id).d;
    const save = (patch, msg) => {
      T.putChar(c, { ...cur(), ...patch });
      api.toast(msg);
    };
    const rows = lv.b.map((t) => {
      const n = R.int(/\d+/.exec(t)?.[0], 1);
      const acts = [];
      if (/de Vida ou .*Mana/i.test(t)) acts.push(btn('rt-chip', 'heart', `+${n} PV`, () => save({ pvMax: cur().pvMax + n, pv: cur().pv + n }, `+${n} de Vida`)), btn('rt-chip', 'wand', `+${n} PM`, () => save({ pmMax: cur().pmMax + n, pm: cur().pm + n }, `+${n} de Mana`)));
      else if (/de Vida/i.test(t)) acts.push(btn('rt-chip', 'heart', `+${n} PV`, () => save({ pvMax: cur().pvMax + n, pv: cur().pv + n }, `+${n} de Vida`)));
      else if (/de Mana/i.test(t)) acts.push(btn('rt-chip', 'wand', `+${n} PM`, () => save({ pmMax: cur().pmMax + n, pm: cur().pm + n }, `+${n} de Mana`)));
      if (/^Atributo/i.test(t)) for (const a of R.AT) acts.push(btn('rt-chip', null, `+1 ${a.s}`, () => save({ at: { ...cur().at, [a.id]: cur().at[a.id] + 1 } }, `+1 em ${a.n}`)));
      if (/Esquiva/i.test(t)) acts.push(btn('rt-chip', null, '+1 Esquiva', () => save({ bon: { ...cur().bon, esq: cur().bon.esq + 1 } }, '+1 de Esquiva')));
      if (/Bloqueio/i.test(t)) acts.push(btn('rt-chip', null, '+1 Bloqueio', () => save({ bon: { ...cur().bon, blq: cur().bon.blq + 1 } }, '+1 de Bloqueio')));
      if (/Determina/i.test(t)) acts.push(btn('rt-chip', null, '+1 Determinação', () => save({ bon: { ...cur().bon, det: cur().bon.det + 1 } }, '+1 de Determinação')));
      return h('div', 'rt-lvrow', h('span', null, t), acts.length ? h('div', 'rt-chips', acts) : h('small', 'muted', 'escolha na ficha'));
    });
    const m = modal(`Nível ${lv.lv}`, h('div', 'rt-wiz', h('p', null, `${c.d.name} sobe para o nível ${lv.lv}. O que este nível dá:`), rows,
      h('p', 'muted', 'Quando houver escolha (Vida ou Mana, Bloqueio ou Determinação), clique só em uma. Pontos de perícia, habilidade, talento e proficiência você gasta na própria ficha.'),
      btn('rt-btn primary', 'check', 'Concluir: virar nível ' + lv.lv, () => { T.putChar(c, { ...cur(), lv: lv.lv }); T.note(`${c.d.name} subiu para o nível ${lv.lv}!`, 'sys'); m.close(); T.renderTab(); })));
  }

  // ficha em texto: copiar para o Discord ou colar uma ficha de lá
  function sheetDialog(c) {
    const ta = h('textarea', { class: 'rt-in', rows: 16, value: R.sheetText(c.d, T.D) });
    const m = modal('Ficha em texto (modelo do Discord)', h('div', 'rt-wiz', h('p', 'muted', 'Copie para colar no Discord, ou cole aqui uma ficha no modelo do livro (Apêndice C) e clique em Importar: nome, raça, classe, atributos, vida, mana e perícias (◈◈◈◈☗) entram na ficha.'), ta,
      h('div', 'rt-row', btn('rt-btn ghost', 'copy', 'Copiar', () => navigator.clipboard.writeText(ta.value).then(() => api.toast('Ficha copiada'))),
        T.canEditChar(c) && btn('rt-btn primary', 'check', 'Importar para esta ficha', () => { T.putChar(c, R.parseSheet(ta.value, T.charById(c.id).d, T.D)); m.close(); T.renderTab(); api.toast('Ficha importada'); }))), { wide: true });
  }

  // ------------------------------------------------------------ aba Livro
  const CATS = [
    ['regras', 'Regras e mecânicas', () => T.D.book.filter((b) => ['Regras', 'Mecânicas', 'Regras opcionais', 'Níveis'].includes(b.part) && b.x)],
    ['pers', 'Raças, classes e caminhos', () => T.D.book.filter((b) => b.part === 'Personagem' && b.x)],
    ['abil', 'Habilidades', () => T.D.abil],
    ['tricks', 'Truques', () => T.D.tricks],
    ['gear', 'Equipamentos', () => T.D.gear],
    ['eqrules', 'Regras de equipamento', () => T.D.book.filter((b) => b.part === 'Equipamentos' && b.x)],
    ['mon', 'Monstros', () => T.D.monsters],
    ['mabil', 'Habilidades de criaturas', () => T.D.mabil],
    ['conds', 'Condições', () => R.condList(T.D)],
    ['outros', 'Profissões e aditivos', () => T.D.book.filter((b) => ['Profissões', 'Aditivos', 'Monstros'].includes(b.part) && b.x)],
  ];
  const itemTitle = (it) => it.n || it.t;
  const itemSub = (it, cat) => (cat === 'abil' ? `${KIND_LABEL[it.k]}${it.s !== 'Talentos' ? ' ' + it.s : ''} · ${it.t}` : cat === 'gear' ? it.g : cat === 'mon' ? `${it.g} · PV ${it.pv} · Def ${it.df}` : it.path || '');
  function itemView(it, cat) {
    if (cat === 'abil' || cat === 'mabil') return abilityView(it);
    if (cat === 'gear') return gearView(it);
    if (cat === 'mon') return h('div', null, monsterView(it), T.isGm() && btn('rt-btn primary', 'plus', 'Colocar no mapa', () => { T.addMonster(it, 1); api.toast(it.n + ' colocado no mapa'); }));
    return h('div', 'rt-entry', h('div', 'rt-entry-h', h('b', null, itemTitle(it)), it.path && h('span', 'muted', it.path)), prose(it.x));
  }
  T.renderLivro = (body) => {
    const L = S.livro;
    const list = h('div', 'rt-pick-list');
    const detail = h('div', 'rt-pick-detail');
    const srcSel = h('select', { class: 'rt-sel', onchange: (e) => { L.src = e.target.value; draw(); } });
    const draw = () => {
      const nq = norm(L.q);
      let res = [];
      const cats = nq.length >= 2 ? CATS : CATS.filter((c) => c[0] === L.cat);
      for (const [id, , get] of cats) for (const it of get()) {
        if (nq.length < 2 && id === 'abil' && L.src && it.s !== L.src) continue;
        if (nq.length >= 2 && !norm(itemTitle(it)).includes(nq) && !(nq.length > 3 && norm(it.x || '').includes(nq))) continue;
        res.push([it, id]);
      }
      if (nq.length >= 2) res.sort((a, b) => norm(itemTitle(b[0])).includes(nq) - norm(itemTitle(a[0])).includes(nq));
      srcSel.hidden = L.cat !== 'abil' || nq.length >= 2;
      fill(list, ...res.slice(0, 300).map(([it, id]) => h('button', { class: 'rt-pick-i' + (L.sel === it ? ' on' : ''), onclick: () => { L.sel = it; L.selCat = id; draw(); } }, h('b', null, itemTitle(it)), h('small', null, itemSub(it, id)))), res.length > 300 ? h('div', 'muted', `Mais ${res.length - 300} resultados: refine a busca.`) : null, res.length ? null : h('div', 'rt-empty', 'Nada encontrado.'));
      detail.replaceChildren(L.sel ? itemView(L.sel, L.selCat) : h('div', 'rt-empty', 'Guia Definitivo d2Trinities V1.2. Escolha um assunto ao lado ou busque por qualquer palavra.'));
    };
    const sources = [...new Set(T.D.abil.map((a) => a.s))];
    srcSel.append(h('option', { value: '' }, 'Todas as origens'), ...sources.map((s) => h('option', { value: s, selected: s === L.src }, s)));
    body.replaceChildren(h('div', 'rt-livro',
      h('div', 'rt-cats', CATS.map(([id, label, get]) => h('button', { class: 'rt-cat' + (L.cat === id ? ' on' : ''), onclick: () => { L.cat = id; L.q = ''; T.renderTab(); } }, label, h('em', null, get().length)))),
      h('div', 'rt-pick',
        h('div', 'rt-pick-top', h('input', { class: 'rt-in grow', placeholder: 'Buscar no livro inteiro…', value: L.q, oninput: (e) => { L.q = e.target.value; draw(); } }), srcSel),
        h('div', 'rt-pick-body', list, detail))));
    draw();
  };

  // ------------------------------------------------------------ aba Mestre
  const freeCell = (i = 0) => {
    const m = T.state().map || {};
    const cols = m.cols || 30, rows = m.rows || 20;
    const used = new Set(api.recs('rpgk').map((t) => t.x + ',' + t.y));
    for (let n = 0; n < cols * rows; n++) {
      const x = (Math.floor(cols / 2) + i + n) % cols, y = (Math.floor(rows / 2) + Math.floor((i + n) / cols)) % rows;
      if (!used.has(x + ',' + y)) return { x, y };
    }
    return { x: 0, y: 0 };
  };
  T.addMonster = (m, count = 1, hidden = false) => {
    const same = api.recs('rpgk').filter((t) => t.npc?.src === m.n).length;
    for (let i = 0; i < count; i++) {
      const num = same + i + 1;
      const big = /gigante/i.test(m.n) ? 3 : /grande/i.test(m.n) ? 2 : 1;
      api.put({ k: 'rpgk', id: 'rpgk:' + R.rid(12), uid: '', ...freeCell(i), sz: big, side: 'e', hid: hidden, cond: [],
        npc: { n: same + count > 1 ? `${m.n} ${num}` : m.n, src: m.n, at: m.at, pv: m.pv, pvMax: m.pv, pm: m.pm, pmMax: m.pm, df: m.df, ds: m.ds || 6, rd: 0, atk: m.atk, ab: m.ab } });
    }
  };
  T.placeChar = (c) => {
    if (api.recs('rpgk').some((t) => t.cid === c.id)) return;
    api.put({ k: 'rpgk', id: 'rpgk:' + R.rid(12), uid: c.uid, cid: c.id, ...freeCell(), sz: 1, side: 'a' });
  };
  T.renderMestre = (body) => {
    const D = T.D;
    const st = T.state();
    const map = st.map || {};
    const setMap = (patch) => T.putState({ map: { ...(T.state().map || {}), ...patch } });
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async () => {
      const f = file.files[0];
      file.value = '';
      if (!f) return;
      if (f.size > 8 * 1024 * 1024) return api.toast('A imagem passa de 8 MB');
      const id = await api.addFile(f);
      setMap({ img: id });
      api.toast('Mapa trocado');
      T.renderTab();
    } });
    const scene = h('section', 'rt-sec', h('h3', null, 'Cena e mapa'),
      h('div', 'rt-row', file, btn('rt-btn primary', 'image', map.img ? 'Trocar imagem do mapa' : 'Escolher imagem do mapa', () => file.click()), map.img && btn('rt-btn ghost', 'x', 'Tirar imagem', () => { setMap({ img: '' }); T.renderTab(); })),
      h('div', 'rt-row', h('label', 'rt-f inline', h('span', null, 'Colunas'), h('input', { class: 'rt-in sm', type: 'number', min: 5, max: 80, value: map.cols || 30, onchange: (e) => setMap({ cols: R.clamp(R.int(e.target.value, 30), 5, 80) }) })),
        h('label', 'rt-f inline', h('span', null, 'Linhas'), h('input', { class: 'rt-in sm', type: 'number', min: 5, max: 80, value: map.rows || 20, onchange: (e) => setMap({ rows: R.clamp(R.int(e.target.value, 20), 5, 80) }) })),
        h('label', 'rt-check', h('input', { type: 'checkbox', checked: !map.nogrid, onchange: (e) => setMap({ nogrid: !e.target.checked }) }), 'Mostrar a grade')),
      h('p', 'muted', 'Cada quadrado vale 1,5 m. A imagem é esticada para caber na grade: ajuste colunas e linhas até os quadrados baterem com o desenho.'),
      h('div', 'rt-row', btn('rt-btn ghost', 'users', 'Colocar todos os personagens no mapa', () => { for (const c of T.chars()) if (c.d.on || T.chars().filter((x) => x.uid === c.uid).length === 1) T.placeChar(c); api.toast('Personagens no mapa'); }),
        btn('rt-btn ghost danger', 'x', 'Tirar todos os monstros', () => { if (confirm('Tirar todas as criaturas do mapa?')) for (const t of api.recs('rpgk')) if (t.npc) api.put({ k: 'rpgk', id: t.id, del: true }); })),
    );

    // bestiário
    let hidden = false;
    const mlist = h('div', 'rt-mlist');
    const drawM = () => {
      const q = norm(S.gmQ);
      const res = D.monsters.filter((m) => !q || norm(m.n).includes(q) || norm(m.g).includes(q)).slice(0, 60);
      mlist.replaceChildren(...res.map((m) => h('div', 'rt-mrow', h('button', { class: 'rt-inv-n', onclick: () => T.modal(m.n, monsterView(m)) }, h('b', null, m.n), h('small', null, `PV ${m.pv} · Def ${m.df} · ${m.atk.map((a) => `${a.n} ${a.d}`).join(', ')}`)), btn('rt-chip', 'plus', '1', () => T.addMonster(m, 1, hidden)), btn('rt-chip', 'plus', '3', () => T.addMonster(m, 3, hidden)))));
    };
    const cf = { n: '', pv: 20, df: 10, f: 3, a: 3, atk: 'Ataque', dmg: '6' };
    const cin = (key, label, props = {}) => h('label', 'rt-f inline', h('span', null, label), h('input', { class: 'rt-in ' + (props.type === 'number' ? 'sm' : ''), value: cf[key], oninput: (e) => (cf[key] = props.type === 'number' ? R.int(e.target.value) : e.target.value), ...props }));
    const best = h('section', 'rt-sec', h('h3', null, 'Monstros (Monstrum Codex)'),
      h('div', 'rt-row', h('input', { class: 'rt-in grow', placeholder: 'Buscar criatura…', value: S.gmQ, oninput: (e) => { S.gmQ = e.target.value; drawM(); } }), h('label', 'rt-check', h('input', { type: 'checkbox', onchange: (e) => (hidden = e.target.checked) }), 'Entrar escondido')),
      mlist,
      h('h4', null, 'Criatura própria'),
      h('div', 'rt-row', cin('n', 'Nome', { maxLength: 40 }), cin('pv', 'PV', { type: 'number' }), cin('df', 'Def', { type: 'number' }), cin('f', 'For', { type: 'number' }), cin('a', 'Agi', { type: 'number' })),
      h('div', 'rt-row', cin('atk', 'Ataque', { maxLength: 30 }), cin('dmg', 'Dano', { maxLength: 20, placeholder: '8 ou 1d6+2' }), btn('rt-btn primary', 'plus', 'Colocar no mapa', () => { if (!cf.n.trim()) return api.toast('Dê um nome à criatura'); T.addMonster({ n: cf.n.trim(), at: { f: cf.f, a: cf.a }, pv: Math.max(1, cf.pv), pm: 0, df: cf.df, atk: [{ n: cf.atk || 'Ataque', k: 'c', d: cf.dmg || '5', t: '' }], ab: [] }, 1, hidden); api.toast(cf.n + ' no mapa'); })),
    );
    drawM();

    // pedir teste
    const rq = { sk: 'percepcao', df: 12, hide: false };
    const req = h('section', 'rt-sec', h('h3', null, 'Pedir um teste a todos'),
      h('div', 'rt-row', h('select', { class: 'rt-sel grow', onchange: (e) => (rq.sk = e.target.value) }, h('optgroup', { label: 'Perícias' }, D.skills.map((s) => h('option', { value: s.id, selected: s.id === rq.sk }, s.n))), h('optgroup', { label: 'Atributos' }, R.AT.map((a) => h('option', { value: a.id }, a.n)))),
        h('label', 'rt-f inline', h('span', null, 'Dificuldade'), h('input', { class: 'rt-in sm', type: 'number', value: rq.df, oninput: (e) => (rq.df = R.int(e.target.value)) })),
        h('label', 'rt-check', h('input', { type: 'checkbox', onchange: (e) => (rq.hide = e.target.checked) }), 'Esconder a dificuldade')),
      h('div', 'rt-row', btn('rt-btn primary', 'dices', 'Pedir o teste', () => { T.putState({ req: { id: R.rid(8), sk: rq.sk, df: rq.df, hide: rq.hide, ts: Date.now() } }); api.toast('Pedido enviado: cada jogador vê um botão para rolar'); }), st.req && btn('rt-btn ghost', 'x', 'Cancelar pedido', () => { T.putState({ req: null }); T.renderTab(); })));

    // grupo
    const party = h('section', 'rt-sec', h('h3', null, 'Personagens da mesa'), T.chars().length ? T.chars().map((c) => {
      const onMap = api.recs('rpgk').some((t) => t.cid === c.id);
      const give = (key, label) => {
        const input = h('input', { class: 'rt-in', type: 'number', value: key === 'xp' ? 10 : 100 });
        const go = () => {
          const v = R.int(input.value);
          m.close();
          if (!v) return;
          T.putChar(c, { ...T.charById(c.id).d, [key]: Math.max(0, T.charById(c.id).d[key] + v) });
          T.note(`${c.d.name} ${v > 0 ? 'ganhou' : 'perdeu'} ${Math.abs(v)} ${label}.`, 'sys');
          T.renderTab();
        };
        const m = T.modal(`Dar ${label} para ${c.d.name}`, h('div', 'rt-wiz', h('p', 'muted', 'Use um número negativo para tirar.'), input, btn('rt-btn primary', 'check', 'Confirmar', go)));
        input.onkeydown = (e) => e.key === 'Enter' && go();
        input.focus();
      };
      const der = R.derive(c.d, D);
      return h('div', 'rt-prow',
        h('button', { class: 'rt-inv-n', onclick: () => { S.cid = c.id; T.go('ficha'); } }, h('b', null, c.d.name || 'Sem nome'), h('small', null, `${T.userName(c.uid)} · ${c.d.race} ${c.d.cls} nv. ${c.d.lv} · Esq ${der.esq} Blq ${der.blq} Det ${der.det} RD ${der.rd} · XP ${c.d.xp} · ${c.d.money} moedas`)),
        T.vital('PV', 'pv', c.d.pv, c.d.pvMax, (v) => { T.setVital({ char: T.charById(c.id) }, 'pv', v); T.renderTab(); }), T.vital('PM', 'pm', c.d.pm, c.d.pmMax, (v) => { T.setVital({ char: T.charById(c.id) }, 'pm', v); T.renderTab(); }),
        btn('rt-chip', 'sparkles', 'XP', () => give('xp', 'XP')), btn('rt-chip', 'plus', 'Moedas', () => give('money', 'moedas')),
        onMap ? h('span', 'rt-tag ok', 'no mapa') : btn('rt-chip', 'plus', 'Pôr no mapa', () => { T.placeChar(c); T.renderTab(); }));
    }) : h('div', 'rt-empty', 'Ninguém criou personagem ainda.'));
    const sess = h('section', 'rt-sec', h('h3', null, 'Sessão'), h('p', 'muted', 'As fichas, o mapa e as rolagens ficam guardados no servidor. Encerrar só esconde a mesa dos jogadores; dá para abrir de novo quando quiser.'), btn('rt-btn ghost danger', 'x', 'Encerrar a sessão de RPG', () => api.endSession()));
    body.replaceChildren(h('div', 'rt-mestre', h('div', 'rt-fcol', scene, req, sess), h('div', 'rt-fcol', best), h('div', 'rt-fcol', party)));
  };
}
