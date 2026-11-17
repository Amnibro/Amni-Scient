import { start } from '/offline-app/helium.js';
start({ wasm: new URL('./map.wasm', import.meta.url).href });
