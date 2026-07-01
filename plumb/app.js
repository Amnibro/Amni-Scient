import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { initPermits, updatePermits } from './codes.js?v=fix1'
import { emptyScene, addNode, addRun } from './sketch.js?v=o2'
import { mountSketch } from './sketch-canvas.js?v=o2'
import { makePlumbTrade } from './plumb-rules.js?v=trap1'
const LS = 'amniplumb.cfg.v1', LSP = 'amniplumb.prices.v1'
const defCfg = { w: 40, d: 30, toilets: 2, lavs: 2, tubs: 1, showers: 1, kitchen_sinks: 1, dishwashers: 1, washers: 1, water_heater: true, pipe_material: 'pex' }
let cfg = (() => { try { return { ...defCfg, ...JSON.parse(localStorage.getItem(LS)) } } catch { return { ...defCfg } } })()
let out = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch { return {} } })()
let catalog = {}
const $ = s => document.querySelector(s)
const FINISHES = { pex: ['#c23a3a', 'PEX'], copper: ['#b87333', 'Copper'], cpvc: ['#d8c9a8', 'CPVC'] }
const wasm = await WebAssembly.instantiateStreaming(fetch('plumb_core.wasm?v=2'))
const { alloc, dealloc, build, memory } = wasm.instance.exports
const enc = new TextEncoder(), dec = new TextDecoder()
const polyOf = c => [[0, 0], [c.w, 0], [c.w, c.d], [0, c.d]]
const callCore = c => {
  const payload = enc.encode(JSON.stringify({ polygon: polyOf(c), toilets: +c.toilets, lavs: +c.lavs, tubs: +c.tubs, showers: +c.showers, kitchen_sinks: +c.kitchen_sinks, dishwashers: +c.dishwashers, washers: +c.washers, water_heater: !!c.water_heater, pipe_material: c.pipe_material, issue_date: new Date().toLocaleDateString('en-CA') }))
  const p = alloc(payload.length)
  new Uint8Array(memory.buffer, p, payload.length).set(payload)
  const rp = build(p, payload.length)
  const len = new DataView(memory.buffer).getUint32(rp, true)
  const res = JSON.parse(dec.decode(new Uint8Array(memory.buffer, rp + 4, len)))
  dealloc(p, payload.length); dealloc(rp, len + 4)
  return res
}
const scene = new THREE.Scene()
const bgCv = document.createElement('canvas'); bgCv.width = 4; bgCv.height = 256
{ const s = bgCv.getContext('2d'), gr = s.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#e2e8ee'); gr.addColorStop(1, '#aab4be'); s.fillStyle = gr; s.fillRect(0, 0, 4, 256) }
scene.background = new THREE.CanvasTexture(bgCv)
const cam = new THREE.PerspectiveCamera(50, 2, 0.1, 2000)
cam.position.set(18, 16, 24)
const renderer = new THREE.WebGLRenderer({ canvas: $('#c3d'), antialias: true })
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
const controls = new OrbitControls(cam, $('#c3d'))
controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2 - 0.02
scene.add(new THREE.HemisphereLight(0xffffff, 0x97a0aa, 1.15))
const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(24, 42, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004
Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 200 })
const fill = new THREE.DirectionalLight(0xeef2f6, 0.5); fill.position.set(-20, 26, -30)
scene.add(sun, fill, new THREE.AmbientLight(0xffffff, 0.4))
const grp = new THREE.Group()
scene.add(grp)
const _gadd = grp.add.bind(grp); grp.add = (...o) => { o.forEach(m => m.traverse && m.traverse(x => { x.isMesh && (x.castShadow = x.receiveShadow = true) })); return _gadd(...o) }
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.95 }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.03
ground.receiveShadow = true
scene.add(ground)
const FIXMESH = [['toilets', 0x6fa8d8, 1.4], ['lavs', 0x8fc7d8, 1.0], ['tubs', 0xcfd3d8, 2.2], ['showers', 0xb8d0c0, 1.8], ['kitchen_sinks', 0xd8b87a, 1.2], ['dishwashers', 0xc0c4ca, 1.4], ['washers', 0xd0b0c0, 1.6]]
const LABELS = { toilets: 'Toilet', lavs: 'Sink', tubs: 'Tub', showers: 'Shower', kitchen_sinks: 'Kitchen', dishwashers: 'Dishwasher', washers: 'Washer' }
const txtSprite = (text, color = '#16222e') => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, 0, 256, 64); x.strokeStyle = '#8a96a0'; x.lineWidth = 3; x.strokeRect(2, 2, 252, 60); x.fillStyle = color; x.font = 'bold 34px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 34); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(2.6, 0.65, 1); return s }
const PORC = () => new THREE.MeshStandardMaterial({ color: 0xeef1f3, roughness: 0.32 })
const STEEL = () => new THREE.MeshStandardMaterial({ color: 0xb9bdc2, roughness: 0.3, metalness: 0.75 })
const DARKI = () => new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.6 })
const GLASSI = () => new THREE.MeshPhysicalMaterial({ color: 0xbfdcec, roughness: 0.1, transparent: true, opacity: 0.28 })
const makeFixture = type => { const g = new THREE.Group(), add = (...m) => g.add(...m)
  if (type === 'toilets') { const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.9, 16), PORC()); bowl.position.set(0, 0.45, 0.2); const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.12, 16), PORC()); seat.position.set(0, 0.96, 0.2); const tank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 0.42), PORC()); tank.position.set(0, 0.78, -0.5); add(bowl, seat, tank) }
  else if (type === 'lavs') { const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.7, 12), PORC()); ped.position.y = 0.85; const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.4, 0.42, 16), PORC()); basin.position.y = 1.9; const fau = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), STEEL()); fau.position.set(0, 2.2, -0.32); add(ped, basin, fau) }
  else if (type === 'tubs') { const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.2), PORC()); body.position.y = 0.7; const inner = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.85), DARKI()); inner.position.y = 0.96; add(body, inner) }
  else if (type === 'showers') { const pan = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 2.0), PORC()); pan.position.y = 0.12; const w1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4, 0.08), GLASSI()); w1.position.set(0, 2, -0.96); const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4, 2.0), GLASSI()); w2.position.set(-0.96, 2, 0); const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), STEEL()); head.position.set(-0.7, 3.7, -0.7); add(pan, w1, w2, head) }
  else if (type === 'kitchen_sinks') { const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, 2.0), new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.7 })); cab.position.y = 1.5; const counter = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 2.1), new THREE.MeshStandardMaterial({ color: 0x383d43, roughness: 0.4 })); counter.position.y = 3.1; const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.95), STEEL()); b1.position.set(-0.5, 3.05, 0); const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.95), STEEL()); b2.position.set(0.5, 3.05, 0); const fau = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), STEEL()); fau.position.set(0, 3.5, -0.6); add(cab, counter, b1, b2, fau) }
  else if (type === 'dishwashers') { const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3, 2.0), STEEL()); body.position.y = 1.5; const handle = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 0.14), STEEL()); handle.position.set(0, 2.65, 1.05); add(body, handle) }
  else { const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3, 2.0), new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.4 })); body.position.y = 1.5; const door = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.18, 18), DARKI()); door.rotation.x = Math.PI / 2; door.position.set(0, 1.6, 1.05); add(body, door) }
  return g }
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  const slab = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, 0.1, cfg.d), new THREE.MeshStandardMaterial({ color: 0xdfe3e7, roughness: 0.95 }))
  slab.position.set(cfg.w / 2, 0, -cfg.d / 2); grp.add(slab)
  let i = 0
  const cols = Math.max(1, Math.floor((cfg.w - 1) / 4))
  for (const [key] of FIXMESH) {
    const n = +cfg[key] || 0
    for (let k = 0; k < n; k++) {
      const id = `${key}${k}`, ov = (cfg.pos = cfg.pos || {})[id]
      const cx = ov ? ov[0] : 2.5 + (i % cols) * 4, cz = ov ? ov[1] : -(2.5 + Math.floor(i / cols) * 4)
      const f = makeFixture(key); f.userData.drag = { key: id }; f.position.set(cx, 0.1, cz); f.rotation.y = ov && ov[2] != null ? ov[2] : 0
      const lbl = txtSprite(LABELS[key]); lbl.position.set(0, 4.5, 0); f.add(lbl); grp.add(f)
      i++
    }
  }
  if (cfg.water_heater) { const whg = new THREE.Group(); const ov = (cfg.pos = cfg.pos || {}).wh; whg.position.set(ov ? ov[0] : cfg.w - 2.2, 0, ov ? ov[1] : -2.2); whg.userData.drag = { key: 'wh' }; whg.rotation.y = ov && ov[2] != null ? ov[2] : 0; const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 4, 18), new THREE.MeshStandardMaterial({ color: 0xeceef0, roughness: 0.5 })); tank.position.y = 2; const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 0.5, 18), new THREE.MeshStandardMaterial({ color: 0xd8dbde, roughness: 0.6 })); cap.position.y = 4.2; const lbl = txtSprite('Water Htr'); lbl.position.set(0, 5.2, 0); whg.add(tank, cap, lbl); grp.add(whg) }
}
const installDrag = () => { const cv = $('#c3d'), dray = new THREE.Raycaster(), dptr = new THREE.Vector2(), dplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); let dragO = null, mode = 'm', sx0 = 0, sr0 = 0; const dragOff = new THREE.Vector3(); const sp = e => { const r = cv.getBoundingClientRect(); dptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1) }; const pick = () => { dray.setFromCamera(dptr, cam); for (const hh of dray.intersectObjects(grp.children, true)) { let o = hh.object; while (o && !o.userData.drag) o = o.parent; if (o) return o } return null }; const gp = () => { dray.setFromCamera(dptr, cam); const p = new THREE.Vector3(); return dray.ray.intersectPlane(dplane, p) ? p : null }; cv.addEventListener('pointerdown', e => { sp(e); const o = pick(); if (!o) return; dragO = o; mode = e.shiftKey ? 'r' : 'm'; sx0 = e.clientX; sr0 = o.rotation.y; controls.enabled = false; cv.setPointerCapture(e.pointerId); const p = gp(); p && (dragOff.copy(o.position).sub(p), dragOff.y = 0) }); cv.addEventListener('pointermove', e => { sp(e); if (dragO) { if (mode === 'r') dragO.rotation.y = sr0 + (e.clientX - sx0) * 0.02; else { const p = gp(); p && (dragO.position.x = p.x + dragOff.x, dragO.position.z = p.z + dragOff.z) } return } cv.style.cursor = pick() ? 'grab' : '' }); cv.addEventListener('pointerup', () => { if (!dragO) return; cfg.pos = cfg.pos || {}; cfg.pos[dragO.userData.drag.key] = [+dragO.position.x.toFixed(2), +dragO.position.z.toFixed(2), +dragO.rotation.y.toFixed(3)]; persist(); dragO = null; controls.enabled = true }); cv.addEventListener('dblclick', e => { sp(e); const o = pick(); if (!o) return; o.rotation.y += Math.PI / 2; cfg.pos = cfg.pos || {}; cfg.pos[o.userData.drag.key] = [+o.position.x.toFixed(2), +o.position.z.toFixed(2), +o.rotation.y.toFixed(3)]; persist() }) }
installDrag()
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
  snap.width = c3.width; snap.height = c3.height
  snap.getContext('2d').drawImage(c3, 0, 0)
  snap.style.cssText = 'width:100%;display:block'
  ps.appendChild(snap)
})
;(function loop() { controls.update(); renderer.render(scene, cam); requestAnimationFrame(loop) })()
const renderPlans = () => {
  if (!out) return
  ;['layout', 'details'].forEach(k => $(`#svg-${k}`).innerHTML = out.svgs[k])
}
const renderWarns = () => {
  const w = $('#warns'); w.innerHTML = '<h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--acc);margin:16px 0 8px">Build Notes</h3>'
  if (!out) return
  for (const s of out.warnings) { const [tag, txt] = s.includes('|') ? s.split('|') : ['INFO', s]; const d = document.createElement('div'); d.className = 'warn' + (tag === 'OK' ? ' ok' : tag === 'INFO' ? ' info' : ''); d.textContent = txt; w.appendChild(d) }
}
const SEC = 'background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:14px', GH = 'font-size:15px;color:var(--acc);margin-bottom:6px;font-weight:600'
const guideList = (title, items) => `<div style="${SEC}"><div style="${GH}">${title}</div><ul style="list-style:disc;padding-left:20px;font-size:13px;line-height:1.7;color:var(--ink)">${items.map(t => `<li>${t}</li>`).join('')}</ul></div>`
const G_LS = 'amniplumb.guide.v1'
let gChk = (() => { try { return JSON.parse(localStorage.getItem(G_LS)) || {} } catch { return {} } })()
const renderGuide = () => {
  const body = $('#guide-body'); if (!body || !out) return
  const c = out.calc, mat = (cfg.pipe_material || 'pex').toUpperCase()
  const phases = [
    ['📋 Plan + permit', ['Pull the plumbing permit; confirm whether your area uses the IPC or UPC.', 'Mark every fixture; plan the shortest drain runs and the vent path up through the roof.', `Order ${mat} supply, DWV + fittings, traps, stops, cleanouts, boots — dry-fit before you cut anything for good.`]],
    ['🕳️ DWV rough  (sheet P-2, details 1, 3 & 4)', ['Set the building drain + stack: 1/4"/ft slope (1/8" min on 3"+), supported every few feet.', 'Branch to each fixture; a P-trap AND a vent on every one; toilet on a 3" line.', 'Cleanouts at the base of each stack, direction changes, and ≤100 ft; dry-fit, then solvent-weld / no-hub.']],
    ['💧 Water supply rough  (sheet P-2, detail 2)', [`3/4" trunk, 1/2" branches in ${mat}; balance hot + cold; insulate hot lines.`, 'Stub out at the rough-in heights; a 1/4-turn stop planned at every fixture.', 'Anchor + protect pipe through studs (nail plates) — keep it off sharp edges.']],
    ['🌬️ Venting', ['Tie fixture vents into a stack; one (or more) vent penetrates the roof with a boot.', 'Keep each vent within the trap-arm distance for its trap size; no flat (un-sloped) vents below the flood rim.']],
    ['🔎 Test + rough inspection', ['Cap it and pressure-test: water column on the DWV, air/water on the supply — hold per code.', 'Call the rough-in inspection; nothing gets closed in until DWV + supply pass.']],
    ['🚽 Set fixtures (finish)', ['Set the closet flange + wax ring; faucets, stops, supply lines, traps.', 'Water heater: cold in / hot out, T&P relief to within 6" of the floor, expansion tank on a closed system, drain pan.', 'Caulk + putty per the fixture; snug — do not overtighten plastic.']],
    ['✅ Final', ['Fill the system, run every fixture, and check EACH joint for weeps.', 'Confirm traps hold a seal and nothing drains slow; then the final inspection.']],
  ]
  const tools = [`${mat === 'COPPER' ? 'Torch + flux + solder' : mat === 'CPVC' ? 'CPVC cement + primer' : 'PEX crimp or expander tool + rings'}`, 'PVC/ABS cement + primer (DWV)', 'Tubing cutter + ratchet PVC cutter', 'Hacksaw / mini-hacksaw', 'Right-angle drill + auger/hole-saw (joists)', 'Torpedo + 2-ft level (slope)', 'Channel-locks + basin wrench', 'Plumber’s putty + thread tape', 'Test balls / caps + gauge', 'Tape, marker, deburr tool']
  let cost = 0; (out.bom || []).forEach(it => { const p = price(it.id, 'hd'); if (p != null) cost += p * it.qty })
  const chk = phases.map((ph, pi) => `<div style="${SEC}"><div style="${GH}">${ph[0]}</div>${ph[1].map((t, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''} style="margin-top:3px;accent-color:var(--acc);flex:none"><span style="${on ? 'color:var(--mut);text-decoration:line-through' : ''}">${t}</span></label>` }).join('')}</div>`).join('')
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">A pro rough-to-finish sequence for your <b>${c.total_fixtures}-fixture</b> system (${mat}, ${c.building_drain_in}" drain). Tick as you go. Pair with sheets P-1 (riser) + P-2 (details).</div>`
    + chk
    + guideList('🔍 Inspections', ['<b>Rough-in</b>: DWV + supply pressure test, with pipe exposed — call before you close walls.', '<b>Final</b>: fixtures set, traps sealed, water heater T&P + pan, no leaks.', 'Gas water-heater venting + any sewer/septic tie-in usually need a licensed plumber.'])
    + guideList('🧰 Tools', tools)
    + `<div style="${SEC}"><div style="${GH}">💵 Materials estimate</div><div style="font-size:13px;color:var(--ink)">~<b style="color:var(--ok)">$${cost.toFixed(0)}</b> in pipe, fittings + fixtures hardware (Home Depot catalog) — edit prices on the Materials tab. Fixtures + the water heater are extra.</div></div>`
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
const renderBest = () => {
  const body = $('#best-body'); if (!body) return
  const c = out && out.calc
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">Field-proven plumbing practice + the code rules that matter${c ? ` for your <b>${c.total_fixtures} fixtures · ${c.demand_gpm} GPM · ${c.building_drain_in}" drain</b>` : ''}. Your jurisdiction adopts the <b>IPC</b> or <b>UPC</b> — confirm which; the numbers below are the common values.</div>`
    + guideList('🪤 Traps + vents (the #1 rule)', ['EVERY fixture gets its own P-trap AND a vent — no exceptions, no double-trapping, no S-traps.', 'Trap-arm max length to the vent by drain size: 1¼"→5 ft, 1½"→6 ft, 2"→8 ft, 3"→12 ft.', 'Trap seal 2-4"; toilets are self-trapped (no separate trap). Air-admittance valves only where code allows.'])
    + guideList('📉 Drains + slope', ['Horizontal DWV slopes 1/4"/ft (1/8" min on 3" and larger). Too steep (>3") lets water outrun solids.', 'Toilets drain to 3" min; use long-sweep/wye fittings on DWV — never a hard 90° on its back.', 'Cleanouts at the base of every stack, each change of direction, and at least every 100 ft.'])
    + guideList('🚰 Water supply', ['Run a 3/4" trunk and branch to 1/2" at the fixtures; keep hot + cold balanced.', 'A 1/4-turn shutoff (stop) at EVERY fixture; hammer arrestors at quick-closing valves (washer, dishwasher, ice maker).', 'Street pressure over 80 psi → add a PRV; a closed system needs a thermal-expansion tank. Insulate hot lines.'])
    + guideList('📏 Rough-in heights (typical)', ['Lav: drain 16-18" AFF; hot/cold supply 20-22" AFF, 8" apart, centered on the drain.', 'Toilet: closet flange 12-1/2" from the finished wall; cold supply 6" left of center at 8" AFF.', 'Tub/shower: valve 28-32" (tub) / 48" (shower); head 78"; check your faucet’s spec sheet.'])
    + guideList('🔥 Water heater', ['Cold in / hot out; full-port shutoff on cold. T&P relief piped to within 6" of the floor — never valved or capped.', 'Drain pan with a piped drain on any upper floor or finished space; expansion tank on closed systems.', 'Gas units need correct venting + combustion air; tankless need gas-line + venting sizing. Get a pro for gas.'])
    + guideList('🧰 Pipe materials', ['PEX — flexible, freeze-tolerant, fewest joints, fast (crimp/expansion). Great for DIY repipes; keep off direct sun + 18" from the WH for the first run.', 'Copper — durable + heat-proof but soldered + pricey. CPVC — cheap, but brittle when cold + needs solvent cement.', 'Protect any pipe through studs/plates with a steel nail plate (or keep it 1-1/4" back from the edge).'])
    + guideList('❄️ Protect + test', ['In cold climates keep supply lines OUT of exterior-wall cavities; insulate + heat-tape vulnerable runs.', 'Pressure-test before close-in: a 10-ft water column on the DWV, air or water on the supply — hold per code.', 'A licensed plumber is usually required for the gas water-heater + any sewer/septic/water-main tie-in.'])
  if (c) body.innerHTML += `<div style="${SEC}"><div style="${GH}">📐 Interactive layout — coming next</div><div style="font-size:13px;color:var(--ink)">A drag-and-drop fixture layout (drop a WC/lav/tub into a room → auto DWV + supply riser) is the next upgrade. For now, use the <b>Quick build</b> presets in the sidebar to assemble your fixtures and the P-1 riser + P-2 details on the 2D Plans tab.</div></div>`
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.total_fixtures}`, 'fixtures'], [`${c.demand_gpm}`, 'GPM demand'], [`${c.main_supply_in}"`, 'main supply'], [`${c.building_drain_in}"`, 'building drain'], [`${c.traps}`, 'P-traps']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
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
    const prim = toks.find(t => /\d|pex|pipe|trap|valve|flange|heater|fitting/.test(t)) || toks[0]
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
const FIX = { toilets: '#toilets', lavs: '#lavs', tubs: '#tubs', showers: '#showers', kitchen_sinks: '#ksinks', dishwashers: '#dishwashers', washers: '#washers' }
const syncInputs = () => { for (const [k, id] of Object.entries(FIX)) { const el = $(id); if (el) el.value = cfg[k] } }
const PRESETS = {
  fullbath: { label: '➕ Full bath', add: { toilets: 1, lavs: 1, tubs: 1 } },
  threeq: { label: '➕ ¾ bath', add: { toilets: 1, lavs: 1, showers: 1 } },
  half: { label: '➕ Half bath', add: { toilets: 1, lavs: 1 } },
  primary: { label: '➕ Primary suite', add: { toilets: 1, lavs: 2, showers: 1, tubs: 1 } },
  kitchen: { label: '➕ Kitchen', add: { kitchen_sinks: 1, dishwashers: 1 } },
  laundry: { label: '➕ Laundry', add: { washers: 1 } },
}
const recompute = () => {
  out = callCore(cfg)
  if (out.error) { $('#warns').innerHTML = `<div class="warn">${out.error}</div>`; return }
  persist(); rebuild3D(); renderPlans(); renderMat(); renderWarns(); renderGuide(); renderBest(); updatePermits()
}
const buildFinishes = () => {
  const sw = $('#finishes'); sw.innerHTML = ''
  Object.entries(FINISHES).forEach(([k, [hex, name]]) => {
    const d = document.createElement('div')
    d.className = 'sw' + (cfg.pipe_material === k ? ' on' : '')
    d.style.background = hex
    d.innerHTML = `<span>${name}</span>`
    d.onclick = () => { cfg.pipe_material = k; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === d)); recompute(); if (view3d) view3d.setSupply(k) }
    sw.appendChild(d)
  })
}
const initUI = () => {
  const bind = (id, key) => { const el = $(id); if (!el) return; el.value = cfg[key]; el.onchange = () => { cfg[key] = +el.value; recompute() } }
  for (const [k, id] of Object.entries(FIX)) bind(id, k)
  $('#wheater').checked = !!cfg.water_heater
  $('#wheater').onchange = e => { cfg.water_heater = e.target.checked; recompute() }
  const pwrap = $('#presets')
  if (pwrap) pwrap.innerHTML = Object.entries(PRESETS).map(([k, v]) => `<button class="seg-b" data-preset="${k}">${v.label}</button>`).join('') + '<button class="seg-b" data-preset="__clear" style="color:#d88">✖ Clear all</button>'
  pwrap && pwrap.querySelectorAll('button[data-preset]').forEach(b => b.onclick = () => {
    const p = b.dataset.preset
    if (p === '__clear') { for (const k of Object.keys(FIX)) cfg[k] = 0; cfg.water_heater = false; $('#wheater').checked = false }
    else { const add = PRESETS[p].add; for (const [k, v] of Object.entries(add)) cfg[k] = (+cfg[k] || 0) + v }
    syncInputs(); recompute()
  })
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t))
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === `pane-${t.dataset.pane}`))
    $('#hud').style.display = 'none'
    if (t.dataset.pane === '3d') mount3DView()
  })
  $('#paste-hd').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'hd'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} HD prices` : 'no prices matched — copy the whole store page (Ctrl+A, Ctrl+C)'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#paste-lowes').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'lowes'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} Lowes prices` : 'no prices matched — copy the whole store page'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#open-all-hd').onclick = () => out && out.bom.slice(0, 6).forEach(it => catalog[it.id]?.hdq && window.open(`https://www.homedepot.com/s/${encodeURIComponent(catalog[it.id].hdq)}`, '_blank'))
  $('#reset-prices').onclick = () => { priceEdits = {}; localStorage.removeItem(LSP); renderMat() }
  $('#export-csv').onclick = () => {
    const csv = ['Item,Qty,HD each,HD total,Lowes each,Lowes total', ...out.bom.map(it => { const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes'); return `"${it.desc}",${it.qty},${ph ?? ''},${ph != null ? (ph * it.qty).toFixed(2) : ''},${pl ?? ''},${pl != null ? (pl * it.qty).toFixed(2) : ''}` })].join('\n')
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'plumb-materials.csv' }).click()
  }
  $('#dl-svg').onclick = () => { ['layout', 'details'].forEach(k => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `plumb-${k}.svg` }); a.click() }) }
  buildFinishes()
  initPermits(() => ({ ...cfg, height: 0, attach: 'free', length: 0, depth: 0 }), () => out)
}
const SK_LS = 'amniplumb.sketch.v2'
const plumbTrade = makePlumbTrade()
let sketchScene = (() => { try { const s = JSON.parse(localStorage.getItem(SK_LS)); if (s && s.nodes) return s } catch (e) {} return emptyScene(24) })()
const seedScene = () => {
  if (sketchScene.nodes.length) return
  const sc = sketchScene, sp = sc.scalePxPerFt = 24
  const W = Math.max(12, +cfg.w || 30), D = Math.max(10, +cfg.d || 24)
  sc.floorCal = { w: W, d: D }
  const place = (type, fx, fz) => addNode(sc, type, fx * sp, fz * sp, { fx, fz, rot: 0 })
  const main = place('main', 0.8, D - 0.8), wh = cfg.water_heater ? place('waterheater', 2.6, D - 0.8) : null
  const fix = [[+cfg.toilets || 0, 'toilet', 'dwv3'], [+cfg.lavs || 0, 'lav', 'dwv15'], [+cfg.kitchen_sinks || 0, 'sink', 'dwv15'], [+cfg.showers || 0, 'shower', 'dwv2'], [+cfg.tubs || 0, 'tub', 'dwv15'], [+cfg.washers || 0, 'washer', 'dwv2']]
  const nodes = []; let i = 0; const cols = Math.max(2, Math.floor((W - 4) / 5))
  for (const [n, type, arm] of fix) for (let j = 0; j < n; j++) { const r = Math.floor(i / cols), cr = i % cols, c = r % 2 ? cols - 1 - cr : cr; nodes.push({ id: place(type, Math.min(W - 2, 3 + c * 5), Math.min(D - 4, 2.5 + r * 6)), arm }); i++ }
  let pd = main; for (const nd of nodes) { addRun(sc, nd.arm, pd, nd.id); pd = nd.id }
  if (wh) { let ps = wh; for (const nd of nodes) { addRun(sc, 'sup12', ps, nd.id); ps = nd.id } }
  place('vent', W - 1, 1)
  try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {}
}
function setupSketch() { const host = $('#sketch-host'); if (!host) return; mountSketch(host, { scene: sketchScene, trade: plumbTrade, catalog, store: 'hd', onChange: sc => { try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {} } }) }
let view3d = null
async function mount3DView() { const host = $('#sketch3d-host'); if (!host) return; if (view3d) { view3d.rebuild(); view3d.setSupply(cfg.pipe_material); return } try { const m = await import('./sketch-3d.js?v=m8'); view3d = m.mount3D(host, { scene: sketchScene, trade: plumbTrade, catalog, store: 'hd', supplyMaterial: cfg.pipe_material, onChange: sc => { try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {} } }) } catch (e) { host.innerHTML = '<div style="padding:20px;color:#9aa0aa">3D sim unavailable</div>' } }
catalog = await fetch('catalog.json').then(r => r.json()).catch(() => ({}))
initUI()
resize()
recompute()
seedScene()
setupSketch()
function maybePlanBanner() {
  let plan; try { plan = JSON.parse(localStorage.getItem('amni_construct_plan')) } catch (e) {}
  if (!plan || Date.now() - (plan.ts || 0) > 86400000) return
  const side = document.querySelector('#side'); if (!side) return
  const b = document.createElement('button')
  b.style.cssText = 'display:block;width:100%;padding:9px;margin-bottom:12px;background:var(--bg);border:1px dashed var(--acc2);color:var(--acc2);border-radius:8px;cursor:pointer;font-weight:600;font-size:13px'
  b.textContent = '🏠 Use my house plan (' + (+plan.toilets || 0) + ' WC / ' + ((+plan.lavs || 0) + (+plan.kitchen_sinks || 0)) + ' sinks)'
  side.insertBefore(b, side.firstChild)
  b.onclick = () => { ['toilets', 'lavs', 'kitchen_sinks', 'showers', 'washers'].forEach(k => { if (plan[k] != null) cfg[k] = +plan[k] }); cfg.water_heater = true; const wh = document.querySelector('#wheater'); if (wh) wh.checked = true; syncInputs(); recompute(); b.textContent = '✓ Using your house plan'; b.style.color = 'var(--ok)'; b.style.borderColor = 'var(--ok)' }
}
maybePlanBanner()
