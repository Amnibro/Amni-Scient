import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import * as M from '../mfg_kernel.js';import {wallThickness} from '../fea.js';import {TEMPLATES_IN} from '../templates.js';import * as R from '../vendor/replicad.js';import {MATS} from '../schema.js';import {THERMAL,KCOND,condK} from '../thermal_data.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let bad=0,n=0;const ok=(c,m)=>{n++;console.log((c?'PASS ':'FAIL ')+m);c||bad++;};
const R_vol=b=>Math.abs(R.measureVolume(b));const build=async d=>{K.resetCache();return K.build(d);};
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
{const miss=Object.keys(MATS).filter(k=>!(THERMAL[k]&&THERMAL[k].k>0&&THERMAL[k].cp>0&&THERMAL[k].cte>0&&THERMAL[k].src&&MATS[k].k===THERMAL[k].k));ok(!miss.length&&Object.keys(THERMAL).length===Object.keys(MATS).length,'B7 every material has cited k, cp and CTE: '+miss);
ok(condK(null,'walnut').k<0.2&&condK(null,'steel1018').k===51.9&&condK({k:3},'x').k===3&&!condK(null,'walnut').warn,'B7 walnut conducts about 1000x less than aluminum: '+condK(null,'walnut').k);
const w=condK(null,'mystery');ok(w.k===167&&/No thermal conductivity/.test(w.warn),'B7 an unknown material gives an explicit warning, not a silent aluminum value');}
{const h={name:'H',units:'in',params:[],features:[{id:'f1',type:'hole',plane:'XY',d:0.25,thru:true,pts:[[0,0]]}]},r=await build(h);ok(r.errors.length===1&&/hole needs a body/.test(r.errors[0].msg)&&!r.body,'B9 a hole with no body reports an error instead of a solid pin: '+(r.errors[0]&&r.errors[0].msg));
const s2=await build({...h,features:[{id:'f0',type:'box',w:1,d:1,h:0.5,suppressed:true},...h.features]});ok(s2.errors.some(e=>/hole needs a body/.test(e.msg)),'B9 a suppressed base feature gives the same error');
const s3=await build({...h,features:[{id:'f0',type:'box',w:1,d:1,h:0.5},{id:'f1',type:'hole',plane:'XY',offset:0.5,d:0.25,thru:true,pts:[[0,0]]}]});ok(!s3.errors.length&&Math.abs(R_vol(s3.body)-(0.5-Math.PI*0.125**2*0.5))<1e-3,'B9 a hole in a body still cuts');}
{const t=JSON.parse(JSON.stringify(TEMPLATES_IN.find(x=>x.key==='bracket').doc)),r=await build(t),m=K.meshBody(r.body),w=wallThickness({pos:m.pos,idx:m.idx,bbox:m.props.bbox,volume:m.props.volume,res:80000});ok(w.minT>0.1875*0.85&&w.minT<0.1875*1.15,'B13 L-bracket (t = 0.1875 in) wall measures within 15 percent, not twice the thickness: '+w.minT.toFixed(4)+' in');}
{const pl=ct=>({name:'P',units:'in',params:[],features:[{id:'f1',type:'box',w:2,d:1,h:0.25},{id:'f2',type:'hole',plane:'XY',offset:0.25,std:'1/4',fit:'cbore',thru:true,pts:[[0,0]],...ct}]}),r2=await build(pl({std:undefined,d:0.25,cb_d:0.438,cb_h:0.5}));
ok(r2.warnings.some(w=>/counterbore/.test(w.msg)&&/not shallower/.test(w.msg)),'B14 a counterbore deeper than the plate warns: '+(r2.warnings[0]&&r2.warnings[0].msg.slice(0,60)));
const cyl=b=>b.faces.filter(f=>f.geomType==='CYLINDRE').map(f=>+(f.boundingBox.bounds[1][0]-f.boundingBox.bounds[0][0]).toFixed(3)).sort();
ok(JSON.stringify(cyl(r2.body))==='[0.25,0.438]','B14 both the through hole and the counterbore diameters are kept: '+cyl(r2.body));}
console.log(`${n-bad}/${n} passed`);process.exit(bad?1:0);
