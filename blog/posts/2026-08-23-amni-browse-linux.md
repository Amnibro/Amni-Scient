---
title: Amni-Browse paints on Linux
date: 2026-08-23
slug: amni-browse-linux
product: Amni-Browse
description: WebKitGTK finally packs into the GTK window, with a sibling omnibox and Ctrl+L — alpha, but the page is no longer a blank white box.
cta: /amni-browse.html
cta_label: Amni-Browse
image: /assets/explore/og-explore.png
---

Amni-Browse on Linux used to open a titled window and then sit there white. That was not a TLS bug and not a failed chrome inject — the WebKit widget never got packed into tao’s GTK box.

The fix is the Unix attach path: `default_vbox()` + `build_gtk`, WebKitGTK in the client area, and a sibling GTK omnibox so address entry is not trapped inside a blank compositor. Ctrl+L focuses the bar the way you expect.

Alpha still means alpha. Do not make this your only browser for banking. Build notes and deps live on the [Amni-Browse](/amni-browse.html) page and the Amnibro/Amni-Browse repo (Linux needs `libwebkit2gtk-4.1-dev` and `libgtk-3-dev`).

If you already had a blank Linux build, rebuild from the tree that includes the GTK pack. If the window paints DuckDuckGo or a cold-start URL, you are on the right binary.
