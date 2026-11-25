import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18887,mcp:+process.env.E2E_MCP||18888,width:1600,height:1000,pro:false}),p=E.page,sleep=E.sleep,shots=process.env.SHOTS||null;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const click=async(sel,what)=>{const b=await p.$(sel);ok(!!b,'found '+what);b&&await b.click();await sleep(450);return b;},txt=sel=>p.evaluate(s=>(document.querySelector(s)||{}).textContent||'',sel),field=(sel,v)=>p.evaluate((s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},sel,v),shot=async n=>shots&&await p.screenshot({path:shots+'/'+n+'.png'});
const pcb=()=>p.evaluate(()=>JSON.parse(JSON.stringify(window.amnicad.API.doc.pcb||null))),solved=()=>p.waitForFunction(()=>{const b=document.querySelector('#ec-si-fit');return b&&!b.disabled&&!!document.querySelector('#ec-si-z,#ec-si-err');},{timeout:60000}).then(()=>sleep(300)),kinds=()=>p.evaluate(()=>[...document.querySelectorAll('#eright .ec-v b')].map(b=>b.textContent));
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await click('#nav-now','the workspace menu');await click('#ws button[data-ws="ecad"]','the Electronics workspace button');await click('#ec-demo','the Hall board demo button');await click('#ec-route','the Autoroute button');await sleep(500);
  const R=await txt('#eright');ok(/Impedance/.test(R)&&/Trace current/.test(R)&&/Via/.test(R),'the side panel has Impedance, Trace current and Via sections');
  await solved();const z0=await txt('#ec-si-z');ok(/Impedance\s*[\d.]+ Ω/.test(z0)&&/ps\/in/.test(z0),'a microstrip on the 1.6 mm board solves on its own',z0);
  const px=await p.evaluate(()=>{const c=document.querySelector('#ec-si-cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<d.length;i+=4*97)s.add(d[i]>>4<<8|d[i+1]>>4<<4|d[i+2]>>4);return s.size;});ok(px>7,'the cross section draws the field in bands of color',px);
  await field('#ec-si-h1','0.2104');await solved();await field('#ec-si-target','50');await click('#ec-si-fit','the Find width button');await solved();
  const w=+(await p.evaluate(()=>document.querySelector('#ec-si-w').value)),zf=await txt('#ec-si-z');ok(w>0.3&&w<0.42&&/Impedance\s*50(\.0)?\s*Ω/.test(zf),'Find width lands a 50 ohm trace on 0.21 mm prepreg',[w,zf]);
  await shot('pcbsi_panel');
  await p.select('#ec-si-net','HA');await sleep(300);await click('#ec-si-apply','the Apply width to net button');await sleep(500);let P=await pcb();const ha=P.nets.find(n=>n.name==='HA'),ht=P.tracks.filter(t=>t[6]==='HA');
  ok(ha.z>49.9&&ha.z<50.1&&Math.abs(ha.zw-w)<1e-4&&ht.length&&ht.every(t=>t[4]===ha.zw),'Apply width to net stores the rule and widens every HA track',[ha.z,ha.zw,ht.length]);
  ok(/HA: 50(\.0)? Ω at [\d.]+ mil/.test(await txt('#ec-si-rule')),'the panel shows the rule on the net',await txt('#ec-si-rule'));
  await p.evaluate(()=>window.amnicad.API.commit(d=>{const t=d.pcb.tracks.find(t=>t[6]==='HA');t[4]=0.2;}));await sleep(700);let K=await kinds();ok(K.includes('Off its impedance width'),'a narrowed HA track shows up as off its impedance width',K);
  await field('#ec-si-i','3');await sleep(300);const cur=await txt('#ec-si-cur');ok(/Width needed\s*[\d.]+ mil/.test(cur),'the current calculator gives the width for 3 A',cur);
  await click('#ec-si-applyi','the Apply current to net button');await sleep(700);P=await pcb();K=await kinds();ok(P.nets.find(n=>n.name==='HA').amps===3&&K.includes('Too thin for its current'),'Apply current to net flags the HA tracks that are too thin for 3 A',K);
  ok(/Inductance\s*[\d.]+ nH/.test(await txt('#ec-si-via')),'the via calculator shows inductance',await txt('#ec-si-via'));
  await click('#ec-si-clear','the Clear net rules button');await sleep(700);P=await pcb();K=await kinds();const hc=P.nets.find(n=>n.name==='HA');ok(!hc.z&&!hc.amps&&!K.includes('Too thin for its current')&&!K.includes('Off its impedance width'),'Clear net rules removes both checks',K);
  await p.select('#ec-si-pair','1');await solved();const zd=await txt('#ec-si-z');ok(/Differential\s*[\d.]+ Ω/.test(zd)&&/Coupling/.test(zd),'a differential pair shows its differential impedance and coupling',zd);
  await p.select('#ec-si-st','stripline');await solved();ok(/Differential/.test(await txt('#ec-si-z'))&&!!(await p.$('#ec-si-h2')),'stripline adds the dielectric above the trace',await txt('#ec-si-z'));
  await field('#ec-si-w','-1');await sleep(500);ok(/above 0/.test(await txt('#ec-si-err')),'a bad width explains itself',await txt('#ec-si-err'));
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL exception '+(e.stack||e.message));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
