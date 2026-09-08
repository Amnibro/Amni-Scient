---
title: Bolts, fatigue, springs — notes that stuck
date: 2026-08-29
slug: calc-bolts-fatigue-notes
product: Amni-Calc
description: A tighter pass on the modules I actually use — preload/torque, fatigue criteria on one FoS shape, spring rates that match the book.
cta: /calc/bolts.html
cta_label: Bolts calculator
image: /assets/explore/og-explore.png
---

Three Calc modules got more of my attention after the WASM F-row pass: bolts, fatigue, and springs.

Bolts: preload as a fraction of proof load × stress area, torque via nut factor K (and the friction-split path when you have μ). Grades/sizes are in-crate tables — useful, but cite your own standard edition for critical joints.

Fatigue: Goodman and Soderberg were already on the proportional load-line form; Gerber now follows the same shape instead of a const-mean-only shortcut. Marin factors still expect you to know whether Sut is in MPa — the UI path matters.

Springs: helical rate on the usual Gd⁴/8D³n path, Belleville on Almen-Laszlo/DIN-ish, torsion on the Shigley radian divisor. Extension/Wahl stress coverage is thinner than compression — do not treat every mode as equally golden.

Try [/calc/bolts.html](/calc/bolts.html), fatigue under stress, and the springs tab in [/calc/](/calc/). Local WASM. If your handbook disagrees, send the case.
