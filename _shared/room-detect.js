// In-browser CV room geometry from a single photo/frame. Platform-agnostic (pure canvas + JS —
// works on iOS + Android, no WebXR/LiDAR). Pipeline: grayscale -> Sobel edges -> Hough lines ->
// vanishing points (RANSAC over line intersections) -> floor/ceiling corners -> homography (reusing
// perspective.js). It returns an ESTIMATE with a confidence; manual corner taps stay as the fallback.
import { floorFromVPs, calibrateRoom } from './perspective.js'

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export function lineIntersect(l1, l2) { const p = cross(l1, l2); return Math.abs(p[2]) < 1e-9 ? null : [p[0] / p[2], p[1] / p[2]] }
// direction angle of a line [a,b,c] (a,b = normal), in [0,180). vertical line -> 90, horizontal -> 0.
export const dirDeg = l => { let d = Math.atan2(l[0], -l[1]) * 180 / Math.PI; return ((d % 180) + 180) % 180 }

export function sobel(gray, w, h) {
  const mag = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1]
    const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1]
    mag[i] = Math.hypot(gx, gy)
  }
  return mag
}
function percentile(arr, p) { const n = arr.length, step = Math.max(1, (n / 16000) | 0), s = []; for (let i = 0; i < n; i += step) s.push(arr[i]); s.sort((a, b) => a - b); return s[Math.min(s.length - 1, (s.length * p) | 0)] || 0 }

// Hough transform -> dominant straight lines as { a,b,c (a^2+b^2=1), votes }.
export function houghLines(mag, w, h, opts) {
  opts = opts || {}
  const TS = opts.thetaSteps || 180, RS = opts.rhoSteps || 350, maxRho = Math.hypot(w, h)
  const acc = new Int32Array(TS * RS), cosT = new Float32Array(TS), sinT = new Float32Array(TS)
  for (let t = 0; t < TS; t++) { const a = t * Math.PI / TS; cosT[t] = Math.cos(a); sinT[t] = Math.sin(a) }
  let maxMag = 0; for (let i = 0; i < mag.length; i++) if (mag[i] > maxMag) maxMag = mag[i]
  const thr = opts.thr != null ? opts.thr : Math.max(percentile(mag, 0.9), maxMag * 0.2, 1e-3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (mag[y * w + x] < thr) continue
    for (let t = 0; t < TS; t++) { const ri = (((x * cosT[t] + y * sinT[t]) + maxRho) / (2 * maxRho) * RS) | 0; if (ri >= 0 && ri < RS) acc[t * RS + ri]++ }
  }
  const minVotes = opts.minVotes || Math.max(18, ((w + h) * 0.1) | 0), peaks = []
  for (let t = 0; t < TS; t++) for (let ri = 0; ri < RS; ri++) {
    const v = acc[t * RS + ri]; if (v < minVotes) continue
    let mx = true
    for (let dt = -2; dt <= 2 && mx; dt++) for (let dr = -2; dr <= 2; dr++) { const tt = t + dt, rr = ri + dr; if (tt < 0 || tt >= TS || rr < 0 || rr >= RS) continue; if (acc[tt * RS + rr] > v) { mx = false; break } }
    if (mx) { const a = t * Math.PI / TS, rho = ri / RS * 2 * maxRho - maxRho; peaks.push({ a: Math.cos(a), b: Math.sin(a), c: -rho, votes: v }) }
  }
  peaks.sort((p, q) => q.votes - p.votes)
  return peaks.slice(0, opts.topN || 48).map(p => [p.a, p.b, p.c, p.votes])
}

// Least-squares vanishing point: the point minimizing Σ(a·x + b·y + c)² over the given lines.
function lsVP(lines, idxs) {
  let Saa = 0, Sab = 0, Sbb = 0, Sac = 0, Sbc = 0
  for (const k of idxs) { const a = lines[k][0], b = lines[k][1], c = lines[k][2]; Saa += a * a; Sab += a * b; Sbb += b * b; Sac += a * c; Sbc += b * c }
  const det = Saa * Sbb - Sab * Sab; if (Math.abs(det) < 1e-9) return null
  return [(Sab * Sbc - Sbb * Sac) / det, (Sab * Sac - Saa * Sbc) / det]
}
const inliersOf = (lines, idx, v, thr) => idx.filter(k => Math.abs(lines[k][0] * v[0] + lines[k][1] * v[1] + lines[k][2]) < thr)
// Merge near-duplicate lines (same orientation + offset — Hough emits several per thick/double edge).
function dedupe(lines, maxDim) { const out = []; for (const l of lines) { if (!out.some(o => Math.abs(l[0] * o[0] + l[1] * o[1]) > 0.9985 && Math.abs(l[2] - o[2]) < maxDim * 0.02)) out.push(l) } return out }
// RANSAC + least-squares: find the vanishing point most lines pass through. exclude = Set of indices.
function fitVP(lines, w, h, exclude) {
  const thr = Math.max(w, h) * 0.045, maxDim = Math.hypot(w, h), cx = w / 2, cy = h / 2, idx = lines.map((_, i) => i).filter(i => !exclude || !exclude.has(i))
  // eccentricity bonus (<1, never overrides a full extra inlier): a true VP of receding lines sits far
  // off-center, while the room CORNER where two floor lines meet is central — this breaks their tie.
  const ecc = v => Math.min(Math.hypot(v[0] - cx, v[1] - cy) / (maxDim * 3), 0.9)
  let best = null, bestInl = [], bestScore = -1
  for (let i = 0; i < idx.length; i++) for (let j = i + 1; j < idx.length; j++) {
    const v = lineIntersect(lines[idx[i]], lines[idx[j]]); if (!v || !isFinite(v[0]) || !isFinite(v[1])) continue
    if (Math.hypot(v[0] - cx, v[1] - cy) > maxDim * 2.2) continue
    const inl = inliersOf(lines, idx, v, thr); if (inl.length < 2) continue
    const score = inl.length + ecc(v)
    if (score > bestScore) { bestScore = score; bestInl = inl; best = v }
  }
  if (best && bestInl.length >= 2) { let v = lsVP(lines, bestInl) || best; const inl = inliersOf(lines, idx, v, thr); if (inl.length >= 2) { v = lsVP(lines, inl) || v; bestInl = inl } best = v }
  return { vp: best, inliers: bestInl, count: bestInl.length }
}
// Vertical VP: least-squares intersection of the vertical-line family (often far/near-infinite for a
// level camera), with one median-residual reject pass for the odd outlier. No eccentricity/distance cap.
function fitVertical(vert) {
  if (vert.length < 2) return null
  const idx = vert.map((_, i) => i), v0 = lsVP(vert, idx); if (!v0) return null
  const res = idx.map(k => Math.abs(vert[k][0] * v0[0] + vert[k][1] * v0[1] + vert[k][2])), med = res.slice().sort((a, b) => a - b)[res.length >> 1] || 0
  const keep = idx.filter((k, i) => res[i] <= Math.max(med * 2.5, 1e-6))
  return keep.length >= 2 ? (lsVP(vert, keep) || v0) : v0
}

// Estimate the two horizontal floor vanishing points (+ a vertical VP) from detected lines.
export function estimateVPs(lines, w, h) {
  lines = dedupe(lines, Math.hypot(w, h))
  let vert = [], horiz = []
  for (const l of lines) { const d = dirDeg(l); if (Math.abs(d - 90) < 22) vert.push(l); else if (d < 34 || d > 146) horiz.push(l) }
  const strong = ls => { const mv = Math.max(0, ...ls.map(l => l[3] || 0)); return mv > 0 ? ls.filter(l => (l[3] || 0) >= mv * 0.4) : ls }
  horiz = strong(horiz); vert = strong(vert)
  const r1 = fitVP(horiz, w, h), ex = new Set(r1.inliers), r2 = fitVP(horiz, w, h, ex)
  let left = r1.vp, right = r2.vp, cL = r1.count, cR = r2.count
  if (left && right && left[0] > right[0]) { const t = left; left = right; right = t; const tc = cL; cL = cR; cR = tc }
  return { left, right, vert: fitVertical(vert), countL: cL, countR: cR, nHoriz: horiz.length, nVert: vert.length }
}

// Full detection from a grayscale buffer -> normalized corners + VPs + confidence. (node-testable)
export function detectFromGray(gray, w, h, opts) {
  opts = opts || {}
  const lines = houghLines(sobel(gray, w, h), w, h, opts)
  const vp = estimateVPs(lines, w, h)
  if (!vp.left || !vp.right) return { confidence: 0, vps: vp, lines: lines.length }
  const horiz = lines.filter(l => { const d = dirDeg(l); return d < 34 || d > 146 })
  const yAt = (l, x) => l[1] !== 0 ? -(l[0] * x + l[2]) / l[1] : null
  const tol = Math.max(w, h) * 0.05, near = (l, v) => Math.abs(l[0] * v[0] + l[1] * v[1] + l[2]) < tol
  const lefts = horiz.filter(l => near(l, vp.left)), rights = horiz.filter(l => near(l, vp.right))
  const lowest = ls => ls.reduce((b, l) => (b === null || yAt(l, w / 2) > yAt(b, w / 2)) ? l : b, null)
  const highest = ls => ls.reduce((b, l) => (b === null || yAt(l, w / 2) < yAt(b, w / 2)) ? l : b, null)
  const fL = lowest(lefts), fR = lowest(rights), cLn = highest(lefts), cRn = highest(rights)
  if (!fL || !fR) return { confidence: 0, vps: vp, lines: lines.length }
  const lb = [1, 0, -2], rb = [1, 0, -(w - 2)]
  const FC = lineIntersect(fL, fR), FL = lineIntersect(fL, lb), FR = lineIntersect(fR, rb)
  let CC = null, CL = null, CR = null
  if (cLn && cRn && cLn !== fL && cRn !== fR) { CC = lineIntersect(cLn, cRn); CL = lineIntersect(cLn, lb); CR = lineIntersect(cRn, rb) }
  if (!FC || !FL || !FR) return { confidence: 0, vps: vp, lines: lines.length }
  let conf = Math.min(1, (vp.countL + vp.countR) / 12)
  if (FC[1] < h * 0.35) conf *= 0.5
  if (FC[0] < w * 0.1 || FC[0] > w * 0.9) conf *= 0.6
  const nrm = p => p ? [p[0] / w, p[1] / h] : null
  return { corners: { FC: nrm(FC), FL: nrm(FL), FR: nrm(FR), CC: nrm(CC), CL: nrm(CL), CR: nrm(CR) }, raw: { FC, FL, FR, CC, CL, CR }, vps: { left: vp.left, right: vp.right, vert: vp.vert }, confidence: conf, lines: lines.length }
}

// Build floor (+ceiling) homography in TARGET canvas coords (W,H = the sketch SVG viewBox) from a
// detection. The photo covers the canvas, so normalized image coords map directly to canvas coords.
// roomFt = assumed wall lengths in feet (no metric scale from one photo — user can tune after).
export function buildRoomFromDetection(det, W, H, roomFt) {
  if (!det || !det.corners || det.confidence <= 0) return null
  const wft = (roomFt && roomFt.w) || 12, dft = (roomFt && roomFt.d) || 12
  const sc = p => p ? [p[0] * W, p[1] * H] : null
  const FC = sc(det.corners.FC), FL = sc(det.corners.FL), FR = sc(det.corners.FR)
  if (!FC || !FL || !FR) return null
  const CC = sc(det.corners.CC), CL = sc(det.corners.CL), CR = sc(det.corners.CR)
  if (CC && CL && CR) { const cal = calibrateRoom(FC, FL, FR, CC, CL, CR, wft, dft); if (cal) return { floorH: cal.floorH, ceilH: cal.ceilH, vpVert: cal.vpVert, floorCal: { w: wft, d: dft, corner: [FC, FL, FR, CC, CL, CR] } } }
  const sv = v => v ? [v[0] / det._w * W, v[1] / det._h * H] : null
  const floorH = floorFromVPs(FC, FL, FR, sv(det.vps.left), sv(det.vps.right), wft, dft)
  if (!floorH) return null
  return { floorH, ceilH: null, vpVert: sv(det.vps.vert), floorCal: { w: wft, d: dft, corner: [FC, FL, FR] } }
}

export async function detectRoom(source, maxW) {
  maxW = maxW || 480
  const img = await loadImage(source)
  const scale = Math.min(1, maxW / img.width), w = Math.max(8, Math.round(img.width * scale)), h = Math.max(8, Math.round(img.height * scale))
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, w, h)
  const d = ctx.getImageData(0, 0, w, h).data, gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  const det = detectFromGray(gray, w, h)
  det._w = w; det._h = h
  return det
}
function loadImage(src) { return new Promise((res, rej) => { if (src && src.tagName === 'IMG') { src.complete ? res(src) : (src.onload = () => res(src)); return } if (src && src.tagName === 'CANVAS') src = src.toDataURL(); const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = src }) }
