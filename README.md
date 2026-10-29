# janjahaters

Call de voz, stream de tela, música do YouTube Music junto, soundboard e chat para você e seus amigos.
Sem servidor: os PCs se conectam direto (WebRTC) e só entra quem tem o código de convite do grupo.

## Instalar

Baixe o `janjahaters-Setup-x.y.z.exe` da [última Release](https://github.com/Romeu-q/janjahaters-app/releases/latest) e abra.
O Windows pode avisar "O Windows protegeu o computador" porque o app não tem assinatura digital: clique em
**Mais informações → Executar assim mesmo**.

Na primeira vez, um cria o grupo e manda o código `JANJA-…` para os outros, que escolhem **Entrar com convite**.

## Atualizações

O app procura versão nova sozinho (ao abrir e a cada 30 minutos), baixa em segundo plano e mostra um botão
verde **Reiniciar** na barra de cima. Se ninguém clicar, a atualização é instalada quando o app for fechado.

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
