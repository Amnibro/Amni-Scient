---
title: Dogfooding Amni-Browse on NeverSSL and HN
date: 2026-08-27
slug: browse-dogfood-neverssl
product: Amni-Browse
description: After the Linux paint path landed, I pointed the omnibox at plain HTTP and a busy site — boring checks, useful failures.
cta: /amni-browse.html
cta_label: Amni-Browse
image: /assets/explore/og-explore.png
---

Once Linux stopped being a white rectangle, I did the boring checks.

NeverSSL is a plain-HTTP canary — if the omnibox and navigation stack only pretend to work on HTTPS marketing pages, you find out fast. Hacker News is the other canary: lots of links, tight layout, no patience for a broken focus ring or a dead Ctrl+L.

Neither test makes Amni-Browse “done.” They just prove the GTK-packed WebKit surface will load a real document and take a URL from the sibling omnibox. Servo paths and chrome polish are still their own queue.

Build from [Amni-Browse](/amni-browse.html) / Amnibro/Amni-Browse if you want to poke it. Alpha, local-only storage, zero telemetry by design — and still not your bank browser.
