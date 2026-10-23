import {boot} from './ai_stub.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!=null?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const E=await boot({engine:'gemini',width:1366,height:800}),p=E.page,L='Very_Long_Feature_Name_Without_Spaces_For_Testing_Wrap',U='https://example.com/a/really/long/url/that/does/not/break/anywhere/at/all/1234567890';
const spill=()=>E.ev(()=>{const R=document.querySelector('#right'),rr=R.getBoundingClientRect(),o=[];for(const e of R.querySelectorAll('*')){if(!e.offsetParent)continue;const b=e.getBoundingClientRect();if(b.width&&b.right>rr.right+1&&!(e.parentElement&&e.parentElement.getBoundingClientRect().right>rr.right+1)){let c=e.parentElement,cl=false;while(c&&c!==R){if(/auto|scroll/.test(getComputedStyle(c).overflowX)){cl=true;break;}c=c.parentElement;}cl||o.push(e.outerHTML.replace(/\s+/g,' ').slice(0,90));}}const cut=[...R.querySelectorAll('#chat *')].filter(e=>e.offsetParent&&e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX==='hidden').map(e=>e.className);return o.concat(cut);});
try{
  await E.ev((L,U)=>{window.__n=0;window.__model=()=>window.__n++===0?{say:'Done. I set depth to thickness_parameter*2+clearance_offset_value on '+L+'. See '+U,actions:[{param:{name:'Very_Long_Parameter_Name_Without_Spaces_For_Testing',expr:'0.125'}},{add:{type:'box',name:L,w:1,d:1,h:1}}]}:{say:'Looks right.',actions:[]};},L,U);
  await E.send('Make a box named '+L+' and read '+U);await E.sleep(500);
  ok(!(await spill()).length,'long names and URLs in the AI chat and change card wrap inside the panel',await spill());
  const hd=await E.ev(()=>{const t=document.querySelector('#ai-chip .t'),q=document.querySelector('#ai-quick');return{t:t?t.getBoundingClientRect().width:0,q:q?q.getBoundingClientRect().width:0};});
  ok(hd.t>60&&hd.q>200,'the AI chip keeps its model name and the model menu gets its own row',hd);
  for(const t of ['check','sim','flow','make','mold','dies','cutters','draw','vault']){await E.ev(t=>window.amnicad.API.setTab(t),t);await E.sleep(900);await E.ev(()=>document.querySelectorAll('#right details').forEach(d=>d.open=true));await E.sleep(300);const s=await spill();ok(!s.length,'nothing in the '+t+' panel runs past its edge',s.slice(0,2));}
  ok(!E.errs.length,'no page errors',E.errs.join(' | '));
}catch(e){fail++;console.log('FAIL',e.stack);}
await E.close();console.log(fail?fail+' failed':'ALL PASS');process.exit(fail?1:0);
