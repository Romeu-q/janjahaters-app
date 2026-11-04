// Toca o som do PC que vem do janja-sysaudio (float32 estéreo intercalado, 48 kHz) num MediaStream.
// Junta ~40 ms antes de começar; se acumular mais de 150 ms (relógios diferentes), pula para 60 ms.
const START = 0.04, MAX = 0.15, TRIM = 0.06;
class JanjaPcm extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(sampleRate * 2); // 1 s estéreo
    this.r = 0;
    this.w = 0;
    this.playing = false;
    this.port.onmessage = (e) => {
      const d = e.data;
      const len = this.buf.length;
      for (let i = 0; i < d.length; i++) this.buf[(this.w + i) % len] = d[i];
      this.w = (this.w + d.length) % len;
    };
  }
  frames() {
    return ((this.w - this.r + this.buf.length) % this.buf.length) / 2;
  }
  process(_, [out]) {
    const n = out[0].length;
    let have = this.frames();
    if (!this.playing && have >= START * sampleRate) this.playing = true;
    if (have > MAX * sampleRate) {
      this.r = (this.w - Math.round(TRIM * sampleRate) * 2 + this.buf.length) % this.buf.length;
      have = this.frames();
    }
    if (!this.playing || have < n) {
      this.playing = false; // faltou som: espera juntar de novo em vez de picotar
      return true;
    }
    const [L, R] = out;
    for (let i = 0; i < n; i++) {
      L[i] = this.buf[this.r];
      (R || L)[i] = this.buf[this.r + 1];
      this.r = (this.r + 2) % this.buf.length;
    }
    return true;
  }
}
registerProcessor('janja-pcm', JanjaPcm);
