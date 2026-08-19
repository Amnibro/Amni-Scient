const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const POSTS = path.join(ROOT, 'blog', 'posts');
const OUT = path.join(ROOT, 'blog');
const SITE = 'https://amni-scient.com';
const CSS = '/css/style.css?v=b262';
function parseFront(raw) {
  if (!raw.startsWith('---')) throw new Error('missing front matter');
  const end = raw.indexOf('\n---', 3);
  if (end < 0) throw new Error('unclosed front matter');
  const meta = {};
  for (const line of raw.slice(4, end).split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1);
    meta[k] = v;
  }
  return { meta, body: raw.slice(end + 4).replace(/^\s+/, '') };
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function inline(s) {
  return esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
}
function md(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;
  const flushP = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const flushL = () => { if (list) { out.push('<ul>' + list.map((x) => '<li>' + inline(x) + '</li>').join('') + '</ul>'); list = null; } };
  for (const line of lines) {
    if (line.startsWith('### ')) { flushP(); flushL(); out.push('<h3>' + inline(line.slice(4)) + '</h3>'); continue; }
    if (line.startsWith('## ')) { flushP(); flushL(); out.push('<h2>' + inline(line.slice(3)) + '</h2>'); continue; }
    if (line.startsWith('# ')) { flushP(); flushL(); continue; }
    if (line.trim() === '---') { flushP(); flushL(); out.push('<hr>'); continue; }
    if (/^[-*] /.test(line)) { flushP(); list = list || []; list.push(line.replace(/^[-*] /, '')); continue; }
    if (!line.trim()) { flushP(); flushL(); continue; }
    if (list) flushL();
    para.push(line.trim());
  }
  flushP();
  flushL();
  return out.join('\n');
}
function fmtDate(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function themeBoot() {
  return `<script>(function(){var h=document.documentElement,s=localStorage.getItem('amni-theme')||'light';h.dataset.theme=s;function u(){var b=document.getElementById('theme-toggle');if(b)b.textContent=h.dataset.theme==='dark'?'LIGHT':'DARK';var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',h.dataset.theme==='dark'?'#08090B':'#F3F2EF');}window.addEventListener('DOMContentLoaded',u);window.toggleTheme=function(){var n=h.dataset.theme==='dark'?'light':'dark';h.dataset.theme=n;localStorage.setItem('amni-theme',n);u();};})();</script>`;
}
function nav(active) {
  const a = (href, label, key) => `<a href="${href}"${key === active ? ' class="active"' : ''}>${label}</a>`;
  return `<nav>
<a href="/" class="logo">AMNI<span>-SCIENT</span></a>
<div class="links" id="nav-links">
${a('/', 'HOME', 'home')}
${a('/amni-calc.html', 'CALCULATORS', 'calc')}
${a('/amni-learn.html', 'LEARN', 'learn')}
${a('/blog/', 'BLOG', 'blog')}
${a('/research.html', 'RESEARCH', 'research')}
<div class="nav-dd">
<button class="nav-dd-trigger">PROJECTS</button>
<div class="nav-dd-menu">
<a href="/braid">BRAID</a>
<a href="/symphony.html">SYMPHONY</a>
<a href="/grok-remote.html">GROK-REMOTE</a>
<a href="/amni-ai.html">AMNI-AI</a>
<a href="/amni-browse.html">AMNI-BROWSE</a>
<a href="/amni-calc.html">AMNI-CALC</a>
<a href="/amni-explore.html">AMNI-EXPLORE</a>
<a href="/amni-space.html">AMNI-SPACE</a>
<a href="/amni-weather.html">AMNI-WEATHER</a>
<a href="/game/">AMNI-GAME</a>
<a href="/amni-learn.html">AMNI-LEARN</a>
<a href="/amni-llm.html">AMNI-LLM</a>
<a href="/amni-connect.html">AMNI-CONNECT</a>
<a href="/amni-code.html">AMNI-CODE</a>
<a href="/amni-core.html">AMNI-CORE</a>
<a href="/amni-haven.html">AMNI-HAVEN</a>
<a href="/amni-crypt.html">AMNI-CRYPT</a>
<a href="/amni-life.html">AMNI-LIFE</a>
<a href="/amni-prayer.html">AMNI-PRAYER</a>
<a href="/amni-mail.html">AMNI-MAIL</a>
</div>
</div>
${a('/about.html', 'ABOUT', 'about')}
${a('/faq.html', 'FAQ', 'faq')}
<a href="https://ko-fi.com/amnibro" target="_blank" rel="noopener noreferrer">SUPPORT</a>
</div>
<button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">LIGHT</button>
<div class="hamburger" id="hamburger" onclick="document.getElementById('nav-links').classList.toggle('open')">
<span></span><span></span><span></span>
</div>
</nav>`;
}
function footer() {
  return `<aside class="support-cta" aria-label="Support"><a href="https://ko-fi.com/amnibro" target="_blank" rel="noopener noreferrer" class="support-link"><span class="support-ico">&#9749;</span><span>Enjoying this? <strong>Support on Ko-fi</strong></span></a></aside>
<footer>
<div class="footer-links">
<a href="/about.html">ABOUT</a>
<a href="/faq.html">FAQ</a>
<a href="/blog/">BLOG</a>
<a href="/blog/rss.xml">RSS</a>
<a href="/privacy.html">PRIVACY</a>
<a href="/terms.html">TERMS</a>
<a href="mailto:amnibro7@gmail.com">CONTACT</a>
<a href="https://ko-fi.com/amnibro" target="_blank" rel="noopener noreferrer" class="kofi-link">&#9749; SUPPORT</a>
</div>
<p>&copy; 2025-2026 Amniscient, LLC. All rights reserved.</p>
</footer>`;
}
function shell({ title, desc, url, image, type, jsonLd, bodyClass, inner }) {
  const img = image || `${SITE}/assets/explore/og-explore.png`;
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#F3F2EF">
<title>${esc(title)}</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Amni-Scient">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<link rel="canonical" href="${esc(url)}">
<link rel="alternate" type="application/rss+xml" title="AMNI-SCIENT updates" href="${SITE}/blog/rss.xml">
<link rel="preload" href="/assets/fonts/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
<script type="application/ld+json">${jsonLd}</script>
<link rel="stylesheet" href="${CSS}">
${themeBoot()}
</head>
<body class="${bodyClass}">
<div class="grid-bg"></div>
${nav('blog')}
${inner}
${footer()}
</body>
</html>
`;
}
function loadPosts() {
  if (!fs.existsSync(POSTS)) fs.mkdirSync(POSTS, { recursive: true });
  return fs.readdirSync(POSTS).filter((f) => f.endsWith('.md') && !f.startsWith('_')).map((file) => {
    const { meta, body } = parseFront(fs.readFileSync(path.join(POSTS, file), 'utf8'));
    if (!meta.title || !meta.date || !meta.slug) throw new Error(file + ' needs title, date, slug');
    const image = meta.image ? (meta.image.startsWith('http') ? meta.image : SITE + meta.image) : '';
    return { file, slug: meta.slug, title: meta.title, date: meta.date, summary: meta.summary || '', product: meta.product || 'Studio', cta: meta.cta || '', cta_label: meta.cta_label || 'Open the product', image, html: md(body) };
  }).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
}
function writePost(p) {
  const url = `${SITE}/blog/${p.slug}/`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    datePublished: p.date,
    dateModified: p.date,
    description: p.summary,
    url,
    image: p.image || undefined,
    author: { '@type': 'Person', name: 'Anthony Reffelt', alternateName: 'Amnibro' },
    publisher: { '@type': 'Organization', name: 'AMNI-SCIENT', legalName: 'Amniscient, LLC', url: SITE }
  });
  const cta = p.cta ? `<div class="cta-row"><a class="btn btn-primary" href="${esc(p.cta)}">${esc(p.cta_label)}</a><a class="btn btn-outline" href="/blog/">All updates</a></div>` : `<div class="cta-row"><a class="btn btn-outline" href="/blog/">All updates</a></div>`;
  const hero = p.image ? `<div class="blog-hero"><img src="${esc(p.image)}" alt="" width="1600" height="900"></div>` : '';
  const inner = `<article class="blog-wrap">
<p class="eyebrow">${esc(p.product)} — ${fmtDate(p.date)}</p>
<h1>${esc(p.title)}</h1>
${p.summary ? `<p class="blog-deck">${esc(p.summary)}</p>` : ''}
${hero}
<div class="blog-prose">
${p.html}
</div>
${cta}
</article>`;
  const dir = path.join(OUT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell({ title: `${p.title} — AMNI-SCIENT`, desc: p.summary || p.title, url, image: p.image, type: 'article', jsonLd, bodyClass: 'pp blog-page', inner }));
}
function writeIndex(posts) {
  const cards = posts.map((p) => `<a class="blog-card" href="/blog/${esc(p.slug)}/">
<p class="eyebrow">${esc(p.product)} — ${fmtDate(p.date)}</p>
<h2>${esc(p.title)}</h2>
<p>${esc(p.summary)}</p>
<span class="blog-more">Read</span>
</a>`).join('\n');
  const inner = `<header class="blog-mast">
<p class="eyebrow">Amniscient, LLC — ship log</p>
<h1>Updates</h1>
<p class="masthead-line">What changed, what it means for you, and why it is worth your time. One post per user-visible release — not every commit.</p>
</header>
<section class="blog-list">${cards}</section>`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AMNI-SCIENT Updates',
    url: `${SITE}/blog/`,
    publisher: { '@type': 'Organization', name: 'AMNI-SCIENT', legalName: 'Amniscient, LLC', url: SITE }
  });
  fs.writeFileSync(path.join(OUT, 'index.html'), shell({ title: 'Updates — AMNI-SCIENT', desc: 'Product updates from Amniscient, LLC: what shipped, what it means for users, and how to try it.', url: `${SITE}/blog/`, type: 'website', jsonLd, bodyClass: 'pp blog-page', inner }));
}
function writeRss(posts) {
  const items = posts.map((p) => `<item>
<title>${esc(p.title)}</title>
<link>${SITE}/blog/${p.slug}/</link>
<guid>${SITE}/blog/${p.slug}/</guid>
<pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate>
<description>${esc(p.summary)}</description>
</item>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>AMNI-SCIENT Updates</title>
<link>${SITE}/blog/</link>
<description>What shipped, what it means, why it matters.</description>
${items}
</channel></rss>
`);
}
function patchSitemap(posts) {
  const file = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8');
  xml = xml.replace(/\s*<url><loc>https:\/\/amni-scient\.com\/blog\/[^<]*<\/loc>.*?<\/url>/gs, '');
  const today = new Date().toISOString().slice(0, 10);
  const extra = [`<url><loc>${SITE}/blog/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`]
    .concat(posts.map((p) => `<url><loc>${SITE}/blog/${p.slug}/</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`))
    .join('\n');
  if (!xml.includes('</urlset>')) throw new Error('sitemap missing urlset');
  fs.writeFileSync(file, xml.replace('</urlset>', extra + '\n</urlset>\n'));
}
function patchNav() {
  const re = /<a href="amni-learn\.html">LEARN<\/a>\r?\n<a href="research\.html">RESEARCH<\/a>/g;
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      if (name === 'node_modules' || name === 'backups' || name === 'blog') continue;
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.html')) {
        const t = fs.readFileSync(p, 'utf8');
        if (t.includes('href="/blog/">BLOG</a>') || t.includes('href="blog/">BLOG</a>')) continue;
        const nl = t.includes('\r\n') ? '\r\n' : '\n';
        const next = t.replace(re, `<a href="amni-learn.html">LEARN</a>${nl}<a href="/blog/">BLOG</a>${nl}<a href="research.html">RESEARCH</a>`);
        if (next !== t) fs.writeFileSync(p, next);
      }
    }
  };
  walk(ROOT);
}
function main() {
  const posts = loadPosts();
  fs.mkdirSync(OUT, { recursive: true });
  for (const p of posts) writePost(p);
  writeIndex(posts);
  writeRss(posts);
  patchSitemap(posts);
  patchNav();
  process.stdout.write('blog: ' + posts.length + ' posts\n');
}
main();
