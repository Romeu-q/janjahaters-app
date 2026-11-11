'use strict';
// Atividade do PC ("Jogando X") para mostrar aos amigos. Duas fontes:
//  1. Jogos abertos: a cada 15 s olha os programas abertos (tasklist) e compara com a lista pública de jogos
//     do Discord (~25 mil, com o nome do .exe de cada um), mais os jogos que a pessoa cadastrou à mão.
//  2. Rich presence: jogos que mandam detalhes ("Ranqueada · 12-8") procuram o Discord por um pipe do Windows
//     (\\?\pipe\discord-ipc-N). O janja atende nesse pipe e entende o SET_ACTIVITY. Se o Discord estiver aberto,
//     ele pega o pipe 0 e o jogo fala com ele; aí fica só a fonte 1.
// Só sai daqui o nome do jogo (e os detalhes que o próprio jogo mandou), nunca a lista do que está aberto.
const fs = require('fs');
const path = require('path');
const net = require('net');
const { execFile } = require('child_process');

const LIST_URL = 'https://discord.com/api/v10/applications/detectable';
const API = 'https://discord.com/api/v10';
const UA = 'janjahaters (https://github.com/Romeu-q/janjahaters-app)';
// nomes de .exe comuns demais para dizer que é um jogo
const GENERIC = new Set(['game.exe', 'launcher.exe', 'client.exe', 'start.exe', 'main.exe', 'app.exe', 'run.exe', 'setup.exe', 'update.exe', 'updater.exe', 'unins000.exe', 'player.exe', 'java.exe', 'javaw.exe', 'python.exe', 'electron.exe', 'node.exe', 'chrome.exe', 'msedge.exe', 'firefox.exe', 'explorer.exe', 'steam.exe', 'discord.exe', 'janjahaters.exe']);

const dbg = (...a) => process.env.JANJA_ACT_DEBUG && console.log('[atividade]', ...a);
module.exports = function startActivity({ userData, send }) {
  const cacheFile = path.join(userData, 'detectable.json');
  let byExe = new Map(); // nome do .exe -> { id, name }
  let byId = new Map(); // id do app no Discord -> nome
  let custom = []; // [{ exe, name }] cadastrados pela pessoa
  let enabled = true;
  let detected = null; // { id, name, start }
  let rpc = null; // { id, name, details, state, start, image }
  let last = '';
  let pollTimer = null;
  let pipe = null;
  const appInfo = new Map(); // id -> Promise<{ name, icon }>
  const assets = new Map(); // id -> Promise<Map(nome -> url)>

  // ---------- lista de jogos (baixa uma vez por semana)
  function index(list) {
    const ex = new Map();
    const ids = new Map();
    for (const a of list) {
      if (!a?.id || !a.name) continue;
      ids.set(String(a.id), a.name);
      for (const e of a.executables || []) {
        if (e.is_launcher || (e.os && e.os !== 'win32')) continue;
        const base = String(e.name || '').split('/').pop().toLowerCase();
        if (!base.endsWith('.exe') || GENERIC.has(base) || ex.has(base)) continue;
        ex.set(base, { id: String(a.id), name: a.name });
      }
    }
    byExe = ex;
    byId = ids;
  }
  async function loadList() {
    try {
      const st = fs.statSync(cacheFile);
      index(JSON.parse(fs.readFileSync(cacheFile, 'utf8')));
      if (Date.now() - st.mtimeMs < 7 * 864e5) return;
    } catch {}
    try {
      const r = await fetch(LIST_URL, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
      if (!r.ok) return;
      const text = await r.text();
      const list = JSON.parse(text);
      if (!Array.isArray(list) || list.length < 100) return;
      fs.writeFileSync(cacheFile, text);
      index(list);
    } catch (err) {
      console.warn('lista de jogos:', err.message);
    }
  }

  // ---------- ícone e nome do app (públicos no Discord), para os jogos com rich presence
  function info(id) {
    if (!appInfo.has(id))
      appInfo.set(
        id,
        fetch(`${API}/applications/${id}/rpc`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => ({ name: j?.name || byId.get(id) || null, icon: j?.icon ? `https://cdn.discordapp.com/app-icons/${id}/${j.icon}.png?size=128` : null }))
          .catch(() => ({ name: byId.get(id) || null, icon: null })),
      );
    return appInfo.get(id);
  }
  function assetUrl(id, key) {
    if (!key || typeof key !== 'string') return Promise.resolve(null);
    if (key.startsWith('mp:')) return Promise.resolve('https://media.discordapp.net/' + key.slice(3));
    if (/^https:\/\//.test(key)) return Promise.resolve(key);
    if (!assets.has(id))
      assets.set(
        id,
        fetch(`${API}/oauth2/applications/${id}/assets`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) })
          .then((r) => (r.ok ? r.json() : []))
          .then((list) => new Map((Array.isArray(list) ? list : []).map((a) => [a.name, `https://cdn.discordapp.com/app-assets/${id}/${a.id}.png?size=256`])))
          .catch(() => new Map()),
      );
    return assets.get(id).then((m) => m.get(key) || (/^\d+$/.test(key) ? `https://cdn.discordapp.com/app-assets/${id}/${key}.png?size=256` : null));
  }

  // ---------- o que mandar para o app (rich presence vence a detecção)
  async function emit() {
    let a = null;
    if (enabled && rpc) a = { k: 'game', n: rpc.name, d: rpc.details, s: rpc.state, t: rpc.start, i: rpc.image };
    else if (enabled && detected) {
      const meta = detected.id ? await info(detected.id) : null;
      a = { k: 'game', n: detected.name, t: detected.start, i: meta?.icon || null };
    }
    const key = JSON.stringify(a);
    dbg('emit', key, 'rpc', !!rpc, 'enabled', enabled);
    if (key === last) return;
    last = key;
    send(a);
  }

  // ---------- 1: jogos abertos
  function poll() {
    execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
      if (err || !enabled) return;
      const running = new Set();
      for (const line of out.split(/\r?\n/)) {
        const m = line.match(/^"([^"]+)"/);
        if (m) running.add(m[1].toLowerCase());
      }
      // os cadastrados à mão vêm antes da lista do Discord
      let found = custom.find((c) => running.has(c.exe));
      if (found) found = { id: null, name: found.name };
      else
        for (const exe of running)
          if (byExe.has(exe)) {
            found = { ...byExe.get(exe) };
            break;
          }
      if (!found) detected = null;
      else if (detected?.name !== found.name) detected = { ...found, start: Date.now() };
      emit();
    });
  }

  // ---------- 2: rich presence pelo pipe discord-ipc
  function frame(op, obj) {
    const body = Buffer.from(JSON.stringify(obj));
    const head = Buffer.alloc(8);
    head.writeInt32LE(op, 0);
    head.writeInt32LE(body.length, 4);
    return Buffer.concat([head, body]);
  }
  const clients = new Set();
  function onSocket(sock) {
    const cl = { sock, id: null, buf: Buffer.alloc(0) };
    clients.add(cl);
    const drop = () => {
      clients.delete(cl);
      if (rpc && rpc.sock === sock) {
        rpc = null;
        emit();
      }
    };
    sock.on('close', drop);
    sock.on('error', drop);
    sock.on('data', (chunk) => {
      cl.buf = Buffer.concat([cl.buf, chunk]);
      while (cl.buf.length >= 8) {
        const op = cl.buf.readInt32LE(0);
        const len = cl.buf.readInt32LE(4);
        if (len < 0 || len > 64 * 1024) return sock.destroy();
        if (cl.buf.length < 8 + len) return;
        let msg = null;
        try {
          msg = JSON.parse(cl.buf.subarray(8, 8 + len).toString('utf8'));
        } catch {}
        cl.buf = cl.buf.subarray(8 + len);
        handle(cl, op, msg);
      }
    });
  }
  function handle(cl, op, msg) {
    const sock = cl.sock;
    dbg('op', op, msg?.cmd || '', 'enabled', enabled);
    if (op === 0) {
      // HANDSHAKE: responde como se fosse o Discord pronto
      cl.id = String(msg?.client_id || '');
      sock.write(frame(1, { cmd: 'DISPATCH', evt: 'READY', nonce: null, data: { v: 1, config: { cdn_host: 'cdn.discordapp.com', api_endpoint: '//discord.com/api', environment: 'production' }, user: { id: '0', username: 'janjahaters', discriminator: '0', global_name: 'janjahaters', avatar: null, bot: false, flags: 0, premium_type: 0 } } }));
    } else if (op === 3) sock.write(frame(4, msg || {})); // PING -> PONG
    else if (op === 2) sock.end();
    else if (op === 1 && msg) {
      if (msg.cmd === 'SET_ACTIVITY') {
        const act = msg.args?.activity;
        sock.write(frame(1, { cmd: 'SET_ACTIVITY', evt: null, nonce: msg.nonce ?? null, data: act || null }));
        setRpc(cl, act);
      } else sock.write(frame(1, { cmd: msg.cmd, evt: null, nonce: msg.nonce ?? null, data: null }));
    }
  }
  async function setRpc(cl, act) {
    if (!act) {
      if (rpc?.sock === cl.sock) rpc = null;
      return emit();
    }
    const id = cl.id;
    const meta = id ? await info(id) : null;
    const s = (v, n) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
    const start = Number(act.timestamps?.start);
    rpc = {
      sock: cl.sock,
      id,
      name: s(act.name, 80) || meta?.name || 'um jogo',
      details: s(act.details, 128),
      state: s(act.state, 128),
      start: Number.isFinite(start) ? (start < 1e12 ? start * 1000 : start) : Date.now(),
      image: (await assetUrl(id, act.assets?.large_image)) || meta?.icon || null,
    };
    emit();
  }
  // No Windows dois programas conseguem abrir o mesmo pipe ao mesmo tempo: aí o jogo cairia ora no Discord, ora
  // aqui. Então antes de usar um pipe, tenta conectar nele: se alguém responde (o Discord ou outro janja), pula.
  function pipeBusy(name) {
    return new Promise((ok) => {
      const c = net.connect(name);
      c.once('connect', () => {
        c.destroy();
        ok(true);
      });
      c.once('error', () => ok(false));
    });
  }
  let opening = false;
  async function openPipe() {
    if (process.platform !== 'win32' || pipe || opening) return;
    opening = true;
    try {
      for (let i = 0; i <= 9 && !pipe && enabled; i++) {
        const name = `\\\\?\\pipe\\discord-ipc-${i}`;
        if (await pipeBusy(name)) continue;
        const srv = net.createServer(onSocket);
        const ok = await new Promise((done) => {
          srv.once('error', () => done(false));
          srv.listen(name, () => done(true));
        });
        if (ok) pipe = srv;
      }
    } finally {
      opening = false;
    }
  }
  function closePipe() {
    for (const c of clients) c.sock.destroy();
    clients.clear();
    pipe?.close();
    pipe = null;
    rpc = null;
  }

  function start() {
    if (pollTimer) return;
    poll();
    pollTimer = setInterval(poll, 15000);
    openPipe();
  }
  function stop() {
    clearInterval(pollTimer);
    pollTimer = null;
    closePipe();
    detected = null;
    emit();
  }

  loadList().then(() => enabled && poll());
  if (process.platform === 'win32') start();

  return {
    config(cfg) {
      dbg('config', JSON.stringify(cfg));
      enabled = cfg?.enabled !== false;
      custom = (Array.isArray(cfg?.custom) ? cfg.custom : [])
        .filter((c) => c && typeof c.exe === 'string' && typeof c.name === 'string')
        .slice(0, 30)
        .map((c) => ({ exe: c.exe.trim().toLowerCase().split(/[\\/]/).pop().slice(0, 80), name: c.name.trim().slice(0, 60) }))
        .filter((c) => c.exe.endsWith('.exe') && c.name);
      if (process.platform !== 'win32') return null;
      enabled ? start() : stop();
      if (enabled) poll();
      return null;
    },
    current: () => (last ? JSON.parse(last) : null),
    stop: closePipe,
  };
};
