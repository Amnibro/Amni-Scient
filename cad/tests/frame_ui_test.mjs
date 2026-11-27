import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18877,mcp:+process.env.E2E_MCP||18878,width:1440,height:900,pro:false}),p=E.page,sleep=E.sleep,shots=process.env.SHOTS||null;
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(typeof x==='string'?x:JSON.stringify(x)).slice(0,240):''));};
const click=async(sel,what)=>{const b=await p.$(sel);ok(!!b,'found '+what);b&&await b.click();await sleep(450);return b;},txt=sel=>p.evaluate(s=>(document.querySelector(s)||{}).textContent||'',sel),field=(sel,v)=>p.evaluate((s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},sel,v),shot=async n=>shots&&await p.screenshot({path:shots+'/'+n+'.png'});
const doc=()=>p.evaluate(()=>JSON.parse(JSON.stringify(window.amnicad.API.doc))),built=()=>p.evaluate(()=>window.amnicad.API.waitBuild()).then(()=>sleep(500)),vol=()=>p.evaluate(()=>{const m=window.amnicad.S.mesh;return m&&m.props?m.props.volume:0;}),btnText=t=>p.evaluate(t=>{const b=[...document.querySelectorAll('#tab-sim button')].find(b=>b.textContent.trim()===t);b&&b.click();return!!b;},t),colors=()=>p.evaluate(()=>{const c=document.querySelector('#fr-cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<d.length;i+=4*7)s.add(d[i]>>4<<8|d[i+1]>>4<<4|d[i+2]>>4);return s.size;});
try{
  await E.connect();await p.evaluate(()=>window.amnicad.loadDoc({units:'mm',material:'steel1018',params:[],features:[{id:'a',type:'box',w:100,d:40,h:20,z:-400}],sim:{type:'frame'}}));await built();const v0=await vol();
  await p.evaluate(()=>window.amnicad.API.setTab('sim'));await p.waitForSelector('#fr-sample',{timeout:60000}).catch(()=>{});ok(/Add a sample frame/.test(await txt('#tab-sim')),'the Beam frame study offers a sample frame when there is none',(await txt('#tab-sim')).slice(0,160));
  await click('#fr-sample','the Add a sample frame button');await built();await p.waitForSelector('#fr-count',{timeout:60000}).catch(()=>{});let D=await doc();const f=D.features.find(x=>x.type==='frame');
  ok(!!f&&f.members.length===3&&D.sim.frame.supports.length===2&&D.sim.frame.loads.length===1,'the sample adds a Beam frame feature with supports and a load',f&&f.members);
  ok(!D.errors&&(await vol())>v0*1.2,'the Beam frame feature builds a solid of tubes',[v0,await vol()]);
  ok(/4 joints, 3 members/.test(await txt('#fr-count')),'the study counts joints and members',await txt('#fr-count'));
  await click('#fr-run','the Run beam frame button');await p.waitForSelector('#fr-res,#fr-err',{timeout:60000});await sleep(300);const R=await txt('#fr-res');
  ok(/Largest deflection/.test(R)&&/Safety factor on yield/.test(R)&&/Buckling load factor/.test(R)&&/Weight/.test(R),'results show deflection, stress, safety, buckling and weight',R.slice(0,220));
  ok((await colors())>7,'the frame drawing colors the members',await colors());await shot('frame_disp');
  const legs=[];for(const k of['vm','N','M','buck']){await click('#fr-view button[data-k="'+k+'"]','the '+k+' view');legs.push(await txt('#fr-leg'));}
  ok(new Set(legs).size===4&&legs.every(Boolean),'each view has its own legend',legs);await shot('frame_buck');
  await p.evaluate(()=>window.amnicad.API.commit(d=>{d.sim.frame.supports=[{joint:1,type:'pinned'}];},{noEdit:true}));await p.evaluate(()=>window.amnicad.API.setTab('sim'));await sleep(700);await click('#fr-run','the Run button on an under-supported frame');
  ok(/move freely/.test(await txt('#fr-err')),'an under-supported frame says where it can move',await txt('#fr-err'));
  ok(await p.evaluate(()=>{const s=document.getElementById('sim-study');s.value='bolt';s.dispatchEvent(new Event('change',{bubbles:true}));return s.selectedOptions[0].textContent==='Bolted joint'&&s.selectedOptions[0].parentNode.label==='Design';}),'Bolted joint sits under Design in the study list');await p.waitForSelector('#bo-res,#bo-err',{timeout:60000}).catch(()=>{});const B0=await txt('#bo-res');
  ok(/Preload/.test(B0)&&/Tightening torque/.test(B0)&&/yield safety/.test(B0),'the bolt study sizes the default M10 8.8 bolt',B0.slice(0,200));
  const pre=async()=>(await doc()).sim.bolt;await p.select('#bo-size','M12');await sleep(600);ok((await pre()).size==='M12','choosing M12 stores the size',await pre());
  await field('#bo-fa','20000');await sleep(600);ok(/the joint opens/.test(await txt('#bo-res')),'a big pull opens the joint',(await txt('#bo-res')).slice(0,240));await shot('bolt_page');
  await field('#bo-fa','');await sleep(500);
  await p.evaluate(()=>window.amnicad.API.commit(d=>{d.sim.type='static';d.sim.supports=[{faces:{side:'-X'},type:'fixed'}];d.sim.loads=[{faces:{side:'+Z'},F:[0,0,-100]}];},{noEdit:true}));await p.evaluate(()=>window.amnicad.API.setTab('sim'));await sleep(900);
  await p.waitForFunction(()=>[...document.querySelectorAll('#tab-sim button')].some(b=>b.textContent.trim()==='Bolt preload'),{timeout:60000}).catch(()=>{});ok(await btnText('Bolt preload'),'the Stress load card offers a Bolt preload');await p.waitForFunction(()=>{const l=((window.amnicad.API.doc.sim||{}).loads||[])[0];return l&&l.bolt>0;},{timeout:60000}).catch(()=>{});D=await doc();const L=D.sim.loads[0];
  const want=await p.evaluate(async()=>(await import('./frame.js')).bolt({size:'M12',grade:'8.8',clamp:20}).FM_min_N);
  ok(L.bolt>0&&Math.abs(L.bolt/want-1)<1e-3&&L.F===undefined,'Bolt preload starts at the bolted joint minimum preload',[L.bolt,want]);
  ok(/Clamp force/.test(await txt('#tab-sim')),'the bolt load shows its clamp force field');
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3));
}catch(e){fail++;console.log('FAIL exception '+(e.stack||e.message));}
await E.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
