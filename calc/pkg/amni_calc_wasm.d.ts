/* tslint:disable */
/* eslint-disable */

export function bolt_tables(): string;

export function calc_beam(json: string): string;

export function calc_bolt(json: string): string;

export function calc_fatigue(json: string): string;

export function calc_seal(json: string): string;

export function calc_seal_groove(json: string): string;

export function calc_section(json: string): string;

export function calc_spring(json: string): string;

export function calc_stress(json: string): string;

export function calc_thermal(json: string): string;

export function convert_unit(val: number, from: string, to: string): number;

export function get_finishes(): string;

export function get_material(name: string): string;

export function get_materials(): string;

export function recommend_finishes(json: string): string;

export function seal_materials(): string;

export function seal_standard_sizes(): string;

export function section_presets(): string;

export function unit_categories(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly bolt_tables: (a: number) => void;
    readonly calc_beam: (a: number, b: number, c: number) => void;
    readonly calc_bolt: (a: number, b: number, c: number) => void;
    readonly calc_fatigue: (a: number, b: number, c: number) => void;
    readonly calc_seal: (a: number, b: number, c: number) => void;
    readonly calc_seal_groove: (a: number, b: number, c: number) => void;
    readonly calc_section: (a: number, b: number, c: number) => void;
    readonly calc_spring: (a: number, b: number, c: number) => void;
    readonly calc_stress: (a: number, b: number, c: number) => void;
    readonly calc_thermal: (a: number, b: number, c: number) => void;
    readonly convert_unit: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly get_finishes: (a: number) => void;
    readonly get_material: (a: number, b: number, c: number) => void;
    readonly get_materials: (a: number) => void;
    readonly recommend_finishes: (a: number, b: number, c: number) => void;
    readonly seal_materials: (a: number) => void;
    readonly seal_standard_sizes: (a: number) => void;
    readonly section_presets: (a: number) => void;
    readonly unit_categories: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
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
