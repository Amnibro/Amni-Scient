import { MATERIALS, ROLES, FORMS, K } from './catalog.js';
import { forRole, part, ROLE, priceAt, isCurrent, fitsHousing } from './parts.js';
import { evaluate, normalize, applyPatch, fitDesign, roleApplies, isRequired, selected, unpinned } from './engine.js';
import { hingeType } from './hinge.js';
import { optimizePlacement } from './place.js';
export const OBJECTIVES = [
  { id: 'cost', pri: 'cost', name: 'Unit cost', unit: '$', dir: -1, scale: 50 },
  { id: 'life', pri: 'life', name: 'Screen-on', unit: 'h', dir: 1, scale: 1 },
  { id: 'mass', pri: 'mass', name: 'Mass', unit: 'g', dir: -1, scale: 20 },
  { id: 'thick', pri: 'thin', name: 'Thickness', unit: 'mm', dir: -1, scale: 0.8 },
  { id: 'perf', pri: 'perf', name: 'Performance', unit: '', dir: 1, scale: 2 },
  { id: 'camera', pri: 'camera', name: 'Camera', unit: '', dir: 1, scale: 10 },
  { id: 'durability', pri: 'durability', name: 'Durability', unit: '', dir: 1, scale: 10 },
  { id: 'screen', pri: 'screen', name: 'Screen', unit: '', dir: 1, scale: 10 },
  { id: 'rfq', pri: 'cost', name: 'Unpriced lines', unit: '', dir: -1, scale: 1.7 },
];
export const PROFILES = {
  balanced: { name: 'Balanced', text: 'Even weight on cost, battery, mass, thickness, performance, camera, screen and durability.', pri: { cost: 3, life: 3, mass: 2, thin: 2, perf: 2, camera: 2, durability: 2, screen: 2 } },
  battery: { name: 'Battery-max', text: 'Screen-on hours first; cost and mass second.', pri: { cost: 1, life: 6, mass: 1, thin: 0, perf: 1, camera: 1, durability: 1, screen: 1 } },
  thin: { name: 'Thinnest', text: 'Shut thickness first, then mass.', pri: { cost: 1, life: 1, mass: 3, thin: 6, perf: 1, camera: 1, durability: 1, screen: 1 } },
  cheap: { name: 'Cheapest', text: 'Unit cost first, with every line priced.', pri: { cost: 6, life: 1, mass: 1, thin: 1, perf: 0, camera: 0, durability: 1, screen: 1 } },
  rugged: { name: 'Rugged IP68', text: 'Durability (frame strength + ingress rating) first, then battery.', pri: { cost: 1, life: 2, mass: 0, thin: 0, perf: 1, camera: 1, durability: 6, screen: 1 } },
  camera: { name: 'Camera-first', text: 'Camera index first, then battery.', pri: { cost: 1, life: 2, mass: 1, thin: 1, perf: 1, camera: 6, durability: 1, screen: 1 } },
};
const VAR_ROLES = ['display', 'display2', 'display_cover', 'som', 'soc', 'soc_pmic', 'lpddr', 'ufs', 'modem', 'ntn', 'cell', 'cell2', 'cam_main', 'cam_ultra', 'cam_front', 'flash', 'speaker', 'haptic', 'usbc', 'nfc', 'nfc_coil', 'baro', 'gnss', 'mic2', 'hinge', 'hinge_leaf', 'hinge_pin', 'hinge_detent', 'link', 'mag_shut', 'mag_flat', 'adhesive', 'vent_spk', 'vent_mic'];
const MATS = ['al6061', 'al7075', 'ti5', 'pc', 'pa12'];
const LEAVES = [4, 4.5, 5, 6, 7, 8, 10, 12, 13.5], PINF = [1.2, 1.5, 2, 2.5, 3], HALF_ROLES = ['modem', 'ntn', 'wifi', 'gnss', 'speaker', 'haptic', 'mic2'];
export function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function pool(d, id, strict) {
  const all = forRole(id, d.req.allowRef || (FORMS[d.form].foldable && ['display', 'hinge_fold'].includes(id)), d).filter(p => fitsHousing(d, p, id) && (ROLE[id].mount === 'none' || (p.n && [p.n.sx, p.n.sy, p.n.sz].every(Number.isFinite)))), q = d.req.qty, priced = p => priceAt(p, q).usd != null;
  const s1 = all.filter(p => p.verified === true && priced(p) && isCurrent(p)), s2 = all.filter(p => p.verified === true && priced(p)), s3 = all.filter(p => p.verified === true), s4 = all.filter(p => p.status !== 'oem' || d.req.allowRef || FORMS[d.form].foldable);
  const pick = strict === false ? s4 : s1.length ? s1 : s2.length ? s2 : s3.length ? s3 : s4, why = strict === false ? null : s1.length ? null : s2.length ? 'no verified, priced part released 2023 or later: legacy parts used' : s3.length ? 'no verified part with a published price: RFQ parts used' : 'no verified part: unverified parts used';
  return { ids: pick.map(p => p.id), why };
}
export function variables(d, o) {
  const opt = o || {}, out = [], ht = hingeType(d);
  VAR_ROLES.filter(id => ROLE[id] && roleApplies(d, ROLE[id]) && !(FORMS[d.form].foldable && id === 'display') && !(opt.fixed || []).includes(id)).forEach(id => { const P = pool(d, id, opt.strict), req = isRequired(d, ROLE[id]) && id !== 'modem', cur = d.sel[id] || '', ids = [...new Set([...(req ? [] : ['']), ...P.ids, ...(opt.strict === undefined && cur && !P.ids.includes(cur) ? [cur] : [])])]; ids.length > 1 && out.push({ key: id, opts: ids, why: P.why }); });
  !(opt.fixed || []).includes('mat') && out.push({ key: 'mat', opts: MATS.filter(m => ['al6061', 'al7075', 'ti5'].includes(m) || m === d.housing.mat || (d.req.qty <= 100 && m === 'pa12')) });
  ht === 'outer' && !(opt.fixed || []).includes('leaf') && out.push({ key: 'leaf', opts: LEAVES }, { key: 'pinFace', opts: PINF }, { key: 'shutPairs', opts: [1, 2, 3, 4] }, { key: 'flatPairs', opts: [0, 1, 2] });
  FORMS[d.form].halves > 1 && HALF_ROLES.filter(id => ROLE[id] && roleApplies(d, ROLE[id]) && !(opt.fixed || []).includes(id)).forEach(id => out.push({ key: 'half:' + id, opts: ['A', 'B'] }));
  (opt.require || []).forEach(id => { const v = out.find(x => x.key === id); v && (v.opts = v.opts.filter(x => x !== '')); });
  d.system && d.system.arch === 'companion' && d.system.B && !opt.inner && variables(d.system.B, { ...opt, inner: true, fixed: opt.fixedB || [], require: opt.requireB || [] }).forEach(v => out.push({ ...v, key: 'B.' + v.key }));
  return out.filter(v => v.opts.length > 1);
}
const HK = ['leaf', 'pinFace', 'shutPairs', 'flatPairs'];
const subB = d => d.system && d.system.B;
const halfOf = (d, id) => (d.pos[id] && d.pos[id].half) || ((FORMS[d.form].halfOf || {})[id]) || ROLE[id].half || 'A';
export const valueOf = (d, key) => key.startsWith('B.') ? valueOf(subB(d), key.slice(2)) : key.startsWith('half:') ? halfOf(d, key.slice(5)) : key === 'mat' ? d.housing.mat : HK.includes(key) ? d.hinge[key] : d.sel[key] == null ? '' : d.sel[key];
const patchOf = (key, val, d) => key.startsWith('B.') ? { system: { ...d.system, B: applyPatch(subB(d), patchOf(key.slice(2), val, subB(d))) } } : key.startsWith('half:') ? { pos: { [key.slice(5)]: { half: val, x: null, y: null } } } : key === 'mat' ? { housing: { mat: val }, keepBoard: true } : key === 'leaf' ? { hinge: { leaf: val, inset: Math.max(d.hinge.pinD / 2 + K.pinMargin + 0.1, Math.round((val - 0.8) / 2 * 100) / 100) } } : HK.includes(key) ? { hinge: { [key]: val } } : { sel: { [key]: val } };
const strip = d => { const x = applyPatch(d, { pos: unpinned(d.pos), board: { poly: null, z: null } }); return x.system && x.system.B ? { ...x, system: { ...x.system, B: applyPatch(x.system.B, { pos: unpinned(x.system.B.pos), board: { poly: null, z: null } }) } } : x; };
export function candidate(base, key, val) { return fitDesign(strip(applyPatch(base, patchOf(key, val, base)))); }
export function fromGenome(base, vars, g) { let d = base; vars.forEach((v, i) => { d = applyPatch(d, patchOf(v.key, v.opts[g[i]], d)); }); return fitDesign(strip(d)); }
export function targets(res) { const q = res.d.req; return { price: res.obj.cost - q.price, life: q.life - res.obj.life, mass: res.obj.mass - q.mass, thick: res.obj.thick - q.thick, ...(q.maxW ? { maxW: res.g.w - q.maxW } : {}), ...(q.maxL ? { maxL: res.g.l - q.maxL } : {}), ...(q.ip === 'ip68' && res.depth ? { depth: q.depth - res.depth.depth } : {}) }; }
const MISS = { price: 50, life: 1, mass: 20, thick: 0.8, maxW: 1, maxL: 1, depth: 1 };
export function missing(res) { return Object.entries(targets(res)).filter(([, v]) => v > 1e-6).map(([k]) => k); }
export function feasible(res) { return res.errors === 0 && missing(res).length === 0; }
export function violation(res) { return res.errors * 10 + Object.entries(targets(res)).reduce((n, [k, v]) => n + Math.max(0, v) / MISS[k], 0); }
export function utility(obj, pri) { return OBJECTIVES.reduce((n, o) => n + (pri[o.pri] || 0) * o.dir * (obj[o.id] || 0) / o.scale, 0); }
export function score(res) { const pri = res.d.req.pri, sw = Math.max(1, OBJECTIVES.reduce((n, o) => n + (pri[o.pri] || 0), 0)); return utility(res.obj, pri) - Object.entries(targets(res)).reduce((n, [k, v]) => n + Math.max(0, v) / MISS[k], 0) * sw * 2 - missing(res).length * sw * 0.5 - res.errors * 1e3; }
export function dominates(a, b) { let better = false; for (const o of OBJECTIVES) { const da = o.dir * (a[o.id] || 0), db = o.dir * (b[o.id] || 0); if (da < db - 1e-9) return false; da > db + 1e-9 && (better = true); } return better; }
const cdom = (a, b) => a.v === 0 && b.v > 0 ? true : a.v > 0 && b.v === 0 ? false : a.v > 0 && b.v > 0 ? a.v < b.v - 1e-9 : dominates(a.obj, b.obj);
export function paretoFront(items) { return items.filter(a => !items.some(b => b !== a && dominates(b.obj, a.obj))); }
function sortFronts(P) {
  const S = P.map(() => []), n = P.map(() => 0), fronts = [[]];
  P.forEach((p, i) => P.forEach((q, j) => { i !== j && (cdom(p, q) ? S[i].push(j) : cdom(q, p) && n[i]++); }) || (n[i] === 0 && (p.rank = 0, fronts[0].push(i))));
  for (let k = 0; fronts[k].length; k++) { const nx = []; fronts[k].forEach(i => S[i].forEach(j => { --n[j] === 0 && (P[j].rank = k + 1, nx.push(j)); })); fronts.push(nx); }
  return fronts.filter(f => f.length).map(f => f.map(i => P[i]));
}
function crowd(F) { F.forEach(p => { p.cd = 0; }); OBJECTIVES.forEach(o => { const s = F.slice().sort((a, b) => (a.obj[o.id] || 0) - (b.obj[o.id] || 0)), lo = s[0].obj[o.id] || 0, hi = s[s.length - 1].obj[o.id] || 0; s[0].cd = s[s.length - 1].cd = Infinity; for (let i = 1; i < s.length - 1; i++) s[i].cd += hi > lo ? ((s[i + 1].obj[o.id] || 0) - (s[i - 1].obj[o.id] || 0)) / (hi - lo) : 0; }); }
const label = (key, v) => key.startsWith('B.') ? label(key.slice(2), v) : key.startsWith('half:') ? 'half ' + v : key === 'mat' ? MATERIALS[v].name : key === 'leaf' ? v + ' mm leaf' : key === 'pinFace' ? 'pins ' + v + ' mm under the face' : key === 'shutPairs' ? v + ' closing pair(s)' : key === 'flatPairs' ? v + ' flat pair(s)' : v === '' ? 'none' : (p => p ? p.mfr + ' ' + p.mpn : v)(part(v));
export function deltas(a, b) { return OBJECTIVES.map(o => ({ id: o.id, name: o.name, unit: o.unit, d: (b[o.id] || 0) - (a[o.id] || 0), better: o.dir * ((b[o.id] || 0) - (a[o.id] || 0)) > 1e-9 })).filter(x => Math.abs(x.d) > 1e-6); }
function deltaText(a, b, noCost) {
  const out = [], f = (v, u, k) => (v > 0 ? '+' : '−') + (u === '$' ? '$' + Math.abs(v).toFixed(k) : Math.abs(v).toFixed(k) + u);
  Math.abs(b.life - a.life) >= 0.05 && out.push(f(b.life - a.life, ' h screen-on', 1));
  !noCost && Math.abs(b.cost - a.cost) >= 0.5 && out.push(f(b.cost - a.cost, '$', 0));
  Math.abs(b.mass - a.mass) >= 0.5 && out.push(f(b.mass - a.mass, ' g', 0));
  Math.abs(b.thick - a.thick) >= 0.05 && out.push(f(b.thick - a.thick, ' mm', 2));
  Math.abs(b.perf - a.perf) >= 0.1 && out.push(f(b.perf - a.perf, ' perf', 1));
  Math.abs(b.camera - a.camera) >= 1 && out.push(f(b.camera - a.camera, ' camera', 0));
  Math.abs(b.durability - a.durability) >= 1 && out.push(f(b.durability - a.durability, ' durability', 0));
  Math.abs((b.screen || 0) - (a.screen || 0)) >= 1 && out.push(f((b.screen || 0) - (a.screen || 0), ' screen', 0));
  Math.abs((b.rfq || 0) - (a.rfq || 0)) >= 1 && out.push(f((b.rfq || 0) - (a.rfq || 0), ' unpriced', 0));
  return out.join(', ') || 'no measurable change';
}
export function optimize(src, opts) {
  const o = { pop: 16, gens: 6, seed: 7, strict: true, polish: true, ...(opts || {}) }, t0 = Date.now(), rnd = mulberry(o.seed);
  const base = fitDesign(normalize(src)), vars = variables(base, o), archive = new Map(), fallbacks = vars.filter(v => v.why).map(v => ({ key: v.key, why: v.why }));
  let evals = 0;
  const keyG = g => g.join('.');
  const run = g => { const k = keyG(g); let hit = archive.get(k); if (!hit) { let d = fromGenome(base, vars, g), res = evaluate(d, { fixes: false }); evals++; if (o.place && res.errors > 0) { const pl = optimizePlacement(d, { iters: o.placeIters || 2500, seed: o.seed }); pl.applied && (d = pl.d, res = evaluate(d, { fixes: false })); } hit = { g: g.slice(), d: res.d, res, obj: res.obj, score: score(res), v: violation(res), ok: feasible(res) }; archive.set(k, hit); } return hit; };
  const idx = (v, val) => Math.max(0, v.opts.findIndex(x => String(x) === String(val)));
  const g0 = vars.map(v => idx(v, valueOf(base, v.key))), gRec = vars.map((v, i) => { const r = v.opts.map(id => part(id)).findIndex(p => p && p.recommended); return r >= 0 ? r : g0[i]; });
  const randG = () => vars.map(v => Math.floor(rnd() * v.opts.length));
  let P = [run(g0), run(gRec)];
  while (P.length < o.pop) P.push(run(randG()));
  const better = (a, b) => cdom(a, b) ? a : cdom(b, a) ? b : (a.rank ?? 0) < (b.rank ?? 0) ? a : (b.rank ?? 0) < (a.rank ?? 0) ? b : (a.cd ?? 0) >= (b.cd ?? 0) ? a : b;
  const tour = () => better(P[Math.floor(rnd() * P.length)], P[Math.floor(rnd() * P.length)]);
  sortFronts(P).forEach(crowd);
  for (let gen = 0; gen < o.gens; gen++) {
    const kids = [];
    while (kids.length < o.pop) { const a = tour(), b = tour(), c = a.g.map((x, i) => rnd() < 0.5 ? x : b.g[i]); let mut = false; c.forEach((x, i) => { rnd() < 1 / Math.max(1, vars.length) && (c[i] = Math.floor(rnd() * vars[i].opts.length), mut = true); }); if (!mut && vars.length) { const i = Math.floor(rnd() * vars.length); c[i] = Math.floor(rnd() * vars[i].opts.length); } kids.push(run(c)); }
    const R = [...new Set([...P, ...kids])], F = sortFronts(R), next = [];
    for (const f of F) { crowd(f); if (next.length + f.length <= o.pop) next.push(...f); else { next.push(...f.sort((a, b) => b.cd - a.cd).slice(0, o.pop - next.length)); break; } }
    P = next;
    o.onProgress && o.onProgress({ gen: gen + 1, gens: o.gens, evals, best: Math.max(...P.map(p => p.score)), feasible: P.filter(p => p.ok).length });
  }
  const pickBest = () => { const all = [...archive.values()], pool0 = all.filter(x => x.ok).length ? all.filter(x => x.ok) : all.filter(x => x.res.errors === 0).length ? all.filter(x => x.res.errors === 0) : all, fr = paretoFront(pool0); return { fr, best: fr.reduce((a, b) => b.score > a.score ? b : a), pool0, all }; };
  let B = pickBest();
  if (o.polish) { let cur = B.best; for (let s = 0; s < 3; s++) { let moved = false; vars.forEach((v, i) => v.opts.forEach((_, j) => { if (j === cur.g[i]) return; const c = cur.g.slice(); c[i] = j; const h = run(c); (h.v < cur.v - 1e-9 || (Math.abs(h.v - cur.v) < 1e-9 && h.score > cur.score + 1e-9)) && (cur = h, moved = true); })); if (!moved) break; } B = pickBest(); }
  const placed = dd => { if (!o.place) return dd; const r0 = evaluate(dd, { fixes: false }); if (!r0.errors) return dd; const pl = optimizePlacement(dd, { iters: o.placeIters || 2500, seed: o.seed }); return pl.applied ? pl.d : dd; };
  const fresh = d0 => placed(fitDesign(strip(d0))), cand = (d0, key, val) => { const dd = placed(candidate(d0, key, val)), res = evaluate(dd, { fixes: false }); evals++; return { key, val, d: res.d, res, obj: res.obj, score: score(res), v: violation(res), ok: feasible(res) }; };
  const neighbors = d0 => vars.flatMap(v => v.opts.filter(val => String(val) !== String(valueOf(d0, v.key))).map(val => cand(d0, v.key, val)).filter(n => String(valueOf(n.d, n.key)) === String(n.val)));
  let bd = fresh(B.best.d), br = evaluate(bd, { fixes: false }), cur0 = { d: br.d, res: br, obj: br.obj, score: score(br), v: violation(br), ok: feasible(br) }, N = [], repairs = 0;
  for (let it = 0; it < 8; it++) { N = neighbors(cur0.d); const dom = N.filter(n => n.ok && dominates(n.obj, cur0.obj)); if (!dom.length) break; const nx = dom.reduce((a, b2) => b2.score > a.score ? b2 : a), fd = fresh(nx.d), fr = evaluate(fd, { fixes: false }); cur0 = { d: fr.d, res: fr, obj: fr.obj, score: score(fr), v: violation(fr), ok: feasible(fr) }; repairs++; }
  const best = cur0, front = B.fr, cur = run(g0);
  const extremes = OBJECTIVES.map(ob => { const pick = front.reduce((a, b) => (ob.dir * (b.obj[ob.id] || 0) > ob.dir * (a.obj[ob.id] || 0) + 1e-9 || (Math.abs((b.obj[ob.id] || 0) - (a.obj[ob.id] || 0)) < 1e-9 && b.score > a.score)) ? b : a, front[0]); return pick ? { id: ob.id, name: ob.name, d: pick.d, obj: pick.obj, score: pick.score } : null; }).filter(Boolean);
  const unp = (res, id) => res.cost.rows.some(x => x.pid === id && x.usd == null);
  const explain = vars.map(v => { const alts = N.filter(n => n.key === v.key); if (!alts.length) return null; const r = alts.reduce((a, b) => (b.v < a.v - 1e-9 || (Math.abs(b.v - a.v) < 1e-9 && b.score > a.score)) ? b : a); const chosen = valueOf(best.d, v.key), miss = [...(r.res.errors ? ['does not fit / has errors'] : missing(r.res).map(k => ({ price: 'over cost target', life: 'misses battery target', mass: 'over mass', thick: 'too thick', maxW: 'wider than the cap', maxL: 'longer than the cap', depth: 'shallower depth rating' }[k]))), ...(!['mat', ...HK].includes(v.key) && !v.key.startsWith('half:') && r.val && unp(r.res, r.val) ? ['has no published price'] : [])], cu = !['mat', ...HK].includes(v.key) && !v.key.startsWith('half:') && chosen && unp(best.res, chosen), cp = part(chosen); return { key: v.key, role: v.key.startsWith('B.') ? 'Piece B: ' + (ROLE[v.key.slice(2)] ? ROLE[v.key.slice(2)].name : v.key.slice(2)) : v.key.startsWith('half:') ? ROLE[v.key.slice(5)].name + ' placement' : ROLE[v.key] ? ROLE[v.key].name : ({ mat: 'Housing material', leaf: 'Leaf length', pinFace: 'Pin depth', shutPairs: 'Closing magnets', flatPairs: 'Flat magnets' })[v.key], chosen, chosenLabel: label(v.key, chosen), alt: r.val, altLabel: label(v.key, r.val), margin: best.score - r.score, deltas: deltas(r.obj, best.obj), altObj: r.obj, options: v.opts.length, fallback: v.why || null, legacy: !!(cp && !isCurrent(cp)), rfq: !!cu, text: `${label(v.key, chosen)} over ${label(v.key, r.val)}: ${deltaText(r.obj, best.obj, cu || miss.includes('has no published price'))}` + (miss.length ? ` (runner-up ${miss.join(', ')})` : '') + (cu ? ' (chosen part has no published price, so cost is not compared)' : '') }; }).filter(Boolean).sort((a, b) => b.margin - a.margin);
  const names = { price: 'unit-cost target', life: 'battery-life target', mass: 'mass limit', thick: 'thickness limit', maxW: 'width cap', maxL: 'length cap', depth: 'depth rating target' }, units = { price: ' USD', life: ' h', mass: ' g', thick: ' mm', maxW: ' mm', maxL: ' mm', depth: ' m' };
  const binding = [...Object.entries(targets(best.res)).filter(([k, v]) => v > -({ price: 25, life: 0.3, mass: 8, thick: 0.3, maxW: 1, maxL: 1, depth: 1 }[k])).map(([k, v]) => ({ id: k, kind: 'target', text: v > 0 ? `The ${names[k]} is missed by ${Math.abs(v).toFixed(['thick', 'maxW', 'maxL'].includes(k) ? 2 : k === 'life' ? 1 : 0)}${units[k]} even at the best design found.` : `The ${names[k]} binds (${Math.abs(v).toFixed(['thick', 'maxW', 'maxL'].includes(k) ? 2 : k === 'life' ? 1 : 0)}${units[k]} slack).` })), ...(Math.abs(best.d.housing.t - best.res.tFit) < 0.06 ? [{ id: 'floor', kind: 'engineering', text: `Housing thickness ${best.d.housing.t} mm sits on the stack floor (tallest part + cell swell + display + glass).` }] : []), ...(best.res.sw && best.res.G && best.res.G.outer && best.res.sw.minClear < 0.5 ? [{ id: 'swing', kind: 'engineering', text: `Hinge swing clearance ${best.res.sw.minClear.toFixed(2)} mm at ${best.res.sw.at}° limits a shorter leaf.` }] : []), ...fallbacks.map(f => ({ id: 'pool-' + f.key, kind: 'sourcing', text: `${ROLE[f.key] ? ROLE[f.key].name : f.key}: ${f.why}.` }))];
  return { best: best.d, res: evaluate(best.d), score: best.score, ok: best.ok, repairs, baseline: { obj: cur.obj, score: cur.score, ok: cur.ok }, improvement: deltaText(cur.obj, best.obj), front: front.map(x => ({ d: x.d, obj: x.obj, score: x.score })), cloud: [...archive.values()].map(x => ({ obj: x.obj, ok: x.ok, score: x.score })), extremes, explain, binding, fallbacks, evals, archive: archive.size, frontSize: front.length, feasibleCount: B.pool0.filter(x => x.ok).length, vars: vars.map(v => ({ key: v.key, n: v.opts.length })), space: vars.reduce((n, v) => n * v.opts.length, 1), seed: o.seed, pop: o.pop, gens: o.gens, ms: Date.now() - t0 };
}
export function paretoCheck(src, opts) {
  const o = { strict: true, ...(opts || {}) }, pl = dd => { if (!o.place) return dd; const r = evaluate(dd, { fixes: false }); if (!r.errors) return dd; const x = optimizePlacement(dd, { iters: o.placeIters || 2500, seed: o.seed || 7 }); return x.applied ? x.d : dd; }, base = o.keepLayout ? fitDesign(normalize(src)) : pl(fitDesign(strip(normalize(src)))), r0 = evaluate(base, { fixes: false }), vars = variables(base, o), dom = [];
  let n = 0;
  vars.forEach(v => v.opts.forEach(val => { if (String(val) === String(valueOf(base, v.key))) return; const r = evaluate(pl(candidate(base, v.key, val)), { fixes: false }); n++; feasible(r) && dominates(r.obj, r0.obj) && dom.push({ key: v.key, val, obj: r.obj }); }));
  return { ok: dom.length === 0, dominated: dom, checked: n, obj: r0.obj, feasible: feasible(r0) };
}
