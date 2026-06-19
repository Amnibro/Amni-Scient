import { computeHomography, applyH, invert3 } from './perspective.js'
// --- minimal camera viewing a floor (y=0 plane) ---
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const f = 700, cx = 480, cy = 320, eye = [0, 5, -2], center = [0, 0, 6], up = [0, 1, 0]
const rz = nrm(sub(center, eye)), rx = nrm(cross(up, rz)), ry = cross(rz, rx)
const project = X => { const d = sub(X, eye), Xc = [dot(rx, d), dot(ry, d), dot(rz, d)]; return [f * Xc[0] / Xc[2] + cx, f * Xc[1] / Xc[2] + cy] }
const projFloor = (x, z) => project([x, 0, z])
// 4 floor corners of a 12 x 16 ft room (src = floor feet, dst = image px)
const corners = [[-6, 0], [6, 0], [6, 16], [-6, 16]]
const src = corners, dst = corners.map(c => projFloor(c[0], c[1]))
const H = computeHomography(src, dst)
const results = [], check = (n, ok) => results.push([n, ok])
// 1) recovered H maps fresh floor points to the same pixel the camera projects
let maxErr = 0
for (const [x, z] of [[0, 8], [3, 4], [-4, 12], [2, 14], [-5, 1]]) { const a = applyH(H, [x, z]), b = projFloor(x, z); maxErr = Math.max(maxErr, Math.hypot(a[0] - b[0], a[1] - b[1])) }
check('floor->image reprojection < 0.5px (max ' + maxErr.toFixed(3) + ')', maxErr < 0.5)
// 2) inverse maps a tapped pixel back to the right floor position
const Hi = invert3(H); let invErr = 0
for (const [x, z] of [[0, 8], [3, 4], [-4, 12]]) { const px = projFloor(x, z), fl = applyH(Hi, px); invErr = Math.max(invErr, Math.hypot(fl[0] - x, fl[1] - z)) }
check('image->floor inverse < 0.02 ft (max ' + invErr.toFixed(4) + ')', invErr < 0.02)
// 3) perspective foreshortening: a 1-ft segment near the camera spans more px than far away
const nearPx = Math.abs(applyH(H, [0.5, 2])[0] - applyH(H, [-0.5, 2])[0])
const farPx = Math.abs(applyH(H, [0.5, 14])[0] - applyH(H, [-0.5, 14])[0])
check('near 1ft (' + nearPx.toFixed(1) + 'px) > far 1ft (' + farPx.toFixed(1) + 'px)', nearPx > farPx * 1.3)
// 4) a to-scale fixture footprint projects to a perspective quad (4 distinct corners, convex-ish)
const toilet = [[-0.65, 7], [0.65, 7], [0.65, 9.3], [-0.65, 9.3]].map(p => applyH(H, p))
const area = Math.abs((toilet[1][0] - toilet[0][0]) * (toilet[2][1] - toilet[0][1]))
check('fixture footprint projects to a real quad', area > 50 && toilet.every(p => isFinite(p[0])))
let allok = true
for (const [n, ok] of results) { if (!ok) allok = false; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + n) }
console.log('VERDICT:', allok ? 'PASS' : 'FAIL')
