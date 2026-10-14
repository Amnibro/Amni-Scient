import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {runFEA} from '../fea.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const L=100,b=10,hh=10,E=200000,F=100,I=b*hh**3/12;
const r=await K.build({params:[],features:[{id:'a',type:'box',w:L,d:b,h:hh,x:L/2}]});const m=K.meshBody(r.body);
const fid=n=>m.faces.findIndex(f=>f.n&&Math.abs(f.n[0]-n[0])+Math.abs(f.n[1]-n[1])+Math.abs(f.n[2]-n[2])<1e-6);
const dTheory=F*L**3/(3*E*I)+F*L/(5/6*E/2.6*b*hh),sTheory=F*L*(hh/2)/I;
for(const res of [4000,16000,40000]){
  const t=Date.now(),R=await runFEA({pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,mat:{E,nu:0.3},fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],res},()=>{});
  let tipZ=0,n=0;for(let i=0;i<m.pos.length/3;i++)if(m.pos[3*i]>L-1e-6){tipZ+=R.vDisp[3*i+2];n++;}tipZ/=n;
  console.log('res',res,'el',R.nEl,'h',R.h.toFixed(2),'levels',R.levels,'iters',R.iters,'rel',R.rel.toExponential(1),'ms',R.ms,'tipδ',(-tipZ).toFixed(4),'theory',dTheory.toFixed(4),'err%',((-tipZ/dTheory-1)*100).toFixed(1),'vmP99',R.vmP99.toFixed(1),'σ theory',sTheory.toFixed(1),'applied',R.applied.map(v=>v.toFixed(1)).join(','));
  if(res===40000){ok(Math.abs(-tipZ/dTheory-1)<0.06,'tip deflection within 6%');ok(R.rel<1e-5,'converged');ok(Math.abs(R.applied[2]+F)<1e-6,'load applied');}
}
const R2=await runFEA({pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,mat:{E,nu:0.3},fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],res:16000},()=>{});
const P=await runFEA({pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,mat:{E,nu:0.3},fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],p:1}],res:16000},()=>{});
ok(Math.abs(P.applied[0]+100)<2,'pressure 1 MPa on 100 mm² = -100 N in x: '+P.applied[0].toFixed(2));
console.log(pass+' passed, '+fail+' failed');process.exitCode=fail?1:0;
