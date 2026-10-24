(function(){
'use strict';
const H=window.AmniHub;if(!H)return;
const R=s=>{let a=s>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const hash=s=>[...s].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
const day=(o=0)=>{const d=new Date();d.setDate(d.getDate()+o);return d.toLocaleDateString('en-CA')},fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const D={easy:{lb:'Easy',ic:'🌱',n:5,N:9,ops:'+-',max:20,f:9,hide:.47},medium:{lb:'Medium',ic:'🌿',n:7,N:11,ops:'+-×',max:50,f:9,hide:.5},hard:{lb:'Hard',ic:'🌳',n:9,N:11,ops:'+-×÷',max:99,f:12,hide:.57},expert:{lb:'Expert',ic:'🏔️',n:11,N:13,ops:'+-×÷',max:144,f:12,hide:.7}};
const SAY={'+':'plus','-':'minus','×':'times','÷':'divided by'},SYM={'-':'−'};
const ap=(o,a,b)=>o==='+'?a+b:o==='-'?a-b:o==='×'?a*b:a/b;
function tri(r,P,op,p,v){const c=[];for(let x=1;x<=P.max;x++){const a=p===1?x:p===0?v:x,b=p===0?x:p===1?v:op==='+'?v-x:op==='-'?x-v:op==='×'?v/x:x/v,z=ap(op,a,b),t=[a,b,z];t.every(n=>Number.isInteger(n)&&n>=1&&n<=P.max)&&t[p]===v&&(op==='×'?a>1&&b>1&&a<=P.f&&b<=P.f:op==='÷'?b>1&&b<=P.f&&z>1&&z<=P.f:1)?c.push(t):0}return c.length?c[r()*c.length|0]:null}
function gen(dk,seed){const P=D[dk],r=R(seed),sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=r()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a},N=P.N;
 for(let tries=0;;tries++){const G=new Map(),E=[],k=(y,x)=>y*N+x,at=(y,x)=>G.get(k(y,x)),free=(y,x)=>y<0||x<0||y>=N||x>=N||!at(y,x);
  const put=(d,y,x,op,t)=>{const i=E.length;E.push({d,op,cs:[t[0],op,t[1],'=',t[2]].map((v,j)=>{const yy=y+d*j,xx=x+(1-d)*j;let c=at(yy,xx);c?0:G.set(k(yy,xx),c={y:yy,x:xx,n:typeof v==='number',v,e:[]});c.e.push(i);return c})})};
  const fits=(d,y,x,sy,sx)=>[-1,0,1,2,3,4,5].every(j=>{const yy=y+d*j,xx=x+(1-d)*j;return j<0||j>4?free(yy,xx):yy>=0&&xx>=0&&yy<N&&xx<N&&(yy===sy&&xx===sx||!at(yy,xx)&&free(yy+1-d,xx+d)&&free(yy-1+d,xx-d))});
  for(let q=0;q<70&&!E.length;q++){const op=sh([...P.ops])[0],t=tri(r,P,op,2,2+(r()*(P.max-1)|0));t?r()<.5?put(0,N>>1,(N-5)>>1,op,t):put(1,(N-5)>>1,N>>1,op,t):0}
  for(let g=0;g<700&&E.length<P.n;g++){const an=[...G.values()].filter(c=>c.n&&c.e.length===1),a=an[r()*an.length|0];if(!a)break;const d=1-E[a.e[0]].d;for(const j of sh([0,2,4])){const y=a.y-d*j,x=a.x-(1-d)*j;if(!fits(d,y,x,a.y,a.x))continue;const t=sh([...P.ops]).map(op=>[op,tri(r,P,op,j/2,a.v)]).find(q=>q[1]);if(t){put(d,y,x,t[0],t[1]);break}}}
  if(E.length<P.n-(tries>20?2:0))continue;
  const cs=[...G.values()],nums=cs.filter(c=>c.n),hc=e=>e.cs.filter(c=>c.h).length,can=c=>!c.h&&c.e.every(i=>hc(E[i])<2);
  sh(E).forEach(e=>hc(e)?0:(q=>q?q.h=1:0)(sh(e.cs.filter(c=>c.n&&can(c)))[0]));
  const want=Math.round(P.hide*nums.length);sh(nums).forEach(c=>nums.filter(q=>q.h).length<want&&can(c)?c.h=1:0);
  cs.forEach((c,i)=>c.i=i);const y0=Math.min(...cs.map(c=>c.y)),x0=Math.min(...cs.map(c=>c.x));
  return{dk,seed,W:Math.max(...cs.map(c=>c.x))-x0+1,H:Math.max(...cs.map(c=>c.y))-y0+1,cells:cs.map(c=>({y:c.y-y0,x:c.x-x0,n:c.n,v:c.v,h:!!c.h,e:c.e})),eqs:E.map(e=>({op:e.op,cs:e.cs.map(c=>c.i)})),tiles:cs.filter(c=>c.h).map(c=>c.v).sort((a,b)=>a-b)}}}
const CSS=`
.mx{width:100%;max-width:57rem;display:flex;flex-direction:column;gap:1rem;font-size:1.15rem;line-height:1.5;align-items:center;text-align:center}
.mx p{margin:0}
.mx h2{margin:0;font:800 clamp(1.4rem,4vw,2rem) var(--ui-sans,system-ui)}
.mx-ic{font-size:3rem;line-height:1}
.mx-modes{display:grid;gap:12px;width:100%;grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))}
.mx-mode{display:flex;flex-direction:column;gap:4px;align-items:center;padding:14px;min-height:5.5rem;border-radius:var(--ui-r,14px);border:2px solid var(--ui-border,#2A303A);background:var(--ui-surface,#161A21);color:inherit;cursor:pointer;font:700 1.15rem var(--ui-sans,system-ui)}
.mx-mode small{font-weight:600;font-size:.85rem;color:var(--ui-muted,#A3ABBA)}
.mx-mode.day{border-color:var(--lv,#38BDF8)}
.mx-grid{--g:3px;--c:max(1.5rem,min(3.4rem,calc((min(100vw,1068px) - 68px) / var(--w) - var(--g)),max(2.2rem,calc((100dvh - 340px) / var(--h) - var(--g)))));display:grid;grid-template-columns:repeat(var(--w),var(--c));grid-template-rows:repeat(var(--h),var(--c));gap:var(--g);justify-content:center;touch-action:manipulation}
.mx-c{display:flex;align-items:center;justify-content:center;border-radius:calc(var(--c)*.18);font:800 calc(var(--c)*.47) var(--ui-sans,system-ui);font-variant-numeric:tabular-nums;padding:0;border:2px solid transparent;color:inherit;transition:background .2s,border-color .2s}
.mx-n{background:var(--ui-surface-2,#1E232B);border-color:var(--ui-border,#2A303A)}
.mx-o{color:var(--ui-muted,#A3ABBA)}
.mx-b{background:transparent;border:2px dashed color-mix(in srgb,var(--lv,#38BDF8) 70%,transparent);cursor:pointer}
.mx-b.mx-f{border-style:solid;background:color-mix(in srgb,var(--lv,#38BDF8) 20%,transparent);color:var(--ui-text,#EDF0F5)}
.mx-b.mx-sel{outline:3px solid var(--lv,#38BDF8);outline-offset:1px;background:color-mix(in srgb,var(--lv,#38BDF8) 12%,transparent)}
.mx-b.mx-hint{border-color:#F59E0B;cursor:default}
.mx-c.mx-ok{background:color-mix(in srgb,var(--ui-ok,#22C55E) 22%,transparent);border-color:var(--ui-ok,#22C55E)}
.mx-o.mx-ok{background:transparent;border-color:transparent;color:var(--ui-ok,#22C55E)}
.mx-c.mx-bad{background:color-mix(in srgb,var(--ui-bad,#EF4444) 22%,transparent);border-color:var(--ui-bad,#EF4444)}
.mx-o.mx-bad{background:transparent;border-color:transparent;color:var(--ui-bad,#EF4444)}
.mx-bank{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:40rem}
.mx-t{min-width:3.2rem;min-height:3.2rem;padding:0 .5rem;border-radius:12px;border:2px solid var(--ui-ok,#22C55E);background:color-mix(in srgb,var(--ui-ok,#22C55E) 12%,var(--ui-surface,#161A21));color:inherit;font:800 1.4rem var(--ui-sans,system-ui);font-variant-numeric:tabular-nums;cursor:pointer;box-shadow:0 3px 0 color-mix(in srgb,var(--ui-ok,#22C55E) 45%,transparent)}
.mx-t:disabled{visibility:hidden}
.mx-fb{min-height:1.5em;font-weight:700}
.mx-best{color:#F59E0B;font-weight:800}
@media (max-width:520px){.hub-card.mx{padding:12px 8px}.mx-grid{--g:2px;--c:max(1.5rem,min(3.4rem,calc((100vw - 52px) / var(--w) - var(--g)),max(2.2rem,calc((100dvh - 340px) / var(--h) - var(--g)))))}.mx .hub-btn{padding:10px 14px}}
html.a11y-rm .mx-c{transition:none}
`;
H.category({id:'mind',icon:'🌿',title:'Healthy Mind',top:'6'});
H.register({id:'mathx',cat:'mind',icon:'➕',title:'Math Crossword',desc:'Fill the grid so every equation works',levels:'678',isNew:true,open(api){
 api.css('mathx',CSS);
 const st=()=>api.store.get('st',{days:[]}),streak=s=>{let n=0;for(let o=s.days.includes(day())?0:-1;s.days.includes(day(o));o--)n++;return n};
 let P,S,sel=-1,es=[],TI=0,dirty=0;
 const view=(h,on)=>{const ov=document.getElementById('hub-overlay');ov?ov.scrollTop=0:0;const s=api.html(`<div class="hub-card mx">${h}</div>`);s.onclick=e=>{const b=e.target.closest('[data-a]');b&&!b.disabled&&on[b.dataset.a]?on[b.dataset.a](b,e):0};return s};
 const save=()=>P&&S?api.store.set('save',{dk:P.dk,seed:P.seed,daily:S.daily,p:S.p,hint:S.hint,t:S.t}):0;
 const stopT=()=>{clearInterval(TI);TI=0;save();api.status('')};
 api.onClose(stopT);
 const val=i=>P.cells[i].h?S.p[i]==null?null:P.tiles[S.p[i]]:P.cells[i].v;
 const est=e=>{const[a,b,z]=[0,2,4].map(j=>val(e.cs[j]));return a==null||b==null||z==null?0:ap(e.op,a,b)===z?1:-1};
 const blanks=()=>P.cells.map((c,i)=>c.h?i:-1).filter(i=>i>=0).sort((a,b)=>P.cells[a].y-P.cells[b].y||P.cells[a].x-P.cells[b].x);
 const used=()=>new Set(Object.values(S.p));
 const nextEmpty=i=>{const B=blanks(),own=i<0?[]:P.cells[i].e.flatMap(e=>P.eqs[e].cs).filter(q=>P.cells[q].h&&S.p[q]==null),k=B.indexOf(i);return own.length?own[0]:[...B.slice(k+1),...B.slice(0,k+1)].find(q=>S.p[q]==null)??-1};
 const read=()=>{const i=sel>=0?sel:blanks()[0];i>=0?api.speak(P.cells[i].e.map(e=>P.eqs[e]).map(e=>[0,2,4].map(j=>val(e.cs[j])??'blank').reduce((s,v,j)=>s+(j===1?' '+SAY[e.op]+' ':j===2?' equals ':'')+v,'')).join('. ')):0};
 function menu(){stopT();P=null;S=null;const s=st(),sv=api.store.get('save',null),td=hash('mathx'+day()),dd=s.days.includes(day()),k=streak(s);
  view(`<div class="mx-ic" aria-hidden="true">➕</div><h2>Math Crossword</h2><p>Put the number tiles in the empty squares so every equation, across and down, is true.</p>${sv?`<button class="hub-btn primary" data-a="cont">▶ Continue ${D[sv.dk].lb}${sv.daily?' daily':''} puzzle · ${fmt(sv.t||0)}</button>`:''}<div class="mx-modes"><button class="mx-mode day" data-a="daily">📅 Daily puzzle<small>${dd?'✓ Solved today':'Medium · new every day'}${k?` · 🔥 ${k}-day streak`:''}</small></button>${Object.entries(D).map(([dk,d])=>`<button class="mx-mode" data-a="new" data-dk="${dk}">${d.ic} ${d.lb}<small>${d.ops.split('').map(o=>SYM[o]||o).join(' ')} · up to ${d.max}${s[dk]?` · ${s[dk].n} solved · best ${fmt(s[dk].best)}`:''}</small></button>`).join('')}</div><p class="hub-muted">Tap an empty square, then tap a number. Tap a filled square to take its number back. Each row and column reads left to right or top to bottom.</p><div class="hub-row"><button class="hub-btn" data-a="x">Done</button></div>`,{
   cont:()=>start(sv.dk,sv.seed,sv.daily,sv),daily:()=>start('medium',td,1),new:b=>start(b.dataset.dk,Math.random()*4294967295>>>0,0),x:()=>api.close()})}
 function start(dk,seed,daily,sv){P=gen(dk,seed);S={daily:!!daily,p:sv&&sv.p||{},hint:sv&&sv.hint||[],t:sv&&sv.t||0,hist:[]};sel=nextEmpty(-1);es=P.eqs.map(est);clearInterval(TI);TI=api.every(1000,()=>{document.hidden?0:(S.t++,api.status('⏱ '+fmt(S.t)),++dirty%5?0:save())});api.status('⏱ '+fmt(S.t));save();draw()}
 function draw(msg){const U=used(),cs=P.cells.map((c,i)=>{const sts=c.e.map(e=>es[e]),k=sts.includes(-1)?' mx-bad':sts.includes(1)?' mx-ok':'',v=val(i),pos=`style="grid-area:${c.y+1}/${c.x+1}"`;return c.h?`<button class="mx-c mx-b${v!=null?' mx-f':''}${sel===i?' mx-sel':''}${S.hint.includes(i)?' mx-hint':''}${k}" ${pos} data-a="cell" data-i="${i}" aria-label="${v==null?'Empty square':'Square with '+v}">${v??''}</button>`:`<div class="mx-c ${c.n?'mx-n':'mx-o'}${k}" ${pos}>${c.n?c.v:SYM[c.v]||c.v}</div>`}).join('');
  view(`<div class="hub-row"><span class="hub-tag">${D[P.dk].ic} ${D[P.dk].lb}${S.daily?' · Daily '+day():''}</span><span class="hub-tag">${Object.keys(S.p).length} of ${P.tiles.length} placed</span></div><div class="mx-grid" style="--w:${P.W};--h:${P.H}" role="grid" aria-label="Math crossword">${cs}</div><p class="mx-fb" aria-live="polite">${msg||''}</p><div class="mx-bank">${P.tiles.map((v,j)=>`<button class="mx-t" data-a="tile" data-j="${j}" ${U.has(j)?'disabled':''}>${v}</button>`).join('')}</div><div class="hub-row"><button class="hub-btn" data-a="undo" ${S.hist.length?'':'disabled'}>↶ Undo</button><button class="hub-btn" data-a="hint">💡 Hint</button><button class="hub-btn" data-a="say">🔊 Read aloud</button><button class="hub-btn" data-a="reset">↺ Clear</button><button class="hub-btn" data-a="menu">☰ Puzzles</button></div>`,{
   cell:b=>{const i=+b.dataset.i;S.hint.includes(i)?0:S.p[i]!=null?(S.hist.push([i,S.p[i]]),delete S.p[i],api.sfx('pop')):0;sel=i;upd()},
   tile:b=>{const j=+b.dataset.j,i=sel>=0&&S.p[sel]==null?sel:nextEmpty(sel);i<0?0:(S.hist.push([i,undefined]),S.p[i]=j,api.sfx('tap')||api.tone(523,.12,'sine',0,.08),sel=nextEmpty(i),upd())},
   undo:()=>{const h=S.hist.pop();h?(h[1]==null?delete S.p[h[0]]:S.p[h[0]]=h[1],sel=h[0],upd()):0},
   hint:()=>{const B=blanks(),wrong=B.find(i=>S.p[i]!=null&&!S.hint.includes(i)&&val(i)!==P.cells[i].v&&P.cells[i].e.some(e=>es[e]===-1)),i=wrong??(sel>=0&&S.p[sel]==null?sel:B.find(q=>S.p[q]==null));if(i==null)return draw('Every square is filled. Check the red equations.');const v=P.cells[i].v;S.p[i]!=null?delete S.p[i]:0;const U=used();let j=P.tiles.findIndex((t,q)=>t===v&&!U.has(q));j<0?(()=>{const o=B.find(q=>S.p[q]!=null&&P.tiles[S.p[q]]===v&&!S.hint.includes(q));j=S.p[o];delete S.p[o]})():0;S.p[i]=j;S.hint.push(i);S.hist=[];api.sfx('star');sel=nextEmpty(i);upd('💡 Hint placed '+v+'.')},
   say:read,reset:()=>{Object.keys(S.p).forEach(i=>S.hint.includes(+i)?0:delete S.p[i]);S.hist=[];sel=nextEmpty(-1);upd()},menu});
 }
 function upd(msg){const old=es;es=P.eqs.map(est);const gain=es.some((v,i)=>v===1&&old[i]!==1),bad=es.some((v,i)=>v===-1&&old[i]!==-1);save();es.every(v=>v===1)&&Object.keys(S.p).length===P.tiles.length?win():(gain?api.sfx('correct'):bad?api.sfx('wrong')||api.tone(247,.25,'sine',0,.1):0,draw(msg||(bad?'That one doesn’t add up. Tap a square to swap it.':gain?'✓ Nice!':'')))}
 function win(){const s=st(),d=s[P.dk]||{n:0,best:0},nb=!d.best||S.t<d.best,first=S.daily&&!s.days.includes(day()),dk=P.dk,daily=S.daily,t=S.t,h=S.hint.length;stopT();api.store.set('save',null);s[dk]={n:d.n+1,best:nb?t:d.best};first?s.days=[...s.days,day()].slice(-400):0;api.store.set('st',s);api.sfx('win');api.confetti();api.score({easy:10,medium:20,hard:30,expert:40}[dk]-Math.min(h*3,9));P=null;S=null;const k=streak(s);
  view(`<div class="mx-ic" aria-hidden="true">🌟</div><h2>Puzzle solved!</h2><p>${D[dk].ic} ${D[dk].lb}${daily?' daily puzzle':''} · ⏱ ${fmt(t)}${h?` · 💡 ${h} hint${h>1?'s':''}`:' · no hints'}</p><p class="${nb&&d.best?'mx-best':'hub-muted'}">${nb&&d.best?'🏆 New best time!':d.best?'Best time: '+fmt(d.best):'Your first '+D[dk].lb+' solve is saved.'}</p>${daily&&k?`<p>🔥 ${k}-day streak. See you tomorrow!</p>`:''}<div class="hub-row">${daily?'':`<button class="hub-btn primary" data-a="next">Next ${D[dk].lb} puzzle ▸</button>`}<button class="hub-btn${daily?' primary':''}" data-a="menu">☰ Puzzles</button><button class="hub-btn" data-a="x">Done</button></div>`,{next:()=>start(dk,Math.random()*4294967295>>>0,0),menu,x:()=>api.close()})}
 menu();
}});
window.AmniMathX={gen,ap,D};
})();
