/* Amni-Test landing page: live prices from /api/config, and a dashboard link when signed in. */
(function () {
  'use strict';
  var AT = window.AT, h = AT.h, money = AT.money;

  function fill(cfg) {
    document.querySelectorAll('[data-at="fee-pct"]').forEach(function (el) { el.textContent = cfg.feePct + '%'; });
    document.querySelectorAll('[data-at="fee-min"]').forEach(function (el) { el.textContent = money(cfg.feeMinCents); });
    document.querySelectorAll('[data-at="payout-min"]').forEach(function (el) { el.textContent = money(cfg.payoutMinCents); });
    var lv = document.getElementById('at-levels');
    if (lv) AT.clear(lv).append.apply(lv, cfg.levels.map(function (l, i) {
      return h('tr', null, h('td', { text: 'Level ' + l.level }), h('td', { text: AT.levelRange(cfg, i) }), h('td', { class: 'num', text: money(l.priceCents) }));
    }));
    var pr = document.getElementById('at-prices');
    if (pr) AT.clear(pr).append.apply(pr, cfg.levels.map(function (l) {
      var c = AT.cost(cfg, 12, l.level, 0);
      return h('tr', null, h('td', { text: 'Level ' + l.level }), h('td', { class: 'num', text: money(c.price) }), h('td', { class: 'num', text: money(c.feeEach) }),
        h('td', { class: 'num', text: money(c.price + c.feeEach) }), h('td', { class: 'num', text: money(c.total) }));
    }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (AT.token()) ['at-signin-cta', 'at-signin-cta2'].forEach(function (id) { var a = document.getElementById(id); if (a) a.textContent = 'Open your dashboard'; });
    AT.config().then(fill).catch(function () { /* the static table already shows the default prices */ });
  });
})();
