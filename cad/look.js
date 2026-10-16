import {clean,rgb,contrast,flip} from './lookcore.js';
const SW=['#59b6ff','#1f7ae0','#22d3ee','#4fd18b','#f0a04b','#e0794a','#d6455d','#a78bfa'],PR=[
['High contrast',{theme:'dark',acc:'#ffd400',bgm:'solid',bgd:['#000000','#000000'],bgl:['#ffffff','#ffffff'],gc:'#ffffff',ga:.4,mo:1,mc:'#d4d4d4',ec:'#000000',sc:'#ffd400'}],
['Warm neutral',{acc:'#c8743a',bgm:'grad',bgd:['#2b2621','#171310'],bgl:['#efe6d8','#faf6ee'],gc:'#a89880',mo:1,mc:'#c9bba6',ec:'#2a231c',sc:'#e0954f'}],
['Midnight violet',{theme:'dark',acc:'#a78bfa',bgm:'grad',bgd:['#1c1733','#0b0916'],bgl:['#e8e4f5','#f8f6fd'],gc:'#8f86c9',mo:1,mc:'#c4bdd9',ec:'#07050f',sc:'#c4b5fd'}],
['Forest sage',{acc:'#3f9d70',bgm:'grad',bgd:['#17241f','#0b1411'],bgl:['#e3ede6','#f6faf7'],gc:'#7fae95',mo:1,mc:'#b9cdc0',ec:'#0e1a15',sc:'#5fd09b'}],
['Paper',{theme:'light',acc:'#2f6fdb',bgm:'solid',bgl:['#ffffff','#ffffff'],bgd:['#1b1e24','#1b1e24'],gc:'#9aa4b2',ga:.5,mo:1,mc:'#d7dce3',ec:'#3b4350',sc:'#2f6fdb'}]],
CSS=`#lookp{position:fixed;top:54px;right:14px;width:318px;max-height:calc(100vh - 76px);overflow:auto;z-index:45;background:var(--panel);color:var(--ink);border:1px solid var(--line2);border-radius:var(--r);box-shadow:var(--shadow);padding:10px 12px 12px;font-size:12.5px}
#lookp h4{display:flex;align-items:center;justify-content:space-between;margin:0 0 6px;font-size:13px}#lookp h5{margin:12px 0 4px;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--mut)}
#lookp .lr{display:flex;align-items:center;gap:8px;margin:5px 0;flex-wrap:wrap}#lookp .lr>label{flex:0 0 96px;color:var(--ink2)}#lookp .lr .seg{flex:1}#lookp input[type=color]{width:34px;height:26px;padding:0;border:1px solid var(--line2);border-radius:6px;background:none}
#lookp input[type=number]{width:84px;background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:3px 6px}#lookp input[type=range]{flex:1;accent-color:var(--acc)}
#lookp .sws{display:flex;gap:5px;flex-wrap:wrap}#lookp .sws button{width:22px;height:22px;border-radius:50%;border:2px solid var(--line2)}#lookp .sws button.on{border-color:var(--ink)}
#lookp .warn{color:var(--warn);font-size:11.5px;margin:2px 0 0;line-height:1.35}#lookp .acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}#lookp .chips{display:flex;gap:5px;flex-wrap:wrap}#lookp .chips button{padding:3px 9px;border-radius:999px;border:1px solid var(--line2);font-size:11.5px}#lookp .chips button:hover{border-color:var(--acc)}`;
let box=null,off=null;
const cs=n=>getComputedStyle(document.body).getPropertyValue(n).trim();
export function toggle(api){
  if(box){close();return;}
  const h=api.h,L=()=>api.look.get(),St=()=>api.look.state(),put=o=>api.look.apply({...L(),...o}),dark=()=>St().dark,U=()=>api.units.docUnits(api.doc),k=(a,v)=>({'data-lk':a,'data-v':v});
  const seg=(a,opts,cur)=>h('div',{class:'seg'},...opts.map(([v,t])=>h('button',{...k(a,v),class:String(cur)===String(v)?'on':''},t)));
  const row=(l,...c)=>h('div',{class:'lr'},h('label',null,l),...c);
  const col=(a,v)=>h('input',{type:'color',value:v,...k(a),'aria-label':a});
  const chk=(a,on,t)=>h('label',{style:'display:flex;gap:6px;align-items:center'},h('input',{type:'checkbox',checked:on,...k(a)}),t);
  const pairNow=()=>{const l=L(),p=dark()?l.bgd:l.bgl;return p||[cs('--bg2')||'#202020',cs('--bg')||'#101010'];};
  const warn=()=>{const l=L(),w=box.querySelector('#lk-warn');if(!w)return;const a=rgb(cs('--acc')),p=rgb(cs('--panel')),i=rgb(cs('--acc-ink')||'#ffffff'),m=[];a&&p&&l.acc&&contrast(a,p)<4.5&&m.push('Accent text on panels is '+contrast(a,p).toFixed(1)+':1, below the 4.5:1 AA minimum. Try a '+(dark()?'lighter':'darker')+' shade.');a&&i&&l.acc&&contrast(a,i)<4.5&&m.push('Text on accent buttons is '+contrast(a,i).toFixed(1)+':1, below 4.5:1.');w.textContent=m.join(' ');w.style.display=m.length?'':'none';};
  const body=()=>{const l=L(),s=St(),acc=cs('--acc')||'#59b6ff',bgm=l.bgm||'layout',pr=pairNow(),u=U(),mk=api.ui?api.ui.mode:'workshop';return[
    h('h4',null,'Appearance',h('button',{...k('close'),title:'Close','aria-label':'Close'},'✕')),
    h('h5',null,'Presets'),h('div',{class:'chips'},...['amni','workshop','blueprint'].map(m=>h('button',{...k('layout',m),class:mk===m&&!Object.keys(l).length?'on':''},m[0].toUpperCase()+m.slice(1))),...PR.map(([n])=>h('button',k('preset',n),n))),
    h('h5',null,'Theme'),seg('theme',[['system','System'],['light','Light'],['dark','Dark']],l.theme||'system'),
    h('h5',null,'Accent'),h('div',{class:'lr'},h('div',{class:'sws'},...SW.map(c=>h('button',{...k('acc',c),style:'background:'+c,title:c,class:l.acc===c?'on':''}))),col('acc',acc)),h('div',{class:'warn',id:'lk-warn',style:'display:none'}),
    h('h5',null,'Viewport background'),seg('bgm',[['layout','Layout'],['solid','Solid'],['grad','Gradient']],bgm),
    bgm==='layout'?null:row(bgm==='solid'?'Color':'Top / bottom',col('bg0',pr[0]),bgm==='grad'?col('bg1',pr[1]):null),bgm==='layout'?null:chk('auto',l.auto!==0,'Derive the '+(dark()?'light':'dark')+' theme automatically'),
    h('h5',null,'Grid'),chk('gs',l.gs!==0,'Show ground grid'),row('Color',col('gc',s.gridColor)),row('Opacity',h('input',{type:'range',min:0,max:100,value:Math.round(s.gridOpacity*100),...k('ga')})),
    row('Major lines',seg('gmode',[['auto','Auto'],['custom','Custom']],l.gm?'custom':'auto'),l.gm?h('input',{type:'number',min:0,step:'any',value:l.gm,...k('gm'),'aria-label':'Major spacing'}):null,l.gm?h('span',null,u):null),
    h('h5',null,'Model'),chk('mo',!!l.mo,'Override part appearance (otherwise from material and finish)'),l.mo?row('Part color',col('mc',s.modelColor)):null,row('Edge color',col('ec',s.edgeColor)),chk('ev',l.ev!==0,'Show edge lines'),
    h('h5',null,'Selection'),row('Highlight',col('sc',s.selColor)),
    h('h5',null,'Interface'),row('Density',seg('dens',[['comfortable','Comfortable'],['compact','Compact']],l.dens||'comfortable')),row('Font size',h('input',{type:'range',min:90,max:120,step:1,value:l.fs||100,...k('fs')}),h('span',{id:'lk-fs'},(l.fs||100)+'%')),
    h('div',{class:'acts'},h('button',{class:'btn sm',...k('reset')},'Reset to layout default'),h('button',{class:'btn sm',...k('export')},'Export'),h('button',{class:'btn sm',...k('import')},'Import'))];};
  const draw=()=>{box.replaceChildren(...body().filter(Boolean));warn();};
  const bgPatch=(p)=>{const l=L(),d=dark(),o={bgm:l.bgm||'solid'};o[d?'bgd':'bgl']=p;const q=d?'bgl':'bgd';(l.auto!==0||!l[q])&&(o[q]=p.map(c=>flip(c,!d)));put(o);};
  const act=(a,v,el)=>{const l=L(),s=St();
    a==='close'?close():a==='layout'?(api.look.apply({}),api.ui&&api.ui.setMode(v),draw()):a==='preset'?(api.look.apply(clean(PR.find(p=>p[0]===v)[1])),draw()):
    a==='theme'?(put({theme:v==='system'?undefined:v}),draw()):a==='acc'?(put({acc:v||el.value}),el.tagName==='BUTTON'?draw():warn()):
    a==='bgm'?(v==='layout'?put({bgm:undefined,bgd:undefined,bgl:undefined}):(l.bgm||bgPatch(pairNow().slice()),put({bgm:v})),draw()):
    a==='bg0'||a==='bg1'?bgPatch([box.querySelector('[data-lk=bg0]').value,(box.querySelector('[data-lk=bg1]')||box.querySelector('[data-lk=bg0]')).value]):
    a==='auto'?(put({auto:el.checked?undefined:0}),draw()):a==='gs'?put({gs:el.checked?undefined:0}):a==='gc'?put({gc:el.value}):a==='ga'?put({ga:+el.value/100}):
    a==='gmode'?(put({gm:v==='custom'?+(+s.autoMajor.toPrecision(2)).toFixed(4):undefined}),draw()):a==='gm'?put({gm:+el.value>0?+el.value:undefined}):
    a==='mo'?(put({mo:el.checked?1:undefined,mc:el.checked?l.mc||s.modelColor:l.mc}),draw()):a==='mc'?put({mc:el.value,mo:1}):a==='ec'?put({ec:el.value}):a==='ev'?put({ev:el.checked?undefined:0}):a==='sc'?put({sc:el.value}):
    a==='dens'?(put({dens:v==='compact'?'compact':undefined}),draw()):a==='fs'?(put({fs:+el.value}),box.querySelector('#lk-fs').textContent=el.value+'%'):
    a==='reset'?(api.look.apply({}),draw()):a==='export'?api.download(new Blob([JSON.stringify({amnicadLook:1,look:L()},null,1)],{type:'application/json'}),'amnicad-look.json'):
    a==='import'?pick():0;};
  const pick=()=>{const f=h('input',{type:'file',accept:'.json,application/json',onchange:async()=>{try{const j=JSON.parse(await f.files[0].text()),o=clean(j&&j.look||j);Object.keys(o).length?(api.look.apply(o),draw()):api.toast('That file has no appearance settings');}catch{api.toast('Could not read that appearance file');}}});f.click();};
  if(!document.getElementById('lookp-css'))document.head.append(h('style',{id:'lookp-css'},CSS));
  box=h('div',{id:'lookp',role:'dialog','aria-label':'Appearance'});document.body.append(box);draw();
  box.addEventListener('click',e=>{const el=e.target.closest('[data-lk]');el&&el.tagName==='BUTTON'&&act(el.dataset.lk,el.dataset.v,el);});
  box.addEventListener('input',e=>{const el=e.target.closest('[data-lk]');el&&el.tagName==='INPUT'&&el.type!=='checkbox'&&act(el.dataset.lk,el.dataset.v,el);});
  box.addEventListener('change',e=>{const el=e.target.closest('[data-lk]');el&&el.type==='checkbox'&&act(el.dataset.lk,el.dataset.v,el);});
  const key=e=>e.key==='Escape'&&close(),lay=()=>box&&draw();addEventListener('keydown',key);addEventListener('amnicad:layout',lay);off=()=>{removeEventListener('keydown',key);removeEventListener('amnicad:layout',lay);};
}
function close(){box&&box.remove();box=null;off&&off();off=null;}
