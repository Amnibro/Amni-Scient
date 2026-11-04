// Test Town game layer: XP, ranks, badges, streaks, quests, leaderboards, profiles.
// Spec: docs/amni-test/game/README.md. Nothing here moves money.
import { DAY, levelFor, standing } from './rules.js';
import { now, one, all, run } from './db.js';

export const XP = { visit: 5, accept: 10, checkin: 20, detailed: 10, helpful: 30, completed: 100 };
export const DETAILED_CHARS = 200;

export const RANKS = [
  { name: 'Rookie', min: 0 }, { name: 'Scout', min: 100 }, { name: 'Tinkerer', min: 300 }, { name: 'Bug Hunter', min: 700 },
  { name: 'Pathfinder', min: 1500 }, { name: 'Architect', min: 3000 }, { name: 'Legend', min: 6000 },
];

export const BADGES = [
  { id: 'first_steps', name: 'First Steps', description: 'Accept your first test', test: (s) => s.accepted >= 1 },
  { id: 'first_report', name: 'First Report', description: 'File your first check-in', test: (s) => s.checkins >= 1 },
  { id: 'finisher', name: 'Finisher', description: 'Finish a test', test: (s) => s.completed >= 1 },
  { id: 'veteran', name: 'Veteran', description: 'Finish 10 tests', test: (s) => s.completed >= 10 },
  { id: 'marathon', name: 'Marathoner', description: 'Finish 25 tests', test: (s) => s.completed >= 25 },
  { id: 'sharp_eye', name: 'Sharp Eye', description: 'File 10 detailed check-ins', test: (s) => s.detailed >= 10 },
  { id: 'helpful_hand', name: 'Helpful Hand', description: 'Get 5 helpful votes', test: (s) => s.helpful >= 5 },
  { id: 'streak_7', name: 'Week Lit', description: 'Reach a 7-day streak', test: (s) => s.streakBest >= 7 },
  { id: 'streak_30', name: 'Month Lit', description: 'Reach a 30-day streak', test: (s) => s.streakBest >= 30 },
  { id: 'clean_sheet', name: 'Clean Sheet', description: 'Finish 5 tests with no missed check-ins', test: (s) => s.clean >= 5 },
  { id: 'questor', name: 'Questor', description: 'Complete 10 quests', test: (s) => s.quests >= 10 },
  { id: 'top_level', name: 'Top Shelf', description: 'Reach pay level 5', test: (s) => s.payLevel >= 5 },
];

export const QUESTS = [
  { id: 'd_visit', period: 'daily', title: 'Stop by town', kind: 'visit', target: 1, rewardXp: 10 },
  { id: 'd_checkin', period: 'daily', title: 'File a check-in', kind: 'checkin', target: 1, rewardXp: 25 },
  { id: 'w_finish', period: 'weekly', title: 'Finish a test', kind: 'completed', target: 1, rewardXp: 100 },
  { id: 'w_helpful', period: 'weekly', title: 'Be helpful', kind: 'helpful', target: 1, rewardXp: 50 },
  { id: 'w_detail', period: 'weekly', title: 'Three sharp reports', kind: 'detailed', target: 3, rewardXp: 60 },
  { id: 'w_accept', period: 'weekly', title: 'Take on a new test', kind: 'accept', target: 1, rewardXp: 30 },
];

const rankAt = (name) => RANKS.findIndex((r) => r.name === name);
export const COSMETICS = [
  { kind: 'color', id: 'c0', name: 'Brass', rank: 'Rookie' }, { kind: 'color', id: 'c1', name: 'Slate', rank: 'Rookie' },
  { kind: 'color', id: 'c2', name: 'Sage', rank: 'Rookie' }, { kind: 'color', id: 'c3', name: 'Clay', rank: 'Rookie' },
  { kind: 'color', id: 'c4', name: 'Lagoon', rank: 'Scout' }, { kind: 'color', id: 'c5', name: 'Plum', rank: 'Tinkerer' },
  { kind: 'color', id: 'c6', name: 'Sunflower', rank: 'Bug Hunter' }, { kind: 'color', id: 'c7', name: 'Ember', rank: 'Pathfinder' },
  { kind: 'shape', id: 'cube', name: 'Cube', rank: 'Rookie' }, { kind: 'shape', id: 'capsule', name: 'Capsule', rank: 'Rookie' },
  { kind: 'shape', id: 'cone', name: 'Cone', rank: 'Tinkerer' }, { kind: 'shape', id: 'star', name: 'Star', rank: 'Architect' },
  { kind: 'hat', id: 'none', name: 'No hat', rank: 'Rookie' }, { kind: 'hat', id: 'cap', name: 'Cap', rank: 'Rookie' },
  { kind: 'hat', id: 'crown', name: 'Crown', rank: 'Legend' }, { kind: 'hat', id: 'goggles', name: 'Goggles', badge: 'sharp_eye' },
  { kind: 'hat', id: 'hardhat', name: 'Hard hat', badge: 'finisher' }, { kind: 'hat', id: 'halo', name: 'Halo', badge: 'clean_sheet' },
  { kind: 'trail', id: 'none', name: 'No trail', rank: 'Rookie' }, { kind: 'trail', id: 'sparks', name: 'Sparks', badge: 'streak_7' },
  { kind: 'trail', id: 'comet', name: 'Comet', badge: 'streak_30' },
];
export const DEFAULT_AVATAR = { color: 'c0', shape: 'cube', hat: 'none', trail: 'none' };

export function rankFor(xp) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].min) i = k;
  const next = RANKS[i + 1];
  return { name: RANKS[i].name, min: RANKS[i].min, next: next ? next.min : null, nextName: next ? next.name : null };
}

export const dayNumber = (ms) => Math.floor(ms / DAY);
// 1970-01-01 was a Thursday; Monday-start weeks.
export const mondayOf = (day) => day - ((day + 3) % 7);
export const periodKey = (period, ms) => (period === 'daily' ? `d:${dayNumber(ms)}` : `w:${mondayOf(dayNumber(ms))}`);
const periodStart = (period, ms) => (period === 'daily' ? dayNumber(ms) : mondayOf(dayNumber(ms))) * DAY;

const parseAvatar = (s) => { try { return { ...DEFAULT_AVATAR, ...JSON.parse(s || '{}') }; } catch { return { ...DEFAULT_AVATAR }; } };

function unlocked(c, xp, badgeIds) {
  if (c.badge) return badgeIds.has(c.badge);
  return rankAt(rankFor(xp).name) >= rankAt(c.rank);
}
const howToUnlock = (c) => (c.badge ? `Earn the ${BADGES.find((b) => b.id === c.badge).name} badge` : c.rank === 'Rookie' ? 'Free' : `Reach ${c.rank}`);

async function stats(env, userId) {
  const rows = await all(env, 'SELECT kind, COUNT(*) AS n FROM xp_events WHERE user_id = ? GROUP BY kind', userId);
  const by = Object.fromEntries(rows.map((r) => [r.kind, r.n]));
  const u = await one(env, 'SELECT streak_best, tester_merits, tester_demerits FROM users WHERE id = ?', userId);
  const clean = await one(env, "SELECT COUNT(*) AS n FROM assignments WHERE tester_id = ? AND status = 'completed' AND missed_checkins = 0", userId);
  return {
    accepted: by.accept || 0, checkins: by.checkin || 0, detailed: by.detailed || 0, helpful: by.helpful || 0, completed: by.completed || 0,
    quests: rows.filter((r) => r.kind.startsWith('quest:')).reduce((a, r) => a + r.n, 0),
    streakBest: u?.streak_best || 0, clean: clean?.n || 0, payLevel: levelFor(standing(u?.tester_merits || 0, u?.tester_demerits || 0)).level,
  };
}

async function addXp(env, userId, kind, xp, assignmentId) {
  await run(env, 'INSERT INTO xp_events (user_id, kind, xp, assignment_id, created_at) VALUES (?,?,?,?,?)', userId, kind, xp, assignmentId, now(env));
  if (xp) await run(env, 'UPDATE users SET xp = xp + ? WHERE id = ?', xp, userId);
}

async function questProgress(env, userId, q, t) {
  const r = await one(env, 'SELECT COUNT(*) AS n FROM xp_events WHERE user_id = ? AND kind = ? AND created_at >= ?', userId, q.kind, periodStart(q.period, t));
  return r?.n || 0;
}

// Record one or more XP events for a user, then settle quests and badges.
// Returns the celebration payload: { xp, rank, rankUp, newBadges, questsDone }.
export async function award(env, userId, events, assignmentId = null) {
  const before = (await one(env, 'SELECT xp FROM users WHERE id = ?', userId))?.xp || 0;
  let gained = 0;
  for (const e of events) { await addXp(env, userId, e.kind, e.xp, assignmentId); gained += e.xp; }
  const t = now(env);
  const questsDone = [];
  const kinds = new Set(events.map((e) => e.kind));
  for (const q of QUESTS) {
    if (!kinds.has(q.kind)) continue;
    if ((await questProgress(env, userId, q, t)) < q.target) continue;
    const ok = await run(env, 'INSERT OR IGNORE INTO quest_awards (user_id, quest_id, period, created_at) VALUES (?,?,?,?)', userId, q.id, periodKey(q.period, t), t);
    if (!ok) continue;
    await addXp(env, userId, 'quest:' + q.id, q.rewardXp, null);
    gained += q.rewardXp;
    questsDone.push({ id: q.id, title: q.title, rewardXp: q.rewardXp });
  }
  const newBadges = await checkBadges(env, userId);
  const after = before + gained;
  return { xp: gained, rank: rankFor(after).name, rankUp: rankFor(after).name !== rankFor(before).name, newBadges, questsDone };
}

export async function checkBadges(env, userId) {
  const s = await stats(env, userId);
  const out = [];
  for (const b of BADGES) {
    if (!b.test(s)) continue;
    if (await run(env, 'INSERT OR IGNORE INTO badges (user_id, badge_id, earned_at) VALUES (?,?,?)', userId, b.id, now(env))) out.push({ id: b.id, name: b.name, description: b.description });
  }
  return out;
}

export const emptyGame = () => ({ xp: 0, rank: null, rankUp: false, newBadges: [], questsDone: [] });
export function mergeGame(a, b) {
  if (!a) return b; if (!b) return a;
  return { xp: a.xp + b.xp, rank: b.rank || a.rank, rankUp: a.rankUp || b.rankUp, newBadges: [...a.newBadges, ...b.newBadges], questsDone: [...a.questsDone, ...b.questsDone] };
}

export async function visit(env, u) {
  const today = dayNumber(now(env));
  const cur = await one(env, 'SELECT streak_current, streak_best, streak_last_day FROM users WHERE id = ?', u.id);
  if (cur.streak_last_day === today) return { game: { ...emptyGame(), rank: rankFor(u.xp).name }, streak: { current: cur.streak_current, best: cur.streak_best }, firstToday: false };
  const current = cur.streak_last_day === today - 1 ? cur.streak_current + 1 : 1;
  const best = Math.max(cur.streak_best, current);
  await run(env, 'UPDATE users SET streak_current = ?, streak_best = ?, streak_last_day = ? WHERE id = ?', current, best, today, u.id);
  const game = await award(env, u.id, [{ kind: 'visit', xp: XP.visit }]);
  return { game, streak: { current, best }, firstToday: true };
}

export async function state(env, userId) {
  const u = await one(env, 'SELECT * FROM users WHERE id = ?', userId);
  const t = now(env);
  const held = new Map((await all(env, 'SELECT badge_id, earned_at FROM badges WHERE user_id = ?', userId)).map((r) => [r.badge_id, r.earned_at]));
  const quests = [];
  for (const q of QUESTS) {
    const progress = Math.min(await questProgress(env, userId, q, t), q.target);
    const done = !!(await one(env, 'SELECT 1 AS x FROM quest_awards WHERE user_id = ? AND quest_id = ? AND period = ?', userId, q.id, periodKey(q.period, t)));
    quests.push({ id: q.id, period: q.period, title: q.title, target: q.target, progress, rewardXp: q.rewardXp, done });
  }
  const ids = new Set(held.keys());
  const s = await stats(env, userId);
  const today = dayNumber(t);
  const streakAlive = u.streak_last_day === today || u.streak_last_day === today - 1;
  return {
    xp: u.xp, rank: rankFor(u.xp),
    streak: { current: streakAlive ? u.streak_current : 0, best: u.streak_best, lastDay: u.streak_last_day },
    badges: BADGES.map((b) => ({ id: b.id, name: b.name, description: b.description, earnedAt: held.get(b.id) ?? null })),
    quests,
    profile: { nickname: u.nickname, avatar: parseAvatar(u.avatar), showOnBoard: !!u.show_on_board },
    cosmetics: COSMETICS.map((c) => ({ kind: c.kind, id: c.id, name: c.name, unlocked: unlocked(c, u.xp, ids), how: howToUnlock(c) })),
    stats: { completed: s.completed, checkins: s.checkins, detailed: s.detailed, helpful: s.helpful, accepted: s.accepted },
  };
}

const BLOCKED = ['admin', 'amni', 'moderator', 'support', 'staff', 'official', 'nigg', 'fag', 'retard', 'kike', 'spic', 'chink', 'tranny', 'cunt'];
export function nicknameProblem(n) {
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(n)) return 'Use 3 to 20 letters, numbers, _ or -';
  const flat = n.toLowerCase().replace(/[_-]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's');
  if (BLOCKED.some((w) => flat.includes(w))) return 'Pick a different nickname';
  return null;
}

export async function updateProfile(env, u, b, fail) {
  if (b.nickname !== undefined) {
    const n = String(b.nickname || '').trim();
    const problem = nicknameProblem(n);
    if (problem) fail(400, problem);
    const taken = await one(env, 'SELECT id FROM users WHERE nickname = ? COLLATE NOCASE AND id != ?', n, u.id);
    if (taken) fail(409, 'That nickname is taken');
    await run(env, 'UPDATE users SET nickname = ? WHERE id = ?', n, u.id);
  }
  if (b.avatar !== undefined) {
    const ids = new Set((await all(env, 'SELECT badge_id FROM badges WHERE user_id = ?', u.id)).map((r) => r.badge_id));
    const cur = parseAvatar(u.avatar);
    const next = { ...cur };
    for (const kind of ['color', 'shape', 'hat', 'trail']) {
      if (b.avatar?.[kind] === undefined) continue;
      const c = COSMETICS.find((x) => x.kind === kind && x.id === b.avatar[kind]);
      if (!c) fail(400, `Unknown ${kind}`);
      if (!unlocked(c, u.xp, ids)) fail(400, `${c.name} is locked: ${howToUnlock(c)}`);
      next[kind] = c.id;
    }
    await run(env, 'UPDATE users SET avatar = ? WHERE id = ?', JSON.stringify(next), u.id);
  }
  if (b.showOnBoard !== undefined) await run(env, 'UPDATE users SET show_on_board = ? WHERE id = ?', b.showOnBoard ? 1 : 0, u.id);
  const fresh = await one(env, 'SELECT nickname, avatar, show_on_board FROM users WHERE id = ?', u.id);
  return { profile: { nickname: fresh.nickname, avatar: parseAvatar(fresh.avatar), showOnBoard: !!fresh.show_on_board } };
}

export async function leaderboard(env, u, period) {
  const week = period !== 'all';
  const since = mondayOf(dayNumber(now(env))) * DAY;
  const base = week
    ? `SELECT u.id, u.nickname, u.avatar, u.xp AS total, COALESCE(SUM(e.xp), 0) AS score FROM users u JOIN xp_events e ON e.user_id = u.id AND e.created_at >= ${since}
       WHERE u.nickname IS NOT NULL AND u.show_on_board = 1 AND u.status != 'terminated' GROUP BY u.id HAVING score > 0`
    : `SELECT u.id, u.nickname, u.avatar, u.xp AS total, u.xp AS score FROM users u WHERE u.nickname IS NOT NULL AND u.show_on_board = 1 AND u.status != 'terminated' AND u.xp > 0`;
  const rows = await all(env, `SELECT * FROM (${base}) ORDER BY score DESC, id ASC LIMIT 50`);
  const mine = week ? (await one(env, 'SELECT COALESCE(SUM(xp), 0) AS s FROM xp_events WHERE user_id = ? AND created_at >= ?', u.id, since)).s : u.xp;
  const visible = u.nickname && u.show_on_board && u.status !== 'terminated' && mine > 0;
  let place = null;
  if (visible) {
    const ahead = await one(env, `SELECT COUNT(*) AS n FROM (${base}) b WHERE b.score > ? OR (b.score = ? AND b.id < ?)`, mine, mine, u.id);
    place = ahead.n + 1;
  }
  return {
    period: week ? 'week' : 'all',
    rows: rows.map((r, i) => ({ place: i + 1, nickname: r.nickname, avatar: parseAvatar(r.avatar), xp: r.score, rank: rankFor(r.total).name })),
    me: { place, xp: mine },
  };
}

const PKG = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
export async function appInstalls(env, u, b, dayIndex) {
  const list = Array.isArray(b.installed) ? b.installed.slice(0, 100).map(String).filter((p) => PKG.test(p) && p.length <= 150) : [];
  const set = new Set(list);
  const rows = await all(env, "SELECT a.id, a.started_at, c.package FROM assignments a JOIN campaigns c ON c.id = a.campaign_id WHERE a.tester_id = ? AND a.status = 'active' AND a.started_at IS NOT NULL", u.id);
  const verified = [];
  for (const r of rows) {
    if (!set.has(r.package)) continue;
    await run(env, "INSERT OR IGNORE INTO pings (assignment_id, day, src, at) VALUES (?,?, 'app', ?)", r.id, dayIndex(r.started_at, now(env)), now(env));
    verified.push(r.id);
  }
  return { verified };
}

// Small public card developers see for each tester.
export async function testerCard(env, userId) {
  const u = await one(env, 'SELECT nickname, xp FROM users WHERE id = ?', userId);
  const n = await one(env, 'SELECT COUNT(*) AS n FROM badges WHERE user_id = ?', userId);
  return { nickname: u?.nickname || null, rank: rankFor(u?.xp || 0).name, badges: n?.n || 0 };
}
