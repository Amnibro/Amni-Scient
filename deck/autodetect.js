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
const detectPoly = (src, mode) => {
  const { data, w, h, sc } = imgData(src, WORK), n = w * h
  let pix
  if (mode === 'ink') {
    const fg = inkMask(data, n); pix = []
    for (let p = 0; p < n; p++) if (fg[p]) { const x = p % w; pix.push([x, (p - x) / w]) }
    if (pix.length < 24) return null
  } else {
    const fg = regionMask(data, n), { lab, comps } = components(fg, w, h)
    if (!comps.length) return null
    const N = n, cx0 = w / 2, cy0 = h / 2
    const valid = comps.filter(c => c.area > N * 0.004 && c.area < N * 0.92 && c.maxX - c.minX > 6 && c.maxY - c.minY > 6)
    const pool = valid.length ? valid : comps
    const pick = pool.reduce((a, c) => { const d = Math.hypot(c.cx - cx0, c.cy - cy0); const score = c.area / (1 + 0.0015 * d * d); return score > a.score ? { c, score } : a }, { c: null, score: -1 }).c
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
  let drag = -1, forced = null, lastCls = null
  const routeBtns = document.getElementById('troute')
  const ptOf = e => { const r = tc.getBoundingClientRect(); return [(e.clientX - r.left) * tc.width / r.width, (e.clientY - r.top) * tc.height / r.height] }
  const routeNow = () => forced || (lastCls ? lastCls.route : 'aerial')
  const setActive = r => routeBtns && [...routeBtns.querySelectorAll('button')].forEach(b => b.classList.toggle('acc', b.dataset.r === r))
  const hint = r => tStatus(r === 'aerial' ? 'Aerial mode — ✨ Auto-detect will trace the footprint; set scale if this is an upload.' : r === 'ground' ? 'Ground-photo mode — ✨ Auto-detect gives an approximate outline; verify the corners.' : 'Drawing mode — ✨ Auto-detect outlines the largest shape; set a known dimension for scale.')
  if (routeBtns) [...routeBtns.querySelectorAll('button')].forEach(b => b.onclick = () => { forced = b.dataset.r; setActive(forced); hint(forced) })
  const onImage = img => { lastCls = classifyImage(img); forced = null; routeBtns && (routeBtns.style.display = 'flex'); setActive(lastCls.route); tStatus(lastCls.msg + ' Override the type at left if needed, then ✨ Auto-detect.') }
  const timg = document.getElementById('timg')
  timg && timg.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { onImage(im); URL.revokeObjectURL(u) }; im.src = u })
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
    if (!T.img) { tStatus('Find an address (satellite) or upload a photo first, then ✨ Auto-detect.'); return false }
    const mapOn = !!getMapOn(), route = mapOn ? 'aerial' : routeNow()
    const poly = detectPoly(T.img, route === 'drawing' ? 'ink' : 'region')
    if (!poly) { tStatus('Could not find a clear shape — trace the corners manually instead.'); return false }
    T.poly = poly; tDraw()
    const lead = route === 'ground' ? 'Approximate outline (angled photo) — ' : route === 'drawing' ? 'Outlined the largest shape — ' : 'Footprint proposed — '
    const tail = mapOn ? 'drag any corner to fine-tune, then ✅ Use outline. (North-up satellite scale is set.)' : T.pxPerFt > 0 ? 'drag corners to fix, then ✅ Use outline.' : 'drag corners to fix, then ① Set scale (two points a known distance apart) and ✅ Use outline.'
    tStatus(lead + tail)
    return true
  }
  const dispose = () => { tc.removeEventListener('mousedown', onDown, true); window.removeEventListener('mousemove', onMove, true); window.removeEventListener('mouseup', onUp, true) }
  return { detectFootprint, classifyImage, dispose }
}
