import { emptyScene, addNode, addRun, measure } from './sketch.js'
import { validateElec, bomElec } from './elec-rules.js'
const has = (cks, level, sub) => cks.some(c => c.level === level && c.msg.toLowerCase().includes(sub.toLowerCase()))
const ev = s => validateElec(s, measure(s))
const results = []
const check = (name, ok) => results.push([name, ok])

// 1) overloaded 15A circuit: 10 recepts (1800 VA) on 14-2 (1440 budget) -> fail
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); let prev = P; for (let i = 0; i < 10; i++) { const r = addNode(s, 'recept', 40 + i * 30, 40); addRun(s, 'nm142', prev, r); prev = r } check('overloaded 15A -> fail', has(ev(s), 'fail', 'exceeds')) }
// 2) correct 20A circuit: 5 recepts (900 VA) on 12-2 -> no overload fail, has ok 80% line
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); let prev = P; for (let i = 0; i < 5; i++) { const r = addNode(s, 'recept', 40 + i * 30, 40); addRun(s, 'nm122', prev, r); prev = r } const c = ev(s); check('ok 20A -> no overload', !has(c, 'fail', 'exceeds') && has(c, 'ok', '80% rule')) }
// 3) kitchen outlet, no GFCI -> fail
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); const r = addNode(s, 'recept', 60, 40, { room: 'kitchen' }); addRun(s, 'nm122', P, r); check('kitchen no GFCI -> fail', has(ev(s), 'fail', 'gfci required')) }
// 4) kitchen with GFCI device -> ok GFCI
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); const g = addNode(s, 'gfci', 60, 40, { room: 'kitchen' }); addRun(s, 'nm122', P, g); check('kitchen GFCI present -> ok', has(ev(s), 'ok', 'gfci protection present')) }
// 5) range sharing a circuit with an outlet -> dedicated fail
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); const rg = addNode(s, 'range', 60, 40); const r = addNode(s, 'recept', 120, 40); addRun(s, 'nm63', P, rg); addRun(s, 'nm63', rg, r); check('range shared -> dedicated fail', has(ev(s), 'fail', 'dedicated circuit')) }
// 6) range alone -> dedicated ok
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); const rg = addNode(s, 'range', 60, 40); addRun(s, 'nm63', P, rg); check('range alone -> dedicated ok', has(ev(s), 'ok', 'dedicated range')) }
// 7) undersized branch: 20A home run, 15A branch wire -> fail
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); const j = addNode(s, 'recept', 60, 40); const r = addNode(s, 'recept', 120, 40); addRun(s, 'nm122', P, j); addRun(s, 'nm142', j, r); check('undersized branch -> fail', has(ev(s), 'fail', 'undersized wire')) }
// 8) orphan device -> fail
{ const s = emptyScene(24); addNode(s, 'panel', 0, 0); addNode(s, 'recept', 200, 200); check('orphan -> fail', has(ev(s), 'fail', 'not wired')) }
// 9) bom: correct 20A scene produces a breaker + cable roll + receptacles
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); let prev = P; for (let i = 0; i < 5; i++) { const r = addNode(s, 'recept', 40 + i * 30, 40); addRun(s, 'nm122', prev, r); prev = r } const b = bomElec(s, measure(s)); check('bom has cable roll', b.some(x => x.key === 'nm122')); check('bom has receptacles', (b.find(x => x.key === 'recept') || {}).qty === 5); check('bom has breaker', b.some(x => x.key === 'breaker')); check('bom has panel', b.some(x => x.key === 'panel')) }
// 10) bom: kitchen scene needs a gfci breaker
{ const s = emptyScene(24); const P = addNode(s, 'panel', 0, 0); const r = addNode(s, 'recept', 60, 40, { room: 'kitchen' }); addRun(s, 'nm122', P, r); check('bom kitchen -> gfci breaker', bomElec(s, measure(s)).some(x => x.key === 'gfci')) }

let allok = true
for (const [n, ok] of results) { if (!ok) allok = false; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + n) }
console.log('VERDICT:', allok ? 'PASS' : 'FAIL')
