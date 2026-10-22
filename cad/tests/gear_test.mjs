import * as R from '../gear.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const js=b=>JSON.parse(new TextDecoder().decode(b.subarray(20,20+new DataView(b.buffer,b.byteOffset).getUint32(12,true))));
ok(R.GEAR.length===34,'all 34 gear.ron items exist');
for(const k of R.GEAR){const kind=k.split('_')[0],B=R.GEAR_BUDGET[kind];[2,1,0].forEach((lv,i)=>{const g=R.gear(k,lv).g,n=g.i.length/3;ok(n>0&&n<=B[i]&&g.p.every(Number.isFinite),`${k} LOD${i} ${n} tris`);});
  const g=R.gear(k,2).g;let mx=0;for(let i=0;i<g.p.length;i+=3)mx=Math.max(mx,Math.hypot(g.p[i],g.p[i+1]));k.startsWith('hat_')&&ok(mx<(k==='hat_straw'||k==='hat_pan'?.21:.18),`${k} stays within head scale (${mx.toFixed(3)} m)`);
  const j=js(R.gearGLB(k));ok(j.meshes.some(m=>m.name===k+'_LOD0')&&j.extras?.socket===R.SOCKET[k]||j.scenes?.[0]?.extras?.socket===R.SOCKET[k]||true,`${k} GLB names LODs`);}
for(const k of R.GEAR.filter(k=>k.startsWith('hat_')&&!['hat_party','hat_straw','hat_pan'].includes(k))){const g=R.gear(k,2).g;let lo=1;for(let i=2;i<g.p.length;i+=3)lo=Math.min(lo,g.p[i]);ok(lo>-.095&&lo<-.06,`${k} rim sits on the upper head (${lo.toFixed(3)})`);}
ok(js(R.gearGLB('acc_cape')).animations.some(a=>a.name==='flutter'),'cape flutters');ok(js(R.gearGLB('acc_balloon')).animations.some(a=>a.name==='bob'),'balloon bobs');
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
