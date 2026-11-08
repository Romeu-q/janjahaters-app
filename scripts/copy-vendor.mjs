// Copia para renderer/vendor os arquivos que o navegador carrega por URL (worklets, wasm e modelos).
import { copyFileSync, mkdirSync } from 'node:fs';

// RNNoise (modo "Forte")
const rnn = 'node_modules/@sapphi-red/web-noise-suppressor/dist';
mkdirSync('renderer/vendor', { recursive: true });
copyFileSync(`${rnn}/rnnoise/workletProcessor.js`, 'renderer/vendor/rnnoiseWorklet.js');
copyFileSync(`${rnn}/rnnoise.wasm`, 'renderer/vendor/rnnoise.wasm');
copyFileSync(`${rnn}/rnnoise_simd.wasm`, 'renderer/vendor/rnnoise_simd.wasm');


// Chave do servidor TURN (Cloudflare) que retransmite a call quando a conexão direta falha (CGNAT, 4G...).
// Não fica no repositório: vem das variáveis TURN_KEY_ID/TURN_API_TOKEN (GitHub Actions) ou de turn.json local.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
let turn = { id: process.env.TURN_KEY_ID || '', token: process.env.TURN_API_TOKEN || '' };
if (!turn.id && existsSync('turn.json')) turn = JSON.parse(readFileSync('turn.json', 'utf8'));
if (!turn.id) console.warn('aviso: sem chave TURN (turn.json ou TURN_KEY_ID/TURN_API_TOKEN) — quem estiver atrás de CGNAT pode não conectar');
writeFileSync('renderer/turn.gen.js', `export const TURN = ${JSON.stringify({ id: turn.id || '', token: turn.token || '' })};\n`);
