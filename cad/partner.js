import {rank} from './embed_meter.js';
const PUB=globalThis.AMNI_SITE_PUB||'kVLK9H13Q_JJtJZ81kGNxlRzKs7omzn8pu4hpF8TjeM';
const TIERS=['basic','pro','enterprise'];
const unb=s=>{const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4));return Uint8Array.from(b,c=>c.charCodeAt(0));};
const b64=u=>{let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const te=s=>new TextEncoder().encode(s);
const bad=(m,x={})=>Object.assign(new Error(m),x);
export async function loadPartners(){
  const u=new URL('./partners.json',import.meta.url);
  if(u.protocol==='file:')return JSON.parse(await(await import('node:fs/promises')).readFile(u,'utf8'));
  const r=await fetch(u.href,{cache:'no-cache'});
  if(!r.ok)throw bad('Partner config could not be loaded');
  return r.json();
}
export const partnerOf=(all,slug)=>all&&all[slug]||null;
export function ancestors(p){return [...new Set(['\'self\'',...((p&&p.origins)||[])])].join(' ');}
export function allAncestors(all){const o=new Set(['\'self\'']);for(const p of Object.values(all||{}))for(const x of p.origins||[])o.add(x);return[...o].join(' ');}
export function originOk(p,origin){if(!origin||!p)return false;const o=String(origin).replace(/\/$/,'');return(p.origins||[]).some(x=>x.replace(/\/$/,'')===o);}
export function clampTier(want,max){const m=TIERS.includes(max)?max:'basic';return TIERS.includes(want)&&rank(want)<=rank(m)?want:m;}
async function sigOk(pub,msg,sig){const pk=unb(pub);const k=await crypto.subtle.importKey('raw',pk,{name:'Ed25519'},false,['verify']);return crypto.subtle.verify({name:'Ed25519'},k,sig,msg);}
export async function verifyKey(tok,pub=PUB,now=Date.now()){
  const t=String(tok||'').replace(/\s+/g,'');
  const m=/^AMNISITE1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(t);
  if(!m)throw bad('That is not an Amni-CAD site license key');
  if(!pub)throw bad('No site license public key is configured');
  let L;try{L=JSON.parse(new TextDecoder().decode(unb(m[1])));}catch{throw bad('The license key is not valid');}
  if(!await sigOk(pub,te('AMNISITE1.'+m[1]),unb(m[2])))throw bad('The license key signature is not valid');
  if(L.v!==1)throw bad('This license needs a newer Amni-CAD');
  if(L.exp&&L.exp<now)throw bad('This license has expired');
  if(!L.slug||!TIERS.includes(L.tier))throw bad('The license key is incomplete');
  return{...L,token:t};
}
export async function admit({tok,slug,origin,all,pub=PUB,now=Date.now(),want}={}){
  const p=partnerOf(all,slug);
  if(!p)throw bad('Unknown partner');
  const L=await verifyKey(tok,pub,now);
  if(L.slug!==p.slug)throw bad('This license is for a different partner');
  const origins=Array.isArray(L.origins)&&L.origins.length?L.origins:p.origins;
  if(origin&&!originOk({origins},origin))throw bad('This origin is not licensed for '+p.name);
  const tier=clampTier(want,L.tier);
  return{partner:p,lic:{slug:L.slug,tier:L.tier,exp:L.exp,iat:L.iat,origins},tier,origins};
}
export async function signKey(priv,payload){
  const body=b64(te(JSON.stringify(payload))),msg=te('AMNISITE1.'+body);
  const pk=typeof priv==='string'?unb(priv):priv;
  const k=await crypto.subtle.importKey('pkcs8',pk,{name:'Ed25519'},false,['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign({name:'Ed25519'},k,msg));
  return'AMNISITE1.'+body+'.'+b64(sig);
}
export{PUB,b64,unb,TIERS};
