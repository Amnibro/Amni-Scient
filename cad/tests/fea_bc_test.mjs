import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {runFEA} from '../fea.js';import {runMeshFEA} from '../fea_mesh.js';import {wireOf} from '../fea_skin.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const L=100,b=10,hh=10,E=200000,F=100,I=b*hh**3/12;
const r=await K.build({params:[],features:[{id:'a',type:'box',w:L,d:b,h:hh,x:L/2}]});const m=K.meshBody(r.body);
const fid=n=>m.faces.findIndex(f=>f.n&&Math.abs(f.n[0]-n[0])+Math.abs(f.n[1]-n[1])+Math.abs(f.n[2]-n[2])<1e-6);
const base={pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,mat:{E,nu:0.3},res:16000},root=fid([-1,0,0]),tip=fid([1,0,0]),bot=fid([0,0,-1]),top=fid([0,0,1]);
const tipZ=R=>{let z=0,n=0;for(let i=0;i<m.pos.length/3;i++)if(m.pos[3*i]>L-1e-6){z+=R.vDisp[3*i+2];n++;}return z/n;};
for(const[nm,run,mesh]of[['voxel',runFEA,'voxel'],['sweep',runMeshFEA,'sweep']]){
  const go=o=>run({...base,mesh,...o},()=>{}),R0=await go({supports:[{faces:[root],type:'fixed'}],loads:[{faces:[tip],F:[0,0,-F]}]}),d0=tipZ(R0);
  console.log(nm,'free tip',d0.toFixed(4));ok(d0<0,nm+' free deflects down');
  const R1=await go({supports:[{faces:[root],type:'fixed'},{faces:[tip],type:'disp',d:[null,null,d0]}],loads:[]}),d1=tipZ(R1),h1=R1.held&&R1.held[1];
  console.log(nm,'disp tip',d1.toFixed(4),'held',h1&&h1.map(v=>v.toFixed(2)).join(','));ok(Math.abs(d1/d0-1)<0.02,nm+' prescribed tip matches');ok(h1&&Math.abs(-h1[2]/F-1)<0.08,nm+' reaction to hold it ≈ load');
  const g=Math.abs(d0)*0.4,R2=await go({supports:[{faces:[root],type:'fixed'},{faces:[bot],type:'stop',gap:g}],loads:[{faces:[tip],F:[0,0,-F]}]}),d2=tipZ(R2);
  console.log(nm,'stop tip',d2.toFixed(4),'gap',g.toFixed(4),'contact',JSON.stringify(R2.contact));ok(d2>=-g*1.05&&d2<-g*0.5,nm+' stop limits travel near the gap');ok(R2.contact&&R2.contact.nodes>0&&R2.contact.settled,nm+' contact settled with nodes touching');
  const R3=await go({supports:[{faces:[root],type:'fixed'},{faces:[bot],type:'stop',gap:g}],loads:[{faces:[tip],F:[0,0,F]}]}),d3=tipZ(R3);
  ok(Math.abs(d3/-d0-1)<0.03&&R3.contact.nodes===0,nm+' stop lets go when pulled away');
  const R4=await go({supports:[{faces:[bot],type:'spring',k:2000}],loads:[{faces:[top],F:[0,0,-F]}]}),z4=R4.vDisp.reduce((a,v,i)=>i%3===2?Math.min(a,v):a,0);
  console.log(nm,'spring',z4.toFixed(4),'expect',(-F/2000).toFixed(4));ok(Math.abs(z4/(-F/2000)-1)<0.1,nm+' spring foundation ≈ F/k');
  const e=20,R5=await go({supports:[{faces:[root],type:'fixed'}],loads:[{faces:[tip],F:[0,0,-F],at:[L+e,b/2,hh/2]}]}),d5=tipZ(R5),dM=F*e*L*L/(2*E*I);
  console.log(nm,'remote',d5.toFixed(4),'expect',(d0-dM).toFixed(4));ok(Math.abs((d5-d0)/-dM-1)<0.12,nm+' remote load adds the offset moment');
  const R6=await go({supports:[{faces:[root],type:'fixed'}],loads:[{faces:[tip,top],F:[0,0,-F],dist:'bearing'}]});ok(Math.abs(R6.applied[2]+F)<1e-6*F,nm+' bearing load totals F');
  const M7=await go({meshOnly:true}),sk=M7.wire||M7.skin,seg=wireOf(sk);console.log(nm,'mesh only',M7.nEl,'nodes',sk.pos.length/3,'edges',seg.length/2);ok(M7.type==='mesh'&&seg.length>0&&sk.pos.length>0,nm+' mesh preview has nodes and edges');
  ok((R0.wire||R0.skin).u&&(R0.wire||R0.skin).u.length===(R0.wire||R0.skin).pos.length,nm+' result wire carries displacement');}
console.log(fail?`${fail} failed, ${pass} passed`:`ALL ${pass} PASS`);process.exit(fail?1:0);
