import { K } from './catalog.js';
import { db, priceAt } from './parts.js';
const fin = v => typeof v === 'number' && Number.isFinite(v), r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
export const HDI = { through: { name: 'Through-hole vias only', micro: false, stacked: false, mult: 1 }, '1+N+1': { name: '1+N+1 HDI (one laser build-up per side)', micro: true, stacked: false, mult: 1.6 }, '2+N+2': { name: '2+N+2 HDI (stacked microvias)', micro: true, stacked: true, mult: 2.3 }, any: { name: 'Any-layer HDI', micro: true, stacked: true, mult: 3.2 } };
export const DEF_MAT = { core: { name: 'FR-4 core (typical S1000-2M class)', dk: 4.3, t: 0.1 }, pp: { name: 'Prepreg 1080 (typical)', dk: 3.9, t: 0.075 }, rcc: { name: 'Laser-drillable prepreg 1067 / RCC (typical)', dk: 3.7, t: 0.05 }, cuOuter: 0.035, cuInner: 0.018, basis: 'Typical values when no fab stack-up is loaded; replace with the fab’s published stack-up.' };
export const DEF_FAB = { id: 'generic-hdi', name: 'Generic HDI fab (typical)', tier: 'hdi', layers_max: 12, min_trace_mm: 0.075, min_space_mm: 0.075, min_drill_mm: 0.15, laser_via_mm: 0.1, microvia_pad_mm: 0.25, stacked_microvias: true, min_bga_pitch_mm: 0.35, source: [], notes: 'Typical HDI capability; not a quote.' };
export const TARGETS = [{ id: 'se50', name: '50 Ω single-ended (RF, clocks)', z: 50, diff: false }, { id: 'usb90', name: '90 Ω differential (USB 2/3)', z: 90, diff: true }, { id: 'pcie85', name: '85 Ω differential (PCIe)', z: 85, diff: true }, { id: 'mipi100', name: '100 Ω differential (MIPI D-PHY, UFS M-PHY)', z: 100, diff: true }, { id: 'ddr40', name: '40 Ω single-ended (LPDDR5 DQ/CA)', z: 40, diff: false }];
export function fabs() { const f = (db().fabs || []).filter(x => x && x.id); return f.length ? f : [DEF_FAB]; }
export function fabOf(id) { return fabs().find(f => f.id === id) || fabs().find(f => f.tier !== 'standard') || fabs()[0]; }
const PREF = { rcc: ['jlc-hdi-pp-sy-106-rc72', 'isola-fr408hr-pp-106-rc70'], prepreg: ['jlc-hdi-pp-sy-1080-rc69', 'jlc-prepreg-1080'], core: ['jlc-core-fr4'] };
const matPick = kind => { const M = db().materials || [], m = (PREF[kind] || []).map(id => M.find(x => x.id === id)).find(x => x && fin(x.dk)) || M.find(x => x.kind === kind && fin(x.dk) && fin(x.thickness_mm)); return m ? { name: m.name + (fin(m.thickness_mm) ? '' : ' (0.10 mm assumed)'), dk: m.dk, t: fin(m.thickness_mm) ? m.thickness_mm : 0.1, src: (m.source || [])[0] } : null; };
export function stackup(layers, hdi) {
  const n = Math.max(2, Math.round(layers / 2) * 2), h = HDI[hdi] ? hdi : 'through', core = matPick('core') || DEF_MAT.core, pp = matPick('prepreg') || DEF_MAT.pp, rcc = matPick('rcc') || matPick('prepreg') || DEF_MAT.rcc;
  const build = h === 'any' ? n / 2 - 1 : h === '2+N+2' ? 2 : h === '1+N+1' ? 1 : 0, rows = [];
  for (let i = 1; i <= n; i++) { const outer = i === 1 || i === n; rows.push({ kind: 'cu', name: 'L' + i, t: outer ? DEF_MAT.cuOuter : DEF_MAT.cuInner, role: outer ? 'signal' : i === 2 || i === n - 1 ? 'plane' : i % 2 ? 'signal' : 'plane' }); if (i < n) { const fromOuter = Math.min(i, n - i), bu = fromOuter <= build, isCore = !bu && (h === 'through' ? i % 2 === 0 : (i - build) % 2 === 1); const m = bu ? rcc : isCore ? core : pp; rows.push({ kind: bu ? 'build-up' : isCore ? 'core' : 'prepreg', name: m.name, t: m.t, dk: m.dk, src: m.src || null }); } }
  const total = rows.reduce((s, r) => s + r.t, 0), sig = rows.filter(r => r.kind === 'cu' && r.role === 'signal').length;
  return { layers: n, hdi: h, rows, total: r3(total), signal: sig, planes: n - sig, build, basis: matPick('core') ? 'Fab-published materials (pcb-fab.json)' : DEF_MAT.basis };
}
export const zMicro = (w, h, t, er) => 87 / Math.sqrt(er + 1.41) * Math.log(5.98 * h / (0.8 * w + t));
export const zStrip = (w, b, t, er) => 60 / Math.sqrt(er) * Math.log(1.9 * b / (0.8 * w + t));
export const zDiffMicro = (z0, s, h) => 2 * z0 * (1 - 0.48 * Math.exp(-0.96 * s / h));
export const zDiffStrip = (z0, s, b) => 2 * z0 * (1 - 0.374 * Math.exp(-2.9 * s / b));
export function solveWidth(target, geom, fab) {
  const f = fab || DEF_FAB, Z = w => { const s = Math.max(f.min_space_mm, w); const z0 = geom.micro ? zMicro(w, geom.h, geom.t, geom.er) : zStrip(w, geom.b, geom.t, geom.er); return target.diff ? (geom.micro ? zDiffMicro(z0, s, geom.h) : zDiffStrip(z0, s, geom.b)) : z0; };
  const tries = target.diff ? [1, 1.5, 2, 3] : [1];
  for (const k of tries) { const Zk = w => { const s = Math.max(f.min_space_mm, w * k); const z0 = geom.micro ? zMicro(w, geom.h, geom.t, geom.er) : zStrip(w, geom.b, geom.t, geom.er); return target.diff ? (geom.micro ? zDiffMicro(z0, s, geom.h) : zDiffStrip(z0, s, geom.b)) : z0; }; let lo = 0.01, hi = 1.5; if (Zk(lo) < target.z) continue; if (Zk(hi) > target.z) return { w: hi, z: r2(Zk(hi)), why: 'needs a wider trace than 1.5 mm' }; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; Zk(m) > target.z ? (lo = m) : (hi = m); } const w = (lo + hi) / 2; if (w >= f.min_trace_mm - 1e-9 || k === tries[tries.length - 1]) return { w: r3(w), s: r3(Math.max(f.min_space_mm, w * k)), z: r2(Zk(w)), ok: w >= f.min_trace_mm - 1e-9 }; }
  return { w: null, z: null, why: 'target unreachable on this geometry' };
}
export function impedance(st, fab) {
  const rows = st.rows, cu = rows.map((r, i) => ({ ...r, i })).filter(r => r.kind === 'cu'), out = [];
  const outer = cu[0], inner = cu.find((c, k) => k > 0 && k < cu.length - 1 && c.role === 'signal'), diel = (i0, i1) => rows.slice(i0 + 1, i1).filter(r => r.kind !== 'cu'), cuIn = (i0, i1) => rows.slice(i0 + 1, i1).filter(r => r.kind === 'cu').reduce((s, r) => s + r.t, 0), avg = ds => ds.reduce((s, r) => s + r.dk * r.t, 0) / Math.max(1e-9, ds.reduce((s, r) => s + r.t, 0)), sum = ds => ds.reduce((s, r) => s + r.t, 0);
  const micro = skip => { const ref = cu[1 + skip], ds = diel(outer.i, ref.i); return { layer: outer.name, ref: ref.name, micro: true, h: sum(ds) + cuIn(outer.i, ref.i), t: outer.t, er: avg(ds), skip }; };
  const strip = skip => { const up = cu[Math.max(0, cu.indexOf(inner) - 1 - skip)], dn = cu[Math.min(cu.length - 1, cu.indexOf(inner) + 1 + skip)], ds = [...diel(up.i, inner.i), ...diel(inner.i, dn.i)]; return { layer: inner.name, ref: up.name + '/' + dn.name, micro: false, b: sum(ds) + cuIn(up.i, inner.i) + cuIn(inner.i, dn.i) + inner.t, t: inner.t, er: avg(ds), skip }; };
  TARGETS.forEach(tg => [micro, ...(inner ? [strip] : [])].forEach(fn => { let g = fn(0), sol = solveWidth(tg, g, fab); !sol.ok && cu.length > 4 && (g = fn(1), sol = solveWidth(tg, g, fab)); out.push({ target: tg.id, name: tg.name, layer: g.layer, ref: g.ref, type: (g.micro ? 'microstrip' : 'stripline') + (g.skip ? ', skip-layer reference' : ''), ...sol }); }));
  return { rows: out, basis: 'IPC-2141 closed-form microstrip/stripline and edge-coupled differential approximations (±5–10%). When the adjacent plane forces a trace below the fab minimum, the next plane down is used as reference (the adjacent plane is voided under the trace), as phone HDI boards do. Have the fab run its field solver on the final stack-up.' };
}
export function fanout(p, fab, hdi) {
  const f = fab || DEF_FAB, pitch = p && fin(p.pitch) ? p.pitch : null, balls = p && fin(p.balls) ? p.balls : null;
  if (!pitch) return { ok: null, why: 'Ball pitch not published', pitch, balls };
  const pad = r3(pitch * 0.55), ch = Math.max(0, Math.floor((pitch - pad - f.min_space_mm) / (f.min_trace_mm + f.min_space_mm))), side = balls ? Math.ceil(Math.sqrt(balls)) : null, rings = side ? Math.ceil(side / 2 * 0.6) : null, perLayer = ch + 1, layers = rings ? Math.ceil(rings / perLayer) : null;
  const through = pitch * Math.SQRT2 - pad >= (f.min_drill_mm + 0.2) + 2 * f.min_space_mm;
  const via = pitch >= 0.65 && through ? 'dog-bone through vias' : pitch >= 0.5 ? 'via-in-pad (filled, capped) or microvias' : pitch >= 0.4 ? 'laser microvia in pad (HDI ≥ 1+N+1)' : 'stacked laser microvias (2+N+2 or any-layer)';
  const needHdi = pitch < 0.5 ? (pitch < 0.4 ? '2+N+2' : '1+N+1') : 'through', order = ['through', '1+N+1', '2+N+2', 'any'];
  const fabOk = (!fin(f.min_bga_pitch_mm) || pitch >= f.min_bga_pitch_mm - 1e-9) && (!(pitch < 0.5) || fin(f.laser_via_mm)), stackOk = order.indexOf(hdi) >= order.indexOf(needHdi);
  return { ok: fabOk && stackOk, pitch, balls, pad, channels: ch, rings, perLayer, layers, via, needHdi, fabOk, stackOk, why: !fabOk ? `${f.name} lists ${f.min_bga_pitch_mm} mm minimum BGA pitch` : !stackOk ? `${pitch} mm pitch needs ${needHdi} or better` : null };
}
export function interfaces(res) {
  const it = id => res.items.find(i => i.role === id), host = it('som') || it('soc') || it('mcu'), s = (host && host.p.specs) || {}, n = (host && host.p.n) || {}, cnt = v => { const m = String(v || '').split(/[;(]/)[0].match(/(\d+)\s*x/i); return m ? Number(m[1]) : fin(v) ? v : null; };
  const disp = res.items.filter(i => (i.cat === 'display' || i.cat === 'display_ref') && !i.uid.endsWith('#B')), cams = res.items.filter(i => i.cat === 'camera' || i.cat === 'camera_front'), i2c = res.items.filter(i => ['sensor', 'charger', 'fuel_gauge', 'usb_pd', 'haptic_drv', 'nfc', 'qi_rx', 'protection', 'flash'].includes(i.cat) && i.role !== 'flash'), modem = it('modem'), wifi = it('wifi');
  const usbNeed = 1 + (modem && /usb/i.test(String(modem.p.n.ifc || 'usb')) ? 1 : 0), pcieNeed = (modem && /pcie/i.test(String(modem.p.n.ifc || '')) && !/usb/i.test(String(modem.p.n.ifc || '')) ? 1 : 0) + (wifi && /pcie/i.test(String(wifi.p.n.ifc || '')) ? 1 : 0);
  const rows = [
    { id: 'dsi', name: 'MIPI DSI ports', need: disp.length, have: n.dsiPorts || cnt(s.mipi_dsi), detail: disp.map(x => (x.p.n.lanes || '?') + '-lane ' + x.p.mpn).join(', ') },
    { id: 'dsiL', name: 'DSI lanes per port', need: Math.max(0, ...disp.map(x => x.p.n.lanes || 0)), have: n.dsi || null },
    { id: 'csi', name: 'MIPI CSI ports', need: cams.length, have: n.csiPorts || cnt(s.mipi_csi), detail: cams.map(c => (c.p.n.lanes || '?') + '-lane ' + c.p.mpn).join(', ') },
    { id: 'usb', name: 'USB 2/3 controllers', need: usbNeed, have: n.usb || cnt(s.usb) || (fin(s.usb3) || fin(s.usb2) ? (s.usb3 || 0) + (s.usb2 || 0) : null), detail: 'Type-C' + (usbNeed > 1 ? ' + cellular modem' : '') },
    { id: 'pcie', name: 'PCIe ports', need: pcieNeed, have: cnt(s.pcie), detail: [modem && /pcie/i.test(String(modem.p.n.ifc || '')) ? 'modem' : '', wifi && /pcie/i.test(String(wifi.p.n.ifc || '')) ? 'Wi-Fi' : ''].filter(Boolean).join(', ') },
    { id: 'i2c', name: 'I²C buses (≤ 8 devices each)', need: Math.ceil(i2c.length / 8), have: fin(s.i2c) ? s.i2c : null, detail: i2c.length + ' devices: ' + i2c.map(x => x.p.mpn).slice(0, 8).join(', ') + (i2c.length > 8 ? '…' : '') },
    { id: 'i2s', name: 'I²S / audio ports', need: res.items.filter(i => ['speaker', 'receiver'].includes(i.role)).length ? 1 : 0, have: fin(s.i2s) ? s.i2s : null },
    { id: 'uart', name: 'UARTs', need: (it('gnss') ? 1 : 0) + 1, have: fin(s.uart) ? s.uart : null, detail: (it('gnss') ? 'GNSS + ' : '') + 'debug console' },
    { id: 'gpio', name: 'GPIOs (keys, IRQs, resets, enables)', need: res.items.filter(i => i.cat === 'button').length + i2c.length + disp.length * 2 + cams.length * 2 + 6, have: fin(s.gpio) ? s.gpio : null },
  ].map(r => ({ ...r, ok: r.have == null ? null : r.need <= r.have }));
  return { host: host ? host.p : null, rows, basis: 'Needs counted from the chosen parts; availability from the module or SoC datasheet fields (null = not published).' };
}
const LPDDR_W = 0.45, UFS_W = 0.3;
export function powerTree(res) {
  const it = id => res.items.find(i => i.role === id), host = it('som') || it('soc') || it('mcu'), custom = !!it('soc'), tdp = host ? (fin(host.p.n.wMax) ? host.p.n.wMax : fin((host.p.specs || {}).tdp_w) ? host.p.specs.tdp_w : 5) : 5, cams = res.items.filter(i => i.cat === 'camera' || i.cat === 'camera_front'), disp = res.items.filter(i => i.cat === 'display' && !i.uid.endsWith('#B')), eff = 0.88;
  const R = (name, v, w, from, seq, note) => ({ name, v, w: r3(w), a: r3(w / v / eff), from, seq, note });
  const rails = custom ? [R('VDD_CPU_BIG', 0.8, tdp * 0.35, 'PMIC buck 1–2 (multiphase)', 2), R('VDD_CPU_LIT', 0.75, tdp * 0.1, 'PMIC buck 3', 2), R('VDD_GPU', 0.8, tdp * 0.25, 'PMIC buck 4', 2), R('VDD_NPU', 0.8, tdp * 0.1, 'PMIC buck 5', 2), R('VDD_LOGIC / CORE', 0.75, tdp * 0.1, 'PMIC buck 6', 1), R('LPDDR VDD2H/VDD2L', 1.05, LPDDR_W * 0.6, 'PMIC buck', 3), R('LPDDR VDDQ', 0.5, LPDDR_W * 0.3, 'PMIC buck', 4), R('LPDDR VDD1', 1.8, LPDDR_W * 0.1, 'PMIC LDO', 3), R('UFS VCC', 2.5, UFS_W * 0.7, 'PMIC LDO', 5), R('UFS VCCQ', 1.2, UFS_W * 0.3, 'PMIC LDO', 5), R('VIO 1V8', 1.8, 0.1, 'PMIC LDO', 1)] : [R('Module VBAT/VSYS', 3.8, tdp, 'charger VSYS → module (on-module PMIC)', 1, 'The module generates its own rails')];
  cams.forEach((c, i) => rails.push(R(`CAM${i} AVDD 2V8 / DVDD 1V1 / DOVDD 1V8`, 1.8, fin(c.p.n.wTyp) ? c.p.n.wTyp : 0.25, 'LDOs', 6)));
  disp.forEach((x, i) => rails.push(R(`DISP${i} VCI/VDDI + ELVDD/ELVSS`, 3.0, fin(x.p.n.wTyp) ? x.p.n.wTyp : 0.35, 'panel PMIC on the FPC / boost', 6)));
  it('modem') && rails.push(R('Modem VBAT (peaks ≈ 2 A)', 3.8, fin(it('modem').p.n.wMax) ? it('modem').p.n.wMax : 2.5, 'VSYS direct', 7, 'size bulk capacitance for transmit bursts'));
  const total = rails.reduce((s, r) => s + r.w, 0), decaps = rails.map(r => ({ rail: r.name, small: Math.max(2, Math.ceil(r.a * 6)), bulk: Math.max(1, Math.ceil(r.a)) }));
  return { rails, total: r3(total), vsysA: r3(total / 3.8 / eff), decaps, caps: decaps.reduce((s, x) => s + x.small + x.bulk, 0), capArea: r2(decaps.reduce((s, x) => s + x.small * 0.45 + x.bulk * 1.2, 0)), custom, basis: custom ? 'Rail split of SoC TDP by block is an estimate (35% big cores, 25% GPU, 10% little, NPU, logic); LPDDR ≈ 0.45 W and UFS ≈ 0.3 W active. Sequence: core/logic → CPU/GPU → LPDDR VDD1 → VDD2 → VDDQ → IO, per typical Arm SoC hardware guides; confirm against the SoC guide. Decoupling: ≈6 small caps per amp plus one bulk per amp (heuristic).' : 'Module path: the module carries its own PMIC; the carrier only supplies VSYS and peripheral rails.' };
}
export function routing(res, st) {
  const it = id => res.items.find(i => i.role === id), area = res.board && res.board.poly ? polyA(res.board.poly) : 1000, ifc = interfaces(res).rows;
  const lp = res.items.filter(i => i.role === 'lpddr').length, nets = ifc.reduce((s, r) => s + (r.id === 'dsi' ? r.need * 10 : r.id === 'csi' ? r.need * 10 : r.id === 'usb' ? r.need * 6 : r.id === 'pcie' ? r.need * 6 : r.id === 'i2c' ? r.need * 2 : r.id === 'gpio' ? r.need : r.id === 'uart' ? r.need * 2 : r.id === 'i2s' ? r.need * 4 : 0), 0) + (it('soc') ? lp * 40 + 12 : 0);
  const L = 0.4 * Math.sqrt(area), demand = nets * L * 1.3, pitch = fabOf(res.d.board.fab).min_trace_mm + fabOf(res.d.board.fab).min_space_mm, cap = area / pitch * Math.max(1, st.signal) * 0.3;
  return { area: r2(area), nets, demand: Math.round(demand), capacity: Math.round(cap), util: r2(demand / cap), basis: 'Wire demand = nets × 0.4·√area × 1.3 detour; capacity = area ÷ (trace + space) × signal layers × 30% usable (rule of thumb for dense BGA boards).' };
}
const polyA = poly => { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return Math.abs(a / 2); };
export function fabCheck(res, st, imp, fo) {
  return fabs().map(f => { const fails = [], imp = impedance(st, f); st.layers > (f.layers_max || 99) && fails.push(`${st.layers} layers > ${f.layers_max}`); HDI[st.hdi].micro && !fin(f.laser_via_mm) && fails.push('no laser microvias'); HDI[st.hdi].stacked && f.stacked_microvias === false && fails.push('no stacked microvias'); fo.filter(x => x.pitch && fin(f.min_bga_pitch_mm) && x.pitch < f.min_bga_pitch_mm - 1e-9).forEach(x => fails.push(`${x.mpn} ${x.pitch} mm pitch < ${f.min_bga_pitch_mm}`)); imp.rows.filter(r => r.w != null && r.w < f.min_trace_mm - 1e-3).slice(0, 2).forEach(r => fails.push(`${r.name} on ${r.layer} needs ${r.w} mm < ${f.min_trace_mm} mm trace`)); return { id: f.id, name: f.name, tier: f.tier, ok: !fails.length, fails, source: (f.source || [])[0] || null }; });
}
export function paths(res) {
  const q = res.d.req.qty, it = id => res.items.find(i => i.role === id), som = it('som'), custom = !!it('soc'), chips = ['soc', 'soc_pmic', 'lpddr', 'ufs'].map(id => res.items.filter(i => i.role === id)).flat(), price = p => priceAt(p, q).usd;
  const pcb = res.cost.fab.find(r => r.role === 'fab-pcb'), st = stackup(res.d.board.layers, res.d.board.hdi);
  return [
    { id: 'som', name: 'Module carrier (low risk)', active: !custom, parts: som ? [{ mpn: som.p.mpn, usd: price(som.p) }] : [], board: '6–8 layer carrier, through or 1+N+1 vias for the module LGA', boardUsd: pcb && !custom ? pcb.usd : null, nreWeeks: [6, 10], spins: 2, risk: 'Low: the module vendor did the SoC, PMIC, LPDDR, UFS and RF layout and pre-certified the radios.', cert: 'Module grants reused (FCC modular approval, PTCRB module listing); host still needs SAR, EMC and carrier tests.' },
    { id: 'custom', name: 'Custom chip-level main board', active: custom, parts: chips.map(i => ({ mpn: i.p.mpn, usd: price(i.p) })), board: `${st.layers}-layer ${HDI[st.hdi].name}, ${st.total} mm`, boardUsd: pcb && custom ? pcb.usd : null, nreWeeks: [20, 32], spins: 3, risk: 'High: BGA fanout at ≤0.4 mm pitch, LPDDR/UFS signal integrity, PMIC sequencing, bring-up of the vendor BSP; most SoC/PMIC datasheets and ball maps need an NDA.', cert: 'Full certification of the board; keep the cellular modem as an LGA module to reuse its radio grants.' },
  ].map(p => ({ ...p, partsUsd: p.parts.some(x => x.usd == null) ? null : p.parts.reduce((s, x) => s + x.usd, 0), basis: 'Engineering weeks and board spins are planning assumptions (not quotes); hardware cost lines come from published prices or are RFQ.' }));
}
export function boardStudy(res) {
  const b = res.d.board, st = stackup(b.layers, b.hdi), fab = fabOf(b.fab), imp = impedance(st, fab), bga = res.items.filter(i => ['soc', 'soc_pmic', 'lpddr', 'ufs', 'som'].includes(i.role) && i.p.specs && (fin(i.p.specs.pitch_mm) || /bga/i.test(String(i.p.specs.package || '')))).map(i => ({ uid: i.uid, mpn: i.p.mpn, ...fanout({ pitch: i.p.specs.pitch_mm, balls: i.p.specs.balls }, fab, st.hdi) }));
  const th = res.therm, host = res.items.find(i => i.role === 'som') || res.items.find(i => i.role === 'soc') || res.items.find(i => i.role === 'mcu'), tdp = host && (fin(host.p.n.wMax) ? host.p.n.wMax : fin((host.p.specs || {}).tdp_w) ? host.p.specs.tdp_w : null);
  return { stack: st, fab, imp, bga, ifc: interfaces(res), pwr: powerTree(res), route: routing(res, st), fabs: fabCheck(res, st, imp, bga), paths: paths(res), thermal: { tdp, psus: th.psus, socAvail: th.socAvail, frac: tdp ? Math.min(1, th.socAvail / tdp) : null, path: 'Die → package → board copper planes → graphite/vapour-chamber spreader → frame → skin; budget = h·A·ΔT at the skin limit (see Sources).' }, refs: (db().ref_designs || []).filter(r => host && (r.soc === host.p.id || String(r.name || '').includes(host.p.mpn))) };
}
