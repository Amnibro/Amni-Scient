import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { initPermits, updatePermits } from './codes.js?v=240'
import { initMapTrace, sitePlanSVG, cropForPlan, mapPlanSnapshot } from './maptrace.js?v=240'
const LS = 'amnideck.cfg.v2', LSP = 'amnideck.prices.v1'
const defCfg = { length: 12, depth: 8, height: 16, spacing: 16, decking: 'pt', attach: 'ledger', stain: 'redwood', stairs: [{ side: 'front', width: 48, offset: -1 }], railing: { front: false, left: false, right: false, style: 'wood' }, door: { pos: -1, width: 60, rise: 7 } }
const migrate = c => !c ? null : (Array.isArray(c.stairs) ? c : { ...c, stain: c.stain || 'redwood', door: c.door || { pos: -1, width: 60, rise: 7 }, stairs: c.stairs?.enabled ? [{ side: c.stairs.side, width: c.stairs.width, offset: c.stairs.offset }] : [] })
let cfg = migrate(JSON.parse(localStorage.getItem(LS) || localStorage.getItem('amnideck.cfg.v1') || 'null')) || structuredClone(defCfg)
let priceEdits = JSON.parse(localStorage.getItem(LSP) || '{}')
let catalog = {}, core = null, out = null
const $ = s => document.querySelector(s)
const wasmReady = fetch('deck_core.wasm?v=240').then(r => r.arrayBuffer()).then(b => WebAssembly.instantiate(b, {})).then(w => core = w.instance.exports)
const catReady = fetch('catalog.json').then(r => r.json()).then(j => catalog = j)
const callCore = c => {
  const bytes = new TextEncoder().encode(JSON.stringify({ ...c, issue_date: new Date().toLocaleDateString('en-CA') }))
  const ip = core.alloc(bytes.length)
  new Uint8Array(core.memory.buffer, ip, bytes.length).set(bytes)
  const op = core.build(ip, bytes.length)
  const len = new DataView(core.memory.buffer).getUint32(op, true)
  const res = JSON.parse(new TextDecoder().decode(new Uint8Array(core.memory.buffer, op + 4, len)))
  core.dealloc(ip, bytes.length)
  core.dealloc(op, len + 4)
  return res
}
const STAINS = { natural: ['#c9a05c', 'Natural PT'], cedar: ['#b5803f', 'Cedar'], redwood: ['#9c5233', 'Redwood'], brown: ['#7a563a', 'Coffee'], gray: ['#8b8d90', 'Gray'], walnut: ['#5d4630', 'Walnut'] }
const woodCanvas = (base, vertical) => {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 256
  const g = cv.getContext('2d')
  g.fillStyle = base
  g.fillRect(0, 0, 256, 256)
  const c = new THREE.Color(base)
  for (let i = 0; i < 130; i++) {
    const sh = (Math.random() - 0.5) * 0.16
    const col = c.clone().offsetHSL(0.004 * (Math.random() - 0.5), 0, sh)
    g.strokeStyle = `#${col.getHexString()}`
    g.lineWidth = 0.6 + Math.random() * 2.4
    g.beginPath()
    const p = Math.random() * 256, drift = (Math.random() - 0.5) * 22
    vertical ? (g.moveTo(p, -10), g.bezierCurveTo(p + drift, 80, p - drift, 180, p + drift, 266)) : (g.moveTo(-10, p), g.bezierCurveTo(80, p + drift, 180, p - drift, 266, p + drift))
    g.stroke()
  }
  for (let i = 0; i < 7; i++) {
    const x = Math.random() * 256, y = Math.random() * 256
    g.fillStyle = `#${c.clone().offsetHSL(0, 0.04, -0.18).getHexString()}`
    g.beginPath()
    g.ellipse(x, y, 2.5 + Math.random() * 3.5, 1.4 + Math.random() * 2, Math.random() * 3.14, 0, 6.3)
    g.fill()
  }
  const tx = new THREE.CanvasTexture(cv)
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping
  return tx
}
let matCache = {}
const buildMats = () => {
  Object.values(matCache).flat?.()
  matCache = {}
  const stainHex = STAINS[cfg.stain]?.[0] || STAINS.natural[0]
  const fam = (key, hex, rough, jitter, n) => matCache[key] = Array.from({ length: n }, (_, i) => {
    const c = new THREE.Color(hex).offsetHSL(0, 0, (i / (n - 1) - 0.5) * jitter)
    return new THREE.MeshStandardMaterial({ color: c, map: woodCanvas(`#${c.getHexString()}`, i % 2 === 0), roughness: rough })
  })
  fam('pt', cfg.stain === 'natural' ? '#c9a05c' : stainHex, 0.85, 0.12, 4)
  fam('deck', stainHex, 0.74, 0.16, 6)
  matCache.comp = Array.from({ length: 4 }, (_, i) => new THREE.MeshStandardMaterial({ color: new THREE.Color('#6e6259').offsetHSL(0, 0, (i / 3 - 0.5) * 0.08), roughness: 0.55 }))
  matCache.conc = [new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.95 })]
  matCache.alum = [new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.35, metalness: 0.75 })]
}
const canvas = $('#c3d')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x8db8da)
scene.fog = new THREE.Fog(0x8db8da, 700, 1800)
const camera = new THREE.PerspectiveCamera(55, 2, 1, 4000)
camera.position.set(230, 140, 290)
const controls = new OrbitControls(camera, canvas)
controls.target.set(72, 16, 48)
controls.maxPolarAngle = Math.PI / 2 - 0.02
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6)
sun.position.set(300, 420, 180)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -350, right: 350, top: 350, bottom: -350, far: 1200 })
scene.add(sun, new THREE.HemisphereLight(0xbdd7ee, 0x3a5a2c, 0.9))
const grassTex = (() => {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const g = cv.getContext('2d')
  g.fillStyle = '#4d7c3a'
  g.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 900; i++) { g.fillStyle = `hsl(${100 + Math.random() * 30},${35 + Math.random() * 25}%,${24 + Math.random() * 16}%)`; g.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5) }
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(40, 40)
  return t
})()
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }))
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)
let deckGroup = new THREE.Group(), houseGroup = new THREE.Group()
scene.add(deckGroup, houseGroup)
const buildHouse = () => {
  houseGroup.clear()
  const l = cfg.length * 12
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.9 })
  const sidCv = document.createElement('canvas')
  sidCv.width = 64; sidCv.height = 64
  const sg = sidCv.getContext('2d')
  sg.fillStyle = '#f2f0ea'; sg.fillRect(0, 0, 64, 64)
  sg.strokeStyle = '#d8d4ca'
  for (let y = 0; y < 64; y += 8) { sg.beginPath(); sg.moveTo(0, y); sg.lineTo(64, y); sg.stroke() }
  const st = new THREE.CanvasTexture(sidCv)
  st.wrapS = st.wrapT = THREE.RepeatWrapping
  st.repeat.set(6, 2)
  wallMat.map = st
  const wall = new THREE.Mesh(new THREE.BoxGeometry(l + 160, 130, 10), wallMat)
  wall.position.set(l / 2, 65, -5.1)
  wall.receiveShadow = wall.castShadow = true
  houseGroup.add(wall)
  const doorX = cfg.door.pos < 0 ? l / 2 : Math.min(Math.max(cfg.door.pos * 12, cfg.door.width / 2), l - cfg.door.width / 2)
  const sillY = cfg.height + (cfg.door.rise || 0)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(cfg.door.width + 6, 84, 3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }))
  frame.position.set(doorX, sillY + 40, -0.5)
  const glass = new THREE.Mesh(new THREE.BoxGeometry(cfg.door.width - 4, 76, 1.5), new THREE.MeshPhysicalMaterial({ color: 0x9ec5e8, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55 }))
  glass.position.set(doorX, sillY + 41, 0.6)
  const divider = new THREE.Mesh(new THREE.BoxGeometry(2.4, 76, 2), new THREE.MeshStandardMaterial({ color: 0x888888 }))
  divider.position.set(doorX, sillY + 41, 1)
  houseGroup.add(frame, glass, divider)
  const win = new THREE.Mesh(new THREE.BoxGeometry(40, 34, 2), new THREE.MeshPhysicalMaterial({ color: 0xaecfe8, roughness: 0.1, transparent: true, opacity: 0.6 }))
  win.position.set(doorX + cfg.door.width / 2 + 50, sillY + 52, 0.2)
  const winFrame = new THREE.Mesh(new THREE.BoxGeometry(44, 38, 1.5), new THREE.MeshStandardMaterial({ color: 0xffffff }))
  winFrame.position.set(doorX + cfg.door.width / 2 + 50, sillY + 52, -0.3)
  houseGroup.add(winFrame, win)
}
const stairMeshes = []
const rebuild3D = () => {
  deckGroup.clear()
  stairMeshes.length = 0
  let mi = 0
  for (const b of out.boxes) {
    const fam = matCache[b.m] || matCache.pt
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.s[0], b.s[1], b.s[2]), fam[mi++ % fam.length])
    m.position.set(b.p[0], b.p[1], b.p[2])
    m.rotation.set(b.r[0] * Math.PI / 180, b.r[1] * Math.PI / 180, b.r[2] * Math.PI / 180)
    m.castShadow = m.receiveShadow = true
    if (b.g != null) { m.userData.stair = b.g; stairMeshes.push(m) }
    deckGroup.add(m)
  }
  buildHouse()
}
const ray = new THREE.Raycaster()
const ptr = new THREE.Vector2()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
let dragging = -1, hover = -1
const setPtr = e => {
  const r = canvas.getBoundingClientRect()
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
}
const pickStair = e => {
  setPtr(e)
  ray.setFromCamera(ptr, camera)
  const hit = ray.intersectObjects(stairMeshes, false)[0]
  return hit ? hit.object.userData.stair : -1
}
let dragRAF = false
canvas.addEventListener('pointerdown', e => {
  const s = pickStair(e)
  if (s >= 0) { dragging = s; controls.enabled = false; canvas.setPointerCapture(e.pointerId) }
})
canvas.addEventListener('pointermove', e => {
  if (dragging < 0) { const h = pickStair(e); h !== hover && (hover = h, canvas.style.cursor = h >= 0 ? 'grab' : ''); return }
  setPtr(e)
  ray.setFromCamera(ptr, camera)
  const pt = new THREE.Vector3()
  if (!ray.ray.intersectPlane(groundPlane, pt)) return
  const l = cfg.length * 12, dp = cfg.depth * 12
  const st = cfg.stairs[dragging]
  if (!st) return
  const dF = Math.abs(pt.z - dp), dL = Math.abs(pt.x - 0), dR = Math.abs(pt.x - l)
  const min = Math.min(dF, dL, dR)
  st.side = min === dF ? 'front' : min === dL ? 'left' : 'right'
  const along = st.side === 'front' ? pt.x : pt.z
  const elen = st.side === 'front' ? l : dp
  st.offset = Math.min(Math.max(along - st.width / 2, 0), elen - st.width)
  if (!dragRAF) { dragRAF = true; requestAnimationFrame(() => { dragRAF = false; recompute(false) }) }
})
canvas.addEventListener('pointerup', () => { if (dragging >= 0) { dragging = -1; controls.enabled = true; persist(); renderStairList() } })
const resize = () => {
  const w = canvas.clientWidth, h = canvas.clientHeight
  if (canvas.width !== w || canvas.height !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() }
}
const tick = () => { resize(); controls.update(); renderer.render(scene, camera); requestAnimationFrame(tick) }
const price = (id, store) => priceEdits[`${id}.${store}`] ?? catalog[id]?.[store] ?? null
const link = (id, store) => {
  const c = catalog[id]
  const q = encodeURIComponent(c ? (store === 'hd' ? c.hdq : c.lq) : (out.bom.find(b => b.id === id)?.desc || id))
  return store === 'hd' ? `https://www.homedepot.com/s/${q}` : `https://www.lowes.com/search?searchTerm=${q}`
}
const money = x => x == null ? '—' : `$${x.toFixed(2)}`
const renderMat = (flashIds = []) => {
  let thd = 0, tlo = 0
  const rows = out.bom.map(it => {
    const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes')
    ph != null && (thd += ph * it.qty)
    pl != null && (tlo += pl * it.qty)
    const fl = s => flashIds.includes(`${it.id}.${s}`) ? ' class="flash"' : ''
    return `<tr><td>${it.desc}</td><td><b>${it.qty}</b></td>
      <td><input${fl('hd')} data-id="${it.id}" data-st="hd" value="${ph ?? ''}"></td><td>${money(ph != null ? ph * it.qty : null)}</td><td><a href="${link(it.id, 'hd')}" target="_blank">HD ↗</a></td>
      <td><input${fl('lowes')} data-id="${it.id}" data-st="lowes" value="${pl ?? ''}"></td><td>${money(pl != null ? pl * it.qty : null)}</td><td><a href="${link(it.id, 'lowes')}" target="_blank">Lowes ↗</a></td></tr>`
  }).join('')
  const best = thd <= tlo ? 'Home Depot' : "Lowe's"
  $('#mat-table').innerHTML = `<tr><th>Item</th><th>Qty</th><th>HD $/ea</th><th>HD total</th><th></th><th>Lowes $/ea</th><th>Lowes total</th><th></th></tr>${rows}
    <tr><td class="tot">TOTAL</td><td></td><td></td><td class="tot ${thd <= tlo ? 'best' : ''}">${money(thd)}</td><td></td><td></td><td class="tot ${tlo < thd ? 'best' : ''}">${money(tlo)}</td><td></td></tr>`
  $('#mat-summary').innerHTML = `<div class="chip"><b>${money(Math.min(thd, tlo))}</b><span>best total (${best})</span></div>
    <div class="chip"><b>${out.calc.area.toFixed(0)} sq ft</b><span>deck area</span></div>
    <div class="chip"><b>${out.bom.reduce((a, b) => a + b.qty, 0)}</b><span>total pieces</span></div>
    <div class="chip"><b>${money(Math.abs(thd - tlo))}</b><span>spread between stores</span></div>`
  document.querySelectorAll('#mat-table input').forEach(inp => inp.onchange = () => {
    const v = parseFloat(inp.value)
    isNaN(v) ? delete priceEdits[`${inp.dataset.id}.${inp.dataset.st}`] : priceEdits[`${inp.dataset.id}.${inp.dataset.st}`] = v
    localStorage.setItem(LSP, JSON.stringify(priceEdits))
    renderMat()
  })
}
const renderCuts = () => {
  $('#cut-summary').innerHTML = `<div class="chip"><b>${out.calc.joists}</b><span>joists @ ${cfg.spacing}" OC</span></div>
    <div class="chip"><b>${out.calc.boards}</b><span>deck boards (incl. waste)</span></div>
    <div class="chip"><b>${out.calc.risers} × ${out.calc.riser}</b><span>stair risers</span></div>
    <div class="chip"><b>${out.calc.balusters}</b><span>balusters</span></div>
    ${out.calc.door_steps ? `<div class="chip"><b>${out.calc.door_steps}</b><span>door step platform(s)</span></div>` : ''}`
  $('#cut-table').innerHTML = `<tr><th>Stock</th><th>Cut length</th><th>Pieces</th><th>Boards</th><th>Use</th></tr>` +
    out.cuts.map(c => `<tr><td>${c.stock}</td><td>${c.len}</td><td>${c.count}</td><td>${c.boards}</td><td>${c.label}</td></tr>`).join('')
}
const ICONS = { WARN: ['⚠️', 'warn'], OK: ['✅', 'ok'], INFO: ['ℹ️', 'info'], CUT: ['✂️', 'info'], HOUSE: ['🏠', 'info'], FROST: ['🥶', 'warn'], PERMIT: ['📋', 'warn'] }
const renderWarns = () => {
  $('#warns').innerHTML = out.warnings.map(w => {
    const [tag, ...rest] = w.split('|')
    const [icon, cls] = ICONS[tag] || ['•', 'info']
    return `<div class="warn ${cls}">${icon} ${rest.join('|') || tag}</div>`
  }).join('')
}
let siteSnap = null
const renderPlans = () => {
  ;['framing', 'decking', 'elevation', 'stringer', 'ledger', 'connections'].forEach(k => $(`#svg-${k}`).innerHTML = out.svgs[k])
  if (siteSnap) {
    let wrap = document.getElementById('svg-site')
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'svgwrap'; wrap.id = 'svg-site'; const pane = document.getElementById('pane-plans'); pane.insertBefore(wrap, pane.querySelector('.svgwrap')) }
    wrap.innerHTML = sitePlanSVG({ ...siteSnap, title: siteSnap.northUp ? 'SITE PLAN — PROPOSED DECK' : 'REFERENCE SKETCH — PROPOSED DECK', footprint: `Proposed: ${cfg.length}' × ${cfg.depth}' ${cfg.attach === 'ledger' ? 'ledger-attached' : 'freestanding'} deck, ${cfg.height}" above grade` })
  }
}
const renderStairList = () => {
  const wrap = $('#stairlist')
  wrap.innerHTML = ''
  cfg.stairs.forEach((st, i) => {
    const div = document.createElement('div')
    div.className = 'stair-item'
    div.innerHTML = `<button class="rm" title="remove">✕</button>
      <div class="row"><label>Side</label><select data-k="side"><option value="front">Front</option><option value="left">Left</option><option value="right">Right</option></select></div>
      <div class="row"><label>Width (in)</label><input type="number" data-k="width" min="36" max="96" step="2" value="${st.width}"></div>
      <div class="row"><label>Position (in, -1=center)</label><input type="number" data-k="offset" min="-1" step="1" value="${Math.round(st.offset)}"></div>`
    div.querySelector('select').value = st.side
    div.querySelectorAll('[data-k]').forEach(el => el.onchange = () => {
      const v = el.dataset.k === 'side' ? el.value : parseFloat(el.value)
      st[el.dataset.k] = v
      recompute()
    })
    div.querySelector('.rm').onclick = () => { cfg.stairs.splice(i, 1); renderStairList(); recompute() }
    wrap.appendChild(div)
  })
}
const persist = () => localStorage.setItem(LS, JSON.stringify(cfg))
const recompute = (full = true) => {
  out = callCore(cfg)
  if (out.error) { console.error(out.error); return }
  persist()
  rebuild3D()
  full && (renderPlans(), renderMat(), renderCuts(), renderWarns(), updatePermits())
}
const parsePaste = (text, store) => {
  const filled = []
  const norm = text.toLowerCase().replace(/[ ]/g, ' ')
  for (const it of out.bom) {
    const c = catalog[it.id]
    if (!c) continue
    const toks = (store === 'hd' ? c.hdq : c.lq).toLowerCase().split(/\s+/).filter(t => t.length > 1)
    const prim = toks.find(t => /\dx\d|lus|h2|ledgerlok|\d{2}x\d{2}/.test(t)) || toks[0]
    let best = null
    let idx = norm.indexOf(prim)
    while (idx !== -1) {
      const win = norm.slice(Math.max(0, idx - 160), idx + 360)
      const hits = toks.filter(t => win.includes(t)).length
      const pm = win.match(/\$\s?(\d{1,4})\.(\d{2})/)
      if (pm && hits >= Math.min(2, toks.length)) {
        const p = parseFloat(`${pm[1]}.${pm[2]}`)
        if (p > 0.2 && p < 5000 && (!best || hits > best.hits)) best = { p, hits }
      }
      idx = norm.indexOf(prim, idx + 1)
    }
    if (best) { priceEdits[`${it.id}.${store}`] = best.p; filled.push(`${it.id}.${store}`) }
  }
  return filled
}
const initUI = () => {
  const bindNum = (id, get, set) => { const el = $(id); el.value = get(); el.oninput = () => { const v = parseFloat(el.value); !isNaN(v) && (set(v), recompute()) } }
  const bindSel = (id, get, set) => { const el = $(id); el.value = get(); el.onchange = () => { set(el.value); recompute() } }
  const bindChk = (id, get, set) => { const el = $(id); el.checked = get(); el.onchange = () => { set(el.checked); recompute() } }
  const bindSeg = (id, get, set) => {
    const seg = $(id)
    const sync = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === get()))
    seg.querySelectorAll('button').forEach(b => b.onclick = () => { set(b.dataset.v); sync(); recompute() })
    sync()
  }
  bindNum('#length', () => cfg.length, v => cfg.length = Math.max(4, v))
  bindNum('#depth', () => cfg.depth, v => cfg.depth = Math.max(4, v))
  bindNum('#height', () => cfg.height, v => cfg.height = Math.max(8, v))
  bindSel('#spacing', () => String(cfg.spacing), v => cfg.spacing = parseFloat(v))
  bindSel('#attach', () => cfg.attach, v => cfg.attach = v)
  bindSel('#decking', () => cfg.decking, v => cfg.decking = v)
  bindNum('#dr_pos', () => cfg.door.pos, v => cfg.door.pos = v)
  bindNum('#dr_w', () => cfg.door.width, v => cfg.door.width = Math.max(30, v))
  bindNum('#dr_rise', () => cfg.door.rise, v => cfg.door.rise = Math.max(0, v))
  bindChk('#rl_f', () => cfg.railing.front, v => cfg.railing.front = v)
  bindChk('#rl_l', () => cfg.railing.left, v => cfg.railing.left = v)
  bindChk('#rl_r', () => cfg.railing.right, v => cfg.railing.right = v)
  bindSeg('#rl_style', () => cfg.railing.style, v => cfg.railing.style = v)
  const sw = $('#stains')
  Object.entries(STAINS).forEach(([k, [hex, name]]) => {
    const d = document.createElement('div')
    d.className = 'sw' + (cfg.stain === k ? ' on' : '')
    d.style.background = hex
    d.innerHTML = `<span>${name}</span>`
    d.onclick = () => { cfg.stain = k; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === d)); buildMats(); recompute() }
    sw.appendChild(d)
  })
  $('#addstair').onclick = () => { cfg.stairs.push({ side: 'front', width: 48, offset: -1 }); renderStairList(); recompute() }
  initPermits(() => cfg, () => out)
  renderStairList()
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t))
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === `pane-${t.dataset.pane}`))
    $('#hud').style.display = t.dataset.pane === '3d' ? 'block' : 'none'
  })
  $('#reset-prices').onclick = () => { priceEdits = {}; localStorage.removeItem(LSP); renderMat() }
  $('#export-csv').onclick = () => {
    const csv = ['Item,Qty,HD each,HD total,Lowes each,Lowes total', ...out.bom.map(it => {
      const ph = price(it.id, 'hd'), pl = price(it.id, 'lowes')
      return `"${it.desc}",${it.qty},${ph ?? ''},${ph != null ? (ph * it.qty).toFixed(2) : ''},${pl ?? ''},${pl != null ? (pl * it.qty).toFixed(2) : ''}`
    })].join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'deck-materials.csv' })
    a.click()
  }
  $('#dl-svg').onclick = () => {
    ;['framing', 'decking', 'elevation', 'stringer', 'ledger', 'connections'].forEach(k => {
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([out.svgs[k]], { type: 'image/svg+xml' })), download: `deck-${k}.svg` })
      a.click()
    })
    const sw = document.getElementById('svg-site')
    sw && Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([sw.innerHTML], { type: 'image/svg+xml' })), download: 'deck-site-plan.svg' }).click()
  }
  const pasteFor = store => async () => {
    const st = $('#pstatus')
    try {
      const text = await navigator.clipboard.readText()
      if (!text || text.length < 40) { st.textContent = 'clipboard looks empty — copy the store page first (Ctrl+A, Ctrl+C)'; return }
      const filled = parsePaste(text, store)
      localStorage.setItem(LSP, JSON.stringify(priceEdits))
      renderMat(filled)
      st.textContent = filled.length ? `matched ${filled.length} price${filled.length > 1 ? 's' : ''} from your paste ✔` : 'no matches in that paste — try the product/cart page with items visible'
    } catch { st.textContent = 'clipboard blocked — click the page first, then retry' }
  }
  $('#paste-hd').onclick = pasteFor('hd')
  $('#paste-lowes').onclick = pasteFor('lowes')
  $('#open-all-hd').onclick = () => out.bom.slice(0, 12).forEach((it, i) => setTimeout(() => window.open(link(it.id, 'hd'), '_blank'), i * 250))
  $('#live-prices').onclick = async () => {
    const st = $('#pstatus')
    st.textContent = 'trying auto-fetch…'
    let got = 0
    for (const it of out.bom) {
      for (const store of ['hd', 'lowes']) {
        try {
          const r = await fetch(`/price?url=${encodeURIComponent(link(it.id, store))}`)
          if (r.ok) { const j = await r.json(); if (j.price) { priceEdits[`${it.id}.${store}`] = j.price; got++ } }
        } catch {}
      }
    }
    localStorage.setItem(LSP, JSON.stringify(priceEdits))
    renderMat()
    st.textContent = got ? `auto-fetched ${got} prices` : 'stores blocked it (they always do) — use the paste buttons, they work every time'
  }
}
let photoPlane = null
let MV = null
const T = { img: null, mode: null, scalePts: [], dist: 10, poly: [], pxPerFt: 0 }
const tc = document.getElementById('tcanvas'), tctx = tc.getContext('2d')
const tStatus = s => { const e = document.getElementById('tstatus'); e && (e.textContent = s) }
const tDraw = () => {
  tctx.clearRect(0, 0, tc.width, tc.height)
  if (T.img) tctx.drawImage(T.img, 0, 0, tc.width, tc.height)
  else { tctx.fillStyle = '#15181d'; tctx.fillRect(0, 0, tc.width, tc.height); tctx.strokeStyle = 'rgba(255,255,255,0.05)'; for (let g = 0; g < tc.width; g += 49) { tctx.beginPath(); tctx.moveTo(g, 0); tctx.lineTo(g, tc.height); tctx.stroke() } for (let g = 0; g < tc.height; g += 49) { tctx.beginPath(); tctx.moveTo(0, g); tctx.lineTo(tc.width, g); tctx.stroke() } tctx.fillStyle = '#566'; tctx.font = '16px monospace'; tctx.textAlign = 'center'; tctx.fillText('Upload a photo or sketch — or trace on this blank grid', tc.width / 2, tc.height / 2) }
  if (T.scalePts.length) {
    tctx.strokeStyle = '#ffd166'; tctx.lineWidth = 2; tctx.fillStyle = '#ffd166'
    T.scalePts.forEach(p => { tctx.beginPath(); tctx.arc(p[0], p[1], 5, 0, 7); tctx.fill() })
    if (T.scalePts.length === 2) { tctx.beginPath(); tctx.moveTo(...T.scalePts[0]); tctx.lineTo(...T.scalePts[1]); tctx.stroke(); tctx.font = 'bold 14px monospace'; tctx.fillText(`${Math.floor(T.dist)}' ${Math.round((T.dist % 1) * 12)}\"`, (T.scalePts[0][0] + T.scalePts[1][0]) / 2 + 8, (T.scalePts[0][1] + T.scalePts[1][1]) / 2 - 8) }
  }
  if (T.poly.length) {
    tctx.strokeStyle = '#e8a33d'; tctx.fillStyle = 'rgba(232,163,61,0.18)'; tctx.lineWidth = 2.5
    tctx.beginPath(); tctx.moveTo(...T.poly[0]); T.poly.forEach(p => tctx.lineTo(...p)); T.poly.length > 2 && tctx.closePath(); tctx.fill(); tctx.stroke()
    tctx.fillStyle = '#e8a33d'
    T.poly.forEach(p => { tctx.beginPath(); tctx.arc(p[0], p[1], 4.5, 0, 7); tctx.fill() })
    if (T.pxPerFt > 0 && T.poly.length > 1) {
      const xs = T.poly.map(p => p[0]), ys = T.poly.map(p => p[1])
      const bw = (Math.max(...xs) - Math.min(...xs)) / T.pxPerFt, bh = (Math.max(...ys) - Math.min(...ys)) / T.pxPerFt
      tctx.strokeStyle = '#4f9cf0'; tctx.setLineDash([6, 5]); tctx.strokeRect(Math.min(...xs), Math.min(...ys), bw * T.pxPerFt, bh * T.pxPerFt); tctx.setLineDash([])
      tctx.font = 'bold 13px monospace'; tctx.fillStyle = '#4f9cf0'; tctx.fillText(`deck rect: ${bw.toFixed(1)}' × ${bh.toFixed(1)}'`, Math.min(...xs) + 6, Math.min(...ys) - 8)
      document.getElementById('tdims').innerHTML = `<b style="color:var(--acc)">BOUNDING RECT</b><br>length ${bw.toFixed(1)} ft × depth ${bh.toFixed(1)} ft`
    }
  }
}
tc.addEventListener('click', e => {
  const r = tc.getBoundingClientRect()
  const p = [(e.clientX - r.left) * tc.width / r.width, (e.clientY - r.top) * tc.height / r.height]
  if (T.mode === 'scale') {
    T.scalePts.push(p)
    if (T.scalePts.length === 2) {
      const pd = prompt('Real distance between those two points (e.g. 133in or 11ft or 11.08):', '10ft');const pm = pd && pd.match(/([\d.]+)\s*(in|\"|ft|'|m)?/i);const d = pm ? parseFloat(pm[1]) * (/(in|\")/i.test(pm[2] || '') ? 1 / 12 : /m/i.test(pm[2] || '') ? 3.28084 : 1) : NaN
      isFinite(d) && d > 0 ? (T.dist = d, T.pxPerFt = Math.hypot(T.scalePts[1][0] - T.scalePts[0][0], T.scalePts[1][1] - T.scalePts[0][1]) / d, tStatus(`Scale set: ${T.pxPerFt.toFixed(1)} px/ft. Now click "Trace deck area" and click the corners.`)) : (T.scalePts = [], tStatus('Scale cancelled — try again.'))
      T.mode = null
    } else tStatus('Click the second reference point…')
  } else if (T.mode === 'trace') { T.poly.push(p); tStatus(`${T.poly.length} corner${T.poly.length > 1 ? 's' : ''} — keep clicking, then Use outline.`) }
  tDraw()
})
document.getElementById('timg').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return
  const img = new Image()
  img.onload = () => { window.__siteMapOn = false; T.img = img; tc.width = 980; tc.height = Math.round(980 / (img.width / img.height)); tDraw(); tStatus('Photo loaded. Set scale: click two points a known distance apart.') }
  img.src = URL.createObjectURL(f)
})
document.getElementById('tscale').onclick = () => { T.mode = 'scale'; T.scalePts = []; tStatus('Click the FIRST reference point…'); tDraw() }
document.getElementById('ttrace').onclick = () => { T.pxPerFt > 0 ? (T.mode = 'trace', tStatus('Click each corner of the deck area.')) : tStatus('Set the scale first.') }
document.getElementById('tundo').onclick = () => { T.poly.pop(); tDraw() }
document.getElementById('tclear').onclick = () => { T.poly = []; T.scalePts = []; T.mode = null; tDraw(); tStatus('Cleared.') }
document.getElementById('tuse').onclick = async () => {
  if (T.pxPerFt <= 0 || T.poly.length < 2) { tStatus('Need a scale + at least 2 corners.'); return }
  const xs = T.poly.map(p => p[0]), ys = T.poly.map(p => p[1])
  const minX = Math.min(...xs), minY = Math.min(...ys)
  const L = Math.min(40, Math.max(4, Math.round((Math.max(...xs) - minX) / T.pxPerFt * 2) / 2))
  const D = Math.min(20, Math.max(4, Math.round((Math.max(...ys) - minY) / T.pxPerFt * 2) / 2))
  cfg.length = L; cfg.depth = D
  const li = document.getElementById('length'), di = document.getElementById('depth')
  li && (li.value = L); di && (di.value = D)
  if (T.img && window.__siteMapOn) {
    const ic = document.createElement('canvas'); ic.width = tc.width; ic.height = tc.height
    ic.getContext('2d').drawImage(T.img, 0, 0, ic.width, ic.height)
    photoPlane && scene.remove(photoPlane)
    const s = 12 / T.pxPerFt
    photoPlane = new THREE.Mesh(new THREE.PlaneGeometry(tc.width * s, tc.height * s), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(ic), transparent: true, opacity: 0.9 }))
    photoPlane.rotation.x = -Math.PI / 2
    photoPlane.position.set((tc.width / 2 - minX) * s, 0.6, (tc.height / 2 - minY) * s)
    scene.add(photoPlane)
  }
  siteSnap = { ...(window.__siteMapOn && MV ? await mapPlanSnapshot(MV, tc.width, tc.height, T.poly, T.pxPerFt) : cropForPlan(T.img || tc, tc.width, tc.height, T.poly, T.pxPerFt)), address: window.__siteMapOn ? (window.__siteAddr || '') : '', northUp: !!window.__siteMapOn }
  recompute()
  document.querySelector('.tab[data-pane="3d"]').click()
  tStatus(`Applied: ${L}' × ${D}' deck. Photo is the 3D ground layer — and a SITE PLAN was added to 2D Plans.`)
}
MV = initMapTrace({ tc, T, tDraw, tStatus })
tDraw()
Promise.all([wasmReady, catReady]).then(() => { buildMats(); initUI(); recompute(); tick() })
