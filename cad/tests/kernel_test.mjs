import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import {fileURLToPath} from 'url';import path from 'path';
const here=path.dirname(fileURLToPath(import.meta.url));
const oc=await opencascade({locateFile:()=>path.join(here,'../vendor/replicad_single.wasm'),print:()=>{},printErr:()=>{}});await K.init(oc);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};const near=(a,b,r,m)=>ok(Math.abs(a-b)<=Math.abs(b)*r,m+' got '+a+' want '+b);
const doc={params:[{name:'w',expr:'80'},{name:'d',expr:'50'},{name:'t',expr:'10'},{name:'hd',expr:'8.5'}],features:[
{id:'f1',type:'box',w:'w',d:'d',h:'t'},
{id:'f2',type:'hole',face:{side:'+Z'},pts:[['w/2-10','d/2-10'],['-(w/2-10)','d/2-10'],['w/2-10','-(d/2-10)'],['-(w/2-10)','-(d/2-10)']],d:'hd'},
{id:'f3',type:'fillet',r:4,edges:{dir:'Z'}},
{id:'f4',type:'extrude',face:{side:'+Z'},shapes:[{k:'circle',r:12}],depth:20,op:'add'},
{id:'f5',type:'chamfer',d:1,edges:{side:'+Z',type:'CIRCLE'}}]};
let t=performance.now(),r=await K.build(doc);
ok(!r.errors.length,'errors '+JSON.stringify(r.errors));
const m=K.meshBody(r.body);
const V=80*50*10-4*Math.PI*4.25**2*10-(4-Math.PI)*16*10*4/4*1+Math.PI*144*20;
console.log('build ms',(performance.now()-t).toFixed(0),'vol',m.props.volume.toFixed(1),'faces',m.props.nFaces,'tris',m.idx.length/3,'groups',m.groups.length,'faceIdMax',Math.max(...m.groups.map(g=>g[2])));
near(m.props.volume,V-Math.PI*12*1*1+Math.PI*(12*1-1/3)*1*0,0.01,'volume');
ok(m.groups.every(g=>g[2]>=0&&g[2]<m.faces.length)&&new Set(m.groups.map(g=>g[2])).size===m.faces.length,'faceIds index faces');ok(m.egroups.every(g=>g[2]>=0)&&new Set(m.egroups.map(g=>g[2])).size===m.edges.length,'edgeIds index edges');
t=performance.now();doc.features[3].depth=25;r=await K.build(doc);console.log('rebuild reused',r.reused,'ms',r.ms.toFixed(0));ok(r.reused===3,'prefix cache reuse');
const st=K.exportBody(r.body,'step');ok(st.size>1000,'step export '+st.size);
const sl=K.exportBody(r.body,'stl');ok(sl.size>1000,'stl export '+sl.size);
const d2={params:[],features:[{id:'a',type:'cylinder',r:20,h:30},{id:'b',type:'shell',t:2,faces:{side:'+Z'}},{id:'c',type:'cylinder',r:3,h:50,x:10,axis:'Z',op:'cut'},{id:'p',type:'pattern',kind:'circular',of:['c'],n:6,axis:'Z'},{id:'m',type:'revolve',plane:'XZ',shapes:[{k:'rect',x:30,y:5,w:4,h:10}],axis:'y',angle:360},{id:'e',type:'extrude',plane:'XY',shapes:[{k:'path',pts:[[-5,-5],[5,-5],[0,8]]},{k:'slot',x:0,y:-30,l:20,h:6}],depth:4,dir:'-'},{id:'q',type:'cone',r1:6,r2:0,h:10,z:30},{id:'tor',type:'torus',r1:40,r2:2},{id:'mi',type:'mirror',plane:'YZ',offset:0},{id:'ch',type:'hole',plane:'XY',offset:30,pts:[[15,0]],d:4,cb_d:7,cb_h:2,thru:true}]};
r=await K.build(d2);ok(!r.errors.length,'d2 errors '+JSON.stringify(r.errors));const m2=K.meshBody(r.body);console.log('d2 vol',m2.props.volume.toFixed(0),'solids',m2.props.nSolids);
r=await K.build({params:[],features:[{id:'x',type:'box',w:10},{id:'y',type:'fillet',r:20,edges:{by:'all'}},{id:'z',type:'box',w:5,z:10}]});{const w=r.warnings.find(x=>x.id==='y');ok(!r.errors.length&&w&&w.field==='r'&&w.limit>0&&w.limit<5&&w.fix&&w.fix[0].v===w.limit,'too-big fillet is limited with a note, build continues: '+JSON.stringify([r.errors,w]));}
{const B=async(fs,u='in')=>{K.resetCache();return K.build({units:u,params:[],features:fs.map((f,i)=>({id:'c'+i,...f}))});},W=(r,id,fd)=>r.warnings.find(x=>x.id===id&&x.field===fd),V=r=>K.meshBody(r.body).props.volume,rc=r=>(0.75-(4-Math.PI)*r*r)*0.25;
  let r=await B([{type:'extrude',plane:'XY',shapes:[{k:'rect',w:1,h:0.75,r:1}],depth:0.25}]);let w=W(r,'c0','shapes.0.r');ok(!r.errors.length&&w&&w.limit===0.375&&/half the 0\.75 in height/.test(w.note)&&w.fix.length===2&&w.fix[1].also,'rect radius above half the short side is limited with a note and two fixes');near(V(r),rc(0.375),1e-5,'limited radius builds at the noted maximum');
  for(const q of[0.25,0.125]){r=await B([{type:'extrude',plane:'XY',shapes:[{k:'rect',w:1,h:0.75,r:q}],depth:0.25}]);ok(!W(r,'c0','shapes.0.r'),'r='+q+' fits without a note');near(V(r),rc(q),1e-6,'r='+q+' volume is (0.75 − (4 − π)r²) × depth');}
  r=await B([{type:'box',w:4,d:2.5,h:0.25},{type:'hole',plane:'face',face:'top',d:0.25,thru:false,depth:1,pts:[[0,0]]}]);w=W(r,'c1','depth');ok(!r.errors.length&&w&&w.fix.some(x=>x.k==='thru'),'hole deeper than the part is noted with a through-all fix');
  r=await B([{type:'box',w:2,d:2,h:1},{type:'shell',t:5,faces:{side:'+Z'}}]);w=r.warnings.find(x=>x.id==='c1');ok(!r.errors.length&&w&&w.field==='t'&&w.limit>0&&w.limit<1,'too-thick shell is limited to the thickest that works',w&&w.limit);
  r=await B([{type:'box',w:2,d:2,h:1},{type:'chamfer',d:3,edges:{side:'+Z'}}]);w=r.warnings.find(x=>x.id==='c1');ok(!r.errors.length&&w&&w.field==='d'&&w.limit<1,'too-big chamfer is limited with a note',w&&w.limit);
  r=await B([{type:'extrude',plane:'XY',shapes:[{k:'poly',r:1,n:2.4}],depth:1}]);ok(W(r,'c0','shapes.0.n')&&!r.errors.length,'polygon sides are rounded to 3 or more with a note');
  r=await B([{type:'extrude',plane:'XY',shapes:[{k:'ellipse',rx:1,ry:1}],depth:1}]);near(V(r),Math.PI,1e-6,'ellipse 1 × 1 in is a circle of area π');r=await B([{type:'extrude',plane:'XY',shapes:[{k:'ellipse',rx:1,ry:0.5}],depth:1}]);near(V(r),Math.PI/2,1e-6,'ellipse 1 × 0.5 in has area π/2');r=await B([{type:'extrude',plane:'XY',shapes:[{k:'ellipse',rx:0.5,ry:1}],depth:1}]);near(V(r),Math.PI/2,1e-6,'ellipse with ry > rx keeps both radii');
  r=await B([{type:'extrude',plane:'XY',shapes:[{k:'ellipse'}],depth:1}]);ok(r.errors.length===1&&/radius x must be above 0/.test(r.errors[0].msg),'ellipse without radii reports the missing radius instead of guessing a millimeter size');r=await B([{type:'extrude',plane:'XY',shapes:[{k:'ellipse',rx:1}],depth:1}]);near(V(r),Math.PI,1e-6,'ellipse with only rx is a circle');
  {const r2=await B([{type:'box',w:4,d:2.5,h:0.5},{type:'extrude',face:{normal:[0,0,1],at:[0.5,0.3,0.25]},shapes:[{k:'rect',w:1,h:0.5}],depth:0.25}]);near(K.meshBody(r2.body).props.bbox.max[2],0.75,1e-6,'a {normal,at} face reference follows the face when the plate gets thicker');}
  r=await B([{type:'box',w:4,d:2.5,h:0.25},{type:'extrude',face:'top',shapes:[{k:'spline',pts:[[0,0],[1,1],[1,0],[0,1]]}],depth:0.25}]);{const m=K.meshBody(r.body);ok(!r.errors.length&&r.warnings.some(x=>/crosses or touches itself/.test(x.msg))&&[...m.pos].every(isFinite),'self-crossing spline is repaired from its outline with a note and a finite mesh');}
  r=await B([{type:'box',w:4,d:2.5,h:0.25},{type:'extrude',face:'top',shapes:[{k:'spline',pts:[[0,0],[1,0],[1,0],[1,1],[0,1]]}],depth:0.25}]);ok(!r.errors.length&&[...K.meshBody(r.body).pos].every(isFinite),'spline with duplicate points builds');}
try{K.evalExpr('alert(1)',{});ok(false,'reject unknown');}catch{ok(true);}
try{K.evalExpr('w;x=1',{w:1});ok(false,'reject ;');}catch{ok(true);}
near(K.evalExpr('2*w+sin(30)^2',{w:3}),6.25,1e-9,'expr');
console.log(pass+' passed, '+fail+' failed');process.exitCode=fail?1:0;
