// Defensive store-price refresher for the Amni-Construct catalogs.
// For every catalog item with a Home Depot search query (hdq), it tries to fetch a current price
// and bake it into <module>/catalog.json — but ONLY when the scraped price is sane (within a
// bounded ratio of the existing hand-estimate), so a blocked / bot-checked / garbage response can
// never pollute the catalog. Any miss falls back to the existing price. Retail search is heavily
// bot-protected, so misses are expected and SAFE — the hand estimates remain authoritative until a
// confident price is found (or you swap fetchHdPrice() for a real price API / proxy).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const DELAY_MS = 1400, TIMEOUT_MS = 15000, MIN_RATIO = 0.4, MAX_RATIO = 2.5
const sleep = ms => new Promise(r => setTimeout(r, ms))
const priceFromHtml = html => {
  // Prefer structured price JSON embedded in the SSR'd HTML (JSON-LD / app state). Loose "$xx.xx"
  // text-scraping is too noisy (shipping, promos, unrelated items), so we deliberately skip it.
  const m = [...html.matchAll(/"(?:price|currentPrice|value|nowPrice)"\s*:\s*"?(\d{1,5}(?:\.\d{1,2})?)"?/gi)]
    .map(x => +x[1]).filter(p => p >= 0.5 && p <= 20000)
  if (!m.length) return null
  m.sort((a, b) => a - b)
  return m[Math.floor(m.length / 2)] // median guards against stray min/max numbers in the blob
}
const fetchHdPrice = async query => {
  try {
    const r = await fetch('https://www.homedepot.com/s/' + encodeURIComponent(query), {
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'en-US,en' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    })
    if (!r.ok) return null
    return priceFromHtml(await r.text())
  } catch (e) { return null }
}
const run = async () => {
  const dirs = readdirSync('.', { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(d.name + '/catalog.json')).map(d => d.name)
  const today = new Date().toISOString().slice(0, 10)
  let scanned = 0, updated = 0, kept = 0, missed = 0
  for (const dir of dirs) {
    let cat; try { cat = JSON.parse(readFileSync(dir + '/catalog.json', 'utf8')) } catch (e) { continue }
    let changed = false
    for (const [, it] of Object.entries(cat)) {
      if (!it || typeof it !== 'object' || !it.hdq || typeof it.hd !== 'number') continue
      scanned++
      const p = await fetchHdPrice(it.hdq)
      await sleep(DELAY_MS)
      if (p == null) { missed++; continue }
      if (p >= it.hd * MIN_RATIO && p <= it.hd * MAX_RATIO && Math.abs(p - it.hd) >= 0.01) {
        if (it.hd_est == null) it.hd_est = it.hd // keep the original hand estimate around
        it.hd = +p.toFixed(2); it.hd_src = 'homedepot'; it.hd_checked = today
        changed = true; updated++
      } else kept++
    }
    if (changed) writeFileSync(dir + '/catalog.json', JSON.stringify(cat, null, 2) + '\n')
  }
  console.log(`Amni price refresh ${today}: scanned ${scanned}, updated ${updated}, kept-in-range ${kept}, no-price/blocked ${missed}`)
}
run().catch(e => { console.error('refresh failed (non-fatal):', e && e.message); process.exit(0) })
