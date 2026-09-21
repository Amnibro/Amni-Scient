---
title: Grok Remote on Windows is a real app
date: 2026-08-23
slug: grok-remote-desktop
product: Grok-Remote
summary: The PC side is a Tauri desktop now, GrokRemote.exe. Phones still pair with one QR.
cta: /grok-remote.html
cta_label: Grok Remote
image: /assets/grok-remote/logo.jpg
---

# Grok Remote on Windows is a real app

I was running the hub in a browser tab on the PC and losing it behind everything else, so the Windows download is a desktop app, Tauri and WebView2, `GrokRemote.exe`.

It wraps a hub that is already running, or it starts one. You still need `grok` on PATH. Phones pair with one QR, same as before, and the link still heals after Wi-Fi drops and agent restarts.

Linux and macOS are the tarball plus `./start.sh` (Python 3.10+). Desktop is 1.4.4, hub plugin 1.9.21.

The Chromium/Electron portable is retired from the site button. Page is [grok-remote.html](/grok-remote.html).
