(() => {
const $ = s => document.querySelector(s)
const mod = (location.pathname.match(/\/([a-z]+)\/(?:index\.html)?$/) || [])[1] || ''
const matHost = $('#mat-table') || $('#mat-body')
const ld = document.createElement('div')
ld.id = 'uk-load'
ld.innerHTML = '<div class="uk-spin"></div><div class="uk-lmsg">Loading your project…</div>'
document.body.appendChild(ld)
let ldone = false
const finishLd = () => { ldone || (ldone = true, ld.classList.add('off'), setTimeout(() => ld.remove(), 420)) }
setTimeout(finishLd, 3200)
const lp = setInterval(() => { (ldone || (matHost && matHost.textContent.trim())) && (finishLd(), clearInterval(lp)) }, 140)
const toast = (msg, ms) => { const t = document.createElement('div'); t.className = 'uk-toast'; t.textContent = msg; document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('on')); setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 380) }, ms || 3600) }
const tabs = [...document.querySelectorAll('.tab')]
const matTab = tabs.find(t => t.dataset.pane === 'mat')
const readTot = () => {
  if (!matHost) return ''
  const t = matHost.querySelector('.tot.best') || matHost.querySelector('.tot')
  if (t && /\$\s*[\d,.]+/.test(t.textContent)) return t.textContent.trim().replace(/\.00$/, '')
  const m = (matHost.textContent.match(/\$[\d,]+(?:\.\d{2})?/g) || []).map(x => +x.replace(/[$,]/g, ''))
  return m.length ? '$' + Math.max(...m).toLocaleString(undefined, { maximumFractionDigits: 0 }) : ''
}
const pill = document.createElement('div')
pill.id = 'uk-quote'
pill.innerHTML = '<span class="uk-qlab">Live<br>estimate</span><b></b><button id="uk-share" title="Copy a shareable link to this exact design">🔗</button>'
document.body.appendChild(pill)
const qv = pill.querySelector('b')
const upd = () => { const v = readTot(); pill.classList.toggle('on', !!v); v && (qv.textContent = v) }
matHost && new MutationObserver(upd).observe(matHost, { childList: true, subtree: true, characterData: true })
upd(); setTimeout(upd, 1600); setTimeout(upd, 4200)
pill.addEventListener('click', e => { e.target.id !== 'uk-share' && matTab && matTab.click() })
$('#uk-share').addEventListener('click', e => {
  e.stopPropagation()
  const d = {}
  Object.keys(localStorage).filter(k => k.startsWith('amni' + mod + '.')).forEach(k => { d[k] = localStorage.getItem(k) })
  if (!Object.keys(d).length) return toast('Nothing to share yet — tweak your design first!')
  const u = location.origin + location.pathname + '#share=' + btoa(unescape(encodeURIComponent(JSON.stringify(d))))
  const ok = () => toast('🔗 Link copied — anyone who opens it sees this exact design')
  navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(u).then(ok, () => prompt('Copy this share link:', u)) : prompt('Copy this share link:', u)
})
const ck = 'amni.uk.coach.' + mod
if (mod && tabs.length && !localStorage.getItem(ck)) {
  localStorage.setItem(ck, '1')
  const has = p => tabs.some(t => t.dataset.pane === p)
  const feats = [has('draw') && '<b>📐 Draw shape</b> — sketch your exact footprint', has('trace') && '<b>📷 Photo Trace</b> — trace it from a satellite photo', has('sketch') && '<b>✏️ Layout</b> — drag fixtures, runs auto-route + price', has('plans') && '<b>2D Plans</b> — printable construction sheets'].filter(Boolean)
  if (feats.length) {
    const c = document.createElement('div')
    c.id = 'uk-coach'
    c.innerHTML = `Everything updates live as you tweak — and your running total floats bottom-right.<br>${feats.slice(0, 3).join('<br>')}<br><button class="uk-ok">Got it</button>`
    document.body.appendChild(c)
    const bye = () => c.remove()
    c.querySelector('.uk-ok').onclick = bye
    setTimeout(bye, 16000)
  }
}
const stepify = () => document.querySelectorAll('#side .row input[type=number]').forEach(i => {
  if (i.dataset.uk) return
  i.dataset.uk = '1'
  const w = document.createElement('span')
  w.className = 'uk-step'
  i.parentNode.insertBefore(w, i)
  const mk = (txt, dir) => { const b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1; b.textContent = txt; b.onclick = () => { const st = +i.step || 1, mn = i.min !== '' ? +i.min : -1e9, mx = i.max !== '' ? +i.max : 1e9, v = Math.min(mx, Math.max(mn, Math.round(((+i.value || 0) + dir * st) / st) * st)); i.value = +v.toFixed(3); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })) }; return b }
  const minus = mk('−', -1), plus = mk('+', 1)
  w.appendChild(minus); w.appendChild(i); w.appendChild(plus)
})
stepify(); setTimeout(stepify, 1500)
})()
