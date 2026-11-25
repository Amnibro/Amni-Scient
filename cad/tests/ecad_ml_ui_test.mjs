import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18875,mcp:+process.env.E2E_MCP||18876,width:1600,height:900,pro:false}),p=E.page,sleep=E.sleep;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const pcb=()=>p.evaluate(()=>JSON.parse(JSON.stringify(window.amnicad.API.doc.pcb||null))),stat=()=>p.evaluate(()=>[...document.querySelectorAll('#ec-stat b')].map(b=>b.textContent)),pick=async(sel,v)=>{await p.select(sel,v);await sleep(500);};
const red=()=>p.evaluate(()=>{const c=document.getElementById('ecv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i];return s/(d.length/4);});
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await (await p.$('#nav-now')).click();await sleep(400);await (await p.$('#ws button[data-ws="ecad"]')).click();await sleep(600);await (await p.$('#ec-demo')).click();await sleep(700);
  let P=await pcb();const g=P.nets.find(n=>/^GND$/i.test(n.name));ok(!!g,'the demo board has a GND net',P.nets.map(n=>n.name));
  await pick('#ec-layers','4');P=await pcb();ok(P.board.layers===4&&P.board.planes&&P.board.planes[2]===g.name,'choosing 4 layers adds In1 as a GND plane',P.board);
  const sel=await p.evaluate(()=>['#ec-pl2','#ec-pl3'].map(s=>{const e=document.querySelector(s);return e?e.value:null;}));ok(sel[0]===g.name&&sel[1]==='','the board panel lists In1 (GND plane) and In2 (signal)',sel);
  const chips=await p.evaluate(()=>[...document.querySelectorAll('button[id^="ec-l"]')].map(b=>b.textContent));ok(chips.join(',')==='All,Top,In1,In2,Bottom','the layer chips show every layer in stack order',chips);
  await (await p.$('#ec-lin1')).click();await sleep(400);const i1=await red();await (await p.$('#ec-lin2')).click();await sleep(400);const i2=await red();ok(i1>i2*1.15,'the In1 view shows the plane filling the board',{in1:+i1.toFixed(3),in2:+i2.toFixed(3)});
  await (await p.$('#ec-lboth')).click();await sleep(300);let s=await stat();ok(s[1]==='0','the GND plane passes the design rules before routing',s);
  await (await p.$('#ec-route')).click();await sleep(1500);P=await pcb();s=await stat();ok(s[0]==='0'&&s[1]==='0'&&!P.tracks.some(t=>t[5]===2),'autoroute finishes the 4-layer board with no errors and no tracks on the plane',{s,v:P.vias.length});
  await pick('#ec-pl3',P.nets.find(n=>n.name!==g.name).name);P=await pcb();ok(Object.keys(P.board.planes).length===2,'In2 can become a second plane',P.board.planes);
  const keys=await p.evaluate(async()=>Object.keys((await import(new URL('ecad.js',location.href).href)).fab(window.amnicad.API.doc.pcb,'b')));ok(keys.includes('b-In1_Cu.g2')&&keys.includes('b-In2_Cu.g3'),'Gerbers include both inner layers',keys);
  await (await p.$('#ec-v3d')).click();await sleep(700);await (await p.$('#ec-vpcb')).click();await sleep(400);
  await pick('#ec-layers','2');P=await pcb();ok(P.board.layers===2&&!Object.keys(P.board.planes||{}).length&&!P.tracks.some(t=>t[5]>=2),'going back to 2 layers drops the planes and inner tracks',{l:P.board.layers,pl:P.board.planes});
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL threw '+(e.stack||e));}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
