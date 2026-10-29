// Usado pelo workflow de release: grava oauth.json com o cliente OAuth do Google (vindo dos secrets).
// Sem os secrets, o app sai sem o botão "Entrar com Google".
import { writeFileSync } from 'node:fs';

const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
if (clientId && clientSecret) {
  writeFileSync('oauth.json', JSON.stringify({ clientId, clientSecret }));
  console.log('login com Google ativado');
} else {
  console.log('sem os secrets GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET: login com Google desligado');
}
