import { resolve, bomCSV } from './model/resolve.js';
import { conceive } from './model/conceive.js';
import { optimizeBuild, PRINT_MATERIALS } from './model/optimize.js';
import { createView, klass } from './scene.js';

const $ = s => document.querySelector(s);
const state = {
  db: null,
  assembly: null,
  result: null,
  step: 'mission',
  sel: null,
  explode: 0,
  net: 'all',
  optMode: 'weight-print',
  optMat: 'petg',
  optSummary: null
};
const undoStack = [];
let view;

const money = n => n == null ? '—' : '$' + Number(n).toFixed(2);
const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const dl = (name, blob) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
};
const frameOf = () => state.assembly.placements.find(p => p.id === 'frame');
const stageOf = () => state.step === 'wiring' || state.step === 'drawing' || state.step === 'bom' ? state.step : 'model';

function snap() {
  const wheels = {}, frames = {};
  Object.values(state.db.components).forEach(c => {
    if (c.layout && c.layout.pattern) wheels[c.id] = c.layout.pattern.wheelbase_mm;
    if (c.function && c.function.role === 'frame') {
      frames[c.id] = {
        primitive: c.geometry && c.geometry.primitive ? structuredClone(c.geometry.primitive) : null,
        print: c.specs && c.specs.print ? structuredClone(c.specs.print) : null,
        density: c.specs ? c.specs.density_g_cm3 : null
      };
    }
  });
  return JSON.stringify({ assembly: state.assembly, wheels, frames, optSummary: state.optSummary });
}

function remember() {
  const s = snap();
  undoStack[undoStack.length - 1] !== s && undoStack.push(s);
  undoStack.length > 40 && undoStack.shift();
}

function undo() {
  const s = undoStack.pop();
  if (!s) return;
  const data = JSON.parse(s);
  state.assembly = data.assembly;
  state.optSummary = data.optSummary || null;
  Object.entries(data.wheels || {}).forEach(([id, mm]) => {
    const lay = state.db.components[id] && state.db.components[id].layout;
    lay && lay.pattern && (lay.pattern.wheelbase_mm = mm);
  });
  Object.entries(data.frames || {}).forEach(([id, f]) => {
    const c = state.db.components[id];
    if (!c) return;
    if (f.primitive && c.geometry) c.geometry.primitive = f.primitive;
    if (c.specs) {
      if (f.print) c.specs.print = f.print;
      else delete c.specs.print;
      if (f.density != null) c.specs.density_g_cm3 = f.density;
    }
  });
  go();
}

function go() {
  state.result = resolve(state.assembly, state.db);
  state.sel && !state.result.placed.some(p => p.id === state.sel) && (state.sel = null);
  paint();
}

function setWheel(mm) {
  const fComp = state.db.components[frameOf().component];
  const lay = fComp.layout, n = Number(mm);
  if (!lay.pattern || lay.pattern.wheelbase_mm === n) return;
  remember();
  Object.values(state.db.components).forEach(c => {
    if (c.layout && c.layout.pattern && (c.id === fComp.id || (c.files && c.files.layout === (fComp.files && fComp.files.layout)))) {
      c.layout.pattern.wheelbase_mm = n;
    }
  });
  go();
}

function runOptimize(opts = {}) {
  remember();
  const mode = opts.mode || state.optMode || 'weight-print';
  const material = opts.material || state.optMat || 'petg';
  state.optMode = mode;
  state.optMat = material;
  const out = optimizeBuild(state.assembly, state.db, { mode, material });
  state.assembly = out.assembly;
  state.result = out.result;
  state.optSummary = out.summary;
  state.sel = null;
  paint();
  return out.summary;
}

function pick(id) {
  state.sel = id || null;
  view && view.select(state.sel);
  paintSide();
  (state.step === 'parts' || state.step === 'model' || state.step === 'print') && paintPanel();
}

function showTip(id, x, y) {
  const el = $('#tip');
  if (!id || !state.result) { el.classList.remove('on'); return; }
  const p = state.result.placed.find(q => q.id === id), comp = p && state.db.components[p.component];
  el.textContent = id + (comp ? ' · ' + comp.name : '');
  el.style.left = (x + 14) + 'px';
  el.style.top = (y + 14) + 'px';
  el.classList.add('on');
}

function paintMetrics() {
  const m = state.result, cg = Math.hypot(m.cg[0], m.cg[2]), gapBad = m.checks.some(c => c.id === 'prop-gap'), over = m.checks.some(c => c.id === 'budget');
  const framePlaced = m.placed.find(p => p.role === 'frame');
  const pr = m.print;
  const sfClass = pr ? (pr.safety_factor < 1.5 ? 'bad' : pr.safety_factor < 2.0 ? 'warn' : 'good') : '';
  const cells = [
    ['Mass', m.mass_g.toFixed(1) + ' g', ''],
    ['Frame', (framePlaced ? framePlaced.mass_g.toFixed(1) : '—') + ' g', pr && pr.sliced ? 'good' : ''],
    ['Cost', money(m.cost_usd), over ? 'bad' : ''],
    ['Gap', m.prop_gap_mm == null ? '—' : m.prop_gap_mm.toFixed(1) + ' mm', gapBad ? 'bad' : 'good'],
    ['CG', cg.toFixed(1) + ' mm', cg > 20 ? 'warn' : 'good'],
    ['Arm SF', pr ? pr.safety_factor.toFixed(1) + '×' : '—', sfClass],
    ['TWR', m.twr == null ? '—' : m.twr.toFixed(2), ''],
    ['Hover', m.minutes == null ? '—' : m.minutes.toFixed(1) + ' min', ''],
    ['5V', m.draw_5v_a.toFixed(2) + ' A', ''],
    ['Issues', m.errors + ' / ' + m.warnings, m.errors ? 'bad' : m.warnings ? 'warn' : 'good']
  ];
  $('#metrics').innerHTML = cells.map(([k, v, c]) => `<div class="metric ${c}"><i>${k}</i><b>${v}</b></div>`).join('');
}

function optSummaryBanner() {
  const s = state.optSummary;
  if (!s) return '';
  const f1 = v => v == null ? '—' : v.toFixed(1), P = s.picks || {};
  if (s.mode === 'flight-parts' || s.note) return `<div class="card opt">${s.note ? `<p class="hint">${esc(s.note)}</p>` : ''}${s.picks ? `<div class="kv"><i>Flight Time</i><b>${f1(s.before_minutes)} → ${f1(s.after_minutes)} min</b></div><div class="kv"><i>Thrust / Weight</i><b>${f1(s.before_twr)} → ${f1(s.after_twr)}</b></div><div class="kv"><i>Cost</i><b>$${f1(s.before_cost_usd)} → $${f1(s.after_cost_usd)}</b></div><div class="kv"><i>Mass</i><b>${f1(s.before_mass_g)} g → ${f1(s.after_mass_g)} g</b></div>${['frame', 'motor', 'prop', 'battery'].map(k => `<div class="kv"><i>${k[0].toUpperCase() + k.slice(1)}</i><b>${esc(P[k])}</b></div>`).join('')}<div class="kv"><i>Searched</i><b>${s.kept} of ${s.tried} sets pass</b></div>` : ''}</div>`;
  const sign = s.saved_g >= 0 ? '−' + s.saved_g.toFixed(1) + ' g' : '+' + Math.abs(s.saved_g).toFixed(1) + ' g';
  return `<div class="card opt">
    <div class="kv"><i>Optimized (${esc(s.material)})</i><b><span class="badge good">${sign} (${s.saved_pct}%)</span></b></div>
    <div class="kv"><i>Total Mass</i><b>${s.before_mass_g.toFixed(1)} g → ${s.after_mass_g.toFixed(1)} g</b></div>
    <div class="kv"><i>Frame Mass</i><b>${s.frame_before_g.toFixed(1)} g → ${s.frame_after_g.toFixed(1)} g</b></div>
    <div class="kv"><i>Wheelbase</i><b>${s.wheelbase_before_mm} → ${s.wheelbase_after_mm} mm</b></div>
    <div class="kv"><i>Arm Taper / Truss</i><b>${s.arm_w_mm}→${s.arm_tip_w_mm} × ${s.arm_t_mm} mm · ${Math.round(s.pocket_ratio * 100)}%</b></div>
    <div class="kv"><i>Slicer</i><b>${s.infill_pct}% infill · ${s.walls} walls · 0 g supports</b></div>
  </div>`;
}

function missionPanel() {
  const mission = state.assembly.mission || {}, frame = state.db.components[frameOf().component], wheel = frame.layout.pattern ? frame.layout.pattern.wheelbase_mm : '';
  const file = (frame.files && frame.files.layout) || (frame.id + '.json');
  const matOpts = Object.values(PRINT_MATERIALS).map(m => `<option value="${esc(m.id)}" ${state.optMat === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
  return `<h2>Mission</h2><p class="lede">${esc(state.assembly.name)}. Conceive picks the cheapest part that mates. Optimize compacts wheelbase, tapers arms, carves truss cutouts, and slices infill for minimum weight.</p>
<div class="card">
  <h3>Auto-Optimize Weight &amp; 3D Print</h3>
  <div class="field"><label>Goal</label><select id="opt-mode"><option value="weight-print" ${state.optMode === 'weight-print' ? 'selected' : ''}>Min Weight + 3D Print</option><option value="stiffness" ${state.optMode === 'stiffness' ? 'selected' : ''}>Max Arm Stiffness / Hz</option><option value="flight-parts" ${state.optMode === 'flight-parts' ? 'selected' : ''}>Longest Flight (buyable parts)</option><option value="budget-weight" ${state.optMode === 'budget-weight' ? 'selected' : ''}>Budget Parts + Print</option></select></div>
  <div class="field"><label>Filament</label><select id="opt-mat">${matOpts}</select></div>
  <button id="run-optimize" class="btn primary block" type="button">Auto-Optimize Weight &amp; Print</button>
</div>
${optSummaryBanner()}
<div class="field"><label>Prop class</label><input id="prop-in" data-mission="prop_in" type="number" step="0.1" value="${mission.prop_in ?? ''}"></div>
<div class="field"><label>Cells</label><input id="cells" data-mission="cells" type="number" step="1" value="${mission.cells ?? ''}"></div>
<div class="field"><label>Video</label><select id="video" data-mission="video"><option value="analog" ${mission.video === 'analog' ? 'selected' : ''}>analog</option><option value="" ${mission.video ? '' : 'selected'}>none</option></select></div>
<div class="field"><label>Budget USD</label><input id="budget" data-mission="budget_usd" type="number" step="1" value="${mission.budget_usd ?? ''}"></div>
<div class="field"><label>TWR min</label><input id="twr" data-mission="twr_min" type="number" step="0.1" value="${mission.twr_min ?? ''}"></div>
<div class="field"><label>Wheelbase mm</label><input id="wheelbase" type="number" min="80" step="1" value="${wheel}"></div>
<input id="wheelbase-range" type="range" min="160" max="280" step="1" value="${wheel}">
<p class="hint">Wheelbase lives in <span class="file">components/${esc(file)}</span>. Motors, arms, wire length, prop gap, CG, and the mesh follow that number.</p>`;
}

function printPanel() {
  const fId = frameOf().component, frame = state.db.components[fId];
  const g = (frame.geometry && frame.geometry.primitive) || {};
  const pSpec = (frame.specs && frame.specs.print) || {};
  const pr = state.result.print || {};
  const wheel = frame.layout.pattern ? frame.layout.pattern.wheelbase_mm : 226;
  const armW = g.arm_w_mm || 12, armTipW = g.arm_tip_w_mm || Math.round(armW * 0.8 * 10) / 10, armT = g.arm_t_mm || 6;
  const pocketPct = Math.round((g.pocket_ratio ?? 0.22) * 100);
  const infillPct = pSpec.infill_pct ?? 40, walls = pSpec.walls ?? 3, flatBottom = !!g.flat_bottom;
  const matOpts = Object.values(PRINT_MATERIALS).map(m => `<option value="${esc(m.id)}" ${(pSpec.material || state.optMat) === m.id ? 'selected' : ''}>${esc(m.name)} (${m.density_g_cm3} g/cm³)</option>`).join('');
  const sfBadge = pr.safety_factor < 1.5 ? 'bad' : pr.safety_factor < 2.0 ? 'warn' : 'good';
  const deflBadge = pr.deflection_mm > 2.0 ? 'bad' : pr.deflection_mm > 1.3 ? 'warn' : 'good';
  const freqBadge = pr.arm_freq_hz < 125 ? 'bad' : pr.arm_freq_hz < 145 ? 'warn' : 'good';

  return `<h2>Print &amp; Weight</h2><p class="lede">Parametric 3D-printable frame &amp; structural weight optimizer. Tunes wheelbase, arm taper, truss pockets, and slicer shell/infill under motor peak load.</p>
<div class="card">
  <div class="field"><label>Mode</label><select id="opt-mode"><option value="weight-print" ${state.optMode === 'weight-print' ? 'selected' : ''}>Min Weight + 3D Print</option><option value="stiffness" ${state.optMode === 'stiffness' ? 'selected' : ''}>Max Arm Stiffness / Hz</option><option value="flight-parts" ${state.optMode === 'flight-parts' ? 'selected' : ''}>Longest Flight (buyable parts)</option><option value="budget-weight" ${state.optMode === 'budget-weight' ? 'selected' : ''}>Budget Parts + Print</option></select></div>
  <div class="field"><label>Material</label><select id="print-mat">${matOpts}</select></div>
  <button id="run-optimize" class="btn primary block" type="button">Auto-Optimize Weight &amp; Print</button>
</div>
${optSummaryBanner()}
<h3>Parametric Frame Geometry</h3>
<div class="field"><label>Wheelbase (${wheel} mm)</label><input id="wheelbase" type="range" min="185" max="260" step="1" value="${wheel}"></div>
<div class="field"><label>Arm Root W (${armW} mm)</label><input id="print-arm-w" type="range" min="8" max="18" step="0.5" value="${armW}"></div>
<div class="field"><label>Arm Tip W (${armTipW} mm)</label><input id="print-arm-tip" type="range" min="6" max="16" step="0.5" value="${armTipW}"></div>
<div class="field"><label>Arm Thick (${armT} mm)</label><input id="print-arm-t" type="range" min="4" max="11" step="0.5" value="${armT}"></div>
<div class="field"><label>Truss Cutout (${pocketPct}%)</label><input id="print-pocket" type="range" min="0" max="48" step="2" value="${pocketPct}"></div>
<h3>FDM Slicer Settings</h3>
<div class="field"><label>Infill (${infillPct}%)</label><input id="print-infill" type="range" min="15" max="100" step="5" value="${infillPct}"></div>
<div class="field"><label>Perimeters (${walls} walls)</label><input id="print-walls" type="range" min="2" max="5" step="1" value="${walls}"></div>
<div class="field"><label>Flat Bottom (0g support)</label><input id="print-flat" type="checkbox" ${flatBottom ? 'checked' : ''}></div>
<div class="card">
  <h3>Structural &amp; Slicer Telemetry</h3>
  <div class="kv"><i>Sliced Frame Mass</i><b>${pr.sliced_mass_g ?? '—'} g <span class="hint">(100% solid: ${pr.solid_mass_g ?? '—'} g)</span></b></div>
  <div class="kv"><i>Support Waste</i><b>${pr.support_g === 0 ? '<span class="badge good">0.0 g (flat bed)</span>' : (pr.support_g ?? '—') + ' g'}</b></div>
  <div class="kv"><i>Filament &amp; Cost</i><b>${pr.filament_m ?? '—'} m · ${money(pr.filament_usd)}</b></div>
  <div class="kv"><i>Est. Print Time</i><b>~${pr.print_time_min ?? '—'} min</b></div>
  <div class="kv"><i>Root Bending Stress</i><b>${pr.stress_mpa ?? '—'} MPa @ ${pr.load_n ?? '—'} N</b></div>
  <div class="kv"><i>Safety Factor</i><b><span class="badge ${sfBadge}">${pr.safety_factor ?? '—'}×</span></b></div>
  <div class="kv"><i>Tip Deflection</i><b><span class="badge ${deflBadge}">${pr.deflection_mm ?? '—'} mm</span></b></div>
  <div class="kv"><i>1st Arm Resonance</i><b><span class="badge ${freqBadge}">${pr.arm_freq_hz ?? '—'} Hz</span></b></div>
  <div class="kv"><i>Footprint (${pr.span_xz_mm ?? '—'} mm)</i><b><span class="badge ${pr.fits_180 ? 'good' : 'warn'}">180</span> <span class="badge ${pr.fits_220 ? 'good' : 'bad'}">220</span> <span class="badge ${pr.fits_256 ? 'good' : 'bad'}">256</span></b></div>
</div>`;
}

function partsPanel() {
  const roles = state.assembly.placements.map(p => {
    const comp = state.db.components[p.component];
    const options = Object.values(state.db.components).filter(c => comp && c.function.role === comp.function.role).map(c => `<option value="${esc(c.id)}" ${c.id === p.component ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    const price = comp && comp.sourcing && comp.sourcing.price && typeof comp.sourcing.price.q1 === 'number' ? money(comp.sourcing.price.q1) : 'unpriced';
    const bad = state.result.checks.some(c => c.sev === 'error' && c.id.includes(p.id));
    return `<div class="slot ${state.sel === p.id ? 'on' : ''}"><button type="button" class="link" data-pick="${esc(p.id)}">${esc(p.id)}</button> <span class="file">components/${esc(p.component)}.json</span><select data-slot="${esc(p.id)}">${options}</select><div class="hint">${esc(comp ? comp.function.does : '')} ${price}.${bad ? ' This slot has an error.' : ''}</div></div>`;
  }).join('');
  return `<h2>Parts</h2><p class="lede">Each slot is a file. Swap the component and the mates run again. The name opens that part.</p>${roles}`;
}

function notePanel(title, text) { return `<h2>${title}</h2><p class="lede">${text}</p>`; }

function paintPanel() {
  const active = document.activeElement && document.activeElement.id;
  const step = state.step;
  const nets = ['all', 'phase', 'pack', 'signal', 'cable'].map(n => `<button type="button" class="btn sm ${state.net === n ? 'on' : ''}" data-net="${n}">${n}</button>`).join('');
  $('#panel').innerHTML =
    step === 'parts' ? partsPanel() :
    step === 'print' ? printPanel() :
    step === 'wiring' ? notePanel('Wiring', 'Phase wires use the motor lead gauge. The pack stops on the ESC. The 8-pin cable is the crossed motor signals. Filter a class and the model follows.') + `<div class="chips">${nets}</div>` :
    step === 'drawing' ? notePanel('Drawing', 'Top view, nose up, millimetres. Dashed circles are the prop disks, solid circles the motors, and the gold line is the motor diagonal. Click a part.') :
    step === 'bom' ? notePanel('BOM', 'A 4-pack counts once. A missing price is listed and not treated as zero. The included cable stays at $0 because it ships with the flight controller.') :
    step === 'model' ? notePanel('Model', 'Click a part. Explode pulls each body away from the hub along its own place. F fits the camera. Esc clears the pick. The gold arrow is the nose, −Z.') :
    missionPanel();
  document.querySelectorAll('#rail button').forEach(b => b.classList.toggle('on', b.dataset.step === step));
  if (active) { const el = document.getElementById(active); el && el.focus(); }
}

function inspect() {
  if (!state.sel) return '<p class="hint">Click a part in the model or on the drawing. Its file opens here.</p>';
  const p = state.result.placed.find(x => x.id === state.sel);
  if (!p) return '';
  const comp = state.db.components[p.component];
  const specs = Object.entries(comp.specs || {}).map(([k, v]) => `<div class="kv"><i>${esc(k)}</i><b>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</b></div>`).join('');
  const lay = comp.layout || {}, extras = ((lay.pattern && lay.pattern.extras) || []).map(q => q.id + ' · estimated' + (q.note ? ' — ' + q.note : '')), channels = ((lay.pattern && lay.pattern.channels) || []).map(q => q.id + ' · ch ' + q.channel + ' ' + q.name), ports = (lay.ports || []).map(q => q.id + (q.estimated ? ' · estimated' : '') + (q.note ? ' — ' + q.note : ''));
  const wires = state.result.wires.filter(w => w.a.startsWith(p.id + ' ') || w.b.startsWith(p.id + ' ')).map(w => `<div class="kv"><i>${esc(w.name)}</i><b>${esc(w.a)} → ${esc(w.b)}</b></div>`).join('');
  const notes = (comp.notes || []).map(n => `<p class="hint">${esc(n)}</p>`).join('');
  const file = (comp.files && comp.files.layout) ? 'components/' + comp.files.layout : 'components/' + comp.id + '.json';
  return `<h2>${esc(p.id)}</h2><p class="file">${esc(file)}</p><p class="lede">${esc(comp.name)}. ${esc(comp.function.does || '')}</p>${specs}<div class="hint">${esc([...ports, ...channels, ...extras].join(' · '))}</div>${wires}${notes}`;
}

function paintSide() {
  const rows = state.result.checks.map(c => `<div class="check ${c.sev}"><div class="sev">${c.sev}</div><div>${esc(c.text)}</div></div>`).join('');
  $('#side').innerHTML = inspect() + `<h2>Checks</h2><p class="lede">${state.result.errors} errors, ${state.result.warnings} warnings.</p>${rows || '<p class="hint">Nothing open.</p>'}`;
}

function wireTable() {
  const place = state.assembly.placements.find(p => state.db.components[p.component] && state.db.components[p.component].function.role === 'cable');
  const cond = place ? (((state.db.components[place.component].electrical || {}).conductors || []).slice().sort((a, b) => a.n - b.n)) : [];
  const pins = `<div class="pins">${cond.map(c => `<div><b>${c.n}</b><span>${esc(c.note || c.a.fn + ' → ' + c.b.fn)}</span></div>`).join('')}</div>`;
  const rows = state.result.wires.filter(w => state.net === 'all' || state.net === 'off' || klass(w.name) === state.net).map(w => `<tr class="${state.sel && (w.a.startsWith(state.sel + ' ') || w.b.startsWith(state.sel + ' ')) ? 'mine' : ''}"><td>${esc(w.name)}</td><td>${esc(w.a)}</td><td>${esc(w.b)}</td><td class="num">${w.awg ?? ''}</td><td class="num">${w.len_mm}</td><td class="num">${w.drop_v ?? ''}</td><td>${esc(w.note || '')}</td></tr>`).join('');
  return pins + `<table><thead><tr><th>Net</th><th>From</th><th>To</th><th>AWG</th><th>mm</th><th>Drop V</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function bomTable() {
  const rows = state.result.bom.map(g => `<tr><td>${esc(g.role)}</td><td>${esc(g.name)}</td><td class="num">${g.qty}</td><td>${esc(g.status)}</td><td class="num">${g.usd == null ? '—' : money(g.usd)}</td><td class="num">${g.ext == null ? '—' : money(g.ext)}</td><td>${esc(g.note)}</td></tr>`).join('');
  return `<table><thead><tr><th>Role</th><th>Part</th><th>Qty</th><th>Status</th><th>USD</th><th>Ext</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function paintView() {
  const mode = stageOf(), sheet = $('#sheet');
  $('#tools').hidden = mode !== 'model';
  view.setExplode(state.explode);
  view.setWireFilter(state.net);
  view.select(state.sel);
  view.setResult(state.result);
  sheet.hidden = mode === 'model';
  mode === 'drawing' && (sheet.innerHTML = state.result.drawing);
  mode === 'wiring' && (sheet.innerHTML = wireTable());
  mode === 'bom' && (sheet.innerHTML = bomTable());
  mode === 'model' && view.resize();
}

function expose() {
  window.__studio = {
    ready: true,
    result: state.result,
    assembly: state.assembly,
    db: state.db,
    explode: state.explode,
    optSummary: state.optSummary,
    frameCheck: () => view.frameCheck(),
    setWheel,
    pick,
    undo,
    optimize: opts => runOptimize(opts)
  };
}

function syncPreset() {
  const sel = $('#preset');
  if (![...sel.options].some(o => o.value === state.assembly.id)) {
    const opt = document.createElement('option');
    opt.value = state.assembly.id;
    opt.textContent = state.assembly.name;
    sel.appendChild(opt);
  }
  sel.value !== state.assembly.id && (sel.value = state.assembly.id);
}

function paint() {
  syncPreset();
  $('#undo').disabled = undoStack.length === 0;
  paintMetrics();
  paintPanel();
  paintSide();
  paintView();
  expose();
}

function updatePrintParam(mutator) {
  remember();
  const fSlot = frameOf();
  if (fSlot.component !== 'print-x-226' && state.db.components['print-x-226']) {
    fSlot.component = 'print-x-226';
  }
  const comp = state.db.components[fSlot.component];
  comp.geometry.primitive = { ...comp.geometry.primitive, type: 'x-frame' };
  comp.specs.print = { material: state.optMat, infill_pct: 40, walls: 3, sliced: true, ...(comp.specs.print || {}) };
  mutator(comp, comp.geometry.primitive, comp.specs.print);
  go();
}

document.body.addEventListener('input', e => {
  if (e.target.id === 'wheelbase' || e.target.id === 'wheelbase-range') {
    const n = Number(e.target.value);
    if (Number.isFinite(n) && n >= 80) setWheel(n);
    return;
  }
  if (e.target.id === 'explode') {
    state.explode = Number(e.target.value) / 100;
    view.setExplode(state.explode);
    window.__studio && (window.__studio.explode = state.explode);
    return;
  }
  if (e.target.id === 'print-arm-w') return updatePrintParam((c, g) => { g.arm_w_mm = Number(e.target.value); });
  if (e.target.id === 'print-arm-tip') return updatePrintParam((c, g) => { g.arm_tip_w_mm = Number(e.target.value); });
  if (e.target.id === 'print-arm-t') return updatePrintParam((c, g) => { g.arm_t_mm = Number(e.target.value); });
  if (e.target.id === 'print-pocket') return updatePrintParam((c, g) => { g.pocket_ratio = Number(e.target.value) / 100; });
  if (e.target.id === 'print-infill') return updatePrintParam((c, g, p) => { p.infill_pct = Number(e.target.value); p.sliced = true; });
  if (e.target.id === 'print-walls') return updatePrintParam((c, g, p) => { p.walls = Number(e.target.value); p.sliced = true; });
  if (!e.target.dataset || !e.target.dataset.mission) return;
  remember();
  state.assembly.mission[e.target.dataset.mission] = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
  go();
});

document.body.addEventListener('change', e => {
  if (e.target.id === 'preset') {
    remember();
    state.assembly = structuredClone(state.db.assemblies[e.target.value]);
    state.optSummary = null;
    state.sel = null;
    return go();
  }
  if (e.target.id === 'opt-mode') { state.optMode = e.target.value; return; }
  if (e.target.id === 'opt-mat') { state.optMat = e.target.value; return; }
  if (e.target.id === 'print-mat') {
    state.optMat = e.target.value;
    const mat = PRINT_MATERIALS[state.optMat];
    return updatePrintParam((c, g, p) => {
      p.material = state.optMat;
      p.sliced = true;
      if (mat) c.specs.density_g_cm3 = mat.density_g_cm3;
    });
  }
  if (e.target.id === 'print-flat') return updatePrintParam((c, g) => { g.flat_bottom = !!e.target.checked; });
  if (e.target.dataset && e.target.dataset.slot) {
    remember();
    state.assembly.placements.find(p => p.id === e.target.dataset.slot).component = e.target.value;
    return go();
  }
  if (e.target.dataset && e.target.dataset.mission) {
    state.assembly.mission[e.target.dataset.mission] = e.target.value;
    return go();
  }
});

document.body.addEventListener('click', e => {
  if (e.target.id === 'run-optimize') return runOptimize();
  const net = e.target.closest('[data-net]');
  if (net) {
    state.net = net.dataset.net;
    view.setWireFilter(state.net);
    $('#wire-toggle').classList.toggle('on', state.net !== 'off');
    state.step === 'wiring' && paint();
    return;
  }
  const drawn = e.target.closest('[data-id]');
  if (drawn) return pick(drawn.dataset.id);
  const slot = e.target.closest('[data-pick]');
  if (slot) return pick(slot.dataset.pick);
});

$('#rail').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  state.step = b.dataset.step;
  paint();
});

$('#conceive').addEventListener('click', () => {
  remember();
  const out = conceive({ ...state.assembly.mission }, state.db);
  state.assembly = out.assembly;
  state.result = out.result;
  state.optSummary = null;
  state.sel = null;
  paint();
});

$('#optimize').addEventListener('click', () => runOptimize());
$('#undo').addEventListener('click', () => undo());
$('#fit').addEventListener('click', () => view && view.fit());
$('#wire-toggle').addEventListener('click', () => {
  state.net = state.net === 'off' ? 'all' : 'off';
  $('#wire-toggle').classList.toggle('on', state.net !== 'off');
  view.setWireFilter(state.net);
  state.step === 'wiring' && paint();
});
$('#exp-bom').addEventListener('click', () => dl('bom.csv', new Blob([bomCSV(state.result)], { type: 'text/csv' })));
$('#exp-svg').addEventListener('click', () => dl('drawing.svg', new Blob([state.result.drawing], { type: 'image/svg+xml' })));
$('#exp-stl').addEventListener('click', () => dl('frame.stl', new Blob([state.result.frameStl], { type: 'model/stl' })));
$('#exp-json').addEventListener('click', () => dl(state.assembly.id + '.json', new Blob([JSON.stringify(state.assembly, null, 2)], { type: 'application/json' })));

addEventListener('keydown', e => {
  const typing = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (typing) return;
  e.key === 'Escape' && pick(null);
  e.key.toLowerCase() === 'f' && view && view.fit();
  const step = { '1': 'mission', '2': 'parts', '3': 'print', '4': 'model', '5': 'wiring', '6': 'drawing', '7': 'bom' }[e.key];
  if (step) { state.step = step; paint(); }
});

const boot = async () => {
  const embedded = window.__DRONE_DB;
  const res = embedded ? null : await fetch('data/index.json').catch(() => null);
  if (!embedded && !(res && res.ok)) {
    $('#panel').innerHTML = '<h2>No index</h2><p class="lede">Run npm start so data/index.json is built.</p>';
    return;
  }
  state.db = embedded || await res.json();
  state.assembly = structuredClone(state.db.assemblies['yard-5']);
  $('#preset').innerHTML = Object.values(state.db.assemblies).map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('');
  view = createView($('#canvas-host'), { onPick: id => pick(id), onHover: (id, x, y) => showTip(id, x, y) });
  go();
};
boot();
$('#to-cad').addEventListener('click', () => {
  const pl = state.assembly.placements, sp = id => (state.db.components[id] || {}).specs || {}, all = pl.map(p => ({ id: p.component, s: sp(p.component) })), pick = f => (all.find(x => f(x.s)) || { s: {} }).s;
  const pr = pick(s => s.diameter_mm), mo = pick(s => s.kv), ba = pick(s => s.cells_s), fr = (pl.find(p => p.id === 'frame') || {}).component || '', fw = sp(fr).wheelbase_mm;
  const type = /saucer/.test(fr) ? 'saucer' : /duct|whoop|cine/.test(fr) ? 'whoop' : /deadcat/.test(fr) ? 'deadcat' : /hex/.test(fr) ? 'hex' : /stretch/.test(fr) ? 'stretch' : /(^|-)h-/.test(fr) ? 'h' : pr.diameter_mm >= 170 ? 'lr' : pr.diameter_mm && pr.diameter_mm < 80 ? 'toothpick' : 'x';
  const o = { type, prop: pr.diameter_mm, pitch: pr.pitch_in && pr.pitch_in * 25.4, blades: pr.blades, kv: mo.kv, cells: ba.cells_s, mah: ba.capacity_ah && ba.capacity_ah * 1000, m_motor: mo.mass_g, m_prop: pr.mass_g, m_bat: ba.mass_g, wheelbase: type === 'saucer' ? undefined : fw };
  Object.keys(o).forEach(k => (o[k] == null || o[k] === '' || Number.isNaN(o[k])) && delete o[k]);
  localStorage.setItem('amni-drone-handoff', JSON.stringify({ o, name: state.assembly.name, at: Date.now() }));
  window.open(new URL('/cad/#drone', location.href).href, '_blank', 'noopener');
});
