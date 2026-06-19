// 3D simulator renderer for the Amni-Construct sketch scene. Same scene model as the 2D/perspective
// SVG view — this is just a richer renderer: real to-scale parametric fixture models + pipe runs as
// actual tube/fitting geometry, in a Three.js room you can orbit. 1 unit = 1 ft.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const PIPE_R = { sup12: 0.05, sup34: 0.06, dwv15: 0.08, dwv2: 0.1, dwv3: 0.13, dwv4: 0.16, nm142: 0.04, nm122: 0.045, nm103: 0.05, nm63: 0.06, s6: 0.25, s8: 0.33, s10: 0.42, s12: 0.5, r8: 0.33, r10: 0.42, r12: 0.5 }
const porc = new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.4, metalness: 0.05 })
const metal = new THREE.MeshStandardMaterial({ color: 0xc6ccd4, roughness: 0.45, metalness: 0.55 })
const glass = new THREE.MeshStandardMaterial({ color: 0xbfe0ec, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.28 })
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
const cyl = (rt, rb, h, m, seg) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), m)

// each builder: (w,d,h ft, accentColor) -> THREE.Group with base at y=0, centered in x/z, +y up
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

export function mount3D(container, opts) {
  const scene3 = opts.scene, trade = opts.trade
  const root = new THREE.Scene(); root.background = new THREE.Color(0x10141a)
  const wd = scene3.floorCal ? scene3.floorCal.w : 0, dp = scene3.floorCal ? scene3.floorCal.d : 0
  const nfloor = n => (n.props && n.props.fx != null) ? [n.props.fx, n.props.fz] : [n.x / (scene3.scalePxPerFt || 24), n.y / (scene3.scalePxPerFt || 24)]
  let maxx = wd, maxz = dp; for (const n of scene3.nodes) { const f = nfloor(n); maxx = Math.max(maxx, f[0] + 2); maxz = Math.max(maxz, f[1] + 2) }
  const W = Math.max(8, maxx || 12), D = Math.max(8, maxz || 14)
  // floor + grid + walls
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, D / 2); root.add(floor)
  const grid = new THREE.GridHelper(Math.max(W, D), Math.max(W, D), 0x44505e, 0x333b45); grid.position.set(W / 2, 0.01, D / 2); root.add(grid)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a424c, roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  const wz = new THREE.Mesh(new THREE.PlaneGeometry(W, 8), wallMat); wz.position.set(W / 2, 4, 0); root.add(wz)
  const wx = new THREE.Mesh(new THREE.PlaneGeometry(D, 8), wallMat); wx.rotation.y = Math.PI / 2; wx.position.set(0, 4, D / 2); root.add(wx)
  // lights
  root.add(new THREE.HemisphereLight(0xeaf2ff, 0x202830, 1.05))
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.0); sun.position.set(W * 0.7, 10, D * 0.3); root.add(sun)
  // fixtures
  for (const n of scene3.nodes) {
    const p = (trade.palette || []).find(z => z.type === n.type) || { dims: [0.6, 0.6], height: 0, color: '#888', shape: 'marker' }
    const dims = p.dims || [0.6, 0.6], h = p.height || Math.max(0.4, Math.min(dims[0], dims[1])), acc = new THREE.Color(p.color || '#888')
    const g = (SHAPES3D[p.shape] || SHAPES3D.square)(dims[0], dims[1], h, acc)
    const f = nfloor(n); g.position.set(f[0], 0, f[1]); g.rotation.y = -(((n.props && n.props.rot) || 0) * Math.PI / 180); root.add(g)
  }
  // pipe runs as real tube + fittings
  const deg = {}; for (const r of scene3.runs) { deg[r.a] = (deg[r.a] || 0) + 1; deg[r.b] = (deg[r.b] || 0) + 1 }
  const nodeById = id => scene3.nodes.find(n => n.id === id)
  for (const r of scene3.runs) {
    const A = nodeById(r.a), B = nodeById(r.b); if (!A || !B) continue
    const fa = nfloor(A), fb = nfloor(B), hh = 0.35, a = new THREE.Vector3(fa[0], hh, fa[1]), b = new THREE.Vector3(fb[0], hh, fb[1])
    const rt = (trade.runTypes || []).find(z => z.type === r.type) || { color: '#bbb' }, col = new THREE.Color(rt.color), rad = PIPE_R[r.type] || 0.06
    const pm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.35 })
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length() || 0.01
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 14), pm); pipe.position.copy(a).add(b).multiplyScalar(0.5); pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); root.add(pipe)
    for (const e of [a, b]) { const j = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.5, 12, 10), pm); j.position.copy(e); root.add(j) }
  }
  // tee fittings where >=3 runs meet a node
  for (const n of scene3.nodes) if ((deg[n.id] || 0) >= 3) { const f = nfloor(n), col = new THREE.Color('#d8a24a'); const tee = box(0.22, 0.22, 0.22, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })); tee.position.set(f[0], 0.35, f[1]); root.add(tee) }
  // camera + controls
  const cam = new THREE.PerspectiveCamera(50, Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight || 500), 0.05, 500)
  const md = Math.max(W, D); cam.position.set(W / 2 - md * 0.55, md * 0.75, D + md * 0.5)
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, (typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1)))
  const setSize = () => { const w = container.clientWidth || 760, h = container.clientHeight || 500; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;border-radius:10px'
  container.appendChild(renderer.domElement); setSize()
  const controls = new OrbitControls(cam, renderer.domElement); controls.target.set(W / 2, 0.8, D / 2); controls.enableDamping = true; controls.update()
  let alive = true
  const loop = () => { if (!alive) return; controls.update(); renderer.render(root, cam); requestAnimationFrame(loop) }
  loop()
  const onResize = () => setSize(); window.addEventListener('resize', onResize)
  return { dispose() { alive = false; window.removeEventListener('resize', onResize); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement) }, render: () => renderer.render(root, cam) }
}
