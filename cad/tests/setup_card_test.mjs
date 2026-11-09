import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:18707,mcp:18708}),{page:p,sleep}=E;let fail=0;const ok=(c,m,x)=>{c||fail++;console.log(c?'PASS':'FAIL',m,x===undefined?'':JSON.stringify(x));};
try{await p.evaluate(()=>{localStorage.setItem('amnicad.relay.app','Claude Code');window.amnicad.setTab('ai');});await sleep(800);await p.evaluate(()=>document.querySelector('#ai-chip')?.click());await sleep(500);await p.evaluate(()=>document.querySelector('#ai-o-sub')?.click());await sleep(800);
  const t0=Date.now(),seen=[];while(Date.now()-t0<20000){seen.push(await p.evaluate(()=>!!document.querySelector('#ai-setup .as-cmd pre')&&/Claude Code/.test(document.querySelector('#ai-setup .as-app.on')?.textContent||'')));await sleep(1000);}
  const st=await p.evaluate(()=>document.querySelector('#ai-bstat')?.textContent);
  ok(seen.every(Boolean),'the Claude Code setup steps stay on screen while the page keeps looking for the helper',{closedAt:seen.indexOf(false),st});
  ok(!E.errs.length,'no page errors'+(E.errs.length?': '+E.errs.slice(0,3).join(' | '):''));
}finally{await E.close();}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
