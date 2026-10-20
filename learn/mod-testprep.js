(function(){
'use strict';
const H=window.AmniHub;if(!H)return;
const BASE=((document.currentScript||{}).src||'').replace(/[^/]*$/,''),FILES=['testbank-ny.js','testbank-regents.js','testbank-states.js'],L='ABCDEFGH',KEYS=['7','8','9','⌫','4','5','6','/','1','2','3','.','−','0','␣','C'],KN={'⌫':'Delete','␣':'Space','C':'Clear','−':'Minus','/':'Fraction bar','.':'Decimal point'};
const ST={NY:'New York',FL:'Florida',TX:'Texas',MA:'Massachusetts',CA:'California'},SUB={math:['Math','➗'],ela:['ELA','📖'],science:['Science','🔬'],social:['Social Studies','🏛️']};
const LINKS=[['NY','NYSED Grades 3–8 English Language Arts released test questions','https://www.nysedregents.org/ei/ei-ela.html'],['NY','NYSED Grades 3–8 Mathematics released test questions','https://www.nysedregents.org/ei/ei-math.html'],['NY','NYS Grade 5 Elementary-level & Grade 8 Intermediate-level Science released questions','https://www.nysedregents.org/ei/ei-science.html'],['NY','NYSED Grades 3–8 tests home and archive (older Grade 4 & 8 science)','https://www.nysedregents.org/elementary-intermediate.html'],['NY','NYSED Regents exams (past exams, all subjects)','https://www.nysedregents.org/'],['TX','Texas STAAR released test questions','https://tea.texas.gov/data-reports/staar/staar-released-test-questions'],['FL','Florida B.E.S.T. assessments (FLDOE)','https://www.fldoe.org/accountability/assessments/k-12-student-assessment/best/'],['FL','Florida FAST & B.E.S.T. sample test materials (Students & Families portal)','https://flfast.org/families.html'],['MA','Massachusetts MCAS released items','https://www.doe.mass.edu/mcas/release.html'],['CA','California CAASPP practice and training tests','https://www.caaspp-elpac.org/resources/preparation/practice-and-training-tests']];
let ready=null;
const load=()=>ready=ready||Promise.all(FILES.map(f=>new Promise(r=>{const s=document.createElement('script');s.src=BASE+f;s.onload=s.onerror=()=>r();document.head.appendChild(s)})));
const val=s=>{const t=String(s==null?'':s).replace(/[−–]/g,'-').replace(/[$,%]/g,'').trim().replace(/\s+/g,' '),m=t.match(/^(-?)(\d+) (\d+)\/(\d+)$/),d=t.replace(/ /g,''),f=d.match(/^(-?(?:\d+\.?\d*|\.\d+))\/(\d+\.?\d*|\.\d+)$/);return m?(m[1]?-1:1)*(+m[2]+m[3]/m[4]):f?(+f[2]?f[1]/f[2]:NaN):/^-?(\d+\.?\d*|\.\d+)$/.test(d)?+d:NaN};
const right=(it,r)=>it.type==='multi'?Array.isArray(r)&&r.length===it.a.length&&it.a.every(x=>r.includes(x)):it.type==='num'?r!=null&&Math.abs(val(r)-val(it.a))<1e-7:r===it.a;
const has=r=>r!=null&&r!==''&&!(Array.isArray(r)&&!r.length);
const fmt=s=>(s=Math.max(0,s),`${s/60|0}:${String(s%60).padStart(2,'0')}`);
const CSS=`
.tp-wrap{width:100%;display:flex;flex-direction:column;gap:1rem}
.tp-wrap h2{margin:.3rem 0 .5rem;font:800 1.45rem/1.25 var(--ui-sans,system-ui);text-transform:none;letter-spacing:normal;text-align:left}
.tp-wrap h3,.tp-wrap h4{text-transform:none;letter-spacing:normal;font-family:var(--ui-sans,system-ui)}
.tp-wrap h3{margin:0 0 .5rem;font-size:1.12rem}
.tp-wrap :focus-visible{outline:3px solid var(--lv,#38BDF8);outline-offset:2px}
.tp-load{text-align:center;font-weight:700}
.tp-sws{display:flex;flex-wrap:wrap;gap:.75rem;margin:.75rem 0 .5rem}
.tp-sw{display:inline-flex;align-items:center;gap:.6rem;min-height:2.75rem;padding:.35rem 1rem .35rem .5rem;border-radius:999px;border:1px solid var(--ui-border,#2A303A);background:var(--ui-surface-2,#1E232B);color:inherit;font:700 .95rem var(--ui-sans,system-ui);cursor:pointer}
.tp-sw:disabled{opacity:.55;cursor:default}
.tp-sw i{flex:none;width:2.4rem;height:1.4rem;border-radius:999px;background:var(--ui-border,#2A303A);position:relative;transition:background .2s}
.tp-sw i::after{content:'';position:absolute;top:.2rem;left:.2rem;width:1rem;height:1rem;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3);transition:transform .2s}
.tp-sw[aria-pressed=true] i{background:var(--lv,#38BDF8)}
.tp-sw[aria-pressed=true] i::after{transform:translateX(1rem)}
.tp-gh{color:var(--ui-muted,#A3ABBA);font-size:1rem!important;text-transform:uppercase;letter-spacing:.05em;margin:.4rem 0 .7rem!important}
.tp-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),1fr))}
.tp-card{background:var(--ui-surface,#161A21);border:1px solid var(--ui-border,#2A303A);border-radius:var(--ui-r-lg,20px);padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.45rem}
.tp-ct{display:flex;gap:.75rem;align-items:flex-start}
.tp-ic{font-size:1.7rem;line-height:1.2}
.tp-card h4{margin:0 0 .35rem;font-size:1.05rem;line-height:1.3}
.tp-tags{display:flex;flex-wrap:wrap;gap:.35rem}
.tp-m{margin:0;color:var(--ui-muted,#A3ABBA);font-size:.9rem;line-height:1.45}
.tp-wrap a{color:inherit;text-decoration:underline;text-decoration-color:var(--lv,#38BDF8);text-decoration-thickness:2px;text-underline-offset:3px}
.tp-best{margin:.1rem 0 .3rem;font-weight:700;font-size:.92rem}
.tp-btns{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:auto}
.tp-btns .hub-btn{flex:1 1 7rem}
.tp-links ul{list-style:none;padding:0;margin:.5rem 0 0;display:grid;gap:.35rem}
.tp-links li{display:flex;gap:.7rem;align-items:center;min-height:2.75rem}
.tp-links li .hub-tag{flex:none;min-width:2.7rem;text-align:center}
.tp-links a{font-weight:700;padding:.45rem 0;line-height:1.35}
.tp-top{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .75rem}
.tp-qn{font-weight:800}
.tp-sp{flex:1}
.tp-timer{font:800 1.15rem var(--ui-sans,system-ui);font-variant-numeric:tabular-nums;padding:.3rem .8rem;border-radius:999px;background:var(--ui-surface-2,#1E232B);border:1px solid var(--ui-border,#2A303A)}
.tp-timer.low{color:var(--ui-bad,#EF4444);border-color:var(--ui-bad,#EF4444)}
.tp-x{min-height:2.75rem!important;padding:.4rem 1rem!important;font-size:.9rem!important}
.tp-body{display:flex;flex-direction:column;gap:1rem}
.tp-pass{display:flex;flex-direction:column;gap:.5rem}
.tp-ph{display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap}
.tp-ph h3{margin:0}
.tp-rd{min-height:2.75rem!important;padding:.4rem 1rem!important;font-size:.9rem!important}
.tp-ptext{max-height:42vh;overflow:auto;line-height:1.7;font-size:1.02rem;padding:.2rem .5rem .2rem 0}
.tp-ptext p{margin:0 0 .85rem}
.tp-sh{display:block;font-size:.85rem;letter-spacing:.06em;color:var(--ui-muted,#A3ABBA)}
@media (max-width:30rem){.tp-top .tp-m{display:none}}
.tp-cr{font-size:.8rem;color:var(--ui-muted,#A3ABBA);margin:0}
@media (min-width:56rem){.tp-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}.tp-split .tp-pass{position:sticky;top:5rem}.tp-split .tp-ptext{max-height:calc(100vh - 15rem)}}
.tp-qrow{display:flex;gap:.75rem;align-items:flex-start;margin-bottom:1rem}
.tp-q{flex:1;font:700 1.15rem/1.5 var(--ui-sans,system-ui);margin:0}
.tp-q:focus{outline:none}
.tp-say{flex:none;width:2.75rem;height:2.75rem;border-radius:50%;border:1px solid var(--ui-border,#2A303A);background:var(--ui-surface-2,#1E232B);color:inherit;font-size:1.1rem;cursor:pointer}
.tp-img{display:flex;justify-content:center;margin:0 0 1rem;color:var(--ui-text,#EDF0F5)}
.tp-img svg{max-width:100%;height:auto;max-height:17rem}
.tp-hint{margin:-.4rem 0 .7rem;font-size:.92rem;font-weight:700;color:var(--ui-muted,#A3ABBA)}
.tp-ch{display:grid;gap:.6rem}
.tp-c.hub-choice{display:flex;align-items:center;gap:.8rem;text-align:left;font:600 1.02rem/1.4 var(--ui-sans,system-ui);min-height:3.5rem;padding:.6rem .9rem;box-shadow:none;border-width:2px}
.tp-c b{flex:none;display:grid;place-items:center;width:2rem;height:2rem;border-radius:50%;border:2px solid var(--ui-border,#2A303A);font-size:.92rem}
.tp-c.multi b{border-radius:.45rem}
.tp-c.sel{border-color:var(--lv,#38BDF8);background:color-mix(in srgb,var(--lv,#38BDF8) 14%,transparent)}
.tp-c.sel b{background:var(--lv,#38BDF8);border-color:var(--lv,#38BDF8);color:#0E1116}
.tp-c:disabled{cursor:default}
.tp-c.ok b{background:var(--ui-ok,#22C55E);border-color:var(--ui-ok,#22C55E);color:#fff}
.tp-c.bad b{background:var(--ui-bad,#EF4444);border-color:var(--ui-bad,#EF4444);color:#fff}
.tp-num{display:flex;flex-direction:column;align-items:center;gap:.75rem}
.tp-disp{display:block;min-width:min(100%,14rem);min-height:3.4rem;padding:.5rem 1rem;border-radius:var(--ui-r,14px);border:2px solid var(--ui-border,#2A303A);background:var(--ui-surface-2,#1E232B);font:800 1.6rem/2.2rem var(--ui-sans,system-ui);text-align:center;font-variant-numeric:tabular-nums;white-space:pre}
.tp-disp.ok{border-color:var(--ui-ok,#22C55E)}
.tp-disp.bad{border-color:var(--ui-bad,#EF4444)}
.tp-pad{display:grid;grid-template-columns:repeat(4,3.5rem);gap:.45rem}
.tp-pad .hub-btn{padding:0;min-height:3rem;font-size:1.2rem;border-radius:var(--ui-r,14px)}
.tp-fb{margin-top:1rem;padding:.8rem 1rem;border-radius:var(--ui-r,14px);border:1px solid;line-height:1.5}
.tp-fb.ok{border-color:var(--ui-ok,#22C55E);background:color-mix(in srgb,var(--ui-ok,#22C55E) 12%,transparent)}
.tp-fb.bad{border-color:var(--ui-bad,#EF4444);background:color-mix(in srgb,var(--ui-bad,#EF4444) 10%,transparent)}
.tp-fb p{margin:.4rem 0 0}
.tp-nav{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:flex-end;margin-top:1rem}
.tp-flag[aria-pressed=true]{border-color:#F59E0B;background:color-mix(in srgb,#F59E0B 20%,transparent)}
.tp-dots,.tp-jump{display:flex;flex-wrap:wrap;gap:.4rem}
.tp-dots button{min-width:2.75rem;min-height:2.75rem;border-radius:.7rem;border:1px solid var(--ui-border,#2A303A);background:var(--ui-surface,#161A21);color:inherit;font:700 .9rem var(--ui-sans,system-ui);cursor:pointer;position:relative}
.tp-dots .ans{background:color-mix(in srgb,var(--lv,#38BDF8) 22%,var(--ui-surface,#161A21));border-color:var(--lv,#38BDF8)}
.tp-dots .cur{outline:3px solid var(--lv,#38BDF8);outline-offset:1px}
.tp-dots .fl::after{content:'⚑';position:absolute;top:-.45rem;right:-.3rem;font-size:.8rem;color:#F59E0B}
.tp-jump .hub-btn{min-width:3rem;padding:.4rem .8rem}
.tp-intro .tp-timer{display:inline-block}
.tp-rules{padding-left:1.2rem;line-height:1.6}
.tp-res{text-align:center}
.tp-res .tp-btns{justify-content:center;max-width:34rem;margin:1rem auto 0}
.tp-pct{font:800 3.4rem/1.1 var(--ui-sans,system-ui);color:var(--lv,#38BDF8)}
body.light-mode .tp-pct{color:var(--ui-text,#111)}
.tp-sum{font-weight:700;margin:.4rem 0}
.tp-std{list-style:none;padding:0;margin:.5rem 0 0;display:grid;gap:.55rem}
.tp-std li{display:grid;grid-template-columns:minmax(6.5rem,auto) 1fr 3rem;gap:.75rem;align-items:center;font-size:.92rem}
.tp-std .hub-bar{height:.7rem}
.tp-sd{font-weight:700;font-variant-numeric:tabular-nums}
.tp-rvl{list-style:none;padding:0;margin:.75rem 0 0;display:grid;gap:.75rem}
.tp-rv{border:1px solid var(--ui-border,#2A303A);border-left:.35rem solid var(--ui-ok,#22C55E);border-radius:var(--ui-r,14px);padding:.75rem 1rem;background:var(--ui-surface-2,#1E232B);line-height:1.5}
.tp-rv.bad{border-left-color:var(--ui-bad,#EF4444)}
.tp-rv p{margin:.35rem 0}
.tp-rh{display:flex;flex-wrap:wrap;gap:.4rem .6rem;align-items:center}
.tp-rq{font-weight:700}
.only-miss .tp-rv.ok{display:none}
`;
H.category({id:'testprep',icon:'📝',title:'Test Prep'});
H.register({id:'testprep',cat:'testprep',icon:'📝',title:'Test Prep',desc:'State-style practice & timed mock tests',levels:'3458',isNew:true,val,right,open(api){
 const {esc,store}=api,E=s=>esc(s==null?'':s).replace(/\n/g,'<br>'),$=s=>api.stage.querySelector(s),ov=()=>document.getElementById('hub-overlay')||{};let alive=1,keyH=null;
 const kd=e=>keyH&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!(/^(Enter| )$/.test(e.key)&&e.target.closest&&e.target.closest('button,a,summary,input,textarea'))?keyH(e):0;
 document.addEventListener('keydown',kd);api.onClose(()=>{alive=0;keyH=null;document.removeEventListener('keydown',kd)});
 api.css('testprep',CSS);
 const wire=m=>{const w=api.stage.firstElementChild;w?w.onclick=e=>{const b=e.target.closest('[data-a]');b&&!b.disabled&&m[b.dataset.a]?m[b.dataset.a](b):0}:0};
 const ansTxt=(it,r)=>!has(r)?'(no answer)':it.type==='num'?String(r):it.type==='multi'?r.slice().sort((x,y)=>x-y).map(k=>L[k]+'. '+it.choices[k]).join('; '):L[r]+'. '+it.choices[r];
 const picker=()=>{keyH=null;api.stop();api.title('Test Prep');api.status('');
  const st=api.state()||'NY',aS=store.get('allst',false),aG=store.get('allgr',false),all=(window.AmniTestBank||[]).filter(t=>t&&t.id&&Array.isArray(t.items)&&t.items.length),inS=all.filter(t=>aS||t.state===st),lv=String(api.level),mine=inS.filter(t=>String(t.levels||'').includes(lv)),list=aG||!mine.length?inS:mine,hist=store.get('hist',{}),gk=g=>g==='HS'?99:+g||50,groups=[...new Set(list.map(t=>String(t.grade)))].sort((a,b)=>gk(a)-gk(b)),sub=t=>SUB[t.subject]||[t.subject||'Test','📝'],links=LINKS.slice().sort((a,b)=>(b[0]===st)-(a[0]===st));
  const card=t=>{const h=hist[t.id]||[],b=h.length?Math.max(...h.map(x=>x.p)):null,s=sub(t);return `<article class="tp-card"><div class="tp-ct"><span class="tp-ic" aria-hidden="true">${s[1]}</span><div><h4>${E(t.test)}</h4><div class="tp-tags"><span class="hub-tag">${E(t.state)}</span><span class="hub-tag">${t.grade==='HS'?'High school':'Grade '+E(t.grade)}</span><span class="hub-tag">${E(s[0])}</span></div></div></div><p class="tp-m">⏱ ${+t.minutes||0} min · ${t.items.length} questions${t.passages?` · ${Object.keys(t.passages).length} passage${Object.keys(t.passages).length>1?'s':''}`:''}</p>${t.source?`<p class="tp-m">Source: ${t.source.url?`<a href="${esc(t.source.url)}" target="_blank" rel="noopener">${E(t.source.name)}</a>`:E(t.source.name)}</p>`:''}<p class="tp-best">${b==null?'Not tried yet':`🏅 Best ${b}% · ${h.length} ${h.length>1?'tries':'try'} · last ${h[0].p}% (${h[0].m==='mock'?'mock':'practice'})`}</p><div class="tp-btns"><button class="hub-btn" data-a="go" data-k="practice" data-id="${esc(t.id)}">Practice</button><button class="hub-btn primary" data-a="go" data-k="mock" data-id="${esc(t.id)}">Mock test</button></div></article>`};
  api.html(`<div class="tp-wrap"><div class="hub-card tp-hero"><h2>📝 Test Prep</h2><p class="tp-m">Original practice tests modeled on official state tests. <b>Practice</b> shows the answer and why after every question. <b>Mock test</b> is timed, lets you flag questions, and scores everything at the end.</p><div class="tp-sws"><button class="tp-sw" data-a="sw" data-k="allst" aria-pressed="${aS}"><i aria-hidden="true"></i>All states</button><button class="tp-sw" data-a="sw" data-k="allgr" aria-pressed="${aG||!mine.length}"${mine.length?'':' disabled'}><i aria-hidden="true"></i>All grades</button></div><p class="tp-m">Showing ${aS?'every state':esc(ST[st]||st)} · ${list.length} test${list.length===1?'':'s'}</p></div>${groups.map(g=>`<div><h3 class="tp-gh">${g==='HS'?'High school':'Grade '+esc(g)}</h3><div class="tp-grid">${list.filter(t=>String(t.grade)===g).sort((a,b)=>(b.state===st)-(a.state===st)||String(a.state).localeCompare(String(b.state))||String(a.subject).localeCompare(String(b.subject))).map(card).join('')}</div></div>`).join('')||`<div class="hub-card"><p>No ${esc(ST[st]||st)} tests yet. Turn on <b>All states</b> to see every test.</p></div>`}<div class="hub-card tp-links"><h3>🏛️ Official past tests</h3><p class="tp-m">Real released tests and practice sites from state education departments. They open in a new tab.</p><ul>${links.map(l=>`<li><span class="hub-tag">${l[0]}</span><a href="${l[2]}" target="_blank" rel="noopener">${esc(l[1])}</a></li>`).join('')}</ul></div></div>`);
  wire({sw:b=>{const k=b.dataset.k;store.set(k,b.getAttribute('aria-pressed')!=='true');picker();const n=$(`.tp-sw[data-k="${k}"]`);n?n.focus():0},go:b=>run(all.find(t=>t.id===b.dataset.id),b.dataset.k)});
 };
 const run=(t,mode)=>{if(!t)return;
  const n=t.items.length,mock=mode==='mock',R=Array(n).fill(null),done=Array(n).fill(false),fl=Array(n).fill(false);let i=0,left=Math.round((+t.minutes||30)*60),tick=null,t0=Date.now(),lastP=null;
  const stopT=()=>{tick?clearInterval(tick):0;tick=null};
  api.title(t.test);api.status('');
  const begin=()=>{t0=Date.now();tick=mock?api.every(1000,()=>{left--;const el=$('.tp-timer');el?(el.textContent=fmt(left),el.classList.toggle('low',left<=300)):0;left<=0?finish():0}):null;show(true)};
  const intro=()=>{keyH=null;api.html(`<div class="tp-wrap"><div class="hub-card tp-intro"><span class="hub-tag">${mock?'⏱ Mock test':'✏️ Practice'}</span><h2>${E(t.test)}</h2>${t.intro?`<p>${E(t.intro)}</p>`:''}<ul class="tp-rules">${mock?`<li>${+t.minutes} minutes for ${n} questions. The timer starts when you press Start.</li><li>Use ⚑ Flag to mark questions you want to come back to.</li><li>No answers are shown until you submit. Then you will see your score and every explanation.</li>`:`<li>${n} questions, no timer.</li><li>After each answer you will see whether you are right, and why.</li>`}${t.items.some(x=>x.type==='num')?'<li>Number answers: use the keypad or your keyboard. 1/2, 0.5 and .5 all count the same.</li>':''}</ul>${t.source?`<p class="tp-m">Source: ${E(t.source.name)}</p>`:''}<div class="tp-btns"><button class="hub-btn" data-a="back">Back</button><button class="hub-btn primary" data-a="start">Start</button></div></div></div>`);wire({back:picker,start:begin});const s=$('[data-a="start"]');s?s.focus():0};
  const check=()=>{if(!has(R[i])||done[i])return;done[i]=true;right(t.items[i],R[i])?api.score(10):api.miss();show()};
  const pick=k=>{const it=t.items[i];if(done[i]&&!mock||k>=it.choices.length)return;it.type==='multi'?R[i]=(R[i]||[]).includes(k)?R[i].filter(x=>x!==k):(R[i]||[]).concat(k):R[i]=k;it.type==='mc'&&!mock?check():show()};
  const key=k=>{if(done[i]&&!mock)return;const s=String(R[i]||'');R[i]=k==='⌫'?s.slice(0,-1):k==='C'?'':(s+(k==='␣'?' ':k==='−'?'-':k)).slice(0,14);const d=$('.tp-disp'),c=$('[data-a="check"]'),g=$(`.tp-dots [data-k="${i}"]`);d?d.textContent=R[i]:0;c?c.disabled=!has(R[i]):0;g?g.classList.toggle('ans',has(R[i])):0};
  const next=()=>i<n-1?(i++,show(true)):mock?review():finish();
  const show=top=>{const it=t.items[i],p=it.passage&&t.passages?t.passages[it.passage]:null,r=R[i],chk=!mock&&done[i],ok=chk&&right(it,r),multi=it.type==='multi',old=$('.tp-ptext'),keep=old&&lastP===(it.passage||null)?old.scrollTop:0,sel=k=>multi?(r||[]).includes(k):r===k;
   lastP!==(it.passage||null)?api.stop():0;lastP=it.passage||null;
   const cls=k=>chk?((multi?it.a.includes(k):k===it.a)?'ok':sel(k)?'bad':''):sel(k)?'sel':'';
   const ans=it.type==='num'?`<div class="tp-num"><output class="tp-disp${chk?(ok?' ok':' bad'):''}" aria-label="Your answer" aria-live="polite">${esc(r||'')}</output>${chk?'':`<div class="tp-pad">${KEYS.map(k=>`<button class="hub-btn" data-a="key" data-k="${k}" aria-label="${KN[k]||k}">${k}</button>`).join('')}</div>`}</div>`:`${multi?'<p class="tp-hint">Select all that apply.</p>':''}<div class="tp-ch">${it.choices.map((c,k)=>`<button class="hub-choice tp-c${multi?' multi':''} ${cls(k)}" data-a="pick" data-k="${k}" aria-pressed="${sel(k)}"${chk?' disabled':''}><b>${L[k]}</b><span>${E(c)}</span></button>`).join('')}</div>`;
   const nav=mock?`<button class="hub-btn" data-a="prev"${i?'':' disabled'}>← Back</button><button class="hub-btn tp-flag" data-a="flag" aria-pressed="${fl[i]}">⚑ ${fl[i]?'Flagged':'Flag'}</button><button class="hub-btn primary" data-a="next">${i<n-1?'Next →':'Review & submit'}</button>`:chk?`<button class="hub-btn primary" data-a="next">${i<n-1?'Next →':'See results'}</button>`:it.type==='mc'?'':`<button class="hub-btn primary" data-a="check"${has(r)?'':' disabled'}>Check answer</button>`;
   const cnt=mock?R.filter(has).length:done.filter(Boolean).length;
   api.html(`<div class="tp-wrap"><div class="tp-top"><span class="tp-qn">Question ${i+1} of ${n}</span>${it.std?`<span class="hub-tag">${E(it.std)}</span>`:''}<span class="tp-sp"></span>${mock?`<span class="tp-timer${left<=300?' low':''}" role="timer" aria-label="Time left">${fmt(left)}</span>`:`<span class="tp-m">✓ ${done.filter((d,k)=>d&&right(t.items[k],R[k])).length} correct</span>`}<button class="hub-btn tp-x" data-a="exit">Exit</button></div><div class="hub-bar" aria-hidden="true"><i style="width:${cnt/n*100}%"></i></div><div class="tp-body${p?' tp-split':''}">${p?`<div class="hub-card tp-pass" role="region" aria-label="Reading passage"><div class="tp-ph"><h3>${E(p.title)}</h3><button class="hub-btn tp-rd" data-a="read">🔊 Read aloud</button></div><div class="tp-ptext" tabindex="0">${String(p.text).split(/\n\s*\n/).map(x=>`<p>${E(x.trim()).replace(/^([A-Z][A-Z0-9 ’'&,:.-]{3,})<br>/,'<strong class="tp-sh">$1</strong>')}</p>`).join('')}</div>${p.credit?`<p class="tp-cr">${E(p.credit)}</p>`:''}</div>`:''}<div class="hub-card tp-item"><div class="tp-qrow"><p class="tp-q" tabindex="-1">${E(it.q)}</p><button class="tp-say" data-a="say" aria-label="Read question aloud">🔊</button></div>${it.img?`<div class="tp-img">${it.img}</div>`:''}${ans}${chk?`<div class="tp-fb ${ok?'ok':'bad'}" role="status"><b>${ok?'✓ Correct!':'✗ Not quite.'}</b>${ok?'':` Correct answer: ${E(ansTxt(it,it.a))}`}<p>${E(it.explain)}</p></div>`:''}<div class="tp-nav">${nav}</div></div></div>${mock?`<nav class="tp-dots" aria-label="Questions">${t.items.map((x,k)=>`<button data-a="go" data-k="${k}" class="${has(R[k])?'ans':''}${fl[k]?' fl':''}${k===i?' cur':''}" aria-label="Question ${k+1}${has(R[k])?', answered':''}${fl[k]?', flagged':''}"${k===i?' aria-current="true"':''}>${k+1}</button>`).join('')}</nav>`:''}</div>`);
   const pt=$('.tp-ptext');pt?pt.scrollTop=keep:0;top?(ov().scrollTop=0,($('.tp-q')||{focus(){}}).focus({preventScroll:true})):0;
   wire({exit:()=>{stopT();picker()},read:b=>{const on=b.dataset.on==='1';on?api.stop():api.speak(p.title+'. '+p.text);b.dataset.on=on?'':'1';b.textContent=on?'🔊 Read aloud':'⏹ Stop reading'},say:()=>api.speak(it.q+(it.choices?'. '+it.choices.map((c,k)=>L[k]+'. '+c).join('. '):'')),pick:b=>pick(+b.dataset.k),key:b=>key(b.dataset.k),check,next,prev:()=>(i--,show(true)),flag:()=>(fl[i]=!fl[i],show()),go:b=>(i=+b.dataset.k,show(true))});
   keyH=e=>{const k=e.key,ix=/^[1-8]$/.test(k)?+k-1:/^[a-h]$/i.test(k)?k.toLowerCase().charCodeAt(0)-97:-1;it.type==='num'&&!chk&&/^[0-9./ -]$/.test(k)?(e.preventDefault(),key(k===' '?'␣':k)):it.type==='num'&&!chk&&k==='Backspace'?(e.preventDefault(),key('⌫')):it.type!=='num'&&!chk&&ix>=0?pick(ix):k==='Enter'?(e.preventDefault(),mock||chk?next():check()):mock&&k==='ArrowRight'&&i<n-1?(i++,show(true)):mock&&k==='ArrowLeft'&&i?(i--,show(true)):0};
  };
  const review=()=>{keyH=null;const un=R.map((r,k)=>has(r)?-1:k).filter(k=>k>=0),fq=fl.map((f,k)=>f?k:-1).filter(k=>k>=0),btn=k=>`<button class="hub-btn" data-a="go" data-k="${k}" aria-label="Go to question ${k+1}">${k+1}</button>`;
   api.html(`<div class="tp-wrap"><div class="hub-card tp-intro"><h2>Review before you submit</h2><p>Time left: <span class="tp-timer" role="timer">${fmt(left)}</span></p><p><b>${n-un.length} of ${n}</b> questions answered.</p>${un.length?`<h3>Unanswered</h3><div class="tp-jump">${un.map(btn).join('')}</div>`:''}${fq.length?`<h3 style="margin-top:1rem">⚑ Flagged</h3><div class="tp-jump">${fq.map(btn).join('')}</div>`:''}<div class="tp-btns" style="margin-top:1.2rem"><button class="hub-btn" data-a="back">Keep working</button><button class="hub-btn primary" data-a="submit">Submit test</button></div></div></div>`);
   ov().scrollTop=0;wire({go:b=>(i=+b.dataset.k,show(true)),back:()=>show(true),submit:finish})};
  const finish=()=>{stopT();keyH=null;api.stop();const okA=t.items.map((it,k)=>right(it,R[k])),c=okA.filter(Boolean).length,p=Math.round(c/n*100),secs=Math.round((Date.now()-t0)/1000),h=store.get('hist',{}),prev=h[t.id]||[],pb=prev.length?Math.max(...prev.map(x=>x.p)):-1,by={};
   h[t.id]=[{d:Date.now(),m:mode,p,c,n,s:secs}].concat(prev).slice(0,20);store.set('hist',h);p>=80?api.confetti():0;api.status(p+'%');
   t.items.forEach((it,k)=>{const s=it.std||'Other';by[s]=by[s]||[0,0];by[s][1]++;by[s][0]+=okA[k]?1:0});
   api.html(`<div class="tp-wrap"><div class="hub-card tp-res"><span class="hub-tag">${mock?'⏱ Mock test':'✏️ Practice'}</span><div class="tp-pct">${p}%</div><p class="tp-sum">${c} of ${n} correct · ${fmt(secs)} used</p><p class="tp-m">${pb>=0&&p>pb?'🎉 New personal best! ':''}Best: ${Math.max(p,pb)}% · ${h[t.id].length} attempt${h[t.id].length>1?'s':''}</p><p>${p>=85?'Outstanding work!':p>=65?'Solid work! Look over the misses below.':'Keep going. Every review makes the next try easier.'}</p><div class="tp-btns"><button class="hub-btn" data-a="list">All tests</button><button class="hub-btn" data-a="other">${mock?'Practice':'Mock test'}</button><button class="hub-btn primary" data-a="again">Try again</button></div></div><div class="hub-card"><h3>By standard</h3><ul class="tp-std">${Object.keys(by).sort().map(s=>`<li><span class="tp-sd">${E(s)}</span><span class="hub-bar"><i style="width:${by[s][0]/by[s][1]*100}%"></i></span><span>${by[s][0]}/${by[s][1]}</span></li>`).join('')}</ul></div><div class="hub-card"><div class="tp-ph"><h3>Review every question</h3><button class="tp-sw" data-a="miss" aria-pressed="false"><i aria-hidden="true"></i>Only missed</button></div><ol class="tp-rvl">${t.items.map((it,k)=>`<li class="tp-rv ${okA[k]?'ok':'bad'}"><div class="tp-rh"><b>${okA[k]?'✓':'✗'} Question ${k+1}</b>${it.std?`<span class="hub-tag">${E(it.std)}</span>`:''}${it.passage&&t.passages&&t.passages[it.passage]?`<span class="hub-tag">📖 ${E(t.passages[it.passage].title)}</span>`:''}</div><p class="tp-rq">${E(it.q)}</p>${it.img?`<div class="tp-img">${it.img}</div>`:''}<p><b>Your answer:</b> ${E(ansTxt(it,R[k]))}</p>${okA[k]?'':`<p><b>Correct answer:</b> ${E(ansTxt(it,it.a))}</p>`}<p class="tp-m">${E(it.explain)}</p></li>`).join('')}</ol></div></div>`);
   ov().scrollTop=0;wire({list:picker,again:()=>run(t,mode),other:()=>run(t,mock?'practice':'mock'),miss:b=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);$('.tp-rvl').classList.toggle('only-miss',on)}})};
  intro();
 };
 api.html('<div class="tp-wrap"><div class="hub-card tp-load" role="status">Loading tests…</div></div>');
 load().then(()=>alive?picker():0);
}});
})();
