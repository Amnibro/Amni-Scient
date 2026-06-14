const WORK = 480
const clamp = (v, a, b) => v < a ? a : v > b ? b : v
const convex = pts => {
  const ps = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (ps.length < 3) return ps
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = []
  for (const p of ps) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p) }
  const up = []
  for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p) }
  lo.pop(); up.pop(); return lo.concat(up)
}
const minRect = pts => {
  const h = convex(pts)
  if (h.length < 3) return null
  let best = null
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length]
    const el = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const ux = (b[0] - a[0]) / el, uy = (b[1] - a[1]) / el, vx = -uy, vy = ux
    let mnU = 1e9, mxU = -1e9, mnV = 1e9, mxV = -1e9
    for (const p of h) { const du = p[0] * ux + p[1] * uy, dv = p[0] * vx + p[1] * vy; mnU = Math.min(mnU, du); mxU = Math.max(mxU, du); mnV = Math.min(mnV, dv); mxV = Math.max(mxV, dv) }
    const area = (mxU - mnU) * (mxV - mnV)
    if (!best || area < best.area) best = { area, ux, uy, vx, vy, mnU, mxU, mnV, mxV }
  }
  const c = best, corner = (u, v) => [u * c.ux + v * c.vx, u * c.uy + v * c.vy]
  return [corner(c.mnU, c.mnV), corner(c.mxU, c.mnV), corner(c.mxU, c.mxV), corner(c.mnU, c.mxV)]
}
const maskOf = (data, n) => {
  const fg = new Uint8Array(n)
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const r = data[j], g = data[j + 1], b = data[j + 2], sum = r + g + b
    const grass = g >= r && g >= b && g - r >= 8 && g - b >= 8
    const shadow = sum < 110
    const sky = b > r + 14 && b > g + 6 && b > 120
    fg[i] = grass || shadow || sky ? 0 : 1
  }
  return fg
}
const components = (fg, w, h) => {
  const lab = new Int32Array(fg.length).fill(-1), stack = new Int32Array(fg.length)
  const comps = []
  for (let s = 0; s < fg.length; s++) {
    if (!fg[s] || lab[s] >= 0) continue
    const id = comps.length
    let sp = 0; stack[sp++] = s; lab[s] = id
    let area = 0, minX = w, maxX = 0, minY = h, maxY = 0, sx = 0, sy = 0
    while (sp > 0) {
      const p = stack[--sp], px = p % w, py = (p - px) / w
      area++; sx += px; sy += py
      minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const np = ny * w + nx
        if (fg[np] && lab[np] < 0) { lab[np] = id; stack[sp++] = np }
      }
    }
    comps.push({ id, area, cx: sx / area, cy: sy / area, minX, maxX, minY, maxY })
  }
  return { lab, comps }
}
const detectPoly = src => {
  const sc = Math.min(1, WORK / src.width), w = Math.max(8, Math.round(src.width * sc)), h = Math.max(8, Math.round(src.height * sc))
  const off = document.createElement('canvas'); off.width = w; off.height = h
  const o = off.getContext('2d', { willReadFrequently: true }); o.drawImage(src, 0, 0, w, h)
  const data = o.getImageData(0, 0, w, h).data, n = w * h
  const fg = maskOf(data, n)
  const { lab, comps } = components(fg, w, h)
  if (!comps.length) return null
  const N = n, cx0 = w / 2, cy0 = h / 2
  const valid = comps.filter(c => c.area > N * 0.004 && c.area < N * 0.92 && c.maxX - c.minX > 6 && c.maxY - c.minY > 6)
  const pool = valid.length ? valid : comps
  const pick = pool.reduce((a, c) => { const score = c.area / (1 + 0.0015 * Math.hypot(c.cx - cx0, c.cy - cy0) * Math.hypot(c.cx - cx0, c.cy - cy0)); return score > a.score ? { c, score } : a }, { c: null, score: -1 }).c
  if (!pick) return null
  const pix = []
  for (let p = 0; p < n; p++) if (lab[p] === pick.id) { const x = p % w; pix.push([x, (p - x) / w]) }
  const rect = minRect(pix)
  if (!rect) return null
  const inv = 1 / sc
  return rect.map(p => [clamp(p[0] * inv, 0, src.width), clamp(p[1] * inv, 0, src.height)])
}
export const classifyImage = src => {
  const w = 256, h = Math.max(8, Math.round(256 * src.height / src.width))
  const off = document.createElement('canvas'); off.width = w; off.height = h
  const o = off.getContext('2d', { willReadFrequently: true }); o.drawImage(src, 0, 0, w, h)
  const d = o.getImageData(0, 0, w, h).data, n = w * h
  let green = 0, gray = 0, white = 0, satSum = 0, topSky = 0, edge = 0
  const topRows = Math.round(h * 0.25), lum = new Float32Array(n)
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const r = d[j], g = d[j + 1], b = d[j + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    lum[i] = (r + g + b) / 3
    const sat = mx === 0 ? 0 : (mx - mn) / mx
    satSum += sat
    if (g >= r && g >= b && g - r >= 8 && g - b >= 8) green++
    if (sat < 0.18 && mx > 90 && mx < 210) gray++
    if (mn > 200) white++
    const y = (i / w) | 0
    if (y < topRows && ((b > r + 10 && b > 120) || mn > 205)) topSky++
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, gx = lum[i - 1] - lum[i + 1], gy = lum[i - w] - lum[i + w]
    if (Math.hypot(gx, gy) > 36) edge++
  }
  const greenF = green / n, grayF = gray / n, whiteF = white / n, satM = satSum / n, skyF = topSky / Math.max(1, topRows * w), edgeF = edge / n
  let aerial = 0.34, ground = 0.33, drawing = 0.33
  if (whiteF > 0.5 && satM < 0.12 && edgeF > 0.015 && edgeF < 0.32) drawing += 0.5
  if (skyF > 0.34) ground += 0.45
  if (greenF > 0.1 && grayF > 0.04 && skyF < 0.25) aerial += 0.4
  if (greenF > 0.22 && skyF < 0.2) aerial += 0.15
  const sum = aerial + ground + drawing
  aerial /= sum; ground /= sum; drawing /= sum
  const m = Math.max(aerial, ground, drawing)
  const route = m === drawing ? 'drawing' : m === ground ? 'ground' : 'aerial'
  const margin = m - [aerial, ground, drawing].sort((a, b) => b - a)[1]
  return { aerial, ground, drawing, route, margin, msg: route === 'aerial' ? 'Looks like an overhead/aerial view — detecting the footprint.' : route === 'ground' ? 'This looks like a ground-level photo — footprint detection is rough on angled shots; check the corners or trace manually.' : 'This looks like a line drawing — I will outline the largest shape; confirm a known dimension for scale.' }
}
export const initAutoDetect = ({ tc, T, tDraw, tStatus, getMapOn }) => {
  let drag = -1
  const ptOf = e => { const r = tc.getBoundingClientRect(); return [(e.clientX - r.left) * tc.width / r.width, (e.clientY - r.top) * tc.height / r.height] }
  const onDown = e => {
    if (T.mode || !T.poly.length) return
    const p = ptOf(e); let bi = -1, bd = 16
    T.poly.forEach((q, i) => { const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; bi = i } })
    if (bi >= 0) { drag = bi; e.stopPropagation(); e.preventDefault() }
  }
  const onMove = e => { if (drag < 0) return; const p = ptOf(e); T.poly[drag] = [clamp(p[0], 0, tc.width), clamp(p[1], 0, tc.height)]; tDraw() }
  const onUp = () => { drag = -1 }
  tc.addEventListener('mousedown', onDown, true)
  window.addEventListener('mousemove', onMove, true)
  window.addEventListener('mouseup', onUp, true)
  const detectFootprint = () => {
    if (!T.img) { tStatus('Find an address (satellite) or upload a photo first, then Auto-detect.'); return false }
    const mapOn = !!getMapOn()
    const cls = mapOn ? null : classifyImage(T.img)
    const poly = detectPoly(T.img)
    if (!poly) { tStatus('Could not find a clear footprint — trace the corners manually instead.'); return false }
    T.poly = poly
    tDraw()
    const lead = cls && cls.route !== 'aerial' ? cls.msg + ' ' : ''
    mapOn ? tStatus(`${lead}Footprint proposed — drag any corner to fine-tune, then ✅ Use outline. (North-up satellite scale is set.)`) : T.pxPerFt > 0 ? tStatus(`${lead}Footprint proposed — drag corners to fix, then ✅ Use outline.`) : tStatus(`${lead}Footprint proposed — drag corners to fix, then ① Set scale (two points a known distance apart) and ✅ Use outline.`)
    return true
  }
  const dispose = () => { tc.removeEventListener('mousedown', onDown, true); window.removeEventListener('mousemove', onMove, true); window.removeEventListener('mouseup', onUp, true) }
  return { detectFootprint, classifyImage, dispose }
}
