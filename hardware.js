'use strict';
// O que este PC tem (processador, placa de vídeo, monitor) e se o Chromium está mesmo usando a placa para
// codificar e decodificar vídeo. Serve para o app escolher a qualidade da stream e para se corrigir sozinho:
// em alguns PCs o sandbox da GPU falha sem derrubar nada e o Chromium cai em software em silêncio (encode,
// decode e composição na CPU). Medido num Ryzen 5 5500 + RX 5600 XT: padrão = tudo em software; sem o sandbox
// da GPU = tudo em hardware.
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');

const VIRTUAL = /parsec|virtual|remote|basic (render|display)|indirect|displaylink|citrix|vmware|hyper-v|spacedesk|meta|idd/i;
const DISCRETE = /geforce|rtx|gtx|quadro|radeon (rx|pro|r[579]|hd)|arc [ab]\d|intel.*arc/i;

function windowsGpus() {
  if (process.platform !== 'win32') return Promise.resolve([]);
  const cmd = 'Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion | ConvertTo-Json -Compress';
  return new Promise((done) =>
    execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', cmd], { windowsHide: true, timeout: 10000 }, (err, out) => {
      try {
        const j = JSON.parse(String(out || '[]'));
        done((Array.isArray(j) ? j : [j]).filter((g) => g?.Name).map((g) => ({ name: String(g.Name).trim(), driver: String(g.DriverVersion || '') })));
      } catch {
        done([]);
      }
    }),
  );
}

const on = (v) => typeof v === 'string' && v.startsWith('enabled');

async function collect({ app, screen, gpuFlag }) {
  await app.getGPUInfo('basic').catch(() => null); // obriga o processo da GPU a subir antes de perguntar
  const feat = app.getGPUFeatureStatus();
  const gpus = (await windowsGpus()).map((g) => ({ ...g, virtual: VIRTUAL.test(g.name), discrete: DISCRETE.test(g.name) && !VIRTUAL.test(g.name) }));
  const real = gpus.filter((g) => !g.virtual);
  const d = screen.getPrimaryDisplay();
  const cpus = os.cpus();
  const hw = {
    cpu: String(cpus[0]?.model || '').replace(/\s+/g, ' ').trim(),
    threads: cpus.length,
    ramGb: Math.round(os.totalmem() / 2 ** 30),
    gpus,
    gpu: real.find((g) => g.discrete)?.name || real[0]?.name || '',
    discrete: real.some((g) => g.discrete),
    display: { w: Math.round(d.size.width * d.scaleFactor), h: Math.round(d.size.height * d.scaleFactor), hz: d.displayFrequency || 60 },
    // o Chromium está usando a placa?
    encode: on(feat.video_encode),
    decode: on(feat.video_decode),
    compositing: on(feat.gpu_compositing),
    // placa de verdade existe mas o Chromium está em software (e já tentamos sem o sandbox da GPU, ou não dá)
    softwareFallback: real.length > 0 && !on(feat.video_encode),
    noSandbox: !!gpuFlag && fs.existsSync(gpuFlag),
  };
  return hw;
}

// A placa existe e o Chromium não a usa, e ainda não tentamos sem o sandbox da GPU: liga e reabre uma vez.
// (se já está ligado e continua em software, não adianta insistir: não há laço de reabrir)
function needsHeal(hw) {
  return hw.softwareFallback && !hw.noSandbox;
}

// Qualidade recomendada para esta máquina. O H.264 do OpenH264 gastou menos CPU que VP8, VP9 e AV1 nas medições
// (2 ms contra 3 a 13 ms por quadro 720p), e com a placa ativa o encode sai da CPU de vez: o que o League precisa,
// já que o jogo ocupa o processador.
function recommend(hw) {
  const screenH = hw.display?.h || 1080;
  let res, fps, why;
  if (hw.encode) {
    res = 1080;
    fps = 30; // 60 fps é escolha da pessoa ("Jogos"): dobra o que cada espectador precisa baixar
    why = 'a placa de vídeo codifica a stream, então o processador fica livre para o jogo';
  } else if (hw.threads >= 12) {
    res = 1080;
    fps = 30;
    why = 'sem encode pela placa; o processador aguenta 1080p30';
  } else if (hw.threads >= 8) {
    res = 720;
    fps = 30;
    why = 'sem encode pela placa; 720p30 para não pesar no jogo';
  } else if (hw.threads >= 6) {
    res = 720;
    fps = 24;
    why = 'sem encode pela placa; 720p24 para poupar o processador';
  } else {
    res = 480;
    fps = 20;
    why = 'processador e placa limitados; qualidade leve para não travar o jogo';
  }
  if (hw.ramGb && hw.ramGb < 6) {
    res = Math.min(res, 480);
    fps = Math.min(fps, 20);
  }
  res = Math.min(res, screenH >= 1440 ? res : Math.max(480, screenH)); // não pede mais que a tela tem
  return { res, fps, codec: 'h264', mode: 'motion', why };
}

module.exports = { collect, needsHeal, recommend };
