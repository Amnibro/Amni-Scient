// Entitlement for one AI prompt. Same rules as cad/he/ai_meter.amni.
// The worker and the page run this module: Helium cannot run inside the
// Cloudflare worker, and this checkout has no hc to emit wasm.
export const CAP = 5;

const LOCAL = new Set(['browser', 'local', 'chrome', 'paste', 'bridge', 'remote']);
const BYOK = new Set(['anthropic', 'openai', 'gemini', 'openrouter']);

/** Where a connected engine runs. file:// Pro downloads are local. */
export function meterClass(kind, {offlineHtml = false} = {}) {
  if (offlineHtml) return 'local';
  if (LOCAL.has(kind)) return 'local';
  if (BYOK.has(kind)) return 'byok';
  if (kind === 'server') return 'server';
  return 'local';
}

/** Paid plan on a verified license. Free accounts have no license. */
export function planOf(L) {
  if (!L) return 'free';
  const p = String(L.plan || '').toLowerCase();
  if (L.life || p.startsWith('life')) return 'lifetime';
  if (p === 'student') return 'student';
  if (p === 'enterprise' || p.startsWith('ent')) return 'enterprise';
  return 'pro';
}

export function utcDay(ms = Date.now()) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Decide one attempt. `used` is prompts already counted today, plus any
 * still-open reservations. `ok` is false when the generation errored:
 * those do not count. A follow-up is just another ok attempt.
 * `left` is how many remain after this attempt if it is allowed and counted.
 */
export function decide({plan = 'free', share = false, used = 0, ok = true, local = false, signed = false, cap = CAP} = {}) {
  if (local) return {allow: true, count: false, unlimited: true, reason: 'local', left: null};
  if (!signed) return {allow: false, count: false, unlimited: false, reason: 'signin', left: 0};
  const unlimited = plan === 'pro' || plan === 'enterprise' || plan === 'lifetime' || (plan === 'student' && !!share);
  const remain = Math.max(0, cap - used);
  if (!ok) return {allow: true, count: false, unlimited, reason: 'error', left: unlimited ? null : remain};
  if (unlimited) return {allow: true, count: false, unlimited: true, reason: 'unlimited', left: null};
  if (used >= cap) return {allow: false, count: false, unlimited: false, reason: 'limit', left: 0};
  return {allow: true, count: true, unlimited: false, reason: 'ok', left: cap - used - 1};
}

/** Lines under the prompt box. `q` is the /api/ai/quota body, or null while loading. */
export function meterView(q, klass) {
  const lines = [];
  if (klass === 'byok') lines.push({id: 'byok', text: 'Your API key · not counted'});
  else lines.push({id: 'local', text: 'On this device · unlimited'});
  if (!q) return {lines, wall: false};
  if (q.offline) {
    lines.push({id: 'offline', text: 'Server limit checks when you are back online'});
    return {lines, wall: false};
  }
  if (!q.signed) {
    lines.push({id: 'signin', text: 'Sign in for server AI'});
    return {lines, wall: false, signin: true};
  }
  if (q.unlimited) {
    lines.push({id: 'unlim', text: q.plan === 'student' ? 'Unlimited · sharing with Adam' : 'Unlimited server AI'});
    return {lines, wall: false};
  }
  const left = q.left ?? 0, cap = q.cap ?? CAP;
  lines.push({id: 'count', text: left + ' of ' + cap + ' left today'});
  return {lines, wall: left <= 0, student: q.plan === 'student', share: !!q.share};
}
