// Copia para renderer/vendor os arquivos que o navegador carrega por URL (worklet e wasm do RNNoise).
import { copyFileSync, mkdirSync } from 'node:fs';

const src = 'node_modules/@sapphi-red/web-noise-suppressor/dist';
mkdirSync('renderer/vendor', { recursive: true });
copyFileSync(`${src}/rnnoise/workletProcessor.js`, 'renderer/vendor/rnnoiseWorklet.js');
copyFileSync(`${src}/rnnoise.wasm`, 'renderer/vendor/rnnoise.wasm');
copyFileSync(`${src}/rnnoise_simd.wasm`, 'renderer/vendor/rnnoise_simd.wasm');
