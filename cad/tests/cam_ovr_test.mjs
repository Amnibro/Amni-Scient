// Beta notice in every post, job-level parameter overrides, per-op overrides and the raw G-code editor patch (survives regeneration).
import {L,cat,D,tool,mach,mat,domeMesh,parseG} from './cam_harness.mjs';
import * as O from '../cam-ovr.js';
let bad=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)bad++;};
const KERF=new Set(['qtplasmac','firecontrol','sheetcut','grbl_laser']),Sh=(kind,role,o)=>({name:role,kind,role,depth:0,x:0,y:0,w:0,h:0,r:0,d:0,x2:0,y2:0,pts:[],closed:true,layer:'',...o}),shapes=[Sh('rect','cutout',{x:0,y:0,w:60,h:40,r:4}),Sh('circle','hole',{x:30,y:20,d:16})];
const flat=(post,x={})=>{const m=cat.machines.find(m=>m.post===post),tl=KERF.has(post)?tool(post==='grbl_laser'?'Laser kerf 0.008 in':'Plasma kerf 0.060 in'):tool('Flat 3.175 mm 2F (1/8 in)');
  return JSON.parse(L.cam_generate(JSON.stringify({...D,machine:m,tool:tl,material:mat('MDF'),post,shapes,stock_w:80,stock_h:60,stock_t:6,offset_x:10,offset_y:10,units:'mm',tabs:0,...x})));};
// 1. Beta header in every milling/kerf post, in that post's comment syntax, idempotent, first-line contracts kept.
for(const p of cat.posts.map(p=>p.id||p)){if(/lathe/.test(p))continue;const r=flat(p);if(!r.ok){ok(false,p+' generates: '+r.errors);continue;}
  const g=O.betaHeader(r.gcode),G=g.split('\n'),R=r.gcode.split('\n'),i=G.findIndex(l=>/beta: verify toolpaths in simulation and dry-run before cutting/i.test(l));
  const style=p==='shopbot'?/^' /:p==='siemens'||p==='centroid'?/^; /:p==='heidenhain'?/^\d+ ; /:/^\(.*\)$/;
  ok(i>0&&i<8&&style.test(G[i])&&/amni-cam/i.test(G[i-1])&&G.length===R.length+1&&O.betaHeader(g)===g,p+' beta header line '+(i+1)+': '+G[i]);
  if(p==='firecontrol')ok(G[0]==='(v1.6-af)','firecontrol keeps (v1.6-af) first');
  if(p==='siemens')ok(/^%_N_/.test(G[0]),'siemens keeps %_N_ first');
  if(p==='shopbot')ok(/^IF %\(25\)/.test(G[2]),'shopbot keeps the units guard on line 3');
  if(p==='heidenhain')ok(G.every((l,k)=>!/^\d+ /.test(l)||+l.split(' ')[0]===k)&&/END PGM/.test(G[G.length-1]||G[G.length-2]),'heidenhain block numbers stay consecutive');
  if(/^(haas|fanuc|mazak|okuma)$/.test(p))ok(G[i]===G[i].toUpperCase(),p+' notice is uppercase like the rest of the header');}
// 2. Job-level parameter overrides reach the engine (flat).
{const base={...D,machine:mach('Avid PRO4848'),tool:tool('Flat 3.175 mm 2F (1/8 in)'),material:mat('MDF'),post:'linuxcnc',shapes,stock_w:80,stock_h:60,stock_t:6,offset_x:10,offset_y:10,units:'mm',tabs:2};
  const a=JSON.parse(L.cam_generate(JSON.stringify(base))),j=O.applyParams('flat',base,{p:{feed:777,plunge:211,rpm:12345,doc:1,safe_z:17,tab_w:9,bogus:5,clear:-3}}),b=JSON.parse(L.cam_generate(JSON.stringify(j)));
  ok(j.feed===777&&j.bogus===undefined&&j.clear===base.clear,'applyParams keeps known valid keys only');
  ok(b.ok&&/F777\b/.test(b.gcode)&&/F211\b/.test(b.gcode)&&/S12345\b/.test(b.gcode),'feed / plunge / spindle overrides are posted');
  ok(/Z17\.0*\b/.test(b.gcode),'safe height override is posted');
  const passes=g=>parseG(g).mv.filter(m=>m.k===1&&m.z<-0.01).map(m=>m.z.toFixed(3)),pa=new Set(passes(a.gcode)),pb=new Set(passes(b.gcode));
  ok(pb.size>pa.size,'smaller stepdown gives more Z levels: '+pa.size+' -> '+pb.size);
  const c=JSON.parse(L.cam_generate(JSON.stringify(O.applyParams('flat',base,{p:{climb:!base.climb}}))));ok(c.ok&&c.gcode!==a.gcode,'cut direction override changes the path');}
// 3. Solid route: params into opts, per-op feed / spindle / skip on the posted program.
const solid=(m,x={})=>JSON.parse(L.solid_cam(JSON.stringify(O.applyParams('solid',{name:'dome',units:'mm',machine:mach(m),material:mat('Aluminum 6061 (VMC'),mesh:domeMesh(60,50,12,6,16),holes:[],opts:{strategy:'auto',scallop:0.1}},x))));
{const r=solid('Haas VF-2'),s=r.setups[0],g=s.gcode,G=g.split('\n'),ops=s.ops;ok(r.ok&&ops.length>2,'dome solid job has '+ops.length+' ops');
  const r2=solid('Haas VF-2',{p:{safe:12}});ok(r2.ok&&/G0 Z12\.000/.test(r2.setups[0].gcode)&&!/G0 Z5\.000/.test(r2.setups[0].gcode),'solid safe height override is posted');
  const k=ops.findIndex(o=>o.kind==='rough'),key=O.opKey(0,ops,k),F=(t,a,b)=>t.split('\n').slice(a-1,b).join('\n').match(/F\d+\.?\d*/g)||[];
  const h=O.applyOps(g,ops,{ops:{[key]:{feed_pct:50}}},0),H=h.text.split('\n'),o=ops[k];
  ok(H.length===G.length&&F(g,o.line_start,o.line_end).every((f,i)=>Math.abs(+F(h.text,o.line_start,o.line_end)[i].slice(1)-f.slice(1)/2)<=0.5),'feed 50 % halves every F word in '+o.name);
  ok(G.slice(0,o.line_start-1).join()===H.slice(0,o.line_start-1).join()&&G.slice(o.line_end).join()===H.slice(o.line_end).join(),'lines outside the op are untouched');
  const kn=ops.findIndex((o,i)=>i>0&&o.tool===ops[i-1].tool);ok(kn>0,'an op shares the previous tool: '+(kn>0&&ops[kn].name));
  if(kn>0){const on=ops[kn],q=O.applyOps(g,ops,{ops:{[O.opKey(0,ops,kn)]:{rpm_pct:80}}},0,{s_max:8100}),Q=q.text.split('\n');const seg=Q.slice(on.line_start-1,on.line_end+2);
    const sv=seg.filter(l=>/^S\d/.test(l));ok(Q.length===G.length+2&&sv.length===2,'spindle override inserts S'+(sv[0]||'').slice(1)+' and restores '+(sv[1]||''));
    ok(sv.length===2&&Math.abs(+sv[0].slice(1)-Math.min(8100,+sv[1].slice(1)*0.8))<=1,'spindle override is 80 % of the running speed');
    const q2=O.applyOps(g,ops,{ops:{[O.opKey(0,ops,kn)]:{rpm_pct:200}}},0,{s_max:8100});ok(q2.text.split('\n').some(l=>l==='S8100')&&q2.notes.some(n=>/machine maximum/.test(n)),'spindle override is held at the machine maximum');}
  const kf=ops.length-1,of=ops[kf],sk=O.applyOps(g,ops,{ops:{[O.opKey(0,ops,kf)]:{skip:true}}},0),S=sk.text.split('\n'),cut=S.slice(of.line_start-1);
  ok(S.length<G.length&&!cut.some(l=>/^G[0123]? ?[XY]/.test(l)&&!/G53|G43/.test(l))&&cut.includes('G0 Z5.000')&&sk.notes.length===1,'skipping the last op drops its moves and keeps the retract');
  const pg=parseG(sk.text);ok(pg.mv.length>0&&!pg.warn.some(w=>/plane/.test(w)),'program with a skipped op still parses');
  // 4. Raw editor: edits persist as hunks and re-apply after regeneration with other parameters.
  const E=G.slice();const li=E.findIndex((l,i)=>i>o.line_start&&/^G1 /.test(l));E.splice(li,1);const ci=E.findIndex(l=>/^M8$/.test(l));E[ci]='M7 (MIST)';E.splice(5,0,'(SHOP NOTE: CHECK VISE TORQUE)');
  const P=O.makePatch(g,E.join('\n'));ok(P.length===3,'editor records 3 hunks');ok(O.applyPatch(g,P).text===E.join('\n'),'patch reproduces the edit on the same code');
  const g2=r2.setups[0].gcode,ap=O.applyPatch(g2,P);ok(ap.applied===3&&ap.stale.length===0&&ap.text.includes('(SHOP NOTE: CHECK VISE TORQUE)')&&ap.text.includes('M7 (MIST)'),'edits survive regeneration with a new safe height: '+ap.applied+' applied, '+ap.stale.length+' stale');if(ap.stale.length)console.log(JSON.stringify(ap.stale));
  const bad1=O.applyPatch('A\nB\nC',[{a:1,del:['Z'],ins:['Y'],pre:['A'],post:['C']}]);ok(bad1.stale.length===1&&bad1.text==='A\nB\nC','a hunk whose lines are gone is reported stale, not forced');
  const dv=O.diffView(g,E.join('\n'));ok(dv.filter(x=>x.t==='-').length===2&&dv.filter(x=>x.t==='+').length===2,'diff view shows 2 removed and 2 added lines');
  // 5. finalize(): engine output kept, overrides + edits + beta header in the exported program.
  const R={...r,setups:r.setups.map(x=>({...x}))},ov={ops:{[key]:{feed_pct:50}},edits:{[O.fileKey(R.setups[0],0)]:{hunks:P}}};O.finalize(R,ov);const f=R.setups[0];
  ok(f.gen===g&&/BETA: VERIFY TOOLPATHS/.test(f.gcode.split('\n').slice(0,6).join())&&f.gcode.includes('(SHOP NOTE: CHECK VISE TORQUE)')&&f.ovr.edited&&f.ovr.notes.length===1,'finalize keeps generated code and exports overrides, edits and the beta header');
  ok(O.hasOvr(ov)&&!O.hasOvr({p:{},ops:{x:{feed_pct:100}},edits:{}}),'hasOvr ignores neutral entries');
  O.finalize(R,ov);ok(R.setups[0].gcode===f.gcode,'finalize is repeatable');}
{const r=solid('ShopBot'),s=r.setups[0],ops=s.ops,g=s.gcode;if(!r.ok){ok(false,'shopbot solid: '+r.errors);}else{
  const k=ops.findIndex(o=>o.kind==='rough'),o=ops[k],h=O.applyOps(g,ops,{ops:{[O.opKey(0,ops,k)]:{feed_pct:50}}},0);
  const H=h.text.split('\n'),ms=H.slice(o.line_start-1,o.line_end+2).filter(l=>/^MS,/.test(l)),pv=g.split('\n').slice(0,o.line_start-1).filter(l=>/^MS,/.test(l)).pop();ok(ms.length===2&&Math.abs(+ms[0].split(',')[1]-pv.split(',')[1]/2)<1e-3&&ms[1]===pv,'ShopBot feed override sets MS '+ms[0]+' for the op and restores '+pv);
  const bh=O.betaHeader(g).split('\n');ok(/^IF %\(25\)/.test(bh[2])&&bh.some(l=>/^' Beta: verify/.test(l)),'ShopBot beta comment after the guard');}}
console.log(bad?bad+' FAIL':'ALL PASS');process.exit(bad?1:0);
