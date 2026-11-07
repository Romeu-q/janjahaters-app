// Cópia de renderer/identity.js (o gateway roda sozinho, sem o resto do app). Mantenha as duas iguais.
// Identidade assinada: cada pessoa tem um par de chaves Ed25519 (WebCrypto) e assina tudo o que escreve.
// Sem isso, no P2P qualquer um podia dizer que é outra pessoa (e, com cargos, se passar pelo dono).
//
// - A chave pública vai em cada registro (`pk`) e no "hi"; a assinatura (`sig`) cobre o registro inteiro.
// - Quem entrou depois desta versão tem o id = começo do hash da chave: o id prova a chave sozinho.
// - Para os ids antigos (aleatórios), vale a primeira chave vista para aquele id (e ela fica guardada).

const enc = new TextEncoder();
const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
export const sha256hex = async (data) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data))].map((b) => b.toString(16).padStart(2, '0')).join('');

/** JSON com as chaves em ordem e sem a assinatura: o mesmo registro dá sempre o mesmo texto. */
export function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object')
    return (
      '{' +
      Object.keys(v)
        .filter((k) => k !== 'sig' && v[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonical(v[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(v ?? null);
}

let priv = null;
export let publicKey = ''; // base64url da chave pública (32 bytes)

/** Carrega (ou cria, na primeira vez) as chaves deste PC. */
export async function loadKeys(store) {
  const saved = store.get('keys', null);
  if (saved?.priv && saved?.pub) {
    try {
      priv = await crypto.subtle.importKey('pkcs8', unb64u(saved.priv), { name: 'Ed25519' }, false, ['sign']);
      publicKey = saved.pub;
      return { created: false };
    } catch {}
  }
  const k = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  priv = k.privateKey;
  publicKey = b64u(await crypto.subtle.exportKey('raw', k.publicKey));
  store.set('keys', { priv: b64u(await crypto.subtle.exportKey('pkcs8', k.privateKey)), pub: publicKey });
  return { created: true };
}

/** id de quem é novo: o começo do hash da chave pública (prova a chave sozinho). */
export const idFromKey = async (pk) => (await sha256hex(unb64u(pk))).slice(0, 32);

export async function signText(text) {
  return b64u(await crypto.subtle.sign('Ed25519', priv, enc.encode(text)));
}
export async function signRecord(rec) {
  rec.sig = await signText(canonical(rec));
  return rec;
}

const keyCache = new Map();
async function importPub(pk) {
  if (!keyCache.has(pk)) keyCache.set(pk, crypto.subtle.importKey('raw', unb64u(pk), { name: 'Ed25519' }, false, ['verify']));
  return keyCache.get(pk);
}
export async function verifyText(text, sig, pk) {
  try {
    if (typeof sig !== 'string' || typeof pk !== 'string' || pk.length !== 43) return false;
    return await crypto.subtle.verify('Ed25519', await importPub(pk), unb64u(sig), enc.encode(text));
  } catch {
    return false;
  }
}
export const verifyRecord = (rec) => verifyText(canonical(rec), rec.sig, rec.pk);

// ----- de quem é cada chave (id -> chave pública) -----
let bindings = {};
let saveBindings = () => {};
export function initBindings(store) {
  bindings = store.get('pubkeys', {});
  saveBindings = () => store.set('pubkeys', bindings);
}
export const keyOf = (uid) => bindings[uid] || null;

/** A chave `pk` pode ser do `uid`? (id que vem do hash da chave, ou a primeira chave vista para ele) */
export async function bindKey(uid, pk) {
  if (typeof uid !== 'string' || typeof pk !== 'string' || pk.length !== 43) return false;
  if (bindings[uid]) return bindings[uid] === pk;
  // id que sai da chave: prova sozinho. Id antigo (de antes das chaves): vale a primeira chave vista.
  if ((await idFromKey(pk)) !== uid && !/^[\w.-]{1,64}$/.test(uid)) return false;
  bindings[uid] = pk;
  saveBindings();
  return true;
}
