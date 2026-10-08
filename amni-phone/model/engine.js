import { MATERIALS, BACKS, K, EST, FORMS, ROLES, STEPS, IP_LEVELS, OPENINGS, HINGES, HINGE_DEFAULT, LEAF_MATS, DOCK_DEFAULT, DOCK_CODES } from './catalog.js';
import { ROLE, part, db, forRole, defaultFor, fitsRole, priceAt, fitsHousing } from './parts.js';
import { hingeType, hingeGeom, swing, magnetStudy, hingeLoads, linkStudy, leafFor360 } from './hinge.js';
import { systemStudy } from './system.js';
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r2 = v => Math.round(v * 100) / 100;
const fin = v => typeof v === 'number' && Number.isFinite(v);
export const LIMITS = { w: [25, 110], l: [25, 190], t: [2, 20], r: [0, 20], fillet: [0, 3], wall: [0.6, 3], floor: [0.4, 2] };
export const DEFAULT = { v: 4, name: 'Untitled phone', preset: '', req: { price: 450, life: 8, mass: 260, thick: 12, ip: 'ip67', qty: 1000, margin: 0.4, skin: 43, allowRef: false, pri: { cost: 3, life: 3, mass: 2, thin: 2, perf: 2, camera: 2, durability: 2, screen: 2 } }, form: 'slab', housing: { w: 76, l: 162, t: 11.5, r: 9, fillet: 1.2, wall: 1.4, floor: 0.9, mat: 'al6061', back: 'unibody' }, sel: {}, pos: {}, board: { poly: null, t: 0.8, z: null, path: 'som', layers: 10, hdi: 'any', fab: 'jlcpcb-hdi' }, seal: {}, hinge: { ...HINGE_DEFAULT }, dock: { ...DOCK_DEFAULT } };
export function normalize(src) {
  const s = src || {}, sr = s.req || {}, sh = s.housing || {};
  const req = { ...DEFAULT.req, ...sr, pri: { ...DEFAULT.req.pri, ...(sr.pri || {}) } };
  Object.keys(req.pri).forEach(k => { k in DEFAULT.req.pri ? (req.pri[k] = clamp(Number(req.pri[k]) || 0, 0, 5)) : delete req.pri[k]; });
  ['price', 'life', 'mass', 'thick', 'qty', 'margin', 'skin'].forEach(k => { req[k] = fin(Number(req[k])) ? Number(req[k]) : DEFAULT.req[k]; }); ['maxW', 'maxL'].forEach(k => { req[k] = fin(Number(sr[k])) && Number(sr[k]) > 0 ? r2(Number(sr[k])) : null; }); req.depth = clamp(fin(Number(sr.depth)) ? Number(sr.depth) : 1.5, 0, 200);
  req.qty = [1, 100, 1000].includes(req.qty) ? req.qty : 1000; req.ip = IP_LEVELS[req.ip] ? req.ip : 'none'; req.allowRef = !!req.allowRef; req.margin = clamp(req.margin, 0.05, 0.7); req.skin = clamp(req.skin, 38, 48);
  const housing = { ...DEFAULT.housing, ...sh };
  Object.keys(LIMITS).forEach(k => { housing[k] = r2(clamp(fin(Number(housing[k])) ? Number(housing[k]) : DEFAULT.housing[k], LIMITS[k][0], LIMITS[k][1])); });
  housing.r = Math.min(housing.r, housing.w / 2 - 1, housing.l / 2 - 1); housing.auto = sh.auto !== false; housing.gap = r2(clamp(fin(Number(sh.gap)) ? Number(sh.gap) : 0.2, 0, 3)); housing.tB = sh.tB != null && sh.tB !== '' && fin(Number(sh.tB)) ? r2(clamp(Number(sh.tB), LIMITS.t[0], LIMITS.t[1])) : null; housing.mat = MATERIALS[housing.mat] ? housing.mat : 'al6061'; housing.back = BACKS[housing.back] ? housing.back : 'unibody';
  const form = FORMS[s.form] ? s.form : 'slab', hs = { ...HINGE_DEFAULT, ...(s.hinge || {}) }, num = (v, a, b, def) => r2(clamp(fin(Number(v)) ? Number(v) : def, a, b));
  const hinge = { type: HINGES[hs.type] ? hs.type : 'spine', leaf: num(hs.leaf, 2, 24, 6), pinFace: num(hs.pinFace, 0.8, 12, 2), inset: num(hs.inset, 0.8, 14, 2.5), pinD: num(hs.pinD, 1, 4, 1.6), leafT: num(hs.leafT, 0.4, 3, 1), leafW: num(hs.leafW, 2, 10, 4.5), leafMat: LEAF_MATS[hs.leafMat] ? hs.leafMat : 'ti5', shutPairs: Math.round(num(hs.shutPairs, 0, 6, 2)), flatPairs: Math.round(num(hs.flatPairs, 0, 4, 2)), detents: (Array.isArray(hs.detents) ? hs.detents : []).map(Number).filter(v => fin(v) && v > 0 && v < 360).slice(0, 6), flipBottom: hs.flipBottom === 'keys' ? 'keys' : 'screen' };
  FORMS[form].axis && !FORMS[form].hinges.includes(hinge.type) && (hinge.type = FORMS[form].hinges[0]);
  const dk = { ...DOCK_DEFAULT, ...(s.dock || {}) }, edges4 = (src, def) => Object.fromEntries(['E', 'W', 'N', 'S'].map(e => [e, src && e in src ? !!src[e] : def[e]])), dock = { on: !!dk.on && form === 'slab', edges: edges4(dk.edges, DOCK_DEFAULT.edges), links: edges4(dk.links, DOCK_DEFAULT.links), perEdge: Math.round(clamp(fin(Number(dk.perEdge)) ? Number(dk.perEdge) : 4, 2, 8) / 2) * 2, back: dk.back !== false, code: DOCK_CODES[dk.code] ? dk.code : 'pair', sealed: !!dk.sealed };
  const system = s.system && form === 'slab' && dock.on ? normSystem(s.system) : null;
  system && system.arch === 'companion' && !system.B && (system.B = normalize({ form: 'slab', board: { path: 'mcu' }, dock: { ...dock, on: true }, housing: { ...housing, auto: false }, req: { ...req }, sel: {} }));
  const sel = {}, pos = {}, seal = {};
  Object.entries(s.sel || {}).forEach(([k, v]) => { ROLE[k] && (v === '' || fitsRole(part(v), k)) && (sel[k] = v); });
  Object.entries(s.pos || {}).forEach(([k, v]) => { const xy = v && fin(Number(v.x)) && fin(Number(v.y)) && v.x !== null && v.y !== null; v && (xy || v.half || v.lock) && (pos[k] = { x: xy ? r2(Number(v.x)) : null, y: xy ? r2(Number(v.y)) : null, lock: !!v.lock && xy, placed: !!v.placed && xy, z: v.z != null && v.z !== '' && fin(Number(v.z)) ? r2(Number(v.z)) : null, rot: [0, 90, 180, 270].includes(Number(v.rot)) ? Number(v.rot) : 0, half: v.half === 'B' ? 'B' : 'A', mount: v.mount || null, stand: !!v.stand }); });
  Object.entries(s.seal || {}).forEach(([k, v]) => { typeof v === 'string' && (seal[k] = v); });
  const b = s.board || {};
  const poly = Array.isArray(b.poly) && b.poly.length >= 3 && b.poly.every(p => Array.isArray(p) && fin(Number(p[0])) && fin(Number(p[1]))) ? b.poly.map(p => [r2(Number(p[0])), r2(Number(p[1]))]) : null;
  return { v: 4, name: String(s.name || DEFAULT.name).slice(0, 60), preset: String(s.preset || ''), req, form, housing, hinge, dock, system, sel, pos, board: { poly, t: clamp(Number(b.t) || K.boardT, 0.4, 1.6), z: b.z != null && b.z !== "" && fin(Number(b.z)) ? r2(Number(b.z)) : null, path: ['custom', 'mcu'].includes(b.path) ? b.path : 'som', layers: [4, 6, 8, 10, 12, 14].includes(Number(b.layers)) ? Number(b.layers) : 10, hdi: ['through', '1+N+1', '2+N+2', 'any'].includes(b.hdi) ? b.hdi : 'any', fab: typeof b.fab === 'string' ? b.fab : 'jlcpcb-hdi' }, seal };
}
export const TILE_CONFIGS = { widebook: { name: 'Widebook (side by side, long edges)', tiles: [[0, 0, 0, 'up'], [1, 0, 0, 'up']] }, longbook: { name: 'Longbook (end to end)', tiles: [[0, 0, 0, 'up'], [0, -1, 0, 'up']] }, back2back: { name: 'Back-to-back, both screens out', tiles: [[0, 0, 0, 'up'], [0, 0, 0, 'down', -1]] }, back2backOffset: { name: 'Back-to-back, camera band exposed (rear camera selfie)', tiles: [[0, 0, 0, 'up'], [0, -0.45, 0, 'down', -1]] }, facedown: { name: 'Face-to-back (one screen, other piece as battery/camera module)', tiles: [[0, 0, 0, 'up'], [0, 0, 0, 'up', -1]] }, carry: { name: 'Face-to-face carry (screens protected)', tiles: [[0, 0, 0, 'up'], [0, 0, 0, 'down', 1]] }, row3: { name: 'Row of three', tiles: [[0, 0, 0, 'up'], [1, 0, 0, 'up'], [2, 0, 0, 'up']] }, L3: { name: 'L of three', tiles: [[0, 0, 0, 'up'], [1, 0, 0, 'up'], [0, -1, 0, 'up']] }, grid4: { name: '2 × 2 grid (large screen)', tiles: [[0, 0, 0, 'up'], [1, 0, 0, 'up'], [0, -1, 0, 'up'], [1, -1, 0, 'up']] }, apart: { name: 'Apart (stereo rig, UWB-tracked)', tiles: [[0, 0, 0, 'up'], [3, 0, 0, 'up']] } };
export function normSystem(sy) { const arch = sy.arch === 'companion' ? 'companion' : 'twins', config = TILE_CONFIGS[sy.config] ? sy.config : 'widebook', tiles = (Array.isArray(sy.tiles) && sy.tiles.length ? sy.tiles : TILE_CONFIGS[config].tiles.map(t => ({ gx: t[0], gy: t[1], rot: t[2], face: t[3], level: t[4] || 0 }))).slice(0, 9).map((t, i) => ({ type: i === 0 ? 'A' : t.type === 'B' || (arch === 'companion' && !t.type && i > 0) ? 'B' : 'A', gx: Number(t.gx) || 0, gy: Number(t.gy) || 0, rot: [0, 90, 180, 270].includes(Number(t.rot)) ? Number(t.rot) : 0, face: t.face === 'down' ? 'down' : 'up', level: [-1, 0, 1].includes(Number(t.level)) ? Number(t.level) : 0 })); return { arch, config, tiles, B: arch === 'companion' && sy.B ? normalize({ ...sy.B, system: null, dock: { ...(sy.B.dock || {}), on: true } }) : null, apartMm: clamp(Number(sy.apartMm) || 150, 20, 2000) }; }
const csiOk = d => { const h = d.board && d.board.path === 'mcu' ? selected(d, 'mcu') : null; return !h || !(h.n.csiPorts === 0 || /^none/i.test(String((h.specs || {}).mipi_csi || ''))); };
['cam_main', 'cam_ultra', 'cam_front', 'flash', 'flash_drv'].forEach(id => { const r = ROLE[id]; if (!r || r.csiGate) return; const w = r.when; r.csiGate = true; r.when = d => (!w || w(d)) && csiOk(d); });
export function roleApplies(d, r) { return (!r.forms || r.forms.includes(d.form)) && (!r.hinges || r.hinges.includes(hingeType(d))) && (!r.when || r.when(d)); }
export function selected(d, roleId) { const r = ROLE[roleId]; if (!roleApplies(d, r)) return null; const v = d.sel[roleId]; return v === '' ? null : v ? part(v) : null; }
export function isRequired(d, r) {
  const som = selected(d, 'som') || selected(d, 'soc') || selected(d, 'mcu'), n = (som && som.n) || {};
  return roleApplies(d, r) && (r.req === true || (r.req === 'noModem' && !n.hasModem && d.board.path !== 'mcu') || (r.req === 'noWifi' && !n.hasWifi) || (r.req === 'noEsim' && !selected(d, 'esim')) || (r.req === 'noProtect' && !((selected(d, 'cell') || {}).n || {}).protection) || (r.req === 'folding' && d.form !== 'slab') || (r.req === 'outer' && hingeType(d) === 'outer') || (r.req === 'custom' && d.board.path === 'custom') || (r.req === 'dock' && d.dock.on) || (r.req === 'sealed' && d.dock.sealed && (!!n.hasModem || !!selected(d, 'modem') || !!selected(d, 'ntn'))) || (r.req === 'ip' && IP_LEVELS[d.req.ip].n >= 7) || (r.req === 'csi' && !(som && (n.csiPorts === 0 || /^none/i.test(String((som.specs || {}).mipi_csi || ''))))));
}
export function withDefaults(d) {
  const sel = { ...d.sel };
  const fold = FORMS[d.form].foldable;
  ROLES.forEach(r => { if (!roleApplies(d, r) || r.id in sel) return; const want = isRequired({ ...d, sel }, r) || ['gnss', 'mic2', 'usb_pd', 'baro', 'mag', 'nfc', 'nfc_coil', 'flash', 'flash_drv', 'hall', 'display2', 'dock_back', 'dock_hall'].includes(r.id) || (r.id === 'cam_ultra' && (((part(sel.som) || {}).n || {}).csiPorts || 3) >= 3) || (r.id === 'cell2' && FORMS[d.form].axis === 'long') || (r.id === 'display_cover' && d.form === 'flipfold'); const nd = ROLES.filter(x => ['display', 'display2', 'display_cover'].includes(x.id) && roleApplies(d, x) && (x.id !== 'display2' || d.form !== 'flip' || d.hinge.flipBottom !== 'keys') && (x.id !== 'display_cover' || sel.display_cover || d.form === 'flipfold')).length, pred = ['display', 'display2'].includes(r.id) ? p => p.n.touch && (!d.housing.auto || !(d.req.maxW || d.req.maxL) || (p.n.aw || 0) * (p.n.ah || 0) >= 0.6 * Math.max(...forRole(r.id, false, d).filter(x => x.n.touch && fitsHousing(d, x, r.id)).map(x => (x.n.aw || 0) * (x.n.ah || 0)), 0)) : ['som', 'soc'].includes(r.id) ? p => (p.n.dsiPorts || 1) >= nd && (!p.n.mipiShared || p.n.mipiShared >= nd + 2) : r.id === 'link' ? p => p.n.kind === (d.form === 'slab' ? '' : 'fpc_custom') : null, ar = d.req.allowRef || (fold && ['display', 'hinge_fold'].includes(r.id)) || r.id === 'hinge_fold'; const caps = d.housing.auto && (d.req.maxW || d.req.maxL) && ['display', 'display2'].includes(r.id), big = caps ? forRole(r.id, false, d).filter(x => x.n.touch && x.status !== 'oem' && fitsHousing(d, x, r.id)).sort((a, b) => ((b.n.aw || 0) * (b.n.ah || 0)) - ((a.n.aw || 0) * (a.n.ah || 0)))[0] : null, p = want ? big || defaultFor(r.id, ar, d, pred) || defaultFor(r.id, ar, d) : null; p && (sel[r.id] = p.id); });
  const ref = forRole('display', true, d).filter(p => p.status === 'oem' && p.n && p.n.kind === 'foldable').sort((a, b) => (b.n.fold === fold) - (a.n.fold === fold))[0];
  fold && ref && (!sel.display || (part(sel.display) || {}).n.kind !== 'foldable') && (sel.display = ref.id);
  return { ...d, sel };
}
const BOX = { som: [40, 50, 3.5], soc_ref: [12, 12, 1], memory: [11.5, 13, 1], modem: [30, 32, 2.4], ntn: [16, 18, 2.2], wifi: [10, 12, 1.5], gnss: [10, 10, 2.5], display: [68, 150, 1.2], display_ref: [140, 150, 0.6], cover_glass: [74, 160, 0.7], cell: [65, 80, 5], cell_custom: [65, 80, 5], charger: [4, 4, 0.8], fuel_gauge: [2, 2, 0.6], protection: [2, 2, 0.6], usb_pd: [4, 4, 0.8], pmic: [3, 3, 0.8], qi_rx: [4, 4, 0.6], qi_coil: [40, 40, 0.6], camera: [9, 9, 6], camera_front: [6, 6, 3.5], flash: [3, 3, 1], speaker: [15, 11, 3], receiver: [12, 3.5, 2], mic: [3.5, 2.65, 1], haptic: [10, 10, 3], haptic_drv: [2, 2, 0.8], usbc: [8.94, 7.3, 3.26], seal_usbc: [8.94, 7.3, 3.26], button: [3, 6, 3], sim: [16, 14, 1.4], esim: [5, 6, 0.8], sensor: [3, 3, 1], fingerprint: [10, 10, 2], nfc: [4, 4, 0.8], nfc_coil: [40, 40, 0.3], antenna: [40, 7, 0.2], b2b: [10, 3, 1], fpc_conn: [10, 3, 1], shield: [20, 20, 1.5], thermal: [40, 50, 0.07], hinge: [20, 8, 6] };
const METAL = new Set(['soc', 'lpddr', 'ufs', 'som', 'soc_ref', 'memory', 'modem', 'ntn', 'wifi', 'gnss', 'cell', 'cell_custom', 'camera', 'speaker', 'haptic', 'usbc', 'seal_usbc', 'sim', 'shield', 'hinge', 'qi_coil']);
export function dimsOf(p, rot, stand) {
  const n = (p && p.n) || {}, def = BOX[p ? p.cat : 'b2b'] || [5, 5, 1];
  let sx = fin(n.sx) ? n.sx : def[0], sy = fin(n.sy) ? n.sy : def[1], sz = fin(n.sz) ? n.sz : def[2];
  stand && ([sy, sz] = [sz, sy]);
  return { sx: rot % 180 ? sy : sx, sy: rot % 180 ? sx : sy, sz, est: !(fin(n.sx) && fin(n.sy) && fin(n.sz)) };
}
export function geo(d) {
  const h = d.housing, back = BACKS[h.back], glass = selected(d, 'glass'), disp = selected(d, 'display'), adh = selected(d, 'adhesive');
  const floor = h.back === 'unibody' ? h.floor : back.t, glassT = glass && fin(glass.n.t) ? glass.n.t : 0.7, adhT = adh && fin(adh.n.t) ? adh.n.t : K.adhesiveT;
  const mk = (t, dp) => { const dsz = dimsOf(dp, 0).sz, dispZ = t - glassT - adhT - dsz; return { t, dispZ, dispT: dsz, cavTop: dispZ - K.gapDisplay }; };
  const iw = h.w - 2 * h.wall, il = h.l - 2 * h.wall, base = { ...h, floor, glassT, adhT, iw, il, ir: Math.max(0.5, h.r - h.wall), halves: FORMS[d.form].halves, axis: FORMS[d.form].axis };
  const B = mk(h.tB != null ? h.tB : h.t, roleApplies(d, ROLE.display2) ? selected(d, 'display2') || disp : FORMS[d.form].foldable ? disp : null);
  return { ...base, ...mk(h.t, disp), B: { ...base, ...B } };
}
export function pointInPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; (yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi && (c = !c); } return c; }
export function rectInPoly(x0, y0, x1, y1, poly) { const pts = []; for (let t = 0; t <= 1.0001; t += 0.125) pts.push([x0 + (x1 - x0) * t, y0], [x0 + (x1 - x0) * t, y1], [x0, y0 + (y1 - y0) * t], [x1, y0 + (y1 - y0) * t]); return pts.every(([x, y]) => pointInPoly(x, y, poly)) && !poly.some(([px, py]) => px > x0 + 1e-6 && px < x1 - 1e-6 && py > y0 + 1e-6 && py < y1 - 1e-6); }
export function polyArea(poly) { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return Math.abs(a / 2); }
export function overlap(a, b, c) { return a[0] < b[3] + c && b[0] < a[3] + c && a[1] < b[4] + c && b[1] < a[4] + c && a[2] < b[5] + c && b[2] < a[5] + c; }
export function inRounded(x, y, hw, hl, r) { const dx = Math.abs(x) - (hw - r), dy = Math.abs(y) - (hl - r); return dx <= 1e-6 || dy <= 1e-6 ? Math.abs(x) <= hw + 1e-6 && Math.abs(y) <= hl + 1e-6 : Math.hypot(dx, dy) <= r + 1e-6; }
const ON_BOARD = new Set(['boardTop', 'boardBottom']);
function mountOf(d, r, pz) { return (pz && pz.mount) || r.mount; }
function zFor(d, g, it, board) {
  const m = it.mount, top = board.z + board.t;
  return m === 'display' ? g.dispZ : m === 'glass' ? g.t - g.glassT : m === 'boardTop' ? top + (it.cat === 'som' ? (it.p && fin(it.p.n.mated) ? it.p.n.mated : 1.5) : 0) : m === 'boardBottom' ? board.z - it.sz : m === 'front' ? g.t - g.glassT - g.adhT - it.sz : m === 'top' ? g.dispZ - it.sz - 0.1 : m === 'spreader' ? g.dispZ - it.sz - 0.05 : m === 'back' ? g.floor : m === 'edgeRight' || m === 'edgeLeft' ? Math.max(g.floor, (g.floor + g.cavTop) / 2 - it.sz / 2) : m === 'edgeBottom' ? g.floor + 0.3 : m === 'hinge' ? g.floor : m === 'backDisplay' ? 0.05 : m === 'magShut' ? g.cavTop - it.sz - 0.02 : m === 'magFlat' ? Math.max(g.floor, (g.floor + g.cavTop) / 2 - it.sz / 2) : m === 'keypad' ? Math.max(g.floor, g.cavTop - it.sz) : m === 'magEdge' ? Math.max(g.floor, (g.floor + g.cavTop) / 2 - it.sz / 2) : m === 'magBack' || m === 'hallEdge' || m === 'linkEdge' ? g.floor + 0.05 : g.floor + (it.lift || 0);
}
function autoBoard(d, g, items, keepPoly) {
  const cams = items.filter(i => i.mount === 'back' && i.half === 'A');
  const antBand = Math.max(0, ...items.filter(i => i.mount === 'antTop').map(i => 3.5));
  const dm = items.find(i => i.mount === 'magEdge'), band = e => d.dock.on && d.dock.edges[e] && dm ? Math.min(dm.sx, dm.sy) + 0.8 : 0;
  const x0 = -g.iw / 2 + 0.6 + band('W'), x1 = g.iw / 2 - 0.6 - band('E'), bz = g.floor + 1.2, fronts = items.filter(i => i.half === 'A' && ['front', 'top'].includes(i.mount) && i.sz > 3);
  const yT = Math.min(g.il / 2 - Math.max(antBand, 4, band('N')) - 0.6, ...fronts.map(f => f.y - f.sy / 2 - 0.8));
  const camLeft = cams.length && cams[0].x < 0, notch = cams.length ? [camLeft ? Math.max(...cams.map(c => c.x + c.sx / 2)) + 0.8 : Math.min(...cams.map(c => c.x - c.sx / 2)) - 0.8, Math.min(...cams.map(c => c.y - c.sy / 2)) - 0.8] : null;
  const edges = items.filter(i => i.half === 'A' && i.mount === 'edgeRight');
  const leftAt = y => Math.max(x0, notch && camLeft && y > notch[1] ? notch[0] : x0, ...items.filter(i => i.half === 'A' && i.mount === 'edgeLeft' && y > i.y - i.sy / 2 - 0.6 && y < i.y + i.sy / 2 + 0.6).map(e => e.x + e.sx / 2 + 0.5));
  const rightAt = y => Math.min(x1, notch && !camLeft && y > notch[1] ? notch[0] : x1, ...edges.filter(e => y > e.y - e.sy / 2 - 0.6 && y < e.y + e.sy / 2 + 0.6).map(e => e.x - e.sx / 2 - 0.5));
  const make = L => { const yB = yT - L, ys = [...new Set([yB, yT, ...(notch ? [notch[1]] : []), ...edges.flatMap(e => [e.y - e.sy / 2 - 0.6, e.y + e.sy / 2 + 0.6])].filter(y => y >= yB && y <= yT).map(y => r2(y)))].sort((a, b) => a - b); const pts = []; for (let i = 0; i < ys.length - 1; i++) { const x = r2(rightAt((ys[i] + ys[i + 1]) / 2)); pts.push([x, ys[i]], [x, ys[i + 1]]); } for (let i = ys.length - 1; i > 0; i--) { const x = r2(leftAt((ys[i] + ys[i - 1]) / 2)); pts.push([x, ys[i]], [x, ys[i - 1]]); } return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]).filter((p, i, a) => { const q = a[(i + 1) % a.length], o = a[(i - 1 + a.length) % a.length]; return !((o[0] === p[0] && p[0] === q[0]) || (o[1] === p[1] && p[1] === q[1])); }); };
  const tops = items.filter(i => i.mount === 'boardTop' && i.half === 'A').sort((a, b) => b.sx * b.sy - a.sx * a.sy), bots = items.filter(i => i.mount === 'boardBottom' && i.half === 'A').sort((a, b) => b.sx * b.sy - a.sx * a.sy);
  const pack = (list, poly, yTop) => { const placed = [], pb = [Math.min(...poly.map(p => p[0])), Math.min(...poly.map(p => p[1])), Math.max(...poly.map(p => p[0])), Math.max(...poly.map(p => p[1]))]; list.filter(it => it.role === 'sim' && !it.fixed).forEach(it => { it.x = r2(x0 + it.sx / 2 + 0.3); it.y = r2(Math.min(...poly.map(p => p[1])) + it.sy / 2 + 0.6); placed.push(it); }); for (const it of list.filter(i => !placed.includes(i))) { if (it.fixed) { if (!keepPoly && !rectInPoly(it.x - it.sx / 2, it.y - it.sy / 2, it.x + it.sx / 2, it.y + it.sy / 2, poly)) return false; placed.push(it); continue; } let ok = false; for (let y = yTop - it.sy / 2 - 0.5; !ok && y > -g.il; y -= 1) for (let x = x0 + it.sx / 2 + 0.5; !ok && x < x1 - it.sx / 2; x += 1) { const bx = [x - it.sx / 2, y - it.sy / 2, 0, x + it.sx / 2, y + it.sy / 2, 1]; !placed.some(p => overlap(bx, [p.x - p.sx / 2, p.y - p.sy / 2, 0, p.x + p.sx / 2, p.y + p.sy / 2, 1], K.clear + 0.3)) && bx[0] - 0.3 >= pb[0] && bx[3] + 0.3 <= pb[2] && bx[1] - 0.3 >= pb[1] && bx[4] + 0.3 <= pb[3] && rectInPoly(bx[0] - 0.3, bx[1] - 0.3, bx[3] + 0.3, bx[4] + 0.3, poly) && (it.x = x, it.y = y, ok = true, placed.push(it)); } if (!ok) return false; } return true; };
  if (keepPoly) { pack(tops, keepPoly, Math.max(...keepPoly.map(p => p[1]))); pack(bots, keepPoly, Math.max(...keepPoly.map(p => p[1]))); return keepPoly; }
  const need = Math.max(tops.reduce((n, i) => n + i.sx * i.sy, 0), bots.reduce((n, i) => n + i.sx * i.sy, 0)) / (x1 - x0) / 0.85;
  for (let L = Math.max(20, Math.ceil(need), Math.ceil(Math.max(0, ...tops.map(i => i.sy)) + 1.6)); L <= g.il * 0.8; L += 2) { const poly = make(L); if (pack(tops, poly, yT) && pack(bots, poly, yT)) return poly; }
  return make(Math.round(g.il * 0.6));
}
export function freeSpot(it, obst, ok, pref, step, radius) {
  const s = step || 0.5, R = radius || 45, bx = (x, y) => [x - it.sx / 2, y - it.sy / 2, it.z, x + it.sx / 2, y + it.sy / 2, it.z + it.sz];
  const free = (x, y) => ok(x, y) && !obst.some(o => o !== it && overlap(bx(x, y), o.box, K.clear));
  if (free(pref[0], pref[1])) return pref;
  for (let r = s; r <= R; r += s) for (let k = 0; k < Math.max(8, Math.round(2 * Math.PI * r / s)); k++) { const a = k / Math.max(8, Math.round(2 * Math.PI * r / s)) * 2 * Math.PI, x = pref[0] + r * Math.cos(a), y = pref[1] + r * Math.sin(a); if (free(x, y)) return [r2(x), r2(y)]; }
  return pref;
}
export function boxOf(it) { return [it.x - it.sx / 2, it.y - it.sy / 2, it.z, it.x + it.sx / 2, it.y + it.sy / 2, it.z + it.sz]; }
export function layout(src, opts) {
  const o = opts || {}, d0 = withDefaults(normalize(src)), g = geo(d0);
  const keep = o.fresh ? {} : d0.pos;
  const items = [];
  ROLES.forEach(r => {
    if (!roleApplies(d0, r) || r.mount === 'none') return;
    const p = selected(d0, r.id); if (!p) return;
    const F = FORMS[d0.form], split = r.id === 'display' && !!F.foldable, np = r.pairs ? d0.hinge[r.pairs] : 0, cnt = r.count && r.mount !== 'hinge' ? r.count : 0;
    const ed = d0.dock, EDG = ['S', 'E', 'N', 'W'].filter(e => ed.edges[e]), dockCopies = r.mount === 'magEdge' ? EDG.flatMap(e => Array.from({ length: ed.perEdge }, (_, k) => ({ uid: 'dock_mag:' + e + k, edge: e, k }))) : r.mount === 'magBack' ? [0, 1, 2, 3].map(k => ({ uid: 'dock_back:' + k, k })) : r.mount === 'linkEdge' ? EDG.filter(e => ed.links[e]).map(e => ({ uid: 'dock_link:' + e, edge: e })) : r.mount === 'hallEdge' ? EDG.map(e => ({ uid: 'dock_hall:' + e, edge: e })) : null;
    const copies = dockCopies ? dockCopies : r.id === 'hinge' ? [{ uid: 'hinge' }, { uid: 'hinge#2' }] : split ? [{ uid: 'display' }, { uid: 'display#B', half: 'B' }] : np ? Array.from({ length: np }, (_, i) => [{ uid: r.id + (i ? '#' + (i + 1) : ''), half: 'A', pair: i }, { uid: r.id + '#B' + (i ? i + 1 : ''), half: 'B', pair: i }]).flat() : cnt ? Array.from({ length: cnt }, (_, i) => ({ uid: r.id + (i ? '#' + (i + 1) : '') })) : [{ uid: r.id }];
    copies.forEach(cp => { const uid = cp.uid, pz = keep[uid], mount = mountOf(d0, r, pz), stand = pz ? pz.stand : ['antTop', 'antBottom'].includes(r.mount) && !(fin(p.n.sz) && p.n.sz >= 0.4) && !(fin(p.n.sy) && p.n.sy > 6); const autoRot = !pz && p.cat.startsWith('cell') && F.axis === 'short' && (p.n.sy || 0) > g.il * 0.45 && (p.n.sy || 0) <= g.iw - 1, dm = dimsOf(p, pz ? pz.rot : autoRot ? 90 : 0, stand); r.bga && (dm.sx = r2(dm.sx + 2 * K.bgaRing), dm.sy = r2(dm.sy + 2 * K.bgaRing)); split && (F.axis === 'long' ? (dm.sx = r2(Math.min(dm.sx / 2, g.iw))) : (dm.sy = r2(Math.min(dm.sy / 2, g.il)))); const flat = r.mount === 'magFlat', book = F.axis === 'long', H = dm.sz, Lm = Math.max(dm.sx, dm.sy), Wm = Math.min(dm.sx, dm.sy); flat && Object.assign(dm, book ? { sx: H, sy: Lm, sz: Wm } : { sx: Lm, sy: H, sz: Wm }); const half = cp.half || (pz ? pz.half : null) || (F.halfOf && F.halfOf[r.id]) || r.half || 'A'; const sub = half === 'B' && ON_BOARD.has(mount), dockEW = cp.edge === 'E' || cp.edge === 'W'; (r.mount === 'magEdge' || r.mount === 'linkEdge') && (([L, W, H]) => Object.assign(dm, r.mount === 'magEdge' ? (dockEW ? { sx: H, sy: L, sz: W } : { sx: L, sy: H, sz: W }) : (dockEW ? { sx: W, sy: L } : { sx: L, sy: W })))([Math.max(dm.sx, dm.sy), Math.min(dm.sx, dm.sy), dm.sz]); items.push({ uid, sub, edge: cp.edge, k: cp.k, role: r.id, name: r.name.replace(/ \(×\d+\)/, '') + (uid === 'display#B' ? ' (half B)' : cp.half && np ? ' ' + (cp.pair + 1) + half : ''), pid: p.id, p, cat: p.cat, half, pair: cp.pair, mount: sub ? 'floor' : mount, rot: pz ? pz.rot : autoRot ? 90 : 0, stand, ...dm, x: pz && pz.x != null ? pz.x : 0, y: pz && pz.y != null ? pz.y : 0, zSet: pz ? pz.z : null, fixed: !!pz && pz.x != null && !np, lock: !!(pz && pz.lock), placed: !!(pz && pz.placed), metal: METAL.has(p.cat), magAx: r.mount === 'magShut' ? 2 : flat ? (book ? 0 : 1) : null, magSign: r.mount === 'magShut' ? (half === 'B' ? -1 : 1) : flat ? (book ? 1 : -1) : null }); });
  });
  const hw = g.iw / 2, hl = g.il / 2, dmE = items.find(i => i.mount === 'magEdge'), dbE = e => d0.dock.on && d0.dock.edges[e] && dmE ? Math.min(dmE.sx, dmE.sy) + 0.8 : 0;
  const disp = items.find(i => i.role === 'display');
  const hole = disp && disp.p.n.hole;
  const place = (it, x, y) => { it.fixed || (it.x = r2(x), it.y = r2(y)); };
  const fcam = items.find(i => i.role === 'cam_front'), bezel = disp && fcam && !hole;
  items.forEach(it => {
    const m = it.mount;
    m === 'display' ? place(it, 0, bezel ? -hl + it.sy / 2 + 0.3 : 0) : m === 'glass' ? place(it, 0, 0) : m === 'front' ? place(it, hole ? disp.x + hole.x : 0, hole ? disp.y + hole.y : bezel ? Math.min(hl - dbE('N') - it.sy / 2 - 0.3, disp.y + disp.sy / 2 + 0.6 + it.sy / 2) : hl - dbE('N') - it.sy / 2 - 1.5) : m === 'top' ? place(it, it.role === 'als' ? -9 : 12, hl - dbE('N') - it.sy / 2 - 0.4) : m === 'edgeBottom' ? place(it, 0, -hl + it.sy / 2 - 0.6) : m === 'edgeRight' ? place(it, hw - it.sx / 2 + 0.3, hl * ({ btn_power: -0.2, btn_up: 0.12, btn_down: -0.03 }[it.role] || 0)) : m === 'edgeLeft' ? place(it, -hw + it.sx / 2 - 0.3, hl * 0.3) : null;
  });
  const cams = items.filter(i => i.mount === 'back' && i.role !== 'fingerprint').sort((a, b) => (a.role === 'flash') - (b.role === 'flash'));
  const cy = hl - 5 - 0.6, outer = FORMS[d0.form].axis === 'long';
  cams.forEach((c, i) => { i === 0 ? place(c, outer ? -hw + 0.8 + c.sx / 2 : hw - 0.8 - c.sx / 2, cy - c.sy / 2) : place(c, cams[0].x, cams[i - 1].y - cams[i - 1].sy / 2 - 1 - c.sy / 2); });
  items.filter(i => i.role === 'fingerprint').forEach(i => place(i, 0, hl * 0.35));
  const antTop = items.filter(i => i.mount === 'antTop'), antBot = items.filter(i => i.mount === 'antBottom');
  const side = a => { a.fixed || a.rot || Object.assign(a, dimsOf(a.p, 90, a.stand), { rot: 90 }); };
  antTop.forEach((a, i) => { i && side(a); place(a, i === 0 ? -hw + a.sx / 2 + 1 : i === 1 ? -hw + a.sx / 2 + 0.2 : hw - a.sx / 2 - 0.2, i === 0 ? hl - a.sy / 2 - 0.2 : i === 1 ? hl * 0.45 : hl * 0.2); });
  antBot.forEach((a, i) => { side(a); place(a, i % 2 ? hw - a.sx / 2 - 0.2 : -hw + a.sx / 2 + 0.2, -hl * 0.45); });
  const board = { t: d0.board.t, z: 0, poly: null };
  const bottomH = Math.max(0.6, ...items.filter(i => i.mount === 'boardBottom' && i.half === 'A').map(i => i.sz));
  const cover = items.find(i => i.mount === 'backDisplay' && i.half === 'A');
  board.z = d0.board.z != null ? d0.board.z : r2(Math.max(g.floor, cover ? 0.05 + cover.sz : 0) + bottomH + 0.2);
  board.poly = autoBoard(d0, g, items, d0.board.poly);
  const polyBottom = Math.min(...board.poly.map(p => p[1]));
  const zoneB = bossZones(d0, g), bandTopOf = h => -hl + Math.max(h === 'A' ? 8 : 0, ...zoneB.filter(z => z.half === h && z.box[1] < 0).map(z => z.box[4] + hl), ...items.filter(i => i.half === h && (['usbc', 'speaker', 'haptic', 'mic'].includes(i.role) || i.mount === 'magBack')).map(i => i.sy + dbE('S'))) + 1.2;
  const bandTop = bandTopOf('A');
  items.forEach(it => {
    const r = it.role;
    r === 'speaker' ? place(it, -hw + it.sx / 2 + 1.2 + dbE('W'), -hl + it.sy / 2 + 0.6 + dbE('S')) : r === 'haptic' ? place(it, hw - it.sx / 2 - 1.2 - dbE('E'), -hl + it.sy / 2 + 1 + dbE('S')) : r === 'mic' && it.mount !== 'boardBottom' ? place(it, -6.5, -hl + it.sy / 2 + 0.4 + dbE('S')) : null;
  });
  items.filter(i => i.role === 'mic' && i.mount === 'boardBottom' && !i.fixed).forEach(i => { i.mount = 'floor'; place(i, -7, -hl + i.sy / 2 + 0.4 + dbE('S')); });
  g.axis === 'long' && items.filter(i => i.cat.startsWith('cell') && i.half === 'A' && !i.fixed && !(keep[i.uid] && keep[i.uid].half)).forEach(c => { if (c.sy <= polyBottom - 1.2 - bandTop) return; const other = items.find(i => i.cat.startsWith('cell') && i.half === 'B'); c.half = 'B'; other && !other.fixed && !(keep[other.uid] && keep[other.uid].half) && (other.half = 'A'); });
  const cellsA = items.filter(i => i.cat.startsWith('cell') && i.half === 'A'), cellsB = items.filter(i => i.cat.startsWith('cell') && i.half === 'B');
  cellsA.forEach(c => { const lo = bandTop + c.sy / 2, hi = polyBottom - 1.2 - c.sy / 2; const top = Math.min(hl - 1, ...cams.filter(cm => cm.half === 'A' && Math.abs(cm.x) < (cm.sx + c.sx) / 2 + 0.6).map(cm => cm.y - cm.sy / 2 - 0.6 - Math.max(K.swellMin, c.sz * K.swellFrac))); const y0 = clamp((polyBottom - 1.2 + bandTop) / 2, lo, hi); place(c, 0, y0 - c.sy / 2 >= -hl + 0.5 ? y0 : clamp((bandTop + top) / 2, Math.min(lo, -hl + 1 + c.sy / 2), Math.max(lo, top - c.sy / 2))); });
  cellsB.forEach(c => place(c, 0, clamp((bandTopOf('B') + hl - 6) / 2, bandTopOf('B') + c.sy / 2, hl - 6 - c.sy / 2)));
  items.filter(i => i.cat === 'qi_coil' || i.cat === 'nfc_coil').forEach((c, i) => { const cell = (c.half === 'B' ? cellsB : cellsA)[0]; place(c, cell ? cell.x : 0, cell ? cell.y + (i ? -cell.sy / 4 : cell.sy / 8) : 0); });
  items.filter(i => i.cat.startsWith('cell')).forEach(c => { const under = items.filter(i => (i.cat === 'qi_coil' || i.cat === 'nfc_coil') && i.half === c.half && Math.abs(i.x - c.x) < (i.sx + c.sx) / 2 && Math.abs(i.y - c.y) < (i.sy + c.sy) / 2); c.lift = under.length ? r2(Math.max(...under.map(u => u.sz)) + 0.1) : 0.1; });
  items.filter(i => i.mount === 'hinge').forEach((hg, i) => { g.axis === 'short' ? place(hg, (i ? -1 : 1) * (hw - hg.sx / 2 - 0.3), -hl + hg.sy / 2 + 0.3) : place(hg, hw + g.wall - hg.sx / 2 + 0.3, (i ? -1 : 1) * (hl - hg.sy / 2 - 4)); });
  const keys = items.filter(i => i.mount === 'keypad');
  keys.forEach((k, i) => place(k, (i % 4 - 1.5) * Math.min(14, (g.iw - 8) / 4), hl - 12 - Math.floor(i / 4) * Math.min(12, (g.il - 30) / 4)));
  cover && place(cover, 0, hl - (cams.length ? Math.max(...cams.map(c => hl - c.y + c.sy / 2)) + 1.5 : 2) - cover.sy / 2);
  const som = items.find(i => i.role === 'som') || items.find(i => i.role === 'soc');
  const bb = [Math.min(...board.poly.map(p => p[0])), Math.min(...board.poly.map(p => p[1])), Math.max(...board.poly.map(p => p[0])), Math.max(...board.poly.map(p => p[1]))];
  items.filter(i => i.mount === 'spreader').forEach(t => { t.sx = r2(Math.min(t.sx, bb[2] - bb[0] - 2)); t.sy = r2(Math.min(t.sy, bb[3] - bb[1] - 2)); place(t, (bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2); });
  if (d0.board.z == null) { const under = items.filter(i => i.half === 'A' && i.mount === 'floor' && i.x - i.sx / 2 < bb[2] && i.x + i.sx / 2 > bb[0] && i.y - i.sy / 2 < bb[3] && i.y + i.sy / 2 > bb[1]).map(i => g.floor + (i.lift || 0) + i.sz + (i.cat.startsWith('cell') ? Math.max(K.swellMin, i.sz * K.swellFrac) : 0) + K.clear); under.length && (board.z = r2(Math.max(board.z, Math.max(...under) + bottomH + 0.2))); }
  items.forEach(it => { it.z = it.zSet != null ? it.zSet : zFor(d0, it.half === 'B' ? g.B : g, it, board); it.box = boxOf(it); });
  keys.length && (top => keys.forEach(k => { k.zSet == null && (k.z = r2(top)); k.box = boxOf(k); }))(Math.max(g.floor, ...items.filter(i => i.half === 'B' && i.cat.startsWith('cell')).map(c => c.z + c.sz + Math.max(K.swellMin, c.sz * K.swellFrac) + 0.8)));
  disp && items.filter(i => i.mount === 'top' && i.zSet == null).forEach(i => { const gh = i.half === 'B' ? g.B : g, under = i.half === 'B' || overlap([...i.box.slice(0, 2), 0, ...i.box.slice(3, 5), 1], [...disp.box.slice(0, 2), 0, ...disp.box.slice(3, 5), 1], -1e-3); i.z = under ? gh.dispZ - i.sz - 0.05 : gh.t - gh.glassT - gh.adhT - i.sz; i.box = boxOf(i); });
  const boundsOk = it => (x, y) => { const b = [x - it.sx / 2, y - it.sy / 2, x + it.sx / 2, y + it.sy / 2]; return [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]].every(([px, py]) => inRounded(px, py, hw + (['edgeRight', 'edgeLeft', 'edgeBottom'].includes(it.mount) ? 1 : 0), hl + (it.mount === 'edgeBottom' ? 1 : 0), g.ir)) && (!ON_BOARD.has(it.mount) || rectInPoly(b[0], b[1], b[2], b[3], board.poly)); };
  placeDock(d0, g, items, hw, hl); items.forEach(it => { ['magEdge', 'magBack', 'linkEdge', 'hallEdge'].includes(it.mount) && (it.z = zFor(d0, it.half === 'B' ? g.B : g, it, board), it.box = boxOf(it)); });
  items.filter(it => !it.fixed && !['display', 'glass', 'spreader', 'hinge', 'front', 'magShut', 'magFlat', 'keypad', 'magEdge', 'magBack', 'linkEdge', 'hallEdge'].includes(it.mount)).forEach(it => { const isC = o => String(o.cat || '').startsWith('cell'), sw = K.swellSide - K.clear + 0.01, same = [...items.filter(o => o !== it && o.half === it.half && !['display', 'glass', 'spreader'].includes(o.mount) && o.box), ...zoneB.filter(z => z.half === it.half)].map(o => isC(o) || isC(it) ? { ...o, box: [o.box[0] - sw, o.box[1] - sw, o.box[2], o.box[3] + sw, o.box[4] + sw, o.box[5] + (isC(o) ? Math.max(K.swellMin, o.sz * K.swellFrac) : 0)] } : o); let [x, y] = freeSpot(it, same, boundsOk(it), [it.x, it.y], 0.5, 30); x === it.x && y === it.y && same.some(o => overlap(boxOf({ ...it, x, y }), o.box, -1e-3)) && ([x, y] = freeSpot(it, same, boundsOk(it), [it.x, it.y], 1, Math.max(g.iw, g.il))); it.x = x; it.y = y; it.box = boxOf(it); });
  placeMagnets(d0, g, items, hw, hl, board);
  const compass = items.find(i => i.role === 'mag' && !i.fixed && i.half === 'A' && ON_BOARD.has(i.mount)), mg = items.filter(i => i.cat === 'magnet');
  if (compass && mg.length) { const pb = board.poly, bx = [Math.min(...pb.map(p => p[0])), Math.min(...pb.map(p => p[1])), Math.max(...pb.map(p => p[0])), Math.max(...pb.map(p => p[1]))], pts = mg.map(m => m.half === 'A' ? [m.x, m.y] : g.axis === 'long' ? [-m.x, m.y] : [m.x, -m.y]); let best = null; for (let x = bx[0] + compass.sx / 2 + 0.4; x <= bx[2] - compass.sx / 2 - 0.4; x += 1.5) for (let y = bx[1] + compass.sy / 2 + 0.4; y <= bx[3] - compass.sy / 2 - 0.4; y += 1.5) { const c = { ...compass, x, y }, b0 = boxOf(c); if (!rectInPoly(b0[0] - 0.3, b0[1] - 0.3, b0[3] + 0.3, b0[4] + 0.3, pb) || items.some(o => o !== compass && o.half === 'A' && o.box && overlap(b0, o.box, K.clear))) continue; const dmin = Math.min(...pts.map(p => Math.hypot(p[0] - x, p[1] - y))); (!best || dmin > best[2]) && (best = [x, y, dmin]); } best && (compass.x = r2(best[0]), compass.y = r2(best[1]), compass.box = boxOf(compass)); }
  const bbx = [Math.min(...board.poly.map(p => p[0])), Math.min(...board.poly.map(p => p[1])), board.z, Math.max(...board.poly.map(p => p[0])), Math.max(...board.poly.map(p => p[1])), board.z + board.t];
  const solidsL = items.filter(i => !['display', 'glass', 'hinge', 'spreader'].includes(i.mount) && i.cat !== 'thermal');
  items.filter(i => i.cat === 'antenna' && !i.fixed).forEach(a => { const k = fin(a.p.n.keep) ? a.p.n.keep : K.antKeep, zone = [a.box[0] - k, a.box[1] - k, -1, a.box[3] + k, a.box[4] + k, 99]; const bad = solidsL.some(o => o !== a && o.half === a.half && o.metal && overlap(o.box, zone, -1e-3)) || (a.half === 'A' && overlap(bbx, zone, -1e-3) && polyHit({ box: zone }, board.poly)); const sp = bad && antennaSpot(a, solidsL, bbx, board.poly, g, k); sp && (Object.assign(a, dimsOf(a.p, sp.rot, a.stand), { x: sp.x, y: sp.y, rot: sp.rot }), a.box = boxOf(a)); });
  const pos = {};
  items.forEach(it => { pos[it.uid] = { x: it.x, y: it.y, z: it.zSet, rot: it.rot, half: it.half, mount: it.mount === ROLE[it.role].mount ? null : it.mount, stand: it.stand, lock: it.lock, placed: it.placed }; });
  return { d: { ...d0, pos, board: { ...d0.board, poly: board.poly } }, items, board, g };
}
export function bossZones(d, g) {
  const G = hingeGeom(d, g); if (!G || !G.outer) return [];
  const hw = g.iw / 2, hl = g.il / 2, depth = Math.max(0, K.pinEngage - g.wall) + 0.6, rr = G.pinD / 2 + 1, u = g.axis === 'long' ? g.w / 2 - G.inset : -(g.l / 2 - G.inset);
  return ['A', 'B'].flatMap(h => [-1, 1].map(sg => { const uu = h === 'A' ? u : -u, gh = h === 'B' ? g.B : g, pz = h === 'B' ? G.pinZB : G.pinZ, z0 = Math.max(g.floor, pz - rr), z1 = Math.min(gh.cavTop, pz + rr); return { half: h, id: 'boss-' + h + (sg > 0 ? 'p' : 'n'), box: g.axis === 'long' ? [uu - rr, sg > 0 ? hl - depth : -hl, z0, uu + rr, sg > 0 ? hl : -hl + depth, z1] : [sg > 0 ? hw - depth : -hw, uu - rr, z0, sg > 0 ? hw : -hw + depth, uu + rr, z1] }; }));
}
export function dockPolarity(d, edge, k) { const n = d.dock.perEdge, p = DOCK_CODES[d.dock.code].seq(n)[k]; return p; }
function placeDock(d, g, items, hw, hl) {
  const span = e => (e === 'E' || e === 'W' ? 2 * hl : 2 * hw) - 2 * Math.max(5, g.ir + 1), n = d.dock.perEdge;
  const obst = items.filter(o => o.box && !['magEdge', 'magBack', 'linkEdge', 'hallEdge', 'display', 'glass', 'spreader'].includes(o.mount) && ['front', 'top', 'back', 'edgeBottom', 'edgeRight', 'edgeLeft', 'antTop', 'antBottom'].includes(o.mount)), done = [];
  const mags = items.filter(i => i.mount === 'magEdge'), at = (m, s) => { const H = m.edge === 'E' || m.edge === 'W' ? m.sx : m.sy; m.edge === 'S' ? (m.x = r2(s), m.y = r2(-hl + H / 2 + 0.2)) : m.edge === 'E' ? (m.x = r2(hw - H / 2 - 0.2), m.y = r2(s)) : m.edge === 'N' ? (m.x = r2(-s), m.y = r2(hl - H / 2 - 0.2)) : (m.x = r2(-hw + H / 2 + 0.2), m.y = r2(-s)); m.box = boxOf(m); }, s0 = m => { const L = span(m.edge); return -L / 2 + (m.k + 0.5) * L / n; }, free = m => !obst.some(o => o.half === m.half && overlap(m.box, o.box, K.clear)) && !done.some(o => o !== m && o.half === m.half && overlap(m.box, o.box, K.clear)), OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
  mags.forEach(m => { const p = dockPolarity(d, m.edge, m.k); m.pol = p; m.magAx = m.edge === 'E' || m.edge === 'W' ? 0 : 1; m.magSign = m.edge === 'E' || m.edge === 'N' ? p : -p; m.z == null && (m.z = Math.max(g.floor, (g.floor + g.cavTop) / 2 - m.sz / 2)); });
  mags.filter(m => m.edge === 'N' || m.edge === 'E' || !mags.some(o => o.half === m.half && o.edge === OPP[m.edge])).forEach(m => { const o = mags.find(q => q.half === m.half && q.edge === OPP[m.edge] && q.k === n - 1 - m.k); let ok = false; for (const off of [0, 1, -1, 2, -2, 3, -3, 4, -4, 6, -6, 8, -8, 10, -10]) { at(m, s0(m) + off); o && at(o, s0(o) - off); if (free(m) && (!o || free(o))) { ok = true; break; } } ok || (at(m, s0(m)), o && at(o, s0(o))); done.push(m); o && done.push(o); });
  const PB = [1, -1, 1, -1];
  const dm0 = mags[0], db = dm0 ? Math.min(dm0.sx, dm0.sy) + 0.8 : 0;
  items.filter(i => i.mount === 'magBack').forEach(m => { const cx = [-1, 1, 1, -1][m.k], cy = [1, 1, -1, -1][m.k]; m.x = r2(cx * hw * 0.38); m.y = r2(cy * (hl - (d.dock.edges[cy > 0 ? 'N' : 'S'] ? db : 0) - m.sy / 2 - 0.5)); m.pol = PB[m.k]; m.magAx = 2; m.magSign = -PB[m.k]; });
  items.filter(i => i.mount === 'linkEdge').forEach(m => { const H = m.edge === 'E' || m.edge === 'W' ? m.sx : m.sy; m.edge === 'S' ? (m.x = 0, m.y = r2(-hl + H / 2 + 0.2)) : m.edge === 'E' ? (m.x = r2(hw - H / 2 - 0.2), m.y = 0) : m.edge === 'N' ? (m.x = 0, m.y = r2(hl - H / 2 - 0.2)) : (m.x = r2(-hw + H / 2 + 0.2), m.y = 0); m.box = boxOf(m); });
  const hit2 = (a, b) => a[0] < b[3] + K.clear && b[0] < a[3] + K.clear && a[1] < b[4] + K.clear && b[1] < a[4] + K.clear;
  items.filter(i => i.mount === 'hallEdge').forEach(m => { const L = span(m.edge), sh0 = -L / 2 + L / n, H = Math.max(m.sx, m.sy) / 2 + 0.3, put = sh => { m.edge === 'S' ? (m.x = r2(sh), m.y = r2(-hl + H)) : m.edge === 'E' ? (m.x = r2(hw - H), m.y = r2(sh)) : m.edge === 'N' ? (m.x = r2(-sh), m.y = r2(hl - H)) : (m.x = r2(-hw + H), m.y = r2(-sh)); m.box = [m.x - m.sx / 2, m.y - m.sy / 2, 0, m.x + m.sx / 2, m.y + m.sy / 2, 1]; }, cands = Array.from({ length: Math.floor(L / 0.25) + 1 }, (_, k) => -L / 2 + k * 0.25).sort((a, b) => Math.abs(a - sh0) - Math.abs(b - sh0)), ok = cands.find(sh => (put(sh), !mags.concat(obst, items.filter(i => i.mount === 'linkEdge')).some(o => o.half === m.half && o.box && hit2(m.box, o.box)))); put(ok == null ? sh0 : ok); });
}
function placeMagnets(d, g, items, hw, hl, board) {
  const mags = items.filter(i => i.mount === 'magShut' || i.mount === 'magFlat'); if (!mags.length) return;
  const bb = [Math.min(...board.poly.map(p => p[0])), Math.min(...board.poly.map(p => p[1])), board.z - 0.01, Math.max(...board.poly.map(p => p[0])), Math.max(...board.poly.map(p => p[1])), board.z + board.t];
  const book = g.axis === 'long', zones = bossZones(d, g), placed = [];
  const mirror = (x, y) => book ? [-x, y] : [x, -y];
  const free = (it, h, x, y) => { const b = [x - it.sx / 2, y - it.sy / 2, it.z, x + it.sx / 2, y + it.sy / 2, it.z + it.sz]; return [[b[0], b[1]], [b[3], b[1]], [b[3], b[4]], [b[0], b[4]]].every(([px, py]) => inRounded(px, py, hw, hl, g.ir)) && !items.some(o => o !== it && o.half === h && o.box && !['display', 'glass', 'spreader', 'magShut', 'magFlat'].includes(o.mount) && overlap(b, o.box, K.clear)) && !placed.some(o => o.half === h && overlap(b, o.box, K.clear + 0.5)) && !zones.some(zn => zn.half === h && overlap(b, zn.box, K.clear)) && !(h === 'A' && overlap(b, bb, K.clear) && polyHit({ box: b }, board.poly)); };
  ['magShut', 'magFlat'].forEach(mt => { const A = mags.filter(m => m.mount === mt && m.half === 'A').sort((a, b) => a.pair - b.pair); A.forEach(a => { const b = mags.find(m => m.mount === mt && m.half === 'B' && m.pair === a.pair); a.z = zFor(d, g, a, { z: 0, t: 0 }); b && (b.z = zFor(d, g.B, b, { z: 0, t: 0 })); const span = (book ? hl - a.sy / 2 : hw - a.sx / 2) - 0.4, side = a.pair % 2 ? -1 : 1, edge = mt === 'magShut' ? (book ? [-hw + a.sx / 2 + 0.4, null] : [null, hl - a.sy / 2 - 0.4]) : (book ? [hw - a.sx / 2 - 0.3, null] : [null, -hl + a.sy / 2 + 0.3]); let spot = null; for (let off = 0; !spot && off <= 2 * span; off += 0.5) { const t = side * (span - off - Math.floor(a.pair / 2) * 0.01); for (const inward of [0, 2, 4, 6, 8, 10]) { const x = book ? edge[0] + (mt === 'magShut' ? inward : -inward) : t, y = book ? t : edge[1] + (mt === 'magShut' ? -inward : inward); const m = mirror(x, y); if (free(a, 'A', x, y) && (!b || free(b, 'B', m[0], m[1]))) { spot = [x, y]; break; } } } spot = spot || (book ? [edge[0], side * span] : [side * span, edge[1]]); a.x = r2(spot[0]); a.y = r2(spot[1]); a.box = boxOf(a); placed.push(a); if (b) { const m = mirror(a.x, a.y); b.x = r2(m[0]); b.y = r2(m[1]); b.box = boxOf(b); placed.push(b); } }); });
}
const BETA = [[1, 0.2874], [1.2, 0.3762], [1.4, 0.453], [1.6, 0.5172], [1.8, 0.5688], [2, 0.6102], [3, 0.7134], [4, 0.741], [5, 0.7476], [99, 0.75]];
export const plateBeta = r => { for (let i = 1; i < BETA.length; i++) if (r <= BETA[i][0]) { const [a0, b0] = BETA[i - 1], [a1, b1] = BETA[i]; return b0 + (b1 - b0) * (Math.max(r, 1) - a0) / (a1 - a0); } return 0.75; };
export function depthModel(d, g, items, ip) {
  const rho = 1025 * 9.81, a = Math.max(g.iw, g.il), b = Math.min(g.iw, g.il), beta = plateBeta(a / b), depthOf = (sigma, t) => sigma * 1e6 * (t / 1000) ** 2 / (beta * (b / 1000) ** 2) / rho;
  const backT = g.back === 'unibody' ? g.floor : BACKS[g.back].t, backSy = g.back === 'unibody' ? MATERIALS[g.mat].sy / 1.5 : g.back === 'glass' ? 250 : 40;
  const rows = [{ part: 'Cover glass ' + g.glassT + ' mm over a ' + b.toFixed(0) + ' × ' + a.toFixed(0) + ' mm span', m: depthOf(250, g.glassT), basis: 'Roark simply-supported plate, β ' + beta.toFixed(3) + ', 250 MPa allowable (⅓ of chemically strengthened glass strength)' }, { part: (g.back === 'unibody' ? MATERIALS[g.mat].name + ' back ' : BACKS[g.back].name + ' ') + backT + ' mm', m: depthOf(backSy, backT), basis: g.back === 'unibody' ? 'yield ÷ 1.5' : 'allowable stress' }];
  const struct = Math.min(rows[0].m, rows[1].m);
  ip.openings.filter(o => o.ok && o.level >= 8).forEach(o => { const ps = o.parts.map(u => items.find(i => i.uid === u)).filter(Boolean), bonded = ['display', 'back', 'camera'].includes(o.id) && !o.selfRated, ds = bonded ? [] : ps.map(i => i.p.n.depthM).filter(fin), tac = o.tactic; rows.push({ part: o.name + (bonded && tac ? ' (' + tac.name + ')' : ps.length ? ' (' + [...new Set(ps.map(i => i.p.mpn))].join(', ') + ')' : tac ? ' (' + tac.name + ')' : ''), m: bonded ? struct : ds.length ? Math.min(...ds) : o.id === 'pins' || o.id === 'flex' ? 50 : 1.5, basis: bonded ? 'bond line loaded in compression; set by the panel it seals (verify with a pressure-decay test to depth)' : ds.length ? 'part datasheet depth rating' : o.id === 'pins' || o.id === 'flex' ? 'no opening (blind bore / contactless)' : 'no depth published: IPX8 declared 1.5 m assumed' }); });
  ip.openings.filter(o => !o.ok || o.level < 8).forEach(o => rows.push({ part: o.name, m: o.level >= 7 ? 1 : 0, basis: o.level >= 7 ? 'IPX7 (1 m, 30 min)' : 'not sealed for immersion' }));
  const worst = rows.reduce((x, y) => y.m < x.m ? y : x, rows[0]);
  return { rows: rows.map(r => ({ ...r, m: Math.round(r.m * 10) / 10 })), depth: Math.round(worst.m * 10) / 10, limit: worst.part };
}
export function thermalBudget(areaM2, eff, spread, skin) { return K.hConv * areaM2 * (skin - K.tAmb) * eff * spread * K.holdFactor; }
export function uSection(mat, w, T, wall, floor, unibody) {
  const parts = [[wall, T, T / 2], [wall, T, T / 2], ...(unibody ? [[w - 2 * wall, floor, floor / 2]] : [])];
  const A = parts.reduce((n, [b, h]) => n + b * h, 0), zc = parts.reduce((n, [b, h, z]) => n + b * h * z, 0) / A;
  const I = parts.reduce((n, [b, h, z]) => n + b * h * h * h / 12 + b * h * (z - zc) ** 2, 0), c = Math.max(zc, T - zc);
  return { I, c, zc, Myield: MATERIALS[mat].sy * I / c };
}
export function bendForce(mat, w, T, wall, floor, unibody, span) { return 4 * uSection(mat, w, T, wall, floor, unibody).Myield / span; }
export const BEND_REF = bendForce('al6061', 77.8, 7.1, 1.0, 0, false, 0.8 * 158.1);
function housingVolume(g, t) {
  const ra = (w, l, r) => w * l - (4 - Math.PI) * r * r, T = t == null ? g.t : t;
  return (ra(g.w, g.l, g.r) * T - ra(g.iw, g.il, g.ir) * (T - g.floor)) / 1000;
}
export function evaluate(src, opts) {
  const o = opts || {}, L = layout(src, o), d = L.d, g = L.g, items = L.items, board = L.board;
  const q = d.req, qty = q.qty, n = id => ((items.find(i => i.role === id) || {}).p || {}).n || {};
  const sel = id => items.find(i => i.role === id);
  const partsAll = ROLES.filter(r => roleApplies(d, r)).map(r => ({ r, p: selected(d, r.id) })).filter(x => x.p);
  const cells = items.filter(i => i.cat === 'cell' || i.cat === 'cell_custom');
  const whOf = c => fin(c.p.n.wh) ? c.p.n.wh : fin(c.p.n.mah) && fin(c.p.n.vnom) ? c.p.n.mah * c.p.n.vnom / 1000 : 0;
  const wh = cells.reduce((s, c) => s + whOf(c), 0);
  const est = [];
  const pw = (id, key, fallback, basis) => { const v = n(id)[key]; if (fin(v)) return { w: v, basis: 'datasheet' }; if (!sel(id)) return { w: 0, basis: 'not fitted' }; est.push(id + '.' + key); return { w: fallback, basis }; };
  const disp = sel('display'), disp2 = sel('display2');
  const diag = x => x ? (fin(x.p.n.diag) ? x.p.n.diag : Math.hypot(x.sx, x.sy) / 25.4) : 0;
  const dispW = x => x ? (fin(x.p.n.wTyp) ? { w: x.p.n.wTyp, basis: 'datasheet' } : (est.push(x.role + '.power'), { w: EST.displayW.perIn2 * diag(x) ** 2, basis: EST.displayW.basis })) : { w: 0, basis: 'not fitted' };
  const USE = { cellular: 0.5, camera: 0.1, gnss: 0.15 };
  const dW = dispW(disp), d2W = dispW(disp2);
  const SOMR = items.some(i => i.role === 'soc') ? 'soc' : items.some(i => i.role === 'mcu') ? 'mcu' : 'som', somN = n(SOMR);
  const rows = [
    { id: 'display', name: 'Display', w: dW.w + d2W.w * 0.5, basis: dW.basis + (disp2 ? '; second screen on half the time' : '') },
    { id: 'som', name: SOMR === 'soc' ? 'SoC + LPDDR + UFS' : 'Compute module', ...pw(SOMR, 'wTyp', SOMR === 'soc' ? 1.3 : 1, SOMR === 'soc' ? 'Placeholder 1.3 W: SoC + memory typical screen-on power not published' : 'Placeholder 1 W: no datasheet typical power for this module') },
    { id: 'modem', name: 'Cellular (' + USE.cellular * 100 + '% of screen-on time)', w: somN.hasModem ? (fin(somN.wModem) ? somN.wModem : 0.6) * USE.cellular : pw('modem', 'wTyp', 0.6, 'No datasheet active power: 0.6 W placeholder').w * USE.cellular, basis: somN.hasModem ? 'integrated modem' : fin(n('modem').wTyp) ? 'datasheet × duty' : 'placeholder × duty' },
    { id: 'wifi', name: 'Wi-Fi (' + (1 - USE.cellular) * 100 + '%)', w: pw('wifi', 'wTyp', 0.25, 'No datasheet figure: 0.25 W placeholder').w * (1 - USE.cellular), basis: fin(n('wifi').wTyp) ? 'datasheet × duty' : sel('wifi') ? 'placeholder × duty' : 'integrated / not fitted' },
    { id: 'camera', name: 'Cameras (' + USE.camera * 100 + '%)', w: items.filter(i => i.cat === 'camera').reduce((s, c) => s + (fin(c.p.n.wTyp) ? c.p.n.wTyp : EST.cameraW.w), 0) * USE.camera, basis: items.filter(i => i.cat === 'camera').every(c => fin(c.p.n.wTyp)) ? 'datasheet × duty' : EST.cameraW.basis + ' × duty' },
    { id: 'gnss', name: 'GNSS (' + USE.gnss * 100 + '%)', w: pw('gnss', 'wTyp', 0.05, 'placeholder').w * USE.gnss, basis: fin(n('gnss').wTyp) ? 'datasheet × duty' : 'placeholder × duty' },
    { id: 'base', name: 'Sensors, audio, regulators', w: EST.baseW.w, basis: EST.baseW.basis },
  ];
  const pOn = rows.reduce((s, r) => s + r.w, 0);
  const idleRows = [[SOMR, 'mwIdle', 15], ['modem', 'mwIdle', 12], ['wifi', 'mwIdle', 2], ['gnss', 'mwIdle', 0]].map(([id, k, def]) => ({ id, mw: sel(id) ? (fin(n(id)[k]) ? n(id)[k] : def) : 0, basis: sel(id) ? (fin(n(id)[k]) ? 'datasheet' : 'placeholder') : 'not fitted' })).concat([{ id: 'base', mw: EST.idleMW.mw, basis: EST.idleMW.basis }]);
  const pIdle = idleRows.reduce((s, r) => s + r.mw, 0) / 1000;
  const power = { rows, pOn, idleRows, pIdle, wh, sot: wh && pOn ? wh * K.usable / pOn : 0, standby: wh && pIdle ? wh * K.usable / pIdle / 24 : 0, usage: USE };
  const mat = MATERIALS[g.mat], th = sel('thermal');
  const areaHalf = (2 * g.w * g.l + 2 * g.t * (g.w + g.l)) / 1e6, area = areaHalf * (g.halves > 1 ? 1 + K.bridge : 1);
  const eff = th ? (th.p.n.kind === 'vc' ? 0.75 : 0.6) : 0.45, spread = mat.metal ? (mat.k > 100 ? 1 : 0.9) : 0.8;
  const psus = thermalBudget(area, eff, spread, q.skin);
  const somMax = fin(somN.wMax) ? somN.wMax : null;
  const socAvail = Math.max(0.2, psus - dW.w - EST.baseW.w);
  const therm = { area, eff, spread, psus, socAvail, somMax, frac: somMax ? clamp((socAvail / somMax) ** K.perfExp, 0, 1) : null, basis: somMax ? 'SoM max power from datasheet' : 'SoM max power not published' };
  const massRows = [];
  const massOf = it => { const nn = it.p.n; if (fin(nn.mass)) return { g: nn.mass, est: false }; const dens = it.cat.startsWith('cell') ? K.estDensity.cell : it.cat.startsWith('display') ? K.estDensity.display : ['hinge', 'usbc', 'button', 'sim', 'shield'].includes(it.cat) ? K.estDensity.mech : ['cover_glass'].includes(it.cat) ? K.glassRho : ['antenna', 'thermal', 'nfc_coil'].includes(it.cat) ? 1.4 : K.estDensity.module; return { g: it.sx * it.sy * it.sz / 1000 * dens, est: true }; };
  items.forEach(it => { const m = it.cat === 'cover_glass' ? { g: (g.w - 0.8) * (g.l - 0.8) * g.glassT / 1000 * K.glassRho, est: false } : massOf(it); massRows.push({ id: it.uid, name: it.name, g: m.g * (it.cat === 'cover_glass' ? g.halves : 1), est: m.est, x: it.x, y: it.y, z: it.z + it.sz / 2, half: it.half }); });
  const housingG = (housingVolume(g) + (g.halves > 1 ? housingVolume(g, g.B.t) : 0)) * mat.rho + (g.back !== 'unibody' ? g.iw * g.il * BACKS[g.back].t / 1000 * BACKS[g.back].rho * g.halves : 0);
  massRows.push({ id: 'housing', name: mat.name + ' housing', g: housingG, est: false, x: 0, y: 0, z: g.t / 2, half: 'A' });
  massRows.push({ id: 'board', name: 'Carrier PCB', g: polyArea(board.poly) * board.t / 1000 * K.boardRho, est: false, x: 0, y: board.poly.reduce((s, p) => s + p[1], 0) / board.poly.length, z: board.z, half: 'A' });
  const G = hingeGeom(d, g), noneP = id => selected(d, id), cntOf = id => (ROLE[id].count || 1);
  G && ['hinge_leaf', 'hinge_pin', 'hinge_detent', 'hinge_fold', 'link'].forEach(id => { const p = noneP(id); if (!p) return; const est = !fin(p.n.mass), gEach = est ? (id === 'hinge_leaf' ? (G.leaf + G.leafW) * G.leafW * G.leafT / 1000 * G.leafMat.rho : id === 'hinge_fold' ? 12 : 0.3) : p.n.mass; massRows.push({ id, name: ROLE[id].name, g: gEach * cntOf(id), est, x: g.axis === 'long' ? g.w / 2 : 0, y: g.axis === 'short' ? -g.l / 2 : 0, z: g.t / 2, half: 'A' }); });
  const mass = massRows.reduce((s, r) => s + r.g, 0);
  const halfMass = { A: massRows.reduce((s, r) => s + (r.half === 'B' ? 0 : r.id === 'housing' ? r.g / g.halves : r.g), 0), B: massRows.reduce((s, r) => s + (r.half === 'B' ? r.g : r.id === 'housing' && g.halves > 1 ? r.g / 2 : 0), 0) };
  const bumpOf = h => { const bs = items.filter(i => i.half === h && i.mount === 'back'), dep = Math.max(0, ...bs.map(i => i.z + i.sz - g.cavTop)); if (!bs.length || dep < 0.01 || !G) return null; const us = bs.flatMap(i => G.book ? [i.box[0], i.box[3]] : [-i.box[4], -i.box[1]]); return { u0: Math.min(...us) - 1.6, u1: Math.max(...us) + 1.6, depth: dep + 0.5 }; };
  const sw = G ? swing(G, g.fillet, { A: bumpOf('A'), B: bumpOf('B') }) : null;
  const magnets = G || d.dock.on ? magnetStudy(d, g, G, items, halfMass) : null, loads = G ? hingeLoads(G, halfMass, noneP('hinge_detent') && { p: noneP('hinge_detent') }) : null, link = G ? linkStudy(d, G, items, noneP('link') && { p: noneP('link') }, sw) : null;
  const leafOut = G && G.outer ? 2 * (G.leafT + 0.3) : 0, dims = G ? { shut: G.book ? [g.w, g.l + leafOut, g.t + g.B.t + Math.max(0, G.shutGap)] : [g.w + leafOut, g.l, g.t + g.B.t + Math.max(0, G.shutGap)], open: G.book ? [2 * g.w + G.flatGap, g.l + leafOut, Math.max(g.t, g.B.t)] : [g.w + leafOut, 2 * g.l + G.flatGap, Math.max(g.t, g.B.t)] } : { shut: [g.w, g.l, g.t], open: null };
  const cog = ['x', 'y', 'z'].map(k => massRows.reduce((s, r) => s + r.g * (r[k] + (k === 'x' && r.half === 'B' ? g.w : 0)), 0) / mass);
  const bendN = bendForce(g.mat, g.w, g.t, g.wall, g.floor, g.back === 'unibody', 0.8 * g.l);
  const hinge = sel('hinge');
  const struct = { bendN, bendRef: BEND_REF, ratio: bendN / BEND_REF, cycles: hinge && fin(hinge.p.n.cycles) ? hinge.p.n.cycles : null };
  const cost = costModel(d, items, board, g, partsAll);
  const ip = ipModel(d, items), depth = depthModel(d, g, items, ip);
  const fitOf = h => { const gh = h === 'B' ? g.B : g, inner = items.filter(i => i.half === h && !['display', 'glass', 'hinge', 'front', 'top', 'spreader', 'back', 'edgeRight', 'edgeLeft', 'backDisplay', 'magShut'].includes(i.mount)), over = gh.dispT + g.adhT + g.glassT + K.gapDisplay + Math.max(0, ...items.filter(i => i.half === h && i.mount === 'spreader').map(i => i.sz)); return Math.ceil(Math.max(g.floor + 1, ...inner.map(i => i.z + i.sz + (i.cat.startsWith('cell') ? Math.max(K.swellMin, i.sz * K.swellFrac) : 0))) * 20 + over * 20 - 1e-6) / 20; };
  const tFitA = fitOf('A'), tFitB = g.halves > 1 ? fitOf('B') : null, tFit = g.halves > 1 && d.housing.tB == null ? Math.max(tFitA, tFitB) : tFitA;
  const checks = runChecks(d, L, { power, therm, mass, struct, cost, ip, wh, est, tFit, G, sw, magnets, loads, link, halfMass, depth }, o.fixes !== false);
  const cam = items.filter(i => i.cat === 'camera');
  const camScore = cam.length ? Math.round(cam.reduce((s, c) => s + (fin(c.p.n.fmtDiag) ? c.p.n.fmtDiag : 5) * 4 + (fin(c.p.n.mp) ? Math.min(20, c.p.n.mp / 3) : 0) + (c.p.n.af ? 6 : 0) + (c.p.n.ois ? 6 : 0), 0)) : 0;
  const bump = Math.max(0, ...items.filter(i => i.mount === 'back').map(i => i.z + i.sz - g.cavTop));
  const perfProxy = fin(somN.perf) ? somN.perf * (therm.frac == null ? 1 : therm.frac) : null;
  const screenScore = Math.round(items.filter(i => (i.cat === 'display' || i.cat === 'display_ref') && i.role !== 'display_cover').reduce((s, i) => { const n = i.p.n, aw = n.aw || Math.max(0, i.sx - 2), ah = n.ah || Math.max(0, i.sy - 4), oled = /oled|amoled/i.test(String((i.p.specs || {}).panel_type || i.p.name)); return s + aw * ah / 100 * (0.5 + 0.5 * Math.min(fin(n.ppi) ? n.ppi : 300, 460) / 460) * (oled ? 1.15 : 1) * (n.ltpo ? 1.1 : 1) * (n.touch ? 1 : 0.6); }, 0) * 10) / 10;
  const obj = { cost: cost.unit, life: power.sot, mass, thick: dims.shut[2], perf: perfProxy || 0, camera: camScore, screen: screenScore, durability: Math.round(clamp(struct.ratio / 3, 0, 1) * 60 + IP_LEVELS[ip.achieved].n * 5), rfq: cost.rows.filter(r => r.usd == null).length };
  const out = { depth, d, g, items, board, tFit, tFitA, tFitB, power, therm, massRows, mass, halfMass, cog, struct, cost, ip, checks, bump, camScore, obj, est, G, sw, magnets, loads, link, dims, errors: checks.filter(c => c.sev === 'error').length, warns: checks.filter(c => c.sev === 'warn').length, buildable: !partsAll.some(x => x.p.status === 'oem') && FORMS[d.form].buildable && (!G || G.buildable) };
  if (!d.system) return out;
  const rB = d.system.arch === 'companion' && d.system.B ? evaluate(d.system.B, { fixes: false }) : null, sys = systemStudy(d, out, rB);
  out.system = sys; out.resB = rB;
  const sc = (rB || out).obj, np = sys.pieces, add2 = (sev, id, title, text, uids) => out.checks.push({ sev, id, title, text, fix: null, uids: uids || [] });
  rB && rB.checks.filter(c => c.sev !== 'info').forEach(c => add2(c.sev, 'B:' + c.id, 'Piece B: ' + c.title, c.text));
  sys.clash.forEach(([i, j]) => add2('error', 'tile-clash-' + i + '-' + j, `Pieces ${i + 1} and ${j + 1} overlap`, 'Two pieces occupy the same space in this arrangement.'));
  const wN = Math.min(out.mass, (rB || out).mass) * 9.81e-3;
  sys.contacts.forEach(c => { const tag = `${c.i + 1}–${c.j + 1}`; c.repel > 0 && c.attract === 0 ? add2('error', 'dock-repel-' + tag, `Pieces ${tag} repel`, `${c.repel} facing magnet pairs repel in this orientation (net ${c.net.toFixed(2)} N). The polarity code makes this pairing push apart.`) : c.net < wN ? add2('warn', 'dock-weak-' + tag, `Pieces ${tag} dock weakly`, `Net magnet pull ${c.net.toFixed(2)} N (${c.attract} attracting, ${c.repel} repelling pairs) vs ${wN.toFixed(2)} N to hold the lighter piece's weight.`) : add2('info', 'dock-ok-' + tag, `Pieces ${tag} snap together`, `${c.attract} attracting pairs, net ${c.net.toFixed(2)} N.`); c.kind === 'edge' && !c.link && add2('warn', 'dock-nolink-' + tag, `No link on the ${tag} contact`, 'Neither touching edge carries a dock link: no power or data across this contact (BLE/UWB only).'); c.link && c.tol != null && c.link.dist > c.tol + 0.2 && add2('warn', 'dock-align-' + tag, `Dock contacts misaligned ${tag}`, `Link centres ${c.link.dist} mm apart vs ≈${c.tol} mm pad tolerance.`); c.halls.forEach((h, k) => h && h.op != null && h.neighbour < h.op && add2('warn', 'dock-hall-' + tag + k, `Piece ${k ? c.j + 1 : c.i + 1} cannot sense piece ${k ? c.i + 1 : c.j + 1}`, `${Math.round(h.neighbour)} µT from the neighbour at the dock sensor vs ${Math.round(h.op)} µT operate point.`)); });
  sys.occl.length && add2('info', 'tile-occluded', 'Cameras covered in this arrangement', sys.occl.map(o => `piece ${o.tile + 1} ${o.name}`).join(', ') + '.');
  out.obj = { ...out.obj, cost: sys.cost, mass: sys.mass, life: sys.modes.carry, thick: sys.thickCarry, camera: Math.max(out.obj.camera, sc.camera) + Math.round(Math.min(out.obj.camera, sc.camera) * 0.25), screen: Math.round((out.obj.screen + sc.screen * (np - 1)) * 10) / 10, durability: Math.min(out.obj.durability, sc.durability), rfq: out.obj.rfq + (rB ? rB.obj.rfq : 0) };
  out.errors = out.checks.filter(c => c.sev === 'error').length; out.warns = out.checks.filter(c => c.sev === 'warn').length; out.buildable = out.buildable && (!rB || rB.buildable);
  return out;
}
export function costModel(d, items, board, g, partsAll) {
  const qty = d.req.qty, rows = [];
  const cnt = ids => items.filter(i => ids.includes(i.role)).length, count = r => r.pairs ? 2 * d.hinge[r.pairs] : r.count ? r.count : r.id === 'vent_mic' ? Math.max(1, cnt(['mic', 'mic2'])) : r.id === 'vent_spk' ? Math.max(1, cnt(['speaker', 'receiver'])) : r.id === 'gasket' ? Math.max(1, cnt(['btn_power', 'btn_up', 'btn_down'])) : 1;
  partsAll.forEach(({ r, p }) => { const pr = priceAt(p, qty); rows.push({ role: r.id, name: r.name, pid: p.id, mfr: p.mfr, mpn: p.mpn, status: p.status, qty: count(r), usd: pr.usd, basis: pr.basis, ext: pr.usd == null ? null : pr.usd * count(r) }); });
  const fab = fabRows(d, g, board, items, qty);
  const all = rows.concat(fab), known = all.filter(r => r.ext != null), unknown = all.filter(r => r.ext == null);
  const parts = rows.reduce((s, r) => s + (r.ext || 0), 0), fabSum = fab.reduce((s, r) => s + (r.ext || 0), 0);
  const unit = parts + fabSum;
  return { rows, fab, parts, fabSum, unit, known: known.length, unknown: unknown.length, unknownRows: unknown, retail: unit / (1 - d.req.margin), qty };
}
export function fabRows(d, g, board, items, qty) {
  const out = [], P = id => part(id), row = (role, name, p, usd, basis, n) => out.push({ role, name, pid: p ? p.id : '', mfr: p ? p.mfr : '', mpn: p ? p.mpn : '', status: p ? p.status : 'rfq', qty: n || 1, usd, basis, ext: usd == null ? null : usd * (n || 1) });
  const bm = P('hdi-pcb-price-benchmark'), area = polyArea(board.poly), tier = qty >= 1000 ? 'q1000' : qty >= 100 ? 'q100' : 'q10';
  const rng = bm && bm.specs && bm.specs.hdi_1n1_staggered_per_pc_usd && bm.specs.hdi_1n1_staggered_per_pc_usd[tier];
  row('fab-pcb', 'Carrier PCB fabrication (HDI 1+N+1)', bm, rng ? r2((rng[0] + rng[1]) / 2 * Math.max(0.3, area / 10000)) : null, rng ? `Per-piece HDI 1+N+1 benchmark (100×100 mm, ${tier}${qty < 10 ? ', q10 used for qty ' + qty : ''}) × board area ${Math.round(area)} mm² / 10,000 mm²` : 'no benchmark in data');
  const pa = P('jlcpcb-pcba'), ps = (pa && pa.specs) || {}, som = items.find(i => i.role === 'som') || items.find(i => i.role === 'soc'), pads = (som && som.p.specs && som.p.specs.balls) || (som && som.p.specs && som.p.specs.lga_pad_count) || 400, nb = items.filter(i => i.mount === 'boardTop' || i.mount === 'boardBottom').length, joints = pads + nb * 12 + 250;
  row('fab-pcba', 'Board assembly (SMT, double-sided)', pa, pa ? r2(((ps.setup_fee_standard_double_side_usd || 0) + (ps.stencil_standard_double_usd || 0)) / qty + joints * (ps.smt_per_joint_usd_1_50k || 0)) : null, pa ? `JLCPCB setup + stencil (double-sided) ÷ qty ${qty} + ≈${joints} joints × $${ps.smt_per_joint_usd_1_50k} (joint count estimated from parts)` : 'no assembly data');
  const metal = ['al6061', 'al7075'].includes(g.mat), cnc = P('cnc-aluminum-price-benchmark'), hp = metal && cnc ? priceAt(cnc, qty) : null;
  row('fab-housing', 'Housing: ' + MATERIALS[g.mat].name, metal ? cnc : g.mat === 'ti5' ? P('protolabs-cnc') : g.mat === 'pc' ? null : P('jlc3dp-printing'), hp ? hp.usd : null, hp ? 'Illustrative CNC aluminium part pricing (' + hp.basis + '); quote the real STL' : g.mat === 'ti5' ? 'Titanium CNC: RFQ (upload the STL)' : g.mat === 'pc' ? 'Injection-mould tooling + parts: RFQ' : 'Online instant quote from the exported STL (JLC3DP / PCBWay)', g.halves);
  row('fab-asm', 'Final assembly, test and pack-out', null, null, 'Contract manufacturer quote (RFQ)');
  return out;
}
export function ipModel(d, items) {
  const target = IP_LEVELS[d.req.ip].n, tactics = db().tactics || [];
  const has = role => items.some(i => i.role === role);
  const ht = hingeType(d), lk = selected(d, 'link'), contactless = !!(lk && lk.n && lk.n.kind === 'mmwave_60ghz');
  const list = OPENINGS.filter(op => op.when === 'bondedBack' ? d.housing.back !== 'unibody' : op.when === 'folding' ? d.form !== 'slab' : op.when === 'spine' ? !!ht && ht !== 'outer' : op.when === 'outer' ? ht === 'outer' : op.roles.some(has)).map(op => {
    const parts = op.roles.map(r => items.find(i => i.role === r)).filter(Boolean);
    const selfRated = op.id === 'pins' || (op.id === 'flex' && contactless) || (parts.length && parts.every(i => fin(i.p.n.ipNum) && i.p.n.ipNum >= target));
    const chosen = d.seal[op.id];
    const tac = tactics.find(t => t.id === chosen) || (selfRated ? null : tactics.find(t => t.applies_to === op.id || (Array.isArray(t.applies_to) && t.applies_to.includes(op.id))));
    const level = selfRated ? (op.id === 'pins' || op.id === 'flex' ? 8 : Math.min(...parts.map(i => i.p.n.ipNum))) : tac ? Math.max(7, target) : 0;
    return { ...op, parts: parts.map(i => i.uid), selfRated, tactic: target ? (chosen === 'none' ? null : tac) : null, level: target ? (chosen === 'none' ? 0 : level) : 0, ok: !target || (chosen !== 'none' && level >= target) };
  });
  const achieved = !target ? 'none' : list.every(x => x.ok) ? d.req.ip : Object.keys(IP_LEVELS).filter(k => IP_LEVELS[k].n <= Math.min(...list.map(x => x.level))).pop() || 'none';
  return { target: d.req.ip, openings: list, achieved, thickness: target ? (d.housing.t ? 0 : 0) : 0 };
}
function runChecks(d, L, m, withFix) {
  const out = [], g = L.g, items = L.items, board = L.board, q = d.req;
  const add = (sev, id, title, text, fix, uids) => out.push({ sev, id, title, text, fix: withFix && fix ? fix() : null, uids: uids || [] });
  const hw = g.iw / 2, hl = g.il / 2;
  ROLES.forEach(r => { isRequired(d, r) && !selected(d, r.id) && add('error', 'missing-' + r.id, 'Missing: ' + r.name, 'A phone needs this part.', () => { const p = defaultFor(r.id, q.allowRef); return p ? { label: 'Use ' + p.mfr + ' ' + p.mpn, patch: { sel: { [r.id]: p.id } } } : null; }); });
  const foldable = !!FORMS[d.form].foldable;
  items.forEach(it => { it.p.status === 'oem' && !foldable && add('error', 'oem-' + it.uid, it.name + ' is OEM-only', `${it.p.mfr} ${it.p.mpn} is sold only to OEMs under NDA. Shown for reference; it cannot be bought for this build.`, () => { const p = defaultFor(it.role, false); return p ? { label: 'Use ' + p.mfr + ' ' + p.mpn, patch: { sel: { [it.role]: p.id } } } : null; }, [it.uid]); });
  foldable && add('error', 'fold-ref', 'Foldable form is reference-only', 'Foldable OLED panels and their waterdrop / U-shape / multi-link hinges are OEM-only. Use the dual-screen book or dual-panel flip for a buildable folding phone.', () => ({ label: FORMS[d.form].axis === 'short' ? 'Switch to dual-panel flip' : 'Switch to dual-screen book', patch: { form: FORMS[d.form].axis === 'short' ? 'flip' : 'dual' } }));
  hingeChecks(d, L, m, add); dockChecks(d, L, m, add);
  items.forEach(it => { ['lifecycle'].forEach(() => { const lc = String(it.p.lifecycle || ''); /EOL|obsolete/i.test(lc) ? add('warn', 'eol-' + it.uid, it.name + ' is end-of-life', `${it.p.mpn}: ${lc}. Pick an active part before committing.`, null, [it.uid]) : /NRND/i.test(lc) && add('info', 'nrnd-' + it.uid, it.name + ' not recommended for new designs', it.p.mpn + ' is NRND.', null, [it.uid]); }); });
  const dp = items.find(i => i.uid === 'display');
  items.filter(i => i.cat === 'display' && !i.p.n.touch).forEach(i => add(i.role === 'display_cover' ? 'warn' : 'error', 'touch-' + i.uid, i.name + ' has no touch sensor', `${i.p.mpn}: no integrated touch sensor in the listing. Add a touch panel (RFQ) or pick a panel with on-cell touch.`, () => { const t = forRole(i.role, false).find(p => p.n && p.n.touch && p.status === 'buyable'); return t ? { label: 'Use ' + t.mfr + ' ' + t.mpn, patch: { sel: { [i.role]: t.id } } } : null; }, [i.uid]));
  dp && !foldable && (dp.sx > g.iw + 0.01 || dp.sy > g.il + 0.01) && add('error', 'display-fit', 'Display outline does not fit the housing', `Panel ${dp.sx.toFixed(1)} × ${dp.sy.toFixed(1)} mm vs interior ${g.iw.toFixed(1)} × ${g.il.toFixed(1)} mm.`, () => ({ label: 'Fit housing to panel', patch: { housing: { w: r2(dp.sx + 2 * g.wall + 0.4), l: r2(dp.sy + 2 * g.wall + 0.4) } } }), [dp.uid]);
  const inner = items.filter(i => !['display', 'glass', 'hinge', 'spreader'].includes(i.mount));
  const need = Math.max(...inner.filter(i => i.mount !== 'front' && i.mount !== 'top' && i.mount !== 'spreader').map(i => i.z + i.sz)) + K.gapDisplay + g.dispT + g.adhT + g.glassT + Math.max(0, ...items.filter(i => i.mount === 'spreader').map(i => i.sz));
  const tNeed = Math.max(Math.ceil(need * 20) / 20, m.tFit || 0), split = d.housing.tB != null && g.halves > 1, tNeedOf = h => split ? (h === 'B' ? m.tFitB : m.tFitA) : tNeed, tKey = h => split && h === 'B' ? 'tB' : 't';
  inner.forEach(it => {
    const b = it.box, edge = ['edgeRight', 'edgeLeft', 'edgeBottom'].includes(it.mount);
    const corners = [[b[0], b[1]], [b[3], b[1]], [b[3], b[4]], [b[0], b[4]]];
    !corners.every(([x, y]) => inRounded(x, y, hw + (edge ? 1.2 : 0.01), hl + (it.mount === 'edgeBottom' ? 1.2 : 0.01), g.ir)) && add('error', 'out-' + it.uid, it.name + ' pokes through the housing wall', 'Move it inside the frame (clearance ' + K.wallClear + ' mm).', () => ({ label: 'Auto-place ' + it.name, patch: { pos: { [it.uid]: null } } }), [it.uid]);
    const gh = it.half === 'B' ? g.B : g, ceil = ['front', 'top'].includes(it.mount) ? (dp && it.half === 'A' && overlap([...b.slice(0, 2), 0, ...b.slice(3, 5), 1], [...dp.box.slice(0, 2), 0, ...dp.box.slice(3, 5), 1], -1e-3) && it.mount !== 'front' ? gh.dispZ : gh.t - g.glassT - g.adhT) : gh.cavTop;
    it.mount !== 'back' && b[5] > ceil + 0.01 && add('error', 'z-' + it.uid, it.name + ' hits the display', `Top at ${b[5].toFixed(2)} mm, display underside at ${gh.dispZ.toFixed(2)} mm${g.halves > 1 ? ' (half ' + it.half + ')' : ''}.`, () => ({ label: (split ? 'Half ' + it.half + ' ' : 'Housing ') + tNeedOf(it.half) + ' mm thick', patch: { housing: { [tKey(it.half)]: tNeedOf(it.half) } } }), [it.uid]);
    b[2] < g.floor - 0.01 && !['back', 'backDisplay'].includes(it.mount) && add('error', 'floor-' + it.uid, it.name + ' goes through the back', 'Raise it above the floor.', () => ({ label: 'Rest on the floor', patch: { pos: { [it.uid]: { ...d.pos[it.uid], z: g.floor } } } }), [it.uid]);
    ON_BOARD.has(it.mount) && it.half === 'A' && !rectInPoly(b[0], b[1], b[3], b[4], board.poly) && add('error', 'board-' + it.uid, it.name + ' is off the board outline', 'Board parts must sit inside the PCB outline.', () => ({ label: 'Auto-place ' + it.name, patch: { pos: { [it.uid]: null } } }), [it.uid]);
  });
  const boardBox = [Math.min(...board.poly.map(p => p[0])), Math.min(...board.poly.map(p => p[1])), board.z, Math.max(...board.poly.map(p => p[0])), Math.max(...board.poly.map(p => p[1])), board.z + board.t];
  const solids = inner.filter(i => i.cat !== 'thermal');
  for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
    const a = solids[i], b = solids[j];
    if (a.half !== b.half || !overlap(a.box, b.box, -1e-3)) continue;
    if ((a.cat === 'qi_coil' || a.cat === 'nfc_coil') && (b.cat === 'qi_coil' || b.cat === 'nfc_coil')) continue;
    add('error', 'hit-' + a.uid + '-' + b.uid, a.name + ' collides with ' + b.name, 'Their boxes overlap. Drag one, change its layer, or auto-place.', () => ({ label: 'Auto-place ' + b.name, patch: { pos: { [b.uid]: null } } }), [a.uid, b.uid]);
  }
  solids.filter(i => !ON_BOARD.has(i.mount) && i.half === 'A' && overlap(i.box, boardBox, -1e-3) && polyHit(i, board.poly)).forEach(i => add('error', 'hitboard-' + i.uid, i.name + ' collides with the board', 'It overlaps the PCB volume.', () => ({ label: 'Auto-place ' + i.name, patch: { pos: { [i.uid]: null } } }), [i.uid]));
  items.filter(i => i.cat.startsWith('cell')).forEach(c => {
    const nt = c.sz, swell = Math.max(K.swellMin, nt * K.swellFrac), zone = [c.box[0] - K.swellSide, c.box[1] - K.swellSide, c.box[5], c.box[3] + K.swellSide, c.box[4] + K.swellSide, c.box[5] + swell];
    const cavityRoom = (c.half === 'B' ? g.B : g).cavTop - c.box[5];
    cavityRoom < swell - 1e-3 && add('error', 'swell-top-' + c.uid, 'No swell space above ' + c.name, `Pouch cells swell ≈ 8% (Apple) to 10–15% (Qnovo); needs ${swell.toFixed(2)} mm free, has ${cavityRoom.toFixed(2)} mm.`, () => ({ label: 'Housing ' + Math.ceil(((c.half === 'B' ? g.B : g).t + swell - cavityRoom) * 20) / 20 + ' mm', patch: { housing: { [tKey(c.half)]: Math.ceil(((c.half === 'B' ? g.B : g).t + swell - cavityRoom) * 20) / 20 } } }), [c.uid]);
    solids.filter(o => o !== c && o.half === c.half && overlap(o.box, zone, -1e-3)).forEach(o => add('error', 'swell-' + o.uid, o.name + ' sits in the cell swell zone', `Keep ${swell.toFixed(2)} mm above and ${K.swellSide} mm around the pouch free.`, () => ({ label: 'Auto-place ' + o.name, patch: { pos: { [o.uid]: null } } }), [o.uid, c.uid]));
  });
  const metalHousing = MATERIALS[g.mat].metal;
  items.filter(i => i.cat === 'antenna').forEach(a => {
    const k = fin(a.p.n.keep) ? a.p.n.keep : K.antKeep, zone = [a.box[0] - k, a.box[1] - k, -1, a.box[3] + k, a.box[4] + k, 99];
    const intr = solids.filter(o => o !== a && o.half === a.half && o.metal && overlap(o.box, zone, -1e-3));
    const bIn = a.half === 'A' && overlap(boardBox, zone, -1e-3) && polyHit({ box: zone }, board.poly);
    (intr.length || bIn) && add('warn', 'ant-' + a.uid, a.name + ' keep-out violated', `${[...intr.map(o => o.name), ...(bIn ? ['PCB ground'] : [])].join(', ')} within ${k} mm of the radiator. Expect detuning and efficiency loss.`, () => { const spot = antennaSpot(a, solids, boardBox, board.poly, g, k); return spot ? { label: 'Move ' + a.name + ' to a clear wall spot', patch: { pos: { [a.uid]: { x: spot.x, y: spot.y, z: null, rot: spot.rot, half: a.half, stand: a.stand } } } } : null; }, [a.uid, ...intr.map(o => o.uid)]);
    metalHousing && add('info', 'antwin-' + a.uid, a.name + ' needs an RF window', `The ${MATERIALS[g.mat].name} housing is metal: a plastic antenna split/window is modelled in the wall next to this antenna.`, null, [a.uid]);
  });
  const fc = items.find(i => i.role === 'cam_front'), hole = dp && dp.p.n.hole, dmN = items.find(i => i.mount === 'magEdge'), nbN = d.dock.on && d.dock.edges.N && dmN ? Math.min(dmN.sx, dmN.sy) + 0.8 : 0;
  fc && dp && overlap([...fc.box.slice(0, 2), 0, ...fc.box.slice(3, 5), 1], [...dp.box.slice(0, 2), 0, ...dp.box.slice(3, 5), 1], -1e-3) && !(hole && Math.hypot(fc.x - (dp.x + hole.x), fc.y - (dp.y + hole.y)) + Math.max(fc.sx, fc.sy) / 2 * 0.5 <= hole.d / 2 + 0.5) && add('error', 'frontcam', 'Front camera has no hole in the panel', hole ? `The panel's camera hole is at (${hole.x}, ${hole.y}) mm, ⌀${hole.d} mm; move the camera under it.` : 'This panel has no punch hole. Put the front camera in a bezel outside the panel outline (make the housing longer).', () => hole ? { label: 'Center under the panel hole', patch: { pos: { cam_front: { x: dp.x + hole.x, y: dp.y + hole.y, z: null, rot: 0, half: 'A' } } } } : { label: 'Housing ' + r2(Math.ceil((dp.sy + fc.sy + 1.7 + nbN + 2 * g.wall) * 10) / 10) + ' mm long (top bezel for the camera)', patch: { housing: { l: r2(Math.ceil((dp.sy + fc.sy + 1.7 + nbN + 2 * g.wall) * 10) / 10) } } }, ['cam_front']);
  const bump = Math.max(0, ...items.filter(i => i.mount === 'back').map(i => i.z + i.sz - g.cavTop));
  bump > 0.01 && add(bump > 4 ? 'warn' : 'info', 'bump', 'Camera island ' + bump.toFixed(1) + ' mm', 'The rear camera module is taller than the cavity; the housing grows a camera island (modelled in 3D and in the STL).', null, items.filter(i => i.mount === 'back').map(i => i.uid));
  const som = items.find(i => i.role === 'som') || items.find(i => i.role === 'soc') || items.find(i => i.role === 'mcu'), sn = (som && som.p.n) || {};
  const displays = items.filter(i => (i.cat === 'display' || i.cat === 'display_ref') && !i.uid.endsWith('#B'));
  const camsL = items.filter(i => i.cat === 'camera' || i.cat === 'camera_front'), lanesBad = displays.filter(x => fin(x.p.n.lanes) && fin(sn.dsi) && x.p.n.lanes > sn.dsi);
  som && lanesBad.length && add('error', 'dsi-lanes', 'Not enough DSI lanes', `${lanesBad.map(x => x.p.mpn || x.p.name).join(', ')} needs ${Math.max(...lanesBad.map(x => x.p.n.lanes))} lanes; ${som.p.mpn} has ${sn.dsi} per port.`, null, [som.uid]);
  const csiN = fin(sn.csiPorts) ? sn.csiPorts : /^none/i.test(String((som && som.p.specs || {}).mipi_csi || '')) ? 0 : null;
  som && csiN != null && camsL.length > csiN && add('error', 'csi-ports', 'Not enough camera ports', `${camsL.length} cameras, ${som.p.mpn} exposes ${csiN} CSI port(s).`, null, [som.uid]);
  const muxP = ((db().passives || {}).ics || []).find(x => /TS5MP64[56]/.test(x.mpn)), muxOk = !!muxP && displays.length === (sn.dsiPorts || 1) + 1 && displays.some(i => i.role === 'display_cover');
  som && displays.length > (sn.dsiPorts || 1) && (muxOk ? add('warn', 'dsi-mux', 'Cover and top panels share a DSI port', `${displays.length} panels on ${sn.dsiPorts || 1} DSI ports: the cover panel and the top inner panel are never lit together, so the auto-schematic adds a ${muxP.mpn} 2:1 MIPI switch (${muxP.price_q1k_usd != null ? '$' + muxP.price_q1k_usd + ' at 1k, ' : ''}NRND at TI: confirm stock).`, null, [som.uid]) : add('error', 'dsi-ports', 'Not enough display ports', `${displays.length} panels, ${som.p.mpn} exposes ${sn.dsiPorts || 1} DSI port(s).`, null, [som.uid]));
  som && displays.forEach(dd => { fin(sn.dsi) && fin(dd.p.n.lanes) && dd.p.n.lanes > sn.dsi && add('error', 'dsi-' + dd.uid, 'Display needs more DSI lanes', `${dd.p.mpn} wants ${dd.p.n.lanes} lanes; ${som.p.mpn} has ${sn.dsi}.`, null, [dd.uid, som.uid]); });
  const camsAll = items.filter(i => i.cat === 'camera' || i.cat === 'camera_front');
  som && fin(sn.csiPorts) && camsAll.length > sn.csiPorts && add('error', 'csi', 'Not enough camera ports', `${camsAll.length} cameras, ${som.p.mpn} has ${sn.csiPorts} CSI port(s).`, () => items.find(i => i.role === 'cam_ultra') ? { label: 'Drop the second rear camera', patch: { sel: { cam_ultra: '' } } } : null, [som.uid]);
  som && fin(sn.mipiShared) && camsAll.length + displays.length > sn.mipiShared && add('error', 'mipi-shared', 'Not enough MIPI ports', `${som.p.mpn} has ${sn.mipiShared} MIPI ports shared between DSI and CSI; this design needs ${displays.length} panel(s) + ${camsAll.length} camera(s).`, () => items.find(i => i.role === 'cam_ultra') ? { label: 'Drop the second rear camera', patch: { sel: { cam_ultra: '' } } } : null, [som.uid]);
  const md = items.find(i => i.role === 'modem');
  md && sn.hasModem && add('warn', 'modem-dup', 'Two modems', `${som.p.mpn} already has a modem; ${md.p.mpn} is redundant.`, () => ({ label: 'Remove external modem', patch: { sel: { modem: '' } } }), [md.uid]);
  md && md.p.n.ifc && sn.usb != null && /usb/i.test(md.p.n.ifc) && sn.usb < 2 && add('warn', 'usb-ports', 'USB ports are tight', `${md.p.mpn} uses USB and the Type-C port needs one; ${som.p.mpn} lists ${sn.usb} USB port(s). Add a hub or use PCIe.`, null, [md.uid, som.uid]);
  const cell = items.find(i => i.role === 'cell'), chg = items.find(i => i.role === 'charger');
  cell && chg && fin(cell.p.n.chgA) && fin(chg.p.n.maxA) && chg.p.n.maxA > cell.p.n.chgA * 1.05 && add('info', 'chg-limit', 'Program the charge current', `${chg.p.mpn} can push ${chg.p.n.maxA} A; ${cell.p.mpn} allows ${cell.p.n.chgA} A. Set ICHG ≤ ${cell.p.n.chgA} A in firmware.`, null, [chg.uid, cell.uid]);
  m.power.sot < q.life - 1e-9 && add('warn', 'life', 'Battery life below target', `${m.power.sot.toFixed(1)} h screen-on (${m.wh.toFixed(1)} Wh at ${m.power.pOn.toFixed(2)} W) vs ${q.life} h target.`, () => { const bigger = (forRole('cell', q.allowRef)).filter(p => p.status !== 'oem').sort((a, b) => ((b.n.wh || 0) - (a.n.wh || 0)))[0]; return bigger && bigger.id !== d.sel.cell ? { label: 'Largest cell: ' + bigger.mpn, patch: { sel: { cell: bigger.id }, pos: { cell: null } } } : null; });
  m.cost.unit > q.price + 0.5 && add('warn', 'price', 'Over unit-cost target', `$${m.cost.unit.toFixed(0)} per unit at qty ${q.qty} (parts with published prices + quoted fab) vs $${q.price}.`, null);
  m.cost.unknown && add('info', 'unpriced', m.cost.unknown + ' line(s) have no published price', m.cost.unknownRows.map(r => r.name + (r.mpn ? ' (' + r.mpn + ')' : '')).slice(0, 6).join(', ') + '. They need an RFQ.', null);
  m.mass > q.mass + 0.5 && add('warn', 'mass', 'Over mass limit', `${m.mass.toFixed(0)} g vs ${q.mass} g.`, null);
  q.ip === 'ip68' && m.depth && m.depth.depth < q.depth && add('warn', 'depth', 'Depth rating below target', `Rated to ≈${m.depth.depth} m vs ${q.depth} m: limited by ${m.depth.limit}.`, null);
  q.maxW != null && g.w > q.maxW + 0.01 && add('warn', 'cap-w', 'Wider than the width cap', `Auto-fit frame is ${g.w.toFixed(1)} mm wide (screen outline + ${d.housing.gap} mm gap + ${g.wall} mm walls) vs cap ${q.maxW} mm. Pick a narrower panel or thinner walls.`, null);
  q.maxL != null && g.l > q.maxL + 0.01 && add('warn', 'cap-l', 'Longer than the length cap', `Auto-fit frame is ${g.l.toFixed(1)} mm long vs cap ${q.maxL} mm.`, null);
  const tot = m.G ? g.t + g.B.t + Math.max(0, m.G.shutGap) : g.t;
  tot > q.thick + 0.05 && add('warn', 'thick', 'Thicker than target', `${tot.toFixed(2)} mm vs ${q.thick} mm. The stack needs ${tNeed} mm per ${d.form === 'slab' ? 'body' : 'half'}.`, tNeed < g.t - 0.04 ? () => ({ label: 'Shrink to ' + tNeed + ' mm', patch: { housing: { t: tNeed } } }) : null);
  m.therm.frac != null && m.therm.frac < 0.5 && add('warn', 'throttle', 'Will throttle under sustained load', `Skin limit ${q.skin} °C allows ≈ ${m.therm.psus.toFixed(1)} W total; the module can draw ${m.therm.somMax} W.`, null);
  m.struct.ratio < 1.3 && add('warn', 'bend', 'Frame may bend', `Rail yield load ≈ ${m.struct.bendN.toFixed(0)} N vs ${m.struct.bendRef.toFixed(0)} N for an iPhone 6 Plus–class frame.`, () => ({ label: 'Walls ' + r2(g.wall + 0.3) + ' mm', patch: { housing: { wall: r2(g.wall + 0.3) } } }));
  m.ip.target !== 'none' && m.ip.openings.filter(op => !op.ok).forEach(op => add(IP_LEVELS[m.ip.target].n >= 7 ? 'error' : 'warn', 'ip-' + op.id, 'Unsealed: ' + op.name, `No seal rated for ${IP_LEVELS[m.ip.target].name} on this opening.`, () => { const t = (db().tactics || []).find(t => t.applies_to === op.id || (Array.isArray(t.applies_to) && t.applies_to.includes(op.id))); return t ? { label: t.name, patch: { seal: { [op.id]: t.id } } } : null; }, op.parts));
  m.est.length && add('info', 'estimates', 'Some power numbers are placeholders', 'No datasheet figure for: ' + [...new Set(m.est)].join(', ') + '. These lines are marked “placeholder” in the power table.', null);
  const order = { error: 0, warn: 1, info: 2 };
  return out.sort((a, b) => order[a.sev] - order[b.sev]);
}
function dockChecks(d, L, m, add) {
  if (!d.dock.on) return;
  const items = L.items, ms = m.magnets, f1 = v => v.toFixed(1);
  d.dock.code !== 'same' && d.dock.perEdge % 2 && add('warn', 'dock-code-odd', 'Odd magnets per edge', 'An anti-palindromic code needs an even count: the middle pair repels.', () => ({ label: 'Use ' + (d.dock.perEdge + 1) + ' per edge', patch: { dock: { perEdge: d.dock.perEdge + 1 } } }));
  ms && ms.compass && ms.range && Math.max(...ms.compass.map(c => c.ut)) > K.magFrac * ms.range && add('error', 'mag-compass-sat', 'Dock magnets saturate the compass', `Up to ${Math.round(Math.max(...ms.compass.map(c => c.ut)))} µT at the magnetometer vs ±${ms.range} µT full scale.`, () => ({ label: 'Auto-place magnetometer', patch: { pos: { mag: null } } }), ['mag']);
  ms && ms.compass && add('info', 'mag-compass', 'Dock magnet field at the compass', `${Math.round(ms.compass[0].ut)} µT static (a fixed hard-iron offset the OS calibrates out); a docked neighbour adds its own field, so switch calibration sets with the dock sensors.`);
  if (ms) { const seen = new Set(); ms.near.forEach(n => { const k = n.m.split(':')[0] + '|' + n.o; if (seen.has(k)) return; seen.add(k); add('warn', 'mag-near-' + n.m + '-' + n.o, 'Dock magnet close to ' + n.oname, `${f1(n.d)} mm (keep ≥ ${n.lim} mm from coils and speaker magnets).`, null, [n.m, n.o]); }); }
  const links = items.filter(i => i.role === 'dock_link'), lk = links[0];
  lk && d.dock.sealed && /pogo/.test(lk.p.n.kind || '') && !(lk.p.n.ipNum >= 8) && add('error', 'dock-seal', 'Exposed dock contacts are not sealed', `${lk.p.mpn} has no IP68 rating; a sealed piece needs sealed pogo pads or a contactless link.`, null, links.map(i => i.uid));
  const halls = items.filter(i => i.role === 'dock_hall'), edges = ['E', 'W', 'N', 'S'].filter(e => d.dock.edges[e]);
  halls.length < edges.length && add('warn', 'dock-hall', 'Not every dock edge can detect its neighbour', `${halls.length} of ${edges.length} docking edges have a Hall sensor; add one per edge so software knows the arrangement.`, null);
}
function hingeChecks(d, L, m, add) {
  const G = m.G, sw = m.sw, g = L.g, items = L.items, f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
  if (!G) return;
  const leafFix = () => { const want = Math.max(0.6, Math.min(2, G.flatGap)); for (let leaf = Math.ceil(G.leaf * 2) / 2; leaf <= 24; leaf += 0.5) { const inset = r2((leaf - want) / 2), dd = { ...d, hinge: { ...d.hinge, leaf, inset } }, GG = hingeGeom(dd, g); if (inset < G.pinD / 2 + K.pinMargin) continue; const s2 = swing(GG, g.fillet, null); if (s2.closes && s2.flat > 0.3) return { label: `Leaf ${leaf} mm, pins ${inset} mm in from the seam`, patch: { hinge: { leaf, inset } } }; } return null; };
  !G.buildable && !FORMS[d.form].foldable && add('error', 'hinge-oem', G.H.name + ' is OEM-only', 'Pick the center friction hinge or the dual outer hinge.', () => ({ label: 'Use the dual outer hinge', patch: { hinge: { type: 'outer' } } }));
  sw && !sw.closes && add('error', 'hinge-shut', 'The halves cannot close', `The shells collide at ${sw.lo - K.swingStep}° on the way shut (stops at ${sw.lo}°).${G.outer ? ` Shut gap needs leaf ≥ 2 × pin depth (${f1(2 * G.pf)} mm) plus clearance; the corners also sweep past each other mid-swing.` : ''}`, G.outer ? leafFix : null);
  sw && sw.closes && sw.minClear < K.swingClear && add(sw.minClear < -0.02 ? 'error' : 'warn', 'hinge-swing', 'Tight swing clearance', `Minimum gap between the shells during the swing is ${f2(sw.minClear)} mm at ${sw.at}°. Edge fillet ${g.fillet} mm.`, G.outer ? leafFix : () => ({ label: 'Fillet ' + r2(g.fillet + 0.3) + ' mm', patch: { housing: { fillet: r2(g.fillet + 0.3) } } }));
  sw && G.outer && sw.flat < 0.3 && add('warn', 'hinge-flat', 'Screens nearly touch when flat', `Flat-open gap ${f2(sw.flat)} mm between the halves.`, () => ({ label: 'Pins ' + r2(G.inset - 0.3) + ' mm in from the seam', patch: { hinge: { inset: r2(G.inset - 0.3) } } }));
  sw && G.outer && add('info', 'hinge-range', `Outer hinge opens ${sw.lo}°–${sw.hi}°`, `Leaf ${G.leaf} mm pin-to-pin, pins ${G.inset} mm in from the seam and ${G.pf} mm below the display face. Shut gap ${f2(G.shutGap)} mm, flat gap ${f2(G.flatGap)} mm, back-to-back gap ${f2(G.backGap)} mm.${sw.full ? ' Folds a full 360°.' : (L => L ? ` 360° needs a ${L.leaf} mm leaf with pins ${L.pinFace} mm under the face and ${L.inset} mm in from the seam (keeping the ${f2(Math.max(0.6, G.flatGap))} mm flat gap).` : ' 360° is not reachable with a leaf up to 40 mm at this thickness.')(leafFor360(d, g))} Minimum swing clearance ${f2(sw.minClear)} mm at ${sw.at}°.`);
  G.outer && (Math.min(G.pinZ, G.pinZB) - G.pinD / 2 < K.pinMargin || G.pinZ + G.pinD / 2 > g.t - K.pinMargin || G.pinZB + G.pinD / 2 > g.B.t - K.pinMargin) && add('error', 'hinge-pinz', 'Hinge pin pokes out of the shell', `Pin ⌀${G.pinD} mm at ${f2(G.pinZ)} mm from the back of a ${g.t} mm shell.`, () => ({ label: 'Pin depth ' + r2(Math.min(g.t / 2, Math.max(G.pinD / 2 + K.pinMargin, G.pf))) + ' mm', patch: { hinge: { pinFace: r2(Math.min(g.t / 2, Math.max(G.pinD / 2 + K.pinMargin + 0.1, G.pf))) } } }));
  G.outer && G.inset < G.pinD / 2 + K.pinMargin && add('error', 'hinge-inset', 'Hinge pin too close to the seam edge', `Pin ⌀${G.pinD} mm centered ${G.inset} mm from the edge leaves less than ${K.pinMargin} mm of wall.`, () => ({ label: 'Inset ' + r2(G.pinD / 2 + K.pinMargin + 0.1) + ' mm', patch: { hinge: { inset: r2(G.pinD / 2 + K.pinMargin + 0.1) } } }));
  G.outer && g.r > G.inset - G.pinD / 2 && add('info', 'hinge-corner', 'Seam corners are squared for the pins', `The ${g.r} mm corner radius stays on the free corners; the four seam corners are made square (≤1 mm) so each pin lands in a flat side wall.`);
  const zones = bossZones(d, g);
  zones.forEach(zn => items.filter(i => i.half === zn.half && i.box && !['display', 'glass', 'spreader', 'hinge'].includes(i.mount) && overlap(i.box, zn.box, -1e-3)).forEach(i => add('error', 'boss-' + i.uid, i.name + ' hits a hinge pin boss', 'The pin boss in the side wall needs this space.', () => ({ label: 'Auto-place ' + i.name, patch: { pos: { [i.uid]: null } } }), [i.uid])));
  const ms = m.magnets;
  if (ms && ms.count) {
    ms.shut.length && ms.shutN < ms.needShut && add('error', 'mag-shut-weak', 'Closing magnets too weak', `Hold-shut force ${f2(ms.shutN)} N vs ${f2(ms.needShut)} N (${K.holdK}× the lighter half's weight).`, null, items.filter(i => i.role === 'mag_shut').map(i => i.uid));
    ms.shutN > ms.maxShut && add('warn', 'mag-shut-strong', 'Closing magnets hard to open', `${f2(ms.shutN)} N to open vs about ${ms.maxShut} N comfortable for a one-thumb flip (heuristic).`, () => ({ label: 'One fewer pair', patch: { hinge: { shutPairs: Math.max(1, d.hinge.shutPairs - 1) } } }));
    ms.flat.length && ms.flatN < ms.needFlat && add(ms.flatN < ms.needFlat * 0.5 ? 'error' : 'warn', 'mag-flat-weak', 'Flat-open magnets too weak', `Flat hold ${f2(ms.flatN)} N vs ${f2(ms.needFlat)} N (weight of the lighter half).`, null);
    ms.compass && ms.range && Math.max(...ms.compass.map(c => c.ut)) > K.magFrac * ms.range && add('error', 'mag-compass-sat', 'Magnets saturate the compass', `Up to ${Math.round(Math.max(...ms.compass.map(c => c.ut)))} µT at the magnetometer vs ±${ms.range} µT full scale (limit ${K.magFrac * 100}%).`, () => ({ label: 'Auto-place magnetometer', patch: { pos: { mag: null } } }), ['mag']);
    ms.compass && ms.delta > K.magDelta && add('warn', 'mag-compass-pose', 'Compass offset changes with the fold', `The field at the magnetometer changes by ${Math.round(ms.delta)} µT between poses (Earth ≈ 25–65 µT). Calibrate hard-iron offsets per pose using the lid sensor.`, null, ['mag']);
    ms.compass && add('info', 'mag-compass', 'Magnet field at the compass', ms.compass.map(c => `${c.th}°: ${Math.round(c.ut)} µT`).join(', ') + (ms.range ? ` (full scale ±${ms.range} µT)` : ''));
    const seen = new Set(); ms.near.forEach(n => { const k = n.m.split('#')[0] + '|' + n.o; if (seen.has(k)) return; seen.add(k); add('warn', 'mag-near-' + n.m + '-' + n.o, 'Magnet close to ' + n.oname, `${f1(n.d)} mm at ${n.th}° (keep ≥ ${n.lim} mm from coils and speaker magnets).`, null, [n.m, n.o]); });
    const hall = items.find(i => i.role === 'hall'), op = hall && fin(hall.p.n.bop) ? hall.p.n.bop * 1000 : null;
    const hs = ms.hall && ms.hall[0].ut, hf = ms.hall && ms.hall.find(x => x.th === 180).ut, works = op != null && hs >= op && hf < op * 0.5;
    hall && ms.hall && op != null && add(works ? 'info' : 'warn', 'hall-trip', 'Lid sensor ' + (works ? 'trips when shut' : 'cannot tell shut from open'), `${Math.round(hs)} µT shut, ${Math.round(hf)} µT flat at the sensor; operate point ${Math.round(op)} µT.${works ? '' : ' A mirrored latch pair puts the same field on the sensor open and shut; add a small trigger magnet in half B that lands over the sensor when shut, with no half-A magnet within ≈10 mm of it.'}`, null, [hall.uid]);
  }
  G.outer && G.leafMat.magnetic && items.some(i => i.role === 'mag') && add('warn', 'hinge-pin-magnetic', 'Magnetic hinge steel near the compass', `${G.leafMat.name} is ferromagnetic; Bosch recommends non-magnetic 304/316 stainless or titanium near the magnetometer (soft-iron errors are hard to calibrate out).`, () => ({ label: 'Use 316 stainless', patch: { hinge: { leafMat: 'ss316h' } } }));
  const subs = items.filter(i => i.sub); subs.length && add('info', 'subboard-B', 'Half B parts on a sub-board', subs.map(i => i.name).join(', ') + ' sit in half B, which has no carrier PCB: they go on a small sub-board or flex wired across the hinge link.', null, subs.map(i => i.uid));
  const ld = m.loads;
  ld && ld.sfShear < 2 && add('warn', 'hinge-pin-shear', 'Hinge pins thin for a drop', `${K.shock} g shock on the heavier half puts ${f1(ld.tau)} MPa shear on a ⌀${G.pinD} mm pin (safety factor ${f1(ld.sfShear)}).`, () => ({ label: 'Pin ⌀' + r2(G.pinD + 0.4) + ' mm', patch: { hinge: { pinD: r2(G.pinD + 0.4) } } }));
  ld && d.hinge.detents.length && !ld.holds && add('info', 'hinge-detent', 'Detents will not hold half B at an angle', `Needs ≈${Math.round(ld.needNmm)} N·mm per hinge pair at 90°; the friction washers give ${Math.round(ld.haveNmm)} N·mm. Half B rests at the magnet poses only.`);
  const lk = m.link;
  lk && lk.errors.forEach((e, i) => add('error', 'link-' + i, 'Half-to-half link', e, null));
  lk && lk.warns.forEach((e, i) => add('warn', 'linkw-' + i, 'Half-to-half link', e, null));
  lk && lk.notes.forEach((e, i) => add('info', 'linkn-' + i, 'Half-to-half link', e, null));
}
export function antennaSpot(a, solids, boardBox, poly, g, k) {
  const hw = g.iw / 2, hl = g.il / 2, others = solids.filter(o => o !== a && o.half === a.half);
  const dims = rot => dimsOf(a.p, rot, a.stand);
  const cands = [];
  for (let t = -1; t <= 1.0001; t += 0.05) { const h = dims(0), v = dims(90); cands.push({ x: t * (hw - h.sx / 2 - 0.2), y: hl - h.sy / 2 - 0.2, rot: 0, d: h }, { x: t * (hw - h.sx / 2 - 0.2), y: -hl + h.sy / 2 + 0.2, rot: 0, d: h }, { x: -hw + v.sx / 2 + 0.2, y: t * (hl - v.sy / 2 - 0.2), rot: 90, d: v }, { x: hw - v.sx / 2 - 0.2, y: t * (hl - v.sy / 2 - 0.2), rot: 90, d: v }); }
  const clear = c => { const b = [c.x - c.d.sx / 2, c.y - c.d.sy / 2, a.z, c.x + c.d.sx / 2, c.y + c.d.sy / 2, a.z + c.d.sz], zone = [b[0] - k, b[1] - k, -1, b[3] + k, b[4] + k, 99]; return inRounded(b[0], b[1], hw, hl, g.ir) && inRounded(b[3], b[4], hw, hl, g.ir) && inRounded(b[0], b[4], hw, hl, g.ir) && inRounded(b[3], b[1], hw, hl, g.ir) && !others.some(o => overlap(o.box, b, K.clear) || (o.metal && overlap(o.box, zone, -1e-3))) && !(a.half === 'A' && overlap(boardBox, zone, -1e-3) && polyHit({ box: zone }, poly)); };
  const best = cands.filter(clear).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
  return best ? { x: r2(best.x), y: r2(best.y), rot: best.rot } : null;
}
function polyHit(it, poly) { const b = it.box; const pts = []; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) pts.push([b[0] + (b[3] - b[0]) * i / 4, b[1] + (b[4] - b[1]) * j / 4]); return pts.some(([x, y]) => pointInPoly(x, y, poly)) || poly.some(([x, y]) => x > b[0] && x < b[3] && y > b[1] && y < b[4]); }
export function anchorBox(d, L) {
  const items = L.items, g = L.g, disp = items.filter(i => (i.cat === 'display' || i.cat === 'display_ref') && i.mount === 'display'), fc = items.find(i => i.role === 'cam_front'), anchors = items.filter(i => i.lock && !['display', 'glass', 'spreader'].includes(i.mount));
  if (!disp.length) return null;
  const gap = d.housing.gap, boxes = disp.map(i => [i.x - i.sx / 2 - gap, i.y - i.sy / 2 - gap, i.x + i.sx / 2 + gap, i.y + i.sy / 2 + gap]);
  const top = disp.find(i => i.half === 'A' && i.role === 'display');
  const dm = items.find(i => i.mount === 'magEdge'), nb = d.dock.on && d.dock.edges.N && dm ? Math.min(dm.sx, dm.sy) + 0.8 : 0;
  top && fc && !top.p.n.hole && boxes.push([fc.x - fc.sx / 2 - 0.3, top.y + top.sy / 2, fc.x + fc.sx / 2 + 0.3, top.y + top.sy / 2 + 0.6 + fc.sy + 0.4 + nb]);
  anchors.forEach(i => boxes.push([i.x - i.sx / 2 - K.wallClear, i.y - i.sy / 2 - K.wallClear, i.x + i.sx / 2 + K.wallClear, i.y + i.sy / 2 + K.wallClear]));
  return [Math.min(...boxes.map(b => b[0])), Math.min(...boxes.map(b => b[1])), Math.max(...boxes.map(b => b[2])), Math.max(...boxes.map(b => b[3]))];
}
export function autoFit(src) {
  let d = normalize(src);
  if (!d.housing.auto) return d;
  for (let i = 0; i < 4; i++) {
    const L = layout(d), U = anchorBox(d, L); if (!U) return d;
    const halfA = L.items.filter(i => i.half === 'A' && i.box && !['display', 'glass', 'spreader', 'hinge', 'front', 'top', 'magShut', 'magFlat', 'magEdge', 'magBack', 'linkEdge', 'hallEdge', 'edgeRight', 'edgeLeft', 'edgeBottom', 'antTop', 'antBottom', 'back'].includes(i.mount) && !/coil/.test(i.cat)), need = (halfA.filter(i => !ON_BOARD.has(i.mount)).reduce((a, i) => a + i.sx * i.sy, 0) + halfA.filter(i => ON_BOARD.has(i.mount)).reduce((a, i) => a + i.sx * i.sy, 0) * 0.55) / 0.62, band = d.dock.on ? 2 * ((L.items.find(i => i.mount === 'magEdge') || { sx: 0, sy: 0 }).sy || 0) : 0, iw0 = U[2] - U[0], il0 = U[3] - U[1], have = Math.max(1, (iw0 - band) * (il0 - band)), grow = need > have ? Math.sqrt(need / have) : 1, cw = d.req.maxW ? d.req.maxW - 2 * d.housing.wall : 1e9, cl = d.req.maxL ? d.req.maxL - 2 * d.housing.wall : 1e9, iwG = Math.min(Math.max(iw0, (iw0 - band) * grow + band), Math.max(iw0, cw)), ilG = Math.max(il0, Math.min(Math.max(il0, (il0 - band) * grow + band), Math.max(il0, cl)), (need / Math.max(1, iwG - band)) + band);
    const w = Math.ceil((iwG + 2 * d.housing.wall) * 20) / 20, l = Math.ceil((ilG + 2 * d.housing.wall) * 20) / 20, cx = r2((U[0] + U[2]) / 2), cy = r2((U[1] + U[3]) / 2), W = clamp(w, LIMITS.w[0], LIMITS.w[1]), Lg = clamp(l, LIMITS.l[0], LIMITS.l[1]);
    const moved = Math.abs(cx) > 0.02 || Math.abs(cy) > 0.02, resized = Math.abs(W - d.housing.w) > 0.02 || Math.abs(Lg - d.housing.l) > 0.02;
    if (!moved && !resized) return d;
    const pos = Object.fromEntries(Object.entries(L.d.pos).map(([k, v]) => [k, v && v.x != null && (v.lock || v.placed || L.items.some(it => it.uid === k && it.mount === 'display')) ? { ...v, x: r2(v.x - cx), y: r2(v.y - cy) } : v && v.lock ? v : null]));
    const keepPoly = d.board.poly && Object.values(d.pos || {}).some(v => v && v.placed) ? d.board.poly.map(([x, y]) => [r2(x - cx), r2(y - cy)]) : null;
    d = applyPatch(d, { housing: { w: W, l: Lg }, pos, board: { poly: keepPoly, z: null } });
  }
  return d;
}
export function fitDesign(src, opts) {
  let d = autoFit(normalize(src));
  if (d.system && d.system.B) { const B = fitDesign({ ...d.system.B, housing: { ...d.system.B.housing, auto: false, w: d.housing.w, l: d.housing.l } }); d = { ...d, system: { ...d.system, B } }; }
  for (let i = 0; i < 4; i++) {
    const r = evaluate(d, { fixes: true }), grow = r.checks.filter(c => c.fix && c.fix.patch.housing && (c.id === 'display-fit' || c.id === 'frontcam'));
    const t = r.tFit, tB = d.housing.tB != null ? r.tFitB : null, next = grow.length ? grow.reduce((a, c) => applyPatch(a, c.fix.patch), d) : Math.abs(t - d.housing.t) > 0.01 || (tB != null && Math.abs(tB - d.housing.tB) > 0.01) ? applyPatch(d, { housing: { t, ...(tB != null ? { tB } : {}) }, keepBoard: true }) : null;
    if (!next) return d;
    d = grow.length ? applyPatch(next, { pos: unpinned(next.pos), board: { poly: null, z: null } }) : next;
    d.housing.auto && (d = autoFit(d));
  }
  return d;
}
export function unpinned(pos, half) { return Object.fromEntries(Object.entries(pos || {}).filter(([, v]) => !(v && v.lock) && (!half || !v || (v.half || 'A') === half)).map(([k]) => [k, null])); }
export function applyPatch(d, patch) {
  const p = patch || {}, pos = { ...d.pos }, keepHalf = k => pos[k] && pos[k].half ? { half: pos[k].half, x: null, y: null } : null;
  Object.entries(p.pos || {}).forEach(([k, v]) => { v === null ? (keepHalf(k) ? (pos[k] = keepHalf(k)) : delete pos[k]) : (pos[k] = { ...(pos[k] || {}), ...v }); });
  p.sel && Object.keys(p.sel).forEach(k => { Object.keys(pos).filter(u => u === k || u.startsWith(k + '#')).forEach(u => { keepHalf(u) && !u.includes('#B') && !(ROLE[k] && ROLE[k].pairs) ? (pos[u] = keepHalf(u)) : delete pos[u]; }); });
  const board = p.board ? { ...d.board, ...p.board } : p.sel || p.housing ? { ...d.board, poly: p.keepBoard ? d.board.poly : null } : d.board;
  return normalize({ ...d, ...p, req: { ...d.req, ...(p.req || {}), pri: { ...d.req.pri, ...((p.req && p.req.pri) || {}) } }, housing: { ...d.housing, ...(p.housing || {}) }, hinge: { ...d.hinge, ...(p.hinge || {}) }, sel: { ...d.sel, ...(p.sel || {}) }, seal: { ...d.seal, ...(p.seal || {}) }, pos, board });
}
export { STEPS };
