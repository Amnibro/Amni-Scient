const ICC = 'https://www.iccsafe.org/advocacy/code-adoption-map/'
const ST = { AL: ['Alabama', 'IRC-based state minimum code', 6, null], AK: ['Alaska', 'IRC adopted by boroughs/cities', 60, null], AZ: ['Arizona', 'IRC - city/county adoption', 18, null], AR: ['Arkansas', 'Arkansas Residential Code (IRC)', 15, null], CA: ['California', 'CA Residential Code (Title 24, Part 2.5)', 12, 'https://www.dgs.ca.gov/BSC'], CO: ['Colorado', 'IRC - city/county adoption', 36, null], CT: ['Connecticut', 'CT State Building Code (IRC)', 42, 'https://portal.ct.gov/das'], DE: ['Delaware', 'IRC - county/municipal adoption', 24, null], FL: ['Florida', 'Florida Building Code - Residential', 0, 'https://floridabuilding.org'], GA: ['Georgia', 'GA State Minimum Standard Codes (IRC)', 8, 'https://dca.georgia.gov/construction-codes'], HI: ['Hawaii', 'IRC/IBC - county adoption', 0, null], ID: ['Idaho', 'Idaho Residential Code', 30, null], IL: ['Illinois', 'IRC - municipal adoption (no statewide)', 40, null], IN: ['Indiana', 'Indiana Residential Code', 36, null], IA: ['Iowa', 'IRC - city/county adoption', 42, null], KS: ['Kansas', 'IRC - city/county adoption', 30, null], KY: ['Kentucky', 'Kentucky Residential Code', 24, null], LA: ['Louisiana', 'LA State Uniform Construction Code (IRC)', 3, null], ME: ['Maine', 'MUBEC (IRC-based)', 54, null], MD: ['Maryland', 'MD Building Performance Standards (IRC)', 30, null], MA: ['Massachusetts', '780 CMR MA State Building Code (IRC)', 48, 'https://www.mass.gov/orgs/board-of-building-regulations-and-standards'], MI: ['Michigan', 'Michigan Residential Code', 42, 'https://www.michigan.gov/lara'], MN: ['Minnesota', 'Minnesota Residential Code', 60, null], MS: ['Mississippi', 'IRC - city/county adoption', 6, null], MO: ['Missouri', 'IRC - city/county adoption', 30, null], MT: ['Montana', 'Montana Residential Code (IRC)', 54, null], NE: ['Nebraska', 'IRC - city/county adoption', 40, null], NV: ['Nevada', 'IRC - city/county adoption', 18, null], NH: ['New Hampshire', 'NH State Building Code (IRC)', 54, null], NJ: ['New Jersey', 'NJ Uniform Construction Code (IRC)', 36, 'https://www.nj.gov/dca/divisions/codes/'], NM: ['New Mexico', 'NM Residential Building Code', 18, null], NY: ['New York', 'Residential Code of NYS (IRC-based)', 48, 'https://dos.ny.gov/building-standards-and-codes'], NC: ['North Carolina', 'NC Residential Code', 12, 'https://www.ncosfm.gov'], ND: ['North Dakota', 'ND State Building Code (IRC)', 60, null], OH: ['Ohio', 'Residential Code of Ohio', 32, 'https://com.ohio.gov'], OK: ['Oklahoma', 'OK Uniform Building Code (IRC)', 15, null], OR: ['Oregon', 'Oregon Residential Specialty Code', 18, 'https://www.oregon.gov/bcd'], PA: ['Pennsylvania', 'PA Uniform Construction Code (IRC)', 36, 'https://www.pa.gov/agencies/dli.html'], RI: ['Rhode Island', 'RI State Building Code (IRC)', 40, null], SC: ['South Carolina', 'SC Residential Code', 8, null], SD: ['South Dakota', 'IRC - city/county adoption', 48, null], TN: ['Tennessee', 'TN Residential Code (IRC)', 12, null], TX: ['Texas', 'IRC - municipal adoption', 6, null], UT: ['Utah', 'Utah Residential Code', 32, null], VT: ['Vermont', 'RBES + town-adopted IRC', 54, null], VA: ['Virginia', 'Virginia USBC (IRC)', 24, 'https://www.dhcd.virginia.gov/codes'], WA: ['Washington', 'WA State Building Code (IRC)', 18, 'https://sbcc.wa.gov'], WV: ['West Virginia', 'WV State Building Code (IRC)', 32, null], WI: ['Wisconsin', 'WI Uniform Dwelling Code', 54, 'https://dsps.wi.gov'], WY: ['Wyoming', 'IRC - city/county adoption', 42, null], DC: ['District of Columbia', 'DC Residential Code (IRC)', 24, null] }
const TRADE = (document.querySelector('meta[name="amni-trade"]')?.content || 'deck').toLowerCase()
const SNOWY = ['NY', 'VT', 'NH', 'ME', 'MA', 'CT', 'MI', 'MN', 'WI', 'CO', 'UT', 'MT', 'ID', 'WY', 'PA', 'OH', 'IL', 'IA', 'ND', 'SD', 'AK', 'RI', 'NJ']
const NOUN = { deck: 'deck', patio: 'patio concrete', pool: 'swimming pool', floor: 'flooring', roof: 'roof reroof', frame: 'framing addition', plumb: 'plumbing', elec: 'electrical', plan: 'building zoning', garden: 'zoning' }
const g = q => 'https://www.google.com/search?q=' + encodeURIComponent(q)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
let loc = (() => { try { return JSON.parse(localStorage.getItem('amni_construct_loc') || localStorage.getItem('amni_deck_loc')) || { st: '', city: '' } } catch { return { st: '', city: '' } } })()
let getCfg = () => null
let getOut = () => null
const save = () => localStorage.setItem('amni_construct_loc', JSON.stringify(loc))
const box = (cls, html) => `<div class="warn ${cls}">${html}</div>`
const lk = (url, txt) => `<a href="${url}" target="_blank" rel="noopener" style="color:var(--acc2);text-decoration:none">↗ ${esc(txt)}</a>`
const num = (c, k, d = 0) => { const v = c && c[k]; return v == null || isNaN(+v) ? d : +v }
const TRADES = {
  deck(cfg, out, frost, rows) {
    const h = num(cfg, 'height'), area = num(cfg, 'length') * num(cfg, 'depth'), led = cfg.attach === 'ledger'
    const risers = out?.calc?.risers ?? 0, riser = out?.calc?.riser ?? ''
    led ? rows.push(box('', `Ledger-attached: a permit is required nearly everywhere${frost >= 30 ? `, and footings typically must bear below frost (~${frost}")` : ''}. Flash the ledger (IRC R507.9.1.3); deck blocks on grade are usually only OK freestanding.`)) : (area <= 200 && h < 30 ? rows.push(box('ok', `Freestanding, ${area} ft² ≤ 200 and under 30" high: often permit-EXEMPT (IRC R105.2(1)) if it doesn't serve the exit door — confirm with ${loc.city || 'your town'}.`)) : rows.push(box('', `Freestanding but ${area > 200 ? 'over 200 ft²' : '30"+ high'} — expect a permit.`)))
    rows.push(box(h >= 30 ? '' : 'ok', h >= 30 ? `Deck ${h}" above grade: guards REQUIRED — 36" min, 4" sphere rule (IRC R312).` : `Deck ${h}" above grade (<30"): guards optional per IRC R312 — many towns still want them.`))
    risers > 0 && rows.push(box('info', `Stairs: ${risers} risers @ ${esc(riser)} (IRC R311.7, max 7-3/4" rise). ${risers >= 4 ? 'A graspable handrail 34-38" is required (4+ risers).' : 'Under 4 risers: handrail optional most places.'}`))
    rows.push(box('info', `Connections: ledger lags/LedgerLOK to the rim (R507.9), joists in hangers, posts on footings R507.3 / R403, lateral-load anchors R507.9.2. See the 2D detail sheets.`))
  },
  patio(cfg, out, frost, rows) {
    const area = out?.calc?.area_ft2 ?? 0
    rows.push(box('info', `Flatwork is usually NOT an IRC building-permit item, but ZONING is: check lot-coverage / impervious-surface limits + setbacks before you pour${area ? ` (${area.toFixed(0)} ft²)` : ''}.`))
    rows.push(box('', `Against the house: isolation joint full depth, slope 1/4"/ft AWAY from the foundation, and keep the slab top ≥4" below siding/weep screed.`))
    frost >= 30 && rows.push(box('info', `Cold climate (~${frost}" frost): a thickened/turndown edge or proper base prevents heave; control joints ≈ 2-3× slab thickness in feet.`))
    rows.push(box('info', `Call 811 before you dig — utility locates are free and legally required in every state.`))
  },
  pool(cfg, out, frost, rows) {
    const gal = out?.calc?.gallons ?? 0, inground = cfg.kind !== 'above'
    rows.push(box('', `BARRIER REQUIRED (IRC App G / ISPSC): ≥48" fence/wall, no gaps a 4" sphere passes, self-closing + self-latching gate (latch ≥54"). Power/auto safety covers and alarms where allowed.`))
    rows.push(box('', `Electrical NEC Art 680: equipotential BONDING of shell, deck, ladders & pump; pool receptacles GFCI-protected; no overhead lines over the water.`))
    rows.push(box('info', `Anti-entrapment: dual VGB-compliant main drains (never a single suction outlet). No diving where deep end < 8 ft.`))
    rows.push(box('info', `${inground ? 'In-ground' : 'Above-ground'} pool${gal ? ` (~${gal.toLocaleString()} gal)` : ''}: permit + barrier/bonding/final inspections; check zoning setback from lot lines + septic. Call 811 before excavating.`))
  },
  floor(cfg, out, frost, rows) {
    rows.push(box('ok', `Flooring is a finish — it rarely needs a building permit on its own. Follow the manufacturer's install spec to keep the warranty.`))
    rows.push(box('', `Moisture is the #1 failure: test slab RH / calcium-chloride; vapor barrier under floating floors on or below grade; acclimate material 48 h in the room.`))
    cfg.material === 'tile' && rows.push(box('info', `Tile: cement backer or uncoupling membrane over wood; subfloor deflection L/360 (L/720 for natural stone).`))
    rows.push(box('info', `Where the floor is part of a fire-rated assembly (units, garage-below) the assembly's rating must be maintained.`))
  },
  roof(cfg, out, frost, rows) {
    const pitch = num(cfg, 'pitch', 6), cold = frost >= 30
    rows.push(box('', `Reroofing IS permitted (IRC R908): max 2 layers — tear off to the deck if there's a 2nd layer, rot, or it's slate/tile/metal. Replace damaged sheathing.`))
    rows.push(box(cold ? '' : 'info', `Ice barrier (IRC R905.1.2): from the eave to ≥24" inside the warm-wall line${cold ? ` — your climate (~${frost}" frost) requires it` : ' in cold/snow regions'}, and in valleys.`))
    pitch < 2 ? rows.push(box('', `${pitch}:12 is LOW-SLOPE — asphalt shingles are NOT permitted (R905.2.2); use a membrane.`)) : pitch < 4 && rows.push(box('info', `${pitch}:12 (2:12-4:12): low-slope shingle install — double underlayment per R905.2.2.`))
    rows.push(box('info', `Wind: fasten per the shingle maker's high-wind table; design wind speed from ASCE 7 / IRC R301.2.1. Attic ventilation R806: 1/150 of attic area (1/300 if balanced ridge+soffit).`))
  },
  frame(cfg, out, frost, rows) {
    const studs = out?.calc?.studs ?? 0
    rows.push(box('', `Structural — permit + framing inspection required. Build to IRC R602: stud size/spacing, R602.7 headers by span, and the R602.3(1) fastening (nailing) schedule.`))
    rows.push(box('info', `Lateral: structural sheathing or R602.10 braced-wall panels for shear; metal hold-downs/straps in high wind or seismic design categories.`))
    rows.push(box(frost >= 30 ? '' : 'info', `Foundation/footings below frost (~${frost}") per IRC R403; PT sill plate + 1/2" anchor bolts ≤6 ft o.c. and within 12" of ends (R403.1.6).${studs ? ` ~${studs} studs in this takeoff.` : ''}`))
    rows.push(box('', `Removing or altering a load-bearing wall needs an engineer's beam design + permit.`))
  },
  plumb(cfg, out, frost, rows) {
    const drain = out?.calc?.building_drain_in ?? 0, fx = out?.calc?.total_fixtures ?? 0
    rows.push(box('', `Plumbing permit + rough-in (water/air test) and final inspection required. Your jurisdiction adopts the IPC or the UPC — confirm which before sizing.`))
    rows.push(box('info', `Every fixture gets a trap AND a vent; DWV slope 1/4"/ft (1/8" min on 3"+); cleanouts at the base of each stack and ≤100 ft.${drain ? ` ${drain}" building drain here.` : ''}`))
    rows.push(box('info', `Backflow: dishwasher air gap, hose-bib vacuum breakers; add a PRV + thermal-expansion tank if street pressure > 80 psi.`))
    fx >= 1 && rows.push(box('info', `${fx} fixtures: a licensed plumber is usually required for the water-heater gas/vent and any sewer/septic tie-in.`))
  },
  elec(cfg, out, frost, rows) {
    const svc = out?.calc?.service_size_a ?? 0, ckts = out?.calc?.total_circuits ?? 0
    rows.push(box('', `Electrical permit + rough-in and final inspection required. Work to the NEC (NFPA 70) edition your state adopts (most on 2020 or 2023).`))
    rows.push(box('info', `Protection: AFCI on most 120 V living-area circuits (NEC 210.12); GFCI in kitchens/baths/laundry/garage/outdoors/within 6 ft of a sink (210.8); all receptacles tamper-resistant (406.12).`))
    rows.push(box('info', `Service ${svc ? `${svc} A: ` : ''}grounding electrode system + bonding per NEC 250; ${ckts ? `${ckts} circuits; ` : ''}smoke/CO alarms interconnected (R314/R315).`))
    rows.push(box('', `Hire a licensed electrician for the service, panel, and any tie-in — the utility coordinates the meter/disconnect.`))
  },
  plan(cfg, out, frost, rows) {
    const fa = out?.calc?.footprint_area ?? 0
    rows.push(box('', `This is a PLANNING tool. Before building, check ZONING: setbacks from lot lines, max lot coverage / FAR, building-height limit, and any HOA / overlay district.`))
    rows.push(box('info', `A new build or addition${fa ? ` (~${fa.toFixed(0)} ft² footprint)` : ''} needs a building permit + (often) stamped plans, and triggers energy-code (IECC) compliance.`))
    rows.push(box('info', `Each trade pulls its own permit (building / plumbing / electrical / mechanical) — size them with the trade apps and the rollup, then submit together.`))
  },
  garden(cfg, out, frost, rows) {
    const beds = out?.calc?.bed_count ?? 0, area = out?.calc?.total_area ?? 0
    rows.push(box('ok', `Raised garden beds are usually NOT a building-permit item — but ZONING still applies: check setbacks + any HOA / deed restriction before you build${beds ? ` (${beds} beds, ${area.toFixed(0)} ft²)` : ''}.`))
    rows.push(box('info', `Structures change that: a greenhouse, shed, or tall arbor (often over ~6 ft tall or ~120 ft²) can need a permit + setback, and fences have their own height rules.`))
    rows.push(box('info', `Water: drip/soaker is the most efficient and usually unrestricted — check local watering-day rules and any rain-barrel / graywater code before plumbing one in.`))
    rows.push(box('info', `Site for 6-8 h of sun on level ground; keep beds back from septic fields and the dripline of big trees. Call 811 before driving posts or trenching a water line.`))
  },
}
const render = () => {
  const el = document.getElementById('permit-info')
  if (!el) return
  const cfg = getCfg(), out = getOut()
  const rows = []
  const s = ST[loc.st]
  const frost = s ? s[2] : 36
  if (s) {
    const [name, code, fr, url] = s
    const place = loc.city ? `${loc.city}, ${loc.st}` : name
    rows.push(box('info', `<b>${esc(place)}</b> — ${esc(code)}. Typical frost depth ~${fr}" <span style="color:var(--mut)">(varies by site — your inspector has the local number)</span>`))
    rows.push(box('info', `Permit office: ${lk(g(`${NOUN[TRADE] || ''} permit ${loc.city || ''} ${name}`), `permits in ${loc.city || name}`)} · ${lk(g(`${loc.city || name} ${loc.st} building department ${NOUN[TRADE] || ''} requirements`), 'building dept')}`))
    rows.push(box('info', `State code: ${url ? lk(url, 'official state code site') : lk(ICC, 'ICC adoption map for your state')}`))
  } else {
    rows.push(box('info', `📍 Tap detect (or pick a state) and I'll pull the code body, frost depth, and the right ${NOUN[TRADE] || 'permit'} office links for your town.`))
  }
  ;(TRADES[TRADE] || TRADES.deck)(cfg || {}, out, frost, rows)
  if (s && SNOWY.includes(loc.st) && ['deck', 'roof', 'frame', 'pool', 'patio'].includes(TRADE)) rows.push(box('info', `${name}: ground snow load often 40-60 psf — size members/footings for it. ${lk(url || ICC, 'state codes')}`))
  el.innerHTML = rows.join('')
}
const setStatus = t => { const e = document.getElementById('loc-status'); e && (e.textContent = t) }
const detect = () => {
  if (!navigator.geolocation) { setStatus('no geolocation — pick state'); return }
  setStatus('locating…')
  navigator.geolocation.getCurrentPosition(async p => {
    try {
      const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&localityLanguage=en`)
      const j = await r.json()
      const st = (j.principalSubdivisionCode || '').replace('US-', '')
      ST[st] ? (loc = { st, city: j.city || j.locality || '' }, save(), syncUI(), render(), setStatus(`found ${loc.city || ST[st][0]} ✓`)) : setStatus('outside US? pick state manually')
    } catch { setStatus('lookup failed — pick state') }
  }, () => setStatus('denied — pick state'), { timeout: 8000 })
}
const syncUI = () => { const s = document.getElementById('loc-state'); const c = document.getElementById('loc-city'); s && (s.value = loc.st); c && (c.value = loc.city) }
export const updatePermits = render
export const initPermits = (cfgFn, outFn) => {
  getCfg = cfgFn
  getOut = outFn
  const sel = document.getElementById('loc-state')
  if (!sel) return
  sel.innerHTML = '<option value="">— state —</option>' + Object.entries(ST).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')
  sel.onchange = () => { loc.st = sel.value; save(); render() }
  const city = document.getElementById('loc-city')
  city && (city.oninput = () => { loc.city = city.value.trim(); save(); render() })
  const det = document.getElementById('loc-detect')
  det && (det.onclick = detect)
  syncUI()
  render()
}
