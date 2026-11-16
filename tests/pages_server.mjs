// Local stand-in for Cloudflare Pages, for tests and for tools/build-offline.mjs --probe.
// Serves the repo root with the same URL rules the live site has:
//   /a.html -> 308 /a      /d/index.html -> 308 /d/      /d -> 308 /d/
//   /a serves a.html       unknown paths serve 404.html with status 404
// and applies the path rules in /_headers (COOP/COEP for /cad/ and /lib/amni-llm/).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', webmanifest: 'application/manifest+json',
  wasm: 'application/wasm', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', ico: 'image/x-icon', avif: 'image/avif',
  woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm',
  txt: 'text/plain; charset=utf-8', xml: 'application/xml', glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream', md: 'text/markdown; charset=utf-8' };

function headerRules(root) {
  const rules = [];
  let cur = null;
  let text = '';
  try { text = fs.readFileSync(path.join(root, '_headers'), 'utf8'); } catch (_) {}
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { cur = { pat: line.trim(), h: [] }; rules.push(cur); }
    else if (cur) { const i = line.indexOf(':'); if (i > 0) cur.h.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]); }
  }
  return p => {
    const out = [];
    for (const r of rules) {
      const ok = r.pat.endsWith('*') ? p.startsWith(r.pat.slice(0, -1)) : p === r.pat;
      if (ok) out.push(...r.h);
    }
    return out;
  };
}

export function startServer({ port = 0, root = ROOT } = {}) {
  const rulesFor = headerRules(root);
  const isFile = f => { try { return fs.statSync(f).isFile(); } catch (_) { return false; } };
  const isDir = f => { try { return fs.statSync(f).isDirectory(); } catch (_) { return false; } };
  const server = http.createServer((req, res) => {
    let u;
    try { u = new URL(req.url, 'http://x'); } catch (_) { res.writeHead(400).end(); return; }
    let p;
    try { p = decodeURIComponent(u.pathname); } catch (_) { res.writeHead(400).end(); return; }
    if (p.includes('\0') || p.split('/').includes('..')) { res.writeHead(400).end(); return; }
    const redirect = to => { res.writeHead(308, { location: to + u.search }); res.end(); };
    if (p.endsWith('/index.html')) return redirect(p.slice(0, -10));
    if (p.endsWith('.html') && isFile(path.join(root, p))) return redirect(p.slice(0, -5));
    let file = path.join(root, p), status = 200;
    if (p.endsWith('/')) file = path.join(file, 'index.html');
    else if (isDir(file)) { if (isFile(path.join(file, 'index.html'))) return redirect(p + '/'); }
    if (!isFile(file) && isFile(file + '.html') && !p.endsWith('/')) file += '.html';
    if (!isFile(file)) { file = path.join(root, '404.html'); status = 404; }
    const st = fs.statSync(file);
    const ext = path.extname(file).slice(1).toLowerCase();
    const etag = '"' + crypto.createHash('md5').update(st.size + ':' + st.mtimeMs).digest('hex') + '"';
    const h = { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'public, max-age=0, must-revalidate', etag, 'accept-ranges': 'bytes' };
    for (const [k, v] of rulesFor(p)) h[k.toLowerCase()] = v;
    if (status === 200 && req.headers['if-none-match'] === etag) { res.writeHead(304, h); res.end(); return; }
    const m = status === 200 && /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const start = m[1] === '' ? Math.max(0, st.size - +m[2]) : +m[1];
      const end = m[1] === '' || m[2] === '' ? st.size - 1 : Math.min(+m[2], st.size - 1);
      if (start >= st.size || start > end) { res.writeHead(416, { 'content-range': 'bytes */' + st.size }); res.end(); return; }
      h['content-range'] = `bytes ${start}-${end}/${st.size}`; h['content-length'] = end - start + 1;
      res.writeHead(206, h);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file, { start, end }).pipe(res); return;
    }
    h['content-length'] = st.size;
    res.writeHead(status, h);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, url: 'http://localhost:' + server.address().port })));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await startServer({ port: +(process.argv[2] || 8788) });
  console.log('serving ' + ROOT + ' at ' + url);
}
