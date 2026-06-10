# Architecture Map — amni-scient.com

> ## ⚠️ ACTIVE NOTICE TO THE CONCURRENT LEARN-CONTENT LOOP (read me first — 2026-05-31, v5.8.0)
> As of v5.8.0 the Amni-Learn app was **de-inlined**. The ~7.36 MB `<script>` that used to live inside `learn/index.html` (game engine + ALL quiz/fact banks) now lives in **`learn/learn-app.js`**.
> - **Add/lift quiz banks in `learn/learn-app.js`** — NOT in `learn/index.html`. The inline `<script>` is gone; `learn/index.html` only has `<script src="learn-app.js" defer></script>`. **Do NOT re-inline it.**
> - Keep your existing pattern otherwise: bump `learn/sw.js` `CACHE` (currently `amni-learn-v1011`) when you change `learn-app.js` so users get fresh content. `learn-app.js` is already in the SW `PRECACHE`.
> - **Do NOT re-add AdSense** to `amni-{calc,explore,haven,learn,llm}.html`, `explore/index.html`, or `learn/index.html` — ads were intentionally removed (AdSense block remediation). Ads stay ONLY on `calc/*.html` and `learn/*.html` article pages.
> - Versioning: `v5.8.0` is this ad/de-inline branch. Your learn lifts can keep their own sequence — just don't undo the bullet points above. After any `learn-app.js` change, re-run `node --check learn/learn-app.js`.

## v5.10.0 Amni-Learn ⚔️ ADVENTURE MODE (2026-06-09)
- New RPG layer over the quiz content; classic mode untouched/default. `#adv-btn` (⚔️ QUEST, top-bar) toggles `#adventure-view` (registered first in `views{}`); all UI JS-rendered into `#adv-root`; styles injected once as `#adv-css`.
- Module lives at the END of `learn/learn-app.js` (`ADV_THEME`…`advToggle`): `advTier()` picks 6 region subjects per grade band; `advPool()` reuses `quizData` with walk-down level fallback; battles = answer-as-attack (combo damage), `advWin/advLose`; state in localStorage `adv-state` {xp,coins,hero,prog}; quadratic level curve `advLvl()`.
- Test hook: `window.__advT` (only when sessionStorage `adv-test`='1'). Harness: `learn/tests/layout/advcheck.js` (gitignored), 16 checks + screenshots. v5.9.0 also added TTS default-off + `#tts-btn` mute + vendored Piper HD voice under `learn/vendor/` (importmap in index.html head).

## v5.8.103 Amni-Learn quiz/animals/zoom fixes (2026-06-08, found via post-interaction testing)
- **Quiz answer overflow (blocker):** explanation + "Next ▶" appended to `#quiz-task-area` (overflow:hidden, centered) → long explanation clipped Next out of reach. Fixed: `#quiz-task-area{justify-content:flex-start;overflow-y:auto}` + the Next button is now `position:sticky;bottom:6px` (always visible). LESSON: the screenshot harness only captured INITIAL module state — post-answer/post-interaction states need a separate probe (`/tmp/qprobe.js` pattern).
- **L1 animals TTS/non-animal sounds:** `playAnimalSound()` plays `assets/audio/<animal>.mp3`; `speakText` routes ~35 allow-listed sound-words to it, else falls to TTS. L1 animals had grown to include animals with no mp3 (Cricket/Dolphin/Goose/Hummingbird/Bat/Penguin/Hyena/Whale/Kookaburra) → TTS said the word. Fixed: removed the 9 no-asset entries + added `squeak→mouse/growl→bear/scream→fox` mappings. RULE for future animal entries: audioText MUST be in the `speakText` allow-list AND map to an existing mp3, else it TTSs. Verify with `learn/tests/layout/_animalcheck.js`.
- **Double-tap-zoom trap:** added `touch-action:manipulation` on `html,body,#app,.view,.top-bar` (kills accidental double-tap zoom, keeps pinch).
- SW `v1199 → v1200`. Details in `changelog.md` 5.8.103.

## v5.8.102 Amni-Learn Layout-Respect Overhaul (2026-06-08)
- **Problem:** modules didn't respect card/viewport borders on phones; boards fell out of the window / resized per round; top bar crowded. Built `learn/tests/layout/harness.js` (puppeteer-core + Edge) — drives **every** `.game-btn` (life subgames + quiz subjects, ~124 modules) at landscape 880×412 + portrait 412×880, measures window- & card-overflow (excludes intentional `overflow-x:auto` swipe lanes like `.teach-cards`/`.piano-wrap`), screenshots each to `shots*/`.
- **Core fix is two helpers in `learn-app.js`** (defined after `showFeedback`): `_boardCell(n,maxCell,gap,pad)` sizes board cells from the live card width (replaced 5 hardcoded `Math.floor(380/n)`-style calcs); `_fitToCard()` is a universal backstop — a MutationObserver on `#app` + resize/orientation hooks scale ANY board/grid/arena that exceeds its card and re-fit on every round/rotate. New board/arena games should size from `_boardCell`/the card, never `vw`/`innerWidth`/a constant.
- Non-celebration toasts use `_toast()` (bottom pill `#mini-toast`), not the full-screen `#feedback` celebration. `.retro-hud` wraps; `#music-view .piano-wrap` is id-scoped to beat the universal `.view *` max-width clamp. Top bar hardened ≤560/≤380; short-landscape shrink at `max-height:520px`.
- **Verified:** harness re-run both orientations = 124/124 each, 0 window-overflow, 0 card-overflow. SW CACHE `v1198 → v1199`. Plan/council in `docs/`. Backups `backups/*.v5.8.102.bak`. Details in `changelog.md` 5.8.102.

## v5.8.53–v5.8.100 Amni-Learn Arcade Expansion + Hardening (overnight /loop, 2026-06-01→02)
- **7 new arcade games** in `learn/learn-app.js` (Destress Arcade band, level 7): 🌻 Garden Grower (idle), 🔴 Connect Four, ⚫ Reversi, 🚢 Battleship, 🟤 Mancala (vs-AI board), 🎨 Color Hunt (perception), 🎲 Pig (push-your-luck dice). Each wired as: `data-game` button (+pink NEW badge) → `#X-view` div → `views` registry → dispatcher `if(game==='X')initX()` → `initX()`. New "♟️ Strategy & Board" destress-cat category; Color Hunt filed under Casual Puzzles. Anthony's named examples (Tower Defense `tdgame`, Cookie Clicker, Auto Miner) were already deep — NOT rebuilt; DON'T re-add the 7 above.
- **Achievements** — now 80 (all unique). Every score-tracking arcade game has one (added Breakout/Invaders/Pong/Pipes/Pull-the-Pin/Fill-the-Cup/Bejeweled + the 7 new games). Modal + strip sort unlocked-first.
- **Reliability** (systematic leak/robustness audit — all classes swept): fixed missing `@keyframes pulse` (golden bonuses static); Net Debug rAF loop ran forever after exit; Word Search + Reaction Lab accumulated window/document listeners per open; 4 unguarded `JSON.parse(localStorage)` sites; Vacuum/Matching/Dishes auto-restart `setTimeout` re-created orphan timers after exit; profile-name escaped before stats-title innerHTML.
- **A11y** — full keyboard support across every interactive game (Connect Four 1–7, Mancala 1–6, Pig R/B, Reversi/Battleship/Color Hunt Tab+Enter via `_kbd`, idle clickers' main button + upgrade buys via `_kbd`). TTS completion added to the 4 life-skills games (Vacuum/Dishes/Clock/Money) + Matching; pre-K visual-fun pops (Count It / Pet Care / Same-Diff).
- **Verification** — invariant tests in `learn/tests/` (`mancala_engine_test`, `board_games_logic_test`, `battleship_engine_test`); full regression gate green. SW CACHE at `amni-learn-v1198`. Continuity: memory `project_amni_learn_arcade_loop.md`. Committed as Amnibro; details in `changelog.md` 5.8.53–5.8.100.

## v5.8.0 AdSense Round 4 — Ad Placement + Learn De-inline
- **Trigger** — site blocked from serving ads again (4th AdSense action; prior: v3.5.0/v4.3.0 "Low value content", v5.5.0 "Thin content/doorway"). Diagnosis on a now content-rich site: ads were placed on promotional product pages + interactive app canvases (low/no reader-facing content), and `learn/index.html` shipped a 7.36 MB inline app script.
- **Ad policy (new rule)** — AdSense serves ONLY on genuine article pages: `calc/*.html` (32 explainers) and `learn/*.html` (11 category guides). All `amni-*.html` product landing pages and the `explore/index.html` + `learn/index.html` app canvases are now ad-free. `ads.txt`/`app-ads.txt` unchanged. Removed head loader + `<ins>` units from all 7; explore keeps its Ko-fi promo (non-ad).
- **learn/index.html de-inline** — the single inline `<script>` (game engine + quiz banks, ~7.36 MB) moved to `learn/learn-app.js`, loaded via `<script src="learn-app.js" defer>`. Crawled HTML 7.36 MB → 197 KB. SW (`learn/sw.js`) now precaches `./learn-app.js`; CACHE bumped v1010→v1011. SW registration code lives in learn-app.js now (behavior unchanged; defer runs post-parse). **Quiz/bank content edits must now target `learn/learn-app.js`, not the inline script.**
- **Step 2 done — template lockstep broken** — both SEO generators (`src/gen-calc-modules.js`, `src/gen-learn-categories.js`) now have a deterministic `pick(x,k)` helper: each of the 5 section headings + the deep-dive hint draws from 4–6 variants keyed by a stable hash of the page slug (regen-stable). Regenerated all 31 calc + 11 learn pages; bodies unchanged; ads preserved on article pages. **If you edit these generators, keep the `pick()` helper and the `HV`/`LV` variant maps.**
- **Pending** — Step 3: content-first restructure (make the site read content-first rather than catalog-first) — deferred per Anthony.
- **Backups** — `backups/v5.8.0_adsense/`. Plan: `docs/checklists/checklist_v5.8.0_adsense_round4.md`.

## v5.6.0 Amni-Learn Full Module Audit (in progress)
- **Plan** — `docs/checklists/checklist_v5.6.0_learn_module_audit.md`. Three-pass audit of ~60 learn modules: Pass 0 (cross-cutting framework), Pass 1 (per-module diagnosis), Pass 2 (fixes batched by priority P0-P3), Pass 3 (verification).
- **Audience map (canonical)** — L1 = Pre-K/early-K (4-6); L2 = elementary (7-9); L3 = teens (10-15); L4 = young adult (16-22); L5 = adult (22+). Used to grade vocab, mechanics, and pacing in every module.
- **Cross-cutting issues being worked** — shared playable-area CSS contract, shared drag-drop helper (Pass 0 candidate; first inlined in Sorting Hat), quiz pedagogy contract (every kid quiz needs `explain` cards w/ "Next ▶" — partially done in v5.4.0 college quizzes), step-by-step teaching mode for math/word modules, redundancy decisions (Math Basics vs Speed Math; Anagrams vs Word Scramble; Card Pairs vs Matching; Reflex Racer vs Reaction Time), Android wrapper sync workflow.
- **Batch 1 (this push)** — Card Pairs polish, Sudoku highlight rewrite, Reflex Racer pacing rebalance, Math Mountain removed, Word Scramble re-shuffle fix, Sorting Hat drag-drop rewrite. Android wrapper file mirrored from site source-of-truth (drifted since 2026-04-29).
- **Backups** — `backups/v5.6.0_pre_audit/` for pre-audit snapshot.

## v5.5.0 AdSense Doorway Remediation (Calc SEO Pages)
- **Trigger** — Google AdSense manual action: "Thin content with little or no added value." Diagnosed root cause: `calc/<module>.html` (31 pages) and `learn/<category>.html` (11 pages) were generator-emitted cookie-cutter shells with ~250 unique words each and identical section skeletons — textbook doorway-page pattern under Google's spam policy.
- **Generator: `src/gen-calc-modules.js`** — extended each module entry in the `M[]` array with a `deep[]` field of typed sub-blocks (`worked` / `procedure` / `pitfalls` / `physics` / `standards_detail` / `faq` / `table`). Added `renderDeep(m)` helper that emits a collapsed-by-default `<details class="deep-dive">` block between WHEN TO USE and RELATED MODULES sections. Variation comes from per-module choice of which sub-blocks to include, the order they appear, and module-specific `deepTitle`.
- **Schema.org structured data** — `FAQPage` JSON-LD auto-emitted from `deep[].type==='faq'` items for any module that has FAQ. Helps Google reclassify pages as instructional rather than promotional.
- **CSS additions** (in-page `<style>`) — `.deep-dive`, `.deep-block`, `.step-list`, `.pitfall-list`, `.faq-q`, `.deep-tbl`, `.tbl-note`. Collapsed-by-default `<details>` with chevron-less expansion via `::-webkit-details-marker{display:none}`.
- **Per-module content scope** — 31 modules with substantive deep content:
  - Mechanical (12): stress, sections, bolts, springs, seals, columns, shafts, welds, bearings, gears, fatigue, vibration — full treatment (worked + procedure + pitfalls + physics + faq, with table where useful).
  - Fluids/Thermal (8): fluids, pumps, thermal, hx, pv, cycles, hvac, combustion — full treatment.
  - Electrical/Chemistry (5): electrical, motors, nec, echem, battery — full treatment.
  - Reference (6): materials, finishes, math, equations, units, refs — lighter treatment focused on quick-reference tables + pitfalls + FAQ since these are inherently index pages.
- **Page word count** — pre-fix: ~280 unique words per page. Post-fix: 728 (equations index) to 1506 (bolts), median ~1200. All pages above doorway threshold.
- **UX preservation** — calc-first journey intact: hero + CTA + bullet sections remain on top, deep content sits in collapsed `<details>` below. Googlebot indexes the content; users opt-in by clicking expand.
- **Learn SEO pages (v5.5.1, 2026-05-15)** — same deep-content treatment applied to `src/gen-learn-categories.js`. 11 categories now have lesson plans, age milestones, pitfalls, FAQ. Page size 16&ndash;20 KB / 939&ndash;1222 words each. Backups at `backups/v5.5.0_learn_seo/`.
- **Reconsideration submission** — both calc and learn SEO landing pages now have substantive unique content; site ready for AdSense manual-action reconsideration request via Search Console.
- **Backups** — `backups/v5.5.0_calc_seo/` (calc) and `backups/v5.5.0_learn_seo/` (learn).

## v5.8.124 Amni-Learn higher-level layout verification
- Layout harness (`learn/tests/layout/harness.js`) now takes a `LEVEL` env var (was hardcoded `?level=1`) so games that scale their grid by `currentLevel` (Matching, Math, life chores) can be stress-tested at their biggest board. Found + fixed Matching portrait overflow at L3: `.m-card` switched from fixed `width:clamp()` to `width:100%;max-width:100px;aspect-ratio:5/6` so it fills its `1fr` grid track at any column count. Theme sweep harness: `learn/tests/layout/themesweep.js` (20 themes, accent/border/contrast checks).

## v5.8.122 Amni-Learn per-level curation (`_glv` grade-band filter)
- `learn/learn-app.js` (~line 103): added `_glv` map (general-pool game key → allowed level digits) + a filter pass for `currentLevel<=5` that hides any `.game-btn` whose key isn't allowed at the current grade band. Key = `data-game` + optional `:data-subgame`/`:data-subject` (e.g. `life:hanoi`, `quiz:history`, `circuitlab`). Levels 6/7/8 still swap to their own `.brain-cat`/`.destress-cat`/`.college-cat` sets and are untouched by the filter. The existing line-104 empty-category sweep collapses any band left with no visible buttons. Fixes the prior state where L1/L2/L3 were near-identical and L4(MIDDLE)/L5(STEM) were identical full-library dumps. Per-level menu probe: `learn/tests/layout/menuprobe2.js` (screenshots to `menus2/`).

## v5.4.0 Amni-Learn theme + UX + neutral content sweep
- `learn/sw.js` cache bumped `amni-learn-v1` → `amni-learn-v2` so users on stale cached pre-e78ee19 HTML pick up the views-map fix (was the real cause of "storybooks / 2048 / cblast / solitaire / tdgame display no content").
- `learn/index.html`: post-level-filter sweep hides any `.game-category` with no visible `.game-btn` children — kills the empty Life Skills band at PRE-K and is robust against future per-level filters.
- `css/style.css`: added `body.theme-learn` accent (`#2ecc71`, dim/glow/scanlines + light variant `#1e8449`). Class was already on every learn marketing/SEO page but undefined.
- 11 learn SEO landing pages + `amni-learn.html`: inline `#2ecc71` swapped to `var(--accent)` so they inherit the theme cleanly.
- Mobile top-bar fix: `#level-btn .btn-label` re-shown under the `<720px` media query — Lv N stays visible on phones.
- Flappy Jump rebalance: GRAV 0.13→0.085, FLAP -3.8→-3.2, vel-cap 4→3, GAP 160→185 (min 150), PIPE_DX 220→240, SPD 0.9→0.75. Fall ~35% slower, wider corridor.
- Subject-quiz `loadQuestion` now requires reading an explanation card and clicking "Next ▶" before advancing — same flow college quizzes already had. 112 `explain` fields bulk-added across animals/music/languages/science L1–L3 for actual teaching.
- AI Ethics Debug levels rewritten **Data Leakage / Spurious Correlation / Privacy Breach** (same UI, neutral ML-engineering framing) — replaces prior race/gender-proxy framings.

## Structure
```
amni-scient-site/
├── css/style.css                 # Shared CSS (dark/light themes, 6 accent variants)
├── index.html                    # Homepage
├── amni-{haven,crypt,ai,core,explore,calc,learn,browse,connect,code,prayer,llm}.html  # 12 product landing pages (Crypt/AI/Core noindex; LLM added in v5.0.0/v5.1.0 nav)
├── about.html                    # Studio info / developer bio (AdSense OK)
├── faq.html                      # ~22 FAQ entries across all 11 products, Schema.org FAQPage (AdSense OK)
├── terms.html                    # MULTI-PRODUCT HUB (v5.1.0): General Terms G1-G9 + 12 per-product addenda (#crypt #haven #llm #explore #learn #calc #prayer #browse #code #connect #ai #core)
├── privacy.html                  # Privacy hub — 12 product cards
├── privacy-{ai,browse,calc,code,connect,core,crypt,explore,haven,learn,llm,prayer}.html  # Per-product privacy policies (4 added in v5.1.0: llm, learn, calc, prayer)
├── changelog.md                  # Version history
├── ads.txt, app-ads.txt          # AdSense authorized sellers (pub-8345487545441889)
├── sitemap.xml                   # 62 canonical URLs (v5.1.0 — added amni-llm.html and lib/amni-llm/)
├── robots.txt                    # Allow-list with explicit disallows for /src, /backups, dev artifacts
├── .env                          # Credentials (gitignored)
├── src/                          # Gitignored sources
│   ├── calc/index.html           # Amni-Calc source (obfuscate.js -> calc/index.html)
│   ├── learn/index.html          # Stale starter (do NOT build — see memory)
│   ├── gen-calc-modules.js       # v4.4.0 generator → emits 31 calc/<module>.html SEO pages
│   └── gen-learn-categories.js   # v4.4.0 generator → emits 11 learn/<category>.html SEO pages
├── calc/index.html               # Deployed Amni-Calc app (obfuscated build + engineering assistant overlay)
├── calc/<module>.html × 31       # SEO landing pages (v4.4.0): theory + equations + when-to-use + standards
├── learn/index.html              # Deployed Amni-Learn app (hand-maintained source-of-truth)
├── learn/<category>.html × 11    # SEO landing pages (v4.4.0): category overview + pedagogy + game roster
├── research/*.html × 8           # Research deep-dives (NOTE: currently noindex — see v4.4.0 changelog)
└── img/                          # Product screenshots
```

## v5.3.0-5.3.4 Amni-Calc Deep Feature Batch (calc-fixes.js extensions)
- **v5.3.0**: Mohr's circle Plotly (replaces canvas), section snap-resolution selector (0.01/0.1/1/10/100 mm), vibration SHOCK PULSE card with SRS chart (4 pulse shapes), NEC ampacity Plotly chart (21 sizes × 3 temps).
- **v5.3.1**: Electrical phasor diagram (Plotly), TRANSFORMER SIZING (FLA/SCC/Z_pu), motor torque-speed curves (NEMA A/B/C/D), NEMA frame lookup, heat transfer fin efficiency curve.
- **v5.3.2**: Pump real curves (9 OEM models — Goulds/Grundfos/Sulzer/KSB/Crane) vs system curve with operating point. Pressure vessels: head thickness (4 types per UG-32), nozzle reinforcement (UG-37), lifting lug (B30.20). Welds: electrode selection (6 base materials × 4 processes), deposition rate (5 processes), AWS D1.1 prequalified joints.
- **v5.3.3**: 3D involute gear generator with Three.js viewer. 5 types (spur/helical/herringbone/internal/rack). STL export (ASCII, drops into Cura/PrusaSlicer). JSON specs export.
- **v5.3.4**: Fluids 2D CFD via Lattice Boltzmann (D2Q9 BGK, ~400×120 grid). 5 obstacles (cylinder/square/airfoil/cavity/custom-clickable). 4 visualizations (velocity magnitude / vorticity / u_x / density).
- File state: `calc/calc-fixes.js` is now ~131 KB, 2223 lines.

## v5.2.0 Amni-Calc Comprehensive Overhaul (calc-fixes.js layer)
- New override layer `calc/calc-fixes.js` (loaded LAST after calc-overrides.js and calc-3d.js). Re-implements broken/missing handlers from the obfuscated module + adds universal patches.
- **Beams**: re-implemented `solveBeam` (simply-supported + cantilever, point/distributed/moment loads). Typed-support input row + `#p-shear`/`#p-moment`/`#p-deflection` Plotly containers. Auto-seeds default 3 m beam.
- **Sections**: 11 preset shapes with live-compute. Outputs A, I, S, Z, r, J, centroids.
- **Bolts**: 13-grade table (SAE/ISO/A325/A490/A307/316SS) + 31-size table (#6-32 → 1.5" UNC + M3 → M36). Live-compute, color-coded outputs.
- **Springs**: 5 type-gated preset libraries. Almen-Laszlo / Shigley+Wahl / bending. Series/parallel combiner. F-δ chart with ideal-range overlay. Compressed-vs-free anim. Forces 3D update.
- **Plotly middleware** `patchPlotly()` — wraps `Plotly.react`/`newPlot` so every chart gets theme-aware colors regardless of which helper rendered it.
- **`drawSealDiagram` override** — now reads `pTheme()` per call.
- **CSS rule** `.view .split { flex-direction: row }` — universal inputs-left layout.
- **Theme-flip MutationObserver** — re-layouts Plotly + re-fires canvas redraws on `[data-theme]` flip.
- **`universalLiveCompute()`** — scans every `.view` for `calc*|solve*|apply*|draw*` button onclicks, wires all inputs to fire them on change (220 ms debounce), hides redundant compute buttons. Single function covers all 30+ modules at once.
- Backups: `backups/v5.2.0_calc/{index.html,calc-overrides.js,calc-3d.js}.bak`.

## v4.5.0 Amni-Calc Live Compute + Real 3D (Three.js)
- `calc/calc-overrides.js` adds `setupLiveCompute()` to its init: walks every `<button[onclick^="calc"]>`, attaches debounced (260 ms) input/change listeners to sibling inputs/selects in the same `.card`, hides the button, and fires once on mount + on tab activation. MutationObserver re-binds when overrides inject late inputs.
- `calc/calc-3d.js` (new): loads `three@0.149.0` + `OrbitControls` UMD from jsDelivr. Generic `makeViewer(canvas)` produces scene/camera/renderer/orbit/lights/grid/axes. `MODS` registry holds 18 module scene definitions; each has `params()` (read inputs), `build(group, params)` (re-mesh), optional `tick(group)` (per-frame animation). `injectCanvas(key)` adds a `<canvas id="d-<key>">` into the right pane of each applicable `.split`. Public `window.calc3DUpdate(key)` is called by the live-compute layer after each calc.
- 18 modules with 3D: stress, sections, bolts, springs, seals, columns, shafts, welds, bearings, gears, vibration, fluids, pumps, thermal, hx, pv, battery, motors. Reference and 2D-natural modules (cycles, hvac, combustion, electrical, nec, echem, fatigue, materials, finishes, math, equations, units, refs) get live compute only.
- Three.js loaded once per session from CDN (~600 KB); subsequent loads from browser cache. No build step; calc/index.html adds `<script src="./calc-3d.js" defer></script>` after overrides.

## v4.4.0 SEO Landing-Page System
- 31 calc/<module>.html and 11 learn/<category>.html generated by Node scripts in `src/`. Source-of-truth is the data array in each generator; HTML is the build artifact (committed).
- Each calc page includes: hero with CTA to `/calc/#tab-<module>`, theory paragraph, equation block, use-case paragraph, standards list, 4-card related-modules grid, AdSense banner, Ko-fi support.
- Each learn page includes: hero with age tag and CTA to `/learn/`, category overview, pedagogical basis, game-card roster, 3-card related-categories grid, AdSense banner.
- All new pages are indexable (no noindex) and listed in sitemap.xml.
- Outstanding noindex+ads conflict on amni-explore.html and amni-ai.html — see v4.4.0 changelog for follow-up decision.

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
