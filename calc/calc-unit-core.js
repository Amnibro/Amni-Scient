/* calc-unit-core.js — Amni-Calc SINGLE SOURCE OF TRUTH for unit conversion (v5.20.0).
   Exact engineering factors. Every other layer (calc-units.js auto-dropdowns, calc-fixes.js
   getLen/getForce/getE/getI + calcSpring multipliers, calcStress) derives from window.UCORE so
   input-unit -> canonical base -> output is consistent everywhere and labels match values.
   Loaded FIRST (before calc-overrides/3d/fixes/units). Also requireable in Node for tests. */
(function () {
  var L = { mm: 1, cm: 10, m: 1000, 'µm': 1e-3, um: 1e-3, 'in': 25.4, ft: 304.8 };
  var A = { 'mm²': 1, 'cm²': 100, 'm²': 1e6, 'in²': 645.16, 'ft²': 92903.04 };
  var P = { Pa: 1e-6, kPa: 1e-3, MPa: 1, GPa: 1e3, bar: 0.1, psi: 0.00689475729316836, ksi: 6.89475729316836 };
  var FRC = { N: 1, kN: 1e3, lbf: 4.4482216152605, kip: 4448.2216152605 };
  var FRCX = { N: 1, kN: 1e3, lbf: 4.4482216152605, kip: 4448.2216152605, kgf: 9.80665 };
  var TQ = { 'N·m': 1, 'N·mm': 1e-3, 'kN·m': 1e3, 'lbf·ft': 1.3558179483314004, 'lbf·in': 0.11298482902761671 };
  var Q = { 'm³/s': 1, 'm³/h': 1 / 3600, 'L/s': 1e-3, 'L/min': 1 / 60000, gpm: 6.30901964e-5, cfm: 4.719474432e-4 };
  var PW = { W: 1, kW: 1e3, MW: 1e6, hp: 745.6998715822702, 'BTU/h': 0.2930710701722222 };
  var VEL = { 'm/s': 1, 'km/h': 1 / 3.6, 'ft/s': 0.3048, mph: 0.44704 };
  var MS = { kg: 1, g: 1e-3, t: 1e3, lb: 0.45359237, oz: 0.028349523125 };
  var TMP = { '°C': 1, '°F': 1, K: 1 };
  var INR = { mm4: 1, cm4: 1e4, in4: 416231.4256 };
  var RATE = { 'N/mm': 1, 'N/m': 0.001, 'kN/m': 1, 'lbf/in': 0.175126835, 'lbf/ft': 0.0145939029 };
  var DIMS = {
    length: { si: 'mm', imp: 'in', u: L }, area: { si: 'mm²', imp: 'in²', u: A },
    pressure: { si: 'MPa', imp: 'psi', u: P }, force: { si: 'N', imp: 'lbf', u: FRC },
    torque: { si: 'N·m', imp: 'lbf·ft', u: TQ }, flow: { si: 'm³/s', imp: 'gpm', u: Q },
    power: { si: 'W', imp: 'hp', u: PW }, velocity: { si: 'm/s', imp: 'ft/s', u: VEL },
    mass: { si: 'kg', imp: 'lb', u: MS }, temp: { si: '°C', imp: '°F', u: TMP },
    rate: { si: 'N/mm', imp: 'lbf/in', u: RATE }
  };
  function tconv(val, from, to) { var c = from === '°C' ? val : from === '°F' ? (val - 32) * 5 / 9 : val - 273.15; return to === '°C' ? c : to === '°F' ? c * 9 / 5 + 32 : c + 273.15; }
  function factor(dim, unit) { var d = DIMS[dim]; if (d && d.u[unit] != null) return d.u[unit]; if (dim === 'inertia' && INR[unit] != null) return INR[unit]; return 1; }
  function conv(dim, from, to, val) { return dim === 'temp' ? tconv(val, from, to) : val * factor(dim, from) / factor(dim, to); }
  function toBase(dim, unit, val) { return dim === 'temp' ? tconv(val, unit, '°C') : val * factor(dim, unit); }
  function fromBase(dim, unit, val) { return dim === 'temp' ? tconv(val, '°C', unit) : val / factor(dim, unit); }
  function principal3(sx, sy, sz, txy, tyz, txz) {
    var p1 = txy * txy + tyz * tyz + txz * txz;
    if (p1 === 0) { var e = [sx, sy, sz]; e.sort(function (a, b) { return b - a; }); return e; }
    var q = (sx + sy + sz) / 3, p2 = (sx - q) * (sx - q) + (sy - q) * (sy - q) + (sz - q) * (sz - q) + 2 * p1, p = Math.sqrt(p2 / 6);
    var b11 = (sx - q) / p, b22 = (sy - q) / p, b33 = (sz - q) / p, b12 = txy / p, b13 = txz / p, b23 = tyz / p;
    var detB = b11 * (b22 * b33 - b23 * b23) - b12 * (b12 * b33 - b23 * b13) + b13 * (b12 * b23 - b22 * b13);
    var r = detB / 2; r = r < -1 ? -1 : r > 1 ? 1 : r;
    var phi = Math.acos(r) / 3, e1 = q + 2 * p * Math.cos(phi), e3 = q + 2 * p * Math.cos(phi + 2 * Math.PI / 3);
    return [e1, 3 * q - e1 - e3, e3];
  }
  function mode() { try { return (typeof localStorage !== 'undefined' && localStorage.getItem('calc-units-sys') === 'imp') ? 'imp' : 'si'; } catch (e) { return 'si'; } }
  function isImp() { return mode() === 'imp'; }
  function fmtNum(n, d) { if (!isFinite(n)) return '—'; var a = Math.abs(n); if (a !== 0 && (a >= 1e5 || a < 1e-3)) return n.toExponential(3); return String(parseFloat(n.toFixed(d != null ? d : 4))); }
  function fDisp(N, d) { return isImp() ? fmtNum(N / FRC.lbf, d != null ? d : 2) + ' lbf' : fmtNum(N, d != null ? d : 1) + ' N'; }
  function lDisp(mm, d) { return isImp() ? fmtNum(mm / L['in'], d != null ? d : 3) + ' in' : fmtNum(mm, d != null ? d : 2) + ' mm'; }
  function pDisp(MPa, d) { return isImp() ? fmtNum(MPa / P.psi, d != null ? d : 0) + ' psi' : fmtNum(MPa, d != null ? d : 0) + ' MPa'; }
  function kDisp(Npm, d) { return isImp() ? fmtNum(fromBase('rate', 'lbf/in', Npm), d != null ? d : 2) + ' lbf/in' : fmtNum(Npm, d != null ? d : 2) + ' N/mm'; }
  function fScale() { return isImp() ? 1 / FRC.lbf : 1; }
  function lScale() { return isImp() ? 1 / L['in'] : 1; }
  function fUnit() { return isImp() ? 'lbf' : 'N'; }
  function lUnit() { return isImp() ? 'in' : 'mm'; }
  function kUnit() { return isImp() ? 'lbf/in' : 'N/mm'; }
  function pUnit() { return isImp() ? 'psi' : 'MPa'; }
  var UCORE = {
    DIMS: DIMS,
    tables: { LEN_TO_MM: L, AREA_TO_MM2: A, PRESS_TO_MPA: P, FORCE_TO_N: FRCX, TORQUE_TO_NM: TQ, FLOW_TO_M3S: Q, POWER_TO_W: PW, VEL_TO_MS: VEL, MASS_TO_KG: MS, INERTIA_TO_MM4: INR, RATE_TO_NPMM: RATE },
    factor: factor, conv: conv, toBase: toBase, fromBase: fromBase, tempConv: tconv, principal3: principal3,
    mode: mode, isImp: isImp, fDisp: fDisp, lDisp: lDisp, pDisp: pDisp, kDisp: kDisp, fScale: fScale, lScale: lScale, fUnit: fUnit, lUnit: lUnit, kUnit: kUnit, pUnit: pUnit, fmtNum: fmtNum,
    VERSION: '5.86.1'
  };
  var root = typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this;
  root.UCORE = UCORE;
  if (typeof window !== 'undefined') window.UCORE = UCORE;
  if (typeof module !== 'undefined' && module.exports) module.exports = UCORE;
})();
