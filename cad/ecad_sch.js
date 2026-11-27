import {heliumSync} from './he/host.js';
import {PKG,foot,newBoard,hallBoard} from './ecad.js';
const SF=await heliumSync('esch'),U8=new URL('./ecad_lib.json',import.meta.url);
export const LIB=await(U8.protocol==='file:'?import('node:fs/promises').then(f=>f.readFile(U8,'utf8')).then(JSON.parse):fetch(U8).then(r=>r.json()));
let H=null;const he=()=>H||(H=SF({}),H.ex.es_setup(0,0,0,0,0),H.ex.es_aset(0,0),H),r4=v=>Math.round(v*1e4)/1e4,G=2.54,rows=(a,k)=>{const o=[];for(let i=0;i+k<=a.length;i+=k)o.push(Array.from(a.subarray(i,i+k)));return o;};
export const SK={R:1,C:2,CP:3,L:4,D:5,LED:6,DS:7,DZ:8,NPN:9,PNP:10,NMOS:11,PMOS:12,IC:13,CONN:14,XTAL:15,XTAL4:16,SW:17,F:18,FB:19,PWR:20,GND:21,MH:22,CONN2:23},PT='piobtwWcnu',PTN=['Passive','Input','Output','Bidirectional','Tri-state','Power input','Power output','Open collector','Not connected','Unspecified'];
const PRE={R:'R',C:'C',CP:'C',L:'L',FB:'FB',D:'D',DS:'D',DZ:'D',LED:'D',NPN:'Q',PNP:'Q',NMOS:'Q',PMOS:'Q',IC:'U',CONN:'J',CONN2:'J',XTAL:'Y',XTAL4:'Y',SW:'SW',F:'F',MH:'H'};
export const ERCK={1:[1,'Unconnected pin'],2:[2,'No-connect flag on a connected pin'],3:[2,'Two outputs drive one net'],4:[2,'Power input with no power source'],5:[2,'Input with no driver'],6:[1,'Dangling wire end'],7:[1,'Label not on a wire or pin'],8:[1,'Label used only once'],9:[2,'Not-connected pin is wired'],10:[2,'Duplicate reference'],11:[1,'Part not numbered']};
export const GNDRE=/^(gnd|agnd|dgnd|pgnd|vss|vssa|0v|ground)$/i;
const SC=new Map();
export function symbol(k,n=0,m=0,w=0){const key=k+','+n+','+m+','+w;if(SC.has(key))return SC.get(key);const h=he(),c=h.ex.es_sym(k,n,m,w),Y=h.v(1),o={pins:rows(Y,5).slice(0,c).map(([x,y,dx,dy,t])=>({x,y,dx,dy,t})),prims:rows(h.v(2),7),box:Array.from(h.v(14))};SC.set(key,o);return o;}
export const symOf=p=>symbol(...p.s);
export const newSch=()=>({v:1,sheets:[{name:'Sheet 1'}],parts:[],wires:[],labels:[],nc:[]});
export function partOf(e,x=0,y=0,sheet=0){const k=SK[e.sym],n=k===SK.IC||k===SK.CONN||k===SK.CONN2?(e.pads?e.pads.length:foot(e.pkg).length):0,m=k===SK.IC?(e.left!=null?e.left:Math.ceil(n/2)):0,nm=e.names||[],len=a=>a.reduce((s,t)=>Math.max(s,String(t).length),0),w=k===SK.IC?Math.max(4,2*Math.ceil(((len(nm.slice(0,m))+len(nm.slice(m)))*0.85+2.5)/5.08)):0;
  return{ref:(e.pre||PRE[e.sym]||'U')+'?',lib:e.id,val:e.val||'',pkg:e.pkg||'',...(e.lcsc?{lcsc:e.lcsc}:{}),s:[k,n,m,w],...(e.pads?{pads:e.pads}:{}),...(e.names?{names:e.names}:{}),...(e.types?{types:e.types}:{}),x:r4(Math.round(x/G)*G),y:r4(Math.round(y/G)*G),rot:0,mir:0,sheet};}
const pinType=(p,k)=>p.types&&k<p.types.length?Math.max(0,PT.indexOf(p.types[k])):-1;
function load(sch){const h=he(),Q=sch.parts||[],W=sch.wires||[],L=sch.labels||[],X=sch.nc||[],tt=[],off=Q.map(p=>p.types?(tt.push(...[...p.types].map(c=>Math.max(0,PT.indexOf(c)))),tt.length-p.types.length):-1),ids=new Map(),id=s=>ids.has(s)?ids.get(s):(ids.set(s,ids.size),ids.size-1);
  h.ex.es_setup(Q.length,W.length,L.length,X.length,tt.length);const QP=h.v(3),WR=h.v(5),LB=h.v(6),XF=h.v(7);h.v(4).set(tt);h.v(22).set(L.map(l=>GNDRE.test(l.name||'')?1:0));
  Q.forEach((p,i)=>QP.set([p.s[0],p.s[1]||0,p.s[2]||0,p.s[3]||0,p.x,p.y,p.rot||0,p.mir?1:0,p.sheet||0,off[i]],i*10));W.forEach((w,i)=>WR.set([w[0],w[1],w[2],w[3],w[4]||0],i*5));L.forEach((l,i)=>LB.set([l.x,l.y,l.sheet||0,l.kind||0,id(l.name)],i*5));X.forEach((f,i)=>XF.set([f[0],f[1],f[2]||0],i*3));return h;}
const prefix=r=>(/^[A-Za-z_#]+/.exec(r)||['U'])[0],numOf=r=>{const m=/(\d+)$/.exec(r);return m&&!/\?$/.test(r)?+m[1]:0;};
function aload(Q){const h=he(),P=new Map(),pid=s=>P.has(s)?P.get(s):(P.set(s,P.size),P.size-1),rs=Q.map(p=>[pid(prefix(p.ref)),numOf(p.ref),p.sheet||0,p.x,p.y]);h.ex.es_aset(Q.length,Math.max(1,P.size));const AQ=h.v(13);rs.forEach((r,i)=>AQ.set(r,i*5));return h;}
export function annotate(sch,mode=0){const Q=sch.parts||[];if(!Q.length)return{refs:[],changed:0};const h=aload(Q),changed=h.ex.es_annot(mode),AN=h.v(16);return{refs:Q.map((p,i)=>prefix(p.ref)+AN[i]),changed};}
export function netlist(sch){const Q=sch.parts||[],L=sch.labels||[],W=sch.wires||[],h=load(sch),ne=h.ex.es_net(),NI=h.v(10),NT=Array.from(h.v(15)),pins=rows(h.v(8),10).map(([x,y,sheet,part,k,t,net,dx,dy,nc])=>({x,y,sheet,part,k,t,net,dx,dy,nc})),erc=rows(h.v(11),6),junc=rows(h.v(12),3),box=rows(h.v(9),4),nk=pins.length;
  pins.forEach(p=>{const q=Q[p.part];p.pad=String(q.pads&&q.pads[p.k]!=null?q.pads[p.k]:p.k+1);p.name=q.names&&q.names[p.k]||'';});
  const nets=[],seen=new Map();for(let k=0;k<ne;k++){const bl=NI[k*8],pp=pins[NI[k*8+2]];let nm=bl>=0?L[bl].name:'Net-('+Q[pp.part].ref+'-'+pp.pad+')';const c=seen.get(nm)||0;seen.set(nm,c+1);c&&(nm+='_'+(c+1));nets.push({name:nm,pins:[],power:NI[k*8+1]===2});}
  pins.forEach(p=>nets[p.net].pins.push(Q[p.part].ref+'.'+p.pad));
  const ah=aload(Q),nd=Q.length?ah.ex.es_dups():0,AD=ah.v(18);for(let i=0;i<nd;i++){const b=AD[i*2+1],p=Q[b];erc.push([10,p.x,p.y,p.sheet||0,AD[i*2],b]);}Q.forEach((p,i)=>/\?$/.test(p.ref)&&erc.push([11,p.x,p.y,p.sheet||0,i,-1]));
  return{nets,pins,erc,junc,box,wireNet:NT.slice(nk,nk+W.length),labelNet:NT.slice(nk+W.length,nk+W.length+L.length),lor:(ah.ex.es_lor(),rows(ah.v(19),2))};}
export function ercText(sch,N,e){const Q=sch.parts||[],L=sch.labels||[],c=e[0],pin=i=>{const p=N.pins[i];return p?Q[p.part].ref+' pin '+p.pad+(p.name?' ('+p.name+')':''):'';};
  return ERCK[c][1]+': '+(c===3?pin(e[4])+' and '+pin(e[5]):c<=5||c===9?pin(e[4]):c===6?'wire end':c===7||c===8?'"'+(L[e[4]]&&L[e[4]].name)+'"':c===10?Q[e[5]].ref+' is used twice':Q[e[4]].ref);}
export function hit(sch,x,y,sheet,tol){const Q=sch.parts||[],W=sch.wires||[],h=load(sch);h.ex.es_net();const r=h.ex.es_hit(x,y,sheet,tol);return r<0?null:r<Q.length?{t:'part',i:r}:r<Q.length+W.length?{t:'wire',i:r-Q.length}:{t:'label',i:r-Q.length-W.length};}
export function drag(sch,qi,dx,dy){const h=load(sch);h.ex.es_net();const moved=h.ex.es_drag(qi,dx,dy),QP=h.v(3);return{x:QP[qi*10+4],y:QP[qi*10+5],wires:rows(h.v(5),5),labels:rows(h.v(6),5).map((r,i)=>({...sch.labels[i],x:r[0],y:r[1]})),moved,lor:(h.ex.es_lor(),rows(h.v(19),2))};}
export function toPcb(sch,pcb){const N=netlist(sch),P=pcb&&pcb.board?JSON.parse(JSON.stringify(pcb)):newBoard(),old=new Map(P.parts.map(p=>[p.ref,p])),Q=(sch.parts||[]).filter(q=>q.pkg&&PKG[q.pkg]),keep=new Set(Q.map(q=>q.ref)),b=P.board,nw=Q.filter(q=>!old.has(q.ref)).length,hr=he();hr.ex.es_pset(nw);hr.ex.es_row(nw,b.x0,b.y0-7,8);const RW=hr.v(20);let ni=0,add=0,chg=0;
  P.parts=Q.map(q=>{const o=old.get(q.ref),lc=q.lcsc?{lcsc:q.lcsc}:{};if(o){(o.pkg!==q.pkg||(o.val||'')!==(q.val||'')||(o.lcsc||'')!==(q.lcsc||''))&&chg++;const{lcsc,...r}=o;return{...r,pkg:q.pkg,val:q.val||'',...lc};}add++;const p={ref:q.ref,pkg:q.pkg,val:q.val||'',...lc,x:RW[6*ni+4],y:RW[6*ni+5],rot:0,side:0};ni++;return p;});
  const rm=[...old.keys()].filter(r=>!keep.has(r)).length,nets=N.nets.map(n=>({name:n.name,pins:n.pins.filter(k=>keep.has(k.split('.')[0]))})).filter(n=>n.pins.length>1),ren=new Map();
  for(const n of nets)for(const o of P.nets||[])o.name!==n.name&&o.pins.some(k=>n.pins.includes(k))&&!nets.some(m=>m.name===o.name)&&ren.set(o.name,n.name);
  P.tracks=(P.tracks||[]).map(t=>ren.has(t[6])?[...t.slice(0,6),ren.get(t[6])]:t);P.vias=(P.vias||[]).map(v=>ren.has(v[2])?[v[0],v[1],ren.get(v[2])]:v);P.zones=(P.zones||[]).map(z=>ren.has(z.net)?{...z,net:ren.get(z.net)}:z);P.nets=nets;
  return{pcb:P,add,rm,chg,nets:nets.length};}
const libFor=p=>LIB.find(e=>e.id===p.lib)||LIB.find(e=>p.lcsc&&e.lcsc===p.lcsc)||LIB.find(e=>e.val&&p.val&&e.val===p.val&&e.pkg===p.pkg)||null;
const guess=p=>{const pre=prefix(p.ref).toUpperCase(),n=foot(p.pkg).length,two=/^HDR-2x/.test(p.pkg);return pre==='R'?'R':pre==='C'?'C':pre==='L'?'L':pre==='FB'?'FB':pre==='D'?(/led/i.test(p.val)?'LED':'D'):pre==='Q'?'NPN':pre==='Y'?(n===4?'XTAL4':'XTAL'):pre==='SW'?'SW':pre==='F'?'F':pre==='H'||/^MH-/.test(p.pkg)?'MH':pre==='J'||/^HDR/.test(p.pkg)?(two?'CONN2':'CONN'):n===2?'R':'IC';};
export function fromPcb(pcb){const S=newSch(),pos=new Map(),Q=(pcb.parts||[]).map(p=>{const e=libFor(p)||{id:'',sym:guess(p),pkg:p.pkg,val:p.val},q=partOf({...e,pkg:p.pkg,val:p.val,lcsc:p.lcsc||e.lcsc});q.ref=p.ref;return q;}),bx=Q.map(q=>symOf(q).box),h=he();h.ex.es_pset(Q.length);const PB=h.v(20);bx.forEach((b,i)=>PB.set(b,6*i));h.ex.es_pack(Q.length);const PO=h.v(20);
  Q.forEach((q,i)=>{q.x=PO[6*i+4];q.y=PO[6*i+5];});S.parts=Q;
  const N=netlist(S);N.pins.forEach((p,i)=>pos.set(S.parts[p.part].ref+'.'+p.pad,i));h.ex.es_stubs();const SB=h.v(21);
  for(const n of pcb.nets||[]){const pw=GNDRE.test(n.name)||/^(vcc|vdd|[+]?\d+v\d*|\d+v\d+|vbus|vin|vbat)$/i.test(n.name);for(const k of n.pins){const i=pos.get(k);if(i==null)continue;const p=N.pins[i],x=SB[2*i],y=SB[2*i+1];S.wires.push([p.x,p.y,x,y,0]);S.labels.push({x,y,sheet:0,kind:pw?2:0,name:n.name});}}
  return S;}
export const hallSch=()=>fromPcb(hallBoard());
