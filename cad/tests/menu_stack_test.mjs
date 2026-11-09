import {createRequire} from 'node:module';
import fs from 'node:fs';
const req=createRequire(import.meta.url);
const P=req(process.env.PUPPETEER||'/tmp/pptr/node_modules/puppeteer-core');
const chrome=process.env.CHROME||'/usr/bin/google-chrome-stable';
if(!fs.existsSync(chrome)){console.log('SKIP: no chrome');process.exit(0);}
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+x+')':''));};
const b=await P.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();
await p.setViewport({width:1280,height:800});
await p.goto('http://127.0.0.1:'+(process.env.PORT||8765)+'/cad/',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForFunction(()=>document.body.classList.contains('pro'),{timeout:30000});
const tabs=['edit','ai','sim','flow','make','draw','vault'];
for(const tab of tabs){
  if(tab==='make')await p.evaluate(()=>{const b=document.querySelector('#side-cmd [data-rc=make]')||document.querySelector('#ribbon [data-rc=make]');b&&b.click();});
  else if(tab!=='edit')await p.evaluate(t=>{const b=document.querySelector('#ws button[data-tab='+t+']');b&&b.click();},tab);
  await new Promise(r=>setTimeout(r,250));
  await p.click('#ui-menu > button');
  const hit=await p.evaluate(()=>{const pop=document.querySelector('#ui-menu .pop'),b=[...pop.querySelectorAll('button')].find(x=>x.offsetParent);if(!b)return 'no item';const r=b.getBoundingClientRect(),el=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(12,r.height/2));return el&&(el===b||b.contains(el)||el.closest('#ui-menu'))?'top':'under '+(el.id||el.className);});
  ok(hit==='top','Interface menu is topmost in '+tab,hit);
  await p.keyboard.press('Escape');
  await p.evaluate(()=>document.querySelectorAll('.menu').forEach(m=>m.classList.remove('open')));
}
await b.close();
console.log(fail?fail+' FAILED':'ALL PASS');
process.exit(fail?1:0);
