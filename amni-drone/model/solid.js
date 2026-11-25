import { add, sub, mul, cross, dot, norm, rotVec, quatAlign, quatFromAxis, IDQ } from './math.js';

const push = (positions, indices, a, b, c, colors, rgb) => {
  const n = positions.length / 3;
  positions.push(...a, ...b, ...c);
  indices.push(n, n + 1, n + 2);
  if (colors) {
    const col = rgb || [0.6, 0.6, 0.6];
    colors.push(...col, ...col, ...col);
  }
};

export function colorize(mesh, rgb) {
  const n = mesh.positions.length / 3, colors = [];
  for (let i = 0; i < n; i++) colors.push(rgb[0], rgb[1], rgb[2]);
  return { ...mesh, colors };
}

export function boxCentered(sx, sy, sz, rgb) {
  const x = sx / 2, y = sy / 2, z = sz / 2, p = [], idx = [], colors = rgb ? [] : null;
  const v = [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], [-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z]];
  [[4, 6, 5], [4, 7, 6], [0, 1, 2], [0, 2, 3], [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]].forEach(([a, b, c]) => push(p, idx, v[a], v[b], v[c], colors, rgb));
  return colors ? { positions: p, indices: idx, colors } : { positions: p, indices: idx };
}

export function boxAt(sx, sy, sz, ox, oy, oz, rgb) {
  return transform(boxCentered(sx, sy, sz, rgb), { origin: [ox, oy, oz], q: IDQ });
}

export function cyl(r, y0, y1, n, rgb) {
  return frustum(r, r, y0, y1, n, rgb);
}

export function frustum(r0, r1, y0, y1, n, rgb) {
  const p = [], idx = [], colors = rgb ? [] : null, seg = n || 20;
  for (let i = 0; i < seg; i++) {
    const a0 = 2 * Math.PI * i / seg, a1 = 2 * Math.PI * (i + 1) / seg;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    push(p, idx, [c0 * r0, y0, s0 * r0], [c0 * r1, y1, s0 * r1], [c1 * r1, y1, s1 * r1], colors, rgb);
    push(p, idx, [c0 * r0, y0, s0 * r0], [c1 * r1, y1, s1 * r1], [c1 * r0, y0, s1 * r0], colors, rgb);
    push(p, idx, [0, y1, 0], [c0 * r1, y1, s0 * r1], [c1 * r1, y1, s1 * r1], colors, rgb);
    push(p, idx, [0, y0, 0], [c1 * r0, y0, s1 * r0], [c0 * r0, y0, s0 * r0], colors, rgb);
  }
  return colors ? { positions: p, indices: idx, colors } : { positions: p, indices: idx };
}

export function tubeY(rIn, rOut, y0, y1, n, rgb) {
  const p = [], idx = [], colors = rgb ? [] : null, seg = n || 24;
  for (let i = 0; i < seg; i++) {
    const a0 = 2 * Math.PI * i / seg, a1 = 2 * Math.PI * (i + 1) / seg;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const i0b = [c0 * rIn, y0, s0 * rIn], i1b = [c1 * rIn, y0, s1 * rIn], o0b = [c0 * rOut, y0, s0 * rOut], o1b = [c1 * rOut, y0, s1 * rOut];
    const i0t = [c0 * rIn, y1, s0 * rIn], i1t = [c1 * rIn, y1, s1 * rIn], o0t = [c0 * rOut, y1, s0 * rOut], o1t = [c1 * rOut, y1, s1 * rOut];
    // Outer wall
    push(p, idx, o0b, o0t, o1t, colors, rgb);
    push(p, idx, o0b, o1t, o1b, colors, rgb);
    // Inner wall
    push(p, idx, i0b, i1t, i0t, colors, rgb);
    push(p, idx, i0b, i1b, i1t, colors, rgb);
    // Bottom face (ny > 0 for draw.js)
    push(p, idx, i0b, o0b, o1b, colors, rgb);
    push(p, idx, i0b, o1b, i1b, colors, rgb);
    // Top face (ny < 0)
    push(p, idx, i0t, o1t, o0t, colors, rgb);
    push(p, idx, i0t, i1t, o1t, colors, rgb);
  }
  return colors ? { positions: p, indices: idx, colors } : { positions: p, indices: idx };
}

export function extrudeConvexXZ(ptsXZ, y0, y1, rgb) {
  const p = [], idx = [], colors = rgb ? [] : null, n = ptsXZ.length;
  if (n < 3) return { positions: p, indices: idx };
  // Ensure counter-clockwise in XZ so (bx-ax)*(cz-az) - (bz-az)*(cx-ax) > 0
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = ptsXZ[i], b = ptsXZ[(i + 1) % n];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const poly = area >= 0 ? ptsXZ : ptsXZ.slice().reverse();
  for (let i = 1; i < n - 1; i++) {
    const a = poly[0], b = poly[i], c = poly[i + 1];
    // Bottom cap (ny > 0 so draw.js traces this loop once)
    push(p, idx, [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]], colors, rgb);
    // Top cap (ny < 0, outward +Y normal)
    push(p, idx, [a[0], y1, a[1]], [c[0], y1, c[1]], [b[0], y1, b[1]], colors, rgb);
  }
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    push(p, idx, [a[0], y0, a[1]], [a[0], y1, a[1]], [b[0], y1, b[1]], colors, rgb);
    push(p, idx, [a[0], y0, a[1]], [b[0], y1, b[1]], [b[0], y0, b[1]], colors, rgb);
  }
  return colors ? { positions: p, indices: idx, colors } : { positions: p, indices: idx };
}

export function octPlate(sx, sy, sz, chamferFrac = 0.2, y0 = 0, rgb) {
  const hx = sx / 2, hz = sz / 2, cx = hx * chamferFrac, cz = hz * chamferFrac;
  const pts = [
    [-hx + cx, -hz], [hx - cx, -hz],
    [hx, -hz + cz], [hx, hz - cz],
    [hx - cx, hz], [-hx + cx, hz],
    [-hx, hz - cz], [-hx, -hz + cz]
  ];
  return extrudeConvexXZ(pts, y0, y0 + sy, rgb);
}

export function merge(meshes) {
  const positions = [], indices = [], colors = [];
  let hasColor = false;
  meshes.filter(Boolean).forEach(m => { if (m.colors && m.colors.length) hasColor = true; });
  meshes.filter(Boolean).forEach(m => {
    const o = positions.length / 3;
    positions.push(...m.positions);
    m.indices.forEach(i => indices.push(i + o));
    if (hasColor) {
      if (m.colors && m.colors.length === m.positions.length) colors.push(...m.colors);
      else for (let i = 0; i < m.positions.length; i += 3) colors.push(0.55, 0.55, 0.58);
    }
  });
  return hasColor ? { positions, indices, colors } : { positions, indices };
}

export function transform(mesh, pose) {
  const positions = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const w = add(pose.origin, rotVec(pose.q, [mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]]));
    positions.push(w[0], w[1], w[2]);
  }
  return mesh.colors ? { positions, indices: mesh.indices.slice(), colors: mesh.colors.slice() } : { positions, indices: mesh.indices.slice() };
}

export function volume(mesh) {
  let v = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const a = mesh.indices[i] * 3, b = mesh.indices[i + 1] * 3, c = mesh.indices[i + 2] * 3;
    const pa = [mesh.positions[a], mesh.positions[a + 1], mesh.positions[a + 2]];
    const pb = [mesh.positions[b], mesh.positions[b + 1], mesh.positions[b + 2]];
    const pc = [mesh.positions[c], mesh.positions[c + 1], mesh.positions[c + 2]];
    v += dot(pa, cross(sub(pb, pa), sub(pc, pa)));
  }
  return Math.abs(v) / 6;
}

const GROW = {
  '+y': (s, x, y, z) => [x - s[0] / 2, y, z - s[2] / 2, x + s[0] / 2, y + s[1], z + s[2] / 2],
  '-z': (s, x, y, z) => [x - s[0] / 2, y - s[1] / 2, z - s[2], x + s[0] / 2, y + s[1] / 2, z]
};

function boxGrow(size, grow, rgb) {
  const b = (GROW[grow] || GROW['+y'])(size, 0, 0, 0);
  const sx = b[3] - b[0], sy = b[4] - b[1], sz = b[5] - b[2];
  const c = [(b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2];
  return transform(boxCentered(sx, sy, sz, rgb), { origin: c, q: IDQ });
}

function motorMesh(g) {
  const od = g.od_mm || 28, h = g.height_mm || 31.6, sd = g.shaft_d_mm || 5, sh = g.shaft_h_mm || 5;
  const r = od / 2;
  const darkAlu = [0.18, 0.20, 0.24], crimson = [0.78, 0.28, 0.24], copper = [0.82, 0.46, 0.20], steel = [0.84, 0.87, 0.91];
  const parts = [
    // Stator base flange + mounting cross
    frustum(r * 0.88, r * 0.84, 0, h * 0.10, 20, darkAlu),
    boxAt(r * 1.65, h * 0.08, r * 0.42, 0, h * 0.04, 0, darkAlu),
    boxAt(r * 0.42, h * 0.08, r * 1.65, 0, h * 0.04, 0, darkAlu),
    // Stator neck & copper windings core
    cyl(r * 0.56, h * 0.10, h * 0.24, 16, darkAlu),
    cyl(r * 0.82, h * 0.22, h * 0.82, 20, copper),
    // Rotor bell lower skirt ring
    tubeY(r * 0.83, r * 0.99, h * 0.21, h * 0.32, 24, darkAlu),
    // Main rotor bell (crimson anodized)
    tubeY(r * 0.84, r, h * 0.32, h * 0.88, 24, crimson),
    // Top bell crown bevel with open stator cooling vents
    frustum(r * 0.98, r * 0.46, h * 0.88, h, 20, darkAlu),
    cyl(r * 0.34, h * 0.85, h, 14, crimson),
    // Steel prop shaft + M5 locknut collar
    cyl(sd / 2, h, h + sh, 14, steel),
    frustum(sd * 0.92, sd * 0.72, h, h + Math.min(sh * 0.55, 2.8), 6, crimson)
  ];
  // Vertical knurled bell ribs
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * i) / 3;
    const q = quatFromAxis([0, 1, 0], a);
    parts.push(transform(boxCentered(r * 2.02, h * 0.52, r * 0.14, darkAlu), { origin: [0, h * 0.60, 0], q }));
  }
  return merge(parts);
}

function propMesh(g) {
  const nBlades = g.blades || 3, d = g.d_mm || 131.8, hubD = g.hub_d_mm || 13.5, hubH = g.hub_h_mm || 6.8;
  const R = d / 2, rHub = hubD / 2;
  const pcSmoke = [0.78, 0.81, 0.84], pcHub = [0.62, 0.66, 0.70];
  const parts = [
    tubeY(2.5, rHub, 0, hubH, 18, pcHub)
  ];
  const stations = [
    { f: 0.08, chord: 0.075 * d, pitchDeg: 31, sweep: 0.000 * d, thick: 2.3, yMid: hubH * 0.52 },
    { f: 0.24, chord: 0.112 * d, pitchDeg: 26, sweep: 0.015 * d, thick: 2.0, yMid: hubH * 0.54 },
    { f: 0.48, chord: 0.125 * d, pitchDeg: 20, sweep: 0.026 * d, thick: 1.6, yMid: hubH * 0.52 },
    { f: 0.72, chord: 0.106 * d, pitchDeg: 15, sweep: 0.018 * d, thick: 1.3, yMid: hubH * 0.48 },
    { f: 0.90, chord: 0.074 * d, pitchDeg: 12, sweep: -0.004 * d, thick: 1.0, yMid: hubH * 0.45 },
    { f: 1.00, chord: 0.032 * d, pitchDeg: 10, sweep: -0.020 * d, thick: 0.7, yMid: hubH * 0.42 }
  ];
  for (let b = 0; b < nBlades; b++) {
    const q = quatAlign([0, 0, 1], [Math.sin(2 * Math.PI * b / nBlades), 0, Math.cos(2 * Math.PI * b / nBlades)]);
    const pos = [], idx = [], colors = [];
    const ringOf = st => {
      const z = st.f * R, hw = st.chord / 2, rad = st.pitchDeg * Math.PI / 180;
      const dy = Math.min(hubH * 0.42, hw * Math.sin(rad)), dx = hw * Math.cos(rad), ht = st.thick / 2;
      const xLead = st.sweep + dx, xTrail = st.sweep - dx;
      const yLead = st.yMid + dy, yTrail = st.yMid - dy;
      return [
        [xLead, yLead + ht * 0.5, z],
        [st.sweep, st.yMid + ht * 1.15, z],
        [xTrail, yTrail + ht * 0.4, z],
        [xTrail, yTrail - ht * 0.4, z],
        [st.sweep, st.yMid - ht * 0.85, z],
        [xLead, yLead - ht * 0.5, z]
      ];
    };
    const rings = stations.map(ringOf);
    for (let s = 0; s < rings.length - 1; s++) {
      const A = rings[s], B = rings[s + 1], m = A.length;
      for (let k = 0; k < m; k++) {
        const kn = (k + 1) % m;
        push(pos, idx, A[k], B[k], B[kn], colors, pcSmoke);
        push(pos, idx, A[k], B[kn], A[kn], colors, pcSmoke);
      }
    }
    const tip = rings[rings.length - 1];
    push(pos, idx, tip[0], tip[1], tip[2], colors, pcSmoke);
    push(pos, idx, tip[0], tip[2], tip[3], colors, pcSmoke);
    push(pos, idx, tip[0], tip[3], tip[4], colors, pcSmoke);
    push(pos, idx, tip[0], tip[4], tip[5], colors, pcSmoke);
    parts.push(transform({ positions: pos, indices: idx, colors }, { origin: [0, 0, 0], q }));
  }
  return merge(parts);
}

function escMesh(size) {
  const [sx, sy, sz] = size;
  const pcbCol = [0.14, 0.24, 0.34], fetCol = [0.16, 0.18, 0.21], padCol = [0.85, 0.68, 0.28], gromCol = [0.86, 0.68, 0.18], capCol = [0.14, 0.15, 0.18];
  const parts = [
    // Exact bounding rails/pads so AABB matches size_mm
    boxAt(sx, sy * 0.28, sz, 0, sy * 0.32, 0, pcbCol),
    // Central heatsink / MCU shield
    boxAt(sx * 0.52, sy * 0.22, sz * 0.68, 0, sy * 0.55, 0, fetCol)
  ];
  // 4 silicone corner grommets at 30.5 x 30.5
  const gx = Math.min(15.25, sx * 0.36), gz = Math.min(15.25, sz * 0.36);
  [[-gx, -gz], [gx, -gz], [-gx, gz], [gx, gz]].forEach(([x, z]) => {
    parts.push(transform(cyl(2.8, 0, sy * 0.88, 12, gromCol), { origin: [x, 0, z], q: IDQ }));
  });
  // 12 gold motor solder pads along left & right edges + 4 banks of MOSFETs
  for (let i = 0; i < 6; i++) {
    const z = -sz * 0.36 + (i * sz * 0.72) / 5;
    parts.push(boxAt(3.2, sy * 0.14, 2.4, -sx * 0.44, sy * 0.50, z, padCol));
    parts.push(boxAt(3.2, sy * 0.14, 2.4, sx * 0.44, sy * 0.50, z, padCol));
    parts.push(boxAt(4.2, sy * 0.22, 3.0, -sx * 0.26, sy * 0.56, z, fetCol));
    parts.push(boxAt(4.2, sy * 0.22, 3.0, sx * 0.26, sy * 0.56, z, fetCol));
  }
  // Rear XT60 pads & low-ESR filter capacitor tucked inside envelope
  parts.push(boxAt(5.5, sy * 0.18, 4.0, -6.5, sy * 0.50, sz * 0.42, [0.80, 0.24, 0.22]));
  parts.push(boxAt(5.5, sy * 0.18, 4.0, 6.5, sy * 0.50, sz * 0.42, fetCol));
  parts.push(boxAt(12, sy * 0.52, 5.2, 0, sy * 0.72, sz * 0.41, capCol));
  return merge(parts);
}

function fcMesh(size) {
  const [sx, sy, sz] = size;
  const pcbCol = [0.16, 0.22, 0.20], icCol = [0.12, 0.14, 0.16], silver = [0.76, 0.80, 0.84], gold = [0.85, 0.68, 0.28], gromCol = [0.86, 0.68, 0.18];
  const parts = [
    boxAt(sx, sy * 0.24, sz, 0, sy * 0.30, 0, pcbCol),
    // Rotated 45-deg STM32F405 MCU chip
    transform(boxCentered(7.5, sy * 0.22, 7.5, icCol), { origin: [-2, sy * 0.52, -2], q: quatFromAxis([0, 1, 0], Math.PI / 4) }),
    // Gyro IMU shield, OSD chip, barometer, SD slot, USB-C receptacle
    boxAt(4.2, sy * 0.20, 4.2, 6.5, sy * 0.52, -5.5, silver),
    boxAt(5.2, sy * 0.20, 10.5, 0, sy * 0.52, 9.0, icCol),
    boxAt(11.0, sy * 0.28, 9.0, -7.5, sy * 0.56, 8.5, silver),
    boxAt(5.5, sy * 0.38, 7.2, sx * 0.42, sy * 0.62, 0, silver),
    boxAt(9.5, sy * 0.26, 3.6, 0, sy * 0.55, sz * 0.43, [0.88, 0.88, 0.86])
  ];
  const gx = Math.min(15.25, sx * 0.36), gz = Math.min(15.25, sz * 0.36);
  [[-gx, -gz], [gx, -gz], [-gx, gz], [gx, gz]].forEach(([x, z]) => {
    parts.push(transform(cyl(2.6, 0, sy * 0.96, 12, gromCol), { origin: [x, 0, z], q: IDQ }));
  });
  for (let i = -3; i <= 3; i++) {
    parts.push(boxAt(1.8, sy * 0.08, 1.4, i * 3.2, sy * 0.44, -sz * 0.44, gold));
  }
  return merge(parts);
}

function cameraMesh(size) {
  const [sx, sy, sz] = size;
  const bodyCol = [0.22, 0.25, 0.29], barrelCol = [0.14, 0.16, 0.19], lensCol = [0.20, 0.38, 0.62], silver = [0.72, 0.76, 0.80];
  const qZ = quatAlign([0, 1, 0], [0, 0, -1]);
  const rBarrel = Math.min(sx, sy) * 0.40;
  return merge([
    // Rear sensor housing (-z from 0 to -sz*0.46)
    boxAt(sx, sy, sz * 0.44, 0, 0, -sz * 0.22, bodyCol),
    // Side M2 pivot brackets
    boxAt(sx, sy * 0.32, sz * 0.26, 0, 0, -sz * 0.35, silver),
    // Stepped cylindrical lens barrel & focus ring along -Z
    transform(cyl(rBarrel, sz * 0.44, sz * 0.78, 20, barrelCol), { origin: [0, 0, 0], q: qZ }),
    transform(cyl(rBarrel * 1.10, sz * 0.78, sz * 0.95, 20, bodyCol), { origin: [0, 0, 0], q: qZ }),
    // Multi-coated front glass element at -sz
    transform(frustum(rBarrel * 0.92, rBarrel * 0.62, sz * 0.95, sz, 20, lensCol), { origin: [0, 0, 0], q: qZ })
  ]);
}

function batteryMesh(size) {
  const [sx, sy, sz] = size;
  const wrapCol = [0.16, 0.17, 0.20], labelCol = [0.82, 0.62, 0.24], strapCol = [0.28, 0.30, 0.34], xtCol = [0.90, 0.72, 0.16], redWire = [0.78, 0.24, 0.22];
  const cellH = (sy * 0.92) / 4;
  const parts = [
    // Exact outer strap & corner bounds so AABB == size_mm
    boxAt(sx, sy, 14, 0, sy * 0.5, 0, strapCol),
    // Gold CNHL branding sleeve
    boxAt(sx * 0.98, sy * 0.94, sz * 0.52, 0, sy * 0.48, -sz * 0.04, labelCol),
    // Rear XT60 connector housing + power leads within +Z bound
    boxAt(8.5, 14, 9.0, -sx * 0.24, sy * 0.38, sz * 0.44, xtCol),
    boxAt(2.8, 2.8, 7.0, -sx * 0.30, sy * 0.48, sz * 0.38, redWire),
    boxAt(2.8, 2.8, 7.0, -sx * 0.18, sy * 0.30, sz * 0.38, wrapCol)
  ];
  for (let c = 0; c < 4; c++) {
    const yMid = 1.0 + (c + 0.5) * cellH;
    parts.push(boxAt(sx * 0.96, cellH * 0.88, sz * 0.92, 0, yMid, -sz * 0.03, wrapCol));
  }
  return merge(parts);
}

function vtxMesh(size) {
  const [sx, sy, sz] = size;
  const pcbCol = [0.16, 0.19, 0.24], sinkCol = [0.74, 0.40, 0.26], brass = [0.84, 0.68, 0.28];
  const parts = [
    boxAt(sx, sy * 0.30, sz, 0, sy * 0.15, 0, pcbCol),
    // Brass MMCX connector on rear edge
    boxAt(4.2, sy * 0.55, 5.5, 0, sy * 0.58, sz * 0.38, brass)
  ];
  const nFins = 5, finW = (sx * 0.76) / (nFins * 1.6);
  for (let i = 0; i < nFins; i++) {
    const x = -sx * 0.34 + (i * sx * 0.68) / (nFins - 1);
    parts.push(boxAt(finW, sy * 0.68, sz * 0.72, x, sy * 0.64, -sz * 0.04, sinkCol));
  }
  return merge(parts);
}

function rxMesh(size) {
  const [sx, sy, sz] = size;
  return merge([
    boxAt(sx, sy * 0.42, sz, 0, sy * 0.21, 0, [0.22, 0.38, 0.52]),
    boxAt(sx * 0.52, sy * 0.48, sz * 0.54, -sx * 0.1, sy * 0.66, 0, [0.76, 0.80, 0.84]),
    boxAt(sx * 0.22, sy * 0.36, sz * 0.22, sx * 0.26, sy * 0.60, -sz * 0.2, [0.14, 0.16, 0.19]),
    boxAt(sx * 0.88, sy * 0.36, 2.2, 0, sy * 0.78, sz * 0.38, [0.85, 0.68, 0.28]),
    transform(cyl(1.1, 0, sy * 0.85, 10, [0.85, 0.68, 0.28]), { origin: [0, 0, sz * 0.28], q: IDQ })
  ]);
}

export function partMesh(comp) {
  const g = (comp.geometry && comp.geometry.primitive) || { type: 'block', size_mm: (comp.layout && comp.layout.envelope_mm) || [10, 10, 10] };
  if (g.type === 'motor') return motorMesh(g);
  if (g.type === 'prop') return propMesh(g);
  if (g.type === 'x-frame') return frameMesh(comp);
  const sz = g.size_mm || [10, 10, 10], role = comp.function && comp.function.role;
  if (Math.min(sz[0], sz[1], sz[2]) > 2.5) {
    if (role === 'esc') return escMesh(sz);
    if (role === 'fc') return fcMesh(sz);
    if (role === 'camera' && g.grow === '-z') return cameraMesh(sz);
    if (role === 'battery') return batteryMesh(sz);
    if (role === 'vtx') return vtxMesh(sz);
    if (role === 'rx') return rxMesh(sz);
  }
  return boxGrow(sz, g.grow || '+y', [0.46, 0.50, 0.56]);
}

export function frameMesh(comp) {
  const g = (comp.geometry && comp.geometry.primitive) || { plate_mm: [52, 2.5, 52], arm_w_mm: 12, arm_t_mm: 6 };
  const plate = g.plate_mm || [52, 2.5, 52];
  const isMaker = comp.sourcing && comp.sourcing.status === 'maker';
  const matId = (comp.specs && comp.specs.print && comp.specs.print.material) || 'petg';
  const matColors = {
    'petg': [0.22, 0.56, 0.68],
    'pla-plus': [0.78, 0.52, 0.22],
    'petg-cf': [0.24, 0.27, 0.31],
    'pa-cf': [0.18, 0.20, 0.23],
    'asa': [0.76, 0.74, 0.68]
  };
  const bodyCol = isMaker ? (matColors[matId] || [0.24, 0.54, 0.66]) : [0.26, 0.25, 0.23];
  const accentCol = isMaker ? [0.18, 0.42, 0.52] : [0.72, 0.28, 0.24];
  const darkCol = [0.18, 0.19, 0.22];

  const pw = plate[0], pt = plate[1], pl = plate[2];
  const armW0 = g.arm_w_mm || 12;
  const armW1 = g.arm_tip_w_mm || armW0;
  const armT = g.arm_t_mm || 6;
  const pocket = g.pocket_ratio ?? 0;
  const flatBottom = !!g.flat_bottom;

  const parts = [
    // Chamfered octagonal bottom center plate (no overlap with arms!)
    octPlate(pw, pt, pl, 0.22, 0, bodyCol)
  ];

  const rStart = Math.min(pw, pl) * 0.44;
  const padR = (g.motor_pad_d_mm || 27) / 2;

  ((comp.layout && comp.layout.ports) || []).filter(p => p.channel).forEach(port => {
    const x = port.at_mm[0], z = port.at_mm[2], L = Math.hypot(x, z) || 1;
    const dir = [x / L, 0, z / L], q = quatAlign([0, 0, 1], dir);
    const yPort = port.at_mm[1];
    const yBot = flatBottom ? 0 : Math.max(0, yPort - armT);
    const yTop = flatBottom ? Math.min(yPort, armT) : yPort;
    const z0 = Math.min(rStart, L * 0.35), z1 = Math.max(z0 + 8, L - padR * 0.55);

    if (pocket > 0.05 && (z1 - z0) > 20) {
      // Truss-lightened arm: solid root + left/right rails + center cross-rib + solid neck
      const zRootEnd = z0 + (z1 - z0) * 0.15;
      const zMid = (z0 + z1) * 0.5;
      const zTipStart = z1 - (z1 - z0) * 0.15;
      const wRootEnd = armW0 + (armW1 - armW0) * 0.15;
      const wMid = (armW0 + armW1) * 0.5;
      const wTipStart = armW0 + (armW1 - armW0) * 0.85;
      const railFrac = Math.max(0.22, (1 - pocket) * 0.40);

      parts.push(transform(extrudeConvexXZ([
        [-armW0 / 2, z0], [armW0 / 2, z0], [wRootEnd / 2, zRootEnd], [-wRootEnd / 2, zRootEnd]
      ], yBot, yTop, bodyCol), { origin: [0, 0, 0], q }));

      parts.push(transform(extrudeConvexXZ([
        [-wTipStart / 2, zTipStart], [wTipStart / 2, zTipStart], [armW1 / 2, z1], [-armW1 / 2, z1]
      ], yBot, yTop, bodyCol), { origin: [0, 0, 0], q }));

      parts.push(transform(extrudeConvexXZ([
        [-wRootEnd / 2, zRootEnd], [-wRootEnd * (0.5 - railFrac), zRootEnd],
        [-wTipStart * (0.5 - railFrac), zTipStart], [-wTipStart / 2, zTipStart]
      ], yBot, yTop, bodyCol), { origin: [0, 0, 0], q }));

      parts.push(transform(extrudeConvexXZ([
        [wRootEnd * (0.5 - railFrac), zRootEnd], [wRootEnd / 2, zRootEnd],
        [wTipStart / 2, zTipStart], [wTipStart * (0.5 - railFrac), zTipStart]
      ], yBot, yTop, bodyCol), { origin: [0, 0, 0], q }));

      parts.push(transform(extrudeConvexXZ([
        [-wMid * (0.5 - railFrac), zMid - 2.0], [wMid * (0.5 - railFrac), zMid - 2.0],
        [wMid * (0.5 - railFrac), zMid + 2.0], [-wMid * (0.5 - railFrac), zMid + 2.0]
      ], yBot, yTop, accentCol), { origin: [0, 0, 0], q }));
    } else {
      const armPoly = [[-armW0 / 2, z0], [armW0 / 2, z0], [armW1 / 2, z1], [-armW1 / 2, z1]];
      parts.push(transform(extrudeConvexXZ(armPoly, yBot, yTop, bodyCol), { origin: [0, 0, 0], q }));
    }

    // Circular motor mount pad reaching port height yPort
    parts.push(transform(tubeY(3.4, padR, yBot, yPort, 16, bodyCol), { origin: [x, 0, z], q: IDQ }));
    parts.push(transform(tubeY(padR * 0.84, padR * 1.04, yPort, yPort + 1.2, 16, accentCol), { origin: [x, 0, z], q: IDQ }));
  });

  if (!isMaker) {
    const standH = 30.5;
    [[-13, -23], [13, -23], [-17, 0], [17, 0], [-13, 23], [13, 23]].forEach(([sx, sz]) => {
      parts.push(transform(cyl(2.4, pt, standH, 10, accentCol), { origin: [sx, 0, sz], q: IDQ }));
    });
    parts.push(octPlate(34, 2.0, 64, 0.18, standH, darkCol));
    parts.push(boxAt(2.0, 22, 14, -10.5, 14.5, -28, darkCol));
    parts.push(boxAt(2.0, 22, 14, 10.5, 14.5, -28, darkCol));
  } else {
    const deckY = 30.5;
    const pScale = 1 - pocket * 0.45;
    [[-16, -15], [16, -15], [-16, 15], [16, 15]].forEach(([sx, sz]) => {
      parts.push(transform(frustum(3.2 * pScale, 2.2 * pScale, pt, deckY, 10, accentCol), { origin: [sx, 0, sz], q: IDQ }));
    });
    parts.push(octPlate(30 * pScale, 1.8, 52 * pScale, 0.18, deckY, accentCol));
    parts.push(boxAt(2.0 * pScale, 16, 11, -10.7, 10.5, -28, accentCol));
    parts.push(boxAt(2.0 * pScale, 16, 11, 10.7, 10.5, -28, accentCol));
  }

  return merge(parts);
}

export function stlBinary(mesh) {
  const n = mesh.indices.length / 3, b = new ArrayBuffer(84 + n * 50), v = new DataView(b);
  v.setUint32(80, n, true);
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50, ia = mesh.indices[i * 3] * 3, ib = mesh.indices[i * 3 + 1] * 3, ic = mesh.indices[i * 3 + 2] * 3;
    const pa = [mesh.positions[ia], mesh.positions[ia + 1], mesh.positions[ia + 2]];
    const pb = [mesh.positions[ib], mesh.positions[ib + 1], mesh.positions[ib + 2]];
    const pc = [mesh.positions[ic], mesh.positions[ic + 1], mesh.positions[ic + 2]];
    const nn = norm(cross(sub(pb, pa), sub(pc, pa)));
    [nn, pa, pb, pc].forEach((p, k) => {
      v.setFloat32(o + k * 12, p[0], true);
      v.setFloat32(o + k * 12 + 4, p[1], true);
      v.setFloat32(o + k * 12 + 8, p[2], true);
    });
  }
  return b;
}
