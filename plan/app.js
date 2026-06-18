import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
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
const groundMat = new THREE.MeshStandardMaterial({ color: 0x3e5e36, roughness: 1 })
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.02
scene.add(ground)
const KCOL = { bedroom: 0xd9e4f0, bath: 0xd6eef0, kitchen: 0xf0e6d2, living: 0xe4f0e0, dining: 0xe4f0e0, laundry: 0xefe0ea, garage: 0xe4e6e8, hall: 0xeceff2, office: 0xeae0f0, other: 0xeceff2 }
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  if (!out || !out.rooms) return
  for (const r of out.rooms) {
    const g = new THREE.BoxGeometry(r.w, 8, r.d)
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: KCOL[r.kind] ?? 0xeceff2, roughness: 0.9, transparent: true, opacity: 0.5 }))
    m.position.set(r.x + r.w / 2, 4, -(r.y + r.d / 2))
    grp.add(m)
    const eg = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x5a6470 }))
    eg.position.copy(m.position); grp.add(eg)
  }
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
