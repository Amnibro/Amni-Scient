import {startE2E} from './e2e_lib.mjs';import {proKey} from './pro_key.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const txt=r=>JSON.stringify(r).replace(/\\"/g,'"'),err=r=>!!(r&&(r.error||r.isError||r.result&&r.result.isError));
const PLATE={name:'Motor mount plate',units:'in',params:[],material:'al6061',features:[{id:'a',type:'box',w:4,d:2.5,h:0.25}],sim:{type:'static',supports:[{faces:{side:'-X'},type:'fixed'}],loads:[{faces:{side:'+X'},p:5}]}};
if(!proKey()){console.log('SKIP: needs the license issuer');process.exit(0);}
let E=await startE2E({web:+process.env.E2E_WEB||18727,mcp:+process.env.E2E_MCP||18728});
try{await E.connect();
  const names=(await E.rpc('tools/list',{})).result.tools.map(t=>t.name);ok(['vault_status','vault_search','vault_checkin','vault_submit_review','vault_open'].every(n=>names.includes(n)),'the AI app sees the five vault tools');
  await E.page.evaluate(async d=>{const A=window.amnicad.API;A.loadDoc(d,null);await A.waitBuild();},PLATE);await E.sleep(800);
  let st=E.T(await E.call('vault_status',{}));ok(st.vault==='personal'&&!st.this_design&&/not in the vault yet/.test(st.note||''),'vault_status shows the personal vault and that this design is not in it yet',st);
  const ci=E.T(await E.call('vault_checkin',{note:'First release candidate'}));ok(ci.checked_in&&/^PRT-/.test(ci.number||'')&&ci.state==='in_work','vault_checkin checks the part in with a new part number',ci);
  const se=E.T(await E.call('vault_search',{query:'motor mount'}));ok(se.items.some(i=>i.number===ci.number),'vault_search finds it by name',se.items.map(i=>i.number+' '+i.name).join(', '));
  st=E.T(await E.call('vault_status',{}));ok(st.this_design&&st.this_design.number===ci.number&&st.role==='admin','vault_status now shows this design and the role',st.this_design);
  const sr=E.T(await E.call('vault_submit_review',{}));ok(sr.state==='in_review'&&/cannot/.test(sr.note),'vault_submit_review moves it to in review and says a person releases it',sr);
  const again=await E.call('vault_submit_review',{});ok(err(again)&&/in review/.test(txt(again)),'sending it for review twice is refused with the reason',txt(again).slice(0,160));
  ok(!names.some(n=>/vault_(release|approve)/.test(n)),'there is no tool that releases or approves a part');
  await E.page.evaluate(async()=>{const A=window.amnicad.API;A.loadDoc({name:'Scratch',units:'in',params:[],material:'al6061',features:[{id:'a',type:'box',w:1,d:1,h:1}]},null);await A.waitBuild();});
  const op=E.T(await E.call('vault_open',{number:ci.number}));ok(op.opened&&op.opened.number===ci.number&&await E.page.evaluate(()=>window.amnicad.API.doc.name)==='Motor mount plate','vault_open loads the part back into the editor',op.opened);
  ok(!E.errs.length,'no page errors with Pro',E.errs.slice(0,2).join(' | '));
}catch(e){fail++;console.log('FAIL',e.stack||e.message);}
await E.close();
E=await startE2E({web:+process.env.E2E_WEB2||18737,mcp:+process.env.E2E_MCP2||18738,pro:false});
try{await E.connect();
  const vs=await E.call('vault_status',{});ok(err(vs)&&/part of Amni-CAD Pro/.test(txt(vs)),'on the free plan, vault tools explain that the vault is part of Pro',txt(vs).slice(0,160));
  await E.page.evaluate(async d=>{const A=window.amnicad.API;A.loadDoc(d,null);await A.waitBuild();},PLATE);await E.sleep(800);
  const s1=await E.call('run_stress',{});ok(!err(s1),'the first stress report through the AI app runs on the free plan',txt(s1).slice(0,120));
  const s2=await E.call('run_stress',{});ok(err(s2)&&/free stress report on this computer is used/.test(txt(s2)),'the second one tells the AI app that the free report is used and the page shows how to get Pro',txt(s2).slice(0,200));
  ok(await E.page.evaluate(()=>{const d=document.querySelector('#dlg');return!!d&&d.open&&/used your free stress report/.test(d.textContent);}),'the page shows the Pro offer at the same time');
}catch(e){fail++;console.log('FAIL',e.stack||e.message);}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
