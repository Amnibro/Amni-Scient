import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import * as M from '../mfg_kernel.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let bad=0,n=0;const ok=(c,m)=>{n++;console.log((c?'PASS ':'FAIL ')+m);c||bad++;};
const build=async d=>{K.resetCache();return K.build(d);};
{const doc={name:'L',units:'mm',material:'steel1018',params:[],features:[{id:'f1',type:'box',w:40,d:30,h:1.5,x:20},{id:'f2',type:'box',w:1.5,d:30,h:40,x:0.75},{id:'f3',type:'fillet',r:1.5,edges:{by:'pick',pts:[[1.5,0,1.5]]}},{id:'f4',type:'fillet',r:3,edges:{by:'pick',pts:[[0,0,0]]}}]},r=await build(doc),a=M.analyzeBody(r.body,doc);
ok(a.kind==='bent sheet'&&a.part.sheet.bends===1&&Math.abs(a.part.sheet.t-1.5)<1e-3,'B2 filleted L bracket is detected as bent sheet (t=1.5 mm, 1 bend): '+a.kind);
const q=await M.quote({body:r.body,doc},{req:{material:'steel-cr',qty:10}});ok(q.kind==='bent sheet'&&q.res.ok,'B2 bent sheet quotes');}
{const sph={name:'S',units:'mm',material:'steel1018',params:[],features:[{id:'f1',type:'sphere',r:20}]},r=await build(sph),q=async(mat,req={})=>(await M.quote({body:r.body,doc:{...sph,material:mat}},{req:{qty:25,...req}})).res;
ok((await q('steel1018')).material==='st1018','B3 steel 1018 solid quotes in st1018, not aluminum');ok((await q('walnut')).material==='ply-bb','B3 woods map to plywood stock');ok((await q('d2')).material==='st4140','B3 tool steels map to 4140 stock');
for(const k of['cfrp','fiberglass','carbide']){const x=await q(k);ok(!x.ok&&x.no_stock&&!x.quotes.length&&/no stock/.test(x.errors[0]),'B3 '+k+' says there is no shop stock');}
ok((await q('cfrp',{material:'al6061'})).ok,'B3 an explicit material override still quotes');
const bad=await q('steel1018',{material:'steel-cr'});ok(!bad.ok&&bad.errors.length&&bad.try.length,'B3 a sheet material on a solid explains why and offers alternatives');}
{const box=u=>({name:'B',units:u,params:[],features:[{id:'f1',type:'box',w:u==='in'?2:50.8,d:u==='in'?1:25.4,h:u==='in'?0.5:12.7}]}),file=async u=>{K.resetCache();const r=await K.build(box(u));return new Uint8Array(await K.exportBody(r.body,'step',u).arrayBuffer());},imp=async(u,data)=>{K.resetCache();const r=await K.build({name:'I',units:u,params:[],features:[{id:'f1',type:'import',fmt:'step',blob:'b'}]},{blobs:{b:data}});return{r,b:r.body.boundingBox.bounds};},dims=b=>b.map(i=>b[1]).length&&[0,1,2].map(i=>+(b[1][i]-b[0][i]).toFixed(3));
const fin=await file('in'),fmm=await file('mm');
let x=await imp('mm',fin);ok(JSON.stringify(dims(x.b))==='[50.8,25.4,12.7]','B4 inch STEP into a mm document is scaled to mm: '+dims(x.b));
x=await imp('in',fmm);ok(JSON.stringify(dims(x.b))==='[2,1,0.5]','B4 mm STEP into an inch document is scaled to inches: '+dims(x.b));
x=await imp('mm',fmm);ok(JSON.stringify(dims(x.b))==='[50.8,25.4,12.7]','B4 a mm export made after an inch export is still mm: '+dims(x.b));
x=await imp('in',fin);ok(JSON.stringify(dims(x.b))==='[2,1,0.5]','B4 same-unit import is unchanged: '+dims(x.b));}
console.log(`${n-bad}/${n} passed`);process.exit(bad?1:0);
