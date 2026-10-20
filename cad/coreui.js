const CSS=`.feat.frz{background:color-mix(in srgb,var(--acc) 7%,transparent)}
.feat.frz .nm{color:var(--ink2)}
.frzbar{display:flex;align-items:center;gap:7px;height:17px;margin:2px 4px;cursor:ns-resize}
.frzbar i{flex:1;height:3px;border-radius:2px;background:var(--acc);opacity:.85}
.frzbar:hover i{opacity:1;height:4px}
.frzbar .btn{height:17px;padding:0 7px;font-size:11px}
.frzbar b{font-size:10px;color:var(--acc);letter-spacing:.04em}
.frznote{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:8px 0;padding:8px 10px;border-radius:8px;border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);background:var(--acc-soft);font-size:12.5px}
.frzbody{opacity:.7}`;
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
