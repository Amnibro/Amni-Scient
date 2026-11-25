import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18877,mcp:+process.env.E2E_MCP||18878,width:1600,height:900,pro:false}),p=E.page,sleep=E.sleep,shots=process.env.SHOTS||null;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const click=async(sel,what)=>{const b=await p.$(sel);ok(!!b,'found '+what);b&&await b.click();await sleep(450);return b;},txt=sel=>p.evaluate(s=>(document.querySelector(s)||{}).textContent||'',sel),field=(sel,v)=>p.evaluate((s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},sel,v),run=async w=>{await click('#ec-sim','the Run simulation button');await p.waitForFunction(w=>!!document.querySelector(w)||!!document.querySelector('#ec-sim-err'),{timeout:60000},w);await sleep(300);},shot=async n=>shots&&await p.screenshot({path:shots+'/'+n+'.png'});
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await click('#nav-now','the workspace menu');await click('#ws button[data-ws="ecad"]','the Electronics workspace button');await click('#ec-demo','the Hall board demo button');
  ok(/Simulate/.test(await txt('#eright'))&&/VCC has no supply voltage/.test(await txt('#eright')),'the Simulate section asks for the VCC supply');
  await field('#ec-sim-sup','VCC=5');await sleep(300);ok(!/VCC has no supply voltage/.test(await txt('#eright')),'a supply voltage clears the note');
  await run('#ec-sim-op');const op=await txt('#ec-sim-op');ok(/VCC5 V/.test(op)&&/Supply power/.test(op),'operating point lists net voltages and supply power',op);
  ok(/Not simulated: U1, U2, U3/.test(await txt('#eright')),'the hall sensors are listed as not simulated');
  await p.evaluate(()=>window.amnicad.API.commit(d=>{d.pcb={v:1,board:{x0:-20,y0:-15,x1:20,y1:15,t:1.6,layers:2},parts:[{ref:'R1',val:'1k',pkg:'0603',x:-5,y:0,rot:0,side:0},{ref:'C1',val:'1uF',pkg:'0603',x:5,y:0,rot:0,side:0},{ref:'R2',val:'10',pkg:'0603',x:0,y:7,rot:0,side:0}],nets:[{name:'IN',pins:['R1.1']},{name:'OUT',pins:['R1.2','C1.1']},{name:'+5V',pins:['R2.1']},{name:'GND',pins:['C1.2','R2.2']}],tracks:[],vias:[],zones:[],rules:{}};}));await sleep(700);
  await field('#ec-sim-sup','IN=PULSE(0 1 0 1u 1u 1 2)');await p.evaluate(()=>{const s=document.querySelector('#ec-sim-k');s.value='op';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  await run('#ec-sim-op');ok(/R2 dissipates 2\.5 W, more than a 0603 resistor is rated for/.test(await txt('#eright')),'an overloaded resistor is flagged against its package rating',await txt('#eright'));
  await p.evaluate(()=>{const s=document.querySelector('#ec-sim-k');s.value='tran';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);ok(await p.evaluate(()=>document.querySelector('#ec-sim-an').value)==='.tran 10u 10m','choosing Transient fills its command');
  await run('#ec-sim-plot');const tp=await p.evaluate(()=>({net:document.querySelector('#ec-sim-net').value,pts:document.querySelector('#ec-sim-plot polyline').getAttribute('points').split(' ').length}));ok(tp.net==='OUT',"the transient plot opens on the undriven net that moves most",tp);ok(tp.pts>500,'the plot draws the waveform',tp.pts);
  await shot('spice_tran');
  await field('#ec-sim-sup','IN=AC 1');await p.evaluate(()=>{const s=document.querySelector('#ec-sim-k');s.value='ac';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);await p.evaluate(()=>{const s=document.querySelector('#ec-sim-net');s&&(s.value='OUT',s.dispatchEvent(new Event('change',{bubbles:true})));});await sleep(200);
  await run('#ec-sim-bw');const bw=await txt('#ec-sim-bw'),f3=parseFloat((/at ([\d.]+) Hz/.exec(bw)||[])[1]);ok(Math.abs(f3/159.15-1)<0.03,'frequency response finds the RC corner at 1/(2 pi RC)',bw);
  await shot('spice_ac');
  ok(!!await p.$('#ec-cir'),'the SPICE netlist button is there');
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL exception '+(e.stack||e.message));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
