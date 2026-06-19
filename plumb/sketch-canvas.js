// Interactive SVG canvas layer over the shared sketch engine core.
// Framework-free. mountSketch(container, {scene, trade, catalog, store, onChange}) -> controller.
import { addNode, addRun, removeNode, nodeById, runPoints, runLengthFt, evaluate } from './sketch.js'
import { computeHomography, applyH, invert3 } from './perspective.js'
const NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e }

export function bomCsv(ev, opts) {
  opts = opts || {}
  const esc = c => /[",\n]/.test('' + c) ? '"' + ('' + c).replace(/"/g, '""') + '"' : '' + c
  const rows = [['Item', 'Qty', 'Unit', 'Unit price', 'Line cost']]
  for (const l of ev.quote.lines) rows.push([l.name + (l.note ? ' (' + l.note + ')' : ''), l.qty, l.unitName || '', (l.unitPrice || 0).toFixed(2), l.cost.toFixed(2)])
  const labor = opts.laborPct ? ev.quote.total * opts.laborPct / 100 : 0
  if (labor) rows.push(['Labor / markup (' + opts.laborPct + '%)', '', '', '', labor.toFixed(2)])
  rows.push(['TOTAL', '', '', '', (ev.quote.total + labor).toFixed(2)])
  return rows.map(r => r.map(esc).join(',')).join('\n')
}

// Top-view plan shapes drawn centered at (0,0) into group g, given px width/height + color.
const SHAPES = {
  toilet: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h * 0.34, rx: w * 0.12, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g); el('ellipse', { cx: 0, cy: h * 0.12, rx: w * 0.44, ry: h * 0.32, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g) },
  tub: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 7, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g); el('rect', { x: -w / 2 + w * 0.13, y: -h / 2 + h * 0.09, width: w * 0.74, height: h * 0.82, rx: 7, fill: 'none', stroke: c, 'stroke-width': 1.4 }, g) },
  basin: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 6, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g); el('ellipse', { cx: 0, cy: h * 0.04, rx: w * 0.3, ry: h * 0.32, fill: 'none', stroke: c, 'stroke-width': 1.4 }, g) },
  ksink: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 5, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g); el('rect', { x: -w * 0.43, y: -h * 0.3, width: w * 0.38, height: h * 0.6, rx: 3, fill: 'none', stroke: c, 'stroke-width': 1.4 }, g); el('rect', { x: w * 0.05, y: -h * 0.3, width: w * 0.38, height: h * 0.6, rx: 3, fill: 'none', stroke: c, 'stroke-width': 1.4 }, g) },
  shower: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 4, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g); el('line', { x1: -w / 2, y1: -h / 2, x2: w / 2, y2: h / 2, stroke: c, 'stroke-width': 1, 'stroke-opacity': 0.4 }, g); el('line', { x1: w / 2, y1: -h / 2, x2: -w / 2, y2: h / 2, stroke: c, 'stroke-width': 1, 'stroke-opacity': 0.4 }, g); el('circle', { cx: 0, cy: 0, r: Math.min(w, h) * 0.09, fill: 'none', stroke: c, 'stroke-width': 1.4 }, g) },
  washer: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 5, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g); el('circle', { cx: 0, cy: 0, r: Math.min(w, h) * 0.33, fill: 'none', stroke: c, 'stroke-width': 1.4 }, g) },
  round: (g, w, h, c) => { el('ellipse', { cx: 0, cy: 0, rx: w / 2, ry: h / 2, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g) },
  square: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 4, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g) },
  panel: (g, w, h, c) => { el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 3, fill: '#eef2f6', stroke: c, 'stroke-width': 2 }, g); for (let i = 1; i < 4; i++) el('line', { x1: -w / 2 + 3, y1: -h / 2 + h * i / 4, x2: w / 2 - 3, y2: -h / 2 + h * i / 4, stroke: c, 'stroke-width': 0.8, 'stroke-opacity': 0.5 }, g) },
  marker: (g, w, h, c) => { el('circle', { cx: 0, cy: 0, r: Math.max(13, Math.min(w, h) / 2), fill: 'rgba(248,250,252,.96)', stroke: c, 'stroke-width': 3 }, g) },
}
export function mountSketch(container, opts) {
  const scene = opts.scene, trade = opts.trade, catalog = opts.catalog || {}, onChange = opts.onChange || (() => {})
  const store = () => (typeof opts.store === 'function' ? opts.store() : (opts.store || 'hd'))
  const W = 960, H = 600
  let mode = 'select', connectFrom = null, selected = null, drag = null, calibPts = []
  const nodePix = n => (scene.floorH && n.props && n.props.fx != null) ? applyH(scene.floorH, [n.props.fx, n.props.fz]) : [n.x, n.y]
  const floorQuad = (fx, fz, w, d, rotDeg) => { const r = (rotDeg || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([px, py]) => applyH(scene.floorH, [fx + (px * c - py * s), fz + (px * s + py * c)])) }

  container.innerHTML = ''
  container.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start'
  const left = document.createElement('div'); left.style.cssText = 'flex:1;min-width:520px'
  const bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px;align-items:center'
  left.appendChild(bar)
  const photoStrip = document.createElement('div'); photoStrip.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px'
  const photoL = document.createElement('label'); photoL.className = 'btn'; photoL.style.cssText = 'padding:6px 10px;font-size:12px;cursor:pointer'; photoL.textContent = '📷 Add room photo'
  const photoIn = document.createElement('input'); photoIn.type = 'file'; photoIn.accept = 'image/*'; photoIn.setAttribute('capture', 'environment'); photoIn.style.display = 'none'; photoL.appendChild(photoIn)
  photoIn.onchange = e => { loadBg(e.target.files && e.target.files[0]); photoIn.value = '' }
  const floorBtn = document.createElement('button'); floorBtn.className = 'btn'; floorBtn.style.cssText = 'padding:6px 10px;font-size:12px'; floorBtn.textContent = '📐 Set floor'
  floorBtn.onclick = () => { calibPts = []; setMode('calibrate') }
  const photoClr = document.createElement('button'); photoClr.className = 'btn'; photoClr.textContent = '✕'; photoClr.title = 'remove photo + floor'; photoClr.style.cssText = 'padding:6px 9px;font-size:12px'
  photoClr.onclick = () => { scene.bgImage = null; scene.floorH = null; scene.floorCal = null; applyBg(); onChange(scene); render() }
  const photoTip = document.createElement('span'); photoTip.style.cssText = 'font-size:11px;color:var(--mut)'; photoTip.textContent = 'snap your wall/room, set the floor, then drop fixtures on it'
  photoStrip.append(photoL, floorBtn, photoClr, photoTip); left.appendChild(photoStrip)
  const svgWrap = document.createElement('div'); svgWrap.style.cssText = 'position:relative;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#0d0f12;background-size:cover;background-position:center'
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', style: 'touch-action:none;display:block;max-height:62vh;background:transparent' })
  svgWrap.appendChild(svg); left.appendChild(svgWrap)
  const banner = document.createElement('div'); banner.style.cssText = 'position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:5;display:none;align-items:center;gap:10px;padding:8px 15px;border-radius:22px;font-size:13px;font-weight:600;box-shadow:0 3px 10px #0007;max-width:92%;text-align:center'
  svgWrap.appendChild(banner)
  const calForm = document.createElement('div'); calForm.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;display:none;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;box-shadow:0 6px 20px #0009;text-align:center;font-size:13px'
  svgWrap.appendChild(calForm)
  const inCss = 'width:52px;background:var(--bg);border:1px solid var(--line);border-radius:6px;color:inherit;padding:5px 6px;margin:0 4px'
  function showCalForm() {
    calForm.style.display = 'block'
    calForm.innerHTML = '<div style="margin-bottom:9px;font-weight:600">How big is that floor area?</div><div style="display:flex;gap:4px;align-items:center;justify-content:center">width<input id="_cw" type="number" min="1" value="10" style="' + inCss + '">ft &nbsp;×&nbsp; depth<input id="_cd" type="number" min="1" value="12" style="' + inCss + '">ft</div><div style="margin-top:11px;display:flex;gap:8px;justify-content:center"><button id="_cset" class="btn" style="padding:5px 12px">✓ Set floor</button><button id="_ccan" class="btn" style="padding:5px 12px">✕</button></div>'
    calForm.querySelector('#_cset').onclick = () => { const w = +calForm.querySelector('#_cw').value || 10, d = +calForm.querySelector('#_cd').value || 12; scene.floorH = computeHomography([[0, 0], [w, 0], [w, d], [0, d]], calibPts.slice(0, 4)); scene.floorCal = { px: calibPts.slice(0, 4), w, d }; calForm.style.display = 'none'; setMode('select'); onChange(scene); render() }
    calForm.querySelector('#_ccan').onclick = () => { calForm.style.display = 'none'; setMode('select') }
  }
  function updateBanner() {
    let txt = '', col = '', btn = ''
    if (mode === 'calibrate') { txt = '👆 Tap the 4 corners of a floor area — clockwise (' + calibPts.length + '/4)'; col = '#2a6ec2'; btn = '✕ Cancel' }
    else if (mode.startsWith('place:')) { const p = trade.palette.find(z => z.type === mode.slice(6)) || {}; txt = '👆 Tap the photo where the ' + (p.glyph || '') + ' ' + (p.label || 'item') + ' goes'; col = '#2a6ec2'; btn = '✓ Done' }
    else if (mode.startsWith('connect:')) { const t = trade.runTypes.find(z => z.type === mode.slice(8)) || {}; txt = connectFrom ? '👆 Now tap what it connects to' : '👆 Tap the two things to join with the ' + (t.label || 'line'); col = '#2f8f4a'; btn = '✕ Cancel' }
    else if (!scene.nodes.length) { txt = '👇 Pick something below, then tap the photo to place it'; col = '#4a4f58' }
    else { banner.style.display = 'none'; return }
    banner.style.display = 'flex'; banner.style.background = col; banner.style.color = '#fff'
    banner.innerHTML = '<span>' + txt + '</span>' + (btn ? '<button style="background:rgba(255,255,255,.25);border:0;color:#fff;border-radius:12px;padding:3px 11px;cursor:pointer;font-weight:600;font-size:12px">' + btn + '</button>' : '')
    const b = banner.querySelector('button'); if (b) b.onclick = () => setMode('select')
  }
  const hint = document.createElement('div'); hint.style.cssText = 'color:var(--mut);font-size:11px;margin-top:6px'; left.appendChild(hint)
  function applyBg() { svgWrap.style.backgroundImage = scene.bgImage ? `linear-gradient(rgba(13,15,18,.34),rgba(13,15,18,.34)), url(${scene.bgImage})` : 'none' }
  function loadBg(file) { if (!file) return; const img = new Image(); img.onload = () => { const mx = 1280, sc = Math.min(1, mx / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * sc)); c.height = Math.max(1, Math.round(img.height * sc)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); try { scene.bgImage = c.toDataURL('image/jpeg', 0.72) } catch (e) { scene.bgImage = null } try { URL.revokeObjectURL(img.src) } catch (e) {} applyBg(); onChange(scene); render() }; img.onerror = () => { try { URL.revokeObjectURL(img.src) } catch (e) {} }; img.src = URL.createObjectURL(file) }
  container.appendChild(left)
  const read = document.createElement('div'); read.style.cssText = 'min-width:250px;max-width:340px;font-size:13px'; container.appendChild(read)
  const ctl = document.createElement('div'); ctl.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px'; read.appendChild(ctl)
  const readBody = document.createElement('div'); read.appendChild(readBody)
  const inpCss = 'width:54px;background:var(--bg);border:1px solid var(--line);border-radius:6px;color:inherit;padding:4px 6px'
  const scaleL = document.createElement('label'); scaleL.style.cssText = 'font-size:12px;color:var(--mut);display:flex;align-items:center;gap:4px'; scaleL.append('px/ft')
  const scaleI = document.createElement('input'); scaleI.type = 'number'; scaleI.min = '4'; scaleI.max = '120'; scaleI.step = '1'; scaleI.value = scene.scalePxPerFt || 24; scaleI.style.cssText = inpCss
  scaleI.onchange = () => { const v = +scaleI.value; if (v >= 4) { scene.scalePxPerFt = v; onChange(scene); render() } }
  scaleL.appendChild(scaleI); ctl.appendChild(scaleL)
  const laborL = document.createElement('label'); laborL.style.cssText = 'font-size:12px;color:var(--mut);display:flex;align-items:center;gap:4px'; laborL.append('labor%')
  const laborI = document.createElement('input'); laborI.type = 'number'; laborI.min = '0'; laborI.max = '300'; laborI.step = '5'; laborI.value = '0'; laborI.style.cssText = inpCss
  laborI.onchange = () => renderReadout()
  laborL.appendChild(laborI); ctl.appendChild(laborL)
  const csvB = document.createElement('button'); csvB.className = 'btn'; csvB.textContent = '⬇️ BOM CSV'; csvB.style.cssText = 'padding:5px 9px;font-size:12px'
  csvB.onclick = () => { const ev = evaluate(scene, trade, catalog, store()); const csv = bomCsv(ev, { laborPct: +laborI.value || 0 }); Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: (trade.name || 'sketch') + '-bom.csv' }).click() }
  ctl.appendChild(csvB)

  const mkBtn = (label, on, sty) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = label; b.style.cssText = 'padding:6px 9px;font-size:12px;' + (sty || ''); b.onclick = on; bar.appendChild(b); return b }
  function setMode(m) { mode = m; connectFrom = null; if (m !== 'calibrate' && calForm) calForm.style.display = 'none'; renderBar(); render() }
  function delSelected() { if (!selected) return; if (selected.kind === 'node') removeNode(scene, selected.id); else scene.runs = scene.runs.filter(r => r.id !== selected.id); selected = null; changed() }
  function renderBar() {
    bar.innerHTML = ''
    const sel = mkBtn('↖ Select', () => setMode('select')); if (mode === 'select') sel.classList.add('on')
    trade.palette.forEach(p => { const b = mkBtn((p.glyph || '•') + ' ' + p.label, () => setMode('place:' + p.type), 'border-color:' + p.color); if (mode === 'place:' + p.type) b.classList.add('on') })
    const sp = document.createElement('span'); sp.textContent = '│ run:'; sp.style.cssText = 'color:var(--mut);margin:0 3px'; bar.appendChild(sp)
    trade.runTypes.forEach(rt => { const b = mkBtn(rt.label, () => setMode('connect:' + rt.type), 'border-color:' + rt.color); if (mode === 'connect:' + rt.type) b.classList.add('on') })
    mkBtn('🗑 Delete', delSelected)
    mkBtn('Clear', () => { if (!scene.nodes.length || confirm('Clear the layout?')) { scene.nodes = []; scene.runs = []; selected = null; changed() } })
  }
  const ptOf = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); if (!m) return [0, 0]; const q = p.matrixTransform(m.inverse()); return [q.x, q.y] }
  const snap = v => { const g = scene.scalePxPerFt || 24; return Math.round(v / (g / 2)) * (g / 2) }
  const clamp = (v, mx) => Math.max(10, Math.min(mx - 10, v))
  const closestAttr = (t, a) => (t && t.closest) ? t.closest('[' + a + ']') : null

  svg.addEventListener('pointerdown', e => {
    const [x, y] = ptOf(e)
    const nE = closestAttr(e.target, 'data-node'), nodeId = nE && nE.getAttribute('data-node')
    const rE = closestAttr(e.target, 'data-run'), runId = rE && rE.getAttribute('data-run')
    if (mode === 'calibrate') { calibPts.push([x, y]); if (calibPts.length >= 4) showCalForm(); render(); return }
    if (mode.startsWith('place:')) { let nx = clamp(snap(x), W), ny = clamp(snap(y), H), props = {}; if (scene.floorH) { const f = applyH(invert3(scene.floorH), [x, y]); props = { fx: f[0], fz: f[1] }; nx = x; ny = y }; addNode(scene, mode.slice(6), nx, ny, props); changed(); return }
    if (mode.startsWith('connect:')) {
      if (nodeId) { if (!connectFrom) { connectFrom = nodeId; render() } else if (connectFrom !== nodeId) { addRun(scene, mode.slice(8), connectFrom, nodeId); connectFrom = null; changed() } }
      else { connectFrom = null; render() }
      return
    }
    if (nodeId) { selected = { kind: 'node', id: nodeId }; const n = nodeById(scene, nodeId); drag = { id: nodeId, dx: x - n.x, dy: y - n.y }; try { svg.setPointerCapture(e.pointerId) } catch (z) {} render() }
    else if (runId) { selected = { kind: 'run', id: runId }; render() }
    else { selected = null; render() }
  })
  svg.addEventListener('pointermove', e => { if (!drag) return; const [x, y] = ptOf(e); const n = nodeById(scene, drag.id); if (!n) return; if (scene.floorH && n.props && n.props.fx != null) { const f = applyH(invert3(scene.floorH), [x - drag.dx, y - drag.dy]); n.props.fx = f[0]; n.props.fz = f[1]; const px = nodePix(n); n.x = px[0]; n.y = px[1] } else { n.x = clamp(snap(x - drag.dx), W); n.y = clamp(snap(y - drag.dy), H) } render() })
  svg.addEventListener('pointerup', () => { if (drag) { drag = null; changed() } })
  svg.addEventListener('dblclick', e => { const nE = closestAttr(e.target, 'data-node'), id = nE && nE.getAttribute('data-node'); if (!id) return; const n = nodeById(scene, id); if (!n) return; if (trade.onNodeActivate && trade.onNodeActivate(n)) { changed(); return } const p = trade.palette.find(z => z.type === n.type); if (p && p.dims && p.shape !== 'marker' && p.shape !== 'round') { n.props.rot = ((n.props.rot || 0) + 90) % 360; changed() } })
  window.addEventListener('keydown', e => { if ((e.key === 'Delete' || e.key === 'Backspace') && selected && container.offsetParent !== null) { e.preventDefault(); delSelected() } })

  function changed() { onChange(scene); render() }

  function render() {
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    const G = scene.scalePxPerFt || 24, persp = !!(scene.floorH && scene.floorCal), go = persp ? 0 : (scene.bgImage ? 0.18 : 1)
    if (go > 0) {
      for (let gx = 0; gx <= W; gx += G) el('line', { x1: gx, y1: 0, x2: gx, y2: H, stroke: gx % (G * 5) === 0 ? '#262b32' : '#171a1f', 'stroke-width': 1, 'stroke-opacity': go }, svg)
      for (let gy = 0; gy <= H; gy += G) el('line', { x1: 0, y1: gy, x2: W, y2: gy, stroke: gy % (G * 5) === 0 ? '#262b32' : '#171a1f', 'stroke-width': 1, 'stroke-opacity': go }, svg)
      el('line', { x1: 14, y1: H - 16, x2: 14 + G * 5, y2: H - 16, stroke: '#8fa8b8', 'stroke-width': 2 }, svg)
      el('text', { x: 14, y: H - 22, fill: '#8fa8b8', 'font-size': 11, 'font-family': 'system-ui' }, svg).textContent = '5 ft'
    }
    if (persp) {
      const FH = scene.floorH, fw = scene.floorCal.w, fd = scene.floorCal.d, step = Math.max(1, Math.round(Math.max(fw, fd) / 8))
      const fl = (a, b) => { const p1 = applyH(FH, a), p2 = applyH(FH, b); el('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: '#6cc0ff', 'stroke-width': 1, 'stroke-opacity': 0.3 }, svg) }
      for (let gx = 0; gx <= fw + 1e-6; gx += step) fl([gx, 0], [gx, fd])
      for (let gz = 0; gz <= fd + 1e-6; gz += step) fl([0, gz], [fw, gz])
      const bc = [[0, 0], [fw, 0], [fw, fd], [0, fd]].map(p => applyH(FH, p))
      el('polygon', { points: bc.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#6cc0ff', 'stroke-width': 2, 'stroke-opacity': 0.55 }, svg)
    }
    if (mode === 'calibrate') {
      if (calibPts.length > 1) el('polyline', { points: calibPts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#6cc0ff', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg)
      calibPts.forEach((p, i) => { el('circle', { cx: p[0], cy: p[1], r: 8, fill: '#6cc0ff', stroke: '#fff', 'stroke-width': 2 }, svg); el('text', { x: p[0], y: p[1] - 12, 'text-anchor': 'middle', fill: '#fff', 'font-size': 12, 'font-weight': 'bold', 'font-family': 'system-ui' }, svg).textContent = (i + 1) })
    }
    for (const r of scene.runs) {
      const pts = runPoints(r, scene); if (pts.length < 2) continue
      const t = trade.runTypes.find(z => z.type === r.type) || { color: '#888', label: r.type }, sel = selected && selected.id === r.id
      el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#0008', 'stroke-width': sel ? 9 : 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-run': r.id, style: 'cursor:pointer' }, svg)
      el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: t.color, 'stroke-width': sel ? 5 : 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', style: 'pointer-events:none' }, svg)
      const mid = pts[Math.floor((pts.length - 1) / 2)], nx = pts[Math.floor((pts.length - 1) / 2) + 1] || mid, lx = (mid[0] + nx[0]) / 2, ly = (mid[1] + nx[1]) / 2, txt = runLengthFt(r, scene).toFixed(1) + "'"
      el('rect', { x: lx - txt.length * 3.4 - 3, y: ly - 16, width: txt.length * 6.8 + 6, height: 14, rx: 7, fill: 'rgba(16,18,22,.8)', style: 'pointer-events:none' }, svg)
      el('text', { x: lx, y: ly - 6, fill: '#dfe6ee', 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'system-ui', style: 'pointer-events:none' }, svg).textContent = txt
    }
    for (const n of scene.nodes) {
      const p = trade.palette.find(z => z.type === n.type) || { color: '#777', glyph: '•', label: n.type, shape: 'marker' }
      const sel = selected && selected.id === n.id, dims = p.dims || [0.6, 0.6], rot = (n.props && n.props.rot) || 0
      const ctr = nodePix(n), g = el('g', { 'data-node': n.id, style: 'cursor:pointer' }, svg)
      const lbl = trade.nodeLabel ? trade.nodeLabel(n) : (n.props && n.props.label ? n.props.label : p.label)
      if (persp && n.props && n.props.fx != null && p.shape !== 'marker') {
        const q = floorQuad(n.props.fx, n.props.fz, dims[0], dims[1], rot), pts = q.map(pt => pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ')
        if (connectFrom === n.id) el('polygon', { points: pts, fill: 'none', stroke: '#5fbf6e', 'stroke-width': 4, 'stroke-dasharray': '5 3' }, g)
        el('polygon', { points: pts, fill: 'rgba(238,242,246,.9)', stroke: sel ? '#fff' : p.color, 'stroke-width': sel ? 4 : 2.5, 'stroke-linejoin': 'round' }, g)
        const ex = q.reduce((s, pt) => s + pt[0], 0) / 4, ey = q.reduce((s, pt) => s + pt[1], 0) / 4, maxy = Math.max(q[0][1], q[1][1], q[2][1], q[3][1])
        el('text', { x: ex, y: ey + 5, 'text-anchor': 'middle', 'font-size': 17, 'font-family': '"Segoe UI Emoji","Apple Color Emoji",system-ui', style: 'pointer-events:none' }, g).textContent = p.glyph || '•'
        el('rect', { x: ex - (lbl.length * 3.2 + 5), y: maxy + 3, width: lbl.length * 6.4 + 10, height: 15, rx: 7, fill: 'rgba(16,18,22,.84)', style: 'pointer-events:none' }, g)
        el('text', { x: ex, y: maxy + 14, 'text-anchor': 'middle', 'font-size': 10, fill: '#eef2f6', 'font-family': 'system-ui', style: 'pointer-events:none' }, g).textContent = lbl
        continue
      }
      const wpx = Math.max(15, dims[0] * G), hpx = Math.max(15, dims[1] * G), half = Math.max(wpx, hpx) / 2
      const shp = el('g', { transform: `translate(${ctr[0]},${ctr[1]}) rotate(${persp ? 0 : rot})` }, g)
      if (connectFrom === n.id) el('rect', { x: -wpx / 2 - 5, y: -hpx / 2 - 5, width: wpx + 10, height: hpx + 10, rx: 8, fill: 'none', stroke: '#5fbf6e', 'stroke-width': 3, 'stroke-dasharray': '5 3' }, shp)
      if (sel) el('rect', { x: -wpx / 2 - 3, y: -hpx / 2 - 3, width: wpx + 6, height: hpx + 6, rx: 7, fill: 'none', stroke: '#fff', 'stroke-width': 2 }, shp)
      ;(SHAPES[p.shape] || SHAPES.marker)(shp, wpx, hpx, p.color)
      el('text', { x: ctr[0], y: ctr[1] + 5, 'text-anchor': 'middle', 'font-size': Math.min(20, Math.max(12, Math.min(wpx, hpx) * 0.5)), 'font-family': '"Segoe UI Emoji","Apple Color Emoji",system-ui', style: 'pointer-events:none' }, g).textContent = p.glyph || '•'
      const ly = ctr[1] + half + 13
      el('rect', { x: ctr[0] - (lbl.length * 3.2 + 5), y: ly - 11, width: lbl.length * 6.4 + 10, height: 15, rx: 7, fill: 'rgba(16,18,22,.84)', style: 'pointer-events:none' }, g)
      el('text', { x: ctr[0], y: ly, 'text-anchor': 'middle', 'font-size': 10, fill: '#eef2f6', 'font-family': 'system-ui', style: 'pointer-events:none' }, g).textContent = lbl
    }
    hint.textContent = 'Tip: drag to move · double-click a fixture to change it · tap it then Delete to remove'
    updateBanner()
    renderReadout()
  }

  function renderReadout() {
    const ev = evaluate(scene, trade, catalog, store())
    try { window.__sketchBOM = ev } catch (e) {}
    if (opts.onEvaluate) opts.onEvaluate(ev)
    const laborPct = +laborI.value || 0, labor = ev.quote.total * laborPct / 100, grand = ev.quote.total + labor
    let h = '<div style="font-weight:700;color:var(--acc);margin-bottom:8px">📐 Live readout</div>'
    h += '<table style="width:100%;font-size:12px;margin-bottom:6px">'
    let any = false
    for (const rt of trade.runTypes) { const ft = ev.measure.byRunType[rt.type]; if (ft) { any = true; h += `<tr><td style="color:var(--mut)">${rt.label}</td><td style="text-align:right">${ft.toFixed(1)} ft</td></tr>` } }
    if (!any) h += '<tr><td style="color:var(--mut)">no runs yet</td></tr>'
    h += '</table>'
    h += '<div style="font-weight:600;margin:10px 0 4px">Materials &amp; quote</div><table style="width:100%;font-size:12px">'
    for (const l of ev.quote.lines) h += `<tr><td style="color:var(--mut)">${l.name}${l.note ? ' <span style="opacity:.55">(' + l.note + ')</span>' : ''}</td><td style="text-align:right;white-space:nowrap">${l.qty} ${l.unitName || ''}</td><td style="text-align:right">$${l.cost.toFixed(0)}</td></tr>`
    if (labor) { h += `<tr><td style="color:var(--mut)">Materials subtotal</td><td></td><td style="text-align:right">$${ev.quote.total.toFixed(0)}</td></tr>`; h += `<tr><td style="color:var(--mut)">Labor / markup (${laborPct}%)</td><td></td><td style="text-align:right">$${labor.toFixed(0)}</td></tr>` }
    h += `<tr style="border-top:1px solid var(--line)"><td><b>Estimated quote</b></td><td></td><td style="text-align:right"><b style="color:var(--ok)">$${grand.toFixed(0)}</b></td></tr></table>`
    const fails = ev.checks.filter(c => c.level === 'fail'), warns = ev.checks.filter(c => c.level === 'warn'), oks = ev.checks.filter(c => c.level === 'ok')
    const mute = s => s.replace(/\s*\[([^\]]+)\]/g, ' <span style="opacity:.4;font-size:9px">[$1]</span>')
    const card = (c, ic, col) => `<div style="font-size:12px;padding:6px 9px;margin:3px 0;border-left:3px solid ${col};background:var(--bg);border-radius:6px"><b style="color:${col}">${ic}</b> ${mute(c.msg)}</div>`
    if (!ev.checks.length) h += '<div style="font-weight:600;margin:12px 0 4px">Check</div><div style="color:var(--mut);font-size:12px">Add fixtures + pipe and I\'ll check it as you go.</div>'
    else {
      const todo = fails.length + warns.length
      h += `<div style="display:flex;align-items:center;gap:8px;margin:12px 0 6px"><b>Check</b><span style="font-size:12px;color:${todo ? 'var(--warn)' : 'var(--ok)'}">${todo ? '🔧 ' + todo + ' to fix · ' + oks.length + ' good' : '✅ all ' + oks.length + ' good — nice!'}</span></div>`
      if (fails.length) h += '<div style="font-size:11px;color:var(--mut);margin:6px 0 2px">Fix these:</div>' + fails.map(c => card(c, '✗', '#e06b6b')).join('')
      if (warns.length) h += '<div style="font-size:11px;color:var(--mut);margin:6px 0 2px">Worth a look:</div>' + warns.map(c => card(c, '⚠', 'var(--warn)')).join('')
      if (oks.length) h += '<div style="font-size:11px;color:var(--mut);margin:6px 0 2px">Good:</div>' + oks.map(c => card(c, '✓', 'var(--ok)')).join('')
    }
    readBody.innerHTML = h
  }

  applyBg(); renderBar(); render()
  return { render, scene, setMode }
}
