import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const config = readFileSync(new URL('../_shared/pro-config.js', import.meta.url), 'utf8')
const page = readFileSync(new URL('../construct/pro.html', import.meta.url), 'utf8')
const claim = readFileSync(new URL('../construct/claim.html', import.meta.url), 'utf8')

function constant(name) {
  const match = config.match(new RegExp('window\\.' + name + ' = (\\d+)'))
  assert.ok(match, name)
  return Number(match[1])
}

function visibleFaqs(html) {
  return [...html.matchAll(/<details><summary>(.*?)<\/summary><div>(.*?)<\/div><\/details>/g)].map(match => ({
    q: match[1],
    a: match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  }))
}

test('pricing copy drops the sync overclaim and marks the unconfirmed numbers', () => {
  assert.equal(config.includes('AMNI_LSQ'), false)
  assert.equal(config.includes("AMNI_BUY_URL = ''"), true)
  assert.equal(constant('AMNI_PRO_ANNUAL_USD'), 190)
  assert.equal(constant('AMNI_PRO_REFUND_DAYS'), 30)
  assert.equal(constant('AMNI_PRO_MAX_DEVICES'), 3)
  assert.equal(constant('AMNI_PRO_OFFLINE_DAYS'), 7)
  assert.match(config, /TODO\(anthony\)/)
  assert.equal(/same data/i.test(page), false)
  assert.equal(page.includes('Done before the other guy'), false)
  assert.equal(/polished/i.test(page), false)
  assert.match(page, /isn.t an engineer.s stamp/)
  assert.match(page, /\$190\/year/)
  assert.match(page, /30 days/)
  assert.match(page, /3 devices/)
  assert.match(page, /7 days/)
  assert.match(page, /\$4,830\.00/)
  assert.match(page, /\$9,200\.80/)
  assert.match(page, /\$4,600\.40/)
  assert.match(page, /Checkout is opening soon/)
  assert.equal(page.includes('lemonsqueezy'), false)
  assert.equal(page.includes('googletagmanager') || page.includes('google-analytics') || page.includes('gtag('), false)
})

test('FAQPage JSON-LD matches the visible questions', () => {
  const faqs = visibleFaqs(page)
  const json = JSON.parse(page.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/)[1])
  assert.equal(json['@type'], 'FAQPage')
  assert.equal(json.mainEntity.length, faqs.length)
  json.mainEntity.forEach((entry, index) => {
    assert.equal(entry.name, faqs[index].q)
    assert.equal(entry.acceptedAnswer.text.replace(/\s+/g, ' ').trim(), faqs[index].a)
  })
})

test('claim page uses the in-app copy and has no analytics', () => {
  assert.match(claim, /You're in\. Here's your key\./)
  assert.match(claim, /I have a key/)
  assert.match(claim, /Checking the payment with Stripe/)
  assert.match(claim, /I can't match this checkout to a paid order/)
  assert.equal(claim.includes('googletagmanager') || claim.includes('gtag('), false)
  assert.match(claim, /noindex/)
})
