const test = require('node:test')
const assert = require('node:assert/strict')
require('../_shared/share-import.js')
const {
  MAX_FRAGMENT_LENGTH,
  MODULE_KEY_ALLOWLISTS,
  collectShareData,
  encodePayload,
  restoreFromLocation,
  validatePayload
} = globalThis.AmniShareImport

const btoaImpl = value => Buffer.from(value, 'latin1').toString('base64')
const atobImpl = value => Buffer.from(value, 'base64').toString('latin1')

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed))
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(String(key), String(value)),
    removeItem: key => data.delete(key),
    snapshot: () => Object.fromEntries(data)
  }
}

function restore(moduleName, payload, storage = memoryStorage()) {
  const encoded = typeof payload === 'string' ? payload : encodePayload(payload, btoaImpl)
  const location = { hash: '#share=' + encoded, pathname: '/' + moduleName + '/', search: '' }
  const replaced = []
  const result = restoreFromLocation(moduleName, {
    location,
    history: { replaceState: (...args) => replaced.push(args) },
    storage,
    document: null,
    atob: atobImpl
  })
  return { result, storage, replaced }
}

const VALID_CONFIGS = {
  deck: { length: 12, stairs: [], railing: { front: false } },
  patio: { w: 14, vehicle: false },
  pool: { w: 16, heater: false },
  floor: { w: 12, material: 'lvp' },
  roof: { w: 40, pitch: 6 },
  frame: { w: 40, sheathing: true },
  plumb: { w: 40, water_heater: true },
  elec: { sqft: 1800, dishwasher: true },
  plan: { w: 40, rooms: [] },
  garden: { soil_depth_in: 10, beds: [] }
}

test('all eleven modules expose exact allowlists without license state', () => {
  assert.equal(Object.keys(MODULE_KEY_ALLOWLISTS).length, 11)
  for (const [moduleName, keys] of Object.entries(MODULE_KEY_ALLOWLISTS)) {
    assert.ok(keys.length >= 3 || moduleName === 'patio')
    assert.ok(!keys.includes('amni.pro.v1'))
    assert.ok(keys.every(key => !/^amni\.pro(?:\.|$)/.test(key)))
  }
})

test('each module accepts its own validated editor data', () => {
  for (const [moduleName, keys] of Object.entries(MODULE_KEY_ALLOWLISTS)) {
    const configKey = keys.find(key => key.includes('.cfg.'))
    const pricesKey = keys.find(key => key.includes('.prices.'))
    const payload = configKey
      ? { [configKey]: JSON.stringify(VALID_CONFIGS[moduleName]) }
      : { [pricesKey]: JSON.stringify({ 'duct.hd': 12.5 }) }
    const { result, storage } = restore(moduleName, payload)
    assert.equal(result.status, 'imported', moduleName)
    assert.deepEqual(storage.snapshot(), payload, moduleName)
  }
})

test('a cross-module key rejects the complete import', () => {
  const storage = memoryStorage({ 'amnideck.cfg.v2': '{"length":10}' })
  const payload = {
    'amnideck.cfg.v2': '{"length":20}',
    'amnipatio.cfg.v1': '{"w":14}'
  }
  const { result } = restore('deck', payload, storage)
  assert.equal(result.status, 'error')
  assert.equal(result.error.code, 'disallowed-key')
  assert.deepEqual(storage.snapshot(), { 'amnideck.cfg.v2': '{"length":10}' })
})

test('license and subscription state can never be written by a share link', () => {
  const storage = memoryStorage({ 'amni.pro.v1': '{"key":"existing"}' })
  const payload = {
    'amnideck.cfg.v2': '{"length":20}',
    'amni.pro.v1': '{"key":"AMNI-PRO-FAKE0-FAKE0","trialStart":1}'
  }
  const { result } = restore('deck', payload, storage)
  assert.equal(result.status, 'error')
  assert.equal(result.error.code, 'disallowed-key')
  assert.deepEqual(storage.snapshot(), { 'amni.pro.v1': '{"key":"existing"}' })
})

test('malformed config shape is rejected before any write', () => {
  const storage = memoryStorage({ 'amnideck.cfg.v2': '{"length":10}' })
  const payload = {
    'amnideck.cfg.v2': JSON.stringify({ length: 'huge', unexpected: true }),
    'amnideck.prices.v1': JSON.stringify({ 'board.hd': 9.99 })
  }
  const { result } = restore('deck', payload, storage)
  assert.equal(result.status, 'error')
  assert.equal(result.error.code, 'invalid-value')
  assert.deepEqual(storage.snapshot(), { 'amnideck.cfg.v2': '{"length":10}' })
})

test('price, guide, and sketch shapes are bounded and typed', () => {
  assert.throws(() => validatePayload('pool', {
    'amnipool.prices.v1': JSON.stringify({ board: 'free' })
  }), error => error.code === 'invalid-value')
  assert.throws(() => validatePayload('pool', {
    'amnipool.guide.v1': JSON.stringify({ '0:0': 'yes' })
  }), error => error.code === 'invalid-value')
  assert.throws(() => validatePayload('hvac', {
    'amnihvac.sketch.v2': JSON.stringify({ nodes: {}, runs: [] })
  }), error => error.code === 'invalid-value')
})

test('showcase branding is allowed only for the current module', () => {
  const valid = {
    'amnideck.cfg.v2': '{"length":12}',
    'amni.showcase.brand': JSON.stringify({ n: 'Builder', p: '', w: '', m: 'deck', ts: 10 })
  }
  assert.deepEqual(Object.keys(validatePayload('deck', valid)), Object.keys(valid))
  assert.throws(() => validatePayload('deck', {
    'amni.showcase.brand': JSON.stringify({ n: 'Builder', m: 'patio', ts: 10 })
  }), error => error.code === 'invalid-value')
})

test('malformed Base64 and oversized fragments fail safely and clear the hash', () => {
  const malformed = restore('deck', '%%%not-base64%%%')
  assert.equal(malformed.result.status, 'error')
  assert.equal(malformed.result.error.code, 'invalid-base64')
  assert.equal(malformed.replaced.length, 1)

  const location = {
    hash: '#share=' + 'A'.repeat(MAX_FRAGMENT_LENGTH + 1),
    pathname: '/deck/',
    search: '?x=1'
  }
  const replaced = []
  const result = restoreFromLocation('deck', {
    location,
    history: { replaceState: (...args) => replaced.push(args) },
    storage: memoryStorage(),
    document: null,
    atob: atobImpl
  })
  assert.equal(result.status, 'error')
  assert.equal(result.error.code, 'too-large')
  assert.deepEqual(replaced[0], [null, '', '/deck/?x=1'])
})

test('invalid UTF-8 is rejected without changing storage', () => {
  const encoded = Buffer.from([0xff, 0xfe, 0xfd]).toString('base64')
  const storage = memoryStorage({ keep: 'yes' })
  const { result } = restore('deck', encoded, storage)
  assert.equal(result.status, 'error')
  assert.equal(result.error.code, 'invalid-utf8')
  assert.deepEqual(storage.snapshot(), { keep: 'yes' })
})

test('storage failures roll back earlier writes', () => {
  const data = new Map([['amnideck.cfg.v2', '{"length":10}']])
  let writes = 0
  const storage = {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => {
      writes++
      if (writes === 2) throw new Error('quota')
      data.set(key, value)
    },
    removeItem: key => data.delete(key)
  }
  const payload = {
    'amnideck.cfg.v2': '{"length":20}',
    'amnideck.prices.v1': '{"board.hd":8}'
  }
  const { result } = restore('deck', payload, storage)
  assert.equal(result.status, 'error')
  assert.equal(result.error.code, 'storage-failed')
  assert.equal(data.get('amnideck.cfg.v2'), '{"length":10}')
  assert.equal(data.has('amnideck.prices.v1'), false)
})

test('share collection uses the same allowlist and validation', () => {
  const storage = memoryStorage({
    'amnideck.cfg.v2': '{"length":12}',
    'amnipatio.cfg.v1': '{"w":14}',
    'amni.pro.v1': '{"key":"secret"}'
  })
  assert.deepEqual(collectShareData('deck', storage), {
    'amnideck.cfg.v2': '{"length":12}'
  })
})
