# Amni-Weather v1.0.0

Interactive multi-layer weather maps for amni-scient.com.

## Run

Serve the **site root** (or this folder) over HTTP — ES modules + WASM require a server:

```bat
cd amni-scient-site
npx --yes serve -p 4173
```

Open `http://localhost:4173/weather/` or the product page `http://localhost:4173/amni-weather.html`.

## Rebuild WASM

```bat
cd weather\wasm
wasm-pack build --target web --release --out-dir ..\pkg
```

## Stack

| Piece | Role |
|-------|------|
| `app.js` | Three.js globe, UI, Open-Meteo fetch, WASM bridge |
| `pkg/` | `amni_weather_wasm` (wasm-bindgen) |
| `wasm/src/lib.rs` | IDW, smooth, upsample, palettes, meteo math |
| `shaders/` | WGSL + GLSL field colorizer sources |

## Modes

- **Live** — multi-point Open-Meteo forecast (no API key)
- **Demo** — synthetic fields from WASM (works offline)
