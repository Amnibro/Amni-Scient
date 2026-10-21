import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {runStudy} from '../nl_study.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const r=await K.build({params:[],features:[{id:'a',type:'box',w:40,d:40,h:10},{id:'b',type:'box',w:20,d:20,h:10,z:10,op:'new'}]}),m=K.meshBody(r.body);
const fid=(n,zc)=>m.faces.findIndex(f=>f.n&&Math.abs(f.n[0]-n[0])+Math.abs(f.n[1]-n[1])+Math.abs(f.n[2]-n[2])<1e-6&&Math.abs(f.c[2]-zc)<1e-6);
const input={pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,fsolid:m.faces.map(f=>f.solid??0),svol:m.props.solids.map(s=>s.volume)};
ok(m.props.nSolids===2&&input.fsolid.includes(1),'two solids tagged');
const st=(bodies,extra={})=>({kind:'nonlinear',p:{mode:'3d',mat:'al5052',input,res:2500,steps:4,bodies,supports:[{faces:[fid([0,0,-1],0)],type:'fixed'}],loads:[{faces:[fid([0,0,1],20)],F:[0,0,-2000]}],...extra},opt:{}});
for(const b of['bonded','contact']){const t=Date.now(),R=await runStudy(st(b),()=>{});const P=R.post;console.log(b,'reaction',P.reaction.map(v=>v.toFixed(1)).join(','),'uMax',P.uMax.toExponential(3),'contact',JSON.stringify(P.contact),'ms',Date.now()-t);
  ok(Math.abs(P.reaction[2]-2000)/2000<0.03,b+' reaction balances the load');b==='contact'&&ok(P.contact.length>0&&P.contact.some(c=>c.nodes>0&&c.F>1000),b+' bodies press on each other');}
const R2=await runStudy({kind:'nonlinear',p:{mode:'3d',mat:'al5052',input,res:2500,steps:4,bodies:'bonded',supports:[{faces:[fid([0,0,-1],0)],type:'stop',gap:0}],loads:[{faces:[fid([0,0,1],20)],F:[0,0,-2000]}]},opt:{}},()=>{});
console.log('stop',JSON.stringify(R2.post.contact),R2.post.uMax.toExponential(3));ok(R2.post.contact.some(c=>c.name==='stop'&&c.F>1500),'rigid stop carries the load');
console.log(fail?`${fail} failed, ${pass} passed`:`ALL ${pass} PASS`);process.exit(fail?1:0);
