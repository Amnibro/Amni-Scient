import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import * as R from '../vendor/replicad.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const vol=s=>{const p=new oc.GProp_GProps();oc.BRepGProp.VolumeProperties(s.wrapped,p,false,false,false);const m=p.Mass();p.delete();return m;},dpt=(s,p)=>R.measureDistanceBetween(R.makeVertex(p),s),rAt=(s,p)=>dpt(s,p)/(Math.SQRT2-1);
const bar={type:'box',w:100,d:10,h:10},plate={type:'box',w:100,d:60,h:10},boss={type:'cylinder',r:8,h:12,z:10},cyl={type:'cylinder',r:10,h:30},pick=pts=>({by:'pick',pts}),E0=pick([[0,-5,10]]),P0=10000,PB=60000+Math.PI*64*12,PAP=2*Math.PI*(8+2*(10-3*Math.PI)/(12-3*Math.PI))*4*(1-Math.PI/4);
const run=async(fs,opt={})=>{K.resetCache();return K.build({units:'mm',params:[],features:fs.map((f,i)=>({id:'f'+i,...f}))},opt);},msg=r=>JSON.stringify([r.errors,r.warnings,r.warn]);
let bad=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);c||bad++;};
const T=[['variable fillet 1 to 4 along a bar edge',[bar,{type:'fillet',vary:'ends',r:1,r2:4,edges:E0}],P0-(1-Math.PI/4)*700,5,b=>{const a=rAt(b,[-49,-5,10]),c=rAt(b,[49,-5,10]);return Math.abs(Math.min(a,c)-1.03)<0.05&&Math.abs(Math.max(a,c)-3.97)<0.05;}],
['radius points at both ends',[bar,{type:'fillet',vary:'points',r:1,rpts:[[-50,-5,10,2],[50,-5,10,3]],edges:E0}],P0-(1-Math.PI/4)*100*(4+6+9)/3,1.5,b=>Math.abs(rAt(b,[-49,-5,10])-2.01)<0.05&&Math.abs(rAt(b,[49,-5,10])-2.99)<0.05],
['radii along a closed tangent chain',[{type:'extrude',plane:'XY',shapes:[{k:'slot',l:30,h:20}],depth:10},{type:'fillet',vary:'along',r:1,tr:[[0,1],[0.5,3]],edges:{side:'+Z'}}],null,0,b=>vol(b)<Math.PI*100*10+600*10-(1-Math.PI/4)*80*1&&vol(b)>Math.PI*100*10+600*10-(1-Math.PI/4)*80*9],
['fillet between the plate top and the boss',[plate,boss,{type:'fillet',r:2,edges:{by:'between',a:pick([[30,20,10]]),b:{type:'CYLINDER'}}}],PB+PAP,0.05],
['thicken the top face out 2',[plate,{type:'thicken',t:2,faces:pick([[0,10,10]])}],72000,0.01],
['thicken the top face in 2 cuts',[plate,{type:'thicken',t:2,dir:'in',faces:pick([[0,10,10]])}],48000,0.01],
['thicken both ways adds half',[plate,{type:'thicken',t:2,dir:'both',faces:pick([[0,10,10]])}],66000,0.01],
['fill the top of a rounded block flat (G0)',[{type:'box',w:20,d:20,h:20},{type:'fillet',r:3,edges:{dir:'Z'}},{type:'fill',cont:'G0',faces:pick([[0,0,20]])}],8000-4*20*9*(1-Math.PI/4),0.5],
['wrap a 20 x 8 tab onto a cylinder (emboss 1)',[cyl,{type:'wrap',shapes:[{k:'rect',w:20,h:8}],depth:1,face:pick([[10,0,15]])}],Math.PI*100*30+Math.PI*21*(20/(20*Math.PI))*8,0.5],
['wrap a 20 x 8 recess into a cylinder (deboss 1)',[cyl,{type:'wrap',op:'deboss',shapes:[{k:'rect',w:20,h:8}],depth:1,face:pick([[10,0,15]])}],Math.PI*100*30-Math.PI*19*(20/(20*Math.PI))*8,0.5],
['wrap on a flat face (emboss 2)',[plate,{type:'wrap',shapes:[{k:'rect',w:10,h:5}],depth:2,face:pick([[0,10,10]])}],60100,0.01]];
for(const[n,fs,want,tol,chk]of T){const t=performance.now(),r=await run(fs),v=r.body?vol(r.body):NaN,er=(r.errors||[]).map(e=>e.msg||e.message||e).join('; ');ok((want==null||Math.abs(v-want)<=tol+1e-6*want)&&!er&&(!chk||chk(r.body)),n+': '+v.toFixed(2)+(want==null?'':' want '+want.toFixed(2))+' ('+(performance.now()-t).toFixed(0)+' ms)'+(er?' '+er:''));}
const mid=await run([bar,{type:'fillet',vary:'points',r:1,rpts:[[-50,-5,10,2],[0,-5,10,5],[50,-5,10,2]],edges:E0}]);ok(!(mid.errors||[]).length&&/straight line along each edge/.test(msg(mid)),'a radius point in the middle of an edge warns: '+msg(mid).slice(0,160));
const box=R.makeBaseBox(20,20,20),fs=box.faces.map((f,i)=>i===0?f.translate([0,0,0.01]):f),cmp=R.makeCompound(fs),blob=new TextEncoder().encode(R.serializeShape?cmp.serialize():cmp.serialize());
const kn=await run([{type:'import',fmt:'brep',blob:'b'},{type:'knit'}],{blobs:{b:blob}});ok(kn.body&&Math.abs(vol(kn.body)-8000)<5&&!(kn.errors||[]).length,'knit six loose faces with a 0.01 gap into a solid: '+(kn.body?vol(kn.body).toFixed(2):'none')+' '+msg(kn).slice(0,160));
const kb=await run([{type:'import',fmt:'brep',blob:'b'},{type:'knit',gap:0.001}],{blobs:{b:blob}});ok(/stay open/.test(msg(kb)),'a gap over the limit stays open and says so: '+msg(kb).slice(0,160));
const ww=await run([cyl,{type:'wrap',shapes:[{k:'rect',w:70,h:8}],depth:1,face:pick([[10,0,15]])}]);ok(/longer than the way around/.test(msg(ww)),'a profile longer than the circumference is refused');
const t1=await run([plate,{type:'thicken',t:2,faces:pick([])}]);ok(/pick the faces/.test(msg(t1)),'thicken with no faces picked asks for a pick');
const w0=await run([cyl,{type:'wrap',shapes:[{k:'rect',w:20,h:8}],depth:1,faces:pick([])}]);ok(/pick the face to wrap/.test(msg(w0))&&!(w0.errors||[]).length,'wrap with no face picked asks for a pick');
const ti=await run([plate,{type:'thicken',t:2,dir:'in',op:'auto',faces:pick([[0,10,10]])}]);ok(Math.abs(vol(ti.body)-48000)<0.01,'thicken inward on automatic cuts');
const wp=await run([plate,{type:'wrap',shapes:[{k:'rect',w:10,h:5}],depth:2,faces:pick([[40,20,10]])}]),wb=wp.body&&wp.body.boundingBox.bounds;ok(wb&&Math.abs(wb[1][2]-12)<1e-6&&Math.abs(vol(wp.body)-60100)<0.01&&R.measureDistanceBetween(R.makeVertex([40,20,12]),wp.body)<1e-6,'wrap centers the profile on the clicked point');
const sl=await run([{type:'extrude',plane:'XY',shapes:[{k:'slot',l:30,h:20}],depth:10}]);ok(sl.body.faces.length===6&&sl.body.edges.length===12,'a slot is two lines and two arcs (no slivers): '+sl.body.faces.length+' faces '+sl.body.edges.length+' edges');
console.log(bad?bad+' failed':'ALL PASS');process.exit(bad?1:0);
