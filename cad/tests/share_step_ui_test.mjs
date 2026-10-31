// #d= share links with imported STEP data: a small STEP travels inside the link and rebuilds in a fresh profile; an oversized one is refused with a clear message.
import fs from 'node:fs';import path from 'node:path';import {serve,chrome,tally,root,sleep} from './shop_ui_lib.mjs';
const {ok,done}=tally(),STEP=fs.readFileSync(path.join(root,'cad/tests/fixtures/gantry_asm.step'),'utf8');
const {srv,base}=await serve(),br=await chrome();
const until=async(p,fn,arg,ms=90000)=>{const t0=Date.now();while(Date.now()-t0<ms){try{if(await p.evaluate(fn,arg))return true;}catch{}await sleep(200);}return false;};
const open=async(u=base)=>{const c=await br.newContext({viewport:{width:1280,height:800}}),p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(u);await until(p,()=>window.amnicad&&window.amnicad.S.kernel);return p;};
const share=async p=>{await p.evaluate(()=>{window.__clip='';navigator.clipboard.writeText=async t=>{window.__clip=t;};document.querySelector('#toast')&&(document.querySelector('#toast').textContent='');});await p.evaluate(()=>window.amnicad.API.act('share'));await until(p,()=>!!window.__clip||/too big|not loaded/.test(document.querySelector('#toast')?.textContent||''),null,20000);return p.evaluate(()=>({u:window.__clip,t:document.querySelector('#toast')?.textContent||''}));};
const solid=p=>until(p,()=>{const S=window.amnicad.S;const m=S.mesh;return S.doc.features.some(f=>f.type==='import')&&!(S.errors||[]).length&&m&&Object.values(m).some(v=>v&&v.length>100);},null,120000);
try{
 const a=await open();await a.evaluate(async t=>{await window.amnicad.API.importStep(new File([t],'gantry.step'),true);},STEP);
 ok(await solid(a),'STEP imports in the app');
 const r=await share(a);ok(r.u.includes('#d=')&&r.u.length<512*1024,'share link carries the STEP data ('+Math.round(r.u.length/1024)+' KB)');
 const b=await open(r.u);ok(await solid(b),'link opens in a fresh profile and rebuilds the STEP solid');
 const fb=await b.evaluate(()=>{const S=window.amnicad.S,f=S.doc.features.find(f=>f.type==='import');return!!(f&&S.blobs[f.blob]&&S.blobs[f.blob].byteLength>80000);});ok(fb,'STEP bytes are restored on the receiving side');
 const big=await a.evaluate(()=>{const S=window.amnicad.S,f=S.doc.features.find(f=>f.type==='import'),u=new Uint8Array(900*1024);for(let i=0;i<u.length;i+=65536)crypto.getRandomValues(u.subarray(i,i+65536));S.blobs[f.blob]=u.buffer;return true;});
 const r2=await share(a);ok(big&&!r2.u&&/too big for a link/.test(r2.t)&&/Save the file/.test(r2.t),'oversized STEP data gives a clear fallback message: '+r2.t);
 ok(!a.errs.length&&!b.errs.length,'no page errors '+[...a.errs,...b.errs].join(' | ').slice(0,300));
}catch(e){ok(false,'test crashed: '+e.stack);}finally{await br.close();srv.close();}
process.exit(done()?1:0);
