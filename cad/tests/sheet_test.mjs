import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import * as R from '../vendor/replicad.js';
import * as MK from '../mfg_kernel.js';
import {flatArea} from '../sheet.js';
import {templatesFor} from '../templates.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const B=async(fs,u='mm',x={})=>{K.resetCache();return K.build({units:u,params:x.params||[],features:fs.map((f,i)=>({id:'f'+(i+1),...f}))});};
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c||fails++;},near=(a,b,tol)=>Math.abs(a-b)<=tol,PI=Math.PI;
const SH=(fl,x={})=>({type:'sheet',plane:'XY',shapes:[{k:'rect',w:100,h:60}],t:2,r:2,flanges:fl,...x});
const bb=s=>s.boundingBox.bounds,fbb=L=>{const P=L.flat();return[Math.min(...P.map(p=>p[0])),Math.min(...P.map(p=>p[1])),Math.max(...P.map(p=>p[0])),Math.max(...P.map(p=>p[1]))];};
{const r=await B([SH([{edge:'front',len:30}])]),s=r.body,v=R.measureVolume(s),an=MK.analyzeBody(s,{units:'mm'}),sh=an.part.sheet,fb=sh&&fbb(sh.loops);
  ok(!r.errors.length&&near(v,100*60*2-100*4*2+PI/4*(16-4)*100+26*2*100,1e-6),'L bracket volume matches the analytic 17342.48 mm3 (got '+v.toFixed(3)+')');
  ok(near(bb(s)[0][1],-30,1e-9)&&near(bb(s)[1][2],30,1e-9),'front flange rises from the front edge to 30 mm outside height');
  ok(an.kind==='bent sheet'&&sh.loops.length===1&&!sh.unfold_error,'unfolds to one closed outline');
  ok(near(fb[2]-fb[0],100,1e-6)&&near(fb[3]-fb[1],56+PI/2*(2+0.4*2)+26,1e-6),'flat is 100 x 86.398 mm (56 base + 4.398 bend at K 0.4 + 26 flange)');
  ok(sh.flat.bends.length===1&&near(sh.flat.bends[0].angle,90,1e-6)&&sh.flat.bends[0].dir==='up'&&near(sh.flat.bends[0].K,0.4,1e-12)&&near(sh.flat.bends[0].len,100,1e-6),'one 90 degree up bend, K 0.4, 100 mm long');
  const d=await MK.dxf({body:s,doc:{units:'mm',material:'al5052'}},{units:'mm'}),L=d.dxf.split('\n'),li=L.indexOf('LINE');
  ok(li>0&&L[li+2]==='BEND_UP'&&near(+L[li+8],26+PI/4*2.8,1e-5)&&L[L.length-2]==='EOF'&&L[L.length-4]==='ENDSEC'&&L[li-1]==='0','DXF has the bend line on layer BEND_UP at 28.199 mm, inside ENTITIES');
  const b=d.bends.rows[0];ok(d.bends.mat==='al5052'&&b.overbend>0&&b.tool_angle>90&&near(b.ba,PI/2*2.8,1e-9)&&near(b.bd,2*4-PI/2*2.8,1e-9)&&b.tons>0&&near(d.bends.die_v,16,1e-9),'bend table: springback overbend, BA, BD, V-die 8t and tonnage');}
{const r=await B([SH([{edge:'all',len:30}])]),s=r.body,an=MK.analyzeBody(s,{units:'mm'}),sh=an.part.sheet,fb=sh&&fbb(sh.loops),BA=PI/2*2.8;
  ok(!r.errors.length&&!r.warnings.length,'box with four flanges builds as one solid with no warnings');
  ok(near(bb(s)[0][0],-50,1e-9)&&near(bb(s)[1][0],50,1e-9)&&near(bb(s)[0][1],-30,1e-9)&&near(bb(s)[1][1],30,1e-9)&&near(bb(s)[1][2],30,1e-9),'box outside is 100 x 60 x 30 mm');
  ok(sh&&sh.loops.length===1&&sh.flat.bends.length===4&&sh.flat.bends.every(b=>b.dir==='up'&&near(b.angle,90,1e-6)),'box unfolds to one outline with four up bends');
  ok(near(fb[2]-fb[0],92+2*(BA+26),1e-6)&&near(fb[3]-fb[1],52+2*(BA+26),1e-6),'box flat is 152.80 x 112.80 mm');
  ok(near(flatArea(sh.loops),R.measureVolume(s)/2,0.015*R.measureVolume(s)/2),'box flat area within 1.5 % of volume / t');
  const v0=R.measureVolume(s),c=await B([SH([{edge:'all',len:30}],{corner:'open'})]);ok(!c.errors.length&&R.measureVolume(c.body)<v0,'open corners leave the corner tabs off');}
{const r=await B([SH([{edge:'back',len:25,dir:'down',then:[{len:12,angle:90}]},{edge:'front',len:20,then:[{len:15,angle:-90}]}])]),s=r.body,sh=MK.analyzeBody(s,{units:'mm'}).part.sheet,bs=sh&&sh.flat&&sh.flat.bends;
  ok(!r.errors.length&&near(bb(s)[0][2],-25+2,1e-6),'down flange with a return builds below the plate');
  ok(bs&&bs.length===4&&bs.filter(b=>b.depth===2).length===2&&bs.filter(b=>b.dir==='down').length===3,'return and Z flanges unfold with four bends (one up, three down), two of them second-level');
  ok(near(flatArea(sh.loops),R.measureVolume(s)/2,0.015*R.measureVolume(s)/2),'return and Z flat area within 1.5 % of volume / t');}
{const r=await B([SH([{edge:'front',len:20,then:[{len:10,angle:180}]}],{r:1})]),s=r.body,sh=MK.analyzeBody(s,{units:'mm'}).part.sheet;
  ok(!r.errors.length&&sh&&sh.flat&&sh.flat.bends.some(b=>near(b.angle,180,1e-3)),'hem (180 degree return) builds and unfolds');}
{const r=await B([SH([{edge:'front',len:30}],{K:0.5})]),sh=MK.analyzeBody(r.body,{units:'mm',features:[{type:'sheet',K:0.5}]}).part.sheet,fb=fbb(sh.loops);
  ok(near(fb[3]-fb[1],56+PI/2*3+26,1e-6),'a K-factor of 0.5 on the feature sets the bend allowance');}
{const r=await B([{type:'sheet',plane:'XY',shapes:[{k:'rect',w:4,h:3},{k:'circle',r:0.25,hole:true}],t:0.06,r:0.06,flanges:[{edge:'right',len:1},{edge:'left',len:1}]}],'in'),s=r.body,an=MK.analyzeBody(s,{units:'in'}),sh=an.part.sheet,d=await MK.dxf({body:s,doc:{units:'in'}},{units:'in'});
  ok(!r.errors.length&&near(bb(s)[1][0]-bb(s)[0][0],4,1e-9)&&near(bb(s)[1][2],1,1e-9),'inch channel is 4 in wide and 1 in tall');
  ok(sh&&sh.loops.length===2&&sh.pierces===2&&d.dxf.includes('$INSUNITS\n70\n1')&&(d.dxf.match(/\nLINE\n/g)||[]).length===2,'inch channel unfolds with its hole and two bend lines in an inch DXF');
  const tp=await MK.toolpath({body:s,doc:{units:'in',material:'al5052'}},{});ok(tp&&!tp.error,'laser toolpath runs on the unfolded channel');}
{const r=await B([SH([{edge:'front',len:3}])]);ok(r.errors.length&&/too short/.test(r.errors[0].msg),'a flange shorter than its bend is refused with a clear message');}
{const r=await B([SH([{edge:'front',len:30},{edge:0,len:20}])]);ok(r.errors.length&&/two flanges/.test(r.errors[0].msg),'two flanges on one edge are refused');}
{const r=await B([SH([{edge:'all',len:30}])]),s0=MK.analyzeBody(r.body,{units:'mm',x:1}).part.sheet,a0=flatArea(s0.loops),buf=new Uint8Array(await r.body.blobSTEP().arrayBuffer()),im=await R.importSTEP(new Blob([buf])),sh=MK.analyzeBody(im,{units:'mm'}).part.sheet;
  ok(sh&&sh.loops.length===1&&near(flatArea(sh.loops),a0,1e-3*a0),'a STEP round trip unfolds to the same flat area');}
{const r=await B([{type:'extrude',plane:'XY',shapes:[{k:'rect',w:50,h:40}],depth:3}]),an=MK.analyzeBody(r.body,{units:'mm'});ok(an.kind==='flat sheet'&&an.part.sheet.loops.length===1&&!an.part.sheet.flat,'flat plates still use the plate outline');}
for(const u of['mm','in'])for(const[key,nb,nl]of[['sheet_enclosure',6,5],['sheet_zbracket',2,2]]){const T=templatesFor(u).find(t=>t.key===key);K.resetCache();const r=await K.build({...T.doc,units:u}),sh=r.body&&MK.analyzeBody(r.body,{units:u,features:T.doc.features}).part.sheet;ok(!r.errors.length&&sh&&sh.flat&&sh.flat.bends.length===nb&&sh.loops.length===nl,'the '+u+' '+T.name+' template builds and unfolds with '+nb+' bends and '+nl+' cut loops');}
{const r=await B([SH([{edge:'all',len:15}],{shapes:[{k:'path',pts:[[-40,-30],[40,-30],[0,40]]}]})]),sh=r.body&&MK.analyzeBody(r.body,{units:'mm'}).part.sheet;ok(!r.errors.length&&sh&&sh.flat.bends.length===3&&near(flatArea(sh.loops),R.measureVolume(r.body)/2,0.015*R.measureVolume(r.body)/2),'a triangle with flanges on all three edges unfolds within 1.5 %');}
{const r=await B([SH([{edge:'front',len:30},{edge:'left',len:30,dir:'down'}])]),sh=r.body&&MK.analyzeBody(r.body,{units:'mm'}).part.sheet;ok(!r.errors.length&&sh&&sh.flat.bends.length===2&&sh.flat.bends.some(b=>b.dir==='down')&&sh.flat.bends.some(b=>b.dir==='up'),'an up flange next to a down flange builds and unfolds');}
{const P=async ax=>{const r=await B([{type:'box',w:60,d:10,h:40},{type:'hole',plane:ax==='z'?'XY':'XZ',offset:ax==='z'?40:5,pts:[[0,ax==='z'?0:20]],d:4,thru:true}]);return MK.analyzeBody(r.body,{units:'mm'});},a=await P('z'),b=await P('y');ok(!a.plate&&!(a.part.sheet&&a.part.sheet.loops.length),'a thick profile with a hole across it is not a laser plate');ok(!!(b.plate||b.part.sheet&&b.part.sheet.loops.length),'the same profile with its hole along the plate normal still cuts flat');}
{const H=fl=>({name:'H',units:'mm',params:[],features:[{id:'s',type:'sheet',plane:'XY',shapes:[{k:'rect',w:100,h:70}],t:1.5,r:1.5,dir:'+',flanges:fl,K:0,corner:'open',gap:0.25}]}),G=async fl=>{K.resetCache();const r=await K.build(H(fl));return r.errors.length?null:MK.analyzeBody(r.body,{units:'mm'});},b=await G([{edge:'front',len:10,angle:180,dir:'up'}]);ok(b&&b.part.sheet&&b.part.sheet.bends===1&&b.part.sheet.loops.length===1,'a closed 180 degree hem at the edge unfolds');}
console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);
