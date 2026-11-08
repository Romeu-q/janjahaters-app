/**
 * FFT radix-2 iterativa (Cooley–Tukey), implementação própria do Janja Voice.
 * Sem dependências: roda tanto no AudioWorklet quanto no Node (testes).
 */
export class FFT {
  readonly size: number;
  readonly bins: number;
  private readonly cos: Float64Array;
  private readonly sin: Float64Array;
  private readonly rev: Uint32Array;
  // buffers de trabalho
  private readonly re: Float64Array;
  private readonly im: Float64Array;

  constructor(size: number) {
    if (size < 2 || (size & (size - 1)) !== 0) {
      throw new Error("FFT size must be a power of two");
    }
    this.size = size;
    this.bins = size / 2 + 1;
    this.cos = new Float64Array(size / 2);
    this.sin = new Float64Array(size / 2);
    for (let i = 0; i < size / 2; i++) {
      this.cos[i] = Math.cos((2 * Math.PI * i) / size);
      this.sin[i] = -Math.sin((2 * Math.PI * i) / size);
    }
    this.rev = new Uint32Array(size);
    const bits = Math.log2(size);
    for (let i = 0; i < size; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
      this.rev[i] = r;
    }
    this.re = new Float64Array(size);
    this.im = new Float64Array(size);
  }

  /** FFT complexa in-place. inverse=true calcula a IFFT (já normalizada por 1/N). */
  private transform(re: Float64Array, im: Float64Array, inverse: boolean): void {
    const n = this.size;
    const rev = this.rev;
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    const sign = inverse ? -1 : 1;
    for (let len = 2; len <= n; len <<= 1) {
      const half = len >> 1;
      const step = n / len;
      for (let start = 0; start < n; start += len) {
        for (let k = 0; k < half; k++) {
          const wr = this.cos[k * step];
          const wi = sign * this.sin[k * step];
          const a = start + k;
          const b = a + half;
          const xr = re[b] * wr - im[b] * wi;
          const xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr;
          im[b] = im[a] - xi;
          re[a] += xr;
          im[a] += xi;
        }
      }
    }
    if (inverse) {
      const inv = 1 / n;
      for (let i = 0; i < n; i++) {
        re[i] *= inv;
        im[i] *= inv;
      }
    }
  }

  /** Sinal real (size amostras) -> espectro com bins = size/2+1. */
  forward(input: ArrayLike<number>, outRe: Float64Array, outIm: Float64Array): void {
    const re = this.re;
    const im = this.im;
    for (let i = 0; i < this.size; i++) {
      re[i] = input[i];
      im[i] = 0;
    }
    this.transform(re, im, false);
    for (let k = 0; k < this.bins; k++) {
      outRe[k] = re[k];
      outIm[k] = im[k];
    }
  }

  /** Espectro hermitiano (bins) -> sinal real (size amostras). */
  inverse(inRe: Float64Array, inIm: Float64Array, output: Float64Array): void {
    const n = this.size;
    const re = this.re;
    const im = this.im;
    for (let k = 0; k < this.bins; k++) {
      re[k] = inRe[k];
      im[k] = inIm[k];
    }
    for (let k = this.bins; k < n; k++) {
      re[k] = inRe[n - k];
      im[k] = -inIm[n - k];
    }
    this.transform(re, im, true);
    for (let i = 0; i < n; i++) output[i] = re[i];
  }
}
