#!/usr/bin/env node
// janja-bot-gateway: roda um bot feito para o Stoat dentro de um grupo do janjahaters.
//
//   node index.mjs --code JANJA-XXXX-XXXX --name "MeuBot"
//
// Na primeira vez cria o token do bot e guarda tudo em ./janja-bot (ou --data). O bot conecta em
// http://127.0.0.1:14700 com esse token, como se fosse o Stoat. Veja o README.md.
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { Janja, parseCode } from './janja.mjs';
import { createGateway, SERVER_ID } from './stoat.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : process.env['JANJA_BOT_' + name.toUpperCase()] || def;
};
if (args.includes('--help') || args.includes('-h')) {
  console.log(`janja-bot-gateway

  --code   código de convite do grupo (JANJA-...)            [obrigatório na 1ª vez]
  --name   nome do bot no grupo                               [padrão: Bot]
  --color  cor do nome (#rrggbb)
  --port   porta da API do Stoat                              [padrão: 14700]
  --host   endereço da API (0.0.0.0 para abrir na rede)       [padrão: 127.0.0.1]
  --data   pasta onde ficam a chave, o token e as mensagens   [padrão: ./janja-bot]
  --token  usar este token em vez do gerado
  --turn   arquivo JSON com servidores TURN (iceServers)

As opções também podem vir de variáveis: JANJA_BOT_CODE, JANJA_BOT_NAME, JANJA_BOT_PORT...`);
  process.exit(0);
}

const dir = path.resolve(opt('data', 'janja-bot'));
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'store.json');
let data = {};
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch {}
let saveT;
const store = {
  get: (k, d) => (k in data ? data[k] : d),
  set: (k, v) => {
    data[k] = v;
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      fs.writeFileSync(file + '.tmp', JSON.stringify(data));
      fs.renameSync(file + '.tmp', file);
    }, 300);
  },
};

const key = parseCode(opt('code', '')) || store.get('key', null);
if (!key) {
  console.error('Falta o código do grupo: node index.mjs --code JANJA-XXXX --name "MeuBot"');
  process.exit(1);
}
store.set('key', key);
const name = String(opt('name', store.get('name', 'Bot'))).slice(0, 32);
store.set('name', name);
const token = opt('token', store.get('token', null)) || randomBytes(24).toString('base64url');
store.set('token', token);
const port = Number(opt('port', 14700));
const host = opt('host', '127.0.0.1');
let turn = [];
if (opt('turn')) turn = JSON.parse(fs.readFileSync(opt('turn'), 'utf8'));

const janja = new Janja({ key, hash: opt('hash'), name, color: opt('color', store.get('color', '#7c5cff')), store, turn });
const me = await janja.start();
const api = await createGateway(janja, { port, host, token });
console.log(`
janja-bot-gateway pronto
  bot:      ${name}  (id ${me.id})
  API:      ${api.url}      (é o "baseURL" do Stoat)
  token:    ${token}
  servidor: ${SERVER_ID}

No grupo, o dono pode dar cargos e permissões ao bot como a qualquer pessoa.
`);
let lastPeers = -1;
setInterval(() => {
  const n = janja.peers.size;
  if (n !== lastPeers) console.log(`[janja] ${n} amigo(s) conectado(s)`);
  lastPeers = n;
}, 5000).unref();
const bye = () => {
  fs.writeFileSync(file, JSON.stringify({ ...data, ['recs:' + janja.hash]: [...janja.recs.values()] }));
  process.exit(0);
};
process.on('SIGINT', bye);
process.on('SIGTERM', bye);
