import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadCore, catalog, priceOf } from './construct-deck-wasm.mjs'
import { money, cents, parsePrice, clampNum, lineTotal, totals, materialsCSV, sanitizeDeck, localize, missNote } from '../_shared/est-math.js'
const defCfg = { length: 12, depth: 8, height: 16, spacing: 16, decking: 'pt', attach: 'ledger', foundation: 'footing', joist: '2x8', fascia: false, skirting: false, stain: 'redwood', house: 'cream', mode: 'rect', polygon: null, house_edge: 0, stairs: [{ side: 'front', width: 48, offset: -1 }], railing: { front: false, left: false, right: false, style: 'wood' }, door: { pos: -1, width: 60, rise: 7, panels: 2, count: 1 } }
const build = await loadCore('deck'), cat = catalog('deck'), price = priceOf(cat)
const run = c => build({ ...c, polygon: c.mode === 'poly' ? c.polygon : [], house_edge: c.house_edge ?? -1, issue_date: '2026-10-07' })
test('money has thousands separators and always two decimals', () => {
  assert.equal(money(1039.58), '$1,039.58')
  assert.equal(money(1234567.5), '$1,234,567.50')
  assert.equal(money(0), '$0.00')
  assert.equal(money(null), '—')
  assert.equal(money(NaN), '—')
  assert.equal(money(4830.4, 0), '$4,830')
})
test('cents rounding has no float drift', () => {
  assert.equal(cents(1.005), 101)
  assert.equal(cents(0.1 + 0.2), 30)
  assert.equal(lineTotal(15.97, 3), 47.91)
  assert.equal(lineTotal(0.86, 10), 8.6)
  const t = totals([{ id: 'a', qty: 3 }, { id: 'b', qty: 7 }], (id, s) => ({ a: 0.1, b: 0.2 })[id])
  assert.equal(t.hd, 1.7)
  assert.equal(t.lowes, 1.7)
})
test('price input accepts store formats and rejects junk or negatives', () => {
  assert.equal(parsePrice('$1,299.00'), 1299)
  assert.equal(parsePrice(' 12.5 '), 12.5)
  assert.equal(parsePrice('-5'), null)
  assert.equal(parsePrice(''), null)
  assert.equal(parsePrice('abc'), null)
  assert.equal(parsePrice('12.345'), 12.35)
  assert.equal(clampNum('', 4, 40, 12), 12)
  assert.equal(clampNum('9999', 4, 40, 12), 40)
  assert.equal(clampNum('-3', 4, 40, 12), 4)
})
test('a store with unpriced lines is never picked as cheapest', () => {
  const t = totals([{ id: 'a', qty: 1 }, { id: 'b', qty: 1 }], (id, s) => s === 'hd' ? { a: 10, b: 10 }[id] : { a: 10 }[id])
  assert.equal(t.lowes, 10)
  assert.equal(t.hd, 20)
  assert.equal(t.best, 'hd')
  assert.deepEqual(t.miss, { hd: 0, lowes: 1 })
  assert.match(missNote(t), /1 item has no Lowe's price/)
})
test('every deck BOM line has a Home Depot and Lowe\'s catalog price', () => {
  const missing = new Set()
  for (const length of [4, 16, 40]) for (const depth of [4, 14, 20]) for (const decking of ['pt', 'comp']) for (const joist of ['2x6', '2x8', '2x10']) for (const foundation of ['footing', 'pier', 'deckblock']) for (const fx of [false, true]) {
    const o = run({ ...defCfg, length, depth, decking, joist, foundation, attach: fx ? 'free' : 'ledger', fascia: fx, skirting: fx, railing: { front: fx, left: fx, right: !fx, style: fx ? 'alum' : 'wood' } })
    assert.ok(!o.error, o.error)
    for (const it of o.bom) { assert.ok(Number.isInteger(it.qty) && it.qty > 0, `${it.id} qty ${it.qty}`); (price(it.id, 'hd') == null || price(it.id, 'lowes') == null) && missing.add(it.id) }
  }
  assert.deepEqual([...missing], [])
})
test('a 20 ft deep deck prices its 20 ft joists instead of dropping them', () => {
  const o = run({ ...defCfg, depth: 20 }), t = totals(o.bom, price)
  assert.ok(o.bom.some(it => /-20$/.test(it.id)))
  assert.deepEqual(t.miss, { hd: 0, lowes: 0 })
})
test('corrupt or hostile saved config is repaired before it reaches the core', () => {
  for (const bad of [null, 5, 'x', [], { length: 'abc', depth: -4, height: 9999, spacing: 7, stairs: [{ side: 'up', width: NaN, offset: 'x' }, 3], door: 'no', railing: null, mode: 'poly', polygon: [[0, 0], [null, 1]] }]) {
    const c = sanitizeDeck(bad, defCfg), o = run(c)
    assert.ok(!o.error, `${JSON.stringify(bad)} -> ${o.error}`)
    assert.ok(c.length >= 4 && c.length <= 40 && c.depth >= 4 && c.depth <= 20 && c.height >= 8 && c.height <= 96)
    assert.ok(c.stairs.every(s => s.width >= 36 && s.width <= 96 && Number.isFinite(s.offset)))
  }
  const c = sanitizeDeck({ ...defCfg, length: 9999, depth: 0 }, defCfg)
  assert.equal(c.length, 40)
  assert.equal(c.depth, 4)
})
test('a cleared stair width no longer breaks every later rebuild', () => {
  const broken = run({ ...defCfg, stairs: [{ side: 'front', width: null, offset: -1 }] })
  assert.ok(broken.error)
  assert.ok(!run(sanitizeDeck({ ...defCfg, stairs: [{ side: 'front', width: '', offset: -1 }] }, defCfg)).error)
})
test('core warnings no longer name Troy or Cohoes NY for every contractor', () => {
  for (const foundation of ['footing', 'pier', 'deckblock']) for (const attach of ['ledger', 'free']) {
    const w = run({ ...defCfg, foundation, attach, height: 40 }).warnings.map(localize).join('\n')
    assert.doesNotMatch(w, /Troy|Cohoes/)
  }
  assert.match(localize('FOUNDATION|dig 3 holes to ~48 in (below the Troy/Cohoes frost line), bear'), /assumes a 48 in frost line/)
})
test('CSV escapes quotes, blocks spreadsheet formulas and carries a total row', () => {
  const csv = materialsCSV([{ id: 'a', qty: 2, desc: 'Deck Screws 2-1/2" 5lb, coated' }, { id: 'b', qty: 1, desc: '=HYPERLINK("x")' }], (id, s) => ({ a: 39.98, b: 1 })[id])
  const lines = csv.replace(/^﻿/, '').split('\r\n')
  assert.equal(lines[1], '"Deck Screws 2-1/2"" 5lb, coated",2,39.98,79.96,39.98,79.96')
  assert.equal(lines[2], `"'=HYPERLINK(""x"")",1,1.00,1.00,1.00,1.00`)
  assert.equal(lines[3], 'TOTAL,,,80.96,,80.96')
})
test('permit panel warns when local frost is deeper than the 48 in piers', async () => {
  const el = { innerHTML: '' }, store = { amni_construct_loc: JSON.stringify({ st: 'MN', city: '' }) }
  globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => store[k] = v }
  globalThis.document = { querySelector: () => ({ content: 'deck' }), getElementById: id => id === 'permit-info' ? el : id === 'loc-state' ? { innerHTML: '', value: '' } : null }
  const { initPermits, updatePermits } = await import('../deck/codes.js')
  const cfg = { ...defCfg, length: 10, depth: 10 }
  initPermits(() => cfg, () => ({ calc: { area: 64, risers: 3, riser: '6"' } }))
  assert.match(el.innerHTML, /~60", deeper than the 48" piers/)
  assert.match(el.innerHTML, /64 ft²|ledger/i)
  store.amni_construct_loc = JSON.stringify({ st: 'TX', city: '' })
  cfg.attach = 'free'
  const again = await import('../deck/codes.js?tx')
  again.initPermits(() => cfg, () => ({ calc: { area: 64 } }))
  assert.match(el.innerHTML, /may accept shallower footings/)
  assert.match(el.innerHTML, /64 ft² ≤ 200/)
  delete globalThis.document
  delete globalThis.localStorage
})
