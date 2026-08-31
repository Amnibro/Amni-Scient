const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const tiles=[...html.matchAll(/<section class="tile( right)?"/g)].map(m=>m[1]?'R':'L');
if(tiles.length<4){console.error('too few tiles',tiles);process.exit(1)}
const bad=[];
tiles.forEach((s,i)=>{const want=i%2===0?'L':'R';if(s!==want)bad.push(i+':'+s+' want '+want)});
if(bad.length){console.error('alternation broken',tiles.join(''),bad.join(', '));process.exit(1)}
if(!html.includes('Amni-Browse')||!html.includes('v0.12.6')){console.error('home missing current Browse');process.exit(1)}
console.log('ok',tiles.join(''),tiles.length);
