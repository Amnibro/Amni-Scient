// Interactive SVG canvas layer over the shared sketch engine core.
// Framework-free. mountSketch(container, {scene, trade, catalog, store, onChange}) -> controller.
import { addNode, addRun, removeNode, nodeById, runPoints, runLengthFt, evaluate } from './sketch.js'
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

export function mountSketch(container, opts) {
  const scene = opts.scene, trade = opts.trade, catalog = opts.catalog || {}, onChange = opts.onChange || (() => {})
  const store = () => (typeof opts.store === 'function' ? opts.store() : (opts.store || 'hd'))
  const W = 960, H = 600
  let mode = 'select', connectFrom = null, selected = null, drag = null

  container.innerHTML = ''
  container.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start'
  const left = document.createElement('div'); left.style.cssText = 'flex:1;min-width:520px'
  const bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px;align-items:center'
  left.appendChild(bar)
  const photoStrip = document.createElement('div'); photoStrip.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px'
  const photoL = document.createElement('label'); photoL.className = 'btn'; photoL.style.cssText = 'padding:6px 10px;font-size:12px;cursor:pointer'; photoL.textContent = '📷 Add room photo'
  const photoIn = document.createElement('input'); photoIn.type = 'file'; photoIn.accept = 'image/*'; photoIn.setAttribute('capture', 'environment'); photoIn.style.display = 'none'; photoL.appendChild(photoIn)
  photoIn.onchange = e => { loadBg(e.target.files && e.target.files[0]); photoIn.value = '' }
  const photoClr = document.createElement('button'); photoClr.className = 'btn'; photoClr.textContent = '✕'; photoClr.title = 'remove photo'; photoClr.style.cssText = 'padding:6px 9px;font-size:12px'
  photoClr.onclick = () => { scene.bgImage = null; applyBg(); onChange(scene); render() }
  const photoTip = document.createElement('span'); photoTip.style.cssText = 'font-size:11px;color:var(--mut)'; photoTip.textContent = 'snap your wall/room, then trace your runs right on it'
  photoStrip.append(photoL, photoClr, photoTip); left.appendChild(photoStrip)
  const svgWrap = document.createElement('div'); svgWrap.style.cssText = 'border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#0d0f12;background-size:cover;background-position:center'
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', style: 'touch-action:none;display:block;max-height:62vh;background:transparent' })
  svgWrap.appendChild(svg); left.appendChild(svgWrap)
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
  function setMode(m) { mode = m; connectFrom = null; renderBar(); render() }
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
    if (mode.startsWith('place:')) { addNode(scene, mode.slice(6), clamp(snap(x), W), clamp(snap(y), H)); changed(); return }
    if (mode.startsWith('connect:')) {
      if (nodeId) { if (!connectFrom) { connectFrom = nodeId; render() } else if (connectFrom !== nodeId) { addRun(scene, mode.slice(8), connectFrom, nodeId); connectFrom = null; changed() } }
      else { connectFrom = null; render() }
      return
    }
    if (nodeId) { selected = { kind: 'node', id: nodeId }; const n = nodeById(scene, nodeId); drag = { id: nodeId, dx: x - n.x, dy: y - n.y }; try { svg.setPointerCapture(e.pointerId) } catch (z) {} render() }
    else if (runId) { selected = { kind: 'run', id: runId }; render() }
    else { selected = null; render() }
  })
  svg.addEventListener('pointermove', e => { if (!drag) return; const [x, y] = ptOf(e); const n = nodeById(scene, drag.id); if (!n) return; n.x = clamp(snap(x - drag.dx), W); n.y = clamp(snap(y - drag.dy), H); render() })
  svg.addEventListener('pointerup', () => { if (drag) { drag = null; changed() } })
  svg.addEventListener('dblclick', e => { const nE = closestAttr(e.target, 'data-node'), id = nE && nE.getAttribute('data-node'); if (id && trade.onNodeActivate) { const n = nodeById(scene, id); if (n && trade.onNodeActivate(n)) changed() } })
  window.addEventListener('keydown', e => { if ((e.key === 'Delete' || e.key === 'Backspace') && selected && container.offsetParent !== null) { e.preventDefault(); delSelected() } })

  function changed() { onChange(scene); render() }

  function render() {
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    const G = scene.scalePxPerFt || 24, go = scene.bgImage ? 0.18 : 1
    for (let gx = 0; gx <= W; gx += G) el('line', { x1: gx, y1: 0, x2: gx, y2: H, stroke: gx % (G * 5) === 0 ? '#262b32' : '#171a1f', 'stroke-width': 1, 'stroke-opacity': go }, svg)
    for (let gy = 0; gy <= H; gy += G) el('line', { x1: 0, y1: gy, x2: W, y2: gy, stroke: gy % (G * 5) === 0 ? '#262b32' : '#171a1f', 'stroke-width': 1, 'stroke-opacity': go }, svg)
    el('line', { x1: 14, y1: H - 16, x2: 14 + G * 5, y2: H - 16, stroke: '#8fa8b8', 'stroke-width': 2 }, svg)
    const rt = el('text', { x: 14, y: H - 22, fill: '#8fa8b8', 'font-size': 11, 'font-family': 'system-ui' }, svg); rt.textContent = '5 ft'
    for (const r of scene.runs) {
      const pts = runPoints(r, scene); if (pts.length < 2) continue
      const t = trade.runTypes.find(z => z.type === r.type) || { color: '#888', label: r.type }
      el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: t.color, 'stroke-width': selected && selected.id === r.id ? 6 : 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-run': r.id, style: 'cursor:pointer' }, svg)
      const mid = pts[Math.floor((pts.length - 1) / 2)], nx = pts[Math.floor((pts.length - 1) / 2) + 1] || mid
      const lt = el('text', { x: (mid[0] + nx[0]) / 2, y: (mid[1] + nx[1]) / 2 - 5, fill: t.color, 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'system-ui', style: 'pointer-events:none' }, svg); lt.textContent = runLengthFt(r, scene).toFixed(1) + "'"
    }
    for (const n of scene.nodes) {
      const p = trade.palette.find(z => z.type === n.type) || { color: '#777', glyph: '•', label: n.type }
      const g = el('g', { 'data-node': n.id, style: 'cursor:pointer' }, svg)
      if (connectFrom === n.id) el('circle', { cx: n.x, cy: n.y, r: 19, fill: 'none', stroke: '#5fbf6e', 'stroke-width': 2, 'stroke-dasharray': '3 3' }, g)
      el('circle', { cx: n.x, cy: n.y, r: 14, fill: p.color, stroke: selected && selected.id === n.id ? '#fff' : 'rgba(0,0,0,.45)', 'stroke-width': selected && selected.id === n.id ? 3 : 1.5 }, g)
      const gl = el('text', { x: n.x, y: n.y + 4, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 'bold', fill: '#0d0f12', 'font-family': 'system-ui', style: 'pointer-events:none' }, g); gl.textContent = p.glyph || '•'
      const lb = el('text', { x: n.x, y: n.y + 27, 'text-anchor': 'middle', 'font-size': 10, fill: '#9aa0aa', 'font-family': 'system-ui', style: 'pointer-events:none' }, g); lb.textContent = trade.nodeLabel ? trade.nodeLabel(n) : (n.props && n.props.label ? n.props.label : p.label)
    }
    hint.textContent = mode === 'select' ? 'Select mode — drag to move · double-click a device to set its room · select + Delete to remove' : mode.startsWith('place:') ? 'Click the canvas to place. Pick ↖ Select when done.' : 'Click a node, then another, to run ' + mode.slice(8) + ' between them.'
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
    h += '<div style="font-weight:600;margin:12px 0 4px">Validation</div>'
    if (!ev.checks.length) h += '<div style="color:var(--mut);font-size:12px">draw a layout to validate it against code</div>'
    for (const c of ev.checks) { const ic = c.level === 'ok' ? '✓' : c.level === 'warn' ? '⚠' : '✗'; const col = c.level === 'ok' ? 'var(--ok)' : c.level === 'warn' ? 'var(--warn)' : '#e06b6b'; h += `<div style="font-size:12px;padding:5px 9px;margin:3px 0;border-left:3px solid ${col};background:var(--bg);border-radius:6px"><b style="color:${col}">${ic}</b> ${c.msg}</div>` }
    readBody.innerHTML = h
  }

  applyBg(); renderBar(); render()
  return { render, scene, setMode }
}
