import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import * as M from '../mfg_kernel.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let bad=0,n=0;const ok=(c,m)=>{n++;console.log((c?'PASS ':'FAIL ')+m);c||bad++;};
const build=async d=>{K.resetCache();return K.build(d);};
{const doc={name:'L',units:'mm',material:'steel1018',params:[],features:[{id:'f1',type:'box',w:40,d:30,h:1.5,x:20},{id:'f2',type:'box',w:1.5,d:30,h:40,x:0.75},{id:'f3',type:'fillet',r:1.5,edges:{by:'pick',pts:[[1.5,0,1.5]]}},{id:'f4',type:'fillet',r:3,edges:{by:'pick',pts:[[0,0,0]]}}]},r=await build(doc),a=M.analyzeBody(r.body,doc);
ok(a.kind==='bent sheet'&&a.part.sheet.bends===1&&Math.abs(a.part.sheet.t-1.5)<1e-3,'B2 filleted L bracket is detected as bent sheet (t=1.5 mm, 1 bend): '+a.kind);
const q=await M.quote({body:r.body,doc},{req:{material:'steel-cr',qty:10}});ok(q.kind==='bent sheet'&&q.res.ok,'B2 bent sheet quotes');}
console.log(`${n-bad}/${n} passed`);process.exit(bad?1:0);
