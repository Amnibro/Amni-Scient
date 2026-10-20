import {CS} from './cam.js';
const MAX=40,ST={L:[],API:null,S:null,seen:{fea:null,flow:null},open:false};
const snap=()=>({doc:ST.API.docJSON,res:ST.API.results(),cam:CS.res});
const ago=t=>{const s=Math.round((Date.now()-t)/1000);return s<60?'just now':s<3600?Math.round(s/60)+' min ago':Math.round(s/3600)+' h ago';};
export const list=()=>ST.L;
function push(e){ST.L.push(e);ST.L.length>MAX&&ST.L.shift();paint();}
function done(label,b,o,err){const a=ST.API.docJSON;push({label:String(label).slice(0,120),kind:o.kind||'process',t:Date.now(),before:b,changed:a!==b.doc,err:err&&(err.message||String(err))});}
export function begin(label,o={}){const b=snap();let open=true;return{end:err=>{if(!open)return;open=false;done(label,b,o,err);},cancel:()=>{open=false;}};}
export function step(label,fn,o={}){const b=snap();let r;try{r=fn();}catch(e){o.retreatOnError&&ST.API.docJSON!==b.doc&&ST.API.restoreDoc(b.doc);done(label,b,o,e);throw e;}
  return r&&typeof r.then==='function'?r.then(v=>{done(label,b,o);return v;},e=>{o.retreatOnError&&ST.API.docJSON!==b.doc&&ST.API.restoreDoc(b.doc);done(label,b,o,e);throw e;}):(done(label,b,o),r);}
export function retreat(i){const e=ST.L[i];if(!e)return false;const API=ST.API;API.docJSON!==e.before.doc&&API.restoreDoc(e.before.doc);API.clearResults();API.setResults(e.before.res);CS.res=e.before.cam;ST.seen={fea:e.before.res.lastFea,flow:e.before.res.lastFlow};const n=ST.L.length-i;ST.L.splice(i);paint();dispatchEvent(new Event('amnicad:steps'));API.toast('Back to before “'+e.label+'”'+(n>1?' ('+n+' steps)':'')+'. Undo brings the part back.',5200);return true;}
export const retreatLast=()=>retreat(ST.L.length-1);
function watch(){const S=ST.S,res=ST.API.results();for(const[k,n]of[['fea','Stress study'],['flow','Flow study']]){const cur=k==='fea'?S.lastFea:S.lastFlow;if(cur&&cur!==ST.seen[k]){const prev=ST.seen[k];ST.seen[k]=cur;push({label:n+(k==='fea'&&cur.safety_factor!=null?' · safety '+cur.safety_factor:k==='flow'&&cur.Cd!=null?' · Cd '+cur.Cd:''),kind:'study',t:Date.now(),changed:false,before:{doc:ST.API.docJSON,res:{...res,[k==='fea'?'lastFea':'lastFlow']:prev},cam:CS.res}});}}}
function paint(){const b=document.getElementById('b-steps');b&&(b.disabled=!ST.L.length,b.title=ST.L.length?'Steps ('+ST.L.length+'): go back to before '+ST.L[ST.L.length-1].label+' (Ctrl+Alt+Z)':'Steps: AI changes, optimizations, recipes, studies and CAM runs appear here so you can go back to before any of them');ST.open&&show();}
function show(){const API=ST.API,h=API.h;ST.open=true;const rows=ST.L.map((e,i)=>({e,i})).reverse();
  API.dlg('Steps',[h('div',{class:'note'},'Go back to before any processing step. Everything after it is undone too, and Undo brings it back.'),rows.length?h('div',{id:'steps-list'},...rows.map(({e,i})=>h('div',{class:'st-row'},h('div',{style:'min-width:0'},h('b',null,e.label),h('div',{class:'note'},e.kind+' · '+ago(e.t)+(e.changed?' · changed the part':'')+(e.err?' · failed: '+e.err:''))),h('button',{class:'btn sm','data-step':i,onclick:()=>{retreat(i);ST.open=false;const d=document.getElementById('dlg');d&&d.close();}},'Go back')))):h('div',{class:'note'},'No steps yet.')]);
  const d=document.getElementById('dlg');d&&d.addEventListener('close',()=>{ST.open=false;},{once:true});}
export function mount(API,S){ST.API=API;ST.S=S;ST.seen={fea:S.lastFea||null,flow:S.lastFlow||null};
  document.head.append(Object.assign(document.createElement('style'),{textContent:'.st-row{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}.st-row b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'}));
  const b=document.getElementById('b-steps');b&&(b.onclick=show);addEventListener('keydown',e=>{(e.ctrlKey||e.metaKey)&&e.altKey&&(e.key.toLowerCase()==='z'||e.code==='KeyZ')&&(e.preventDefault(),e.stopImmediatePropagation(),retreatLast());},true);setInterval(watch,700);paint();}
