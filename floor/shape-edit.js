const SVGNS = 'http://www.w3.org/2000/svg'
const el = (t, a) => { const e = document.createElementNS(SVGNS, t); for (const k in (a || {})) e.setAttribute(k, a[k]); return e }
const snap = v => Math.round(v * 2) / 2
const area = V => Math.abs(V.reduce((s, p, i) => { const q = V[(i + 1) % V.length]; return s + (p[0] * q[1] - q[0] * p[1]) }, 0)) / 2
const perim = V => V.reduce((s, p, i) => { const q = V[(i + 1) % V.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]) }, 0)
const longest = V => { let bi = 0, bl = -1; V.forEach((p, i) => { const q = V[(i + 1) % V.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > bl) { bl = l; bi = i } }); return bi }
const collinearClean = (P, he) => { let pts = P.map(p => [+p[0], +p[1]]), h = typeof he === 'number' && he >= 0 ? he : -1, hit = true; while (hit && pts.length > 3) { hit = false; for (let i = 0; i < pts.length && pts.length > 3; i++) { const n = pts.length; if (h >= 0 && (i === h || i === (h + 1) % n)) continue; const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n], vx = c[0] - a[0], vy = c[1] - a[1], L = Math.hypot(vx, vy); if (L && Math.abs(vx * (b[1] - a[1]) - vy * (b[0] - a[0])) / L < 0.02) { pts.splice(i, 1); h > i && h--; hit = true; i-- } } } return { pts, he: h } }
const preset = (kind, w, d) => kind === 'rect' ? [[0, 0], [w, 0], [w, d], [0, d]]
  : kind === 'l' ? [[0, 0], [w, 0], [w, d * 0.55], [w * 0.5, d * 0.55], [w * 0.5, d], [0, d]]
  : kind === 't' ? [[0, 0], [w, 0], [w, d * 0.4], [w * 0.68, d * 0.4], [w * 0.68, d], [w * 0.32, d], [w * 0.32, d * 0.4], [0, d * 0.4]]
  : [[0, 0], [w, 0], [w, d], [w * 0.66, d], [w * 0.66, d * 0.34], [w * 0.34, d * 0.34], [w * 0.34, d], [0, d]]
export function mountShapeEditor(host, opts) {
  const o = opts || {}, seedW = Math.max(4, +o.rect?.w || 16), seedD = Math.max(4, +o.rect?.d || 12)
  const cc0 = (o.polygon && o.polygon.length >= 3) ? collinearClean(o.polygon, o.houseEdge != null ? +o.houseEdge : -1) : null
  let V = cc0 ? cc0.pts : preset('rect', seedW, seedD)
  let sel = -1, drag = -1, house = cc0 ? (cc0.he >= 0 ? cc0.he : longest(V)) : (o.houseEdge != null ? +o.houseEdge : longest(V))
  host.innerHTML = ''
  const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;height:100%;min-height:0;background:#0f1217'
  const bar = document.createElement('div'); bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #272c35;font:13px system-ui,sans-serif;color:#e8e6e0'
  const svg = el('svg', { style: 'flex:1;min-height:0;width:100%;touch-action:none;display:block;background:#12161d' })
  wrap.append(bar, svg); host.append(wrap)
  const mkbtn = (label, fn, accent) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = `padding:6px 11px;border-radius:8px;cursor:pointer;border:1px solid ${accent ? '#d8893a' : '#2f3540'};background:${accent ? '#d8893a' : '#1a1e25'};color:${accent ? '#111' : '#cdd3da'};font:600 13px system-ui,sans-serif`; b.onclick = fn; return b }
  const label = txt => { const s = document.createElement('span'); s.style.cssText = 'color:#9aa0aa'; s.textContent = txt; return s }
  const presets = document.createElement('div'); presets.style.cssText = 'display:flex;gap:5px'
  ;['rect', 'l', 't', 'u'].forEach(k => presets.append(mkbtn(k === 'rect' ? '▭' : k.toUpperCase(), () => { const b = bounds(); V = preset(k, Math.max(6, b.w || seedW), Math.max(6, b.d || seedD)); sel = -1; house = longest(V); fit(); redraw() })))
  const readout = document.createElement('span'); readout.style.cssText = 'color:#cdd3da;font-weight:600'
  const edn = document.createElement('span'); edn.style.cssText = 'display:none;align-items:center;gap:5px'
  const edin = document.createElement('input'); edin.type = 'number'; edin.step = '0.5'; edin.min = '0.5'; edin.style.cssText = 'width:66px;background:#0f1217;color:#e8e6e0;border:1px solid #2f3540;border-radius:6px;padding:5px 7px'
  edin.onchange = () => { if (sel < 0) return; const L = Math.max(0.5, +edin.value || 0), A = V[sel], B = V[(sel + 1) % V.length]; let dx = B[0] - A[0], dz = B[1] - A[1], m = Math.hypot(dx, dz) || 1; V[(sel + 1) % V.length] = [snap(A[0] + dx / m * L), snap(A[1] + dz / m * L)]; house = house; redraw() }
  edn.append(label('edge'), edin, label('ft'))
  const applyB = mkbtn('✓ Use this shape', () => { const cc = collinearClean(V, house); V = cc.pts; house = cc.he >= 0 ? cc.he : longest(V); const min = bounds(); const P = V.map(p => [+(p[0] - min.x0).toFixed(2), +(p[1] - min.z0).toFixed(2)]); redraw(); o.onApply && o.onApply({ polygon: P, houseEdge: house }) }, true)
  bar.append(label('Preset'), presets, mkbtn('Fit', () => { fit(); redraw() }), edn, readout, applyB)
  let s = 10, cx = 0, cz = 0, W = 0, H = 0
  const bounds = () => { const xs = V.map(p => p[0]), zs = V.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs); return { x0, x1, z0, z1, w: x1 - x0, d: z1 - z0 } }
  const px = (fx, fz) => [W / 2 + (fx - cx) * s, H / 2 - (fz - cz) * s]
  const ft = (X, Y) => [cx + (X - W / 2) / s, cz - (Y - H / 2) / s]
  const fit = () => { W = svg.clientWidth || 600; H = svg.clientHeight || 400; const b = bounds(); cx = (b.x0 + b.x1) / 2; cz = (b.z0 + b.z1) / 2; const spanX = Math.max(4, b.w) * 1.35, spanZ = Math.max(4, b.d) * 1.35; s = Math.min((W - 20) / spanX, (H - 20) / spanZ) }
  const evFt = e => { const r = svg.getBoundingClientRect(); return ft(e.clientX - r.left, e.clientY - r.top) }
  function redraw() {
    W = svg.clientWidth || W; H = svg.clientHeight || H; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); while (svg.firstChild) svg.removeChild(svg.firstChild)
    const defs = el('defs'), grad = el('linearGradient', { id: 'shpfill', x1: 0, y1: 0, x2: 0, y2: 1 })
    grad.append(el('stop', { offset: 0, 'stop-color': '#eaa858', 'stop-opacity': 0.24 }), el('stop', { offset: 1, 'stop-color': '#d8893a', 'stop-opacity': 0.09 }))
    defs.append(grad); svg.append(defs)
    const c0 = ft(0, H), c1 = ft(W, 0), step = s < 9 ? 5 : s < 18 ? 2 : 1, major = step * 5
    const gl = (a, b, col, wd) => svg.append(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col, 'stroke-width': wd }))
    for (let x = Math.floor(c0[0] / step) * step; x <= c1[0]; x += step) { const o0 = Math.abs(x) < 1e-6, om = Math.abs(x % major) < 1e-6; gl(px(x, c0[1]), px(x, c1[1]), o0 ? '#313b48' : om ? '#232b35' : '#191e27', o0 ? 1.6 : om ? 0.9 : 0.5) }
    for (let z = Math.floor(c0[1] / step) * step; z <= c1[1]; z += step) { const o0 = Math.abs(z) < 1e-6, om = Math.abs(z % major) < 1e-6; gl(px(c0[0], z), px(c1[0], z), o0 ? '#313b48' : om ? '#232b35' : '#191e27', o0 ? 1.6 : om ? 0.9 : 0.5) }
    const pts = V.map(p => px(p[0], p[1]))
    svg.append(el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: 'url(#shpfill)', stroke: '#eaa858', 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }))
    V.forEach((p, i) => {
      const q = V[(i + 1) % V.length], a = pts[i], b = pts[(i + 1) % V.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = Math.hypot(q[0] - p[0], q[1] - p[1])
      if (i === house) svg.append(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#4f9cf0', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.92 }))
      const line = el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: i === sel ? '#e0b341' : 'transparent', 'stroke-width': 10, 'stroke-linecap': 'round', style: 'cursor:pointer', opacity: i === sel ? 0.85 : 0.01 })
      line.onpointerup = ev => { if (moved) return; ev.stopPropagation(); sel = sel === i ? -1 : i; syncEdge(); redraw() }
      svg.append(line)
      const t = el('text', { x: mx, y: my - 7, fill: i === house ? '#a9d0ff' : '#e8e6e0', stroke: '#0d1016', 'stroke-width': 3.4, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'font-size': 12, 'font-family': 'system-ui', 'text-anchor': 'middle', style: 'pointer-events:none;font-weight:700' }); t.textContent = (i === house ? '🏠 ' : '') + len.toFixed(1) + "'"; svg.append(t)
      const add = el('circle', { cx: mx, cy: my, r: 6, fill: '#12161d', stroke: '#4a5361', 'stroke-width': 1.4, style: 'cursor:copy', opacity: 0.92 })
      add.onpointerdown = ev => { ev.stopPropagation(); ev.preventDefault(); const f = evFt(ev); V.splice(i + 1, 0, [snap(f[0]), snap(f[1])]); if (house > i) house++; drag = i + 1; sel = -1; syncEdge(); redraw() }
      const plus = el('text', { x: mx, y: my + 3.8, fill: '#8b95a3', 'font-size': 12, 'text-anchor': 'middle', style: 'pointer-events:none' }); plus.textContent = '+'; svg.append(add, plus)
    })
    pts.forEach((a, i) => {
      svg.append(el('circle', { cx: a[0], cy: a[1], r: 12, fill: '#eaa858', opacity: drag === i ? 0.3 : 0.15, style: 'pointer-events:none' }))
      const h = el('circle', { cx: a[0], cy: a[1], r: 7, fill: drag === i ? '#f4bd73' : '#eaa858', stroke: '#fff', 'stroke-width': 2, style: 'cursor:grab' })
      h.onpointerdown = ev => { ev.stopPropagation(); ev.preventDefault(); drag = i; moved = false; svg.setPointerCapture(ev.pointerId) }
      h.ondblclick = ev => { ev.stopPropagation(); if (V.length > 3) { V.splice(i, 1); if (house >= V.length) house = 0; sel = -1; syncEdge(); redraw() } }
      svg.append(h)
    })
    const bb = bounds()
    readout.textContent = `${area(V).toFixed(0)} ft²  ·  ${bb.w.toFixed(0)}×${bb.d.toFixed(0)} ft  ·  ${perim(V).toFixed(0)} ft perim`
  }
  let moved = false
  const syncEdge = () => { if (sel < 0) { edn.style.display = 'none'; return } edn.style.display = 'flex'; const A = V[sel], B = V[(sel + 1) % V.length]; edin.value = Math.hypot(B[0] - A[0], B[1] - A[1]).toFixed(1) }
  svg.onpointermove = ev => { if (drag < 0) return; moved = true; const f = evFt(ev); V[drag] = [snap(f[0]), snap(f[1])]; if (sel >= 0) syncEdge(); redraw() }
  svg.onpointerup = () => { drag = -1 }
  svg.onpointerdown = () => { sel = -1; syncEdge() }
  const ro = new ResizeObserver(() => { fit(); redraw() }); ro.observe(svg)
  requestAnimationFrame(() => { fit(); redraw() })
  return { get() { return V }, set(poly) { if (poly && poly.length >= 3) { V = poly.map(p => [+p[0], +p[1]]); house = longest(V); sel = -1; fit(); redraw() } } }
}
