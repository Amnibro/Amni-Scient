import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyScene, addNode, addRun, realComponents, storeTotals } from '../hvac/sketch.js'
import { makeHvacTrade, validateHvac, hvacAirflow } from '../hvac/hvac-rules.js'
import { measure } from '../hvac/sketch.js'
const catalog = JSON.parse(readFileSync(new URL('../hvac/catalog.json', import.meta.url)))
test('12 in trunk is bought as 25 ft flex, the size the catalog prices', () => {
  const s = emptyScene(24), ah = addNode(s, 'airhandler', 0, 0, { tons: 2 }), r = addNode(s, 'supply', 720, 0, { cfm: 150 }); addRun(s, 's12', ah, r)
  const line = realComponents(s, makeHvacTrade(), catalog, 'hd').items.find(i => i.name.startsWith('12" trunk'))
  assert.equal(line.qty, 2)
  assert.equal(line.cost, 149.94)
})
test('supply CFM adds up along shared ducts and flags an undersized branch', () => {
  const s = emptyScene(24), ah = addNode(s, 'airhandler', 0, 0, { tons: 2 }), d = addNode(s, 'damper', 120, 0)
  addRun(s, 's6', ah, d); for (let i = 0; i < 3; i++) addRun(s, 's6', d, addNode(s, 'supply', 240, i * 48, { cfm: 100 }))
  assert.equal(hvacAirflow(s).totalSupply, 300)
  assert.ok(validateHvac(s, measure(s)).some(c => c.level === 'fail' && c.msg.includes('300 CFM')))
})
test('cheapest complete store is marked best; an unpriced store is never best', () => {
  const bom = [{ key: 'a', qty: 2 }, { key: 'b', qty: 1 }], P = { 'a.hd': 10, 'b.hd': 5, 'a.lowes': 9 }
  const t = storeTotals(bom, (k, st) => P[k + '.' + st] ?? null)
  assert.equal(t.th, 25)
  assert.equal(t.tl, 18)
  assert.equal(t.ml, 1)
  assert.equal(t.best, 'hd')
})
