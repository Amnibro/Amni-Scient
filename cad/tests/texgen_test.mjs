import {texgen,TEXGEN,TEXGEN_KINDS} from '../texgen.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const N=64,col=(a,x,y)=>a[4*(y*N+x)],dif=(a,f)=>{let s=0;for(let i=0;i<N;i++)s+=Math.abs(f(i));return s/N;};
ok(TEXGEN_KINDS.length>=20&&TEXGEN_KINDS.every(k=>TEXGEN[k].name),'surface catalog has names');
for(const k of TEXGEN_KINDS){const g=texgen(k,{size:N,seed:7}),b=texgen(k,{size:N,seed:7}),c=texgen(k,{size:N,seed:8});
  ok(g.w===N&&g.color.length===N*N*4&&g.normal.length===N*N*4&&g.orm.length===N*N*4&&g.height.every(Number.isFinite),`${k} maps sized and finite`);
  ok(g.color.every((v,i)=>v===b.color[i]),`${k} deterministic`);ok(TEXGEN_KINDS.includes(k)&&(k==='fabric'||k==='metal'||g.color.some((v,i)=>v!==c.color[i])),`${k} seed changes it`);
  const H=g.height,h=(x,y)=>H[(y%N)*N+(x%N)],seam=dif(H,i=>h(N-1,i)-h(0,i)),body=Math.max(...Array.from({length:N-1},(_,x)=>dif(H,i=>h(x,i)-h(x+1,i)))),seamV=dif(H,i=>h(i,N-1)-h(i,0)),bodyV=Math.max(...Array.from({length:N-1},(_,y)=>dif(H,i=>h(i,y)-h(i,y+1))));
  ok(seam<=body*1.2+.01&&seamV<=bodyV*1.2+.01,`${k} tiles seamlessly (${seam.toFixed(3)} vs ${body.toFixed(3)})`);
  let bad=0;for(let i=0;i<N*N;i++){const x=(g.normal[4*i]-128)/127,y=(g.normal[4*i+1]-128)/127,z=(g.normal[4*i+2]-128)/127;Math.abs(Math.hypot(x,y,z)-1)>.05&&bad++;z<0&&bad++;}ok(!bad,`${k} unit normals facing out`);
  ok(g.orm.every((v,i)=>i%4!==3||v===255),`${k} orm opaque`);}
ok(texgen('metal',{size:16}).orm[2]===255&&texgen('grass',{size:16}).orm[2]===0,'metal map only on metal');
const t=texgen('grass',{size:16,tint:'#ff0000'});ok(t.color[1]===0&&t.color[2]===0,'tint multiplies');
let thr=0;try{texgen('nope');}catch{thr=1;}ok(thr,'unknown surface throws');
const big=texgen('rock',{size:32,bump:3}),sm=texgen('rock',{size:32,bump:.5}),flat=a=>a.normal.filter((v,i)=>i%4===2).reduce((s,v)=>s+v,0);ok(flat(big)<flat(sm),'bump scales normals');
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
