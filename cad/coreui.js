const CSS=`.feat.frz{background:color-mix(in srgb,var(--acc) 7%,transparent)}
.feat.frz .nm{color:var(--ink2)}
.frzbar{display:flex;align-items:center;gap:7px;height:17px;margin:2px 4px;cursor:ns-resize}
.frzbar i{flex:1;height:3px;border-radius:2px;background:var(--acc);opacity:.85}
.frzbar:hover i{opacity:1;height:4px}
.frzbar .btn{height:17px;padding:0 7px;font-size:11px}
.frzbar b{font-size:10px;color:var(--acc);letter-spacing:.04em}
.frznote{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:8px 0;padding:8px 10px;border-radius:8px;border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);background:var(--acc-soft);font-size:12.5px}
.frzbody{opacity:.7}
.measurep{position:absolute;left:10px;top:52px;z-index:7;max-width:min(360px,calc(100% - 20px));max-height:calc(100% - 70px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 12px;box-shadow:var(--shadow);font-size:12.5px}
.measurep .mi{gap:7px;align-items:center;margin:2px 0}
.measurep .kv{margin-top:7px}
@media (pointer:coarse){.measurep .x{width:34px;height:34px}.measurep .seg button{min-height:34px}}`;
export function css(){if(typeof document==='undefined'||document.getElementById('core-css'))return;const s=document.createElement('style');s.id='core-css';s.textContent=CSS;document.head.append(s);}
export function rowFreeze(items,fs,fz,setFz,h){
  css();
  items.forEach((it,i)=>{
    const acts=it.querySelector('.acts'),lock=i<fz;it.classList.toggle('frz',lock);lock&&it.setAttribute('draggable','false');
    lock&&[...acts.querySelectorAll('button')].forEach(b=>b.title!=='Roll back to here'&&(b.disabled=true,b.style.opacity=.35));
    acts.prepend(h('button',{style:fz===i+1?'color:var(--acc)':null,title:fz===i+1?'Unfreeze':'Freeze up to here (lock features above the bar and skip them on rebuild)','aria-label':fz===i+1?'Unfreeze':'Freeze up to here',onclick:e=>{e.stopPropagation();setFz(fz===i+1?0:i+1);}},fz===i+1?'❄⃠':'❄'));
  });
}
export function freezeBar(items,rows,fz,setFz,h){
  if(!fz)return;
  const bar=h('div',{class:'frzbar',draggable:'true',title:'Freeze bar: features above it are locked and skipped on rebuild. Drag to move; double-click to remove.',ondragstart:e=>{e.dataTransfer.setData('text/amnicad','fz');e.dataTransfer.effectAllowed='move';},ondblclick:()=>setFz(0)},h('b',null,'FROZEN'),h('i'),h('button',{class:'btn sm ghost',onclick:()=>setFz(0),title:'Unfreeze all'},'✕'));
  const at=rows[fz]?items.indexOf(rows[fz]):items.length;items.splice(at<0?items.length:at,0,bar);
}
export function frozenEdit(body,thaw,h){
  css();
  body.classList.add('frzbody');body.inert=true;
  return[h('div',{class:'frznote'},h('span',null,'This feature is above the freeze bar, so it is locked.'),h('button',{class:'btn sm',onclick:thaw},'Unfreeze')),body];
}
export function openLine({h,f,k,label,openSketch,set,ptsEditor,getF}){
  css();
  return h('div',{style:'margin:8px 0'},h('div',{class:'row',style:'justify-content:space-between;align-items:center;margin-bottom:4px'},h('label',{class:'mut'},label),h('button',{class:'btn sm pri',title:'Draw the line with lines, arcs, dimensions and relations',onclick:()=>openSketch(f.id)},f.sketch?'\u270E Edit sketch':'\u270E Open sketcher')),
    f.sketch?h('div',null,h('div',{class:'note'},'Constrained sketch: '+f.sketch.ents.filter(e=>!e.ref).length+' entities, '+f.sketch.cons.length+' dimensions and relations. Dimensions can use your parameters.'),h('button',{class:'btn sm ghost',style:'margin-top:7px',onclick:()=>set('sketch',undefined)},'Convert to simple points')):ptsEditor(()=>(getF(f.id)||{})[k],(L,keep2)=>set(k,L,keep2)));
}
export const DKIND={dplane:['datum_plane'],bplane:['datum_plane'],daxis:['datum_axis']};
export const lastDatum=(d,type,before)=>{const i=d.features.findIndex(f=>f.id===before),L=d.features.slice(0,i<0?d.features.length:i).filter(f=>f.type===type);return L.length?L[L.length-1].id:'';};
export function datumSelect({h,f,k,label,kind,doc,set,selectField,OPN}){
  const i=doc.features.findIndex(x=>x.id===f.id),L=doc.features.slice(0,i<0?doc.features.length:i).filter(x=>DKIND[kind].includes(x.type)),opts=[...(kind==='bplane'?['XY','XZ','YZ'].map(p=>[p,OPN[p]||p]):[]),...L.map(x=>[x.id,(x.name||x.id)+' ('+x.id+')'])];
  return opts.length?selectField(label,opts,f[k]||opts[0][0],v=>set(k,v)):h('div',{class:'note',style:'margin:8px 0'},label+': add a '+(kind==='daxis'?'datum axis':'datum plane')+' before this feature first.');
}
const sizeOf=b=>[0,1,2].map(i=>b.max[i]-b.min[i]);
export function bodyLabel(UN,doc,b){return'Body '+(b.index+1)+' · '+UN.nf(UN.volMM3(b.volume,doc)/1000,3)+' cm³ · '+sizeOf(b.bbox).map(v=>UN.nf(v,3)).join(' × ')+' '+UN.docUnits(doc);}
export function bodyList({h,mesh,UN,doc,addCombine}){
  css();const L=mesh&&mesh.props&&mesh.props.solids;if(!L)return[];
  return[h('div',{class:'palg',style:'margin-top:7px'},'Bodies ('+L.length+')'),...L.map((b,i)=>h('div',{class:'feat mi',title:'A separate solid of the part',style:'cursor:default'},h('span',{class:'ic'},'▣'),h('span',{class:'nm'},bodyLabel(UN,doc,{...b,index:i})))),h('div',{class:'row',style:'margin:5px 4px'},h('button',{class:'btn sm',title:'Merge, subtract or intersect bodies',onclick:addCombine},'Combine bodies…'))];
}
const sel=(b,s)=>s&&typeof s==='object'&&s.index!=null?s.index===b.index:false;
export function bodyPick({h,f,k,label,kind,bodies,set,UN,doc}){
  if(!bodies)return h('div',{class:'note',style:'margin:8px 0'},label+': loading the bodies…');
  if(bodies.length<2)return h('div',{class:'note',style:'margin:8px 0'},label+': the part has only one body at this point, so there is nothing to combine.');
  const cur=f[k],idx=v=>[].concat(v===undefined?[]:v).filter(s=>s&&s.index!=null).map(s=>s.index);
  if(kind==='body')return h('div',{class:'fld'},h('label',null,label),h('select',{onchange:e=>set(k,{index:+e.target.value})},...bodies.map(b=>h('option',{value:b.index,selected:idx(cur)[0]===b.index||(idx(cur).length===0&&b.index===0)},bodyLabel(UN,doc,b)))));
  const all=cur&&cur.by==='all',on=new Set(idx(cur));
  return h('div',{style:'margin:8px 0'},h('label',{class:'mut'},label),h('div',{class:'row',style:'gap:7px;margin:5px 0'},h('label',{class:'row',style:'gap:7px;align-items:center'},h('input',{type:'checkbox',checked:all,onchange:e=>set(k,e.target.checked?{by:'all'}:bodies.filter(b=>idx(f.target)[0]!==b.index).map(b=>({index:b.index})))}),'Every other body')),...(all?[]:bodies.map(b=>h('label',{class:'row',style:'gap:7px;align-items:center'},h('input',{type:'checkbox',checked:on.has(b.index),onchange:e=>{const s=new Set(idx(f[k]));e.target.checked?s.add(b.index):s.delete(b.index);set(k,[...s].map(i=>({index:i})));}}),bodyLabel(UN,doc,b)))));
}
