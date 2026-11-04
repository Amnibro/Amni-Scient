/* Amni-Test app shell: sign-in, account banner, tabs (#tester, #dev, #admin). */
(function () {
  'use strict';
  var AT = window.AT, h = AT.h;
  AT.tabs = AT.tabs || {};

  var els = {};
  var state = { cfg: null, me: null, flash: null, renderId: 0 };

  // Query flags from Stripe redirects, read once and removed from the address bar.
  var params = new URLSearchParams(location.search);
  var flags = { paid: params.get('paid'), cancelled: params.get('cancelled'), onboard: params.get('onboard') };
  if (flags.paid || flags.cancelled || flags.onboard) {
    ['paid', 'cancelled', 'onboard'].forEach(function (k) { params.delete(k); });
    var qs = params.toString();
    var hash = flags.paid ? '#dev/' + encodeURIComponent(flags.paid) : flags.cancelled ? '#dev/' + encodeURIComponent(flags.cancelled) : location.hash;
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + hash);
  }
  AT.flags = flags;

  function route() {
    var raw = (location.hash || '').replace(/^#/, '');
    var parts = raw.split('/');
    var tab = parts[0];
    if (tab !== 'dev' && tab !== 'admin' && tab !== 'tester') tab = 'tester';
    if (tab === 'admin' && !(state.me && state.me.user.isAdmin)) tab = 'tester';
    return { tab: tab, id: parts[1] ? parseInt(parts[1], 10) || null : null };
  }

  // Keep what the user typed (and which <details> were open) across re-renders.
  function snapshot(root) {
    var keep = {};
    root.querySelectorAll('[data-keep]').forEach(function (el) {
      var k = el.getAttribute('data-keep');
      if (el.tagName === 'DETAILS') keep[k] = { open: el.open };
      else if (el.type === 'checkbox' || el.type === 'radio') keep[k] = { checked: el.checked };
      else keep[k] = { value: el.value };
    });
    return keep;
  }
  function restore(root, keep) {
    root.querySelectorAll('[data-keep]').forEach(function (el) {
      var v = keep[el.getAttribute('data-keep')];
      if (!v) return;
      if ('open' in v) el.open = v.open;
      else if ('checked' in v) el.checked = v.checked;
      else if (v.value !== el.value) { el.value = v.value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  }

  function showSignedOut(msg) {
    state.me = null;
    els.signedIn.hidden = true;
    els.signedOut.hidden = false;
    els.who.hidden = true;
    els.title.textContent = 'Sign in';
    if (msg) els.signMsg.textContent = msg; else els.signMsg.textContent = '';
    AT.renderSignIn(els.signInBox, function () { els.signMsg.textContent = ''; boot(); });
  }
  AT.onSignedOut = function (msg) { showSignedOut(msg); };

  async function loadMe() {
    state.me = await AT.api('/api/me');
    return state.me;
  }

  function renderWho() {
    var u = state.me.user;
    AT.clear(els.who);
    els.who.hidden = false;
    var out = h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Sign out' });
    out.addEventListener('click', async function () { out.disabled = true; await AT.signOut(); showSignedOut(); });
    AT.add(els.who, h('span', null, 'Signed in as ', h('b', { text: u.email })), u.status !== 'active' ? AT.pill(u.status) : null, out);
  }

  function renderBanner() {
    var u = state.me.user;
    AT.clear(els.banner);
    if (u.status === 'active') { els.banner.hidden = true; return; }
    els.banner.hidden = false;
    var p = h('div', { class: 'at-panel ' + (u.status === 'review' ? 'at-panel--accent' : 'at-panel--bad'), id: 'at-account-status' });
    if (u.status === 'review') {
      p.append(h('h2', { text: 'Your account is under review' }),
        h('p', { text: 'Someone filed a report about your account. While an admin looks at it, you can’t take new tests, post apps or cash out. Tests that are already running continue as normal.' }),
        u.statusReason ? h('p', { class: 'at-hint', text: u.statusReason }) : null);
    } else {
      var word = u.status === 'banned' ? 'banned' : 'closed';
      p.append(h('h2', { text: 'Your account is ' + word }),
        h('p', { text: u.statusReason ? u.statusReason + '.' : 'Your account is not active.' }));
      if (u.appealDecision === 'deny') {
        p.append(h('p', { text: 'Your appeal was reviewed and the decision stands. This is final.' }));
      } else if (u.appealUsed) {
        p.append(h('p', { text: 'Your appeal was sent. An admin will review it and the result will show here.' }));
      } else {
        var ta = h('textarea', { name: 'appeal', required: true, 'data-keep': 'appeal', placeholder: 'What happened, and why should the decision change?', maxlength: 4000 });
        var box = AT.errBox();
        var btn = h('button', { type: 'submit', class: 'btn btn-primary at-sm', text: 'Send appeal' });
        p.append(h('p', { text: 'You can appeal once. An admin reads it and decides, and that decision is final.' }),
          h('form', {
            class: 'at-form', style: 'margin-top:.8rem', id: 'at-appeal-form',
            onsubmit: function (ev) {
              ev.preventDefault();
              AT.run(btn, box, async function () { await AT.api('/api/me/appeal', { text: ta.value }); await refresh(); });
            },
          }, h('label', { class: 'at-field' }, h('span', { text: 'Your appeal' }), ta), h('div', { class: 'at-actions' }, btn), box));
      }
    }
    els.banner.appendChild(p);
  }

  function renderTabs(r) {
    AT.clear(els.tabs);
    var list = [['tester', 'Tester'], ['dev', 'Developer']];
    if (state.me.user.isAdmin) list.push(['admin', 'Admin']);
    list.forEach(function (t) {
      els.tabs.appendChild(h('a', { href: '#' + t[0], 'aria-current': r.tab === t[0] ? 'page' : null, id: 'tab-' + t[0], text: t[1] }));
    });
    els.title.textContent = r.tab === 'dev' ? 'Your apps' : r.tab === 'admin' ? 'Admin queue' : 'Your tests';
  }

  // Re-render the current tab. Each tab module fetches what it needs.
  async function render() {
    var r = route();
    var id = ++state.renderId;
    renderWho();
    renderBanner();
    renderTabs(r);
    var keep = snapshot(els.view);
    var view = h('div', { 'data-tab': r.tab });
    var ctx = { cfg: state.cfg, me: state.me, id: r.id, refresh: refresh, flags: AT.flags, go: function (hash) { location.hash = hash; } };
    try {
      await AT.tabs[r.tab].render(view, ctx);
    } catch (e) {
      if (e && e.status === 401) return;
      view = h('div', { class: 'at-panel at-panel--bad' }, h('p', { class: 'at-err', role: 'alert', text: e.message || String(e) }),
        h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Try again', onclick: function () { refresh(); } }));
    }
    if (id !== state.renderId) return; // a newer render started
    AT.clear(els.view).appendChild(view);
    restore(els.view, keep);
    els.view.setAttribute('aria-busy', 'false');
  }

  async function refresh() {
    try { await loadMe(); } catch (e) { if (e.status === 401) return; throw e; }
    await render();
  }
  AT.refresh = refresh;

  async function boot() {
    els.signedOut.hidden = true;
    els.signedIn.hidden = false;
    els.view.setAttribute('aria-busy', 'true');
    try {
      state.cfg = await AT.config();
      await loadMe();
    } catch (e) {
      if (e.status === 401) return; // onSignedOut already showed the sign-in box
      AT.clear(els.view).appendChild(h('div', { class: 'at-panel at-panel--bad' }, h('p', { class: 'at-err', role: 'alert', text: e.message }),
        h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Try again', onclick: boot })));
      return;
    }
    await render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    els = {
      title: document.getElementById('at-title'), who: document.getElementById('at-who'),
      signedOut: document.getElementById('at-signed-out'), signInBox: document.getElementById('at-signin-box'), signMsg: document.getElementById('at-signin-msg'),
      signedIn: document.getElementById('at-signed-in'), banner: document.getElementById('at-banner'), tabs: document.getElementById('at-tabs'), view: document.getElementById('at-view'),
    };
    window.addEventListener('hashchange', function () { if (state.me) render(); });
    document.addEventListener('visibilitychange', function () {
      // Coming back to the tab (e.g. from Play Console): pick up changes unless the user is typing.
      if (document.visibilityState === 'visible' && state.me && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) refresh();
    });
    if (AT.token()) boot(); else showSignedOut();
  });
})();
