// Test Town controller: sign-in (browser or Android bridge), data, HUD, panels, rewards, list view.
// API and sign-in come from /test/amni-test.js (window.AT).
import * as P from './panels.js';
import { RANKS } from './shared.js';

const AT = window.AT, h = AT.h, money = AT.money;
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

// ---------------------------------------------------------------- Android bridge
const native = window.AmniApp || null;
function call(name, ...args) { try { return native && typeof native[name] === 'function' ? native[name](...args.map(String)) : undefined; } catch (e) { console.warn('AmniApp.' + name, e); return undefined; } }
const bridge = native ? {
  openExternal: (u) => call('openExternal', u),
  haptic: (k) => call('haptic', k),
  share: typeof native.share === 'function' ? (t) => call('share', t) : null,
  signOut: () => call('signOut'),
  installed: (pkgs) => { const r = call('installed', JSON.stringify(pkgs)); try { return r ? JSON.parse(r) : null; } catch (e) { return null; } },
} : null;
if (native) {
  const base = String(call('getApiBase') || '').replace(/\/+$/, '');
  if (/^https?:\/\//.test(base)) AT.apiBase = base;
  AT.token = () => String(call('getToken') || '') || null;
  // the bridge owns the session; keep the 2D pages in this WebView signed in too
  AT.setToken = () => {};
  try {
    const t = AT.token();
    if (t) { localStorage.setItem('amni-test-api', AT.apiBase); localStorage.setItem('amni-test-token', t); localStorage.setItem('amni-test-token-api', AT.apiBase); }
  } catch (e) { /* storage blocked */ }
  document.documentElement.classList.add('tw-in-app');
}
function haptic(k) { if (bridge) bridge.haptic(k); else if (k !== 'light' && navigator.vibrate) { try { navigator.vibrate(k === 'success' ? [12, 40, 18] : 20); } catch (e) { /* ignore */ } } }

// ---------------------------------------------------------------- state
const S = { cfg: null, data: null, scene: null, gl: false, list: false, installed: null, boardMe: null, panel: null, lastSync: 0, syncing: null, installsSent: '', draftAvatar: null };
window.__town = S; // handy for debugging and tests

// ---------------------------------------------------------------- 3D (lazy, with fallback)
async function startScene() {
  if (params.get('nogl') === '1') return false;
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) return false;
    try { await Promise.race([document.fonts.load('800 40px Archivo'), new Promise((r) => setTimeout(r, 1200))]); } catch (e) { /* fonts optional */ }
    const { createScene } = await import('./scene.js');
    S.scene = createScene($('tw-canvas'), $('tw-labels'));
    S.scene.setTheme(document.documentElement.dataset.theme === 'dark');
    S.scene.onPick(onPick);
    return true;
  } catch (e) {
    console.warn('3D unavailable, using the list view', e);
    S.scene = null;
    return false;
  }
}
function onPick(p) {
  if (p.kind === 'ground' || p.kind === 'sky') { if (p.kind === 'sky' && S.panel) closePanel(); return; }
  haptic('light');
  const map = { stall: 'stall', tower: 'tower', workshop: 'workshop', house: 'workshop', leaderboard: 'leaderboard', quests: 'quests', beacon: 'beacon', trophies: 'trophies', market: 'market', avatar: 'profile' };
  const kind = map[p.kind]; if (!kind) return;
  if (S.scene && p.kind !== 'avatar') S.scene.walkNear(p.kind === 'leaderboard' ? 'plaza' : p.kind === 'market' ? 'market' : p.kind, p.id);
  openPanel(kind, p.id);
}

// ---------------------------------------------------------------- data
async function sync({ visit = false } = {}) {
  if (S.syncing) return S.syncing;
  S.syncing = (async () => {
    if (visit) {
      try {
        const v = await AT.api('/api/game/visit', {});
        if (v.firstToday) {
          const n = v.streak.current;
          reward(v.game, { at: 'beacon', msg: n > 1 ? n + '-day streak! The beacon burns brighter.' : 'Welcome back. Your streak starts today.', quiet: !S.data });
        }
      } catch (e) { if (e.status === 401) throw e; console.warn('visit failed', e); }
    }
    const d = await AT.api('/api/game/town');
    S.data = d; S.lastSync = Date.now();
    checkInstalls();
    render();
  })();
  try { return await S.syncing; } finally { S.syncing = null; }
}
const ctx = {
  get data() { return S.data; }, get cfg() { return S.cfg; }, get installed() { return S.installed; }, bridge, haptic,
  get draftAvatar() { return S.draftAvatar; }, set draftAvatar(v) { S.draftAvatar = v; },
  refresh: () => sync(), open: (k, id) => openPanel(k, id), reward: (g, o) => reward(g, o), toast: (a, b) => toast(a, b),
  preview: (av) => { if (S.scene) S.scene.previewAvatar(av); }, forget: (k) => { delete keepStore[k]; }, signOut: () => signOut(),
};

// installed apps (Android app only)
function checkInstalls() {
  if (!bridge || !S.data) return;
  const want = [...new Set((S.data.myTests || []).filter((a) => ['invited', 'active', 'completed_pending'].includes(a.status)).map((a) => a.campaign.package))];
  if (!want.length) { S.installed = null; return; }
  const res = bridge.installed(want);
  if (!res || typeof res !== 'object') return;
  S.installed = {}; want.forEach((p) => { S.installed[p] = Number(res[p]) || 0; });
  const active = (S.data.myTests || []).some((a) => a.status === 'active');
  const list = want.filter((p) => S.installed[p] > 0);
  const key = list.join(',') + '|' + Math.floor(Date.now() / 600000);
  if (active && key !== S.installsSent) {
    S.installsSent = key;
    AT.api('/api/app/installs', { installed: list }).catch((e) => console.warn('installs report failed', e));
  }
}

// ---------------------------------------------------------------- render
function render() {
  const d = S.data; if (!d) return;
  renderHud();
  if (S.scene) {
    S.scene.update(d, { installed: S.installed, boardMe: null });
    const st = d.me, running = (d.myTests || []).filter((a) => P.RUNNING.includes(a.status)).length;
    const open = (d.myTests || []).filter((a) => a.openCheckin).length;
    S.scene.setLabel('market', 'Market <small>' + (d.market || []).length + ' open</small>');
    S.scene.setLabel('workshop', 'Your Workshop <small>' + running + '/' + d.tester.maxActive + (open ? ' · <em>check-in open</em>' : '') + '</small>');
    S.scene.setLabel('plaza', 'Plaza <small>leaders</small>');
    S.scene.setLabel('quests', 'Quests <small>' + st.quests.filter((q) => q.done).length + '/' + st.quests.length + '</small>');
    S.scene.setLabel('beacon', 'Streak <small>' + st.streak.current + '</small>');
    S.scene.setLabel('trophies', 'Trophies <small>' + st.badges.filter((b) => b.earnedAt).length + '/' + st.badges.length + '</small>');
    S.scene.setLabel('me', esc(st.profile.nickname || 'You'));
  }
  if (S.list) renderList();
  if (S.panel) refreshPanel();
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderHud() {
  const d = S.data, st = d.me, r = st.rank, t = d.tester;
  $('tw-rank-name').textContent = r.name;
  $('tw-rank-ico').textContent = String(Math.max(0, RANKS.indexOf(r.name)) + 1);
  $('tw-xp-txt').textContent = r.next ? st.xp.toLocaleString() + ' / ' + r.next.toLocaleString() + ' XP' : st.xp.toLocaleString() + ' XP';
  const pct = r.next ? Math.max(0, Math.min(100, ((st.xp - r.min) / (r.next - r.min)) * 100)) : 100;
  $('tw-xpbar-fill').style.width = pct + '%';
  $('tw-xpbar').setAttribute('aria-valuenow', Math.round(pct));
  $('tw-xp-next').textContent = r.next ? (r.next - st.xp).toLocaleString() + ' XP to ' + r.nextName : 'Top rank';
  $('tw-streak-n').textContent = st.streak.current;
  $('tw-streak').setAttribute('aria-label', 'Streak: ' + st.streak.current + ' days (best ' + st.streak.best + ')');
  $('tw-streak').classList.toggle('lit', st.streak.current > 0);
  $('tw-balance-n').textContent = money(d.balanceCents);
  $('tw-balance').setAttribute('aria-label', 'Balance ' + money(d.balanceCents));
  $('tw-pay-lv').textContent = t.level;
  $('tw-pay-price').textContent = '$' + (t.priceCents / 100).toFixed(t.priceCents % 100 ? 2 : 0);
  $('tw-pay').setAttribute('aria-label', 'Pay level ' + t.level + ', ' + money(t.priceCents) + ' per finished test');
  const left = st.quests.filter((q) => !q.done).length;
  $('tw-quest-dot').hidden = !left; $('tw-quest-dot').textContent = left;
}

// ---------------------------------------------------------------- panels
const PANELS = { stall: P.stallPanel, market: P.marketPanel, tower: P.towerPanel, workshop: P.workshopPanel, quests: P.questsPanel, leaderboard: P.leaderboardPanel, trophies: P.trophiesPanel, beacon: P.beaconPanel, profile: P.profilePanel, menu: P.menuPanel, help: P.helpPanel };
const keepStore = {};
function snapshot(root) {
  root.querySelectorAll('[data-keep]').forEach((el) => {
    const k = el.getAttribute('data-keep');
    if (el.tagName === 'DETAILS') keepStore[k] = { open: el.open };
    else if (el.type === 'checkbox' || el.type === 'radio') keepStore[k] = { checked: el.checked };
    else keepStore[k] = { value: el.value };
  });
}
function restore(root) {
  root.querySelectorAll('[data-keep]').forEach((el) => {
    const v = keepStore[el.getAttribute('data-keep')]; if (!v) return;
    if ('open' in v) el.open = v.open;
    else if ('checked' in v) { if (el.checked !== v.checked) { el.checked = v.checked; el.dispatchEvent(new Event('change', { bubbles: true })); } }
    else if (v.value !== el.value) { el.value = v.value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
  });
}
function openPanel(kind, id) {
  if (!S.data || !PANELS[kind]) return;
  const same = S.panel && S.panel.kind === kind;
  if (S.panel && S.panel.onClose && !same) S.panel.onClose();
  const opener = S.panel ? S.panel.opener : (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
  S.panel = { kind, id, opener };
  drawPanel(true);
  const el = $('tw-panel');
  el.hidden = false; document.body.classList.add('tw-panel-open');
  requestAnimationFrame(() => el.classList.add('in'));
  $('tw-panel-title').focus({ preventScroll: true });
  if (S.scene && !S.list && ['stall', 'tower', 'workshop', 'quests', 'beacon', 'trophies', 'market', 'leaderboard'].includes(kind)) S.scene.focus(kind === 'leaderboard' ? 'plaza' : kind, id);
}
function drawPanel(fresh) {
  const body = $('tw-panel-body');
  if (!fresh) snapshot(body);
  const p = S.panel, r = PANELS[p.kind](ctx, p.id);
  p.onClose = r.onClose || null;
  $('tw-panel-title').textContent = r.title;
  $('tw-panel').dataset.kind = p.kind;
  const scroll = body.scrollTop;
  AT.clear(body).appendChild(r.body);
  restore(body);
  if (!fresh) body.scrollTop = scroll;
}
function refreshPanel() {
  const a = document.activeElement;
  if (a && $('tw-panel').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { S.panelStale = true; return; }
  if (S.panel.kind === 'leaderboard') return; // fetches its own data
  drawPanel(false);
}
function closePanel() {
  if (!S.panel) return;
  const p = S.panel; S.panel = null;
  snapshot($('tw-panel-body'));
  if (p.onClose) p.onClose();
  const el = $('tw-panel'); el.classList.remove('in'); document.body.classList.remove('tw-panel-open');
  setTimeout(() => { if (!S.panel) el.hidden = true; }, 220);
  if (p.opener && p.opener.isConnected) p.opener.focus({ preventScroll: true });
}
$('tw-panel-close').addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.panel) { e.preventDefault(); closePanel(); } });
document.addEventListener('focusout', () => { setTimeout(() => { if (S.panelStale && S.panel && !$('tw-panel').contains(document.activeElement)) { S.panelStale = false; drawPanel(false); } }, 0); });

// HUD + dock
document.querySelectorAll('#tw-dock [data-open]').forEach((b) => b.addEventListener('click', () => { haptic('light'); S.panel && S.panel.kind === b.dataset.open ? closePanel() : openPanel(b.dataset.open); }));
$('tw-rank').addEventListener('click', () => openPanel('workshop'));
$('tw-streak').addEventListener('click', () => openPanel('beacon'));
$('tw-balance').addEventListener('click', () => openPanel('workshop'));
$('tw-pay').addEventListener('click', () => openPanel('workshop'));
$('tw-rot-l').addEventListener('click', () => S.scene && S.scene.rotate(-1));
$('tw-rot-r').addEventListener('click', () => S.scene && S.scene.rotate(1));
$('tw-home').addEventListener('click', () => S.scene && S.scene.home());
$('tw-btn-list').addEventListener('click', () => setList(!S.list));

// ---------------------------------------------------------------- list view (and no-WebGL fallback)
function setList(on) {
  S.list = on || !S.gl;
  document.body.classList.toggle('tw-listmode', S.list);
  $('tw-list').hidden = !S.list;
  $('tw-stage').hidden = S.list;
  $('tw-cam').hidden = S.list;
  $('tw-btn-list').setAttribute('aria-pressed', String(S.list));
  $('tw-list-label').textContent = S.list ? (S.gl ? 'Town' : 'List') : 'List';
  $('tw-btn-list').disabled = !S.gl;
  if (S.scene) S.scene.setPaused(S.list || document.hidden);
  if (S.list) { renderList(); if (on) $('tw-list').focus({ preventScroll: true }); }
}
function renderList() {
  const d = S.data, root = $('tw-list'); if (!d) return;
  const st = d.me;
  const btn = (label, sub, fn, attrs = {}) => h('li', null, h('button', Object.assign({ type: 'button', class: 'tw-row', onclick: fn }, attrs), h('span', { class: 'tw-row-main' }, h('b', { text: label }), sub ? h('small', { text: sub }) : null)));
  const running = (d.myTests || []).filter((a) => P.RUNNING.includes(a.status));
  const sec = (title, ...kids) => h('section', { class: 'tw-lsec' }, h('h2', { text: title }), ...kids);
  AT.clear(root).append(
    !S.gl ? h('p', { class: 'tw-note', role: 'note', text: 'This browser can’t show the 3D town, so here it is as a list. Everything works the same.' }) : null,
    h('h1', { class: 'tw-list-h', text: 'Test Town' }),
    sec('Your Workshop', h('ul', { class: 'tw-rows' },
      btn(st.rank.name + ' · ' + st.xp.toLocaleString() + ' XP', 'Rank, house, money and pay level', () => openPanel('workshop')),
      running.map((a) => btn(a.campaign.appName, (AT.STATUS[a.status] || [a.status])[0] + (a.status === 'active' ? ' · ' + Math.min(3, a.filedDays.length) + '/3 check-ins' : '') + (a.openCheckin ? ' · check-in open now' : '') + (S.installed && S.installed[a.campaign.package] === 0 && a.status === 'active' ? ' · not installed on this phone' : ''), () => openPanel('tower', a.id), { 'data-open-tower': a.id })))),
    sec('Market · ' + (d.market || []).length + ' open', (d.market || []).length ? h('ul', { class: 'tw-rows' }, d.market.map((t) => btn(t.appName + ' · ' + money(t.yourPriceCents), t.slotsLeft + ' slots · developer ' + (t.developer.standing > 0 ? '+' : '') + t.developer.standing, () => openPanel('stall', t.id), { 'data-open-stall': t.id }))) : h('p', { class: 'at-empty', text: 'No open tests right now.' })),
    sec('Around town', h('ul', { class: 'tw-rows' },
      btn('Quest Board', st.quests.filter((q) => q.done).length + ' of ' + st.quests.length + ' quests done', () => openPanel('quests')),
      btn('Plaza leaderboard', d.podium.length ? 'Top this week: ' + d.podium.map((r) => r.nickname).join(', ') : 'No one on the board yet', () => openPanel('leaderboard')),
      btn('Streak Beacon', st.streak.current + '-day streak (best ' + st.streak.best + ')', () => openPanel('beacon')),
      btn('Trophy Hall', st.badges.filter((b) => b.earnedAt).length + ' of ' + st.badges.length + ' badges', () => openPanel('trophies')),
      btn('Profile', st.profile.nickname ? 'Nickname ' + st.profile.nickname : 'Set a nickname and avatar', () => openPanel('profile')))));
}

// ---------------------------------------------------------------- rewards
function toast(title, sub, kind) {
  const el = h('div', { class: 'tw-toast' + (kind ? ' tw-toast--' + kind : '') }, h('b', { text: title }), sub ? h('span', { text: sub }) : null);
  const box = $('tw-toasts');
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, 3600);
}
function reward(game, o = {}) {
  game = game || {};
  const xp = game.xp || 0;
  if (o.msg) toast(o.msg, xp ? '+' + xp + ' XP' : '', 'xp');
  else if (xp) toast('+' + xp + ' XP', o.sub || '', 'xp');
  (game.questsDone || []).forEach((q) => toast('Quest done: ' + q.title, '+' + q.rewardXp + ' XP', 'quest'));
  (game.newBadges || []).forEach((b) => toast('Badge: ' + b.name, b.description, 'badge'));
  if (S.scene && !o.quiet) S.scene.celebrate({ at: o.at, id: o.id, n: xp >= 50 ? 110 : 70 });
  if (game.rankUp) {
    haptic('success');
    const ov = $('tw-rankup');
    $('tw-rankup-name').textContent = game.rank;
    $('tw-rankup-sub').textContent = 'Your workshop grows. New cosmetics may be unlocked in your profile.';
    ov.hidden = false; ov.classList.remove('go'); void ov.offsetWidth; ov.classList.add('go');
    setTimeout(() => { ov.hidden = true; ov.classList.remove('go'); }, 3400);
    if (S.scene) S.scene.celebrate({ big: true });
    $('tw-hud').classList.add('tw-pulse'); setTimeout(() => $('tw-hud').classList.remove('tw-pulse'), 1600);
  } else if (xp || (game.newBadges || []).length) haptic('success');
}

// ---------------------------------------------------------------- sign-in / boot
function showGate(msg) {
  $('tw-loading').hidden = true;
  ['tw-hud', 'tw-dock', 'tw-cam', 'tw-list'].forEach((id) => { $(id).hidden = true; });
  $('tw-gate').hidden = false;
  $('tw-gate-msg').textContent = msg || '';
  if (native) { AT.clear($('tw-signin')).append(h('p', { text: 'Sign in from the app’s start screen.' })); return; }
  AT.renderSignIn($('tw-signin'), () => { $('tw-gate').hidden = true; boot(); });
}
AT.onSignedOut = (msg) => {
  S.data = null; closePanel();
  if (bridge) { bridge.signOut(); }
  showGate(msg);
};
async function signOut() {
  closePanel();
  if (bridge) { try { await AT.api('/api/auth/logout', {}); } catch (e) { /* ignore */ } bridge.signOut(); showGate(); return; }
  await AT.signOut(); S.data = null; showGate();
}

async function boot() {
  $('tw-loading').hidden = false;
  try {
    S.cfg = await AT.config();
    await sync({ visit: true });
  } catch (e) {
    if (e.status === 401) return; // onSignedOut showed the gate
    $('tw-loading').hidden = true;
    $('tw-gate').hidden = false;
    AT.clear($('tw-signin')).append(h('p', { class: 'at-err', role: 'alert', text: e.message }), h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Try again', onclick: () => { $('tw-gate').hidden = true; boot(); } }));
    return;
  }
  $('tw-gate').hidden = true;
  $('tw-hud').hidden = false; $('tw-dock').hidden = false;
  setList(S.list);
  $('tw-loading').classList.add('out'); setTimeout(() => { $('tw-loading').hidden = true; }, 500);
  if (!S.gl) $('tw-btn-list').title = '3D isn’t available in this browser';
}

// resume (Android app event, or tab coming back)
function resume() {
  if (!S.data || Date.now() - S.lastSync < 15000) return;
  const a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  sync({ visit: true }).catch(() => {});
}
window.addEventListener('amniapp', (e) => { if (e.detail && e.detail.type === 'resume') { if (native) AT.token(); resume(); } });
document.addEventListener('visibilitychange', () => {
  if (S.scene) S.scene.setPaused(document.hidden || S.list);
  if (document.visibilityState === 'visible') resume();
});
window.addEventListener('town-theme', (e) => { if (S.scene) S.scene.setTheme(e.detail === 'dark'); });

(async function main() {
  S.gl = await startScene();
  if (!S.gl) { S.list = true; document.body.classList.add('tw-nogl'); }
  if (AT.token()) boot(); else showGate();
})();
