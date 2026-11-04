// Local API for developing /test/ without Cloudflare: the real Worker over node:sqlite.
//   node workers/amni-test/test/dev-server.mjs            -> http://127.0.0.1:8787
// Dev sign-in and fake payments are on. Extra dev-only routes for exercising the timers:
//   POST /__dev/tick {"days":1}   move the clock forward     POST /__dev/sweep   run the cron sweep
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';
import { sweep } from '../worker/sweep.js';
import { makeD1 } from './d1.mjs';

const PORT = Number(process.env.PORT || 8787);
let offset = 0;
const env = {
  DB: makeD1(fileURLToPath(new URL('../schema.sql', import.meta.url))),
  DEV_AUTH: '1', DEV_FAKE_PAY: '1', ADMIN_EMAILS: process.env.ADMIN_EMAILS || 'admin@example.com',
  ALLOWED_ORIGINS: 'http://localhost:8080,http://127.0.0.1:8080,http://10.0.2.2:8080', SITE_URL: 'http://127.0.0.1:8080/test/',
  REPORT_THRESHOLD: '2', PAYOUT_MIN_CENTS: '1000', __now: () => Date.now() + offset,
};

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  if (req.url.startsWith('/__dev/')) {
    const j = body.length ? JSON.parse(body) : {};
    let out = { ok: true };
    if (req.url === '/__dev/tick') offset += (Number(j.days || 0) * 86400000) + Number(j.ms || 0);
    if (req.url === '/__dev/sweep') out = await sweep(env);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ ...out, now: new Date(Date.now() + offset).toISOString() }));
  }
  const r = await worker.fetch(new Request(`http://127.0.0.1:${PORT}${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(PORT, '127.0.0.1', () => console.log(`amni-test dev API on http://127.0.0.1:${PORT}`));
