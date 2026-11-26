import {loadPartners,admit} from './partner.js';
import {capOf,decide} from './embed_meter.js';
const EMBED=/\/embed(?:\.html)?\/?$/.test(location.pathname);
if(EMBED)boot();
function q(k){return new URLSearchParams(location.search).get(k)||'';}
function post(origin,type,data,tf){if(!origin||origin==='null')return;parent.postMessage({amnicad:type,...data},origin,tf||[]);}
function waitAPI(){return new Promise(res=>{const t=setInterval(()=>{if(window.amnicad&&window.amnicad.API){clearInterval(t);res(window.amnicad.API);}},50);});}
function dayKey(slug){return'amni-embed-meter:'+slug+':'+new Date().toISOString().slice(0,10);}
function loadUsed(slug){try{return Object.assign({quote:0,export:0,checkout:0},JSON.parse(sessionStorage.getItem(dayKey(slug))||'{}'));}catch{return{quote:0,export:0,checkout:0};}}
function saveUsed(slug,u){try{sessionStorage.setItem(dayKey(slug),JSON.stringify(u));}catch{}}
function countBends(doc){let n=0;for(const f of doc.features||[]){if(f.type!=='sheet'||f.suppressed)continue;for(const fl of f.flanges||[]){n++;n+=(fl.then||[]).length;}}return n;}
function modelOf(API){
  const doc=API.doc,mesh=API.mesh;
  if(!doc||!mesh||!mesh.props||!mesh.props.bbox)return{ok:false};
  const p=mesh.props,UN=API.units,MATS=API.MATS||{},mat=MATS[doc.material]||MATS.al6061||{n:String(doc.material||'Material'),rho:2700};
  const u=UN.docUnits(doc),size=[0,1,2].map(i=>p.bbox.max[i]-p.bbox.min[i]),ord=[...size].sort((a,b)=>b-a);
  const tDoc=ord[2],areaDoc=ord[0]*ord[1],tIn=u==='in'?tDoc:tDoc/25.4,areaIn2=u==='in'?areaDoc:areaDoc/(25.4*25.4);
  const volMM3=UN.volMM3(p.volume,doc),massKg=UN.massKg(p.volume,doc,mat.rho),bends=countBends(doc);
  const kind=bends?'bent sheet':(tIn>0&&ord[0]/tIn>8?'flat sheet':'solid');
  return{ok:true,name:doc.name||'Part',units:u,sizeText:UN.bboxDual(p.bbox,doc),volText:UN.dual('vol',volMM3),massText:UN.massDual(massKg),massKg,matId:doc.material||'al6061',matName:mat.n,volCm3:volMM3/1000,areaIn2,tIn,bends,kind,bbox:{min:p.bbox.min,max:p.bbox.max},volume:p.volume,material:doc.material||'al6061'};
}
function loadCss(){if(document.getElementById('embed-css'))return;const l=document.createElement('link');l.id='embed-css';l.rel='stylesheet';l.href=new URL('./embed.css',import.meta.url).href;document.head.append(l);}
function themeSheet(p){
  const t={...(p.colors||{}),...(p.theme||{})},soft=t.acc?t.acc+'22':'rgba(0,0,0,.08)';
  const css='html.embed,html.embed[data-theme="light"],html.embed[data-theme="dark"]{--scheme:'+(t.scheme||'light')+';--bg:'+t.bg+';--bg2:'+t.bg2+';--panel:'+t.panel+';--panel2:'+t.panel2+';--line:'+t.line+';--line2:'+t.line2+';--ink:'+t.ink+';--ink2:'+t.ink2+';--mut:'+t.mut+';--acc:'+t.acc+';--acc-ink:'+(t.accInk||'#fff')+';--brand:'+t.acc+';--acc-soft:'+soft+';--r:'+(t.r||'8px')+';--rk:'+(t.rk??0.7)+';--font:'+t.font+';--icon:'+(t.icon||t.ink2)+';--grid:'+t.grid+';--ok:'+(t.ok||'#0F7A43')+';--warm:'+t.acc+';--brand:'+t.acc+';--vp:linear-gradient(180deg,'+t.vp0+','+t.vp1+')}';
  let s=document.getElementById('embed-theme');if(!s){s=document.createElement('style');s.id='embed-theme';document.head.append(s);}s.textContent=css;
}
function wordmark(p){
  const host=document.querySelector('header');if(!host)return;
  const old=document.querySelector('header .brand');
  if(old){const a=document.createElement('span');a.className='embed-mark';a.textContent=p.name;old.replaceWith(a);}
  else if(!host.querySelector('.embed-mark')){const a=document.createElement('span');a.className='embed-mark';a.textContent=p.name;host.prepend(a);}
}
function dropPro(){document.documentElement.classList.remove('pro','pro-workshop','pro-blueprint','ui-amni');document.body.classList.remove('pro','pro-workshop','pro-blueprint','pm-on','sheet-on');}
function trimPalette(allow){
  const keep=allow&&allow.length?new Set(allow):null,go=()=>{
    if(keep)for(const b of document.querySelectorAll('#palette [data-ft]'))b.hidden=!keep.has(b.dataset.ft);
    for(const g of document.querySelectorAll('#palette .palg')){const pal=g.nextElementSibling,btns=pal?pal.querySelectorAll('[data-ft],button'):[],vis=[...btns].some(b=>!b.hidden&&getComputedStyle(b).display!=='none');g.hidden=!vis;if(pal&&pal!==g){const isGroup=pal.classList.contains('pal')||pal.matches&&!pal.classList.contains('palg');if(isGroup)pal.hidden=!vis;}}
  };
  const el=document.getElementById('palette');if(el)new MutationObserver(go).observe(el,{childList:true,subtree:true});go();
}
function applyLook(API,t){
  if(!API||!API.look||!t)return;
  const prev=API.look.get&&API.look.get();
  const stored=API.store?{look:API.store.get('amnicad.look',null),theme:API.store.get('amnicad.theme',null)}:null;
  API.look.apply({theme:t.scheme||'light',acc:t.acc,ff:t.ff||'inter',dens:t.dens||'compact',rk:t.rk,bgm:'grad',bgl:[t.vp0,t.vp1],bgd:[t.vp0,t.vp1],gc:t.grid,ga:t.gridA,sc:t.acc,env:t.env||'neutral'});
  if(API.store&&stored){API.store.set('amnicad.look',stored.look);API.store.set('amnicad.theme',stored.theme);}
  if(typeof API.themeColors==='function')API.themeColors();
  const root=document.documentElement;if(t.acc){root.style.setProperty('--warm',t.acc);root.style.setProperty('--brand',t.acc);}
  if(typeof API.resizeView==='function')API.resizeView();
  if(typeof API.redraw==='function')API.redraw();
  return prev;
}
function deny(msg,origin){
  const o=document.createElement('div');
  o.id='embed-denied';
  o.style.cssText='position:fixed;inset:0;z-index:9999;background:#f4f6f8;color:#121417;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;font:16px/1.45 ui-sans-serif,system-ui,sans-serif;text-align:center;gap:12px';
  const h=document.createElement('h1');h.style.cssText='font-size:22px;margin:0';h.textContent='Amni-CAD could not be embedded';
  const p=document.createElement('p');p.style.cssText='margin:0;max-width:36em;color:#5c6570';p.textContent=msg;
  o.append(h,p);document.body.append(o);
  post(origin,'denied',{reason:msg});
}
function take(tier,used,kind,ok=true){const d=decide({tier,used:used[kind]||0,ok});if(d.count){used[kind]=(used[kind]||0)+1;}return d;}
async function boot(){
  loadCss();
  document.documentElement.classList.add('embed');
  if(!document.querySelector('meta[name="robots"]')){const m=document.createElement('meta');m.name='robots';m.content='noindex,nofollow';document.head.append(m);}
  const slug=q('partner'),key=q('key'),want=q('tier');
  const parentOrigin=(()=>{try{return document.referrer?new URL(document.referrer).origin:'';}catch{return'';}})();
  if(key){const u=new URL(location.href);u.searchParams.delete('key');history.replaceState(null,'',u.pathname+u.search+u.hash);}
  let session;
  try{session=await admit({tok:key,slug,origin:parentOrigin,all:await loadPartners(),want});}
  catch(e){deny(e.message||'License check failed',parentOrigin);return;}
  const {partner:p,tier,origins}=session,theme=p.theme||p.colors||{};
  document.documentElement.dataset.partner=p.slug;
  document.documentElement.dataset.theme=theme.scheme||'light';
  themeSheet(p);dropPro();wordmark(p);
  const used=loadUsed(p.slug),allowed=new Set(origins.map(x=>x.replace(/\/$/,'')));
  const okOrigin=o=>allowed.has(String(o||'').replace(/\/$/,''));
  const cap=capOf(tier);
  const API=await waitAPI();
  dropPro();wordmark(p);themeSheet(p);applyLook(API,theme);trimPalette(p.features);
  const sendModel=()=>post(parentOrigin,'model',modelOf(API));
  API.onBuilt(sendModel);
  if(typeof API.onChange==='function')API.onChange(()=>{});
  addEventListener('message',async ev=>{
    if(!okOrigin(ev.origin))return;
    const m=ev.data;if(!m||typeof m.amnicad!=='string')return;
    const t=m.amnicad;
    if(t==='getModel'){sendModel();return;}
    if(t==='theme'&&m.colors){themeSheet({...p,theme:{...theme,...m.colors}});applyLook(API,{...theme,...m.colors});return;}
    if(t==='setConfig'&&m.material&&API.commit){API.commit(d=>{d.material=m.material;});return;}
    if(t==='export'){
      const d=take(tier,used,'export',true);saveUsed(p.slug,used);
      if(!d.allow){post(ev.origin,'meter',{kind:'export',...d});return;}
      try{
        const fmt=m.fmt||'step',blob=await API.exportFmt(fmt,b=>b),buf=await blob.arrayBuffer();
        post(ev.origin,'export',{ok:true,fmt,name:(API.safeName?API.safeName():'part')+'.'+fmt,mime:blob.type||'application/octet-stream',buf,meter:d},[buf]);
      }catch(e){post(ev.origin,'export',{ok:false,reason:e.message||'Export failed',meter:d});}
      return;
    }
    if(t==='quote'||t==='checkout'){
      const d=take(tier,used,t,true);saveUsed(p.slug,used);
      post(ev.origin,t,{ok:d.allow,reason:d.allow?'ok':d.reason,part:modelOf(API),quote:m.quote||null,order:m.order||null,meter:{kind:t,used:used[t],cap,unlimited:cap<0,...d}});
    }
  });
  post(parentOrigin,'ready',{partner:p.slug,name:p.name,tier,quote:p.quote,processes:p.processes,materials:p.materials,colors:p.colors,meter:{used,cap,unlimited:cap<0}});
  sendModel();
  requestAnimationFrame(()=>{if(typeof API.resizeView==='function')API.resizeView();if(typeof API.redraw==='function')API.redraw();});
}
