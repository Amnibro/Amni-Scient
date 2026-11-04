// Small helpers over the D1 binding plus the reputation / money ledger writes.
import { BAN_AT, standing } from './rules.js';

export const now = (env) => (env.__now ? env.__now() : Date.now());
export const q = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);
export const one = (env, sql, ...args) => q(env, sql, ...args).first();
export const all = async (env, sql, ...args) => (await q(env, sql, ...args).all()).results || [];
export const run = async (env, sql, ...args) => (await q(env, sql, ...args).run()).meta?.changes ?? 0;

export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
export const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function logEvent(env, userId, role, kind, { merits = 0, demerits = 0, cents = 0, assignmentId = null, note = '' } = {}) {
  await run(env, 'INSERT INTO events (user_id, role, kind, merits, demerits, cents, assignment_id, note, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    userId, role, kind, merits, demerits, cents, assignmentId, note, now(env));
}

// Tester merits/demerits; bans the account when standing reaches BAN_AT.
export async function testerDelta(env, userId, kind, merits, demerits, assignmentId = null, note = '') {
  await run(env, 'UPDATE users SET tester_merits = tester_merits + ?, tester_demerits = tester_demerits + ? WHERE id = ?', merits, demerits, userId);
  await logEvent(env, userId, 'tester', kind, { merits, demerits, assignmentId, note });
  const u = await one(env, 'SELECT tester_merits, tester_demerits, status FROM users WHERE id = ?', userId);
  if (u && standing(u.tester_merits, u.tester_demerits) <= BAN_AT && (u.status === 'active' || u.status === 'review')) {
    await run(env, "UPDATE users SET status = 'banned', status_reason = ?, status_at = ? WHERE id = ?", 'Tester standing reached -10', now(env), userId);
    await logEvent(env, userId, 'account', 'banned', { note: 'Tester standing reached -10. You can appeal once.' });
  }
}

export async function devDelta(env, userId, kind, merits, demerits, assignmentId = null, note = '') {
  await run(env, 'UPDATE users SET dev_merits = dev_merits + ?, dev_demerits = dev_demerits + ? WHERE id = ?', merits, demerits, userId);
  await logEvent(env, userId, 'dev', kind, { merits, demerits, assignmentId, note });
}

export async function credit(env, userId, cents, kind, note, assignmentId = null) {
  if (!cents) return;
  await run(env, 'UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?', cents, userId);
  await logEvent(env, userId, 'tester', kind, { cents, assignmentId, note });
}

export async function devCredit(env, userId, cents, kind, note) {
  if (!cents) return;
  await run(env, 'UPDATE users SET credit_cents = credit_cents + ? WHERE id = ?', cents, userId);
  await logEvent(env, userId, 'dev', kind, { cents, note });
}

// Finish an assignment's money: release its reservation, pay the tester `pay`, and when the
// campaign is already closed hand the unspent part (plus the slot fee if nobody completed it)
// back to the developer as credit.
export async function settle(env, a, status, pay, { completed = false, note = '' } = {}) {
  const t = now(env);
  const changed = await run(env, 'UPDATE assignments SET status = ?, finished_at = ?, paid_cents = ? WHERE id = ? AND status = ?', status, t, pay, a.id, a.status);
  if (!changed) return false;
  await run(env, 'UPDATE campaigns SET reserved_cents = reserved_cents - ?, spent_cents = spent_cents + ? WHERE id = ?', a.price_cents, pay, a.campaign_id);
  if (pay) await credit(env, a.tester_id, pay, 'earned', note || `Test ${status}`, a.id);
  const c = await one(env, 'SELECT * FROM campaigns WHERE id = ?', a.campaign_id);
  if (c && c.status !== 'open') {
    const back = a.price_cents - pay + (completed ? 0 : Math.round(c.fee_cents / c.slots));
    if (back > 0) {
      await run(env, 'UPDATE campaigns SET credited_cents = credited_cents + ? WHERE id = ?', back, c.id);
      await devCredit(env, c.owner_id, back, 'campaign_credit', `Unused budget from ${c.app_name}`);
    }
  }
  return true;
}
