import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18873,mcp:+process.env.E2E_MCP||18874,width:1600,height:900,pro:false}),p=E.page,sleep=E.sleep;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,300):''));};
const doc=k=>p.evaluate(k=>JSON.parse(JSON.stringify(window.amnicad.API.doc[k]||null)),k),stat=()=>p.evaluate(()=>[...document.querySelectorAll('#ec-sstat b')].map(b=>b.textContent));
const click=async(sel,what,t=450)=>{const b=await p.$(sel);ok(!!b,'found '+what);b&&await b.click();await sleep(t);return b;};
const scr=(x,y)=>p.evaluate(([x,y])=>{const c=document.getElementById('ecv'),r=c.getBoundingClientRect(),[a,b]=c.w2s(x,y);return[r.left+a,r.top+b];},[x,y]);
const at=async(x,y)=>{const[a,b]=await scr(x,y);await p.mouse.click(a,b);await sleep(350);};
const net=()=>p.evaluate(async()=>{const S=await import('/cad/ecad_sch.js'),s=window.amnicad.API.doc.sch,N=S.netlist(s);return{nets:N.nets.map(n=>n.name+':'+[...n.pins].sort().join(',')).sort(),erc:N.erc.map(e=>e[0]),pins:N.pins.map(q=>({ref:s.parts[q.part].ref,pad:q.pad,name:q.name,x:q.x,y:q.y}))};});
const pin=async(ref,pad)=>(await net()).pins.find(q=>q.ref===ref&&q.pad===pad);
const lib=async(q,id)=>{const i=await p.$('#ec-lq');await i.click({clickCount:3});await p.keyboard.press('Backspace');await i.type(q);await sleep(250);return click('[data-lib="'+id+'"]','library part '+id,300);};
const NETS='3V3:C2.1,U1.2,U1.4|5V:C1.1,U1.3|GND:C1.2,C2.2,U1.1';
try{
  await E.connect();await E.call('apply_actions',{actions:[{new:true,units:'in'}]});await p.evaluate(()=>window.amnicad.API.waitBuild());
  await click('#nav-now','the workspace menu');await click('#ws button[data-ws="ecad"]','the Electronics workspace button');
  await click('#ec-new','the New design button');await click('#ec-vsch','the Schematic view button');
  ok(await p.evaluate(()=>document.querySelectorAll('#ec-lib [data-lib]').length)>50,'the parts library lists its parts');
  await lib('AMS1117','AMS1117-3.3');ok(!!await p.$('#ec-tplace'),'picking a part arms placement');
  ok(await p.evaluate(()=>document.querySelectorAll('#ec-lib [data-lib]').length)===2,'searching AMS1117 narrows the list to two regulators');
  await at(0,0);let S=await doc('sch');ok(S.parts.length===1&&S.parts[0].ref==='U1'&&S.parts[0].lcsc==='C6186'&&S.parts[0].x===0,'a click places U1, the AMS1117-3.3 with LCSC C6186',S.parts[0]);
  await lib('10uF','C0603-10uF');for(let i=0;i<3;i++){await p.keyboard.press('r');await sleep(80);}await at(-20.32,-2.54);await at(20.32,-2.54);await p.keyboard.press('Escape');await sleep(300);
  S=await doc('sch');ok(S.parts.length===3&&S.parts[1].ref==='C1'&&S.parts[2].ref==='C2'&&S.parts[1].rot===3,'two capacitors placed, rotated and numbered C1 and C2',S.parts.map(q=>q.ref+'@'+q.rot));
  const vin=await pin('U1','3'),vo=await pin('U1','2'),vt=await pin('U1','4'),c11=await pin('C1','1'),c21=await pin('C2','1');ok(vin&&vin.name==='VIN'&&vin.x===-7.62&&vin.y===2.54,'the VIN pin sits on the grid at -7.62, 2.54',vin);
  await click('#ec-twire','the Wire tool',250);await at(c11.x,c11.y);await at(vin.x,vin.y);await at(vo.x,vo.y);await at(c21.x,c21.y);await at(vo.x,vo.y);await at(vt.x,vt.y);
  S=await doc('sch');ok(S.wires.length===3,'three wires drawn with clicks',S.wires);
  await click('#ec-tpwr','the Power tool',250);for(const[r,k]of[['C1','2'],['C2','2'],['U1','1']]){const q=await pin(r,k);await at(q.x,q.y);}
  await p.select('#ec-pnm','5V');await at(c11.x,c11.y);await p.select('#ec-pnm','3V3');await at(c21.x,c21.y);
  let N=await net();ok(N.nets.join('|')===NETS,'the netlist joins the regulator, caps and power labels',N.nets);
  let st=await stat();ok(st[2]==='0'&&st[3]==='0','the electrical check shows no errors and no warnings',st);ok(!!await p.$('#ec-sclean'),'the clean-check note shows');
  await click('#ec-upd','the Update PCB button',600);const B=await doc('pcb');ok(B&&B.parts.length===3&&B.parts.find(q=>q.ref==='U1').pkg==='SOT-223'&&B.parts.find(q=>q.ref==='C1').lcsc==='C19702','Update PCB places U1 (SOT-223) and both capacitors with LCSC numbers',B&&B.parts.map(q=>q.ref+':'+q.pkg+':'+q.lcsc));
  ok(B&&B.nets.map(n=>n.name+':'+[...n.pins].sort().join(',')).sort().join('|')===NETS,'the board gets the same three nets',B&&B.nets);
  await click('#ec-tsel','the Select tool',250);const[a0,b0]=await scr(0,1.27),[a1]=await scr(5.08,1.27);await p.mouse.move(a0,b0);await p.mouse.down();for(let i=1;i<=7;i++){await p.mouse.move(a0+(a1-a0)*i/7,b0);await sleep(30);}await p.mouse.up();await sleep(450);
  S=await doc('sch');ok(S.parts[0].x===5.08,'dragging U1 moves it two grid steps to the right',S.parts[0].x);ok(S.wires.some(w=>w[2]===-2.54&&w[3]===2.54||w[0]===-2.54&&w[1]===2.54),'the wire on VIN follows the pin',S.wires);
  N=await net();ok(N.nets.join('|')===NETS,'the nets survive the drag',N.nets);
  await at(-14,2.54);S=await doc('sch');await p.keyboard.press('Delete');await sleep(450);const S2=await doc('sch');ok(S2.wires.length===S.wires.length-1,'clicking a wire and pressing Delete removes it',S2.wires.length);
  st=await stat();ok(+st[2]>=1,'cutting VIN off its supply shows an error',st);const eb=await p.$('#eright .ec-v[data-erc="4"]');ok(!!eb,'the check lists the unpowered VIN pin');eb&&await eb.click();await sleep(300);
  await p.click('#ecv');await p.keyboard.down('Control');await p.keyboard.press('z');await p.keyboard.up('Control');await sleep(450);ok((await doc('sch')).wires.length===S.wires.length,'Ctrl+Z brings the wire back');
  await at(20.32,-2.54);const ri=await p.$('#ec-sref'),hd=await p.evaluate(()=>{const i=document.getElementById('ec-sref');return i&&i.closest('.sec').querySelector('h3').textContent+' / '+i.value;});ok(!!ri&&/^Part C2 \/ C2$/.test(hd),'clicking C2 selects it and shows its reference field',hd);if(ri){await ri.click({clickCount:3});await ri.type('C1');await p.keyboard.press('Enter');await sleep(450);}
  ok(!!await p.$('#eright .ec-v[data-erc="10"]'),'a duplicate reference is flagged');await click('#ec-ann','the Number new parts button');S=await doc('sch');ok(S.parts.map(q=>q.ref).join()==='U1,C1,C2'&&!(await net()).erc.includes(10),'annotation gives every part a unique reference',S.parts.map(q=>q.ref));
  await click('#ec-addsheet','the add sheet button');S=await doc('sch');ok(S.sheets.length===2&&(await p.$$('#ec-sheets .btn')).length===3,'a second sheet appears with its own tab',S.sheets);
  await click('#ec-vpcb','the PCB view button');ok(await p.evaluate(()=>!!document.getElementById('ec-stat')),'the PCB view keeps its own panels');
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL exception '+(e.stack||e.message));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
