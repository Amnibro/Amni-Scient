import { ROLES, FORMS } from './catalog.js';
export const ROLE = Object.fromEntries(ROLES.map(r => [r.id, r]));
let DB = { parts: [], byId: new Map(), tactics: [], tests: [], path: [], refs: [], checked: '' };
export function setDB(json) { const parts = (json && json.parts) || []; DB = { ...json, parts, byId: new Map(parts.map(p => [p.id, p])) }; return DB; }
export const db = () => DB;
export const part = id => (id && DB.byId.get(id)) || null;
const typeOf = d => { const f = d && FORMS[d.form]; return f && f.axis ? (f.hinges.includes(d.hinge && d.hinge.type) ? d.hinge.type : f.hinges[0]) : null; };
export function fitsRole(p, roleId, d) { const r = ROLE[roleId], k = r && r.kindFrom ? (d ? typeOf(d) : null) : r && r.kind; return !!(p && r && r.cat.includes(p.cat) && (!k || !p.n || !p.n.kind || p.n.kind === k || (Array.isArray(p.n.kind) && p.n.kind.includes(k)))); }
export function forRole(roleId, allowRef, d) { const fold = d && FORMS[d.form] && FORMS[d.form].foldable; return DB.parts.filter(p => fitsRole(p, roleId, d) && (allowRef || p.status !== 'oem') && !(roleId === 'display' && fold && p.n && p.n.fold && p.n.fold !== fold) && !(roleId === 'display' && d && !fold && p.n && p.n.kind === 'foldable')); }
export const isCurrent = p => !!p && (Number(p.released) >= 2023 || !!p.legacy_reason || (p.released == null && !!p.released_note && !p.legacy));
export function fitsHousing(d, p, roleId) {
  const f = d && FORMS[d.form], n = p && p.n; if (!f || !n || f.foldable && roleId === 'display') return true;
  const h = d.housing, q = d.req || {}, auto = h.auto && (q.maxW || q.maxL), free = h.auto && !auto && ['display', 'display2', 'display_cover'].includes(roleId), iw = (auto ? q.maxW || 999 : h.w) - 2 * h.wall, il = (auto ? q.maxL || 999 : h.l) - 2 * h.wall, a = Math.min(n.sx || 0, n.sy || 0), b = Math.max(n.sx || 0, n.sy || 0);
  if (free) return true;
  return ['display', 'display2', 'display_cover'].includes(roleId) ? (f.axis || auto || (d.dock && d.dock.on) ? Number.isFinite(n.sx) && Number.isFinite(n.sy) && a <= iw * 1.04 && b <= il * 1.04 : true) && (roleId !== 'display_cover' || b <= Math.max(iw, il) * 0.75) : ['cell', 'cell2'].includes(roleId) ? Number.isFinite(n.sx) && ((f.halfOf || {})[roleId] === 'B' || (roleId === 'cell2' && f.axis === 'long') ? (b <= iw - 1 && a <= il - 22) || (b <= il - 22 && a <= iw - 1) : f.axis === 'short' ? b <= iw - 1 && a <= il * 0.4 : a <= iw - 1 && b <= il * 0.8) : true;
}
const BIG = new Set(['camera', 'camera_front', 'cell', 'display', 'speaker', 'receiver', 'haptic', 'som', 'soc', 'modem', 'qi_coil', 'nfc_coil', 'antenna', 'usbc', 'fingerprint', 'lpddr', 'ufs', 'magnet', 'sim', 'ntn', 'camera_aux']);
export function defaultFor(roleId, allowRef, d, pred) {
  const phys = ROLE[roleId] && ROLE[roleId].mount !== 'none' && BIG.has(ROLE[roleId].cat[0]), dimsOk = p => !phys || (p.n && [p.n.sx, p.n.sy, p.n.sz].every(Number.isFinite)), list = forRole(roleId, allowRef, d).filter(p => fitsHousing(d, p, roleId) && (!pred || pred(p))).sort((a, b) => (dimsOk(b) - dimsOk(a)) || (isCurrent(b) - isCurrent(a)) || ((Number(b.released) || 0) - (Number(a.released) || 0))), buy = list.filter(p => p.status === 'buyable');
  return (buy.find(p => p.recommended && dimsOk(p)) || list.find(p => p.recommended && p.status !== 'oem' && dimsOk(p)) || buy[0] || list[0] || null);
}
export function priceAt(p, qty) {
  const pr = (p && p.price) || {}, tiers = [[1, pr.q1], [100, pr.q100], [1000, pr.q1k]].filter(([, v]) => Number.isFinite(v));
  if (!tiers.length) return { usd: null, basis: 'no published price' };
  const exact = tiers.filter(([q]) => q <= qty).pop() || tiers[0];
  return { usd: exact[1], basis: exact[0] === qty || (qty >= 1000 && exact[0] === 1000) ? 'q' + exact[0] : 'q' + exact[0] + ' used for qty ' + qty };
}
