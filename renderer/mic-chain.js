// Caminho do som do microfone, usado pela call e pelo banco de testes (ns-lab.html).
//
//   mic -> corte de grave (80 Hz) -> anti-impacto -> RNNoise -> portão (sensibilidade) -> limitador -> amigos
//
// O anti-impacto (gate-worklet.js, só com 5 ms de atraso) abaixa estalo de tecla e batida na mesa ANTES do
// RNNoise, inclusive com você falando, que é onde o RNNoise mais deixa passar. O portão fica DEPOIS: decide
// pelo som já limpo (no banco de testes, o portão antes do RNNoise piorava a voz com ventilador ligado).
// Removedor de ruído: 'rnnoise' (rede neural pequena, 48 kHz) ou 'none' (a supressão do próprio
// navegador/WebRTC pode estar ligada no getUserMedia).
import { loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';

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

// gate: { on, auto, db, impact } das configurações
export function gateParams(engine, gate) {
  return { on: !!gate.on, auto: gate.auto, thr: gate.db, impact: gate.impact !== false, ...(gate.ratio ? { ratio: gate.ratio } : {}) };
}

/**
 * Monta o caminho entre `input` (um nó de áudio) e a saída. Não conecta a saída em lugar nenhum.
 * `gatePos` 'post' (sem anti-impacto) e 'pre' (portão antes do RNNoise) só existem para o banco de testes comparar.
 * @returns {{ output: AudioNode, gate: AudioWorkletNode, engine: string, setGate(gate): void, dispose(): void }}
 */
export async function buildMicChain(ctx, input, { engine = 'rnnoise', gate = { on: true, auto: true, db: -50 }, lowCutHz = 80, limiter: useLimiter = true, gatePos = 'split' } = {}) {
  await loadModule(ctx, 'gate-worklet.js');
  const den = engine === 'rnnoise' ? await rnnoiseNode(ctx) : null;

  // batida na mesa e vibração do teclado ficam quase todas abaixo de 80 Hz; a voz quase não usa essa faixa
  const lowCut = ctx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = lowCutHz || 10;
  lowCut.Q.value = 0.7;
  const gateNode = new AudioWorkletNode(ctx, 'janja-gate', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
  // limitador: estalo alto não chega estourado
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 4;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;

  const impactNode = gatePos === 'split' ? new AudioWorkletNode(ctx, 'janja-gate', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { lookMs: 5 } }) : null;
  // o mesmo processador faz as duas coisas: no 'split', um só abaixa estalos e o outro só é o portão
  const setGate = (g) => {
    const p = gateParams(engine, g);
    if (impactNode) {
      impactNode.port.postMessage({ ...p, on: false });
      gateNode.port.postMessage({ ...p, impact: false });
    } else gateNode.port.postMessage(gatePos === 'post' ? { ...p, impact: false } : p);
  };
  setGate(gate);
  let chain = input.connect(lowCut);
  const order = gatePos === 'split' ? [impactNode, den?.node, gateNode] : gatePos === 'post' ? [den?.node, gateNode] : [gateNode, den?.node];
  for (const n of order) if (n) chain = chain.connect(n);
  if (useLimiter) chain = chain.connect(limiter);
  return {
    output: chain,
    gate: gateNode,
    engine,
    setGate,
    dispose() {
      input.disconnect(lowCut);
      for (const n of [lowCut, impactNode, den?.node, gateNode, limiter]) n?.disconnect();
      den?.dispose();
      gateNode.port.close();
      impactNode?.port.close();
    },
  };
}
