---
title: Braid CLI seats and what we don't see
date: 2026-09-02
slug: braid-cli-seats-privacy
product: Braid
summary: Cloud seats talk through the CLIs you already signed into. Prompts do not come to Amni-Scient.
cta: /braid
cta_label: See Braid
image: /assets/braid/tile-braid.jpg
---

# Braid CLI seats and what we don't see

Braid is a table, not a proxy. When you turn on a cloud seat it launches the CLI you already pay for — Claude, Grok, Gemini, ChatGPT, Copilot, Cursor, OpenCode — and that vendor sees whatever you sent that seat.

Amni-Scient does not get the prompt. We see Stripe payment events and a licence check (key plus a short machine fingerprint). That is the whole remote list. Details sit on [privacy-braid.html](/privacy-braid.html).

Local seats (Ollama, Adam) can stay offline. Their policies cover what they receive. Vendor CLI tokens stay with those apps; Braid does not upload them.

If that split was fuzzy on the product page, it should not be now. Open [/braid](/braid) and look at the privacy strip before you sign in.
