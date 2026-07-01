const SVGNS = 'http://www.w3.org/2000/svg'
const el = (t, a) => { const e = document.createElementNS(SVGNS, t); for (const k in (a || {})) e.setAttribute(k, a[k]); return e }
const snap = v => Math.round(v * 2) / 2
const area = V => Math.abs(V.reduce((s, p, i) => { const q = V[(i + 1) % V.length]; return s + (p[0] * q[1] - q[0] * p[1]) }, 0)) / 2
const perim = V => V.reduce((s, p, i) => { const q = V[(i + 1) % V.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]) }, 0)
const longest = V => { let bi = 0, bl = -1; V.forEach((p, i) => { const q = V[(i + 1) % V.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > bl) { bl = l; bi = i } }); return bi }
const preset = (kind, w, d) => kind === 'rect' ? [[0, 0], [w, 0], [w, d], [0, d]]
  : kind === 'l' ? [[0, 0], [w, 0], [w, d * 0.55], [w * 0.5, d * 0.55], [w * 0.5, d], [0, d]]
  : kind === 't' ? [[0, 0], [w, 0], [w, d * 0.4], [w * 0.68, d * 0.4], [w * 0.68, d], [w * 0.32, d], [w * 0.32, d * 0.4], [0, d * 0.4]]
  : [[0, 0], [w, 0], [w, d], [w * 0.66, d], [w * 0.66, d * 0.34], [w * 0.34, d * 0.34], [w * 0.34, d], [0, d]]
export function mountShapeEditor(host, opts) {
  const o = opts || {}, seedW = Math.max(4, +o.rect?.w || 16), seedD = Math.max(4, +o.rect?.d || 12)
  let V = (o.polygon && o.polygon.length >= 3) ? o.polygon.map(p => [+p[0], +p[1]]) : preset('rect', seedW, seedD)
  let sel = -1, drag = -1, house = o.houseEdge != null ? +o.houseEdge : longest(V)
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
  const applyB = mkbtn('✓ Use this shape', () => { const min = bounds(); const P = V.map(p => [+(p[0] - min.x0).toFixed(2), +(p[1] - min.z0).toFixed(2)]); o.onApply && o.onApply({ polygon: P, houseEdge: house }) }, true)
  bar.append(label('Preset'), presets, mkbtn('Fit', () => { fit(); redraw() }), edn, readout, applyB)
  let s = 10, cx = 0, cz = 0, W = 0, H = 0
  const bounds = () => { const xs = V.map(p => p[0]), zs = V.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs); return { x0, x1, z0, z1, w: x1 - x0, d: z1 - z0 } }
  const px = (fx, fz) => [W / 2 + (fx - cx) * s, H / 2 - (fz - cz) * s]
  const ft = (X, Y) => [cx + (X - W / 2) / s, cz - (Y - H / 2) / s]
  const fit = () => { W = svg.clientWidth || 600; H = svg.clientHeight || 400; const b = bounds(); cx = (b.x0 + b.x1) / 2; cz = (b.z0 + b.z1) / 2; const spanX = Math.max(4, b.w) * 1.35, spanZ = Math.max(4, b.d) * 1.35; s = Math.min((W - 20) / spanX, (H - 20) / spanZ) }
  const evFt = e => { const r = svg.getBoundingClientRect(); return ft(e.clientX - r.left, e.clientY - r.top) }
  function redraw() {
    W = svg.clientWidth || W; H = svg.clientHeight || H; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); while (svg.firstChild) svg.removeChild(svg.firstChild)
    const c0 = ft(0, H), c1 = ft(W, 0), step = s < 9 ? 5 : s < 18 ? 2 : 1
    for (let x = Math.floor(c0[0] / step) * step; x <= c1[0]; x += step) { const a = px(x, c0[1]), b = px(x, c1[1]); svg.append(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#1c212a', 'stroke-width': x === 0 ? 1.4 : 0.6 })) }
    for (let z = Math.floor(c0[1] / step) * step; z <= c1[1]; z += step) { const a = px(c0[0], z), b = px(c1[0], z); svg.append(el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#1c212a', 'stroke-width': z === 0 ? 1.4 : 0.6 })) }
    const pts = V.map(p => px(p[0], p[1]))
    svg.append(el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: 'rgba(216,137,58,0.14)', stroke: '#d8893a', 'stroke-width': 2, 'stroke-linejoin': 'round' }))
    V.forEach((p, i) => {
      const q = V[(i + 1) % V.length], a = pts[i], b = pts[(i + 1) % V.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = Math.hypot(q[0] - p[0], q[1] - p[1])
      const line = el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: i === house ? '#4f9cf0' : (i === sel ? '#e0b341' : 'transparent'), 'stroke-width': i === house ? 5 : 7, 'stroke-linecap': 'round', style: 'cursor:pointer', opacity: i === house ? 0.9 : (i === sel ? 0.8 : 0.01) })
      line.onpointerup = ev => { if (moved) return; ev.stopPropagation(); sel = sel === i ? -1 : i; syncEdge(); redraw() }
      svg.append(line)
      const t = el('text', { x: mx, y: my - 6, fill: i === house ? '#8fc2ff' : '#aeb4bd', 'font-size': 12, 'font-family': 'system-ui', 'text-anchor': 'middle', style: 'pointer-events:none;font-weight:600' }); t.textContent = (i === house ? '🏠 ' : '') + len.toFixed(1) + "'"; svg.append(t)
      const add = el('circle', { cx: mx, cy: my, r: 6.5, fill: '#12161d', stroke: '#5a6472', 'stroke-width': 1.5, style: 'cursor:copy' })
      add.onpointerdown = ev => { ev.stopPropagation(); ev.preventDefault(); const f = evFt(ev); V.splice(i + 1, 0, [snap(f[0]), snap(f[1])]); if (house > i) house++; drag = i + 1; sel = -1; syncEdge(); redraw() }
      const plus = el('text', { x: mx, y: my + 4, fill: '#8b95a3', 'font-size': 12, 'text-anchor': 'middle', style: 'pointer-events:none' }); plus.textContent = '+'; svg.append(add, plus)
    })
    pts.forEach((a, i) => {
      const h = el('circle', { cx: a[0], cy: a[1], r: 8, fill: '#d8893a', stroke: '#fff', 'stroke-width': 2, style: 'cursor:grab' })
      h.onpointerdown = ev => { ev.stopPropagation(); ev.preventDefault(); drag = i; moved = false; svg.setPointerCapture(ev.pointerId) }
      h.ondblclick = ev => { ev.stopPropagation(); if (V.length > 3) { V.splice(i, 1); if (house >= V.length) house = 0; sel = -1; syncEdge(); redraw() } }
      svg.append(h)
    })
    readout.textContent = `${area(V).toFixed(0)} ft²  ·  ${perim(V).toFixed(0)} ft perim  ·  ${V.length} corners`
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
