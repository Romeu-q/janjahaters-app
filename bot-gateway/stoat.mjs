// O lado Stoat do gateway: um pedaço da API do Stoat (REST + o WebSocket "Bonfire") em localhost, traduzido
// para os registros do janjahaters. Um bot feito para o Stoat (stoat.js, etc.) funciona trocando só o endereço.
//
// O grupo do janja aparece como um único servidor; os canais de texto e voz, as categorias e os cargos
// viram os do Stoat. O que não faz sentido sem servidor (contas, convites, arquivos, voz de bot...) responde
// com um erro claro em vez de fingir que funcionou.
import http from 'node:http';
import { createHash } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { P, randId } from './janja.mjs';

export const SERVER_ID = '01JANJAHATERS0000000000000'; // o grupo (um ULID fixo, para quem lê a data do id)

// ---------------------------------------------------------------- ids: o Stoat usa ULID (com a data dentro)
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function ulidFrom(ms, seed) {
  let t = '';
  for (let i = 0, n = Math.max(0, Math.floor(ms)); i < 10; i++, n = Math.floor(n / 32)) t = B32[n % 32] + t;
  const h = createHash('sha256').update(seed).digest();
  let r = '';
  for (let i = 0; i < 16; i++) r += B32[h[i] % 32];
  return t + r;
}
const toStoat = new Map(); // id da mensagem no janja -> ULID
const toJanja = new Map();
function msgUlid(m) {
  let u = toStoat.get(m.id);
  if (!u) {
    u = ulidFrom(m.ts || m.v || Date.now(), m.id);
    toStoat.set(m.id, u);
    toJanja.set(u, m.id);
  }
  return u;
}
const msgId = (s) => toJanja.get(s) || s;

// ---------------------------------------------------------------- permissões: janja -> números do Stoat
const S = {
  ManageChannel: 1n, ManageServer: 2n, ManagePermissions: 4n, ManageRole: 8n, ManageCustomisation: 16n, KickMembers: 64n,
  BanMembers: 128n, TimeoutMembers: 256n, AssignRoles: 512n, ViewChannel: 1n << 20n, ReadMessageHistory: 1n << 21n,
  SendMessage: 1n << 22n, ManageMessages: 1n << 23n, InviteOthers: 1n << 25n, SendEmbeds: 1n << 26n, Masquerade: 1n << 28n,
  React: 1n << 29n, Connect: 1n << 30n, Speak: 1n << 31n, Video: 1n << 32n, MuteMembers: 1n << 33n, MoveMembers: 1n << 35n, Listen: 1n << 36n,
};
function stoatPerms(p) {
  let out = S.ViewChannel | S.ReadMessageHistory | S.InviteOthers | S.Listen;
  for (const [name, bit] of Object.entries(P)) if (p & bit) out |= S[name === 'Stream' ? 'Video' : name] || 0n;
  if (p & P.SendMessage) out |= S.SendEmbeds | S.Masquerade;
  if (p & P.ManageRole) out |= S.AssignRoles;
  if (p & P.KickMembers) out |= S.TimeoutMembers;
  return Number(out);
}

export function createGateway(janja, { port, host = '127.0.0.1', token, log = console.log }) {
  const J = janja;
  const base = () => `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
  const iso = (ms) => new Date(ms || Date.now()).toISOString();

  // ------------------------------------------------------------ objetos no formato do Stoat
  function user(id) {
    const u = J.users().get(id) || { id, name: 'Anônimo' };
    const self = id === J.me.id;
    const o = {
      _id: id,
      username: String(u.name || 'Anônimo').replace(/\s+/g, '_').slice(0, 32) || 'anonimo',
      discriminator: id.slice(0, 4).replace(/\D/g, '0').padEnd(4, '0'),
      display_name: u.name,
      relationship: self ? 'User' : 'None',
      online: self || J.online(id),
      status: { presence: self || J.online(id) ? ({ idle: 'Idle', dnd: 'Busy' }[u.st] || 'Online') : 'Invisible' },
      badges: 0,
      flags: 0,
    };
    if (u.bot) o.bot = { owner: self ? J.owner() || id : id };
    return o;
  }
  function member(uid) {
    const known = J.store.get('users', {})[uid];
    const m = { _id: { server: SERVER_ID, user: uid }, joined_at: iso(known?.first), roles: J.rolesOf(uid).map((r) => r.id) };
    const ban = J.banOf(uid);
    if (ban?.until) m.timeout = iso(ban.until);
    return m;
  }
  function channel(c) {
    return {
      _id: c.id,
      channel_type: c.type === 'voice' ? 'VoiceChannel' : 'TextChannel',
      server: SERVER_ID,
      name: c.name,
      description: c.topic || undefined,
      nsfw: false,
      ...(c.type === 'voice' ? { voice: {} } : {}),
    };
  }
  const channels = () => J.all('ch').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  function server() {
    const g = J.recs.get('grp') || {};
    const chs = channels();
    const roles = {};
    J.roleList().forEach((r, i) => {
      roles[r.id] = { name: r.name, permissions: { a: stoatPerms(r.perms | 0), d: 0 }, colour: r.color || undefined, hoist: !!r.hoist, rank: r.order ?? i };
    });
    return {
      _id: SERVER_ID,
      owner: J.owner() || '',
      name: g.name || 'Grupo',
      description: g.desc || undefined,
      channels: chs.map((c) => c.id),
      categories: J.all('cat')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((k) => ({ id: k.id, title: k.name, channels: chs.filter((c) => c.cat === k.id).map((c) => c.id) })),
      roles,
      default_permissions: stoatPerms(J.everyonePerms()),
      flags: 0,
      nsfw: false,
      analytics: false,
      discoverable: false,
    };
  }
  const reactionsOf = (mid) => {
    const out = {};
    for (const r of J.all('rx')) if (r.msg === mid) (out[r.emoji] ||= []).push(r.uid);
    return out;
  };
  const nameToId = () => {
    const m = new Map();
    for (const u of J.users().values()) if (u.name) m.set(String(u.name).toLowerCase(), u.id);
    return m;
  };
  function message(m) {
    const o = { _id: msgUlid(m), channel: m.ch, author: m.uid, content: m.text || '' };
    if (m.edited) o.edited = iso(m.v);
    if (m.reply && J.recs.get(m.reply)) o.replies = [msgUlid(J.recs.get(m.reply))];
    const rx = reactionsOf(m.id);
    if (Object.keys(rx).length) o.reactions = rx;
    if (J.get('pin:' + m.id)) o.pinned = true;
    // menções: o janja escreve "@Nome"; o Stoat lista os ids
    const names = nameToId();
    const ids = [...(m.text || '').matchAll(/@([\p{L}\p{N}_.\- ]{1,32}?)(?=$|[\s,.!?:;])/gu)].map((x) => names.get(x[1].toLowerCase())).filter(Boolean);
    if (ids.length) o.mentions = [...new Set(ids)];
    if (m.bot && !m.via) o.masquerade = { name: m.name, colour: m.color || undefined };
    if (m.att?.length) o.content += (o.content ? '\n' : '') + m.att.map((a) => `[anexo: ${a.name || 'arquivo'}]`).join(' ');
    return o;
  }
  // texto do Stoat -> janja: "<@id>" vira "@Nome"; embeds viram markdown
  function fromStoat(body) {
    let text = String(body?.content ?? '');
    const users = J.users();
    text = text.replace(/<@([0-9A-Za-z]{1,64})>/g, (all, id) => (users.get(id)?.name ? '@' + users.get(id).name : all));
    for (const e of Array.isArray(body?.embeds) ? body.embeds.slice(0, 5) : []) {
      const parts = [e.title && (e.url ? `**[${e.title}](${e.url})**` : `**${e.title}**`), e.description].filter(Boolean);
      if (parts.length) text += (text ? '\n' : '') + parts.map((p) => '> ' + String(p).replace(/\n/g, '\n> ')).join('\n');
    }
    return text.slice(0, 2000);
  }

  // ------------------------------------------------------------ WebSocket (Bonfire)
  const sockets = new Set();
  const emit = (ev) => {
    const s = JSON.stringify(ev);
    for (const ws of sockets) if (ws.ready) ws.send(s);
  };
  function ready() {
    const ids = [...J.users().keys()];
    return {
      type: 'Ready',
      users: ids.map(user),
      servers: [server()],
      channels: channels().map(channel),
      members: ids.filter((id) => !J.banOf(id) || J.banOf(id).until).map(member),
      emojis: J.all('emo').map((e) => ({ _id: e.id, parent: { type: 'Server', id: SERVER_ID }, creator_id: e.by, name: e.name })),
    };
  }

  J.on('rec', (r, cur) => {
    const was = cur && !cur.del;
    switch (r.k) {
      case 'msg':
        if (r.del) return was && emit({ type: 'MessageDelete', id: msgUlid(cur), channel: cur.ch });
        if (!was) return emit({ type: 'Message', ...message(r) });
        if (r.text !== cur.text) emit({ type: 'MessageUpdate', id: msgUlid(r), channel: r.ch, data: { content: r.text, edited: iso(r.v) } });
        return;
      case 'rx': {
        const m = J.recs.get(r.msg);
        if (!m) return;
        const ev = { id: msgUlid(m), channel_id: r.ch, user_id: r.uid, emoji_id: r.emoji };
        if (r.del && was) emit({ type: 'MessageUnreact', ...ev });
        else if (!r.del && !was) emit({ type: 'MessageReact', ...ev });
        return;
      }
      case 'ch':
        if (r.del) return was && emit({ type: 'ChannelDelete', id: r.id });
        if (!was) {
          emit({ type: 'ChannelCreate', ...channel(r) });
          return emit({ type: 'ServerUpdate', id: SERVER_ID, data: { channels: server().channels }, clear: [] });
        }
        emit({ type: 'ChannelUpdate', id: r.id, data: { name: r.name, ...(r.topic ? { description: r.topic } : {}) }, clear: r.topic ? [] : ['Description'] });
        if (r.cat !== cur.cat) emit({ type: 'ServerUpdate', id: SERVER_ID, data: { categories: server().categories }, clear: [] });
        return;
      case 'cat':
        return emit({ type: 'ServerUpdate', id: SERVER_ID, data: { categories: server().categories }, clear: [] });
      case 'grp': {
        const s = server();
        return emit({ type: 'ServerUpdate', id: SERVER_ID, data: { name: s.name, owner: s.owner, default_permissions: s.default_permissions }, clear: [] });
      }
      case 'role':
        if (r.del) return emit({ type: 'ServerRoleDelete', id: SERVER_ID, role_id: r.id });
        return emit({ type: 'ServerRoleUpdate', id: SERVER_ID, role_id: r.id, data: server().roles[r.id], clear: [] });
      case 'mem':
        return emit({ type: 'ServerMemberUpdate', id: { server: SERVER_ID, user: r.uid }, data: { roles: J.rolesOf(r.uid).map((x) => x.id) }, clear: [] });
      case 'ban':
        if (!r.del && !r.until) emit({ type: 'ServerMemberLeave', id: SERVER_ID, user: r.uid, reason: 'Ban' });
        else emit({ type: 'ServerMemberUpdate', id: { server: SERVER_ID, user: r.uid }, data: r.del ? {} : { timeout: iso(r.until) }, clear: r.del ? ['Timeout'] : [] });
        return;
      case 'emo':
        if (r.del) return emit({ type: 'EmojiDelete', id: r.id });
        if (!was) emit({ type: 'EmojiCreate', _id: r.id, parent: { type: 'Server', id: SERVER_ID }, creator_id: r.by, name: r.name });
        return;
    }
  });
  J.on('join', (uid) => emit({ type: 'ServerMemberJoin', id: SERVER_ID, user: uid, member: member(uid) }));
  J.on('presence', (uid, online) => emit({ type: 'UserPresence', id: uid, online }));
  J.on('user', (uid) => emit({ type: 'UserUpdate', id: uid, data: { display_name: user(uid).display_name, online: true }, clear: [] }));
  J.on('typing', (uid, ch) => {
    emit({ type: 'ChannelStartTyping', id: ch, user: uid });
  });

  // ------------------------------------------------------------ REST
  class E extends Error {
    constructor(status, body) {
      super(body.type);
      this.status = status;
      this.body = body;
    }
  }
  const notFound = () => new E(404, { type: 'NotFound' });
  const noPerm = (permission) => new E(403, { type: 'MissingPermission', permission });
  const unsupported = (what) => new E(501, { type: 'NotImplemented', detail: `O janjahaters não tem isso (${what}): o grupo é P2P, sem servidor.` });
  const needPerm = (perm, name) => {
    if (!J.can(J.me.id, perm)) throw noPerm(name);
  };
  const textChannel = (id) => {
    const c = J.get(id);
    if (!c || c.k !== 'ch') throw notFound();
    return c;
  };
  const findMsg = (ch, id) => {
    const m = J.get(msgId(id));
    if (!m || m.k !== 'msg' || m.ch !== ch) throw notFound();
    return m;
  };
  const channelMsgs = (ch) => J.all('msg').filter((m) => m.ch === ch).sort((a, b) => a.ts - b.ts);
  const withUsers = (msgs, q) => {
    const list = msgs.map(message);
    if (q.get('include_users') !== 'true') return list;
    const ids = [...new Set(list.map((m) => m.author))];
    return { messages: list, users: ids.map(user), members: ids.map(member) };
  };
  const put = async (rec, perm) => {
    const ok = await J.put(rec);
    if (!ok) throw noPerm(perm);
    return ok;
  };

  const routes = [
    ['GET', /^\/$/, () => ({
      revolt: '0.8.8',
      features: {
        captcha: { enabled: false, key: '' },
        email: false,
        invite_only: true,
        autumn: { enabled: false, url: '' },
        january: { enabled: false, url: '' },
        voso: { enabled: false, url: '', ws: '' },
        livekit: { enabled: false, nodes: [] },
      },
      ws: base().replace(/^http/, 'ws') + '/',
      app: base(),
      vapid: '',
      build: { commit_sha: '', commit_timestamp: '', semver: 'janja-bot-gateway', origin_url: 'https://github.com/Romeu-q/janjahaters-app', timestamp: '' },
    }), true],
    ['GET', /^\/users\/@me$/, () => user(J.me.id)],
    ['GET', /^\/users\/([^/]+)$/, ([id]) => {
      if (!J.users().has(id)) throw notFound();
      return user(id);
    }],
    ['GET', /^\/users\/([^/]+)\/profile$/, ([id]) => ({ content: '' })],
    ['GET', /^\/users\/([^/]+)\/default_avatar$/, () => {
      throw notFound();
    }],
    ['GET', /^\/servers\/([^/]+)$/, ([id]) => {
      if (id !== SERVER_ID) throw notFound();
      return server();
    }],
    ['GET', /^\/servers\/([^/]+)\/members$/, ([id]) => {
      if (id !== SERVER_ID) throw notFound();
      const ids = [...J.users().keys()].filter((u) => !J.banOf(u) || J.banOf(u).until);
      return { members: ids.map(member), users: ids.map(user) };
    }],
    ['GET', /^\/servers\/([^/]+)\/members\/([^/]+)$/, ([id, uid]) => {
      if (id !== SERVER_ID || !J.users().has(uid)) throw notFound();
      return member(uid);
    }],
    ['PATCH', /^\/servers\/([^/]+)\/members\/([^/]+)$/, async ([id, uid], body) => {
      if (id !== SERVER_ID) throw notFound();
      if (Array.isArray(body?.roles)) await put({ k: 'mem', id: 'mem:' + uid, uid, roles: body.roles.filter((r) => J.get(r)?.k === 'role') }, 'AssignRoles');
      if (body?.timeout) await put({ k: 'ban', id: 'ban:' + uid, uid, name: J.users().get(uid)?.name || '', at: Date.now(), until: Date.parse(body.timeout) }, 'TimeoutMembers');
      if (body?.remove?.includes?.('Timeout') && J.banOf(uid)?.until) await put({ ...J.banOf(uid), del: true }, 'TimeoutMembers');
      return member(uid);
    }],
    ['DELETE', /^\/servers\/([^/]+)\/members\/([^/]+)$/, async ([id, uid]) => {
      // expulsar: no janja é um banimento curto (a pessoa sai e pode voltar depois)
      await put({ k: 'ban', id: 'ban:' + uid, uid, name: J.users().get(uid)?.name || '', at: Date.now(), until: Date.now() + 10 * 60e3 }, 'KickMembers');
      return null;
    }],
    ['PUT', /^\/servers\/([^/]+)\/bans\/([^/]+)$/, async ([id, uid], body) => {
      const r = await put({ k: 'ban', id: 'ban:' + uid, uid, name: J.users().get(uid)?.name || '', at: Date.now(), reason: body?.reason ? String(body.reason).slice(0, 200) : undefined }, 'BanMembers');
      return { _id: { server: SERVER_ID, user: uid }, reason: r.reason };
    }],
    ['DELETE', /^\/servers\/([^/]+)\/bans\/([^/]+)$/, async ([id, uid]) => {
      const b = J.get('ban:' + uid);
      if (b) await put({ ...b, del: true }, 'BanMembers');
      return null;
    }],
    ['GET', /^\/servers\/([^/]+)\/bans$/, () => {
      const bans = J.all('ban').filter((b) => !b.until);
      return { users: bans.map((b) => ({ _id: b.uid, username: b.name || b.uid, discriminator: '0000' })), bans: bans.map((b) => ({ _id: { server: SERVER_ID, user: b.uid }, reason: b.reason })) };
    }],
    ['GET', /^\/channels\/([^/]+)$/, ([id]) => channel(textChannel(id))],
    ['GET', /^\/channels\/([^/]+)\/messages$/, ([ch], body, q) => {
      textChannel(ch);
      let list = channelMsgs(ch);
      const before = q.get('before') && J.get(msgId(q.get('before')));
      const after = q.get('after') && J.get(msgId(q.get('after')));
      if (before) list = list.filter((m) => m.ts < before.ts);
      if (after) list = list.filter((m) => m.ts > after.ts);
      if (q.get('nearby')) {
        const mid = J.get(msgId(q.get('nearby')));
        if (mid) list.sort((a, b) => Math.abs(a.ts - mid.ts) - Math.abs(b.ts - mid.ts));
      }
      const limit = Math.min(100, Math.max(1, Number(q.get('limit')) || 50));
      const sort = q.get('sort') || 'Latest';
      list = sort === 'Oldest' ? list.slice(0, limit) : q.get('nearby') ? list.slice(0, limit) : list.slice(-limit).reverse();
      return withUsers(list, q);
    }],
    ['POST', /^\/channels\/([^/]+)\/search$/, ([ch], body) => {
      textChannel(ch);
      const term = String(body?.query || '').toLowerCase();
      const list = channelMsgs(ch).filter((m) => (m.text || '').toLowerCase().includes(term)).reverse().slice(0, Math.min(100, body?.limit || 50));
      return withUsers(list, new URLSearchParams(body?.include_users ? 'include_users=true' : ''));
    }],
    ['GET', /^\/channels\/([^/]+)\/messages\/([^/]+)$/, ([ch, id]) => message(findMsg(ch, id))],
    ['POST', /^\/channels\/([^/]+)\/messages$/, async ([ch], body) => {
      const c = textChannel(ch);
      if (c.type === 'voice') throw new E(400, { type: 'InvalidOperation', detail: 'Canal de voz não tem chat no janja.' });
      if (body?.attachments?.length) throw unsupported('anexos pela API');
      const text = fromStoat(body);
      if (!text.trim()) throw new E(400, { type: 'EmptyMessage' });
      const reply = Array.isArray(body?.replies) && body.replies[0]?.id ? J.get(msgId(body.replies[0].id)) : null;
      const mq = body?.masquerade;
      const rec = await put(
        {
          k: 'msg',
          id: 'm:' + randId(),
          ch,
          uid: J.me.id,
          name: (mq?.name ? String(mq.name) : J.me.name).slice(0, 32),
          color: typeof mq?.colour === 'string' && /^#[0-9a-f]{6}$/i.test(mq.colour) ? mq.colour : J.me.color,
          bot: true,
          via: 'stoat',
          text,
          att: [],
          ts: Date.now(),
          ...(reply?.k === 'msg' ? { reply: reply.id } : {}),
        },
        'SendMessage',
      );
      return { ...message(rec), ...(body?.nonce ? { nonce: body.nonce } : {}) };
    }],
    ['PATCH', /^\/channels\/([^/]+)\/messages\/([^/]+)$/, async ([ch, id], body) => {
      const m = findMsg(ch, id);
      if (m.uid !== J.me.id) throw new E(403, { type: 'CannotEditMessage' });
      return message(await put({ ...m, text: fromStoat(body), edited: true }, 'SendMessage'));
    }],
    ['DELETE', /^\/channels\/([^/]+)\/messages\/bulk$/, async ([ch], body) => {
      for (const id of Array.isArray(body?.ids) ? body.ids.slice(0, 100) : []) {
        const m = J.get(msgId(id));
        if (m?.k === 'msg' && m.ch === ch) await put({ ...m, del: true }, 'ManageMessages');
      }
      return null;
    }],
    ['DELETE', /^\/channels\/([^/]+)\/messages\/([^/]+)$/, async ([ch, id]) => {
      const m = findMsg(ch, id);
      await put({ ...m, del: true }, 'ManageMessages');
      return null;
    }],
    ['PUT', /^\/channels\/([^/]+)\/messages\/([^/]+)\/reactions\/([^/]+)$/, async ([ch, id, emoji]) => {
      const m = findMsg(ch, id);
      const e = decodeURIComponent(emoji);
      const rid = `rx:${m.id}:${J.me.id.slice(0, 16)}:${[...e].map((c) => c.codePointAt(0).toString(16)).join('-')}`.slice(0, 80);
      if (!J.get(rid)) await put({ k: 'rx', id: rid, msg: m.id, ch, emoji: e.slice(0, /^:[a-z0-9_]{2,32}:$/.test(e) ? 34 : 16), uid: J.me.id, name: J.me.name, at: Date.now() }, 'React');
      return null;
    }],
    ['DELETE', /^\/channels\/([^/]+)\/messages\/([^/]+)\/reactions\/([^/]+)$/, async ([ch, id, emoji]) => {
      const m = findMsg(ch, id);
      const e = decodeURIComponent(emoji);
      const rid = `rx:${m.id}:${J.me.id.slice(0, 16)}:${[...e].map((c) => c.codePointAt(0).toString(16)).join('-')}`.slice(0, 80);
      const r = J.get(rid);
      if (r) await put({ ...r, del: true }, 'React');
      return null;
    }],
    ['POST', /^\/channels\/([^/]+)\/messages\/([^/]+)\/pin$/, async ([ch, id]) => {
      const m = findMsg(ch, id);
      await put({ k: 'pin', id: 'pin:' + m.id, msg: m.id, ch, uid: J.me.id, name: J.me.name, at: Date.now() }, 'ManageMessages');
      return null;
    }],
    ['DELETE', /^\/channels\/([^/]+)\/messages\/([^/]+)\/pin$/, async ([ch, id]) => {
      const m = findMsg(ch, id);
      const p = J.get('pin:' + m.id);
      if (p) await put({ ...p, del: true }, 'ManageMessages');
      return null;
    }],
    ['PUT', /^\/channels\/([^/]+)\/ack\/([^/]+)$/, () => null],
    ['PUT', /^\/servers\/([^/]+)\/ack$/, () => null],
    ['POST', /^\/servers\/([^/]+)\/channels$/, async ([id], body) => {
      needPerm(P.ManageChannel, 'ManageChannel');
      const rec = await put({ k: 'ch', id: 'c:' + randId(5), name: String(body?.name || 'canal').slice(0, 32), type: body?.type === 'Voice' ? 'voice' : 'text', order: channels().length, ...(body?.description ? { topic: String(body.description).slice(0, 200) } : {}) }, 'ManageChannel');
      return channel(rec);
    }],
    ['PATCH', /^\/channels\/([^/]+)$/, async ([id], body) => {
      const c = textChannel(id);
      const next = { ...c };
      if (body?.name) next.name = String(body.name).slice(0, 32);
      if (typeof body?.description === 'string') next.topic = body.description.slice(0, 200);
      if (body?.remove?.includes?.('Description')) delete next.topic;
      return channel(await put(next, 'ManageChannel'));
    }],
    ['DELETE', /^\/channels\/([^/]+)$/, async ([id]) => {
      await put({ ...textChannel(id), del: true }, 'ManageChannel');
      return null;
    }],
    ['POST', /^\/servers\/([^/]+)\/roles$/, async ([id], body) => {
      const order = Math.max(0, ...J.roleList().map((r) => (r.order ?? 0) + 1));
      const rec = await put({ k: 'role', id: 'role:' + randId(5), name: String(body?.name || 'cargo').slice(0, 32), perms: 0, order }, 'ManageRole');
      return { id: rec.id, role: server().roles[rec.id] };
    }],
  ];

  async function handle(req, res) {
    const url = new URL(req.url, base());
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
      res.end(body == null ? '' : JSON.stringify(body));
    };
    if (req.method === 'OPTIONS') return send(204);
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 64_000) return send(413, { type: 'PayloadTooLarge' });
    }
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      return send(400, { type: 'FailedValidation', error: 'JSON inválido' });
    }
    try {
      for (const [method, re, fn, open] of routes) {
        const m = path.match(re);
        if (!m || method !== req.method) continue;
        if (!open && req.headers['x-bot-token'] !== token && req.headers['x-session-token'] !== token) throw new E(401, { type: 'Unauthorized' });
        const out = await fn(m.slice(1).map(decodeURIComponent), body, url.searchParams);
        return send(out == null ? 204 : 200, out);
      }
      if (/^\/(auth|onboard|sync|push|safety|policy|invites|bots|custom|webhooks)\b/.test(path)) throw unsupported(path.split('/')[1]);
      if (/^\/(users\/@me\/(friends|dm)|users\/[^/]+\/dm|servers\/create|channels\/create)/.test(path)) throw unsupported('DMs e servidores novos');
      if (/\/(join_call|invites|webhooks|permissions)/.test(path)) throw unsupported(path.split('/').pop());
      throw notFound();
    } catch (err) {
      if (err instanceof E) return send(err.status, err.body);
      log('[stoat] erro em', req.method, path, err);
      send(500, { type: 'InternalError' });
    }
  }

  const httpServer = http.createServer(handle);
  const wss = new WebSocketServer({ server: httpServer });
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, base());
    const auth = (t) => {
      if (t !== token) {
        ws.send(JSON.stringify({ type: 'Error', data: { type: 'InvalidSession' } }));
        return ws.close();
      }
      ws.ready = true;
      sockets.add(ws);
      ws.send(JSON.stringify({ type: 'Authenticated' }));
      ws.send(JSON.stringify(ready()));
      log('[stoat] bot conectado');
    };
    ws.on('message', (data) => {
      let ev;
      try {
        ev = JSON.parse(String(data));
      } catch {
        return;
      }
      if (ev.type === 'Authenticate' && !ws.ready) return auth(ev.token);
      if (!ws.ready) return;
      if (ev.type === 'Ping') return ws.send(JSON.stringify({ type: 'Pong', data: ev.data }));
      if (ev.type === 'BeginTyping' && typeof ev.channel === 'string') return J.typing(ev.channel);
    });
    ws.on('close', () => sockets.delete(ws));
    if (url.searchParams.get('token')) auth(url.searchParams.get('token'));
  });
  // o servidor também manda Ping (alguns clientes esperam)
  setInterval(() => {
    for (const ws of sockets) ws.send(JSON.stringify({ type: 'Ping', data: Date.now() }));
  }, 30_000).unref();

  return new Promise((ok, fail) => {
    httpServer.once('error', fail);
    httpServer.listen(port, host, () => ok({ url: base(), close: () => httpServer.close() }));
  });
}
