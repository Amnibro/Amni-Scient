import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const E=await startE2E({web:+process.env.E2E_WEB||18735,mcp:+process.env.E2E_MCP||18736});
const {page,call,T,errs,sleep}=E,ev=(f,...a)=>page.evaluate(f,...a),wb=async()=>{await sleep(150);await ev(()=>window.amnicad.API.waitBuild());await sleep(250);},act=async a=>{const r=T(await call('apply_actions',{actions:a}));await wb();return r;},shots=process.env.SHOTS;
const panel=()=>ev(()=>({labels:[...document.querySelectorAll('#tab-edit label')].map(l=>l.textContent),sel:[...document.querySelectorAll('#tab-edit select')].map(x=>[...x.options].map(o=>o.textContent).join('/')),rows:document.querySelectorAll('#tab-edit .ptrow').length,f:window.amnicad.API.doc.features.find(x=>x.id===window.amnicad.API.active)}));
try{
  await act([{new:true,units:'mm'},{add:{type:'box',w:100,d:10,h:10}},{add:{type:'fillet',r:1,edges:{by:'pick',pts:[[0,-5,10]]}}}]);
  await ev(()=>{const A=window.amnicad.API;A.active=A.doc.features[1].id;});await sleep(300);let p=await panel();
  ok(p.labels.includes('Radius varies')&&p.sel.some(s=>/Along the edge chain/.test(s))&&!p.labels.includes('End radius'),'fillet shows a Radius varies choice and hides the extra fields',p.labels);
  await ev(()=>{const s=[...document.querySelectorAll('#tab-edit select')].find(x=>[...x.options].some(o=>o.value==='along'));s.value='along';s.dispatchEvent(new Event('change',{bubbles:true}));});await wb();
  await ev(()=>{[...document.querySelectorAll('#tab-edit button')].find(b=>b.textContent==='+ Point').click();});await wb();await ev(()=>{[...document.querySelectorAll('#tab-edit button')].find(b=>b.textContent==='+ Point').click();});await wb();p=await panel();
  ok(p.f.vary==='along'&&JSON.stringify(p.f.tr)==='[[0,1],[0.25,1]]'&&p.rows===2,'Along adds radius rows starting at the chain start',p.f.tr);
  await act([{set:{id:p.f.id,tr:[[0,1],[1,4]]}}]);const st=T(await call('get_state'));
  ok(!st.errors.length&&Math.abs(st.mass_properties.volume_mm3-(1e4-(1-Math.PI/4)*700))<5,'the variable fillet from 1 to 4 builds in the page',[st.errors,st.mass_properties.volume_mm3]);
  shots&&await page.screenshot({path:shots+'/vfillet_panel.png'});
  await ev(()=>{const s=[...document.querySelectorAll('#tab-edit select')].find(x=>[...x.options].some(o=>o.value==='between'));s.value='between';s.dispatchEvent(new Event('change',{bubbles:true}));});await wb();p=await panel();
  ok(p.f.edges.by==='between'&&p.f.edges.a&&p.f.edges.b&&(await ev(()=>[...document.querySelectorAll('#tab-edit .mut')].filter(x=>/First faces|Second faces/.test(x.textContent)).length))===2,'Where two face sets meet shows two face pickers',p.f.edges);
  await act([{new:true,units:'mm'},{add:{type:'box',w:100,d:60,h:10}},{add:{type:'thicken',t:2,faces:{by:'pick',pts:[[0,10,10]]}}},{add:{type:'wrap',shapes:[{k:'rect',w:10,h:5}],depth:2,faces:{by:'pick',pts:[[0,10,12]]}}}]);
  await ev(()=>{window.amnicad.API.active=null;});await wb();const s2=T(await call('get_state'));ok(!s2.errors.length&&Math.abs(s2.mass_properties.volume_mm3-72100)<1,'thicken then wrap from the AI actions',[s2.errors,s2.mass_properties.volume_mm3]);
  await ev(()=>{const A=window.amnicad.API;A.active=A.doc.features[2].id;});await sleep(300);p=await panel();
  ok(p.labels.includes('Depth')&&p.sel.some(s=>/Emboss/.test(s)||/Deboss/.test(s))||p.labels.includes('Result'),'wrap panel shows profile, result and depth',p.labels);
  shots&&await page.screenshot({path:shots+'/wrap_panel.png'});
  await ev(()=>{const A=window.amnicad.API;A.active=A.doc.features[1].id;});await sleep(300);ok(await ev(()=>/Click faces in the view/.test(document.querySelector('#tab-edit').textContent)),'thicken takes face clicks straight from the view');
  ok(!errs.length,'no page errors',errs.slice(0,3));
}catch(e){fail++;console.log('FAIL threw '+(e.stack||e));}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
