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
r=await K.build({params:[],features:[{id:'x',type:'box',w:10},{id:'y',type:'fillet',r:20,edges:{by:'all'}},{id:'z',type:'box',w:5,z:10}]});ok(r.errors.length===1&&r.errors[0].id==='y','bad fillet reported, build continues: '+JSON.stringify(r.errors));
try{K.evalExpr('alert(1)',{});ok(false,'reject unknown');}catch{ok(true);}
try{K.evalExpr('w;x=1',{w:1});ok(false,'reject ;');}catch{ok(true);}
near(K.evalExpr('2*w+sin(30)^2',{w:3}),6.25,1e-9,'expr');
console.log(pass+' passed, '+fail+' failed');process.exitCode=fail?1:0;
