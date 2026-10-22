import * as G from '../garden.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const B={0:[1500,700,220],1:[1500,700,220],2:[1500,700,220],3:[1500,700,220]},L=[2,1,0],tri=g=>g.i.length/3,nan=g=>g.p.some(v=>!Number.isFinite(v));
for(let s=0;s<4;s++)L.forEach((lv,k)=>{const t=G.tree(s,lv);ok(tri(t.g)<=B[s][k]&&!nan(t.g),`tree ${s} LOD${k} ${tri(t.g)}`);});
L.forEach((lv,k)=>{ok(tri(G.nest(lv).g)<=[900,370,130][k],'nest LOD'+k);ok(tri(G.trough(lv).g)<=[700,240,90][k],'trough LOD'+k);const q=G.gate(lv);ok(tri(q.g)+tri(q.portal)<=[1200,480,180][k]&&q.uv2.length===q.portal.p.length/3*2,'gate LOD'+k);for(const id of G.FRUITS){const f=G.fruit(id,lv).g;ok(tri(f)<=[300,120,48][k]&&!nan(f),id+' LOD'+k);}});
ok(G.tree(3,2).sock.length===7&&G.tree(2,2).sock.length===3,'young and full trees carry 3 and 7 fruit sockets');
const out=G.gardenGLBs();ok(['trees','nest','trough','gate','fruits'].every(k=>out[k]&&out[k].length>1000),'every garden GLB exports');
const gj=JSON.parse(new TextDecoder().decode(out.gate.subarray(20,20+new DataView(out.gate.buffer,out.gate.byteOffset).getUint32(12,true))));ok(gj.meshes.some(m=>m.name==='gate_portal_LOD0'&&m.primitives[0].attributes.TEXCOORD_1!==undefined)&&gj.materials.length===2,'gate portal is its own mesh and material with polar UVs');
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
