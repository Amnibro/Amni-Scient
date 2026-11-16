# amni-scient.com
Static site for Amni-Scient — hosted on GitHub Pages.

## Offline support

The site and its web apps work with no connection. Visitors manage saved apps at [/offline.html](https://amni-scient.com/offline.html).

- `offline-app/offline.amni` is the page program, written in Helium. Every page starts it through `offline-app/start.js`. It registers the service worker, saves small apps (and the code of large ones) on first visit, shows the connection notice, and draws the list on `/offline.html`. Build it with `hc build --web -DGS_WEB_MOVE=1 -DGS_WEB_STACK=4194304 offline-app/offline.amni -o offline-app/offline.wasm`.
- `sw.js` is the service worker. Browsers only accept a JavaScript file here. It is network first, so nothing changes while connected, and it serves saved copies only when the network cannot be reached.
- `tools/build-offline.amni` (Helium) writes the file lists in `offline-packs/` from the git index. After changing the site, stage the changes and run `hc run tools/build-offline.amni` from the site root, or saved apps keep their old lists.
- `tests/offline_probe.mjs` records what each app loads from shared folders and CDNs (`tools/offline-probe.txt`). `tests/offline_check.mjs` opens every app with the network cut, once after a single visit and once after pressing Save.
- To turn it all off, replace `sw.js` with a worker that calls `self.registration.unregister()` in its `activate` handler.
