## 2026-08-04 — v1.18.1 Module app polish: brand type in the tools themselves

- Five module apps moved off the all-mono terminal look onto the brand type system, keeping
  mono where it earns its place (inputs, values, code) and their own accent identities:
  - **calc app** (calc/index.html): --font -> Archivo/Segoe UI Variable Text; new --mono for
    inputs/outputs/code; radii 8/9/999px -> 3px; tabular numerals on body; tracked labels.
  - **construct hub**: base type -> sans (--sans), mono kept for prices/numbers; radii 12/13
    -> 4px, pills -> 3px.
  - **amni-llm loader**: sans UI + mono for logs/stats; radii unified.
  - **prayer app**: UI chrome 'Segoe UI' -> Archivo stack (Georgia verse serif untouched —
    that is content, not chrome).
  - **golf**: --font -> Archivo stack.
  All five load the self-hosted Archivo face via /assets/fonts (absolute path works from any
  depth). Headless-verified: calc disclaimer + construct hub render in brand type.

## 2026-08-04 — v1.18.0 User-feedback pass: density, framed media, calculators up front

External user feedback: "Scaling feels way off — can't get enough information on-screen.
Images feel like they wrap off the side of the screen (no padding). Clicking Calculators
should show a list of calcs — instead I scroll way down."

- **Calculators up front.** amni-calc.html now opens: compact hero -> "ALL 37 CALCULATORS" —
  a dense, grouped module index (Mechanical / Fluids & thermal / Electrical & electrochem /
  Shop & field / Reference & tools), every row linking its calc/<module>.html page, arrow
  affordance, suite CTA under it. Generated from the module pages' own titles. Marketing
  content moved below the list.
- **Density pass.** pp heroes: padding clamp(5rem,13vh,8rem) -> clamp(3.25rem,7vh,4.5rem),
  h1 down a step; pp sections clamp(3rem,7vh,4.5rem) -> clamp(2rem,4.5vh,3rem); h2 down;
  ptile min-height 76svh -> 52svh with tighter copy padding; home tiles 92svh -> 74svh with
  smaller h2; wordmark cap 12.4 -> 10.4rem. Roughly a third more information per screen.
- **Framed media.** Tile and ptile images/videos no longer run edge-to-edge: the media half
  is a padded flex frame (clamp .9-1.6rem) and the shot sits inside a hairline-bordered,
  radius-2 panel. First attempt used absolute inset + the old scale-push zoom, which blew the
  image over its frame — the zoom is a full-bleed-era holdover and is removed; framing is
  flow-layout (bulletproof). Verified headlessly with a fresh profile (the first re-render
  silently served cached CSS — same query key, same profile; deleted both).
- Re-key b260.

## 2026-08-04 — v1.17.4 Text-weight sweep + Adam chart animations

- **Adam deeper cut: 1,017 -> 895 words**, and the charts now move. Two new mini-charts under
  The Lift — "Repeat a question" (80 s vs 0.08 s, ~1000x) and "VRAM to serve" (14 GB fp16
  full-load vs 4 GB GF(17) hot set) — same bar language as the bench chart. All bars grow in
  on scroll (animation-timeline:view, scaleX from the left), and the stat-tile numbers count
  up on first sight (IntersectionObserver, 900 ms ease-out; both respect reduced motion).
  Six feature rows of the spec table became a chip strip.
- **Sweep across 13 product pages:** section intros cut to their first sentence when long,
  and any paragraph over ~380 plain characters (the AdSense-era "what is encryption"
  educational blocks) cut to its lead sentence — the funding correction removed their reason
  to exist. Biggest drops: learn 764->558, crypt 844->642, haven 824->635, calc 1334->1176,
  life 781->704, llm 784->667, weather 759->665, explore 811->708, core 927->856.
  Tag-balance verified on all 14 edited pages.

## 2026-08-04 — v1.17.3 Amni-AI page: 3,275 words -> 1,017, visuals lead

Review: "amni-ai is a good example of WAY too much text and not enough visuals/straightforward
charts." Rebuilt the body: every section is now a chart, table, screenshot grid, flow strip,
or stat tiles with a one-line caption. The MMLU-Pro bar chart leads ("THE LIFT"), the two
comparison tables trimmed to their sharpest 5-6 rows, the install cards cut to command + one
line, the file-verify flow + persona/safety essays compressed into footnote lines and the spec
table, and the spec table's paragraph-cells cut to one-line values. No numbers changed — every
stat on the page was already there. Table/bar colors made theme-aware (hardcoded #ffb74d ->
var(--accent)) so the Adam column is legible in light. 12 sections -> 10.

## 2026-08-04 — v1.17.2 Bio correction: Anthony Reffelt, mechanical engineer + LinkedIn

- v1.17.1 wrote "electrochemical engineer" — wrong. Anthony is a **mechanical engineer**
  (Senior ME). Bio now credits **Anthony Reffelt** (Amnibro) by name, linked to his LinkedIn
  (linkedin.com/in/anthony-reffelt-87181059), card back to MECHANICAL ENGINEERING with
  additive manufacturing added.
- Organization JSON-LD founder on index + about: "Anthony Reffelt", alternateName "Amnibro",
  sameAs LinkedIn.

## 2026-08-04 — v1.17.1 About page: legible portfolio colors, funding + bio corrections

- **Portfolio colors were dark-theme neon hardcoded inline** (#f0c33c, #00ffaa, #00d4ff …) —
  invisible on the new light default. All 31 spots swapped to the theme-aware `.p-*` classes
  (deep tones in light, bright in dark; both defined in style.css since v1.6).
- **Funding corrected in both places it was claimed:** the story paragraph and the
  "SUSTAINABLE MONETIZATION" card said revenue comes from AdSense/AdMob ads + premium tiers.
  Reality per Anthony: development is funded personally, out of pocket, plus optional Ko-fi
  donations — card retitled "PERSONALLY FUNDED". faq.html's "How does Amni-Scient make money?"
  aligned to the same (with a one-line nod to Braid's paid beta so it can't contradict the
  pricing page). App privacy policies untouched — they disclose SDK presence, not funding.
- **Bio:** "a mechanical engineer" → "an electrochemical engineer"; background card retitled
  ELECTROCHEMICAL & MECHANICAL ENGINEERING with electrochemical systems added.

## 2026-08-04 — v1.17.0 Uniform format everywhere + Explore glow-up

Review: "quite a few pages don't have the same format; the modules themselves as well;
the explore module could use a massive glow up."

- **Every page on the system now.** pp editorial layout extended to `.hero` pages (about,
  faq, privacy hub, licensing, research — eyebrow above wide title, left CTAs, banded
  numbered sections), plus terms + braid-welcome/topup, and the three custom heroes
  (prayer `prayer-hero`, weather `wx-hero`, amnitex `overview-hero`) converted to
  `product-hero`. Legal doc column widened onto the band grid.
- **Modules too:** all 37 `calc/*.html` module pages + learn SEO pages + research subpages
  carry `pp` (57 files) — banding, numbering, left alignment, light default. The calc page
  generator (`src/gen-calc-modules.js`) stamps `pp` + light so regenerated pages stay on
  system.
- **Explore glow-up (shell — engine is obfuscated by design):** self-hosted Archivo wired
  into the HUD (condensed caps everywhere: labels, buttons, panel titles), deeper glass
  panels (gradient sheen + saturated blur + layered shadow), tuned palette (#5BC8FF cyan,
  brighter dims for legibility), a branded loading screen (AMNI-EXPLORE wordmark +
  STELLAR CARTOGRAPHICS + wider bar), a vignette + bottom-glow atmosphere layer over the
  canvas, a subtle saturate/contrast grade on the starfield (disabled on touch devices),
  and an `← AMNI-SCIENT` plate. No engine/JS identifiers touched.
- **Way home from every app:** amni-life topbar plate, construct hub plate; calc app and
  weather already had one; game got its in v1.15.
- Re-key `?v=b250` (125 files). Backups `backups/v1.17.0_uniform/`.

## 2026-08-04 — v1.16.0 Product pages on the Home idiom; light by default

Review: "Title -> subtitle -> chart -> fluff -> KPIs reads AI-generated. Make product pages
read like Home: minimal text, self-explanatory visuals, concise info. Light default with a
dark button. Better section separation."

- **`.ptile` — the Home tile idiom inside product pages.** Injected on 13 product pages
  directly under the hero: full-bleed split (serif one-liner + four square-marker facts on
  the left, edge-to-edge product media right), same scroll choreography as Home. Copy mined
  from the old index wheel data — already concise, already human.
- **Full-bleed striped bands.** `body.pp section` is now full-width with content locked to a
  1240 grid via padding math; even sections sit on `--bg2` with hairline tops. Sections read
  as bands, like Home's tiles — not floating centered columns. `.stat-row` KPI strips hidden.
- **Light is the default everywhere on the marketing system** (112 pages): `data-theme`,
  the `||'dark'` fallback, and the initial `theme-color` all flipped; the toggle shows DARK
  top-right and localStorage still wins for returning visitors. Apps (learn hub, weather,
  life, game) keep their own theming. The Braid film band stays cinema-dark by design.
- amni-ai's dead remote architecture image (404 + a third-party request) removed in v1.15.1.
- Re-key `?v=b240` (125 files).

## 2026-08-04 — v1.15.0 Editorial product pages + six product fixes

Review: learn badge overlap, /braid 404 from the nav, PROJECTS mojibake, no way back from
the game, weather performance, the connect logo, amni-life "super incomplete", and product
pages still centered/AI-looking.

- **Editorial product layout (`body.pp`, 21 pages).** Product heroes are left-aligned
  editorial blocks — eyebrow above a wide-cut title, CTAs left — and every section h2 is
  left-aligned with a small leading section counter (real numbering, CSS counters). The
  centered inline styles (`text-align:center`, `margin:0 auto`, centered CTA rows) were
  stripped mechanically. Sections widened to 1240.
- **PROJECTS mojibake:** the dropdown caret was a raw `▾` in style.css; some decode paths
  (live b220 served it cp1252) rendered `â–¾`. Now the ASCII escape `\25BE` — the file is
  pure ASCII, the failure class is gone. (A first attempt wrote 0x15 into the file — shell
  transport ate the backslash; rewritten byte-safe via chr(92).)
- **/braid 404:** live `/braid` is 200 (GH Pages extensionless) — the user likely hit the
  deploy window. Added a branded `404.html` with a smart redirect: known extensionless slugs
  bounce to their `.html`, everything else gets a designed not-found page. Heals every
  transient/edge case sitewide.
- **Game:** header now carries an explicit "← ALL PROJECTS" plate + the AMNI-SCIENT wordmark
  (v1 and v2).
- **Amni-Life — found the real bug.** The app's global `canvas{width:100vw;height:100vh}`
  rule also hit the 180px `#minimap` canvas, stretching it fullscreen — and its
  `backdrop-filter: blur(10px)` fogged the ENTIRE app. Everything looked permanently
  out-of-focus. Fix: explicit 180px size on `#minimap`. Also sharpened the node sprite
  (crisp core + tight halo, 256px) and bumped the PWA cache to v0.26.1 so installs pick it
  up. Product page: standard hero/system buttons and two fresh in-app screenshots
  (constellation, labels+minimap) captured post-fix.
- **Amni-Weather perf:** wind + hazards RAF loops now idle when the tab is hidden; wind
  particles 380 -> 300; overlay budget dpr ≤1.5 × ovScale 0.5 (was ≤2 × 0.6 — ~44% fewer
  overlay pixels per repaint on hiDPI). Shipped as `wx-boot.139.js` with all module
  imports re-keyed `?v=139`. Zero console errors.
- **Amni-Connect:** the wavy "E2EE" doodle mark replaced with a clean two-displays-linked
  stroke mark.
- **Amni-Learn:** the NEW badge no longer overhangs the card corner (inset 9px, 3px radius,
  flat #ff3b7f, no glow); SW cache bumped v1287.
- Re-key `?v=b230`. Backups in `backups/v1.14.0_consistency/`.

## 2026-08-04 — v1.14.0 Consistency pass + film re-cut + Braid app type (staged)

Review: "font, format, and layouts are inconsistent, as well as the button borders. The video is
text heavy with no smooth transitions. The font in the program for Braid itself is not primed for
maximum legibility."

- **One nav, one footer.** 42 root pages carried six different nav variants (most had no
  CALCULATORS/LEARN/RESEARCH, SEO pages had a BRAID link, symphony its own). Every root page now
  carries the canonical index nav — full PROJECTS dropdown, per-page active states preserved
  programmatically — and the canonical 6-link footer (40 pages).
- **One radius system.** Focus ring 6px -> 2px (was rounder than the buttons it rings), dropdown
  13px -> 3px and its items 2px, support pill and hero chips 999px -> 2px plates, privacy-card
  badge matched to the card badge (sans, square, transparent), scrollbar squared, screenshot
  frame imgs 13/9px -> 3/2px. Phone-frame 22px kept — device mock is semantic.
- **One display face.** `.product-hero h1`, `.hero h1` and `.legal h1` join the wide axis
  (112%, w800, −.005em) that the index wordmark and Braid title already use — display = wide,
  section heads = condensed, one rule everywhere. Dead `#hero-wheel` block (24 rules) deleted;
  only hero-proto.html referenced it.
- **Film re-cut (v9).** The seven hard cuts are now 0.5s crossfades (video xfade + audio
  acrossfade), 51.4s -> 47.9s, single-pass re-encode CRF 19 (text stays legible), 6.9 MB.
  Everything on the old timeline retimed: chapter buttons (data-t + shown times), chapters VTT,
  captions VTT (11 cues remapped t−0.5k with overlap clamping), JSON-LD Clip offsets, PT48S,
  uploadDate, film-dur pill, poster re-pulled at the same frame (t=11.5 new timeline), homepage
  loop clamp 4–47 -> 3.5–43.5. Blend frames verified at four boundaries.
- **Chapter seek hardened.** start() now retries the seek via progress/canplaythrough until
  v.seekable covers the target — python http.server serves no ranges, which exposed that a seek
  fired at loadedmetadata clamps to 0 on any range-less host. Verified against a local
  Range-capable server (206s): first seek lands 31.3, mid-play second seek lands 21.1,
  aria-current tracks. Live host serves Accept-Ranges (verified v1.11).
- **Braid app (Amni-Delve, staged for 3.5.55):** web/index.html is the UI source of truth
  (_build_ui.py is stale — old midnight shell; do not run). Scient dark+light `--font` now leads
  with "Segoe UI Variable Text" (optical body cut; Display was set — a headline cut at 14.5px),
  mono leads with Cascadia (SF Mono first entry was mac-only). Base 14.5/1.5 -> 15/1.6 with
  tabular-nums + antialiasing; message leading 1.62; code 13px on --font-mono; seat name 12.5;
  micro-type floor raised across 28 rules. VERSION -> 3.5.55; not built/signed/published.
- Re-key b210 -> b220 (124 files) + generator stamp. Zero console errors (browse, about, braid,
  privacy-haven). Backups `backups/v1.14.0_consistency/` + Amni-Delve
  `backups/index.html.v3.5.54-pre-type.bak`.

## 2026-08-04 — v1.13.0 Split tiles, wider grid, Braid film overhaul

Follow-up on v1.12.0 from review: "overlapping text with images-with-text is cluttering,
layout not fully using the space, braid video needs an overhaul to better showcase the
product and the animated logo."

- **Tiles: overlay -> split.** Text over UI screenshots was text-on-text. `section.tile` is now
  a two-column grid — copy column (43%, tinted radial wash, vertically centred) and a media
  column filling its half edge-to-edge — alternating via `.right` (order swap). The scrims are
  gone entirely, media runs unfiltered, and copy inherits theme colours, so tiles now read
  correctly in light mode too (light copy panel against the dark media half). Mobile stacks
  media (16/10) above copy — no overlay anywhere. `.tile-body` renamed `.tile-copy`;
  `tile-push` softened 1.09→1.
- **Wider grid.** Masthead, directory, creed, sec-heads 1180 -> 1420; `section.wide` 1480;
  wordmark cap raised to 12.4rem. Tiles are full-bleed by construction.
- **Braid page: the film is now the centrepiece.** Hero is full-viewport so the animated braid
  mark (enlarged to min(780px,92vw)) presents as the identity moment, with a scroll cue to
  #film. The film section became a full-width cinema band (#060709, stays dark in light theme):
  left-aligned header row, the 16:9 player, and a numbered chapter rail docked to its right —
  eight `01–08` rows with title + timestamp that seek on click and track playback via
  `aria-current` (inset accent bar). Under 1000px the rail becomes a horizontal scroll strip.
  Same buttons, same data-t/JS contract, VideoObject Clip markup untouched.
- **Animated braid divider.** The braidSVG generator now also renders any `.braid-hr` host —
  a thin three-strand flowing braid sits above GET BRAID. Reduced-motion already freezes it
  (`.bflow{animation:none}`).
- **Homepage braid loop clamped to the good part.** The tile video seeks to 4s on metadata and
  wraps at 47s, so the background loop always shows the product, never the title/end cards.
- Cache re-key b200 -> b210 via exact-string replace (124 files; the regex approach is retired).
  Verified: dark+light, 1440 + 390 (proper mobile emulation — the earlier 390 "resize" was
  clamped to 500 by the window minimum and hid nothing), chapter seek + aria-current live,
  zero console errors/warnings on index and braid. Backups `backups/v1.13.0_split_tiles/`.

## 2026-08-04 — v1.12.0 Site identity: own typeface, full-bleed product tiles, mojibake fix

Brief: mojibake on /braid, and "the site screams made by AI — I want a top-tier look, nice
transitions, non-AI layout." Reference supplied mid-pass: **spacex.com** — big media tiles,
concise text, products revealed on scroll, clean top bar, a typeface of our own.

- **The mojibake was live-only.** The working copy was 6 commits behind `origin/main`, so a
  local scan came back clean while `curl https://amni-scient.com/braid.html` showed three
  hits. After pulling: `braid.html` had `â€"` x2 (em dash, in the beta-note and the top-up
  paragraph) and `•` x1 (the `.plan li::before` bullet) — a UTF-8 string that had been
  round-tripped through cp1252. Repaired to `—` / `•`. Also stripped a UTF-8 BOM from
  `braid.html`, `index.html`, `eula/index.html`, `privacy/index.html`,
  `src/plug_template.html`. Repo-wide re-scan of 437 html/css/js: **zero remaining**.
- **A typeface of our own (was: the Segoe UI system stack).** Self-hosted **Archivo variable**
  (`wdth 62–125`, `wght 100–900`, latin + latin-ext, 176 KB) and **Source Serif 4 variable**
  (120 KB) under `assets/fonts/` — no third-party font request, so the privacy-first claim
  still holds. One superfamily used at three widths encodes the hierarchy: `wdth 80` uppercase
  tracked for nav/labels/eyebrows/data, `wdth 100` for UI, `wdth 112–118` for display and the
  wordmark. Source Serif is a technical-documentation serif and is scoped to reading matter —
  prose blocks, legal pages, tile body copy, feature descriptions — never to UI chrome.
- **Palette off the AI default.** Near-black + neon acid green (`#00FF9D`) is one of the three
  looks that read as generated regardless of subject. Ground moved to cool graphite
  (`#08090B` / `#111418`) and the studio accent to machined brass (`#C89B4E` dark,
  `#8A6318` light) — low-chroma on purpose so seventeen product colours can sit against it
  without fighting. Light theme cooled from cream to `#F3F2EF`. Radii `14/10/7px` → `4/3/2px`.
  Per-product `theme-*` accents preserved; added `theme-braid` (violet `#A88FE8` / `#5A48B0`)
  so /braid stops wearing Amni-AI's orange against its own violet mark.
- **The two structural AI tells removed site-wide.** `section h2::after` — the little centred
  accent dash under every heading — is now `content:none`. And **99 emoji feature icons across
  16 pages** (🔒 ⚙ 🛡 🔎 🌐 …) are now a hand-drawn 1.4px stroke SVG set that takes the page
  accent, sitting under a 2px accent rule instead of in a tinted rounded chip. Mapping script
  kept at `scripts/deemoji_icons.py`. `.features` / `.features-2x2` are hairline grids now, not
  rows of floating rounded cards.
- **index.html rebuilt as a scroll of full-bleed product tiles.** The emoji carousel wheel is
  gone. A 100svh masthead (wordmark set in Archivo at `wdth 118`, two-line lockup with a brass
  tick standing in for the hyphen, drafting-grid ground, a four-field spec strip: 17 products /
  no install / no sign-up / zero trackers) then nine tiles — Braid, Amni, Amni-Calc, Adam,
  Amni-Weather, Amni-Explore, Amni-Construct, Amni-Learn, Amni-Core — each full-bleed media,
  alternating side, headline in condensed caps at up to 5.2rem, one line of copy, a spec row
  and its CTAs, tinted by `--tint` per product. Everything else moved into a hairline directory
  index (8 products + 6 most-used references), and the 2x2 emoji "PHILOSOPHY" grid became a
  three-row manifesto in serif.
- **Media.** Captured what was missing rather than shipping placeholder tiles: Amni-Weather
  (global temperature layer over Carto Dark), Amni-Construct (the 3D deck builder with its live
  estimate), Amni (title screen, canvas promoted to full viewport). Braid's tile poster is a
  frame pulled at t=12s (`ffmpeg`) instead of the film's title card, which was repeating the
  headline underneath it. The 5.3 MB demo is `preload="none"` and only gets a `src` when an
  IntersectionObserver says the tile is 200px away; it pauses when it leaves.
- **Motion.** Cross-document view transitions (`@view-transition{navigation:auto}`); tile media
  scale-pushes 1.14→1.02 and tile bodies rise on `animation-timeline:view()`; index rows stagger
  in; buttons fill by a `scaleX` sweep from the left rather than lifting; the nav sits transparent
  over the masthead and docks (blur + hairline) past 40px via a rAF-throttled scroll listener.
  Under `prefers-reduced-motion` every animation collapses to its end state — verified no content
  is left at `opacity:0`.
- **Verified.** index + braid + amni-calc + about + terms + calc/bolts, dark and light,
  1440 / 390. Fonts confirmed loaded (`document.fonts`: Archivo `62%–125%`, Source Serif 4).
  Focus rings visible (2px solid accent). 437 files re-scanned for mojibake, zero. Structural
  check found 6 pre-existing anomalies, none introduced by this pass; closed the missing
  `</html>` on `amni-crypt.html` and `amni-haven.html` while in there.
- **Regression caught in-pass:** the cache re-key regex `(style\.css)(\?v=…)?` also matched
  `element.style.cssText`, rewriting 710 occurrences across 41 JS files (learn-app.js alone had
  382). Restored, and `weather/tools/_wire134.js`'s stamping regex widened from `\d+` to
  `[A-Za-z0-9._-]+` so a non-numeric key cannot double-append.
- Re-key `?v=b200` site-wide (834 refs / 164 files). Backups `backups/v1.12.0_site_identity/`.
  Checklist `docs/checklists/checklist_site_identity_v1.12.0.md`.

## 2026-07-28 — v1.9.0 Calc app Braid skin + ship pending v5.86.1 Schnorr set
- **calc/index.html (source of truth, edited directly per rule):** :root tokens swapped to Braid — dark #0A0B0E/#13161C/#181C24 borders #242832/#313641 accent #FF8A5E, light = paper #FBFAF8/#FFF/#F8F6F2 accent #D84315; color-scheme both themes; radii 3px→8px (18) + 4px→9px (8); Google Fonts links removed (local Cascadia/Consolas); light nav rgba matched to paper. App logic untouched — CSS tokens only.
- **Shipped the pending Schnorr/Belleville set** (was uncommitted since v5.86.1 07-14; calc/index.html referenced schnorr-discs.js?v=sch1 which was untracked → would have 404'd if index shipped alone): calc-engineer/fixes/unit-core/units.js edits + schnorr-discs.js + calc/data/schnorr_discs.json + data_schnorr_raw.json + tests/spring_belleville_audit.js. **All 21 node audit suites run green locally before ship.**
- Learn app hub deliberately NOT reskinned: hard-coded colors + body.light-mode per-component overrides across a fragile hand-patched 6k-line file; kid-facing colorful identity is intentional. Learn SEO pages already ride style.css.
- Research pages verified inheriting Braid tokens — no changes needed.
- Backups backups/v1.9.0_app_shells/.

## 2026-07-28 — v1.8.0 Privacy polish + nav-markup repair (Braid round 3)
- **Google Fonts removed from 110 marketing pages** (preconnects + JetBrains Mono css2 link) — no third-party font request; --font-mono rides local Cascadia/Consolas. Privacy-first copy now matches network behavior.
- `<meta name="theme-color">` added site-wide (dark #0A0B0E default); shared toggle script now syncs it (#FBFAF8 in light) — Android chrome tints with the theme.
- **Nav markup bug (pre-existing, live):** amni-crypt / amni-haven / privacy / terms closed `.links` early, orphaning ABOUT/FAQ/PRIVACY outside the styled container (rendered giant purple defaults). Repaired to proper structure.
- **Custom-property gotcha fixed:** `--grad-accent` defined on :root baked green into per-product pages (var() in a custom property resolves where DEFINED, not used) — gradient now inline in .btn-primary so theme-haven etc. get their accents.
- body.home section cards (soft 22px panels on index), product-hero aurora glow + drift, wheel stage hairline panel.
- Re-key `?v=b180` + generator. Backups `backups/v1.8.0_privacy_polish/`.

## 2026-07-28 — v1.7.0 AAA theming + layout pass (Braid round 2)
- style.css depth: `color-scheme` per theme (native form controls/scrollbars match), triple-radial aurora page glow, hero dual drift glows (`hero-drift`, reduced-motion safe), gradient primary buttons w/ inner highlight, feature icons in 52px accent-dim chips, card top hairline warms to accent-glow on hover, animated growing underlines (prose/refs/portfolio links), footer fade-edge hairline, uppercase spec-table headers, nav gains scroll shadow via `animation-timeline:scroll()` (progressive), `[id]{scroll-margin-top}` + `text-wrap:balance`.
- index.html hero: CTA row (EXPLORE CALCULATORS / START LEARNING) + honest stat chips (17 PROJECTS · FREE IN YOUR BROWSER · NO SIGN-UP).
- braid.html: `.film`/`.seatchip` hard-coded dark colors (`var(--line,#1e2430)`, rgba shadows) → tokens; seat chips now panel cards w/ hover lift — light mode correct.
- Re-key `?v=b170` site-wide + generator. Backups `backups/v1.7.0_braid_aaa/`. Checklist `docs/checklists/checklist_braid_aaa_v1.7.0.md`. Screenshot-verified index/braid light+dark desktop+mobile; v1.6.0 live-verified by md5 before this pass.

## 2026-07-28 — v1.6.0 Braid-aesthetic site reskin
- `css/style.css` fully consolidated (3 stacked override generations → 1 clean layer) to the Braid app design language: warm paper/ink light theme (#FBFAF8/#FFF/#E7E3DB rules), Braid dark (#0A0B0E/#13161C/#242832), sans-first type (Segoe UI Variable stack), 14px radii, layered soft shadows, .18s cubic-bezier transitions, backdrop-blur nav, pill controls. Scanlines + grid-bg retired (`display:none`, selectors kept). Every legacy selector preserved — all 39 root pages + calc/construct/learn/research subpages restyle from the one file. Per-product accents kept, plus dark-mode variants and `--accent-ink` for on-accent text contrast.
- `index.html` hero-wheel inline styles de-neoned (pulse/glow animations, icon drop-shadows, hard-coded dark edge buttons removed) so the shared Braid layer wins; panel/cta/refs inherit tokens.
- Inline CTA glow hacks stripped: `amni-calc.html`, `amni-learn.html`, `amni-llm.html`, all `construct/*.html` (`.btn-construct`), and `src/gen-calc-modules.js` template (calc/*.html regenerated pages already clean). calc/index.html app untouched by design.
- **Truth fix:** construct pages claimed materials are "PRICED LIVE AT HOME DEPOT AND LOWE'S" — the tool produces paste-to-fill shopping lists, not live price feeds. Now "WITH PASTE-READY HOME DEPOT & LOWE'S SHOPPING LISTS" (desc lines + deck body copy).
- Cache re-key: every `css/style.css` reference → `?v=b160` (incl. generator). Entity strings untouched (Amniscient, LLC in the 4 canonical places).
- Backups `backups/v1.6.0_braid_reskin/`. Checklist `docs/checklists/checklist_braid_reskin_v1.6.0.md`. Verified by screenshot rounds: index/braid/calc/bolts/about/deck, light+dark, desktop+375px.

## v1.5.1 Site content sweep — stale marketing truth (2026-07-28)
- Comprehensive pass on marketing + hub pages so copy matches live products. Brand stays **Amni-Scient**; entity stays **Amniscient, LLC**.
- **about.html:** dropped “eleven products”; full portfolio (Calc 37, Weather v1.4.7, Construct, Game, Life, Braid, Symphony, AI v6.20+, Browse v0.10.3, …); weather in PROJECTS nav.
- **amni-weather.html + privacy-weather.html:** version **1.4.7**; slippy maps + pin forecast + NWS/GDACS; removed demo-mode claims; pack/live fallback; US units default; privacy last-updated 2026-07-28.
- **amni-calc.html:** 31 → **37** modules; cards for beam/fits/machining/hydraulics/rigging/CAD; Belleville catalog + modern spring types.
- **amni-browse.html:** Media pillar no longer “v0.5+ roadmap” — Servo + WebView/GStreamer media path (v0.10.3).
- **index.html** hero wheel: weather/life/calc/browse copy; **faq.html** calc list + weather section + Browse status; **sitemap.xml** braid/AI/life/symphony/research.
- Backups `backups/v1.5.1_content_sweep/`. Checklist `docs/checklists/checklist_content_sweep_v1.5.1.md`.

## v1.5.0 Amniscient, LLC entity rollout (2026-07-25)
- Legal owner of every product is now **Amniscient, LLC** (NY domestic LLC). Display brand stays `Amni-Scient` — nav/titles/canonical/domain untouched, so no SEO churn.
- Entity strings live in exactly four places: page copyright footers, `terms.html` G0/G8/G9 + C1, `privacy.html` controller line, and JSON-LD `legalName`. Anything else saying "Amni-Scient" is brand, not entity, and G0 binds those references to the LLC.
- `LICENSE` files (site + Amni-Ai + Amni-Browse + Amni-Connect) name the LLC. NOTE: copyright *notice* changed; an IP assignment from Anthony Reffelt personally to the LLC is what actually transfers title.
- Learn-Mobile `src/main/assets/learn/*.html` are mirrors of `learn/` — footer edits must be applied to BOTH or the app ships a stale entity.
- Deliberate non-targets: paper bylines, third-party map attributions, `build/intermediates` generated copies.
## weather-pack CI race fix (2026-07-21)
- Failure mode: bake OK, commit OK, `git push` rejected (non-FF vs concurrent main). Workflow now rebases onto `origin/main` and retries push.

## v1.4.7 Amni-Weather defaults + international alerts (2026-07-20)
- No hardcoded home city: world view until locate; browser geolocation → client IP geo (geojs/ipwho) → search; last place + units in `localStorage` (`amni-wx-prefs-v1`).
- Default units **US** (°F/mph/in/mi); SI still toggleable.
- Hazards: keep NWS (US) + **GDACS** Orange/Red global (TC/FL/VO/WF/DR/TS/ET/EQ).
- Search: broader country-code parse (EU/APAC/LatAm/etc.) for non-US places.
- Boot `wx-boot.138.js`; backups `backups/v1.4.7_weather_defaults_intl/`.

## v1.4.6 Amni-Weather LOD + pack anti-tile (2026-07-18)
- Live LOD re-fetch on zoom/pan; denser sample plan; k-NN IDW + smooth/upsample.
- Pack 288x144 smoother bake + enhanceField; Field smooth wired. Boot `wx-boot.134.js`.


## v1.4.5 Live-only map + sane ranges + smooth fields (2026-07-18)
- Legend/range floors: visibility, wind, precip, CAPE, UV, humidity never autorange negative; pressure/temp bounded.
- UI: removed Pack/Demo mode buttons — always Live (`↻ Live`); silent global-field fallback if API busy.
- Live field: denser Open-Meteo lattice + IDW raster up to 360×180 (not nearest-neighbor mega-tiles). Boot `wx-boot.133.js`.
## v1.4.4 Amni-Weather CORS hazards + glass UI (2026-07-18)
- Fix NWS/USGS CORS: stop sending `User-Agent` / custom headers (preflight blocked `useragent`).
- Glass UI polish to match design target: softer panels, pill search/modes, cyan SI/US, denser checks, rounded timebar.
- Boot `wx-boot.131.js`, `style.css?v=131`.
## v1.4.3 Amni-Weather CDN 404 bust — ref/forecast (2026-07-18)
- Live 404 on `ref.js?v=129` / `forecast.js?v=129` was **cached 404** (Fastly/GH Pages max-age 4h), not missing source — modules shipped in 5021333.
- Boot `wx-boot.130.js` + `?v=130` imports; `ref.js` cache param; index + stubs re-export 130.
- CSP `script-src` / `connect-src` messages are **report-only** (no block).
## v1.4.2 Zoom schedule fix + pinch + wind trails (2026-07-18)
- `schedule()` now ORs full-render flags so pan no longer drops zoom redraws.
- Pinch-to-zoom (two pointers); normalized wheel delta; +/- still work.
- Wind: pause while pan/pinch, reseed on view shift, cap trail segment length (no more streak glitches). Boot `wx-boot.128.js`.

## v1.4.1 Amni-Weather mobile shell + soft API status (2026-07-18)
- Mobile: bottom dock (Layers / Forecast / Point / Map), one bottom sheet at a time, backdrop dismiss; layers/forecast no longer stack over map.
- No auto forecast fetch on mobile boot (API on demand only). Soft rate-limit copy (no "switch to Pack" scare when pack is fine).
- `body.wx-mobile`, toast status auto-hide. Boot `wx-boot.127.js`.

## v1.4.0 Amni-Weather point forecast panel — UV, surf, air, hourly/daily (2026-07-17)
- `meteo.js`: `fetchPointForecast` single-point Open-Meteo (hourly+daily 7d, marine waves/swell/SST, air PM/AQI), 15m cache, circuit-aware.
- `forecast.js`: Now / Hourly / 7-day / Surf / UV·Air tabs, WMO icons, UV bands, surf star score, sparklines.
- UI `#forecast` panel follows pin; Open forecast + refresh/collapse. Boot `wx-boot.126.js`.

## v1.3.0 Amni-Weather click pin + cities LOD + borders (2026-07-17)
- **Click pin:** pulsing marker + floating chip (place, layer value, coords); panel `Selected location` + Clear pin; toggleable.
- **Cities LOD:** `ref.js` vector labels by pop/zoom (capitals early, denser as you zoom) — works on satellite.
- **Borders:** Natural Earth 110m countries + state lines (`weather/data/ne_*`), toggleable; gold-ish states on sat, cyan on dark.
- **Boot:** `wx-boot.125.js`; canvas `#ref` above hazards. Backups `backups/v1.3.0_ref_pin/`.

## v1.2.0 Amni-Weather UX: search suggest, geo, grouped tabs, probe infographics (2026-07-17)
- **Search:** Open-Meteo geocoding `count=6`, 280ms debounce suggest dropdown, keyboard ↑↓/Enter/Esc, lat,lon parse, multi-hit picker.
- **Locate:** `◎` button + boot auto-geolocation; reverse label via BigDataCloud client API; prefill search + map pan/zoom + probe.
- **Left panel:** collapsible groups (Basemap / Atmosphere / Moisture / Dynamics / Solar & air / Appearance / Reports) with animated chevrons + `grid-template-rows` open; layer buttons with ripple hover + active pop glow.
- **Infographics:** probe multi-metric cards with mini bars, feel summary line, legend mid tick + kind cue strip.
- **Boot:** `wx-boot.124.js`; stubs 121–123 / app / wx-app re-export 124. Backups `backups/v1.2.0_weather_ux/`.
# Architecture Map — amni-scient.com

## v1.1.3 Amni-Weather LOD + wind/isobars + geo fix (2026-07-17)
- Geo: success+error callbacks. LOD tiers in `meteo.js`. Wind particles `wind.js` + pressure isobars. NWP roadmap `weather/docs/NWP_ROADMAP.md`.

## v1.1.1 Amni-Weather live meteo hardened (2026-07-17)
- `weather/meteo.js`: single forecast multi-var pull (retry/429 backoff), air + marine side packs, viewport+global lattice, progressive `onPartial`, station probe. ~40 forecast + AQI + marine layers. Avoids prior multi-pack 429 live failures.

## v1.1.0 Amni-Weather slippy maps (Drive tiles) + color custom (2026-07-17)
- `weather/tiles.js` mirrors Amni-Drive `TileStore` URLs: Esri satellite, OSM, CARTO dark/light, OpenTopoMap.
- Canvas slippy map + weather overlay; fractional zoom + inertia. Color: presets, stop pickers, gamma, soft mask.
- WASM field engine retained for IDW/upsample/smooth. Live Open-Meteo global grid.

## v1.0.2 Amni-Weather real Earth + global fields (2026-07-17)
- Basemap: vendored NASA Blue Marble / topology / water / night under `weather/assets/`. Field = full equirectangular Float Red DataTexture + GLSL colormap shader. Global multi-point Open-Meteo (chunked). Globe + flat views.

## v1.0.1 Amni-Weather boot fix (2026-07-17)
- Blank white “Booting…”: `/weather` without slash broke relative assets. Fixed with trailing-slash redirect + absolute `/weather/*` paths + local Three.js vendor (no CDN). Boot error banner for module failures.

## v1.0.0 Amni-Weather — multi-layer interactive weather maps (2026-07-17)
- **Product:** `amni-weather.html` (SEO/marketing) → app `weather/` (fullscreen globe maps). Privacy: `privacy-weather.html`.
- **Render:** Three.js r160 WebGL2 sphere + weather overlay `DataTexture` (512×256), orbit controls, graticule, atmosphere, starfield.
- **Compute:** Rust crate `weather/wasm` (`amni_weather_wasm`) → `weather/pkg` via wasm-pack. Exports: `idw_grid`, `upsample_bilinear`, `smooth_box`, `render_field`, `sample_bilinear`, `field_stats`, `synthetic_field`, unit converters, heat-index/wind-chill/dewpoint helpers, palette catalog.
- **Shaders:** `weather/shaders/field.frag.glsl` (active WebGL path intent) + `weather/shaders/field.wgsl` (WebGPU colorizer contract). v1 colorizes in WASM CPU LUT → RGBA texture for maximum compatibility.
- **Data:** Live = Open-Meteo multi-lat/lon hourly forecast (7 days) for regional lattice around map center + Open-Meteo geocoding. Demo = WASM synthetic fields. JS fallback engine if WASM fails to load.
- **Layers (20):** temp, apparent, dewpoint, RH, precip, snow, wind speed/gust/dir, MSLP, clouds, visibility, CAPE, UV, SW/direct/diffuse rad, soil 0cm, VPD, ET₀.
- **Site:** index hero wheel entry `weather`, PROJECTS nav across product pages, sitemap URLs for product/app/privacy.

## v5.86.1 Amni-Calc Schnorr disc DB + US unit leak fix (2026-07-14)
- **Schnorr Product Range US** parsed into `calc/schnorr-discs.js` + `calc/data/schnorr_discs.json`: **204** standard-material C75S/51CrV4 discs (DIN EN 16983), De 6–200 mm, published F@0.75h₀ and F@flat (lbf→N), art. nos., series A/B/C, bolt ID guess. Presets + AUTOSELECT pull from this table (not synthetic McMaster SKUs).
- **US unit system**: `UCORE` display helpers (`fDisp/lDisp/kDisp/pDisp` + scales); engineer layer TOK gains `N/mm`↔`lbf/in`; `__usys` now flips **native** `select[id$="-u"]` inputs (was only auto-attached dropdowns) and fires `amni-units-sys` so springs/bolts recalculate; spring results + F–δ axes render in active system so US mode does not leave bare “N” on curves/results.
- Cache: unit-core/units `?v=units2`, fixes `?v=eng23`, engineer `?v=eng18`, schnorr `?v=sch1`.

## v5.86.0 Amni-Calc Belleville catalog + op-point/viz fix (2026-07-14)
- **Root cause of “op point off curve”**: pure Almen-Laszlo math was correct (`Fs(dAt(F))=F`), but Plotly axes used fixed `xTop/yTop` from curve peak only — when F > F_peak, δ past solid, or stack ops near capacity, the diamond was **clipped outside the axis box** (looked “off the curve”). Helical high-F past solid had the same clip.
- **Belleville pack (calc-fixes.js `?v=eng22`)**: shared `bellGeom` (M/K2/K3, Fs, peak scan, dAt, OM/ID stress); `BELL_CATALOG` 19 DIN-2093-style rows with bolt fit + F@0.75h₀; presets rebuilt from catalog; conical/wave preset sets added; validation requires De/Di/t (not wire d/D); secant k at F; σ_OM/σ_ID/FoS; plot ranges include op + overload vertical “flat” branch; `drawBellAnim` free/loaded true disc sections; stack note flags capacity.
- **⚡ BELLEVILLE CATALOG — AUTOSELECT** (`bvd-card`): force + max δ + OD envelope + bolt → lightest ns×np pack via `bellCatalogPick`; APPLY writes geometry/stack/type. Helical designer hidden while type=belleville.
- **Honest labeling**: catalog is McMaster-*style selection flow* on standard disc dims — not a live McMaster SKU scrape (no invented part numbers).
- **Tests**: `calc/tests/spring_belleville_audit.js` 18 anchors (op on single+stack curves, stresses, pick, overload clamp, snap-through). All 21 suites green (was 20). Backups `backups/v5.86.0_belleville/`.
- **Module validation sweep** (this pass): 21 node audit suites pass; known open finding `beam_audit.js` reports cantilever moment/defl sign still wrong under current FIXSIGN (SS OK) — not fixed here.

## v5.82.0 Amni-Learn baked static voice — PC-generated Piper audio for all phonics/storybooks (2026-07-14)
- ALL phonics scripts + storybook page chunks + story quizzes are pre-synthesized ON THE PC (`tools/voice_bake/`: `gen_tasks.js` slices the REAL `_ttsClean`/`_chunkSpans`/`_ttsBatch`/PHON_*/STORYBOOKS/STORY_QUIZZES out of learn-app.js so keys match runtime byte-for-byte; `bake.py` = piper-tts python API `en_US-hfc_female-medium` → ffmpeg libopus 32k). 763 unique clips, 11MB, `learn/assets/voice/v####.ogg` + `manifest.json` (765 keys `text|speed` — story 0.95, phonics/quiz 1; degenerate no-speech chunks like a lone `'` bake as 0.15s silence).
- Runtime: `_voiceMan` manifest fetched at boot; `_synthWav` = memory → manifest static fetch → `_synthRaw` engine fallback. `_voiceHas(parts,speed)` gates: `_hdSay`/`speakSeq`/`playCurrentPage` play covered content with NO neural engine load at all (no 60MB model download, no wait banner); `initStorybook`/`_toggleTTS` skip `_hdWarm` when manifest present. Word taps stay plain Web Speech (kid presses a word → instant). Engine paths remain intact as fallback for uncovered lines. `_hdLoad(onProg,quiet)` gained quiet flag.
- SW: `assets/voice/manifest.json` precached; clips runtime-cache on first play (generic same-origin cache-first). Word highlight unchanged (duration-proportional, synth-agnostic).
- Probes: `_voice_static_probe.js` (playwright + real baked assets, vendor 404'd: storybook autoplay 7 static fetches + phonics 2, vendorReqs=0, banner absent, 0 pageerrors) + `_tts_perf_worddup_test.js` 24/24 (manifest hit/miss/fetch-fail fallback asserts added). SW v1285→v1286, `?v=v1286`. Backup `backups/v5.82.0_voice_precache/`. Re-bake after content edits: `node tools/voice_bake/gen_tasks.js && python tools/voice_bake/bake.py <model.onnx>`.

## v5.81.0 Amni-Learn TTS perf + word-tap duplicate-voice fix (2026-07-14)
- Word tap (`speakWord`): pauses `_hdAudio` → speaks the word → resumes the SAME audio (never `playCurrentPage(true)` on the HD path, which used to launch a second `_hdReadPage` over the still-playing first = duplicated voices). Tap token `_storyState.wordTok` (incremented FIRST — `cancel()` fires the old utterance's `onend` synchronously) + `_storyState.hdResume` hand resume duty across rapid re-taps; user-paused audio stays paused; web-fallback path keeps cancel+restart (single-channel, no dup). HD-path taps no longer kill `autoplay`.
- Synth latency: `_synthWav` now a promise-cache wrapper (key `text|speed`, cap 120, rejections evicted, in-flight dedupe) over `_synthRaw` (old body) — covers Piper too, not just `_kkBlobCache`. `_chunkSpans` never merges into the FIRST span → first audio = one sentence, not a 140-char blob. `_ttsBatch` join removed → first phonics item speaks immediately, pipeline prefetch covers the rest + paced gaps return. `_hdReadPage` prefetches next page's chunk 0 when the last chunk of the current page starts; `openStorybook` warm-prefetches page 0 chunk 0 when a neural engine is ready.
- Probe: `learn/tests/_tts_perf_worddup_test.js` (19 asserts, slices REAL source: chunking, batching, cache dedupe/rejection, single/double-tap pause-resume). SW v1283→v1284, script `?v=v1284`. Backup `backups/v5.81.0_tts_perf/`.

## v5.80.4 Amni-Learn username input contrast (2026-07-13)
- `learn/learn-app.js` welcome (`#wel-name`) + profile (`#prof-name`) text inputs: white bg + dark text (was rgba white 0.08 + var(--text) — unreadable on dark modal / tablet). SW v1282→v1283, script `?v=v1283`.

## v5.80.0 Amni-Learn Kokoro-primary + Pre-K letter pedagogy (2026-07-11)
- TTS: `_kkCan` default on; `_kkWarm` / `_synthWav` / `_hdSay` try Kokoro first, Piper second; wait banner still blocks stock TTS until a neural path is ready.
- Phonics: `_phonLetterSay` multi-utterance arrays (letter name → isolated sound → letter says → picture word → say-with-me). Blend/rhyme/match share paced arrays. `$('#phon-*)` → `$$`.
- SW v1271→v1272.

## v5.85.0 Amni-Calc: coherence pass (2026-07-10, loop iter 14 — FINAL)
- index.html v-equations: +3 cards (FRACTURE & NOTCHES 6 rows, GEAR TRAINS 4, METERING & REFRIGERATION 4) + lug row in LIFTING & RIGGING → 49 static equation tables. calc-engineer.js (`?v=eng17`): 8 DESC lines updated (fluids/gears/fatigue/stress/cycles/shafts/bolts/rigging) to mention their iters-8-12 cards.
- LOOP CLOSED after 14 iterations, v5.69.0 → v5.85.0: machining module, CAD Studio (7 primitives/booleans/mass props/STL), rigging module, keyways, SEO pages ×6 + hash-router, equations catch-up ×2, conical/wave springs + 3D renders, torus/tube/chamfer, flow metering, planetary + AGMA handoff, fracture/Kt/lug from research sweep, VCC on sourced R134a, DIN 471 on sourced tables, PCC-1 sequences. 481 anchors / 18 suites, every ship live-verified. Remaining by-architecture exclusions: 2D FEA, fracture-materials DB.

## v5.84.0 Amni-Calc: chamfer demo + planetary-AGMA handoff (2026-07-10, loop iter 13)
- calc-cad.js (`?v=cad4`): PRESETS.chamf = flanged bushing + bore + two 45-deg cone cuts (cone r1:10-r2:14 h4 at y15; inverted at y-15 — slope crosses the edge, radius delta = height = 45 deg). Modeler card note states the technique. cad_audit +5 (chamfer ring ~134mm3 band, CoG shift sign, Wt anchor).
- calc-fixes.js (`?v=eng21`): gt-card +gt-t/gt-m inputs; applyPlanetaryAgma -> ag-np=Zs, ag-mg=Zp/Zs, ag-m, ag-wt=2000T/(np.m.Zs) (torque splits across planets), fires calcAgmaPitting + scrolls to ag-card.
- All 18 suites green (481). Known backlog now EMPTY (2D FEA + fracture-materials DB remain out of scope by architecture). Next: coherence pass — equations tab + DESC lines lag the iters 8-12 cards — then evaluate stopping.

## v5.83.0 Amni-Calc: DIN 471 retaining rings, sourced (2026-07-10, loop iter 12)
- Sourcing: roymech.co.uk DIN 471 table via WebFetch → DIN471 13 rows [d1,d2,m,s,Fn,Fr] 8-60mm; the 6 groove dims previously half-recalled ALL match the source (recall was right, but now it is sourced — the refusal rule held). Non-monotonic Fr rows (25, 60) shipped with explicit verify-against-catalog caveat; Fn (groove) governs everywhere in range, asserted as a table invariant.
- calc-fixes.js (`?v=eng20`): injectRetRing rr-card in v-shafts right (rr-d exact-size select — NO interpolation on discrete standard sizes; rr-f) → groove d2/m/depth/s, Fn/Fr, 3-band verdict (ok ≤2/3 cap, warn ≤cap, err), bearing screen F/(π·d2·depth). Notes: sharp-corner abutment assumption, chamfer derate, groove Kt≈3 fatigue flag, ring-thickness edge margin.
- tests/retring_audit.js 14 (dimension cross-checks, m≥s and ascending-d2 invariants, 0.5mm depth, 100.5 MPa screen, 3-band boundaries; caught my own mislabeled band assertion — 60% is ok-band not warn). All 18 suites green (476).

## v5.82.0 Amni-Calc: vapor-compression cycle, refusal lifted with sourced data (2026-07-10, loop iter 11)
- Data sourcing: engineeringtoolbox 403d; Ohio Univ (people.ohio.edu/urieli) R134a pressure-sat table fetched clean -> R134A_SAT 28 rows [T,P,hf,hg,sg] (60-2000 kPa / -36.9-67.5 C; 2500/3000 rows dropped, too near 101 C critical). r134a(T) linear interp, clamps -> explicit out-of-range verdict.
- calc-fixes.js (`?v=eng19`): injectVcc vc-card in v-cycles (vc-te/tc/eta/q). Ideal cycle: h1=hg(Te), h4=hf(Tc) isenthalpic, h2s=hg(Tc)+(Tc+273.15)(s1-sg(Tc)) — the ONE approximation (dh=T·ds isobar), stated on card. h2 via eta. COP + Carnot + %, P ratio >8 warn, mdot/W_comp/Q_cond. Anchors: node-exact interp, h2s 275.81, COP 5.7607 = 81% Carnot (75-90 textbook band), ~7 g/s/kW, COP linear in eta identity.
- tests/vcc_audit.js 14. All 17 suites green (462).

## v5.81.0 Amni-Calc: fracture + Kt + lug cards from research sweep (2026-07-10, loop iter 10)
- Research: WebSearch/WebFetch of MechaniCalc catalog vs our 39 modules -> gaps: fracture mechanics, Kt, lug analysis (also present: 2D FEA, fracture-materials DB — out of scope). calc-fixes.js (`?v=eng18`) three cards: fr-card in v-fatigue (FR_Y center 1.0/edge 1.12/penny 2/pi; K_I=Y·s·sqrt(pi·a); a_c=(KIC/Ys)^2/pi; Paris closed form N=[ac^e−a0^e]/[C·(Y·ds·sqrt(pi))^m·e], e=1−m/2, guarded m≠2 + already-critical), kt-card in v-stress (Howland 3−3.14r+3.667r²−1.527r³ net-section w/ d/w>0.65 warn; Inglis 1+2a/b EXACT; Peterson shoulder charts REFUSED not approximated), lg-card in v-rigging (bearing P/dt, net tension P/(w−d)t, straight-plane tear-out P/2t(a−d/2) vs Fy/N and 0.577Fy/N, BTH-1-basis N select 2/3/5, governing mode named).
- tests/fracture_kt_lug_audit.js 20 anchors (1.317M-cycle Paris anchor, 2^3 life law, 36.6% front-loading exact, Howland 2.156 ≈ Peterson 2.16, Inglis circle=Howland limit=3 cross-check, lug 33.3/13.3/13.3 triple + edge-distance explosion). All 16 suites green (448). NOTE: learn agent duplicated version v5.79.0 (37e04ba) after calc 13112ad already used it — left standing, jumped calc to v5.81.0.

## v5.79.0 Amni-Learn toddler phonics + HD wait banner (2026-07-10)
- Phonics scripts: `_phonLetterSay` / `_phonSoundAsk` / `_phonSoundYes` / `_phonBlendSay` + retuned `PHON_SP` (buh not bah). Teach order = concrete word -> pure sound -> letter.
- HD wait: `_speakWait` / `_storyWait` queue; `speakSeq` and storybook `playCurrentPage` do NOT call `_webSeq` until Piper ready (banner: `Loading natural voice... please wait`). Flush via `_flushHdQueue` on warm success.
- SW v1270->v1271. Probes: `_phon_script_test.js`, `_tts_wait_probe.js`.

## v5.80.0 Amni-Calc: CAD tube primitive + PCC-1 tightening sequence (2026-07-10, loop iter 9)
- calc-cad.js (`?v=cad3`): tube(ro,ri,h,n) primitive — direct annular polygons (outer wall outward, inner wall REVERSED winding, annular top/bottom quads), no boolean needed; genFeature clamps ri < 0.98·ro. Anchor: volume = inscribed-prism annulus EXACTLY (1e-6), slot-cut boolean smoke, STL layout.
- calc-fixes.js (`?v=eng17`): boltSeq(N) — PCC-1 legacy cross patterns: N%4==0 interleave half[j]=floor(j/2)+1+(j%2)(N/4) paired opposite (N8 -> 1,5,3,7,2,6,4,8; N12 -> 1,7,4,10,...), even else sequential opposite pairs, odd star step (N-1)/2 (always coprime, proof: d|N and d|(N-1)/2 -> d|1). injectBoltSeq bsq-card in v-bolts right (bsq-n/bsq-t): star order + 3 passes (25/60/100%) w/ computed torques + rotational check passes note.
- tests/seq_tube_audit.js 23 anchors (canonical N4/5/6/8/12 sequences, permutation property across 12 counts, opposite-pairing invariant, tube exactness). All 15 suites green (428).

## v5.79.0 Amni-Calc: dP flow metering + planetary trains (2026-07-10, loop iter 8)
- calc-fixes.js (`?v=eng16`): injectFlowMeter dp-card appended to v-fluids left (fm- prefix TAKEN by fatigue Marin — used dp-): Q = Cd·At·sqrt(2dP/rho)/sqrt(1-beta^4), DP_CD textbook high-Re coefficients (orifice .61 / nozzle .96 / venturi .98 / custom), beta 0.2-0.75 band flag, permanent loss (1-beta^2)·dP orifice vs ~13% venturi. injectPlanetary gt-card in v-gears left: Willis kinematics — Zr = Zs+2Zp meshing constraint, ring-fixed 1+Zr/Zs, sun-fixed 1+Zs/Zr, carrier-fixed -Zr/Zs (reversed), assembly (Zs+Zr) % n_planets, torque multiplication note.
- tests/flow_planetary_audit.js 17 anchors (8.69 m3/h at beta .5/25 kPa water, sqrt-dP scaling exact, velocity-of-approach 1.0328, 3.5/1.4/-2.5 ratio triple, 84/3 assembles 84/5 does not, Willis closure check ring speed = 0). All 14 suites green (405).

## v5.78.0 Amni-Learn Piper-primary TTS (buzz-proof) (2026-07-10)
- Priority inverted: **Piper VITS is the default HD neural voice**; Kokoro only if `amni-learn-kk==='on'`.
- Why: browser Kokoro (onnxruntime-web jsep) keeps producing non-speech on this hardware even after CPU-first; Amni-AI's good path is native PyTorch CPU, not the browser stack. Piper was already the working HD path from v5.51.
- `_kkAudioOk` hardened (clip / quietFrac / crest / ZCR / frame variance); `_kkWav` per-utterance fail-closed → dispose + `_kkFailed`.
- `_hdLoad` always downloads missing voice (progress banner when no callback); rejects empty warm-up blob.
- `_synthWav`: Piper first if ready, else opt-in Kokoro, else throw → Web Speech at callers.
- Probes: `learn/tests/_tts_gate_test.js`, `learn/tests/_tts_piper_primary_probe.js`. SW v1269→v1270. Backup `backups/kokoro_voice_r5/`.

## v5.77.0 Amni-Calc: conical/wave 3D renders + CAD torus (2026-07-10, loop iter 7)
- calc-3d.js (`?v=eng4`): MODS.springs params +cd1/wt/wnw/wnt. CONICAL taper: coil() radius rr = R−(R−R1)·t2 (large end at bottom, R1 from sp-cd1 clamped ≤ R). WAVE render: early-return branch — Nt closed TubeGeometry rings, y = amp·sin(Nw·a + jπ) (alternating phase = crests touch, true crest-to-crest), amp=2t, auto-scale; skips coil/plate path.
- calc-cad.js (`?v=cad2`): torus(R,r,n,m) primitive (lat-lon quads, winding verified by positive volume), FDEF/genFeature/+TORUS button, exported for node. cad_audit.js +5: torus within 3.5% under Pappus 2π²Rr² AND converges upward at finer tessellation, centroid origin, rod-through-donut-hole disjoint union = EXACT sum (1e-6), torus grooves a block. 27 cad anchors; all 13 suites green (388).

## v5.76.0 Amni-Calc: conical + wave spring types (2026-07-10, loop iter 6)
- calc-fixes.js (`?v=eng15`): two new calcSpring branches. CONICAL: k = G.d4/[2.Na.(D1+D2)(D1^2+D2^2)] (SMI constant-pitch; test proves EXACT reduction to helical at D1=D2), stress at LARGEST coil w/ its own Wahl, telescoping when (D2-D1)/2Na > d (solid ~2d else (Na+2)d), linear-range end = per-coil gap x single-largest-coil rate (F_g1; initial hand-anchor was 4x wrong, code was right). WAVE: Smalley design-manual forms f=PKDm^3Nt/(Ebt^3Nw^4) K=3.88, sigma=3piPDm/(4bt^2Nw^2), E=200GPa strip, sp-D = mean Dm, solid=Nt.t. gateBellevillePresets: hideMap per type (wave hides d/G/na/nt/fl), sp-con-row/sp-wave-row gating. Anim call guarded fl>0. index.html: 2 dropdown options + 2 input rows (sp-cd1; sp-wb/wt/wnw/wnt).
- CONSTANT-FORCE SKIPPED deliberately: catalog 26.4 constant irreconcilable with first-principles EI/R^2 by ~2x — refusal per validated-physics rule (same as DIN 471). tests/spring_types_audit.js 17 anchors (reduction identity, Nw^4/t^3/series scaling laws, telescoping both ways, 317N first-ground w/ consistency cross-check). 13 suites green (383).

## v5.75.0 Amni-Learn Kokoro CPU-first (buzz root cause) (2026-07-10)
- ROOT CAUSE of the storybook/phonics buzz: onnxruntime-web jsep runtime — once a WebGPU session is initialized in a page, subsequent `device:'wasm'` sessions STILL create GPU buffers (proven: fresh-page wasm = clean speech; wasm-after-webgpu = `createBuffer ... too large ... mappedAtCreation` on this box's headless crippled adapter; on a full adapter it silently runs the garbage GPU path). The v5.68 tier ladder's CPU fallback therefore NEVER produced clean CPU audio — and the AMD WebGPU garbage passed the `_kkAudioOk` gate (his buzz flavor has enough quiet frames). Diag scripts: `_kokoro_real_diag.js` (both-in-one-page), `_kokoro_real_diag2.js <device>` (fresh page, persistent profile `kk-profile/` keeps the 326MB model cached), saved waveforms `kk_*.wav` + stats (clean CPU ref: rms 0.071, quietFrac 0.395, zcr 4266/s, 4.78s).
- `_kkLoad` tiers now: default `[{device:'wasm',dtype:'fp32'}]` ONLY; `amni-learn-kk-device`='webgpu' opt-in single tier (failure → dispose → _kkFailed → Piper; deliberately NO same-page wasm retry — it would inherit GPU state). `_kkCan` unchanged (navigator.gpu as device-modernity proxy, forced-wasm override works anywhere).
- Real desktop timings: init ~6.4s/module-open, gen ~7.2s for 4.8s audio (RTF 1.5) — acceptable via _chunkSpans streaming; web speech covers until _kkReady flips.
- Probes updated: kokoro mode expects devices=['wasm']; garbage mode seeds forced webgpu + asserts gate-catch → disposed=1 → Piper handoff without wasm attempt. All 3 modes + node --check green. SW v1268→v1269. Backup `backups/kokoro_voice_r3/` (same-day r3 covers this file state pre-edit... r4 not created: only the tiers line changed since r3's probe-verified state).
- RULE (hard-won): NEVER mix WebGPU and WASM ONNX sessions in one page; on any WebGPU failure, the only safe fallbacks are non-ONNX paths or a page reload.

## v5.74.0 Amni-Calc: Equations tab covers the new modules (2026-07-10, loop iter 5)
- index.html v-equations: 5 new static cards appended before the view close (pattern: table.data.table-static, tr title= tooltips) — MACHINING (N=1000Vc/piD, feed, MRR, both tap-drill % formulas, BA/BD, 3.45HB), HYDRAULICS (extend/retract/speed/phi/intensification/rod Euler/accumulator gas law/p.Q), LIFTING & RIGGING (T=W/n.sin, angle factors, hitch 1.0/0.75/2.0, CoG shares, eyebolt derates), FITS & PRESS FITS (four-limit extremes, Lame p, torque capacity, hub hoop, assembly dT, DIN 6885 key length), SOLID MODELING (divergence-theorem V/CoG, STL bytes, tessellation deficit sin(2pi/n)/(2pi/n)). Static-only change, no JS, no busters.

## v5.73.0 Amni-Calc: SEO pages for 6 modules + hash-router (2026-07-10, loop iter 4)
- src/gen-calc-modules.js: M array grew 31->37 entries — beam (was ALSO missing, huge search term), fits, machining, hydraulics, rigging, cad. Each with about/use/eqs/std + deep (worked example reusing the audited test anchors, procedure, pitfalls, FAQ w/ JSON-LD FAQPage schema). Regen is IDEMPOTENT (37 written, git shows only 6 new files — template untouched). Gotchas hit: entries must be comma-separated (missing comma after refs entry) and single-quoted strings cannot hold 's (Machinery's) — use backticks.
- calc-engineer.js (`?v=eng16`): hash-router in init — /^#tab-[a-z]+$/ clicks the sidebar button after 700ms. Every SEO page CTA links ./#tab-<k>; before this it only scrolled, never activated, on all 37 pages.
- sitemap.xml: +6 calc URLs (monthly/0.7). All 12 suites still green (366).

## v5.72.0 Amni-Calc: Keyway designer (Shafts) + NEW Lifting & Rigging module (2026-07-10, loop iter 3)
- calc-fixes.js (`?v=eng14`): DIN6885 table ([dmax,b,h] bands 8->130mm, find d<=dmax) + KEY_MAT (C45 340 / mild 250 / 4140HT 655 / A2 205) + injectKeyway -> ky-card appended to v-shafts right column (ky-t/d/mat/fos). calcKeyway: L_shear=2Tn/(d.b.0.577Sy), L_crush=4Tn/(d.h.Sy) (crush governs, both shown), ceil to 5mm stock, L>1.5d -> two-keys/spline verdict, >130mm -> spline territory. NOTE: first Edit swallowed the `const MC_VC={alu:` opener (same class of bug as the stress-comment destruction) -> repaired in the follow-up edit; grep-verify the neighbor line after inserting BEFORE a const.
- NEW MODULE RIGGING: tab data-v="rigging" after Vibration, static v-rigging view. calcSling (rg-w tonnes/n/ang/hitch): W=Wt.9.81, ang<30 -> REFUSAL note (no numbers), neff=min(n,2) for rigid loads, T=W/(neff.sin ang), HITCH vertical 1.0/choker 0.75/basket 2.0 -> required WLL=T/hitch, 30-45 deg CAUTION row. calcSlingCg (rgu-w/d1/d2/h): V1=W.d2/(d1+d2), T=V.L/h with L=hypot(d,h), per-leg angles atan2(h,d), min<30 -> re-rig warn; note: size BOTH slings for near-leg tension.
- calc-engineer.js (`?v=eng15`): rigging DESC. tests/rigging_keyway_audit.js 22 anchors (d35->10x8, L_crush 8.40 governs -> 10mm stock, 2000Nm -> L>1.5d verdict, 1t/2-leg/60deg -> 5.664 kN, 30deg = full-load-per-leg trap exact, choker WLL 7.55, unequal 7.454/4.714 verticals close to W). All 12 suites green (366).

## v5.71.0 Amni-Calc NEW: CAD STUDIO — in-browser parametric CSG modeler (2026-07-10, loop iter 2)
- NEW FILE `calc/calc-cad.js` (`?v=cad1`, loaded after calc-engineer.js): BSP CSG core = Evan Wallace csg.js algorithm reimplemented (Vertex/Plane/Polygon/Node, EPS 1e-5, canonical union/subtract/intersect clip sequences); primitives cube (canonical 6-quad index table), cylinder/cone (outward winding [b0,t0,t1,b1], fan caps, r2=0 -> apex triangles), sphere (lat-lon quads, pole dedupe); transform = Rx.Ry.Rz then translate; massProps = divergence theorem (V=sum v1.(v2xv3)/6, CoG=sum tet centroids, area); toSTL binary (84+50n bytes). Core is DOM-FREE: `module.exports` tail + `typeof document` guard -> node tests exercise the SHIPPED file directly.
- Browser layer: window.__CAD feature stack {type,op add/sub,p,pos,rot}, first feature forced add; event-delegated inputs -> 400ms debounced rebuild; presets plate-4-holes/flanged-bushing/L-bracket; density select -> mass; cadSTL() Blob download; stats line (polys + rebuild ms). Viewer: own bootViewer polls for the THREE 0.147 global calc-3d.js lazy-loads from jsdelivr, offsetParent-gated (zero cost until tab opened; first open loads the plate preset), BufferGeometry + computeVertexNormals (unshared verts = flat facets) + EdgesGeometry(25) overlay.
- index.html: tab data-v="cad" (CAD Studio) after Machining, static v-cad view. calc-engineer.js (`?v=eng14`) DESC cad. tests/cad_audit.js = 22 anchors REQUIRING the shipped file: cube 100000 exact, union/intersect/subtract of offset 20-cubes = 12000/4000/4000 (1e-4), rotated 64-seg cylinder = inscribed-prism formula to 1e-6, drilled plate 16000-780.36, off-center-hole CoG shift sign, cone CoG -h/4, STL length/count/unit-normal. All 11 suites green (344).

## v5.70.0 Amni-Learn Kokoro fp32 + sentence streaming (2026-07-10)
- Tier ladder dtype q8→**fp32 everywhere** (webgpu AND wasm): q8 Kokoro is audibly metallic; Amni-AI's good-sounding integration (Amni-Ai/amni/voice/tts.py `_try_kokoro`, KPipeline device='cpu') runs full precision — mirrored. fp32 = model.onnx, already in 'transformers-cache' from any prior webgpu attempt (URL-keyed) → no re-download.
- `_kkPrep(t)` (JS port of Amni-AI `_add_expressive_punctuation`+`_decase`): punctuation pause hints, `!{2,}`→`!`, `...`→`…`, de-shout if >60% caps (sentence-case + I restore). Applied ONLY in `_kkWav` (piper path has own tuning; highlight offsets stay against original text).
- `_chunkSpans(text)`: sentence spans `[^.!?]*[.!?]+\s*` + tail, greedy-merged <140 chars, contiguous {s,e,t} covering full text. Used by `_hdSay` (flatMap items→chunks, prefetch-next-while-playing via `pre()` = _synthWav with detached .catch to avoid unhandled rejections on cancel) and `_hdReadPage` (full rewrite: recursive `playK(k)` chain, prefetch chunk k+1 during chunk k playback, per-chunk highlight base=chunks[k].s span=e-s → words[].start mapping unchanged, `finish()` = old done-tail with autoplay advance; webFallback mid-page skips remaining chunks → finish).
- Probes re-run all 3 modes green (storybook gen counts UP = chunking active; fallback mode piper carries chunked pages too). Chunker unit-tested standalone (contiguity, no-punct, short text). SW v1267→v1268. Backup `backups/kokoro_voice_r3/`. EAR RE-CHECK PENDING (reload once; fp32 CPU warm-up takes a few seconds — banner shows if downloading).

## v5.69.0 Amni-Calc NEW MODULE: Machining / Manufacturing (2026-07-10, loop iter 1)
- index.html: tab data-v="machining" after Fits; `#v-machining` view before v-hydraulics — SPEEDS & FEEDS (mc-mat select populated at init by `mcPopulate()` from MC_VC, mc-tool/d/z/fz/doc/woc), TAP DRILL (td-sys/d/p/pct), SHEET-METAL BEND (ba-t/r/a/k/l1/l2), HARDNESS (hc-scale/val), BOLT CIRCLE (bc-n/d/a0), `#machining-results`, `#c-mach` 360×360 canvas.
- calc-fixes.js (`?v=eng13`): MC_VC 9 materials [name,hssLo,hssHi,carbLo,carbHi] standard reference bands, calcSpeeds = mid-band V_c → N=1000Vc/πD, vf=fz·z·N, MRR=ap·ae·vf/1000 (band always displayed). calcTapDrill Machinery's Handbook % formulas: metric d−p·%/76.98, unified d−0.01299·%/TPI (¼-20@75 → 0.2013 = #7 anchor), % clamped 50-85. calcBend BA=θ(R+Kt), OSSB=(R+t)tan(θ/2), BD=2OSSB−BA, flat=A+B−BD legs-to-apex; a>170° hem branch skips OSSB (tan blowup) → approx flat=L1+L2+BA−2t; K clamped .2-.5. E140 table (10 rows HRC 20-65 non-austenitic steel) + calcHardness col-sorted interp, CLAMPS with explicit warning never extrapolates, UTS≈3.45·HB estimate. calcBoltCircle X=Rcosθ/Y=Rsinθ CCW table + chord + canvas plot + GD&T TP note. Init: mcPopulate().
- calc-engineer.js (`?v=eng14`): machining DESC. tests/machining_audit.js 27 anchors (tap-drill #7 proof, 4616 rpm mid-band, BA 5.749/OSSB 5 exact/flat 125.749, HRC42→HV413.6/HB391, HV513→HRC50 table-exact, HRC70-clamps proof, hex chord=R). All 10 suites green (322).

## v5.68.0 Amni-Learn Kokoro garbage-output guard (2026-07-10)
- Device ear check: WebGPU fp32 Kokoro BUZZED on Anthony's hardware (known ONNX WebGPU EP numerical-garbage failure, AMD/Windows combos). Fix is detection, not dtype roulette.
- `_kkAudioOk(a)` (learn-app.js, beside _kk layer): warm-up waveform gate — reject on any NaN, clip fraction >0.15 (|x|>0.98), or quiet-frame fraction <0.04 (20ms frames @480 samples, quiet = rms < max(0.02, 10% of peak-frame rms)). Rationale: speech always contains silence gaps; GPU garbage is continuous full-band buzz with none. Also rejects all-zero output (maxR<1e-4).
- `_kkLoad` now walks a tier ladder instead of one config: default `navigator.gpu ? [webgpu/fp32, wasm/q8] : [wasm/q8]`; localStorage `amni-learn-kk-device`='wasm'|'webgpu' forces a single tier. Warm-up text lengthened ('Hello there! Ready to read a story?') so the silence-gap heuristic has real material. Failed tier: `tts.model.dispose()` (guarded) frees the GPU session before the next attempt. `_kkTier` records the winning device. `_kkCan()` now also true when forced-wasm on non-WebGPU devices.
- wasm tier runs single-threaded (GH Pages has no COOP/COEP) — slower synth, acceptable on desktop-class hardware; slow tablets without WebGPU still never attempt Kokoro unless forced. q8 model is a separate ~92MB HF download, also cached in 'transformers-cache'.
- Probe `_kokoro_probe.js` grew a third mode: `kokoro` (clean gpu) | `garbage` (mock emits continuous 0.5-amp sine on webgpu tier, speech-like burst-with-silence wave on wasm → asserts devices=[webgpu,wasm], dtypes=[fp32,q8], disposed=1, all speech through kokoro, 0 piper calls) | `fallback` (404 → piper). All green, 0 pageerrors.
- SW v1266→v1267. Backup `backups/kokoro_voice_r2/`. EAR RE-CHECK PENDING on device (reload once; q8 downloads with banner on first CPU run).

## v5.67.0 Amni-Calc NEW MODULE: Hydraulics / Fluid Power (2026-07-10)
- index.html: sidebar tab data-v="hydraulics" after Pumps (static tab + static view = proven fits-module recipe); `#v-hydraulics` view after v-pumps — CYLINDER ANALYSIS card (hy-bore/rod/p/q/eff → calcHyd), ACCUMULATOR card (ac-dv/p1/p2/n → calcAccum), `#hydraulics-results`, `#c-hyd` canvas.
- calc-fixes.js (`?v=eng12`): HYD_BORES (ISO 3320 25→250), HYD_RODS (ISO 4395 12→180), HYD_MOUNT K factors (pp 1.0/fp 0.7/ff 0.5/fr 2.0). `hyd` CYLINDER DESIGNER (force+push/pull+P bar+stroke+mounting+target speed → bore & rod: push rod = Euler I_req=FoS·F(KL)²/π²E at FoS 3.5 over stroke, pull rod = tension ≤100 MPa (CK45/FoS4); bore walk skips rod≥bore, pull uses annulus ≥ A_req; F=P·A·0.9; verdicts: rod>180 → shorten/guide/telescopic, bore>250 → raise P/split; APPLY → hy-* + computed flow + calcHyd). `calcHyd`: extend/retract F & v, φ=Ab/Aann, hydraulic kW, intensification warning (rod-side meter-out → φ·P bar). `calcAccum`: gas-law V₀=ΔV/[(P₀/Pâ‚)^(1/n)−(P₀/P₂)^(1/n)] in ABSOLUTE bar (+1.013), P₀=0.9·P_min gauge, n 1/1.4. `drawCylSchematic` (#c-hyd side view, pTheme colors). Init: injectCylDesigner + calcHyd.
- calc-engineer.js (`?v=eng13`): hydraulics DESC (DESIGNER-led) — **17 design-first modules**. tests/hydraulics_audit.js (22 anchors: A_req 3472 mm², bore 80 w/ bore-63-fails proof, Euler rod 36 w/ rod-32-misses-FoS proof, pull rod 28/bore 80, retract 58 kN, 30.2 L/min @100 mm/s, φ 1.25, accumulator 7.81 L iso / 10.14 L adiabatic absolute-pressure anchors). All 9 suites green (295).

## v5.66.0 Amni-Learn Kokoro natural voice tier (2026-07-10)
- **Vendor**: `learn/vendor/kokoro/` = kokoro.js (kokoro-js 1.2.1 + transformers.js 3.8.1 esbuild ESM bundle, 2.2MB) + ort-wasm-simd-threaded[.jsep].mjs/.wasm (onnxruntime-web runtime, jsep = WebGPU EP). Build recipe: scratchpad kk-build → `npx esbuild entry.mjs --bundle --format=esm --platform=browser --minify` with entry re-exporting {KokoroTTS,TextSplitterStream} from kokoro-js + {env} from @huggingface/transformers. Model weights NOT vendored — fetched from HF hub (onnx-community/Kokoro-82M-v1.0-ONNX) on first use, cached by transformers.js in Cache API 'transformers-cache'.
- **_kk layer** (learn-app.js beside _hd layer ~10455): `_kkCan()` = navigator.gpu && !_kkFailed && localStorage `amni-learn-kk`!=='off' (WebGPU-only tier — single-threaded WASM Kokoro too slow on kid tablets, those keep Piper). `_kkLoad(onProg)` imports the bundle, sets env wasmPaths to /learn/vendor/kokoro/, from_pretrained fp32/webgpu (fp32 deliberate: q8 artifacts on GPU EP), warm-up generate('Ready.') validates audio non-empty. Failure → _kkFailed=true permanently for session → Piper. `_synthWav(text,speed)` = shared synth: Kokoro if ready (voice af_heart) else Piper predict else throw 'no-synth' (→ Web Speech at callers).
- **Rewiring**: `_hdWarm()` = tiered warm (Kokoro banner '🎙ï¸ Loading natural voice…' → on fail `_piperWarm()` = old warm body). `_hdSay` + `_hdReadPage` route through `_synthWav` (storybook speed 0.95; word-highlight/autoplay logic untouched — it's blob-duration-proportional, synth-agnostic). Readiness gates `_hdReady` → `(_kkReady||_hdReady)` at speakSeq / playCurrentPage / _toggleTTS. Profile HD-toggle handler (index ~765) now just calls `_hdWarm()`.
- **Probes**: `_kokoro_smoke.js` (real bundle import in headless Edge — exports + navigator.gpu present), `_kokoro_probe.js kokoro|fallback` (mocked kokoro.js / 404'd kokoro.js; asserts warm-on-open, model id/dtype/device, phonics tile + storybook autoplay generate counts, Piper-call counts, 0 pageerrors). Old `_tts_probe.js` NOT rerunnable as-is anymore (serves real kokoro.js from disk → would hit HF network); use `_kokoro_probe.js fallback` for the Piper path instead.
- SW v1265→v1266 (vendor files cache-first same-origin on first use, like piper/ort). Backup `backups/kokoro_voice/`. EAR CHECK PENDING on device.

## v5.65.0 Amni-Calc DESIGNER batch 3 — pipes + motors (2026-07-10)
- calc-fixes.js (`?v=eng11`) two designers, same pattern (top of left column, own *-out via _mr, APPLY defensive-sets module ids): `fld` pipes in v-fluids (PIPE_SCH40 = published ASME B36.10M Sch 40 IDs ½"–12", PIPE_FLUIDS water20/60·glycol50·VG32·air, PIPE_ROUGH steel/PVC/galv/SS — PVC Sch 40 + SS 40S legitimately share B36.10 dims, PIPE_SVC velocity caps suction 1.5 / discharge 3.0 / gravity 1.2 / gas 20 m/s; `pipeF` = Swamee-Jain, 64/Re<2300; both Δp and v monotone ↓ in D → unique smallest pass; >12" verdict quotes DN300 numbers; APPLY → fl-d/l/q/rho/mu/e/k + calcMoody), `mtd` motors in v-motors (P=Tω, poles = smallest sync ≥ rpm else over-sync VFD/gearbox verdict, MOTOR_KW reused + NEW `NEMA_HP` ladder, MTR_LOADS→NEMA design letter B/C/D from existing NEMA_DESIGN, FL est via design slip, FLA @ PF .85 η .90, T_avail=9550kW/N_fl check; APPLY → mt-pk/n, fla-p/v, sf-p, mt-f/p/nr, mt-fr-hp(+rpm option match, 60Hz-only), mt-ts-* + design letter, fires calcMotorT/FLA/SF/Sync/NemaFrame/MotorTSC).
- calc-engineer.js (`?v=eng12`): fluids + motors DESC lines lead with DESIGNER — **16 modules now design-first**. tests/designer_batch3_audit.js (32 anchors: DN50 @ ~22 kPa, DN65 discharge vs DN100 suction velocity gate, laminar VG32 → DN25 f=64/Re exact, impossible-spec null, 40 N·m@1750 → 7.33 kW → 11 kW/15 HP/4-pole/1728 FL, 50 Hz → 37 kW/2-pole, over-sync + beyond-ladder verdicts, FLA ~18 A).

## v5.64.0 Amni-Learn Pre-K teach-card re-level (2026-07-10)
- `teachData` (learn-app.js ~10325, block `const teachData = {`) L1 arrays for math/shapes/counting/science/weather/colors/opposites carried grade-2+ facts surfaced by `showTeachPhase(subject)` (~10541) before Pre-K quizzes — place value, clock arithmetic, coin totals, measurement units, commutative property, 180° triangle sums, rhombus/annulus vocab, subitizing, exact lightning temp/bone count/ocean depth, deposition/scattering terms, chlorophyll/crayon-history trivia, km/h animal speeds.
- Rewrote 24 of 208 L1 cards (7 subjects) to short concrete Pre-K-register facts; math's Tens & Ones → **Patterns**, Money Math → **Coins** (place value / coin arithmetic are inherently grade-1+, topic swapped not just reworded). Card `{emoji,title,fact}` shape + 16-card counts per subject preserved exactly; Level 2+ untouched.
- Applied via node script bracket-scanning the `teachData` object text to locate each subject's `1: [...]` array by exact byte range (not line-based — subject blocks are single long lines), splicing in a freshly-serialized array (unquoted keys, escaped single-quoted strings matching existing file style) at only the flagged card indices. Extraction/verification scripts confirm all 13 subjects still parse with 16 L1 cards post-edit.
- Verified headless: 7-subject probe opens each quiz at `?level=1` (localStorage `profile-name` seeded to skip the welcome modal), asserts the new card title/fact render in `.teach-card .tc-title/.tc-fact` with 0 pageerrors; a second probe drives the full teach→"I'm Ready!"→`startQuizDirectly` transition to confirm the flow into real quiz questions still works.
- SW v1264→v1265. Backup `backups/teach_relevel/`.

## v5.63.0 Amni-Learn Fun R4 — mechanics: daily anagram, idle ticks, tactile feedback (2026-07-10)
- **Anagram daily** (`initAnagram`): `_agmToday()` (local YYYY-MM-DD), `dailyPending` = localStorage `agm-daily-date`!==today. While pending, EVERY load() serves the date-seeded word (`h=h*31+ch` over date string → index into `[].concat(...words)` flat pool) with a gold Daily badge — wrong guesses re-serve the same word until solved. On solve: streak = (last date===yesterday ? +1 : 1) in `agm-daily-streak`, date stamped, HUD chip → ✅, win stinger + delayed toast. HUD chip added inside the hud.innerHTML template (anchor: `id="agm-best">…</span></span>`).
- **Idle ticks**: ðŸª/🌻/â›ï¸ onclick handlers get `_jzSfx('tick')` throttled via shared `window._jzT` (≥80ms between ticks — clickers rebuild DOM per click so per-element state won't survive; window-global is deliberate). Their `:active` scale-pop ALREADY EXISTS natively (index.html ~929 `.idle-main-btn:active{transform:scale(0.9)}` + `transition:transform 0.1s`) — do NOT add duplicates; a first attempt added shadowed rules at the jz-shake block and was removed.
- **Tetris** `rotate()`: tick on each successful rotation branch (incl. wall-kick branches). **Breakout** brick-destroy: 6-particle `spawnConfetti` at brick center mapped canvas→page via `canvas.getBoundingClientRect()` scale (rc.width/cW).
- Probe `_r4_probe.js`: end-to-end daily flow (assert GO! chip + badge → click all tiles → capture revealed word from `.agm-def-card .word` in the 2.2s window → re-solve in order → assert ✅/streak/localStorage), idle click spam, tetris ArrowUp rotations, breakout 8s brick destruction (sc>0 proves burst path ran). All green, 0 pageerrors. Deterministic daily confirmed (same word across runs same day).
- SW v1263→v1264. Backup `backups/v5.63.0_arcade_fun_r4/`. Fun arc R1-R4 COMPLETE (58 games, ~180 juice sites, 1 daily mechanic).

## v5.62.0 Amni-Learn Brain fun R3 — juice cues across the whole brain block (2026-07-10)
- Scripted transform (`_r3_transform.js` scratchpad, report `r3_report.txt`) over lines initChess→initColorSort: 4 ordered idiom rules, one per line, skip lines already containing _jzSfx — (1) `if(wasBest)spawnConfetti` → prefix `_jzSfx(wasBest?'win':'score');` (statement-safe: `if` can't be in expression position); (2) `resetStreak();` → `resetStreak();_jzSfx('hit');` (the `;` match guarantees statement context — comma-chain `resetStreak(),` sites correctly DON'T match); (3) milestone `spawnConfetti(w/2,h/3` → `(_jzSfx('combo'),spawnConfetti)(w/2,h/3` — **comma-expression invocation, REQUIRED because these sites sit inside ternaries/comma chains where a `;` is a SyntaxError** (first attempt broke initTaskSwitch; restored from backup and re-ran expression-safe); (4) green `showFeedback(` (non-wasBest lines) → `(_jzSfx('pop'),showFeedback)(`.
- 106 insertions / 33 functions (the 25 brain-cat games + NumMem/BackSpan/Corsi/NBack/NBackDual/Chimp/CardPairs/ChangeDet in the same block). No shake in brain band by design. Simon here is a color-conflict task, not tone-Simon — generic cues suffice.
- Probe `_brain_probe.js`: 25 games at ?level=6, open+render+input, per-game pageerror watch — 0 fails 0 errors. SW v1262→v1263. Backup `backups/v5.62.0_arcade_fun_r3/`. Next: R4 per-game fun mechanics.

## v5.61.0 Amni-Learn Arcade fun R2 — kit wired through all 25 destress games (2026-07-10)
- `learn/learn-app.js`: ~40 `_jzSfx`/`_jzShake` call sites added across minesweeper/pipes/pullpin/fillcup/clicker/garden/autominer/colorsort/cblast/colorhunt/solitaire/tdgame/pig/connect4/reversi/battleship/mancala + Life memorymatch/sudoku/2048 win paths. Same R1 pattern (inside existing event branches; win/lose stinger at the outcome computation; shake only on damage — minesweeper BOOM shakes `$$('#minesweeper-game')`, null-safe). NOTE: two `initMinesweeper` declarations exist (~3554 life variant shadowed by ~16430 arcade one — hoisting means the LATER wins; the wired one is the live arcade version).
- Probe `_arcade_r2_probe.js`: opens all 17 at ?level=7, resolves view via `#<game>-game`/`#<game>-view`, dispatches a pointerdown on the first canvas/button, per-game pageerror watch, dialog auto-dismiss (clicker/garden ascend confirm). GOTCHA: don't assert view child-count>3 — pullpin/fillcup roots have only canvas+exit; accept canvas-present. All green, 0 errors.
- SW v1261→v1262. Backup `backups/v5.61.0_arcade_fun_r2/`. Next: R3 brain-cat cues (25 games), R4 mechanics.

## v5.60.0 Amni-Calc DESIGNER batch 2 (2026-07-10)
- calc-fixes.js (`?v=eng10`) six designers (same pattern: top-of-left-column, own *-out via _mr, APPLY defensive-sets module ids): `grd` gears (GEAR_MODULES walk, b=10m, Barth Kv, S_H≥1.2 vs Sc=2.22HB+200, applies to ag-*/gg-*/lw-*), `bmd` beams (4 configs, I from closed-form deflection @ L/rat, S=M/0.6Sy, cmâ´/cm³ out, applies bm-len/i/e; v-beam has NO .split → fallback inserts after h2), `cld` columns (I=FoS·P(KL)²/π²E, A=FoS·P/Sy, applies cl-*), `sld` seals (SEAL_CS bore ladder, squeeze 25% face/15% radial, groove 1.35CS, SEAL_MAT_RULES temp+media windows NBR/EPDM/FKM/VMQ/FFKM, backup>8.3MPa, applies sl-* incl. material option match), `ppd` pumps (P=ÏgQH/η, MOTOR_KW IEC ladder ×1.15, Ns_US type), `hxd` hx (HX_U_TYP presets, counterflow LMTD w/ cross detection, A×1.25 fouling line, applies hx-*/fu-uc).
- calc-engineer.js (`?v=eng11`): 6 more DESC lines lead with DESIGNER. designer_suite_audit.js → 33.

## v5.59.0 Amni-Calc DESIGNER rollout batch 1 (2026-07-10)
- calc-fixes.js (`?v=eng9`): shared `dsgnCondRow(px)`/`dsgnCond(px)` (loading/temp/env row, ids <px>-load2/-temp2/-env2). BOLTS upgraded: `BOLT_SE` regex table (published Shigley T8-17), dyn→pre=0.90 + Goodman n_f=Se(Su−σi)/(σa(Su+Se)) in evalSize pass criteria (σi=pre·Sp constant, σa=C·Fext/2nAt monotone), shock→{use .75, sep 2, IR .7}, `boltCondNotes()` temp/env guidance. NEW designers (all inject at TOP of left column, own *-out div via _mr, APPLY writes module ids defensively): `spd` springs (SPRING_WIRE A/d^m Table 10-4 music/HD/CrV/CrSi/302SS + AUTO by cond, WIRE_STD rounding, τ_allow 45%/30% Sut, nt=na+2, L0=Ls+1.15δ, buckling L0/D<5.2), `shd` shafts (d_str=∛(16Tnd/π0.4Sy), d_stiff from 0.25°/m J_req, SHAFT_STD), `brd` bearings (C=P·L10^(1/p) both p), `wld` welds (a=F/(0.707L·0.3Fexx), WELD_LEGS, cyclic=explicit AWS warning), `wrd` NEC wire (AMP75 incl. kcmil + window.__NEC_R exposed from overrides RCU, ampacity×1.25 continuous AND 2IRL drop), `btd` battery (S=round(V/Vc), P=ceil), `isd` isolator (r=√(1+1/TR), k=m(2πfn)²). calc-overrides.js (`?v=eng3`): `window.__NEC_R=RCU`.
- calc-engineer.js (`?v=eng10`): 7 DESC lines now lead with DESIGNER. Tests `designer_suite_audit.js` (19).

## v5.58.0 Amni-Learn Arcade fun R1 — shared juice kit (2026-07-10)
- **`_jzSfx(kind)`/`_jzShake(el,mag)`/`_jzOn()`** in `learn/learn-app.js` (inserted right before `const wordLists`): lazy singleton AudioContext (`_jzCtx`, resumed on use), one-shot oscillator tones per kind — pop/hit/score/combo/win/lose/tick/whoosh; whole body try/catch fail-silent; mute = localStorage `game-sfx`==='off' (default ON). Shake = `.jz-shake` class + `--jz-mag` var (keyframes `jzShake` in learn/index.html next to `@keyframes shake`); re-triggers via `void el.offsetWidth` reflow.
- **Wired R1 (8 destress games)**: snake80 (eat/bonus/wave/gameOver), breakout (brick/paddle/powerup/ball-loss/wave/gameOver), pong (both paddles/points/match), invaders (shoot/kill/armor-tick/player-hit/wave/shield/gameOver), tetris (place-tick/clear-tiers/level/top-out), flappy (flap/pipe/coin/milestone/death), t2048 (gain-scaled move sound/milestone-combo/2048-win-once guard `!_t2048.won`/board-lock lose), bejeweled (cascade-escalating match sound keyed off pre-increment combo/bad-swap/move/game-end). PATTERN for R2+: sounds ONLY inside existing event branches, win/lose stinger next to the existing `wasBest` computation, shake only on damage/major events.
- Probe `_arcade_probe.js` (scratchpad): drives all 8 at ?level=7 through real death/score paths (snake wall-crash → #snake-over, flappy idle-death → #flp-over, tetris hard drops, 2048 arrow moves, bejeweled adjacent swap) + typing regression (kit inserted adjacent) — 0 fails, 0 pageerrors, plus full re-run of _math/_dots/_trace/_tts probes all green. Edge flags `--autoplay-policy=no-user-gesture-required --mute-audio`.
- SW v1260→v1261. Backup `backups/v5.58.0_arcade_fun_r1/`. Council/queue: docs `guardian_council_arcade_fun_v1.md` / `checklist_arcade_fun_v1.md` (R2 = remaining 17 arcade; R3 = 25 brain-cat cues; R4 = mechanics; parked: Pre-K teach-card re-level).

## v5.57.0 Amni-Calc BOLT DESIGNER (design-first entry) (2026-07-10)
- calc-fixes.js (`?v=eng8`): `#bd-card` injected FIRST in v-bolts left column (bd-n/grade/fext/shear/svc 0.75|0.90/fam/c/k). `boltDesignPick()` walks BOLT_SIZES sorted by At (family filter), evalSize criteria: use=(pre·Sp·At+C·FextPer)/At/Sp ≤ 0.9, sep=Fi/(FextPer(1−C)) ≥ 1.5, IR=(σ/Sp)²+(τ/0.577Sp)² < 1 — monotone in At so smallest-pass is unique. Output incl. Le_min steel/aluminum (reuses basic-size strip formulas) + next-size-up. `applyBoltDesign()` writes bl-num/grade/size/fext(+unit N)/shear/preload/c/mu → calcBolt → whole module (bts/bp/te cards) syncs. DESIGN-FIRST PATTERN established — candidates to replicate: springs (load+deflection→wire/coil), shafts (torque+material→diameter), beams (load+span+deflection limit→section).
- calc-engineer.js (`?v=eng9`): bolts DESC line now leads with DESIGNER. Tests `bolts_designer_audit.js` (9: M5-fails-at-90.04% boundary anchor, monotonicity in n and Sp, pure-shear via IR, impossible→null).

## v5.56.0 Amni-Calc AGMA pitting + thread stripping (2026-07-10)
- calc-fixes.js (`?v=eng7`): `#ag-card` injected in v-gears (calcAgmaPitting: Z_I=cosφsinφ/2·mG/(mG+1), σ_H per Shigley 14-16 SI, S_c=2.22HB+200 Gr.1, S_H status gates 1.2/1.0; Z_E dropdown steel-steel 191 √MPa + custom, K_s/Z_R=1 noted). `#te-card` injected in v-bolts right column (calcThreadEngage: basic-size A_ext=0.75πK_n·L_e / A_int=0.875πd·L_e, K_n=d−1.0825p, strip=0.6S_u·A, L_e_min=break/strip-rate, mode callout; reads bl-size). calcBolt tail also syncs grade S_u → te-sub + refires calcThreadEngage.

## v5.55.0 Amni-Calc Stack-up + Churchill-Chu + TEMA fouling (2026-07-10)
- calc-fixes.js (`?v=eng6`): TOLERANCE STACK-UP static card in v-fits (`#ts-rows` dynamic rows ts-lbl/nom/tol/sgn-N, addTolRow/calcTolStack, injectTolRows seeds 3); NATURAL CONVECTION injected card `#nc-card` in v-thermal (calcNatConv: Ra=gβΔTL³/ν²·Pr, Nu={0.825|0.60 + 0.387Ra^⅙/[1+(0.492|0.559/Pr)^(9/16)]^(8/27)}², airProps() interp 250–500K clamped-with-warning, manual-props row for other fluids, h → tv-h); FOULED U injected card `#fu-card` in v-hx (TEMA_RF list, U_dirty=1/(1/Uc+ΣRf) → hx-u + calcLMTD refire). All outputs via _mr; init calls injectTolRows/injectNatConv/injectFouledU.
- Tests `calc/tests/gaps2_audit.js` (13: WC/RSS, air-prop interp @313K, Churchill-Chu plate anchor h≈4.9±, cylinder band, Ra~L³, fouled-U arithmetic, TEMA unit conversion).

## v5.54.0 Amni-Calc FITS & TOLERANCES module + press-fit + beam modes (2026-07-10)
- index.html: new tab `data-v="fits"` (after Shafts) + static `#v-fits` view (LIMITS & FITS card: ft-d/ft-pref/ft-hl/hg/sl/sg; PRESS/SHRINK card: pf-* with own `#pf-out`; right column `#fits-results` + `#c-fits` zone diagram). Static tab participates in the obfuscated app's binding because views parse before the app script.
- calc-fixes.js (`?v=eng5`): `FIT_RANGES/FIT_IT` (IT5–11 × 13 ranges, PUBLISHED values not the i-formula) + `FIT_SHAFT` (d,e,f,g,h,k[grades≥8→0],m,n,p arrays; c,r,s as `bp` breakpoint lists capped ≤120mm → null beyond = explicit warning). Holes: H (EI=0), D–G mirror (−es), JS ±IT/2. `calcFits` → limits/clearances/type + `drawFitDiagram` + interference handoff (pf-d/pf-dmin/pf-dmax, skip-if-focused) + auto calcPressFit. `calcPressFit`: Lamé two-cylinder bracket, quotes p/T/F at δmin AND δmax, σ_t hub, ΔT=(δmax+clr)/(α·d/1000). `injectBeamFnCard` (v-vibration left col) + `calcBeamFn` (Blevins λ²: ss 9.870/39.48/88.83, cant 3.516/22.03/61.70, ff 22.37/61.67/120.9, fp 15.42/49.96/104.2) → shared vibration-results via _mr. Init: injectBeamFnCard() + calcFits() fire.
- calc-engineer.js (`?v=eng8`): DESC entry for fits. Tests `calc/tests/fits_audit.js` (23: table anchors, subrange split, cap-null, H7/g6 7..41µm, H7/p6 1..35µm, press closed-form 75 MPa, beam f1 vs π/2L²·√(EI/m̄)).

## v5.53.0 Amni-Learn module /loop iter 4 — Pre-K math auto-viz (2026-07-10)
- `learn/learn-app.js` math module: hint-button viz body extracted to `_mathViz()` (module fn, `_mvGen` generation token guards the 800ms subtraction take-away timer — old timer could strip the NEXT problem's apples on fast answers). `initMath` tail: `if(currentLevel===1&&(op +|-))_mathViz()` → L1 always renders the apple-group counting viz inline and hides the hint button; hint click path (L1-only gate unchanged) reuses `_mathViz`. L2+ behavior untouched (viz none, hint per-op).
- Probe: scratchpad `_math_probe.js` — parses `#math-problem`, asserts viz shown + `.apple` count === operand sum (+) / minuend (−), hint hidden, clicks correct choice through 4 rounds, asserts L3 viz stays hidden. All green, 0 page errors. SW v1259→v1260. Backup `backups/v5.53.0_learn_loop_i4/`.

## v5.52.0 Amni-Calc Sections 3D preset mapping (2026-07-10, /loop iter 7)
- calc-3d.js (`?v=eng3`) MODS.sections.params: reads ACTIVE `secp-*` inputs + maps fixes keys (rect/i_beam/wf_unequal/circle/hollow_circle/pipe/hollow_rect/square_tube/channel/tee/triangle/right_triangle) -> extruder types; build() adds channel/tee/tri/rtri profiles + auto-fit `g.scale`. calc-fixes.js (`?v=eng4`) applyPreset tail calls `calc3DUpdate('sections')` (was NEVER called — 3D stayed a default square).
- `_SCP`/`injectSectionOverride` dropdown branch remains dormant-by-design (active lib populates `sec-presets` first); left in place because injectSectionOverride ALSO rebinds the drawing canvas (load-bearing).

## v5.51.0 Amni-Learn module /loop iter 3 — Piper HD voice for phonics/storybook (2026-07-10)
- `learn/learn-app.js` HD-TTS layer (~line 10373): new `_hdCtx()` = currentGame phonics|storybook → `speakSeq` gate is now `(hdOn()||_hdCtx())`, so those two modules auto-use HD with NO localStorage flag; new `_hdWarm()` = idempotent `_hdLoad` wrapper passing a progress callback (REQUIRED — `_hdLoad` without onProg throws 'hd-not-stored' and never downloads; this is why the old opt-in layer was dead) + `_hdBanner` progress/ready UI. `initPhonics`/`initStorybook` call `_hdWarm()` on open = Anthony's "load on opening that module". Voice `en_US-hfc_female-medium` persists via vits-web storage (`m.stored()`); vendor JS/wasm are same-origin → runtime-cached by sw.js's cache-first branch automatically.
- Storybook: new `_hdReadPage(text)` before `playCurrentPage` — synthesizes the page via `_hdMod.predict`, plays through `_hdAudio` with `ontimeupdate` word highlighting (currentTime/duration → char position → `_storyState.words` index; same `[data-wi]`/`.hl` DOM contract as the utterance onboundary path), replicates the autoplay advance (`gen`-guarded 900ms page turn) and button states. Failure anywhere → `_storyState.webFallback=true` → falls back to the utterance path (reset in initStorybook). `playCurrentPage` HD gate sits BEFORE the speechSynthesis existence guard. `stopReading` also `_hdStop()`s; story-pause pauses `_hdAudio` when active; story-play RESUMES paused `_hdAudio` (src intact) instead of restarting.
- Probe: scratchpad `_tts_probe.js` — local server serves a MOCK vits-web.js (stored/download/predict returning a tiny silent WAV, `window.__predictN` counter) + Edge flags `--autoplay-policy=no-user-gesture-required --mute-audio`. Verified: phonics tile → predicts fired; storybook autoplay chained ≥2 pages (6 predicts); 0 page errors. Real-voice ear check on device pending (headless silent — same caveat class as v5.37 phonics TTS).
- SW CACHE v1258→v1259. Backup `backups/v5.51.0_learn_loop_i3/`.

## v5.50.0 Amni-Calc Quick-nav scroll-spy (2026-07-10, /loop iter 6)
- calc-engineer.js (`?v=eng7`): injectQuickNav attaches an IntersectionObserver (root=the .view scroll container, rootMargin -8%/-72%) toggling `.qn-on` on the chip whose card is in the reading band; `row._io` disconnected on rebuild. index.html: `.qn-chip.qn-on` accent style.
- setRes-title audit: all ~45 titles verified consistent (UPPERCASE context, standards in parens) — no sweep required.

## v5.49.0 Amni-Calc Theme-true visuals + print pass (2026-07-10, /loop iter 5)
- calc-fixes.js (`?v=eng3`): drawBellDisc fill = `th.accent+'38'` (8-digit hex alpha) when accent is 6-hex, fallback rgba orange.
- calc-engineer.js (`?v=eng6`): `.theme-toggle` click delegate re-runs the active view's calc fn (+120ms) so canvases/plots repaint in the new theme.
- index.html print CSS additionally hides `.eng-solve,.qn-row,.side-find,.eng-solve-btn`.

## v5.48.0 Amni-Learn module /loop iter 2 — Connect the Dots (2026-07-10)
- `learn/learn-app.js` `initDots` SHAPES data: Mug/Bowtie/Sword/Flag rebuilt as single closed outlines (the old ones were polylines with mid-shape jumps → stray diagonal lines + open regions; the engine draws ALL consecutive points as one connected path, so 2D multi-part shapes MUST be a single closed loop — no pen-lift support). +4 new: Circle 12-dot, Ice Cream (L1), Butterfly, Snowman (L2) → 16 shapes per level. RULE for new 2D shapes: closed:true, every vertex ≥12px from every other (the <10px group-merge in drawFunc would fuse them), points within 20-380.
- `shapeList` now Fisher-Yates shuffled per initDots (was fixed order starting at Triangle every session).
- Number labels: unconnected non-next dots draw their number (min unconnected id+1) at y−16 in gray 11px; next dot keeps bold 13px in-dot label — restores find-the-number pedagogy. 3D wireframe levels inherit labels via group min-id (revisited vertices show their first index).
- Test hook `window.__dotsT={name,closed,idx,total,nextDot,done,groups}` refreshed each drawFunc when sessionStorage `dots-test`==='1'. Probe: scratchpad `_dots_probe.js` = static geometry lint (eval'd SHAPES: closure/bounds/vertex-spacing/jump-segs) + headless click-through to done via __dotsT groups. Lint clean, 3 playthroughs done=true, shuffle verified, 0 page errors. SW v1258. Backup `backups/v5.48.0_learn_loop_i2/`.

## v5.47.0 Amni-Calc Placeholder consistency + Enter-to-solve (2026-07-10, /loop iter 4)
- index.html: all 20 static results placeholders -> "Results compute live as you type." (input panels) / "Results compute live from whichever card you use." (shared-results modules) — the old strings referenced Analyze/Compute buttons that live-compute hides.
- calc-engineer.js (`?v=eng5`): Enter in `.es-val` triggers runSolve.

## v5.46.0 Amni-Calc Module descriptions + dropdown runners-up (2026-07-10, /loop iter 3)
- calc-engineer.js (`?v=eng4`): `DESC` map (32 view-keyed one-liners, inputs→outputs) + `injectDesc()` inserts `.mod-desc` <p> after each view h2 (before the sticky qn-row; injectQuickNav anchors after `.mod-desc` when present). SELECT goal-seek collects ALL options into `cands`, sorts by |y−t|, applies best, and prints top-2 runners-up in the status line (option labels stripped of parenthetical suffixes).
- index.html: `.mod-desc` CSS (dim .72rem, tucked -.5rem under h2).

## v5.45.0 Amni-Learn module /loop iter 1 — tracing validation (2026-07-10)
- `learn/learn-app.js` tracing module: `drawTarget` now captures TWO masks per target — `maskData` (letter body, unchanged #eee fill semantics) and new `tHaloData` (same text re-rendered with `strokeText` at `lineWidth=max(36,fontSize*0.12)` + fill = letter+tolerance halo), then re-renders the visible guide. `#t-next` dual-gates: coverage `filled/target > (L1?0.45:0.55)` AND precision `inkOnHalo/ink > (L1?0.55:0.68)` where ink = pixels `r<100&&b>150` (blue stroke; excludes dash gray #8d97a3 and guide #eee). Scribbles now fail on precision (measured 0.19 for a canvas-wide zigzag); differentiated feedback (empty/coverage/precision). Old checker passed ANY scribble covering ≥32% of the glyph.
- Test hook: `window.__traceT={cov,prec,ink}` when sessionStorage `trace-test`==='1'. Probe pattern: scratchpad `_trace_probe.js` — **dispatch PointerEvents directly on `#trace-canvas`** (headless pg.mouse near canvas corners is unreliable — first pointerdown can land on overlay chrome and paints nothing); continuous glyph path built by sampling guide pixels (r 200-254) column-serpentine at stride 12.
- SW CACHE v1256→v1257. Backup `backups/v5.45.0_learn_loop_i1/`. Loop queue: `docs/checklists/checklist_learn_module_loop_v1.md` (next: connect-the-dots shapes, then Piper-HD voice for phonics/storybook w/ lazy-load+cache).

## v5.44.0 Amni-Calc Seals rebalance + nav follow + solve refresh (2026-07-10, /loop iter 2)
- index.html v-seals: `#seal-mat-detail` moved LEFT under COMPRESSION ANIMATION (config side) — split now 3/3. Split-imbalance survey (cards/column): thermal[6,2]/echem[5,2]/battery[4,2]/cycles[5,2]/electrical[5,2]/pumps[4,2]/motors[4,2] are DELIBERATE multi-calculator patterns (inputs left, shared results right) — do NOT "rebalance" them; sticky qn-row chips are the nav answer there.
- calc-engineer.js (`?v=eng3`): `freshOuts(scope)` extracted; openSolve rebuilds `_outs`+es-out options on every reopen (stale-target fix after mode/type switches). Sidebar follow: click delegate + init(+1800ms) `scrollIntoView({block:'nearest'})` on `.sidebar .tab.active`.

## v5.43.0 Amni-Calc Goal-seek Dropdowns + Nav/Format polish (2026-07-10, /loop iter 1)
- calc-engineer.js (`?v=eng2`): runSolve branches on `inp.tagName==='SELECT'` — discrete sweep of all options via `setOpt` (calls inline `el.onchange({target:el})` so pickers with side-effects like bl-coat→bl-mu stay coherent), keeps `best` by |y−t|, restores original on total failure, dispatches change for qol persistence, tags "(nearest available)" when best.e>max(5%·t, 2·quantum). openSolve `elig` filter admits selects with ≥2 options, excludes `-u`/`.u-sel` unit selectors + .eng-solve internals; dropdown entries marked ▾.
- index.html: `.qn-row` sticky (top:0, z-20, var(--bg) bg, border-bottom) inside the .view scroll container — `.view` padding-top moved onto `.view>h2` so chips pin flush; `.view .card{margin-top:0!important;scroll-margin-top:62px}` = uniform .85rem card rhythm (kills inconsistent inline margin-tops) + jump targets clear the sticky bar.

## v5.42.0 Amni-Calc Springs/Belleville Packs + Bolts + Render Stability (2026-07-10)
- **Belleville (calc-fixes.js calcSpring)**: REAL inputs `sp-de/sp-di/sp-t/sp-h0` (index.html `#sp-bell-row`, shown only for type=belleville; helical fields sp-d/D/na/nt/fl hidden then). Corrected Almen-Laszlo `F(s)=CAL·t³·s·[(h₀−s)(h₀−s/2)/t²+1]`, CAL=4E/((1−ν²)M·De²) — the OLD `ratio·(ratio−0.5)·ratio` was a broken form that went NEGATIVE for h₀/t<0.5 (all DIN A-series). 400-pt peak scan (snap-through discs peak before flat), 80-iter bisection `dAt(F)` (exposed as `window.__bellDAt`), closure exports `_bellFs/_bellSPk/_bellFPk/_bellH0/_bellT/_bellDe/_bellDi` feed stack+plot+pack+anim.
- **Stack/pack**: `#spring-stack-card` (sp-stack-arr single|series|parallel|serpar + sp-ns/sp-np). k_eq=k·np/ns; belleville δ_stack=ns·dAt(F/np) (series carries FULL F, parallel splits); L₀=ns(h₀+np·t); solid=ns·np·t (helical: ns·Lsolid); capacity=np·F_peak. FD plot: nonlinear single+stack curves for belleville, linear for helical; `#sp-stack-out` via morph.
- **PACK VIEW** `#c-spring-pack` (drawSpringPack/drawBellDisc/drawCoilMini in calc-fixes): cross-section — series discs alternate ⟨⟩ (up=i%2===0), parallel nested same-orientation offset by t, L₀ dim arrows; helical rows=series (seat-plate rule between), cols=parallel; caps display at 8×6 with "(showing X of Y)".
- **3D (calc-3d.js MODS.springs)**: type+stack aware — belleville = LatheGeometry cone washers [(Di/2,0),(De/2,h0),(De/2,h0+t),(Di/2,t)], scale.y=-1 flip for alternate series groups, translucent guide rod; helical grid ns×np with plates, extension torus hooks, torsion leg stubs, die=steel-grey thicker tube; auto-fit g.scale 110/max-extent.
- **DE-DUP (calc-overrides.js)**: injectSpringExtras used to inject 5 cards AND `hookSpringType` WRAPPED window.calcSpring routing belleville→calcBelleville (crude linear kApprox — this was silently overriding the audited fixes math!). Removed: BELLEVILLES array, bv-card, sppk-card (sp-k/sp-out), fd-card, STACK PREVIEW 2D (c-spring-2d), calcBelleville/showBV/calcSpringPack/drawSpringView, and the calcSpring wrap. KEPT: rect-wire DIE card (ISO 10243, calcDieSpring) now writing to its own `#ds-out` + in-card `#p-springs` plot, gated to type=die.
- **SPRING_PRESETS**: belleville 19 entries (DIN 2093 A/B/C + M3-M12 washer sizes; F=75% of corrected flat load, node-computed), compression 9, extension 5, torsion 5, die 5. applySpringPreset now loads bell{De,Di,h0,t} into the real inputs.
- **Bolts**: `orderedBoltSizes()` groups BOLT_SIZES by kind → `<optgroup>` (METRIC COARSE/FINE, INCH UNC/UNF) sorted by d; size table gets family header rows. calcBolt tail syncs bl-num→bp-n (skip if focused) + calls drawBoltPattern. injectBoltExtras (pattern+grade notes)→LEFT column; injectBoltTorqueAdvanced→`.split>div:last-child` (right).
- **Anti-flicker `window.__morphRes(el,html)`** (calc-overrides, before setRes): skip when `el.__h===html`; if shape (tag tree) matches, patch className+leaf innerHTML in place — leaf skipped when `dataset.orig===incoming` (engineer unit layer keeps converted display); else innerHTML replace. Wired into setRes, setCardOut (via `_mr` in calc-fixes), calcBolt joint write, calcSpring results, sp-stack-out, ds-out.
- Springs view columns rebalanced (inputs+presets+stack LEFT / results+pack+plot+anim RIGHT). Tests: `calc/tests/spring_stack_audit.js` (20). Cache-busters: calc-fixes/overrides/3d `?v=eng2`. Backups `backups/amni-calc-deployed/*.v5.42.0.bak`.

## v5.41.0 Amni-Learn Daily Curriculum — flavor, age-fit & print-scale overhaul (2026-07-10)
- **Band identity layer** in `learn/curriculum.html`: render() stamps `band-<key>` + `fmt-<classic|adventure>` classes on `#sheets` (alongside scale classes). CSS vars per band: `--band-accent` (t12 #b95d28 / p34 #1e8449 / k56 #1f6fb2 / g78 #6a3fa0 / g910 #0e7c86 / t1113 #37474f) drives `.sheet-page` `--accent`, 6px top border, q-num, plan-row, theme-banner; `--font-head`/`--font-body`/`--font-trace` drive typography. Fonts (one css2 request): Baloo 2 heads + Nunito body (t12→g78), Nunito heads (g910), Inter head+body (t1113), **Edu SA Beginner for ALL tracing letters** (school-manuscript letterforms replace mono's double-story a), JetBrains Mono retained for math/grids/plan/ans.
- **Print is now age-scaled** (was flattened to 11pt for every age): `@media print` `scale-lg` ≈11.5pt/15pt-emoji, `scale-xl` ≈12.5pt/17pt-emoji vs base 10.5-11pt. Screen scale-xl pushed too (17px base, 1.95rem emoji, 34px act-box, 46px q-num, 50px stamp).
- **Per-band chrome**: t1113 = "MY STUDY DAY"/"EXPEDITION DAY", mascot hidden, `.done-box` check-track replaces star row, legend "team up · independent", emoji downsized (1.05rem / 11pt print); t12 = "OUR LEARNING DAY"/"OUR ADVENTURE DAY"; t12/p34 mascot 3.1rem.
- **Adventure layout BUG FIX (v5.39 shipped broken)**: page 1 was injected into `#sheet-grid` still `display:grid 1fr 1fr` → quest path squeezed into left half, headings stretched right, print 1363-1439px vs 936 budget (spilled a 2nd sheet mid-quest). Fix: `#sheets.fmt-adventure .sheet-grid{display:flex;flex-direction:column}` + print compaction: `.q-steps{columns:3;list-style-position:inside}` (3 steps = one line), inline banner icon+h3, inline mascot+h2 in `.sheet-head`, tightened quest/stamp/side paddings. Side quests dropped for t12/p34 (render + adventureSupplies; pickAdventure still consumes the same RNG stream — determinism intact).
- **27 content fixes from age-fit audit** (subagent report; frozen-copy audit): SAFETY p34 solo→ðŸ¤ (Scissor Snack Strip, Bone Dig Sensory Bin, Bead Threading, Pom-Pom Pickup; Pattern Bracelet de-beaded); k56 'Write 3×4=12'→'4+4+4=12', Multiplication Jump→Skip-Count Jump; g78 mult facts 5×5→10×10 (matches multProbs/TEKS 3.4F); teen tone (Physics Play→Simple Machines Lab, Kitchen Chemistry one-variable protocol, Book Report/Space Facts/Long Division voice); littles flavor (Tidy Toy Box race, toy parade, timekeeper); theme hooks matched to real pools (splash/bug); Budget $10 gains 'store ad or menu' supply; Bread Kneader real dough n:25; Teach-Back no-younger-kid assumption; Inventor Warm-Up 3-in-3.
- Verified: 72-combo sweep (6 ages × 6 nonces × 2 formats, print emulation) 0 fails 0 errors, worst page 933/936; fonts asserted per band; 3/3 split; determinism; t1113/t12 chrome asserted; PDFs = exactly 5 pages each (letter, .5in). Harness pattern: scratchpad `_curr_flavor_verify.js`. Backups `backups/v5.41.0_curriculum_flavor/`. Council/checklist `docs/*/{guardian_council,checklist}_curriculum_flavor_v1.md`. No SW bump needed (network-first page). GOTCHA still: CRLF file — single-line Edit anchors.

## v5.40.0 Amni-Calc Engineer Refresh (2026-07-10)
- New `calc/calc-engineer.js` (`window.__ENG`, node-requireable like UCORE) loaded LAST: unit-core → overrides → 3d → fixes → units → qol → **engineer** (`?v=eng1`).
- **Output-unit layer**: parses every text-only `.result-item .val` matching `number unit` (tokens from `DIMX`: length/area/pressure/force/torque/power/velocity/mass/flow/inertia/smod/temp), stores original in `data-bv/bu/orig`, renders per `MODE` (wraps `window.__usys`, shares `calc-units-sys` localStorage key with the input layer) + per-dim click-to-cycle prefs (`calc-out-pref`). Idempotent MutationObserver rescans on any added nodes (writes only when display differs — terminates). Δ-labeled temps skipped (delta vs absolute offset); `stepUp` psi→ksi ≥1e3, lbf→kip ≥1e4 (IMP-mode only, not user prefs).
- **Goal seek**: `⌖ SOLVE FOR` button injected after every `.view button[onclick^="calc|solve"]`; panel = target-output select (from that card's `.card-out` or `#<view>-results` grid) + target value (entered in DISPLAYED unit; solver reads fresh SI text and converts through the recorded token) + vary-input select (card-scoped, view fallback). `solveFor(set,get,t,x0,qf)`: secant 60 iters → sign-scan ±3 decades both signs → bisection 90; accept tol `|t|·2e-3 + displayQuantum·1.5`; input restored on failure. Buttons hidden by live-compute stay hidden — the ⌖ button has no onclick attr so universalLiveCompute ignores it.
- **Sidebar search** `#eng-find` ("/" focuses, Esc clears, Enter opens first hit): lazy keyword index per tab = tab text + view h2/h3/label text; `.sidebar-cat` headers collapse when all their tabs are filtered out.
- **Quick-nav chips** (`.qn-row`) injected after each view's h2 when ≥3 cards; rebuilt at +1800/+3600ms if card count changed (late inject* cards).
- index.html: `.side-find/.qn-*/.eng-*` CSS + `@media(min-width:1560px)` centered content column (≤1300px). Print CSS already hides buttons → chips/solve UI print-safe.
- This commit ALSO ships the v5.20.0 unit sweep files (calc-unit-core.js etc.) which were uncommitted since 2026-06-29 — live had a dead STRESS STATE card until now.
- Tests `calc/tests/engineer_layer.js` (74) + `unit_audit.js` (61) green. Backup `backups/amni-calc-deployed/index.html.v5.40.0.bak`. NOTE: `data-ad-slot="1720203631"` appears twice (disclaimer + site-ad-banner, both labeled, both pre-existing) — flagged, not changed.

## v5.39.0 Amni-Learn Daily Curriculum — Adventure Day second format (2026-07-09)
- `learn/curriculum.html`: new **Adventure Day** format toggle next to Classic Checklist. Per age band: 6 rotating themes + QUEST pools (warm/brain/hands/create/life + side quests) with multi-step stations, energy chips, stamp track. Pages 2–3 get more volume (math marathons, duo wordsearch+maze, stretch/debrief). Supplies + planner use adventure seed. Deterministic via `today|band|nonce|format`. Backup: `backups/v5.39.0_curriculum_adventure/`.
- `amni-learn.html` feature card updated for dual formats.

## v5.38.3 Amni-Learn Daily Curriculum — skip counting (/loop iter 4 — named queue COMPLETE, 2026-07-07)
- `skipCountHTML(rnd)`: 3 rows (steps shuffled from 2/5/10), 8 circle cells each (`.skip-cell`, dashed `.skip-blank` ×3 at positions 2-7 so the pattern anchor stays visible), ANS-keyed. k56 math variant #6 (dice *6).
- Verified: rows/blanks/key-divisibility/cell-sequence all asserted, h≈534px. The /loop "through all of them" named queue (planner→answer key→word problems→skip counting) is now fully shipped as v5.38.0-.3.

## v5.38.2 Amni-Learn Daily Curriculum — word problems (/loop iter 3, 2026-07-07)
- `wordProbsHTML(rnd,band)`: template word problems w/ neutral name pool (WPN), 3/sheet, integer-safe by construction (change=paid−cost with paid>cost; wilted<planted; k56 sums within 20). Slotted as 5th math variant for k56/g78/g910 (variant dice now *5 — daily rotations shifted, expected). Answers ANS.push'd ("Word problem N: $X").
- Verified 12 nonces/band: rotates in for all 3 bands, 3 keyed answers every time, story-number cross-check 0 suspects, no overflow.

## v5.38.1 Amni-Learn Daily Curriculum — answer key page (/loop iter 2, 2026-07-07)
- Opt-in `#opt-key` (default OFF) → `#sep6`/`#page6`. Mechanism: module-level `ANS=[]` collector reset in render() right before the page-2 build; EVERY generator pushes its answers as it builds (all 15 math generators + clocks/fact-families/area-perimeter/coords inline blocks + letter-hunt count + vocab words + match-up/dot-to-dot/color-count/odd-one-out/pattern + CIVICS entries which now carry `a:` reference answers); `ansSplit=ANS.length` after page 2 splits the key into Practice/Creative sections. Civics answers render as q+a pairs (`.full` grid rows). **RULE: any NEW worksheet block must ANS.push or it silently goes ungraded.**
- Page numbering: `tot=4+plan+key` drives every mini-head ('Page 2 of '+tot); key page is always last (Page tot of tot).
- Verified 6 ages × 4 nonces: harness re-computes every parsed answer line (+,−,×,÷,integers,x-solve,%,fractions) = 0 bad math; key hidden by default; heights ≤358px; t12 shows "nothing to grade" fallback. GOTCHA: curriculum.html is CRLF — multi-line Edit anchors fail; use single-line anchors.

## v5.38.0 Amni-Learn Daily Curriculum — weekly planner page (2026-07-07, /loop "through all of them" iter 1)
- `learn/curriculum.html`: new opt-in page 5 (`#opt-planner` checkbox default ON → `#sep5`+`#page5` inline-display toggled, works in print) — `weekPlanHTML(band)` replays the SAME `pickDay`/nonce-0 per date as `weekSupplies` for the next 7 days → `.plan-row` per day (Today + weekday names, date, 6 activity titles w/ cat icons + ðŸ¤/â­ markers; t12 markerless). Verified: 7 rows × 6 acts all bands, ~590px print height, toggle hides both page+separator, deterministic. Loop queue lives in `docs/checklists/checklist_daily_curriculum_v6.md` (next: answer key → word problems → skip-counting).

> ## ⚠ï¸ ACTIVE NOTICE TO THE CONCURRENT LEARN-CONTENT LOOP (read me first — 2026-05-31, v5.8.0)
> As of v5.8.0 the Amni-Learn app was **de-inlined**. The ~7.36 MB `<script>` that used to live inside `learn/index.html` (game engine + ALL quiz/fact banks) now lives in **`learn/learn-app.js`**.
> - **Add/lift quiz banks in `learn/learn-app.js`** — NOT in `learn/index.html`. The inline `<script>` is gone; `learn/index.html` only has `<script src="learn-app.js" defer></script>`. **Do NOT re-inline it.**
> - Keep your existing pattern otherwise: bump `learn/sw.js` `CACHE` (currently `amni-learn-v1011`) when you change `learn-app.js` so users get fresh content. `learn-app.js` is already in the SW `PRECACHE`.
> - **Do NOT re-add AdSense** to `amni-{calc,explore,haven,learn,llm}.html`, `explore/index.html`, or `learn/index.html` — ads were intentionally removed (AdSense block remediation). Ads stay ONLY on `calc/*.html`, `learn/*.html`, and (since v5.22.0) `construct/*.html` article pages — never on app canvases.
> - Versioning: `v5.8.0` is this ad/de-inline branch. Your learn lifts can keep their own sequence — just don't undo the bullet points above. After any `learn-app.js` change, re-run `node --check learn/learn-app.js`.

## v5.37.0 Amni-Learn UI polish + phonics pronunciation (2026-07-06)
- **Per-category accent system in learn/index.html CSS**: `--gb` custom property set per `.game-category` via `#main-game-grid > .game-category:nth-of-type(1..22)` palette (fallback on `#main-game-grid`); ALL `.game-btn` styling derives from it — layered tinted gradients, colored borders, inset highlight + bottom accent bloom, `::before` radial sheen, hover lift + accent glow + icon pop, `:active` press. The 11 legacy per-game classes (.tracing/.matching/.phonics/...) are now one-line `--gb` overrides instead of hardcoded border+hover pairs. Category headers: accent left-bar (inset box-shadow), tinted gradient, icon chip; section cards accent-washed. **NTH-OF-TYPE ORDER = the 22 sections' DOM order in #main-game-grid — inserting a new category section shifts all later accents; add new sections at the END or renumber.**
- **Theme system remap**: `body[data-theme]` previously forced border/shadow via 3 !important rules; now it just sets `--gb: var(--accent)` on grid/sections/buttons → themed mode = uniform accent w/ full new depth (verified Mint). `body.light-mode` overrides rebuilt on `--gb` (untested visually — light-mode toggle lives elsewhere; CSS is defensive).
- **Phonics TTS pronunciation** (learn-app.js): Web Speech reads "-uh" spellings as "-oo" ("fuh"→"foo") — all PHON_LETTERS cues respelled TTS-true (bah/kah/dah/fah/gah/hah/jah/kah/lah/mah/nah/pah/kwah/rah/tah/vah/wah/yah; O→'aw', X→'kss'); display shows the same spelling so audio+visual agree. New `PHON_SP` map + `_phonSnd()`: Sound It Out chunk taps and Blend It now speak SOUNDS not letter names (tap 'f' → "fah" not "eff"; sh→'shah', ch→'chah', ck→'kah', ai→'ay', oa→'oh', ee→'ee', oo→'oo', ng→'ing', magic-e 'ke'→'kah'). Letter Catch inherits via target.s. RULE: any new chunk type must get a PHON_SP entry or TTS will spell it.
- Verified: node --check; FULL layout harness landscape 125 modules 0 overflow post-CSS; screenshots dark (per-category identity) + Mint (uniform accent); phonics card shows "fah" like Fish. TTS audio itself still needs a device ear-check (headless is silent). SW CACHE v1255→v1256. Backups `backups/v5.37.0_ui_polish/`.

## v5.36.0 Amni-Learn QoL — Bubble Pop ghost-game fix + vertical-fit backstop (2026-07-06)
- **Bubble Pop "Missed it!" mid-game spam ROOT CAUSE**: switching modes re-ran `initBubblePop()`, which wiped `lifeArea` — but the old arena stayed referenced by its bubbles (`parentNode` non-null on a DETACHED node), so old rAF ticks survived, and re-init re-armed the shared `window._bubActive` boolean → the old game's target "missed", fired feedback, and its guarded-by-boolean `nextRound` kept spawning invisible rounds forever. **FIX = generation token** `window._bubGen`: bumped on every init and in `cleanupLifeGame`; every closure (tick/nextRound/onHit/onWrong/onMiss and their setTimeouts) checks its captured gen; tick uses `isConnected` not `parentNode`. PATTERN for any life-subgame with self-re-init mode buttons: booleans re-arm ghosts, generations kill them.
- **`_fitToCard` gained an opt-in vertical-fit pass**: `[data-vfit="reservePx"]` elements scale to fit BOTH axes (min of the two scales, floor 0.45, only if >60px height room; reserve = px left for controls below). Width pass skips vfit-tagged elements. Tagged: `#cp-grid` (Card Pairs — the "shows one icon, find its match" game had 444px of cards below the fold on 880×412; all cards now visible), `#t2048-grid`, `.bj-grid` (291→24), `.cs-tubes`. **Deliberately NOT tagged after measurement**: sudoku (only 63px of height room — scaling would make the board unplayable) and wordsearch (its grid STARTS 78px below the fold; content above must move, a layout job not a scale job) — both stay scroll-by-design like v5.8.102 accepted.
- Quiz teach-phase START button ("I'm Ready!") now `position:sticky;bottom:6px` — was 138px below the fold at Pre-K landscape (same fix class as v5.8.103's sticky Next).
- Verified headless 880×412 touch: 4 rapid bubble mode-switches + 10s of continuous correct popping = **0 "Missed it!"** (MutationObserver spy on `#feedback`); vfit numbers above; `node --check` clean. Vertical-fit probe harness pattern: scratchpad `_vfit_probe.js` (measures `view.scrollHeight-clientHeight` + below-fold controls per module — the layout harness only measures horizontal).
- SW CACHE v1254→v1255. Backups `backups/v5.36.0_qol/`. Checklist `docs/checklists/checklist_learn_qol_v1.md`.

## v5.35.0 Amni-Learn Pre-K Phonics v2 — more words + two games (2026-07-06)
- **PHON_WORDS 24 → 48** (learn-app.js): new words follow phonics scope-and-sequence — vowel teams (ai/oa/ee), -ng/-ck endings, initial blends (cr/dr/fl/sn/sw/tr), magic-e as whole chunks (ca-ke, sna-ke).
- **Two new game tabs** in `#phonics-view` (now 4 tabs, generalized loop in `initPhonics`): 🎯 **Letter Catch** (hear a letter sound → tap the right letter of 3; 10 rounds) and 🎵 **Rhyme Time** (new `PHON_RHYMES` 12 emoji-word families; "which rhymes with X?" → 3 picture tiles; tapping speaks the word). First-try correct = star + `addScore`; wrong = tile dims + sound replays + retry until success (pre-K: no penalty, no advance on wrong). Bests → localStorage `phon-match-best`/`phon-rhyme-best` (both in `_PLAY_NUM_KEYS`); 2 new achievements (Sound Sniper / Rhyme Ranger, 10/10).
- **Round-advance is a GUARDED one-shot setTimeout** (`if(currentGame==='phonics')`) per the house Matching pattern — no intervals/rAF, nothing added to the `#nav-back` cleanup block. Correct tiles carry `data-ok="1"` so headless harnesses can drive the games deterministically.
- CSS: `.phon-game-tile/.phon-right/.phon-wrong/.phon-game-hud/.phon-game-q` in learn/index.html alongside the v5.31 phonics styles. `learn/sw.js` CACHE v1253 → v1254. prek.html card updated.
- Verified headless: full 10-round Letter Catch via data-ok (score 10, best persisted, Play Again renders), Rhyme Time wrong-then-right retry (wrong marks tile + does NOT advance; scoring first-try only confirmed — retry round shows â­0), 4 tabs switch, zero console errors. Backups `backups/v5.35.0_phonics_v2/`; checklist/council `docs/*/{checklist_phonics_module_v2,guardian_council_phonics_v2}.md`.

## v5.34.0 Amni-Learn Daily Curriculum v5 — TEKS/B.E.S.T.-aligned expansion, neutral (2026-07-06)
- Applied the v5.15-5.19 quiz-audit playbook to the printable: TEKS + Florida B.E.S.T. alignment, traditional math (fact fluency, standard algorithms), USCIS-128-style FACTUAL civics only — no ideological framing in any direction (per Anthony's "no left lean": implemented as strictly verifiable-fact civics both states mandate — Texas Celebrate Freedom Week / FL civics standards).
- **Activities +72 (now 420: 12/category for 5 main bands, 10 for t12)**, standards-flavored: positional words + count-to-20 (TX Pre-K guidelines), place-value straw bundles + clock hunt + blends + push/pull + book parts (TEKS K-2/B.E.S.T. phonics), times-table sprint + arrays + cardinal directions + fact-vs-opinion + state symbols + flag code (TEKS 3-5), Preamble + figurative language + lat/long + circuits + protractor + escape plan (TEKS 4-5), Bill of Rights + primary sources + integer temps + sales tax + moon phases + voter-registration mechanics (TEKS 6-8/FL civics-EOC style), toddler additions per TX infant/toddler guidelines.
- **New page-2 worksheet variants**: k56 trace ×4 (+phonics blends "Word Builders") and math ×4 (+analog clock reading — `clockSVG` renders real hour/minute hands + ticks, hour/half-hour per TEKS 1.7E); g78 mult bumped to facts through 10×10 (TEKS 3.4F: `multProbs` 2-10, `missFactor` 2-9) + math ×4 (+fact families) + copywork now "Copy in Your Best Cursive" on guided rows (TEKS 3.2); g910 math ×4 (+`rectAPHTML` labeled-rectangle area/perimeter); t1113 math ×5 (+`coordPlaneHTML` gridded coordinate plane, +`intAdd` integers). k56 `addSub` widened to sums within 20.
- **Civics Corner** (`CIVICS` 10-prompt pool + `civicsHTML`): rotates into page-3 bonus — g78 word-search/maze/civics 3-way, g910+t1113 word-search/civics 2-way. All prompts factual (branches, Bill of Rights, flag composition, supreme law, Declaration year, First Amendment freedoms, state capital/governor duties).
- k56 blends picked upfront in the trace block so the name toggle stays stream-safe (same rule as v3).
- Verified headless 6 ages × 8 nonces: 0 errors, heights max 806/848/865/652 (budget 936), 3/3 split everywhere, EVERY new variant asserted present across the sweep (clock/blends/factfam/areaperim/coords/integers/civics/cursive). Screenshots eyeballed: clock faces readable, coordinate plane textbook-quality, civics clean.
- Backups: `backups/v5.34.0_curriculum_v5/`. Plan/council: `docs/checklists/checklist_daily_curriculum_v5.md` / `docs/guardian_councils/guardian_council_daily_curriculum_v5.md`.

## v5.33.0 Amni-Learn Daily Curriculum v4 — print-UX + supervised interactivity + supplies week (2026-07-06)
- **Age-scaled type system**: `#sheets` carries `scale-xl` (t12/p34) / `scale-lg` (k56) / base (g78+) — ~60 CSS overrides keyed off the container class (tracing to 4.2rem w/ name-length step-down classes `mid`/`sm2`, 100px guide rows, 3.6rem point rows, 32px checkboxes, 2.2rem mood emojis, bigger everything). Same DOM in print, so print inherits the scale.
- **New seeded game generators** (all pure string builders): `mazeHTML` (stack-based recursive-backtracker wall grid → SVG lines, ðŸ­→🧀; 5×5 p34 / 7×7 k56 / 9×9 g78), `matchUpHTML` (animal→food line-drawing columns), `dotToDotHTML` (numbered-dot SVGs: triangle/square/house/diamond), `oddOneOutHTML`, `colorCountHTML` (color N of 5 star outlines), `colorPicHTML` (sun/fish/house thick-outline coloring SVGs). p34 page 2 = trace + 6-variant game slot; p34 page 3 bonus rotates pattern/maze; k56+g78 page 3 rotates word search/maze; t12 page 3 = coloring picture + sing. Draw-box min-height flexes down on tall-bonus days; t12/p34 drop the "It Feels" row (weather+mood only) — both were needed to hold the 936px/page print budget at xl scale.
- **Supervised/independent 50-50**: every one of the 396 activities is tagged `g:1` (ðŸ¤ Together) or untagged (â­ On my own); `pickDay(band,rnd)` seeds 3 categories as together-slots and filters each pool by flag (full-pool fallback) → page 1 always shows 3ðŸ¤+3â­ with colored badges + legend. t12 exempt (all caregiver-guided, badges/legend hidden). GOTCHA: every band×category pool MUST keep ≥1 activity of each flag or the split silently degrades — t1113 rd shipped with zero `g` and the sweep caught 2/4 days (fixed: Manual Master + Two Sources are now g).
- **Interactivity content**: all 5 main bands' pools 8→10 (+60 hands-on plants/cooking/cleaning/household: plant-a-seed, veggie wash, spray & wipe, kitchen measuring, pepper-scatter, egg cracking, laundry start-to-finish, cutting propagation, yeast balloon...). Total 396 activities.
- **Page 4 "This Week's Supplies"**: activities carry `s:[...]` arrays from a shared dedup vocabulary; `weekSupplies(band)` replays `pickDay` for the next 7 dates (nonce 0) and unions the supplies into a checkbox list w/ date range + "everyday basics" note + "based on each day's first set" disclosure. Uses the SAME pickDay as render — do not fork the logic.
- Verified headless 6 ages × 6 nonces: 0 errors, max page heights 806/848/865/613 (budget 936), 3/3 split at every age+nonce, t12 badge-free, supplies 11-23 items/band, name→EMMA forcing, deterministic. No SW bump needed (curriculum.html navigations are network-first in learn/sw.js).
- Backups: `backups/v5.33.0_curriculum_v4/`. Plan/council: `docs/checklists/checklist_daily_curriculum_v4.md` / `docs/guardian_councils/guardian_council_daily_curriculum_v4.md` (incl. mid-flight scope addendum).

## v5.32.0 Amni-Learn Daily Curriculum v3 — content/visuals/variety/toddlers (2026-07-06)
- **Ages now 1-13**: new toddler band `t12` (Ages 1-2, caregiver-guided — every activity is a 5-min caregiver script) through the normal `bandOf`/`CURR` machinery. Toddler page 2 = "Little Hands" (giant dashed-SVG shape trace + zigzag, scribble zone, point-and-name emoji row with caregiver script).
- **Content**: all 5 existing bands' pools expanded 6→8 per category (+60) plus 48 toddler activities = 336 total. New pools: nursery rhymes (public domain), K-5 sentences, question-of-the-day (g78), journal prompts (g910/t1113), word-search word lists per band.
- **Variety — rotating daily variants, all drawn from the ONE seeded stream** (variant index first, then content): trace block (p34 letters/numbers/shapes; k56 words/sentence/letter-hunt grid; g78 copywork/QOTD; g910+t1113 copywork/journal + vocab) and math block (p34 count&write/count-circle/shape-spot; k56 add-sub/missing-number/compare; g78 mult/missing-factor/big-add; g910 div/fraction-of/decimal-add; t1113 equations/percent-of/mean — percent-of picks the ANSWER first and derives the base so results are always integers). Page 3 bonus: sing-together rhyme (t12/p34, + pattern-next row for p34), deterministic word search (k56 6×6/3 words, g78+g910 8×8/4, t1113 9×9/4; bounded 60-try placement loop, only PLACED words listed).
- **Name-field determinism FIXED properly**: v2 skipped RNG picks when a name was set (typing a name changed the math problems). v3 always consumes the stream identically and only overrides display; typing a name now also FORCES a name-capable trace variant (p34 → name tracing; k56 sentence-day → name tracing; k56 letter-hunt uses the name's initial as target).
- **Visuals**: `.sheet-page` renders as a white paper card on screen in both themes via scoped CSS-var overrides (`--text/--dim/--border2/--accent` redefined inside), shadow + rounded corners (flattened in print); per-category color coding (CATS gained a 4th color element → colored left borders + time-tag, borders chosen because backgrounds don't print by default); band mascot emoji in the sheet header; REAL handwriting guides (solid baseline + dashed midline as a ::before pseudo-element border — NOT a background gradient, which print drops); "now you try" empty guided rows; dashed-SVG shape tracing (circle/square/triangle/star/heart/zigzag via `shapeSVG`).
- Verified headless: 6 ages × 3 nonces all render, every page under the 936px print budget (max seen: p1 710, p2 661, p3 817), band-specific blocks present, name→EMMA forcing works, deterministic, zero console errors. Word-search placement hand-verified in a rendered grid.
- Backups: `backups/v5.32.0_curriculum_v3/`. Plan/council: `docs/checklists/checklist_daily_curriculum_v3.md` / `docs/guardian_councils/guardian_council_daily_curriculum_v3.md`. `amni-learn.html` feature card updated to ages 1-13.

## v5.31.0 Amni-Learn Pre-K Phonics (spoken) module (2026-07-06)
- New game `data-game="phonics"` in School Skills, gated to Pre-K only via `_glv.phonics='1'` (`learn-app.js:105`). Shell `#phonics-view` reuses `.life-task-area` (the existing white rounded card class) for free responsive sizing + `_fitToCard`/`_availW` integration, no new plumbing needed.
- **Two tabs**: 🔤 **Letter Sounds** (`PHON_LETTERS`, 26 hand-authored entries `{letter,sound,word,emoji}` — tap a tile → big letter + emoji + phonetic sound shown, 🔊 Hear It replays) and 🧩 **Sound It Out** (`PHON_WORDS`, 24 entries, real phonics chunking incl. digraphs `sh`/`ch`/`ck`/`oo` — tap a chunk to hear it, 🔊 Blend It reads the full sequence, Prev/Next browse). Both defined right after `initMatching()` in `learn-app.js` (~line 1449), same file region as the other Pre-K games.
- **Deliberately did NOT reuse `quizData.languages[1]`'s existing 26-letter phonics quiz bank** — that content is written as quiz-answer explanations for an adult reader, not clean spoken cues for a 3-5-year-old. New compact data, different shape/purpose, not a duplicate.
- **TTS design call**: explicit taps (tile click, Hear It, Blend It, Prev/Next) always speak regardless of the global mute (`ttsAuto()`, off by default) — same precedent as the quiz's `#quiz-audio-btn`, which already bypasses the mute gate. Only the very first render on opening the view respects `currentLevel===1 && ttsAuto()` for bonus auto-narration, matching `showFeedback`'s existing convention. Global mute button behavior for every other game is untouched.
- No `setInterval`/`requestAnimationFrame` anywhere in the module (pure click-driven) — nothing added to the long `#nav-back` cleanup block.
- New `ACHIEVEMENTS` entry ("Sound It Out", browse 20 words) + `phon-words-seen` added to `_PLAY_NUM_KEYS` so First Steps/Polymath pick it up.
- `learn/prek.html` "THE LINEUP" card grid gets a PHONICS card. `learn/sw.js` `CACHE` bumped `v1252 → v1253`.
- Verified headless (local static server, same pattern as `learn/tests/layout/harness.js`): button visible at `?level=1`, hidden at `?level=2` (confirms `_glv` gating); both tabs render (26 tiles / word chunks incl. 3-chunk "cat"); tile/tab/Hear-It/Blend-It/Prev/Next clicks all fire with zero console errors; word-seen counter increments on Next. `node --check learn/learn-app.js` clean.
- Backups: `backups/v5.31.0_phonics/` (`learn-app.js`, `index.html`, `prek.html`, `sw.js`). Plan/council: `docs/checklists/checklist_phonics_module_v1.md` / `docs/guardian_councils/guardian_council_phonics_module.md`.

## v5.30.0 Amni-Learn Daily Curriculum — 3-page worksheet packet (2026-07-06)
- Extended `learn/curriculum.html` from a single overview sheet into a **3-page packet**: page 1 unchanged (checklist+stars), new **page 2 "Practice Page"** (age-tailored Trace & Write block + a Math Practice block), new **page 3 "Creative & Discovery"** (draw-box tied to the day's picked Creative activity, weather/feels/mood check rows). Hard `page-break-after:always` per `.sheet-page` in print so it's always 3 physical pages, not a flow that might merge.
- Trace & Write escalates with the band: p34 traces 3 big dotted-outline letters (`-webkit-text-stroke`, hollow-letter tracing style) + a wavy practice line; k56 traces 3 sight words + a rhyme prompt; g78 gets a copywork sentence; g910/t1113 get copywork + 2 vocabulary fill-in-the-blank sentences. Math Practice escalates too: count-and-write (p34) → addition/subtraction (k56) → multiplication (g78) → long division (g910) → one-step equations (t1113) — all computed live from seeded RNG, not pre-written.
- **New optional child's-name field** (`#child-name`, letters-only sanitized, capped length): when filled, personalizes the p34/k56 tracing rows to the child's actual name instead of the generic letter/sight-word pools; falls back cleanly when empty. Re-renders live on input, no New Set needed.
- All new content (letters/words/problems/copywork/vocab picks) draws from the SAME date-seeded `rnd` stream already used for the 6 activity picks — the whole packet stays deterministic per day, no second seed needed.
- Verified headless across 5 ages: each `.sheet-page` measured under the ~936px one-page print budget (page 1/2/3 all fit one page each = 3-page packet), name field confirmed to change page 2 output live, math problem counts confirmed correct per band (4/6/8/6/6).
- Backup: `backups/v5.30.0_curriculum_worksheets/`. Plan/council: `docs/checklists/checklist_daily_curriculum_v2.md` / `docs/guardian_councils/guardian_council_daily_curriculum_v2.md`.

## v5.29.0 Amni-Learn Daily Curriculum Printable (2026-07-06)
- **New standalone page `learn/curriculum.html`** (age picker → printable "learning day" sheet), independent of `learn-app.js`/`learn/index.html` — no changes to the SPA or its top-bar (kept out of the layout-respect-tested surface on purpose). Data: `CURR` object, 6 categories (Reading, Math, Fine Motor, Science, Creative, Life Skills) × 5 age bands (3-4/5-6/7-8/9-10/11-13) × 6 hand-authored screen-free activities = 180 entries. `bandOf(age)` maps any age 3-13 to a band.
- **Deterministic daily pick**: `xmur3`+`mulberry32` seed from `today's date + band + session nonce` → one activity per category, stable across repeat visits the same day; "🔀 New Set" bumps a `sessionStorage` nonce for a fresh mix without breaking the same-day default.
- **Print layout**: `@media print` hides nav/footer/`.product-hero`/controls/marketing sections, forces ink-friendly light colors, `@page{size:letter;margin:.5in}`, `break-inside:avoid` per card — verified headless to fit **one printed page** at the default age. Checkbox is a plain bordered box (not a form control) so a kid can mark it with a crayon/pencil.
- **No AdSense** on this page — treated like `explore/index.html`/`learn/index.html` (interactive tool, not an article); do not add ads here per the notice above.
- Linked from `amni-learn.html` hero (new CTA button) + a features-grid card. Deliberately **not** linked from `learn/index.html`'s top-bar (see Sentinel note in `docs/guardian_councils/guardian_council_daily_curriculum.md`).
- Verified headless (puppeteer-core + Edge, same pattern as `learn/tests/layout/harness.js`): 0 page errors across ages 3/4/6/8/9/11/13, 6 cards each, same-day determinism holds, New Set changes the set, print media hides chrome/shows the sheet. Backup: `backups/v5.29.0_daily_curriculum/`. Plan/council: `docs/checklists/checklist_daily_curriculum_v1.md` / `docs/guardian_councils/guardian_council_daily_curriculum.md`.

## v5.23.0 Amni-Construct PRO — contractor layer R1 (2026-07-06, /loop ongoing)
- **`_shared/pro.js`+`pro.css` (?v=p1)** in all 11 modules: `💼 Pro` drawer (button class `pro-tab` NOT `tab` — apps overwrite `.tab.onclick` post-boot at e.g. deck/app.js:602; use addEventListener). State: `amni.pro.v1` (company/logo-dataURL/license/trial/seq/default rates) + `amni.pro.q.<mod>.v1` (client/scope/labor/rates). Quote doc = print-window HTML (Q-YYYY-NNNN, client-facing prices = marked-up only; materials schedule rows = generic `<tr>` scrape name+qty where td[1] matches /^\d/). Gate: 14d trial OR key `AMNI-PRO-…` (checksum = Σ charCode(i)·(i+3) of 9 payload chars %36 → base36; gen `src/pro-keygen.js` GITIGNORED) OR LemonSqueezy public license API when `window.AMNI_LSQ` set. `construct/pro.html` = pricing/landing ($19/mo, `AMNI_BUY_URL` upgrades checkout btn).
- Harness: scratchpad `_pro.cjs` (gate/trial/math-to-the-cent/quote-doc/key/hvac-variant/pro.html). Roadmap in `docs/checklists/checklist_construct_pro_v1.md` (R2 quote depth → R3 clients/dashboard → R4 permits+showcase → R5 PWA → R6 Capacitor Android w/ Play Billing constraint).

## v5.22.0 Amni-Construct monetization foundation (2026-07-02)
- **SEO guide layer** = `construct/<mod>.html` ×11 article pages (COMMITTED output), generator `src/gen-construct-guides.js` + data `src/construct-guides/seo_<mod>.js` (both GITIGNORED — regen: `node src/gen-construct-guides.js`). Mirrors calc-page conventions: `pick()`/`HV` heading variants (keep them — template-lockstep = doorway flag), Article+FAQPage JSON-LD, AdSense loader + slot 1720203631 unit, amber `#e0954a` accent, crumbs Home›Amni-Construct›guide, CTA → tool. Word floor ~900 (generator warns `!! THIN`).
- **ui-kit v=u2 monetization hooks** (all CONFIG-GATED, dormant by default): `window.AMNI_AFF={hd,lowes}` URL templates w/ `{u}` placeholder → click-time affiliate rewrite (capture-phase listener, `rel=sponsored`, `data-uk-aff` marker) + `.uk-affnote` FTC disclosure only-when-active; `window.AMNI_GC='code'` → GoatCounter script inject. ACTIVATION = set the consts/window vars + bump `?v=` + change hub footer "no tracking" wording. Middle-click/copy-link bypasses rewrite (accepted).
- **Presets**: `_shared/presets.json` (`{mod:[{name,tip,h}]}`, `h` = `#share=` b64 payload) → `#uk-presets` chips atop `#side`; regen via scratchpad `_precap.cjs` pattern (seed LS pre-boot with `evaluateOnNewDocument`, let the app persist canonical cfg, dump). deck REQUIRES full-cfg payloads (boot = `migrate(stored)||defaults`, NO default-spread); patio/pool/floor/roof/frame spread `{...defCfg,...stored}` so partials are safe. `.uk-guide` sidebar link → guide page.
- **sitemap.xml** = 86 URLs (+11 guides). Hub `.guides` strip before footer. robots `Disallow: /_` blocks `_shared/` from crawl — fine, ui-kit is progressive enhancement.

## v5.21.0 Amni-Construct ui-kit — suite-wide UX + appearance overlay (2026-07-01)
- **`_shared/ui-kit.css` + `_shared/ui-kit.js`** (linked from all 11 Construct module index.html: deck/patio/pool/floor/roof/frame/plumb/elec/hvac/plan/garden — `<link ...ui-kit.css?v=u1>` before `</head>`, `<script ...ui-kit.js?v=u1 defer>` before `</body>`). NO app.js changes: ui-kit reads shared DOM contracts (`#mat-table`/`#mat-body` totals `.tot.best`, `.tab[data-pane]`, `#side .row input[type=number]`, `amni<mod>.*` localStorage).
- Features: live estimate pill (`#uk-quote`, MutationObserver), 🔗 share links (`#share=<b64 of module LS>`), first-visit coach (`#uk-coach`, LS `amni.uk.coach.<mod>`), −/+ steppers (`.uk-step`, dispatch input+change), loading overlay (`#uk-load`), CSS polish layer (focus rings, tab glow, sticky th, vignette `#view:not(:has(.pane.on))::after`).
- **`uk-restore`** = tiny inline `<script id="uk-restore">` in each module `<head>` BEFORE the app module tag — applies `#share=` payload to localStorage synchronously during parse so the app boots with the shared design (a post-boot restore LOSES: apps persist their in-memory cfg on every boot recompute, clobbering late LS writes; even pagehide re-writes proved unreliable — restore must precede the app's LS read).
- Hub (`construct/index.html`): `.resume` chips per app card from each module's LS key (map in the inline script at body end).
- To iterate: edit `_shared/ui-kit.{css,js}` + bump `?v=` in all 11 index.html. Backups `backups/v5.21.0_construct_uikit/`.

## v5.20.0 Amni-Calc UNIT CONSISTENCY SWEEP (2026-06-29)
- **Single source of truth** = new `calc/calc-unit-core.js` (`window.UCORE`), loaded FIRST (before calc-overrides/3d/fixes/units). Exposes `DIMS` (auto-dropdown factors, same shape calc-units expects), flat `tables` (`LEN_TO_MM/AREA_TO_MM2/PRESS_TO_MPA/FORCE_TO_N/TORQUE_TO_NM/FLOW_TO_M3S/POWER_TO_W/VEL_TO_MS/MASS_TO_KG/INERTIA_TO_MM4`), and helpers `factor/conv/toBase/fromBase/tempConv/principal3`. **Node-requireable** (`module.exports`) for tests. EXACT factors (lbf=4.4482216152605 N, inâ´=416231.4256 mmâ´, psi=0.00689475729316836 MPa, hp=745.6998715822702 W).
- `calc-units.js` `DIMS` now `= (window.UCORE&&UCORE.DIMS) || {inline fallback}`. `calc-fixes.js` `LEN_TO_MM/FORCE_TO_N/E_TO_MPA/I_TO_MM4` + `calcSpring` `dMult/fMult/gMult` all derive from `UCORE.tables` (inline fallbacks kept). No more divergent copies.
- **`window.calcStress` was NEVER DEFINED** by the obfuscated app — the visible STRESS STATE card (`st-sx`..`st-tyz` + `st-u` selector) was dead and `st-u` a no-op. Implemented it in calc-fixes.js: reads `st-u` as the shared unit for all 6 tensor components, computes principal/von Mises/Tresca/FoS, displays results IN THE SELECTED UNIT. Yield/ult keep their own auto-dropdown (read in MPa). Fired on init; live-compute via the existing `setupLiveCompute` (binds the ANALYZE button's `onclick="calcStress()"`).
- **Principal stresses** = `UCORE.principal3` (Smith stable symmetric-3×3 eigenvalues). Replaces the old cubic in BOTH `calcStress` and `calc-overrides.js calc3DPrincipal` (via `window.__principal3`) — the old `disc<=1e-9` absolute threshold collapsed to a hydrostatic triple root at high σ / repeated roots.
- Beam: `addLoad`/`addTypedSupport` capture `ld-mag-u`/`ld-pos-u`/`sup-typed-pos-u`; `renderLoadList`/`renderSupportList` echo entered units via `_forceDisp`/`_lenDisp` (internal solve still N/mm). The 13 other `-u` selectors (beam getX, bolt getForce, spring multipliers) were already consumed correctly — `st-u` was the only broken one.
- Tests: `calc/tests/unit_audit.js` (node, 61 assertions). Backups `backups/v5.20.0_calc_units/`. Script order in `calc/index.html` (2590-2595): unit-core → overrides → 3d → fixes → units → qol.

## v5.15.0–v5.19.0 Amni-Learn CURRICULUM AUDIT + P5 enrichment (2026-06-10)
- All 16 quiz banks audited to TEKS/B.E.S.T./USCIS-128, neutral, traditional+fast-eastern math (no Common Core framing). P1 (v5.15.0) re-leveled math/counting (calculus/trig/FOIL out of K-5→L5; basic facts down). P2 (v5.16.0) civics/history moves + neutrality/fact rewrites. P3/P4 (v5.17.0) 6 exact-dup deletes + djembe fix + 3 Medusa rewrites. **P5 (v5.19.0): math L3 31→51, L4 38→58** — TEKS-appropriate enrichment refilling tiers thinned by re-leveling; verified-answer worked checks, band-provenance pure (gr3=100% L3, gr4=100% L4).
- `advPool` backfill threshold is **12** (not 40) so Adventure battles stay on-band when a level is healthy. Band check: `learn/tests/layout/_p5band.js` (pure-node advPool sim). Content tooling in `learn/tests/layout/`: `_recount.js`, `_dedup.js`, `_extract.js` (regex `/^ *([1-5]): \[/` — banks use 8- OR 10-space level-key indent), `_apply_p5.js`.

## v5.10.0–v5.14.0 Amni-Learn ⚔ï¸ ADVENTURE MODE arc complete (2026-06-09)
- M2 (v5.11.0): `advShop()`/`ADV_GEAR` weapon+armor ladders, boss relics (`advS.relics`, +2 atk each), Guardian Spirit revive (Lv3+, `advCtx.revived`). M3 (v5.12.0): `advSfx()` WebAudio synth (gate `adv-sfx`), crits combo≥3 ×1.5 (`advLastHit`), `advBurst()` particles, `advShakeBT()`, region drift sprites + battle vignette. M4 (v5.13.0): daily quests (`ADV_QPOOL`/`advDailyEnsure`/`advQuest`, date-deterministic), 5 achievements pushed into `ACHIEVEMENTS` (counters adv-wins/crits/bosses), NG+ (`advS.ngp` 1.5× foes / 2× rewards). M5 (v5.14.0): `advIntro()` story + `advName()` (profile-name), ✓ CLEARED ribbons, two-phase final boss (heal 20% + `advCtx.enraged` 1.5× dmg), named epilogue.
- Regression suite (gitignored learn/tests/layout/): advcheck.js + advcheck2-5.js + smoke.js — run ALL before any Adventure ship.

## v5.10.0 Amni-Learn ⚔ï¸ ADVENTURE MODE (2026-06-09)
- New RPG layer over the quiz content; classic mode untouched/default. `#adv-btn` (⚔ï¸ QUEST, top-bar) toggles `#adventure-view` (registered first in `views{}`); all UI JS-rendered into `#adv-root`; styles injected once as `#adv-css`.
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
- **7 new arcade games** in `learn/learn-app.js` (Destress Arcade band, level 7): 🌻 Garden Grower (idle), 🔴 Connect Four, ⚫ Reversi, 🚢 Battleship, 🟤 Mancala (vs-AI board), 🎨 Color Hunt (perception), 🎲 Pig (push-your-luck dice). Each wired as: `data-game` button (+pink NEW badge) → `#X-view` div → `views` registry → dispatcher `if(game==='X')initX()` → `initX()`. New "♟ï¸ Strategy & Board" destress-cat category; Color Hunt filed under Casual Puzzles. Anthony's named examples (Tower Defense `tdgame`, Cookie Clicker, Auto Miner) were already deep — NOT rebuilt; DON'T re-add the 7 above.
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






## Amni-Learn Adventure v1.19.0 (2026-08-05)
- learn-app.js 19857-19940ish: adventure block grew — advSpec/advQT state, advHeroPaint (HP color tiers + heartbeat), advSpecUI/advSpecial (5-pip meter, +1/+2crit, boss-only in practice — regular foes die before 5), advPotUI/advPotion (advS.pot 0-3, +30 heal capped), advBanner (boss entrance), swift = answer<6s at level>=2 (+4, #adv-swift CSS bar restarts per question), drift spans per region icon, shop rarity tcs[] + p:0 potion buy branch, advWin sequential star reveal (star1/2/3 sfx) + rAF count-ups + coin fountain, advLose taunt/tip pools, map: adv-conn.live ants + region ⭐n/12 + advNodeIn stagger (:not(.cur) guard — .cur keeps pulse), heropick flavor names
- __advT adds spec/pot. Achievement adv-spec5 via adv-specials counter
- PROBE GOTCHA: chrome-devtools-mcp evaluate_script on async fns >~5s TIMES OUT, returns partial, and RETRIES the whole fn invisibly — stacked retries auto-farmed battles (multi-minute ghost driving). Keep evals <4s, one action each, idempotent
