import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const P = require('../_shared/pro.js')
const { access, TRIAL_MS } = require('../_shared/pro-license.js')
const S = require('../_shared/share-import.js')
const DAY = 864e5
test('the pricing page example adds up to the cent', () => {
  const c = P.quoteMath(4200, { markup: 15, overhead: 250, tax: 6, deposit: 50 }, [{ desc: 'Crew', crew: 2, hrs: 24, rate: 75 }], [])
  assert.deepEqual([c.ms, c.lb, c.sub, c.tax, c.grand, c.dep, c.bal], [4830, 3600, 8680, 520.8, 9200.8, 4600.4, 4600.4])
})
test('every line is rounded to cents first, so the printed lines sum to the printed total', () => {
  const c = P.quoteMath(1039.58, { markup: 15, overhead: 0, tax: 7.25, deposit: 33 }, [{ hrs: 1.333, rate: 77.77 }, { hrs: 2.5, rate: 61.01 }], [{ amt: 10.005 }])
  const lines = [c.ms, ...c.lines.map(l => l.amt), ...c.xs.map(x => x.amt), c.oh]
  assert.equal(P.r2(lines.reduce((a, b) => a + b, 0)), c.sub)
  assert.equal(P.r2(c.sub + c.tax), c.grand)
  assert.equal(P.r2(c.dep + c.bal), c.grand)
  for (const v of [c.ms, c.lb, c.ex, c.sub, c.tax, c.grand, c.dep]) assert.equal(Math.round(v * 100) / 100, v)
  assert.equal(P.r2(1.005), 1.01)
  assert.equal(P.r2(8680 * 0.06), 520.8)
})
test('blank, NaN, negative and huge inputs never produce NaN or a negative quote', () => {
  const c = P.quoteMath('abc', { markup: '', tax: NaN, overhead: -500, discount: 1e12, deposit: 250 }, [{ hrs: -8, rate: 75 }, null, 'x', { hrs: '', rate: '' }], [{ amt: -300 }, {}])
  for (const v of Object.values(c).filter(v => typeof v === 'number')) assert.ok(Number.isFinite(v) && v >= 0, String(v))
  assert.equal(c.grand, 0)
  const empty = P.quoteMath(undefined, undefined, undefined, undefined)
  assert.equal(empty.grand, 0)
  assert.equal(P.money(NaN), '$0.00')
  assert.equal(P.money(1234567.5), '$1,234,567.50')
})
test('flat discount is capped at the pre-discount subtotal; percent discount applies before tax', () => {
  const flat = P.quoteMath(1000, { discount: 5000, tax: 10 }, [], [])
  assert.equal(flat.sub, 0)
  const pct = P.quoteMath(1000, { discType: 'pct', discount: 10, tax: 10 }, [], [])
  assert.deepEqual([pct.di, pct.sub, pct.tax, pct.grand], [100, 900, 90, 990])
  const crewless = P.quoteMath(0, {}, [{ hrs: 10, rate: 50 }], [])
  assert.equal(crewless.lb, 500)
})
test('quote numbers never repeat, even when the counter is behind the history', () => {
  const hist = [{ qn: 'Q-2026-0007' }, { qn: 'Q-2025-0003' }, { qn: 'junk' }]
  assert.equal(P.nextQn(hist, 2, 2026).qn, 'Q-2026-0008')
  assert.equal(P.nextQn([], undefined, 2026).qn, 'Q-2026-0001')
  assert.equal(P.nextQn(null, 'x', 2027).qn, 'Q-2027-0001')
})
test('restoring a backup merges lists, keeps this device licence and trial, and skips foreign keys', () => {
  const cur = { 'amni.pro.quotes.v1': JSON.stringify([{ qn: 'Q-2026-0009', ts: 9, status: 'accepted' }]), 'amni.pro.clients.v1': JSON.stringify([{ name: 'Dana' }]), 'amni.pro.v1': JSON.stringify({ key: 'AMNI-PRO-AAAAA-BBBBB', ent: { exp: 5 }, sig: 's', trialStart: 500, seq: 9, co: { name: 'Old' } }), 'amnideck.cfg.v2': '{"length":20}' }
  const file = { v: 1, app: 'amni-construct-pro', ts: 1, data: { 'amni.pro.quotes.v1': JSON.stringify([{ qn: 'Q-2026-0009', ts: 9, status: 'draft' }, { qn: 'Q-2026-0002', ts: 2, status: 'sent' }]), 'amni.pro.clients.v1': JSON.stringify([{ name: 'dana ' }, { name: 'Lee' }]), 'amni.pro.v1': JSON.stringify({ trialStart: 100, seq: 3, co: { name: 'Ridgeline' }, key: 'AMNI-PRO-ZZZZZ-ZZZZZ' }), 'amnideck.cfg.v2': '{"length":12}', 'amnideck.prices.v1': { 'lumber.hd': 9.5 }, 'amni.pro.device.v1': 'clone-me', 'evil': 'x', 'amni.pro.projects.v1': 'not json' } }
  const entries = P.backupEntries(file)
  assert.ok(!entries.some(([k]) => k === 'evil' || k === 'amni.pro.device.v1'))
  assert.ok(entries.some(([k, v]) => k === 'amnideck.prices.v1' && JSON.parse(v)['lumber.hd'] === 9.5))
  const { out, n } = P.mergeBackup(k => cur[k] ?? null, entries)
  const quotes = JSON.parse(out['amni.pro.quotes.v1'])
  assert.deepEqual(quotes.map(q => q.qn + ':' + q.status), ['Q-2026-0009:accepted', 'Q-2026-0002:sent'])
  assert.deepEqual(JSON.parse(out['amni.pro.clients.v1']).map(c => c.name), ['Dana', 'Lee'])
  const ps = JSON.parse(out['amni.pro.v1'])
  assert.equal(ps.key, 'AMNI-PRO-AAAAA-BBBBB')
  assert.equal(ps.sig, 's')
  assert.equal(ps.trialStart, 100)
  assert.equal(ps.seq, 9)
  assert.equal(ps.co.name, 'Ridgeline')
  assert.equal(out['amnideck.cfg.v2'], '{"length":12}')
  assert.equal('amni.pro.projects.v1' in out, false)
  assert.deepEqual([n.quotes, n.clients, n.projects], [1, 1, 0])
  assert.deepEqual(P.backupEntries('nope'), [])
  assert.deepEqual(P.backupEntries({ hello: 1 }), [])
  assert.equal(P.backupEntries({ 'amnideck.cfg.v2': '{}' }).length, 1)
})
test('rolling the clock back does not restart an expired trial', () => {
  const t0 = Date.UTC(2026, 0, 1)
  const ps = { trialStart: t0, seen: t0 + TRIAL_MS + DAY }
  assert.equal(access(ps, t0 + 3 * DAY, false).ok, false)
  assert.equal(access({ trialStart: t0, seen: t0 + 2 * DAY }, t0 + DAY, false).kind, 'trial')
  assert.equal(access({ trialStart: 'garbage' }, t0, false).ok, false)
  assert.equal(access(null, t0, false).ok, false)
})
test('homeowner links drop price tables and malformed share hashes leave storage alone', () => {
  const store = new Map([['amnideck.cfg.v2', JSON.stringify({ length: 12 })], ['amnideck.prices.v1', JSON.stringify({ 'joist.hd': 14.2 })]])
  const storage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) }
  const sent = S.homeownerShareData('deck', storage)
  assert.equal(Object.keys(sent).some(k => /\.prices\.v\d+$/.test(k)), false)
  for (const hash of ['#share=', '#share=%%%', '#share=e30=', '#share=' + 'A'.repeat(1024 * 1024 + 4)]) {
    const r = S.restoreFromLocation('deck', { location: { hash, pathname: '/deck/', search: '' }, history: { replaceState() {} }, storage, document: null })
    assert.equal(r.status, 'error')
  }
  assert.equal(store.get('amnideck.prices.v1'), JSON.stringify({ 'joist.hd': 14.2 }))
  assert.throws(() => S.encodePayload({ 'amnideck.cfg.v2': 'x'.repeat(S.MAX_DECODED_BYTES + 1) }), /too large/)
})
