const PH='(max-width:700px)',SM='(max-width:980px)',CO='(pointer:coarse)',RM='(prefers-reduced-motion:reduce)',mq=q=>matchMedia(q).matches,LP=520,SLOP=9,NX=':not(#m-x):not(#m-y)';
export const phone=()=>mq(PH),small=()=>mq(SM),touch=()=>mq(CO),ios=()=>/iP(hone|ad|od)/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
const ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch{return null;}};
const WSI={part:'◆',form:'❂',asm:'⚙'},TBI={edit:'✎',ai:'✦',sim:'🧱',flow:'🌬',mold:'💉',draw:'📐',make:'💲',vault:'🗄',check:'✔'};
const CSS=`:root{--hdr:52px;--navh:0px}
.m-only,#m-tip{display:none!important}
.m-grab{display:none;position:sticky;top:0;z-index:4;height:30px;flex:none;align-items:center;justify-content:center;width:100%;background:var(--panel);cursor:grab;touch-action:none}
.m-grab::after{content:'';position:absolute;top:-7px;bottom:-7px;left:0;right:0}
.m-grab i{width:40px;height:5px;border-radius:3px;background:var(--line2)}
#m-tip.on{display:block!important;position:fixed;z-index:97;max-width:min(320px,calc(100vw - 28px));padding:7px 10px;border-radius:9px;background:var(--panel);color:var(--ink);border:1px solid var(--line2);box-shadow:var(--shadow);font-size:12.5px;line-height:1.35;pointer-events:none}
.m-scrim{position:fixed;inset:0;z-index:70;background:rgba(5,8,12,.45);opacity:0;transition:opacity .2s}
.m-scrim.on{opacity:1}
.m-sheet{position:fixed;left:0;right:0;bottom:0;z-index:71;height:var(--shh,57vh);max-height:calc(100dvh - 24px - env(safe-area-inset-top));display:flex;flex-direction:column;background:var(--panel);color:var(--ink);border:1px solid var(--line2);border-bottom:0;border-radius:17px 17px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.3);transform:translateY(104%);transition:transform .22s ease,height .22s ease;padding-bottom:env(safe-area-inset-bottom)}
.m-sheet.on{transform:none}
.m-sheet>.m-grab{display:flex;position:relative;border-radius:17px 17px 0 0}
.m-sh{display:flex;align-items:center;gap:7px;padding:0 7px 7px 14px;border-bottom:1px solid var(--line)}
.m-sh b{flex:1;font-size:15px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.m-sh .ib{width:44px;height:44px}
.m-sb{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:4px 14px 14px}
.m-g{display:flex;align-items:center;justify-content:space-between;width:100%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--mut);margin:12px 0 7px;min-height:24px;text-align:left}
button.m-g{min-height:44px;margin:7px 0 0;color:var(--ink2)}
button.m-g.on{color:var(--acc)}
.m-gl{font-size:11px;color:var(--mut);margin:7px 0 4px}
.m-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(77px,1fr));gap:7px}
.m-grid button{min-height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:12px;border:1px solid var(--line);background:var(--bg2);color:var(--ink2);font-size:11.5px;line-height:1.2;text-align:center;padding:7px 4px;overflow-wrap:anywhere}
.m-grid button .gi{font-size:20px;line-height:1;color:var(--acc)}
.m-grid button.cut .gi{color:var(--err)}
.m-grid button.on{border-color:var(--acc);background:var(--acc-soft);color:var(--ink)}
.m-list{display:grid;gap:2px}
.m-list button{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;width:100%;min-height:50px;padding:7px 10px;border-radius:10px;text-align:left;line-height:1.3;color:var(--ink)}
.m-list button small{color:var(--mut);font-size:11.5px}
.m-list button.on{background:var(--acc-soft)}
.m-list .m-row{flex-direction:row;align-items:center;justify-content:space-between}
.m-stat{font-size:12px;color:var(--mut);padding:4px 10px 0}
#m-space{height:44px;min-width:0;max-width:100%;display:flex;align-items:center;gap:7px;padding:0 12px;border-radius:12px;background:var(--panel2);border:1px solid var(--line);color:var(--ink);font-weight:700;white-space:nowrap;overflow:hidden}
#m-space .l{overflow:hidden;text-overflow:ellipsis}
#m-space small{color:var(--mut);font-weight:550;overflow:hidden;text-overflow:ellipsis}
.feat .acts button,.x{position:relative}
@media (hover:none) and (pointer:coarse){.feat .acts{display:flex}}
@media (pointer:coarse){
body{touch-action:manipulation}
button,.feat,#ribbon .cmd,#cv,.m-grab,.pal button,.chips button{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.okx,.x,.feat .acts button{min-width:44px;min-height:44px}
.x,.feat .acts button,.okx{width:44px;height:44px}
#phead .pi,.feat{min-height:44px}
.btn.sm{padding:0 12px}
.pal button{min-height:57px}
.prow{grid-template-columns:62px 1fr 64px 44px}
.ptrow{grid-template-columns:1fr 1fr 44px}
input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]),select,textarea{min-height:44px;font-size:max(17px,1em)!important}
button:not(.sw),[role=button]:not(.m-grab),[role=tab],[role=menuitem]{min-height:44px;min-width:44px}
select,summary{min-height:44px}
.brand{min-width:44px;min-height:44px;justify-content:center}
.seg{flex-wrap:wrap}.seg button{flex:1 0 auto}
input[type=checkbox],input[type=radio]{-webkit-appearance:none;appearance:none;width:44px;height:44px;margin:-10px;flex:none;cursor:pointer;border:0;border-radius:0;outline-offset:-10px;background:linear-gradient(var(--bg2),var(--bg2)) center/20px 20px no-repeat,linear-gradient(var(--line2),var(--line2)) center/24px 24px no-repeat}
input[type=checkbox]:checked{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/20px 20px no-repeat,linear-gradient(var(--acc),var(--acc)) center/24px 24px no-repeat}
input[type=radio]{background:radial-gradient(circle,var(--bg2) 0 9px,var(--line2) 10px 12px,transparent 12.5px)}
input[type=radio]:checked{background:radial-gradient(circle,var(--acc) 0 5px,var(--bg2) 5.5px 9px,var(--acc) 10px 12px,transparent 12.5px)}
input[type=checkbox]:disabled,input[type=radio]:disabled{opacity:.45}
input[type=range]{min-height:44px}
input[type=color]{min-width:44px;min-height:44px}
.sw{width:51px;height:31px;flex:none}.sw::after{width:27px;height:27px}.sw.on::after{left:22px}
.sw::before{content:'';position:absolute;top:-7px;bottom:-7px;left:-4px;right:-4px}
summary{display:flex;align-items:center;gap:7px}
.ctxm button,.ctxm .hd{font-size:14px}
#legend{font-size:12px}#legend .lab{font-size:11.5px}
}
@media (max-width:980px){
:root{--navh:calc(58px + env(safe-area-inset-bottom))}
.m-only{display:inline-flex!important}
#mob{height:var(--navh)!important;position:relative;z-index:22}
#mob button{min-width:44px}
#mob button span{font-size:18px}
body.form-mode #m-tools{display:none!important}
#m-file,#m-exp,#ui-menu,header .tb .sep,#b-pro,#b-theme,#b-help{display:none!important}
header{gap:7px!important;padding:0 7px!important;overflow:visible!important}
header .tb{margin-left:0}
#kstat{font-size:0!important;width:12px!important;height:12px!important;min-width:12px!important;max-width:12px!important;padding:0!important;border-radius:50%!important;border:0!important;background:var(--mut);flex:none!important}
#kstat.ok{background:var(--ok)}#kstat.busy{background:var(--warm);animation:mpulse 1.2s ease-in-out infinite}#kstat.err{background:var(--err)}
@keyframes mpulse{50%{opacity:.35}}
#toast{bottom:calc(var(--navh) + 14px);z-index:95}
.vtools{flex-wrap:nowrap!important;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;left:7px!important;right:7px!important;top:7px!important;max-width:none!important;width:auto!important;transform:none!important;pointer-events:auto!important;padding-bottom:4px}
.vtools::-webkit-scrollbar{display:none}
.vtools .grp{flex:none}
#left,#right{overflow-x:hidden}
.tab table,.sec table,#left table,#right table,dialog table,.card table{display:block;max-width:100%;overflow-x:auto}
#left pre,#right pre,dialog pre{max-width:100%;overflow-x:auto}
#left canvas,#right canvas,#left svg,#right svg,#left img,#right img{max-width:100%}
.ctxm{max-width:calc(100vw - 14px)}
}
@media (max-width:700px){
#ws,header .hr,.brand span{display:none!important}
#m-space{flex:1 1 auto}
#left${NX},#right${NX}{top:auto!important;left:0!important;right:0!important;bottom:var(--navh)!important;width:auto!important;height:var(--shh,57vh);max-height:calc(100dvh - var(--hdr) - var(--navh));transform:translateY(calc(100% + var(--navh) + 14px))!important;border:1px solid var(--line2)!important;border-bottom:0!important;border-radius:17px 17px 0 0;transition:transform .22s ease,height .22s ease;box-shadow:0 -10px 30px rgba(0,0,0,.28)}
body.showL #left${NX},body.showR #right${NX}{transform:none!important}
#left>.m-grab${NX},#right>.m-grab${NX}{display:flex!important}
#right .rtabs{top:30px;overflow-x:auto;scrollbar-width:none;flex-wrap:nowrap;padding:0 7px}
#right .rtabs::-webkit-scrollbar{display:none}
#right .rtabs button{flex:none;padding:7px 12px}
#pm .pmh{top:30px}
dialog[open]{display:flex;flex-direction:column;width:100%!important;max-width:100%!important;height:100%;max-height:100%!important;margin:0;border:0;border-radius:0;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
dialog .dh{flex:none}
dialog .db{flex:1;max-height:none!important;overflow:auto}
dialog .db [style*="min-width"]{min-width:0!important}
dialog .dh .ib{width:44px;height:44px}
.ctxm{position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;min-width:0!important;max-width:none!important;max-height:72dvh;overflow-y:auto;border-radius:17px 17px 0 0!important;padding:7px 7px calc(7px + env(safe-area-inset-bottom))!important;z-index:72!important;box-shadow:0 -10px 30px rgba(0,0,0,.3)!important}
.ctxm button{min-height:48px}
.ctxm .bk{display:flex!important;color:var(--acc)}
#lookp{top:auto!important;left:0!important;right:0!important;bottom:0!important;width:auto!important;max-height:72dvh!important;border-radius:17px 17px 0 0!important;padding-bottom:calc(12px + env(safe-area-inset-bottom))!important}
#selinfo{max-width:calc(100% - 14px)!important}
#legend{top:72px!important}
body:has(#skx) #ribbon{display:none!important}
.gs-top{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none}.gs-top>*{flex:none}
.gs-main{grid-template-rows:minmax(300px,1.2fr) minmax(0,1fr)!important}
}
@media (min-width:701px) and (max-width:980px){
main{grid-template-columns:minmax(0,1fr) 340px!important}
#right${NX}{position:relative!important;top:auto!important;bottom:auto!important;width:auto!important;transform:none!important;box-shadow:none!important;grid-column:2;z-index:1}
body.m-rhide main{grid-template-columns:minmax(0,1fr) 0!important}
body.m-rhide #right${NX}{display:none!important}
#left${NX}{top:auto!important;bottom:var(--navh)!important;left:14px!important;width:min(420px,calc(100vw - 28px))!important;height:var(--shh,57vh);max-height:calc(100dvh - var(--hdr) - var(--navh));transform:translateY(calc(100% + var(--navh) + 14px))!important;border:1px solid var(--line2)!important;border-bottom:0!important;border-radius:17px 17px 0 0;transition:transform .22s ease,height .22s ease}
body.showL #left${NX}{transform:none!important}
#left>.m-grab${NX}{display:flex!important}
#pm .pmh{top:30px}
#right .rtabs{overflow-x:auto;scrollbar-width:none}
#right .rtabs button{flex:none;padding:7px 10px}
#fchip{top:72px!important}
.m-sheet{left:50%;right:auto;width:min(700px,calc(100vw - 28px));transform:translate(-50%,104%)}
.m-sheet.on{transform:translate(-50%,0)}
}
.m-drag{transition:none!important}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:1ms!important;animation-duration:1ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}`;
let A=null,cur=null,lp=null,tc=0,lastTap=null,ig=0;const sheets=new Set();
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],seen=b=>b&&(b.checkVisibility?b.checkVisibility():b.offsetParent!==null)&&getComputedStyle(b).display!=='none';
const hdr=()=>{const e=$('header');return e?Math.round(e.getBoundingClientRect().bottom):52;},navH=()=>{const e=$('#mob');return e&&getComputedStyle(e).display!=='none'?Math.round(e.getBoundingClientRect().height):0;};
const sync=()=>{document.body.classList.toggle('m-full',[...sheets].some(T=>T.isOpen()&&T.snap==='full'));A&&A.redraw();};
export function sheet(el,o={}){const h=A.h,g=h('div',{class:'m-grab',role:'button',tabindex:'0','aria-label':(o.label||'Panel')+': tap or drag to resize, swipe down to close'},h('i'));el.prepend(g);el.classList.add('m-sh-el');
  const T={el,g,snap:o.snap||'half',isOpen:o.isOpen||(()=>el.isConnected),close:o.close||(()=>el.remove()),label:o.label,was:false};
  const avail=()=>Math.max(220,innerHeight-(o.top?o.top():hdr())-(o.bottom?o.bottom():navH())),px=k=>{const a=avail();return k==='full'?a:k==='peek'?Math.max(170,Math.round(a*.3)):Math.round(a*.57);};
  T.set=k=>{T.snap=k;el.style.setProperty('--shh',px(k)+'px');el.dataset.snap=k;sync();return T;};T.px=px;
  let d=null;const start=y=>{d={y0:y,h0:el.getBoundingClientRect().height,ys:[[performance.now(),y]]};el.classList.add('m-drag');},move=y=>{if(!d)return;const t=performance.now();d.ys.push([t,y]);d.ys=d.ys.filter(q=>t-q[0]<120);el.style.setProperty('--shh',Math.max(70,Math.min(avail(),d.h0-(y-d.y0)))+'px');};
  const end=y=>{if(!d)return;const q=d.ys[0],dt=performance.now()-q[0],v=dt>0?(y-q[1])/dt:0,now=el.getBoundingClientRect().height,proj=now-v*110,moved=Math.abs(y-d.y0)>SLOP;el.classList.remove('m-drag');d=null;if(!moved)return T.set(T.snap==='full'?'half':'full');if(proj<px('peek')*.7)return T.close();T.set(['peek','half','full'].reduce((b,k)=>Math.abs(px(k)-proj)<Math.abs(px(b)-proj)?k:b,'half'));};
  g.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{g.setPointerCapture(e.pointerId);}catch{}start(e.clientY);});g.addEventListener('pointermove',e=>move(e.clientY));g.addEventListener('pointerup',e=>end(e.clientY));g.addEventListener('pointercancel',e=>end(e.clientY));
  g.addEventListener('keydown',e=>{const L=['peek','half','full'],i=L.indexOf(T.snap);e.key==='Enter'||e.key===' '?(e.preventDefault(),T.set(T.snap==='full'?'half':'full')):e.key==='Escape'?T.close():e.key==='ArrowUp'?(e.preventDefault(),T.set(L[Math.min(2,i+1)])):e.key==='ArrowDown'?(e.preventDefault(),i?T.set(L[i-1]):T.close()):0;});
  const top0=t=>{for(let n=t;n&&n!==el.parentElement;n=n.parentElement)if(n.scrollTop>0)return false;return true;};let ts=null;
  el.addEventListener('touchstart',e=>{const t=e.touches[0];ts=e.touches.length===1&&!e.target.closest('input,textarea,select,canvas,.m-grab,[contenteditable],.m-noswipe,input[type=range]')&&top0(e.target)?{x:t.clientX,y:t.clientY,on:false}:null;},{passive:true});
  el.addEventListener('touchmove',e=>{if(!ts)return;const t=e.touches[0],dy=t.clientY-ts.y,dx=t.clientX-ts.x;if(!ts.on)dy>14&&dy>Math.abs(dx)*1.4?(ts.on=true,start(t.clientY)):(Math.abs(dx)>14||dy<-7)&&(ts=null);if(ts&&ts.on&&e.cancelable){e.preventDefault();move(t.clientY);}},{passive:false});
  el.addEventListener('touchend',e=>{ts&&ts.on&&end(e.changedTouches[0].clientY);ts=null;});el.addEventListener('touchcancel',()=>{ts&&ts.on&&end(d?d.y0:0);ts=null;});
  sheets.add(T);T.set(T.snap);return T;}
export function closeSheet(){const c=cur;if(!c)return;cur=null;sheets.delete(c.T);c.el.classList.remove('on');c.scrim.classList.remove('on');setTimeout(()=>{c.el.remove();c.scrim.remove();},mq(RM)?0:230);sync();c.back&&c.back.focus&&c.back.focus({preventScroll:true});}
export function openSheet(title,body,o={}){closeSheet();const h=A.h,back=document.activeElement,scrim=h('div',{class:'m-scrim',onclick:closeSheet}),el=h('div',{class:'m-sheet',role:'dialog','aria-modal':'true','aria-label':title,id:o.id||null},h('div',{class:'m-sh'},h('b',null,title),h('button',{class:'ib','aria-label':'Close',onclick:closeSheet},'✕')),h('div',{class:'m-sb'},body));document.body.append(scrim,el);const T=sheet(el,{label:title,close:closeSheet,isOpen:()=>el.isConnected,top:()=>24,bottom:()=>0,snap:o.snap||'half'});cur={el,scrim,T,back};requestAnimationFrame(()=>{el.classList.add('on');scrim.classList.add('on');const f=el.querySelector('.m-sb button,.m-sb input');(f||el.querySelector('.m-sh .ib')).focus({preventScroll:true});});return el;}
const proxy=(b,extra)=>A.h('button',{class:(b.classList.contains('on')?'on':'')+(extra?' '+extra:''),onclick:()=>{closeSheet();b.click();}},...[...b.childNodes].map(n=>n.cloneNode(true)));
export function spaces(){const h=A.h,ws=$$('#ws button[data-ws]'),tabs=$$('#right .rtabs button[data-tab]').filter(seen),pro=$('#b-pro');openSheet('Workspaces',[h('div',{class:'m-g'},'Workspaces'),h('div',{class:'m-grid'},...ws.map(b=>h('button',{class:b.classList.contains('on')?'on':'','data-ws':b.dataset.ws,title:b.title||null,onclick:()=>{closeSheet();b.click();}},h('span',{class:'gi','aria-hidden':'true'},WSI[b.dataset.ws]||'◇'),b.textContent.trim()))),tabs.length?[h('div',{class:'m-g'},'Panels'),h('div',{class:'m-grid'},...tabs.map(b=>h('button',{class:b.classList.contains('on')?'on':'','data-tab':b.dataset.tab,onclick:()=>{closeSheet();A.setTab(b.dataset.tab);A.showPanel('R');}},h('span',{class:'gi','aria-hidden':'true'},TBI[b.dataset.tab]||'▣'),b.textContent.trim())))]:null,pro?[h('div',{class:'m-g'},'Account'),h('div',{class:'m-grid'},h('button',{'data-pro':'1',onclick:()=>{closeSheet();pro.click();}},h('span',{class:'gi','aria-hidden':'true'},'★'),pro.textContent.trim()))]:null],{id:'m-spaces'});}
export function more(){const h=A.h,grp=(t,sel)=>{const L=$$(sel).filter(b=>getComputedStyle(b).display!=='none');return L.length?[h('div',{class:'m-g'},t),h('div',{class:'m-list'},...L.map(b=>proxy(b)))]:null;},full=ls('amnicad.m.full')==='1',sw=h('span',{class:'sw'+(full?' on':''),'aria-hidden':'true'});
  openSheet('More',[h('div',{class:'m-stat',role:'status'},($('#kstat')||{}).textContent||''),grp('File','#m-file .pop button'),grp('Export','#m-exp .pop button'),grp('Interface','#ui-menu .pop button'),h('div',{class:'m-g'},'App'),h('div',{class:'m-list'},h('button',{onclick:()=>{closeSheet();$('#b-theme').click();}},'Light or dark theme',h('small',null,'Switch the color theme')),h('button',{class:'m-row',role:'switch','aria-checked':String(full),onclick:e=>{const on=ls('amnicad.m.full')!=='1';ls('amnicad.m.full',on?'1':null);sw.classList.toggle('on',on);e.currentTarget.setAttribute('aria-checked',String(on));A.toast(on?'Studies run at full resolution (slower, more memory)':'Studies on phones run a faster lower-resolution preview');}},h('span',null,'Full-resolution studies',h('br'),h('small',null,'Off: faster phone previews')),sw),h('button',{onclick:()=>{closeSheet();$('#b-help').click();}},'Help',h('small',null,'How Amni-CAD works')),$('#b-pro')?h('button',{onclick:()=>{closeSheet();$('#b-pro').click();}},'Amni-CAD Pro',h('small',null,$('#b-pro').classList.contains('on')?'Active':'Licenses and features')):null)],{id:'m-more',snap:'full'});}
export function tools(){const h=A.h,R=A.ui&&A.ui.ribbon?A.ui.ribbon():[],t=A.ui&&A.ui.tab||0;if(!R.length){A.showPanel('L');return;}const el=openSheet('Tools',R.map(([n,groups],i)=>h('section',{'data-i':i},h('button',{class:'m-g'+(i===t?' on':''),onclick:()=>{closeSheet();A.ui.pick&&A.ui.pick(i);}},n,h('span',{'aria-hidden':'true'},'›')),...groups.map(([g,cmds])=>[h('div',{class:'m-gl'},g),h('div',{class:'m-grid'},...cmds.map(c=>h('button',{class:c.cut?'cut':'','data-cmd':c.id,onclick:()=>{closeSheet();c.run();}},h('span',{class:'gi','aria-hidden':'true'},c.icon),c.label)))]))),{id:'m-tools-sheet',snap:'full'});requestAnimationFrame(()=>{const s=el.querySelector('[data-i="'+t+'"]');s&&t&&s.scrollIntoView({block:'start'});});}
export function registry(){const r=A&&A.ui&&A.ui.ribbon?A.ui.ribbon():[];return{ws:$$('#ws button[data-ws]').map(b=>({id:b.dataset.ws,label:b.textContent.trim()})),tabs:$$('#right .rtabs button[data-tab]').map(b=>({id:b.dataset.tab,label:b.textContent.trim()})),ribbon:r.map(([n,g,p])=>({name:n,panel:p||null,groups:g.map(([gn,c])=>({name:gn,cmds:c.map(x=>({id:x.id,label:x.label}))}))}))};}
const paused=()=>phone()&&(document.body.classList.contains('m-full')||!!($('#dlg')||{}).open||!!$('#skx')||!!$('.gs'));
const fit=()=>{const b=$('#g-view [data-v=fit]');b?b.click():A.view(A.lastView());};
function label(){const ws=$('#ws button.on'),tb=$('#right .rtabs button.on'),tabOn=tb&&seen($('#right .rtabs')),sp=$('#m-space'),pb=$('#mob [data-m=R]');sp&&(sp.firstChild.textContent=ws?ws.textContent.trim():'Part',sp.children[1].textContent=tabOn?tb.textContent.trim():'',sp.setAttribute('aria-label','Workspace: '+(ws?ws.textContent.trim():'Part')+(tabOn?', panel: '+tb.textContent.trim():'')+'. Switch workspace or panel'));pb&&(pb.lastChild.textContent=tabOn?tb.textContent.trim():'Panel');}
function a11y(){for(const b of $$('button:not([aria-label]),[role=button]:not([aria-label])')){const t=(b.textContent||'').trim();if(!/[A-Za-z0-9]{2}/.test(t)&&(b.title||b.dataset.tip))b.setAttribute('aria-label',b.title||b.dataset.tip);}
  for(const i of $$('input:not([aria-label]):not([id]),textarea:not([aria-label]):not([id]),select:not([aria-label]):not([id])')){const l=i.closest('.fld,label,.prow');const t=i.placeholder||i.title||(l&&l.querySelector('label')&&l.querySelector('label').textContent)||'';t&&!i.closest('label')&&i.setAttribute('aria-label',t.trim());}
  for(const i of $$('input[type=number]:not([inputmode])'))i.setAttribute('inputmode',i.min!==''&&+i.min>=0?'decimal':'text');
  for(const i of $$('.ex input:not([autocapitalize]),.prow input:not([autocapitalize]),.shape input:not([autocapitalize]),.ptrow input:not([autocapitalize])')){i.setAttribute('autocapitalize','off');i.setAttribute('autocomplete','off');i.setAttribute('autocorrect','off');i.setAttribute('spellcheck','false');}
  for(const t of $$('#ai-in:not([enterkeyhint]),.compose textarea:not([enterkeyhint])'))t.setAttribute('enterkeyhint','send');}
function tip(t,r){const e=$('#m-tip');e.textContent=t;e.classList.add('on');const w=e.offsetWidth,hh=e.offsetHeight;e.style.left=Math.max(7,Math.min(innerWidth-w-7,r.left+r.width/2-w/2))+'px';e.style.top=(r.top-hh-10<7?r.bottom+10:r.top-hh-10)+'px';clearTimeout(tip.t);tip.t=setTimeout(()=>e.classList.remove('on'),2700);}
function gestures(){const cv=A.renderer.domElement,TXT='input,textarea,select,[contenteditable],[contenteditable] *',stop=()=>{lp&&clearTimeout(lp.t);lp=null;};
  const fire=()=>{const L=lp;if(!L)return;L.fired=true;const ev=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:L.x,clientY:L.y,button:2,view:window});ev.touchLong=true;L.tg===cv&&(A.controls.enabled=false,L.ctl=true);const done=!L.tg.dispatchEvent(ev);if(!done){const t=L.tg.closest('[title],[aria-label],[data-tip]');t&&t!==cv&&tip(t.dataset.tip||t.title||t.getAttribute('aria-label'),t.getBoundingClientRect());}navigator.vibrate&&navigator.vibrate(7);};
  document.addEventListener('pointerdown',e=>{$('#m-tip').classList.remove('on');if(e.pointerType!=='touch')return;tc++;if(tc>1){stop();lastTap=null;return;}if(e.target.closest(TXT))return;lp={x:e.clientX,y:e.clientY,t0:performance.now(),tg:e.target,id:e.pointerId,t:setTimeout(fire,LP)};},true);
  document.addEventListener('pointermove',e=>{lp&&e.pointerId===lp.id&&!lp.fired&&Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>SLOP&&(clearTimeout(lp.t),lp.moved=true);},true);
  const up=e=>{if(e.pointerType!=='touch')return;tc=Math.max(0,tc-1);const L=lp;if(!L||e.pointerId!==L.id)return;clearTimeout(L.t);lp=null;L.ctl&&setTimeout(()=>{A.controls.enabled=true;},0);if(L.fired){const k=ev=>{ev.preventDefault();ev.stopPropagation();};addEventListener('click',k,true);setTimeout(()=>removeEventListener('click',k,true),400);return;}
    if(e.type!=='pointerup'||L.moved||L.tg!==cv||tc||performance.now()-L.t0>350||A.S.sketcher)return;const now=performance.now();lastTap&&now-lastTap.t<330&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<34?(lastTap=null,fit()):(lastTap={t:now,x:e.clientX,y:e.clientY});};
  document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',up,true);
  document.addEventListener('contextmenu',e=>{e.isTrusted&&performance.now()-ig<1500&&!e.target.closest(TXT)&&(e.preventDefault(),e.stopImmediatePropagation(),lp&&!lp.fired&&(clearTimeout(lp.t),fire()));},true);
  document.addEventListener('touchstart',()=>{ig=performance.now();},{capture:true,passive:true});}
function perf(){const R=A.renderer,base=()=>Math.min(devicePixelRatio||1,2);let pr=base(),on=false,ts=[],raf=0,idle=0;const setPR=v=>{if(Math.abs(R.getPixelRatio()-v)<.01)return;R.setPixelRatio(v);A.redraw();},tick=t=>{if(!on)return;ts.push(t);ts.length>12&&ts.shift();if(ts.length>=12){const dt=(ts[11]-ts[0])/11;dt>40&&pr>1?(pr=Math.max(1,+(pr*.75).toFixed(2)),setPR(pr),ts=[]):0;}raf=requestAnimationFrame(tick);};
  A.controls.addEventListener('start',()=>{if(!touch()&&!small())return;clearTimeout(idle);on=true;ts=[];cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);});
  A.controls.addEventListener('end',()=>{on=false;cancelAnimationFrame(raf);clearTimeout(idle);idle=setTimeout(()=>{pr=base();setPR(pr);},700);});
  document.addEventListener('visibilitychange',()=>{document.hidden||A.redraw();});}
function files(){const H=A.hooks,save=(blob,name)=>{const a=A.h('a',{href:URL.createObjectURL(ios()?new Blob([blob],{type:'application/octet-stream'}):blob),download:name,rel:'noopener'});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);};
  H.download=(blob,name)=>{if(!touch()&&!ios())return false;const f=new File([blob],name,{type:blob.type||'application/octet-stream'});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:name}).catch(e=>e&&e.name==='AbortError'||save(blob,name));return true;}save(blob,name);return true;};
  H.accept=a=>!touch()&&!ios()?a:ios()?'':a+(/json|amnicad/.test(a)?',application/json':'')+',application/octet-stream';}
function cap(){const mem=()=>navigator.deviceMemory||(touch()?4:8),CAP={fea:[.4,20000],flow:[.35,300000],mold:[.7,0]};
  A.hooks.cap=(k,n)=>{const c=CAP[k];if(!c||!(n>0))return n;const mc=c[1]?Math.round(c[1]*mem()):Infinity,full=ls('amnicad.m.full')==='1',pv=phone()&&!full?Math.max(1,Math.round(n*c[0])):n,v=Math.min(pv,mc);v<n&&A.toast(v<pv?'Limited to '+v.toLocaleString('en-US')+' cells to fit this device\'s memory (about '+mem()+' GB).':'Phone preview at about '+Math.round(v/n*100)+' % resolution. Turn on Full-resolution studies in the ⋯ menu for final results.',5200);return v;};}
export function init(api){if(A)return A.mobile;A=api;const h=A.h,H=A.hooks,b=document.body;document.head.append(h('style',{id:'m-css'},CSS));b.append(h('div',{id:'m-tip',role:'tooltip'}));
  const brand=$('header .brand');brand&&brand.after(h('button',{id:'m-space',class:'m-only','aria-haspopup':'dialog',onclick:spaces},h('span',{class:'l'},'Part'),h('small'),h('span',{'aria-hidden':'true'},'▾')));
  $('header').append(h('button',{id:'m-more',class:'ib m-only','aria-label':'More: file, export, layout, theme and help','aria-haspopup':'dialog',onclick:more},'⋯'));
  const mob=$('#mob');mob&&(mob.setAttribute('aria-label','Panels'),$('#mob [data-m=L]').after(h('button',{id:'m-tools','data-m':'T','aria-haspopup':'dialog',onclick:tools},h('span',{'aria-hidden':'true'},'⚒'),'Tools')),$$('#mob button span').forEach(s=>s.setAttribute('aria-hidden','true')));
  const pb=$('#mob [data-m=R]');pb&&pb.addEventListener('click',e=>{if(phone()||!small())return;e.stopImmediatePropagation();b.classList.toggle('m-rhide');pb.classList.toggle('on',!b.classList.contains('m-rhide'));setTimeout(()=>dispatchEvent(new Event('resize')),30);},true);
  const L=sheet($('#left'),{label:'Design panel',isOpen:()=>b.classList.contains('showL')&&small(),close:()=>A.showPanel('V')}),Rt=sheet($('#right'),{label:'Panel',isOpen:()=>b.classList.contains('showR')&&phone(),close:()=>A.showPanel('V')});
  let pmBy=false;new MutationObserver(()=>{for(const T of[L,Rt]){const o=T.isOpen();o&&!T.was&&T.set('half');T.was=o;}const pm=b.classList.contains('pm-on');pm&&!b.classList.contains('showL')&&small()&&!pmBy&&!$('#skx')?(pmBy=true,A.showPanel('L')):!pm&&pmBy&&(pmBy=false,b.classList.contains('showL')&&A.showPanel('V'));sync();label();}).observe(b,{attributes:true,attributeFilter:['class']});
  let skO=false;new MutationObserver(()=>{const k=!!$('#skx');k&&!skO&&small()&&A.showPanel('V');skO=k;sync();}).observe($('#vp'),{childList:true});const rt=$('#right .rtabs');rt&&new MutationObserver(label).observe(rt,{attributes:true,subtree:true,attributeFilter:['class','style']});const ws=$('#ws');ws&&new MutationObserver(label).observe(ws,{attributes:true,subtree:true,attributeFilter:['class']});
  H.vpTap=()=>{for(const T of[L,Rt])T.isOpen()&&T.snap!=='peek'&&T.set('peek');return true;};H.paused=paused;
  addEventListener('keydown',e=>{e.key==='Escape'&&cur&&(e.preventDefault(),e.stopImmediatePropagation(),closeSheet());},true);
  const vars=()=>{document.documentElement.style.setProperty('--hdr',hdr()+'px');for(const T of sheets)T.isOpen()&&T.set(T.snap);};addEventListener('resize',vars);new ResizeObserver(vars).observe($('header'));
  let qa=0;new MutationObserver(()=>{qa||(qa=setTimeout(()=>{qa=0;a11y();},250));}).observe(b,{childList:true,subtree:true});
  gestures();perf();files();cap();a11y();label();vars();
  return A.mobile={registry,sheet,openSheet,closeSheet,tools,spaces,more,phone,small,touch,fit,state:()=>({phone:phone(),small:small(),touch:touch(),sheets:[...sheets].map(T=>({id:T.el.id||T.label,open:T.isOpen(),snap:T.snap,h:Math.round(T.el.getBoundingClientRect().height)})),pr:A.renderer.getPixelRatio(),paused:paused()})};}
