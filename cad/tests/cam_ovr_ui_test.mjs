// Make tab: Beta notice, export confirmation, manual overrides and the raw G-code editor in the browser.
import {spawn} from 'node:child_process';import os from 'node:os';import path from 'node:path';import fs from 'node:fs';import {createRequire} from 'node:module';
const root=path.resolve(new URL('../..',import.meta.url).pathname),port=process.env.PORT||'18751',P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),sleep=t=>new Promise(r=>setTimeout(r,t));
const out=process.env.SHOTS||path.join(os.tmpdir(),'cam-ovr-shots');fs.mkdirSync(out,{recursive:true});
let bad=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));c||bad++;};
const srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'}),ud=fs.mkdtempSync(path.join(os.tmpdir(),'camovr-'));let br;
const PLATE={name:'Override plate',units:'in',params:[],material:'al6061',features:[{id:'a',type:'box',w:6,d:4,h:0.25},{id:'b',type:'hole',plane:'face',face:{side:'+Z'},d:0.5,thru:true,pts:[[-2.25,-1.25],[2.25,1.25]]}]};
const BLK={name:'Override block',units:'in',params:[],material:'al6061',features:[{id:'a',type:'box',w:3,d:2,h:1},{id:'p',type:'extrude',plane:'XY',offset:1,depth:0.4,op:'cut',dir:'-',shapes:[{k:'rect',w:1.5,h:1,r:0.25}]}]};
const WAIT=async()=>{const C=await import('./cam.js'),t=Date.now();await new Promise(r=>setTimeout(r,400));while((C.CS.busy||!C.CS.res)&&Date.now()-t<300000)await new Promise(r=>setTimeout(r,250));await new Promise(r=>setTimeout(r,300));const x=C.CS.res;return x&&{ok:x.ok,route:x.route,errors:x.errors,g:(x.setups||[]).map(s=>s.gcode),files:(x.setups||[]).map(s=>s.file)};};
const shot=async(p,sel,name)=>{const el=await p.$(sel);if(el){await el.evaluate(e=>e.scrollIntoView({block:'start'}));await sleep(150);}await p.screenshot({path:path.join(out,name)});};
try{await sleep(700);br=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',userDataDir:ud,protocolTimeout:600000,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await br.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.setViewport({width:1440,height:1000});await p.goto(`http://127.0.0.1:${port}/cad/`);await p.waitForFunction(()=>window.amnicad&&window.amnicad.API,{timeout:60000});
  await p.evaluate(()=>{window.__dls=[];const A=window.amnicad.API;A.download=(b,n)=>{b.text().then(t=>window.__dls.push({n,t}));};});
  await p.evaluate(async d=>{const am=window.amnicad;am.loadDoc(d);await am.API.waitBuild();am.setTab('make');},PLATE);await p.waitForSelector('#mk-go:not([disabled])',{timeout:60000});
  const bn=await p.evaluate(()=>{const b=document.querySelector('#mk-beta');return b&&{t:b.textContent,vis:b.offsetHeight>0,inCam:!!b.closest('#mk-cam')};});
  ok(bn&&bn.vis&&bn.inCam&&/Beta: verify toolpaths in simulation and dry-run before cutting/.test(bn.t)&&!/\b(I|we|our|my)\b/.test(bn.t),'the CAM panel shows the Beta notice, with no first-person wording',bn&&bn.t);
  ok(await p.$('#mk-ovr')!==null,'the CAM panel has a Manual overrides (advanced) section');
  await p.click('#mk-go');let r=await p.evaluate(WAIT);ok(r&&r.ok&&r.route==='flat','the plate makes a flat program',r&&{route:r.route,err:r.errors});
  const g0=r.g[0];ok(/beta: verify toolpaths in simulation and dry-run before cutting/i.test(g0.split('\n').slice(0,4).join('\n')),'the posted program carries the Beta comment in its header',g0.split('\n').slice(0,3).join(' | '));
  await shot(p,'#mk-cam','cam-panel-beta.png');
  // Export confirmation
  await p.click('#mk-dl0');await p.waitForSelector('#co-confirm',{timeout:5000});const cf=await p.evaluate(()=>document.querySelector('#co-confirm').textContent);
  ok(/Beta: verify toolpaths in simulation and dry-run before cutting/.test(cf)&&!/\b(I|we|our|my)\b/.test(cf),'downloading G-code first asks to confirm the Beta notice',cf.slice(0,90));
  await p.screenshot({path:path.join(out,'export-beta-confirm.png')});
  await p.click('#co-cancel');await sleep(300);ok(!(await p.$('#co-confirm'))&&(await p.evaluate(()=>window.__dls.length))===0,'Cancel closes the dialog and downloads nothing');
  await p.click('#mk-dl0');await p.waitForSelector('#co-ok');await p.click('#co-ok');await p.waitForFunction(()=>window.__dls.length>0,{timeout:5000});
  const d0=await p.evaluate(()=>window.__dls[0]);ok(d0.n===r.files[0]&&/beta: verify toolpaths/i.test(d0.t),'Export downloads the file with the Beta header',d0.n);
  // Parameter override: cutting feed, persists in the doc, regenerates
  await p.evaluate(()=>{document.querySelector('#mk-ovr').open=true;});const inp=await p.$('#mk-ovr input[data-k=feed]');ok(!!inp,'cutting feed is an editable override');
  await p.evaluate(()=>{const i=document.querySelector('#mk-ovr input[data-k=feed]');i.value='37';i.dispatchEvent(new Event('change'));});await sleep(300);
  const st=await p.evaluate(()=>({p:JSON.parse(JSON.stringify(window.amnicad.API.doc.make.cam.ovr||{})),go:!!document.querySelector('#mk-go:not([disabled])'),open:document.querySelector('#mk-ovr').open,lab:document.querySelector('#mk-ovr summary').textContent}));
  ok(st.p.p&&Math.abs(st.p.p.feed-37*25.4)<1e-6&&st.open&&/1 parameter/.test(st.lab),'the feed override is stored in mm/min in the document and the panel says so',st);
  await p.click('#mk-go');r=await p.evaluate(WAIT);const F=[...r.g[0].matchAll(/G1[^\n]*F(\d+(\.\d+)?)/g)].map(m=>+m[1]);
  ok(r.ok&&F.includes(37),'the new program cuts at the override feed',[...new Set(F)].join(','));
  const sv=await p.evaluate(()=>JSON.stringify(window.amnicad.API.doc));const rt=JSON.parse(sv);ok(rt.make&&rt.make.cam&&rt.make.cam.ovr&&rt.make.cam.ovr.p.feed>0,'overrides are saved with the part file');
  // Raw editor
  await p.click('#mk-edit0');await p.waitForSelector('#co-edit textarea');
  const ed=await p.evaluate(async()=>{const ta=document.querySelector('#co-ta'),L=ta.value.split('\n'),i=L.findIndex(l=>/^G1 .*Z/.test(l)||/^G1 Z/.test(l)),j=L.findIndex((l,k)=>k>i+3&&/^G1 /.test(l));const orig=[L[i],L[j]];L[i]=L[i]+' (HAND EDIT)';L.splice(j,1);ta.value=L.join('\n');ta.dispatchEvent(new Event('input'));await new Promise(r=>setTimeout(r,600));return{orig,txt:ta.value,a:document.querySelectorAll('#co-diff .a').length,d:document.querySelectorAll('#co-diff .d').length,cnt:document.querySelector('#co-cnt').textContent};});
  ok(ed.a===1&&ed.d===2&&/\+1 \/ −2/.test(ed.cnt),'the editor shows a live diff against the generated program',ed.cnt);
  await p.screenshot({path:path.join(out,'gcode-editor-diff.png')});
  await p.click('#co-ed-save');await sleep(500);
  const af=await p.evaluate(async()=>{const C=await import('./cam.js'),s=C.CS.res&&C.CS.res.setups[0];return{g:s&&s.gcode,st:document.querySelector('.mk-ovr-st')&&document.querySelector('.mk-ovr-st').textContent,ed:Object.keys((window.amnicad.API.doc.make.cam.ovr||{}).edits||{}).length};});
  ok(af.g&&af.g.split('\n').filter(l=>!/beta: verify toolpaths/i.test(l)).join('\n')===ed.txt&&af.ed===1,'saving applies the hand edits to the program without regenerating and stores them',af.ed);
  ok(/1 hand edit applied|hand edits? applied/.test(af.st||''),'the setup card flags the manual overrides',af.st);
  await shot(p,'#mk-cam .mk-ovr-st','overrides-flagged.png');
  await p.click('#mk-go');r=await p.evaluate(WAIT);ok(r.ok&&r.g[0].includes('(HAND EDIT)')&&/beta: verify/i.test(r.g[0]),'hand edits survive making the program again');
  await p.click('#mk-dl0');await p.waitForSelector('#co-ok');await p.click('#co-ok');await p.waitForFunction(()=>window.__dls.length>1,{timeout:5000});ok((await p.evaluate(()=>window.__dls[1].t)).includes('(HAND EDIT)'),'the downloaded file includes the hand edits');
  await p.click('#mk-edit0');await p.waitForSelector('#co-ed-reset:not([disabled])');await p.click('#co-ed-reset');await sleep(400);
  const rs=await p.evaluate(async()=>{const C=await import('./cam.js');return{g:C.CS.res.setups[0].gcode,e:((window.amnicad.API.doc.make.cam.ovr||{}).edits)};});ok(!rs.g.includes('(HAND EDIT)')&&!rs.e,'Reset to generated drops the hand edits for that file');
  await p.evaluate(()=>{document.querySelector('#mk-ovr').open=true;});await shot(p,'#mk-ovr','overrides-panel-flat.png');
  await p.click('#mk-ovr-reset');await sleep(300);ok(!(await p.evaluate(()=>window.amnicad.API.doc.make.cam.ovr)),'Reset all to generated clears every override');
  // Solid: per-operation overrides
  await p.evaluate(async d=>{const am=window.amnicad;am.loadDoc(d);await am.API.waitBuild();am.setTab('make');},BLK);await p.waitForSelector('#mk-go:not([disabled])',{timeout:60000});
  await p.evaluate(()=>{const s=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>/VF-2/.test(o.textContent)));const o=[...s.options].find(o=>/VF-2/.test(o.textContent));s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(700);
  await p.evaluate(()=>{document.querySelector('#mk-ovr').open=true;const i=document.querySelector('#mk-ovr input[data-k=scallop]');i.value='0.004';i.dispatchEvent(new Event('change'));});await sleep(300);
  await p.waitForSelector('#mk-go:not([disabled])');await p.click('#mk-go');r=await p.evaluate(WAIT);ok(r&&r.ok&&r.route==='solid','the block makes a solid program with a scallop override',r&&{route:r.route,err:r.errors});
  const rows=await p.evaluate(()=>[...document.querySelectorAll('#mk-ovr-ops tr[data-op]')].map(t=>t.dataset.op+' '+t.cells[0].textContent));ok(rows.length>=3,'each operation gets a feed, spindle and skip row',rows.slice(0,4).join(' | '));
  const op=await p.evaluate(async()=>{const C=await import('./cam.js'),x0=C.CS.res,g0=x0.setups[0].gcode,tr=[...document.querySelectorAll('#mk-ovr-ops tr[data-op]')].find(t=>/Finish/.test(t.cells[0].textContent))||document.querySelector('#mk-ovr-ops tr[data-op]'),key=tr.dataset.op,i=tr.querySelector('input[data-f=feed_pct]');i.value='50';i.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,400));const x1=C.CS.res,s=x1.setups[0],o=window.amnicad.API.doc.make.cam.ovr;return{same:x0===x1,key,diff:g0!==s.gcode,notes:s.ovr.notes,stored:o&&o.ops&&o.ops[key]};});
  ok(op.same&&op.diff&&op.stored&&op.stored.feed_pct===50,'a per-operation feed change re-applies to the current program and is stored',op.key);
  const sk=await p.evaluate(async()=>{const C=await import('./cam.js'),tr=[...document.querySelectorAll('#mk-ovr-ops tr[data-op]')].pop(),n0=C.CS.res.setups[0].gcode.split('\n').length,c=tr.querySelector('input[data-f=skip]');c.checked=true;c.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,400));const s=C.CS.res.setups.find(s=>s.ovr&&s.ovr.notes.some(n=>/skip/i.test(n)));return{n0,notes:C.CS.res.setups.flatMap(s=>s.ovr.notes),has:!!s};});
  ok(sk.has,'skipping an operation removes its moves and notes it',sk.notes.join(' / '));
  await shot(p,'#mk-ovr','overrides-panel-solid.png');await shot(p,'#mk-cam .mk-ovr-st','overrides-flagged-solid.png');
  ok(!errs.length,'no page errors',errs.join(' | '));
}catch(e){bad++;console.log('FAIL',e.message);}finally{br&&await br.close();srv.kill();fs.rmSync(ud,{recursive:true,force:true});}
console.log(bad?bad+' FAILED':'ALL PASS');process.exit(bad?1:0);
