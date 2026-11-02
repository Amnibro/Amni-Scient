import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';import {asPro,proKey} from './pro_key.mjs';
const root=path.resolve(new URL('../..',import.meta.url).pathname),port=process.env.PORT||'18757',sleep=t=>new Promise(r=>setTimeout(r,t));let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});const B=[];
const PLATE={name:'Meter plate',units:'in',params:[],material:'al6061',features:[{id:'a',type:'box',w:4,d:2,h:0.25},{id:'b',type:'hole',plane:'face',face:{side:'+Z'},d:0.25,thru:true,pts:[[-1.5,0],[1.5,0]]}],sim:{type:'static',supports:[{faces:{side:'-X'},type:'fixed'}],loads:[{faces:{side:'+X'},p:5}]}};
async function page(pro){const ud=fs.mkdtempSync(path.join(os.tmpdir(),'meter-')),b=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',userDataDir:ud,protocolTimeout:300000,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});B.push([b,ud]);const p=await b.newPage();await p.setViewport({width:1440,height:900});pro&&await asPro(p);const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/cad/`);await p.waitForFunction(()=>window.amnicad&&window.amnicad.S.kernel,{timeout:150000});await p.evaluate(async d=>{const A=window.amnicad.API;A.loadDoc(d,null);await A.waitBuild();A.flowCfg.res=0;},PLATE);await sleep(800);return{p,errs};}
const dlg=p=>p.evaluate(()=>{const d=document.querySelector('#dlg'),t=d&&d.open?d.textContent.replace(/\s+/g,' '):'';d&&d.open&&d.close();return t;});
const run=(p,k)=>p.evaluate(async k=>{const am=window.amnicad,A=am.API,S=am.S,key={fea:'lastFea',cfd:'lastFlow',cam:'lastToolpath'}[k],b=S[key];k==='fea'?await A.runFea():k==='cfd'?await A.runFlow():await am.runCam();await new Promise(r=>setTimeout(r,400));const a=S[key];return{ran:!!a&&a!==b,ok:!!a&&a.ok!==false,err:a&&a.errors?[].concat(a.errors).join(' '):''};},k);
try{await sleep(700);
  const F=await page(false);
  ok(await F.p.evaluate(()=>['fea','cfd','cam'].every(f=>window.amnicad.API.pro.freeLeft(f))),'a new free user has one report left for stress, flow and G-code');
  for(const[k,n]of[['fea','stress'],['cfd','flow'],['cam','G-code']]){
    const r1=await run(F.p,k);await sleep(300);const t1=await dlg(F.p);ok(r1.ran&&!/Unlock/.test(t1),'the first '+n+' report runs on the free plan',r1);
    ok(!await F.p.evaluate(k=>window.amnicad.API.pro.freeLeft(k),k),'after it, no free '+n+' report is left');
    const r2=await run(F.p,k);await sleep(300);const t2=await dlg(F.p);ok(k==='cam'?!r2.ok&&/needs Amni-CAD Pro/.test(r2.err||''):!r2.ran,'a second '+n+' report does not run on the free plan',r2);ok(k==='cam'||new RegExp('used your free '+n+' report').test(t2),'it opens the Pro offer that says the free '+n+' report is used',t2.slice(0,110));}
  await F.p.evaluate(()=>{const A=window.amnicad.API;A.commit(d=>{d.features[0].w=4.5;});});await sleep(1200);const r3=await run(F.p,'fea');ok(!r3.ran,'changing the part does not reset the free report');
  ok(!F.errs.length,'no page errors on the free plan',F.errs.slice(0,2).join(' | '));
  if(proKey()){const Q=await page(true);let n=0;for(let i=0;i<3;i++){await Q.p.evaluate(i=>window.amnicad.API.commit(d=>{d.features[0].h=0.25+i*0.05;}),i);await sleep(900);const r=await run(Q.p,'fea');const t=await dlg(Q.p);r.ran&&!/Unlock/.test(t)&&n++;}ok(n===3,'Pro runs three stress reports in a row with no prompt',n);
    const c=[await run(Q.p,'cam'),await run(Q.p,'cam')];ok(c.every(r=>r.ok),'Pro makes G-code twice in a row',c);ok(!Q.errs.length,'no page errors on Pro',Q.errs.slice(0,2).join(' | '));}
  else console.log('SKIP Pro checks: needs the license issuer');
}catch(e){fail++;console.log('FAIL',e.stack||e.message);}
for(const[b,ud]of B){try{await b.close();}catch{}fs.rmSync(ud,{recursive:true,force:true});}srv.kill();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
