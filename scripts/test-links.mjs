// node scripts/test-links.mjs <link...> — lê o link e acha as 3 primeiras músicas no YouTube Music
import { createRequire } from 'node:module';
import { Innertube } from 'youtubei.js';
const require = createRequire(import.meta.url);
const links = require('../links.js');
const yt = require('../yt.js');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const get = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  return { url: r.url, text: await r.text() };
};
const client = await Innertube.create({ retrieve_player: false, generate_session_locally: true, lang: 'pt', location: 'BR' });
for (const url of process.argv.slice(2)) {
  try {
    const r = await links.readLink(get, client, url);
    console.log(`\n${r.src} ${r.type} "${r.name}" — ${r.tracks.length} músicas`);
    for (const t of r.tracks.slice(0, 3)) {
      const m = t.id ? t : await links.matchTrack(client, yt.search, t);
      console.log(`  ${t.title} · ${t.artist} (${Math.round(t.dur / 1000)}s) -> ${m?.id} ${m?.title} · ${m?.artist} (${Math.round((m?.dur || 0) / 1000)}s)`);
    }
  } catch (err) {
    console.log('\nERRO', url, err.message);
  }
}
