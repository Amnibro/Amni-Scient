import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18871,mcp:+process.env.E2E_MCP||18872,width:1600,height:900,pro:false}),p=E.page,sleep=E.sleep;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const pcb=()=>p.evaluate(()=>JSON.parse(JSON.stringify(window.amnicad.API.doc.pcb||null))),stat=()=>p.evaluate(()=>[...document.querySelectorAll('#ec-stat b')].map(b=>b.textContent));
const click=async(sel,what)=>{const b=await p.$(sel);ok(!!b,'found '+what);b&&await b.click();await sleep(450);return b;};
const ink=()=>p.evaluate(()=>{const c=document.getElementById('ecv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)(Math.abs(d[i]-11)+Math.abs(d[i+1]-15)+Math.abs(d[i+2]-20))>40&&n++;return n/(d.length/4);});
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await click('#nav-now','the workspace menu');await click('#ws button[data-ws="ecad"]','the Electronics workspace button');ok(await p.evaluate(()=>document.body.classList.contains('ecad-mode')&&getComputedStyle(document.getElementById('eleft')).display==='block'),'Electronics mode shows its own left panel');
  await click('#ec-demo','the Hall board demo button');let P=await pcb();ok(P&&P.parts.length===12&&P.nets.length===5,'the demo loads 12 parts and 5 nets',P&&{parts:P.parts.length,nets:P.nets.length});
  let s=await stat();ok(s[0]==='21'&&s[1]==='0','before routing: 21 unrouted, 0 rule errors',s);ok(await ink()>0.05,'the PCB view draws the board');
  await click('#ec-route','the Autoroute button');await sleep(500);P=await pcb();s=await stat();ok(P.tracks.length>20&&P.vias.length>0,'autoroute writes tracks and vias into the document',{t:P.tracks.length,v:P.vias.length});ok(s[0]==='0'&&s[1]==='0','after routing: 0 unrouted, 0 rule errors',s);ok(!!await p.$('#ec-clean'),'the clean-board message shows');
  const u2=await p.evaluateHandle(()=>[...document.querySelectorAll('#ec-parts .ec-item')].find(b=>b.querySelector('b').textContent==='U2'));await u2.asElement().click();await sleep(450);ok(await p.evaluate(()=>!!document.querySelector('#ec-parts .ec-item.on')),'clicking U2 in the list selects it');
  const r=await (await p.$('#ecv')).boundingBox(),cx=r.x+r.width/2,cy=r.y+r.height/2,x0=P.parts.find(q=>q.ref==='U2').x;await p.mouse.move(cx,cy);await p.mouse.down();for(let k=1;k<=7;k++){await p.mouse.move(cx+k*10,cy);await sleep(30);}await p.mouse.up();await sleep(700);
  P=await pcb();const x1=P.parts.find(q=>q.ref==='U2').x;ok(x1>x0+0.5,'dragging U2 on the canvas moves it right',{x0,x1});s=await stat();ok(+s[0]>0||+s[1]>0,'moving U2 off its tracks shows unrouted or rule errors',s);
  await p.keyboard.press('r');await sleep(600);P=await pcb();ok(P.parts.find(q=>q.ref==='U2').rot===90,'R rotates the selected part 90°');
  await p.evaluate(()=>{window.__dl=[];window.amnicad.API.hooks.download=(b,n)=>{window.__dl.push([n,b.size]);return true;};});await click('#ec-gbr','the Gerbers button');await click('#ec-bom','the BOM button');await click('#ec-cpl','the Pick and place button');
  const dl=await p.evaluate(()=>window.__dl);ok(dl.length===3&&/gerbers\.zip$/.test(dl[0][0])&&dl[0][1]>4000&&/bom\.csv$/.test(dl[1][0])&&/positions\.csv$/.test(dl[2][0]),'Gerber zip, BOM and positions download',dl);
  await click('#ec-vsch','the Schematic view button');ok(await ink()>0.02,'the schematic view draws symbols');
  await click('#ec-v3d','the 3D view button');await sleep(600);const b3=await p.evaluate(()=>{const b=window.amnicad.API.hooks.bounds&&window.amnicad.API.hooks.bounds();return b&&[b.min,b.max];});ok(b3&&Math.abs(b3[1][0]-b3[0][0]-86/25.4)<0.05,'3D board is 86 mm (3.39 in) wide in inch scene units',b3);ok(await p.evaluate(()=>!document.body.classList.contains('ec-2d')),'3D view hides the 2D canvas');
  await click('#ec-vpcb','the PCB view button');await click('#ec-lbot','the Bottom layer button');ok(await ink()>0.05,'bottom-layer view draws');
  await click('#nav-now','the workspace menu');await click('#ws button[data-ws="part"]','the Part workspace button');await sleep(500);ok(await p.evaluate(()=>!document.body.classList.contains('ecad-mode')&&window.amnicad.API.model.visible),'leaving Electronics restores the part view');
  P=await pcb();ok(P&&P.parts.length===12,'the board stays in the document after leaving');
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL exception '+(e.stack||e.message));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
