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
  await p.evaluate(fs=>{const L=window.amnicad&&window.amnicad.API&&window.amnicad.API.look;if(L)L.apply({...L.get(),fs:Math.round(fs*100)});else document.documentElement.style.setProperty('--fs',String(fs));},fs);
  await p.waitForFunction(fs=>Math.abs(parseFloat(getComputedStyle(document.querySelector('header')).zoom)-(fs>1?fs:1))<0.05,{},fs);
  await sleep(350);};
try{
  await go(1440,900,1);
  ok(!errs.length,'no page errors',errs.join('|'));
  const home=await p.evaluate(()=>({label:document.getElementById('nav-label').textContent,ribbon:getComputedStyle(document.getElementById('ribbon')).display,right:getComputedStyle(document.getElementById('right')).display,pipe:!!document.getElementById('pipe'),sheet:document.body.classList.contains('sheet-on'),guide:document.body.classList.contains('guide-mode'),btn:!!document.getElementById('b-guide'),cols:getComputedStyle(document.querySelector('main')).gridTemplateColumns.split(' ').length}));
  ok(home.label==='Part'&&home.ribbon==='flex'&&home.right==='none'&&!home.pipe&&!home.sheet&&home.cols===2&&!home.guide&&home.btn,'home opens on Part, with a ribbon and a Guided design button',JSON.stringify(home));
  ok(!(await audit()).length,'1440 home has no clipped or overflowing labels',(await audit()).join(';'));
  await p.focus('#nav-now');await p.keyboard.press('Enter');await p.keyboard.press('ArrowDown');
  const k1=await p.evaluate(()=>({open:document.getElementById('nav-menu').classList.contains('open'),focus:document.activeElement.textContent.trim(),exp:document.getElementById('nav-now').getAttribute('aria-expanded')}));
  ok(k1.open&&k1.exp==='true'&&(k1.focus==='Part'||k1.focus==='Form'),'keyboard opens the menu and moves through it',JSON.stringify(k1));
  const menu=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#ws button')];return{texts:bs.map(b=>b.textContent.trim()),clip:bs.filter(b=>{const r=b.getBoundingClientRect();return r.width>1&&(b.scrollWidth>b.clientWidth+2||r.right>innerWidth+2);}).map(b=>b.textContent.trim())};});
  ok(menu.texts[0]==='Part'&&menu.texts.includes('Vault')&&!menu.texts.includes('Guided')&&!menu.clip.length,'the workspace menu starts at Part and does not clip',menu.texts.join(','));
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_menu.png')});
  await p.keyboard.press('Escape');
  ok(await p.evaluate(()=>!document.getElementById('nav-menu').classList.contains('open')&&document.activeElement.id==='nav-now'),'Escape closes the menu and returns focus');
  await p.evaluate(()=>document.querySelector('#ws button[data-tab=ai]').click());await sleep(400);
  const ai=await p.evaluate(()=>({label:document.getElementById('nav-label').textContent,sheet:document.body.classList.contains('sheet-on'),right:getComputedStyle(document.getElementById('right')).display,pipe:!!document.getElementById('pipe'),rtabs:getComputedStyle(document.querySelector('#right .rtabs')).display,part:document.querySelector('#ws button[data-ws=part]').classList.contains('on'),text:/Local model/.test(document.getElementById('tab-ai').innerText)&&/Not available to download/.test(document.getElementById('tab-ai').innerText)}));
  const place=await p.evaluate(()=>{const L=document.getElementById('left').getBoundingClientRect(),R=document.getElementById('right').getBoundingClientRect(),V=document.getElementById('vp').getBoundingClientRect();return{gap:Math.round(R.left-L.right),right:Math.round(innerWidth-R.right),w:Math.round(R.width),vw:Math.round(V.width),title:document.getElementById('work-title').textContent,back:document.getElementById('sheet-x').textContent};});
  const dock=await p.evaluate(()=>{const L=document.getElementById('left').getBoundingClientRect(),R=document.getElementById('right').getBoundingClientRect(),V=document.getElementById('vp').getBoundingClientRect(),c=document.getElementById('cv').getBoundingClientRect(),mid=document.elementFromPoint(V.left+V.width/2,V.top+V.height/2);return {gap:Math.round(R.left-L.right),model:Math.round(V.left-R.right),vw:Math.round(V.width),rw:Math.round(R.width),far:Math.round(innerWidth-R.right),tree:getComputedStyle(document.getElementById('tree')).display,hit:mid&&(mid.id==='cv'||mid.closest('#vp'))};});
  ok(ai.sheet&&ai.right==='flex'&&dock.gap<=4&&dock.model<=8&&dock.vw>180&&dock.far>180&&dock.rw>200&&dock.rw<700&&dock.tree!=='none'&&dock.hit&&place.title==='AI'&&place.back==='Close','AI docks beside the feature tree and the model stays visible',JSON.stringify({...place,...dock}));
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_ai.png')});
  await p.click('#sheet-x');await sleep(200);
  ok(await p.evaluate(()=>!document.body.classList.contains('sheet-on')&&getComputedStyle(document.getElementById('right')).display==='none'&&document.getElementById('nav-label').textContent==='Part'),'Close returns to the model with no right dock');
  await p.waitForFunction(()=>document.querySelector('#tree .feat'),{timeout:30000});
  await p.click('#tree .feat');await sleep(300);
  ok(await p.evaluate(()=>{const L=document.getElementById('left').getBoundingClientRect(),R=document.getElementById('right').getBoundingClientRect(),V=document.getElementById('vp').getBoundingClientRect();return document.body.classList.contains('sheet-on')&&getComputedStyle(document.getElementById('tree')).display!=='none'&&Math.abs(R.left-L.right)<8&&V.width>180&&document.getElementById('work-title').textContent==='Properties';}),'editing opens beside the tree and the model stays visible');
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_edit.png')});
  await p.click('#sheet-x');await sleep(200);
  await p.evaluate(()=>document.querySelector('#side-cmd [data-rc=make]').click());await sleep(500);
  ok(await p.evaluate(()=>{const L=document.getElementById('left').getBoundingClientRect(),R=document.getElementById('right').getBoundingClientRect(),V=document.getElementById('vp').getBoundingClientRect();return document.body.classList.contains('sheet-on')&&document.getElementById('tab-make').classList.contains('on')&&Math.abs(R.left-L.right)<8&&V.width>180&&innerWidth-R.right>180&&document.getElementById('work-title').textContent==='Manufacturing';}),'Manufacturing docks beside the tree and the model stays visible');
  for(const [tab,title,id] of [['sim','FEA','tab-sim'],['vault','Vault','tab-vault']]){
    await p.evaluate(t=>document.querySelector('#ws button[data-tab='+t+']').click(),tab);await sleep(400);
    const g=await p.evaluate((title,id)=>{const L=document.getElementById('left').getBoundingClientRect(),R=document.getElementById('right').getBoundingClientRect(),V=document.getElementById('vp').getBoundingClientRect();return{title:document.getElementById('work-title').textContent,gap:Math.round(R.left-L.right),model:Math.round(V.width),far:Math.round(innerWidth-R.right),has:document.getElementById(id).classList.contains('on')};},title,id);
    ok(g.title===title&&g.gap<=4&&g.model>180&&g.far>180&&g.has,title+' docks beside the tree',JSON.stringify(g));
    if(shots)await p.screenshot({path:path.join(shots,'after_d1440_'+tab+'.png')});
  }
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_make.png')});
  await p.click('#sheet-x');
  if(shots)await p.screenshot({path:path.join(shots,'after_d1440_home.png')});
  for(const[w,h,fs,name]of[[1440,900,1.3,'z1440'],[1280,800,1,'d1280'],[1280,800,1.3,'z1280'],[1024,768,1,'d1024'],[1024,768,1.3,'z1024'],[768,900,1,'d768'],[768,900,1.3,'z768'],[390,844,1,'p390'],[390,844,1.3,'zp390'],[360,740,1,'p360'],[360,740,1.3,'zp360'],[667,375,1,'land'],[667,375,1.3,'zland'],[844,390,1,'wide-land']]){
    await go(w,h,fs);const bad=await audit();ok(!bad.length,name+' has no clipped labels or page overflow',bad.join(';'));
    if(w<700){const head=await p.evaluate(()=>{const H=document.querySelector('header').getBoundingClientRect(),hs=[...document.querySelectorAll('header > *')].filter(el=>{const r=el.getBoundingClientRect();return getComputedStyle(el).display!=='none'&&r.height>20&&r.width>1;});const tops=hs.map(el=>Math.round(el.getBoundingClientRect().top));const chip=document.getElementById('m-space'),cr=chip.getBoundingClientRect();return{rows:[...new Set(tops)].filter((t,i,a)=>a.every(u=>Math.abs(u-t)<12)).length?1:tops.length,h:Math.round(H.height),chip:chip.innerText.replace(/\s+/g,' ').trim(),clip:chip.scrollWidth>chip.clientWidth+2,off:cr.right>innerWidth+2,n:hs.length};});ok(head.h<56*fs+16&&!head.clip&&!head.off&&/Part/.test(head.chip)&&head.n>=3,name+' header is one row and the workspace name is readable',JSON.stringify(head));}
    if(shots&&(name==='zp390'||name==='zp360'))await p.screenshot({path:path.join(shots,'after_'+name+'.png')});
    ok(await p.evaluate(w=>getComputedStyle(document.getElementById('ribbon')).display===(w<700?'none':'flex')&&!document.getElementById('pipe'),w),name+' shows the ribbon on a wide screen only');
    if(shots&&fs===1&&['d1280','d1024','d768','p390','p360','land','wide-land'].includes(name))await p.screenshot({path:path.join(shots,'after_'+name+'_home.png')});
  }
  await go(390,844,1);await p.click('#m-space');await p.waitForSelector('#m-spaces');
  const sheet=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#m-spaces .m-list button')].map(b=>b.textContent.trim());const bad=bs.filter(b=>{const e=[...document.querySelectorAll('#m-spaces button')].find(x=>x.textContent.trim()===b);return e.scrollWidth>e.clientWidth+2;});return{bs,bad};});
  ok(sheet.bs.includes('Part')&&sheet.bs.includes('AI')&&sheet.bs.includes('Instant Quote')&&!sheet.bad.length,'phone sheet lists workspaces, AI and quote with full labels',sheet.bad.join(','));
  await p.keyboard.press('Escape');await go(390,844,1.3);await p.click('#m-more');await p.waitForSelector('#m-more-sheet, #m-more.m-sheet, .m-sheet');
  const more=await p.evaluate(()=>[...document.querySelectorAll('.m-sheet button')].map(b=>b.textContent.trim()));
  ok(more.some(t=>t.startsWith('Undo'))&&more.some(t=>t.startsWith('Ask AI')),'phone More keeps Undo and Ask AI',more.filter(t=>/Undo|Redo|Steps|Ask/.test(t)).join(','));
  if(shots)await p.screenshot({path:path.join(shots,'after_p390_sheet.png')});
  await go(667,375,1);await p.click('#m-space');await p.waitForSelector('#m-spaces');
  ok(!(await audit()).length,'landscape phone sheet does not overflow',(await audit()).join(';'));
  if(shots)await p.screenshot({path:path.join(shots,'after_land_sheet.png')});
}catch(e){ok(false,'layout test threw',e.stack||e.message);}
await b.close();own&&srv&&srv.kill();
console.log(fail?fail+' FAILED':'ALL PASS');
process.exit(fail?1:0);
