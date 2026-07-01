import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { initPermits, updatePermits } from './codes.js?v=fix1'
import { initMapTrace, sitePlanSVG, cropForPlan, mapPlanSnapshot } from './maptrace.js?v=1'
import { initAutoDetect } from './autodetect.js?v=1'
const LS = 'amniframe.cfg.v1', LSP = 'amniframe.prices.v1'
const defCfg = { mode: 'rect', w: 40, d: 30, polygon: null, wall_height_ft: 8, spacing: 16, stud_size: '2x4', doors: 2, windows: 6, double_top_plate: true, sheathing: true, house_edge: 0 }
let cfg = (() => { try { return { ...defCfg, ...JSON.parse(localStorage.getItem(LS)) } } catch { return { ...defCfg } } })()
let out = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch { return {} } })()
let catalog = {}
const $ = s => document.querySelector(s)
const FINISHES = { '2x4': ['#e0c187', '2x4 stud'], '2x6': ['#caa46a', '2x6 stud'] }
const wasm = await WebAssembly.instantiateStreaming(fetch('frame_core.wasm?v=2'))
const { alloc, dealloc, build, memory } = wasm.instance.exports
const enc = new TextEncoder(), dec = new TextDecoder()
const polyOf = c => c.mode === 'poly' && c.polygon && c.polygon.length >= 3 ? c.polygon : [[0, 0], [c.w, 0], [c.w, c.d], [0, c.d]]
const callCore = c => {
  const payload = enc.encode(JSON.stringify({ polygon: polyOf(c), wall_height_ft: +c.wall_height_ft, spacing: +c.spacing, stud_size: c.stud_size, doors: +c.doors, windows: +c.windows, double_top_plate: !!c.double_top_plate, sheathing: !!c.sheathing, issue_date: new Date().toLocaleDateString('en-CA') }))
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
scene.fog = new THREE.Fog(0xcfe2f2, 95, 320)
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
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 260 })
const fill = new THREE.DirectionalLight(0xe2edf6, 0.55); fill.position.set(-22, 28, 60)
scene.add(sun, fill, new THREE.AmbientLight(0xffffff, 0.24))
const grp = new THREE.Group()
scene.add(grp)
const _gadd = grp.add.bind(grp); grp.add = (...o) => { o.forEach(m => m.traverse && m.traverse(x => { x.isMesh && (x.castShadow = x.receiveShadow = true) })); return _gadd(...o) }
let photoPlane = null, photoMeta = null
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.03
ground.receiveShadow = true
scene.add(ground)
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  const poly = polyOf(cfg)
  const shape = new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], p[1])))
  const H = Math.max(7, +cfg.wall_height_ft)
  const studMat = new THREE.MeshStandardMaterial({ color: FINISHES[cfg.stud_size][0], roughness: 0.82 })
  const th = cfg.stud_size === '2x6' ? 0.458 : 0.292, sw = 0.125, oc = Math.max(8, +cfg.spacing) / 12
  const openQ = []
  for (let d = 0; d < (+cfg.doors || 0); d++) openQ.push({ w: 3, sill: 0, head: 6.8, win: false })
  for (let w = 0; w < (+cfg.windows || 0); w++) openQ.push({ w: 3, sill: 3, head: 6.5, win: true })
  let qi = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.1) continue
    const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len
    const stud = (t, hgt, yc) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sw, hgt, th), studMat); m.position.set(a[0] + dx * t, yc, -(a[1] + dy * t)); m.rotation.y = ang; grp.add(m) }
    const horiz = (t, hgt, yc, wd) => { const m = new THREE.Mesh(new THREE.BoxGeometry(wd, hgt, th), studMat); m.position.set(a[0] + dx * t, yc, -(a[1] + dy * t)); m.rotation.y = ang; grp.add(m) }
    horiz(len / 2, 0.125, 0.06, len)
    for (let k = 0; k < (cfg.double_top_plate ? 2 : 1); k++) horiz(len / 2, 0.125, H - 0.06 - k * 0.13, len)
    const slots = Math.max(0, Math.floor(len / 7)), myOpen = []
    for (let sIdx = 0; sIdx < slots && qi < openQ.length; sIdx++) myOpen.push({ ...openQ[qi++], c: len * (sIdx + 0.5) / slots })
    const nStud = Math.floor(len / oc + 1e-6)
    for (let s = 0; s <= nStud; s++) { const t = Math.min(s * oc, len - 0.07); if (myOpen.some(o => Math.abs(t - o.c) < o.w / 2 + 0.15)) continue; stud(t, H - 0.26, H / 2) }
    for (const o of myOpen) {
      for (const sgn of [-1, 1]) stud(Math.min(Math.max(o.c + sgn * (o.w / 2 + 0.14), 0.1), len - 0.1), H - 0.26, H / 2)
      horiz(o.c, 0.32, o.head + 0.16, o.w + 0.5)
      for (const sgn of [-1, 1]) stud(o.c + sgn * o.w / 2, o.head, o.head / 2)
      if (o.win) { horiz(o.c, 0.16, o.sill, o.w + 0.3); for (const f of [0.34, 0.66]) stud(o.c - o.w / 2 + o.w * f, o.sill, o.sill / 2) }
    }
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
  ;['layout', 'details'].forEach(k => $(`#svg-${k}`).innerHTML = out.svgs[k])
  if (siteSnap) {
    let wrap = $('#svg-site')
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'svgwrap'; wrap.id = 'svg-site'; const pane = $('#pane-plans'); pane.insertBefore(wrap, pane.querySelector('.svgwrap')) }
    wrap.innerHTML = sitePlanSVG({ ...siteSnap, title: siteSnap.northUp ? 'SITE PLAN — BUILDING' : 'REFERENCE SKETCH — BUILDING', footprint: `Proposed: ${out.calc.wall_length_ft.toFixed(0)} lf exterior wall @ ${cfg.wall_height_ft} ft, ${out.calc.studs} studs` })
  }
}
const renderWarns = () => {
  const w = $('#warns'); w.innerHTML = '<h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--acc);margin:16px 0 8px">Build Notes</h3>'
  if (!out) return
  for (const s of out.warnings) { const [tag, txt] = s.includes('|') ? s.split('|') : ['INFO', s]; const d = document.createElement('div'); d.className = 'warn' + (tag === 'OK' ? ' ok' : tag === 'INFO' ? ' info' : ''); d.textContent = txt; w.appendChild(d) }
}
const G_LS = 'amniframe.guide.v1'
let gChk = (() => { try { return JSON.parse(localStorage.getItem(G_LS)) || {} } catch { return {} } })()
const SEC = 'background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:14px', GH = 'font-size:15px;color:var(--acc);margin-bottom:6px;font-weight:600'
const guideList = (title, items) => `<div style="${SEC}"><div style="${GH}">${title}</div><ul style="list-style:disc;padding-left:20px;font-size:13px;line-height:1.7;color:var(--ink)">${items.map(t => `<li>${t}</li>`).join('')}</ul></div>`
const renderGuide = () => {
  const body = $('#guide-body'); if (!body || !out) return
  const c = out.calc, dbl = !!cfg.double_top_plate
  const phases = [
    ['📋 Layout + plate marking', ['Snap the wall lines on the slab/deck; verify square with the 3-4-5 rule.', 'Cut top + bottom plates together; mark stud, king, corner + partition layout on both at once.', 'Tag each opening (door/window) with its rough-opening width on the plate.']],
    ['🔩 Sill / bottom plate', ['PT bottom plate on concrete over sill sealer; never bare wood on masonry.', `Anchor every ${c.anchor_bolts ? c.anchor_bolts + ' bolts' : 'bolt'} — ≤6 ft OC and within 12" of each plate end + corner.`, 'Seal the plate-to-slab joint against air + moisture.']],
    ['🏗️ Build walls flat', ['Lay studs at ' + cfg.spacing + '" OC; nail through the plate into each stud end (2× 16d).', 'Build headers (2-ply + 1/2" spacer to match wall thickness); set kings, then jacks under the header, cripples above + below.', 'Sheathe the wall flat on the deck if you can — it squares + braces it.']],
    ['⬆️ Stand, plumb + brace', ['Tip walls up; nail the bottom plate to the floor framing/anchors.', 'Plumb the corners + string the top plate straight; add temp braces.', 'Nail intersecting corners + partitions together.']],
    ['➕ Double top plate  (sheet FR-2, detail 4)', [dbl ? 'Add the 2nd top plate — lap corners + every lower-plate joint by ≥24"; tie partitions in.' : 'Single top plate is non-bearing only — bearing/exterior walls need a lapped DOUBLE top plate.', 'Overlaps create the continuous tension tie around the building.']],
    ['🪵 Sheathing + shear  (sheet FR-2, detail 1)', [cfg.sheathing ? 'Structural sheathing nailed per the schedule (6" edges / 12" field); stagger panels.' : 'No sheathing selected — provide R602.10 braced-wall panels or let-in/metal bracing for shear.', 'House wrap over sheathing, laps shingle-style; flash all openings.']],
    ['✅ Fire-block + inspection', ['Fire-block stud bays at 10 ft max and at every floor/ceiling line.', 'Pass rough plumbing/electrical/mechanical FIRST, then call the framing inspection.', 'Nothing gets covered (insulation/drywall) until framing passes.']],
  ]
  const tools = ['Framing nailer + compressor (or 22 oz framing hammer)', 'Circular saw + sharp blade', 'Speed square + framing square', 'Chalk line', '4-ft level + plumb / post level', 'Tape (25 ft) + pencil', 'Sledge / dead-blow (tip + nudge walls)', 'Pry bar + cat’s paw', 'String line for straightening plates', 'Temp brace stock + screws', 'Ladders + sawhorses']
  let cost = 0; (out.bom || []).forEach(it => { const p = price(it.id, 'hd'); if (p != null) cost += p * it.qty })
  const chk = phases.map((ph, pi) => `<div style="${SEC}"><div style="${GH}">${ph[0]}</div>${ph[1].map((t, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''} style="margin-top:3px;accent-color:var(--acc);flex:none"><span style="${on ? 'color:var(--mut);text-decoration:line-through' : ''}">${t}</span></label>` }).join('')}</div>`).join('')
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">A pro framing sequence for ~<b>${c.wall_length_ft.toFixed(0)} lf of ${cfg.stud_size} wall</b> at ${cfg.wall_height_ft} ft. Tick as you go. Pair with sheets FR-1 (elevation) + FR-2 (details).</div>`
    + chk
    + guideList('🔍 Inspections', ['Rough <b>plumbing / electrical / mechanical</b> must pass before the framing inspection.', 'Framing inspection covers: nailing, headers, straps/hold-downs, fire-blocking, bracing.', 'Keep the stamped plans + a tape on site — the inspector spot-checks dimensions.'])
    + guideList('🧰 Tools', tools)
    + `<div style="${SEC}"><div style="${GH}">💵 Materials estimate</div><div style="font-size:13px;color:var(--ink)">~<b style="color:var(--ok)">$${cost.toFixed(0)}</b> in lumber + hardware (Home Depot catalog) — edit prices on the Materials tab. Labor for framing typically adds $4-9/ft² of wall.</div></div>`
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.studs}`, 'studs'], [`${c.plate_boards}`, 'plate boards'], [`${c.sheathing_sheets}`, 'OSB 4x8'], [`${c.wall_length_ft.toFixed(0)} lf`, 'wall'], [`${c.openings}`, 'openings']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
  let th = 0, tl = 0
  const rows = out.bom.map(it => {
    const cat = catalog[it.id] || {}
    const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes')
    ph != null && (th += ph * it.qty); pl != null && (tl += pl * it.qty)
    const link = (store, q) => q ? `<a href="https://www.${store === 'hd' ? 'homedepot' : 'lowes'}.com/s/${encodeURIComponent(q)}" target="_blank" rel="noopener">↗</a>` : ''
    return `<tr><td>${it.desc}</td><td>${it.qty}</td><td><input data-id="${it.id}" data-store="hd" value="${ph ?? ''}"> ${link('hd', cat.hdq)}</td><td>${ph != null ? '$' + (ph * it.qty).toFixed(2) : '—'}</td><td><input data-id="${it.id}" data-store="lowes" value="${pl ?? ''}"> ${link('lowes', cat.lq)}</td><td>${pl != null ? '$' + (pl * it.qty).toFixed(2) : '—'}</td></tr>`
  }).join('')
  const fa = (() => { const p = polyOf(cfg); return Math.abs(p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + (q[0] * r[1] - r[0] * q[1]) }, 0)) / 2 })()
  const allIn = `<tr><td colspan="6" style="padding-top:16px"><div style="background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px"><div style="color:var(--acc);font-weight:600;margin-bottom:6px">💪 Installed / all-in estimate</div><div style="font-size:13px;color:var(--ink)">Materials <b>$${th.toFixed(0)}</b> + typical framing labor <b>$${(fa * 2).toFixed(0)}–$${(fa * 4).toFixed(0)}</b> (${fa.toFixed(0)} ft² × $2–$4/ft²) = <b style="color:var(--ok)">$${(th + fa * 2).toFixed(0)}–$${(th + fa * 4).toFixed(0)} installed</b></div><div style="font-size:12px;color:var(--mut);margin-top:5px">Hire it out and labor typically adds this range; DIY and it's near $0. Rough regional guide — get local quotes.</div></div></td></tr>`
  $('#mat-table').innerHTML = `<tr><th>Item</th><th>Qty</th><th>HD $</th><th>HD total</th><th>Lowes $</th><th>Lowes total</th></tr>${rows}<tr><td class="tot">TOTALS</td><td></td><td></td><td class="tot ${th <= tl ? 'best' : ''}">$${th.toFixed(2)}</td><td></td><td class="tot ${tl < th ? 'best' : ''}">$${tl.toFixed(2)}</td></tr>${allIn}`
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
    d.className = 'sw' + (cfg.stud_size === k ? ' on' : '')
    d.style.background = hex
    d.innerHTML = `<span>${name}</span>`
    d.onclick = () => { cfg.stud_size = k; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === d)); recompute() }
    sw.appendChild(d)
  })
}
const initUI = () => {
  const bind = (id, key, num = true) => { const el = $(id); el.value = cfg[key]; el.onchange = () => { cfg[key] = num ? +el.value : el.value; recompute() } }
  bind('#w', 'w'); bind('#d', 'd'); bind('#height', 'wall_height_ft'); bind('#spacing', 'spacing', false); bind('#doors', 'doors'); bind('#windows', 'windows'); bind('#house', 'house_edge')
  $('#dbltop').checked = !!cfg.double_top_plate
  $('#dbltop').onchange = e => { cfg.double_top_plate = e.target.checked; recompute() }
  $('#sheathe').checked = !!cfg.sheathing
  $('#sheathe').onchange = e => { cfg.sheathing = e.target.checked; recompute() }
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
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'frame-materials.csv' })
    a.click()
  }
  $('#dl-svg').onclick = () => { ['layout', 'details'].forEach(k => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `frame-${k}.svg` }); a.click() }); const sw = $('#svg-site'); sw && Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([sw.innerHTML], { type: 'image/svg+xml' })), download: 'frame-site-plan.svg' }).click() }
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
    if (window.__deckApplyMode) window.__deckApplyMode()
    applyPoly(scan.polygon)
    b.textContent = '✓ Using your scan (' + scan.area_ft2 + ' ft²)'; b.style.color = 'var(--ok)'; b.style.borderColor = 'var(--ok)'
  }
}

maybeScanBanner()
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
  try { const m = await import('./shape-edit.js?v=se1'); shapeEd = m.mountShapeEditor(host, { rect: { w: +cfg.w, d: +cfg.d }, polygon: cfg.mode === 'poly' ? cfg.polygon : null, houseEdge: cfg.house_edge, onApply: ({ polygon, houseEdge }) => { applyPoly(polygon, houseEdge); const t = document.querySelector('.tab[data-pane="3d"]'); if (t) t.click() } }) }
  catch (e) { host.innerHTML = '<div style="padding:20px;color:#9aa0aa">draw tool unavailable</div>' }
}
function maybePlanBanner() {
  let plan; try { plan = JSON.parse(localStorage.getItem('amni_construct_plan')) } catch (e) {}
  if (!plan || !plan.polygon || plan.polygon.length < 3 || Date.now() - (plan.ts || 0) > 86400000) return
  const side = document.querySelector('#side'); if (!side) return
  const b = document.createElement('button')
  b.style.cssText = 'display:block;width:100%;padding:9px;margin-bottom:12px;background:var(--bg);border:1px dashed var(--acc2);color:var(--acc2);border-radius:8px;cursor:pointer;font-weight:600;font-size:13px'
  b.textContent = '🏠 Use my house plan (' + (+plan.area_ft2 || 0).toFixed(0) + ' ft²)'
  side.insertBefore(b, side.firstChild)
  b.onclick = () => { applyPoly(plan.polygon); b.textContent = '✓ Using your house plan'; b.style.color = 'var(--ok)'; b.style.borderColor = 'var(--ok)' }
}
maybePlanBanner()
