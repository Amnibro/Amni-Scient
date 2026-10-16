import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve(new URL('../..',import.meta.url).pathname),P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),port=process.env.PORT||'18660',ud=fs.mkdtempSync(path.join(os.tmpdir(),'layout-')),sleep=t=>new Promise(r=>setTimeout(r,t)),shots=process.env.SHOTS;
const srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let fail=0,b;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));},BAD=/solid\s?works|\bcreo\b|\bptc\b|dassault|smartmate|toolbox|propertymanager|featuremanager|commandmanager|hole wizard|boss\/base|moldflow|flow simulation|plastic injection|dimxpert|instant3d|edrawings|windchill/i;
try{b=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',userDataDir:ud,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();await p.setViewport({width:1440,height:900});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  const load=async(ui,v)=>{await p.goto(`http://127.0.0.1:${port}/cad/`);await p.evaluate((ui,v)=>{localStorage.clear();ui!=null&&localStorage.setItem('amnicad.ui',ui);v!=null&&localStorage.setItem('amnicad.ui.v',v);},ui,v);await p.reload();await sleep(3500);};
  const state=()=>p.evaluate(()=>({cls:document.body.className,ui:localStorage.getItem('amnicad.ui'),v:localStorage.getItem('amnicad.ui.v'),mode:window.amnicad.API.ui.mode}));
  for(const[ui,v,want,msg]of[['sw','2','workshop','stored sw (v2) migrates to workshop'],['creo','2','blueprint','stored creo (v2) migrates to blueprint'],['amni','2','amni','stored amni (v2) stays amni'],['blueprint','3','blueprint','stored blueprint (v3) stays blueprint'],['creo',null,'workshop','unversioned value falls back to the default workshop'],[null,null,'workshop','fresh profile starts in workshop']]){await load(ui,v);const s=await state();ok(s.mode===want&&s.ui===want&&s.v==='3'&&(want==='amni'?!/pro-/.test(s.cls):s.cls.includes('pro-'+want)),msg,JSON.stringify(s));}
  await load(null,null);
  const labels=await p.evaluate(()=>{document.querySelector('#ui-menu > button').click();return[...document.querySelectorAll('#ui-menu .pop button')].map(x=>x.textContent);});
  ok(labels.length===3&&labels[0].startsWith('Amni')&&labels[1].startsWith('Workshop')&&labels[2].startsWith('Blueprint'),'Interface menu lists Amni, Workshop and Blueprint',labels.join(' | '));
  const bar=async()=>p.evaluate(()=>(document.querySelector('#ribbon')?.innerText||'')+'\n'+(document.querySelector('#phead')?.innerText||'')+'\n'+(document.querySelector('#pbar')?.innerText||'')+'\n'+[...document.querySelectorAll('#ui-menu .pop button')].map(x=>x.textContent).join('\n'));
  const pick=async k=>{await p.evaluate(()=>document.querySelector('.menu.open')||document.querySelector('#ui-menu > button').click());await p.evaluate(k=>[...document.querySelectorAll('#ui-menu .pop button')].find(x=>x.textContent.startsWith(k)).click(),k);await sleep(500);};
  const theme=async t=>{await p.evaluate(t=>{const r=document.documentElement;r.dataset.theme!==t&&document.querySelector('#b-theme').click();},t);await sleep(500);};
  const css=n=>p.evaluate(n=>getComputedStyle(document.body).getPropertyValue(n).trim(),n);
  const acc={};
  for(const k of['Amni','Workshop','Blueprint'])for(const t of['dark','light']){await pick(k);await theme(t);await p.evaluate(()=>{const f=document.querySelector('#tree .feat');f&&f.click();});await sleep(700);acc[k+t]=await css('--acc');const txt=await bar();ok(!BAD.test(txt),k+' '+t+': no competitor names in the ribbon, tree or menu');
    shots&&(fs.mkdirSync(shots,{recursive:true}),await p.screenshot({path:path.join(shots,k.toLowerCase()+'-'+t+'.png')}));}
  ok(acc.Workshopdark!==acc.Blueprintdark&&acc.Workshopdark!==acc.Amnidark&&acc.Blueprintdark!==acc.Amnidark&&acc.Workshoplight!==acc.Blueprintlight,'each layout has its own accent color',JSON.stringify(acc));
  ok(!BAD.test(await p.evaluate(()=>document.body.innerText)),'no competitor names anywhere in the visible page');
  await pick('Blueprint');await p.keyboard.down('Control');await p.keyboard.press('d');await p.keyboard.up('Control');await sleep(200);
  ok((await state()).mode==='blueprint'&&(await state()).ui==='blueprint','choice persists as blueprint');
  ok(!errs.length,'no page errors'+(errs.length?': '+errs.join(' | '):''));
}catch(e){fail++;console.log('FAIL',e.message);}finally{try{await b?.close();}catch{}srv.kill();fs.rmSync(ud,{recursive:true,force:true});}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
