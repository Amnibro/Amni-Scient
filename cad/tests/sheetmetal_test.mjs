// Sheet metal first real test: bend allowance and deduction sweep, unfold/refold round trip, hems, units, and what the kernel does with a real bent part.
import {bendAllow,bendDeduct,setback,kFactor,blankDev,stampingDie} from '../dies_press.js';
import opencascade from '../vendor/replicad_single.js';import * as KN from '../kernel.js';import * as M from '../mfg_kernel.js';
let bad=0,n=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));c||bad++;},near=(a,b,e=1e-9)=>Math.abs(a-b)<=e*Math.max(1,Math.abs(b));
const rad=d=>d*Math.PI/180;
// 1. BA = angle_rad * (R + K*T) over thicknesses, radii, K factors and angles
const TS=[0.5,0.8,1,1.5,2,3,4.76,6.35],RT=[0.25,0.5,1,1.5,2,3,5,8],KS=[0,0.25,0.33,0.4,0.446,0.5],AS=[1,15,30,45,60,90,105,120,135,150,165,175,179.5,180];let worst=0,cnt=0;
for(const T of TS)for(const rt of RT)for(const K of KS)for(const A of AS){const R=rt*T,ba=bendAllow(R,T,A,K),ref=rad(A)*(R+K*T);worst=Math.max(worst,Math.abs(ba-ref)/ref||0);cnt++;}
ok(worst<1e-12,'BA = angle_rad x (R + K x T) for '+cnt+' combinations of 8 thicknesses, 8 R/T ratios, 6 K factors and 14 angles','max rel err '+worst.toExponential(2));
let defK=0;for(const T of TS)for(const rt of RT)for(const A of AS){const R=rt*T,K=rt<1?0.33:rt<3?0.4:0.5;defK=Math.max(defK,Math.abs(bendAllow(R,T,A)-rad(A)*(R+K*T)));}
ok(defK<1e-12&&kFactor(1,1)===0.4&&kFactor(2.999,1)===0.4&&kFactor(3,1)===0.5&&kFactor(0.999,1)===0.33,'default K follows the published R/T rule: 0.33 under 1T, 0.40 under 3T, 0.50 from 3T');
const jump=bendAllow(1,1,90)-bendAllow(0.9999,1,90);ok(jump>0.1,'the default K rule steps at R = T: a 90 deg bend in 1 mm stock gains '+jump.toFixed(3)+' mm going from R 0.9999 to 1.0 (finding, see BUGS.md)');
// 2. BD = 2 x OSSB - BA, positive and monotonic; 180 deg hems finite
let bdBad=[];for(const T of TS)for(const rt of RT)for(const A of AS){const R=rt*T,bd=bendDeduct(R,T,A),os=setback(R,T,A);if(!(isFinite(bd)&&near(bd,2*os-bendAllow(R,T,A),1e-12)))bdBad.push([T,rt,A,bd]);}
ok(bdBad.length===0,'BD = 2 x outside setback - BA, finite for every case including 180 deg',bdBad.slice(0,3));
let neg=[];for(const T of TS)for(const rt of RT)for(const A of AS.filter(a=>a>=1&&a<180)){const R=rt*T;if(bendDeduct(R,T,A,0.5)<-1e-12)neg.push([T,rt,A]);}
ok(neg.length===0,'BD is never negative below 180 deg, even at K = 0.5',neg.slice(0,3));
ok(near(setback(1,1,180),2)&&near(bendDeduct(1,1,180,0.4),4-Math.PI*1.4),'a 180 deg hem measures legs to the outside tangent: BD = 2(R+T) - pi(R+KT)',bendDeduct(1,1,180,0.4).toFixed(4));
// 3. Hand-checked reference values
ok(near(bendAllow(0.062,0.062,90),Math.PI/2*(0.062+0.4*0.062),1e-12)&&near(bendDeduct(0.062,0.062,90),2*0.124-Math.PI/2*0.0868,1e-12),'1/16 in 5052 at R = T, 90 deg: BA 0.1363 in, BD 0.1117 in',[bendAllow(0.062,0.062,90).toFixed(4),bendDeduct(0.062,0.062,90).toFixed(4)]);
ok(near(bendAllow(2,2,90,0.44),Math.PI/2*2.88,1e-12)&&near(bendDeduct(2,2,90,0.44),8-Math.PI/2*2.88,1e-12),'2 mm steel, R 2, K 0.44, 90 deg: BA 4.524 mm, BD 3.476 mm',[bendAllow(2,2,90,0.44).toFixed(3),bendDeduct(2,2,90,0.44).toFixed(3)]);
// 4. Unfold / refold round trip through blankDev
const cases=[{legs:[1,1.5],angles:[90],t:0.06,r:0.06},{legs:[1,2,1],angles:[90,90],t:0.125,r:0.0625},{legs:[0.75,1.25,0.75,0.5],angles:[45,135,90],t:0.048,r:0.1},{legs:[1,0.5],angles:[180],t:0.04,r:0.02},{legs:[2,2],angles:[30],t:0.25,r:0.75,k:0.42}];
for(const c of cases){const b=blankDev({type:'bracket',width:1,...c}),d=b.dev;
  const flats=c.legs.map((L,i)=>L-(i>0?d.setback[i-1]:0)-(i<c.angles.length?d.setback[i]:0)),flat=flats.reduce((a,b)=>a+b,0)+d.bendAllow.reduce((a,b)=>a+b,0);
  const refold=flats.map((f,i)=>f+(i>0?d.setback[i-1]:0)+(i<c.angles.length?d.setback[i]:0));
  ok(flats.every(f=>f>0)&&near(flat,d.length,1e-3)&&refold.every((L,i)=>near(L,c.legs[i],1e-9))&&near(b.w,d.length,1e-3),'unfold then refold '+c.legs.join('/')+' in with '+c.angles.join('/')+' deg bends, t '+c.t+', R '+c.r+(c.k?', K '+c.k:''),'flat '+d.length.toFixed(4)+' in, K '+d.K);}
// 5. Units
const bi=blankDev({type:'bracket',legs:[1,1.5],angles:[90],t:0.05,r:0.05,width:1}),bm=blankDev({type:'bracket',units:'mm',legs:[25.4,38.1],angles:[90],t:1.27,r:1.27,width:25.4});
ok(near(bi.dev.length,bm.dev.length,1e-9)&&near(bi.w,bm.w,1e-9),'a bracket in mm develops to the same blank as the inch bracket',bi.dev.length);
const dm=blankDev({units:'mm',type:'bracket'}),di=blankDev({type:'bracket'});ok(near(dm.t,di.t)&&near(dm.dev.length,di.dev.length),'defaults are the same in mm and inch documents (were scaled down 25.4x)',dm.t);
ok(near(blankDev({units:'mm',w:50,h:20}).w,50/25.4),'mm rectangle blank in inches');
for(const [lab,s] of [['181 deg',{legs:[1,1],angles:[181]}],['0 deg',{legs:[1,1],angles:[0]}],['missing angle',{legs:[1,1,1],angles:[90]}],['legs too short',{legs:[0.02,0.02],angles:[90],t:0.06,r:0.2}]]){let e=null;try{blankDev({type:'bracket',...s});}catch(x){e=x.message;}ok(!!e,'bad bracket input is rejected: '+lab,e);}
// 6. Flat blank through the stamping pipeline
const sd=stampingDie({material:'al5052',t:0.062,blank:{type:'bracket',legs:[1,2,1],angles:[90,90],r:0.062,width:1.5,holes:[[0.5,0.75,0.25]]},forms:[{angle:90,r:0.062},{angle:90,r:0.062}]});
ok(near(sd.blank.w,4-2*bendDeduct(0.062,0.062,90),1e-3)&&sd.stations.filter(s=>s.kind==='bend').length===2,'stamping die uses the developed blank and two bend stations',sd.blank.w.toFixed(4));
// 7. A real bent part in the kernel: 60 x 40 base, 30 mm flange, 2 mm sheet, inside R 1
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await KN.init(oc);
const T=2,R=1,W=40,A=60,B=30,L={name:'L bracket',units:'mm',params:[],material:'al5052',features:[{id:'a',type:'box',w:A,d:W,h:T},{id:'b',type:'box',w:T,d:W,h:B,x:A/2-T/2},{id:'o',type:'fillet',edges:{by:'pick',pts:[[A/2,0,0]]},r:R+T},{id:'i',type:'fillet',edges:{by:'pick',pts:[[A/2-T,0,T]]},r:R}]};
KN.resetCache();const r=await KN.build(L);ok(!r.errors.length&&r.body,'the kernel builds a bent L bracket from boxes and fillets',r.errors);
const q=await M.quote({body:r.body,doc:L},{req:{material:'al5052',qty:10}}),sh=q.part.sheet;ok(q.kind==='bent sheet'&&sh&&sh.bends===1&&near(sh.t,T,1e-3),'the analyzer sees bent sheet, 1 bend, t 2 mm',{kind:q.kind,bends:sh&&sh.bends,t:sh&&sh.t});
const dev=(A+B-bendDeduct(R,T,90,0.5))*W;ok(sh&&near(sh.blank,dev,2e-3),'the quoted blank area matches the developed blank at K 0.5 (mid-plane)',sh&&[sh.blank.toFixed(1),dev.toFixed(1)]);
const dK=(A+B-bendDeduct(R,T,90))*W;ok(true,'with the default K '+kFactor(R,T)+' the developed blank is '+dK.toFixed(1)+' mm²; the quote uses mid-plane area, '+((sh.blank-dK)/dK*100).toFixed(2)+' % larger (info)');
let de=null;try{await M.dxf({body:r.body,doc:L},{units:'mm'});}catch(e){de=e.message;}ok(/flat patterns of bent parts are not generated yet/i.test(de||''),'flat DXF of a bent part is refused with a clear message, not a wrong outline',de);
let te=null;try{const tp=await M.toolpath({body:r.body,doc:L},{job:{units:'mm'}});te=tp.ok?'ok':(tp.errors||[]).join('; ');}catch(e){te=e.message;}ok(te!=='ok','no toolpath is made for a bent part from its 3D shape',te);
console.log(bad?bad+' FAILED':'ALL PASS');process.exit(bad?1:0);
