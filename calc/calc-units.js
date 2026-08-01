/* calc-units.js — universal unit selection for Amni-Calc (the single-page app calc/index.html).
   ADDITIVE + non-breaking: scans every numeric input; for any input that shows its unit via a
   trailing <span> or in its <label> "(unit)" and does NOT already have its own unit <select>, it
   attaches a unit dropdown and records the formula's base unit. The shared accessor v() then routes
   raw values through window.__uconv(), converting the user's chosen unit back to that base unit, so
   every existing formula is unchanged. Changing a dropdown converts the shown number to keep the
   physical quantity. A global SI / Imperial toggle flips every attached dropdown at once.
   The 13 fields that already had their own -u <select> are left exactly as they were. */
(function () {
  var DIMS = (typeof window !== 'undefined' && window.UCORE && window.UCORE.DIMS) || {
    length: { si: 'mm', imp: 'in', u: { 'mm': 1, 'cm': 10, 'm': 1000, 'µm': 0.001, 'um': 0.001, 'in': 25.4, 'ft': 304.8 } },
    area: { si: 'mm²', imp: 'in²', u: { 'mm²': 1, 'cm²': 100, 'm²': 1e6, 'in²': 645.16, 'ft²': 92903.04 } },
    pressure: { si: 'MPa', imp: 'psi', u: { 'Pa': 1e-6, 'kPa': 1e-3, 'MPa': 1, 'GPa': 1e3, 'bar': 0.1, 'psi': 0.00689476, 'ksi': 6.89476 } },
    force: { si: 'N', imp: 'lbf', u: { 'N': 1, 'kN': 1e3, 'lbf': 4.44822, 'kip': 4448.22 } },
    torque: { si: 'N·m', imp: 'lbf·ft', u: { 'N·m': 1, 'N·mm': 1e-3, 'kN·m': 1e3, 'lbf·ft': 1.35582, 'lbf·in': 0.112985 } },
    flow: { si: 'm³/s', imp: 'gpm', u: { 'm³/s': 1, 'm³/h': 1 / 3600, 'L/s': 1e-3, 'L/min': 1 / 60000, 'gpm': 6.30902e-5, 'cfm': 4.71947e-4 } },
    power: { si: 'W', imp: 'hp', u: { 'W': 1, 'kW': 1e3, 'MW': 1e6, 'hp': 745.7, 'BTU/h': 0.293071 } },
    velocity: { si: 'm/s', imp: 'ft/s', u: { 'm/s': 1, 'km/h': 1 / 3.6, 'ft/s': 0.3048, 'mph': 0.44704 } },
    mass: { si: 'kg', imp: 'lb', u: { 'kg': 1, 'g': 1e-3, 't': 1e3, 'lb': 0.453592, 'oz': 0.0283495 } },
    temp: { si: '°C', imp: '°F', u: { '°C': 1, '°F': 1, 'K': 1 } }
  };
  var TOK = {};
  for (var d in DIMS) for (var name in DIMS[d].u) TOK[name.toLowerCase()] = [d, name];
  var ALIAS = { 'c': ['temp', '°C'], '°c': ['temp', '°C'], 'degc': ['temp', '°C'], 'f': ['temp', '°F'], '°f': ['temp', '°F'], 'k': ['temp', 'K'], 'n.m': ['torque', 'N·m'], 'nm': ['torque', 'N·m'], 'mm2': ['area', 'mm²'], 'mm^2': ['area', 'mm²'], 'm2': ['area', 'm²'], 'in2': ['area', 'in²'] };
  function lookup(t) { if (!t) return null; t = String(t).trim(); var k = t.toLowerCase(); return TOK[k] || ALIAS[k] || null; }
  function toUnit(val, from, to, dim) {
    if (!isFinite(val)) return val;
    if (dim === 'temp') { var c = from === '°C' ? val : from === '°F' ? (val - 32) * 5 / 9 : val - 273.15; return to === '°C' ? c : to === '°F' ? c * 9 / 5 + 32 : c + 273.15; }
    var u = DIMS[dim].u; return val * u[from] / u[to];
  }
  // hook the accessor calls: convert the entered value (in the selected unit) -> the formula's base unit
  window.__uconv = function (el, raw) {
    el = (typeof el === 'string') ? document.getElementById(el) : el;
    if (!el || !el.dataset || !el.dataset.udim || !el._uSel) return raw;
    /* if the field still shows exactly what we wrote, return the exact base value
       instead of re-converting the rounded display (kills float drift) */
    if (el.dataset.uexact !== undefined && el.dataset.ushown === String(el.value)) {
      var ex = parseFloat(el.dataset.uexact);
      if (isFinite(ex)) return ex;
    }
    return toUnit(raw, el._uSel.value, el.dataset.ubase, el.dataset.udim);
  };
  var fmtNum = function (n) { if (!isFinite(n)) return n; var a = Math.abs(n); return (a !== 0 && (a >= 1e5 || a < 1e-3)) ? n.toExponential(4) : parseFloat(n.toPrecision(6)); };
  function makeSelect(dim, base) {
    var s = document.createElement('select'); s.className = 'u-sel'; s.setAttribute('aria-label', 'unit');
    s.style.cssText = 'background:var(--bg,#14161a);color:var(--ink,#e8e6e0);border:1px solid var(--line,#272c35);border-radius:6px;padding:4px 6px;font-size:.72rem;margin-left:5px;cursor:pointer;flex:none';
    for (var nm in DIMS[dim].u) { var o = document.createElement('option'); o.value = o.textContent = nm; if (nm === base) o.selected = true; s.appendChild(o); }
    return s;
  }
  function attach() {
    var n = 0;
    document.querySelectorAll('input[type="number"]').forEach(function (inp) {
      if (inp.dataset.udim || inp._uSel) return;
      var row = inp.parentElement; if (!row) return;
      if (row.querySelector('select')) return; // already has its own unit selector — leave it
      var dim = null, base = null;
      var span = row.querySelector('span');
      if (span) { var m = lookup(span.textContent); if (m) { dim = m[0]; base = m[1]; span.remove(); } }
      if (!dim) { var lab = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(inp.id) : inp.id) + '"]'); if (lab) { var mm = lab.textContent.match(/\(([^)]+)\)\s*$/); if (mm) { var m2 = lookup(mm[1]); if (m2) { dim = m2[0]; base = m2[1]; lab.textContent = lab.textContent.replace(/\s*\([^)]+\)\s*$/, ''); } } } }
      if (!dim) return;
      inp.dataset.udim = dim; inp.dataset.ubase = base;
      var sel = makeSelect(dim, base); inp._uSel = sel; sel._prev = base;
      sel.addEventListener('change', function () {
        var cur = parseFloat(inp.value);
        if (isFinite(cur)) {
          /* v5.87.0 lossless round-trip. Convert FROM the remembered exact base value
             whenever the field still shows what we last wrote, so repeated unit flips
             cannot accumulate float noise (50 mm -> 1.9685 in -> 49.9999 mm). */
          var exact;
          if (inp.dataset.uexact !== undefined && inp.dataset.ushown === String(inp.value)) {
            exact = parseFloat(inp.dataset.uexact);
            if (!isFinite(exact)) exact = toUnit(cur, sel._prev, inp.dataset.ubase, dim);
          } else {
            exact = toUnit(cur, sel._prev, inp.dataset.ubase, dim);
          }
          inp.value = fmtNum(toUnit(exact, inp.dataset.ubase, sel.value, dim));
          inp.dataset.uexact = String(exact);
          inp.dataset.ushown = String(inp.value);
        }
        sel._prev = sel.value;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      });
      /* a manual edit invalidates the remembered exact value */
      inp.addEventListener('input', function () {
        if (inp.dataset.ushown !== undefined && String(inp.value) !== inp.dataset.ushown) {
          delete inp.dataset.uexact; delete inp.dataset.ushown;
        }
      });
      row.appendChild(sel); n++;
    });
    return n;
  }
  function flipNativeUnitSelects(sys) {
    var tok = {};
    for (var d in DIMS) for (var nm in DIMS[d].u) tok[nm] = d;
    document.querySelectorAll('select[id$="-u"]').forEach(function (sel) {
      var cur = sel.value, dim = tok[cur];
      if (!dim || !DIMS[dim]) return;
      var want = DIMS[dim][sys];
      if (!want || want === cur) return;
      var has = false;
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === want) { has = true; break; }
      if (!has) return;
      var row = sel.closest('.field-row') || sel.parentElement;
      var inp = row && row.querySelector('input[type="number"]');
      if (inp) {
        var curN = parseFloat(inp.value);
        if (isFinite(curN)) inp.value = fmtNum(toUnit(curN, cur, want, dim));
      }
      sel.value = want;
      try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
      if (inp) {
        try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (e2) {}
      }
    });
  }
  // global SI / Imperial toggle: set every attached dropdown to that system's unit + convert numbers
  window.__usys = function (sys) {
    document.querySelectorAll('input[type="number"]').forEach(function (inp) {
      if (!inp.dataset.udim || !inp._uSel) return;
      var dim = inp.dataset.udim, want = DIMS[dim][sys]; var sel = inp._uSel;
      if (!want || sel.value === want) return;
      var cur = parseFloat(inp.value);
      if (isFinite(cur)) inp.value = fmtNum(toUnit(cur, sel.value, want, dim));
      sel._prev = want; sel.value = want;
    });
    flipNativeUnitSelects(sys);
    try { localStorage.setItem('calc-units-sys', sys); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('amni-units-sys', { detail: { sys: sys } })); } catch (e3) {}
  };
  window.__uMode = function () { try { return localStorage.getItem('calc-units-sys') === 'imp' ? 'imp' : 'si'; } catch (e) { return 'si'; } };
  function injectToggle() {
    if (document.getElementById('units-toggle')) return;
    var host = document.querySelector('.sidebar');
    var box = document.createElement('div'); box.id = 'units-toggle';
    box.style.cssText = 'display:flex;align-items:center;gap:6px;padding:9px 14px;font-size:.6rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim,#9aa0aa);border-bottom:1px solid var(--border2,var(--line,#272c35))';
    var lab = document.createElement('span'); lab.textContent = 'Units'; box.appendChild(lab);
    var btns = {};
    function setActive(sys) { Object.keys(btns).forEach(function (k) { var on = k === sys; btns[k].style.background = on ? 'var(--accent,#8fa8b8)' : 'none'; btns[k].style.color = on ? '#0a0a0a' : 'var(--dim,#9aa0aa)'; btns[k].style.fontWeight = on ? '700' : '400'; }); }
    [['si', 'SI'], ['imp', 'US']].forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = p[1];
      b.style.cssText = 'background:none;border:1px solid var(--border2,#272c35);color:var(--dim,#9aa0aa);border-radius:5px;padding:3px 9px;font-family:inherit;font-size:.6rem;letter-spacing:1px;cursor:pointer';
      b.onclick = function () { window.__usys(p[0]); setActive(p[0]); };
      btns[p[0]] = b; box.appendChild(b);
    });
    if (host) { host.insertBefore(box, host.firstChild); }
    else { box.style.cssText += ';position:fixed;top:52px;right:10px;z-index:60;background:var(--panel,#1d2026);border:1px solid var(--line,#272c35);border-radius:8px'; document.body.appendChild(box); }
    var cur = 'si'; try { if (localStorage.getItem('calc-units-sys') === 'imp') cur = 'imp'; } catch (e) {}
    setActive(cur);
  }
  function init() {
    var count = attach();
    try { var saved = localStorage.getItem('calc-units-sys'); if (saved === 'imp') window.__usys('imp'); } catch (e) {}
    injectToggle();
    window.__unitsAttached = count;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
