---
title: Qwen3-8B path for Adam — in progress
date: 2026-09-04
slug: adam-qwen-path
product: Adam
description: Loader work toward a Qwen3-8B GF17 atex bake. Path in progress — no bpw win and no quality claim yet.
cta: /amni-ai.html
cta_label: Meet Adam
image: /assets/explore/og-explore.png
---

Short status on Adam’s Qwen side so nobody hears “in progress” as “done.”

We are wiring a Qwen3-8B path that can load a GF17 atex-shaped bake (manifest + codes + scales) the same way the granite atex serve path does. Checkpoint pull and GPU smoke live on the HIP box when it is online — not on a laptop GUI session.

What this is **not**: a claim that Qwen is at 1 bpw, or that quality matched the dense checkpoint. The granite tied bake is still the honest baseline at ~4.6 bpw all-in. Rate/distortion experiments that chase lower bpw without act-path numbers stay lab notes until they survive serve.

Follow [amni-ai.html](/amni-ai.html) and Amnibro/Amni-Ai for what actually merges. I will post again when there is a bake folder and a measured bill — not before.
