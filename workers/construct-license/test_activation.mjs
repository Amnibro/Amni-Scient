import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import worker, { OFFLINE_MS, canonicalEntitlement } from './worker.mjs'
import { stripeSignatureHeader } from './license.mjs'

const require = createRequire(import.meta.url)
const client = require('../../_shared/pro-license.js')
const nacl = require('../../_shared/vendor/nacl.min.js')

const SECRET = 'whsec_test_construct_pro'
const STRIPE = 'sk_test_construct_pro'
const ADMIN = 'admin-test-token'
const DAY = 24 * 60 * 60 * 1000

function memoryKv() {
  const m = new Map()
  return {
    m,
    get: async key => m.has(key) ? m.get(key) : null,
    put: async (key, value) => { m.set(key, value) },
    delete: async key => { m.delete(key) }
  }
}

async function signingEnv(extra = {}) {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey)
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey)
  const env = {
    LICENSES: memoryKv(),
    STRIPE_SECRET: STRIPE,
    STRIPE_WEBHOOK_SECRET: SECRET,
    SIGNING_JWK: JSON.stringify(priv),
    ADMIN_TOKEN: ADMIN,
    MAX_DEVICES: '3',
    ...extra
  }
  return { env, pub: { kty: pub.kty, crv: pub.crv, x: pub.x } }
}

function stripeState(now) {
  return {
    sessions: {
      cs_test_construct01: {
        id: 'cs_test_construct01',
        payment_status: 'paid',
        status: 'complete',
        customer: 'cus_construct',
        subscription: 'sub_construct01',
        metadata: { product: 'construct-pro' },
        success_url: 'https://amni-scient.com/construct/claim.html?session_id={CHECKOUT_SESSION_ID}',
        mode: 'subscription'
      },
      cs_test_unpaid0001: {
        id: 'cs_test_unpaid0001',
        payment_status: 'unpaid',
        status: 'open',
        metadata: { product: 'construct-pro' }
      }
    },
    subs: {
      sub_construct01: {
        id: 'sub_construct01',
        status: 'active',
        customer: 'cus_construct',
        current_period_end: Math.floor((now + 30 * DAY) / 1000)
      }
    }
  }
}

function installFetch(state) {
  const previous = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    const target = String(url)
    assert.equal(opts && opts.redirect, 'manual')
    assert.equal(opts.headers.Authorization, 'Bearer ' + STRIPE)
    assert.equal(target.startsWith('https://api.stripe.com/'), true)
    if (target.includes('/v1/checkout/sessions/')) {
      const id = target.split('/v1/checkout/sessions/')[1]
      const session = state.sessions[id]
      return new Response(session ? JSON.stringify(session) : JSON.stringify({ error: { message: 'missing' } }), { status: session ? 200 : 404 })
    }
    if (target.includes('/v1/subscriptions/')) {
      const id = target.split('/v1/subscriptions/')[1]
      const sub = state.subs[id]
      return new Response(sub ? JSON.stringify(sub) : '{}', { status: sub ? 200 : 404 })
    }
    throw new Error('unexpected fetch ' + target)
  }
  return () => { globalThis.fetch = previous }
}

async function postWebhook(env, event, { secret = SECRET, stamp } = {}) {
  const raw = JSON.stringify(event)
  const header = await stripeSignatureHeader(secret, raw, stamp ?? Math.floor((env.now ? env.now() : Date.now()) / 1000))
  return worker.fetch(new Request('https://construct-license.test/stripe/webhook', {
    method: 'POST',
    headers: { 'Stripe-Signature': header, 'Content-Type': 'application/json' },
    body: raw
  }), env)
}

function device(n) {
  return (n.toString(16).padStart(2, '0')).repeat(32)
}

async function activate(env, key, dev, origin = 'https://amni-scient.com') {
  return worker.fetch(new Request('https://construct-license.test/activate', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, device: dev })
  }), env)
}

test('health names which secrets are set and does not echo them', async () => {
  const { env } = await signingEnv()
  const response = await worker.fetch(new Request('https://construct-license.test/health'), env)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.service, 'construct-license')
  assert.deepEqual(body.configured, {
    STRIPE_SECRET: true,
    STRIPE_WEBHOOK_SECRET: true,
    SIGNING_JWK: true,
    ADMIN_TOKEN: true,
    LICENSES: true
  })
  const text = JSON.stringify(body)
  assert.equal(text.includes(SECRET), false)
  assert.equal(text.includes(STRIPE), false)
  assert.equal(text.includes(ADMIN), false)
  assert.equal(text.includes('kty'), false)
})

test('claim is idempotent, the 4th device is refused, a tampered entitlement fails, and a cancelled sub is not renewed after period_end', async () => {
  const started = Date.UTC(2026, 9, 8)
  let clock = started
  const { env, pub } = await signingEnv({ now: () => clock })
  const state = stripeState(started)
  const restore = installFetch(state)
  try {
    const event = {
      id: 'evt_test_1',
      type: 'checkout.session.completed',
      data: { object: state.sessions.cs_test_construct01 }
    }
    const bad = await postWebhook(env, event, { secret: 'wrong-secret' })
    assert.equal(bad.status, 400)
    const first = await postWebhook(env, event)
    assert.equal(first.status, 200)
    const second = await postWebhook(env, event)
    assert.equal(second.status, 200)
    const keys = [...env.LICENSES.m.keys()].filter(key => key.startsWith('key:'))
    assert.equal(keys.length, 1)

    const claim = async () => {
      const response = await worker.fetch(new Request('https://construct-license.test/claim?session_id=cs_test_construct01', {
        headers: { Origin: 'https://amni-scient.com' }
      }), env)
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://amni-scient.com')
      return response
    }
    const claimed = await (await claim()).json()
    const again = await (await claim()).json()
    assert.equal(claimed.ok, true)
    assert.equal(again.key, claimed.key)
    assert.match(claimed.key, /^AMNI-PRO-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/)
    const otherOrigin = await worker.fetch(new Request('https://construct-license.test/claim?session_id=cs_test_construct01', {
      headers: { Origin: 'https://evil.example' }
    }), env)
    assert.equal(otherOrigin.status, 403)

    const pending = await worker.fetch(new Request('https://construct-license.test/claim?session_id=cs_test_unpaid0001'), env)
    assert.equal(pending.status, 202)
    assert.equal((await pending.json()).pending, true)

    const activated = []
    for (let i = 1; i <= 3; i++) {
      const response = await activate(env, claimed.key, device(i))
      assert.equal(response.status, 200, 'device ' + i)
      activated.push(await response.json())
    }
    const fourth = await activate(env, claimed.key, device(4))
    assert.equal(fourth.status, 409)
    assert.equal((await fourth.json()).error, 'device_cap')
    const same = await activate(env, claimed.key, device(1))
    assert.equal(same.status, 200)

    const body = activated[0]
    assert.equal(canonicalEntitlement(body.entitlement), client.canonicalEntitlement(body.entitlement))
    assert.equal(body.entitlement.product, 'construct-pro')
    assert.equal(body.entitlement.exp, started + OFFLINE_MS)
    assert.equal(await client.verifyEntitlement(body.entitlement, body.signature, pub, claimed.key), true)
    assert.equal(await client.verifyEntitlement(body.entitlement, body.signature, pub, claimed.key, { forceNacl: true, nacl }), true)
    const tampered = { ...body.entitlement, exp: body.entitlement.exp + DAY }
    assert.equal(await client.verifyEntitlement(tampered, body.signature, pub, claimed.key), false)
    assert.equal(client.access({ ent: body.entitlement }, started + 6 * DAY, true).ok, true)
    assert.equal(client.access({ ent: body.entitlement }, started + 8 * DAY, true).ok, false)

    state.subs.sub_construct01.status = 'canceled'
    state.subs.sub_construct01.current_period_end = Math.floor((started + 10 * DAY) / 1000)
    const cancelled = await postWebhook(env, {
      id: 'evt_cancel',
      type: 'customer.subscription.deleted',
      data: { object: state.subs.sub_construct01 }
    })
    assert.equal(cancelled.status, 200)
    clock = started + 6 * DAY
    const during = await activate(env, claimed.key, device(1))
    assert.equal(during.status, 200)
    const duringBody = await during.json()
    assert.ok(duringBody.entitlement.exp <= started + 10 * DAY)
    clock = started + 10 * DAY + 1000
    const after = await activate(env, claimed.key, device(1))
    assert.equal(after.status, 403)
    assert.equal((await after.json()).error, 'subscription_ended')
    assert.equal(client.access({ ent: duringBody.entitlement }, clock, true).ok, false)

    const freed = await worker.fetch(new Request('https://construct-license.test/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://amni-scient.com' },
      body: JSON.stringify({ key: claimed.key, device: device(2) })
    }), env)
    assert.equal(freed.status, 200)
  } finally {
    restore()
  }
})

test('a non-construct checkout does not mint a key', async () => {
  const { env } = await signingEnv()
  const restore = installFetch(stripeState(Date.now()))
  try {
    const response = await postWebhook(env, {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_braid000001', payment_status: 'paid', status: 'complete', metadata: { product: 'braid' }, success_url: 'https://amni-scient.com/braid-welcome.html' } }
    })
    assert.equal(response.status, 200)
    assert.equal([...env.LICENSES.m.keys()].some(key => key.startsWith('key:')), false)
  } finally {
    restore()
  }
})

test('admin reissue mints a key and reset clears devices', async () => {
  const { env } = await signingEnv()
  const denied = await worker.fetch(new Request('https://construct-license.test/admin/reissue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong' },
    body: JSON.stringify({ customer: 'cus_manual' })
  }), env)
  assert.equal(denied.status, 401)
  const minted = await worker.fetch(new Request('https://construct-license.test/admin/reissue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ADMIN },
    body: JSON.stringify({ customer: 'cus_manual', period_end: Date.now() + 10 * DAY })
  }), env)
  const body = await minted.json()
  assert.equal(minted.status, 200)
  assert.match(body.key, /^AMNI-PRO-/)
  const on = await activate(env, body.key, device(9))
  assert.equal(on.status, 200)
  const reset = await worker.fetch(new Request('https://construct-license.test/admin/reset-devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ADMIN },
    body: JSON.stringify({ key: body.key })
  }), env)
  assert.equal(reset.status, 200)
  assert.deepEqual(JSON.parse(await env.LICENSES.get('key:' + body.key)).devices, [])
})
test('2025+ Stripe API shapes: period end on subscription items, renewal extends access, invoice parent links the sub', async () => {
  const started = Date.UTC(2026, 9, 8)
  let clock = started
  const { env } = await signingEnv({ now: () => clock })
  const state = stripeState(started)
  const sub = state.subs.sub_construct01
  delete sub.current_period_end
  sub.items = { data: [{ id: 'si_1', current_period_end: Math.floor((started + 30 * DAY) / 1000) }] }
  const restore = installFetch(state)
  try {
    const claimed = await (await worker.fetch(new Request('https://construct-license.test/claim?session_id=cs_test_construct01', { headers: { Origin: 'https://amni-scient.com' } }), env)).json()
    assert.equal(claimed.ok, true)
    assert.equal((await activate(env, claimed.key, device(1))).status, 200)
    sub.items.data[0].current_period_end = Math.floor((started + 61 * DAY) / 1000)
    assert.equal((await postWebhook(env, { id: 'evt_renew', type: 'customer.subscription.updated', data: { object: sub } })).status, 200)
    clock = started + 45 * DAY
    const renewed = await activate(env, claimed.key, device(1))
    assert.equal(renewed.status, 200)
    const failed = await postWebhook(env, { id: 'evt_fail', type: 'invoice.payment_failed', data: { object: { id: 'in_1', parent: { subscription_details: { subscription: 'sub_construct01' } } } } })
    assert.equal(failed.status, 200)
    assert.equal(JSON.parse(env.LICENSES.m.get('key:' + claimed.key)).status, 'past_due')
  } finally {
    restore()
  }
})
