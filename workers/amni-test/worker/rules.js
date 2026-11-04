// Amni-Test rules: pure functions, no I/O. The spec is docs/amni-test/README.md.

export const DAY = 86400000;
export const HOURS_72 = 3 * DAY;
export const TEST_DAYS = 14;
export const MAX_ACTIVE = 3;
export const BAN_AT = -10;
export const MAX_HELPFUL = 3;

// Standing thresholds for levels 1..5. Price is level dollars.
export const LEVELS = [
  { level: 1, min: -Infinity, priceCents: 100 },
  { level: 2, min: 10, priceCents: 200 },
  { level: 3, min: 25, priceCents: 300 },
  { level: 4, min: 50, priceCents: 400 },
  { level: 5, min: 100, priceCents: 500 },
];

export const MERIT = { completed: 3, helpful: 1 };
export const DEMERIT = { missed_checkin: 1, no_show: 2, unexcused_exit: 5 };

export const CHECKINS = [
  { day: 1, from: 0, to: 2, bit: 1 },
  { day: 7, from: 6, to: 8, bit: 2 },
  { day: 14, from: 13, to: 16, bit: 4 },
];
export const LAST_CHECKIN_DAY = 16;

export const EXCUSED_REASONS = { crash: 1, wont_install: 1, not_as_described: 1, privacy: 3, offensive: 3 };
export const UNEXCUSED_REASONS = ['no_time', 'lost_interest', 'other'];
export const REPORT_CATEGORIES = ['harassment', 'fraud', 'spam_feedback', 'malware', 'inappropriate'];

export const standing = (merits, demerits) => merits - demerits;

export function levelFor(standingValue) {
  let out = LEVELS[0];
  for (const l of LEVELS) if (standingValue >= l.min) out = l;
  return out;
}

export const priceForLevel = (level) => LEVELS[Math.min(Math.max(level, 1), 5) - 1].priceCents;

// A tester's price for a campaign: their level's price, capped at the campaign's maximum level.
export const testerPrice = (testerStanding, maxLevel) => priceForLevel(Math.min(levelFor(testerStanding).level, maxLevel));

export function feePerSlot(maxPriceCents, feePct = 30, feeMinCents = 50) {
  return Math.max(feeMinCents, Math.round((maxPriceCents * feePct) / 100));
}

export function campaignCost({ slots, maxLevel, feePct, feeMinCents, creditCents = 0 }) {
  const maxPrice = priceForLevel(maxLevel);
  const budget = slots * maxPrice;
  const fee = slots * feePerSlot(maxPrice, feePct, feeMinCents);
  const total = budget + fee;
  const creditUsed = Math.min(creditCents, total);
  return { maxPrice, budget, fee, total, creditUsed, due: total - creditUsed };
}

// Whole days since start (day 0 is the start day).
export const dayIndex = (startedAt, now) => Math.floor((now - startedAt) / DAY);

export function checkinWindow(day) {
  return CHECKINS.find((c) => c.day === day) || null;
}

// The check-in the tester can file right now, if any.
export function openCheckin(startedAt, now, filedDays) {
  const d = dayIndex(startedAt, now);
  return CHECKINS.find((c) => d >= c.from && d <= c.to && !filedDays.includes(c.day)) || null;
}

// The next check-in still to come (for "next due" hints).
export function nextCheckin(startedAt, now, filedDays) {
  const d = dayIndex(startedAt, now);
  return CHECKINS.find((c) => !filedDays.includes(c.day) && d <= c.to) || null;
}

// Windows that closed without a check-in and have not been charged yet.
export function newlyMissed(startedAt, now, filedDays, missedMask) {
  const d = dayIndex(startedAt, now);
  return CHECKINS.filter((c) => d > c.to && !filedDays.includes(c.day) && !(missedMask & c.bit));
}

// Full pay scaled by check-ins filed (thirds).
export const completionPay = (priceCents, filedCount) => Math.round((priceCents * Math.min(filedCount, 3)) / 3);

// Pay for an excused exit or removal: price * days done / 14.
export function proRataPay(priceCents, startedAt, at) {
  if (!startedAt) return 0;
  const days = Math.min(Math.max(dayIndex(startedAt, at), 0), TEST_DAYS);
  return Math.round((priceCents * days) / TEST_DAYS);
}

export function normaliseCode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = s.startsWith('AT') ? s.slice(2) : s;
  return /^[A-Z2-9]{8}$/.test(body) ? `AT-${body.slice(0, 4)}-${body.slice(4)}` : null;
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeCode(randomBytes) {
  let out = '';
  for (let i = 0; i < 8; i++) out += ALPHA[randomBytes[i] % ALPHA.length];
  return `AT-${out.slice(0, 4)}-${out.slice(4)}`;
}

export const validPackage = (p) => /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(p || '') && p.length <= 150;
export const optInUrl = (pkg) => `https://play.google.com/apps/testing/${pkg}`;
export const installUrl = (pkg, code) => `https://play.google.com/store/apps/details?id=${pkg}&referrer=${encodeURIComponent('amnitest=' + code)}`;
