export const APPS = ['crypt', 'chat', 'learn', 'map', 'type', 'contaigion', 'humainity', 'haven'], DEVICES = ['android', 'iphone', 'both'], MAX_BODY = 2048, RL_LIMIT = 10, RL_TTL = 3600, CAP = 50000, SOURCES = ['link', 'reply', 'admin', 'bounce']
const KEYS = new Set(['email', 'apps', 'device', 'handle', 'consent', 'website'])
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/
const HANDLE = /^[\p{L}\p{N} ._'-]{1,40}$/u
const origins = env => (env.ALLOWED_ORIGINS || 'https://amni-scient.com,https://www.amni-scient.com').split(',').map(s => s.trim()).filter(Boolean)
const cors = (env, o) => origins(env).includes(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : { Vary: 'Origin' }
const json = (status, body, h = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...h } })
const text = (body, type, h = {}) => new Response(body, { headers: { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...h } })
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('')
const same = async (a, b) => { const [x, y] = await Promise.all([sha('k:' + a), sha('k:' + b)]); let d = 0; for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i); return d === 0 && !!a && !!b }
export const validate = b => {
  if (!b || typeof b !== 'object' || Array.isArray(b) || Object.keys(b).some(k => !KEYS.has(k))) return { error: 'bad_request' }
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '', apps = Array.isArray(b.apps) ? [...new Set(b.apps)] : [], device = b.device ?? 'android', handle = b.handle == null ? '' : typeof b.handle === 'string' ? b.handle.trim().replace(/\s+/g, ' ') : null
  return email.length > 254 || !EMAIL.test(email) ? { error: 'invalid_email' } : !apps.length || apps.length > APPS.length || !apps.every(a => APPS.includes(a)) ? { error: 'invalid_apps' } : !DEVICES.includes(device) ? { error: 'invalid_device' } : handle === null || (handle && !HANDLE.test(handle)) ? { error: 'invalid_handle' } : b.consent !== true ? { error: 'consent_required' } : { value: { email, apps, device, handle } }
}
const limited = async (req, env) => {
  const k = 'rl:' + (await sha((env.RL_SALT || '') + '|' + (req.headers.get('CF-Connecting-IP') || '0') + '|' + Math.floor(Date.now() / 3.6e6))).slice(0, 32), n = +(await env.RL.get(k) || 0)
  return n >= RL_LIMIT ? true : (await env.RL.put(k, String(n + 1), { expirationTtl: RL_TTL }), false)
}
const readJson = async req => { const t = await req.text(); if (t.length > MAX_BODY) return { tooBig: true }; try { return { body: JSON.parse(t) } } catch { return { body: undefined } } }
const signup = async (req, env, url, h) => {
  if (!origins(env).includes(req.headers.get('Origin') || '')) return json(403, { ok: false, error: 'origin' }, h)
  if (!(req.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return json(415, { ok: false, error: 'content_type' }, h)
  if (+(req.headers.get('Content-Length') || 0) > MAX_BODY) return json(413, { ok: false, error: 'too_large' }, h)
  if (await limited(req, env)) return json(429, { ok: false, error: 'rate_limited' }, { ...h, 'Retry-After': '3600' })
  const { body, tooBig } = await readJson(req)
  if (tooBig) return json(413, { ok: false, error: 'too_large' }, h)
  if (body && typeof body === 'object' && typeof body.website === 'string' && body.website.trim()) return json(200, { ok: true }, h)
  const { error, value } = validate(body)
  if (error) return json(400, { ok: false, error }, h)
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM signups').first()
  if (n >= CAP) return json(503, { ok: false, error: 'full' }, h)
  const now = new Date().toISOString(), q = 'INSERT INTO signups (email, app, device, handle, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (email, app) DO UPDATE SET device = excluded.device, handle = excluded.handle'
  await env.DB.batch([...value.apps.map(a => env.DB.prepare(q).bind(value.email, a, value.device, value.handle, now)), env.DB.prepare('DELETE FROM suppressed WHERE email = ?').bind(value.email)])
  return json(200, { ok: true, apps: value.apps }, h)
}
const admin = async (req, env, url) => same(url.searchParams.get('key') || (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''), env.ADMIN_KEY || '')
const cell = v => { const s = String(v ?? ''), t = /^[=+\-@\t\r]/.test(s) ? "'" + s : s; return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t }
const exportCsv = async (req, env, url) => {
  if (!await admin(req, env, url)) return json(401, { ok: false, error: 'unauthorized' })
  const app = url.searchParams.get('app'), cols = 'SELECT email, app, device, handle, created_at FROM signups'
  if (app && !APPS.includes(app)) return json(400, { ok: false, error: 'invalid_apps' })
  const { results } = await (app ? env.DB.prepare(cols + ' WHERE app = ? ORDER BY created_at').bind(app) : env.DB.prepare(cols + ' ORDER BY app, created_at')).all()
  return url.searchParams.get('format') === 'emails' ? text([...new Set(results.map(r => r.email))].join(',') + '\n', 'text/plain; charset=utf-8') : text(['email,app,device,handle,created_at', ...results.map(r => [r.email, r.app, r.device, r.handle, r.created_at].map(cell).join(','))].join('\n') + '\n', 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="amni-beta-signups.csv"' })
}
const remove = async (req, env, url) => {
  if (!await admin(req, env, url)) return json(401, { ok: false, error: 'unauthorized' })
  const { body } = await readJson(req), email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '', app = body?.app
  if (!email || (app != null && !APPS.includes(app))) return json(400, { ok: false, error: 'bad_request' })
  const r = await (app ? env.DB.prepare('DELETE FROM signups WHERE email = ? AND app = ?').bind(email, app) : env.DB.prepare('DELETE FROM signups WHERE email = ?').bind(email)).run()
  return json(200, { ok: true, deleted: r.meta.changes })
}
const TESTS = [['Amni-Chat', 'com.amniscient.chat'], ['Amni-Map', 'com.amniscient.map'], ['Amni-Type', 'ai.amni.type'], ['Amni-Learn', 'com.amnilearn.mobile'], ['ContAIgion', 'com.amni.contaigion'], ['HumAInity', 'com.amni.humainity']], GROUP = 'https://groups.google.com/g/amni-scient-testers', SITE = 'https://amni-scient.com', enc = s => new TextEncoder().encode(s)
const b64u = b => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64u = s => { try { return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))) } catch { return '' } }
export const unsubSig = async (secret, email) => b64u(new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc(email)))).slice(0, 22)
export const unsubQuery = async (secret, email) => 'e=' + b64u(enc(email)) + '&s=' + await unsubSig(secret, email)
const tokenEmail = async (env, url) => { const e = unb64u((url.searchParams.get('e') || '').slice(0, 400)).trim().toLowerCase(); return env.UNSUB_SECRET && e.length <= 254 && EMAIL.test(e) && await same(url.searchParams.get('s') || '', await unsubSig(env.UNSUB_SECRET, e)) ? e : '' }
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'), mask = e => e[0] + '***@' + e.split('@')[1], day = () => new Date().toISOString().slice(0, 10)
const CSS = ':root{--bg:#F3F2EF;--panel:#FFFFFF;--border:#E0DED8;--border2:#CBC7BE;--accent:#8A6318;--accent-soft:#A2762A;--accent-dim:rgba(138,99,24,.09);--accent-ink:#FFFFFF;--text:#101216;--text-soft:#454A52;--dim:#767B84;--elev:0 1px 2px rgba(20,22,26,.05),0 8px 24px -12px rgba(20,22,26,.14);--sans:Archivo,"Segoe UI Variable Display","Segoe UI",system-ui,-apple-system,Roboto,sans-serif;--serif:"Source Serif 4","Iowan Old Style","Palatino Linotype",Georgia,serif;color-scheme:light}@media(prefers-color-scheme:dark){:root{--bg:#08090B;--panel:#111418;--border:#20242B;--border2:#2E343D;--accent:#C89B4E;--accent-soft:#E2BC7C;--accent-dim:rgba(200,155,78,.10);--accent-ink:#120C03;--text:#EDEFF2;--text-soft:#A7ADB6;--dim:#6D747D;--elev:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7);color-scheme:dark}}@font-face{font-family:Archivo;font-weight:100 900;font-stretch:62% 125%;font-display:swap;src:url(' + SITE + '/assets/fonts/archivo-var.woff2) format("woff2")}@font-face{font-family:"Source Serif 4";font-weight:200 900;font-display:swap;src:url(' + SITE + '/assets/fonts/sourceserif4-var.woff2) format("woff2")}*{box-sizing:border-box;margin:0}body{min-height:100vh;background:var(--bg) radial-gradient(1200px 520px at 50% -260px,var(--accent-dim),transparent 68%) no-repeat;color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.62;-webkit-font-smoothing:antialiased;padding:clamp(1.5rem,6vw,4rem) 16px}a{color:var(--accent);text-decoration:none}a:hover{color:var(--accent-soft)}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}main{max-width:560px;margin:0 auto}.logo{display:inline-block;font-size:.98rem;font-weight:700;font-stretch:80%;letter-spacing:.14em;color:var(--text);margin-bottom:1.6rem}.k{font-size:.7rem;font-weight:600;font-stretch:80%;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);margin-bottom:.6rem}.p{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:clamp(1.2rem,4vw,2rem);box-shadow:var(--elev)}h1{font-size:clamp(1.4rem,4.4vw,1.9rem);font-weight:700;font-stretch:80%;letter-spacing:.04em;line-height:1.1;text-transform:uppercase;margin-bottom:.9rem}p{font-family:var(--serif);color:var(--text-soft);margin-bottom:1rem;overflow-wrap:anywhere}.e{font-family:var(--sans);font-weight:650;color:var(--text)}.c{display:flex;gap:.65rem;align-items:flex-start;padding:.75rem .8rem;border:1px solid var(--border);border-radius:3px;margin:0 0 1.2rem;cursor:pointer;font-size:.92rem}.c:has(input:checked){border-color:color-mix(in srgb,var(--accent) 55%,transparent);background:var(--accent-dim)}.c input{width:18px;height:18px;margin-top:.2rem;accent-color:var(--accent);flex:0 0 18px}.btn{font-family:var(--sans);display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:.78rem 1.6rem;border-radius:2px;font-size:.72rem;font-weight:700;font-stretch:80%;letter-spacing:.17em;text-transform:uppercase;cursor:pointer;border:1px solid var(--accent);background:var(--accent);color:var(--accent-ink);transition:background .18s,color .18s,border-color .18s}.btn:hover{background:var(--text);border-color:var(--text);color:var(--bg)}.btn.o{background:transparent;border-color:var(--border2);color:var(--text)}.btn.o:hover{background:var(--text);color:var(--bg)}.x{margin-top:1.6rem;padding-top:1.2rem;border-top:1px solid var(--border)}.x h2{font-size:.74rem;font-weight:700;font-stretch:80%;letter-spacing:.14em;text-transform:uppercase;margin-bottom:.5rem}.x p{font-size:.92rem}.x ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.2rem 1rem;font-size:.9rem}.x li a{display:inline-block;padding:.35rem 0}.f{margin-top:1.4rem;font-size:.8rem;color:var(--dim)}'
const html = (status, title, body) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>${title} | AMNI-SCIENT</title><style>${CSS}</style></head><body><main><a class="logo" href="${SITE}/">AMNI-SCIENT</a><div class="p"><div class="k">Tester emails</div>${body}</div><p class="f">To stop emailing you we keep only your email address, how you unsubscribed and the day. No tracking, no IP addresses. <a href="${SITE}/privacy.html#beta-signup">Privacy</a></p></main></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; font-src " + SITE + "; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" } })
const leave = `<div class="x"><h2>Leave the app tests too</h2><p>Google runs the test lists, so these steps are yours to take. <a href="${GROUP}" target="_blank" rel="noopener noreferrer">Also leave the tester group</a>, or leave an app's test:</p><ul>${TESTS.map(([n, p]) => `<li><a href="https://play.google.com/apps/testing/${p}" target="_blank" rel="noopener noreferrer">${n}</a></li>`).join('')}</ul></div>`
const bad = () => html(400, 'Link not valid', `<h1>This link doesn't work</h1><p>It may have been cut off by your mail app. Reply "unsubscribe" to any Amni-Scient tester email, or write to <a href="mailto:amnibro7@gmail.com?subject=unsubscribe">amnibro7@gmail.com</a>, and we'll remove you.</p>`)
const done = (email, q, rt) => html(200, 'Unsubscribed', `<h1>You're unsubscribed</h1><p><span class="e">${esc(mask(email))}</span> won't get Amni-Scient tester emails anymore.${rt ? " We'll also remove you from app testing within a few days." : ''}</p><form method="post" action="/resubscribe?${esc(q)}"><button class="btn o" type="submit">Resubscribe</button></form>${leave}`)
const suppress = (env, email, source, rt) => env.DB.batch([env.DB.prepare('INSERT INTO suppressed (email, source, remove_testing, created_day) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET remove_testing = MAX(remove_testing, excluded.remove_testing)').bind(email, source, rt ? 1 : 0, day()), env.DB.prepare('DELETE FROM signups WHERE email = ?').bind(email)])
const unsubPage = async (req, env, url) => {
  const email = await tokenEmail(env, url), q = url.search.slice(1)
  if (!email) return bad()
  const row = await env.DB.prepare('SELECT remove_testing FROM suppressed WHERE email = ?').bind(email).first()
  return row ? done(email, q, row.remove_testing) : html(200, 'Unsubscribe', `<h1>Unsubscribe?</h1><p>Unsubscribe <span class="e">${esc(mask(email))}</span> from Amni-Scient tester emails?</p><form method="post" action="/unsubscribe?${esc(q)}"><label class="c"><input type="checkbox" name="remove_testing" value="1"><span>Also remove me from Amni-Scient app testing</span></label><button class="btn" type="submit">Unsubscribe</button></form>${leave}`)
}
const unsubPost = async (req, env, url) => {
  const email = await tokenEmail(env, url), f = await req.formData().catch(() => new FormData()), rt = f.get('remove_testing') === '1'
  return email ? (await suppress(env, email, 'link', rt), f.get('List-Unsubscribe') === 'One-Click' ? text('unsubscribed\n', 'text/plain; charset=utf-8') : done(email, url.search.slice(1), rt || (await env.DB.prepare('SELECT remove_testing FROM suppressed WHERE email = ?').bind(email).first())?.remove_testing)) : bad()
}
const resubPost = async (req, env, url) => {
  const email = await tokenEmail(env, url)
  return email ? (await env.DB.prepare('DELETE FROM suppressed WHERE email = ?').bind(email).run(), html(200, 'Resubscribed', `<h1>You're resubscribed</h1><p><span class="e">${esc(mask(email))}</span> will get Amni-Scient tester emails again. To pick apps to test, use the <a href="${SITE}/beta.html">beta sign-up</a>.</p>`)) : bad()
}
const adminEmail = async (req, env, url) => { if (!await admin(req, env, url)) return { res: json(401, { ok: false, error: 'unauthorized' }) }; const { body } = await readJson(req), email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''; return email.length > 254 || !EMAIL.test(email) ? { res: json(400, { ok: false, error: 'invalid_email' }) } : { body, email } }
const suppressed = async (req, env, url) => {
  if (!await admin(req, env, url)) return json(401, { ok: false, error: 'unauthorized' })
  const { results } = await env.DB.prepare('SELECT email, source, remove_testing, created_day FROM suppressed ORDER BY created_day, email').all()
  return url.searchParams.get('format') === 'emails' ? text(results.map(r => r.email).join('\n') + (results.length ? '\n' : ''), 'text/plain; charset=utf-8') : json(200, { ok: true, count: results.length, suppressed: results.map(r => ({ ...r, remove_testing: !!r.remove_testing })) })
}
const adminSuppress = async (req, env, url) => {
  const { res, body, email } = await adminEmail(req, env, url), source = body?.source ?? 'admin'
  if (res) return res
  if (!SOURCES.includes(source)) return json(400, { ok: false, error: 'invalid_source' })
  const [, d] = await suppress(env, email, source, body.remove_testing === true)
  return json(200, { ok: true, email, deleted_signups: d.meta.changes })
}
const adminUnsuppress = async (req, env, url) => { const { res, email } = await adminEmail(req, env, url); return res || json(200, { ok: true, removed: (await env.DB.prepare('DELETE FROM suppressed WHERE email = ?').bind(email).run()).meta.changes }) }
const ROUTES = { 'GET /health': () => json(200, { ok: true, service: 'amni-beta' }), 'OPTIONS /signup': (req, env, url, h) => new Response(null, { status: origins(env).includes(req.headers.get('Origin') || '') ? 204 : 403, headers: h }), 'POST /signup': signup, 'GET /export': exportCsv, 'POST /delete': remove, 'GET /unsubscribe': unsubPage, 'POST /unsubscribe': unsubPost, 'POST /resubscribe': resubPost, 'GET /admin/suppressed': suppressed, 'POST /admin/suppress': adminSuppress, 'POST /admin/unsuppress': adminUnsuppress }
export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url), route = ROUTES[req.method + ' ' + (url.pathname.replace(/\/+$/, '') || '/')]
      return route ? await route(req, env, url, cors(env, req.headers.get('Origin') || '')) : json(404, { ok: false, error: 'not_found' })
    } catch { return json(500, { ok: false, error: 'server' }) }
  }
}
