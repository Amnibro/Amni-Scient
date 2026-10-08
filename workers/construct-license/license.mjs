// Shared licence helpers for the Construct Pro worker.
// Keys are random Crockford base32. There is no checksum: the worker is the only thing that can mint one.

export const OFFLINE_MS = 7 * 24 * 60 * 60 * 1000
export const KEY_RE = /^AMNI-PRO-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/
export const DEVICE_RE = /^[a-f0-9]{64}$/
export const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const SESSION_RE = /^cs_[A-Za-z0-9_]{8,255}$/
const SUB_RE = /^sub_[A-Za-z0-9_]{4,255}$/

export function nowMs(env) {
  return typeof env.now === 'function' ? env.now() : Date.now()
}

export function canonicalEntitlement(ent) {
  return JSON.stringify({
    exp: ent.exp,
    key_hash: ent.key_hash,
    product: ent.product,
    status: ent.status
  })
}

export function bytesToB64url(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function b64urlToBytes(value) {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function mintKey() {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  let body = ''
  for (let i = 0; i < bytes.length; i++) body += ALPHABET[bytes[i] & 31]
  return 'AMNI-PRO-' + body.slice(0, 5) + '-' + body.slice(5)
}

export function maxDevices(env) {
  // TODO(anthony): confirm the device cap. Suggested value is 3, and it must match AMNI_PRO_MAX_DEVICES.
  const n = parseInt(env.MAX_DEVICES == null || env.MAX_DEVICES === '' ? '3' : env.MAX_DEVICES, 10)
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : 3
}

export function periodEndSec(sub) {
  if (!sub || typeof sub !== 'object') return 0
  const items = sub.items && Array.isArray(sub.items.data) ? sub.items.data : []
  return Math.max(Number(sub.current_period_end) || 0, ...items.map(item => Number(item && item.current_period_end) || 0))
}
export function invoiceSubscription(invoice) {
  const parent = invoice && invoice.parent && invoice.parent.subscription_details
  return idOf((invoice && invoice.subscription) || (parent && parent.subscription))
}
export function idOf(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return typeof value.id === 'string' ? value.id : ''
}

export function normalizeStatus(status) {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due') return 'past_due'
  if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') return 'canceled'
  return 'inactive'
}

export function allowsEntitlement(status, periodEnd, now) {
  if (!(periodEnd > now)) return false
  return status === 'active' || status === 'past_due' || status === 'canceled'
}

export function entitlementExp(periodEnd, now) {
  return Math.min(periodEnd, now + OFFLINE_MS)
}

export function isConstructSession(env, session) {
  if (!session || typeof session !== 'object') return false
  const meta = session.metadata && typeof session.metadata === 'object' ? session.metadata : {}
  if (meta.product === 'construct-pro') return true
  const price = env.STRIPE_PRICE_ID || ''
  if (price && (meta.price_id === price || session.price === price)) return true
  const items = session.line_items && Array.isArray(session.line_items.data) ? session.line_items.data : []
  if (price && items.some(item => item && (item.price === price || (item.price && item.price.id === price) || item.price_id === price))) return true
  return typeof session.success_url === 'string' && session.success_url.includes('/construct/claim.html')
}

export function sessionPaid(session) {
  return !!session && (session.payment_status === 'paid' || session.status === 'complete')
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
  return [...mac].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function stripeSignatureHeader(secret, rawBody, timestamp = Math.floor(Date.now() / 1000)) {
  const hex = await hmacHex(secret, timestamp + '.' + rawBody)
  return 't=' + timestamp + ',v1=' + hex
}

export async function stripeSignatureValid(secret, header, rawBody, nowSeconds, tolerance = 300) {
  if (!secret || !header || typeof rawBody !== 'string') return false
  const parts = String(header).split(',').map(part => part.trim())
  const stamp = parts.find(part => part.startsWith('t='))
  const signatures = parts.filter(part => part.startsWith('v1=')).map(part => part.slice(3).toLowerCase())
  if (!stamp || !signatures.length) return false
  const timestamp = Number(stamp.slice(2))
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > tolerance) return false
  const expected = await hmacHex(secret, timestamp + '.' + rawBody)
  return signatures.some(signature => timingEqual(signature, expected))
}

function timingEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false
  const [left, right] = await Promise.all([sha256Hex('k:' + a), sha256Hex('k:' + b)])
  return timingEqual(left, right)
}

export function validSessionId(id) {
  return SESSION_RE.test(id || '')
}

export function validSubscriptionId(id) {
  return SUB_RE.test(id || '')
}

export async function importSigningKey(jwkText) {
  const jwk = typeof jwkText === 'string' ? JSON.parse(jwkText) : jwkText
  if (!jwk || jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || !jwk.d || !jwk.x) throw new Error('bad signing key')
  return crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['sign'])
}

export async function signEntitlement(env, ent) {
  const key = await importSigningKey(env.SIGNING_JWK)
  const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', key, new TextEncoder().encode(canonicalEntitlement(ent))))
  return bytesToB64url(sig)
}
