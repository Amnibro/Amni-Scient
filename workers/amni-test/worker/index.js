// Amni-Test API (Cloudflare Worker + D1). Spec: docs/amni-test/README.md
import * as R from './rules.js';
import { now, one, all, run, randomBytes, b64url, sha256Hex, logEvent, testerDelta, devDelta, settle, devCredit } from './db.js';
import { verifyGoogleIdToken } from './google.js';
import { stripe, verifyStripeSignature } from './stripe.js';
import { sweep } from './sweep.js';

const SESSION_DAYS = 30;
const HOLDING = "('accepted','invited','active','completed_pending','completed')";
const RUNNING = ['accepted', 'invited', 'active', 'completed_pending', 'exit_pending'];

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };
const int = (v, d = 0) => (Number.isFinite(+v) ? Math.trunc(+v) : d);
const text = (v, max) => String(v ?? '').trim().slice(0, max);
const cfg = (env) => ({
  feePct: int(env.FEE_PCT, 30),
  feeMinCents: int(env.FEE_MIN_CENTS, 50),
  payoutMinCents: int(env.PAYOUT_MIN_CENTS, 1000),
  reportThreshold: Math.max(1, int(env.REPORT_THRESHOLD, 2)),
  admins: String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean),
  site: env.SITE_URL || 'https://amni-scient.com/test/',
});

// ---------- HTTP plumbing ----------

function cors(env, req) {
  const origin = req.headers.get('Origin');
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = origin && (allowed.includes(origin) || (env.DEV_AUTH === '1' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)));
  return ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : {};
}
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } });

async function body(req) {
  if (req.method !== 'POST') return {};
  const t = await req.text();
  if (t.length > 20000) fail(413, 'Request too large');
  if (!t) return {};
  try { return JSON.parse(t); } catch { fail(400, 'Body must be JSON'); }
}

// ---------- auth ----------

async function startSession(env, user) {
  const token = b64url(randomBytes(32));
  const t = now(env);
  await run(env, 'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)', await sha256Hex(token), user.id, t, t + SESSION_DAYS * R.DAY);
  return token;
}

async function upsertUser(env, { email, name, sub }) {
  const t = now(env);
  let u = await one(env, 'SELECT * FROM users WHERE email = ?', email);
  if (!u) {
    await run(env, 'INSERT INTO users (email, name, google_sub, created_at) VALUES (?,?,?,?)', email, name || '', sub || null, t);
    u = await one(env, 'SELECT * FROM users WHERE email = ?', email);
  } else if (sub && !u.google_sub) {
    await run(env, 'UPDATE users SET google_sub = ? WHERE id = ?', sub, u.id);
  }
  return u;
}

async function auth(env, req) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/);
  if (!m) fail(401, 'Sign in first');
  const s = await one(env, 'SELECT user_id, expires_at FROM sessions WHERE token_hash = ?', await sha256Hex(m[1]));
  if (!s || s.expires_at < now(env)) fail(401, 'Your session expired. Sign in again');
  const u = await one(env, 'SELECT * FROM users WHERE id = ?', s.user_id);
  if (!u) fail(401, 'Sign in first');
  u.isAdmin = cfg(env).admins.includes(u.email);
  return u;
}

const mustBeActive = (u, what) => {
  if (u.status === 'review') fail(403, `Your account is under review, so you can't ${what} right now`);
  if (u.status !== 'active') fail(403, `Your account is ${u.status}, so you can't ${what}`);
};

// ---------- views ----------

function meView(u) {
  const ts = R.standing(u.tester_merits, u.tester_demerits);
  const lvl = R.levelFor(ts);
  return {
    user: { id: u.id, email: u.email, name: u.name, status: u.status, statusReason: u.status_reason, adult: !!u.adult_at, isAdmin: !!u.isAdmin, appealUsed: !!u.appeal_used, appealDecision: u.appeal_decision || null, payoutsEnabled: !!u.payouts_enabled, stripeLinked: !!u.stripe_account_id },
    tester: { merits: u.tester_merits, demerits: u.tester_demerits, standing: ts, level: lvl.level, priceCents: lvl.priceCents, nextLevelAt: R.LEVELS[lvl.level]?.min ?? null, maxActive: R.MAX_ACTIVE },
    dev: { merits: u.dev_merits, demerits: u.dev_demerits, standing: R.standing(u.dev_merits, u.dev_demerits) },
    balanceCents: u.balance_cents,
    creditCents: u.credit_cents,
  };
}

async function devScore(env, ownerId) {
  const o = await one(env, 'SELECT dev_merits, dev_demerits FROM users WHERE id = ?', ownerId);
  const r = await one(env, `SELECT SUM(CASE WHEN a.status='completed' THEN 1 ELSE 0 END) AS done, SUM(CASE WHEN a.status IN ('completed','excused','exited','removed') THEN 1 ELSE 0 END) AS finished
    FROM assignments a JOIN campaigns c ON c.id = a.campaign_id WHERE c.owner_id = ?`, ownerId);
  return { standing: R.standing(o?.dev_merits || 0, o?.dev_demerits || 0), completed: r?.done || 0, finished: r?.finished || 0 };
}

function assignmentView(a, c, filed, t) {
  const days = filed.map((x) => x.day);
  const day = a.started_at ? R.dayIndex(a.started_at, t) : null;
  const open = a.status === 'active' && a.started_at ? R.openCheckin(a.started_at, t, days) : null;
  const next = a.status === 'active' && a.started_at ? R.nextCheckin(a.started_at, t, days) : null;
  const deadline = a.status === 'accepted' ? a.accepted_at + R.HOURS_72 : a.status === 'invited' ? a.invited_at + R.HOURS_72 : (a.status === 'completed_pending' || a.status === 'exit_pending') ? a.pending_at + R.HOURS_72 : null;
  return {
    id: a.id, status: a.status, priceCents: a.price_cents, paidCents: a.paid_cents, claimCode: a.claim_code,
    acceptedAt: a.accepted_at, invitedAt: a.invited_at, startedAt: a.started_at, finishedAt: a.finished_at, deadline,
    day, filedDays: days, openCheckin: open?.day ?? null, nextCheckin: next ? { day: next.day, opensDay: next.from, closesDay: next.to } : null,
    missedCheckins: a.missed_checkins, helpfulCount: a.helpful_count, exitReason: a.exit_reason, disputeNote: a.dispute_note,
    campaign: { id: c.id, appName: c.app_name, package: c.package, description: c.description, instructions: c.instructions, verification: c.verification },
    links: { optIn: R.optInUrl(c.package), install: R.installUrl(c.package, a.claim_code) },
  };
}

// ---------- tester ----------

async function listTests(env, u) {
  const price = (maxLevel) => R.testerPrice(R.standing(u.tester_merits, u.tester_demerits), maxLevel);
  const rows = await all(env, `SELECT c.*, (SELECT COUNT(*) FROM assignments a WHERE a.campaign_id = c.id AND a.status IN ${HOLDING}) AS filled
    FROM campaigns c WHERE c.status = 'open' AND c.owner_id != ? AND NOT EXISTS (SELECT 1 FROM assignments a WHERE a.campaign_id = c.id AND a.tester_id = ?)
    ORDER BY c.paid_at DESC LIMIT 100`, u.id, u.id);
  const out = [];
  for (const c of rows) {
    const p = price(c.max_level);
    if (c.filled >= c.slots || c.budget_cents - c.reserved_cents - c.spent_cents < p) continue;
    out.push({ id: c.id, appName: c.app_name, package: c.package, description: c.description, verification: c.verification, slotsLeft: c.slots - c.filled, maxLevel: c.max_level, yourPriceCents: p, developer: await devScore(env, c.owner_id), openedAt: c.paid_at });
  }
  return { tests: out };
}

async function accept(env, u, campaignId) {
  mustBeActive(u, 'take tests');
  if (!u.adult_at) fail(403, 'Confirm you are 18 or older first');
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', campaignId);
  if (!c || c.status !== 'open') fail(404, 'That test is not open');
  if (c.owner_id === u.id) fail(400, "You can't test your own app");
  const active = await one(env, `SELECT COUNT(*) AS n FROM assignments WHERE tester_id = ? AND status IN ('accepted','invited','active','completed_pending','exit_pending')`, u.id);
  if (active.n >= R.MAX_ACTIVE) fail(400, `You can run ${R.MAX_ACTIVE} tests at a time`);
  if (await one(env, 'SELECT id FROM assignments WHERE campaign_id = ? AND tester_id = ?', c.id, u.id)) fail(400, 'You already took this test');
  const filled = await one(env, `SELECT COUNT(*) AS n FROM assignments WHERE campaign_id = ? AND status IN ${HOLDING}`, c.id);
  if (filled.n >= c.slots) fail(409, 'All slots are taken');
  const price = R.testerPrice(R.standing(u.tester_merits, u.tester_demerits), c.max_level);
  const ok = await run(env, "UPDATE campaigns SET reserved_cents = reserved_cents + ? WHERE id = ? AND status = 'open' AND budget_cents - reserved_cents - spent_cents >= ?", price, c.id, price);
  if (!ok) fail(409, 'This test has no budget left');
  let code;
  for (let i = 0; i < 5 && !code; i++) {
    const c2 = R.makeCode(randomBytes(8));
    if (!(await one(env, 'SELECT id FROM assignments WHERE claim_code = ?', c2))) code = c2;
  }
  await run(env, "INSERT INTO assignments (campaign_id, tester_id, price_cents, status, claim_code, accepted_at) VALUES (?,?,?,'accepted',?,?)", c.id, u.id, price, code, now(env));
  const a = await one(env, 'SELECT * FROM assignments WHERE claim_code = ?', code);
  return { assignment: assignmentView(a, c, [], now(env)) };
}

async function myAssignments(env, u) {
  const t = now(env);
  const rows = await all(env, 'SELECT * FROM assignments WHERE tester_id = ? ORDER BY accepted_at DESC LIMIT 200', u.id);
  const out = [];
  for (const a of rows) {
    const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', a.campaign_id);
    const filed = await all(env, 'SELECT day FROM checkins WHERE assignment_id = ?', a.id);
    out.push(assignmentView(a, c, filed, t));
  }
  return { assignments: out };
}

async function ownAssignment(env, u, id) {
  const a = await one(env, 'SELECT * FROM assignments WHERE id = ?', id);
  if (!a || a.tester_id !== u.id) fail(404, 'Test not found');
  return a;
}

async function start(env, u, id) {
  const a = await ownAssignment(env, u, id);
  if (a.status === 'active') return { ok: true };
  if (a.status !== 'invited') fail(400, a.status === 'accepted' ? 'Wait until the developer adds you to the test' : 'This test is not waiting to start');
  await run(env, "UPDATE assignments SET status = 'active', started_at = ? WHERE id = ? AND status = 'invited'", now(env), a.id);
  return { ok: true };
}

async function checkin(env, u, id, b) {
  const a = await ownAssignment(env, u, id);
  if (a.status !== 'active') fail(400, 'This test is not running');
  const filed = (await all(env, 'SELECT day FROM checkins WHERE assignment_id = ?', a.id)).map((x) => x.day);
  const w = R.openCheckin(a.started_at, now(env), filed);
  if (!w) fail(400, 'No check-in is open right now');
  const worked = text(b.worked, 4000), broke = text(b.broke, 4000), device = text(b.device, 200);
  if (worked.length + broke.length < 20) fail(400, 'Write at least a couple of sentences about what worked and what broke');
  await run(env, 'INSERT INTO checkins (assignment_id, day, worked, broke, device, created_at) VALUES (?,?,?,?,?,?)', a.id, w.day, worked, broke, device, now(env));
  if (w.day === 14) {
    await run(env, "UPDATE assignments SET status = 'completed_pending', pending_at = ? WHERE id = ? AND status = 'active'", now(env), a.id);
    // SDK campaigns: a ping on day 13 or later proves the app stayed installed, so pay now.
    const c = await one(env, 'SELECT verification FROM campaigns WHERE id = ?', a.campaign_id);
    const late = c.verification === 'sdk' && (await one(env, 'SELECT day FROM pings WHERE assignment_id = ? AND day >= 13 LIMIT 1', a.id));
    if (late) {
      await complete(env, await one(env, 'SELECT * FROM assignments WHERE id = ?', a.id), 'Confirmed by the app');
      return { ok: true, day: w.day, status: 'completed' };
    }
    return { ok: true, day: w.day, status: 'completed_pending' };
  }
  return { ok: true, day: w.day };
}

async function exitTest(env, u, id, b) {
  const a = await ownAssignment(env, u, id);
  if (!['accepted', 'invited', 'active'].includes(a.status)) fail(400, 'This test is not running');
  const reason = text(b.reason, 40), note = text(b.note, 2000);
  const excusable = reason in R.EXCUSED_REASONS;
  if (!excusable && !R.UNEXCUSED_REASONS.includes(reason)) fail(400, 'Pick a reason');
  if (excusable && note.length < 10) fail(400, 'Say what went wrong so the developer can check');
  await run(env, 'UPDATE assignments SET exit_reason = ?, exit_note = ? WHERE id = ?', reason, note, a.id);
  if (a.status !== 'active') {
    // Leaving before starting costs nothing beyond the slot.
    await settle(env, a, 'expired', 0, { note: 'Left before starting' });
    return { ok: true, status: 'expired' };
  }
  if (excusable) {
    await run(env, "UPDATE assignments SET status = 'exit_pending', pending_at = ? WHERE id = ? AND status = 'active'", now(env), a.id);
    return { ok: true, status: 'exit_pending' };
  }
  await settle(env, a, 'exited', 0, { note: 'Left the test' });
  await testerDelta(env, u.id, 'unexcused_exit', 0, R.DEMERIT.unexcused_exit, a.id, `Left a test (${reason})`);
  return { ok: true, status: 'exited' };
}

// ---------- reports, appeals ----------

async function report(env, u, b) {
  const a = await one(env, 'SELECT * FROM assignments WHERE id = ?', int(b.assignmentId));
  if (!a) fail(404, 'Test not found');
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', a.campaign_id);
  const kind = b.kind === 'campaign' ? 'campaign' : 'tester';
  let target;
  if (kind === 'tester') { if (c.owner_id !== u.id) fail(403, 'You can only report testers on your own apps'); target = a.tester_id; }
  else { if (a.tester_id !== u.id) fail(403, 'You can only report apps you are testing'); target = c.owner_id; }
  const category = text(b.category, 40);
  if (!R.REPORT_CATEGORIES.includes(category)) fail(400, 'Pick a category');
  const note = text(b.note, 2000);
  if (note.length < 10) fail(400, 'Describe what happened');
  if (await one(env, 'SELECT id FROM reports WHERE reporter_id = ? AND assignment_id = ?', u.id, a.id)) fail(409, 'You already reported this');
  await run(env, 'INSERT INTO reports (reporter_id, target_id, kind, assignment_id, category, note, created_at) VALUES (?,?,?,?,?,?,?)', u.id, target, kind, a.id, category, note, now(env));
  const tu = await one(env, 'SELECT * FROM users WHERE id = ?', target);
  if (tu.status === 'active') {
    await run(env, "UPDATE users SET status = 'review', status_reason = 'A report is being reviewed', status_at = ? WHERE id = ?", now(env), target);
    await logEvent(env, target, 'account', 'review', { note: 'Someone reported your account. New tests and payouts are paused while it is reviewed; running tests continue.' });
  }
  const since = now(env) - 30 * R.DAY;
  const distinct = await one(env, "SELECT COUNT(DISTINCT reporter_id) AS n FROM reports WHERE target_id = ? AND status != 'dismissed' AND created_at >= ?", target, since);
  if (distinct.n >= cfg(env).reportThreshold) {
    await run(env, "UPDATE reports SET status = 'upheld', resolved_at = ? WHERE target_id = ? AND status = 'open'", now(env), target);
    await terminate(env, target, `Reported by ${distinct.n} different users`, false);
  }
  return { ok: true };
}

export async function terminate(env, userId, reason, fraud) {
  const t = now(env);
  await run(env, "UPDATE users SET status = 'terminated', status_reason = ?, status_at = ? WHERE id = ?", reason, t, userId);
  await logEvent(env, userId, 'account', 'terminated', { note: `${reason}. You can appeal once.` });
  // Their tests as a tester: pay for days done unless fraud.
  for (const a of await all(env, `SELECT * FROM assignments WHERE tester_id = ? AND status IN ('accepted','invited','active','completed_pending','exit_pending')`, userId)) {
    const pay = fraud ? 0 : a.status === 'completed_pending' ? R.completionPay(a.price_cents, (await one(env, 'SELECT COUNT(*) AS n FROM checkins WHERE assignment_id = ?', a.id)).n) : R.proRataPay(a.price_cents, a.started_at, t);
    await settle(env, a, 'removed', pay, { note: 'Account terminated' });
  }
  if (fraud) {
    const u = await one(env, 'SELECT balance_cents FROM users WHERE id = ?', userId);
    await run(env, 'UPDATE users SET forfeited_cents = forfeited_cents + balance_cents, balance_cents = 0 WHERE id = ?', userId);
    await logEvent(env, userId, 'tester', 'forfeited', { cents: -u.balance_cents, note: 'Balance forfeited for fraud' });
  }
  // Their campaigns as a developer: close, and excuse their testers with pro-rata pay.
  for (const c of await all(env, "SELECT * FROM campaigns WHERE owner_id = ? AND status = 'open'", userId)) {
    for (const a of await all(env, `SELECT * FROM assignments WHERE campaign_id = ? AND status IN ('accepted','invited','active','completed_pending','exit_pending')`, c.id)) {
      const pay = a.status === 'completed_pending' ? R.completionPay(a.price_cents, (await one(env, 'SELECT COUNT(*) AS n FROM checkins WHERE assignment_id = ?', a.id)).n) : R.proRataPay(a.price_cents, a.started_at, t);
      await settle(env, a, 'excused', pay, { note: 'The developer account was closed' });
    }
    await closeCampaign(env, c.id);
  }
}

async function appeal(env, u, b) {
  if (u.status !== 'banned' && u.status !== 'terminated') fail(400, 'Only banned or terminated accounts can appeal');
  if (u.appeal_used) fail(400, 'You already used your one appeal');
  const t = text(b.text, 4000);
  if (t.length < 20) fail(400, 'Explain why the decision should change');
  await run(env, 'UPDATE users SET appeal_used = 1, appeal_text = ?, appeal_at = ? WHERE id = ?', t, now(env), u.id);
  return { ok: true };
}

// ---------- developer ----------

async function createCampaign(env, u, b) {
  mustBeActive(u, 'post apps');
  if (R.standing(u.dev_merits, u.dev_demerits) <= R.BAN_AT) fail(403, 'Your developer standing is too low to post new tests');
  const appName = text(b.appName, 80), pkg = text(b.package, 150);
  if (appName.length < 2) fail(400, 'Name the app');
  if (!R.validPackage(pkg)) fail(400, 'Package name looks wrong (like com.example.app)');
  const slots = int(b.slots, 12), maxLevel = int(b.maxLevel, 1);
  if (slots < 1 || slots > 100) fail(400, 'Testers must be between 1 and 100');
  if (maxLevel < 1 || maxLevel > 5) fail(400, 'Level must be 1 to 5');
  const verification = b.verification === 'sdk' ? 'sdk' : 'manual';
  const k = cfg(env);
  const cost = R.campaignCost({ slots, maxLevel, feePct: k.feePct, feeMinCents: k.feeMinCents });
  await run(env, `INSERT INTO campaigns (owner_id, app_name, package, description, instructions, slots, max_level, max_price_cents, fee_cents, budget_cents, verification, sdk_key, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, u.id, appName, pkg, text(b.description, 2000), text(b.instructions, 4000), slots, maxLevel, cost.maxPrice, cost.fee, cost.budget, verification, 'atk_' + b64url(randomBytes(18)), now(env));
  const c = await one(env, 'SELECT * FROM campaigns WHERE owner_id = ? ORDER BY id DESC LIMIT 1', u.id);
  return { campaign: await campaignView(env, c, u), cost };
}

async function ownCampaign(env, u, id) {
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', id);
  if (!c || (c.owner_id !== u.id && !u.isAdmin)) fail(404, 'Campaign not found');
  return c;
}

async function campaignView(env, c, u, detail = false) {
  const counts = await all(env, 'SELECT status, COUNT(*) AS n FROM assignments WHERE campaign_id = ? GROUP BY status', c.id);
  const by = Object.fromEntries(counts.map((r) => [r.status, r.n]));
  const k = cfg(env);
  const cost = R.campaignCost({ slots: c.slots, maxLevel: c.max_level, feePct: k.feePct, feeMinCents: k.feeMinCents, creditCents: u.credit_cents });
  const v = {
    id: c.id, appName: c.app_name, package: c.package, description: c.description, instructions: c.instructions, slots: c.slots, maxLevel: c.max_level,
    maxPriceCents: c.max_price_cents, feeCents: c.fee_cents, budgetCents: c.budget_cents, reservedCents: c.reserved_cents, spentCents: c.spent_cents, creditedCents: c.credited_cents,
    verification: c.verification, status: c.status, paidAt: c.paid_at, createdAt: c.created_at, counts: by, dueCents: c.status === 'draft' ? cost.due : 0, creditApplied: c.status === 'draft' ? cost.creditUsed : c.credit_used_cents,
    optInUrl: R.optInUrl(c.package),
  };
  if (!detail) return v;
  v.sdkKey = c.sdk_key;
  const t = now(env);
  const rows = await all(env, `SELECT a.*, u.email, u.tester_merits, u.tester_demerits, (SELECT MAX(day) FROM pings p WHERE p.assignment_id = a.id) AS last_ping_day,
    (SELECT COUNT(*) FROM pings p WHERE p.assignment_id = a.id) AS ping_days FROM assignments a JOIN users u ON u.id = a.tester_id WHERE a.campaign_id = ? ORDER BY a.accepted_at`, c.id);
  v.assignments = [];
  for (const a of rows) {
    const checkins = await all(env, 'SELECT id, day, worked, broke, device, helpful, created_at FROM checkins WHERE assignment_id = ? ORDER BY day', a.id);
    const view = assignmentView(a, c, checkins, t);
    v.assignments.push({ ...view, tester: { email: a.email, level: R.levelFor(R.standing(a.tester_merits, a.tester_demerits)).level }, lastPingDay: a.last_ping_day, pingDays: a.ping_days, installClaimed: !!a.install_id, exitNote: a.exit_note, checkins: checkins.map((x) => ({ id: x.id, day: x.day, worked: x.worked, broke: x.broke, device: x.device, helpful: !!x.helpful, at: x.created_at })) });
  }
  v.emails = rows.filter((a) => ['accepted', 'invited', 'active', 'completed_pending'].includes(a.status)).map((a) => a.email);
  return v;
}

async function checkout(env, u, c) {
  mustBeActive(u, 'pay for tests');
  if (c.status !== 'draft') fail(400, 'This campaign is already paid');
  const k = cfg(env);
  const cost = R.campaignCost({ slots: c.slots, maxLevel: c.max_level, feePct: k.feePct, feeMinCents: k.feeMinCents, creditCents: u.credit_cents });
  if (cost.due === 0 || env.DEV_FAKE_PAY === '1') {
    await fund(env, c.id, cost.creditUsed, null);
    return { funded: true };
  }
  const due = Math.max(cost.due, 50); // Stripe's minimum charge
  const s = await stripe(env, 'checkout/sessions', {
    mode: 'payment',
    customer_email: u.email,
    client_reference_id: String(c.id),
    success_url: `${k.site}app.html?paid=${c.id}#dev`,
    cancel_url: `${k.site}app.html?cancelled=${c.id}#dev`,
    line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: due, product_data: { name: `Amni-Test: ${c.slots} testers for ${c.app_name}`, description: `Up to level ${c.max_level} testers, 14-day closed test${cost.creditUsed ? `, $${(cost.creditUsed / 100).toFixed(2)} credit applied` : ''}` } } }],
    metadata: { campaign_id: String(c.id), credit_used_cents: String(cost.creditUsed) },
    payment_intent_data: { metadata: { campaign_id: String(c.id) } },
  }, { idempotencyKey: `checkout-${c.id}-${cost.due}` });
  await run(env, 'UPDATE campaigns SET checkout_session_id = ? WHERE id = ?', s.id, c.id);
  return { url: s.url };
}

export async function fund(env, campaignId, creditUsed, sessionId) {
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', campaignId);
  if (!c || c.status !== 'draft') return false;
  const owner = await one(env, 'SELECT credit_cents FROM users WHERE id = ?', c.owner_id);
  const use = Math.min(creditUsed || 0, owner.credit_cents);
  const ok = await run(env, "UPDATE campaigns SET status = 'open', paid_at = ?, credit_used_cents = ?, checkout_session_id = COALESCE(?, checkout_session_id) WHERE id = ? AND status = 'draft'", now(env), use, sessionId, c.id);
  if (ok && use) {
    await run(env, 'UPDATE users SET credit_cents = credit_cents - ? WHERE id = ?', use, c.owner_id);
    await logEvent(env, c.owner_id, 'dev', 'credit_used', { cents: -use, note: `Credit applied to ${c.app_name}` });
  }
  return !!ok;
}

async function markInvited(env, c, b) {
  if (c.status !== 'open') fail(400, 'This campaign is not open');
  const ids = Array.isArray(b.assignmentIds) ? b.assignmentIds.map((x) => int(x)) : null;
  const rows = await all(env, "SELECT id FROM assignments WHERE campaign_id = ? AND status = 'accepted'", c.id);
  let n = 0;
  for (const r of rows) if (!ids || ids.includes(r.id)) n += await run(env, "UPDATE assignments SET status = 'invited', invited_at = ? WHERE id = ? AND status = 'accepted'", now(env), r.id);
  return { ok: true, invited: n };
}

export async function closeCampaign(env, id) {
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', id);
  if (!c || c.status === 'closed' || c.status === 'cancelled') return 0;
  if (c.status === 'draft') { await run(env, "UPDATE campaigns SET status = 'cancelled', closed_at = ? WHERE id = ?", now(env), id); return 0; }
  await run(env, "UPDATE campaigns SET status = 'closed', closed_at = ? WHERE id = ? AND status = 'open'", now(env), id);
  const holding = (await one(env, `SELECT COUNT(*) AS n FROM assignments WHERE campaign_id = ? AND status IN ('accepted','invited','active','completed_pending','exit_pending','completed')`, id)).n;
  const unusedSlots = Math.max(c.slots - holding, 0);
  const back = c.budget_cents - c.reserved_cents - c.spent_cents - c.credited_cents + unusedSlots * Math.round(c.fee_cents / c.slots);
  if (back > 0) {
    await run(env, 'UPDATE campaigns SET credited_cents = credited_cents + ? WHERE id = ?', back, id);
    await devCredit(env, c.owner_id, back, 'campaign_credit', `Unused budget from ${c.app_name}`);
  }
  return back;
}

async function campaignAssignment(env, u, id) {
  const a = await one(env, 'SELECT * FROM assignments WHERE id = ?', id);
  if (!a) fail(404, 'Test not found');
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', a.campaign_id);
  if (c.owner_id !== u.id && !u.isAdmin) fail(404, 'Test not found');
  return { a, c };
}

async function helpful(env, u, checkinId) {
  const ck = await one(env, 'SELECT * FROM checkins WHERE id = ?', checkinId);
  if (!ck) fail(404, 'Check-in not found');
  const { a } = await campaignAssignment(env, u, ck.assignment_id);
  if (ck.helpful) return { ok: true };
  await run(env, 'UPDATE checkins SET helpful = 1 WHERE id = ?', ck.id);
  if (a.helpful_count < R.MAX_HELPFUL) {
    await run(env, 'UPDATE assignments SET helpful_count = helpful_count + 1 WHERE id = ?', a.id);
    await testerDelta(env, a.tester_id, 'helpful', R.MERIT.helpful, 0, a.id, 'A developer marked your feedback helpful');
  }
  return { ok: true };
}

export async function complete(env, a, note) {
  const n = (await one(env, 'SELECT COUNT(*) AS n FROM checkins WHERE assignment_id = ?', a.id)).n;
  const pay = R.completionPay(a.price_cents, n);
  if (!(await settle(env, a, 'completed', pay, { completed: true, note }))) return false;
  await testerDelta(env, a.tester_id, 'completed', R.MERIT.completed, 0, a.id, 'Finished a 14-day test');
  const c = await one(env, 'SELECT owner_id FROM campaigns WHERE id = ?', a.campaign_id);
  await devDelta(env, c.owner_id, 'tester_completed', 1, 0, a.id, 'A tester finished your test');
  return true;
}

export async function excuse(env, a, note) {
  const pay = R.proRataPay(a.price_cents, a.started_at, a.pending_at || now(env));
  if (!(await settle(env, a, 'excused', pay, { note }))) return false;
  const c = await one(env, 'SELECT owner_id, app_name FROM campaigns WHERE id = ?', a.campaign_id);
  await devDelta(env, c.owner_id, 'tester_exit_' + a.exit_reason, 0, R.EXCUSED_REASONS[a.exit_reason] || 1, a.id, `A tester left ${c.app_name}: ${a.exit_reason}`);
  return true;
}

async function confirm(env, u, id) {
  const { a } = await campaignAssignment(env, u, id);
  if (a.status === 'exit_pending') { await excuse(env, a, 'Exit accepted by the developer'); return { ok: true }; }
  if (a.status !== 'completed_pending') fail(400, 'Nothing to confirm');
  await complete(env, a, 'Confirmed by the developer');
  return { ok: true };
}

async function dispute(env, u, id, b) {
  const { a } = await campaignAssignment(env, u, id);
  if (a.status !== 'completed_pending' && a.status !== 'exit_pending') fail(400, 'Only a pending completion or exit can be disputed');
  if (a.dispute_at) fail(400, 'Already disputed');
  const note = text(b.note, 2000);
  if (note.length < 10) fail(400, 'Explain what is wrong');
  await run(env, 'UPDATE assignments SET dispute_note = ?, dispute_at = ? WHERE id = ?', note, now(env), a.id);
  return { ok: true };
}

// ---------- payouts ----------

async function onboard(env, u) {
  const k = cfg(env);
  let acct = u.stripe_account_id;
  if (!acct) {
    const a = await stripe(env, 'accounts', { type: 'express', country: 'US', email: u.email, business_type: 'individual', capabilities: { transfers: { requested: true } }, metadata: { user_id: String(u.id) } }, { idempotencyKey: `acct-${u.id}` });
    acct = a.id;
    await run(env, 'UPDATE users SET stripe_account_id = ? WHERE id = ?', acct, u.id);
  }
  const link = await stripe(env, 'account_links', { account: acct, refresh_url: `${k.site}app.html?onboard=retry#tester`, return_url: `${k.site}app.html?onboard=done#tester`, type: 'account_onboarding' });
  return { url: link.url };
}

async function requestPayout(env, u) {
  // Earned money stays payable after a ban or termination; fraud already zeroed the balance.
  if (u.status === 'review') fail(403, 'Payouts are paused while your account is under review');
  if (!u.stripe_account_id || !u.payouts_enabled) fail(400, 'Set up payouts with Stripe first');
  const min = cfg(env).payoutMinCents;
  if (u.balance_cents < min) fail(400, `Payouts start at $${(min / 100).toFixed(2)}`);
  const amount = u.balance_cents;
  const ok = await run(env, 'UPDATE users SET balance_cents = balance_cents - ? WHERE id = ? AND balance_cents >= ?', amount, u.id, amount);
  if (!ok) fail(409, 'Balance changed, try again');
  await run(env, "INSERT INTO payouts (user_id, amount_cents, status, created_at) VALUES (?,?, 'pending', ?)", u.id, amount, now(env));
  const p = await one(env, 'SELECT * FROM payouts WHERE user_id = ? ORDER BY id DESC LIMIT 1', u.id);
  try {
    const tr = await stripe(env, 'transfers', { amount, currency: 'usd', destination: u.stripe_account_id, metadata: { payout_id: String(p.id), user_id: String(u.id) } }, { idempotencyKey: `payout-${p.id}` });
    await run(env, "UPDATE payouts SET status = 'paid', stripe_transfer_id = ? WHERE id = ?", tr.id, p.id);
    await logEvent(env, u.id, 'tester', 'payout', { cents: -amount, note: 'Sent to your Stripe account' });
    return { payout: { id: p.id, amountCents: amount, status: 'paid' } };
  } catch (e) {
    await run(env, "UPDATE payouts SET status = 'failed', error = ? WHERE id = ?", String(e.message).slice(0, 500), p.id);
    await run(env, 'UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?', amount, u.id);
    fail(502, `Stripe could not send the payout: ${e.message}`);
  }
}

// ---------- Stripe webhook ----------

async function webhook(env, req) {
  const payload = await req.text();
  if (!(await verifyStripeSignature(payload, req.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET, now(env)))) return json({ error: 'bad signature' }, 400);
  const ev = JSON.parse(payload);
  if (await one(env, 'SELECT id FROM stripe_events WHERE id = ?', ev.id)) return json({ ok: true, duplicate: true });
  await run(env, 'INSERT INTO stripe_events (id, created_at) VALUES (?,?)', ev.id, now(env));
  const o = ev.data?.object || {};
  if (ev.type === 'checkout.session.completed' && o.payment_status === 'paid') {
    await fund(env, int(o.metadata?.campaign_id), int(o.metadata?.credit_used_cents), o.id);
  } else if (ev.type === 'account.updated') {
    await run(env, 'UPDATE users SET payouts_enabled = ? WHERE stripe_account_id = ?', o.payouts_enabled ? 1 : 0, o.id);
  }
  return json({ ok: true });
}

// ---------- SDK ----------

async function sdkCampaign(env, b) {
  const c = await one(env, 'SELECT * FROM campaigns WHERE sdk_key = ?', text(b.key, 100));
  if (!c) fail(401, 'Unknown SDK key');
  if (c.package !== text(b.package, 150)) fail(400, 'This SDK key belongs to another app');
  return c;
}

async function sdkClaim(env, b) {
  const c = await sdkCampaign(env, b);
  const code = R.normaliseCode(b.code), installId = text(b.installId, 64);
  if (!code) fail(400, 'That code does not look right');
  if (installId.length < 8) fail(400, 'Missing install ID');
  const a = await one(env, 'SELECT * FROM assignments WHERE claim_code = ? AND campaign_id = ?', code, c.id);
  if (!a) fail(404, 'Unknown code for this app');
  if (a.install_id && a.install_id !== installId) fail(409, 'This code is already used on another install');
  if (!['invited', 'active'].includes(a.status)) fail(400, a.status === 'accepted' ? 'The developer has not added this tester yet' : 'This test is not running');
  await run(env, 'UPDATE assignments SET install_id = ? WHERE id = ?', installId, a.id);
  if (a.status === 'invited') await run(env, "UPDATE assignments SET status = 'active', started_at = ? WHERE id = ? AND status = 'invited'", now(env), a.id);
  const fresh = await one(env, 'SELECT id, status FROM assignments WHERE id = ?', a.id);
  return { ok: true, assignment: fresh };
}

async function sdkPing(env, b) {
  const c = await sdkCampaign(env, b);
  const a = await one(env, 'SELECT * FROM assignments WHERE campaign_id = ? AND install_id = ?', c.id, text(b.installId, 64));
  if (!a) fail(404, 'This install has not claimed a test');
  if (!a.started_at) return { ok: true, day: null };
  const day = R.dayIndex(a.started_at, now(env));
  await run(env, 'INSERT OR IGNORE INTO pings (assignment_id, day, at) VALUES (?,?,?)', a.id, day, now(env));
  return { ok: true, day };
}

// ---------- admin ----------

function mustAdmin(u) { if (!u.isAdmin) fail(403, 'Admins only'); }

async function adminQueue(env) {
  const reports = await all(env, `SELECT r.*, a.campaign_id, ru.email AS reporter_email, tu.email AS target_email, tu.status AS target_status, c.app_name
    FROM reports r JOIN users ru ON ru.id = r.reporter_id JOIN users tu ON tu.id = r.target_id JOIN assignments a ON a.id = r.assignment_id JOIN campaigns c ON c.id = a.campaign_id
    WHERE r.status = 'open' ORDER BY r.created_at`);
  const disputes = await all(env, `SELECT a.*, c.app_name, u.email AS tester_email FROM assignments a JOIN campaigns c ON c.id = a.campaign_id JOIN users u ON u.id = a.tester_id
    WHERE a.dispute_at IS NOT NULL AND a.status IN ('completed_pending','exit_pending') ORDER BY a.dispute_at`);
  const appeals = await all(env, "SELECT id, email, status, status_reason, appeal_text, appeal_at FROM users WHERE appeal_used = 1 AND appeal_decision IS NULL ORDER BY appeal_at");
  return { reports, disputes, appeals };
}

async function adminReport(env, admin, id, b) {
  const r = await one(env, 'SELECT * FROM reports WHERE id = ?', id);
  if (!r || r.status !== 'open') fail(404, 'Report not open');
  if (b.decision === 'uphold') {
    await run(env, "UPDATE reports SET status = 'upheld', fraud = ?, resolved_at = ?, resolved_by = ? WHERE id = ?", b.fraud ? 1 : 0, now(env), admin.id, id);
    await run(env, "UPDATE reports SET status = 'upheld', resolved_at = ?, resolved_by = ? WHERE target_id = ? AND status = 'open'", now(env), admin.id, r.target_id);
    const tu = await one(env, 'SELECT status FROM users WHERE id = ?', r.target_id);
    if (tu.status !== 'terminated') await terminate(env, r.target_id, `Report upheld: ${r.category}`, !!b.fraud);
    if (r.kind === 'campaign') await devDelta(env, r.target_id, 'report_upheld', 0, 5, r.assignment_id, `Report upheld: ${r.category}`);
  } else if (b.decision === 'dismiss') {
    await run(env, "UPDATE reports SET status = 'dismissed', resolved_at = ?, resolved_by = ? WHERE id = ?", now(env), admin.id, id);
    const open = await one(env, "SELECT COUNT(*) AS n FROM reports WHERE target_id = ? AND status = 'open'", r.target_id);
    if (!open.n) await run(env, "UPDATE users SET status = 'active', status_reason = '', status_at = ? WHERE id = ? AND status = 'review'", now(env), r.target_id);
  } else fail(400, 'decision must be uphold or dismiss');
  return { ok: true };
}

async function adminDispute(env, id, b) {
  const a = await one(env, 'SELECT * FROM assignments WHERE id = ?', id);
  if (!a || !a.dispute_at || !['completed_pending', 'exit_pending'].includes(a.status)) fail(404, 'No open dispute');
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', a.campaign_id);
  if (b.decision === 'tester') {
    if (a.status === 'completed_pending') await complete(env, a, 'Dispute decided for the tester');
    else await excuse(env, a, 'Dispute decided for the tester');
    await devDelta(env, c.owner_id, 'dispute_lost', 0, 1, a.id, 'A dispute was decided for the tester');
  } else if (b.decision === 'developer') {
    await settle(env, a, 'exited', 0, { note: 'Dispute decided for the developer' });
    await testerDelta(env, a.tester_id, 'dispute_lost', 0, R.DEMERIT.unexcused_exit, a.id, a.status === 'exit_pending' ? 'The exit reason did not hold up' : 'The test was not completed as claimed');
  } else fail(400, 'decision must be tester or developer');
  return { ok: true };
}

async function adminAppeal(env, userId, b) {
  const u = await one(env, 'SELECT * FROM users WHERE id = ?', userId);
  if (!u || !u.appeal_used || u.appeal_decision) fail(404, 'No open appeal');
  if (b.decision === 'reinstate') {
    // Negative standing is lifted to 0; positive standing is kept.
    await run(env, "UPDATE users SET status = 'active', status_reason = '', status_at = ?, appeal_decision = 'reinstate', tester_demerits = MIN(tester_demerits, tester_merits) WHERE id = ?", now(env), userId);
    await logEvent(env, userId, 'account', 'reinstated', { note: 'Your appeal was accepted. Your tester standing is at least 0 again.' });
  } else if (b.decision === 'deny') {
    await run(env, "UPDATE users SET appeal_decision = 'deny' WHERE id = ?", userId);
    await logEvent(env, userId, 'account', 'appeal_denied', { note: 'Your appeal was reviewed and the decision stands.' });
  } else fail(400, 'decision must be reinstate or deny');
  return { ok: true };
}

// ---------- router ----------

async function route(env, req, url) {
  const p = url.pathname.replace(/\/+$/, '');
  const m = req.method;
  const seg = p.split('/');
  if (m === 'GET' && p === '/api/config') {
    const k = cfg(env);
    return { googleClientId: env.GOOGLE_CLIENT_ID || '', devAuth: env.DEV_AUTH === '1', levels: R.LEVELS.map((l) => ({ level: l.level, min: Number.isFinite(l.min) ? l.min : null, priceCents: l.priceCents })), feePct: k.feePct, feeMinCents: k.feeMinCents, payoutMinCents: k.payoutMinCents, maxActive: R.MAX_ACTIVE, excusedReasons: Object.keys(R.EXCUSED_REASONS), unexcusedReasons: R.UNEXCUSED_REASONS, reportCategories: R.REPORT_CATEGORIES, checkins: R.CHECKINS };
  }
  if (m === 'POST' && p === '/api/auth/google') {
    const b = await body(req);
    if (!env.GOOGLE_CLIENT_ID) fail(503, 'Google sign-in is not configured');
    let g;
    try { g = await verifyGoogleIdToken(b.credential, env.GOOGLE_CLIENT_ID, { now: now(env) }); } catch (e) { fail(401, `Google sign-in failed: ${e.message}`); }
    const u = await upsertUser(env, g);
    return { token: await startSession(env, u), user: meView(u).user };
  }
  if (m === 'POST' && p === '/api/auth/dev') {
    if (env.DEV_AUTH !== '1') fail(404, 'Not found');
    const b = await body(req);
    const email = text(b.email, 200).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+$/.test(email)) fail(400, 'Email');
    const u = await upsertUser(env, { email, name: email.split('@')[0] });
    return { token: await startSession(env, u), user: meView(u).user };
  }
  if (m === 'POST' && p === '/api/sdk/claim') return sdkClaim(env, await body(req));
  if (m === 'POST' && p === '/api/sdk/ping') return sdkPing(env, await body(req));

  const u = await auth(env, req);
  const b = await body(req);
  if (m === 'POST' && p === '/api/auth/logout') {
    const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/, '');
    await run(env, 'DELETE FROM sessions WHERE token_hash = ?', await sha256Hex(tok));
    return { ok: true };
  }
  if (m === 'GET' && p === '/api/me') {
    const events = await all(env, 'SELECT role, kind, merits, demerits, cents, assignment_id, note, created_at FROM events WHERE user_id = ? ORDER BY id DESC LIMIT 50', u.id);
    return { ...meView(u), events };
  }
  if (m === 'POST' && p === '/api/me/adult') { await run(env, 'UPDATE users SET adult_at = COALESCE(adult_at, ?) WHERE id = ?', now(env), u.id); return { ok: true }; }
  if (m === 'POST' && p === '/api/me/appeal') return appeal(env, u, b);
  if (m === 'GET' && p === '/api/tests') return listTests(env, u);
  if (m === 'POST' && seg[2] === 'tests' && seg[4] === 'accept') return accept(env, u, int(seg[3]));
  if (m === 'GET' && p === '/api/assignments') return myAssignments(env, u);
  if (m === 'POST' && seg[2] === 'assignments') {
    const aid = int(seg[3]);
    if (seg[4] === 'start') return start(env, u, aid);
    if (seg[4] === 'checkin') return checkin(env, u, aid, b);
    if (seg[4] === 'exit') return exitTest(env, u, aid, b);
    if (seg[4] === 'confirm') return confirm(env, u, aid);
    if (seg[4] === 'dispute') return dispute(env, u, aid, b);
  }
  if (m === 'POST' && p === '/api/reports') return report(env, u, b);
  if (m === 'POST' && p === '/api/payouts/onboard') return onboard(env, u);
  if (m === 'POST' && p === '/api/payouts/request') return requestPayout(env, u);
  if (p === '/api/campaigns') {
    if (m === 'POST') return createCampaign(env, u, b);
    const rows = await all(env, 'SELECT * FROM campaigns WHERE owner_id = ? ORDER BY id DESC', u.id);
    return { campaigns: await Promise.all(rows.map((c) => campaignView(env, c, u))) };
  }
  if (seg[2] === 'campaigns' && seg[3]) {
    const c = await ownCampaign(env, u, int(seg[3]));
    if (m === 'GET' && !seg[4]) return { campaign: await campaignView(env, c, u, true) };
    if (m === 'POST' && seg[4] === 'checkout') return checkout(env, u, c);
    if (m === 'POST' && seg[4] === 'invited') return markInvited(env, c, b);
    if (m === 'POST' && seg[4] === 'close') return { ok: true, creditedCents: await closeCampaign(env, c.id) };
  }
  if (m === 'POST' && seg[2] === 'checkins' && seg[4] === 'helpful') return helpful(env, u, int(seg[3]));
  if (seg[2] === 'admin') {
    mustAdmin(u);
    if (m === 'GET' && p === '/api/admin/queue') return adminQueue(env);
    if (m === 'POST' && seg[3] === 'reports') return adminReport(env, u, int(seg[4]), b);
    if (m === 'POST' && seg[3] === 'disputes') return adminDispute(env, int(seg[4]), b);
    if (m === 'POST' && seg[3] === 'appeals') return adminAppeal(env, int(seg[4]), b);
  }
  fail(404, 'Not found');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    try {
      if (url.pathname === '/api/stripe/webhook' && req.method === 'POST') return await webhook(env, req);
      if (!url.pathname.startsWith('/api/')) return json({ name: 'amni-test', docs: 'https://amni-scient.com/test/' }, 200, h);
      return json(await route(env, req, url), 200, h);
    } catch (e) {
      if (e instanceof HttpError || e.status) return json({ error: e.message }, e.status || 500, h);
      console.error(e);
      return json({ error: 'Something went wrong' }, 500, h);
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(sweep(env));
  },
};
