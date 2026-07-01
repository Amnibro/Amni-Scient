import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { initPermits, updatePermits } from './codes.js?v=fix1'
const LS = 'amniplan.cfg.v1', LSP = 'amniplan.prices.v1'
const defCfg = { w: 40, d: 30, house_edge: 0, rooms: [{ name: 'Living', kind: 'living', w: 18, d: 14 }, { name: 'Kitchen', kind: 'kitchen', w: 13, d: 12 }, { name: 'Bed 1', kind: 'bedroom', w: 13, d: 12 }, { name: 'Bed 2', kind: 'bedroom', w: 12, d: 11 }, { name: 'Bath', kind: 'bath', w: 8, d: 6 }, { name: 'Bath 2', kind: 'bath', w: 7, d: 5 }, { name: 'Laundry', kind: 'laundry', w: 7, d: 6 }] }
let cfg = (() => { try { return { ...defCfg, ...JSON.parse(localStorage.getItem(LS)) } } catch { return { ...defCfg } } })()
let out = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch { return {} } })()
let catalog = {}
const $ = s => document.querySelector(s)
const wasm = await WebAssembly.instantiateStreaming(fetch('plan_core.wasm?v=2'))
const { alloc, dealloc, build, memory } = wasm.instance.exports
const enc = new TextEncoder(), dec = new TextDecoder()
const callCore = c => {
  const payload = enc.encode(JSON.stringify({ rooms: (c.rooms || []).map(r => ({ name: r.name || '', kind: r.kind || 'other', w: +r.w || 10, d: +r.d || 10 })), issue_date: new Date().toLocaleDateString('en-CA') }))
  const p = alloc(payload.length)
  new Uint8Array(memory.buffer, p, payload.length).set(payload)
  const rp = build(p, payload.length)
  const len = new DataView(memory.buffer).getUint32(rp, true)
  const res = JSON.parse(dec.decode(new Uint8Array(memory.buffer, rp + 4, len)))
  dealloc(p, payload.length); dealloc(rp, len + 4)
  return res
}
const mkTex = (rep, draw) => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; draw(cv.getContext('2d')); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t }
const grassTex = mkTex(60, g => { g.fillStyle = '#4d7c3a'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { g.fillStyle = `hsl(${100 + Math.random() * 30},${34 + Math.random() * 26}%,${21 + Math.random() * 18}%)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2) } })
const scene = new THREE.Scene()
const skyCv = document.createElement('canvas'); skyCv.width = 4; skyCv.height = 256
{ const s = skyCv.getContext('2d'), gr = s.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#4d8fc9'); gr.addColorStop(0.5, '#9cc4e6'); gr.addColorStop(1, '#dcebf6'); s.fillStyle = gr; s.fillRect(0, 0, 4, 256) }
scene.background = new THREE.CanvasTexture(skyCv)
scene.fog = new THREE.Fog(0xcfe2f2, 110, 360)
const cam = new THREE.PerspectiveCamera(50, 2, 0.1, 2000)
cam.position.set(22, 18, 30)
const renderer = new THREE.WebGLRenderer({ canvas: $('#c3d'), antialias: true })
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose()
const controls = new OrbitControls(cam, $('#c3d'))
controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2 - 0.04
scene.add(new THREE.HemisphereLight(0xcfe4f5, 0x52733f, 1.3))
const sun = new THREE.DirectionalLight(0xfff3df, 2.2); sun.position.set(34, 54, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 300 })
const fill = new THREE.DirectionalLight(0xe2edf6, 0.55); fill.position.set(-22, 28, 60)
scene.add(sun, fill, new THREE.AmbientLight(0xffffff, 0.24))
const grp = new THREE.Group()
scene.add(grp)
const _gadd = grp.add.bind(grp); grp.add = (...o) => { o.forEach(m => m.traverse && m.traverse(x => { x.isMesh && (x.castShadow = x.receiveShadow = true) })); return _gadd(...o) }
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.03
ground.receiveShadow = true
scene.add(ground)
const KCOL = { bedroom: 0xd9e4f0, bath: 0xd6eef0, kitchen: 0xf0e6d2, living: 0xe4f0e0, dining: 0xe4f0e0, laundry: 0xefe0ea, garage: 0xe4e6e8, hall: 0xeceff2, office: 0xeae0f0, other: 0xeceff2 }
const txtSprite = (text, sub) => { const c = document.createElement('canvas'); c.width = 256; c.height = 80; const x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,0.92)'; x.fillRect(0, 0, 256, 80); x.strokeStyle = '#8a96a0'; x.lineWidth = 3; x.strokeRect(2, 2, 252, 76); x.fillStyle = '#16222e'; x.font = 'bold 34px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, sub ? 30 : 40); if (sub) { x.fillStyle = '#5a6470'; x.font = '24px system-ui,sans-serif'; x.fillText(sub, 128, 58) } const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); s.scale.set(3.2, 1.0, 1); return s }
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.traverse && m.traverse(o => o.geometry && o.geometry.dispose()) }
  if (!out || !out.rooms) return
  cfg.roomPos = cfg.roomPos || {}
  const wmat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.85 })
  for (const r of out.rooms) {
    const ov = cfg.roomPos[r.name], rx = ov ? ov[0] : r.x, ry = ov ? ov[1] : r.y
    const cx = rx + r.w / 2, cz = -(ry + r.d / 2), wh = 2.6, tt = 0.22
    const grm = new THREE.Group(); grm.position.set(cx, 0, cz); grm.userData.drag = { name: r.name, w: r.w, d: r.d }; grm.rotation.y = ov && ov[2] != null ? ov[2] : 0
    const floor = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.16, r.d), new THREE.MeshStandardMaterial({ color: KCOL[r.kind] ?? 0xeceff2, roughness: 0.92 })); floor.position.y = 0.08; grm.add(floor)
    for (const [bw, bd, ox, oz] of [[r.w, tt, 0, -r.d / 2], [r.w, tt, 0, r.d / 2], [tt, r.d, -r.w / 2, 0], [tt, r.d, r.w / 2, 0]]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(bw, wh, bd), wmat); wall.position.set(ox, wh / 2 + 0.16, oz); grm.add(wall) }
    const lbl = txtSprite(r.name || r.kind, `${Math.round(r.w)}' × ${Math.round(r.d)}'`); lbl.position.set(0, wh + 1.3, 0); grm.add(lbl)
    grp.add(grm)
  }
}
const dray = new THREE.Raycaster(), dptr = new THREE.Vector2(), dplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
let dragO = null, dmode = 'm', dsx0 = 0, dsr0 = 0; const dragOff = new THREE.Vector3()
const dSetPtr = e => { const r = $('#c3d').getBoundingClientRect(); dptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1) }
const dPick = () => { dray.setFromCamera(dptr, cam); for (const hh of dray.intersectObjects(grp.children, true)) { let o = hh.object; while (o && !o.userData.drag) o = o.parent; if (o) return o } return null }
const dGround = () => { dray.setFromCamera(dptr, cam); const p = new THREE.Vector3(); return dray.ray.intersectPlane(dplane, p) ? p : null }
$('#c3d').addEventListener('pointerdown', e => { dSetPtr(e); const o = dPick(); if (!o) return; dragO = o; dmode = e.shiftKey ? 'r' : 'm'; dsx0 = e.clientX; dsr0 = o.rotation.y; controls.enabled = false; $('#c3d').setPointerCapture(e.pointerId); const p = dGround(); p && (dragOff.copy(o.position).sub(p), dragOff.y = 0) })
$('#c3d').addEventListener('pointermove', e => { dSetPtr(e); if (dragO) { if (dmode === 'r') dragO.rotation.y = dsr0 + (e.clientX - dsx0) * 0.02; else { const p = dGround(); p && (dragO.position.x = p.x + dragOff.x, dragO.position.z = p.z + dragOff.z) } return } $('#c3d').style.cursor = dPick() ? 'grab' : '' })
$('#c3d').addEventListener('pointerup', () => { if (!dragO) return; const u = dragO.userData.drag, rot = +dragO.rotation.y.toFixed(3); let nx = Math.round((dragO.position.x - u.w / 2) * 2) / 2, ny = Math.round((-dragO.position.z - u.d / 2) * 2) / 2
  if (Math.abs(rot) < 0.05 && out && out.rooms) { const S = 1.2; for (const r2 of out.rooms) { if (r2.name === u.name) continue; const o2 = cfg.roomPos[r2.name], x2 = o2 ? o2[0] : r2.x, y2 = o2 ? o2[1] : r2.y; if (Math.abs(nx - (x2 + r2.w)) < S) nx = x2 + r2.w; else if (Math.abs(nx + u.w - x2) < S) nx = x2 - u.w; else if (Math.abs(nx - x2) < S) nx = x2; if (Math.abs(ny - (y2 + r2.d)) < S) ny = y2 + r2.d; else if (Math.abs(ny + u.d - y2) < S) ny = y2 - u.d; else if (Math.abs(ny - y2) < S) ny = y2 } }
  dragO.position.set(nx + u.w / 2, 0, -(ny + u.d / 2)); cfg.roomPos[u.name] = [nx, ny, rot]; persist(); dragO = null; controls.enabled = true })
$('#c3d').addEventListener('dblclick', e => { dSetPtr(e); const o = dPick(); if (!o) return; o.rotation.y += Math.PI / 2; const u = o.userData.drag, nx = Math.round((o.position.x - u.w / 2) * 2) / 2, ny = Math.round((-o.position.z - u.d / 2) * 2) / 2; cfg.roomPos[u.name] = [nx, ny, +o.rotation.y.toFixed(3)]; persist() })
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
const G_LS = 'amniplan.guide.v1'
let gChk = (() => { try { return JSON.parse(localStorage.getItem(G_LS)) || {} } catch { return {} } })()
const renderGuide = () => {
  const body = $('#guide-body'); if (!body || !out) return
  const c = out.calc
  const phases = [
    ['📐 Define the rooms', ['Add every room with real dimensions — the app totals net area + footprint as you go.', 'Group by floor; keep wet rooms (kitchen/baths/laundry) stacked + back-to-back to shorten plumbing.', 'Note door/window walls + the main entry; think about sun + circulation.']],
    ['🧭 Check zoning FIRST', ['Confirm setbacks (front/side/rear), max lot coverage / FAR, and height limit before you fall in love with a layout.', 'Find easements + flood/septic/wetland constraints; call the zoning office + 811 early.', 'HOA or overlay district? Get their rules in writing.']],
    ['📊 Size each trade  (sheet FP-2, card 4)', ['Use the linked trade apps to size + price each scope from this plan: <b>Floor</b> (area), <b>Roof</b> + <b>Frame</b> (footprint), <b>Plumb</b> (fixtures), <b>Elec</b> (loads).', 'Each opens with your location so its codes + permit office are already set.']],
    ['📋 Assemble the permit set', ['Most new construction needs: site plan, floor plans, elevations, structural, and MEP — usually STAMPED by a design pro.', 'Submit, then expect a plan-review cycle + revisions before the permit issues.']],
    ['🏗️ Build in sequence  (sheet FP-2, card 1)', ['Foundation → frame → roof/dry-in → rough plumbing/electrical/HVAC → insulate → drywall → floor → trim → final.', 'Each trade pulls its own permit + passes its own inspection in this order.']],
    ['🔎 Inspection milestones  (sheet FP-2, card 3)', ['Footing/foundation → framing (after rough trades) → rough MEP → insulation/energy → final.', 'Nothing gets covered until the inspection for that stage passes.']],
  ]
  const tools = ['This planner (room list + FP-1/FP-2 sheets)', 'Local zoning bylaw + a plot/survey', 'The trade apps: Floor / Roof / Frame / Plumb / Elec', 'A design pro / architect for stamped plans', 'Budget + lender pre-qual', 'Contractor quotes (3+)']
  const chk = phases.map((ph, pi) => `<div style="${SEC}"><div style="${GH}">${ph[0]}</div>${ph[1].map((t, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''} style="margin-top:3px;accent-color:var(--acc);flex:none"><span style="${on ? 'color:var(--mut);text-decoration:line-through' : ''}">${t}</span></label>` }).join('')}</div>`).join('')
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">How to take your <b>${c.room_count}-room / ${c.total_area.toFixed(0)} ft²</b> plan from sketch to permit. Tick as you go. Pair with sheets FP-1 (floor plan) + FP-2 (trade + zoning checklist). <b style="color:var(--warn)">This is a planning tool — a real build needs stamped plans + permits.</b></div>`
    + chk
    + guideList('🧰 Planning checklist', tools)
    + `<div style="${SEC}"><div style="${GH}">💵 Cost</div><div style="font-size:13px;color:var(--ink)">This planner doesn't price materials — open each <b>trade app</b> (Floor, Roof, Frame, Plumb, Elec, Deck, Patio, Pool, Garden) for its own live Home-Depot estimate, then add labor + permits + design fees.</div></div>`
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.room_count}`, 'rooms'], [`${c.total_area.toFixed(0)} ft²`, 'net area'], [`${c.footprint_area.toFixed(0)} ft²`, 'footprint'], [`${c.bedrooms}/${c.baths}`, 'bed/bath'], [`${c.perimeter.toFixed(0)} lf`, 'perimeter']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
  const rollup = [
    ['🪵 Floor', 'floor', `~${Math.ceil(c.total_area * 1.08 / 24)} boxes to finish ${c.total_area.toFixed(0)} ft²`],
    ['🏠 Roof', 'roof', `~${(c.footprint_area * 1.3 * 1.118 / 100).toFixed(1)} squares over ${c.footprint_area.toFixed(0)} ft²`],
    ['🔩 Frame', 'frame', `~${c.perimeter.toFixed(0)} lf of exterior wall to frame`],
    ['🚿 Plumb', 'plumb', `${c.toilets} WC, ${c.lavs + c.kitchen_sinks} sinks, ${c.showers} bath, ${c.washers} laundry`],
    ['⚡ Elec', 'elec', `${c.total_area.toFixed(0)} ft², ${c.bedrooms} bed / ${c.baths} bath -> size service`],
    ['🛠️ Deck', 'deck', 'add a deck off this plan'],
    ['🧱 Patio', 'patio', 'add a patio / walkway'],
    ['🏊 Pool', 'pool', 'size a pool for the yard'],
    ['🌱 Garden', 'garden', 'plan raised beds for the yard'],
  ]
  $('#mat-table').innerHTML = `<tr><th>Trade app</th><th>From this plan</th><th></th></tr>` + rollup.map(([t, slug, txt]) => `<tr><td><b>${t}</b></td><td>${txt}</td><td><a href="../${slug}/" target="_blank">open ↗</a></td></tr>`).join('')
}
const persist = () => localStorage.setItem(LS, JSON.stringify(cfg))
const KINDS = ['bedroom', 'bath', 'kitchen', 'living', 'dining', 'laundry', 'garage', 'hall', 'office', 'other']
const fld = 'background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:5px;padding:3px 6px'
const renderRoomList = () => {
  const wrap = $('#roomlist'); if (!wrap) return
  wrap.innerHTML = ''
  cfg.rooms.forEach((rm, i) => {
    const div = document.createElement('div')
    div.style.cssText = 'background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:7px;margin:6px 0;position:relative'
    div.innerHTML = `<button class="rm" title="remove" style="position:absolute;right:6px;top:5px;background:none;border:none;color:#d66;cursor:pointer;font-size:13px">✕</button>
      <input type="text" data-k="name" value="${(rm.name || '').replace(/"/g, '&quot;')}" placeholder="Room name" style="width:76%;margin-bottom:5px;${fld}">
      <div style="display:flex;gap:5px;align-items:center">
        <select data-k="kind" style="flex:1;${fld}">${KINDS.map(k => `<option value="${k}">${k}</option>`).join('')}</select>
        <input type="number" data-k="w" min="3" max="80" value="${rm.w}" title="width (ft)" style="width:46px;${fld}">
        <span style="color:var(--mut)">×</span>
        <input type="number" data-k="d" min="3" max="80" value="${rm.d}" title="depth (ft)" style="width:46px;${fld}">
      </div>`
    div.querySelector('select').value = rm.kind
    div.querySelectorAll('[data-k]').forEach(el => el.onchange = () => { const k = el.dataset.k; rm[k] = (k === 'name' || k === 'kind') ? el.value : parseFloat(el.value); persist(); recompute() })
    div.querySelector('.rm').onclick = () => { cfg.rooms.splice(i, 1); renderRoomList(); persist(); recompute() }
    wrap.appendChild(div)
  })
}
const recompute = () => {
  out = callCore(cfg)
  if (out.error) { $('#warns').innerHTML = `<div class="warn">${out.error}</div>`; persist(); return }
  cfg.w = out.calc.footprint_w; cfg.d = out.calc.footprint_d
  persist(); rebuild3D()
  const fw = out.calc.footprint_w, fd = out.calc.footprint_d, s = Math.max(fw, fd, 12)
  controls.target.set(fw / 2, 0, -fd / 2)
  cam.position.set(fw / 2 + s * 0.65, s * 0.95, -fd / 2 + s * 0.95)
  renderPlans(); renderMat(); renderWarns(); renderGuide(); updatePermits()
}
const initUI = () => {
  renderRoomList()
  $('#addroom').onclick = () => { cfg.rooms.push({ name: 'Room ' + (cfg.rooms.length + 1), kind: 'bedroom', w: 12, d: 11 }); renderRoomList(); persist(); recompute() }
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t))
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === `pane-${t.dataset.pane}`))
    $('#hud').style.display = t.dataset.pane === '3d' ? 'block' : 'none'
  })
  const on = (id, fn) => { const el = $(id); el && (el.onclick = fn) }
  on('#dl-svg', () => { ['layout', 'details'].forEach(k => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `plan-${k}.svg` }); a.click() }) })
  on('#export-csv', () => {
    const rows = [['Room', 'Kind', 'W (ft)', 'D (ft)', 'Area (ft²)'], ...cfg.rooms.map(r => [r.name || r.kind, r.kind, r.w, r.d, (r.w * r.d).toFixed(0)])]
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })), download: 'plan-rooms.csv' }).click()
  })
  initPermits(() => ({ ...cfg, height: 0, attach: cfg.house_edge >= 0 ? 'house' : 'free', length: 0, depth: 0 }), () => out)
}
catalog = await fetch('catalog.json').then(r => r.json()).catch(() => ({}))
initUI()
resize()
recompute()
