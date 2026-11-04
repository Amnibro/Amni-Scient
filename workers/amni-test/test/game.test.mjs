// Test Town game layer: XP, ranks, badges, streaks, quests, leaderboard, profiles, app-reported installs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { sweep } from '../worker/sweep.js';
import { rankFor, mondayOf, nicknameProblem } from '../worker/game.js';
import { makeD1 } from './d1.mjs';

const SCHEMA = fileURLToPath(new URL('../schema.sql', import.meta.url));
const DAY = 86400000, HOUR = 3600000;
const FB = { worked: 'Menus load fast and saving works.', broke: 'Crash when rotating on level 2.', device: 'Pixel 7' };
const LONG = { worked: 'Everything on the first screens works: sign-in, the tutorial and saving all behave. '.repeat(2), broke: 'Rotating on level 2 crashes every time; steps: open level 2, rotate the phone, app closes.', device: 'Pixel 7' };

function harness() {
  let clock = Date.UTC(2026, 10, 2, 12); // a Monday
  const env = { DB: makeD1(SCHEMA), DEV_AUTH: '1', DEV_FAKE_PAY: '1', ADMIN_EMAILS: 'admin@example.com', __now: () => clock };
  const call = async (method, path, body, token) => {
    const r = await worker.fetch(new Request('https://x' + path, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined }), env);
    return { status: r.status, ...(await r.json()) };
  };
  const login = async (email) => (await call('POST', '/api/auth/dev', { email })).token;
  return { env, call, login, tick: (ms) => { clock += ms; }, db: (sql, ...a) => env.DB.raw.prepare(sql).all(...a) };
}

async function campaign(h, dev, pkg = 'com.example.app', slots = 3) {
  const c = (await h.call('POST', '/api/campaigns', { appName: 'App ' + pkg, package: pkg, slots, maxLevel: 1 }, dev)).campaign;
  await h.call('POST', `/api/campaigns/${c.id}/checkout`, {}, dev);
  return c.id;
}
async function tester(h, email) { const t = await h.login(email); await h.call('POST', '/api/me/adult', {}, t); return t; }
async function startTest(h, dev, cid, t) {
  const acc = await h.call('POST', `/api/tests/${cid}/accept`, {}, t);
  await h.call('POST', `/api/campaigns/${cid}/invited`, {}, dev);
  await h.call('POST', `/api/assignments/${acc.assignment.id}/start`, {}, t);
  return acc;
}

test('ranks, week boundaries and nickname rules', () => {
  assert.equal(rankFor(0).name, 'Rookie');
  assert.deepEqual(rankFor(299), { name: 'Scout', min: 100, next: 300, nextName: 'Tinkerer' });
  assert.equal(rankFor(6000).next, null);
  const monday = Math.floor(Date.UTC(2026, 10, 2) / DAY), sunday = monday + 6;
  assert.equal(mondayOf(monday), monday);
  assert.equal(mondayOf(sunday), monday);
  assert.equal(mondayOf(sunday + 1), monday + 7);
  assert.equal(nicknameProblem('ab'), 'Use 3 to 20 letters, numbers, _ or -');
  assert.equal(nicknameProblem('Amni_Official'), 'Pick a different nickname');
  assert.equal(nicknameProblem('Adm1n'), 'Pick a different nickname');
  assert.equal(nicknameProblem('bug_squasher'), null);
});

test('streak: first visit each day earns XP and the daily quest; consecutive days grow it; a gap resets it', async () => {
  const h = harness();
  const t = await h.login('s@example.com');
  let v = await h.call('POST', '/api/game/visit', {}, t);
  assert.equal(v.firstToday, true);
  assert.equal(v.streak.current, 1);
  assert.equal(v.game.xp, 5 + 10, 'visit + Stop by town quest');
  assert.deepEqual(v.game.questsDone.map((q) => q.id), ['d_visit']);
  v = await h.call('POST', '/api/game/visit', {}, t);
  assert.equal(v.firstToday, false);
  assert.equal(v.game.xp, 0);
  for (let d = 0; d < 6; d++) { h.tick(DAY); v = await h.call('POST', '/api/game/visit', {}, t); }
  assert.equal(v.streak.current, 7);
  assert.deepEqual(v.game.newBadges.map((b) => b.id), ['streak_7']);
  h.tick(2 * DAY);
  let s = await h.call('GET', '/api/game/state', undefined, t);
  assert.equal(s.streak.current, 0, 'a missed day shows the streak as broken');
  v = await h.call('POST', '/api/game/visit', {}, t);
  assert.deepEqual(v.streak, { current: 1, best: 7 });
  s = await h.call('GET', '/api/game/state', undefined, t);
  assert.equal(s.cosmetics.find((c) => c.id === 'sparks').unlocked, true, 'Week Lit unlocks the sparks trail');
  assert.equal(s.xp, 8 * 15, 'eight counted visits (the repeat on day 1 earns nothing)');
});

test('a full test earns XP, badges and weekly quests, and a rank up', async () => {
  const h = harness();
  const dev = await h.login('dev@example.com');
  const cid = await campaign(h, dev);
  const t = await tester(h, 't@example.com');
  const acc = await startTest(h, dev, cid, t);
  assert.equal(acc.game.xp, 10 + 30, 'accept + weekly quest');
  assert.deepEqual(acc.game.newBadges.map((b) => b.id), ['first_steps']);
  const c1 = await h.call('POST', `/api/assignments/${acc.assignment.id}/checkin`, LONG, t);
  assert.equal(c1.game.xp, 20 + 10 + 25, 'check-in + detailed + daily quest');
  assert.deepEqual(c1.game.newBadges.map((b) => b.id), ['first_report']);
  assert.equal(c1.game.rankUp, false);
  h.tick(7 * DAY); await h.call('POST', `/api/assignments/${acc.assignment.id}/checkin`, LONG, t);
  h.tick(7 * DAY); const c3 = await h.call('POST', `/api/assignments/${acc.assignment.id}/checkin`, FB, t);
  assert.equal(c3.status, 'completed_pending');
  const det = (await h.call('GET', `/api/campaigns/${cid}`, undefined, dev)).campaign;
  await h.call('POST', `/api/checkins/${det.assignments[0].checkins[0].id}/helpful`, {}, dev);
  await h.call('POST', `/api/assignments/${acc.assignment.id}/confirm`, {}, dev);
  const s = await h.call('GET', '/api/game/state', undefined, t);
  // week 1: accept 10+30, check-in 20+10+25; week 2: 20+10+25; week 3: 20+25, helpful 30+50, completed 100+100
  assert.equal(s.xp, 40 + 55 + 55 + 45 + 80 + 200);
  assert.equal(s.rank.name, 'Tinkerer');
  assert.deepEqual(s.badges.filter((b) => b.earnedAt).map((b) => b.id).sort(), ['finisher', 'first_report', 'first_steps']);
  assert.equal(s.quests.find((q) => q.id === 'w_finish').done, true);
  assert.deepEqual(s.stats, { completed: 1, checkins: 3, detailed: 2, helpful: 1, accepted: 1 });
  const card = (await h.call('GET', `/api/campaigns/${cid}`, undefined, dev)).campaign.assignments[0].tester;
  assert.equal(card.rank, 'Tinkerer');
  assert.equal(card.badges, 3);
  assert.equal(card.email, 't@example.com');
});

test('XP is never taken away and never pays money', async () => {
  const h = harness();
  const dev = await h.login('dev@example.com');
  const cid = await campaign(h, dev);
  const t = await tester(h, 't@example.com');
  const acc = await startTest(h, dev, cid, t);
  await h.call('POST', `/api/assignments/${acc.assignment.id}/exit`, { reason: 'no_time' }, t);
  const me = await h.call('GET', '/api/me', undefined, t);
  assert.equal(me.tester.demerits, 5);
  assert.equal(me.balanceCents, 0);
  assert.equal((await h.call('GET', '/api/game/state', undefined, t)).xp, 40);
});

test('profile: nickname must be unique (any case); locked cosmetics are refused; unlocked ones save', async () => {
  const h = harness();
  const a = await h.login('a@example.com'), b = await h.login('b@example.com');
  assert.equal((await h.call('POST', '/api/game/profile', { nickname: 'BugSquasher' }, a)).profile.nickname, 'BugSquasher');
  assert.equal((await h.call('POST', '/api/game/profile', { nickname: 'bugsquasher' }, b)).status, 409);
  assert.match((await h.call('POST', '/api/game/profile', { avatar: { hat: 'crown' } }, a)).error, /Crown is locked: Reach Legend/);
  assert.match((await h.call('POST', '/api/game/profile', { avatar: { hat: 'sombrero' } }, a)).error, /Unknown hat/);
  const ok = await h.call('POST', '/api/game/profile', { avatar: { color: 'c3', shape: 'capsule', hat: 'cap' } }, a);
  assert.deepEqual(ok.profile.avatar, { color: 'c3', shape: 'capsule', hat: 'cap', trail: 'none' });
  h.db("UPDATE users SET xp = 3000 WHERE email = 'a@example.com'");
  assert.equal((await h.call('POST', '/api/game/profile', { avatar: { shape: 'star' } }, a)).profile.avatar.shape, 'star');
});

test('leaderboard: weekly and all-time, nicknames only, opt-out hides you, your place is reported', async () => {
  const h = harness();
  const users = [];
  for (const [email, nick] of [['a@x.com', 'Alpha'], ['b@x.com', 'Bravo'], ['c@x.com', null], ['d@x.com', 'Delta']]) {
    const t = await h.login(email);
    if (nick) await h.call('POST', '/api/game/profile', { nickname: nick }, t);
    users.push(t);
  }
  for (const t of users) await h.call('POST', '/api/game/visit', {}, t);
  h.db("UPDATE users SET xp = xp + 500 WHERE email = 'b@x.com'");
  h.db("INSERT INTO xp_events (user_id, kind, xp, created_at) SELECT id, 'checkin', 40, ? FROM users WHERE email = 'd@x.com'", Date.UTC(2026, 10, 2, 13));
  await h.call('POST', '/api/game/profile', { showOnBoard: false }, users[0]);
  const week = await h.call('GET', '/api/game/leaderboard?period=week', undefined, users[1]);
  assert.deepEqual(week.rows.map((r) => [r.nickname, r.xp]), [['Delta', 55], ['Bravo', 15]]);
  assert.deepEqual(week.me, { place: 2, xp: 15 });
  const all = await h.call('GET', '/api/game/leaderboard?period=all', undefined, users[2]);
  assert.deepEqual(all.rows.map((r) => [r.nickname, r.xp, r.rank]), [['Bravo', 515, 'Tinkerer'], ['Delta', 15, 'Rookie']]);
  assert.equal(all.me.place, null, 'no nickname, not on the board');
  assert.equal(JSON.stringify(all).includes('@x.com'), false, 'emails never appear');
  h.tick(7 * DAY);
  assert.equal((await h.call('GET', '/api/game/leaderboard?period=week', undefined, users[1])).rows.length, 0, 'new week starts empty');
});

test('town bundles everything the scene needs in one call', async () => {
  const h = harness();
  const dev = await h.login('dev@example.com');
  await campaign(h, dev, 'com.example.one');
  const cid2 = await campaign(h, dev, 'com.example.two');
  const t = await tester(h, 't@example.com');
  await h.call('POST', '/api/game/profile', { nickname: 'Tess' }, t);
  await startTest(h, dev, cid2, t);
  const town = await h.call('GET', '/api/game/town', undefined, t);
  assert.equal(town.market.length, 1);
  assert.equal(town.myTests.length, 1);
  assert.equal(town.myTests[0].status, 'active');
  assert.equal(town.me.profile.nickname, 'Tess');
  assert.equal(town.podium[0].nickname, 'Tess');
  assert.equal(town.tester.level, 1);
  assert.equal(town.balanceCents, 0);
  assert.equal(town.user.email, 't@example.com');
});

test("installs reported by the tester's app are recorded but cannot auto-approve a completion", async () => {
  const h = harness();
  const dev = await h.login('dev@example.com');
  const c = (await h.call('POST', '/api/campaigns', { appName: 'Sdk', package: 'com.example.sdk', slots: 2, maxLevel: 1, verification: 'sdk' }, dev)).campaign;
  await h.call('POST', `/api/campaigns/${c.id}/checkout`, {}, dev);
  const t = await tester(h, 't@example.com');
  const acc = await startTest(h, dev, c.id, t);
  const id = acc.assignment.id;
  const r = await h.call('POST', '/api/app/installs', { installed: ['com.example.sdk', 'com.other.app', 'not a package'] }, t);
  assert.deepEqual(r.verified, [id]);
  await h.call('POST', `/api/assignments/${id}/checkin`, FB, t);
  h.tick(7 * DAY); await h.call('POST', `/api/assignments/${id}/checkin`, FB, t);
  h.tick(6 * DAY); await h.call('POST', '/api/app/installs', { installed: ['com.example.sdk'] }, t);
  h.tick(DAY);
  assert.equal((await h.call('POST', `/api/assignments/${id}/checkin`, FB, t)).status, 'completed_pending', 'app reports alone do not auto-approve');
  const a = (await h.call('GET', `/api/campaigns/${c.id}`, undefined, dev)).campaign.assignments[0];
  assert.equal(a.lastAppReportDay, 13);
  assert.equal(a.pingDays, 0, 'SDK ping count is separate');
  h.tick(73 * HOUR); await sweep(h.env);
  assert.equal(h.db('SELECT status FROM assignments WHERE id = ?', id)[0].status, 'completed');
});
