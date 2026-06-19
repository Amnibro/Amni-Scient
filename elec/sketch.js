// Amni-Construct shared schematic-sketch engine.
// Trade-agnostic CORE: scene model + geometry/measure + BOM aggregation + quote.
// Each trade module supplies a config: { palette, runTypes, bom(scene,m), validate(scene,m) }.
// Pure functions (no DOM) so they are node-verifiable; the SVG canvas layer wraps these.

export function emptyScene(scalePxPerFt = 24) { return { nodes: [], runs: [], scalePxPerFt, seq: 1 } }
export function addNode(scene, type, x, y, props) { const id = 'n' + (scene.seq++); scene.nodes.push({ id, type, x, y, props: props || {} }); return id }
export function addRun(scene, type, a, b, waypoints) { const id = 'r' + (scene.seq++); scene.runs.push({ id, type, a, b, waypoints: waypoints || [] }); return id }
export function nodeById(scene, id) { return scene.nodes.find(n => n.id === id) }
export function removeNode(scene, id) { scene.nodes = scene.nodes.filter(n => n.id !== id); scene.runs = scene.runs.filter(r => r.a !== id && r.b !== id) }

export function runPoints(run, scene) {
  const a = nodeById(scene, run.a), b = nodeById(scene, run.b)
  if (!a || !b) return []
  return [[a.x, a.y], ...(run.waypoints || []), [b.x, b.y]]
}
// Snap a fixture (floor center fx,fz; footprint depth ft) to the nearest floor-rect wall edge of a
// W×D floor, flush against it, rotated to face INTO the room. Returns {fx,fz,rot} or null if no wall
// is within thresh. (x=0 right wall→rot270, x=W→90, z=0 left wall→0, z=D→180.)
export function snapToWall(fx, fz, depth, W, D, thresh) {
  const dL = fx, dR = W - fx, dN = fz, dF = D - fz, m = Math.min(dL, dR, dN, dF)
  if (m > thresh) return null
  const h = (depth || 0) / 2
  if (m === dL) return { fx: h, fz, rot: 270 }
  if (m === dR) return { fx: W - h, fz, rot: 90 }
  if (m === dN) return { fx, fz: h, rot: 0 }
  return { fx, fz: D - h, rot: 180 }
}
export function runLengthFt(run, scene) {
  const a = nodeById(scene, run.a), b = nodeById(scene, run.b)
  if (a && b && a.props && a.props.fx != null && b.props && b.props.fx != null) return Math.hypot(b.props.fx - a.props.fx, b.props.fz - a.props.fz)
  const pts = runPoints(run, scene); let px = 0
  for (let i = 1; i < pts.length; i++) px += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return px / (scene.scalePxPerFt || 24)
}

// Quantitative summary the BOM + validation read from.
export function measure(scene) {
  const byRunType = {}, nodeCounts = {}, deg = {}
  for (const r of scene.runs) { byRunType[r.type] = (byRunType[r.type] || 0) + runLengthFt(r, scene); deg[r.a] = (deg[r.a] || 0) + 1; deg[r.b] = (deg[r.b] || 0) + 1 }
  for (const n of scene.nodes) nodeCounts[n.type] = (nodeCounts[n.type] || 0) + 1
  let elbows = 0, branches = 0
  for (const r of scene.runs) elbows += (r.waypoints || []).length
  for (const n of scene.nodes) if ((deg[n.id] || 0) >= 3) branches++
  const totalRunFt = Object.values(byRunType).reduce((a, b) => a + b, 0)
  return { byRunType, nodeCounts, deg, elbows, branches, totalRunFt }
}

// Connectivity helpers for validation (reachability, components).
export function neighbors(scene, id) { const out = []; for (const r of scene.runs) { if (r.a === id) out.push({ to: r.b, run: r }); if (r.b === id) out.push({ to: r.a, run: r }) } return out }
export function reachableFrom(scene, startId) {
  const seen = new Set([startId]), stack = [startId]
  while (stack.length) { const id = stack.pop(); for (const e of neighbors(scene, id)) if (!seen.has(e.to)) { seen.add(e.to); stack.push(e.to) } }
  return seen
}

// BOM: trade.bom(scene, m) returns [{key, qty, unit?, note?}]; we price each from the catalog.
export function priceBOM(bom, catalog, store) {
  store = store || 'hd'; let total = 0
  const lines = bom.filter(it => it.qty > 0).map(it => {
    const c = catalog[it.key] || {}, unit = +c[store] || 0, cost = unit * it.qty
    total += cost
    return { key: it.key, name: c.name || it.key, qty: it.qty, unitName: it.unit || '', unitPrice: unit, cost, note: it.note || '' }
  })
  return { lines, total }
}

// Run the full pipeline for a trade config: measure -> bom -> price -> validate.
export function evaluate(scene, trade, catalog, store) {
  const m = measure(scene)
  const bom = trade.bom ? trade.bom(scene, m) : []
  const quote = priceBOM(bom, catalog || {}, store)
  const checks = trade.validate ? trade.validate(scene, m) : []
  return { measure: m, bom, quote, checks }
}
