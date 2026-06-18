import { emptyScene, addNode, addRun, measure } from './sketch.js'
import { validateHvac, bomHvac } from './hvac-rules.js'
const has = (cks, level, sub) => cks.some(c => c.level === level && c.msg.toLowerCase().includes(sub.toLowerCase()))
const ev = s => validateHvac(s, measure(s))
const results = [], check = (n, ok) => results.push([n, ok])

// 1) no air handler -> fail
{ const s = emptyScene(24); addNode(s, 'supply', 100, 0); check('no air handler -> fail', has(ev(s), 'fail', 'no air handler')) }
// 2) supply register not ducted -> fail
{ const s = emptyScene(24); addNode(s, 'airhandler', 0, 0, { tons: 2 }); addNode(s, 'supply', 200, 0); check('register not ducted -> fail', has(ev(s), 'fail', 'not ducted')) }
// 3) undersized duct: three 100-CFM registers through a 6" trunk (cap 110) -> fail
{ const s = emptyScene(24); const AH = addNode(s, 'airhandler', 0, 0, { tons: 3 }); const J = addNode(s, 'damper', 120, 0); addRun(s, 's6', AH, J); for (let i = 0; i < 3; i++) { const r = addNode(s, 'supply', 240, -60 + i * 60, { cfm: 100 }); addRun(s, 's8', J, r) } check('300 CFM on 6" -> capacity fail', has(ev(s), 'fail', 'capacity')) }
// 4) proper balanced 1.5-ton system -> ok airflow + ok return, no fails
{ const s = emptyScene(24); const AH = addNode(s, 'airhandler', 0, 0, { tons: 1.5 }); for (let i = 0; i < 6; i++) { const r = addNode(s, 'supply', 200, -150 + i * 60, { cfm: 100 }); addRun(s, 's8', AH, r) } for (let i = 0; i < 2; i++) { const g = addNode(s, 'return', -200, -60 + i * 120, { cfm: 300 }); addRun(s, 'r10', AH, g) } const c = ev(s); check('1.5-ton supply -> ok airflow', has(c, 'ok', 'ton airflow')); check('return balances', has(c, 'ok', 'balances supply')); check('proper -> no fails', !c.some(x => x.level === 'fail')) }
// 5) no return -> fail
{ const s = emptyScene(24); const AH = addNode(s, 'airhandler', 0, 0, { tons: 2 }); const r = addNode(s, 'supply', 200, 0, { cfm: 100 }); addRun(s, 's8', AH, r); check('no return -> fail', has(ev(s), 'fail', 'no return')) }
// 6) return under supply -> warn
{ const s = emptyScene(24); const AH = addNode(s, 'airhandler', 0, 0, { tons: 2 }); for (let i = 0; i < 8; i++) { const r = addNode(s, 'supply', 200, -210 + i * 60, { cfm: 100 }); addRun(s, 's8', AH, r) } const g = addNode(s, 'return', -200, 0, { cfm: 100 }); addRun(s, 'r10', AH, g); check('low return -> warn', has(ev(s), 'warn', 'starves')) }
// 7) bom: registers + duct + ahu
{ const s = emptyScene(24); const AH = addNode(s, 'airhandler', 0, 0); const r = addNode(s, 'supply', 240, 0, { cfm: 100 }); addRun(s, 's8', AH, r); const g = addNode(s, 'return', -240, 0, { cfm: 100 }); addRun(s, 'r10', AH, g); const b = bomHvac(s, measure(s)); check('bom has register', (b.find(x => x.key === 'register') || {}).qty === 1); check('bom has duct', b.some(x => /^duct/.test(x.key))); check('bom has ahu', b.some(x => x.key === 'ahu')); check('bom has grille', b.some(x => x.key === 'grille')) }

let allok = true
for (const [n, ok] of results) { if (!ok) allok = false; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + n) }
console.log('VERDICT:', allok ? 'PASS' : 'FAIL')
