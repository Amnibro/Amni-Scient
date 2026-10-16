import {clean,rgb,contrast,flip,SECTIONS} from './lookcore.js';
const SW=['#C89B4E','#59b6ff','#1f7ae0','#22d3ee','#4fd18b','#f0a04b','#d6455d','#a78bfa'],PR=[
['High contrast',{theme:'hc',acc:'#ffd400',bgm:'solid',bgd:['#000000','#000000'],bgl:['#ffffff','#ffffff'],gc:'#ffffff',ga:.4,mo:1,mc:'#d4d4d4',ec:'#000000',sc:'#ffd400'}],
['Warm neutral',{acc:'#c8743a',bgm:'grad',bgd:['#2b2621','#171310'],bgl:['#efe6d8','#faf6ee'],gc:'#a89880',mo:1,mc:'#c9bba6',ec:'#2a231c',sc:'#e0954f'}],
['Midnight violet',{theme:'dark',acc:'#a78bfa',bgm:'grad',bgd:['#1c1733','#0b0916'],bgl:['#e8e4f5','#f8f6fd'],gc:'#8f86c9',mo:1,mc:'#c4bdd9',ec:'#07050f',sc:'#c4b5fd'}],
['Forest sage',{acc:'#3f9d70',bgm:'grad',bgd:['#17241f','#0b1411'],bgl:['#e3ede6','#f6faf7'],gc:'#7fae95',mo:1,mc:'#b9cdc0',ec:'#0e1a15',sc:'#5fd09b'}],
['Paper',{theme:'light',acc:'#2f6fdb',bgm:'solid',bgl:['#ffffff','#ffffff'],bgd:['#1b1e24','#1b1e24'],gc:'#9aa4b2',ga:.5,mo:1,mc:'#d7dce3',ec:'#3b4350',sc:'#2f6fdb'}]],
GR=[['Graphite',['#2a2f37','#0d0f12'],['#f4f5f7','#d5d9df']],['Steel blue',['#33404f','#10151b'],['#eef3f8','#b9c7d6']],['Studio gray',['#40454c','#1c1f23'],['#ffffff','#cfd2d6']],['Sand',['#3a342b','#171410'],['#f7f1e5','#ddd2bc']],['Dusk',['#2e2a45','#0e0c1a'],['#ece8f8','#c3bde0']]],
CSS=`#lookp{position:fixed;top:54px;right:14px;width:400px;max-height:calc(100vh - 76px);overflow:auto;z-index:45;background:var(--panel);color:var(--ink);border:1px solid var(--line2);border-radius:var(--r);box-shadow:var(--shadow);padding:10px 12px 12px;font-size:12.5px}
#lookp h4{display:flex;align-items:center;justify-content:space-between;margin:0 0 6px;font-size:13px}#lookp h5{margin:12px 0 4px;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--mut)}
#lookp details{border-top:1px solid var(--line);padding:2px 0}#lookp summary{cursor:pointer;font-weight:650;padding:8px 0;font-size:13px;color:var(--ink)}#lookp details[open]>summary{color:var(--acc)}
#lookp .lr{display:flex;align-items:center;gap:8px;margin:5px 0;flex-wrap:wrap}#lookp .lr>label{flex:0 0 92px;color:var(--ink2)}#lookp .lr .seg{flex:1;flex-wrap:wrap}#lookp .seg button{white-space:nowrap;padding:5px 8px}#lookp input[type=color]{width:34px;height:26px;padding:0;border:1px solid var(--line2);border-radius:7px;background:none}
#lookp input[type=number],#lookp input[type=text]{background:var(--bg2);border:1px solid var(--line);border-radius:7px;padding:3px 7px;min-width:0}#lookp input[type=number]{width:84px}#lookp input[type=range]{flex:1;accent-color:var(--acc)}
#lookp .sws{display:flex;gap:5px;flex-wrap:wrap}#lookp .sws button{width:22px;height:22px;border-radius:50%;border:2px solid var(--line2)}#lookp .sws button.on{border-color:var(--ink)}
#lookp .warn{color:var(--warn);font-size:11.5px;margin:2px 0 0;line-height:1.35}#lookp .acts{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}#lookp .chips{display:flex;gap:5px;flex-wrap:wrap}#lookp .chips button{padding:3px 9px;border-radius:999px;border:1px solid var(--line2);font-size:11.5px}#lookp .chips button:hover,#lookp .chips button.on{border-color:var(--acc)}
#lookp .tl{display:grid;grid-template-columns:auto 1fr auto auto;gap:3px 7px;align-items:center;margin:4px 0}#lookp .tl .g{grid-column:1/-1;font-size:10.5px;color:var(--mut);margin-top:5px;text-transform:uppercase;letter-spacing:.07em}#lookp .tl button{width:22px;height:22px;border-radius:5px;color:var(--ink2)}#lookp .tl button:hover{background:var(--panel2)}#lookp .tl button.on{color:var(--acc)}#lookp .tl .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#lookp .kr{display:grid;grid-template-columns:1fr auto auto;gap:5px;align-items:center;margin:3px 0}#lookp .kr .kc{min-width:100px;padding:3px 8px;border:1px solid var(--line2);border-radius:7px;font-family:var(--mono);font-size:11.5px;text-align:center}#lookp .kr .kc.rec{border-color:var(--acc);color:var(--acc)}#lookp .kr .rs{width:22px;height:22px;color:var(--mut)}
#lookp .prof{display:grid;grid-template-columns:1fr auto;gap:5px;margin:4px 0;align-items:center}#lookp small{color:var(--mut)}`;
let box=null,off=null,OPEN=new Set(['global']),REC=null;
const cs=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export function toggle(api){
  if(box){close();return;}
  const h=api.h,L=()=>api.look.get(),St=()=>api.look.state(),put=o=>api.look.apply({...L(),...o}),dark=()=>St().dark,U=()=>api.units.docUnits(api.doc),k=(a,v)=>({'data-lk':a,'data-v':v}),PF=()=>api.store.get('amnicad.profiles',{});
  const seg=(a,opts,cur)=>h('div',{class:'seg'},...opts.map(([v,t])=>h('button',{...k(a,v),class:String(cur??'')===String(v)?'on':''},t)));
  const row=(l,...c)=>h('div',{class:'lr'},h('label',null,l),...c);
  const col=(a,v)=>h('input',{type:'color',value:v,...k(a),'aria-label':a});
  const chk=(a,on,t)=>h('label',{style:'display:flex;gap:7px;align-items:center;margin:4px 0'},h('input',{type:'checkbox',checked:on,...k(a)}),t);
  const rng=(a,min,max,step,v)=>h('input',{type:'range',min,max,step,value:v,...k(a),'aria-label':a});
  const pairNow=()=>{const l=L(),p=dark()?l.bgd:l.bgl;return p||[cs('--bg2')||'#202020',cs('--bg')||'#101010'];};
  const warn=()=>{const l=L(),w=box.querySelector('#lk-warn');if(!w)return;const a=rgb(cs('--acc')),p=rgb(cs('--panel')),i=rgb(cs('--acc-ink')||'#ffffff'),m=[];a&&p&&l.acc&&contrast(a,p)<4.5&&m.push('Accent text on panels is '+contrast(a,p).toFixed(1)+':1, below the 4.5:1 AA minimum. Try a '+(dark()?'lighter':'darker')+' shade.');a&&i&&l.acc&&contrast(a,i)<4.5&&m.push('Text on accent buttons is '+contrast(a,i).toFixed(1)+':1, below 4.5:1.');w.textContent=m.join(' ');w.style.display=m.length?'':'none';};
  const sec=(id,t,...c)=>h('details',{'data-sec':id,open:OPEN.has(id)},h('summary',null,t),...c,SECTIONS[id]?h('div',{class:'acts'},h('button',{class:'btn sm ghost',...k('rsec',id)},'Reset this section')):null);
  const allCmds=()=>(api.ui&&api.ui.ribbon?api.ui.ribbon():[]).flatMap(([,gs])=>gs.map(([g,c])=>[g,c]));
  const ordered=(c)=>{const o=L().ord||[],p=id=>{const i=o.indexOf(id);return i<0?1e9:i;};return c.map((x,i)=>[x,i]).sort((a,b)=>p(a[0].id)-p(b[0].id)||a[1]-b[1]).map(q=>q[0]);};
  const toolbar=()=>{const l=L(),hid=new Set(l.hid||[]),fav=l.fav||[],all=new Map(allCmds().flatMap(([,c])=>c.map(x=>[x.id,x])));const gs=new Map();for(const[g,c]of allCmds())gs.set(g,[...(gs.get(g)||[]),...c]);return[h('h5',null,'Quick bar (favorites)'),fav.length?h('div',{class:'tl'},...fav.flatMap((id,i)=>all.get(id)?[h('span',{class:'ico'}),h('span',{class:'nm'},all.get(id).label),h('button',{...k('favmv',id+':-1'),title:'Move earlier','aria-label':'Move earlier',disabled:!i},'◀'),h('button',{...k('favmv',id+':1'),title:'Move later','aria-label':'Move later',disabled:i===fav.length-1},'▶')]:[])):h('small',null,'Star a command below to pin it to the quick bar next to Undo and Redo.'),
    h('h5',null,'Commands: pin, reorder, hide'),...[...gs].map(([g,c])=>h('div',{class:'tl'},h('div',{class:'g'},g),...ordered(c).flatMap(x=>[h('button',{...k('fav',x.id),class:fav.includes(x.id)?'on':'',title:'Pin to the quick bar','aria-label':'Pin '+x.label},fav.includes(x.id)?'★':'☆'),h('span',{class:'nm'},x.label),h('span',null,h('button',{...k('cmv',x.id+':-1'),title:'Move earlier','aria-label':'Move '+x.label+' earlier'},'◀'),h('button',{...k('cmv',x.id+':1'),title:'Move later','aria-label':'Move '+x.label+' later'},'▶')),h('input',{type:'checkbox',checked:!hid.has(x.id),...k('hid',x.id),title:'Show on the ribbon','aria-label':'Show '+x.label})])))];};
  const keysUI=()=>{const K=api.keys;if(!K)return[h('small',null,'Loading shortcuts…')];const l=L(),kb=l.kb||{};return[h('div',{class:'warn',id:'lk-kw',style:'display:none'}),...['Edit','View','Assistant','Layout'].flatMap(g=>[h('h5',null,g),...K.actions().filter(a=>a.group===g).map(a=>h('div',{class:'kr'},h('span',null,a.label),h('button',{class:'kc'+(REC===a.id?' rec':''),...k('krec',a.id),'aria-label':'Shortcut for '+a.label},REC===a.id?'Press keys…':a.keys.length?a.keys.join(' / '):'None'),h('button',{class:'rs',...k('kreset',a.id),title:'Restore the default','aria-label':'Restore the default shortcut for '+a.label,disabled:!(a.id in kb)},'↺')))]),h('small',null,'Click a shortcut, then press the new keys. Escape cancels, Backspace unbinds. Conflicting keys are refused.')];};
  const mouseUI=()=>{const K=api.keys,cur=K?K.preset():'amni';return[h('div',{class:'chips'},...Object.entries(K?K.presets:{}).map(([id,p])=>h('button',{...k('mm',id),class:cur===id?'on':'',title:p.d},p.n))),h('small',{id:'lk-md'},K&&K.presets[cur]?K.presets[cur].d:''),chk('zc',L().zc!==0,'Wheel zooms toward the cursor'),chk('wi',!!L().wi,'Invert the wheel direction')];};
  const profUI=()=>{const p=PF();return[row('Name',h('input',{type:'text',id:'lk-pn',placeholder:'Profile name',maxlength:'40','aria-label':'Profile name'}),h('button',{class:'btn sm',...k('psave')},'Save')),...Object.keys(p).map(n=>h('div',{class:'prof'},h('span',null,n),h('span',{class:'row'},h('button',{class:'btn sm',...k('papply',n)},'Apply'),h('button',{class:'btn sm ghost',...k('pexp',n)},'Export'),h('button',{class:'btn sm ghost',...k('pdel',n),'aria-label':'Delete '+n},'✕')))),h('div',{class:'acts'},h('button',{class:'btn sm',...k('export')},'Export current'),h('button',{class:'btn sm',...k('pexpall')},'Export all'),h('button',{class:'btn sm',...k('import')},'Import'))];};
  const body=()=>{const l=L(),s=St(),acc=cs('--acc')||'#59b6ff',bgm=l.bgm||'layout',pr=pairNow(),u=U(),mk=api.ui?api.ui.mode:'workshop',sk=n=>cs(n)||'#888888';return[
    h('h4',null,'Appearance',h('button',{...k('close'),title:'Close','aria-label':'Close'},'✕')),
    h('h5',null,'Presets'),h('div',{class:'chips'},...['amni','workshop','blueprint'].map(m=>h('button',{...k('layout',m),class:mk===m&&!Object.keys(l).length?'on':''},m[0].toUpperCase()+m.slice(1))),...PR.map(([n])=>h('button',k('preset',n),n))),
    sec('global','Global UI',
      row('Theme',seg('theme',[['system','System'],['light','Light'],['dark','Dark'],['hc','High contrast']],l.theme||'system')),
      h('h5',null,'Accent'),h('div',{class:'lr'},h('div',{class:'sws'},...SW.map(c=>h('button',{...k('acc',c),style:'background:'+c,title:c,'aria-label':'Accent '+c,class:l.acc===c?'on':''}))),col('acc',acc)),h('div',{class:'warn',id:'lk-warn',style:'display:none'}),
      row('Surface tone',seg('sf',[['','Default'],['warm','Warm'],['cool','Cool'],['neutral','Neutral'],['graphite','Graphite']],l.sf)),
      row('Ribbon style',seg('rb',[['','Icons + labels'],['i','Icons only'],['l','Labels only'],['c','Compact']],l.rb)),
      row('Icon weight',seg('iw',[['1','Thin'],['','Regular'],['3','Bold']],l.iw)),
      row('Font',seg('ff',[['','Layout'],['sys','System UI'],['inter','Inter-like'],['brand','Brand']],l.ff)),chk('mn',!!l.mn,'Monospace numbers')),
    sec('layout','Layout and density',
      row('UI scale',rng('fs',80,140,1,l.fs||100),h('span',{id:'lk-fs'},(l.fs||100)+'%')),
      row('Corner radius',rng('rk',0,2,.1,l.rk??1),h('span',{id:'lk-rk'},Math.round((l.rk??1)*100)+'%')),
      row('Density',seg('dens',[['','Comfortable'],['compact','Compact'],['spacious','Spacious']],l.dens)),
      row('Panel side',seg('ps',[['','Right'],['left','Left']],l.ps)),row('Tree side',seg('tp',[['','Left'],['right','Right']],l.tp)),
      row('Ribbon position',seg('rp',[['','Top'],['left','Left toolbar']],l.rp)),chk('sb',l.sb!==0,'Show the status bar'),...toolbar()),
    sec('viewport','Viewport',
      h('h5',null,'Background'),seg('bgm',[['layout','Layout'],['solid','Solid'],['grad','Gradient']],bgm),
      bgm==='layout'?null:row(bgm==='solid'?'Color':'Top / bottom',col('bg0',pr[0]),bgm==='grad'?col('bg1',pr[1]):null),bgm==='layout'?null:chk('auto',l.auto!==0,'Derive the '+(dark()?'light':'dark')+' theme automatically'),
      h('div',{class:'chips'},...GR.map(([n])=>h('button',k('grp',n),n))),
      row('Lighting',seg('env',[['','Studio'],['neutral','Neutral'],['warm','Warm'],['cool','Cool'],['dark','Dark']],l.env)),
      h('h5',null,'Edges and shading'),row('Edge thickness',rng('et',.5,4,.1,l.et??1.15),h('span',{id:'lk-et'},(l.et??1.15).toFixed(1))),chk('ev',l.ev!==0,'Show edge lines'),chk('se',!!l.se,'Silhouette outline'),chk('sh',l.sh!==0,'Soft shadows'),
      h('h5',null,'Grid'),chk('gs',l.gs!==0,'Show ground grid'),row('Color',col('gc',s.gridColor)),row('Opacity',h('input',{type:'range',min:0,max:100,value:Math.round(s.gridOpacity*100),...k('ga'),'aria-label':'Grid opacity'})),
      row('Major lines',seg('gmode',[['auto','Auto'],['custom','Custom']],l.gm?'custom':'auto'),l.gm?h('input',{type:'number',min:0,step:'any',value:l.gm,...k('gm'),'aria-label':'Major spacing'}):null,l.gm?h('span',null,u):null),
      h('h5',null,'Model'),chk('mo',!!l.mo,'Override part appearance (otherwise from material and finish)'),l.mo?row('Part color',col('mc',s.modelColor)):null,row('Edge color',col('ec',s.edgeColor)),
      h('h5',null,'Highlights'),row('Selection',col('sc',s.selColor)),row('Hover',col('hc',l.hc||s.selColor)),row('Preselect',col('pc',l.pc||'#ffb454')),
      h('h5',null,'Sketch'),row('Under-defined',col('kf',l.kf||sk('--acc'))),row('Fully defined',col('kd',l.kd||sk('--ink'))),row('Over-defined',col('ko',l.ko||sk('--err'))),row('Dimension text',rng('dz',9,22,1,l.dz||12),h('span',{id:'lk-dz'},(l.dz||12)+' px')),
      h('h5',null,'View'),row('Orientation',seg('tr',[['','Axes'],['cube','View cube'],['off','Off']],l.tr)),row('Position',seg('tpos',[['','Bottom left'],['br','Bottom right'],['tl','Top left'],['tr','Top right']],l.tpos)),row('Projection',seg('pj',[['','Perspective'],['ortho','Orthographic']],l.pj))),
    sec('input','Keyboard and mouse',h('h5',null,'Mouse mapping'),...mouseUI(),h('h5',null,'Keyboard shortcuts'),...keysUI()),
    sec('profiles','Profiles',...profUI()),
    h('div',{class:'acts'},h('button',{class:'btn sm',...k('reset')},'Reset everything'))];};
  const draw=()=>{const y=box.scrollTop;box.replaceChildren(...body().filter(Boolean));warn();box.scrollTop=y;};
  const bgPatch=(p)=>{const l=L(),d=dark(),o={bgm:l.bgm||'solid'};o[d?'bgd':'bgl']=p;const q=d?'bgl':'bgd';(l.auto!==0||!l[q])&&(o[q]=p.map(c=>flip(c,!d)));put(o);};
  const FL={mn:'off',se:'off',wi:'off',sh:'on',sb:'on',zc:'on'},SEGK=['sf','rb','iw','ff','dens','ps','tp','rp','env','tr','tpos','pj','mm'],CL=['hc','pc','kf','kd','ko'];
  const mv=(a,id,d)=>{const i=a.indexOf(id),j=i+d;if(i<0||j<0||j>=a.length)return a;const b=[...a];[b[i],b[j]]=[b[j],b[i]];return b;};
  const kwarn=m=>{const w=box.querySelector('#lk-kw');w&&(w.textContent=m,w.style.display=m?'':'none');};
  const exportJ=(o,n)=>api.download(new Blob([JSON.stringify(o,null,1)],{type:'application/json'}),n);
  const prof=(n)=>({amnicadProfile:1,name:n,ui:api.ui.mode,look:L()});
  const applyProf=p=>{p.ui&&api.ui&&api.ui.mode!==p.ui&&api.ui.setMode(p.ui);api.look.apply(clean(p.look));draw();};
  const act=(a,v,el)=>{const l=L(),s=St();
    a==='close'?close():a==='layout'?(api.look.apply({}),api.ui&&api.ui.setMode(v),draw()):a==='preset'?(api.look.apply(clean(PR.find(p=>p[0]===v)[1])),draw()):
    a==='theme'?(put({theme:v==='system'?undefined:v}),draw()):a==='acc'?(put({acc:v||el.value}),el.tagName==='BUTTON'?draw():warn()):
    a==='bgm'?(v==='layout'?put({bgm:undefined,bgd:undefined,bgl:undefined}):(l.bgm||bgPatch(pairNow().slice()),put({bgm:v})),draw()):
    a==='grp'?(put({bgm:'grad',bgd:GR.find(g=>g[0]===v)[1],bgl:GR.find(g=>g[0]===v)[2]}),draw()):
    a==='bg0'||a==='bg1'?bgPatch([box.querySelector('[data-lk=bg0]').value,(box.querySelector('[data-lk=bg1]')||box.querySelector('[data-lk=bg0]')).value]):
    a==='auto'?(put({auto:el.checked?undefined:0}),draw()):a==='gs'?put({gs:el.checked?undefined:0}):a==='gc'?put({gc:el.value}):a==='ga'?put({ga:+el.value/100}):
    a==='gmode'?(put({gm:v==='custom'?+(+s.autoMajor.toPrecision(2)).toFixed(4):undefined}),draw()):a==='gm'?put({gm:+el.value>0?+el.value:undefined}):
    a==='mo'?(put({mo:el.checked?1:undefined,mc:el.checked?l.mc||s.modelColor:l.mc}),draw()):a==='mc'?put({mc:el.value,mo:1}):a==='ec'?put({ec:el.value}):a==='ev'?put({ev:el.checked?undefined:0}):a==='sc'?put({sc:el.value}):
    SEGK.includes(a)?(put({[a]:v===''?undefined:a==='iw'?+v:v}),draw()):CL.includes(a)?put({[a]:el.value}):FL[a]?(put({[a]:FL[a]==='on'?el.checked?undefined:0:el.checked?1:undefined}),draw()):
    a==='et'?(put({et:+el.value}),box.querySelector('#lk-et').textContent=(+el.value).toFixed(1)):a==='dz'?(put({dz:+el.value}),box.querySelector('#lk-dz').textContent=el.value+' px'):a==='rk'?(put({rk:+el.value}),box.querySelector('#lk-rk').textContent=Math.round(el.value*100)+'%'):
    a==='fs'?(put({fs:+el.value}),box.querySelector('#lk-fs').textContent=el.value+'%'):
    a==='fav'?(put({fav:(l.fav||[]).includes(v)?(l.fav||[]).filter(x=>x!==v):[...(l.fav||[]),v]}),draw()):a==='favmv'?(put({fav:mv(l.fav||[],v.split(':')[0],+v.split(':')[1])}),draw()):
    a==='hid'?(put({hid:el.checked?(l.hid||[]).filter(x=>x!==v):[...(l.hid||[]),v]}),draw()):
    a==='cmv'?(()=>{const[id,d]=v.split(':'),gs=allCmds().find(([,c])=>c.some(x=>x.id===id)),g=ordered(gs[1]).map(x=>x.id),n=mv(g,id,+d);put({ord:[...(l.ord||[]).filter(x=>!g.includes(x)),...n]});draw();})():
    a==='krec'?(REC=REC===v?null:v,api.keys&&api.keys.rec(!!REC),draw()):a==='kreset'?(()=>{const kb={...(l.kb||{})};delete kb[v];put({kb:Object.keys(kb).length?kb:undefined});REC=null;draw();})():
    a==='rsec'?(()=>{const o={...l};for(const x of SECTIONS[v])delete o[x];api.look.apply(o);draw();})():
    a==='psave'?(()=>{const n=box.querySelector('#lk-pn').value.trim().slice(0,40);if(!n)return api.toast('Name the profile first');const p=PF();p[n]=prof(n);api.store.set('amnicad.profiles',p);draw();})():
    a==='papply'?applyProf(PF()[v]):a==='pdel'?(()=>{const p=PF();delete p[v];api.store.set('amnicad.profiles',p);draw();})():a==='pexp'?exportJ(PF()[v],'amnicad-profile-'+v.replace(/\W+/g,'-')+'.json'):
    a==='pexpall'?exportJ({amnicadProfiles:PF(),current:prof('current')},'amnicad-profiles.json'):
    a==='reset'?(api.look.apply({}),draw()):a==='export'?exportJ(prof('current'),'amnicad-look.json'):a==='import'?pick():0;};
  const pick=()=>{const f=h('input',{type:'file',accept:'.json,application/json',onchange:async()=>{try{const j=JSON.parse(await f.files[0].text());if(j&&j.amnicadProfiles&&typeof j.amnicadProfiles==='object'){const p=PF();for(const[n,v]of Object.entries(j.amnicadProfiles))p[String(n).slice(0,40)]={amnicadProfile:1,name:String(n).slice(0,40),ui:['amni','workshop','blueprint'].includes(v.ui)?v.ui:undefined,look:clean(v.look)};api.store.set('amnicad.profiles',p);j.current&&applyProf(j.current);draw();return;}const o=clean(j&&j.look||j);Object.keys(o).length?applyProf({ui:j.ui,look:o}):api.toast('That file has no appearance settings');}catch{api.toast('Could not read that appearance file');}}});f.click();};
  if(!document.getElementById('lookp-css'))document.head.append(h('style',{id:'lookp-css'},CSS));
  box=h('div',{id:'lookp',role:'dialog','aria-label':'Appearance'});document.body.append(box);draw();
  box.addEventListener('toggle',e=>{const d=e.target;d.dataset&&d.dataset.sec&&(d.open?OPEN.add(d.dataset.sec):OPEN.delete(d.dataset.sec));},true);
  box.addEventListener('click',e=>{const el=e.target.closest('[data-lk]');el&&el.tagName==='BUTTON'&&act(el.dataset.lk,el.dataset.v,el);});
  box.addEventListener('input',e=>{const el=e.target.closest('[data-lk]');el&&el.tagName==='INPUT'&&el.type!=='checkbox'&&act(el.dataset.lk,el.dataset.v,el);});
  box.addEventListener('change',e=>{const el=e.target.closest('[data-lk]');el&&el.type==='checkbox'&&act(el.dataset.lk,el.dataset.v,el);});
  const rec=e=>{if(!REC)return;e.preventDefault();e.stopImmediatePropagation();const K=api.keys,c=e.key==='Escape'?null:e.key==='Backspace'?K.NONE:K.combo(e);if(c===''){return;}if(c!==null){const kb={...(L().kb||{}),[REC]:c},cf=c===K.NONE?[]:K.conflicts(kb).filter(x=>x.combo===c);if(cf.length){const names=cf.flatMap(x=>x.ids.filter(i=>i!==REC)).map(i=>K.actions().find(a=>a.id===i).label);kwarn(cf.some(x=>x.reserved)&&!names.length?c+' is reserved for the application.':c+' is already used by '+names.join(', ')+'. Unbind it first.');return;}put({kb});}REC=null;K.rec(false);draw();};
  const key=e=>{if(REC)return;e.key==='Escape'&&close();},lay=()=>box&&draw();addEventListener('keydown',rec,true);addEventListener('keydown',key);addEventListener('amnicad:layout',lay);off=()=>{removeEventListener('keydown',rec,true);removeEventListener('keydown',key);removeEventListener('amnicad:layout',lay);REC=null;api.keys&&api.keys.rec(false);};
}
function close(){box&&box.remove();box=null;off&&off();off=null;}
