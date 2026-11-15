import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import {defaults,featureDocs,FT} from '../schema.js';
import {fileURLToPath} from 'url';
import path from 'path';
const here=path.dirname(fileURLToPath(import.meta.url));
const oc=await opencascade({locateFile:()=>path.join(here,'../vendor/replicad_single.wasm'),print:()=>{},printErr:()=>{}});
await K.init(oc);
let pass=0,fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const near=(a,b,r,m)=>ok(Math.abs(a-b)<=Math.max(Math.abs(b)*r,1e-6),m+' got '+a+' want '+b);
const B=async(fs,u='mm')=>{K.resetCache();return K.build({units:u,params:[],features:fs.map((f,i)=>({id:'f'+(i+1),...f}))});};
const mesh=r=>K.meshBody(r.body);
const VOL=r=>mesh(r).props.volume;
const BB=r=>mesh(r).props.bbox;
const tubeVol=(od,id,h)=>Math.PI/4*(od*od-id*id)*h;
const err=(r,re)=>r.errors.length===1&&re.test(r.errors[0].msg)&&!r.body;

{const od=20,id=12,h=30,want=tubeVol(od,id,h);
  const r=await B([{type:'tube',od,di:id,h,mode:'id'}]);
  ok(!r.errors.length,'id-mode tube builds '+JSON.stringify(r.errors));
  const vr=VOL(r),b=BB(r);
  near(vr,want,1e-6,'id-mode volume is pi/4*(od^2-id^2)*h');
  near(b.max[2]-b.min[2],h,1e-6,'length along Z');near(b.max[0]-b.min[0],od,1e-6,'outer diameter on X');near(b.max[1]-b.min[1],od,1e-6,'outer diameter on Y');
  const w=await B([{type:'tube',od,t:(od-id)/2,h,mode:'wall'}]);
  ok(!w.errors.length,'wall-mode tube builds '+JSON.stringify(w.errors));
  const vw=VOL(w);
  near(vw,want,1e-6,'wall thickness (od-id)/2 matches the inner-diameter volume');
  near(vw,vr,1e-9,'wall mode and id mode are the same solid');
  const bare=await B([{type:'tube',od,di:id,h}]);
  near(VOL(bare),want,1e-6,'omitted mode with only the inner diameter uses id mode');
  const asId=await B([{type:'tube',od,id,h}]);
  near(VOL(asId),want,1e-6,'a numeric id is the inner diameter');
  const asStr=await B([{type:'tube',od,id:String(id),h}]);
  near(VOL(asStr),want,1e-6,'a numeric string id is the inner diameter');
  const wallOnly=await B([{type:'tube',od,t:4,h}]);
  near(VOL(wallOnly),want,1e-6,'omitted mode with only t uses the wall thickness');
  const d=defaults('tube');
  ok(d.type==='tube'&&d.mode==='id'&&d.od===20&&d.di===12&&d.t===4&&d.h===20&&d.op==='add','tube defaults sit next to the cylinder fields');
  const dr=await B([d]);
  near(VOL(dr),tubeVol(20,12,20),1e-6,'default tube builds');
  ok(FT.tube&&FT.tube.g==='Solid'&&/tube:/.test(featureDocs())&&/od/.test(featureDocs())&&/wall/.test(FT.tube.doc),'tube is registered as a solid with od, id and wall documented');
}
for(const axis of ['X','Y','Z']){
  const od=20,id=10,h=30,r=await B([{type:'tube',od,di:id,h,axis,mode:'id'}]);
  ok(!r.errors.length,axis+' tube builds '+JSON.stringify(r.errors));
  near(VOL(r),tubeVol(od,id,h),1e-6,axis+' volume');
  const b=BB(r),i=axis==='X'?0:axis==='Y'?1:2,span=k=>b.max[k]-b.min[k];
  near(span(i),h,1e-6,axis+' length follows the axis');
  near(span((i+1)%3),od,1e-6,axis+' outer size on the first cross axis');
  near(span((i+2)%3),od,1e-6,axis+' outer size on the second cross axis');
  const box={type:'box',w:80,d:80,h:80},at=axis==='Z'?{z:28}:{[axis.toLowerCase()]:-12,z:40};
  const cut=await B([box,{type:'tube',od,di:id,h:24,axis,mode:'id',op:'cut',...at}]);
  ok(!cut.errors.length,axis+' cut builds '+JSON.stringify(cut.errors));
  near(VOL(cut),80*80*80-tubeVol(od,id,24),1e-5,axis+' op cut removes the tube wall and leaves the bore');
}
{const od=20,id=12,h=30,tube=await B([{type:'tube',od,di:id,h,mode:'id',x:5,y:-4,z:2}]),tv=VOL(tube),tb=BB(tube);
  const hole=await B([{type:'cylinder',r:od/2,h,x:5,y:-4,z:2},{type:'hole',plane:'XY',offset:2+h,pts:[[5,-4]],d:id,thru:true}]);
  ok(!hole.errors.length,'cylinder plus through hole builds '+JSON.stringify(hole.errors));
  near(tv,VOL(hole),1e-5,'tube matches a cylinder with a through hole');
  const hb=BB(hole);
  for(let i=0;i<3;i++){near(tb.min[i],hb.min[i],1e-5,'bbox min '+i+' matches the holed cylinder');near(tb.max[i],hb.max[i],1e-5,'bbox max '+i+' matches the holed cylinder');}
  const ex=await B([{type:'extrude',plane:'XY',offset:2,shapes:[{k:'circle',x:5,y:-4,r:od/2},{k:'circle',x:5,y:-4,r:id/2,hole:true}],depth:h}]);
  ok(!ex.errors.length,'concentric-circle extrude builds '+JSON.stringify(ex.errors));
  near(tv,VOL(ex),1e-5,'tube matches a concentric-circle sketch extrude');
  const eb=BB(ex);for(let i=0;i<3;i++){near(tb.min[i],eb.min[i],1e-5,'extrude bbox min '+i);near(tb.max[i],eb.max[i],1e-5,'extrude bbox max '+i);}
  const c=await B([{type:'tube',od:20,id:10,h:30,axis:'Y',center:true,x:4,y:2,z:-3,mode:'id'}]),b=BB(c);
  near(b.min[0],4-10,1e-6,'centered tube outer min X');near(b.max[0],4+10,1e-6,'centered tube outer max X');
  near(b.min[1],2-15,1e-6,'centered tube starts half a length before Y');near(b.max[1],2+15,1e-6,'centered tube ends half a length after Y');
  near(b.min[2],-3-10,1e-6,'centered tube outer min Z');near(b.max[2],-3+10,1e-6,'centered tube outer max Z');
}
for(const[name,f,re]of[
  ['id equal to od',{type:'tube',od:20,di:20,h:10},/inner diameter .* must be less than the outer diameter/],
  ['id larger than od',{type:'tube',od:20,di:21,h:10},/inner diameter .* must be less than the outer diameter/],
  ['id not positive',{type:'tube',od:20,di:0,h:10},/inner diameter must be above 0/],
  ['wall equal to half',{type:'tube',od:20,t:10,h:10,mode:'wall'},/wall thickness .* must be less than half the outer diameter/],
  ['wall thicker than half',{type:'tube',od:20,t:12,h:10,mode:'wall'},/wall thickness .* must be less than half the outer diameter/],
  ['wall not positive',{type:'tube',od:20,t:0,h:10,mode:'wall'},/wall thickness must be above 0/],
  ['outer diameter not positive',{type:'tube',od:0,id:5,h:10},/outer diameter must be above 0/],
  ['length not positive',{type:'tube',od:20,id:10,h:-5},/length must be above 0/],
  ['both bores and no mode',{type:'tube',od:20,di:10,t:3,h:10},/inner diameter and wall thickness are both set/],
  ['unknown bore mode',{type:'tube',od:20,id:10,h:10,mode:'both'},/bore mode must be/]
]){const r=await B([f]);ok(err(r,re),name+' is rejected: '+(r.errors[0]&&r.errors[0].msg||JSON.stringify(r.errors)));}
{const straight=await B([{type:'sweep',path:[[0,0,0],[0,0,40]],bend:0,shapes:[{k:'circle',r:10},{k:'circle',r:6,hole:true}]}]);
  ok(!straight.errors.length,'a holed profile sweeps '+JSON.stringify(straight.errors));
  near(VOL(straight),Math.PI*(100-36)*40,1e-4,'straight hollow sweep volume is the pipe');
  const L=60+5*Math.PI,bent=await B([{type:'sweep',path:[[0,0,0],[0,0,40],[40,0,40]],bend:10,shapes:[{k:'circle',r:8},{k:'circle',r:4,hole:true}]}]);
  ok(!bent.errors.length,'a holed profile sweeps around a bend '+JSON.stringify(bent.errors));
  near(VOL(bent),Math.PI*(64-16)*L,2e-3,'bent hollow sweep volume follows the centerline');
  const rect=await B([{type:'sweep',path:[[0,0,0],[50,0,0]],bend:0,shapes:[{k:'rect',w:16,h:10},{k:'circle',r:3,hole:true}]}]);
  ok(!rect.errors.length,'a rectangle with a round hole sweeps '+JSON.stringify(rect.errors));
  near(VOL(rect),(160-9*Math.PI)*50,1e-4,'swept rectangle-minus-hole volume');
  const solid=await B([{type:'sweep',path:[[0,0,0],[0,0,40],[30,0,40]],bend:8,shapes:[{k:'circle',r:4}]}]);
  ok(!solid.errors.length,'a profile without a hole still sweeps '+JSON.stringify(solid.errors));
  ok(VOL(solid)>Math.PI*16*50,'solid sweep is still a filled pipe');
}
console.log(pass+' passed, '+fail+' failed');
process.exitCode=fail?1:0;
