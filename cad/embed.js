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
function applyBrand(p,tier){
  const c=p.colors||{};
  if(c.acc){document.documentElement.style.setProperty('--acc',c.acc);document.documentElement.style.setProperty('--brand',c.acc);}
  if(c.accInk)document.documentElement.style.setProperty('--acc-ink',c.accInk);
  document.documentElement.classList.add('embed');
  if(!document.querySelector('meta[name="robots"]')){const m=document.createElement('meta');m.name='robots';m.content='noindex,nofollow';document.head.append(m);}
  const host=document.querySelector('header');
  if(host&&!host.querySelector('#embed-chip')){const s=document.createElement('span');s.id='embed-chip';s.className='pol-chip';s.textContent=p.name+' · '+tier;host.append(s);}
}
function deny(msg,origin){
  const o=document.createElement('div');
  o.id='embed-denied';
  o.style.cssText='position:fixed;inset:0;z-index:9999;background:#0b0d10;color:#edeff2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;font:16px/1.45 ui-sans-serif,system-ui,sans-serif;text-align:center;gap:12px';
  const h=document.createElement('h1');h.style.cssText='font-size:22px;margin:0';h.textContent='Amni-CAD could not be embedded';
  const p=document.createElement('p');p.style.cssText='margin:0;max-width:36em;color:#c9ced6';p.textContent=msg;
  o.append(h,p);document.body.append(o);
  post(origin,'denied',{reason:msg});
}
function take(tier,used,kind,ok=true){
  const d=decide({tier,used:used[kind]||0,ok});
  if(d.count){used[kind]=(used[kind]||0)+1;}
  return d;
}
async function boot(){
  const slug=q('partner'),key=q('key'),want=q('tier');
  const parentOrigin=(()=>{try{return document.referrer?new URL(document.referrer).origin:'';}catch{return'';}})();
  if(key){const u=new URL(location.href);u.searchParams.delete('key');history.replaceState(null,'',u.pathname+u.search+u.hash);}
  let session;
  try{session=await admit({tok:key,slug,origin:parentOrigin,all:await loadPartners(),want});}
  catch(e){deny(e.message||'License check failed',parentOrigin);return;}
  const {partner:p,tier,origins}=session;
  applyBrand(p,tier);
  const used=loadUsed(p.slug),allowed=new Set(origins.map(x=>x.replace(/\/$/,'')));
  const okOrigin=o=>allowed.has(String(o||'').replace(/\/$/,''));
  const cap=capOf(tier);
  const API=await waitAPI();
  const sendModel=()=>post(parentOrigin,'model',modelOf(API));
  API.onBuilt(sendModel);
  if(typeof API.onChange==='function')API.onChange(()=>{});
  addEventListener('message',async ev=>{
    if(!okOrigin(ev.origin))return;
    const m=ev.data;if(!m||typeof m.amnicad!=='string')return;
    const t=m.amnicad;
    if(t==='getModel'){sendModel();return;}
    if(t==='theme'&&m.colors){applyBrand({...p,colors:m.colors},tier);return;}
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
}
