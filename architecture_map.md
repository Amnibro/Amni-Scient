# Architecture Map — amni-scient.com

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
- `learn/curriculum.html`: new opt-in page 5 (`#opt-planner` checkbox default ON → `#sep5`+`#page5` inline-display toggled, works in print) — `weekPlanHTML(band)` replays the SAME `pickDay`/nonce-0 per date as `weekSupplies` for the next 7 days → `.plan-row` per day (Today + weekday names, date, 6 activity titles w/ cat icons + 🤝/⭐ markers; t12 markerless). Verified: 7 rows × 6 acts all bands, ~590px print height, toggle hides both page+separator, deterministic. Loop queue lives in `docs/checklists/checklist_daily_curriculum_v6.md` (next: answer key → word problems → skip-counting).

> ## ⚠️ ACTIVE NOTICE TO THE CONCURRENT LEARN-CONTENT LOOP (read me first — 2026-05-31, v5.8.0)
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
- Verified headless: full 10-round Letter Catch via data-ok (score 10, best persisted, Play Again renders), Rhyme Time wrong-then-right retry (wrong marks tile + does NOT advance; scoring first-try only confirmed — retry round shows ⭐0), 4 tabs switch, zero console errors. Backups `backups/v5.35.0_phonics_v2/`; checklist/council `docs/*/{checklist_phonics_module_v2,guardian_council_phonics_v2}.md`.

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
- **New seeded game generators** (all pure string builders): `mazeHTML` (stack-based recursive-backtracker wall grid → SVG lines, 🐭→🧀; 5×5 p34 / 7×7 k56 / 9×9 g78), `matchUpHTML` (animal→food line-drawing columns), `dotToDotHTML` (numbered-dot SVGs: triangle/square/house/diamond), `oddOneOutHTML`, `colorCountHTML` (color N of 5 star outlines), `colorPicHTML` (sun/fish/house thick-outline coloring SVGs). p34 page 2 = trace + 6-variant game slot; p34 page 3 bonus rotates pattern/maze; k56+g78 page 3 rotates word search/maze; t12 page 3 = coloring picture + sing. Draw-box min-height flexes down on tall-bonus days; t12/p34 drop the "It Feels" row (weather+mood only) — both were needed to hold the 936px/page print budget at xl scale.
- **Supervised/independent 50-50**: every one of the 396 activities is tagged `g:1` (🤝 Together) or untagged (⭐ On my own); `pickDay(band,rnd)` seeds 3 categories as together-slots and filters each pool by flag (full-pool fallback) → page 1 always shows 3🤝+3⭐ with colored badges + legend. t12 exempt (all caregiver-guided, badges/legend hidden). GOTCHA: every band×category pool MUST keep ≥1 activity of each flag or the split silently degrades — t1113 rd shipped with zero `g` and the sweep caught 2/4 days (fixed: Manual Master + Two Sources are now g).
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
- **Single source of truth** = new `calc/calc-unit-core.js` (`window.UCORE`), loaded FIRST (before calc-overrides/3d/fixes/units). Exposes `DIMS` (auto-dropdown factors, same shape calc-units expects), flat `tables` (`LEN_TO_MM/AREA_TO_MM2/PRESS_TO_MPA/FORCE_TO_N/TORQUE_TO_NM/FLOW_TO_M3S/POWER_TO_W/VEL_TO_MS/MASS_TO_KG/INERTIA_TO_MM4`), and helpers `factor/conv/toBase/fromBase/tempConv/principal3`. **Node-requireable** (`module.exports`) for tests. EXACT factors (lbf=4.4482216152605 N, in⁴=416231.4256 mm⁴, psi=0.00689475729316836 MPa, hp=745.6998715822702 W).
- `calc-units.js` `DIMS` now `= (window.UCORE&&UCORE.DIMS) || {inline fallback}`. `calc-fixes.js` `LEN_TO_MM/FORCE_TO_N/E_TO_MPA/I_TO_MM4` + `calcSpring` `dMult/fMult/gMult` all derive from `UCORE.tables` (inline fallbacks kept). No more divergent copies.
- **`window.calcStress` was NEVER DEFINED** by the obfuscated app — the visible STRESS STATE card (`st-sx`..`st-tyz` + `st-u` selector) was dead and `st-u` a no-op. Implemented it in calc-fixes.js: reads `st-u` as the shared unit for all 6 tensor components, computes principal/von Mises/Tresca/FoS, displays results IN THE SELECTED UNIT. Yield/ult keep their own auto-dropdown (read in MPa). Fired on init; live-compute via the existing `setupLiveCompute` (binds the ANALYZE button's `onclick="calcStress()"`).
- **Principal stresses** = `UCORE.principal3` (Smith stable symmetric-3×3 eigenvalues). Replaces the old cubic in BOTH `calcStress` and `calc-overrides.js calc3DPrincipal` (via `window.__principal3`) — the old `disc<=1e-9` absolute threshold collapsed to a hydrostatic triple root at high σ / repeated roots.
- Beam: `addLoad`/`addTypedSupport` capture `ld-mag-u`/`ld-pos-u`/`sup-typed-pos-u`; `renderLoadList`/`renderSupportList` echo entered units via `_forceDisp`/`_lenDisp` (internal solve still N/mm). The 13 other `-u` selectors (beam getX, bolt getForce, spring multipliers) were already consumed correctly — `st-u` was the only broken one.
- Tests: `calc/tests/unit_audit.js` (node, 61 assertions). Backups `backups/v5.20.0_calc_units/`. Script order in `calc/index.html` (2590-2595): unit-core → overrides → 3d → fixes → units → qol.

## v5.15.0–v5.19.0 Amni-Learn CURRICULUM AUDIT + P5 enrichment (2026-06-10)
- All 16 quiz banks audited to TEKS/B.E.S.T./USCIS-128, neutral, traditional+fast-eastern math (no Common Core framing). P1 (v5.15.0) re-leveled math/counting (calculus/trig/FOIL out of K-5→L5; basic facts down). P2 (v5.16.0) civics/history moves + neutrality/fact rewrites. P3/P4 (v5.17.0) 6 exact-dup deletes + djembe fix + 3 Medusa rewrites. **P5 (v5.19.0): math L3 31→51, L4 38→58** — TEKS-appropriate enrichment refilling tiers thinned by re-leveling; verified-answer worked checks, band-provenance pure (gr3=100% L3, gr4=100% L4).
- `advPool` backfill threshold is **12** (not 40) so Adventure battles stay on-band when a level is healthy. Band check: `learn/tests/layout/_p5band.js` (pure-node advPool sim). Content tooling in `learn/tests/layout/`: `_recount.js`, `_dedup.js`, `_extract.js` (regex `/^ *([1-5]): \[/` — banks use 8- OR 10-space level-key indent), `_apply_p5.js`.

## v5.10.0–v5.14.0 Amni-Learn ⚔️ ADVENTURE MODE arc complete (2026-06-09)
- M2 (v5.11.0): `advShop()`/`ADV_GEAR` weapon+armor ladders, boss relics (`advS.relics`, +2 atk each), Guardian Spirit revive (Lv3+, `advCtx.revived`). M3 (v5.12.0): `advSfx()` WebAudio synth (gate `adv-sfx`), crits combo≥3 ×1.5 (`advLastHit`), `advBurst()` particles, `advShakeBT()`, region drift sprites + battle vignette. M4 (v5.13.0): daily quests (`ADV_QPOOL`/`advDailyEnsure`/`advQuest`, date-deterministic), 5 achievements pushed into `ACHIEVEMENTS` (counters adv-wins/crits/bosses), NG+ (`advS.ngp` 1.5× foes / 2× rewards). M5 (v5.14.0): `advIntro()` story + `advName()` (profile-name), ✓ CLEARED ribbons, two-phase final boss (heal 20% + `advCtx.enraged` 1.5× dmg), named epilogue.
- Regression suite (gitignored learn/tests/layout/): advcheck.js + advcheck2-5.js + smoke.js — run ALL before any Adventure ship.

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
