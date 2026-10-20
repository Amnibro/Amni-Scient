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
