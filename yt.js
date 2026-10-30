'use strict';
// Busca e "rádio" do YouTube/YouTube Music. Usado pelo app do PC (main.js) e pelo app Android (mobile/bridge.js).
// `client` é um Innertube do youtubei.js.

function mapResults(res) {
  const shelf = res?.contents?.find((c) => Array.isArray(c?.contents)) || res?.contents?.[0];
  return (shelf?.contents || [])
    .filter((i) => typeof i?.id === 'string' && /^[\w-]{11}$/.test(i.id))
    .map((i) => ({
      id: i.id,
      title: String(i.title || '').slice(0, 200),
      artist: (i.artists || i.authors || [])
        .map((a) => a?.name)
        .filter(Boolean)
        .join(', ')
        .slice(0, 100),
      album: String(i.album?.name || '').slice(0, 100),
      dur: (i.duration?.seconds || 0) * 1000,
      thumb: i.thumbnail?.contents?.[0]?.url || '',
    }));
}
// resultados da busca normal do YouTube (mixes, sets e vídeos que não estão no YouTube Music)
function mapVideos(res) {
  return (res?.videos || [])
    .filter((v) => typeof (v?.id || v?.video_id) === 'string')
    .map((v) => ({
      id: v.id || v.video_id,
      title: String(v.title?.text || v.title || '').slice(0, 200),
      artist: String(v.author?.name || '').slice(0, 100),
      album: '',
      dur: (v.duration?.seconds || 0) * 1000,
      thumb: v.thumbnails?.[0]?.url || v.best_thumbnail?.url || '',
    }))
    .filter((v) => /^[\w-]{11}$/.test(v.id));
}
// quanto o resultado bate com o que foi digitado: "full clear mix 1" acha "FULLCLEAR MIX VOL.1"
const plain = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
// versões que a pessoa só quer quando pede
const VARIANTS = /\b(8d|slowed|sped up|speed up|reverb|nightcore|karaoke|cover|live|ao vivo|en vivo|en directo|remix|instrumental|lyrics?|letra|legendado)\b/;
function relevance(query, r) {
  const q = plain(query);
  const words = q.split(' ').filter(Boolean);
  if (!words.length) return 0;
  const qCompact = q.replace(/ /g, '');
  const title = plain(r.title);
  const compact = plain(r.title + ' ' + r.artist).replace(/ /g, '');
  // quanto do que foi digitado aparece no título/artista ("full clear" acha "fullclear")
  const found = words.filter((w) => compact.includes(w)).length / words.length;
  // quanto do título é o que foi pedido (título cheio de outras coisas perde ponto)
  const artist = plain(r.artist);
  const tWords = title.split(' ').filter((w) => w && !artist.split(' ').includes(w));
  const precision = tWords.length ? tWords.filter((w) => qCompact.includes(w)).length / tWords.length : 0;
  const variant = title.match(VARIANTS);
  const penalty = variant && !q.includes(variant[1]) ? 0.3 : 0;
  return found + precision * 0.6 + (compact.includes(qCompact) ? 0.3 : 0) + (r.kind === 'song' ? 0.1 : 0) - penalty;
}

async function search(client, query) {
  const q = String(query || '')
    .trim()
    .slice(0, 100);
  if (!q) return [];
  const [songs, videos, yt] = await Promise.allSettled([client.music.search(q, { type: 'song' }), client.music.search(q, { type: 'video' }), client.search(q, { type: 'video' })]);
  const ok = (r, map) => (r.status === 'fulfilled' ? map(r.value) : []);
  const sources = [
    ok(songs, mapResults).slice(0, 6).map((r) => ({ ...r, kind: 'song' })),
    ok(videos, mapResults).slice(0, 5).map((r) => ({ ...r, kind: 'video' })),
    ok(yt, mapVideos).slice(0, 5).map((r) => ({ ...r, kind: 'video' })),
  ];
  // a posição em cada busca e aparecer em mais de uma contam como popularidade
  const byId = new Map();
  for (const src of sources)
    src.forEach((r, i) => {
      const pop = 0.2 - i * 0.035;
      const cur = byId.get(r.id);
      if (cur) {
        cur.pop = Math.max(cur.pop, pop);
        cur.hits++;
      } else byId.set(r.id, { r, pop, hits: 1 });
    });
  if (!byId.size && songs.status === 'rejected') throw songs.reason;
  return [...byId.values()]
    .map((x) => ({ r: x.r, score: relevance(q, x.r) + x.pop + (x.hits - 1) * 0.12 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.r);
}

// autoplay: o "rádio" do YouTube Music a partir da música que acabou (mesmo gênero/clima)
async function related(client, id) {
  if (!/^[\w-]{11}$/.test(String(id))) return [];
  const up = await client.music.getUpNext(id, true);
  return (up?.contents || [])
    .filter((i) => typeof i?.video_id === 'string' && /^[\w-]{11}$/.test(i.video_id) && i.video_id !== id)
    .slice(0, 30)
    .map((i) => ({
      id: i.video_id,
      title: String(i.title?.text || i.title || '').slice(0, 200),
      artist:
        (i.artists || [])
          .map((a) => a?.name)
          .filter(Boolean)
          .join(', ')
          .slice(0, 100) || String(i.author || '').slice(0, 100),
      dur: (i.duration?.seconds || 0) * 1000,
      thumb: i.thumbnail?.[0]?.url || i.thumbnail?.contents?.[0]?.url || '',
    }));
}

module.exports = { search, related };
