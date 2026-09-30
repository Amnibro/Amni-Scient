export const APPS = ['crypt', 'chat', 'learn', 'map', 'type', 'contaigion', 'humainity', 'haven'], DEVICES = ['android', 'iphone', 'both'], MAX_BODY = 2048, RL_LIMIT = 10, RL_TTL = 3600, CAP = 50000
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
const signup = async (req, env, h) => {
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
  await env.DB.batch(value.apps.map(a => env.DB.prepare(q).bind(value.email, a, value.device, value.handle, now)))
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
export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url), o = req.headers.get('Origin') || '', h = cors(env, o), p = url.pathname.replace(/\/+$/, '') || '/', m = req.method
      return p === '/health' && m === 'GET' ? json(200, { ok: true, service: 'amni-beta' }) : p === '/signup' && m === 'OPTIONS' ? new Response(null, { status: origins(env).includes(o) ? 204 : 403, headers: h }) : p === '/signup' && m === 'POST' ? await signup(req, env, h) : p === '/export' && m === 'GET' ? await exportCsv(req, env, url) : p === '/delete' && m === 'POST' ? await remove(req, env, url) : json(404, { ok: false, error: 'not_found' })
    } catch { return json(500, { ok: false, error: 'server' }) }
  }
}
