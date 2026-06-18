// Amni-Plumb trade rules for the draw-it layout tool. Pure logic (node-testable).
import { runLengthFt } from './sketch.js'

export const PLUMB_PALETTE = [
  { type: 'main', label: 'Main/Sewer', glyph: '⌂', color: '#8a8f98' },
  { type: 'vent', label: 'Vent (VTR)', glyph: '↑', color: '#6ac0d8' },
  { type: 'cleanout', label: 'Cleanout', glyph: 'CO', color: '#c0a86a' },
  { type: 'lav', label: 'Lavatory', glyph: 'L', color: '#4f9cf0' },
  { type: 'sink', label: 'Kitchen Sink', glyph: 'KS', color: '#4f9cf0' },
  { type: 'toilet', label: 'Toilet', glyph: 'WC', color: '#5fbf6e' },
  { type: 'tub', label: 'Tub', glyph: 'T', color: '#b58fd8' },
  { type: 'shower', label: 'Shower', glyph: 'SH', color: '#b58fd8' },
  { type: 'washer', label: 'Washer', glyph: 'CW', color: '#e0b341' },
  { type: 'waterheater', label: 'Water Htr', glyph: 'WH', color: '#e07b4a' },
  { type: 'hosebibb', label: 'Hose Bibb', glyph: 'HB', color: '#6ac0d8' },
]
export const PLUMB_RUNTYPES = [
  { type: 'sup12', label: '½" supply', color: '#4f9cf0' },
  { type: 'sup34', label: '¾" supply', color: '#2a6ec2' },
  { type: 'dwv15', label: '1½" DWV', color: '#9aa0aa' },
  { type: 'dwv2', label: '2" DWV', color: '#b6bcc6' },
  { type: 'dwv3', label: '3" DWV', color: '#c8a86a' },
  { type: 'dwv4', label: '4" DWV', color: '#e07b4a' },
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
  if (!mains.length) checks.push({ level: 'fail', msg: 'No building drain / sewer connection (Main) placed [IPC 710]' })
  const runDFU = {}
  for (const f of fixtures) {
    const fd = FIX[f.type]
    if (!vents.length) checks.push({ level: 'fail', msg: fd.label + ': no vent placed — every trap needs a vent or it self-siphons (S-trap) [IPC 909]' })
    else { const vd = nearestVentDist(scene, f.id, adj); if (vd === Infinity) checks.push({ level: 'fail', msg: fd.label + ': no vent path — unvented trap (S-trap) [IPC 909]' }); else if (vd > (TRAP_ARM[fd.arm] || 6)) checks.push({ level: 'warn', msg: fd.label + ': trap arm ' + vd.toFixed(1) + ' ft exceeds ' + (TRAP_ARM[fd.arm] || 6) + ' ft max for ' + sizeName(fd.arm) + ' [IPC 906]' }); else checks.push({ level: 'ok', msg: fd.label + ': trapped + vented ✓' }) }
    if (mains.length) { const path = pathToMain(scene, f.id, adj); if (!path) checks.push({ level: 'fail', msg: fd.label + ': not draining to the building main [IPC 710]' }); else { for (const r of path) runDFU[r.id] = (runDFU[r.id] || 0) + fd.dfu; if (fd.isWC && path[0] && (path[0].type === 'dwv15' || path[0].type === 'dwv2')) checks.push({ level: 'fail', msg: 'Toilet on a ' + sizeName(path[0].type) + ' drain — a WC requires a 3" minimum [IPC 709]' }) } }
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
  return { name: 'plumb', palette: PLUMB_PALETTE, runTypes: PLUMB_RUNTYPES, bom: bomPlumb, validate: validatePlumb, nodeLabel: n => { const p = PLUMB_PALETTE.find(z => z.type === n.type); return p ? p.label : n.type } }
}
