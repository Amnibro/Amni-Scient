import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyScene, addNode, addRun, measure, realComponents } from '../elec/sketch.js'
import { rangeDemandVA, fixElecOut, bomElec, validateElec, makeElecTrade } from '../elec/elec-rules.js'
const root = new URL('../', import.meta.url)
const catalog = JSON.parse(readFileSync(new URL('elec/catalog.json', root)))
const core = await (async () => { const { instance } = await WebAssembly.instantiate(readFileSync(new URL('elec/elec_core.wasm', root))); const { alloc, dealloc, build, memory } = instance.exports; return o => { const b = new TextEncoder().encode(JSON.stringify(o)), p = alloc(b.length); new Uint8Array(memory.buffer, p, b.length).set(b); const rp = build(p, b.length), len = new DataView(memory.buffer).getUint32(rp, true), r = JSON.parse(new TextDecoder().decode(new Uint8Array(memory.buffer, rp + 4, len))); dealloc(p, b.length); dealloc(rp, len + 4); return r } })()
const s = Math.sqrt(1800), house = { polygon: [[0, 0], [s, 0], [s, s], [0, s]], bedrooms: 3, bathrooms: 2, has_laundry: true, electric_range: 1, electric_dryer: 1, water_heater_elec: true, dishwasher: true, disposal: true, microwave: true, hvac_amps: 30 }
const run = c => fixElecOut(core(c), c)
test('NEC Table 220.55 column C demand for household ranges', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 10].map(rangeDemandVA), [0, 8000, 11000, 14000, 17000, 20000, 21000, 25000])
  assert.equal(rangeDemandVA(-2), 0)
  assert.equal(rangeDemandVA('x'), 0)
})
test('standard-method load calc for a typical 1,800 sq ft house', () => {
  const o = run(house)
  assert.equal(o.calc.total_demand_va, 31690)
  assert.equal(o.calc.service_size_a, 200)
})
test('two ranges use the 11 kW table demand, not 16 kW, and stay on a 200 A service', () => {
  const o = run({ ...house, electric_range: 2 })
  assert.equal(o.calc.total_demand_va, 34690)
  assert.equal(o.calc.service_size_a, 200)
  assert.match(o.warnings[0], /34690 VA total demand .* = 145 A -> 200 A service/)
  assert.ok(!o.warnings.some(w => w.includes('exceeds a 200 A service')))
  assert.match(o.svgs.layout, /MAIN 200 A</)
  assert.match(o.svgs.layout, /TOTAL DEMAND: 34690 VA/)
  assert.ok(!/400 A/.test(o.svgs.layout))
  assert.equal(o.bom.find(b => b.id === 'panel').desc, '200 A main breaker load center')
})
test('breakers are not double counted with AFCI breakers, and 240 V circuits get 2-pole breakers', () => {
  const o = run(house), q = id => (o.bom.find(b => b.id === id) || { qty: 0 }).qty
  assert.equal(q('breaker') + q('breaker2') + q('afci'), o.calc.total_circuits)
  assert.equal(q('breaker2'), 4)
  assert.ok(catalog.breaker2 && catalog.breaker2.hd > 0)
  const noLoads = run({ ...house, electric_range: 0, electric_dryer: 0, water_heater_elec: false, hvac_amps: 0, dishwasher: false, disposal: false, microwave: false })
  assert.ok(!noLoads.bom.some(b => b.id === 'breaker' || b.id === 'breaker2'))
})
test('ampacity details sheet shows #1 Al for 100 A, not 4/0 Al', () => {
  const d = run(house).svgs.details
  assert.ok(d.includes('#3 Cu / #1 Al'))
  assert.ok(!d.includes('#3 (4/0 Al)'))
})
test('bad inputs reach the core as an error, never a crash', () => {
  assert.ok(core({ ...house, bedrooms: -1 }).error)
  assert.ok(core({ ...house, bathrooms: 2.5 }).error)
})
test('kitchen and laundry circuits need AFCI (NEC 210.12) and GFCI is still counted', () => {
  const sc = emptyScene(24), P = addNode(sc, 'panel', 0, 0), k = addNode(sc, 'recept', 120, 0, { room: 'kitchen' }); addRun(sc, 'nm122', P, k)
  const b = bomElec(sc, measure(sc))
  assert.equal(b.find(x => x.key === 'afci').qty, 1)
  assert.equal(b.find(x => x.key === 'gfci').qty, 1)
  assert.ok(!b.some(x => x.key === 'breaker'))
  assert.ok(validateElec(sc, measure(sc)).some(c => c.msg.includes('AFCI')))
})
test('10/3 and 6/3 cable is bought in the 25 ft coils the catalog prices', () => {
  const t = makeElecTrade(), sc = emptyScene(24), P = addNode(sc, 'panel', 0, 0), d = addNode(sc, 'dryer', 2400, 0); addRun(sc, 'nm103', P, d)
  assert.equal(t.stock.nm103.len, 25)
  assert.match(catalog.nm103.name, /25 ft/)
  const line = realComponents(sc, t, catalog, 'hd').items.find(i => i.name.startsWith('Wire 30A'))
  assert.equal(line.qty, 4)
  assert.equal(line.cost, 176)
})
