// ============================================================ amigos e DMs (como no Stoat)
// - Pedido de amizade: vai pelo grupo, assinado (ninguém pede em nome de outro). A lista fica só neste PC.
// - DM: cada conversa é uma sala P2P própria. O nome sai dos dois ids e a senha do segredo X25519 entre os
//   dois, então só os dois entram e leem. As mensagens ficam guardadas nos dois PCs e se sincronizam quando
//   os dois estão online (a que ninguém recebeu ainda espera no PC de quem mandou).
// - Grupo de DM (até 10): quem cria sorteia uma chave e manda pelas DMs de cada um.
// - Ligação na DM: só voz, 1 para 1.
import { joinRoom, selfId } from 'trystero';
import * as ident from './identity.js';

const DM_APP = 'janja-dm-v1';
const MAX_GDM = 10;
const DM_KINDS = new Set(['msg', 'rx', 'gdm']);

export function initDM(ctx) {
  const { me, store, el, icon, avatar, toast, sfx } = ctx;
  const $ = (s) => document.querySelector(s);
  const friends = store.get('friends', {}); // uid -> { id, name, color, pk, dh, state: friend|out|in, at }
  const dhOf = store.get('dhOf', {}); // uid -> chave X25519 conferida
  const gdms = store.get('gdms', {}); // gid -> { gid, key, name, members: [{ id, name, color, pk }], by }
  const unread = store.get('dmUnread', {}); // convId -> n
  const convs = new Map(); // convId -> conversa aberta (sala P2P)
  let current = null; // convId na tela
  let dhSig = '';
  let clock = 0;
  const tick = () => (clock = Math.max(Date.now(), clock + 1));
  const saveFriends = () => store.set('friends', friends);
  const saveUnread = () => store.set('dmUnread', unread);
  const sha = (s) => ident.sha256hex(s);

  // ------------------------------------------------------------ chave X25519 de cada um (vem no "hi" do grupo)
  async function start() {
    await ident.loadDhKeys(store);
    me.dh = ident.dhPublic;
    dhSig = await ident.signText(ident.dhProofText(me.id, me.dh));
    for (const f of Object.values(friends)) if (f.state !== 'in') openConv(f.id);
    for (const g of Object.values(gdms)) openGdm(g);
    renderBadge();
  }
  const hiFields = () => ({ dh: me.dh, ds: dhSig });
  /** chamado pelo app quando o "hi" de alguém do grupo foi conferido */
  async function onGroupHi(uid, u, pid) {
    if (typeof u?.dh === 'string' && typeof u?.ds === 'string' && u.dh !== dhOf[uid] && (await ident.verifyText(ident.dhProofText(uid, u.dh), u.ds, u.pk))) {
      dhOf[uid] = u.dh;
      store.set('dhOf', dhOf);
      if (friends[uid]) {
        friends[uid].dh = u.dh;
        saveFriends();
        if (friends[uid].state !== 'in') openConv(uid);
      }
    }
    // pedido que eu fiz e a pessoa não recebeu (estava offline): manda de novo
    const f = friends[uid];
    if (f?.state === 'out' && !f.sentTo?.includes(pid)) {
      (f.sentTo ||= []).push(pid);
      sendFriend('req', uid, pid);
    }
    if (f) {
      f.name = u.name || f.name;
      f.color = u.color || f.color;
    }
  }

  // ------------------------------------------------------------ pedidos de amizade (pela sala do grupo)
  async function sendFriend(t, uid, onlyPid) {
    const body = { t, from: me.id, to: uid, name: me.name, color: me.color, pk: me.pk, dh: me.dh, ds: dhSig, at: Date.now() };
    body.sig = await ident.signText(ident.canonical(body));
    const pids = onlyPid ? [onlyPid] : ctx.pidsOf(uid);
    for (const pid of pids) ctx.sendFrq(body, pid);
    return pids.length > 0;
  }
  async function onFriendMsg(d, pid) {
    if (!d || d.to !== me.id || typeof d.from !== 'string' || !['req', 'ok', 'no', 'del'].includes(d.t)) return;
    if (Math.abs(Date.now() - d.at) > 864e5) return;
    if (!(await ident.bindKey(d.from, d.pk)) || !(await ident.verifyText(ident.canonical(d), d.sig, d.pk))) return;
    if (!(await ident.verifyText(ident.dhProofText(d.from, d.dh), d.ds, d.pk))) return;
    if (ctx.pidsOf(d.from).length && !ctx.pidsOf(d.from).includes(pid)) return;
    dhOf[d.from] = d.dh;
    store.set('dhOf', dhOf);
    const f = friends[d.from];
    const info = { id: d.from, name: String(d.name || 'Anônimo').slice(0, 32), color: d.color, pk: d.pk, dh: d.dh, at: Date.now() };
    if (d.t === 'req') {
      if (f?.state === 'friend') return sendFriend('ok', d.from, pid); // já somos: só confirma
      if (f?.state === 'out') {
        // os dois pediram: viram amigos
        friends[d.from] = { ...info, state: 'friend' };
        sendFriend('ok', d.from, pid);
        toast(`Você e ${info.name} agora são amigos`);
        openConv(d.from);
      } else {
        friends[d.from] = { ...info, state: 'in' };
        toast(`${info.name} quer ser seu amigo. Veja em Amigos.`);
        sfx.msg();
      }
    } else if (d.t === 'ok' && f && f.state !== 'in') {
      friends[d.from] = { ...info, state: 'friend' };
      if (f.state === 'out') toast(`${info.name} aceitou seu pedido de amizade`);
      openConv(d.from);
    } else if (d.t === 'no' || d.t === 'del') {
      if (!f) return;
      delete friends[d.from];
      closeConv('u:' + d.from);
    }
    saveFriends();
    renderAll();
  }
  async function addFriend(user) {
    const f = friends[user.id];
    if (f?.state === 'in') return accept(user.id);
    if (f) return;
    if (!dhOf[user.id]) return toast(`${user.name} precisa atualizar o janjahaters para ter amigos`);
    friends[user.id] = { id: user.id, name: user.name, color: user.color, pk: ctx.keyOf(user.id), dh: dhOf[user.id], state: 'out', at: Date.now(), sentTo: [] };
    saveFriends();
    const sent = await sendFriend('req', user.id);
    friends[user.id].sentTo = ctx.pidsOf(user.id);
    saveFriends();
    openConv(user.id); // a sala fica esperando: quando a pessoa aceitar, conecta
    toast(sent ? `Pedido de amizade enviado para ${user.name}` : `${user.name} está offline: o pedido vai quando entrar`);
    renderAll();
  }
  function accept(uid) {
    const f = friends[uid];
    if (!f) return;
    f.state = 'friend';
    saveFriends();
    sendFriend('ok', uid);
    openConv(uid);
    renderAll();
  }
  function removeFriend(uid, t = 'del') {
    if (!friends[uid]) return;
    sendFriend(t, uid);
    delete friends[uid];
    saveFriends();
    closeConv('u:' + uid);
    if (current === 'u:' + uid) current = null;
    renderAll();
  }

  // ------------------------------------------------------------ conversas (salas P2P)
  async function openConv(uid) {
    const f = friends[uid];
    const id = 'u:' + uid;
    if (!f?.dh || !f.pk || convs.has(id)) return convs.get(id);
    const roomId = (await sha('janja-dm:' + [me.id, uid].sort().join(':'))).slice(0, 40);
    if (convs.has(id)) return convs.get(id);
    const password = await ident.sharedSecret(f.dh, 'dm:' + roomId);
    return connect({ id, kind: 'dm', roomId, password, members: new Map([[me.id, me.pk], [uid, f.pk]]) });
  }
  async function openGdm(g) {
    const id = 'g:' + g.gid;
    if (convs.has(id)) return convs.get(id);
    const roomId = (await sha('janja-gdm:' + g.key)).slice(0, 40);
    return connect({ id, kind: 'gdm', roomId, password: g.key, members: new Map(g.members.map((m) => [m.id, m.pk])) });
  }
  function closeConv(id) {
    const c = convs.get(id);
    if (!c) return;
    if (call?.conv === c) endCall(true);
    c.room.leave();
    convs.delete(id);
  }
  function connect(c) {
    c.recs = new Map(store.get('dm:' + c.roomId, []).map((r) => [r.id, r]));
    for (const r of c.recs.values()) clock = Math.max(clock, r.v || 0);
    c.peers = new Map(); // pid -> uid conferido
    c.typing = new Map();
    c.room = joinRoom({ appId: DM_APP, password: c.password, turnConfig: ctx.turnServers }, c.roomId);
    const A = (c.A = {});
    for (const n of ['hi', 'sum', 'recs', 'ring', 'typ']) A[n] = c.room.makeAction(n);
    c.room.onPeerJoin = async (pid) => {
      A.hi.send({ uid: me.id, name: me.name, color: me.color, sig: await ident.signText(`janja-dmhi:${me.id}:${selfId}:${c.roomId}`) }, { target: pid });
    };
    c.room.onPeerLeave = (pid) => {
      const uid = c.peers.get(pid);
      c.peers.delete(pid);
      if (call?.conv === c && call.pid === pid) endCall(true);
      if (uid) renderAll();
    };
    A.hi.onMessage = async (d, { peerId }) => {
      const pk = c.members.get(d?.uid);
      if (!pk || d.uid === me.id || !(await ident.verifyText(`janja-dmhi:${d.uid}:${peerId}:${c.roomId}`, d.sig, pk))) return;
      c.peers.set(peerId, d.uid);
      // o outro está nesta sala: então aceitou (para quem pediu e estava offline na hora)
      const f = friends[d.uid];
      if (c.kind === 'dm' && f?.state === 'out') {
        f.state = 'friend';
        saveFriends();
        toast(`${f.name} aceitou seu pedido de amizade`);
      }
      if (f && d.name) f.name = String(d.name).slice(0, 32);
      A.sum.send([...c.recs.values()].map((r) => [r.id, r.v]), { target: peerId });
      renderAll();
    };
    A.sum.onMessage = (sum, { peerId }) => {
      if (!c.peers.has(peerId) || !Array.isArray(sum)) return;
      const theirs = new Map(sum.filter((x) => Array.isArray(x)));
      const out = [...c.recs.values()].filter((r) => !(theirs.get(r.id) >= r.v));
      for (let i = 0; i < out.length; i += 200) A.recs.send(out.slice(i, i + 200), { target: peerId });
    };
    A.recs.onMessage = async (list, { peerId }) => {
      if (!c.peers.has(peerId) || !Array.isArray(list)) return;
      const ok = [];
      for (const r of list.slice(0, 200)) if (await validRemote(c, r)) ok.push(r);
      if (ok.length) merge(c, ok);
    };
    A.typ.onMessage = (d, { peerId }) => {
      const uid = c.peers.get(peerId);
      if (!uid) return;
      c.typing.set(uid, Date.now() + 4000);
      if (current === c.id) renderTyping();
    };
    A.ring.onMessage = (d, { peerId }) => onRing(c, d, peerId);
    c.room.onPeerStream = (stream, pid) => onCallStream(c, stream, pid);
    convs.set(c.id, c);
    return c;
  }
  async function validRemote(c, r) {
    if (!r || typeof r !== 'object' || !DM_KINDS.has(r.k) || typeof r.id !== 'string' || r.id.length > 80 || !Number.isFinite(r.v)) return false;
    if (JSON.stringify(r).length > 8000) return false;
    const pk = c.members.get(r.by);
    if (!pk || r.pk !== pk || !(await ident.verifyRecord(r))) return false;
    if (r.k !== 'gdm' && r.uid !== r.by) return false;
    const cur = c.recs.get(r.id);
    return !cur || cur.by === r.by; // só o autor muda o que escreveu
  }
  function merge(c, list) {
    let fresh = [];
    for (const r of list) {
      const cur = c.recs.get(r.id);
      if (cur && !(r.v > cur.v || (r.v === cur.v && String(r.by) > String(cur.by)))) continue;
      c.recs.set(r.id, r);
      clock = Math.max(clock, r.v);
      if (!cur && r.k === 'msg' && r.uid !== me.id && !r.del) fresh.push(r);
      if (r.k === 'gdm' && r.by !== me.id) onGdmInvite(r);
    }
    // guarda as últimas 3000
    const keep = [...c.recs.values()].sort((a, b) => a.v - b.v).slice(-3000);
    store.set('dm:' + c.roomId, keep);
    if (fresh.length) {
      if (current !== c.id || !$('#dmDlg').open || !document.hasFocus()) {
        unread[c.id] = (unread[c.id] || 0) + fresh.length;
        saveUnread();
        const m = fresh[fresh.length - 1];
        if (ctx.myStatus() !== 'dnd') {
          sfx.msg();
          window.desk?.flash();
          if (!$('#dmDlg').open) toast(`${m.name}: ${String(m.text || '').slice(0, 60)}`);
        }
      }
      for (const m of fresh) c.typing.delete(m.uid);
    }
    if (current === c.id) renderMessages();
    renderList();
    renderBadge();
  }
  async function put(c, rec) {
    rec.v = Math.max(tick(), (c.recs.get(rec.id)?.v || 0) + 1);
    rec.by = me.id;
    rec.pk = me.pk;
    delete rec.sig;
    await ident.signRecord(rec);
    merge(c, [rec]);
    c.A.recs.send([rec]);
  }

  // ------------------------------------------------------------ grupos de DM
  async function createGdm(uids, name) {
    const members = [{ id: me.id, name: me.name, color: me.color, pk: me.pk }];
    for (const uid of uids.slice(0, MAX_GDM - 1)) {
      const f = friends[uid];
      if (f?.state === 'friend') members.push({ id: f.id, name: f.name, color: f.color, pk: f.pk });
    }
    if (members.length < 3) return toast('Escolha pelo menos 2 amigos');
    const g = { gid: ctx.randId(8), key: ctx.randId(16), name: (name || members.slice(1).map((m) => m.name).join(', ')).slice(0, 40), members, by: me.id };
    gdms[g.gid] = g;
    store.set('gdms', gdms);
    // o convite vai pela DM de cada um (que só os dois leem)
    for (const m of members.slice(1)) {
      const c = await openConv(m.id);
      if (c) put(c, { k: 'gdm', id: 'gdm:' + g.gid, ...g });
    }
    await openGdm(g);
    select('g:' + g.gid);
  }
  function onGdmInvite(r) {
    if (!Array.isArray(r.members) || !r.members.some((m) => m.id === me.id) || r.members.length > MAX_GDM || typeof r.key !== 'string') return;
    if (r.del) {
      if (gdms[r.gid]) {
        delete gdms[r.gid];
        store.set('gdms', gdms);
        closeConv('g:' + r.gid);
      }
      return;
    }
    if (gdms[r.gid]) return;
    gdms[r.gid] = { gid: r.gid, key: r.key, name: String(r.name || 'Grupo').slice(0, 40), members: r.members.map((m) => ({ id: m.id, name: String(m.name).slice(0, 32), color: m.color, pk: m.pk })), by: r.by };
    store.set('gdms', gdms);
    openGdm(gdms[r.gid]);
    toast(`Você entrou no grupo de DM "${gdms[r.gid].name}"`);
  }
  function leaveGdm(gid) {
    if (!confirm('Sair deste grupo de DM? As mensagens somem deste PC.')) return;
    const c = convs.get('g:' + gid);
    closeConv('g:' + gid);
    delete gdms[gid];
    store.set('gdms', gdms);
    if (c) store.del?.('dm:' + c.roomId);
    current = null;
    renderAll();
  }

  // ------------------------------------------------------------ ligação na DM (voz, 1 para 1)
  let call = null; // { conv, pid, state: out|in|on, mic, audio }
  async function startCall(c) {
    if (call) return toast('Você já está numa ligação');
    const pid = [...c.peers.keys()][0];
    if (!pid) return toast('A pessoa não está online agora');
    call = { conv: c, pid, state: 'out' };
    c.A.ring.send({ t: 'call' }, { target: pid });
    call.timer = setTimeout(() => call?.state === 'out' && (toast('Ninguém atendeu'), endCall()), 30_000);
    renderHead();
  }
  async function onRing(c, d, pid) {
    if (!c.peers.has(pid)) return;
    if (d?.t === 'call') {
      if (call) return c.A.ring.send({ t: 'busy' }, { target: pid });
      call = { conv: c, pid, state: 'in' };
      sfx.poke();
      window.desk?.flash();
      const who = friends[c.peers.get(pid)]?.name || 'Alguém';
      toast(`${who} está te ligando`);
      open(c.id);
      call.timer = setTimeout(() => call?.state === 'in' && endCall(true), 30_000);
    } else if (!call || call.conv !== c) return;
    else if (d?.t === 'accept' && call.state === 'out') await goLive();
    else if (d?.t === 'busy') {
      toast('A pessoa está em outra ligação');
      endCall(true);
    } else if (d?.t === 'end') endCall(true);
    renderHead();
  }
  async function goLive() {
    clearTimeout(call.timer);
    try {
      call.mic = await ctx.getMic();
    } catch {
      toast('Sem microfone: você só vai ouvir');
    }
    if (!call) return call?.mic?.stop?.();
    if (call.mic) call.conv.room.addStream(call.mic.stream, call.pid);
    call.state = 'on';
    call.since = Date.now();
    sfx.join();
    renderHead();
  }
  async function acceptCall() {
    if (call?.state !== 'in') return;
    call.conv.A.ring.send({ t: 'accept' }, { target: call.pid });
    await goLive();
  }
  function endCall(remote) {
    if (!call) return;
    clearTimeout(call.timer);
    if (!remote) call.conv.A.ring.send({ t: 'end' }, { target: call.pid });
    if (call.mic) {
      try {
        call.conv.room.removeStream(call.mic.stream, call.pid);
      } catch {}
      call.mic.stop?.();
    }
    call.audio?.remove();
    if (call.state === 'on') sfx.leave();
    call = null;
    renderHead();
  }
  function onCallStream(c, stream, pid) {
    if (call?.conv !== c || call.pid !== pid) return;
    call.audio?.remove();
    const a = el('audio');
    a.autoplay = true;
    a.srcObject = stream;
    if (ctx.speaker?.()) a.setSinkId?.(ctx.speaker()).catch(() => {});
    document.body.append(a);
    call.audio = a;
  }
  function toggleMute() {
    if (!call?.mic) return;
    call.muted = !call.muted;
    call.mic.stream.getAudioTracks().forEach((t) => (t.enabled = !call.muted));
    renderHead();
  }

  // ------------------------------------------------------------ interface
  const convName = (id) => (id.startsWith('u:') ? friends[id.slice(2)]?.name || 'Amigo' : gdms[id.slice(2)]?.name || 'Grupo');
  const online = (id) => [...(convs.get(id)?.peers.values() || [])].length > 0;
  function renderBadge() {
    const n = Object.values(unread).reduce((a, b) => a + b, 0) + Object.values(friends).filter((f) => f.state === 'in').length;
    for (const b of document.querySelectorAll('[data-friends-badge]')) {
      b.hidden = !n;
      b.textContent = n > 9 ? '9+' : n;
    }
  }
  function renderList() {
    const box = $('#dmList');
    if (!box) return;
    const parts = [];
    const reqs = Object.values(friends).filter((f) => f.state === 'in');
    if (reqs.length) {
      parts.push(el('div', 'dm-sec', `Pedidos de amizade — ${reqs.length}`));
      for (const f of reqs) {
        const row = el('div', 'dm-row req');
        row.append(avatar(f.name, f.color, 'sm', f.id), el('span', 'dm-name', f.name));
        const ok = el('button', 'icon-btn sm ok');
        ok.title = 'Aceitar';
        ok.append(icon('check'));
        ok.onclick = () => accept(f.id);
        const no = el('button', 'icon-btn sm');
        no.title = 'Recusar';
        no.append(icon('x'));
        no.onclick = () => removeFriend(f.id, 'no');
        row.append(ok, no);
        parts.push(row);
      }
    }
    const rows = [
      ...Object.values(friends).filter((f) => f.state !== 'in').map((f) => ({ id: 'u:' + f.id, name: f.name, color: f.color, uid: f.id, pending: f.state === 'out' })),
      ...Object.values(gdms).map((g) => ({ id: 'g:' + g.gid, name: g.name, color: '#7c5cff', group: g.members.length })),
    ];
    const last = (id) => {
      const c = convs.get(id);
      return c ? Math.max(0, ...[...c.recs.values()].filter((r) => r.k === 'msg').map((r) => r.ts || 0)) : 0;
    };
    rows.sort((a, b) => last(b.id) - last(a.id) || a.name.localeCompare(b.name));
    parts.push(el('div', 'dm-sec', 'Conversas'));
    if (!rows.length) parts.push(el('p', 'muted small dm-empty', 'Nenhum amigo ainda. Clique em alguém do grupo e em "Adicionar amigo".'));
    for (const r of rows) {
      const row = el('button', 'dm-row' + (r.id === current ? ' active' : ''));
      row.type = 'button';
      const av = r.group ? el('span', 'avatar sm dm-gav') : avatar(r.name, r.color, 'sm', r.uid);
      if (r.group) av.append(icon('users'));
      av.classList.toggle('on', online(r.id));
      const txt = el('span', 'dm-name', r.name);
      row.append(av, txt);
      if (r.pending) row.append(el('span', 'muted small', 'pedido enviado'));
      else if (r.group) row.append(el('span', 'muted small', `${r.group} pessoas`));
      if (unread[r.id]) row.append(el('b', 'dm-unread', unread[r.id] > 9 ? '9+' : unread[r.id]));
      row.onclick = () => select(r.id);
      parts.push(row);
    }
    box.replaceChildren(...parts);
  }
  function renderHead() {
    const head = $('#dmHead');
    if (!head) return;
    if (!current) return head.replaceChildren(el('span', 'muted', 'Escolha uma conversa'));
    const c = convs.get(current);
    const isDm = current.startsWith('u:');
    const parts = [el('b', 'dm-title', convName(current))];
    const f = isDm && friends[current.slice(2)];
    parts.push(el('span', 'muted small', f?.state === 'out' ? 'esperando aceitar o pedido' : online(current) ? 'online' : 'offline: as mensagens chegam quando entrar'));
    parts.push(el('span', 'grow'));
    if (isDm && f?.state === 'friend') {
      if (call?.conv === c) {
        if (call.state === 'in') {
          const a = el('button', 'primary sm');
          a.append(icon('phone', 'sm'), document.createTextNode('Atender'));
          a.onclick = acceptCall;
          parts.push(a);
        } else {
          parts.push(el('span', 'dm-callst', call.state === 'out' ? 'Chamando…' : 'Em ligação'));
          if (call.state === 'on') {
            const m = el('button', 'icon-btn' + (call.muted ? ' on' : ''));
            m.title = call.muted ? 'Ativar microfone' : 'Silenciar';
            m.append(icon(call.muted ? 'mic-off' : 'mic'));
            m.onclick = toggleMute;
            parts.push(m);
          }
        }
        const h = el('button', 'icon-btn danger');
        h.title = 'Desligar';
        h.append(icon('phone-off'));
        h.onclick = () => endCall();
        parts.push(h);
      } else {
        const ph = el('button', 'icon-btn');
        ph.title = 'Ligar';
        ph.append(icon('phone'));
        ph.onclick = () => startCall(c);
        parts.push(ph);
      }
    }
    const more = el('button', 'icon-btn');
    more.title = isDm ? 'Desfazer amizade' : 'Sair do grupo de DM';
    more.append(icon(isDm ? 'user-minus' : 'log-out'));
    more.onclick = () => (isDm ? confirm(`Desfazer a amizade com ${convName(current)}?`) && removeFriend(current.slice(2)) : leaveGdm(current.slice(2)));
    parts.push(more);
    head.replaceChildren(...parts);
  }
  function renderMessages() {
    const box = $('#dmMsgs');
    if (!box) return;
    const c = current && convs.get(current);
    if (!c) return box.replaceChildren(el('div', 'dm-hello', current ? 'Conectando…' : 'Suas conversas privadas ficam aqui. Só você e a outra pessoa conseguem ler.'));
    const msgs = [...c.recs.values()].filter((r) => r.k === 'msg' && !r.del).sort((a, b) => a.ts - b.ts);
    const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    const out = [];
    let prev = null;
    for (const m of msgs) {
      const grouped = prev && prev.uid === m.uid && m.ts - prev.ts < 5 * 60_000;
      const d = el('div', 'msg dm-msg' + (grouped ? ' grouped' : '') + (m.uid === me.id ? ' mine' : ''));
      d.dataset.id = m.id;
      if (!grouped) d.append(avatar(m.name, m.color, '', m.uid));
      const body = el('div');
      if (!grouped) {
        const head = el('div', 'head');
        head.append(ctx.nameEl(m.name, m.color, m.uid, 'author'), el('time', '', new Date(m.ts).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })));
        body.append(head);
      }
      const t = el('div', 'text');
      t.innerHTML = ctx.format(m.text || '');
      if (m.edited) t.append(el('span', 'edited', '(editado)'));
      body.append(t);
      if (m.uid === me.id) {
        const del = el('button', 'icon-btn sm dm-del');
        del.title = 'Apagar';
        del.append(icon('trash-2'));
        del.onclick = () => confirm('Apagar a mensagem para os dois?') && put(c, { ...m, del: true, text: '' });
        d.append(del);
      }
      d.append(body);
      out.push(d);
      prev = m;
    }
    if (!msgs.length) out.push(el('div', 'dm-hello', 'Comece a conversa. Só quem está nesta conversa consegue ler.'));
    box.replaceChildren(...out);
    ctx.hydrateEmojis?.(box);
    if (stick || !box.dataset.seen) box.scrollTop = box.scrollHeight;
    box.dataset.seen = '1';
    renderTyping();
  }
  function renderTyping() {
    const t = $('#dmTyping');
    const c = current && convs.get(current);
    if (!t || !c) return;
    const now = Date.now();
    const who = [...c.typing].filter(([, until]) => until > now).map(([uid]) => friends[uid]?.name || gdms[current.slice(2)]?.members.find((m) => m.id === uid)?.name || 'Alguém');
    t.textContent = who.length ? `${who.join(', ')} está digitando…` : '';
  }
  setInterval(() => current && renderTyping(), 2000);
  function renderAll() {
    renderList();
    renderHead();
    renderMessages();
    renderBadge();
  }
  function select(id) {
    current = id;
    delete unread[id];
    saveUnread();
    const box = $('#dmMsgs');
    if (box) delete box.dataset.seen;
    renderAll();
    const input = $('#dmInput');
    const f = id.startsWith('u:') && friends[id.slice(2)];
    input.disabled = !!f && f.state !== 'friend';
    input.placeholder = input.disabled ? 'Esperando aceitar o pedido de amizade' : `Mensagem para ${convName(id)}`;
    input.focus();
    document.querySelector('#dmDlg').classList.add('has-conv');
  }
  function open(id) {
    const dlg = $('#dmDlg');
    const pop = $('#popover');
    if (pop) pop.hidden = true; // o cartão de perfil (de onde veio o clique) sai da frente
    if (!dlg.open) ctx.openDialog(dlg);
    if (id) select(id);
    else renderAll();
  }
  // enviar
  $('#dmForm').onsubmit = (e) => {
    e.preventDefault();
    const input = $('#dmInput');
    const text = input.value.trim();
    const c = current && convs.get(current);
    if (!text || !c || input.disabled) return;
    input.value = '';
    put(c, { k: 'msg', id: 'd:' + ctx.randId(), uid: me.id, name: me.name, color: me.color, text: text.slice(0, 2000), ts: Date.now() });
  };
  let lastTyp = 0;
  $('#dmInput').oninput = () => {
    const c = current && convs.get(current);
    if (c && Date.now() - lastTyp > 3000) {
      lastTyp = Date.now();
      c.A.typ.send({});
    }
  };
  $('#dmBack').onclick = () => document.querySelector('#dmDlg').classList.remove('has-conv');
  $('#dmNewGroup').onclick = () => {
    const list = Object.values(friends).filter((f) => f.state === 'friend');
    if (list.length < 2) return toast('Você precisa de pelo menos 2 amigos para criar um grupo');
    const box = $('#dmMsgs');
    current = null;
    renderHead();
    const form = el('form', 'dm-newgroup');
    form.append(el('h3', '', 'Novo grupo de DM'), el('p', 'muted small', `Até ${MAX_GDM} pessoas, contando você.`));
    const name = el('input');
    name.placeholder = 'Nome do grupo (opcional)';
    name.maxLength = 40;
    form.append(name);
    for (const f of list) {
      const l = el('label', 'check');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.value = f.id;
      l.append(cb, avatar(f.name, f.color, 'sm', f.id), document.createTextNode(' ' + f.name));
      form.append(l);
    }
    const go = el('button', 'primary', 'Criar grupo');
    form.append(go);
    form.onsubmit = (e) => {
      e.preventDefault();
      const ids = [...form.querySelectorAll('input:checked')].map((x) => x.value);
      if (ids.length + 1 > MAX_GDM) return toast(`No máximo ${MAX_GDM} pessoas`);
      createGdm(ids, name.value.trim());
    };
    box.replaceChildren(form);
  };

  /** botões no cartão de perfil de alguém do grupo */
  function profileButtons(user) {
    if (!user?.id || user.id === me.id || user.bot) return null;
    const f = friends[user.id];
    const b = el('button', 'ghost sm');
    b.type = 'button';
    if (f?.state === 'friend') {
      b.append(icon('message-square', 'sm'), document.createTextNode('Mensagem'));
      b.onclick = () => open('u:' + user.id);
    } else if (f?.state === 'out') {
      b.append(icon('check', 'sm'), document.createTextNode('Pedido enviado'));
      b.disabled = true;
    } else if (f?.state === 'in') {
      b.append(icon('user-plus', 'sm'), document.createTextNode('Aceitar amizade'));
      b.onclick = () => accept(user.id);
    } else {
      b.append(icon('user-plus', 'sm'), document.createTextNode('Adicionar amigo'));
      b.onclick = () => addFriend(user);
    }
    return b;
  }

  return { start, hiFields, onGroupHi, onFriendMsg, open, profileButtons, dhOf: (uid) => dhOf[uid] || null, friends, convs, renderBadge };
}
