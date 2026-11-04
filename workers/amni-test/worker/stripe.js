// Minimal Stripe REST client (form-encoded) and webhook signature check. No SDK dependency.

const API = 'https://api.stripe.com/v1/';

// Flatten { a: { b: 1 }, c: [x] } into a[b]=1&c[0]=x as Stripe expects.
export function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripe(env, path, params, { idempotencyKey, method = 'POST' } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw Object.assign(new Error('Payments are not configured yet'), { status: 503 });
  const headers = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const f = env.__fetch || fetch;
  const r = await f(API + path, { method, headers, body: method === 'GET' ? undefined : form(params || {}).toString() });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body?.error?.message || `Stripe error ${r.status}`), { status: 502 });
  return body;
}

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
}

// Stripe-Signature: t=timestamp,v1=sig[,v1=sig2]
export async function verifyStripeSignature(payload, header, secret, nowMs = Date.now(), toleranceSec = 300) {
  if (!secret || !header) return false;
  let t = null;
  const sigs = [];
  for (const kv of header.split(',')) {
    const [k, v] = kv.split('=');
    if (k === 't') t = Number(v);
    if (k === 'v1') sigs.push(v);
  }
  if (!t || !sigs.length || Math.abs(nowMs / 1000 - t) > toleranceSec) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some((s) => timingSafeEqual(s, expected));
}
