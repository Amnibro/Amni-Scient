const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://amni-scient.com';
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'assets', 'tests', 'tools', 'scripts', 'docs', 'backups', 'x', '_shared', 'vendor', 'pkg']);
const SKIP_FILES = new Set(['404.html']);
const walk = (dir, out = []) => { for (const n of fs.readdirSync(dir)) { const p = path.join(dir, n), st = fs.statSync(p); st.isDirectory() ? (SKIP_DIRS.has(n) || n.startsWith('_') || n.startsWith('.') ? 0 : walk(p, out)) : (n.endsWith('.html') && !SKIP_FILES.has(n) && !n.startsWith('_') ? out.push(p) : 0); } return out; };
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => /^disallow:/i.test(l)).map((l) => l.split(':')[1].trim()).filter(Boolean).map((r) => new RegExp('^' + r.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')));
const lastmod = (f) => { try { const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { cwd: ROOT, encoding: 'utf8' }).trim(); const dirty = execFileSync('git', ['status', '--porcelain', '--', f], { cwd: ROOT, encoding: 'utf8' }).trim(); return dirty || !d ? new Date().toISOString().slice(0, 10) : d; } catch { return new Date().toISOString().slice(0, 10); } };
const urls = new Map();
for (const f of walk(ROOT)) {
  const rel = '/' + path.relative(ROOT, f).split(path.sep).join('/');
  if (robots.some((r) => r.test(rel))) continue;
  const html = fs.readFileSync(f, 'utf8');
  const rm = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  if (rm && /noindex/i.test(rm[1])) continue;
  const cm = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const own = SITE + rel.replace(/index\.html$/, '');
  const loc = cm && cm[1].startsWith(SITE) ? cm[1] : own;
  const d = lastmod(f);
  (!urls.has(loc) || urls.get(loc) < d) && urls.set(loc, d);
}
const body = [...urls.entries()].sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0])).map(([u, d]) => `<url><loc>${u}</loc><lastmod>${d}</lastmod></url>`).join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
process.stdout.write('sitemap: ' + urls.size + ' urls\n');
