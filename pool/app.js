import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { initPermits, updatePermits } from './codes.js?v=fix1'
import { initMapTrace, sitePlanSVG, cropForPlan, mapPlanSnapshot } from './maptrace.js?v=1'
import { initAutoDetect } from './autodetect.js?v=1'
const LS = 'amnipool.cfg.v1', LSP = 'amnipool.prices.v1'
const defCfg = { mode: 'rect', w: 16, d: 32, polygon: null, shallow_in: 36, deep_in: 72, kind: 'inground', finish: 'liner', heater: false, temp_rise: 20, house_edge: 0 }
let cfg = (() => { try { return { ...defCfg, ...JSON.parse(localStorage.getItem(LS)) } } catch { return { ...defCfg } } })()
let out = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch { return {} } })()
let catalog = {}
const $ = s => document.querySelector(s)
const FINISHES = { liner: ['#2f9bd6', 'Blue liner'], plaster: ['#bfe3ef', 'White plaster'], fiberglass: ['#3fb6c9', 'Fiberglass'], tile: ['#1f7fae', 'Tile'], vinyl: ['#3aa0d8', 'Vinyl'] }
const wasm = await WebAssembly.instantiateStreaming(fetch('pool_core.wasm?v=2'))
const { alloc, dealloc, build, memory } = wasm.instance.exports
const enc = new TextEncoder(), dec = new TextDecoder()
const polyOf = c => c.mode === 'poly' && c.polygon && c.polygon.length >= 3 ? c.polygon : [[0, 0], [c.w, 0], [c.w, c.d], [0, c.d]]
const callCore = c => {
  const payload = enc.encode(JSON.stringify({ polygon: polyOf(c), shallow_in: +c.shallow_in, deep_in: +c.deep_in, kind: c.kind, finish: c.finish, heater: !!c.heater, temp_rise: +c.temp_rise, house_edge: +c.house_edge, issue_date: new Date().toLocaleDateString('en-CA') }))
  const p = alloc(payload.length)
  new Uint8Array(memory.buffer, p, payload.length).set(payload)
  const rp = build(p, payload.length)
  const len = new DataView(memory.buffer).getUint32(rp, true)
  const res = JSON.parse(dec.decode(new Uint8Array(memory.buffer, rp + 4, len)))
  dealloc(p, payload.length); dealloc(rp, len + 4)
  return res
}
const mkTex = (rep, draw) => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; draw(cv.getContext('2d')); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t }
const grassTex = mkTex(52, g => { const gr = g.createLinearGradient(0, 0, 210, 256); gr.addColorStop(0, '#557f3d'); gr.addColorStop(1, '#446b32'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 52; i++) { g.fillStyle = `hsla(${92 + Math.random() * 44},${28 + Math.random() * 26}%,${25 + Math.random() * 16}%,0.4)`; g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 256, 22 + Math.random() * 46, 15 + Math.random() * 30, Math.random() * 3, 0, 7); g.fill() } for (let i = 0; i < 3000; i++) { g.fillStyle = `hsl(${98 + Math.random() * 34},${34 + Math.random() * 26}%,${19 + Math.random() * 21}%)`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 2.5) } })
const concTex = (base, rep) => mkTex(rep, g => { const b = new THREE.Color(base); g.fillStyle = base; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1700; i++) { g.fillStyle = `#${b.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.22).getHexString()}`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.7, 1.7) } })
const sidingTex = hex => mkTex(1, g => { const b = new THREE.Color(hex); for (let y = 0; y < 256; y += 20) { const gr = g.createLinearGradient(0, y, 0, y + 20); gr.addColorStop(0, `#${b.clone().offsetHSL(0, 0, 0.04).getHexString()}`); gr.addColorStop(0.8, `#${b.getHexString()}`); gr.addColorStop(1, `#${b.clone().offsetHSL(0, 0, -0.14).getHexString()}`); g.fillStyle = gr; g.fillRect(0, y, 256, 20) } })
const waterBump = mkTex(3, g => { g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 46; i++) { g.strokeStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.07})`; g.lineWidth = 2 + Math.random() * 7; const y = Math.random() * 256; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 256; x += 12) g.lineTo(x, y + Math.sin(x / 17 + i) * 7); g.stroke() } })
const offsetPoly = (pts, d) => { const n = pts.length; let ar = 0; for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; ar += p[0] * q[1] - q[0] * p[1] } const s = ar > 0 ? 1 : -1; const nm = e => { const l = Math.hypot(e[0], e[1]) || 1; return [s * e[1] / l, -s * e[0] / l] }; const ix = (p, dp, q, dq) => { const dn = dp[0] * dq[1] - dp[1] * dq[0]; if (Math.abs(dn) < 1e-6) return null; const t = ((q[0] - p[0]) * dq[1] - (q[1] - p[1]) * dq[0]) / dn; return [p[0] + dp[0] * t, p[1] + dp[1] * t] }; return pts.map((p1, i) => { const p0 = pts[(i - 1 + n) % n], p2 = pts[(i + 1) % n], e1 = [p1[0] - p0[0], p1[1] - p0[1]], e2 = [p2[0] - p1[0], p2[1] - p1[1]], n1 = nm(e1), n2 = nm(e2); return ix([p0[0] + n1[0] * d, p0[1] + n1[1] * d], e1, [p1[0] + n2[0] * d, p1[1] + n2[1] * d], e2) || [p1[0] + n2[0] * d, p1[1] + n2[1] * d] }) }
const waterMats = []
const scene = new THREE.Scene()
const skyCv = document.createElement('canvas'); skyCv.width = 4; skyCv.height = 256
{ const s = skyCv.getContext('2d'), gr = s.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#4d8fc9'); gr.addColorStop(0.5, '#9cc4e6'); gr.addColorStop(1, '#dcebf6'); s.fillStyle = gr; s.fillRect(0, 0, 4, 256) }
scene.background = new THREE.CanvasTexture(skyCv)
scene.fog = new THREE.Fog(0xcfe2f2, 95, 320)
const cam = new THREE.PerspectiveCamera(50, 2, 0.1, 2000)
cam.position.set(24, 20, 32)
const renderer = new THREE.WebGLRenderer({ canvas: $('#c3d'), antialias: true })
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.04
const pmremP = new THREE.PMREMGenerator(renderer); scene.environment = pmremP.fromScene(new RoomEnvironment(), 0.04).texture; pmremP.dispose()
const controls = new OrbitControls(cam, $('#c3d'))
controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2 - 0.04
scene.add(new THREE.HemisphereLight(0xcfe4f5, 0x52733f, 1.3))
const sun = new THREE.DirectionalLight(0xfff3df, 2.3); sun.position.set(38, 56, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004
Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 280 })
const fill = new THREE.DirectionalLight(0xe2edf6, 0.6); fill.position.set(-24, 30, 64)
scene.add(sun, fill, new THREE.AmbientLight(0xffffff, 0.24))
const grp = new THREE.Group()
scene.add(grp)
let photoPlane = null, photoMeta = null
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.03
ground.receiveShadow = true
scene.add(ground)
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  waterMats.length = 0
  const poly = polyOf(cfg)
  const above = cfg.kind === 'above'
  const dMax = Math.max(+cfg.deep_in, +cfg.shallow_in) / 12
  const fin = FINISHES[cfg.finish][0], finC = new THREE.Color(fin)
  const base = above ? 0.12 : -dMax, top = above ? dMax + 0.12 : 0
  const shp = new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], p[1])))
  const lay = (mesh, y, sh) => { mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; sh && (mesh.castShadow = mesh.receiveShadow = true); grp.add(mesh); return mesh }
  const ext = (s, depth, mat) => new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }), mat)
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const ring = (outerD, holePts) => { const s = new THREE.Shape(offsetPoly(poly, outerD).map(p => new THREE.Vector2(p[0], p[1]))); s.holes.push(new THREE.Path(holePts.map(p => new THREE.Vector2(p[0], p[1])))); return s }
  if (!above) {
    const mg = 6, ds = new THREE.Shape([[minX - mg, minY - mg], [maxX + mg, minY - mg], [maxX + mg, maxY + mg], [minX - mg, maxY + mg]].map(p => new THREE.Vector2(p[0], p[1])))
    ds.holes.push(new THREE.Path(offsetPoly(poly, 1.1).map(p => new THREE.Vector2(p[0], p[1]))))
    lay(ext(ds, 0.4, new THREE.MeshStandardMaterial({ map: concTex('#c4c2bb', 1.1), roughness: 0.92 })), 0.12, true)
  } else lay(ext(ring(0.55, poly), top, new THREE.MeshStandardMaterial({ map: concTex('#cdd2d7', 1.4), roughness: 0.45, metalness: 0.25 })), top, true)
  lay(ext(ring(1.1, poly), 0.45, new THREE.MeshStandardMaterial({ map: concTex('#d6cbb4', 1.5), roughness: 0.72 })), top + 0.42, true)
  lay(new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshStandardMaterial({ color: finC.clone().offsetHSL(0, 0, -0.05), roughness: 0.32 })), base, true)
  const wallMat = new THREE.MeshStandardMaterial({ color: finC.clone().offsetHSL(0, 0, -0.02), roughness: 0.28, side: THREE.DoubleSide })
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.01) continue; const w = new THREE.Mesh(new THREE.BoxGeometry(len, top - base, 0.12), wallMat); w.position.set((a[0] + b[0]) / 2, (base + top) / 2, -(a[1] + b[1]) / 2); w.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0]); grp.add(w) }
  lay(ext(shp, top - base - 0.25, new THREE.MeshPhysicalMaterial({ color: finC, transparent: true, opacity: 0.5, roughness: 0.15, transmission: 0.25, ior: 1.33 })), top - 0.25)
  const surf = lay(new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshPhysicalMaterial({ color: finC.clone().offsetHSL(0, 0.06, 0.07), transparent: true, opacity: 0.84, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05, bumpMap: waterBump, bumpScale: 0.08, side: THREE.DoubleSide })), top - 0.16)
  waterMats.push(surf.material)
  { const lx = maxX - 0.7, lz = -((minY + maxY) / 2), botY = Math.max(base + 0.3, top - 3), chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.25, metalness: 0.85 })
    for (const dz of [-0.6, 0.6]) { const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, top + 1.4 - botY, 10), chrome); rail.position.set(lx, (top + 1.4 + botY) / 2, lz + dz); grp.add(rail) }
    for (let k = 0; k < 3; k++) { const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), chrome); rung.rotation.x = Math.PI / 2; rung.position.set(lx, top - 0.4 - k * 0.8, lz); grp.add(rung) }
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 10), chrome); hb.rotation.x = Math.PI / 2; hb.position.set(lx, top + 1.4, lz); grp.add(hb) }
  if (!above) {
    const stepMat = new THREE.MeshStandardMaterial({ color: 0xeef1f3, roughness: 0.4 })
    for (let k = 0; k < 3; k++) { const ty = top - (k + 1) * (top - base) / 4; const tread = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 1.2), stepMat); tread.position.set(minX + 2.2, ty, -(minY + 0.8 + k * 1.0)); grp.add(tread) }
    const hi = +cfg.house_edge, mg = 6, fY = 4
    let hmx = 1e9, hmz = 1e9; if (hi >= 0) { const a = poly[hi], c2 = poly[(hi + 1) % poly.length]; hmx = (a[0] + c2[0]) / 2; hmz = -(a[1] + c2[1]) / 2 }
    const fx0 = minX - mg + 0.8, fx1 = maxX + mg - 0.8, fz0 = -(minY - mg + 0.8), fz1 = -(maxY + mg - 0.8)
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2e3236, roughness: 0.4, metalness: 0.6 })
    const panelMat = new THREE.MeshPhysicalMaterial({ color: 0xbfe0f0, roughness: 0.08, transparent: true, opacity: 0.2 })
    for (const [ax, az, bx, bz] of [[fx0, fz0, fx1, fz0], [fx0, fz1, fx1, fz1], [fx0, fz0, fx0, fz1], [fx1, fz0, fx1, fz1]]) {
      const mxp = (ax + bx) / 2, mzp = (az + bz) / 2; if (hi >= 0 && Math.hypot(mxp - hmx, mzp - hmz) < mg + 3) continue
      const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(-(bz - az), bx - ax)
      const panel = new THREE.Mesh(new THREE.BoxGeometry(len - 0.3, fY - 0.7, 0.06), panelMat); panel.position.set(mxp, fY / 2 + 0.1, mzp); panel.rotation.y = ang; grp.add(panel)
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.12), postMat); rail.position.set(mxp, fY, mzp); rail.rotation.y = ang; grp.add(rail)
      const np = Math.max(2, Math.round(len / 5))
      for (let p = 0; p <= np; p++) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, fY, 0.14), postMat); post.position.set(ax + (bx - ax) * p / np, fY / 2, az + (bz - az) * p / np); grp.add(post) }
    }
  }
  if (+cfg.house_edge >= 0) {
    const i = +cfg.house_edge, jn = (i + 1) % poly.length, a = poly[i], c2 = poly[jn]
    const len = Math.hypot(c2[0] - a[0], c2[1] - a[1]), ang = Math.atan2(-(c2[1] - a[1]), c2[0] - a[0]), mx = (a[0] + c2[0]) / 2, mz = -(a[1] + c2[1]) / 2
    const sd = sidingTex('#f1ecdb'); sd.repeat.set(Math.max(2, len / 4), 2)
    const wall = new THREE.Mesh(new THREE.BoxGeometry(len + 4, 10, 0.5), new THREE.MeshStandardMaterial({ map: sd, roughness: 0.9 }))
    wall.position.set(mx, 5, mz); wall.rotation.y = ang; wall.translateZ(-1.4); wall.castShadow = wall.receiveShadow = true; grp.add(wall)
    const fdn = new THREE.Mesh(new THREE.BoxGeometry(len + 4, 1.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x6e2f2b, roughness: 0.95 }))
    fdn.position.set(mx, 0.7, mz); fdn.rotation.y = ang; fdn.translateZ(-1.4); grp.add(fdn)
    const dr = new THREE.Group()
    dr.add(new THREE.Mesh(new THREE.BoxGeometry(6.5, 7.1, 0.32), new THREE.MeshStandardMaterial({ color: 0x303338, roughness: 0.5, metalness: 0.3 })).translateY(3.55))
    const glass = new THREE.Mesh(new THREE.BoxGeometry(5.9, 6.5, 0.16), new THREE.MeshPhysicalMaterial({ color: 0x8fb6d8, roughness: 0.07, metalness: 0.15, transparent: true, opacity: 0.55 })); glass.position.set(0, 3.55, 0.13)
    dr.add(glass, new THREE.Mesh(new THREE.BoxGeometry(0.22, 6.5, 0.22), new THREE.MeshStandardMaterial({ color: 0x303338, roughness: 0.5, metalness: 0.3 })).translateY(3.55).translateZ(0.14)); dr.position.set(mx, 0, mz); dr.rotation.y = ang; dr.translateZ(-1.15); grp.add(dr)
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
;(function loop() { controls.update(); waterBump.offset.x += 0.0006; waterBump.offset.y += 0.0004; renderer.render(scene, cam); requestAnimationFrame(loop) })()
let siteSnap = null
const renderPlans = () => {
  if (!out) return
  ;['layout', 'section', 'details'].forEach(k => $(`#svg-${k}`).innerHTML = out.svgs[k])
  if (siteSnap) {
    let wrap = $('#svg-site')
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'svgwrap'; wrap.id = 'svg-site'; const pane = $('#pane-plans'); pane.insertBefore(wrap, pane.querySelector('.svgwrap')) }
    wrap.innerHTML = sitePlanSVG({ ...siteSnap, title: siteSnap.northUp ? 'SITE PLAN — PROPOSED POOL' : 'REFERENCE SKETCH — PROPOSED POOL', footprint: `Proposed: ${out.calc.area_ft2.toFixed(0)} ft² pool, ${out.calc.gallons.toLocaleString()} gal, ${cfg.house_edge >= 0 ? 'near dwelling (barrier required)' : 'freestanding'}` })
  }
}
const renderWarns = () => {
  const w = $('#warns'); w.innerHTML = '<h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--acc);margin:16px 0 8px">Build Notes</h3>'
  if (!out) return
  for (const s of out.warnings) { const [tag, txt] = s.includes('|') ? s.split('|') : ['INFO', s]; const d = document.createElement('div'); d.className = 'warn' + (tag === 'OK' ? ' ok' : tag === 'INFO' ? ' info' : ''); d.textContent = txt; w.appendChild(d) }
}
const G_LS = 'amnipool.guide.v1'
let gChk = (() => { try { return JSON.parse(localStorage.getItem(G_LS)) || {} } catch { return {} } })()
const SEC = 'background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:14px', GH = 'font-size:15px;color:var(--acc);margin-bottom:6px;font-weight:600'
const guideList = (title, items) => `<div style="${SEC}"><div style="${GH}">${title}</div><ul style="list-style:disc;padding-left:20px;font-size:13px;line-height:1.7;color:var(--ink)">${items.map(t => `<li>${t}</li>`).join('')}</ul></div>`
const renderGuide = () => {
  const body = $('#guide-body'); if (!body || !out) return
  const c = out.calc, ig = cfg.kind !== 'above'
  const phases = [
    ['📋 Layout + permit', ['Stake the pool + equipment pad; call 811; verify zoning setbacks from lot lines + septic.', 'Pull the permit — a pool is permitted + inspected (excavation/steel, bonding, barrier, final).', `Plan the equipment pad + electrical run; size pump ${c.pump_hp} hp / filter ${c.filter_sqft} ft².`]],
    ['🕳️ Excavate', [ig ? 'Dig the shape + depth profile (over-dig for the shell + base); haul spoil.' : 'Level the pad within 1" over the whole footprint; remove sod + organics, compact a sand/base layer.', 'Keep walls back from the dig; protect against cave-in + water.']],
    [ig ? '🏗️ Set + form the shell' : '🏗️ Set the walls', ig ? ['Set the fiberglass shell OR form/steel + gunite OR vinyl wall panels; level + plumb.', 'Backfill in lifts as you fill the pool so pressures stay balanced.'] : ['Assemble the wall, bottom track + uprights on the level base; install the liner without wrinkles.', 'Set the skimmer + return cutouts; never run a vinyl pool empty once the liner is set.']],
    ['🔧 Plumb the equipment pad  (sheet PL-3, detail 1)', ['Set pump → filter → heater on a level pad; suction from skimmer + DUAL main drains; returns back to the pool.', 'Valves to isolate each, unions at the equipment; prime + pressure-check before burying lines.']],
    ['⚡ Electrical: bond + GFCI  (sheet PL-3, detail 2)', ['#8 solid Cu equipotential bond: shell steel, deck (4 ft grid), ladder, pump motor, light niche — to one lug.', 'Dedicated GFCI circuit; pool light on GFCI; no overhead lines over the water. LICENSED electrician.']],
    ['💧 Fill + start-up', ['Fill to mid-skimmer; prime + start the pump, then run the filter continuously to clear.', 'Balance chemistry (pH 7.4-7.6, sanitizer, alkalinity); vacuum + brush; check for leaks at every joint.']],
    ['🚧 Barrier + final  (sheet PL-3, detail 4)', ['Install the 48" barrier + self-closing / self-latching gate (latch 54" AFG, opens out, 4" sphere rule).', 'Add alarms / a safety cover where required; pass the barrier + final inspection BEFORE anyone swims.']],
  ]
  const tools = ['Laser level / transit', ig ? 'Excavator + skid steer (rental) + shovels' : 'Hand level + tamper + rake', 'PVC cutter + primer/cement', 'Channel-locks + pipe wrench', 'Torpedo + 4-ft level', '#8 bond wire + lug + crimper', 'Garden hose(s) for fill', 'Test kit + brush + vacuum', 'Shop vac / submersible pump']
  let cost = 0; (out.bom || []).forEach(it => { const p = price(it.id, 'hd'); if (p != null && !BIG.has(it.id)) cost += p * it.qty })
  const chk = phases.map((ph, pi) => `<div style="${SEC}"><div style="${GH}">${ph[0]}</div>${ph[1].map((t, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''} style="margin-top:3px;accent-color:var(--acc);flex:none"><span style="${on ? 'color:var(--mut);text-decoration:line-through' : ''}">${t}</span></label>` }).join('')}</div>`).join('')
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">A build sequence for your <b>${c.gallons.toLocaleString()}-gal ${ig ? 'in-ground' : 'above-ground'}</b> pool. Tick as you go. Pair with sheets PL-1 (plan), PL-2 (section) + PL-3 (details). <b style="color:var(--warn)">Bonding, the gas heater + shell work usually need licensed pros.</b></div>`
    + chk
    + guideList('🔍 Inspections', ['<b>Excavation / steel</b> before concrete (in-ground).', '<b>Bonding</b> + electrical rough before backfill.', '<b>Barrier + final</b> — gate, alarms, dual drains — before first use.'])
    + guideList('🧰 Tools', tools)
    + `<div style="${SEC}"><div style="${GH}">💵 Materials estimate</div><div style="font-size:13px;color:var(--ink)">~<b style="color:var(--ok)">$${cost.toFixed(0)}</b> in materials/equipment (Home Depot catalog) — edit prices on the Materials tab. Excavation, gunite/liner + labor are the big extras.</div></div>`
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const BIG = new Set(['shell', 'wallkit', 'haul'])
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.gallons.toLocaleString()}`, 'gallons'], [`${c.turnover_gpm.toFixed(0)} gpm`, 'turnover (8 h)'], [`${c.pump_hp} hp`, 'pump'], [`${c.filter_sqft} ft²`, 'filter'], [`${c.excavation_yd3.toFixed(1)} yd³`, 'excavation']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
  const link = (store, q) => q ? `<a href="https://www.${store === 'hd' ? 'homedepot' : 'lowes'}.com/s/${encodeURIComponent(q)}" target="_blank" rel="noopener">↗</a>` : ''
  const rowFor = it => { const cat = catalog[it.id] || {}, ph = price(it.id, 'hd'), pl = price(it.id, 'lowes'); return { ph, pl, html: `<tr><td>${it.desc}</td><td>${it.qty}</td><td><input data-id="${it.id}" data-store="hd" value="${ph ?? ''}"> ${link('hd', cat.hdq)}</td><td>${ph != null ? '$' + (ph * it.qty).toFixed(2) : '—'}</td><td><input data-id="${it.id}" data-store="lowes" value="${pl ?? ''}"> ${link('lowes', cat.lq)}</td><td>${pl != null ? '$' + (pl * it.qty).toFixed(2) : '—'}</td></tr>` } }
  let thM = 0, tlM = 0, thB = 0, tlB = 0, matRows = '', bigRows = ''
  for (const it of out.bom) { const r = rowFor(it); if (BIG.has(it.id)) { r.ph != null && (thB += r.ph * it.qty); r.pl != null && (tlB += r.pl * it.qty); bigRows += r.html } else { r.ph != null && (thM += r.ph * it.qty); r.pl != null && (tlM += r.pl * it.qty); matRows += r.html } }
  const subRow = (label, a, b, style) => `<tr><td class="tot" style="${style || ''}">${label}</td><td></td><td></td><td class="tot ${style ? '' : (a <= b ? 'best' : '')}" style="${style || ''}">$${a.toFixed(2)}</td><td></td><td class="tot ${style ? '' : (b < a ? 'best' : '')}" style="${style || ''}">$${b.toFixed(2)}</td></tr>`
  const bigBlock = bigRows ? `<tr><td colspan="6" style="padding-top:16px;color:var(--warn);font-weight:600">🏗️ Big-ticket / contractor — regional, get 2–3 local bids</td></tr>${bigRows}<tr><td colspan="6" style="color:var(--mut);font-size:12px;padding:4px 10px 8px">Shell/excavation vary hugely by construction — vinyl-liner kit ~$8–15k · fiberglass ~$20–40k · gunite ~$30–60k installed. The line prices are placeholders; get local bids.</td></tr>${subRow('Big-ticket subtotal', thB, tlB, 'color:var(--warn)')}` : ''
  $('#mat-table').innerHTML = `<tr><th>Item</th><th>Qty</th><th>HD $</th><th>HD total</th><th>Lowes $</th><th>Lowes total</th></tr>${matRows}${subRow('🛒 Shoppable materials + equipment', thM, tlM)}${bigBlock}${subRow('≈ Ballpark all-in', thM + thB, tlM + tlB, 'color:var(--ink);border-top:2px solid var(--line)')}`
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
  persist(); rebuild3D(); fitCam(); renderPlans(); renderMat(); renderWarns(); renderGuide(); updatePermits()
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
$('#ttrace').onclick = () => { T.pxPerFt > 0 || (AD && AD.route && AD.route() === 'ground') ? (T.mode = 'trace', tStatus(AD && AD.route && AD.route() === 'ground' ? 'Tap the 4 deck-floor corners in order: back-left, back-right, front-right, front-left.' : 'Click each corner of the patio outline in order.')) : tStatus('Set the scale first (two points + real distance).') }
$('#tundo').onclick = () => { T.poly.pop(); tDraw() }
$('#tclear').onclick = () => { T.poly = []; T.scalePts = []; T.mode = null; tDraw(); tStatus('Cleared. Set scale, then trace.') }
$('#tuse').onclick = async () => {
  const gnd = AD && AD.route && AD.route() === 'ground' ? AD.reconstructGround() : null
  if (gnd && gnd.ok) {
    cfg.polygon = [[0, 0], [gnd.length, 0], [gnd.length, gnd.depth], [0, gnd.depth]]
    cfg.mode = 'poly'
    document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('on', b.dataset.v === 'poly'))
    $('#rw').style.display = 'none'; $('#rd').style.display = 'none'
    const sel = $('#house'); sel.innerHTML = '<option value="-1">Freestanding</option><option value="0" selected>Edge 1 (back) = house</option>'; cfg.house_edge = 0
    siteSnap = { ...cropForPlan(T.img || tc, tc.width, tc.height, T.poly, (Math.hypot(T.poly[1][0] - T.poly[0][0], T.poly[1][1] - T.poly[0][1]) / gnd.length) || 10), address: '', northUp: false }
    recompute()
    tStatus(`Reconstructed from your photo: ${gnd.length.toFixed(1)}' × ${gnd.depth.toFixed(1)}' (${(gnd.length * gnd.depth).toFixed(0)} ft²)${gnd.affine ? ' — near head-on, double-check depth' : ''}. Perspective REFERENCE sketch added to 2D Plans.`)
    return
  }
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
  bind('#w', 'w'); bind('#d', 'd'); bind('#shallow', 'shallow_in'); bind('#deep', 'deep_in'); bind('#kind', 'kind', false); bind('#temprise', 'temp_rise'); bind('#house', 'house_edge')
  $('#heater').checked = !!cfg.heater
  $('#heater').onchange = e => { cfg.heater = e.target.checked; recompute() }
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
    if (t.dataset.pane === 'draw') mountDraw()
  })
  $('#paste-hd').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'hd'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} HD prices` : 'no prices matched — copy the whole store page (Ctrl+A, Ctrl+C)'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#paste-lowes').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'lowes'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} Lowes prices` : 'no prices matched — copy the whole store page'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#open-all-hd').onclick = () => out && out.bom.slice(0, 6).forEach(it => catalog[it.id]?.hdq && window.open(`https://www.homedepot.com/s/${encodeURIComponent(catalog[it.id].hdq)}`, '_blank'))
  $('#reset-prices').onclick = () => { priceEdits = {}; localStorage.removeItem(LSP); renderMat() }
  $('#export-csv').onclick = () => {
    const csv = ['Item,Qty,HD each,HD total,Lowes each,Lowes total', ...out.bom.map(it => { const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes'); return `"${it.desc}",${it.qty},${ph ?? ''},${ph != null ? (ph * it.qty).toFixed(2) : ''},${pl ?? ''},${pl != null ? (pl * it.qty).toFixed(2) : ''}` })].join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'pool-materials.csv' })
    a.click()
  }
  $('#dl-svg').onclick = () => { ['layout', 'section', 'details'].forEach(k => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `pool-${k}.svg` }); a.click() }); const sw = $('#svg-site'); sw && Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([sw.innerHTML], { type: 'image/svg+xml' })), download: 'pool-site-plan.svg' }).click() }
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


function maybeScanBanner() {
  let scan; try { scan = JSON.parse(localStorage.getItem('amni_scan')) } catch (e) {}
  if (!scan || !scan.polygon || scan.polygon.length < 3 || Date.now() - (scan.ts || 0) > 86400000) return
  const side = document.querySelector('#side'); if (!side) return
  const b = document.createElement('button')
  b.style.cssText = 'display:block;width:100%;padding:9px;margin-bottom:12px;background:var(--bg);border:1px dashed var(--acc);color:var(--acc);border-radius:8px;cursor:pointer;font-weight:600;font-size:13px'
  b.textContent = '\u{1F4D0} Use my scan (' + scan.area_ft2 + ' ft²)'
  side.insertBefore(b, side.firstChild)
  b.onclick = () => {
    applyPoly(scan.polygon)
    if (window.__deckApplyMode) window.__deckApplyMode()
    b.textContent = '✓ Using your scan (' + scan.area_ft2 + ' ft²)'; b.style.color = 'var(--ok)'; b.style.borderColor = 'var(--ok)'
  }
}
function applyPoly(polygon, houseEdge) {
  cfg.polygon = polygon.map(p => [+p[0], +p[1]]); cfg.mode = 'poly'
  const edges = cfg.polygon.map((a, i) => { const c = cfg.polygon[(i + 1) % cfg.polygon.length]; return Math.hypot(c[0] - a[0], c[1] - a[1]) })
  cfg.house_edge = houseEdge != null ? +houseEdge : edges.indexOf(Math.max.apply(null, edges))
  document.querySelectorAll('#mode button').forEach(x => x.classList.toggle('on', x.dataset.v === 'poly'))
  const rw = document.querySelector('#rw'), rd = document.querySelector('#rd'); if (rw) rw.style.display = 'none'; if (rd) rd.style.display = 'none'
  const sel = document.querySelector('#house')
  if (sel) { sel.innerHTML = '<option value="-1">Freestanding</option>' + edges.map((L, i) => '<option value="' + i + '">Edge ' + (i + 1) + ' (' + L.toFixed(1) + ' ft) = house</option>').join(''); sel.value = String(cfg.house_edge) }
  recompute()
}
let shapeEd = null
async function mountDraw() {
  const host = document.querySelector('#draw-host'); if (!host || shapeEd) return
  try { const m = await import('./shape-edit.js?v=se2'); shapeEd = m.mountShapeEditor(host, { rect: { w: +cfg.w, d: +cfg.d }, polygon: cfg.mode === 'poly' ? cfg.polygon : null, houseEdge: cfg.house_edge, onApply: ({ polygon, houseEdge }) => { applyPoly(polygon, houseEdge); const t = document.querySelector('.tab[data-pane="3d"]'); if (t) t.click() } }) }
  catch (e) { host.innerHTML = '<div style="padding:20px;color:#9aa0aa">draw tool unavailable</div>' }
}

maybeScanBanner()
