---
title: Amni-Connect installers for Windows and Linux
date: 2026-09-02
slug: connect-installers
product: Amni-Connect
summary: Amni-Connect lets you host on your own machine and view it from any browser, with nothing in the cloud. Now it has real installers.
cta: /amni-connect.html
cta_label: Amni-Connect
---

# Amni-Connect installers for Windows and Linux

I used to send people to GitHub and hope they picked the right file. Not anymore! The Connect page now has Windows Setup, a Linux AppImage, .deb, and .rpm.

Here's how it works. Install it on the machine you want to control. The viewer is any browser, phone included, with a room code. Video, audio, and input stay on the WebRTC path. The signaling server never sees frames or keystrokes, and I don't keep logs.

This is v1.5.16. On Linux there's a one-liner if you want it: `curl -fsSL https://raw.githubusercontent.com/Amnibro/Amni-Connect/main/scripts/install-linux.sh | bash`. On Windows, SmartScreen may stop you first. Click More info → Run anyway.

Downloads are on the [Amni-Connect](/amni-connect.html) page.
