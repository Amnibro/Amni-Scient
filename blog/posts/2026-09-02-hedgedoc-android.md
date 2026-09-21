---
title: HedgeDoc on Android
date: 2026-09-02
slug: hedgedoc-android
product: HedgeDoc
summary: Unofficial native client for HedgeDoc 1.x and 2. Sideload the APK, point it at the server you already run.
cta: /amni-hedgedoc.html
cta_label: HedgeDoc
image: /assets/hedgedoc/connect.png
---

# HedgeDoc on Android

I keep notes on a HedgeDoc server, and the phone was a browser tab, so I wrote a native Kotlin client that talks to 1.x and 2.

Sideload the signed APK. Point it at your instance, or `demo.hedgedoc.org`. It asks `/api/private/config` whether you are on 2, then uses REST for 2 and the old Socket.IO save path for 1.x. Login is whatever you already use: local, LDAP, guest, a session cookie, or a HedgeDoc 2 API token. Nothing phones home to me.

HedgeDoc is AGPL, so the client is too. Play Protect may warn, the signature is a debug cert. v1.2.0, Android 8+. I am not affiliated with the HedgeDoc project.

[HedgeDoc for Android](/amni-hedgedoc.html).
