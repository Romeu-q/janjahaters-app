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

// ----- chave de conversa privada (X25519): DMs e o código novo do grupo -----
// Cada PC tem também um par X25519. A chave pública vai no "hi", assinada com a Ed25519 (não dá para trocar
// no caminho). Duas pessoas tiram dela o mesmo segredo, que ninguém mais consegue calcular.
let dhPriv = null;
export let dhPublic = '';
export async function loadDhKeys(store) {
  const saved = store.get('dhkeys', null);
  if (saved?.priv && saved?.pub) {
    try {
      dhPriv = await crypto.subtle.importKey('pkcs8', unb64u(saved.priv), { name: 'X25519' }, false, ['deriveBits']);
      dhPublic = saved.pub;
      return;
    } catch {}
  }
  const k = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
  dhPriv = k.privateKey;
  dhPublic = b64u(await crypto.subtle.exportKey('raw', k.publicKey));
  store.set('dhkeys', { priv: b64u(await crypto.subtle.exportKey('pkcs8', k.privateKey)), pub: dhPublic });
}
/** o texto que a Ed25519 assina para provar que a chave X25519 é de quem diz */
export const dhProofText = (uid, dh) => `janja-dh:${uid}:${dh}`;
async function sharedBits(theirDh, label) {
  const pub = await crypto.subtle.importKey('raw', unb64u(theirDh), { name: 'X25519' }, false, []);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'X25519', public: pub }, dhPriv, 256));
  const tag = enc.encode(':' + label);
  const all = new Uint8Array(bits.length + tag.length);
  all.set(bits);
  all.set(tag, bits.length);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', all));
}
/** segredo em comum com o dono de `theirDh` (hex), para usar como senha de sala */
export const sharedSecret = async (theirDh, label = 'room') => [...(await sharedBits(theirDh, label))].map((b) => b.toString(16).padStart(2, '0')).join('');
/** cifra um texto que só o dono de `theirDh` abre (AES-GCM com o segredo em comum) */
export async function seal(theirDh, text) {
  const key = await crypto.subtle.importKey('raw', await sharedBits(theirDh, 'seal'), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return b64u(out);
}
export async function unseal(theirDh, data) {
  try {
    const raw = unb64u(data);
    const key = await crypto.subtle.importKey('raw', await sharedBits(theirDh, 'seal'), 'AES-GCM', false, ['decrypt']);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12)));
  } catch {
    return null;
  }
}
