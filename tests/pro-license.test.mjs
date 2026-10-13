import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const { access, legacyKey, legacyMessage, TRIAL_MS, verifyEntitlement, canonicalEntitlement } = require('../_shared/pro-license.js')
const nacl = require('../_shared/vendor/nacl.min.js')

const DAY = 864e5

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

test('trial, expiry, and a paid key follow the 7-day offline window', () => {
  const t0 = Date.UTC(2026, 0, 1)
  assert.equal(access({ trialStart: t0 }, t0 + DAY, false).kind, 'trial')
  assert.equal(access({ trialStart: t0 }, t0 + DAY, false).ok, true)
  assert.equal(access({ trialStart: t0 }, t0 + TRIAL_MS, false).ok, false)
  const activated = t0 + TRIAL_MS + 1000
  const ent = { exp: activated + 7 * DAY, product: 'construct-pro', status: 'active', key_hash: 'abc' }
  const ps = { trialStart: t0, ent, key: 'AMNI-PRO-01234-56789' }
  assert.equal(access(ps, activated, true).kind, 'pro')
  assert.equal(access(ps, activated + 6 * DAY, true).ok, true)
  assert.equal(access(ps, activated + 6 * DAY, true, true).kind, 'offline')
  assert.equal(access(ps, activated + 8 * DAY, true).ok, false)
  assert.equal(access(ps, activated + 8 * DAY, true, true).kind, 'locked')
})

test('an old checksum key does not unlock and company data is not part of the check', () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let body = 'AMNIPROKY'
  let sum = 0
  for (let i = 0; i < 9; i++) sum += body.charCodeAt(i) * (i + 3)
  body += (sum % 36).toString(36).toUpperCase()
  assert.equal(body.length, 10)
  assert.ok(alphabet.includes(body[9]) || /[0-9A-Z]/.test(body[9]))
  const key = 'AMNI-PRO-' + body.slice(0, 5) + '-' + body.slice(5)
  const ps = { key, co: { name: 'Kept Construction' }, trialStart: null }
  assert.equal(legacyKey(ps), true)
  assert.equal(access(ps, Date.now(), false).ok, false)
  assert.equal(ps.co.name, 'Kept Construction')
  assert.match(legacyMessage(), /Old-style keys/)
  assert.match(legacyMessage(), /untouched/)
})

test('WebCrypto and the tweetnacl fallback agree, and a flipped signature fails', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey)
  const key = 'AMNI-PRO-01234-56789'
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))].map(b => b.toString(16).padStart(2, '0')).join('')
  const ent = { exp: Date.now() + 7 * DAY, key_hash: hash, product: 'construct-pro', status: 'active' }
  const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(canonicalEntitlement(ent))))
  let binary = ''
  signature.forEach(byte => { binary += String.fromCharCode(byte) })
  const sig = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const jwk = { kty: 'OKP', crv: 'Ed25519', x: pub.x }
  assert.equal(await verifyEntitlement(ent, sig, jwk, key), true)
  assert.equal(await verifyEntitlement(ent, sig, jwk, key, { forceNacl: true, nacl }), true)
  assert.equal(await verifyEntitlement(ent, sig, jwk, 'AMNI-PRO-99999-99999'), false)
  const bad = sig.slice(0, 10) + (sig[10] === 'A' ? 'B' : 'A') + sig.slice(11)
  assert.equal(await verifyEntitlement(ent, bad, jwk, key), false)
})

test('shared client code no longer ships the checksum or Lemon Squeezy fallback', () => {
  const files = walk(new URL('../_shared/', import.meta.url).pathname)
  for (const file of files) {
    if (!/\.(js|mjs|css)$/.test(file)) continue
    const text = readFileSync(file, 'utf8')
    assert.equal(text.includes('lemonsqueezy'), false, file)
    assert.equal(text.includes('chk('), false, file)
    assert.equal(text.includes('AMNI_LSQ'), false, file)
  }
})
