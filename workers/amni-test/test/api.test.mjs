// Scenario tests: the real Worker against SQLite, a fake clock, and stubbed Stripe/Google.
// Run: node --test workers/amni-test/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { sweep } from '../worker/sweep.js';
import { hmacHex } from '../worker/stripe.js';
import { _resetGoogleKeyCache } from '../worker/google.js';
import { makeD1 } from './d1.mjs';

const SCHEMA = fileURLToPath(new URL('../schema.sql', import.meta.url));
const DAY = 86400000, HOUR = 3600000;

function harness(vars = {}) {
  let clock = Date.UTC(2026, 10, 1, 12);
  const stripeCalls = [];
  const env = {
    DB: makeD1(SCHEMA), DEV_AUTH: '1', DEV_FAKE_PAY: '1', ADMIN_EMAILS: 'admin@example.com', ALLOWED_ORIGINS: 'https://amni-scient.com',
    SITE_URL: 'https://amni-scient.com/test/', REPORT_THRESHOLD: '2', PAYOUT_MIN_CENTS: '1000',
    __now: () => clock,
    __fetch: async (url, init) => {
      stripeCalls.push({ url, body: Object.fromEntries(new URLSearchParams(init.body || '')) });
      const path = url.replace('https://api.stripe.com/v1/', '');
      const out = path === 'checkout/sessions' ? { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/cs_test_1' }
        : path === 'accounts' ? { id: 'acct_1' } : path === 'account_links' ? { url: 'https://connect.stripe.com/setup/x' }
        : path === 'transfers' ? { id: 'tr_1' } : {};
      return new Response(JSON.stringify(out), { status: 200 });
    },
    ...vars,
  };
  const call = async (method, path, body, token, headers = {}) => {
    const r = await worker.fetch(new Request('https://amni-test.example' + path, {
      method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }), env);
    const j = await r.json();
    return { status: r.status, ...j };
  };
  const login = async (email) => (await call('POST', '/api/auth/dev', { email })).token;
  const tick = (ms) => { clock += ms; };
  const db = (sql, ...a) => env.DB.raw.prepare(sql).all(...a);
  return { env, call, login, tick, db, stripeCalls, get now() { return clock; } };
}

async function setup(h, { slots = 2, maxLevel = 1, verification = 'manual' } = {}) {
  const dev = await h.login('dev@example.com');
  const c = await h.call('POST', '/api/campaigns', { appName: 'Waystone', package: 'com.amniscient.waystone', description: 'A game', slots, maxLevel, verification }, dev);
  assert.equal(c.status, 200, c.error);
  const paid = await h.call('POST', `/api/campaigns/${c.campaign.id}/checkout`, {}, dev);
  assert.equal(paid.funded, true);
  return { dev, cid: c.campaign.id };
}

async function tester(h, email = 'tess@example.com') {
  const t = await h.login(email);
  await h.call('POST', '/api/me/adult', {}, t);
  return t;
}

async function startTest(h, ctx, t) {
  const acc = await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, t);
  assert.equal(acc.status, 200, acc.error);
  const inv = await h.call('POST', `/api/campaigns/${ctx.cid}/invited`, {}, ctx.dev);
  assert.ok(inv.invited >= 1);
  const st = await h.call('POST', `/api/assignments/${acc.assignment.id}/start`, {}, t);
  assert.equal(st.status, 200, st.error);
  return acc.assignment;
}

const FB = { worked: 'Menus load fast and saving works.', broke: 'Crash when rotating on level 2.', device: 'Pixel 7, Android 15' };

test('happy path: accept, invite, start, three check-ins, confirm, paid', async () => {
  const h = harness();
  const ctx = await setup(h);
  const t = await tester(h);
  const list = await h.call('GET', '/api/tests', undefined, t);
  assert.equal(list.tests.length, 1);
  assert.equal(list.tests[0].yourPriceCents, 100);
  const a = await startTest(h, ctx, t);
  assert.equal((await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t)).day, 1);
  assert.equal((await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t)).status, 400, 'no second check-in in the same window');
  h.tick(7 * DAY); assert.equal((await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t)).day, 7);
  h.tick(7 * DAY); const last = await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t);
  assert.equal(last.status, 'completed_pending');
  const conf = await h.call('POST', `/api/assignments/${a.id}/confirm`, {}, ctx.dev);
  assert.equal(conf.ok, true);
  const me = await h.call('GET', '/api/me', undefined, t);
  assert.equal(me.balanceCents, 100);
  assert.equal(me.tester.merits, 3);
  const dme = await h.call('GET', '/api/me', undefined, ctx.dev);
  assert.equal(dme.dev.merits, 1);
  const camp = await h.call('GET', `/api/campaigns/${ctx.cid}`, undefined, ctx.dev);
  assert.equal(camp.campaign.spentCents, 100);
  assert.equal(camp.campaign.reservedCents, 0);
  assert.equal(camp.campaign.assignments[0].checkins.length, 3);
  assert.equal(camp.campaign.assignments[0].tester.name, undefined, 'developers only get the email');
});

test('feedback that is too short is refused; own app cannot be tested; 18+ is required', async () => {
  const h = harness();
  const ctx = await setup(h);
  assert.equal((await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, ctx.dev)).status, 403, 'developer has not attested either');
  await h.call('POST', '/api/me/adult', {}, ctx.dev);
  assert.match((await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, ctx.dev)).error, /own app/);
  const t = await h.login('kid@example.com');
  assert.match((await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, t)).error, /18/);
  await h.call('POST', '/api/me/adult', {}, t);
  const a = await startTest(h, ctx, t);
  assert.match((await h.call('POST', `/api/assignments/${a.id}/checkin`, { worked: 'ok', broke: '' }, t)).error, /couple of sentences/);
});

test('timers: uninvited slot expires free, invited no-show costs 2, missed check-ins cost 1, silence ends the test', async () => {
  const h = harness();
  const ctx = await setup(h, { slots: 3 });
  const t1 = await tester(h, 'a@example.com'), t2 = await tester(h, 'b@example.com'), t3 = await tester(h, 'c@example.com');
  await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, t1);
  h.tick(73 * HOUR); await sweep(h.env);
  let me = await h.call('GET', '/api/me', undefined, t1);
  assert.equal(me.tester.demerits, 0);
  assert.equal(h.db("SELECT status FROM assignments")[0].status, 'expired');

  await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, t2);
  await h.call('POST', `/api/campaigns/${ctx.cid}/invited`, {}, ctx.dev);
  h.tick(73 * HOUR); await sweep(h.env);
  me = await h.call('GET', '/api/me', undefined, t2);
  assert.equal(me.tester.demerits, 2);

  const a = await startTest(h, ctx, t3);
  h.tick(3 * DAY + HOUR); await sweep(h.env);
  me = await h.call('GET', '/api/me', undefined, t3);
  assert.equal(me.tester.demerits, 1, 'missed day 1');
  await sweep(h.env);
  assert.equal((await h.call('GET', '/api/me', undefined, t3)).tester.demerits, 1, 'not charged twice');
  h.tick(15 * DAY); await sweep(h.env);
  me = await h.call('GET', '/api/me', undefined, t3);
  assert.equal(me.tester.demerits, 1 + 1 + 1 + 5, 'missed 7 and 14, then abandoned');
  assert.equal(h.db('SELECT status FROM assignments WHERE id = ?', a.id)[0].status, 'exited');
  const c = h.db('SELECT reserved_cents FROM campaigns')[0];
  assert.equal(c.reserved_cents, 0);
});

test('partial check-ins pay in thirds after the 72-hour auto-confirm', async () => {
  const h = harness();
  const ctx = await setup(h);
  const t = await tester(h);
  const a = await startTest(h, ctx, t);
  await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t);
  h.tick(7 * DAY); await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t);
  h.tick(10 * DAY); await sweep(h.env); // past day 16, day-14 window missed
  assert.equal(h.db('SELECT status FROM assignments')[0].status, 'completed_pending');
  h.tick(73 * HOUR); await sweep(h.env);
  const me = await h.call('GET', '/api/me', undefined, t);
  assert.equal(me.balanceCents, 67);
  assert.equal(me.tester.merits, 3);
  assert.equal(me.tester.demerits, 1);
});

test('excused exit pays pro-rata and charges the developer; a disputed exit lost by the tester costs 5', async () => {
  const h = harness();
  const ctx = await setup(h);
  const t1 = await tester(h, 'a@example.com'), t2 = await tester(h, 'b@example.com');
  const a1 = await startTest(h, ctx, t1);
  const a2 = await startTest(h, ctx, t2);
  h.tick(7 * DAY);
  assert.match((await h.call('POST', `/api/assignments/${a1.id}/exit`, { reason: 'crash' }, t1)).error, /what went wrong/);
  assert.equal((await h.call('POST', `/api/assignments/${a1.id}/exit`, { reason: 'crash', note: 'Crashes on every launch since update' }, t1)).status, 'exit_pending');
  assert.equal((await h.call('POST', `/api/assignments/${a2.id}/exit`, { reason: 'privacy', note: 'Asks for contacts for no reason' }, t2)).status, 'exit_pending');
  await h.call('POST', `/api/assignments/${a2.id}/dispute`, { note: 'We never request contacts; see manifest' }, ctx.dev);
  h.tick(73 * HOUR); await sweep(h.env);
  const t3 = await tester(h, 'c@example.com');
  h.db('UPDATE campaigns SET slots = 3, budget_cents = 300');
  const a3 = await startTest(h, ctx, t3);
  h.tick(DAY);
  await h.call('POST', `/api/assignments/${a3.id}/exit`, { reason: 'wont_install', note: 'Play says the device is not compatible' }, t3);
  assert.equal((await h.call('POST', `/api/assignments/${a3.id}/confirm`, {}, ctx.dev)).ok, true, 'developer accepts the exit early');
  assert.equal(h.db('SELECT status FROM assignments WHERE id = ?', a3.id)[0].status, 'excused');
  let me1 = await h.call('GET', '/api/me', undefined, t1);
  assert.equal(me1.balanceCents, 50, '7 of 14 days of $1');
  assert.equal(me1.tester.demerits, 0);
  assert.equal(h.db("SELECT status FROM assignments WHERE id = ?", a2.id)[0].status, 'exit_pending', 'disputed exit waits for an admin');
  const admin = await h.login('admin@example.com');
  const q = await h.call('GET', '/api/admin/queue', undefined, admin);
  assert.equal(q.disputes.length, 1);
  await h.call('POST', `/api/admin/disputes/${a2.id}`, { decision: 'developer' }, admin);
  const me2 = await h.call('GET', '/api/me', undefined, t2);
  assert.equal(me2.tester.demerits, 5);
  assert.equal(me2.balanceCents, 0);
  const dev = await h.call('GET', '/api/me', undefined, ctx.dev);
  assert.equal(dev.dev.demerits, 2, 'the crash and wont_install exits charged the developer; the disputed privacy exit did not');
});

test('unexcused exit costs 5; two of them ban the account; one appeal reinstates at standing >= 0', async () => {
  const h = harness();
  const ctx = await setup(h, { slots: 5 });
  const dev2 = await h.login('dev2@example.com');
  const c2 = (await h.call('POST', '/api/campaigns', { appName: 'Other', package: 'com.example.other', slots: 2, maxLevel: 1 }, dev2)).campaign;
  await h.call('POST', `/api/campaigns/${c2.id}/checkout`, {}, dev2);
  const t = await tester(h);
  const a1 = await startTest(h, ctx, t);
  assert.equal((await h.call('POST', `/api/assignments/${a1.id}/exit`, { reason: 'no_time' }, t)).status, 'exited');
  const a2 = await startTest(h, { cid: c2.id, dev: dev2 }, t);
  await h.call('POST', `/api/assignments/${a2.id}/exit`, { reason: 'lost_interest' }, t);
  let me = await h.call('GET', '/api/me', undefined, t);
  assert.equal(me.user.status, 'banned');
  assert.match((await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, t)).error, /banned/);
  assert.equal((await h.call('POST', '/api/me/appeal', { text: 'My phone broke both times; I can show receipts.' }, t)).ok, true);
  assert.match((await h.call('POST', '/api/me/appeal', { text: 'Second try at an appeal for my account.' }, t)).error, /one appeal/);
  const admin = await h.login('admin@example.com');
  assert.equal((await h.call('GET', '/api/admin/queue', undefined, admin)).appeals.length, 1);
  await h.call('POST', `/api/admin/appeals/${me.user.id}`, { decision: 'reinstate' }, admin);
  me = await h.call('GET', '/api/me', undefined, t);
  assert.equal(me.user.status, 'active');
  assert.equal(me.tester.standing, 0);
});

test('reports: first freezes for review, a second reporter terminates, running tests pay days done', async () => {
  const h = harness();
  const ctx = await setup(h, { slots: 3 });
  const dev2 = await h.login('dev2@example.com');
  const c2 = (await h.call('POST', '/api/campaigns', { appName: 'Other', package: 'com.example.other', slots: 2, maxLevel: 1 }, dev2)).campaign;
  await h.call('POST', `/api/campaigns/${c2.id}/checkout`, {}, dev2);
  const t = await tester(h);
  const a1 = await startTest(h, ctx, t);
  const a2 = await startTest(h, { cid: c2.id, dev: dev2 }, t);
  h.tick(7 * DAY);
  assert.equal((await h.call('POST', '/api/reports', { kind: 'tester', assignmentId: a1.id, category: 'harassment', note: 'Abusive messages in feedback' }, ctx.dev)).ok, true);
  let me = await h.call('GET', '/api/me', undefined, t);
  assert.equal(me.user.status, 'review');
  assert.match((await h.call('POST', '/api/reports', { kind: 'tester', assignmentId: a2.id, category: 'harassment', note: 'Not my tester' }, ctx.dev)).error, /own apps/);
  await h.call('POST', '/api/reports', { kind: 'tester', assignmentId: a2.id, category: 'spam_feedback', note: 'Copy-pasted the same text' }, dev2);
  me = await h.call('GET', '/api/me', undefined, t);
  assert.equal(me.user.status, 'terminated');
  assert.equal(me.balanceCents, 100, '7/14 of $1 on each of two tests');
  h.env.STRIPE_SECRET_KEY = 'sk_test_x';
  h.db("UPDATE users SET balance_cents = 1000, stripe_account_id = 'acct_1', payouts_enabled = 1 WHERE email = 'tess@example.com'");
  assert.equal((await h.call('POST', '/api/payouts/request', {}, t)).payout.amountCents, 1000, 'earned money is still paid after termination');
  assert.equal(h.db("SELECT COUNT(*) AS n FROM assignments WHERE status = 'removed'")[0].n, 2);
});

test('admin dismissing the only report restores the account; upholding with fraud forfeits the balance', async () => {
  const h = harness();
  const ctx = await setup(h, { slots: 3 });
  const admin = await h.login('admin@example.com');
  const t = await tester(h);
  const a = await startTest(h, ctx, t);
  await h.call('POST', '/api/reports', { kind: 'tester', assignmentId: a.id, category: 'fraud', note: 'Looks like an emulator farm' }, ctx.dev);
  let q = await h.call('GET', '/api/admin/queue', undefined, admin);
  await h.call('POST', `/api/admin/reports/${q.reports[0].id}`, { decision: 'dismiss' }, admin);
  assert.equal((await h.call('GET', '/api/me', undefined, t)).user.status, 'active');

  const t2 = await tester(h, 'farm@example.com');
  const b = await startTest(h, ctx, t2);
  h.db('UPDATE users SET balance_cents = 900 WHERE email = ?', 'farm@example.com');
  await h.call('POST', '/api/reports', { kind: 'tester', assignmentId: b.id, category: 'fraud', note: 'Same device as five other accounts' }, ctx.dev);
  q = await h.call('GET', '/api/admin/queue', undefined, admin);
  await h.call('POST', `/api/admin/reports/${q.reports[0].id}`, { decision: 'uphold', fraud: true }, admin);
  const me = await h.call('GET', '/api/me', undefined, t2);
  assert.equal(me.user.status, 'terminated');
  assert.equal(me.balanceCents, 0);
  assert.equal(h.db('SELECT forfeited_cents FROM users WHERE email = ?', 'farm@example.com')[0].forfeited_cents, 900);
});

test('helpful votes add merits, at most 3 per test; levels raise the price but never above the campaign cap', async () => {
  const h = harness();
  const ctx = await setup(h, { slots: 2, maxLevel: 2 });
  const t = await tester(h);
  const a = await startTest(h, ctx, t);
  await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t);
  h.tick(7 * DAY); await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t);
  h.tick(7 * DAY); await h.call('POST', `/api/assignments/${a.id}/checkin`, FB, t);
  const camp = await h.call('GET', `/api/campaigns/${ctx.cid}`, undefined, ctx.dev);
  for (const ck of camp.campaign.assignments[0].checkins) await h.call('POST', `/api/checkins/${ck.id}/helpful`, {}, ctx.dev);
  await h.call('POST', `/api/checkins/${camp.campaign.assignments[0].checkins[0].id}/helpful`, {}, ctx.dev);
  assert.equal((await h.call('GET', '/api/me', undefined, t)).tester.merits, 3);
  h.db("UPDATE users SET tester_merits = 30 WHERE email = 'tess@example.com'");
  const dev3 = await h.login('dev3@example.com');
  const c3 = (await h.call('POST', '/api/campaigns', { appName: 'Cap', package: 'com.example.cap', slots: 1, maxLevel: 2 }, dev3)).campaign;
  await h.call('POST', `/api/campaigns/${c3.id}/checkout`, {}, dev3);
  const list = await h.call('GET', '/api/tests', undefined, t);
  assert.equal(list.tests.find((x) => x.id === c3.id).yourPriceCents, 200, 'level 3 tester capped at level 2 price');
});

test('SDK: claim by code starts the test, pings count days, a late ping pays on the day-14 check-in', async () => {
  const h = harness();
  const ctx = await setup(h, { verification: 'sdk' });
  const camp = (await h.call('GET', `/api/campaigns/${ctx.cid}`, undefined, ctx.dev)).campaign;
  const t = await tester(h);
  const acc = await h.call('POST', `/api/tests/${ctx.cid}/accept`, {}, t);
  const code = acc.assignment.claimCode;
  assert.match(acc.assignment.links.install, /referrer=amnitest%3DAT-/);
  const body = (o) => ({ key: camp.sdkKey, package: 'com.amniscient.waystone', installId: 'install-0001', ...o });
  assert.match((await h.call('POST', '/api/sdk/claim', body({ code })).then((r) => r.error)), /not added/);
  await h.call('POST', `/api/campaigns/${ctx.cid}/invited`, {}, ctx.dev);
  assert.match((await h.call('POST', '/api/sdk/claim', body({ code, package: 'com.evil.app' }))).error, /another app/);
  const claim = await h.call('POST', '/api/sdk/claim', body({ code: code.toLowerCase().replace(/-/g, ' ') }));
  assert.equal(claim.assignment.status, 'active');
  assert.equal((await h.call('POST', '/api/sdk/claim', body({ code, installId: 'install-9999' }))).status, 409);
  assert.equal((await h.call('POST', '/api/sdk/ping', body({}))).day, 0);
  await h.call('POST', `/api/assignments/${acc.assignment.id}/checkin`, FB, t);
  h.tick(7 * DAY); await h.call('POST', `/api/assignments/${acc.assignment.id}/checkin`, FB, t);
  h.tick(6 * DAY); assert.equal((await h.call('POST', '/api/sdk/ping', body({}))).day, 13);
  h.tick(DAY);
  const last = await h.call('POST', `/api/assignments/${acc.assignment.id}/checkin`, FB, t);
  assert.equal(last.status, 'completed');
  assert.equal((await h.call('GET', '/api/me', undefined, t)).balanceCents, 100);
});

test('closing a campaign returns unused budget and fees as credit; credit pays for the next one', async () => {
  const h = harness();
  const ctx = await setup(h, { slots: 4, maxLevel: 1 }); // 4 x ($1 + $0.50 fee) = $6
  const t = await tester(h);
  await startTest(h, ctx, t);
  const close = await h.call('POST', `/api/campaigns/${ctx.cid}/close`, {}, ctx.dev);
  assert.equal(close.creditedCents, 3 * 100 + 3 * 50, 'three unused slots and their fees');
  const me = await h.call('GET', '/api/me', undefined, ctx.dev);
  assert.equal(me.creditCents, 450);
  const c2 = await h.call('POST', '/api/campaigns', { appName: 'Next', package: 'com.example.next', slots: 2, maxLevel: 1 }, ctx.dev);
  assert.equal(c2.campaign.dueCents, 0, '$3 fits in $4.50 credit');
  h.env.DEV_FAKE_PAY = '0'; h.env.STRIPE_SECRET_KEY = 'sk_test_x';
  assert.equal((await h.call('POST', `/api/campaigns/${c2.campaign.id}/checkout`, {}, ctx.dev)).funded, true);
  assert.equal((await h.call('GET', '/api/me', undefined, ctx.dev)).creditCents, 150);
});

test('Stripe: checkout session, signed webhook funds once, bad signature refused, payouts via Connect', async () => {
  const h = harness({ DEV_FAKE_PAY: '0', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_test' });
  const dev = await h.login('dev@example.com');
  const c = (await h.call('POST', '/api/campaigns', { appName: 'Paid', package: 'com.example.paid', slots: 12, maxLevel: 1 }, dev)).campaign;
  assert.equal(c.dueCents, 12 * 150);
  const co = await h.call('POST', `/api/campaigns/${c.id}/checkout`, {}, dev);
  assert.equal(co.url, 'https://checkout.stripe.com/c/cs_test_1');
  const sent = h.stripeCalls.find((x) => x.url.endsWith('checkout/sessions')).body;
  assert.equal(sent['line_items[0][price_data][unit_amount]'], '1800');
  assert.equal(sent['metadata[campaign_id]'], String(c.id));

  const hook = async (event, secret = 'whsec_test') => {
    const payload = JSON.stringify(event), ts = Math.floor(h.now / 1000);
    const sig = await hmacHex(secret, `${ts}.${payload}`);
    return h.call('POST', '/api/stripe/webhook', payload, null, { 'Stripe-Signature': `t=${ts},v1=${sig}` });
  };
  const ev = { id: 'evt_1', type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', payment_status: 'paid', metadata: { campaign_id: String(c.id), credit_used_cents: '0' } } } };
  assert.equal((await hook(ev, 'whsec_wrong')).status, 400);
  assert.equal((await hook(ev)).ok, true);
  assert.equal((await hook(ev)).duplicate, true);
  assert.equal(h.db('SELECT status FROM campaigns WHERE id = ?', c.id)[0].status, 'open');

  const t = await tester(h);
  assert.match((await h.call('POST', '/api/payouts/request', {}, t)).error, /Set up payouts/);
  assert.equal((await h.call('POST', '/api/payouts/onboard', {}, t)).url, 'https://connect.stripe.com/setup/x');
  await hook({ id: 'evt_2', type: 'account.updated', data: { object: { id: 'acct_1', payouts_enabled: true } } });
  h.db("UPDATE users SET balance_cents = 500 WHERE email = 'tess@example.com'");
  assert.match((await h.call('POST', '/api/payouts/request', {}, t)).error, /start at \$10/);
  h.db("UPDATE users SET balance_cents = 1250 WHERE email = 'tess@example.com'");
  const p = await h.call('POST', '/api/payouts/request', {}, t);
  assert.equal(p.payout.amountCents, 1250);
  assert.equal((await h.call('GET', '/api/me', undefined, t)).balanceCents, 0);
  const tr = h.stripeCalls.find((x) => x.url.endsWith('transfers')).body;
  assert.equal(tr.destination, 'acct_1');
});

test('Google sign-in: a correctly signed ID token works, a wrong audience does not', async () => {
  _resetGoogleKeyCache();
  const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u) => (String(u).includes('googleapis.com/oauth2/v3/certs') ? new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'max-age=60' } }) : realFetch(u));
  try {
    const h = harness({ GOOGLE_CLIENT_ID: 'client-123.apps.googleusercontent.com', DEV_AUTH: '0' });
    const mint = async (aud) => {
      const head = enc({ alg: 'RS256', kid: 'k1', typ: 'JWT' });
      const body = enc({ iss: 'https://accounts.google.com', aud, sub: '1234', email: 'Real@Gmail.com', email_verified: true, name: 'Real Person', exp: Math.floor(h.now / 1000) + 3600 });
      const sig = Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${head}.${body}`))).toString('base64url');
      return `${head}.${body}.${sig}`;
    };
    const ok = await h.call('POST', '/api/auth/google', { credential: await mint('client-123.apps.googleusercontent.com') });
    assert.equal(ok.user.email, 'real@gmail.com');
    assert.equal((await h.call('GET', '/api/me', undefined, ok.token)).user.email, 'real@gmail.com');
    const bad = await h.call('POST', '/api/auth/google', { credential: await mint('someone-else') });
    assert.equal(bad.status, 401);
    assert.equal((await h.call('POST', '/api/auth/dev', { email: 'x@example.com' })).status, 404, 'dev sign-in is off in production');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('CORS only answers allowed origins', async () => {
  const h = harness();
  const r = await worker.fetch(new Request('https://amni-test.example/api/config', { headers: { Origin: 'https://amni-scient.com' } }), h.env);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://amni-scient.com');
  const r2 = await worker.fetch(new Request('https://amni-test.example/api/config', { headers: { Origin: 'https://evil.example' } }), h.env);
  assert.equal(r2.headers.get('Access-Control-Allow-Origin'), null);
});
