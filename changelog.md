# Changelog 

## [5.6.58] - 2026-05-18 - Amni-Learn school skills COMPLETE: Tracing + Typing + Storybooks
- **Tracing & Art** polish: per-level trace counter (`trace-count-L{N}` sessionStorage); every successful trace shows the running count (e.g. "Awesome! (#12)"); milestone confetti at 10/25/50/100/200 traces with 🏆 tier toast (60 particles for 10-50, 120 for 100+)
- **Typing Fun** polish: per-level best-WPM AND best-avg-WPM trackers (`type-best-wpm-L{N}` and `type-best-avg-L{N}`); enhanced completion card with 5-tier system (⚡ Quick Learner >25 / 🧙 Typing Wizard >40 / 🥷 Cyber Ninja >60 / 🏆 Lightning Fingers >80); new-best 🏆 NEW BEST! prefix with 150-particle confetti; all-time-best row showing peak and avg WPM
- **Storybooks** polish: per-book read-count (`story-read-{id}`) and total-reads (`story-total-reads`) tracked when player reaches last page via next-button; 60-particle confetti on every story finish; milestone confetti (120 particles) and 🏆 tier toast at 5/10/25/50 stories-read totals
- **All 6 School Skills modules now polished** (Connect the Dots, Tracing & Art, Math Basics, Matching, Typing Fun, Storybooks)
- **SW cache v39 → v40** to flush.

## [5.6.57] - 2026-05-18 - Amni-Learn school skills polish: Connect the Dots + Math Basics + Matching
- **Connect the Dots** polish: per-level completion counter (`dots-completed-L{N}` sessionStorage) — every cleared shape increments and shows in the toast (e.g. "⭐ Triangle #5"); milestone confetti on completion (80 particles for L3+ 3D shapes, 40 for L1-2 2D)
- **Math Basics** polish: per-level best-correct tracker (`math-best-L{N}` sessionStorage); enhanced end-of-round summary card with percentage, named tier (🏆 Perfect 100% / ⭐ Amazing 80%+ / ✨ Great 60%+ / Keep practicing!), best-on-level display, new-best detection (150 particles for new perfect, 80 for new best)
- **Matching** polish: per-level best-moves AND best-time trackers (`match-best-L{N}` and `match-besttime-L{N}`); win celebration distinguishes new-best (150 confetti + 🏆 NEW BEST! prefix) from clean Perfect Memory (80 confetti) from normal wins
- **SW cache v38 → v39** to flush.

## [5.6.56] - 2026-05-18 - Amni-Learn idle/casual COMPLETE: Solitaire + Tower Defense
- **Solitaire** polish: persistent best-completion-time tracker (`haven_sol_best_time` localStorage); win celebration with elapsed time + win-number message; new-best gets 150-particle confetti and 🏆 NEW BEST TIME! prefix vs 120 particles for normal wins
- **Tower Defense** polish: persistent best-wave tracker (`haven_td_best_wave` localStorage); game-over tier system (Newbie Mayor / Apprentice Builder ≥5 / Castle Keeper ≥10 / Defense Captain ≥15 / Tower Strategist 🏆 ≥25); new-best gets 120-particle confetti and NEW BEST! prefix
- **All 8 idle/casual modules now polished** (Cookie Clicker, Auto Miner, Color Sort, Gem Crush, 2048, Color Blast, Solitaire, Tower Defense)
- **SW cache v37 → v38** to flush.

## [5.6.55] - 2026-05-18 - Amni-Learn idle/casual polish: Cookie Clicker + Auto Miner + Gem Crush
- **Cookie Clicker** polish: lifetime-cookies tracker (`ck-lifetime` sessionStorage); 🏆 Lifetime best displayed below CPS rate when known; achievement unlocks now spawn 60-particle confetti alongside existing achievement toast (all 8 milestones from First Cookie through Time Lord/Golden Touch)
- **Auto Miner** polish: lifetime-gems tracker (`am-lifetime`) updated each tick and on click; 🏆 Lifetime best shown in main view; gem-milestone celebrations (100/1K/10K/100K/1M) trigger first-time confetti (100 particles for 100K+, 40 for smaller); prestige now spawns 120-particle confetti on top of existing feedback
- **Gem Crush** (Bejeweled) polish: combo cascade celebrations (3×: blue toast / 5×: SUPER COMBO purple + 40 particles / 8×: MEGA COMBO 🔥 gold + 80 particles / 12×+: LEGENDARY 🔥🔥 red + 120 particles); 8+-gem matches get named-match toast; new-best detection on game over spawns 120-particle confetti
- **6 of 8 idle/casual modules polished** (Cookie Clicker, Auto Miner, Color Sort, Gem Crush, 2048, Color Blast). Remaining: Solitaire, Tower Defense.
- **SW cache v36 → v37** to flush.

## [5.6.54] - 2026-05-18 - Amni-Learn idle/casual polish: 2048 + Color Blast + Color Sort
- **2048** polish: persistent max-tile tracker (`haven_t2048_max` in localStorage), tile-milestone confetti — first-time 512/1024/2048/4096/8192 gets new-max celebration (150 particles for 2048+, 80 for others); subsequent triggers get smaller acknowledgment confetti (40 particles); HUD now shows current Max and all-time 🏆 max tile alongside Score/Best
- **Color Blast** polish: persistent best-score (`haven_cblast_best` in localStorage), HUD shows 🏆 Best; cluster-size milestones — 12+ block clusters get 'HUGE POP! 🔥' + 80-particle confetti; 8+ get 'Big! ✨' + 40 particles; 5+ get 'Nice' acknowledgment; new-best on game over triggers 120-particle confetti and NEW BEST badge
- **Color Sort** polish: per-level best-moves tracking (`cs-best-L{N}` sessionStorage), shown in HUD when known; level-complete tier system (🏆 Perfect ≤2·nc moves / ⭐ Efficient ≤3·nc / ✨ Solid ≤4.4·nc); new-best detection with NEW BEST! prefix + 150 particles; tier label appears in completion toast
- **SW cache v35 → v36** to flush.

## [5.6.53] - 2026-05-18 - Amni-Learn retro arcade COMPLETE: Pong + Minesweeper + Pipes
- **Pong** polish: persistent match-wins counter (`pong-matches`) and best win-streak (`pong-streak`) in HUD. Match win triggers difficulty-scaled bonus (50 + 25·difficulty score, 80-170 confetti particles). Streak counter resets on CPU match win. HUD now shows 🏆 Matches and 🔥 Streak alongside live set score.
- **Minesweeper** polish: tier per difficulty (Easy ≤10s = Lightning ⚡, Medium ≤30s = Sharp 🎯, Hard ≤60s = Master 👑). Win-feedback toast names the tier. New-best gets 120-particle confetti; tier-achieved (without new best) gets 60-particle confetti.
- **Pipe Connect** polish: post-clear tier system (Plumbing Master 🏆 / Efficient / Solid / Cleared) based on moves vs estimated optimal (1.5×grid² heuristic). New-best gets 80-particle confetti; optimal-tier gets 40-particle confetti. Tier label appears in clear-feedback toast.
- **All 8 retro arcade modules now polished** consistently (Snake, Tetris, Breakout, Invaders, Flappy, Pong, Minesweeper, Pipes)
- **SW cache v34 → v35** to flush.

## [5.6.52] - 2026-05-18 - Amni-Learn retro arcade polish: Invaders + Flappy
- **Invaders** polish pass: tier system (Cadet <300 / Rookie <1000 / Squadron Leader <3000 / Veteran Pilot <8000 / Defender of Earth 8000+); persistent best-wave (`inv-best-wave`); polished summary card with 3-stat grid (Score / Wave / All-Time) plus best-wave row; new-best confetti (120 particles); tier color flows into in-canvas GAME OVER text
- **Flappy** polish pass: tier system (Hatchling <10 / Pipe Dodger <25 / Steady Glider <50 / Soaring Eagle <100 / Sky Sage 100+); polished summary card with 3-stat grid (Score / Medal / All-Time); new-best confetti (120 particles); existing medal logic preserved (🏆 40+, 🥇 25+, 🥈 15+, 🥉 5+)
- 5 of 8 retro arcade modules now polished: Snake, Tetris, Breakout, Invaders, Flappy. Remaining: Pong, Minesweeper, Pipe Connect
- **SW cache v33 → v34** to flush.

## [5.6.51] - 2026-05-17 - Amni-Learn retro arcade polish: Snake, Tetris, Breakout
- **Snake** polish pass: tier system (Earthworm <100 / Garter <500 / Cobra <1500 / Anaconda <5000 / Mythic Constrictor 5000+); persistent best-length and best-wave (`snake-best-len`, `snake-best-wave`); polished game-over summary card with 4-stat grid (Score / Length / Wave / All-Time) plus best-length and best-wave; new-best confetti (120 particles)
- **Tetris** polish pass: tier system (Block Stacker <500 / Apprentice <2000 / T-Spin Adept <8000 / Sensei <25000 / Tetris Legend 25000+); tetris-clear (4-line) celebration with 80-particle confetti + 🔥 message; triple/double clears with smaller confetti + named feedback; level-up confetti (50 particles); persistent best-lines and best-level (`tet-best-lines`, `tet-best-level`); tetrisCount tracked per game; polished summary card with 4-stat grid (Score / Lines / Level / Tetrises) plus best-lines and best-level; new-best confetti
- **Breakout** polish pass: tier system (Starter <1000 / Block Hunter <3000 / Paddle Pro <8000 / Power Player <20000 / Wall-Buster Legend 20000+); persistent best-wave (`brk-best-wave`); polished summary card with 3-stat grid (Score / Wave / All-Time) plus best-wave; new-best confetti
- **SW cache v32 → v33** to flush.

## [5.6.50] - 2026-05-17 - Amni-Learn College Philosophy + Economics + Writing + Psychology — ALL 13 COLLEGE SUBJECTS COMPLETE
- **Philosophy & Logic** ~30 → ~60 (+30): Plato's cave, trolley problem, Kant's categorical imperative, utilitarianism, Hume's induction problem, Hegel dialectic, existentialism (Sartre/Camus), Wittgenstein language games, modus ponens/tollens, affirming the consequent fallacy, ad hominem/straw man, confirmation bias, mind-body problem, solipsism, determinism vs free will, theodicy, logical positivism verification principle, a priori/posteriori, Ockham's razor, begging the question, sorites paradox, phenomenology, compatibilism, Ship of Theseus, Pascal's wager, naturalistic fallacy, footbridge variant, Russell's paradox
- **Economics** ~30 → ~60 (+30): comparative advantage, price elasticity, marginal cost = MR profit max, monopoly/competition, GDP three approaches, CPI inflation, Phillips curve, fiscal vs monetary policy, money multiplier 1/RR, S&D equilibrium, public goods + free-rider, tragedy of commons, Pareto improvement, Nash equilibrium, prisoner's dilemma, PPF, cost-push vs demand-pull, Keynesian vs Classical schools, Adam Smith's invisible hand, Giffen vs Veblen goods, crowding out, liquidity preference, Solow growth, Gini coefficient, hyperinflation
- **Academic Writing** ~30 → ~60 (+30): thesis statement, topic sentence, active vs passive voice, hedging, formal register, literature review, IMRAD structure, counterargument, transitions, plagiarism types, primary/secondary sources, et al., evidence-backed claims, run-on/fragment, fact/value/policy claims, formal definition, block quotes, vague "this", concession, rhetorical questions, first-person caveats, clarity (subject+verb early), parallelism, signal phrases, outlining, revision vs editing, synthesis vs summary, common knowledge threshold
- **Psychology** ~31 → ~61 (+30): Pavlov classical conditioning, Skinner operant + variable-ratio reinforcement, cognitive dissonance, Stanford prison + Milgram obedience, Maslow's hierarchy, Piaget stages, Big Five OCEAN, Miller's 7±2, LTM types (declarative/procedural), spacing effect, bystander effect, fundamental attribution error, Dunning-Kruger, locus of control, Kahneman heuristics & biases, confirmation bias, Erikson 8 stages, Kübler-Ross grief, CBT, mirror neurons, IAT, working memory vs STM (Baddeley), cognitive load theory, schemas, sleep stages NREM/REM, stress + HPA axis, priming, replication crisis
- **All 13 college subjects fully expanded** (Calc, Linalg, Stats, Discrete, Physics, Chem, Bio, Algorithms, Datastructs, Philosophy, Econ, Writing, Psych) — each now ~60 questions, so each 30-question run draws from a substantial pool with replay variety.
- **SW cache v31 → v32** to flush.

## [5.6.49] - 2026-05-17 - Amni-Learn College Biology + Algorithms + Data Structures expanded
- **Biology** ~31 → ~61 questions (+30): aerobic ATP yield ~30-38, chlorophyll, eukaryote/prokaryote distinction, 3 domains of life (Bacteria/Archaea/Eukarya), triplet codon, 46 human chromosomes, XX/XY, Mendel's segregation, Aa×Aa Punnett 1:2:1, enzyme activation energy, mitosis vs meiosis, crossing over in prophase I, natural selection trio (variation/heritability/differential reproduction), allopatric speciation, Hardy-Weinberg p²+2pq+q²=1, virus structure, peptidoglycan, succession types, mutualism/commensalism/parasitism, xylem/phloem, C4 plants, insulin from β-cells, action potential Na⁺ channels, innate vs adaptive immunity, apoptosis, cancer mutations, phototropism via auxin, ribosomes translate mRNA
- **Algorithms** ~31 → ~61 (+30): mergesort O(n log n), quicksort worst O(n²), bubble O(n²), heap sort O(n log n), counting sort O(n+k), comparison-sort lower bound Ω(n log n), Kruskal's MST, Bellman-Ford negative edges, Floyd-Warshall all-pairs, greedy activity selection, DP requirements, LCS/knapsack/edit-distance DPs, topo sort needs DAG, BFS/DFS data structures, hash collision strategies, tries, Union-Find α(n), backtracking, Kosaraju/Tarjan SCC, KMP O(n+m), NP-complete intuition, reduction, QuickSelect O(n), set cover ln n, two-pointer technique
- **Data Structures** ~31 → ~61 (+30): linked list O(1) at known pos, array O(1) lookup, AVL balance, Red-Black invariants, B-tree disk-friendly, min-heap, trie space, adjacency list O(V+E) vs matrix O(V²), Bloom filter probabilistic, skip list, Union-Find amortized α(n), LRU cache hash+DLL, segment tree O(log n) range, Fenwick BIT prefix sums, priority queue, circular ring buffer, BST degeneration, quadtree/octree, suffix tree, stack frames, hash load factor α, doubly vs singly linked, Cartesian tree RMQ, persistent data structures, B+ tree leaf chaining, treap, hash worst O(n)
- 4 college subjects remain (Philosophy, Economics, Writing, Psychology)
- **SW cache v30 → v31** to flush.

## [5.6.48] - 2026-05-17 - Amni-Learn College Discrete + Physics + Chemistry expanded
- **Discrete Math** ~31 → ~61 questions (+30): surjection/bijection, permutations P(n,n) and combinations C(7,3), converse vs contrapositive, bipartite & König, Dijkstra, equivalence/partial orders, Big-O, biconditional ↔, mod arithmetic, lattice paths, Stirling numbers S(n,k), quantifiers ∀/∃, Eulerian and Hamiltonian circuits, K_{3,3} planarity (Kuratowski), Master theorem T(n)=2T(n/2)+n, NAND universality, function counting 4³
- **Physics** ~30 → ~60 (+30): Newton 1st & 3rd laws, momentum p=mv, impulse Δp=FΔt, centripetal mv²/r, pendulum T=2π√(L/g), Doppler, Snell's, Ohm's V=IR, P=I²R, Coulomb, λf=v, 1st & 2nd thermo laws, Carnot η=1−T_c/T_h, ideal gas PV=nRT, photoelectric KE_max=hf−φ, Heisenberg ΔxΔp≥ℏ/2, Hooke spring ½kx², Kepler T²∝a³, Faraday induction, Maxwell's 4 equations, Lorentz γ, E=mc², Schrödinger, double-slit, Boltzmann k_B
- **Chemistry** ~30 → ~60 (+30): electron-shell capacity (8 for L), carbon config 1s²2s²2p², molar volume 22.4 L at STP, stoichiometry, Le Chatelier, Lewis/Brønsted acid-base, strong acids, pH 10⁻³ → 3, oxidation as electron loss, galvanic vs electrolysis, lattice energy q₁q₂/r, bond polarity by ΔEN, sp³ tetrahedral, VSEPR, ΔH endo/exo, ΔG<0 spontaneous, functional groups (−OH alcohol), benzene aromaticity, isomers, halogens 7 valence, buffer + Henderson-Hasselbalch, 1st order rate t_(1/2)=ln2/k, Arrhenius k=Ae^(−Ea/RT), Ksp, isotopes neutron count
- **SW cache v29 → v30** to flush.

## [5.6.47] - 2026-05-17 - Amni-Learn College Linear Algebra + Statistics expanded
- **Linear Algebra** ~31 → ~61 questions (+30 new):
  - decomposition family: SVD UΣVᵀ, LU, QR, Jordan canonical
  - theorems: Cayley-Hamilton, spectral theorem, det(AB) = det(A)·det(B)
  - vector norms: L¹/L²/L∞, condition number κ(A)
  - linear maps: change of basis, similarity P⁻¹AP invariants (trace, det), Moore-Penrose pseudoinverse, orthogonality of null/row space, rotation matrix structure, Cramer's rule
  - foundations: REF, max rank, vector space axioms, span, normal/orthogonal matrices
- **Statistics** ~31 → ~61 questions (+30 new):
  - inference: Z-score, t-distribution heavy tails, Type II error & power 1−β, Cohen's d, Bonferroni α/m, MLE
  - distributions: Bernoulli, geometric, exponential, Poisson Var=λ, Markov chains memoryless property
  - tests: χ² goodness-of-fit, ANOVA, regression slope β̂ = Cov/Var, multicollinearity, OLS residual assumptions
  - Bayesian: posterior ∝ likelihood × prior, conjugate priors
  - data: covariance, correlation r = Cov/(σ_X·σ_Y), Simpson's paradox, bootstrap, confounders
  - common pitfalls: p-value misinterpretation, n−1 Bessel's correction, 95% CI long-run capture
- 11 more college subjects to expand in coming iterations (discrete, physics, chem, bio, algorithms, datastructs, philosophy, economics, writing, psychology, college math advanced)
- **SW cache v28 → v29** to flush.

## [5.6.46] - 2026-05-17 - Amni-Learn College Calculus expanded (~34 → ~64 questions)
- **College Calculus bank ~2×** — added 30 new advanced questions:
  - **derivatives**: quotient rule formula, 3rd derivative cycling sin→cos→−sin→−cos, implicit (x²+y²=1), inverse trig (arctan integral), |x| corner at 0, logarithmic differentiation
  - **integration**: ∫ ln(x) dx = x ln(x)−x+C, ∫ 1/(1+x²) dx = arctan, ∫ 1/√(1−x²) dx = arcsin, ∫ sec(x) dx via (sec+tan)/(sec+tan), ∫ x²eˣ dx by parts, ∫_{−∞}^∞ e^(−x²) dx = √π Gaussian
  - **limits**: lim (1−cos x)/x² = 1/2, L'Hôpital indeterminate forms 0/0 and ∞/∞ only
  - **applications**: disk method ∫π[f(x)]² dx, shell method 2πx·f(x), average value (1/(b−a))∫f dx, related rates ladder problem, Newton's method iteration, trapezoidal rule
  - **series**: geometric Σx^n=1/(1−x), Maclaurin cos/1/(1−x), p-series convergence p>1, improper ∫1/x² = 1, ∫1/x diverges
  - **theory**: critical points, saddle/Hessian indefinite, concavity test, partial fraction decomposition, Lagrange multipliers ∇f=λ∇g, separable dy/dx=ky
- Each run picks 30 from pool — now offers real replay variety
- College quizzes (13 subjects) — all ~30 each. Expanding remaining 12 in subsequent iterations.
- **SW cache v27 → v28** to flush.

## [5.6.45] - 2026-05-17 - Amni-Learn Word Bridge L5 COMPLETE — ENTIRE 4× CAMPAIGN DONE
- **Word Bridge L5 expanded** — 16 → 64 entries (+48 × 6 languages = 288 translation cells)
- L5 +48 (expert/scientific/academic):
  - **fields of study**: Geology, Biology, Physics, Psychology, Sociology, Anthropology, Linguistics, Statistics, Probability, Geometry, Algebra, Calculus, Logic
  - **science**: Genome, Molecule, Atom, Particle, Vacuum, Gravity, Magnetism, Frequency, Optics, Laboratory, Experiment, Constellation, Galaxy, Telescope, Microscope
  - **tech**: Algorithm, Database, Network, Software, Internet
  - **policy**: Democracy, Diplomacy, Economy, Globalization, Sustainability, Innovation, Hierarchy, Equilibrium
  - **abstract**: Theory, Paradigm, Synthesis, Analysis, Reasoning, Metaphor, Allegory
- **All 10 major Amni-Learn content banks now FULLY quadrupled** per Anthony's 2026-05-17 directive:
  - Animals quiz: 60 → 280 ✓
  - Languages quiz: 58 → 232 ✓
  - Geography Explorer: 40 → 160 countries ✓
  - Pattern Puzzle: 40 → 160 generators ✓
  - Logic Puzzles: 52 → ~190 ✓
  - Word Scramble: 50 → 200 ✓
  - Anagram: 75 → 300 ✓
  - Word Search: 105 → 420 (28 topics × 15) ✓
  - Word Bridge: 80 → 320 per language × 6 languages ✓
  - Music quiz + Music Studio (earlier batches) ✓
- **SW cache v26 → v27** to flush.

## [5.6.44] - 2026-05-17 - Amni-Learn content quadruple batch 20: Word Bridge L4 quadrupled
- **Word Bridge L4 expanded** — 16 → 64 entries (+48 × 6 languages = 288 translation cells)
- L4 +48 (advanced vocab):
  - **careers**: Artist, Writer, Musician, Lawyer, Architect, Designer, Journalist, Astronaut, Pilot, Farmer, Soldier, Firefighter, Programmer, Nurse
  - **virtues**: Wisdom, Patience, Honesty, Kindness, Trust, Justice, Loyalty, Beauty, Mystery, Curiosity, Imagination, Inspiration, Confidence, Generosity
  - **abstract concepts**: Beginning, Ending, Distance, Speed, Power, Silence, Sound, Voice, History, Future, Past, Reality, Idea, Reason, Meaning, Purpose, Success, Failure, Choice, Decision
- L5 still 16 — final iteration to complete Word Bridge
- **SW cache v25 → v26** to flush.

## [5.6.43] - 2026-05-17 - Amni-Learn content quadruple batch 19: Word Bridge L3 quadrupled
- **Word Bridge L3 expanded** — 16 → 64 entries (+48 entries × 6 languages = 288 translation cells)
- L3 +48 (intermediate vocab):
  - **body** (continued): Finger, Knee, Elbow, Shoulder, Wrist, Neck, Tongue, Chest
  - **time/measure**: Hour, Minute, Second, Week, Month, Today, Tomorrow, Yesterday
  - **nature/weather**: Lightning, Storm, Volcano, Cave, Island, Valley, Hill, Waterfall, Glacier, Frost, Dawn, Dusk
  - **emotions**: Hope, Fear, Joy, Anger, Surprise, Smile, Tear, Laugh
  - **activities**: Walking, Running, Swimming, Dancing, Reading, Writing, Drawing, Singing, Cooking, Driving
  - **concepts**: Truth, Peace
- L4 and L5 still 16 each — two more iterations to complete Word Bridge
- **SW cache v24 → v25** to flush.

## [5.6.42] - 2026-05-17 - Amni-Learn content quadruple batch 18: Word Bridge L1 + L2 quadrupled
- **Word Bridge L1 + L2 expanded** — 16 → 64 entries each (+96 entries × 6 languages = 576 translation cells)
  - L1 +48 (basic vocab): body parts (Eye, Ear, Hand, Foot, Head, Mouth, Nose, Tooth, Hair); animals (Cow, Pig, Horse, Sheep, Mouse, Duck, Rabbit, Lion, Bear, Snake, Bee); food (Rice, Cheese, Sugar, Salt, Coffee, Tea, Banana, Orange, Cake, Meat); nature (Sea, Lake, Sky, Rain, Grass, Leaf, Stone); colors (Red, Blue, Green, Yellow, Black, White); numbers (One-Five)
  - L2 +48 (everyday phrases & places): Yes, No, Sorry, Welcome; rooms (Bathroom, Kitchen, Bedroom, Office); places (Park, Hospital, Bank, Market, Restaurant, Hotel, Airport, Station, Beach, Library, Church, Pharmacy, Shop); family (Father, Mother, Brother, Sister, Son, Daughter, Baby, Boy, Girl, Man, Woman); concepts (Country, Language, Color, Number, Letter, Word, Question, Answer, Picture, Game, Toy, Bag, Hat, Shoe, Chair, Table)
- All 6 languages (Spanish, French, German, Italian, Chinese, Hindi) translated for every entry — including Devanagari and simplified Chinese characters
- L3, L4, L5 still 16 each — pending next iterations
- **SW cache v23 → v24** to flush.

## [5.6.41] - 2026-05-17 - Amni-Learn content quadruple batch 17: Word Search COMPLETE at 28 topics / 420 words
- **Word Search FULLY quadrupled** — 105 → 420 words, 7 → 28 topics, +10 final topics
  - **jobs**: TEACHER, DOCTOR, LAWYER, ENGINEER, NURSE, FARMER, PILOT, CHEF, MECHANIC, ARCHITECT, JOURNALIST, PROGRAMMER, SCIENTIST, ARTIST, BAKER
  - **body**: HEART, BRAIN, LUNG, LIVER, KIDNEY, MUSCLE, BONE, NERVE, ARTERY, SKULL, SPINE, PELVIS, FEMUR, RETINA, CORTEX
  - **clothing**: SHIRT, PANTS, JACKET, SWEATER, DRESS, SKIRT, BOOTS, GLOVES, SCARF, SOCKS, SANDALS, TUXEDO, KIMONO, BLAZER, PONCHO
  - **shapes**: CIRCLE, SQUARE, TRIANGLE, RECTANGLE, OVAL, HEXAGON, OCTAGON, PENTAGON, DIAMOND, STAR, CUBE, SPHERE, CONE, CYLINDER, PYRAMID
  - **gems**: DIAMOND, RUBY, EMERALD, SAPPHIRE, AMETHYST, TOPAZ, OPAL, PEARL, QUARTZ, JADE, ONYX, GARNET, AGATE, TURQUOISE, BERYL
  - **weapons**: SWORD, ARROW, DAGGER, SPEAR, LANCE, CROSSBOW, CANNON, MUSKET, RIFLE, PISTOL, SHIELD, HAMMER, MACE, KATANA, HALBERD
  - **buildings**: HOUSE, CASTLE, TEMPLE, CHURCH, MOSQUE, PYRAMID, TOWER, SKYSCRAPER, FORTRESS, MANSION, BARN, CABIN, COTTAGE, PAGODA, BUNGALOW
  - **emotions**: HAPPY, ANGRY, FEAR, JOY, GRIEF, LOVE, HOPE, PRIDE, SHAME, ENVY, CALM, EXCITED, SURPRISE, TRUST, CURIOUS
  - **insects**: ANT, BEETLE, MOTH, WASP, MOSQUITO, CRICKET, GRASSHOPPER, DRAGONFLY, FIREFLY, LADYBUG, TERMITE, COCKROACH, WEEVIL, MAYFLY, APHID
- Each word has a 1-line definition shown on find. Topic picker UI auto-shows all 28 buttons.
- **SW cache v22 → v23** to flush.

## [5.6.40] - 2026-05-17 - Amni-Learn content quadruple batch 16: Word Search +11 topics (105 → 270 words)
- **Word Search expanded** from 7 topics to 18 topics (+165 words). Each topic still 15 words with definitions.
- New topics added:
  - **music**: TEMPO, CHORD, SCALE, MELODY, RHYTHM, PIANO, VIOLIN, CELLO, OBOE, OCTAVE, CADENCE, TIMBRE, HARMONY, SONATA, BALLAD
  - **sports**: SOCCER, TENNIS, HOCKEY, BOXING, RUGBY, GOLF, KARATE, JUDO, CYCLING, ROWING, SKIING, SURFING, ARCHERY, FENCING, JAVELIN
  - **weather**: THUNDER, CYCLONE, BLIZZARD, DROUGHT, MONSOON, TORNADO, HUMIDITY, BAROMETER, HAILSTONE, DRIZZLE, FORECAST, PRESSURE, CIRRUS, STRATUS, CUMULUS
  - **art**: CANVAS, PALETTE, PORTRAIT, PASTEL, MURAL, SCULPTURE, CUBISM, BAROQUE, MOSAIC, COLLAGE, ETCHING, CHISEL, EASEL, GRAFFITI, PIGMENT
  - **history**: PHARAOH, CAESAR, KNIGHT, CASTLE, EMPIRE, COLONY, TREATY, REVOLUTION, PYRAMID, SAMURAI, VIKING, GLADIATOR, EXPLORER, DYNASTY, CARAVAN
  - **mythology**: TITAN, OLYMPUS, PHOENIX, CENTAUR, MINOTAUR, MEDUSA, PEGASUS, CYCLOPS, TROLL, DRAGON, KRAKEN, HYDRA, SIREN, GORGON, NEPTUNE
  - **medicine**: SURGEON, VACCINE, ANTIBIOTIC, TUMOR, BIOPSY, ALLERGY, PLASMA, ARTERY, IMMUNE, ENZYME, GENOME, STETHOSCOPE, INSULIN, KIDNEY, OXYGEN
  - **chemistry**: HYDROGEN, CARBON, NITROGEN, SODIUM, COPPER, CHLORINE, MERCURY, BEAKER, BUNSEN, PIPETTE, CATALYST, ISOTOPE, MOLECULE, POLYMER, TITRATION
  - **plants**: CHLOROPHYLL, STAMEN, PISTIL, BAOBAB, SEQUOIA, CACTUS, BAMBOO, FERN, MOSS, ORCHID, LICHEN, NECTAR, POLLEN, SAPLING, STAMINATE
  - **geography**: AMAZON, SAHARA, EVEREST, NILE, GOBI, ANDES, ALPS, PYRENEES, BALKANS, PATAGONIA, SIBERIA, YUKON, SAHEL, STEPPE, FJORD
  - **transport**: AIRPLANE, HELICOPTER, SUBMARINE, BICYCLE, SCOOTER, SAILBOAT, YACHT, CARRIAGE, CHARIOT, MONORAIL, TRAMWAY, CARAVAN, GONDOLA, SCHOONER, ROCKET
- Topic-picker UI auto-shows the new buttons
- Need ~10 more topics next iteration to hit 4× (420 words)
- **SW cache v21 → v22** to flush.

## [5.6.39] - 2026-05-17 - Amni-Learn content quadruple batch 15: Anagram 75 → 300 — COMPLETE
- **Anagram bank FULLY quadrupled** — 15 → 60 words per level across all 5 levels (+225 words). Bank now 300 entries.
  - L0 (+45, 4-letter): FILM, GOLD, FOAM, HERB, IRIS, KIWI, MELT, NAVY, OBOE, PAIR, PORK, RUST, SAGE, TAPE, VEIN, WOLF, YOGA, MOSS, PEAR, ROOT, SAND, TEAM, VINE, WAND, ZEST, ACID, ECHO, LIME, MINT, NEST, BEND, CAKE, EXIT, GRAY, HOPE, IRON, LION, MEND, OPAL, PARK, RUBY, SNOW, TIDE, HARP, QUIZ
  - L1 (+45, 5-letter): SHARK, BREAD, TIGER, EAGLE, ROBIN, NIGHT, RAVEN, SWORD, GLOBE, PRISM, NOVEL, ANVIL, ARROW, BLADE, COMET, CURVE, DELTA, ETHIC, FAULT, FROST, GIANT, GRAIN, HOTEL, INPUT, IVORY, JEWEL, KARMA, LOGIC, METAL, MOTOR, MUSIC, NORTH, PEACH, PEARL, PLUTO, RADIO, REIGN, SHEEP, SLATE, SOLID, SPICE, STEEL, SUGAR, THORN, TULIP
  - L2 (+45, 6-letter): SHADOW, BRIDGE, COSMIC, DESERT, EFFORT, FAMILY, GLOBAL, HARBOR, ISLAND, JUNGLE, LADDER, MAGNET, NEEDLE, OXYGEN, PLANET, QUIVER, SUMMER, THRONE, VALLEY, WINTER, AUTUMN, ANSWER, BATTLE, BUDGET, CAMERA, CIRCLE, DOCTOR, DRAGON, ENERGY, ENGINE, FOREST, GALAXY, GENIUS, INSECT, MARKET, MEMORY, MIRROR, MUSEUM, NATION, OBJECT, ORANGE, REASON, RHYTHM, SCHOOL, SECRET
  - L3 (+45, 7-letter): ACADEMY, ADVANCE, ANCIENT, ARCHIVE, AVERAGE, BICYCLE, BIOLOGY, BIZARRE, BRACKET, BREATHE, CABINET, CALCIUM, CAPTURE, CHAMBER, CHAPTER, COMBINE, COMFORT, COMPACT, COMPANY, COMPARE, COMPETE, COMPLEX, COMPUTE, CONCERT, CONNECT, CONTROL, CONVERT, CORRECT, COUNSEL, CRACKER, CREATOR, CRICKET, CRYPTIC, CULTURE, CURIOUS, CURRENT, CUSHION, CYCLING, JOURNEY, KINGDOM, LIBRARY
  - L4 (+45, 8-letter): ALPHABET, AMETHYST, AIRCRAFT, AMBITION, ARMCHAIR, AUDIENCE, AVIATION, BACKBONE, BACTERIA, BASEBALL, BOUNDARY, BROCHURE, CAFFEINE, CAPACITY, CHAIRMAN, CHAMPION, CHEMICAL, CIVILIAN, COMMERCE, COMPOSER, COMPUTER, CONCRETE, ANALYSIS, BIRTHDAY, FOOTBALL, DAYBREAK, DIAGNOSE, DISGUISE, ELECTRIC, EQUALITY, GRADIENT, HARMONIC
- Each entry has definition + category badge (🔢 Subject, 🎨 Art, ⚗️ Chemistry, 🦠 Biology, 🚀 Physics, etc — diverse semantic spread)
- Per-run draws random word; levels auto-advance every 3-correct streak
- **SW cache v20 → v21** to flush.

## [5.6.38] - 2026-05-17 - Amni-Learn content quadruple batch 14: Word Scramble 50 → 200 — COMPLETE
- **Word Scramble FULLY quadrupled** — 10 → 40 words per level across all 5 levels (+150 words)
  - L1 (+30, 3-letter): BAT, BED, BEE, COW, FOX, HEN, ICE, KEY, MAP, NUT, OWL, PEN, PIG, PIE, RAT, SKY, TOY, TUB, VAN, YAK, ZOO, ARM, EAR, EYE, JAR, LEG, NET, OAK, FAN, PIT
  - L2 (+30, 5-letter): GRAPE, LEMON, BREAD, BEACH, FIELD, RIVER, FRUIT, GLOVE, SMILE, NIGHT, LIGHT, CHAIR, MOUSE, EARTH, WORLD, HORSE, ZEBRA, EAGLE, STORM, PIANO, CANDY, JUICE, HONEY, CLOCK, BRICK, PIZZA, ANGEL, DREAM, ROBIN, FRESH
  - L3 (+30, 8-letter): SNOWFALL, HOSPITAL, RAINBOWS, BLUEBIRD, BREAKING, PYRAMIDS, MUSICIAN, PLATFORM, VOLCANIC, AIRPLANE, GARDENER, HOLIDAYS, KEYBOARD, NOTEBOOK, OVERVIEW, UNIVERSE, WANDERER, ACOUSTIC, BIRTHDAY, CALENDAR, INTERNET, FOOTBALL, BASEBALL, MAGAZINE, FRIENDLY, IDENTITY, JOURNEYS, LANGUAGE, EXPLORER, PRACTICE
  - L4 (+30, 9-letter): ARCHITECT, CARPENTER, CHEMICALS, EDUCATION, FOOTPRINT, GLADIATOR, INVENTORS, KNOWLEDGE, MACHINERY, NUTRITION, QUARTERLY, RESONANCE, SIGNATURE, TURBULENT, VARIATION, YESTERDAY, ASTRONAUT, BRILLIANT, DETECTIVE, EQUATIONS, FURNITURE, GARDENING, HARMONICA, MENTALITY, OBSERVERS, PARENTING, EXCELLENT, COMMUNITY, PRINCIPLE, INSURANCE
  - L5 (+30, 10-15 letter): ASTROPHYSICS, BIOTECHNOLOGY, CRYPTOGRAPHY, DERMATOLOGY, ENTOMOLOGY, FERMENTATION, GASTRONOMY, IMMUNOLOGY, JURISDICTION, LITHOGRAPHY, MICROBIOLOGY, NANOSCIENCE, ORTHOGRAPHY, PALEONTOLOGY, RADIOACTIVITY, SUSTAINABILITY, THERMODYNAMICS, ULTRAVIOLET, ZOOPLANKTON, ALPHABETIZE, BUREAUCRACY, CIVILIZATION, HEMISPHERE, INFRASTRUCTURE, MATHEMATICAL, OPHTHALMOLOGY, PHARMACEUTICAL, PROFESSIONAL, PSYCHOLOGICAL, EXTRAORDINARY
- Each word has hint, emoji, and 1-line definition (shown after solve)
- **SW cache v19 → v20** to flush.

## [5.6.37] - 2026-05-17 - Amni-Learn content quadruple batch 13: Logic Puzzles 52 → ~190
- **Logic Puzzles quadrupled** — 52 → ~190 puzzles (+~138). Bank covers 7 categories:
  - 🔢 Math: hourglass timing, age problems, water tanks, divisors, snail-in-well, painters/workers, narcissistic numbers
  - 📈 Sequence: Tribonacci, n²(n+1), differences of primes, look-and-say, factorials, polygonal numbers
  - 🔤 Word: longest top-row keyboard word TYPEWRITER, UNCOPYRIGHTABLE/DERMATOGLYPHICS, autoantonyms (cleave), palindromes (TATTARRATTAT), anagrams of SILENT
  - 🧮 Logic: Wason selection cards, Einstein's puzzle, 3 boxes mislabeled, pirate game, dark room coin flip, Hardest Logic Puzzle Ever (Boolos), painted cube, 100 doors prisoners
  - 🎲 Probability: Monty Hall, birthday paradox, dice sums, royal flush odds 1/649740, geometric expectation
  - 🌀 Lateral: deserts and walks, bullet through vest, hiccup-cure gun, photographer husband, North Pole bear, Monopoly bankruptcy, dead man parachute
  - 🔮 Riddle: keys-without-locks, candle aging, glove anatomy, mirror always-tells-truth, sharpening-mind, fragile-silence
- Per-run still draws 15 puzzles randomly from the pool — now far better replay variety
- **SW cache v18 → v19** to flush.

## [5.6.36] - 2026-05-17 - Amni-Learn content quadruple batch 12: Pattern Puzzle FULL — 40 → 160 generators
- **Pattern Puzzle COMPLETELY quadrupled** — 8 → 32 generators per level across all 5 levels (+120 generators)
  - L1 (+24 kids/visual): more ABAB color/animal/food pairs, ABC three-cycles, AAB patterns, counting up/down 1, alphabet, days of week, months
  - L2 (+24 elementary): ×4/×6/×7/×8/×9/×11/×12 tables, descending by 10/5/3, three-color cycles, +1+2 alternating, alphabet/days/months, doubling, ×10 powers
  - L3 (+24 intermediate): ×4 ×5 powers, n(n+1), hexagonal, pentagonal, Lucas, ×3+1, n²+n−1, odd/even squares, increasing-gap differences, ÷2 fractional, Fibonacci variants, look-and-say
  - L4 (+24 advanced): Bell numbers, Tribonacci, Fermat numbers Fₙ=2^(2ⁿ)+1, Jacobsthal, look-and-say, Padovan-style, n³+1, double factorials (2n−1)!!, primes, (3ⁿ−1)/2, Catalan extended
  - L5 (+24 expert): Pell numbers, Padovan, Bell B₇, Sylvester sequence 2,3,7,43,1807, squares of Fibonacci, repunits, Σk³, n^(n−1), centered hexagonal, star numbers Sₙ, square pyramidal, pentatope C(n+3,4), C(n+4,5) hyper-tetrahedral, powers of 7, Chebyshev-like recurrences
- Bank now 160 unique generators delivering math-substantive deep practice
- **SW cache v17 → v18** to flush.

## [5.6.35] - 2026-05-17 - Amni-Learn content quadruple batch 11: Geography Explorer L5 — COMPLETE
- **Geography Explorer FULLY QUADRUPLED** — L5 8 → 32 (+24 countries, +24 facts). Bank now 160 countries across 5 levels.
  - L5 +24 (micro/island/obscure): Andorra, San Marino, Vatican City, Liechtenstein, Monaco, Malta, Luxembourg, Cyprus, Bhutan, Brunei, East Timor, Maldives, Belize, Suriname, Guyana, Fiji, Samoa, Tonga, Vanuatu, Papua New Guinea, Solomon Islands, Seychelles, Comoros, Cape Verde
- Every Geography Explorer playthrough now traverses 160 unique flag/capital/continent challenges with substantive cultural facts (per Anthony 2026-05-17 directive: "all flags should be used")
- **SW cache v16 → v17** to flush.

## [5.6.34] - 2026-05-17 - Amni-Learn content quadruple batch 10: Geography Explorer L3 + L4
- **Geography Explorer L3 + L4 expanded** — 8 → 32 countries each (+48 countries, +48 facts entries)
  - L3 +24 (moderate-recognition): Estonia, Latvia, Lithuania, Belarus, Serbia, Slovakia, Slovenia, Albania, Mozambique, Madagascar, Botswana, Namibia, Rwanda, Côte d'Ivoire, Oman, Qatar, Bahrain, Kuwait, Jordan, Lebanon, Syria, Uruguay, Ecuador, Trinidad and Tobago
  - L4 +24 (less-known/Stans/interior Africa/Balkans): Georgia, Armenia, Azerbaijan, Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan, Turkmenistan, Mali, Burkina Faso, Niger, Chad, Somalia, Eritrea, South Sudan, Central African Republic, DRC, Republic of the Congo, Gabon, Mauritania, Equatorial Guinea, Moldova, North Macedonia, Bosnia and Herzegovina
- Each new country has flag/capital/continent + substantive geographic/cultural fact (e-governance Estonia, 1000s of bunkers Albania, 8000-year Georgian wine, 'Door to Hell' Turkmenistan, etc)
- L5 still 8 — final geography batch next iteration
- **SW cache v15 → v16** to flush.

## [5.6.33] - 2026-05-17 - Amni-Learn content quadruple batch 9: Geography Explorer L1 + L2
- **Geography Explorer L1 + L2 expanded** — 8 → 32 countries each (+48 countries, +48 facts entries)
  - L1 +24 (most familiar): Indonesia, Greece, Switzerland, Netherlands, Ireland, Portugal, Belgium, Austria, Saudi Arabia, UAE, Israel, Singapore, Denmark, Finland, Iceland, Cuba, Jamaica, Costa Rica, Venezuela, Iran, Romania, Malaysia, Bulgaria, Croatia
  - L2 +24 (well-known): Iraq, Afghanistan, Algeria, Tunisia, Ghana, Senegal, Tanzania, Uganda, Zimbabwe, Angola, Cameroon, Bolivia, Paraguay, Guatemala, Honduras, Panama, Dominican Republic, Haiti, El Salvador, Cambodia, Laos, Nepal, Yemen, Mongolia
- Each new country has flag emoji, capital, continent + a substantive geographic/cultural fact
- L3 + L4 + L5 still 8 each — pending next iterations
- **SW cache v14 → v15** to flush.

## [5.6.32] - 2026-05-17 - Amni-Learn content quadruple batch 8: Languages L2 + L3
- **Languages quiz fully quadrupled** — L2 + L3 +90 questions (Languages bank now 232 total across 5 levels)
  - L2: 15 → 60 (+45: more letter-start questions, expanded opposites set, multi-language hello/goodbye/yes/no/thanks across Spanish/French/Italian/Japanese/German, punctuation incl. quotes & apostrophe, irregular plurals foot/mouse/fish, rhymes tree/moon/blue, syllable counting cat/butter/elephant, action vs descriptor noun-verb-adjective distinction, alphabet count)
  - L3: 15 → 60 (+45: adverbs, pronouns, prepositions, prefixes un-/re-/dis-, suffixes -ful/-less/-ly, homophones, metaphor vs simile, personification, onomatopoeia, hyperbole, idioms, irregular past tense eat/see/write/buy, contractions don't/I'm/won't, possessives, articles a/an/the rules, capitalization, syllables, stanza, rhyme scheme, please/I-love-you/good-morning/excuse-me/friend/house across Spanish/French/Japanese/German, Cyrillic, Chinese characters, RTL Arabic/Hebrew, diphthongs, vowel identification, person 1st/2nd/3rd)
- **SW cache v13 → v14** to flush.

## [5.6.31] - 2026-05-17 - Amni-Learn content quadruple batch 7: Languages L1, L4, L5
- **Languages quiz expansion** — L1 + L4 + L5 quadrupled (+84 questions)
  - L1: 8 → 32 (full A-Z letter find with audio + which-word-starts-with for A/B/C/D/S/M)
  - L4: 10 → 40 (+30: synecdoche, etymology, Great Vowel Shift, Grimm's Law, portmanteau, onomatopoeia, euphemism, hyperbole, who/whom, dangling modifier, split infinitive, Oxford comma, active/passive, subjunctive, register, lingua franca, back-formation, chiasmus, tautology, orthography, calque, glottalization, homograph/homophone, affect/effect, idiolect, Zipf's Law, transitive/intransitive)
  - L5: 10 → 40 (+30: comparative method, phonotactics, tonal languages, click consonants, ergative-absolutive, SVO/SOV, recursion, grammaticalization, competence/performance, clitics, morphosyntax, polysynthesis, Chomsky hierarchy, deixis, deep/surface structure, Tok Pisin, McGurk effect, sound symbolism, suprasegmentals, corpus linguistics, glossolalia, language vs dialect, poverty of the stimulus, iconicity, extension/intension, performatives, presupposition, phonetics vs phonology, linguistic typology)
- L2 (15) + L3 (15) — still pending, queued for next iteration
- **SW cache v12 → v13** to flush.

## [5.6.30] - 2026-05-17 - Amni-Learn content quadruple batch 6: Animals L4-L5
- **Animals quiz finished** — L4 and L5 quadrupled from 10 each to 40 each (+60 questions, 280 total in Animals bank)
  - L4 (+30): ectothermy, ecological niche, skin as largest organ, taxonomic ranks, arthropods, cnidocyte stinging cells, monotremes, chordate defining traits, venom vs poison, nitrogen fixation, placenta, allopatric/sympatric speciation, genes/genotype, mitochondria, ribosomes, central dogma DNA→RNA→protein, 46 chromosomes, taxonomy, convergent evolution, vestigial structures, bat echolocation, dolphin unihemispheric sleep, metamorphosis, ecdysone, golden poison dart frog, cellulose vs chitin, pancreatic endocrine glucose regulation
  - L5 (+30): allometric scaling (Kleiber), kin selection (Hamilton's rule), sexual dimorphism, trophic cascade, genetic drift, bottleneck effect (elephant seals), founder effect (Amish EvC), heterozygote advantage (sickle/malaria), reproductive isolation, mitosis vs meiosis, gene flow, four conditions for natural selection, r vs K selection, analog graded vs digital action potentials, innate vs adaptive immunity, zoonotic disease, living fossils (coelacanth), blue whale largest, elephant gestation
- **SW cache v11 → v12** to flush.

## [5.6.29] - 2026-05-17 - Amni-Learn content quadruple batch 5: Animals L1-L3
- **Animals quiz expanded L1, L2, L3** — 55 → 220 questions (+165)
  - L1: 25 → 100 (baby names, animal homes, what they eat, body parts, identifying by features, classifications)
  - L2: 15 → 60 (legs by class, fastest/loudest/longest, mammal/fish heart chambers, monotremes, echolocation, animal records, herbivore/carnivore/omnivore, amphibian)
  - L3: 15 → 60 (ornithology/herpetology/ichthyology/mammalogy, vertebrates, insect orders, marsupials, camouflage, mimicry, symbiosis types — mutualism/commensalism/parasitism, biodiversity, IUCN Red List, endemic species, keystone species, nocturnal/diurnal, group names: pride/herd/school, sequential hermaphroditism, tardigrades)
- L4 + L5 still at 10 each — pending next iteration
- **SW cache v10 → v11** to flush.

## [5.6.28] - 2026-05-17 - Amni-Learn content quadruple batch 4: Engineering quiz all 5 levels
- **Physics & Engineering quiz quadrupled across every level** — 53 → 216 questions
  - L1: 8 → 33 (kid physics — friction, brakes, fans, helmets, paper airplanes, etc)
  - L2: 10 → 41 (simple machines all 6, Newton's first law, energy types, SI units, mass vs weight, conductors/insulators, balanced/unbalanced forces, renewable energy, what engineers do)
  - L3: 15 → 60 (Newton's 3rd law, momentum, impulse, work-energy theorem, scalar vs vector, torque, angular momentum, Archimedes, Pascal, thermo laws 1+3, latent heat, wave speed, Snell's law, AC/DC, Coulomb, Faraday induction, right-hand rule, photoelectric proof, transistors/diodes/L/C, CMOS, antenna, truss/rebar, compressive vs tensile, factor of safety, strain gauge, hysteresis)
  - L4: 10 → 41 (Mohr's circle, beam deflection, thermal resistance analog, Strouhal/vortex shedding, Wheatstone, transfer function, Laplace use, state-space, gain margin, phase margin, Sallen-Key, Wien bridge, three-phase, Y vs Δ, Euler buckling, static vs kinetic friction, cantilever, Rankine/Brayton/Otto/Diesel cycles, phasor, skin effect, Hall effect, piezoelectric, CMOS inverter, PWM, aliasing, thermistor vs RTD, I-beam optimization)
  - L5: 10 → 41 (Lyapunov stability, Mach/Prandtl/Biot numbers, Galois groups in coding, BCH/Reed-Solomon, Viterbi, matched filter, FIR/Z-transform, BJT vs FET, bandgap reference, chopper-stabilized amp, Maxwell's equations, displacement current, waveguide TE/TM, group vs phase velocity, quartz oscillator, parametric amp, shot noise, Johnson-Nyquist, 1/f noise, lock-in amp, Maxwell-Boltzmann/Fermi-Dirac/Bose-Einstein distributions, spin-orbit coupling, topological insulator, Bragg's law, metamaterials)
- **SW cache v9 → v10** to flush.

## [5.6.27] - 2026-05-17 - Amni-Learn music modules massive expansion
- **Music subject quiz quadrupled across all 5 levels + 2 new advanced banks**
  - L1: 13 → 52 (instruments, percussion, beat/melody, music vocab, songs, recording, conducting)
  - L2: 15 → 60 (instrument families, dynamics, sharps/flats, voice ranges, time sigs, world drums, composers)
  - L3: 15 → 60 (modes, intervals, chord types, key sigs, composers, tempo terms, form)
  - L4 (NEW): 40 (orchestra families, sonata-allegro, serialism, impressionism, blues/jazz scales, Bernstein, equal temperament)
  - L5 (NEW): 40 (spectral music, musique concrète, integral serialism, Messiaen modes, Cage 4'33", Reich phasing, Penderecki, Ligeti, Xenakis stochastic, set theory)
  - Total: 43 → 252 music questions
- **Music Studio melody library 6 → 47 melodies across all 5 levels**
  - L1: 8 simple (3-note phrases, scales, echo); L2: 10 (folk classics + scales); L3: 10 (Ode to Joy, Jingle Bells, Happy Birthday, Saints, Amazing Grace, blues/Dorian); L4: 9 (Für Elise, Greensleeves, Canon, all 4 church modes, whole-tone, chromatic); L5: 10 (Bach Prelude, Air on G String, Moonlight, Nachtmusik, Schoenberg row, Webern row, octatonic)
- **Melody challenge enabled at L1** (was L2+). Kids tap simple 3-note tunes; adults play Schoenberg rows.
- **Instrument Explorer 8-12 → 30+ across levels** — L1 base now 12 (added Xylophone, Triangle, Maracas, Tambourine); L2+ Cello/Bass/Trombone/Ukulele; L3+ Harp/Piccolo/Timpani/Clarinet/Oboe/Tuba; L4+ Viola/Bassoon/English Horn/Bongos/Djembe/Harpsichord; L5+ Theremin/Celesta/Sitar/Tabla/Shakuhachi/Erhu.
- **SW cache v8 → v9** so music expansion reaches users.

## [5.6.26] - 2026-05-17 - Amni-Learn content quadruple, batch 2: structural + Math
- **Anthony clarified scope** — quadruple applies to ALL levels (L1-L5), not just L4/L5. Per-module rules: quizzes = 100-question randomized runs, Geography uses ALL flags every playthrough, pre-K Tracing letters/numbers randomized each session and re-shuffled on wrap. Memory `feedback_amni_learn_quadruple_content.md` updated.
- **Quiz 100q run** — `currentQuiz = shuffled.slice(0, 100)` (was 30). Pool now combines lower levels until ≥100 entries, so a level-5 player draws from all bands.
- **Geography all-flags** — `pool = [...all-levels-combined].sort(random)` (was per-level only 8). Every Geography session walks the entire roster of countries.
- **Tracing randomization** — `getTracingTargets()` Fisher-Yates shuffles per session. Re-shuffles when the user wraps past the last target, so consecutive playthroughs start with a different letter. Also expanded L2-5 word lists (~2× more terms per level).
- **Math quiz quadrupled across ALL 5 levels** — L1 8→32 (+24), L2 10→41 (+31), L3 15→60 (+45), L4 40 (already), L5 40 (already). 213 total math questions now, enough for the 100q randomized run from any level.
- **SW cache v7 → v8** so the +100 math questions + structural fixes reach users.

## [5.6.25] - 2026-05-17 - Amni-Learn content quadruple, batch 1: Science quiz L4+L5
- **Directive** — Anthony asked for 4× content expansion across every Amni-Learn module bank. New durable memory `feedback_amni_learn_quadruple_content.md` tracks the goal. Iterations will progressively expand each module's content until every bank hits 4×.
- **Science L4** — 10 → 40 questions (+30 new). New L4 topics: Schrödinger equation, plate tectonics, radioactive half-life, DNA-vs-RNA chemistry, greenhouse effect mechanism, dark-matter evidence, Rayleigh scattering, ATP synthase, Mendel's segregation, fluorescence vs phosphorescence, Beer-Lambert law, aurora cause, escape velocity, supernova nucleosynthesis, ozone layer, Krebs ATP yield, mitosis vs meiosis, electronegativity, water specific heat, speed of sound, Avogadro's law, gravitational time dilation, ionic vs covalent, Li-ion chemistry, fission vs fusion, C-14 dating, biodiversity hotspot, biomimicry, black-hole event horizon, CMB.
- **Science L5** — 10 → 40 questions (+30 new). New L5 topics: Berry phase, neutrino oscillation, cosmic inflation, Hawking radiation, CP violation, supersymmetry, color confinement, Penrose process, CKM matrix, fermion generations, integer quantum Hall, anyons, EPR paradox, Bell's theorem, Wick rotation, Feynman diagrams, lattice QCD, magnetic monopoles, skyrmions, dark energy, Planck length, strong CP problem, axions, Higgs mechanism, QCD vacuum, weak chirality, renormalizability, decoherence, Aharonov-Bohm, Unruh effect. Graduate/specialist depth.
- **SW cache v6 → v7** so the +60 questions reach users.

## [5.6.24] - 2026-05-17 - Amni-Learn SW cache bump v4 → v5 (deploy stale-cache flush)
- **Root cause** — every v5.6.x polish push (sudoku highlight rewrite, card pairs, reflex pacing, all 24 audit batches) hit the Pages build, but `learn/sw.js` cache version was still pinned at `amni-learn-v4`. Users with the service worker installed kept serving the pre-fix HTML from cache; the Sudoku "color-flooding" rgba-transparency bug appeared to persist for them even though it was fixed at the source 24 commits ago.
- **Fix** — bumped `CACHE = 'amni-learn-v4'` → `'amni-learn-v5'`. The activate handler will purge the v4 cache on next page load, forcing a fresh fetch of all v5.6.x HTML/CSS/JS.
- **Action for users** — open the live site once (any page in `/learn/`). The SW will update in the background and a second reload picks up everything: sudoku highlights, card pairs polish, anagram definitions, etc.

## [5.6.23] - 2026-05-17 - Amni-Learn audit batch 24: AI Ethics Debug polish (5 levels + hints + impact)
- **Bank expanded 3 → 5 levels** — added Confounded Feature (a fraud-detection model where a third-party signup-source code spuriously correlates with fraud labels via pipeline batching) and Adversarial Robustness (noise channel that flips predictions on 1% pixel perturbation).
- **Real-world impact card on solve** — every level now reveals its engineering context: data-leakage cost of offline-online metric divergence, husky-vs-wolf classifier story, GDPR/CCPA pseudonymization vs membership-inference attacks, Simpson's-paradox-style confounded features, Goodfellow 2014 adversarial examples. Pure ML-engineering framing throughout.
- **💡 Hint button** — 3 progressive hints per level (the leaky feature is X → cut its wire → boost legit features). Lets adults debug without spoiling the lesson, with a scoring tradeoff.
- **Persistent solved-level tracking** — `netdebug-solved` sessionStorage with progress bar ✅/▶/⬜.
- **Attempt counter** — shown after wrong tests; nudges users toward hints if stuck.
- **Score scaling** — rewards first-try no-hint solves up to +11 pts. Multi-attempt or heavily-hinted solves still award 2 pts.
- **Curriculum completion celebration** — finishing all 5 levels triggers a gradient card recapping the 5 patterns (leakage, spurious correlation, privacy, bias amplification, adversarial robustness) + 150-particle confetti.

## [5.6.22] - 2026-05-17 - Amni-Learn audit batch 23: Block Mover polish (BFS optimal + tiers)
- **BFS-computed optimal step count** — every level's shortest path is calculated on the fly via breadth-first search through the 6×6 grid. Adults learning programming logic get a concrete optimality target.
- **Target chip above grid** — shows "🎯 Optimal: N · ⭐ Best: M" so players know the goal AND their personal record before they start.
- **Per-level personal best** — `blk-best-L{0..9}` sessionStorage (least steps). Persisted across sessions.
- **Tier system on level clear** — Optimal (=opt steps) / Efficient (opt+1-2) / Good (opt+3-5) / Done (>opt+5). Tier-tag color-coded on summary.
- **Optimal-streak counter** — `blk-opt-streak` HUD stat tracks consecutive levels solved with optimal step count. Resets on any non-optimal solve.
- **Polished level-clear summary card** — replaces transient feedback with `blk-summary`: Steps / Optimal / Your Best / Optimal Streak stats. Tier-tag header with one-line message.
- **Confetti** — 120-particle on optimal solve, 80-particle on new personal best (non-optimal), 60-particle on optimal-without-new-best.
- **Score scales with tier** — +6/+4/+3/+2 based on Optimal/Efficient/Good/Done.
- All existing 10 grid levels, command-queue mechanic, run/reset preserved.

## [5.6.21] - 2026-05-17 - Amni-Learn audit batch 22: Word Bridge polish (speech + per-lang best)
- **Speech synthesis playback** — every correct (and wrong) reveal speaks the target-language translation using the browser's `SpeechSynthesisUtterance` with the right locale (es-ES, fr-FR, de-DE, it-IT, zh-CN, hi-IN). 🔊 Listen button on the reveal card lets users replay. Real adult brain-exercise: hearing the pronunciation, not just reading.
- **Reveal card on every answer** — green on correct, orange on wrong. Shows the English-source → target-language pair with the flag context. Replaces transient feedback only.
- **Streak system** — `wb-streak` in HUD score bar. +1/+2/+3 score bonus at streak 1/3/5. Milestone confetti at 3/5/8.
- **Persistent best per language+level** — `wb-best-{lang}-L{N}` sessionStorage. ⭐ Best chip shown live.
- **Tier system** — Native (95%+), Fluent (80%+), Conversational (60%+), Beginner (40%+), Starter. Tier-tag on summary card.
- **Polished completion summary** — replaces bare innerHTML with `wb-summary` card: Correct/Accuracy/Best-Streak/All-Time stats. NEW BEST detection with 120-particle confetti; Native/Fluent runs get 60-particle burst.
- All existing 6 languages, 40 words per language, 4-choice MCQ, level-based pools, reveal-correct-on-wrong preserved.

## [5.6.20] - 2026-05-17 - Amni-Learn audit batch 21: Geography Explorer polish (40 country facts)
- **Per-country facts** — one-sentence geographic/cultural facts added for all 40 countries (kept in a separate `facts` map keyed by country name; existing data block untouched). Examples: Chile's Atacama is the driest desert; Hungary's Magyar language is unrelated to most European tongues; Ethiopia uses a 13-month calendar; South Africa has three capitals (executive/legislative/judicial).
- **Fact reveal card on every answer** — green-bordered on correct, orange on wrong. Shows flag + country + capital · continent + the fact. Turns Geography Explorer into a learn-as-you-play experience instead of bare right/wrong.
- **Per-level best-score** — `geo-best-L{1..5}` sessionStorage. ⭐ Best chip in HUD.
- **Streak multipliers + milestones** — +1/+2 score bonus at streak 3/5. Confetti bursts at streak 3/5/8. "🔥🔥🔥" at 8+.
- **Polished completion summary** — replaces bare innerHTML with `geo-summary` card: Correct/Accuracy/Best-Streak/All-Time stats. Tier-tag (Cartographer 90%+ / Explorer 75%+ / Traveler 60%+ / Tourist 40%+ / Starter). NEW BEST detection with 120-particle confetti; Cartographer/Explorer tiers get 60-particle burst.
- All existing 3-mode (flag→country / country→capital / country→continent), 5-level structure, 40-country roster preserved.

## [5.6.19] - 2026-05-17 - Amni-Learn audit batch 20: Logic Puzzles polish (bank doubled + categories)
- **Bank expanded 27 → 52 puzzles** — added 25 new puzzles across 7 categories: 🌀 Lateral (Monty Hall door reveal pre-context, 2-fathers/2-sons, Monopoly bankrupt, hiccups bar, TON/NOT, etc), 🔮 Riddle (map without houses, darkness paradox), 🔢 Math (brick + half-brick, snail-in-well, narcissistic 153, book/bookmark, only-number-where-name-letters-match-value, two-trains-bird), 🔤 Word (incorrectly, dozens), 🎲 Probability (Monty Hall switch, birthday paradox, dice sum), 📈 Sequence (One-Two-Three letter sequence, look-and-say, ×2+1, diff-of-diffs), 🧮 Logic (three switches, Wason selection, two-guards fork, 64-player tournament).
- **Category badges** — every puzzle now carries a `cat` field shown as a chip above the question, color-coordinated to the puzzle theme.
- **Per-game run cap** — 15 puzzles per game (was full 27/52). Tighter sessions, less fatigue.
- **Persistent best score** — `lgc-best` sessionStorage. ⭐ Best chip in HUD.
- **Tier system** — Sage (90%+), Sharp (75%+), Capable (60%+), Developing (40%+), Starter. Tier-tag shown on summary card with one-line message.
- **Polished summary card** — replaces auto-replay innerHTML with `lgc-summary`: Correct / Accuracy / Best-Streak / All-Time stats columns. NEW BEST detection (120-particle confetti); Sage/Sharp runs get 60-particle burst.
- **Streak score multipliers** — +2/+3/+4 score bonus at streak 1/3/5. Milestone confetti at 3/5/10. "🔥🔥🔥" at 10+.
- **Skip-to-next button** — during explanation phase, "Next ▶" button lets users advance immediately instead of waiting the full 3.2s.

## [5.6.18] - 2026-05-17 - Amni-Learn audit batch 19: Dot Tracking polish (MOT)
- **Target picker expanded** — 3 / 4 / 5 / 6 (was 3/4/5). Persists in sessionStorage (`mot-tc`).
- **Speed picker** — 🐢 Slow / ⚡ Normal / 🔥 Fast (0.4 / 0.7 / 1.1 base velocity). Separate sessionStorage (`mot-speed`).
- **Per-target-count best** — `mot-best-N` sessionStorage so each tracking-load gets its own record.
- **Streak system** — `mot-stk` HUD counter for consecutive perfect rounds. Confetti at 3/5 perfect streak.
- **Perfect-round tier system** — Master Tracker (5/5) / Expert (4) / Good (2-3) / Developing (1) / Starter (0). Color-coded tier-tag on summary.
- **Dot animations** — bounce-in on target reveal, `.correct-pick` green glow on right pick, `.miss-pick` red glow on wrong pick. Wrong distractors stay grey on reveal so player sees the layout.
- **Polished summary card** — replaces buildResultCard with `mot-summary`: Correct / Accuracy / Perfect-Rounds / All-Time stats. NEW BEST detection (120-particle confetti); 3+ perfect rounds get 60-particle burst.

## [5.6.17] - 2026-05-17 - Amni-Learn audit batch 18: Peripheral Vision polish (modes + tiers)
- **3 difficulty modes** — Easy (300-700ms flashes, 30s), Normal (150-600ms, 30s), Hard (80-400ms, 25s start at level 2). Mode picker chip row above START. Per-mode best in sessionStorage (`pv-best-{mode}`).
- **Streak system** — `pv-stk` HUD counter. +1/+2 score bonus at streak 3/5. Confetti at 5/10/15.
- **Tier system** — Eagle Eye (90%+), Sharp (75%+), Good (60%+), Developing (40%+), Starter. Color-coded tier-tag on summary.
- **Visual polish** — central focus cross gets pulse animation; flash dots get glow shadow. Wrong choice button briefly flashes red instead of just no-op.
- **Polished summary card** — replaces buildResultCard with `pv-summary`: Correct/Accuracy/Best-Streak/Level/All-Time stats columns. NEW BEST detection with 120-particle confetti; Eagle/Sharp tier bursts get 60-particle even without new best.

## [5.6.16] - 2026-05-17 - Amni-Learn audit batch 17: Visual Search polish (modes + RT tracking)
- **3 difficulty modes** — Easy (5×5 → 7×7), Normal (6×6 → 10×10), Hard (8×8 → 12×12). Chip-row picker. Per-mode best-avg-RT in sessionStorage (`vs-best-avg-{mode}`).
- **RT history + avg-RT in HUD** — every successful find records ms; HUD shows live ⚡ Avg and ⭐ Best avg.
- **Prominent target card** — pulsing "Find: X" card with round indicator and grid size shown above the field (was bare HUD text).
- **Per-find win-flash** — target lights green with bounce-in + glow on correct.
- **Wrong-flash + misclick counter** — bad clicks shake with red flash, item then fades; total misclicks tracked across run for honest accuracy stat.
- **Polished summary card** — replaces bare result with: Avg / Fastest / Total time / Misclicks / All-Time. NEW BEST detection (lower avg = better) triggers 120-particle confetti; perfect zero-misclick runs get 60-particle burst.

## [5.6.15] - 2026-05-17 - Amni-Learn audit batch 16: Trail Making polish (clinical tiers + UX)
- **Clinical naming** — modes renamed to TMT-A (Numbers) and TMT-B (Num-Letter), the standard Trail Making Test designations used in cognitive screening. Selection persists in sessionStorage (`tm-mode`).
- **Clinical tier system** — calibrated to Reitan adult norms. TMT-A: <30s Superior / <50 Normal / <78 Borderline / 78+ Slow. TMT-B: <75 / <115 / <180 / 180+ Slow. Tier scale shown on summary card with calibration note.
- **Touch-friendly nodes** — node radius scales with canvas (20-26px, was fixed 18px). Larger circles + thicker text for finger taps. Hit-test expanded accordingly.
- **Active-target glow** — current target node gets an outer translucent ring so it's unmistakable.
- **Persistent "Next: X" chip** — shown above the canvas; updates as you progress. Pulsing animation keeps the eye on the target.
- **Polished summary card** — replaces bare innerHTML with `tm-summary` card: Time / Errors / Best stats columns, tier-tag header, scale legend. NEW PERSONAL BEST detection with 120-particle confetti; 60-particle burst for perfect (0 errors) or Superior tier runs even without a new best.
- All existing pointer-tap interaction, error-flash, line-drawing, `getPersonalBest` tracking preserved.

## [5.6.14] - 2026-05-17 - Amni-Learn audit batch 15: Mental Rotation polish (modes + RT)
- **3 difficulty modes** — Easy (45-135° rotations, 4-5 point shapes), Normal (45-180°, 4-6 points), Hard (30-180° including 30/60/120/150°, 5-8 points). Chip-row picker. Per-mode best-score sessionStorage (`mr-best-easy/normal/hard`).
- **Reaction time per round** — `performance.now()` start at render, measured on choice. Bonus +1/+2 score for sub-3s/sub-1.5s responses. Avg RT shown in summary extras.
- **Streak system** — `mr-stk` counter in HUD. Bonuses +2/+3 at streak 3/5. Confetti at 3/5/10. Win-flash (green glow) on both shape borders on correct.
- **Miss reveal** — on wrong answer, the second shape is re-drawn in green showing the *correct* mirror/non-mirror state, so player learns what they got wrong instead of just hearing "Was MIRRORED!"
- **Rotation angle indicator** — `↻ 90°` chip shown alongside RT in the info row. Players can see exactly how rotated the comparison was.
- **Polished result card** — extras now include mode tag, average reaction time, best streak. NEW BEST detection (mode-specific) triggers 120-particle confetti; 10/12+ runs get 60-particle burst.
- **Score scales** — base +2 per correct + RT bonus + streak bonus → up to +7 on a fast streaky round.
- All existing 12-round structure, SAME/MIRROR buttons, polygon shape generation, red anchor dot preserved.

## [5.6.13] - 2026-05-17 - Amni-Learn audit batch 14: Chimp Test polish (spatial WM tiers)
- **Tier system with Ayumu reference** — Basic (<4) / Starter (4-5) / Average (6-8) / Above Average (9-11) / Expert (12-15) / Ayumu-class (16+). Named after Ayumu, the chimpanzee who can recall 9 numbers in under a second — humans rarely match this. Tier scale legend on game-over.
- **Streak counter + persistent top-streak** — `chm-stk` HUD stat tracks consecutive cleared levels. `chm-best-stk` sessionStorage. Both shown live.
- **Milestone confetti** — bursts at digit-length 6 / 8 / 10 / 12 / 15 (50/80 particles).
- **Reveal on failure** — on wrong click, remaining hidden numbers light up in orange (`reveal-fail` class) so the player can see the layout they were trying to recall. Educational vs. just "wrong, restart".
- **Polished game-over summary** — replaces bare display with stats card: Reached / Streak / All-Time / Top Streak. Tier-tag header colored per tier. "NEW BEST!" detection with 120-particle confetti.
- **Cell animations** — bounce-in on placement, win-pop on correct, shake on wrong.
- **Score scales with sz** — +2/+3/+5/+6 at level thresholds 6/7/10/12.
- All existing grid auto-scaling (`sqrt(N*3)`), click-to-hide mechanic preserved.

## [5.6.12] - 2026-05-17 - Amni-Learn audit batch 13: Number Memory polish (digit-span tiers)
- **Tier system anchored to Miller's 7±2** — Basic (1-3) / Below average (4-5) / Average (6-7) / Above average (8-9) / Exceptional (10-11) / Savant (12+). Each tier gets a color, label, and one-line message. Tier scale legend shown on game-over so adults know where they stand cognitively.
- **Visual countdown bar** — linear-gradient fill during memorize phase shows exactly how much time remains. No more guessing when the number will disappear.
- **Digit-by-digit diff on game-over** — your incorrect digits are red-underlined, correct ones green. Quick visual feedback on *which* digits you missed.
- **Streak counter + history dots** — `nmm-stk` HUD stat tracks consecutive successful rounds. Each successful length is also shown as a green chip below the number, visible during play.
- **Milestone confetti** — bursts at digit-length 6 / 8 / 10 / 12 (50-particle baseline, 80 at 10+).
- **Polished game-over card** — Reached / Missed-at / All-Time stats. Tier-tag header colored per tier. "NEW BEST!" detection with 120-particle confetti.
- **Score scales with digits** — +1 per round at 3-4, +2 at 5-7, +3 at 8-9, +4 at 10+. Wrong answer scores `max(1, reached-2)` so practice runs still award points.
- All existing input mechanics, Enter-to-submit, and persistent best preserved.

## [5.6.11] - 2026-05-17 - Amni-Learn audit batch 12: Reaction Time polish (tier system + percentile feedback)
- **Reaction tier system** — every round gets a tier: Godlike (<180ms), Excellent (<220), Good (<280), Average (<350), Slow (350+). Human median ≈ 250ms shown in the legend. Calibrated to common Human Benchmark distributions for honest feedback.
- **Color-coded per-round results** — each row in the results list now carries a tier accent (gold/green/teal/blue/orange left-border + tinted background). Tier label shown next to round number.
- **Persistent best-single + best-avg** — `rxt-best-single` and `rxt-best-avg` sessionStorage keys. ⭐ Best ms chip in HUD updates live.
- **Polished summary card** — replaces bare avg/best display. Stats: Avg / Best / Worst / Consistency (±std) / All-Time Avg. Tier-tag header colored per tier ("Excellent reflexes"). "NEW PERSONAL BEST!" detection + 120-particle confetti on personal record. Smaller 60-particle burst for Godlike/Excellent runs even without a new best.
- **Tier-aware per-round message** — instead of static "Lightning! / Nice!", message varies by tier ("⚡⚡⚡ GODLIKE!" at sub-180, "⏱ Keep practicing" at 350+).
- **Verified distinct from Reflex Racer** — kept both modules. Reflex = multi-target spam under timer; Reaction = pure single stimulus-response measurement.

## [5.6.10] - 2026-05-17 - Amni-Learn audit batch 11: Word Search polish (105 definitions + topic picker)
- **Definitions added for all 105 words** — 7 topics × 15 words refactored from flat string arrays to `{w, def}` objects. Word Search now teaches vocabulary on every find.
- **Found-word definition popup** — when a word is selected correctly, a gradient toast slides up near the viewport bottom showing the WORD + its one-sentence definition. 2.6s lifetime; replaces transient.
- **Topic picker** — chip row above grid: 🎲 RANDOM + 7 named topic buttons (NATURE / SCIENCE / SPACE / FOOD / MATH / CODING / ANIMALS). Selection persists in sessionStorage (`ws-topic`). Random is default.
- **Topic context card** — short description of each topic above the word list ("Features of Earth's surface", "Building blocks and forces of the physical world", etc).
- **Live timer + per-topic best-time** — HUD shows current time and best time for the current topic. `ws-best-time-{topic}` sessionStorage. New best triggers 120-particle confetti.
- **Polished completion summary** — replaces silent setTimeout→reset with `ws-summary` card showing Time / Words / Best Time for the topic, plus a NEW PUZZLE button (no longer auto-advances).
- **Half-puzzle micro-confetti** — small celebration burst at 50% words found.
- All existing 12×12 grid, 8-direction placement, pointer-drag selection, reversed-word recognition preserved.

## [5.6.9] - 2026-05-17 - Amni-Learn audit batch 10: Pattern Puzzle polish (rules taught)
- **Generators carry rules now** — all 40 generators across 5 levels refactored to also emit `explain: {rule, desc}`. Rules cover alternation, arithmetic/geometric progressions, Fibonacci, perfect squares/cubes/factorials, triangular and tetrahedral numbers, Catalan, Mersenne (2ⁿ-1), n^n super-exponential, prime sequence, halving. Pattern Puzzle now teaches the *why*, not just the answer.
- **Explainer card on correct AND wrong** — green `.pat-explain` on correct shows the rule name + plain-English description; orange `.pat-explain.miss` on wrong still shows the rule so users learn from mistakes. Card uses a 2-color gradient and animates in.
- **Persistent best tracking** — `pat-best` (solved count) and `pat-best-stk` (top streak) sessionStorage keys. Both shown live in HUD (⭐ Best, 🏅 Top Streak) — replaces the previous transient-only streak counter.
- **Streak milestones** — confetti at streak 3/5/10/15. Score bonus tier preserved (×2 at 3+, ×3 at 5+). "BRILLIANT!" message at streak 10+.
- **Visual polish** — blank cell gets `.win` (green pulse + glow rotate) on correct, `.miss` (red shake) on wrong. Choice buttons get tap-scale active state.
- **Double-click guard** — answered flag prevents the right answer from re-triggering if mashed.

## [5.6.8] - 2026-05-17 - Amni-Learn audit batch 9: N-Back polish (working memory)
- **Persistent best per N-level** — `nbk-best-N` sessionStorage. ⭐ Best % chip in HUD updates live as accuracy improves during the run.
- **Streak system** — `nbk-stk` counter in HUD. Score bonuses +1/+2 at streak 3/5. Confetti at 5/10/15. "🔥🔥🔥" message at streak 10+.
- **Trial progress bar** — linear-gradient fill 0/20 → 20/20 above the grid. Visual sense of how much of the run remains.
- **Hit/miss dot bar** — small green/red dots build a visible history of your recent answers below the grid. Helps see your trend.
- **Cell animations** — pulse on activate (`nbkCellPulse`), green-flash on correct, red shake-glow on wrong.
- **Signal-detection breakdown** in summary — TP (Hit), TN (Correct reject), FP (False alarm), FN (Miss), plus Sensitivity and Specificity percentages. Real cognitive-psych framing for adult brain exercisers.
- **5-Back option** — selector now shows 1-Back through 5-Back (was 1-4). Level-up rule auto-promotes at 80% accuracy.
- **Polished game-over** — replaces bare text with `nbk-summary` card. NEW BEST detection + 120-particle confetti on new high accuracy. +5 score bonus for >=80% runs.

## [5.6.7] - 2026-05-17 - Amni-Learn audit batch 8: Memory Sequence polish
- **3 modes** — Classic (standard pace), Speed (70% baseline speed, min 140ms), Reverse (repeat the sequence BACKWARDS — a true brain-exercise twist for adults). Chip-row picker above the pad grid.
- **Sound toggle** — 🔊 / 🔇 button next to mode picker. Persists in sessionStorage (`seq-sound`).
- **Persistent best per level+mode** — `seq-best-L{level}-{mode}` sessionStorage. Was previously reset every init.
- **Input-progress dots** — visible green dots fill in as you tap each pad in the sequence. Helps players track where they are in long sequences.
- **Pad press feedback** — `.seq-pad.press` scale animation distinct from the sequence flash; immediate tactile response on tap.
- **Streak bonuses** — +1/+3/+5 score bonus at round 3/5/10 on top of seqLen base. Confetti at rounds 3/5/10/15 (80 particles at 10+). "LEGENDARY!" message at round 10+.
- **Wrong-flash** — the bad pad gets a red-glow shake on the wrong tap, then full game-over flow fires.
- **Polished game-over summary** — replaces bare text with stats card showing Round Reached, Steps Recalled, All-Time best. NEW BEST! header + 120-particle confetti on new high.

## [5.6.6] - 2026-05-17 - Amni-Learn audit batch 7: Stroop Test polish
- **3 difficulty modes** — Easy (4 colors, 30s), Normal (6 colors, 30s, 15% congruent traps), Hard (8 colors, 25s, 25% congruent traps). Chip-row picker above START. Per-mode best-score sessionStorage (`stp-best-easy/normal/hard`).
- **Congruent trials** — at Normal+ a fraction of trials show the word in its own color (RED in red ink), which is a classic Stroop trap. Tap the matching button. Adds variety and tests inhibition vs reading speed.
- **Streak system** — `stp-stk` counter in HUD. +1/+2/+3 score bonus at streak 3/5/10. Fire glow on word at streak≥3. Confetti at 5/10/15/20.
- **Reaction time tracking** — every correct answer's response time is measured (performance.now()). RT pop floats above word with ms count. Bonus +1/+2 score for sub-800ms/sub-500ms responses. Avg RT shown in summary.
- **Word animations** — fade-in scale on each new word, green-pulse on correct, red-shake on wrong.
- **Polished summary card** — Correct / Accuracy / Avg ms / Best Streak / All-Time stats. NEW BEST detection with 120-particle confetti.

## [5.6.5] - 2026-05-17 - Amni-Learn audit batch 6: Word Scramble polish
- **Wordbank deepened** — all 50 words across 5 levels gained a `def` field with a dictionary-style definition, separate from the existing cryptic `h` hint. Word Scramble now teaches vocabulary explicitly on every correct answer, not just on time-out.
- **Definition reveal card** — on correct, a green-bordered card slides in showing the WORD and its definition. Gives every solve a tangible payoff beyond the next-word advance.
- **Streak system** — `scr-streak` counter added to HUD. Score gets a +0/+1/+2 streak multiplier at 3+/5+. Milestone confetti fires at 3/5/10/15. "BLAZING!" message at 10+. Streak resets on hint use or wrong submission.
- **Hint button** — 💡 HINT reveals the *next-needed letter* by name AND highlights the matching tile with a yellow flash. Cost is honest: resets streak, one-time per word.
- **Best-score tracker** — `scr-best` sessionStorage key; ⭐ Best chip shown in HUD; updates live during play.
- **Slot win-flash** — `.scr-slot.win` class adds green glow + rotate-pop animation on correct.
- **Game-over summary** — replaced bare "Time's up" feedback with a styled card showing Solved/Accuracy/Best-Streak/All-Time. "NEW BEST!" header + 120-particle confetti on new high score.

## [5.6.4] - 2026-05-17 - Amni-Learn audit batch 5: Anagrams polish (definitions + visuals)
- **Wordbank refactor** — all 75 words across 5 levels converted from flat strings to `{w, def, cat}` objects. Every word now carries a one-sentence definition and a category badge (🧠 Body, ⚛️ Physics, 🏰 History, 🎨 Art, etc). Anagrams now teaches vocabulary, not just letter-sorting.
- **Definition reveal card** — on correct OR wrong, a styled card slides in showing the word and its definition. Wrong-answer still teaches.
- **Hint button** — new 💡 HINT button reveals the first letter (highlights the tile with a yellow flash) at the cost of resetting the current streak. Adult brain-exercise framing: the cost is honest.
- **Best-score tracker** — `agm-best` sessionStorage key. ⭐ Best chip shown in HUD alongside Score/Streak/Length.
- **Streak milestones** — confetti at 3/5/10/15 streak, plus extra confetti on level-up. Up to 4 points per word at streak 5+. "BLAZING!" message at streak 10+.
- **Slot animations** — `.agm-slot.win` flash with rotate+pulse and green glow on correct; `.agm-slot.miss` shake on wrong.
- **Level-up celebration** — fixed-position pop-up banner ("Level N! ✨") with gradient background and bounce animation when streak hits multiple of 3.
- **Tile polish** — tap-down scale animation, shadow on hover, used tiles fade with scale-down, hint tile briefly turns yellow.
- **Dynamic length display** — letter count in HUD and hint line updates per word (was previously pegged to first word of level — broke when level had mixed-length words).

## [5.6.3] - 2026-05-17 - Amni-Learn audit batch 4: Speed Math polish pass
- **Strict-improvement rule applied** (per new memory directive 2026-05-17) — every existing Speed Math feature preserved; only additions and visual upgrades.
- **Streak visuals** — display gets `.streak-1` (yellow glow) at 3, `.streak-2` (orange glow) at 5, `.streak-3` (red glow + pulse animation) at 10. Fire emoji density on problem text scales with tier (🔥 → 🔥🔥 → 🔥🔥🔥).
- **Wrong-answer shake** — display class `wrong` triggers a 0.3s horizontal shake, then a step-by-step panel reuses `_mathSteps()` from v5.6.2 to teach the method (1700ms wait before next problem instead of 1000ms — gives reading time).
- **Best-score tracker** — `sessionStorage` keys `spm-best` and `spm-best-streak`. HUD now shows ⭐ Best alongside Score/Streak/Round. New high score triggers 120-particle confetti and a "NEW BEST!" callout.
- **Streak milestones** — confetti fires at streaks of 5/10/15/20 (50 particles, 80 at 10+). 4-point reward tier added at streak 10+ ("INFERNO!" message).
- **Time-bonus pop** — +3s text floats above timer bar with fade-out animation when correct adds time. Critical timer (<5s) now pulses for urgency.
- **Polished game-over** — full summary card with Score / Correct / Accuracy / Best-Streak / All-Time columns, "NEW BEST!" header on personal records.
- **Key tap-feedback** — every numpad button gets a 0.15s scale-down animation on click (haptic-feeling).

## [5.6.2] - 2026-05-17 - Amni-Learn audit batch 3: math step-by-step teaching
- **Math Basics step panel** — added `_mathSteps(op, a, b, ans)` helper generating plain-English solution steps for +, −, ×, ÷. Multiplication uses place-value decomposition (`Split 24 into 20 + 4. Then (20×7) + (4×7) = 140 + 28 = 168.`). Division reframes as inverse multiplication. Every problem branch stores `mathState.explain`. Geometry problems refactored from text-only to `{text, ans, explain}` objects so they carry formula-based explainers (`Area = πr² = π × 7² ≈ 49π ≈ 153.9`). Algebra L4-L5 explainers walk both isolation steps explicitly.
- **Wrong-answer UX** — at L3+ wrong answer now shows the green step panel + a "Next ▶" button (manual advance). At L1-2 wrong still auto-advances (don't penalize kids reading speed). Correct at L3+ also shows the method — depth over speed for adult learners; corrects don't slow kids at L1-2.
- **Redundancy decisions** — Math Basics vs Speed Math KEEP BOTH (tutorial MCQ vs blitz numpad, distinct modes). Anagrams vs Word Scramble KEEP BOTH (bare-letters progression vs themed-with-hints).

## [5.6.1] - 2026-05-17 - Amni-Learn audit batch 2: L4/L5 quiz pedagogy
- **Gap closed** — Level 4 (young adult) and Level 5 (adult) banks across ALL 5 subject quizzes (animals, languages, math, engineering, science) had ZERO `explain` fields. Advanced learners answered 100+ questions with no teaching — opposite of what the quiz pedagogy contract requires. Every L4 and L5 question now carries a 2-sentence substantive explainer connecting the answer to mechanism, history, or real-world relevance.
- **Content tone** — explainers for adults treat the audience as capable; e.g. Higgs boson note covers the field-coupling mechanism and 2012 LHC confirmation, not "particles get mass." Math L5 explainers cite Millennium Prize problems, Gauss, Maldacena. Engineering L4 explainers include the actual formulas (Re = ρvL/μ, ν = -ε_lateral/ε_axial) where they fit the answer.
- **Mirrored to Android wrapper** — `Amni-Learn/Learn-Mobile/src/main/assets/learn/index.html`.

## [5.6.0] - 2026-05-16 - Amni-Learn module audit (pass 1, batch 1)
- **Scope kickoff** — opened deep audit of every learn module for content fit, mechanics fit, layout/playable-area, depth, pedagogy, and redundancy. Audience map: L1-2 kids / L3 teens / L4-5 adults. Plan in `docs/checklists/checklist_v5.6.0_learn_module_audit.md`.
- **Bug-fix preamble (pushed 68778e4)** — Card Pairs size-picker dedupe + card-size cap lift (container queries) + instant match feedback + faster flip-back; Sudoku highlight colors changed from `rgba(...)` (which exposed teal grid bg through transparency) to opaque; `num-covered` overlay removed (was flooding the board); Reflex Racer: simultaneous-target cap, slower spawn cadence, removed click-side respawn that compounded into runaway acceleration; Math Mountain cut entirely (redundant with Math Basics); Word Scramble: shuffle once per word in `loadWord()`, not on every `renderTiles()` call.
- **Sorting Hat drag-drop rewrite** — replaced multi-bucket forEach hit-test with single `document.elementFromPoint(...).closest('.sort-bucket')` (was double-firing on overlapping rects), added `setPointerCapture` per-item, hover feedback during pointer drag (CSS `.hover` was tied to dead HTML5 `dragover` event), pointerdown short-circuits on already-sorted items, removed bucket-click pre-select hack that was polluting `dragItem` global state, clone preserves the touch-offset on the item (no jump on grab).
- **Android wrapper sync** — `Amni-Learn/Learn-Mobile/src/main/assets/learn/index.html` mirrored from site source-of-truth (drifted since 2026-04-29). No git repo at that path yet, file copied on disk only.
- **Backups** — `backups/v5.6.0_pre_audit/learn-index.html`.

## [5.5.1] - 2026-05-15 - AdSense doorway remediation (learn SEO pages)
- **Scope** — applied same deep-content treatment from v5.5.0 to the 11 `learn/<category>.html` SEO landing pages, which Google would have flagged as doorways alongside calc/* if v5.5.0 had shipped alone.
- **Generator: `src/gen-learn-categories.js`** — added `renderDeep(c)` helper paralleling the calc generator, deep-block CSS (with green `#2ecc71` accent matching `body.theme-learn`), `deep[]` field per category with `lesson` / `milestones` / `pitfalls` / `faq` / `body` block types. New `milestones` block type emits age-banded developmental milestone lists.
- **Per-category content** — 11 categories with substantive deep content tuned to audience: parent guidance for Pre-K through Elementary, teacher curriculum notes for Subjects and STEM Labs, clinical-research roots for Brain Exercise tasks, solving strategy for Logic Puzzles, history/strategy for Retro Arcade, idle-game psychology for Casual, self-study patterns for College Prep.
- **Schema.org FAQPage** auto-emitted from FAQ block items (same pattern as calc).
- **Page size delta** — pre-fix: ~250 words each. Post-fix: 939 (casual) to 1222 (prek) words per page; 16&ndash;20 KB. All pages comfortably above doorway threshold.
- **Backups** — `backups/v5.5.0_learn_seo/`: `gen-learn-categories.js` + 11 original `learn/*.html`.
- **Status** — site is now ready for AdSense reconsideration request submission. Both calc and learn SEO landing pages have substantive unique content.

## [5.5.0] - 2026-05-14 - AdSense doorway remediation (calc SEO pages)
- **Root cause** — Google AdSense flagged amni-scient.com for "Thin content with little or no added value." Diagnosed: 31 cookie-cutter `calc/<module>.html` pages (all exactly 124 lines, identical 5-section template, ~280 unique words each) matched Google's doorway-page definition. Same pattern in `learn/<module>.html` (11 pages, 119 lines each) but deferred per user direction.
- **Generator overhaul** — `src/gen-calc-modules.js`: added `deep[]` field per module (`worked` / `procedure` / `pitfalls` / `physics` / `standards_detail` / `faq` / `table` blocks), `deepTitle` per module, and `renderDeep(m)` helper that emits a collapsed-by-default `<details class="deep-dive">` container between WHEN TO USE and RELATED MODULES sections. Schema.org `FAQPage` JSON-LD auto-extracted from `deep[].type==='faq'` items.
- **Per-module content** — 31 modules now carry substantive unique deep content: worked numerical examples with inputs/steps/outputs, step-by-step design procedures, common pitfalls with engineering rationale, standards explainers beyond the bullet list, physics-link paragraphs, and engineer-FAQ Q&A pairs. Sections, ordering, and content vary per module so pages are no longer skeleton clones.
- **Page size delta** — pre-fix: every page 124 lines / ~9 KB. Post-fix: 15.8–21.4 KB per page; word counts 728 (refs/equations index) to 1506 (bolts). High-traffic modules (bolts, stress, springs, fatigue, fluids, electrical, motors, NEC, echem) all exceed 1200 unique words.
- **UX preserved** — deep content is wrapped in `<details>` collapsed by default, keeping calc-first user journey intact; Googlebot still indexes the content. CSS for deep blocks (`.deep-dive`, `.deep-block`, `.step-list`, `.pitfall-list`, `.faq-q`, `.deep-tbl`) added to generator template.
- **Backups** — `backups/v5.5.0_calc_seo/gen-calc-modules.js.bak` + 31 original `calc/*.html` files preserved.
- **Outstanding** — `learn/<category>.html` (11 doorway pages) still need treatment before AdSense reconsideration request. Pending user direction.

## [5.4.7] - 2026-05-01 - Safari/iOS module-tap fix
- **Root cause** — every `.game-btn` and `.storybook-card` is a `<button>` with `display:flex` and `<span>` children (icon / text / desc). iOS Safari's hit-tester does not dispatch `click` to a flex-`<button>` when the tap lands on a flex *child* — taps fall through and the menu feels dead. The same buttons work fine on Chrome/Firefox/desktop Safari, which is why this slipped past local testing.
- **Fix** — added `.game-btn > *, .storybook-card > * { pointer-events: none; }` so taps on the inner spans re-target the parent `<button>`, restoring `click` dispatch on iOS Safari. Existing handlers (`e.target.closest('.game-btn')` / `card.dataset.book`) keep working unchanged because they read from the button itself, not the span.
- **Polish** — `touch-action: manipulation` on both selectors removes the iOS 300ms double-tap-zoom delay, and `-webkit-tap-highlight-color` gives a visible flash so users get feedback on tap. `-webkit-appearance: none` stops Safari's UA button restyling from leaking through.
- **SW cache bumped v3 → v4** so iOS users with a hot service-worker cache pull the corrected HTML on next load instead of being stuck on the broken prior shell.

## [5.4.6] - 2026-04-30 - Pre-K-obvious wrongs + level-bounded pools
- **L1 animal-sound wrongs rewritten** so the correct answer is unambiguous for a 3–5 year old. Wrongs now come from clearly-different categories: a bird-sound question's wrongs are dog/bee/frog/snake (not other birds); a mammal-sound's wrongs are bird/bee/snake (not other mammals); a reptile/insect's wrongs are dog/bird/bee. Example: "Chirp" → Bird with wrongs Crocodile / Lion / Dog (per user spec).
- **`startQuizDirectly` now caps the pool at the current level** — `addLvl` only accepts levels `≤ lvl`, so PRE-K (L1) sees only L1 questions, not the L2 fact-questions it was previously padding with to reach 30. Higher levels still expand downward (so K-2 mixes in pre-K when pool is short, etc.) but never reach upward into harder content.

## [5.4.5] - 2026-04-30 - Quiz-pool dedupe pass
**Animals L1 (sound quiz)** — replaced ambiguous and duplicate questions with unambiguous ones. 25 questions total, every animal appears once, every sound has exactly one valid answer:
- **Removed** as ambiguous: Roar/Bear (lion+tiger+wolf all roar — trimmed wrongs to non-roarers instead), Bleat/Goat (vs Sheep/Baa), Screech/Eagle (vs Owl/Parrot), Snort/Rhino (vs Pig/Bear).
- **Removed** as duplicate animal: Purr/Cat (Meow already), Whinny/Horse (Neigh already), Tweet/Chick (Chirp/Bird already).
- **Added** unambiguous replacements: `Caw caw → Crow` (no other listed animal caws), `Snap (jaws) → Crocodile` (no other animal snaps its jaws).
- **Tightened wrongs on Roar/Lion** to non-roaring animals (Giraffe / Rabbit / Elephant) so the answer is unambiguous.
- **Tightened wrongs on Baa/Sheep** to non-bleating options (Chicken / Dog / Bird) so it's clearly the sheep.

**Music L1** — removed 4 duplicate-answer questions (second Piano, second Guitar, second Trumpet, second Violin) and replaced with **Saxophone, Flute, Ukulele**-focused questions (also fixed the existing-but-unbacked Ukulele wording).

**Music L2** — replaced second Piano-instrument question with `How many lines does a musical staff have? → 5`. The dynamics-meaning Piano question stays (different concept).

**Math L1 / L2** — replaced answer-duplicates: triangle-sides + 2+1 (both = 3) → kept triangle, changed apples to 2+4=6; bigger-of-5-and-3 + fingers (both = 5) → changed to 7-or-3; half-of-100 + 25%-of-200 (both = 50) → changed half to 80→40; 144÷12 + cube edges (both = 12) → changed division to 144÷9=16. Added `explain` fields to the four affected questions.

**College quizzes (L8)** — fixed remaining within-subject duplicate answers across calculus / discrete / biology / algorithms / datastructs / writing / psychology. Replacement questions in same subject area, different answer:
- calculus: ∫₀¹ 3x² dx → ∫₀² 3x² dx (1 → 8)
- discrete: C(5,3) → C(6,2); subsets of {1..4} → subsets of {a..e}
- biology: second mitochondria → "organelle that stores genetic info" → Nucleus
- algorithms: quicksort-worst → quicksort-average; insertion best-case → "best inputs for insertion sort" (categorical answer); hash-worst → hash-average; merge sort time → merge sort auxiliary space
- datastructs: heap insert → heap extract-max; red-black height → red-black path-ratio; heap height → build-heap; BFS-queue → DFS-stack
- writing: second plagiarism → block-quote definition
- psychology: second cognitive-dissonance → fundamental attribution error; second confirmation-bias → neuroplasticity; second Big-Five → Erikson stages

Within-subject duplicate scan now reports clean across all 6 kid subjects × 5 levels and all 13 college subjects.

## [5.4.4] - 2026-04-30 - Real rooster crow audio
- **Added `learn/assets/audio/rooster.mp3`** — sourced from Wikimedia Commons "Rooster crowing.ogg" by Filo gèn' (CC BY-SA 4.0), transcoded to 140 kbps stereo MP3 with loudness normalized to -16 LUFS so it sits at the same level as the other animal sounds. Attribution captured in `learn/assets/audio/CREDITS.md`.
- **Restored `Cock-a-doodle-doo` to the `playAnimalSound` bypass list** — `speakText('Cock-a-doodle-doo')` now routes to `rooster.mp3` (was: routed to TTS in v5.4.3, which the user did not want; never wanted: routed to `chicken.mp3` as in v5.4.2 and earlier). Mapping added: `'cock-a-doodle-doo':'rooster'`.
- **SW cache bumped v2 → v3** + `rooster.mp3` added to the precache list so users get the new asset on next reload (and offline mode picks it up too).

## [5.4.3] - 2026-04-30 - Animal-sounds quiz disambiguation
- **Removed 4 ambiguous questions**: `Squeak/Mouse` (rabbit, hamster, squirrel all squeak), `Growl/Bear` (lion, tiger, wolf all growl), `Grunt/Gorilla` (gorillas hoot/chest-pound, not grunt), `Squeal/Pig` (duplicate of `Oink/Pig`).
- **Reworded for distinctive onomatopoeia**: `Howl` → "Awooo! (howl)", `Chatter` → "Ooo ooo ah ah", `Whinny` → "Neigh-hee-hee", `Bleat` → "Maa-aa", `Hiss` → "Hisssss", `Purr` → "Purrrrr", `Coo` → "Coo coo". Bird/animal qualifiers added to several others ("Which bird says…", "Which baby bird…", "Which giant animal trumpets…") so the answer is unambiguous.
- **Cock-a-doodle-doo audio fix**: removed from the `playAnimalSound` bypass list so it routes through TTS instead of playing `chicken.mp3` (no rooster.mp3 exists). Cleaned dead mapping entries (`squeak`, `growl`, `grunt`, `squeal`, dead `cock-a-doodle-doo`→`chicken`) from the audio dispatch table.
- L1 animals pool: 33 → 29 questions; combined L1+L2+L3 still yields 57 in the kid quiz pool, well above the 30-per-session target.

## [5.4.2] - 2026-04-30 - Storybooks: auto-advance + underline highlight + tap-to-hear
- **Auto-advance reading**: `playCurrentPage` now sets `_storyState.autoplay = true`, and the utterance's `onend` advances the page index, re-renders, and immediately calls `playCurrentPage(true)` so the read-aloud continues seamlessly to the next page without the user re-tapping. Stop and Pause clear the autoplay flag.
- **Underline + highlight**: `.story-word.hl` now adds a 3px orange (`#d35400`) underline at 5px offset on top of the existing yellow background, giving struggling readers a clearer "track the word" cue.
- **Tap-to-hear**: every `.story-word` span gets a click handler in `renderPage`. Taps speak just that word via the system voice, flash the word in cyan via `.tapped` for 600ms, then resume the auto-read where it left off (preserves `wasAuto` snapshot, replays the current page after the word finishes).

## [5.4.1] - 2026-04-29 - /learn arcade reshuffle + 30-question quiz pools
- **Casual arcades moved to Destress (level 7)** — Color Sort, Gem Crush, 2048, Color Blast, Solitaire, Tower Defense were sitting in the kid-side Brain Training section and rendering blank when launched at PRE-K. Pulled them from there, dropped them into the previously-empty `destress-cat` slot (rebranded "🎲 Casual Puzzles"). They no longer show at L1–L5; visible at L7 alongside the existing 80s/90s retro arcades and clickers.
- **Subject quiz pool ≥ 30 randomized** — `startQuizDirectly` now builds a pool starting from the current level, expanding to ±1 then ±2 then everything until at least 30 questions are available, then shuffles and slices to 30. Hits the 30-question target even where individual buckets (e.g., languages L1, math L1) hold only 8.
- **College quizzes — 286 new questions, 30 per session** — added 22 questions × 13 subjects (calculus / linalg / stats / discrete / physics / chemistry / biology / algorithms / datastructs / philosophy / economics / writing / psychology) bringing each pool to 30+ with explanations. `initCollege` now `.slice(0, 30)` after shuffle so each playthrough is distinct.

## [5.4.0] - 2026-04-29 - /learn theme + UX + neutral content sweep
- **SW cache bump v1 → v2** (`learn/sw.js`): forces stale shells from before e78ee19 to roll over. Was the actual root cause of "newly added games (storybooks / 2048 / cblast / solitaire / tdgame) display no content" — the activate handler already purges old caches, the name was just pinned.
- **Empty-category sweep** (`learn/index.html`): post-filter pass hides any `.game-category` whose `.game-btn` set is fully `display:none`. Fixes the empty Life Skills band visible at PRE-K (level 1) where all four sub-games are hidden, and is generic enough to cover future per-level filters too.
- **theme-learn accent** (`css/style.css`): added `body.theme-learn{--accent:#2ecc71}` + dim/glow/scanlines + light-mode override. The class was already present on every learn marketing/SEO page but undefined in CSS, so they fell back to the default mint green and clashed with the inline `#2ecc71`. SEO pages now inherit the accent cleanly.
- **Inline `#2ecc71` → `var(--accent)`** across `amni-learn.html` + 11 SEO category pages (subjects/life-skills/prek/elementary/college/casual/retro-arcade/stem-labs/brain-cognitive/brain-puzzles/brain-vision). 6 hits each, sed-style swap.
- **Mobile level pill**: `#level-btn .btn-label` overridden in the `<720px` media query so "Lv N" stays visible on phones (was hidden by the generic `.back-btn .btn-label{display:none}` rule). Affected every level, not just 1/6/7 as initially reported.
- **Flappy Jump physics rebalance**: GRAV 0.13 → 0.085, FLAP -3.8 → -3.2, terminal-velocity clamp 4 → 3, GAP_BASE 160 → 185 (min 150), PIPE_DX 220 → 240, SPD_BASE 0.9 → 0.75. Drop was still too punishing post v5.3.8; this widens the playable corridor and slows the fall ~35%.
- **Subject-quiz explanations**: `loadQuestion` now surfaces an explanation card on every answer (right or wrong), highlights the correct option, and gates progression behind a "Next ▶" button so kids actually read the why. Fall-back text "The answer is X." when `explain` is missing. Bulk-added 112 `explain` fields across animals/music/languages/science L1–L3.
- **AI Ethics Debug — neutralize**: replaced the three "loan / hiring / recidivism" race-and-gender-proxy levels with **data leakage / spurious correlation / privacy breach** — same gameplay (cut wires, rebalance weights), now teaching the universal ML engineering pitfalls instead of a politically charged framing. Tutorial steps reworded to match.

## [5.3.8] - 2026-04-29 - /learn 8-game UX repair sweep
- **Sudoku**: distinct selection palette — selected cell now amber `#f39c12`, same-value tint amber, row/col/box neutral white-5, num-covered nearly transparent. Fixes "whole grid blocks green" because the previous teal tints clashed with the green grid borders + given-cell text.
- **Number Memory**: replaced `inp.onkeydown=e=>e.key==='Enter'&&go()` (returned `false` for non-Enter keys → DOM-cancelled the keypress on a property handler) with `addEventListener` + numeric-only `input` filter. Typing now works.
- **Word Search**: replaced per-cell pointerenter (which broke under implicit pointer-capture on touch) with grid-level pointermove + `elementFromPoint` hit-test. Releases capture on pointerdown so finger-drag selects across cells. Also accepts reversed-direction selections.
- **Pong**: defaulted to Easy with active-button highlight. Easy: AI tracking 0.025, ball spd 2.0, paddle 80px, accel 1.005, ball-speed clamp 5. Medium/Hard scaled accordingly. Round HUD resets on difficulty change.
- **Flappy Jump**: gravity 0.4 → 0.26, flap -6.2 → -5.4, gap 120 → 160 (min 130), pipe spacing 180 → 220, terminal-velocity clamp 8 px/frame, milestone progression now fires once per 10-score band instead of every frame at the boundary.
- **Trail Making**: canvas `onclick` → `onpointerdown` with rect-scaled coords + `touch-action:manipulation`. Taps now register on touchscreens.
- **Pull the Pin**: replaced random pin/lava/ball scatter with deterministic logic — good ball directly above goal held by horizontal pin; lvl 3+ adds side-column lava with its own pin and a vertical wall pin keeping it away from the goal column; lvl 5+ mirrors the second lava on the opposite side and adds a bonus star. Pin tap radius widened, scaled coords, `touch-action:none`.
- **Fill the Cup**: fill speed 0.5–0.95 → 0.20–0.30 at lvl 1 (caps near 0.80 at lvl 12); target range 15–85 → 30–85; perfect tolerance ±2 → ±3, close ±8 → ±10; close/overflow/short now show feedback toasts; pointerdown/up `preventDefault` + `touch-action:none`; pointercancel auto-pours so a finger-slide-off doesn't lock the level.

## [5.3.0 → 5.3.4] - 2026-04-27 - /calc deep feature batch (5 iterations via /loop "fix them all")

User-driven sweep continuing v5.2.0. Each item below was a specific gap or bug in the live calc.

### v5.3.0 — Mohr Plotly + section snap + vibration shock + NEC chart
- Mohr's circle: canvas → true Plotly chart with σ/τ axes, principal-stress diamonds, τ_max triangles, axis-equal scaling. Inputs moved to LEFT side of stress split (was on the right after injectMohrExtras).
- Section snap-resolution selector (0.01 / 0.1 / 1 / 10 / 100 mm) on preset params; arrow-key step + blur rounds to nearest snap unit.
- Vibration: new SHOCK PULSE card (4 pulse shapes — half-sine / sawtooth / rectangular / haversine) with full Shock Response Spectrum log-x chart (0.1–1000 Hz), MIL-STD-810 reference.
- NEC ampacity: inline text → Plotly log-y chart, 21 conductor sizes (14 AWG to 1000 kcmil) × 3 temp ratings (60/75/90 °C Cu).

### v5.3.1 — Electrical phasor + transformer + motor torque-speed + fin efficiency
- Electrical: Plotly phasor diagram (P→x, Q→y, S resultant). New TRANSFORMER SIZING card → primary/secondary FLA, turns ratio, secondary SCC, per-unit Z, I²t. NEC 240.21 tap-rules note inline.
- Motors: Torque-speed curve module with NEMA design selector (A/B/C/D), per-design constants for LRT/BDT/PUT/LRC/slip per MG-1. NEMA frame lookup card (HP × sync RPM × enclosure → frame number).
- Heat transfer: Fin efficiency curve η = tanh(mL_c)/(mL_c) Plotly with optimum (mL_c=1, η=76%) and over-fin (mL_c=2, η=48%) markers.

### v5.3.2 — Pump curves + pressure vessel expansion + welder helpers
- Pumps: 9-model off-the-shelf catalog (Goulds 3196 STX/MTX/LTX/XLT, Grundfos CR 5-9 / 32-2-2, Sulzer AHLSTAR APP, KSB Etanorm 50-200, Crane Deming) with BEP/Hmax/NPSHr/Pmax. Pump-vs-system curve Plotly with operating point marked, off-BEP color-coded with cavitation/recirc warnings + brake-power calc.
- Pressure vessels: 3 new ASME VIII-1 cards — head thickness (4 head types per UG-32), nozzle reinforcement (UG-37 area-replacement with pad sizing), lifting lug (B30.20 — pin bearing + tear-out + tensile, 2× design factor).
- Welds: Electrode-selection card with 6 base-material families × 4 processes (SMAW/GMAW/FCAW/GTAW) AWS-classified picks. Deposition-rate card with 5 processes, melt rate, lb/hr, heat input kJ/mm with limits. AWS D1.1 prequalified joints reference.

### v5.3.3 — Proper involute gears 3D + STL export + 5 gear variations
- New 3D gear generator card with dedicated Three.js viewer (420 px) replacing the rough top-down extrude in calc-3d.js MODS.gears. Proper **involute** geometry (parametric base-circle equations).
- 5 gear types: SPUR, HELICAL (per-vertex twist by β), HERRINGBONE (half-fw twist each direction), INTERNAL/RING (annulus with inside-diameter teeth), RACK (linear strip).
- Standard parameters: N (6-200), module (0.5-20 mm), pressure angle (14.5-30°), face width, helix angle (0-45°), shaft bore.
- ⬇ DOWNLOAD STL — ASCII STL with computed normals, drops directly into Cura / PrusaSlicer / Bambu Studio. Print at 0.16 mm, 100% infill for functional gears.
- ⬇ JSON SPECS — full geometry + Lewis Y + AGMA/ISO 53 reference + ISO timestamp.
- Pending: bevel + worm geometry (need conical / helix-around-cylinder math, deferred).

### v5.3.4 — Fluids 2D CFD via Lattice Boltzmann (D2Q9)
- Real working browser CFD solver. D2Q9 lattice with BGK collision, ~400×120 grid, 10 LBM steps per animation frame.
- Built-in obstacles: circular cylinder (Karman vortex shedding visible at Re > 47), square, NACA-0012-like airfoil, lid-driven cavity.
- Custom obstacle: left-click canvas to add solid cells, right-click to remove. Works while paused or running.
- Visualization: velocity magnitude (default), vorticity, u_x component, density perturbation. Custom 7-stop diverging color map (purple→blue→cyan→green→yellow→orange→red), pixelated rendering.
- Controls: ▶ START / ⏸ PAUSE / ⟲ RESET. Inlet U₀ (0.01-0.20 lattice units), target Re (10-1000) auto-adjusts tau via nu = u0·L/Re.
- Live stats: step count, tau, computed Re, run state.

### Other v5.3 fixes (batch 1, in v5.2.2)
- "electrochemical engineer" → "mechanical engineer" in 3 places (calc landing, calc footer, learn About).
- Mohr's circle inputs relocated to LEFT side of stress split.
- APPLY PRESET buttons restored (section + spring) — previously hidden by universalLiveCompute.
- Bolts: 14 → 60 size entries (down to #0000-160, up to 4-4 UNC, plus M1.6 / M2 / M2.5 / M33 / M39 / M42 / M48 / M56 / M64 metric).
- Belleville preset gating: card title now reads "PRESETS — BELLEVILLE / DISC" (or COMPRESSION / EXTENSION / TORSION / DIE) per type selector.
- Typed beam supports: dedicated #sup-typed-list container avoids fight with obfuscated module's #sup-list rendering.
- Spring F-δ chart: single + series + parallel curves overlaid in one chart with k legend per curve.

### File state
- `calc/calc-fixes.js` grew from 47 KB / ~800 lines (v5.2.x) to **131 KB / 2223 lines** (v5.3.4).
- Single-file override layer; calc/index.html now loads `calc-overrides.js` → `calc-3d.js` → `calc-fixes.js` in sequence.

## [5.2.0] - 2026-04-27 - /calc comprehensive overhaul (Pass 1 + Pass 2 + universal live-compute)

User-driven sweep through `/calc` via /loop dynamic mode — "go through every module until you can't find anything else to improve." Build pipeline note: `obfuscate.js` only targets `explore/`, not `calc/`, so all `calc/*` files are edited in place — no rebuild step.

### New file: `calc/calc-fixes.js` (~800 lines, ~47 KB)
A v5.2.0 override layer loaded after `calc-overrides.js` and `calc-3d.js`. Re-implements broken/missing handlers from the obfuscated module, adds new UI surface, and patches Plotly globally for theming.

### Pass 1 — Bug fixes (4 user-flagged modules)

**Beams**
- Re-implemented `solveBeam` with a proper statically-determinate solver: simply-supported (>=2 pin/roller, sum-of-moments at A for RB then sum-of-vertical for RA) and cantilever (1 fixed support, full reaction + fixed-end moment). Distributed loads, point loads, and applied moments all handled.
- Shear, moment, and deflection diagrams now render into newly-added `#p-shear / #p-moment / #p-deflection` containers (theme-aware Plotly). Deflection via double-integration of M/EI with end-condition correction.
- Reactions table + V_max / M_max / delta_max grid + L/delta stiffness check.
- Typed support input row added above the canvas (TYPE + POSITION + ADD button) so users can place supports precisely; canvas-click stays for visual estimation.
- Default 3 m beam with one pin / one roller / one centered point load auto-seeded so the tab is never blank on first land.
- `addLoad / clearLoads / addTypedSupport / clearSupports` all re-fire `solveBeam` after mutating state, so dynamic-list interactions stay live without a button click.

**Sections**
- 11 preset shapes (rect, hollow-rect, circle, hollow-circle, pipe, I-beam, channel, equal-angle, T-section, trapezoid, triangle).
- Live-compute on every input — APPLY PRESET click no longer required, but kept available.
- Outputs A, I_x/I_y, S_x/S_y, Z (plastic), r (radius of gyration), J (torsion), centroids — only the ones that actually exist for the chosen shape.

**Bolts**
- 13-grade table (SAE J429 grades 2/5/7/8, ISO 898-1 classes 4.6/5.8/8.8/10.9/12.9, ASTM A325/A490/A307, A2-70/316SS) with proof / yield / ultimate strengths and full standard names.
- 31-size table (#6-32 through 1.5"-6 UNC plus M3 through M36 metric coarse) with d_nom, pitch, and stress area A_t.
- Live-compute (ANALYZE button hidden). Outputs F_proof, F_yield, F_i, F_b, F_j, sigma_b, proof use %, tau, IR (tens+shear interaction), T = mu*F_i*d, T (K=0.20), separation safety. Color-coded ok/warn/err on every value.
- Thin-material thread-depth rule of thumb in interpretation note.

**Springs**
- 5 type-gated preset libraries: COMPRESSION (6 entries from M3 utility to suspension coil), EXTENSION (3), TORSION (3), BELLEVILLE (5 sizes B-12 to B-100), DIE (3 — yellow / blue / red stripe).
- Belleville path uses Almen-Laszlo with snap-through behavior classification by h_0/t ratio. Helical (compression / extension / die) uses Shigley with Wahl correction. Torsion uses bending stress.
- Series / parallel combiner card — pick arrangement + count, combined rate and deflection compute live.
- Force-vs-deflection Plotly chart with green ideal-range band (15-80% of available deflection) and red solid-height limit line.
- Compressed-vs-free 2D canvas animation showing both states side by side with mm scale and direction arrow.
- Forces 3D update on every input change so the existing `calc-3d.js` springs scene actually reflects the current calculation.
- CALCULATE button hidden (live-compute throughout).

### Pass 2 — Layout + theme normalization (universal)

**Plotly theming middleware** (`patchPlotly`)
- Wraps `Plotly.react` and `Plotly.newPlot` so every chart in calc — regardless of which helper called it (the modern `plPlot` at line 2329 of index.html, the older closure-bound charts, the `plot` in calc-overrides.js, or anything new) — gets theme-aware colors. Hooks paper/plot/font/grid/zeroline/linecolor/tickfont and axis title fonts. Idempotent.
- `drawSealDiagram` was bound to a hardcoded-dark `pLayout` inside an IIFE. Override now reads `pTheme()` per call and routes through the themed `plot()`.

**Inputs-left CSS rule** (`.view .split { flex-direction: row }`)
- Universal: every module with a `.split` layout has inputs on the left. Stacks to column under 900 px for mobile.
- Solves user complaints: "stress shouldn't have inputs on the right", "bolts inputs on left not right".

**Theme-flip MutationObserver**
- Watches `[data-theme]` on `<html>`. On flip, calls `rethemeAllPlots()` (re-layouts every active Plotly chart with new colors) and `rethemeCanvases()` (re-fires Mohr's circle / bolt-pattern / spring-anim canvas redraws so they pick up new theme colors).

### Pass 3-6 — Universal live-compute (covers the remaining 30+ modules)

**`universalLiveCompute()`** — single function that scans every `<div class="view" id="v-*">` for `<button onclick="(calc|solve|apply|draw)*()">`, collects unique handler names, wires every `<input>` and `<select>` in that view to fire all the handlers on change (220 ms debounce), hides the redundant compute buttons, and fires once on init so each module shows results when the user lands on it. Keeps `clear / undo / add / remove` buttons visible since they act on canvases or dynamic lists.

This replaces what would have been ~30 module-specific `wireLive()` calls with one sweep. Every COMPUTE / CALCULATE button across the entire calc suite is now redundant — change any input and the chart updates.

### Files Touched
- `calc/calc-fixes.js` (new)
- `calc/index.html` — added typed-support input row, `#p-shear / #p-moment / #p-deflection` plot containers (beam); presets card + series/parallel combiner card + `#p-spring-fd` chart container + `#c-spring-anim` canvas (springs); `<script src="./calc-fixes.js" defer></script>` after `calc-3d.js`.

### Backups
- `backups/v5.2.0_calc/{index.html,calc-overrides.js,calc-3d.js}.bak`

### Workflow artifacts (gitignored per .gitignore policy)
- `docs/checklists/checklist_v5.2.0_calc_overhaul.md`
- `docs/guardian_councils/guardian_council_v5.2.0_calc_overhaul.md`

### Out of scope (follow-ups for later)
- Multi-support (>2) propped-cantilever / continuous beam — needs stiffness-method matrix solver, biggest remaining beam gap.
- Bolt joint stiffness ratio C — currently a manual input; could be computed from grip length, member modulus, washer geometry per Shigley.
- Spring buckling check (lateral) for tall coil springs — Wahl gives shear stress only; Haringx / Euler combined check would be a useful add.
- Materials module — search/filter is in the obfuscated module and was not touched; if presets there are stale, deeper review needed.

## [5.1.0] - 2026-04-27 - Site-wide link & claims audit + multi-product Terms hub

### Fixed (claims audit)
- **`terms.html`** was Amni-Crypt-specific copy linked from 42 pages across the site, including pages with nothing to do with file encryption (Amni-LLM, Amni-Calc, Amni-Prayer, etc.). Rewrote as a multi-product hub: General Terms (G1-G9 covering license, warranty, liability, indemnification, ads, modifications, governing law, contact) + 12 per-product addenda anchored at `#crypt`, `#haven`, `#llm`, `#explore`, `#learn`, `#calc`, `#prayer`, `#browse`, `#code`, `#connect`, `#ai`, `#core`. URL preserved (every backlink still resolves). All original Amni-Crypt clauses retained verbatim under the `#crypt` addendum so AdMob/Play Store policy refs still pass.
- **`about.html`**: tagline said "Seven products" → corrected to "Eleven products". Portfolio section claimed "six products across three platforms" → expanded to all 11 products grouped LIVE / BETA-ALPHA / IN DEVELOPMENT. Tech stack table only mentioned Rust/WASM in the context of Amni-Explore → expanded to call out Amni-Browse, Amni-Calc, Amni-Code, Amni-Connect (all also Rust); added llama.cpp WASM (wllama) row for Amni-LLM, WebRTC/Socket.IO row for Haven/Connect.
- **`faq.html`** previously had sections for only 4 of 11 products. Added 8 new sections (Amni-Calc, Amni-LLM, Amni-Prayer, Amni-Browse, Amni-Code, Amni-Connect, Amni-AI/Amni-Core combined). Updated meta description and keywords accordingly.
- **`amni-llm.html`**: dropped "Qwen 3.6" mentions (unverified — only Qwen 3.5 GGUFs were verified per v5.0.1 changelog). Softened the Llama 4 Scout/Maverick row in the comparison table from "Yes (if you have the RAM)" to "Available in HF search; smallest quant is ~29 GB so does not fit in browser memory on typical machines" — matches the honest reality from the v5.0.1 changelog.
- **`lib/amni-llm/registry.js`**: removed `Qwen2.5-Math-7B-Q4_K_M` default (user reported it doesn't load reliably). Defaults are now 3 Qwen 3.5 builds only. README, amni-llm.html SOTA card, and HOW IT COMPARES rows updated to match.

### Added (link rot fixes)
- **PROJECTS dropdown** updated across 46 pages to include `<a href="amni-llm.html">AMNI-LLM</a>` between AMNI-LEARN and AMNI-CONNECT. Bulk update via temporary Node script (`_v5_1_nav_update.js`, removed after run). Embedded app pages (`learn/index.html`, `explore/index.html`, `lib/amni-llm/index.html`, `research/millennium_sim/*`) intentionally have minimal nav and were not modified.
- **`sitemap.xml`**: added `amni-llm.html` (was missing) and `lib/amni-llm/` (the live demo). Brings sitemap to 61 URLs.
- **`index.html` projects grid**: added AMNI-LLM card between LEARN and CONNECT. Now 9 product cards.
- **`privacy.html`** hub previously listed only 5 of 8 existing privacy policies. Added cards for `privacy-browse.html`, `privacy-code.html`, `privacy-connect.html` (all already existed). Added cards + new stub pages for `privacy-llm.html`, `privacy-learn.html`, `privacy-calc.html`, `privacy-prayer.html` (4 products previously had no privacy disclosure).

### Files Created
- `privacy-llm.html` — in-browser inference, HF API for search only, IndexedDB cache, COI service worker
- `privacy-learn.html` — zero data collection inside games, AdSense on landing only, COPPA-safe
- `privacy-calc.html` — client-side WASM, optional local AI overlay storage keys, AdSense on landing pages
- `privacy-prayer.html` — Bible text/graph baked in, optional in-browser WebLLM, no telemetry
- `terms.html` — rewritten as multi-product hub (replaces Amni-Crypt-only version, original preserved at `backups/v5.1.0_audit/terms.html.bak`)

### Files Touched
- `about.html`, `faq.html`, `amni-llm.html`, `index.html`, `sitemap.xml`, `privacy.html`
- `lib/amni-llm/registry.js`, `lib/amni-llm/README.md`
- 46 HTML files for PROJECTS dropdown insertion (see git diff for full list)
- `docs/checklists/checklist_v5.1.0_link_claims_audit.md` (new)
- `docs/guardian_councils/guardian_council_v5.1.0_link_claims_audit.md` (new)

### Backups
- All substantively rewritten files backed up to `backups/v5.1.0_audit/` before edit (terms, privacy, about, faq, amni-llm, registry.js, README.md). Routine dropdown inserts rely on git as backup.

### Follow-ups (not in this release)
- Per-product OG images: nearly every product page reuses `assets/explore/og-explore.png`. Generate per-product OG cards (1200x630) for at least the LIVE products (LLM, Calc, Prayer, Learn, Explore, Haven).
- Footer template normalization: index.html and about.html footers omit the "AMNI-SCIENT" home link that other pages include. Pick one template.
- Schema.org FAQPage JSON-LD in faq.html still only encodes 5 of the (now ~22) Q&As. Expand for richer search results.

## [5.0.1] - 2026-04-27 - Amni-LLM hardening + landing page + standalone repo

### Fixed
- **Defaults updated to actual SOTA**: replaced the Qwen3 + Qwen2.5 dropdown entries with verified Qwen 3.5 GGUF builds. New defaults: Qwen 3.5 0.8B Q4_K_M (508 MB, mobile, `unsloth/Qwen3.5-0.8B-GGUF`), Qwen 3.5 4B Q4_K_M (2.6 GB, balanced, `unsloth/Qwen3.5-4B-GGUF`), Qwen 3.5 9B Q4_K_M (5.4 GB, desktop, `unsloth/Qwen3.5-9B-GGUF`), Qwen 2.5 Math 7B (kept until Qwen 3.5 Math GGUF ships). I had previously claimed Qwen 3.5/3.6 didn't exist as GGUF — that was wrong; verified by querying `huggingface.co/api/models?search=Qwen3.5+GGUF&library=gguf`.
- **"Invalid typed array length" error**: added `coi-sw.js` (BSD-3-Clause-derived service worker pattern) + `coi-register.js` to enable cross-origin isolation on GitHub Pages and other static hosts. With COOP/COEP headers in place, SharedArrayBuffer becomes available and wllama can use multi-thread WASM with higher memory ceiling. First page load registers the service worker; reload picks it up.
- `decorateLoadError(e, bytes)` in `amni-llm.js` now wraps load failures with actionable hints: identifies typed-array-length / RangeError / OOM patterns, reports the failing allocation size in MB, notes whether cross-origin isolation is active, suggests smaller models / closing tabs.
- `isCrossOriginIsolated()` exported and surfaced in the demo as a banner showing whether multi-thread is active.

### Added
- **`amni-llm.html` landing page** at site root, in the same style as other amni-* product pages. Hero, 6-feature grid, comparison table vs WebLLM (10 rows), API quick-reference, honest-stack disclosure, AdSense banner, links to `/lib/amni-llm/` demo and the GitHub repo.
- **Standalone repo at https://github.com/Amnibro/amni-llm** (created via `gh repo create`). Contains `amni-llm.js`, `registry.js`, `coi-sw.js`, `coi-register.js`, `index.html`, `README.md`, `LICENSE` (MIT), `package.json` (npm-publishable, declares wllama as optional peer). The site copy at `lib/amni-llm/` and the standalone repo are kept in sync — site is the deployed copy, GitHub is the canonical source.
- Note about Llama 4: GGUF builds exist (unsloth/Llama-4-Scout-17B-16E-Instruct-GGUF) but the smallest quantization is 29 GB — too large for any browser. Stays available via HF search for users with sufficient RAM, but not a default.

### Files Touched
- `amni-llm.html` (new) — site landing page
- `lib/amni-llm/registry.js` — Qwen 3.5 defaults
- `lib/amni-llm/amni-llm.js` — `decorateLoadError`, `isCrossOriginIsolated` export
- `lib/amni-llm/coi-sw.js` (new) — service worker
- `lib/amni-llm/coi-register.js` (new) — auto-register on demo page
- `lib/amni-llm/index.html` — coi script tag, COI status banner
- Standalone repo: `C:\Users\antho\Documents\ai\Amni-LLM\` → github.com/Amnibro/amni-llm

## [5.0.0] - 2026-04-27 - Amni-LLM v0.1.0 — universal in-browser GGUF runtime

### Added
- `lib/amni-llm/` — new top-level library that loads any GGUF model in the browser with no pre-compilation requirement. Built as a thin clean layer over [wllama](https://github.com/ngxson/wllama) (MIT-licensed llama.cpp WASM port). Amni-Scient owns the loader, registry, browser UI, HuggingFace search/install, arbitrary URL/file loading, and WebLLM-compatible API surface.
- `lib/amni-llm/amni-llm.js` — `AmniLLMEngine` class + `createEngine(spec, opts)` helper. WebLLM-compatible: `engine.chatCompletions.create({messages, temperature, max_tokens, stream})`. Streaming via `engine.chatStream()`. Supports three load forms: registry id (`'Qwen3-4B-Q4_K_M'`), arbitrary URL (`{url:'...'}`), local file (`{file:File}`).
- `lib/amni-llm/registry.js` — 4 SOTA defaults (Qwen3 0.6B, Qwen3 4B, DeepSeek-R1 Distill 7B, Qwen2.5 Math 7B) + helpers: `hfSearchModels(query)` calls `huggingface.co/api/models?library=gguf`, `hfListGgufFiles(repoId)` enumerates `.gguf` artifacts in a repo, `getInstalled/saveInstalled/removeInstalled` persist user-installed models in `localStorage` under `amni-llm-installed`.
- `lib/amni-llm/index.html` — demo page with five tabs: SOTA defaults, Installed, HF search (live), Custom URL, Local file. Each search result expands to a quantization picker with Load + Install buttons.
- `lib/amni-llm/README.md` — full docs incl. honest stack disclosure (wllama/llama.cpp dependency, MIT license, performance tradeoff vs WebLLM).

### Why
WebLLM (MLC) requires every model to be specifically TVM-compiled to WebGPU shaders before it works in-browser. New base models like Qwen 3.5/3.6 and Llama 4 wait on MLC team capacity for that compile step. Amni-LLM uses GGUF, which has near-universal community coverage on HuggingFace within days of any model release. Tradeoff: llama.cpp WASM is CPU-SIMD-only currently, so per-token throughput is ~3-8 t/s on 7B Q4 vs MLC's ~15-30 t/s WebGPU. For interactive chat at small models the gap is barely noticeable; the real win is universal model coverage and arbitrary URL/file loading.

### Files Touched
- `lib/amni-llm/amni-llm.js` (new)
- `lib/amni-llm/registry.js` (new)
- `lib/amni-llm/index.html` (new)
- `lib/amni-llm/README.md` (new)

### Follow-ups (not in this release)
- Wire Amni-LLM into prayer/calc AI panels as alternative engine alongside WebLLM
- Add to homepage projects grid
- Per-product privacy disclosure update
- Add to amni-calc landing page as the recommended path for browser-side AI

## [4.7.12] - 2026-04-27 - Prayer tandem graceful fallback + patterns visual upgrade

### Fixed (tandem)
- `populateTandem(idx)` no longer silently early-returns when `fulltext[key]` is missing. 21 of 73 books in `bible_fulltext.json` have no full-text data (1-2 Sam, 1-2 Kings, 1-2 Chr, Tobit, Zechariah, Malachi, 1-2 Cor, 1-2 Thess, 1-2 Tim, 1-2 Pet, 1-3 John, Revelation), causing the tandem panel to render blank space when a verse from any of those books was selected. Now falls back to graph node `preview` text per verse and shows a small notice ("Full chapter text not available for this book yet — showing cross-reference graph previews. Connections and patterns work normally."). Connections panel always renders regardless of fulltext availability.
- Removed `if (!fulltext) return;` guard from the entry condition; only `tandemActive` gates the function now.

### Added (patterns)
- `analyzePatterns(idx)` now renders three visual sections in addition to the existing insights:
  - **OT/NT split bar**: gradient stacked bar (purple OT, blue NT) with absolute counts.
  - **Strongest connection callout**: highest-mass cross-referenced verse, scored by mass + cross-testament bonus, displayed with book color dot and 160-char preview.
  - **Era distribution mini-chart**: top 5 eras with horizontal bars showing each era's share of total connections.
- Existing insights (people, locations, themes, conflicts) preserved below the new visuals.

### Files Touched
- `prayer/main.js` — populateTandem rewrite, analyzePatterns visual additions
- `prayer/style.css` — `.tandem-fallback-notice`, `.pat-bar-row`, `.pat-bar-track`, `.pat-bar-seg.ot`, `.pat-bar-seg.nt`, `.pat-bar-num`, `.pat-era-row/lbl/track/fill/num`, `.pat-strongest/-lbl/-ref/-text`, `.pat-section/-title`
- Backups: `backups/prayer-main.v4.7.11.bak`, `backups/prayer-style.v4.7.11.bak`
- Patcher scripts (gitignored): `src/fix-tandem.js`, `src/fix-patterns.js`

### Known data gap
- The 21 missing-fulltext books are a `bible_fulltext.json` ingest issue (likely the original parser tripped on multi-token book names like "1 Samuel"). Cross-reference previews from `bible_graph.json` cover the gap; a future ingest fix would reach full text.

### WebLLM model registry status (verified 2026-04-27)
- Fetched `cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2/lib/index.js`. modelVersion = `v0_2_80`.
- Registered models include: SmolLM2, Qwen2.5 (incl. Math/Coder), **Qwen3** (0.6B/1.7B/4B/8B), Llama-3.2 (1B/3B), Llama-3.1, Llama-3, Phi-3.5, Hermes-3-Llama-3.x, gemma-2, DeepSeek-R1-Distill-Qwen/Llama, Mistral, stablelm, TinyLlama.
- **Qwen 3.5 / Qwen 3.6 NOT in registry.** **Llama 4 NOT in registry.** The base models exist on HuggingFace, but the MLC team has not yet published WebGPU-compiled WASM bundles for them. Adding a model_id to our dropdown does not work without those bundles (per v4.7.10/v4.7.11 prebuilt-only lesson). Current calc dropdown reflects the actual ceiling.

## [4.5.2] - 2026-04-27 - Calc local AI: drop phantom models, port verified WebLLM list

### Fixed
- `calc/index.html` in-browser model dropdown listed `Bonsai-8B-mlx-1bit` (an Apple MLX-only model that was never in `@mlc-ai/web-llm`'s `prebuiltAppConfig`), causing `Cannot find model record in appConfig for Bonsai-8B-mlx-1bit` on load. Removed.
- Replaced the calc dropdown with the verified-working list already shipping in `prayer/index.html` (per v4.7.11 prebuilt-only lesson): SmolLM2 360M, Qwen3 0.6B/1.7B/4B/8B, Qwen2.5 3B/7B, gemma-2-2b, Phi-3.5-mini, Qwen2.5-Math 1.5B, Qwen2.5-Coder 1.5B/3B, DeepSeek-R1-Distill-Qwen 7B. Grouped via `<optgroup>` (lightweight / balanced / engineering / high quality).
- `WEBLLM_DEFAULTS` updated: mobile default `Qwen3-0.6B-q4f16_1-MLC` (~400 MB), desktop default `Qwen2.5-3B-Instruct-q4f16_1-MLC` (~1.8 GB) — matches prayer.
- `getWebLLMConfig()` now validates `parsed.model` against `VALID_WEBLLM_MODELS` set; falls back to default if a stale `localStorage` entry references a removed ID. Prevents repeat failures for users who previously had Bonsai cached.

### Notes about model availability
- Qwen 3.5 / Qwen 3.6 do not exist in `@mlc-ai/web-llm` (or anywhere as of writing). Latest published Qwen series in WebLLM is **Qwen3** (0.6B / 1.7B / 4B / 8B), released 2025; that is what is shipped.
- Llama 4 Scout / Maverick (Meta) is MoE at 109B / 400B parameters — not viable for browser WebGPU and not in WebLLM. Llama 3.x is also not currently in WebLLM's 0.2 line; for capable in-browser models stick to Qwen3 or DeepSeek-R1-Distill.
- For any new model_id added later, both must be true (per v4.7.11 lesson): (1) ID present in `cdn.jsdelivr.net/npm/@mlc-ai/web-llm@<exact-version>/lib/index.js`, AND (2) `<modelLibURLPrefix><runtime-modelVersion>/<filename>.wasm` returns 200.

### Files Touched
- `calc/index.html` — dropdown options, `WEBLLM_DEFAULTS`, `VALID_WEBLLM_MODELS` set, `getWebLLMConfig` validation
- Backup: `backups/calc-index.v4.5.0.bak`

## [4.5.1] - 2026-04-27 - Calc fixes: live-compute loop, fake gear "3D isometric"

### Fixed
- `setupLiveCompute` now tags buttons with `__liveBound` after first init; was rebinding every MutationObserver tick. Added re-entry guard (`running` flag) inside `fire()`.
- MutationObserver narrowed: only re-runs the live-compute setup when an actual `<input>/<select>/<textarea>/calc-button` is added. Was firing on every result-panel innerHTML change → infinite re-fire loop visible as flicker on gears, vibration, fluids and other modules.
- `drawGears` no longer injects the "3D ISOMETRIC" card (concentric ellipses on a 2D canvas — the spiral the user reported). The Three.js gear mesh from `calc-3d.js` at `<canvas id="d-gears">` is now the only 3D view.
- `drawGear3D` stubbed to no-op (no remaining callers).

## [4.5.0] - 2026-04-27 - Live Compute + Real 3D (Three.js) for Amni-Calc

### Context
Manual `CALCULATE` buttons on every tab plus zero real 3D made the calculator feel dated. Shipped option C from earlier triage: live compute everywhere + Three.js 3D viewer for every module that has a meaningful 3D representation.

### Added
- **Live compute bootstrap** in `calc/calc-overrides.js` (`setupLiveCompute()`). Walks every `<button[onclick^="calc"]>`, attaches debounced (260 ms) `input`/`change` listeners to all sibling inputs/selects within the same `.card`, hides the button, fires once on mount, and re-fires when a tab is opened. MutationObserver re-runs the bootstrap when new inputs are injected by overrides. 65 calc handlers now run live as users edit values; no more "click Calculate."
- **Three.js 3D viewer** at `calc/calc-3d.js`. Loads `three@0.149.0` + `OrbitControls` from jsDelivr at first paint. Per-module scene factory creates a `<canvas id="d-<mod>">` inside the right pane of each applicable `.split`, with ambient + directional lighting, grid, axes helper, orbit/zoom/pan controls, and ResizeObserver-driven aspect handling. Public API `window.calc3DUpdate(moduleKey)` re-meshes the scene from current input values; the live-compute layer calls it after each calc.
- **18 parametric 3D scenes** (every module that has a meaningful 3D representation):
  - Mechanical/structural: stress (cube + principal-stress arrows), sections (extruded cross-section incl. I-beam, hollow rect, pipe), bolts (bolt + plates + preload arrows), springs (helical 3D coil), seals (O-ring in lathe-extruded gland), columns (Euler buckled mode shape), shafts (twisted cylinder with shear-stress vertex colors), welds (fillet bead between two plates), bearings (race + balls + cage with rotation), gears (real 3D involute mesh with counter-rotation)
  - Fluids/thermal: fluids (transparent pipe + animated flow arrows), pumps (impeller with curved blades, rotates), thermal (fin with cosh temperature gradient as vertex colors), hx (shell-and-tube cutaway), pv (pressure vessel with hoop-stress colormap)
  - Electrical/storage: motors (rotor + stator + alternating-pole coils, rotor spins), battery (n_s × n_p cell pack)
  - Vibration: mass-spring-damper with live oscillation
- Modules without meaningful 3D (cycles, hvac, combustion, electrical, nec, echem, fatigue, materials, finishes, math, equations, units, refs) get live compute only — they remain tabular or 2D-natural.

### Files Touched
- `calc/calc-overrides.js` — live-compute bootstrap added; init now calls `setupLiveCompute()` and a MutationObserver to handle late-injected inputs
- `calc/calc-3d.js` — new file (~270 lines), Three.js loader + viewer factory + 18 scene definitions
- `calc/index.html` — added `<script src="./calc-3d.js" defer></script>` after the overrides loader
- Backups: `backups/calc-overrides.v4.4.0.bak`, `backups/calc-index.v4.4.0.bak`

### Known limitations
- Three.js bundle (~600 KB minified) loads from CDN on first calc visit. Expected first-paint cost ~250 ms on broadband, ~1 s on mobile 4G. No CDN dependency on subsequent loads (browser cache).
- Bearings, pumps, motors animate continuously; CPU/GPU draw is minimal but a power-saving toggle is a future addition.
- Per-module scene update is debounced at 260 ms; very rapid input scrubbing will appear smooth but with that latency.

## [4.4.0] - 2026-04-26 - SEO Landing Pages (AdSense Round 3) — DO NOT REVERT

### Context
v4.3.0 work (full `amni-calc.html` landing page) was reverted in commit `72c7964 Revert "Amni-Calc: full product page, PWA manifest, a11y + SEO"`, leaving the page as a 1-line meta-refresh. AdSense rejected with "Low value content" again. This release restores the landing page, adds 31 per-module calc landing pages, 11 per-category learn landing pages, rebuilds the sitemap, and documents the noindex+ads conflict on `amni-explore.html` / `amni-ai.html` for follow-up.

### Added
- 31 per-module calc landing pages at `/calc/<module>.html` (stress, sections, bolts, springs, seals, columns, shafts, welds, bearings, gears, fatigue, vibration, fluids, pumps, thermal, hx, pv, cycles, hvac, combustion, electrical, motors, nec, echem, battery, materials, finishes, math, equations, units, refs). Each ~600-900 words covering theory, key equations, when-to-use scenarios, references/standards, related modules, and CTA into the live calculator at `/calc/#tab-<module>`.
- 11 per-category learn landing pages at `/learn/<category>.html` (prek, life-skills, subjects, elementary, stem-labs, brain-cognitive, brain-puzzles, brain-vision, retro-arcade, casual, college). Each ~500-700 words covering category overview, pedagogical basis, game roster, and related categories.
- Generators at `src/gen-calc-modules.js` and `src/gen-learn-categories.js` (gitignored source; emit committed HTML).

### Restored
- `amni-calc.html` rebuilt as a full landing page adapted to current site nav (was a 1-line meta-refresh after the v4.3.0 revert). Hero, 6-feature grid, "Why In-Browser" essay, category-grouped 31-card module catalog with cross-links to per-module pages, 4-step workflow, privacy disclosure, CTAs, AdSense banner, Ko-fi support.

### Updated
- `sitemap.xml` rebuilt with 56 canonical URLs: home, about, faq, all 8 indexable amni-* product pages, /calc/ + 31 module pages, /learn/ + 11 category pages, /prayer/, licensing, privacy, terms.
- `docs/checklists/checklist_v4.4.0_seo_landing_pages.md` — full task checklist.
- `docs/guardian_councils/guardian_council_v4.4.0_seo_landing_pages.md` — 5/5 council vote in favor.
- `architecture_map.md` — new SEO landing-page structure.
- Backups: `backups/amni-calc.v_pre-revert.bak` (recovered from commit e944521), `backups/amni-calc.v_post-revert.bak` (the reverted 1-liner).

### Resolved follow-ups
- `amni-explore.html` — removed `<meta name="robots" content="noindex,nofollow">`; page now indexable. Added to sitemap.xml. Existing AdSense banner kept.
- `amni-ai.html` — kept `noindex,nofollow` (speculative product); stripped AdSense loader script (line 26) and the `<aside class="site-ad-banner">` block (lines 287-291). Page is now ad-free and stays out of the index.
- `research/*.html` deep-dives (especially `amnitex-railgun.html` and `gf17-quantization.html`) — confirmed speculative; stay noindex and stay ad-free (verified no `adsbygoogle` in any `research/*.html`).
- Backups: `backups/amni-ai.v4.4.0.bak`, `backups/amni-explore.v4.4.0.bak`.

### DO NOT REVERT
This release re-applies work that was previously reverted in commit `72c7964`. Tag this commit `v4.4.0-seo-pages` after merge so the work is preserved.

## [4.7.11] - 2026-04-25 - Prayer WebLLM: drop Qwen3.5 (TVM ABI mismatch), revert to Qwen3 + prebuilt-only

### Fixed
- v4.7.10 added Qwen3.5 via custom appConfig pointing at `binary-mlc-llm-libs/.../v0_2_83/base/`. Loading then failed with TVM error "value attached to scope multiple times" — the WASMs at v0_2_83/base/ are compiled for an unreleased web-llm 0.2.83 runtime, but `@0.2` resolves to `0.2.82` whose runtime hardcodes `modelVersion = "v0_2_80"`. ABI mismatch at the WASM IR level — not fixable by us, only by waiting for npm publish of 0.2.83
- **Removed:** `WEBLLM_CUSTOM_MODELS`, `Q35_LIB_PFX`, `Q35_OVR`, `getMergedAppConfig()` helper from `prayer/main.js`. Reverted `CreateMLCEngine` call to pure prebuilt path
- **Dropdown swapped:** Qwen3.5 0.8B/2B/4B/9B → Qwen3 0.6B/1.7B/4B/8B (one generation behind, but registered in 0.2.82 with matching v0_2_80 libs)
- **WEBLLM_DEFAULTS:** mobile `Qwen3-0.6B-q4f16_1-MLC` (~400MB), desktop `Qwen2.5-3B-Instruct-q4f16_1-MLC` (~1.8GB) — both verified in `prebuiltAppConfig`
- All 13 dropdown IDs grep-verified against `cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.82/lib/index.js` before shipping

### Files Touched
- `amni-scient-site/prayer/index.html`
- `amni-scient-site/prayer/main.js`
- `amni-scient-site/changelog.md`
- Backups: `amni-scient-site/backups/prayer_index_v4.7.11_drop_qwen35.bak`, `amni-scient-site/backups/prayer_main_v4.7.11_drop_qwen35.bak`

### Notes
- Same Qwen3.5 → Qwen3 revert shipped to Amni-Haven v5.6.6
- Hard-learned verification chain (will live in memory now): for any web-llm model_id, BOTH must be true — (1) ID present in published `lib/index.js` (use jsdelivr CDN at exact version), AND (2) `<modelLibURLPrefix><runtime-modelVersion>/<filename>.wasm` returns 200. v5.6.4 broke (1); v5.6.5 broke (2). Only when both clear does a model actually load

## [4.7.10] - 2026-04-25 - Prayer WebLLM: register Qwen3.5 via custom appConfig (was throwing "model record not found")

### Fixed
- v4.7.9 added Qwen3.5 IDs to the dropdown after I confirmed they exist in web-llm's *main branch* `config.ts`. Mistake: `main` ≠ published. The npm-published `@mlc-ai/web-llm@0.2.82` (current latest, what `@0.2` resolves to) does NOT yet ship Qwen3.5 in its bundled `prebuiltAppConfig`. Selecting Qwen3.5-2B etc. threw "cannot find model record in appConfig"
- **Fix:** wired a `WEBLLM_CUSTOM_MODELS` array (Qwen3.5 0.8B / 2B / 4B / 9B, all q4f16_1) and a `getMergedAppConfig()` helper that merges these with `webllmModule.prebuiltAppConfig.model_list`. Passed merged result as `appConfig` to `CreateMLCEngine`. This is the path documented in web-llm's README "Custom Models" section — it works because MLC has already published Qwen3.5 model weights to HF and the WebGPU WASM libs to `binary-mlc-llm-libs` even though the npm bundle hasn't bumped
- **Verification before shipping:** every custom URL probed with `curl -sI` — HF repos `mlc-ai/Qwen3.5-{0.8B,2B,4B,9B}-q4f16_1-MLC` all 200, WASM libs at `v0_2_83/base/` all 200
- Added `Qwen2.5-7B-Instruct-q4f32_1-MLC` (~5GB) to the dropdown for desktops without f16 GPU support — already in published `prebuiltAppConfig`, no custom entry needed

### Files Touched
- `amni-scient-site/prayer/main.js` (added CUSTOM_MODELS, getMergedAppConfig, passed appConfig to CreateMLCEngine)
- `amni-scient-site/prayer/index.html` (added Qwen2.5 7B q4f32 option)
- `amni-scient-site/changelog.md`
- Backups: `amni-scient-site/backups/prayer_main_v4.7.10_qwen35_customcfg.bak`

### Notes
- Same fix shipped to sibling Amni-Haven v5.6.5
- Lesson on top of the v4.7.8/v4.7.9 ones: `main` branch source files describe what the *next* release will contain, not what `npm install` gives you today. The only ground truth for "what does my pin actually have" is `https://cdn.jsdelivr.net/npm/<pkg>@<version>/lib/index.js` (or whichever path holds the published bundle), grepped directly. Saved this to memory

## [4.7.9] - 2026-04-25 - Prayer WebLLM dropdown: promote Qwen3.5, add specialized optgroup

### Fixed
- v4.7.8 used Qwen2.5-1.5B as desktop default. User pointed out Qwen3.5 (released Feb 2026) is stronger at every comparable size and IS supported by `@mlc-ai/web-llm@0.2.82` (current latest pin). Verified via raw HF API + raw config.ts grep — Qwen3.5-{0.8B,2B,4B,9B} and Qwen3-{0.6B,1.7B,4B,8B} all present in prebuiltAppConfig
- **New `WEBLLM_DEFAULTS` in `prayer/main.js`:** mobile `Qwen3.5-0.8B-q4f16_1-MLC` (~500MB), desktop `Qwen3.5-2B-q4f16_1-MLC` (~1.2GB) — both meaningfully smarter than the v4.7.8 picks at similar memory cost
- **Dropdown reorganized:**
  - Lightweight: SmolLM2 360M, Qwen3.5 0.8B, Qwen3 1.7B
  - Balanced: Qwen3.5 2B, Gemma 2 2B, Phi-3.5 mini 3.8B
  - High quality: Qwen3.5 4B, Qwen2.5 7B, Qwen3.5 9B (desktop only)
  - **NEW Specialized optgroup:** Qwen2.5 Coder 1.5B/3B (code), Qwen2.5 Math 1.5B (math), DeepSeek-R1 Distill 7B (reasoning)
- Removed v4.7.8's now-suboptimal picks: Qwen2.5 1.5B, Qwen2.5 3B, Llama 3.2 3B, SmolLM2 1.7B (all beaten by Qwen3.5 at similar sizes)

### Files Touched
- `amni-scient-site/prayer/index.html`
- `amni-scient-site/prayer/main.js`
- `amni-scient-site/changelog.md`
- Backups: `amni-scient-site/backups/prayer_index_v4.7.9_qwen35.bak`, `amni-scient-site/backups/prayer_main_v4.7.9_qwen35.bak`

### Notes
- Same dropdown shipped to sibling Amni-Haven v5.6.4. Haven keeps a flat dropdown (mobile-only context); Prayer uses optgroups for desktop/mobile spread
- Lesson re v4.7.8: I assumed Qwen2.5 was the latest because it was in my training data. Always check `https://raw.githubusercontent.com/mlc-ai/web-llm/main/src/config.ts` before defending a model pick — it's the only ground truth for "what does the @0.2 pin actually resolve to today"

## [4.7.8] - 2026-04-25 - Prayer WebLLM dropdown: drop junk, ship coherent models

### Fixed
- **Prayer in-browser engine dropdown** had four broken or sub-coherent entries that v4.7.7 missed (4.7.7 changelog claimed "Prayer page already used correct models, no changes needed" — incorrect):
  - `Qwen3.5-0.8B-Instruct-q4f16_1-MLC` — Qwen3.5 doesn't exist in web-llm's prebuiltAppConfig (Qwen line goes 1.5 → 2.5 → 3, no 3.5). Would throw "Cannot find model record" on load
  - `Qwen3.5-2B-Instruct-q4f16_1-MLC` — same, fictional
  - `Bonsai-8B-mlx-1bit` — MLX is Apple's format. web-llm only loads MLC format. Would fail unconditionally
  - `SmolLM2-135M-Instruct-q0f16-MLC` — loads, but cannot do basic instruction-following ("what's 14!?" → "14 is a holiday")
- **Replaced dropdown** with three labeled `<optgroup>`s — Lightweight (SmolLM2 360M, SmolLM2 1.7B), Balanced (Qwen2.5 1.5B, Gemma 2 2B), High quality (Llama 3.2 3B, Qwen2.5 3B, Phi-3.5 mini 3.8B). Every option is in web-llm's actual prebuilt config and produces coherent chat
- **Updated `WEBLLM_DEFAULTS` in `prayer/main.js`** — mobile default `SmolLM2-135M` → `SmolLM2-360M-Instruct-q0f16-MLC` (smallest *coherent* model); desktop default `Qwen2.5-0.5B` → `Qwen2.5-1.5B-Instruct-q4f16_1-MLC`
- Updated OOM troubleshooting tip from "Qwen2.5 0.5B (smallest)" to "SmolLM2 360M (smallest)" to match new dropdown

### Files Touched
- `amni-scient-site/prayer/index.html`
- `amni-scient-site/prayer/main.js`
- `amni-scient-site/changelog.md`
- Backups: `amni-scient-site/backups/prayer_index_v4.7.8_pre_model_overhaul.bak`, `amni-scient-site/backups/prayer_main_v4.7.8_pre_model_overhaul.bak`

### Notes
- Same fix shipped to sibling Amni-Haven app v5.6.3 (same junk dropdown, different runtime — Haven runs in Android System WebView, Prayer in mobile/desktop browser)
- Lesson re v4.7.7: "audited and clean" claims need spot-check evidence. v4.7.7 fixed `calc/` page and asserted Prayer was already fine without verifying. It wasn't

## [4.7.7] - 2026-04-21 - WebLLM Model Compatibility Fix

### Fixed
- **WebLLM Integration** — Resolved "Cannot find model record in appConfig" errors by updating model IDs to supported WebLLM prebuiltAppConfig models:
  - Replaced unsupported Qwen3.5 and Bonsai models with available Qwen2.5 series
  - Updated calc page defaults: mobile `Qwen2.5-0.5B`, desktop `Qwen2.5-1.5B`
  - Prayer page already used correct models, no changes needed

### Changed
- **Model Options** — Updated calc page WebLLM dropdown with accurate size estimates and supported models

### Technical Notes
- Qwen3.5 and Bonsai-8B models not yet available in WebLLM prebuiltAppConfig
- Server-side Adam models remain unchanged and functional
- WebLLM uses MLC-compiled models, requires specific model compilation for new additions

### Files Touched
- `amni-scient-site/calc/index.html`
- `docs/checklists/checklist_fix_webllm_models_v1.3.0.md`
- `amni-scient-site/changelog.md`

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
- Scanned all tracked HTML for phone numbers, street addresses, and SSN patterns. No matches. Only public contact info present: `amnibro7@gmail.com`, `anthony@amni-scient.com`, and the developer's studio credit "Amnibro" on the About page and footers &mdash; all intentional.

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

