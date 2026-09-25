const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { esc, inline } = require('./build-blog.js');
const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'amni-os', 'docs');
const REPO = process.env.AMNI_OS_REPO || path.join(process.env.HOME || '', 'ai', 'amni-os');
const REF = process.env.AMNI_OS_REF || 'origin/main';
const REDACT = [[/Antman-PC/g, 'the test PC'], [/\/home\/[a-z_][a-z0-9_-]*/g, '~'], [/C:\/Users\/[^/\s`]+/g, 'C:/Users/&lt;user&gt;'], [/<a href="(?!https?:|#)[^"]*">([^<]*)<\/a>/g, '$1']];
const show = (f) => execFileSync('git', ['-C', REPO, 'show', `${REF}:${f}`], { maxBuffer: 64 << 20 }).toString();
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
const tidy = (s) => REDACT.reduce((t, [r, v]) => t.replace(r, v), inline(s));
function body(lines) {
  const out = [];
  let para = [], item = null, fence = null, depth = 0;
  const flushItem = () => { if (item !== null) { out.push('<li>' + tidy(item.join(' '))); item = null; } };
  const flushP = () => { if (para.length) { out.push('<p>' + tidy(para.join(' ')) + '</p>'); para = []; } };
  const closeTo = (d) => { flushItem(); while (depth > d) { out.push('</li></ul>'); depth--; } };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (fence !== null) { /^\s*```/.test(line) ? (out.push('<pre><code>' + esc(fence.join('\n')) + '</code></pre>'), (fence = null)) : fence.push(line); continue; }
    if (/^\s*```/.test(line)) { flushP(); closeTo(0); fence = []; continue; }
    const h = line.match(/^###+\s+(.*)$/);
    if (h) { flushP(); closeTo(0); out.push('<h3>' + tidy(h[1]) + '</h3>'); continue; }
    const b = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (b) {
      flushP();
      const d = Math.min(Math.floor(b[1].length / 2) + 1, depth + 1);
      if (d > depth) { flushItem(); out.push('<ul>'); depth = d; } else { closeTo(d); out.push('</li>'); }
      item = [b[2]];
      continue;
    }
    if (!line.trim()) { flushP(); closeTo(0); continue; }
    if (item !== null && /^\s/.test(line)) { item.push(line.trim()); continue; }
    closeTo(0);
    para.push(line.trim());
  }
  flushP();
  closeTo(0);
  return out.join('\n');
}
function releaseNotes(md) {
  const entries = [];
  let cur = null;
  for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) { cur = { head: m[1], lines: [] }; entries.push(cur); continue; }
    if (cur) cur.lines.push(line);
  }
  const seen = {};
  return entries.map((e) => {
    const d = e.head.match(/\s*\(([^()]*\d{4}-\d{2}-\d{2}[^()]*)\)\s*$/) || e.head.match(/\s*\(([^()]*unreleased[^()]*)\)\s*$/i);
    const title = d ? e.head.slice(0, d.index) : e.head;
    let id = slug(title) || 'entry';
    id = seen[id] ? `${id}-${++seen[id]}` : ((seen[id] = 1), id);
    return { id, title: tidy(title), date: d ? tidy(d[1]) : '', html: body(e.lines) };
  });
}
function page(entries) {
  const tpl = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
  const [head, rest] = tpl.split('<main class="legal os-doc">');
  const nav = rest.match(/<ul class="doc-nav"[\s\S]*?<\/ul>/)[0].replace(' aria-current="page"', '').replace('href="/amni-os/docs/release-notes.html"', 'href="/amni-os/docs/release-notes.html" aria-current="page"');
  const tail = rest.slice(rest.indexOf('</main>'));
  const title = 'Release notes', desc = 'Every Amni OS change, newest first, generated from the Amni OS changelog.';
  const url = 'https://amni-scient.com/amni-os/docs/release-notes.html';
  const top = head.replace(/<title>[^<]*<\/title>/, `<title>${title} &mdash; Amni OS | AMNI-SCIENT</title>`).replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`).replace(/(<meta property="og:title" content=")[^"]*/, `$1${title} &mdash; Amni OS`).replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`).replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`).replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`);
  const toc = '<ul>' + entries.map((e) => `<li><a href="#${e.id}">${e.title}</a>${e.date ? ` <span class="rn-date">${e.date}</span>` : ''}</li>`).join('') + '</ul>';
  const list = entries.map((e) => `<section class="rn-entry" id="${e.id}">\n<h2>${e.title}</h2>\n${e.date ? `<p class="rn-date">${e.date}</p>\n` : ''}${e.html}\n</section>`).join('\n');
  const stamp = new Date().toISOString().slice(0, 10);
  return `${top}<main class="legal os-doc">\n<p class="eyebrow">Amni OS docs</p>\n<h1>RELEASE NOTES</h1>\n<p class="effective">Generated ${stamp} from the Amni OS changelog</p>\n${nav}\n<p>What changed in each Amni OS build, newest first. Entries marked unreleased are merged but not yet on a published ISO; installed systems usually get them through the daily update.</p>\n<h2>Contents</h2>\n${toc}\n${list}\n${tail}`;
}
function main() {
  const entries = releaseNotes(show('changelog.md'));
  fs.writeFileSync(path.join(DOCS, 'release-notes.html'), page(entries));
  const drivers = show('scripts/drivers.json');
  JSON.parse(drivers);
  fs.writeFileSync(path.join(DOCS, 'drivers.json'), drivers);
  fs.writeFileSync(path.join(DOCS, 'amnios-iso.pub'), show('branding/amnios-iso.pub'));
  process.stdout.write(`os-docs: ${entries.length} release-note entries from ${REPO} ${REF}\n`);
}
main();
