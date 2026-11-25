import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18881,mcp:+process.env.E2E_MCP||18882,width:1600,height:900,pro:false}),p=E.page,sleep=E.sleep;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const txt=id=>p.evaluate(i=>{const e=document.getElementById(i);return e?e.textContent:null;},id),val=id=>p.evaluate(i=>{const e=document.getElementById(i);return e?e.value:null;},id),click=async id=>{await (await p.$('#'+id)).click();await sleep(700);},setv=async(id,v)=>{await p.evaluate((i,v)=>{const e=document.getElementById(i);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},id,v);await sleep(400);};
const px=(x,y)=>p.evaluate((x,y)=>{const c=document.getElementById('ecv'),[a,b]=c.w2s(x,y),r=window.devicePixelRatio||1,d=c.getContext('2d').getImageData(Math.round(a*r),Math.round(b*r),1,1).data;return[d[0],d[1],d[2]];},x,y);
const hue=([r,g,b])=>{const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;return d?(M===r?60*(((g-b)/d+6)%6):M===g?60*((b-r)/d+2):60*((r-g)/d+4)):0;},dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const BRD={board:{x0:-40,y0:-20,x1:40,y1:20,t:1.6,layers:4,planes:{2:'+5V'}},parts:[{ref:'J1',pkg:'0603',x:-30,y:0,rot:0},{ref:'U1',pkg:'0603',x:30,y:0,rot:0},{ref:'U2',pkg:'0603',x:0,y:15,rot:0}],nets:[{name:'+5V',pins:['J1.1','U1.1','U2.1'],amps:2},{name:'GND',pins:['J1.2','U1.2']}],tracks:[[-30.825,0,-33,0,0.8,0,'+5V'],[29.175,0,27,0,0.8,0,'+5V'],[-0.825,15,-3,15,0.5,0,'+5V']],vias:[[-33,0,'+5V'],[27,0,'+5V'],[-3,15,'+5V']],zones:[]};
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await (await p.$('#nav-now')).click();await sleep(400);await (await p.$('#ws button[data-ws="ecad"]')).click();await sleep(600);await click('ec-demo');
  await p.evaluate(async b=>{const E=await import(new URL('ecad.js',location.href).href);window.amnicad.API.commit(d=>{d.pcb={...E.newBoard(80,40),...b};});},BRD);await sleep(600);await click('ec-v3d');await click('ec-vpcb');
  ok(await val('ec-ir-net')==='+5V'&&await val('ec-ir-src')==='J1.1'&&+await val('ec-ir-v')===5&&+await val('ec-ir-a0')===1&&+await val('ec-ir-a1')===1,'the Power section picks +5V, supplied at J1.1 at 5 V from the name, with the 2 A net current split over U1.1 and U2.1',[await val('ec-ir-net'),await val('ec-ir-src'),await val('ec-ir-v'),await val('ec-ir-a0'),await val('ec-ir-a1')]);
  await setv('ec-ir-a0','1.5');await setv('ec-ir-a1','0.5');await click('ec-ir');const want=await p.evaluate(async()=>{const E=await import(new URL('ecad.js',location.href).href),r=E.irDrop(window.amnicad.API.doc.pcb,{net:'+5V',src:'J1.1',loads:{'U1.1':1.5,'U2.1':0.5}});return{drop:r.drop,v1:r.loads[0].v,j:r.jmax};}),out=await txt('ec-ir-out'),l0=await txt('ec-irl0');
  ok(out&&out.includes((want.drop*1e3).toFixed(2)+' mV')&&out.includes('2 A')&&l0&&l0.startsWith(want.v1.toFixed(4)),'Check IR drop reports the worst drop, the supplied current and each pin voltage',{out,l0,want});
  ok(/A\/mm²/.test(out)&&await p.evaluate(()=>!!document.querySelector('#ec-ir-out .ec-warn')),'2 A through a 0.8 mm track shows its current density as a warning',out);
  await click('ec-lin1');const a=await px(-24,0),b=await px(24,0);ok(hue(a)>hue(b)+10&&hue(a)<240&&hue(b)>0,'the In1 drop map shades from the supply side toward red at the far load',{near:[...a,Math.round(hue(a))],far:[...b,Math.round(hue(b))]});
  await click('ec-irmap');const a2=await px(-24,0);ok(dist(a2,a)>60&&await txt('ec-irmap')==='Show map','Hide map takes the colors off the board',{before:a,after:a2});
  await click('ec-irmap');await click('ec-lboth');
  await p.evaluate(()=>window.amnicad.API.commit(d=>{d.pcb.tracks=d.pcb.tracks.filter(t=>!(t[1]===15&&t[3]===15));}));await sleep(700);ok(await txt('ec-ir-out')===null,'editing the copper clears the old result');
  await click('ec-ir');const l1=await txt('ec-irl1');ok(l1==='not connected'&&await p.evaluate(()=>[...document.querySelectorAll('.ec-note.ec-bad')].some(e=>/U2.1|not connected/.test(e.textContent)))||l1==='not connected','a pin cut off from the supply shows as not connected',l1);
  await p.evaluate(async()=>{const E=await import(new URL('ecad.js',location.href).href),r=E.analyze(window.amnicad.API.doc.pcb);window.__drc=r.viol.filter(v=>v[0]!==5).length;});ok(await p.evaluate(()=>window.__drc)===0,'the test board itself passes the design rules');
  await click('ec-lin1');await p.screenshot({path:process.env.SHOT||'/dev/null'}).catch(()=>{});
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL threw '+(e.stack||e));}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
