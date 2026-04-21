# Changelog 

## [4.7.6] - 2026-04-21 - Superior AI Models Update

### Changed
- **AI Models** — Major upgrade to superior smaller/efficient models based on latest benchmarks:
  - Server default: `qwen3.5-9b` → `qwen3.5-2b` (better performance-to-size ratio, multimodal)
  - Browser models: Added Qwen3.5-0.8B (ultra-light), Qwen3.5-2B (balanced), Bonsai-8B-mlx-1bit (efficient 1-bit quantization)
  - Removed outdated Qwen2.5 and Llama-3.2-1B models
  - Added size indicators (~MB/GB) for better user guidance
  - Prayer page: Updated from `qwen3.5-122b` to `qwen3.5-2b` default

### Files Touched
- `amni-scient-site/calc/index.html`
- `amni-scient-site/prayer/index.html` 
- `amni-scient-site/prayer/main.js`
- `amni-scient-site/changelog.md`
- `amni-scient-site/architecture_map.md`
- `backups/calc_index_v1.1.0.bak`
- `backups/prayer_index_v1.1.0.bak`

## [4.7.5] - 2026-04-21 - AI Model Updates

### Changed
- **AI Models** — Updated default and browser models across amni-calc and amni-prayer:
  - Server default: `qwen3.5-122b` → `qwen3.5-9b` (more recent, better efficiency)
  - Browser models: Added Qwen2.5-3B, upgraded Llama-3.2-1B → 3B, kept Qwen2.5-0.5B fallback
  - Prayer page: Added Qwen2.5-3B option for high-performance in-browser use

### Files Touched
- `amni-scient-site/calc/index.html`
- `amni-scient-site/prayer/index.html`
- `amni-scient-site/changelog.md`
- `amni-scient-site/architecture_map.md`

## [4.7.4] - 2026-04-21 - Amni-Calc Module Restoration & Visual Upgrades

### Added
- **calc/calc-overrides.js** — New tail-loaded script restoring/extending every previously inert handler: `calcColumn`, `calcShaftTorsion`, `calcCritSpeed`, `calcKey`, `calcWeld`, `calcWeldGroup`, `calcBearing`, `calcPumpPwr`, `calcNPSH`, `calcAffinity`, `calcSpecSpeed`, `calcAFR`, `calcFlameTemp`, `calcLHV`, `calcSync`, `calcMotorT`, `calcFLA`, `calcSF`, `calcNEC`, `calcVDrop`, `calcFatigue`, `calcThermalCond/Conv/Rad/Fin`, `calcNernst`, `calcTafel`, `calcButlerVolmer`, `calcCorrosionRate`, `calcFaraday`, `calcPack`, `calcRuntime`, `calcPeukert`, `calcSOC`, `calcMoody`, `calcBernoulli`, `calcReynolds`, `calcLMTD`, `calcNTU`, `calcThinWall`, `calcLame`, `calcASME`, `calcCarnot`, `calcOtto`, `calcDiesel`, `calcBrayton`, `calcCOP`, `calcPsych`, `calcCoolLoad`, `calcDuct`, `calcOhm`, `calcACPower`, `calc3PH`, `calcDrop`, `calcTimeConst`, `calcNatFreq`, `calcIsolator`, `calcResonance`, `calcGearGeom`, `calcGearRatio`, `calcLewis`. Each writes structured `result-grid` output, engineering-interpretation notes, and Plotly visualisations (Moody, Goodman, ε-NTU, Tafel, T-N, system curves, etc.) into the existing chart containers.
- **Bolts** — Pattern selector (linear / rectangular / circular), cross/star torque-sequence renderer with 3-pass guidance, additional grade reference card (SAE J429, ASTM A325/A490, ISO 898-1, A2-70/A4-80).
- **Springs** — McMaster-style Belleville preset list, series/parallel/pack stiffness combiner with deflection, force-vs-deflection Plotly chart, animated 2D side view with compress slider.
- **Mohr's circle** — Enhanced renderer with σ-τ axes, diameter line through (σx,τxy) and (σy,−τxy), principal-stress markers (σ1, σ2, τmax), σ_vM and Tresca, plus engineer interpretation paragraph.
- **Gears** — 2D involute mesh canvas, isometric 3D shaded canvas, SVG and PNG export buttons.
- **Ko-fi sponsor panel** — `#ad-tx` panel populated with Ko-fi link (`https://ko-fi.com/amnibro`) and made visible.

### Changed
- **calc/index.html** — Added `<script src="./calc-overrides.js" defer></script>` before `</body>`. No other markup or styles modified; obfuscated orchestration left untouched, overrides simply attach to `window` after load.

### Files Touched
- `amni-scient-site/calc/index.html`
- `amni-scient-site/calc/calc-overrides.js` (new)
- `amni-scient-site/changelog.md`
- `amni-scient-site/architecture_map.md`

## [4.7.3] - 2026-04-21 - Amni-Calc Engineering Assistant Overlay

### Added
- **calc/index.html** — Added a floating Engineering Assistant overlay to the deployed calc page. The assistant grounds its replies in the active module, visible inputs, current outputs, table rows, and handbook text instead of acting like a generic chat box.
- **Local AI wiring** — Added Prayer-style local model support with persisted endpoint settings (`amni-calc-ai-config`) for OpenAI-compatible servers such as Amni-Ai at `http://localhost:7700`. Endpoint reachability now probes both `/health` and `/v1/models` so servers without a health route still work.
- **In-browser fallback** — Added optional WebLLM loading (`amni-calc-webllm`) with progress UI, auto-load support, and on-device inference for cases where localhost is unreachable or mixed-content blocked.
- **Built-in guidance path** — Added module-aware fallback guidance for mechanical, thermal, electrical, chemistry, and reference tabs so the assistant still provides useful engineering help when no model is connected.

### Notes
- The integration is isolated to new UI, styles, and a separate tail script on `calc/index.html`; the obfuscated WASM calculator orchestration was not modified.
- HTTPS deployments still cannot call plain HTTP localhost because of browser mixed-content rules. The assistant surfaces that state clearly and falls back to browser or built-in guidance.

### Files Touched
- `calc/index.html` — assistant UI, local endpoint setup, WebLLM fallback, active-module context extraction.
- `architecture_map.md` — documented the calc assistant architecture.
- `changelog.md` — this entry.

## [4.7.2] - 2026-04-17 - Calc theory-refs scoped + Learn mobile playable area

### Fixed
- **calc/index.html** — `section.theory-refs` was rendered outside the `.view` containers (directly inside `.wrap`, below the view switcher), so the full "Theory, Formulas & Standards Referenced" grid stacked at the bottom of every module tab. Fix is CSS-only: `.theory-refs{display:none}` by default, then `body:has(#v-refs.active) .theory-refs{display:block}` so the theory block only renders on the Refs & Standards tab. Uses `:has()` — supported in all evergreen browsers (Chrome 105+, Safari 15.4+, Firefox 121+).
- **learn/index.html** — Mobile game arenas used `vh` (e.g. `.rfx-arena` height `clamp(300px,55vh,550px)`, `.mtn-canvas` 55vh, `.rxt-zone` 45vh, `.mot-arena`/`.pv-ring` `min(90vw,65vh,...)`) — on mobile Safari/Chrome, `100vh` includes the browser-chrome area, so arenas rendered taller than the visible viewport and pushed Reset/Next/Home controls off-screen. Added `@media (max-width:768px)` block: arenas switch to `dvh` and cap at `calc(100dvh - 180px)` so 180px is reserved for the sticky control row. `.view` gets `padding-bottom: calc(180px + 12px)` so canvas content can't slide under the sticky bar. Control buttons (`.tracing-controls`, `.life-controls`, `.cs-controls`, `.sdk-controls`, `.back-btn`, `.fs-btn`) get `min-height:48px; min-width:48px` for toddler-friendly tap targets; font bumped to `clamp(0.95rem,3vw,1.1rem)`.

## [4.7.1] - 2026-04-17 - Amni-Calc Seal Animation Floor-Rest Initial State

### Fixed
- **Top face not contacting ring at low/mid squeeze.** After the v4.7.0 rewrite pinned the centroid to `(gy+floorY)/2`, the ring sat floating in the middle of the groove at rest, which meant the progressive compression pass had to translate the whole cloud 7.5 px downward before the floor even engaged. At moderate squeeze the centroid re-anchor + clamp feedback produced bottom-first contact with zero nodes against the moving face — visible as `CONTACT: 29/64 (▲0 ▼11)` in the browser at 39% squeeze, the exact opposite of the v4.6.0 bug. Root cause was the rest position, not the solver.
- Changed `sCy0` from `(gy+floorY)/2` to `floorY-cordR` so the ring starts physically resting on the groove floor — that's how a real face seal sits before the mating face descends.
- Changed in-loop `sCy` from `(cmp+floorY)/2` to `Math.max((cmp+floorY)/2, floorY-cordR)`. Below ~18.75% squeeze (where the face has not yet reached the top of the un-deformed ring), the centroid stays on the floor-rest position. Above that threshold, the midplane rule takes over and compression is symmetric — both walls are equally active.

### Verified
- `tests/test_seal_physics.js` updated to match: at shore=65 circle, squeeze=0-15% gives `top=0 bot=3` (ring rests on floor, no face contact — correct), squeeze=20% gives first face contact `top=7 bot=5`, squeeze=22.9% gives `top=9 bot=7`, squeeze=39% gives `top=17 bot=15`, squeeze=50% gives `top=21 bot=19`. Top/bottom contact counts now within 2 nodes of each other whenever the face is engaged, centroid offset stays under 0.005 px, area preserved >= 99.5% across the full squeeze range.
- `tests/fixtures/seal_comparison_v4.7.1.svg` + `outputs/seal_comparison.svg` rendered at 10 / 22.9 / 39% squeeze to show the floor-rest -> symmetric-contact transition visually.
- `npm run build` re-run; obfuscated `calc/index.html` regenerated (544,018 chars).

### Files Touched
- `src/calc/index.html` — two tokens: `sCy0=floorY-cordR`, `sCy=Math.max((cmp+floorY)/2,floorY-cordR)`.
- `tests/test_seal_physics.js` — matching two tokens + expanded squeeze sweep incl. 0-15% rest region.
- `tests/fixtures/seal_comparison_v4.7.1.svg` — new visual.
- `outputs/seal_comparison.svg` — updated workspace copy.
- `calc/index.html` — rebuilt.
- `architecture_map.md` — updated v4.7.0 section with the floor-rest amendment.
- `changelog.md` — this entry.

## [4.7.0] - 2026-04-17 - Amni-Calc Seal Animation Symmetric Physics Fix

### Fixed
- **`drawSealAnim` top/bottom asymmetry.** O-ring cross-section rendered top-heavy: the compression face crushed the top nodes while the groove floor held the bottom nodes in their rest arc. Root cause was three-fold in `src/calc/index.html`: (1) seal centroid anchored at `sCy=gy+gH-cordR-1` (one radius above the floor) instead of the gland midplane; (2) pre-compression transform `preY=py=>yBot-(yBot-py)*(1-sq*0.92)` dilated vertical distances about `yBot` (the floor), so the top collapsed while the bottom stayed put; (3) solver ran a single 20-iteration pass at the target squeeze so the asymmetric initial guess locked in. Now `sCy=(cmp+floorY)/2` — the centroid sits on the midplane between the moving compression face and the fixed groove floor at every squeeze level — and the solver steps squeeze from 0 -> target in `Nsteps=8` increments with `itersPer=6` position-based dynamics iterations per step (48 iters total, up from 20).

### Added
- **Cross-ring opposite-pair tethers.** Each node `i` is now coupled to its antipode `(i+N/2)%N` by a soft linear spring (`tethK=stiff*0.18`). Neighbor distance springs already handled arc-length preservation; the tethers propagate stress across the ring so that a contact force on one side is visible in the stress colouring of the opposite side — satisfying the "stresses between all nodes" requirement without the O(N^2) cost of a full all-pair network.
- **Per-iteration centroid re-anchor.** After force integration the mean node position is computed and the whole node cloud is translated so the centroid sits exactly on `(sCx, sCy)`. This prevents the slow drift that would otherwise accumulate over 48 iterations and guarantees the origin-in-centre invariant the user asked for.
- **Area-projection centre is now the midplane.** Shoelace area rescale pivots about `(sCx, sCy)` instead of the instantaneous mean — small change, but it means the incompressibility correction is symmetric with respect to the same origin as the rest of the solve.
- **Stress colour uses max of neighbour stretch and tether deviation.** `n.s = max(|lam^2 - 1/lam|, 2*|od/od_rest - 1|)`, so compression-induced ovalisation lights up nodes on both axes, not just those with compressed arc length.
- **Headless verification harness** at `tests/test_seal_physics.js` — simulates the solver for `circle`, `quad`, and `x_ring` cross-sections at squeeze = 0, 5, 10, 15, 22.9, 30, 40% and prints top/bottom contact counts, centroid offset from midplane, and area ratio. At 40% squeeze, circle gives top=17 / bot=15 (<=2 node asymmetry from 64-node quantisation), centroid within 0.004 px of midplane, area preserved to 99.74%.
- **Visual comparison render** at `outputs/seal_comparison.svg` — OLD vs NEW rendered at 10% / 22.9% / 35% squeeze. Makes the asymmetry regression obvious at a glance for anyone reviewing the diff.

### Notes
- Edit is scoped to `drawSealAnim` in `src/calc/index.html`. The Rust `calc_seal` WASM entry point is unchanged; this was always a pure-JS visualisation bug. Re-run `npm run build` to regenerate the obfuscated `calc/index.html`.
- Radial bore / radial piston gland types route through the same solver with the same symmetric contact walls, so the fix applies to all three gland geometries.
- Custom cross-section mode (polygon from `sealCustomVerts`) is sampled around `(sCx, sCy0)` where `sCy0 = (gy+floorY)/2`, so custom shapes also spawn on the midplane.
- Backup: `backups/src_calc_index_v4.6.0_pre_symmetric_seal.bak`. Checklist: `checklist_v4.7.0_seal_symmetric_physics.md`. Guardian council: `docs/guardian_councils/guardian_council_seal_symmetric_physics.md`.

### Files Touched
- `src/calc/index.html` — `drawSealAnim` rewrite (lines ~1319-1384).
- `tests/test_seal_physics.js` — new headless harness.
- `backups/src_calc_index_v4.6.0_pre_symmetric_seal.bak` — pre-edit snapshot (126,966 bytes).
- `checklist_v4.7.0_seal_symmetric_physics.md` — change checklist.
- `docs/guardian_councils/guardian_council_seal_symmetric_physics.md` — 5-guardian decision log.
- `architecture_map.md` — updated with symmetric-physics note.
- `changelog.md` — this entry.

## [4.6.0] - 2026-04-17 - Amni-Learn AdSense Compliance (thin content + ad space)

### Added
- Async AdSense head loader on `learn/index.html` (`client=ca-pub-8345487545441889`, `crossorigin="anonymous"`, `data-overlays="false"`) &mdash; matches the compliant pattern already used by `calc/index.html`.
- Meta description for SEO discoverability.
- Substantive `<footer class="learn-footer">` describing what Amni-Learn is, what subjects it covers, the eight age-tiered levels (pre-K through adult brain training), how it runs (on-device, no signups), and who curates the content. Addresses Google's "thin content" rejection reason.
- Single compliant ad slot inside `<aside class="disc-ad" aria-label="Sponsored">` with an explicit "Sponsored" tag &mdash; the only `<ins class="adsbygoogle">` on the page (slot `1720203631`). Addresses "no ad space present."
- Footer navigation linking to Amni-Learn product page, About, FAQ, Privacy, Terms, and home.
- Footer CSS (dark aesthetic matching the game grid, responsive grid layout, 500px-breakpoint adjustments).

### Notes
- Edited `learn/index.html` directly. `npm run build` is still off-limits for learn &mdash; `src/learn/index.html` remains a stale 16-game starter; building would wipe the 60-game set (see `aa9cf3f`).
- No JS game code was touched; the ftfy-damaged apostrophes-after-subscript-two hazard stays avoided.
- Backup saved to `backups/learn_index_v4.4.0_adsense.bak` (pre-edit, 564603 bytes).

### Files Touched
- `learn/index.html` &mdash; head loader + meta description + footer CSS + footer HTML with one ad slot.
- `changelog.md` &mdash; this entry.

## [4.5.1] - 2026-04-16 - Amni-Calc Bug Punch-List (11 bugs; source re-aligned to deployed)

### Fixed (numerical correctness)
- **Bug 1** &mdash; Spring coil-diameter unit conversion used wire-diameter factor (`*du`) instead of coil-diameter factor (`*Du`). In-case `D` is in mm the defect was silent; in `in` it scaled coils by 25.4&times; wire ratio. Now correctly uses `Du`.
- **Bug 2** &mdash; Distributed-load magnitude dropdown was hardcoded to `N` for all three load kinds. Now swaps options on `change` event: `kN/N/lbf/kip` for point, `N/mm,kN/m,N/m,lbf/in` for distributed, `N\u00b7mm,N\u00b7m,kN\u00b7m,lbf\u00b7in,lbf\u00b7ft` for moment. Label relabels `INTENSITY`/`MOMENT`/`MAGNITUDE` to match.
- **Bug 3** &mdash; Distributed-load end-position ignored unit selector. Now `end_pos = endRaw * toMM[ld-end-u]`; defaults to beam length when blank.
- **Bug 4** &mdash; Bolt shear-load field was hardcoded to N. Added `<select id="bl-shear-u">` with N/kN/lbf/kip and applied `toN[]` factor in the handler.
- **Bug 5** &mdash; Stress tab yield/ultimate strength fields lacked unit dropdowns; inputs assumed MPa. Added `MPa/GPa/ksi/psi` selects on both, with `toPA[]` conversion to Pa before WASM call.
- **Bugs 9 + 10** &mdash; `solveBeam` had dead conversion code using `rawLen`/mixed units. Rewritten to convert stored mm/N/N·mm to WASM SI (m, N, N/m, N·m) cleanly.

### Fixed (UX / display)
- **Bugs 6 + 7** &mdash; Support and load tag lists displayed bare numbers without units; now render with current length-unit suffix for supports and proper unit suffixes for each load kind (N, N/mm, N·mm).
- **Bug 8** &mdash; CP-1252 &rarr; UTF-8 mojibake throughout the script (Greek letters &sigma;/&tau;/&theta;, sub/super-scripts I&#8321;/I&#8322;, degree signs, &times;, en-dashes). Ran `ftfy` over the source, then manually patched 4 residual lone-`\xe2`/`\xcf` sequences that ftfy could not disambiguate (I&#8322; label and three &tau; labels).
- **Bug 11** &mdash; Bug-report email body and footer both hardcoded `v2.1.0`; bumped to `v4.5.1`.

### Added (source re-alignment)
- The v4.5.0 SEO + A11y + monetization work had been applied directly to the *deployed* `calc/index.html`. The build pipeline (`obfuscate.js`) only rewrites the `<script type="module">` body, so head/body markup edits on the deployed file would survive **exactly once**. This release mirrors all v4.5.0 edits back into `src/calc/index.html` so future `npm run build` invocations regenerate the deployed file correctly: full `<head>` rewrite (meta, OG/Twitter, schema.org JSON-LD, manifest link, inline SVG favicon, AdSense head script), accessibility CSS (focus-visible, sr-only, skip-link, `#wasm-loading`, `.calc-ad-slot`, `.disc-ad`), skip-link + noscript in body, disclaimer as `role="dialog"` with aria-modal/labelledby/describedby + inline `<aside class="disc-ad">` AdSense slot, WASM loading indicator, inline non-module `<script>` with disclaimer-localStorage/Esc/WASM-detection/tab keyboard nav, 11 tabs with `role="tab"`+`aria-controls`+`aria-selected`+`tabindex`, 11 view divs with `role="tabpanel"`+`aria-labelledby`, 7 canvases with `aria-label`+`role="img"`.

### Removed
- Dormant `initAds`/`adEl`/`adSlot` popup-ad JS and matching `<div id="ad-tx">` shell from `src/calc/index.html`. The v4.5.0 release dropped it from the deployed file; this release drops it from source so it does not return on next build. `#ad-tx` CSS retained (unused but harmless, and matches deployed).

### Files Touched
- `src/calc/index.html` &mdash; full A11y/SEO mirror, 11 bug fixes, mojibake repair, ad-popup removal, version bump.
- `calc/index.html` &mdash; regenerated by `npm run build` from the above.
- `changelog.md` &mdash; this entry.

## [4.5.0] - 2026-04-16 - Amni-Calc Quality Pass (SEO + A11y + UX + Monetization)

### Added (SEO / discoverability)
- Full `<head>` rewrite on `calc/index.html`: keywords, author, theme-color, OG/Twitter cards, canonical URL, schema.org `WebApplication` JSON-LD with `EngineeringApplication` category and `featureList` enumerating all 8 calculator types. Page was previously crawlable but had only `<title>` + `<meta name="description">`.
- PWA manifest at `calc/manifest.webmanifest` (standalone display, scoped to `/calc/`, brand-orange theme, inline SVG icons).
- Inline SVG favicon.

### Added (accessibility)
- Real WAI-ARIA tablist: 11 tab buttons got `role="tab"`, `aria-controls`, `aria-selected`, managed `tabindex`. 11 view containers got `role="tabpanel"` + `aria-labelledby`. Tab keyboard handler supports Arrow Left/Right, Home, End to navigate between tabs (standard tablist pattern).
- Disclaimer modal upgraded from a styled `<div>` to a real `role="dialog"` + `aria-modal="true"` + `aria-labelledby`/`aria-describedby` wired to inner heading and body. Auto-focuses Continue button. Esc key dismisses.
- Skip-link to jump straight to the calculator (visible on Tab focus).
- All 7 canvases got descriptive `aria-label` + `role="img"`. Beam supports and section drawing canvases got context-rich labels explaining the click interaction.
- `<noscript>` fallback explaining the WASM/JS requirement and reaffirming client-side privacy stance.
- Global `:focus-visible` outlines for buttons, tabs, chips, and form fields.

### Added (UX)
- WASM loading indicator (top of page, fixed): polls for the wasm module, auto-hides when loaded or after 8s timeout. Replaces the previous silent 377KB load.
- Disclaimer dismissal now persists to `localStorage['amni-calc-disclaimer-ok']` &mdash; returning users no longer re-acknowledge on every visit.

### Added (monetization)
- AdSense script in `<head>` and a single responsive `<ins>` slot (`data-ad-slot="1720203631"`) inside the disclaimer dialog. Placement is intentional: the ad is visible during the acknowledge step (high-attention moment), but never appears once the user is inside the calculator workflow. Disclaimer is dismissed once and stays dismissed, so the ad does not interfere with engineering tasks.

### Removed
- Dormant `<div id="ad-tx" class="hidden">` "engineering datapad" popup shell that v4.2.1 had emptied but left in DOM. Now fully removed &mdash; no more dead markup.

### Files Touched
- `calc/index.html` &mdash; head rewrite, accessibility CSS + ARIA, ARIA tablist semantics on 11 tabs/panels, canvas labels, skip-link, noscript, WASM loader UI, disclaimer-as-dialog with localStorage persistence, AdSense slot, dormant shell removed. **The 529KB obfuscated WASM-orchestration script (line 671+) was not touched.**
- `calc/manifest.webmanifest` &mdash; new file.

### Deferred
- The obfuscated JS bundle protects the WASM orchestration logic. Refactoring is out of scope; quality work was confined to the HTML/CSS/inline-script layers.

## [4.4.0] - 2026-04-16 - Amni-Learn Quality Pass (SEO + A11y + UX + Monetization)

### Added (SEO / discoverability)
- Full `<head>` overhaul on `learn/index.html`: meta description, keywords, author, theme-color, OG tags, Twitter card, canonical URL, schema.org `WebApplication` JSON-LD with `EducationalApplication` category and `EducationalAudience` annotation. The app was previously crawlable but had only `<title>` &mdash; now indexable as a real first-class page.
- PWA manifest at `learn/manifest.webmanifest` (standalone display, scoped to `/learn/`, inline SVG icons, theme color matched to brand). Enables "Add to Home Screen" on mobile and offline-friendly install.
- Inline SVG favicon for the learn app.

### Added (accessibility)
- `aria-label` on all 71 game-tile buttons combining the visible text and description, so screen-reader users hear "Tracing &amp; Art &mdash; Draw letters &amp; create art" instead of just an emoji.
- `aria-label="Sponsored"` and `role="dialog"`/`aria-modal`/`aria-labelledby` on the new ad slot and onboarding overlay respectively.
- Global `:focus-visible` styles on game tiles, navigation buttons, multiple-choice answers, and tracing controls &mdash; restores keyboard navigability that was previously invisible.
- Mobile breakpoint (<500px) no longer hides `.btn-desc`; descriptions now render at a smaller scale instead of being entirely removed.

### Added (UX / first-run)
- Onboarding overlay shown once per device (gated by `localStorage['amni-learn-onboarded']`). 4-step explainer: how to enter the app, how to play, how scoring works, privacy stance. Dismissible by button, backdrop click, or Escape key.
- Stricter tracing-game scoring: replaced the single "&gt;25% pixel coverage anywhere" check with a two-axis check &mdash; **coverage inside the target letter** AND **accuracy** (penalizes ink drawn in clearly off-target areas). Thresholds scale with level (30% / 55% acc at L1-2 → 50% / 75% acc at L5+). Differentiated feedback ("Trace more of it!" vs "Stay inside the lines!"). Fixes the trivial scribble exploit.

### Added (monetization)
- AdSense slot inside `#menu-view` only (after the game grid, before the level-specific view exits) using the existing site-wide ad slot `1720203631`. Ads do not appear inside any active game canvas, preserving gameplay.
- `<script async ... googlesyndication.com/.../adsbygoogle.js>` added to `<head>` so the slot can render.

### Changed
- Standardized level 5 name from "STEM CHALLENGE" (in-app) to "HIGH SCHOOL STEM" so the in-app heading matches the wording on the `amni-learn.html` landing-page CTA ("HIGH SCHOOL / STEM &mdash; Ages 14-18").
- Quiz fallback "More questions coming soon!" replaced with a graceful path: try lower difficulty levels first, and if none have content, render a labeled "Back to menu" button rather than a dead end. Eliminates a content smell flagged in the audit.

### Files Touched
- `learn/index.html` &mdash; head rewrite, accessibility CSS, ARIA pass on 71 buttons, level rename, AdSense slot, onboarding overlay markup + JS, quiz-fallback rewrite, stricter tracing scorer.
- `learn/manifest.webmanifest` &mdash; new file.

### Deferred
- Full architectural refactor of the 6,022-line monolith. Out of scope for a content/quality pass; will be a separate session.

## [4.3.0] - 2026-04-16 - AdSense Compliance Round 2

### Fixed
- Converted `amni-calc.html` from a 1-line meta-refresh redirect into a full content landing page with product overview, calculator catalog, typical workflow, privacy disclosure, and launch CTAs. Eliminates the thin-page signal Google AdSense was likely flagging.
- Removed AdSense script and banner from `amni-core.html`. The product is "IN DEVELOPMENT" / vaporware and should not monetize until it ships. Reverses the v4.2.1 addition, aligning with the v3.5.0 policy-safe stance.
- Updated `robots.txt` with comprehensive disallow rules for internal paths (`/src/`, `/node_modules/`, `/plug/`, `/packs/`, `/archive/`), retired research proof JSON files, dev helpers (`/_`, `*.bak`, `*.zip`, `*.log`, `test.js`, `fix_*`, `obfuscate.js`).

### Changed
- Rewrote `sitemap.xml` to reflect the current, canonical set of crawlable content pages: all product landing pages, app subdirectories (`/calc/`, `/explore/`, `/learn/`, `/prayer/`), AmniTex overview, licensing, and all research deep-dives. Removed sitemap entries for pages that no longer exist or were never content (privacy-explore orphan).
- Updated global nav `AMNI-CALC` link from `calc/` to `amni-calc.html` across 21 pages so the newly content-rich landing page is discoverable and consistent with the `amni-learn.html` / `amni-explore.html` / `amni-prayer.html` pattern.
- Updated index.html project card for AMNI-CALC to link to the landing page rather than launching the app directly, matching the other LIVE product cards.

### Verified (no PII / no /plug exposure)
- Confirmed `.gitignore` excludes `plug/`, `src/`, `*.bak`, backups, and dev scripts. `git ls-files` shows zero tracked files in those paths &mdash; nothing proprietary is shipped to GitHub Pages.
- Scanned all tracked HTML for phone numbers, street addresses, and SSN patterns. No matches. Only public contact info present: `amnibro7@gmail.com`, `anthony@amni-scient.com`, and the developer's studio credit "Anthony Reffelt" on the About page and footers &mdash; all intentional.

## [4.2.1] - 2026-04-16 - AdSense Review Prep

### Changed
- Added standardized footer AdSense banners to substantive pages that previously had no ad placement: Amni-AI, Amni-Core, AmniTex overview, and Licensing.
- Expanded Amni-Core with architecture rationale, roadmap detail, and real destination CTAs to reduce thin-content and dead-end signals.
- Added deployment-profile content to Amni-AI and corrected the Amni-Code privacy page heading and local-data language.
- Removed dormant popup AdSense shell markup from the live explorer app surface to keep ads off the interactive canvas experience.
- Verified ownership and inventory signals remain present through the root AdSense code, CNAME, ads.txt, and app-ads.txt setup.

## [4.2.0] - 2025-07-24 - Adult Brain Exercise Full Overhaul

### Added
- 5 dedicated adult brain exercise games replacing relabeled kids' games: Sudoku (9x9 generator/solver w/pencil marks, 3 difficulty levels, timer, error tracking), Card Pairs (4 themes, 5 grid sizes, combo system, progressive difficulty), Speed Math (30s countdown mental arithmetic w/escalating ops & streak multipliers), Word Search (12x12 grid, 4 topics, 8-dir placement, pointer drag selection), Logic Puzzles (20 brain teasers w/multiple choice & explanations).
- New brain-section HTML category w/5 game-btn entries hidden by default, shown only on level=6.
- 5 new view divs: sudoku-view, cardpairs-view, speedmath-view, wordsearch-view, logic-view.
- Full CSS suite: .sdk-grid/.sdk-cell (given/selected/error/same-val/highlight variants), .sdk-pencil, .sdk-numpad, .cp-grid/.cp-card (flipped/matched), .spm-display/.spm-key/.spm-timer-bar, .ws-container/.ws-grid/.ws-cell (selecting/found), .ws-wordlist, .lgc-container/.lgc-question/.lgc-choices/.lgc-opt + animated gradient backgrounds per view.
- Level=6 handler rewritten: hides all .game-category:not(#brain-section), shows brain-section, sets title to BRAIN EXERCISE w/teal accent.
- Back button cleanup extended w/_sdkTimer, _spmTimer, _cpTimer clearInterval.
- Views registry extended w/5 new entries. Click handlers wired for all 5 games.
- Backups: backups/amni-learn_v4.2.0_brain_overhaul.bak, backups/learn_index_v4.2.0_brain_overhaul.bak.

## [4.1.0] - 2026-04-07 - Adult Brain Exercise Themed Button

### Added
- Themed BRAIN EXERCISE btn (teal) in amni-learn.html cta-row for ?level=6 targeting adults w/ puzzles sudoku num games cards for mind health.
- Extended learn/index.html JS w/ ternary conds condensed (no if/else/empty/comments/dupe/minlines) to remap brain training cat to ADULT BRAIN EXERCISE & update btns to MEMORY MATRIX/SUDOKU/CARD LOGIC on lvl6.
- .brain CSS theme. Guardian council, checklist_v4.1.0, backups v4.1.0_*.bak, linter0, full test/trace w/ existing scoring/integration PASS, archmap+docs updated. All rules T.

## [4.0.0] - 2026-03-24 - Millennium Model Wiring

### Added
- Migrated Millennium Model output into `amni-scient-site/research/millennium_sim`.
- Embedded interactive launch button for Millennium Model into `master-momentum.html` abstract.

## v3.10.0 â€” 2025-07-22 â€” Visual & Content Overhaul (Games Upgrade)

### CSS Visual Enhancements
- 12 new @keyframes: bgShift, cardFlip3d, pulseGlow, shimmer, floatUp, bounceIn, timerShrink, borderRotate, targetBob, robotWalk, shake
- All 16 game views upgraded to animated gradient backgrounds (bgShift)
- `.game-btn::after` shimmer overlay effect on all menu buttons
- `.m-card` enhanced: perspective 3D hover tilt, bounceIn on flip, glow on match
- New utility classes: `.game-progress`, `.game-timer-bar` (warning/critical states), `.game-stat`, `.game-hud`, `.combo-popup`
- Enhanced hover/active states for `.rfx-target`, `.seq-pad.lit`, `.scr-tile`, `.scr-slot.filled`, `.pat-cell`, `.geo-opt`, `.type-letter`, `.wb-card`, `.blk-cell.robot-trail`

### Matching Game â€” Timer, Combos, Move Counter
- HUD: â± timer, ðŸ”„ move counter, ðŸ”¥ combo tracker
- Progress bar showing % cards matched
- Combo system: consecutive matches increase multiplier, 3+ combos give bonus points + floating "+N" popup
- End-game scoring based on move efficiency ("Perfect Memory!" / "Great Job!" / "You Won!")
- `spawnComboPopup()` for floating score text near matched cards

### Reflex Game â€” Moving Targets, Power-ups, Precision Timer
- Smooth timer bar with warning (yellow <40%) and critical (red pulsing â‰¤15%) states
- Date.now() precision timing instead of interval counting
- Moving targets for L3+ with bouncing physics (velocity, wall collisions), speed scaled by level
- Power-up spawns (â³) at L3+ adding +3 seconds
- Combo counter with visual HUD, 5+ combo gives floating popup + bonus
- Decoys at L5 with -3 penalty and combo reset

### Memory Sequence â€” Tones, Glow Trails, Round Display
- Web Audio API tones per pad (sine oscillator, frequency per pad color)
- Enhanced glow with box-shadow on flash (30px + 60px double glow)
- HUD: ðŸ“Š round counter, ðŸ† best round tracker
- Improved game over: pad opacity flash, "Try Again (Best: N)" button
- Speed scales with sequence length for L5 (>8 items = 200ms flash)

### Word Scramble â€” Countdown Timer, Shake, Bonus Time
- Countdown timer bar (level-scaled: L1=45s, L5=25s) with warning/critical states
- +5 seconds bonus on correct answer
- Shake animation on wrong guess
- HUD: âœ… solved count, â± time remaining
- Game ends on timer expiry with total solved score

### Pattern Puzzle â€” Doubled Generators, Streak System
- 8 generators per level (doubled from 4): added odd numbers, skip-10, moon phases, descending squares, power-of-2 trees, Catalan numbers, more
- Streak system: 3+ consecutive correct = bonus points, 5+ = special feedback
- HUD: âœ… solved count, ðŸ”¥ streak counter
- Staggered bounceIn animation on sequence cells (delay per position)
- Wrong answer shake animation on choice button

### Typing â€” On-Screen Keyboard, Word Count, Best WPM
- Virtual QWERTY keyboard with live highlight: blue glow for next key, green flash on correct, red shake on error
- HUD: ðŸ“ word count, ðŸ† best WPM tracker
- Keyboard scales responsively with clamp() sizing

### Blocks (Code Robot) â€” Trail, Steps, Cleared Count
- Robot trail showing visited cells (green-tinted background)
- HUD: ðŸ“Š level, ðŸ‘£ step counter, ðŸ† levels cleared
- Score based on path efficiency: â‰¤8 steps="Perfect Path!" (5pts), â‰¤12="Great Route!" (3pts)
- Robot walking animation on player cell
- Reset clears trail and step counter

### Geography Explorer â€” Progress Bar, Streak, Replay
- Round progress bar + HUD: ðŸ“Š N/8 progress, âœ… correct count, ðŸ”¥ streak
- Streak bonus: 3+ correct in a row = +1 bonus point, 5+ = special feedback
- Correct answer always highlighted green on reveal
- End screen shows percentage grade + "Play Again" button
- Flag bounceIn animation on each new question

### Technical
- File: learn/index.html grew from 2644 â†’ 2914 lines (+270 lines)
- All timer cleanup properly handled in nav-back (matchTimer, scrTimer)
- No new external dependencies, all vanilla JS + CSS

## v3.9.0 â€” 2026-03-20 â€” Four New Games (Memory, Scramble, Pattern, Geography)

### New Games
- **Memory Sequence** (ðŸ§ ) â€” Simon Says-style flashing pad game. Watch colored pads light up in sequence, then repeat. Pad count and flash speed scale by level (L1-2: 4 pads/600ms, L3: 4/450ms, L4-5: 6 pads/300ms). Sequence grows each round.
- **Word Scramble** (ðŸ”¤) â€” Unscramble letters to form the correct word. Tap tiles to place, tap slots to remove. 10 words per level: L1=3-letter (CAT, DOG), L2=5-letter (APPLE, HOUSE), L3=8-letter (ELEPHANT, COMPUTER), L4=9-letter (ALGORITHM, ECOSYSTEM), L5=14-letter (PHOTOSYNTHESIS, METAMORPHOSIS). Hint + emoji provided.
- **Pattern Puzzle** (ðŸ”¢) â€” Complete the sequence by identifying what comes next. L1: simple alternating patterns (ðŸ”´ðŸ”µðŸ”´ðŸ”µ?), L2: skip counting (2,4,6,8,?), L3: Fibonacci/squares (1,1,2,3,5,?), L4: triangular numbers/primes, L5: cubes/factorials.
- **Geography Explorer** (ðŸŒŽ) â€” Learn countries, capitals, and continents through flag identification. 8 countries per level across all regions. L1-2: "Which country?" mode, L3-5: adds capital and continent questions. 40 total countries across 5 levels.

### Menu & UI
- Added "Brain Training" category section with Memory Sequence + Pattern Puzzle
- Added "World Knowledge" category section with Geography Explorer
- Word Scramble added to Languages category alongside Word Bridge
- New CSS button accent colors: memseq (#ff6348), scramble (#ffa502), pattern (#7bed9f), geo (#70a1ff)
- New view backgrounds for all 4 game views

### Technical
- 4 new HTML view containers with dedicated UI layouts
- 4 new `init*()` functions: `initMemSeq()`, `initScramble()`, `initPattern()`, `initGeo()`
- Views object expanded: memseq, scramble, pattern, geo
- Game router expanded with 4 new `if(game === ...)` entries
- All games use `addScore()` / `resetStreak()` / `showFeedback()` systems
- File grew from 2231 â†’ 2644 lines (+413 lines of new game content)

## v3.8.0 â€” 2026-06-16 â€” Learn Page Overhaul (Zoom Fix + 5-Level Game Content)

### Zoom/Button Visibility Fixes
- Removed `user-scalable=no,maximum-scale=1.0` from viewport meta â€” users can now pinch-zoom
- Changed `body { overflow: hidden }` to `overflow-x: hidden; overflow-y: auto` for scrollable content
- Made `.top-bar` sticky (`position: sticky; top: 0; z-index: 50`) so it stays visible on scroll/zoom
- Converted all interactive elements (`.game-btn`, `.m-choice`, `.type-letter`, `.t-btn`, `#hint-btn`, `.diff-btn`, `#quiz-prompt`, `#feedback`, `.rfx-arena`, `.life-task-area`) to `clamp()` responsive sizing
- Made `.tracing-controls`, `.math-choices`, `.life-controls` sticky at bottom (`position: sticky; bottom: 10px; z-index: 20`)
- Removed absolute positioning from `.view`, switched to flex-based layout with `min-height: 0`

### Typing Game â€” 5-Tier Word Lists
- Level 1: 40 words, 3-letter (CAT, DOG, SUN...)
- Level 2: 35 words, 4-5 letter (APPLE, BIRD, FISH...)
- Level 3: 41 words, 6-10 letter (ELEPHANT, COMPUTER...)
- Level 4: 30 words, 10-12 letter academic (PHILOSOPHY, ENGINEERING...)
- Level 5: 30 words, 13-18 letter scientific (THERMODYNAMICS, BIOLUMINESCENCE...)

### Quiz â€” 100 New Questions (Levels 4-5)
- Animals L4-5: autotroph, mycology, apoptosis, Hardy-Weinberg, CRISPR, phylogenetics
- Languages L4-5: morpheme, Sapir-Whorf, anaphora, Chomsky, phoneme, pragmatics
- Science L4-5: Heisenberg, Krebs cycle, quantum entanglement, Pauli, Bose-Einstein
- Math L4-5: Taylor series, eigenvalues, Fourier, Langlands, GÃ¶del, P vs NP
- Engineering L4-5: Reynolds number, PID, Bode plot, Navier-Stokes, Kalman filter

### Teach Phase â€” Levels 4-5 Cards
- Animals: Genetics, Cell Biology, CRISPR, Endosymbiosis, Epigenetics
- Languages: Morphology, Rhetoric, Universal Grammar, Computational Linguistics
- Science: Quantum Mechanics, Organic Chemistry, Particle Physics, General Relativity

### Matching Game Enhancement
- Levels 1-3: Emoji-only matching (unchanged)
- Levels 4-5: 35 concept/definition card pairs (Hâ‚‚Oâ†”Water, DNAâ†”Genetics, Newtonâ†”Force, Ï€â†”3.14159...) with 2pts per match

### Sort Hat â€” Level-Aware Academic Rounds
- Levels 1-2: Emoji sorting (Fruits/Vegetables, Land/Water, Hot/Cold, Big/Small)
- Level 3: Science categories (Metals/Non-Metals, Vertebrates/Invertebrates, Renewable/Non-Renewable)
- Level 4: Chemistry/Biology (Acids/Bases, Potential/Kinetic Energy, Prokaryote/Eukaryote)
- Level 5: Advanced science (Exothermic/Endothermic, Classical/Quantum Physics, Ionic/Covalent Bonds)

### Word Bridge â€” 5-Level Vocabulary
- Level 4: Knowledge, Freedom, Courage, Discovery, Electricity, Universe, Philosophy
- Level 5: Consciousness, Civilization, Environment, Revolution, Technology, Democracy, Phenomenon

### Math Game â€” Algebra & Scaling
- Levels 4-5: 25% chance of algebra problems (ax+b=c, solve for x)
- maxVal scaling: L1â†’5, L2â†’20, L3â†’100, L4â†’200, L5â†’500
- Choice spread scaling: L1â†’3, L2â†’10, L3â†’20, L4â†’30, L5â†’50

### Reflex Game â€” Level 5 Hardmode
- Level 5: 40px targets (was 55), 350ms spawn delay (was 500), 30% chance of decoy ðŸ’€ targets (-2 penalty)

### Blocks (Maze) â€” 10 Levels + Level Sync
- Expanded from 5 to 10 maze layouts with increasing wall density
- Starting maze synced to `currentLevel` so higher levels begin at harder mazes

### Mountain Math â€” Squares & Roots
- Level 5: 40% chance of square/square root problems (nÂ² = ?, âˆšn = ?)
- Platform count: L1-2â†’5, L3â†’8, L4â†’10, L5â†’12

## v3.7.0 â€” 2026-06-15 â€” Interactive Research Visualizations

### Interactive Visualizations (Chart.js + Canvas)
- **reffelt-constant.html** â€” Interactive Reffelt Digit Encoder (input eigenvalues + causal weights â†’ compute base-9 constant live, with digit validity coloring) + Eigenvalue Spectrum dual-axis chart (bars + causal weight line)
- **eigenstretch-tensor.html** â€” Eigenvalue Scree Plot with cumulative variance line (adjustable archive size + noise) + Diagnostic Signal Radar Chart with preset states (Healthy, Overfitting, Collapse, Regime Drift)
- **holographic-membrane.html** â€” Live Particle Membrane Simulation (Canvas, Verlet integration per Eq. M4-M6, adjustable particle count + friction, start/stop/reset controls, resistance field heatmap with probability density buildup, real-time stats)
- **toroidal-manifold.html** â€” Rotating 3D Torus Wireframe (Canvas 2D projection with trajectory, pinch highlight) + Hourglass Pinch curve (r vs rÌƒ with adjustable Î±) + Magnetic Field B_Î¸ vs r plot
- **master-momentum.html** â€” Master Equation Term Contributions (4-term line chart: forcing, advection, damping, resistance gradient with adjustable smoothness/turbulence/PID gain) + Equation Dependency Flow (4-layer Canvas visualization with bezier connections)
- **ground-state-kernel.html** â€” Eigenvalue Scree Plot (15Dâ†’2D collapse with cumulative variance) + Causal Weight Importance horizontal bars (free/frozen color coding) + 2D Ground State Scatter (k vs performance, colored by regime)

### Technical
- Added Chart.js v4.4.7 CDN to all 6 research subpages
- Added viz-section CSS classes (viz-section, viz-canvas-wrap, viz-controls, viz-result, sim-stats, viz-charts-row)
- All visualizations are self-contained vanilla JS, no build step required

## v3.6.0 â€” 2026-06-15 â€” Research Section Launch

### New Pages
- **research.html** â€” Landing page showcasing 6 original mathematical frameworks with MathJax equations, Schema.org ScholarlyArticle markup, framework cards with signature equations and application tags
- **research/reffelt-constant.html** â€” Spectral fingerprinting via graph Laplacian eigendecomposition; 5-step derivation, validity rules, 5 SOTA applications (NAS, datacenter workload, hyperparameter opt, drug discovery, LLM training)
- **research/eigenstretch-tensor.html** â€” Causal-topological manifold analysis; Wasserstein-weighted construction, 4 diagnostic signals, 4 SOTA applications (AI training stability, LLM convergence, ML drift, hardware stress)
- **research/holographic-membrane.html** â€” GPU-accelerated particle dynamics on friction fields; holographic stretch field, Verlet integration, probability deposition, 5 SOTA applications (GPU scheduling, beam dynamics, CFD, AI inference routing, orbital mechanics)
- **research/toroidal-manifold.html** â€” State-space topology with hourglass pinch model; torus coordinates, magnetic field, energy functional, hierarchical CCCC-MMMM-FFFF-PPPP addressing, holographic resonance, 5 SOTA applications (cryptographic analysis, quantum states, tokamak plasma, database indexing, satellite constellations)
- **research/master-momentum.html** â€” 12-equation Navier-Stokes turbulence closure; complete PDE system from primitives through k-epsilon model to master equation, full dependency matrix, 5 SOTA applications (weather modeling, datacenter thermal, aerospace boundary layers, AI training dynamics, crack propagation)
- **research/ground-state-kernel.html** â€” Universal dimensionality collapse to 2D manifold; SVD eigenstretch decomposition, causal weight analysis, parameter freeze map, Reffelt constant encoding, Bayesian+bandit meta-optimizer, 5 SOTA applications (transfer learning, model compression, hyperparameter search, NAS, quantum variational circuits)

### Navigation Updates
- Added RESEARCH link to nav bar on all 12 existing pages (between PROJECTS dropdown and ABOUT)
- Added RESEARCH link to footer on all 12 existing pages (between FAQ and PRIVACY)

### Sitemap
- Added research.html + 6 research subpages to sitemap.xml

## v3.5.0 â€” 2026-06-14 â€” AdSense Compliance Overhaul

### New Pages
- **about.html** â€” Studio story, developer bio, design philosophy, tech stack overview, product portfolio; Schema.org AboutPage markup
- **faq.html** â€” ~20 substantive FAQ entries covering all products + technical questions; Schema.org FAQPage structured data

### AdSense Placement Fixes
- Removed AdSense script from amni-ai.html (no live product)
- Removed AdSense script from amni-core.html (coming-soon page)
- Removed AdSense script from privacy.html (utility page)
- Removed AdSense script from terms.html (utility page)
- Removed AdSense from explore/index.html (game page â€” ads overlaying interactive WebGL content)
- Switched from Auto Ads to manual placement on all 6 landing pages (index, explore, crypt, haven, about, faq)
- Added `data-overlays="false"` to all landing page AdSense scripts (disables anchor/vignette overlay ads)
- Added manual responsive `<ins>` ad unit before footer on each landing page (bottom-of-page placement)
- Manual ad units require slot ID from AdSense dashboard (placeholder: REPLACE_WITH_SLOT_ID)

### Educational Content Sections Added
- index.html â€” "What We Build & Why" (product philosophy overview)
- amni-explore.html â€” "Understanding Procedural Galaxy Generation" (spiral arms, star classification, fBm, NASA TAP)
- amni-crypt.html â€” "Understanding File Encryption" (SPN ciphers, key derivation, deniable encryption)
- amni-haven.html â€” "Self-Hosted Messaging Explained" (Socket.IO, FCM, federation vs centralization)
- amni-calc.html â€” "Why Browser-Based Engineering Tools" (WASM, Euler-Bernoulli, seal engineering, von Mises)
- amni-learn.html â€” "Early Education Design Philosophy" (scaffolded learning, canvas, COPPA, offline)

### Navigation & Footer Updates
- Added ABOUT and FAQ links to nav on all 10 pages
- Added ABOUT and FAQ links to footer on all 10 pages

### Sitemap
- Added amni-learn.html, learn/, about.html, faq.html to sitemap.xml

## v3.4.0 â€” 2026-03-18 â€” FC-Calc Major Fix + Enhancement

### /plug/fc-calc/ â€” Critical: tabRefresh Fix (6 Blank Tabs)
- **Root cause**: `tabRefresh` map was defined before inks/membrane functions existed
- Moved tabRefresh after all window.xxx function definitions
- Fixes: Periodic Table, Element Properties, Alloy Discovery, D-Band Model, Membrane Chemistry, Multilayer Coating â€” all were permanently blank

### /plug/fc-calc/ â€” 4 JavaScript Bug Fixes
- Fixed missing `degReset()` function (degradation tab reset button)
- Fixed `toggleEl()` module scope â†’ `window.toggleEl`
- Fixed `g` variable shadowing in `updateDband()` (renamed to `dbSliders`)
- Fixed flow display formatting (`.toFixed()`)

### /plug/fc-calc/ â€” Navigation Cleanup
- Removed old individual plug page links (EVERSION, SPRING, FLOW, BEAM, INKS)
- Simplified to breadcrumb style: PLUG / FC-CALC + theme toggle

### /plug/fc-calc/ â€” Economics FC/ELX Split
- Added FUEL CELL / ELECTROLYZER mode toggle to Economics tab
- LCOH chart title reflects selected mode

### /plug/fc-calc/ â€” Tab Enhancements
- **Flow/dP**: Added velocity vs current density chart, flow regime labels, GDL intrusion stats
- **Reliability**: Added gauge bar indicators for MTTF, B10, B50, R(40kh)
- **AST Protocols**: Added per-protocol ECSA/V-loss gauge bars with DOE target context
- **Transient**: Added stack power profile chart, thermal ramp rate (dT/dt) overlay
- **Water Balance**: Added membrane hydration state chart (Î» vs RH at 60/80/95Â°C) with flooding/dryout zones
- **Membrane Chemistry**: Added initial thickness + RH sliders, conductivity vs RH chart (Springer model), ink linkage indicator, dual-current FER curves, 80% threshold line

### /plug/fc-calc/ â€” Equation & Chart Corrections
- **D-Band Volcano**: Fixed peak position from -1.7eV to -1.05eV (Pt); added pure metal reference markers
- **Fenton/FER Model**: Rewrote with Arrhenius temperature dependence (base 0.5 umol/cmÂ²/h at 80Â°C), inverse current factor (OCV = worst case), RH scaling. Added OCV trace to FER chart.
- **Membrane Lifetime**: Fixed degradation constant (was 1e-4 â†’ 2e-5), gives realistic ~20kh lifetime at FER=0.5. Extended plot range to 50kh.
- **Alloy ORR Predictor**: Uses known literature values (Pt3Ni=10X, etc.) when available; caps EN synergy via Gaussian damping; adds lattice strain penalty >12%
- **Reliability**: Added bathtub curve decomposition (infant mortality + random + wear-out components)

### /plug/fc-calc/ â€” Wizard Tab Expansion
- Added stack cost estimation panel (membrane, catalyst, GDL, BPP, BoS breakdown with pie chart, $/kW metric)
- Added "Suggest Improvements" optimization hint engine (power/efficiency/durability context-aware guidance)

### /plug/ â€” Build
- Rebuilt all 7 encrypted pages (fc-calc 346KB with WASM inlined)

## v3.3.0 â€” 2026-03-17 â€” FC-Calc Major Fix + Site Light Mode

### /plug/fc-calc/ â€” Calculation Engine Rewrite (5 Critical Bug Fixes)
- Fixed activation overpotential: added n_e=2 to denominator (RT/(alpha*n_e*F))
- Fixed stack current: removed erroneous /10000 divisor from i_total = i * area
- Fixed E_TN: now 1.481V (HHV) for both FC and ELX modes (was 1.254 for FC)
- Fixed thermal heat split: electrochemistry-based (E_TN-E_rev, E_rev-V_cell) replaces hardcoded 30/70
- Fixed default exchange current: 1e-6 A/cm2 (was 1e-7)
- Net effect: V_cell ~0.67V, efficiency ~45%, power ~20kW (was 0.15V, 17%, 2W)

### /plug/fc-calc/ â€” New Features (9-Tab Interface)
- Added FC/ELX mode toggle to Polarization tab
- Added DRT analysis: Tikhonov regularized with Cholesky solver
- Added EIS CSV upload: FileReader API drag-and-drop (no server storage)
- Added Degradation tab: 6 Arrhenius mechanisms + ECSA loss model
- Added Variation tab: cell-to-cell Monte Carlo (splitmix64 PRNG) with histogram
- Added Stack Wizard game: random target challenges with scoring
- Stack tab now shows reversible/irreversible heat split pie chart
- Thermal tab now derives heat from electrochemistry (nc, area, i_dens linked)
- Economics tab: added water cost component to LCOH breakdown

### Site-Wide Light/Dark Mode
- Added [data-theme="light"] CSS variable overrides to css/style.css
- Light variants for all 6 theme accents (crypt, haven, ai, core, explore, calc)
- Theme toggle button added to nav on all 16 pages
- localStorage persistence (key: amni-theme)
- Light mode fixes: nav bg, dropdown bg, mobile nav bg, scanlines, grid-bg
- Screenshot containers and showcase items adapt to light backgrounds

## v3.2.0 â€” 2026-03-16 â€” Plug Gate (Restricted Section)

### /plug/ â€” AES-256 Encrypted Gated Section
- New `/plug/` route with StatiCrypt AES-256-GCM client-side encryption
- Custom login template matching site dark terminal theme (JetBrains Mono, accent green)
- Dual-field auth: account + password combined as PBKDF2 passphrase
- "Remember me" localStorage persistence (30-day expiry)
- Source pages in `src/plug/` (gitignored), encrypted output in `plug/` (safe to commit)
- Build script `encrypt_plug.js` (gitignored) reads credentials from `.env` (gitignored)
- Credentials, build tools, and source content never appear in the git repo
- robots.txt updated to disallow `/plug/`
- `noindex,nofollow` meta tag on login shell prevents search indexing
- All sub-pages under `/plug/` independently encrypted

### /plug/sphere-eversion/ â€” Interactive 3D Sphere Eversion
- Ported Rust/kiss3d sphere eversion to WebGL Three.js (same parametric math)
- Smale regular homotopy visualization: Q=3, NU=48, NV=64 resolution
- Full-screen 3D canvas with OrbitControls (drag, zoom, rotate)
- Play/pause toggle, wireframe mode, info panel, t-parameter scrub slider
- Vertex-colored surface with ambient + dual directional lighting
- Double-sided rendering for inside-out visibility during eversion
- Protected behind plug gate authentication

### /plug/fc-calc/ â€” PEM Fuel Cell / Electrolyzer Calculator (Rust/WASM)
- Rust/WASM computation engine (26KB .wasm, wasm-bindgen bindings)
- 6-tab interface: Polarization, Stack, EIS, Thermal, Economics, Materials
- Polarization: Nernst + Butler-Volmer (arcsinh) + Springer ohmic + concentration loss
- Stack sizing: fuel cell & electrolyzer modes, H2 production, efficiency, heat
- EIS: Randles circuit + Warburg impedance Nyquist plots
- Thermal: heat balance + coolant flow calculator
- Economics: LCOH analysis with capital, electricity, O&M, stack replacement
- Materials database: 15 generic published PEM materials (no proprietary data)
- All equations from textbook/published sources only
- Plotly.js interactive charts with dark/light theme sync
- Light/dark mode toggle with CSS custom properties + real-time replot
- All inputs as interactive range sliders with live WASM recalculation
- Protected behind plug gate authentication

### Build Pipeline
- Added `npm run encrypt` script for plug page encryption
- Installed `staticrypt` v3.5.4 dev dependency

## v3.1.0 â€” 2026-03-12 â€” Interactive Teaching Overhaul

### src/learn/index.html â€” Screen Space & Button Improvements
- Reduced view padding (80px â†’ 56px) for more usable game space
- Game buttons get bouncy cubic-bezier transition + :active press feedback
- Mode-1 buttons: min-height 130px, 6.5rem icons, 2rem text for youngest users
- Mode-2 buttons: min-height 90px, 4.5rem icons for mid-level accessibility
- Math choice buttons get min-height 70px with flex centering
- Music button gets dedicated pink (#e94560) border color
- Quiz buttons get teal (#00b894) border color

### src/learn/index.html â€” Celebration System (Confetti)
- Canvas-based confetti particle system spawns on correct answers
- 50 particles for normal correct, 120 for completions/milestones
- Particles have gravity, rotation, random colors, fade-out
- Feedback overlay upgraded from opacity transition to CSS keyframe (celebPop)
- Scale-up entrance, hold, fade-out animation over 1.8s

### src/learn/index.html â€” NEW: Interactive Music Studio
- Music module completely replaced from quiz-only to full interactive studio
- Three tabs: ðŸŽ¹ Piano, ðŸŽº Explore Instruments, ðŸ¥ Rhythm Game
- **Piano**: Web Audio API with OscillatorNode + gain envelope for natural sound
  - L1: 1-octave keyboard with large keys (56px wide, 200px tall)
  - L2+: 2-octave keyboard with play-along melody challenges
  - Melodies: Mary Had a Little Lamb, Hot Cross Buns, Twinkle Twinkle, Ode to Joy, scales
  - L3: Music Theory section with C Major scale explorer and chord builder (C, Dm, F, G, Am)
- **Instrument Explorer**: Grid of 8-12 instrument cards (level-dependent)
  - Each card plays a distinct wave type: sine (piano/flute), sawtooth (guitar/trumpet), triangle (violin), square (sax)
  - Drums use synthesized kick/snare/hihat sounds
  - Visual tap feedback on card press
- **Rhythm Game**: Pattern-based tap challenge
  - L1: 4 beats at 80 BPM, L2: 6 beats at 100 BPM, L3: 8 beats at 120 BPM
  - Demo phase (listen) â†’ Play phase (tap along) â†’ Score percentage
  - 70%+ triggers celebration and score
- AudioContext singleton with lazy init (Chrome autoplay policy compatible)
- Note frequencies calculated mathematically (A4=440Hz base, 12-TET)
- Rhythm timer cleanup on navigation and tab switching

### src/learn/index.html â€” NEW: Teach-Then-Quiz System
- All quiz subjects (Animals, Languages, Science) now show teaching cards before quiz
- Horizontal scrollable card carousel with emoji, title, and fun fact
- Scroll-snap pagination with dot indicators
- "I'm Ready! Start Quiz! âœ¨" button transitions to quiz phase
- 5 teaching cards per subject per level (45 total teach cards across 3 subjects Ã— 3 levels):
  - Animals L1: Dog, Cat, Bird, Fish, Butterfly basics
  - Animals L2: Elephant, Lion, Penguin, Giraffe, Octopus facts
  - Animals L3: Classification, Adaptation, Marine Life, Entomology, Ecosystems
  - Languages L1: Letters, Reading, Sounds, Rhyming, Writing
  - Languages L2: Grammar, Spanish, French, Vocabulary, Punctuation
  - Languages L3: Etymology, Literary Devices, Language Families, Poetry, Linguistics
  - Science L1: Sun, Water, Plants, Life Cycle, Rainbow
  - Science L2: Solar System, Energy, Forces, Cells, Weather
  - Science L3: Atoms, Chemistry, DNA, Astronomy, Thermodynamics

### Production Build
- Obfuscated: 89K â†’ 425K chars (learn/index.html)

## v3.0.0 â€” 2026-03-12 â€” Amni-Learn Major Content Expansion

### src/learn/index.html â€” Bug Fixes
- Fixed money/clock routing: `data-subgame="money"` was incorrectly mapped to `initClock()`
- Split into proper `data-subgame="clock"` for clock game, `data-subgame="money"` for new money game
- Clock button now shows correct ðŸ•°ï¸ icon with "Read Clock" label

### src/learn/index.html â€” New: Money Counting Game
- L1: Count coins (pennies, nickels, dimes, quarters) to match item prices under $1
- L2: Bills + coins, purchase items up to $20
- L3: Make change from rounded-up payments (reverse calculation)
- Uses existing `.register-display`, `.bill`, `.coin` CSS that was previously unused
- Reset button to clear current total

### src/learn/index.html â€” New: Science & Nature Quiz
- Added Science & Nature as 6th quiz subject with ðŸ”¬ button in General Knowledge section
- L1: 15 questions (weather, plants, animals, seasons, body parts, basic observation)
- L2: 15 questions (solar system, states of matter, gravity, photosynthesis, water cycle)
- L3: 15 questions (mitochondria, chemistry, geology, genetics, thermodynamics, Doppler effect)

### src/learn/index.html â€” Quiz Content Expansion (57 â†’ 225 questions)
- Animals: 5/5/5 â†’ 15/15/15 per level (collective nouns, taxonomy, regeneration, lifespan records)
- Music: 4/4/4 â†’ 15/15/15 per level (instrument families, notation, music theory, modes, circle of 5ths)
- Languages: 4/4/4 â†’ 15/15/15 per level (phonics, grammar, multilingual vocab, literary devices, linguistics)
- Math (L3): 6 â†’ 15 questions (limits, complex numbers, logarithms, fundamental theorem of calculus)
- Engineering (L3): 6 â†’ 15 questions (Hooke's law, ideal gas, Young's modulus, bridge types, speed of light)

### src/learn/index.html â€” Math Game Overhaul
- Added division for L2+ (clean division, no remainders)
- Added word problems for L2+ (8 problem templates: bags of candy, shared cookies, garden rows, etc.)
- Added geometry for L3 (area of square/rectangle/circle/triangle, perimeter calculations)
- Improved answer choice generation with difficulty-scaled spread values

### src/learn/index.html â€” Typing Game Expansion
- Word lists expanded from 20 â†’ 50 words per level
- L1: added 30 new 3-letter CVC words (CUP, PIG, COW, HEN, BEE, etc.)
- L2: added 30 new multi-syllable words (CHOCOLATE, SUBMARINE, DETECTIVE, etc.)
- L3: added 30 new academic/scientific words (PHOTOSYNTHESIS, ELECTROMAGNETIC, etc.)

### src/learn/index.html â€” Score Tracker & Streak System
- Added persistent session score counter in top bar (â­ display)
- Added streak tracker with ðŸ”¥ fire indicator (appears at 2+ streak)
- Streak multiplier: 1x base, 2x at 5-streak, 3x at 10-streak
- All games hook into scoring: quiz, math, typing, tracing, matching, vacuum, dishes, clock, money
- Wrong answers in quiz/clock/math reset streak
- Stats persist via sessionStorage across game switches within session

### src/learn/index.html â€” Code Quality
- Stripped all CSS, JS, and HTML comments (54 lines removed)
- Removed all empty lines (106 lines removed)
- Source reduced from 1343 to 1183 lines while adding significant content

### learn/index.html â€” Production Build
- Rebuilt obfuscated version: 66KB source JS â†’ 291KB obfuscated

### amni-learn.html â€” Product Page Updates
- Updated subtitle to include TYPING, LIFE SKILLS, QUIZZES
- Updated Math description to mention division, word problems, geometry
- Updated Life Skills description to mention money counting, 200+ quiz questions
- Updated game selection description to reflect 12+ games and STEM content

## v2.9.0 â€” 2025-06-15 â€” Math + Finishes Overhaul

### Amni-Calc WASM (finishes.rs)
- Added `galvanic_rating: u8` field to Finish struct, all 24 coatings populated
- Added `thickness_notes: String` with range-specific behavior (e.g. TiN conductivity vs wear)
- Fixed galvanic scoring bug: was mapping to conductivity_rating instead of galvanic_rating

### calc/index.html â€” Finishes Tab
- Slider labels clarified: CORROSION RESIST, COST EFFICIENCY, GALVANIC COMPAT, BATCH VOLUME, TEMP TOLERANCE
- Added description: "HIGHER RATING = BETTER PERFORMANCE"
- Complete card renderer: match % bar, 2-column spec grid, color-coded rating bars (LOWâ†’EXCEL)
- Thickness guide section with orange accent border showing range-specific notes
- Expanded substrate dropdown: Alloy Steel, Carbide, Polymer

### calc/index.html â€” Math Solver (all 5 categories)
- Calculus: live polynomial preview on input, zero-coefficient term filtering, proper Unicode superscripts
- Derivative show work: step-by-step power rule on each term, colored accent final result
- Integral: exact polynomial antiderivative + Simpson's numerical, term-by-term integration steps
- Limit: left/right convergence check, Î” column in epsilon table, convergence verdict
- Taylor: extended factorials to 20!, per-term coefficient breakdown in show work
- Algebra: vertex computation for quadratic, full Cardano steps for cubic, Cramer subscript labels
- Geometry: structured step-by-step with substituted values (was bare pre text)
- LinAlg: cofactor expansion steps for det, Gauss-Jordan pivot log for inverse, per-element multiply
- DiffEq: integrating factor steps, characteristic equation breakdown, Euler dy/dx column in table
- All show work panels use consistent styled div with panel background and accent highlights

## v2.8.0 â€” 2025-06-14 â€” Seal FEA Overhaul

### Amni-Calc WASM (seals.rs)
- Fixed X-ring geometry: rotated lobes 45Â° (`1-0.38*cos(4a)`) for proper Ã— orientation
- Added `optimum_range`, `current_point_fd`, `current_point_ss`, `nodal_mesh` to SealResult
- Nodal mesh returns per-node stress magnitude and boundary contact flags
- Interpolation of force-deflection curve at 15%/30% squeeze for optimum range bounds

### calc/index.html â€” Seal Animation
- Replaced affine-scaling animation with Position-Based Dynamics (PBD) nodal simulation
- 64 perimeter nodes with non-linear Mooney-Rivlin spring model between adjacent nodes
- Groove boundary enforcement: nodes projected back to walls on each PBD iteration
- Area conservation: incompressible rubber volume preserved via Shoelace area scaling
- Stress-colored nodes: green (low) â†’ yellow â†’ red (high) based on displacement from rest
- Boundary contact nodes highlighted with red ring indicators
- Compression face visualization: dashed line tracks squeeze depth
- Material hardness affects spring stiffness (Shore A â†’ PBD stiffness mapping)
- Fixed X-ring JS orientation to match Rust (`1-0.38*cos(4a)`)

### calc/index.html â€” Curve Overlays
- New `drawSealDiag` function wraps `drawDiagram` with seal-specific overlays
- Optimum range band: green shaded region at 15-30% squeeze on force/stress curves
- Current parameter marker: red crosshair + dot at operating point on both curves
- Label shows current squeeze % and force/stress value at marker position

## v2.7.0 â€” 2025-06-14 â€” Color Differentiation, Privacy Pages, Calc UX

### css/style.css
- Changed Crypt theme accent from #4da6ff to #2979ff (royal blue) â€” distinct from Explore's #00b4ff (cyan)
- Updated --accent, --accent-dim, --accent-glow, and scanlines rgba values for theme-crypt
- Reduced section padding from 5rem to 3.5rem, h2 margin-bottom from 2rem to 1.5rem
- Reduced product-hero padding from 8rem/4rem to 7rem/3rem

### index.html
- Updated Crypt card inline colors (border + h3) from #4da6ff â†’ #2979ff

### amni-crypt.html
- Updated SVG shield icon stroke/fill colors from #4da6ff â†’ #2979ff

### privacy.html
- Updated Crypt card badge/h3 colors from #4da6ff â†’ #2979ff
- Added Amni-Explore privacy card (WEB APP badge, #00b4ff cyan)
- Added Amni-Calc privacy card (WEB APP badge, #ff6b35 orange)

### privacy-explore.html (NEW)
- Browser-only WASM app privacy policy â€” no data collection, no accounts
- Sections: data handling, AdSense disclosure, NASA API note, security, rights, contact

### privacy-calc.html (NEW)
- Browser-only WASM app privacy policy â€” no data collection, no accounts
- Sections: data handling, AdSense disclosure, security, rights, contact

### sitemap.xml
- Added privacy-explore.html and privacy-calc.html entries

### src/calc/index.html (CALC UX)
- Reordered tabs by usage priority: BEAMS â†’ STRESS â†’ SECTIONS â†’ BOLTS â†’ SPRINGS â†’ SEALS â†’ MATERIALS â†’ FINISHES â†’ MATH â†’ EQUATIONS â†’ UNITS
- Reduced view padding 1.5rem â†’ 1rem, h2 1.2rem â†’ 1.1rem, h3 margins tightened
- Reduced card padding 1.25rem â†’ 1rem, margin-bottom 1rem â†’ .75rem
- Reduced row gap 1rem â†’ .75rem for denser field grouping
- Reduced result-grid min-width 180px â†’ 160px, gap .75rem â†’ .5rem
- Reduced result-item padding, slider label width/font-size
- Stress: merged 3 rows into 2 (all 6 components in one row, yield/ult in second)
- Bolts: merged 3 config rows into 2 (grade/size/count/loads in one row)
- Springs: merged 3 param rows into 2 (all geometry in one row, material/force in second)
- Seals: merged 4 dimension rows into 2 (cord/bore/groove in one row, gap/hardness/pressure/temp in second)

### calc/index.html
- Rebuilt obfuscated production version from updated source

### explore/index.html
- Rebuilt obfuscated production version (no source changes)

### README.md
- Updated theme color table: Crypt #4da6ff â†’ #2979ff, added Explore/Calc entries

## v2.6.0 â€” 2026-03-12 â€” Security Hardening & JS Obfuscation

### .gitignore (NEW)
- Added root .gitignore: blocks .env, *.bak, *.log, *.key, *.pem, node_modules/, backups/, src/, *.rs, build artifacts, dev files

### Git Tracking
- Removed backups/ (72 files) from git tracking â€” no longer publicly served on GitHub Pages
- Removed changelog.md, checklist_*.md from git tracking (dev-only artifacts)
- Removed lib.rs Rust source from public repo exposure

### explore/index.html
- Obfuscated all JS game logic (69KB source â†’ 447KB obfuscated)
- Hexadecimal identifier renaming, base64 string array encoding, string splitting, object key transformation
- Removed console.warn() call (NASA fallback)
- Import statements preserved for ES module compatibility

### calc/index.html
- Obfuscated all JS calculator logic (59KB source â†’ 396KB obfuscated)
- Same obfuscation profile as explore

### Build Workflow (NEW)
- src/explore/index.html â€” clean editable source
- src/calc/index.html â€” clean editable source
- obfuscate.js â€” build script: extracts JS from src/, obfuscates with javascript-obfuscator, outputs to deploy dirs
- `npm run build` â€” single command to rebuild

## v2.5.0 â€” 2026-03-11 â€” Amni-Calc Launch

### amni-calc.html (NEW)
- Product page for Amni-Calc mechanical engineering calculator
- theme-calc CSS class (#ff6b35 engineering orange accent)
- SVG calculator icon, 8 feature cards, spec table, structured data (JSON-LD WebApplication)
- CTA links to /calc/ app

### calc/ (NEW)
- Deployed Amni-Calc WASM app (index.html + pkg/)
- 216KB Rust/WASM binary with 15 exports
- 8 tabbed tools: beams, sections, materials, stress, bolts, springs, finishes, units

### Navigation (ALL 12 HTML files)
- Added AMNI-CALC to PROJECTS dropdown in index, amni-haven, amni-crypt, amni-ai, amni-core, amni-explore, privacy, terms, privacy-haven, privacy-crypt, privacy-ai, privacy-core

### index.html
- Added AMNI-CALC project card to homepage grid

### css/style.css
- Added body.theme-calc CSS (--accent:#ff6b35, scanlines)

### sitemap.xml
- Added amni-calc.html and calc/ URLs

## v2.4.0 â€” 2026-03-11 â€” SEO + Native Ads + Social Share + Trademark Cleanup

### amni-explore.html
- Added og:image (assets/explore/og-explore.png), Twitter Card tags, JSON-LD VideoGame schema
- Changed og:type from "product" to "website"
- Renamed "Galactic Cartographics" â†’ "Stellar Cartographics" (avoids Elite Dangerous "Universal Cartographics" similarity)
- Fixed copyright footer: removed personal name, standardized to "Â© 2025-2026 Amni-Scient"

### explore/index.html
- Added full SEO head: title suffix, description, keywords, og tags, twitter cards, canonical
- Added "Deep Space Transmission" ad panel (bottom-left, matches game UI aesthetic)
- AdSense auto-loads after 2s; falls back to Ko-fi CTA if blocked
- Close button hides ad for 2 minutes then re-shows
- Added Ko-fi + AMNI-SCIENT links in pause menu (Ship Computer)
- Added Share button in game bar (Web Share API with clipboard fallback)
- Renamed "Rocket Lab" â†’ "Launch Bay" (Rocket Lab is a registered company trademark)
- Renamed "Warp Coil Mk2" â†’ "Fold Drive Mk2" (Star Trek terminology)
- Renamed "Deflector Array" â†’ "Particle Screen" (Star Trek terminology)
- Renamed "FEDERATION HOMEWORLD" â†’ "ORIGIN HOMEWORLD" (Star Trek association)

### index.html
- Added og:image, Twitter Card tags, JSON-LD Organization schema
- Removed personal name from author meta tag and schema

### amni-haven.html, amni-crypt.html, amni-ai.html, amni-core.html
- Added og:image, Twitter Card meta tags to all product pages
- Changed og:type from "product" to "website" across all

### LICENSE
- Fixed copyright entity: "anmire" â†’ "Amni-Scient", added 2025 start year

### New files
- sitemap.xml (9 URLs with priority weighting)
- robots.txt (allows all crawlers, blocks /backups/ and /assets/haven/)

### Backups
- Pre-change backups at backups/v2.4.0_seo_ads/

## v2.3.1 â€” 2026-03-11 â€” Explore: Drive Terminology Cleanup
### explore/index.html
- Replaced `FRAMESHIFT DRIVE CHARGING...` with `EIGENFOLD ENGINE CHARGING...` so the live Explore jump status no longer echoes Elite Dangerous terminology
### Backups
- Pre-change backups stored at `backups/v2.3.1_explore_drive_rename/`

## v2.3.0 â€” 2026-03-10 â€” Footer Consistency

### index.html
- Removed stray AMNI-HAVEN link from footer (homepage shouldn't link to random product)

### amni-explore.html
- Replaced self-referencing AMNI-EXPLORE link with AMNI-SCIENT home link
- Fixed wrong contact email (amniscient@gmail.com â†’ amnibro7@gmail.com)

### terms.html
- Replaced stray AMNI-CRYPT link with AMNI-SCIENT home link

### Footer pattern now consistent
- Homepage: PRIVACY | TERMS | CONTACT | SUPPORT
- Product pages: PRIVACY (per-product) | TERMS | AMNI-SCIENT | CONTACT | SUPPORT
- Privacy sub-pages: ALL PRIVACY POLICIES | TERMS | AMNI-SCIENT | CONTACT | SUPPORT
- Privacy hub + terms: PRIVACY | TERMS | AMNI-SCIENT | CONTACT | SUPPORT

## v2.2.0 â€” 2026-03-10 â€” UX Fix: Hover Tiles & Greyed Nav

### amni-haven.html
- All 14 gallery images (6 phone, 6 tablet, 2 promo) now open in lightbox on click
- Added lightbox HTML/JS (openLightbox, closeLightbox, Escape key support)
- Previously had hover animation but no click action â€” dead interaction fixed

### All pages (12 files)
- Removed non-functional greyed-out AMNI-GEN and AZNO from Projects dropdown
- Dead nav items no longer confuse navigation UX

### css/style.css
- Removed `.nav-dd-dim` rule (dead code after nav cleanup)
- Removed `.card--dim` rule (unused across site)

### Backups
- Pre-change backups stored at backups/v1.1.0_ux_fix/

## v2.1.0 â€” 2026-03-10 â€” Explore: Planet Realism + FIND Fix

### explore/index.html
- Fixed FIND button: NASA panel now toggles open/close without hiding galaxy HUD
- NASA panel z-index raised to 20 with explicit pointer-events for reliable interaction
- Reduced displacement scale (4% â†’ 1.5% rocky, 0.5% â†’ 0.3% gas) to eliminate polygonal artifacts
- Oblateness now varies per seed (0.3-1.1% rocky, 3-9% gas) instead of fixed values

### explore/pkg/ (WASM v2.1)
- Tectonic plates: ocean/continental plate distinction (~55% ocean plates) for proper land/water distribution
- Smoothstep boundary blending with wider ratio-based falloff (eliminates "soccer ball" plate edges)
- Separate convergent ridges and divergent rifts with proper smoothstep decay
- Continental-scale FBM noise (3.5x freq, 6 oct) adds realistic terrain variation within plates
- Temperate biomes: deep ocean gradients, beach/dune transitions, moisture-driven forest types, latitude-based tundra, snow cap blending via smoothstep
- Super Earth biomes: deeper oceans, lush equatorial forests, polar desert, mountain snow blending
- Lava World: molten glow gradients, cooling crust, visible lava cracks with glow
- Ice World: frozen ocean, glacier transitions, exposed rock bands
- Rocky: impact crater detection via high-frequency FBM, crater rim brightening
- Gas giants: dual-frequency banding, jet stream noise, stronger spot/chevron features
- Clouds: ITCZ + trade wind + mid-latitude + polar front bands, weather front perturbation
- Normal map Sobel strength reduced (2.5â†’1.5 rocky, 0.5â†’0.3 gas) for natural surface appearance

### Backups
- Pre-change backups stored at backups/v2.1.0_explore_pre/

## v2.0.0 â€” 2025-07-27 â€” Explore: Physics World Gen + NASA Finder

### explore/index.html
- Physics-based procedural planet generation via new WASM gen_planet_maps export
- Tectonic plate simulation (Fibonacci spiral, Voronoi boundaries, convergent/divergent detection)
- Height-latitude biome coloring (ocean, forest, tundra, lava, glacier, cratered per type)
- Gas giant enhancement: Jupiter-like banding, Great Red Spot, chevron patterns
- Cloud generation: Coriolis-based Hadley cells, ITCZ, trade winds, polar fronts
- Displacement mapping (4% rocky, 0.5% gas), normal mapping (1.5x Sobel), cloud layer sphere
- Oblateness: 2-8% gas giants, 0.2% rocky
- Hill sphere + Roche limit moon physics (up to 6 moons)
- 22-row data readout: +Oblateness, +Hill Sphere, +Roche Limit, +Tidal Lock, +Magnetic Field, +Surface Pressure, +Tectonic Plates
- NASA System Finder: FIND button â†’ searchable alphabetical list + 2D galaxy map
- Click-to-fly camera animation (SmoothStep) from list or 2D map

### explore/pkg/
- amni_explore_wasm_bg.wasm: 107KB (up from 97KB, physics code added)
- amni_explore_wasm.js: 11KB (new gen_planet_maps export)

### Backups
- Pre-change backups stored at backups/v2.0.0_explore_pre/

## v1.3.0 â€” 2026-03-06 â€” Ko-fi Support Integration

### All Pages (11 files)
- Added Ko-fi "SUPPORT" link (https://ko-fi.com/amnibro) to footer-links on every page
- Footer link styled with `.kofi-link` class (coral #ff5e5b accent)

### index.html
- Added Ko-fi "SUPPORT" button to hero CTA row alongside AMNI-CRYPT and VIEW PROJECTS
- Button styled with `.btn-kofi` class (coral outline, fills on hover)

### css/style.css
- Added `.btn-kofi` button style (coral border/text, coral fill on hover)
- Added `.kofi-link` footer accent style

### Backups
- Pre-change backups stored at backups/v_kofi/

## v1.2.0 â€” 2026-03-05 â€” App Screenshots & Graphics

### New Assets
- `assets/haven/` â€” 14 files: Screenshot_32-37 (phone), 10in_38-43 (tablet), FfNHy.jpg, 6Mxdg.jpg (promo)
- `assets/crypt/` â€” 3 files: feature_graphic.png, icon-512.jpg, amni-scient-header.jpg

### amni-haven.html
- Added `<div class="screenshots">` section before SPECIFICATIONS with horizontal-scroll phone strip (6 screenshots) and tablet strip (6 screenshots) plus dual promo images

### amni-crypt.html
- Added `<div class="screenshots">` section before SPECIFICATIONS with full-width feature graphic and icon/header promo pair

### css/style.css
- Added `.screenshots`, `.screenshot-strip`, `.screenshot-phone`, `.screenshot-tablet`, `.feature-graphic-wrap`, `.promo-pair`, `.promo-img` component styles with hover glow and mobile responsive sizing

### Verbiage Fixes (Fact-Check)
- Homepage tagline changed from "No cloud. No compromise." to "Honest disclosures per product." â€” both Amni-Crypt and Haven use AdMob, Play Billing, and/or FCM (all cloud services)
- Amni-Crypt hero text: removed "No cloud" claim, replaced with transparent disclosure that encryption runs locally and free tier is ad-supported
- Amni-Crypt meta description: removed "military-grade" (unaudited cipher, no certification)
- Amni-Crypt OG description: added "(ad-supported)" qualifier
- Amni-Crypt GET section: clarified "all encryption features included at every tier"
- Amni-Haven description: replaced "No third-party cloud. No message scanning." with transparent FCM/AdMob disclosure
- Amni-Haven GET section: added "(ad-supported)" qualifier
- Homepage project card for Haven: removed "Private" qualifier from description (FCM uses Google Cloud)
- Terms page title: changed from "Amni-Crypt" scoped to "AMNI-SCIENT" site-wide scope
- Privacy hub Crypt card: updated description to explicitly mention AdMob data collection

### Coloration Fixes
- Haven theme changed from #64b5f6 (light blue) to #7c5cfc (purple) â€” matches Haven app's actual default accent and distinguishes from Crypt's blue
- Haven SVG icon colors updated to match new purple theme
- Haven inline link colors updated from light blue to purple
- Homepage project cards now show per-app accent colors (Crypt=blue, Haven=purple, AI=amber, Core=red)
- Privacy hub Crypt card fixed from #00ff9d (default green) to #4da6ff (Crypt blue)
- Privacy hub Haven card updated to #7c5cfc (new Haven purple)

### Documentation
- README updated with full page listing and theme color table
- Backups stored at backups/v1.0.0

## v1.0.0 â€” 2026-03-03 â€” Initial Site
- Site launched with pages for Crypt, Haven, AI, Core
- Per-product privacy policies
- GitHub Pages deployment via CNAME
- Date: 2026-03-13
- Version: v3.2.0
- Description: Interactive improvements for Learn app + UI fixes + Money string bug fix.

## [3.2.1] - 2026-03-13
### Added
- **Pre-K Reading Game:** Refactored Level 1 reading to play letter sounds using \speechSynthesis\ and show visual letter choices for toddlers.
- **Pre-K Animal Game:** Overhauled Animals & Nature Level 1 to play animal sounds and give visual emoji choices rather than text words, since pre-k students can't read.

### Changed
- **Level Gating:** Hid the 'Money' and 'Clock' games completely on Level 1, as they are too complex for pre-k.

### Fixed
- **Object Error:** Fixed string interpolation bug breaking the Money game formatting on the main screen. 

## [3.2.2] - 2026-03-13
### Added
- **WebAudio Animals:** Synthesized fully dynamic animal noises using the WebAudio API oscillators. The toddler game now plays real math-generated animal sounds (Moo, Woof, Meow, Oink, Baa, Quack, Neigh, Ribbit) instead of text-to-speech reading the sound words aloud!

### Changed
- **Readability:** Changed the quiz prompt text color in lighter modes to a crisp navy blue (#2c3e50) to fix contrast issues against white backgrounds.

