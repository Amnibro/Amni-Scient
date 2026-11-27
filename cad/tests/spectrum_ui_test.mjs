import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18907,mcp:+process.env.E2E_MCP||18908,width:1440,height:900}),p=E.page,sleep=E.sleep,shots=process.env.SHOTS||null;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const txt=()=>p.evaluate(()=>document.getElementById('tab-sim').textContent),doc=()=>p.evaluate(()=>JSON.parse(JSON.stringify(window.amnicad.API.doc))),built=()=>p.evaluate(()=>window.amnicad.API.waitBuild()).then(()=>sleep(500)),shot=async n=>shots&&await p.screenshot({path:shots+'/'+n+'.png'});
const pick=(s,v)=>p.evaluate((s,v)=>{const e=document.querySelector(s);if(!e)return false;e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));return true;},s,v).then(r=>sleep(400).then(()=>r)),btn=t=>p.evaluate(t=>{const x=[...document.querySelectorAll('#tab-sim button')].find(e=>e.textContent.trim()===t);x&&x.click();return!!x;},t);
const run=async()=>{await p.evaluate(()=>{window.amnicad.S.lastFea=null;document.getElementById('fea-run').click();});await p.waitForFunction(()=>{const S=window.amnicad.S;return S.fea&&S.fea.r&&S.fea.r.type==='spectrum'&&S.lastFea;},{timeout:300000,polling:500});await sleep(900);return p.evaluate(()=>{const r=window.amnicad.S.fea.r;return{uMax:r.uMax,frac:r.massFrac,dir:r.dir,combine:r.combine,n:r.modes.length,f1:r.modes[0].f,warn:r.warnings};});};
try{
  await E.connect();await p.evaluate(()=>window.amnicad.loadDoc({units:'mm',material:'al6061',params:[],features:[{id:'b',type:'box',w:200,d:14,h:7,x:100,z:3.5}],sim:{type:'static',res:9000,supports:[{faces:{side:'-X'},type:'fixed'}]}}));await built();
  await p.evaluate(()=>window.amnicad.API.setTab('sim'));await sleep(500);ok(await pick('#sim-study','spectrum'),'Response spectrum is in the study dropdown');
  const g=await p.evaluate(()=>[...document.querySelectorAll('#sim-study optgroup')].find(o=>o.label==='Dynamics').textContent);ok(/Response spectrum/.test(g),'it sits under Dynamics',g);
  let T=await txt();ok(/Direction/.test(T)&&/ASCE 7 design spectrum/.test(T)&&/SDS/.test(T)&&/SD1/.test(T)&&/TL/.test(T)&&/Combine modes/.test(T)&&/CQC/.test(T)&&/Scale \(Ie \/ R\)/.test(T)&&/Run response spectrum analysis/.test(T)&&/Fixed 1/.test(T),'the setup shows supports, direction, ASCE 7 values, combination and scale',T.slice(0,300));
  ok(!/Mesher/.test(T),'the voxel-only study hides the mesher choice');
  await pick('[data-sp=kind]','table');T=await txt();ok(!!(await p.$('textarea[data-sp=table]'))&&!/SDS/.test(T),'a table spectrum swaps the ASCE 7 values for a rows box');
  await pick('textarea[data-sp=table]','1, 0.2\n10, 1.5\n10000, 1.5');let D=await doc();ok(D.sim.spectrum.table==='1, 0.2\n10, 1.5\n10000, 1.5','the rows are stored with the document',D.sim.spectrum);
  await pick('[data-sp=dir]','Z');await pick('[data-sp=combine]','srss');D=await doc();ok(D.sim.type==='spectrum'&&D.sim.spectrum.dir==='Z'&&D.sim.spectrum.combine==='srss'&&D.sim.spectrum.kind==='table','direction and combination are stored',D.sim.spectrum);
  let r=await run();T=await txt();const w1=2*Math.PI*r.f1;
  ok(r.dir==='Z'&&r.combine==='srss'&&r.n===12&&r.frac>0.9&&Math.abs(r.uMax/(1.566*1.5*9806.65/w1/w1)-1)<0.03,'the run matches the cantilever estimate at 1.5 g',r);
  ok(/Base shear/.test(T)&&/Mass along Z/.test(T)&&/Mode 1/.test(T)&&/ · 1\.5 g · /.test(T)&&/log₁₀ Hz/.test(T)&&/SRSS, damping 0.05/.test(T),'results list base shear, mass share, the mode table and the spectrum curve',T.slice(T.indexOf('Peak'),T.indexOf('Peak')+400));
  ok(await btn('Displacement')&&await btn('Safety')&&await btn('Stress'),'the stress, displacement and safety views switch');await shot('spectrum_result');
  await pick('[data-sp=kind]','asce7');await pick('[data-sp=dir]','X');r=await run();ok(r.warn.length===1&&/at least 90%/.test(r.warn[0])&&/at least 90%/.test(await txt()),'a direction the modes barely move in warns about mass participation',r.warn);
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL exception '+(e.stack||e.message));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
