// O lado janjahaters do gateway: entra na sala P2P do grupo (igual ao app), assina o que escreve e
// mantém os registros sincronizados com os amigos. Não toca áudio nem guarda arquivos.
import { EventEmitter } from 'node:events';
import { createHash, randomBytes } from 'node:crypto';
import { joinRoom, selfId } from 'trystero';
import { RTCPeerConnection } from 'node-datachannel/polyfill';
import * as ident from './identity.js';

export const APP_ID = 'toca-voice-p2p-v2';
const KINDS = new Set(['grp', 'ch', 'msg', 'q', 'pb', 'snd', 'rx', 'emo', 'pin', 'cat', 'role', 'mem', 'ban']);
const AUTHORED = new Set(['msg', 'rx', 'pin']);
const SIGNED_SINCE = Date.UTC(2026, 10, 8, 12);

// permissões (mesmos números do app)
export const P = {
  ManageChannel: 1, ManageServer: 2, ManagePermissions: 4, ManageRole: 8, ManageCustomisation: 16, KickMembers: 32,
  BanMembers: 64, ManageMessages: 128, SendMessage: 256, React: 512, Connect: 1024, Speak: 2048, Video: 4096,
  Stream: 8192, MuteMembers: 16384, MoveMembers: 32768,
};
const ALL_PERMS = Object.values(P).reduce((a, b) => a | b, 0);
const EVERYONE_DEFAULT = P.SendMessage | P.React | P.Connect | P.Speak | P.Video | P.Stream | P.ManageChannel | P.ManageCustomisation | P.MoveMembers;

export const randId = (n = 8) => randomBytes(n).toString('hex');
export const parseCode = (s) => {
  const k = String(s || '').toUpperCase().replace(/^\s*(JANJA|TOCA)/, '').replace(/[^A-Z0-9]/g, '');
  return k.length >= 16 ? k : null;
};
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const roomHash = (key) => sha256('toca-room:' + key).slice(0, 40);

export class Janja extends EventEmitter {
  /** @param {{ key: string, name: string, color?: string, store: { get(k, d), set(k, v) }, turn?: any[] }} o */
  constructor(o) {
    super();
    this.o = o;
    this.store = o.store;
    this.hash = o.hash || roomHash(o.key);
    this.recs = new Map();
    this.clock = 0;
    this.peers = new Map(); // pid -> { user, seen }
    this.rejected = 0;
  }

  async start() {
    ident.initBindings(this.store);
    await ident.loadKeys(this.store);
    const pk = ident.publicKey;
    this.me = { id: await ident.idFromKey(pk), name: this.o.name, color: this.o.color || '#7c5cff', pk };
    await ident.bindKey(this.me.id, pk);
    this.hiSig = await ident.signText(`janja-hi:${this.me.id}:${selfId}`);
    for (const r of this.store.get('recs:' + this.hash, [])) if (this.valid(r)) this.recs.set(r.id, r);
    for (const r of this.recs.values()) this.clock = Math.max(this.clock, r.v);
    this.connect();
    return this.me;
  }

  connect() {
    const room = (this.room = joinRoom({ appId: APP_ID, password: this.o.key, rtcPolyfill: RTCPeerConnection, ...(this.o.turn?.length ? { turnConfig: this.o.turn } : {}) }, this.hash, {
      onJoinError: (d) => console.warn('[janja] falha ao conectar com um amigo', d?.error || d),
    }));
    const A = (this.A = {});
    for (const n of ['hi', 'sum', 'recs', 'typing', 'freq', 'fdat']) A[n] = room.makeAction(n);
    room.onPeerJoin = (pid) => {
      if (process.env.JANJA_DEBUG) console.log('[janja] peer', pid);
      this.peers.set(pid, { user: null });
      A.hi.send(this.hiPayload(), { target: pid });
      A.sum.send([...this.recs.values()].map((r) => [r.id, r.v]), { target: pid });
    };
    room.onPeerLeave = (pid) => {
      const p = this.peers.get(pid);
      this.peers.delete(pid);
      if (p?.user && !this.online(p.user.id)) this.emit('presence', p.user.id, false);
    };
    A.hi.onMessage = (d, { peerId }) => this.onHi(peerId, d);
    A.sum.onMessage = (sum, { peerId }) => {
      if (!Array.isArray(sum)) return;
      const theirs = new Map(sum.filter((x) => Array.isArray(x)));
      const out = [...this.recs.values()].filter((r) => !(theirs.get(r.id) >= r.v));
      for (let i = 0; i < out.length; i += 300) A.recs.send(out.slice(i, i + 300), { target: peerId });
    };
    A.recs.onMessage = (list) => Array.isArray(list) && this.acceptRemote(list.slice(0, 300)).then((ok) => ok.length && this.merge(ok));
    A.typing.onMessage = (d, { peerId }) => {
      const u = this.peers.get(peerId)?.user;
      if (u && typeof d?.ch === 'string') this.emit('typing', u.id, d.ch);
    };
    // o gateway não guarda arquivos: responde logo "não tenho" para ninguém ficar esperando
    A.freq.onMessage = (d, { peerId }) => typeof d?.id === 'string' && A.fdat.send(new Uint8Array(0), { target: peerId, metadata: { id: d.id, miss: true } });
    A.fdat.onMessage = () => {};
    // o "hi" de tempos em tempos (o app considera ausente quem some)
    clearInterval(this.hiTimer);
    this.hiTimer = setInterval(() => A.hi.send(this.hiPayload()), 60_000);
  }

  hiPayload() {
    return { user: { id: this.me.id, name: this.me.name, color: this.me.color, st: 'online', pk: this.me.pk, hs: this.hiSig, bot: true }, voice: null };
  }

  async onHi(pid, d) {
    const u = d?.user;
    if (!u || typeof u.id !== 'string') return;
    const id = u.id.slice(0, 64);
    // confere se quem diz ser fulano tem a chave de fulano
    const ok = typeof u.pk === 'string' && (await ident.bindKey(id, u.pk)) && (await ident.verifyText(`janja-hi:${id}:${pid}`, u.hs, u.pk));
    if (!ok && ident.keyOf(id)) return; // impostor
    const p = this.peers.get(pid) || {};
    const was = this.online(id);
    p.user = { id, name: String(u.name || 'Anônimo').slice(0, 32), color: typeof u.color === 'string' ? u.color : '', st: u.st || 'online', bot: !!u.bot, verified: ok };
    this.peers.set(pid, p);
    const known = this.store.get('users', {});
    const firstTime = !known[id];
    known[id] = { name: p.user.name, color: p.user.color, bot: p.user.bot, seen: Date.now(), first: known[id]?.first || Date.now() };
    this.store.set('users', known);
    if (firstTime) this.emit('join', id);
    if (!was) this.emit('presence', id, true);
    else this.emit('user', id);
  }

  online(uid) {
    for (const p of this.peers.values()) if (p.user?.id === uid) return true;
    return false;
  }
  /** todo mundo que já apareceu (pelo "hi" ou por ter escrito algo) */
  users() {
    const out = new Map();
    const known = this.store.get('users', {});
    for (const [id, u] of Object.entries(known)) out.set(id, { id, ...u });
    for (const m of this.all('msg')) if (!out.has(m.uid) && !m.bot) out.set(m.uid, { id: m.uid, name: m.name, color: m.color });
    for (const p of this.peers.values()) if (p.user) out.set(p.user.id, { ...out.get(p.user.id), ...p.user });
    out.set(this.me.id, { id: this.me.id, name: this.me.name, color: this.me.color, bot: true });
    return out;
  }

  // ---------------------------------------------------------------- registros
  valid(r) {
    if (!r || typeof r !== 'object' || !KINDS.has(r.k) || typeof r.id !== 'string' || r.id.length > 80 || !Number.isFinite(r.v)) return false;
    return JSON.stringify(r).length < 8000;
  }
  get(id) {
    const r = this.recs.get(id);
    return r && !r.del ? r : null;
  }
  all(k) {
    return [...this.recs.values()].filter((r) => r.k === k && !r.del);
  }
  tick() {
    return (this.clock = Math.max(Date.now(), this.clock + 1));
  }

  async acceptRemote(list) {
    const out = [];
    await Promise.all(
      list.map(async (r) => {
        if (!this.valid(r)) return;
        if (!r.sig) return r.v < SIGNED_SINCE ? out.push(r) : this.rejected++;
        if (typeof r.by !== 'string' || !(await ident.bindKey(r.by, r.pk)) || !(await ident.verifyRecord(r))) return this.rejected++;
        if (AUTHORED.has(r.k) && r.uid && r.uid !== r.by && !(r.k === 'msg' && r.del)) return this.rejected++;
        out.push(r);
      }),
    );
    return out;
  }

  merge(list) {
    const changed = [];
    for (const r of list) {
      const cur = this.recs.get(r.id);
      if (cur && !(r.v > cur.v || (r.v === cur.v && String(r.by) > String(cur.by)))) continue;
      if (cur?.k === 'msg' && cur.uid !== r.uid) continue;
      if (r.by && !this.permitted(r, cur)) {
        this.rejected++;
        continue;
      }
      this.recs.set(r.id, r);
      this.clock = Math.max(this.clock, r.v);
      changed.push([r, cur]);
    }
    if (!changed.length) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.store.set('recs:' + this.hash, [...this.recs.values()]), 500);
    for (const [r, cur] of changed) this.emit('rec', r, cur);
  }

  /** escreve (assinado) e manda para todo mundo; devolve o registro ou null se não tinha permissão */
  async put(rec) {
    rec.v = Math.max(this.tick(), (this.recs.get(rec.id)?.v || 0) + 1);
    rec.by = this.me.id;
    rec.pk = this.me.pk;
    delete rec.sig;
    if (!this.permitted(rec, this.recs.get(rec.id))) return null;
    await ident.signRecord(rec);
    this.merge([rec]);
    if (this.recs.get(rec.id) !== rec) return null;
    this.A.recs.send([rec]);
    return rec;
  }
  typing(ch) {
    this.A?.typing.send({ ch });
  }

  // ---------------------------------------------------------------- cargos e permissões (igual ao app)
  owner() {
    return this.recs.get('grp')?.owner || null;
  }
  everyonePerms() {
    const p = this.recs.get('grp')?.perms;
    return Number.isInteger(p) ? p : EVERYONE_DEFAULT;
  }
  roleList() {
    return this.all('role').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  rolesOf(uid) {
    const m = this.recs.get('mem:' + uid);
    const ids = new Set(m && !m.del && Array.isArray(m.roles) ? m.roles : []);
    return this.roleList().filter((r) => ids.has(r.id));
  }
  banOf(uid) {
    const b = this.recs.get('ban:' + uid);
    return b && !b.del && (!b.until || b.until > Date.now()) ? b : null;
  }
  permsOf(uid) {
    const owner = this.owner();
    if (!owner || uid === owner) return ALL_PERMS;
    if (this.banOf(uid)) return 0;
    let p = this.everyonePerms();
    for (const r of this.rolesOf(uid)) p |= r.perms | 0;
    return p;
  }
  can(uid, perm) {
    return (this.permsOf(uid) & perm) === perm;
  }
  rankOf(uid) {
    return uid === this.owner() ? -1 : Math.min(Infinity, ...this.rolesOf(uid).map((r) => r.order ?? 0));
  }
  outranks(a, b) {
    return this.rankOf(a) < this.rankOf(b);
  }
  permitted(r, cur) {
    const by = r.by;
    const can = (p) => this.can(by, p);
    if (r.k === 'grp') {
      const before = cur?.owner || null;
      const after = r.owner || null;
      if (before !== after) return before ? by === before : by === after; // a regra de quem pode reivindicar fica no app
      if (!before) return true;
      const pc = (Number.isInteger(cur?.perms) ? cur.perms : EVERYONE_DEFAULT) !== (Number.isInteger(r.perms) ? r.perms : EVERYONE_DEFAULT);
      return can(pc ? P.ManagePermissions : P.ManageServer);
    }
    if (!this.owner()) return true;
    if (this.banOf(by)) return false;
    switch (r.k) {
      case 'ch':
      case 'cat':
        return can(P.ManageChannel);
      case 'emo':
        return can(P.ManageCustomisation) || (!!r.del && cur?.by === by);
      case 'pin':
        return can(P.ManageMessages);
      case 'rx':
        return !!r.del || can(P.React);
      case 'msg':
        if (!cur) return r.del || can(P.SendMessage);
        if (by === cur.uid) return true;
        return !!r.del && can(P.ManageMessages) && this.outranks(by, cur.uid);
      case 'role': {
        if (!can(P.ManageRole)) return false;
        if (by === this.owner()) return true;
        const mine = this.rankOf(by);
        return mine < (r.order ?? 0) && (!cur || mine < (cur.order ?? 0)) && ((r.perms | 0) & ~this.permsOf(by)) === 0;
      }
      case 'mem': {
        if (!can(P.ManageRole)) return false;
        if (by === this.owner()) return true;
        if (r.uid !== by && !this.outranks(by, r.uid)) return false;
        const a = new Set(cur?.roles || []);
        const b = new Set(r.del ? [] : r.roles || []);
        return [...a, ...b].filter((x) => a.has(x) !== b.has(x)).every((id) => (this.recs.get(id)?.order ?? -Infinity) > this.rankOf(by));
      }
      case 'ban':
        if (r.uid === this.owner()) return false;
        if (r.del) return can(P.BanMembers) || can(P.KickMembers);
        return can(r.until ? P.KickMembers : P.BanMembers) && this.outranks(by, r.uid);
      case 'q':
      case 'pb':
        return can(P.Connect);
    }
    return true;
  }
}
