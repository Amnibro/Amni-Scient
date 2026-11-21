import crypto from 'node:crypto';
import {aiFetch, memoryStore, verifyLicense} from './ai_meter_api.mjs';
import edge from './edge.js';
let fail = 0;
const ok = (c, m, x) => { c || fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
const {publicKey, privateKey} = crypto.generateKeyPairSync('ed25519');
const pub = Buffer.from(publicKey.export({format: 'jwk'}).x, 'base64url');
const rawPub = Buffer.from(pub).toString('base64url');
const b64 = b => Buffer.from(b).toString('base64url');
const forge = (L, key = privateKey) => { const p = b64(JSON.stringify(L)); return 'AMNIPRO1.' + p + '.' + b64(crypto.sign(null, Buffer.from('AMNIPRO1.' + p), key)); };
const base = {v: 1, id: 'lic-1', name: 'Ada', plan: 'pro', seats: 1, feat: ['*'], iat: Date.now(), exp: Date.now() + 864e5};
const day0 = Date.UTC(2026, 10, 20, 15);
let now = day0;
const store = memoryStore();
await store.put('adam/training/note', {keep: true}, null);
const env = {PUB: rawPub, store, now: () => now, ORIGINS: ''};
const call = (path, {method = 'GET', token, body, origin = 'http://127.0.0.1:8765'} = {}) => aiFetch(new Request('https://amni-scient.com' + path, {method, headers: {origin, ...(token ? {authorization: 'Bearer ' + token} : {}), ...(body ? {'content-type': 'application/json'} : {})}, body: body ? JSON.stringify(body) : undefined}), env);
const read = async r => ({status: r.status, ...(await r.json().catch(() => ({})))});

const anon = await read(await call('/api/ai/quota'));
ok(anon.status === 200 && anon.signed === false && anon.need === 'signin' && anon.localUnlimited === true, 'anonymous quota asks for sign-in and does not count', anon);
const denied = await read(await call('/api/ai/prompt', {method: 'POST', body: {op: 'begin'}}));
ok(denied.status === 401 && denied.need === 'signin', 'anonymous server AI is refused');
ok((await read(await call('/api/ai/quota', {origin: 'https://evil.example'}))).status === 403, 'a foreign origin is refused');

const other = crypto.generateKeyPairSync('ed25519').privateKey;
ok((await read(await call('/api/ai/prompt', {method: 'POST', token: forge(base, other), body: {op: 'begin'}}))).status === 401, 'a key signed by someone else is refused');
ok(await verifyLicense(forge({...base, exp: Date.now() - 1000}), rawPub) === null, 'an expired license is not an account');

const freeTok = forge({...base, id: 'free-1', plan: 'student'});
const student = forge({...base, id: 'stu-1', plan: 'student'});
const pro = forge({...base, id: 'pro-1', plan: 'month'});
const year = forge({...base, id: 'pro-2', plan: 'year'});
const ent = forge({...base, id: 'ent-1', plan: 'enterprise'});

async function spend(token, n, {failAt = -1} = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const b = await read(await call('/api/ai/prompt', {method: 'POST', token, body: {op: 'begin'}}));
    if (!b.allow) { out.push(b); break; }
    if (!b.hold) { out.push(b); continue; }
    const op = i === failAt ? 'abort' : 'commit';
    out.push(await read(await call('/api/ai/prompt', {method: 'POST', token, body: {op, hold: b.hold}})));
  }
  return out;
}

const five = await spend(student, 5);
ok(five.length === 5 && five.every(x => x.counted) && five[4].left === 0 && five[4].used === 5, 'five successful student prompts use the day', five.map(x => x.used));
const sixth = await read(await call('/api/ai/prompt', {method: 'POST', token: student, body: {op: 'begin'}}));
ok(sixth.status === 429 && sixth.left === 0 && sixth.used === 5, 'the sixth is refused and does not increment', sixth);
const shared = await read(await call('/api/ai/share', {method: 'POST', token: student, body: {on: true}}));
ok(shared.unlimited && shared.share && shared.plan === 'student', 'opting in makes student server AI unlimited', shared);
ok(store.keys().includes('adam/training/note'), 'the share flag does not remove stored training', store.keys());
const off = await read(await call('/api/ai/share', {method: 'POST', token: student, body: {on: false}}));
ok(!off.unlimited && off.left === 0 && off.share === false && store.keys().includes('adam/training/note'), 'turning sharing off returns the student to the daily cap and keeps training', off);
const again = await spend(freeTok, 1, {failAt: 0});
ok(again[0].counted === false && again[0].used === 0 && again[0].left === 5, 'aborting an errored generation does not count', again[0]);
const follow = await spend(freeTok, 2);
ok(follow.length === 2 && follow[1].used === 2, 'a follow-up counts as a second prompt', follow.map(x => x.used));

const p = await read(await call('/api/ai/prompt', {method: 'POST', token: pro, body: {op: 'begin'}}));
const y = await read(await call('/api/ai/prompt', {method: 'POST', token: year, body: {op: 'begin'}}));
const e = await read(await call('/api/ai/prompt', {method: 'POST', token: ent, body: {op: 'begin'}}));
ok(p.allow && p.unlimited && p.hold == null && y.unlimited && e.unlimited, 'Pro monthly, Pro yearly and Enterprise are unlimited', [p.plan, y.plan, e.plan]);

now = Date.UTC(2026, 10, 21, 0, 30);
const next = await read(await call('/api/ai/quota', {token: student}));
ok(next.day === '2026-11-21' && next.used === 0 && next.left === 5 && !next.unlimited, 'the cap resets at midnight UTC', next);

env.accountMe = () => ({id: 'acct_9', name: 'Bea'});
const acct = await spend('', 5);
ok(acct.length === 5 && acct[4].used === 5, 'a signed-in Amni account gets 5 a day');
const acct6 = await read(await call('/api/ai/prompt', {method: 'POST', body: {op: 'begin'}}));
ok(acct6.status === 429, 'the account cannot pass the cap by omitting the license');

const edgeEnv = {ASSETS: {fetch: () => { throw new Error('assets should not serve the meter'); }}, store: memoryStore(), PUB: rawPub, now: () => day0};
const routed = await edge.fetch(new Request('https://amni-scient.com/api/ai/quota', {headers: {origin: 'https://amni-scient.com'}}), edgeEnv);
const rj = await routed.json();
ok(routed.status === 200 && rj.signed === false && rj.cap === 5, 'the edge worker routes /api/ai/quota', rj);

console.log(fail ? fail + ' FAILED' : 'ALL PASS');
process.exit(fail ? 1 : 0);
