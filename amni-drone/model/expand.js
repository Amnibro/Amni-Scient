const list = x => x == null ? [] : Array.isArray(x) ? x : [x];
export function expandLayout(layout) {
  if (!layout || !layout.pattern || layout.expanded) return layout || { mounts: [], ports: [] };
  const p = layout.pattern, h = p.wheelbase_mm / 2 / Math.SQRT2;
  const ports = (p.channels || []).map(ch => ({ id: ch.id, interface: p.motor_interface, end: 'socket', channel: ch.channel, spin: ch.spin, name: ch.name, at_mm: [ch.xz[0] * h, p.motor_y_mm, ch.xz[1] * h], normal: [0, 1, 0], yaw_deg: 0, estimated: !!p.motor_y_estimated, note: p.motor_y_note || '' }));
  p.stack_interface && ports.push({ id: 'stack', interface: p.stack_interface, end: 'socket', at_mm: [0, p.stack_y_mm, 0], normal: [0, 1, 0], yaw_deg: 0, estimated: !!p.stack_y_estimated, note: p.stack_y_note || '' });
  (p.extras || []).forEach(e => ports.push({ yaw_deg: 0, end: 'socket', ...e }));
  return { ...layout, mounts: layout.mounts || [], ports: [...(layout.ports || []), ...ports], expanded: true };
}
export const share = (a, b) => list(a).some(x => list(b).includes(x));
export { list };
