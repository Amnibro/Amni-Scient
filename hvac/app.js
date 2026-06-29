import { initPermits } from './codes.js?v=fix1'
import { emptyScene, addNode, addRun } from './sketch.js'
import { mountSketch } from './sketch-canvas.js'
import { makeHvacTrade } from './hvac-rules.js'
const $ = s => document.querySelector(s)
const LSP = 'amnihvac.prices.v1', SK_LS = 'amnihvac.sketch.v1'
let catalog = {}, lastEv = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch (e) { return {} } })()
document.querySelectorAll('.tab').forEach(t => t.onclick = () => { document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t)); document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === `pane-${t.dataset.pane}`)) })

$('#best-body').innerHTML = `
<h2>Design it by the books (ACCA)</h2>
<div class="card"><b>Manual J — load calc.</b><p>Heat gain/loss room-by-room from insulation, glazing, orientation, infiltration and climate. This sets the BTU/h — never size off floor area alone, and don't "add a margin" (oversizing short-cycles and hurts comfort + humidity).</p></div>
<div class="card"><b>Manual S — equipment.</b><p>Pick equipment to the Manual J load (right-size, not max). ~400 CFM/ton of cooling airflow; a 2-ton system ≈ 800 CFM total.</p></div>
<div class="card"><b>Manual D — duct design.</b><p>Size each run for the CFM it carries at a target friction rate (~0.08-0.1 in. w.c./100 ft) and reasonable velocity (trunks ~700-900 fpm, branches ~600). The Layout tab flags ducts carrying more CFM than their size allows.</p></div>
<h2>Return air &amp; sealing</h2>
<div class="card"><b>Returns matter as much as supply.</b><p>Every supply needs a path back. Undersized return starves the blower, drops capacity, and can backdraft combustion appliances. Aim return airflow ≈ supply; add transfer grilles/jumper ducts for closed rooms.</p></div>
<div class="card"><b>Seal &amp; insulate.</b><p>Leaky ducts waste 20-30%. Seal joints with mastic (not cloth "duct" tape); insulate ducts in unconditioned space to R-6/R-8. Support flex without kinks or sags.</p></div>
<div class="card"><b>Combustion safety.</b><p>Gas/oil equipment needs proper venting and combustion air, plus a condensate path. A new condenser needs an electrical disconnect + dedicated circuit (separate permit).</p></div>
<p style="margin-top:14px;font-size:12px">This is an estimating + design helper, not a stamped Manual J/D or a code-compliance engine — confirm with your AHJ and a licensed mechanical contractor.</p>`

const price = (key, store) => { const k = `${key}.${store}`; return priceEdits[k] != null ? priceEdits[k] : (catalog[key] || {})[store] }
function renderMat() {
  const host = $('#mat-body'); if (!host) return
  if (!lastEv || !lastEv.bom.length) { host.innerHTML = '<p style="color:var(--mut);font-size:13px">Draw a duct layout on the ✏️ Layout tab — your priced materials list builds itself here.</p>'; return }
  let hd = 0, lo = 0
  const rows = lastEv.bom.map(it => {
    const c = catalog[it.key] || {}, ph = +price(it.key, 'hd') || 0, pl = +price(it.key, 'lowes') || 0; hd += ph * it.qty; lo += pl * it.qty
    const hl = c.hdq ? `<a href="https://www.homedepot.com/s/${encodeURIComponent(c.hdq)}" target="_blank" rel="noopener">HD</a>` : ''
    const ll = c.lq ? ` · <a href="https://www.lowes.com/search?searchTerm=${encodeURIComponent(c.lq)}" target="_blank" rel="noopener">Lowe's</a>` : ''
    return `<tr><td>${c.name || it.key}${it.note ? ` <span style="color:var(--mut)">(${it.note})</span>` : ''}</td><td>${it.qty} ${it.unit || ''}</td><td>$${(ph * it.qty).toFixed(2)}</td><td>$${(pl * it.qty).toFixed(2)}</td><td style="font-size:12px">${hl}${ll}</td></tr>`
  }).join('')
  host.innerHTML = `<table><tr><th>Item</th><th>Qty</th><th>Home Depot</th><th>Lowe's</th><th>Search</th></tr>${rows}<tr style="border-top:2px solid var(--line)"><td><b>Estimated total</b></td><td></td><td><b class="tot best">$${hd.toFixed(2)}</b></td><td><b>$${lo.toFixed(2)}</b></td><td></td></tr></table>`
}

const hvacTrade = makeHvacTrade()
let sketchScene = (() => { try { const s = JSON.parse(localStorage.getItem(SK_LS)); if (s && s.nodes) return s } catch (e) {} return emptyScene(24) })()
const seedScene = () => {
  if (sketchScene.nodes.length) return
  const sc = sketchScene, sp = sc.scalePxPerFt = 24, W = 30, D = 24
  sc.floorCal = { w: W, d: D }
  const place = (type, fx, fz) => addNode(sc, type, fx * sp, fz * sp, { fx, fz, rot: 0 })
  const ah = place('airhandler', 2.6, D - 2.6), ret = place('return', 5.2, D - 2.6); addRun(sc, 'r12', ah, ret)
  const cols = 3, rows = 2
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const id = place('supply', W * (c + 0.7) / (cols + 0.4), D * (r + 0.6) / (rows + 0.8)); addRun(sc, c === 0 ? 's10' : 's8', ah, id) }
  try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {}
}
function setupSketch() { const host = $('#sketch-host'); if (!host) return; mountSketch(host, { scene: sketchScene, trade: hvacTrade, catalog, store: 'hd', onChange: sc => { try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {} }, onEvaluate: ev => { lastEv = ev; renderMat() } }) }

catalog = await fetch('catalog.json').then(r => r.json()).catch(() => ({}))
seedScene()
setupSketch()
renderMat()
initPermits(() => ({}), () => null)
