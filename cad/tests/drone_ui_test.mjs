import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18877,mcp:+process.env.E2E_MCP||18878,width:1600,height:900,pro:false}),p=E.page,sleep=E.sleep;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,300):''));};
const doc=()=>p.evaluate(()=>{const d=window.amnicad.API.doc;return JSON.parse(JSON.stringify({drone:d.drone||null,comps:d.asm?d.asm.comps.length:0,parts:d.asm?Object.keys(d.asm.parts).length:0,pcb:d.pcb?d.pcb.parts.length:0,units:d.units,ws:window.amnicad.API.ws}));}),txt=s=>p.evaluate(s=>(document.querySelector(s)||{}).textContent||'',s);
const click=async(sel,what)=>{const b=await p.$(sel);ok(!!b,'found '+what);b&&await b.click();await sleep(500);return b;};
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await click('#nav-now','the workspace menu');await click('#ws button[data-ws="drone"]','the Drone workspace button');await sleep(700);
  ok(await p.evaluate(()=>document.body.classList.contains('drone-mode')&&getComputedStyle(document.getElementById('dleft')).display==='block'),'Drone mode shows its own left panel');
  let perf=await txt('#dr-perf');ok(/All-up weight1\.\d\d lb \(5\d\d g\)/.test(perf)&&/Thrust to weight1\d\.\d : 1/.test(perf),'the 5 in freestyle preset solves to about 1.1 lb with a double-digit thrust to weight',perf);
  ok(/Every part fits/.test(await txt('#dr-fit')),'the fit check reports no collisions');
  ok(await p.evaluate(()=>window.amnicad.API.hooks.bounds&&window.amnicad.API.hooks.bounds().r>3),'the 3D preview has the drone in it');
  await click('#dr-types button[data-type="whoop"]','the cinewhoop type');let d=await doc();ok(d.drone&&d.drone.o.type==='whoop','picking a type saves it in the document',d.drone);perf=await txt('#dr-perf');ok(/Wheelbase.*6\.\d in/.test(perf),'the whoop wheelbase is about 6.3 in',perf);
  await p.evaluate(()=>{const s=document.getElementById('dr-cells');s.value='6';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);d=await doc();ok(d.drone.o.cells===6&&/6S/.test(await txt('#dleft')),'the battery slider changes the design',d.drone.o);
  await click('#dr-themes button[aria-label="stealth theme"]','the stealth theme swatch');d=await doc();ok(d.drone.o.theme==='stealth','the theme is saved',d.drone.o.theme);
  await click('#dr-make','the Make CAD model button');await p.waitForFunction(()=>window.amnicad.API.ws==='asm',{timeout:20000}).catch(()=>{});d=await doc();ok(d.ws==='asm'&&d.parts===13&&d.comps===24&&d.units==='in','Make CAD model builds 13 parts and 24 components in the Assembly and leaves the part units alone',d);
  const r=E.T(await E.call('drone_model',{type:'saucer'}));ok(r&&r.cad&&r.cad.parts===17&&r.cad.comps===54&&r.problems===0,'drone_model builds the saucer: 17 parts, 54 components, no collisions',r&&{cad:r.cad,problems:r.problems});
  ok(r&&r.assembly&&!/error/i.test(JSON.stringify(r.assembly).slice(0,4000)),'the saucer assembly settles without part errors',r&&JSON.stringify(r.assembly).slice(0,300));
  const f=E.T(await E.call('drone_model',{type:'x',build:false,fc_board:true}));d=await doc();ok(f&&f.fc_board&&d.pcb===17&&d.ws==='ecad','fc_board makes a 17-part flight controller board and opens Electronics',{pcb:d.pcb,ws:d.ws});
  await E.call('drone_model',{type:'saucer',build:false});await sleep(900);ok(!!await p.$('#dr-nose')&&!!await p.$('#dr-opt')&&/Wind tunnel sweep/.test(await txt('#dright')),'the saucer shows nose fairing sliders and the Aero card');
  const ae=await p.evaluate(()=>import('./drone_ui.js').then(m=>m.apply(window.amnicad.API,{aero:{mode:'sweep',cells:30000,gpu:false,tilts:[0,20]},build:false},{ws:false})).then(r=>r.aero));await sleep(500);ok(ae&&ae.top_speed>3&&ae.tab.length===2&&/Top speed/.test(await txt('#dr-aero')),'a wind tunnel sweep trims the saucer and shows its top speed',ae&&{top:ae.top_speed,tab:ae.tab,note:ae.note});
  const s=(await E.call('get_design_language',{topic:'drone'})).content[0].text;ok(/Drone workspace/.test(JSON.stringify(s)),'the drone help topic is available to assistants');
}catch(e){fail++;console.log('FAIL threw '+(e&&e.stack||e));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
