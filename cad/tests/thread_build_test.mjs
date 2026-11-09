import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import {FAMILIES,THREADS,classes,callout} from '../threads.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});
await K.init(oc);
let bad=0;const ok=(c,m,x)=>{c||bad++;console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+x+')':''));};
for(const fam of FAMILIES){
  const t=THREADS.find(x=>x.family===fam.id);
  const u=t.unit,H=Math.max(t.major*3,t.pitch*10,u==='in'?0.6:12),L=H*0.55,z=H*0.15;
  const cls=classes(fam.id,false)[0]||'';
  const thr={id:'b',type:'thread',kind:'external',threadId:t.id,tfamily:t.family,tclass:cls,std:callout(t,{cls}),d:t.major,pitch:t.pitch,length:L,axis:'Z',z,hand:'right'};
  K.resetCache();
  const r=await K.build({units:u,params:[],features:[{id:'a',type:'cylinder',r:t.major/2,h:H},{...thr}]});
  ok(!r.errors.length&&!!r.body,fam.id+' '+t.size+' builds',r.errors[0]&&r.errors[0].msg);
}
console.log(bad?bad+' FAILED':'ALL PASS');
process.exit(bad?1:0);
