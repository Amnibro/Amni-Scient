const TILE = (z, y, x) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
const cache = new Map()
const tile = (z, x, y) => {
  const k = `${z}/${x}/${y}`
  if (cache.has(k)) return cache.get(k)
  const p = new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = TILE(z, y, x) })
  cache.set(k, p)
  return p
}
const toPx = (lat, lon, z) => { const n = 256 * Math.pow(2, z); const la = lat * Math.PI / 180; return { x: (lon + 180) / 360 * n, y: (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * n } }
const toLL = (x, y, z) => { const n = 256 * Math.pow(2, z); const lon = x / n * 360 - 180; const t = Math.PI * (1 - 2 * y / n); return { lat: Math.atan(Math.sinh(t)) * 180 / Math.PI, lon } }
export const geocode = async q => {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, { headers: { Accept: 'application/json' } })
  const j = await r.json()
  return j && j[0] ? { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name } : null
}
export const initMapTrace = ({ tc, T, tDraw, tStatus }) => {
  const M = { on: false, lat: 42.728, lon: -73.692, zoom: 19, mc: document.createElement('canvas'), drag: null, gen: 0 }
  M.mc.width = tc.width; M.mc.height = tc.height
  const mPerPx = () => 156543.03392 * Math.cos(M.lat * Math.PI / 180) / Math.pow(2, M.zoom)
  const render = async () => {
    const gen = ++M.gen
    M.mc.width = tc.width; M.mc.height = tc.height
    const g = M.mc.getContext('2d')
    g.fillStyle = '#222'; g.fillRect(0, 0, M.mc.width, M.mc.height)
    const c = toPx(M.lat, M.lon, M.zoom)
    const left = c.x - M.mc.width / 2, top = c.y - M.mc.height / 2
    const jobs = []
    for (let tx = Math.floor(left / 256); tx <= Math.floor((left + M.mc.width) / 256); tx++)
      for (let ty = Math.floor(top / 256); ty <= Math.floor((top + M.mc.height) / 256); ty++)
        jobs.push(tile(M.zoom, tx, ty).then(im => { if (gen === M.gen && im) g.drawImage(im, tx * 256 - left, ty * 256 - top) }))
    await Promise.all(jobs)
    if (gen !== M.gen) return
    T.img = M.mc
    T.pxPerFt = 0.3048 / mPerPx()
    tDraw()
  }
  const find = async () => {
    const q = document.getElementById('maddr').value.trim()
    if (!q) { tStatus('Type an address first.'); return }
    tStatus('Looking up address…')
    try {
      const hit = await geocode(q)
      if (!hit) { tStatus('Address not found — try adding city + state.'); return }
      M.lat = hit.lat; M.lon = hit.lon; M.on = true
      window.__siteAddr = hit.name; window.__siteMapOn = true
      await render()
      tStatus(`📍 ${hit.name.slice(0, 70)} — satellite view at ${(0.3048 / T.pxPerFt * 100).toFixed(0)} cm/px, scale is AUTOMATIC. Drag to pan, then Trace and click corners.`)
      document.getElementById('mattrib').textContent = 'Imagery © Esri · Geocoding © OpenStreetMap'
    } catch { tStatus('Lookup failed (offline?) — you can still upload a photo.') }
  }
  document.getElementById('mfind').onclick = find
  document.getElementById('maddr').addEventListener('keydown', e => e.key === 'Enter' && find())
  document.getElementById('mzin').onclick = () => { if (M.on && M.zoom < 21) { M.zoom++; render() } }
  document.getElementById('mzout').onclick = () => { if (M.on && M.zoom > 16) { M.zoom--; render() } }
  tc.addEventListener('mousedown', e => { if (M.on && !T.mode) M.drag = { x: e.clientX, y: e.clientY } })
  window.addEventListener('mouseup', () => M.drag = null)
  window.addEventListener('mousemove', e => {
    if (!M.drag || !M.on || T.mode) return
    const r = tc.getBoundingClientRect()
    const sx = tc.width / r.width, sy = tc.height / r.height
    const c = toPx(M.lat, M.lon, M.zoom)
    const nc = toLL(c.x - (e.clientX - M.drag.x) * sx, c.y - (e.clientY - M.drag.y) * sy, M.zoom)
    M.lat = nc.lat; M.lon = nc.lon
    M.drag = { x: e.clientX, y: e.clientY }
    render()
  })
  return M
}
export const cropForPlan = (tc, poly, pxPerFt) => {
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const span = Math.max(x1 - x0, y1 - y0, 30 * pxPerFt) * 2.6
  const w = Math.min(tc.width, span), h = Math.min(tc.height, span * 0.72)
  const sx = Math.max(0, Math.min(tc.width - w, (x0 + x1) / 2 - w / 2)), sy = Math.max(0, Math.min(tc.height - h, (y0 + y1) / 2 - h / 2))
  const out = document.createElement('canvas')
  const scale = 980 / w
  out.width = 980; out.height = Math.round(h * scale)
  out.getContext('2d').drawImage(tc, sx, sy, w, h, 0, 0, out.width, out.height)
  let snap = null
  try { snap = out.toDataURL('image/jpeg', 0.88) } catch {}
  return { snap, w: out.width, h: out.height, poly: poly.map(p => [(p[0] - sx) * scale, (p[1] - sy) * scale]), pxPerFt: pxPerFt * scale }
}
export const sitePlanSVG = ({ snap, w, h, poly, pxPerFt, title, address, footprint, northUp = true }) => {
  const pad = 30, tb = 140
  const W = w + 2 * pad, H = h + tb + 2 * pad
  let s = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' font-family='monospace'><rect width='${W}' height='${H}' fill='#fff'/>`
  s += `<text x='${pad}' y='24' font-size='18' font-weight='bold' fill='#111'>${title}</text>`
  if (snap) s += `<image x='${pad}' y='${pad + 14}' width='${w}' height='${h}' href='${snap}'/>`
  const oy = pad + 14
  if (poly && poly.length > 2) {
    const pts = poly.map(p => `${(p[0] + pad).toFixed(1)},${(p[1] + oy).toFixed(1)}`).join(' ')
    s += `<polygon points='${pts}' fill='rgba(232,163,61,0.25)' stroke='#e8541d' stroke-width='3'/>`
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) / pxPerFt
      const mx = (a[0] + b[0]) / 2 + pad, my = (a[1] + b[1]) / 2 + oy
      s += `<text x='${mx.toFixed(1)}' y='${(my - 6).toFixed(1)}' font-size='15' font-weight='bold' fill='#fff' stroke='#000' stroke-width='3' paint-order='stroke' text-anchor='middle'>${len.toFixed(1)}'</text>`
    }
  }
  const sb = pxPerFt * 10
  if (northUp) {
  s += `<line x1='${pad + 10}' y1='${oy + h - 18}' x2='${pad + 10 + sb}' y2='${oy + h - 18}' stroke='#fff' stroke-width='5'/><line x1='${pad + 10}' y1='${oy + h - 18}' x2='${pad + 10 + sb}' y2='${oy + h - 18}' stroke='#111' stroke-width='3'/>`
  s += `<text x='${pad + 10 + sb / 2}' y='${oy + h - 26}' font-size='13' fill='#fff' stroke='#000' stroke-width='3' paint-order='stroke' text-anchor='middle'>10 ft</text>`
  const nx = pad + w - 30, ny = oy + 40
  s += `<polygon points='${nx},${ny - 22} ${nx - 8},${ny + 6} ${nx},${ny} ${nx + 8},${ny + 6}' fill='#fff' stroke='#111' stroke-width='1.5'/><text x='${nx}' y='${ny + 22}' font-size='14' font-weight='bold' fill='#fff' stroke='#000' stroke-width='3' paint-order='stroke' text-anchor='middle'>N</text>`
  }
  const ty = oy + h + 24
  s += `<rect x='${pad}' y='${ty}' width='${w}' height='${tb - 34}' fill='#f6f6f6' stroke='#999'/>`
  s += `<text x='${pad + 12}' y='${ty + 24}' font-size='14' fill='${northUp ? '#111' : '#a00'}' font-weight='bold'>${northUp ? 'SITE / TOP-DOWN PLAN — FOR PERMIT REVIEW' : 'PHOTO REFERENCE SKETCH — NOT FOR PERMIT SUBMISSION'}</text>`
  s += `<text x='${pad + 12}' y='${ty + 46}' font-size='12.5' fill='#333'>${(address || 'Site: (address not set — traced from photo)').slice(0, 120)}</text>`
  s += `<text x='${pad + 12}' y='${ty + 66}' font-size='12.5' fill='#333'>${footprint.slice(0, 120)}</text>`
  s += `<text x='${pad + 12}' y='${ty + 86}' font-size='12.5' fill='#333'>${northUp ? `Scale: 1 px = ${(1 / pxPerFt).toFixed(3)} ft · North-up imagery` : 'PERSPECTIVE PHOTO — dimensions approximate, verify on site'} · Generated ${new Date().toISOString().slice(0, 10)} · amni-scient.com</text>`
  return s + '</svg>'
}
