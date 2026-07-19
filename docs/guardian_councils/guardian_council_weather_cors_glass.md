# Guardian Council — CORS + glass
## Problem
Browser blocked NWS/USGS: custom User-Agent header not allowed by Access-Control-Allow-Headers.
## Votes
Architect: strip non-simple headers — ship
Sentinel: never set User-Agent from browser — ship
Scholar: CSP report-only ignore — ship
Engineer: glass CSS + cache bust 131 — ship
Pathfinder: match design screenshot pills/glass — ship
Majority: ship 1.4.4
