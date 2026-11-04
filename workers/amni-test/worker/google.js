// Verify a Google Identity Services ID token (RS256 JWT) with Web Crypto.

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
let cache = { keys: null, until: 0 };

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const json = (s) => JSON.parse(new TextDecoder().decode(b64url(s)));

async function keys(fetchImpl, now) {
  if (cache.keys && now < cache.until) return cache.keys;
  const r = await fetchImpl(JWKS_URL);
  if (!r.ok) throw new Error('could not fetch Google keys');
  const age = Number((r.headers.get('cache-control') || '').match(/max-age=(\d+)/)?.[1] || 3600);
  cache = { keys: (await r.json()).keys, until: now + age * 1000 };
  return cache.keys;
}

export async function verifyGoogleIdToken(token, clientId, { fetchImpl = fetch, now = Date.now() } = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const [h, p, sig] = parts;
  const header = json(h);
  if (header.alg !== 'RS256') throw new Error('unexpected algorithm');
  const jwk = (await keys(fetchImpl, now)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error('bad signature');
  const c = json(p);
  if (c.iss !== 'accounts.google.com' && c.iss !== 'https://accounts.google.com') throw new Error('wrong issuer');
  if (c.aud !== clientId) throw new Error('wrong audience');
  if (typeof c.exp !== 'number' || c.exp * 1000 < now - 60000) throw new Error('token expired');
  if (!c.email || c.email_verified !== true) throw new Error('email not verified');
  return { sub: c.sub, email: String(c.email).toLowerCase(), name: c.name || '' };
}

export const _resetGoogleKeyCache = () => { cache = { keys: null, until: 0 }; };
