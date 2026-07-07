// Amni-HVAC trade rules for the draw-it layout tool. Pure logic (node-testable).
// Residential ductwork: air handler -> supply ducts -> registers; returns -> air handler.
import { runLengthFt, addNode, addRun } from './sketch.js'

export const HVAC_PALETTE = [
  { type: 'airhandler', label: 'Air Handler', glyph: '🌡️', color: '#e07b4a', dims: [2.2, 2.6], shape: 'square', height: 4.5 },
  { type: 'supply', label: 'Supply vent', glyph: '💨', color: '#4f9cf0', dims: [0.5, 1.0], shape: 'square', height: 0.3 },
  { type: 'return', label: 'Return grille', glyph: '↩️', color: '#5fbf6e', dims: [1.7, 1.7], shape: 'square', height: 0.3 },
  { type: 'damper', label: 'Damper', glyph: '🎛️', color: '#c0a86a', dims: [0.6, 0.6], shape: 'marker' },
]
export const HVAC_RUNTYPES = [
  { type: 's6', label: '6" duct', color: '#6ab0e0' },
  { type: 's8', label: '8" duct', color: '#4f9cf0' },
  { type: 's10', label: '10" duct', color: '#2a6ec2' },
  { type: 's12', label: '12" trunk', color: '#1a4e92' },
  { type: 'r8', label: '8" return', color: '#7fd08e' },
  { type: 'r10', label: '10" return', color: '#5fbf6e' },
  { type: 'r12', label: '12" return', color: '#3f9f4e' },
]
const DUCT_CFM = { s6: 110, s8: 200, s10: 400, s12: 600, r8: 200, r10: 400, r12: 600 }
const DUCT_DIAM = { s6: 6, s8: 8, s10: 10, s12: 12, r8: 8, r10: 10, r12: 12 }
const CFM_OPTS = [60, 80, 100, 120, 150, 200]
const RET_OPTS = [100, 150, 200, 300, 400, 600]
const TON_OPTS = [1.5, 2, 2.5, 3, 3.5, 4, 5]
const adjFor = (scene, re) => { const a = {}; for (const r of scene.runs) { if (!re.test(r.type)) continue; (a[r.a] = a[r.a] || []).push({ to: r.b, run: r }); (a[r.b] = a[r.b] || []).push({ to: r.a, run: r }) } return a }
const pathTo = (from, target, adj) => { const q = [[from, []]], seen = new Set([from]); while (q.length) { const [id, p] = q.shift(); if (id === target) return p; for (const e of (adj[id] || [])) if (!seen.has(e.to)) { seen.add(e.to); q.push([e.to, p.concat(e.run)]) } } return null }

export function hvacAirflow(scene) {
  const ah = scene.nodes.find(n => n.type === 'airhandler')
  const out = { ah, runCFM: {}, totalSupply: 0, totalReturn: 0, unducted: [] }
  if (!ah) return out
  const sAdj = adjFor(scene, /^s/), rAdj = adjFor(scene, /^r/)
  for (const reg of scene.nodes.filter(n => n.type === 'supply')) { const cfm = (reg.props && reg.props.cfm) || 100; out.totalSupply += cfm; const path = pathTo(reg.id, ah.id, sAdj); if (!path) out.unducted.push(['supply', reg]); else for (const run of path) out.runCFM[run.id] = (out.runCFM[run.id] || 0) + cfm }
  for (const g of scene.nodes.filter(n => n.type === 'return')) { const cfm = (g.props && g.props.cfm) || 100; out.totalReturn += cfm; const path = pathTo(g.id, ah.id, rAdj); if (!path) out.unducted.push(['return', g]); else for (const run of path) out.runCFM[run.id] = (out.runCFM[run.id] || 0) + cfm }
  return out
}
export function validateHvac(scene, m) {
  const checks = []; if (!scene.nodes.length) return checks
  const af = hvacAirflow(scene), ah = af.ah
  if (!ah) { checks.push({ level: 'fail', msg: 'No air handler / furnace placed — every system needs one [ACCA Manual D]' }); return checks }
  const supplies = scene.nodes.filter(n => n.type === 'supply'), returns = scene.nodes.filter(n => n.type === 'return')
  const runCFM = af.runCFM, totalSupply = af.totalSupply, totalReturn = af.totalReturn
  for (const [kind] of af.unducted) checks.push({ level: 'fail', msg: kind === 'supply' ? 'A supply register is not ducted to the air handler [IRC M1601]' : 'A return grille is not ducted to the air handler [IRC M1602]' })
  for (const run of scene.runs) { const cap = DUCT_CFM[run.type]; if (!cap) continue; const cfm = runCFM[run.id] || 0; if (cfm > cap) checks.push({ level: 'fail', msg: DUCT_DIAM[run.type] + '" duct carrying ' + cfm + ' CFM exceeds its ~' + cap + ' CFM capacity — upsize it [ACCA Manual D]' }) }
  const tons = (ah.props && ah.props.tons) || 3, target = 400 * tons
  if (totalSupply) { const dev = Math.abs(totalSupply - target) / target; checks.push(dev > 0.15 ? { level: 'warn', msg: 'Supply ~' + totalSupply + ' CFM vs ~' + target + ' CFM for a ' + tons + '-ton unit (≈400 CFM/ton) [ACCA Manual J/S]' } : { level: 'ok', msg: 'Supply ' + totalSupply + ' CFM ≈ ' + tons + '-ton airflow ✓' }) }
  if (!returns.length) checks.push({ level: 'fail', msg: 'No return air placed — the system needs a return path [IRC M1602]' })
  else if (totalReturn < totalSupply * 0.8) checks.push({ level: 'warn', msg: 'Return ~' + totalReturn + ' CFM is under supply ~' + totalSupply + ' CFM — add/upsize returns or it starves airflow [ACCA Manual D]' })
  else checks.push({ level: 'ok', msg: 'Return ' + totalReturn + ' CFM balances supply ✓' })
  if (supplies.length) checks.push({ level: 'ok', msg: supplies.length + ' supply register(s), ' + returns.length + ' return(s)' })
  return checks
}

export function bomHvac(scene, m) {
  const o = [], ft = {}, ductKey = { 6: 'duct6', 8: 'duct8', 10: 'duct10', 12: 'duct12' }, byDiam = {}
  for (const r of scene.runs) ft[r.type] = (ft[r.type] || 0) + runLengthFt(r, scene)
  for (const k in ft) { const d = DUCT_DIAM[k]; if (d) byDiam[d] = (byDiam[d] || 0) + ft[k] }
  for (const d in byDiam) o.push({ key: ductKey[d] || 'duct8', qty: Math.ceil(byDiam[d] / 25), unit: 'box', note: Math.round(byDiam[d]) + ' ft' })
  if (m.nodeCounts.supply) o.push({ key: 'register', qty: m.nodeCounts.supply, unit: 'ea' })
  if (m.nodeCounts.return) o.push({ key: 'grille', qty: m.nodeCounts.return, unit: 'ea' })
  const boots = (m.nodeCounts.supply || 0) + (m.nodeCounts.return || 0); if (boots) o.push({ key: 'boot', qty: boots, unit: 'ea' })
  if (m.nodeCounts.damper) o.push({ key: 'damper', qty: m.nodeCounts.damper, unit: 'ea' })
  if (m.nodeCounts.airhandler) o.push({ key: 'ahu', qty: 1, unit: 'ea' })
  if (scene.runs.length) o.push({ key: 'misc', qty: 1, unit: 'lot' })
  return o
}

export function hvacRunBadges(scene) {
  const af = hvacAirflow(scene), out = {}
  for (const r of scene.runs) { const cap = DUCT_CFM[r.type]; if (!cap) continue; const cfm = af.runCFM[r.id] || 0; if (cfm > 0) out[r.id] = { txt: cfm + ' CFM', warn: cfm > cap } }
  return out
}
const TPH = sc => { const sp = sc.scalePxPerFt || 24; return (type, fx, fz, props) => addNode(sc, type, fx * sp, fz * sp, { fx, fz, rot: 0, ...(props || {}) }) }
export const HVAC_TEMPLATES = [
  { name: '🏠 3-ton trunk & branch — 8 supplies, 2 returns', build(sc) { sc.floorCal = sc.floorCal || { w: 16, d: 12 }; const P = TPH(sc); const ah = P('airhandler', 8, 10, { tons: 3 }); const dL = P('damper', 4.5, 6.5), dR = P('damper', 11.5, 6.5); addRun(sc, 's12', ah, dL); addRun(sc, 's12', ah, dR); const L = [[1.5, 1.2], [4, 0.8], [6.5, 1.2], [2.5, 4]], R = [[9.5, 1.2], [12, 0.8], [14.5, 1.2], [13.5, 4]]; for (const [x, z] of L) addRun(sc, 's8', dL, P('supply', x, z, { cfm: 150 })); for (const [x, z] of R) addRun(sc, 's8', dR, P('supply', x, z, { cfm: 150 })); addRun(sc, 'r12', ah, P('return', 4.5, 10.5, { cfm: 600 })); addRun(sc, 'r12', ah, P('return', 12, 10.5, { cfm: 600 })) } },
  { name: '🏢 2-ton apartment — star, 5 supplies, 1 return', build(sc) { sc.floorCal = sc.floorCal || { w: 13, d: 10 }; const P = TPH(sc); const ah = P('airhandler', 6.5, 8.5, { tons: 2 }); const S = [[1.5, 1], [4.5, 0.8], [7.5, 0.8], [10.5, 1], [11.8, 4.5]]; for (const [x, z] of S) addRun(sc, 's8', ah, P('supply', x, z, { cfm: 150 })); addRun(sc, 'r12', ah, P('return', 3, 8.8, { cfm: 600 })) } },
]
export function makeHvacTrade() {
  return {
    name: 'hvac', palette: HVAC_PALETTE, runTypes: HVAC_RUNTYPES, bom: bomHvac, validate: validateHvac, runBadges: hvacRunBadges, templates: HVAC_TEMPLATES,
    stock: { s6: { len: 25, key: 'duct6', unitName: 'flex/pipe' }, s8: { len: 25, key: 'duct8', unitName: 'flex/pipe' }, s10: { len: 25, key: 'duct10', unitName: 'flex/pipe' }, s12: { len: 4, key: 'duct12', unitName: 'trunk' }, r8: { len: 25, key: 'duct8', unitName: 'return flex' }, r10: { len: 25, key: 'duct10', unitName: 'return flex' }, r12: { len: 4, key: 'duct12', unitName: 'return trunk' }, fittingKey: 'boot', fixtures: { airhandler: 'ahu', supply: 'register', return: 'grille' } },
    fittings: { bend: 'Elbow / take-off', branch: 'Wye / branch', elbowKey: 'boot', teeKey: 'boot' },
    onNodeActivate: n => { if (n.type === 'airhandler') { const i = TON_OPTS.indexOf((n.props && n.props.tons) || 3); n.props.tons = TON_OPTS[(i + 1) % TON_OPTS.length]; return true } if (n.type === 'supply') { const i = CFM_OPTS.indexOf((n.props && n.props.cfm) || 100); n.props.cfm = CFM_OPTS[(i + 1) % CFM_OPTS.length]; return true } if (n.type === 'return') { const i = RET_OPTS.indexOf((n.props && n.props.cfm) || 100); n.props.cfm = RET_OPTS[(i + 1) % RET_OPTS.length]; return true } return false },
    props: n => n.type === 'airhandler' ? [{ key: 'tons', label: 'capacity', def: 3, num: 1, opts: TON_OPTS.map(t => [t, t + ' ton']) }] : n.type === 'supply' ? [{ key: 'cfm', label: 'CFM', def: 100, num: 1, opts: CFM_OPTS.map(c => [c, c + ' CFM']) }] : n.type === 'return' ? [{ key: 'cfm', label: 'CFM', def: 100, num: 1, opts: RET_OPTS.map(c => [c, c + ' CFM']) }] : null,
    nodeLabel: n => { const p = HVAC_PALETTE.find(z => z.type === n.type), lab = p ? p.label : n.type; if (n.type === 'airhandler') return lab + ' · ' + ((n.props && n.props.tons) || 3) + ' ton'; if (n.type === 'supply' || n.type === 'return') return lab + ' · ' + ((n.props && n.props.cfm) || 100) + ' CFM'; return lab },
  }
}
