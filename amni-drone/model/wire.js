import { add, len, rotVec, sub } from './math.js';
const fnOk = (fn, pat) => pat.endsWith('*') ? fn.startsWith(pat.slice(0, -1)) : fn === pat;
const r3 = v => Math.round(v * 1000) / 1000;
export function endpoints(placed, db) {
  const out = [];
  placed.forEach(p => {
    if (!p.pose) return;
    const comp = db.components[p.component], pins = (comp.electrical && comp.electrical.pins) || [];
    pins.forEach(pin => {
      const port = (comp.layout.ports || []).find(q => q.pin === pin.id || (q.pins || []).includes(pin.id));
      const at = port ? add(p.pose.origin, rotVec(p.pose.q, port.at_mm)) : p.pose.origin.slice();
      out.push({ placement: p.id, role: comp.function.role, fn: pin.fn, channel: pin.channel ?? p.pose.channel ?? null, at, name: pin.name, pin: pin.id });
    });
  });
  return out;
}
function pick(ends, spec) {
  return ends.filter(e => e.role === spec.role && fnOk(e.fn, spec.fn));
}
function awgOf(link, a, b, placed, db) {
  if (typeof link.awg === 'number') return link.awg;
  const motor = placed.find(p => db.components[p.component].function.role === 'motor' && (p.pose && p.pose.channel) === (a.channel || b.channel));
  const pack = placed.find(p => db.components[p.component].function.role === 'battery');
  const src = link.awg === 'motor' ? motor : pack;
  return src ? db.components[src.component].specs.lead_awg : null;
}
function ampsOf(link, a, b, placed, db) {
  if (typeof link.amps === 'number') return link.amps;
  if (link.amps === 'motor') { const m = placed.find(p => db.components[p.component].function.role === 'motor' && p.pose && p.pose.channel === (a.channel || b.channel)); return m ? db.components[m.component].specs.peak_current_a : null; }
  if (link.amps === 'pack') { const bat = placed.find(p => db.components[p.component].function.role === 'battery'); return bat ? bat.pack_a : null; }
  if (link.amps === 'camera' || link.amps === 'vtx') { const p = placed.find(q => db.components[q.component].function.role === link.amps); return p ? db.components[p.component].specs.current_5v_a : null; }
  return null;
}
export function wiresOf(placed, db, checks) {
  const ends = endpoints(placed, db), wires = [], area = Object.fromEntries((db.wire.awg || []).map(a => [a.awg, a.mm2]));
  (db.wire.links || []).forEach(link => {
    const A = pick(ends, link.a), B = pick(ends, link.b);
    const groups = new Map();
    const key = e => (link.match || []).includes('channel') || (link.match || []).includes('fn') ? (link.match.includes('channel') ? String(e.channel) : '') + '|' + (link.match.includes('fn') ? e.fn : '') : '';
    A.forEach(e => { const k = key(e); groups.set(k, { a: [...((groups.get(k) || {}).a || []), e], b: (groups.get(k) || {}).b || [] }); });
    B.forEach(e => { const k = key(e); const g = groups.get(k) || { a: [], b: [] }; g.b.push(e); groups.set(k, g); });
    if (!groups.size) { (link.optional ? checks.push({ sev: 'warn', id: 'wire-' + link.id, text: link.id + ' has no pads. Add the missing fn and the wire appears.' }) : checks.push({ sev: 'error', id: 'wire-' + link.id, text: link.id + ' is missing a pad.' })); return; }
    groups.forEach((g, k) => {
      if (g.a.length !== 1 || g.b.length !== 1) { checks.push({ sev: link.optional ? 'warn' : 'error', id: 'wire-' + link.id + '-' + k, text: link.id + ' matched ' + g.a.length + ' and ' + g.b.length + ' pads' + (k ? ' (' + k + ')' : '') + '.' }); return; }
      const a = g.a[0], b = g.b[0], geom = len(sub(a.at, b.at)), lenMm = (link.len_mm || geom) * (db.wire.slack || 1), awg = awgOf(link, a, b, placed, db), amps = ampsOf(link, a, b, placed, db);
      const mm2 = area[awg], drop = amps != null && mm2 ? amps * db.wire.copper_ohm_m * (lenMm / 1000) / (mm2 * 1e-6) : null;
      wires.push({ id: link.id + (k ? ':' + k : ''), name: link.id, a: a.placement + ' ' + a.fn, b: b.placement + ' ' + b.fn, aAt: a.at, bAt: b.at, len_mm: r3(lenMm), awg, amps, drop_v: drop == null ? null : r3(drop), channel: a.channel });
    });
  });
  placed.forEach(p => {
    const cond = (db.components[p.component].electrical || {}).conductors || [];
    cond.forEach(c => {
      const ae = ends.filter(e => e.role === c.a.role && e.fn === c.a.fn), be = c.b.fn === 'nc' ? [] : ends.filter(e => e.role === c.b.role && e.fn === c.b.fn);
      if (ae.length !== 1 || (c.b.fn !== 'nc' && be.length !== 1)) { checks.push({ sev: 'error', id: 'cable-' + p.id + '-' + c.n, text: p.id + ' conductor ' + c.n + ' did not find both ends (' + c.a.fn + ' → ' + c.b.fn + ').' }); return; }
      const a = ae[0], b = be[0], lenMm = (db.components[p.component].specs.len_mm || 30);
      const at = a.at, bt = b ? b.at : a.at;
      wires.push({ id: p.id + ':' + c.n, name: 'cable ' + c.n, a: a.placement + ' ' + a.fn, b: b ? b.placement + ' ' + b.fn : 'nc', aAt: at, bAt: bt, len_mm: lenMm, awg: 28, amps: c.a.fn.startsWith('sig:') ? 0.02 : c.a.fn === 'pwr:vbat' ? 0.2 : 0.05, drop_v: null, note: c.note || '', channel: null });
    });
  });
  return wires;
}
