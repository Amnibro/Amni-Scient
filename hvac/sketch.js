// Amni-Construct shared schematic-sketch engine.
// Trade-agnostic CORE: scene model + geometry/measure + BOM aggregation + quote.
// Each trade module supplies a config: { palette, runTypes, bom(scene,m), validate(scene,m) }.
// Pure functions (no DOM) so they are node-verifiable; the SVG canvas layer wraps these.

export const cents = v => (v = Number.isFinite(+v) ? +v : 0, Math.sign(v) * Math.round(+(Math.abs(v).toFixed(8) + 'e2')) / 100 || 0)
export const usd = (v, d = 2) => (+v < 0 ? '−$' : '$') + Math.abs(cents(v)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
export const validScene = s => !!(s && Array.isArray(s.nodes) && Array.isArray(s.runs) && s.nodes.every(n => n && typeof n.id === 'string' && Number.isFinite(+n.x) && Number.isFinite(+n.y)) && s.runs.every(r => r && typeof r.a === 'string' && typeof r.b === 'string'))
export function storeTotals(bom, price) {
  let th = 0, tl = 0, mh = 0, ml = 0
  const rows = (bom || []).map(it => { const ph = price(it.id ?? it.key, 'hd'), pl = price(it.id ?? it.key, 'lowes'), lh = ph != null ? cents(ph * it.qty) : null, ll = pl != null ? cents(pl * it.qty) : null; lh != null ? th = cents(th + lh) : mh++; ll != null ? tl = cents(tl + ll) : ml++; return { it, ph, pl, lh, ll } })
  return { rows, th, tl, mh, ml, best: (mh === ml ? th <= tl : !mh) ? 'hd' : 'lowes' }
}
const storeLink = (store, q) => q ? `<a href="${store === 'hd' ? 'https://www.homedepot.com/s/' : 'https://www.lowes.com/search?searchTerm='}${encodeURIComponent(q)}" target="_blank" rel="noopener" aria-label="Search ${store === 'hd' ? 'Home Depot' : 'Lowe\'s'}">↗</a>` : ''
export function matTableHTML(bom, price, catalog) {
  const t = storeTotals(bom, price), miss = n => n ? ` <span class="unpriced" style="font-size:11px;color:var(--warn);font-weight:400">${n} unpriced</span>` : ''
  const rows = t.rows.map(({ it, ph, pl, lh, ll }) => { const cat = (catalog || {})[it.id] || {}; return `<tr><td>${it.desc}</td><td>${it.qty}</td><td><input data-id="${it.id}" data-store="hd" inputmode="decimal" aria-label="Home Depot unit price" value="${ph ?? ''}"> ${storeLink('hd', cat.hdq)}</td><td>${lh != null ? usd(lh) : '—'}</td><td><input data-id="${it.id}" data-store="lowes" inputmode="decimal" aria-label="Lowe's unit price" value="${pl ?? ''}"> ${storeLink('lowes', cat.lq)}</td><td>${ll != null ? usd(ll) : '—'}</td></tr>` }).join('')
  return `<tr><th>Item</th><th>Qty</th><th>HD $</th><th>HD total</th><th>Lowe's $</th><th>Lowe's total</th></tr>${rows}<tr><td class="tot">TOTALS</td><td></td><td></td><td class="tot ${t.best === 'hd' ? 'best' : ''}">${usd(t.th)}${miss(t.mh)}</td><td></td><td class="tot ${t.best === 'lowes' ? 'best' : ''}">${usd(t.tl)}${miss(t.ml)}</td></tr>`
}
export function matCsv(bom, price) {
  const q = v => /[",\n]/.test('' + v) ? '"' + ('' + v).replace(/"/g, '""') + '"' : '' + v, t = storeTotals(bom, price), f = v => v != null ? v.toFixed(2) : ''
  return [['Item', 'Qty', 'HD each', 'HD total', "Lowe's each", "Lowe's total"], ...t.rows.map(({ it, ph, pl, lh, ll }) => [it.desc, it.qty, f(ph), f(lh), f(pl), f(ll)]), ['TOTAL', '', '', t.th.toFixed(2), '', t.tl.toFixed(2)]].map(r => r.map(q).join(',')).join('\n')
}
export const parseStorePrice = win => { const m = win.match(/\$\s?(\d{1,3}(?:,\d{3})+|\d{1,5})\.(\d{2})/); return m ? parseFloat(m[1].replace(/,/g, '') + '.' + m[2]) : null }
export function emptyScene(scalePxPerFt = 24) { return { nodes: [], runs: [], scalePxPerFt, seq: 1 } }
export function addNode(scene, type, x, y, props) { const id = 'n' + (scene.seq++); scene.nodes.push({ id, type, x, y, props: props || {} }); return id }
export function addRun(scene, type, a, b, waypoints) { const id = 'r' + (scene.seq++); scene.runs.push({ id, type, a, b, waypoints: waypoints || [] }); return id }
export function nodeById(scene, id) { return scene.nodes.find(n => n.id === id) }
export function removeNode(scene, id) { scene.nodes = scene.nodes.filter(n => n.id !== id); scene.runs = scene.runs.filter(r => r.a !== id && r.b !== id) }

// Orthogonal (right-angle, wall-hugging) route between a run's endpoints, in FLOOR FEET.
// Honors explicit waypoints; otherwise inserts one wall-biased elbow so pipes/wires move in
// axis-aligned increments instead of cutting diagonally across the room.
export function runPathFt(scene, run) {
  const A = nodeById(scene, run.a), B = nodeById(scene, run.b)
  if (!A || !B) return []
  const sp = scene.scalePxPerFt || 24
  const ff = n => (n.props && n.props.fx != null) ? [n.props.fx, n.props.fz] : [n.x / sp, n.y / sp]
  const a = ff(A), b = ff(B)
  const w = scene.floorCal ? scene.floorCal.w : 1e4, d = scene.floorCal ? scene.floorCal.d : 1e4
  const corner = (p, q) => {
    if (Math.abs(p[0] - q[0]) < 0.06 || Math.abs(p[1] - q[1]) < 0.06) return null
    const c1 = [q[0], p[1]], c2 = [p[0], q[1]], wd = (x, z) => Math.min(x, w - x, z, d - z)
    return wd(c1[0], c1[1]) <= wd(c2[0], c2[1]) ? c1 : c2
  }
  const wps = (run.waypoints || []).map(p => Array.isArray(p) ? [p[0] / sp, p[1] / sp] : (p.fx != null ? [p.fx, p.fz] : [p.x / sp, p.y / sp]))
  const path = [a]; let prev = a
  for (const q of wps.concat([b])) { const c = corner(prev, q); if (c) path.push(c); path.push(q); prev = q }
  return path
}
export function runPoints(run, scene) {
  const sp = scene.scalePxPerFt || 24
  return runPathFt(scene, run).map(p => [p[0] * sp, p[1] * sp])
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
  const pts = runPathFt(scene, run); let ft = 0
  for (let i = 1; i < pts.length; i++) ft += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return ft
}

// Quantitative summary the BOM + validation read from.
export function measure(scene) {
  const byRunType = {}, nodeCounts = {}, deg = {}
  for (const r of scene.runs) { byRunType[r.type] = (byRunType[r.type] || 0) + runLengthFt(r, scene); deg[r.a] = (deg[r.a] || 0) + 1; deg[r.b] = (deg[r.b] || 0) + 1 }
  for (const n of scene.nodes) nodeCounts[n.type] = (nodeCounts[n.type] || 0) + 1
  let elbows = 0, branches = 0
  for (const r of scene.runs) elbows += Math.max(0, runPathFt(scene, r).length - 2)
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
    const c = catalog[it.key] || {}, unit = Math.max(0, +c[store] || 0), cost = cents(unit * it.qty)
    total = cents(total + cost)
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

// Which endpoint of a run is "downstream" (flow points toward it): a sink-type node (drain main /
// panel / air handler) wins; otherwise the higher-degree (more trunk-like) node; else b. For flow arrows.
export function flowDownstream(run, scene, m, sinkTypes) {
  const a = nodeById(scene, run.a), b = nodeById(scene, run.b); if (!a || !b) return run.b
  const sink = sinkTypes || new Set(['main', 'panel', 'airhandler']), aS = sink.has(a.type), bS = sink.has(b.type)
  if (aS !== bS) return aS ? run.a : run.b
  const da = m.deg[run.a] || 0, db = m.deg[run.b] || 0
  return da !== db ? (da > db ? run.a : run.b) : run.b
}

// Buildable "real components / cut list": per run-type stock sticks/coils + the actual cut lengths,
// couplings, elbows (drawn bends + a drop per end fixture), tees (each junction beyond 2-way), and the
// placed fixtures — priced from the catalog where a SKU exists. Trade supplies `stock` (runType ->
// {len ft, key, ...}) + optional `fittings` labels/keys + `fixtures` price-key map. Estimates.
export function realComponents(scene, trade, catalog, store) {
  catalog = catalog || {}; store = store || 'hd'
  const m = measure(scene), stock = trade.stock || {}, fit = trade.fittings || {}, def = { elbow: 2.2, tee: 4.5, coupling: 1.6 }
  const price = (key, fb) => { const c = key && catalog[key]; return Math.max(0, (c && +c[store]) || fb || 0) }
  const items = [], runsByType = {}
  for (const r of scene.runs) (runsByType[r.type] = runsByType[r.type] || []).push(runLengthFt(r, scene))
  for (const type of Object.keys(m.byRunType)) {
    const rt = (trade.runTypes || []).find(z => z.type === type) || { label: type }, st = stock[type] || {}
    const stockLen = st.len || (/^(sup|nm|wire|pex|r1)/.test(type) ? 100 : 10)
    const lenFt = m.byRunType[type], sticks = Math.max(1, Math.ceil(lenFt / stockLen))
    const cuts = (runsByType[type] || []).map(x => Math.round(x * 10) / 10), each = price(st.key, st.est || (stockLen >= 100 ? 40 : 12))
    items.push({ qty: sticks, name: rt.label + ' · ' + stockLen + 'ft ' + (st.unitName || 'stock'), unit: stockLen >= 100 ? 'coil' : 'stick', each, cost: cents(each * sticks), note: Math.round(lenFt) + ' ft · cuts ' + cuts.map(c => c + "'").join(', ') })
    const coup = Math.max(0, sticks - (runsByType[type] || []).length)
    if (coup > 0) { const e = price(st.couplingKey || stock.fittingKey, def.coupling); items.push({ qty: coup, name: rt.label + ' coupling', unit: 'ea', each: e, cost: cents(e * coup) }) }
  }
  let leaves = 0, tees = 0
  for (const n of scene.nodes) { const d = m.deg[n.id] || 0; if (d === 1) leaves++; if (d > 2) tees += d - 2 }
  const elbows = m.elbows + leaves
  if (!trade.noFittings) {
    if (elbows > 0) { const e = price(fit.elbowKey || stock.fittingKey, def.elbow); items.push({ qty: elbows, name: fit.bend || 'Elbow (90°)', unit: 'ea', each: e, cost: cents(e * elbows), note: m.elbows + ' bend(s) + ' + leaves + ' end drop(s)' }) }
    if (tees > 0) { const e = price(fit.teeKey || stock.fittingKey, def.tee); items.push({ qty: tees, name: fit.branch || 'Tee / branch', unit: 'ea', each: e, cost: cents(e * tees) }) }
  }
  for (const type of Object.keys(m.nodeCounts)) {
    const p = (trade.palette || []).find(z => z.type === type), key = stock.fixtures && stock.fixtures[type], e = price(key, 0)
    items.push({ qty: m.nodeCounts[type], name: (p ? p.label : type), unit: 'ea', each: e, cost: cents(e * m.nodeCounts[type]), note: e ? '' : 'price varies' })
  }
  return { items, total: cents(items.reduce((s, it) => s + (it.cost || 0), 0)) }
}
