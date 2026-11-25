const r1 = v => Math.round(v * 10) / 10;
const xml = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PAL = { frame: '#6b6258', motor: '#c4554a', prop: '#8a8178', esc: '#3d6f8f', fc: '#2f6a4a', battery: '#a67c32', rx: '#7a5a96', camera: '#4d5560', vtx: '#b86b4a', cable: '#9aa3ad' };
const k2 = (x, z) => r1(x) + ',' + r1(z);
function dedupe(pts) {
  const m = new Map();
  pts.forEach(p => m.set(k2(p[0], p[1]), p));
  return [...m.values()];
}
function hull(pts) {
  const p = dedupe(pts).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (src) => { const h = []; src.forEach(q => { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); }); return h; };
  const lower = chain(p), upper = chain(p.slice().reverse());
  lower.pop(); upper.pop();
  return lower.concat(upper);
}
function upLoops(part) {
  const pos = part.positions, idx = part.indices || [], bag = new Map();
  const add = (ax, az, bx, bz) => {
    const ka = k2(ax, az), kb = k2(bx, bz);
    if (ka === kb) return;
    const k = ka < kb ? ka + '|' + kb : kb + '|' + ka, e = bag.get(k);
    e ? e.n++ : bag.set(k, { a: [ax, az], b: [bx, bz], ka, kb, n: 1 });
  };
  for (let i = 0; i < idx.length; i += 3) {
    const A = idx[i] * 3, B = idx[i + 1] * 3, C = idx[i + 2] * 3, ax = pos[A], az = pos[A + 2], bx = pos[B], bz = pos[B + 2], cx = pos[C], cz = pos[C + 2];
    const ny = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    ny > 1e-4 && (add(ax, az, bx, bz), add(bx, bz, cx, cz), add(cx, cz, ax, az));
  }
  const adj = new Map(), link = (k, p) => { const a = adj.get(k) || []; a.push(p); adj.set(k, a); };
  bag.forEach(e => e.n === 1 && (link(e.ka, e.b), link(e.kb, e.a)));
  const seen = new Set(), loops = [];
  bag.forEach(e => {
    if (e.n !== 1 || seen.has(e.ka + '>' + e.kb)) return;
    const loop = [e.a];
    let prev = e.ka, cur = e.b, ck = e.kb;
    seen.add(e.ka + '>' + e.kb); seen.add(e.kb + '>' + e.ka);
    for (let g = 0; g < 4000 && ck !== e.ka; g++) {
      loop.push(cur);
      const nxt = (adj.get(ck) || []).find(p => k2(p[0], p[1]) !== prev);
      if (!nxt) break;
      const nk = k2(nxt[0], nxt[1]);
      if (seen.has(ck + '>' + nk) && nk !== e.ka) break;
      seen.add(ck + '>' + nk); seen.add(nk + '>' + ck);
      prev = ck; cur = nxt; ck = nk;
    }
    loop.length >= 3 && loops.push(loop);
  });
  return loops;
}
export function drawingOf(result) {
  const placed = Object.fromEntries((result.placed || []).map(p => [p.id, p]));
  const shapes = (result.view.parts || []).filter(part => part.role !== 'cable' && part.positions.length).map(part => {
    const pts = [];
    for (let i = 0; i < part.positions.length; i += 3) pts.push([part.positions[i], part.positions[i + 2]]);
    const o = placed[part.id] && placed[part.id].origin;
    const c = o ? [o[0], o[2]] : pts.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]).map(v => v / pts.length);
    const rad = Math.max(...pts.map(p => Math.hypot(p[0] - c[0], p[1] - c[1])), 0.8);
    if (part.role === 'prop' || part.role === 'motor') return { id: part.id, role: part.role, kind: 'circle', c, r: rad };
    const loops = upLoops(part);
    const ring = hull(pts);
    return loops.length ? { id: part.id, role: part.role, kind: 'loops', loops, c } : ring.length >= 3 ? { id: part.id, role: part.role, kind: 'hull', pts: ring, c } : { id: part.id, role: part.role, kind: 'circle', c, r: rad };
  });
  const wires = result.wires || [];
  const motors = shapes.filter(s => s.role === 'motor');
  let dim = null;
  for (let i = 0; i < motors.length; i++) for (let j = i + 1; j < motors.length; j++) {
    const d = Math.hypot(motors[i].c[0] - motors[j].c[0], motors[i].c[1] - motors[j].c[1]);
    (!dim || d > dim.d) && (dim = { a: motors[i].c, b: motors[j].c, d });
  }
  const cloud = shapes.flatMap(s => s.kind === 'circle' ? [[s.c[0] - s.r, s.c[1] - s.r], [s.c[0] + s.r, s.c[1] + s.r]] : s.kind === 'loops' ? s.loops.flat() : s.pts).concat(wires.flatMap(w => [[w.aAt[0], w.aAt[2]], [w.bAt[0], w.bAt[2]]]));
  const xs = cloud.map(p => p[0]), zs = cloud.map(p => p[1]);
  const minx = Math.min(...xs) - 28, maxx = Math.max(...xs) + 28, minz = Math.min(...zs) - 28, maxz = Math.max(...zs) + 36;
  const W = 920, H = 720, s = Math.min(W / (maxx - minx), H / (maxz - minz));
  const X = x => (x - minx) * s + (W - (maxx - minx) * s) / 2, Y = z => (z - minz) * s + (H - (maxz - minz) * s) / 2;
  const lines = wires.map(w => `<line x1="${r1(X(w.aAt[0]))}" y1="${r1(Y(w.aAt[2]))}" x2="${r1(X(w.bAt[0]))}" y2="${r1(Y(w.bAt[2]))}" stroke="${w.name.startsWith('phase') ? '#c4554a' : w.name.startsWith('pack') ? '#c89b4e' : '#3d6f8f'}" stroke-width="${w.name.startsWith('pack') ? 1.6 : 0.8}" opacity="0.8"/>`).join('');
  const body = shapes.map(sh => {
    const col = PAL[sh.role] || '#243044';
    const labelAt = sh.kind === 'circle' && sh.role === 'prop' ? [sh.c[0] + sh.c[0] / (Math.hypot(sh.c[0], sh.c[1]) || 1) * sh.r * 0.72, sh.c[1] + sh.c[1] / (Math.hypot(sh.c[0], sh.c[1]) || 1) * sh.r * 0.72] : sh.c;
    const shape = sh.kind === 'circle' ? `<circle cx="${r1(X(sh.c[0]))}" cy="${r1(Y(sh.c[1]))}" r="${r1(sh.r * s)}" fill="${col}" fill-opacity="${sh.role === 'prop' ? 0.08 : 0.22}" stroke="${col}" stroke-width="${sh.role === 'prop' ? 1 : 1.4}" ${sh.role === 'prop' ? 'stroke-dasharray="3 2"' : ''}/>` : (sh.kind === 'loops' ? sh.loops : [sh.pts]).map(loop => `<polygon points="${loop.map(p => r1(X(p[0])) + ',' + r1(Y(p[1]))).join(' ')}" fill="${col}" fill-opacity="0.34" stroke="${col}" stroke-width="1.2"/>`).join('');
    return `<g data-id="${xml(sh.id)}">${shape}<text x="${r1(X(labelAt[0]))}" y="${r1(Y(labelAt[1]))}" text-anchor="middle" font-size="11" fill="#243044">${xml(sh.id)}</text></g>`;
  }).join('');
  const dimSvg = dim ? `<line x1="${r1(X(dim.a[0]))}" y1="${r1(Y(dim.a[1]))}" x2="${r1(X(dim.b[0]))}" y2="${r1(Y(dim.b[1]))}" stroke="#c89b4e" stroke-width="0.7" stroke-dasharray="5 3"/>` : '';
  const nose = `<polygon points="${r1(X(0))},${r1(Y(minz + 18))} ${r1(X(0) - 7)},${r1(Y(minz + 30))} ${r1(X(0) + 7)},${r1(Y(minz + 30))}" fill="#c89b4e"/><text x="${r1(X(0))}" y="${r1(Y(minz + 12))}" text-anchor="middle" font-size="10" fill="#8a6318">NOSE</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="sans-serif"><rect width="100%" height="100%" fill="#f4f1ea"/><text x="16" y="22" font-size="13" fill="#243044">${xml(result.assembly.name)} · top view · nose up · mm${dim ? ' · ' + r1(dim.d) + ' mm diagonal' : ''}</text>${lines}${body}${dimSvg}${nose}<text x="16" y="${H - 14}" font-size="11" fill="#5c6570">Dashed circles are prop disks. Solid circles are motors. Gold is the motor diagonal. Click a part.</text></svg>`;
}
