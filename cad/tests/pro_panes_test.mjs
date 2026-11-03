import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const E=await startE2E({web:+process.env.E2E_WEB||18781,mcp:+process.env.E2E_MCP||18782,width:1440,height:900});
try{const p=E.page;await p.evaluate(()=>window.amnicad.API.setTab('edit'));await E.sleep(800);
  ok(await p.evaluate(()=>document.body.classList.contains('pro')&&document.body.classList.contains('rp-off')),'Pro workshop on the Features tab hides the Part right pane');
  for(const[ws,pane]of[['Assembly','aright'],['Form','right'],['Tooling','right']]){
    await p.evaluate(w=>[...document.querySelectorAll('#ws button')].find(b=>b.textContent.trim()===w).click(),ws);await E.sleep(2500);
    const r=await p.evaluate(id=>{const e=document.getElementById(id),m=getComputedStyle(document.querySelector('main')).gridTemplateColumns.split(' ');return{w:Math.round(e.getBoundingClientRect().width),col:m[m.length-1],rp:document.body.classList.contains('rp-off')};},pane);
    ok(r.w>=150,`${ws} keeps its right panel open in the Pro layout`,JSON.stringify(r));}
  ok(!E.errs.length,'no page errors',E.errs.slice(0,3).join(' | '));
}catch(e){ok(false,'run',e.stack||e.message);}
await E.close();console.log(fail?`${fail} FAILED`:'ALL PASS');process.exit(fail?1:0);
