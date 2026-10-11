import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { money, parsePrice, priceBom, bomCsv, csv, fitNum, sanitizeCfg, coreError, hvacSize, studSpec, studBom, sanitizeRooms, escXml, unXml, cents, rectHip } from '../_shared/est-math.js'
const root = fileURLToPath(new URL('..', import.meta.url))
const core = async t => { const { instance } = await WebAssembly.instantiate(readFileSync(`${root}${t}/${t}_core.wasm`), {}), { alloc, dealloc, build, memory } = instance.exports; return o => { const b = new TextEncoder().encode(JSON.stringify({ issue_date: '2026-10-07', ...o })), p = alloc(b.length); new Uint8Array(memory.buffer, p, b.length).set(b); const rp = build(p, b.length), len = new DataView(memory.buffer).getUint32(rp, true), r = JSON.parse(new TextDecoder().decode(new Uint8Array(memory.buffer, rp + 4, len))); dealloc(p, b.length); dealloc(rp, len + 4); return r } }
const rect = (w, d) => [[0, 0], [w, 0], [w, d], [0, d]]
const src = t => readFileSync(`${root}${t}/app.js`, 'utf8')
const cat = t => JSON.parse(readFileSync(`${root}${t}/catalog.json`, 'utf8'))
test('money shows thousands separators and cents', () => {
  assert.equal(money(1039.58), '$1,039.58')
  assert.equal(money(1234567.891), '$1,234,567.89')
  assert.equal(money(4599.5, 0), '$4,600')
  assert.equal(money(1.005), '$1.01')
  assert.equal(money(NaN), '—')
})
test('typed prices keep commas and dollar signs instead of collapsing to the first digit', () => {
  assert.equal(parseFloat('1,299.00'), 1)
  assert.equal(parsePrice('1,299.00'), 1299)
  assert.equal(parsePrice('$ 38.97'), 38.97)
  assert.equal(parsePrice(''), null)
  assert.equal(parsePrice('abc'), null)
  assert.equal(parsePrice('-5'), null)
  assert.equal(parsePrice('12.345'), 12.35)
})
test('totals are the sum of the rounded line totals shown', () => {
  const bom = [{ id: 'a', qty: 3 }, { id: 'b', qty: 7 }, { id: 'c', qty: 1 }], p = { a: 0.335, b: 1.115, c: null }
  const r = priceBom(bom, id => p[id])
  assert.equal(r.th, r.rows.reduce((s, x) => s + cents(x.lh ?? 0), 0) / 100)
  assert.equal(r.rows[2].lh, null)
  assert.equal(money(r.th), '$8.82')
  assert.equal((1.115 * 7).toFixed(2), '7.80')
  assert.equal(r.rows[1].lh, 7.81)
})
test('CSV export quotes descriptions that contain inch marks and commas', () => {
  const out = bomCsv([{ id: 'stud', desc: '2x4 stud (precut 92-5/8") - field, corners', qty: 178 }], () => 3.98)
  const lines = out.split('\r\n')
  assert.equal(lines[1], '"2x4 stud (precut 92-5/8"") - field, corners",178,3.98,708.44,3.98,708.44')
  assert.equal(lines[2], 'TOTAL,,,708.44,,708.44')
  assert.equal(csv([['Bed, master', 'bedroom', 12]]), '"Bed, master",bedroom,12')
})
test('number inputs clamp to their limits and an empty field keeps the last good value', () => {
  const lim = { min: '5', max: '60', step: '0.5' }
  assert.equal(fitNum('', lim, 24), 24)
  assert.equal(fitNum('0', lim, 24), 5)
  assert.equal(fitNum('9999', lim, 24), 60)
  assert.equal(fitNum('1.5', { min: '0', max: '20', step: '1' }, 2), 2)
  assert.equal(fitNum('abc', { min: '0', max: '20', step: '1' }, 3), 3)
})
test('a damaged saved design loads with defaults instead of breaking the estimator', () => {
  const def = { mode: 'rect', w: 12, d: 12, polygon: null, material: 'lvp', house_edge: 0, sheathing: true }
  const c = sanitizeCfg({ w: null, d: '14', material: 'marble', mode: 'poly', polygon: [[0, 0], [1, null]], house_edge: 7, sheathing: 'yes' }, def, { material: ['lvp', 'tile'], mode: ['rect', 'poly'] })
  assert.deepEqual(c, { mode: 'rect', w: 12, d: 14, polygon: null, material: 'lvp', house_edge: 0, sheathing: true })
  assert.deepEqual(sanitizeCfg('garbage', def), def)
  assert.equal(sanitizeCfg({ mode: 'poly', polygon: rect(10, 10), house_edge: 9 }, def).house_edge, -1)
})
test('core parse errors read as a plain message', () => {
  assert.match(coreError('invalid type: floating point `0.5`, expected u32 at line 1 column 152'), /empty or out of range/)
  assert.equal(coreError('room area is under 4 sq ft - check the outline/scale'), 'room area is under 4 sq ft - check the outline/scale')
})
test('floor: 12x12 LVP rounds boxes up and clamped box size never inflates the order', async () => {
  const f = await core('floor'), base = { polygon: rect(12, 12), material: 'lvp', pattern: 'straight', plank_w_in: 6, plank_l_in: 48, waste_pct: 0, doorways: 2 }
  const r = f({ ...base, box_sqft: 24 })
  assert.equal(r.calc.boxes, Math.ceil(144 * 1.08 / 24))
  assert.equal(f({ ...base, box_sqft: 0 }).calc.boxes, 156)
  assert.equal(f({ ...base, box_sqft: fitNum('0', { min: '5', max: '60', step: '0.5' }, 24) }).calc.boxes, Math.ceil(144 * 1.08 / 5))
  assert.match(f({ ...base, box_sqft: 24, doorways: 1.5 }).error, /expected u32/)
  assert.equal(f({ ...base, box_sqft: 24, doorways: fitNum('1.5', { min: '0', max: '12', step: '1' }, 2) }).calc.transitions, 2)
})
test('roof: 40x30 gable at 6:12 prices to the cent with separators', async () => {
  const f = await core('roof'), r = f({ polygon: rect(40, 30), pitch: 6, material: 'arch', roof_type: 'gable', overhang_in: 12 }), c = cat('roof')
  assert.ok(Math.abs(r.calc.slope_factor - Math.hypot(12, 6) / 12) < 1e-6)
  assert.ok(r.calc.bundles >= Math.ceil(r.calc.squares * 3))
  const pb = priceBom(r.bom, (id, s) => c[id]?.[s] ?? null)
  assert.equal(pb.th, r.bom.reduce((s, it) => s + cents(c[it.id].hd * it.qty), 0) / 100)
  assert.match(money(pb.th), /^\$\d{1,3}(,\d{3})*\.\d{2}$/)
})
test('frame: 10 ft walls call for 116-5/8 studs priced above the 8 ft precut', async () => {
  const f = await core('frame'), r = f({ polygon: rect(40, 30), wall_height_ft: 10, spacing: 16, stud_size: '2x4', doors: 2, windows: 6, double_top_plate: true, sheathing: true })
  assert.match(r.bom.find(b => b.id === 'stud').desc, /92-5\/8/)
  const fixed = studBom(r.bom, 10)
  assert.match(fixed.find(b => b.id === 'stud').desc, /precut 116-5\/8"/)
  assert.equal(studBom(r.bom, 8), r.bom)
  assert.ok(studSpec(10).f > 1.25 && studSpec(9).f > 1.12)
  assert.match(studBom(r.bom, 12).find(b => b.id === 'stud').desc, /14 ft, cut to length/)
})
test('frame: applying a traced outline reads the footprint key the core returns', async () => {
  const f = await core('frame'), r = f({ polygon: rect(40, 30), wall_height_ft: 8, spacing: 16, stud_size: '2x4', doors: 2, windows: 6, double_top_plate: true, sheathing: true })
  assert.equal(r.calc.area_ft2, undefined)
  assert.equal(r.calc.footprint_ft2, 1200)
  assert.ok(!/out\.calc\.area_ft2/.test(src('frame')))
})
test('plan: HVAC rollup tons and CFM agree', () => {
  assert.deepEqual(hvacSize(821), { tons: 1.5, cfm: 600 })
  assert.deepEqual(hvacSize(1600), { tons: 3, cfm: 1200 })
  assert.deepEqual(hvacSize(100), { tons: 1, cfm: 400 })
  assert.ok(!/Math\.round\(Math\.max\(1, c\.total_area/.test(src('plan')))
})
test('plan: room names are escaped before they reach the plan SVG', async () => {
  const f = await core('plan'), evil = '<img src=x onerror=alert(1)>'
  assert.ok(f({ rooms: [{ name: evil, kind: 'living', w: 12, d: 12 }] }).svgs.layout.includes('<img'))
  const r = f({ rooms: [{ name: escXml(evil), kind: 'living', w: 12, d: 12 }] })
  assert.ok(!r.svgs.layout.includes('<img'))
  assert.equal(unXml(r.rooms[0].name), evil)
})
test('plan: bad room sizes fall back instead of becoming NaN, and no catalog request is made', () => {
  const k = ['bedroom', 'other'], r = sanitizeRooms([{ name: 'A', kind: 'bedroom', w: null, d: '' }, { kind: 'pool', w: 500, d: 1 }, null], k, [])
  assert.deepEqual(r.map(x => [x.kind, x.w, x.d]), [['bedroom', 10, 10], ['other', 80, 3]])
  assert.ok(!/catalog\.json/.test(src('plan')))
})
test('roof: rectangular hip roofs count true hip length for ridge cap', async () => {
  const f = await core('roof'), r = f({ polygon: rect(40, 30), pitch: 6, material: 'arch', roof_type: 'hip', overhang_in: 12 })
  assert.ok(Math.abs(r.calc.hip_ft - 4 * 15 * Math.hypot(12, 6) / 12) < 0.01)
  assert.equal(r.bom.find(b => b.id === 'ridgecap').qty, 3)
  const x = rectHip(r, 40, 30)
  assert.ok(Math.abs(x.calc.hip_ft - 4 * Math.hypot(15, 15, 7.5)) < 1e-9)
  assert.equal(x.bom.find(b => b.id === 'ridgecap').qty, 4)
  assert.match(x.bom.find(b => b.id === 'ridgecap').desc, /\(100 lf\)/)
  assert.ok(x.warnings.some(w => /4 ridge\/hip cap bundles/.test(w)))
  assert.equal(rectHip(f({ polygon: rect(20, 20), pitch: 12, material: 'arch', roof_type: 'hip', overhang_in: 12 }), 20, 20).calc.hip_ft.toFixed(2), (4 * Math.hypot(10, 10, 10)).toFixed(2))
})
