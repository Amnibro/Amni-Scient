import fs from 'node:fs';
import path from 'node:path';
import {boot} from './ai_stub.mjs';
import {CASES} from './ai_checks.mjs';
const A=process.argv.slice(2),flag=f=>A.includes('--'+f),opt=(k,d)=>{const a=A.find(x=>x.startsWith('--'+k+'='));return a?a.slice(k.length+3):d;},only=opt('only','').split(',').filter(Boolean),OUT=opt('out',''),ENG=[['gemini','GEMINI_API_KEY','EVAL_GEMINI_MODEL'],['anthropic','ANTHROPIC_API_KEY','EVAL_ANTHROPIC_MODEL'],['openai','OPENAI_API_KEY','EVAL_OPENAI_MODEL']].filter(e=>process.env[e[1]]),cases=CASES.filter(c=>!only.length||only.includes(c.id));
const HELP=`Amni-CAD AI evaluation: golden prompts with deterministic geometric checks.
usage: node cad/tests/ai_eval.mjs [--offline] [--online] [--compare] [--only=chair,fan] [--out=DIR] [--help]
  offline (default)  a scripted mock model drives the real assistant code path: its first reply is bad on purpose, the look-and-fix loop must see
                     the problem in the numbers it sends back, and the corrected second reply must pass every check. No network, no keys.
  --online           runs the real models with the keys found in the environment, one engine per key, and prints a pass table.
                     GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY (never printed, never written to disk by this script);
                     EVAL_GEMINI_MODEL, EVAL_ANTHROPIC_MODEL, EVAL_OPENAI_MODEL pick the model by id or by part of it (for example flash, sonnet, gpt-5).
  --compare          with --online: run every case twice per engine, first single-shot (Check my work off), then with the look-and-fix loop on.
  --only=a,b         run only these case ids: ${CASES.map(c=>c.id).join(', ')}
  --out=DIR          save the contact sheet JPEG of every final model into DIR
  ports for the page server and the helper bridge: E2E_WEB (default 18700) and E2E_MCP (default 18701)
checks per case: solids, bounding box sizes in mm, volume in mm3, size ratios, blades or teeth counted by a section through the solid, fins counted along a line,
  probes (is this point solid or empty), separate regions in a slice, slice area, outer radius at a height, number of cylindrical faces.
exit code 0 when every offline case passes (online runs only report).`;
if(flag('help')||flag('h')){console.log(HELP);process.exit(0);}
const MOCK=({msgs,call})=>{const C=window.__case,last=msgs[msgs.length-1].text;if(!/Here is what you built/.test(last))return{say:C.badSay||'Done.',actions:C.bad};window.__bad=window.__bad||window.__chk.evalPage(C.checks);if(!window.__fixed&&new RegExp(C.fixWhen).test(last)){window.__fixed=1;return{say:C.fixSay,actions:C.fix};}return{say:'It matches the request.',actions:[]};};
const pad=(s,n)=>String(s).padEnd(n).slice(0,Math.max(n,String(s).length)),keep=async(T,id)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});const r=await T.ev(async()=>{const m=await import('./aisee.js');try{return(await m.sheet(window.amnicad.API,{width:1000})).b64;}catch{return null;}});r&&fs.writeFileSync(path.join(OUT,id+'.jpg'),Buffer.from(r,'base64'));};
const reset=async(T)=>{await T.ev(async()=>{window.amnicad.applyActions([{new:true}]);const c=document.querySelector('#ai-clear');c&&c.click();window.__chk=window.__chk||await import('./tests/ai_checks.mjs');});await T.reset();};
async function offline(){
  const T=await boot({engine:'anthropic',model:'claude-sonnet-5-5'});let bad=0;const rows=[];
  try{
    for(const c of cases){
      await reset(T);await T.ev(k=>{window.__case=k;window.__fixed=0;window.__bad=null;},c);await T.model(MOCK);
      const t0=Date.now();await T.send(c.prompt,180000);
      const calls=await T.calls(),chat=await T.chat(),looks=chat.filter(m=>m.role==='look').length,first=await T.ev(()=>window.__bad),fin=await T.ev(()=>window.__chk.evalPage(window.__case.checks)),vis=calls.slice(1).every((q,i)=>q.msgs.at(-1).images.length===(i===0&&first&&first.fail.some(f=>/nothing solid/.test(f))?0:1)),txt=calls[1]?calls[1].msgs.at(-1).text:'';
      const good=fin.fail.length===0&&first&&first.fail.length>0&&calls.length===3&&looks===2&&vis&&/Automated findings:\s*\n- /.test(txt);
      good||bad++;rows.push([c.id,first?first.fail.length+' failed':'-',calls.length+' calls, '+looks+' looks',fin.fail.length?fin.fail.length+' failed':fin.pass.length+' of '+(fin.pass.length)+' pass',good?'PASS':'FAIL',((Date.now()-t0)/1000).toFixed(0)+' s']);
      good||console.log('  '+c.id+': first state '+JSON.stringify(first&&first.fail)+'\n  final '+JSON.stringify(fin.fail)+' calls '+calls.length+' looks '+looks+' findings '+/Automated findings:\s*\n- /.test(txt));
      await keep(T,c.id);
    }
  }finally{await T.close();}
  console.log('\nOFFLINE: scripted mock model through the real assistant code path\n'+pad('case',11)+pad('first reply',14)+pad('loop',22)+pad('final checks',16)+pad('result',8)+'time');
  for(const r of rows)console.log(pad(r[0],11)+pad(r[1],14)+pad(r[2],22)+pad(r[3],16)+pad(r[4],8)+r[5]);
  console.log(bad?'\n'+bad+' FAILED':'\nALL '+rows.length+' PASS');return bad;
}
async function online(){
  if(!ENG.length){console.log('No API keys in the environment (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY); nothing to run online.');return 0;}
  const modes=flag('compare')?[false,true]:[true],res={};
  for(const[eng,kv,mv]of ENG){
    const want=process.env[mv]||'',T=await boot({engine:eng,key:process.env[kv],stub:false});res[eng]={};
    try{
      const used=await T.ev(async(w)=>{const API=window.amnicad.API,AI=API.ai;AI.ready||await API.connectAI();const m=(AI.models||[]).find(x=>w&&x.includes(w));m&&(AI.cfg.model=m,AI.label=m);return AI.cfg.model;},want);
      res[eng].model=used;console.log('engine',eng,'model',used);
      for(const c of cases)for(const on of modes){
        await reset(T);await T.ev(v=>{const k=document.querySelector('#ai-check');k&&k.checked!==v&&k.click();},on);
        const t0=Date.now();let err='';try{await T.send(c.prompt,480000);}catch(e){err=String(e.message||e).slice(0,60);}
        const chat=await T.chat(),looks=chat.filter(m=>m.role==='look').length,fin=await T.ev(cc=>window.__chk.evalPage(cc),c.checks),bad=chat.find(m=>m.role==='err');
        (res[eng][c.id]=res[eng][c.id]||{})[on?'loop':'single']={pass:!fin.fail.length&&!bad,looks,fail:fin.fail,err:bad?bad.text:err,s:Math.round((Date.now()-t0)/1000)};
        console.log('  '+pad(c.id,10)+(on?'loop  ':'single')+' '+(fin.fail.length||bad?'FAIL':'PASS')+' '+looks+' looks '+Math.round((Date.now()-t0)/1000)+' s'+(fin.fail.length?' '+fin.fail[0]:'')+(bad?' '+bad.text:''));
        if(on)await keep(T,eng+'_'+c.id);
      }
    }finally{await T.close();}
  }
  const cell=(r,m)=>{const x=r&&r[m];return x?(x.pass?'PASS':'FAIL')+(m==='loop'?' ('+x.looks+')':''):'-';},cols=ENG.map(e=>e[0]);
  console.log('\nONLINE pass table'+(flag('compare')?' (single-shot / with look-and-fix, looks in brackets)':'')+'\n'+pad('case',12)+cols.map(e=>pad(e+' '+(res[e].model||'').replace(/^models\//,'').slice(0,18),flag('compare')?36:30)).join(''));
  for(const c of cases)console.log(pad(c.id,12)+cols.map(e=>pad(flag('compare')?cell(res[e][c.id],'single')+' / '+cell(res[e][c.id],'loop'):cell(res[e][c.id],'loop'),flag('compare')?36:30)).join(''));
  for(const e of cols){const L=cases.filter(c=>res[e][c.id]&&res[e][c.id].loop&&res[e][c.id].loop.pass).length,S=cases.filter(c=>res[e][c.id]&&res[e][c.id].single&&res[e][c.id].single.pass).length;console.log(e+': '+L+' of '+cases.length+' pass with the loop'+(flag('compare')?', '+S+' single-shot':''));}
  return 0;
}
let code=0;
if(flag('online')){code=await online();}else{code=await offline();if(ENG.length)console.log('\nKeys found for '+ENG.map(e=>e[0]).join(', ')+'. Add --online to run the real models (this makes paid API calls).');}
process.exit(code?1:0);
