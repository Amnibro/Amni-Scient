// Amni-Plumb trade rules for the draw-it layout tool. Pure logic (node-testable).
import { runLengthFt } from './sketch.js'

export const PLUMB_PALETTE = [
  { type: 'toilet', label: 'Toilet', glyph: '🚽', color: '#5fbf6e', dims: [1.3, 2.3], shape: 'toilet', height: 1.3 },
  { type: 'lav', label: 'Bath sink', glyph: '🚰', color: '#4f9cf0', dims: [2.0, 1.7], shape: 'basin', height: 2.9 },
  { type: 'sink', label: 'Kitchen sink', glyph: '🍽️', color: '#4f9cf0', dims: [2.6, 2.0], shape: 'ksink', height: 3 },
  { type: 'shower', label: 'Shower', glyph: '🚿', color: '#b58fd8', dims: [3, 3], shape: 'shower', height: 6.8 },
  { type: 'tub', label: 'Bathtub', glyph: '🛁', color: '#b58fd8', dims: [2.5, 5], shape: 'tub', height: 1.9 },
  { type: 'washer', label: 'Washer', glyph: '🧺', color: '#e0b341', dims: [2.3, 2.3], shape: 'washer', height: 3.2 },
  { type: 'waterheater', label: 'Water heater', glyph: '♨️', color: '#e07b4a', dims: [1.7, 1.7], shape: 'round', height: 4.7 },
  { type: 'hosebibb', label: 'Outdoor faucet', glyph: '🚰', color: '#6ac0d8', dims: [0.6, 0.6], shape: 'marker' },
  { type: 'vent', label: 'Roof vent', glyph: '🌬️', color: '#6ac0d8', dims: [0.6, 0.6], shape: 'marker' },
  { type: 'main', label: 'Drain out', glyph: '🏠', color: '#8a8f98', dims: [0.8, 0.8], shape: 'marker' },
  { type: 'cleanout', label: 'Cleanout', glyph: '🔧', color: '#c0a86a', dims: [0.6, 0.6], shape: 'marker' },
]
export const PLUMB_RUNTYPES = [
  { type: 'sup12', label: 'Water ½"', color: '#4f9cf0' },
  { type: 'sup34', label: 'Water ¾"', color: '#2a6ec2' },
  { type: 'dwv15', label: 'Drain 1½"', color: '#9aa0aa' },
  { type: 'dwv2', label: 'Drain 2"', color: '#b6bcc6' },
  { type: 'dwv3', label: 'Drain 3"', color: '#c8a86a' },
  { type: 'dwv4', label: 'Drain 4"', color: '#e07b4a' },
]
const FIX = {
  lav: { dfu: 1, wsfu: 1, arm: 'dwv15', label: 'Lavatory' },
  sink: { dfu: 2, wsfu: 2, arm: 'dwv15', label: 'Kitchen sink' },
  toilet: { dfu: 3, wsfu: 3, arm: 'dwv3', label: 'Toilet', isWC: true },
  tub: { dfu: 2, wsfu: 2, arm: 'dwv15', label: 'Tub' },
  shower: { dfu: 2, wsfu: 2, arm: 'dwv2', label: 'Shower' },
  washer: { dfu: 2, wsfu: 2, arm: 'dwv2', label: 'Washer' },
  hosebibb: { dfu: 0, wsfu: 2.5, label: 'Hose bibb', supplyOnly: true },
  waterheater: { dfu: 0, wsfu: 0, label: 'Water heater', supplyOnly: true },
}
const DWV_CAP = { dwv15: 3, dwv2: 6, dwv3: 20, dwv4: 160 }
const TRAP_ARM = { dwv15: 6, dwv2: 8, dwv3: 12, dwv4: 16 }
const SIZE = { sup12: '½"', sup34: '¾"', dwv15: '1½"', dwv2: '2"', dwv3: '3"', dwv4: '4"' }
const sizeName = t => SIZE[t] || t
const dwvRuns = scene => scene.runs.filter(r => /^dwv/.test(r.type))
const dwvAdj = scene => { const a = {}; for (const r of dwvRuns(scene)) { (a[r.a] = a[r.a] || []).push({ to: r.b, run: r }); (a[r.b] = a[r.b] || []).push({ to: r.a, run: r }) } return a }

function pathToMain(scene, fixId, adj) {
  const mains = scene.nodes.filter(n => n.type === 'main').map(n => n.id); if (!mains.length) return null
  const q = [[fixId, []]], seen = new Set([fixId])
  while (q.length) { const [id, path] = q.shift(); if (mains.includes(id)) return path; for (const e of (adj[id] || [])) if (!seen.has(e.to)) { seen.add(e.to); q.push([e.to, path.concat(e.run)]) } }
  return null
}
function nearestVentDist(scene, fixId, adj) {
  const vents = scene.nodes.filter(n => n.type === 'vent').map(n => n.id); if (!vents.length) return Infinity
  const dist = { [fixId]: 0 }, pq = [[0, fixId]]
  while (pq.length) { pq.sort((a, b) => a[0] - b[0]); const [d, id] = pq.shift(); if (vents.includes(id)) return d; if (d > (dist[id] ?? Infinity)) continue; for (const e of (adj[id] || [])) { const nd = d + runLengthFt(e.run, scene); if (nd < (dist[e.to] ?? Infinity)) { dist[e.to] = nd; pq.push([nd, e.to]) } } }
  return Infinity
}

export function validatePlumb(scene, m) {
  const checks = []; if (!scene.nodes.length) return checks
  const adj = dwvAdj(scene)
  const fixtures = scene.nodes.filter(n => FIX[n.type] && !FIX[n.type].supplyOnly)
  const mains = scene.nodes.filter(n => n.type === 'main'), vents = scene.nodes.filter(n => n.type === 'vent'), cleanouts = scene.nodes.filter(n => n.type === 'cleanout')
  if (!mains.length) checks.push({ level: 'fail', msg: 'Add a "Drain out" — where everything exits to the sewer/septic [IPC 710]' })
  const runDFU = {}
  for (const f of fixtures) {
    const fd = FIX[f.type]
    if (!vents.length) checks.push({ level: 'fail', msg: fd.label + ': add a Roof vent + run a drain to it (so it doesn\'t gurgle or siphon dry) [IPC 909]' })
    else { const vd = nearestVentDist(scene, f.id, adj); if (vd === Infinity) checks.push({ level: 'fail', msg: fd.label + ': run a drain pipe to a Roof vent (un-vented = gurgles & siphons) [IPC 909]' }); else if (vd > (TRAP_ARM[fd.arm] || 6)) checks.push({ level: 'warn', msg: fd.label + ': vent is a bit far (' + vd.toFixed(1) + ' ft; max ' + (TRAP_ARM[fd.arm] || 6) + ' ft for ' + sizeName(fd.arm) + ') [IPC 906]' }); else checks.push({ level: 'ok', msg: fd.label + ': trapped + vented ✓' }) }
    if (mains.length) { const path = pathToMain(scene, f.id, adj); if (!path) checks.push({ level: 'fail', msg: fd.label + ': run a drain pipe to the "Drain out" [IPC 710]' }); else { for (const r of path) runDFU[r.id] = (runDFU[r.id] || 0) + fd.dfu; if (fd.isWC && path[0] && (path[0].type === 'dwv15' || path[0].type === 'dwv2')) checks.push({ level: 'fail', msg: 'Toilet on a ' + sizeName(path[0].type) + ' drain — a WC requires a 3" minimum [IPC 709]' }) } }
  }
  for (const r of dwvRuns(scene)) { const dfu = runDFU[r.id] || 0, cap = DWV_CAP[r.type] || 0; if (dfu > cap) checks.push({ level: 'fail', msg: sizeName(r.type) + ' drain carries ' + dfu + ' DFU — exceeds its ' + cap + '-DFU capacity, upsize it [IPC Table 710.1(2)]' }) }
  if (mains.length && dwvRuns(scene).length && !cleanouts.length) checks.push({ level: 'warn', msg: 'No cleanout placed — required at the building drain and on long/abrupt runs [IPC 708]' })
  const wsfu = scene.nodes.reduce((s, n) => s + ((FIX[n.type] || {}).wsfu || 0), 0)
  if (wsfu) checks.push({ level: 'ok', msg: 'Total supply demand ~' + wsfu + ' WSFU — size the meter/main accordingly [IPC App E]' })
  if (dwvRuns(scene).length) checks.push({ level: 'ok', msg: 'Slope drains ¼"/ft (3"+ may use ⅛"/ft) [IPC 704.1]' })
  return checks
}

export function bomPlumb(scene, m) {
  const o = [], ft = {}
  for (const r of scene.runs) ft[r.type] = (ft[r.type] || 0) + runLengthFt(r, scene)
  const supKey = { sup12: 'pex', sup34: 'pex34' }, dwvKey = { dwv15: 'vent', dwv2: 'vent', dwv3: 'dwv3', dwv4: 'dwv4' }
  for (const k in ft) { if (supKey[k]) o.push({ key: supKey[k], qty: Math.ceil(ft[k] / 100), unit: 'coil', note: Math.round(ft[k]) + ' ft' }); else if (dwvKey[k]) o.push({ key: dwvKey[k], qty: Math.ceil(ft[k] / 10), unit: '10ft', note: Math.round(ft[k]) + ' ft' }) }
  const fixtures = scene.nodes.filter(n => FIX[n.type] && !FIX[n.type].supplyOnly); if (fixtures.length) o.push({ key: 'trap', qty: fixtures.length, unit: 'ea' })
  const stops = scene.nodes.filter(n => FIX[n.type]).reduce((s, n) => s + (FIX[n.type].supplyOnly ? 1 : 2), 0); if (stops) o.push({ key: 'stop', qty: stops, unit: 'ea' })
  if (m.nodeCounts.waterheater) o.push({ key: 'heater', qty: m.nodeCounts.waterheater, unit: 'ea' })
  const fittings = (m.elbows || 0) + (m.branches || 0) + scene.runs.length; if (fittings) o.push({ key: 'fitting', qty: fittings, unit: 'ea' })
  if (m.nodeCounts.cleanout) o.push({ key: 'cleanout', qty: m.nodeCounts.cleanout, unit: 'ea' })
  if (m.nodeCounts.main) o.push({ key: 'mainvalve', qty: 1, unit: 'ea' })
  return o
}

export function makePlumbTrade() {
  return {
    name: 'plumb', palette: PLUMB_PALETTE, runTypes: PLUMB_RUNTYPES, bom: bomPlumb, validate: validatePlumb,
    trapTypes: ['lav', 'sink', 'shower', 'tub', 'washer'], ventTypes: ['vent'],
    stock: { sup12: { len: 100, key: 'pex', unitName: 'PEX coil' }, sup34: { len: 100, key: 'pex34', unitName: 'PEX coil' }, dwv15: { len: 10, key: 'vent', unitName: 'PVC stick' }, dwv2: { len: 10, key: 'vent', unitName: 'PVC stick' }, dwv3: { len: 10, key: 'dwv3', unitName: 'PVC stick' }, dwv4: { len: 10, key: 'dwv4', unitName: 'PVC stick' }, fittingKey: 'fitting', fixtures: { waterheater: 'heater', cleanout: 'cleanout' } },
    fittings: { bend: 'Elbow (90°)', branch: 'Tee / wye', elbowKey: 'fitting', teeKey: 'fitting' },
    nodeLabel: n => { const p = PLUMB_PALETTE.find(z => z.type === n.type); return p ? p.label : n.type },
  }
}
