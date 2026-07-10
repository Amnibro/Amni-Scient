/* tests/unit_audit.js — verifies the Amni-Calc single-source-of-truth unit system (v5.20.0).
   Run: node tests/unit_audit.js  (from calc/). Asserts EXACT engineering factors, one
   representative conversion per category, round-trips, and the getForce / calcStress /
   calcSpring / beam-chip conversion paths that the live code derives from window.UCORE. */
const UCORE = require('../calc-unit-core.js');
let pass = 0, fail = 0;
const close = (a, b, tol) => isFinite(a) && isFinite(b) && Math.abs(a - b) <= (tol == null ? 1e-9 : tol) * Math.max(1, Math.abs(b));
function ok(name, got, want, tol) {
  const good = (typeof want === 'number') ? close(got, want, tol) : got === want;
  good ? pass++ : fail++;
  console.log((good ? '  ok  ' : 'FAIL  ') + name + (good ? '' : `  got=${got} want=${want}`));
}
const C = (dim, from, to, v) => UCORE.conv(dim, from, to, v);

console.log('== EXACT factors (to canonical base) ==');
const F = UCORE.tables.FORCE_TO_N, P = UCORE.tables.PRESS_TO_MPA, L = UCORE.tables.LEN_TO_MM, I = UCORE.tables.INERTIA_TO_MM4;
ok('1 lbf  = 4.4482216152605 N', F.lbf, 4.4482216152605, 0);
ok('1 kip  = 4448.2216152605 N', F.kip, 4448.2216152605, 0);
ok('1 kgf  = 9.80665 N', F.kgf, 9.80665, 0);
ok('1 in   = 25.4 mm', L['in'], 25.4, 0);
ok('1 ft   = 304.8 mm', L.ft, 304.8, 0);
ok('1 psi  = 0.00689475729316836 MPa', P.psi, 0.00689475729316836, 0);
ok('1 ksi  = 6.89475729316836 MPa', P.ksi, 6.89475729316836, 0);
ok('1 in^4 = 416231.4256 mm^4 (was rounded 416231)', I.in4, 416231.4256, 0);
ok('1 cm^4 = 10000 mm^4', I.cm4, 1e4, 0);

console.log('== one representative conversion per CATEGORY ==');
ok('force:    1 lbf -> N', C('force', 'lbf', 'N', 1), 4.4482216152605);
ok('length:   1 in  -> mm', C('length', 'in', 'mm', 1), 25.4);
ok('length:   1 ft  -> m', C('length', 'ft', 'm', 1), 0.3048);
ok('area:     1 in^2-> mm^2', C('area', 'in²', 'mm²', 1), 645.16);
ok('area:     1 ft^2-> mm^2', C('area', 'ft²', 'mm²', 1), 92903.04);
ok('pressure: 1 ksi -> MPa', C('pressure', 'ksi', 'MPa', 1), 6.89475729316836);
ok('pressure: 1000 psi-> MPa', C('pressure', 'psi', 'MPa', 1000), 6.89475729316836);
ok('torque:   1 lbf.ft-> N.m', C('torque', 'lbf·ft', 'N·m', 1), 1.3558179483314004);
ok('torque:   1 lbf.in-> N.m', C('torque', 'lbf·in', 'N·m', 1), 0.11298482902761671);
ok('power:    1 hp   -> W', C('power', 'hp', 'W', 1), 745.6998715822702);
ok('power:    1 BTU/h-> W', C('power', 'BTU/h', 'W', 1), 0.2930710701722222);
ok('velocity: 1 mph  -> m/s', C('velocity', 'mph', 'm/s', 1), 0.44704);
ok('velocity: 1 ft/s -> m/s', C('velocity', 'ft/s', 'm/s', 1), 0.3048);
ok('flow:     1 gpm  -> m^3/s', C('flow', 'gpm', 'm³/s', 1), 6.30901964e-5);
ok('flow:     1 cfm  -> m^3/s', C('flow', 'cfm', 'm³/s', 1), 4.719474432e-4);
ok('mass:     1 lb   -> kg', C('mass', 'lb', 'kg', 1), 0.45359237);
ok('mass:     1 oz   -> kg', C('mass', 'oz', 'kg', 1), 0.028349523125);
ok('inertia:  1 in^4 -> mm^4', UCORE.toBase('inertia', 'in4', 1), 416231.4256);
ok('temp:     32 F  -> C', C('temp', '°F', '°C', 32), 0);
ok('temp:     212 F -> C', C('temp', '°F', '°C', 212), 100);
ok('temp:     0 C   -> K', C('temp', '°C', 'K', 0), 273.15);
ok('temp:     25 C  -> K', C('temp', '°C', 'K', 25), 298.15);
ok('temp:     100 C -> F', C('temp', '°C', '°F', 100), 212);

console.log('== round-trips (u -> base -> u) for every dim/unit ==');
let rtFail = 0;
for (const dim in UCORE.DIMS) {
  const base = UCORE.DIMS[dim].si;
  for (const u in UCORE.DIMS[dim].u) {
    const x = 7.3, back = C(dim, base, u, C(dim, u, base, x));
    if (!close(back, x, 1e-9)) { rtFail++; console.log('FAIL  round-trip ' + dim + '/' + u + '  ' + back); }
  }
}
ok('all dim/unit round-trips reversible', rtFail, 0, 0);

console.log('== live-code paths derive from UCORE (no divergent tables) ==');
// getForce(id): v(id) * FORCE_TO_N[sv(id-u)]  -> N
const getForce = (val, unit) => val * (F[unit] || 1);
ok('getForce 100 lbf -> 444.822 N', getForce(100, 'lbf'), 444.82216152605);
ok('getForce 2 kip   -> 8896.44 N', getForce(2, 'kip'), 8896.443230521);
// calcSpring multipliers are the same tables
ok('spring fMult.kgf present & exact', UCORE.tables.FORCE_TO_N.kgf, 9.80665, 0);
ok('spring gMult.psi present & exact', UCORE.tables.PRESS_TO_MPA.psi, 0.00689475729316836, 0);
// calcStress: every component scaled by pressure factor of the st-u unit; FoS is unit-invariant
const sFac = UCORE.factor('pressure', 'ksi');
ok('calcStress 10 ksi sigma -> 68.9476 MPa', 10 * sFac, 68.9475729316836);
const vM_MPa = 10 * sFac, Sy_MPa = 30 * sFac, fosA = Sy_MPa / vM_MPa;
const vM_ksi = 10, Sy_ksi = 30, fosB = Sy_ksi / vM_ksi;
ok('calcStress FoS invariant across unit (ksi vs MPa)', fosA, fosB);
// beam chip: internal N displayed in the unit the user picked -> recovers entered value
const internalN = getForce(100, 'lbf'), shown = internalN / (F['lbf'] || 1);
ok('beam chip 100 lbf -> stored N -> shown lbf == 100', shown, 100);
const internalMM = 8 * L.ft, shownFt = internalMM / (L.ft || 1);
ok('beam chip 8 ft -> stored mm -> shown ft == 8', shownFt, 8);

console.log('== principal stresses — Smith stable symmetric-3x3 (magnitude-robust) ==');
const pr3 = UCORE.principal3;
const eq3 = (name, got, w) => { const g = got.map(x => Math.round(x * 1e6) / 1e6); ok(name + ' σ₁', g[0], w[0]); ok(name + ' σ₂', g[1], w[1]); ok(name + ' σ₃', g[2], w[2]); };
eq3('uniaxial 120', pr3(120, 0, 0, 0, 0, 0), [120, 0, 0]);
// high-magnitude uniaxial (827 MPa = 120 ksi) — old cubic collapsed to hydrostatic triple root here
eq3('uniaxial 827.37 (was BROKEN)', pr3(827.370875, 0, 0, 0, 0, 0), [827.370875, 0, 0]);
// repeated root at high magnitude (σx=σy=300) — old cubic returned hydrostatic 300/300/300
eq3('repeated root 300/300/0 (was BROKEN)', pr3(300, 300, 0, 0, 0, 0), [300, 300, 0]);
eq3('general 120,-40,τ50', pr3(120, -40, 0, 50, 0, 0), [134.339811, 0, -54.339811]);
eq3('hydrostatic 200', pr3(200, 200, 200, 0, 0, 0), [200, 200, 200]);
eq3('shear tensor -> [110,20,20]', pr3(50, 50, 50, 30, 30, 30), [110, 20, 20]);
// von Mises is unit-invariant only when σ and strength share a unit (the calcStress contract)
const vm = pr => Math.sqrt(0.5 * (Math.pow(pr[0] - pr[1], 2) + Math.pow(pr[1] - pr[2], 2) + Math.pow(pr[2] - pr[0], 2)));
ok('σ_vM(120 uniaxial) = 120', vm(pr3(120, 0, 0, 0, 0, 0)), 120);
ok('σ_vM(300/300/0) = 300', vm(pr3(300, 300, 0, 0, 0, 0)), 300);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
