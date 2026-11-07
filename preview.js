'use strict';
// Prévia de link no chat (como no Stoat/Discord): título, descrição e imagem da página, pelas tags
// OpenGraph/Twitter. Usado pelo PC (main.js) e pelo Android (mobile/bridge.js); quem busca a página é
// o `get(url)` de cada um, que devolve { url, type, text }.

// nada de endereço da rede de casa/do próprio PC (um link no chat não pode fazer o app "olhar" a rede local)
function isPublicUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.localhost') || h.endsWith('.internal') || !h.includes('.')) return false;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^(::1|fc|fd|fe80)/i.test(h)) return false;
  return true;
}

const decode = (s) =>
  String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();

function meta(html, names) {
  for (const n of names) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']*)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${n}["']`, 'i');
    const m = html.match(re1) || html.match(re2);
    if (m && m[1].trim()) return decode(m[1]);
  }
  return '';
}

function parsePreview(html, url) {
  const title = meta(html, ['og:title', 'twitter:title']) || decode((html.match(/<title[^>]*>([^<]{1,300})<\/title>/i) || [])[1]);
  const desc = meta(html, ['og:description', 'twitter:description', 'description']);
  let image = meta(html, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']);
  if (image) {
    try {
      image = new URL(image, url).toString();
    } catch {
      image = '';
    }
  }
  if (image && !/^https:\/\//.test(image)) image = '';
  const site = meta(html, ['og:site_name', 'application-name']) || new URL(url).hostname.replace(/^www\./, '');
  const color = (meta(html, ['theme-color']).match(/^#[0-9a-f]{6}$/i) || [''])[0];
  const big = meta(html, ['twitter:card']) === 'summary_large_image' || /youtube\.com|youtu\.be|twitch\.tv|imgur|tenor|giphy/i.test(url);
  if (!title && !desc && !image) return null;
  return { url, title: title.slice(0, 200), desc: desc.slice(0, 350), image, site: site.slice(0, 60), color, big };
}

// get(url) -> { url (final), type (content-type), text }
async function linkPreview(get, raw) {
  const url = String(raw || '').slice(0, 800);
  if (!isPublicUrl(url)) return null;
  // YouTube: o oEmbed oficial (a página do vídeo nem sempre vem com as tags)
  if (/^https?:\/\/(www\.|m\.|music\.)?(youtube\.com\/(watch|shorts|live)|youtu\.be\/)/i.test(url)) {
    try {
      const o = JSON.parse((await get('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url))).text);
      if (o?.title) return { url, title: String(o.title).slice(0, 200), desc: String(o.author_name || ''), image: /^https:/.test(o.thumbnail_url) ? o.thumbnail_url : '', site: 'YouTube', color: '#ff0000', big: true };
    } catch {}
  }
  const r = await get(url);
  if (!isPublicUrl(r.url || url)) return null; // redirecionou para dentro da rede
  if (r.type && /^image\//i.test(r.type)) return { url, title: '', desc: '', image: url, site: new URL(url).hostname, color: '', big: true };
  if (r.type && !/html/i.test(r.type)) return null;
  return parsePreview(String(r.text || '').slice(0, 512 * 1024), r.url || url);
}

module.exports = { linkPreview, parsePreview, isPublicUrl };
