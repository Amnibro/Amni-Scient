import fs from 'fs';
const src=fs.readFileSync(new URL('../mod-mathx.js',import.meta.url),'utf8');globalThis.window={AmniHub:{category(){},register(){}}};new Function(src)();
const {gen,ap,D}=window.AmniMathX;let bad=0,n=0;
for(const dk of Object.keys(D))for(let s=1;s<=300;s++){const P=gen(dk,s*7919),g={},pos=new Set();n++;P.cells.forEach(c=>{const k=c.y+','+c.x;pos.has(k)?bad++:pos.add(k);g[k]=c});
 JSON.stringify(gen(dk,s*7919))===JSON.stringify(P)?0:bad++;P.W<=D[dk].N&&P.H<=D[dk].N&&P.eqs.length>=D[dk].n-2&&P.tiles.length===P.cells.filter(c=>c.h).length?0:bad++;
 P.eqs.forEach(e=>{const[a,o,b,q,z]=e.cs.map(i=>P.cells[i]);ap(o.v,a.v,b.v)!==z.v||q.v!=='='||![a,b,z].every(c=>c.n&&Number.isInteger(c.v)&&c.v>=1&&c.v<=D[dk].max)||e.cs.filter(i=>P.cells[i].h).length>2?bad++:0});
 for(const c of P.cells)for(const [dy,dx] of [[0,1],[1,0]]){if(g[(c.y-dy)+','+(c.x-dx)])continue;let l=1;while(g[(c.y+dy*l)+','+(c.x+dx*l)])l++;l>1&&l!==5?bad++:0}}
console.log(bad?`FAIL ${bad} bad checks in ${n} puzzles`:`PASS ${n} math crossword puzzles valid`);process.exit(bad?1:0);
