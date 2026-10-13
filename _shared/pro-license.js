(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.AmniProLicense = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  const TRIAL_MS = 14 * 864e5
  const RECHECK_BEFORE_MS = 2 * 864e5
  const KEY_RE = /^AMNI-PRO-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/
  const DEVICE_KEY = 'amni.pro.device.v1'

  // Signed exp is the offline deadline. The worker sets it to min(period_end, now+7 days).
  // A failed recheck does not add a second week: 6 days offline stays unlocked, 8 days locks.
  function canonicalEntitlement(ent) {
    return JSON.stringify({
      exp: ent.exp,
      key_hash: ent.key_hash,
      product: ent.product,
      status: ent.status
    })
  }

  function access(ps, now, signatureOk, recheckFailed) {
    const ent = ps && ps.ent
    if (signatureOk && ent && ent.product === 'construct-pro' && Number.isFinite(ent.exp) && typeof ent.status === 'string') {
      if (now < ent.exp) return { ok: true, kind: recheckFailed ? 'offline' : 'pro' }
    }
    const t = ps && Number.isFinite(ps.seen) ? Math.max(now, Math.min(ps.seen, ps.trialStart + TRIAL_MS)) : now
    if (ps && Number.isFinite(ps.trialStart) && t >= ps.trialStart && t < ps.trialStart + TRIAL_MS) {
      return { ok: true, kind: 'trial', days: Math.max(1, Math.ceil((ps.trialStart + TRIAL_MS - t) / 864e5)) }
    }
    return { ok: false, kind: 'locked', days: 0 }
  }

  function needsRecheck(ps, now, signatureOk) {
    const ent = ps && ps.ent
    if (!signatureOk || !ent || !Number.isFinite(ent.exp)) return false
    return now >= ent.exp - RECHECK_BEFORE_MS
  }

  function legacyKey(ps) {
    return !!(ps && typeof ps.key === 'string' && ps.key && !ps.ent)
  }

  function b64urlToBytes(value) {
    const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad)
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
    return out
  }

  async function sha256Hex(text, subtle) {
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
  }

  function publicKeyOk(pubJwk) {
    return !!(pubJwk && pubJwk.kty === 'OKP' && pubJwk.crv === 'Ed25519' && typeof pubJwk.x === 'string' && pubJwk.x.length > 0)
  }

  const naclUrl = (function () {
    try {
      if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
        return new URL('vendor/nacl.min.js', document.currentScript.src).href
      }
    } catch (error) {}
    return ''
  })()

  function hostObject() {
    return typeof globalThis !== 'undefined' ? globalThis : window
  }

  function loadNacl() {
    const host = hostObject()
    if (host && host.nacl && host.nacl.sign) return Promise.resolve(host.nacl)
    if (!naclUrl || typeof document === 'undefined') return Promise.reject(new Error('no nacl'))
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = naclUrl
      script.onload = () => host.nacl && host.nacl.sign ? resolve(host.nacl) : reject(new Error('no nacl'))
      script.onerror = () => reject(new Error('no nacl'))
      document.head.appendChild(script)
    })
  }

  async function verifyEntitlement(ent, sig, pubJwk, key, opts) {
    const options = opts || {}
    if (!ent || ent.product !== 'construct-pro' || !Number.isFinite(ent.exp) || typeof ent.key_hash !== 'string' || typeof ent.status !== 'string') return false
    if (typeof sig !== 'string' || !sig) return false
    if (!publicKeyOk(pubJwk)) return false
    const subtle = options.subtle || (typeof crypto !== 'undefined' ? crypto.subtle : null)
    if (key) {
      if (!subtle) return false
      const hash = await sha256Hex(key, subtle)
      if (hash !== ent.key_hash) return false
    }
    let data
    let sigBytes
    let pubBytes
    try {
      data = new TextEncoder().encode(canonicalEntitlement(ent))
      sigBytes = b64urlToBytes(sig)
      pubBytes = b64urlToBytes(pubJwk.x)
    } catch (error) {
      return false
    }
    if (sigBytes.length !== 64 || pubBytes.length !== 32) return false
    if (!options.forceNacl && subtle) {
      try {
        const cryptoKey = await subtle.importKey('jwk', { kty: 'OKP', crv: 'Ed25519', x: pubJwk.x }, { name: 'Ed25519' }, false, ['verify'])
        return await subtle.verify('Ed25519', cryptoKey, sigBytes, data)
      } catch (error) {}
    }
    try {
      const nacl = options.nacl || await loadNacl()
      return nacl.sign.detached.verify(data, sigBytes, pubBytes) === true
    } catch (error) {
      return false
    }
  }

  async function deviceHash(storage, subtle) {
    let id = storage.getItem(DEVICE_KEY)
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      id = (crypto.randomUUID && crypto.randomUUID()) || fallbackUuid()
      storage.setItem(DEVICE_KEY, id)
    }
    return sha256Hex(id, subtle || crypto.subtle)
  }

  function fallbackUuid() {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 15) | 64
    bytes[8] = (bytes[8] & 63) | 128
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20)
  }

  function licenseBase(deps) {
    const url = deps.licenseUrl || ''
    if (!/^https:\/\//i.test(url)) return ''
    return url.replace(/\/$/, '')
  }

  async function activateKey(key, deps) {
    const normalized = String(key || '').trim().toUpperCase()
    if (!KEY_RE.test(normalized)) return { ok: false, error: 'bad_format' }
    const base = licenseBase(deps)
    if (!base) return { ok: false, error: 'offline' }
    const subtle = deps.subtle || crypto.subtle
    const device = await deviceHash(deps.storage, subtle)
    let response
    try {
      response = await deps.fetch(base + '/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: normalized, device }),
        signal: deps.signal
      })
    } catch (error) {
      return { ok: false, error: 'offline' }
    }
    let body
    try { body = await response.json() } catch (error) { return { ok: false, error: 'offline' } }
    if (!response.ok || !body || !body.entitlement || !body.signature) {
      return { ok: false, error: (body && body.error) || 'not_found', maxDevices: body && body.max_devices }
    }
    const valid = await verifyEntitlement(body.entitlement, body.signature, deps.pubkey, normalized, { subtle: deps.subtle, nacl: deps.nacl })
    if (!valid) return { ok: false, error: 'bad_signature' }
    return { ok: true, entitlement: body.entitlement, signature: body.signature, key: normalized }
  }

  async function deactivateKey(key, deps) {
    const base = licenseBase(deps)
    if (!base || !key) return
    try {
      const device = await deviceHash(deps.storage, deps.subtle || crypto.subtle)
      await deps.fetch(base + '/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: String(key).trim().toUpperCase(), device }),
        signal: deps.signal
      })
    } catch (error) {}
  }

  function messageFor(error, maxDevices, offlineDays) {
    const n = maxDevices || 3
    const days = offlineDays || 7
    if (error === 'bad_format') return "That doesn't look like a key. It should read AMNI-PRO-XXXXX-XXXXX."
    if (error === 'not_found' || error === 'bad_signature') return "That key isn't on file. Check for a typo, or email me with your Stripe receipt."
    if (error === 'device_cap') return 'This key is already on ' + n + ' devices. Deactivate one (Pro tab → deactivate on that device), or email me and I\'ll reset it.'
    if (error === 'subscription_ended') return "This key's subscription has ended. Your data is still here. Resubscribe and the same key works again."
    if (error === 'offline') return 'I need a connection once to check the key. After that it works offline for up to ' + days + ' days.'
    return "That key isn't on file. Check for a typo, or email me with your Stripe receipt."
  }

  function legacyMessage() {
    return "Old-style keys from before checkout opened don't work anymore. Your data is untouched. Start a trial or buy a key."
  }

  return Object.freeze({
    TRIAL_MS,
    RECHECK_BEFORE_MS,
    KEY_RE,
    DEVICE_KEY,
    canonicalEntitlement,
    access,
    needsRecheck,
    legacyKey,
    verifyEntitlement,
    deviceHash,
    activateKey,
    deactivateKey,
    messageFor,
    legacyMessage
  })
})
