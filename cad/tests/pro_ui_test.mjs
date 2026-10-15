import {spawn,execFileSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve(new URL('../..',import.meta.url).pathname),P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),port=process.env.PORT||'18961',ud=fs.mkdtempSync('/tmp/proui-'),sleep=t=>new Promise(r=>setTimeout(r,t));
const srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'}),issuer=process.env.PRO_ISSUER||path.join(os.homedir(),'ai/amni-cad-desktop/tools/pro-license.mjs');
let fail=0,b;const ok=(c,m)=>{c||fail++;console.log(c?'PASS':'FAIL',m);};
try{b=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',userDataDir:ud,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();await p.setViewport({width:1440,height:900});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  const open=async()=>{await p.goto(`http://127.0.0.1:${port}/cad/`);await sleep(3500);await p.click('button[data-tab=draw]');await sleep(2500);};
  const btn=t=>p.evaluate(t=>{const x=[...document.querySelectorAll('button')].find(b=>b.offsetParent&&b.textContent.trim().startsWith(t));return x?x.classList.contains('pro-lock'):null;},t);
  await open();ok(await btn('Style from PDF')===true&&await btn('Edit format')===true,'Pro drawing buttons carry a PRO badge without a license');
  await p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.offsetParent&&b.textContent.trim().startsWith('Style from PDF')).click());await sleep(300);
  ok(await p.evaluate(()=>document.querySelector('#dlg').open&&document.querySelector('#dlg-b').textContent.includes('Style from PDF is part of Amni-CAD Pro')),'clicking Style from PDF opens the unlock dialog instead');
  await p.evaluate(()=>document.querySelector('#dlg').close());const sel=await p.evaluateHandle(()=>[...document.querySelectorAll('.fld')].find(f=>/^Classification/.test(f.querySelector('label')?.textContent.trim()||''))?.querySelector('select'));
  ok(!!sel.asElement(),'the classification picker is present');if(sel.asElement()){await sel.asElement().click();await sleep(300);ok(await p.evaluate(()=>document.querySelector('#dlg').open&&document.querySelector('#dlg-b').textContent.includes('Classification markings is part of')),'the classification picker asks for Pro');await p.evaluate(()=>document.querySelector('#dlg').close());}
  ok(await btn('PDF')===false&&await btn('SVG')===false,'free export buttons are not badged');
  if(fs.existsSync(issuer)){const lic=execFileSync('node',[issuer,'issue','--name','UI Test','--days','1','--no-ledger'],{encoding:'utf8'}).trim();await p.evaluate(l=>localStorage.setItem('amnicad.pro',l),lic);await open();
    ok(await btn('Style from PDF')===false,'with a license the badges disappear');await p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.offsetParent&&b.textContent.trim().startsWith('Edit format')).click());await sleep(800);
    ok(await p.evaluate(()=>!(document.querySelector('#dlg').open&&document.querySelector('#dlg-b').textContent.includes('part of Amni-CAD Pro'))),'with a license Edit format opens normally');}else console.log('SKIP licensed checks: no issuer');
  ok(!errs.length,'no page errors'+(errs.length?': '+errs.join(' | '):''));
}catch(e){fail++;console.log('FAIL',e.message);}finally{try{await b?.close();}catch{}srv.kill();fs.rmSync(ud,{recursive:true,force:true});}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
