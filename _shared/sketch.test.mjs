import { emptyScene, addNode, addRun, measure, runLengthFt, priceBOM, evaluate, reachableFrom } from './sketch.js'
const catalog = { nm142: { name: '14/2 NM-B (250ft)', hd: 79 }, recept: { name: 'Receptacle', hd: 1.98 }, box: { name: 'Box', hd: 1.18 }, breaker: { name: 'Breaker', hd: 8.97 } }
// scene: panel + 3 receptacles + switch + light, runs of known length (24 px/ft)
const s = emptyScene(24)
const P = addNode(s, 'panel', 0, 0), R1 = addNode(s, 'recept', 240, 0), R2 = addNode(s, 'recept', 240, 240), R3 = addNode(s, 'recept', 480, 240), SW = addNode(s, 'switch', 0, 240), L = addNode(s, 'light', 0, 480)
addRun(s, 'nm142', P, R1)            // 10 ft
addRun(s, 'nm142', R1, R2)           // 10 ft
addRun(s, 'nm142', R2, R3)           // 10 ft
addRun(s, 'nm142', P, SW, [[0, 120]])// 10 ft, one waypoint (elbow)
addRun(s, 'nm142', SW, L)            // 10 ft
const m = measure(s)
const totFt = m.byRunType.nm142
const tradeElec = {
  bom: (scene, mm) => {
    const ft = mm.byRunType.nm142 || 0
    return [
      { key: 'nm142', qty: Math.ceil(ft / 250), unit: 'roll(s)', note: Math.round(ft) + ' ft' },
      { key: 'recept', qty: mm.nodeCounts.recept || 0, unit: 'ea' },
      { key: 'box', qty: scene.nodes.length, unit: 'ea' },
      { key: 'breaker', qty: 1, unit: 'ea' },
    ]
  },
  validate: (scene, mm) => {
    const checks = []
    const reach = reachableFrom(scene, P)
    const orphans = scene.nodes.filter(n => !reach.has(n.id))
    checks.push(orphans.length ? { level: 'fail', msg: orphans.length + ' device(s) not wired to the panel' } : { level: 'ok', msg: 'all devices reach the panel' })
    return checks
  },
}
const ev = evaluate(s, tradeElec, catalog, 'hd')
const pass = []
pass.push(['run total ft', Math.abs(totFt - 50) < 1e-6])
pass.push(['recept count', m.nodeCounts.recept === 3])
pass.push(['elbows (1 waypoint)', m.elbows === 1])
pass.push(['nodes', s.nodes.length === 6])
pass.push(['bom recept qty', ev.bom.find(b => b.key === 'recept').qty === 3])
pass.push(['quote total', Math.abs(ev.quote.total - (79 * 1 + 1.98 * 3 + 1.18 * 6 + 8.97 * 1)) < 1e-6])
pass.push(['all-reach ok', ev.checks[0].level === 'ok'])
const s2 = emptyScene(24); const P2 = addNode(s2, 'panel', 0, 0); addNode(s2, 'recept', 100, 100)
pass.push(['orphan detected', evaluate(s2, tradeElec, catalog).checks[0].level === 'fail'])
let allok = true
for (const [name, ok] of pass) { if (!ok) allok = false; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name) }
console.log('measured: ' + totFt.toFixed(1) + ' ft nm142, quote $' + ev.quote.total.toFixed(2))
console.log('VERDICT:', allok ? 'PASS' : 'FAIL')
