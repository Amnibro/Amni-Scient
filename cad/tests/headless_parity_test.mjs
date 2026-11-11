import {startE2E} from './e2e_lib.mjs';
import * as H from '../headless.js';
import * as K from '../kernel.js';
import * as MC from '../mold_core.js';
import * as UN from '../units.js';
import {mergeMold} from '../schema.js';
await H.init(new URL('../vendor/replicad_single.wasm',import.meta.url).pathname);
const E=await startE2E({web:+process.env.E2E_WEB||18797,mcp:+process.env.E2E_MCP||18798,pro:true});let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const load=d=>E.page.evaluate(async d=>{const A=window.amnicad.API;A.loadDoc(JSON.parse(JSON.stringify(d)),null);await A.waitBuild();},d);
const tool=async(n,a)=>{const r=await E.call(n,a);if(r.isError)throw new Error(n+': '+r.content[0].text);return E.T(r);};
const sig=o=>JSON.stringify(o,(k,v)=>ArrayBuffer.isView(v)?Array.from(v):v);
const near=(name,pg,hl,exact,rel)=>{const bad=[...exact.filter(k=>JSON.stringify(pg[k])!==JSON.stringify(hl[k])).map(k=>k+': page '+JSON.stringify(pg[k])+' vs headless '+JSON.stringify(hl[k])),...Object.entries(rel).filter(([k,t])=>pg[k]!==hl[k]&&!(Math.abs(pg[k]-hl[k])<=t*Math.max(Math.abs(pg[k]),1e-9))).map(([k,t])=>k+': page '+pg[k]+' vs headless '+hl[k]+' (over '+t*100+' %)')];ok(!bad.length,name+' results agree\n  '+bad.join('\n  '));console.log(name,bad.length?'DIFFERS':'agrees',JSON.stringify(hl).slice(0,200));};
const PLATE={name:'plate',units:'mm',material:'al6061',params:[],features:[{id:'p',type:'box',w:60,d:60,h:1.5},{id:'b',type:'cylinder',r:4,h:6,x:15,y:15}]};
const CARD={name:'card',units:'in',material:'al6061',params:[],features:[{id:'p',type:'box',w:3,d:2,h:0.08},{id:'h',type:'hole',pts:[[0.9,0.5]],d:0.25}]};
const MOLD_EXACT=['material','grade','short_shot','filled_pct','mesh_nodes','thickness_mm','gates','suggested_gate'],MOLD_REL={fill_time_s:0.05,max_injection_pressure_MPa:0.05,clamp_force_kN:0.05,pack_pressure_MPa:0.05,vol_shrink_avg_pct:0.05};
try{
  for(const[doc,mold,tag]of[[PLATE,{material:'pp',gates:[[-30,0,0.75]],mesh:'quick'},'mold pp plate'],[CARD,{material:'lsr50',gates:'auto',mesh:'quick',runner:{on:true,L:40}},'mold lsr card (in, auto gate, runner)'],[PLATE,{material:'abs',gates:[[30,-30,1.5],[-30,30,1.5]],mesh:'standard',packPct:70},'mold abs plate two gates']]){
    await load(doc);await tool('apply_actions',{actions:[{mold}]});
    const pin=await E.page.evaluate(async()=>{const MC=await import('./mold_core.js'),UN=await import('./units.js'),S=window.amnicad.S;return JSON.stringify(MC.prepare({doc:S.doc,mesh:S.mesh,units:UN},S.moldSuggest).inp,(k,v)=>ArrayBuffer.isView(v)?Array.from(v):v);});
    const d={units:'mm',params:[],...JSON.parse(JSON.stringify(doc))},sg=mergeMold(d,mold);K.resetCache();const b=await K.build(d,{blobs:{}});
    ok(pin===sig(MC.prepare({doc:d,mesh:K.meshBody(b.body),units:UN},sg).inp),tag+': the page and headless hand the solver identical input');
    const pg=await tool('run_injection_molding',{}),hl=await H.mold({doc,mold});near(tag,pg,hl,MOLD_EXACT,MOLD_REL);}
  ok(!E.errs.length,'no page errors: '+E.errs.join(' | '));
}finally{await E.close();}
console.log(fail?`${fail} failed, ${pass} passed`:`ALL ${pass} PASS`);process.exit(fail?1:0);
