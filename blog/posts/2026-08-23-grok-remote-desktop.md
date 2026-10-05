---
title: Grok Remote on Windows is a real app
date: 2026-08-26
slug: grok-remote-desktop
product: Grok-Remote
summary: The PC side of Grok Remote used to live in a browser tab. Now it's a proper Windows app.
cta: /grok-remote.html
cta_label: Grok Remote
image: /assets/grok-remote/logo.jpg
---

# Grok Remote on Windows is a real app

I kept losing the hub tab behind everything else on my PC. So the Windows download is a desktop app now: `GrokRemote.exe`, built on Tauri and WebView2.

It wraps a hub that's already running, or it starts one for you. You still need `grok` on PATH.

Pairing hasn't changed. Phones pair with one QR, same as before, and the link still heals itself after Wi-Fi drops and agent restarts.

Desktop is 1.4.4, hub plugin 1.9.20. On Linux or macOS? Use the tarball plus `./start.sh` (Python 3.10+).

The old Chromium/Electron portable is retired from the site button. Everything's on [grok-remote.html](/grok-remote.html).
