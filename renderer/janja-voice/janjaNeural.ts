/**
 * Inferência da rede Janja Voice (treinada em training/train.py) — sem dependências.
 * Espelha exatamente training/janja_dsp.py e o JanjaNet do PyTorch:
 *   Dense(48->64, tanh) -> GRU(96) -> GRU(96) -> Dense([h1,h2] 192->24, sigmoid)
 */
export const BAND_CENTERS = [0, 1, 2, 3, 4, 5, 7, 9, 10, 13, 15, 17, 20, 23, 27, 31, 36, 40, 46, 52, 59, 67, 75, 85];
export const NB = BAND_CENTERS.length;
export const TOP_BIN = BAND_CENTERS[NB - 1];
const NFEAT = NB * 2;
const ENERGY_FLOOR = 1e-10;
const LOG_OFFSET = 6;
const LOG_SCALE = 1 / 3;

interface TensorInfo { shape: number[]; offset: number }
interface ModelHeader { version: number; bands: number[]; tensors: Record<string, TensorInfo> }

export interface JanjaModelWeights {
  header: ModelHeader;
  data: Float32Array;
}

/** Lê o arquivo .bin exportado pelo treino ("JVM1" | u32 len | JSON | float32[]). */
export function parseModel(buf: ArrayBuffer): JanjaModelWeights {
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== "JVM1") throw new Error("Modelo Janja Voice inválido");
  const hlen = dv.getUint32(4, true);
  // TextDecoder não existe no AudioWorkletGlobalScope; o cabeçalho é ASCII puro
  const bytes = new Uint8Array(buf, 8, hlen);
  let json = "";
  for (let i = 0; i < bytes.length; i++) json += String.fromCharCode(bytes[i]);
  const header = JSON.parse(json) as ModelHeader;
  if (header.bands.join(",") !== BAND_CENTERS.join(",")) throw new Error("Bandas do modelo não batem com o app");
  const data = new Float32Array(buf.slice(8 + hlen));
  return { header, data };
}

class GRU {
  readonly hidden: number;
  private readonly inSize: number;
  private readonly Wih: Float32Array; // (3H x in)  ordem r, z, n
  private readonly Whh: Float32Array; // (3H x H)
  private readonly bih: Float32Array;
  private readonly bhh: Float32Array;
  readonly h: Float64Array;
  private readonly gi: Float64Array;
  private readonly gh: Float64Array;

  constructor(get: (n: string) => Float32Array, prefix: string, inSize: number, hidden: number) {
    this.inSize = inSize;
    this.hidden = hidden;
    this.Wih = get(`${prefix}.weight_ih_l0`);
    this.Whh = get(`${prefix}.weight_hh_l0`);
    this.bih = get(`${prefix}.bias_ih_l0`);
    this.bhh = get(`${prefix}.bias_hh_l0`);
    this.h = new Float64Array(hidden);
    this.gi = new Float64Array(3 * hidden);
    this.gh = new Float64Array(3 * hidden);
  }

  reset(): void { this.h.fill(0); }

  step(x: Float64Array): void {
    const H = this.hidden, I = this.inSize;
    for (let r = 0; r < 3 * H; r++) {
      let a = this.bih[r];
      const o = r * I;
      for (let c = 0; c < I; c++) a += this.Wih[o + c] * x[c];
      this.gi[r] = a;
      let b = this.bhh[r];
      const o2 = r * H;
      for (let c = 0; c < H; c++) b += this.Whh[o2 + c] * this.h[c];
      this.gh[r] = b;
    }
    for (let j = 0; j < H; j++) {
      const r = sigmoid(this.gi[j] + this.gh[j]);
      const z = sigmoid(this.gi[H + j] + this.gh[H + j]);
      const n = Math.tanh(this.gi[2 * H + j] + r * this.gh[2 * H + j]);
      this.h[j] = (1 - z) * n + z * this.h[j];
    }
  }
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Pesos triangulares de banda (mesma definição de janja_dsp.band_matrix). */
function bandWeights(K: number): { lo: Int32Array; hi: Int32Array; w: Float64Array[] } {
  const c = BAND_CENTERS;
  const lo = new Int32Array(NB), hi = new Int32Array(NB);
  const w: Float64Array[] = [];
  for (let b = 0; b < NB; b++) {
    const row = new Float64Array(K);
    for (let k = 0; k < K; k++) {
      if (k === c[b]) row[k] = 1;
      else if (b > 0 && k > c[b - 1] && k < c[b]) row[k] = (k - c[b - 1]) / (c[b] - c[b - 1]);
      else if (b < NB - 1 && k > c[b] && k < c[b + 1]) row[k] = (c[b + 1] - k) / (c[b + 1] - c[b]);
    }
    lo[b] = b > 0 ? c[b - 1] : 0;
    hi[b] = b < NB - 1 ? c[b + 1] : c[b];
    w.push(row);
  }
  return { lo, hi, w };
}

export class JanjaNeural {
  private readonly K: number;
  private readonly bw: ReturnType<typeof bandWeights>;
  private readonly inW: Float32Array;
  private readonly inB: Float32Array;
  private readonly outW: Float32Array;
  private readonly outB: Float32Array;
  private readonly gru1: GRU;
  private readonly gru2: GRU;
  private readonly feat = new Float64Array(NFEAT);
  private readonly prevLog = new Float64Array(NB);
  private first = true;
  private readonly h0 = new Float64Array(64);
  private readonly cat = new Float64Array(192);
  /** Ganho previsto por banda (0..1) no último frame. */
  readonly bandGain = new Float64Array(NB);
  readonly bandEnergy = new Float64Array(NB);

  constructor(weights: JanjaModelWeights, K: number) {
    this.K = K;
    this.bw = bandWeights(K);
    const get = (name: string): Float32Array => {
      const t = weights.header.tensors[name];
      if (!t) throw new Error(`tensor ausente no modelo: ${name}`);
      const n = t.shape.reduce((a, b) => a * b, 1);
      return weights.data.subarray(t.offset, t.offset + n);
    };
    this.inW = get("inp.weight");
    this.inB = get("inp.bias");
    this.outW = get("out.weight");
    this.outB = get("out.bias");
    this.gru1 = new GRU(get, "gru1", 64, 96);
    this.gru2 = new GRU(get, "gru2", 96, 96);
  }

  reset(): void {
    this.gru1.reset();
    this.gru2.reset();
    this.first = true;
  }

  /**
   * @param power |X_k|^2 / N^2 do frame atual (K bins) — mesma normalização do treino.
   * Preenche bandGain.
   */
  step(power: ArrayLike<number>): void {
    const { lo, hi, w } = this.bw;
    for (let b = 0; b < NB; b++) {
      let e = 0;
      const row = w[b];
      for (let k = lo[b]; k <= hi[b]; k++) e += row[k] * power[k];
      this.bandEnergy[b] = e;
      const l = (Math.log10(e + ENERGY_FLOOR) + LOG_OFFSET) * LOG_SCALE;
      this.feat[b] = l;
      this.feat[NB + b] = this.first ? 0 : l - this.prevLog[b];
      this.prevLog[b] = l;
    }
    this.first = false;

    for (let j = 0; j < 64; j++) {
      let a = this.inB[j];
      const o = j * NFEAT;
      for (let c = 0; c < NFEAT; c++) a += this.inW[o + c] * this.feat[c];
      this.h0[j] = Math.tanh(a);
    }
    this.gru1.step(this.h0);
    this.gru2.step(this.gru1.h);
    this.cat.set(this.gru1.h, 0);
    this.cat.set(this.gru2.h, 96);
    for (let b = 0; b < NB; b++) {
      let a = this.outB[b];
      const o = b * 192;
      for (let c = 0; c < 192; c++) a += this.outW[o + c] * this.cat[c];
      this.bandGain[b] = sigmoid(a);
    }
  }

  /** Interpola o ganho das bandas para cada bin (bins acima de TOP_BIN recebem a última banda). */
  binGains(out: Float64Array): void {
    const { w } = this.bw;
    for (let k = 0; k < this.K; k++) {
      if (k > TOP_BIN) { out[k] = this.bandGain[NB - 1]; continue; }
      let g = 0;
      for (let b = 0; b < NB; b++) {
        const v = w[b][k];
        if (v) g += v * this.bandGain[b];
      }
      out[k] = g;
    }
  }
}
