const fs = require('fs');
const h = fs.readFileSync('C:/Users/antho/Documents/ai/amni-scient-site/learn/index.html', 'utf8');
const subs = ['animals','music','languages','math','engineering','weather','opposites','counting','shapes','colors','science','mythology','sports','space'];
for (const sub of subs) {
  const re = new RegExp('^      ' + sub + ': \\{', 'm');
  const m = h.match(re);
  if (!m) { console.log(sub + ' NOT FOUND'); continue; }
  const start = h.indexOf(m[0]);
  const body = h.slice(start, start + 250000);
  const out = [];
  for (let lv = 1; lv <= 5; lv++) {
    const lvRe = new RegExp('^        ' + lv + ': \\[', 'm');
    const lm = body.match(lvRe);
    if (!lm) continue;
    const lvStart = body.indexOf(lm[0]) + lm[0].length;
    const lvEnd = body.indexOf('        ]', lvStart);
    const slice = body.slice(lvStart, lvEnd);
    const count = (slice.match(/\{q:/g) || []).length;
    out.push('L' + lv + '=' + count);
  }
  console.log(sub.padEnd(12) + ' ' + out.join(' '));
}
