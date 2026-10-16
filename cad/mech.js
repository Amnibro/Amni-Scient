import {add,sub,mul,dot,cross,len,qmul,qconj,qrot,xf,inv} from './qmath.js';
export const MECH={hinge:1,slider:1,gear:1,rack:1,screw:1,cam:1,universal:1,path:1,limit_distance:1,limit_angle:1};
export const MECHLABEL={hinge:'Hinge',slider:'Slider',gear:'Gear',rack:'Rack and pinion',screw:'Screw',cam:'Cam follower',universal:'Universal joint',path:'Path',limit_distance:'Limit distance',limit_angle:'Limit angle'};
export const KEEP=['q0','q0a','q0b','s0','pb0','sg','sg0'];
const TAU=Math.PI*2,wrap=x=>x-TAU*Math.round(x/TAU),rad=x=>x*Math.PI/180,deg=x=>x*180/Math.PI,tw=(q,d)=>2*Math.atan2(q[0]*d[0]+q[1]*d[1]+q[2]*d[2],q[3]),has=v=>v!==undefined&&v!==null&&v!==''&&Number.isFinite(+v),bad=t=>{throw new Error(t);},r9=v=>+v.toFixed(9),rq=q=>q.map(v=>+v.toFixed(12));
const relu=(x,lo,hi)=>(hi!=null&&x>hi?x-hi:0)+(lo!=null&&x<lo?x-lo:0),unw=(X,k,r)=>{const l=X.rt&&X.rt[k];return l==null?wrap(r):l+wrap(r-l);},RKO={plane:0,line:1,sphere:2,point:3},DIR=e=>e.k==='plane'?e.n:e.k==='line'?e.d:null;
export function jc(m,E,X={}){const t=m.type,{a,b,Pa,Pb}=E,k=m.id+'.',u=(n,r)=>unw(X,k+n,r),sg=m.flip?-1:1;
  if(t==='hinge'||t==='slider'||t==='screw'){const D=qmul(qmul(qconj(Pa.q),Pb.q),qconj(m.q0)),th=sg*u('th',tw(D,qrot(qconj(Pa.q),a.d)));return{th,s:sg*(dot(sub(b.p,a.p),a.d)-m.s0)};}
  if(t==='gear'||t==='universal')return{ta:u('ta',tw(qmul(Pa.q,qconj(m.q0a)),a.d)),tb:u('tb',tw(qmul(Pb.q,qconj(m.q0b)),b.d))};
  if(t==='rack')return{ta:u('ta',tw(qmul(Pa.q,qconj(m.q0a)),a.d)),x:dot(sub(Pb.p,m.pb0),b.d)};
  return{};}
function pathAt(P,u){let T=0;const S=[];for(let i=1;i<P.length;i++){const l=len(sub(P[i],P[i-1]));S.push(l);T+=l;}let s=Math.max(0,Math.min(1,u))*T;for(let i=0;i<S.length;i++){if(s<=S[i]||i===S.length-1){const f=S[i]?Math.min(1,s/S[i]):0,d=sub(P[i+1],P[i]);return{p:add(P[i],mul(d,f)),t:mul(d,1/(len(d)||1))};}s-=S[i];}return{p:P[0],t:[1,0,0]};}
export function pathNear(P,q){let best=null,bd=Infinity,run=0,T=0;const S=[];for(let i=1;i<P.length;i++){S.push(len(sub(P[i],P[i-1])));T+=S[i-1];}for(let i=1;i<P.length;i++){const a=P[i-1],ab=sub(P[i],a),f=Math.max(0,Math.min(1,dot(sub(q,a),ab)/(dot(ab,ab)||1e-18))),p=add(a,mul(ab,f)),d=len(sub(p,q));if(d<bd){bd=d;best={p,t:mul(ab,1/(len(ab)||1)),u:T?(run+S[i-1]*f)/T:0};}run+=S[i-1];}return best;}
const camR=(prof,phi)=>{const R=prof.R,N=R.length,x=((phi%TAU)+TAU)%TAU/TAU*N,i=Math.floor(x),f=x-i,g=k=>R[((i+k)%N+N)%N],a=g(-1),b=g(0),c=g(1),d=g(2);return b+0.5*f*(c-a+f*(2*a-5*b+4*c-d+f*(3*(b-c)+d-a)));};
export function camProfile(m,p0,d,size,N=720){const A=Math.abs(d[0])<0.9?[1,0,0]:[0,1,0],c=cross(d,A),cl=len(c),u=mul(c,1/cl),w=cross(d,u),R=new Float64Array(N),has0=new Uint8Array(N),L=m.lines,step=Math.max(size/1500,1e-9);
  const put=q=>{const r=sub(q,p0),z=dot(r,d),rv=sub(r,mul(d,z)),rho=len(rv),ph=Math.atan2(dot(rv,w),dot(rv,u)),i=Math.floor((((ph%TAU)+TAU)%TAU)/TAU*N)%N;if(rho>R[i]||!has0[i]){R[i]=has0[i]?Math.max(R[i],rho):rho;has0[i]=1;}};
  for(const g of m.egroups)for(let k=g[0];k+1<g[0]+g[1];k++){const a=[L[3*k],L[3*k+1],L[3*k+2]],b=[L[3*k+3],L[3*k+4],L[3*k+5]],n=Math.max(1,Math.ceil(len(sub(b,a))/step));for(let j=0;j<=n;j++)put(add(a,mul(sub(b,a),j/n)));}
  let first=-1;for(let i=0;i<N;i++)if(has0[i]){first=i;break;}if(first<0)return{R:Array.from(R),u,w};
  for(let i=0;i<N;i++){if(has0[i])continue;let a=i,b=i;while(!has0[(a-1+N)%N])a=(a-1+N)%N;a=(a-1+N)%N;while(!has0[(b+1)%N])b=(b+1)%N;b=(b+1)%N;const da=(i-a+N)%N,db=(b-i+N)%N;R[i]=(R[a]*db+R[b]*da)/(da+db);}
  for(let p=0;p<3;p++){const S=Float64Array.from(R);for(let i=0;i<N;i++)R[i]=(S[(i+N-1)%N]+2*S[i]+S[(i+1)%N])/4;}
  return{R:Array.from(R),u,w};}
export function mech(m,E,L,X={}){const t=m.type,{a,b}=E,v=X.drive&&X.drive[m.id]!==undefined?X.drive[m.id]:m.v,dr=has(v),lo=has(m.lo)?+m.lo:null,hi=has(m.hi)?+m.hi:null,lim=lo!=null||hi!=null,rl=(x,k=1)=>relu(x,lo!=null?lo*k:null,hi!=null?hi*k:null);
  const conc=()=>{if(a.k!=='line'||b.k!=='line')bad(MECHLABEL[t]+' needs round faces, round edges, axes or straight edges on both parts.');return[...cross(a.d,b.d),...mul(cross(sub(b.p,a.p),a.d),1/L)];};
  if(t==='hinge'){const c=jc(m,E,X),r=[...conc(),c.s/L];dr&&r.push(c.th-rad(v));lim&&r.push(rl(c.th,Math.PI/180));return r;}
  if(t==='slider'){const c=jc(m,E,X),r=[...conc()];m.free||r.push(c.th);dr&&r.push((c.s-v)/L);lim&&r.push(rl(c.s)/L);return r;}
  if(t==='screw'){const c=jc(m,E,X),P=(+m.pitch||0)*(+m.starts||1)*(m.rev?-1:1),r=[...conc(),(c.s-P*c.th/TAU)/L];dr&&r.push(c.th-rad(v));lim&&r.push(rl(c.th,Math.PI/180));return r;}
  if(t==='gear'){if(a.k!=='line'||b.k!=='line')bad('Gear needs the round face or axis of each gear.');const c=jc(m,E,X),sig=-m.sg0*(m.rev?-1:1);return[c.tb-sig*c.ta/(+m.ratio||1)-rad(+m.ph||0)];}
  if(t==='rack'){if(a.k!=='line'||b.k!=='line')bad('Rack and pinion needs the pinion axis (round face) and a straight edge along the rack.');const c=jc(m,E,X),rr=+m.r||a.r||1;return[(c.x-(m.sg||1)*rr*c.ta)/L];}
  if(t==='universal'){if(a.k!=='line'||b.k!=='line')bad('Universal joint needs the axis of each shaft.');const c=jc(m,E,X),cb=dot(a.d,b.d),s2=cb<0?-1:1,F=x=>Math.atan2(Math.abs(cb)*Math.sin(x),Math.cos(x)),ph=rad(+m.phase||0),pred=s2*(F(c.ta+ph)-F(ph));return[dot(sub(b.p,a.p),cross(a.d,b.d))/(L*L),wrap(c.tb-pred)];}
  if(t==='cam'){const cam=X.R&&X.R.a&&X.R.a.e;if(!cam||!cam.prof)bad('Cam follower needs the cam outline (pick the cam bore or its axis) and a point or ball on the follower.');const lp=xf(inv(E.Pa),b.p),rel=sub(lp,cam.p),rv=sub(rel,mul(cam.d,dot(rel,cam.d))),rho=len(rv),ph=Math.atan2(dot(rv,cam.prof.w),dot(rv,cam.prof.u));return[(rho-camR(cam.prof,ph)-(+m.rr||0))/L];}
  if(t==='path'){if(!a.pts)bad('Path needs an edge on the first part as the path.');if(b.k==='plane')bad('Path needs a point, vertex, ball or axis on the second part.');const P=a.pts,q=dr?pathAt(P,+v):pathNear(P,b.p),r=[...mul(sub(b.p,q.p),1/L)];if(m.tang&&b.k==='line')r.push(...cross(b.d,q.t));lim&&r.push(rl(pathNear(P,b.p).u));return r;}
  let A=a,B=b;if(RKO[A.k]>RKO[B.k])[A,B]=[B,A];
  if(t==='limit_distance'){const dl=(x,y)=>len(cross(sub(y.p,x.p),x.d)),d=A.k==='plane'?dot(sub(B.p,A.p),A.n):A.k==='line'&&B.k!=='plane'?dl(A,B):len(sub(A.p,B.p));return[rl(d)/L];}
  const x=DIR(A),y=DIR(B);if(!x||!y)bad('Limit angle needs flat faces, straight edges or axes.');return[rl(Math.atan2(len(cross(x,y)),dot(x,y)),Math.PI/180)];}
export function gmech(m,E){const t=m.type,{a,b,Pa,Pb}=E;if(!a||!b||!Pa||!Pb)return m;
  if(t==='hinge'||t==='slider'||t==='screw'){if(!m.q0){m.q0=rq(qmul(qconj(Pa.q),Pb.q));m.s0=r9(dot(sub(b.p,a.p),a.d));}if(t==='screw'&&m.pitch==null)m.pitch=r9((a.r||b.r||0.1)*0.4);}
  if(t==='gear'&&!m.q0a){m.q0a=rq(Pa.q);m.q0b=rq(Pb.q);m.sg0=dot(a.d,b.d)>=0?1:-1;m.ratio==null&&(m.ratio=a.r&&b.r?r9(b.r/a.r):1);}
  if(t==='universal'&&!m.q0a){m.q0a=rq(Pa.q);m.q0b=rq(Pb.q);}
  if(t==='rack'&&!m.q0a){m.q0a=rq(Pa.q);m.pb0=Pb.p.map(r9);const d=sub(b.p,a.p),u=sub(d,mul(a.d,dot(d,a.d)));m.sg=dot(cross(a.d,u),b.d)>=0?1:-1;m.r==null&&a.r&&(m.r=r9(a.r));}
  return m;}
export const reset=m=>{for(const k of KEEP)delete m[k];return m;};
export function joints(m,E,X){const c=jc(m,E,X),o={};for(const k in c)o[k]=k[0]==='t'?deg(c[k]):c[k];return o;}
export function atLimit(m,j,tol=1e-3){if(!(has(m.lo)||has(m.hi)))return null;const t=m.type,x=t==='slider'?j.s:t==='hinge'||t==='screw'?j.th:null;if(x==null)return null;return has(m.hi)&&x>=+m.hi-tol?'hi':has(m.lo)&&x<=+m.lo+tol?'lo':null;}
