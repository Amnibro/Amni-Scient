import { emptyScene, addNode, addRun, measure } from './sketch.js'
import { validatePlumb, bomPlumb } from './plumb-rules.js'
const has = (cks, level, sub) => cks.some(c => c.level === level && c.msg.toLowerCase().includes(sub.toLowerCase()))
const ev = s => validatePlumb(s, measure(s))
const results = [], check = (n, ok) => results.push([n, ok])

// 1) fixture with no vent -> fail
{ const s = emptyScene(24); const M = addNode(s, 'main', 0, 0); const L = addNode(s, 'lav', 100, 0); addRun(s, 'dwv15', L, M); check('no vent -> fail', has(ev(s), 'fail', 'no vent')) }
// 2) 4 toilets (12 DFU) through a 2" trunk -> undersized fail
{ const s = emptyScene(24); const M = addNode(s, 'main', 0, 0); const J = addNode(s, 'cleanout', 120, 0); const V = addNode(s, 'vent', 120, -80); addRun(s, 'dwv2', M, J); addRun(s, 'dwv2', J, V); for (let i = 0; i < 4; i++) { const w = addNode(s, 'toilet', 200, -120 + i * 60); addRun(s, 'dwv3', w, J) } check('12 DFU on 2" -> capacity fail', has(ev(s), 'fail', 'capacity')) }
// 3) proper lav: trap + vent (short) + drain to main -> ok, no fails
{ const s = emptyScene(24); const M = addNode(s, 'main', 300, 0); const V = addNode(s, 'vent', 100, -60); const L = addNode(s, 'lav', 100, 0); addRun(s, 'dwv15', L, V); addRun(s, 'dwv15', L, M); const c = ev(s); check('proper lav -> trapped+vented', has(c, 'ok', 'trapped + vented')); check('proper lav -> no fails', !c.some(x => x.level === 'fail')) }
// 4) no main -> fail
{ const s = emptyScene(24); const V = addNode(s, 'vent', 100, -60); const L = addNode(s, 'lav', 100, 0); addRun(s, 'dwv15', L, V); check('no main -> fail', has(ev(s), 'fail', 'no building drain')) }
// 5) toilet on 2" arm -> WC<3" fail
{ const s = emptyScene(24); const M = addNode(s, 'main', 300, 0); const V = addNode(s, 'vent', 100, -60); const W = addNode(s, 'toilet', 100, 0); addRun(s, 'dwv2', W, V); addRun(s, 'dwv2', W, M); check('WC on 2" -> 3in min fail', has(ev(s), 'fail', '3"')) }
// 6) bom: lav scene -> pipe + trap + stops
{ const s = emptyScene(24); const M = addNode(s, 'main', 300, 0); const V = addNode(s, 'vent', 100, -60); const L = addNode(s, 'lav', 100, 0); addRun(s, 'dwv15', L, V); addRun(s, 'dwv15', L, M); addRun(s, 'sup12', M, L); const b = bomPlumb(s, measure(s)); check('bom has trap', b.some(x => x.key === 'trap')); check('bom has supply pex', b.some(x => x.key === 'pex')); check('bom has stops', b.some(x => x.key === 'stop')) }

let allok = true
for (const [n, ok] of results) { if (!ok) allok = false; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + n) }
console.log('VERDICT:', allok ? 'PASS' : 'FAIL')
