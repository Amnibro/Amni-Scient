import {peekE,gapSolve,submit,status,airfoilExample} from '../ehd.js';
import {discover,setVar,METRICS} from '../optimize.js';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const MU=2.155e-4,R=1.016e-4,fail=[];
const eq=(c,m)=>{if(!c)fail.push(m);};
const rel=(a,b)=>Math.abs(a-b)/Math.max(Math.abs(b),1e-15);
function peek(){
  const e=peekE(R),want=3.1e6*(1+0.0308/Math.sqrt(R));
  eq(rel(e,want)<1e-12,'Peek field '+e+' vs '+want);
  const off=gapSolve({voltage:5000,gap:0.03,radius:R,span:0.4});
  eq(Math.abs(off.von-e*R*Math.log(2*0.03/R))<1,'onset '+off.von);
  eq(!off.on&&off.thrust===0&&off.current===0&&off.eSurf<e,'no thrust below Peek onset');
  const on=gapSolve({voltage:off.von*1.007,gap:0.03,radius:R,span:0.4});
  eq(on.on&&on.thrust>0&&on.current>0,'thrust starts above onset');
}
function thrustVoltage(){
  const d=0.03,g=v=>gapSolve({voltage:v,gap:d,radius:R,span:0.4}),a=g(15000),b=g(20000),von=a.von;
  const ratio=b.thrust/a.thrust,quad=(20000*(20000-von))/(15000*(15000-von));
  eq(b.thrust>a.thrust,'thrust rises with voltage');
  eq(rel(ratio,quad)<0.15,'thrust vs V(V-V0) within 15% (Masuyama & Barrett 2013 fig. 5): '+ratio.toFixed(3)+' vs '+quad.toFixed(3));
  eq(rel(b.thrust/b.current,d/MU)<0.07,'thrust per amp within 7% of d/μ, the dry-air line that bounds their d≤11 cm wire-cylinder data');
}
function thrustPower(){
  const mu=MU,d=0.03,b=gapSolve({voltage:20000,gap:d,radius:R,span:0.4});
  eq(rel(b.tp,d/(mu*20000)*1000)<0.07,'3 cm thrust/power within 7% of d/(μV), equation (2.6)');
  const wide=gapSolve({voltage:1,gap:0.21,radius:R,span:0.4});
  const near=gapSolve({voltage:wide.von*1.007,gap:0.21,radius:R,span:0.4});
  const hi=gapSolve({voltage:40000,gap:0.21,radius:R,span:0.4});
  eq(rel(near.tp,110)<0.25,'21 cm near-onset thrust/power '+near.tp.toFixed(1)+' N/kW within 25% of the published 110 N/kW peak');
  eq(near.tp>hi.tp,'thrust/power falls as voltage and thrust rise, as in their figure 7');
  eq(near.tp>d&&hi.tp>0,'finite');
}
function kaptzov(){
  const e=peekE(R),on=gapSolve({voltage:20000,gap:0.03,radius:R,span:0.4}),off=gapSolve({voltage:5000,gap:0.03,radius:R,span:0.4});
  eq(rel(on.eSurf,e)<1e-9,'Kaptsov holds the emitter surface at Peek\'s field');
  eq(rel(on.grad,e)<0.15,'the potential drop at the emitter is within 15% of that field');
  eq(off.eSurf<e&&off.thrust===0,'below onset the surface field stays under Peek and no charge is injected');
}
function grid(){
  const o={voltage:20000,gap:0.03,radius:R,span:0.4},a=gapSolve({...o,n:70}),b=gapSolve({...o,n:140});
  eq(rel(a.thrust,b.thrust)<0.07,'thrust changes '+(rel(a.thrust,b.thrust)*100).toFixed(2)+'% when the radial grid doubles from 70 to 140, under 7%');
}
async function bits(){
  const {runCFD}=await import('../cfd.js');
  const p=Float32Array.from([0,0,0,10,0,0,10,10,0,0,10,0,0,0,10,10,0,10,10,10,10,0,10,10]);
  const idx=Uint32Array.from([0,1,2,0,2,3,4,5,6,4,6,7,0,1,5,0,5,4,2,3,7,2,7,6,0,3,7,0,7,4,1,2,6,1,6,5]);
  const base={pos:p,idx,bbox:{min:[0,0,0],max:[10,10,10]},cells:900,dir:'+X',fluid:'air',speed:5,gpu:false,yield:false,flows:0.25,wall:'bb',live:false};
  const a=await runCFD(base),z=new Float32Array(a.cells*3),b=await runCFD({...base,force:z});
  const same=(x,y)=>{if(!x||!y||x.length!==y.length)return false;for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;return true;};
  eq(same(a.vel,b.vel)&&same(a.cp,b.cp)&&same(a.sp,b.sp)&&a.cd===b.cd&&a.cl===b.cl&&a.drag===b.drag,'zero body force matches the unmodified lattice byte for byte');
  const tiny=new Float32Array(a.cells*3),big=new Float32Array(a.cells*3);
  for(let i=0;i<a.cells;i++){tiny[3*i]=1e-8;big[3*i]=2e-4;}
  const opt={...base,wall:'bb',flows:0.4};
  const lo=await runCFD({...opt,force:tiny}),hi=await runCFD({...opt,force:big});
  let slo=0,shi=0;for(let i=0;i<lo.vel.length;i+=3){slo+=lo.vel[i];shi+=hi.vel[i];}
  eq(shi>slo,'Guo forcing from the body-force field raises streamwise speed, and wall drag stays in frc');
  eq(lo.frc&&hi.frc&&lo.frc.length===a.cells*3,'frc remains the wall-drag array');
}
async function api(){
  const ex=airfoilExample();
  eq(ex.features[0].shapes[0].chord===120&&ex.features.filter(f=>/^Emitter /.test(f.name||'')).length===7,'12 cm airfoil with a row of 7 emitters');
  const vars=discover(ex,{});
  const ids=vars.map(v=>v.id);
  eq(ids.includes('gap')&&ids.includes('radius')&&(ids.includes('ehd.voltage')||ids.includes('voltage')),'optimizer variables include gap, emitter radius and voltage: '+ids.join(','));
  eq(METRICS.thrust&&METRICS.tw&&METRICS.tp&&METRICS.cl,'thrust, thrust/weight, thrust/power and Cl are metrics');
  const doc=JSON.parse(JSON.stringify(ex));
  setVar(doc,vars.find(v=>v.ehd==='voltage'||v.p==='voltage'),15000);
  eq(+doc.ehd.voltage===15000||+((doc.params.find(q=>q.name==='voltage')||{}).expr)===15000,'voltage variable writes back');
  const sync=await submit({ehd:{voltage:20000,gap:30,radius:0.1016,span:0.4},query:{i:7,j:7},export:'json'});
  eq(sync.thrust_N>0&&sync.query&&Number.isFinite(sync.query.phi)&&sync.file&&sync.file.text.includes('thrust_N'),'synchronous job returns query and export');
  const asyncJob=await submit({async:true,ehd:{voltage:20000,gap:30,radius:0.1016,span:0.4},query:{i:7,j:7},export:'csv'});
  eq(asyncJob.job&&asyncJob.status==='running','async returns a job id');
  let s=status(asyncJob);for(let i=0;i<70&&s.status==='running';i++){await new Promise(r=>setTimeout(r,70));s=status({id:asyncJob.job});}
  eq(s.status==='done'&&s.result&&s.result.file&&s.result.file.text.startsWith('x_m,y_m,phi_V'),'status resolves the async job and the CSV export');
  const path='/tmp/ehd-job.json';
  fs.writeFileSync(path,JSON.stringify({ehd:{voltage:20000,gap:30,radius:0.1016,span:0.4},export:'vtk'}));
  const cli=spawnSync(process.execPath,['cad/ehd_job.mjs',path],{cwd:new URL('../..',import.meta.url).pathname,encoding:'utf8'});
  eq(cli.status===0&&cli.stdout.includes('thrust_N')&&cli.stdout.includes('SCALARS phi'),'ehd_job.mjs prints the VTK export: '+(cli.stderr||'').slice(0,180));
}
const tests=[['Peek onset',peek],['Thrust vs voltage',thrustVoltage],['Thrust/power',thrustPower],['Kaptsov injection',kaptzov],['Grid convergence',grid],['Zero-force lattice',bits],['Headless job',api]];
for(const [name,fn] of tests){try{await fn();console.log('PASS',name);}catch(e){fail.push(name+': '+(e&&e.stack||e));console.log('FAIL',name,e&&e.message);}}
if(fail.length){console.log(fail.join('\n'));process.exit(1);}
console.log('7 tests passed');
