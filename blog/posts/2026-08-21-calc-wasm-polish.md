---
title: What landed in the Amni-Calc WASM suite
date: 2026-08-21
slug: calc-wasm-polish
product: Amni-Calc
description: Mid-August polish notes on the in-browser engineering kernels — beams, bolts, springs, seals, fatigue load-line, and the rest of the F-row fixes.
cta: /amni-calc.html
cta_label: Open Amni-Calc
image: /assets/explore/og-explore.png
---

I spent a stretch of August fixing the Amni-Calc WASM kernels against textbook goldens instead of arguing with the UI.

What landed, in plain terms: propped-beam moment sign, Belleville spring schema defaults, torsion rate on the Shigley radian form, fatigue Gerber moved onto the same load-line FoS shape as Goodman/Soderberg, plus bolts preload/torque consistency, seals, sections, and the other F-rows that had been open. Plane stress and the full-component von Mises path were already behaving; the messy ones were the eigen/unit edge cases.

How to try it: open [Amni-Calc](/amni-calc.html) or jump straight into a module under [/calc/](/calc/). Everything still runs in the tab — no account, no upload.

Honest limits: this is a calculator suite, not FEA. Table editions and a few heuristics (gasket E_eff, hollow UI holes) are called out where they are soft. If a number disagrees with your handbook, tell me which case — I keep the audit scripts.
