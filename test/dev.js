/* Amni-Test: Developer tab (#dev, #dev/<campaignId>). */
(function () {
  'use strict';
  var AT = window.AT, h = AT.h, money = AT.money;
  AT.tabs = AT.tabs || {};

  var PKG = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
  var SDK_URL = 'https://github.com/Amnibro/amni-scient/tree/main/sdk/amni-test-android';
  var HOLDING = ['accepted', 'invited', 'active', 'completed_pending', 'exit_pending', 'completed'];

  function panel(title, id, cls) { return h('div', { class: 'at-panel' + (cls ? ' ' + cls : ''), id: id }, title ? h('h2', null, title) : null); }
  function n(counts, s) { return (counts && counts[s]) || 0; }

  // ---------- summary ----------
  function summaryPanel(ctx) {
    var me = ctx.me;
    var p = panel('Your developer account', 'at-dev-summary');
    p.append(h('div', { class: 'at-stats' },
      h('div', { class: 'at-stat' }, h('b', { id: 'at-credit', text: money(me.creditCents) }), h('span', { text: 'Credit' })),
      h('div', { class: 'at-stat' }, h('b', { text: (me.dev.standing > 0 ? '+' : '') + me.dev.standing }), h('span', { text: 'Dev standing' }))),
    h('p', { class: 'at-hint', text: 'Credit comes from unused budget when a test closes. It’s applied to your next test automatically. To get it back on your card instead, ask through the contact page.' }),
    h('p', { class: 'at-hint', text: 'Testers see your standing before they accept. You gain 1 when a tester finishes, and lose some when testers leave because of the app, when you lose a dispute, or when a report against you is upheld.' }));
    return p;
  }

  // ---------- create ----------
  function createPanel(ctx, open) {
    var cfg = ctx.cfg, me = ctx.me;
    var f = {
      appName: h('input', { name: 'appName', required: true, maxlength: 80, 'data-keep': 'c-name', autocomplete: 'off' }),
      pkg: h('input', { name: 'package', required: true, maxlength: 150, 'data-keep': 'c-pkg', placeholder: 'com.example.app', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off' }),
      description: h('textarea', { name: 'description', maxlength: 2000, 'data-keep': 'c-desc', placeholder: 'What the app does. Testers read this before they accept.' }),
      instructions: h('textarea', { name: 'instructions', maxlength: 4000, 'data-keep': 'c-instr', placeholder: 'What to try, test logins, anything testers need to know.' }),
      slots: h('input', { name: 'slots', type: 'number', min: 1, max: 100, step: 1, value: '12', required: true, 'data-keep': 'c-slots', inputmode: 'numeric' }),
      maxLevel: h('select', { name: 'maxLevel', 'data-keep': 'c-level' }, cfg.levels.map(function (l) {
        return h('option', { value: String(l.level), selected: l.level === 1, text: 'Up to level ' + l.level + ' — ' + money(l.priceCents) + ' per tester' });
      })),
    };
    f.slots.defaultValue = '12';
    var verManual = h('input', { type: 'radio', name: 'verification', value: 'manual', checked: true, 'data-keep': 'c-v-m' });
    verManual.defaultChecked = true;
    var verSdk = h('input', { type: 'radio', name: 'verification', value: 'sdk', 'data-keep': 'c-v-s' });
    var pkgErr = h('small', { class: 'at-err', style: 'margin:0' });
    var cost = h('div', { class: 'at-cost', id: 'at-cost', 'aria-live': 'polite' });
    var box = AT.errBox();
    var btn = h('button', { type: 'submit', class: 'btn btn-primary', text: 'Create test' });

    function slots() { var v = parseInt(f.slots.value, 10); return Number.isFinite(v) ? v : 0; }
    function update() {
      var s = slots(), lvl = parseInt(f.maxLevel.value, 10) || 1;
      var c = AT.cost(cfg, Math.max(s, 0), lvl, me.creditCents);
      AT.clear(cost).append(
        h('div', null, h('span', { text: s + ' tester' + (s === 1 ? '' : 's') + ' × ' + money(c.price) }), h('span', { text: money(c.budget) })),
        h('div', null, h('span', { text: 'Fee: ' + s + ' × ' + money(c.feeEach) }), h('span', { text: money(c.fee) })),
        c.credit ? h('div', null, h('span', { text: 'Your credit' }), h('span', { text: '−' + money(c.credit) })) : null,
        h('div', { class: 'at-total' }, h('span', { text: 'You pay' }), h('span', { id: 'at-cost-due', text: money(c.due) })));
    }
    function checkPkg() {
      var v = f.pkg.value.trim();
      var bad = v && !PKG.test(v);
      f.pkg.setAttribute('aria-invalid', bad ? 'true' : 'false');
      pkgErr.textContent = bad ? 'That doesn’t look like a package name. Use the applicationId from your build.gradle, like com.example.app.' : '';
      return !bad;
    }
    f.slots.addEventListener('input', update);
    f.maxLevel.addEventListener('change', update);
    f.pkg.addEventListener('input', checkPkg);
    update();

    var form = h('form', {
      class: 'at-form', id: 'at-create', novalidate: true,
      onsubmit: function (ev) {
        ev.preventDefault();
        AT.run(btn, box, async function () {
          if (f.appName.value.trim().length < 2) throw new Error('Name the app.');
          if (!f.pkg.value.trim() || !checkPkg()) { f.pkg.focus(); throw new Error('Check the package name.'); }
          var s = slots();
          if (s < 1 || s > 100) throw new Error('Number of testers must be 1 to 100.');
          var r = await AT.api('/api/campaigns', {
            appName: f.appName.value.trim(), package: f.pkg.value.trim(), description: f.description.value, instructions: f.instructions.value,
            slots: s, maxLevel: parseInt(f.maxLevel.value, 10), verification: verSdk.checked ? 'sdk' : 'manual',
          });
          form.reset();
          ctx.go('#dev/' + r.campaign.id);
        });
      },
    },
    h('div', { class: 'at-row' },
      h('label', { class: 'at-field' }, h('span', { text: 'App name' }), f.appName),
      h('label', { class: 'at-field' }, h('span', { text: 'Package name' }), f.pkg, pkgErr)),
    h('label', { class: 'at-field' }, h('span', { text: 'Description' }), f.description),
    h('label', { class: 'at-field' }, h('span', { text: 'Instructions for testers' }), f.instructions, h('small', { text: 'Testers see these after they accept. Never ask for Play Store ratings or reviews.' })),
    h('div', { class: 'at-row' },
      h('label', { class: 'at-field' }, h('span', { text: 'Number of testers' }), f.slots,
        h('small', { text: 'Google asks new personal developer accounts for at least 12 testers opted in for 14 days in a row. A couple of extra slots cover anyone who drops out.' })),
      h('label', { class: 'at-field' }, h('span', { text: 'Highest tester level' }), f.maxLevel,
        h('small', { text: 'Higher levels have a better track record. Testers below your maximum cost less, and the difference comes back as credit.' }))),
    h('div', { class: 'at-field' }, h('span', { class: 'at-legend', text: 'How installs are checked' }),
      h('div', { class: 'at-radios' },
        h('label', { class: 'at-radio' }, verManual, h('div', null, h('b', { text: 'By hand' }), h('span', { text: 'You confirm each tester at the end. If you do nothing for 72 hours, it’s confirmed automatically.' }))),
        h('label', { class: 'at-radio' }, verSdk, h('div', null, h('b', { text: 'Amni-Test SDK' }), h('span', { text: 'Add a small Android library. It confirms the install and daily opens, and approves completions on its own.' }))))),
    cost,
    h('div', { class: 'at-actions' }, btn, h('span', { class: 'at-hint', text: 'You pay on the next screen.' })), box);

    return h('div', { class: 'at-panel', id: 'at-create-panel' },
      h('details', { class: 'at-more', style: 'margin:0', open: open, 'data-keep': 'create-open' },
        h('summary', { class: 'at-h', style: 'margin:0', text: 'Post an app for testing' }),
        h('div', null, form)));
  }

  // ---------- list ----------
  function countLine(c) {
    var k = c.counts || {};
    var bits = [];
    if (n(k, 'accepted')) bits.push(n(k, 'accepted') + ' to add');
    if (n(k, 'invited')) bits.push(n(k, 'invited') + ' added');
    if (n(k, 'active')) bits.push(n(k, 'active') + ' testing');
    var pend = n(k, 'completed_pending') + n(k, 'exit_pending');
    if (pend) bits.push(pend + ' need you');
    if (n(k, 'completed')) bits.push(n(k, 'completed') + ' completed');
    return bits.length ? bits.join(' · ') : 'No testers yet';
  }
  function listPanel(ctx, list) {
    var p = panel(null, 'at-campaigns');
    p.append(h('h2', null, 'Your tests', h('small', { text: list.length ? list.length + ' total' : '' })));
    if (!list.length) { p.append(h('p', { class: 'at-empty', text: 'Nothing posted yet. Fill in the form above to post your first app.' })); return p; }
    p.append(h('div', { class: 'at-list' }, list.map(function (c) {
      return h('article', { class: 'at-item', 'data-campaign': c.id },
        h('div', { class: 'at-item-head' },
          h('div', null, h('h3', null, h('a', { href: '#dev/' + c.id, text: c.appName })), h('span', { class: 'at-pkg', text: c.package })),
          AT.pill(c.status)),
        h('ul', { class: 'at-meta' },
          h('li', null, h('b', { text: c.slots }), ' slots, up to level ' + c.maxLevel),
          h('li', { text: countLine(c) }),
          c.status === 'draft' ? h('li', null, 'Due ', h('b', { text: money(c.dueCents) })) : null),
        h('div', { class: 'at-actions', style: 'margin-top:.7rem' }, h('a', { class: 'btn btn-outline at-sm', href: '#dev/' + c.id, text: c.status === 'draft' ? 'Pay and open' : 'Manage' })));
    })));
    return p;
  }

  // ---------- detail ----------
  function payPanel(ctx, c) {
    var p = panel('Pay to open this test', 'at-pay', 'at-panel--accent');
    var box = AT.errBox();
    var btn = h('button', { type: 'button', class: 'btn btn-primary', id: 'at-pay-btn', text: c.dueCents ? 'Pay ' + money(c.dueCents) + ' with Stripe' : 'Open using your credit' });
    btn.addEventListener('click', function () {
      AT.run(btn, box, async function () {
        var r = await AT.api('/api/campaigns/' + c.id + '/checkout', {});
        if (r.url) { location.href = r.url; return; }
        await ctx.refresh();
      });
    });
    var cancel = AT.confirmBtn('Delete draft', 'Confirm: delete this draft', box, async function () {
      await AT.api('/api/campaigns/' + c.id + '/close', {});
      ctx.go('#dev');
    }, 'btn-outline');
    p.append(h('div', { class: 'at-cost' },
      h('div', null, h('span', { text: c.slots + ' testers × ' + money(c.maxPriceCents) }), h('span', { text: money(c.budgetCents) })),
      h('div', null, h('span', { text: 'Fee' }), h('span', { text: money(c.feeCents) })),
      c.creditApplied ? h('div', null, h('span', { text: 'Your credit' }), h('span', { text: '−' + money(c.creditApplied) })) : null,
      h('div', { class: 'at-total' }, h('span', { text: 'You pay' }), h('span', { text: money(c.dueCents) }))),
    h('p', { class: 'at-hint', style: 'margin:.7rem 0', text: 'One payment through Stripe Checkout. The test opens to testers as soon as it’s paid.' }),
    h('div', { class: 'at-actions' }, btn, cancel), box);
    return p;
  }

  function invitePanel(ctx, c) {
    var p = panel('Add testers in Play Console', 'at-invite');
    var waiting = c.assignments.filter(function (a) { return a.status === 'accepted'; });
    var emails = c.emails || [];
    var box = AT.errBox(), ok = h('p', { class: 'at-ok', role: 'status' });
    p.append(h('p', { text: 'In Play Console, open your app, then Testing → Closed testing → your track → Testers. Add an email list and paste these addresses, or upload the CSV. Then come back and press the button below.' }));
    if (!emails.length) {
      p.append(h('p', { class: 'at-empty', text: 'No testers yet. Emails appear here as testers accept.' }));
      return p;
    }
    var ta = h('textarea', { class: 'at-emails', readOnly: true, id: 'at-emails', rows: Math.min(8, Math.max(3, emails.length)), 'aria-label': 'Tester emails' });
    ta.value = emails.join('\n');
    var copy = h('button', { type: 'button', class: 'btn btn-outline at-sm', id: 'at-copy-emails', text: 'Copy all' });
    copy.addEventListener('click', function () { AT.copy(emails.join(', '), copy); });
    var csv = h('button', { type: 'button', class: 'btn btn-outline at-sm', id: 'at-csv', text: 'Download CSV' });
    csv.addEventListener('click', function () { AT.download('amni-test-' + c.package + '-testers.csv', emails.join('\n') + '\n', 'text/csv'); });
    var mark = h('button', { type: 'button', class: 'btn btn-primary at-sm', id: 'at-mark-invited', text: 'I’ve added them in Play Console', disabled: !waiting.length });
    mark.addEventListener('click', function () {
      AT.run(mark, box, async function () {
        var r = await AT.api('/api/campaigns/' + c.id + '/invited', {});
        await ctx.refresh();
        var el = document.getElementById('at-invite');
        if (el) el.appendChild(h('p', { class: 'at-ok', text: r.invited + ' tester' + (r.invited === 1 ? '' : 's') + ' told to start.' }));
      });
    });
    var first = waiting.reduce(function (m, a) { return a.deadline && (!m || a.deadline < m) ? a.deadline : m; }, null);
    p.append(ta, h('div', { class: 'at-actions', style: 'margin-top:.4rem' }, copy, csv));
    if (waiting.length) {
      p.append(h('p', { style: 'margin-top:.9rem' }, h('b', { style: 'color:var(--text)', text: waiting.length + ' new tester' + (waiting.length === 1 ? '' : 's') + ' to add.' }),
        first ? ' Add them within 72 hours of accepting (first deadline ' + AT.left(first) + '), or their slots are released.' : ''));
    } else {
      p.append(h('p', { class: 'at-hint', style: 'margin-top:.9rem', text: 'Everyone on the list is marked as added. New testers show up here when they accept.' }));
    }
    p.append(h('div', { class: 'at-actions', style: 'margin-top:.6rem' }, mark), box, ok,
      h('p', { class: 'at-hint', style: 'margin-top:.6rem' }, 'Testers join from Google’s tester page for your app: ', h('span', { class: 'at-pkg', style: 'display:inline', text: c.optInUrl })));
    return p;
  }

  function sdkPanel(c) {
    var p = panel('SDK setup', 'at-sdk');
    var key = h('span', { class: 'at-code', id: 'at-sdk-key', style: 'font-size:.85rem;overflow-wrap:anywhere', text: c.sdkKey });
    var copy = h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Copy key' });
    copy.addEventListener('click', function () { AT.copy(c.sdkKey, copy); });
    var gradle = '// settings.gradle.kts\ninclude(":amni-test-android")\n\n// app/build.gradle.kts\ndependencies {\n    implementation(project(":amni-test-android"))\n}';
    var init = 'import com.amniscient.amnitest.AmniTest\n\nclass MyApp : Application() {\n    override fun onCreate() {\n        super.onCreate()\n        AmniTest.init(this, "' + c.sdkKey + '")\n    }\n}';
    var copyInit = h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Copy code' });
    copyInit.addEventListener('click', function () { AT.copy(init, copyInit); });
    p.append(h('p', { text: 'This key ties the SDK to this test and to ' + c.package + '.' }),
      h('div', { class: 'at-actions', style: 'margin:.6rem 0' }, key, copy),
      h('p', null, '1. Copy the ', h('a', { href: SDK_URL, target: '_blank', rel: 'noopener', text: 'amni-test-android' }), ' folder (in this site’s repository under sdk/) into your project, then add it as a module:'),
      h('pre', { class: 'at-pre', text: gradle }),
      h('p', { text: '2. Start it in Application.onCreate():' }),
      h('pre', { class: 'at-pre', text: init }),
      h('div', { class: 'at-actions' }, copyInit),
      h('p', { class: 'at-hint', style: 'margin-top:.6rem', text: 'The SDK reads the tester’s code from the Play install link and sends one ping a day when the app opens. It sends your package name, a random install ID and the code, and no device identifiers. Pass autoPrompt = true to show a box for typing the code when the install link wasn’t used. You can remove it after the test.' }));
    return p;
  }

  function checkinBlock(ctx, a, ck) {
    var box = AT.errBox();
    var btn = h('button', { type: 'button', class: 'btn btn-outline at-sm', text: ck.helpful ? 'Marked helpful' : 'Helpful', disabled: ck.helpful, 'data-helpful': ck.id });
    if (!ck.helpful) btn.addEventListener('click', function () { AT.run(btn, box, async function () { await AT.api('/api/checkins/' + ck.id + '/helpful', {}); await ctx.refresh(); }); });
    return h('div', { class: 'at-ck' },
      h('h4', null, 'Day ' + ck.day + ' check-in', h('span', { class: 'at-hint', style: 'text-transform:none;letter-spacing:0;font-weight:500', text: AT.dateTime(ck.at) })),
      h('dl', null,
        h('dt', { text: 'Worked' }), h('dd', { text: ck.worked || '—' }),
        h('dt', { text: 'Broke' }), h('dd', { text: ck.broke || '—' }),
        h('dt', { text: 'Device' }), h('dd', { text: ck.device || '—' })),
      h('div', { class: 'at-actions' }, btn), box);
  }

  function disputeForm(ctx, a) {
    var note = h('textarea', { name: 'note', maxlength: 2000, 'data-keep': 'disp-' + a.id, placeholder: a.status === 'exit_pending' ? 'Why the reason doesn’t hold up (e.g. the app works on that device).' : 'Why this test wasn’t done as claimed.' });
    var box = AT.errBox();
    var btn = h('button', { type: 'submit', class: 'btn btn-outline at-sm', text: 'Send dispute' });
    var form = h('form', {
      class: 'at-form',
      onsubmit: function (ev) {
        ev.preventDefault();
        AT.run(btn, box, async function () { await AT.api('/api/assignments/' + a.id + '/dispute', { note: note.value }); form.reset(); await ctx.refresh(); });
      },
    }, h('p', { class: 'at-hint', text: 'An admin reads both sides and decides. If you lose, you get a demerit.' }), h('label', { class: 'at-field' }, h('span', { text: 'What’s wrong' }), note), h('div', { class: 'at-actions' }, btn), box);
    return h('details', { class: 'at-more', 'data-keep': 'disp-open-' + a.id }, h('summary', { text: 'Dispute' }), h('div', null, form));
  }

  function testerCard(ctx, c, a) {
    var t = a.tester;
    var card = h('article', { class: 'at-item', 'data-assignment': a.id, 'data-status': a.status });
    var copy = h('button', { type: 'button', class: 'btn at-link at-sm', text: 'Copy' });
    copy.addEventListener('click', function () { AT.copy(t.email, copy); });
    card.append(h('div', { class: 'at-item-head' },
      h('div', { style: 'min-width:0' }, h('h3', { style: 'text-transform:none;letter-spacing:.01em;overflow-wrap:anywhere', text: t.email }), h('span', { class: 'at-pkg' }, 'Level ' + t.level + ' · ' + money(a.priceCents), ' ', copy)),
      AT.pill(a.status)));
    var meta = h('ul', { class: 'at-meta' });
    if (a.day != null && ['active', 'completed_pending', 'exit_pending'].indexOf(a.status) >= 0) meta.append(h('li', null, h('b', { text: 'Day ' + Math.min(a.day + 1, 14) }), ' of 14'));
    if (c.verification === 'sdk') {
      meta.append(h('li', { text: a.installClaimed ? 'Install confirmed by SDK' : 'Install not confirmed yet' }));
      meta.append(h('li', null, 'Opened on ', h('b', { text: a.pingDays || 0 }), ' day' + (a.pingDays === 1 ? '' : 's') + (a.lastPingDay != null ? ' (last: day ' + (a.lastPingDay + 1) + ')' : '')));
    }
    meta.append(h('li', null, h('b', { text: a.checkins.length }), ' of 3 check-ins'));
    if (a.missedCheckins) meta.append(h('li', { class: 'at-minus', text: a.missedCheckins + ' missed' }));
    if (a.paidCents && ['completed', 'excused', 'removed'].indexOf(a.status) >= 0) meta.append(h('li', null, 'Paid ', h('b', { text: money(a.paidCents) })));
    card.append(meta);

    var box = AT.errBox();
    switch (a.status) {
      case 'accepted':
        card.append(h('p', { style: 'margin-top:.6rem', text: 'Add this email in Play Console, then mark testers as added above.' + (a.deadline ? ' Slot released ' + AT.until(a.deadline) + '.' : '') }));
        break;
      case 'invited':
        card.append(h('p', { style: 'margin-top:.6rem', text: 'Added. Waiting for the tester to opt in, install and start' + (a.deadline ? ' (' + AT.left(a.deadline) + ').' : '.') }));
        break;
      case 'completed_pending': {
        var conf = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Confirm completion', 'data-confirm': a.id });
        conf.addEventListener('click', function () { AT.run(conf, box, async function () { await AT.api('/api/assignments/' + a.id + '/confirm', {}); await ctx.refresh(); }); });
        card.append(h('div', { class: 'at-sub' },
          h('p', { text: 'Filed the day-14 check-in.' + (a.deadline ? ' Confirm or dispute by ' + AT.dateTime(a.deadline) + ' (' + AT.left(a.deadline) + '), or it’s confirmed automatically.' : '') }),
          a.disputeNote ? h('div', null, h('p', { text: 'You disputed this. An admin will decide. Your note:' }), h('p', { class: 'at-quote', text: a.disputeNote })) : null,
          h('div', { class: 'at-actions', style: 'margin-top:.6rem' }, conf), box, a.disputeNote ? null : disputeForm(ctx, a)));
        break;
      }
      case 'exit_pending': {
        var d = ctx.cfg.excusedReasons.indexOf(a.exitReason) >= 0 && (a.exitReason === 'privacy' || a.exitReason === 'offensive') ? 3 : 1;
        var ebox = AT.errBox();
        var acceptExit = h('button', { type: 'button', class: 'btn at-sm', text: 'Accept exit now', 'data-accept-exit': a.id });
        acceptExit.addEventListener('click', function () { AT.run(acceptExit, ebox, async function () { await AT.api('/api/assignments/' + a.id + '/confirm', {}); await ctx.refresh(); }); });
        card.append(h('div', { class: 'at-sub' },
          h('p', null, 'Left the test: ', h('b', { style: 'color:var(--text)', text: AT.EXIT_LABELS[a.exitReason] || a.exitReason })),
          a.exitNote ? h('p', { class: 'at-quote', text: a.exitNote }) : null,
          h('p', { text: 'If you don’t dispute' + (a.deadline ? ' by ' + AT.dateTime(a.deadline) + ' (' + AT.left(a.deadline) + ')' : '') + ', the exit is excused: the tester is paid for the days done and you get ' + d + ' demerit' + (d === 1 ? '' : 's') + '. You can also accept it now so their slot opens sooner.' }),
          a.disputeNote ? h('div', null, h('p', { text: 'You disputed this. An admin will decide. Your note:' }), h('p', { class: 'at-quote', text: a.disputeNote })) : h('div', null, h('div', { class: 'at-actions', style: 'margin-top:.6rem' }, acceptExit), ebox, disputeForm(ctx, a))));
        break;
      }
      case 'excused':
      case 'exited':
        if (a.exitReason) card.append(h('p', { style: 'margin-top:.6rem' }, 'Reason: ' + (AT.EXIT_LABELS[a.exitReason] || a.exitReason)), a.exitNote ? h('p', { class: 'at-quote', text: a.exitNote }) : null);
        break;
    }

    if (a.checkins.length) {
      var helpfulLeft = Math.max(0, 3 - (a.helpfulCount || 0));
      card.append(h('details', { class: 'at-more', open: true, 'data-keep': 'cks-' + a.id },
        h('summary', { text: 'Feedback (' + a.checkins.length + ')' }),
        h('div', null,
          h('p', { class: 'at-hint', text: 'Mark a check-in helpful if it helped you fix or improve the app, not because it was positive. ' + (helpfulLeft ? 'Up to ' + helpfulLeft + ' more raise this tester’s standing.' : 'This tester already got the most merits for helpful feedback on this test.') }),
          a.checkins.map(function (ck) { return checkinBlock(ctx, a, ck); }))));
    }
    if (['expired'].indexOf(a.status) < 0) card.append(AT.reportForm(ctx, a, 'tester', 'Report this tester'));
    return card;
  }

  function closePanel(ctx, c) {
    var p = panel('Close this test', 'at-close');
    var holding = HOLDING.reduce(function (s, k) { return s + n(c.counts, k); }, 0);
    var unused = Math.max(c.slots - holding, 0);
    var est = c.budgetCents - c.reservedCents - c.spentCents - c.creditedCents + unused * Math.round(c.feeCents / c.slots);
    var box = AT.errBox(), ok = h('p', { class: 'at-ok', role: 'status' });
    var btn = AT.confirmBtn('Close test', 'Confirm: close for good', box, async function () {
      var r = await AT.api('/api/campaigns/' + c.id + '/close', {});
      await ctx.refresh();
      var el = document.getElementById('at-detail-head');
      if (el) el.appendChild(h('p', { class: 'at-ok', id: 'at-closed-msg', text: 'Closed. ' + money(r.creditedCents) + ' was added to your credit.' }));
    });
    p.append(h('p', { text: 'Open slots close and no new testers can join. Testers already in the test keep going and are paid as usual. Unused budget (about ' + money(Math.max(est, 0)) + ' now) goes to your credit. You can’t reopen it.' }),
      h('div', { class: 'at-actions', style: 'margin-top:.7rem' }, btn), box, ok);
    return p;
  }

  async function renderDetail(view, ctx) {
    var c = (await AT.api('/api/campaigns/' + ctx.id)).campaign;
    var flags = ctx.flags;
    // Back from Stripe: the webhook can land a moment after the redirect.
    if (flags.paid && String(flags.paid) === String(c.id) && c.status === 'draft' && !flags.paidPolled) {
      for (var i = 0; i < 6 && c.status === 'draft'; i++) {
        await new Promise(function (r) { setTimeout(r, 1500); });
        c = (await AT.api('/api/campaigns/' + ctx.id)).campaign;
      }
      flags.paidPolled = true;
    }
    var head = h('div', { class: 'at-panel', id: 'at-detail-head' },
      h('p', { style: 'margin:0 0 .6rem' }, h('a', { href: '#dev', class: 'btn at-link at-sm', text: '← All your tests' })),
      h('div', { class: 'at-item-head' }, h('div', null, h('h2', { class: 'at-h', style: 'margin:0;font-size:1.05rem', text: c.appName }), h('span', { class: 'at-pkg', text: c.package })), AT.pill(c.status)),
      c.description ? h('p', { class: 'at-quote', text: c.description }) : null,
      h('div', { class: 'at-stats', style: 'margin-top:.8rem' },
        h('div', { class: 'at-stat' }, h('b', { text: c.slots }), h('span', { text: 'Slots' })),
        h('div', { class: 'at-stat' }, h('b', { text: c.maxLevel }), h('span', { text: 'Max level' })),
        h('div', { class: 'at-stat' }, h('b', { text: n(c.counts, 'completed') }), h('span', { text: 'Completed' })),
        h('div', { class: 'at-stat' }, h('b', { text: money(c.budgetCents) }), h('span', { text: 'Budget' })),
        h('div', { class: 'at-stat' }, h('b', { text: money(c.spentCents) }), h('span', { text: 'Paid out' })),
        c.creditedCents ? h('div', { class: 'at-stat' }, h('b', { text: money(c.creditedCents) }), h('span', { text: 'Credited' })) : null),
      h('p', { class: 'at-hint', text: (c.paidAt ? 'Opened ' + AT.date(c.paidAt) : 'Created ' + AT.date(c.createdAt)) + ' · ' + (c.verification === 'sdk' ? 'checked by the SDK' : 'checked by hand') }));
    if (flags.paid && String(flags.paid) === String(c.id)) head.append(h('p', { class: c.status === 'draft' ? 'at-err' : 'at-ok', role: 'status', text: c.status === 'draft' ? 'Stripe hasn’t confirmed the payment yet. Refresh in a minute.' : 'Payment received. Your test is open to testers.' }));
    if (flags.cancelled && String(flags.cancelled) === String(c.id)) head.append(h('p', { class: 'at-hint', role: 'status', text: 'Payment cancelled. Your draft is saved; pay whenever you’re ready.' }));

    var main = h('div', { class: 'at-stack' }, head);
    var side = h('div', { class: 'at-stack' });
    if (c.status === 'draft') main.append(payPanel(ctx, c));
    if (c.status === 'open' || (c.emails && c.emails.length && c.status !== 'draft')) main.append(invitePanel(ctx, c));
    var tp = panel(null, 'at-testers');
    tp.append(h('h2', null, 'Testers', h('small', { text: countLine(c) })));
    if (!c.assignments.length) tp.append(h('p', { class: 'at-empty', text: c.status === 'draft' ? 'Testers can join once the test is paid.' : 'No testers yet. They appear here as they accept.' }));
    else tp.append(h('div', { class: 'at-list' }, c.assignments.map(function (a) { return testerCard(ctx, c, a); })));
    main.append(tp);
    if (c.verification === 'sdk') side.append(sdkPanel(c));
    if (c.status === 'open') side.append(closePanel(ctx, c));
    side.append(summaryPanel(ctx));
    view.append(h('div', { class: 'at-cols' }, main, side));
  }

  AT.tabs.dev = {
    render: async function (view, ctx) {
      if (ctx.id) return renderDetail(view, ctx);
      var list = (await AT.api('/api/campaigns')).campaigns || [];
      var main = h('div', { class: 'at-stack' }, createPanel(ctx, !list.length), listPanel(ctx, list));
      view.append(h('div', { class: 'at-cols' }, main, h('div', { class: 'at-stack' }, summaryPanel(ctx))));
    },
  };
})();
