/**
 * Janja Voice Engine — motor de voz próprio do janjahaters.
 *
 * Pipeline por bloco de HOP amostras (mono):
 *   mic ──► [AEC: filtro adaptativo PBFDAF / NLMS no domínio da frequência]
 *        ──► [STFT] ──► ganho de ruído (MCRA + Wiener decision-directed)
 *                   ──► ganho de eco residual (pós-filtro)
 *                   ──► corte de graves (< 80 Hz)
 *        ──► [ISTFT overlap-add] ──► foco na voz (expansor por nível) ──► saída
 *
 * O sinal de referência ("far-end") é exatamente o que o app toca nos alto-falantes
 * (mistura das vozes remotas), o que permite estimar e subtrair o eco que volta pelo microfone.
 *
 * Código 100% autoral, sem dependências — roda no AudioWorklet e no Node (testes).
 */
import { FFT } from "./fft.ts";
import { JanjaNeural, TOP_BIN, type JanjaModelWeights } from "./janjaNeural.ts";

export interface VoiceEngineSettings {
  /** Supressão de ruído de fundo (ventilador, teclado, chiado...). */
  noiseSuppression: boolean;
  /** Cancelamento do eco das vozes remotas que vazam do alto-falante. */
  echoCancellation: boolean;
  /** Atenua vozes/sons distantes, mais baixos que a voz principal. */
  voiceFocus: boolean;
  /** Usa a rede neural treinada (se o modelo estiver carregado) no lugar do supressor clássico. */
  neural: boolean;
  /** Intensidade geral 0..1. */
  strength: number;
}

export interface VoiceEngineStats {
  /** Redução de eco obtida pelo filtro adaptativo (dB). */
  erleDb: number;
  /** Nível estimado do ruído de fundo (dBFS). */
  noiseDb: number;
  /** Atenuação média aplicada pelo supressor (dB, negativo). */
  suppressionDb: number;
  /** Probabilidade de fala 0..1. */
  speech: number;
  /** Nível de saída (dBFS). */
  outputDb: number;
  /** Rede neural carregada e disponível. */
  neural?: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceEngineSettings = {
  noiseSuppression: true,
  echoCancellation: true,
  voiceFocus: false,
  neural: true,
  strength: 0.5,
};

export const HOP = 256;
const N = HOP * 2;
const K = N / 2 + 1;
const EPS = 1e-12;
const DD_ALPHA = 0.85; // suavização "decision-directed" (ajustada para hop de ~5 ms)

const dbToLin = (db: number) => Math.pow(10, db / 20);
const powToDb = (p: number) => 10 * Math.log10(p + EPS);

/* ------------------------------------------------------------------------ */
/* Cancelador de eco: Partitioned-Block Frequency-Domain Adaptive Filter     */
/* ------------------------------------------------------------------------ */
class EchoCanceller {
  private readonly fft: FFT;
  private readonly P: number;
  private readonly xPrev = new Float64Array(HOP);
  private readonly frame = new Float64Array(N);
  private readonly tmp = new Float64Array(N);
  // histórico do espectro do far-end (ring de P partições)
  private readonly Xr: Float64Array[];
  private readonly Xi: Float64Array[];
  // coeficientes do filtro por partição
  private readonly Wr: Float64Array[];
  private readonly Wi: Float64Array[];
  private head = 0;
  private readonly Yr = new Float64Array(K);
  private readonly Yi = new Float64Array(K);
  private readonly Er = new Float64Array(K);
  private readonly Ei = new Float64Array(K);
  private readonly Psum = new Float64Array(K);
  private readonly Pe = new Float64Array(K);
  private constrainIdx = 0;
  private divergeCount = 0;
  /** Estimativa de eco (tempo) do último bloco. */
  readonly echo = new Float64Array(HOP);
  erleDb = 0;

  constructor(fft: FFT, sampleRate: number, tailMs = 160) {
    this.fft = fft;
    this.P = Math.max(4, Math.ceil(((tailMs / 1000) * sampleRate) / HOP));
    this.Xr = []; this.Xi = []; this.Wr = []; this.Wi = [];
    for (let p = 0; p < this.P; p++) {
      this.Xr.push(new Float64Array(K));
      this.Xi.push(new Float64Array(K));
      this.Wr.push(new Float64Array(K));
      this.Wi.push(new Float64Array(K));
    }
  }

  reset(): void {
    for (let p = 0; p < this.P; p++) {
      this.Wr[p].fill(0); this.Wi[p].fill(0);
      this.Xr[p].fill(0); this.Xi[p].fill(0);
    }
    this.xPrev.fill(0);
    this.Psum.fill(0);
    this.Pe.fill(0);
    this.divergeCount = 0;
  }

  /** mic (HOP) e far (HOP) -> out = mic - eco estimado. */
  process(mic: Float64Array, far: Float64Array, out: Float64Array): void {
    const { fft, P } = this;

    // 1) espectro do far-end com overlap-save: [bloco anterior | bloco atual]
    this.head = (this.head + P - 1) % P;
    const h = this.head;
    for (let i = 0; i < HOP; i++) {
      this.frame[i] = this.xPrev[i];
      this.frame[HOP + i] = far[i];
      this.xPrev[i] = far[i];
    }
    fft.forward(this.frame, this.Xr[h], this.Xi[h]);

    let farEnergy = 0;
    for (let i = 0; i < HOP; i++) farEnergy += far[i] * far[i];
    farEnergy /= HOP;

    // 2) eco estimado Y = Σ W_p · X_{k-p}
    this.Yr.fill(0); this.Yi.fill(0);
    for (let p = 0; p < P; p++) {
      const idx = (h + p) % P;
      const xr = this.Xr[idx], xi = this.Xi[idx], wr = this.Wr[p], wi = this.Wi[p];
      for (let k = 0; k < K; k++) {
        this.Yr[k] += wr[k] * xr[k] - wi[k] * xi[k];
        this.Yi[k] += wr[k] * xi[k] + wi[k] * xr[k];
      }
    }
    fft.inverse(this.Yr, this.Yi, this.tmp);

    let micE = 0, errE = 0;
    for (let i = 0; i < HOP; i++) {
      const y = this.tmp[HOP + i];
      this.echo[i] = y;
      const e = mic[i] - y;
      out[i] = e;
      micE += mic[i] * mic[i];
      errE += e * e;
    }

    // proteção contra divergência: se a saída ficar bem mais alta que o mic, zera o filtro
    if (errE > micE * 4 + 1e-6) {
      if (++this.divergeCount > 8) {
        this.reset();
        for (let i = 0; i < HOP; i++) { out[i] = mic[i]; this.echo[i] = 0; }
        return;
      }
    } else {
      this.divergeCount = 0;
    }

    if (farEnergy > 1e-7) {
      const erle = powToDb(micE / HOP) - powToDb(errE / HOP);
      this.erleDb = 0.95 * this.erleDb + 0.05 * Math.max(0, erle);
    } else {
      this.erleDb *= 0.995;
      return; // sem sinal remoto -> nada para aprender
    }

    // 3) atualização NLMS normalizada por bin.
    // O termo Pe no denominador reduz o passo automaticamente durante "double-talk"
    // (quando você fala por cima do eco), evitando que o filtro desaprenda.
    this.tmp.fill(0, 0, HOP);
    for (let i = 0; i < HOP; i++) this.tmp[HOP + i] = out[i];
    fft.forward(this.tmp, this.Er, this.Ei);

    for (let k = 0; k < K; k++) {
      let px = 0;
      for (let p = 0; p < P; p++) {
        const idx = (h + p) % P;
        px += this.Xr[idx][k] * this.Xr[idx][k] + this.Xi[idx][k] * this.Xi[idx][k];
      }
      this.Psum[k] = 0.7 * this.Psum[k] + 0.3 * px;
      const pe = this.Er[k] * this.Er[k] + this.Ei[k] * this.Ei[k];
      this.Pe[k] = 0.7 * this.Pe[k] + 0.3 * pe;
    }

    const mu = 0.6;
    for (let p = 0; p < P; p++) {
      const idx = (h + p) % P;
      const xr = this.Xr[idx], xi = this.Xi[idx], wr = this.Wr[p], wi = this.Wi[p];
      for (let k = 0; k < K; k++) {
        const g = mu / (this.Psum[k] + 0.5 * P * this.Pe[k] + 1e-6);
        // conj(X) · E
        wr[k] += g * (xr[k] * this.Er[k] + xi[k] * this.Ei[k]);
        wi[k] += g * (xr[k] * this.Ei[k] - xi[k] * this.Er[k]);
      }
    }

    // 4) restrição de gradiente (filtro causal de HOP taps por partição), round-robin
    const c = this.constrainIdx;
    this.constrainIdx = (c + 1) % P;
    fft.inverse(this.Wr[c], this.Wi[c], this.tmp);
    this.tmp.fill(0, HOP);
    fft.forward(this.tmp, this.Wr[c], this.Wi[c]);
  }
}

/* ------------------------------------------------------------------------ */
/* Motor completo                                                            */
/* ------------------------------------------------------------------------ */
export class JanjaVoiceEngine {
  readonly sampleRate: number;
  private settings: VoiceEngineSettings;
  private readonly fft = new FFT(N);
  private readonly aec: EchoCanceller;
  private net: JanjaNeural | null = null;
  private readonly power = new Float64Array(K);
  private readonly neuralGain = new Float64Array(K);

  private readonly win = new Float64Array(N);
  private readonly micBlock = new Float64Array(HOP);
  private readonly farBlock = new Float64Array(HOP);
  private readonly aecOut = new Float64Array(HOP);
  private readonly ePrev = new Float64Array(HOP);
  private readonly yPrev = new Float64Array(HOP);
  private readonly ola = new Float64Array(HOP);
  private readonly frame = new Float64Array(N);
  private readonly synth = new Float64Array(N);
  private readonly Sr = new Float64Array(K);
  private readonly Si = new Float64Array(K);
  private readonly Yr = new Float64Array(K);
  private readonly Yi = new Float64Array(K);

  // estado do supressor de ruído
  private readonly S = new Float64Array(K);
  private readonly Smin = new Float64Array(K);
  private readonly Stmp = new Float64Array(K);
  private readonly noise = new Float64Array(K);
  private readonly presence = new Float64Array(K);
  private readonly prevGain = new Float64Array(K).fill(1);
  private readonly prevGamma = new Float64Array(K).fill(1);
  private readonly gain = new Float64Array(K);
  private readonly gainSmooth = new Float64Array(K);
  private frameCount = 0;
  private readonly minWindow = 96; // ~0.5 s @ 48 kHz (o MCRA usa 2 janelas => ~1 s)
  private readonly lowCutBin: number;
  private readonly speechLo: number;
  private readonly speechHi: number;

  // foco na voz
  private fgLevelDb = -60;
  private focusGain = 1;

  private readonly stats: VoiceEngineStats = {
    erleDb: 0, noiseDb: -90, suppressionDb: 0, speech: 0, outputDb: -90,
  };

  constructor(sampleRate: number, settings: Partial<VoiceEngineSettings> = {}) {
    this.sampleRate = sampleRate;
    this.settings = { ...DEFAULT_VOICE_SETTINGS, ...settings };
    this.aec = new EchoCanceller(this.fft, sampleRate);
    for (let i = 0; i < N; i++) this.win[i] = Math.sqrt(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
    const binHz = sampleRate / N;
    this.lowCutBin = Math.max(1, Math.round(80 / binHz));
    this.speechLo = Math.round(300 / binHz);
    this.speechHi = Math.min(K - 1, Math.round(3400 / binHz));
  }

  /** Latência algorítmica em amostras. */
  static get latency(): number {
    return HOP;
  }

  /** Carrega (ou remove) os pesos da rede neural. */
  setModel(weights: JanjaModelWeights | null): void {
    this.net = weights ? new JanjaNeural(weights, K) : null;
  }

  get hasModel(): boolean {
    return this.net !== null;
  }

  updateSettings(next: Partial<VoiceEngineSettings>): void {
    const wasAec = this.settings.echoCancellation;
    this.settings = { ...this.settings, ...next };
    this.settings.strength = Math.min(1, Math.max(0, this.settings.strength));
    if (wasAec && !this.settings.echoCancellation) this.aec.reset();
  }

  getSettings(): VoiceEngineSettings {
    return { ...this.settings };
  }

  getStats(): VoiceEngineStats {
    return { ...this.stats };
  }

  /**
   * Processa um bloco de HOP amostras.
   * @param mic  sinal do microfone
   * @param far  sinal tocado nos alto-falantes (ou null)
   * @param out  saída limpa
   */
  process(mic: ArrayLike<number>, far: ArrayLike<number> | null, out: Float32Array | Float64Array): void {
    const s = this.settings;
    for (let i = 0; i < HOP; i++) {
      this.micBlock[i] = mic[i];
      this.farBlock[i] = far ? far[i] : 0;
    }

    // --- 1) cancelamento de eco linear
    const useAec = s.echoCancellation && far !== null;
    if (useAec) {
      this.aec.process(this.micBlock, this.farBlock, this.aecOut);
    } else {
      this.aecOut.set(this.micBlock);
      this.aec.echo.fill(0);
    }
    this.stats.erleDb = useAec ? this.aec.erleDb : 0;

    if (!s.noiseSuppression && !useAec && !s.voiceFocus) {
      // bypass total (mantém a mesma latência para não "pular" ao alternar)
      for (let i = 0; i < HOP; i++) { out[i] = this.ola[i]; this.ola[i] = this.micBlock[i]; }
      this.ePrev.set(this.micBlock);
      this.yPrev.fill(0);
      return;
    }

    // --- 2) análise STFT (janela sqrt-Hann, 50% overlap)
    for (let i = 0; i < HOP; i++) {
      this.frame[i] = this.ePrev[i] * this.win[i];
      this.frame[HOP + i] = this.aecOut[i] * this.win[HOP + i];
    }
    this.fft.forward(this.frame, this.Sr, this.Si);
    if (useAec) {
      for (let i = 0; i < HOP; i++) {
        this.frame[i] = this.yPrev[i] * this.win[i];
        this.frame[HOP + i] = this.aec.echo[i] * this.win[HOP + i];
      }
      this.fft.forward(this.frame, this.Yr, this.Yi);
    }
    this.ePrev.set(this.aecOut);
    this.yPrev.set(this.aec.echo);

    // --- 3) estimativa de ruído (MCRA simplificado) + ganho Wiener
    this.frameCount++;
    const st = s.strength;
    const floorLin = dbToLin(-12 - 22 * st); // -12 dB .. -34 dB
    const overSub = 1 + 1.5 * st;
    const init = this.frameCount <= 12;
    const resetMin = this.frameCount % this.minWindow === 0;
    let speechAcc = 0, noiseAcc = 0, gainAcc = 0;
    const leak = Math.min(0.5, Math.max(0.01, Math.pow(10, -this.aec.erleDb / 10))) * (1 + 2 * st);

    // rede neural: roda sobre o mesmo espectro (normalizado por N^2, igual ao treino)
    const useNeural = s.noiseSuppression && s.neural && this.net !== null;
    const neuralExp = 0.6 + 0.8 * st; // intensidade 50% = ganho exatamente como treinado
    if (useNeural && this.net) {
      const inv = 1 / (N * N);
      for (let k = 0; k < K; k++) this.power[k] = (this.Sr[k] * this.Sr[k] + this.Si[k] * this.Si[k]) * inv;
      this.net.step(this.power);
      this.net.binGains(this.neuralGain);
    }

    for (let k = 0; k < K; k++) {
      const pk = this.Sr[k] * this.Sr[k] + this.Si[k] * this.Si[k];
      // suavização em frequência (3 bins) + tempo
      const pl = k > 0 ? this.Sr[k - 1] * this.Sr[k - 1] + this.Si[k - 1] * this.Si[k - 1] : pk;
      const pr = k < K - 1 ? this.Sr[k + 1] * this.Sr[k + 1] + this.Si[k + 1] * this.Si[k + 1] : pk;
      const pf = 0.25 * pl + 0.5 * pk + 0.25 * pr;

      if (init) {
        this.S[k] = this.frameCount === 1 ? pf : 0.5 * this.S[k] + 0.5 * pf;
        this.Smin[k] = this.S[k];
        this.Stmp[k] = this.S[k];
        this.noise[k] = this.S[k];
      } else {
        this.S[k] = 0.8 * this.S[k] + 0.2 * pf;
        if (resetMin) {
          this.Smin[k] = Math.min(this.Stmp[k], this.S[k]);
          this.Stmp[k] = this.S[k];
        } else {
          this.Smin[k] = Math.min(this.Smin[k], this.S[k]);
          this.Stmp[k] = Math.min(this.Stmp[k], this.S[k]);
        }
        const isSpeech = this.S[k] > 5 * this.Smin[k] ? 1 : 0;
        this.presence[k] = 0.85 * this.presence[k] + 0.15 * isSpeech;
        // detector instantâneo: no início de uma sílaba a presença suavizada ainda é baixa,
        // então sem isso o estimador "aprenderia" a própria voz como ruído.
        const instant = pf > 3 * this.noise[k] ? 1 : 0;
        const p = Math.max(this.presence[k], instant);
        const ad = 0.98 + 0.02 * p;
        this.noise[k] = ad * this.noise[k] + (1 - ad) * Math.min(pk, 4 * this.noise[k]);
        // se o ruído de fundo aumentar de verdade (ex.: ventilador ligou), o mínimo
        // rastreado puxa a estimativa para cima em ~1 s
        if (this.noise[k] < this.Smin[k]) this.noise[k] = this.Smin[k];
      }

      let g = 1;
      if (s.noiseSuppression) {
        const gamma = pk / (this.noise[k] * overSub + EPS);
        const xi = DD_ALPHA * this.prevGain[k] * this.prevGain[k] * this.prevGamma[k] + (1 - DD_ALPHA) * Math.max(gamma - 1, 0);
        g = xi / (1 + xi);
        this.prevGamma[k] = gamma;
        this.prevGain[k] = g;
        if (useNeural) {
          // até 8 kHz manda a rede; acima, o mais conservador entre rede e clássico
          const gn = Math.pow(this.neuralGain[k], neuralExp);
          g = k <= TOP_BIN ? gn : Math.min(g, gn);
        }
        if (g < floorLin) g = floorLin;
      }

      // pós-filtro de eco residual
      if (useAec) {
        const yk = this.Yr[k] * this.Yr[k] + this.Yi[k] * this.Yi[k];
        // o eco que sobra é proporcional ao desajuste do filtro (≈ 10^(-ERLE/10))
        const residual = leak * yk;
        const ge = Math.max(floorLin, (pk - residual) / (pk + EPS));
        if (ge < g) g = ge;
      }

      if (k < this.lowCutBin) g = Math.min(g, 0.05);
      this.gain[k] = g;

      if (k >= this.speechLo && k <= this.speechHi) speechAcc += this.presence[k];
      noiseAcc += this.noise[k];
    }

    // suaviza ganho em frequência (reduz "musical noise") e no tempo
    for (let k = 0; k < K; k++) {
      const gl = this.gain[k > 0 ? k - 1 : k];
      const gr = this.gain[k < K - 1 ? k + 1 : k];
      const gs = 0.25 * gl + 0.5 * this.gain[k] + 0.25 * gr;
      const prev = this.gainSmooth[k] || gs;
      const g = gs > prev ? 0.3 * prev + 0.7 * gs : 0.6 * prev + 0.4 * gs;
      this.gainSmooth[k] = g;
      this.Sr[k] *= g;
      this.Si[k] *= g;
      gainAcc += g;
    }

    // --- 4) síntese ISTFT + overlap-add
    this.fft.inverse(this.Sr, this.Si, this.synth);
    let outE = 0, speechBandE = 0;
    for (let i = 0; i < HOP; i++) {
      const v = this.ola[i] + this.synth[i] * this.win[i];
      this.ola[i] = this.synth[HOP + i] * this.win[HOP + i];
      out[i] = v;
      outE += v * v;
    }
    for (let k = this.speechLo; k <= this.speechHi; k++) speechBandE += this.Sr[k] * this.Sr[k] + this.Si[k] * this.Si[k];

    const speechProb = speechAcc / Math.max(1, this.speechHi - this.speechLo + 1);

    // --- 5) foco na voz: atenua o que estiver muito abaixo da voz principal
    let focus = 1;
    if (s.voiceFocus) {
      const levelDb = powToDb(speechBandE / (N * N));
      if (speechProb > 0.45 && levelDb > this.fgLevelDb) {
        this.fgLevelDb = 0.7 * this.fgLevelDb + 0.3 * levelDb; // sobe rápido
      } else {
        this.fgLevelDb -= 0.015; // desce ~3 dB/s
      }
      const threshold = this.fgLevelDb - (20 - 8 * st); // 20 dB .. 12 dB abaixo da voz principal
      const target = levelDb < threshold ? dbToLin(-(10 + 20 * st)) : 1;
      const coef = target > this.focusGain ? 0.5 : 0.04; // abre rápido, fecha devagar
      this.focusGain += coef * (target - this.focusGain);
      focus = this.focusGain;
      if (focus < 0.999) {
        for (let i = 0; i < HOP; i++) out[i] *= focus;
        outE *= focus * focus;
      }
    } else {
      this.focusGain = 1;
    }

    // --- estatísticas
    const st2 = this.stats;
    st2.speech = 0.9 * st2.speech + 0.1 * speechProb;
    st2.noiseDb = powToDb(noiseAcc / K / (N * N) * 2);
    st2.suppressionDb = 0.9 * st2.suppressionDb + 0.1 * (20 * Math.log10(gainAcc / K + EPS) + 20 * Math.log10(focus + EPS));
    st2.outputDb = powToDb(outE / HOP);
  }
}
