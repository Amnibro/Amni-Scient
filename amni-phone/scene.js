import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHousing, partGeometry, boardGeometry, glassGeometry, gasketPath, rfWindows, stlBinary, objText, leafGeometry } from './mesh.js';
import { fold3, leafPose } from './model/hinge.js';
export const PART_COLOR = { housing: '#3b4047', board: '#1f5240', display: '#0c0e12', display_ref: '#0c0e12', cover_glass: '#a9c7dc', cell: '#c3c7cd', cell_custom: '#c3c7cd', som: '#5d6671', soc_ref: '#5d6671', memory: '#2c3137', modem: '#6d7580', ntn: '#6d7580', wifi: '#6d7580', gnss: '#6d7580', camera: '#24282e', camera_front: '#24282e', flash: '#e8dcae', antenna: '#c98a3a', qi_coil: '#b87333', nfc_coil: '#b87333', speaker: '#30353b', receiver: '#30353b', mic: '#8d949e', haptic: '#8d949e', usbc: '#c4c8ce', seal_usbc: '#c4c8ce', button: '#a3aab3', sim: '#b8bdc4', esim: '#2c3137', sensor: '#2c3137', charger: '#2c3137', fuel_gauge: '#2c3137', protection: '#2c3137', usb_pd: '#2c3137', pmic: '#2c3137', qi_rx: '#2c3137', haptic_drv: '#2c3137', nfc: '#2c3137', fingerprint: '#44494f', b2b: '#e0d6c2', fpc_conn: '#e0d6c2', shield: '#aeb4bc', thermal: '#c9a86a', hinge: '#9aa1aa', magnet: '#9c3b43', interconnect: '#d7b26a', leaf: '#b9bec6', seal: '#62b0e8', rf: '#e8dcae' };
const HOUSING_COLOR = { al6061: '#3b4047', al7075: '#3b4047', ti5: '#6f6b64', pc: '#26292d', pa12: '#484b50', resin: '#5b5f66' };
class RoundCap extends THREE.BoxGeometry { constructor(w, h) { super(w, h, 0.9); } }
export function orbitOffset(yaw, pitch, dist) { const cp = Math.cos(pitch); return [dist * cp * Math.sin(yaw), dist * Math.sin(pitch), dist * cp * Math.cos(yaw)]; }
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.5, 4000);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight(0xfff4e6, 1.6); key.position.set(140, 260, 160); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 10, far: 900 }); key.shadow.bias = -0.0004;
  const fill = new THREE.DirectionalLight(0xc9d6ff, 0.35); fill.position.set(-200, 80, -120); scene.add(new THREE.HemisphereLight(0xf2efe6, 0x1b1d21, 0.5), key, fill);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.ShadowMaterial({ opacity: 0.28 })); deck.rotation.x = -Math.PI / 2; deck.position.y = -8; deck.receiveShadow = true; scene.add(deck);
  const grid = new THREE.GridHelper(600, 60, 0x2e343d, 0x20242b); grid.position.y = -7.9; scene.add(grid);
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; scene.add(root);
  const phone = new THREE.Group(), halfA = new THREE.Group(), halfB = new THREE.Group(), hinge = new THREE.Group(), tiles = new THREE.Group(); root.add(phone); phone.add(halfA, halfB, hinge, tiles); halfB.matrixAutoUpdate = false;
  const clip = new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e4);
  const view = { yaw: 0.72, pitch: 0.62, dist: 380, target: new THREE.Vector3(), explode: 0, xray: false, section: null, sectionAxis: 'x', angle: 180, dock: 1, seals: true, selected: '', snap: 0.5, glide: null };
  const live = { items: new Map(), housing: { A: null, B: null }, hkey: { A: '', B: '' }, board: null, bkey: '', glass: [], rf: new THREE.Group(), res: null };
  halfA.add(live.rf);
  const mats = new Set();
  const mat = (color, o) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2, ...(o || {}) }); m.clippingPlanes = [clip]; mats.add(m); return m; };
  const dispose = obj => obj.traverse(n => { n.geometry && n.geometry.dispose(); n.material && (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => { mats.delete(m); m.dispose(); }); });
  const halfGroup = h => h === 'B' ? halfB : halfA;
  function itemMesh(it) {
    const g = new THREE.Group(), c = PART_COLOR[it.cat] || '#7d8691';
    const body = new THREE.Mesh(partGeometry(it), mat(c, { metalness: ['cell', 'usbc', 'shield', 'hinge', 'button', 'sim'].includes(it.cat) ? 0.7 : 0.25, roughness: it.cat === 'cell' ? 0.35 : 0.5, transparent: it.cat === 'cover_glass', opacity: it.cat === 'cover_glass' ? 0.3 : 1 }));
    body.castShadow = body.receiveShadow = true; g.add(body);
    if (it.cat === 'camera' || it.cat === 'camera_front') { const r = Math.max(0.6, Math.min(it.sx, it.sy) * 0.32), lens = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.6, 24), mat('#0a0c10', { metalness: 0.1, roughness: 0.08, emissive: new THREE.Color('#12305a'), emissiveIntensity: 0.35 })); lens.rotation.x = Math.PI / 2; lens.position.z = (it.mount === 'back' ? -1 : 1) * (it.sz / 2 + 0.2); g.add(lens); }
    if (it.cat === 'display' || it.cat === 'display_ref') { const aw = Math.min(it.p.n.aw || it.sx - 2, it.rot % 180 ? it.sy : it.sx), ah = Math.min(it.p.n.ah || it.sy - 4, it.rot % 180 ? it.sx : it.sy), back = it.mount === 'backDisplay', act = new THREE.Mesh(it.p.n.shape === 'round' ? new THREE.CircleGeometry(Math.min(aw, ah) / 2, 48) : new THREE.PlaneGeometry(aw, ah), mat('#0e1320', { emissive: new THREE.Color(back ? '#2a4a3a' : '#1b2f55'), emissiveIntensity: 0.55, roughness: 0.15, metalness: 0 })); act.position.z = (back ? -1 : 1) * (it.sz / 2 + 0.01); back && (act.rotation.y = Math.PI); it.rot % 180 && (act.rotation.z = Math.PI / 2); g.add(act); }
    if (it.mount === 'keypad') { const cap = new THREE.Mesh(new RoundCap(Math.min(9, it.sx + 5), Math.min(7, it.sy + 4)), mat('#2b3036', { roughness: 0.7, metalness: 0.05 })); cap.position.z = it.sz / 2 + 0.6; g.add(cap); }
    if (it.cat === 'button') { const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, Math.max(2, it.sy), Math.max(1.4, it.sz * 0.7)), mat('#8d949e', { metalness: 0.8, roughness: 0.3 })); cap.position.x = (it.mount === 'edgeLeft' ? -1 : 1) * (it.sx / 2 + 1.0); g.add(cap); }
    g.userData = { uid: it.uid, key: it.pid + '|' + it.sx + '|' + it.sy + '|' + it.sz + '|' + it.rot, body };
    g.traverse(n => { n.userData.uid = it.uid; });
    return g;
  }
  function housingKey(res, h) { const g = h === 'B' && res.g.B ? res.g.B : res.g; return JSON.stringify([g.w, g.l, g.t, res.G ? [res.G.type, res.G.inset, res.G.pinD, res.G.pf] : 0, g.r, g.fillet, g.wall, g.floor, g.mat, g.back, g.glassT, g.adhT, res.items.filter(i => i.half === h && (['edgeBottom', 'edgeRight', 'edgeLeft', 'back'].includes(i.mount) || ['speaker', 'mic', 'mic2', 'receiver', 'baro', 'antenna'].includes(i.role) || i.cat === 'antenna')).map(i => [i.uid, Math.round(i.x * 4), Math.round(i.y * 4), Math.round(i.z * 4), i.sx, i.sy, i.sz])]); }
  function rebuildHousing(res, h) {
    const k = housingKey(res, h);
    if (live.hkey[h] === k && live.housing[h]) return;
    live.housing[h] && (halfGroup(h).remove(live.housing[h]), dispose(live.housing[h]));
    const t0 = performance.now(), built = buildHousing(res, h);
    const m = new THREE.Mesh(built.geometry, mat(HOUSING_COLOR[res.g.mat] || '#3b4047', { metalness: ['al6061', 'al7075', 'ti5'].includes(res.g.mat) ? 0.75 : 0.05, roughness: ['al6061', 'al7075', 'ti5'].includes(res.g.mat) ? 0.38 : 0.62, side: THREE.DoubleSide, transparent: true }));
    m.castShadow = m.receiveShadow = true; m.userData = { housing: h, ms: performance.now() - t0 };
    halfGroup(h).add(m); live.housing[h] = m; live.hkey[h] = k;
    if (h === 'A') { [...live.rf.children].forEach(c => { live.rf.remove(c); dispose(c); }); rfWindows(res, 'A').forEach(w => { const r = new THREE.Mesh(w.geo, mat(PART_COLOR.rf, { roughness: 0.8, metalness: 0 })); live.rf.add(r); }); }
  }
  function rebuildBoard(res) {
    const k = JSON.stringify([res.board.poly, res.board.t, res.board.z]);
    if (live.bkey === k && live.board) return;
    live.board && (halfA.remove(live.board), dispose(live.board));
    const m = new THREE.Mesh(boardGeometry(res.board), mat(PART_COLOR.board, { roughness: 0.55, metalness: 0.15 }));
    m.castShadow = m.receiveShadow = true; m.userData = { uid: '__board', board: true }; halfA.add(m); live.board = m; live.bkey = k;
  }
  function rebuildSeals(res) {
    [halfA, halfB].forEach(hg => hg.children.filter(c => c.userData.seal).forEach(c => { hg.remove(c); dispose(c); }));
    if (!view.seals || res.d.req.ip === 'none') return;
    const g = res.g, H = g.t - g.glassT - g.adhT;
    ['A', ...(res.g.halves > 1 ? ['B'] : [])].forEach(h => {
      const g = h === 'B' ? res.g.B : res.g, H = g.t - g.glassT - g.adhT, grp = new THREE.Group(), tube = new THREE.Mesh(new THREE.TubeGeometry(gasketPath(g, H + g.adhT / 2), 200, Math.max(0.15, g.adhT / 1.6), 6, true), mat(PART_COLOR.seal, { emissive: new THREE.Color(PART_COLOR.seal), emissiveIntensity: 0.25 }));
      grp.add(tube);
      res.ip.openings.forEach(op => op.parts.forEach(uid => { const it = res.items.find(i => i.uid === uid && i.half === h); if (!it || ['display', 'camera'].includes(op.id)) return; const col = op.ok ? PART_COLOR.seal : '#ff6b6b'; const disc = op.id === 'buttons' ? new THREE.Mesh(new THREE.TorusGeometry(Math.max(0.9, it.sy / 3), 0.18, 8, 24), mat(col, { emissive: new THREE.Color(col), emissiveIntensity: 0.35 })) : new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.25, 20), mat(col, { emissive: new THREE.Color(col), emissiveIntensity: 0.35 })); const hw = g.w / 2 - g.wall, hl = g.l / 2 - g.wall; op.id === 'buttons' ? (disc.rotation.y = Math.PI / 2, disc.position.set(hw + 0.2, it.y, it.z + it.sz / 2)) : (disc.rotation.x = Math.PI / 2, disc.position.set(Math.max(-hw + 1, Math.min(hw - 1, it.x)), it.y > 0 ? hl + 0.15 : -hl - 0.15, Math.min(H - 1, it.z + it.sz / 2))); grp.add(disc); }));
      grp.userData.seal = true; halfGroup(h).add(grp);
    });
  }
  function pieceGroup(r) {
    const k = JSON.stringify([r.d.sel, r.g.w, r.g.l, r.g.t, r.items.map(i => [i.uid, Math.round(i.x * 4), Math.round(i.y * 4), Math.round(i.z * 4)])]);
    if (live.pieceB && live.pieceBKey === k) return live.pieceB;
    live.pieceB && dispose(live.pieceB);
    const g = new THREE.Group(), hs = buildHousing(r, 'A'), hm = new THREE.Mesh(hs.geometry, mat(HOUSING_COLOR[r.g.mat] || '#3b4047', { metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide })); hm.castShadow = true; g.add(hm);
    r.items.forEach(it => { const m = itemMesh(it); m.position.set(it.x, it.y, it.z + it.sz / 2); g.add(m); });
    live.pieceB = g; live.pieceBKey = k; return g;
  }
  function updateTiles(res) {
    [...tiles.children].forEach(c => tiles.remove(c));
    const S = res.system; if (!S) return;
    const srcA = halfA, srcB = res.resB ? pieceGroup(res.resB) : null;
    S.tiles.forEach((t, i) => { if (i === 0) return; const src = t.type === 'B' && srcB ? srcB : srcA, c = src.clone(true); c.userData = { tile: i, m: t.m }; c.traverse(n => { n.userData = { ...n.userData, tileOf: i }; }); c.matrixAutoUpdate = false; tiles.add(c); });
  }
  function update(res, opts) {
    const o = opts || {};
    live.res = res;
    const two = res.g.halves > 1;
    ['A', 'B'].forEach(h => { if (h === 'B' && !two) { live.housing.B && (halfB.remove(live.housing.B), dispose(live.housing.B), live.housing.B = null, live.hkey.B = ''); return; } o.dragging || rebuildHousing(res, h); });
    rebuildBoard(res);
    const seen = new Set();
    res.items.forEach(it => {
      seen.add(it.uid);
      let g = live.items.get(it.uid);
      const k = it.pid + '|' + it.sx + '|' + it.sy + '|' + it.sz + '|' + it.rot;
      if (g && g.userData.key !== k) { g.parent && g.parent.remove(g); dispose(g); g = null; }
      if (!g) { g = itemMesh(it); live.items.set(it.uid, g); }
      g.parent !== halfGroup(it.half) && halfGroup(it.half).add(g);
      g.userData.base = new THREE.Vector3(it.x, it.y, it.z + it.sz / 2); g.userData.it = it;
    });
    [...live.items.keys()].forEach(uid => { if (!seen.has(uid)) { const g = live.items.get(uid); g.parent && g.parent.remove(g); dispose(g); live.items.delete(uid); } });
    o.dragging || rebuildSeals(res);
    const G = res.G;
    phone.position.set(two ? -G.n3[0] * (G.s + G.flatGap / 2) : 0, two ? -G.n3[1] * (G.s + G.flatGap / 2) : 0, 0);
    halfB.visible = two;
    const hk = G && G.outer ? JSON.stringify([G.leaf, G.leafW, G.leafT, G.pinD]) : '';
    if (live.hingeKey !== hk) { [...hinge.children].forEach(c => { hinge.remove(c); dispose(c); }); live.hingeKey = hk; if (G && G.outer) { const lg = leafGeometry(G); [-1, 1].forEach(sg => { const leaf = new THREE.Mesh(lg.clone(), mat(PART_COLOR.leaf, { metalness: 0.85, roughness: 0.28 })); leaf.castShadow = true; leaf.userData = { leaf: sg }; leaf.matrixAutoUpdate = false; hinge.add(leaf); [0, 1].forEach(k => { const pin = new THREE.Mesh(new THREE.CylinderGeometry(G.pinD / 2, G.pinD / 2, G.leafT + 3.4, 16), mat('#d9dde2', { metalness: 0.9, roughness: 0.2 })); pin.userData = { pin: sg, k }; pin.matrixAutoUpdate = false; hinge.add(pin); }); }); } }
    hinge.visible = !!(G && G.outer);
    o.dragging || updateTiles(res);
    const bad = new Set(res.checks.filter(c => c.sev === 'error').flatMap(c => c.uids || []));
    live.bad = bad;
    pose();
  }
  function pose() {
    const res = live.res; if (!res) return;
    const T = res.g.t, e = view.explode;
    live.items.forEach(g => { const b = g.userData.base, it = g.userData.it; if (!b) return; const lift = it.mount === 'magShut' ? 1 : it.mount === 'magFlat' ? 0.5 : it.mount === 'keypad' ? 1.2 : it.mount === 'backDisplay' ? -0.9 : it.mount === 'glass' ? 3 : it.mount === 'display' ? 2.2 : it.mount === 'spreader' ? 1.6 : it.mount === 'boardTop' ? 1 : it.mount === 'boardBottom' ? 0.2 : it.mount === 'front' || it.mount === 'top' ? 1.4 : it.mount === 'back' ? -0.6 : ['floor', 'antTop', 'antBottom'].includes(it.mount) ? -0.3 + (it.cat.startsWith('cell') ? 0.2 : 0) : 0; g.position.set(b.x, b.y, b.z + e * lift * T * 2.2); });
    live.board && (live.board.position.z = e * 0.6 * T * 2.2);
    const G = res.G, two = res.g.halves > 1;
    if (res.system) { const S = res.system, k = view.dock, bx = S.tiles.reduce((a, t) => [Math.min(a[0], t.box[0]), Math.min(a[1], t.box[1]), Math.max(a[2], t.box[3]), Math.max(a[3], t.box[4])], [1e9, 1e9, -1e9, -1e9]), cx = (bx[0] + bx[2]) / 2, cy = (bx[1] + bx[3]) / 2; phone.position.set(-cx, -cy, 0); tiles.children.forEach(c => { const m = c.userData.m, sp = 1 + 0.55 * (1 - k), lift = (1 - k) * 18 * Math.sign(m[14] || 0.001); const M = new THREE.Matrix4().fromArray(m); M.elements[12] = m[12] * sp; M.elements[13] = m[13] * sp; M.elements[14] = m[14] + lift; c.matrix.copy(M); c.matrixWorldNeedsUpdate = true; }); }
    if (two && G) {
      const sw = res.sw || { lo: 0, hi: 180 }, ang = Math.max(sw.lo, Math.min(sw.hi, view.angle));
      halfB.matrix.fromArray(fold3(G, ang)); halfB.matrixWorldNeedsUpdate = true;
      if (G.outer) { const [pa, pb] = leafPose(G, ang), al = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]), c = Math.cos(al), s = Math.sin(al), F = (u, z, a) => G.book ? [u, a, z] : [a, -u, z], ex = F(c, s, 0), ey = F(-s, c, 0), ez = [ex[1] * ey[2] - ex[2] * ey[1], ex[2] * ey[0] - ex[0] * ey[2], ex[0] * ey[1] - ex[1] * ey[0]], off = G.seam / 2 + 0.3 + G.leafT / 2;
        hinge.children.forEach(m => { const sg = m.userData.leaf || m.userData.pin, o = F(pa[0], pa[1], sg * off), M = new THREE.Matrix4(); if (m.userData.leaf) { M.makeBasis(new THREE.Vector3(...ex), new THREE.Vector3(...ey), new THREE.Vector3(...ez)); M.setPosition(...o); } else { const p = m.userData.k ? pb : pa, at = F(p[0], p[1], sg * (off - 1.4)), ax = G.book ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0); M.makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax)); M.setPosition(...at); } m.matrix.copy(M); m.matrixWorldNeedsUpdate = true; }); }
    }
    const fade = view.xray ? 0.12 : e > 0.05 ? Math.max(0.18, 1 - e * 1.4) : 1;
    ['A', 'B'].forEach(h => { const m = live.housing[h]; m && (m.material.opacity = fade, m.material.depthWrite = fade > 0.98, m.visible = true); });
    live.items.forEach(g => { const it = g.userData.it, body = g.userData.body; if (!it || !body) return; const sel = view.selected === it.uid, bad = live.bad && live.bad.has(it.uid); const m = body.material; const see = view.xray && (it.mount === 'display' || it.mount === 'glass'); m.transparent = see || it.cat === 'cover_glass'; m.opacity = it.cat === 'cover_glass' ? (view.xray ? 0.08 : 0.3) : see ? 0.12 : 1; m.depthWrite = !m.transparent; m.emissive && m.emissive.set(sel ? '#C89B4E' : bad ? '#ff4a4a' : '#000000'); m.emissiveIntensity = sel ? 0.55 : bad ? 0.45 : 0; });
    const sec = view.section;
    clip.normal.set(view.sectionAxis === 'x' ? -1 : 0, view.sectionAxis === 'y' ? 1 : 0, 0);
    if (sec == null) clip.constant = 1e4; else { const worldPoint = new THREE.Vector3(view.sectionAxis === 'x' ? sec : 0, view.sectionAxis === 'y' ? sec : 0, 0); halfA.updateMatrixWorld(true); const wp = worldPoint.clone().applyMatrix4(halfA.matrixWorld), wn = clip.normal.clone().set(view.sectionAxis === 'x' ? -1 : 0, 0, view.sectionAxis === 'y' ? -1 : 0); clip.setFromNormalAndCoplanarPoint(wn, wp); }
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(ev, filter) { const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); const objs = [...live.items.values(), ...(live.board ? [live.board] : [])]; const hits = ray.intersectObjects(objs, true).filter(h => h.object.visible && (!filter || filter(h))); return hits.find(h => h.object.userData.uid && !(view.xray === false && h.object.userData.uid && live.items.get(h.object.userData.uid) && ['glass'].includes((live.items.get(h.object.userData.uid).userData.it || {}).mount) && !ev.altKey)) || hits[0] || null; }
  function pick(ev) { const h = hit(ev); return h ? h.object.userData.uid : ''; }
  const plane = new THREE.Plane(), tmp = new THREE.Vector3();
  function dragStart(uid, ev) {
    const g = live.items.get(uid); if (!g) return null;
    const grp = g.parent; grp.updateMatrixWorld(true);
    const p0 = g.getWorldPosition(new THREE.Vector3()), n = new THREE.Vector3(0, 0, 1).transformDirection(grp.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(n, p0);
    const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, tmp)) return null;
    const local = grp.worldToLocal(tmp.clone()), it = g.userData.it;
    return { uid, grp, off: [it.x - local.x, it.y - local.y] };
  }
  function dragMove(st, ev) {
    const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, tmp)) return null;
    const local = st.grp.worldToLocal(tmp.clone()), s = view.snap || 0.01;
    return [Math.round((local.x + st.off[0]) / s) * s, Math.round((local.y + st.off[1]) / s) * s];
  }
  function resize() { const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); }
  function setTheme(dark) { scene.background = new THREE.Color(dark ? '#0D0F12' : '#EAE9E4'); grid.material.opacity = dark ? 1 : 0.35; grid.material.transparent = !dark; deck.material.opacity = dark ? 0.28 : 0.16; }
  function preset(name) { const p = { iso: [0.72, 0.62], top: [0, 1.5], front: [0, 0.02], side: [Math.PI / 2, 0.02], back: [Math.PI, 1.5] }[name] || [0.72, 0.62]; view.yaw = p[0]; view.pitch = name === 'back' ? -1.5 : p[1]; view.target.set(0, 0, 0); view.glide = null; }
  function focus(uid) { const g = live.items.get(uid); if (!g) return; const p = g.getWorldPosition(new THREE.Vector3()); view.glide = { point: p, dist: Math.max(120, Math.min(260, view.dist)), until: performance.now() + 700 }; }
  function frame(now) { view.glide && now < view.glide.until && (view.target.lerp(view.glide.point, 0.15), view.dist += (view.glide.dist - view.dist) * 0.15); const o = orbitOffset(view.yaw, view.pitch, view.dist); camera.position.set(view.target.x + o[0], view.target.y + o[1], view.target.z + o[2]); camera.up.set(0, 1, 0); camera.lookAt(view.target); renderer.render(scene, camera); }
  function exportSTL() { const geos = [], r = live.res, book = !r.G || r.G.book; ['A', 'B'].forEach((h, k) => { const m = live.housing[h]; if (!m) return; const g = m.geometry.clone(); k && (book ? g.translate(r.g.w + 6, 0, 0) : g.translate(0, -(r.g.l + 6), 0)); geos.push(g); }); live.pieceB && r.resB && (h => { const g2 = h.geometry.clone(); g2.translate(r.g.w + 6, 0, 0); geos.push(g2); })(live.pieceB.children[0]); r.G && r.G.outer && [0, 1].forEach(k => { const lg = leafGeometry(r.G); lg.translate(-r.g.w / 2 + k * (r.G.leaf + r.G.leafW + 4), -r.g.l / 2 - 12, 0); geos.push(lg); }); return stlBinary(geos); }
  function exportOBJ() { const out = []; root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(); ['A', 'B'].forEach(h => live.housing[h] && out.push({ name: 'housing_' + h, geometry: live.housing[h].geometry, matrix: new THREE.Matrix4().multiplyMatrices(inv, live.housing[h].matrixWorld) })); hinge.children.forEach((m, i) => { m.updateMatrixWorld(true); out.push({ name: (m.userData.leaf ? 'hinge_leaf_' : 'hinge_pin_') + i, geometry: m.geometry, matrix: new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld) }); }); live.board && out.push({ name: 'carrier_pcb', geometry: live.board.geometry, matrix: new THREE.Matrix4().multiplyMatrices(inv, live.board.matrixWorld) }); live.items.forEach(g => { const it = g.userData.it; g.updateMatrixWorld(true); out.push({ name: it.uid + '_' + (it.p.mpn || it.p.id), geometry: g.userData.body.geometry, matrix: new THREE.Matrix4().multiplyMatrices(inv, g.userData.body.matrixWorld) }); }); return objText(out); }
  return { renderer, scene, camera, view, live, update, pose, pick, hit, dragStart, dragMove, resize, setTheme, preset, focus, frame, exportSTL, exportOBJ };
}
