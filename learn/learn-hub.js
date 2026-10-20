(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const CATS={},MODS=[],CSS=new Set();
let ov,stage,ttl,stat,cur=null,timers=[],closers=[],guard=null;
const L=()=>window._learnApi||{};
const lv=()=>+(document.body.dataset.lv||new URLSearchParams(location.search).get('level')||1);
const store=id=>({get:(k,d)=>{try{const v=localStorage.getItem('hub-'+id+'-'+k);return v===null?d:JSON.parse(v)}catch{return d}},set:(k,v)=>{try{localStorage.setItem('hub-'+id+'-'+k,JSON.stringify(v))}catch{}}});
let actx=null;
const audio=()=>{actx=actx||window.AmniSound&&AmniSound.ctx()||new (window.AudioContext||window.webkitAudioContext)();actx.state==='suspended'?actx.resume():0;return actx};
const SND=window.AmniSound,sfx=(n,o)=>SND?SND.sfx(n,o):false,note=(i,m,o)=>SND?SND.note(i,m,o):false;
const tone=(f,d=.3,type='sine',when=0,g=.2)=>{if(SND&&(!SND.on()||SND.note(f>=1200?'celesta':'marimba',Math.round(SND.midi(f)),{when,dur:d+.25,vel:Math.min(1,g*7)})))return;try{const c=audio(),t=c.currentTime+when,o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.01);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v).connect(c.destination);o.start(t);o.stop(t+d+.05)}catch{}};
const speak=t=>{try{L().speak?L().speak(t):(speechSynthesis.cancel(),speechSynthesis.speak(new SpeechSynthesisUtterance(t)))}catch{}};
const css=(id,text)=>{if(CSS.has(id))return;CSS.add(id);const s=document.createElement('style');s.id='hubcss-'+id;s.textContent=text;document.head.appendChild(s)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.random()*a.length|0];
function ensure(){
 if(ov)return;
 ov=document.createElement('div');ov.id='hub-overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
 ov.innerHTML='<div class="hub-shell"><div class="hub-head"><button class="hub-back" id="hub-back" aria-label="Back">← Back</button><div class="hub-title" id="hub-title"></div><div class="hub-stat" id="hub-stat" aria-live="polite"></div></div><div class="hub-stage" id="hub-stage"></div></div>';
 document.body.appendChild(ov);stage=$('#hub-stage');ttl=$('#hub-title');stat=$('#hub-stat');
 $('#hub-back').onclick=()=>guard&&guard()===false?0:(guard=null,history.state&&history.state.hub?history.back():close());
 document.addEventListener('keydown',e=>e.key==='Escape'&&ov.classList.contains('on')?($('#hub-back').click()):0);
 window.addEventListener('popstate',()=>ov.classList.contains('on')?(guard&&guard()===false?(history.state&&history.state.hub?0:history.pushState({hub:1},'')):close(true)):0);
}
function clear(){guard=null;timers.forEach(t=>{clearTimeout(t);clearInterval(t)});timers=[];closers.splice(0).forEach(f=>{try{f()}catch{}});try{L().stop&&L().stop()}catch{}}
function close(){if(!cur)return;clear();cur=null;ov.classList.remove('on');document.body.classList.remove('game-active','hub-open');stage.innerHTML=''}
function open(id){
 const m=MODS.find(x=>x.id===id);if(!m)return;ensure();clear();cur=m;
 ttl.textContent=m.title;stat.textContent='';stage.innerHTML='';stage.className='hub-stage hub-'+m.id;
 ov.classList.add('on');document.body.classList.add('game-active','hub-open');
 history.state&&history.state.hub?0:history.pushState({hub:1},'');
 const api={id:m.id,stage,level:lv(),grade:()=>window.AmniStd?AmniStd.grade(lv()):null,state:()=>window.AmniStd?AmniStd.state():'NY',
  title:t=>ttl.textContent=t,status:t=>stat.textContent=t,speak,stop:()=>{try{L().stop&&L().stop()}catch{}},
  score:p=>{try{L().score?L().score(p||10):0}catch{}},miss:()=>{try{L().miss&&L().miss()}catch{}},
  feedback:(msg,ok)=>{try{L().feedback?L().feedback(msg,ok===false?'#e74c3c':ok===true?'#2ecc71':'#3498db'):window._toast&&window._toast(msg)}catch{}},
  confetti:()=>{try{L().confetti&&L().confetti(innerWidth/2,innerHeight/3,70)}catch{}},
  store:store(m.id),audio,tone,sfx,note,css,esc,shuffle,pick,
  after:(ms,f)=>{const t=setTimeout(f,ms);timers.push(t);return t},every:(ms,f)=>{const t=setInterval(f,ms);timers.push(t);return t},
  onClose:f=>closers.push(f),onBeforeClose:f=>guard=f,close:()=>(guard=null,history.state&&history.state.hub?history.back():close()),
  html:h=>{stage.innerHTML=h;return stage},reopen:()=>open(m.id)};
 try{m.open(api)}catch(e){stage.innerHTML='<p class="hub-err">Sorry, this activity could not start.</p>';console.error(e)}
}
function card(m){const b=document.createElement('button');b.className='game-btn hub-game';b.dataset.hub=m.id;b.innerHTML=`<span class="btn-icon">${m.icon}</span><span class="btn-text">${esc(m.title)}</span><span class="btn-desc">${esc(m.desc||'')}</span>`+(m.isNew?'<span class="game-new-badge">NEW</span>':'');b.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();open(m.id)},true);return b}
function catEl(c){
 let s=$('#hubcat-'+c.id);if(s)return s;
 const g=$('#main-game-grid');if(!g)return null;
 s=document.createElement('section');s.className='game-category hub-cat';s.id='hubcat-'+c.id;
 s.innerHTML=`<h2 class="cat-header"><span class="cat-header-icon">${c.icon}</span> ${esc(c.title)}</h2><div class="cat-games"></div>`;
 c.top?g.insertBefore(s,g.querySelector(':scope > .game-category')):g.appendChild(s);return s;
}
function sync(){const L=String(lv());Object.values(CATS).forEach(c=>{const s=catEl(c);if(!s)return;let any=0;$$('.hub-game',s).forEach(b=>{const m=MODS.find(x=>x.id===b.dataset.hub),on=!m.levels||m.levels.includes(L);b.style.display=on?'':'none';any|=on});s.style.display=any?'':'none'})}
function mountMod(m){const s=catEl(CATS[m.cat]);s&&!$(`.hub-game[data-hub="${m.id}"]`)?$('.cat-games',s).appendChild(card(m)):0}
function mount(){if(!$('#main-game-grid'))return;MODS.forEach(mountMod);sync()}
const Hub={
 category(c){CATS[c.id]=Object.assign(CATS[c.id]||{},c);document.readyState!=='loading'?mount():0},
 register(m){MODS.push(m);document.readyState!=='loading'?mount():0},
 open,close,lv,mods:MODS,cats:CATS
};
window.AmniHub=Hub;
const boot=()=>{mount();new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-lv']});const q=new URLSearchParams(location.search).get('hub');q?setTimeout(()=>open(q),300):0};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0)):setTimeout(boot,0);
css('hub-core',`
#hub-overlay{position:fixed;inset:0;z-index:9000;display:none;background:var(--ui-bg,#0E1116);color:var(--ui-text,#EDF0F5);font-family:var(--ui-sans,system-ui,sans-serif);overflow:auto}
#hub-overlay.on{display:block}
body.hub-open{overflow:hidden}
.hub-shell{max-width:1100px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:0 16px 32px}
.hub-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:12px 0;background:var(--ui-bg,#0E1116);border-bottom:1px solid var(--ui-border,#2A303A)}
.hub-back{font:700 .95rem var(--ui-sans,system-ui);padding:10px 16px;min-height:44px;border-radius:999px;border:1px solid var(--ui-border,#2A303A);background:var(--ui-surface-2,#1E232B);color:inherit;cursor:pointer}
.hub-title{flex:1;font:800 clamp(1.1rem,3vw,1.5rem) var(--ui-sans,system-ui);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body.lv-kid .hub-title{font-family:var(--ui-round,var(--ui-sans))}
.hub-stat{font:700 .95rem var(--ui-sans,system-ui);color:var(--ui-muted,#A3ABBA);white-space:nowrap}
.hub-stage{flex:1;display:flex;flex-direction:column;align-items:center;gap:16px;padding-top:20px}
.hub-card{width:100%;background:var(--ui-surface,#161A21);border:1px solid var(--ui-border,#2A303A);border-radius:var(--ui-r-lg,20px);box-shadow:var(--ui-shadow,none);padding:clamp(16px,3vw,28px)}
.hub-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center}
.hub-grid{display:grid;gap:12px;width:100%;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))}
.hub-btn{font:700 1rem var(--ui-sans,system-ui);min-height:48px;padding:10px 20px;border-radius:999px;border:1px solid var(--ui-border,#2A303A);background:var(--ui-surface-2,#1E232B);color:inherit;cursor:pointer}
.hub-btn.primary{background:var(--lv,#38BDF8);border-color:var(--lv,#38BDF8);color:#0E1116}
body.light-mode .hub-btn.primary{color:#fff}
.hub-btn:disabled{opacity:.45;cursor:default}
.hub-choice{font:700 clamp(1.1rem,3.4vw,1.7rem) var(--ui-sans,system-ui);min-height:72px;padding:14px;border-radius:var(--ui-r,14px);border:2px solid var(--ui-border,#2A303A);background:var(--ui-surface,#161A21);color:inherit;cursor:pointer;box-shadow:0 3px 0 var(--ui-border,#2A303A)}
body.lv-kid .hub-choice{font-family:var(--ui-round,var(--ui-sans))}
.hub-choice.ok{border-color:var(--ui-ok,#22C55E);background:color-mix(in srgb,var(--ui-ok,#22C55E) 16%,transparent)}
.hub-choice.bad{border-color:var(--ui-bad,#EF4444);background:color-mix(in srgb,var(--ui-bad,#EF4444) 16%,transparent)}
@media (hover:hover){.hub-choice:not(:disabled):hover,.hub-btn:not(:disabled):hover{border-color:var(--lv,#38BDF8)}}
.hub-big{font:800 clamp(1.7rem,7vw,3.4rem)/1.15 var(--ui-sans,system-ui);text-align:center}
body.lv-kid .hub-big{font-family:var(--ui-round,var(--ui-sans))}
.hub-q{font:700 clamp(1.1rem,3.2vw,1.5rem)/1.4 var(--ui-sans,system-ui);text-align:center;max-width:46em}
.hub-muted{color:var(--ui-muted,#A3ABBA)}
.hub-tag{display:inline-block;font:700 .78rem var(--ui-sans,system-ui);padding:4px 10px;border-radius:999px;background:var(--ui-surface-2,#1E232B);border:1px solid var(--ui-border,#2A303A);color:var(--ui-muted,#A3ABBA)}
.hub-bar{width:100%;height:10px;border-radius:999px;background:var(--ui-surface-2,#1E232B);overflow:hidden}.hub-bar>i{display:block;height:100%;background:var(--lv,#38BDF8);transition:width .3s}
.hub-err{color:var(--ui-bad,#EF4444);font-weight:700}
html.a11y-rm #hub-overlay *{animation:none!important;transition:none!important}
`);
})();
