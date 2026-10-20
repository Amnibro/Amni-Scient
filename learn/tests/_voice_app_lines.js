const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||path.resolve(__dirname,'..'),OUT=process.argv[3]||'app_lines.json';
const SRC=fs.readFileSync(path.join(ROOT,'learn-app.js'),'utf8');
const LS=[0];for(let i=0;i<SRC.length;i++)SRC[i]==='\n'&&LS.push(i+1);
const lineAt=i=>{let lo=0,hi=LS.length-1;while(lo<hi){const m=(lo+hi+1)>>1;LS[m]<=i?lo=m:hi=m-1;}return lo+1;};
function skipStr(s,i){const q=s[i];i++;while(i<s.length){const c=s[i];if(c==='\\'){i+=2;continue;}if(q==='`'&&c==='$'&&s[i+1]==='{'){i=matchEnd(s,i+1);continue;}if(c===q)return i+1;i++;}return i;}
function matchEnd(s,i){let d=0;while(i<s.length){const c=s[i];if(c==='"'||c==="'"||c==='`'){i=skipStr(s,i);continue;}if(c==='/'&&s[i+1]==='/'&&!/[:\\]/.test(s[i-1])){i=s.indexOf('\n',i);continue;}if(c==='/'&&s[i+1]==='*'){i=s.indexOf('*/',i)+2;continue;}if('([{'.includes(c))d++;else if(')]}'.includes(c)){d--;if(!d)return i+1;}i++;}return i;}
function grab(marker,from){const s=SRC.indexOf(marker,from?SRC.indexOf(from):0);if(s<0)throw new Error('missing '+marker);const o=s+marker.length-1;return new Function('return ('+SRC.slice(o,matchEnd(SRC,o))+')')();}
function fnSrc(marker){const s=SRC.indexOf(marker);if(s<0)throw new Error('missing '+marker);const o=SRC.indexOf('{',s);return SRC.slice(s,matchEnd(SRC,o));}
const ttsClean=new Function(SRC.slice(SRC.indexOf('const _TTS_FR'),SRC.indexOf('\n  let _ttsVoiceCache'))+';return _ttsClean;')();
const quizData=grab('const quizData = {'),teachData=grab('const teachData = {'),TUT=grab('const _tutorials={'),MIXES=grab('const MIXES=['),FI_NAMES=grab('const NAMES={'),FI_POOLS=grab('const POOLS={','function initFindIt'),NEEDS=grab('const NEEDS=['),ITEMS=grab('const ITEMS=[','function initCount'),BUB_COLORS=grab('const COLORS=[','function initBubblePop'),BUB_SHAPES=grab('const SHAPES=[','function initBubblePop'),KEEP=grab('const KEEP = ['),DISH_TYPES=grab('const TYPES = [['),MELODIES=grab('const melodies={'),ADV_THEME=grab('const ADV_THEME={'),ADV_FINAL=grab('const ADV_FINAL=['),ADV_GEAR=grab('const ADV_GEAR={'),ADV_QPOOL=grab('const ADV_QPOOL=['),ACH=grab('const ACHIEVEMENTS = ['),STORYQ=grab('const STORY_QUIZZES = {'),GEO=grab('const data = {','function initGeo'),STROOP=grab('const allCls=['),RXT=grab('const choiceColors=['),AGM=grab('const words=[','function initAnagram'),MOLES=grab('const MOLE_EMOJIS=[');
const RXT_TIER=new Function('return '+fnSrc('function _tier(ms)'))();
const traceTargets=lv=>new Function('currentLevel','return ('+fnSrc('function getTracingTargets()')+')()')(lv);
const ANIMAL_SND=new Function('return '+SRC.slice(SRC.indexOf('[',SRC.indexOf('function speakText(text)')),matchEnd(SRC,SRC.indexOf('[',SRC.indexOf('function speakText(text)')))))();
const idleAch=[...SRC.matchAll(/const achievements=\[/g)].map(m=>{const o=m.index+'const achievements='.length;return [...SRC.slice(o,matchEnd(SRC,o)).matchAll(/name:'([^']*)'/g)].map(x=>x[1]);});
const RXN_TOTAL=(m=>m[1]?+m[1]:m[2].split(',').length)(SRC.match(/const _RXN_TOTAL=(?:(\d+)|\[([^\]]*)\]\.length)/));
const map=new Map(),templates=[],add=(t,src)=>{if(t==null)return;t=String(t);if(!t.trim())return;const e=map.get(t);e?(e.src.includes(src)||e.src.push(src)):map.set(t,{t,src:[src]});},adds=(arr,src)=>arr.forEach(t=>add(t,src)),tpl=(src,code,note)=>templates.push({src,code,note});
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const SUBJ=Object.keys(quizData).filter(k=>typeof quizData[k]==='object');
const endLines=(word,tot,src)=>range(0,tot).forEach(s=>{add('All done! '+word(s)+'!',src);s>0&&add('New best! '+word(s)+'!',src);});
SUBJ.forEach(k=>{const d=quizData[k],src='quiz '+k;(d[1]||[]).filter(q=>q.q).forEach(q=>{const ex=q.explain||('The answer is '+q.a+'.');!q.isAudio&&adds([q.q,q.a,...(q.wrong||[])],src+' L1 loadQuestion/audioBtn speakSeq');adds([q.a,ex],src+' L1 explain tap');add('✗ Answer: '+q.a,src+' L1 showFeedback wrong');});[1,2,3].forEach(l=>(d[l]||[]).filter(q=>q.isAudio).forEach(q=>{const t=q.audioText||q.q;ANIMAL_SND.includes(t)||add(t,src+' L1-3 isAudio speakText(audioText)');}));});
range(0,10).forEach(x=>add('Quiz complete! You got '+x+' out of 10 correct. '+(Math.round(100*x/10)>=70?'Great job!':'Good try!'),'quiz loadQuestion end L1'));
Object.keys(teachData).forEach(k=>[1,2,3].forEach(l=>{const td=teachData[k][l]||teachData[k][3];(td||[]).forEach(c=>adds([c.title,c.fact],'teach '+k+' L'+l+(teachData[k][l]?'':' (fallback L3)')+' card tap'+(l===1?' + L1 auto first card':'')));}));
quizData.music&&(quizData.music[1]||[]).filter(q=>q.q).forEach(q=>adds([q.q,q.a,...(q.wrong||[])],'renderMusicQuiz L1'));
(MELODIES[1]||[]).forEach(m=>add("Let's play "+m.name+'!','renderPiano melody L1'));
Object.values(TUT).forEach(t=>adds([t.title,...t.steps.map(s=>s.replace(/<[^>]+>/g,' '))],'showTutorial readItems (Read aloud button any level; auto L1)'));
const advSubs=[...new Set([...Object.keys(ADV_THEME),'animals','colors','counting','shapes','opposites','weather'])];
advSubs.forEach(s=>(quizData[s]&&quizData[s][1]||[]).filter(q=>q.q).forEach(q=>adds([q.q,q.a,...(q.wrong||[]).slice(0,3)],'adventure advBTNext L1 '+s)));
add('The Shadow Dragon stole the Book of Knowledge! Answer questions to strike back, Hero!','adventure advIntro L1 (default name)');
tpl('adventure advIntro L1',"'The Shadow Dragon stole the Book of Knowledge! Answer questions to strike back, '+advName()+'!'",'advName() is the free-text profile name; only the default "Hero" variant was enumerated. Suggest splitting into a fixed clip plus the name, or dropping the name.');
[...Object.values(ADV_THEME).flatMap(t=>[...t.f,t.b]),ADV_FINAL].forEach(f=>add('Victory! You defeated the '+f[1]+'!','adventure advWin L1'));
traceTargets(1).forEach(t=>add(t,'tracing drawTarget speakText L1'));traceTargets(2).forEach(t=>add(t,'tracing drawTarget speakText L2'));
const SM=require(path.join(ROOT,'learn-standards.js'));
const mathSay=new Set(),mathL1=new Set(),mathCh=new Set();
['P','K','1','2'].forEach(g=>['NY','FL','TX'].forEach(st=>{for(let i=0;i<20000;i++){const p=SM.mathProblem(g,Math.random,st);if(p.say){mathSay.add(p.say);p.choices.forEach(c=>mathCh.add(String(c)));}else if(g==='P'&&(p.op==='+'||p.op==='-')){mathL1.add((p.a||0)+(p.op==='+'?' plus ':' minus ')+(p.b||0)+' equals what?');p.choices.forEach(c=>mathCh.add(String(c)));}}}));
range(1,5).forEach(a=>range(1,5).forEach(b=>{mathL1.add(a+' plus '+b+' equals what?');a>=b&&mathL1.add(a+' minus '+b+' equals what?');}));
range(0,13).forEach(n=>mathCh.add(String(n)));
adds([...mathSay],'initMath L1-2 AmniStd _sp.say');adds([...mathL1],'initMath L1 "a plus/minus b equals what?"');adds([...mathCh].sort((a,b)=>a-b),'initMath L1-2 spoken answer choices');
adds(['🏆 Perfect Memory!','⭐ Great Job!','You Won! 🎉'],'initMatching win speakSeq([bonus]) all levels');
const CM='initColorMix (all levels)';endLines(s=>'You got '+s+' out of 10',10,CM);MIXES.forEach(m=>{add(m.aName+' plus '+m.bName+' makes what color?',CM);add('Yes! '+m.rName+'!',CM);add('It is '+m.rName+'!',CM);});
const FI='initFindIt (all levels)';endLines(s=>'You found '+s+' out of 10',10,FI);[...new Set(Object.values(FI_POOLS).filter(Boolean).flat())].forEach(e=>FI_NAMES[e]&&add('Find the '+FI_NAMES[e],FI));
const PC='initPetCare (all levels)';endLines(s=>'You cared for '+s+' pets',10,PC);NEEDS.forEach(n=>{add(n.msg,PC);add('The pet was '+n.label.toLowerCase()+'.',PC);});add('Happy pet!',PC);
const CT='initCount (all levels)';endLines(s=>'You got '+s+' out of 10',10,CT);ITEMS.forEach(i=>add('How many '+i.n+'? Count them!',CT));range(1,10).forEach(n=>add('Yes! '+n+'!',CT));
const SD='initSameDiff (all levels)';endLines(s=>'You got '+s+' out of 10',10,SD);adds(['Are they the same, or different? Tap the green button for same, the red button for different.','Same, or different?','Yes!','They are the same.','They are different.'],SD);
const BP='initBubblePop (all levels)';endLines(s=>'You popped '+s+' out of 10',10,BP);BUB_COLORS.forEach(c=>add('Pop the '+c.n.toLowerCase()+' bubble!',BP));BUB_SHAPES.forEach(c=>add('Pop the '+c.n.toLowerCase()+'!',BP));'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>add('Pop the letter '+l+'!',BP));range(1,10).forEach(n=>add('Pop the number '+n+'!',BP));
adds(['All clean! Watch the toys next time!','Spotless! You left the toys alone!'],'initVacuum win (all levels)');adds(['Washed and put away!','All washed and sorted! Great job!'],'initDishes (all levels)');
range(1,12).forEach(h=>add('Correct! '+h+" o'clock!",'initClock (all levels)'));add('Correct!','initClock (all levels)');add('Perfect! Exactly right!','initMoney (all levels)');
const SKIP_LINES=new Set([1408]),DROP=new Set(["🔇 Muted"]);
const FB=[];{const re=/showFeedback(\)\(|\()/g;let m;while((m=re.exec(SRC))){const pre=SRC.slice(Math.max(0,m.index-9),m.index);if(pre.endsWith('function '))continue;const st=m.index+m[0].length;let i=st,d=0;while(i<SRC.length){const c=SRC[i];if(c==='"'||c==="'"||c==='`'){i=skipStr(SRC,i);continue;}if('([{'.includes(c))d++;else if(')]}'.includes(c)){if(!d)break;d--;}else if(c===','&&!d)break;i++;}FB.push({line:lineAt(m.index),code:SRC.slice(st,i).trim()});}}
const fnAt=line=>{for(let l=line;l>0;l--){const ms=[...SRC.slice(LS[l-1],l===line?SRC.indexOf("showFeedback",LS[l-1]):(LS[l]||SRC.length)).matchAll(/function\s+([\w$]+)\s*\(/g)];if(ms.length)return ms[ms.length-1][1];}return "?";};
function lits(code){const out=[];let dyn=false,i=0,toks=[],par=[],pairs=[];while(i<code.length){const c=code[i];if(c==="\""||c==="'"||c==="`"){const e=skipStr(code,i),raw=code.slice(i,e);toks.push({s:i,e,raw,interp:c==="`"&&/\$\{/.test(raw)});i=e;continue;}c==="("?par.push(i):c===")"&&pairs.push([par.pop(),i]);i++;}if(!toks.length)dyn=true;const pv=p=>code.slice(0,p).replace(/\s+$/,""),nx=p=>code.slice(p).replace(/^\s+/,"");const ok=(s0,e0)=>{const b=pv(s0),a=nx(e0),pb=b.slice(-1),na=a[0];if(!((!pb||"(?:,".includes(pb))&&(!na||"):,".includes(na))))return false;const g=pairs.filter(([o,c])=>o<s0&&c>=e0).sort((x,y)=>y[0]-x[0])[0];if(!g)return true;const bb=pv(g[0]);if(/[\w$\]]$/.test(bb))return false;return ok(g[0],g[1]+1);};toks.forEach(t=>{if(t.interp||!ok(t.s,t.e)){dyn=true;return;}out.push(new Function("return "+t.raw)());});if(/^[\w.$]+$/.test(code))dyn=true;return {out:out.filter(x=>!DROP.has(x)),dyn};}
const MANUAL=[
['`🏆 ACHIEVEMENT: ${a.ic} ${a.name}`',()=>ACH.map(a=>`🏆 ACHIEVEMENT: ${a.ic} ${a.name}`)],
['`🏆 ${hit} traces!`',()=>[10,25,50,100,200].map(h=>`🏆 ${h} traces!`)],
['`${matchCombo}x Combo! 🔥`',()=>['3x Combo! 🔥']],
["'🏆 '+label+' '+g.score+'/10!'",()=>['Letter Catch','Rhyme Time','Sight Words'].flatMap(l=>[9,10].map(s=>'🏆 '+l+' '+s+'/10!'))],
['msg@Speedy Turtle',()=>['Speedy Turtle! 🐢💨','Happy Hippo! 🦛']],
['msg@patStreak>=10',()=>['Pattern Found! ✨']],
["all?'🌟 You really understood it!':`Good reading! ${score}/${qs.length}`",()=>['🌟 You really understood it!',...[...new Set(Object.values(STORYQ).map(q=>q.length))].flatMap(n=>range(0,n-1).map(s=>`Good reading! ${s}/${n}`))]],
['`🏆 ${hit} stories read!`',()=>[5,10,25,50].map(h=>`🏆 ${h} stories read!`)],
['`🏆 ${filtered[i]} tile!`',()=>[512,1024,2048,4096,8192].map(v=>`🏆 ${v} tile!`)],
['`${filtered[i]}! ✨`',()=>[512,1024,2048,4096,8192].map(v=>`${v}! ✨`)],
['`Big! +${cluster.length*cluster.length} ✨`',()=>[8,9,10,11].map(n=>`Big! +${n*n} ✨`)],
['`Nice +${cluster.length*cluster.length}`',()=>[5,6,7].map(n=>`Nice +${n*n}`)],
['`❌ Whack the ${target} — that was a ${wasContent}! −1`',()=>MOLES.flatMap(t=>MOLES.filter(x=>x!==t).map(w=>`❌ Whack the ${t} — that was a ${w}! −1`))],
...[['Color Mixer','🎨'],['Find It','🔍'],['Pet Care','🐾'],['Count It','🔢'],['Bubble Pop','🫧']].map(([n,e])=>[n+': ${score}/${',()=>range(0,10).map(s=>`${n}: ${s}/10 ${e}`)]),
['`Same/Different: ${score}/${TOTAL}`',()=>range(0,10).map(s=>`Same/Different: ${s}/10`)],
['`Yes! ${curMix.rName}! ✨`',()=>MIXES.map(m=>`Yes! ${m.rName}! ✨`)],
["`It's ${curMix.rName}!`",()=>MIXES.map(m=>`It's ${m.rName}!`)],
['`The pet wanted ${curNeed.action}!`',()=>NEEDS.map(n=>`The pet wanted ${n.action}!`)],
['`Oops! Leave the ${d.textContent}!`',()=>KEEP.map(k=>`Oops! Leave the ${k}!`)],
['`${emoji} Put away!`',()=>DISH_TYPES.map(t=>`${t[1]} Put away!`)],
['`Not the ${name.toLowerCase()} shelf — try again!`',()=>DISH_TYPES.map(t=>`Not the ${t[0].toLowerCase()} shelf — try again!`)],
['`🏆 ${hit} dishes done!`',()=>[10,25,50,100,200].map(h=>`🏆 ${h} dishes done!`)],
['`🏆 ${hit} clocks read!`',()=>[10,25,50,100].map(h=>`🏆 ${h} clocks read!`)],
['`🏆 ${hit} purchases!`',()=>[10,25,50,100].map(h=>`🏆 ${h} purchases!`)],
['`🏆 ${hit} circuits built! ⚡`',()=>[5,10,25,50,100].map(h=>`🏆 ${h} circuits built! ⚡`)],
['`✗ Answer: ${q.a}`',()=>[]],
["stpDir==='word'?`Word was ${w.n}!`:`Ink was ${ink.n}!`",()=>STROOP.flatMap(c=>[`Word was ${c.n}!`,`Ink was ${c.n}!`])],
['`Tapped ${c.n}, was ${target.n}`',()=>RXT.flatMap(c=>RXT.filter(x=>x!==c).map(t=>`Tapped ${c.n}, was ${t.n}`))],
['_tier(dt).msg',()=>[100,200,250,300,400].map(ms=>RXT_TIER(ms).msg)],
['t.msg@const t=_tier(dt)',()=>[100,200,250,300,400].map(ms=>RXT_TIER(ms).msg)],
['`First letter: ${firstLetter}`',()=>[...new Set(AGM.flat().map(w=>w.w[0]))].sort().map(l=>`First letter: ${l}`)],
["`It's ${correct}`",()=>(GEO[1]||[]).map(c=>`It's ${c.country}`)],
['`🔥 ${streak} streak!`',()=>[5,10,20].map(s=>`🔥 ${s} streak!`)],
['`Combo! ${combo}×`',()=>['Combo! 3×']],
['`SUPER COMBO! ${combo}×`',()=>['SUPER COMBO! 5×']],
['`MEGA COMBO! ${combo}× 🔥`',()=>['MEGA COMBO! 8× 🔥']],
["p.type.toUpperCase()+'!'",()=>['WIDE!','EXTRA!','MULTI!']],
['`CPU wins set ${pWins+cWins}!`',()=>[1,2,3].map(n=>`CPU wins set ${n}!`)],
['`You win set ${pWins+cWins}! 🎉`',()=>[1,2,3].map(n=>`You win set ${n}! 🎉`)],
['`Speed Up! ${medal()}`',()=>['🏆','🥇','🥈','🥉',''].map(m=>`Speed Up! ${m}`)],
['`🎖️ ${a.name}`',()=>idleAch.flat().map(n=>`🎖️ ${n}`)],
["(other===1?'You':'AI')+' pass — no moves'",()=>['You pass — no moves','AI pass — no moves']],
['`Not that one — ${lives} ❤️ left`',()=>[1,2].map(n=>`Not that one — ${n} ❤️ left`)],
['`🏆 ALL ${_RXN_TOTAL} REACTIONS DISCOVERED! ⚗️`',()=>[`🏆 ALL ${RXN_TOTAL} REACTIONS DISCOVERED! ⚗️`]],
['`✨ New reaction! (${set.size}/${_RXN_TOTAL})`',()=>range(1,RXN_TOTAL-1).map(k=>`✨ New reaction! (${k}/${RXN_TOTAL})`)],
["'📜 Quest complete: '+def.t+'! +20 XP +15 🪙'",()=>ADV_QPOOL.map(q=>'📜 Quest complete: '+q.t+'! +20 XP +15 🪙')],
["'🧪 Potion added! ('+advS.pot+'/3)'",()=>[1,2,3].map(n=>'🧪 Potion added! ('+n+'/3)')],
["g[0]+' '+g[1]+' equipped!'",()=>[...ADV_GEAR.w,...ADV_GEAR.a].map(g=>g[0]+' '+g[1]+' equipped!')],
["'✓ Span '+span+'!'",()=>range(2,12).map(n=>'✓ Span '+n+'!')]
];
const lineTxt=l=>SRC.slice(LS[Math.max(0,l-4)],LS[l]||SRC.length);
const NOTES=[["Awesome! (#","per-session counter cnt is unbounded; suggest a fixed \"Awesome!\" clip and drop the counter from speech"],["Correct! ⏰ (#","unbounded counter; the fixed speakSeq clip \"Correct! N o'clock!\" already covers this moment; suggest speaking only \"Correct!\""],["Perfect! 💵 (#","unbounded counter; speakSeq already says \"Perfect! Exactly right!\""],["Circuit works! (#","unbounded counter"],["Welcome, ${nm}","free-text profile name"],["room #","vacuum time in seconds and room counter unbounded; tier text has 6 variants"],["(${dCnt} total)","running dish total unbounded"],["${matchTime}s, ${matchMoves} moves","time/moves unbounded; speakSeq([bonus]) already speaks the 3 bonus phrases"],["'🎲 '+","label comes from the DOM game button text (index.html), not learn-app.js data"],["HUGE POP!","cluster size >=12 squared, depends on board size"]];
FB.forEach(f=>{if(SKIP_LINES.has(f.line)||f.code==='m')return;const src='showFeedback L1 '+fnAt(f.line)+':'+f.line,{out,dyn}=lits(f.code);adds(out,src);const man=MANUAL.find(([k])=>{const [code,ctx]=k.split('@');return ctx?f.code===code&&lineTxt(f.line).includes(ctx):f.code.includes(code);});man?adds(man[1](),src+' (enumerated)'):dyn&&tpl(src,f.code,(NOTES.find(([k])=>f.code.includes(k))||[0,''])[1]||'dynamic value (score/time/moves/count/name/etc.) not enumerated; literal branches were added to lines');});
tpl('showFeedback via window._learnApi.feedback','feedback:(m,c)=>showFeedback(m,c)','Called by learn-hub.js / mod-*.js modules with their own strings; outside learn-app.js, not enumerated.');
tpl('window._learnApi.speak / speakSeq','speak:t=>speakText(t),speakSeq:a=>speakSeq(a)','learn-hub.js and mod-kids.js / mod-world.js / mod-mature.js / mod-music.js speak through this API; outside learn-app.js, not enumerated.');
tpl('quiz mystate','AmniStateStudies[AmniStd.state()] (learn-state-studies.js)','Only levels 2-3 exist, so at L1 the pool is empty and nothing is spoken; at L2-3 there are no isAudio items, so the quiz never auto-speaks. Not enumerated.');
const E='\\u{1F000}-\\u{1FAFF}\\u{2190}-\\u{2BFF}\\u{2600}-\\u{27BF}\\u{FE00}-\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}\\u{200D}',EMO=new RegExp('['+E+']','u');
const ACRO=new Set(['I','A','OK','TV','DNA','USA','UK','US','NASA','CPU','AI','XP','UFO','ATM','CEO','EU','UN','TNT','ID','CD','DVD','PE','PM','AM','SOS','LED','GPS','RNA','HIV','FBI','CIA','NBA','NFL','MLB','NHL','FIFA','WWII','WWI','BCE','CE','BC','AD','ABC','II','III','IV','VI','VII','VIII','IX','XI','XII','CPS','NY','DC','UV','CO','PH','MRI','CT','ER','ISS','HD','AC','DC','PSI','KG','RAM','ROM','USB','HTML','CSS','URL','WWW','IQ','NATO','UNESCO','OPEC','MVP','VIP','RSVP','TNT','STEM','NBA','WNBA','NCAA','GDP','EPA','IRS','SAT','ACT','AP','IOU','DIY']);
const CAPS=/(?<![\p{L}\d])[\p{Lu}][\p{Lu}'’]+(?![\p{L}])/gu,title=w=>w.charAt(0)+w.slice(1).toLowerCase();
const phrasing=[];
[...map.values()].forEach(({t,src})=>{const c=ttsClean(t),iss=[];
!c&&iss.push('only symbols/emoji: cleaned to empty, nothing is spoken');
new RegExp("[\\p{L}\\d]\\s*["+E+"]+\\s*([!?.,;:)—–]|$)","u").test(t.replace(new RegExp("\\s*["+E+"\\s]+$","u"),""))&&iss.push("emoji stands in for a word and is silently stripped (sentence has a gap)");
/^[A-Za-z]$/.test(c)&&iss.push('single letter: TTS may read "A" as the article "uh" or swallow it');
const caps=[...new Set((c.match(CAPS)||[]).filter(w=>!ACRO.has(w.replace(/['’]S$/,''))))];caps.length&&iss.push('ALL CAPS: '+caps.slice(0,8).join(', ')+(caps.length>8?' …':'')+' (some voices spell out or over-stress caps)');
/\b\d+(st|nd|rd|th)\b/i.test(c)&&iss.push('ordinal like 1st/3rd');
/[\p{L}]\/[\p{L}]|\d\/\D|\D\/\d/u.test(c)&&iss.push('slash left after cleaning (read as "slash")');
/\b\d+\/\d+\b/.test(c)&&iss.push('score fraction n/m');
const sy=[...new Set(c.match(/[×÷−≠≈≤≥<>~#*|\\^_@∝πμλΔΣΩ½¼¾⅓]/g)||[])];sy.length&&iss.push('symbol not handled by _ttsClean: '+sy.join(' '));
/(^|\s)[+\-]\d/.test(c)&&iss.push('signed number like +5 / -3');
/\b\d+x(?=\s+\p{L}|\s*[!]|$)/u.test(c)&&iss.push('"Nx" multiplier read as "N ex"');
/(\+\d{1,3}s\b|\b\d{1,3}s!|\b(for|in) \d{1,3}s\b|\d{1,3}s,)/.test(c)&&iss.push('"Ns" seconds abbreviation');
/\b\d+ms\b/.test(c)&&iss.push('"ms" abbreviation');
/[•·]/.test(c)&&iss.push('bullet/middle-dot separator');
/(^|\s)(e\.g\.|i\.e\.|etc\.|vs\.?|approx\.?|Dr\.|Mr\.|Mrs\.|St\.|Mt\.)(\s|$)/.test(c)&&iss.push('abbreviation (e.g./i.e./etc./vs./Dr.)');
/\(\s*\)/.test(c)&&iss.push('empty parentheses after emoji removal');
/\b(the|a|an|was|wanted)\s*[!.?]/.test(c)&&iss.push('dangling article/verb where an emoji was removed');
/[→←↑↓⇒↔]/.test(t)&&iss.push('arrow silently dropped ("A → B" reads "A B")');
/.\s*[✓✗✔✘]/.test(t.trim())&&iss.push('check/cross mark mid-string silently dropped');
const scoreFr=/\b\d+\/\d+\b/.test(t)&&src.some(x=>/^showFeedback/.test(x));scoreFr&&iss.push('score "n/m" is turned into a fraction by _ttsClean ("7/10" is read "7 tenths", "1/3" "one third")');
if(!iss.length)return;
let s=(scoreFr?ttsClean(t.replace(/\b(\d+)\/(\d+)\b/g,'$1 out of $2')):(c||t)).replace(/\bplus (\d{1,3})s\b/g,'plus $1 seconds').replace(CAPS,w=>ACRO.has(w.replace(/['’]S$/,''))?w:title(w)).replace(/\b(\d+)x(?=\s+\p{L}|\s*!|$)/gu,'$1 times').replace(/\b(\d+)ms\b/g,'$1 milliseconds').replace(/(\+?\d{1,3})s(?=!|,|\s|$)(?<=(?:\+|for |in )\d{1,3}s)/g,'$1 seconds').replace(/(^|\s)\+(\d)/g,'$1plus $2').replace(/(^|\s)[-−](\d)/g,'$1minus $2').replace(/\s*[•·]\s*/g,', ').replace(/#(\d)/g,'number $1').replace(/\b(\d+)\/(\d+)\b/g,'$1 out of $2').replace(/([\p{L}])\/([\p{L}])/gu,'$1 or $2').replace(/(\d+)\s*×(?!\s*\d)/g,'$1 times').replace(/~\s*/g,'about ').replace(/≈/g,'about').replace(/\s*<\s*/g,' is less than ').replace(/\s*>\s*/g,' is greater than ').replace(/\s*∝\s*/g,' is proportional to ').replace(/π/g,'pi').replace(/μm/g,'micrometers').replace(/(^|\s)vs\.?(\s)/g,'$1versus$2').replace(/\be\.g\./g,'for example').replace(/\bi\.e\./g,'that is').replace(/\betc\./g,'and so on').replace(/\(\s*\)/g,'').replace(/\s+/g,' ').trim();
t.match(/[→⇒]/)&&(s=t.replace(/\s*[→⇒]\s*/g,', then ').replace(new RegExp('['+E+']','gu'),'').replace(CAPS,w=>ACRO.has(w)?w:title(w)).replace(/\s+/g,' ').trim());
phrasing.push({src:src.join(' | '),text:t,issue:iss.join('; '),suggest:s});});
const OVR={'✅':'Correct!','✅✅':'Both correct!','★':'Star','❤':'Heart','▲':'Triangle','■':'Square','●':'Circle','♦':'Diamond','♣':'Club','♠':'Spade','A':'The letter A','The pet wanted 🍖!':'The pet wanted food!','The pet wanted 💧!':'The pet wanted water!','The pet wanted 🛏️!':'The pet wanted to sleep!','The pet wanted 🎾!':'The pet wanted to play!','The pet wanted 🛁!':'The pet wanted a bath!','🍽️ Put away!':'Plates put away!','🥤 Put away!':'Cups put away!','🥣 Put away!':'Bowls put away!',"They're the SAME!":"They're the same!","They're DIFFERENT!":"They're different!"};
phrasing.forEach(p=>{OVR[p.text]&&(p.suggest=OVR[p.text]);/^Oops! Leave the /.test(p.text)&&(p.suggest='Oops! Leave the toys!');/^❌ Whack the /.test(p.text)&&(p.suggest='Oops! Only whack the '+({'🐹':'hamster','🐰':'bunny','🐭':'mouse','🐿️':'squirrel'}[p.text.match(/Whack the (\S+)/)[1]]||'target')+'!');/^[A-Z]$/.test(p.text)&&(p.suggest='The letter '+p.text);});
const lines=[...map.values()].map(e=>({t:e.t,src:e.src.join(' | ')}));
fs.writeFileSync(OUT,JSON.stringify({lines,templates,phrasing},null,1));
const bySrc={};lines.forEach(l=>{const k=l.src.split(' | ')[0].replace(/:\d+.*$/,'').replace(/ \(.*$/,'').replace(/ L\d.*$/,'');bySrc[k]=(bySrc[k]||0)+1;});
console.log(JSON.stringify({lines:lines.length,templates:templates.length,phrasing:phrasing.length,chars:lines.reduce((a,l)=>a+l.t.length,0),top:Object.entries(bySrc).sort((a,b)=>b[1]-a[1]).slice(0,25)},null,1));
