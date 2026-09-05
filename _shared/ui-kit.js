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
const tablist = document.querySelector('.tabs')
if (tablist && tabs.length) {
  tablist.setAttribute('role', 'tablist')
  tablist.setAttribute('aria-label', 'Editor views')
  const syncTabs = active => {
    tabs.forEach((tab, i) => {
      const paneName = tab.dataset.pane
      const pane = document.getElementById('pane-' + paneName)
      const fallback = pane || (paneName === '3d' && document.getElementById('c3d')) || document.getElementById('view')
      if (!tab.id) tab.id = 'editor-tab-' + paneName
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-controls', fallback && fallback.id ? fallback.id : 'view')
      const selected = active ? tab === active : tab.classList.contains('on')
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      if (pane) {
        pane.setAttribute('role', 'tabpanel')
        pane.setAttribute('aria-labelledby', tab.id)
      } else if (fallback && fallback.tagName === 'CANVAS') {
        fallback.setAttribute('role', 'region')
        fallback.setAttribute('aria-label', tab.textContent.trim())
      }
      if (!active && i === 0 && !tabs.some(item => item.classList.contains('on'))) tab.tabIndex = 0
    })
  }
  syncTabs()
  tabs.forEach(tab => {
    tab.addEventListener('click', () => setTimeout(() => syncTabs(tab), 0))
    tab.addEventListener('keydown', event => {
      const current = tabs.indexOf(tab)
      let next = -1
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabs.length
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + tabs.length) % tabs.length
      if (event.key === 'Home') next = 0
      if (event.key === 'End') next = tabs.length - 1
      if (next < 0) return
      event.preventDefault()
      tabs[next].focus()
      tabs[next].click()
    })
  })
}
document.querySelectorAll('#side .row').forEach((row, i) => {
  const label = row.querySelector('label')
  const control = row.querySelector('input,select,textarea')
  if (!label || !control) return
  if (!control.id) control.id = 'editor-field-' + i
  if (!label.htmlFor) label.htmlFor = control.id
})
const menuButton = $('#menubtn')
const sidePanel = $('#side')
const backdrop = $('#backdrop')
if (menuButton && sidePanel) {
  menuButton.setAttribute('aria-controls', 'side')
  const syncMenu = () => menuButton.setAttribute('aria-expanded', String(sidePanel.classList.contains('open')))
  syncMenu()
  menuButton.addEventListener('click', () => setTimeout(syncMenu, 0))
  backdrop && backdrop.addEventListener('click', () => setTimeout(syncMenu, 0))
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !sidePanel.classList.contains('open')) return
    sidePanel.classList.remove('open')
    backdrop && backdrop.classList.remove('open')
    syncMenu()
    menuButton.focus()
  })
}
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
pill.setAttribute('role', 'button')
pill.setAttribute('aria-label', 'Open materials and pricing')
pill.tabIndex = 0
document.body.appendChild(pill)
$('#uk-share').setAttribute('aria-label', 'Copy a shareable link to this design')
const qv = pill.querySelector('b')
const upd = () => { const v = readTot(); pill.classList.toggle('on', !!v); v && (qv.textContent = v) }
matHost && new MutationObserver(upd).observe(matHost, { childList: true, subtree: true, characterData: true })
upd(); setTimeout(upd, 1600); setTimeout(upd, 4200)
pill.addEventListener('click', e => { e.target.id !== 'uk-share' && matTab && matTab.click() })
pill.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target === pill) {
    e.preventDefault()
    matTab && matTab.click()
  }
})
$('#uk-share').addEventListener('click', e => {
  e.stopPropagation()
  const api = window.AmniShareImport
  if (!api) return toast('Sharing is unavailable right now.')
  let d, encoded
  try {
    d = api.collectShareData(mod, localStorage)
    if (!Object.keys(d).length) return toast('Nothing to share yet — tweak your design first!')
    encoded = api.encodePayload(d)
  } catch (error) {
    return toast(error && error.message ? error.message : 'This design could not be shared safely.')
  }
  const u = location.origin + location.pathname + '#share=' + encoded
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
const AFF = window.AMNI_AFF || { hd: '', lowes: '' }
const affFor = h => /homedepot\.com/.test(h) ? AFF.hd : /lowes\.com/.test(h) ? AFF.lowes : ''
document.addEventListener('click', e => { const a = e.target.closest ? e.target.closest('a[href]') : null; const t = a && !a.dataset.ukAff ? affFor(a.href) : ''; t && (a.dataset.ukAff = '1', a.rel = 'sponsored noopener', a.href = t.replace('{u}', encodeURIComponent(a.href))) }, true)
;(AFF.hd || AFF.lowes) && matHost && matHost.parentNode.insertAdjacentHTML('beforeend', '<div class="uk-affnote">Store links are affiliate links — qualifying purchases may earn this site a commission at no extra cost to you.</div>')
mod && $('#side') && fetch('../_shared/presets.json?v=p1').then(r => r.ok ? r.json() : {}).then(P => { const list = P[mod] || []; if (!list.length) return; const side = $('#side'), w = document.createElement('div'); w.id = 'uk-presets'; w.innerHTML = '<span>⚡ Quick start</span>' + list.map((p, i) => `<button type="button" data-i="${i}" title="${p.tip || ''}">${p.name}</button>`).join(''); side.insertBefore(w, side.firstChild); w.addEventListener('click', e => { const b = e.target.closest('button'); b && (location.hash = '#share=' + list[+b.dataset.i].h, location.reload()) }) }).catch(() => {})
mod && $('#side') && $('#side').insertAdjacentHTML('beforeend', `<a class="uk-guide" href="../construct/${mod}.html">📖 Full cost guide &amp; how-to</a>`)
})()
