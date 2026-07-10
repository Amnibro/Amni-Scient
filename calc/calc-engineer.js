(function(){
var DIMX={length:{u:{mm:1,cm:10,m:1000,'µm':1e-3,'in':25.4,ft:304.8}},area:{u:{'mm²':1,'cm²':100,'m²':1e6,'in²':645.16,'ft²':92903.04}},pressure:{u:{Pa:1e-6,kPa:1e-3,MPa:1,GPa:1e3,bar:0.1,psi:0.00689475729316836,ksi:6.89475729316836}},force:{u:{N:1,kN:1e3,lbf:4.4482216152605,kip:4448.2216152605}},torque:{u:{'N·m':1,'N·mm':1e-3,'kN·m':1e3,'lbf·ft':1.3558179483314004,'lbf·in':0.11298482902761671}},power:{u:{W:1,kW:1e3,MW:1e6,hp:745.6998715822702,'BTU/h':0.2930710701722222}},velocity:{u:{'m/s':1,'km/h':1/3.6,'ft/s':0.3048,mph:0.44704}},mass:{u:{kg:1,g:1e-3,t:1e3,lb:0.45359237,oz:0.028349523125}},flow:{u:{'m³/s':1,'m³/hr':1/3600,'m³/h':1/3600,'L/s':1e-3,'L/min':1/60000,gpm:6.30901964e-5,cfm:4.719474432e-4}},inertia:{u:{'mm⁴':1,'cm⁴':1e4,'in⁴':416231.4256}},smod:{u:{'mm³':1,'cm³':1e3,'in³':16387.064}},temp:{u:{'°C':1,'°F':1,K:1}}};
var TOK={};for(var _d in DIMX)for(var _u in DIMX[_d].u)TOK[_u]=TOK[_u]||_d;
var IMP={mm:'in',cm:'in','µm':'in',m:'ft','mm²':'in²','cm²':'in²','m²':'ft²',Pa:'psi',kPa:'psi',MPa:'psi',GPa:'ksi',bar:'psi',N:'lbf',kN:'lbf','N·m':'lbf·ft','N·mm':'lbf·in','kN·m':'lbf·ft',W:'BTU/h',kW:'hp',MW:'hp','m/s':'ft/s','km/h':'mph',kg:'lb',g:'oz',t:'lb','m³/s':'gpm','m³/hr':'gpm','m³/h':'gpm','L/s':'gpm','L/min':'gpm','mm⁴':'in⁴','cm⁴':'in⁴','mm³':'in³','cm³':'in³','°C':'°F',K:'°F'};
function tconv(v,f,t){var c=f==='°C'?v:f==='°F'?(v-32)*5/9:v-273.15;return t==='°C'?c:t==='°F'?c*9/5+32:c+273.15}
function conv(n,f,t){if(f===t||!isFinite(n))return n;var d=TOK[f];return d==null||TOK[t]!==d?n:d==='temp'?tconv(n,f,t):n*DIMX[d].u[f]/DIMX[d].u[t]}
function fmt(n){if(!isFinite(n))return String(n);var a=Math.abs(n);return a!==0&&(a>=1e5||a<1e-3)?n.toExponential(3):String(parseFloat(n.toPrecision(6)))}
var RX=/^(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:\s+(\S[^]*))?$/i;
function parseVal(s){s=String(s).trim();var m=RX.exec(s);if(!m)return null;var num=m[1],u=m[2]?m[2].trim():null,dm=/\.(\d+)/.exec(num),ex=/e([+-]?\d+)/i.exec(num),q=0.5*Math.pow(10,(ex?+ex[1]:0)-(dm?dm[1].length:0));return{n:parseFloat(num),u:u,dim:u?TOK[u]||null:null,q:q}}
function stepUp(n,u){return u==='psi'&&Math.abs(n)>=1e3?'ksi':u==='lbf'&&Math.abs(n)>=1e4?'kip':u}
function solveFor(set,get,t,x0,qf){
var lq=function(){return qf?Math.abs(qf())||0:0};
var f=function(x){set(x);var y=get();return typeof y==='number'&&isFinite(y)?y-t:NaN};
var okt=function(){return Math.abs(t)*2e-3+lq()*1.5+1e-12};
var a=isFinite(x0)&&x0!==0?x0:1,fa=f(a);
if(isFinite(fa)&&Math.abs(fa)<=okt())return{ok:true,x:a,y:fa+t};
var b=a*1.15,fb=f(b),i,c;
for(i=0;i<60&&isFinite(fb)&&fb!==fa;i++){c=b-fb*(b-a)/(fb-fa);if(!isFinite(c)||Math.abs(c)>1e15)break;a=b;fa=fb;b=c;fb=f(b);if(Math.abs(fb)<=Math.abs(t)*1e-9+lq()/4+1e-14)break}
if(isFinite(fb)&&Math.abs(fb)<=okt())return{ok:true,x:b,y:fb+t};
var m=Math.abs(x0)||1,lo=null,hi=null,sg,k,j,xx,fx,prev;
for(sg=x0<0?-1:1,k=0;k<2&&lo===null;k++,sg=-sg)for(prev=null,j=0;lo===null&&j<61;j++){xx=sg*m*Math.pow(10,(j-30)/10);fx=f(xx);if(!isFinite(fx)){prev=null;continue}if(prev&&prev.f*fx<=0){lo=Math.min(prev.x,xx);hi=Math.max(prev.x,xx)}else prev={x:xx,f:fx}}
if(lo===null){set(x0);return{ok:false,x:x0,y:NaN}}
var flo=f(lo),q2,mid,fm;
for(q2=0;q2<90;q2++){mid=(lo+hi)/2;fm=f(mid);if(!isFinite(fm))break;if(fm===0||Math.abs(hi-lo)<=Math.abs(mid)*1e-13){lo=mid;hi=mid;break}flo*fm<0?(hi=mid):(lo=mid,flo=fm)}
var xr=(lo+hi)/2,fr=f(xr);
if(isFinite(fr)&&Math.abs(fr)<=okt())return{ok:true,x:xr,y:fr+t};
set(x0);return{ok:false,x:x0,y:isFinite(fr)?fr+t:NaN}}
var API={DIMX:DIMX,TOK:TOK,IMP:IMP,conv:conv,tconv:tconv,fmt:fmt,parseVal:parseVal,stepUp:stepUp,solveFor:solveFor};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof window==='undefined'||typeof document==='undefined')return;
window.__ENG=API;
var LSP='calc-out-pref',MODE='si',PREF={};
function render(el){var bu=el.dataset.bu,bv=parseFloat(el.dataset.bv),d=TOK[bu],pref=PREF[d],tu=pref||(MODE==='imp'?IMP[bu]||bu:bu),n1;
if(!pref&&tu!==bu){n1=conv(bv,bu,tu);var su=stepUp(n1,tu);su!==tu&&(tu=su,n1=conv(bv,bu,tu))}else n1=tu===bu?bv:conv(bv,bu,tu);
var want=tu===bu?el.dataset.orig:fmt(n1)+' '+tu;
el.dataset.du=tu;el.textContent!==want&&(el.textContent=want)}
function scan(){document.querySelectorAll('.result-item .val').forEach(function(el){
if(el.children.length)return;
if(!el.dataset.bu){var p=parseVal(el.textContent);if(!p||!p.dim)return;
if(p.dim==='temp'){var lb=el.parentElement&&el.parentElement.querySelector('.lbl');if(lb&&lb.textContent.indexOf('Δ')>-1)return}
el.dataset.bu=p.u;el.dataset.bv=p.n;el.dataset.orig=el.textContent.trim();el.dataset.dim=p.dim;el.title='click to change units'}
render(el)})}
function wrapUsys(){var _us=window.__usys;window.__usys=function(s){_us&&_us(s);MODE=s==='imp'?'imp':'si';PREF={};try{localStorage.setItem(LSP,'{}')}catch(e){}scan()}}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function fieldLabel(inp){var l=inp.id?document.querySelector('label[for="'+(window.CSS&&CSS.escape?CSS.escape(inp.id):inp.id)+'"]'):null;if(l)return l.textContent.trim();var f=inp.closest('.field'),h=f&&f.querySelector('label');return h?h.textContent.trim():inp.id||'input'}
function calcName(btn){var m=/^\s*(calc\w+|solve\w+)\s*\(\s*\)/.exec(btn.getAttribute('onclick')||'');return m?m[1]:null}
function resScope(card,vw){var co=card.querySelector('.card-out');if(co)return co;var r=vw&&vw.id?document.getElementById(vw.id.slice(2)+'-results'):null;return r||card}
function readOut(scope,o){var items=scope.querySelectorAll('.result-item'),it=items[o.i]||null;
if(it&&it.querySelector('.lbl').textContent.trim()!==o.lbl)it=null;
if(!it)for(var k=0;k<items.length&&!it;k++)items[k].querySelector('.lbl').textContent.trim()===o.lbl&&(it=items[k]);
if(!it)return null;var vl=it.querySelector('.val');if(!vl||vl.children.length)return null;
var p=parseVal(vl.textContent);if(!p)return null;
var same=o.du&&p.u&&p.dim&&TOK[o.du]===p.dim;
var v2=same?conv(p.n,p.u,o.du):p.n,dq=same?Math.abs(conv(p.n+p.q,p.u,o.du)-v2):p.q;
return{v:v2,dq:dq,el:it}}
function runSolve(pn,card){var o=pn._outs[+pn.querySelector('.es-out').value],inp=document.getElementById(pn.querySelector('.es-in').value),t=parseFloat(pn.querySelector('.es-val').value),st=pn.querySelector('.es-st'),scope=pn._scope,fn=pn._fn;
if(!o||!inp||!isFinite(t)){st.textContent='enter a numeric target value first';return}
var lastQ=0;
var get=function(){try{window[fn]()}catch(e){return NaN}var r=readOut(scope,o);if(!r)return NaN;lastQ=r.dq;return r.v};
if(inp.tagName==='SELECT'){
var orig=inp.value,cands=[];
var setOpt=function(val){inp.value=val;if(typeof inp.onchange==='function')try{inp.onchange({target:inp});}catch(e){}};
for(var oi=0;oi<inp.options.length;oi++){setOpt(inp.options[oi].value);var y2=get();if(!isFinite(y2))continue;cands.push({e:Math.abs(y2-t),v:inp.options[oi].value,lbl:inp.options[oi].textContent.trim().replace(/\s*\(.*$/,''),y:y2})}
if(!cands.length){setOpt(orig);try{window[fn]()}catch(e){}st.textContent='✗ no option produces a numeric value for that output';return}
cands.sort(function(a,b){return a.e-b.e});
var best=cands[0];
setOpt(best.v);inp.dispatchEvent(new Event('change',{bubbles:true}));try{window[fn]()}catch(e){}
st.textContent='✓ closest option: '+best.lbl+'  →  '+o.lbl+' = '+fmt(best.y)+(o.du?' '+o.du:'')+(best.e>Math.max(Math.abs(t)*0.05,lastQ*2)?'  (nearest available — no exact match)':'')+(cands[1]?'   ·   runners-up: '+cands.slice(1,3).map(function(c){return c.lbl+' → '+fmt(c.y)}).join(',  '):'');
var rs=readOut(scope,o);rs&&rs.el&&(rs.el.classList.add('eng-flash'),setTimeout(function(){rs.el.classList.remove('eng-flash')},1500));
return}
var x0=parseFloat(inp.value)||0;
var set=function(x){inp.value=x};
var res=solveFor(set,get,t,x0,function(){return lastQ});
if(res.ok){inp.value=fmt(res.x);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));try{window[fn]()}catch(e){}
st.textContent='✓ '+fieldLabel(inp)+' = '+fmt(res.x)+'  →  '+o.lbl+' = '+fmt(res.y)+(o.du?' '+o.du:'');
var r2=readOut(scope,o);r2&&r2.el&&(r2.el.classList.add('eng-flash'),setTimeout(function(){r2.el.classList.remove('eng-flash')},1500))}
else{inp.value=x0;try{window[fn]()}catch(e){}st.textContent='✗ no solution found — that output may not depend on this input, or the target is out of reach'}}
function freshOuts(scope){var outs=[];scope.querySelectorAll('.result-item').forEach(function(it,i){var vl=it.querySelector('.val');if(!vl||vl.children.length)return;var p=parseVal(vl.textContent);if(!p)return;outs.push({i:i,lbl:it.querySelector('.lbl').textContent.trim(),du:vl.dataset.du||p.u||''})});return outs}
function openSolve(btn,fn,card,vw){var pn=btn._engPanel;
if(pn){var opening=!pn.classList.contains('open');pn.classList.toggle('open');
if(opening){try{window[fn]()}catch(e){}scan();var no=freshOuts(pn._scope);no.length&&(pn._outs=no,pn.querySelector('.es-out').innerHTML=no.map(function(o,k){return'<option value="'+k+'">'+esc(o.lbl)+(o.du?' ('+esc(o.du)+')':'')+'</option>'}).join(''))}
return}
try{window[fn]()}catch(e){}
scan();
var scope=resScope(card,vw),outs=freshOuts(scope);
var elig=function(x){return x.id&&!x.closest('.eng-solve')&&!(x.tagName==='SELECT'&&(/-u$/.test(x.id)||x.classList.contains('u-sel')||x.options.length<2))};
var inps=[].slice.call(card.querySelectorAll('input[type="number"],select')).filter(elig);
inps.length||(inps=[].slice.call(vw.querySelectorAll('input[type="number"],select')).filter(elig));
if(!outs.length||!inps.length){btn.title='compute once first — no numeric outputs to target yet';return}
pn=document.createElement('div');pn.className='eng-solve open';
pn.innerHTML='<div class="row"><div class="field"><label>TARGET OUTPUT</label><select class="es-out">'+outs.map(function(o,k){return'<option value="'+k+'">'+esc(o.lbl)+(o.du?' ('+esc(o.du)+')':'')+'</option>'}).join('')+'</select></div><div class="field"><label>= VALUE</label><input type="number" class="es-val" step="any"></div><div class="field"><label>BY VARYING</label><select class="es-in">'+inps.map(function(x){return'<option value="'+esc(x.id)+'">'+esc(fieldLabel(x))+(x.tagName==='SELECT'?' ▾':'')+'</option>'}).join('')+'</select></div><button type="button" class="btn btn-sm es-go">SOLVE</button></div><div class="eng-note es-st">goal seek: pick an output, enter the value you need (in the unit shown), choose which input to adjust — ▾ marks dropdowns (every option is tried, closest wins)</div>';
card.appendChild(pn);btn._engPanel=pn;pn._outs=outs;pn._scope=scope;pn._fn=fn;
pn.querySelector('.es-go').onclick=function(){runSolve(pn,card)};
pn.querySelector('.es-val').addEventListener('keydown',function(e){e.key==='Enter'&&(e.preventDefault(),runSolve(pn,card))})}
function injectSolve(){document.querySelectorAll('.view button[onclick]').forEach(function(btn){
if(btn._engDone)return;btn._engDone=1;
var fn=calcName(btn);if(!fn||typeof window[fn]!=='function')return;
var card=btn.closest('.card'),vw=btn.closest('.view');if(!card||!vw)return;
if(!card.querySelectorAll('input[type="number"]').length&&!vw.querySelectorAll('input[type="number"]').length)return;
var b=document.createElement('button');b.type='button';b.className='btn btn-sm eng-solve-btn';b.textContent='⌖ SOLVE FOR';b.title='goal seek: find the input value that hits a target output';
b.onclick=function(){openSolve(b,fn,card,vw)};
btn.parentNode.insertBefore(b,btn.nextSibling)})}
var DESC={beam:'Loads + supports + section → reactions, shear/moment diagrams, deflection (Euler-Bernoulli superposition)',stress:'Stress tensor components → principal stresses, von Mises / Tresca, FoS against yield',section:'Shape dimensions or a drawn polygon → A, I, S, r — hands off to Beam / Shaft / Columns',bolts:'Grade + thread size + loads → preload, joint clamp, torque spec, pattern & tightening sequence',springs:'Wire/coil or disc dimensions → rate, stress, deflection — build series/parallel stacks & packs',seals:'Gland + cord + material → squeeze, fill, stretch, extrusion risk, material suitability',columns:'Length + section (r, A) + end condition → Euler/Johnson buckling load & FoS',shafts:'Torque + geometry → shear stress, twist, critical speed, key sizing',welds:'Weld size + loads → throat stress vs AISC allowables; eccentric groups via polar method',bearings:'Load + speed + bearing type → ISO 281 L10 life in Mrev, hours, years',gears:'Module + teeth + loads → geometry, ratios, Lewis bending stress with Barth Kv',fatigue:'Mean/alternating stress + Se → Goodman / Gerber / Soderberg safety factors; Marin Se builder',vibration:'m, k, c → natural frequency, damping ratio, isolator transmissibility, resonance check',fluids:'Pipe + flow + fluid → Reynolds, Moody friction, minor losses, pump head; Bernoulli',pumps:'Duty point → hydraulic & shaft power, NPSH margin, affinity scaling, specific speed',thermal:'Geometry + properties → conduction / convection / radiation, fins, h from Nu, transients',hx:'Temperatures + flows → LMTD (with F-factor) and ε-NTU exchanger sizing',pv:'Pressure + geometry → thin-wall / Lamé / ASME VIII-1 wall stress and required thickness',cycles:'Cycle parameters → Carnot / Otto / Diesel / Brayton efficiency, refrigeration COP',hvac:'Air states + loads → psychrometrics, cooling load, duct sizing',combustion:'Fuel composition → stoichiometric AFR, λ, adiabatic flame temperature, LHV',electrical:'V / I / R + phases → Ohm, AC power triangle, wire drop, RC/RL time constants',motors:'Power + speed + poles → torque, FLA, synchronous speed & slip, service factor',nec:'Load + run length → NEC 310.16 ampacity with derates, voltage drop by AWG',echem:'Electrode & cell parameters → Nernst, Tafel, Butler-Volmer, corrosion rate, Faraday mass',battery:'Cell specs + topology → pack V / Ah / Wh, runtime with Peukert, state of charge',materials:'Searchable database — ~190 metals, alloys and polymers with mechanical & thermal data',finishes:'Weighted requirements → ranked surface finish / coating recommendations',math:'Quadratics, cubics, linear systems, geometry and calculus utilities with shown work',equations:'Formula reference cards for every module',units:'Unit converter across all engineering dimensions',refs:'Standards and literature the calculators implement'};
function injectDesc(){document.querySelectorAll('.view').forEach(function(vw){
var nm=vw.id?vw.id.slice(2):'';if(!DESC[nm]||vw.querySelector('.mod-desc'))return;
var h2=vw.querySelector('h2');if(!h2||h2.parentElement!==vw)return;
var p=document.createElement('p');p.className='mod-desc';p.textContent=DESC[nm];
vw.insertBefore(p,h2.nextSibling)})}
function injectQuickNav(){document.querySelectorAll('.view').forEach(function(vw){
var cards=[].slice.call(vw.querySelectorAll('.card')).filter(function(c){return c.querySelector('h3')});
if(cards.length<3)return;
var row=vw.querySelector('.qn-row');if(row&&+row.dataset.n===cards.length)return;
row&&row.remove();row=document.createElement('div');row.className='qn-row';row.dataset.n=cards.length;
cards.forEach(function(cd){var t=cd.querySelector('h3').textContent.trim().replace(/\s+/g,' ');t.length>32&&(t=t.slice(0,30)+'…');var b=document.createElement('button');b.type='button';b.className='qn-chip';b.textContent=t;b.onclick=function(){cd.scrollIntoView({behavior:'smooth',block:'start'});cd.classList.add('eng-flash');setTimeout(function(){cd.classList.remove('eng-flash')},1200)};row.appendChild(b)});
if(window.IntersectionObserver){row._io&&row._io.disconnect();var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var idx=cards.indexOf(en.target);idx<0||[].forEach.call(row.children,function(ch,k){ch.classList.toggle('qn-on',k===idx)})})},{root:vw,rootMargin:'-8% 0px -72% 0px'});cards.forEach(function(cd){io.observe(cd)});row._io=io}
var anc=vw.querySelector('.mod-desc')||vw.querySelector('h2');anc&&anc.parentElement===vw?vw.insertBefore(row,anc.nextSibling):vw.insertBefore(row,vw.firstChild)})}
var KW={};
function viewKw(name){var el=document.getElementById('v-'+name);if(!el)return'';var t=[];el.querySelectorAll('h2,h3,label').forEach(function(n){t.push(n.textContent)});return t.join(' ').toLowerCase()}
function injectFind(){if(document.getElementById('eng-find'))return;
var host=document.querySelector('.sidebar');if(!host)return;
var tabs=[].slice.call(host.querySelectorAll('.tab'));if(!tabs.length)return;
var box=document.createElement('div');box.className='side-find';box.innerHTML='<input id="eng-find" type="text" placeholder="⌕ FIND MODULE ( / )" aria-label="Filter modules" autocomplete="off">';
var ut=document.getElementById('units-toggle');
ut&&ut.parentElement===host?host.insertBefore(box,ut.nextSibling):host.insertBefore(box,host.firstChild);
var inp=box.firstChild;
var filter=function(){var q=inp.value.trim().toLowerCase();
tabs.forEach(function(tb){var nm=tb.dataset.v||'';KW[nm]==null&&(KW[nm]=(tb.textContent+' '+nm+' '+viewKw(nm)).toLowerCase());tb.style.display=!q||KW[nm].indexOf(q)>-1?'':'none'});
host.querySelectorAll('.sidebar-cat').forEach(function(c){var n=c.nextElementSibling,vis=false;while(n&&!n.classList.contains('sidebar-cat')){n.classList&&n.classList.contains('tab')&&n.style.display!=='none'&&(vis=true);n=n.nextElementSibling}c.style.display=vis?'':'none'})};
inp.addEventListener('input',filter);
inp.addEventListener('keydown',function(e){e.key==='Escape'?(inp.value='',filter(),inp.blur()):e.key==='Enter'&&(function(){var vis=tabs.filter(function(t){return t.style.display!=='none'});vis.length&&(vis[0].click(),inp.value='',filter(),inp.blur())})()});
document.addEventListener('keydown',function(e){var t=e.target,tg=t&&t.tagName;e.key==='/'&&tg!=='INPUT'&&tg!=='TEXTAREA'&&tg!=='SELECT'&&!(t&&t.isContentEditable)&&(e.preventDefault(),inp.focus())})}
function init(){
try{MODE=localStorage.getItem('calc-units-sys')==='imp'?'imp':'si'}catch(e){}
try{PREF=JSON.parse(localStorage.getItem(LSP)||'{}')||{}}catch(e){PREF={}}
wrapUsys();injectFind();injectDesc();injectQuickNav();injectSolve();scan();
document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('.result-item .val'):null;if(!el||!el.dataset.bu)return;var d=el.dataset.dim,us=Object.keys(DIMX[d].u).filter(function(u2){return u2!=='m³/h'&&u2!=='µm'}),cur=el.dataset.du||el.dataset.bu,nx=us[(us.indexOf(cur)+1)%us.length];PREF[d]=nx;try{localStorage.setItem(LSP,JSON.stringify(PREF))}catch(err){}scan()});
new MutationObserver(function(ms){for(var i2=0;i2<ms.length;i2++)if(ms[i2].addedNodes&&ms[i2].addedNodes.length){scan();return}}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',function(e){var tb=e.target&&e.target.closest?e.target.closest('.sidebar .tab'):null;tb&&setTimeout(function(){tb.scrollIntoView({block:'nearest'})},60);
var th=e.target&&e.target.closest?e.target.closest('.theme-toggle'):null;th&&setTimeout(function(){var vw=document.querySelector('.view.active'),bt=vw&&vw.querySelector('button[onclick]'),fn=bt&&calcName(bt);fn&&typeof window[fn]==='function'&&function(){try{window[fn]()}catch(err){}}()},120)});
setTimeout(function(){injectQuickNav();injectSolve();var at=document.querySelector('.sidebar .tab.active');at&&at.scrollIntoView({block:'nearest'})},1800);
setTimeout(function(){injectQuickNav();injectSolve()},3600)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
