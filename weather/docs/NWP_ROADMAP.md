# Amni-Weather — Local NWP path (Reynolds / Amni GPU)

## Now (v1.1.3)
- Live: Open-Meteo with **zoom LOD** (global → synoptic → regional → meso → local). Far out = few points + core vars; zoom in = denser lattice + more vars.
- Visualization: wind streamlines + pressure striation (isobars).
- Not a full NWP yet — honest about source.

## Goal
Ship an **Amni-NWP** core that can stand next to public models for selected domains:
- Momentum / continuity with **Reynolds-stress closing** from Amni research equations
- Thermo + moisture minimal set for T, RH, precip proxies
- GPU path (ROCm / gfx1200 primary; WebGPU/WASM later for browser)

## Phased plan
1. **Field assimilator** — ingest sparse Open-Meteo / GFS open data as IC/BC (already half-done via live grids).
2. **2D shallow / barotropic kernel** — WASM+WebGPU demo for streamfunction / wind evolution on a regional plane (browser-safe).
3. **3D Reynolds-closed LES-lite** — desktop Amni-GPU (Python/Triton or Rust+HIP) offline forecast job → write NetCDF/Zarr → weather UI reads tiles.
4. **Scorecard** — MAE/RMSE vs Open-Meteo best_match + HRRR/GFS on held-out hours (same verification frame as Amni-Calc refusal rules: no invented skill).

## Wire-in points in this app
- `meteo.js` `fetchLiveBundle` — swap/augment with `nwp://` or local `/weather/nwp/latest.json`
- `wind.js` — already consumes u/v-like fields; NWP writes same layout as live extract
- `app.js` mode toggle: Live | Demo | **Amni-NWP** (future)

## Non-goals for v1 browser
- Global 0.25° ops NWP in the phone tab
- Unverified “we beat ECMWF” claims without the scorecard

When Reynolds kernels land under `special-equations/` or Amni-GPU, hook them here through a thin field export (lat/lon grid of U,V,T,P,Q).
