// Starts the Helium page program (offline.amni, built to offline.wasm). In a file of its own so pages with a strict
// Content-Security-Policy, such as Amni-CAD, can load it.
import { start } from './helium.js';
start({ wasm: new URL('./offline.wasm', import.meta.url).href });
