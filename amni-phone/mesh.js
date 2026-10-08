import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, ADDITION } from 'three-bvh-csg';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { bossZones } from './model/engine.js';
export function roundedRect(w, l, r, cx, cy, rc) {
  const x = (cx || 0) - w / 2, y = (cy || 0) - l / 2, cl = v => Math.max(0.01, Math.min(v, w / 2 - 0.01, l / 2 - 0.01)), [tr, tl, bl, br] = (rc || [r, r, r, r]).map(cl), s = new THREE.Shape();
  s.moveTo(x + bl, y); s.lineTo(x + w - br, y); s.quadraticCurveTo(x + w, y, x + w, y + br); s.lineTo(x + w, y + l - tr); s.quadraticCurveTo(x + w, y + l, x + w - tr, y + l); s.lineTo(x + tl, y + l); s.quadraticCurveTo(x, y + l, x, y + l - tl); s.lineTo(x, y + bl); s.quadraticCurveTo(x, y, x + bl, y);
  return s;
}
export function seamCorners(res, half, r) { const G = res.G; if (!G || !G.outer) return null; const q = Math.min(r, 1), A = half === 'A'; return G.book ? (A ? [q, r, r, q] : [r, q, q, r]) : (A ? [r, r, q, q] : [q, q, r, r]); }
export function extrudeRR(w, l, r, h, fillet, z0, rc) {
  const f = Math.max(0, Math.min(fillet || 0, h / 2 - 0.01, w / 4, l / 4));
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * f, l - 2 * f, Math.max(0.05, r - f), 0, 0, rc && rc.map(v => Math.max(0.05, v - f))), { depth: Math.max(0.01, h - 2 * f), bevelEnabled: f > 0, bevelThickness: f, bevelSize: f, bevelSegments: f > 0 ? 3 : 0, curveSegments: 10 });
  g.translate(0, 0, (z0 || 0) + f);
  return g;
}
export function polyGeometry(poly, h, z0) { const s = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y))); const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.translate(0, 0, z0 || 0); return g; }
function prism(w, h, depth, axis, cx, cy, cz, round) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, h, round ? Math.min(w, h) / 2 : 0.05), { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  axis !== 'z' && g.rotateX(Math.PI / 2);
  axis === 'x' && g.rotateZ(Math.PI / 2);
  g.translate(cx, cy, cz);
  return g;
}
function cyl(d, depth, axis, cx, cy, cz) { const g = new THREE.CylinderGeometry(d / 2, d / 2, depth, 20); axis === 'z' ? g.rotateX(Math.PI / 2) : axis === 'x' ? g.rotateZ(Math.PI / 2) : null; g.translate(cx, cy, cz); return g; }
const clean = g => { const n = g.index ? g.toNonIndexed() : g; ['uv', 'uv1', 'uv2'].forEach(k => n.deleteAttribute(k)); n.computeVertexNormals(); return n; };
export function housingCuts(res, half) {
  const g = half === 'B' && res.g.B ? res.g.B : res.g, H = g.t - g.glassT - g.adhT, hw = g.w / 2, hl = g.l / 2, cuts = [], items = res.items.filter(i => i.half === half);
  const wallZ = (z, h) => Math.min(Math.max(z, g.floor + h / 2 + 0.2), H - h / 2 - 0.3);
  items.forEach(it => {
    const zc = it.z + it.sz / 2;
    it.mount === 'edgeBottom' && cuts.push({ id: 'usb-' + it.uid, kind: 'port', geo: prism(9.4, 3.6, g.wall * 2 + 2, 'y', it.x, -hl, wallZ(zc, 3.6), true) });
    it.mount === 'edgeRight' && cuts.push({ id: 'key-' + it.uid, kind: 'key', geo: prism(Math.min(it.sy + 1, 16), Math.min(it.sz + 0.4, H - g.floor - 0.8), g.wall * 2 + 2, 'x', hw, it.y, wallZ(zc, Math.min(it.sz + 0.4, H - g.floor - 0.8)), true) });
    (it.mount === 'edgeLeft' || it.role === 'sim') && cuts.push({ id: 'sim-' + it.uid, kind: 'sim', geo: prism(Math.min(it.sy + 0.5, 17), 1.7, g.wall * 2 + 2, 'x', -hw, it.y, wallZ(zc, 1.7), false) });
    it.role === 'speaker' && [-2, -1, 0, 1, 2].forEach(k => cuts.push({ id: 'grille-' + k, kind: 'grille', geo: cyl(1.1, g.wall * 2 + 2, 'y', it.x + k * 1.8, -hl, wallZ(zc, 1.1)) }));
    (it.role === 'mic' || (it.role === 'mic2')) && cuts.push({ id: 'mic-' + it.uid, kind: 'mic', geo: cyl(0.8, g.wall * 2 + 2, 'y', it.x, it.y > 0 ? hl : -hl, wallZ(zc, 0.8)) });
    it.role === 'receiver' && cuts.push({ id: 'rcv', kind: 'receiver', geo: prism(10, 0.7, g.wall * 2 + 2, 'y', it.x, hl, H - 0.6, true) });
    it.role === 'baro' && cuts.push({ id: 'baro', kind: 'vent', geo: cyl(0.8, g.wall * 2 + 2, 'y', 12, -hl, g.floor + 1.5) });
    it.mount === 'backDisplay' && cuts.push({ id: 'cover-' + it.uid, kind: 'window', geo: prism(Math.max(2, it.sx - 1.2), Math.max(2, it.sy - 1.2), 20, 'z', it.x, it.y, 0, it.p.n.shape === 'round') });
    it.mount === 'back' && cuts.push({ id: 'win-' + it.uid, kind: 'window', geo: it.role === 'fingerprint' ? prism(it.sx - 1, it.sy - 1, 20, 'z', it.x, it.y, 0, true) : cyl(Math.max(1.5, Math.min(it.sx, it.sy) - (it.role === 'flash' ? 0.5 : 1.8)), 20, 'z', it.x, it.y, 0) });
  });
  return cuts;
}
export function rfWindows(res, half) {
  const g = half === 'B' && res.g.B ? res.g.B : res.g, H = g.t - g.glassT - g.adhT, hw = g.w / 2, hl = g.l / 2, out = [];
  if (!res.g || !['al6061', 'al7075', 'ti5'].includes(g.mat)) return out;
  res.items.filter(i => i.half === half && i.cat === 'antenna').forEach(a => {
    const onTop = a.box[4] > hl - g.wall - 3, onBottom = a.box[1] < -hl + g.wall + 3, onRight = a.box[3] > hw - g.wall - 3;
    const along = onTop || onBottom ? 'x' : 'y', span = along === 'x' ? [a.box[0], a.box[3]] : [a.box[1], a.box[4]], h = H - g.floor - 0.4, zc = g.floor + 0.2 + h / 2;
    span.forEach((s, k) => { const geo = along === 'x' ? new THREE.BoxGeometry(1, g.wall * 2 + 1, h) : new THREE.BoxGeometry(g.wall * 2 + 1, 1, h); geo.translate(along === 'x' ? s + (k ? 0.5 : -0.5) : onRight ? hw : -hw, along === 'x' ? (onTop ? hl : -hl) : s + (k ? 0.5 : -0.5), zc); out.push({ id: 'rf-' + a.uid + '-' + k, geo }); });
  });
  return out;
}
export function buildHousing(res, half) {
  const g = half === 'B' && res.g.B ? res.g.B : res.g, H = g.t - g.glassT - g.adhT, ev = new Evaluator();
  ev.useGroups = false; ev.attributes = ['position', 'normal'];
  let body = new Brush(clean(extrudeRR(g.w, g.l, g.r, H, g.fillet, 0, seamCorners(res, half, g.r))));
  const backs = res.items.filter(i => i.half === half && i.mount === 'back');
  const bump = Math.max(0, ...backs.map(i => i.z + i.sz - (g.dispZ - 0.25)));
  if (bump > 0.01 && backs.length) {
    const x0 = Math.min(...backs.map(i => i.box[0])) - 1.6, x1 = Math.max(...backs.map(i => i.box[3])) + 1.6, y0 = Math.min(...backs.map(i => i.box[1])) - 1.6, y1 = Math.max(...backs.map(i => i.box[4])) + 1.6;
    const isl = new Brush(clean(extrudeRR(x1 - x0, y1 - y0, 3, bump + 0.5, 0.4, -bump)));
    isl.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); isl.updateMatrixWorld();
    body.updateMatrixWorld(); body = ev.evaluate(body, isl, ADDITION);
  }
  const cav = new Brush(clean(extrudeRR(g.iw, g.il, g.ir, H + 2, 0, g.floor, seamCorners(res, half, g.ir))));
  body.updateMatrixWorld(); cav.updateMatrixWorld(); body = ev.evaluate(body, cav, SUBTRACTION);
  if (bump > 0.01 && backs.length) { const pocket = new Brush(clean(extrudeRR(Math.max(...backs.map(i => i.box[3])) - Math.min(...backs.map(i => i.box[0])) + 0.6, Math.max(...backs.map(i => i.box[4])) - Math.min(...backs.map(i => i.box[1])) + 0.6, 1.5, bump + g.floor, 0, -bump + 0.45))); pocket.position.set((Math.min(...backs.map(i => i.box[0])) + Math.max(...backs.map(i => i.box[3]))) / 2, (Math.min(...backs.map(i => i.box[1])) + Math.max(...backs.map(i => i.box[4]))) / 2, 0); pocket.updateMatrixWorld(); body.updateMatrixWorld(); body = ev.evaluate(body, pocket, SUBTRACTION); }
  const G = res.G; G && G.outer && bossZones(res.d, res.g).filter(z => z.half === half).forEach(z => { const bx = z.box, b = new Brush(clean(new THREE.BoxGeometry(bx[3] - bx[0] + 0.2, bx[4] - bx[1] + 0.2, bx[5] - bx[2]).translate((bx[0] + bx[3]) / 2, (bx[1] + bx[4]) / 2, (bx[2] + bx[5]) / 2))); b.updateMatrixWorld(); body.updateMatrixWorld(); body = ev.evaluate(body, b, ADDITION); });
  G && G.outer && [-1, 1].forEach(sg => { const u = half === 'A' ? G.s - G.inset : -(G.s - G.inset), along = sg * (G.seam / 2), pz = half === 'B' ? G.pinZB : G.pinZ, pos = G.book ? [u, along, pz] : [along, -u, pz], b = new Brush(clean(cyl(G.pinD, K_ENG * 2, G.book ? 'y' : 'x', ...pos))); b.updateMatrixWorld(); body.updateMatrixWorld(); body = ev.evaluate(body, b, SUBTRACTION); });
  [...housingCuts(res, half), ...rfWindows(res, half).map(w => ({ ...w, kind: 'rf' }))].forEach(c => { const b = new Brush(clean(c.geo)); b.updateMatrixWorld(); body.updateMatrixWorld(); body = ev.evaluate(body, b, SUBTRACTION); });
  body.geometry.computeVertexNormals();
  return { geometry: body.geometry, bump, height: H };
}
const K_ENG = 3;
export function leafGeometry(G) { const L = G.leaf, w = G.leafW, s = new THREE.Shape(); s.absarc(0, 0, w / 2, Math.PI / 2, Math.PI * 1.5, false); s.lineTo(L, -w / 2); s.absarc(L, 0, w / 2, -Math.PI / 2, Math.PI / 2, false); s.lineTo(0, w / 2); [0, L].forEach(x => { const h = new THREE.Path(); h.absarc(x, 0, G.pinD / 2, 0, Math.PI * 2, true); s.holes.push(h); }); const g = new THREE.ExtrudeGeometry(s, { depth: G.leafT, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -G.leafT / 2); return clean(g); }
export function partGeometry(it) {
  const r = Math.min(0.6, it.sx / 4, it.sy / 4, it.sz / 3);
  const g = it.cat === 'antenna' || it.cat === 'thermal' || it.sz < 0.25 ? new THREE.BoxGeometry(it.sx, it.sy, it.sz) : new RoundedBoxGeometry(it.sx, it.sy, it.sz, 2, Math.max(0.02, r));
  return g;
}
export function boardGeometry(board) { return polyGeometry(board.poly, board.t, board.z); }
export function glassGeometry(g) { return extrudeRR(g.w - 0.6, g.l - 0.6, Math.max(0.5, g.r - 0.3), g.glassT, Math.min(0.3, g.glassT / 3), g.t - g.glassT); }
export function gasketPath(g, z) { const s = roundedRect(g.iw + 0.6, g.il + 0.6, g.ir + 0.3); const pts = s.getSpacedPoints(160).map(p => new THREE.Vector3(p.x, p.y, z)); return new THREE.CatmullRomCurve3(pts, true); }
export function meshVolume(geo) {
  const p = geo.attributes.position.array, idx = geo.index ? geo.index.array : null, n = idx ? idx.length : p.length / 3;
  let v = 0;
  for (let i = 0; i < n; i += 3) { const a = (idx ? idx[i] : i) * 3, b = (idx ? idx[i + 1] : i + 1) * 3, c = (idx ? idx[i + 2] : i + 2) * 3; v += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6; }
  return Math.abs(v);
}
export function stlBinary(geos) {
  const tris = geos.reduce((n, g) => n + (g.index ? g.index.count : g.attributes.position.count) / 3, 0);
  const buf = new ArrayBuffer(84 + tris * 50), dv = new DataView(buf);
  const head = 'Amni-Phone Studio housing, units mm';
  for (let i = 0; i < 80; i++) dv.setUint8(i, i < head.length ? head.charCodeAt(i) : 32);
  dv.setUint32(80, tris, true);
  let o = 84;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  geos.forEach(g => { const p = g.attributes.position, idx = g.index; const cnt = idx ? idx.count : p.count; for (let i = 0; i < cnt; i += 3) { a.fromBufferAttribute(p, idx ? idx.getX(i) : i); b.fromBufferAttribute(p, idx ? idx.getX(i + 1) : i + 1); c.fromBufferAttribute(p, idx ? idx.getX(i + 2) : i + 2); n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize(); [n, a, b, c].forEach(v => { dv.setFloat32(o, v.x, true); dv.setFloat32(o + 4, v.y, true); dv.setFloat32(o + 8, v.z, true); o += 12; }); dv.setUint16(o, 0, true); o += 2; } });
  return buf;
}
export function objText(entries) {
  let out = '# Amni-Phone Studio assembly, units mm\n', base = 1;
  const v = new THREE.Vector3();
  entries.forEach(({ name, geometry, matrix }) => { const g = geometry.index ? geometry.toNonIndexed() : geometry, p = g.attributes.position; out += 'o ' + name.replace(/\s+/g, '_') + '\n'; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); matrix && v.applyMatrix4(matrix); out += 'v ' + v.x.toFixed(4) + ' ' + v.y.toFixed(4) + ' ' + v.z.toFixed(4) + '\n'; } for (let i = 0; i < p.count; i += 3) out += 'f ' + (base + i) + ' ' + (base + i + 1) + ' ' + (base + i + 2) + '\n'; base += p.count; });
  return out;
}
