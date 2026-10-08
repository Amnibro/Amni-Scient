(() => {
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v)
const r2 = n => { const v = Number(n); return Number.isFinite(v) ? Math.sign(v) * Math.round(+(Math.abs(v).toFixed(10) + 'e2')) / 100 : 0 }
const num = (v, lo = 0, hi = 1e9) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const money = n => (r2(n) < 0 ? '−$' : '$') + Math.abs(r2(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quoteMath = (materials, r, labor, extras) => {
  const R = isObj(r) ? r : {}, mr = r2(num(materials)), markup = num(R.markup, 0, 1000), ms = r2(mr * (1 + markup / 100))
  const lines = (Array.isArray(labor) ? labor : []).filter(isObj).map(l => { const crew = l.crew == null || l.crew === '' ? 1 : num(l.crew, 0, 100), hrs = num(l.hrs, 0, 1e5), rate = num(l.rate, 0, 1e5); return { desc: String(l.desc || ''), crew, hrs, rate, amt: r2(crew * hrs * rate) } })
  const xs = (Array.isArray(extras) ? extras : []).filter(isObj).map(x => ({ desc: String(x.desc || ''), amt: r2(num(x.amt)) }))
  const lb = r2(lines.reduce((a, l) => a + l.amt, 0)), ex = r2(xs.reduce((a, x) => a + x.amt, 0)), oh = r2(num(R.overhead)), pre = r2(ms + lb + ex + oh)
  const discPct = R.discType === 'pct' ? num(R.discount, 0, 100) : 0, di = R.discType === 'pct' ? r2(pre * discPct / 100) : r2(Math.min(num(R.discount), pre)), sub = r2(pre - di)
  const taxPct = num(R.tax, 0, 100), tax = r2(sub * taxPct / 100), grand = r2(sub + tax), depPct = num(R.deposit, 0, 100), dep = r2(grand * depPct / 100)
  return { mr, markup, ms, lines, xs, lb, ex, oh, pre, discPct, di, sub, taxPct, tax, grand, depPct, dep, bal: r2(grand - dep) }
}
const nextQn = (hist, seq, year) => { const top = (Array.isArray(hist) ? hist : []).reduce((a, h) => { const m = /^Q-\d{4}-(\d+)$/.exec(isObj(h) ? String(h.qn || '') : ''); return m ? Math.max(a, +m[1]) : a }, 0), n = Math.max(Math.floor(num(seq)), top) + 1; return { n, qn: 'Q-' + year + '-' + String(n).padStart(4, '0') } }
const parseJ = (s, d) => { try { const v = JSON.parse(s); return v == null ? d : v } catch { return d } }
const DEVICE_LS = 'amni.pro.device.v1', LIC_FIELDS = ['key', 'ent', 'sig', 'legacyNotice', 'trialStart', 'seen', 'bannerDismissed']
const LIST_KEYS = { 'amni.pro.quotes.v1': q => String(q.qn || ''), 'amni.pro.clients.v1': c => String(c.name || '').trim().toLowerCase(), 'amni.pro.projects.v1': p => String(p.id || '') }
const backupEntries = j => { const d = isObj(j) ? (isObj(j.data) ? j.data : j) : null; return d ? Object.entries(d).filter(([k, v]) => /^amni[\w.-]{0,120}$/.test(k) && k !== DEVICE_LS && v != null).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]) : [] }
const mergeBackup = (get, entries) => {
  const out = {}, n = { quotes: 0, clients: 0, projects: 0, other: 0 }
  for (const [k, v] of entries) {
    const id = LIST_KEYS[k], inc = parseJ(v, null), cur = parseJ(get(k), null)
    if (id) { if (!Array.isArray(inc)) continue; const base = Array.isArray(cur) ? cur.filter(isObj) : [], have = new Set(base.map(id)), add = inc.filter(x => isObj(x) && id(x) && !have.has(id(x)) && have.add(id(x))); n[k.split('.')[2]] += add.length; out[k] = JSON.stringify(k === 'amni.pro.clients.v1' ? [...base, ...add] : [...base, ...add].sort((a, b) => (+b.ts || 0) - (+a.ts || 0))); continue }
    if (k === 'amni.pro.v1') { if (!isObj(inc)) continue; const c = isObj(cur) ? cur : {}, keep = Object.fromEntries(LIC_FIELDS.filter(f => c[f] !== undefined).map(f => [f, c[f]])), t = [c.trialStart, inc.trialStart].filter(Number.isFinite), m = { ...c, ...Object.fromEntries(Object.entries(inc).filter(([f]) => !LIC_FIELDS.includes(f))), ...keep, seq: Math.max(Math.floor(num(c.seq)), Math.floor(num(inc.seq))) }; t.length && (m.trialStart = Math.min(...t)); out[k] = JSON.stringify(m); continue }
    out[k] = v; n.other++
  }
  return { out, n }
}
const api = Object.freeze({ esc, r2, num, money, quoteMath, nextQn, backupEntries, mergeBackup, DEVICE_LS })
typeof module === 'object' && module.exports ? module.exports = api : (globalThis.AmniProQuote = api)
if (typeof document === 'undefined') return
const $ = s => document.querySelector(s)
const mod = (location.pathname.match(/\/([a-z]+)\/(?:index\.html)?$/) || [])[1] || ''
const MODNAME = { deck: 'Deck', patio: 'Patio & Slab', pool: 'Pool', floor: 'Flooring', roof: 'Roofing', frame: 'Framing', plumb: 'Plumbing', elec: 'Electrical', hvac: 'HVAC', plan: 'Whole-House', garden: 'Garden' }[mod] || 'Project'
const matHost = $('#mat-table') || $('#mat-body')
const tabs = $('.tabs')
if (!tabs || !mod) return
const shareApi = window.AmniShareImport
const collectDesign = () => {
  if (!shareApi) throw new Error('Safe sharing is unavailable.')
  return shareApi.collectShareData(mod, localStorage)
}
const encodeDesign = data => {
  if (!shareApi) throw new Error('Safe sharing is unavailable.')
  return shareApi.encodePayload(data)
}
const playBilling = window.AmniPlayBilling
const nativeBilling = !!(playBilling && playBilling.isNative)
let nativeBillingState = nativeBilling ? playBilling.getState() : null
const lsObj = k => { const v = parseJ(localStorage.getItem(k), null); return isObj(v) ? v : {} }
const PS = lsObj('amni.pro.v1')
PS.co = isObj(PS.co) ? PS.co : { name: '', phone: '', email: '', lic: '', addr: '', web: '', logo: '', terms: '' }
PS.def = isObj(PS.def) ? PS.def : { markup: 20, tax: 0, overhead: 0, rate: 75 }
Number.isFinite(PS.trialStart) || delete PS.trialStart
const QK = 'amni.pro.q.' + mod + '.v1'
const blankQ = () => ({ client: { name: '', addr: '', contact: '' }, scope: '', labor: [{ desc: 'Labor — installation', crew: 1, hrs: 0, rate: num(PS.def.rate) || 75 }], extras: [], permit: { jur: '', parcel: '', val: 0 }, r: { markup: num(PS.def.markup), tax: num(PS.def.tax), overhead: num(PS.def.overhead), deposit: PS.def.deposit ?? 50, discount: 0, discType: 'amt', matOverride: 0 } })
const fixQ = q => { const b = blankQ(), o = isObj(q) ? q : {}; return { ...o, client: isObj(o.client) ? { ...b.client, ...o.client } : b.client, scope: typeof o.scope === 'string' ? o.scope : '', labor: Array.isArray(o.labor) && o.labor.filter(isObj).length ? o.labor.filter(isObj) : b.labor, extras: Array.isArray(o.extras) ? o.extras.filter(isObj) : [], permit: isObj(o.permit) ? { ...b.permit, ...o.permit } : b.permit, r: isObj(o.r) ? { ...b.r, ...o.r } : b.r } }
const Q = fixQ(lsObj(QK))
PS.rateBook = Array.isArray(PS.rateBook) && PS.rateBook.filter(isObj).length ? PS.rateBook.filter(isObj) : [{ d: 'Demolition & tear-out', r: 65 }, { d: 'Installation labor', r: 75 }, { d: 'Carpentry — framing', r: 70 }, { d: 'Finish carpentry', r: 85 }, { d: 'Electrical (licensed)', r: 110 }, { d: 'Plumbing (licensed)', r: 105 }, { d: 'Concrete & flatwork', r: 70 }, { d: 'Roofing labor', r: 80 }, { d: 'Painting & finishing', r: 55 }, { d: 'Site cleanup & haul-off', r: 50 }]
let warnedFull = false
const store = (k, v) => { try { localStorage.setItem(k, v); return true } catch { warnedFull || (warnedFull = true, alert("This browser's storage is full, so the last change was not saved. Export a backup from the dashboard, then delete old saved projects or the 3D snapshot.")); return false } }
const saveP = () => store('amni.pro.v1', JSON.stringify(PS))
const saveQ = () => store(QK, JSON.stringify(Q))
const Lic = window.AmniProLicense
let signatureOk = false
let recheckFailed = false
const isPro = () => nativeBilling
  ? nativeBillingState && nativeBillingState.entitled === true
  : !!(Lic && Lic.access(PS, Date.now(), signatureOk, recheckFailed).ok)
const accessNow = () => Lic ? Lic.access(PS, Date.now(), signatureOk, recheckFailed) : { ok: false, kind: 'locked', days: 0 }
const cfgNum = (name, fallback) => { const n = window[name]; return Number.isFinite(n) && n > 0 ? n : fallback }
const httpsUrl = value => /^https:\/\//i.test(value || '') ? value : ''
const buyUrl = () => httpsUrl(window.AMNI_BUY_URL)
const parsePubkey = () => { const raw = window.AMNI_LICENSE_PUBKEY; if (!raw) return null; try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch (error) { return null } }
const licenseDeps = () => ({ fetch, storage: localStorage, licenseUrl: window.AMNI_LICENSE_URL || '', pubkey: parsePubkey(), signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined })
const clearEntitlement = () => { delete PS.key; delete PS.ent; delete PS.sig; signatureOk = false; saveP() }
const matRow = () => { const rows = matHost ? [...matHost.querySelectorAll('tr')].filter(tr => tr.querySelector('.tot')) : []; return rows[rows.length - 1] || null }
const matRaw = () => { const row = matRow(), vals = row ? (row.textContent.match(/\$\s*[\d,]+(?:\.\d+)?/g) || []).map(x => +x.replace(/[$,\s]/g, '')).filter(v => v > 0) : []; return vals.length ? Math.min(...vals) : 0 }
const matLabel = () => { const row = matRow(), t = row && row.firstElementChild ? row.firstElementChild.textContent.replace(/[^\w\s≈+&-]/g, '').trim() : ''; return t && !/^totals?$/i.test(t) ? t : 'estimator total' }
const calc = () => quoteMath(num(Q.r.matOverride) > 0 ? Q.r.matOverride : matRaw(), Q.r, Q.labor, Q.extras)
const btn = document.createElement('button')
btn.type = 'button'
btn.className = 'pro-tab'
btn.id = 'pro-open'
btn.textContent = '💼 Pro'
btn.setAttribute('aria-expanded', 'false')
btn.setAttribute('aria-controls', 'pro-drawer')
tabs.parentNode.insertBefore(btn, tabs.nextSibling)
const drawer = document.createElement('div')
drawer.id = 'pro-drawer'
drawer.setAttribute('role', 'dialog')
drawer.setAttribute('aria-label', 'Amni-Construct Pro')
drawer.setAttribute('aria-modal', 'false')
drawer.setAttribute('aria-hidden', 'true')
drawer.innerHTML = `<div id="pro-head"><b>💼 Construct Pro</b><span id="pro-status"></span><a href="../construct/dashboard.html" class="pro-ico" title="Quotes, clients and backup" aria-label="Open the Pro dashboard">📊</a><button type="button" class="pro-x pro-ico" title="Close">✕</button></div><div id="pro-body">
<div id="pro-cta" hidden></div>
<h3>Your company</h3><p class="pro-note pro-lead">Fill this in once. It goes on every quote and permit packet.</p><div class="pro-grid">
<div class="full pro-logo-row"><img id="pro-logo-img" alt="Company logo" style="display:none"><button type="button" class="pro-btn pro-logo-btn" id="pro-logo-btn">Upload logo</button><input type="file" id="pro-logo-file" accept="image/*" hidden><span class="pro-note">PNG or JPG, shown on quotes</span></div>
<div class="full"><label for="pro-co-name">Company name</label><input type="text" id="pro-co-name" autocomplete="organization"></div>
<div><label for="pro-co-phone">Phone</label><input type="tel" id="pro-co-phone" autocomplete="tel"></div>
<div><label for="pro-co-email">Email</label><input type="email" id="pro-co-email" autocomplete="email"></div>
<div><label for="pro-co-lic">License #</label><input type="text" id="pro-co-lic"></div>
<div><label for="pro-co-web">Website</label><input type="text" id="pro-co-web" inputmode="url"></div>
<div class="full"><label for="pro-co-addr">Address</label><input type="text" id="pro-co-addr" autocomplete="street-address"></div>
<div class="full"><label for="pro-co-terms">Quote terms (blank = standard terms)</label><textarea id="pro-co-terms" placeholder="Standard terms use your deposit % and a 30-day validity."></textarea></div></div>
<h3>Client & project</h3><div class="pro-grid">
<div class="full"><label for="pro-cl-name">Client name</label><input type="text" id="pro-cl-name" list="pro-cl-list" autocomplete="off"><datalist id="pro-cl-list"></datalist></div>
<div class="full"><label for="pro-cl-addr">Job site address</label><input type="text" id="pro-cl-addr"></div>
<div class="full"><label for="pro-cl-contact">Client phone / email</label><input type="text" id="pro-cl-contact"></div>
<div class="full pro-row"><button type="button" class="pro-btn ghost" id="pro-cl-save">＋ Save client for reuse</button><button type="button" class="pro-btn ghost" id="pro-new">Start a new quote</button></div>
<div class="full"><label for="pro-scope">Scope of work</label><textarea id="pro-scope" placeholder="Supply and install..."></textarea></div></div>
<h3>Saved projects</h3><div id="pro-projects"></div><button type="button" class="pro-btn ghost" id="pro-proj-save">💾 Save design + quote as a project</button>
<h3>Labor</h3><p class="pro-note pro-lead">Crew × hours × rate. The homeowner sees the line total, not your rate.</p><div id="pro-labor"></div><div class="pro-row"><button type="button" class="pro-btn ghost" id="pro-labor-add">+ Add labor line</button><select id="pro-ratebook" aria-label="Add a labor line from your rate book"><option value="">+ from rate book…</option></select><button type="button" class="pro-btn ghost" id="pro-rb-edit" title="Edit rate book" aria-label="Edit rate book">✎</button></div><div id="pro-rb-panel" hidden></div>
<h3>Other line items</h3><div id="pro-extras"></div><button type="button" class="pro-btn ghost" id="pro-extras-add">+ Add item (dumpster, equipment, permit fee…)</button>
<h3>Pricing</h3><div class="pro-grid">
<div><label for="pro-r-markup">Materials markup %</label><input type="number" id="pro-r-markup" step="1" min="0" inputmode="decimal"></div>
<div><label for="pro-r-tax">Tax %</label><input type="number" id="pro-r-tax" step="0.01" min="0" max="100" inputmode="decimal"></div>
<div><label for="pro-r-overhead">Overhead / PM $</label><input type="number" id="pro-r-overhead" step="1" min="0" inputmode="decimal"></div>
<div><label for="pro-r-rate">Default labor $/hr</label><input type="number" id="pro-r-rate" step="1" min="0" inputmode="decimal"></div>
<div><label for="pro-r-discount">Discount</label><div class="pro-inline"><input type="number" id="pro-r-discount" step="1" min="0" inputmode="decimal"><select id="pro-r-disctype" aria-label="Discount type"><option value="amt">$</option><option value="pct">%</option></select></div></div>
<div><label for="pro-r-deposit">Deposit %</label><input type="number" id="pro-r-deposit" step="1" min="0" max="100" inputmode="decimal"></div>
<div class="full"><label for="pro-r-matOverride">Materials cost $ (blank = use the estimator's total)</label><input type="number" id="pro-r-matOverride" step="0.01" min="0" inputmode="decimal" placeholder="Your supplier quote, if you have one"></div></div>
<div id="pro-totals"></div>
<button type="button" class="pro-btn big" id="pro-gen">🧾 Generate branded quote</button>
<p class="pro-note">Opens a print-ready quote in a new tab. Print it or Save as PDF. Quote numbers count up on their own.</p>
<h3>Permit packet</h3><div class="pro-grid">
<div><label for="pro-pm-jur">Jurisdiction / city</label><input type="text" id="pro-pm-jur"></div>
<div><label for="pro-pm-parcel">Parcel / lot #</label><input type="text" id="pro-pm-parcel"></div>
<div class="full"><label for="pro-pm-val">Project valuation $ (blank = quote total)</label><input type="number" id="pro-pm-val" step="1" min="0" inputmode="decimal"></div></div>
<button type="button" class="pro-btn big" id="pro-permit">📋 Generate permit packet (cover + plan sheets)</button>
<h3>Showcase</h3>
<div class="pro-row"><button type="button" class="pro-btn" id="pro-snap">📸 Snapshot 3D for the quote</button><button type="button" class="pro-btn" id="pro-show">🏗️ Copy showcase link</button></div>
<div id="pro-snap-prev"></div>
<p class="pro-note">The snapshot goes on your quote. The showcase link opens the design in 3D with your company name on it. It does not include your unit prices, labor or markup.</p>
<h3>💡 Suggest a feature</h3>
<div class="pro-grid"><div class="full"><textarea id="pro-sug" aria-label="Your suggestion" placeholder="What would make this better for your business? Missing trades, report formats, rough edges."></textarea></div>
<div class="full"><input type="email" id="pro-sug-mail" aria-label="Your email" placeholder="Your email (optional, only if you want a reply)"></div>
<div class="full pro-row"><button type="button" class="pro-btn" id="pro-sug-send">Send suggestion</button><span class="pro-note" id="pro-sug-note" role="status"></span></div></div>
<div id="pro-lic-row"></div></div>`
document.body.appendChild(drawer)
const gate = document.createElement('div')
gate.id = 'pro-gate'
gate.innerHTML = nativeBilling
  ? `<div class="gate-card"><h2>💼 Amni-Construct Pro</h2><p>Choose monthly or annual Pro through Google Play. Prices shown below come directly from Play for your account and region. Entitlement is restored from your active Play subscription and is never imported from a project or share link.</p><div id="pro-play-plans" role="group" aria-label="Google Play subscription plans"></div><button class="pro-btn ghost big" id="pro-play-restore" style="margin-top:8px">Restore purchase</button><p class="gate-err" id="pro-play-msg" role="status" aria-live="polite"></p></div>`
  : `<div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="pro-gate-h"><button type="button" class="pro-x pro-ico gate-x" aria-label="Close">✕</button><h2 id="pro-gate-h">💼 Construct Pro</h2><div id="pro-gate-offer"><p class="gate-lead">Turn this estimate into the quote you hand the homeowner.</p><ul class="gate-list"><li>Branded quote with your logo, licence #, labor, markup, tax and deposit</li><li>Permit packet: cover sheet plus the plan sheets this estimator draws</li><li>3D showcase link and a client book across all 11 trades</li></ul><button type="button" class="pro-btn big" id="pro-trial">Start the 14-day free trial</button><p class="pro-note gate-center" id="pro-gate-price">No card, no account. $19/month after, if you keep it.</p><a class="pro-btn big" id="pro-buy" hidden>Buy Pro: $19/mo</a><div class="gate-soon" data-soon hidden><b>Checkout opens soon.</b> The trial runs now with no card. <a data-notify>Email me when it opens</a></div><button type="button" class="pro-btn ghost big" id="pro-have-key">I have a key</button></div><div id="pro-gate-ended" hidden><p class="gate-lead">Your trial has ended.</p><p>Nothing was deleted. Your company profile, clients, rates and quotes are still on this device, and they unlock the moment you enter a key. The estimators stay free.</p><a class="pro-btn big" id="pro-buy-ended" hidden>Buy Pro: $19/mo</a><div class="gate-soon" data-soon hidden><b>Checkout opens soon.</b> <a data-notify>Email me</a> and I'll send a link the day it opens.</div><button type="button" class="pro-btn ghost big" id="pro-have-key-ended">Enter key</button><a class="pro-btn ghost big" href="../construct/dashboard.html">Export a backup</a></div><div id="pro-gate-key" hidden><label for="pro-key" class="gate-label">Licence key</label><input type="text" id="pro-key" placeholder="AMNI-PRO-XXXXX-XXXXX" spellcheck="false" autocomplete="off" autocapitalize="characters"><p class="gate-err" id="pro-key-err" role="status" aria-live="polite"></p><button type="button" class="pro-btn big" id="pro-activate">Activate</button></div><p class="gate-alt"><a href="../construct/pro.html" target="_blank" rel="noopener">What Pro includes, pricing and refunds ↗</a></p></div>`
document.body.appendChild(gate)
const S = id => drawer.querySelector('#' + id)
const status = () => {
  const el = S('pro-status')
  if (nativeBilling) {
    nativeBillingState = playBilling.getState()
    if (isPro()) {
      el.className = 'ok'
      el.textContent = 'PRO ACTIVE'
      S('pro-lic-row').innerHTML = '<p class="pro-note" style="margin-top:16px">Entitlement verified from an active Google Play subscription.</p>'
    } else {
      el.className = nativeBillingState.status === 'pending' ? 'trial' : 'off'
      el.textContent = nativeBillingState.status === 'pending' ? 'PURCHASE PENDING' : 'LOCKED'
      S('pro-lic-row').innerHTML = '<p class="pro-note" style="margin-top:16px"><a href="#" id="pro-unlock" style="color:#e8b565">Manage Pro through Google Play</a></p>'
      const unlock = S('pro-unlock')
      unlock && (unlock.onclick = e => { e.preventDefault(); gate.classList.add('on'); syncPlayBillingUI() })
    }
    el.id = 'pro-status'
    paintCta()
    return
  }
  const state = accessNow(), fresh = state.kind === 'locked' && !Number.isFinite(PS.trialStart)
  el.className = state.kind === 'pro' || state.kind === 'offline' ? 'ok' : state.kind === 'trial' ? 'trial' : fresh ? 'free' : 'off'
  el.textContent = state.kind === 'pro' ? 'PRO' : state.kind === 'offline' ? 'PRO · OFFLINE' : state.kind === 'trial' ? `TRIAL · ${state.days} DAY${state.days === 1 ? '' : 'S'} LEFT` : fresh ? 'FREE' : 'TRIAL ENDED'
  el.title = state.kind === 'offline' ? "Pro works offline. It rechecks your licence when you're back online." : ''
  el.id = 'pro-status'
  paintCta()
  S('pro-lic-row').innerHTML = PS.key && signatureOk ? `<p class="pro-note pro-lic">Licence ${esc(PS.key.slice(0, 14))}••• on this device · <a href="#" id="pro-deact" class="pro-danger">Deactivate this device</a></p>` : `<p class="pro-note pro-lic"><a href="#" id="pro-unlock">${isPro() ? 'Enter a licence key' : 'Unlock Pro'}</a> · <a href="../construct/pro.html" target="_blank" rel="noopener">Pricing ↗</a></p>`
  const d = S('pro-deact')
  d && (d.onclick = e => { e.preventDefault(); const slots = cfgNum('AMNI_PRO_MAX_DEVICES', 3); if (!confirm('Remove Pro from this device? Your data stays. This frees one of your ' + slots + ' device slots.')) return; const key = PS.key; const done = () => { clearEntitlement(); recheckFailed = false; status() }; Lic ? Lic.deactivateKey(key, licenseDeps()).finally(done) : done() })
  const u = S('pro-unlock')
  u && (u.onclick = e => { e.preventDefault(); paintGate(); gate.classList.add('on') })
}
const syncPlayBillingUI = () => {
  if (!nativeBilling) return
  nativeBillingState = playBilling.getState()
  const plans = gate.querySelector('#pro-play-plans')
  const restore = gate.querySelector('#pro-play-restore')
  const msg = gate.querySelector('#pro-play-msg')
  const busy = ['connecting', 'loading', 'purchasing', 'verifying'].includes(nativeBillingState.status)
  plans.replaceChildren()
  if (nativeBillingState.entitled) {
    const active = document.createElement('button')
    active.type = 'button'
    active.className = 'pro-btn big'
    active.disabled = true
    active.textContent = 'Pro active through Google Play'
    plans.appendChild(active)
  } else if (nativeBillingState.plans.length) {
    nativeBillingState.plans.forEach(plan => {
      const buy = document.createElement('button')
      buy.type = 'button'
      buy.className = 'pro-btn big'
      buy.style.marginTop = '8px'
      buy.disabled = !nativeBillingState.canPurchase || busy
      const period = plan.key === 'monthly' ? ' / month' : ' / year'
      buy.textContent = `${plan.label}${plan.formattedPrice ? ' — ' + plan.formattedPrice + period : ''}`
      if (plan.key === 'annual' && nativeBillingState.annualSavingsPercent > 0) {
        buy.textContent += ` · Save ${nativeBillingState.annualSavingsPercent}%`
      }
      buy.onclick = () => playBilling.purchase(plan.key)
      plans.appendChild(buy)
    })
  } else {
    const unavailable = document.createElement('button')
    unavailable.type = 'button'
    unavailable.className = 'pro-btn big'
    unavailable.disabled = true
    unavailable.textContent = nativeBillingState.status === 'unconfigured'
      ? 'Google Play subscription not configured'
      : busy ? 'Checking Google Play…' : 'Purchase unavailable'
    plans.appendChild(unavailable)
  }
  restore.disabled = busy
  msg.textContent = nativeBillingState.message || ''
  if (nativeBillingState.entitled) gate.classList.remove('on')
  status()
}
if (nativeBilling) {
  gate.querySelector('#pro-play-restore').onclick = () => {
    const msg = gate.querySelector('#pro-play-msg')
    msg.textContent = 'Checking Google Play purchases…'
    playBilling.restore()
  }
  window.addEventListener('amni-billing-state', syncPlayBillingUI)
}
const fills = []
const flash = (el, txt) => { el.dataset.l = el.dataset.l || el.textContent; el.textContent = txt; clearTimeout(el._t); el._t = setTimeout(() => el.textContent = el.dataset.l, 1700) }
const openGate = () => { paintGate(); gate.classList.add('on') }
const bindCo = (id, k) => { const el = S(id); el.value = PS.co[k] || ''; el.addEventListener('input', () => { PS.co[k] = el.value; saveP() }) }
bindCo('pro-co-name', 'name'); bindCo('pro-co-phone', 'phone'); bindCo('pro-co-email', 'email'); bindCo('pro-co-lic', 'lic'); bindCo('pro-co-web', 'web'); bindCo('pro-co-addr', 'addr'); bindCo('pro-co-terms', 'terms')
const bindCl = (id, k) => { const el = S(id); fills.push(() => el.value = Q.client[k] || ''); el.addEventListener('input', () => { Q.client[k] = el.value; saveQ() }) }
bindCl('pro-cl-name', 'name'); bindCl('pro-cl-addr', 'addr'); bindCl('pro-cl-contact', 'contact')
const CK = 'amni.pro.clients.v1', PJ = 'amni.pro.projects.v1', QH = 'amni.pro.quotes.v1'
const lsArr = k => { const v = parseJ(localStorage.getItem(k), []); return Array.isArray(v) ? v.filter(isObj) : [] }
const getCl = () => lsArr(CK), getPj = () => lsArr(PJ)
const clList = () => { S('pro-cl-list').innerHTML = getCl().map(c => `<option value="${esc(c.name)}">`).join('') }
S('pro-cl-name').addEventListener('input', () => { const c = getCl().find(x => x.name === S('pro-cl-name').value); c && (Q.client.addr = c.addr || '', Q.client.contact = c.contact || '', S('pro-cl-addr').value = Q.client.addr, S('pro-cl-contact').value = Q.client.contact, saveQ()) })
S('pro-cl-save').onclick = () => { const n = (Q.client.name || '').trim(), b = S('pro-cl-save'); if (!n) return flash(b, 'Add a client name first'); const cl = getCl(), ex = cl.find(x => String(x.name || '').trim().toLowerCase() === n.toLowerCase()); ex ? Object.assign(ex, { name: n, addr: Q.client.addr, contact: Q.client.contact }) : cl.push({ id: Date.now().toString(36), name: n, addr: Q.client.addr, contact: Q.client.contact }); store(CK, JSON.stringify(cl)) && flash(b, '✓ Client saved'); clList() }
const qSnapshot = () => { const { snap, ...rest } = Q; return JSON.parse(JSON.stringify(rest)) }
const resetQ = next => { Object.keys(Q).forEach(k => delete Q[k]); Object.assign(Q, fixQ(next)); saveQ(); fills.forEach(f => f()); laborUI(); extrasUI(); snapPrev(); totals() }
S('pro-new').onclick = () => { const dirty = Q.client.name || Q.scope || Q.extras.length || Q.snap || Q.labor.some(l => +l.hrs > 0); if (dirty && !confirm('Start a new quote? This clears the client, scope, labor hours, line items and snapshot. Your company profile, rates and saved projects stay.')) return; resetQ({ r: { markup: Q.r.markup, tax: Q.r.tax, overhead: Q.r.overhead, rate: Q.r.rate, deposit: Q.r.deposit } }) }
const sameDesign = d => { try { const c = collectDesign(); return Object.keys(d).every(k => c[k] === d[k]) } catch { return false } }
const pjUI = () => { const w = S('pro-projects'), list = getPj().filter(p => p.mod === mod); w.innerHTML = list.length ? list.map(p => `<div class="pro-proj"><span><b>${esc(p.name)}</b><small>${p.client ? esc(p.client) + ' · ' : ''}${new Date(+p.ts || 0).toLocaleDateString()}</small></span><button type="button" class="pro-btn ghost" data-load="${esc(p.id)}">Open</button><button type="button" class="l-del pro-ico" data-del="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">✕</button></div>`).join('') : '<p class="pro-note">No saved projects for this trade yet. Save one per job so each client keeps their own design and quote.</p>'; w.querySelectorAll('[data-load]').forEach(b => b.onclick = () => { const p = getPj().find(x => x.id === b.dataset.load); if (!p || !isObj(p.data)) return; if (!sameDesign(p.data) && !confirm(`Open "${p.name}"? It replaces the design and quote open now. Save those as a project first if you need them.`)) return; try { const h = '#share=' + encodeDesign(p.data), cl = getCl().find(c => c.name === p.client); isObj(p.quote) ? store(QK, JSON.stringify(fixQ(p.quote))) : p.client && p.client !== Q.client.name && store(QK, JSON.stringify(fixQ({ ...Q, client: { name: p.client, addr: cl ? cl.addr || '' : '', contact: cl ? cl.contact || '' : '' } }))); location.hash = h; location.reload() } catch (error) { alert(error.message || 'That saved project is not safe to open.') } }); w.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const p = getPj().find(x => x.id === b.dataset.del); p && confirm(`Delete the saved project "${p.name}"? This can't be undone.`) && store(PJ, JSON.stringify(getPj().filter(x => x.id !== p.id))); pjUI() }) }
S('pro-proj-save').onclick = () => { if (!isPro()) return openGate(); let data; try { data = collectDesign() } catch (error) { return alert(error.message || 'This project cannot be saved safely.') } if (!Object.keys(data).length) return alert('Design something first, then save it as a project.'); const name = (prompt('Project name:', (Q.client.name ? Q.client.name + ' — ' : '') + MODNAME) || '').trim(); if (!name) return; const pj = getPj(), ex = pj.find(p => p.mod === mod && String(p.name).toLowerCase() === name.toLowerCase()); if (ex && !confirm(`Replace the saved project "${ex.name}" with what's open now?`)) return; store(PJ, JSON.stringify([{ id: ex ? ex.id : Date.now().toString(36), name, mod, client: Q.client.name || '', ts: Date.now(), data, quote: qSnapshot() }, ...pj.filter(p => p !== ex)])) && flash(S('pro-proj-save'), '✓ Project saved'); pjUI() }
const sc = S('pro-scope'); fills.push(() => sc.value = Q.scope); sc.addEventListener('input', () => { Q.scope = sc.value; saveQ() })
const DEF_KEYS = ['markup', 'tax', 'overhead', 'rate', 'deposit']
const bindR = (id, k) => { const el = S(id); fills.push(() => el.value = num(Q.r[k]) || (k === 'matOverride' || k === 'discount' ? '' : 0)); el.addEventListener('input', () => { Q.r[k] = num(el.value); DEF_KEYS.includes(k) && (PS.def[k] = Q.r[k], saveP()); saveQ(); totals() }) }
Q.r.rate = Q.r.rate ?? PS.def.rate
bindR('pro-r-markup', 'markup'); bindR('pro-r-tax', 'tax'); bindR('pro-r-overhead', 'overhead'); bindR('pro-r-rate', 'rate'); bindR('pro-r-discount', 'discount'); bindR('pro-r-deposit', 'deposit'); bindR('pro-r-matOverride', 'matOverride')
const dt = S('pro-r-disctype'); fills.push(() => dt.value = Q.r.discType === 'pct' ? 'pct' : 'amt'); dt.onchange = () => { Q.r.discType = dt.value; saveQ(); totals() }
const rb = S('pro-ratebook')
const rbFill = () => { rb.innerHTML = '<option value="">+ from rate book…</option>' + PS.rateBook.map((e, i) => `<option value="${i}">${esc(e.d || 'Task')} · ${money(e.r)}/hr</option>`).join('') }
rbFill()
rb.addEventListener('change', () => { const e = PS.rateBook[+rb.value]; rb.value = ''; if (!e) return; Q.labor.push({ desc: e.d, crew: 1, hrs: 0, rate: num(e.r) }); saveQ(); laborUI(); totals() })
const rbUI = () => { const w = S('pro-rb-panel'); w.innerHTML = '<p class="pro-note pro-lead">Your rate book, shared by every quote.</p>'; PS.rateBook.forEach((e, i) => { const row = document.createElement('div'); row.className = 'pro-labor'; row.innerHTML = '<input type="text" class="l-desc" aria-label="Task"><input type="number" class="l-rate" step="1" min="0" inputmode="decimal" aria-label="Rate per hour"><button type="button" class="l-del pro-ico" aria-label="Remove task">✕</button>'; const [de, ra] = row.querySelectorAll('input'); de.value = e.d; ra.value = e.r; de.addEventListener('input', () => { e.d = de.value; saveP(); rbFill() }); ra.addEventListener('input', () => { e.r = num(ra.value); saveP(); rbFill() }); row.querySelector('.l-del').onclick = () => { PS.rateBook.splice(i, 1); saveP(); rbFill(); rbUI() }; w.appendChild(row) }); const add = document.createElement('button'); add.type = 'button'; add.className = 'pro-btn ghost'; add.textContent = '+ Add task'; add.onclick = () => { PS.rateBook.push({ d: '', r: num(Q.r.rate) || 75 }); saveP(); rbFill(); rbUI() }; w.appendChild(add) }
S('pro-rb-edit').onclick = () => { const w = S('pro-rb-panel'); w.hidden = !w.hidden; w.hidden || rbUI() }
const laborUI = () => { const w = S('pro-labor'); w.innerHTML = ''; Q.labor.forEach((l, i) => { const row = document.createElement('div'); row.className = 'pro-lline'; row.innerHTML = '<input type="text" class="l-desc" placeholder="Task" aria-label="Labor task"><button type="button" class="l-del pro-ico" aria-label="Remove labor line">✕</button><label class="l-n"><span>Crew</span><input type="number" min="0" step="1" inputmode="numeric"></label><label class="l-n"><span>Hours each</span><input type="number" min="0" step="0.5" inputmode="decimal"></label><label class="l-n"><span>$/hr</span><input type="number" min="0" step="1" inputmode="decimal"></label><b class="l-amt"></b>'; const [de, cr, hr, ra] = row.querySelectorAll('input'), amt = row.querySelector('.l-amt'), upd = () => { amt.textContent = money(quoteMath(0, {}, [l], []).lb) }; de.value = l.desc || ''; cr.value = l.crew ?? 1; hr.value = l.hrs || ''; ra.value = l.rate || ''; upd(); de.addEventListener('input', () => { l.desc = de.value; saveQ() }); [[cr, 'crew'], [hr, 'hrs'], [ra, 'rate']].forEach(([el, k]) => el.addEventListener('input', () => { l[k] = num(el.value); saveQ(); upd(); totals() })); row.querySelector('.l-del').onclick = () => { Q.labor.splice(i, 1); saveQ(); laborUI(); totals() }; w.appendChild(row) }) }
laborUI()
S('pro-labor-add').onclick = () => { Q.labor.push({ desc: '', crew: 1, hrs: 0, rate: num(Q.r.rate) || num(PS.def.rate) }); saveQ(); laborUI() }
const extrasUI = () => { const w = S('pro-extras'); w.innerHTML = ''; Q.extras.forEach((x, i) => { const row = document.createElement('div'); row.className = 'pro-labor'; row.innerHTML = '<input type="text" class="l-desc" placeholder="Item" aria-label="Line item"><input type="number" class="l-amt-in" placeholder="$" step="1" min="0" inputmode="decimal" aria-label="Amount"><button type="button" class="l-del pro-ico" aria-label="Remove line item">✕</button>'; const [de, am] = row.querySelectorAll('input'); de.value = x.desc || ''; am.value = x.amt || ''; de.addEventListener('input', () => { x.desc = de.value; saveQ() }); am.addEventListener('input', () => { x.amt = num(am.value); saveQ(); totals() }); row.querySelector('.l-del').onclick = () => { Q.extras.splice(i, 1); saveQ(); extrasUI(); totals() }; w.appendChild(row) }) }
extrasUI()
S('pro-extras-add').onclick = () => { Q.extras.push({ desc: '', amt: 0 }); saveQ(); extrasUI() }
const totals = () => { const c = calc(), ov = num(Q.r.matOverride) > 0, row = (l, v, cls) => `<div class="pro-tot${cls ? ' ' + cls : ''}"><span>${l}</span><b>${v}</b></div>`; S('pro-totals').innerHTML = (c.mr ? '' : '<p class="pro-warn">No priced materials yet. Prices come from the Materials &amp; pricing tab, or type your own materials cost above.</p>') + row(`Materials (${ov ? 'your cost' : esc(matLabel())} ${money(c.mr)} + ${c.markup}%)`, money(c.ms)) + row('Labor', money(c.lb)) + (c.ex ? row('Other items', money(c.ex)) : '') + (c.oh ? row('Overhead / PM', money(c.oh)) : '') + (c.di ? row('Discount' + (c.discPct ? ` (${c.discPct}%)` : ''), '−' + money(c.di)) : '') + row('Subtotal', money(c.sub), 'sub') + row(`Tax ${c.taxPct}%`, money(c.tax)) + row('Quote total', money(c.grand), 'grand') + (c.dep ? row(`Deposit on acceptance (${c.depPct}%)`, money(c.dep)) + row('Balance on completion', money(c.bal)) : '') }
fills.forEach(f => f())
totals()
matHost && new MutationObserver(totals).observe(matHost, { childList: true, subtree: true, characterData: true })
const logoImg = S('pro-logo-img')
const logoShow = () => { PS.co.logo ? (logoImg.src = PS.co.logo, logoImg.style.display = '') : logoImg.style.display = 'none' }
logoShow()
S('pro-logo-btn').onclick = () => S('pro-logo-file').click()
S('pro-logo-file').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const sc2 = Math.min(1, 400 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * sc2); cv.height = Math.round(im.height * sc2); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); PS.co.logo = cv.toDataURL('image/png'); saveP(); logoShow() }; im.onerror = () => alert("That file couldn't be read as an image. Try a PNG or JPG."); im.src = r.result }; r.readAsDataURL(f) })
clList(); pjUI()
const safeImg = u => /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(u || '') ? u : ''
const dateLong = x => x.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const DOC_CSS = `@page{size:letter;margin:.55in .6in}*{box-sizing:border-box}html{background:#e8eaed}body{margin:0;font:13px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1d232b;-webkit-print-color-adjust:exact;print-color-adjust:exact}.bar{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:center;padding:10px 16px;background:#1d232b;color:#c9ced6;font-size:12.5px}.bar button{font:600 13px/1 inherit;font-family:inherit;min-height:44px;padding:0 20px;border:0;border-radius:6px;background:#b9782a;color:#fff;cursor:pointer}.sheet{max-width:8.5in;margin:24px auto;background:#fff;padding:.6in .65in;box-shadow:0 2px 18px rgba(0,0,0,.12)}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid #1d232b}.co img{max-height:64px;max-width:210px;display:block;margin-bottom:10px}.co b{display:block;font-size:18px}.co span{display:block;color:#5b6573;font-size:12px}.meta{text-align:right;flex:none}.meta h1{margin:0 0 8px;font-size:24px;letter-spacing:.18em;font-weight:700;color:#b9782a}.meta table{margin-left:auto;font-size:12px;border-collapse:collapse}.meta td{padding:1px 0 1px 14px;color:#5b6573;text-align:right}.meta td b{color:#1d232b}.cols{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:22px}h2{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7b8594;margin:0 0 6px;font-weight:700}.sec{margin-top:24px}.pre{white-space:pre-wrap}.snap{display:block;max-width:100%;max-height:3.4in;margin:0 auto;border:1px solid #e3e6ea;border-radius:4px}table.items{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.items th{text-align:left;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#7b8594;border-bottom:1.5px solid #1d232b;padding:6px 8px}.items td{padding:8px;border-bottom:1px solid #e6e9ed;vertical-align:top}.items .r{text-align:right;white-space:nowrap;width:1%}.items tr{break-inside:avoid}.tots{margin:12px 0 0 auto;width:min(340px,100%);font-variant-numeric:tabular-nums;break-inside:avoid}.tots div{display:flex;justify-content:space-between;gap:16px;padding:4px 8px}.tots .g{margin-top:6px;padding:10px 8px;border-top:2px solid #1d232b;font-size:17px;font-weight:700}.tots .dep{background:#f6efe4;border-radius:4px;font-weight:600}.ms td{padding:5px 8px;font-size:12px}.fine{font-size:10.5px;color:#7b8594;margin-top:6px}.terms{font-size:11.5px;color:#3d4652;white-space:pre-wrap}.box{margin-top:26px;break-inside:avoid;border:1px solid #d9dde2;border-radius:6px;padding:16px 18px}.box p{margin:0;font-size:12px;color:#3d4652}.sig{display:grid;grid-template-columns:2fr 1fr;gap:0 28px}.sig div{border-top:1px solid #1d232b;padding-top:4px;font-size:10.5px;color:#5b6573;margin-top:34px}.foot{margin-top:28px;padding-top:10px;border-top:1px solid #e6e9ed;font-size:10px;color:#8a929d;display:flex;justify-content:space-between;gap:12px}.info{width:100%;border-collapse:collapse;font-size:12.5px}.info td{padding:8px 10px;border:1px solid #d9dde2;vertical-align:top}.info td:first-child{width:34%;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#5b6573;background:#f5f6f8}.page{break-before:page;padding-top:4px}.tb{display:flex;justify-content:space-between;gap:12px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#5b6573;border-bottom:2px solid #1d232b;padding-bottom:6px;margin-bottom:10px}.page svg{width:100%!important;height:auto!important;max-height:8.6in}@media(max-width:640px){.sheet{margin:0;padding:24px 18px;box-shadow:none}.top{flex-direction:column}.meta{text-align:left}.meta table{margin-left:0}.meta td{padding:1px 14px 1px 0;text-align:left}.cols{grid-template-columns:1fr;gap:14px}.sig{grid-template-columns:1fr}}@media print{html{background:#fff}.bar{display:none}.sheet{margin:0;padding:0;box-shadow:none;max-width:none}}`
const docShell = (title, body, hint) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${DOC_CSS}</style></head><body><div class="bar"><span>${hint}</span><button type="button" onclick="print()">Print / Save as PDF</button></div><div class="sheet">${body}</div></body></html>`
const coBlock = co => `<div class="co">${safeImg(co.logo) ? `<img src="${safeImg(co.logo)}" alt="">` : ''}<b>${esc(co.name)}</b>${co.addr ? `<span>${esc(co.addr)}</span>` : ''}${[co.phone, co.email, co.web].some(Boolean) ? `<span>${[co.phone, co.email, co.web].filter(Boolean).map(esc).join(' · ')}</span>` : ''}${co.lic ? `<span>License # ${esc(co.lic)}</span>` : ''}</div>`
const matSchedule = () => { if (!matHost) return ''; const rows = [...matHost.querySelectorAll('tr')].map(tr => [...tr.children].map(td => td.textContent.trim())).filter(c => c.length >= 2 && c[0] && !/total|subtotal/i.test(c[0]) && /^\d/.test(c[1] || '')).map(c => `<tr><td>${esc(c[0])}</td><td class="r">${esc(c[1])}</td></tr>`); return rows.length ? `<div class="sec"><h2>Materials included</h2><table class="items ms"><thead><tr><th>Item</th><th class="r">Qty</th></tr></thead><tbody>${rows.join('')}</tbody></table><p class="fine">Quantities are taken from the approved design. Substitutions of equal or better grade may be made.</p></div>` : '' }
const quoteDoc = () => {
  if (!(PS.co.name || '').trim() && !confirm('Your company name is blank, so the quote will go out without a business name. Generate it anyway?')) return
  const w = window.open('', '_blank')
  if (!w) return alert('Your browser blocked the new tab. Allow pop-ups for this site, then generate the quote again.')
  const c = calc(), d = new Date(), vd = new Date(d.getTime() + 30 * 864e5), hist = lsArr(QH), { n, qn } = nextQn(hist, PS.seq, d.getFullYear()), co = PS.co, cl = Q.client
  PS.seq = n; saveP()
  const terms = (co.terms || '').trim() || `This quote is valid for 30 days from the date above.${c.depPct ? ` A ${c.depPct}% deposit is due on acceptance and the balance is due on completion.` : ' Payment is due on completion.'} Any change to the scope of work will be documented and priced as a written change order before the work proceeds. Materials are subject to availability; any substitution will be of equal or better grade.`
  const items = [c.ms ? ['Materials and supplies, furnished and installed', c.ms] : null, ...c.lines.filter(l => l.amt > 0).map(l => [l.desc || 'Labor', l.amt]), ...c.xs.filter(x => x.amt > 0).map(x => [x.desc || 'Additional item', x.amt]), c.oh ? ['Project management and overhead', c.oh] : null].filter(Boolean)
  const body = `<div class="top">${coBlock(co)}<div class="meta"><h1>QUOTE</h1><table><tr><td>Quote #</td><td><b>${qn}</b></td></tr><tr><td>Date</td><td><b>${dateLong(d)}</b></td></tr><tr><td>Valid until</td><td><b>${dateLong(vd)}</b></td></tr></table></div></div>
<div class="cols"><div><h2>Prepared for</h2><b>${esc(cl.name || '—')}</b>${cl.addr ? `<div>${esc(cl.addr)}</div>` : ''}${cl.contact ? `<div>${esc(cl.contact)}</div>` : ''}</div><div><h2>Project</h2><b>${esc(MODNAME)} project</b>${cl.addr ? `<div>${esc(cl.addr)}</div>` : ''}</div></div>
${Q.scope ? `<div class="sec"><h2>Scope of work</h2><div class="pre">${esc(Q.scope)}</div></div>` : ''}
${safeImg(Q.snap) ? `<div class="sec"><h2>Proposed design</h2><img class="snap" src="${safeImg(Q.snap)}" alt="3D view of the proposed design"></div>` : ''}
<div class="sec"><h2>Price</h2><table class="items"><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${items.map(([t, v]) => `<tr><td>${esc(t)}</td><td class="r">${money(v)}</td></tr>`).join('')}${c.di ? `<tr><td>Discount${c.discPct ? ` (${c.discPct}%)` : ''}</td><td class="r">−${money(c.di)}</td></tr>` : ''}</tbody></table>
<div class="tots"><div><span>Subtotal</span><span>${money(c.sub)}</span></div>${c.taxPct ? `<div><span>Sales tax (${c.taxPct}%)</span><span>${money(c.tax)}</span></div>` : ''}<div class="g"><span>Total</span><span id="q-total">${money(c.grand)}</span></div>${c.dep ? `<div class="dep"><span>Deposit due on acceptance (${c.depPct}%)</span><span id="q-dep">${money(c.dep)}</span></div><div><span>Balance due on completion</span><span>${money(c.bal)}</span></div>` : ''}</div></div>
${matSchedule()}
<div class="sec"><h2>Terms</h2><div class="terms">${esc(terms)}</div></div>
<div class="box"><h2>Acceptance</h2><p>I accept this quote, including the scope, price and terms above, and authorize ${esc(co.name || 'the contractor')} to proceed.</p><div class="sig"><div>Client signature</div><div>Date</div><div>Printed name</div><div></div><div>${esc(co.name || 'Contractor')}, authorized signature</div><div>Date</div></div></div>
<div class="foot"><span>${esc(co.name || '')}${co.lic ? ' · License # ' + esc(co.lic) : ''}</span><span>${qn}</span></div>`
  hist.unshift({ qn, ts: d.getTime(), mod, client: cl.name || '', total: c.grand, dep: c.dep, status: 'draft' })
  store(QH, JSON.stringify(hist))
  w.document.open(); w.document.write(docShell(`${qn} · ${esc(co.name || 'Quote')}`, body, 'Check it over, then print it or save it as a PDF.')); w.document.close()
}
const bindPm = (id, k) => { const el = S(id); fills.push(() => el.value = Q.permit[k] || ''); el.addEventListener('input', () => { Q.permit[k] = k === 'val' ? num(el.value) : el.value; saveQ() }) }
bindPm('pro-pm-jur', 'jur'); bindPm('pro-pm-parcel', 'parcel'); bindPm('pro-pm-val', 'val'); fills.slice(-3).forEach(f => f())
const permitDoc = w => {
  const c = calc(), d = new Date(), val = num(Q.permit.val) || c.grand, co = PS.co, cl = Q.client
  let svgs = [...document.querySelectorAll('#pane-plans .svgwrap svg')]
  svgs.length || (svgs = [...document.querySelectorAll('.svgwrap svg')])
  const title = (s, i) => (((s.closest('.svgwrap') || {}).id || '').replace(/^svg-/, '').replace(/-/g, ' ').toUpperCase()) || 'PLAN SHEET ' + (i + 1)
  const sheets = svgs.map((s, i) => `<div class="page"><div class="tb"><span>Sheet ${i + 2} · ${esc(title(s, i))}</span><span>${esc(cl.addr || MODNAME + ' project')}</span><span>${esc(co.name || '')}</span></div>${s.outerHTML}</div>`).join('')
  const info = [['Project address', esc(cl.addr)], ['Owner', esc(cl.name) + (cl.contact ? ' · ' + esc(cl.contact) : '')], ['Contractor', `<b>${esc(co.name)}</b>${co.lic ? ' · License # ' + esc(co.lic) : ''}${co.phone ? ' · ' + esc(co.phone) : ''}`], ['Contractor address', esc(co.addr)], ['Jurisdiction', esc(Q.permit.jur)], ['Parcel / lot', esc(Q.permit.parcel)], ['Type of work', esc(MODNAME)], ['Declared valuation', `<b id="pm-val">${money(val)}</b>`]]
  const body = `<div class="top">${coBlock(co)}<div class="meta"><h1>PERMIT</h1><table><tr><td>Packet</td><td><b>Submittal</b></td></tr><tr><td>Prepared</td><td><b>${dateLong(d)}</b></td></tr><tr><td>Sheets</td><td><b>${svgs.length + 1}</b></td></tr></table></div></div>
<div class="sec"><h2>Project information</h2><table class="info">${info.map(([k, v]) => `<tr><td>${k}</td><td>${v || '&nbsp;'}</td></tr>`).join('')}</table></div>
${Q.scope ? `<div class="sec"><h2>Scope of work</h2><div class="pre">${esc(Q.scope)}</div></div>` : ''}
<div class="sec"><h2>Sheet index</h2><table class="info"><tr><td>Sheet 1</td><td>Cover (this sheet)</td></tr>${svgs.map((s, i) => `<tr><td>Sheet ${i + 2}</td><td>${esc(title(s, i))}</td></tr>`).join('')}</table>${svgs.length ? '' : '<p class="fine">This estimator has no plan sheets to attach. Add your own drawings behind this cover.</p>'}</div>
<div class="box"><div class="sig"><div>Owner or agent signature</div><div>Date</div><div>Contractor signature</div><div>Date</div></div></div>
<p class="fine">Plan sheets are generated from the modeled design. They are diagrams, not stamped engineering documents. The permitting jurisdiction's review, local code amendments and field inspections govern. Verify setbacks, frost depth and utility locates (call 811) before work begins.</p>
${sheets}`
  w.document.open(); w.document.write(docShell(`Permit packet · ${esc(cl.addr || MODNAME)}`, body, 'Each plan sheet prints on its own page.')); w.document.close()
}
S('pro-permit').onclick = () => { if (!isPro()) return openGate(); const w = window.open('', '_blank'); if (!w) return alert('Your browser blocked the new tab. Allow pop-ups for this site, then generate the packet again.'); w.document.write('<!DOCTYPE html><title>Preparing permit packet…</title><p style="font:14px system-ui,sans-serif;padding:24px">Preparing the plan sheets…</p>'); const pt = document.querySelector('.tab[data-pane="plans"]'); document.querySelectorAll('#pane-plans svg,.svgwrap svg').length || !pt ? permitDoc(w) : (pt.click(), setTimeout(() => permitDoc(w), 450)) }
const snapPrev = () => { S('pro-snap-prev').innerHTML = safeImg(Q.snap) ? `<div class="pro-snap"><img src="${safeImg(Q.snap)}" alt="3D snapshot for the quote"><button type="button" class="l-del pro-ico" id="pro-snap-del" aria-label="Remove snapshot">✕</button></div>` : ''; const dl = S('pro-snap-del'); dl && (dl.onclick = () => { delete Q.snap; saveQ(); snapPrev() }) }
snapPrev()
S('pro-snap').onclick = () => { const cv = document.querySelector('#view canvas') || document.querySelector('canvas'); if (!cv) return alert('No 3D view found on this module.'); requestAnimationFrame(() => { try { const d = cv.toDataURL('image/jpeg', 0.9); const im = new Image(); im.onload = () => { const t = document.createElement('canvas'); t.width = 8; t.height = 8; const tc = t.getContext('2d'); tc.drawImage(im, 0, 0, 8, 8); const px = tc.getImageData(0, 0, 8, 8).data; let mn = 255, mx = 0; for (let i = 0; i < px.length; i += 4) { const v = (px[i] + px[i + 1] + px[i + 2]) / 3; mn = Math.min(mn, v); mx = Math.max(mx, v) } if (mx - mn < 6) return alert('Snapshot came back empty — drag the 3D view slightly, then snap again.'); const sc2 = Math.min(1, 760 / im.width), o = document.createElement('canvas'); o.width = Math.round(im.width * sc2); o.height = Math.round(im.height * sc2); o.getContext('2d').drawImage(im, 0, 0, o.width, o.height); Q.snap = o.toDataURL('image/jpeg', 0.82); saveQ(); snapPrev() }; im.src = d } catch (e) { alert('Snapshot failed: ' + e.message) } }) }
S('pro-show').onclick = () => {
  if (!isPro()) return (paintGate(), gate.classList.add('on'))
  let d
  try { d = shareApi.homeownerShareData(mod, localStorage) } catch (error) { return alert(error.message || 'This design cannot be shared safely.') }
  if (!Object.keys(d).length) return alert('Design something first — the showcase link carries the whole design.')
  d['amni.showcase.brand'] = JSON.stringify({ n: PS.co.name, p: PS.co.phone, w: PS.co.web, m: mod, ts: Date.now() })
  let u
  try { u = location.origin + location.pathname + '#share=' + encodeDesign(d) } catch (error) { return alert(error.message || 'This design cannot be shared safely.') }
  const ok = () => { S('pro-show').textContent = '✓ Link copied'; setTimeout(() => S('pro-show').textContent = '🏗️ Copy showcase link', 1800) }
  navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(u).then(ok, () => prompt('Copy this showcase link:', u)) : prompt('Copy this showcase link:', u)
}
const brand = (() => { try { return JSON.parse(localStorage.getItem('amni.showcase.brand')) } catch { return null } })()
if (brand && brand.n && brand.m === mod && Date.now() - (brand.ts || 0) < 7 * 864e5) {
  const bn = document.createElement('div')
  bn.id = 'pro-brandbar'
  bn.innerHTML = `<span>🏗️ <b>${esc(brand.n)}</b> prepared this design for you${brand.p ? ' · ' + esc(brand.p) : ''}${brand.w ? ' · ' + esc(brand.w) : ''}</span><button title="Dismiss">✕</button>`
  document.body.appendChild(bn)
  bn.querySelector('button').onclick = () => { localStorage.removeItem('amni.showcase.brand'); bn.remove() }
}
S('pro-sug-send').onclick = () => {
  const txt = S('pro-sug').value.trim(), em = S('pro-sug-mail').value.trim(), note = S('pro-sug-note')
  if (txt.length < 8) return note.textContent = 'Tell us a little more first!'
  note.textContent = 'Sending…'
  const entitlement = nativeBilling ? (isPro() ? 'pro' : 'free') : accessNow().kind === 'trial' ? 'trial' : isPro() ? 'pro' : 'free'
  const ctx = `module: ${mod} · status: ${entitlement} · ua: ${navigator.userAgent.slice(0, 60)}`
  fetch('https://formsubmit.co/ajax/amnibro7@gmail.com', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ _subject: 'Amni-Construct suggestion (' + mod + ')', suggestion: txt, reply_to: em || '(none)', context: ctx, _template: 'table' }) }).then(r => r.json()).then(j => { j.success === 'true' || j.success === true ? (note.textContent = '✓ Sent — thank you!', S('pro-sug').value = '') : Promise.reject(0) }).catch(() => { location.href = 'mailto:amnibro7@gmail.com?subject=' + encodeURIComponent('Amni-Construct suggestion (' + mod + ')') + '&body=' + encodeURIComponent(txt + '\n\n' + ctx + (em ? '\nreply: ' + em : '')); note.textContent = 'Opening your email app instead…' })
}
S('pro-gen').onclick = () => isPro() ? quoteDoc() : openGate()
btn.addEventListener('click', () => { const ck2 = document.querySelector('#uk-coach'); ck2 && ck2.remove(); drawer.classList.add('on'); drawer.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); status(); totals(); pjUI(); clList(); drawer.querySelector('.pro-x').focus() })
drawer.querySelector('.pro-x').setAttribute('aria-label', 'Close Pro panel')
drawer.querySelector('.pro-x').onclick = () => { drawer.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false'); btn.focus() }
gate.addEventListener('click', e => e.target === gate && gate.classList.remove('on'))
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return
  gate.classList.remove('on')
  if (drawer.classList.contains('on')) {
    drawer.classList.remove('on')
    drawer.setAttribute('aria-hidden', 'true')
    btn.setAttribute('aria-expanded', 'false')
    btn.focus()
  }
})
const gx = gate.querySelector('.gate-x'); gx && (gx.onclick = () => gate.classList.remove('on'))
const notifyHref = () => 'mailto:amnibro7@gmail.com?subject=' + encodeURIComponent('Construct Pro: tell me when checkout opens') + '&body=' + encodeURIComponent('Please send me the Construct Pro checkout link when it opens.')
const paintGate = () => {
  if (nativeBilling || !gate.querySelector('#pro-gate-offer')) return
  const ended = Number.isFinite(PS.trialStart) && !isPro(), href = buyUrl()
  gate.querySelector('#pro-gate-offer').hidden = ended
  gate.querySelector('#pro-gate-ended').hidden = !ended
  ;['pro-buy', 'pro-buy-ended'].forEach(id => { const el = gate.querySelector('#' + id); el && (el.hidden = !href, href && (el.href = href)) })
  gate.querySelectorAll('[data-soon]').forEach(el => el.hidden = !!href)
  gate.querySelectorAll('[data-notify]').forEach(a => a.href = notifyHref())
}
const showKeyBox = () => { gate.querySelector('#pro-gate-key').hidden = false; const input = gate.querySelector('#pro-key'); input && input.focus() }
const annual = cfgNum('AMNI_PRO_ANNUAL_USD', 0), gp = gate.querySelector('#pro-gate-price')
gp && annual && (gp.textContent = `No card, no account. $19/month or $${annual}/year after, if you keep it.`)
const fromHash = () => { if (location.hash !== '#pro') return; try { history.replaceState(null, '', location.pathname + location.search) } catch {} isPro() ? btn.click() : nativeBilling ? (gate.classList.add('on'), syncPlayBillingUI()) : openGate() }
const startTrial = () => { PS.trialStart = Number.isFinite(PS.trialStart) ? PS.trialStart : Date.now(); PS.seen = Math.max(num(PS.seen), Date.now()); saveP(); gate.classList.remove('on'); paintTrialBanner(); status() }
const paintCta = () => {
  const el = S('pro-cta'), on = !isPro()
  el.hidden = !on
  if (!on) return
  el.innerHTML = nativeBilling ? '<p>Pro turns this estimate into a branded quote and permit packet.</p><button type="button" class="pro-btn big" data-gate>See Pro plans</button>' : !Number.isFinite(PS.trialStart) ? '<p><b>Try Pro free for 14 days.</b> Fill in your company once, then turn this estimate into a branded quote. No card, no account.</p><button type="button" class="pro-btn big" data-trial>Start the free trial</button>' : `<p><b>Your trial has ended.</b> Everything you entered is still here.${buyUrl() ? '' : ` Checkout opens soon: <a href="${notifyHref()}">email me</a> for the launch link.`}</p><button type="button" class="pro-btn big" data-gate>Unlock Pro</button>`
  const t = el.querySelector('[data-trial]'), g = el.querySelector('[data-gate]')
  t && (t.onclick = startTrial); g && (g.onclick = () => nativeBilling ? (gate.classList.add('on'), syncPlayBillingUI()) : openGate())
}
const showNotice = text => {
  let bar = document.getElementById('pro-banner')
  bar && bar.remove()
  bar = document.createElement('div')
  bar.id = 'pro-banner'
  bar.setAttribute('role', 'status')
  const copy = document.createElement('span')
  copy.textContent = text
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'pro-btn ghost'
  close.textContent = 'Not now'
  close.onclick = () => bar.remove()
  bar.append(copy, close)
  document.body.appendChild(bar)
}
const paintTrialBanner = () => {
  const state = accessNow()
  if (state.kind !== 'trial' || state.days > 3) return
  const today = new Date().toISOString().slice(0, 10)
  if (PS.bannerDismissed === today) return
  if (document.getElementById('pro-banner')) return
  const bar = document.createElement('div')
  bar.id = 'pro-banner'
  bar.setAttribute('role', 'status')
  const copy = document.createElement('span')
  copy.textContent = 'Your Pro trial ends in ' + state.days + ' day' + (state.days === 1 ? '' : 's') + '. Your clients and quotes stay on this device either way. '
  bar.appendChild(copy)
  const href = buyUrl()
  const buy = document.createElement('a')
  href ? (copy.append('To keep making branded quotes: '), buy.href = href, buy.textContent = 'Buy Pro: $19/mo') : (copy.append('Checkout opens soon. '), buy.href = notifyHref(), buy.textContent = 'Get the launch email')
  bar.append(buy, ' ')
  const backup = document.createElement('span')
  backup.textContent = ' Want a backup first? '
  const exp = document.createElement('a')
  exp.href = '../construct/dashboard.html'
  exp.textContent = 'Export'
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'pro-btn ghost'
  close.textContent = 'Not now'
  close.onclick = () => { PS.bannerDismissed = today; saveP(); bar.remove() }
  bar.append(backup, exp, close)
  document.body.appendChild(bar)
}
const bootWeb = async () => {
  PS.seen = Math.max(num(PS.seen), Date.now())
  saveP()
  if (Lic && Lic.legacyKey(PS) && !PS.legacyNotice) {
    delete PS.key
    PS.legacyNotice = Date.now()
    saveP()
    showNotice(Lic.legacyMessage())
  }
  if (Lic && PS.key && PS.ent && PS.sig) {
    signatureOk = await Lic.verifyEntitlement(PS.ent, PS.sig, parsePubkey(), PS.key)
    if (!signatureOk) clearEntitlement()
    else if (Lic.needsRecheck(PS, Date.now(), signatureOk)) {
      const result = await Lic.activateKey(PS.key, licenseDeps())
      if (result.ok) {
        PS.key = result.key
        PS.ent = result.entitlement
        PS.sig = result.signature
        signatureOk = true
        recheckFailed = false
        saveP()
      } else if (result.error === 'offline') recheckFailed = true
      else clearEntitlement()
    }
  }
  paintGate()
  paintTrialBanner()
  const trial = gate.querySelector('#pro-trial')
  trial && (trial.onclick = startTrial)
  ;['pro-have-key', 'pro-have-key-ended'].forEach(id => { const el = gate.querySelector('#' + id); el && (el.onclick = showKeyBox) })
  const activate = gate.querySelector('#pro-activate')
  activate && (activate.onclick = () => {
    const err = gate.querySelector('#pro-key-err')
    const entered = gate.querySelector('#pro-key').value.trim().toUpperCase()
    err.textContent = 'Checking…'
    if (!Lic) { err.textContent = 'I need a connection once to check the key. After that it works offline for up to ' + cfgNum('AMNI_PRO_OFFLINE_DAYS', 7) + ' days.'; return }
    Lic.activateKey(entered, licenseDeps()).then(result => {
      if (!result.ok) { err.textContent = Lic.messageFor(result.error, result.maxDevices || cfgNum('AMNI_PRO_MAX_DEVICES', 3), cfgNum('AMNI_PRO_OFFLINE_DAYS', 7)); return }
      PS.key = result.key
      PS.ent = result.entitlement
      PS.sig = result.signature
      signatureOk = true
      recheckFailed = false
      saveP()
      err.textContent = ''
      gate.classList.remove('on')
      status()
    })
  })
  status()
  fromHash()
}
if (nativeBilling) {
  syncPlayBillingUI()
  fromHash()
} else {
  bootWeb()
}
})()
