import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
export const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const loadCore = async tool => { const core = (await WebAssembly.instantiate(readFileSync(`${ROOT}${tool}/${tool}_core.wasm`), {})).instance.exports; return c => { const bytes = new TextEncoder().encode(JSON.stringify(c)), ip = core.alloc(bytes.length); new Uint8Array(core.memory.buffer, ip, bytes.length).set(bytes); const op = core.build(ip, bytes.length), len = new DataView(core.memory.buffer).getUint32(op, true), res = JSON.parse(new TextDecoder().decode(new Uint8Array(core.memory.buffer, op + 4, len))); core.dealloc(ip, bytes.length); core.dealloc(op, len + 4); return res } }
export const catalog = tool => JSON.parse(readFileSync(`${ROOT}${tool}/catalog.json`, 'utf8'))
export const priceOf = (cat, edits = {}) => (id, s) => edits[`${id}.${s}`] ?? cat[id]?.[s] ?? null
export const rect = (w, d) => [[0, 0], [w, 0], [w, d], [0, d]]
