import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const E=await startE2E({web:+process.env.E2E_WEB||18781,mcp:+process.env.E2E_MCP||18782,bg:true}),p=E.page,R={};
const tm=async(k,f)=>{const t=Date.now();await f();(R[k]=R[k]||[]).push(Date.now()-t);};
try{
  await E.call('apply_actions',{actions:[{new:true,units:'mm'},{add:{type:'box',w:40,d:30,h:10}}]});
  const p2=await p.browser().newPage();await p2.goto('about:blank');await p2.bringToFront();await E.sleep(1500);
  ok(await p.evaluate(()=>document.visibilityState)==='hidden','the Amni-CAD tab is in the background with Chrome timer throttling on');
  for(let i=0;i<4;i++){await tm('get_state',()=>E.call('get_state'));await tm('apply_actions',()=>E.call('apply_actions',{actions:[{add:{type:'hole',plane:'face',face:{side:'+Z'},dia:3,thru:true,pts:[[-15+i*7,0]]}}]}));}
  await tm('screenshot',()=>E.call('screenshot',{view:'iso'}));
  const st=E.T(await E.call('get_state'));ok((st.features||[]).length===5&&!(st.errors||[]).length,'every change built while the tab was hidden',(st.features||[]).length);
  ok(Math.max(...R.get_state,...R.apply_actions)<400&&R.screenshot[0]<700,'MCP calls stay fast while the tab is hidden (background timers throttle to 1 s or more)',R);
  ok(!E.errs.length,'no page errors',E.errs.join(' | '));
}catch(e){fail++;console.log('FAIL',e.stack);}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
