'use strict';
// Links do Spotify, do Deezer e playlists do YouTube/YouTube Music.
// Spotify e Deezer só tocam a música inteira para quem tem Premium neles, então fazemos como os bots
// de música do Discord: lemos quais músicas o link tem (sem conta, pelas páginas e APIs públicas)
// e cada uma toca pela versão do YouTube Music. Usado pelo PC (main.js) e pelo Android (mobile/bridge.js).
//
// `get(url)` busca uma página e devolve { url (final, depois de redirecionar), text }.
// `client` é um Innertube do youtubei.js; `search` é o yt.search.

const MAX = 100; // músicas por link
const SPOTIFY = /(?:open\.spotify\.com\/(?:intl-[\w-]+\/)?(?:embed\/)?|spotify:)(track|album|playlist)[/:]([A-Za-z0-9]{22})/i;
const DEEZER = /deezer\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(track|album|playlist)\/(\d+)/i;
const SHORT = /^https?:\/\/(spotify\.link|spotify\.app\.link|link\.deezer\.com|deezer\.page\.link|dzr\.page\.link)\/\S+/i;
const YT_LIST = /(?:youtube\.com|youtu\.be)\S*[?&]list=([\w-]{12,})/i;

// que tipo de link é (ou null se não for um destes)
function linkKind(text) {
  const s = String(text || '').trim();
  let m = s.match(SPOTIFY);
  if (m) return { src: 'spotify', type: m[1].toLowerCase(), id: m[2] };
  m = s.match(DEEZER);
  if (m) return { src: 'deezer', type: m[1].toLowerCase(), id: m[2] };
  m = s.match(SHORT);
  if (m) return { src: 'short', url: m[0] };
  m = s.match(YT_LIST);
  // "RD..." são mixes automáticos do YouTube, não playlists de verdade
  if (m && !/^RD/.test(m[1])) return { src: 'youtube', type: 'playlist', id: m[1] };
  return null;
}

const cut = (s, n) => String(s || '').slice(0, n);

async function spotify(get, type, id) {
  const { text } = await get(`https://open.spotify.com/embed/${type}/${id}`);
  const m = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  const e = m && JSON.parse(m[1])?.props?.pageProps?.state?.data?.entity;
  if (!e) throw new Error('O Spotify não mostrou esse link (é privado?)');
  if (type === 'track') {
    const artist = (e.artists || []).map((a) => a.name).join(', ');
    return { name: e.name || e.title, tracks: [{ title: e.name || e.title, artist, dur: e.duration || 0 }] };
  }
  const tracks = (e.trackList || []).filter((t) => t.entityType !== 'episode').map((t) => ({ title: t.title, artist: t.subtitle, dur: t.duration || 0 }));
  return { name: e.name || e.title, tracks };
}

async function deezer(get, type, id) {
  const api = async (p) => {
    const j = JSON.parse((await get('https://api.deezer.com/' + p)).text);
    if (j.error) throw new Error('O Deezer não mostrou esse link (é privado?)');
    return j;
  };
  const map = (t) => ({ title: t.title, artist: t.artist?.name || '', dur: (t.duration || 0) * 1000 });
  if (type === 'track') {
    const t = await api('track/' + id);
    return { name: t.title, tracks: [map(t)] };
  }
  const [info, list] = await Promise.all([api(`${type}/${id}`), api(`${type}/${id}/tracks?limit=${MAX}`)]);
  return { name: info.title, tracks: (list.data || []).map(map) };
}

async function youtubePlaylist(client, id) {
  // pelo YouTube Music: funciona com playlists do YouTube e do YouTube Music
  const first = await client.music.getPlaylist(id);
  const name = first.header?.title?.text || String(first.header?.title || '') || 'Playlist do YouTube';
  let pl = first;
  const items = [...(pl.items || pl.contents || [])];
  while (items.length < MAX && pl.has_continuation) {
    pl = await pl.getContinuation();
    items.push(...(pl.items || pl.contents || []));
  }
  const tracks = items
    .map((v) => ({
      id: v.id || v.video_id,
      title: v.title?.text || String(v.title || ''),
      artist: (v.artists || v.authors || []).map((a) => a?.name).filter(Boolean).join(', '),
      dur: (v.duration?.seconds || 0) * 1000,
      thumb: v.thumbnail?.contents?.[0]?.url || '',
    }))
    .filter((v) => /^[\w-]{11}$/.test(v.id || ''));
  return { name, tracks };
}

// lê as músicas do link. Spotify/Deezer: só nome/artista/duração (sem `id`); YouTube: já com `id`
async function readLink(get, client, text) {
  let k = linkKind(text);
  if (!k) return null;
  if (k.src === 'short') {
    // link curto do app (spotify.link, link.deezer.com): segue o redirecionamento até o link de verdade
    const r = await get(k.url);
    k = linkKind(r.url) || linkKind((r.text.match(/https:\/\/(?:open\.spotify\.com|www\.deezer\.com)\/[^"'<>\s]+/) || [])[0]);
    if (!k || k.src === 'short') throw new Error('Não consegui abrir esse link curto');
  }
  const out = k.src === 'spotify' ? await spotify(get, k.type, k.id) : k.src === 'deezer' ? await deezer(get, k.type, k.id) : await youtubePlaylist(client, k.id);
  const tracks = out.tracks
    .filter((t) => t.title)
    .slice(0, MAX)
    .map((t) => ({ ...t, title: cut(t.title, 200), artist: cut(t.artist, 100) }));
  if (!tracks.length) throw new Error('Esse link não tem músicas');
  return { src: k.src, type: k.type, name: cut(out.name, 120), tracks };
}

// acha a música no YouTube Music: a busca já ordena por relevância; entre as primeiras, prefere a
// que tem a mesma duração (evita ao vivo, versão estendida, clipe com introdução)
const plain = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const VERSION = /\b(remix|mix|extended|edit|live|ao vivo|en vivo|cover|karaoke|instrumental|acoustic|acustico|slowed|sped|reverb|nightcore|8d|bootleg|mashup)\b/g;
async function matchTrack(client, search, t) {
  const artist = String(t.artist || '').split(',')[0];
  const results = await search(client, `${t.title} ${artist}`.trim());
  if (!results.length) return null;
  // versão diferente (remix, ao vivo, estendida…) só vale se a original também for
  const orig = plain(t.title);
  const wrongVersion = (r) => (plain(r.title).match(VERSION) || []).some((w) => !orig.includes(w));
  const top = results.slice(0, 8).filter((r) => !wrongVersion(r));
  if (!top.length) top.push(results[0]);
  const near = (r) => t.dur && r.dur && Math.abs(r.dur - t.dur) < 7000;
  const hasArtist = (r) => !artist || plain(r.artist).includes(plain(artist)) || plain(r.title).includes(plain(artist));
  const best = top.find((r) => r.kind === 'song' && near(r) && hasArtist(r)) || top.find((r) => near(r) && hasArtist(r)) || top.find((r) => r.kind === 'song' && hasArtist(r)) || top[0];
  return { id: best.id, title: best.title || t.title, artist: best.artist || t.artist, dur: best.dur || t.dur, thumb: best.thumb || '' };
}

module.exports = { linkKind, readLink, matchTrack };
