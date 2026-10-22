import * as K from '../critters.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const B=K.CRITTER_BUDGET,js=b=>JSON.parse(new TextDecoder().decode(b.subarray(20,20+new DataView(b.buffer,b.byteOffset).getUint32(12,true))));
ok(K.CRITTERS.length===21,'all 21 animals.ron critters exist');
for(const id of K.CRITTERS){[2,1,0].forEach((lv,i)=>{const c=K.critter(id,lv),n=c.g.i.length/3+c.gl.i.length/3,bad=[...c.g.p,...c.gl.p].some(v=>!Number.isFinite(v));ok(!bad&&n<=B[i],`${id} LOD${i} ${n} tris`);});
  const c=K.critter(id,2),zs=c.g.p.filter((_,i)=>i%3===2),h=Math.max(...zs);ok(h>.2&&h<.36&&Math.min(...zs)>-.005,`${id} stands 0.2-0.35 m on the ground (${h.toFixed(3)})`);
  const j=js(K.critterGLB(id));ok(j.skins?.[0]?.joints.length===7&&['idle','happy','held'].every(n=>j.animations.some(a=>a.name===n))&&j.animations.find(a=>a.name==='held').extras.loop,`${id} skinned with idle, happy and looping held clips`);
  ok(j.meshes.every(m=>m.primitives.every(p=>p.attributes.JOINTS_0!==undefined))&&j.meshes.some(m=>m.name===`critter_${id}_LOD0`&&m.extras.hand_held),`${id} meshes skinned and hand_held`);}
for(const id of['phoenix','skeleton_dog'])ok(js(K.critterGLB(id)).meshes.some(m=>m.name===`critter_${id}_glow_LOD0`),`${id} has a glow mesh`);
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
