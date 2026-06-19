// Ground-plane perspective for the draw-it tool: map the floor in a photo <-> real feet
// via a 4-point homography, so to-scale fixtures sit correctly in the photo's perspective.
// Pure math (node-verifiable). Reuses a hand-written Jacobi eigensolver (no libs).
function jacobiEig(Ain, n) {
  const a = Float64Array.from(Ain), v = new Float64Array(n * n)
  for (let i = 0; i < n; i++) v[i * n + i] = 1
  for (let sweep = 0; sweep < 120; sweep++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] * a[p * n + q]
    if (off < 1e-22) break
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-24) continue
      const app = a[p * n + p], aqq = a[q * n + q], th = (aqq - app) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let i = 0; i < n; i++) { const aip = a[i * n + p], aiq = a[i * n + q]; a[i * n + p] = c * aip - s * aiq; a[i * n + q] = s * aip + c * aiq }
      for (let i = 0; i < n; i++) { const api = a[p * n + i], aqi = a[q * n + i]; a[p * n + i] = c * api - s * aqi; a[q * n + i] = s * api + c * aqi }
      for (let i = 0; i < n; i++) { const vip = v[i * n + p], viq = v[i * n + q]; v[i * n + p] = c * vip - s * viq; v[i * n + q] = s * vip + c * viq }
    }
  }
  const idx = [...Array(n).keys()].sort((i, j) => a[i * n + i] - a[j * n + j])
  return { order: idx, raw: v, n }
}
const eigvec = (e, rank) => { const o = e.order[rank], n = e.n, v = []; for (let i = 0; i < n; i++) v.push(e.raw[i * n + o]); return v }

// computeHomography(src, dst): src[i]=[x,y] feet (floor), dst[i]=[u,v] px (image); >=4 points.
export function computeHomography(src, dst) {
  const N = Math.min(src.length, dst.length); if (N < 4) return null
  const A = new Float64Array(2 * N * 9)
  for (let i = 0; i < N; i++) {
    const x = src[i][0], y = src[i][1], u = dst[i][0], v = dst[i][1]
    A.set([x, y, 1, 0, 0, 0, -u * x, -u * y, -u], (2 * i) * 9)
    A.set([0, 0, 0, x, y, 1, -v * x, -v * y, -v], (2 * i + 1) * 9)
  }
  const AtA = new Float64Array(81)
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { let s = 0; for (let k = 0; k < 2 * N; k++) s += A[k * 9 + i] * A[k * 9 + j]; AtA[i * 9 + j] = s }
  const h = eigvec(jacobiEig(AtA, 9), 0)  // smallest-eigenvalue eigenvector = null space
  const d = h[8] || (h[8] === 0 ? 1 : h[8]); return h.map(x => x / (d || 1))
}
// project a floor point (feet) -> image pixel through H
export function applyH(H, p) { const x = p[0], y = p[1], w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w] }
// Room-corner calibration: derive the floor homography from a room CORNER instead of 4 floor
// corners (which a real photo never shows). Inputs are image px: FC=floor corner (two walls meet
// the floor), FL/FR = a point further along each wall's base, CC=ceiling corner above FC, CL/CR =
// top of each wall above FL/FR. W,D = the floor distances FC->FL and FC->FR in feet. The parallel
// floor+ceiling edges of each wall converge at a vanishing point -> the two floor axes.
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const lineInt = (p1, p2, p3, p4) => cross3(cross3([p1[0], p1[1], 1], [p2[0], p2[1], 1]), cross3([p3[0], p3[1], 1], [p4[0], p4[1], 1]))
export function roomHomography(FC, FL, FR, CC, CL, CR, W, D) {
  const VPl = lineInt(FC, FL, CC, CL), VPr = lineInt(FC, FR, CC, CR), col3 = [FC[0], FC[1], 1]
  const sc = (VP, target, dist) => { let best = 0, bd = 0; for (const k of [0, 1]) { const den = dist * (VP[k] - VP[2] * target[k]); if (Math.abs(den) > Math.abs(bd)) { bd = den; best = (target[k] - col3[k]) / den } } return best }
  const l1 = sc(VPl, FL, W), l2 = sc(VPr, FR, D)
  const c1 = [VPl[0] * l1, VPl[1] * l1, VPl[2] * l1], c2 = [VPr[0] * l2, VPr[1] * l2, VPr[2] * l2]
  const H = [c1[0], c2[0], col3[0], c1[1], c2[1], col3[1], c1[2], c2[2], col3[2]]
  return (H.every(x => isFinite(x)) && Math.abs(H[8]) > 1e-9) ? H : null
}
// invert a 3x3 (image px -> floor feet), for tap-on-photo -> floor position
export function invert3(H) {
  const a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7], i = H[8]
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, D = -(b * i - c * h), E = a * i - c * g, F = -(a * h - b * g), G = b * f - c * e, Hh = -(a * f - c * d), I = a * e - b * d
  const det = a * A + b * B + c * C; if (Math.abs(det) < 1e-12) return null
  return [A / det, D / det, G / det, B / det, E / det, Hh / det, C / det, F / det, I / det]
}
