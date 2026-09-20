(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const rd=k=>{try{return localStorage.getItem(k)}catch{return null}},wr=(k,v)=>{try{localStorage.setItem(k,String(v))}catch{}};
const num=k=>parseFloat(rd(k))||0,today=()=>new Date().toISOString().slice(0,10);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pct=(v,cap)=>clamp(Math.round(100*v/cap),0,100);
const GAMES={
 workout:{icon:'🏋️',title:'Daily Workout',desc:'4 rounds, one brain score'},
 progress:{icon:'📈',title:'Progress Map',desc:'Your five domains'},
 schulte:{icon:'🔢',title:'Schulte Table',desc:'Find 1→25 fast'},
 matrix:{icon:'🧩',title:'Pattern Matrix',desc:'Complete the grid'},
 codebreaker:{icon:'🎯',title:'Code Breaker',desc:'Crack the colour code'},
 wordsprint:{icon:'⚡',title:'Word Sprint',desc:'Name the category'}
};
const WORDS={
 animals:'ant ape bat bear bee beetle bird bison boar buffalo bull butterfly camel cat cheetah chicken chimp cobra cow coyote crab crane crow deer dog dolphin donkey dove duck eagle eel elephant elk emu falcon ferret fish flamingo fly fox frog gazelle gecko gerbil giraffe goat goose gorilla hamster hare hawk hedgehog hen heron hippo horse hornet hound hyena iguana jaguar jay jellyfish kangaroo koala lamb lark lemur leopard lion lizard llama lobster lynx macaw mole monkey moose moth mouse mule newt octopus orca ostrich otter owl ox oyster panda panther parrot peacock pelican penguin pig pigeon pony porcupine puma puppy quail rabbit raccoon ram rat raven reindeer rhino robin rooster salmon seal shark sheep shrimp skunk sloth slug snail snake sparrow spider squid squirrel stork swan tiger toad trout tuna turkey turtle viper vulture walrus wasp weasel whale wolf wombat worm yak zebra',
 foods:'apple avocado bacon bagel banana bean beef beet berry biscuit bread broccoli burger burrito butter cabbage cake candy carrot cashew celery cereal cheese cherry chicken chili chip chocolate cocoa coconut cookie corn cracker cream croissant cucumber curry date donut dumpling egg fig fish fries garlic ginger grape gravy ham honey jam jelly kale kebab kiwi lasagna lemon lentil lettuce lime lobster mango melon milk muffin mushroom noodle nut oat olive omelet onion orange oyster pancake papaya pasta pea peach peanut pear pepper pickle pie pineapple pizza plum popcorn pork potato pretzel pudding pumpkin quinoa radish raisin ramen rice salad salmon salsa sandwich sauce sausage shrimp soup spinach squash steak stew sushi taco tea toast tofu tomato tortilla tuna turkey turnip waffle walnut yogurt zucchini',
 countries:'afghanistan albania algeria angola argentina armenia australia austria bahamas bahrain bangladesh belarus belgium belize benin bhutan bolivia bosnia botswana brazil brunei bulgaria burundi cambodia cameroon canada chad chile china colombia congo croatia cuba cyprus czechia denmark djibouti dominica ecuador egypt eritrea estonia ethiopia fiji finland france gabon gambia georgia germany ghana greece grenada guatemala guinea guyana haiti honduras hungary iceland india indonesia iran iraq ireland israel italy jamaica japan jordan kazakhstan kenya kosovo kuwait laos latvia lebanon lesotho liberia libya lithuania luxembourg madagascar malawi malaysia maldives mali malta mauritania mauritius mexico moldova monaco mongolia montenegro morocco mozambique myanmar namibia nepal netherlands nicaragua niger nigeria norway oman pakistan panama paraguay peru philippines poland portugal qatar romania russia rwanda samoa senegal serbia singapore slovakia slovenia somalia spain sudan suriname sweden switzerland syria taiwan tajikistan tanzania thailand togo tonga tunisia turkey uganda ukraine uruguay uzbekistan vanuatu venezuela vietnam wales yemen zambia zimbabwe',
 body:'ankle arm back beard belly bone brain calf cheek chest chin ear elbow eye eyebrow eyelash face finger foot forehead gum hair hand head heart heel hip jaw kidney knee knuckle leg lip liver lung mouth muscle nail neck nerve nose palm rib scalp shin shoulder skin skull spine stomach thigh throat thumb toe tongue tooth vein waist wrist',
 sports:'archery badminton baseball basketball biathlon bobsled bowling boxing canoe cricket curling cycling darts diving fencing football golf gymnastics handball hockey hurdles javelin judo karate kayak lacrosse luge marathon netball polo rowing rugby running sailing skating skiing snooker snowboard soccer softball squash surfing swimming tennis triathlon volleyball wrestling'
};
const KEY='bg-';
let ov,stage,hdr,tmr,tick,session=null;
function ensureOverlay(){
 if(ov)return;
 ov=document.createElement('div');ov.id='bg-overlay';ov.innerHTML=`<div class="bg-shell"><div class="bg-head"><button class="bg-back" id="bg-back">← Back</button><div class="bg-title" id="bg-title"></div><div class="bg-timer" id="bg-timer"></div></div><div class="bg-stage" id="bg-stage"></div></div><canvas id="bg-fx"></canvas>`;
 document.body.appendChild(ov);stage=$('#bg-stage');hdr=$('#bg-title');tmr=$('#bg-timer');
 $('#bg-back').onclick=closeOverlay;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ov.classList.contains('on'))closeOverlay()});
}
function openOverlay(title){ensureOverlay();hdr.textContent=title;tmr.textContent='';stage.innerHTML='';ov.classList.add('on');document.body.classList.add('bg-open')}
function closeOverlay(){if(tick){clearInterval(tick);tick=null}session=null;ov.classList.remove('on');document.body.classList.remove('bg-open')}
function setTimer(txt){tmr.textContent=txt}
function bestUpdate(k,v,lowerBetter){const old=parseFloat(rd(KEY+k));const better=isNaN(old)||(lowerBetter?v<old:v>old);if(better)wr(KEY+k,v);return better}
function logPlay(g,score){const h=JSON.parse(rd(KEY+'hist')||'[]');h.push([today(),g,Math.round(score)]);while(h.length>400)h.shift();wr(KEY+'hist',JSON.stringify(h));const d=today(),last=rd(KEY+'last'),streak=num(KEY+'streak');if(last!==d){const y=new Date(Date.now()-864e5).toISOString().slice(0,10);wr(KEY+'streak',last===y?streak+1:1);wr(KEY+'last',d)}}
function burst(x,y,n=60){const c=$('#bg-fx');c.width=innerWidth;c.height=innerHeight;const g=c.getContext('2d');const ps=Array.from({length:n},()=>({x,y,vx:(Math.random()-.5)*14,vy:(Math.random()-.9)*14,l:1,h:Math.random()*360}));let f=0;const step=()=>{g.clearRect(0,0,c.width,c.height);let alive=0;for(const p of ps){p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.l-=.018;if(p.l<=0)continue;alive++;g.globalAlpha=p.l;g.fillStyle=`hsl(${p.h},95%,62%)`;g.beginPath();g.arc(p.x,p.y,4+3*p.l,0,7);g.fill()}g.globalAlpha=1;if(alive&&f++<140)requestAnimationFrame(step);else g.clearRect(0,0,c.width,c.height)};step()}
function result(title,lines,score,game,retry){logPlay(game,score);const best=rd(KEY+game+'-best');stage.innerHTML=`<div class="bg-result"><div class="bg-result-title">${title}</div><div class="bg-result-lines">${lines.map(l=>`<div>${l}</div>`).join('')}</div><div class="bg-result-score">${Math.round(score)}<span>score</span></div><div class="bg-row"><button class="bg-btn" id="bg-again">Play again</button><button class="bg-btn ghost" id="bg-done">${session?'Next round →':'Done'}</button></div></div>`;burst(innerWidth/2,innerHeight/2-40,90);$('#bg-again').onclick=retry;$('#bg-done').onclick=()=>session?nextRound(score):closeOverlay()}
function schulte(){
 const lvl=clamp(num(KEY+'schulte-lvl')||5,4,7),n=lvl,cells=shuffle(Array.from({length:n*n},(_,i)=>i+1));let next=1,t0=0,errors=0;
 openOverlay(`Schulte Table ${n}×${n}`);
 stage.innerHTML=`<div class="bg-intro"><p>Tap the numbers in order from <b>1</b> to <b>${n*n}</b> as fast as you can. Keep your eyes on the centre and use your peripheral vision.</p><button class="bg-btn" id="bg-go">Start</button></div>`;
 $('#bg-go').onclick=()=>{stage.innerHTML=`<div class="bg-grid" style="grid-template-columns:repeat(${n},1fr)">${cells.map(v=>`<button class="bg-cell" data-v="${v}">${v}</button>`).join('')}</div><div class="bg-hint">Next: <b id="bg-next">1</b></div>`;t0=performance.now();tick=setInterval(()=>setTimer(((performance.now()-t0)/1000).toFixed(1)+'s'),100);
  $$('.bg-cell',stage).forEach(b=>b.onclick=()=>{const v=+b.dataset.v;if(v!==next){errors++;b.classList.add('bad');setTimeout(()=>b.classList.remove('bad'),250);return}b.classList.add('done');next++;$('#bg-next').textContent=next;if(next>n*n){clearInterval(tick);tick=null;const s=(performance.now()-t0)/1000;const par=n*n*.55;const score=clamp(Math.round(1000*par/(s+errors*.8)),50,1500);const wasBest=bestUpdate('schulte-best-'+n,s,true);wr(KEY+'schulte-lvl',s<par*.8?Math.min(7,n+1):s>par*1.6?Math.max(4,n-1):n);result(wasBest?'🏆 New best!':'Table cleared',[`Time <b>${s.toFixed(1)}s</b> · ${errors} mistake${errors===1?'':'s'}`,`Best ${n}×${n}: ${parseFloat(rd(KEY+'schulte-best-'+n)).toFixed(1)}s`,`Next time: ${rd(KEY+'schulte-lvl')}×${rd(KEY+'schulte-lvl')}`],score,'schulte',schulte)}})}
}
const SHAPES=['●','■','▲','◆','★','✚'],COLORS=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9f1c'];
function genMatrix(hard){
 const rule=Math.random()*(hard?4:3)|0;
 const base=Math.random()*6|0,cbase=Math.random()*6|0,rot=[0,45,90,135,180,225,270];
 const cell=(r,c)=>{
  if(rule===0)return{s:SHAPES[(base+c)%6],c:COLORS[(cbase+r)%6],n:1,a:0};
  if(rule===1)return{s:SHAPES[(base+r)%6],c:COLORS[(cbase+c)%6],n:1+((r+c)%3),a:0};
  if(rule===2)return{s:SHAPES[(base+(r+c))%6],c:COLORS[(cbase+r*2+c)%6],n:1,a:rot[(r*3+c)%7]};
  return{s:SHAPES[(base+r*c)%6],c:COLORS[(cbase+((r+1)*(c+1)))%6],n:1+((r*c)%3),a:rot[(r+c)%7]};
 };
 const grid=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)grid.push(cell(r,c));
 const ans=grid[8];const opts=[ans];
 while(opts.length<4){const o={s:SHAPES[Math.random()*6|0],c:COLORS[Math.random()*6|0],n:1+(Math.random()*3|0),a:rot[Math.random()*7|0]};if(!opts.some(x=>x.s===o.s&&x.c===o.c&&x.n===o.n&&x.a===o.a))opts.push(o)}
 return{grid,ans,opts:shuffle(opts)};
}
const drawTile=t=>`<span class="bg-tile" style="color:${t.c};transform:rotate(${t.a}deg)">${t.s.repeat(t.n)}</span>`;
function matrix(){
 let i=0,right=0,t0=performance.now();const N=10,hard=num(KEY+'matrix-best')>=8;
 openOverlay('Pattern Matrix');
 const ask=()=>{if(i>=N){const s=(performance.now()-t0)/1000;const score=right*100+clamp(Math.round(600-s),0,600);const wasBest=bestUpdate('matrix-best',right);result(wasBest?'🏆 New best!':'Round complete',[`<b>${right}/${N}</b> correct in ${s.toFixed(0)}s`,`Best: ${rd(KEY+'matrix-best')}/${N}`,hard?'Hard rules unlocked':'Score 8+ to unlock hard rules'],score,'matrix',matrix);return}
  const m=genMatrix(hard);stage.innerHTML=`<div class="bg-hint">Which tile completes the pattern? <b>${i+1}/${N}</b></div><div class="bg-matrix">${m.grid.map((t,k)=>`<div class="bg-mcell${k===8?' q':''}">${k===8?'?':drawTile(t)}</div>`).join('')}</div><div class="bg-opts">${m.opts.map((o,k)=>`<button class="bg-opt" data-k="${k}">${drawTile(o)}</button>`).join('')}</div>`;
  $$('.bg-opt',stage).forEach(b=>b.onclick=()=>{const o=m.opts[+b.dataset.k];const ok=o===m.ans;if(ok)right++;b.classList.add(ok?'good':'bad');if(!ok)$$('.bg-opt',stage)[m.opts.indexOf(m.ans)].classList.add('good');$$('.bg-opt',stage).forEach(x=>x.disabled=true);setTimeout(()=>{i++;ask()},650)})};
 ask();
}
function codebreaker(){
 const K=6,L=4,MAX=10,code=Array.from({length:L},()=>Math.random()*K|0);let guess=[],rows=[];
 openOverlay('Code Breaker');
 const feedback=g=>{let black=0,white=0;const cc=[...code],gg=[...g];for(let i=0;i<L;i++)if(gg[i]===cc[i]){black++;cc[i]=gg[i]=-1}for(let i=0;i<L;i++)if(gg[i]>=0){const j=cc.indexOf(gg[i]);if(j>=0){white++;cc[j]=-1}}return{black,white}};
 const render=()=>{stage.innerHTML=`<div class="bg-hint">Guess the 4-colour code. ● = right colour right spot, ○ = right colour wrong spot. <b>${MAX-rows.length}</b> guesses left</div><div class="bg-cb-rows">${rows.map(r=>`<div class="bg-cb-row">${r.g.map(c=>`<span class="bg-peg" style="background:${COLORS[c]}"></span>`).join('')}<span class="bg-fb">${'●'.repeat(r.f.black)}${'○'.repeat(r.f.white)}</span></div>`).join('')}<div class="bg-cb-row cur">${Array.from({length:L},(_,i)=>`<span class="bg-peg ${guess[i]==null?'empty':''}" style="background:${guess[i]==null?'transparent':COLORS[guess[i]]}"></span>`).join('')}<button class="bg-btn sm" id="bg-undo">⌫</button><button class="bg-btn sm" id="bg-sub" ${guess.length<L?'disabled':''}>Check</button></div></div><div class="bg-palette">${COLORS.map((c,i)=>`<button class="bg-peg pick" data-i="${i}" style="background:${c}"></button>`).join('')}</div>`;
  $$('.pick',stage).forEach(b=>b.onclick=()=>{if(guess.length<L){guess.push(+b.dataset.i);render()}});
  $('#bg-undo').onclick=()=>{guess.pop();render()};
  $('#bg-sub').onclick=()=>{const f=feedback(guess);rows.push({g:guess,f});guess=[];if(f.black===L){const n=rows.length;const score=clamp(1300-n*100,300,1200);const wasBest=bestUpdate('codebreaker-best',n,true);result(wasBest?'🏆 New best!':'Code cracked!',[`Solved in <b>${n}</b> guess${n===1?'':'es'}`,`Best: ${rd(KEY+'codebreaker-best')} guesses`],score,'codebreaker',codebreaker);return}if(rows.length>=MAX){result('Out of guesses',[`The code was ${code.map(c=>`<span class="bg-peg" style="background:${COLORS[c]}"></span>`).join('')}`],100,'codebreaker',codebreaker);return}render()}};
 render();
}
function wordsprint(){
 const cats=Object.keys(WORDS),cat=cats[Math.random()*cats.length|0],set=new Set(WORDS[cat].split(' ')),found=new Set();let t=45;
 openOverlay('Word Sprint');
 stage.innerHTML=`<div class="bg-intro"><p>Category: <b class="bg-catname">${cat}</b></p><p>Type as many as you can in 45 seconds. Press Enter after each word.</p><button class="bg-btn" id="bg-go">Start</button></div>`;
 $('#bg-go').onclick=()=>{stage.innerHTML=`<div class="bg-hint">Category: <b class="bg-catname">${cat}</b> · found <b id="bg-cnt">0</b></div><input class="bg-input" id="bg-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type a word, press Enter"><div class="bg-chips" id="bg-chips"></div>`;const inp=$('#bg-in');inp.focus();setTimer(t+'s');
  tick=setInterval(()=>{t--;setTimer(t+'s');if(t<=0){clearInterval(tick);tick=null;inp.disabled=true;const n=found.size;const score=n*60;const wasBest=bestUpdate('wordsprint-best',n);result(wasBest?'🏆 New best!':'Time!',[`<b>${n}</b> ${cat} in 45s`,`Best: ${rd(KEY+'wordsprint-best')}`,`Missed a few: ${shuffle([...set].filter(w=>!found.has(w))).slice(0,6).join(', ')}`],score,'wordsprint',wordsprint)}},1000);
  inp.onkeydown=e=>{if(e.key!=='Enter')return;const w=inp.value.trim().toLowerCase().replace(/s$/,'');const w2=inp.value.trim().toLowerCase();const hit=set.has(w2)?w2:set.has(w)?w:null;inp.value='';if(hit&&!found.has(hit)){found.add(hit);$('#bg-cnt').textContent=found.size;const c=document.createElement('span');c.className='bg-chip';c.textContent=hit;$('#bg-chips').prepend(c)}else{inp.classList.add('bad');setTimeout(()=>inp.classList.remove('bad'),200)}}};
}
const ROUNDS=['schulte','matrix','codebreaker','wordsprint'];
function workout(){session={i:0,scores:[]};runRound()}
function runRound(){const g=ROUNDS[session.i];({schulte,matrix,codebreaker,wordsprint})[g]();hdr.textContent=`Round ${session.i+1}/4 · ${GAMES[g].title}`}
function nextRound(score){session.scores.push(score);session.i++;if(session.i<ROUNDS.length){runRound();return}const total=session.scores.reduce((a,b)=>a+b,0);const wasBest=bestUpdate('workout-best',total);const streak=num(KEY+'streak');logPlay('workout',total);session=null;openOverlay('Daily Workout');stage.innerHTML=`<div class="bg-result"><div class="bg-result-title">${wasBest?'🏆 New workout best!':'Workout complete'}</div><div class="bg-result-score">${Math.round(total)}<span>brain score</span></div><div class="bg-result-lines">${ROUNDS.map((g,i)=>`<div>${GAMES[g].icon} ${GAMES[g].title} · ${Math.round(session?.scores?.[i]??0)}</div>`).join('')}<div>🔥 ${streak}-day streak</div></div><div class="bg-row"><button class="bg-btn" id="bg-prog">See progress</button><button class="bg-btn ghost" id="bg-done">Done</button></div></div>`;burst(innerWidth/2,innerHeight/2-40,140);$('#bg-prog').onclick=progress;$('#bg-done').onclick=closeOverlay}
const DOMAINS=[
 ['Memory',()=>Math.max(pct(num('nbk-best-2'),100),pct(num('nmm-best-forward')||num('nmm-best'),12),pct(num('chm-best-always')||num('chm-best'),20),pct(num('corsi-best'),9))],
 ['Speed',()=>Math.max(num('rxt-best-single')?pct(450-num('rxt-best-single'),250):0,pct(num('spm-best'),40),pct(num('sym-best'),60))],
 ['Attention',()=>Math.max(pct(num('stp-best-normal'),40),pct(num('flank-best'),40),pct(num('gng-best'),100),num(KEY+'schulte-best-5')?pct(40-num(KEY+'schulte-best-5'),30):0)],
 ['Logic',()=>Math.max(pct(num(KEY+'matrix-best'),10),num(KEY+'codebreaker-best')?pct(11-num(KEY+'codebreaker-best'),8):0,pct(num('tol-best'),20),pct(num('sdk-best-hard'),10))],
 ['Language',()=>Math.max(pct(num('agm-best'),30),pct(num(KEY+'wordsprint-best'),25),pct(num('morse-best-streak'),20))]
];
function progress(){
 openOverlay('Progress Map');
 const vals=DOMAINS.map(([n,f])=>[n,f()]);const hist=JSON.parse(rd(KEY+'hist')||'[]');const days=new Set(hist.map(h=>h[0]));const streak=num(KEY+'streak');
 const weeks=8,cells=[];for(let i=weeks*7-1;i>=0;i--){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);cells.push(`<span class="bg-day${days.has(d)?' on':''}" title="${d}"></span>`)}
 stage.innerHTML=`<div class="bg-prog"><canvas id="bg-radar" width="360" height="360"></canvas><div class="bg-prog-side"><div class="bg-stat"><b>${streak}</b><span>day streak</span></div><div class="bg-stat"><b>${hist.length}</b><span>rounds played</span></div><div class="bg-stat"><b>${Math.round(num(KEY+'workout-best'))}</b><span>best workout</span></div><div class="bg-cal">${cells.join('')}</div><div class="bg-legend">${vals.map(([n,v])=>`<div><span>${n}</span><i style="width:${v}%"></i><em>${v}</em></div>`).join('')}</div><p class="bg-note">Domains fill from your bests across all brain games. Play a Daily Workout to light up every axis.</p></div></div>`;
 const c=$('#bg-radar'),g=c.getContext('2d'),cx=180,cy=180,R=130,n=vals.length;g.clearRect(0,0,360,360);
 for(let ring=1;ring<=4;ring++){g.beginPath();for(let i=0;i<=n;i++){const a=-Math.PI/2+i*2*Math.PI/n,r=R*ring/4;g.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}g.strokeStyle='rgba(255,255,255,.12)';g.stroke()}
 g.beginPath();vals.forEach(([,v],i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*v/100;g.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))});g.closePath();g.fillStyle='rgba(124,92,252,.35)';g.fill();g.strokeStyle='#a78bfa';g.lineWidth=2;g.stroke();
 g.fillStyle='#e6e6f0';g.font='bold 13px system-ui';g.textAlign='center';vals.forEach(([nm],i)=>{const a=-Math.PI/2+i*2*Math.PI/n;g.fillText(nm,cx+(R+22)*Math.cos(a),cy+(R+22)*Math.sin(a)+5)});
}
function synapse(){
 if($('#bg-synapse'))return;const c=document.createElement('canvas');c.id='bg-synapse';document.body.prepend(c);const g=c.getContext('2d');let w,h,pts;
 const size=()=>{w=c.width=innerWidth;h=c.height=innerHeight;pts=Array.from({length:Math.min(90,(w*h)/14000|0)},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35}))};size();addEventListener('resize',size);
 const step=()=>{if(!document.body.classList.contains('bg-brain')){requestAnimationFrame(step);return}g.clearRect(0,0,w,h);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1}for(let i=0;i<pts.length;i++){for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){g.strokeStyle=`rgba(167,139,250,${.28*(1-d/130)})`;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}}}for(const p of pts){g.fillStyle='rgba(196,181,253,.7)';g.beginPath();g.arc(p.x,p.y,1.6,0,7);g.fill()}requestAnimationFrame(step)};step();
}
function mount(){
 const sec=$('#brain-section');if(!sec||$('#bg-cat'))return;
 const cat=document.createElement('section');cat.className='game-category brain-cat bg-cat';cat.id='bg-cat';
 cat.innerHTML=`<h2 class="cat-header"><span class="cat-header-icon">🏋️</span> Brain Gym <span class="bg-new">NEW</span></h2><div class="cat-games">${Object.entries(GAMES).map(([k,g])=>`<button class="game-btn bg-game" data-bg="${k}"><span class="btn-icon">${g.icon}</span><span class="btn-text">${g.title}</span><span class="btn-desc">${g.desc}</span></button>`).join('')}</div>`;
 sec.parentNode.insertBefore(cat,sec);
 const acts={workout,progress,schulte,matrix,codebreaker,wordsprint};
 $$('.bg-game',cat).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();acts[b.dataset.bg]()},true));
 const sync=()=>{const on=$('#main-game-grid')?.classList.contains('brain-mode');document.body.classList.toggle('bg-brain',!!on);cat.style.display=on?'':'none'};sync();new MutationObserver(sync).observe($('#main-game-grid')||document.body,{attributes:true,attributeFilter:['class']});
 synapse();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0)):setTimeout(mount,0);
window.BrainGym={workout,progress,schulte,matrix,codebreaker,wordsprint};
})();
