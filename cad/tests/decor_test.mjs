import * as D from '../decor.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const bad=g=>g.p.some(v=>!Number.isFinite(v))||g.i.some(v=>v>=g.p.length/3),tri=g=>g.i.length/3,grp=k=>k.replace(/_fronds$|_bells$/,'');
for(const[set,ids]of Object.entries(D.DECOR))[2,1,0].forEach((lv,i)=>{const sum={};for(const k of ids){const d=D.decor(`${set}_${k}`,lv);ok(!bad(d.g)&&!bad(d.gl),`${set}_${k} LOD${i} geometry`);sum[grp(k)]=(sum[grp(k)]||0)+tri(d.g)+tri(d.gl);}for(const[k,n]of Object.entries(sum))ok(n<=D.DECOR_BUDGET[set][i],`${set}_${k} LOD${i} ${n}>${D.DECOR_BUDGET[set][i]}`);});
const vol=g=>{let v=0;for(let t=0;t<g.i.length;t+=3){const P=k=>[g.p[3*k],g.p[3*k+1],g.p[3*k+2]],[x,y,z]=[P(g.i[t]),P(g.i[t+1]),P(g.i[t+2])];v+=x[0]*(y[1]*z[2]-y[2]*z[1])-x[1]*(y[0]*z[2]-y[2]*z[0])+x[2]*(y[0]*z[1]-y[1]*z[0]);}return v;};
for(const k of['dawn_column','dawn_lantern','dusk_basalt','dusk_crystal','coral_branch','sky_islet','sky_cloud_round'])ok(vol(D.decor(k,2).g)>0,`${k} faces point outward`);
const G=D.decorGLBs(),js=b=>JSON.parse(new TextDecoder().decode(b.subarray(20,20+new DataView(b.buffer,b.byteOffset).getUint32(12,true))));
for(const[set,b]of Object.entries(G)){const j=js(b);ok(j.meshes.every(m=>/^decor_[a-z_]+_LOD[012]$/.test(m.name)),`${set} mesh names`);}
const dj=js(G.dusk);ok(dj.meshes.some(m=>m.name==='decor_dusk_crystal_glow_LOD0'&&dj.materials[m.primitives[0].material].name==='garden_glow'&&dj.materials[m.primitives[0].material].emissiveTexture),'glow meshes use the emissive palette material');
for(const[r,clip,nb]of[['coral_palm','sway',23],['sky_chime','swing',4]]){const j=js(G[r]);ok(j.skins?.[0]?.joints.length===nb&&j.animations?.some(an=>an.name===clip&&an.extras.loop)&&j.meshes.every(m=>m.primitives.every(q=>q.attributes.JOINTS_0!==undefined&&q.attributes.WEIGHTS_0!==undefined)),`${r} is skinned with ${nb} joints and loops ${clip}`);}
const pf=D.decor('coral_palm_fronds',2).g;ok(pf.bw.length===7,'each palm frond carries its own three-bone weights');
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
