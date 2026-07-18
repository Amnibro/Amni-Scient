# Checklist — Amni-Weather v1.0.0

**Date:** 2026-07-17  
**Goal:** Ship Amni-Weather as a meteoblue-class interactive weather map on amni-scient-site (Three.js + WASM + WGSL/GLSL field shaders, customizable coloration, zoom, multi-layer).

## Sequential tasks

- [x] Scan architecture_map.md
- [x] Guardian council convened
- [x] Scaffold `weather/` app + `weather/wasm` crate
- [x] Rust/WASM: field IDW, smooth, colormaps, meteo derived vars, units
- [x] Frontend: Three.js globe/map, pan/zoom, layer stack, palette UI
- [x] Open-Meteo live fetch + offline synthetic demo fields
- [x] Point probe + hourly scrubber + geocode search
- [x] Product page `amni-weather.html`
- [x] Privacy page `privacy-weather.html`
- [x] Wire nav / hero wheel / sitemap / changelog / architecture_map
- [x] wasm-pack build release → `weather/pkg` (v1.0.0 OK)
- [x] Smoke-test WASM in Node (render/idw/stats)
- [x] Static server serves app + pkg + marketing pages (port 4173)
- [ ] User confirms working in browser

## Files

| Path | Role |
|------|------|
| `weather/index.html` | App shell |
| `weather/style.css` | HUD / glass UI |
| `weather/app.js` | Three.js map + data + WASM bridge |
| `weather/shaders/field.wgsl` | WebGPU field colorizer (source) |
| `weather/shaders/field.frag.glsl` | WebGL2 fragment path |
| `weather/wasm/` | Rust crate source |
| `weather/pkg/` | Built wasm-bindgen package |
| `amni-weather.html` | Marketing / SEO |
| `privacy-weather.html` | Privacy disclosure |
