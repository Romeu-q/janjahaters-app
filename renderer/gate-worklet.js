// Portão de ruído do microfone ("sensibilidade", como no Discord).
// Só deixa o som passar quando você fala. Para não abrir com estalo de teclado ou batida na mesa,
// o som precisa ficar acima do limite por ~45 ms seguidos (fala dura mais que isso; um clique, não).
// Para não comer o começo da palavra, o áudio sai com 50 ms de atraso (o portão "vê o futuro").
class JanjaGate extends AudioWorkletProcessor {
  constructor() {
    super();
    this.on = true; // desligado: deixa tudo passar
    this.auto = true; // limite automático pelo ruído de fundo
    this.thr = -50; // limite manual em dB
    this.report = false; // manda o nível para o medidor das configurações
    this.delay = new Float32Array(Math.round(sampleRate * 0.05));
    this.pos = 0;
    this.floor = -70;
    this.above = 0;
    this.below = 0;
    this.open = false;
    this.gain = 0;
    this.sinceReport = 0;
    this.peak = -100;
    this.port.onmessage = (e) => Object.assign(this, e.data);
  }

  process(inputs, outputs) {
    const inp = inputs[0]?.[0];
    const out = outputs[0]?.[0];
    if (!out) return true;
    const n = out.length;
    let sum = 0;
    if (inp) for (let i = 0; i < n; i++) sum += inp[i] * inp[i];
    const db = 10 * Math.log10(sum / n + 1e-12);
    const ms = (n / sampleRate) * 1000;

    // ruído de fundo: desce rápido quando fica silêncio, sobe bem devagar
    this.floor += (db - this.floor) * (db < this.floor ? 0.2 : 0.0015);
    const thr = this.auto ? Math.min(-28, Math.max(-62, this.floor + 15)) : this.thr;

    if (db > thr) {
      this.above += ms;
      this.below = 0;
    } else {
      this.below += ms;
      this.above = 0;
    }
    if (!this.open && this.above >= 45) this.open = true;
    if (this.open && this.below >= 400) this.open = false; // segura um pouco entre as palavras
    const target = !this.on || this.open ? 1 : 0;

    // desligado: passa direto, sem o atraso de 50 ms (o DeepFilterNet3 já tem o portão dele)
    if (!this.on && this.gain >= 0.999) {
      if (inp) out.set(inp);
      else out.fill(0);
      this.report && this.reportLevel(db, thr, ms);
      return true;
    }

    const d = this.delay;
    for (let i = 0; i < n; i++) {
      const s = inp ? inp[i] : 0;
      const late = d[this.pos];
      d[this.pos] = s;
      this.pos = (this.pos + 1) % d.length;
      // abre em ~4 ms e fecha em ~50 ms (sem estalo)
      this.gain += (target - this.gain) * (target > this.gain ? 0.005 : 0.0004);
      out[i] = late * this.gain;
    }

    if (this.report) this.reportLevel(db, thr, ms);
    return true;
  }

  reportLevel(db, thr, ms) {
    this.peak = Math.max(this.peak, db);
    this.sinceReport += ms;
    if (this.sinceReport >= 50) {
      this.port.postMessage({ level: this.peak, thr, open: this.open || !this.on });
      this.sinceReport = 0;
      this.peak = -100;
    }
  }
}
registerProcessor('janja-gate', JanjaGate);
