import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadCore, catalog, priceOf } from './construct-deck-wasm.mjs'
import { fixGarden, totals, halfUp, DIRECT_SOW } from '../_shared/est-math.js'
const build = await loadCore('garden'), price = priceOf(catalog('garden'))
const bed = (plant, w = 4, l = 8) => ({ name: plant, plant, w_ft: w, l_ft: l, spacing_in: 0 })
const run = (beds, soil_depth_in = 10) => fixGarden(build({ beds, soil_depth_in, issue_date: '2026-10-07' }))
test('soil plus compost fills the beds once, with 10% for settling', () => {
  const o = run([bed('tomato'), bed('lettuce', 4, 6), bed('carrot', 3, 6), bed('bean')]), q = id => o.bom.find(i => i.id === id).qty
  assert.equal(o.calc.total_area, 106)
  assert.ok(Math.abs(o.calc.soil_yd3 - 106 * 10 / 12 / 27) < 1e-3)
  assert.equal(q('soil'), halfUp(o.calc.soil_yd3 * 2 / 3 * 1.1))
  assert.equal(q('compost'), halfUp(o.calc.soil_yd3 / 3 * 1.1))
  assert.ok(q('soil') + q('compost') <= o.calc.soil_yd3 * 1.1 + 1)
})
test('direct-sown crops are priced as seed, not $3.50 per carrot', () => {
  const raw = build({ beds: [bed('carrot')], soil_depth_in: 10 }), o = run([bed('carrot')])
  assert.equal(raw.bom.find(i => i.id === 'plants').qty, 561)
  assert.ok(!o.bom.some(i => i.id === 'plants'))
  assert.equal(o.bom.find(i => i.id === 'seed').qty, Math.ceil(561 / DIRECT_SOW.carrot))
  assert.ok(totals(raw.bom, price).hd > 2000 && totals(o.bom, price).hd < 500)
  const mix = run([bed('tomato'), bed('bean')])
  assert.equal(mix.bom.find(i => i.id === 'plants').qty, 15)
  assert.ok(mix.bom.find(i => i.id === 'seed').qty >= 1)
})
test('every garden line has both store prices', () => {
  for (const p of ['tomato', 'pepper', 'lettuce', 'carrot', 'bean', 'cucumber', 'squash', 'kale', 'onion', 'garlic', 'herb', 'strawberry', 'flower']) assert.deepEqual(totals(run([bed(p)]).bom, price).miss, { hd: 0, lowes: 0 })
})
