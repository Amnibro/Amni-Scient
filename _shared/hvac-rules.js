// Amni-HVAC trade rules for the draw-it layout tool. Pure logic (node-testable).
// Residential ductwork: air handler -> supply ducts -> registers; returns -> air handler.
import { runLengthFt } from './sketch.js'

export const HVAC_PALETTE = [
  { type: 'airhandler', label: 'Air Handler', glyph: 'AH', color: '#e07b4a' },
  { type: 'supply', label: 'Supply Reg', glyph: 'S', color: '#4f9cf0' },
  { type: 'return', label: 'Return Grille', glyph: 'R', color: '#5fbf6e' },
  { type: 'damper', label: 'Damper', glyph: 'D', color: '#c0a86a' },
]
export const HVAC_RUNTYPES = [
  { type: 's6', label: '6" supply', color: '#6ab0e0' },
  { type: 's8', label: '8" supply', color: '#4f9cf0' },
  { type: 's10', label: '10" supply', color: '#2a6ec2' },
  { type: 's12', label: '12" trunk', color: '#1a4e92' },
  { type: 'r8', label: '8" return', color: '#7fd08e' },
  { type: 'r10', label: '10" return', color: '#5fbf6e' },
  { type: 'r12', label: '12" return', color: '#3f9f4e' },
]
const DUCT_CFM = { s6: 110, s8: 200, s10: 400, s12: 600, r8: 200, r10: 400, r12: 600 }
const DUCT_DIAM = { s6: 6, s8: 8, s10: 10, s12: 12, r8: 8, r10: 10, r12: 12 }
const CFM_OPTS = [60, 80, 100, 120, 150, 200]
const TON_OPTS = [1.5, 2, 2.5, 3, 3.5, 4, 5]
const adjFor = (scene, re) => { const a = {}; for (const r of scene.runs) { if (!re.test(r.type)) continue; (a[r.a] = a[r.a] || []).push({ to: r.b, run: r }); (a[r.b] = a[r.b] || []).push({ to: r.a, run: r }) } return a }
const pathTo = (from, target, adj) => { const q = [[from, []]], seen = new Set([from]); while (q.length) { const [id, p] = q.shift(); if (id === target) return p; for (const e of (adj[id] || [])) if (!seen.has(e.to)) { seen.add(e.to); q.push([e.to, p.concat(e.run)]) } } return null }

export function validateHvac(scene, m) {
  const checks = []; if (!scene.nodes.length) return checks
  const ah = scene.nodes.find(n => n.type === 'airhandler')
  if (!ah) { checks.push({ level: 'fail', msg: 'No air handler / furnace placed — every system needs one [ACCA Manual D]' }); return checks }
  const supplies = scene.nodes.filter(n => n.type === 'supply'), returns = scene.nodes.filter(n => n.type === 'return')
  const sAdj = adjFor(scene, /^s/), rAdj = adjFor(scene, /^r/), runCFM = {}
  let totalSupply = 0, totalReturn = 0
  for (const reg of supplies) { const cfm = (reg.props && reg.props.cfm) || 100; totalSupply += cfm; const path = pathTo(reg.id, ah.id, sAdj); if (!path) checks.push({ level: 'fail', msg: 'A supply register is not ducted to the air handler [IRC M1601]' }); else for (const run of path) runCFM[run.id] = (runCFM[run.id] || 0) + cfm }
  for (const g of returns) { const cfm = (g.props && g.props.cfm) || 100; totalReturn += cfm; const path = pathTo(g.id, ah.id, rAdj); if (!path) checks.push({ level: 'fail', msg: 'A return grille is not ducted to the air handler [IRC M1602]' }); else for (const run of path) runCFM[run.id] = (runCFM[run.id] || 0) + cfm }
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

export function makeHvacTrade() {
  return {
    name: 'hvac', palette: HVAC_PALETTE, runTypes: HVAC_RUNTYPES, bom: bomHvac, validate: validateHvac,
    onNodeActivate: n => { if (n.type === 'airhandler') { const i = TON_OPTS.indexOf((n.props && n.props.tons) || 3); n.props.tons = TON_OPTS[(i + 1) % TON_OPTS.length]; return true } if (n.type === 'supply' || n.type === 'return') { const i = CFM_OPTS.indexOf((n.props && n.props.cfm) || 100); n.props.cfm = CFM_OPTS[(i + 1) % CFM_OPTS.length]; return true } return false },
    nodeLabel: n => { const p = HVAC_PALETTE.find(z => z.type === n.type), lab = p ? p.label : n.type; if (n.type === 'airhandler') return lab + ' · ' + ((n.props && n.props.tons) || 3) + ' ton'; if (n.type === 'supply' || n.type === 'return') return lab + ' · ' + ((n.props && n.props.cfm) || 100) + ' CFM'; return lab },
  }
}
