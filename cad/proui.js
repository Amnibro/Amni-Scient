import {SHELL,TABLET} from './mobile.js';
import {ico,has} from './icons.js';
const DESK=`(not (max-width:699px)) and (not ((pointer:coarse) and (not (any-pointer:fine)) and (max-width:1100px)))`;
const MODES={amni:'Amni',workshop:'Workshop',blueprint:'Blueprint'},LEGACY={sw:'workshop',creo:'blueprint'};
const PLANES={workshop:[['XZ','Front Datum','front'],['XY','Top Datum','top'],['YZ','Right Datum','right']],blueprint:[['XZ','Front (XZ)','front'],['XY','Top (XY)','top'],['YZ','Right (YZ)','right']]};
const NAMES={workshop:{extrude:['Extrude','Cut Extrude'],revolve:['Revolve','Cut Revolve'],sweep:['Sweep','Cut Sweep'],loft:['Loft','Cut Loft'],hole:['Hole'],fillet:['Fillet'],chamfer:['Chamfer'],shell:['Shell'],pattern:['Linear Pattern','Circular Pattern'],mirror:['Mirror'],coil:['Coil'],thread:['Thread'],split:['Split'],scale:['Scale'],move:['Move'],box:['Box'],cylinder:['Cylinder'],sphere:['Sphere'],cone:['Cone'],torus:['Torus']},blueprint:{extrude:['Extrude','Extrude'],revolve:['Revolve','Revolve'],sweep:['Sweep','Sweep'],loft:['Loft','Loft'],hole:['Hole'],fillet:['Fillet'],chamfer:['Chamfer'],shell:['Shell'],pattern:['Pattern','Pattern'],mirror:['Mirror'],coil:['Coil'],thread:['Thread'],split:['Split'],scale:['Scale'],move:['Move'],box:['Box'],cylinder:['Cylinder'],sphere:['Sphere'],cone:['Cone'],torus:['Torus']}};
const B=(id,label,icon,run,opt={})=>({id,label,icon,run,...opt});
function ribbon(mode,X){if(X.api.hooks.ribbon)return X.api.hooks.ribbon(mode,B,X);
  const F=(t,cut,label,icon,extra)=>B(t+(cut?'-cut':'')+(extra&&extra.kind?'-'+extra.kind:''),label,icon,()=>X.feat(t,{...(cut?{op:'cut'}:{}),...(extra||{})},cut),{cut});
  const skOpen=B('s-open','Sketch','✎',()=>X.sketch());
  const sk=[['rect','Rectangle','▭'],['circle','Circle','◯'],['slot','Slot','⊂⊃'],['poly','Polygon','⬡'],['path','Line','⟋'],['spline','Spline','∿'],['ellipse','Ellipse','⬭'],['text','Text','A']].map(([k,l,i])=>B('s-'+k,l,i,()=>X.shape(k)));
  const evalg=[B('measure','Measure','📏',()=>X.measure()),B('mass','Mass Properties','⚖',()=>X.mass()),B('section','Section View','◫',()=>X.click('#b-sec')),B('check','Design Review','✔',()=>X.tab('check')),B('render','Photo Render','📷',()=>X.api.act('render'))];
  const prim=['box','cylinder','sphere','cone','torus'].map(t=>F(t,false,X.api.FT[t].n,X.api.FT[t].i));
  const sk2=[['Sketch',[skOpen]],['Quick shapes',sk]],ai=[B('ai','AI Assistant','✦',()=>X.tab('ai')),B('refs','References','🖼',()=>{X.tab('ai');setTimeout(()=>{const e=document.getElementById('refs');e&&e.scrollIntoView({block:'nearest'});},80);})],sim=(a,b,c)=>[B('sim',a,'🧱',()=>X.tab('sim')),B('flow',b,'🌬',()=>X.tab('flow')),B('mold',c,'💉',()=>X.tab('mold'))],inMake=(f,act)=>()=>{X.tab('make');const go=(n=0)=>{const e=f();e?act(e):n<30&&setTimeout(()=>go(n+1),150);};go();},make=[B('make','Instant Quote','💲',()=>X.tab('make')),B('cam','Toolpath & G-code','⚙',inMake(()=>[...document.querySelectorAll('#tab-make h3')].find(x=>/toolpath/i.test(x.textContent)),e=>e.scrollIntoView({block:'start',behavior:'smooth'}))),B('gsim','Simulate G-code','▶',inMake(()=>document.getElementById('mk-sim'),e=>e.click())),B('dies','Cutting & Forming Dies','⚒',()=>X.tab('dies')),B('tooling','Molds & Dies','⧉',()=>X.api.setWS('tool'))],vault=[B('vault','Vault','🗄',()=>X.tab('vault'))],tool=[B('cutters','Cutters','🪚',()=>X.tab('cutters')),F('edgeprofile',false,'Edge Profile','⌐'),F('molding',false,'Molding','≋'),F('bit',false,'Router Bit','⇟'),F('shaper',false,'Shaper Cutter','◍'),F('knife',false,'Molder Knife','▭')];
  return mode==='blueprint'?[
    ['Model',[['History',[B('regen','Regenerate','⟳',()=>X.api.rebuild()),B('undo','Undo','↶',()=>X.api.undo()),B('redo','Redo','↷',()=>X.api.redo())]],['Form',[F('extrude',false,'Extrude','⬆'),F('revolve',false,'Revolve','↻'),F('sweep',false,'Sweep','〰'),F('loft',false,'Loft','⏶'),F('coil',false,'Coil','➰')]],['Detail',[F('hole',false,'Hole','⊙',{std:'#10',fit:'clearance'}),F('fillet',false,'Fillet','◜'),F('chamfer',false,'Chamfer','◸'),F('shell',false,'Shell','▢'),F('thread',false,'Thread','🔩')]],['Modify',[F('pattern',false,'Pattern','⁘'),F('mirror',false,'Mirror','⇋'),F('split',false,'Split','⫽'),F('scale',false,'Scale','⤢'),F('move',false,'Move','✥')]],['Primitives',prim]],null],
    ['Sketch',sk2,null],['Analysis',[['Measure',evalg]],'check'],['Simulate',[['Analyses',sim('Structure','Flow Study','Injection Molding')]],'sim'],['Manufacturing',[['Quote and NC',make],['Tooling',tool]],'make'],['Detailing',[['Drawing',[B('draw','Drawing','📐',()=>X.tab('draw'))]]],'draw'],['Data',[['Data management',vault]],'vault'],['Tools',[['Assistant',ai]],'ai']
  ]:[
    ['Features',[['Add',[F('extrude',false,'Extrude','⬆'),F('revolve',false,'Revolve','↻'),F('sweep',false,'Sweep','〰'),F('loft',false,'Loft','⏶')]],['Cut',[F('extrude',true,'Extrude Cut','⬆'),F('revolve',true,'Revolve Cut','↻'),F('sweep',true,'Sweep Cut','〰'),F('loft',true,'Loft Cut','⏶'),F('hole',false,'Hole','⊙',{std:'#10',fit:'clearance'})]],['Modify',[F('fillet',false,'Fillet','◜'),F('chamfer',false,'Chamfer','◸'),F('shell',false,'Shell','▢'),F('pattern',false,'Linear Pattern','⁘'),F('pattern',false,'Circular Pattern','✺',{kind:'circular'}),F('mirror',false,'Mirror','⇋')]],['More',[F('coil',false,'Coil','➰'),F('thread',false,'Thread','🔩'),F('split',false,'Split','⫽'),F('scale',false,'Scale','⤢'),F('move',false,'Move','✥'),B('rebuild','Rebuild','⟳',()=>X.api.rebuild())]],['Primitives',prim]],null],
    ['Sketch',sk2,null],['Evaluate',[['Evaluate',evalg]],'check'],['Simulation',[['Studies',sim('Structural Study','Flow Study','Injection Molding')]],'sim'],['Manufacture',[['Quote and CAM',make],['Tooling',tool]],'make'],['Drawing',[['Drawing',[B('draw','Drawing','📐',()=>X.tab('draw'))]]],'draw'],['Vault',[['PDM',vault]],'vault'],['Assistant',[['AI',ai]],'ai']
  ];
}
const LOOK={workshop:[`--bg:#161A1F;--bg2:#1B2026;--panel:#21272E;--panel2:#2A313A;--line:#333C47;--line2:#465160;--ink:#E9EDF2;--ink2:#C5CDD8;--mut:#A0ABB9;--acc:#5AA2F0;--acc-ink:#06121F;--acc-soft:rgba(90,162,240,.16);--r:8px;--grid:#8795A8;--vp:linear-gradient(180deg,#38414D 0%,#161A1F 100%)`,`--bg:#E7EBF0;--bg2:#DCE2E9;--panel:#F6F8FA;--panel2:#EBEFF3;--line:#C8D0DA;--line2:#AEB9C6;--ink:#14181D;--ink2:#2A323D;--mut:#505D6E;--acc:#1A5FB4;--acc-ink:#FFFFFF;--acc-soft:rgba(26,95,180,.11);--r:8px;--grid:#5D6B7E;--vp:linear-gradient(180deg,#F5F8FB 0%,#BAC6D3 100%)`],
blueprint:[`--bg:#0C131B;--bg2:#101A25;--panel:#142030;--panel2:#1A2A3E;--line:#233850;--line2:#31506F;--ink:#E2EEF8;--ink2:#B9CEE0;--mut:#8EA9C2;--acc:#3CC8E6;--acc-ink:#03202A;--acc-soft:rgba(60,200,230,.14);--r:3px;--grid:#5FB7D4;--vp:linear-gradient(180deg,#1A2E44 0%,#0A121B 100%)`,`--bg:#E2EAF2;--bg2:#D8E2ED;--panel:#F4F8FC;--panel2:#E8EFF6;--line:#C2D0E0;--line2:#A5B8CE;--ink:#0D1D32;--ink2:#22374E;--mut:#4A647F;--acc:#0A6F89;--acc-ink:#FFFFFF;--acc-soft:rgba(10,111,137,.1);--r:3px;--grid:#2A7F9C;--vp:linear-gradient(180deg,#EBF2F9 0%,#B4C7DA 100%)`]};
const LOOKCSS=Object.entries(LOOK).map(([k,[d,l]])=>`html.pro-${k}{${d}}html[data-theme="light"].pro-${k}{${l}}@media (prefers-color-scheme:light){html:not([data-theme="dark"]):not([data-theme="hc"]).pro-${k}{${l}}}`).join('\n');
const CSS=LOOKCSS+`
html.ui-amni{--font:"Archivo","Segoe UI Variable Display","Segoe UI",system-ui,sans-serif}
html[data-mn] input[type=number],html[data-mn] .prow input,html[data-mn] .fld .ex input,html[data-mn] .prow .val,html[data-mn] .kv span:nth-child(even),html[data-mn] #pbar{font-family:var(--mono)}
.ic24{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:var(--iw,1.8);stroke-linecap:round;stroke-linejoin:round;display:block}
.gi .ic24{width:100%;height:100%}
#ui-menu .pop button.on{background:var(--acc-soft)}
#qfav .gi{width:20px;height:20px;display:block}
.feat .ic svg{width:14px;height:14px}
header .brand svg .mk{stroke:var(--brand)}
header .brand svg .mk2{stroke:var(--acc)}
.pro header{box-shadow:inset 0 -1px 0 color-mix(in srgb,var(--brand) 38%,var(--line))}
.spl{display:none;position:absolute;top:0;bottom:0;width:9px;margin-left:-4px;z-index:6;cursor:col-resize;touch-action:none;align-items:center;justify-content:center}
.spl::before{content:'';position:absolute;top:0;bottom:0;left:4px;width:1px;background:transparent;transition:background .15s}
.spl:hover::before,.spl.drag::before,.spl:focus-visible::before{background:var(--acc);width:2px;left:3px}
.spl button{position:relative;z-index:1;width:15px;height:44px;border-radius:calc(7px*var(--rk,1));background:var(--panel);border:1px solid var(--line2);color:var(--mut);font-size:10px;line-height:1;opacity:0;transition:opacity .15s;display:grid;place-items:center;padding:0}
.spl:hover button,.spl:focus-within button,.spl.drag button{opacity:1}
@media ${DESK}{
.spl{display:flex}
#right .rtabs{flex-wrap:wrap}
#right .rtabs button{flex:1 1 auto;padding:7px 7px 8px}
body.lc #left,body.rc #right,.pro.rp-off #right{display:none}
body.lc main{--lwc:0px}body.rc main,.pro.rp-off main{--rwc:0px}
.pro #right .rtabs{display:none}
.pro #left{display:flex;flex-direction:column}
.pro #left .sec.eqs{order:2;border-top:1px solid var(--line)}
.pro #left .sec.eqs h3{cursor:pointer;user-select:none;justify-content:flex-start}
.pro #left .sec.eqs h3 button{margin-left:auto}
.pro #left .sec.eqs h3::before{content:'▾';display:inline-block;width:14px;transition:transform .15s}
.pro #left .sec.eqc h3::before{transform:rotate(-90deg)}
.pro #left .sec.eqc #params{display:none}
.pro #left .sec:has(#palette){display:none}
.pro .vtools{left:50%!important;transform:translateX(-50%);right:auto!important;flex-wrap:nowrap!important;width:max-content;max-width:calc(100% - 24px)}
html[data-rp=left].pro body{display:grid;grid-template-columns:max-content minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto}
html[data-rp=left].pro header,html[data-rp=left].pro #pbar{grid-column:1/-1}
html[data-rp=left].pro #ribbon{grid-column:1;grid-row:2;flex-direction:column;width:196px;overflow-y:auto;border-bottom:0;border-right:1px solid var(--line)}
html[data-rp=left].pro main{grid-column:2;grid-row:2}
html[data-rp=left].pro #pbar{grid-row:3}
html[data-rp=left].pro #ribbon .rt{flex-wrap:wrap;padding:6px;border-bottom:1px solid var(--line)}
html[data-rp=left].pro #ribbon .rt button{padding:4px 8px}
html[data-rp=left].pro #ribbon .rb{flex-direction:column;overflow:visible;min-height:0;padding:4px 6px}
html[data-rp=left].pro #ribbon .rg{flex-direction:column;border-right:0;border-bottom:1px solid var(--line);padding:4px 0 2px}
html[data-rp=left].pro #ribbon .rg .bs{flex-wrap:wrap}
html[data-rp=left].pro #ribbon .rg .gl{order:-1;text-align:left;padding:0 4px 3px}
}
#ribbon{display:none;flex-direction:column;background:var(--panel);border-bottom:1px solid var(--line);flex-shrink:0;z-index:4}
.pro #ribbon{display:flex}
#ribbon .rt{display:flex;gap:0;padding:0 8px;border-bottom:1px solid var(--line);background:var(--bg2)}
#ribbon .rt button{padding:6px 14px 5px;font-size:12px;font-weight:600;color:var(--mut);border-bottom:2px solid transparent;margin-bottom:-1px}
#ribbon .rt button.on{color:var(--ink);border-color:var(--acc);background:var(--panel)}
#ribbon .rt button:hover{color:var(--ink)}
#ribbon .rb{display:flex;gap:0;padding:4px 6px 0;overflow-x:auto;scrollbar-width:thin;min-height:76px}
#ribbon .rg{display:flex;flex-direction:column;border-right:1px solid var(--line);padding:0 6px;flex-shrink:0}
#ribbon .rg:last-child{border-right:0}
#ribbon .rg .bs{display:flex;gap:1px;flex:1}
#ribbon .rg .gl{font-size:10.5px;color:var(--mut);text-align:center;padding:2px 0 4px;letter-spacing:.02em}
#ribbon .cmd{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;width:58px;padding:5px 2px 3px;border-radius:calc(4px*var(--rk,1));color:var(--ink2);font-size:11px;line-height:1.15;text-align:center;position:relative;border:1px solid transparent}
#ribbon .cmd:hover{background:var(--acc-soft);color:var(--ink);border-color:color-mix(in srgb,var(--acc) 35%,transparent)}
#ribbon .cmd .gi{width:28px;height:28px;display:grid;place-items:center;font-size:24px;color:var(--ink2)}
#ribbon .cmd:hover .gi{color:var(--acc)}
#ribbon .cmd.cut .gi{color:var(--err)}
#ribbon .cmd .gi .gl{font-size:20px;color:var(--acc)}
html[data-rb=i] #ribbon .cmd .cl,html[data-rb=i] #ribbon .rg .gl{display:none}
html[data-rb=i] #ribbon .cmd{width:36px}
html[data-rb=i] #ribbon .rb,html[data-rb=c] #ribbon .rb{min-height:0}
html[data-rb=l] #ribbon .cmd .gi{display:none}
html[data-rb=l] #ribbon .cmd{width:auto;min-width:46px;padding:7px 9px}
html[data-rb=l] #ribbon .rb{min-height:0}
html[data-rb=c] #ribbon .cmd{flex-direction:row;width:auto;gap:5px;padding:3px 7px;height:26px;align-items:center;font-size:11.5px;white-space:nowrap}
html[data-rb=c] #ribbon .cmd .gi{width:18px;height:18px;font-size:17px}
html[data-rb=c] #ribbon .rg .bs{flex-wrap:wrap;max-width:240px}
html[data-rb=c] #ribbon .rg .gl{display:none}
.pro-workshop #ribbon .rt{background:var(--bg2)}
.pro-workshop #ribbon .rt button{font-weight:550}
.pro-workshop #ribbon .rt button.on{background:var(--panel);box-shadow:inset 0 2px 0 var(--acc);border-color:transparent}
.pro-blueprint #ribbon .rt button{border-radius:0;border-bottom:0;border-top:2px solid transparent;margin:0;padding:5px 12px;font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.08em}
.pro-blueprint #ribbon .rt button.on{border-top-color:var(--acc);color:var(--acc)}
.pro-blueprint #ribbon .rb{padding:3px 6px;min-height:68px}
.pro-blueprint #ribbon .rg .gl{font:9.5px var(--mono);text-transform:uppercase;letter-spacing:.1em;border-top:1px solid var(--line)}
.pro-blueprint #ribbon .cmd{width:54px;font-size:10.5px}
.pro-blueprint #ribbon .cmd .gi{width:24px;height:24px;font-size:21px}
.pro-blueprint #phead .pi,.pro-blueprint #tree .feat,.pro-blueprint #pm input,.pro-blueprint #pm select,.pro-blueprint #pbar,.pro-blueprint #kstat,.pro-blueprint .prow .val{font-family:var(--mono);font-size:11.5px}
.pro-blueprint #phead .pi,.pro-blueprint #tree .feat,.pro-blueprint .feat .ic,.pro-blueprint .okx,.pro-blueprint #vori,.pro-blueprint #vori button{border-radius:2px}
.pro-blueprint #pm .pmh{border-bottom:1px solid var(--acc)}
.pro .vtools .grp{border-radius:calc(3px*var(--rk,1));padding:1px;box-shadow:0 1px 2px rgba(0,0,0,.25);border-color:var(--line2);background:color-mix(in srgb,var(--panel) 94%,transparent)}
.pro .vtools .grp button{height:26px;border-radius:calc(2px*var(--rk,1))}
.pro #vp{background:var(--vp)}
#qfav{display:none;align-items:center;gap:1px;margin-left:6px;padding-left:6px;border-left:1px solid var(--line)}
#qfav.on{display:flex}
#qfav button{width:30px;height:30px;padding:0;display:grid;place-items:center;font-size:19px;color:var(--ink2);border-radius:calc(7px*var(--rk,1))}#qfav button:hover{background:var(--panel2);color:var(--acc)}
#phead{display:none}
.pro #phead{display:block;margin-bottom:6px}
#phead .pi{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:calc(4px*var(--rk,1));cursor:pointer;color:var(--ink2);user-select:none}
#phead .pi:hover{background:var(--panel2)}
#phead .pi.on{background:var(--acc-soft)}
#phead .pi .ic{width:22px;text-align:center;color:var(--acc)}
#phead .pi.part{font-weight:650;color:var(--ink)}
#pm{display:none;flex-direction:column;min-height:0}
.pro.pm-on #pm{display:flex}
.pro.pm-on #left>.sec{display:none}
#pm .pmh{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--panel);z-index:2}
#pm .pmh b{flex:1;font-size:13px}
.okx{width:30px;height:30px;border-radius:calc(4px*var(--rk,1));display:grid;place-items:center;font-size:16px;font-weight:700;border:1px solid var(--line2)}
.okx.ok{color:#fff;background:#1B7F4A;border-color:#1B7F4A}
.okx.no{color:var(--err)}
#pm #tab-edit{display:block!important}
.pro-workshop .rtabs button[data-tab=edit],.pro-blueprint .rtabs button[data-tab=edit]{display:none}
#pbar{display:none;height:24px;align-items:center;gap:14px;padding:0 12px;background:var(--bg2);border-top:1px solid var(--line);font-size:11.5px;color:var(--mut);flex-shrink:0}
.pro #pbar{display:flex}
html[data-sb="0"] #pbar{display:none!important}
#pbar .gr{flex:1}
#pbar b{color:var(--ink2);font-weight:600}
#vori{position:absolute;z-index:20;display:none;grid-template-columns:repeat(4,64px);gap:4px;padding:8px;background:var(--panel);border:1px solid var(--line2);border-radius:calc(10px*var(--rk,1));box-shadow:var(--shadow)}
#vori button{height:54px;border-radius:calc(7px*var(--rk,1));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;color:var(--ink2)}
#vori button span{font-size:18px;color:var(--acc)}
#vori button:hover{background:var(--acc-soft)}
#ribbon .rtm{display:none}
@media ${SHELL}{#qfav{display:none!important}.pro #pbar{display:none}.pro.pm-on #left>.sec{display:none}.pro.pm-on #pm{display:flex}.pro #ribbon{flex-direction:row;align-items:stretch;height:58px;background:var(--panel)!important}#ribbon .rt{display:none}#ribbon .rtm{display:flex;flex:none;align-items:center;gap:4px;max-width:118px;padding:0 10px 0 12px;font-weight:700;font-size:12.5px;color:var(--acc);border-right:1px solid var(--line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ribbon .rb{flex:1;min-height:0!important;padding:4px 7px!important;gap:4px!important;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none}#ribbon .rb::-webkit-scrollbar{display:none}#ribbon .rg{flex-direction:row!important;border:0!important;border-right:1px solid var(--line)!important;border-radius:0!important;background:none!important;padding:0 4px!important}#ribbon .rg:last-child{border-right:0!important}#ribbon .rg .gl{display:none}#ribbon .cmd{width:auto!important;min-width:52px;max-width:84px;height:50px;padding:3px 4px!important;font-size:10.5px!important;gap:2px!important;white-space:nowrap}#ribbon .cmd>:last-child,#ribbon .cmd{overflow:hidden;text-overflow:ellipsis}#ribbon .cmd .gi{width:28px!important;height:28px!important;font-size:17px!important;border-radius:8px!important;flex:none}}
`;
export function init(api){
  const h=api.h,$=s=>document.querySelector(s),st=document.createElement('style');st.textContent=CSS;document.head.append(st);
  let mode='amni',rtab=0,plane=null,pmPart=false,snap=null;const clone=o=>JSON.parse(JSON.stringify(o));try{const ver=localStorage.getItem('amnicad.ui.v'),sv=localStorage.getItem('amnicad.ui'),kept=(ver==='2'||ver==='3')&&MODES[LEGACY[sv]||sv];mode=kept?LEGACY[sv]||sv:'workshop';rtab=kept?+(localStorage.getItem('amnicad.ui.tab')||0):0;}catch{mode='workshop';}
  const X={api,feat(t,over,cut){const N=(NAMES[mode]||{})[t],nm=N?(t==='pattern'&&over.kind==='circular'?N[1]||N[0]:cut?N[1]||N[0]:N[0]):null,cnt=api.doc.features.filter(f=>f.type===t&&(!!(f.op==='cut')===!!cut)).length+1,o={_smart:1,...over};if(o.std==='#10'&&api.units.docUnits(api.doc)!=='in')o.std='M5';if(nm)o.name=mode==='blueprint'?nm+' '+cnt:nm+cnt;if(plane&&['extrude','revolve','loft'].includes(t)){o.plane=plane;}snap=clone(api.doc);api.addFeature(t,o);plane=null;drawHead();},
    shape(k){const f=api.doc.features.find(x=>x.id===api.active),inch=api.units.docUnits(api.doc)==='in',d=api.shapeDefaults(k,api.units.docUnits(api.doc));if(k==='path')d.pts=inch?[[0,0],[0.75,0],[0.75,0.375]]:[[0,0],[20,0],[20,10]];if(k==='text')d.text='Amni';if(f&&Array.isArray(f.shapes)){api.commit(dd=>{dd.features.find(x=>x.id===f.id).shapes.push(d);});api.renderEdit();}else X.feat('extrude',{shapes:[d],op:'add'},false);},
    sketch(){const f=api.doc.features.find(x=>x.id===api.active);if(f&&Array.isArray(f.shapes)){api.openSketch(f.id);return;}X.feat('extrude',{op:'add'},false);setTimeout(()=>{const g=api.doc.features.find(x=>x.id===api.active);if(g)api.openSketch(g.id);},60);},
    view(k){if(k==='normal'){const fi=[...api.S.sel.faces.keys()][0],F=api.mesh&&api.mesh.faces[fi];if(!F||!F.n){api.toast('Pick a flat face first, then Normal To');return;}api.view(F.n);return;}api.view(k);},
    click(sel){const e=$(sel);e&&e.click();},tab(t){api.setTab(t);api.showPanel('R');},
    measure(){const f=api.S.sel.faces.size,e=api.S.sel.edges.size;api.toast(f+e?'Measuring '+(f+e)+' picked item'+(f+e>1?'s':'')+' (see the chip in the view)':'Click faces or edges in the view; Shift-click to add more. Distances and angles appear in the view.',4200);},
    mass(){const p=api.mesh&&api.mesh.props;if(!p){api.toast('Nothing built yet');return;}const U=api.units,doc=api.doc;const m=api.MATS[doc.material]||api.MATS.al6061,kg=U.massKg(p.volume,doc,m.rho),b=p.bbox,row=(a,v)=>[h('span',null,a),h('span',null,v)];api.dlg('Mass Properties',h('div',{class:'kv',style:'min-width:380px'},...row('Material',m.n),...row('Density',U.dual('dens',m.rho)),...row('Mass',U.massDual(kg)),...row('Volume',U.dual('vol',U.volMM3(p.volume,doc))),...row('Surface area',U.dual('area',U.areaMM2(p.area,doc))),...row('Center of mass',p.com?'('+p.com.map(v=>U.nf(v,4)).join(', ')+') '+U.docUnits(doc):'—'),...row('Bounding box',U.bboxDual(b,doc)),...row('Faces / edges / bodies',p.nFaces+' / '+p.nEdges+' / '+p.nSolids)));}};
  const tb=$('header .tb'),menu=h('div',{class:'menu',id:'ui-menu'},h('button',{title:'Interface style',onclick:e=>{e.stopPropagation();const o=menu.classList.contains('open');document.querySelectorAll('.menu').forEach(x=>x.classList.remove('open'));if(!o)menu.classList.add('open');}},h('span',null,'⊞'),h('span',{class:'lbl'},'Interface')),h('div',{class:'pop'}));
  const drawMenu=()=>menu.lastChild.replaceChildren(...Object.entries(MODES).map(([k,v])=>h('button',{class:'row'+(mode===k?' on':''),'aria-checked':String(mode===k),role:'menuitemradio',onclick:e=>{e.stopPropagation();menu.classList.remove('open');setMode(k);}},h('span',null,v),h('span',{class:'ck','aria-hidden':'true'},mode===k?'✓':''))),h('button',{id:'ui-look',onclick:e=>{e.stopPropagation();menu.classList.remove('open');import('./look.js').then(m=>m.toggle(api,X)).catch(er=>console.warn('look',er));}},'Appearance…'));
  tb&&tb.append(menu);document.addEventListener('click',()=>menu.classList.remove('open'));
  const rib=h('div',{id:'ribbon'});$('header').after(rib);
  const pbar=h('div',{id:'pbar'});$('main').after(pbar);
  const head=h('div',{id:'phead'}),treeSec=$('#tree').closest('.sec');treeSec.insertBefore(head,treeSec.querySelector('#tree'));
  const pm=h('div',{id:'pm'});$('#left').prepend(pm);
  const vori=h('div',{id:'vori'});$('#vp').append(vori);
  const edit=$('#tab-edit'),home=edit.parentElement,homeNext=edit.nextSibling;
  const main=$('main'),B=document.body,PK=()=>'amnicad.ui.pane.'+mode,PS=()=>{try{return JSON.parse(localStorage.getItem(PK()))||{};}catch{return{};}},pset=o=>{try{localStorage.setItem(PK(),JSON.stringify({...PS(),...o}));}catch{}},shellOn=()=>matchMedia(SHELL).matches,tabOn=()=>matchMedia(TABLET).matches,vis=e=>getComputedStyle(e).display!=='none';
  let OR={L:1,V:2,R:3};const splL=h('div',{class:'spl',role:'separator','aria-orientation':'vertical',tabindex:'0',title:'Drag to resize, double-click to collapse','aria-label':'Resize design sidebar','data-side':'L'},h('button',{tabindex:'-1','aria-label':'Collapse or expand the design sidebar'},'‹')),splR=h('div',{class:'spl',role:'separator','aria-orientation':'vertical',tabindex:'0',title:'Drag to resize, double-click to collapse','aria-label':'Resize panel sidebar','data-side':'R'},h('button',{tabindex:'-1','aria-label':'Collapse or expand the panel sidebar'},'›'));main.append(splL,splR);
  const placeSpl=()=>{splL.style.display=splR.style.display='';if(!shellOn()){const mr=main.getBoundingClientRect();for(const[e,id,k]of[[splL,'#left','L'],[splR,'#right','R']]){const el=$(id),hid=!vis(el),isL=OR[k]<OR.V,r=el.getBoundingClientRect();e.style.left=(hid?isL?0:mr.width-5:isL?r.right-mr.left:r.left-mr.left)+'px';e.firstChild.textContent=hid===isL?'›':'‹';}return;}splL.style.display='none';const d=tabOn()&&[$('#left'),$('#right')].find(vis);d?(splR.style.left=(d.getBoundingClientRect().left-main.getBoundingClientRect().left)+'px',splR.classList.add('tab'),splR.firstChild.style.display='none'):splR.style.display='none';};
  const applyPanes=()=>{const L=api.look.get(),s=PS(),sh=shellOn(),lf=$('#left'),rt=$('#right'),vp=$('#vp');B.classList.toggle('lc',!sh&&!!s.lc);B.classList.toggle('rc',!sh&&(s.rc!=null?!!s.rc:innerWidth<900));for(const[k,v]of[['--lw',s.l],['--rw',s.r],['--dockw',s.dock]])v?main.style.setProperty(k,v+'px'):main.style.removeProperty(k);if(sh){main.style.gridTemplateColumns='';for(const e of[lf,vp,rt])e.style.gridColumn='';placeSpl();return;}const ls=[],rs=[];(L.tp==='right'?rs:ls).push('L');(L.ps==='left'?ls:rs).push('R');const O=[...ls,'V',...rs];OR={};O.forEach((k,i)=>OR[k]=i+1);main.style.gridTemplateColumns=O.map(k=>k==='L'?'var(--lwc)':k==='R'?'var(--rwc)':'minmax(0,1fr)').join(' ');lf.style.gridColumn=OR.L;rt.style.gridColumn=OR.R;vp.style.gridColumn=OR.V;placeSpl();};
  const tgl=k=>{pset({[k]:!B.classList.contains(k)});applyPanes();setTimeout(()=>dispatchEvent(new Event('resize')),30);};
  api.hooks.pane=w=>{w==='L'&&B.classList.contains('lc')&&tgl('lc');w==='R'&&B.classList.contains('rc')&&tgl('rc');};
  for(const sp of[splL,splR]){const k=sp.dataset.side,id=k==='L'?'#left':'#right',ck=k==='L'?'lc':'rc',wk=k==='L'?'l':'r';
    sp.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button>0)return;const el=tabOn()?[$('#left'),$('#right')].find(vis):$(id);if(!el||!vis(el))return;e.preventDefault();sp.setPointerCapture(e.pointerId);sp.classList.add('drag');const isL=OR[k]<OR.V&&!shellOn();let w=0;
      const mv=ev=>{const mr=main.getBoundingClientRect(),oth=$(k==='L'?'#right':'#left'),ow=shellOn()||!vis(oth)?0:oth.getBoundingClientRect().width,r=el.getBoundingClientRect(),w0=shellOn()?mr.right-ev.clientX:isL?ev.clientX-r.left:r.right-ev.clientX;w=Math.round(Math.max(shellOn()?140:150,Math.min(w0,mr.width-ow-(shellOn()?240:280))));main.style.setProperty(shellOn()?'--dockw':'--'+(k==='L'?'lw':'rw'),w+'px');placeSpl();api.redraw();},up=()=>{sp.classList.remove('drag');sp.removeEventListener('pointermove',mv);sp.removeEventListener('pointerup',up);sp.removeEventListener('pointercancel',up);w&&pset(shellOn()?{dock:w}:{[wk]:w});dispatchEvent(new Event('resize'));};sp.addEventListener('pointermove',mv);sp.addEventListener('pointerup',up);sp.addEventListener('pointercancel',up);});
    sp.addEventListener('dblclick',()=>!shellOn()&&tgl(ck));sp.firstChild.addEventListener('click',()=>tgl(ck));
    sp.addEventListener('keydown',e=>{const el=$(id),d=e.key==='ArrowLeft'?-16:e.key==='ArrowRight'?16:0;if(e.key==='Enter')return tgl(ck);if(!d||!vis(el))return;e.preventDefault();const isL=OR[k]<OR.V,w=Math.max(150,Math.round(el.getBoundingClientRect().width+(isL?d:-d)));pset({[wk]:w});applyPanes();dispatchEvent(new Event('resize'));});}
  new ResizeObserver(placeSpl).observe(main);new MutationObserver(placeSpl).observe(B,{attributes:true,attributeFilter:['class']});document.addEventListener('transitionend',placeSpl,true);addEventListener('resize',applyPanes);addEventListener('amnicad:look',()=>{drawRibbon();applyPanes();api.redraw();});
  let QT=0;const quiet=f=>{QT++;try{f();}finally{QT--;}},PANEL={check:'check',sim:'sim',flow:'sim',mold:'sim',dies:'make',make:'make',draw:'draw',vault:'vault',ai:'ai'},pane=on=>{const c=document.body.classList.contains('rp-off');document.body.classList.toggle('rp-off',!on&&mode!=='amni');c===!on||setTimeout(()=>dispatchEvent(new Event('resize')),30);},pick=(i,go)=>{const R=ribbon(mode,X);rtab=Math.max(0,Math.min(i,R.length-1));try{localStorage.setItem('amnicad.ui.tab',rtab);}catch{}const pk=R[rtab][2];pk?(go&&!(pk==='sim'&&['sim','flow'].includes(api.S.tab))&&api.setTab(pk),pane(true),go&&api.hooks.pane('R')):pane(false);drawRibbon();};
  const cmdBtn=c=>h('button',{class:'cmd'+(c.cut?' cut':''),title:c.label,'data-rc':c.id,onclick:c.run},h('span',{class:'gi'},ico(c.id,c.icon)),h('span',{class:'cl'},c.label));
  const viewG=gs=>{const L=api.look.get(),hid=new Set(L.hid||[]),ord=L.ord||[],pos=id=>{const i=ord.indexOf(id);return i<0?1e9:i;};return gs.map(([g,c])=>[g,c.map((x,i)=>[x,i]).filter(([x])=>!hid.has(x.id)).sort((p,q)=>pos(p[0].id)-pos(q[0].id)||p[1]-q[1]).map(q=>q[0])]).filter(q=>q[1].length);};
  const qfav=h('div',{id:'qfav',role:'toolbar','aria-label':'Favorite commands'});$('#b-redo').after(qfav);
  const drawFav=()=>{const L=api.look.get(),all=new Map();for(const[,gs]of ribbon(mode,X))for(const[,c]of gs)for(const x of c)all.set(x.id,x);const f=(L.fav||[]).map(i=>all.get(i)).filter(Boolean);qfav.classList.toggle('on',f.length>0);qfav.replaceChildren(...f.map(c=>h('button',{title:c.label,'aria-label':c.label,'data-rc':c.id,onclick:c.run},h('span',{class:'gi'},ico(c.id,c.icon)))));};
  const drawRibbon=()=>{drawFav();if(mode==='amni'){rib.replaceChildren();pane(true);return;}const R=ribbon(mode,X);rtab=Math.min(rtab,R.length-1);rib.replaceChildren(h('button',{class:'rtm','aria-haspopup':'dialog','aria-label':'All tools, now showing '+R[rtab][0],onclick:()=>api.mobile&&api.mobile.tools()},R[rtab][0],h('span',{'aria-hidden':'true'},'▾')),h('div',{class:'rt'},...R.map(([n],i)=>h('button',{class:i===rtab?'on':'',onclick:()=>pick(i,true)},n))),h('div',{class:'rb'},...viewG(R[rtab][1]).map(([g,cmds])=>h('div',{class:'rg'},h('div',{class:'bs'},...cmds.map(cmdBtn)),h('div',{class:'gl'},g)))));};
  const drawHead=()=>{if(mode==='amni'){head.replaceChildren();return;}const p=api.mesh&&api.mesh.props,m=api.MATS[api.doc.material]||api.MATS.al6061;head.replaceChildren(h('div',{class:'pi part',title:'Part properties',onclick:()=>{pmPart=true;api.active=null;showPM(true);}},h('span',{class:'ic'},'◆'),($('#docname')||{}).value||'Part'),h('div',{class:'pi',title:'Edit material',onclick:()=>{pmPart=true;api.active=null;showPM(true);}},h('span',{class:'ic'},'▦'),'Material: '+m.n),...PLANES[mode].map(([pl,n,v])=>h('div',{class:'pi'+(plane===pl?' on':''),title:'Select '+n+' to sketch on it, then pick a feature',onclick:()=>{plane=plane===pl?null:pl;api.view(v);drawHead();if(plane)api.toast(n+' selected: pick Extrude, Revolve or Loft to sketch on it');}},h('span',{class:'ic'},'▱'),n)),h('div',{class:'pi',onclick:()=>api.view('iso')},h('span',{class:'ic'},'↳'),'Origin'));};
  const showPM=on=>{if(on&&!snap)snap=clone(api.doc);if(!on)snap=null;document.body.classList.toggle('pm-on',!!on&&mode!=='amni');if(mode==='amni'){if(edit.parentElement!==home)home.insertBefore(edit,homeNext);return;}const box=pm;if(edit.parentElement!==box){const f=api.doc.features.find(x=>x.id===api.active),t=f&&api.FT[f.type];box.replaceChildren(h('div',{class:'pmh'},h('button',{class:'okx ok',title:'OK',onclick:()=>{pmPart=false;api.active=null;showPM(false);}},'✓'),h('button',{class:'okx no',title:'Cancel (discard changes)',onclick:()=>{const s0=snap;pmPart=false;snap=null;api.active=null;showPM(false);if(s0)api.commit(d=>{for(const k of Object.keys(d))delete d[k];Object.assign(d,s0);});}},'✕'),h('b',{id:'pmt'},mode==='workshop'?'Properties':'Inspector')),edit);}if(!on){if(edit.parentElement!==home)home.insertBefore(edit,homeNext);if(api.S.tab==='edit')quiet(()=>api.setTab('check'));}};
  api.hooks.setTab=t=>{if(t==='edit'&&mode!=='amni')return showPM(true),false;if(mode!=='amni'&&PANEL[t]&&!QT){const R=ribbon(mode,X),i=R.findIndex(r=>r[2]===PANEL[t]);i>=0&&i!==rtab?(rtab=i,drawRibbon()):0;pane(true);api.hooks.pane('R');}return true;};
  api.hooks.onEdit=a=>{if(mode==='amni')return;if(a||pmPart){if(!document.body.classList.contains('pm-on'))showPM(true);}else if(document.body.classList.contains('pm-on'))showPM(false);drawBar();};
  const drawBar=()=>{if(mode==='amni')return;const p=api.mesh&&api.mesh.props,m=api.MATS[api.doc.material]||api.MATS.al6061,ks=($('#kstat')||{}).textContent||'';pbar.replaceChildren(h('span',null,api.active?'Editing '+((api.doc.features.find(x=>x.id===api.active)||{}).name||'feature'):'Editing Part'),h('span',{class:'gr'}),h('span',null,ks),p?h('span',null,'Mass ',h('b',null,api.units.massDual(api.units.massKg(p.volume,api.doc,m.rho)))):'',h('span',null,api.units.docUnits(api.doc)==='in'?(mode==='workshop'?'in·lb·s':'in·lbf·s'):(mode==='workshop'?'mm·g·s':'mm·N·s')),h('span',null,h('b',null,api.units.docUnits(api.doc))));};
  const tix=()=>{for(const e of document.querySelectorAll('#tree .feat[data-ft]:not([data-ix]) .ic,#palette button[data-ft]:not([data-ix]) span')){const f=e.parentElement,t=f.dataset.ft;f.dataset.ix='1';has(t)&&e.replaceChildren(ico(t));}};new MutationObserver(tix).observe($('#tree'),{childList:true,subtree:true});new MutationObserver(tix).observe($('#palette'),{childList:true,subtree:true});tix();
  new MutationObserver(()=>{drawBar();drawHead();}).observe($('#kstat'),{childList:true,characterData:true,subtree:true});
  api.onChange(()=>{drawBar();});
  const VO=[['front','Front','⬓'],['back','Back','⬒'],['left','Left','◧'],['right','Right','◨'],['top','Top','⬔'],['bottom','Bottom','⬕'],['iso','Isometric','◈'],['normal','Normal To','⊥']];
  const showVori=(x,y)=>{vori.replaceChildren(...VO.map(([k,l,i])=>h('button',{onclick:()=>{vori.style.display='none';X.view(k);}},h('span',null,i),l)));const r=$('#vp').getBoundingClientRect();vori.style.left=Math.max(8,Math.min(r.width-290,x-r.left-140))+'px';vori.style.top=Math.max(8,Math.min(r.height-140,y-r.top-60))+'px';vori.style.display='grid';};
  let mx=innerWidth/2,my=innerHeight/2;addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});document.addEventListener('pointerdown',e=>{if(!vori.contains(e.target))vori.style.display='none';});
  const setMode=k=>{mode=MODES[k]?k:'workshop';try{localStorage.setItem('amnicad.ui',mode);localStorage.setItem('amnicad.ui.v','3');}catch{}document.body.classList.remove('pro','pro-workshop','pro-blueprint','pm-on');const RT=document.documentElement;RT.classList.remove('pro','pro-workshop','pro-blueprint','ui-amni');RT.classList.add(...(mode==='amni'?['ui-amni']:['pro','pro-'+mode]));if(mode!=='amni')document.body.classList.add('pro','pro-'+mode);showPM(false);if(mode!=='amni'&&api.S.tab==='edit')quiet(()=>api.setTab('check'));drawMenu();drawRibbon();api.themeColors();applyPanes();dispatchEvent(new Event('amnicad:layout'));mode!=='amni'&&pick(rtab,false);eqs();drawHead();drawBar();api.renderTree();api.redraw();setTimeout(()=>dispatchEvent(new Event('resize')),30);};
  const eqh=$('#left .sec:has(#params) h3'),eqt=eqh&&eqh.firstChild,eqs=()=>{if(!eqh)return;const on=mode!=='amni',n=$('#params').children.length;eqt.textContent=(mode==='workshop'?'Equations':'Parameters')+(on?' ('+n+') ':' ');let c=true;try{c=localStorage.getItem('amnicad.ui.eq')!=='open';}catch{}eqh.parentElement.classList.toggle('eqc',on&&c);eqh.parentElement.classList.toggle('eqs',on);};
  eqh&&(eqh.addEventListener('click',e=>{if(mode==='amni'||e.target.closest('button'))return;const c=!eqh.parentElement.classList.contains('eqc');try{localStorage.setItem('amnicad.ui.eq',c?'':'open');}catch{}eqs();}),new MutationObserver(eqs).observe($('#params'),{childList:true}));
  api.onBuilt&&api.onBuilt(()=>{api.S.tab==='check'&&document.getElementById('tab-check').classList.contains('on')&&quiet(()=>api.setTab('check'));});
  X.vori=()=>showVori(mx,my);X.pmOk=()=>{if(!document.body.classList.contains('pm-on'))return false;pmPart=false;api.active=null;showPM(false);return true;};X.mode=()=>mode;import('./keys.js').then(m=>{api.keys=m.init(api,X);}).catch(e=>console.warn('keys',e));
  setMode(mode);
  return{setMode,redraw:()=>mode!=='amni'?pick(rtab,false):drawRibbon(),ribbon:()=>ribbon(mode,X),icon:c=>ico(c.id,c.icon),pick:i=>mode==='amni'?0:pick(i,true),get tab(){return mode==='amni'?-1:rtab;},get mode(){return mode;}};
}
