/* calc-qol.js — quality-of-life for Amni-Calc (single-page app calc/index.html).
   ADDITIVE + DOM-only (no hooks into the app's own script): remembers every input/select
   value AND the last-open module across reloads and tab navigation, so you never re-type a
   load, preload, grade, size, or unit when you come back to a section. A "Reset inputs"
   control in the sidebar clears everything back to the page defaults. */
(function () {
  var VKEY = 'calc-qol-vals-v1', TKEY = 'calc-qol-tab-v1', saveTimer = null;
  function readStore() { try { return JSON.parse(localStorage.getItem(VKEY) || '{}'); } catch (e) { return {}; } }
  var store = readStore();
  function flush() { try { localStorage.setItem(VKEY, JSON.stringify(store)); } catch (e) {} }
  function queueSave() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(flush, 250); }
  function isField(el) { return el && (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && /^(number|text)$/.test(el.type))); }
  function persist(el) {
    if (!el || !el.id || !isField(el)) return;
    if (el.classList && el.classList.contains('u-sel')) return; // calc-units auto dropdowns are id-less; guard anyway
    store[el.id] = el.value; queueSave();
  }
  document.addEventListener('input', function (e) { persist(e.target); }, true);
  document.addEventListener('change', function (e) { persist(e.target); }, true);
  function restore() {
    var n = 0;
    Object.keys(store).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || !isField(el)) return;
      var v = store[id];
      if (el.tagName === 'SELECT') {
        if ([].some.call(el.options, function (o) { return o.value === v || o.textContent === v; })) { el.value = v; n++; }
      } else { el.value = v; n++; }
    });
    window.__qolRestored = n;
  }
  // remember the active module tab, and re-open it on next load
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('#tabs .tab');
    if (t && t.dataset && t.dataset.v) { try { localStorage.setItem(TKEY, t.dataset.v); } catch (e2) {} }
  }, true);
  function restoreTab() {
    var v; try { v = localStorage.getItem(TKEY); } catch (e) { return; }
    if (!v) return;
    var tab = document.querySelector('#tabs .tab[data-v="' + v + '"]');
    var cur = document.querySelector('#tabs .tab.active');
    if (tab && (!cur || cur.dataset.v !== v)) tab.click();
  }
  function injectReset() {
    if (document.getElementById('qol-reset')) return;
    var host = document.querySelector('.sidebar'); if (!host) return;
    var b = document.createElement('button'); b.id = 'qol-reset'; b.type = 'button'; b.textContent = '↺ Reset inputs';
    b.title = 'Clear all saved inputs and restore the page defaults';
    b.style.cssText = 'display:block;width:calc(100% - 28px);margin:10px 14px 14px;padding:6px;background:none;border:1px solid var(--line,#272c35);color:var(--dim,#9aa0aa);border-radius:6px;font-family:inherit;font-size:.6rem;letter-spacing:1px;text-transform:uppercase;cursor:pointer';
    b.onmouseenter = function () { b.style.borderColor = 'var(--accent,#8fa8b8)'; b.style.color = 'var(--accent,#8fa8b8)'; };
    b.onmouseleave = function () { b.style.borderColor = 'var(--line,#272c35)'; b.style.color = 'var(--dim,#9aa0aa)'; };
    b.onclick = function () { if (!confirm('Clear all saved calculator inputs and reset to the page defaults?')) return; try { localStorage.removeItem(VKEY); localStorage.removeItem(TKEY); } catch (e) {} location.reload(); };
    host.appendChild(b);
  }
  function init() { restore(); restoreTab(); injectReset(); }
  if (document.readyState === 'complete') setTimeout(init, 80);
  else window.addEventListener('load', function () { setTimeout(init, 80); });
})();
