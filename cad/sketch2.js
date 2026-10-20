import {solve,arcPoints} from './sketch.js';
const r9=v=>+(+v).toFixed(9);
export function chains(sk){
  const P=sk.pts,E=sk.ents,L=E.map((e,i)=>!e.cons&&(e.k==='line'||e.k==='arc')?i:-1).filter(i=>i>=0),adj=new Map(),seen=new Set(),out=[];
  L.forEach(i=>[E[i].p[0],E[i].p[1]].forEach(q=>adj.set(q,(adj.get(q)||[]).concat(i))));
  const deg=q=>(adj.get(q)||[]).length,ends=i=>[deg(E[i].p[0]),deg(E[i].p[1])];
  for(const i of[...L].sort((a,b)=>Math.min(...ends(a))-Math.min(...ends(b)))){
    if(seen.has(i))continue;const e0=E[i];let at=deg(e0.p[0])===1?e0.p[0]:deg(e0.p[1])===1?e0.p[1]:e0.p[0],cur=i;const pts=[];
    while(cur!=null&&!seen.has(cur)){seen.add(cur);const e=E[cur],fwd=e.p[0]===at,q=e.k==='arc'?arcPoints(P,e,16):[P[e.p[0]],P[e.p[1]]],seg=fwd?q:q.slice().reverse();pts.push(...(pts.length?seg.slice(1):seg));at=fwd?e.p[1]:e.p[0];cur=(adj.get(at)||[]).find(x=>!seen.has(x));}
    out.push(pts.map(p=>[r9(p[0]),r9(p[1])]));
  }
  return out;
}
export function chainShapes(sk){const c=JSON.parse(JSON.stringify(sk));solve(c);const L=chains(c);if(!L.length)throw new Error('the sketch has no line yet');return L.map(pts=>({k:'path',pts,open:true}));}
export function fromChain(pts){const sk={pts:[[0,0]],ents:[],cons:[]},ix=(pts||[]).map(p=>{sk.pts.push([+p[0]||0,+p[1]||0]);return sk.pts.length-1;});ix.slice(1).forEach((b,i)=>sk.ents.push({k:'line',p:[ix[i],b]}));return sk;}
const TAU=2*Math.PI,W2=a=>((a%TAU)+TAU)%TAU,hyp=Math.hypot,sc=sk=>{let m=1e-9;for(const p of sk.pts)m=Math.max(m,Math.abs(p[0]),Math.abs(p[1]));return m;},tol=sk=>1e-7*Math.max(1,sc(sk));
const cenOf=(P,e)=>P[e.k==='circle'?e.p[0]:e.p[2]],radOf=(P,e)=>e.k==='circle'?e.r:hyp(P[e.p[0]][0]-P[e.p[2]][0],P[e.p[0]][1]-P[e.p[2]][1]);
export function desc(sk,i){const e=sk.ents[i],P=sk.pts;if(e.k==='line')return{t:'l',a:P[e.p[0]],b:P[e.p[1]]};const c=cenOf(P,e),r=radOf(P,e);if(e.k==='circle')return{t:'c',c,r};const a0=Math.atan2(P[e.p[0]][1]-c[1],P[e.p[0]][0]-c[0]),a1=Math.atan2(P[e.p[1]][1]-c[1],P[e.p[1]][0]-c[0]);return{t:'a',c,r,a0,sw:W2(a1-a0)||TAU};}
const curveInter=(d1,d2)=>{
  if(d1.t==='l'&&d2.t==='l'){const u=[d1.b[0]-d1.a[0],d1.b[1]-d1.a[1]],v=[d2.b[0]-d2.a[0],d2.b[1]-d2.a[1]],den=u[0]*v[1]-u[1]*v[0];if(Math.abs(den)<1e-14*(hyp(...u)*hyp(...v)||1))return[];const t=((d2.a[0]-d1.a[0])*v[1]-(d2.a[1]-d1.a[1])*v[0])/den;return[[d1.a[0]+u[0]*t,d1.a[1]+u[1]*t]];}
  if(d1.t==='l'||d2.t==='l'){const L=d1.t==='l'?d1:d2,C=d1.t==='l'?d2:d1,u=[L.b[0]-L.a[0],L.b[1]-L.a[1]],f=[L.a[0]-C.c[0],L.a[1]-C.c[1]],A=u[0]*u[0]+u[1]*u[1],B=2*(f[0]*u[0]+f[1]*u[1]),Cc=f[0]*f[0]+f[1]*f[1]-C.r*C.r,D=B*B-4*A*Cc;if(!A||D<-1e-12*A)return[];const s=Math.sqrt(Math.max(D,0));return(s<1e-9*Math.sqrt(A)?[-B/(2*A)]:[(-B-s)/(2*A),(-B+s)/(2*A)]).map(t=>[L.a[0]+u[0]*t,L.a[1]+u[1]*t]);}
  const dx=d2.c[0]-d1.c[0],dy=d2.c[1]-d1.c[1],d=hyp(dx,dy);if(d<1e-12||d>d1.r+d2.r+1e-9||d<Math.abs(d1.r-d2.r)-1e-9)return[];const a=(d1.r*d1.r-d2.r*d2.r+d*d)/(2*d),h=Math.sqrt(Math.max(d1.r*d1.r-a*a,0)),mx=d1.c[0]+dx*a/d,my=d1.c[1]+dy*a/d;return h<1e-9*d?[[mx,my]]:[[mx+dy*h/d,my-dx*h/d],[mx-dy*h/d,my+dx*h/d]];};
export const par=(d,p)=>d.t==='l'?((p[0]-d.a[0])*(d.b[0]-d.a[0])+(p[1]-d.a[1])*(d.b[1]-d.a[1]))/(((d.b[0]-d.a[0])**2+(d.b[1]-d.a[1])**2)||1):d.t==='a'?W2(Math.atan2(p[1]-d.c[1],p[0]-d.c[0])-d.a0):W2(Math.atan2(p[1]-d.c[1],p[0]-d.c[0]));
export const span=d=>d.t==='l'?1:d.t==='a'?d.sw:TAU;
const within=(d,p,e)=>{const s=par(d,p);return d.t==='l'?s>=-e&&s<=1+e:d.t==='a'?s<=d.sw+e||s>=TAU-e:true;};
const cutsOf=(sk,i,boundSelf=true)=>{const d=desc(sk,i),e=tol(sk),out=[];sk.ents.forEach((o,j)=>{if(j===i||o.cons&&!o.ref||o.k==='pt')return;const dj=desc(sk,j);for(const p of curveInter(d,dj))if(within(dj,p,e)&&(!boundSelf||within(d,p,e)))out.push({pt:p,s:par(d,p),j});});return out;};
const near=(sk,p)=>{const e=tol(sk)*10;return sk.pts.findIndex((q,i)=>i>0&&hyp(q[0]-p[0],q[1]-p[1])<e&&sk.ents.some(x=>x.p.includes(i)));};
const mk=(sk,p,others=[])=>{const i=near(sk,p);if(i>=0)return i;sk.pts.push([+p[0].toFixed(9),+p[1].toFixed(9)]);const n=sk.pts.length-1;for(const j of others)sk.cons.push({k:'on',p:n,e:j});return n;};
const keepG=new Set(['h','v']),refs=(c,i)=>Array.isArray(c.e)?c.e.includes(i):c.e===i;
export function compact(sk){const keep=sk.pts.map((p,i)=>i===0||sk.ents.some(e=>e.p.includes(i))),map=[];let n=0;keep.forEach((k,i)=>{map[i]=k?n++:-1;});sk.pts=sk.pts.filter((p,i)=>keep[i]);sk.ents.forEach(e=>{e.p=e.p.map(i=>map[i]);});sk.cons=sk.cons.filter(c=>{const ps=c.p==null?[]:Array.isArray(c.p)?c.p:[c.p];if(ps.some(i=>map[i]<0))return false;if(Array.isArray(c.p))c.p=c.p.map(i=>map[i]);else if(c.p!=null)c.p=map[c.p];return true;});}
export function delEnts(sk,set){const map=[];let n=0;sk.ents.forEach((e,i)=>{map[i]=set.has(i)?-1:n++;});sk.ents=sk.ents.filter((e,i)=>!set.has(i));sk.cons=sk.cons.filter(c=>{if(c.e==null)return true;const es=Array.isArray(c.e)?c.e:[c.e];if(es.some(i=>map[i]<0))return false;c.e=Array.isArray(c.e)?c.e.map(i=>map[i]):map[c.e];return true;});compact(sk);}
const dropOn=(sk,i)=>{const r=sk.cons.filter(c=>refs(c,i)&&keepG.has(c.k));sk.cons=sk.cons.filter(c=>!refs(c,i));return r;};
export function trim(sk,i,w){
  const e=sk.ents[i];if(!e||e.ref||e.cons||!['line','arc','circle'].includes(e.k))return{ok:false,msg:'Click a line, arc or circle to trim'};
  const d=desc(sk,i),pc=par(d,w),cuts=cutsOf(sk,i).filter(c=>d.t==='l'?c.s>1e-9&&c.s<1-1e-9:c.s>1e-9&&(d.t==='c'||c.s<d.sw-1e-9)).sort((a,b)=>a.s-b.s),grp=[];
  for(const c of cuts){const l=grp[grp.length-1];l&&Math.abs(l.s-c.s)<(d.t==='l'?1e-9:1e-9*TAU)?l.js.push(c.j):grp.push({s:c.s,pt:c.pt,js:[c.j]});}
  const keepC=dropOn(sk,i),old=e.p.slice();
  if(d.t==='c'){if(grp.length<2){delEnts(sk,new Set([i]));return{ok:true,msg:'Removed the circle (it needs two crossings to trim to an arc)'};}let lo=null,hi=null;for(const g of grp)g.s<=pc&&(lo=g);for(const g of grp)g.s>pc&&!hi&&(hi=g);lo=lo||grp[grp.length-1];hi=hi||grp[0];const c0=e.p[0],a=mk(sk,hi.pt,hi.js),b=mk(sk,lo.pt,lo.js);sk.ents[i]={k:'arc',p:[a,b,c0]};return{ok:true,msg:'Trimmed the circle to an arc'};}
  let lo=null,hi=null;for(const g of grp)g.s<=pc&&(lo=g);for(const g of grp)g.s>pc&&!hi&&(hi=g);
  if(!lo&&!hi){delEnts(sk,new Set([i]));return{ok:true,msg:'Removed the whole piece (nothing crosses it)'};}
  const A=lo?mk(sk,lo.pt,lo.js):null,B=hi?mk(sk,hi.pt,hi.js):null,isA=d.t==='a';
  const piece=(p0,p1)=>isA?{k:'arc',p:[p0,p1,old[2]]}:{k:'line',p:[p0,p1]};
  if(A!=null&&B!=null){sk.ents[i]=piece(old[0],A);sk.ents.push(piece(B,old[1]));const n=sk.ents.length-1;for(const c of keepC)sk.cons.push({...c,e:n});for(const c of keepC)sk.cons.push({...c,e:i});}
  else if(A!=null){sk.ents[i]=piece(old[0],A);for(const c of keepC)sk.cons.push({...c,e:i});}
  else{sk.ents[i]=piece(B,old[1]);for(const c of keepC)sk.cons.push({...c,e:i});}
  compact(sk);return{ok:true,msg:'Trimmed'};
}
export function extend(sk,i,w){
  const e=sk.ents[i];if(!e||e.ref||e.cons||!['line','arc'].includes(e.k))return{ok:false,msg:'Click near the end of a line or arc to extend it'};
  const d=desc(sk,i),P=sk.pts,e0=P[e.p[0]],e1=P[e.p[1]],end=hyp(w[0]-e0[0],w[1]-e0[1])<=hyp(w[0]-e1[0],w[1]-e1[1])?0:1,et=tol(sk),dist=c=>d.t==='l'?(end?c.s-1:-c.s):end?c.s-d.sw:TAU-c.s,cuts=cutsOf(sk,i,false).filter(c=>d.t==='l'?(end?c.s>1+et:c.s<-et):c.s>d.sw+et);
  let best=null;for(const c of cuts){const dd=dist(c);if(!best||dd<best.dd)best={...c,dd};}
  if(!best)return{ok:false,msg:'Nothing in that direction to extend to'};
  const pi=e.p[end],shared=sk.ents.some((x,j)=>j!==i&&x.p.includes(pi))||sk.cons.some(c=>c.p===pi||Array.isArray(c.p)&&c.p.includes(pi));let n=pi;
  if(shared){P.push([+best.pt[0].toFixed(9),+best.pt[1].toFixed(9)]);n=P.length-1;e.p[end]=n;}else P[pi]=[+best.pt[0].toFixed(9),+best.pt[1].toFixed(9)];
  sk.cons=sk.cons.filter(c=>!(refs(c,i)&&['len','rad','dia'].includes(c.k)));sk.cons.push({k:'on',p:n,e:best.j});return{ok:true,msg:'Extended'};
}
const addP=(sk,p)=>{sk.pts.push([+p[0].toFixed(9),+p[1].toFixed(9)]);return sk.pts.length-1;};
const turn=(a,b,c)=>(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
export function arc3(sk,a,b,c){
  const A=sk.pts[a],B=sk.pts[b],C=Array.isArray(c)?c:sk.pts[c],d=2*(A[0]*(B[1]-C[1])+B[0]*(C[1]-A[1])+C[0]*(A[1]-B[1]));if(Math.abs(d)<1e-12*Math.max(1,sc(sk)**2))return{ok:false,msg:'The three points lie on one line'};
  const a2=A[0]**2+A[1]**2,b2=B[0]**2+B[1]**2,c2=C[0]**2+C[1]**2,o=addP(sk,[(a2*(B[1]-C[1])+b2*(C[1]-A[1])+c2*(A[1]-B[1]))/d,(a2*(C[0]-B[0])+b2*(A[0]-C[0])+c2*(B[0]-A[0]))/d]);
  sk.ents.push({k:'arc',p:turn(A,C,B)>0?[a,b,o]:[b,a,o]});return{ok:true,id:sk.ents.length-1};
}
export function slot(sk,c,e,wd,pc,pe){
  const u0=[e[0]-c[0],e[1]-c[1]],L=hyp(...u0);if(L<1e-9||!(wd>0))return{ok:false,msg:'The slot needs a length and a width'};const u=[u0[0]/L,u0[1]/L],n=[-u[1],u[0]],h=wd/2,c1=[c[0]-u0[0],c[1]-u0[1]],P=(o,k)=>[o[0]+n[0]*h*k,o[1]+n[1]*h*k];
  const i1=addP(sk,c1),i2=pe!=null?pe:addP(sk,e),t1=addP(sk,P(c1,1)),t2=addP(sk,P(e,1)),b2=addP(sk,P(e,-1)),b1=addP(sk,P(c1,-1)),e0=sk.ents.length;
  sk.ents.push({k:'line',p:[t1,t2]},{k:'arc',p:[b2,t2,i2]},{k:'line',p:[b2,b1]},{k:'arc',p:[t1,b1,i1]});
  sk.cons.push({k:'par',e:[e0,e0+2]},{k:'eq',e:[e0+1,e0+3]},{k:'eq',e:[e0,e0+2]},{k:'tan',e:[e0,e0+1]},{k:'tan',e:[e0+2,e0+1]},{k:'tan',e:[e0,e0+3]},{k:'tan',e:[e0+2,e0+3]});
  return{ok:true,ids:[e0,e0+1,e0+2,e0+3]};
}
const refl=(p,A,B)=>{const u=[B[0]-A[0],B[1]-A[1]],l2=u[0]*u[0]+u[1]*u[1]||1,t=((p[0]-A[0])*u[0]+(p[1]-A[1])*u[1])/l2,f=[A[0]+u[0]*t,A[1]+u[1]*t];return[2*f[0]-p[0],2*f[1]-p[1]];};
export function mirror(sk,ids,axis){
  const ax=sk.ents[axis];if(!ax||ax.k!=='line')return{ok:false,msg:'Pick a line as the mirror axis'};const P=sk.pts,A=P[ax.p[0]],B=P[ax.p[1]],et=tol(sk)*10,map=new Map(),out=[];
  const onAxis=p=>Math.abs((B[0]-A[0])*(p[1]-A[1])-(B[1]-A[1])*(p[0]-A[0]))/(hyp(B[0]-A[0],B[1]-A[1])||1)<et;
  const pm=i=>{if(map.has(i))return map.get(i);if(onAxis(P[i])){map.set(i,i);return i;}const n=addP(sk,refl(P[i],A,B));map.set(i,n);sk.cons.push({k:'sym',p:[i,n],e:axis});return n;};
  for(const i of ids){const e=sk.ents[i];if(!e||i===axis||e.k==='pt')continue;
    if(e.k==='line'){sk.ents.push({k:'line',p:[pm(e.p[0]),pm(e.p[1])]});}
    else if(e.k==='circle'){sk.ents.push({k:'circle',p:[pm(e.p[0])],r:e.r});sk.cons.push({k:'eq',e:[i,sk.ents.length-1]});}
    else if(e.k==='arc'){const a=pm(e.p[0]),b=pm(e.p[1]),c=pm(e.p[2]);sk.ents.push({k:'arc',p:[b,a,c]});}
    out.push(sk.ents.length-1);}
  return out.length?{ok:true,ids:out}:{ok:false,msg:'Select the entities to mirror first'};
}
export function copies(sk,ids,xf,n){
  const out=[];for(let k=1;k<n;k++){const map=new Map(),pm=i=>{if(!map.has(i))map.set(i,addP(sk,xf(sk.pts[i],k)));return map.get(i);};
    for(const i of ids){const e=sk.ents[i];if(!e||e.ref||e.k==='pt')continue;sk.ents.push(e.k==='circle'?{k:'circle',p:[pm(e.p[0])],r:e.r}:{k:e.k,p:e.p.map(pm)});out.push(sk.ents.length-1);}}
  return out;
}
export const linear=(sk,ids,n,dx,dy)=>{const o=copies(sk,ids,(p,k)=>[p[0]+dx*k,p[1]+dy*k],n);return o.length?{ok:true,ids:o}:{ok:false,msg:'Select the entities to copy first'};};
export const circular=(sk,ids,n,total,cen)=>{const st=(total>=360-1e-9?360/n:total/Math.max(1,n-1))*Math.PI/180,o=copies(sk,ids,(p,k)=>{const c=Math.cos(st*k),s=Math.sin(st*k),x=p[0]-cen[0],y=p[1]-cen[1];return[cen[0]+x*c-y*s,cen[1]+x*s+y*c];},n);return o.length?{ok:true,ids:o}:{ok:false,msg:'Select the entities to copy first'};};
const offC=(d,g,r)=>{if(d.t==='l'){const u=[d.b[0]-d.a[0],d.b[1]-d.a[1]],l=hyp(...u)||1,n=[-u[1]/l*g*r,u[0]/l*g*r];return{t:'l',a:[d.a[0]+n[0],d.a[1]+n[1]],b:[d.b[0]+n[0],d.b[1]+n[1]]};}return{t:'c',c:d.c,r:d.r+g*r};};
const tanPt=(d,C)=>{if(d.t==='l'){const u=[d.b[0]-d.a[0],d.b[1]-d.a[1]],l2=u[0]*u[0]+u[1]*u[1]||1,t=((C[0]-d.a[0])*u[0]+(C[1]-d.a[1])*u[1])/l2;return[d.a[0]+u[0]*t,d.a[1]+u[1]*t];}const v=[C[0]-d.c[0],C[1]-d.c[1]],l=hyp(...v)||1;return[d.c[0]+v[0]/l*d.r,d.c[1]+v[1]/l*d.r];};
const cornerEnts=(sk,q)=>sk.ents.map((e,i)=>i).filter(i=>{const e=sk.ents[i];return!e.ref&&!e.cons&&(e.k==='line'&&e.p.includes(q)||e.k==='arc'&&(e.p[0]===q||e.p[1]===q));});
export function fillet(sk,q,r){
  const L=cornerEnts(sk,q);if(L.length!==2)return{ok:false,msg:'Pick a corner where exactly two lines or arcs meet'};if(!(r>0))return{ok:false,msg:'The fillet radius must be above 0'};
  const[a,b]=L,da=desc(sk,a),db=desc(sk,b),et=tol(sk)*10,K=sk.pts[q];let best=null;
  for(const g1 of[-1,1])for(const g2 of[-1,1]){if(da.t!=='l'&&da.r+g1*r<=0||db.t!=='l'&&db.r+g2*r<=0)continue;for(const C of curveInter(offC(da,g1,r),offC(db,g2,r))){const T1=tanPt(da,C),T2=tanPt(db,C);if(!within(da,T1,et)||!within(db,T2,et))continue;if(hyp(T1[0]-K[0],T1[1]-K[1])<et||hyp(T2[0]-K[0],T2[1]-K[1])<et)continue;const dd=hyp(C[0]-K[0],C[1]-K[1]);if(!best||dd<best.dd)best={C,T1,T2,dd};}}
  if(!best)return{ok:false,msg:'The radius is too large for this corner'};
  const ea=sk.ents[a],eb=sk.ents[b],ia=ea.p.indexOf(q),ib=eb.p.indexOf(q),iC=addP(sk,best.C),t1=addP(sk,best.T1),t2=addP(sk,best.T2);ea.p[ia]=t1;eb.p[ib]=t2;
  const ccw=(best.T1[0]-best.C[0])*(best.T2[1]-best.C[1])-(best.T1[1]-best.C[1])*(best.T2[0]-best.C[0])>0;sk.ents.push({k:'arc',p:ccw?[t1,t2,iC]:[t2,t1,iC]});const n=sk.ents.length-1;
  sk.cons=sk.cons.filter(c=>!(['len','mid'].includes(c.k)&&(refs(c,a)||refs(c,b))));
  const s2=(x,y)=>{if(x.t==='l'||y.t==='l')return{};const dd=hyp(x.c[0]-y.c[0],x.c[1]-y.c[1]);return{s:Math.abs(dd-Math.abs(x.r-y.r))<Math.abs(dd-x.r-y.r)?-1:1};};
  const dn=desc(sk,n);sk.cons.push({k:'tan',e:[a,n],...s2(desc(sk,a),dn)},{k:'tan',e:[b,n],...s2(desc(sk,b),dn)},{k:'rad',e:n,v:+r.toFixed(9)});compact(sk);
  return{ok:true,id:n};
}
export function chamfer(sk,q,d1,d2=d1){
  const L=cornerEnts(sk,q).filter(i=>sk.ents[i].k==='line');if(L.length!==2||cornerEnts(sk,q).length!==2)return{ok:false,msg:'Pick a corner where exactly two lines meet'};if(!(d1>0&&d2>0))return{ok:false,msg:'The chamfer distances must be above 0'};
  const K=sk.pts[q],[a,b]=L,ea=sk.ents[a],eb=sk.ents[b],oa=sk.pts[ea.p[1-ea.p.indexOf(q)]],ob=sk.pts[eb.p[1-eb.p.indexOf(q)]],la=hyp(oa[0]-K[0],oa[1]-K[1]),lb=hyp(ob[0]-K[0],ob[1]-K[1]);
  if(d1>=la-1e-9||d2>=lb-1e-9)return{ok:false,msg:'The chamfer is longer than the line it cuts'};
  const t1=addP(sk,[K[0]+(oa[0]-K[0])/la*d1,K[1]+(oa[1]-K[1])/la*d1]),t2=addP(sk,[K[0]+(ob[0]-K[0])/lb*d2,K[1]+(ob[1]-K[1])/lb*d2]);ea.p[ea.p.indexOf(q)]=t1;eb.p[eb.p.indexOf(q)]=t2;
  sk.ents.push({k:'line',p:[t1,t2]});sk.cons=sk.cons.filter(c=>!(['len','mid'].includes(c.k)&&(refs(c,a)||refs(c,b))));compact(sk);return{ok:true,id:sk.ents.length-1};
}
