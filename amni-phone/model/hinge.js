import { K, FORMS, HINGES, LEAF_MATS } from './catalog.js';
export const MU0 = 4e-7 * Math.PI;
const D2R = Math.PI / 180, fin = v => typeof v === 'number' && Number.isFinite(v);
export const rot2 = (a, p) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export function hingeType(d) { const f = FORMS[d.form]; return f && f.axis ? (f.hinges.includes(d.hinge.type) ? d.hinge.type : f.hinges[0]) : null; }
export function hingeGeom(d, g) {
  const f = FORMS[d.form], type = hingeType(d); if (!type) return null;
  const h = d.hinge, H = HINGES[type], book = f.axis === 'long', s = book ? g.w / 2 : g.l / 2, outer = type === 'outer';
  const leaf = outer ? h.leaf : 0, pf = outer ? h.pinFace : H.pf, inset = outer ? h.inset : -K.seamGap / 2, t = g.t, tB = g.B ? g.B.t : g.t;
  const PA = [s - inset, t - pf], PB = [-s + inset, tB - pf];
  return { type, H, book, axis: f.axis, s, seam: book ? g.l : g.w, n3: book ? [1, 0, 0] : [0, -1, 0], t, tB, leaf, pf, inset, PA, PB, pinZ: t - pf, pinZB: tB - pf, flatGap: outer ? leaf - 2 * inset : K.seamGap, shutGap: leaf - 2 * pf, backGap: leaf - (t - pf) - (tB - pf), pinD: h.pinD, leafT: h.leafT, leafW: h.leafW, leafMat: LEAF_MATS[h.leafMat] || LEAF_MATS.ss174, outer, buildable: H.buildable, along: book ? 1 : 0 };
}
export function leafFor360(d, g) {
  const want = Math.max(0.6, (hingeGeom(d, g) || {}).flatGap || 0.8), cache = leafFor360.c || (leafFor360.c = new Map()), key = [g.t, g.B ? g.B.t : g.t, g.w, g.l, g.fillet, d.form, want].join('|');
  if (cache.has(key)) return cache.get(key);
  let best = null;
  for (let leaf = 6; leaf <= 40 && !best; leaf += 1) for (const pinFace of [g.t / 2, Math.max(1, g.t / 2 - 1), g.t / 2 + 1]) { const inset = Math.round((leaf - want) / 2 * 100) / 100, G = hingeGeom({ ...d, hinge: { ...d.hinge, type: 'outer', leaf, pinFace: Math.round(pinFace * 100) / 100, inset } }, g); if (swing(G, g.fillet, null).full) { best = { leaf, pinFace: Math.round(pinFace * 100) / 100, inset }; break; } }
  cache.set(key, best); return best;
}
export function poseB(G, theta) { const phi = (180 - theta) / 2 * D2R, a = 2 * phi, tr = add(G.PA, rot2(phi, [G.leaf, 0])); return { a, o: sub(tr, rot2(a, G.PB)), phi }; }
export const apply2 = (T, p) => add(T.o, rot2(T.a, p));
export function leafPose(G, theta) { const phi = (180 - theta) / 2 * D2R; return [G.PA, add(G.PA, rot2(phi, [G.leaf, 0]))]; }
export function toFold(G, p) { return [G.book ? p[0] : -p[1], p[2]]; }
export function fromFold(G, p3, uz) { return G.book ? [uz[0], p3[1], uz[1]] : [p3[0], -uz[0], uz[1]]; }
export function poseB3(G, theta, p3) { return fromFold(G, p3, apply2(poseB(G, theta), toFold(G, p3))); }
export function fold3(G, theta) {
  const T = poseB(G, theta), c = Math.cos(T.a), s = Math.sin(T.a), n = G.n3, Z = [0, 0, 1], S = [n[1] * Z[2] - n[2] * Z[1], n[2] * Z[0] - n[0] * Z[2], n[0] * Z[1] - n[1] * Z[0]];
  const img = e => { const es = e[0] * S[0] + e[1] * S[1] + e[2] * S[2], en = e[0] * n[0] + e[1] * n[1] + e[2] * n[2], ez = e[2]; return [0, 1, 2].map(k => es * S[k] + en * (c * n[k] + s * Z[k]) + ez * (-s * n[k] + c * Z[k])); };
  const [cx, cy, cz] = [img([1, 0, 0]), img([0, 1, 0]), img([0, 0, 1])], tr = [0, 1, 2].map(k => T.o[0] * n[k] + T.o[1] * Z[k]);
  return [cx[0], cx[1], cx[2], 0, cy[0], cy[1], cy[2], 0, cz[0], cz[1], cz[2], 0, tr[0], tr[1], tr[2], 1];
}
export function profile(G, fillet, bump, tt) {
  const s = G.s, t = tt == null ? G.t : tt, r = Math.max(0.01, Math.min(fillet || 0.01, t / 2 - 0.01, s / 2)), pts = [];
  [[s - r, r, -90], [s - r, t - r, 0], [-s + r, t - r, 90], [-s + r, r, 180]].forEach(([cx, cz, a0]) => { for (let i = 0; i <= 6; i++) { const a = (a0 + 15 * i) * D2R; pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); } });
  const out = [pts]; bump && bump.depth > 0.01 && out.push([[bump.u0, -bump.depth], [bump.u1, -bump.depth], [bump.u1, 0.01], [bump.u0, 0.01]]);
  return out;
}
const segD = (p, a, b) => { const ab = sub(b, a), l2 = ab[0] * ab[0] + ab[1] * ab[1], t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2)) : 0; return Math.hypot(p[0] - a[0] - t * ab[0], p[1] - a[1] - t * ab[1]); };
const inside = (p, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) (P[i][1] > p[1]) !== (P[j][1] > p[1]) && p[0] < (P[j][0] - P[i][0]) * (p[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0] && (c = !c); return c; };
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const segX = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < -1e-12 && cross(c, d, a) * cross(c, d, b) < -1e-12;
const edgeD = (p, Q) => Math.min(...Q.map((a, i) => segD(p, a, Q[(i + 1) % Q.length])));
const bb = P => [Math.min(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[0])), Math.max(...P.map(p => p[1]))];
export function clearance(P, Q) {
  const a = bb(P), b = bb(Q), gx = Math.max(a[0] - b[2], b[0] - a[2]), gz = Math.max(a[1] - b[3], b[1] - a[3]); if (gx > 2 || gz > 2) return Math.hypot(Math.max(0, gx), Math.max(0, gz));
  const inP = Q.filter(q => inside(q, P)), inQ = P.filter(p => inside(p, Q));
  if (inP.length || inQ.length) return -Math.max(...inP.map(q => edgeD(q, P)), ...inQ.map(p => edgeD(p, Q)), 0.001);
  if (P.some((a, i) => Q.some((c, j) => segX(a, P[(i + 1) % P.length], c, Q[(j + 1) % Q.length])))) return -0.001;
  return Math.min(...P.map(p => edgeD(p, Q)), ...Q.map(q => edgeD(q, P)));
}
export function clearAt(G, profA, profB, theta) { const T = poseB(G, theta), PB = profB.map(P => P.map(p => apply2(T, p))); return Math.min(...profA.flatMap(P => PB.map(Q => clearance(P, Q)))); }
export function swing(G, fillet, bumps) {
  const st = K.swingStep, A = profile(G, fillet, bumps && bumps.A, G.t), B = profile(G, fillet, bumps && bumps.B, G.tB), hard = G.H.range, samples = [];
  for (let th = 0; th <= 360 + 1e-9; th += st) samples.push({ th, c: clearAt(G, A, B, th) });
  const ok = x => x.c > -0.02, at = th => samples[Math.round(th / st)];
  let lo = 180, hi = 180;
  while (lo - st >= hard[0] - 1e-9 && ok(at(lo - st))) lo -= st;
  while (hi + st <= hard[1] + 1e-9 && ok(at(hi + st))) hi += st;
  const inR = samples.filter(x => x.th >= lo && x.th <= hi), mid = inR.filter(x => x.th > lo + 1e-9 && x.th < hi - 1e-9);
  const worst = (mid.length ? mid : inR).reduce((a, b) => b.c < a.c ? b : a);
  const blocked = samples.filter(x => !ok(x) && x.th >= hard[0] && x.th <= hard[1]);
  return { lo, hi, minClear: worst.c, at: worst.th, samples, closes: lo <= 1e-9, full: hi >= 360 - 1e-9, flat: at(180).c, blockedAt: blocked.length ? blocked.map(x => x.th) : [], shut: at(0).c, back: at(360).c };
}
export const GRADE_BR = { N35: 1.2, N38: 1.24, N42: 1.3, N45: 1.34, N48: 1.39, N50: 1.42, N52: 1.45, N55: 1.49, N42SH: 1.3, N45SH: 1.34, N48SH: 1.39, N50SH: 1.42, N52SH: 1.45, N42UH: 1.29, N45UH: 1.33 };
export function brOf(p) { const s = (p && p.specs) || {}, g = String(s.grade || '').toUpperCase().replace(/\s/g, ''); return fin(s.br_t) ? s.br_t : GRADE_BR[g] || GRADE_BR[g.replace(/(SH|UH|H|M|EH)$/, '')] || 1.3; }
const LG = x => Math.log(Math.max(x, 1e-12));
export function ayForce(h1, h2, d, J1, J2) {
  const F = [0, 0, 0];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++) for (let p = 0; p < 2; p++) for (let q = 0; q < 2; q++) {
    const U = d[0] + (j ? -1 : 1) * h2[0] - (i ? -1 : 1) * h1[0], V = d[1] + (l ? -1 : 1) * h2[1] - (k ? -1 : 1) * h1[1], W = d[2] + (q ? -1 : 1) * h2[2] - (p ? -1 : 1) * h1[2], r = Math.hypot(U, V, W), sg = (i + j + k + l + p + q) % 2 ? -1 : 1, at = Math.abs(W) < 1e-12 ? 0 : Math.atan(U * V / (r * W));
    F[0] += sg * (0.5 * (V * V - W * W) * LG(r - U) + U * V * LG(r - V) + V * W * at + 0.5 * r * U);
    F[1] += sg * (0.5 * (U * U - W * W) * LG(r - V) + U * V * LG(r - U) + U * W * at + 0.5 * r * V);
    F[2] += sg * (-U * W * LG(r - U) - V * W * LG(r - V) + U * V * at - r * W);
  }
  return F.map(f => f * J1 * J2 / (4 * Math.PI * MU0) * 1e-6);
}
const PERM = [[1, 2, 0], [2, 0, 1], [0, 1, 2]];
export function pairForce(m1, m2) { const P = PERM[m1.ax], pm = v => P.map(k => v[k]), d = pm([0, 1, 2].map(k => m2.c[k] - m1.c[k])), F = ayForce(pm(m1.dims).map(v => v / 2), pm(m2.dims).map(v => v / 2), d, m1.J, m2.J); return { hold: -F[2] * Math.sign(d[2] || 1), shear: Math.hypot(F[0], F[1]), gap: Math.abs(d[2]) - (pm(m1.dims)[2] + pm(m2.dims)[2]) / 2 }; }
export function dipoleCloud(m, xf) {
  const n = [3, 3, 2], out = [], vol = m.dims[0] * m.dims[1] * m.dims[2] / 18 * 1e-9, mom = m.J / MU0 * vol;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < n[2]; c++) { const loc = [m.c[0] - m.dims[0] / 2 + (a + 0.5) * m.dims[0] / 3, m.c[1] - m.dims[1] / 2 + (b + 0.5) * m.dims[1] / 3, m.c[2] - m.dims[2] / 2 + (c + 0.5) * m.dims[2] / 2], dir = [0, 0, 0]; dir[m.ax] = m.sign || 1; const p = xf ? xf.p(loc) : loc, dv = xf ? xf.v(dir) : dir; out.push({ p, m: dv.map(v => v * mom) }); }
  return out;
}
export function fieldAt(cloud, p) {
  const B = [0, 0, 0];
  cloud.forEach(s => { const r = [0, 1, 2].map(k => (p[k] - s.p[k]) * 1e-3), R = Math.hypot(...r); if (R < 1e-6) return; const rh = r.map(v => v / R), md = s.m[0] * rh[0] + s.m[1] * rh[1] + s.m[2] * rh[2], k = 1e-7 / R ** 3; [0, 1, 2].forEach(i => { B[i] += k * (3 * rh[i] * md - s.m[i]); }); });
  return B;
}
export const boxDist = (a, b) => Math.hypot(Math.max(0, a[0] - b[3], b[0] - a[3]), Math.max(0, a[1] - b[4], b[1] - a[4]), Math.max(0, a[2] - b[5], b[2] - a[5]));
export function xformB(G, theta) { const T = poseB(G, theta); return { p: q => fromFold(G, q, apply2(T, toFold(G, q))), v: v => { const r = rot2(T.a, toFold(G, v)); return fromFold(G, v, r); } }; }
export function boxB(G, theta, box) { const X = xformB(G, theta), pts = []; for (const x of [box[0], box[3]]) for (const y of [box[1], box[4]]) for (const z of [box[2], box[5]]) pts.push(X.p([x, y, z])); return [0, 1, 2].map(k => Math.min(...pts.map(p => p[k]))).concat([0, 1, 2].map(k => Math.max(...pts.map(p => p[k])))); }
export function magnetModel(it) { const ax = it.magAx == null ? 2 : it.magAx, ring = it.p.n && it.p.n.ring, disc = it.p.specs && /disc|ring/i.test(String(it.p.specs.shape || '')), dims = [it.sx, it.sy, it.sz].map((v, k) => k === ax ? v : ring ? Math.sqrt(Math.PI / 4 * (ring[0] ** 2 - ring[1] ** 2)) : disc ? v * Math.sqrt(Math.PI) / 2 : v); return { c: [it.x, it.y, it.z + it.sz / 2], dims, ax, J: brOf(it.p), sign: it.magSign || 1 }; }
export function forceCurve(it, gaps) { const m = magnetModel(it); return (gaps || [0.5, 1, 2, 3, 4, 6, 8]).map(gp => ({ gap: gp, n: pairForce(m, { ...m, c: [m.c[0], m.c[1], m.c[2] + m.dims[2] + gp] }).hold })); }
export function magnetStudy(d, g, G, items, halfMass) {
  if (!G) { const mags = items.filter(i => i.cat === 'magnet' && i.half === 'A'), sensor = items.find(i => i.role === 'mag'), cloud = mags.flatMap(i => dipoleCloud(magnetModel(i))), keep = { qi_coil: K.magCoil, nfc_coil: K.magNfc, speaker: K.magSpk, receiver: K.magSpk, haptic: K.magSpk }, near = []; mags.forEach(m => items.filter(o => o.half === 'A' && (keep[o.cat] != null || keep[o.role] != null)).forEach(o => { const lim = keep[o.cat] != null ? keep[o.cat] : keep[o.role], dd = boxDist(m.box, o.box); dd < lim && near.push({ m: m.uid, o: o.uid, oname: o.name, d: dd, lim, th: 0 }); })); return { shut: [], flat: [], shutN: 0, flatN: 0, needShut: 0, needFlat: 0, maxShut: K.holdMax, weightN: halfMass.A * 9.81e-3, compass: sensor ? [{ th: 0, B: fieldAt(cloud, [sensor.x, sensor.y, sensor.z + sensor.sz / 2]), ut: Math.hypot(...fieldAt(cloud, [sensor.x, sensor.y, sensor.z + sensor.sz / 2])) * 1e6 }] : null, hall: null, range: sensor && Number.isFinite(sensor.p.n.rangeUt) ? sensor.p.n.rangeUt : null, delta: 0, near: near.sort((a, b) => a.d - b.d), count: mags.length, static: true }; }
  const mags = items.filter(i => i.cat === 'magnet'), M = i => magnetModel(i), poses = [0, 90, 180, ...(G.outer ? [270, 360] : [])];
  const pairF = (role, theta) => mags.filter(i => i.role === role && i.half === 'A').map(a => { const b = mags.find(i => i.role === role && i.half === 'B' && i.pair === a.pair); if (!b) return null; const X = xformB(G, theta), mb = M(b), c = X.p(mb.c), dimsB = (v => [0, 1, 2].map(k => Math.abs(v[k])))(X.v(mb.dims)); const ax = M(a).ax; return pairForce(M(a), { ...mb, c, dims: dimsB, ax }); }).filter(Boolean);
  const shut = pairF('mag_shut', 0), flat = pairF('mag_flat', 180);
  const lighter = Math.min(halfMass.A, halfMass.B), wN = lighter * 9.81e-3;
  const cloudAt = th => [...mags.filter(i => i.half === 'A').flatMap(i => dipoleCloud(M(i))), ...mags.filter(i => i.half === 'B').flatMap(i => dipoleCloud(M(i), xformB(G, th)))];
  const sensor = items.find(i => i.role === 'mag'), hall = items.find(i => i.role === 'hall');
  const ptOf = it => it.half === 'B' ? th => xformB(G, th).p([it.x, it.y, it.z + it.sz / 2]) : () => [it.x, it.y, it.z + it.sz / 2];
  const fieldPoses = it => it ? poses.map(th => { const B = fieldAt(cloudAt(th), ptOf(it)(th)); return { th, B, ut: Math.hypot(...B) * 1e6 }; }) : null;
  const compass = fieldPoses(sensor), hallF = fieldPoses(hall);
  const range = sensor ? (fin(sensor.p.n.rangeUt) ? sensor.p.n.rangeUt : null) : null;
  const delta = compass ? Math.max(...compass.flatMap(a => compass.map(b => Math.hypot(...a.B.map((v, k) => (v - b.B[k]) * 1e6))))) : null;
  const near = [], keep = { qi_coil: K.magCoil, nfc_coil: K.magNfc, speaker: K.magSpk, receiver: K.magSpk, haptic: K.magSpk };
  [0, 180].forEach(th => mags.forEach(m => items.filter(o => keep[o.cat] != null || keep[o.role] != null).forEach(o => { const lim = keep[o.cat] != null ? keep[o.cat] : keep[o.role]; const bm = m.half === 'B' ? boxB(G, th, m.box) : m.box, bo = o.half === 'B' ? boxB(G, th, o.box) : o.box; if (m.half !== o.half && th === 180) return; const dd = boxDist(bm, bo); dd < lim && near.push({ m: m.uid, o: o.uid, oname: o.name, d: dd, lim, th }); })));
  const total = a => a.reduce((s, x) => s + x.hold, 0);
  return { shut, flat, shutN: total(shut), flatN: total(flat), needShut: wN * K.holdK, needFlat: wN, maxShut: K.holdMax, weightN: wN, compass, hall: hallF, range, delta, near: near.sort((a, b) => a.d - b.d), count: mags.length };
}
export function hingeLoads(G, halfMass, detent) {
  if (!G || !G.outer) return null;
  const m = Math.max(halfMass.A, halfMass.B) / 1000, F = m * 9.81 * K.shock / 2, tau = F / (Math.PI * G.pinD ** 2 / 4), sy = G.leafMat.sy, bear = F / (G.pinD * G.leafT);
  const need = Math.min(halfMass.A, halfMass.B) / 1000 * 9.81 * G.s, have = detent && fin(detent.p.n.torque) ? detent.p.n.torque * 1000 * 2 : 0;
  return { F, tau, sfShear: 0.58 * sy / tau, bear, sfBear: sy / bear, needNmm: need, haveNmm: have, holds: have >= need, leafG: (G.leaf + G.leafW) * G.leafW * G.leafT / 1000 * G.leafMat.rho * 2 };
}
export function linkStudy(d, G, items, link, sw) {
  if (!G) return null;
  const k = link ? (link.p.n.kind || 'fpc_custom') : null, disp2 = items.find(i => i.role === 'display2'), out = { kind: k, notes: [], errors: [], warns: [] };
  if (!link) return { ...out, errors: ['No half-to-half link chosen: half B has no power or data path.'] };
  const res = s => { const m = String(s || '').match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/); return m ? Number(m[1]) * Number(m[2]) : null; };
  const needGbps = disp2 ? (res(disp2.p.n.res) || 1080 * 2400) * (disp2.p.n.hz || 60) * K.dsiBpp * K.dsiOver / 1e9 : 0;
  out.needGbps = needGbps; out.rate = fin(link.p.n.rate) ? link.p.n.rate : null;
  const flexR = G.outer ? Math.max(G.leafW / 2, G.pinD / 2 + 0.4) : Math.max(1, G.t / 2), needR = K.flexRmul * K.flexT;
  out.flexR = flexR; out.needR = needR;
  if (k === 'fpc_custom' || k === 'coax_micro') { flexR + 1e-9 < needR && out.errors.push(`Flex bend radius ${flexR.toFixed(1)} mm around the ${G.outer ? 'leaf' : 'barrel'} is below the dynamic-flex minimum ${needR.toFixed(1)} mm (${K.flexRmul}× a ${K.flexT} mm flex).`); G.outer && out.notes.push('With an outer hinge the flex leaves each shell through a sealed slot at the seam corner and runs along the leaf under a cover; display, touch and power reach half B in every pose.'); }
  if (k === 'pogo' || k === 'magnetic_pogo') { out.notes.push('Spring contacts only touch when shut or flat: half B gets power and data in those poses only.'); disp2 && out.warns.push('The second display goes dark between the shut and flat poses (pogo contacts break during the swing).'); }
  if (k === 'mmwave_60ghz') { const rng = fin(link.p.n.range) ? link.p.n.range : 10, dist = th => { const a = [G.book ? G.s - 2 : 0, G.book ? 0 : -(G.s - 2), G.t / 2], b = [G.book ? -(G.s - 2) : 0, G.book ? 0 : G.s - 2, G.t / 2]; const pb = xformB(G, th).p(b); return Math.hypot(...a.map((v, i) => v - pb[i])); }; const ds = [0, 45, 90, 135, 180].map(th => ({ th, mm: dist(th) })); out.dists = ds; out.range = rng; ds.some(x => x.mm > rng) && out.warns.push(`The 60 GHz pair is ${Math.max(...ds.map(x => x.mm)).toFixed(1)} mm apart at some angle; the part is rated to ${rng} mm, so the link drops there.`); !items.some(i => i.role === 'cell2') && out.errors.push('A contactless link carries no power: half B needs its own cell (choose a second cell).'); disp2 && out.rate != null && needGbps > out.rate && out.errors.push(`The second display needs ≈${needGbps.toFixed(2)} Gb/s of MIPI DSI; the ${link.p.mpn} link carries ${out.rate} Gb/s and does not tunnel DSI. Half B would need its own display processor.`); }
  return out;
}
