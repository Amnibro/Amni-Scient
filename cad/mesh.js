import {region} from './region.js';
import {heliumSync} from './he/host.js';
import {pushAll} from './minmax.js';
const MHM=await heliumSync('mesh_hex'),MHE={},NBD=new WeakMap(),mhOf=(X,E)=>{const HX=MHM(MHE);HX.ex.mh_load(X.length/3,E.length/8);HX.v(1).set(X);HX.v(2).set(E);return HX;};
export const HEX_FACES=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
export const HEX_NODES=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const AX={X:[1,0,0],Y:[0,1,0],Z:[0,0,1],'+X':[1,0,0],'+Y':[0,1,0],'+Z':[0,0,1],'-X':[-1,0,0],'-Y':[0,-1,0],'-Z':[0,0,-1]},K26=67108864,ek=(a,b)=>a<b?a*K26+b:b*K26+a,ka=k=>Math.floor(k/K26),kb=k=>k%K26;
const MSF=await heliumSync('mesh_surf'),mv=i=>MS.v(i),CQ=new Float64Array(6),SC=new WeakMap();
let MS,MX,TCU=null,GCU=null,MKO=[],MKN=0,RV=null,BD=Infinity;const msNew=()=>{MS=MSF({ms_acos:Math.acos,ms_log2:Math.log2});MX=MS.ex;MX.ms_init();TCU=GCU=RV=null;MKO=[];};msNew();
const rv=()=>RV&&RV.buffer===MS.mem.buffer?RV:(RV=mv(15)),bvOf=(a,n)=>({ord:mv(a).slice(),NL:mv(a+1).slice(),NH:mv(a+2).slice(),S:mv(a+3).slice(),C:mv(a+4).slice(),n}),bvIn=(B,a)=>[B.ord,B.NL,B.NH,B.S,B.C].forEach((x,i)=>mv(a+i).set(x)),cur=X=>{TCU=X;MKO=[];return X;};
const tset=X=>{if(TCU===X)return;const f=X.N?1:0;MX.ms_tl(X.V.length/3,X.B.n,f);mv(3).set(X.V);mv(4).set(X.T);if(f){mv(5).set(X.N);mv(7).set(X.C);mv(8).set(X.TT);mv(9).set(X.VN);}bvIn(X.B,10);cur(X);};
const tmk=(V,T,n)=>{MX.ms_tl(V.length/3,n,0);mv(3).set(V);mv(4).set(T);MX.ms_tbvh(n);return cur({V,T,B:bvOf(10,n)});};
const gset=G=>{if(GCU===G)return;MX.ms_gl(G.B.n);mv(16).set(G.A);G.L&&mv(17).set(G.L);bvIn(G.B,18);GCU=G;};
const gmk=(A,L)=>{const n=A.length/6;MX.ms_gl(n);mv(16).set(A);L&&mv(17).set(L);MX.ms_gbvh(n);return GCU={A,L,B:bvOf(18,n)};};
const mslot=m=>{if(typeof m==='function')throw new Error('mesh filters are triangle masks, not functions');let s=MKO.indexOf(m);if(s<0){s=MKN++%7;MKO[s]=m;mv(23).set(m,s*TCU.B.n);}return s;},fm=f=>f==null||typeof f==='number'?-1:mslot(f),fk=f=>typeof f==='number'?f:-1,cpo=(o,t)=>{if(t>=0){const R=rv();for(let k=0;k<6;k++)o[k]=R[k];}return t;};
export function surfOf(inp){
  let S=SC.get(inp);if(S)return S;
  const P=inp.pos,I=inp.idx,nt=I.length/3,np=P.length/3,fid=new Int32Array(nt).fill(-1);
  for(const g of inp.groups||[])for(let t=g[0]/3;t<(g[0]+g[1])/3;t++)fid[t]=g[2];
  MX.ms_bin(np,nt);mv(1).set(P);mv(2).set(I);const nv=MX.ms_surf(np,nt),R=rv();
  S=cur({V:mv(3).slice(),T:mv(4).slice(),nv,nt,fid,N:mv(5).slice(),Ar:mv(6).slice(),C:mv(7).slice(),TT:mv(8).slice(),VN:mv(9).slice(),B:bvOf(10,nt),lo:[R[8],R[9],R[10]],hi:[R[11],R[12],R[13]],diag:R[14],inp});
  S.area=R[15];S.volume=inp.volume||0;SC.set(inp,S);return S;
}
export function closest(S,px,py,pz,filt,o=CQ,nf){tset(S);const m=fm(filt),k=fk(filt),t=nf?MX.ms_cl(px,py,pz,m,k,nf[0],nf[1],nf[2],nf[3],1):MX.ms_cl(px,py,pz,m,k,0,0,0,0,0);BD=rv()[6];return cpo(o,t);}
export function raycast(S,ox,oy,oz,dx,dy,dz,tmax,filt,eps=1e-9){tset(S);const t=MX.ms_ray(ox,oy,oz,dx,dy,dz,tmax,fm(filt),fk(filt),eps);BD=rv()[6];return t;}
export function sdf(S,px,py,pz,o){tset(S);const d=MX.ms_sdf(px,py,pz),R=rv();BD=R[6];if(o&&R[7]>=0)for(let k=0;k<6;k++)o[k]=R[k];return d;}
export function insideSign(S,px,py,pz){return sdf(S,px,py,pz)>0?1:-1;}
export function thickOf(S){if(S.th)return S;tset(S);MX.ms_thick(S.diag);S.th=mv(25).slice();S.tj=mv(26).slice();S.tc=mv(27).slice();return S;}
export function thicknessStats(inp){const S=thickOf(surfOf(inp)),L=[];let A=0;for(let t=0;t<S.nt;t++)if(isFinite(S.th[t])&&S.Ar[t]>0){L.push([S.th[t],S.Ar[t]]);A+=S.Ar[t];}L.sort((a,b)=>a[0]-b[0]);const pct=p=>{let s=0;for(const[t,a]of L){s+=a;if(s>=p*A)return t;}return L.length?L[L.length-1][0]:Infinity;};return{min:L.length?L[0][0]:Infinity,p02:pct(0.02),p05:pct(0.05),p50:pct(0.5)};}
export function detectSheet(inp,opt={}){
  const S=thickOf(surfOf(inp)),{nt,th,tj,tc,Ar,N,TT}=S,tol=opt.ttol||0.12,pr=[];
  for(let t=0;t<nt;t++)if(tc[t]<-0.94&&isFinite(th[t])&&Ar[t]>0)pr.push(t);
  if(!pr.length)return{ok:false,reason:'no opposite face pairs'};
  pr.sort((a,b)=>th[a]-th[b]);const cl=[];for(const t of pr){const c=cl[cl.length-1];c&&th[t]<=c.t0*(1+tol)?(c.ts.push(t),c.a+=Ar[t]):cl.push({t0:th[t],ts:[t],a:Ar[t]});}
  cl.sort((a,b)=>b.a-a.a);let why='';
  for(const c of cl.slice(0,5)){
    let acc=0,tm=c.t0;for(const t of c.ts){acc+=Ar[t];if(acc>=c.a/2){tm=th[t];break;}}
    const inS=new Uint8Array(nt);for(const t of c.ts)if(Math.abs(th[t]-tm)<=tol*tm)inS[t]=1;
    const comp=new Int32Array(nt).fill(-1);let nc=0;
    for(let t=0;t<nt;t++){if(!inS[t]||comp[t]>=0)continue;const st=[t];comp[t]=nc;while(st.length){const u=st.pop();for(let k=0;k<3;k++){const w=TT[3*u+k];if(w>=0&&inS[w]&&comp[w]<0&&N[3*u]*N[3*w]+N[3*u+1]*N[3*w+1]+N[3*u+2]*N[3*w+2]>0.2){comp[w]=nc;st.push(w);}}}nc++;}
    const adj=Array.from({length:nc},()=>new Map());let bad=0;
    for(let t=0;t<nt;t++){if(!inS[t])continue;const j=tj[t];if(j<0||!inS[j])continue;const a=comp[t],b=comp[j];a===b?bad+=Ar[t]:adj[a].set(b,(adj[a].get(b)||0)+Ar[t]);}
    const ca=new Float64Array(nc);for(let t=0;t<nt;t++)if(inS[t])ca[comp[t]]+=Ar[t];
    if(bad>0.02*c.a){why='faces at '+tm.toFixed(3)+' mm pair with themselves';continue;}
    const col=new Int8Array(nc).fill(-1);let conflict=0;
    for(let s=0;s<nc;s++){if(col[s]>=0)continue;const grp=[s],st=[s];col[s]=0;while(st.length){const u=st.pop();for(const[w,a]of adj[u]){if(col[w]<0){col[w]=1-col[u];grp.push(w);st.push(w);}else if(col[w]===col[u])conflict+=a;}}let a0=0,a1=0;for(const g of grp)col[g]?a1+=ca[g]:a0+=ca[g];if(a1>a0)for(const g of grp)col[g]=1-col[g];}
    if(conflict>0.02*c.a){why='offset faces at '+tm.toFixed(3)+' mm do not split into two sides';continue;}
    const S0=new Uint8Array(nt),S1=new Uint8Array(nt);let a0=0,a1=0;for(let t=0;t<nt;t++)if(inS[t]){const s=col[comp[t]];s?(S1[t]=1,a1+=Ar[t]):(S0[t]=1,a0+=Ar[t]);}
    let l01=0,lb=0;for(let t=0;t<nt;t++){if(!S0[t])continue;for(let k=0;k<3;k++){const u=TT[3*t+k];if(u>=0&&S0[u])continue;const a=3*S.T[3*t+k],b=3*S.T[3*t+(k+1)%3],l=Math.hypot(S.V[a]-S.V[b],S.V[a+1]-S.V[b+1],S.V[a+2]-S.V[b+2]);lb+=l;if(u>=0&&S1[u])l01+=l;}}
    if(l01>0.05*lb){why='offset faces at '+tm.toFixed(3)+' mm touch each other directly';continue;}
    const sF=Uint8Array.from(S0,(v,t)=>v||S1[t]?1:0),o=new Float64Array(6);let sideBad=0,sideA=0,tmin=Infinity,tmax=0;
    for(let t=0;t<nt;t++){if(sF[t]){tmin=Math.min(tmin,th[t]);tmax=Math.max(tmax,th[t]);continue;}sideA+=Ar[t];const j=closest(S,S.C[3*t],S.C[3*t+1],S.C[3*t+2],sF,o);if(j>=0&&Math.abs(N[3*t]*N[3*j]+N[3*t+1]*N[3*j+1]+N[3*t+2]*N[3*j+2])>0.4)sideBad+=Ar[t];}
    if(sideBad>0.03*(a0+a1)){why='faces at '+tm.toFixed(3)+' mm are not of uniform thickness (other faces face the same way)';continue;}
    let vs=0;for(let t=0;t<nt;t++)if(sF[t])vs+=th[t]*Ar[t];const Vs=(a0+a1)/2*vs/(a0+a1),VV=inp.volume||S.volume;if(VV&&Math.abs(Vs/VV-1)>(opt.vtol||0.01)){why='the paired faces at '+tm.toFixed(3)+' mm hold only '+(100*Vs/VV).toFixed(1)+'% of the volume';continue;}
    return{ok:true,t:tm,tmin,tmax,S0,S1,a0,a1,sideA,vfrac:Vs/VV,thin:tm<0.25*Math.sqrt(a0)};
  }
  return{ok:false,reason:why||'no uniform-thickness pairing'};
}
function sizeField(lo,hi,h0,g,samples,maxCells=1500000){
  const ext=[0,1,2].map(k=>hi[k]-lo[k]+2*h0),hs=samples.map(q=>q[3]).sort((a,b)=>a-b);let s=Math.min(h0/2,hs.length?Math.max(hs[Math.floor(hs.length*0.05)],h0/40):h0);const nc=()=>ext.reduce((a,e)=>a*Math.max(2,Math.ceil(e/s)+1),1);while(nc()>maxCells)s*=1.25;
  const n=ext.map(e=>Math.max(2,Math.ceil(e/s)+1)),o=lo.map(v=>v-h0),id=(i,j,k)=>(k*n[1]+j)*n[0]+i;const D=[];for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)if(dk*9+dj*3+di<0)D.push([di,dj,dk,g*s*Math.hypot(di,dj,dk)]);const HX=MHM(MHE);HX.ex.mh_sfi(n[0],n[1],n[2],h0,D.length);let H=HX.v(9);HX.v(10).set(D.flatMap(d=>d.slice(0,3)));HX.v(11).set(D.map(d=>d[3]));
  for(const[x,y,z,h]of samples){const i=Math.round((x-o[0])/s),j=Math.round((y-o[1])/s),k=Math.round((z-o[2])/s);if(i<0||j<0||k<0||i>=n[0]||j>=n[1]||k>=n[2])continue;const q=id(i,j,k);if(h<H[q])H[q]=h;}
  HX.ex.mh_sfs(D.length);H=HX.v(9).slice();
  return(x,y,z)=>{const fx=Math.min(n[0]-1.001,Math.max(0,(x-o[0])/s)),fy=Math.min(n[1]-1.001,Math.max(0,(y-o[1])/s)),fz=Math.min(n[2]-1.001,Math.max(0,(z-o[2])/s)),i=Math.floor(fx),j=Math.floor(fy),k=Math.floor(fz),tx=fx-i,ty=fy-j,tz=fz-k;let v=0;for(let c=0;c<8;c++){const a=c&1,b=(c>>1)&1,d=c>>2;v+=(a?tx:1-tx)*(b?ty:1-ty)*(d?tz:1-tz)*H[id(i+a,j+b,k+d)];}return v;};
}
function patchSizes(S,sel,t,h0,opt){
  const{nt,T,V,TT,N,C}=S,smp=[],nc=opt.circle||32,hmin=opt.minSize||h0/40,bnd=new Map(),o=new Float64Array(6),clamp=h=>Math.max(hmin,Math.min(h0,h));
  for(let q=0;q<nt;q++){if(!sel[q])continue;for(let k=0;k<3;k++){const u=TT[3*q+k],a=T[3*q+k],b=T[3*q+(k+1)%3];if(u>=0&&sel[u]){if(a<b){const cs=N[3*q]*N[3*u]+N[3*q+1]*N[3*u+1]+N[3*q+2]*N[3*u+2],ph=Math.acos(Math.max(-1,Math.min(1,cs)));if(ph>1e-3&&ph<0.5){const d=Math.hypot(C[3*q]-C[3*u],C[3*q+1]-C[3*u+1],C[3*q+2]-C[3*u+2]);const R=d/ph,h=clamp(R*Math.PI/2/(opt.bend||4)),el=Math.hypot(V[3*a]-V[3*b],V[3*a+1]-V[3*b+1],V[3*a+2]-V[3*b+2]),ns=Math.max(1,Math.ceil(el/h));for(let j=0;j<=ns;j++){const w=j/ns;smp.push([V[3*a]+w*(V[3*b]-V[3*a]),V[3*a+1]+w*(V[3*b+1]-V[3*a+1]),V[3*a+2]+w*(V[3*b+2]-V[3*a+2]),h,clamp(R*Math.PI/6)]);}}}continue;}
      (bnd.get(a)||bnd.set(a,[]).get(a)).push([b,q]);(bnd.get(b)||bnd.set(b,[]).get(b)).push([a,q]);}}
  for(const[v,L]of bnd){if(L.length!==2)continue;const[u,q]=L[0],[w]=L[1],ex=V[3*v]-V[3*u],ey=V[3*v+1]-V[3*u+1],ez=V[3*v+2]-V[3*u+2],fx=V[3*w]-V[3*v],fy=V[3*w+1]-V[3*v+1],fz=V[3*w+2]-V[3*v+2],l1=Math.hypot(ex,ey,ez),l2=Math.hypot(fx,fy,fz),th=Math.acos(Math.max(-1,Math.min(1,(ex*fx+ey*fy+ez*fz)/(l1*l2||1))));let h=h0;
    let hf2=h0;if(th>1e-3&&th<0.6){const R=(l1+l2)/2/th;h=clamp(R*2*Math.PI/nc);hf2=clamp(R*Math.PI/6);}
    const tx=(V[3*w]-V[3*u])/(l1+l2),ty=(V[3*w+1]-V[3*u+1])/(l1+l2),tz=(V[3*w+2]-V[3*u+2])/(l1+l2),nx=N[3*q],ny=N[3*q+1],nz=N[3*q+2];let mx=ny*tz-nz*ty,my=nz*tx-nx*tz,mz=nx*ty-ny*tx;const ml=Math.hypot(mx,my,mz)||1;mx/=ml;my/=ml;mz/=ml;if(mx*(C[3*q]-V[3*v])+my*(C[3*q+1]-V[3*v+1])+mz*(C[3*q+2]-V[3*v+2])<0){mx=-mx;my=-my;mz=-mz;}
    const ox=V[3*v]-nx*t/2+mx*t*1e-3,oy=V[3*v+1]-ny*t/2+my*t*1e-3,oz=V[3*v+2]-nz*t/2+mz*t*1e-3,j=raycast(S,ox,oy,oz,mx,my,mz,h0*(opt.lig||3)*4,null);if(j>=0){h=Math.min(h,clamp(BD/(opt.lig||3)));hf2=Math.min(hf2,clamp(BD/2));}
    smp.push([V[3*v],V[3*v+1],V[3*v+2],h,hf2]);}
  return{smp,hmin};
}
function remesh(S,sel,hf,opt={}){
  const map=new Int32Array(S.nv).fill(-1),X=[],T=[],ot=[];
  for(let t=0;t<S.nt;t++)if(sel[t]){ot.push(t);for(let k=0;k<3;k++){const v=S.T[3*t+k];if(map[v]<0){map[v]=X.length/3;X.push(S.V[3*v],S.V[3*v+1],S.V[3*v+2]);}T.push(map[v]);}}
  const nO=X.length/3,E0=new Map(),cr=Math.cos((opt.crease||30)*Math.PI/180),FE=new Map(),fa=Array.from({length:nO},()=>[]);
  for(let q=0;q<ot.length;q++)for(let k=0;k<3;k++){const key=ek(T[3*q+k],T[3*q+(k+1)%3]),e=E0.get(key);e?e.push(q):E0.set(key,[q]);}
  const dN=(p,q)=>{const a=3*ot[p],b=3*ot[q];return S.N[a]*S.N[b]+S.N[a+1]*S.N[b+1]+S.N[a+2]*S.N[b+2];};
  for(const[key,ts]of E0)if(ts.length!==2||dN(ts[0],ts[1])<cr){FE.set(key,-1);fa[ka(key)].push(kb(key));fa[kb(key)].push(ka(key));}
  const vt=[],lv=[],P=i=>[X[3*i],X[3*i+1],X[3*i+2]];
  for(let v=0;v<nO;v++){const f=fa[v];let ty=f.length?2:0;if(f.length===2){const[a,b]=f,e1=[X[3*v]-X[3*a],X[3*v+1]-X[3*a+1],X[3*v+2]-X[3*a+2]],e2=[X[3*b]-X[3*v],X[3*b+1]-X[3*v+1],X[3*b+2]-X[3*v+2]],c=(e1[0]*e2[0]+e1[1]*e2[1]+e1[2]*e2[2])/(Math.hypot(...e1)*Math.hypot(...e2)||1);ty=c>Math.cos((opt.corner||35)*Math.PI/180)?1:2;}vt.push(ty);lv.push(-1);}
  let nl=0;for(const[key,id]of FE){if(id>=0)continue;const L=nl++;FE.set(key,L);const st=[ka(key),kb(key)];while(st.length){const v=st.pop();if(vt[v]!==1)continue;lv[v]=L;for(const u of fa[v]){const k2=ek(u,v);if(FE.get(k2)===-1){FE.set(k2,L);st.push(u);}}}}
  const segs=[...FE.keys()],ns=segs.length,SA=new Float64Array(6*ns),SID=new Int32Array(ns),TS=new Int32Array(3*ot.length);
  segs.forEach((key,i)=>{const a=ka(key),b=kb(key);for(let k=0;k<3;k++){SA[6*i+k]=X[3*a+k];SA[6*i+3+k]=X[3*b+k];}SID[i]=FE.get(key);});ot.forEach((t,i)=>{for(let k=0;k<3;k++)TS[3*i+k]=S.T[3*t+k];});
  const GS=gmk(SA,SID),PS=tmk(S.V,TS,ot.length),projS=(x,y,z)=>{tset(PS);const i=MX.ms_cl(x,y,z,-1,-1,0,0,0,0,0),R=rv();BD=R[6];return i<0?[x,y,z]:[R[0],R[1],R[2]];},projF=(x,y,z,L)=>{gset(GS);const i=MX.ms_gn(x,y,z,L,1),R=rv();BD=R[6];return i<0?[x,y,z]:[R[0],R[1],R[2]];};
  const al=new Array(T.length/3).fill(1),hT=(a,b)=>2*hf((X[3*a]+X[3*b])/2,(X[3*a+1]+X[3*b+1])/2,(X[3*a+2]+X[3*b+2])/2),dist=(a,b)=>Math.hypot(X[3*a]-X[3*b],X[3*a+1]-X[3*b+1],X[3*a+2]-X[3*b+2]);
  const nrm=(a,b,c,pa)=>{const A=pa||P(a),ux=X[3*b]-A[0],uy=X[3*b+1]-A[1],uz=X[3*b+2]-A[2],wx=X[3*c]-A[0],wy=X[3*c+1]-A[1],wz=X[3*c+2]-A[2];return[uy*wz-uz*wy,uz*wx-ux*wz,ux*wy-uy*wx];},tn=t=>nrm(T[3*t],T[3*t+1],T[3*t+2]);
  const edges=()=>{const M=new Map();for(let t=0;t<al.length;t++){if(!al[t])continue;for(let k=0;k<3;k++){const key=ek(T[3*t+k],T[3*t+(k+1)%3]),e=M.get(key);e?e.push(t):M.set(key,[t]);}}return M;};
  const rings=()=>{const R=Array.from({length:X.length/3},()=>[]);for(let t=0;t<al.length;t++)if(al[t])for(let k=0;k<3;k++)R[T[3*t+k]].push(t);return R;};
  const fix=(M,key,o,n)=>{const e=M.get(key);if(e){const i=e.indexOf(o);if(i>=0)e[i]=n;}},addE=(M,key,t)=>{const e=M.get(key);e?e.push(t):M.set(key,[t]);},orient=(t0,a,b)=>{let i=0;while(i<3&&!(T[3*t0+i]===a&&T[3*t0+(i+1)%3]===b))i++;return i;};
  const split=()=>{const M=edges();let n=0;for(let rd=0;rd<60;rd++){if(rd)flip(M);const cand=[],lng=new Set();for(let t=0;t<al.length;t++){if(!al[t])continue;let bk=-1,bl=-1;for(let k=0;k<3;k++){const a=T[3*t+k],b=T[3*t+(k+1)%3],l=dist(a,b);if(l>bl){bl=l;bk=ek(a,b);}}lng.add(bk);}for(const key of lng){const a=ka(key),b=kb(key),r=dist(a,b)/hT(a,b);if(r>4/3)cand.push([r,key]);}if(!cand.length)break;cand.sort((x,y)=>y[0]-x[0]);
    for(const[,key]of cand){const ts=M.get(key);if(!ts)continue;const a=ka(key),b=kb(key),f=FE.get(key),m=X.length/3,mx=(X[3*a]+X[3*b])/2,my=(X[3*a+1]+X[3*b+1])/2,mz=(X[3*a+2]+X[3*b+2])/2;pushAll(X,(f!==undefined?projF(mx,my,mz,f):projS(mx,my,mz)));vt.push(f!==undefined?1:0);lv.push(f!==undefined?f:-1);
      if(f!==undefined){FE.delete(key);FE.set(ek(a,m),f);FE.set(ek(m,b),f);}M.delete(key);
      for(const t of ts){const o=3*t;let i=0;while(i<3&&!((T[o+i]===a&&T[o+(i+1)%3]===b)||(T[o+i]===b&&T[o+(i+1)%3]===a)))i++;const u=T[o+i],w=T[o+(i+1)%3],c=T[o+(i+2)%3],t2=al.length;T[o]=u;T[o+1]=m;T[o+2]=c;T.push(m,w,c);al.push(1);fix(M,ek(w,c),t,t2);addE(M,ek(u,m),t);addE(M,ek(m,w),t2);M.set(ek(m,c),[t,t2]);}n++;}}
    return n;};
  const ang=(v,p,q)=>{const ux=X[3*p]-X[3*v],uy=X[3*p+1]-X[3*v+1],uz=X[3*p+2]-X[3*v+2],wx=X[3*q]-X[3*v],wy=X[3*q+1]-X[3*v+1],wz=X[3*q+2]-X[3*v+2];return Math.acos(Math.max(-1,Math.min(1,(ux*wx+uy*wy+uz*wz)/(Math.hypot(ux,uy,uz)*Math.hypot(wx,wy,wz)||1))));};
  const flip=(M0)=>{const M=M0||edges(),Q=[...M.keys()],inQ=new Set(Q);let n=0,g=0;
    while(Q.length&&g++<4e6){const key=Q.pop();inQ.delete(key);const ts=M.get(key);if(!ts||ts.length!==2||FE.has(key))continue;let a=ka(key),b=kb(key);const t0=ts[0],t1=ts[1];let i=orient(t0,a,b);if(i===3){[a,b]=[b,a];i=orient(t0,a,b);}if(i===3)continue;
      const c=T[3*t0+(i+2)%3],d=T[3*t1]!==a&&T[3*t1]!==b?T[3*t1]:T[3*t1+1]!==a&&T[3*t1+1]!==b?T[3*t1+1]:T[3*t1+2];if(c===d||M.has(ek(c,d)))continue;
      if(ang(c,a,b)+ang(d,a,b)<=Math.PI+1e-6)continue;const n0=tn(t0),n1=tn(t1),l0=Math.hypot(...n0),l1=Math.hypot(...n1);if((n0[0]*n1[0]+n0[1]*n1[1]+n0[2]*n1[2])<0.95*l0*l1)continue;
      const m=[n0[0]/l0+n1[0]/l1,n0[1]/l0+n1[1]/l1,n0[2]/l0+n1[2]/l1],p=nrm(a,d,c),q=nrm(d,b,c),lp=Math.hypot(...p),lq=Math.hypot(...q),lm=Math.hypot(...m);if(!(lp>0&&lq>0)||(p[0]*m[0]+p[1]*m[1]+p[2]*m[2])<0.8*lp*lm||(q[0]*m[0]+q[1]*m[1]+q[2]*m[2])<0.8*lq*lm)continue;
      T[3*t0]=a;T[3*t0+1]=d;T[3*t0+2]=c;T[3*t1]=d;T[3*t1+1]=b;T[3*t1+2]=c;M.delete(key);M.set(ek(c,d),[t0,t1]);fix(M,ek(a,d),t1,t0);fix(M,ek(b,c),t0,t1);for(const k2 of[ek(a,d),ek(d,b),ek(b,c),ek(c,a)])if(!inQ.has(k2)){inQ.add(k2);Q.push(k2);}n++;}
    return n;};
  const collapse=(relax)=>{const M=edges(),R=rings(),dirty=new Uint8Array(al.length),cand=[];for(const[key,ts]of M){const a=ka(key),b=kb(key),r=dist(a,b)/hT(a,b);if(r<0.8)cand.push([r,key,ts]);}cand.sort((x,y)=>x[0]-y[0]);let n=0;
    for(const[,key,ts]of cand){const a=ka(key),b=kb(key);if(R[a].some(t=>dirty[t]||!al[t])||R[b].some(t=>dirty[t]||!al[t]))continue;const f=FE.get(key),ta=vt[a],tb=vt[b];let k,r,p;
      if(f===undefined){if(ta>0&&tb>0)continue;k=ta>0?a:tb>0?b:a;r=k===a?b:a;p=vt[k]>0?P(k):projS((X[3*a]+X[3*b])/2,(X[3*a+1]+X[3*b+1])/2,(X[3*a+2]+X[3*b+2])/2);}
      else{if(ta===2&&tb===2)continue;k=ta>=tb?a:b;r=k===a?b:a;p=vt[k]===2?P(k):projF((X[3*a]+X[3*b])/2,(X[3*a+1]+X[3*b+1])/2,(X[3*a+2]+X[3*b+2])/2,f);}
      const nb=v=>{const s=new Set();for(const t of R[v])for(let j=0;j<3;j++)s.add(T[3*t+j]);s.delete(a);s.delete(b);return s;},Na=nb(a),Nb=nb(b);let com=0;for(const v of Na)if(Nb.has(v))com++;if(com!==ts.length)continue;
      let okk=true,lm=0;if(relax)for(const v of Na)lm=Math.max(lm,dist(a,v));if(relax)for(const v of Nb)lm=Math.max(lm,dist(b,v));for(const v of[...Na,...Nb]){const h=2*hf((p[0]+X[3*v])/2,(p[1]+X[3*v+1])/2,(p[2]+X[3*v+2])/2);if(Math.hypot(p[0]-X[3*v],p[1]-X[3*v+1],p[2]-X[3*v+2])>Math.max(4/3*h,lm)){okk=false;break;}}if(!okk)continue;
      for(const t of new Set([...R[a],...R[b]])){const o=3*t,vs=[T[o],T[o+1],T[o+2]];if(vs.includes(a)&&vs.includes(b))continue;const old=nrm(vs[0],vs[1],vs[2]),w=vs.map(v=>v===r?k:v);const pts=w.map(v=>v===k?p:P(v)),ux=pts[1][0]-pts[0][0],uy=pts[1][1]-pts[0][1],uz=pts[1][2]-pts[0][2],wx=pts[2][0]-pts[0][0],wy=pts[2][1]-pts[0][1],wz=pts[2][2]-pts[0][2],nn=[uy*wz-uz*wy,uz*wx-ux*wz,ux*wy-uy*wx],ln=Math.hypot(...nn),lo=Math.hypot(...old);if(!(ln>1e-14*lo)||(nn[0]*old[0]+nn[1]*old[1]+nn[2]*old[2])<0.5*ln*lo){okk=false;break;}}
      if(!okk)continue;
      for(const t of ts)al[t]=0;for(const t of R[r])if(al[t])for(let j=0;j<3;j++)if(T[3*t+j]===r)T[3*t+j]=k;X[3*k]=p[0];X[3*k+1]=p[1];X[3*k+2]=p[2];
      for(const v of[...Nb,k]){const k2=ek(r,v);if(FE.has(k2)){const id=FE.get(k2);FE.delete(k2);if(v!==k)FE.set(ek(k,v),id);}}
      for(const t of R[a])dirty[t]=1;for(const t of R[b])dirty[t]=1;n++;}
    return n;};
  const smooth=lam=>{const R=rings(),nv=X.length/3,NX=X.slice();
    for(let v=0;v<nv;v++){if(vt[v]===2||!R[v].length)continue;const s=new Set();for(const t of R[v])for(let j=0;j<3;j++)s.add(T[3*t+j]);s.delete(v);let cx=0,cy=0,cz=0,c=0,q;
      if(vt[v]===1){for(const u of s)if(FE.has(ek(u,v))){cx+=X[3*u];cy+=X[3*u+1];cz+=X[3*u+2];c++;}if(c!==2)continue;q=projF(X[3*v]+lam*(cx/c-X[3*v]),X[3*v+1]+lam*(cy/c-X[3*v+1]),X[3*v+2]+lam*(cz/c-X[3*v+2]),lv[v]);}
      else{let nx=0,ny=0,nz=0;for(const t of R[v]){const n=tn(t);nx+=n[0];ny+=n[1];nz+=n[2];}const ln=Math.hypot(nx,ny,nz)||1;nx/=ln;ny/=ln;nz/=ln;let ws=0;for(const t of R[v]){const a=3*T[3*t],b=3*T[3*t+1],c2=3*T[3*t+2],gx=(X[a]+X[b]+X[c2])/3,gy=(X[a+1]+X[b+1]+X[c2+1])/3,gz=(X[a+2]+X[b+2]+X[c2+2])/3,w=Math.hypot(...tn(t))/Math.max(hf(gx,gy,gz),1e-9)**2;cx+=w*gx;cy+=w*gy;cz+=w*gz;ws+=w;}let dx=cx/ws-X[3*v],dy=cy/ws-X[3*v+1],dz=cz/ws-X[3*v+2];const dn=dx*nx+dy*ny+dz*nz;dx-=dn*nx;dy-=dn*ny;dz-=dn*nz;q=projS(X[3*v]+lam*dx,X[3*v+1]+lam*dy,X[3*v+2]+lam*dz);}
      NX[3*v]=q[0];NX[3*v+1]=q[1];NX[3*v+2]=q[2];}
    for(let rep=0;rep<3;rep++){let bad=0;for(let t=0;t<al.length;t++){if(!al[t])continue;const o=nrm(T[3*t],T[3*t+1],T[3*t+2]),a=3*T[3*t],b=3*T[3*t+1],c=3*T[3*t+2],ux=NX[b]-NX[a],uy=NX[b+1]-NX[a+1],uz=NX[b+2]-NX[a+2],wx=NX[c]-NX[a],wy=NX[c+1]-NX[a+1],wz=NX[c+2]-NX[a+2],n=[uy*wz-uz*wy,uz*wx-ux*wz,ux*wy-uy*wx];if((n[0]*o[0]+n[1]*o[1]+n[2]*o[2])<0.3*Math.hypot(...n)*Math.hypot(...o)||!(Math.hypot(...n)>0)){for(const q of[a,b,c])for(let j=0;j<3;j++)NX[q+j]=X[q+j];bad++;}}if(!bad)break;}
    for(let i=0;i<X.length;i++)X[i]=NX[i];};
  const its=opt.iters||8;
  for(let s=0;s<20&&collapse(true);s++)flip();
  for(let it=0;it<its;it++){const a=split(),b=flip();let c=0,cc=0;for(let s=0;s<3&&(cc=collapse(false));s++)c+=cc;const d=flip();if(!a&&!c&&!d&&it>2)break;smooth(0.5);smooth(0.5);}
  for(let r=0;r<4;r++){flip();smooth(0.5);}flip();
  const re=new Int32Array(X.length/3).fill(-1),XO=[],TO=[],vO=[],lO=[];for(let t=0;t<al.length;t++){if(!al[t])continue;for(let j=0;j<3;j++){const v=T[3*t+j];if(re[v]<0){re[v]=XO.length/3;XO.push(X[3*v],X[3*v+1],X[3*v+2]);vO.push(vt[v]);lO.push(lv[v]);}TO.push(re[v]);}}
  const F2=new Map();for(const[key,id]of FE){const a=re[ka(key)],b=re[kb(key)];if(a>=0&&b>=0)F2.set(ek(a,b),id);}
  let amin=180;for(let t=0;t<TO.length/3;t++)for(let k=0;k<3;k++){const v=3*TO[3*t+k],p=3*TO[3*t+(k+1)%3],q=3*TO[3*t+(k+2)%3],ux=XO[p]-XO[v],uy=XO[p+1]-XO[v+1],uz=XO[p+2]-XO[v+2],wx=XO[q]-XO[v],wy=XO[q+1]-XO[v+1],wz=XO[q+2]-XO[v+2];amin=Math.min(amin,Math.acos(Math.max(-1,Math.min(1,(ux*wx+uy*wy+uz*wz)/(Math.hypot(ux,uy,uz)*Math.hypot(wx,wy,wz)||1))))*180/Math.PI);}
  return{X:Float64Array.from(XO),T:Int32Array.from(TO),vt:vO,lv:lO,FE:F2,projS,projF,amin};
}
function qsin(X,Q,q){const P=[0,1,2,3].map(j=>3*Q[4*q+j]);const ux=X[P[2]]-X[P[0]],uy=X[P[2]+1]-X[P[0]+1],uz=X[P[2]+2]-X[P[0]+2],wx=X[P[3]]-X[P[1]],wy=X[P[3]+1]-X[P[1]+1],wz=X[P[3]+2]-X[P[1]+2],nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx,ln=Math.hypot(nx,ny,nz)||1;let m=1;for(let i=0;i<4;i++){const c=P[i],n=P[(i+1)%4],p=P[(i+3)%4],ax=X[n]-X[c],ay=X[n+1]-X[c+1],az=X[n+2]-X[c+2],bx=X[p]-X[c],by=X[p+1]-X[c+1],bz=X[p+2]-X[c+2],s=((ay*bz-az*by)*nx+(az*bx-ax*bz)*ny+(ax*by-ay*bx)*nz)/ln/(Math.hypot(ax,ay,az)*Math.hypot(bx,by,bz)||1);if(s<m)m=s;}return m;}
function quadify(R,opt={}){
  const{X,T,FE,projS,projF}=R,nt=T.length/3,M=new Map(),pt=i=>[X[3*i],X[3*i+1],X[3*i+2]];
  for(let t=0;t<nt;t++)for(let k=0;k<3;k++){const key=ek(T[3*t+k],T[3*t+(k+1)%3]),e=M.get(key);e?e.push(t):M.set(key,[t]);}
  const qual=q=>{const P=q.map(pt);let nx=0,ny=0,nz=0;for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4];nx+=(a[1]-b[1])*(a[2]+b[2]);ny+=(a[2]-b[2])*(a[0]+b[0]);nz+=(a[0]-b[0])*(a[1]+b[1]);}const ln=Math.hypot(nx,ny,nz)||1;let m=1;for(let i=0;i<4;i++){const c=P[i],n=P[(i+1)%4],p=P[(i+3)%4],e1=[n[0]-c[0],n[1]-c[1],n[2]-c[2]],e2=[p[0]-c[0],p[1]-c[1],p[2]-c[2]],cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]],s=(cr[0]*nx+cr[1]*ny+cr[2]*nz)/ln/(Math.hypot(...e1)*Math.hypot(...e2)||1);m=Math.min(m,s);}return m;};
  const cand=[];for(const[key,ts]of M){if(ts.length!==2||FE.has(key))continue;let a=ka(key),b=kb(key);const t0=ts[0],t1=ts[1];let i=0;while(i<3&&!(T[3*t0+i]===a&&T[3*t0+(i+1)%3]===b))i++;if(i===3){[a,b]=[b,a];i=0;while(i<3&&!(T[3*t0+i]===a&&T[3*t0+(i+1)%3]===b))i++;}if(i===3)continue;const c=T[3*t0+(i+2)%3],d=[T[3*t1],T[3*t1+1],T[3*t1+2]].find(v=>v!==a&&v!==b);const q=[a,d,b,c],s=qual(q);if(s>(opt.qmin||0.5))cand.push([s,t0,t1,q]);}
  cand.sort((x,y)=>y[0]-x[0]);const used=new Uint8Array(nt),polys=[];for(const[,t0,t1,q]of cand){if(used[t0]||used[t1])continue;used[t0]=used[t1]=1;polys.push(q);}for(let t=0;t<nt;t++)if(!used[t])polys.push([T[3*t],T[3*t+1],T[3*t+2]]);
  const XO=Array.from(X),qt=[...R.vt],ql=[...R.lv],QF=new Map(),mid=new Map(),mk=(a,b)=>{const key=ek(a,b);let m=mid.get(key);if(m===undefined){const f=FE.get(key),x=(X[3*a]+X[3*b])/2,y=(X[3*a+1]+X[3*b+1])/2,z=(X[3*a+2]+X[3*b+2])/2;m=XO.length/3;pushAll(XO,(f!==undefined?projF(x,y,z,f):projS(x,y,z)));qt.push(f!==undefined?1:0);ql.push(f!==undefined?f:-1);if(f!==undefined){QF.set(ek(a,m),f);QF.set(ek(m,b),f);}mid.set(key,m);}return m;},Q=[];
  let nq=0,ntr=0;for(const p of polys){const n=p.length;n===4?nq++:ntr++;let cx=0,cy=0,cz=0;for(const v of p){cx+=X[3*v];cy+=X[3*v+1];cz+=X[3*v+2];}const o=XO.length/3;pushAll(XO,projS(cx/n,cy/n,cz/n));qt.push(0);ql.push(-1);const ms=p.map((v,i)=>mk(v,p[(i+1)%n]));for(let i=0;i<n;i++)Q.push(p[i],ms[i],o,ms[(i+n-1)%n]);}
  const nn=XO.length/3,nQ=Q.length/4,nb=Array.from({length:nn},()=>new Set()),vq=Array.from({length:nn},()=>[]);for(let q=0;q<nQ;q++)for(let j=0;j<4;j++){const a=Q[4*q+j],b=Q[4*q+(j+1)%4];nb[a].add(b);nb[b].add(a);vq[a].push(q);}
  for(let rep=0;rep<(opt.qsmooth??4);rep++){const NX=XO.slice();for(let v=0;v<nn;v++){if(qt[v]===2)continue;let cx=0,cy=0,cz=0,c=0;if(qt[v]===1){for(const u of nb[v])if(QF.has(ek(u,v))){cx+=XO[3*u];cy+=XO[3*u+1];cz+=XO[3*u+2];c++;}if(c!==2)continue;const q=projF(XO[3*v]+0.5*(cx/2-XO[3*v]),XO[3*v+1]+0.5*(cy/2-XO[3*v+1]),XO[3*v+2]+0.5*(cz/2-XO[3*v+2]),ql[v]);NX[3*v]=q[0];NX[3*v+1]=q[1];NX[3*v+2]=q[2];continue;}
      for(const u of nb[v]){cx+=XO[3*u];cy+=XO[3*u+1];cz+=XO[3*u+2];c++;}const q=projS(XO[3*v]+0.5*(cx/c-XO[3*v]),XO[3*v+1]+0.5*(cy/c-XO[3*v+1]),XO[3*v+2]+0.5*(cz/c-XO[3*v+2]));NX[3*v]=q[0];NX[3*v+1]=q[1];NX[3*v+2]=q[2];}
    for(let r2=0;r2<3;r2++){let bad=0;for(let q=0;q<nQ;q++){const o=qsin(XO,Q,q),n=qsin(NX,Q,q);if(n<Math.min(0.3,o)){for(let j=0;j<4;j++){const p=3*Q[4*q+j];NX[p]=XO[p];NX[p+1]=XO[p+1];NX[p+2]=XO[p+2];}bad++;}}if(!bad)break;}
    for(let i=0;i<XO.length;i++)XO[i]=NX[i];}
  let qmin=1;for(let q=0;q<nQ;q++)qmin=Math.min(qmin,qsin(XO,Q,q));
  return{X:Float64Array.from(XO),Q:Int32Array.from(Q),nq,ntr,qmin};
}
export function meshQuality(X,E,sample){const ne=E.length/8,st=sample&&ne>sample?Math.ceil(ne/sample):1,HX=mhOf(X,E);HX.ex.mh_quality(st);const R=HX.v(3);return{ne,minSJ:R[1],lowSJ:R[2],neg:R[3],maxAR:R[4],volume:R[5],minDet:R[6]};}
function tagFacets(S,X,E,bf,filt){
  const ff=new Int32Array(bf.length),o=new Float64Array(6);
  for(let i=0;i<bf.length;i++){const e=Math.floor(bf[i]/6),f=HEX_FACES[bf[i]%6],P=f.map(a=>3*E[8*e+a]);let cx=0,cy=0,cz=0;for(const p of P){cx+=X[p]/4;cy+=X[p+1]/4;cz+=X[p+2]/4;}const ux=X[P[2]]-X[P[0]],uy=X[P[2]+1]-X[P[0]+1],uz=X[P[2]+2]-X[P[0]+2],wx=X[P[3]]-X[P[1]],wy=X[P[3]+1]-X[P[1]+1],wz=X[P[3]+2]-X[P[1]+2],nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx,l=Math.hypot(nx,ny,nz)||1,fl=filt?filt(i):null;
    const sz=Math.max(Math.hypot(ux,uy,uz),Math.hypot(wx,wy,wz));let t=closest(S,cx,cy,cz,fl,o,[nx,ny,nz,0.3*l]);if(t<0||(o[0]-cx)**2+(o[1]-cy)**2+(o[2]-cz)**2>sz*sz)t=closest(S,cx,cy,cz,fl,o);if(t<0)t=closest(S,cx,cy,cz,null,o);ff[i]=t>=0?S.fid[t]:-1;}
  return ff;
}
function faceTable(S){
  if(S.ft)return S.ft;const ft=new Map();for(let t=0;t<S.nt;t++){const f=S.fid[t];let q=ft.get(f);if(!q)ft.set(f,q={a:0,c:[0,0,0],n:[0,0,0],nmin:1,t0:t});const a=S.Ar[t];q.a+=a;for(let k=0;k<3;k++){q.c[k]+=a*S.C[3*t+k];q.n[k]+=a*S.N[3*t+k];}}
  for(const q of ft.values()){for(let k=0;k<3;k++)q.c[k]/=q.a||1;const l=Math.hypot(...q.n)||1;q.n=q.n.map(v=>v/l);}
  for(let t=0;t<S.nt;t++){const q=ft.get(S.fid[t]);q.nmin=Math.min(q.nmin,S.N[3*t]*q.n[0]+S.N[3*t+1]*q.n[1]+S.N[3*t+2]*q.n[2]);}
  return S.ft=ft;
}
export function faceIds(inp,spec){
  const S=surfOf(inp),ft=faceTable(S),out=new Set(),lo=S.lo,hi=S.hi,size=S.diag,F=inp.faces,o=new Float64Array(6);
  const walk=s=>{if(s==null)return;if(typeof s==='number'){out.add(s);return;}if(Array.isArray(s)||ArrayBuffer.isView(s)){for(const x of s)walk(x);return;}if(s.faces!==undefined&&!s.side&&!s.normal&&!s.pts&&!s.type){walk(s.faces);return;}
    if(s.by==='all'){for(const f of ft.keys())out.add(f);return;}
    if(s.by==='pick'||s.pts){for(const p of s.pts||[]){const t=closest(S,p[0],p[1],p[2],null,o);if(t>=0)out.add(S.fid[t]);}return;}
    if(s.side){const ax=AX[s.side.length===1?'+'+s.side:s.side],i=ax.findIndex(v=>v),ext=ax[i]>0?hi[i]:lo[i];for(const[f,q]of ft)if(q.nmin>0.999&&q.n[i]*ax[i]>0.999&&Math.abs(q.c[i]-ext)<size*1e-3+1e-3)out.add(f);return;}
    if(s.normal){const ax=Array.isArray(s.normal)?s.normal:AX[s.normal],l=Math.hypot(...ax)||1;for(const[f,q]of ft)if(q.nmin>0.999&&(q.n[0]*ax[0]+q.n[1]*ax[1]+q.n[2]*ax[2])/l>0.999)out.add(f);return;}
    if(s.type&&F){const t=String(s.type).toUpperCase().replace('CYLINDER','CYLINDRE');F.forEach((q,i)=>{if(q&&q.type===t)out.add(i);});}};
  walk(spec);return out;
}
function selector(inp,M){
  return spec=>{const ids=faceIds(inp,spec),rg=region(spec&&spec.region),fac=[],seen=new Uint8Array(M.X.length/3),nodes=[];for(let i=0;i<M.bf.length;i++)if(ids.has(M.ff[i])){if(rg){const e=Math.floor(M.bf[i]/6),q=HEX_FACES[M.bf[i]%6].map(a=>M.E[8*e+a]),X=M.X,c=[0,1,2].map(k=>(X[3*q[0]+k]+X[3*q[1]+k]+X[3*q[2]+k]+X[3*q[3]+k])/4),hf=Math.hypot(X[3*q[1]]-X[3*q[0]],X[3*q[1]+1]-X[3*q[0]+1],X[3*q[1]+2]-X[3*q[0]+2]);if(!rg.test(c[0],c[1],c[2],hf))continue;}fac.push(M.bf[i]);const e=Math.floor(M.bf[i]/6);for(const a of HEX_FACES[M.bf[i]%6]){const n=M.E[8*e+a];if(!seen[n]){seen[n]=1;nodes.push(n);}}}return{nodes:Int32Array.from(nodes),facets:Int32Array.from(fac),faces:[...ids]};};
}
function extrudedS0(S,sh,opt,h0,N,res){
  const ft=faceTable(S),S0=sh.S0,{T,V,N:TN,nt,TT}=S,isS=new Set();for(let t=0;t<nt;t++)if(S0[t]||sh.S1[t])isS.add(S.fid[t]);
  let ax=null;for(const[f,q]of ft){if(isS.has(f)||q.nmin<0.9999)continue;let ok=true;for(let t=0;t<nt&&ok;t++)if(S0[t]&&S.Ar[t]>0&&Math.abs(TN[3*t]*q.n[0]+TN[3*t+1]*q.n[1]+TN[3*t+2]*q.n[2])>2e-3)ok=false;if(ok){ax=q.n;break;}}
  if(!ax)return null;const pa=i=>V[3*i]*ax[0]+V[3*i+1]*ax[1]+V[3*i+2]*ax[2];let amin=Infinity,amax=-Infinity;for(let t=0;t<nt;t++)if(S0[t])for(let k=0;k<3;k++){const v=pa(T[3*t+k]);amin=Math.min(amin,v);amax=Math.max(amax,v);}
  const L=amax-amin,tl=Math.max(1e-6*S.diag,1e-5*L),adj=new Map(),link=(a,b)=>{(adj.get(a)||adj.set(a,[]).get(a)).push(b);};
  for(let t=0;t<nt;t++){if(!S0[t])continue;for(let k=0;k<3;k++){const u=TT[3*t+k];if(u>=0&&S0[u])continue;const a=T[3*t+k],b=T[3*t+(k+1)%3],ea=pa(a),eb=pa(b);if(Math.abs(ea-amin)<tl&&Math.abs(eb-amin)<tl){link(a,b);link(b,a);continue;}if(Math.abs(ea-amax)<tl&&Math.abs(eb-amax)<tl)continue;const dx=V[3*b]-V[3*a],dy=V[3*b+1]-V[3*a+1],dz=V[3*b+2]-V[3*a+2];if(Math.abs(dx*ax[0]+dy*ax[1]+dz*ax[2])<0.99999*Math.hypot(dx,dy,dz))return null;}}
  if(!adj.size)return null;const P=i=>[V[3*i],V[3*i+1],V[3*i+2]],turn=(u,v,w)=>{const e1=[V[3*v]-V[3*u],V[3*v+1]-V[3*u+1],V[3*v+2]-V[3*u+2]],e2=[V[3*w]-V[3*v],V[3*w+1]-V[3*v+1],V[3*w+2]-V[3*v+2]];return Math.acos(Math.max(-1,Math.min(1,(e1[0]*e2[0]+e1[1]*e2[1]+e1[2]*e2[2])/(Math.hypot(...e1)*Math.hypot(...e2)||1))));};
  const fixed=new Set();for(const[v,l]of adj)if(l.length!==2||turn(l[0],v,l[1])>(opt.corner||35)*Math.PI/180)fixed.add(v);
  const used=new Set(),chains=[],ekey=(a,b)=>a<b?a+','+b:b+','+a;for(const st of[...fixed,...adj.keys()]){for(const nb of adj.get(st)){if(used.has(ekey(st,nb)))continue;const ch=[st];let pv=st,cu=nb;used.add(ekey(st,nb));while(true){ch.push(cu);if(fixed.has(cu)||cu===st)break;const nx=adj.get(cu).find(w=>w!==pv&&!used.has(ekey(cu,w)));if(nx===undefined)break;used.add(ekey(cu,nx));pv=cu;cu=nx;}chains.push(ch);}if(fixed.size)continue;if(chains.length)fixed.add(chains[0][0]);}
  const hp0=opt.size||h0,hmin=opt.minSize||hp0/40,g=opt.grade||0.3,X=[],ids=new Map(),pid=(key,p)=>{let i=ids.get(key);if(i===undefined){i=X.length/3;ids.set(key,i);pushAll(X,p);}return i;},segs=[];let mprof=0,hs=[];
  for(const ch of chains){const n=ch.length,sL=[0];for(let i=1;i<n;i++){const a=ch[i-1],b=ch[i];sL.push(sL[i-1]+Math.hypot(V[3*b]-V[3*a],V[3*b+1]-V[3*a+1],V[3*b+2]-V[3*a+2]));}const tot=sL[n-1];if(!(tot>0))continue;
    const h=sL.map((_,i)=>{if(i===0||i===n-1){const cl=ch[0]===ch[n-1]&&n>2;if(!cl)return hp0;}const u=ch[i===0?n-2:i-1],w=ch[i===n-1?1:i+1],th=turn(u,ch[i],w),ds=(Math.hypot(...P(ch[i]).map((c,k)=>c-P(u)[k]))+Math.hypot(...P(w).map((c,k)=>c-P(ch[i])[k])))/2;return th>1e-4?Math.max(hmin,Math.min(hp0,ds/th*Math.PI/2/(opt.bend||6))):hp0;});
    for(let i=1;i<n;i++)h[i]=Math.min(h[i],h[i-1]+g*(sL[i]-sL[i-1]));for(let i=n-2;i>=0;i--)h[i]=Math.min(h[i],h[i+1]+g*(sL[i+1]-sL[i]));
    const I=[0];for(let i=1;i<n;i++)I.push(I[i-1]+(sL[i]-sL[i-1])*(1/h[i-1]+1/h[i])/2);const m=Math.max(1,Math.round(I[n-1]));mprof+=m;const pts=[];let j=0;
    for(let q=0;q<=m;q++){const target=I[n-1]*q/m;while(j<n-2&&I[j+1]<target)j++;const w=(target-I[j])/((I[j+1]-I[j])||1),a=ch[j],b=ch[j+1],p=[0,1,2].map(k=>V[3*a+k]+w*(V[3*b+k]-V[3*a+k]));pts.push(q===0?['v'+ch[0],P(ch[0])]:q===m?['v'+ch[n-1],P(ch[n-1])]:['c'+chains.indexOf(ch)+'_'+q,p]);}
    for(let q=0;q<m;q++){hs.push(Math.hypot(...pts[q+1][1].map((c,k)=>c-pts[q][1][k])));segs.push([pts[q],pts[q+1]]);}}
  if(!segs.length)return null;hs.sort((a,b)=>a-b);const hmed=hs[Math.floor(hs.length/2)],ha=opt.size||Math.min(10*hmed,Math.max(hmed,L*mprof*N/Math.max(res,1))),na=Math.max(1,Math.ceil(L/ha)),ring=[];
  const prof=new Map();for(const sg of segs)for(const[k,p]of sg)if(!prof.has(k))prof.set(k,p);const pk=[...prof.keys()],pix=new Map(pk.map((k,i)=>[k,i])),np=pk.length,XO=new Float64Array(3*np*(na+1));
  pk.forEach((k,i)=>{const p=prof.get(k),d=p[0]*ax[0]+p[1]*ax[1]+p[2]*ax[2]-amin;for(let j=0;j<=na;j++){const s=j/na*L-d;for(let c=0;c<3;c++)XO[3*(j*np+i)+c]=p[c]+s*ax[c];}});
  const Q=[],o=new Float64Array(6);for(const[a,b]of segs){const ia=pix.get(a[0]),ib=pix.get(b[0]),mx=(a[1][0]+b[1][0])/2+ax[0]*L/(2*na),my=(a[1][1]+b[1][1])/2+ax[1]*L/(2*na),mz=(a[1][2]+b[1][2])/2+ax[2]*L/(2*na),t=closest(S,mx,my,mz,S0,o),e=[b[1][0]-a[1][0],b[1][1]-a[1][1],b[1][2]-a[1][2]],cr=[e[1]*ax[2]-e[2]*ax[1],e[2]*ax[0]-e[0]*ax[2],e[0]*ax[1]-e[1]*ax[0]],fl=t>=0&&cr[0]*TN[3*t]+cr[1]*TN[3*t+1]+cr[2]*TN[3*t+2]<0;
    for(let j=0;j<na;j++){const q=[j*np+ia,j*np+ib,(j+1)*np+ib,(j+1)*np+ia];pushAll(Q,(fl?q.reverse():q));}}
  return{X:XO,Q:Int32Array.from(Q),axis:ax,L,na,np,hmed,ha,chains:chains.length};
}
function estCount(S,sel,hf,K=20000){const ts=[],cum=[];let A=0;for(let t=0;t<S.nt;t++)if(sel[t]){A+=S.Ar[t];ts.push(t);cum.push(A);}if(!A)return 0;let s=0,q=12345;const rnd=()=>(q=(q*1103515245+12345)&0x7fffffff)/0x7fffffff;for(let k=0;k<K;k++){const r=rnd()*A;let lo=0,hi=cum.length-1;while(lo<hi){const m=(lo+hi)>>1;cum[m]<r?lo=m+1:hi=m;}const t=ts[lo],a=3*S.T[3*t],b=3*S.T[3*t+1],c=3*S.T[3*t+2];let u=rnd(),v=rnd();if(u+v>1){u=1-u;v=1-v;}const h=hf(S.V[a]+u*(S.V[b]-S.V[a])+v*(S.V[c]-S.V[a]),S.V[a+1]+u*(S.V[b+1]-S.V[a+1])+v*(S.V[c+1]-S.V[a+1]),S.V[a+2]+u*(S.V[b+2]-S.V[a+2])+v*(S.V[c+2]-S.V[a+2]));s+=1/(h*h);}return A*s/K;}
function sweepMesh(inp,sh,opt){
  const S=surfOf(inp),t=sh.t,A=sh.a0,V=inp.volume||A*t,res=opt.res||30000,hv=Math.cbrt(V/res),thick=t>=2*hv&&!opt.layers;
  const N=Math.max(opt.minLayers||2,opt.layers||(opt.size?Math.round(t/opt.size):thick?Math.round(t/hv):2)),h0=opt.size||(thick?hv:Math.sqrt(A*N/res));
  const sz=patchSizes(S,sh.S0,t,h0,opt),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let q=0;q<S.nt;q++)if(sh.S0[q])for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],S.C[3*q+k]-h0);hi[k]=Math.max(hi[k],S.C[3*q+k]+h0);}
  let hf=sizeField(lo,hi,h0,opt.grade||0.3,sz.smp);const est=estCount(S,sh.S0,hf)*N,cap=opt.maxEls||1.5*res,hard=opt.hardMax||Math.max(4*res,200000);let sc=1,warn=null;if(est>cap&&!opt.size){sc=Math.sqrt(est/cap);let sm=sz.smp.map(([x,y,z,h,f])=>[x,y,z,Math.min(h*sc,Math.max(h,f))]);hf=sizeField(lo,hi,h0*sc,opt.grade||0.3,sm);const e2=estCount(S,sh.S0,hf)*N;if(e2>hard){const s2=Math.sqrt(e2/hard);sm=sm.map(([x,y,z,h])=>[x,y,z,h*s2]);hf=sizeField(lo,hi,h0*sc*s2,opt.grade||0.3,sm);warn='curved regions are coarser than 30 degrees per element to stay within the element budget; raise the mesh resolution';}}
  const t0=Date.now(),EX=opt.extruded===false?null:extrudedS0(S,sh,opt,h0,N,res),R=EX?null:remesh(S,sh.S0,hf,opt),tR=Date.now()-t0,Qm=EX?{X:EX.X,Q:EX.Q,nq:EX.Q.length/4,ntr:0,qmin:null}:quadify(R,opt),XQ=Qm.X,Q=Qm.Q,nq=Q.length/4,nn=XQ.length/3;
  const NN=new Float64Array(3*nn);for(let q=0;q<nq;q++){const a=3*Q[4*q],b=3*Q[4*q+1],c=3*Q[4*q+2],d=3*Q[4*q+3],ux=XQ[c]-XQ[a],uy=XQ[c+1]-XQ[a+1],uz=XQ[c+2]-XQ[a+2],wx=XQ[d]-XQ[b],wy=XQ[d+1]-XQ[b+1],wz=XQ[d+2]-XQ[b+2],nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx;for(const p of[a,b,c,d]){NN[p]+=nx;NN[p+1]+=ny;NN[p+2]+=nz;}}
  const X=new Float64Array(3*nn*(N+1)),tk=new Float64Array(nn),o=new Float64Array(6),isS1=sh.S1,isS0=sh.S0,VN0=new Float64Array(3*S.nv);let miss=0;
  for(let t=0;t<S.nt;t++){if(!sh.S0[t])continue;for(let k=0;k<3;k++){const a=3*S.T[3*t+k],b=3*S.T[3*t+(k+1)%3],c=3*S.T[3*t+(k+2)%3],ux=S.V[b]-S.V[a],uy=S.V[b+1]-S.V[a+1],uz=S.V[b+2]-S.V[a+2],wx=S.V[c]-S.V[a],wy=S.V[c+1]-S.V[a+1],wz=S.V[c+2]-S.V[a+2],an=Math.acos(Math.max(-1,Math.min(1,(ux*wx+uy*wy+uz*wz)/(Math.hypot(ux,uy,uz)*Math.hypot(wx,wy,wz)||1))));for(let j=0;j<3;j++)VN0[a+j]+=an*S.N[3*t+j];}}
  for(let i=0;i<nn;i++){const px=XQ[3*i],py=XQ[3*i+1],pz=XQ[3*i+2],ct=closest(S,px,py,pz,isS0,o);let nx=NN[3*i],ny=NN[3*i+1],nz=NN[3*i+2];if(ct>=0){const a=3*S.T[3*ct],b=3*S.T[3*ct+1],c=3*S.T[3*ct+2],u=o[4],v=o[5],w=1-u-v;nx=w*VN0[a]+u*VN0[b]+v*VN0[c];ny=w*VN0[a+1]+u*VN0[b+1]+v*VN0[c+1];nz=w*VN0[a+2]+u*VN0[b+2]+v*VN0[c+2];}const l=Math.hypot(nx,ny,nz)||1,dx=-nx/l,dy=-ny/l,dz=-nz/l;let qx,qy,qz;const j=raycast(S,px,py,pz,dx,dy,dz,3*sh.tmax,isS1,1e-6);
    if(j>=0){qx=px+BD*dx;qy=py+BD*dy;qz=pz+BD*dz;}else{miss++;closest(S,px+dx*t,py+dy*t,pz+dz*t,isS1,o);qx=o[0];qy=o[1];qz=o[2];}
    tk[i]=Math.hypot(qx-px,qy-py,qz-pz);for(let k=0;k<=N;k++){const s=k/N,p=3*(i*(N+1)+k);X[p]=px+s*(qx-px);X[p+1]=py+s*(qy-py);X[p+2]=pz+s*(qz-pz);}}
  const E=new Int32Array(8*nq*N),C=N+1;for(let k=0;k<N;k++)for(let q=0;q<nq;q++){const[a,b,c,d]=[C*Q[4*q]+k,C*Q[4*q+1]+k,C*Q[4*q+2]+k,C*Q[4*q+3]+k];E.set([a,d,c,b,a+1,d+1,c+1,b+1],8*(k*nq+q));}
  const EM=new Map();for(let q=0;q<nq;q++)for(let j=0;j<4;j++){const key=ek(Q[4*q+j],Q[4*q+(j+1)%4]),e=EM.get(key);e===undefined?EM.set(key,[q,j]):EM.set(key,null);}
  const bf=[],kind=[],SF=[5,4,3,2];for(let q=0;q<nq;q++){bf.push(6*q);kind.push(0);bf.push(6*((N-1)*nq+q)+1);kind.push(1);}for(const v of EM.values())if(v)for(let k=0;k<N;k++){bf.push(6*(k*nq+v[0])+SF[v[1]]);kind.push(2);}
  const M={X,E,bf:Int32Array.from(bf)},sideF=Uint8Array.from(sh.S0,(v,u)=>!v&&!sh.S1[u]?1:0);M.ff=tagFacets(S,X,E,M.bf,i=>kind[i]===0?isS0:kind[i]===1?isS1:sideF);
  let tmn=Infinity,tmx=0,tsum=0;for(let i=0;i<nn;i++){tmn=Math.min(tmn,tk[i]);tmx=Math.max(tmx,tk[i]);tsum+=tk[i];}
  return{...M,kind:'hex8',type:'sweep',layers:N,sweep:{nl:nn,N},thickness:{min:tmn,max:tmx,mean:tsum/nn,nominal:t},size:{h0:h0*sc,hmin:sz.hmin*sc,coarsened:sc,estimate:Math.round(est)},warn,info:{quads:nq,extruded:EX?{axis:EX.axis,steps:EX.na,profile:EX.np,hProfile:EX.hmed,hAxis:EX.ha}:null,triMinAngle:R?R.amin:null,quadMinSin:Qm.qmin,fromQuads:Qm.nq,fromTris:Qm.ntr,surfTris:R?R.T.length/3:0,rayMiss:miss,remeshMs:tR}};
}
export function meshSolid(inp,opts={}){
  const t0=Date.now(),type=opts.type||opts.mesh||'auto';let M=null,why='';
  if(type==='sweep'||type==='auto'){const sh=detectSheet(inp,opts);if(sh.ok){M=sweepMesh(inp,sh,opts);M.sheet={t:sh.t,thin:sh.thin};}else why=sh.reason;if(!M&&type==='sweep')throw new Error('Sweep mesh not possible: '+why);}
  if(!M&&(type==='adaptive'||type==='auto'))M=octreeMesh(inp,opts);
  if(!M)throw new Error('unknown mesh type '+type);
  M.quality=meshQuality(M.X,M.E);const V=inp.volume||0;M.quality.volErr=V?(M.rho?M.quality.volRho:M.quality.volume)/V-1:null;
  if(M.type==='sweep'&&(M.quality.neg>0||Math.abs(M.quality.volErr)>0.02)&&type==='auto'){M=octreeMesh(inp,opts);M.quality=meshQuality(M.X,M.E);M.fallback='sweep rejected';}
  M.select=selector(inp,M);M.ms=Date.now()-t0;M.why=why;return M;
}
const FC=new WeakMap();
function features(S,crease=30){
  const k0=S.T,cr=Math.cos(crease*Math.PI/180);let F=FC.get(S);if(F&&F.crease===crease)return F;const sg=[],patch=new Int32Array(S.nt).fill(-1),deg=new Map(),dn=(t,u)=>S.N[3*t]*S.N[3*u]+S.N[3*t+1]*S.N[3*u+1]+S.N[3*t+2]*S.N[3*u+2];
  for(let t=0;t<S.nt;t++)for(let k=0;k<3;k++){const u=S.TT[3*t+k];if((u<0||u>t)&&(u<0||dn(t,u)<cr)){const a=k0[3*t+k],b=k0[3*t+(k+1)%3];sg.push(a,b);deg.set(a,(deg.get(a)||0)+1);deg.set(b,(deg.get(b)||0)+1);}}
  let np=0;for(let t=0;t<S.nt;t++){if(patch[t]>=0)continue;const st=[t];patch[t]=np;while(st.length){const q=st.pop();for(let k=0;k<3;k++){const u=S.TT[3*q+k];if(u>=0&&patch[u]<0&&dn(q,u)>=cr){patch[u]=np;st.push(u);}}}np++;}
  const ns=sg.length/2,GA=new Float64Array(6*ns),V=S.V;for(let i=0;i<ns;i++)for(let c=0;c<3;c++){GA[6*i+c]=V[3*sg[2*i]+c];GA[6*i+3+c]=V[3*sg[2*i+1]+c];}
  const corner=[];for(const[v,d]of deg)if(d!==2)corner.push(v);
  F={crease,seg:Int32Array.from(sg),G:gmk(GA,null),patch,np,corner};FC.set(S,F);return F;
}
function nearFeat(F,px,py,pz,o){gset(F.G);const i=MX.ms_gn(px,py,pz,0,0),R=rv();BD=R[6];if(i>=0){o[0]=R[0];o[1]=R[1];o[2]=R[2];o[4]=R[4];}return i<0?Infinity:Math.sqrt(BD);}
function octreeMesh(inp,opt={}){
  const S=thickOf(surfOf(inp)),res=opt.res||30000,V=inp.volume||S.volume||1,Nt=Math.max(1,opt.layers||2),hv=Math.cbrt(V/res);let sc=opt.size?opt.size/hv:1.2,st=1,sp=1,M=null;
  for(let pass=0;pass<6;pass++){const M1=octBuild(S,opt,hv*sc,Nt,st);if(M&&!M1.E.length){st=(st+sp)/2;continue;}M=M1;sp=st;M.info.passes=pass+1;const ne=M.E.length/8,r=ne/res;const hard=opt.hardMax||4*res;if(opt.size||(r<=1.6&&r>=0.5)||pass===5||(r>1.6&&ne<=hard&&sc>8))break;r>1?(ne>hard&&M.info.boundary>0.5*M.info.leaves?st*=Math.pow(ne/hard,0.5):sc*=Math.pow(r,0.4)):(st>1?st=Math.max(1,st*Math.pow(r,0.5)):sc*=Math.pow(r,0.4));}
  const bad=m=>NBD.get(m);let nb=bad(M),pc=M.info.passes;const cap=Math.max(opt.hardMax||4*res,1.6*M.E.length/8);for(const[a,b]of opt.size?[]:[[1,0.85],[0.9,1],[1.12,1],[1,0.72]]){if(!nb)break;const M2=octBuild(S,opt,hv*sc*a,Nt,st*b),b2=bad(M2);pc++;if(M2.E.length&&b2<nb&&M2.E.length/8<=cap){M=M2;nb=b2;}}M.info.passes=pc;M.info.inverted=nb;
  M.warn=M.through<Nt?'thinnest walls have '+M.through.toFixed(1)+' elements through the thickness (target '+Nt+'); raise the mesh resolution':null;msNew();return M;
}
function octBuild(S,opt,hc,Nt,stc){
  const FT=features(S,opt.crease||30),fe=opt.features!==false&&FT.seg.length?1:0;tset(S);mv(25).set(S.th);MX.ms_ofeat(S.nt,FT.corner.length);mv(30).set(FT.patch);mv(31).set(FT.corner);gset(FT.G);
  const ne=MX.ms_oct(S.lo[0],S.lo[1],S.lo[2],S.hi[0],S.hi[1],S.hi[2],hc,Nt,stc,opt.minSize||hc/64,opt.core??0.25,opt.refine??4,opt.nsmooth??6,fe),O=mv(42).slice(),t0n=O[0],nc=O[1],E=mv(32).slice(),cube=mv(34).slice(),bf=mv(35).slice(),TX0=mv(37).slice(),TX=()=>mv(36),mk=()=>mv(38),fo=new Float64Array(6),HK=8;
  const HX=MHM(MHE);HX.ex.mh_load(mv(33).length/3,ne);HX.v(2).set(E);let XF=HX.v(1),nbad=0,nrv=0;XF.set(mv(33));for(let p=0;p<(opt.revert??5);p++){nbad=0;let rv=0;const nbq=HX.ex.mh_nbad(nc,1,1),BL=HX.v(4),K=mk(),X=TX();for(let bq=0;bq<nbq;bq++){const e=BL[bq];nbad++;for(let a=4;a<8;a++){const i=E[8*e+a]-t0n;if(K[i]){K[i]=0;rv++;for(let c=0;c<3;c++)X[3*i+c]=TX0[3*i+c];}}}if(!rv)break;nrv+=rv;MX.ms_tint();XF.set(TX(),3*t0n);}
  let nun=0;for(let p=0;p<(opt.untangle??4);p++){const nlo=HX.ex.mh_low(nc,0.05),bad=Array.from(HX.v(4).subarray(0,nlo));if(!bad.length)break;const inc=new Map();for(const e of bad)for(let a=4;a<8;a++)inc.set(E[8*e+a],[]);for(let e=0;e<ne;e++)for(let a=0;a<8;a++){const l=inc.get(E[8*e+a]);if(l)l.push(e);}const q=n=>{let m=Infinity;for(const e of inc.get(n))m=Math.min(m,HX.ex.mh_sj(e));return m;};let nmv=0;
    for(const e of bad)for(let a=4;a<8;a++){const n=E[8*e+a],i=n-t0n;if(i<0||i>=O[2])continue;let cx=0,cy=0,cz=0;for(let b=4;b<8;b++){cx+=XF[3*E[8*e+b]]/4;cy+=XF[3*E[8*e+b]+1]/4;cz+=XF[3*E[8*e+b]+2]/4;}const p0=[XF[3*n],XF[3*n+1],XF[3*n+2]],q0=q(n);for(const w of[0.5,0.25]){closest(S,(1-w)*p0[0]+w*cx,(1-w)*p0[1]+w*cy,(1-w)*p0[2]+w*cz,null,fo);XF[3*n]=fo[0];XF[3*n+1]=fo[1];XF[3*n+2]=fo[2];if(q(n)>q0+1e-6){const X=TX();X[3*i]=fo[0];X[3*i+1]=fo[1];X[3*i+2]=fo[2];nmv++;break;}XF[3*n]=p0[0];XF[3*n+1]=p0[1];XF[3*n+2]=p0[2];}}
    if(!nmv)break;nun+=nmv;MX.ms_tint();XF.set(TX(),3*t0n);}
  const hn=mv(39).slice(),hm=mv(40).slice(),hw=mv(41).slice();HX.ex.mh_hin(hn.length,HK);HX.v(5).set(hn);HX.v(6).set(hm);HX.v(7).set(hw);HX.v(8).set(cube);const nsm=HX.ex.mh_smooth(nc,t0n,hn.length,HK,opt.vsmooth??4);XF=HX.v(1).slice();const CB=HX.v(8).slice(0,cube.length);
  const M={X:XF,E,bf};const nb0=HX.ex.mh_nbad(nc,0,0);M.ff=tagFacets(S,XF,E,M.bf);
  const OM={...M,kind:'hex8',type:'adaptive',hang:hn.length?{node:hn,m:hm,w:hw,k:HK}:null,cube:CB,through:Number.isNaN(O[11])?null:O[11],tMin:O[12],size:{h0:hc,hmin:O[13]},levels:[O[14],O[15]],info:{leaves:O[3],boundary:O[4],coreRefined:O[5],core:nc,pillow:ne-nc,rayMiss:O[6],smoothed:nsm,featNodes:O[7],cornerNodes:O[8],featReverted:nrv,untangled:nun,badPillow:nbad,hanging:hn.length,hangDropped:O[10]}};NBD.set(OM,nb0);return OM;
}
