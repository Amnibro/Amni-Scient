import {
  DEVICE_RE,
  KEY_RE,
  allowsEntitlement,
  canonicalEntitlement,
  entitlementExp,
  idOf,
  invoiceSubscription,
  isConstructSession,
  maxDevices,
  mintKey,
  normalizeStatus,
  nowMs,
  periodEndSec,
  safeEqual,
  sessionPaid,
  sha256Hex,
  signEntitlement,
  stripeSignatureValid,
  validSessionId,
  validSubscriptionId
} from './license.mjs'

export { OFFLINE_MS, canonicalEntitlement } from './license.mjs'

const ORIGIN = 'https://amni-scient.com'

function json(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  })
}

function corsHeaders(origin) {
  if (origin !== ORIGIN) return { Vary: 'Origin' }
  return {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  }
}

function browserAllowed(request) {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  return origin === ORIGIN
}

async function readJson(request, limit = 4096) {
  const text = await request.text()
  if (text.length > limit) return { tooBig: true }
  try { return { body: JSON.parse(text) } } catch { return { bad: true } }
}

async function stripeGet(env, path) {
  if (!env.STRIPE_SECRET || !path.startsWith('/v1/')) throw new Error('stripe')
  const response = await fetch('https://api.stripe.com' + path, {
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET },
    redirect: 'manual'
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('stripe')
  return response.json()
}

async function periodEndMs(env, session) {
  const subId = idOf(session.subscription)
  if (!subId) return nowMs(env) + 32 * 24 * 60 * 60 * 1000
  if (!validSubscriptionId(subId)) throw new Error('bad subscription')
  if (session.subscription && typeof session.subscription === 'object' && periodEndSec(session.subscription)) {
    return periodEndSec(session.subscription) * 1000
  }
  const sub = await stripeGet(env, '/v1/subscriptions/' + subId)
  if (!periodEndSec(sub)) throw new Error('no period')
  return periodEndSec(sub) * 1000
}

async function putRecord(env, record) {
  await env.LICENSES.put('key:' + record.key, JSON.stringify(record))
  if (record.session_id) await env.LICENSES.put('session:' + record.session_id, record.key)
  if (record.subscription) await env.LICENSES.put('sub:' + record.subscription, record.key)
}

async function readKey(env, key) {
  const raw = await env.LICENSES.get('key:' + key)
  return raw ? JSON.parse(raw) : null
}

async function mintForSession(env, session) {
  const existingKey = await env.LICENSES.get('session:' + session.id)
  if (existingKey) return readKey(env, existingKey)
  const subscription = idOf(session.subscription)
  const record = {
    key: mintKey(),
    customer: idOf(session.customer),
    subscription,
    status: 'active',
    devices: [],
    period_end: await periodEndMs(env, session),
    session_id: session.id
  }
  await putRecord(env, record)
  const winner = await env.LICENSES.get('session:' + session.id)
  if (winner && winner !== record.key) {
    await env.LICENSES.delete('key:' + record.key)
    return readKey(env, winner)
  }
  return record
}

async function updateSubscription(env, sub) {
  const subId = idOf(sub && (sub.id || sub))
  if (!validSubscriptionId(subId)) return
  const key = await env.LICENSES.get('sub:' + subId)
  if (!key) return
  const record = await readKey(env, key)
  if (!record) return
  if (sub.status) record.status = normalizeStatus(sub.status)
  if (periodEndSec(sub)) record.period_end = periodEndSec(sub) * 1000
  await env.LICENSES.put('key:' + record.key, JSON.stringify(record))
}

async function handleWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json(503, { ok: false, error: 'unconfigured' })
  const raw = await request.text()
  if (raw.length > 262144) return json(413, { ok: false, error: 'too_large' })
  const valid = await stripeSignatureValid(env.STRIPE_WEBHOOK_SECRET, request.headers.get('Stripe-Signature'), raw, Math.floor(nowMs(env) / 1000))
  if (!valid) return json(400, { ok: false, error: 'bad_signature' })
  let event
  try { event = JSON.parse(raw) } catch { return json(400, { ok: false, error: 'bad_json' }) }
  const object = event && event.data && event.data.object
  if (!object) return json(200, { ok: true, ignored: true })
  if (event.type === 'checkout.session.completed') {
    if (!sessionPaid(object) || !isConstructSession(env, object) || !validSessionId(object.id)) return json(200, { ok: true, ignored: true })
    const record = await mintForSession(env, object)
    return json(200, { ok: true, key_hint: record.key.slice(0, 9) })
  }
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    if (event.type === 'customer.subscription.deleted' && !object.status) object.status = 'canceled'
    await updateSubscription(env, object)
    return json(200, { ok: true })
  }
  if (event.type === 'invoice.payment_failed') {
    const subId = invoiceSubscription(object)
    if (validSubscriptionId(subId)) await updateSubscription(env, { id: subId, status: 'past_due' })
    return json(200, { ok: true })
  }
  return json(200, { ok: true, ignored: true })
}

async function handleClaim(request, env, url) {
  if (!browserAllowed(request)) return json(403, { ok: false, error: 'origin' }, corsHeaders(request.headers.get('Origin')))
  const headers = corsHeaders(request.headers.get('Origin'))
  const sessionId = url.searchParams.get('session_id') || ''
  if (!validSessionId(sessionId)) return json(400, { ok: false, error: 'bad_session' }, headers)
  if (!env.STRIPE_SECRET) return json(503, { ok: false, error: 'unconfigured' }, headers)
  const session = await stripeGet(env, '/v1/checkout/sessions/' + sessionId)
  if (!session) return json(404, { ok: false, error: 'unknown' }, headers)
  if (!sessionPaid(session)) return json(202, { ok: false, pending: true, error: 'pending' }, headers)
  if (!isConstructSession(env, session)) return json(404, { ok: false, error: 'unknown' }, headers)
  const record = await mintForSession(env, session)
  if (!record) return json(404, { ok: false, error: 'unknown' }, headers)
  return json(200, { ok: true, key: record.key }, headers)
}

async function issue(env, record) {
  const now = nowMs(env)
  if (!allowsEntitlement(record.status, record.period_end, now)) {
    return { error: 'subscription_ended', status: 403 }
  }
  if (!env.SIGNING_JWK) return { error: 'unconfigured', status: 503 }
  const ent = {
    exp: entitlementExp(record.period_end, now),
    key_hash: await sha256Hex(record.key),
    product: 'construct-pro',
    status: record.status
  }
  const signature = await signEntitlement(env, ent)
  return { ent, signature }
}

async function handleActivate(request, env) {
  if (!browserAllowed(request)) return json(403, { ok: false, error: 'origin' }, corsHeaders(request.headers.get('Origin')))
  const headers = corsHeaders(request.headers.get('Origin'))
  if (!(request.headers.get('Content-Type') || '').toLowerCase().includes('application/json')) return json(415, { ok: false, error: 'content_type' }, headers)
  const { body, tooBig, bad } = await readJson(request)
  if (tooBig) return json(413, { ok: false, error: 'too_large' }, headers)
  if (bad || !body || typeof body.key !== 'string' || typeof body.device !== 'string') return json(400, { ok: false, error: 'bad_format' }, headers)
  const key = body.key.trim().toUpperCase()
  const device = body.device.trim().toLowerCase()
  if (!KEY_RE.test(key)) return json(400, { ok: false, error: 'bad_format' }, headers)
  if (!DEVICE_RE.test(device)) return json(400, { ok: false, error: 'bad_device' }, headers)
  const record = await readKey(env, key)
  if (!record) return json(404, { ok: false, error: 'not_found' }, headers)
  const cap = maxDevices(env)
  if (!record.devices.includes(device)) {
    if (record.devices.length >= cap) return json(409, { ok: false, error: 'device_cap', max_devices: cap }, headers)
    const issued = await issue(env, record)
    if (issued.error) return json(issued.status, { ok: false, error: issued.error }, headers)
    record.devices.push(device)
    await env.LICENSES.put('key:' + record.key, JSON.stringify(record))
    return json(200, { ok: true, entitlement: issued.ent, signature: issued.signature }, headers)
  }
  const issued = await issue(env, record)
  if (issued.error) return json(issued.status, { ok: false, error: issued.error }, headers)
  return json(200, { ok: true, entitlement: issued.ent, signature: issued.signature }, headers)
}

async function handleDeactivate(request, env) {
  if (!browserAllowed(request)) return json(403, { ok: false, error: 'origin' }, corsHeaders(request.headers.get('Origin')))
  const headers = corsHeaders(request.headers.get('Origin'))
  const { body, tooBig, bad } = await readJson(request)
  if (tooBig) return json(413, { ok: false, error: 'too_large' }, headers)
  if (bad || !body || typeof body.key !== 'string' || typeof body.device !== 'string') return json(400, { ok: false, error: 'bad_format' }, headers)
  const key = body.key.trim().toUpperCase()
  const device = body.device.trim().toLowerCase()
  if (!KEY_RE.test(key) || !DEVICE_RE.test(device)) return json(400, { ok: false, error: 'bad_format' }, headers)
  const record = await readKey(env, key)
  if (!record) return json(404, { ok: false, error: 'not_found' }, headers)
  record.devices = record.devices.filter(item => item !== device)
  await env.LICENSES.put('key:' + record.key, JSON.stringify(record))
  return json(200, { ok: true }, headers)
}

function handleHealth(env) {
  const configured = {
    STRIPE_SECRET: !!env.STRIPE_SECRET,
    STRIPE_WEBHOOK_SECRET: !!env.STRIPE_WEBHOOK_SECRET,
    SIGNING_JWK: !!env.SIGNING_JWK,
    ADMIN_TOKEN: !!env.ADMIN_TOKEN,
    LICENSES: !!env.LICENSES
  }
  const ok = configured.STRIPE_SECRET && configured.STRIPE_WEBHOOK_SECRET && configured.SIGNING_JWK && configured.LICENSES
  return json(ok ? 200 : 503, { ok, service: 'construct-license', configured })
}

async function adminOk(request, env) {
  if (!env.ADMIN_TOKEN) return false
  const header = request.headers.get('Authorization') || ''
  const token = header.replace(/^Bearer\s+/i, '')
  return safeEqual(token, env.ADMIN_TOKEN)
}

async function handleReissue(request, env) {
  if (!env.ADMIN_TOKEN) return json(404, { ok: false, error: 'not_found' })
  if (!await adminOk(request, env)) return json(401, { ok: false, error: 'unauthorized' })
  const { body, bad, tooBig } = await readJson(request)
  if (bad || tooBig || !body) return json(400, { ok: false, error: 'bad_request' })
  const period = Number(body.period_end)
  const record = {
    key: mintKey(),
    customer: typeof body.customer === 'string' ? body.customer.slice(0, 120) : '',
    subscription: typeof body.subscription === 'string' && validSubscriptionId(body.subscription) ? body.subscription : '',
    status: normalizeStatus(body.status || 'active'),
    devices: [],
    period_end: Number.isFinite(period) && period > nowMs(env) ? period : nowMs(env) + 30 * 24 * 60 * 60 * 1000,
    session_id: ''
  }
  if (record.status === 'inactive') record.status = 'active'
  await env.LICENSES.put('key:' + record.key, JSON.stringify(record))
  if (record.subscription) await env.LICENSES.put('sub:' + record.subscription, record.key)
  return json(200, { ok: true, key: record.key })
}

async function handleReset(request, env) {
  if (!env.ADMIN_TOKEN) return json(404, { ok: false, error: 'not_found' })
  if (!await adminOk(request, env)) return json(401, { ok: false, error: 'unauthorized' })
  const { body, bad, tooBig } = await readJson(request)
  if (bad || tooBig || !body || typeof body.key !== 'string' || !KEY_RE.test(body.key.trim().toUpperCase())) return json(400, { ok: false, error: 'bad_format' })
  const key = body.key.trim().toUpperCase()
  const record = await readKey(env, key)
  if (!record) return json(404, { ok: false, error: 'not_found' })
  record.devices = []
  await env.LICENSES.put('key:' + record.key, JSON.stringify(record))
  return json(200, { ok: true })
}

function handleOptions(request) {
  const origin = request.headers.get('Origin') || ''
  if (origin !== ORIGIN) return new Response(null, { status: 403, headers: { Vary: 'Origin' } })
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

export default {
  async fetch(request, env) {
    try {
      if (!env.LICENSES) return json(503, { ok: false, error: 'unconfigured' })
      const url = new URL(request.url)
      const path = url.pathname.replace(/\/+$/, '') || '/'
      if (request.method === 'OPTIONS' && (path === '/claim' || path === '/activate' || path === '/deactivate')) return handleOptions(request)
      if (request.method === 'GET' && path === '/health') return handleHealth(env)
      if (request.method === 'POST' && path === '/stripe/webhook') return await handleWebhook(request, env)
      if (request.method === 'GET' && path === '/claim') return await handleClaim(request, env, url)
      if (request.method === 'POST' && path === '/activate') return await handleActivate(request, env)
      if (request.method === 'POST' && path === '/deactivate') return await handleDeactivate(request, env)
      if (request.method === 'POST' && path === '/admin/reissue') return await handleReissue(request, env)
      if (request.method === 'POST' && path === '/admin/reset-devices') return await handleReset(request, env)
      return json(404, { ok: false, error: 'not_found' })
    } catch {
      return json(500, { ok: false, error: 'server' })
    }
  }
}
