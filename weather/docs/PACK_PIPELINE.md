# Weather field pack
- Real bake: `node weather/tools/bake_fields_live.mjs` (or `--quick`)
- Synthetic fallback: `node weather/tools/bake_fields.mjs`
- CI: `.github/workflows/weather-pack.yml` every 6h + workflow_dispatch
- Browser loads pack only for map; pin forecast can still call Open-Meteo once
