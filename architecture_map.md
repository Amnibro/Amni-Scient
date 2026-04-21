# Architecture Map — amni-scient.com

## Structure
```
amni-scient-site/
├── css/style.css                 # Shared CSS (dark/light themes, 6 accent variants)
├── index.html                    # Homepage
├── amni-{haven,crypt,ai,core,explore,calc,learn}.html  # Product pages
├── about.html                    # Studio info / developer bio (AdSense OK)
├── faq.html                      # ~20 FAQ entries, Schema.org FAQPage (AdSense OK)
├── privacy*.html, terms.html     # Legal pages (no AdSense)
├── changelog.md                  # Version history
├── ads.txt, app-ads.txt          # AdSense authorized sellers (pub-8345487545441889)
├── .env                          # Credentials (gitignored)
├── src/                          # Gitignored sources
│   ├── calc/index.html           # Amni-Calc source (obfuscate.js -> calc/index.html)
│   └── learn/index.html          # Stale starter (do NOT build — see memory)
├── calc/index.html               # Deployed Amni-Calc (obfuscated build output + engineering assistant overlay)
├── learn/index.html              # Deployed Amni-Learn (hand-maintained source-of-truth)
└── img/                          # Product screenshots
```

## FC-Calc WASM Exports (lib.rs)
| Function | Parameters | Returns |
|---|---|---|
| calc_polarization | tc,pa,pc,rha,rhc,mem,al,i0r,il,np,elx | Vec<PolPt> |
| calc_stack | nc,area,id,tc,pa,pc,rha,rhc,mem,al,i0r,il,elx | StackRes |
| calc_eis | rohm,rct,cdl_uf,sw,fmin,fmax,np | Vec<EisPt> |
| calc_drt | freqs,zre,zim,nb,reg | DrtRes |
| calc_thermal | nc,area,id,tc,pa,pc,mem,cp,rho,tin,dt | ThermRes |
| calc_lcoh | cpkw,ekwh,skw,cf,yrs,dr,om,ry,rp,h2kgh | LcohRes |
| calc_degradation | tc,id,p,v0,hend,np | DegRes |
| calc_variation | nc,tc,pa,pc,id,mem,vpct,seed | VarRes |
| get_materials_db | — | Vec<MatEntry> |

## Key Constants (from original PEM_Calculator_Build)
R=8.314462618, F=96485.33212, n_e=2, E0_STD=1.229, E_TN=1.481, T0=298.15, dE_dT=-0.000845

## Theming
- CSS custom properties via [data-theme="dark"|"light"] on <html>
- 6 product accents: green(default), blue(crypt), purple(haven), orange(ai), red(core), cyan(explore), burnt-orange(calc), teal(brain-exercise for adult mind health)
- localStorage key: amni-theme
- Each page has theme toggle button in nav + inline JS for immediate application

## Amni-Calc Engineering Assistant
- `calc/index.html` now includes a floating assistant overlay that reads the active calc module, visible inputs, current outputs, and handbook content to build contextual engineering prompts.
- Local endpoint config is stored in `localStorage` under `amni-calc-ai-config`; optional WebLLM browser settings use `amni-calc-webllm`.
- Local AI probing checks both `/health` and `/v1/models` so generic OpenAI-compatible local servers work without a dedicated health route.
- When localhost is blocked by HTTPS mixed-content rules, the overlay falls back to an in-browser WebLLM model or built-in module-specific engineering guidance.
- **AI Models**: Server default `qwen3.5-2b`, browser options: Qwen3.5-0.8B/2B, Bonsai-8B-mlx-1bit, SmolLM2 variants, Llama-3.2-3B.

## Amni-Calc Module Restoration (v4.7.4)
- `calc/calc-overrides.js` is loaded with `defer` after the obfuscated orchestration. It registers all `calc*` handlers on `window` so every module button (columns, shafts, welds, bearings, pumps, combustion, motors, NEC, fatigue, thermal, echem, battery, fluids, HX, PV, cycles, HVAC, electrical, vibration, gears) computes results, writes a result-grid + interpretation note, and renders Plotly visualisations into the existing `#p-<tab>` containers.
- Bolts: `injectBoltExtras` adds a pattern selector (linear/rectangular/circular), torque-sequence canvas (cross/star, 3 passes), and an extended grade-reference card.
- Springs: `injectSpringExtras` adds a McMaster-style Belleville preset table, a series/parallel/pack stiffness combiner with deflection, a force-vs-deflection Plotly chart, and an animated 2D side view with compression slider.
- Mohr's circle: `injectMohrExtras` provides an enhanced renderer with σ-τ axes, X/Y stress points, principal-stress markers, and an analysis paragraph (σ_vM, Tresca, principal-axis rotation, FoS guidance).
- Gears: 2D involute mesh and isometric 3D canvas auto-injected into the gears tab, with SVG and PNG export buttons.
- Ko-fi panel: `#ad-tx` is populated with a Ko-fi anchor (`https://ko-fi.com/amnibro`) and shown on load (close button still works).

## v4.7.0 / v4.7.1 Amni-Calc Seal Animation Symmetric Physics
- `src/calc/index.html` `drawSealAnim`: v4.7.1 refinement — `sCy0=floorY-cordR` (ring rests on groove floor at rest) and in-loop `sCy=Math.max((cmp+floorY)/2, floorY-cordR)` so the centroid stays on the floor until the face engages (~18.75% squeeze) then transitions to the midplane between compression face and groove floor. v4.7.0 originally pinned to `(cmp+floorY)/2` unconditionally; that anchored the ring mid-groove at rest and caused a new top-not-touching regression which v4.7.1 fixes. The pre-v4.7.0 bug was `floorY-cordR-1` with a `preY` dilation about `yBot`, which gave all-top-crush asymmetry.
- Replaced one-shot 20-iter solve with progressive compression: `Nsteps=8` squeeze increments, `itersPer=6` PBD iters each (48 iters total).
- Per-node forces: neighbor distance springs (arc-length, Mooney-Rivlin-style `lam - 1/lam^2`) + opposite-pair tethers `(i, (i+N/2)%N)` with stiffness `tethK=stiff*0.18` for cross-ring stress propagation.
- Per-iter passes: force accumulate -> position update -> centroid re-anchor to `(sCx, sCy)` -> wall-clamp -> shoelace area rescale about `(sCx, sCy)` (incompressibility).
- Stress colour uses `max(|lam^2-1/lam|, 2*|od/od_rest-1|)` so tether deviation also lights up nodes.
- Works identically for face / radial_bore / radial_piston gland types (contact walls are symmetric top/bottom).
- Custom cross-section samples polygon perimeter around `(sCx, sCy0)` where `sCy0=(gy+floorY)/2`.
- Headless verification at `tests/test_seal_physics.js`; visual OLD-vs-NEW SVG at `outputs/seal_comparison.svg`.

## v4.2.0 Adult Brain Exercise Full Overhaul
- Replaced v4.1.0 relabeled kids' games w/5 dedicated adult brain exercise engines.
- learn/index.html: new brain-section category (hidden default, shown on level=6), 5 view divs (sudoku/cardpairs/speedmath/wordsearch/logic), full CSS suite (.sdk-*/.cp-*/.spm-*/.ws-*/.lgc-* w/animated gradient BGs), 5 JS init fns w/generate/solve/render/input/scoring/timer logic.
- Games: Sudoku (9x9 backtracking gen, 3 diffs, pencil marks, keyboard, error track), Card Pairs (4 themes, 5 grids, combos, progressive), Speed Math (30s countdown, escalating ops, streak mult), Word Search (12x12, 4 topics, 8-dir, drag select), Logic Puzzles (20 teasers, MC, explanations).
- Level handler: $$all('.game-category:not(#brain-section)').forEach hide, brain-section show, title=BRAIN EXERCISE.
- Back btn cleanup: _sdkTimer/_spmTimer/_cpTimer clearInterval.

## v4.1.0 Brain Exercise Update
- Extended amni-learn.html cta-row w/level=6 adult button.
- learn/index.html: ternary level handler+dynamic cat remap for adult puzzles (sudoku/card/memory via existing views), .brain CSS, no dupe/extended only, condensed no-empty. Checklist/guardian all followed. Tested w/level=6 loads adult brain mode.
