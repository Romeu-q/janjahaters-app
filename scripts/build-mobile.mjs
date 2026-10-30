// Monta a pasta www/ do app Android: a mesma interface do PC + mobile.js (a "ponte" com o Android).
// Rode depois do `npm run build:ui`.
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
let googleId = (process.env.GOOGLE_CLIENT_ID || '').trim();
if (!googleId && existsSync('oauth.json')) googleId = JSON.parse(readFileSync('oauth.json', 'utf8')).clientId?.trim() || '';

rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of ['style.css', 'bundle.js', 'icon.png', 'vendor']) cpSync(`renderer/${f}`, `www/${f}`, { recursive: true });

await build({
  entryPoints: ['mobile/bridge.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'chrome110',
  outfile: 'www/mobile.js',
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __GOOGLE_CLIENT_ID__: JSON.stringify(googleId) },
  logLevel: 'warning',
});

// a ponte carrega antes da interface
let html = readFileSync('renderer/index.html', 'utf8');
if (!html.includes('<script src="bundle.js"></script>')) throw new Error('index.html mudou: não achei o bundle.js');
html = html.replace('<script src="bundle.js"></script>', '<script src="mobile.js"></script>\n  <script src="bundle.js"></script>');
writeFileSync('www/index.html', html);
console.log(`www/ pronto (versão ${pkg.version}${googleId ? ', com selo do Google' : ''})`);
