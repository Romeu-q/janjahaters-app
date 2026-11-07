# janja-bot-gateway

Roda **bots feitos para o [Stoat](https://github.com/stoatchat)** (antigo Revolt) dentro de um grupo do
janjahaters. O bot usa a biblioteca do Stoat normalmente (`stoat.js` ou qualquer outra que fale a API do
Stoat); só o endereço muda.

```
seu bot (stoat.js)  ⇄  janja-bot-gateway (localhost:14700)  ⇄  grupo do janja (P2P)
```

O gateway entra no grupo como mais uma pessoa (com a própria chave e a etiqueta **BOT**). Ele traduz a API
do Stoat para as mensagens, reações, canais, categorias e cargos do janja.

## Como usar

Precisa do Node 22 ou mais novo. Pode rodar em qualquer PC ou num servidor (a máquina da Oracle serve).

```bash
cd bot-gateway
npm install
node index.mjs --code JANJA-XXXX-XXXX --name "MeuBot"
```

O código é o mesmo do convite do grupo. Na primeira vez o gateway mostra três coisas:

- o **id** do bot;
- o endereço da **API** (`http://127.0.0.1:14700`);
- o **token**.

Tudo fica guardado em `./janja-bot`: a chave do bot, o token e as mensagens. **Não compartilhe essa
pasta**, porque quem tiver ela é o bot. Da próxima vez basta `node index.mjs`.

Depois, no seu bot:

```js
import { Client } from 'stoat.js';

const client = new Client({ baseURL: 'http://127.0.0.1:14700' });
client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    await message.react('🏓');
    await message.reply('pong!');
  }
});
client.loginBot('TOKEN-QUE-O-GATEWAY-MOSTROU');
```

Tem um exemplo completo em [`exemplo-ping.mjs`](exemplo-ping.mjs):

```bash
JANJA_BOT_TOKEN=... node exemplo-ping.mjs
```

## Opções

| opção     | o que faz                                                       | padrão        |
|-----------|-----------------------------------------------------------------|---------------|
| `--code`  | código de convite do grupo                                      | (1ª vez)      |
| `--name`  | nome do bot                                                     | `Bot`         |
| `--color` | cor do nome (`#rrggbb`)                                         | `#7c5cff`     |
| `--port`  | porta da API                                                    | `14700`       |
| `--host`  | endereço da API (`0.0.0.0` abre para a rede: cuidado com o token) | `127.0.0.1` |
| `--data`  | pasta dos dados                                                 | `./janja-bot` |
| `--token` | usar um token seu                                               | gerado        |
| `--turn`  | arquivo JSON com servidores TURN (`iceServers`)                 | nenhum        |

Também dá para passar tudo por variáveis de ambiente: `JANJA_BOT_CODE`, `JANJA_BOT_NAME`, `JANJA_BOT_PORT`...

## Permissões

O bot é tratado como qualquer pessoa do grupo:

- O dono pode dar cargos a ele, ou banir.
- Sem permissão, a API responde `403 {"type":"MissingPermission"}`, igual ao Stoat.
- Mesmo que alguém altere o gateway, os outros PCs recusam o que o bot não pode fazer.

## O que funciona

O grupo aparece como **um servidor** do Stoat (`01JANJAHATERS0000000000000`).

**WebSocket ("Bonfire")**
- `Authenticate`, `Ready`, `Ping`/`Pong`, `BeginTyping`
- Mensagens: `Message`, `MessageUpdate`, `MessageDelete`, `MessageReact`, `MessageUnreact`
- Canais: `ChannelCreate`, `ChannelUpdate`, `ChannelDelete`, `ChannelStartTyping`
- Servidor: `ServerUpdate`, `ServerRoleUpdate`, `ServerRoleDelete`
- Membros e usuários: `ServerMemberJoin`, `ServerMemberUpdate`, `ServerMemberLeave`, `UserPresence`, `UserUpdate`
- Emojis: `EmojiCreate`, `EmojiDelete`

**REST**
- `GET /`, `GET /users/@me`, `GET /users/:id`
- `GET /channels/:id`, `PATCH /channels/:id`, `DELETE /channels/:id`, `POST /servers/:id/channels`
- `GET|POST /channels/:id/messages`, `POST /channels/:id/search`
- `GET|PATCH|DELETE /channels/:id/messages/:id`, `DELETE /channels/:id/messages/bulk`
- `PUT|DELETE .../reactions/:emoji`, `POST|DELETE .../pin`
- `GET /servers/:id`, `GET /servers/:id/members[/:user]`, `PATCH /servers/:id/members/:user` (cargos e
  timeout), `DELETE /servers/:id/members/:user` (expulsar)
- `GET /servers/:id/bans`, `PUT|DELETE /servers/:id/bans/:user`, `POST /servers/:id/roles`

**Como o conteúdo é traduzido**
- Respostas (`replies`) viram respostas de verdade no janja.
- `masquerade` troca o nome e a cor da mensagem.
- `embeds` viram uma citação em markdown.
- `<@id>` vira `@Nome`.

## O que não funciona

Coisas que não fazem sentido num grupo P2P sem servidor:

- contas e login de usuário;
- criar servidores e convites;
- DMs e amigos pela API;
- webhooks;
- enviar arquivos;
- voz para bots.

Essas rotas respondem `501 {"type":"NotImplemented"}` com a explicação.

O bot só recebe o que acontece **enquanto o gateway está ligado**. Ao voltar, ele sincroniza com quem estiver
online, como o app.
