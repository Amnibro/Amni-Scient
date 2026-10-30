// Headless check for Amni-Construct Pro: signed-key verification, checkout buttons, Stripe return claim.
// usage: node tests/construct_pro_check.js   (needs playwright-core + Chrome; CHROME=/path overrides)
// Uses throwaway Ed25519 keys made here; never the production signing key. The licence server is stubbed.
const { chromium } = require('playwright-core'), crypto = require('crypto'), fs = require('fs'), http = require('http'), path = require('path')
const ROOT = path.join(__dirname, '..'), TY = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((q, s) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT)) return s.writeHead(403).end(); try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html') } catch { fs.existsSync(f + '.html') && (f += '.html') } fs.readFile(f, (e, d) => e ? s.writeHead(404).end('nf') : s.writeHead(200, { 'content-type': TY[path.extname(f)] || 'application/octet-stream' }).end(d)) }).listen(0, '127.0.0.1')
let base, API
const cfg = fs.readFileSync(path.join(ROOT, '_shared/pro-config.js'), 'utf8')
API = /AMNI_CONSTRUCT_PRO_API = '([^']+)'/.exec(cfg)[1]
const kp = crypto.generateKeyPairSync('ed25519'), PUB = kp.publicKey.export({ format: 'jwk' }).x, other = crypto.generateKeyPairSync('ed25519')
const b64 = x => Buffer.from(x).toString('base64url')
const signL = (L, k = kp.privateKey) => { const p = b64(JSON.stringify(L)); return 'AMNIPRO1.' + p + '.' + b64(crypto.sign(null, Buffer.from('AMNIPRO1.' + p), k)) }
// Stand-in for a key issued by the worker's /license (worker side is covered by pro-worker/test/construct_test.mjs).
const wk = crypto.generateKeyPairSync('ed25519')
const now = Date.now(), base_L = { v: 1, id: 'tst', name: 'Test Builder', email: 't@example.com', org: 'Test Decks', plan: 'construct', seats: 1, feat: ['construct'], iat: now, exp: now + 30 * 864e5, sub: 'sub_t', interval: 'month' }
// Old-style checksum key that the removed chk() accepted.
const oldKey = (() => { for (let n = 0; ; n++) { const p = n.toString(36).toUpperCase().padStart(9, 'A'); let s = 0; for (let i = 0; i < 9; i++) s += p.charCodeAt(i) * (i + 3); const q = p + (s % 36).toString(36).toUpperCase(); return 'AMNI-PRO-' + q.slice(0, 5) + '-' + q.slice(5) } })()
let fail = 0; const ok = (c, m) => { c || fail++; console.log(c ? 'PASS' : 'FAIL', m) }
;(async () => {
  await new Promise(r => srv.listening ? r() : srv.once('listening', r)); base = 'http://127.0.0.1:' + srv.address().port
  const sample = { pub: wk.publicKey.export({ format: 'jwk' }).x, key: signL({ ...base_L, id: 'wrk', org: 'Cohoes Decks' }, wk.privateKey) }
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--ignore-gpu-blocklist'] })
  const open = async (path, { pub, ps, api } = {}) => {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await c.newPage(), errs = [], reqs = []
    p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push('PAGEERR ' + e.message))
    p.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()))
    await c.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => { const u = r.request().url(); if (u.startsWith(API) || u.startsWith('https://checkout.stripe.com')) return r.fallback(); return r.fulfill({ status: 204, body: '' }) })
    if (pub !== undefined) await c.route(/pro-config\.js/, async r => { const res = await r.fetch(); const t = (await res.text()).replace(/window\.AMNI_CONSTRUCT_PUB = '[^']*'/, () => 'window.AMNI_CONSTRUCT_PUB = ' + JSON.stringify(pub)); r.fulfill({ response: res, body: t }) })
    if (api) await c.route(u => u.href.startsWith(API), r => { reqs.push([r.request().method(), r.request().url(), r.request().postData()]); return r.fulfill(api(r.request())) })
    await c.route(/checkout\.stripe\.com/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>stripe-checkout-stub</title>' }))
    if (ps) await c.addInitScript(v => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('amni.pro.v1', v); sessionStorage.setItem('seeded', '1') } }, JSON.stringify(ps))
    await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(1200)
    return { c, p, errs, reqs }
  }
  const gate = async p => { await p.click('#pro-open'); await p.waitForTimeout(200); await p.click('#pro-unlock'); await p.waitForTimeout(150) }
  const status = p => p.$eval('#pro-status', e => e.textContent)
  const tryKey = async (p, k) => { await p.fill('#pro-key', k); await p.click('#pro-activate'); await p.waitForFunction(() => document.querySelector('#pro-key-err').textContent !== 'Checking…'); await p.waitForTimeout(100); return p.$eval('#pro-key-err', e => e.textContent) }

  // 1-2. Production config (no pub yet): pages load clean.
  for (const [n, u] of [['pro.html', '/construct/pro.html'], ['deck tool', '/deck/'], ['dashboard', '/construct/dashboard.html']]) { const { c, errs } = await open(u); ok(errs.length === 0, `${n} loads with zero console errors` + (errs.length ? ' :: ' + errs.join(' | ') : '')); await c.close() }
  { const { c, p, errs } = await open('/deck/', { pub: '', ps: { key: oldKey } }); await gate(p); const e = await tryKey(p, signL(base_L)); ok(/not configured/.test(e) && /LOCKED/.test(await status(p)), 'with no public key configured yet, even a signed key is refused (fails closed)'); ok(errs.length === 0, 'no console errors'); await c.close() }

  // 3-4. With a test public key injected: old checksum key rejected, signed key accepted.
  { const { c, p, errs } = await open('/deck/', { pub: PUB, ps: { key: oldKey } })
    ok(/LOCKED/.test(await status(p)), `a stored old-style checksum key (${oldKey}) no longer unlocks Pro`)
    await gate(p); let e = await tryKey(p, oldKey); ok(/not an Amni-Construct Pro license key/.test(e) && /LOCKED/.test(await status(p)), 'typing the old AMNI-PRO checksum key is rejected')
    e = await tryKey(p, signL(base_L, other.privateKey)); ok(/does not check out/.test(e), 'a key signed by a different key (e.g. Amni-CAD) is rejected')
    const good = signL(base_L), [, pl, sg] = good.split('.'); e = await tryKey(p, 'AMNIPRO1.' + b64(JSON.stringify({ ...base_L, exp: now + 9e11 })) + '.' + sg); ok(/does not check out/.test(e), 'an edited payload (longer expiry) is rejected')
    e = await tryKey(p, signL({ ...base_L, plan: 'pro', feat: ['*'] })); ok(/different Amni product/.test(e), 'a validly signed key for another plan is rejected')
    e = await tryKey(p, signL({ ...base_L, exp: now - 864e5, sub: undefined })); ok(/expired/.test(e), 'an expired key is rejected')
    e = await tryKey(p, good.slice(0, 40) + '\n' + good.slice(40)); ok(e === '' && /PRO ACTIVE/.test(await status(p)), 'a test-signed construct key (with a line break pasted in) is accepted → PRO ACTIVE')
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('amni.pro.v1')).key); ok(st === good, 'the verified key is what gets stored')
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200); ok(/PRO ACTIVE/.test(await status(p)), 'still active after reload (verified again on load)')
    ok(await p.$eval('#pro-lic-row', e => /Test Decks/.test(e.textContent)), 'drawer shows the licence holder')
    ok(errs.length === 0, 'no console errors' + (errs.length ? ' :: ' + errs.join(' | ') : '')); await c.close() }

  // 5. Buy buttons POST /checkout with the plan, then go to Stripe.
  const api = req => { const u = new URL(req.url()); if (u.pathname === '/checkout') return { status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_stub' }) }; if (u.pathname === '/license') return { status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ key: sample.key }) }; return { status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":"nf"}' } }
  for (const [sel, plan] of [['#buy-monthly', 'monthly'], ['#buy-annual', 'annual']]) { const { c, p, reqs, errs } = await open('/construct/pro.html', { pub: PUB, api }); await Promise.all([p.waitForURL(/checkout\.stripe\.com/), p.click(sel)]); ok(reqs.length === 1 && reqs[0][0] === 'POST' && reqs[0][1] === API + '/checkout' && JSON.parse(reqs[0][2]).plan === plan, `pro.html ${sel} → POST ${API}/checkout {plan:"${plan}"} → Stripe Checkout`); ok(errs.length === 0, 'no console errors'); await c.close() }
  for (const [sel, plan] of [['#pro-buy-m', 'monthly'], ['#pro-buy-y', 'annual']]) { const { c, p, reqs } = await open('/deck/', { pub: PUB, api }); await gate(p); await Promise.all([p.waitForURL(/checkout\.stripe\.com/), p.click(sel)]); ok(reqs.length === 1 && JSON.parse(reqs[0][2]).plan === plan, `deck Pro gate ${sel} → POST /checkout {plan:"${plan}"}`); await c.close() }
  { const { c, p, errs } = await open('/construct/pro.html', { api: () => ({ status: 503, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":"checkout is not set up yet"}' }) }); await p.click('#buy-monthly'); await p.waitForTimeout(300); ok(/not set up/.test(await p.$eval('#buy-msg', e => e.textContent)) && !(await p.$eval('#buy-monthly', e => e.disabled)), 'a server error is shown and the buttons re-enable'); await c.close() }

  // 6. Return from Stripe: #pro-session claims the worker-issued key (signed by the worker test key).
  { const { c, p, reqs, errs } = await open('/construct/pro.html#pro-session=cs_test_abc', { pub: sample.pub, api })
    ok(reqs.some(r => r[0] === 'GET' && r[1] === API + '/license?session=cs_test_abc'), 'success return calls GET /license?session=cs_…')
    ok(!(await p.$eval('#lic-box', e => e.hidden)) && (await p.$eval('#lic-key', e => e.value)) === sample.key && !/pro-session/.test(p.url()), 'the worker-issued key is verified, shown for other devices, and the session id is cleared from the URL')
    ok(errs.length === 0, 'no console errors' + (errs.length ? ' :: ' + errs.join(' | ') : ''))
    await p.goto(base + '/deck/', { waitUntil: 'load' }); await p.waitForTimeout(1200); ok(/PRO ACTIVE/.test(await status(p)), 'the deck tool picks up the claimed licence')
    await p.goto(base + '/construct/dashboard.html', { waitUntil: 'load' }); await p.waitForTimeout(800); ok(await p.$eval('#app', e => getComputedStyle(e).display !== 'none'), 'dashboard opens for the signed licence'); await c.close() }
  { const { c, p } = await open('/construct/dashboard.html', { pub: PUB, ps: { key: oldKey } }); ok(await p.$eval('#gate', e => getComputedStyle(e).display !== 'none'), 'dashboard stays gated for an old checksum key'); await c.close() }
  { const { c, p } = await open('/deck/', { pub: PUB }); await gate(p); await p.click('#pro-trial'); await p.waitForTimeout(200); ok(/TRIAL — 14d left/.test(await status(p)), 'local 14-day trial still works with one click'); await c.close() }
  await b.close(); srv.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0)
})()
