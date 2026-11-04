// Test Town panels: real HTML (forms, buttons, links) shown in the side sheet.
// The tester flows are ported from /test/tester.js so the town offers the same actions as the 2D app.
import { COLOR_NAMES, AVATAR_COLORS, RANKS } from './shared.js';

const AT = window.AT, h = AT.h, money = AT.money, DAY = AT.DAY;
export const RUNNING = ['accepted', 'invited', 'active', 'completed_pending', 'exit_pending'];
const HOUSE_NAMES = ['a tidy shed', 'a cottage with a fence', 'a workbench and chimney', 'a second storey', 'a lookout tower', 'a garden wing', 'a golden dome'];
const BADGE_GLYPH = { first_steps: '1', first_report: '✎', finisher: '✓', veteran: '10', marathon: '25', sharp_eye: '◎', helpful_hand: '♥', streak_7: '7', streak_30: '30', clean_sheet: '✦', questor: '★', top_level: '$5' };

// ---------- small pieces
function priceShort(c) { return '$' + (c / 100).toFixed(c % 100 ? 2 : 0); }
function section(title, ...kids) { return h('section', { class: 'tw-sec' }, title ? h('h3', { class: 'tw-sec-h', text: title }) : null, ...kids); }
function bar(pct, label) {
  pct = Math.max(0, Math.min(100, Math.round(pct)));
  return h('div', { class: 'at-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': label }, h('i', { style: 'width:' + pct + '%' }));
}
export function swatch(av, size) {
  av = av || {};
  return h('span', { class: 'tw-sw tw-sw--' + (av.shape || 'cube') + (size ? ' tw-sw--' + size : ''), style: '--c:' + (AVATAR_COLORS[av.color] || AVATAR_COLORS.c0), 'aria-hidden': 'true' },
    av.hat && av.hat !== 'none' ? h('i', { class: 'tw-sw-hat tw-sw-hat--' + av.hat }) : null);
}
function extLink(ctx, href, text, cls) {
  return h('a', {
    class: cls || 'btn btn-outline at-sm', href, target: '_blank', rel: 'noopener', text,
    onclick: (e) => { if (ctx.bridge && ctx.bridge.openExternal) { e.preventDefault(); ctx.bridge.openExternal(href); } ctx.haptic('light'); },
  });
}
function dl(rows) { return h('dl', { class: 'tw-dl' }, rows.filter(Boolean).map(([k, v]) => [h('dt', { text: k }), h('dd', null, v)])); }

// ---------- market stall
export function stallPanel(ctx, id) {
  const t = (ctx.data.market || []).find((x) => x.id === id);
  if (!t) {
    const mine = (ctx.data.myTests || []).find((a) => a.campaign.id === id);
    if (mine) return { title: mine.campaign.appName, body: h('div', null, h('p', { text: 'You already signed up for this test.' }), h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Open your tower', onclick: () => ctx.open('tower', mine.id) })) };
    return { title: 'Stall closed', body: h('p', { class: 'at-empty', text: 'This test is no longer open. It may have filled up.' }) };
  }
  const u = ctx.data.user, tester = ctx.data.tester, d = t.developer;
  const running = (ctx.data.myTests || []).filter((a) => RUNNING.includes(a.status)).length;
  const blocked = u.status !== 'active' ? 'Your account isn’t active, so you can’t take new tests.'
    : running >= tester.maxActive ? 'You’re running ' + running + ' tests, the most at once. Finish one to take another.' : '';
  const box = AT.errBox();
  const adult = !u.adult ? h('input', { type: 'checkbox', id: 'tw-adult-cb', 'data-keep': 'adult-' + id }) : null;
  const btn = h('button', { type: 'button', class: 'btn btn-primary', id: 'tw-signup', 'data-accept': t.id, text: 'Sign up for ' + priceShort(t.yourPriceCents), disabled: !!blocked });
  if (adult) { btn.disabled = true; adult.addEventListener('change', () => { btn.disabled = !!blocked || !adult.checked; }); }
  btn.addEventListener('click', () => AT.run(btn, box, async () => {
    if (adult) { if (!adult.checked) throw new Error('Confirm you are 18 or older first.'); await AT.api('/api/me/adult', {}); }
    const r = await AT.api('/api/tests/' + t.id + '/accept', {});
    ctx.haptic('success');
    ctx.reward(r.game, { at: 'stall', id: t.id });
    await ctx.refresh();
    if (r.assignment) ctx.open('tower', r.assignment.id);
  }));
  const devLine = d.finished ? d.completed + ' of ' + d.finished + ' testers finished' : 'New developer, no finished tests yet';
  const rate = d.finished ? Math.round((d.completed / d.finished) * 100) + '% completion' : '';
  return {
    title: t.appName,
    body: h('div', { class: 'tw-stall', 'data-test': t.id },
      h('div', { class: 'tw-price' }, h('span', { class: 'tw-price-n', text: priceShort(t.yourPriceCents) }), h('span', { class: 'tw-price-l', text: 'your price for finishing all 14 days' })),
      h('span', { class: 'at-pkg', text: t.package }),
      t.description ? h('p', { class: 'at-quote', text: t.description }) : h('p', { class: 'at-hint', text: 'No description.' }),
      dl([
        ['Slots left', String(t.slotsLeft)],
        ['Developer', h('span', null, h('b', { class: d.standing < 0 ? 'at-minus' : d.standing > 0 ? 'at-plus' : '', text: (d.standing > 0 ? '+' : '') + d.standing }), ' standing')],
        ['Record', devLine + (rate ? ' (' + rate + ')' : '')],
        ['Checked by', t.verification === 'sdk' ? 'Amni-Test SDK in the app (automatic)' : 'The developer, by hand'],
      ]),
      h('p', { class: 'at-hint', text: 'You install from Google Play, keep the app 14 days and file three short check-ins (days 1, 7 and 14). Only the developer sees them. They are never Play Store reviews.' }),
      blocked ? h('p', { class: 'at-hint at-minus', text: blocked }) : null,
      adult ? h('label', { class: 'at-check tw-adult' }, adult, h('span', null, 'I am 18 or older, and I agree to the ', h('a', { href: '/test/terms.html', text: 'Amni-Test terms' }), '.')) : null,
      h('div', { class: 'at-actions tw-cta' }, btn), box),
  };
}

export function marketPanel(ctx) {
  const list = ctx.data.market || [];
  return {
    title: 'Market',
    body: h('div', null,
      h('p', { class: 'at-hint', text: list.length ? list.length + ' open ' + (list.length === 1 ? 'test' : 'tests') + '. Prices are what you’d earn for a finished test.' : 'No open tests right now. New ones appear here when developers post them.' }),
      h('ul', { class: 'tw-rows' }, list.map((t) => h('li', null, h('button', { type: 'button', class: 'tw-row', 'data-open-stall': t.id, onclick: () => ctx.open('stall', t.id) },
        h('span', { class: 'tw-row-main' }, h('b', { text: t.appName }), h('small', { text: t.slotsLeft + (t.slotsLeft === 1 ? ' slot' : ' slots') + ' · dev ' + (t.developer.standing > 0 ? '+' : '') + t.developer.standing + ' · ' + (t.verification === 'sdk' ? 'SDK' : 'manual') })),
        h('span', { class: 'at-pill at-pill--go', text: priceShort(t.yourPriceCents) })))))),
  };
}

// ---------- towers (my tests)
function checkinTrack(a, cfg) {
  return h('div', { class: 'at-track', 'aria-label': 'Check-ins' }, cfg.checkins.map((w) => {
    const cls = a.filedDays.indexOf(w.day) >= 0 ? 'done' : a.openCheckin === w.day ? 'open' : (a.day != null && a.day > w.to) ? 'missed' : '';
    const word = cls === 'done' ? 'sent' : cls === 'open' ? 'open now' : cls === 'missed' ? 'missed' : 'days ' + (w.from + 1) + '–' + (w.to + 1);
    return h('span', { class: cls }, 'Day ' + w.day + ' · ' + word);
  }));
}
function checkinForm(ctx, a) {
  const key = 'ck-' + a.id + '-' + a.openCheckin;
  const worked = h('textarea', { name: 'worked', 'data-keep': key + '-w', maxlength: 4000, placeholder: 'What did you try? What worked well?' });
  const broke = h('textarea', { name: 'broke', 'data-keep': key + '-b', maxlength: 4000, placeholder: 'Anything that crashed, looked wrong or confused you. Steps help.' });
  const device = h('input', { name: 'device', 'data-keep': key + '-d', maxlength: 200, placeholder: 'e.g. Pixel 7, Android 14', autocomplete: 'off' });
  const count = h('small', { class: 'tw-count', 'aria-live': 'polite' });
  const upd = () => { const n = worked.value.length + broke.value.length; count.textContent = n >= 200 ? 'Detailed check-in: +10 bonus XP' : n + ' / 200 characters for the detailed bonus'; count.classList.toggle('at-plus', n >= 200); };
  worked.addEventListener('input', upd); broke.addEventListener('input', upd); upd();
  const box = AT.errBox();
  const btn = h('button', { type: 'submit', class: 'btn btn-primary at-sm', text: 'Send day-' + a.openCheckin + ' check-in' });
  const form = h('form', {
    class: 'at-form tw-checkin', 'data-checkin': a.id,
    onsubmit: (ev) => {
      ev.preventDefault();
      AT.run(btn, box, async () => {
        const r = await AT.api('/api/assignments/' + a.id + '/checkin', { worked: worked.value, broke: broke.value, device: device.value });
        form.reset(); ctx.forget(key);
        ctx.haptic('success');
        ctx.reward(r.game, { at: 'tower', id: a.id });
        await ctx.refresh();
      });
    },
  },
  h('h3', { class: 'at-h', style: 'margin:0', text: 'Day ' + a.openCheckin + ' check-in is open' }),
  h('p', { class: 'at-hint', text: 'A couple of sentences or more. Only the developer sees this. It is not a Play Store review.' }),
  h('label', { class: 'at-field' }, h('span', { text: 'What worked' }), worked),
  h('label', { class: 'at-field' }, h('span', { text: 'What broke or felt wrong' }), broke),
  count,
  h('label', { class: 'at-field' }, h('span', { text: 'Your device' }), device),
  h('div', { class: 'at-actions' }, btn), box);
  return form;
}
function leaveForm(ctx, a) {
  const cfg = ctx.cfg;
  const sel = h('select', { name: 'reason', 'data-keep': 'exit-' + a.id + '-r' },
    h('option', { value: '', text: 'Pick a reason' }),
    h('optgroup', { label: 'The app’s fault (no demerit)' }, cfg.excusedReasons.map((r) => h('option', { value: r, text: AT.EXIT_LABELS[r] || r }))),
    h('optgroup', { label: 'Other reasons (−5 demerits, no pay)' }, cfg.unexcusedReasons.map((r) => h('option', { value: r, text: AT.EXIT_LABELS[r] || r }))));
  const note = h('textarea', { name: 'note', 'data-keep': 'exit-' + a.id + '-n', maxlength: 2000, placeholder: 'What went wrong? The developer reads this.' });
  const info = h('p', { class: 'at-hint' });
  const box = AT.errBox();
  const excused = () => cfg.excusedReasons.indexOf(sel.value) >= 0;
  const btn = AT.confirmBtn('Leave test', () => (excused() ? 'Confirm: leave the test' : 'Confirm: leave and take −5'), box, async () => {
    if (!sel.value) throw new Error('Pick a reason first.');
    await AT.api('/api/assignments/' + a.id + '/exit', { reason: sel.value, note: note.value });
    ctx.haptic('warning');
    await ctx.refresh();
  });
  function update() {
    btn.reset();
    if (!sel.value) info.textContent = 'Pick a reason to see what happens next.';
    else if (excused()) info.textContent = 'This counts as the app’s fault. The developer has 72 hours to dispute it. If they don’t, or an admin agrees with you, you’re paid for the days you tested, with no demerit.';
    else info.textContent = 'Leaving for this reason costs 5 demerits, and this test pays nothing.';
  }
  sel.addEventListener('change', update); update();
  return h('details', { class: 'at-more', 'data-keep': 'exit-' + a.id + '-open' }, h('summary', { text: 'Leave this test' }),
    h('div', { class: 'at-form' }, h('label', { class: 'at-field' }, h('span', { text: 'Why are you leaving?' }), sel), info,
      h('label', { class: 'at-field' }, h('span', { text: 'What happened' }), note), h('div', { class: 'at-actions' }, btn), box));
}
function leaveEarly(ctx, a) {
  const box = AT.errBox();
  const btn = AT.confirmBtn('Give up this slot', 'Confirm: give up the slot', box, async () => {
    await AT.api('/api/assignments/' + a.id + '/exit', { reason: 'no_time', note: '' });
    await ctx.refresh();
  }, 'btn-outline');
  return h('details', { class: 'at-more', 'data-keep': 'early-' + a.id }, h('summary', { text: 'Can’t do it after all?' }),
    h('div', null, h('p', { class: 'at-hint', style: 'margin-bottom:.6rem', text: 'You haven’t started, so giving up the slot now costs nothing.' }), h('div', { class: 'at-actions' }, btn), box));
}
function reportForm(ctx, a) {
  const sel = h('select', { name: 'category', 'data-keep': 'rep-' + a.id + '-c' }, h('option', { value: '', text: 'Pick a category' }), ctx.cfg.reportCategories.map((c) => h('option', { value: c, text: AT.REPORT_LABELS[c] || c })));
  const note = h('textarea', { name: 'note', 'data-keep': 'rep-' + a.id + '-n', maxlength: 2000, placeholder: 'What happened? Include anything an admin should check.' });
  const box = AT.errBox(), ok = h('p', { class: 'at-ok', role: 'status' });
  const btn = h('button', { type: 'submit', class: 'btn btn-outline at-sm', text: 'Send report' });
  const form = h('form', {
    class: 'at-form',
    onsubmit: (ev) => {
      ev.preventDefault();
      AT.run(btn, box, async () => {
        await AT.api('/api/reports', { kind: 'campaign', assignmentId: a.id, category: sel.value, note: note.value });
        form.reset(); ok.textContent = 'Report sent. An admin will review it.';
      });
    },
  }, h('p', { class: 'at-hint', text: 'Reports go to an admin. While one is open, the developer can’t post new tests. False reports can count against you.' }),
  h('label', { class: 'at-field' }, h('span', { text: 'Category' }), sel), h('label', { class: 'at-field' }, h('span', { text: 'What happened' }), note), h('div', { class: 'at-actions' }, btn), box, ok);
  return h('details', { class: 'at-more', 'data-keep': 'rep-' + a.id + '-open' }, h('summary', { text: 'Report this app' }), h('div', null, form));
}
const deadlineLine = (prefix, ms) => h('p', null, prefix + ' ', h('b', { text: AT.dateTime(ms) }), ' (' + AT.left(ms) + ').');

function installLine(ctx, a) {
  if (!ctx.installed) return null;
  const v = ctx.installed[a.campaign.package];
  if (v === undefined) return null;
  if (v > 0) return h('p', { class: 'tw-inst tw-inst--ok', 'data-installed': 'yes' }, h('b', { text: '✓ Installed on this phone' }), ' (version ' + v + ')');
  if (a.status === 'active') return h('p', { class: 'tw-inst tw-inst--warn', 'data-installed': 'no' }, h('b', { text: '! Not installed on this phone.' }), ' Keep the app installed for all 14 days, or the developer may dispute the test.');
  return h('p', { class: 'tw-inst', 'data-installed': 'no', text: 'Not installed on this phone yet.' });
}

export function towerPanel(ctx, id) {
  const a = (ctx.data.myTests || []).find((x) => x.id === id);
  if (!a) return { title: 'Tower', body: h('p', { class: 'at-empty', text: 'This test isn’t in your list any more.' }) };
  const c = a.campaign, user = ctx.data.user;
  const card = h('div', { class: 'tw-tower', 'data-assignment': a.id, 'data-status': a.status });
  const floors = Math.min(3, a.filedDays.length);
  card.append(h('div', { class: 'tw-tower-head' }, AT.pill(a.status), h('span', { class: 'at-pill', text: money(a.priceCents) }),
    RUNNING.includes(a.status) && a.status !== 'completed_pending' ? h('span', { class: 'tw-floors', text: floors + ' of 3 floors built' }) : null),
  h('span', { class: 'at-pkg', text: c.package }), installLine(ctx, a));
  const instr = c.instructions ? h('details', { class: 'at-more', 'data-keep': 'instr-' + a.id }, h('summary', { text: 'What the developer wants you to test' }), h('div', null, h('p', { class: 'at-quote', text: c.instructions }))) : null;
  switch (a.status) {
    case 'accepted':
      card.append(h('p', { text: 'Foundation laid. Waiting for the developer to add your Google account (' + user.email + ') to their closed test.' }),
        a.deadline ? deadlineLine('If they don’t add you by', a.deadline) : null,
        h('p', { class: 'at-hint', text: 'If they run out of time, the slot is released with no penalty to you.' }), instr, leaveEarly(ctx, a));
      break;
    case 'invited': {
      const box = AT.errBox();
      const go = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'I’ve joined and installed', 'data-start': a.id });
      go.addEventListener('click', () => AT.run(go, box, async () => { await AT.api('/api/assignments/' + a.id + '/start', {}); ctx.haptic('success'); ctx.reward({ xp: 0 }, { at: 'tower', id: a.id, msg: 'Day 1 begins. Scaffolding up!' }); await ctx.refresh(); }));
      card.append(h('p', { text: 'You’ve been added. Three steps on your Android phone:' }),
        a.deadline ? deadlineLine('Start by', a.deadline) : null,
        h('ol', { class: 'at-steps' },
          h('li', null, h('b', { text: 'Join the test' }),
            h('p', { text: 'Open Google’s tester page, pick ' + user.email + ' and tap “Become a tester”.' }),
            extLink(ctx, a.links.optIn, 'Open the tester page')),
          h('li', null, h('b', { text: 'Install from Google Play' }),
            h('p', { text: 'Install with this link. It carries your code, so the install is matched to you.' }),
            extLink(ctx, a.links.install, 'Install from Google Play'),
            h('p', { style: 'margin-top:.7rem!important' }, 'Your code: ', h('span', { class: 'at-code', text: a.claimCode })),
            c.verification === 'sdk' ? h('p', { class: 'at-hint', text: 'If the app asks for a code when you open it, type this one.' }) : null),
          h('li', null, h('b', { text: 'Tell us you’ve started' }),
            h('p', { text: 'Your 14 days start when you press this' + (c.verification === 'sdk' ? ', or when the app reports your code, whichever is first.' : '.') }),
            h('div', { class: 'at-actions' }, go), box)),
        h('p', { class: 'at-hint', style: 'margin-top:.7rem', text: 'If you don’t start in time, it counts as a no-show (−2 demerits).' }),
        instr, leaveEarly(ctx, a), reportForm(ctx, a));
      break;
    }
    case 'active': {
      const shown = a.day == null ? 1 : Math.min(a.day + 1, 14);
      card.append(h('p', null, h('b', { text: a.day != null && a.day >= 14 ? 'Past day 14' : 'Day ' + shown + ' of 14' }), a.startedAt ? ' · started ' + AT.date(a.startedAt) : ''),
        bar((shown / 14) * 100, 'Days tested'), checkinTrack(a, ctx.cfg));
      if (a.openCheckin) card.append(checkinForm(ctx, a));
      else if (a.nextCheckin && a.startedAt) {
        const opens = a.startedAt + a.nextCheckin.opensDay * DAY;
        card.append(h('p', null, 'Next floor: the day-' + a.nextCheckin.day + ' check-in opens ', h('b', { text: AT.until(opens) }), ' (' + AT.dateTime(opens) + ').'),
          h('p', { class: 'at-hint', text: 'Keep the app installed and use it now and then. Each check-in takes a few minutes and adds a floor.' }));
      } else card.append(h('p', { class: 'at-hint', text: 'No more check-ins are open for this test.' }));
      if (a.missedCheckins) card.append(h('p', { class: 'at-hint at-minus', text: 'Missed check-ins: ' + a.missedCheckins + '. Each one costs a third of the pay.' }));
      card.append(instr, extLink(ctx, a.links.install, 'Open on Google Play', 'btn at-link'), leaveForm(ctx, a), reportForm(ctx, a));
      break;
    }
    case 'completed_pending': {
      const pay = Math.round(a.priceCents * Math.min(a.filedDays.length, 3) / 3);
      card.append(h('p', { text: 'Roof on! You filed the day-14 check-in.' }),
        a.deadline ? deadlineLine('The developer can confirm or dispute until', a.deadline) : null,
        h('p', { text: 'If they do nothing, it’s confirmed automatically and ' + money(pay) + ' goes to your balance.' }),
        a.disputeNote ? h('div', null, h('p', { text: 'The developer disputed this. An admin will decide. Their note:' }), h('p', { class: 'at-quote', text: a.disputeNote })) : null,
        reportForm(ctx, a));
      break;
    }
    case 'exit_pending':
      card.append(h('p', { text: 'You left: ' + (AT.EXIT_LABELS[a.exitReason] || a.exitReason || 'no reason') + '.' }),
        a.deadline ? deadlineLine('The developer can dispute until', a.deadline) : null,
        h('p', { text: 'If they don’t, the exit is excused: you’re paid for the days you tested, with no demerit.' }),
        a.disputeNote ? h('div', null, h('p', { text: 'The developer disputed your reason. An admin will decide. Their note:' }), h('p', { class: 'at-quote', text: a.disputeNote })) : null,
        reportForm(ctx, a));
      break;
    case 'completed': card.append(h('p', null, 'Finished. You earned ', h('b', { text: money(a.paidCents) }), ', 3 merits and 100 XP. The pennant is yours.')); break;
    case 'excused': card.append(h('p', null, 'Your exit was excused. You earned ', h('b', { text: money(a.paidCents) }), ' for the days you tested, with no demerit.')); break;
    case 'exited': card.append(h('p', { text: a.exitReason ? 'You left this test (' + (AT.EXIT_LABELS[a.exitReason] || a.exitReason) + '). It cost 5 demerits and paid nothing.' : 'This test ended without pay: no check-ins were filed, or a dispute was decided against you. It cost 5 demerits.' })); break;
    case 'no_show': card.append(h('p', { text: 'You didn’t start within 72 hours of being added. That cost 2 demerits.' })); break;
    case 'expired': card.append(h('p', { text: 'The slot was released before the test started. No demerits.' })); break;
    case 'removed': card.append(h('p', null, 'You were removed from this test when your account was closed. Paid ', h('b', { text: money(a.paidCents) }), '.')); break;
    default: card.append(h('p', { text: 'Status: ' + a.status }));
  }
  return { title: c.appName, body: card };
}

// ---------- workshop (house): rank ladder, money, my tests
export function workshopPanel(ctx) {
  const d = ctx.data, st = d.me, r = st.rank, t = d.tester;
  const idx = Math.max(0, RANKS.indexOf(r.name));
  const tests = d.myTests || [];
  const running = tests.filter((a) => RUNNING.includes(a.status));
  const done = tests.filter((a) => !RUNNING.includes(a.status));
  const row = (a) => h('li', null, h('button', { type: 'button', class: 'tw-row', 'data-open-tower': a.id, onclick: () => ctx.open('tower', a.id) },
    h('span', { class: 'tw-row-main' }, h('b', { text: a.campaign.appName }), h('small', { text: (AT.STATUS[a.status] || [a.status])[0] + (a.status === 'active' ? ' · ' + Math.min(3, a.filedDays.length) + '/3 check-ins' : '') + (a.openCheckin ? ' · check-in open' : '') })),
    h('span', { class: 'at-pill', text: money(a.priceCents) })));
  const pct = r.next ? ((st.xp - r.min) / (r.next - r.min)) * 100 : 100;
  return {
    title: 'Your Workshop',
    body: h('div', null,
      h('div', { class: 'tw-hero' }, h('span', { class: 'tw-hero-rank', text: r.name }), h('span', { class: 'tw-hero-xp', text: st.xp.toLocaleString() + ' XP' })),
      bar(pct, 'Progress to the next rank'),
      h('p', { class: 'at-hint', text: r.next ? (r.next - st.xp).toLocaleString() + ' XP to ' + r.nextName + '. Your house grows ' + HOUSE_NAMES[Math.min(6, idx + 1)] + ' at the next rank.' : 'Legend: the top rank. Your house wears the golden dome.' }),
      section('My tests (' + running.length + ' of ' + t.maxActive + ' running)',
        running.length ? h('ul', { class: 'tw-rows' }, running.map(row)) : h('p', { class: 'at-empty' }, 'No towers going up. ', h('button', { type: 'button', class: 'btn at-link', text: 'Visit the market', onclick: () => ctx.open('market') })),
        done.length ? h('details', { class: 'at-more', 'data-keep': 'ws-done' }, h('summary', { text: 'Finished and ended (' + done.length + ')' }), h('div', null, h('ul', { class: 'tw-rows' }, done.map(row)))) : null),
      section('Money',
        dl([['Balance', h('b', { 'data-balance': d.balanceCents, text: money(d.balanceCents) })], ['Pay level', 'Level ' + t.level + ' · ' + money(t.priceCents) + ' per finished test'], ['Standing', (t.standing > 0 ? '+' : '') + t.standing + ' (merits ' + t.merits + ', demerits ' + t.demerits + ')']]),
        h('p', { class: 'at-hint', text: t.nextLevelAt != null ? (t.nextLevelAt - t.standing) + ' more standing to reach level ' + (t.level + 1) + '. Pay level comes from merits and demerits, not XP: XP and rank never pay money.' : 'You are at the top pay level. XP and rank never pay money; only finished tests do.' }),
        h('a', { class: 'btn btn-outline at-sm', href: '/test/app.html#tester', text: 'Payouts in the full app' })),
      section('House by rank', h('ol', { class: 'tw-ladder' }, RANKS.map((name, i) => h('li', { class: i === idx ? 'cur' : i < idx ? 'past' : '' }, h('b', { text: name }), h('span', { text: HOUSE_NAMES[i] })))))),
  };
}

// ---------- quests
function resetIn(period) {
  const now = Date.now(), day = Math.floor(now / DAY);
  const end = period === 'daily' ? (day + 1) * DAY : (day - ((day + 3) % 7) + 7) * DAY;
  return AT.until(end).replace(/^in /, '');
}
export function questsPanel(ctx) {
  const qs = ctx.data.me.quests || [];
  const group = (p, title) => {
    const list = qs.filter((q) => q.period === p);
    return section(title + ' · resets in ' + resetIn(p), h('ul', { class: 'tw-quests' }, list.map((q) => h('li', { class: q.done ? 'done' : '', 'data-quest': q.id },
      h('div', { class: 'tw-q-top' }, h('b', { text: q.title }), h('span', { class: 'tw-q-xp', text: (q.done ? '✓ ' : '+') + q.rewardXp + ' XP' })),
      bar((q.progress / q.target) * 100, q.title), h('small', { text: q.done ? 'Done for this ' + (p === 'daily' ? 'day' : 'week') : q.progress + ' of ' + q.target })))));
  };
  const done = qs.filter((q) => q.done).length;
  return { title: 'Quest Board', body: h('div', null, h('p', { class: 'at-hint', text: done + ' of ' + qs.length + ' done. Rewards land automatically when a quest fills up. Quests give XP only, never money.' }), group('daily', 'Daily'), group('weekly', 'Weekly')) };
}

// ---------- leaderboard
export function leaderboardPanel(ctx, period) {
  period = period === 'all' ? 'all' : 'week';
  const wrap = h('div', { class: 'tw-board', 'aria-busy': 'true' });
  const tabs = h('div', { class: 'tw-tabs', role: 'tablist' }, [['week', 'This week'], ['all', 'All time']].map(([k, label]) =>
    h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === period), 'data-period': k, text: label, onclick: () => ctx.open('leaderboard', k) })));
  const body = h('div', { role: 'tabpanel' }, h('p', { class: 'at-loading', text: 'Loading…' }));
  wrap.append(tabs, body);
  const prof = ctx.data.me.profile;
  AT.api('/api/game/leaderboard?period=' + period).then((r) => {
    AT.clear(body); wrap.setAttribute('aria-busy', 'false');
    if (!prof.nickname) body.append(h('div', { class: 'tw-callout' }, h('p', { text: 'Set a nickname to show up here. Other testers only ever see your nickname, never your email.' }), h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Set a nickname', onclick: () => ctx.open('profile') })));
    if (!r.rows.length) body.append(h('p', { class: 'at-empty', text: period === 'week' ? 'No one has earned XP this week yet.' : 'The board is empty so far.' }));
    else body.append(h('ol', { class: 'tw-lb' }, r.rows.map((x) => h('li', { class: x.nickname === prof.nickname ? 'me' : '' },
      h('span', { class: 'tw-lb-place', text: x.place }), swatch(x.avatar), h('span', { class: 'tw-lb-name' }, h('b', { text: x.nickname }), h('small', { text: x.rank })), h('span', { class: 'tw-lb-xp', text: x.xp.toLocaleString() + ' XP' })))));
    body.append(h('p', { class: 'tw-lb-me', 'data-me-xp': r.me.xp }, r.me.place ? 'You’re #' + r.me.place + ' with ' + r.me.xp.toLocaleString() + ' XP ' + (period === 'week' ? 'this week' : 'in all') + '.' : 'You have ' + r.me.xp.toLocaleString() + ' XP ' + (period === 'week' ? 'this week' : 'in all') + (prof.nickname && !prof.showOnBoard ? ' (hidden from the board).' : '.')));
  }).catch((e) => { AT.clear(body).append(h('p', { class: 'at-err', role: 'alert', text: e.message })); });
  return { title: 'Leaderboard', body: wrap };
}

// ---------- trophies
export function trophiesPanel(ctx) {
  const b = ctx.data.me.badges || [];
  const got = b.filter((x) => x.earnedAt).length;
  return {
    title: 'Trophy Hall',
    body: h('div', null, h('p', { class: 'at-hint', text: got + ' of ' + b.length + ' badges earned. Some unlock hats and trails for your avatar.' }),
      h('ul', { class: 'tw-badges' }, b.map((x) => h('li', { class: x.earnedAt ? 'got' : 'locked', 'data-badge': x.id },
        h('span', { class: 'tw-badge-ico', 'aria-hidden': 'true', text: BADGE_GLYPH[x.id] || '★' }),
        h('span', null, h('b', { text: x.name }), h('small', { text: x.earnedAt ? 'Earned ' + AT.date(x.earnedAt) : 'Locked: ' + x.description })))))),
  };
}

// ---------- streak beacon
export function beaconPanel(ctx) {
  const s = ctx.data.me.streak;
  const today = Math.floor(Date.now() / DAY) === s.lastDay;
  return {
    title: 'Streak Beacon',
    body: h('div', null,
      h('div', { class: 'tw-hero' }, h('span', { class: 'tw-hero-rank', text: s.current + (s.current === 1 ? ' day' : ' days') }), h('span', { class: 'tw-hero-xp', text: 'best ' + s.best })),
      h('p', { text: today ? 'Today counts. Come back tomorrow (UTC) to keep the flame growing.' : s.current ? 'Visit today to keep your streak alive.' : 'Your flame is an ember. Visit on consecutive days to grow it.' }),
      h('p', { class: 'at-hint', text: 'A day counts when you open Test Town on that UTC day (+5 XP, and the daily “Stop by town” quest). Missing a day starts the streak again at 1; your best is kept. A 7-day streak unlocks the Sparks trail, 30 days the Comet trail.' }),
      bar(Math.min(100, (s.current / 30) * 100), 'Flame size')),
  };
}

// ---------- profile
const KINDS = [['color', 'Colour'], ['shape', 'Shape'], ['hat', 'Hat'], ['trail', 'Trail']];
export function profilePanel(ctx) {
  const st = ctx.data.me, prof = st.profile;
  const pick = Object.assign({}, prof.avatar, ctx.draftAvatar || {});
  const nick = h('input', { id: 'tw-nick', name: 'nickname', 'data-keep': 'nick', value: prof.nickname || '', maxlength: 20, minlength: 3, pattern: '[A-Za-z0-9_\\-]{3,20}', autocomplete: 'nickname', spellcheck: 'false', placeholder: 'e.g. bug_hunter_42' });
  const show = h('input', { type: 'checkbox', id: 'tw-show', 'data-keep': 'show', checked: prof.showOnBoard || !prof.nickname });
  const box = AT.errBox(), ok = h('p', { class: 'at-ok', role: 'status' });
  const groups = KINDS.map(([kind, label]) => {
    const items = st.cosmetics.filter((c) => c.kind === kind);
    return h('fieldset', { class: 'tw-cos', 'data-kind': kind }, h('legend', { class: 'at-legend', text: label }),
      h('div', { class: 'tw-cos-grid' }, items.map((c) => {
        const input = h('input', { type: 'radio', name: 'cos-' + kind, value: c.id, checked: pick[kind] === c.id, disabled: !c.unlocked });
        input.addEventListener('change', () => { pick[kind] = c.id; ctx.draftAvatar = Object.assign({}, pick); ctx.preview(pick); ctx.haptic('light'); });
        const name = kind === 'color' ? (COLOR_NAMES[c.id] || c.name) : c.name;
        return h('label', { class: 'tw-cos-item' + (c.unlocked ? '' : ' locked'), title: c.unlocked ? name : name + ': ' + c.how },
          input,
          kind === 'color' ? h('span', { class: 'tw-cos-sw', style: '--c:' + AVATAR_COLORS[c.id] }) : kind === 'shape' ? swatch({ color: pick.color, shape: c.id }, 'sm') : h('span', { class: 'tw-cos-ico tw-cos-ico--' + kind + '-' + c.id }),
          h('span', { class: 'tw-cos-name', text: name }),
          c.unlocked ? null : h('small', { class: 'tw-cos-how', text: 'Locked: ' + c.how }));
      })));
  });
  const btn = h('button', { type: 'submit', class: 'btn btn-primary at-sm', id: 'tw-save-profile', text: 'Save profile' });
  const form = h('form', {
    class: 'at-form', id: 'tw-profile-form', novalidate: true,
    onsubmit: (ev) => {
      ev.preventDefault(); ok.textContent = '';
      AT.run(btn, box, async () => {
        const body = { avatar: pick, showOnBoard: show.checked };
        const n = nick.value.trim();
        if (n !== (prof.nickname || '')) {
          if (!/^[A-Za-z0-9_-]{3,20}$/.test(n)) { nick.setAttribute('aria-invalid', 'true'); throw new Error('Nicknames are 3 to 20 letters, numbers, _ or -.'); }
          body.nickname = n;
        }
        nick.removeAttribute('aria-invalid');
        const r = await AT.api('/api/game/profile', body);
        ctx.draftAvatar = null; ctx.forget('nick');
        ctx.haptic('success');
        ctx.toast('Profile saved', r.profile.nickname ? 'You’re ' + r.profile.nickname + ' around town.' : '');
        await ctx.refresh();
      });
    },
  },
  h('label', { class: 'at-field' }, h('span', { text: 'Nickname' }), nick, h('small', { text: '3–20 letters, numbers, _ or -. This is all other testers see; never your email.' })),
  h('label', { class: 'at-check' }, show, h('span', { text: 'Show me on the leaderboards' })),
  ...groups,
  h('div', { class: 'at-actions' }, btn), box, ok);
  const s = st.stats;
  const share = ctx.bridge && ctx.bridge.share ? h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Share my rank', onclick: () => ctx.bridge.share('I’m a ' + st.rank.name + ' in Amni-Test Test Town' + (prof.nickname ? ' as ' + prof.nickname : '') + ' with ' + st.xp + ' XP. https://amni-scient.com/test/') }) : null;
  return {
    title: 'Profile',
    body: h('div', null,
      h('div', { class: 'tw-stats-grid' }, [['XP', st.xp], ['Finished', s.completed], ['Check-ins', s.checkins], ['Detailed', s.detailed], ['Helpful', s.helpful], ['Accepted', s.accepted]].map(([k, v]) => h('div', { class: 'at-stat' }, h('b', { text: v }), h('span', { text: k })))),
      form,
      h('div', { class: 'at-actions tw-prof-foot' }, share, h('button', { type: 'button', class: 'btn btn-outline at-sm', id: 'tw-signout', text: 'Sign out', onclick: () => ctx.signOut() })),
      h('p', { class: 'at-hint', text: 'Signed in as ' + ctx.data.user.email + '. Only you see this.' })),
    onClose: () => { if (ctx.draftAvatar) { ctx.draftAvatar = null; ctx.preview(prof.avatar); } },
  };
}

// ---------- more menu
export function menuPanel(ctx) {
  const dark = document.documentElement.dataset.theme === 'dark';
  return {
    title: 'More',
    body: h('div', { class: 'tw-menu' },
      h('a', { class: 'tw-row', href: '/test/app.html#tester' }, h('span', { class: 'tw-row-main' }, h('b', { text: 'Full app' }), h('small', { text: 'The plain 2D pages: tests, payouts, history' }))),
      h('a', { class: 'tw-row', href: '/test/app.html#dev', id: 'tw-dev-link' }, h('span', { class: 'tw-row-main' }, h('b', { text: 'Developer' }), h('small', { text: 'Post an app for testing and manage testers' }))),
      h('button', { type: 'button', class: 'tw-row', onclick: () => { window.toggleTheme(); ctx.open('menu'); } }, h('span', { class: 'tw-row-main' }, h('b', { text: dark ? 'Daylight' : 'Dusk' }), h('small', { text: dark ? 'Switch to the light theme' : 'Switch to the dark theme (evening in town)' }))),
      h('button', { type: 'button', class: 'tw-row', onclick: () => ctx.open('trophies') }, h('span', { class: 'tw-row-main' }, h('b', { text: 'Trophy Hall' }), h('small', { text: 'Your badges' }))),
      h('button', { type: 'button', class: 'tw-row', onclick: () => ctx.open('help') }, h('span', { class: 'tw-row-main' }, h('b', { text: 'How Test Town works' }), h('small', { text: 'Moving around, XP and money' }))),
      h('button', { type: 'button', class: 'tw-row', onclick: () => ctx.signOut() }, h('span', { class: 'tw-row-main' }, h('b', { text: 'Sign out' }), h('small', { text: ctx.data.user.email }))),
      ctx.bridge && ctx.bridge.version() ? h('p', { class: 'at-hint', style: 'text-align:center;margin-top:.4rem', text: 'Amni-Test app ' + ctx.bridge.version() }) : null),
  };
}
export function helpPanel() {
  return {
    title: 'How Test Town works',
    body: h('div', { class: 'at-prose' },
      h('p', { text: 'Drag to move around the island, pinch or scroll to zoom, and twist two fingers (or use the ↺ ↻ buttons, or Q and E) to turn it. Tap a building to open it; tap the ground to walk there.' }),
      h('p', null, h('b', { text: 'Market: ' }), 'each stall is an open test with your price on the banner.'),
      h('p', null, h('b', { text: 'Your Workshop: ' }), 'each test you run is a tower. Every check-in adds a floor; a finished test gets a roof and a pennant. Your house grows with your rank.'),
      h('p', null, h('b', { text: 'Plaza: ' }), 'this week’s top three stand on the podium.'),
      h('p', null, h('b', { text: 'Quest Board, Streak Beacon, Trophy Hall: ' }), 'daily and weekly quests, your visit streak, and your badges.'),
      h('p', { text: 'XP, ranks, badges and cosmetics are just for fun. They never pay money and never go down. Money comes only from finishing tests, at your pay level, which is set by merits and demerits.' })),
  };
}
