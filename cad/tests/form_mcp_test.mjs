import fs from 'node:fs';import path from 'node:path';import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const E=await startE2E({web:+process.env.E2E_WEB||18797,mcp:+process.env.E2E_MCP||18798});
try{const tl=(await E.rpc('tools/list',{})).result.tools,tk=tl.find(t=>t.name==='form_key'),tr=tl.find(t=>t.name==='form_render');ok(tk&&tr&&tr.inputSchema.properties.passes&&tk.inputSchema.properties.interpolation,'MCP lists form_key and form_render');
  const lang=await E.call('get_design_language',{topic:'form'});ok(/Lights: name light/.test(lang.content[0].text)&&/ik BONE TARGET/.test(lang.content[0].text),'design language has a form topic with lights, IK, actions and curves');
  const set=E.T(await E.call('form_set',{scene:`ball sphere 0,0,.5 r.5 #f2a541
floor box 0,0,-.1 4,4,.2 #d0d4da
key light spot 2,-2,3 0,0,.5 w2 k4500 c45
cam1 camera 3,-3,1.5 0,0,.4 mm40
@camera cam1`}));ok(!set.errors.length,'form_set adds a light and a camera',JSON.stringify(set.errors));
  const k=E.T(await E.call('form_key',{keys:[{object:'ball',channel:'loc',time:0,value:[0,0,0]},{object:'ball',channel:'loc',frame:15,value:[0,0,1],interpolation:'bezier'},{object:'ball',channel:'loc',time:1,value:[0,0,0]},{object:'key',channel:'power',time:0,value:1},{object:'key',channel:'power',time:1,value:3},{object:'ball',channel:'rot',time:1,value:[0,0,90],action:'spin'}]}));
  ok(!k.errors.length&&k.animation&&k.animation.length_s>=1,'form_key keys several objects and channels in one call',JSON.stringify(k.lines));
  const st=await E.call('form_render',{kind:'still',width:96,height:72,samples:2,engine:'raster',time:0.5});ok(st.content&&st.content[0].type==='image'&&st.content[0].data.length>500&&JSON.parse(st.content[1].text).scene_lights===1,'form_render still returns the image like screenshot',st.content&&st.content[1]&&st.content[1].text);
  const sp=await E.call('form_render',{kind:'still',width:64,height:48,samples:1,engine:'raster',passes:['depth','id'],path:'shots/ball.png'});const sj=JSON.parse(sp.content[1].text);ok(fs.existsSync(path.join(E.dir,'shots/ball.png'))&&sj.passes_saved&&sj.passes_saved.length===2&&sj.passes_saved.every(f=>fs.existsSync(f)),'form_render still with path saves the image and its passes',JSON.stringify(sj.passes_saved));
  const an=E.T(await E.call('form_render',{kind:'animation',width:48,height:32,samples:1,engine:'raster',format:'png'}));const zf=an.saved&&fs.readFileSync(an.saved),cnt=zf?zf.readUInt16LE(zf.length-22+10):0;ok(an.saved&&/\.zip$/.test(an.saved)&&cnt===an.frames&&an.frames===30,'form_render animation saves a PNG sequence zip in the save folder',an.saved+' · '+cnt+' frames');
  const wv=E.T(await E.call('form_render',{kind:'animation',width:48,height:32,engine:'raster',path:'clip.webm'}));ok(wv.saved&&fs.statSync(wv.saved).size>1000&&wv.kind==='webm','form_render animation saves a WebM',wv.saved);
  const u1=E.T(await E.call('form_set',{patch:'lean sphere 0,0,30 r3'}));ok(u1.changed&&u1.scene===undefined&&u1.lines>0,'form_set answers with a summary, not the whole scene again',Object.keys(u1).join(','));
  const g0=E.T(await E.call('form_get')),g1=E.T(await E.call('form_get')),g2=E.T(await E.call('form_get',{spec:true})),SP=/one item per line/;ok(SP.test(g0.spec)&&!SP.test(g1.spec)&&g1.spec.length<80&&SP.test(g2.spec)&&/lean sphere/.test(g1.scene),'form_get sends the grammar spec once per session, then only when asked (spec:true)',[g0.spec.length,g1.spec.length,g2.spec.length]);
  const s1=E.T(await E.call('get_state')),s2=E.T(await E.call('get_state'));ok((Array.isArray(s1.materials)?s1.materials.length>100:true)&&typeof s2.materials==='string'&&s2.materials.length<80,'get_state lists the materials once per session',[typeof s1.materials,typeof s2.materials]);
  ok(!E.errs.length,'no page errors'+(E.errs.length?': '+E.errs.slice(0,3).join(' | '):''));
}catch(e){fail++;console.log('FAIL',e.stack||e.message);}finally{await E.close();}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
