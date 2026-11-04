/* Amni-Test: Tester tab. */
(function () {
  'use strict';
  var AT = window.AT, h = AT.h, money = AT.money, DAY = AT.DAY;
  AT.tabs = AT.tabs || {};

  var RUNNING = ['accepted', 'invited', 'active', 'completed_pending', 'exit_pending'];

  function panel(title, id, extra) {
    return h('div', Object.assign({ class: 'at-panel', id: id }, extra || {}), title ? h('h2', null, title) : null);
  }

  // ---------- 18+ ----------
  function adultPanel(ctx) {
    var p = panel('Before your first test', 'at-adult', { class: 'at-panel at-panel--accent' });
    var cb = h('input', { type: 'checkbox', id: 'at-adult-cb' });
    var box = AT.errBox();
    var btn = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Confirm', id: 'at-adult-btn', disabled: true });
    cb.addEventListener('change', function () { btn.disabled = !cb.checked; });
    btn.addEventListener('click', function () {
      AT.run(btn, box, async function () { await AT.api('/api/me/adult', {}); await ctx.refresh(); });
    });
    p.append(
      h('p', { text: 'Testers must be 18 or older. Stripe checks your identity before your first payout.' }),
      h('label', { class: 'at-check', style: 'margin:.8rem 0' }, cb, h('span', null, 'I am 18 or older, and I agree to the ', h('a', { href: 'terms.html', text: 'Amni-Test terms' }), '.')),
      h('div', { class: 'at-actions' }, btn), box);
    return p;
  }

  // ---------- standing ----------
  function standingPanel(ctx) {
    var t = ctx.me.tester, cfg = ctx.cfg;
    var p = panel(null, 'at-standing');
    p.append(h('h2', null, 'Your standing', h('small', { text: 'Level ' + t.level })));
    p.append(h('div', { class: 'at-big' }, money(t.priceCents), h('small', { text: 'per finished test' })));
    p.append(h('div', { class: 'at-stats', style: 'margin-top:.8rem' },
      h('div', { class: 'at-stat' }, h('b', { text: t.merits }), h('span', { text: 'Merits' })),
      h('div', { class: 'at-stat' }, h('b', { text: t.demerits }), h('span', { text: 'Demerits' })),
      h('div', { class: 'at-stat' }, h('b', { text: t.standing }), h('span', { text: 'Standing' }))));
    if (t.nextLevelAt != null) {
      var cur = cfg.levels[t.level - 1];
      var from = cur && cur.min != null ? cur.min : 0;
      var pct = Math.max(0, Math.min(100, ((t.standing - from) / (t.nextLevelAt - from)) * 100));
      var need = t.nextLevelAt - t.standing;
      p.append(h('div', { class: 'at-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(pct), 'aria-label': 'Progress to the next level' }, h('i', { style: 'width:' + pct + '%' })),
        h('p', { class: 'at-hint', text: need + ' more to reach level ' + (t.level + 1) + ' (' + money(AT.priceFor(cfg, t.level + 1)) + ' per test).' }));
    } else {
      p.append(h('p', { class: 'at-hint', text: 'You are at the top level.' }));
    }
    var rows = cfg.levels.map(function (l, i) {
      return h('tr', { class: l.level === t.level ? 'at-cur' : null }, h('td', { text: 'Level ' + l.level }), h('td', { text: AT.levelRange(cfg, i) }), h('td', { class: 'num', text: money(l.priceCents) }));
    });
    p.append(h('details', { class: 'at-more', 'data-keep': 'levels-open' }, h('summary', { text: 'Levels and how standing moves' }),
      h('div', null,
        h('div', { class: 'tw' }, h('table', { class: 'spec-table', style: 'margin:0 0 .8rem' },
          h('thead', null, h('tr', null, h('th', { text: 'Level' }), h('th', { text: 'Standing' }), h('th', { class: 'num', text: 'Pay' }))), h('tbody', null, rows))),
        h('ul', { class: 'at-ledger' },
          [['Finish a 14-day test', '+3'], ['Feedback marked helpful (up to 3 per test)', '+1'], ['Miss a check-in window', '−1'], ['Added but never started (no-show)', '−2'], ['Leave for a reason that isn’t the app’s fault', '−5']].map(function (r) {
            return h('li', null, h('span', { text: r[0] }), h('span', { class: 'd ' + (r[1][0] === '+' ? 'at-plus' : 'at-minus'), text: r[1] }));
          })),
        h('p', { class: 'at-hint', style: 'margin-top:.6rem', text: 'A standing of −10 or lower bans the account. You can appeal once. You can run ' + t.maxActive + ' tests at a time.' }))));
    return p;
  }

  // ---------- payouts ----------
  function payoutPanel(ctx) {
    var me = ctx.me, u = me.user, min = ctx.cfg.payoutMinCents;
    var p = panel('Payouts', 'at-payouts');
    p.append(h('div', { class: 'at-big', id: 'at-balance' }, money(me.balanceCents), h('small', { text: 'balance' })));
    var box = AT.errBox();
    var acts = h('div', { class: 'at-actions', style: 'margin-top:.8rem' });
    var f = ctx.flags.onboard;
    if (f === 'done') p.append(h('p', { class: 'at-ok', text: 'Stripe setup finished. It can take a minute for Stripe to turn on payouts. Refresh this page if the button below doesn’t change.' }));
    if (f === 'retry') p.append(h('p', { class: 'at-err', text: 'That Stripe link expired. Press the button to get a new one.' }));
    if (u.status !== 'active') {
      p.append(h('p', { text: 'Payouts are paused while your account is not active.' }));
    } else if (!u.stripeLinked || !u.payoutsEnabled) {
      p.append(h('p', { text: 'Payments go through Stripe. Stripe asks for your identity and tax details once, then sends money to your bank.' }));
      var ob = h('button', { type: 'button', class: 'btn btn-primary at-sm', id: 'at-onboard', text: u.stripeLinked ? 'Finish Stripe setup' : 'Set up payouts' });
      ob.addEventListener('click', function () {
        AT.run(ob, box, async function () { var r = await AT.api('/api/payouts/onboard', {}); if (r.url) location.href = r.url; });
      });
      acts.append(ob);
    } else if (me.balanceCents >= min) {
      var cash = h('button', { type: 'button', class: 'btn btn-primary at-sm', id: 'at-cashout', text: 'Cash out ' + money(me.balanceCents) });
      cash.addEventListener('click', function () {
        AT.run(cash, box, async function () {
          var r = await AT.api('/api/payouts/request', {});
          await ctx.refresh();
          var b = document.getElementById('at-payouts');
          if (b) b.appendChild(h('p', { class: 'at-ok', text: money(r.payout.amountCents) + ' is on its way to your Stripe account.' }));
        });
      });
      acts.append(cash);
    } else {
      p.append(h('p', { text: 'You can cash out once your balance reaches ' + money(min) + '.' }));
    }
    p.append(acts, box);
    return p;
  }

  // ---------- activity ----------
  function eventRow(e) {
    var d = h('span', { class: 'd' });
    var pts = (e.merits || 0) - (e.demerits || 0);
    if (e.merits || e.demerits) d.append(h('span', { class: pts >= 0 ? 'at-plus' : 'at-minus', text: (pts >= 0 ? '+' : '−') + Math.abs(pts) }));
    if (e.cents) d.append(h('span', { class: e.cents > 0 ? 'at-plus' : '', text: (e.cents > 0 ? '+' : '') + money(e.cents) }));
    var role = e.role === 'dev' ? 'Developer' : e.role === 'account' ? 'Account' : 'Tester';
    return h('li', null, h('span', { text: e.note || e.kind.replace(/_/g, ' ') }), d, h('small', { text: role + ' · ' + AT.ago(e.created_at) }));
  }
  function activityPanel(ctx) {
    var ev = ctx.me.events || [];
    var p = panel('Recent activity', 'at-activity');
    if (!ev.length) { p.append(h('p', { class: 'at-empty', text: 'Nothing yet. Every change to your standing or balance shows up here, with the reason.' })); return p; }
    p.append(h('ul', { class: 'at-ledger' }, ev.slice(0, 6).map(eventRow)));
    if (ev.length > 6) p.append(h('details', { class: 'at-more', 'data-keep': 'ledger-more' }, h('summary', { text: 'Show ' + (ev.length - 6) + ' more' }), h('div', null, h('ul', { class: 'at-ledger' }, ev.slice(6).map(eventRow)))));
    return p;
  }

  // ---------- open tests ----------
  function openTests(ctx, tests, running) {
    var me = ctx.me, u = me.user;
    var p = panel(null, 'at-open-tests');
    p.append(h('h2', null, 'Open tests', h('small', { text: tests.length ? tests.length + ' open' : '' })));
    var blocked = u.status !== 'active' ? 'Your account isn’t active, so you can’t take new tests.'
      : !u.adult ? 'Confirm you are 18 or older (above) to take a test.'
        : running >= me.tester.maxActive ? 'You’re running ' + running + ' tests, the most at once. Finish one to take another.' : '';
    if (blocked) p.append(h('p', { class: 'at-hint', style: 'margin-bottom:.8rem', text: blocked }));
    if (!tests.length) { p.append(h('p', { class: 'at-empty', text: 'No open tests right now. New ones appear here when developers post them.' })); return p; }
    var list = h('div', { class: 'at-list' });
    tests.forEach(function (t) {
      var d = t.developer;
      var devLine = d.finished ? d.completed + ' of ' + d.finished + ' testers finished their tests' : 'New developer, no finished tests yet';
      var box = AT.errBox();
      var btn = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Accept for ' + money(t.yourPriceCents), disabled: !!blocked, 'data-accept': t.id });
      btn.addEventListener('click', function () {
        AT.run(btn, box, async function () { await AT.api('/api/tests/' + t.id + '/accept', {}); await ctx.refresh(); });
      });
      list.append(h('article', { class: 'at-item', 'data-test': t.id },
        h('div', { class: 'at-item-head' }, h('div', null, h('h3', { text: t.appName }), h('span', { class: 'at-pkg', text: t.package })), h('span', { class: 'at-pill at-pill--go', text: money(t.yourPriceCents) })),
        t.description ? h('p', { class: 'at-quote', style: 'border:0;padding:0;margin:.2rem 0 .4rem', text: t.description }) : null,
        h('ul', { class: 'at-meta' },
          h('li', null, h('b', { text: t.slotsLeft }), t.slotsLeft === 1 ? ' slot left' : ' slots left'),
          h('li', null, 'Developer standing ', h('b', { text: (d.standing > 0 ? '+' : '') + d.standing })),
          h('li', { text: devLine }),
          h('li', { text: t.verification === 'sdk' ? 'Install checked by the Amni-Test SDK' : 'Developer confirms by hand' })),
        h('div', { class: 'at-actions', style: 'margin-top:.8rem' }, btn), box));
    });
    p.append(list);
    return p;
  }

  // ---------- my tests ----------
  function checkinTrack(a, cfg) {
    return h('div', { class: 'at-track', 'aria-label': 'Check-ins' }, cfg.checkins.map(function (w) {
      var cls = a.filedDays.indexOf(w.day) >= 0 ? 'done' : a.openCheckin === w.day ? 'open' : (a.day != null && a.day > w.to) ? 'missed' : '';
      var word = cls === 'done' ? 'sent' : cls === 'open' ? 'open now' : cls === 'missed' ? 'missed' : 'days ' + (w.from + 1) + '–' + (w.to + 1);
      return h('span', { class: cls }, 'Day ' + w.day + ' · ' + word);
    }));
  }

  function checkinForm(ctx, a) {
    var key = 'ck-' + a.id + '-' + a.openCheckin;
    var worked = h('textarea', { name: 'worked', 'data-keep': key + '-w', maxlength: 4000, placeholder: 'What did you try? What worked well?' });
    var broke = h('textarea', { name: 'broke', 'data-keep': key + '-b', maxlength: 4000, placeholder: 'Anything that crashed, looked wrong or confused you. Steps help.' });
    var device = h('input', { name: 'device', 'data-keep': key + '-d', maxlength: 200, placeholder: 'e.g. Pixel 7, Android 14', autocomplete: 'off' });
    var box = AT.errBox();
    var btn = h('button', { type: 'submit', class: 'btn btn-primary at-sm', text: 'Send day-' + a.openCheckin + ' check-in' });
    var form = h('form', {
      class: 'at-form at-sub', 'data-checkin': a.id,
      onsubmit: function (ev) {
        ev.preventDefault();
        AT.run(btn, box, async function () {
          await AT.api('/api/assignments/' + a.id + '/checkin', { worked: worked.value, broke: broke.value, device: device.value });
          form.reset();
          await ctx.refresh();
        });
      },
    },
    h('h3', { class: 'at-h', style: 'margin:0', text: 'Day ' + a.openCheckin + ' check-in is open' }),
    h('p', { class: 'at-hint', text: 'Write a couple of sentences or more. Only the developer sees this. It is not a Play Store review.' }),
    h('label', { class: 'at-field' }, h('span', { text: 'What worked' }), worked),
    h('label', { class: 'at-field' }, h('span', { text: 'What broke or felt wrong' }), broke),
    h('label', { class: 'at-field' }, h('span', { text: 'Your device' }), device),
    h('div', { class: 'at-actions' }, btn), box);
    return form;
  }

  function leaveForm(ctx, a) {
    var cfg = ctx.cfg;
    var sel = h('select', { name: 'reason', 'data-keep': 'exit-' + a.id + '-r' },
      h('option', { value: '', text: 'Pick a reason' }),
      h('optgroup', { label: 'The app’s fault (no demerit)' }, cfg.excusedReasons.map(function (r) { return h('option', { value: r, text: AT.EXIT_LABELS[r] || r }); })),
      h('optgroup', { label: 'Other reasons (−5 demerits, no pay)' }, cfg.unexcusedReasons.map(function (r) { return h('option', { value: r, text: AT.EXIT_LABELS[r] || r }); })));
    var note = h('textarea', { name: 'note', 'data-keep': 'exit-' + a.id + '-n', maxlength: 2000, placeholder: 'What went wrong? The developer reads this.' });
    var noteField = h('label', { class: 'at-field' }, h('span', { text: 'What happened' }), note);
    var info = h('p', { class: 'at-hint' });
    var box = AT.errBox();
    function excused() { return cfg.excusedReasons.indexOf(sel.value) >= 0; }
    var btn = AT.confirmBtn('Leave test', function () {
      return excused() ? 'Confirm: leave the test' : 'Confirm: leave and take −5';
    }, box, async function () {
      if (!sel.value) throw new Error('Pick a reason first.');
      var r = await AT.api('/api/assignments/' + a.id + '/exit', { reason: sel.value, note: note.value });
      await ctx.refresh();
      return r;
    });
    function update() {
      btn.reset();
      if (!sel.value) { info.textContent = 'Pick a reason to see what happens next.'; noteField.hidden = false; return; }
      if (excused()) {
        info.textContent = 'This counts as the app’s fault. Say what went wrong. The developer has 72 hours to dispute it. If they don’t, or an admin agrees with you, you get paid for the days you tested and no demerit.';
      } else {
        info.textContent = 'Leaving for this reason costs you 5 demerits, and you won’t be paid for this test.';
      }
    }
    sel.addEventListener('change', update);
    update();
    return h('details', { class: 'at-more', 'data-keep': 'exit-' + a.id + '-open' }, h('summary', { text: 'Leave this test' }),
      h('div', { class: 'at-form' }, h('label', { class: 'at-field' }, h('span', { text: 'Why are you leaving?' }), sel), info, noteField, h('div', { class: 'at-actions' }, btn), box));
  }

  // Before starting, leaving just frees the slot.
  function leaveEarly(ctx, a) {
    var box = AT.errBox();
    var btn = AT.confirmBtn('Give up this slot', 'Confirm: give up the slot', box, async function () {
      await AT.api('/api/assignments/' + a.id + '/exit', { reason: 'no_time', note: '' });
      await ctx.refresh();
    }, 'btn-outline');
    return h('details', { class: 'at-more', 'data-keep': 'early-' + a.id }, h('summary', { text: 'Can’t do it after all?' }),
      h('div', null, h('p', { class: 'at-hint', style: 'margin-bottom:.6rem', text: 'You haven’t started, so giving up the slot now costs nothing.' }), h('div', { class: 'at-actions' }, btn), box));
  }

  function reportForm(ctx, a, kind, label) {
    var cats = ctx.cfg.reportCategories;
    var sel = h('select', { name: 'category', 'data-keep': 'rep-' + a.id + '-c' }, h('option', { value: '', text: 'Pick a category' }), cats.map(function (c) { return h('option', { value: c, text: AT.REPORT_LABELS[c] || c }); }));
    var note = h('textarea', { name: 'note', 'data-keep': 'rep-' + a.id + '-n', maxlength: 2000, placeholder: 'What happened? Include anything an admin should check.' });
    var box = AT.errBox(), ok = h('p', { class: 'at-ok', role: 'status' });
    var btn = h('button', { type: 'submit', class: 'btn btn-outline at-sm', text: 'Send report' });
    var form = h('form', {
      class: 'at-form',
      onsubmit: function (ev) {
        ev.preventDefault();
        AT.run(btn, box, async function () {
          await AT.api('/api/reports', { kind: kind, assignmentId: a.id, category: sel.value, note: note.value });
          form.reset();
          ok.textContent = 'Report sent. An admin will review it.';
        });
      },
    }, h('p', { class: 'at-hint', text: kind === 'campaign' ? 'Reports go to an admin. While one is open, the developer can’t post new tests. False reports can count against you.' : 'Reports go to an admin. While one is open, the tester can’t take new tests or cash out.' }),
    h('label', { class: 'at-field' }, h('span', { text: 'Category' }), sel), h('label', { class: 'at-field' }, h('span', { text: 'What happened' }), note), h('div', { class: 'at-actions' }, btn), box, ok);
    return h('details', { class: 'at-more', 'data-keep': 'rep-' + a.id + '-open' }, h('summary', { text: label }), h('div', null, form));
  }
  AT.reportForm = reportForm;

  function deadlineLine(prefix, ms) {
    return h('p', null, prefix + ' ', h('b', { text: AT.dateTime(ms) }), ' (' + AT.left(ms) + ').');
  }

  function assignmentCard(ctx, a) {
    var c = a.campaign, me = ctx.me;
    var card = h('article', { class: 'at-item', 'data-assignment': a.id, 'data-status': a.status });
    card.append(h('div', { class: 'at-item-head' },
      h('div', null, h('h3', { text: c.appName }), h('span', { class: 'at-pkg', text: c.package })),
      h('div', { class: 'at-actions' }, h('span', { class: 'at-pill', text: money(a.priceCents) }), AT.pill(a.status))));
    var instr = c.instructions ? h('details', { class: 'at-more', 'data-keep': 'instr-' + a.id }, h('summary', { text: 'What the developer wants you to test' }), h('div', null, h('p', { class: 'at-quote', text: c.instructions }))) : null;

    switch (a.status) {
      case 'accepted':
        card.append(h('p', { text: 'Waiting for the developer to add your Google account (' + me.user.email + ') to their closed test.' }),
          a.deadline ? deadlineLine('If they don’t add you by', a.deadline) : null,
          h('p', { class: 'at-hint', text: 'If they run out of time, the slot is released with no penalty to you.' }), instr, leaveEarly(ctx, a));
        break;
      case 'invited': {
        var box = AT.errBox();
        var go = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'I’ve joined and installed', 'data-start': a.id });
        go.addEventListener('click', function () { AT.run(go, box, async function () { await AT.api('/api/assignments/' + a.id + '/start', {}); await ctx.refresh(); }); });
        card.append(h('p', { text: 'You’ve been added. Do these three steps on your Android phone.' }),
          a.deadline ? deadlineLine('Start by', a.deadline) : null,
          h('ol', { class: 'at-steps' },
            h('li', null, h('b', { text: 'Join the test' }),
              h('p', { text: 'Open Google’s tester page, pick the Google account ' + me.user.email + ' and tap “Become a tester”.' }),
              h('a', { class: 'btn btn-outline at-sm', href: a.links.optIn, target: '_blank', rel: 'noopener', text: 'Open the tester page' })),
            h('li', null, h('b', { text: 'Install from Google Play' }),
              h('p', { text: 'Install with this link. It carries your code, so the install is matched to you.' }),
              h('a', { class: 'btn btn-outline at-sm', href: a.links.install, target: '_blank', rel: 'noopener', text: 'Install from Google Play' }),
              h('p', { style: 'margin-top:.7rem!important' }, 'Your code: ', h('span', { class: 'at-code', text: a.claimCode })),
              c.verification === 'sdk' ? h('p', { class: 'at-hint', text: 'If the app asks for a code when you open it, type this one.' }) : null),
            h('li', null, h('b', { text: 'Tell us you’ve started' }),
              h('p', { text: 'Your 14 days start when you press this' + (c.verification === 'sdk' ? ', or when the app reports your code, whichever is first.' : '.') }),
              h('div', { class: 'at-actions' }, go), box)),
          h('p', { class: 'at-hint', style: 'margin-top:.7rem', text: 'If you don’t start in time, it counts as a no-show (−2 demerits).' }),
          instr, leaveEarly(ctx, a), reportForm(ctx, a, 'campaign', 'Report this app'));
        break;
      }
      case 'active': {
        var shown = a.day == null ? 1 : Math.min(a.day + 1, 14);
        var pct = Math.round((shown / 14) * 100);
        card.append(h('p', null, h('b', { style: 'color:var(--text)', text: a.day != null && a.day >= 14 ? 'Past day 14' : 'Day ' + shown + ' of 14' }),
          a.startedAt ? ' · started ' + AT.date(a.startedAt) : ''),
        h('div', { class: 'at-bar', role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': 14, 'aria-valuenow': shown, 'aria-label': 'Days tested' }, h('i', { style: 'width:' + pct + '%' })),
        checkinTrack(a, ctx.cfg));
        if (a.openCheckin) card.append(checkinForm(ctx, a));
        else if (a.nextCheckin && a.startedAt) {
          var opens = a.startedAt + a.nextCheckin.opensDay * DAY;
          card.append(h('p', null, 'Next: the day-' + a.nextCheckin.day + ' check-in opens ', h('b', { text: AT.until(opens) }), ' (' + AT.dateTime(opens) + ').'),
            h('p', { class: 'at-hint', text: 'Keep the app installed and use it now and then. Each check-in takes a few minutes.' }));
        } else card.append(h('p', { class: 'at-hint', text: 'No more check-ins are open for this test.' }));
        if (a.missedCheckins) card.append(h('p', { class: 'at-hint at-minus', text: 'Missed check-ins: ' + a.missedCheckins + '. Each one costs a third of the pay.' }));
        card.append(instr, leaveForm(ctx, a), reportForm(ctx, a, 'campaign', 'Report this app'));
        break;
      }
      case 'completed_pending': {
        var pay = Math.round(a.priceCents * Math.min(a.filedDays.length, 3) / 3);
        card.append(h('p', { text: 'You filed the day-14 check-in. Nice work.' }),
          a.deadline ? deadlineLine('The developer can confirm or dispute until', a.deadline) : null,
          h('p', { text: 'If they do nothing, it’s confirmed automatically and ' + money(pay) + ' goes to your balance.' }),
          a.disputeNote ? h('div', null, h('p', { text: 'The developer disputed this. An admin will decide. Their note:' }), h('p', { class: 'at-quote', text: a.disputeNote })) : null,
          reportForm(ctx, a, 'campaign', 'Report this app'));
        break;
      }
      case 'exit_pending':
        card.append(h('p', { text: 'You left: ' + (AT.EXIT_LABELS[a.exitReason] || a.exitReason || 'no reason') + '.' }),
          a.deadline ? deadlineLine('The developer can dispute until', a.deadline) : null,
          h('p', { text: 'If they don’t, the exit is excused: you’re paid for the days you tested and get no demerit.' }),
          a.disputeNote ? h('div', null, h('p', { text: 'The developer disputed your reason. An admin will decide. Their note:' }), h('p', { class: 'at-quote', text: a.disputeNote })) : null,
          reportForm(ctx, a, 'campaign', 'Report this app'));
        break;
      case 'completed':
        card.append(h('p', null, 'Finished. You earned ', h('b', { text: money(a.paidCents) }), ' and 3 merits.'));
        break;
      case 'excused':
        card.append(h('p', null, 'Your exit was excused. You earned ', h('b', { text: money(a.paidCents) }), ' for the days you tested, with no demerit.'));
        break;
      case 'exited':
        card.append(h('p', { text: a.exitReason ? 'You left this test (' + (AT.EXIT_LABELS[a.exitReason] || a.exitReason) + '). It cost 5 demerits and paid nothing.' : 'This test ended without pay: no check-ins were filed, or a dispute was decided against you. It cost 5 demerits.' }));
        break;
      case 'no_show':
        card.append(h('p', { text: 'You didn’t start within 72 hours of being added. That cost 2 demerits.' }));
        break;
      case 'expired':
        card.append(h('p', { text: 'The slot was released before the test started. No demerits.' }));
        break;
      case 'removed':
        card.append(h('p', null, 'You were removed from this test when your account was closed. Paid ', h('b', { text: money(a.paidCents) }), '.'));
        break;
      default:
        card.append(h('p', { text: 'Status: ' + a.status }));
    }
    return card;
  }

  function myTests(ctx, list) {
    var p = panel(null, 'at-my-tests');
    var running = list.filter(function (a) { return RUNNING.indexOf(a.status) >= 0; });
    var done = list.filter(function (a) { return RUNNING.indexOf(a.status) < 0; });
    p.append(h('h2', null, 'My tests', h('small', { text: running.length + ' of ' + ctx.me.tester.maxActive + ' running' })));
    if (!list.length) p.append(h('p', { class: 'at-empty', text: 'You haven’t taken a test yet. Pick one from the open tests below.' }));
    if (running.length) p.append(h('div', { class: 'at-list' }, running.map(function (a) { return assignmentCard(ctx, a); })));
    else if (list.length) p.append(h('p', { class: 'at-empty', text: 'No tests running. Pick one from the open tests below.' }));
    if (done.length) p.append(h('details', { class: 'at-more', 'data-keep': 'done-tests' }, h('summary', { text: 'Finished tests (' + done.length + ')' }), h('div', { class: 'at-list' }, done.map(function (a) { return assignmentCard(ctx, a); }))));
    return { el: p, running: running.length };
  }

  AT.tabs.tester = {
    render: async function (view, ctx) {
      var r = await Promise.all([AT.api('/api/tests'), AT.api('/api/assignments')]);
      var tests = r[0].tests || [], asg = r[1].assignments || [];
      var main = h('div', { class: 'at-stack' });
      var side = h('div', { class: 'at-stack' });
      if (!ctx.me.user.adult) main.append(adultPanel(ctx));
      var mt = myTests(ctx, asg);
      main.append(mt.el, openTests(ctx, tests, mt.running));
      side.append(standingPanel(ctx), payoutPanel(ctx), activityPanel(ctx));
      view.append(h('div', { class: 'at-cols' }, main, side));
    },
  };
})();
