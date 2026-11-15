import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const root=path.resolve(new URL('../..',import.meta.url).pathname),port=process.env.PORT||'18847',P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),ud=fs.mkdtempSync(path.join(os.tmpdir(),'adam-up-')),sleep=t=>new Promise(r=>setTimeout(r,t));
const srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});let fail=0,b;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),F={'/models/adam-3b-t8/a.gguf':crypto.randomBytes(70000),'/models/adam-3b-t8/b.gguf':crypto.randomBytes(30000),'/models/adam-3b-t9/a.gguf':crypto.randomBytes(70000),'/models/adam-3b-t9/b.gguf':crypto.randomBytes(40000),'/models/adam-3b-t7/a.gguf':crypto.randomBytes(500)};
const ent=(v,bad)=>{const s=['a','b'].map(n=>{const d=F[`/models/adam-3b-${v}/${n}.gguf`];return`{file:'${n}.gguf',sha256:'${bad&&n==='b'?'0'.repeat(64):sha(d)}',bytes:${d.length}}`;});return`'adam-3b-${v}':{name:'Adam',url:'/models/adam-3b-${v}/a.gguf',hfFile:'adam-3b-${v}.gguf',shards:[${s}],join:true,bytes:${['a','b'].reduce((t,n)=>t+F[`/models/adam-3b-${v}/${n}.gguf`].length,0)},sizeMB:1,ctx:8192,quant:'Q4_K_M',tier:'cad',speedHint:'medium',blurb:'t'},`;};
const REG=bad=>fs.readFileSync(path.join(root,'lib/amni-llm/registry.js'),'utf8').replace('export const DEFAULT_MODELS={','export const DEFAULT_MODELS={\n'+ent('t9',bad)+'\n'+ent('t8'));
try{
  b=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',userDataDir:ud,protocolTimeout:300000,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const mk=async bad=>{const p=await b.newPage();await p.setRequestInterception(true);p.on('request',q=>{const u=new URL(q.url());return u.pathname==='/lib/amni-llm/registry.js'?q.respond({status:200,contentType:'text/javascript',body:REG(bad)}):F[u.pathname]?q.respond({status:200,contentType:'application/octet-stream',body:F[u.pathname]}):q.continue();});await p.goto(`http://127.0.0.1:${port}/404.html`);return p;};
  let p=await mk(false);const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));
  const r=await p.evaluate(async()=>{const m=await import('/lib/amni-llm/amni-llm.js'),O='adam-3b-t8',N='adam-3b-t9',C=await caches.open('amni-llm-v1'),o={};for(const k of await C.keys())await C.delete(k);
    o.latest=m.latestCad();o.fresh=await m.pickCad(O);await m.pullModel(O);o.oldCached=await m.isCached(O);o.plan=await m.pickCad(O);
    await C.put('/models/adam-3b-t7/a.gguf',new Response('stray',{headers:{'x-amni-sha256':'x'}}));await C.put('/models/other/a.gguf',new Response('keep'));
    const {Assistant}=await import('/cad/ai.js'),A=new Assistant();A.onUpdate=id=>{o.up=id;};Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true});o.saver=await A.pull(m,N);o.afterSaver=await m.isCached(N);
    Object.defineProperty(navigator,'connection',{value:{},configurable:true});o.pulled=await A.pull(m,N);o.newCached=await m.isCached(N);o.oldGone=!await m.isCached(O);o.keys=(await C.keys()).map(k=>new URL(k.url).pathname).sort();o.after=await m.pickCad(O);o.same=await m.pickCad(N);return o;});
  ok(r.latest==='adam-3b-t9','the first Adam in the list is the latest',r.latest);
  ok(r.fresh.id==='adam-3b-t9'&&!r.fresh.update,'with no saved copy the app goes straight to the latest Adam',r.fresh);
  ok(r.oldCached&&r.plan.id==='adam-3b-t8'&&r.plan.update==='adam-3b-t9','a saved older Adam keeps working while the latest is fetched',r.plan);
  ok(r.saver===false&&!r.afterSaver,'no background download on data saver');
  ok(r.pulled===true&&r.up==='adam-3b-t9'&&r.newCached,'the latest Adam is saved in the background and the app is told',r.up);
  ok(r.oldGone&&r.keys.join()==='/models/adam-3b-t9/a.gguf,/models/adam-3b-t9/b.gguf,/models/other/a.gguf','the old Adam and stray Adam files are deleted, other models stay',r.keys);
  ok(r.after.id==='adam-3b-t9'&&!r.after.update&&r.same.id==='adam-3b-t9'&&!r.same.update,'after the update the app uses the latest Adam');
  await p.close();p=await mk(true);p.on('pageerror',e=>errs.push(String(e.message)));
  const q=await p.evaluate(async()=>{const m=await import('/lib/amni-llm/amni-llm.js'),O='adam-3b-t8',N='adam-3b-t9',C=await caches.open('amni-llm-v1'),o={};for(const k of await C.keys())await C.delete(k);await m.pullModel(O);const {Assistant}=await import('/cad/ai.js'),A=new Assistant();A.onUpdate=id=>{o.up=id;};o.pulled=await A.pull(m,N);o.oldCached=await m.isCached(O);o.newCached=await m.isCached(N);o.plan=await m.pickCad(O);return o;});
  ok(q.pulled===false&&!q.up&&q.oldCached&&!q.newCached&&q.plan.id==='adam-3b-t8','a download that fails its check leaves the old Adam in place',q);
  ok(!errs.length,'no page errors',errs.slice(0,3));
}catch(e){fail++;console.log('FAIL crashed '+(e.stack||e));}finally{b&&await b.close().catch(()=>{});srv.kill();fs.rmSync(ud,{recursive:true,force:true});}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
