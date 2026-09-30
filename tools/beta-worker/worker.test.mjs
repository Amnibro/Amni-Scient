import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import worker, { RL_LIMIT, MAX_BODY, unsubQuery } from './worker.mjs'
const ORIGIN = 'https://amni-scient.com', KEY = 'test-admin-key-0123456789abcdef', SECRET = 'unsub-secret-0123456789abcdef'
const d1 = () => { const db = new DatabaseSync(':memory:'); db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')); const stmt = (sql, args = []) => ({ bind: (...a) => stmt(sql, a), run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }), all: async () => ({ results: db.prepare(sql).all(...args) }), first: async () => db.prepare(sql).get(...args) ?? null }); return { db, prepare: sql => stmt(sql), batch: async s => Promise.all(s.map(x => x.run())) } }
const kv = () => { const m = new Map(); return { m, get: async k => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) } }
const mk = () => ({ DB: d1(), RL: kv(), ADMIN_KEY: KEY, RL_SALT: 'salt', UNSUB_SECRET: SECRET })
const rows = env => env.DB.db.prepare('SELECT * FROM signups ORDER BY app').all()
const post = (env, body, { origin = ORIGIN, ip = '203.0.113.7', type = 'application/json', raw } = {}) => worker.fetch(new Request('https://w.test/signup', { method: 'POST', headers: { Origin: origin, 'Content-Type': type, 'CF-Connecting-IP': ip }, body: raw ?? JSON.stringify(body) }), env)
const good = (o = {}) => ({ email: 'Tester@Gmail.com ', apps: ['chat', 'map'], device: 'android', handle: 'Sam', consent: true, website: '', ...o })
const get = (env, path, h = {}) => worker.fetch(new Request('https://w.test' + path, { headers: h }), env)
test('health', async () => { const r = await get(mk(), '/health'); assert.equal(r.status, 200); assert.deepEqual(await r.json(), { ok: true, service: 'amni-beta' }) })
test('unknown route is 404', async () => assert.equal((await get(mk(), '/nope')).status, 404))
test('valid signup stores one row per app with normalized email and CORS', async () => {
  const env = mk(), r = await post(env, good())
  assert.equal(r.status, 200); assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN)
  assert.deepEqual(rows(env).map(x => [x.email, x.app, x.device, x.handle]), [['tester@gmail.com', 'chat', 'android', 'Sam'], ['tester@gmail.com', 'map', 'android', 'Sam']])
})
test('dedupes by email and app and updates device', async () => {
  const env = mk(); await post(env, good()); const r = await post(env, good({ email: 'tester@gmail.com', apps: ['chat', 'chat', 'type'], device: 'both' }))
  assert.equal(r.status, 200); assert.equal(rows(env).length, 3); assert.equal(rows(env).find(x => x.app === 'chat').device, 'both')
})
test('www origin allowed, other origins rejected', async () => {
  assert.equal((await post(mk(), good(), { origin: 'https://www.amni-scient.com' })).status, 200)
  const r = await post(mk(), good(), { origin: 'https://evil.example' }); assert.equal(r.status, 403); assert.equal(r.headers.get('Access-Control-Allow-Origin'), null)
  assert.equal((await post(mk(), good(), { origin: '' })).status, 403)
})
test('preflight', async () => {
  const pf = o => worker.fetch(new Request('https://w.test/signup', { method: 'OPTIONS', headers: { Origin: o } }), mk())
  const a = await pf(ORIGIN); assert.equal(a.status, 204); assert.equal(a.headers.get('Access-Control-Allow-Origin'), ORIGIN)
  assert.equal((await pf('https://evil.example')).status, 403)
})
test('validation errors', async () => {
  for (const [o, e] of [[{ email: 'nope' }, 'invalid_email'], [{ email: 'a@b' }, 'invalid_email'], [{ email: 'x'.repeat(250) + '@g.co' }, 'invalid_email'], [{ apps: [] }, 'invalid_apps'], [{ apps: ['chat', 'evil'] }, 'invalid_apps'], [{ apps: 'chat' }, 'invalid_apps'], [{ device: 'pc' }, 'invalid_device'], [{ handle: '<script>' }, 'invalid_handle'], [{ handle: 'x'.repeat(41) }, 'invalid_handle'], [{ handle: 5 }, 'invalid_handle'], [{ consent: false }, 'consent_required'], [{ consent: 'yes' }, 'consent_required'], [{ extra: 1 }, 'bad_request']]) {
    const env = mk(), r = await post(env, good(o)); assert.equal(r.status, 400, e); assert.equal((await r.json()).error, e); assert.equal(rows(env).length, 0)
  }
  assert.equal((await post(mk(), null, { raw: '{bad json' })).status, 400)
  assert.equal((await post(mk(), null, { raw: '[]' })).status, 400)
})
test('honeypot is accepted silently and not stored', async () => { const env = mk(), r = await post(env, good({ website: 'http://spam' })); assert.equal(r.status, 200); assert.equal(rows(env).length, 0) })
test('content type and size limits', async () => {
  assert.equal((await post(mk(), good(), { type: 'text/plain' })).status, 415)
  const env = mk(); assert.equal((await post(env, null, { raw: JSON.stringify(good({ handle: 'x'.repeat(MAX_BODY) })) })).status, 413); assert.equal(rows(env).length, 0)
})
test('rate limit per ip without storing the ip', async () => {
  const env = mk()
  for (let i = 0; i < RL_LIMIT; i++) assert.equal((await post(env, good({ email: `t${i}@gmail.com` }))).status, 200)
  const r = await post(env, good({ email: 'late@gmail.com' })); assert.equal(r.status, 429); assert.equal(r.headers.get('Retry-After'), '3600')
  assert.equal((await post(env, good({ email: 'other@gmail.com' }), { ip: '198.51.100.9' })).status, 200)
  const dump = JSON.stringify([...env.RL.m]) + JSON.stringify(rows(env)); assert.ok(!dump.includes('203.0.113.7') && !dump.includes('198.51.100.9'))
  assert.deepEqual(Object.keys(rows(env)[0]).sort(), ['app', 'created_at', 'device', 'email', 'handle'])
})
test('export requires the admin key', async () => {
  const env = mk(); await post(env, good()); await post(env, good({ email: 'b@gmail.com', apps: ['chat'], handle: '-dash' }))
  assert.equal((await get(env, '/export')).status, 401); assert.equal((await get(env, '/export?key=wrong')).status, 401); assert.equal((await get(env, '/export', { Authorization: 'Bearer wrong' })).status, 401)
  const env2 = { ...mk(), ADMIN_KEY: '' }; assert.equal((await get(env2, '/export?key=')).status, 401)
  const r = await get(env, '/export?key=' + KEY), csv = await r.text(); assert.equal(r.status, 200); assert.match(r.headers.get('Content-Type'), /text\/csv/)
  assert.equal(csv.split('\n')[0], 'email,app,device,handle,created_at'); assert.equal(csv.trim().split('\n').length, 4); assert.ok(csv.includes("'-dash"))
  const e = await (await get(env, '/export?app=chat&format=emails', { Authorization: 'Bearer ' + KEY })).text(); assert.equal(e, 'tester@gmail.com,b@gmail.com\n')
  assert.equal((await get(env, '/export?app=bogus&key=' + KEY)).status, 400)
})
test('admin delete', async () => {
  const env = mk(); await post(env, good())
  const del = (b, k = KEY) => worker.fetch(new Request('https://w.test/delete', { method: 'POST', headers: { Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }), env)
  assert.equal((await del({ email: 'tester@gmail.com' }, 'wrong')).status, 401)
  assert.deepEqual(await (await del({ email: 'TESTER@gmail.com', app: 'map' })).json(), { ok: true, deleted: 1 })
  assert.deepEqual(await (await del({ email: 'tester@gmail.com' })).json(), { ok: true, deleted: 1 }); assert.equal(rows(env).length, 0)
})
const sup = env => env.DB.db.prepare('SELECT * FROM suppressed ORDER BY email').all().map(r => ({ ...r }))
const form = (env, path, body, type = 'application/x-www-form-urlencoded') => worker.fetch(new Request('https://w.test' + path, { method: 'POST', headers: { 'Content-Type': type }, body }), env)
const adm = (env, path, b, k = KEY) => worker.fetch(new Request('https://w.test' + path, { method: 'POST', headers: { Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }), env)
test('unsubscribe GET only confirms, POST suppresses and clears signups, resubscribe undoes', async () => {
  const env = mk(); await post(env, good()); const q = await unsubQuery(SECRET, 'tester@gmail.com')
  const g = await get(env, '/unsubscribe?' + q), page = await g.text(); assert.equal(g.status, 200); assert.match(page, /t\*\*\*@gmail\.com/); assert.ok(!page.includes('tester@gmail.com')); assert.match(page, /method="post"/); assert.match(page, /play\.google\.com\/apps\/testing\/com\.amniscient\.chat/); assert.match(page, /groups\.google\.com\/g\/amni-scient-testers/)
  assert.equal(g.headers.get('Referrer-Policy'), 'no-referrer'); assert.equal(sup(env).length, 0); assert.equal(rows(env).length, 2)
  const p = await form(env, '/unsubscribe?' + q, 'remove_testing=1'); assert.equal(p.status, 200); assert.match(await p.text(), /unsubscribed[\s\S]*\/resubscribe\?/)
  assert.deepEqual(sup(env).map(r => [r.email, r.source, r.remove_testing, r.created_day.length]), [['tester@gmail.com', 'link', 1, 10]]); assert.equal(rows(env).length, 0)
  assert.deepEqual(Object.keys(sup(env)[0]).sort(), ['created_day', 'email', 'remove_testing', 'source'])
  await form(env, '/unsubscribe?' + q, ''); assert.equal(sup(env).length, 1); assert.equal(sup(env)[0].remove_testing, 1)
  assert.match(await (await get(env, '/unsubscribe?' + q)).text(), /You're unsubscribed/)
  const r = await form(env, '/resubscribe?' + q, ''); assert.equal(r.status, 200); assert.match(await r.text(), /resubscribed/); assert.equal(sup(env).length, 0)
})
test('one-click unsubscribe (RFC 8058) urlencoded and multipart', async () => {
  const env = mk(), q = await unsubQuery(SECRET, 'a@b.co'), r = await form(env, '/unsubscribe?' + q, 'List-Unsubscribe=One-Click'); assert.equal(r.status, 200); assert.deepEqual(sup(env).map(x => [x.email, x.remove_testing]), [['a@b.co', 0]])
  const fd = new FormData(); fd.set('List-Unsubscribe', 'One-Click'); const q2 = await unsubQuery(SECRET, 'c@d.co')
  assert.equal((await worker.fetch(new Request('https://w.test/unsubscribe?' + q2, { method: 'POST', body: fd }), env)).status, 200); assert.equal(sup(env).length, 2)
})
test('bad or forged unsubscribe tokens are rejected', async () => {
  const env = mk(), q = await unsubQuery(SECRET, 'tester@gmail.com'), forged = await unsubQuery('wrong', 'tester@gmail.com'), other = (await unsubQuery(SECRET, 'x@gmail.com')).split('&')[1]
  for (const bq of ['', 'e=&s=', forged, q.split('&')[0] + '&' + other, q.replace(/s=./, 's=A'), 'e=%%%&s=x']) { assert.equal((await get(env, '/unsubscribe?' + bq)).status, 400, bq); assert.equal((await form(env, '/unsubscribe?' + bq, 'List-Unsubscribe=One-Click')).status, 400) }
  assert.equal((await get({ ...env, UNSUB_SECRET: '' }, '/unsubscribe?' + q)).status, 400); assert.equal(sup(env).length, 0)
})
test('admin suppression endpoints', async () => {
  const env = mk(); await post(env, good())
  assert.equal((await adm(env, '/admin/suppress', { email: 'tester@gmail.com' }, 'wrong')).status, 401); assert.equal((await get(env, '/admin/suppressed')).status, 401)
  assert.equal((await adm(env, '/admin/suppress', { email: 'nope' })).status, 400); assert.equal((await adm(env, '/admin/suppress', { email: 'a@b.co', source: 'evil' })).status, 400)
  assert.deepEqual(await (await adm(env, '/admin/suppress', { email: ' Tester@Gmail.com', source: 'reply', remove_testing: true })).json(), { ok: true, email: 'tester@gmail.com', deleted_signups: 2 })
  await adm(env, '/admin/suppress', { email: 'b@b.co', source: 'bounce' })
  const l = await (await get(env, '/admin/suppressed', { Authorization: 'Bearer ' + KEY })).json(); assert.equal(l.count, 2); assert.deepEqual(l.suppressed.map(x => [x.email, x.source, x.remove_testing]), [['b@b.co', 'bounce', false], ['tester@gmail.com', 'reply', true]])
  assert.equal(await (await get(env, '/admin/suppressed?format=emails', { Authorization: 'Bearer ' + KEY })).text(), 'b@b.co\ntester@gmail.com\n')
  assert.deepEqual(await (await adm(env, '/admin/unsuppress', { email: 'b@b.co' })).json(), { ok: true, removed: 1 }); assert.equal(sup(env).length, 1)
})
test('signing up again clears suppression', async () => {
  const env = mk(); await adm(env, '/admin/suppress', { email: 'tester@gmail.com', source: 'reply' }); assert.equal(sup(env).length, 1)
  assert.equal((await post(env, good())).status, 200); assert.equal(sup(env).length, 0)
})
