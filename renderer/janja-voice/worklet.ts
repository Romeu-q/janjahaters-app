/**
 * AudioWorklet do Janja Voice.
 * Entrada 0: microfone. Entrada 1: o que está tocando nos alto-falantes (referência do eco).
 * Saída 0: voz limpa (mono).
 */
import { JanjaVoiceEngine, HOP, type VoiceEngineSettings } from "./janjaVoiceEngine.ts";
import { parseModel } from "./janjaNeural.ts";

declare const sampleRate: number;
declare function registerProcessor(name: string, ctor: unknown): void;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: unknown);
}

const QUANTUM = 128;

class JanjaVoiceWorklet extends AudioWorkletProcessor {
  private readonly engine: JanjaVoiceEngine;
  private readonly micBuf = new Float32Array(HOP);
  private readonly farBuf = new Float32Array(HOP);
  private outBuf = new Float32Array(HOP);
  private nextOut = new Float32Array(HOP);
  private fill = 0;
  private outPos = 0;
  private farActive = false;
  private blocks = 0;
  private alive = true;

  constructor(options: { processorOptions?: { settings?: Partial<VoiceEngineSettings>; model?: ArrayBuffer } }) {
    super(options);
    this.engine = new JanjaVoiceEngine(sampleRate, options?.processorOptions?.settings ?? {});
    this.loadModel(options?.processorOptions?.model);
    this.port.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as { type: string; settings?: Partial<VoiceEngineSettings> };
      if (msg.type === "settings" && msg.settings) this.engine.updateSettings(msg.settings);
      else if (msg.type === "dispose") this.alive = false;
      else if (msg.type === "model") this.loadModel((msg as { model?: ArrayBuffer }).model);
    };
  }

  private loadModel(buf?: ArrayBuffer): void {
    if (!buf) return;
    try {
      this.engine.setModel(parseModel(buf));
      this.port.postMessage({ type: "model", ok: true });
    } catch (err) {
      this.port.postMessage({ type: "model", ok: false, error: String(err) });
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const mic = inputs[0]?.[0];
    const farCh = inputs[1];
    const out = outputs[0]?.[0];
    if (!out) return this.alive;

    // acumula 128 amostras do mic e do far-end
    let farHasSignal = false;
    for (let i = 0; i < QUANTUM; i++) {
      this.micBuf[this.fill + i] = mic ? mic[i] : 0;
      let f = 0;
      if (farCh && farCh.length) {
        for (let c = 0; c < farCh.length; c++) f += farCh[c][i];
        f /= farCh.length;
      }
      if (f !== 0) farHasSignal = true;
      this.farBuf[this.fill + i] = f;
    }
    if (farHasSignal) this.farActive = true;

    // emite o bloco processado anterior (latência fixa de HOP amostras)
    out.set(this.outBuf.subarray(this.outPos, this.outPos + QUANTUM));
    this.outPos += QUANTUM;
    this.fill += QUANTUM;

    if (this.fill >= HOP) {
      this.engine.process(this.micBuf, this.farActive ? this.farBuf : null, this.nextOut);
      const t = this.outBuf;
      this.outBuf = this.nextOut;
      this.nextOut = t;
      this.fill = 0;
      this.outPos = 0;
      // ~8 atualizações por segundo para a UI
      if (++this.blocks % 24 === 0) {
        this.port.postMessage({ type: "stats", stats: { ...this.engine.getStats(), neural: this.engine.hasModel } });
      }
    }
    return this.alive;
  }
}

registerProcessor("janja-voice", JanjaVoiceWorklet);
