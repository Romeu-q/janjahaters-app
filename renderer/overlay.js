// Sobreposição no jogo: janelinha transparente por cima de tudo com quem está na call e quem está falando.
// Os dados vêm da página principal pelo processo principal (overlay -> main -> aqui).
'use strict';
const box = document.getElementById('box');
const SVG = 'http://www.w3.org/2000/svg';
function icon(paths) {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '2.4');
  s.setAttribute('stroke-linecap', 'round');
  for (const d of paths) {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    s.append(p);
  }
  return s;
}
const MIC_OFF = ['M2 2l20 20', 'M18.9 13.4A7 7 0 0 0 19 12v-2', 'M5 10v2a7 7 0 0 0 12 5', 'M15 9.3V5a3 3 0 0 0-5.7-1.3', 'M9 9v3a3 3 0 0 0 5.1 2.1', 'M12 19v3'];
const DEAF = ['M2 2l20 20', 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 2.7-6.4', 'M21 15v-3a9 9 0 0 0-12.3-8.4', 'M21 19v-1'];
const initial = (n) => (String(n || '?').trim()[0] || '?').toUpperCase();

function render(d) {
  document.body.className = [d.pos?.[0] === 'b' ? 'bottom' : '', d.pos?.[1] === 'r' ? 'right' : ''].join(' ');
  const rows = [];
  if (d.ch && !d.only) {
    const h = document.createElement('div');
    h.className = 'ch';
    h.textContent = d.ch;
    rows.push(h);
  }
  for (const m of d.list || []) {
    if (d.only && !m.s) continue;
    const r = document.createElement('div');
    r.className = 'row' + (m.s ? ' talk' : '');
    const av = document.createElement('span');
    av.className = 'av';
    av.style.background = /^#[0-9a-f]{3,8}$/i.test(m.c) ? m.c : '#5865f2';
    av.textContent = initial(m.n);
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = m.n + (m.me ? ' (você)' : '');
    r.append(av, name);
    if (m.d) r.append(icon(DEAF));
    else if (m.m) r.append(icon(MIC_OFF));
    rows.push(r);
  }
  box.replaceChildren(...rows);
}
window.desk?.onOverlay?.(render);
