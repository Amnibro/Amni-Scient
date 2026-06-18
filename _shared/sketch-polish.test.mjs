import { emptyScene, addNode, addRun, runLengthFt, evaluate } from './sketch.js'
import { bomCsv } from './sketch-canvas.js'
const results = [], check = (n, ok) => results.push([n, ok])
// scale: a fixed pixel run = different ft at different scalePxPerFt
const s = emptyScene(24); const A = addNode(s, 'panel', 0, 0), B = addNode(s, 'recept', 240, 0); addRun(s, 'x', A, B)
const r = s.runs[0]
check('24 px/ft -> 10 ft', Math.abs(runLengthFt(r, s) - 10) < 1e-9)
s.scalePxPerFt = 48
check('48 px/ft -> 5 ft', Math.abs(runLengthFt(r, s) - 5) < 1e-9)
s.scalePxPerFt = 12
check('12 px/ft -> 20 ft', Math.abs(runLengthFt(r, s) - 20) < 1e-9)
// csv
const trade = { bom: () => [{ key: 'a', qty: 2, unit: 'ea' }, { key: 'b', qty: 3, unit: 'ft' }], validate: () => [] }
const cat = { a: { name: 'Item A', hd: 5 }, b: { name: 'Item B', hd: 2 } }
const ev = evaluate(s, trade, cat, 'hd') // total = 2*5 + 3*2 = 16
const csv = bomCsv(ev, { laborPct: 0 })
const lines = csv.split('\n')
check('csv header', lines[0].toLowerCase().startsWith('item'))
check('csv Item A row + cost', csv.includes('Item A') && csv.includes('10.00'))
check('csv TOTAL 16', lines[lines.length - 1].includes('16.00'))
const csv2 = bomCsv(ev, { laborPct: 25 }) // +4 labor -> 20
check('csv labor 25% -> total 20', csv2.includes('20.00') && csv2.toLowerCase().includes('labor'))
let allok = true
for (const [n, ok] of results) { if (!ok) allok = false; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + n) }
console.log('VERDICT:', allok ? 'PASS' : 'FAIL')
