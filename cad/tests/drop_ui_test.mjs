import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18917,mcp:+process.env.E2E_MCP||18918,width:1440,height:900}),p=E.page,sleep=E.sleep,shots=process.env.SHOTS||null;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const txt=()=>p.evaluate(()=>document.getElementById('tab-sim').textContent),doc=()=>p.evaluate(()=>JSON.parse(JSON.stringify(window.amnicad.API.doc))),built=()=>p.evaluate(()=>window.amnicad.API.waitBuild()).then(()=>sleep(500)),shot=async n=>shots&&await p.screenshot({path:shots+'/'+n+'.png'});
const pick=(s,v)=>p.evaluate((s,v)=>{const e=document.querySelector(s);if(!e)return false;e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));return true;},s,v).then(r=>sleep(400).then(()=>r)),btn=t=>p.evaluate(t=>{const x=[...document.querySelectorAll('#tab-sim button')].find(e=>e.textContent.trim()===t);x&&x.click();return!!x;},t);
const fld=(lab,v)=>p.evaluate((lab,v)=>{const f=[...document.querySelectorAll('#tab-sim .fld')].find(x=>(x.querySelector('label')||{}).textContent===lab),i=f&&f.querySelector('input');if(!i)return false;i.value=v;i.dispatchEvent(new Event('change',{bubbles:true}));return true;},lab,v).then(r=>sleep(400).then(()=>r));
const run=async()=>{await p.evaluate(()=>{window.amnicad.S.lastFea=null;document.getElementById('fea-run').click();});await p.waitForFunction(()=>{const S=window.amnicad.S;return S.fea&&S.fea.r&&S.fea.r.type==='drop'&&S.lastFea;},{timeout:300000,polling:500});await sleep(900);return p.evaluate(()=>{const r=window.amnicad.S.fea.r;return{tc:r.contactTime,e:r.restitution,F:r.peakForce,vIn:r.vIn,dir:r.drop.label,n:r.hist.length,warn:r.warnings};});};
try{
  await E.connect();await p.evaluate(()=>window.amnicad.loadDoc({units:'mm',material:'al6061',params:[],features:[{id:'r',type:'box',w:10,d:10,h:100,z:50}],sim:{type:'static',res:4000}}));await built();
  await p.evaluate(()=>window.amnicad.API.setTab('sim'));await sleep(500);ok(await pick('#sim-study','drop'),'Drop test is in the study dropdown');
  const g=await p.evaluate(()=>[...document.querySelectorAll('#sim-study optgroup')].find(o=>o.label==='Dynamics').textContent);ok(/Drop test/.test(g),'it sits under Dynamics',g);
  let T=await txt();ok(/Drop height/.test(T)&&/Flat on the bottom/.test(T)&&/On a corner/.test(T)&&/Run time/.test(T)&&/Run drop test analysis/.test(T)&&!/Mesher/.test(T)&&!/Fixed 1/.test(T),'the setup asks for height, landing and run time, with no supports or mesher',T.slice(0,300));
  await pick('[data-dp=dir]','corner');let D=await doc();ok(JSON.stringify(D.sim.drop.dir)==='[-1,-1,-1]','a corner landing stores a direction vector',D.sim.drop);
  ok(await p.evaluate(()=>document.querySelector('[data-dp=dir]').value==='corner'),'the stored vector shows as the corner choice');await pick('[data-dp=dir]','-Z');
  const hu=await p.evaluate(()=>{const f=[...document.querySelectorAll('#tab-sim .fld')].find(x=>(x.querySelector('label')||{}).textContent==='Drop height');return f.querySelector('.ex span').textContent.trim();});ok(await fld('Drop height',String(hu==='in'?500/25.4:hu==='m'?0.5:500)),'the drop height is editable in the shown unit',hu);D=await doc();ok(Math.abs(D.sim.drop.height-500)<1e-3&&D.sim.drop.dir==='-Z','height and landing are stored',D.sim.drop);
  const r=await run(),v=Math.sqrt(2*9806.65*500)/1000;T=await txt();ok(Math.abs(r.vIn/v-1)<1e-6&&r.dir==='-Z'&&r.e>0.9&&r.n>20,'the run drops from 500 mm and bounces back',r);
  ok(/Survives the drop/.test(T)&&/Peak floor force/.test(T)&&/g average/.test(T)&&/Contact time/.test(T)&&/restitution/.test(T)&&/Time \(ms\)/.test(T)&&/Energy balance/.test(T),'results show force, deceleration, contact time, rebound and the force history',T.slice(T.indexOf('Survives'),T.indexOf('Survives')+300));
  ok(await btn('Deformation')&&await btn('Safety')&&await btn('Stress'),'the stress, deformation and safety views switch');await shot('drop_result');
  await fld('Run time (0 = until it bounces)','0.01');D=await doc();ok(Math.abs(D.sim.drop.duration-1e-5)<1e-12,'a run time is stored in seconds',D.sim.drop);
  const r2=await run();ok(r2.warn.length===1&&/still touching/.test(r2.warn[0])&&/still touching/.test(await txt()),'stopping during contact warns',r2.warn);
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL exception '+(e.stack||e.message));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
