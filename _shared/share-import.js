(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.AmniShareImport = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  const MAX_FRAGMENT_LENGTH = 1024 * 1024
  const MAX_DECODED_BYTES = 768 * 1024
  const MAX_VALUE_BYTES = 700 * 1024
  const SHOWCASE_KEY = 'amni.showcase.brand'

  const MODULE_DATA_KEYS = Object.freeze({
    deck: Object.freeze(['amnideck.cfg.v2', 'amnideck.prices.v1', 'amnideck.guide.v1']),
    patio: Object.freeze(['amnipatio.cfg.v1', 'amnipatio.prices.v1']),
    pool: Object.freeze(['amnipool.cfg.v1', 'amnipool.prices.v1', 'amnipool.guide.v1']),
    floor: Object.freeze(['amnifloor.cfg.v1', 'amnifloor.prices.v1', 'amnifloor.guide.v1']),
    roof: Object.freeze(['amniroof.cfg.v1', 'amniroof.prices.v1', 'amniroof.guide.v1']),
    frame: Object.freeze(['amniframe.cfg.v1', 'amniframe.prices.v1', 'amniframe.guide.v1']),
    plumb: Object.freeze(['amniplumb.cfg.v1', 'amniplumb.prices.v1', 'amniplumb.guide.v1', 'amniplumb.sketch.v2']),
    elec: Object.freeze(['amnielec.cfg.v1', 'amnielec.prices.v1', 'amnielec.guide.v1', 'amnielec.sketch.v2']),
    hvac: Object.freeze(['amnihvac.prices.v1', 'amnihvac.guide.v1', 'amnihvac.sketch.v2']),
    plan: Object.freeze(['amniplan.cfg.v1', 'amniplan.prices.v1', 'amniplan.guide.v1']),
    garden: Object.freeze(['amnigarden.cfg.v1', 'amnigarden.prices.v1', 'amnigarden.guide.v1'])
  })

  const MODULE_KEY_ALLOWLISTS = Object.freeze(Object.fromEntries(
    Object.entries(MODULE_DATA_KEYS).map(([moduleName, keys]) => [
      moduleName,
      Object.freeze([...keys, SHOWCASE_KEY])
    ])
  ))

  const CONFIG_SCHEMAS = Object.freeze({
    deck: {
      length: 'number', depth: 'number', height: 'number', spacing: 'number',
      decking: 'string', attach: 'string', foundation: 'string', joist: 'string',
      fascia: 'boolean', skirting: 'boolean', stain: 'string', house: 'string',
      mode: 'string', polygon: 'nullable-array', house_edge: 'number',
      stairs: 'array', railing: 'object', door: 'object'
    },
    patio: {
      mode: 'string', w: 'number', d: 'number', polygon: 'nullable-array',
      thickness_in: 'number', base_in: 'number', reinforce: 'string',
      finish: 'string', turndown: 'object', vehicle: 'boolean',
      joint_max_ft: 'number', house_edge: 'number', border: 'boolean',
      sleeves: 'boolean'
    },
    pool: {
      mode: 'string', w: 'number', d: 'number', polygon: 'nullable-array',
      shallow_in: 'number', deep_in: 'number', kind: 'string', finish: 'string',
      heater: 'boolean', temp_rise: 'number', house_edge: 'number'
    },
    floor: {
      mode: 'string', w: 'number', d: 'number', polygon: 'nullable-array',
      material: 'string', pattern: 'string', plank_w_in: 'number',
      plank_l_in: 'number', box_sqft: 'number', waste_pct: 'number',
      doorways: 'number'
    },
    roof: {
      mode: 'string', w: 'number', d: 'number', polygon: 'nullable-array',
      pitch: 'number', material: 'string', roof_type: 'string',
      overhang_in: 'number', house_edge: 'number'
    },
    frame: {
      mode: 'string', w: 'number', d: 'number', polygon: 'nullable-array',
      wall_height_ft: 'number', spacing: 'number', stud_size: 'string',
      doors: 'number', windows: 'number', door_w: 'number', window_w: 'number',
      double_top_plate: 'boolean', sheathing: 'boolean', house_edge: 'number'
    },
    plumb: {
      w: 'number', d: 'number', toilets: 'number', lavs: 'number',
      tubs: 'number', showers: 'number', kitchen_sinks: 'number',
      dishwashers: 'number', washers: 'number', water_heater: 'boolean',
      pipe_material: 'string'
    },
    elec: {
      sqft: 'number', bedrooms: 'number', bathrooms: 'number',
      has_laundry: 'boolean', electric_range: 'number', electric_dryer: 'number',
      water_heater_elec: 'boolean', dishwasher: 'boolean', disposal: 'boolean',
      microwave: 'boolean', hvac_amps: 'number'
    },
    plan: {
      w: 'number', d: 'number', house_edge: 'number', rooms: 'array'
    },
    garden: {
      soil_depth_in: 'number', beds: 'array'
    }
  })

  class ShareImportError extends Error {
    constructor(code, message) {
      super(message)
      this.name = 'ShareImportError'
      this.code = code
    }
  }

  const fail = (code, message) => { throw new ShareImportError(code, message) }
  const isPlainObject = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
  }
  const safePropertyName = key => (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= 100 &&
    key !== '__proto__' &&
    key !== 'prototype' &&
    key !== 'constructor'
  )
  const byteLength = value => {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length
    if (typeof Buffer !== 'undefined') return Buffer.byteLength(value, 'utf8')
    return unescape(encodeURIComponent(value)).length
  }

  function validateTree(value, depth, budget) {
    if (budget.count++ > 5000) return false
    if (depth > 7) return false
    if (value === null || typeof value === 'boolean') return true
    if (typeof value === 'number') return Number.isFinite(value) && Math.abs(value) <= 100000000
    if (typeof value === 'string') return value.length <= 4096
    if (Array.isArray(value)) {
      return value.length <= 1000 && value.every(item => validateTree(item, depth + 1, budget))
    }
    if (!isPlainObject(value)) return false
    const entries = Object.entries(value)
    return entries.length <= 200 &&
      entries.every(([key, item]) => safePropertyName(key) && validateTree(item, depth + 1, budget))
  }

  function matchesType(value, expected) {
    if (expected === 'number') return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1000000
    if (expected === 'string') return typeof value === 'string' && value.length <= 100
    if (expected === 'boolean') return typeof value === 'boolean'
    if (expected === 'object') return isPlainObject(value)
    if (expected === 'array') return Array.isArray(value)
    if (expected === 'nullable-array') return value === null || Array.isArray(value)
    return false
  }

  function validateConfig(moduleName, value) {
    const schema = CONFIG_SCHEMAS[moduleName]
    if (!schema || !isPlainObject(value)) return false
    const entries = Object.entries(value)
    if (!entries.length || entries.length > Object.keys(schema).length) return false
    if (!entries.every(([key, item]) => (
      Object.prototype.hasOwnProperty.call(schema, key) &&
      matchesType(item, schema[key])
    ))) return false
    return validateTree(value, 0, { count: 0 })
  }

  function validatePrices(value) {
    if (!isPlainObject(value)) return false
    const entries = Object.entries(value)
    if (entries.length > 1000) return false
    return entries.every(([key, amount]) => (
      /^[A-Za-z0-9_.:-]{1,100}$/.test(key) &&
      typeof amount === 'number' &&
      Number.isFinite(amount) &&
      amount >= 0 &&
      amount <= 10000000
    ))
  }

  function validateGuide(value) {
    if (!isPlainObject(value)) return false
    const entries = Object.entries(value)
    return entries.length <= 500 && entries.every(([key, checked]) => (
      /^[A-Za-z0-9_.:-]{1,100}$/.test(key) && typeof checked === 'boolean'
    ))
  }

  function validateSketch(value) {
    if (!isPlainObject(value)) return false
    const allowed = new Set([
      'nodes', 'runs', 'scalePxPerFt', 'seq', 'bgImage',
      'floorH', 'ceilH', 'vpVert', 'floorCal'
    ])
    if (!Object.keys(value).every(key => allowed.has(key))) return false
    if (!Array.isArray(value.nodes) || !Array.isArray(value.runs)) return false
    if (value.nodes.length > 500 || value.runs.length > 1000) return false
    if (value.bgImage != null && (
      typeof value.bgImage !== 'string' ||
      value.bgImage.length > 512 * 1024 ||
      !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value.bgImage)
    )) return false
    return validateTree(value, 0, { count: 0 })
  }

  function validateShowcase(value, moduleName) {
    if (!isPlainObject(value)) return false
    const allowed = new Set(['n', 'p', 'w', 'm', 'ts'])
    if (!Object.keys(value).every(key => allowed.has(key))) return false
    if (value.m !== moduleName) return false
    if (!Number.isFinite(value.ts) || value.ts < 0) return false
    return ['n', 'p', 'w'].every(key => (
      value[key] == null || (typeof value[key] === 'string' && value[key].length <= 500)
    ))
  }

  function keyKind(key) {
    if (/\.cfg\.v\d+$/.test(key)) return 'config'
    if (/\.prices\.v\d+$/.test(key)) return 'prices'
    if (/\.guide\.v\d+$/.test(key)) return 'guide'
    if (/\.sketch\.v\d+$/.test(key)) return 'sketch'
    return ''
  }

  function validateStorageValue(moduleName, key, rawValue) {
    if (typeof rawValue !== 'string') return false
    if (byteLength(rawValue) > MAX_VALUE_BYTES) return false
    let value
    try {
      value = JSON.parse(rawValue)
    } catch (error) {
      return false
    }
    if (key === SHOWCASE_KEY) return validateShowcase(value, moduleName)
    const kind = keyKind(key)
    if (kind === 'config') return validateConfig(moduleName, value)
    if (kind === 'prices') return validatePrices(value)
    if (kind === 'guide') return validateGuide(value)
    if (kind === 'sketch') return validateSketch(value)
    return false
  }

  function decodeUtf8(binary) {
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    if (typeof TextDecoder !== 'undefined') {
      try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } catch (error) {
        fail('invalid-utf8', 'The shared design contains invalid text encoding.')
      }
    }
    try {
      let escaped = ''
      for (let i = 0; i < bytes.length; i++) escaped += '%' + bytes[i].toString(16).padStart(2, '0')
      return decodeURIComponent(escaped)
    } catch (error) {
      fail('invalid-utf8', 'The shared design contains invalid text encoding.')
    }
  }

  function decodePayload(encoded, atobImpl) {
    if (typeof encoded !== 'string' || !encoded.length) fail('empty', 'The shared design is empty.')
    if (encoded.length > MAX_FRAGMENT_LENGTH) fail('too-large', 'The shared design is too large to import safely.')
    if (encoded.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
      fail('invalid-base64', 'The shared design link is not valid Base64.')
    }
    const decode = atobImpl || (typeof atob === 'function' ? atob : null)
    if (!decode) fail('unsupported', 'This browser cannot decode shared designs.')
    let binary
    try {
      binary = decode(encoded)
    } catch (error) {
      fail('invalid-base64', 'The shared design link could not be decoded.')
    }
    if (binary.length > MAX_DECODED_BYTES) fail('too-large', 'The shared design is too large to import safely.')
    let payload
    try {
      payload = JSON.parse(decodeUtf8(binary))
    } catch (error) {
      if (error instanceof ShareImportError) throw error
      fail('invalid-json', 'The shared design does not contain valid JSON.')
    }
    return payload
  }

  function validatePayload(moduleName, payload) {
    const allowlist = MODULE_KEY_ALLOWLISTS[moduleName]
    if (!allowlist) fail('unknown-module', 'This editor is not allowed to import shared data.')
    if (!isPlainObject(payload)) fail('invalid-shape', 'The shared design must be a data object.')
    const entries = Object.entries(payload)
    if (!entries.length || entries.length > allowlist.length) {
      fail('invalid-shape', 'The shared design has an invalid number of entries.')
    }
    const allowed = new Set(allowlist)
    const validated = {}
    for (const [key, value] of entries) {
      if (!allowed.has(key)) fail('disallowed-key', 'The shared design contains storage keys that are not allowed for this editor.')
      if (!validateStorageValue(moduleName, key, value)) {
        fail('invalid-value', 'The shared design contains malformed or unsafe editor data.')
      }
      validated[key] = value
    }
    return validated
  }

  function applyValidated(storage, entries) {
    if (!storage || typeof storage.setItem !== 'function') fail('storage-unavailable', 'Local project storage is unavailable.')
    const prior = new Map()
    try {
      for (const key of Object.keys(entries)) prior.set(key, storage.getItem(key))
      for (const [key, value] of Object.entries(entries)) storage.setItem(key, value)
    } catch (error) {
      for (const [key, value] of prior) {
        try {
          value === null ? storage.removeItem(key) : storage.setItem(key, value)
        } catch (rollbackError) {}
      }
      fail('storage-failed', 'The shared design could not be saved in this browser.')
    }
  }

  function clearShareHash(locationLike, historyLike) {
    if (!historyLike || typeof historyLike.replaceState !== 'function') return
    try {
      historyLike.replaceState(null, '', locationLike.pathname + locationLike.search)
    } catch (error) {}
  }

  function announceError(message, documentLike) {
    if (!documentLike) return
    const show = () => {
      if (!documentLike.body || documentLike.getElementById('amni-share-error')) return
      const notice = documentLike.createElement('div')
      notice.id = 'amni-share-error'
      notice.setAttribute('role', 'alert')
      notice.textContent = message + ' Your existing project was not changed.'
      notice.style.cssText = 'position:fixed;z-index:10000;left:50%;top:12px;transform:translateX(-50%);max-width:min(620px,calc(100% - 24px));padding:10px 14px;border:1px solid #d66;border-radius:8px;background:#271417;color:#fff;font:600 13px/1.45 system-ui,sans-serif;box-shadow:0 10px 30px #0008'
      documentLike.body.appendChild(notice)
    }
    if (documentLike.body) show()
    else documentLike.addEventListener('DOMContentLoaded', show, { once: true })
  }

  function restoreFromLocation(moduleName, options) {
    const opts = options || {}
    const locationLike = opts.location || (typeof location !== 'undefined' ? location : null)
    const historyLike = opts.history || (typeof history !== 'undefined' ? history : null)
    const storage = opts.storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    const documentLike = opts.document || (typeof document !== 'undefined' ? document : null)
    if (!locationLike || typeof locationLike.hash !== 'string' || !locationLike.hash.startsWith('#share=')) {
      return { status: 'none', keys: [] }
    }
    const encoded = locationLike.hash.slice(7)
    try {
      const payload = decodePayload(encoded, opts.atob)
      const entries = validatePayload(moduleName, payload)
      applyValidated(storage, entries)
      clearShareHash(locationLike, historyLike)
      return { status: 'imported', keys: Object.keys(entries) }
    } catch (error) {
      clearShareHash(locationLike, historyLike)
      const safeError = error instanceof ShareImportError
        ? error
        : new ShareImportError('unexpected', 'The shared design could not be imported safely.')
      announceError(safeError.message, documentLike)
      return { status: 'error', keys: [], error: safeError }
    }
  }

  function encodePayload(payload, btoaImpl) {
    const json = JSON.stringify(payload)
    if (byteLength(json) > MAX_DECODED_BYTES) fail('too-large', 'The design is too large to share safely.')
    const bytes = typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(json)
      : Uint8Array.from(unescape(encodeURIComponent(json)), char => char.charCodeAt(0))
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
    }
    const encode = btoaImpl || (typeof btoa === 'function' ? btoa : null)
    if (!encode) fail('unsupported', 'This browser cannot create shared designs.')
    const encoded = encode(binary)
    if (encoded.length > MAX_FRAGMENT_LENGTH) fail('too-large', 'The design is too large to share safely.')
    return encoded
  }

  function collectShareData(moduleName, storage) {
    const keys = MODULE_DATA_KEYS[moduleName]
    if (!keys) fail('unknown-module', 'This editor is not allowed to share data.')
    const data = {}
    for (const key of keys) {
      const value = storage.getItem(key)
      if (value === null) continue
      if (!validateStorageValue(moduleName, key, value)) {
        fail('invalid-value', 'Saved editor data is malformed and cannot be shared safely.')
      }
      data[key] = value
    }
    return data
  }

  return Object.freeze({
    MAX_FRAGMENT_LENGTH,
    MAX_DECODED_BYTES,
    MAX_VALUE_BYTES,
    MODULE_KEY_ALLOWLISTS,
    ShareImportError,
    collectShareData,
    decodePayload,
    encodePayload,
    restoreFromLocation,
    validatePayload
  })
})
