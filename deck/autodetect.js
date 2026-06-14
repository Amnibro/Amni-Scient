const WORK = 480
const clamp = (v, a, b) => v < a ? a : v > b ? b : v
const cr3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dt3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const nm3 = a => { const m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m] }
export const rectifyQuad = (q, cx, cy) => {
  if (q.length < 4) return { ok: false }
  const H = q.map(p => [p[0], p[1], 1])
  const u = cr3(cr3(H[0], H[1]), cr3(H[3], H[2])), v = cr3(cr3(H[0], H[3]), cr3(H[1], H[2]))
  const el = (a, b) => Math.hypot(q[a][0] - q[b][0], q[a][1] - q[b][1])
  const wlPx = (el(0, 1) + el(3, 2)) / 2, dlPx = (el(0, 3) + el(1, 2)) / 2 || 1
  if (Math.abs(u[2]) < 1e-7 || Math.abs(v[2]) < 1e-7) return { ok: true, affine: true, aspect: wlPx / dlPx }
  const up = [u[0] / u[2], u[1] / u[2]], vp = [v[0] / v[2], v[1] / v[2]]
  const f2 = -((up[0] - cx) * (vp[0] - cx) + (up[1] - cy) * (vp[1] - cy))
  if (!(f2 > 1)) return { ok: true, affine: true, aspect: wlPx / dlPx }
  const f = Math.sqrt(f2)
  const du = nm3([(up[0] - cx) / f, (up[1] - cy) / f, 1]), dv = nm3([(vp[0] - cx) / f, (vp[1] - cy) / f, 1])
  const n = nm3(cr3(du, dv))
  const X = p => { const r = [(p[0] - cx) / f, (p[1] - cy) / f, 1], t = 1 / dt3(n, r); return [r[0] * t, r[1] * t, r[2] * t] }
  const P = q.map(X), d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  const wl = (d3(P[0], P[1]) + d3(P[3], P[2])) / 2, dl = (d3(P[0], P[3]) + d3(P[1], P[2])) / 2 || 1
  return { ok: true, affine: false, f, aspect: wl / dl }
}
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
const regionMask = (data, n) => {
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
const inkMask = (data, n) => {
  let sum = 0
  for (let j = 0; j < n * 4; j += 4) sum += (data[j] + data[j + 1] + data[j + 2]) / 3
  const thr = sum / n * 0.62, fg = new Uint8Array(n)
  for (let i = 0, j = 0; i < n; i++, j += 4) fg[i] = (data[j] + data[j + 1] + data[j + 2]) / 3 < thr ? 1 : 0
  return fg
}
const components = (fg, w, h) => {
  const lab = new Int32Array(fg.length).fill(-1), stack = new Int32Array(fg.length), comps = []
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
const imgData = (src, cap) => {
  const sc = Math.min(1, cap / src.width), w = Math.max(8, Math.round(src.width * sc)), h = Math.max(8, Math.round(src.height * sc))
  const off = document.createElement('canvas'); off.width = w; off.height = h
  const o = off.getContext('2d', { willReadFrequently: true }); o.drawImage(src, 0, 0, w, h)
  return { data: o.getImageData(0, 0, w, h).data, w, h, sc }
}
const seedGrow = (data, w, h, sx, sy, tol) => {
  const o = (sy * w + sx) * 4, br = data[o], bg = data[o + 1], bb = data[o + 2]
  if (bg >= br && bg >= bb && bg - br >= 8 && bg - bb >= 8) return null
  const seen = new Uint8Array(w * h), st = new Int32Array(w * h), pix = [], cap = w * h * 0.45
  let sp = 0; st[sp++] = sy * w + sx; seen[sy * w + sx] = 1
  while (sp > 0) {
    const p = st[--sp], x = p % w, y = (p - x) / w
    pix.push([x, y]); if (pix.length > cap) return null
    const near = (nx, ny) => { if (nx < 0 || ny < 0 || nx >= w || ny >= h) return; const np = ny * w + nx; if (seen[np]) return; const q = np * 4; if (Math.abs(data[q] - br) + Math.abs(data[q + 1] - bg) + Math.abs(data[q + 2] - bb) < tol) { seen[np] = 1; st[sp++] = np } }
    near(x + 1, y); near(x - 1, y); near(x, y + 1); near(x, y - 1)
  }
  return pix
}
const detectPoly = (src, mode, seed) => {
  const { data, w, h, sc } = imgData(src, WORK), n = w * h
  let pix
  if (mode === 'ink') {
    const fg = inkMask(data, n); pix = []
    for (let p = 0; p < n; p++) if (fg[p]) { const x = p % w; pix.push([x, (p - x) / w]) }
    if (pix.length < 24) return null
  } else if (seed) {
    pix = seedGrow(data, w, h, clamp(Math.round(seed[0] * sc), 0, w - 1), clamp(Math.round(seed[1] * sc), 0, h - 1), 56)
    if (!pix || pix.length < 30) return null
  } else {
    const N = n, fg = regionMask(data, n), { lab, comps } = components(fg, w, h)
    if (!comps.length) return null
    const cx0 = w / 2, cy0 = h / 2
    const valid = comps.filter(c => c.area > N * 0.004 && c.area < N * 0.92 && c.maxX - c.minX > 6 && c.maxY - c.minY > 6)
    const pick = (valid.length ? valid : comps).reduce((a, c) => { const d = Math.hypot(c.cx - cx0, c.cy - cy0); const score = c.area / (1 + 0.0015 * d * d); return score > a.score ? { c, score } : a }, { c: null, score: -1 }).c
    if (!pick) return null
    pix = []
    for (let p = 0; p < n; p++) if (lab[p] === pick.id) { const x = p % w; pix.push([x, (p - x) / w]) }
  }
  const rect = minRect(pix)
  if (!rect) return null
  const inv = 1 / sc
  return rect.map(p => [clamp(p[0] * inv, 0, src.width), clamp(p[1] * inv, 0, src.height)])
}
export const classifyImage = src => {
  const { data, w, h } = imgData(src, 256), n = w * h
  let green = 0, gray = 0, white = 0, satSum = 0, topSky = 0, edge = 0
  const topRows = Math.max(1, Math.round(h * 0.25)), lum = new Float32Array(n)
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const r = data[j], g = data[j + 1], b = data[j + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    lum[i] = (r + g + b) / 3
    satSum += mx === 0 ? 0 : (mx - mn) / mx
    if (g >= r && g >= b && g - r >= 8 && g - b >= 8) green++
    if (mx - mn < 36 && mx > 90 && mx < 215) gray++
    if (mn > 200) white++
    if (((i / w) | 0) < topRows && b > r + 10 && b > g + 4 && b > 120) topSky++
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (Math.hypot(lum[i - 1] - lum[i + 1], lum[i - w] - lum[i + w]) > 36) edge++ }
  const greenF = green / n, grayF = gray / n, whiteF = white / n, satM = satSum / n, skyF = topSky / (topRows * w), edgeF = edge / n
  let aerial = 0.05, ground = 0.05, drawing = 0.05
  if (whiteF > 0.42 && satM < 0.14 && edgeF > 0.006) drawing += 1
  if (whiteF > 0.6 && satM < 0.08) drawing += 0.4
  if (skyF > 0.3) ground += 1
  if (skyF > 0.5) ground += 0.4
  if (greenF > 0.12 && skyF < 0.25) aerial += 1
  if (grayF > 0.06 && greenF > 0.04 && skyF < 0.25 && whiteF < 0.4) aerial += 0.4
  const sum = aerial + ground + drawing
  aerial /= sum; ground /= sum; drawing /= sum
  const arr = [['aerial', aerial], ['ground', ground], ['drawing', drawing]].sort((a, b) => b[1] - a[1])
  const route = arr[0][0], margin = arr[0][1] - arr[1][1]
  const msg = route === 'aerial' ? 'Looks like an overhead/aerial view — I can auto-detect the footprint.' : route === 'ground' ? 'Looks like a ground-level photo — angled shots distort distances, so detected corners are approximate. (Full ground reconstruction is coming.)' : 'Looks like a line drawing — I will outline the largest shape; set a known dimension for scale.'
  return { aerial, ground, drawing, route, margin, msg }
}
export const initAutoDetect = ({ tc, T, tDraw, tStatus, getMapOn }) => {
  let drag = -1, forced = null, lastCls = null, seed = null, downPt = null, moved = false
  const routeBtns = document.getElementById('troute')
  const ptOf = e => { const r = tc.getBoundingClientRect(); return [(e.clientX - r.left) * tc.width / r.width, (e.clientY - r.top) * tc.height / r.height] }
  const routeNow = () => forced || (lastCls ? lastCls.route : 'aerial')
  const setActive = r => routeBtns && [...routeBtns.querySelectorAll('button')].forEach(b => b.classList.toggle('acc', b.dataset.r === r))
  const hint = r => tStatus(r === 'aerial' ? 'Aerial mode — click your deck/patio in the image (or ✨ Auto-detect).' : r === 'ground' ? 'Ground-photo mode — ✨ Auto-detect gives an approximate outline; verify the corners.' : 'Drawing mode — ✨ Auto-detect outlines the largest shape; set a known dimension for scale.')
  if (routeBtns) [...routeBtns.querySelectorAll('button')].forEach(b => b.onclick = () => { forced = b.dataset.r; setActive(forced); hint(forced) })
  const onImage = img => { lastCls = classifyImage(img); forced = null; seed = null; routeBtns && (routeBtns.style.display = 'flex'); setActive(lastCls.route); tStatus(lastCls.msg + ' Override the type at left if needed, then click the shape or ✨ Auto-detect.') }
  const timg = document.getElementById('timg')
  timg && timg.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { onImage(im); URL.revokeObjectURL(u) }; im.src = u })
  const reconstructGround = () => {
    if (T.poly.length < 4) { tStatus('Ground photo: tap the 4 deck-floor corners first (② Trace) — back-left, back-right, front-right, front-left.'); return null }
    const r = rectifyQuad(T.poly.slice(0, 4), tc.width / 2, tc.height / 2)
    if (!r.ok) { tStatus('Could not solve the perspective — re-tap the 4 floor corners as a clear rectangle.'); return null }
    const pd = prompt('Real width of the deck/patio ALONG the house (e.g. 133in or 11ft):', '11ft')
    const m = pd && pd.match(/([\d.]+)\s*(in|"|ft|')?/i)
    const wFt = m ? parseFloat(m[1]) * (/(in|")/i.test(m[2] || '') ? 1 / 12 : 1) : NaN
    if (!(wFt > 0)) { tStatus('Need the real width to size it.'); return null }
    const lowConf = !!r.affine || r.aspect > 3 || r.aspect < 0.34
    return { ok: true, length: clamp(wFt, 2, 80), depth: clamp(wFt / r.aspect, 2, 80), aspect: r.aspect, affine: lowConf }
  }
  const detect = () => {
    if (!T.img) { tStatus('Find an address (satellite) or upload a photo first, then click your deck/patio or ✨ Auto-detect.'); return false }
    const mapOn = !!getMapOn(), route = mapOn ? 'aerial' : routeNow()
    if (route === 'ground') { tStatus('Ground photo: tap the 4 deck-floor corners (② Trace) in order — back-left → back-right → front-right → front-left — then ✅ Use outline to reconstruct in 3D.'); return false }
    if (mapOn && !seed) { tStatus('Click directly on your deck/patio in the satellite image — I will detect that shape (panning to the backyard helps).'); return false }
    const poly = detectPoly(T.img, route === 'drawing' ? 'ink' : 'region', route === 'drawing' ? null : seed)
    if (!poly) { tStatus('Could not find a clear shape there — click right on your deck/patio, or trace the corners manually.'); return false }
    T.poly = poly; tDraw()
    const lead = route === 'ground' ? 'Approximate outline (angled photo) — ' : route === 'drawing' ? 'Outlined the largest shape — ' : seed ? 'Detected around your click — ' : 'Footprint proposed — '
    const tail = mapOn ? 'drag corners to fine-tune (or click a different spot), then ✅ Use outline. Scale is set.' : T.pxPerFt > 0 ? 'drag corners to fix, then ✅ Use outline.' : 'drag corners, then ① Set scale (two points a known distance apart) and ✅ Use outline.'
    tStatus(lead + tail)
    return true
  }
  const onDown = e => {
    if (T.mode) return
    downPt = ptOf(e); moved = false; drag = -1
    if (T.poly.length) { let bi = -1, bd = 16; T.poly.forEach((q, i) => { const dd = Math.hypot(q[0] - downPt[0], q[1] - downPt[1]); if (dd < bd) { bd = dd; bi = i } }); if (bi >= 0) { drag = bi; e.stopPropagation(); e.preventDefault() } }
  }
  const onMove = e => { const p = ptOf(e); if (drag >= 0) { T.poly[drag] = [clamp(p[0], 0, tc.width), clamp(p[1], 0, tc.height)]; tDraw(); return } if (downPt && Math.hypot(p[0] - downPt[0], p[1] - downPt[1]) > 5) moved = true }
  const onUp = () => { if (drag >= 0) { drag = -1; downPt = null; return } if (downPt && !moved && !T.mode && T.img) { seed = downPt; downPt = null; detect(); return } downPt = null }
  tc.addEventListener('mousedown', onDown, true)
  window.addEventListener('mousemove', onMove, true)
  window.addEventListener('mouseup', onUp, true)
  const detectFootprint = () => { seed = null; return detect() }
  const dispose = () => { tc.removeEventListener('mousedown', onDown, true); window.removeEventListener('mousemove', onMove, true); window.removeEventListener('mouseup', onUp, true) }
  return { detectFootprint, classifyImage, reconstructGround, route: routeNow, dispose }
}
