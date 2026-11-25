import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18877,mcp:+process.env.E2E_MCP||18878,width:1600,height:900,pro:false}),p=E.page,sleep=E.sleep;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const pcb=()=>p.evaluate(()=>JSON.parse(JSON.stringify(window.amnicad.API.doc.pcb||null))),stat=()=>p.evaluate(()=>[...document.querySelectorAll('#ec-stat b')].map(b=>b.textContent)),ang=s=>Math.atan2(s[3]-s[1],s[2]-s[0])*180/Math.PI,o45=s=>Math.abs(ang(s)/45-Math.round(ang(s)/45))<1e-3;
const scr=(x,y)=>p.evaluate((x,y)=>{const c=document.getElementById('ecv'),r=c.getBoundingClientRect(),[a,b]=c.w2s(x,y);return[r.left+a,r.top+b];},x,y),at=async(x,y)=>{const[a,b]=await scr(x,y);await p.mouse.move(a,b,{steps:4});await sleep(150);return[a,b];},tap=async(x,y)=>{const[a,b]=await at(x,y);await p.mouse.click(a,b);await sleep(250);},key=async k=>{await p.keyboard.press(k);await sleep(250);};
const rats=()=>p.evaluate(async()=>{const E=await import(new URL('ecad.js',location.href).href),r=E.analyze(window.amnicad.API.doc.pcb);return r.rats.map(x=>[...x.slice(0,4),r.m.names[x[4]],x[5]]).sort((a,b)=>a[5]-b[5]);});
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await (await p.$('#nav-now')).click();await sleep(400);await (await p.$('#ws button[data-ws="ecad"]')).click();await sleep(600);await (await p.$('#ec-demo')).click();await sleep(900);
  let s0=await stat(),R=await rats();ok(+s0[0]===R.length&&R.length>3,'the demo board starts unrouted',s0);
  await (await p.$('#ec-troute')).click();await sleep(300);ok(await p.evaluate(()=>document.getElementById('ec-troute').className==='on'&&!!document.getElementById('ec-walk')),'the Route chip turns on with a Walk around toggle');
  const r=R[0];await tap(r[0],r[1]);await at((r[0]+r[2])/2,(r[1]+r[3])/2+1.5);await tap((r[0]+r[2])/2,(r[1]+r[3])/2+1.5);await tap(r[2],r[3]);await sleep(500);
  let P=await pcb(),s=await stat(),mine=P.tracks.filter(t=>t[6]===r[4]);ok(mine.length>=2&&+s[0]===R.length-1&&s[1]==='0'&&mine.every(o45),'clicking pad, corner, pad routes one '+r[4]+' connection with 45° corners and no rule errors',{segs:mine.length,s});
  const n0=P.tracks.length,v0=P.vias.length,r2=R.find(x=>x[4]!==r[4]);await tap(r2[0],r2[1]);await tap(r2[0]+1.5,r2[1]+1.5);await key('Backspace');await key('Escape');await sleep(400);P=await pcb();ok(P.tracks.length===n0,'Backspace takes back the fixed corner and Escape stops without adding copper',{n:P.tracks.length,n0});
  await tap(r2[0],r2[1]);await tap(r2[0]+1.5,r2[1]+1.5);await key('v');await at(r2[0]+3,r2[1]+1.5);await key('Escape');await sleep(500);P=await pcb();const nv=P.vias.at(-1);ok(P.vias.length===v0+1&&P.tracks.length>n0&&nv&&nv[2]===r2[4],'V drops a via mid-route and switches layers',{v:P.vias.length,t:P.tracks.length});
  await (await p.$('#ec-troute')).click();await sleep(300);P=await pcb();let picked=-1;
  for(const[i,t]of P.tracks.entries()){if(t[6]!==r[4])continue;await tap((t[0]+t[2])/2,(t[1]+t[3])/2);if(await p.$('#ec-tdel')){picked=i;break;}}
  ok(picked>=0,'clicking a track selects it and shows Delete and Unroute',picked);
  const nt=P.tracks.length;await (await p.$('#ec-tdel')).click();await sleep(500);P=await pcb();ok(P.tracks.length===nt-1,'Delete removes that track segment',{before:nt,after:P.tracks.length});
  const t2=P.tracks.findIndex(t=>t[6]===r[4]);t2>=0&&await tap((P.tracks[t2][0]+P.tracks[t2][2])/2,(P.tracks[t2][1]+P.tracks[t2][3])/2);const un=await p.$('#ec-unroute');un&&await un.click();await sleep(500);P=await pcb();ok(!!un&&!P.tracks.some(t=>t[6]===r[4])&&r2[4]!==r[4]&&P.tracks.some(t=>t[6]===r2[4]),'Unroute removes every track of that net and keeps the others',{net:r[4],other:r2[4],un:!!un,left:P.tracks.map(t=>t[6])});
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL threw '+(e.stack||e));}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
