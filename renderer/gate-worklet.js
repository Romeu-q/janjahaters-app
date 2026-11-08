// Portão de ruído do microfone ("sensibilidade", como no Discord), ANTES do RNNoise.
//
// 1) Portão: só deixa o som passar quando você fala. Mede a energia (RMS) de cada bloco; para não abrir com
//    estalo de teclado ou batida na mesa, o som precisa ficar acima do limite por ~45 ms seguidos (fala dura
//    mais que isso; um clique, não). Depois que você para, segura aberto 150 ms (não corta o fim da frase) e
//    fecha suave. Fechado, o RNNoise recebe silêncio de verdade e não tem o que deixar vazar.
//    Para não comer o começo da palavra, o áudio sai com 50 ms de atraso (o portão "vê o futuro").
// 2) Anti-impacto: estalo de tecla e batida na mesa sobem do nada para o máximo em menos de 1 ms; a voz não.
//    Quando o envelope rápido dos agudos pula muito acima do envelope lento, o trecho do estalo (começando
//    2 ms antes, graças ao atraso) é abaixado por ~18 ms: os agudos quase somem e os graves caem pela metade.
//    Vale também com você falando, que é onde o RNNoise mais deixa passar teclado.
const HOLD_MS = 150;
class JanjaGate extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.on = true; // desligado: deixa tudo passar
    this.auto = true; // limite automático pelo ruído de fundo
    this.thr = -50; // limite manual em dB
    this.impact = true; // anti-impacto ligado
    this.report = false; // manda o nível para o medidor das configurações
    // atraso: 50 ms no portão; só o anti-impacto precisa de 5 ms (abaixa 2 ms antes do estalo)
    const L = Math.round(sampleRate * ((options?.processorOptions?.lookMs ?? 50) / 1000));
    this.delay = new Float32Array(L);
    this.duckRing = new Float32Array(L).fill(1);
    this.pos = 0;
    this.floor = -70;
    this.above = 0;
    this.below = 0;
    this.open = false;
    this.gain = 0;
    this.sinceReport = 0;
    this.peak = -100;
    // anti-impacto
    this.hpPrev = 0;
    this.hpOut = 0;
    this.ef = 0; // envelope rápido dos agudos
    this.es = 0; // envelope lento dos agudos
    this.duckLeft = 0;
    this.lp = 0; // separa graves/agudos na saída
    this.dg = 1;
    this.cHp = Math.exp((-2 * Math.PI * 1500) / sampleRate);
    this.cLp = 1 - Math.exp((-2 * Math.PI * 1500) / sampleRate);
    this.rf = Math.exp(-1 / (0.002 * sampleRate));
    this.ru = 1 - Math.exp(-1 / (0.04 * sampleRate));
    this.rd = 1 - Math.exp(-1 / (0.25 * sampleRate));
    this.pre = Math.round(sampleRate * 0.002);
    this.hold = Math.round(sampleRate * 0.018);
    this.impacts = 0;
    this.ratio = 6; // quanto o estalo precisa pular acima do envelope lento (6 = ~16 dB)
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
    if (this.open && this.below >= HOLD_MS) this.open = false;
    const target = !this.on || this.open ? 1 : 0;

    // tudo desligado: passa direto, sem o atraso de 50 ms
    if (!this.on && !this.impact && this.gain >= 0.999) {
      if (inp) out.set(inp);
      else out.fill(0);
      this.report && this.reportLevel(db, thr, ms);
      return true;
    }

    const d = this.delay;
    const ring = this.duckRing;
    const L = d.length;
    for (let i = 0; i < n; i++) {
      const s = inp ? inp[i] : 0;
      // --- detecção do impacto (no som que acabou de chegar) ---
      let duck = 1;
      if (this.impact) {
        this.hpOut = this.cHp * (this.hpOut + s - this.hpPrev); // agudos (> ~1,5 kHz)
        this.hpPrev = s;
        const a = Math.abs(this.hpOut);
        this.ef = a > this.ef ? a : this.ef * this.rf;
        // o lento sobe devagar (um estalo quase não mexe nele) e desce mais devagar ainda
        this.es += (a - this.es) * (a > this.es ? this.ru : this.rd);
        if (this.ef > 0.004 && this.ef > this.es * this.ratio) {
          if (this.duckLeft <= 0) {
            this.impacts++;
            // abaixa também os 2 ms antes do estalo (ainda estão no atraso, não saíram)
            for (let k = 1; k <= this.pre; k++) ring[(this.pos - k + L) % L] = 0;
          }
          this.duckLeft = this.hold;
        }
        if (this.duckLeft > 0) {
          this.duckLeft--;
          duck = 0;
        }
      }
      const late = d[this.pos];
      const lateDuck = ring[this.pos];
      d[this.pos] = s;
      ring[this.pos] = duck;
      this.pos = (this.pos + 1) % L;
      // portão: abre em ~4 ms e fecha em ~50 ms (sem estalo)
      this.gain += (target - this.gain) * (target > this.gain ? 0.005 : 0.0004);
      // anti-impacto: desce em ~0,3 ms e volta em ~3 ms
      this.dg += (lateDuck - this.dg) * (lateDuck < this.dg ? 0.07 : 0.007);
      this.lp += (late - this.lp) * this.cLp;
      const hi = late - this.lp;
      const lo = this.lp;
      // agudos até -20 dB, graves até -6 dB
      const y = lo * (0.5 + 0.5 * this.dg) + hi * (0.1 + 0.9 * this.dg);
      out[i] = y * this.gain;
    }

    if (this.report) this.reportLevel(db, thr, ms);
    return true;
  }

  reportLevel(db, thr, ms) {
    this.peak = Math.max(this.peak, db);
    this.sinceReport += ms;
    if (this.sinceReport >= 50) {
      this.port.postMessage({ level: this.peak, thr, open: this.open || !this.on, impacts: this.impacts });
      this.sinceReport = 0;
      this.peak = -100;
    }
  }
}
registerProcessor('janja-gate', JanjaGate);
