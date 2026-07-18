/* @ts-self-types="./amni_weather_wasm.d.ts" */

/**
 * @param {number} v_mm
 * @param {boolean} to_in
 * @returns {number}
 */
export function convert_precip(v_mm, to_in) {
    const ret = wasm.convert_precip(v_mm, to_in);
    return ret;
}

/**
 * @param {number} v_hpa
 * @param {number} unit
 * @returns {number}
 */
export function convert_pressure(v_hpa, unit) {
    const ret = wasm.convert_pressure(v_hpa, unit);
    return ret;
}

/**
 * @param {number} v_ms
 * @param {number} unit
 * @returns {number}
 */
export function convert_speed(v_ms, unit) {
    const ret = wasm.convert_speed(v_ms, unit);
    return ret;
}

/**
 * @param {number} v
 * @param {boolean} to_f
 * @returns {number}
 */
export function convert_temp(v, to_f) {
    const ret = wasm.convert_temp(v, to_f);
    return ret;
}

/**
 * @param {number} kind
 * @returns {number}
 */
export function default_palette(kind) {
    const ret = wasm.default_palette(kind);
    return ret >>> 0;
}

/**
 * @param {number} kind
 * @returns {Float32Array}
 */
export function default_range(kind) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.default_range(retptr, kind);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @param {number} t_c
 * @param {number} rh
 * @returns {number}
 */
export function dewpoint_c(t_c, rh) {
    const ret = wasm.dewpoint_c(t_c, rh);
    return ret;
}

/**
 * @param {Float32Array} values
 * @returns {Float32Array}
 */
export function field_stats(values) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(values, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.field_stats(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @param {number} t_c
 * @param {number} rh
 * @returns {number}
 */
export function heat_index_c(t_c, rh) {
    const ret = wasm.heat_index_c(t_c, rh);
    return ret;
}

/**
 * @param {Float32Array} lats
 * @param {Float32Array} lons
 * @param {Float32Array} vals
 * @param {number} gw
 * @param {number} gh
 * @param {number} lat0
 * @param {number} lat1
 * @param {number} lon0
 * @param {number} lon1
 * @param {number} power
 * @returns {Float32Array}
 */
export function idw_grid(lats, lons, vals, gw, gh, lat0, lat1, lon0, lon1, power) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(lats, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(lons, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF32ToWasm0(vals, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        wasm.idw_grid(retptr, ptr0, len0, ptr1, len1, ptr2, len2, gw, gh, lat0, lat1, lon0, lon1, power);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v4 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @returns {number}
 */
export function palette_count() {
    const ret = wasm.palette_count();
    return ret >>> 0;
}

/**
 * @param {number} id
 * @returns {string}
 */
export function palette_name(id) {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.palette_name(retptr, id);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {Float32Array} values
 * @param {number} w
 * @param {number} h
 * @param {number} vmin
 * @param {number} vmax
 * @param {number} palette_id
 * @param {boolean} reverse
 * @param {number} alpha
 * @returns {Uint8Array}
 */
export function render_field(values, w, h, vmin, vmax, palette_id, reverse, alpha) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(values, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.render_field(retptr, ptr0, len0, w, h, vmin, vmax, palette_id, reverse, alpha);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @param {Float32Array} values
 * @param {number} w
 * @param {number} h
 * @param {number} u
 * @param {number} v
 * @returns {number}
 */
export function sample_bilinear(values, w, h, u, v) {
    const ptr0 = passArrayF32ToWasm0(values, wasm.__wbindgen_export2);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.sample_bilinear(ptr0, len0, w, h, u, v);
    return ret;
}

/**
 * @param {Float32Array} values
 * @param {number} w
 * @param {number} h
 * @param {number} radius
 * @returns {Float32Array}
 */
export function smooth_box(values, w, h, radius) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(values, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.smooth_box(retptr, ptr0, len0, w, h, radius);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @param {number} kind
 * @param {number} w
 * @param {number} h
 * @param {number} t
 * @param {number} _lat0
 * @param {number} _lon0
 * @returns {Float32Array}
 */
export function synthetic_field(kind, w, h, t, _lat0, _lon0) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.synthetic_field(retptr, kind, w, h, t, _lat0, _lon0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @param {Float32Array} src
 * @param {number} sw
 * @param {number} sh
 * @param {number} dw
 * @param {number} dh
 * @returns {Float32Array}
 */
export function upsample_bilinear(src, sw, sh, dw, dh) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(src, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.upsample_bilinear(retptr, ptr0, len0, sw, sh, dw, dh);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.version(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {number} t_c
 * @param {number} wind_kmh
 * @returns {number}
 */
export function wind_chill_c(t_c, wind_kmh) {
    const ret = wasm.wind_chill_c(t_c, wind_kmh);
    return ret;
}

/**
 * @param {Float32Array} u
 * @param {Float32Array} v
 * @returns {Float32Array}
 */
export function wind_dir_deg(u, v) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(u, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(v, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        wasm.wind_dir_deg(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v3 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * @param {Float32Array} u
 * @param {Float32Array} v
 * @returns {Float32Array}
 */
export function wind_speed(u, v) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(u, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(v, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        wasm.wind_speed(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v3 = getArrayF32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export(r0, r1 * 4, 4);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
    };
    return {
        __proto__: null,
        "./amni_weather_wasm_bg.js": import0,
    };
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('amni_weather_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
