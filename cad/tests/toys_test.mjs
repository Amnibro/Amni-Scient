import * as Y from '../toys.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const tri=g=>g.i.length/3,bad=g=>g.p.some(v=>!Number.isFinite(v)),B=Y.TOY_BUDGET,grp=k=>k==='swing_seat'?'swing':k==='kite_tail'?'kite':k;
[2,1,0].forEach((lv,i)=>{const sum={};for(const k of Y.TOYS){const g=Y.toy(k,lv).g;ok(!bad(g)&&g.i.every(v=>v<g.p.length/3),`toy ${k} LOD${i} geometry`);sum[grp(k)]=(sum[grp(k)]||0)+tri(g);}for(const[k,n]of Object.entries(sum))ok(n<=B[i],`toy ${k} LOD${i} ${n}>${B[i]}`);});
const vol=g=>{let v=0;for(let t=0;t<g.i.length;t+=3){const a=g.i[t],b=g.i[t+1],c=g.i[t+2],P=k=>[g.p[3*k],g.p[3*k+1],g.p[3*k+2]],[x,y,z]=[P(a),P(b),P(c)];v+=x[0]*(y[1]*z[2]-y[2]*z[1])-x[1]*(y[0]*z[2]-y[2]*z[0])+x[2]*(y[0]*z[1]-y[1]*z[0]);}return v/6;};
for(const k of Y.TOYS.filter(k=>!['kite','kite_tail','slide'].includes(k)))ok(vol(Y.toy(k,2).g)>0,`toy ${k} faces point outward`);
ok(Y.toy('ball',2).g.p.every((v,i)=>i%3!==2||v>=-1e-6),'toys rest on the ground plane');
const b=Y.toysGLB(),j=JSON.parse(new TextDecoder().decode(b.subarray(20,20+new DataView(b.buffer,b.byteOffset).getUint32(12,true))));ok(j.meshes.length===Y.TOYS.length*3&&j.meshes.some(m=>m.name==='toy_swing_seat_LOD0'&&m.extras.pivot),'toys GLB has every toy at 3 LODs and pivots');
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
