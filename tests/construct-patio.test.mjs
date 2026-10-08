import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadCore, catalog, priceOf, rect } from './construct-deck-wasm.mjs'
import { fixPatio, totals, lineTotal, materialsCSV } from '../deck/estimate-math.js'
const build = await loadCore('patio'), cat = catalog('patio'), price = priceOf(cat)
const base = { polygon: rect(14, 12), thickness_in: 4, base_in: 4, reinforce: 'mesh', finish: 'plain', turndown: { enabled: false, depth_in: 12, width_in: 8 }, vehicle: false, joint_max_ft: 0, house_edge: 0, border: false, sleeves: false, issue_date: '2026-10-07' }
const run = x => fixPatio(build({ ...base, ...x }))
test('ready-mix is priced per cubic yard ordered, not as one flat line', () => {
  for (const [w, d] of [[8, 8], [14, 12], [30, 30], [60, 60]]) {
    const o = run({ polygon: rect(w, d) }), rm = o.bom.find(i => i.id === 'readymix')
    assert.equal(rm.qty, +o.calc.order_yd3.toFixed(2))
    assert.equal(lineTotal(price('readymix', 'hd'), rm.qty), Math.round(185 * o.calc.order_yd3 * 100) / 100)
  }
  assert.equal(run({ polygon: rect(60, 60) }).bom.find(i => i.id === 'readymix').qty, 47.75)
})
test('bagged mix is shown as an alternative and kept out of the totals', () => {
  const o = run({}), items = o.bom.filter(i => !i.alt), alts = o.bom.filter(i => i.alt)
  assert.deepEqual(alts.map(i => i.id), ['bags80'])
  const t = totals(items, price), raw = totals(build(base).bom, price)
  assert.equal(Math.round((raw.hd - t.hd) * 100), Math.round((98 * 6.48 + 185 - 2.25 * 185) * 100))
  const expect = items.reduce((a, it) => a + Math.round(price(it.id, 'hd') * it.qty * 100), 0) / 100
  assert.equal(t.hd, expect)
  const csv = materialsCSV(items, price, alts).split('\r\n')
  assert.match(csv.at(-1), /alternative, not in total/)
  assert.match(csv.at(-2), /^TOTAL,/)
})
test('the bag row stays out of the Pro quote schedule scrape', () => {
  assert.match(run({}).bom.find(i => i.alt).desc, /total/i)
})
test('every patio BOM line has both store prices', () => {
  for (const finish of ['plain', 'pavers', 'flagstone', 'mosaic', 'aggregate', 'slate']) for (const reinforce of ['mesh', 'rebar', 'none']) for (const fx of [false, true]) {
    const o = run({ finish, reinforce, border: fx, sleeves: fx, vehicle: fx, turndown: { enabled: fx, depth_in: 12, width_in: 8 } })
    assert.deepEqual(totals(o.bom, price).miss, { hd: 0, lowes: 0 })
  }
})
