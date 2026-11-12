// Worker da Cloudflare que deixa o janja usar o SFU (Cloudflare Realtime) sem pôr a chave secreta dentro do app.
// O app chama este Worker; ele repassa para rtc.live.cloudflare.com com a chave guardada como "secret".
//
// Variáveis do Worker (Settings → Variables and Secrets):
//   SFU_APP_ID      o "App ID" do app de Realtime/SFU            (texto)
//   SFU_APP_TOKEN   o "App Secret" do mesmo app                   (secret)
//
// Rotas (só estas passam; o resto responde 404):
//   POST /session                    cria uma sessão
//   POST /session/:id/tracks         publica ou puxa trilhas (tracks/new)
//   PUT  /session/:id/renegotiate    termina a negociação de um "puxar"
//   PUT  /session/:id/close          fecha trilhas
const API = 'https://rtc.live.cloudflare.com/v1/apps/';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, PUT, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } });

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (!env.SFU_APP_ID || !env.SFU_APP_TOKEN) return json({ errorCode: 'not_configured', errorDescription: 'Faltam SFU_APP_ID e SFU_APP_TOKEN no Worker' }, 500);
    const url = new URL(req.url);
    let path = null;
    let m;
    if (req.method === 'POST' && url.pathname === '/session') path = 'sessions/new';
    else if (req.method === 'POST' && (m = /^\/session\/([0-9a-f]{16,64})\/tracks$/.exec(url.pathname))) path = `sessions/${m[1]}/tracks/new`;
    else if (req.method === 'PUT' && (m = /^\/session\/([0-9a-f]{16,64})\/renegotiate$/.exec(url.pathname))) path = `sessions/${m[1]}/renegotiate`;
    else if (req.method === 'PUT' && (m = /^\/session\/([0-9a-f]{16,64})\/close$/.exec(url.pathname))) path = `sessions/${m[1]}/tracks/close`;
    else if (req.method === 'GET' && url.pathname === '/') return json({ ok: true, app: 'janja-sfu' });
    if (!path) return json({ errorCode: 'not_found' }, 404);

    let body;
    if (path !== 'sessions/new') {
      const text = await req.text();
      if (text.length > 200_000) return json({ errorCode: 'too_large' }, 413);
      body = text || undefined;
    }
    const r = await fetch(API + env.SFU_APP_ID + '/' + path, {
      method: req.method,
      headers: { authorization: 'Bearer ' + env.SFU_APP_TOKEN, 'content-type': 'application/json' },
      body,
    });
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'application/json', ...CORS } });
  },
};
