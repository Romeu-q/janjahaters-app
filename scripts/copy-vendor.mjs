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
