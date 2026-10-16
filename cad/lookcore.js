export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const rgb=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(h||'').trim());return m?[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)):null;};
export const hex=c=>'#'+c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
const hx=v=>rgb(v)?hex(rgb(v)):undefined,pair=a=>Array.isArray(a)&&a.length===2&&a.every(rgb)?a.map(hx):undefined,num=(v,a,b)=>typeof v==='number'&&isFinite(v)?clamp(v,a,b):undefined;
export const lum=c=>{const[r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};
export const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export const ink=c=>contrast(c,[255,255,255])>=contrast(c,[5,8,13])?'#ffffff':'#05080d';
const hsl=c=>{const[r,g,b]=c.map(v=>v/255),M=Math.max(r,g,b),m=Math.min(r,g,b),l=(M+m)/2,d=M-m,s=d?d/(1-Math.abs(2*l-1)):0,h=d?M===r?((g-b)/d+6)%6:M===g?(b-r)/d+2:(r-g)/d+4:0;return[h*60,s,l];};
const unhsl=([h,s,l])=>{const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return[f(0),f(8),f(4)].map(v=>v*255);};
export const flip=(c,toDark)=>{const[a,s,l]=hsl(rgb(c));return hex(unhsl([a,s*.85,toDark?clamp((.985-l)/.45,.03,.4):clamp(.985-l*.45,.7,.99)]));};
export const clean=o=>{o=o&&typeof o==='object'?o:{};const r={},set=(k,v)=>{v!==undefined&&(r[k]=v);};
  set('theme',['system','light','dark'].includes(o.theme)?o.theme:undefined);set('acc',hx(o.acc));set('bgm',['solid','grad'].includes(o.bgm)?o.bgm:undefined);set('bgd',pair(o.bgd));set('bgl',pair(o.bgl));set('auto',o.auto===0?0:undefined);set('gs',o.gs===0?0:undefined);set('gc',hx(o.gc));set('ga',num(o.ga,0,1));set('gm',num(o.gm,0,1e6)>0?num(o.gm,0,1e6):undefined);set('mo',o.mo===1?1:undefined);set('mc',hx(o.mc));set('ec',hx(o.ec));set('ev',o.ev===0?0:undefined);set('sc',hx(o.sc));set('dens',o.dens==='compact'?'compact':undefined);set('fs',num(o.fs,90,120));return r;};
export const bgOf=(L,dark)=>{const p=(dark?L.bgd:L.bgl)||(L.auto!==0&&(dark?L.bgl:L.bgd)&&(dark?L.bgl:L.bgd).map(c=>flip(c,dark)));return!L.bgm||!p?null:L.bgm==='solid'?p[0]:`linear-gradient(180deg,${p[0]},${p[1]})`;};
const KEYS=['--acc','--acc-ink','--acc-soft','--acc-hover','--vp','--fs'];
export function vars(L,dark,el){const o={},c=rgb(L.acc);c&&Object.assign(o,{'--acc':hex(c),'--acc-ink':ink(c),'--acc-soft':`rgba(${c.map(Math.round).join(',')},${dark?.15:.11})`,'--acc-hover':hex(mix(c,dark?[255,255,255]:[0,0,0],.16))});const bg=bgOf(L,dark);bg&&(o['--vp']=bg);L.fs&&L.fs!==100&&(o['--fs']=String(L.fs/100));for(const k of KEYS)o[k]?el.style.setProperty(k,o[k]):el.style.removeProperty(k);el.classList.toggle('look-compact',L.dens==='compact');}
