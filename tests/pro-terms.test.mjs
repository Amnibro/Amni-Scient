import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const terms = readFileSync(new URL('../terms.html', import.meta.url), 'utf8')

test('Construct Pro terms addendum is present and does not invent a Haven subscription', () => {
  assert.match(terms, /id="construct-pro"/)
  assert.match(terms, /not engineering certification/)
  assert.match(terms, /US\$19/)
  assert.match(terms, /US\$190/)
  assert.match(terms, /within 30 days/)
  assert.match(terms, /up to 3 devices/)
  assert.match(terms, /up to 7 days/)
  assert.match(terms, /14-day trial/)
  const havenStart = terms.indexOf('id="haven"')
  const havenEnd = terms.indexOf('id="llm"')
  assert.ok(havenStart > 0 && havenEnd > havenStart)
  const haven = terms.slice(havenStart, havenEnd)
  assert.equal(/subscription/i.test(haven), false)
  assert.match(terms, /TODO\(anthony\): lawyer review/)
  const general = terms.slice(0, terms.indexOf('id="crypt"'))
  assert.match(general, /G6\. Advertising and Subscriptions/)
})
