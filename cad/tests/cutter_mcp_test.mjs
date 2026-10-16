import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const E=await startE2E({web:+process.env.E2E_WEB||18717,mcp:+process.env.E2E_MCP||18718});
try{
  const tl=await E.rpc('tools/list',{}),names=tl.result.tools.map(t=>t.name);
  ok(['cutter_design','molding_profile','cutter_toolpath'].every(n=>names.includes(n)),'MCP lists cutter_design, molding_profile and cutter_toolpath');
  const lib=E.T(await E.call('molding_profile',{list:true}));
  ok(lib.profiles.length>=25&&lib.profiles.some(p=>p.id==='ogee_roman')&&/Loughborough/.test(lib.rpm_source)&&/hook/i.test(lib.knife_formula),'molding_profile lists the library with the rpm and knife sources',lib.profiles.length+' profiles');
  const mp=E.T(await E.call('molding_profile',{prof:'stick',pp:{gd:0.4},cope_pp:{gd:0.375}}));ok(mp.fit&&mp.fit.ok===false&&mp.fit.gap_in>0.02,'molding_profile reports the cope and stick fit for mismatched dimensions',mp.fit&&mp.fit.gap_in.toFixed(4));
  await E.call('apply_actions',{actions:[{new:true,units:'in'}]});
  const d=E.T(await E.call('cutter_design',{type:'bit',prof:'ogee_roman',bit:{shank:'1/2',brg:'1/2x3/16',wings:3},rpm:18000}));
  ok(d.feature_id&&!d.errors&&d.cutter.cutting_diameter_in>1&&d.checks.some(c=>c.key==='rpm'&&c.lvl==='ok'),'cutter_design adds a router bit and checks its rim speed',d.cutter&&d.cutter.cutting_diameter_in+' in');
  const d2=E.T(await E.call('cutter_design',{type:'shaper',prof:'cove',pp:{r:0.5},shaper:{dia:3.5,spindle:'1-1/4'},rpm:16000,add:false}));
  ok(d2.checks.find(c=>c.key==='rpm').lvl==='err'&&/12,000/.test(d2.checks.find(c=>c.key==='rpm').msg),'cutter_design rejects 16,000 rpm on a 3-1/2 in cutter');
  const k=E.T(await E.call('cutter_design',{type:'knife',prof:'ogee_roman',knife:{rc:4,hook:20,proj:0.5},add:false}));
  ok(Math.abs(k.knife.knife_depth_at_max_in-0.4885)<2e-4&&/KNIFE_PROFILE/.test(k.knife_dxf)&&/MOLDING_TEMPLATE/.test(k.template_dxf),'cutter_design returns the corrected knife depth and both DXF files',k.knife.knife_depth_at_max_in);
  const t=E.T(await E.call('cutter_toolpath',{mode:'bit',post:'grbl',len:2,prof:'roundover',pp:{r:0.25},gcode:false}));
  const exp=0.25**2*(1-Math.PI/4)*2;ok(t.ok&&Math.abs(t.removed_in3/exp-1)<0.07&&t.gouge_cells===0&&!t.gcode,'cutter_toolpath machines the roundover with the bit in the simulator',t.removed_in3+' in³ vs '+exp.toFixed(4));
  const b=E.T(await E.call('cutter_toolpath',{mode:'ball',post:'shopbot',len:2,ball:0.125,step:0.01}));ok(b.ok&&b.post==='shopbot'&&/^SA$/m.test(b.gcode)&&b.removed_in3>exp*0.85,'cutter_toolpath ball-nose raster with the ShopBot post',b.removed_in3+' in³, '+b.passes+' moves');
  const shot=E.T(await E.call('get_state',{}));ok(shot.features.some(f=>f.type==='bit'),'the bit is in the model state');
  ok(!E.errs.length,'no page errors'+(E.errs.length?': '+E.errs.join(' | '):''));
}catch(e){fail++;console.log('FAIL',e.message);}finally{await E.close();}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
