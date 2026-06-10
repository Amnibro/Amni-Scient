const ICC = 'https://www.iccsafe.org/advocacy/code-adoption-map/'
const ST = { AL: ['Alabama', 'IRC-based state minimum code', 6, null], AK: ['Alaska', 'IRC adopted by boroughs/cities', 60, null], AZ: ['Arizona', 'IRC - city/county adoption', 18, null], AR: ['Arkansas', 'Arkansas Residential Code (IRC)', 15, null], CA: ['California', 'CA Residential Code (Title 24, Part 2.5)', 12, 'https://www.dgs.ca.gov/BSC'], CO: ['Colorado', 'IRC - city/county adoption', 36, null], CT: ['Connecticut', 'CT State Building Code (IRC)', 42, 'https://portal.ct.gov/das'], DE: ['Delaware', 'IRC - county/municipal adoption', 24, null], FL: ['Florida', 'Florida Building Code - Residential', 0, 'https://floridabuilding.org'], GA: ['Georgia', 'GA State Minimum Standard Codes (IRC)', 8, 'https://dca.georgia.gov/construction-codes'], HI: ['Hawaii', 'IRC/IBC - county adoption', 0, null], ID: ['Idaho', 'Idaho Residential Code', 30, null], IL: ['Illinois', 'IRC - municipal adoption (no statewide)', 40, null], IN: ['Indiana', 'Indiana Residential Code', 36, null], IA: ['Iowa', 'IRC - city/county adoption', 42, null], KS: ['Kansas', 'IRC - city/county adoption', 30, null], KY: ['Kentucky', 'Kentucky Residential Code', 24, null], LA: ['Louisiana', 'LA State Uniform Construction Code (IRC)', 3, null], ME: ['Maine', 'MUBEC (IRC-based)', 54, null], MD: ['Maryland', 'MD Building Performance Standards (IRC)', 30, null], MA: ['Massachusetts', '780 CMR MA State Building Code (IRC)', 48, 'https://www.mass.gov/orgs/board-of-building-regulations-and-standards'], MI: ['Michigan', 'Michigan Residential Code', 42, 'https://www.michigan.gov/lara'], MN: ['Minnesota', 'Minnesota Residential Code', 60, null], MS: ['Mississippi', 'IRC - city/county adoption', 6, null], MO: ['Missouri', 'IRC - city/county adoption', 30, null], MT: ['Montana', 'Montana Residential Code (IRC)', 54, null], NE: ['Nebraska', 'IRC - city/county adoption', 40, null], NV: ['Nevada', 'IRC - city/county adoption', 18, null], NH: ['New Hampshire', 'NH State Building Code (IRC)', 54, null], NJ: ['New Jersey', 'NJ Uniform Construction Code (IRC)', 36, 'https://www.nj.gov/dca/divisions/codes/'], NM: ['New Mexico', 'NM Residential Building Code', 18, null], NY: ['New York', 'Residential Code of NYS (IRC-based)', 48, 'https://dos.ny.gov/building-standards-and-codes'], NC: ['North Carolina', 'NC Residential Code', 12, 'https://www.ncosfm.gov'], ND: ['North Dakota', 'ND State Building Code (IRC)', 60, null], OH: ['Ohio', 'Residential Code of Ohio', 32, 'https://com.ohio.gov'], OK: ['Oklahoma', 'OK Uniform Building Code (IRC)', 15, null], OR: ['Oregon', 'Oregon Residential Specialty Code', 18, 'https://www.oregon.gov/bcd'], PA: ['Pennsylvania', 'PA Uniform Construction Code (IRC)', 36, 'https://www.pa.gov/agencies/dli.html'], RI: ['Rhode Island', 'RI State Building Code (IRC)', 40, null], SC: ['South Carolina', 'SC Residential Code', 8, null], SD: ['South Dakota', 'IRC - city/county adoption', 48, null], TN: ['Tennessee', 'TN Residential Code (IRC)', 12, null], TX: ['Texas', 'IRC - municipal adoption', 6, null], UT: ['Utah', 'Utah Residential Code', 32, null], VT: ['Vermont', 'RBES + town-adopted IRC', 54, null], VA: ['Virginia', 'Virginia USBC (IRC)', 24, 'https://www.dhcd.virginia.gov/codes'], WA: ['Washington', 'WA State Building Code (IRC)', 18, 'https://sbcc.wa.gov'], WV: ['West Virginia', 'WV State Building Code (IRC)', 32, null], WI: ['Wisconsin', 'WI Uniform Dwelling Code', 54, 'https://dsps.wi.gov'], WY: ['Wyoming', 'IRC - city/county adoption', 42, null], DC: ['District of Columbia', 'DC Residential Code (IRC)', 24, null] }
const g = q => 'https://www.google.com/search?q=' + encodeURIComponent(q)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
let loc = (() => { try { return JSON.parse(localStorage.getItem('amni_deck_loc')) || { st: '', city: '' } } catch { return { st: '', city: '' } } })()
let getCfg = () => null
let getOut = () => null
const save = () => localStorage.setItem('amni_deck_loc', JSON.stringify(loc))
const box = (cls, html) => `<div class="warn ${cls}">${html}</div>`
const lk = (url, txt) => `<a href="${url}" target="_blank" rel="noopener" style="color:var(--acc2);text-decoration:none">↗ ${esc(txt)}</a>`
const render = () => {
  const el = document.getElementById('permit-info')
  const cfg = getCfg()
  const out = getOut()
  if (!el || !cfg) return
  const h = cfg.height
  const area = cfg.length * cfg.depth
  const risers = out?.calc?.risers ?? 0
  const riser = out?.calc?.riser ?? ''
  const led = cfg.attach === 'ledger'
  const rows = []
  const s = ST[loc.st]
  if (s) {
    const [name, code, frost, url] = s
    const place = loc.city ? `${loc.city}, ${loc.st}` : name
    rows.push(box('info', `<b>${esc(place)}</b> — ${esc(code)}. Typical frost depth ~${frost}" <span style="color:var(--mut)">(varies by site — your inspector has the local number)</span>`))
    rows.push(box('info', `Local permit office: ${lk(g(`building permit deck ${loc.city || ''} ${name}`), `permits in ${loc.city || name}`)} · ${lk(g(`${loc.city || name} ${loc.st} building department deck requirements`), 'building dept')}`))
    rows.push(box('info', `State code: ${url ? lk(url, 'official state code site') : lk(ICC, 'ICC adoption map for your state')}`))
    led ? rows.push(box('', `Ledger-attached: a permit is required nearly everywhere${frost >= 30 ? `, and footings typically must bear below frost (~${frost}")` : ''}. Pier blocks on grade are usually only OK freestanding.`)) : (area <= 200 && h < 30 ? rows.push(box('ok', `Freestanding, ${area} sq ft ≤ 200 and under 30" high: often permit-EXEMPT (IRC R105.2) if it doesn't serve the exit door — confirm with ${loc.city || 'your town'}.`)) : rows.push(box('', `Freestanding but ${area > 200 ? 'over 200 sq ft' : '30"+ high'} — expect a permit.`)))
    loc.st === 'NY' && rows.push(box('info', `NY: Capital District ground snow load runs 40-60 psf — size beams/footings accordingly. ${lk('https://dos.ny.gov/building-standards-and-codes', 'NYS DOS codes')}`))
  } else rows.push(box('info', `📍 Tap detect (or pick a state) and I'll pull the code body, frost depth, snow notes and permit-office links for your town.`))
  rows.push(box(h >= 30 ? '' : 'ok', h >= 30 ? `Deck ${h}" above grade: guards REQUIRED — 36" min, openings <4" (IRC R312).` : `Deck ${h}" above grade (<30"): guards optional per IRC R312 — many towns still want them.`))
  risers > 0 && rows.push(box('info', `Stairs: ${risers} risers @ ${esc(riser)} (IRC max 7-3/4"). ${risers >= 4 ? 'A graspable handrail 34-38" is required (4+ risers).' : 'Under 4 risers: handrail optional most places.'}`))
  rows.push(box('info', `Ledger rules: 1/2" lags or LedgerLOKs into the rim, flashed (R507.9) — see the 2D ledger detail. Footings: R507.3.`))
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
  sel.innerHTML = '<option value="">— state —</option>' + Object.entries(ST).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')
  sel.onchange = () => { loc.st = sel.value; save(); render() }
  const city = document.getElementById('loc-city')
  city.oninput = () => { loc.city = city.value.trim(); save(); render() }
  document.getElementById('loc-detect').onclick = detect
  syncUI()
  render()
}
