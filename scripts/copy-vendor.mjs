// Copia para renderer/vendor os arquivos que o navegador carrega por URL (worklets, wasm e modelos).
import { copyFileSync, mkdirSync } from 'node:fs';

// RNNoise (modo "Forte")
const rnn = 'node_modules/@sapphi-red/web-noise-suppressor/dist';
mkdirSync('renderer/vendor', { recursive: true });
copyFileSync(`${rnn}/rnnoise/workletProcessor.js`, 'renderer/vendor/rnnoiseWorklet.js');
copyFileSync(`${rnn}/rnnoise.wasm`, 'renderer/vendor/rnnoise.wasm');
copyFileSync(`${rnn}/rnnoise_simd.wasm`, 'renderer/vendor/rnnoise_simd.wasm');

// DeepFilterNet3 (modo "Máxima"): só o necessário dele, sem o DTLN/ONNX/Silero do mesmo pacote
const dfn = 'node_modules/@workadventure/noise-suppression/dist/assets';
mkdirSync('renderer/vendor/dfn', { recursive: true });
copyFileSync(`${dfn}/deepfilternet-worklet-processor.js`, 'renderer/vendor/dfn/worklet.js');
copyFileSync(`${dfn}/deepfilternet/df_bg.wasm`, 'renderer/vendor/dfn/df_bg.wasm');
copyFileSync(`${dfn}/deepfilternet/DeepFilterNet3_onnx.tar.gz`, 'renderer/vendor/dfn/DeepFilterNet3_onnx.tar.gz');

// Chave do servidor TURN (Cloudflare) que retransmite a call quando a conexão direta falha (CGNAT, 4G...).
// Não fica no repositório: vem das variáveis TURN_KEY_ID/TURN_API_TOKEN (GitHub Actions) ou de turn.json local.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
let turn = { id: process.env.TURN_KEY_ID || '', token: process.env.TURN_API_TOKEN || '' };
if (!turn.id && existsSync('turn.json')) turn = JSON.parse(readFileSync('turn.json', 'utf8'));
if (!turn.id) console.warn('aviso: sem chave TURN (turn.json ou TURN_KEY_ID/TURN_API_TOKEN) — quem estiver atrás de CGNAT pode não conectar');
writeFileSync('renderer/turn.gen.js', `export const TURN = ${JSON.stringify({ id: turn.id || '', token: turn.token || '' })};\n`);
