// Amni-Elec trade rules for the draw-it layout tool. Pure logic (node-testable).
import { neighbors, reachableFrom, runLengthFt } from './sketch.js'

export const ELEC_PALETTE = [
  { type: 'panel', label: 'Panel', glyph: '🔲', color: '#e8c33d', dims: [1.2, 2.6], shape: 'panel' },
  { type: 'recept', label: 'Outlet', glyph: '🔌', color: '#4f9cf0', dims: [0.4, 0.4], shape: 'marker' },
  { type: 'gfci', label: 'GFCI outlet', glyph: '🔌', color: '#5fbf6e', dims: [0.4, 0.4], shape: 'marker' },
  { type: 'switch', label: 'Switch', glyph: '🎚️', color: '#b58fd8', dims: [0.4, 0.4], shape: 'marker' },
  { type: 'light', label: 'Light', glyph: '💡', color: '#e0b341', dims: [1.0, 1.0], shape: 'round' },
  { type: 'dishwasher', label: 'Dishwasher', glyph: '🍽️', color: '#6ac0d8', dims: [2.0, 2.0], shape: 'square' },
  { type: 'microwave', label: 'Microwave', glyph: '🔳', color: '#6ac0d8', dims: [1.6, 1.1], shape: 'square' },
  { type: 'range', label: 'Range/Oven', glyph: '🍳', color: '#e07b4a', dims: [2.5, 2.5], shape: 'square' },
  { type: 'dryer', label: 'Dryer', glyph: '🌀', color: '#e07b4a', dims: [2.3, 2.3], shape: 'square' },
  { type: 'waterheater', label: 'Water heater', glyph: '♨️', color: '#e07b4a', dims: [1.7, 1.7], shape: 'round' },
  { type: 'hvac', label: 'AC / Heat', glyph: '❄️', color: '#e07b4a', dims: [2.5, 2.5], shape: 'square' },
]
export const ELEC_RUNTYPES = [
  { type: 'nm142', label: 'Wire 15A', color: '#d88b6a' },
  { type: 'nm122', label: 'Wire 20A', color: '#e0c341' },
  { type: 'nm103', label: 'Wire 30A', color: '#d8d36a' },
  { type: 'nm63', label: 'Wire 50A', color: '#e07b4a' },
]
const RUN = { nm142: { gauge: 14, amps: 15, v: 120, R: 3.14, roll: 250 }, nm122: { gauge: 12, amps: 20, v: 120, R: 1.98, roll: 250 }, nm103: { gauge: 10, amps: 30, v: 240, R: 1.24, roll: 25 }, nm63: { gauge: 6, amps: 50, v: 240, R: 0.491, roll: 25 } }
const DEV = { recept: { va: 180 }, gfci: { va: 180, isGfci: true }, light: { va: 100 }, switch: { va: 0 }, dishwasher: { va: 1500, ded: true }, microwave: { va: 1500, ded: true }, range: { va: 8000, ded: true }, dryer: { va: 5000, ded: true }, waterheater: { va: 4500, ded: true }, hvac: { va: 3600, ded: true }, panel: { va: 0 } }
const GFCI_ROOMS = new Set(['kitchen', 'bath', 'garage', 'outdoor', 'laundry', 'crawl'])
const AFCI_ROOMS = new Set(['bedroom', 'living', 'hall', 'dining'])
const ROOMS = ['general', 'kitchen', 'bath', 'bedroom', 'living', 'garage', 'outdoor', 'laundry', 'dining']
const ROOMED = new Set(['recept', 'gfci', 'light'])
const labelOf = n => (ELEC_PALETTE.find(p => p.type === n.type) || { label: n.type }).label

export function elecCircuits(scene) {
  const panel = scene.nodes.find(n => n.type === 'panel')
  const node = id => scene.nodes.find(n => n.id === id)
  if (!panel) return { panel: null, circuits: [] }
  const circuits = []
  for (const r of scene.runs) {
    let far = null; if (r.a === panel.id) far = r.b; else if (r.b === panel.id) far = r.a; else continue
    const seen = new Set([panel.id, far]), stack = [far], members = [far]
    while (stack.length) { const id = stack.pop(); for (const e of neighbors(scene, id)) if (!seen.has(e.to)) { seen.add(e.to); members.push(e.to); stack.push(e.to) } }
    const ms = new Set(members), runs = scene.runs.filter(x => x === r || (ms.has(x.a) && ms.has(x.b)))
    circuits.push({ homeRun: r, breaker: RUN[r.type] || RUN.nm142, members: members.map(node).filter(Boolean), runs })
  }
  return { panel, circuits }
}

export function validateElec(scene, m) {
  const checks = []
  const panel = scene.nodes.find(n => n.type === 'panel')
  if (!panel) { if (scene.nodes.length) checks.push({ level: 'warn', msg: 'No panel placed — add one and run circuits out from it' }); return checks }
  const reach = reachableFrom(scene, panel.id), orphans = scene.nodes.filter(n => !reach.has(n.id))
  if (orphans.length) checks.push({ level: 'fail', msg: orphans.length + ' device(s) not wired back to the panel' })
  const { circuits } = elecCircuits(scene)
  let ci = 0
  for (const c of circuits) {
    ci++; const tag = 'Circuit ' + ci + ' (' + c.breaker.amps + 'A/' + c.breaker.gauge + 'ga)'
    const devs = c.members.filter(n => n.type !== 'panel')
    const load = devs.reduce((s, n) => s + ((DEV[n.type] || {}).va || 0), 0)
    const budget = Math.round(c.breaker.amps * c.breaker.v * 0.8)
    checks.push(load <= budget ? { level: 'ok', msg: tag + ': ' + load + ' VA ≤ ' + budget + ' VA (80% rule) ✓ [NEC 210.20]' } : { level: 'fail', msg: tag + ': ' + load + ' VA exceeds the ' + budget + ' VA budget — split into more circuits [NEC 210.20(A)]' })
    const minAmp = Math.min(...c.runs.map(x => (RUN[x.type] || RUN.nm142).amps))
    if (minAmp < c.breaker.amps) checks.push({ level: 'fail', msg: tag + ': a branch wire is only rated ' + minAmp + 'A but the breaker is ' + c.breaker.amps + 'A — undersized wire on the circuit [NEC 240.4]' })
    const ded = devs.find(n => (DEV[n.type] || {}).ded)
    if (ded) { const others = devs.filter(n => n !== ded && ((DEV[n.type] || {}).va || 0) > 0); checks.push(others.length ? { level: 'fail', msg: tag + ': ' + labelOf(ded) + ' must be on its OWN dedicated circuit (sharing with ' + others.length + ' other device(s)) [NEC 210.23]' } : { level: 'ok', msg: tag + ': dedicated ' + labelOf(ded) + ' circuit ✓' }) }
    const wet = devs.filter(n => n.props && GFCI_ROOMS.has(n.props.room))
    if (wet.length) { const hasG = devs.some(n => (DEV[n.type] || {}).isGfci); const where = [...new Set(wet.map(n => n.props.room))].join('/'); checks.push(hasG ? { level: 'ok', msg: tag + ': GFCI protection present (' + where + ') ✓ [NEC 210.8]' } : { level: 'fail', msg: tag + ': GFCI required (' + where + ') — add a GFCI device or breaker [NEC 210.8]' }) }
    const af = devs.find(n => n.props && AFCI_ROOMS.has(n.props.room))
    if (af) checks.push({ level: 'warn', msg: tag + ': AFCI breaker required (' + af.props.room + ') [NEC 210.12]' })
    const ft = c.runs.reduce((s, x) => s + runLengthFt(x, scene), 0), I = load / c.breaker.v, vd = c.breaker.v ? 2 * I * (c.breaker.R / 1000) * ft / c.breaker.v * 100 : 0
    if (vd > 3) checks.push({ level: 'warn', msg: tag + ': ~' + vd.toFixed(1) + '% voltage drop over ' + Math.round(ft) + ' ft — upsize the wire or shorten the run (3% recommended) [NEC 210.19 IN]' })
  }
  if (!circuits.length && scene.nodes.length > 1) checks.push({ level: 'warn', msg: 'Nothing is wired from the panel yet' })
  return checks
}

export function bomElec(scene, m) {
  const o = [], ft = {}
  for (const r of scene.runs) { if (RUN[r.type]) ft[r.type] = (ft[r.type] || 0) + runLengthFt(r, scene) }
  for (const k in ft) o.push({ key: k, qty: Math.ceil(ft[k] / RUN[k].roll), unit: 'roll', note: Math.round(ft[k]) + ' ft' })
  const dev = (m.nodeCounts.recept || 0) + (m.nodeCounts.gfci || 0); if (dev) o.push({ key: 'recept', qty: dev, unit: 'ea' })
  if (m.nodeCounts.switch) o.push({ key: 'switch', qty: m.nodeCounts.switch, unit: 'ea' })
  if (m.nodeCounts.light) o.push({ key: 'fixture', qty: m.nodeCounts.light, unit: 'ea' })
  const { circuits } = elecCircuits(scene)
  let plain = 0, gf = 0, af = 0
  for (const c of circuits) { const devs = c.members.filter(n => n.type !== 'panel'); const hasG = devs.some(n => (DEV[n.type] || {}).isGfci); const needG = devs.some(n => n.props && GFCI_ROOMS.has(n.props.room)) && !hasG; const needA = devs.some(n => n.props && AFCI_ROOMS.has(n.props.room)); needA ? af++ : needG ? gf++ : plain++ }
  if (plain) o.push({ key: 'breaker', qty: plain, unit: 'ea' })
  if (af) o.push({ key: 'afci', qty: af, unit: 'ea' })
  if (gf) o.push({ key: 'gfci', qty: gf, unit: 'ea' })
  if (scene.nodes.some(n => n.type === 'panel')) o.push({ key: 'panel', qty: 1, unit: 'ea' })
  const boxes = scene.nodes.filter(n => n.type !== 'panel').length; if (boxes) o.push({ key: 'box', qty: boxes, unit: 'ea' })
  if (scene.runs.length) o.push({ key: 'misc', qty: 1, unit: 'lot' })
  return o
}

export function makeElecTrade() {
  return {
    name: 'elec', palette: ELEC_PALETTE, runTypes: ELEC_RUNTYPES, bom: bomElec, validate: validateElec,
    onNodeActivate: n => { if (!ROOMED.has(n.type)) return false; const i = ROOMS.indexOf((n.props && n.props.room) || 'general'); n.props.room = ROOMS[(i + 1) % ROOMS.length]; return true },
    nodeLabel: n => { const p = ELEC_PALETTE.find(z => z.type === n.type), lab = p ? p.label : n.type, r = n.props && n.props.room; return r && r !== 'general' ? lab + ' · ' + r : lab },
  }
}
