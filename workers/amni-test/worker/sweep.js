// Cron sweep: every timer in the spec lives here so the rules run even when nobody is online.
import * as R from './rules.js';
import { now, all, run, testerDelta, settle } from './db.js';
import { complete, excuse, closeCampaign } from './index.js';

export async function sweep(env) {
  const t = now(env);
  const log = { expired: 0, noShow: 0, missed: 0, abandoned: 0, toPending: 0, completed: 0, excused: 0, closed: 0 };

  // The developer never added the tester: free the slot, nobody is penalised.
  for (const a of await all(env, "SELECT * FROM assignments WHERE status = 'accepted' AND accepted_at <= ?", t - R.HOURS_72)) {
    if (await settle(env, a, 'expired', 0, { note: 'The developer did not add you in time' })) log.expired++;
  }

  // Added but never started.
  for (const a of await all(env, "SELECT * FROM assignments WHERE status = 'invited' AND invited_at <= ?", t - R.HOURS_72)) {
    if (await settle(env, a, 'no_show', 0, { note: 'Did not start within 72 hours' })) {
      await testerDelta(env, a.tester_id, 'no_show', 0, R.DEMERIT.no_show, a.id, 'Did not start a test within 72 hours of being added');
      log.noShow++;
    }
  }

  // Running tests: charge missed check-in windows, end abandoned tests.
  for (const a of await all(env, "SELECT * FROM assignments WHERE status = 'active' AND started_at IS NOT NULL")) {
    const filed = (await all(env, 'SELECT day FROM checkins WHERE assignment_id = ?', a.id)).map((x) => x.day);
    for (const w of R.newlyMissed(a.started_at, t, filed, a.missed_mask)) {
      const ok = await run(env, 'UPDATE assignments SET missed_mask = missed_mask | ?, missed_checkins = missed_checkins + 1 WHERE id = ? AND (missed_mask & ?) = 0', w.bit, a.id, w.bit);
      if (ok) {
        await testerDelta(env, a.tester_id, 'missed_checkin', 0, R.DEMERIT.missed_checkin, a.id, `Missed the day-${w.day} check-in`);
        log.missed++;
      }
    }
    if (R.dayIndex(a.started_at, t) > R.LAST_CHECKIN_DAY) {
      if (!filed.length) {
        if (await settle(env, a, 'exited', 0, { note: 'No check-ins were filed' })) {
          await testerDelta(env, a.tester_id, 'abandoned', 0, R.DEMERIT.unexcused_exit, a.id, 'Filed no check-ins in 16 days');
          log.abandoned++;
        }
      } else if (await run(env, "UPDATE assignments SET status = 'completed_pending', pending_at = ? WHERE id = ? AND status = 'active'", t, a.id)) {
        log.toPending++;
      }
    }
  }

  // 72 hours without a dispute: completions are confirmed and app-fault exits are excused.
  for (const a of await all(env, "SELECT * FROM assignments WHERE status = 'completed_pending' AND dispute_at IS NULL AND pending_at <= ?", t - R.HOURS_72)) {
    if (await complete(env, a, 'Confirmed automatically after 72 hours')) log.completed++;
  }
  for (const a of await all(env, "SELECT * FROM assignments WHERE status = 'exit_pending' AND dispute_at IS NULL AND pending_at <= ?", t - R.HOURS_72)) {
    if (await excuse(env, a, 'Exit excused after 72 hours')) log.excused++;
  }

  // Campaigns whose slots are all completed close and return what is left.
  for (const c of await all(env, "SELECT c.id, c.slots, (SELECT COUNT(*) FROM assignments a WHERE a.campaign_id = c.id AND a.status = 'completed') AS done FROM campaigns c WHERE c.status = 'open'")) {
    if (c.done >= c.slots) { await closeCampaign(env, c.id); log.closed++; }
  }

  await run(env, 'DELETE FROM sessions WHERE expires_at < ?', t);
  return log;
}
