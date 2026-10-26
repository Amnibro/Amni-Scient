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
  await p.evaluate(()=>{const o=window.setTimeout;window.setTimeout=(f,ms,...a)=>o(f,Math.max(+ms||0,4000),...a);});
  await tm('form_set',()=>E.call('form_set',{scene:'ball sphere 0,0,20 r20 nz.4:4 #c08040\nblock box 25,0,12 16,16,16 r2 #8090a0'}));
  await tm('game_asset',()=>E.call('mesh_edit',{create:{kind:'cube',name:'host',size:4,at:[80,0,0]},game_asset:{kind:'prop',tris:300,size:256,from:'shapes',dir:'ga',name:'bg'}}));
  await tm('form_render',()=>E.call('form_render',{kind:'still',engine:'raster',width:160,height:120}));
  ok(R.game_asset[0]<7000&&R.form_render[0]<4000,'game assets and Form renders never wait on page timers or animation frames while hidden (Chrome holds those up to a minute; here 4 s)',{form_set:R.form_set,game_asset:R.game_asset,form_render:R.form_render});
  ok(!E.errs.length,'no page errors',E.errs.join(' | '));
}catch(e){fail++;console.log('FAIL',e.stack);}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
