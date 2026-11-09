// Layout: one workspace menu, no ribbon bar, no permanent right dock.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const req=createRequire(import.meta.url);
const P=req(process.env.PUPPETEER||'/tmp/pptr/node_modules/puppeteer-core');
const chrome=process.env.CHROME||'/usr/bin/google-chrome-stable';
const root=path.resolve(new URL('../..',import.meta.url).pathname);
const port=process.env.PORT||'8765';
const shots=process.env.SHOTS||'';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!=null&&x!==''?' ('+x+')':''));};
if(!fs.existsSync(chrome)||!fs.existsSync(path.dirname(process.env.PUPPETEER||'/tmp/pptr/node_modules/puppeteer-core'))){console.log('SKIP: chrome or puppeteer missing');process.exit(0);}
const {spawn}=await import('node:child_process');
const own=!process.env.PORT;const srv=own&&spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const sleep=t=>new Promise(r=>setTimeout(r,t));
const b=await P.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const audit=()=>p.evaluate(()=>{
  const bad=[];
  if(document.documentElement.scrollWidth>innerWidth+1)bad.push('page '+document.documentElement.scrollWidth+'>'+innerWidth);
  const vis=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth;};
  for(const el of document.querySelectorAll('header button,#nav-label,#m-space,.vtools button,#side-list button,#palette button,#m-spaces .m-list button,#sheet-x')){
    if(!vis(el))continue;const r=el.getBoundingClientRect(),name=(el.getAttribute('aria-label')||el.textContent||el.id||'').trim().replace(/\s+/g,' ').slice(0,40);
    if(r.right>innerWidth+2||r.left<-2)bad.push('off '+name);
    const s=getComputedStyle(el);if(el.scrollWidth>el.clientWidth+2&&(s.overflowX==='hidden'||s.overflowX==='clip'||s.textOverflow==='ellipsis'))bad.push('clip '+name);
  }
  return bad;
});
const go=async(w,h,fs)=>{await p.setViewport({width:w,height:h,isMobile:w<700,hasTouch:w<700,deviceScaleFactor:1});
  await p.goto('http://127.0.0.1:'+port+'/cad/',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction(()=>document.getElementById('nav-now')&&document.body.classList.contains('pro'),{timeout:30000});
  await p.evaluate(fs=>{document.documentElement.style.setProperty('--fs',String(fs));},fs);
  await sleep(350);};
try{
  await go(1440,900,1);
  ok(!errs.length,'no page errors',errs.join('|'));
  const home=await p.evaluate(()=>({label:document.getElementById('nav-label').textContent,ribbon:getComputedStyle(document.getElementById('ribbon')).display,right:getComputedStyle(document.getElementById('right')).display,pipe:!!document.getElementById('pipe'),sheet:document.body.classList.contains('sheet-on'),cols:getComputedStyle(document.querySelector('main')).gridTemplateColumns.split(' ').length}));
  ok(home.label==='Part'&&home.ribbon==='none'&&home.right==='none'&&!home.pipe&&!home.sheet&&home.cols===2,'home is one menu, two columns, and no right dock',JSON.stringify(home));
  ok(!(await audit()).length,'1440 home has no clipped or overflowing labels',(await audit()).join(';'));
  await p.focus('#nav-now');await p.keyboard.press('Enter');await p.keyboard.press('ArrowDown');
  const k1=await p.evaluate(()=>({open:document.getElementById('nav-menu').classList.contains('open'),focus:document.activeElement.textContent.trim(),exp:document.getElementById('nav-now').getAttribute('aria-expanded')}));
  ok(k1.open&&k1.exp==='true'&&k1.focus==='Part','keyboard opens the menu and moves to Part',JSON.stringify(k1));
  const menu=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#ws button')];return{texts:bs.map(b=>b.textContent.trim()),clip:bs.filter(b=>{const r=b.getBoundingClientRect();return r.width>1&&(b.scrollWidth>b.clientWidth+2||r.right>innerWidth+2);}).map(b=>b.textContent.trim())};});
  ok(menu.texts.join('|')==='Guided|Part|Form|Assembly|Tooling|AI|FEA|CFD|Mold|Drawing|Vault'&&!menu.clip.length,'every workspace and tool name is fully visible in the menu',menu.clip.join(','));
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_menu.png')});
  await p.keyboard.press('Escape');
  ok(await p.evaluate(()=>!document.getElementById('nav-menu').classList.contains('open')&&document.activeElement.id==='nav-now'),'Escape closes the menu and returns focus');
  await p.evaluate(()=>document.querySelector('#ws button[data-tab=ai]').click());await sleep(400);
  const ai=await p.evaluate(()=>({label:document.getElementById('nav-label').textContent,sheet:document.body.classList.contains('sheet-on'),right:getComputedStyle(document.getElementById('right')).display,pipe:!!document.getElementById('pipe'),rtabs:getComputedStyle(document.querySelector('#right .rtabs')).display,part:document.querySelector('#ws button[data-ws=part]').classList.contains('on'),text:/Local model/.test(document.getElementById('tab-ai').innerText)&&/Not available to download/.test(document.getElementById('tab-ai').innerText)}));
  ok(ai.sheet&&ai.right==='flex'&&ai.rtabs==='none'&&!ai.pipe&&ai.part&&/Part/.test(ai.label)&&/AI/.test(ai.label)&&/Local model/.test(await p.evaluate(()=>document.getElementById('tab-ai').innerText))&&/Subscription or key/.test(await p.evaluate(()=>document.getElementById('tab-ai').innerText)),'AI opens a sheet, keeps Part, and does not rebuild the dock',JSON.stringify(ai));
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_ai.png')});
  await p.click('#sheet-x');await sleep(200);
  ok(await p.evaluate(()=>!document.body.classList.contains('sheet-on')&&getComputedStyle(document.getElementById('right')).display==='none'&&document.getElementById('nav-label').textContent==='Part'),'Close returns to the model with no right dock');
  await p.waitForFunction(()=>document.querySelector('#tree .feat'),{timeout:30000});
  await p.click('#tree .feat');await sleep(300);
  ok(await p.evaluate(()=>document.body.classList.contains('pm-on')&&getComputedStyle(document.getElementById('right')).display==='none'&&!!document.querySelector('#pm #tab-edit')&&getComputedStyle(document.querySelector('#palette').closest('.sec')).display==='none'),'editing opens on the left, not in a right dock');
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_edit.png')});
  await p.evaluate(()=>{document.querySelector('#pm .okx.ok').click();});await sleep(200);
  await p.evaluate(()=>document.querySelector('#side-cmd [data-rc=make]').click());await sleep(500);
  ok(await p.evaluate(()=>document.body.classList.contains('sheet-on')&&/Quote|G-code|machine/i.test(document.getElementById('tab-make').innerText)),'Instant Quote opens in the tool sheet');
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_make.png')});
  await p.click('#sheet-x');
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_home.png')});
  for(const[w,h,fs,name]of[[1440,900,1.3,'z1440'],[1280,800,1,'d1280'],[1280,800,1.3,'z1280'],[1024,768,1,'d1024'],[1024,768,1.3,'z1024'],[768,900,1,'d768'],[768,900,1.3,'z768'],[390,844,1,'p390'],[390,844,1.3,'zp390'],[360,740,1,'p360'],[360,740,1.3,'zp360'],[667,375,1,'land'],[667,375,1.3,'zland'],[844,390,1,'wide-land']]){
    await go(w,h,fs);const bad=await audit();ok(!bad.length,name+' has no clipped labels or page overflow',bad.join(';'));
    ok(await p.evaluate(()=>getComputedStyle(document.getElementById('ribbon')).display==='none'&&!document.getElementById('pipe')),name+' hides the ribbon and the right-hand step strip');
    if(shots&&fs===1&&['d1280','d1024','d768','p390','p360','land','wide-land'].includes(name))await p.screenshot({path:path.join(shots,'after_'+name+'_home.png')});
  }
  await go(390,844,1);await p.click('#m-space');await p.waitForSelector('#m-spaces');
  const sheet=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#m-spaces .m-list button')].map(b=>b.textContent.trim());const bad=bs.filter(b=>{const e=[...document.querySelectorAll('#m-spaces button')].find(x=>x.textContent.trim()===b);return e.scrollWidth>e.clientWidth+2;});return{bs,bad};});
  ok(sheet.bs.includes('Guided')&&sheet.bs.includes('Part')&&sheet.bs.includes('AI')&&sheet.bs.includes('Instant Quote')&&!sheet.bad.length,'phone sheet lists workspaces, AI and quote with full labels',sheet.bad.join(','));
  if(shots)await p.screenshot({path:path.join(shots,'after_p390_sheet.png')});
  await go(667,375,1);await p.click('#m-space');await p.waitForSelector('#m-spaces');
  ok(!(await audit()).length,'landscape phone sheet does not overflow',(await audit()).join(';'));
  if(shots)await p.screenshot({path:path.join(shots,'after_land_sheet.png')});
}catch(e){ok(false,'layout test threw',e.stack||e.message);}
await b.close();own&&srv&&srv.kill();
console.log(fail?fail+' FAILED':'ALL PASS');
process.exit(fail?1:0);
