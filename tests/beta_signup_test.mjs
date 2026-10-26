import {spawn} from 'node:child_process';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve(new URL('..',import.meta.url).pathname),PORT=+process.env.BETA_PORT||18797,P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),sleep=t=>new Promise(r=>setTimeout(r,t));
const NAMES={waystone:'Waystone',pompom:'Pom-Pom Grove',chat:'Amni-Chat',learn:'Amni-Learn',type:'Amni-Type',crypt:'Amni-Crypt'},ALL=['chat','learn','type','map','crypt','pompom','waystone','contaigion','humainity'],PAGES=[['beta.html',ALL],['beta-apk.html',['pompom','waystone','chat','map'],'android'],['waystone.html',['waystone']],['pom-pom-grove.html',['pompom']],['amni-chat.html',['chat']],['amni-learn.html',['learn']],['amni-type.html',['type']],['amni-crypt.html',['crypt']]];
const srv=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'}),fails=[],ok=(c,m)=>c||fails.push(m);
let mine=false;for(let i=0;i<40&&!mine;i++){try{mine=(await (await fetch(`http://127.0.0.1:${PORT}/beta.html`)).text()).includes('id="beta-signup"');}catch{}mine||await sleep(250);}
if(!mine){srv.kill();console.error(`port ${PORT} is not serving this checkout (busy?); set BETA_PORT`);process.exit(1);}
const b=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',args:['--no-sandbox']});
const open=async(page,w)=>{const p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));await p.setViewport({width:w,height:900,isMobile:w<600,hasTouch:w<600});await p.setRequestInterception(true);p.on('request',r=>r.url().startsWith(`http://127.0.0.1:${PORT}/`)?r.continue():r.abort());await p.evaluateOnNewDocument(()=>{const of=window.fetch;window.__sent=[];window.fetch=(u,o)=>String(u).includes('amni-beta')?(window.__sent.push(JSON.parse(o.body)),Promise.resolve(new Response('{"ok":true}',{status:200,headers:{'Content-Type':'application/json'}}))):of(u,o);});await p.goto(`http://127.0.0.1:${PORT}/${page}`,{waitUntil:'domcontentloaded'});await p.waitForSelector('#beta-form',{timeout:15000});return{p,errs};};
const submit=async p=>{await p.$eval('#bf-email',e=>e.value='tester@example.com');await p.$eval('#bf-consent',e=>e.checked||e.click());await p.click('#bf-submit');await sleep(300);return p.evaluate(()=>({sent:window.__sent.slice(),done:!document.getElementById('beta-done').hidden,msg:document.getElementById('beta-done-msg').textContent,play:[...document.querySelectorAll('#beta-done-links a')].map(a=>a.getAttribute('href')),tf:[...document.querySelectorAll('#beta-done-tflinks a')].map(a=>a.getAttribute('href')),appsErr:document.getElementById('bf-apps-err')?.textContent||''}));};
try{
  for(const [page,apps,fixed] of PAGES)for(const w of [390,1280]){
    const {p,errs}=await open(page,w),n=`${page}@${w}`;
    const s=await p.evaluate(()=>{const fb=document.querySelector('.b-future'),r=x=>x.getBoundingClientRect();return{boxes:[...document.querySelectorAll('.b-checks input')].map(i=>[i.value,i.checked]),radios:document.querySelectorAll('input[name=device]').length,futureClear:r(fb.querySelector('input')).right<=r(fb.querySelector('strong')).left,futureCase:getComputedStyle(fb.querySelector('small')).textTransform,overflowX:document.documentElement.scrollWidth-innerWidth,clipped:[...document.querySelectorAll('.b-check')].filter(l=>l.scrollWidth>l.clientWidth+1).length,hint:document.getElementById('bf-email-hint').textContent,btn:document.getElementById('bf-submit').textContent}});
    ok(!errs.length,`${n}: page errors ${errs}`);
    ok(apps.length>1?JSON.stringify(s.boxes)===JSON.stringify(apps.map(k=>[k,true])):!s.boxes.length,`${n}: picker ${JSON.stringify(s.boxes)}`);
    ok(s.radios===(fixed?0:3),`${n}: device radios ${s.radios}`);
    ok(s.futureClear&&s.futureCase==='none',`${n}: future box layout ${s.futureClear} ${s.futureCase}`);
    ok(s.overflowX<=1,`${n}: page scrolls sideways by ${s.overflowX}px`);
    ok(!s.clipped,`${n}: ${s.clipped} app rows clipped`);
    ok(s.hint.length>20,`${n}: empty email hint`);
    ok(s.btn===(apps.length>1?'Sign me up':'Sign me up for '+NAMES[apps[0]]),`${n}: button ${s.btn}`);
    if(w===1280){
      if(apps.length>1){await p.click('#bf-all');const none=await p.$$eval('.b-checks input:checked',x=>x.length);ok(!none,`${n}: Clear all left ${none}`);const r0=await submit(p);ok(!r0.sent.length&&r0.appsErr.includes('Pick'),`${n}: empty pick was sent`);await p.click('#bf-all');}
      const r=await submit(p);ok(r.done&&r.sent.length===1,`${n}: submit ${JSON.stringify(r)}`);const body=r.sent[0]||{};ok(JSON.stringify([...body.apps||[]].sort())===JSON.stringify([...apps].sort())&&body.device===(fixed||'android')&&body.consent===true,`${n}: body ${JSON.stringify(body)}`);ok(r.msg.length>10,`${n}: no thank-you text`);
      ok(r.play.length===apps.filter(k=>!['pompom','waystone'].includes(k)).length,`${n}: Android links ${r.play}`);
    }
    await p.close();
  }
  {const {p}=await open('beta.html',1280);await p.click('#bf-all');await p.click('input[name=device][value=iphone]');await p.click('a[data-app=waystone][data-device=android]');const s=await p.evaluate(()=>[document.querySelector('.b-checks input[value=waystone]').checked,document.querySelector('input[name=device]:checked').value,document.querySelectorAll('.b-checks input:checked').length]);ok(s[0]&&s[1]==='android'&&s[2]===1,`beta.html card button: ${s}`);await p.close();}
  {const {p}=await open('waystone.html',1280);await p.click('input[name=device][value=iphone]');const h=await p.$eval('#bf-email-hint',e=>e.textContent);ok(h.includes('Waystone is open on TestFlight'),`waystone iPhone hint: ${h}`);const r=await submit(p);ok(r.tf.length===1&&r.tf[0].endsWith('hSqUwnTr')&&!r.play.length,`waystone iPhone links ${JSON.stringify(r)}`);await p.close();}
  {const {p}=await open('amni-crypt.html',1280);await p.click('input[name=device][value=both]');await p.click('.b-future input');const r=await submit(p);ok(r.sent[0]?.apps.join()==='crypt,future'&&r.msg.includes('iPhone beta for Amni-Crypt')&&r.play[0]==='beta-play.html?app=crypt',`crypt both ${JSON.stringify(r)}`);await p.close();}
}finally{await b.close();srv.kill();}
console.log(fails.length?'FAIL\n'+fails.join('\n'):`ALL PASS (${PAGES.length} pages x 2 widths + flows)`);process.exit(fails.length?1:0);
