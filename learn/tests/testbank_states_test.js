const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.join(__dirname,'..'),args=process.argv.slice(2),files=args.length?args:['testbank-regents.js','testbank-states.js'].map(f=>path.join(dir,f));
let fails=0,checks=0;
const ok=(c,m)=>{checks++;c?0:(fails++,fails<=300?console.log('FAIL',m):0)};
const ctx={window:{}};vm.createContext(ctx);
const extra=path.join(dir,'testbank-ny.js'),others=[];
if(!args.length&&fs.existsSync(extra)){const c2={window:{}};vm.createContext(c2);try{vm.runInContext(fs.readFileSync(extra,'utf8'),c2);others.push(...(c2.window.AmniTestBank||[]))}catch(e){console.log('note: testbank-ny.js not loadable yet',e.message)}}
for(const f of files){const src=fs.readFileSync(f,'utf8'),before=(ctx.window.AmniTestBank||[]).length;vm.runInContext(src,ctx,{filename:f});ok((ctx.window.AmniTestBank||[]).length>before,f+' adds tests');ok(!/daemon/i.test(src),f+' says daemon');ok(!/\n\s*\n/.test(src),f+' has empty lines');ok(!/(^|[^:'"])\/\/|\/\*/.test(src.replace(/https?:\/\/|xmlns="[^"]*"/g,'')),f+' has comments')}
const bank=ctx.window.AmniTestBank||[],ids=new Set(others.map(t=>t.id));
const SUBJ=['math','ela','science','social'],TYPES=['mc','num','multi'],LV={3:'3',4:'3',5:'3',6:'4',7:'4',8:'4',HS:'458'};
const parseNum=v=>{const s=String(v).replace(/[$,\s]/g,'').replace(/−/g,'-'),m=s.match(/^(-?\d+)\/(\d+)$/),mm=s.match(/^(-?\d+)(?:_|\+)(\d+)\/(\d+)$/);return m?+m[1]/+m[2]:mm?+mm[1]+ +mm[2]/+mm[3]:s===''?NaN:Number(s)};
const OPS={'+':(a,b)=>a+b,'-':(a,b)=>a-b,'−':(a,b)=>a-b,'×':(a,b)=>a*b,'x':(a,b)=>a*b,'÷':(a,b)=>a/b};
const calc=q=>{const m=String(q).match(/(?:^|[^\d.,\/])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?) ([+\-−×÷]) (\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?: ([+\-−×÷]) (\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?))? ?(?:=\s*(?:\?|_+|□)|\?)/);if(!m)return null;const n=x=>+x.replace(/,/g,'');let v=OPS[m[2]](n(m[1]),n(m[3]));if(m[4]){if('×÷'.includes(m[4])&&'+-−'.includes(m[2]))return null;v=OPS[m[4]](v,n(m[5]))}return v};
let items=0,arith=0;
const counts={};
for(const t of bank){
  const T=t.id||'?';
  ok(typeof t.id==='string'&&/^[a-z0-9-]+$/.test(t.id),T+' id format');ok(!ids.has(t.id),T+' duplicate id');ids.add(t.id);
  ok(/^[A-Z]{2}$/.test(t.state),T+' state');ok(typeof t.test==='string'&&t.test.length>5,T+' test name');ok(SUBJ.includes(t.subject),T+' subject');
  ok(LV[t.grade]!==undefined,T+' grade');ok(t.levels===LV[t.grade],T+' levels '+t.levels+' for grade '+t.grade);
  ok(Number.isInteger(t.minutes)&&t.minutes>0&&!/6/.test(String(t.minutes)),T+' minutes');ok(typeof t.intro==='string'&&t.intro.length>20,T+' intro');
  ok(t.source&&t.source.name&&/^https:\/\/[^\s]+$/.test(t.source.url||''),T+' source');
  const min=t.grade==='HS'?20:15;ok(Array.isArray(t.items)&&t.items.length>=min,T+' item count '+(t.items||[]).length+' < '+min);
  counts[T]=(t.items||[]).length;
  const P=t.passages||{},used=new Set(),qs=new Set();
  for(const[k,p]of Object.entries(P)){ok(p&&p.title&&typeof p.text==='string'&&p.text.length>200,T+' passage '+k+' text');ok(p&&typeof p.credit==='string'&&p.credit.length>3,T+' passage '+k+' credit')}
  (t.items||[]).forEach((it,i)=>{items++;const I=T+'#'+(i+1);
    ok(typeof it.q==='string'&&it.q.length>5,I+' q');ok(!qs.has(it.q),I+' duplicate q');qs.add(it.q);ok(TYPES.includes(it.type),I+' type');
    ok(typeof it.explain==='string'&&it.explain.length>10,I+' explain');ok(typeof it.std==='string'&&it.std.length>1,I+' std');
    it.passage!==undefined?(ok(!!P[it.passage],I+' passage missing '+it.passage),used.add(it.passage)):0;
    it.img!==undefined?ok(/^<svg[\s\S]*<\/svg>$/.test(it.img)&&/viewBox=/.test(it.img),I+' img svg'):0;
    if(it.type==='mc'||it.type==='multi'){const c=it.choices||[];ok(Array.isArray(c)&&c.length>=3&&c.length<=5&&c.every(x=>typeof x==='string'&&x.trim()),I+' choices');ok(new Set(c.map(x=>x.trim().toLowerCase())).size===c.length,I+' duplicate choices')}
    if(it.type==='mc')ok(Number.isInteger(it.a)&&it.a>=0&&it.a<(it.choices||[]).length,I+' a range');
    if(it.type==='multi')ok(Array.isArray(it.a)&&it.a.length>=2&&it.a.length<(it.choices||[]).length&&new Set(it.a).size===it.a.length&&it.a.every(x=>Number.isInteger(x)&&x>=0&&x<it.choices.length),I+' multi a');
    if(it.type==='num'){ok(!it.choices,I+' num has choices');ok(Number.isFinite(parseNum(it.a)),I+' num a parse '+it.a)}
    const v=calc(it.q);if(v!==null&&t.subject==='math'){arith++;const got=it.type==='num'?parseNum(it.a):it.type==='mc'?parseNum(it.choices[it.a]):NaN;Number.isFinite(got)?ok(Math.abs(got-v)<1e-9,I+' arithmetic '+v+' vs '+got):0}
  });
  for(const k of Object.keys(P))ok(used.has(k),T+' unused passage '+k);
}
ok(bank.length>0,'bank non-empty');
console.log(Object.entries(counts).map(([k,v])=>k+':'+v).join(' '));
console.log(`${bank.length} tests, ${items} items, ${arith} arithmetic recomputed, ${checks} checks, ${fails} failures`);
process.exit(fails?1:0);
