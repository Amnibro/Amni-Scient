const S=require('../learn-standards.js'),SS=(require('../learn-state-studies.js'),globalThis.AmniStateStudies);
let fails=0,checks=0;
const ok=(c,m)=>{checks++;c?0:(fails++,fails<=4000?console.log('FAIL',m):0)};
const nums=t=>(String(t).match(/\d+(\.\d+)?/g)||[]).map(Number);
const evalExpr=t=>{const m=String(t).match(/^\(?(\d+(?:\.\d+)?) ([+−×÷]) (\d+(?:\.\d+)?)\)? = \?$/);return m?{'+':(a,b)=>a+b,'−':(a,b)=>a-b,'×':(a,b)=>a*b,'÷':(a,b)=>a/b}[m[2]](+m[1],+m[3]):null};
const CAP={P:{FL:8,TX:5,NY:5},K:20,1:120,2:1000},STS=['NY','FL','TX'],NYD4=[2,3,4,5,6,8,10,12,100],dens=t=>(String(t).match(/\/(\d+)/g)||[]).map(d=>+d.slice(1));
for(const st of STS)for(const g of ['P','K','1','2','3','4','5']){
  const r=S._rng(1234+g.charCodeAt(0)+(st==='TX'?7:st==='NY'?14:0)),seen=new Set();
  for(let i=0;i<4000;i++){
    const p=S.mathProblem(g,r,st),tag=`${st} ${g} ${p.sk} "${p.text.split('\n')[0]}"`;seen.add(p.sk);
    ok(Array.isArray(p.choices)&&p.choices.length>=2&&p.choices.length<=4,'choice count '+tag+' '+JSON.stringify(p.choices));
    ok(p.choices.some(c=>String(c)===String(p.ans)),'answer missing from choices '+tag);
    ok(new Set(p.choices.map(String)).size===p.choices.length,'duplicate choices '+tag+' '+JSON.stringify(p.choices));
    ok(p.choices.every(c=>typeof c==='string'||c>=0),'negative choice '+tag);
    ok(Array.isArray(p.std),'std missing '+tag);
    ok(S.SKILL_NAMES[p.sk],'skill name missing '+p.sk);
    ok(S.STD[p.sk]&&S.STD[p.sk][st]&&(st==='TX'||S.STD[p.sk][st].length),'codes missing '+tag);
    p.sk==='divRemainder'?(()=>{const[A,B]=nums(p.text),q=+String(p.ans).split(' ')[0],rm=+(String(p.ans).match(/R(\d+)|(\d+)\//)||[]).slice(1).find(x=>x!==undefined);ok(q*B+rm===A&&rm<B,'remainder math '+tag+' '+p.ans)})():0;
    const v=p.sk==='divRemainder'?null:evalExpr(p.text);v!==null?ok(Math.abs(v-Number(p.ans))<1e-9,'wrong answer '+tag+' ans='+p.ans+' expected '+v):0;
    /[PK12]/.test(g)?ok(!/[×÷]/.test(p.text),'× or ÷ before Grade 3 '+tag):0;
    g==='P'?ok(!/[+−=]/.test(p.text),'symbols in Pre-K '+tag):0;
    g==='P'&&p.op?ok(p.a+(p.op==='+'?p.b:0)<=CAP.P[st],'Pre-K join/separate over cap '+tag):0;
    g==='K'?ok(nums(p.text).every(n=>n<=100)&&(p.op?Number(p.ans)<=10:true),'K range '+tag):0;
    g==='1'?ok(nums(p.text).every(n=>n<=120),'Grade 1 range '+tag):0;
    g==='2'?ok(nums(p.text).every(n=>n<=1000)&&!/\//.test(p.text),'Grade 2 range or fraction notation '+tag):0;
    /[PK123]/.test(g)?ok(!/\d\.\d/.test(p.text+' '+p.ans),'decimals before Grade 4 '+tag):0;
    g==='3'&&p.sk==='multFacts'?ok(nums(p.text).slice(0,2).every(n=>n<=(st==='FL'?12:10)),'Grade 3 fact cap '+tag):0;
    g==='3'&&st!=='FL'&&/\//.test(p.text+p.ans)?ok(nums((p.text+' '+p.ans).replace(/\d+\/(\d+)/g,' $1 ')).length&&((p.text+' '+p.ans).match(/\/(\d+)/g)||[]).every(d=>[2,3,4,6,8].includes(+d.slice(1))),st+' Grade 3 denominator '+tag):0;
    g==='3'?ok(!/R\d/.test(String(p.ans)),'remainder in Grade 3 '+tag):0;
    g==='4'&&p.sk==='divRemainder'?ok(st==='FL'?/^\d+ \d+\/\d+$/.test(p.ans):/^\d+ R\d+$/.test(p.ans),'remainder format '+tag+' '+p.ans):0;
    g==='4'?ok(!/\d+\/\d+ [+−] \d+\/\d+/.test(p.text)||(()=>{const d=(p.text.match(/\/(\d+)/g)||[]).map(x=>x.slice(1));return d.length<2||d[0]===d[1]})(),'unlike denominators in Grade 4 '+tag):0;
    st==='NY'?(()=>{const n=nums(p.text),t=p.text+' '+p.ans;
      g==='P'&&p.sk==='compare10'?ok(n.every(x=>x<=5),'NY Pre-K compare over 5 '+tag):0;
      g==='K'?ok(p.sk!=='compare20'&&(p.sk!=='compareK10'||n.every(x=>x>=1&&x<=10)),'NY K compare within 1-10 '+tag):0;
      g==='1'?ok(p.sk!=='skipCount','NY Grade 1 skip counting '+tag):0;g==='2'&&p.sk==='skipCount2'?ok(n.every(x=>x%5===0),'NY Grade 2 skip steps '+tag):0;
      g==='2'&&p.sk==='oddEven'?ok(n[0]<=20,'NY Grade 2 odd/even over 20 '+tag):0;
      g==='2'?ok(p.sk!=='round10','NY Grade 2 rounding '+tag):0;
      g==='3'&&/^\d+ × \d+ = \?$/.test(p.text)?ok(n.slice(0,2).every(x=>x<=10||x%10===0&&x<=90),'NY Grade 3 multiplication size '+tag):0;
      g==='4'?ok(dens(t).every(d=>NYD4.includes(d)),'NY Grade 4 denominator '+tag):0;
      g==='4'&&p.sk==='factorsMultiples'?ok(n[1]<=100,'NY Grade 4 factor range '+tag):0;
      g==='4'&&p.sk==='multMulti4'?ok(n[0]<100&&n[1]<100||n[0]<10000&&n[1]<10,'NY Grade 4 multiplication size '+tag):0;
      g==='5'&&p.sk==='decimalOps'?ok(!/\.\d{3}/.test(t),'NY Grade 5 decimals past hundredths '+tag):0;
      g==='5'?ok(p.sk!=='primeComposite','NY Grade 5 primes '+tag):0})():0;
  }
  ok(seen.size>=Math.min(4,S.MIX[g].length),`${st} ${g} variety ${seen.size}`);
}
for(const st of STS)for(const g of ['K','1','2','3','4','5']){const r=S._rng(99);for(let i=0;i<500;i++){const h=1+Math.floor(r()*12),m=S.clockMinutes(g,st,r),c=S.clockChoices(h,m,g,st,r),okStr=`${h}:${String(m).padStart(2,'0')}`;ok(m>=0&&m<60,'minute range');ok(c.includes(okStr)&&new Set(c).size===c.length&&c.length===4,`clock choices ${st} ${g} ${okStr} ${c}`);g==='K'?ok(m===0,'K hours only'):0;g==='1'?ok(m%30===0,'Grade 1 hour/half'):0;g==='2'&&st!=='TX'?ok(m%5===0,st+' Grade 2 five minutes'):0;}}
for(const st of STS)for(const g of ['P','K','1','2','3','4','5']){const sk=S.skillsFor(g,st);ok(sk.length>=3,'skills map '+st+g);sk.forEach(x=>ok(x.name&&Array.isArray(x.codes),'skill row '+st+g+x.sk))}
ok(S.state()==='NY','default state is NY');ok(Object.keys(S.STATES).length===51&&['NY','FL','TX'].every(k=>S.fam(k)===k),'all states listed');ok(Object.keys(S.STATES).filter(k=>S.fam(k)==='CC').every(k=>S.fw(k).m&&Object.keys(S.STD).every(x=>Array.isArray(S.STD[x].CC))),'Common Core fallback for other states');ok(STS.every(k=>S.FRAMEWORK[k]&&S.FRAMEWORK[k].P&&S.FRAMEWORK[k].m&&S.FRAMEWORK[k].e),'framework labels');
Object.entries(S.STD).forEach(([k,v])=>STS.forEach(st=>ok(Array.isArray(v[st]),'STD '+k+' missing '+st)));
ok(['K','1','2','3'].every(g=>S.moneyTier(g,'NY')===1)&&S.moneyTier('3','FL')===2&&S.moneyTier('3','TX')===2&&S.moneyTier('4','NY')===3,'money tiers');
ok(S.phonicsWords('K','NY').length===S.phonicsWords('K','FL').length,'NY K phonics is CVC only');
for(const st of STS){const d=SS[st];ok(d&&d.title===S.STATES[st]+' Studies','studies title '+st);for(const lv of [2,3]){const qs=d[lv]||[];ok(qs.length>=(st==='NY'?(lv===2?26:32):20),'studies count '+st+lv);ok(new Set(qs.map(q=>q.q)).size===qs.length,'duplicate study question '+st+lv);qs.forEach(q=>{const t=st+lv+' "'+q.q+'"';ok(q.q&&q.a&&q.explain&&q.std,'study fields '+t);ok(Array.isArray(q.wrong)&&q.wrong.length===3&&new Set(q.wrong).size===3,'3 unique wrong answers '+t);ok(!q.wrong.includes(q.a),'answer among wrongs '+t);st==='NY'&&lv===3?ok(/^4\.[1-7][a-g]$/.test(q.std),'NY framework code '+t+' '+q.std):0})}}
console.log(fails?`${fails} of ${checks} checks failed`:`all ${checks} checks passed`);process.exit(fails?1:0);
