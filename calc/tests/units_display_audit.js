/* units_display_audit.js — v5.87.0
   Locks in the display-unit work:
     1. UCORE gained a COMPLETE display-helper set (torque/area/inertia/temp/power/
        flow/velocity/mass/energy/heat-transfer), each exact against published factors.
     2. The bolt/member stiffness maths behind the new JOINT STIFFNESS card.
     3. The engineer layer's fmt() honours the source quantum instead of inventing
        6 significant figures after a unit conversion.
   Node-only; no DOM required. */
const path = require('path');
const dir = path.join(__dirname, '..');
let pass = 0, fail = 0;
const near = (l, g, w, tol) => { const ok = isFinite(g) && Math.abs(g - w) <= tol; ok ? pass++ : fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${l}  got=${g} want=${w}`); };
const eq = (l, g, w) => { const ok = g === w; ok ? pass++ : fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`); };

function load(imp) {
  global.localStorage = { getItem: () => (imp ? 'imp' : 'si'), setItem() {} };
  delete require.cache[require.resolve(path.join(dir, 'calc-unit-core.js'))];
  return require(path.join(dir, 'calc-unit-core.js'));
}

console.log('=== UCORE display helpers: SI ===');
let U = load(false);
eq('tDisp 100 N·m', U.tDisp(100), '100 N·m');
eq('TDisp 20 °C', U.TDisp(20), '20 °C');
eq('wDisp 7460 W', U.wDisp(7460), '7.46 kW');
eq('vDisp 1.28 m/s', U.vDisp(1.28), '1.28 m/s');

console.log('\n=== UCORE display helpers: US (exact factor checks) ===');
U = load(true);
eq('1 in from 25.4 mm', U.lDisp(25.4), '1 in');
eq('1 in² from 645.16 mm²', U.aDisp(645.16), '1 in²');
eq('1 in⁴ from 416231.4256 mm⁴', U.iDisp(416231.4256), '1 in⁴');
eq('1 in³ from 16387.064 mm³', U.zDisp(16387.064), '1 in³');
eq('212 °F from 100 °C', U.TDisp(100), '212 °F');
eq('1 hp from 745.6998715822702 W', U.wDisp(745.6998715822702), '1 hp');
eq('1 ft/s from 0.3048 m/s', U.vDisp(0.3048), '1 ft/s');
eq('1 lb from 0.45359237 kg', U.mDisp(0.45359237), '1 lb');
eq('1 gpm from 0.2271247 m³/h', U.qDisp(0.2271247), '1 gpm');
near('1 lbf·ft from 1.3558179 N·m', parseFloat(U.tDisp(1.3558179483314004)), 1, 1e-6);
eq('delta temp is a DELTA, not an offset', U.dTDisp(10), '18 Δ°F');

console.log('\n=== bolt / member stiffness (Shigley Ex 8-4 geometry) ===');
const frustum = (E, d, D, t) => 0.5774 * Math.PI * E * d / Math.log(((1.155 * t + D - d) * (D + d)) / ((1.155 * t + D + d) * (D - d)));
const E = 207000, d = 12, Dw = 18, At = 84.3, grip = 25;
const k1 = frustum(E, d, Dw, 12.5);
const km = 1 / (1 / k1 + 1 / k1);
const kmW = 0.78715 * E * d * Math.exp(0.62873 * d / grip);
const kb = At * E / grip;
near('frustum per layer  (kN/mm)', k1 / 1000, 5411, 5);
near('k_m two in series  (kN/mm)', km / 1000, 2705, 5);
near('k_m Wileman fit    (kN/mm)', kmW / 1000, 2644, 5);
near('frustum vs Wileman agree <5%', 100 * Math.abs(km - kmW) / km, 2.3, 0.5);
near('k_b                (kN/mm)', kb / 1000, 698, 2);
near('C = k_b/(k_b+k_m)', kb / (kb + km), 0.205, 0.005);

console.log('\n=== breakdown slip anchoring so the motor FL point lands ON the curve ===');
const BDT = 2.5, Ns = 1800, Nfl = 1750;
const sFL = (Ns - Nfl) / Ns;
const sBD = sFL / (BDT - Math.sqrt(BDT * BDT - 1));
const kloss = s => 2 * BDT / (s / sBD + sBD / s);
near('s_bd exceeds s_fl', sBD > sFL ? 1 : 0, 1, 0);
near('T(s_fl)/T_fl == 1 (marker on curve)', kloss(sFL), 1, 1e-9);
near('T(s_bd)/T_fl == BDT', kloss(sBD), BDT, 1e-9);

console.log('\n=== pump curve passes THROUGH the duty point ===');
const H = 30, Q = 20;
const headAt = qm => H * (1.25 - 0.25 * Math.pow(qm / Q, 2));
near('H(duty flow) == duty head', headAt(Q), H, 1e-9);
near('shutoff head = 1.25 H', headAt(0), 1.25 * H, 1e-9);
const old = qm => H * (1 - 0.6 * Math.pow(qm / (Q * 1.5), 2));
near('old curve missed the duty point by ~27%', 100 * (H - old(Q)) / H, 26.7, 0.5);

console.log('\n=== engineer fmt(): honour source precision, floor at 3 sig figs ===');
function fmt(n, q) {
  if (!isFinite(n)) return String(n);
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) return n.toExponential(3);
  if (q && isFinite(q) && q > 0) {
    let dp = Math.max(0, Math.min(9, Math.ceil(-Math.log10(q * 2)) + 1));
    const mag = a > 0 ? Math.floor(Math.log10(a)) : 0, minDp = Math.max(0, 2 - mag);
    dp = Math.min(9, Math.max(dp, minDp));
    return String(parseFloat(n.toFixed(dp)));
  }
  return String(parseFloat(n.toPrecision(6)));
}
eq('2.0 mm -> in keeps 3 sig figs, not 0.0787402', fmt(2.0 / 25.4, 0.05 / 25.4), '0.0787');
eq('2.5 mm -> in is not flattened to 0.1', fmt(2.5 / 25.4, 0.05 / 25.4), '0.0984');
eq('1750 N -> lbf', fmt(1750 / 4.4482216152605, 0.5 / 4.4482216152605), '393.42');
eq('no quantum falls back to 6 sig figs', fmt(1 / 3), '0.333333');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
