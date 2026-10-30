// Amni-Construct Pro licence client. Keys are AMNIPRO1.<payload>.<sig>, Ed25519-signed by the
// amni-construct-pro worker (same format as Amni-CAD Pro, separate key). Only the public key is here.
;(() => {
  const PFX = 'AMNIPRO1.', LS = 'amni.pro.v1', RENEW_MS = 10 * 864e5
  const here = (document.currentScript && document.currentScript.src) || location.href
  const cfg = () => ({ pub: String(window.AMNI_CONSTRUCT_PUB || ''), api: String(window.AMNI_CONSTRUCT_PRO_API || '').replace(/\/+$/, '') })
  const bad = m => Object.assign(new Error(m), { bad: true })
  const unb = s => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, c => c.charCodeAt(0)) }
  const sigOk = async (pub, msg, sig) => {
    const pk = unb(pub)
    try {
      const k = await crypto.subtle.importKey('raw', pk, { name: 'Ed25519' }, false, ['verify'])
      return await crypto.subtle.verify({ name: 'Ed25519' }, k, sig, msg)
    } catch (e) {
      // Older browsers without WebCrypto Ed25519: same wasm verifier Amni-CAD ships.
      const m = await import(new URL('../cad/vendor/amni-vault/pkg/vault_core.js', here).href)
      await m.default()
      return m.verify_ed25519(pk, msg, sig)
    }
  }
  const verify = async (tok, now = Date.now()) => {
    const t = String(tok || '').replace(/\s+/g, '')
    if (!t.startsWith(PFX)) throw bad('That is not an Amni-Construct Pro license key.')
    const [p, s, x] = t.slice(PFX.length).split('.')
    if (!p || !s || x !== undefined) throw bad('That license key is incomplete — paste the whole key.')
    let L
    try { L = JSON.parse(new TextDecoder().decode(unb(p))) } catch { throw bad('That license key is damaged — paste the whole key.') }
    const { pub } = cfg()
    if (!pub) throw bad('License checking is not configured on this site yet.')
    let ok = false
    try { ok = await sigOk(pub, new TextEncoder().encode(PFX + p), unb(s)) } catch { ok = false }
    if (!ok) throw bad('That license key does not check out — copy it again from the purchase page or email.')
    if (!L || L.v !== 1) throw bad('That license key is from a newer version — reload the page.')
    if (!(L.plan === 'construct' || (Array.isArray(L.feat) && L.feat.includes('construct')))) throw bad('That key is for a different Amni product.')
    if (L.exp && L.exp < now) throw Object.assign(bad('That license has expired.'), { expired: true, lic: { ...L, token: t } })
    return { ...L, token: t }
  }
  const readPS = () => { try { return JSON.parse(localStorage.getItem(LS)) || {} } catch { return {} } }
  const store = t => { try { const ps = readPS(); t ? ps.key = t : delete ps.key; localStorage.setItem(LS, JSON.stringify(ps)) } catch {} }
  const post = async (path, body) => {
    const { api } = cfg()
    if (!api) throw new Error('Checkout is not available yet.')
    let r, j
    try { r = await fetch(api + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : { method: 'GET' }) } catch { throw new Error('Could not reach the license server — check the connection and try again.') }
    try { j = await r.json() } catch { j = {} }
    if (!r.ok) throw Object.assign(new Error(j.error || ('License server error ' + r.status)), { pending: !!j.pending, status: r.status })
    return j
  }
  const buy = async plan => {
    if (plan !== 'monthly' && plan !== 'annual') throw new Error('Unknown plan.')
    const { url } = await post('/checkout', { plan })
    if (!/^https:\/\/checkout\.stripe\.com\//.test(String(url))) throw new Error('Checkout did not start — try again.')
    location.href = url
  }
  const sessionId = () => (/[#&]pro-session=(cs_[A-Za-z0-9_]+)/.exec(location.hash) || [])[1] || ''
  const claim = async () => {
    const id = sessionId()
    if (!id) return null
    for (let i = 0; i < 8; i++) {
      try {
        const { key } = await post('/license?session=' + encodeURIComponent(id))
        history.replaceState(null, '', location.pathname + location.search)
        return key
      } catch (e) { if (!e.pending) throw e; await new Promise(r => setTimeout(r, 1500 * (i + 1))) }
    }
    throw new Error('Payment is still processing — reload this page in a minute.')
  }
  const ST = { ready: null, lic: null, err: '', claimed: false }
  const renewIfDue = async L => {
    if (!L || !L.sub || !L.exp || L.exp - Date.now() > RENEW_MS) return L
    try { const N = await verify((await post('/renew', { key: L.token })).key); store(N.token); return N } catch { return L.exp > Date.now() ? L : null }
  }
  const load = () => ST.ready || (ST.ready = (async () => {
    let t = readPS().key || ''
    try { const k = await claim(); if (k) { t = k; store(k); ST.claimed = true } } catch (e) { ST.err = e.message }
    if (!t) return null
    try { ST.lic = await renewIfDue(await verify(t)) } catch (e) {
      if (e.expired && e.lic && e.lic.sub) { try { ST.lic = await verify((await post('/renew', { key: t })).key); store(ST.lic.token) } catch (e2) { ST.err = ST.err || e2.message } } else ST.err = ST.err || e.message
    }
    return ST.lic
  })())
  const activate = async tok => { const L = await verify(tok); store(L.token); ST.lic = L; ST.err = ''; ST.ready = Promise.resolve(L); return L }
  const deactivate = () => { store(''); ST.lic = null; ST.ready = Promise.resolve(null) }
  const billing = async () => { if (!ST.lic) throw new Error('No active license on this device.'); const { url } = await post('/portal', { key: ST.lic.token }); location.href = url }
  window.AmniConstructPro = { verify, load, activate, deactivate, buy, billing, claimed: () => ST.claimed, error: () => ST.err, info: () => ST.lic, pendingSession: () => !!sessionId() }
})()
