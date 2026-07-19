# Guardian Council — weather CDN 404 (ref.js / forecast.js)

## Problem
Production console: GET /weather/ref.js?v=129 and forecast.js?v=129 → 404. CSP report-only noise only.

## Findings
- Commit 5021333 already added both modules; GH Pages build succeeded.
- raw.githubusercontent.com + cache-busted URLs return 200.
- Fastly/GitHub + Cloudflare cached the pre-deploy 404 for exact `?v=129` (max-age 14400).

## Votes
| Guardian | Approach | Vote |
|----------|----------|------|
| Architect | New boot entry + cache version (130); leave files as-is | Ship 130 |
| Sentinel | Do not purge unknown CF; version bump is safe | Ship 130 |
| Scholar | CSP report-only: ignore; no policy change | Ship 130 |
| Engineer | Stub old boots → 130 so cached HTML recovers | Ship 130 |
| Pathfinder | Optional CF purge later; deploy first | Ship 130 |

**Majority: bump to wx-boot.130 + ?v=130, push, verify live 200.**
