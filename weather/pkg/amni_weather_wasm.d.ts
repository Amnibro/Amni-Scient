/* tslint:disable */
/* eslint-disable */

export function convert_precip(v_mm: number, to_in: boolean): number;

export function convert_pressure(v_hpa: number, unit: number): number;

export function convert_speed(v_ms: number, unit: number): number;

export function convert_temp(v: number, to_f: boolean): number;

export function default_palette(kind: number): number;

export function default_range(kind: number): Float32Array;

export function dewpoint_c(t_c: number, rh: number): number;

export function field_stats(values: Float32Array): Float32Array;

export function heat_index_c(t_c: number, rh: number): number;

export function idw_grid(lats: Float32Array, lons: Float32Array, vals: Float32Array, gw: number, gh: number, lat0: number, lat1: number, lon0: number, lon1: number, power: number): Float32Array;

export function palette_count(): number;

export function palette_name(id: number): string;

export function render_field(values: Float32Array, w: number, h: number, vmin: number, vmax: number, palette_id: number, reverse: boolean, alpha: number): Uint8Array;

export function sample_bilinear(values: Float32Array, w: number, h: number, u: number, v: number): number;

export function smooth_box(values: Float32Array, w: number, h: number, radius: number): Float32Array;

export function synthetic_field(kind: number, w: number, h: number, t: number, _lat0: number, _lon0: number): Float32Array;

export function upsample_bilinear(src: Float32Array, sw: number, sh: number, dw: number, dh: number): Float32Array;

export function version(): string;

export function wind_chill_c(t_c: number, wind_kmh: number): number;

export function wind_dir_deg(u: Float32Array, v: Float32Array): Float32Array;

export function wind_speed(u: Float32Array, v: Float32Array): Float32Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly convert_precip: (a: number, b: number) => number;
    readonly convert_pressure: (a: number, b: number) => number;
    readonly convert_speed: (a: number, b: number) => number;
    readonly convert_temp: (a: number, b: number) => number;
    readonly default_palette: (a: number) => number;
    readonly default_range: (a: number, b: number) => void;
    readonly dewpoint_c: (a: number, b: number) => number;
    readonly field_stats: (a: number, b: number, c: number) => void;
    readonly heat_index_c: (a: number, b: number) => number;
    readonly idw_grid: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number) => void;
    readonly palette_count: () => number;
    readonly palette_name: (a: number, b: number) => void;
    readonly render_field: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
    readonly sample_bilinear: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly smooth_box: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly synthetic_field: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly upsample_bilinear: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly version: (a: number) => void;
    readonly wind_chill_c: (a: number, b: number) => number;
    readonly wind_dir_deg: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly wind_speed: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
