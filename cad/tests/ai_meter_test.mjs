import {decide, meterClass, meterView, planOf, CAP} from '../ai_meter.js';
import {createTeachQueue} from '../teach_queue.js';
let fail = 0;
const ok = (c, m) => { c || fail++; console.log(c ? 'PASS' : 'FAIL', m); };
const d = o => decide(o);

ok(CAP === 5, 'the free daily cap is 5');
ok(meterClass('browser', {offlineHtml: true}) === 'local' && meterClass('server', {offlineHtml: true}) === 'local', 'the offline HTML download is never metered');
for (const k of ['browser', 'local', 'chrome', 'paste', 'bridge', 'remote']) ok(meterClass(k) === 'local', k + ' stays on the device');
for (const k of ['anthropic', 'openai', 'gemini', 'openrouter']) ok(meterClass(k) === 'byok', k + ' is the user\u2019s own key, not our server');
ok(meterClass('server') === 'server', 'the server engine is the metered path');

ok(planOf(null) === 'free' && planOf({plan: 'month'}) === 'pro' && planOf({plan: 'year'}) === 'pro' && planOf({plan: 'pro'}) === 'pro', 'Pro monthly and yearly are Pro');
ok(planOf({plan: 'student'}) === 'student' && planOf({plan: 'enterprise'}) === 'enterprise' && planOf({life: 3, plan: 'life1'}) === 'lifetime', 'student, enterprise and lifetime keep their plans');

const local = d({local: true, signed: false, used: 99});
ok(local.allow && !local.count && local.reason === 'local', 'local AI is allowed and not counted, signed in or not');
ok(!d({signed: false}).allow && d({signed: false}).reason === 'signin', 'anonymous server AI is refused');

const free = [];
for (let i = 0; i < 5; i++) free.push(d({signed: true, plan: 'free', used: i, ok: true}));
ok(free.every(x => x.allow && x.count) && free[4].left === 0, 'a free account can run 5 successful server prompts');
ok(!d({signed: true, plan: 'free', used: 5}).allow && d({signed: true, plan: 'free', used: 5}).reason === 'limit', 'the 6th server prompt is refused');
const err = d({signed: true, plan: 'free', used: 4, ok: false});
ok(err.allow && !err.count && err.reason === 'error' && err.left === 1, 'an errored generation does not count');
ok(d({signed: true, plan: 'free', used: 1}).count && d({signed: true, plan: 'free', used: 1}).reason === 'ok', 'a follow-up is counted the same as a first prompt');

for (const plan of ['pro', 'enterprise', 'lifetime']) {
  const u = d({signed: true, plan, used: 40});
  ok(u.allow && !u.count && u.unlimited, plan + ' server AI is unlimited');
}
ok(d({signed: true, plan: 'student', share: false, used: 5}).reason === 'limit', 'a student who does not share gets the same 5 a day');
ok(d({signed: true, plan: 'student', share: true, used: 40}).unlimited && !d({signed: true, plan: 'student', share: true, used: 40}).count, 'a student who shares gets unlimited server AI');
ok(!d({signed: true, plan: 'free', share: true, used: 5}).allow, 'sharing does not raise the cap for a free account');

const view = meterView({signed: true, plan: 'free', left: 5, cap: 5, unlimited: false}, 'local');
ok(view.lines.some(x => x.text === 'On this device · unlimited') && view.lines.some(x => x.text === '5 of 5 left today') && !view.wall, 'the counter shows the device line and 5 of 5 left today');
ok(meterView({signed: true, plan: 'free', left: 0, cap: 5}, 'local').wall, 'zero left raises the limit wall');
ok(meterView({signed: true, plan: 'student', left: 0, cap: 5, share: false}, 'local').student, 'the wall knows a student who is not sharing');
ok(meterView({signed: true, unlimited: true, plan: 'pro'}, 'local').lines.some(x => x.text === 'Unlimited server AI'), 'Pro shows unlimited');
ok(meterView({offline: true}, 'local').lines.some(x => /back online/.test(x.text)) && !meterView({offline: true}, 'local').wall, 'offline does not invent a zero');
ok(meterView(null, 'byok').lines[0].text === 'Your API key · not counted', 'a user\u2019s own key is labeled as not counted');

const bag = new Map();
const storage = {getItem: k => bag.has(k) ? bag.get(k) : null, setItem: (k, v) => bag.set(k, v)};
const q = createTeachQueue(storage);
q.push({id: 'a'}); q.push({id: 'b'});
let n = 0;
const sent = await q.flush(async row => { if (row.id === 'b' && n++ === 0) throw new Error('offline'); });
ok(sent.sent === 1 && sent.left === 1 && q.all().length === 1 && q.all()[0].id === 'b', 'a failed upload stays queued and a successful one leaves');
const again = await q.flush(async () => {});
ok(again.sent === 1 && q.all().length === 0, 'the queued upload goes out on the next try');
q.push({id: 'c'}); q.clear();
ok(q.all().length === 0, 'turning sharing off drops the queue');

console.log(fail ? fail + ' FAILED' : 'ALL PASS');
process.exit(fail ? 1 : 0);
