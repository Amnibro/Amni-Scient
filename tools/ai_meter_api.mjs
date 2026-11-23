// Server AI prompt meter. Counts only a successful POST /api/ai/prompt commit.
// Local Adam, on-device models, and the offline HTML download never call this.
// A caller's own API key is not our server, so it is not counted either.
import {CAP, decide, planOf, utcDay} from '../cad/ai_meter.js';

export const PUB = 'UnBENQUADnY0JazLqB-zyllYw69qv56h9rVTXHdhWJM';
const HOLD_MS = 15 * 60 * 1000;
const ACCOUNT = 'https://account.amni-scient.com/';

const b64u = s => {
  const p = String(s).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(p + '='.repeat((4 - p.length % 4) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};

export async function verifyLicense(tok, pub = PUB, now = Date.now()) {
  const t = String(tok || '').replace(/\s+/g, '');
  if (!t.startsWith('AMNIPRO1.')) return null;
  const parts = t.slice(9).split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let L;
  try { L = JSON.parse(new TextDecoder().decode(b64u(parts[0]))); }
  catch { return null; }
  if (!L || L.v !== 1) return null;
  let ok = false;
  try {
    const key = await crypto.subtle.importKey('raw', b64u(pub), {name: 'Ed25519'}, false, ['verify']);
    ok = await crypto.subtle.verify({name: 'Ed25519'}, key, b64u(parts[1]), new TextEncoder().encode('AMNIPRO1.' + parts[0]));
  } catch { ok = false; }
  if (!ok) return null;
  if (L.exp && L.exp < now) return null;
  if (L.upd && now > L.upd) return null;
  return L;
}

export function memoryStore() {
  const m = new Map();
  return {
    async get(k) {
      const row = m.get(k);
      return row ? {value: row.value, etag: row.etag} : {value: null, etag: null};
    },
    async put(k, value, etag) {
      const row = m.get(k);
      if ((etag || null) !== (row ? row.etag : null)) return false;
      const next = String((row ? +row.etag : 0) + 1);
      m.set(k, {value, etag: next});
      return true;
    },
    keys() { return [...m.keys()]; }
  };
}

function kvStore(kv) {
  return {
    async get(k) {
      const text = await kv.get(k);
      return text ? {value: JSON.parse(text), etag: text} : {value: null, etag: null};
    },
    async put(k, value, etag) {
      const cur = await kv.get(k);
      if ((etag || null) !== (cur || null)) return false;
      await kv.put(k, JSON.stringify(value));
      return true;
    }
  };
}

function r2Store(bucket) {
  return {
    async get(k) {
      const o = await bucket.get('adam/quota/' + k + '.json');
      if (!o) return {value: null, etag: null};
      return {value: JSON.parse(await o.text()), etag: o.etag || o.httpEtag || null};
    },
    async put(k, value, etag) {
      const opt = etag ? {onlyIf: {etagMatches: etag}, httpMetadata: {contentType: 'application/json'}} : {httpMetadata: {contentType: 'application/json'}};
      try {
        const out = await bucket.put('adam/quota/' + k + '.json', JSON.stringify(value), opt);
        return out !== null;
      } catch { return false; }
    }
  };
}

function pickStore(env) {
  if (env.store) return env.store;
  if (env.AI_QUOTA) return kvStore(env.AI_QUOTA);
  if (env.MODELS) return r2Store(env.MODELS);
  env._mem || (env._mem = memoryStore());
  return env._mem;
}

async function update(store, key, fn) {
  for (let i = 0; i < 6; i++) {
    const cur = await store.get(key);
    const next = fn(cur.value);
    if (await store.put(key, next, cur.etag)) return next;
  }
  const err = new Error('The prompt counter is busy. Try again.');
  err.status = 503;
  throw err;
}

function originOk(req, env) {
  const o = req.headers.get('origin') || '';
  if (/^https:\/\/(www\.)?amni-scient\.com$/.test(o)) return true;
  if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(o)) return true;
  return (env.ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean).includes(o);
}

const json = (o, status = 200) => new Response(JSON.stringify(o), {status, headers: {'content-type': 'application/json', 'cache-control': 'no-store'}});

async function accountLookup(req, env) {
  if (env.accountMe) return env.accountMe(req);
  const auth = req.headers.get('authorization') || '';
  if (!auth || /AMNIPRO/.test(auth)) return null;
  const base = (env.ACCOUNT_URL || 'https://account.amni-scient.com').replace(/\/$/, '');
  try {
    const r = await fetch(base + '/v1/me', {headers: {authorization: auth, 'x-amni-account': '1'}});
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || !j.signed_in || !j.id) return null;
    return {id: j.id, name: j.name || ''};
  } catch { return null; }
}

async function identify(req, env, now) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (token.startsWith('AMNIPRO')) {
    const L = await verifyLicense(token, env.PUB || PUB, now);
    if (!L) return {bad: true};
    return {id: 'lic:' + (L.id || L.email || L.sub || 'key'), plan: planOf(L), name: L.name || ''};
  }
  const me = await accountLookup(req, env);
  if (me && me.id) return {id: String(me.id).startsWith('acct:') ? String(me.id) : 'acct:' + me.id, plan: 'free', name: me.name || ''};
  return null;
}

function fresh(day) { return {day, used: 0, holds: [], done: []}; }

function live(rec, now) {
  const day = utcDay(now);
  const r = rec && rec.day === day ? {day, used: rec.used | 0, holds: [...(rec.holds || [])], done: [...(rec.done || [])]} : fresh(day);
  r.holds = r.holds.filter(h => now - h.at < HOLD_MS);
  return r;
}

async function shareOn(store, id) {
  const row = await store.get('share:' + id);
  return !!(row.value && row.value.on);
}

function view(who, on, rec) {
  const held = rec.holds.length;
  const d = decide({plan: who.plan, share: on, used: rec.used + held, ok: true, local: false, signed: true});
  const left = d.unlimited ? null : Math.max(0, CAP - rec.used - held);
  return {signed: true, plan: who.plan, share: on, used: rec.used, cap: CAP, left, unlimited: d.unlimited, reset: 'midnight UTC', day: rec.day, localUnlimited: true};
}

export async function aiFetch(req, env = {}) {
  const url = new URL(req.url);
  if (!originOk(req, env)) return json({error: 'Not allowed'}, 403);
  if (req.method === 'OPTIONS') return new Response(null, {status: 204, headers: {allow: 'GET, POST, OPTIONS'}});
  const now = typeof env.now === 'function' ? env.now() : Date.now();
  const who = await identify(req, env, now);
  if (who && who.bad) return json({error: 'That license key was not accepted.', need: 'signin', signin: ACCOUNT}, 401);
  const path = url.pathname;
  if (path === '/api/ai/quota' && req.method === 'GET') {
    if (!who) return json({signed: false, plan: 'free', cap: CAP, left: null, unlimited: false, need: 'signin', signin: ACCOUNT, reset: 'midnight UTC', localUnlimited: true});
    const store = pickStore(env);
    const on = await shareOn(store, who.id);
    const rec = live((await store.get('q:' + who.id + ':' + utcDay(now))).value, now);
    return json(view(who, on, rec));
  }
  if (path === '/api/ai/share' && req.method === 'POST') {
    if (!who) return json({error: 'Sign in to change sharing.', need: 'signin', signin: ACCOUNT}, 401);
    let body = {};
    try { body = await req.json(); } catch { return json({error: 'Bad request'}, 400); }
    const store = pickStore(env);
    const on = !!body.on;
    const wrote = await update(store, 'share:' + who.id, () => ({on, at: new Date(now).toISOString()}));
    if (!wrote) return json({error: 'The prompt counter is busy. Try again.'}, 503);
    const rec = live((await store.get('q:' + who.id + ':' + utcDay(now))).value, now);
    return json(view(who, on, rec));
  }
  if (path === '/api/ai/prompt' && req.method === 'POST') {
    if (!who) return json({error: 'Sign in to use server AI.', need: 'signin', signin: ACCOUNT}, 401);
    let body = {};
    try { body = await req.json(); } catch { return json({error: 'Bad request'}, 400); }
    const op = body.op;
    if (op !== 'begin' && op !== 'commit' && op !== 'abort') return json({error: 'Bad request'}, 400);
    const store = pickStore(env);
    const on = await shareOn(store, who.id);
    const key = 'q:' + who.id + ':' + utcDay(now);
    if (op === 'begin') {
      let created = null;
      await update(store, key, cur => {
        const r = live(cur, now);
        const d = decide({plan: who.plan, share: on, used: r.used + r.holds.length, ok: true, local: false, signed: true});
        if (!d.allow || !d.count) return r;
        created = crypto.randomUUID();
        r.holds.push({id: created, at: now});
        return r;
      });
      const rec = live((await store.get(key)).value, now);
      const before = rec.used + rec.holds.length - (created ? 1 : 0);
      const d = decide({plan: who.plan, share: on, used: before, ok: true, local: false, signed: true});
      const v = view(who, on, rec);
      if (!d.allow) return json({...v, allow: false, error: 'No server prompts left today.', reason: 'limit'}, 429);
      return json({...v, allow: true, hold: created, counted: false});
    }
    const hold = String(body.hold || '');
    if (!hold) return json({error: 'Bad request'}, 400);
    let counted = false;
    await update(store, key, cur => {
      const r = live(cur, now);
      if (r.done.includes(hold)) { counted = op === 'commit'; return r; }
      const i = r.holds.findIndex(h => h.id === hold);
      if (i < 0) return r;
      r.holds.splice(i, 1);
      if (op === 'commit') { r.used++; r.done = [...r.done, hold].slice(-30); counted = true; }
      return r;
    });
    const rec = live((await store.get(key)).value, now);
    return json({...view(who, on, rec), allow: true, counted});
  }
  return json({error: 'Not found'}, 404);
}
