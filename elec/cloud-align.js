// Pure point-cloud helpers (node-safe, no three). Fit the dominant ground plane of a scanned cloud
// (RANSAC + least-squares refine) and build a transform that lays that plane on y=0 with its normal
// pointing up — so an Amni-Scan room cloud drops in under the 3D simulator, floor-aligned. Points are
// arrays of [x,y,z].
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const len = a => Math.hypot(a[0], a[1], a[2])
const normalize = a => { const m = len(a) || 1; return [a[0] / m, a[1] / m, a[2] / m] }
const matVec = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]]
const rodrigues = (ax, ang) => { const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c, x = ax[0], y = ax[1], z = ax[2]; return [[t * x * x + c, t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + c, t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + c]] }

// Unit eigenvector of the SMALLEST eigenvalue of a symmetric 3x3 [[a,d,e],[d,b,f],[e,f,c]], via the
// closed-form (Smith) eigenvalues + null-space of (A - λI) from the largest row cross-product.
function eigSmallVec(a, b, c, d, e, f) {
  const p1 = d * d + e * e + f * f
  if (p1 < 1e-18) { const arr = [[a, [1, 0, 0]], [b, [0, 1, 0]], [c, [0, 0, 1]]].sort((x, y) => x[0] - y[0]); return arr[0][1] }
  const q = (a + b + c) / 3, p2 = (a - q) * (a - q) + (b - q) * (b - q) + (c - q) * (c - q) + 2 * p1, p = Math.sqrt(p2 / 6) || 1
  const Ba = (a - q) / p, Bb = (b - q) / p, Bc = (c - q) / p, Bd = d / p, Be = e / p, Bf = f / p
  let r = (Ba * (Bb * Bc - Bf * Bf) - Bd * (Bd * Bc - Bf * Be) + Be * (Bd * Bf - Bb * Be)) / 2; r = Math.max(-1, Math.min(1, r))
  const phi = Math.acos(r) / 3, lam = q + 2 * p * Math.cos(phi + 2 * Math.PI / 3)
  const r0 = [a - lam, d, e], r1 = [d, b - lam, f], r2 = [e, f, c - lam]
  const c01 = cross(r0, r1), c02 = cross(r0, r2), c12 = cross(r1, r2)
  let bv = c01, bl = len(c01); if (len(c02) > bl) { bv = c02; bl = len(c02) } if (len(c12) > bl) bv = c12
  return normalize(bv)
}
function lsPlane(pts) {
  const n = pts.length; if (n < 3) return null
  let cx = 0, cy = 0, cz = 0; for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2] } cx /= n; cy /= n; cz /= n
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0
  for (const p of pts) { const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz; xx += dx * dx; xy += dx * dy; xz += dx * dz; yy += dy * dy; yz += dy * dz; zz += dz * dz }
  const nrm = eigSmallVec(xx, yy, zz, xy, xz, yz)
  return [nrm[0], nrm[1], nrm[2], -dot(nrm, [cx, cy, cz])]
}

// RANSAC dominant plane: [nx,ny,nz,d] with the normal normalized (plane n·p + d = 0).
export function fitGroundPlane(pts, opts) {
  opts = opts || {}; const n = pts.length; if (n < 3) return null
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
  for (const p of pts) for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k] }
  const diag = Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) || 1
  const thr = opts.thr || diag * 0.012, iters = opts.iters || 220, rnd = opts.rng || Math.random
  let best = null, bestCnt = -1
  for (let it = 0; it < iters; it++) {
    const a = pts[(rnd() * n) | 0], b = pts[(rnd() * n) | 0], c = pts[(rnd() * n) | 0], nv = cross(sub(b, a), sub(c, a))
    if (len(nv) < 1e-9) continue
    const nn = normalize(nv), d = -dot(nn, a); let cnt = 0
    for (const p of pts) if (Math.abs(nn[0] * p[0] + nn[1] * p[1] + nn[2] * p[2] + d) < thr) cnt++
    if (cnt > bestCnt) { bestCnt = cnt; best = [nn[0], nn[1], nn[2], d] }
  }
  if (!best) return null
  const inl = pts.filter(p => Math.abs(best[0] * p[0] + best[1] * p[1] + best[2] * p[2] + best[3]) < thr)
  return lsPlane(inl) || best
}

// Build a transform that maps the plane's normal to +y and drops the plane onto y=0.
export function floorAlign(plane) {
  let n = normalize([plane[0], plane[1], plane[2]]), d = plane[3]
  if (n[1] < 0) { n = [-n[0], -n[1], -n[2]]; d = -d }
  const up = [0, 1, 0], cosA = Math.max(-1, Math.min(1, dot(n, up)))
  let R
  if (cosA > 0.999999) R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  else if (cosA < -0.999999) R = [[1, 0, 0], [0, -1, 0], [0, 0, -1]]
  else R = rodrigues(normalize(cross(n, up)), Math.acos(cosA))
  const p0 = [-d * n[0], -d * n[1], -d * n[2]], y0 = matVec(R, p0)[1]
  return { R, y0, normalUp: n, apply: p => { const q = matVec(R, p); return [q[0], q[1] - y0, q[2]] } }
}
