import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cents, usd, validScene, matCsv, matTableHTML, parseStorePrice, priceBOM, emptyScene } from '../_shared/sketch.js'
import { readFileSync } from 'node:fs'
test('money rounds half away from zero to the cent and prints with separators', () => {
  assert.equal(cents(1.005), 1.01)
  assert.equal(cents(0.1 + 0.2), 0.3)
  assert.equal(cents(-2.675), -2.68)
  assert.equal(cents(NaN), 0)
  assert.equal(usd(1039.58), '$1,039.58')
  assert.equal(usd(1234567.5, 0), '$1,234,568')
  assert.equal(usd(-3.5), '−$3.50')
})
test('priced lines add up to the printed total', () => {
  const q = priceBOM([{ key: 'a', qty: 3 }, { key: 'b', qty: 3 }], { a: { hd: 0.335 }, b: { hd: 0.335 } }, 'hd')
  assert.equal(q.total, q.lines.reduce((s, l) => cents(s + l.cost), 0))
  assert.equal(q.total, 2.02)
  assert.equal(priceBOM([{ key: 'a', qty: 2 }], { a: { hd: -5 } }, 'hd').total, 0)
})
test('CSV quotes inch marks and commas and ends with a total row', () => {
  const csv = matCsv([{ id: 'p', desc: '1/2" PEX, 100 ft', qty: 2 }], (k, s) => s === 'hd' ? 39.97 : null).split('\n')
  assert.equal(csv[1], '"1/2"" PEX, 100 ft",2,39.97,79.94,,')
  assert.equal(csv[2], 'TOTAL,,,79.94,,0.00')
})
test('materials table never marks an unpriced store as cheapest', () => {
  const h = matTableHTML([{ id: 'a', desc: 'A', qty: 1 }, { id: 'b', desc: 'B', qty: 1 }], (k, s) => s === 'hd' ? 10 : k === 'a' ? 1 : null, {})
  assert.match(h, /class="tot best">\$20\.00/)
  assert.match(h, /1 unpriced/)
})
test('store page prices with thousands separators parse', () => {
  assert.equal(parseStorePrice('Water heater $1,299.00 each'), 1299)
  assert.equal(parseStorePrice('$ 24.97'), 24.97)
  assert.equal(parseStorePrice('no price'), null)
})
test('corrupt saved layouts are rejected instead of crashing the editor', () => {
  assert.equal(validScene(emptyScene()), true)
  assert.equal(validScene({ nodes: [] }), false)
  assert.equal(validScene({ nodes: [{ id: 'n1', x: 'a', y: 0 }], runs: [] }), false)
  assert.equal(validScene(null), false)
})
test('tool copies of the shared sketch engine are identical', () => {
  const base = readFileSync(new URL('../_shared/sketch.js', import.meta.url), 'utf8')
  for (const t of ['plumb', 'elec', 'hvac']) for (const f of ['sketch', 'sketch-canvas', 'sketch-3d', 'room-detect', 'perspective', 'cloud-align']) assert.equal(readFileSync(new URL(`../${t}/${f}.js`, import.meta.url), 'utf8'), readFileSync(new URL(`../_shared/${f}.js`, import.meta.url), 'utf8'), `${t}/${f}.js`)
  for (const t of ['plumb', 'elec', 'hvac']) assert.equal(readFileSync(new URL(`../${t}/${t}-rules.js`, import.meta.url), 'utf8'), readFileSync(new URL(`../_shared/${t}-rules.js`, import.meta.url), 'utf8'))
  assert.ok(base.length)
})
