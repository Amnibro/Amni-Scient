const fs = require('fs');
const h = fs.readFileSync('C:/Users/antho/Documents/ai/amni-scient-site/learn/index.html', 'utf8');
const lines = h.split('\n');
const subs = [
  {name:'animals', start:6468},
  {name:'music', start:6792},
  {name:'languages', start:7059},
  {name:'math', start:7310},
  {name:'engineering', start:7558},
  {name:'science', start:8967},
];
const allLvls = [];
for (let i=0;i<lines.length;i++) {
  const m = lines[i].match(/^(\s*)(\d+): \[/);
  if (m && m[1].length >= 8) allLvls.push({lineno:i+1, indent:m[1].length, lv:parseInt(m[2])});
}
function countQs(fromLine,toLine){let n=0;for(let i=fromLine;i<toLine;i++){if(lines[i].match(/^\s*\{q:/))n++;}return n;}
for (const sub of subs) {
  const subLvls = allLvls.filter(l => l.lineno >= sub.start && l.lineno < sub.start+1200 && l.lv>=1&&l.lv<=5);
  const out = [];
  for (let i=0;i<subLvls.length;i++){
    const cur = subLvls[i];
    const next = subLvls[i+1] || {lineno: sub.start+1200};
    const cnt = countQs(cur.lineno, next.lineno-1);
    out.push('L'+cur.lv+'='+cnt);
  }
  console.log(sub.name.padEnd(12)+' '+out.join(' '));
}
