import { initPermits } from './codes.js?v=fix1'
import { emptyScene, addNode, addRun } from './sketch.js'
import { mountSketch } from './sketch-canvas.js'
import { makeHvacTrade } from './hvac-rules.js'
const $ = s => document.querySelector(s)
const LSP = 'amnihvac.prices.v1', SK_LS = 'amnihvac.sketch.v2'
let catalog = {}, lastEv = null
let priceEdits = (() => { try { return JSON.parse(localStorage.getItem(LSP)) || {} } catch (e) { return {} } })()
document.querySelectorAll('.tab').forEach(t => t.onclick = () => { document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t)); document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === `pane-${t.dataset.pane}`)); if (t.dataset.pane === '3d') mount3DView() })

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

const G_LS = 'amnihvac.guide.v1'
let gChk = (() => { try { return JSON.parse(localStorage.getItem(G_LS)) || {} } catch (e) { return {} } })()
const GUIDE = [
  ['📋 Design & permit', ['Do a Manual J load calc room-by-room — never size off floor area; it sets the BTU/h.', 'Manual S: pick equipment to the load (right-size, not max). ~400 CFM/ton.', 'Manual D: size each run for its CFM at ~0.08-0.1 in. w.c./100 ft — the Layout flags undersized ducts.', 'Pull the mechanical permit; a new condenser also needs an electrical permit (disconnect + circuit).']],
  ['🔧 Set equipment', ['Set the air handler/furnace level with service clearance; isolate vibration.', 'Slope the condensate drain, add a trap + a safety pan/float switch.', 'Outdoor condenser on a level pad with maker clearances; line-set sized + insulated.']],
  ['🛠️ Trunk & branch rough-in', ['Run the supply trunk first, sized for total CFM, reducing as branches drop off.', 'Take a branch to each register; gentle elbows, support flex with no sags or kinks.', 'Run the return back to the air handler — every supply needs a return path.']],
  ['🌬️ Registers, grilles & filter', ['Set supply boots + registers where the Layout shows them; aim the throw across the room.', 'Size return grille(s) for the airflow; add transfer grilles/jumpers for closed rooms.', 'Accessible filter slot sized for a low pressure drop.']],
  ['🧪 Seal & insulate', ['Seal every joint with mastic (not cloth tape); foil-tape seams.', 'Insulate ducts in unconditioned space to R-6/R-8.', 'Pressure-test ducts if code requires (a CFM25 leakage target).']],
  ['📏 Start-up & balance', ['Check total external static pressure is within the blower table.', 'Measure airflow; trim dampers so each room hits design CFM and supply ≈ return.', 'Verify charge (subcooling/superheat), combustion safety, and condensate flow.']]
]
function renderGuide() {
  const body = $('#guide-body'); if (!body) return
  body.innerHTML = `<div style="color:var(--mut);font-size:13px;margin-bottom:14px">A clean, in-order duct install for your drawn system${lastEv ? ` — about ${lastEv.measure.totalRunFt.toFixed(0)} ft of duct across ${lastEv.bom.length} line items` : ''}. Work top to bottom — this is a design helper, not a stamped Manual J/D.</div>`
    + GUIDE.map((ph, pi) => `<div class="card"><b>${ph[0]}</b><ul style="margin:8px 0 0;list-style:none;padding:0">${ph[1].map((s, ii) => { const k = pi + ':' + ii, on = gChk[k]; return `<li style="display:flex;gap:9px;padding:3px 0"><input type="checkbox" data-gk="${k}" ${on ? 'checked' : ''}><span style="color:${on ? 'var(--mut)' : 'var(--ink)'}">${s}</span></li>` }).join('')}</ul></div>`).join('')
  body.querySelectorAll('input[data-gk]').forEach(el => el.onchange = () => { gChk[el.dataset.gk] = el.checked; localStorage.setItem(G_LS, JSON.stringify(gChk)); renderGuide() })
}
function renderPlans() {
  const body = $('#plans-body'); if (!body) return
  if (!lastEv || !lastEv.bom.length) { body.innerHTML = '<p style="color:var(--mut);font-size:13px">Draw a duct layout on the ✏️ Layout tab — your duct schedule + printable plan builds itself here.</p>'; return }
  const m = lastEv.measure, sched = lastEv.bom.map(it => { const c = catalog[it.key] || {}; return `<tr><td>${c.name || it.key}</td><td>${it.qty} ${it.unit || ''}</td><td style="color:#666;font-size:12px">${it.note || ''}</td></tr>` }).join('')
  const fails = (lastEv.checks || []).filter(c => c.level === 'fail' || c.level === 'warn').map(c => c.msg || c.text || c.note || '')
  body.innerHTML = `<div class="planbar"><button class="btn acc" onclick="window.print()">🖨️ Print plans</button><span style="color:var(--mut);font-size:12px">Save the drawing from the ✏️ Layout tab (📸 Save image).</span></div>`
    + `<div class="svgwrap" style="padding:16px"><h2 style="color:#111;margin-bottom:6px">Duct &amp; equipment schedule</h2>`
    + `<div style="font-size:13px;color:#444;margin-bottom:12px">Total duct ≈ <b>${m.totalRunFt.toFixed(0)} ft</b> · ${sketchScene.nodes.length} fixtures. Size each run for the CFM it carries (Manual D ~0.08-0.1 in. w.c./100 ft; trunks ~700-900 fpm, branches ~600). Confirm against a stamped Manual J/D.</div>`
    + `<table style="color:#111"><tr><th>Item</th><th>Qty</th><th>Notes</th></tr>${sched}</table>`
    + (fails.length ? `<div style="margin-top:14px"><h3 style="color:#111;font-size:14px">Design checks to resolve</h3><ul style="color:#a05a00;font-size:13px;margin:6px 0 0 18px">${fails.map(s => `<li>${s}</li>`).join('')}</ul></div>` : `<div style="margin-top:12px;color:#2a7d2c;font-size:13px">✓ Design checks pass.</div>`)
    + `</div>`
}
let view3d = null
async function mount3DView() { const host = $('#sketch3d-host'); if (!host) return; if (view3d) { view3d.rebuild(); return } try { const m = await import('./sketch-3d.js?v=m4'); view3d = m.mount3D(host, { scene: sketchScene, trade: hvacTrade, catalog, store: 'hd', onChange: sc => { try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {} } }) } catch (e) { host.innerHTML = '<div style="padding:20px;color:#9aa0aa">3D sim unavailable</div>' } }
const hvacTrade = makeHvacTrade()
let sketchScene = (() => { try { const s = JSON.parse(localStorage.getItem(SK_LS)); if (s && s.nodes) return s } catch (e) {} return emptyScene(24) })()
const seedScene = () => {
  if (sketchScene.nodes.length) return
  const sc = sketchScene, sp = sc.scalePxPerFt = 24, W = 30, D = 24
  sc.floorCal = { w: W, d: D }
  const place = (type, fx, fz) => addNode(sc, type, fx * sp, fz * sp, { fx, fz, rot: 0 })
  const ah = place('airhandler', 0.9, D - 0.9), ret = place('return', 3.4, D - 0.9); addRun(sc, 'r12', ah, ret)
  const cols = 3, rows = 2
  let prev = ah, k = 0
  for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) { const c = r % 2 ? cols - 1 - cc : cc; const id = place('supply', W * (c + 0.8) / (cols + 0.6), D * (r + 0.7) / (rows + 0.8)); addRun(sc, k < 2 ? 's12' : k < 4 ? 's10' : 's8', prev, id); prev = id; k++ }
  try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {}
}
function setupSketch() { const host = $('#sketch-host'); if (!host) return; mountSketch(host, { scene: sketchScene, trade: hvacTrade, catalog, store: 'hd', onChange: sc => { try { localStorage.setItem(SK_LS, JSON.stringify(sc)) } catch (e) {} }, onEvaluate: ev => { lastEv = ev; renderMat(); renderPlans(); renderGuide() } }) }

catalog = await fetch('catalog.json').then(r => r.json()).catch(() => ({}))
seedScene()
setupSketch()
renderMat()
renderPlans()
renderGuide()
initPermits(() => ({}), () => null)
