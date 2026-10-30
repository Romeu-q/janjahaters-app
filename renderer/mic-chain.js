// Caminho do som do microfone, usado pela call e pelo banco de testes (ns-lab.html).
//
//   mic -> corte de grave (100 Hz no DFN, 80 Hz nos outros) -> removedor de ruído -> portão de sensibilidade
//       -> limitador (só fora do DFN) -> amigos
//
// Removedor de ruído (um só, nunca dois empilhados):
//   'dfn'      DeepFilterNet3 (rede neural, 48 kHz). Tira teclado mesmo com a pessoa falando e tem um
//              portão próprio para as pausas, que olha 30 ms à frente para não cortar o começo das palavras.
//   'rnnoise'  RNNoise (rede neural pequena): mais leve, tira menos teclado.
//   'none'     nada (a supressão do próprio navegador/WebRTC pode estar ligada no getUserMedia).
// Se o DeepFilterNet3 não carregar, cai para o RNNoise sozinho.
import { loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import { createDeepFilterNetAudioWorklet } from '@workadventure/noise-suppression/deepfilternet';

export const DFN_URLS = {
  moduleUrl: 'vendor/dfn/worklet.js',
  wasmUrl: 'vendor/dfn/df_bg.wasm',
  modelUrl: 'vendor/dfn/DeepFilterNet3_onnx.tar.gz',
};

// worklets carregados por AudioContext (addModule só uma vez em cada um)
const modules = new WeakMap();
function loadModule(ctx, url) {
  if (!modules.has(ctx)) modules.set(ctx, new Map());
  const m = modules.get(ctx);
  if (!m.has(url))
    m.set(
      url,
      ctx.audioWorklet.addModule(url).catch((err) => {
        m.delete(url);
        throw err;
      }),
    );
  return m.get(url);
}
let rnnoiseWasm = null;
async function rnnoiseNode(ctx) {
  rnnoiseWasm ||= loadRnnoise({ url: 'vendor/rnnoise.wasm', simdUrl: 'vendor/rnnoise_simd.wasm' }).catch((err) => {
    rnnoiseWasm = null;
    throw err;
  });
  const [wasm] = await Promise.all([rnnoiseWasm, loadModule(ctx, 'vendor/rnnoiseWorklet.js')]);
  const node = new RnnoiseWorkletNode(ctx, { wasmBinary: wasm, maxChannels: 1 });
  return { node, dispose: () => node.destroy() };
}
// opções do DeepFilterNet3 usadas na call (o banco de testes compara variações)
// Escolhidas no banco de testes (ns-lab.html?variantes):
//  - minSpeechFrames 2: 2 quadros de fala seguidos para abrir o portão; tecla sozinha não abre
//  - speechAttenuationDb 30 (padrão 25): tira um pouco mais de ruído durante a fala sem piorar a voz
//  - postGain desligado: o nivelador depois do modelo deixava vazar mais teclado com digitação intensa
//    (o ganho automático do navegador também fica desligado: ele aumentaria o teclado antes do modelo)
export const DFN_OPTIONS = {
  minSpeechFrames: 2,
  speechAttenuationDb: 30,
  postGain: false,
};
async function dfnNode(ctx, onOverload, extra) {
  const w = await createDeepFilterNetAudioWorklet(ctx, { ...DFN_URLS, ...DFN_OPTIONS, ...extra, onOverload });
  await w.ready;
  return { node: w.node, dispose: () => w.dispose() };
}

// gate: { on, auto, db } das configurações. No DeepFilterNet3 o "automático" é o portão do próprio modelo;
// o nosso portão só entra se a pessoa escolher a sensibilidade na mão.
export function gateParams(engine, gate) {
  const ours = engine === 'dfn' ? gate.on && !gate.auto : gate.on;
  return { on: ours, auto: gate.auto, thr: gate.db };
}

/**
 * Monta o caminho entre `input` (um nó de áudio) e a saída. Não conecta a saída em lugar nenhum.
 * @returns {{ output: AudioNode, gate: AudioWorkletNode, engine: string, dispose(): void }}
 */
export async function buildMicChain(ctx, input, { engine = 'dfn', gate = { on: true, auto: true, db: -50 }, onOverload, dfn, lowCutHz = engine === 'dfn' ? 100 : 80, limiter: useLimiter = engine !== 'dfn' } = {}) {
  await loadModule(ctx, 'gate-worklet.js');
  let den = null;
  let used = engine;
  if (engine === 'dfn') {
    try {
      den = await dfnNode(ctx, onOverload, dfn);
    } catch (err) {
      console.warn('DeepFilterNet3 não carregou, usando RNNoise', err);
      used = 'rnnoise';
    }
  }
  if (used === 'rnnoise') den = await rnnoiseNode(ctx);

  // batida na mesa e vibração do teclado ficam quase todas abaixo de 80 Hz; a voz quase não usa essa faixa
  const lowCut = ctx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = lowCutHz || 10;
  lowCut.Q.value = 0.7;
  const gateNode = new AudioWorkletNode(ctx, 'janja-gate', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
  gateNode.port.postMessage(gateParams(used, gate));
  // limitador (RNNoise/sem supressão): estalo alto não chega estourado. No DeepFilterNet3 fica de fora:
  // o ganho de compensação do compressor levantava o resíduo de ruído nas pausas e somava 6 ms
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 4;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;

  let chain = input.connect(lowCut);
  if (den) chain = chain.connect(den.node);
  chain = chain.connect(gateNode);
  if (useLimiter) chain = chain.connect(limiter);
  return {
    output: chain,
    gate: gateNode,
    engine: used,
    dispose() {
      input.disconnect(lowCut);
      for (const n of [lowCut, den?.node, gateNode, limiter]) n?.disconnect();
      den?.dispose();
      gateNode.port.close();
    },
  };
}
