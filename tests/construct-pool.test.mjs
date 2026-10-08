import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadCore, catalog, priceOf, rect } from './construct-deck-wasm.mjs'
import { fixPool, totals } from '../_shared/est-math.js'
const build = await loadCore('pool'), price = priceOf(catalog('pool'))
const base = { polygon: rect(16, 32), shallow_in: 36, deep_in: 72, kind: 'inground', finish: 'liner', heater: false, temp_rise: 20, house_edge: 0, issue_date: '2026-10-07' }
const run = x => { const c = { ...base, ...x }; return fixPool(build(c), c.kind) }
test('gallons and turnover match the geometry', () => {
  const o = build(base)
  assert.equal(Math.round(o.calc.gallons), Math.round(16 * 32 * 4.5 * 7.48052))
  assert.equal(Math.round(o.calc.turnover_gpm * 10), Math.round(o.calc.gallons / 480 * 10))
})
test('shell rebar covers the wetted area on a 12 in grid', () => {
  const raw = build(base).bom.find(i => i.id === 'rebar'), fixed = run({}).bom.find(i => i.id === 'rebar')
  assert.equal(raw.qty, 6)
  assert.equal(fixed.qty, Math.ceil(944 * 2 / 20 * 1.1))
  assert.ok(run({ polygon: rect(60, 60), deep_in: 120 }).bom.find(i => i.id === 'rebar').qty > 500)
})
test('above-ground pools are not charged for main drains or coping', () => {
  const ids = run({ kind: 'above' }).bom.map(i => i.id)
  assert.ok(!ids.includes('maindrain') && !ids.includes('coping') && ids.includes('wallkit'))
  assert.ok(run({}).bom.some(i => i.id === 'maindrain'))
})
test('pool lines are all priced', () => {
  for (const kind of ['inground', 'above']) for (const heater of [false, true]) assert.deepEqual(totals(run({ kind, heater }).bom, price).miss, { hd: 0, lowes: 0 })
})
