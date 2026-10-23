import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const E=await startE2E({}),p=E.page,ev=(f,...a)=>p.evaluate(f,...a);
try{
  await p.setViewport({width:1366,height:800});await E.call('load_template',{key:'enclosure'});await E.call('screenshot',{view:'front'});await E.sleep(600);
  const r=await ev(()=>{const c=document.querySelector('#cv').getBoundingClientRect();return[c.left,c.top,c.width,c.height];}),x=r[0]+r[2]*0.42,y=r[1]+r[3]*0.5,sel=()=>ev(()=>[...window.amnicad.S.sel.faces.keys()][0]);
  const rc=async(ms=60)=>{await p.mouse.move(x,y);await p.mouse.down({button:'right'});await E.sleep(ms);await p.mouse.up({button:'right'});await E.sleep(250);};
  await p.mouse.click(x,y);await E.sleep(300);const seen=[await sel()];let msg='';
  for(let i=0;i<4;i++){await rc();i===0&&(msg=await ev(()=>[...document.querySelectorAll('.toast,#toast')].map(t=>t.textContent).join('|')));await p.mouse.click(x,y);await E.sleep(250);seen.push(await sel());}
  ok(/Face 2 of 4/.test(msg),'a quick right-click over the part steps to the next face behind the cursor',msg.slice(0,40));
  ok(new Set(seen.slice(0,4)).size===4&&seen[4]===seen[0],'front view through a box wall: right-click cycles outer, inner, far inner and far outer faces, then wraps',seen);
  ok(!await ev(()=>!!document.querySelector('.ctxm')),'a quick right-click over the part does not open the menu');
  await p.mouse.move(x+40,y);await E.sleep(200);await rc(500);ok(await ev(()=>!!document.querySelector('.ctxm')),'holding right-click opens the menu');await p.keyboard.press('Escape');
  await E.call('screenshot',{view:'iso'});await E.sleep(500);const got={};
  for(let gy=0.3;gy<=0.75;gy+=0.075)for(let gx=0.25;gx<=0.75;gx+=0.07){await ev(()=>{window.amnicad.S.active=null;});await p.mouse.click(r[0]+r[2]*gx,r[1]+r[3]*gy,{clickCount:2});await p.waitForFunction(()=>window.amnicad.S.active,{timeout:2500}).catch(()=>{});const a=await ev(()=>window.amnicad.S.active);a&&(got[a]=(got[a]||0)+1);await ev(()=>window.amnicad.API.setTab('edit'));}
  ok(got.f1&&got.f4&&Object.keys(got).length>=3,'double-clicking the part opens the feature that made that face, not always the first one',got);
  ok(!E.errs.length,'no page errors',E.errs.join(' | '));
}catch(e){fail++;console.log('FAIL',e.stack);}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
