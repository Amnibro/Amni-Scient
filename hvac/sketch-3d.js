// 3D simulator renderer + interaction for the Amni-Construct sketch scene. Same scene model as the
// 2D/perspective SVG view — real to-scale parametric fixture models + pipe runs as actual tube/
// fitting geometry, in a Three.js room you can orbit, place, drag, and connect. 1 unit = 1 ft.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { addNode, addRun, nodeById, removeNode, snapToWall } from './sketch.js'
import { fitGroundPlane, floorAlign } from './cloud-align.js'

const PIPE_R = { sup12: 0.05, sup34: 0.06, dwv15: 0.08, dwv2: 0.1, dwv3: 0.13, dwv4: 0.16, nm142: 0.04, nm122: 0.045, nm103: 0.05, nm63: 0.06, s6: 0.25, s8: 0.33, s10: 0.42, s12: 0.5, r8: 0.33, r10: 0.42, r12: 0.5 }
const porc = new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.4, metalness: 0.05 })
const metal = new THREE.MeshStandardMaterial({ color: 0xc6ccd4, roughness: 0.45, metalness: 0.55 })
const glass = new THREE.MeshStandardMaterial({ color: 0xbfe0ec, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.28 })
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
const cyl = (rt, rb, h, m, seg) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), m)
const SHAPES3D = {
  toilet: (w, d, h) => { const g = new THREE.Group(); const tank = box(w * 0.85, h * 0.62, d * 0.26, porc); tank.position.set(0, h * 0.31, -d / 2 + d * 0.13); g.add(tank); const bowl = cyl(w * 0.44, w * 0.36, h * 0.4, porc, 22); bowl.position.set(0, h * 0.2, d * 0.04); g.add(bowl); const seat = new THREE.Mesh(new THREE.TorusGeometry(w * 0.4, w * 0.09, 10, 22), porc); seat.rotation.x = Math.PI / 2; seat.position.set(0, h * 0.41, d * 0.04); g.add(seat); return g },
  basin: (w, d, h) => { const g = new THREE.Group(); const cab = box(w, h * 0.86, d, porc); cab.position.y = h * 0.43; g.add(cab); const b = cyl(w * 0.3, w * 0.26, h * 0.18, metal, 20); b.position.set(0, h * 0.86, 0); g.add(b); const f = cyl(0.04, 0.04, h * 0.22, metal, 8); f.position.set(0, h * 0.95, -d * 0.32); g.add(f); return g },
  ksink: (w, d, h) => { const g = new THREE.Group(); const cab = box(w, h * 0.9, d, porc); cab.position.y = h * 0.45; g.add(cab); for (const sx of [-1, 1]) { const b = box(w * 0.38, h * 0.16, d * 0.6, metal); b.position.set(sx * w * 0.22, h * 0.9, 0); g.add(b) } const f = cyl(0.05, 0.05, h * 0.28, metal, 8); f.position.set(0, h, -d * 0.3); g.add(f); return g },
  tub: (w, d, h) => { const g = new THREE.Group(); const shell = box(w, h, d, porc); shell.position.y = h / 2; g.add(shell); const well = box(w * 0.78, h * 0.8, d * 0.84, new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.3 })); well.position.y = h * 0.62; g.add(well); return g },
  shower: (w, d, h) => { const g = new THREE.Group(); const base = box(w, h * 0.08, d, porc); base.position.y = h * 0.04; g.add(base); const wallA = box(w, h, 0.05, glass); wallA.position.set(0, h / 2, -d / 2); g.add(wallA); const wallB = box(0.05, h, d, glass); wallB.position.set(-w / 2, h / 2, 0); g.add(wallB); const head = cyl(0.12, 0.12, 0.05, metal, 12); head.position.set(-w * 0.4, h * 0.86, -d * 0.4); g.add(head); return g },
  round: (w, d, h) => { const g = new THREE.Group(); const t = cyl(w / 2, w / 2, h, metal, 24); t.position.y = h / 2; g.add(t); const top = cyl(w * 0.45, w * 0.45, h * 0.06, porc, 24); top.position.y = h; g.add(top); return g },
  washer: (w, d, h) => { const g = new THREE.Group(); const b = box(w, h, d, metal); b.position.y = h / 2; g.add(b); const door = new THREE.Mesh(new THREE.TorusGeometry(w * 0.3, w * 0.05, 10, 20), porc); door.position.set(0, h * 0.55, d / 2); g.add(door); return g },
  square: (w, d, h) => { const g = new THREE.Group(); const b = box(w, h, d, metal); b.position.y = h / 2; g.add(b); return g },
  panel: (w, d, h) => { const g = new THREE.Group(); const b = box(w, h, Math.max(0.4, d), new THREE.MeshStandardMaterial({ color: 0x4a4f57, roughness: 0.6 })); b.position.y = h / 2; g.add(b); return g },
  marker: (w, d, h, acc) => { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: acc, roughness: 0.5 }); const s = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), m); s.position.y = 0.18; g.add(s); const stem = cyl(0.05, 0.05, 0.35, m, 8); stem.position.y = 0.17; g.add(stem); return g },
}
const disposeGroup = g => { g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && o.material !== porc && o.material !== metal && o.material !== glass) o.material.dispose() }); while (g.children.length) g.remove(g.children[0]) }

export function mount3D(container, opts) {
  const scene3 = opts.scene, trade = opts.trade, onChange = opts.onChange || (() => {})
  container.style.position = 'relative'
  const nfloor = n => (n.props && n.props.fx != null) ? [n.props.fx, n.props.fz] : [n.x / (scene3.scalePxPerFt || 24), n.y / (scene3.scalePxPerFt || 24)]
  let W = scene3.floorCal ? scene3.floorCal.w : 12, D = scene3.floorCal ? scene3.floorCal.d : 14
  for (const n of scene3.nodes) { const f = nfloor(n); W = Math.max(W, f[0] + 2); D = Math.max(D, f[1] + 2) }
  W = Math.max(8, W); D = Math.max(8, D)
  const root = new THREE.Scene(); root.background = new THREE.Color(0x10141a)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, D / 2); root.add(floor)
  const grid = new THREE.GridHelper(Math.max(W, D), Math.max(W, D) | 0, 0x44505e, 0x333b45); grid.position.set(W / 2, 0.01, D / 2); root.add(grid)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a424c, roughness: 0.9, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  const wz = new THREE.Mesh(new THREE.PlaneGeometry(W, 8), wallMat); wz.position.set(W / 2, 4, 0); root.add(wz)
  const wx = new THREE.Mesh(new THREE.PlaneGeometry(D, 8), wallMat); wx.rotation.y = Math.PI / 2; wx.position.set(0, 4, D / 2); root.add(wx)
  root.add(new THREE.HemisphereLight(0xeaf2ff, 0x202830, 1.05))
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.0); sun.position.set(W * 0.7, 10, D * 0.3); root.add(sun)
  const fixtureGroup = new THREE.Group(); root.add(fixtureGroup)
  // optional scanned room point cloud (Amni-Scan): floor-aligned (cloud-align) + scaled to the room.
  let cloudPoints = null
  function loadCloud() {
    let raw = opts.pointCloud
    if (!raw) { try { const s = localStorage.getItem('amni_scan_cloud'); if (s) raw = JSON.parse(s) } catch (e) {} }
    if (!raw || !raw.positions || raw.positions.length < 9) return
    const pos = raw.positions, col = raw.colors || [], n = (pos.length / 3) | 0, sample = [], step = Math.max(1, (n / 3000) | 0)
    for (let i = 0; i < n; i += step) sample.push([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]])
    const plane = fitGroundPlane(sample); if (!plane) return
    const al = floorAlign(plane), aligned = new Float32Array(n * 3)
    let mnx = Infinity, mnz = Infinity, mxx = -Infinity, mxz = -Infinity
    for (let i = 0; i < n; i++) { const q = al.apply([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]); aligned[i * 3] = q[0]; aligned[i * 3 + 1] = q[1]; aligned[i * 3 + 2] = q[2]; if (q[0] < mnx) mnx = q[0]; if (q[0] > mxx) mxx = q[0]; if (q[2] < mnz) mnz = q[2]; if (q[2] > mxz) mxz = q[2] }
    const scale = Math.min(W / ((mxx - mnx) || 1), D / ((mxz - mnz) || 1)) * 0.92, cx = (mnx + mxx) / 2, cz = (mnz + mxz) / 2
    for (let i = 0; i < n; i++) { aligned[i * 3] = (aligned[i * 3] - cx) * scale + W / 2; aligned[i * 3 + 1] *= scale; aligned[i * 3 + 2] = (aligned[i * 3 + 2] - cz) * scale + D / 2 }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(aligned, 3))
    const hasCol = col.length >= n * 3; if (hasCol) geo.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(col.slice(0, n * 3)), 3))
    cloudPoints = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, vertexColors: hasCol, color: hasCol ? 0xffffff : 0x8fb8d8 })); root.add(cloudPoints)
  }
  loadCloud()
  const selRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 28), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); selRing.rotation.x = -Math.PI / 2; selRing.visible = false; root.add(selRing)
  let mode = 'select', connectFrom = null, selected = null, dragId = null
  function buildFixture(n) {
    const p = (trade.palette || []).find(z => z.type === n.type) || { dims: [0.6, 0.6], height: 0, color: '#888', shape: 'marker' }
    const dims = p.dims || [0.6, 0.6], h = p.height || Math.max(0.4, Math.min(dims[0], dims[1])), acc = new THREE.Color(p.color || '#888')
    const g = (SHAPES3D[p.shape] || SHAPES3D.square)(dims[0], dims[1], h, acc)
    const f = nfloor(n); g.position.set(f[0], 0, f[1]); g.rotation.y = -(((n.props && n.props.rot) || 0) * Math.PI / 180); g.userData.nodeId = n.id
    return g
  }
  function rebuild() {
    disposeGroup(fixtureGroup)
    for (const n of scene3.nodes) fixtureGroup.add(buildFixture(n))
    const deg = {}; for (const r of scene3.runs) { deg[r.a] = (deg[r.a] || 0) + 1; deg[r.b] = (deg[r.b] || 0) + 1 }
    for (const r of scene3.runs) {
      const A = nodeById(scene3, r.a), B = nodeById(scene3, r.b); if (!A || !B) continue
      const fa = nfloor(A), fb = nfloor(B), a = new THREE.Vector3(fa[0], 0.35, fa[1]), b = new THREE.Vector3(fb[0], 0.35, fb[1])
      const rt = (trade.runTypes || []).find(z => z.type === r.type) || { color: '#bbb' }, pm = new THREE.MeshStandardMaterial({ color: new THREE.Color(rt.color), roughness: 0.5, metalness: 0.35 }), rad = PIPE_R[r.type] || 0.06
      const dir = new THREE.Vector3().subVectors(b, a), len = dir.length() || 0.01
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 14), pm); pipe.position.copy(a).add(b).multiplyScalar(0.5); pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); fixtureGroup.add(pipe)
      for (const e of [a, b]) { const j = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.5, 12, 10), pm); j.position.copy(e); fixtureGroup.add(j) }
    }
    for (const n of scene3.nodes) if ((deg[n.id] || 0) >= 3) { const f = nfloor(n), tee = box(0.22, 0.22, 0.22, new THREE.MeshStandardMaterial({ color: 0xd8a24a, roughness: 0.5 })); tee.position.set(f[0], 0.35, f[1]); fixtureGroup.add(tee) }
    updateSel()
  }
  function updateSel() { const n = selected && nodeById(scene3, selected); if (n) { const f = nfloor(n); selRing.position.set(f[0], 0.04, f[1]); const p = (trade.palette || []).find(z => z.type === n.type) || { dims: [1, 1] }; selRing.scale.setScalar(Math.max(0.6, Math.max(p.dims ? p.dims[0] : 1, p.dims ? p.dims[1] : 1) * 0.6)); selRing.visible = true } else selRing.visible = false }
  // toolbar
  const bar = document.createElement('div'); bar.style.cssText = 'position:absolute;left:8px;top:8px;right:8px;z-index:6;display:flex;gap:4px;flex-wrap:wrap'; container.appendChild(bar)
  const mkb = (label, on, active, bcol) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'padding:5px 8px;font-size:11px;background:' + (active ? '#8fa8b8' : 'rgba(22,26,32,.85)') + ';color:' + (active ? '#111' : '#e8e6e0') + ';border:1px solid ' + (bcol || '#2c3038') + ';border-radius:7px;cursor:pointer;font-weight:' + (active ? 600 : 400); b.onclick = on; bar.appendChild(b); return b }
  function renderBar() {
    bar.innerHTML = ''
    mkb('↖ Select', () => setMode('select'), mode === 'select')
    for (const p of (trade.palette || [])) mkb((p.glyph || '•') + ' ' + p.label, () => setMode('place:' + p.type), mode === 'place:' + p.type, p.color)
    const sp = document.createElement('span'); sp.textContent = '│'; sp.style.cssText = 'color:#9aa0aa;align-self:center'; bar.appendChild(sp)
    for (const rt of (trade.runTypes || [])) mkb(rt.label, () => setMode('connect:' + rt.type), mode === 'connect:' + rt.type, rt.color)
    mkb('🗑', () => { if (selected) { removeNode(scene3, selected); selected = null; commit() } }, false)
    if (cloudPoints) mkb('☁️ Room cloud', () => { cloudPoints.visible = !cloudPoints.visible; renderBar() }, cloudPoints.visible)
    mkb(camOn ? '📷 Camera: on' : '📷 Camera', () => toggleCamera(), camOn)
  }
  function setMode(m) { mode = m; connectFrom = null; controls.enabled = (m === 'select'); renderBar() }
  function commit() { rebuild(); onChange(scene3) }
  // three renderer + camera + controls
  const cam = new THREE.PerspectiveCamera(50, Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight || 500), 0.05, 500)
  const md = Math.max(W, D); cam.position.set(W / 2 - md * 0.55, md * 0.78, D + md * 0.5)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1))); renderer.setClearColor(0x000000, 0)
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;border-radius:10px;touch-action:none;position:relative;z-index:1'
  // camera-overlay AR (no WebXR): a live camera frame (or a still) behind the transparent 3D scene.
  const camBg = document.createElement('div'); camBg.style.cssText = 'position:absolute;inset:0;z-index:0;display:none;border-radius:10px;overflow:hidden;background:#000'
  const camVid = document.createElement('video'); camVid.muted = true; camVid.autoplay = true; camVid.playsInline = true; camVid.setAttribute('playsinline', ''); camVid.style.cssText = 'width:100%;height:100%;object-fit:cover'
  const camImg = document.createElement('img'); camImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:none'
  const toast = document.createElement('div'); toast.style.cssText = 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:7;display:none;background:rgba(16,18,22,.92);color:#eef2f6;font:12px system-ui;padding:7px 12px;border-radius:9px;max-width:80%;text-align:center'
  camBg.append(camVid, camImg); container.append(camBg, renderer.domElement, toast)
  let camOn = false, camStream = null
  const setSceneSolid = on => { root.background = on ? new THREE.Color(0x10141a) : null; floor.visible = on; grid.visible = on; wz.visible = on; wx.visible = on }
  async function toggleCamera() {
    camOn = !camOn
    if (!camOn) { camBg.style.display = 'none'; if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null } setSceneSolid(true); renderBar(); return }
    setSceneSolid(false); camBg.style.display = 'block'; toast.style.display = 'none'
    if (opts.cameraStill) { camImg.src = opts.cameraStill; camImg.style.display = 'block'; camVid.style.display = 'none'; renderBar(); return }
    try { camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); camVid.srcObject = camStream; camVid.style.display = 'block'; camImg.style.display = 'none'; await camVid.play().catch(() => {}) }
    catch (e) { camOn = false; camBg.style.display = 'none'; setSceneSolid(true); toast.textContent = '📷 Camera unavailable — allow access, or use ☁️ Room cloud / a photo.'; toast.style.display = 'block' }
    renderBar()
  }
  const setSize = () => { const w = container.clientWidth || 760, h = container.clientHeight || 500; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }; setSize()
  const controls = new OrbitControls(cam, renderer.domElement); controls.target.set(W / 2, 0.8, D / 2); controls.enableDamping = true; controls.update()
  // interaction
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const setPtr = e => { const r = renderer.domElement.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1; ray.setFromCamera(ptr, cam) }
  const floorAt = () => { const pt = new THREE.Vector3(); return ray.ray.intersectPlane(floorPlane, pt) ? [pt.x, pt.z] : null }
  const clampFloor = (fx, fz) => [Math.max(0, Math.min(W, fx)), Math.max(0, Math.min(D, fz))]
  const snapIt = (type, fx, fz, rot) => { const pal = (trade.palette || []).find(z => z.type === type); if (!scene3.floorCal || !pal || pal.shape === 'marker') return { fx, fz, rot }; const sn = snapToWall(fx, fz, (pal.dims || [1, 1])[1], scene3.floorCal.w, scene3.floorCal.d, 2.5); return sn || { fx, fz, rot } }
  const pickNodeId = () => { const hits = ray.intersectObjects(fixtureGroup.children, true); for (const h of hits) { let o = h.object; while (o) { if (o.userData && o.userData.nodeId) return o.userData.nodeId; o = o.parent } } return null }
  function placeAt(type, fx0, fz0) { let [fx, fz] = clampFloor(fx0, fz0); const sn = snapIt(type, fx, fz, 0); const id = addNode(scene3, type, 0, 0, { fx: sn.fx, fz: sn.fz, rot: sn.rot }); commit(); return id }
  renderer.domElement.addEventListener('pointerdown', e => {
    setPtr(e)
    if (mode.startsWith('place:')) { const fp = floorAt(); if (fp) placeAt(mode.slice(6), fp[0], fp[1]); return }
    if (mode.startsWith('connect:')) { const id = pickNodeId(); if (id) { if (!connectFrom) { connectFrom = id; selected = id; updateSel() } else if (connectFrom !== id) { addRun(scene3, mode.slice(8), connectFrom, id); connectFrom = null; commit() } } return }
    const id = pickNodeId(); if (id) { selected = id; updateSel(); dragId = id; controls.enabled = false } else { selected = null; updateSel() }
  })
  renderer.domElement.addEventListener('pointermove', e => { if (!dragId) return; setPtr(e); const fp = floorAt(); if (!fp) return; const n = nodeById(scene3, dragId); if (!n || !n.props) return;[n.props.fx, n.props.fz] = clampFloor(fp[0], fp[1]); const sn = snapIt(n.type, n.props.fx, n.props.fz, n.props.rot || 0); n.props.fx = sn.fx; n.props.fz = sn.fz; n.props.rot = sn.rot; rebuild() })
  renderer.domElement.addEventListener('pointerup', () => { if (dragId) { dragId = null; controls.enabled = (mode === 'select'); onChange(scene3) } })
  let alive = true
  const loop = () => { if (!alive) return; controls.update(); renderer.render(root, cam); requestAnimationFrame(loop) }
  rebuild(); renderBar(); setMode('select'); loop()
  const onResize = () => setSize(); window.addEventListener('resize', onResize)
  return { dispose() { alive = false; window.removeEventListener('resize', onResize); if (bar.parentNode) bar.parentNode.removeChild(bar); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement) }, rebuild, place: placeAt, render: () => renderer.render(root, cam) }
}
