import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const base=[{id:'f1',type:'box',w:80,d:36,h:20},{id:'f2',type:'box',w:40,d:32,h:14,z:20}];let bad=0;
for(const r of[6,3,30,2,6]){const res=await K.build({params:[],features:[...base,{id:'f3',type:'fillet',r,edges:{by:'all'}}]});try{K.meshBody(res.body);}catch(e){bad++;console.log('FAIL r',r,e.message);}console.log('r',r,'errors',res.errors.length,'reused',res.reused);}
const r2=await K.build({params:[],features:[...base,{id:'f3',type:'fillet',r:30,edges:{by:'all'}},{id:'f4',type:'box',w:5,z:40}]});K.meshBody(r2.body);
const r3=await K.build({params:[],features:[...base]});K.meshBody(r3.body);
console.log(bad?'FAILED':'cache ok');process.exitCode=bad;
