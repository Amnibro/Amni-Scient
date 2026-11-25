import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const E=await startE2E({web:+process.env.E2E_WEB||18747,mcp:+process.env.E2E_MCP||18748});
const {page,call,T,errs,sleep}=E,ev=(f,...a)=>page.evaluate(f,...a),shots=process.env.SHOTS,asm=async ops=>{const r=T(await call('asm_apply',{ops}));await sleep(500);return r;};
const view=()=>ev(async()=>{const m=await import(new URL('asm_ui.js',location.href).href),U=m.state();await sleep(0);return Object.fromEntries([...U.objs].map(([k,o])=>[k,{rep:o.m.simple||'full',vis:o.g.visible,tris:o.m.idx.length/3}]));}).catch(e=>({err:e.message}));
const click=t=>ev(t=>{const b=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.textContent.trim()===t);b[0]&&b[0].click();return b.length;},t);
try{
  await ev(()=>{window.sleep=ms=>new Promise(r=>setTimeout(r,ms));});
  T(await call('apply_actions',{actions:[{new:true,units:'mm'},{add:{type:'cylinder',r:10,h:30}}]}));await ev(()=>window.amnicad.API.waitBuild());
  let r=await asm([{insert:{part:'current',fix:true}},{insert:{part:'current',n:2,gap:[40,0,0],at:[40,0,0]}},{subassembly:{comps:['c2','c3'],name:'Pair'}}]);
  let g=T(await call('asm_get'));const sub=(g.subassemblies||[])[0];
  ok(sub&&sub.name==='Pair'&&sub.mode==='rigid'&&sub.comps.join()==='c2,c3','the assistant makes a rigid subassembly',g.subassemblies||JSON.stringify(r).slice(0,300));
  r=await asm([{subassembly:{name:'Pair',mode:'flexible'}}]);g=T(await call('asm_get'));ok(g.subassemblies[0].mode==='flexible','and switches it to flexible',g.subassemblies);
  r=await asm([{simplify:{comps:['c2'],as:'box'}},{simplify:{comps:['c3'],as:'hull'}}]);await sleep(600);let v=await view();
  ok(v.c2&&v.c2.rep==='box'&&v.c2.tris===12&&v.c3&&v.c3.rep==='hull'&&v.c3.tris>12&&v.c1.rep==='full'&&v.c1.tris>v.c2.tris,'the view draws Helium box and hull stand-ins',v);
  g=T(await call('asm_get'));ok(g.simplified_views&&g.simplified_views.active==='Simplified 1'&&g.simplified_views.parts.c2==='box','the summary reports the active simplified view',g.simplified_views);
  const ms=async()=>{const c=T(await call('asm_check',{what:['mass']}));return c.mass;},m0=await ms();await asm([{simplify:{use:'full'}}]);const m1=await ms();g=T(await call('asm_get'));ok(m0&&JSON.stringify(m0)===JSON.stringify(m1)&&!g.simplified_views.parts,'mass stays on the full parts',[m0&&(m0.mass??m0.total??JSON.stringify(m0).slice(0,80)),m1&&(m1.mass??m1.total)]);
  v=await view();ok(v.c2.rep==='full'&&v.c3.rep==='full','full detail brings the real parts back',v);
  await ev(async()=>{const m=await import(new URL('asm_ui.js',location.href).href);m.openPanel('config');});await sleep(500);
  const txt=await ev(()=>document.body.textContent);ok(/Subassemblies/.test(txt)&&/Simplified views/.test(txt)&&/Pair/.test(txt),'the configurations page lists subassemblies and simplified views');
  ok(/▣ Pair/.test(await ev(()=>document.body.textContent))===false&&/⇄ Pair/.test(await ev(()=>document.body.textContent)),'the components list shows each part\'s group');ok(await click('Flexible')>0,'the subassembly row has a rigid or flexible switch');await sleep(500);g=T(await call('asm_get'));ok(g.subassemblies[0].mode==='rigid','clicking it makes the group rigid again',g.subassemblies);
  await ev(async()=>{const m=await import(new URL('asm_ui.js',location.href).href),U=m.state();U.sel=[{c:'c1',kind:'comp'}];});await click('Hidden');await sleep(600);v=await view();ok(v.c1&&v.c1.vis===false&&v.c2.vis,'Hidden hides the selected part only in the view',v);
  shots&&await page.screenshot({path:shots+'/subasm_panel.png'});
  await click('Full detail').catch(()=>0);await ev(()=>{const x=[...document.querySelectorAll('.atree .nm')].find(n=>n.textContent==='Full detail');x&&x.parentElement.click();});await sleep(600);v=await view();ok(v.c1.vis,'Full detail shows it again',v);
  await asm([{subassembly:{dissolve:'Pair'}}]);g=T(await call('asm_get'));ok(!g.subassemblies,'dissolve removes the group',g.subassemblies);
  ok(!errs.length,'no page errors',errs.slice(0,3));
}catch(e){fail++;console.log('FAIL threw '+(e.stack||e));}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
