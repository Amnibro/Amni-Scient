import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:18707,mcp:18708}),{page:p,sleep}=E;let fail=0;const ok=(c,m,x)=>{c||fail++;console.log(c?'PASS':'FAIL',m,x===undefined?'':JSON.stringify(x));};
try{await p.evaluate(()=>window.amnicad.setTab('ai'));await sleep(800);await p.evaluate(()=>document.querySelector('#ai-chip')?.click());await sleep(500);await p.evaluate(()=>document.querySelector('#ai-o-app')?.click());await sleep(800);
  const more=await p.evaluate(()=>{const d=document.querySelector('details.as-more');d&&(d.open=true);return !!d;});await sleep(500);
  await sleep(2500);const on=await p.evaluate(()=>/Waiting for your assistant/.test(document.querySelector('#br-card')?.textContent||''));
  const opened=await p.evaluate(()=>{const d=document.querySelector('#br-card details');d&&(d.open=true);return !!d;});await sleep(500);
  const t0=Date.now(),seen=[];while(Date.now()-t0<20000){seen.push(await p.evaluate(()=>!!document.querySelector('details.as-more')?.open&&!!document.querySelector('#br-card details')?.open));await sleep(1000);}
  const st=await p.evaluate(()=>document.querySelector('#br-card')?.textContent.match(/Waiting[^.]*|Connected[^.]*/)?.[0]);
  ok(more&&on&&opened&&seen.every(Boolean),'the local bridge setup steps stay open while the page keeps looking for the helper',{more,on,opened,closedAt:seen.indexOf(false),st});
  ok(!E.errs.length,'no page errors'+(E.errs.length?': '+E.errs.slice(0,3).join(' | '):''));
}finally{await E.close();}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
