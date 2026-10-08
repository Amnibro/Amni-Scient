import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyScene, addNode, addRun, measure, evaluate } from '../plumb/sketch.js'
import { bomPlumb, validatePlumb, makePlumbTrade } from '../plumb/plumb-rules.js'
const root = new URL('../', import.meta.url)
const catalog = JSON.parse(readFileSync(new URL('plumb/catalog.json', root)))
const core = await (async () => { const { instance } = await WebAssembly.instantiate(readFileSync(new URL('plumb/plumb_core.wasm', root))); const { alloc, dealloc, build, memory } = instance.exports; return o => { const b = new TextEncoder().encode(JSON.stringify(o)), p = alloc(b.length); new Uint8Array(memory.buffer, p, b.length).set(b); const rp = build(p, b.length), len = new DataView(memory.buffer).getUint32(rp, true), r = JSON.parse(new TextDecoder().decode(new Uint8Array(memory.buffer, rp + 4, len))); dealloc(p, b.length); dealloc(rp, len + 4); return r } })()
const bath = () => { const s = emptyScene(24), M = addNode(s, 'main', 300, 0), V = addNode(s, 'vent', 100, -60), W = addNode(s, 'toilet', 100, 0), L = addNode(s, 'lav', 160, 0), T = addNode(s, 'tub', 220, 0); addRun(s, 'dwv3', W, M); addRun(s, 'dwv15', L, W); addRun(s, 'dwv15', T, W); addRun(s, 'dwv15', L, V); return s }
test('angle stops: two at a lav, one at a toilet, none at a tub or shower valve', () => {
  const s = bath(), b = bomPlumb(s, measure(s))
  assert.equal(b.find(x => x.key === 'stop').qty, 3)
  const sh = emptyScene(24); addNode(sh, 'shower', 0, 0)
  assert.ok(!bomPlumb(sh, measure(sh)).some(x => x.key === 'stop'))
})
test('sketch WSFU matches the core (IPC E103.3(2)) and prints without float noise', () => {
  const s = emptyScene(24); addNode(s, 'toilet', 0, 0); addNode(s, 'sink', 60, 0); addNode(s, 'tub', 120, 0)
  const msg = validatePlumb(s, measure(s)).find(c => c.msg.includes('WSFU')).msg
  assert.match(msg, /~5 WSFU/)
  const r = core({ polygon: [[0, 0], [40, 0], [40, 30], [0, 30]], toilets: 1, lavs: 0, tubs: 1, showers: 0, kitchen_sinks: 1, dishwashers: 0, washers: 0, water_heater: false, pipe_material: 'pex' })
  assert.ok(Math.abs(r.calc.wsfu - 5) < 1e-4)
})
test('1-1/2 in drain is priced as 1-1/2 in pipe, not 2 in', () => {
  const s = bath(), ev = evaluate(s, makePlumbTrade(), catalog, 'hd')
  assert.ok(ev.bom.some(x => x.key === 'dwv15'))
  assert.equal(ev.quote.lines.find(l => l.key === 'dwv15').unitPrice, catalog.dwv15.hd)
})
test('core: empty fixture list returns an error the page can show', () => {
  assert.match(core({ polygon: [[0, 0], [40, 0], [40, 30], [0, 30]], toilets: 0, lavs: 0, tubs: 0, showers: 0, kitchen_sinks: 0, dishwashers: 0, washers: 0, water_heater: false, pipe_material: 'pex' }).error, /at least one fixture/)
})
test('existing checks still hold: 12 DFU on a 2 in drain fails, toilet on 2 in fails', () => {
  const s = emptyScene(24), M = addNode(s, 'main', 0, 0), J = addNode(s, 'cleanout', 120, 0), V = addNode(s, 'vent', 120, -80); addRun(s, 'dwv2', M, J); addRun(s, 'dwv2', J, V)
  for (let i = 0; i < 4; i++) addRun(s, 'dwv3', addNode(s, 'toilet', 200, -120 + i * 60), J)
  assert.ok(validatePlumb(s, measure(s)).some(c => c.level === 'fail' && c.msg.includes('capacity')))
})
