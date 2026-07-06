(() => {
const $ = s => document.querySelector(s)
const mod = (location.pathname.match(/\/([a-z]+)\/(?:index\.html)?$/) || [])[1] || ''
const MODNAME = { deck: 'Deck', patio: 'Patio & Slab', pool: 'Pool', floor: 'Flooring', roof: 'Roofing', frame: 'Framing', plumb: 'Plumbing', elec: 'Electrical', hvac: 'HVAC', plan: 'Whole-House', garden: 'Garden' }[mod] || 'Project'
const matHost = $('#mat-table') || $('#mat-body')
const tabs = $('.tabs')
if (!tabs || !mod) return
const PS = (() => { try { return JSON.parse(localStorage.getItem('amni.pro.v1')) || {} } catch { return {} } })()
PS.co = PS.co || { name: '', phone: '', email: '', lic: '', addr: '', web: '', logo: '', terms: '' }
PS.def = PS.def || { markup: 20, tax: 0, overhead: 0, rate: 75 }
const QK = 'amni.pro.q.' + mod + '.v1'
const Q = (() => { try { return JSON.parse(localStorage.getItem(QK)) || {} } catch { return {} } })()
Q.client = Q.client || { name: '', addr: '', contact: '' }
Q.scope = Q.scope || ''
Q.labor = Q.labor && Q.labor.length ? Q.labor : [{ desc: 'Labor — installation', hrs: 0, rate: PS.def.rate }]
Q.extras = Q.extras || []
Q.r = Q.r || { markup: PS.def.markup, tax: PS.def.tax, overhead: PS.def.overhead }
Q.r.deposit = Q.r.deposit ?? 50
Q.r.discount = Q.r.discount ?? 0
PS.rateBook = PS.rateBook && PS.rateBook.length ? PS.rateBook : [{ d: 'Demolition & tear-out', r: 65 }, { d: 'Installation labor', r: 75 }, { d: 'Carpentry — framing', r: 70 }, { d: 'Finish carpentry', r: 85 }, { d: 'Electrical (licensed)', r: 110 }, { d: 'Plumbing (licensed)', r: 105 }, { d: 'Concrete & flatwork', r: 70 }, { d: 'Roofing labor', r: 80 }, { d: 'Painting & finishing', r: 55 }, { d: 'Site cleanup & haul-off', r: 50 }]
const saveP = () => localStorage.setItem('amni.pro.v1', JSON.stringify(PS))
const saveQ = () => localStorage.setItem(QK, JSON.stringify(Q))
const TRIAL_MS = 14 * 864e5
const chk = k => { const m = k.match(/^AMNI-PRO-([A-Z0-9]{5})-([A-Z0-9]{5})$/); if (!m) return false; const p = m[1] + m[2]; let s = 0; for (let i = 0; i < 9; i++) s += p.charCodeAt(i) * (i + 3); return p[9] === (s % 36).toString(36).toUpperCase() }
const isPro = () => PS.key ? true : PS.trialStart ? Date.now() < PS.trialStart + TRIAL_MS : false
const trialDays = () => PS.trialStart ? Math.max(0, Math.ceil((PS.trialStart + TRIAL_MS - Date.now()) / 864e5)) : 0
const lsqCheck = k => window.AMNI_LSQ ? fetch('https://api.lemonsqueezy.com/v1/licenses/validate', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ license_key: k }) }).then(r => r.json()).then(j => !!j.valid).catch(() => chk(k)) : Promise.resolve(chk(k))
const money = n => '$' + (+n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const matRaw = () => { if (!matHost) return 0; const t = matHost.querySelector('.tot.best') || matHost.querySelector('.tot'); const m = (t ? t.textContent : matHost.textContent).match(/\$\s*([\d,]+(?:\.\d{2})?)/g); return m && m.length ? Math.max(...m.map(x => +x.replace(/[$,\s]/g, ''))) : 0 }
const calc = () => { const mr = matRaw(), ms = mr * (1 + (+Q.r.markup || 0) / 100), lb = Q.labor.reduce((a, l) => a + (+l.hrs || 0) * (+l.rate || 0), 0), ex = Q.extras.reduce((a, x) => a + (+x.amt || 0), 0), oh = +Q.r.overhead || 0, di = +Q.r.discount || 0, sub = ms + lb + ex + oh - di, tax = sub * (+Q.r.tax || 0) / 100, grand = sub + tax; return { mr, ms, lb, ex, oh, di, sub, tax, grand, dep: grand * (+Q.r.deposit || 0) / 100 } }
const btn = document.createElement('div')
btn.className = 'pro-tab'
btn.id = 'pro-open'
btn.textContent = '💼 Pro'
tabs.appendChild(btn)
const drawer = document.createElement('div')
drawer.id = 'pro-drawer'
drawer.innerHTML = `<div id="pro-head"><b>💼 AMNI-CONSTRUCT PRO</b><span id="pro-status"></span><a href="../construct/dashboard.html" title="Quotes & projects dashboard" style="color:#e8b565;text-decoration:none;font-size:16px;margin-left:auto">📊</a><button class="pro-x" title="Close" style="margin-left:6px">✕</button></div><div id="pro-body">
<h3>Your company</h3><div class="pro-grid">
<div class="full pro-logo-row"><img id="pro-logo-img" alt="" style="display:none"><button class="pro-btn pro-logo-btn" id="pro-logo-btn">Upload logo</button><input type="file" id="pro-logo-file" accept="image/*" style="display:none"><span class="pro-note">shows on quotes</span></div>
<div class="full"><label>Company name</label><input type="text" id="pro-co-name"></div>
<div><label>Phone</label><input type="tel" id="pro-co-phone"></div>
<div><label>Email</label><input type="email" id="pro-co-email"></div>
<div><label>License #</label><input type="text" id="pro-co-lic"></div>
<div><label>Website</label><input type="text" id="pro-co-web"></div>
<div class="full"><label>Address</label><input type="text" id="pro-co-addr"></div>
<div class="full"><label>Quote terms (blank = standard)</label><textarea id="pro-co-terms" placeholder="50% deposit due on acceptance..."></textarea></div></div>
<h3>Client & project</h3><div class="pro-grid">
<div class="full"><label>Client name</label><input type="text" id="pro-cl-name" list="pro-cl-list"><datalist id="pro-cl-list"></datalist></div>
<div class="full"><label>Project address</label><input type="text" id="pro-cl-addr"></div>
<div class="full"><label>Client phone / email</label><input type="text" id="pro-cl-contact"></div>
<div class="full"><button class="pro-btn ghost" id="pro-cl-save" style="font-size:11px;padding:5px 10px">＋ Save client for reuse</button></div>
<div class="full"><label>Scope of work</label><textarea id="pro-scope" placeholder="Supply and install..."></textarea></div></div>
<h3>Saved projects</h3><div id="pro-projects"></div><button class="pro-btn ghost" id="pro-proj-save">💾 Save current design as project</button>
<h3>Labor</h3><div id="pro-labor"></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="pro-btn ghost" id="pro-labor-add">+ Add labor line</button><select id="pro-ratebook" style="flex:1;min-width:150px;background:var(--bg,#0b0e12);border:1px solid var(--line,#2a3038);border-radius:6px;color:var(--mut,#8a94a0);font:inherit;font-size:11.5px;padding:6px"><option value="">+ from rate book…</option></select></div>
<h3>Other line items</h3><div id="pro-extras"></div><button class="pro-btn ghost" id="pro-extras-add">+ Add item (dumpster, equipment, permits…)</button>
<h3>Pricing</h3><div class="pro-grid">
<div><label>Materials markup %</label><input type="number" id="pro-r-markup" step="1"></div>
<div><label>Tax %</label><input type="number" id="pro-r-tax" step="0.01"></div>
<div><label>Overhead / PM $</label><input type="number" id="pro-r-overhead" step="1"></div>
<div><label>Default labor $/hr</label><input type="number" id="pro-r-rate" step="1"></div>
<div><label>Discount $</label><input type="number" id="pro-r-discount" step="1"></div>
<div><label>Deposit %</label><input type="number" id="pro-r-deposit" step="1"></div></div>
<div id="pro-totals" style="margin-top:12px"></div>
<button class="pro-btn big" id="pro-gen">🧾 Generate branded quote</button>
<p class="pro-note">Opens a print-ready quote — use your browser's Print → Save as PDF. Quote numbers increment automatically.</p>
<div id="pro-lic-row"></div></div>`
document.body.appendChild(drawer)
const gate = document.createElement('div')
gate.id = 'pro-gate'
gate.innerHTML = `<div class="gate-card"><h2>💼 Amni-Construct Pro</h2><p>Branded client quotes, your labor rates and markup, permit-ready packets — built for contractors. Try every Pro feature free for 14 days, no card needed.</p><button class="pro-btn big" id="pro-trial">Start free 14-day trial</button><input type="text" id="pro-key" placeholder="AMNI-PRO-XXXXX-XXXXX" spellcheck="false"><p class="gate-err" id="pro-key-err"></p><button class="pro-btn ghost big" id="pro-activate" style="margin-top:2px">Activate license key</button><p class="gate-alt"><a href="../construct/pro.html" target="_blank">Plans & pricing ↗</a></p></div>`
document.body.appendChild(gate)
const S = id => drawer.querySelector('#' + id)
const status = () => { const el = S('pro-status'); PS.key ? (el.className = 'ok', el.textContent = 'PRO ACTIVE') : isPro() ? (el.className = 'trial', el.textContent = 'TRIAL — ' + trialDays() + 'd left') : (el.className = 'off', el.textContent = 'LOCKED'); el.id = 'pro-status'; S('pro-lic-row').innerHTML = PS.key ? `<p class="pro-note" style="margin-top:16px">License: ${PS.key.slice(0, 14)}••• · <a href="#" id="pro-deact" style="color:#c96b6b">deactivate</a></p>` : `<p class="pro-note" style="margin-top:16px"><a href="#" id="pro-unlock" style="color:#e8b565">${isPro() ? 'Enter license key' : 'Unlock Pro'}</a> · <a href="../construct/pro.html" target="_blank" style="color:#e8b565">pricing ↗</a></p>`; const d = S('pro-deact'); d && (d.onclick = e => { e.preventDefault(); PS.key = ''; saveP(); status() }); const u = S('pro-unlock'); u && (u.onclick = e => { e.preventDefault(); gate.classList.add('on') }) }
const bindCo = (id, k) => { const el = S(id); el.value = PS.co[k] || ''; el.addEventListener('input', () => { PS.co[k] = el.value; saveP() }) }
bindCo('pro-co-name', 'name'); bindCo('pro-co-phone', 'phone'); bindCo('pro-co-email', 'email'); bindCo('pro-co-lic', 'lic'); bindCo('pro-co-web', 'web'); bindCo('pro-co-addr', 'addr'); bindCo('pro-co-terms', 'terms')
const bindCl = (id, k) => { const el = S(id); el.value = Q.client[k] || ''; el.addEventListener('input', () => { Q.client[k] = el.value; saveQ() }) }
bindCl('pro-cl-name', 'name'); bindCl('pro-cl-addr', 'addr'); bindCl('pro-cl-contact', 'contact')
const CK = 'amni.pro.clients.v1', PJ = 'amni.pro.projects.v1'
const getCl = () => { try { return JSON.parse(localStorage.getItem(CK)) || [] } catch { return [] } }
const getPj = () => { try { return JSON.parse(localStorage.getItem(PJ)) || [] } catch { return [] } }
const clList = () => { S('pro-cl-list').innerHTML = getCl().map(c => `<option value="${esc(c.name)}">`).join('') }
S('pro-cl-name').addEventListener('input', () => { const c = getCl().find(x => x.name === S('pro-cl-name').value); c && (Q.client.addr = c.addr || '', Q.client.contact = c.contact || '', S('pro-cl-addr').value = Q.client.addr, S('pro-cl-contact').value = Q.client.contact, saveQ()) })
S('pro-cl-save').onclick = () => { const n = Q.client.name.trim(); if (!n) return; const cl = getCl(), ex = cl.find(x => x.name === n); ex ? Object.assign(ex, { addr: Q.client.addr, contact: Q.client.contact }) : cl.push({ id: Date.now().toString(36), name: n, addr: Q.client.addr, contact: Q.client.contact }); localStorage.setItem(CK, JSON.stringify(cl)); clList(); S('pro-cl-save').textContent = '✓ Client saved'; setTimeout(() => S('pro-cl-save').textContent = '＋ Save client for reuse', 1600) }
const pjUI = () => { const w = S('pro-projects'); const list = getPj().filter(p => p.mod === mod); w.innerHTML = list.length ? list.map(p => `<div class="pro-labor" style="align-items:center"><span style="flex:1;font-size:12px;color:var(--ink,#dfe6ee)">${esc(p.name)}<span style="color:var(--mut,#8a94a0);font-size:10px"> · ${new Date(p.ts).toLocaleDateString()}</span></span><button class="pro-btn ghost" data-load="${p.id}" style="font-size:10.5px;padding:4px 9px">Open</button><button class="l-del" data-del="${p.id}" title="Delete">✕</button></div>`).join('') : '<p class="pro-note">No saved projects for this module yet — design something and save it.</p>'; w.querySelectorAll('[data-load]').forEach(b => b.onclick = () => { const p = getPj().find(x => x.id === b.dataset.load); p && (location.hash = '#share=' + btoa(unescape(encodeURIComponent(JSON.stringify(p.data)))), location.reload()) }); w.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { localStorage.setItem(PJ, JSON.stringify(getPj().filter(x => x.id !== b.dataset.del))); pjUI() }) }
S('pro-proj-save').onclick = () => { if (!isPro()) return gate.classList.add('on'); const data = {}; Object.keys(localStorage).filter(k => k.startsWith('amni' + mod + '.')).forEach(k => data[k] = localStorage.getItem(k)); if (!Object.keys(data).length) return; const name = prompt('Project name:', (Q.client.name ? Q.client.name + ' — ' : '') + MODNAME) || ''; if (!name.trim()) return; const pj = getPj(); pj.unshift({ id: Date.now().toString(36), name: name.trim(), mod, client: Q.client.name || '', ts: Date.now(), data }); localStorage.setItem(PJ, JSON.stringify(pj.slice(0, 100))); pjUI() }
const sc = S('pro-scope'); sc.value = Q.scope; sc.addEventListener('input', () => { Q.scope = sc.value; saveQ() })
const bindR = (id, k) => { const el = S(id); el.value = Q.r[k] ?? ''; el.addEventListener('input', () => { Q.r[k] = +el.value || 0; PS.def[k === 'rate' ? 'rate' : k] = Q.r[k]; saveQ(); saveP(); totals() }) }
Q.r.rate = Q.r.rate ?? PS.def.rate
bindR('pro-r-markup', 'markup'); bindR('pro-r-tax', 'tax'); bindR('pro-r-overhead', 'overhead'); bindR('pro-r-rate', 'rate'); bindR('pro-r-discount', 'discount'); bindR('pro-r-deposit', 'deposit')
const rb = S('pro-ratebook')
PS.rateBook.forEach((e, i) => { const o = document.createElement('option'); o.value = i; o.textContent = `${e.d} — $${e.r}/hr`; rb.appendChild(o) })
rb.addEventListener('change', () => { if (rb.value === '') return; const e = PS.rateBook[+rb.value]; Q.labor.push({ desc: e.d, hrs: 0, rate: e.r }); saveQ(); laborUI(); totals(); rb.value = '' })
const laborUI = () => { const w = S('pro-labor'); w.innerHTML = ''; Q.labor.forEach((l, i) => { const row = document.createElement('div'); row.className = 'pro-labor'; row.innerHTML = `<input type="text" class="l-desc" placeholder="Task" value=""><input type="number" class="l-hrs" placeholder="hrs" step="0.5"><input type="number" class="l-rate" placeholder="$/hr" step="1"><button class="l-del" title="Remove">✕</button>`; const [de, hr, ra] = row.querySelectorAll('input'); de.value = l.desc || ''; hr.value = l.hrs || ''; ra.value = l.rate || ''; de.addEventListener('input', () => { l.desc = de.value; saveQ() }); hr.addEventListener('input', () => { l.hrs = +hr.value || 0; saveQ(); totals() }); ra.addEventListener('input', () => { l.rate = +ra.value || 0; saveQ(); totals() }); row.querySelector('.l-del').onclick = () => { Q.labor.splice(i, 1); saveQ(); laborUI(); totals() }; w.appendChild(row) }) }
laborUI()
S('pro-labor-add').onclick = () => { Q.labor.push({ desc: '', hrs: 0, rate: Q.r.rate || PS.def.rate }); saveQ(); laborUI() }
const extrasUI = () => { const w = S('pro-extras'); w.innerHTML = ''; Q.extras.forEach((x, i) => { const row = document.createElement('div'); row.className = 'pro-labor'; row.innerHTML = `<input type="text" class="l-desc" placeholder="Item"><input type="number" class="l-rate" placeholder="$" step="1" style="width:92px"><button class="l-del" title="Remove">✕</button>`; const [de, am] = row.querySelectorAll('input'); de.value = x.desc || ''; am.value = x.amt || ''; de.addEventListener('input', () => { x.desc = de.value; saveQ() }); am.addEventListener('input', () => { x.amt = +am.value || 0; saveQ(); totals() }); row.querySelector('.l-del').onclick = () => { Q.extras.splice(i, 1); saveQ(); extrasUI(); totals() }; w.appendChild(row) }) }
extrasUI()
S('pro-extras-add').onclick = () => { Q.extras.push({ desc: '', amt: 0 }); saveQ(); extrasUI() }
const totals = () => { const c = calc(); S('pro-totals').innerHTML = `<div class="pro-tot"><span>Materials (retail ${money(c.mr)} + ${+Q.r.markup || 0}%)</span><b>${money(c.ms)}</b></div><div class="pro-tot"><span>Labor</span><b>${money(c.lb)}</b></div>${c.ex ? `<div class="pro-tot"><span>Other items</span><b>${money(c.ex)}</b></div>` : ''}${c.oh ? `<div class="pro-tot"><span>Overhead / PM</span><b>${money(c.oh)}</b></div>` : ''}${c.di ? `<div class="pro-tot"><span>Discount</span><b>−${money(c.di)}</b></div>` : ''}<div class="pro-tot"><span>Tax ${+Q.r.tax || 0}%</span><b>${money(c.tax)}</b></div><div class="pro-tot grand"><span>Quote total</span><b>${money(c.grand)}</b></div>${+Q.r.deposit ? `<div class="pro-tot"><span>Deposit on acceptance (${+Q.r.deposit}%)</span><b>${money(c.dep)}</b></div>` : ''}` }
totals()
matHost && new MutationObserver(totals).observe(matHost, { childList: true, subtree: true, characterData: true })
const logoImg = S('pro-logo-img')
const logoShow = () => { PS.co.logo ? (logoImg.src = PS.co.logo, logoImg.style.display = '') : logoImg.style.display = 'none' }
logoShow()
S('pro-logo-btn').onclick = () => S('pro-logo-file').click()
S('pro-logo-file').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const sc2 = Math.min(1, 200 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * sc2); cv.height = Math.round(im.height * sc2); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); PS.co.logo = cv.toDataURL('image/png'); saveP(); logoShow() }; im.src = r.result }; r.readAsDataURL(f) })
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
clList(); pjUI()
const matSchedule = () => { if (!matHost) return ''; const rows = [...matHost.querySelectorAll('tr')].map(tr => [...tr.children].map(td => td.textContent.trim())).filter(c => c.length >= 2 && c[0] && !/total|subtotal/i.test(c[0]) && /^\d/.test(c[1] || '')).map(c => `<tr><td>${esc(c[0])}</td><td>${esc(c[1])}</td></tr>`); return rows.length ? `<h3>Materials schedule</h3><table class="ms"><thead><tr><th>Item</th><th>Qty</th></tr></thead><tbody>${rows.join('')}</tbody></table><p class="fine">Quantities computed by Amni-Construct from the approved design. Substitutions of equal grade permitted.</p>` : '' }
const quoteDoc = () => {
  const c = calc(), d = new Date(), vd = new Date(Date.now() + 30 * 864e5)
  PS.seq = (PS.seq || 0) + 1; saveP()
  const qn = 'Q-' + d.getFullYear() + '-' + String(PS.seq).padStart(4, '0')
  const terms = PS.co.terms || 'This quote is valid for 30 days from the date above. A 50% deposit is due on acceptance; the balance is due on completion. Any change to the scope of work will be documented and priced as a written change order before proceeding. Materials are subject to availability; substitutions will be of equal or better grade.'
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${qn} — ${esc(PS.co.name || 'Quote')}</title><style>
  body{font:13px/1.6 'Segoe UI',system-ui,sans-serif;color:#1a2028;margin:0;padding:40px 48px;max-width:820px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d78f3c;padding-bottom:18px}
  .co b{font-size:19px;display:block}.co span{color:#5a6470;font-size:12px;display:block}
  .co img{max-height:60px;max-width:180px;margin-bottom:8px;display:block}
  .qmeta{text-align:right}.qmeta h1{margin:0;font-size:26px;letter-spacing:.14em;color:#d78f3c}
  .qmeta div{font-size:12px;color:#5a6470}.qmeta b{color:#1a2028}
  .two{display:flex;gap:32px;margin:20px 0}
  .blk{flex:1}.blk h3{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#8a94a0;margin:0 0 4px}
  .blk div{font-size:13px}
  h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a94a0;margin:22px 0 6px}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  th{text-align:left;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#8a94a0;border-bottom:1.5px solid #d0d6dd;padding:5px 8px}
  td{padding:6px 8px;border-bottom:1px solid #e8ecf0}
  td:last-child,th:last-child{text-align:right}
  .ms td:last-child,.ms th:last-child{text-align:right;width:90px}
  .tots{margin-left:auto;width:300px;margin-top:14px}
  .tots div{display:flex;justify-content:space-between;padding:4px 8px;font-size:13px}
  .tots .g{border-top:2px solid #d78f3c;font-size:16px;font-weight:700;margin-top:4px;padding-top:8px}
  .tots .g span:last-child{color:#d78f3c}
  .terms{font-size:11px;color:#5a6470;line-height:1.7;margin-top:26px;border-top:1px solid #e8ecf0;padding-top:14px}
  .sig{display:flex;gap:40px;margin-top:44px}
  .sig div{flex:1;border-top:1.5px solid #1a2028;padding-top:5px;font-size:11px;color:#5a6470}
  .fine{font-size:10px;color:#8a94a0}
  .foot{margin-top:34px;font-size:10px;color:#b0b8c0;text-align:center}
  .pbar{position:fixed;top:12px;right:12px}@media print{.pbar{display:none}body{padding:0}}
  </style></head><body>
  <div class="pbar"><button onclick="print()" style="font:600 13px 'Segoe UI';padding:9px 18px;background:#d78f3c;color:#fff;border:none;border-radius:7px;cursor:pointer">🖨 Print / Save PDF</button></div>
  <div class="top"><div class="co">${PS.co.logo ? `<img src="${PS.co.logo}" alt="">` : ''}<b>${esc(PS.co.name || 'Your Company')}</b>${PS.co.addr ? `<span>${esc(PS.co.addr)}</span>` : ''}<span>${[PS.co.phone, PS.co.email, PS.co.web].filter(Boolean).map(esc).join(' · ')}</span>${PS.co.lic ? `<span>License ${esc(PS.co.lic)}</span>` : ''}</div>
  <div class="qmeta"><h1>QUOTE</h1><div><b>${qn}</b></div><div>Date: <b>${d.toLocaleDateString()}</b></div><div>Valid until: <b>${vd.toLocaleDateString()}</b></div></div></div>
  <div class="two"><div class="blk"><h3>Prepared for</h3><div><b>${esc(Q.client.name || '—')}</b></div><div>${esc(Q.client.addr || '')}</div><div>${esc(Q.client.contact || '')}</div></div>
  <div class="blk"><h3>Project</h3><div><b>${MODNAME} project</b></div><div>${esc(Q.client.addr || '')}</div></div></div>
  ${Q.scope ? `<h3>Scope of work</h3><div style="font-size:13px;white-space:pre-wrap">${esc(Q.scope)}</div>` : ''}
  <h3>Investment</h3><table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>
  <tr><td>Materials &amp; supplies — furnished and installed</td><td>${money(c.ms)}</td></tr>
  ${Q.labor.filter(l => (+l.hrs || 0) * (+l.rate || 0) > 0).map(l => `<tr><td>${esc(l.desc || 'Labor')}</td><td>${money((+l.hrs || 0) * (+l.rate || 0))}</td></tr>`).join('')}
  ${Q.extras.filter(x => +x.amt > 0).map(x => `<tr><td>${esc(x.desc || 'Additional item')}</td><td>${money(+x.amt)}</td></tr>`).join('')}
  ${c.oh ? `<tr><td>Project management &amp; overhead</td><td>${money(c.oh)}</td></tr>` : ''}
  ${c.di ? `<tr><td>Discount</td><td>−${money(c.di)}</td></tr>` : ''}
  </tbody></table>
  <div class="tots"><div><span>Subtotal</span><span>${money(c.sub)}</span></div><div><span>Tax (${+Q.r.tax || 0}%)</span><span>${money(c.tax)}</span></div><div class="g"><span>TOTAL</span><span id="q-total">${money(c.grand)}</span></div>${c.dep ? `<div style="color:#d78f3c;font-weight:600"><span>Deposit due on acceptance (${+Q.r.deposit}%)</span><span id="q-dep">${money(c.dep)}</span></div>` : ''}</div>
  ${matSchedule()}
  <div class="terms"><b>Terms</b><br>${esc(terms)}</div>
  <div class="sig"><div>Contractor signature / date</div><div>Client acceptance signature / date</div></div>
  <div class="foot">${esc(PS.co.name || '')} · ${qn} · generated with Amni-Construct Pro</div>
  </body></html>`
  const hist = (() => { try { return JSON.parse(localStorage.getItem('amni.pro.quotes.v1')) || [] } catch { return [] } })()
  hist.unshift({ qn, ts: Date.now(), mod, client: Q.client.name || '', total: +c.grand.toFixed(2), status: 'draft' })
  localStorage.setItem('amni.pro.quotes.v1', JSON.stringify(hist.slice(0, 200)))
  const w = window.open('', '_blank')
  w ? (w.document.write(html), w.document.close()) : alert('Allow pop-ups to generate the quote document.')
}
S('pro-gen').onclick = () => isPro() ? quoteDoc() : gate.classList.add('on')
btn.addEventListener('click', () => { drawer.classList.add('on'); status(); totals(); pjUI(); clList() })
drawer.querySelector('.pro-x').onclick = () => drawer.classList.remove('on')
gate.addEventListener('click', e => e.target === gate && gate.classList.remove('on'))
gate.querySelector('#pro-trial').onclick = () => { PS.trialStart = PS.trialStart || Date.now(); saveP(); gate.classList.remove('on'); status() }
gate.querySelector('#pro-activate').onclick = () => { const k = gate.querySelector('#pro-key').value.trim().toUpperCase(), err = gate.querySelector('#pro-key-err'); err.textContent = 'Checking…'; lsqCheck(k).then(ok => { ok ? (PS.key = k, saveP(), err.textContent = '', gate.classList.remove('on'), status()) : err.textContent = 'That key doesn’t validate — check for typos or contact support.' }) }
status()
})()
