// Pacote de toques "Halloween": risada de bruxa, fantasma, sino de igreja, órgão em tom menor, morcegos e porta rangendo.
// Tudo sintetizado aqui (Web Audio), feito para o janja: nada copiado de outro app.
// Cada som recebe (ctx, out, t) e agenda as notas a partir do instante t na saída `out`; devolve a duração.

const env = (g, t, peak, attack, release) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
};

// "Uuuuu" de fantasma: seno com vibrato que desliza de uma nota para outra, com um leve sopro de ruído
function ghost(ctx, out, t, from, to, dur = 0.75, vol = 0.55) {
  const o = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = ctx.createGain();
  const vib = ctx.createOscillator();
  const vibAmt = ctx.createGain();
  o.type = 'sine';
  o2.type = 'triangle';
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
  o2.frequency.setValueAtTime(from * 2.005, t);
  o2.frequency.exponentialRampToValueAtTime(to * 2.005, t + dur * 0.8);
  vib.frequency.value = 6.5;
  vibAmt.gain.value = from * 0.025;
  vib.connect(vibAmt);
  vibAmt.connect(o.frequency);
  vibAmt.connect(o2.frequency);
  const g2 = ctx.createGain();
  g2.gain.value = 0.18;
  o2.connect(g2).connect(g);
  o.connect(g).connect(out);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
  g.gain.setValueAtTime(vol, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  // sopro (ruído filtrado que acompanha a nota)
  const n = noise(ctx, dur);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(from * 3, t);
  bp.frequency.exponentialRampToValueAtTime(to * 3, t + dur);
  bp.Q.value = 4;
  const ng = ctx.createGain();
  env(ng, t, vol * 0.12, dur * 0.3, dur * 0.7);
  n.connect(bp).connect(ng).connect(out);
  for (const x of [o, o2, vib]) {
    x.start(t);
    x.stop(t + dur + 0.05);
  }
  n.start(t);
  n.stop(t + dur + 0.05);
  return dur;
}

let noiseBuf = null;
function noise(ctx, dur) {
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = dur > 2;
  return s;
}

// sino de igreja: parciais inarmônicos (o "dong" metálico) que somem devagar
function bell(ctx, out, t, f, vol = 0.5, dec = 1.4) {
  for (const [mult, amp, d] of [
    [0.5, 0.35, dec * 1.1],
    [1, 1, dec],
    [1.19, 0.45, dec * 0.7],
    [1.56, 0.3, dec * 0.5],
    [2.0, 0.35, dec * 0.6],
    [2.74, 0.18, dec * 0.35],
    [3.76, 0.1, dec * 0.25],
  ]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f * mult;
    env(g, t, amp * vol, 0.004, d);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + d + 0.05);
  }
  return dec;
}

// órgão de tubos: fundamental + oitavas + quinta, com ataque lento e um pouco de trêmulo
function organ(ctx, out, t, freqs, step = 0.16, hold = 0.32, vol = 0.32) {
  const trem = ctx.createOscillator();
  const tremAmt = ctx.createGain();
  trem.frequency.value = 5.2;
  tremAmt.gain.value = 0.18;
  trem.connect(tremAmt);
  freqs.forEach((f, i) => {
    const tt = t + i * step;
    const last = i === freqs.length - 1;
    const len = last ? hold * 2.2 : hold;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, tt);
    g.gain.exponentialRampToValueAtTime(vol, tt + 0.05);
    g.gain.setValueAtTime(vol, tt + len * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, tt + len);
    tremAmt.connect(g.gain);
    for (const [mult, amp, type] of [
      [1, 1, 'sine'],
      [2, 0.5, 'sine'],
      [3, 0.22, 'triangle'],
      [4, 0.18, 'sine'],
      [0.5, 0.35, 'sine'],
    ]) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type;
      o.frequency.value = f * mult;
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(tt);
      o.stop(tt + len + 0.05);
    }
    g.connect(out);
  });
  const total = (freqs.length - 1) * step + hold * 2.2;
  trem.start(t);
  trem.stop(t + total + 0.1);
  return total;
}

// porta rangendo: ruído em pulsos rápidos passando por um filtro que sobe ou desce
function creak(ctx, out, t, up = true, dur = 0.32, vol = 0.5) {
  const n = noise(ctx, dur);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 14;
  bp.frequency.setValueAtTime(up ? 380 : 900, t);
  bp.frequency.exponentialRampToValueAtTime(up ? 900 : 380, t + dur);
  const g = ctx.createGain();
  vol *= 14; // o filtro estreito deixa passar pouca energia do ruído: compensa
  g.gain.setValueAtTime(0.0001, t);
  // pulsos de atrito (o "rec-rec-rec" da dobradiça)
  const pulses = Math.round(dur * 38);
  for (let i = 0; i < pulses; i++) {
    const tt = t + (i / pulses) * dur;
    g.gain.setValueAtTime(vol * (0.6 + 0.4 * Math.random()), tt);
    g.gain.exponentialRampToValueAtTime(vol * 0.12, tt + dur / pulses * 0.8);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.03);
  n.connect(bp).connect(g).connect(out);
  n.start(t);
  n.stop(t + dur + 0.05);
  return dur;
}

// morcego: chiado agudo que sobe e cai rápido
function bat(ctx, out, t, vol = 0.5) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(2600, t);
  o.frequency.exponentialRampToValueAtTime(4200, t + 0.03);
  o.frequency.exponentialRampToValueAtTime(2100, t + 0.07);
  env(g, t, vol, 0.006, 0.07);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.1);
  return 0.08;
}

// Risada de bruxa: "hi-hi-hi-hi" fino e rápido. Cada sílaba = sopro de "h" + voz (dente de serra) passando
// pelos formantes da vogal "i" (grave baixo, agudos altos = voz fininha), com o tom caindo ao longo da risada.
function cackle(ctx, out, t, { n = 6, from = 1150, to = 780, syl = 0.07, gap = 0.032, vol = 0.55 } = {}) {
  for (let i = 0; i < n; i++) {
    const tt = t + i * (syl + gap);
    const last = i === n - 1;
    const len = last ? syl * 1.8 : syl; // a última sílaba estica ("hiiii")
    const f = from * Math.pow(to / from, i / Math.max(1, n - 1)) * (1 + (Math.random() - 0.5) * 0.05);
    const src = ctx.createOscillator();
    src.type = 'sawtooth';
    src.frequency.setValueAtTime(f * 1.08, tt);
    src.frequency.exponentialRampToValueAtTime(f * (last ? 0.78 : 0.9), tt + len);
    // trêmulo rápido na voz (o "tremido" de bruxa)
    const vib = ctx.createOscillator();
    const vibAmt = ctx.createGain();
    vib.frequency.value = 22;
    vibAmt.gain.value = f * 0.03;
    vib.connect(vibAmt).connect(src.frequency);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, tt);
    env.gain.exponentialRampToValueAtTime(vol, tt + 0.008);
    env.gain.setValueAtTime(vol * 0.8, tt + len * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, tt + len);
    for (const [fc, q, amp] of [
      [420, 6, 0.9],
      [2700, 9, 1.0],
      [3500, 11, 0.55],
    ]) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = fc;
      bp.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = amp * 2.2;
      src.connect(bp).connect(g).connect(env);
    }
    env.connect(out);
    // o "h" de cada sílaba: sopro curtinho antes da voz
    const h = noise(ctx, 0.05);
    const hbp = ctx.createBiquadFilter();
    hbp.type = 'bandpass';
    hbp.frequency.value = 3000;
    hbp.Q.value = 1.2;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.0001, tt - 0.012);
    hg.gain.exponentialRampToValueAtTime(vol * 0.35, tt - 0.004);
    hg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.02);
    h.connect(hbp).connect(hg).connect(out);
    h.start(Math.max(0, tt - 0.015));
    h.stop(tt + 0.03);
    for (const x of [src, vib]) {
      x.start(tt);
      x.stop(tt + len + 0.03);
    }
  }
  return n * (syl + gap) + syl;
}

// Notas (Ré menor, o tom "assombrado" clássico)
const N = { D3: 146.8, F3: 174.6, A3: 220, Cs4: 277.2, D4: 293.7, F4: 349.2, G4: 392, Gs4: 415.3, A4: 440, D5: 587.3, F5: 698.5, A5: 880 };

export const HALLOWEEN = {
  join: (ctx, out, t) => cackle(ctx, out, t), // risada fina de bruxa
  leave: (ctx, out, t) => cackle(ctx, out, t, { n: 4, from: 820, to: 520, syl: 0.08, gap: 0.04 }), // mais curta e caindo: foi embora
  msg: (ctx, out, t) => {
    bell(ctx, out, t, N.A5, 0.32, 0.9);
    bell(ctx, out, t + 0.13, N.Gs4 * 2, 0.26, 1.1); // trítono abaixo: o intervalo "do diabo"
    return 1.3;
  },
  mute: (ctx, out, t) => creak(ctx, out, t, false, 0.26, 0.45),
  unmute: (ctx, out, t) => creak(ctx, out, t, true, 0.26, 0.45),
  streamOn: (ctx, out, t) => organ(ctx, out, t, [N.D3, N.F3, N.A3, N.D4]),
  streamOff: (ctx, out, t) => organ(ctx, out, t, [N.D4, N.A3, N.F3, N.Cs4 / 2], 0.16, 0.3),
  poke: (ctx, out, t) => {
    for (let i = 0; i < 4; i++) bat(ctx, out, t + i * 0.09 + (i % 2) * 0.02);
    return 0.45;
  },
  dice: (ctx, out, t, crit) => {
    if (crit === 'crit') return organ(ctx, out, t, [N.D4, N.F4, N.A4, N.D5], 0.08, 0.2, 0.3);
    if (crit === 'fumble') return ghost(ctx, out, t, N.A3, N.D3, 0.7);
    bell(ctx, out, t, N.D5, 0.3, 0.8);
    return 0.8;
  },
};

// Eco de cripta: duas repetições que somem, por cima do som seco
export function cryptEcho(ctx, dest) {
  const input = ctx.createGain();
  const dry = ctx.createGain();
  dry.gain.value = 1;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.19;
  const fb = ctx.createGain();
  fb.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.42;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  input.connect(dry).connect(dest);
  input.connect(delay);
  delay.connect(lp).connect(fb).connect(delay);
  lp.connect(wet).connect(dest);
  return input;
}
