/* Amni-Test shared helpers: API client, sign-in, formatting and a tiny DOM builder.
   Used by /test/index.html and /test/app.html. No dependencies. */
(function () {
  'use strict';
  var AT = (window.AT = window.AT || {});
  var DAY = 86400000;
  AT.DAY = DAY;

  // ---------- storage (can throw in private mode) ----------
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  // ---------- API base ----------
  // ?api=<url> overrides the server and is remembered. A token only goes to the server it came from.
  AT.apiBase = (function () {
    var q = new URLSearchParams(location.search).get('api');
    if (q !== null) {
      if (q === '' || q === 'default') set('amni-test-api', null);
      else if (/^https?:\/\/[^\s]+$/i.test(q)) set('amni-test-api', q.replace(/\/+$/, ''));
    }
    var saved = get('amni-test-api');
    if (saved) return saved;
    return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://127.0.0.1:8787' : 'https://amni-test.amnibro7.workers.dev';
  })();

  AT.token = function () {
    var t = get('amni-test-token');
    if (t && get('amni-test-token-api') !== AT.apiBase) { set('amni-test-token', null); return null; }
    return t;
  };
  AT.setToken = function (t) { set('amni-test-token', t); set('amni-test-token-api', t ? AT.apiBase : null); };

  function ApiError(status, message) { this.status = status; this.message = message; }
  ApiError.prototype = Object.create(Error.prototype);
  AT.ApiError = ApiError;

  AT.api = async function (path, body) {
    var opts = { method: body === undefined ? 'GET' : 'POST', headers: {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body || {}); }
    var t = AT.token();
    if (t) opts.headers.Authorization = 'Bearer ' + t;
    var r;
    try { r = await fetch(AT.apiBase + path, opts); } catch (e) {
      throw new ApiError(0, "Can't reach the Amni-Test server. Check your connection and try again.");
    }
    var j = {};
    try { j = await r.json(); } catch (e) { /* not JSON */ }
    if (r.status === 401 && t) {
      AT.setToken(null);
      if (AT.onSignedOut) AT.onSignedOut(j.error || 'Sign in again.');
    }
    if (!r.ok) throw new ApiError(r.status, j.error || 'Something went wrong (' + r.status + ')');
    return j;
  };

  var cfgPromise = null;
  AT.config = function () {
    if (!cfgPromise) cfgPromise = AT.api('/api/config').catch(function (e) { cfgPromise = null; throw e; });
    return cfgPromise;
  };

  // Defaults from the spec, used on the landing page if the API can't be reached.
  AT.DEFAULT_CONFIG = {
    googleClientId: '', devAuth: false, feePct: 30, feeMinCents: 50, payoutMinCents: 1000, maxActive: 3,
    levels: [{ level: 1, min: null, priceCents: 100 }, { level: 2, min: 10, priceCents: 200 }, { level: 3, min: 25, priceCents: 300 }, { level: 4, min: 50, priceCents: 400 }, { level: 5, min: 100, priceCents: 500 }],
    checkins: [{ day: 1, from: 0, to: 2 }, { day: 7, from: 6, to: 8 }, { day: 14, from: 13, to: 16 }],
  };

  // ---------- money and pricing ----------
  AT.money = function (c) {
    c = Math.round(+c || 0);
    return (c < 0 ? '−' : '') + '$' + (Math.abs(c) / 100).toFixed(2);
  };
  AT.feePerSlot = function (cfg, priceCents) { return Math.max(cfg.feeMinCents, Math.round(priceCents * cfg.feePct / 100)); };
  AT.priceFor = function (cfg, level) { var l = cfg.levels[Math.min(Math.max(level, 1), cfg.levels.length) - 1]; return l ? l.priceCents : 0; };
  AT.cost = function (cfg, slots, maxLevel, creditCents) {
    var p = AT.priceFor(cfg, maxLevel), f = AT.feePerSlot(cfg, p);
    var budget = slots * p, fee = slots * f, total = budget + fee, credit = Math.min(creditCents || 0, total);
    return { price: p, feeEach: f, budget: budget, fee: fee, total: total, credit: credit, due: total - credit };
  };
  AT.levelRange = function (cfg, i) {
    var l = cfg.levels[i], next = cfg.levels[i + 1];
    if (l.min == null) return next ? 'below ' + next.min : 'any';
    return next ? l.min + '–' + (next.min - 1) : l.min + ' and up';
  };

  // ---------- time ----------
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  // "2 days left", "5 hours left", "time's up"
  AT.left = function (ms) {
    var d = ms - Date.now();
    if (d <= 0) return "time's up";
    if (d < 3600000) return 'less than an hour left';
    if (d < 2 * DAY) return plural(Math.floor(d / 3600000), 'hour') + ' left';
    return plural(Math.floor(d / DAY), 'day') + ' left';
  };
  // "in 3 days", "in 5 hours", "now"
  AT.until = function (ms) {
    var d = ms - Date.now();
    if (d <= 0) return 'now';
    if (d < 3600000) return 'in under an hour';
    if (d < 2 * DAY) return 'in ' + plural(Math.ceil(d / 3600000), 'hour');
    return 'in ' + plural(Math.round(d / DAY), 'day');
  };
  AT.ago = function (ms) {
    var d = Date.now() - ms;
    if (d < 60000) return 'just now';
    if (d < 3600000) return plural(Math.floor(d / 60000), 'minute') + ' ago';
    if (d < DAY) return plural(Math.floor(d / 3600000), 'hour') + ' ago';
    if (d < 14 * DAY) return plural(Math.floor(d / DAY), 'day') + ' ago';
    return AT.date(ms);
  };
  AT.date = function (ms) {
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  };
  AT.dateTime = function (ms) {
    return new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // ---------- DOM ----------
  var PROPS = { value: 1, checked: 1, disabled: 1, hidden: 1, selected: 1, open: 1, readOnly: 1 };
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (PROPS[k]) el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    // Element.append would print "null" for skipped parts; this one ignores null/false.
    el.append = function () { for (var j = 0; j < arguments.length; j++) add(el, arguments[j]); };
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { add(el, k); }); return; }
    el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  AT.h = h;
  AT.add = function (el) { for (var j = 1; j < arguments.length; j++) add(el, arguments[j]); return el; };
  AT.clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  // An error box that sits under a form or a row of buttons.
  AT.errBox = function () { return h('p', { class: 'at-err', role: 'alert' }); };
  // Run an action from a button: disables it, shows errors inline in `box`.
  AT.run = async function (btn, box, fn) {
    if (box) box.textContent = '';
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    try { return await fn(); } catch (e) {
      if (box) box.textContent = e && e.message ? e.message : String(e);
      else throw e;
    } finally {
      if (btn && btn.isConnected) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
    }
  };
  // Two-step button: the first press arms it (label changes), the second runs `fn`.
  AT.confirmBtn = function (label, armedLabel, box, fn, cls) {
    var b = h('button', { type: 'button', class: 'btn at-sm ' + (cls || 'at-danger'), text: label });
    var timer = null;
    b.addEventListener('click', function () {
      if (!b.classList.contains('at-armed')) {
        b.classList.add('at-armed');
        b.textContent = typeof armedLabel === 'function' ? armedLabel() : armedLabel;
        clearTimeout(timer);
        timer = setTimeout(function () { if (b.isConnected) { b.classList.remove('at-armed'); b.textContent = label; } }, 8000);
        return;
      }
      clearTimeout(timer);
      AT.run(b, box, fn).finally(function () { if (b.isConnected) { b.classList.remove('at-armed'); b.textContent = label; } });
    });
    b.reset = function () { b.classList.remove('at-armed'); b.textContent = label; };
    return b;
  };
  AT.copy = async function (text, btn) {
    var ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      var ta = h('textarea', { value: text, style: 'position:fixed;left:-9999px;top:0', 'aria-hidden': 'true' });
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    if (btn) {
      var old = btn.dataset.label || btn.textContent;
      btn.dataset.label = old;
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(function () { if (btn.isConnected) btn.textContent = old; }, 1600);
    }
    return ok;
  };
  AT.download = function (name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    var a = h('a', { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };

  // ---------- labels ----------
  AT.EXIT_LABELS = {
    crash: 'The app crashes or freezes', wont_install: "The app won't install or open", not_as_described: "The app isn't what the listing described",
    privacy: 'The app asks for data it should not', offensive: 'The app has offensive content',
    no_time: "I don't have time", lost_interest: 'I lost interest', other: 'Another reason',
  };
  AT.REPORT_LABELS = {
    harassment: 'Harassment', fraud: 'Fraud (fake devices or several accounts)', spam_feedback: 'Spam or copied feedback',
    malware: 'Malware or harmful app', inappropriate: 'Inappropriate content',
  };
  AT.STATUS = {
    accepted: ['Waiting to be added', 'wait'], invited: ['Ready to start', 'go'], active: ['Testing', 'go'],
    completed_pending: ['Finished, pending', 'wait'], exit_pending: ['Exit pending', 'wait'], completed: ['Completed', 'good'],
    excused: ['Excused', ''], exited: ['Ended', 'bad'], no_show: ['No-show', 'bad'], expired: ['Released', ''], removed: ['Removed', 'bad'],
    draft: ['Draft, unpaid', 'wait'], open: ['Open', 'go'], closed: ['Closed', ''], cancelled: ['Cancelled', ''],
    review: ['Under review', 'wait'], banned: ['Banned', 'bad'], terminated: ['Terminated', 'bad'],
  };
  AT.pill = function (status) {
    var s = AT.STATUS[status] || [status, ''];
    return h('span', { class: 'at-pill' + (s[1] ? ' at-pill--' + s[1] : ''), text: s[0] });
  };

  // ---------- sign-in ----------
  var gisLoading = null;
  function loadGis() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    if (!gisLoading) gisLoading = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
      s.onload = res; s.onerror = function () { gisLoading = null; rej(new Error("Google sign-in didn't load. Check that nothing is blocking accounts.google.com.")); };
      document.head.appendChild(s);
    });
    return gisLoading;
  }

  // Renders sign-in controls into `el`. Calls onDone(user) after a successful sign-in.
  AT.renderSignIn = async function (el, onDone) {
    AT.clear(el);
    var box = AT.errBox();
    var cfg;
    try { cfg = await AT.config(); } catch (e) {
      el.appendChild(h('p', { class: 'at-err', role: 'alert', text: e.message }));
      el.appendChild(h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Try again', onclick: function () { AT.renderSignIn(el, onDone); } }));
      return;
    }
    async function finish(path, body, btn) {
      await AT.run(btn, box, async function () {
        var r = await AT.api(path, body);
        AT.setToken(r.token);
        onDone(r.user);
      });
    }
    if (cfg.googleClientId) {
      var slot = h('div', { class: 'at-gbtn' });
      el.appendChild(slot);
      try {
        await loadGis();
        google.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback: function (resp) { finish('/api/auth/google', { credential: resp.credential }, null); },
          ux_mode: 'popup', auto_select: false, itp_support: true,
        });
        google.accounts.id.renderButton(slot, {
          type: 'standard', theme: document.documentElement.dataset.theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large', text: 'signin_with', shape: 'rectangular', logo_alignment: 'left', width: Math.min(320, Math.max(200, el.clientWidth || 300)),
        });
      } catch (e) { box.textContent = e.message; }
    }
    if (cfg.devAuth) {
      var input = h('input', { type: 'email', name: 'email', autocomplete: 'email', placeholder: 'you@example.com', required: true, id: 'at-dev-email' });
      var btn = h('button', { type: 'submit', class: 'btn btn-primary at-sm', text: 'Sign in (dev)' });
      el.appendChild(h('form', {
        class: 'at-form', style: 'margin-top:.8rem',
        onsubmit: function (ev) { ev.preventDefault(); finish('/api/auth/dev', { email: input.value.trim() }, btn); },
      },
      h('label', { class: 'at-field' }, h('span', { text: 'Email (local development only)' }), input),
      h('div', { class: 'at-actions' }, btn)));
    }
    if (!cfg.googleClientId && !cfg.devAuth) el.appendChild(h('p', { class: 'at-err', text: 'Sign-in is not set up on this server yet.' }));
    el.appendChild(box);
  };

  AT.signOut = async function () {
    try { await AT.api('/api/auth/logout', {}); } catch (e) { /* signing out anyway */ }
    AT.setToken(null);
    try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) { /* ignore */ }
  };
})();
