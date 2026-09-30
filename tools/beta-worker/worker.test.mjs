import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import worker, { RL_LIMIT, MAX_BODY } from './worker.mjs'
const ORIGIN = 'https://amni-scient.com', KEY = 'test-admin-key-0123456789abcdef'
const d1 = () => { const db = new DatabaseSync(':memory:'); db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')); const stmt = (sql, args = []) => ({ bind: (...a) => stmt(sql, a), run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }), all: async () => ({ results: db.prepare(sql).all(...args) }), first: async () => db.prepare(sql).get(...args) ?? null }); return { db, prepare: sql => stmt(sql), batch: async s => Promise.all(s.map(x => x.run())) } }
const kv = () => { const m = new Map(); return { m, get: async k => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) } }
const mk = () => ({ DB: d1(), RL: kv(), ADMIN_KEY: KEY, RL_SALT: 'salt' })
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
