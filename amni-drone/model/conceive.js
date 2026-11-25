import { prepare, resolve } from './resolve.js';
import { share } from './expand.js';
const cellsOk = (c, n) => { const r = Array.isArray(c.specs.cells) ? c.specs.cells : c.specs.cells_s ? [c.specs.cells_s, c.specs.cells_s] : null; return !r || (n >= r[0] && n <= r[1]); };
export function conceive(mission, raw) {
  const db = prepare(raw), buy = c => c.sourcing && (c.sourcing.status === 'buyable' || c.sourcing.status === 'included') && c.sourcing.price && typeof c.sourcing.price.q1 === 'number';
  const pick = (role, pred) => Object.values(db.components).filter(c => c.function.role === role && buy(c) && (!pred || pred(c))).sort((a, b) => a.sourcing.price.q1 - b.sourcing.price.q1 || a.id.localeCompare(b.id))[0];
  const frame = pick('frame', c => !c.specs.prop_in || (mission.prop_in >= c.specs.prop_in[0] && mission.prop_in <= c.specs.prop_in[1]));
  const motorPort = frame && (frame.layout.ports || []).find(p => p.channel);
  const motor = pick('motor', c => cellsOk(c, mission.cells) && (!c.specs.prop_in || (mission.prop_in >= c.specs.prop_in[0] && mission.prop_in <= c.specs.prop_in[1])) && motorPort && (c.layout.mounts || []).some(m => share(m.interface, motorPort.interface)));
  const prop = pick('prop', c => c.specs.class_in === mission.prop_in);
  const stack = frame && (frame.layout.ports || []).find(p => p.id === 'stack');
  const esc = pick('esc', c => cellsOk(c, mission.cells) && stack && (c.layout.mounts || []).some(m => share(m.interface, stack.interface)));
  const fc = pick('fc', c => cellsOk(c, mission.cells) && (c.layout.mounts || []).some(m => share(m.interface, 'stack-30.5')));
  const battery = pick('battery', c => c.specs.cells_s === mission.cells);
  const rx = pick('rx'), cam = mission.video ? pick('camera') : null, vtx = mission.video ? pick('vtx') : null, cable = pick('cable');
  const placements = [{ id: 'frame', component: frame ? frame.id : '' }];
  frame && frame.layout.ports.filter(p => p.channel).sort((a, b) => a.channel - b.channel).forEach(p => { placements.push({ id: 'm' + p.channel, component: motor.id, on: 'frame.' + p.id, using: 'base' }); placements.push({ id: 'p' + p.channel, component: prop.id, on: 'm' + p.channel + '.shaft', using: 'hub' }); });
  esc && placements.push({ id: 'esc', component: esc.id, on: 'frame.stack', using: 'base' });
  fc && placements.push({ id: 'fc', component: fc.id, on: 'esc.top', using: 'base' });
  battery && placements.push({ id: 'bat', component: battery.id, on: 'frame.battery', using: 'base' });
  rx && placements.push({ id: 'rx', component: rx.id, on: 'frame.rx', using: 'base' });
  cam && placements.push({ id: 'cam', component: cam.id, on: 'frame.camera', using: 'back' });
  vtx && placements.push({ id: 'vtx', component: vtx.id, on: 'frame.vtx', using: 'base' });
  cable && placements.push({ id: 'cable', component: cable.id });
  const assembly = { id: 'conceived', name: 'Conceived ' + (mission.prop_in || '') + '" ' + (mission.cells || '') + 'S', mission, placements };
  return { assembly, result: resolve(assembly, raw) };
}
