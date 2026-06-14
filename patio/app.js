import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { initPermits, updatePermits } from './codes.js?v=124'
import { initMapTrace, sitePlanSVG, cropForPlan, mapPlanSnapshot } from './maptrace.js?v=124'
import { initAutoDetect } from './autodetect.js?v=124'
const LS = 'amnipatio.cfg.v1', LSP = 'amnipatio.prices.v1'
const defCfg = { mode: 'rect', w: 14, d: 12, polygon: null, thickness_in: 4, base_in: 4, reinforce: 'mesh', finish: 'plain', turndown: { enabled: false, depth_in: 12, width_in: 8 }, vehicle: false, joint_max_ft: 0, house_edge: 0, border: false, sleeves: false }
let cfg = (() => { try { return { ...defCfg, ...JSON.parse(localStorage.getItem(LS)) } } catch { return { ...defCfg } } })()
let out = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch { return {} } })()
let catalog = {}
const $ = s => document.querySelector(s)
const FINISHES = { plain: ['#b9b9b9', 'Broom gray'], smooth: ['#cfcfcf', 'Smooth'], charcoal: ['#6e6e72', 'Charcoal'], terracotta: ['#b46a4a', 'Terracotta'], sandstone: ['#c9b08a', 'Sandstone'], slate: ['#7d8088', 'Stamped slate'], aggregate: ['#9b9484', 'Exposed agg.'], pavers: ['#b89a7a', 'Pavers'], herringbone: ['#a4543f', 'Brick herring.'], cobble: ['#8d8d92', 'Cobblestone'], flagstone: ['#a89884', 'Flagstone'], mosaic: ['#7aa7b8', 'Mosaic tile'] }
const STONE = ['pavers', 'herringbone', 'cobble', 'flagstone', 'mosaic']
const wasm = await WebAssembly.instantiateStreaming(fetch('patio_core.wasm?v=124'))
const { alloc, dealloc, build, memory } = wasm.instance.exports
const enc = new TextEncoder(), dec = new TextDecoder()
const polyOf = c => c.mode === 'poly' && c.polygon && c.polygon.length >= 3 ? c.polygon : [[0, 0], [c.w, 0], [c.w, c.d], [0, c.d]]
const callCore = c => {
  const payload = enc.encode(JSON.stringify({ polygon: polyOf(c), thickness_in: +c.thickness_in, base_in: +c.base_in, reinforce: c.reinforce, finish: c.finish, turndown: c.turndown, vehicle: c.vehicle, joint_max_ft: +c.joint_max_ft, house_edge: c.mode === 'rect' ? +c.house_edge : +c.house_edge, border: !!c.border, sleeves: !!c.sleeves, issue_date: new Date().toLocaleDateString('en-CA') }))
  const p = alloc(payload.length)
  new Uint8Array(memory.buffer, p, payload.length).set(payload)
  const rp = build(p, payload.length)
  const len = new DataView(memory.buffer).getUint32(rp, true)
  const res = JSON.parse(dec.decode(new Uint8Array(memory.buffer, rp + 4, len)))
  dealloc(p, payload.length); dealloc(rp, len + 4)
  return res
}
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x182028)
const cam = new THREE.PerspectiveCamera(50, 2, 0.1, 800)
cam.position.set(16, 14, 20)
const renderer = new THREE.WebGLRenderer({ canvas: $('#c3d'), antialias: true })
const controls = new OrbitControls(cam, $('#c3d'))
controls.enableDamping = true
scene.add(new THREE.AmbientLight(0xffffff, 0.65))
const sun = new THREE.DirectionalLight(0xfff4e0, 1.1)
sun.position.set(30, 40, 18)
scene.add(sun)
const grp = new THREE.Group()
scene.add(grp)
let photoPlane = null, photoMeta = null
const groundMat = new THREE.MeshStandardMaterial({ color: 0x3e5e36, roughness: 1 })
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.02
scene.add(ground)
const speckle = hex => {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const x = c.getContext('2d'); x.fillStyle = hex; x.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 2200; i++) { x.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.09})`; x.fillRect(Math.random() * 128, Math.random() * 128, 1.6, 1.6) }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t
}
const patternTex = (kind, hex) => {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const x = c.getContext('2d')
  x.fillStyle = '#4a443c'; x.fillRect(0, 0, 256, 256)
  const shade = (h, f) => { const n = parseInt(h.slice(1), 16); return `rgb(${Math.min(255, ((n >> 16) & 255) * f) | 0},${Math.min(255, ((n >> 8) & 255) * f) | 0},${Math.min(255, (n & 255) * f) | 0})` }
  const rnd = (a, b) => a + Math.random() * (b - a)
  if (kind === 'pavers') { for (let r = 0; r < 8; r++) for (let col = -1; col < 5; col++) { x.fillStyle = shade(hex, rnd(0.82, 1.12)); x.fillRect(col * 64 + (r % 2 ? 32 : 0) + 2, r * 32 + 2, 60, 28) } }
  else if (kind === 'herringbone') { for (let i = -8; i < 16; i++) for (let j = -2; j < 10; j++) { x.save(); x.translate(i * 32, j * 32 + (i % 2 ? 0 : 16)); x.rotate(i % 2 ? Math.PI / 4 : -Math.PI / 4); x.fillStyle = shade(hex, rnd(0.8, 1.15)); x.fillRect(-26, -10, 52, 20); x.restore() } }
  else if (kind === 'cobble') { for (let r = 0; r < 7; r++) for (let col = 0; col < 7; col++) { x.fillStyle = shade(hex, rnd(0.7, 1.2)); x.beginPath(); x.ellipse(col * 38 + (r % 2 ? 19 : 0) + rnd(-3, 3), r * 38 + rnd(-3, 3), rnd(14, 18), rnd(12, 16), rnd(0, 3), 0, 7); x.fill() } }
  else if (kind === 'flagstone') { for (let i = 0; i < 14; i++) { const cx = rnd(0, 256), cy = rnd(0, 256), n = 5 + (Math.random() * 3 | 0); x.fillStyle = shade(hex, rnd(0.75, 1.15)); x.beginPath(); for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2, rr = rnd(24, 44); x[k ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a)) } x.fill() } }
  else if (kind === 'aggregate') { x.fillStyle = hex; x.fillRect(0, 0, 256, 256); const tones = ['#7a6f5e', '#8d857a', '#a39684', '#6b655c', '#b3a28b', '#5d564b']; for (let i = 0; i < 900; i++) { x.fillStyle = tones[(Math.random() * tones.length) | 0]; x.beginPath(); x.ellipse(rnd(0, 256), rnd(0, 256), rnd(1.2, 3.4), rnd(1.0, 2.8), rnd(0, 3), 0, 7); x.fill() } }
  else { for (let r = 0; r < 16; r++) for (let col = 0; col < 16; col++) { x.fillStyle = shade(hex, rnd(0.6, 1.35)); x.fillRect(col * 16 + 1, r * 16 + 1, 14, 14) } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t
}
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  const poly = polyOf(cfg)
  const shape = new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], p[1])))
  const t = cfg.thickness_in / 12, b = cfg.base_in / 12
  const mk = (depth, mat, yBottom) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.y = yBottom; grp.add(m); return m }
  if (b > 0.01) mk(b, new THREE.MeshStandardMaterial({ color: 0x9a8a68, roughness: 1 }), 0)
  const stone = STONE.includes(cfg.finish)
  const tex = stone || cfg.finish === 'aggregate' ? patternTex(cfg.finish, FINISHES[cfg.finish][0]) : speckle(FINISHES[cfg.finish][0])
  tex.repeat.set(stone ? 0.25 : 0.5, stone ? 0.25 : 0.5)
  mk(t, new THREE.MeshStandardMaterial({ map: tex, roughness: cfg.finish === 'smooth' ? 0.55 : 0.95 }), b)
  if (out && out.joints) for (const j of out.joints) {
    const len = Math.hypot(j.x2 - j.x1, j.y2 - j.y1)
    const g = new THREE.BoxGeometry(len, 0.02, 0.06)
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x222222 }))
    m.position.set((j.x1 + j.x2) / 2, b + t + 0.002, -(j.y1 + j.y2) / 2)
    if (Math.abs(j.x2 - j.x1) < 0.01) m.rotation.y = Math.PI / 2
    grp.add(m)
  }
  if (+cfg.house_edge >= 0) {
    const i = +cfg.house_edge, jn = (i + 1) % poly.length
    const [a, c2] = [poly[i], poly[jn]]
    const len = Math.hypot(c2[0] - a[0], c2[1] - a[1]), ang = Math.atan2(-(c2[1] - a[1]), c2[0] - a[0])
    const wall = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 9, 0.5), new THREE.MeshStandardMaterial({ color: 0xefe8cf, roughness: 0.9 }))
    wall.position.set((a[0] + c2[0]) / 2, 4.5, -(a[1] + c2[1]) / 2)
    wall.rotation.y = ang
    wall.translateZ(-0.3)
    grp.add(wall)
    const fdn = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 1.3, 0.56), new THREE.MeshStandardMaterial({ color: 0x6e2f2b, roughness: 0.95 }))
    fdn.position.set((a[0] + c2[0]) / 2, 0.65, -(a[1] + c2[1]) / 2)
    fdn.rotation.y = ang
    fdn.translateZ(-0.3)
    grp.add(fdn)
    const felt = new THREE.Mesh(new THREE.BoxGeometry(len, t, 0.05), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }))
    felt.position.set((a[0] + c2[0]) / 2, b + t / 2, -(a[1] + c2[1]) / 2)
    felt.rotation.y = ang
    felt.translateZ(0.05)
    grp.add(felt)
  }
  if (photoMeta && cfg.mode === 'poly') {
    photoPlane && scene.remove(photoPlane)
    const { tex, wFt, hFt, cxFt, cyFt } = photoMeta
    photoPlane = new THREE.Mesh(new THREE.PlaneGeometry(wFt, hFt), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85 }))
    photoPlane.rotation.x = -Math.PI / 2
    photoPlane.position.set(cxFt, 0.01, -cyFt)
    scene.add(photoPlane)
  } else if (photoPlane && cfg.mode !== 'poly') { scene.remove(photoPlane); photoPlane = null }
}
const resize = () => { const c = $('#c3d'); const w = c.clientWidth, h = c.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }
new ResizeObserver(resize).observe($('#view'))
window.addEventListener('beforeprint', () => {
  const c3v = $('#c3d')
  c3v.clientWidth && c3v.clientHeight && (resize(), renderer.render(scene, cam))
  if (!c3v.width || !c3v.height) return
  let ps = $('#printshot')
  const pane = $('#pane-plans')
  ps || (ps = Object.assign(document.createElement('div'), { id: 'printshot', className: 'svgwrap' }), pane.insertBefore(ps, pane.querySelector('.svgwrap')))
  ps.innerHTML = '<div style="font:bold 15px monospace;color:#111;padding:10px 12px 4px">3D VIEW — AS DESIGNED</div>'
  const c3 = $('#c3d')
  const snap = document.createElement('canvas')
  snap.width = c3.width
  snap.height = c3.height
  snap.getContext('2d').drawImage(c3, 0, 0)
  snap.style.cssText = 'width:100%;display:block'
  ps.appendChild(snap)
})
;(function loop() { controls.update(); renderer.render(scene, cam); requestAnimationFrame(loop) })()
let siteSnap = null
const renderPlans = () => {
  if (!out) return
  ;['layout', 'section', 'formwork', 'joints'].forEach(k => $(`#svg-${k}`).innerHTML = out.svgs[k])
  if (siteSnap) {
    let wrap = $('#svg-site')
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'svgwrap'; wrap.id = 'svg-site'; const pane = $('#pane-plans'); pane.insertBefore(wrap, pane.querySelector('.svgwrap')) }
    wrap.innerHTML = sitePlanSVG({ ...siteSnap, title: siteSnap.northUp ? 'SITE PLAN — PROPOSED PATIO' : 'REFERENCE SKETCH — PROPOSED PATIO', footprint: `Proposed: ${out.calc.area_ft2.toFixed(0)} ft² concrete patio, ${cfg.thickness_in}" slab, ${cfg.house_edge >= 0 ? 'abutting dwelling (isolation joint)' : 'freestanding'}` })
  }
}
const renderWarns = () => {
  const w = $('#warns'); w.innerHTML = '<h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--acc);margin:16px 0 8px">Build Notes</h3>'
  if (!out) return
  for (const s of out.warnings) { const [tag, txt] = s.includes('|') ? s.split('|') : ['INFO', s]; const d = document.createElement('div'); d.className = 'warn' + (tag === 'OK' ? ' ok' : tag === 'INFO' ? ' info' : ''); d.textContent = txt; w.appendChild(d) }
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.area_ft2.toFixed(0)} ft²`, 'slab area'], [`${c.order_yd3.toFixed(2)} yd³`, 'concrete to order'], [`${c.bags80}`, '80 lb bags (DIY alt)'], [`${c.gravel_tons.toFixed(1)} t`, 'gravel base'], [`${c.panels}`, 'joint panels']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
  let th = 0, tl = 0
  const rows = out.bom.map(it => {
    const cat = catalog[it.id] || {}
    const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes')
    ph != null && (th += ph * it.qty); pl != null && (tl += pl * it.qty)
    const link = (store, q) => q ? `<a href="https://www.${store === 'hd' ? 'homedepot' : 'lowes'}.com/s/${encodeURIComponent(q)}" target="_blank" rel="noopener">↗</a>` : ''
    return `<tr><td>${it.desc}</td><td>${it.qty}</td><td><input data-id="${it.id}" data-store="hd" value="${ph ?? ''}"> ${link('hd', cat.hdq)}</td><td>${ph != null ? '$' + (ph * it.qty).toFixed(2) : '—'}</td><td><input data-id="${it.id}" data-store="lowes" value="${pl ?? ''}"> ${link('lowes', cat.lq)}</td><td>${pl != null ? '$' + (pl * it.qty).toFixed(2) : '—'}</td></tr>`
  }).join('')
  $('#mat-table').innerHTML = `<tr><th>Item</th><th>Qty</th><th>HD $</th><th>HD total</th><th>Lowes $</th><th>Lowes total</th></tr>${rows}<tr><td class="tot">TOTALS</td><td></td><td></td><td class="tot ${th <= tl ? 'best' : ''}">$${th.toFixed(2)}</td><td></td><td class="tot ${tl < th ? 'best' : ''}">$${tl.toFixed(2)}</td></tr>`
  document.querySelectorAll('#mat-table input').forEach(i => i.onchange = () => { const v = parseFloat(i.value); isNaN(v) ? delete priceEdits[`${i.dataset.id}.${i.dataset.store}`] : priceEdits[`${i.dataset.id}.${i.dataset.store}`] = v; localStorage.setItem(LSP, JSON.stringify(priceEdits)); renderMat() })
}
const parsePaste = (text, store) => {
  const filled = []
  const norm = text.toLowerCase()
  for (const it of out.bom) {
    const c = catalog[it.id]
    if (!c) continue
    const toks = (store === 'hd' ? c.hdq : c.lq).toLowerCase().split(/\s+/).filter(t => t.length > 1)
    const prim = toks.find(t => /\d|mesh|rebar|felt|poly|sealer|stake/.test(t)) || toks[0]
    let best = null, idx = norm.indexOf(prim)
    while (idx !== -1) {
      const win = norm.slice(Math.max(0, idx - 160), idx + 360)
      const hits = toks.filter(t => win.includes(t)).length
      const pm = win.match(/\$\s?(\d{1,4})\.(\d{2})/)
      if (pm && hits >= Math.min(2, toks.length)) { const p = parseFloat(`${pm[1]}.${pm[2]}`); if (p > 0.2 && p < 5000 && (!best || hits > best.hits)) best = { p, hits } }
      idx = norm.indexOf(prim, idx + 1)
    }
    if (best) { priceEdits[`${it.id}.${store}`] = best.p; filled.push(it.id) }
  }
  localStorage.setItem(LSP, JSON.stringify(priceEdits))
  return filled
}
const persist = () => localStorage.setItem(LS, JSON.stringify(cfg))
let lastFit = ''
const fitCam = () => {
  const poly = polyOf(cfg)
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 8)
  const key = `${cx.toFixed(1)},${cy.toFixed(1)},${span.toFixed(1)}`
  if (key === lastFit) return
  lastFit = key
  controls.target.set(cx, 3, -cy)
  let ux = 0.12, uy = -1.55
  if (+cfg.house_edge >= 0) {
    const i = +cfg.house_edge, j = (i + 1) % poly.length
    const mx = (poly[i][0] + poly[j][0]) / 2, my = (poly[i][1] + poly[j][1]) / 2
    const vx = cx - mx, vy = cy - my, vl = Math.hypot(vx, vy) || 1
    ux = vx / vl * 1.55 + 0.1; uy = vy / vl * 1.55
  }
  cam.position.set(cx + ux * span, span * 0.9 + 4, -(cy + uy * span))
}
const recompute = () => {
  out = callCore(cfg)
  if (out.error) { $('#warns').innerHTML = `<div class="warn">${out.error}</div>`; return }
  persist(); rebuild3D(); fitCam(); renderPlans(); renderMat(); renderWarns(); updatePermits()
}
let MV = null
const T = { img: null, mode: null, scalePts: [], dist: 10, poly: [], pxPerFt: 0 }
const tc = $('#tcanvas'), tx = tc.getContext('2d')
const tStatus = s => $('#tstatus').textContent = s
const tDraw = () => {
  tx.clearRect(0, 0, tc.width, tc.height)
  if (T.img) { tx.drawImage(T.img, 0, 0, tc.width, tc.height) } else { tx.fillStyle = '#15181d'; tx.fillRect(0, 0, tc.width, tc.height); tx.fillStyle = '#566'; tx.font = '16px monospace'; tx.textAlign = 'center'; tx.fillText('Upload a photo or sketch to begin — or trace on this blank grid', tc.width / 2, tc.height / 2) }
  if (!T.img) { tx.strokeStyle = 'rgba(255,255,255,0.05)'; for (let g = 0; g < tc.width; g += 49) { tx.beginPath(); tx.moveTo(g, 0); tx.lineTo(g, tc.height); tx.stroke() } for (let g = 0; g < tc.height; g += 49) { tx.beginPath(); tx.moveTo(0, g); tx.lineTo(tc.width, g); tx.stroke() } }
  if (T.scalePts.length) {
    tx.strokeStyle = '#ffd166'; tx.lineWidth = 2; tx.fillStyle = '#ffd166'
    T.scalePts.forEach(p => { tx.beginPath(); tx.arc(p[0], p[1], 5, 0, 7); tx.fill() })
    if (T.scalePts.length === 2) { tx.beginPath(); tx.moveTo(...T.scalePts[0]); tx.lineTo(...T.scalePts[1]); tx.stroke(); const m = [(T.scalePts[0][0] + T.scalePts[1][0]) / 2, (T.scalePts[0][1] + T.scalePts[1][1]) / 2]; tx.font = 'bold 14px monospace'; tx.fillText(`${Math.floor(T.dist)}' ${Math.round((T.dist % 1) * 12)}\"`, m[0] + 8, m[1] - 8) }
  }
  if (T.poly.length) {
    tx.strokeStyle = '#8fd8a0'; tx.fillStyle = 'rgba(143,216,160,0.18)'; tx.lineWidth = 2.5
    tx.beginPath(); tx.moveTo(...T.poly[0]); T.poly.forEach(p => tx.lineTo(...p)); if (T.poly.length > 2) tx.closePath(); tx.fill(); tx.stroke()
    tx.fillStyle = '#8fd8a0'
    T.poly.forEach(p => { tx.beginPath(); tx.arc(p[0], p[1], 4.5, 0, 7); tx.fill() })
    if (T.pxPerFt > 0) { tx.font = 'bold 13px monospace'; tx.fillStyle = '#fff'; tx.strokeStyle = 'rgba(0,0,0,0.7)'; tx.lineWidth = 3; for (let i = 0; i < T.poly.length - (T.poly.length > 2 ? 0 : 1); i++) { const a = T.poly[i], b = T.poly[(i + 1) % T.poly.length]; if (T.poly.length <= 2 && i === T.poly.length - 1) break; const len = Math.hypot(b[0] - a[0], b[1] - a[1]) / T.pxPerFt; const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const s = len.toFixed(1) + "'"; tx.strokeText(s, m[0] + 6, m[1] - 6); tx.fillText(s, m[0] + 6, m[1] - 6) } }
  }
  const dims = T.pxPerFt > 0 && T.poly.length > 2 ? T.poly.map((a, i) => { const b = T.poly[(i + 1) % T.poly.length]; return `edge ${i + 1}: ${(Math.hypot(b[0] - a[0], b[1] - a[1]) / T.pxPerFt).toFixed(1)} ft` }).join('<br>') : ''
  $('#tdims').innerHTML = dims ? `<b style="color:var(--acc)">TRACED EDGES</b><br>${dims}` : ''
}
tc.addEventListener('click', e => {
  const r = tc.getBoundingClientRect()
  const p = [(e.clientX - r.left) * tc.width / r.width, (e.clientY - r.top) * tc.height / r.height]
  if (T.mode === 'scale') {
    T.scalePts.push(p)
    if (T.scalePts.length === 2) {
      const pd = prompt('Real distance between those two points (e.g. 133in or 11ft or 11.08):', '10ft');const pm = pd && pd.match(/([\d.]+)\s*(in|\"|ft|'|m)?/i);const d = pm ? parseFloat(pm[1]) * (/(in|\")/i.test(pm[2] || '') ? 1 / 12 : /m/i.test(pm[2] || '') ? 3.28084 : 1) : NaN
      isFinite(d) && d > 0 ? (T.dist = d, T.pxPerFt = Math.hypot(T.scalePts[1][0] - T.scalePts[0][0], T.scalePts[1][1] - T.scalePts[0][1]) / d, tStatus(`Scale set: ${T.pxPerFt.toFixed(1)} px/ft. Now click TRACE and click each corner of the patio.`)) : (T.scalePts = [], tStatus('Scale cancelled — click Set scale and try again.'))
      T.mode = null
    } else tStatus('Click the second reference point…')
  } else if (T.mode === 'trace') { T.poly.push(p); tStatus(`${T.poly.length} corner${T.poly.length > 1 ? 's' : ''} placed — keep clicking corners, then hit USE OUTLINE.`) }
  tDraw()
})
$('#timg').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return
  const img = new Image()
  img.onload = () => { window.__siteMapOn = false; T.img = img; const ar = img.width / img.height; tc.width = 980; tc.height = Math.round(980 / ar); tDraw(); tStatus('Photo loaded. Click "Set scale", then click two points a known distance apart (a fence panel, tape on the ground, the house wall…).') }
  img.src = URL.createObjectURL(f)
})
$('#tscale').onclick = () => { T.mode = 'scale'; T.scalePts = []; tStatus('Click the FIRST reference point on the image…'); tDraw() }
$('#ttrace').onclick = () => { T.pxPerFt > 0 ? (T.mode = 'trace', tStatus('Click each corner of the patio outline in order (clockwise or counter-clockwise).')) : tStatus('Set the scale first (two points + real distance).') }
$('#tundo').onclick = () => { T.poly.pop(); tDraw() }
$('#tclear').onclick = () => { T.poly = []; T.scalePts = []; T.mode = null; tDraw(); tStatus('Cleared. Set scale, then trace.') }
$('#tuse').onclick = async () => {
  if (T.pxPerFt <= 0 || T.poly.length < 3) { tStatus('Need a scale + at least 3 corners before using the outline.'); return }
  const minX = Math.min(...T.poly.map(p => p[0])), maxY = Math.max(...T.poly.map(p => p[1]))
  cfg.polygon = T.poly.map(p => [+(((p[0] - minX) / T.pxPerFt).toFixed(2)), +(((maxY - p[1]) / T.pxPerFt).toFixed(2))])
  cfg.mode = 'poly'
  document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.v === 'poly'))
  $('#rw').style.display = 'none'; $('#rd').style.display = 'none'
  if (T.img && window.__siteMapOn) {
    const ic = document.createElement('canvas'); ic.width = tc.width; ic.height = tc.height
    ic.getContext('2d').drawImage(T.img, 0, 0, ic.width, ic.height)
    photoMeta = { tex: new THREE.CanvasTexture(ic), wFt: tc.width / T.pxPerFt, hFt: tc.height / T.pxPerFt, cxFt: (tc.width / 2 - minX) / T.pxPerFt, cyFt: (maxY - tc.height / 2) / T.pxPerFt }
  }
  const edges = cfg.polygon.map((a, i) => { const b = cfg.polygon[(i + 1) % cfg.polygon.length]; return Math.hypot(b[0] - a[0], b[1] - a[1]) })
  const sel = $('#house')
  sel.innerHTML = '<option value="-1">Freestanding</option>' + edges.map((L, i) => `<option value="${i}">Edge ${i + 1} (${L.toFixed(1)} ft) = house</option>`).join('')
  sel.value = String(edges.indexOf(Math.max(...edges)))
  cfg.house_edge = +sel.value
  siteSnap = { ...(window.__siteMapOn && MV ? await mapPlanSnapshot(MV, tc.width, tc.height, T.poly, T.pxPerFt) : cropForPlan(T.img || tc, tc.width, tc.height, T.poly, T.pxPerFt)), address: window.__siteMapOn ? (window.__siteAddr || '') : '', northUp: !!window.__siteMapOn }
  recompute()
  tStatus(`Outline applied: ${out && out.calc ? out.calc.area_ft2.toFixed(0) : '?'} ft². 3D has your imagery as the ground — and a SITE PLAN was added to 2D Plans for the permit packet.`)
}
const buildFinishes = () => {
  const sw = $('#finishes'); sw.innerHTML = ''
  Object.entries(FINISHES).forEach(([k, [hex, name]]) => {
    const d = document.createElement('div')
    d.className = 'sw' + (cfg.finish === k ? ' on' : '')
    d.style.background = hex
    d.innerHTML = `<span>${name}</span>`
    d.onclick = () => { cfg.finish = k; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === d)); recompute() }
    sw.appendChild(d)
  })
}
const initUI = () => {
  const bind = (id, key, num = true) => { const el = $(id); el.value = cfg[key]; el.onchange = () => { cfg[key] = num ? +el.value : el.value; recompute() } }
  bind('#w', 'w'); bind('#d', 'd'); bind('#t', 'thickness_in'); bind('#base', 'base_in'); bind('#reinf', 'reinforce', false); bind('#jspace', 'joint_max_ft'); bind('#house', 'house_edge')
  $('#vehicle').checked = cfg.vehicle
  $('#vehicle').onchange = e => { cfg.vehicle = e.target.checked; recompute() }
  $('#td').checked = cfg.turndown.enabled
  $('#td').onchange = e => { cfg.turndown.enabled = e.target.checked; recompute() }
  $('#border').checked = !!cfg.border
  $('#border').onchange = e => { cfg.border = e.target.checked; recompute() }
  $('#sleeves').checked = !!cfg.sleeves
  $('#sleeves').onchange = e => { cfg.sleeves = e.target.checked; recompute() }
  document.querySelectorAll('#mode button').forEach(b => b.onclick = () => {
    cfg.mode = b.dataset.v
    document.querySelectorAll('#mode button').forEach(x => x.classList.toggle('on', x === b))
    const rectMode = cfg.mode === 'rect'
    $('#rw').style.display = rectMode ? 'flex' : 'none'; $('#rd').style.display = rectMode ? 'flex' : 'none'
    if (rectMode) { const sel = $('#house'); sel.innerHTML = '<option value="0">Yes — back edge</option><option value="-1">Freestanding</option>'; sel.value = cfg.house_edge >= 0 ? '0' : '-1'; cfg.house_edge = +sel.value }
    if (!rectMode && (!cfg.polygon || cfg.polygon.length < 3)) { document.querySelector('.tab[data-pane="trace"]').click() }
    recompute()
  })
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t))
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === `pane-${t.dataset.pane}`))
    $('#hud').style.display = t.dataset.pane === '3d' ? 'block' : 'none'
  })
  $('#paste-hd').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'hd'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} HD prices` : 'no prices matched — copy the whole store page (Ctrl+A, Ctrl+C)'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#paste-lowes').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'lowes'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} Lowes prices` : 'no prices matched — copy the whole store page'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#open-all-hd').onclick = () => out && out.bom.slice(0, 6).forEach(it => catalog[it.id]?.hdq && window.open(`https://www.homedepot.com/s/${encodeURIComponent(catalog[it.id].hdq)}`, '_blank'))
  $('#reset-prices').onclick = () => { priceEdits = {}; localStorage.removeItem(LSP); renderMat() }
  $('#export-csv').onclick = () => {
    const csv = ['Item,Qty,HD each,HD total,Lowes each,Lowes total', ...out.bom.map(it => { const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes'); return `"${it.desc}",${it.qty},${ph ?? ''},${ph != null ? (ph * it.qty).toFixed(2) : ''},${pl ?? ''},${pl != null ? (pl * it.qty).toFixed(2) : ''}` })].join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'patio-materials.csv' })
    a.click()
  }
  $('#dl-svg').onclick = () => { ['layout', 'section', 'formwork', 'joints'].forEach(k => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `patio-${k}.svg` }); a.click() }); const sw = $('#svg-site'); sw && Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([sw.innerHTML], { type: 'image/svg+xml' })), download: 'patio-site-plan.svg' }).click() }
  buildFinishes()
  initPermits(() => ({ ...cfg, height: 0, attach: cfg.house_edge >= 0 ? 'house' : 'free', length: 0, depth: 0 }), () => out)
  if (cfg.mode === 'poly' && cfg.polygon) { $('#rw').style.display = 'none'; $('#rd').style.display = 'none'; document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.v === 'poly')); const edges = cfg.polygon.map((a, i) => { const b2 = cfg.polygon[(i + 1) % cfg.polygon.length]; return Math.hypot(b2[0] - a[0], b2[1] - a[1]) }); const sel = $('#house'); sel.innerHTML = '<option value="-1">Freestanding</option>' + edges.map((L, i) => `<option value="${i}">Edge ${i + 1} (${L.toFixed(1)} ft) = house</option>`).join(''); sel.value = String(cfg.house_edge) }
}
catalog = await fetch('catalog.json').then(r => r.json()).catch(() => ({}))
initUI()
resize()
tDraw()
MV = initMapTrace({ tc, T, tDraw, tStatus })
const AD = initAutoDetect({ tc, T, tDraw, tStatus, getMapOn: () => !!window.__siteMapOn })
document.getElementById('tauto').onclick = () => AD.detectFootprint()
recompute()
