import {shoelace, perimeter, withWaste, concreteYards, pieces, quantify, WASTE} from '../takeoff.js';
import {BANNER, systemPrompt, parseReport, needsServerHold, serverTurnPlan, TASKS} from '../ai_run.js';
import {decide, meterClass, CAP} from '../../cad/ai_meter.js';

let fail = 0;
const ok = (c, m) => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

ok(shoelace([0, 10, 10, 0], [0, 0, 12, 12]) === 120, 'a 10 by 12 rectangle is 120 sq ft');
ok(Math.abs(perimeter([0, 10, 10, 0], [0, 0, 12, 12]) - 44) < 1e-9, 'that rectangle has a 44 ft perimeter');
ok(shoelace([0, 1], [0, 1]) === 0, 'two points are not a footprint');
ok(Math.abs(withWaste(100, WASTE.deck) - 110) < 1e-9, 'deck boards add 10 percent');
ok(Math.abs(withWaste(100, WASTE.deck_diagonal) - 115) < 1e-9, 'diagonal deck boards add 15 percent');
ok(Math.abs(concreteYards(120, 4) - 1.481481) < 1e-4, '120 sq ft at 4 in is about 1.48 cubic yards');
ok(pieces(10, 8) === 2 && pieces(8, 8) === 1 && pieces(0, 8) === 0, 'board count rounds up and refuses a zero length');

const q = quantify({trade: 'patio', waste: 'concrete', thickness_in: 4, footprint: [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 12}, {x: 0, y: 12}]});
ok(q.area_sqft === 120 && q.order_area_sqft === 132 && q.concrete_yd3 === 1.63, 'patio order area and concrete include waste', q);

ok(systemPrompt('layout').includes(BANNER) && systemPrompt('safety').includes('811'), 'every prompt tells the model the result is a suggestion');
ok(TASKS.layout.needImage && !TASKS.review.needImage, 'a layout starts from an image; a review can be notes only');

const raw = '{"say":"A 10 by 12 patio.","layout":{"trade":"patio","name":"Back slab","footprint":[{"x":0,"y":0},{"x":10,"y":0},{"x":10,"y":12},{"x":0,"y":12}],"thickness_in":4,"waste":"concrete"},"review":[{"issue":"No slope called out","where":"slab","why":"Water should fall away from the house","severity":"check"}],"safety":[{"item":"Call 811"}]}';
const rep = parseReport('```json\n' + raw + '\n```');
ok(rep.ok && rep.banner === BANNER && rep.qty.area_sqft === 120 && rep.review[0].severity === 'check' && rep.safety[0].item === 'Call 811', 'a fenced reply becomes a labeled report and the area is recomputed');
ok(!parseReport('not json').ok, 'prose is not applied as a layout');

ok(CAP === 5, 'the shared free cap is 5 a day');
for (const k of ['browser', 'local', 'chrome', 'paste']) ok(!needsServerHold(k) && meterClass(k) === 'local', k + ' is not a server prompt');
for (const k of ['anthropic', 'openai', 'gemini', 'openrouter']) ok(!needsServerHold(k) && meterClass(k) === 'byok', k + ' is the person\'s own key');
ok(needsServerHold('server') && meterClass('server') === 'server', 'only the server engine is metered');
ok(needsServerHold('server', true) === false, 'the offline HTML download is never metered');
ok(decide({local: true, signed: false, used: 9}).allow && !decide({local: true, signed: false, used: 9}).count, 'local AI stays free with no account');
ok(!decide({signed: true, plan: 'free', used: 5}).allow, 'the shared meter refuses the 6th server prompt');
ok(decide({signed: true, plan: 'pro', used: 40}).unlimited, 'Amni-CAD Pro is unlimited on the same meter');
ok(serverTurnPlan({allow: false, need: 'signin'}).reason === 'signin', 'a server refusal asks for sign-in');
ok(serverTurnPlan({allow: true, hold: 'h1'}).call === 'hold', 'a reserved prompt must be committed or aborted');
ok(serverTurnPlan({allow: true}).call === 'direct', 'an unlimited plan does not take a hold');

console.log(fail ? fail + ' FAILED' : 'ALL PASS');
process.exit(fail ? 1 : 0);
