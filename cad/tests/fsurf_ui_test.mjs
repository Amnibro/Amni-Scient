import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const E=await startE2E({web:+process.env.E2E_WEB||18757,mcp:+process.env.E2E_MCP||18758});
const {page,call,T,errs,sleep}=E,ev=(f,...a)=>page.evaluate(f,...a),shots=process.env.SHOTS,click=t=>ev(t=>{const b=[...document.querySelectorAll('#tab-flow button')].filter(b=>b.offsetParent&&b.textContent.trim()===t);b[0]&&b[0].click();return b.length;},t);
const scene=()=>ev(()=>{const A=window.amnicad.API,S=A.S,g=S.fsG,m=g&&g.children[0];return{vis:!!g&&g.visible,tris:m?m.geometry.index.count/3:0,frames:S.fsR?S.fsR.frames.length:0,inModel:!!g&&g.parent===A.model,at:S.fsI|0,thru:S.fsMat?!S.fsMat.depthTest:null};});
try{
  T(await call('apply_actions',{actions:[{new:true,units:'mm'},{add:{type:'box',w:300,d:100,h:200}},{add:{type:'shell',t:4,faces:{side:'+Z'}}}]}));await ev(()=>window.amnicad.API.waitBuild());
  T(await call('apply_actions',{actions:[{flow:{mode:'free',free:{frac:0.5,shake:'accel',dir:'+X',accel:2,t0:0,t1:0.1,time:0.5,res:'quick',frames:17}}}]}));
  const st=await ev(()=>{const A=window.amnicad.API;return{mode:A.flowCfg.mode,fs:A.doc.fsurf};});ok(st.mode==='free'&&st.fs&&st.fs.accel===2&&st.fs.frames===17,'the assistant sets up a free-surface study',st);
  await ev(()=>window.amnicad.API.setTab('flow'));await sleep(700);
  const ui=await ev(()=>{const el=document.querySelector('#tab-flow');return{on:[...el.querySelectorAll('.seg button.on')].map(b=>b.textContent),run:[...el.querySelectorAll('button')].some(b=>b.textContent==='Run free surface'),liquid:[...el.querySelectorAll('select option')].filter(o=>o.selected).map(o=>o.textContent)};});
  ok(ui.on.includes('Free surface')&&ui.on.includes('Accelerate')&&ui.run&&ui.liquid.includes('Water (20 °C)'),'the Flow tab shows the free-surface panel',ui);
  const r=T(await call('run_flow',{free:{time:0.5}}));ok(r.study==='free_surface'&&/^Free-surface/.test(r.note)&&r.liquid_L>1&&r.spill_pct===0&&r.peak_lateral_N>0,'run_flow runs the study and returns its summary',{L:r.liquid_L,lat:r.peak_lateral_N,hz:r.slosh_hz,rect:r.slosh_hz_rect,ms:r.ms});
  await sleep(500);let sc=await scene();ok(sc.vis&&sc.tris>100&&sc.frames===18&&sc.inModel&&sc.at===17,'the liquid surface is drawn in the scene at the last frame',sc);
  const kv=await ev(()=>[...document.querySelectorAll('#tab-flow .kv span')].map(s=>s.textContent));ok(kv.includes('Peak lateral force')&&kv.includes('Slosh frequency')&&kv.some(t=>/lbf \(.*N\)|N \(.*lbf\)/.test(t)),'results list loads in both unit systems',kv.slice(0,12));
  await ev(()=>{const s=document.querySelector('#fs-frame');s.value=0;s.dispatchEvent(new Event('input'));});const s0=await scene();ok(s0.at===0&&s0.tris>100&&s0.tris!==sc.tris,'the frame slider scrubs the motion',[s0.tris,sc.tris]);
  await click('Play');await sleep(900);const s1=await scene();await click('Pause');ok(s1.at>0,'Play animates the frames',s1.at);
  await click('See through walls');sc=await scene();ok(sc.thru===true,'see-through draws the liquid over the walls',sc.thru);
  shots&&await page.screenshot({path:shots+'/fsurf_panel.png'});
  await click('External tunnel');await sleep(400);sc=await scene();ok(!sc.vis,'switching study hides the liquid',sc.vis);
  await ev(()=>{const b=[...document.querySelectorAll('#tab-flow .seg button')].find(b=>b.textContent==='Free surface');b&&b.click();});await sleep(600);sc=await scene();ok(sc.vis,'coming back shows it again',sc.vis);
  const csv=await ev(async()=>(await import(new URL('fsurf.js',location.href).href)).csv(window.amnicad.API.S.fsR).split('\n'));ok(csv[0].startsWith('time_s,liquid_kg,spill_fraction')&&csv.length>20,'CSV has the time series',csv.slice(0,2));
  ok(!errs.length,'no page errors',errs.slice(0,3));
}catch(e){fail++;console.log('FAIL threw '+(e.stack||e));}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
