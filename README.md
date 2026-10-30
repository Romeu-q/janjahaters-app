# janjahaters

Call de voz, stream de tela, música do YouTube Music junto, soundboard e chat para você e seus amigos.
Sem servidor: os PCs se conectam direto (WebRTC) e só entra quem tem o código de convite do grupo.

## Instalar

Baixe o `janjahaters-Setup-x.y.z.exe` da [última Release](https://github.com/Romeu-q/janjahaters-app/releases/latest) e abra.
O Windows pode avisar "O Windows protegeu o computador" porque o app não tem assinatura digital: clique em
**Mais informações → Executar assim mesmo**.

Na primeira vez, um cria o grupo e manda o código `JANJA-…` para os outros, que escolhem **Entrar com convite**.

### Android

Baixe o `janjahaters-x.y.z.apk` da [última Release](https://github.com/Romeu-q/janjahaters-app/releases/latest) no
celular e abra. O Android pede para permitir instalar apps do navegador: permita só para essa instalação.
É o mesmo app do PC (call, chat, música, DJ, soundboard, perfil), com telas de celular. Não dá para transmitir a tela
do celular, mas dá para assistir as streams dos amigos. Com a tela desligada a call continua (aparece a notificação
"Na call"). Quando sai versão nova, aparece um botão verde para baixar; é só instalar por cima.

## Atualizações

O app procura versão nova sozinho (ao abrir e a cada 30 minutos), baixa em segundo plano e mostra um botão
verde **Reiniciar** na barra de cima. Se ninguém clicar, a atualização é instalada quando o app for fechado.

## Personalização

Tudo em **Configurações** (engrenagem embaixo à esquerda):

- **Perfil**: avatar e banner (GIF animado funciona), pronomes, status com emoji, "sobre mim", cor, degradê,
  fonte e efeito do nome, cores do cartão de perfil, decoração do avatar e efeito de partículas. Os amigos veem
  tudo ao clicar em você.
- **Aparência**: 8 temas, cor de destaque, imagem/GIF de fundo com transparência, tamanho e fonte do texto,
  cantos, mensagens compactas e menos animações.
- **Plugins**: plugins embutidos que ligam e desligam na hora (mensagens apagadas, volume até 300%, zoom nas
  imagens, clique duplo, digitação silenciosa, tempo de call…).
- **Temas e CSS**: importa temas `.theme.css` e tem um CSS rápido que aplica enquanto você digita.

Plugins e temas feitos para o Discord (Vencord/BetterDiscord) **não funcionam aqui**: eles mexem no código e nas
classes internas do Discord. O formato é o mesmo, então dá para adaptar.

### Fazer um tema

Um `.theme.css` com cabeçalho no estilo do BetterDiscord. As cores do app são variáveis CSS:

```css
/**
 * @name Meu tema
 * @author Você
 * @description Rosa com fundo escuro
 * @version 1.0.0
 */
:root {
  --accent: #ff4fa3;
  --bg: #120d10;
  --panel: #1a1317;
  --panel-2: #22181e;
}
```

Variáveis: `--bg`, `--panel`, `--panel-2`, `--panel-3`, `--line`, `--text`, `--muted`, `--faint`, `--input`,
`--code`, `--accent`, `--accent-2`, `--on-accent`, `--green`, `--red`.

### Fazer um plugin

Um `.plugin.js` com o mesmo cabeçalho e `module.exports = class { start() {} stop() {} }`.
O exemplo completo está em [`examples/exemplo.plugin.js`](examples/exemplo.plugin.js). A API fica em `janja`:

| Função | O que faz |
|---|---|
| `janja.me()` | `{ id, name, color }` |
| `janja.channel()` | canal aberto: `{ id, name, type }` |
| `janja.friends()` | amigos online: `[{ id, name, inCall }]` |
| `janja.send(texto, canal?)` | manda mensagem (no canal aberto ou no chat da call) |
| `janja.messages(canal?)` | mensagens do canal |
| `janja.onMessage(fn)` | chamada a cada mensagem nova: `{ id, channel, author, authorId, text, mine, bot, time }` |
| `janja.on('join' \| 'leave', fn)` | alguém entrou/saiu da sua call |
| `janja.command(nome, descrição, fn)` | cria `/nome` no chat; `fn(argumento)` pode devolver um texto que só você vê |
| `janja.addCSS(id, css)` / `janja.removeCSS(id)` | CSS do plugin |
| `janja.storage.get(chave, padrão)` / `.set(chave, valor)` | dados do plugin, só neste PC |
| `janja.toast(texto)` | aviso rápido na tela |

Tudo o que o plugin registra é desfeito sozinho quando ele é desligado. **Plugins rodam com acesso total ao
app: só instale de quem você confia.**

## Login com Google (opcional)

Quem quiser entra com a conta Google: o app usa o nome e a foto, e os amigos veem um selo azul
(o app de cada um confere a assinatura do Google, então ninguém consegue fingir ser outra conta).
Quem não quiser continua entrando só com um nome.

Para ligar o botão, o dono do repositório cria um cliente OAuth uma vez:

1. Em [console.cloud.google.com](https://console.cloud.google.com/), crie um projeto (ex.: `janjahaters`).
2. **APIs e serviços → Tela de consentimento OAuth** (ou "Google Auth Platform"): tipo **Externo**, nome `janjahaters`,
   seu e-mail como suporte. Escopos: só os padrão (`openid`, `email`, `profile`). Depois clique em **Publicar app**
   (com esses escopos não precisa de verificação do Google). Se preferir deixar em teste, adicione o Gmail de cada amigo
   em "Usuários de teste".
3. **Credenciais → Criar credenciais → ID do cliente OAuth → App para computador**. Copie o ID e a chave secreta.
4. No GitHub, em **Settings → Secrets and variables → Actions**, crie `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

A próxima versão publicada já sai com o botão "Entrar com Google". Para testar no modo de desenvolvimento,
defina as variáveis de ambiente `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` antes do `npm start`.

## Desenvolvimento

```bash
npm install
npm start
```

Para testar dois "amigos" no mesmo PC, abra um segundo terminal com `$env:JANJA_PROFILE='2'; npx electron .`.

### App Android

O app Android usa a mesma interface (`renderer/`) dentro do Capacitor. `mobile/bridge.js` faz no celular o papel do
`main.js`/`preload.js` (busca no YouTube, atualização, convite por link, serviço "Na call"). O APK é montado pelo
GitHub Actions junto com o instalador do Windows. Para montar localmente precisa do Android Studio:

```bash
npm run build:mobile
npx cap open android
```

A assinatura usa a chave dos secrets `ANDROID_KEYSTORE_B64` e `ANDROID_KEYSTORE_PASSWORD`. Ela tem que ser sempre a
mesma; se trocar, quem já tem o app precisa desinstalar e instalar de novo.

### Publicar uma versão nova

```bash
npm run release
```

Isso sobe a versão (1.0.0 → 1.0.1), cria a tag e envia para o GitHub. O workflow
`.github/workflows/release.yml` monta o instalador e publica a Release; os apps instalados se atualizam sozinhos.

## Créditos

Ícone: recorte da foto oficial do Presidente Luiz Inácio Lula da Silva, por Ricardo Stuckert/PR,
via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Foto_oficial_do_Presidente_da_Rep%C3%BAblica_Luiz_In%C3%A1cio_Lula_da_Silva.jpg),
licença [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). A imagem foi recortada e reduzida.
