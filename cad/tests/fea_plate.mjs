import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import * as F from '../fea.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const L=140,b=60,t=6,E=68900,P=200,I=b*t**3/12,dT=P*L**3/(3*E*I);
const r=await K.build({params:[],features:[{id:'a',type:'box',w:L,d:b,h:t}]});const m=K.meshBody(r.body);
const fid=n=>m.faces.findIndex(f=>f.n&&Math.abs(f.n[0]-n[0])+Math.abs(f.n[1]-n[1])+Math.abs(f.n[2]-n[2])<1e-6);
for(const res of[8000,30000])for(const mg of[true,false]){const t0=Date.now();const R=F.runFEA({pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,mat:{E,nu:0.33},fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[0,0,-P]}],res,mg},()=>{});let tip=0,n=0;for(let i=0;i<m.pos.length/3;i++)if(m.pos[3*i]>L/2-1e-6){tip+=R.vDisp[3*i+2];n++;}console.log('res',res,'mg',mg,'el',R.nEl,'grid',JSON.stringify(R.grid),'lv',R.levels,'it',R.iters,'rel',R.rel.toExponential(1),'ms',Date.now()-t0,'tip',(-tip/n).toFixed(4),'theory',dT.toFixed(4));}
