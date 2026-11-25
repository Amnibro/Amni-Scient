import { resolve } from './resolve.js';
import { conceive } from './conceive.js';

export const PRINT_MATERIALS = {
  'petg': {
    id: 'petg',
    name: 'PETG Standard',
    density_g_cm3: 1.27,
    E_mpa: 2150,
    yield_mpa: 48,
    usd_kg: 22,
    nozzle_c: 240,
    bed_c: 75,
    note: 'Tough, low warp, good layer adhesion for low-budget printed quads.'
  },
  'pla-plus': {
    id: 'pla-plus',
    name: 'PLA+ / Tough PLA',
    density_g_cm3: 1.24,
    E_mpa: 3100,
    yield_mpa: 55,
    usd_kg: 19,
    nozzle_c: 215,
    bed_c: 60,
    note: 'High stiffness and easiest printability; avoid hot car trunks (>55 °C).'
  },
  'petg-cf': {
    id: 'petg-cf',
    name: 'PETG-CF (15% Carbon)',
    density_g_cm3: 1.29,
    E_mpa: 4800,
    yield_mpa: 68,
    usd_kg: 34,
    nozzle_c: 255,
    bed_c: 80,
    note: 'Doubles flexural stiffness over plain PETG for cleaner gyro traces.'
  },
  'pa-cf': {
    id: 'pa-cf',
    name: 'PA12-CF (Carbon Nylon)',
    density_g_cm3: 1.15,
    E_mpa: 6500,
    yield_mpa: 95,
    usd_kg: 58,
    nozzle_c: 275,
    bed_c: 90,
    note: 'Lightest and stiffest printable airframe material; requires hardened nozzle.'
  },
  'asa': {
    id: 'asa',
    name: 'ASA Impact / UV',
    density_g_cm3: 1.07,
    E_mpa: 2050,
    yield_mpa: 42,
    usd_kg: 26,
    nozzle_c: 250,
    bed_c: 95,
    note: 'Lowest density (1.07 g/cm³) and high weather/heat resistance.'
  }
};

const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;

export function analyzePrint(comp, meshVolMm3, placed, db) {
  if (!comp || !comp.geometry || !comp.geometry.primitive) return null;
  const g = comp.geometry.primitive;
  const pSpec = (comp.specs && comp.specs.print) || {};
  const matKey = pSpec.material && PRINT_MATERIALS[pSpec.material] ? pSpec.material : 'petg';
  const mat = PRINT_MATERIALS[matKey];
  const density = (comp.specs && comp.specs.density_g_cm3) || mat.density_g_cm3;

  const armW = g.arm_w_mm || 12;
  const armTipW = g.arm_tip_w_mm || armW;
  const armAvgW = (armW + armTipW) / 2;
  const armT = g.arm_t_mm || 6;
  const plate = g.plate_mm || [52, 2.5, 52];
  const pocket = g.pocket_ratio ?? 0;
  const flatBottom = !!g.flat_bottom;

  const walls = pSpec.walls ?? 3;
  const infillPct = pSpec.infill_pct ?? 40;
  const wallMm = walls * 0.4;
  const topBotMm = 4 * 0.2;

  const coreW = Math.max(0, armAvgW - 2 * wallMm);
  const coreT = Math.max(0, armT - 2 * topBotMm);
  const coreFrac = (coreW * coreT) / Math.max(1, armAvgW * armT);
  const shellFrac = Math.min(1, Math.max(0.28, 1 - coreFrac * 0.85));
  const effFrac = shellFrac + (1 - shellFrac) * (infillPct / 100);

  const volCm3 = meshVolMm3 / 1000;
  const solidMassG = volCm3 * density;
  const slicedMassG = volCm3 * density * effFrac;
  const activeMassG = pSpec.sliced ? slicedMassG : solidMassG;

  const wheel = (comp.layout && comp.layout.pattern && comp.layout.pattern.wheelbase_mm) || (comp.specs && comp.specs.wheelbase_mm) || 226;
  const armSpanMm = Math.max(32, wheel / 2 - Math.min(plate[0], plate[2]) * 0.52);
  const motorY = (comp.layout && comp.layout.pattern && comp.layout.pattern.motor_y_mm) || 8.5;
  const underGapMm = flatBottom ? 0 : Math.max(0, motorY - armT);
  const supportG = underGapMm > 0.4 ? r1((4 * armSpanMm * armAvgW * underGapMm / 1000) * density * 0.28) : 0;

  const totalPrintG = activeMassG + supportG;
  const totalPrintMm3 = (totalPrintG / density) * 1000;
  const filamentM = r2(totalPrintMm3 / 2.405 / 1000);
  const filamentUsd = r2((totalPrintG / 1000) * mat.usd_kg);
  const printTimeMin = Math.round(totalPrintMm3 / (7.5 * 60) + 10);

  // Structural mechanics under peak thrust + 1.5x dynamic maneuver load
  const motors = (placed || []).filter(p => p.comp && p.comp.function.role === 'motor');
  const motorComp = motors[0] && motors[0].comp;
  const motorMassG = motorComp ? (motorComp.specs.mass_g || 30.4) : 30.4;
  let peakThrustG = 850;
  const propPlaced = (placed || []).find(p => p.comp && p.comp.function.role === 'prop');
  const batPlaced = (placed || []).find(p => p.comp && p.comp.function.role === 'battery');
  const cells = batPlaced && batPlaced.comp ? batPlaced.comp.specs.cells_s : 4;
  if (db && db.combos && motorComp && propPlaced) {
    const combo = Object.values(db.combos).find(c => c.motor === motorComp.id && c.prop === propPlaced.comp.id && c.cells === cells);
    if (combo && combo.points && combo.points.length) {
      const maxPt = Math.max(...combo.points.map(pt => pt.thrust_g || 0));
      if (maxPt > 0) peakThrustG = maxPt;
    }
  }
  const loadN = (peakThrustG / 1000) * 9.80665 * 1.5;

  // Gusseted root + outer rail truss places material at the outer fibers (high I/mass efficiency)
  const effRootW = armW * (1 - pocket * 0.15);
  const effMidW = armAvgW * (1 - pocket * 0.25);
  const skinStiffnessFactor = Math.min(1, shellFrac * 1.22 + (1 - shellFrac) * Math.pow(infillPct / 100, 1.25));
  const E_eff = mat.E_mpa * skinStiffnessFactor;
  const yield_eff = mat.yield_mpa * (0.68 + 0.32 * skinStiffnessFactor);

  const I_root = (effRootW * Math.pow(armT, 3)) / 12;
  const I_mid = (effMidW * Math.pow(armT, 3)) / 12;
  const Z_root = I_root / (armT / 2);

  const momentNmm = loadN * armSpanMm * 0.72; // Root gusset & motor pad restraint factor
  const stressMpa = momentNmm / Math.max(1e-3, Z_root);
  const safetyFactor = yield_eff / Math.max(0.1, stressMpa);
  // Gusseted cantilever deflection (k_eff = 8.5 * E * I / L^3)
  const deflectionMm = (loadN * Math.pow(armSpanMm, 3)) / (8.5 * E_eff * Math.max(1, I_mid));

  const tipMassKg = (motorMassG + 4.2) / 1000;
  const armMassKg = ((armSpanMm * armAvgW * armT / 1000) * density * effFrac * (1 - pocket * 0.35)) / 1000;
  const eqMassKg = tipMassKg + 0.22 * armMassKg;
  const kArmNPerM = (8.5 * E_eff * I_mid) / Math.pow(armSpanMm, 3) * 1000;
  const armFreqHz = (1 / (2 * Math.PI)) * Math.sqrt(kArmNPerM / Math.max(1e-5, eqMassKg));

  const padD = g.motor_pad_d_mm || 27;
  const spanXZ = r1(wheel / Math.SQRT2 + padD);
  const fits180 = spanXZ <= 180;
  const fits220 = spanXZ <= 220;
  const fits256 = spanXZ <= 256;

  return {
    is_printable: comp.sourcing && comp.sourcing.status === 'maker',
    material_id: mat.id,
    material_name: mat.name,
    density_g_cm3: density,
    infill_pct: infillPct,
    walls,
    sliced: !!pSpec.sliced,
    shell_frac: r2(shellFrac),
    eff_frac: r2(effFrac),
    vol_cm3: r2(volCm3),
    solid_mass_g: r1(solidMassG),
    sliced_mass_g: r1(slicedMassG),
    active_mass_g: r1(activeMassG),
    support_g: supportG,
    flat_bottom: flatBottom,
    filament_m: filamentM,
    filament_usd: filamentUsd,
    print_time_min: printTimeMin,
    arm_span_mm: r1(armSpanMm),
    load_n: r1(loadN),
    stress_mpa: r1(stressMpa),
    safety_factor: r2(safetyFactor),
    deflection_mm: r2(deflectionMm),
    arm_freq_hz: Math.round(armFreqHz),
    span_xz_mm: spanXZ,
    fits_180: fits180,
    fits_220: fits220,
    fits_256: fits256
  };
}

const buyable = c => c.sourcing && ['buyable', 'included'].includes(c.sourcing.status) && c.sourcing.price && typeof c.sourcing.price.q1 === 'number', propFits = (f, p) => !f.specs.prop_in || (p.specs.class_in >= f.specs.prop_in[0] && p.specs.class_in <= f.specs.prop_in[1]);
export function partsSearch(assembly, rawDb) {
  const before = resolve(assembly, rawDb), m = assembly.mission || {}, C = rawDb.components, want = m.twr_min || 2, budget = m.budget_usd || Infinity, all = role => Object.values(C).filter(c => c.function.role === role && buyable(c)), roleOf = id => C[id] && C[id].function.role;
  const swap = (combo, f, b) => { const a = structuredClone(assembly); a.mission = { ...m, prop_in: C[combo.prop].specs.class_in, cells: combo.cells }; a.placements.forEach(p => { const r = roleOf(p.component); p.component = r === 'frame' ? f.id : r === 'motor' ? combo.motor : r === 'prop' ? combo.prop : r === 'battery' ? b.id : p.component; }); return a; };
  let best = null, tried = 0, kept = 0;
  Object.values(rawDb.combos || {}).filter(c => (c.points || []).length > 1 && C[c.motor] && C[c.prop] && buyable(C[c.motor]) && buyable(C[c.prop])).forEach(combo => all('frame').filter(f => propFits(f, C[combo.prop])).forEach(f => all('battery').filter(b => b.specs.cells_s === combo.cells).forEach(b => { tried++; const a = swap(combo, f, b); let r = null; try { r = resolve(a, rawDb); } catch { return; } const ok = !r.errors && r.twr != null && r.twr + 1e-6 >= want && r.minutes != null && r.cost_usd <= budget; ok && kept++; ok && (!best || r.minutes > best.r.minutes + 1e-9 || (Math.abs(r.minutes - best.r.minutes) < 1e-9 && r.cost_usd < best.r.cost_usd)) && (best = { a, r, combo, f, b }); })));
  const aft = best ? best.r : before;
  return { assembly: best ? best.a : assembly, result: aft, summary: { mode: 'flight-parts', tried, kept, before_minutes: before.minutes, after_minutes: aft.minutes, before_twr: before.twr, after_twr: aft.twr, before_cost_usd: before.cost_usd, after_cost_usd: aft.cost_usd, before_mass_g: before.mass_g, after_mass_g: aft.mass_g, picks: best ? { frame: best.f.name, motor: C[best.combo.motor].name, prop: C[best.combo.prop].name, battery: best.b.name } : null, note: best ? '' : 'None of the ' + tried + ' buyable frame, motor, prop and pack sets with a real thrust table meets thrust-to-weight ' + want + (budget < Infinity ? ' and the $' + budget + ' budget' : '') + ' without errors. Add a thrust table under combos/ to widen the search.' } };
}
export function optimizeBuild(assembly, rawDb, opts = {}) {
  const mode = opts.mode || 'weight-print';
  if (mode === 'flight-parts') return partsSearch(assembly, rawDb);
  const pf = rawDb.components['print-x-226'], pr = assembly.placements.map(p => rawDb.components[p.component]).find(c => c && c.function.role === 'prop');
  if (mode !== 'budget-weight' && pf && pr && !propFits(pf, pr)) return { assembly, result: resolve(assembly, rawDb), summary: { mode, note: 'The printed frame takes props up to ' + pf.specs.prop_in[1] + ' in. This build flies ' + pr.specs.class_in + ' in props, so its frame stays. Longest Flight searches parts for this size.' } };
  const matId = opts.material && PRINT_MATERIALS[opts.material] ? opts.material : 'petg';
  const mat = PRINT_MATERIALS[matId];
  const minSf = opts.min_sf ?? 2.2;
  const maxDefl = opts.max_deflection_mm ?? 1.25;
  const minFreq = opts.min_freq_hz ?? 145;

  const beforeRes = resolve(assembly, rawDb);
  const beforeFrame = beforeRes.placed.find(p => p.role === 'frame');
  const beforeWheel = (rawDb.components[beforeFrame.component].layout.pattern && rawDb.components[beforeFrame.component].layout.pattern.wheelbase_mm) || 226;

  let nextAssembly = structuredClone(assembly);
  if (mode === 'budget-weight' && nextAssembly.mission) {
    const conceived = conceive(nextAssembly.mission, rawDb);
    nextAssembly = conceived.assembly;
  }

  const frameSlot = nextAssembly.placements.find(p => p.id === 'frame');
  if (frameSlot && rawDb.components['print-x-226']) {
    frameSlot.component = 'print-x-226';
  }

  const propSlot = nextAssembly.placements.find(p => {
    const c = rawDb.components[p.component];
    return c && c.function.role === 'prop';
  });
  const propD = (propSlot && rawDb.components[propSlot.component].specs.diameter_mm) || 131.8;
  const minGap = (rawDb.flight && rawDb.flight.prop_gap_mm != null) ? rawDb.flight.prop_gap_mm : 8;
  const minWheel = Math.ceil((propD + minGap + 2.2) * Math.SQRT2);
  const candidateWheels = mode === 'stiffness'
    ? [minWheel, minWheel + 4]
    : [minWheel, minWheel + 2, minWheel + 6];

  let best = null;

  const armWs = mode === 'stiffness' ? [13.5, 14.5, 15.5] : [11.0, 11.5, 12.0, 12.5, 13.5];
  const armRatios = [0.72, 0.78, 0.84];
  const armTs = mode === 'stiffness' ? [7.5, 8.0, 8.5] : [6.5, 7.0, 7.5, 8.0];
  const pockets = mode === 'stiffness' ? [0.18, 0.26] : [0.28, 0.35, 0.42];
  const infills = mode === 'stiffness' ? [45, 55] : [25, 30, 35, 40];
  const wallList = [2, 3];

  const probeDb = structuredClone(rawDb);
  const pComp = probeDb.components[frameSlot.component];
  pComp.specs.density_g_cm3 = mat.density_g_cm3;

  for (const wheel of candidateWheels) {
    if (pComp.layout && pComp.layout.pattern) pComp.layout.pattern.wheelbase_mm = wheel;
    for (const armW of armWs) {
      for (const tipRatio of armRatios) {
        const armTipW = r1(armW * tipRatio);
        for (const armT of armTs) {
          for (const pocket of pockets) {
            for (const infill of infills) {
              for (const walls of wallList) {
                pComp.geometry.primitive = {
                  ...pComp.geometry.primitive,
                  type: 'x-frame',
                  plate_mm: [46, 2.0, 46],
                  arm_w_mm: armW,
                  arm_tip_w_mm: armTipW,
                  arm_t_mm: armT,
                  pocket_ratio: pocket,
                  flat_bottom: true
                };
                pComp.specs.print = {
                  material: matId,
                  infill_pct: infill,
                  walls,
                  sliced: true
                };
                const estVolMm3 = (46 * 46 * 2.0 + 4 * (wheel * 0.34) * ((armW + armTipW) / 2) * armT * (1 - pocket * 0.38) + 4200);
                const pr = analyzePrint(pComp, estVolMm3, beforeRes.placed, probeDb);
                if (!pr || pr.safety_factor < minSf || pr.deflection_mm > maxDefl || pr.arm_freq_hz < minFreq || !pr.fits_220) continue;

                const score = mode === 'stiffness'
                  ? -pr.arm_freq_hz * 2.2 + pr.deflection_mm * 35 + pr.active_mass_g * 0.35
                  : pr.active_mass_g + pr.support_g * 2 - pr.safety_factor * 0.25;

                if (!best || score < best.score) {
                  best = { score, wheel, armW, armTipW, armT, pocket, infill, walls, plate: [46, 2.0, 46] };
                }
              }
            }
          }
        }
      }
    }
  }

  if (!best) {
    best = { wheel: minWheel, armW: 12.5, armTipW: 9.5, armT: 7.5, pocket: 0.32, infill: 35, walls: 2, plate: [46, 2.0, 46] };
  }

  const targetComp = rawDb.components[frameSlot.component];
  targetComp.specs.density_g_cm3 = mat.density_g_cm3;
  targetComp.specs.print = {
    material: matId,
    infill_pct: best.infill,
    walls: best.walls,
    sliced: true
  };
  targetComp.geometry.primitive = {
    ...targetComp.geometry.primitive,
    type: 'x-frame',
    plate_mm: best.plate,
    arm_w_mm: best.armW,
    arm_tip_w_mm: best.armTipW,
    arm_t_mm: best.armT,
    pocket_ratio: best.pocket,
    flat_bottom: true
  };
  Object.values(rawDb.components).forEach(c => {
    if (c.layout && c.layout.pattern && (c.id === targetComp.id || (c.files && c.files.layout === (targetComp.files && targetComp.files.layout)))) {
      c.layout.pattern.wheelbase_mm = best.wheel;
    }
  });

  let afterRes = resolve(nextAssembly, rawDb);
  if (afterRes.errors > 0) {
    Object.values(rawDb.components).forEach(c => {
      if (c.layout && c.layout.pattern) c.layout.pattern.wheelbase_mm = best.wheel + 4;
    });
    afterRes = resolve(nextAssembly, rawDb);
  }

  const afterFrame = afterRes.placed.find(p => p.role === 'frame');
  const summary = {
    mode,
    material: mat.name,
    before_mass_g: beforeRes.mass_g,
    after_mass_g: afterRes.mass_g,
    saved_g: r1(beforeRes.mass_g - afterRes.mass_g),
    saved_pct: r1((beforeRes.mass_g - afterRes.mass_g) / Math.max(1, beforeRes.mass_g) * 100),
    frame_before_g: beforeFrame ? beforeFrame.mass_g : 0,
    frame_after_g: afterFrame ? afterFrame.mass_g : 0,
    before_cost_usd: beforeRes.cost_usd,
    after_cost_usd: afterRes.cost_usd,
    wheelbase_before_mm: beforeWheel,
    wheelbase_after_mm: best.wheel,
    arm_w_mm: best.armW,
    arm_tip_w_mm: best.armTipW,
    arm_t_mm: best.armT,
    pocket_ratio: best.pocket,
    infill_pct: best.infill,
    walls: best.walls,
    print: afterRes.print
  };

  return { assembly: nextAssembly, result: afterRes, summary };
}
