# Guardian Council — Amni-Weather v1.0.0

**Date:** 2026-07-17  
**Question:** How do we ship a meteoblue-competitive weather map on amni-scient-site with Three.js / WASM / WGSL / Rust, interactive maps, customizable coloration, and broad weather-type coverage?

---

## Architect
**Proposal:** Split product into (1) marketing page matching site DNA and (2) fullscreen `weather/` app. Data plane: Open-Meteo (no key) for live multi-point grids; compute plane: Rust/WASM for IDW upsample + colormaps + derived indices; render plane: Three.js globe with ShaderMaterial overlay. Ship GLSL WebGL2 as default; keep WGSL sources for WebGPU path parity.

**Vote:** Live Open-Meteo grid + WASM upsample + Three.js globe

## Sentinel
**Proposal:** Privacy-first: browser-only processing, no accounts, explicit third-party (Open-Meteo + optional geocode). No API keys in repo. Offline synthetic fields so the product never bricks. Honest labeling that models come from Open-Meteo (not our own NWP).

**Vote:** Agree with Architect; mandate privacy page + offline fallback

## Scholar
**Proposal:** Cover temperature, dewpoint, feels-like, humidity, precip, snow, cloud, pressure, wind speed/dir, gust, radiation, CAPE, visibility, soil temp, UV — matching meteoblue’s “maps” breadth. Derived: heat index, wind chill in WASM with published formulas. Units SI/US toggle.

**Vote:** Broad layer catalog v1; advanced NWP diagnostics later

## Engineer
**Proposal:** Coarse lat/lon grid fetch (≤ ~80 points) via Open-Meteo multi-lat/lon, WASM bicubic/IDW to 512² texture, GPU shader for smooth color. OrbitControls zoom/pan. Palette editor: preset LUT + custom min/max + reverse. Avoid full ECMWF open-data download in v1 (hosting/CORS complexity).

**Vote:** Open-Meteo multi-point + WASM upsample (practical path)

## Pathfinder
**Proposal:** Wire into hero wheel + PROJECTS nav + sitemap now so discovery matches other products. Version as **v1.0.0**. Future: radar composite tiles, sounding profiles, route weather, offline map tiles.

**Vote:** Ship discoverable v1 on site shell immediately

---

## Majority decision (5/5 aligned)

1. **Live data:** Open-Meteo multi-point forecast (no API key).  
2. **Compute:** Rust → WASM (fields, palettes, meteo math).  
3. **Render:** Three.js interactive globe + GPU field shader; WGSL source included.  
4. **UX:** Layers, customizable coloration, zoom/pan, time scrub, search, point probe.  
5. **Site:** `amni-weather.html`, `weather/`, privacy, nav, sitemap, changelog.

**Rejected for v1:** Hosting full global model GRIB/NetCDF; paid meteoblue API clone; native desktop app.
