import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const E=await startE2E({}),p=E.page,ev=(f,...a)=>p.evaluate(f,...a),sl=E.sleep;
const pick=async(menu,sel)=>{await p.click(menu);await sl(250);const b=await p.$(sel),bb=b&&await b.boundingBox();if(!bb)throw new Error('no '+sel);await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await sl(900);};
const look=()=>ev(()=>{const v=e=>{const r=e&&e.getBoundingClientRect();return!!(e&&r.width>40&&r.height>40&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden');},ar=document.getElementById('aright');return{ws:window.amnicad.API.ws,tab:window.amnicad.S.tab,ai:v(document.getElementById('tab-ai')),sim:v(document.getElementById('tab-sim')),vault:v(document.querySelector('.pdm')),asmDraw:v(ar)&&/drawing/i.test(ar.textContent.slice(0,200)),wl:document.getElementById('nav-label').textContent,tl:document.getElementById('tool-label').textContent,toast:[...document.querySelectorAll('.toast,#toast')].map(t=>t.textContent).join('|')};});
const reset=async()=>{await ev(()=>import('./pdm_ui.js').then(m=>m.close()).catch(()=>{}));await p.keyboard.press('Escape');await sl(300);};
try{
  await p.setViewport({width:1366,height:800});await sl(1500);
  for(const[w,n]of[['form','Form'],['asm','Assembly'],['tool','Tooling']]){await pick('#nav-now','#ws [data-ws='+w+']');await pick('#tool-now','#tools [data-tab=ai]');const a=await look();ok(a.ai&&a.ws===w&&a.wl===n&&a.tl==='AI','Tools → AI opens the assistant beside '+n,a);await reset();}
  await pick('#nav-now','#ws [data-ws=form]');await pick('#tool-now','#tools [data-tab=sim]');const f=await look();ok(f.sim&&f.ws==='part'&&f.wl==='Part'&&f.tl==='FEA'&&/works on the part/.test(f.toast),'Tools → FEA from Form switches to Part, opens FEA and says why',f);await reset();
  await pick('#nav-now','#ws [data-ws=asm]');await pick('#tool-now','#tools [data-tab=draw]');const d=await look();ok(d.asmDraw&&d.ws==='asm','Tools → Drawing in Assembly opens the assembly drawing panel',d);await reset();
  await pick('#nav-now','#ws [data-ws=tool]');await pick('#tool-now','#tools [data-tab=vault]');const v=await look();ok(v.vault&&v.ws==='tool','Tools → Vault in Tooling opens the vault browser',v);await reset();
  await pick('#nav-now','#ws [data-ws=part]');await pick('#tool-now','#tools [data-tab=sim]');const s=await look();ok(s.sim&&s.ws==='part'&&s.tl==='FEA'&&s.wl==='Part','in Part, the workspace and tool menus show Part and FEA separately',s);
  ok(!E.errs.length,'no page errors',E.errs.join(' | '));
}catch(e){fail++;console.log('FAIL',e.stack);}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
