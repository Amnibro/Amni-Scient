---
title: HedgeDoc on Android
date: 2026-09-02
slug: hedgedoc-android
product: HedgeDoc
summary: An unofficial native Android client for HedgeDoc 1.x and 2 that works with the server you already run.
cta: /amni-hedgedoc.html
cta_label: HedgeDoc
image: /assets/hedgedoc/connect.png
---

# HedgeDoc on Android

I keep my notes on a HedgeDoc server, and on the phone that meant a browser tab. So I wrote a native Kotlin client that talks to both 1.x and 2.

Setup is easy. Sideload the signed APK and point it at your instance, or at `demo.hedgedoc.org`.

It asks `/api/private/config` whether you're on 2, then uses REST for 2 and the old Socket.IO save path for 1.x. Login is whatever you already use: local, LDAP, guest, a session cookie, or a HedgeDoc 2 API token. Nothing phones home to me.

The fine print: v1.2.0, Android 8+. HedgeDoc is AGPL, so the client is too. Play Protect may warn you, because the signature is a debug cert. And I'm not affiliated with the HedgeDoc project.

Grab it from [HedgeDoc for Android](/amni-hedgedoc.html).
