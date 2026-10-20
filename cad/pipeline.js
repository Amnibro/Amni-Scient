import {CS,prefs} from './cam.js';
const CSS='#pipe{display:flex;align-items:stretch;gap:3px;padding:7px 8px 0;overflow-x:auto;scrollbar-width:none;flex-shrink:0}#pipe button{flex:1 1 0;min-width:74px;display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:5px 7px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--ink);font:inherit;cursor:pointer;text-align:left}#pipe button b{font-size:12px;display:flex;gap:5px;align-items:center;white-space:nowrap}#pipe button small{font-size:10.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}#pipe i{width:7px;height:7px;border-radius:50%;background:var(--line);flex:none}#pipe .done i{background:#2fb36b}#pipe .stale i,#pipe .warn i{background:#f5a524}#pipe .bad i{background:#ff4d4f}#pipe .next{border-color:var(--acc,#59b6ff);border-style:dashed}#pipe .on{box-shadow:0 0 0 1px var(--acc,#59b6ff) inset}#pipe .ar{align-self:center;color:var(--mut);font-size:11px;flex:none}#pipe .opt{flex:0 0 auto;min-width:84px;border-color:var(--acc,#59b6ff);background:var(--acc-soft,transparent)}@media (max-width:699px){#pipe{padding:4px 7px 0;gap:2px}#pipe button{min-width:0;padding:4px 7px;flex-direction:row}#pipe button small{display:none}#pipe .opt{min-width:0}#pipe .ar{display:none}}';
const ST={rev:0,seen:new Map(),sig:''};
const at=(o,k)=>{if(!o)return null;const s=ST.seen.get(k);if(!s||s.o!==o)ST.seen.set(k,{o,rev:ST.rev});return ST.seen.get(k).rev;};
function stages(API,S){
  const doc=S.doc||{},fe=S.lastFea,fl=S.lastFlow,cr=CS.res,mk=at(cr,'make'),st=(o,k)=>o?at(o,k)<ST.rev?'stale':null:null,sf=fe&&fe.safety_factor,P=prefs();
  return[
    {tab:'edit',n:'Model',s:API.mesh?'done':'none',t:API.mesh?(doc.features||[]).filter(f=>!f.suppressed).length+' features':'Start a part'},
    {tab:'sim',n:'Stress',s:st(fe,'fea')||(!fe?'none':sf!=null&&sf<1?'bad':sf!=null&&sf<1.5?'warn':'done'),t:!fe?'Optional':fe.type==='modal'?(fe.freqs_Hz&&fe.freqs_Hz[0]!=null?fe.freqs_Hz[0]+' Hz':'Modal'):fe.type==='thermal'?'Max '+fe.Tmax_C+' °C':sf!=null?'Safety '+sf:'Done'},
    {tab:'flow',n:'Flow',s:st(fl,'flow')||(fl?'done':'none'),t:fl?'Cd '+fl.Cd:'Optional'},
    {tab:'make',n:'Make',s:cr?(mk<ST.rev?'stale':cr.ok?'done':'bad'):'none',t:cr&&cr.ok?Math.round(cr.time_min)+' min · '+cr.setups.length+' setup'+(cr.setups.length>1?'s':''):(P.machine||'Pick a machine').replace(/ \(.*\)$/,'')}];}
function paint(API,S,el){
  const L=stages(API,S),sig=JSON.stringify([L,S.tab,S.ws]);if(sig===ST.sig)return;ST.sig=sig;el.style.display=S.ws&&S.ws!=='part'?'none':'';
  const nx=L.findIndex((x,i)=>i>0&&(x.s==='none'||x.s==='stale')&&(x.tab==='make'||x.s==='stale')),h=API.h;
  el.replaceChildren(...L.flatMap((x,i)=>[i?h('span',{class:'ar'},'›'):null,h('button',{class:[x.s,i===nx&&API.mesh?'next':'',S.tab===x.tab?'on':''].join(' '),'data-pipe':x.tab,title:x.n+': '+(x.s==='stale'?'out of date, the part changed since this ran':x.s==='none'?'not run yet':x.t),onclick:()=>API.setTab(x.tab)},h('b',null,h('i'),x.n),h('small',null,x.s==='stale'?'Rerun':x.t))]).filter(Boolean),h('button',{class:'opt','data-pipe':'optimize',title:'Optimize: change sizes automatically to meet a goal (lighter, stiffer, cheaper, less drag…)',onclick:()=>API.optimize&&API.optimize()},h('b',null,'🎯 Optimize'),h('small',null,'Meet a goal')));}
export function mount(API,S){
  const r=document.getElementById('right'),tabs=r&&r.querySelector('.rtabs');if(!tabs||document.getElementById('pipe'))return;
  document.head.append(Object.assign(document.createElement('style'),{id:'pipe-style',textContent:CSS}));
  const el=Object.assign(document.createElement('nav'),{id:'pipe'});el.setAttribute('aria-label','Design to manufacture steps');r.insertBefore(el,tabs);
  API.onChange(()=>{ST.rev++;paint(API,S,el);});API.onBuilt&&API.onBuilt(()=>paint(API,S,el));setInterval(()=>paint(API,S,el),700);paint(API,S,el);}
