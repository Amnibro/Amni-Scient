/* Amni-Test: Admin tab (reports, disputes, appeals). */
(function () {
  'use strict';
  var AT = window.AT, h = AT.h;
  AT.tabs = AT.tabs || {};

  function section(title, id, items, empty, render) {
    var p = h('div', { class: 'at-panel', id: id });
    p.append(h('h2', null, title, h('small', { text: items.length ? items.length + ' open' : '' })));
    if (!items.length) p.append(h('p', { class: 'at-empty', text: empty }));
    else p.append(h('div', { class: 'at-list' }, items.map(render)));
    return p;
  }

  function decide(ctx, path, body, btn, box) {
    return AT.run(btn, box, async function () { await AT.api(path, body); await ctx.refresh(); });
  }

  function reportItem(ctx, r) {
    var box = AT.errBox();
    var fraud = h('input', { type: 'checkbox', name: 'fraud' });
    var up = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Uphold', 'data-uphold': r.id });
    var dis = h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Dismiss', 'data-dismiss': r.id });
    up.addEventListener('click', function () { decide(ctx, '/api/admin/reports/' + r.id, { decision: 'uphold', fraud: fraud.checked }, up, box); });
    dis.addEventListener('click', function () { decide(ctx, '/api/admin/reports/' + r.id, { decision: 'dismiss' }, dis, box); });
    return h('article', { class: 'at-item', 'data-report': r.id },
      h('div', { class: 'at-item-head' },
        h('div', null, h('h3', { text: AT.REPORT_LABELS[r.category] || r.category }), h('span', { class: 'at-pkg', text: (r.kind === 'campaign' ? 'Tester reported a developer' : 'Developer reported a tester') + ' · ' + r.app_name })),
        AT.pill(r.target_status)),
      h('ul', { class: 'at-meta' },
        h('li', null, 'From ', h('b', { text: r.reporter_email })),
        h('li', null, 'About ', h('b', { text: r.target_email })),
        h('li', { text: AT.ago(r.created_at) }),
        h('li', null, h('a', { href: '#dev/' + r.campaign_id, class: 'btn at-link at-sm', text: 'Open the test' }))),
      h('p', { class: 'at-quote', text: r.note }),
      h('p', { class: 'at-hint', text: 'Upholding closes the reported account. Running tests are settled with pay for days done unless you mark fraud, which also forfeits their balance. Dismissing the last open report reactivates the account.' }),
      h('label', { class: 'at-check', style: 'margin:.6rem 0' }, fraud, h('span', { text: 'Fraud (forfeit the balance and pay nothing for running tests)' })),
      h('div', { class: 'at-actions' }, up, dis), box);
  }

  function disputeItem(ctx, a) {
    var box = AT.errBox();
    var forT = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Decide for the tester', 'data-for-tester': a.id });
    var forD = h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Decide for the developer', 'data-for-dev': a.id });
    forT.addEventListener('click', function () { decide(ctx, '/api/admin/disputes/' + a.id, { decision: 'tester' }, forT, box); });
    forD.addEventListener('click', function () { decide(ctx, '/api/admin/disputes/' + a.id, { decision: 'developer' }, forD, box); });
    var isExit = a.status === 'exit_pending';
    return h('article', { class: 'at-item', 'data-dispute': a.id },
      h('div', { class: 'at-item-head' },
        h('div', null, h('h3', { text: a.app_name }), h('span', { class: 'at-pkg', text: a.tester_email })), AT.pill(a.status)),
      isExit ? h('p', null, 'Tester left: ', h('b', { style: 'color:var(--text)', text: AT.EXIT_LABELS[a.exit_reason] || a.exit_reason })) : h('p', { text: 'Tester says the 14-day test is complete.' }),
      isExit && a.exit_note ? h('div', null, h('p', { class: 'at-hint', text: 'Tester’s note' }), h('p', { class: 'at-quote', text: a.exit_note })) : null,
      h('p', { class: 'at-hint', text: 'Developer’s dispute · ' + AT.ago(a.dispute_at) }), h('p', { class: 'at-quote', text: a.dispute_note }),
      h('p', { class: 'at-hint', text: isExit ? 'For the tester: excused, paid for days done, developer gets demerits. For the developer: ended unpaid, tester gets −5.' : 'For the tester: completed and paid, developer gets 1 demerit. For the developer: ended unpaid, tester gets −5.' }),
      h('div', { class: 'at-actions', style: 'margin-top:.6rem' }, forT, forD, h('a', { href: '#dev/' + a.campaign_id, class: 'btn at-link at-sm', text: 'Open the test' })), box);
  }

  function appealItem(ctx, u) {
    var box = AT.errBox();
    var yes = h('button', { type: 'button', class: 'btn btn-primary at-sm', text: 'Reinstate', 'data-reinstate': u.id });
    var no = h('button', { type: 'button', class: 'btn btn-outline at-sm', text: 'Deny', 'data-deny': u.id });
    yes.addEventListener('click', function () { decide(ctx, '/api/admin/appeals/' + u.id, { decision: 'reinstate' }, yes, box); });
    no.addEventListener('click', function () { decide(ctx, '/api/admin/appeals/' + u.id, { decision: 'deny' }, no, box); });
    return h('article', { class: 'at-item', 'data-appeal': u.id },
      h('div', { class: 'at-item-head' }, h('div', null, h('h3', { style: 'text-transform:none;letter-spacing:.01em', text: u.email }), h('span', { class: 'at-pkg', text: u.status_reason || '' })), AT.pill(u.status)),
      h('p', { class: 'at-hint', text: 'Appeal · ' + AT.ago(u.appeal_at) }), h('p', { class: 'at-quote', text: u.appeal_text }),
      h('p', { class: 'at-hint', text: 'Reinstating sets a negative tester standing back to 0. Either decision is final.' }),
      h('div', { class: 'at-actions', style: 'margin-top:.6rem' }, yes, no), box);
  }

  AT.tabs.admin = {
    render: async function (view, ctx) {
      var q = await AT.api('/api/admin/queue');
      view.append(h('div', { class: 'at-stack' },
        section('Reports', 'at-q-reports', q.reports || [], 'No open reports.', function (r) { return reportItem(ctx, r); }),
        section('Disputes', 'at-q-disputes', q.disputes || [], 'No open disputes.', function (a) { return disputeItem(ctx, a); }),
        section('Appeals', 'at-q-appeals', q.appeals || [], 'No open appeals.', function (u) { return appealItem(ctx, u); })));
    },
  };
})();
