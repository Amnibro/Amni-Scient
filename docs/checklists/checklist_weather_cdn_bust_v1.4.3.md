# Checklist — Amni-Weather CDN 404 bust v1.4.3

- [x] Diagnose live 404 for ref.js / forecast.js (files on origin; Fastly/CF cached 404 for `?v=129`)
- [x] Confirm bare/cache-busted paths return 200
- [x] Backup wx-boot.129, ref.js, index.html → backups/v1.4.3_cdn_bust/
- [x] Ship wx-boot.130.js with `?v=130` imports
- [x] Update ref.js tiles import to `?v=130`
- [x] Point index.html + stubs (app/wx-app/121–129) at wx-boot.130.js
- [x] Guardian council + architecture_map + changelog
- [ ] Commit + push main
- [ ] Verify live HEAD 200 on ref.js?v=130 and forecast.js?v=130
- [ ] User hard-refresh /weather/
