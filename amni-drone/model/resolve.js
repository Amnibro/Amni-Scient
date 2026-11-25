import { add, mul, quatAlign, quatFromAxis, quatMul, rad, rotVec, sub, len, IDQ } from './math.js';
import { expandLayout, share } from './expand.js';
import { frameMesh, merge, partMesh, stlBinary, transform, volume } from './solid.js';
import { wiresOf } from './wire.js';
import { drawingOf } from './draw.js';
import { analyzePrint } from './optimize.js';
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;
export function prepare(db) {
  const components = {};
  for (const [id, c] of Object.entries(db.components)) components[id] = { ...c, layout: expandLayout(c.layout) };
  return { ...db, components };
}
const rangeOf = c => Array.isArray(c.specs.cells) ? c.specs.cells : c.specs.cells_s ? [c.specs.cells_s, c.specs.cells_s] : null;
const inside = (n, r) => !!r && n >= r[0] && n <= r[1];
const aabb = mesh => { let a = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < mesh.positions.length; i += 3) for (let k = 0; k < 3; k++) { a[k] = Math.min(a[k], mesh.positions[i + k]); a[k + 3] = Math.max(a[k + 3], mesh.positions[i + k]); } return a; };
const hit = (a, b, e) => a[0] < b[3] - e && b[0] < a[3] - e && a[1] < b[4] - e && b[1] < a[4] - e && a[2] < b[5] - e && b[2] < a[5] - e;
export function resolve(assembly, raw) {
  const db = prepare(raw), checks = [], placements = (assembly.placements || []).map(p => ({ ...p }));
  const byId = new Map(placements.map(p => [p.id, p])), pose = new Map();
  let guard = 0;
  while (pose.size < placements.length && guard++ < placements.length + 3) for (const p of placements) {
    if (pose.has(p.id)) continue;
    const comp = db.components[p.component];
    if (!comp) { checks.push({ sev: 'error', id: 'missing-' + p.id, text: p.id + ' names an unknown part ' + p.component + '.' }); pose.set(p.id, null); continue; }
    if (!p.on) { pose.set(p.id, { origin: [0, 0, 0], q: IDQ.slice(), channel: p.channel ?? null, parent: null }); continue; }
    const dot = p.on.indexOf('.'), pid = p.on.slice(0, dot), portId = p.on.slice(dot + 1), parent = pose.get(pid);
    if (parent === undefined) continue;
    if (!parent) { pose.set(p.id, null); continue; }
    const parentComp = db.components[byId.get(pid).component], port = (parentComp.layout.ports || []).find(x => x.id === portId);
    if (!port) { checks.push({ sev: 'error', id: 'port-' + p.on, text: p.id + ' mounts on ' + p.on + ', and that port is not on the part.' }); pose.set(p.id, null); continue; }
    const mounts = comp.layout.mounts || [], mount = (p.using && mounts.find(m => m.id === p.using)) || mounts.find(m => share(m.interface, port.interface));
    if (!mount || !share(mount.interface, port.interface)) { checks.push({ sev: 'error', id: 'mate-' + p.id, text: p.id + ' (' + (mount ? mount.interface : 'no mount') + ') does not mate with ' + p.on + ' (' + [].concat(port.interface).join(', ') + ').' }); pose.set(p.id, null); continue; }
    const qLocal = quatMul(quatFromAxis(port.normal, rad((port.yaw_deg || 0) - (mount.yaw_deg || 0))), quatAlign(mount.normal, mul(port.normal, -1)));
    const q = quatMul(parent.q, qLocal), portAt = add(parent.origin, rotVec(parent.q, port.at_mm)), origin = sub(portAt, rotVec(q, mount.at_mm || [0, 0, 0]));
    pose.set(p.id, { origin, q, channel: p.channel ?? port.channel ?? null, parent: pid, mount: mount.id, port: port.id });
  }
  placements.forEach(p => !pose.has(p.id) && checks.push({ sev: 'error', id: 'unplaced-' + p.id, text: p.id + ' never placed. The "on" target is missing or the chain loops.' }));
  const placed = placements.map(p => ({ ...p, pose: pose.get(p.id) || null, comp: db.components[p.component] })).filter(p => p.comp);
  const flight = db.flight || {}, meshes = [];
  let printInfo = null;
  placed.forEach(p => {
    if (!p.pose) return;
    const local = p.comp.geometry && p.comp.geometry.primitive && p.comp.geometry.primitive.type === 'x-frame' ? frameMesh(p.comp) : partMesh(p.comp);
    const mesh = transform(local, p.pose);
    p.mesh = mesh;
    p.aabb = aabb(mesh);
    const volMm3 = volume(local);
    if (p.comp.function.role === 'frame') {
      printInfo = analyzePrint(p.comp, volMm3, placed, db);
    }
    const slicedMass = (p.comp.function.role === 'frame' && printInfo && p.comp.specs.print && p.comp.specs.print.sliced) ? printInfo.sliced_mass_g : null;
    p.mass = typeof p.comp.specs.mass_g === 'number' ? p.comp.specs.mass_g : slicedMass != null ? slicedMass : p.comp.specs.density_g_cm3 ? volMm3 / 1000 * p.comp.specs.density_g_cm3 : 0;
    p.massEst = !(typeof p.comp.specs.mass_g === 'number');
    const cg = p.comp.layout.cg_mm || [0, ((p.comp.layout.envelope_mm || [0, 0, 0])[1]) / 2, 0];
    p.cg = add(p.pose.origin, rotVec(p.pose.q, cg));
    meshes.push({ id: p.id, role: p.comp.function.role, positions: mesh.positions, indices: mesh.indices, colors: mesh.colors });
  });
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
    const a = placed[i], b = placed[j];
    if (!a.aabb || !b.aabb || a.pose.parent === b.id || b.pose.parent === a.id || ['frame', 'cable', 'prop'].includes(a.comp.function.role) || ['frame', 'cable', 'prop'].includes(b.comp.function.role)) continue;
    hit(a.aabb, b.aabb, 0.4) && checks.push({ sev: 'error', id: 'hit-' + a.id + '-' + b.id, text: a.id + ' and ' + b.id + ' occupy the same space. Move a port or a mount.' });
  }
  const mass = placed.reduce((s, p) => s + (p.mass || 0), 0) || 1, cg = placed.reduce((s, p) => add(s, mul(p.cg || [0, 0, 0], p.mass || 0)), [0, 0, 0]).map(v => v / mass);
  const bat = placed.find(p => p.comp.function.role === 'battery' && p.pose);
  bat && (bat.pack_a = bat.comp.specs.continuous_c * bat.comp.specs.capacity_ah);
  const motors = placed.filter(p => p.comp.function.role === 'motor' && p.pose), peaks = motors.reduce((s, m) => s + (m.comp.specs.peak_current_a || 0), 0);
  bat && peaks && bat.pack_a + 1e-6 < peaks * (flight.pack_punch == null ? 1 : flight.pack_punch) && checks.push({ sev: 'warn', id: 'pack-current', text: 'Pack continuous ' + r1(bat.pack_a) + ' A is under ' + r1(peaks) + ' A, the sum of the motor peak currents. Peaks are catalog peaks, often measured on a higher cell count.' });
  motors.forEach(m => { const esc = placed.find(p => p.comp.function.role === 'esc'); esc && esc.comp.specs.continuous_a < m.comp.specs.peak_current_a && checks.push({ sev: 'error', id: 'esc-amp-' + m.id, text: esc.comp.name + ' is ' + esc.comp.specs.continuous_a + ' A continuous and ' + m.comp.name + ' peaks at ' + m.comp.specs.peak_current_a + ' A.' }); });
  const cells = bat && bat.comp.specs.cells_s;
  cells && placed.forEach(p => { const r = rangeOf(p.comp); r && p.comp.function.role !== 'battery' && !inside(cells, r) && checks.push({ sev: 'error', id: 'cells-' + p.id, text: p.comp.name + ' accepts ' + r[0] + '–' + r[1] + 'S and the pack is ' + cells + 'S.' }); });
  const shafts = motors.map(m => { const port = (m.comp.layout.ports || []).find(q => q.id === 'shaft'); return { m, at: add(m.pose.origin, rotVec(m.pose.q, port ? port.at_mm : [0, 0, 0])) }; });
  let gap = Infinity;
  for (let i = 0; i < shafts.length; i++) for (let j = i + 1; j < shafts.length; j++) {
    const propA = placed.find(p => p.comp.function.role === 'prop' && p.on && p.on.startsWith(shafts[i].m.id + '.')), propB = placed.find(p => p.comp.function.role === 'prop' && p.on && p.on.startsWith(shafts[j].m.id + '.'));
    const da = propA ? propA.comp.specs.diameter_mm : 0, db_ = propB ? propB.comp.specs.diameter_mm : 0, g = len(sub(shafts[i].at, shafts[j].at)) - (da + db_) / 2;
    gap = Math.min(gap, g);
  }
  gap < (flight.prop_gap_mm == null ? 8 : flight.prop_gap_mm) && checks.push({ sev: 'error', id: 'prop-gap', text: 'Prop disks come within ' + r1(gap) + ' mm. The rule wants ' + (flight.prop_gap_mm == null ? 8 : flight.prop_gap_mm) + ' mm. Raise the wheelbase or fit a smaller prop.' });
  const fc = placed.find(p => p.comp.function.role === 'fc'), draw5 = placed.reduce((s, p) => s + (p.comp.specs.current_5v_a || 0), 0);
  fc && fc.comp.specs.bec_5v_a && draw5 > fc.comp.specs.bec_5v_a && checks.push({ sev: 'error', id: 'bec-5v', text: '5V parts draw ' + r2(draw5) + ' A and the FC BEC is ' + fc.comp.specs.bec_5v_a + ' A.' });
  fc && checks.push({ sev: 'info', id: 'rx-current', text: 'Receiver current was not on the pages checked, so it is not in the 5V sum.' });
  Math.hypot(cg[0], cg[2]) > (flight.cg_mm || 20) && checks.push({ sev: 'warn', id: 'cg', text: 'Horizontal CG is ' + r1(Math.hypot(cg[0], cg[2])) + ' mm from the hub.' });
  const wires = wiresOf(placed, db, checks);
  const vbat = cells ? cells * 3.7 : 0;
  wires.forEach(w => w.drop_v != null && vbat && w.drop_v > vbat * (flight.drop_frac || 0.03) && checks.push({ sev: 'warn', id: 'drop-' + w.id, text: w.id + ' drops ' + w.drop_v + ' V at the catalog current, over ' + Math.round((flight.drop_frac || 0.03) * 100) + '% of ' + vbat + ' V.' }));
  let twr = null, minutes = null;
  const prop0 = placed.find(p => p.comp.function.role === 'prop'), motor0 = motors[0];
  const combo = motor0 && prop0 && Object.values(db.combos || {}).find(c => c.motor === motor0.component && c.prop === prop0.component && c.cells === cells);
  if (!combo || !(combo.points || []).length) checks.push({ sev: 'warn', id: 'thrust', text: 'No thrust table for this motor, prop and cell count. Add a point under combos/ and thrust-to-weight appears. Nothing here is invented.' });
  else {
    const top = combo.points.slice().sort((a, b) => b.throttle - a.throttle)[0];
    top.thrust_g && (twr = motors.length * top.thrust_g / mass);
    const hoverT = mass / motors.length, pts = combo.points.filter(p => p.thrust_g && p.current_a).sort((a, b) => a.thrust_g - b.thrust_g);
    const lo = pts.filter(p => p.thrust_g <= hoverT).pop(), hi = pts.find(p => p.thrust_g >= hoverT);
    if (lo && hi && hi.thrust_g !== lo.thrust_g) { const t = (hoverT - lo.thrust_g) / (hi.thrust_g - lo.thrust_g), amps = lo.current_a + t * (hi.current_a - lo.current_a); minutes = bat.comp.specs.capacity_ah * 60 * (flight.usable || 0.8) / (motors.length * amps); }
  }
  const want = assembly.mission && assembly.mission.twr_min;
  twr != null && want && twr + 1e-6 < want && checks.push({ sev: 'error', id: 'twr', text: 'Thrust-to-weight is ' + r2(twr) + ' and the mission wants ' + want + '.' });
  assembly.mission && assembly.mission.hover_min && minutes == null && checks.push({ sev: 'warn', id: 'endurance', text: 'Hover minutes need two thrust points that bracket the hover thrust. The table does not have them.' });
  const groups = new Map();
  placed.forEach(p => { const g = groups.get(p.component) || { id: p.component, role: p.comp.function.role, name: p.comp.name, mpn: p.comp.mpn || '', qty: 0, status: p.comp.sourcing.status, price: p.comp.sourcing.price || {}, note: (p.comp.sourcing.price && p.comp.sourcing.price.note) || '' }; g.qty++; groups.set(p.component, g); });
  const bom = [...groups.values()].map(g => { const covers = g.price.covers || 1, usd = typeof g.price.q1 === 'number' ? g.price.q1 : null, ext = usd == null ? null : r2(usd * Math.ceil(g.qty / covers)); return { ...g, usd, ext }; });
  const cost = r2(bom.reduce((s, g) => s + (g.ext || 0), 0));
  bom.filter(g => g.usd == null).forEach(g => checks.push({ sev: 'warn', id: 'price-' + g.id, text: g.name + ' has no price. It is listed, not counted as $0.' }));
  bom.filter(g => g.price && g.price.stale).forEach(g => checks.push({ sev: 'info', id: 'stale-' + g.id, text: g.name + ' still carries an older listing. Read the price note before you order.' }));
  placed.filter(p => p.massEst && p.mass).forEach(p => checks.push({ sev: 'info', id: 'mass-' + p.id, text: p.comp.name + ' mass is ' + r1(p.mass) + ' g from the mesh and ' + (p.comp.specs.print && p.comp.specs.print.sliced ? p.comp.specs.print.infill_pct + '% sliced infill (' + p.comp.specs.print.walls + ' walls)' : 'a density') + ', not a scale.' }));
  if (printInfo && printInfo.is_printable) {
    printInfo.safety_factor < 1.4 && checks.push({ sev: 'error', id: 'print-sf', text: 'Printed arm safety factor is ' + printInfo.safety_factor + ' at ' + printInfo.load_n + ' N peak load (' + printInfo.stress_mpa + ' MPa). Increase arm thickness, root width, or infill.' });
    printInfo.deflection_mm > 2.2 && checks.push({ sev: 'warn', id: 'print-defl', text: 'Printed arm tip deflects ' + printInfo.deflection_mm + ' mm under load (' + printInfo.arm_freq_hz + ' Hz resonance). Stiffen the arms or use CF filament.' });
  }
  assembly.mission && assembly.mission.budget_usd && cost > assembly.mission.budget_usd && checks.push({ sev: 'error', id: 'budget', text: 'Priced lines add to $' + cost + ' and the budget is $' + assembly.mission.budget_usd + '.' });
  const view = { parts: meshes }, wiresOut = wires;
  const full = merge(placed.filter(p => p.mesh).map(p => p.mesh)), frameOnly = merge(placed.filter(p => p.mesh && p.comp.function.role === 'frame').map(p => p.mesh));
  const result = { assembly, placed: placed.map(p => ({ id: p.id, component: p.component, role: p.comp.function.role, on: p.on || '', channel: p.pose && p.pose.channel, origin: p.pose && p.pose.origin, q: p.pose && p.pose.q, mass_g: r2(p.mass || 0), parent: p.pose && p.pose.parent })), wires: wiresOut, bom, mass_g: r1(mass === 1 && !placed.some(p => p.mass) ? 0 : mass), cg: cg.map(r1), cost_usd: cost, checks, errors: checks.filter(c => c.sev === 'error').length, warnings: checks.filter(c => c.sev === 'warn').length, twr: twr == null ? null : r2(twr), minutes: minutes == null ? null : r1(minutes), prop_gap_mm: gap === Infinity ? null : r1(gap), draw_5v_a: r2(draw5), print: printInfo, view };
  result.drawing = drawingOf({ ...result, wires: wiresOut });
  result.stl = stlBinary(full.indices.length ? full : { positions: [], indices: [] });
  result.frameStl = stlBinary(frameOnly.indices.length ? frameOnly : { positions: [], indices: [] });
  result.view = view;
  return result;
}
export function bomCSV(result) {
  const esc = s => /[",\n]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s ?? '');
  const head = ['Role', 'Id', 'Name', 'MPN', 'Qty', 'Status', 'USD', 'Ext', 'Note'];
  return [head, ...result.bom.map(g => [g.role, g.id, g.name, g.mpn, g.qty, g.status, g.usd, g.ext, g.note])].map(r => r.map(esc).join(',')).join('\n') + '\n';
}
