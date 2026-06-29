import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { initPermits, updatePermits } from './codes.js?v=fix1'
import { emptyScene, addNode, addRun } from './sketch.js'
import { mountSketch } from './sketch-canvas.js'
import { makeElecTrade } from './elec-rules.js'
const LS = 'amnielec.cfg.v1', LSP = 'amnielec.prices.v1'
const defCfg = { sqft: 1800, bedrooms: 3, bathrooms: 2, has_laundry: true, electric_range: 1, electric_dryer: 1, water_heater_elec: true, dishwasher: true, disposal: true, microwave: true, hvac_amps: 30 }
let cfg = (() => { try { return { ...defCfg, ...JSON.parse(localStorage.getItem(LS)) } } catch { return { ...defCfg } } })()
let out = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch { return {} } })()
let catalog = {}
const $ = s => document.querySelector(s)
const wasm = await WebAssembly.instantiateStreaming(fetch('elec_core.wasm?v=2'))
const { alloc, dealloc, build, memory } = wasm.instance.exports
const enc = new TextEncoder(), dec = new TextDecoder()
const sideOf = c => Math.sqrt(Math.max(100, +c.sqft || 1500))
const polyOf = c => { const s = sideOf(c); return [[0, 0], [s, 0], [s, s], [0, s]] }
const callCore = c => {
  const payload = enc.encode(JSON.stringify({ polygon: polyOf(c), bedrooms: +c.bedrooms, bathrooms: +c.bathrooms, has_laundry: !!c.has_laundry, electric_range: +c.electric_range, electric_dryer: +c.electric_dryer, water_heater_elec: !!c.water_heater_elec, dishwasher: !!c.dishwasher, disposal: !!c.disposal, microwave: !!c.microwave, hvac_amps: +c.hvac_amps, issue_date: new Date().toLocaleDateString('en-CA') }))
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
const perim = (s, t) => { const side = Math.floor(t % 4), f = (t % 4) - side; return side === 0 ? [f * s, 0] : side === 1 ? [s, -f * s] : side === 2 ? [s - f * s, -s] : [0, -(s - f * s)] }
const txtSprite = (text, color = '#16222e') => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, 0, 256, 64); x.strokeStyle = '#8a96a0'; x.lineWidth = 3; x.strokeRect(2, 2, 252, 60); x.fillStyle = color; x.font = 'bold 32px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 34); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(2.6, 0.65, 1); return s }
const makeOutlet = () => { const g = new THREE.Group(); const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), new THREE.MeshStandardMaterial({ color: 0xb0b4ba, roughness: 0.6 })); post.position.y = 0.6; const plate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.1), new THREE.MeshStandardMaterial({ color: 0xf3f4f5, roughness: 0.5 })); plate.position.y = 1.25; const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.06), new THREE.MeshStandardMaterial({ color: 0x2b3138 })); s1.position.set(0, 1.42, 0.06); const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.06), new THREE.MeshStandardMaterial({ color: 0x2b3138 })); s2.position.set(0, 1.08, 0.06); g.add(post, plate, s1, s2); return g }
const makeLight = () => { const g = new THREE.Group(); const can = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0xe0e3e7, roughness: 0.5 })); const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xfff4cf, emissive: 0xc2a44a, emissiveIntensity: 0.9, roughness: 0.3 })); lens.position.y = -0.09; g.add(can, lens); return g }
const makePanel = () => { const g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x3a4350, roughness: 0.55, metalness: 0.3 })); box.position.y = 1.7; const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x4c5764, roughness: 0.5, metalness: 0.4 })); door.position.set(0.4, 1.7, 0.27); door.rotation.y = -0.5; for (let r = 0; r < 8; r++) for (const sx of [-0.35, 0.35]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.13, 0.06), new THREE.MeshStandardMaterial({ color: 0x14181c })); br.position.set(sx, 0.65 + r * 0.34, 0.3); g.add(br) } g.add(box, door); return g }
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  const s = sideOf(cfg)
  const slab = new THREE.Mesh(new THREE.BoxGeometry(s, 0.1, s), new THREE.MeshStandardMaterial({ color: 0xdfe3e7, roughness: 0.95 }))
  slab.position.set(s / 2, 0, -s / 2); grp.add(slab)
  cfg.pos = cfg.pos || {}
  const ovp = cfg.pos.panel
  const panel = makePanel(); panel.userData.drag = { key: 'panel' }; panel.position.set(ovp ? ovp[0] : 1.0, 0, ovp ? ovp[1] : -s / 2 + 0.35); panel.rotation.y = ovp && ovp[2] != null ? ovp[2] : 0; grp.add(panel)
  const plbl = txtSprite('Panel'); plbl.position.set(0, 3.9, 0); panel.add(plbl)
  if (out && out.calc) {
    const nr = Math.min(+out.calc.receptacles || 0, 56)
    for (let i = 0; i < nr; i++) { const id = `o${i}`, ov = cfg.pos[id], [x, z] = perim(s, (i + 0.5) / nr * 4); const o = makeOutlet(); o.userData.drag = { key: id }; o.position.set(ov ? ov[0] : x, 0.1, ov ? ov[1] : z); o.rotation.y = ov && ov[2] != null ? ov[2] : 0; grp.add(o) }
    const nl = Math.min(+out.calc.lights || 0, 40), gc = Math.max(1, Math.round(Math.sqrt(nl)))
    for (let i = 0; i < nl; i++) { const id = `l${i}`, ov = cfg.pos[id], c = i % gc, r = Math.floor(i / gc); const lt = makeLight(); lt.userData.drag = { key: id }; lt.position.set(ov ? ov[0] : s * (c + 0.5) / gc, 2.7, ov ? ov[1] : -s * (r + 0.5) / Math.ceil(nl / gc)); lt.rotation.y = ov && ov[2] != null ? ov[2] : 0; grp.add(lt) }
    const leg = txtSprite(`${nr} outlets · ${nl} lights`); leg.scale.set(4.6, 0.7, 1); leg.position.set(s / 2, 4.6, -0.3); grp.add(leg)
  }
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
const G_LS = 'amnielec.guide.v1'
let gChk = (() => { try { return JSON.parse(localStorage.getItem(G_LS)) || {} } catch { return {} } })()
const renderGuide = () => {
  const body = $('#guide-body'); if (!body || !out) return
  const c = out.calc
  const phases = [
    ['📋 Plan + permit', ['Pull the electrical permit; the load calc sets your service size — confirm the panel + meter location with the utility.', 'Lay out devices + lights, mark each homerun back to the panel, and count box fill before you buy boxes.', `Order ${c.service_size_a} A panel, breakers (incl AFCI/GFCI), NM cable, boxes, devices, plates.`]],
    ['🔌 Rough-in: boxes  (sheet E-2, detail 1)', ['Set device + fixture boxes at standard heights (receptacles ~12-16", switches ~48").', 'Use nail-on boxes in new framing, old-work boxes in finished walls; leave 6-8" of free conductor at each.', 'Mount the panel; 36" of clear working space in front, nothing stored in it.']],
    ['🧵 Pull cable', ['Run homeruns to the panel; staple within 8" of a box and every 4-1/2 ft.', 'Protect cable through studs: keep it 1-1/4" back from the edge or add a nail plate.', "Don't kink NM cable; keep line + load straight at GFCI/AFCI devices."]],
    ['⚡ Make-up + panel  (sheet E-2, details 1 & 3)', ['Pigtail devices so the circuit never depends on a single receptacle.', 'Land hots on breakers, neutrals on the neutral bus, grounds on the ground bus — main bond at the SERVICE only.', 'AFCI on living-area circuits, GFCI in wet areas; LABEL every breaker.']],
    ['🔎 Rough inspection', ['Call before insulation/drywall: box fill, support, cable protection, grounding + bonding all get checked.', 'Nothing gets covered until the rough passes.']],
    ['🔘 Trim-out (finish)', ['Devices + plates, fixtures, smoke/CO alarms interconnected.', 'Set the panel cover; verify TR receptacles + correct breaker for each wire size.']],
    ['✅ Final + energize', ['Torque-check terminations to spec; test every circuit + the AFCI/GFCI test buttons.', 'Final inspection, then the utility connects the meter. Never work it hot.']],
  ]
  const tools = ["Lineman's pliers + diagonal cutters", 'Wire strippers (10-18 AWG)', 'Non-contact tester + multimeter', 'Insulated screwdrivers + nut driver', 'Right-angle drill + auger bit', 'Fish tape', 'Cable stapler + nail plates', 'Torpedo level', 'NM cable ripper', 'Torque screwdriver', 'Circuit labels + marker']
  let cost = 0; (out.bom || []).forEach(it => { const p = price(it.id, 'hd'); if (p != null) cost += p * it.qty })
  const chk = phases.map((ph, pi) => `<div style="${SEC}"><div style="${GH}">${ph[0]}</div>${ph[1].map((t, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''} style="margin-top:3px;accent-color:var(--acc);flex:none"><span style="${on ? 'color:var(--mut);text-decoration:line-through' : ''}">${t}</span></label>` }).join('')}</div>`).join('')
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">A pro rough-to-final sequence for your <b>${c.service_size_a} A / ${c.total_circuits}-circuit</b> service. Tick as you go. Pair with sheets E-1 (panel schedule) + E-2 (details). <b style="color:var(--warn)">Mains/panel + tie-in: hire a licensed electrician.</b></div>`
    + chk
    + guideList('🔍 Inspections', ['<b>Rough-in</b>: with walls open — box fill, support, protection, grounding/bonding.', '<b>Final</b>: devices, covers, GFCI/AFCI test, smoke/CO, panel labeled.', 'The service, panel, and meter tie-in are licensed-electrician + utility work.'])
    + guideList('🧰 Tools', tools)
    + `<div style="${SEC}"><div style="${GH}">💵 Materials estimate</div><div style="font-size:13px;color:var(--ink)">~<b style="color:var(--ok)">$${cost.toFixed(0)}</b> in panel, breakers, wire + devices (Home Depot catalog) — edit prices on the Materials tab. Permit + electrician labor are separate.</div></div>`
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
const renderBest = () => {
  const body = $('#best-body'); if (!body) return
  const c = out && out.calc
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">The NEC rules that drive a clean, passing rough-in${c ? ` for your <b>${c.service_size_a} A · ${c.total_circuits} circuits · ${c.receptacles} receptacles</b>` : ''}. Your state adopts a specific NEC edition (most 2020 or 2023) — confirm the local amendments.</div>`
    + guideList('🔌 Receptacle spacing (210.52)', ['The "6-foot rule": no point along a wall is more than 6 ft from a receptacle — so they land ~12 ft apart. Any wall 2 ft or wider gets one.', 'Kitchen + dining counters: a receptacle within 24" of any point, none more than 4 ft apart; islands/peninsulas per the current edition.', 'Hallways 10 ft+ need one; one outdoor front + back; one in the garage + each basement.'])
    + guideList('⚙️ Required circuits (210.11)', ['At least TWO 20A small-appliance circuits for kitchen/dining counters; one 20A laundry; one 20A bathroom (bath-only).', 'Dedicated circuits: range, dryer, electric water heater, HVAC, dishwasher, disposal, often the microwave.', 'Garage + outdoor receptacles on a 20A circuit; a dedicated circuit for any fixed 1 HP+ load.'])
    + guideList('🛡️ GFCI (210.8) + AFCI (210.12)', ['GFCI: kitchens, baths, laundry, garages, outdoors, crawlspaces/unfinished basements, and within 6 ft of any sink/tub/shower.', 'AFCI: nearly all 120V 15/20A circuits in living areas (bedrooms, living, kitchen, laundry…).', 'Where both apply, use a dual-function AFCI/GFCI breaker or device. All receptacles tamper-resistant (406.12).'])
    + guideList('📏 Device heights + box fill', ['Receptacles ~12-16" to center; wall switches ~48"; kitchen-counter receptacles ~44" (above the backsplash).', 'Count box fill per 314.16 — conductors, devices, clamps + grounds; oversize the box rather than cram it.', 'Leave 6" of free conductor past the box face; support cable within 8" of a box and every 4-1/2 ft.'])
    + guideList('🔋 Panel + service (110.26, 408)', ['Working clearance at the panel: 36" deep, 30" wide, 6 ft 6 in high — clear, nothing stored in front.', 'Label every breaker (408.4); 200 A is the common new-home service; size per the load calc.', 'Smoke + CO alarms interconnected + on a protected circuit (R314/R315).'])
    + guideList('🧵 Wire gauge × ampacity (Cu, 75°C)', ['15A→14 AWG · 20A→12 · 30A→10 · 40A→8 · 50A→6 · 100A→#3 · 200A→2/0 (or 4/0 Al).', 'Derate for conduit fill + ambient temperature; a 100A subfeed is typically #4 Cu / #2 Al.', 'Match the breaker to the SMALLEST wire on the circuit — never protect 14 AWG with a 20A breaker.'])
    + guideList('⏚ Grounding + bonding (250)', ['Grounding electrode system: two ground rods 6 ft apart (+ a Ufer/concrete-encased electrode where available).', 'Main bonding jumper ties neutral to ground at the SERVICE ONLY.', 'Subpanels keep neutral + ground SEPARATE on a 4-wire feeder; bond the gas + water piping.'])
  if (c) body.innerHTML += `<div style="${SEC}"><div style="${GH}">📐 Interactive device layout — coming next</div><div style="font-size:13px;color:var(--ink)">A drag-and-drop device layout (drop receptacles/switches/lights into rooms → auto circuits + homeruns + the 6-ft check) is the next upgrade. For now, use the <b>Quick build</b> presets in the sidebar and the E-1 panel schedule + E-2 details on the 2D Plans tab.</div></div>`
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.service_size_a} A`, 'service'], [`${c.total_circuits}`, 'circuits'], [`${(c.total_demand_va / 1000).toFixed(1)} kVA`, 'demand'], [`${c.receptacles}`, 'receptacles'], [`${c.lights}`, 'fixtures']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
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
    const prim = toks.find(t => /\d|wire|breaker|panel|receptacle|switch|box|romex/.test(t)) || toks[0]
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
const NUMF = { bedrooms: '#bedrooms', bathrooms: '#bathrooms', electric_range: '#range', electric_dryer: '#dryer', hvac_amps: '#hvac' }
const CHKF = { has_laundry: '#laundry', water_heater_elec: '#whelec', dishwasher: '#dw', disposal: '#disp', microwave: '#mw' }
const syncInputs = () => { for (const [k, id] of Object.entries(NUMF)) { const e = $(id); if (e) e.value = cfg[k] } for (const [k, id] of Object.entries(CHKF)) { const e = $(id); if (e) e.checked = !!cfg[k] } }
const PRESETS = {
  bedroom: { label: '➕ Bedroom', add: { bedrooms: 1 } },
  bath: { label: '➕ Bathroom', add: { bathrooms: 1 } },
  kitchen: { label: '➕ Kitchen', set: { electric_range: 1, dishwasher: true, disposal: true, microwave: true } },
  laundry: { label: '➕ Laundry', set: { has_laundry: true }, add: { electric_dryer: 1 } },
  wh: { label: '➕ Electric WH', set: { water_heater_elec: true } },
  hvac: { label: '➕ HVAC 30A', add: { hvac_amps: 30 } },
}
const recompute = () => {
  out = callCore(cfg)
  if (out.error) { $('#warns').innerHTML = `<div class="warn">${out.error}</div>`; return }
  persist(); rebuild3D(); renderPlans(); renderMat(); renderWarns(); renderGuide(); renderBest(); updatePermits()
}
const initUI = () => {
  const bind = (id, key) => { const el = $(id); if (!el) return; el.value = cfg[key]; el.onchange = () => { cfg[key] = +el.value; recompute() } }
  bind('#sqft', 'sqft')
  for (const [k, id] of Object.entries(NUMF)) bind(id, k)
  const chk = (id, key) => { const el = $(id); if (!el) return; el.checked = !!cfg[key]; el.onchange = e => { cfg[key] = e.target.checked; recompute() } }
  for (const [k, id] of Object.entries(CHKF)) chk(id, k)
  const pwrap = $('#presets')
  if (pwrap) pwrap.innerHTML = Object.entries(PRESETS).map(([k, v]) => `<button class="seg-b" data-preset="${k}">${v.label}</button>`).join('') + '<button class="seg-b" data-preset="__clear" style="color:#d88">✖ Clear all</button>'
  pwrap && pwrap.querySelectorAll('button[data-preset]').forEach(b => b.onclick = () => {
    const p = b.dataset.preset
    if (p === '__clear') { for (const k of Object.keys(NUMF)) cfg[k] = 0; for (const k of Object.keys(CHKF)) cfg[k] = false }
    else { const d = PRESETS[p]; if (d.add) for (const [k, v] of Object.entries(d.add)) cfg[k] = (+cfg[k] || 0) + v; if (d.set) for (const [k, v] of Object.entries(d.set)) cfg[k] = v }
    syncInputs(); recompute()
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
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'elec-materials.csv' }).click()
  }
  $('#dl-svg').onclick = () => { ['layout', 'details'].forEach(k => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `elec-${k}.svg` }); a.click() }) }
  initPermits(() => ({ ...cfg, height: 0, attach: 'free', length: 0, depth: 0 }), () => out)
}
const SK_LS = 'amnielec.sketch.v2'
const elecTrade = makeElecTrade()
let sketchScene = (() => { try { const s = JSON.parse(localStorage.getItem(SK_LS)); if (s && s.nodes) return s } catch (e) {} return emptyScene(24) })()
const seedScene = () => {
  if (!out || !out.calc || sketchScene.nodes.length) return
  const sc = sketchScene, sp = sc.scalePxPerFt = 24
  const W = Math.max(12, Math.round(Math.sqrt((+cfg.sqft || 1200) * 1.3))), D = Math.max(10, Math.round((+cfg.sqft || 1200) / W))
  sc.floorCal = { w: W, d: D }
  const place = (type, fx, fz, rot) => addNode(sc, type, fx * sp, fz * sp, { fx, fz, rot: rot || 0 })
  const panel = place('panel', 0.6, 0.6, 0)
  const nr = Math.min(+out.calc.receptacles || 0, 20)
  let prev = panel
  for (let i = 0; i < nr; i++) { const t = (i + 0.5) / nr * 4, side = Math.floor(t), f = t - side, e = side === 0 ? [0.5 + f * (W - 1), 0.5] : side === 1 ? [W - 0.5, 0.5 + f * (D - 1)] : side === 2 ? [W - 0.5 - f * (W - 1), D - 0.5] : [0.5, D - 0.5 - f * (D - 1)]; const id = place('recept', e[0], e[1]); addRun(sc, 'nm142', i % 8 === 0 ? panel : prev, id); prev = id }
  const nl = Math.min(+out.calc.lights || 0, 14), gc = Math.max(1, Math.round(Math.sqrt(nl * W / D))), gr = Math.max(1, Math.ceil(nl / gc))
  prev = panel
  for (let i = 0; i < nl; i++) { const r = Math.floor(i / gc), cr = i % gc, c = r % 2 ? gc - 1 - cr : cr; const id = place('light', W * (c + 0.8) / (gc + 0.6), D * (r + 0.8) / (gr + 0.6)); addRun(sc, 'nm142', i === 0 ? panel : prev, id); prev = id }
  const appl = [[+cfg.electric_range || 0, 'range', 'nm63'], [+cfg.electric_dryer || 0, 'dryer', 'nm103'], [cfg.dishwasher ? 1 : 0, 'dishwasher', 'nm122'], [cfg.microwave ? 1 : 0, 'microwave', 'nm122'], [cfg.water_heater_elec ? 1 : 0, 'waterheater', 'nm103'], [(+cfg.hvac_amps || 0) > 0 ? 1 : 0, 'hvac', 'nm103']]
  let ax = 3.5
  for (const [n, type, wire] of appl) for (let j = 0; j < n; j++) { const id = place(type, Math.min(W - 2, ax), D - 3); addRun(sc, wire, panel, id); ax += 3.4 }
  try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {}
}
function setupSketch() { const host = $('#sketch-host'); if (!host) return; mountSketch(host, { scene: sketchScene, trade: elecTrade, catalog, store: 'hd', onChange: sc => { try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {} } }) }
catalog = await fetch('catalog.json').then(r => r.json()).catch(() => ({}))
initUI()
resize()
recompute()
seedScene()
setupSketch()


function maybeScanBanner() {
  let scan; try { scan = JSON.parse(localStorage.getItem('amni_scan')) } catch (e) {}
  if (!scan || !scan.area_ft2 || Date.now() - (scan.ts || 0) > 86400000) return
  const side = document.querySelector('#side'); if (!side) return
  const b = document.createElement('button')
  b.style.cssText = 'display:block;width:100%;padding:9px;margin-bottom:12px;background:var(--bg);border:1px dashed var(--acc);color:var(--acc);border-radius:8px;cursor:pointer;font-weight:600;font-size:13px'
  b.textContent = '\u{1F4D0} Use my scan area (' + scan.area_ft2 + ' ft²)'
  side.insertBefore(b, side.firstChild)
  b.onclick = () => { cfg.sqft = Math.round(scan.area_ft2); const e = document.querySelector('#sqft'); if (e) e.value = cfg.sqft; recompute(); b.textContent = '✓ Using ' + cfg.sqft + ' ft² from your scan'; b.style.color = 'var(--ok)'; b.style.borderColor = 'var(--ok)' }
}

maybeScanBanner()
