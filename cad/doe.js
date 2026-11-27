import {helium} from './he/host.js';
import {METRICS,discover,pickVars,studyGap,guard,measure,setVar} from './optimize.js';
const HE=helium('doe'),QU={mass:'kg',vol:'mm³',len:'mm',stress:'MPa',freq:'Hz',temp:'°C',force:'N'},r5=v=>v==null||!isFinite(v)?null:+(+v).toPrecision(5);
export const DESIGNS={ccd:'Central composite',factorial:'Full factorial',lhs:'Latin hypercube'},MODELS=['constant','linear','interactions','quadratic'],MAXK=7,MAXN=200;
export const nterm=(k,m)=>1+(m>=1?k:0)+(m===3?k:0)+(m>=2?k*(k-1)/2:0);
export const unitOf=m=>(M=>M.q?QU[M.q]:M.u||(m==='tp'?'N/kW':''))(METRICS[m]),designOf=(o,k)=>o.design||(k<=4?'ccd':'lhs');
export function count(o,k){const d=designOf(o,k),lv=Math.max(2,Math.min(7,o.levels|0||3));return d==='ccd'?2**k+2*k+1:d==='factorial'?lv**k:Math.max(k+2,Math.min(MAXN,o.points|0||nterm(k,3)+7));}
export async function layout(o,k){const d=designOf(o,k);if(!DESIGNS[d])throw new Error('design must be one of: '+Object.keys(DESIGNS).join(', '));if(!(k>=1&&k<=MAXK))throw new Error('A design study takes 1 to '+MAXK+' variables; '+k+' were picked.');const n0=count(o,k);if(n0>MAXN)throw new Error('That design needs '+n0+' runs; the limit is '+MAXN+'. Use fewer variables, fewer levels or a Latin hypercube.');
  const H=await HE({}),x=H.ex;x.doe_init();const n=d==='ccd'?x.doe_ccd(k):d==='factorial'?x.doe_ff(Math.max(2,Math.min(7,o.levels|0||3)),k):x.doe_lhs(n0,k,o.seed|0||7,27);return{H,x,d,n,X:Array.from(H.v(3).slice(0,n*k))};}
export function fit(L,k,rows,want=3){const{H,x}=L,n=rows.length;x.doe_size(n,k);H.put(3,rows.flatMap(r=>r.c));H.put(4,rows.map(r=>r.y));const p=x.doe_fit(n,k,want),O=H.v(2),r2=O[1],rmse=O[2],mode=O[3]|0,B=Array.from(H.v(5).slice(0,p)),E=Array.from(H.v(8).slice(0,k)),best=s=>{x.doe_best(n,k,mode,s);return{c:Array.from(H.v(9).slice(0,k)),y:H.v(2)[4]};};return{p,r2,rmse,mode,B,E,min:best(-1),max:best(1)};}
export async function sweep(API,o={},ui={}){const S=API.S,U=API.units,t0=Date.now();await API.waitBuild();if(!S.mesh)throw new Error('Build a part first: there is no solid to study.');
  const ms=[...new Set(o.metrics&&o.metrics.length?o.metrics:['mass'])];for(const m of ms)if(!METRICS[m])throw new Error('Unknown metric "'+m+'". Known: '+Object.keys(METRICS).join(', '));
  const want=o.model==null?3:typeof o.model==='number'?o.model:MODELS.indexOf(o.model);if(!(want>=0&&want<=3))throw new Error('model must be one of: '+MODELS.join(', '));
  const need=new Set(ms.map(m=>METRICS[m].need).filter(Boolean)),gap=studyGap(API,need);if(gap)throw Object.assign(new Error(gap.msg),{tab:gap.tab});
  const all=discover(S.doc,API.FT),V=pickVars(all,o.vars?o.vars.map(v=>({id:v.id,min:v.lo,max:v.hi})):o.variables);if(!V.length)throw new Error(all.length?'Pick at least one size to vary.':'There are no numeric parameters or sizes to vary. Name key sizes as parameters (w = 3.5) first.');
  const k=V.length,L=await layout(o,k),act=c=>V.map((v,j)=>{const a=v.lo+(c[j]+1)/2*(v.hi-v.lo);return v.int?Math.round(a):+a.toPrecision(5);}),cod=a=>V.map((v,j)=>2*(a[j]-v.lo)/(v.hi-v.lo)-1);
  const G=await guard(API,{...o,what:'A design study'},ui,need),mk=x=>V.reduce((d,v,i)=>setVar(d,v,x[i]),JSON.parse(G.orig)),runs=[];let fin=null;
  try{for(let i=0;i<L.n&&!G.C.halt();i++){const xa=act(L.X.slice(i*k,i*k+k));ui.phase&&ui.phase('Run '+(i+1)+' of '+L.n+'…');let M=null,stop=false;try{M=await measure(API,G.C,mk(xa));}catch(e){stop=!!(e&&e.stop);}if(stop)break;const e={i,x:xa,ok:!!M,M};runs.push(e);ui.onRun&&ui.onRun(e,L.n,V);}}
  catch(e){fin=e;}finally{await G.done();}
  if(fin)throw fin;runs.some(e=>e.ok)&&G.spend();
  const fits={};for(const m of ms){const rows=runs.filter(e=>e.ok&&e.M[m]!=null&&isFinite(e.M[m])).map(e=>({c:cod(e.x),y:e.M[m]}));if(rows.length<2){fits[m]={metric:m,name:METRICS[m].n,points:rows.length,error:'Too few runs gave a value to fit.'};continue;}
    const F=fit(L,k,rows,want),tot=F.E.reduce((s,e)=>s+Math.abs(e),0)||1;fits[m]={metric:m,name:METRICS[m].n,unit:unitOf(m),points:rows.length,model:MODELS[F.mode],terms:F.p,r2:r5(F.r2),rmse:r5(F.rmse),effects:V.map((v,j)=>({variable:v.id,label:v.label,effect:r5(F.E[j]),share:+(Math.abs(F.E[j])/tot).toFixed(3)})).sort((a,b)=>b.share-a.share),lowest:{value:r5(F.min.y),x:act(F.min.c)},highest:{value:r5(F.max.y),x:act(F.max.c)},coefficients:F.B.map(r5)};}
  return{design:L.d,design_name:DESIGNS[L.d],runs:L.n,done:runs.length,failed:runs.filter(e=>!e.ok).length,stopped:runs.length<L.n,wall_s:+((Date.now()-t0)/1000).toFixed(1),metrics:ms,
    variables:V.map(v=>({variable:v.id,label:v.label,now:v.x0,min:v.lo,max:v.hi,unit:v.len?U.docUnits(S.doc):v.int?'count':''})),table:runs.map(e=>({i:e.i,ok:e.ok,x:e.x,metrics:e.M?Object.fromEntries(ms.map(m=>[m,r5(e.M[m])])):null})),fits};}
