// Banco de testes da supressão de ruído (não vai no app instalado).
// Abre com: npm run lab  ->  http://localhost:5173/ns-lab.html
// Mistura uma fala real (lab/voz.wav, ou um .wav seu) com teclado mecânico, batidas na mesa e ventilador
// sintetizados, passa cada cenário pelas opções do app (o mesmo código: mic-chain.js) e mede.
import { buildMicChain } from './mic-chain.js';
import { createDeepFilterNetAudioWorklet } from '@workadventure/noise-suppression/deepfilternet';
import { DFN_URLS } from './mic-chain.js';

const SR = 48000;
const $ = (s) => document.querySelector(s);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// ---------- sons sintéticos ----------
// Tecla mecânica: estalo do switch (agudo, ~4 ms), batida da tecla no fundo (médio-grave, ~15 ms)
// e a vibração que a mesa transmite (grave, ~45 ms).
function addKey(buf, at, amp, deskAmp) {
  const i0 = Math.floor(at * SR);
  let lp = 0;
  for (let i = 0; i < SR * 0.08 && i0 + i < buf.length; i++) {
    const t = i / SR;
    const n = rnd();
    lp += (n - lp) * 0.08; // ruído "abafado" para a batida
    const click = (n - lp) * Math.exp(-t / 0.004) * amp;
    const thock = (lp * 6 + Math.sin(2 * Math.PI * 320 * t) * 0.5) * Math.exp(-t / 0.015) * amp * 0.6;
    const desk = Math.sin(2 * Math.PI * (70 + 20 * Math.exp(-t / 0.01)) * t) * Math.exp(-t / 0.045) * deskAmp;
    buf[i0 + i] += click + thock + desk;
  }
}
function typing(buf, from, to, { rate = 1, amp = 0.25, desk = 0.12 } = {}) {
  let t = from;
  while (t < to) {
    const word = 3 + Math.floor(Math.random() * 6);
    for (let k = 0; k < word && t < to; k++) {
      addKey(buf, t, amp * (0.7 + 0.6 * Math.random()), desk * (0.6 + 0.8 * Math.random()));
      t += (0.09 + Math.random() * 0.12) / rate;
    }
    t += (0.15 + Math.random() * 0.25) / rate; // espaço entre palavras
  }
}
function thumps(buf, from, to, amp = 0.5) {
  for (let t = from; t < to; t += 0.7 + Math.random() * 0.9) {
    const i0 = Math.floor(t * SR);
    for (let i = 0; i < SR * 0.15 && i0 + i < buf.length; i++) {
      const s = i / SR;
      buf[i0 + i] += Math.sin(2 * Math.PI * (55 + 30 * Math.exp(-s / 0.02)) * s) * Math.exp(-s / 0.06) * amp + rnd() * Math.exp(-s / 0.008) * amp * 0.3;
    }
  }
}
function fan(buf, amp = 0.03) {
  let b0 = 0, b1 = 0, b2 = 0; // ruído rosa (Paul Kellet) + zumbido do motor
  for (let i = 0; i < buf.length; i++) {
    const w = rnd();
    b0 = 0.99765 * b0 + w * 0.099;
    b1 = 0.963 * b1 + w * 0.2965;
    b2 = 0.57 * b2 + w * 1.0526;
    buf[i] += (b0 + b1 + b2 + w * 0.1848) * amp * 0.25 + Math.sin((2 * Math.PI * 120 * i) / SR) * amp * 0.3;
  }
}

// ---------- medidas ----------
const energy = (x, a = 0, b = x.length) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return s / Math.max(1, b - a);
};
const db = (e) => 10 * Math.log10(e + 1e-12);
// atraso da saída em relação à voz limpa (correlação cruzada em amostras de 1 ms)
function findLag(ref, out, maxMs = 200) {
  // 1) pelo contorno do volume em blocos de 1 ms (não depende de fase/filtros)
  const env = (x) => {
    const n = Math.floor(x.length / 48);
    const e = new Float32Array(n);
    for (let b = 0; b < n; b++) {
      let s = 0;
      for (let i = b * 48; i < b * 48 + 48; i++) s += Math.abs(x[i]);
      e[b] = s;
    }
    return e;
  };
  const er = env(ref), eo = env(out);
  let best = -Infinity, coarse = 0;
  for (let lag = 0; lag <= maxMs; lag++) {
    let s = 0;
    for (let i = 0; i + lag < eo.length && i < er.length; i++) s += er[i] * eo[i + lag];
    if (s > best) (best = s), (coarse = lag * 48);
  }
  // 2) refina amostra a amostra pela correlação (em módulo)
  best = -Infinity;
  let lagBest = coarse;
  for (let lag = Math.max(0, coarse - 96); lag <= coarse + 96; lag++) {
    let s = 0;
    for (let i = 0; i + lag < out.length; i += 3) s += ref[i] * out[i + lag];
    if (Math.abs(s) > best) (best = Math.abs(s)), (lagBest = lag);
  }
  return lagBest;
}
// ---------- medidas no espectro (como o ouvido percebe; não dependem de fase) ----------
// energia em 24 faixas (100 Hz a 16 kHz, escala logarítmica) por quadro de ~21 ms
const N = 1024;
const BANDS = Array.from({ length: 25 }, (_, i) => Math.round((100 * Math.pow(160, i / 24)) / (SR / N)));
function fft(re, im) {
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [re[i], re[j], im[i], im[j]] = [re[j], re[i], im[j], im[i]];
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < N; i += len)
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
      }
  }
}
function bandFrames(x, offset = 0) {
  const frames = [];
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let s = offset; s + N <= x.length; s += N) {
    for (let i = 0; i < N; i++) {
      re[i] = x[s + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
      im[i] = 0;
    }
    fft(re, im);
    const b = new Float64Array(24);
    for (let k = 0; k < 24; k++) for (let f = BANDS[k]; f < BANDS[k + 1]; f++) b[k] += re[f] * re[f] + im[f] * im[f];
    frames.push(b);
  }
  return frames;
}
const sum = (b) => b.reduce((a, v) => a + v, 0);
// quadros com fala: energia da voz limpa acima de -35 dB do pico
function speechMask(voiceFrames) {
  const e = voiceFrames.map(sum);
  const peak = Math.max(...e);
  return e.map((v) => v > peak * 10 ** -3.5);
}
// fidelidade da voz: distância espectral (dB) entre a saída e a voz limpa, só onde há fala. Menor = melhor.
function voiceDistance(voiceF, outF, mask) {
  let gainNum = 0, gainDen = 0;
  mask.forEach((m, i) => m && outF[i] && ((gainNum += sum(outF[i])), (gainDen += sum(voiceF[i]))));
  const g = gainNum / (gainDen || 1); // compensa o volume (o app nivela a voz)
  let d = 0, n = 0;
  mask.forEach((m, i) => {
    if (!m || !outF[i]) return;
    for (let k = 0; k < 24; k++) {
      const a = 10 * Math.log10(voiceF[i][k] * g + 1e-9), b = 10 * Math.log10(outF[i][k] + 1e-9);
      if (a < -60 && b < -60) continue;
      d += (a - b) ** 2;
      n++;
    }
  });
  return Math.sqrt(d / (n || 1));
}
// quanto o ruído caiu nos trechos sem fala (dB). Maior = melhor.
function pauseReduction(inF, outF, mask) {
  let ei = 0, eo = 0;
  mask.forEach((m, i) => !m && outF[i] && ((ei += sum(inF[i])), (eo += sum(outF[i]))));
  return 10 * Math.log10((ei + 1e-12) / (eo + 1e-12));
}
// teclado/ruído vazando durante a fala: o que a saída com ruído tem a mais que a saída só com voz,
// faixa por faixa, nos quadros com fala (dB em relação à voz). Mais negativo = menos vazamento.
function leakDuringSpeech(cleanOutF, outF, mask) {
  let extra = 0, base = 0;
  mask.forEach((m, i) => {
    if (!m || !outF[i] || !cleanOutF[i]) return;
    for (let k = 0; k < 24; k++) {
      extra += Math.max(0, outF[i][k] - cleanOutF[i][k]);
      base += cleanOutF[i][k];
    }
  });
  return 10 * Math.log10((extra + 1e-12) / (base + 1e-12));
}

// SI-SDR: quanto da saída é a voz limpa (escala livre). Mais alto = voz mais intacta e menos ruído.
function siSdr(ref, out, lag) {
  let dot = 0, rr = 0;
  const n = Math.min(ref.length, out.length - lag);
  for (let i = 0; i < n; i++) (dot += ref[i] * out[i + lag]), (rr += ref[i] * ref[i]);
  const a = dot / (rr + 1e-12);
  let es = 0, en = 0;
  for (let i = 0; i < n; i++) {
    const s = a * ref[i];
    const e = out[i + lag] - s;
    es += s * s;
    en += e * e;
  }
  return 10 * Math.log10(es / (en + 1e-12));
}

// ---------- processamento ----------
const ENGINES = [
  { id: 'raw', name: 'Sem tratamento' },
  { id: 'rnnoise', name: 'RNNoise (como na v1.9)', build: (ctx, src) => buildMicChain(ctx, src, { engine: 'rnnoise', gate: { on: true, auto: true, db: -50 } }) },
  {
    id: 'dfn-pure',
    name: 'DeepFilterNet3 puro',
    build: async (ctx, src) => {
      const w = await createDeepFilterNetAudioWorklet(ctx, DFN_URLS);
      await w.ready;
      src.connect(w.node);
      return { output: w.node, dispose: () => w.dispose() };
    },
  },
  { id: 'dfn', name: 'Nova (v1.10): DeepFilterNet3 + filtros', build: (ctx, src) => buildMicChain(ctx, src, { engine: 'dfn', gate: { on: true, auto: true, db: -50 } }) },
];
// variações para achar a melhor configuração (?variantes na URL)
if (location.search.includes('variantes')) {
  const g = { on: true, auto: true, db: -50 };
  const v = (id, name, opts) => ENGINES.push({ id, name, build: (ctx, src) => buildMicChain(ctx, src, { engine: 'dfn', gate: g, ...opts }) });
  v('dfn-nogain', 'DFN + filtros, sem postGain', { dfn: { postGain: false } });
  v('dfn-nogain-nolim', 'DFN só com corte de grave', { dfn: { postGain: false }, limiter: false });
  v('dfn-msf1', 'DFN + filtros, minSpeechFrames 1', { dfn: { minSpeechFrames: 1, postGain: false } });
  v('dfn-soft', 'DFN, portão suave (pausa 35 dB)', { dfn: { postGain: false, pauseAttenuationDb: 35 } });
  v('dfn-hp120', 'DFN, corte em 120 Hz', { dfn: { postGain: false }, lowCutHz: 120 });
  v('dfn-sa30', 'DFN, até 30 dB durante a fala', { dfn: { postGain: false, speechAttenuationDb: 30 } });
}

// Alguns worklets (o RNNoise) terminam de preparar o wasm de forma assíncrona: renderiza 0,5 s de silêncio,
// pausa um instante para eles ficarem prontos e só então toca o cenário (cortado da saída depois).
const PRE = 0.5;
async function render(engine, input) {
  const pre = Math.round(PRE * SR);
  const ctx = new OfflineAudioContext(1, pre + input.length + SR * 0.3, SR);
  const buf = ctx.createBuffer(1, input.length, SR);
  buf.copyToChannel(input, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  let chain = null;
  if (engine.build) chain = await engine.build(ctx, src);
  (chain ? chain.output : src).connect(ctx.destination);
  src.start(PRE);
  let t0 = 0;
  ctx.suspend(PRE / 2).then(async () => {
    await new Promise((r) => setTimeout(r, 400));
    t0 = performance.now();
    ctx.resume();
  });
  const out = await ctx.startRendering();
  const ms = performance.now() - t0;
  chain?.dispose?.();
  return { out: out.getChannelData(0).slice(pre), cpu: (ms / ((input.length / SR) * 1000)) * 100 };
}

async function loadVoice(url) {
  const ctx = new OfflineAudioContext(1, 1, SR);
  const ab = await (await fetch(url)).arrayBuffer();
  const b = await ctx.decodeAudioData(ab);
  const v = b.getChannelData(0).slice(0, SR * 12);
  // nível de fala normal: pico em -6 dBFS
  let peak = 0;
  for (const s of v) peak = Math.max(peak, Math.abs(s));
  for (let i = 0; i < v.length; i++) v[i] *= 0.5 / (peak || 1);
  return v;
}

function scenarios(voice) {
  const len = voice.length;
  const z = () => new Float32Array(len);
  const mk = (name, withVoice, addNoise) => {
    const noise = z();
    addNoise(noise);
    const mix = z();
    for (let i = 0; i < len; i++) mix[i] = (withVoice ? voice[i] : 0) + noise[i];
    return { name, voice: withVoice ? voice : null, noise, mix };
  };
  seed = 7;
  return [
    mk('1. Falando normalmente', true, () => {}),
    mk('2. Digitando sem falar', false, (n) => typing(n, 0.3, len / SR - 0.5)),
    mk('3. Falando e digitando', true, (n) => typing(n, 0.3, len / SR - 0.5)),
    mk('4. Digitação mecânica intensa', true, (n) => typing(n, 0.3, len / SR - 0.5, { rate: 1.8, amp: 0.45, desk: 0.25 })),
    mk('5. Ventilador ligado', true, (n) => fan(n, 0.04)),
    mk('6. Pancadas e vibração grave', true, (n) => thumps(n, 0.3, len / SR - 0.5, 0.55)),
  ];
}

async function run() {
  const status = $('#status');
  const file = $('#file').files[0];
  status.textContent = 'Carregando a voz…';
  const voice = await loadVoice(file ? URL.createObjectURL(file) : 'lab/voz.wav');
  const scs = scenarios(voice);
  const results = [];
  window.__lab = { scs, results, outs: {} };
  const voiceF = bandFrames(voice);
  const mask = speechMask(voiceF);
  for (const e of ENGINES) {
    seed = 7;
    status.textContent = `Processando: ${e.name}…`;
    // atraso medido no cenário só de fala
    const r1 = await render(e, scs[0].mix);
    const lag = e.id === 'raw' ? 0 : findLag(voice, r1.out);
    const row = { engine: e.name, lagMs: Math.round(lag / 48), cpu: r1.cpu, cells: [] };
    const clean = bandFrames(r1.out, lag);
    for (const sc of scs) {
      const r = sc === scs[0] ? r1 : await render(e, sc.mix);
      window.__lab.outs[e.id + '|' + sc.name] = r.out;
      const outF = sc === scs[0] ? clean : bandFrames(r.out, lag);
      const inF = bandFrames(sc.mix);
      const cell = {};
      if (sc.voice) {
        cell.voice = voiceDistance(voiceF, outF, mask);
        if (sc !== scs[0]) cell.leak = leakDuringSpeech(clean, outF, mask);
      }
      cell.pause = pauseReduction(inF, outF, sc.voice ? mask : mask.map(() => false));
      row.cpu = Math.max(row.cpu, r.cpu);
      row.cells.push(cell);
    }
    results.push(row);
    draw(scs, results);
  }
  status.textContent = 'Pronto. Clique numa célula para ouvir aquele resultado.';
}

function draw(scs, results) {
  const t = $('#table');
  const head = `<tr><th>Opção</th>${scs.map((s) => `<th>${s.name}</th>`).join('')}<th>Atraso</th><th>CPU</th></tr>`;
  const body = results
    .map(
      (r) =>
        `<tr><td>${r.engine}</td>${r.cells
          .map((c, i) => {
            const parts = [];
            if (c.voice != null) parts.push(`voz ${c.voice.toFixed(1)}`);
            if (c.leak != null) parts.push(`vaza ${c.leak.toFixed(1)}`);
            if (!(c.voice != null && c.leak == null && i === 0)) parts.push(`pausa −${c.pause.toFixed(1)}`);
            const v = parts.join('<br>');
            return `<td data-e="${ENGINES.find((e) => e.name === r.engine).id}" data-s="${scs[i].name}">${v}</td>`;
          })
          .join('')}<td>${r.lagMs} ms</td><td>${r.cpu.toFixed(1)}%</td></tr>`,
    )
    .join('');
  t.innerHTML = head + body;
}

// ouvir um resultado
let playing = null;
document.addEventListener('click', (e) => {
  const td = e.target.closest('td[data-e]');
  if (!td) return;
  const out = window.__lab?.outs[td.dataset.e + '|' + td.dataset.s];
  if (!out) return;
  playing?.stop();
  const ctx = new AudioContext({ sampleRate: SR });
  const b = ctx.createBuffer(1, out.length, SR);
  b.copyToChannel(out, 0);
  playing = ctx.createBufferSource();
  playing.buffer = b;
  playing.connect(ctx.destination);
  playing.start();
});
$('#run').onclick = () => run().catch((err) => ($('#status').textContent = 'Erro: ' + err.message));
window.runLab = run;
