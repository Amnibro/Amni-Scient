import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {runFEA} from '../fea.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let pass=0,fail=0;const ok=(c,m,...x)=>{c?pass++:(fail++,console.log('FAIL',m,...x));};
const L=120,D=14,Hh=40,E=200000,F=1000;
const r=await K.build({params:[],features:[{id:'a',type:'box',w:L,d:D,h:Hh,x:L/2}]});const m=K.meshBody(r.body);
const fid=n=>m.faces.findIndex(f=>f.n&&Math.abs(f.n[0]-n[0])+Math.abs(f.n[1]-n[1])+Math.abs(f.n[2]-n[2])<1e-6);
const base={pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,mat:{E,nu:0.3,rho:7850},fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],res:9000};
const t0=Date.now(),R=await runFEA({...base,type:'topo',topo:{keep:0.35,iters:40}},()=>{});
console.log('topo el',R.nEl,'h',R.h.toFixed(2),'iters',R.iters,'vf',R.volFrac,'gray',R.gray,'C0',R.compliance0,'C',R.compliance,'tris',R.skin.idx.length/3,'vol',R.volume.toFixed(0),'of',R.volume0.toFixed(0),'mass',R.mass.toFixed(4),'kept',R.nKept,'ms',Date.now()-t0);
ok(R.type==='topo','type is topo');
ok(Math.abs(R.volFrac-0.35)<0.02,'volume fraction hits the 35% target',R.volFrac);
ok(R.compliance<R.compliance0,'compliance drops from the uniform start',R.compliance0,R.compliance);
ok(R.gray<0.3,'densities settle toward solid or void',R.gray);
ok(R.skin.idx.length>300&&R.skin.idx.length%3===0,'shape mesh has triangles');
ok(R.volume>0,'mesh is closed and faces outward (positive volume)',R.volume);
ok(Math.abs(R.volume/R.volume0-R.volFrac)<0.12,'mesh volume tracks the kept fraction',R.volume/R.volume0);
let mx=-1e9,mn=1e9;for(let i=0;i<R.skin.pos.length;i+=3){mx=Math.max(mx,R.skin.pos[i]);mn=Math.min(mn,R.skin.pos[i]);}
ok(mn<R.h*2&&mx>L-R.h*2,'shape still spans from support to load',mn,mx);
const X=await runFEA({...base,type:'topo',topo:{keep:0.35,iters:12,axis:'Y'}},()=>{});
let spread=0;for(let k=0;k<X.grid.nz;k++)for(let i=0;i<X.grid.nx;i++){const v=[];for(let j=0;j<X.grid.ny;j++){const e=(k*X.grid.ny+j)*X.grid.nx+i,d=X.dens[e];d>0&&d<1&&v.push(d);}if(v.length>1)spread=Math.max(spread,Math.max(...v)-Math.min(...v));}
ok(spread<0.1,'extrusion along Y keeps each line of design elements nearly uniform',spread);
let bad=0;try{await runFEA({...base,type:'topo',loads:[]},()=>{});}catch(e){bad=/load/.test(e.message);}ok(bad,'asks for a load when none is set');
console.log(pass+' passed, '+fail+' failed');process.exitCode=fail?1:0;
