const path=require('path');
global.window={};global.document={currentScript:null};
let mod=null;window.AmniHub={category(){},register(m){mod=m}};
require(path.join(__dirname,'..','testbank-ny.js'));
require(path.join(__dirname,'..','mod-testprep.js'));
const B=window.AmniTestBank,{val,right}=mod;
let fails=0,checks=0;
const ok=(c,m)=>{checks++;c?0:(fails++,console.log('FAIL',m))};
const near=(a,b)=>Math.abs(a-b)<1e-7;
const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'};
const MATH=/^[\d\s+\-−×÷*/().,{}\[\]|²³⁴⁵⁰¹⁶⁷⁸⁹⁻∛√]+(=\s*\?)?$/;
const ev=s=>{let e=String(s).replace(/=\s*\?$/,'').replace(/,(?=\d{3})/g,'').replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/[{[]/g,'(').replace(/[}\]]/g,')').replace(/\|([^|]+)\|/g,'Math.abs($1)').replace(/∛(\d+)/g,'Math.cbrt($1)').replace(/√(\d+)/g,'Math.sqrt($1)').replace(/(\d+(?:\.\d+)?)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g,(m,b,p)=>`(${b}**(${[...p].map(c=>SUP[c]).join('')}))`).replace(/(\d+) (\d+)\/(\d+)/g,'($1+$2/$3)').replace(/(\d+(?:\.\d+)?)\/(\d+)/g,'($1/$2)');e=e.replace(/(\d)\s*\(/g,'$1*(').replace(/\)\s*\(/g,')*(');try{return /^[\d\s+\-*/().Mathabscbrtsqr]+$/.test(e)?Function('return '+e)():NaN}catch{return NaN}};
const lead=s=>val(String(s).replace(/^\$/,'').replace(/ (?=[a-z(]).*$/i,''));
const gcd=(a,b)=>b?gcd(b,a%b):a;
const EXP=[
['ny-g3-math','5 groups of 4',null],['ny-g3-math','24 stickers',24/4],['ny-g3-math','boxes of 8',7*8],['ny-g3-math','9 × ☐',63/9],['ny-g3-math','Sam has 50',50-3*9],['ny-g3-math','tables with 7',4*7+3],['ny-g3-math','374 rounded',Math.round(374/10)*10],['ny-g3-math','Round 851',Math.round(851/100)*100],['ny-g3-math','8/4',8/4],['ny-g3-math','flour each',3*4],['ny-g3-math','grapes than bananas',10-4],['ny-g3-math','7 centimeters long',7*4],['ny-g3-math','sides that are 9',4*9],['ny-g3-math','What fraction of the rectangle',3/4],['ny-g3-math','point P show',2/3],['ny-g3-math','Which fraction is equal to 1/2',1/2],['ny-g3-math','circle is divided into 8',1/8],
['ny-g4-math','giraffe',3*4],['ny-g4-math','12 boxes of pencils',12*24-150],['ny-g4-math','fewest number of vans',Math.ceil(53/8)],['ny-g4-math','Round 287,512',Math.round(287512/1000)*1000],['ny-g4-math','Ana ran',2+3/4+1+2/4],['ny-g4-math','jug holds',2*1000],['ny-g4-math','rug',54/9],['ny-g4-math','made of two smaller angles',35+50],['ny-g4-math','equivalent to 3/4',3/4],['ny-g4-math','equal to 7/100',7/100],
['ny-g5-math','Round 12.384',Math.round(123.84)/10],['ny-g5-math','1/5-cup',4/(1/5)],['ny-g5-math','3.5 feet',3.5*12],['ny-g5-math','5 cm long, 4 cm wide',5*4*3],['ny-g5-math','two rectangular prisms',24+2*3*5],['ny-g5-math','Jen walked',3/4-2/5],['ny-g5-math','Four friends',3/4],['ny-g5-math','3/4 yard long',3/4*2/3],['ny-g5-math','3 + 0.4 + 0.007',3+0.4+0.007],['ny-g5-math','equal to 10⁴',1e4],
['ny-g6-math','150 miles',150/3],['ny-g6-math','8 pens',4.40/8*5],['ny-g6-math','35% of 80',0.35*80],['ny-g6-math','18 is 30%',18/0.3],['ny-g6-math','greatest common factor of 36 and 48',gcd(36,48)],['ny-g6-math','(−3, 4) and (5, 4)',5-(-3)],['ny-g6-math','Evaluate 3x²',3*5**2-4],['ny-g6-math','base of 10 cm',10*7/2],['ny-g6-math','2 1/2 in',2.5*4*3],['ny-g6-math','mean of this',(12+15+9+20+14)/5],['ny-g6-math','median of this',(4+8)/2],['ny-g6-math','temperature is 8 degrees',-8],
['ny-g7-math','snail',(1/2)/(1/4)],['ny-g7-math','y = 21 when x = 3',21/3],['ny-g7-math','jacket',80*0.75],['ny-g7-math','meal costs',0.18*40],['ny-g7-math','population grew',(2300-2000)/2000*100],['ny-g7-math','At 7 a.m.',-5+12-4],['ny-g7-math','radius of 5 cm',3.14*5*5],['ny-g7-math','diameter of 10',3.14*10],['ny-g7-math','supplementary',180-115],['ny-g7-math','surface area of a cube',6*4*4],['ny-g7-math','triangular prism',0.5*5*4*9],['ny-g7-math','coin is flipped',1/12],['ny-g7-math','marbles',5/(3+5+2)],
['ny-g8-math','slope of the line through',(12-3)/(5-2)],['ny-g8-math','gym charges',25+15*8],['ny-g8-math','48° and 67°',180-48-67],['ny-g8-math','legs that are 9',Math.hypot(9,12)],['ny-g8-math','13-foot ladder',Math.sqrt(13*13-5*5)],['ny-g8-math','(1, 2) and (7, 10)',Math.hypot(6,8)],['ny-g8-math','cylinder',3.14*3*3*10],
['ny-g5-science','total mass, in grams',200+25],['ny-g8-science','total mass, in grams',12+40],['ny-g8-science','cyclist',45/3],['ny-g8-science','Two Tt plants',100/4]];
const SUBJ=new Set(['math','ela','science','social']),ids=new Set(),STD={math:/^NY-[3-8]\.(OA|NBT|NF|MD|G|RP|NS|EE|F|SP)\.\d+[a-z]?$/,ela:/^NY-[3-8]\.(R|L|W)\.\d+$/,science:/^(\d|3-5|MS)-(PS|LS|ESS|ETS)\d-\d+$/};
ok(Array.isArray(B)&&B.length===14,'expected 14 NY tests, got '+(B&&B.length));
for(const t of B){
 const tag=t.id;ok(!ids.has(t.id),'duplicate id '+tag);ids.add(t.id);
 ok(t.state==='NY'&&typeof t.test==='string'&&t.test&&SUBJ.has(t.subject)&&/^([3-8]|HS)$/.test(t.grade)&&/^[3-8]+$/.test(t.levels)&&t.minutes>0&&t.minutes!==6&&t.intro,'test fields '+tag);
 ok(t.levels===(+t.grade<=5?'3':'4'),'levels mapping '+tag);
 ok(t.source&&t.source.name&&/^https:\/\/www\.nysedregents\.org\//.test(t.source.url),'source '+tag);
 ok(Array.isArray(t.items)&&t.items.length,'items '+tag);
 const g=+t.grade,n=t.items.length;
 t.subject==='math'?ok(n>=(g<=5?25:20),`math count ${tag} ${n}`):0;
 t.subject==='ela'?(()=>{const ps=Object.keys(t.passages||{});ok(g<=5?ps.length===2:ps.length>=1,'ela passage count '+tag);ps.forEach(p=>{const c=t.items.filter(i=>i.passage===p).length;ok(g<=5?c>=7&&c<=8:c>=7,`ela questions for ${p} in ${tag}: ${c}`)})})():0;
 const pos={};let mcs=0;
 t.items.forEach((it,k)=>{
  const q=`${tag}#${k+1} "${String(it.q).slice(0,60).replace(/\n/g,' ')}"`;
  ok(typeof it.q==='string'&&it.q.trim()&&typeof it.explain==='string'&&it.explain.length>10,'q/explain '+q);
  ok(typeof it.std==='string'&&STD[t.subject].test(it.std),'std format '+q+' '+it.std);
  ok(!/\bNaN\b|undefined/.test(it.q+it.explain+(it.choices||[]).join('|')),'NaN/undefined text '+q);
  it.type==='mc'?(ok(Array.isArray(it.choices)&&it.choices.length===4,'mc choices '+q),ok(Number.isInteger(it.a)&&it.a>=0&&it.a<it.choices.length,'mc a range '+q),ok(new Set(it.choices.map(c=>c.trim().toLowerCase())).size===it.choices.length,'unique choices '+q),mcs++,pos[it.a]=(pos[it.a]||0)+1,ok(right(it,it.a)&&!it.choices.some((c,j)=>j!==it.a&&right(it,j)),'engine grades key '+q)):
  it.type==='multi'?(ok(Array.isArray(it.choices)&&it.choices.length>=4,'multi choices '+q),ok(Array.isArray(it.a)&&it.a.length>=2&&it.a.length<it.choices.length&&new Set(it.a).size===it.a.length&&it.a.every(x=>Number.isInteger(x)&&x>=0&&x<it.choices.length),'multi a '+q),ok(new Set(it.choices).size===it.choices.length,'unique choices '+q),ok(right(it,it.a.slice().reverse())&&!right(it,it.a.slice(1)),'engine multi grading '+q)):
  it.type==='num'?(ok(Number.isFinite(val(it.a)),'num a parse '+q+' '+it.a),ok(right(it,String(it.a))&&!right(it,String(val(it.a)+1)),'engine num grading '+q)):ok(0,'bad type '+q);
  it.passage?ok(t.passages&&t.passages[it.passage]&&t.passages[it.passage].title&&t.passages[it.passage].text.length>300&&t.passages[it.passage].credit,'passage '+q):0;
  it.img?ok(/^<svg[\s\S]*<\/svg>$/.test(it.img)&&/aria-label="/.test(it.img)&&!/<script|on\w+=/i.test(it.img),'img '+q):0;
  const last=it.q.split('\n').pop().trim(),key=it.type==='num'?val(it.a):it.type==='mc'?(MATH.test(it.choices[it.a])?ev(it.choices[it.a]):lead(it.choices[it.a])):NaN;
  MATH.test(last)&&!/☐/.test(last)&&Number.isFinite(ev(last))?ok(near(ev(last),key)||(it.type==='mc'&&near(ev(last),ev(it.choices[it.a]))),`recompute ${q}: ${ev(last)} vs key ${key}`):0;
  /^Evaluate (\S+)\.$/.test(it.q)?ok(near(ev(it.q.match(/^Evaluate (\S+)\.$/)[1]),key),'evaluate '+q):0;
  const eq=it.q.match(/^Solve for ([xy])\.\n(.+=.+)$/);eq&&it.type==='num'?(()=>{const s=eq[2].replace(/−/g,'-').replace(/(\d)\s*\(/g,'$1*(').replace(/(\d)([xy])/g,'$1*$2').replace(/[xy]/g,'('+val(it.a)+')').split('=');ok(near(Function('return '+s[0])(),Function('return '+s[1])()),'equation check '+q)})():0;
 });
 mcs>=7?ok(Object.values(pos).every(c=>c/mcs<=0.5),`answer position balance ${tag} ${JSON.stringify(pos)}`):0;
 t.passages?Object.keys(t.passages).forEach(p=>ok(t.items.some(i=>i.passage===p),'unused passage '+p)):0;
}
for(const [id,sub,exp] of EXP){
 if(exp===null)continue;
 const t=B.find(x=>x.id===id),it=t&&t.items.find(i=>i.q.includes(sub));
 ok(it,`hand check item missing ${id} "${sub}"`);if(!it)continue;
 const got=it.type==='num'?val(it.a):lead(it.choices[it.a]);
 ok(near(got,exp),`hand check ${id} "${sub}": key ${got} expected ${exp}`);
}
[['0.5','1/2'],['.5','1/2'],['1 1/2','3/2'],['-3/2','−1 1/2'],['288,000','288000'],['$2.75','2.75'],['7.20','7.2'],['8/3','2 2/3']].forEach(([x,y])=>ok(near(val(x),val(y)),`equivalent forms ${x} = ${y}`));
['','abc','1/0','1..2','--3'].forEach(x=>ok(!Number.isFinite(val(x)),`rejects "${x}"`));
const tot=B.reduce((s,t)=>s+t.items.length,0);
console.log(B.map(t=>`${t.id}: ${t.items.length}`).join('\n'));
console.log(`${checks} checks, ${fails} failures, ${tot} items`);
process.exit(fails?1:0);
