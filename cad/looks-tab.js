import {CATS,COLORS,thumb,lookNorm,findFace,resolve,summary} from './looks.js';
import {TEXGEN,TEXGEN_KINDS} from './texgen.js';
const ST={el:null,A:null,hooked:false,cat:'All',q:'',tgt:null,dyn:null,grid:null,live:0,swallow:0,custom:'#2a63c4'};
const nm=n=>n+' face'+(n===1?'':'s'),f2=v=>(+v).toFixed(2).replace(/\.?0+$/,'')||'0';
const selFs=A=>[...A.S.sel.faces].map(([id,pt])=>({id,pt}));
const tgtFs=A=>A.S.sel.faces.size?selFs(A):null;
const put=(A,o,fs)=>A.paintLook({...o,...(fs?{fs}:{})});
function curLook(A){const m=A.mesh,base=A.lookBase(),ls=A.doc.looks;if(!m||!ls||!ls.length)return base;if(!A.S.sel.faces.size){const w=ls.find(e=>e.all);return w?lookNorm(w.look):base;}const R=resolve(m,ls),f=A.S.sel.faces.keys().next().value;return R.fl[f]>=0?R.list[R.fl[f]]:base;}
function drag(A,ev,payload,img){if(ev.button)return;ST.swallow=0;const sx=ev.clientX,sy=ev.clientY,touch=ev.pointerType==='touch',cv=A.renderer.domElement;let on=false,gh=null,last=null;
 const end=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',end);gh&&gh.remove();on&&A.hoverFace(null);cv.style.cursor='';};
 const mv=e=>{if(!on){const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)<7)return;if(touch&&Math.abs(dy)>Math.abs(dx))return end();on=true;ST.swallow=1;gh=document.body.appendChild(A.h('img',{src:img,class:'lk-ghost',alt:''}));}e.preventDefault();gh.style.transform='translate('+(e.clientX-21)+'px,'+(e.clientY-21)+'px)';const el=document.elementFromPoint(e.clientX,e.clientY),h0=el===cv?A.hit(e,'face'):null;last=h0&&h0.kind==='face'?h0:null;A.hoverFace(last?last.id:null);cv.style.cursor=last?'copy':'';};
 const up=e=>{if(on&&last){const sel=A.S.sel.faces,fs=e.shiftKey?null:sel.has(last.id)?selFs(A):[{id:last.id,pt:last.pt}];put(A,payload,fs);}end();};
 addEventListener('pointermove',mv,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',end);}
const click=(A,payload)=>()=>{if(ST.swallow){ST.swallow=0;return;}put(A,payload,tgtFs(A));};
function swatch(A,L){const img=thumb(L,96);return A.h('button',{class:'lk-sw',title:L.n+' (drag onto a face, or click to apply to the selection)',onpointerdown:e=>drag(A,e,{look:L},img),onclick:click(A,{look:L})},A.h('img',{src:img,alt:'',draggable:'false'}),A.h('span',null,L.n));}
function chip(A,c){const L=lookNorm({c,r:.35,cc:.4}),img=thumb(L,48);return A.h('button',{class:'lk-col',style:'background:'+c,title:c+' (drag onto a face, or click to recolor the selection)',onpointerdown:e=>drag(A,e,{ov:{c}},img),onclick:click(A,{ov:{c}})});}
function renderGrid(){const A=ST.A,q=ST.q.trim().toLowerCase(),list=CATS.filter(([c])=>ST.cat==='All'||c===ST.cat||q).flatMap(([c,a])=>a.map(L=>({c,L:lookNorm(L)}))).filter(x=>!q||(x.L.n+' '+x.c+' '+(x.L.tx||'')).toLowerCase().includes(q));ST.grid.replaceChildren(...(list.length?list.map(x=>swatch(A,x.L)):[A.h('div',{class:'note'},'No looks match "'+ST.q+'".')]));}
function renderDyn(){const A=ST.A,h=A.h;if(!ST.dyn)return;const fs=tgtFs(A),n=A.S.sel.faces.size,L=curLook(A),U=A.mmPer(),ul=U===1?'mm':'in';ST.tgt.replaceChildren(h('b',null,n?nm(n)+' selected':'Whole part'),h('span',null,n?' · drop or click to paint just these':' · select faces first to paint only some'));
 const sl=(lab,k,min,max,step)=>{const o=h('output',null,f2(L[k]));return h('label',{class:'lk-sl'},h('span',null,lab),h('input',{type:'range',min,max,step,value:L[k],oninput:e=>{ST.live=1;o.textContent=f2(e.target.value);put(A,{ov:{[k]:+e.target.value},merge:'lk-'+k},fs);},onchange:()=>{ST.live=0;renderDyn();}}),o);};
 const num=(lab,k,v,fn)=>h('label',{class:'lk-num'},h('span',null,lab),h('input',{type:'number',step:'any',value:+v.toFixed(4),onchange:e=>{const x=+e.target.value;isFinite(x)&&put(A,{ov:{[k]:fn(x)}},fs);}}));
 const looks=A.doc.looks||[],S=summary(looks);
 ST.dyn.replaceChildren(
  h('div',{class:'sec'},h('h3',null,'Adjust',h('span',{class:'lk-now'},L.n)),
   h('div',{class:'lk-row'},h('label',{class:'lk-num'},h('span',null,'Color'),h('input',{type:'color',value:L.c,oninput:e=>{ST.live=1;ST.custom=e.target.value;put(A,{ov:{c:e.target.value},merge:'lk-c'},fs);},onchange:()=>{ST.live=0;renderDyn();}})),
    h('label',{class:'lk-num'},h('span',null,'Texture'),h('select',{onchange:e=>put(A,{ov:{tx:e.target.value}},fs)},h('option',{value:''},'None'),...TEXGEN_KINDS.map(k=>h('option',{value:k,selected:k===L.tx},TEXGEN[k].name))))),
   L.tx?h('div',{class:'lk-row'},num('Tile ('+ul+')','ts',L.ts/U,x=>Math.max(.1,x*U)),num('Angle (°)','ta',L.ta,x=>x)):null,
   sl('Metal','m',0,1,.01),sl('Roughness','r',0,1,.01),sl('Clear coat','cc',0,1,.01),sl('Glass','g',0,1,.01),L.tx?sl('Bump','tb',0,4,.05):null),
  h('div',{class:'sec'},h('h3',null,'Applied',looks.length?h('button',{onclick:()=>A.paintLook({clear:true}),title:'Remove every look and show the part material again'},'Clear all'):null),
   looks.length?h('div',{class:'lk-list'},...looks.map((e,i)=>h('div',{class:'lk-it'},h('img',{src:thumb(e.look,32),alt:''}),h('div',null,h('b',null,S[i].look),h('span',null,S[i].target)),
    e.pts?h('button',{class:'btn sm ghost',title:'Select these faces',onclick:()=>{const m=A.mesh;if(!m)return;A.S.sel.faces.clear();A.S.sel.edges.clear();for(const p of e.pts){const f=findFace(m,p);f>=0&&A.S.sel.faces.set(f,p.slice(0,3));}A.refreshSel();}},'Select'):null,
    h('button',{class:'btn sm ghost',title:'Remove this look',onclick:()=>A.commit(d=>{d.looks.splice(i,1);d.looks.length||delete d.looks;},{noEdit:true})},'Remove')))):h('div',{class:'note'},'Nothing yet. The part shows its material and finish.'),
   h('div',{class:'lk-row'},n&&looks.length?h('button',{class:'btn sm',onclick:()=>A.paintLook({clear:true,fs})},'Remove from selection'):null,h('button',{class:'btn sm pri',onclick:()=>import('./form_render.js').then(m=>m.partDialog(A))},'Photo render'))));}
function render(){const A=ST.A,h=A.h,el=ST.el;if((A.S.ws||'part')!=='part'){el.replaceChildren(h('div',{class:'sec'},h('h3',null,'Looks'),h('div',{class:'note'},'Looks color and texture Part models. Switch to Part, or use the look panel in this workspace.')));ST.dyn=null;return;}
 ST.tgt=h('div',{class:'lk-tgt'});ST.grid=h('div',{class:'lk-grid'});ST.dyn=h('div');
 el.replaceChildren(h('div',{class:'sec'},h('h3',null,'Looks'),ST.tgt,h('div',{class:'note'},'Drag a swatch or color onto a face (Shift paints the whole part), or select faces and tap one.')),
  h('div',{class:'sec'},h('input',{class:'lk-q',type:'search',placeholder:'Search looks (carbon, walnut, anodize…)',value:ST.q,oninput:e=>{ST.q=e.target.value;renderGrid();}}),h('div',{class:'chips lk-cats'},...['All',...CATS.map(c=>c[0])].map(c=>h('button',{class:c===ST.cat?'on':'',onclick:e=>{ST.cat=c;[...e.target.parentNode.children].forEach(b=>b.classList.toggle('on',b===e.target));renderGrid();}},c))),ST.grid),
  h('div',{class:'sec'},h('h3',null,'Colors'),h('div',{class:'lk-pal'},...COLORS.map(c=>chip(A,c)))),ST.dyn);
 renderGrid();renderDyn();}
export function mount(el,A){ST.el=el;ST.A=A;if(!ST.hooked){ST.hooked=true;const re=()=>{ST.el&&ST.el.classList.contains('on')&&!ST.live&&renderDyn();};A.onChange(re);addEventListener('amnicad:sel',re);}render();}
