import * as M from '../ambient.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const js=b=>JSON.parse(new TextDecoder().decode(b.subarray(20,20+new DataView(b.buffer,b.byteOffset).getUint32(12,true))));
ok(M.AMBIENT.join()==='bird,butterfly,fish','bird, butterfly and fish exist');
for(const k of M.AMBIENT){[2,1,0].forEach((lv,i)=>{const g=M.ambient(k,lv).g,n=g.i.length/3;ok(n>0&&n<=M.AMBIENT_BUDGET[i]&&g.p.every(Number.isFinite),`${k} LOD${i} ${n} tris`);});
  const g=M.ambient(k,2).g;let mx=0;for(let i=0;i<g.p.length;i+=3)mx=Math.max(mx,Math.hypot(g.p[i],g.p[i+1],g.p[i+2]));ok(mx>.02&&mx<.1,`${k} is ambient-sized (${mx.toFixed(3)} m)`);
  const j=js(M.ambientGLB(k));ok(j.skins?.[0]&&j.animations.length>=2&&j.animations.every(a=>a.channels.length>0)&&j.meshes.every(m=>m.primitives.every(p=>p.attributes.JOINTS_0!==undefined)),`${k} skinned with clips`);}
ok(js(M.ambientGLB('butterfly')).animations.some(a=>a.name==='flap'&&a.extras?.loop),'butterfly flap loops');
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
