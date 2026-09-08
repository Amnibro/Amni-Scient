---
title: Calc's WASM kernels got a polish
date: 2026-08-21
slug: calc-wasm-polish
product: Amni-Calc
summary: The in-browser numerics are tighter. Same calculators, less friction when you iterate.
cta: /amni-calc.html
cta_label: Open Amni-Calc
image: /assets/explore/og-explore.png
---

# Calc's WASM kernels got a polish

I spent a pass on the WebAssembly kernels that actually solve the modules — beams, fluids, the stuff JavaScript is slow at — so the calculators feel less sticky when you change a load and watch the plot move.

Nothing new to learn. You still open a tab, pick a module, type geometry, and read a result. Inputs still stay in the browser. I just cleaned the path the numbers take.

If a plot used to hitch when you dragged a load, try it again. If it still does, tell me which module.

The suite is [amni-calc.html](/amni-calc.html). The bolts calculator is still the one I open first: [calc/bolts.html](/calc/bolts.html).
