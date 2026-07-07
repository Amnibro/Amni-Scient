import { floorFromVPs, calibrateRoom } from './perspective.js'
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export function lineIntersect(l1, l2) { const p = cross(l1, l2); return Math.abs(p[2]) < 1e-9 ? null : [p[0] / p[2], p[1] / p[2]] }
export const dirDeg = l => { let d = Math.atan2(l[0], -l[1]) * 180 / Math.PI; return ((d % 180) + 180) % 180 }
export function sobelXY(gray, w, h) {
  const mag = new Float32Array(w * h), ang = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1]
    const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1]
    mag[i] = Math.hypot(gx, gy)
    ang[i] = Math.atan2(gy, gx)
  }
  return { mag, ang }
}
function percentile(arr, p) { const n = arr.length, step = Math.max(1, (n / 16000) | 0), s = []; for (let i = 0; i < n; i += step) s.push(arr[i]); s.sort((a, b) => a - b); return s[Math.min(s.length - 1, (s.length * p) | 0)] || 0 }
export function houghOriented(mag, ang, w, h, opts) {
  opts = opts || {}
  const TS = opts.thetaSteps || 240, RS = opts.rhoSteps || 480, maxRho = Math.hypot(w, h)
  const acc = new Float32Array(TS * RS), cosT = new Float32Array(TS), sinT = new Float32Array(TS)
  for (let t = 0; t < TS; t++) { const a = t * Math.PI / TS; cosT[t] = Math.cos(a); sinT[t] = Math.sin(a) }
  let maxMag = 0; for (let i = 0; i < mag.length; i++) if (mag[i] > maxMag) maxMag = mag[i]
  const thr = (opts.thr != null ? opts.thr : Math.max(percentile(mag, 0.86), maxMag * 0.14, 1e-3)) * (opts.thrMul || 1)
  const spread = opts.spread || Math.round(TS * 7 / 180)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (mag[i] < thr) continue
    const tc = Math.round(((ang[i] % Math.PI) + Math.PI) % Math.PI / Math.PI * TS)
    for (let dt = -spread; dt <= spread; dt++) {
      const t = ((tc + dt) % TS + TS) % TS
      const ri = (((x * cosT[t] + y * sinT[t]) + maxRho) / (2 * maxRho) * RS) | 0
      if (ri >= 0 && ri < RS) acc[t * RS + ri] += 1
    }
  }
  const minVotes = opts.minVotes || Math.max(12, ((w + h) * 0.038) | 0), peaks = []
  for (let t = 0; t < TS; t++) for (let ri = 0; ri < RS; ri++) {
    const v = acc[t * RS + ri]; if (v < minVotes) continue
    let mx = true
    for (let dt = -3; dt <= 3 && mx; dt++) for (let dr = -3; dr <= 3; dr++) { const tt = ((t + dt) % TS + TS) % TS, rr = ri + dr; if (rr < 0 || rr >= RS) continue; const ov = acc[tt * RS + rr]; if (ov > v || (ov === v && (dt < 0 || (dt === 0 && dr < 0)))) { mx = false; break } }
    if (mx) { const a = t * Math.PI / TS, rho = ri / RS * 2 * maxRho - maxRho; peaks.push([Math.cos(a), Math.sin(a), -rho, v]) }
  }
  peaks.sort((p, q) => q[3] - p[3])
  return { lines: peaks.slice(0, opts.topN || 60), thr, maxMag }
}
export function refineLine(l, mag, ang, w, h, thrLow) {
  const na = Math.atan2(l[1], l[0])
  let sw = 0, sx = 0, sy = 0
  const px = []
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    if (mag[i] < thrLow) continue
    if (Math.abs(l[0] * x + l[1] * y + l[2]) > 2.5) continue
    let da = Math.abs(ang[i] - na) % Math.PI
    if (da > Math.PI / 2) da = Math.PI - da
    if (da > 0.42) continue
    const wgt = mag[i]
    sw += wgt; sx += x * wgt; sy += y * wgt
    px.push([x, y, wgt])
  }
  if (px.length < 12) return { line: l, support: px.length }
  const mx = sx / sw, my = sy / sw
  let cxx = 0, cxy = 0, cyy = 0
  for (const [x, y, wgt] of px) { const dx = x - mx, dy = y - my; cxx += wgt * dx * dx; cxy += wgt * dx * dy; cyy += wgt * dy * dy }
  const th = 0.5 * Math.atan2(2 * cxy, cxx - cyy)
  const dx = Math.cos(th), dy = Math.sin(th)
  let a = -dy, b = dx
  const c = -(a * mx + b * my)
  return { line: [a, b, c, l[3] || px.length], support: px.length }
}
export function segSupport(l, p0, p1, mag, w, h, thrLow) {
  const N = 36
  let hit = 0, tot = 0
  const nx = l[0], ny = l[1]
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = p0[0] + (p1[0] - p0[0]) * t, y = p0[1] + (p1[1] - p0[1]) * t
    if (x < 1 || x > w - 2 || y < 1 || y > h - 2) continue
    tot++
    let m = 0
    for (let s = -2; s <= 2; s++) {
      const xx = Math.round(x + nx * s), yy = Math.round(y + ny * s)
      if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue
      m = Math.max(m, mag[yy * w + xx])
    }
    if (m >= thrLow) hit++
  }
  return tot ? hit / tot : 0
}
function lsVP(lines, idxs) {
  let Saa = 0, Sab = 0, Sbb = 0, Sac = 0, Sbc = 0
  for (const k of idxs) { const a = lines[k][0], b = lines[k][1], c = lines[k][2]; Saa += a * a; Sab += a * b; Sbb += b * b; Sac += a * c; Sbc += b * c }
  const det = Saa * Sbb - Sab * Sab; if (Math.abs(det) < 1e-9) return null
  return [(Sab * Sbc - Sbb * Sac) / det, (Sab * Sac - Saa * Sbc) / det]
}
const inliersOf = (lines, idx, v, thr) => idx.filter(k => Math.abs(lines[k][0] * v[0] + lines[k][1] * v[1] + lines[k][2]) < thr)
function dedupe(lines, maxDim) { const out = []; for (const l of lines) { if (!out.some(o => Math.abs(l[0] * o[0] + l[1] * o[1]) > 0.9985 && Math.abs(l[2] - o[2]) < maxDim * 0.015)) out.push(l) } return out }
function fitVP(lines, w, h, exclude) {
  const thr = Math.max(w, h) * 0.045, maxDim = Math.hypot(w, h), cx = w / 2, cy = h / 2, idx = lines.map((_, i) => i).filter(i => !exclude || !exclude.has(i))
  const ecc = v => Math.min(Math.hypot(v[0] - cx, v[1] - cy) / (maxDim * 3), 0.9)
  let best = null, bestInl = [], bestScore = -1
  for (let i = 0; i < idx.length; i++) for (let j = i + 1; j < idx.length; j++) {
    const v = lineIntersect(lines[idx[i]], lines[idx[j]]); if (!v || !isFinite(v[0]) || !isFinite(v[1])) continue
    if (Math.hypot(v[0] - cx, v[1] - cy) > maxDim * 6) continue
    const inl = inliersOf(lines, idx, v, thr); if (inl.length < 2) continue
    const score = inl.length + ecc(v)
    if (score > bestScore) { bestScore = score; bestInl = inl; best = v }
  }
  if (best && bestInl.length >= 2) { let v = lsVP(lines, bestInl) || best; const inl = inliersOf(lines, idx, v, thr); if (inl.length >= 2) { v = lsVP(lines, inl) || v; bestInl = inl } best = v }
  return { vp: best, inliers: bestInl, count: bestInl.length }
}
function fitVertical(vert) {
  if (vert.length < 2) return null
  const idx = vert.map((_, i) => i), v0 = lsVP(vert, idx); if (!v0) return null
  const res = idx.map(k => Math.abs(vert[k][0] * v0[0] + vert[k][1] * v0[1] + vert[k][2])), med = res.slice().sort((a, b) => a - b)[res.length >> 1] || 0
  const keep = idx.filter((k, i) => res[i] <= Math.max(med * 2.5, 1e-6))
  return keep.length >= 2 ? (lsVP(vert, keep) || v0) : v0
}
export function estimateVPs(lines, w, h) {
  lines = dedupe(lines, Math.hypot(w, h))
  const vert = [], famL = [], famR = []
  for (const l of lines) { const d = dirDeg(l); if (Math.abs(d - 90) < 20) vert.push(l); else if (d >= 5.5 && d < 44) famL.push(l); else if (d > 136 && d <= 174.5) famR.push(l) }
  const rL = famL.length >= 2 ? fitVP(famL, w, h) : { vp: null, count: 0 }
  const rR = famR.length >= 2 ? fitVP(famR, w, h) : { vp: null, count: 0 }
  return { left: rL.vp, right: rR.vp, vert: fitVertical(vert), countL: rL.count, countR: rR.count, nHoriz: famL.length + famR.length, nVert: vert.length, famL, famR, horiz: famL.concat(famR), vertLines: vert }
}
export function detectFromGray(gray, w, h, opts) {
  const first = detectPass(gray, w, h, opts || {})
  if (first.confidence > 0) return first
  const retry = detectPass(gray, w, h, { ...(opts || {}), thrMul: 0.55, supMin: 0.3, minVotes: 10 })
  return retry.confidence > 0 ? retry : first
}
function detectPass(gray, w, h, opts) {
  const { mag, ang } = sobelXY(gray, w, h)
  const hg = houghOriented(mag, ang, w, h, opts)
  const thrLow = Math.max(hg.thr * 0.55, hg.maxMag * 0.07)
  const refined = hg.lines.map(l => refineLine(l, mag, ang, w, h, thrLow)).filter(r => r.support >= 10).map(r => r.line)
  const vp = estimateVPs(refined, w, h)
  const yAt = (l, x) => l[1] !== 0 ? -(l[0] * x + l[2]) / l[1] : null
  const tol = Math.max(w, h) * 0.05, near = (l, v) => v && Math.abs(l[0] * v[0] + l[1] * v[1] + l[2]) < tol
  const famA = vp.famL, famB = vp.famR
  if (!famA.length || !famB.length) return { confidence: 0, vps: vp, lines: refined.length }
  const XL = 2, XR = w - 2
  const sideOf = (l, P) => {
    const eL = [XL, yAt(l, XL)], eR = [XR, yAt(l, XR)]
    if (eL[1] == null || eR[1] == null) return null
    const sL = segSupport(l, P, eL, mag, w, h, thrLow), sR = segSupport(l, P, eR, mag, w, h, thrLow)
    return sL >= sR ? { side: 'L', end: eL, sup: sL } : { side: 'R', end: eR, sup: sR }
  }
  const evalPair = (la, lb, band) => {
    const P = lineIntersect(la, lb)
    if (!P || !isFinite(P[0]) || !isFinite(P[1])) return null
    if (P[0] < w * 0.04 || P[0] > w * 0.96) return null
    if (band === 'floor' && (P[1] < h * 0.38 || P[1] > h * 0.99)) return null
    if (band === 'ceil' && (P[1] < h * 0.01 || P[1] > h * 0.7)) return null
    const sa = sideOf(la, P), sb = sideOf(lb, P)
    if (!sa || !sb || sa.side === sb.side) return null
    const smin = opts.supMin || 0.4
    if (sa.sup < smin || sb.sup < smin) return null
    const [gl, gr] = sa.side === 'L' ? [{ l: la, ...sa }, { l: lb, ...sb }] : [{ l: lb, ...sb }, { l: la, ...sa }]
    const seamB = (vp.vertLines || []).some(vl => Math.abs(vl[0] * P[0] + vl[1] * P[1] + vl[2]) < w * 0.03) ? 1.25 : 1
    const lowness = band === 'floor' ? (P[1] + gl.end[1] + gr.end[1]) / (3 * h) : 1 - (P[1] + gl.end[1] + gr.end[1]) / (3 * h)
    const score = Math.sqrt(gl.sup * gr.sup) * (0.45 + 0.55 * Math.max(0, Math.min(1, lowness))) * seamB
    return { P, fl: gl.l, fr: gr.l, BL: gl.end, BR: gr.end, supL: gl.sup, supR: gr.sup, aIsLeft: sa.side === 'L', score }
  }
  const floorCands = [], ceilCands = []
  for (const la of famA) for (const lb of famB) {
    const rf = evalPair(la, lb, 'floor'); rf && floorCands.push(rf)
    const rc = evalPair(la, lb, 'ceil'); rc && ceilCands.push(rc)
  }
  if (!floorCands.length) return { confidence: 0, vps: vp, lines: refined.length }
  floorCands.sort((a, b) => b.score - a.score); ceilCands.sort((a, b) => b.score - a.score)
  let bestF = null, bestC = null, bestTot = -1
  for (const f of floorCands.slice(0, 8)) {
    let localC = null, localTot = f.score
    for (const c of ceilCands.slice(0, 8)) {
      if (c.fl === f.fl || c.fr === f.fr) continue
      if (c.P[1] > f.P[1] - h * 0.16) continue
      const align = Math.abs(c.P[0] - f.P[0]) / w
      if (align > 0.1) continue
      const tot = f.score + c.score * 0.7 + (0.35 - align * 2.5)
      if (tot > localTot) { localTot = tot; localC = c }
    }
    if (localTot > bestTot) { bestTot = localTot; bestF = f; bestC = localC }
  }
  if (!bestC && (!vp.left || !vp.right)) return { confidence: 0, vps: vp, lines: refined.length }
  const FC = bestF.P, FL = bestF.BL, FR = bestF.BR
  const CC = bestC ? bestC.P : null, CL = bestC ? bestC.BL : null, CR = bestC ? bestC.BR : null
  const vpLeftOut = bestF.aIsLeft ? vp.left : vp.right, vpRightOut = bestF.aIsLeft ? vp.right : vp.left
  let conf = Math.min(1, 0.35 + bestF.score * 0.8)
  conf *= Math.min(1, (vp.countL + vp.countR) / 8 + 0.35)
  const seam = (vp.vertLines || []).some(l => Math.abs(l[0] * FC[0] + l[1] * FC[1] + l[2]) < w * 0.035)
  if (seam) conf = Math.min(1, conf * 1.15)
  if (bestC) conf = Math.min(1, conf * 1.1)
  const nrm = p => p ? [p[0] / w, p[1] / h] : null
  return { corners: { FC: nrm(FC), FL: nrm(FL), FR: nrm(FR), CC: nrm(CC), CL: nrm(CL), CR: nrm(CR) }, raw: { FC, FL, FR, CC, CL, CR }, vps: { left: vpLeftOut, right: vpRightOut, vert: vp.vert }, confidence: conf, lines: refined.length, score: bestF.score }
}
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
  maxW = maxW || 560
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
