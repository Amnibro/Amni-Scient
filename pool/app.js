import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
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
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  const poly = polyOf(cfg)
  const shape = new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], p[1])))
  const avgD = ((+cfg.shallow_in + +cfg.deep_in) / 2) / 12
  const mk = (depth, mat, yBottom) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.y = yBottom; grp.add(m); return m }
  mk(0.5, new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.85 }), -avgD - 0.5)
  mk(avgD, new THREE.MeshPhysicalMaterial({ color: FINISHES[cfg.finish][0], transparent: true, opacity: 0.78, roughness: 0.1, metalness: 0 }), -avgD)
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
  let cost = 0; (out.bom || []).forEach(it => { const p = price(it.id, 'hd'); if (p != null) cost += p * it.qty })
  const chk = phases.map((ph, pi) => `<div style="${SEC}"><div style="${GH}">${ph[0]}</div>${ph[1].map((t, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''} style="margin-top:3px;accent-color:var(--acc);flex:none"><span style="${on ? 'color:var(--mut);text-decoration:line-through' : ''}">${t}</span></label>` }).join('')}</div>`).join('')
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">A build sequence for your <b>${c.gallons.toLocaleString()}-gal ${ig ? 'in-ground' : 'above-ground'}</b> pool. Tick as you go. Pair with sheets PL-1 (plan), PL-2 (section) + PL-3 (details). <b style="color:var(--warn)">Bonding, the gas heater + shell work usually need licensed pros.</b></div>`
    + chk
    + guideList('🔍 Inspections', ['<b>Excavation / steel</b> before concrete (in-ground).', '<b>Bonding</b> + electrical rough before backfill.', '<b>Barrier + final</b> — gate, alarms, dual drains — before first use.'])
    + guideList('🧰 Tools', tools)
    + `<div style="${SEC}"><div style="${GH}">💵 Materials estimate</div><div style="font-size:13px;color:var(--ink)">~<b style="color:var(--ok)">$${cost.toFixed(0)}</b> in materials/equipment (Home Depot catalog) — edit prices on the Materials tab. Excavation, gunite/liner + labor are the big extras.</div></div>`
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.gallons.toLocaleString()}`, 'gallons'], [`${c.turnover_gpm.toFixed(0)} gpm`, 'turnover (8 h)'], [`${c.pump_hp} hp`, 'pump'], [`${c.filter_sqft} ft²`, 'filter'], [`${c.excavation_yd3.toFixed(1)} yd³`, 'excavation']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
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
    cfg.polygon = scan.polygon.map(p => [+p[0], +p[1]]); cfg.mode = 'poly'
    const edges = cfg.polygon.map((a, i) => { const c = cfg.polygon[(i + 1) % cfg.polygon.length]; return Math.hypot(c[0] - a[0], c[1] - a[1]) })
    cfg.house_edge = edges.indexOf(Math.max.apply(null, edges))
    document.querySelectorAll('#mode button').forEach(x => x.classList.toggle('on', x.dataset.v === 'poly'))
    const rw = document.querySelector('#rw'), rd = document.querySelector('#rd'); if (rw) rw.style.display = 'none'; if (rd) rd.style.display = 'none'
    const sel = document.querySelector('#house')
    if (sel) { sel.innerHTML = '<option value="-1">Freestanding</option>' + edges.map((L, i) => '<option value="' + i + '">Edge ' + (i + 1) + ' (' + L.toFixed(1) + ' ft) = house</option>').join(''); sel.value = String(cfg.house_edge) }
    if (window.__deckApplyMode) window.__deckApplyMode()
    recompute()
    b.textContent = '✓ Using your scan (' + scan.area_ft2 + ' ft²)'; b.style.color = 'var(--ok)'; b.style.borderColor = 'var(--ok)'
  }
}

maybeScanBanner()
