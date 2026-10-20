import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import * as M from '../mfg_kernel.js';
import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let bad=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)bad++;};
ok(createHash('sha1').update(readFileSync(new URL('../vendor/amni-cam/amni_cam_bg.wasm',import.meta.url))).digest('hex').startsWith(M.CAMV),'the CAM engine URL version matches the vendored wasm, so browsers and Cloudflare fetch the new build');
const near=(a,b,t=0.02)=>Math.abs(a-b)<=t,vn=(a,b,t=1e-3)=>a.every((v,i)=>near(v,b[i],t));
const build=async doc=>{K.resetCache();const r=await K.build(doc);if(r.errors.length)console.log(r.errors);return{body:r.body,doc};};
const blk={name:'Block',units:'mm',params:[],material:'al6061',features:[{id:'a',type:'box',w:80,d:50,h:25},
 {id:'h1',type:'hole',plane:'face',face:{side:'+Z'},d:6.6,thru:true,pts:[[-30,-15]]},
 {id:'h2',type:'hole',plane:'face',face:{side:'+Z'},d:5,thru:false,depth:12,pts:[[30,-15]]},
 {id:'h3',type:'hole',plane:'face',face:{side:'+Z'},std:'M6',fit:'tapped',thru:false,depth:14,pts:[[0,15]]},
 {id:'h4',type:'hole',plane:'face',face:{side:'+Z'},std:'M5',fit:'cbore',thru:true,pts:[[-30,15]]},
 {id:'h5',type:'hole',plane:'face',face:{side:'+Z'},std:'M5',fit:'csink',thru:true,pts:[[30,15]]}]};
const P=await build(blk),H=M.holeList(P);
ok(H.length===5,'five holes found: '+H.length);
const at=(x,y)=>H.find(h=>near(h.p[0],x,0.05)&&near(h.p[1],y,0.05));
const h1=at(-30,-15),h2=at(30,-15),h3=at(0,15),h4=at(-30,15),h5=at(30,15);
ok(h1&&near(h1.dia,6.6)&&h1.thru&&near(h1.depth,25,0.05)&&near(h1.p[2],25,0.05)&&vn(h1.d,[0,0,-1]),'through hole: mouth on top, axis into the part '+JSON.stringify(h1));
ok(h2&&near(h2.dia,5)&&!h2.thru&&!h2.tap&&near(h2.depth,12,0.05)&&vn(h2.d,[0,0,-1]),'blind hole 12 deep: '+JSON.stringify(h2));
ok(h3&&!h3.thru&&h3.tap&&h3.tap.name==='M6'&&near(h3.tap.pitch,1,1e-6)&&near(h3.dia,5,0.05),'M6 tapped hole carries tap '+JSON.stringify(h3&&h3.tap)+' dia '+(h3&&h3.dia));
ok(h4&&h4.thru&&h4.cbore&&near(h4.cbore.dia,10,0.05)&&h4.cbore.depth>2,'M5 counterbore found '+JSON.stringify(h4&&h4.cbore));
ok(h5&&h5.thru&&h5.csink&&h5.csink.dia>5.5&&near(h5.csink.angle,90,2),'M5 countersink found '+JSON.stringify(h5&&h5.csink));
const sd={name:'Side',units:'in',params:[],material:'steel1018',features:[{id:'a',type:'box',w:3,d:2,h:1},{id:'s',type:'hole',plane:'XZ',offset:1,d:0.25,thru:false,depth:0.75,pts:[[0,0.5]]}]};
const J=M.solidJob(P);
const S=await build(sd),Hs=M.holeList(S);
ok(Hs.length===1&&near(Hs[0].dia,6.35,0.05)&&near(Hs[0].depth,19.05,0.1),'side hole in inch part reported in mm: '+JSON.stringify(Hs[0]));
ok(Hs[0]&&Math.abs(Math.abs(Hs[0].d[1])-1)<1e-3&&Math.abs(Hs[0].p[1])>=25.3,'side hole axis along Y, mouth on the face: '+JSON.stringify(Hs[0]&&[Hs[0].p,Hs[0].d]));
ok(J.mesh.v.length>300&&J.mesh.t.length>300&&J.mesh.t.every(i=>i>=0&&i<J.mesh.v.length/3),'mesh welded: '+J.mesh.v.length/3+' verts '+J.mesh.t.length/3+' tris');
ok(vn(J.bbox,[80,50,25],0.01),'bbox mm '+J.bbox.map(v=>+v.toFixed(2)));
const cav=await build({name:'Cav',units:'mm',params:[],features:[{id:'a',type:'box',w:40,d:40,h:20},{id:'b',type:'extrude',plane:'XY',offset:5,depth:10,op:'cut',shapes:[{k:'rect',w:10,h:10}]}]});
ok(M.holeList(cav).length===0,'a rectangular pocket is not a hole');
process.exit(bad?1:0);
