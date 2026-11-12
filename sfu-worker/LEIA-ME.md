# Streams pelo SFU da Cloudflare

Com o SFU, quem transmite manda **uma cópia só** da stream para a Cloudflare, que repassa para cada pessoa que
assiste. Sem ele, o PC de quem transmite codifica e envia uma cópia por pessoa (é isso que sobe o ping em PC fraco).

A voz e a câmera continuam indo direto entre os PCs. Se o SFU falhar (Worker fora do ar, cota acabou, rede que
bloqueia), a stream volta a ir direto sozinha.

## Passo a passo (uma vez só)

1. **Criar o app do SFU**
   No painel da Cloudflare, abra **Realtime** (o antigo "Calls") → **Serverless SFU** → **Create**.
   Dê o nome `janja`. Anote o **App ID** e o **App Secret** (o secret só aparece uma vez).

2. **Criar o Worker**
   **Workers & Pages** → **Create** → **Create Worker** → nome `janja-sfu` → **Deploy**.
   Depois **Edit code**, apague o código de exemplo, cole o conteúdo de `worker.js` (esta pasta) e clique em **Deploy**.

3. **Guardar a chave no Worker**
   No Worker: **Settings** → **Variables and Secrets** → **Add**:
   - `SFU_APP_ID` do tipo **Text**, com o App ID;
   - `SFU_APP_TOKEN` do tipo **Secret**, com o App Secret.
   Clique em **Deploy** de novo.

4. **Conferir**
   Abra o endereço do Worker no navegador (algo como `https://janja-sfu.SEU-NOME.workers.dev/`).
   Tem que aparecer `{"ok":true,"app":"janja-sfu"}`.

5. **Dizer ao app onde está o Worker**
   No GitHub: repositório → **Settings** → **Secrets and variables** → **Actions** → aba **Variables** →
   **New repository variable**: nome `SFU_URL`, valor o endereço do Worker (sem a barra no fim).
   Para testar no seu PC sem publicar: crie `sfu.json` na raiz do projeto com `{ "url": "https://..." }`.

6. A próxima versão publicada já sai usando o SFU.

## Custo

- 1.000 GB por mês grátis, somando SFU e TURN. Depois, US$ 0,05 por GB.
- Só conta o que sai da Cloudflare para quem assiste. Uma stream 1080p gasta uns 2,5 a 3 GB por hora para cada
  pessoa assistindo.
- O endereço do Worker fica dentro do app, então alguém que desmonte o app pode usar o seu SFU. A Cloudflare não
  tem limite de gasto automático para o Realtime: vale ligar um aviso de cobrança em **Billing → Notifications**.
