const MODES={amni:'Amni (modern)',workshop:'Workshop',blueprint:'Blueprint'},LEGACY={sw:'workshop',creo:'blueprint'};
const PLANES={workshop:[['XZ','Front Datum','front'],['XY','Top Datum','top'],['YZ','Right Datum','right']],blueprint:[['XZ','Front (XZ)','front'],['XY','Top (XY)','top'],['YZ','Right (YZ)','right']]};
const NAMES={workshop:{extrude:['Extrude','Cut Extrude'],revolve:['Revolve','Cut Revolve'],sweep:['Sweep','Cut Sweep'],loft:['Loft','Cut Loft'],hole:['Hole'],fillet:['Fillet'],chamfer:['Chamfer'],shell:['Shell'],pattern:['Linear Pattern','Circular Pattern'],mirror:['Mirror'],coil:['Coil'],thread:['Thread'],split:['Split'],scale:['Scale'],move:['Move'],box:['Box'],cylinder:['Cylinder'],sphere:['Sphere'],cone:['Cone'],torus:['Torus']},blueprint:{extrude:['Extrude','Extrude'],revolve:['Revolve','Revolve'],sweep:['Sweep','Sweep'],loft:['Loft','Loft'],hole:['Hole'],fillet:['Fillet'],chamfer:['Chamfer'],shell:['Shell'],pattern:['Pattern','Pattern'],mirror:['Mirror'],coil:['Coil'],thread:['Thread'],split:['Split'],scale:['Scale'],move:['Move'],box:['Box'],cylinder:['Cylinder'],sphere:['Sphere'],cone:['Cone'],torus:['Torus']}};
const B=(id,label,icon,run,opt={})=>({id,label,icon,run,...opt});
function ribbon(mode,X){if(X.api.hooks.ribbon)return X.api.hooks.ribbon(mode,B,X);
  const F=(t,cut,label,icon,extra)=>B(t+(cut?'-cut':''),label,icon,()=>X.feat(t,{...(cut?{op:'cut'}:{}),...(extra||{})},cut),{cut});
  const skOpen=B('s-open','Sketch','✎',()=>X.sketch());
  const sk=[['rect','Rectangle','▭'],['circle','Circle','◯'],['slot','Slot','⊂⊃'],['poly','Polygon','⬡'],['path','Line','⟋'],['spline','Spline','∿'],['ellipse','Ellipse','⬭'],['text','Text','A']].map(([k,l,i])=>B('s-'+k,l,i,()=>X.shape(k)));
  const evalg=[B('measure','Measure','📏',()=>X.measure()),B('mass','Mass Properties','⚖',()=>X.mass()),B('section','Section View','◫',()=>X.click('#b-sec')),B('check','Design Review','✔',()=>X.tab('check')),B('render','Photo Render','📷',()=>X.api.act('render'))];
  const prim=['box','cylinder','sphere','cone','torus'].map(t=>F(t,false,X.api.FT[t].n,X.api.FT[t].i));
  const sk2=[['Sketch',[skOpen]],['Quick shapes',sk]],ai=[B('ai','AI Assistant','✦',()=>X.tab('ai')),B('refs','References','🖼',()=>{X.tab('ai');setTimeout(()=>{const e=document.getElementById('refs');e&&e.scrollIntoView({block:'nearest'});},80);})],sim=(a,b,c)=>[B('sim',a,'🧱',()=>X.tab('sim')),B('flow',b,'🌬',()=>X.tab('flow')),B('mold',c,'💉',()=>X.tab('mold'))],make=[B('make','Instant Quote','💲',()=>X.tab('make')),B('cam','Toolpath & G-code','⚙',()=>{X.tab('make');const go=(n=0)=>{const e=[...document.querySelectorAll('#tab-make h3')].find(x=>/toolpath/i.test(x.textContent));e?e.scrollIntoView({block:'start',behavior:'smooth'}):n<30&&setTimeout(()=>go(n+1),150);};go();})],vault=[B('vault','Vault','🗄',()=>X.tab('vault'))];
  return mode==='blueprint'?[
    ['Model',[['History',[B('regen','Regenerate','⟳',()=>X.api.rebuild()),B('undo','Undo','↶',()=>X.api.undo()),B('redo','Redo','↷',()=>X.api.redo())]],['Form',[F('extrude',false,'Extrude','⬆'),F('revolve',false,'Revolve','↻'),F('sweep',false,'Sweep','〰'),F('loft',false,'Loft','⏶'),F('coil',false,'Coil','➰')]],['Detail',[F('hole',false,'Hole','⊙',{std:'#10',fit:'clearance'}),F('fillet',false,'Fillet','◜'),F('chamfer',false,'Chamfer','◸'),F('shell',false,'Shell','▢'),F('thread',false,'Thread','🔩')]],['Modify',[F('pattern',false,'Pattern','⁘'),F('mirror',false,'Mirror','⇋'),F('split',false,'Split','⫽'),F('scale',false,'Scale','⤢'),F('move',false,'Move','✥')]],['Primitives',prim]],null],
    ['Sketch',sk2,null],['Analysis',[['Measure',evalg]],'check'],['Simulate',[['Analyses',sim('Structure','Flow Study','Injection Molding')]],'sim'],['Manufacturing',[['Quote and NC',make]],'make'],['Detailing',[['Drawing',[B('draw','Drawing','📐',()=>X.tab('draw'))]]],'draw'],['Data',[['Data management',vault]],'vault'],['Tools',[['Assistant',ai]],'ai']
  ]:[
    ['Features',[['Add',[F('extrude',false,'Extrude','⬆'),F('revolve',false,'Revolve','↻'),F('sweep',false,'Sweep','〰'),F('loft',false,'Loft','⏶')]],['Cut',[F('extrude',true,'Extrude Cut','⬆'),F('revolve',true,'Revolve Cut','↻'),F('sweep',true,'Sweep Cut','〰'),F('loft',true,'Loft Cut','⏶'),F('hole',false,'Hole','⊙',{std:'#10',fit:'clearance'})]],['Modify',[F('fillet',false,'Fillet','◜'),F('chamfer',false,'Chamfer','◸'),F('shell',false,'Shell','▢'),F('pattern',false,'Linear Pattern','⁘'),F('pattern',false,'Circular Pattern','✺',{kind:'circular'}),F('mirror',false,'Mirror','⇋')]],['More',[F('coil',false,'Coil','➰'),F('thread',false,'Thread','🔩'),F('split',false,'Split','⫽'),F('scale',false,'Scale','⤢'),F('move',false,'Move','✥'),B('rebuild','Rebuild','⟳',()=>X.api.rebuild())]],['Primitives',prim]],null],
    ['Sketch',sk2,null],['Evaluate',[['Evaluate',evalg]],'check'],['Simulation',[['Studies',sim('Structural Study','Flow Study','Injection Molding')]],'sim'],['Manufacture',[['Quote and CAM',make]],'make'],['Drawing',[['Drawing',[B('draw','Drawing','📐',()=>X.tab('draw'))]]],'draw'],['Vault',[['PDM',vault]],'vault'],['Assistant',[['AI',ai]],'ai']
  ];
}
const LOOK={workshop:[`--bg:#15110d;--bg2:#1a1510;--panel:#201a14;--panel2:#292119;--line:#352b21;--line2:#463a2d;--ink:#f3ebe0;--ink2:#d6c9b7;--mut:#a39482;--acc:#f0a04b;--acc-ink:#1d1105;--acc-soft:rgba(240,160,75,.15);--warm:#e0794a;--r:14px;--vp:linear-gradient(180deg,#2d241a 0%,#1b150f 100%)`,`--bg:#f4efe7;--bg2:#ece5d9;--panel:#fffcf7;--panel2:#f8f2e9;--line:#e4dbcd;--line2:#d3c6b3;--ink:#251e16;--ink2:#3c3329;--mut:#7b6c5a;--acc:#b4531a;--acc-ink:#fff;--acc-soft:rgba(180,83,26,.11);--warm:#c2410c;--r:14px;--vp:linear-gradient(180deg,#e8dcc8 0%,#f3ebdd 55%,#fbf7ef 100%)`],
blueprint:[`--bg:#091320;--bg2:#0c1828;--panel:#0f1d31;--panel2:#13253e;--line:#1c3452;--line2:#28486f;--ink:#dcebf8;--ink2:#b3cbe0;--mut:#7292b0;--acc:#22d3ee;--acc-ink:#03202a;--acc-soft:rgba(34,211,238,.13);--warm:#ffb454;--r:3px;--grid:#5fb7d4;--vp:linear-gradient(180deg,#10253f 0%,#08111e 100%)`,`--bg:#e6edf5;--bg2:#dce6f1;--panel:#f6f9fd;--panel2:#ebf1f8;--line:#c6d4e4;--line2:#a9bdd3;--ink:#0d1d32;--ink2:#22374e;--mut:#56708c;--acc:#0b7f9d;--acc-ink:#fff;--acc-soft:rgba(11,127,157,.1);--warm:#b45309;--r:3px;--grid:#2a7f9c;--vp:linear-gradient(180deg,#d3e3f1 0%,#edf4fa 100%)`]};
const LOOKCSS=Object.entries(LOOK).map(([k,[d,l]])=>`.pro-${k}{${d}}:root[data-theme="light"] .pro-${k}{${l}}@media (prefers-color-scheme:light){:root:not([data-theme="dark"]) .pro-${k}{${l}}}`).join('\n');
const CSS=LOOKCSS+`
#ui-menu .pop button.on{background:var(--acc-soft)}
@media (min-width:981px){.pro #right .rtabs{display:none}.pro.rp-off main{grid-template-columns:272px 1fr 0}.pro.rp-off #right{display:none}.pro #left{display:flex;flex-direction:column}.pro #left .sec.eqs{order:2;border-top:1px solid var(--line)}.pro #left .sec.eqs h3{cursor:pointer;user-select:none;justify-content:flex-start}.pro #left .sec.eqs h3 button{margin-left:auto}.pro #left .sec.eqs h3::before{content:'▾';display:inline-block;width:14px;transition:transform .15s}.pro #left .sec.eqc h3::before{transform:rotate(-90deg)}.pro #left .sec.eqc #params{display:none}}
#ribbon{display:none;flex-direction:column;background:var(--panel);border-bottom:1px solid var(--line);flex-shrink:0;z-index:4}
.pro #ribbon{display:flex}
#ribbon .rt{display:flex;gap:2px;padding:0 10px;border-bottom:1px solid var(--line);background:var(--bg2)}
#ribbon .rt button{padding:6px 14px 5px;font-size:12px;font-weight:600;color:var(--mut);border-bottom:2px solid transparent;margin-bottom:-1px}
#ribbon .rt button.on{color:var(--ink);border-color:var(--acc);background:var(--panel)}
#ribbon .rt button:hover{color:var(--ink)}
#ribbon .rb{display:flex;gap:0;padding:4px 6px 0;overflow-x:auto;scrollbar-width:thin;min-height:82px}
#ribbon .rg{display:flex;flex-direction:column;border-right:1px solid var(--line);padding:0 6px;flex-shrink:0}
#ribbon .rg:last-child{border-right:0}
#ribbon .rg .bs{display:flex;gap:2px;flex:1}
#ribbon .rg .gl{font-size:10.5px;color:var(--mut);text-align:center;padding:2px 0 4px;letter-spacing:.02em}
#ribbon .cmd{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;width:64px;padding:5px 2px 3px;border-radius:7px;color:var(--ink2);font-size:11px;line-height:1.15;text-align:center;position:relative}
#ribbon .cmd:hover{background:var(--acc-soft);color:var(--ink)}
#ribbon .cmd .gi{width:30px;height:30px;display:grid;place-items:center;font-size:18px;border-radius:7px;background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 22%,var(--panel2)),var(--panel2));color:var(--acc);border:1px solid color-mix(in srgb,var(--acc) 30%,var(--line))}
#ribbon .cmd.cut .gi{background:linear-gradient(180deg,color-mix(in srgb,var(--err) 20%,var(--panel2)),var(--panel2));color:var(--err);border-color:color-mix(in srgb,var(--err) 35%,var(--line))}
.pro-workshop #ribbon{background:var(--bg2)}
.pro-workshop #ribbon .rt{background:transparent;border-bottom:0;padding:6px 12px 2px;gap:4px}
.pro-workshop #ribbon .rt button{border-radius:999px;border:0;margin:0;padding:5px 15px}
.pro-workshop #ribbon .rt button.on{background:var(--acc-soft);color:var(--acc)}
.pro-workshop #ribbon .rb{padding:4px 10px 8px;gap:8px;min-height:92px}
.pro-workshop #ribbon .rg{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:4px 8px 0}
.pro-workshop #ribbon .rg:last-child{border:1px solid var(--line)}
.pro-workshop #ribbon .cmd{width:70px;border-radius:12px}
.pro-workshop #ribbon .cmd .gi{width:38px;height:38px;font-size:20px;border-radius:12px;border:0;background:linear-gradient(145deg,color-mix(in srgb,var(--acc) 30%,var(--panel)),color-mix(in srgb,var(--acc) 10%,var(--panel2)));box-shadow:0 1px 0 color-mix(in srgb,var(--acc) 30%,transparent) inset,0 2px 4px rgba(0,0,0,.12)}
.pro-workshop #ribbon .cmd.cut .gi{background:linear-gradient(145deg,color-mix(in srgb,var(--err) 26%,var(--panel)),color-mix(in srgb,var(--err) 8%,var(--panel2)))}
.pro-blueprint #ribbon{background:var(--panel)}
.pro-blueprint #ribbon .rt{padding:0 8px;gap:0;background:var(--bg2)}
.pro-blueprint #ribbon .rt button{border-radius:0;border-bottom:0;border-top:2px solid transparent;margin:0;padding:5px 12px;font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.08em}
.pro-blueprint #ribbon .rt button.on{border-top-color:var(--acc);color:var(--acc)}
.pro-blueprint #ribbon .rb{padding:4px 8px;gap:6px;min-height:64px}
.pro-blueprint #ribbon .rg{border:1px solid var(--line2);border-radius:2px;padding:0 4px;background:var(--bg2)}
.pro-blueprint #ribbon .rg:last-child{border:1px solid var(--line2)}
.pro-blueprint #ribbon .rg .gl{font:9.5px var(--mono);text-transform:uppercase;letter-spacing:.1em;border-top:1px solid var(--line);padding:2px 0 3px}
.pro-blueprint #ribbon .cmd{width:54px;font-size:10px;gap:2px;padding:4px 1px 2px;border-radius:2px}
.pro-blueprint #ribbon .cmd .gi{width:22px;height:22px;font-size:13px;border-radius:2px;background:transparent;color:var(--acc);border:1px solid color-mix(in srgb,var(--acc) 45%,var(--line2))}
.pro-blueprint #ribbon .cmd.cut .gi{background:transparent;color:var(--warm);border-color:color-mix(in srgb,var(--warm) 50%,var(--line2))}
.pro-blueprint #phead .pi,.pro-blueprint #tree .feat,.pro-blueprint #pm input,.pro-blueprint #dash input,.pro-blueprint #pm select,.pro-blueprint #dash select,.pro-blueprint #pbar,.pro-blueprint #kstat,.pro-blueprint .prow .val{font-family:var(--mono);font-size:11.5px;font-variant-numeric:tabular-nums}
.pro-blueprint #phead .pi,.pro-blueprint #tree .feat,.pro-blueprint .feat .ic,.pro-blueprint .okx,.pro-blueprint #dash,.pro-blueprint #vori,.pro-blueprint #vori button{border-radius:2px}
.pro-blueprint #pm .pmh,.pro-blueprint #dash .pmh{border-bottom:1px solid var(--acc)}
@media (min-width:981px){.pro #left .sec:has(#palette){display:none}.pro .vtools{left:50%!important;transform:translateX(-50%);right:auto!important;flex-wrap:nowrap!important;width:max-content;max-width:calc(100% - 24px)}}
.pro #vp{background:var(--vp)}
#phead{display:none}
.pro #phead{display:block;margin-bottom:6px}
#phead .pi{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:7px;cursor:pointer;color:var(--ink2);user-select:none}
#phead .pi:hover{background:var(--panel2)}
#phead .pi.on{background:var(--acc-soft)}
#phead .pi .ic{width:22px;text-align:center;color:var(--warm)}
#phead .pi.part{font-weight:650;color:var(--ink)}
#phead .pi.part .ic{color:var(--acc)}
#pm{display:none;flex-direction:column;min-height:0}
.pro-workshop.pm-on #pm{display:flex}
.pro-workshop.pm-on #left>.sec{display:none}
#pm .pmh,#dash .pmh{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--panel);z-index:2}
#pm .pmh b,#dash .pmh b{flex:1;font-size:13px}
.okx{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-size:16px;font-weight:700;border:1px solid var(--line2)}
.okx.ok{color:#fff;background:var(--ok);border-color:var(--ok)}
.okx.no{color:var(--err)}
#pm #tab-edit,#dash #tab-edit{display:block!important}
#dash{display:none;position:absolute;left:12px;right:12px;top:58px;max-height:62%;overflow:auto;background:var(--panel);border:1px solid var(--line2);border-radius:10px;box-shadow:var(--shadow);z-index:6}
.pro-blueprint.pm-on #dash{display:block}
#dash #tab-edit .sec{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:2px 16px;align-items:start}
#dash #tab-edit .sec>*{min-width:0}
#dash #tab-edit .sec>.ehead,#dash #tab-edit .sec>.alert,#dash #tab-edit .sec>.btn.done,#dash #tab-edit .sec>div[style*="margin:8px 0"]{grid-column:1/-1}
.pro-workshop .rtabs button[data-tab=edit],.pro-blueprint .rtabs button[data-tab=edit]{display:none}
#pbar{display:none;height:24px;align-items:center;gap:14px;padding:0 12px;background:var(--bg2);border-top:1px solid var(--line);font-size:11.5px;color:var(--mut);flex-shrink:0}
.pro #pbar{display:flex}
#pbar .gr{flex:1}
#pbar b{color:var(--ink2);font-weight:600}
#vori{position:absolute;z-index:20;display:none;grid-template-columns:repeat(4,64px);gap:4px;padding:8px;background:var(--panel);border:1px solid var(--line2);border-radius:10px;box-shadow:var(--shadow)}
#vori button{height:54px;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;color:var(--ink2)}
#vori button span{font-size:18px;color:var(--acc)}
#vori button:hover{background:var(--acc-soft)}
@media (max-width:980px){.pro #ribbon,.pro #pbar{display:none}.pro-workshop.pm-on #left>.sec{display:block}.pro-workshop.pm-on #pm{display:none}}
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
  const drawMenu=()=>menu.lastChild.replaceChildren(...Object.entries(MODES).map(([k,v])=>h('button',{class:mode===k?'on':'',onclick:e=>{e.stopPropagation();menu.classList.remove('open');setMode(k);}},v,h('small',null,k==='amni'?'Clean panels, left-drag orbits':k==='workshop'?'Ribbon, feature tree, properties panel, middle-drag orbits, Ctrl+1…8 views':'Ribbon groups, model tree, inspector, middle-drag orbits, Shift pans, Ctrl zooms'))),h('button',{id:'ui-look',onclick:e=>{e.stopPropagation();menu.classList.remove('open');import('./look.js').then(m=>m.toggle(api,X)).catch(er=>console.warn('look',er));}},'Appearance…',h('small',null,'Theme, accent, background, grid, model and highlight colors')));
  tb&&tb.append(menu);document.addEventListener('click',()=>menu.classList.remove('open'));
  const rib=h('div',{id:'ribbon'});$('header').after(rib);
  const pbar=h('div',{id:'pbar'});$('main').after(pbar);
  const head=h('div',{id:'phead'}),treeSec=$('#tree').closest('.sec');treeSec.insertBefore(head,treeSec.querySelector('#tree'));
  const pm=h('div',{id:'pm'}),dash=h('div',{id:'dash'});$('#left').prepend(pm);$('#vp').append(dash);
  const vori=h('div',{id:'vori'});$('#vp').append(vori);
  const edit=$('#tab-edit'),home=edit.parentElement,homeNext=edit.nextSibling;
  let QT=0;const quiet=f=>{QT++;try{f();}finally{QT--;}},PANEL={check:'check',sim:'sim',flow:'sim',mold:'sim',make:'make',draw:'draw',vault:'vault',ai:'ai'},pane=on=>{const c=document.body.classList.contains('rp-off');document.body.classList.toggle('rp-off',!on&&mode!=='amni');c===!on||setTimeout(()=>dispatchEvent(new Event('resize')),30);},pick=(i,go)=>{const R=ribbon(mode,X);rtab=Math.max(0,Math.min(i,R.length-1));try{localStorage.setItem('amnicad.ui.tab',rtab);}catch{}const pk=R[rtab][2];pk?(go&&!(pk==='sim'&&['sim','flow'].includes(api.S.tab))&&api.setTab(pk),pane(true)):pane(false);drawRibbon();};
  const drawRibbon=()=>{if(mode==='amni'){rib.replaceChildren();pane(true);return;}const R=ribbon(mode,X);rtab=Math.min(rtab,R.length-1);rib.replaceChildren(h('div',{class:'rt'},...R.map(([n],i)=>h('button',{class:i===rtab?'on':'',onclick:()=>pick(i,true)},n))),h('div',{class:'rb'},...R[rtab][1].map(([g,cmds])=>h('div',{class:'rg'},h('div',{class:'bs'},...cmds.map(c=>h('button',{class:'cmd'+(c.cut?' cut':''),title:c.label,onclick:c.run},h('span',{class:'gi'},c.icon),c.label))),h('div',{class:'gl'},g)))));};
  const drawHead=()=>{if(mode==='amni'){head.replaceChildren();return;}const p=api.mesh&&api.mesh.props,m=api.MATS[api.doc.material]||api.MATS.al6061;head.replaceChildren(h('div',{class:'pi part',title:'Part properties',onclick:()=>{pmPart=true;api.active=null;showPM(true);}},h('span',{class:'ic'},'◆'),($('#docname')||{}).value||'Part'),h('div',{class:'pi',title:'Edit material',onclick:()=>{pmPart=true;api.active=null;showPM(true);}},h('span',{class:'ic'},'▦'),'Material: '+m.n),...PLANES[mode].map(([pl,n,v])=>h('div',{class:'pi'+(plane===pl?' on':''),title:'Select '+n+' to sketch on it, then pick a feature',onclick:()=>{plane=plane===pl?null:pl;api.view(v);drawHead();if(plane)api.toast(n+' selected: pick Extrude, Revolve or Loft to sketch on it');}},h('span',{class:'ic'},'▱'),n)),h('div',{class:'pi',onclick:()=>api.view('iso')},h('span',{class:'ic'},'↳'),'Origin'));};
  const showPM=on=>{if(on&&!snap)snap=clone(api.doc);if(!on)snap=null;document.body.classList.toggle('pm-on',!!on&&mode!=='amni');if(mode==='amni'){if(edit.parentElement!==home)home.insertBefore(edit,homeNext);return;}const box=mode==='workshop'?pm:dash;if(edit.parentElement!==box){const f=api.doc.features.find(x=>x.id===api.active),t=f&&api.FT[f.type];box.replaceChildren(h('div',{class:'pmh'},h('button',{class:'okx ok',title:'OK',onclick:()=>{pmPart=false;api.active=null;showPM(false);}},'✓'),h('button',{class:'okx no',title:'Cancel (discard changes)',onclick:()=>{const s0=snap;pmPart=false;snap=null;api.active=null;showPM(false);if(s0)api.commit(d=>{for(const k of Object.keys(d))delete d[k];Object.assign(d,s0);});}},'✕'),h('b',{id:'pmt'},mode==='workshop'?'Properties':'Inspector')),edit);}if(!on){if(edit.parentElement!==home)home.insertBefore(edit,homeNext);if(api.S.tab==='edit')quiet(()=>api.setTab('check'));}};
  api.hooks.setTab=t=>{if(t==='edit'&&mode!=='amni')return showPM(true),false;if(mode!=='amni'&&PANEL[t]&&!QT){const R=ribbon(mode,X),i=R.findIndex(r=>r[2]===PANEL[t]);i>=0&&i!==rtab?(rtab=i,drawRibbon()):0;pane(true);}return true;};
  api.hooks.onEdit=a=>{if(mode==='amni')return;if(a||pmPart){if(!document.body.classList.contains('pm-on'))showPM(true);}else if(document.body.classList.contains('pm-on'))showPM(false);drawBar();};
  const drawBar=()=>{if(mode==='amni')return;const p=api.mesh&&api.mesh.props,m=api.MATS[api.doc.material]||api.MATS.al6061,ks=($('#kstat')||{}).textContent||'';pbar.replaceChildren(h('span',null,api.active?'Editing '+((api.doc.features.find(x=>x.id===api.active)||{}).name||'feature'):'Editing Part'),h('span',{class:'gr'}),h('span',null,ks),p?h('span',null,'Mass ',h('b',null,api.units.massDual(api.units.massKg(p.volume,api.doc,m.rho)))):'',h('span',null,api.units.docUnits(api.doc)==='in'?(mode==='workshop'?'in·lb·s':'in·lbf·s'):(mode==='workshop'?'mm·g·s':'mm·N·s')),h('span',null,h('b',null,api.units.docUnits(api.doc))));};
  new MutationObserver(()=>{drawBar();drawHead();}).observe($('#kstat'),{childList:true,characterData:true,subtree:true});
  api.onChange(()=>{drawBar();});
  const ctl=api.controls,cv=api.renderer.domElement;
  const mouse=()=>{ctl.mouseButtons=mode==='amni'?{LEFT:0,MIDDLE:1,RIGHT:2}:{LEFT:0,MIDDLE:0,RIGHT:2};};
  cv.addEventListener('pointerdown',e=>{if(mode==='amni'||e.button!==1)return;const zoom=mode==='workshop'?e.shiftKey:e.ctrlKey,pan=mode==='workshop'?e.ctrlKey:e.shiftKey;ctl.mouseButtons.MIDDLE=zoom?1:pan?2:0;},true);
  cv.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault();});
  const VO=[['front','Front','⬓'],['back','Back','⬒'],['left','Left','◧'],['right','Right','◨'],['top','Top','⬔'],['bottom','Bottom','⬕'],['iso','Isometric','◈'],['normal','Normal To','⊥']];
  const showVori=(x,y)=>{vori.replaceChildren(...VO.map(([k,l,i])=>h('button',{onclick:()=>{vori.style.display='none';X.view(k);}},h('span',null,i),l)));const r=$('#vp').getBoundingClientRect();vori.style.left=Math.max(8,Math.min(r.width-290,x-r.left-140))+'px';vori.style.top=Math.max(8,Math.min(r.height-140,y-r.top-60))+'px';vori.style.display='grid';};
  let mx=innerWidth/2,my=innerHeight/2;addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});document.addEventListener('pointerdown',e=>{if(!vori.contains(e.target))vori.style.display='none';});
  addEventListener('keydown',e=>{if(mode==='amni')return;const tg=e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;const c=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
    const V={1:'front',2:'back',3:'left',4:'right',5:'top',6:'bottom',7:'iso',8:'normal'};
    if(c&&V[k]&&mode==='workshop'){e.preventDefault();e.stopImmediatePropagation();X.view(V[k]);}
    else if(c&&k==='d'&&mode==='blueprint'){e.preventDefault();e.stopImmediatePropagation();X.view('iso');}
    else if(!document.body.classList.contains('form-mode')&&(c&&(k==='b'||k==='q')&&mode==='workshop'||c&&k==='g'&&mode==='blueprint')){e.preventDefault();e.stopImmediatePropagation();api.rebuild();api.toast(mode==='workshop'?'Rebuilt':'Regenerated',1200);}
    else if(k===' '&&!c){e.preventDefault();e.stopImmediatePropagation();showVori(mx,my);}
    else if(k==='enter'&&document.body.classList.contains('pm-on')){e.preventDefault();pmPart=false;api.active=null;showPM(false);}},true);
  const setMode=k=>{mode=MODES[k]?k:'workshop';try{localStorage.setItem('amnicad.ui',mode);localStorage.setItem('amnicad.ui.v','3');}catch{}document.body.classList.remove('pro','pro-workshop','pro-blueprint','pm-on');if(mode!=='amni')document.body.classList.add('pro','pro-'+mode);showPM(false);if(mode!=='amni'&&api.S.tab==='edit')quiet(()=>api.setTab('check'));mouse();drawMenu();drawRibbon();api.themeColors();dispatchEvent(new Event('amnicad:layout'));mode!=='amni'&&pick(rtab,false);eqs();drawHead();drawBar();api.renderTree();api.redraw();setTimeout(()=>dispatchEvent(new Event('resize')),30);};
  const eqh=$('#left .sec:has(#params) h3'),eqt=eqh&&eqh.firstChild,eqs=()=>{if(!eqh)return;const on=mode!=='amni',n=$('#params').children.length;eqt.textContent=(mode==='workshop'?'Equations':'Parameters')+(on?' ('+n+') ':' ');let c=true;try{c=localStorage.getItem('amnicad.ui.eq')!=='open';}catch{}eqh.parentElement.classList.toggle('eqc',on&&c);eqh.parentElement.classList.toggle('eqs',on);};
  eqh&&(eqh.addEventListener('click',e=>{if(mode==='amni'||e.target.closest('button'))return;const c=!eqh.parentElement.classList.contains('eqc');try{localStorage.setItem('amnicad.ui.eq',c?'':'open');}catch{}eqs();}),new MutationObserver(eqs).observe($('#params'),{childList:true}));
  api.onBuilt&&api.onBuilt(()=>{api.S.tab==='check'&&document.getElementById('tab-check').classList.contains('on')&&quiet(()=>api.setTab('check'));});
  setMode(mode);
  return{setMode,redraw:()=>mode!=='amni'?pick(rtab,false):drawRibbon(),get mode(){return mode;}};
}
