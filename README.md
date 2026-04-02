# amni-scient.com
Static site for Amni-Scient — hosted on GitHub Pages.
## Pages
- **/** — Landing page, project showcase
- **/amni-crypt** — Amni-Crypt product page (1024-bit file encryption, Android)
- **/amni-haven** — Amni-Haven product page (Haven chat client, Android)
- **/amni-ai** — Amni-AI product page (local intelligence engine, Desktop)
- **/amni-core** — Amni-Core product page (quantum-safe systems platform)
- **/amni-explore** — Amni-Explore product page (80K-particle galaxy explorer, Rust/WASM)
- **/explore** — Amni-Explore in-browser 3D app
- **/privacy** — Privacy policy hub (links to per-product policies)
- **/privacy-crypt** — Amni-Crypt privacy policy
- **/privacy-haven** — Amni-Haven privacy policy
- **/privacy-ai** — Amni-AI privacy policy
- **/privacy-core** — Amni-Core privacy policy
- **/terms** — Terms of service / EULA

## Theme Colors
| Product | Accent | Hex |
|---------|--------|-----|
| Homepage (default) | Green | #00ff9d |
| Amni-Crypt | Royal Blue | #2979ff |
| Amni-Haven | Purple | #7c5cfc |
| Amni-AI | Amber | #ffb74d |
| Amni-Core | Red | #ef5350 |
| Amni-Explore | Cyan | #00b4ff |
| Amni-Calc | Orange | #ff6b35 |
## Stack
HTML5 + CSS3 + vanilla JS. WebGL apps use Three.js + WASM (Rust). JS is obfuscated for production.
## Build
Edit source in `src/explore/` or `src/calc/`, then:
```
npm run build
```
This runs `obfuscate.js` which extracts JS from source HTML, applies javascript-obfuscator (base64 string encoding, hex identifiers, string splitting, object key transforms), and writes to `explore/` and `calc/`.
## Deploy
Push to `main` branch → GitHub Pages auto-deploys via CNAME.
## Domain
amni-scient.com + amni-scient.net (Squarespace registrar → GitHub Pages DNS)