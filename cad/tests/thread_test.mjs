import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {execFileSync} from 'node:child_process';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const STD={M3:[3,0.5],M6:[6,1],M10:[10,1.5],M20:[20,2.5],'#6-32':[0.138,1/32],'1/4-20':[0.25,0.05],'1/2-13':[0.5,1/13]};
const rate=(d,p,ext)=>(ext?0.3197*2*Math.PI*(d/2-0.2373*p):0.2369*2*Math.PI*(d/2-0.5413*p+0.2062*p))*p;
let bad=0,n=0;const t0=performance.now(),only=process.argv[2];
if(!only){for(const k of Object.keys(STD)){try{process.stdout.write(execFileSync(process.execPath,[new URL(import.meta.url).pathname,k],{encoding:'utf8'}));}catch(e){process.stdout.write(String(e.stdout||''));bad++;}}console.log(Object.keys(STD).length+' thread sizes, '+bad+' with failures, '+((performance.now()-t0)/1000).toFixed(0)+' s');process.exit(bad?1:0);}
for(const[std,[d,p]]of Object.entries(STD).filter(([k])=>k===only)){const u=std.startsWith('M')?'mm':'in',H=d*4,cases=[['inset',d,H-2*d],['bottom',0,H*0.6],['top',H*0.4,H*0.6],['through',0,H],['overhang',-d,H+2*d]];
  for(const[nm,z,L]of cases)for(const axis of nm==='through'?['Z','X']:['Z']){n++;K.resetCache();const cyl={id:'a',type:'cylinder',r:d/2,h:H,axis},thr={id:'b',type:'thread',kind:'external',std,length:L,axis,...(axis==='X'?{x:z}:{z})};
    const r0=await K.build({units:u,params:[],features:[cyl]}),v0=K.meshBody(r0.body).props.volume;K.resetCache();const r=await K.build({units:u,params:[],features:[cyl,thr]}),v=r.body&&K.meshBody(r.body).props.volume,want=rate(d,p,true)*(Math.min(H,z+L+p)-Math.max(0,z-p)),e=v==null?1:Math.abs((v0-v)/want-1),ok=!r.errors.length&&e<0.03;if(!ok)bad++;
    console.log((ok?'OK  ':'BAD ')+(std+' ext '+nm+' '+axis).padEnd(28)+' removed '+(v0-(v??v0)).toPrecision(4)+' vs '+want.toPrecision(4)+(r.errors.length?' '+r.errors[0].msg:''));}
  n++;K.resetCache();const W=d*3,T=d*2,minor=d-1.0825*p,base=[{id:'a',type:'box',w:W,d:W,h:T},{id:'h',type:'cylinder',r:minor/2,h:T*2,z:-T/2,op:'cut'}];
  const r0=await K.build({units:u,params:[],features:base}),v0=K.meshBody(r0.body).props.volume;K.resetCache();const r=await K.build({units:u,params:[],features:[...base,{id:'t',type:'thread',kind:'internal',std,length:T,z:0}]}),v=r.body&&K.meshBody(r.body).props.volume,want=rate(d,p,false)*T,e=v==null?1:Math.abs((v0-v)/want-1),ok=!r.errors.length&&e<0.03;if(!ok)bad++;
  console.log((ok?'OK  ':'BAD ')+(std+' int through').padEnd(28)+' removed '+(v0-(v??v0)).toPrecision(4)+' vs '+want.toPrecision(4)+(r.errors.length?' '+r.errors[0].msg:''));}
console.log(only+': '+n+' thread cases, '+bad+' bad, '+((performance.now()-t0)/1000).toFixed(0)+' s');process.exitCode=bad?1:0;
