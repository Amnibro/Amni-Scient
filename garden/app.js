import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { initPermits, updatePermits } from './codes.js?v=fix1'
const LS = 'amnigarden.cfg.v1', LSP = 'amnigarden.prices.v1'
const defCfg = { soil_depth_in: 10, beds: [
  { name: 'Tomatoes', plant: 'tomato', w_ft: 4, l_ft: 8, spacing_in: 0 },
  { name: 'Salad greens', plant: 'lettuce', w_ft: 4, l_ft: 6, spacing_in: 0 },
  { name: 'Carrots & roots', plant: 'carrot', w_ft: 3, l_ft: 6, spacing_in: 0 },
  { name: 'Beans', plant: 'bean', w_ft: 4, l_ft: 8, spacing_in: 0 },
] }
let cfg = (() => { try { return { ...defCfg, ...JSON.parse(localStorage.getItem(LS)) } } catch { return { ...defCfg } } })()
let out = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch { return {} } })()
let catalog = {}
const $ = s => document.querySelector(s)
const wasm = await WebAssembly.instantiateStreaming(fetch('garden_core.wasm?v=1'))
const { alloc, dealloc, build, memory } = wasm.instance.exports
const enc = new TextEncoder(), dec = new TextDecoder()
const callCore = c => {
  const payload = enc.encode(JSON.stringify({ beds: (c.beds || []).map(b => ({ name: b.name || '', plant: b.plant || 'tomato', w_ft: +b.w_ft || 4, l_ft: +b.l_ft || 8, spacing_in: +b.spacing_in || 0 })), soil_depth_in: +c.soil_depth_in || 10, issue_date: new Date().toLocaleDateString('en-CA') }))
  const p = alloc(payload.length)
  new Uint8Array(memory.buffer, p, payload.length).set(payload)
  const rp = build(p, payload.length)
  const len = new DataView(memory.buffer).getUint32(rp, true)
  const res = JSON.parse(dec.decode(new Uint8Array(memory.buffer, rp + 4, len)))
  dealloc(p, payload.length); dealloc(rp, len + 4)
  return res
}
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x182018)
const cam = new THREE.PerspectiveCamera(50, 2, 0.1, 800)
cam.position.set(16, 14, 20)
const renderer = new THREE.WebGLRenderer({ canvas: $('#c3d'), antialias: true })
const controls = new OrbitControls(cam, $('#c3d'))
controls.enableDamping = true
scene.add(new THREE.AmbientLight(0xffffff, 0.7))
const sun = new THREE.DirectionalLight(0xfff4e0, 1.1)
sun.position.set(30, 40, 18)
scene.add(sun)
const grp = new THREE.Group()
scene.add(grp)
const groundMat = new THREE.MeshStandardMaterial({ color: 0x49693e, roughness: 1 })
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat)
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.02
scene.add(ground)
const PCOL = { tomato: 0xe0533b, pepper: 0xe0a03b, lettuce: 0x7cc24a, carrot: 0xe08a3b, bean: 0x5fae5f, cucumber: 0x3b9e5f, squash: 0xe0c23b, kale: 0x3b7a4a, onion: 0xc2a86a, garlic: 0xcbb89a, herb: 0x6fae5f, strawberry: 0xd34a5f, flower: 0xd36fae }
const rebuild3D = () => {
  while (grp.children.length) { const m = grp.children.pop(); m.geometry && m.geometry.dispose() }
  if (!out || !out.beds) return
  const h = 1
  for (const b of out.beds) {
    const g = new THREE.BoxGeometry(b.w, h, b.l)
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x6b4a26, roughness: 1 }))
    m.position.set(b.x + b.w / 2, h / 2, -(b.y + b.l / 2))
    grp.add(m)
    const eg = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x3a2a14 }))
    eg.position.copy(m.position); grp.add(eg)
    const dr = Math.min(b.rows, 6), dc = Math.min(b.per_row, 10)
    const dot = new THREE.SphereGeometry(Math.min(b.w / dc, b.l / dr) * 0.2, 6, 5)
    const dmat = new THREE.MeshStandardMaterial({ color: PCOL[b.plant] ?? 0x5fae5f, roughness: 0.7 })
    for (let i = 0; i < dr; i++) for (let j = 0; j < dc; j++) {
      const s = new THREE.Mesh(dot, dmat)
      s.position.set(b.x + b.w * (j + 0.5) / dc, h + 0.12, -(b.y + b.l * (i + 0.5) / dr))
      grp.add(s)
    }
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
  const w = $('#warns'); w.innerHTML = '<h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--acc);margin:16px 0 8px">Garden Notes</h3>'
  if (!out) return
  for (const s of out.warnings) { const [tag, txt] = s.includes('|') ? s.split('|') : ['INFO', s]; const d = document.createElement('div'); d.className = 'warn' + (tag === 'OK' ? ' ok' : tag === 'PLANT' ? ' info' : tag === 'INFO' ? ' info' : ''); d.textContent = txt; w.appendChild(d) }
}
const G_LS = 'amnigarden.guide.v1'
let gChk = (() => { try { return JSON.parse(localStorage.getItem(G_LS)) || {} } catch { return {} } })()
const SEC = 'background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:14px', GH = 'font-size:15px;color:var(--acc);margin-bottom:6px;font-weight:600'
const guideList = (title, items) => `<div style="${SEC}"><div style="${GH}">${title}</div><ul style="list-style:disc;padding-left:20px;font-size:13px;line-height:1.7;color:var(--ink)">${items.map(t => `<li>${t}</li>`).join('')}</ul></div>`
const renderGuide = () => {
  const body = $('#guide-body'); if (!body || !out) return
  const c = out.calc
  const phases = [
    ['🧭 Plan + site the beds', ['Pick a spot with 6-8 h of sun, near a water source, on fairly level ground.', 'Lay out your beds here; keep them ≤4 ft wide so you can reach the middle from either side.', 'Raised beds usually need no permit — check setbacks for anything over ~6 ft (sheds/greenhouses) + any HOA rules.']],
    ['🔨 Build the bed frames  (sheet GD-2, detail 1)', ['Cut 2x10 ground-contact (or cedar) boards to length; screw corners with brackets, check square + level.', 'Set on the ground over cardboard or landscape fabric to smother weeds; add a gravel base if drainage is poor.']],
    ['🪱 Fill + prep the soil', [`Fill ~${c.soil_depth_in.toFixed(0)}" deep with a mix near 60% topsoil / 30% compost / 10% aeration — about ${c.soil_yd3.toFixed(1)} yd³ soil + ${c.compost_yd3.toFixed(1)} yd³ compost.`, 'Water it in and let it settle a day; top up + rake level before planting.']],
    ['🌱 Plant by spacing  (sheet GD-1 + GD-2, detail 2)', ['Transplant warm crops after your last frost; direct-sow cool crops earlier (see the Garden Notes schedule).', 'Follow the spacing on GD-1; put the tallest plants on the north side so they don’t shade the rest.', 'Add a trellis for tomatoes, cukes, beans + peas.']],
    ['💧 Mulch + water  (sheet GD-2, detail 4)', [`Lay drip lines down each row (~${c.drip_ft.toFixed(0)} ft total) on a timer; water deep + early.`, 'Mulch 2-3" to hold moisture and block weeds.']],
    ['🧺 Tend + harvest', ['Weed weekly, side-dress heavy feeders, and scout for pests early.', 'Succession-sow greens every 2-3 wk; plant fall crops 8-10 wk before first frost; harvest often to keep plants producing.']],
  ]
  const tools = ['Cordless drill + driver bits', 'Circular or hand saw', 'Speed square + tape', 'Level', 'Wheelbarrow', 'Garden rake + hoe', 'Trowel + transplanter', 'Gloves', 'Hose / watering can', 'Drip kit + scissors']
  let cost = 0; (out.bom || []).forEach(it => { const p = price(it.id, 'hd'); if (p != null) cost += p * it.qty })
  const chk = phases.map((ph, pi) => `<div style="${SEC}"><div style="${GH}">${ph[0]}</div>${ph[1].map((t, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''} style="margin-top:3px;accent-color:var(--acc);flex:none"><span style="${on ? 'color:var(--mut);text-decoration:line-through' : ''}">${t}</span></label>` }).join('')}</div>`).join('')
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">A season plan for your <b>${c.bed_count} beds / ${c.total_area.toFixed(0)} ft² / ${c.total_plants} plants</b>. Tick as you go. Pair with sheets GD-1 (layout) + GD-2 (details).</div>`
    + chk
    + guideList('🌤️ Notes', ['Most vegetables need <b>6-8 h of full sun</b> — site beds accordingly.', 'Raised beds usually need <b>no permit</b>; check setbacks + HOA for structures.', 'Drip + mulch cut watering dramatically; water deeply, not daily.', 'Rotate plant families each year + feed heavy feeders (tomatoes, squash, corn).'])
    + guideList('🧰 Tools', tools)
    + `<div style="${SEC}"><div style="${GH}">💵 Materials estimate</div><div style="font-size:13px;color:var(--ink)">~<b style="color:var(--ok)">$${cost.toFixed(0)}</b> in lumber, soil, compost + drip (Home Depot catalog) — edit prices on the Materials tab. Seedlings + seed are extra.</div></div>`
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const renderMat = () => {
  if (!out) return
  const c = out.calc
  $('#mat-summary').innerHTML = [[`${c.bed_count}`, 'beds'], [`${c.total_area.toFixed(0)} ft²`, 'growing'], [`${c.total_plants}`, 'plants'], [`${c.soil_yd3.toFixed(1)} yd³`, 'soil'], [`${c.drip_ft.toFixed(0)} lf`, 'drip']].map(([b, s]) => `<div class="chip"><b>${b}</b><span>${s}</span></div>`).join('')
  const tot = store => out.bom.reduce((s, it) => { const p = price(it.id, store); return s + (p != null ? p * it.qty : 0) }, 0)
  const row = it => { const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes'); return `<tr><td>${it.desc}</td><td>${it.qty}</td><td><input data-id="${it.id}" data-store="hd" value="${ph ?? ''}" placeholder="—"></td><td>${ph != null ? '$' + (ph * it.qty).toFixed(2) : '—'}</td><td><input data-id="${it.id}" data-store="lowes" value="${pl ?? ''}" placeholder="—"></td><td>${pl != null ? '$' + (pl * it.qty).toFixed(2) : '—'}</td></tr>` }
  const th = tot('hd'), tl = tot('lowes')
  $('#mat-table').innerHTML = `<tr><th>Item</th><th>Qty</th><th>HD each</th><th>HD total</th><th>Lowes each</th><th>Lowes total</th></tr>` + out.bom.map(row).join('') + `<tr><td colspan="3" class="tot">Total</td><td class="tot ${th && (!tl || th <= tl) ? 'best' : ''}">${th ? '$' + th.toFixed(0) : '—'}</td><td></td><td class="tot ${tl && (!th || tl < th) ? 'best' : ''}">${tl ? '$' + tl.toFixed(0) : '—'}</td></tr>`
  $('#mat-table').querySelectorAll('input[data-id]').forEach(el => el.onchange = () => { const v = parseFloat(el.value); const key = `${el.dataset.id}.${el.dataset.store}`; if (v > 0) priceEdits[key] = v; else delete priceEdits[key]; localStorage.setItem(LSP, JSON.stringify(priceEdits)); renderMat() })
}
const parsePaste = (text, store) => {
  const filled = []
  const norm = text.toLowerCase()
  for (const it of out.bom) {
    const c = catalog[it.id]
    if (!c) continue
    const toks = (store === 'hd' ? c.hdq : c.lq).toLowerCase().split(/\s+/).filter(t => t.length > 1)
    const prim = toks.find(t => /\d|soil|compost|mulch|fabric|drip|board|bracket|screw|plant/.test(t)) || toks[0]
    let best = null, idx = norm.indexOf(prim)
    while (idx !== -1) {
      const win = norm.slice(Math.max(0, idx - 160), idx + 360)
      const hits = toks.filter(t => win.includes(t)).length
      const pm = win.match(/\$\s?(\d{1,4})\.(\d{2})/)
      if (pm && hits >= Math.min(2, toks.length)) { const p = parseFloat(`${pm[1]}.${pm[2]}`); if (p > 0.1 && p < 5000 && (!best || hits > best.hits)) best = { p, hits } }
      idx = norm.indexOf(prim, idx + 1)
    }
    if (best) { priceEdits[`${it.id}.${store}`] = best.p; filled.push(it.id) }
  }
  localStorage.setItem(LSP, JSON.stringify(priceEdits))
  return filled
}
const persist = () => localStorage.setItem(LS, JSON.stringify(cfg))
const PLANTS = ['tomato', 'pepper', 'lettuce', 'carrot', 'bean', 'cucumber', 'squash', 'kale', 'onion', 'garlic', 'herb', 'strawberry', 'flower']
const fld = 'background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:5px;padding:3px 6px'
const renderBedList = () => {
  const wrap = $('#bedlist'); if (!wrap) return
  wrap.innerHTML = ''
  cfg.beds.forEach((bd, i) => {
    const div = document.createElement('div')
    div.style.cssText = 'background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:7px;margin:6px 0;position:relative'
    div.innerHTML = `<button class="rm" title="remove" style="position:absolute;right:6px;top:5px;background:none;border:none;color:#d66;cursor:pointer;font-size:13px">✕</button>
      <input type="text" data-k="name" value="${(bd.name || '').replace(/"/g, '&quot;')}" placeholder="Bed name" style="width:76%;margin-bottom:5px;${fld}">
      <select data-k="plant" style="width:100%;margin-bottom:5px;${fld}">${PLANTS.map(p => `<option value="${p}">${p}</option>`).join('')}</select>
      <div style="display:flex;gap:5px;align-items:center">
        <input type="number" data-k="w_ft" min="1" max="20" value="${bd.w_ft}" title="width (ft)" style="width:42px;${fld}">
        <span style="color:var(--mut)">×</span>
        <input type="number" data-k="l_ft" min="1" max="60" value="${bd.l_ft}" title="length (ft)" style="width:42px;${fld}">
        <span style="color:var(--mut);font-size:11px">@</span>
        <input type="number" data-k="spacing_in" min="0" max="48" value="${bd.spacing_in || ''}" placeholder="auto" title="plant spacing in inches (0 = auto by plant)" style="width:50px;${fld}">
        <span style="color:var(--mut);font-size:11px">in</span>
      </div>`
    div.querySelector('select').value = bd.plant
    div.querySelectorAll('[data-k]').forEach(el => el.onchange = () => { const k = el.dataset.k; bd[k] = (k === 'name' || k === 'plant') ? el.value : (parseFloat(el.value) || 0); persist(); recompute() })
    div.querySelector('.rm').onclick = () => { cfg.beds.splice(i, 1); renderBedList(); persist(); recompute() }
    wrap.appendChild(div)
  })
}
const recompute = () => {
  out = callCore(cfg)
  if (out.error) { $('#warns').innerHTML = `<div class="warn">${out.error}</div>`; persist(); return }
  persist(); rebuild3D()
  const fw = out.calc.footprint_w, fd = out.calc.footprint_d, s = Math.max(fw, fd, 12)
  controls.target.set(fw / 2, 0, -fd / 2)
  cam.position.set(fw / 2 + s * 0.6, s * 0.85, -fd / 2 + s * 0.9)
  renderPlans(); renderMat(); renderWarns(); renderGuide(); updatePermits()
}
const initUI = () => {
  const bind = (id, key) => { const el = $(id); if (!el) return; el.value = cfg[key]; el.onchange = () => { cfg[key] = +el.value; persist(); recompute() } }
  renderBedList()
  bind('#soil-depth', 'soil_depth_in')
  $('#addbed').onclick = () => { cfg.beds.push({ name: 'Bed ' + (cfg.beds.length + 1), plant: 'tomato', w_ft: 4, l_ft: 8, spacing_in: 0 }); renderBedList(); persist(); recompute() }
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t))
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === `pane-${t.dataset.pane}`))
    $('#hud').style.display = t.dataset.pane === '3d' ? 'block' : 'none'
  })
  $('#paste-hd').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'hd'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} HD prices` : 'no prices matched — copy the whole store page (Ctrl+A, Ctrl+C)'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#paste-lowes').onclick = async () => { try { const txt = await navigator.clipboard.readText(); const f = parsePaste(txt, 'lowes'); $('#pstatus').textContent = f.length ? `✅ filled ${f.length} Lowes prices` : 'no prices matched — copy the whole store page'; renderMat() } catch { $('#pstatus').textContent = 'clipboard blocked — click the page first' } }
  $('#open-all-hd').onclick = () => out && out.bom.slice(0, 8).forEach(it => catalog[it.id]?.hdq && window.open(`https://www.homedepot.com/s/${encodeURIComponent(catalog[it.id].hdq)}`, '_blank'))
  $('#reset-prices').onclick = () => { priceEdits = {}; localStorage.removeItem(LSP); renderMat() }
  $('#export-csv').onclick = () => {
    const csv = ['Item,Qty,HD each,HD total,Lowes each,Lowes total', ...out.bom.map(it => { const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes'); return `"${it.desc}",${it.qty},${ph ?? ''},${ph != null ? (ph * it.qty).toFixed(2) : ''},${pl ?? ''},${pl != null ? (pl * it.qty).toFixed(2) : ''}` })].join('\n')
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'garden-beds.csv' }).click()
  }
  $('#dl-svg').onclick = () => { ['layout', 'details'].forEach(k => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `garden-${k}.svg` }); a.click() }) }
  initPermits(() => ({ ...cfg, height: 0, attach: 'free', length: 0, depth: 0 }), () => out)
}
catalog = await fetch('catalog.json').then(r => r.json()).catch(() => ({}))
initUI()
resize()
recompute()
