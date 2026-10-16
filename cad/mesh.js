export const HEX_FACES=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
export const HEX_NODES=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const AX={X:[1,0,0],Y:[0,1,0],Z:[0,0,1],'+X':[1,0,0],'+Y':[0,1,0],'+Z':[0,0,1],'-X':[-1,0,0],'-Y':[0,-1,0],'-Z':[0,0,-1]},K26=67108864,ek=(a,b)=>a<b?a*K26+b:b*K26+a,ka=k=>Math.floor(k/K26),kb=k=>k%K26;
function bvh(n,lo,hi){
  const ord=new Int32Array(n),cap=Math.max(2,2*n),NL=new Float64Array(3*cap),NH=new Float64Array(3*cap),S=new Int32Array(cap),C=new Int32Array(cap),ce=new Float64Array(3*n),st=[];let nn=0;
  for(let i=0;i<n;i++){ord[i]=i;for(let k=0;k<3;k++)ce[3*i+k]=lo[3*i+k]+hi[3*i+k];}
  const node=(s,c)=>{const q=nn++;S[q]=s;C[q]=Math.max(c,1);for(let k=0;k<3;k++){let a=Infinity,b=-Infinity;for(let i=s;i<s+c;i++){const p=3*ord[i]+k;a=Math.min(a,lo[p]);b=Math.max(b,hi[p]);}NL[3*q+k]=a;NH[3*q+k]=b;}return q;};
  node(0,n);if(n)st.push(0);else C[0]=0;
  while(st.length){const q=st.pop(),s=S[q],c=C[q];if(c<=4)continue;let ax=0,best=-1;for(let k=0;k<3;k++){let a=Infinity,b=-Infinity;for(let i=s;i<s+c;i++){const v=ce[3*ord[i]+k];if(v<a)a=v;if(v>b)b=v;}if(b-a>best){best=b-a;ax=k;}}if(!(best>0))continue;
    const sub=Array.from(ord.subarray(s,s+c)).sort((x,y)=>ce[3*x+ax]-ce[3*y+ax]);ord.set(sub,s);const h=c>>1,l=node(s,h);node(s+h,c-h);S[q]=l;C[q]=0;st.push(l,l+1);}
  return{ord,NL,NH,S,C,n};
}
let BD=Infinity;
function bnear(B,px,py,pz,f,lim=Infinity){
  let best=lim,bi=-1;if(!B.n){BD=best;return-1;}const{NL,NH,S,C,ord}=B,st=[0],bd=q=>{const a=Math.max(NL[3*q]-px,0,px-NH[3*q]),b=Math.max(NL[3*q+1]-py,0,py-NH[3*q+1]),c=Math.max(NL[3*q+2]-pz,0,pz-NH[3*q+2]);return a*a+b*b+c*c;};
  while(st.length){const q=st.pop();if(bd(q)>=best)continue;const c=C[q];if(c){for(let i=S[q];i<S[q]+c;i++){const t=ord[i],d=f(t,best);if(d<best){best=d;bi=t;}}}else{const l=S[q],dl=bd(l),dr=bd(l+1);dl<dr?st.push(l+1,l):st.push(l,l+1);}}
  BD=best;return bi;
}
function bray(B,ox,oy,oz,dx,dy,dz,tmax,f){
  let best=tmax,bi=-1;if(!B.n){BD=best;return-1;}const{NL,NH,S,C,ord}=B,ix=1/(Math.abs(dx)>1e-15?dx:1e-15),iy=1/(Math.abs(dy)>1e-15?dy:1e-15),iz=1/(Math.abs(dz)>1e-15?dz:1e-15),st=[0];
  const slab=q=>{let a=(NL[3*q]-ox)*ix,b=(NH[3*q]-ox)*ix,t0=Math.min(a,b),t1=Math.max(a,b);a=(NL[3*q+1]-oy)*iy;b=(NH[3*q+1]-oy)*iy;t0=Math.max(t0,Math.min(a,b));t1=Math.min(t1,Math.max(a,b));a=(NL[3*q+2]-oz)*iz;b=(NH[3*q+2]-oz)*iz;t0=Math.max(t0,Math.min(a,b),0);t1=Math.min(t1,Math.max(a,b),best);return t0<=t1*(1+1e-12)+1e-12?t0:Infinity;};
  while(st.length){const q=st.pop();if(slab(q)===Infinity)continue;const c=C[q];if(c){for(let i=S[q];i<S[q]+c;i++){const t=ord[i],d=f(t,best);if(d<best){best=d;bi=t;}}}else st.push(S[q],S[q]+1);}
  BD=best;return bi;
}
function bover(B,lo,hi,cb){if(!B.n)return;const{NL,NH,S,C,ord}=B,st=[0];while(st.length){const q=st.pop();if(NL[3*q]>hi[0]||NH[3*q]<lo[0]||NL[3*q+1]>hi[1]||NH[3*q+1]<lo[1]||NL[3*q+2]>hi[2]||NH[3*q+2]<lo[2])continue;const c=C[q];if(c){for(let i=S[q];i<S[q]+c;i++)cb(ord[i]);}else st.push(S[q],S[q]+1);}}
const CQ=new Float64Array(6);
function cpt(V,ia,ib,ic,px,py,pz,o){
  const ax=V[ia],ay=V[ia+1],az=V[ia+2],abx=V[ib]-ax,aby=V[ib+1]-ay,abz=V[ib+2]-az,acx=V[ic]-ax,acy=V[ic+1]-ay,acz=V[ic+2]-az,apx=px-ax,apy=py-ay,apz=pz-az,d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;let u=0,v=0,r=0;
  if(d1<=0&&d2<=0)r=4;
  else{const bpx=apx-abx,bpy=apy-aby,bpz=apz-abz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz,vc=d1*d4-d3*d2;
    if(d3>=0&&d4<=d3){u=1;r=5;}else if(vc<=0&&d1>=0&&d3<=0){u=d1/(d1-d3);r=1;}
    else{const cpx=apx-acx,cpy=apy-acy,cpz=apz-acz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz,vb=d5*d2-d1*d6,va=d3*d6-d5*d4;
      if(d6>=0&&d5<=d6){v=1;r=6;}else if(vb<=0&&d2>=0&&d6<=0){v=d2/(d2-d6);r=2;}else if(va<=0&&d4-d3>=0&&d5-d6>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));u=1-w;v=w;r=3;}else{const dn=1/(va+vb+vc);u=vb*dn;v=vc*dn;}}}
  const qx=ax+u*abx+v*acx,qy=ay+u*aby+v*acy,qz=az+u*abz+v*acz;o[0]=qx;o[1]=qy;o[2]=qz;o[3]=r;o[4]=u;o[5]=v;return(px-qx)**2+(py-qy)**2+(pz-qz)**2;
}
function cseg(ax,ay,az,bx,by,bz,px,py,pz,o){const ex=bx-ax,ey=by-ay,ez=bz-az,l2=ex*ex+ey*ey+ez*ez,t=l2>0?Math.min(1,Math.max(0,((px-ax)*ex+(py-ay)*ey+(pz-az)*ez)/l2)):0,qx=ax+t*ex,qy=ay+t*ey,qz=az+t*ez;o[0]=qx;o[1]=qy;o[2]=qz;o[4]=t;return(px-qx)**2+(py-qy)**2+(pz-qz)**2;}
function rtri(V,ia,ib,ic,ox,oy,oz,dx,dy,dz,eps){
  const e1x=V[ib]-V[ia],e1y=V[ib+1]-V[ia+1],e1z=V[ib+2]-V[ia+2],e2x=V[ic]-V[ia],e2y=V[ic+1]-V[ia+1],e2z=V[ic+2]-V[ia+2],px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-300)return Infinity;
  const iv=1/det,tx=ox-V[ia],ty=oy-V[ia+1],tz=oz-V[ia+2],u=(tx*px+ty*py+tz*pz)*iv;if(u<-eps||u>1+eps)return Infinity;const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(dx*qx+dy*qy+dz*qz)*iv;if(v<-eps||u+v>1+eps)return Infinity;const t=(e2x*qx+e2y*qy+e2z*qz)*iv;return t>0?t:Infinity;
}
const SC=new WeakMap();
export function surfOf(inp){
  let S=SC.get(inp);if(S)return S;
  const P=inp.pos,I=inp.idx,nt=I.length/3,np=P.length/3,lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<np;i++)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],P[3*i+k]);hi[k]=Math.max(hi[k],P[3*i+k]);}
  const diag=Math.hypot(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])||1,q=diag*1e-7,M=new Map(),vm=new Int32Array(np),VV=[];
  for(let i=0;i<np;i++){const key=Math.round(P[3*i]/q)+','+Math.round(P[3*i+1]/q)+','+Math.round(P[3*i+2]/q);let j=M.get(key);if(j===undefined){j=VV.length/3;M.set(key,j);VV.push(P[3*i],P[3*i+1],P[3*i+2]);}vm[i]=j;}
  const V=Float64Array.from(VV),nv=V.length/3,T=new Int32Array(3*nt),fid=new Int32Array(nt).fill(-1),N=new Float64Array(3*nt),Ar=new Float64Array(nt),C=new Float64Array(3*nt),TL=new Float64Array(3*nt),TH=new Float64Array(3*nt);
  for(let i=0;i<3*nt;i++)T[i]=vm[I[i]];
  for(const g of inp.groups||[])for(let t=g[0]/3;t<(g[0]+g[1])/3;t++)fid[t]=g[2];
  for(let t=0;t<nt;t++){const a=3*T[3*t],b=3*T[3*t+1],c=3*T[3*t+2],ux=V[b]-V[a],uy=V[b+1]-V[a+1],uz=V[b+2]-V[a+2],wx=V[c]-V[a],wy=V[c+1]-V[a+1],wz=V[c+2]-V[a+2],nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx,l=Math.hypot(nx,ny,nz);Ar[t]=l/2;N[3*t]=l?nx/l:0;N[3*t+1]=l?ny/l:0;N[3*t+2]=l?nz/l:0;for(let k=0;k<3;k++){C[3*t+k]=(V[a+k]+V[b+k]+V[c+k])/3;TL[3*t+k]=Math.min(V[a+k],V[b+k],V[c+k]);TH[3*t+k]=Math.max(V[a+k],V[b+k],V[c+k]);}}
  const TT=new Int32Array(3*nt).fill(-1),EM=new Map();
  for(let t=0;t<nt;t++)for(let k=0;k<3;k++){const a=T[3*t+k],b=T[3*t+(k+1)%3];if(a===b)continue;const key=ek(a,b),o=EM.get(key);if(o===undefined)EM.set(key,3*t+k);else if(o>=0){TT[3*t+k]=Math.floor(o/3);TT[o]=t;EM.set(key,-1);}}
  const VN=new Float64Array(3*nv);for(let t=0;t<nt;t++)for(let k=0;k<3;k++){const a=3*T[3*t+k],b=3*T[3*t+(k+1)%3],c=3*T[3*t+(k+2)%3],ux=V[b]-V[a],uy=V[b+1]-V[a+1],uz=V[b+2]-V[a+2],wx=V[c]-V[a],wy=V[c+1]-V[a+1],wz=V[c+2]-V[a+2],an=Math.acos(Math.max(-1,Math.min(1,(ux*wx+uy*wy+uz*wz)/(Math.hypot(ux,uy,uz)*Math.hypot(wx,wy,wz)||1))));for(let j=0;j<3;j++)VN[a+j]+=an*N[3*t+j];}
  S={V,T,nv,nt,fid,N,Ar,C,TT,VN,B:bvh(nt,TL,TH),lo,hi,diag,inp};
  let area=0;for(let t=0;t<nt;t++)area+=Ar[t];S.area=area;S.volume=inp.volume||0;SC.set(inp,S);return S;
}
export function closest(S,px,py,pz,filt,o=CQ){const t=bnear(S.B,px,py,pz,(t,b)=>filt&&!filt(t)?Infinity:cpt(S.V,3*S.T[3*t],3*S.T[3*t+1],3*S.T[3*t+2],px,py,pz,CQ));if(t>=0)cpt(S.V,3*S.T[3*t],3*S.T[3*t+1],3*S.T[3*t+2],px,py,pz,o);return t;}
export function raycast(S,ox,oy,oz,dx,dy,dz,tmax,filt,eps=1e-9){return bray(S.B,ox,oy,oz,dx,dy,dz,tmax,t=>filt&&!filt(t)?Infinity:rtri(S.V,3*S.T[3*t],3*S.T[3*t+1],3*S.T[3*t+2],ox,oy,oz,dx,dy,dz,eps));}
export function sdf(S,px,py,pz,o=new Float64Array(6)){const t=closest(S,px,py,pz,null,o);if(t<0)return Infinity;const r=o[3],T=S.T,N=S.N,VN=S.VN;let nx=N[3*t],ny=N[3*t+1],nz=N[3*t+2];
  if(r>=4){const v=3*T[3*t+r-4];nx=VN[v];ny=VN[v+1];nz=VN[v+2];}else if(r>=1){const k=r===1?0:r===2?2:1,u=S.TT[3*t+k];if(u>=0){nx+=N[3*u];ny+=N[3*u+1];nz+=N[3*u+2];}}
  const d=Math.hypot(px-o[0],py-o[1],pz-o[2]);return(px-o[0])*nx+(py-o[1])*ny+(pz-o[2])*nz>0?d:-d;}
export function insideSign(S,px,py,pz){return sdf(S,px,py,pz)>0?1:-1;}
export function thickOf(S){
  if(S.th)return S;const{nt,C,N,diag}=S,th=new Float64Array(nt),tj=new Int32Array(nt),tc=new Float64Array(nt),eps=diag*1e-7;
  for(let t=0;t<nt;t++){const ox=C[3*t]-N[3*t]*eps,oy=C[3*t+1]-N[3*t+1]*eps,oz=C[3*t+2]-N[3*t+2]*eps,j=raycast(S,ox,oy,oz,-N[3*t],-N[3*t+1],-N[3*t+2],diag*2,u=>u!==t);th[t]=j>=0?BD+eps:Infinity;tj[t]=j;tc[t]=j>=0?N[3*t]*N[3*j]+N[3*t+1]*N[3*j+1]+N[3*t+2]*N[3*j+2]:0;}
  S.th=th;S.tj=tj;S.tc=tc;return S;
}
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
    const sF=t=>S0[t]||S1[t],o=new Float64Array(6);let sideBad=0,sideA=0,tmin=Infinity,tmax=0;
    for(let t=0;t<nt;t++){if(sF(t)){tmin=Math.min(tmin,th[t]);tmax=Math.max(tmax,th[t]);continue;}sideA+=Ar[t];const j=closest(S,S.C[3*t],S.C[3*t+1],S.C[3*t+2],sF,o);if(j>=0&&Math.abs(N[3*t]*N[3*j]+N[3*t+1]*N[3*j+1]+N[3*t+2]*N[3*j+2])>0.4)sideBad+=Ar[t];}
    if(sideBad>0.03*(a0+a1)){why='faces at '+tm.toFixed(3)+' mm are not of uniform thickness (other faces face the same way)';continue;}
    let vs=0;for(let t=0;t<nt;t++)if(sF(t))vs+=th[t]*Ar[t];const Vs=(a0+a1)/2*vs/(a0+a1),VV=inp.volume||S.volume;if(VV&&Math.abs(Vs/VV-1)>(opt.vtol||0.01)){why='the paired faces at '+tm.toFixed(3)+' mm hold only '+(100*Vs/VV).toFixed(1)+'% of the volume';continue;}
    return{ok:true,t:tm,tmin,tmax,S0,S1,a0,a1,sideA,vfrac:Vs/VV,thin:tm<0.25*Math.sqrt(a0)};
  }
  return{ok:false,reason:why||'no uniform-thickness pairing'};
}
function sizeField(lo,hi,h0,g,samples,maxCells=1500000){
  const ext=[0,1,2].map(k=>hi[k]-lo[k]+2*h0),hs=samples.map(q=>q[3]).sort((a,b)=>a-b);let s=Math.min(h0/2,hs.length?Math.max(hs[Math.floor(hs.length*0.05)],h0/40):h0);const nc=()=>ext.reduce((a,e)=>a*Math.max(2,Math.ceil(e/s)+1),1);while(nc()>maxCells)s*=1.25;
  const n=ext.map(e=>Math.max(2,Math.ceil(e/s)+1)),o=lo.map(v=>v-h0),H=new Float32Array(n[0]*n[1]*n[2]).fill(h0),id=(i,j,k)=>(k*n[1]+j)*n[0]+i;
  for(const[x,y,z,h]of samples){const i=Math.round((x-o[0])/s),j=Math.round((y-o[1])/s),k=Math.round((z-o[2])/s);if(i<0||j<0||k<0||i>=n[0]||j>=n[1]||k>=n[2])continue;const q=id(i,j,k);if(h<H[q])H[q]=h;}
  const D=[];for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)if(dk*9+dj*3+di<0)D.push([di,dj,dk,g*s*Math.hypot(di,dj,dk)]);
  for(let rep=0;rep<2;rep++)for(const sg of[1,-1]){const D2=D.map(([a,b,c,w])=>[a*sg,b*sg,c*sg,w]);for(let kk=0;kk<n[2];kk++){const k=sg>0?kk:n[2]-1-kk;for(let jj=0;jj<n[1];jj++){const j=sg>0?jj:n[1]-1-jj;for(let ii=0;ii<n[0];ii++){const i=sg>0?ii:n[0]-1-ii,q=id(i,j,k);let h=H[q];for(const[a,b,c,w]of D2){const x=i+a,y=j+b,z=k+c;if(x<0||y<0||z<0||x>=n[0]||y>=n[1]||z>=n[2])continue;const v=H[id(x,y,z)]+w;if(v<h)h=v;}H[q]=h;}}}}
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
  const segs=[...FE.keys()],ns=segs.length,SL=new Float64Array(3*ns),SH=new Float64Array(3*ns),SA=new Float64Array(6*ns),SID=new Int32Array(ns);
  segs.forEach((key,i)=>{const a=ka(key),b=kb(key);for(let k=0;k<3;k++){SA[6*i+k]=X[3*a+k];SA[6*i+3+k]=X[3*b+k];SL[3*i+k]=Math.min(X[3*a+k],X[3*b+k]);SH[3*i+k]=Math.max(X[3*a+k],X[3*b+k]);}SID[i]=FE.get(key);});
  const BS=bvh(ns,SL,SH),PL=new Float64Array(3*ot.length),PH=new Float64Array(3*ot.length);ot.forEach((t,i)=>{for(let k=0;k<3;k++){PL[3*i+k]=Math.min(S.V[3*S.T[3*t]+k],S.V[3*S.T[3*t+1]+k],S.V[3*S.T[3*t+2]+k]);PH[3*i+k]=Math.max(S.V[3*S.T[3*t]+k],S.V[3*S.T[3*t+1]+k],S.V[3*S.T[3*t+2]+k]);}});
  const BP=bvh(ot.length,PL,PH),o6=new Float64Array(6);
  const projS=(x,y,z)=>{const i=bnear(BP,x,y,z,(i,b)=>{const t=ot[i];return cpt(S.V,3*S.T[3*t],3*S.T[3*t+1],3*S.T[3*t+2],x,y,z,o6);});if(i<0)return[x,y,z];const t=ot[i];cpt(S.V,3*S.T[3*t],3*S.T[3*t+1],3*S.T[3*t+2],x,y,z,o6);return[o6[0],o6[1],o6[2]];};
  const projF=(x,y,z,L)=>{const i=bnear(BS,x,y,z,(i,b)=>SID[i]!==L?Infinity:cseg(SA[6*i],SA[6*i+1],SA[6*i+2],SA[6*i+3],SA[6*i+4],SA[6*i+5],x,y,z,o6));if(i<0)return[x,y,z];cseg(SA[6*i],SA[6*i+1],SA[6*i+2],SA[6*i+3],SA[6*i+4],SA[6*i+5],x,y,z,o6);return[o6[0],o6[1],o6[2]];};
  const al=new Array(T.length/3).fill(1),hT=(a,b)=>2*hf((X[3*a]+X[3*b])/2,(X[3*a+1]+X[3*b+1])/2,(X[3*a+2]+X[3*b+2])/2),dist=(a,b)=>Math.hypot(X[3*a]-X[3*b],X[3*a+1]-X[3*b+1],X[3*a+2]-X[3*b+2]);
  const nrm=(a,b,c,pa)=>{const A=pa||P(a),ux=X[3*b]-A[0],uy=X[3*b+1]-A[1],uz=X[3*b+2]-A[2],wx=X[3*c]-A[0],wy=X[3*c+1]-A[1],wz=X[3*c+2]-A[2];return[uy*wz-uz*wy,uz*wx-ux*wz,ux*wy-uy*wx];},tn=t=>nrm(T[3*t],T[3*t+1],T[3*t+2]);
  const edges=()=>{const M=new Map();for(let t=0;t<al.length;t++){if(!al[t])continue;for(let k=0;k<3;k++){const key=ek(T[3*t+k],T[3*t+(k+1)%3]),e=M.get(key);e?e.push(t):M.set(key,[t]);}}return M;};
  const rings=()=>{const R=Array.from({length:X.length/3},()=>[]);for(let t=0;t<al.length;t++)if(al[t])for(let k=0;k<3;k++)R[T[3*t+k]].push(t);return R;};
  const fix=(M,key,o,n)=>{const e=M.get(key);if(e){const i=e.indexOf(o);if(i>=0)e[i]=n;}},addE=(M,key,t)=>{const e=M.get(key);e?e.push(t):M.set(key,[t]);},orient=(t0,a,b)=>{let i=0;while(i<3&&!(T[3*t0+i]===a&&T[3*t0+(i+1)%3]===b))i++;return i;};
  const split=()=>{const M=edges();let n=0;for(let rd=0;rd<60;rd++){if(rd)flip(M);const cand=[],lng=new Set();for(let t=0;t<al.length;t++){if(!al[t])continue;let bk=-1,bl=-1;for(let k=0;k<3;k++){const a=T[3*t+k],b=T[3*t+(k+1)%3],l=dist(a,b);if(l>bl){bl=l;bk=ek(a,b);}}lng.add(bk);}for(const key of lng){const a=ka(key),b=kb(key),r=dist(a,b)/hT(a,b);if(r>4/3)cand.push([r,key]);}if(!cand.length)break;cand.sort((x,y)=>y[0]-x[0]);
    for(const[,key]of cand){const ts=M.get(key);if(!ts)continue;const a=ka(key),b=kb(key),f=FE.get(key),m=X.length/3,mx=(X[3*a]+X[3*b])/2,my=(X[3*a+1]+X[3*b+1])/2,mz=(X[3*a+2]+X[3*b+2])/2;X.push(...(f!==undefined?projF(mx,my,mz,f):projS(mx,my,mz)));vt.push(f!==undefined?1:0);lv.push(f!==undefined?f:-1);
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
  const XO=Array.from(X),qt=[...R.vt],ql=[...R.lv],QF=new Map(),mid=new Map(),mk=(a,b)=>{const key=ek(a,b);let m=mid.get(key);if(m===undefined){const f=FE.get(key),x=(X[3*a]+X[3*b])/2,y=(X[3*a+1]+X[3*b+1])/2,z=(X[3*a+2]+X[3*b+2])/2;m=XO.length/3;XO.push(...(f!==undefined?projF(x,y,z,f):projS(x,y,z)));qt.push(f!==undefined?1:0);ql.push(f!==undefined?f:-1);if(f!==undefined){QF.set(ek(a,m),f);QF.set(ek(m,b),f);}mid.set(key,m);}return m;},Q=[];
  let nq=0,ntr=0;for(const p of polys){const n=p.length;n===4?nq++:ntr++;let cx=0,cy=0,cz=0;for(const v of p){cx+=X[3*v];cy+=X[3*v+1];cz+=X[3*v+2];}const o=XO.length/3;XO.push(...projS(cx/n,cy/n,cz/n));qt.push(0);ql.push(-1);const ms=p.map((v,i)=>mk(v,p[(i+1)%n]));for(let i=0;i<n;i++)Q.push(p[i],ms[i],o,ms[(i+n-1)%n]);}
  const nn=XO.length/3,nQ=Q.length/4,nb=Array.from({length:nn},()=>new Set()),vq=Array.from({length:nn},()=>[]);for(let q=0;q<nQ;q++)for(let j=0;j<4;j++){const a=Q[4*q+j],b=Q[4*q+(j+1)%4];nb[a].add(b);nb[b].add(a);vq[a].push(q);}
  for(let rep=0;rep<(opt.qsmooth??4);rep++){const NX=XO.slice();for(let v=0;v<nn;v++){if(qt[v]===2)continue;let cx=0,cy=0,cz=0,c=0;if(qt[v]===1){for(const u of nb[v])if(QF.has(ek(u,v))){cx+=XO[3*u];cy+=XO[3*u+1];cz+=XO[3*u+2];c++;}if(c!==2)continue;const q=projF(XO[3*v]+0.5*(cx/2-XO[3*v]),XO[3*v+1]+0.5*(cy/2-XO[3*v+1]),XO[3*v+2]+0.5*(cz/2-XO[3*v+2]),ql[v]);NX[3*v]=q[0];NX[3*v+1]=q[1];NX[3*v+2]=q[2];continue;}
      for(const u of nb[v]){cx+=XO[3*u];cy+=XO[3*u+1];cz+=XO[3*u+2];c++;}const q=projS(XO[3*v]+0.5*(cx/c-XO[3*v]),XO[3*v+1]+0.5*(cy/c-XO[3*v+1]),XO[3*v+2]+0.5*(cz/c-XO[3*v+2]));NX[3*v]=q[0];NX[3*v+1]=q[1];NX[3*v+2]=q[2];}
    for(let r2=0;r2<3;r2++){let bad=0;for(let q=0;q<nQ;q++){const o=qsin(XO,Q,q),n=qsin(NX,Q,q);if(n<Math.min(0.3,o)){for(let j=0;j<4;j++){const p=3*Q[4*q+j];NX[p]=XO[p];NX[p+1]=XO[p+1];NX[p+2]=XO[p+2];}bad++;}}if(!bad)break;}
    for(let i=0;i<XO.length;i++)XO[i]=NX[i];}
  let qmin=1;for(let q=0;q<nQ;q++)qmin=Math.min(qmin,qsin(XO,Q,q));
  return{X:Float64Array.from(XO),Q:Int32Array.from(Q),nq,ntr,qmin};
}
function hexJac(X,E,e,full){const x=[],y=[],z=[];for(let a=0;a<8;a++){const n=3*E[8*e+a];x.push(X[n]);y.push(X[n+1]);z.push(X[n+2]);}let mn=Infinity,sj=Infinity;const g=full?[-1,-0.5773502691896258,0,0.5773502691896258,1]:[-0.5773502691896258,0.5773502691896258];
  for(const xi of g)for(const et of g)for(const ze of g){let j00=0,j01=0,j02=0,j10=0,j11=0,j12=0,j20=0,j21=0,j22=0;for(let a=0;a<8;a++){const[p,q,r]=HEX_NODES[a],dx=p*(1+q*et)*(1+r*ze)/8,dy=q*(1+p*xi)*(1+r*ze)/8,dz=r*(1+p*xi)*(1+q*et)/8;j00+=x[a]*dx;j01+=x[a]*dy;j02+=x[a]*dz;j10+=y[a]*dx;j11+=y[a]*dy;j12+=y[a]*dz;j20+=z[a]*dx;j21+=z[a]*dy;j22+=z[a]*dz;}const d=j00*(j11*j22-j12*j21)-j01*(j10*j22-j12*j20)+j02*(j10*j21-j11*j20);mn=Math.min(mn,d);}
  for(let a=0;a<8;a++){const[p,q,r]=HEX_NODES[a],nb=[0,1,2].map(k=>HEX_NODES.findIndex(n=>n[k]===-[p,q,r][k]&&n[(k+1)%3]===[p,q,r][(k+1)%3]&&n[(k+2)%3]===[p,q,r][(k+2)%3])),ev=nb.map((b,k)=>{const s=-[p,q,r][k];return[(x[b]-x[a])*s,(y[b]-y[a])*s,(z[b]-z[a])*s];}),d=ev[0][0]*(ev[1][1]*ev[2][2]-ev[1][2]*ev[2][1])-ev[0][1]*(ev[1][0]*ev[2][2]-ev[1][2]*ev[2][0])+ev[0][2]*(ev[1][0]*ev[2][1]-ev[1][1]*ev[2][0]),l=Math.hypot(...ev[0])*Math.hypot(...ev[1])*Math.hypot(...ev[2]);sj=Math.min(sj,l>0?d/l:-1);}
  return{det:mn,sj};}
export function meshQuality(X,E,sample){
  const ne=E.length/8;let minSJ=Infinity,neg=0,low=0,maxAR=0,vol=0,minDet=Infinity;const st=sample&&ne>sample?Math.ceil(ne/sample):1;
  for(let e=0;e<ne;e++){const n0=8*e;let lmin=Infinity,lmax=0;for(const[a,b]of[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]){const p=3*E[n0+a],q=3*E[n0+b],l=Math.hypot(X[p]-X[q],X[p+1]-X[q+1],X[p+2]-X[q+2]);lmin=Math.min(lmin,l);lmax=Math.max(lmax,l);}maxAR=Math.max(maxAR,lmax/(lmin||1e-300));
    if(e%st===0){const J=hexJac(X,E,e,false);minDet=Math.min(minDet,J.det);if(J.det<=0)neg++;minSJ=Math.min(minSJ,J.sj);if(J.sj<0.3)low++;}
    const c=[0,1,2,3,4,5,6,7].map(a=>3*E[n0+a]),tet=(a,b,d,f)=>{const ux=X[b]-X[a],uy=X[b+1]-X[a+1],uz=X[b+2]-X[a+2],wx=X[d]-X[a],wy=X[d+1]-X[a+1],wz=X[d+2]-X[a+2],sx=X[f]-X[a],sy=X[f+1]-X[a+1],sz=X[f+2]-X[a+2];return(ux*(wy*sz-wz*sy)-uy*(wx*sz-wz*sx)+uz*(wx*sy-wy*sx))/6;};const v=tet(c[0],c[1],c[3],c[4])+tet(c[1],c[2],c[3],c[6])+tet(c[1],c[3],c[4],c[6])+tet(c[1],c[4],c[5],c[6])+tet(c[3],c[4],c[6],c[7]);vol+=v;}
  return{ne,minSJ,lowSJ:low,neg,maxAR,volume:vol,minDet};
}
function tagFacets(S,X,E,bf,filt){
  const ff=new Int32Array(bf.length),o=new Float64Array(6);
  for(let i=0;i<bf.length;i++){const e=Math.floor(bf[i]/6),f=HEX_FACES[bf[i]%6],P=f.map(a=>3*E[8*e+a]);let cx=0,cy=0,cz=0;for(const p of P){cx+=X[p]/4;cy+=X[p+1]/4;cz+=X[p+2]/4;}const ux=X[P[2]]-X[P[0]],uy=X[P[2]+1]-X[P[0]+1],uz=X[P[2]+2]-X[P[0]+2],wx=X[P[3]]-X[P[1]],wy=X[P[3]+1]-X[P[1]+1],wz=X[P[3]+2]-X[P[1]+2],nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx,l=Math.hypot(nx,ny,nz)||1,fl=filt?filt(i):null;
    const sz=Math.max(Math.hypot(ux,uy,uz),Math.hypot(wx,wy,wz));let t=closest(S,cx,cy,cz,u=>(!fl||fl(u))&&(S.N[3*u]*nx+S.N[3*u+1]*ny+S.N[3*u+2]*nz)>0.3*l,o);if(t<0||(o[0]-cx)**2+(o[1]-cy)**2+(o[2]-cz)**2>sz*sz)t=closest(S,cx,cy,cz,fl,o);if(t<0)t=closest(S,cx,cy,cz,null,o);ff[i]=t>=0?S.fid[t]:-1;}
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
    if(s.type&&F){F.forEach((q,i)=>{if(q&&q.type===String(s.type).toUpperCase())out.add(i);});}};
  walk(spec);return out;
}
function selector(inp,M){
  return spec=>{const ids=faceIds(inp,spec),fac=[],seen=new Uint8Array(M.X.length/3),nodes=[];for(let i=0;i<M.bf.length;i++)if(ids.has(M.ff[i])){fac.push(M.bf[i]);const e=Math.floor(M.bf[i]/6);for(const a of HEX_FACES[M.bf[i]%6]){const n=M.E[8*e+a];if(!seen[n]){seen[n]=1;nodes.push(n);}}}return{nodes:Int32Array.from(nodes),facets:Int32Array.from(fac),faces:[...ids]};};
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
  const hp0=opt.size||h0,hmin=opt.minSize||hp0/40,g=opt.grade||0.3,X=[],ids=new Map(),pid=(key,p)=>{let i=ids.get(key);if(i===undefined){i=X.length/3;ids.set(key,i);X.push(...p);}return i;},segs=[];let mprof=0,hs=[];
  for(const ch of chains){const n=ch.length,sL=[0];for(let i=1;i<n;i++){const a=ch[i-1],b=ch[i];sL.push(sL[i-1]+Math.hypot(V[3*b]-V[3*a],V[3*b+1]-V[3*a+1],V[3*b+2]-V[3*a+2]));}const tot=sL[n-1];if(!(tot>0))continue;
    const h=sL.map((_,i)=>{if(i===0||i===n-1){const cl=ch[0]===ch[n-1]&&n>2;if(!cl)return hp0;}const u=ch[i===0?n-2:i-1],w=ch[i===n-1?1:i+1],th=turn(u,ch[i],w),ds=(Math.hypot(...P(ch[i]).map((c,k)=>c-P(u)[k]))+Math.hypot(...P(w).map((c,k)=>c-P(ch[i])[k])))/2;return th>1e-4?Math.max(hmin,Math.min(hp0,ds/th*Math.PI/2/(opt.bend||6))):hp0;});
    for(let i=1;i<n;i++)h[i]=Math.min(h[i],h[i-1]+g*(sL[i]-sL[i-1]));for(let i=n-2;i>=0;i--)h[i]=Math.min(h[i],h[i+1]+g*(sL[i+1]-sL[i]));
    const I=[0];for(let i=1;i<n;i++)I.push(I[i-1]+(sL[i]-sL[i-1])*(1/h[i-1]+1/h[i])/2);const m=Math.max(1,Math.round(I[n-1]));mprof+=m;const pts=[];let j=0;
    for(let q=0;q<=m;q++){const target=I[n-1]*q/m;while(j<n-2&&I[j+1]<target)j++;const w=(target-I[j])/((I[j+1]-I[j])||1),a=ch[j],b=ch[j+1],p=[0,1,2].map(k=>V[3*a+k]+w*(V[3*b+k]-V[3*a+k]));pts.push(q===0?['v'+ch[0],P(ch[0])]:q===m?['v'+ch[n-1],P(ch[n-1])]:['c'+chains.indexOf(ch)+'_'+q,p]);}
    for(let q=0;q<m;q++){hs.push(Math.hypot(...pts[q+1][1].map((c,k)=>c-pts[q][1][k])));segs.push([pts[q],pts[q+1]]);}}
  if(!segs.length)return null;hs.sort((a,b)=>a-b);const hmed=hs[Math.floor(hs.length/2)],ha=opt.size||Math.min(10*hmed,Math.max(hmed,L*mprof*N/Math.max(res,1))),na=Math.max(1,Math.ceil(L/ha)),ring=[];
  const prof=new Map();for(const sg of segs)for(const[k,p]of sg)if(!prof.has(k))prof.set(k,p);const pk=[...prof.keys()],pix=new Map(pk.map((k,i)=>[k,i])),np=pk.length,XO=new Float64Array(3*np*(na+1));
  pk.forEach((k,i)=>{const p=prof.get(k),d=p[0]*ax[0]+p[1]*ax[1]+p[2]*ax[2]-amin;for(let j=0;j<=na;j++){const s=j/na*L-d;for(let c=0;c<3;c++)XO[3*(j*np+i)+c]=p[c]+s*ax[c];}});
  const Q=[],o=new Float64Array(6);for(const[a,b]of segs){const ia=pix.get(a[0]),ib=pix.get(b[0]),mx=(a[1][0]+b[1][0])/2+ax[0]*L/(2*na),my=(a[1][1]+b[1][1])/2+ax[1]*L/(2*na),mz=(a[1][2]+b[1][2])/2+ax[2]*L/(2*na),t=closest(S,mx,my,mz,u=>S0[u],o),e=[b[1][0]-a[1][0],b[1][1]-a[1][1],b[1][2]-a[1][2]],cr=[e[1]*ax[2]-e[2]*ax[1],e[2]*ax[0]-e[0]*ax[2],e[0]*ax[1]-e[1]*ax[0]],fl=t>=0&&cr[0]*TN[3*t]+cr[1]*TN[3*t+1]+cr[2]*TN[3*t+2]<0;
    for(let j=0;j<na;j++){const q=[j*np+ia,j*np+ib,(j+1)*np+ib,(j+1)*np+ia];Q.push(...(fl?q.reverse():q));}}
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
  const X=new Float64Array(3*nn*(N+1)),tk=new Float64Array(nn),o=new Float64Array(6),isS1=u=>sh.S1[u],isS0=u=>sh.S0[u],VN0=new Float64Array(3*S.nv);let miss=0;
  for(let t=0;t<S.nt;t++){if(!sh.S0[t])continue;for(let k=0;k<3;k++){const a=3*S.T[3*t+k],b=3*S.T[3*t+(k+1)%3],c=3*S.T[3*t+(k+2)%3],ux=S.V[b]-S.V[a],uy=S.V[b+1]-S.V[a+1],uz=S.V[b+2]-S.V[a+2],wx=S.V[c]-S.V[a],wy=S.V[c+1]-S.V[a+1],wz=S.V[c+2]-S.V[a+2],an=Math.acos(Math.max(-1,Math.min(1,(ux*wx+uy*wy+uz*wz)/(Math.hypot(ux,uy,uz)*Math.hypot(wx,wy,wz)||1))));for(let j=0;j<3;j++)VN0[a+j]+=an*S.N[3*t+j];}}
  for(let i=0;i<nn;i++){const px=XQ[3*i],py=XQ[3*i+1],pz=XQ[3*i+2],ct=closest(S,px,py,pz,isS0,o);let nx=NN[3*i],ny=NN[3*i+1],nz=NN[3*i+2];if(ct>=0){const a=3*S.T[3*ct],b=3*S.T[3*ct+1],c=3*S.T[3*ct+2],u=o[4],v=o[5],w=1-u-v;nx=w*VN0[a]+u*VN0[b]+v*VN0[c];ny=w*VN0[a+1]+u*VN0[b+1]+v*VN0[c+1];nz=w*VN0[a+2]+u*VN0[b+2]+v*VN0[c+2];}const l=Math.hypot(nx,ny,nz)||1,dx=-nx/l,dy=-ny/l,dz=-nz/l;let qx,qy,qz;const j=raycast(S,px,py,pz,dx,dy,dz,3*sh.tmax,isS1,1e-6);
    if(j>=0){qx=px+BD*dx;qy=py+BD*dy;qz=pz+BD*dz;}else{miss++;closest(S,px+dx*t,py+dy*t,pz+dz*t,isS1,o);qx=o[0];qy=o[1];qz=o[2];}
    tk[i]=Math.hypot(qx-px,qy-py,qz-pz);for(let k=0;k<=N;k++){const s=k/N,p=3*(i*(N+1)+k);X[p]=px+s*(qx-px);X[p+1]=py+s*(qy-py);X[p+2]=pz+s*(qz-pz);}}
  const E=new Int32Array(8*nq*N),C=N+1;for(let k=0;k<N;k++)for(let q=0;q<nq;q++){const[a,b,c,d]=[C*Q[4*q]+k,C*Q[4*q+1]+k,C*Q[4*q+2]+k,C*Q[4*q+3]+k];E.set([a,d,c,b,a+1,d+1,c+1,b+1],8*(k*nq+q));}
  const EM=new Map();for(let q=0;q<nq;q++)for(let j=0;j<4;j++){const key=ek(Q[4*q+j],Q[4*q+(j+1)%4]),e=EM.get(key);e===undefined?EM.set(key,[q,j]):EM.set(key,null);}
  const bf=[],kind=[],SF=[5,4,3,2];for(let q=0;q<nq;q++){bf.push(6*q);kind.push(0);bf.push(6*((N-1)*nq+q)+1);kind.push(1);}for(const v of EM.values())if(v)for(let k=0;k<N;k++){bf.push(6*(k*nq+v[0])+SF[v[1]]);kind.push(2);}
  const M={X,E,bf:Int32Array.from(bf)},sideF=u=>!sh.S0[u]&&!sh.S1[u];M.ff=tagFacets(S,X,E,M.bf,i=>kind[i]===0?u=>sh.S0[u]:kind[i]===1?isS1:sideF);
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
  const ns=sg.length/2,lo=new Float64Array(3*ns),hi=new Float64Array(3*ns),V=S.V;for(let i=0;i<ns;i++)for(let c=0;c<3;c++){lo[3*i+c]=Math.min(V[3*sg[2*i]+c],V[3*sg[2*i+1]+c]);hi[3*i+c]=Math.max(V[3*sg[2*i]+c],V[3*sg[2*i+1]+c]);}
  const corner=[];for(const[v,d]of deg)if(d!==2)corner.push(v);
  F={crease,seg:Int32Array.from(sg),B:bvh(ns,lo,hi),patch,np,corner};FC.set(S,F);return F;
}
function nearFeat(S,F,px,py,pz,o){const V=S.V,sg=F.seg,q=new Float64Array(6);const i=bnear(F.B,px,py,pz,t=>cseg(V[3*sg[2*t]],V[3*sg[2*t]+1],V[3*sg[2*t]+2],V[3*sg[2*t+1]],V[3*sg[2*t+1]+1],V[3*sg[2*t+1]+2],px,py,pz,q));if(i>=0)cseg(V[3*sg[2*i]],V[3*sg[2*i]+1],V[3*sg[2*i]+2],V[3*sg[2*i+1]],V[3*sg[2*i+1]+1],V[3*sg[2*i+1]+2],px,py,pz,o);return i<0?Infinity:Math.sqrt(BD);}
function smoothNear(X,E,nc,t0n,hn,hm,hw,cube,its,HK){
  if(!its)return 0;const ne=E.length/8,nn=X.length/3,isH=new Uint8Array(nn),lv=new Uint8Array(nn),cnt=new Int32Array(nn+1);for(const n of hn)isH[n]=1;for(let e=nc;e<ne;e++)for(let a=0;a<4;a++)lv[E[8*e+a]]=1;
  for(let e=0;e<nc;e++){let t=false;for(let a=0;a<8;a++)if(lv[E[8*e+a]]===1)t=true;if(t)for(let a=0;a<8;a++)if(!lv[E[8*e+a]])lv[E[8*e+a]]=2;}
  for(let e=0;e<ne;e++)for(let a=0;a<8;a++)cnt[E[8*e+a]+1]++;for(let i=0;i<nn;i++)cnt[i+1]+=cnt[i];const ie=new Int32Array(cnt[nn]),fp=cnt.slice(0,nn);for(let e=0;e<ne;e++)for(let a=0;a<8;a++)ie[fp[E[8*e+a]]++]=e;
  const ED=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],q=e=>hexJac(X,E,e,false),place=()=>{for(let k=0;k<hn.length;k++){const n=hn[k];for(let c=0;c<3;c++){let v=0;for(let j=0;j<HK;j++)if(hm[HK*k+j]>=0)v+=hw[HK*k+j]*X[3*hm[HK*k+j]+c];X[3*n+c]=v;}}},mv=new Uint8Array(nn);let moved=0;
  for(let it=0;it<its;it++)for(let n=0;n<t0n;n++){if(!lv[n]||isH[n])continue;const nb=new Set();for(let k=cnt[n];k<cnt[n+1];k++){const e=ie[k];for(const[a,b]of ED){const u=E[8*e+a],w=E[8*e+b];if(u===n)nb.add(w);else if(w===n)nb.add(u);}}if(!nb.size)continue;
    let x=0,y=0,z=0;for(const m of nb){x+=X[3*m];y+=X[3*m+1];z+=X[3*m+2];}const k0=nb.size,p=[X[3*n],X[3*n+1],X[3*n+2]];let before=Infinity;for(let k=cnt[n];k<cnt[n+1];k++)before=Math.min(before,q(ie[k]).sj);
    X[3*n]=0.5*p[0]+0.5*x/k0;X[3*n+1]=0.5*p[1]+0.5*y/k0;X[3*n+2]=0.5*p[2]+0.5*z/k0;let after=Infinity;for(let k=cnt[n];k<cnt[n+1];k++){const J=q(ie[k]);after=Math.min(after,J.det>0?J.sj:-1);}
    if(after<Math.min(before,0.3)+1e-9&&!(after>before)){X[3*n]=p[0];X[3*n+1]=p[1];X[3*n+2]=p[2];}else if(!mv[n]){mv[n]=1;moved++;}}
  place();for(let e=0;e<nc;e++)for(let a=0;a<8;a++)if(mv[E[8*e+a]]){cube[e]=0;break;}return moved;
}
function octreeMesh(inp,opt={}){
  const S=thickOf(surfOf(inp)),res=opt.res||30000,V=inp.volume||S.volume||1,Nt=Math.max(1,opt.layers||2),hv=Math.cbrt(V/res);let sc=opt.size?opt.size/hv:1.2,st=1,M=null;
  for(let pass=0;pass<6;pass++){M=octBuild(S,opt,hv*sc,Nt,st);M.info.passes=pass+1;const ne=M.E.length/8,r=ne/res;const hard=opt.hardMax||4*res;if(opt.size||(r<=1.6&&r>=0.5)||pass===5||(r>1.6&&ne<=hard&&sc>8))break;r>1?(ne>hard&&M.info.boundary>0.5*M.info.leaves?st*=Math.pow(ne/hard,0.5):sc*=Math.pow(r,0.4)):(st>1?st=Math.max(1,st*Math.pow(r,0.5)):sc*=Math.pow(r,0.4));}
  const bad=m=>{let b=0;for(let e=m.info.core;e<m.E.length/8;e++)if(hexJac(m.X,m.E,e,false).det<=0)b++;return b;};let nb=bad(M),pc=M.info.passes;const cap=Math.max(opt.hardMax||4*res,1.6*M.E.length/8);for(const[a,b]of opt.size?[]:[[1,0.85],[0.9,1],[1.12,1],[1,0.72]]){if(!nb)break;const M2=octBuild(S,opt,hv*sc*a,Nt,st*b),b2=bad(M2);pc++;if(b2<nb&&M2.E.length/8<=cap){M=M2;nb=b2;}}M.info.passes=pc;M.info.inverted=nb;
  M.warn=M.through<Nt?'thinnest walls have '+M.through.toFixed(1)+' elements through the thickness (target '+Nt+'); raise the mesh resolution':null;return M;
}
function octBuild(S,opt,hc,Nt,stc){
  const{lo,hi,nt,th,V:SV,T:ST}=S,ex0=Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])*1.02+1e-9,ext=hc*2**Math.max(0,Math.ceil(Math.log2(ex0/hc)-1e-9)),o0=[0,1,2].map(k=>(lo[k]+hi[k])/2-ext/2),hmin=opt.minSize||hc/64,hs=new Float64Array(nt),cq=new Float64Array(6);let hsm=Infinity;
  for(let t=0;t<nt;t++){hs[t]=Math.max(hmin,Math.min(hc,stc*th[t]/Math.max(2.5,Nt+0.5)));hsm=Math.min(hsm,hs[t]);}
  const Lmax=Math.min(12,Math.max(1,Math.ceil(Math.log2(ext/hsm-1e-9)))),G=1<<Lmax,key=(l,i,j,k)=>((l*4096+i)*4096+j)*4096+k,lv=[],ci=[],cj=[],ck=[],bd=[],alive=[],idx=new Map(),HZ=l=>ext/(1<<l);
  const classify=(l,i,j,k)=>{const h=HZ(l),cx=o0[0]+(i+.5)*h,cy=o0[1]+(j+.5)*h,cz=o0[2]+(k+.5)*h,r=h*0.8660254*1.0001;let need=Infinity,any=false;bover(S.B,[cx-r,cy-r,cz-r],[cx+r,cy+r,cz+r],t=>{if((hs[t]<need||!any)&&cpt(SV,3*ST[3*t],3*ST[3*t+1],3*ST[3*t+2],cx,cy,cz,cq)<=r*r){any=true;need=Math.min(need,hs[t]);}});return any?need:insideSign(S,cx,cy,cz)<0?-1:0;};
  const add=(l,i,j,k,c)=>{const q=lv.length;lv.push(l);ci.push(i);cj.push(j);ck.push(k);bd.push(c);alive.push(1);idx.set(key(l,i,j,k),q);return q;},stk=[[0,0,0,0]];
  while(stk.length){const[l,i,j,k]=stk.pop(),c=classify(l,i,j,k);if(c===0)continue;if(HZ(l)>(c>0?c:hc)*1.0001&&l<Lmax){for(let a=0;a<8;a++)stk.push([l+1,2*i+(a&1),2*j+(a>>1&1),2*k+(a>>2)]);}else add(l,i,j,k,c);}
  const up=(l,i,j,k,m0)=>{for(let m=m0;m>=0;m--){const s=l-m,q=idx.get(key(m,i>>s,j>>s,k>>s));if(q!==undefined)return q;}return-1;},split=q=>{alive[q]=0;idx.delete(key(lv[q],ci[q],cj[q],ck[q]));const out=[],l=lv[q]+1;for(let a=0;a<8;a++){const i=2*ci[q]+(a&1),j=2*cj[q]+(a>>1&1),k=2*ck[q]+(a>>2),c=classify(l,i,j,k);if(c!==0)out.push(add(l,i,j,k,c));}return out;};
  const bal=W=>{while(W.length){const q=W.pop();if(!alive[q]||lv[q]<2)continue;const l=lv[q],n=1<<l;let hit=false;for(let d=0;d<27&&!hit;d++){if(d===13)continue;const i=ci[q]+(d%3)-1,j=cj[q]+((d/3|0)%3)-1,k=ck[q]+(d/9|0)-1;if(i<0||j<0||k<0||i>=n||j>=n||k>=n)continue;const p=up(l,i,j,k,l-2);if(p>=0){W.push(...split(p),q);hit=true;}}}};bal(lv.map((_,q)=>q));
  const nk=(I,J,K)=>(I*(G+1)+J)*(G+1)+K,SDC=new Map(),o=new Float64Array(6),dl=opt.core??0.25,DIR=[[0,0,-1],[0,0,1],[0,-1,0],[1,0,0],[0,1,0],[-1,0,0]];let leaves,nbd,NM,XP,nl,E0,nn0,X0,sd,core,li,nref=0;
  const isC=q=>q!==undefined&&q>=0&&li.has(q)&&core[li.get(q)]===1,nbr=(q,d)=>{const l=lv[q],n=1<<l,i=ci[q]+d[0],j=cj[q]+d[1],k=ck[q]+d[2];if(i<0||j<0||k<0||i>=n||j>=n||k>=n)return[[],0];let p=idx.get(key(l,i,j,k));if(p!==undefined)return[[p],0];p=up(l,i,j,k,l-1);if(p>=0)return[[p],-1];const r=[];for(let a=0;a<8;a++){const ii=2*i+(a&1),jj=2*j+(a>>1&1),kk=2*k+(a>>2);if(d[0]&&(ii&1)===(d[0]>0?1:0)||d[1]&&(jj&1)===(d[1]>0?1:0)||d[2]&&(kk&1)===(d[2]>0?1:0))continue;const c=idx.get(key(l+1,ii,jj,kk));if(c!==undefined)r.push(c);}return[r,1];};
  for(let rf=0;;rf++){leaves=[];nbd=0;for(let q=0;q<lv.length;q++)if(alive[q]){leaves.push(q);if(bd[q]>0)nbd++;}NM=new Map();XP=[];const nid=(I,J,K)=>{const kk=nk(I,J,K);let n=NM.get(kk);if(n===undefined){n=XP.length/3;NM.set(kk,n);XP.push(o0[0]+I*ext/G,o0[1]+J*ext/G,o0[2]+K*ext/G);}return n;};nl=leaves.length;E0=new Int32Array(8*nl);
    leaves.forEach((q,e)=>{const s=Lmax-lv[q],z=1<<s;for(let a=0;a<8;a++){const[p,r,w]=HEX_NODES[a];E0[8*e+a]=nid((ci[q]<<s)+(p>0?z:0),(cj[q]<<s)+(r>0?z:0),(ck[q]<<s)+(w>0?z:0));}});nn0=XP.length/3;X0=Float64Array.from(XP);sd=new Float64Array(nn0);for(const[kk,n]of NM){let v=SDC.get(kk);if(v===undefined){v=sdf(S,X0[3*n],X0[3*n+1],X0[3*n+2],o);SDC.set(kk,v);}sd[n]=v;}
    core=new Uint8Array(nl);for(let e=0;e<nl;e++){const h=HZ(lv[leaves[e]]);let c=1;for(let a=0;a<8&&c;a++)if(!(sd[E0[8*e+a]]<-dl*h))c=0;core[e]=c;}li=new Map(leaves.map((q,e)=>[q,e]));if(rf>=(opt.refine??4))break;
    const sp=new Set();for(let e=0;e<nl;e++){if(!core[e])continue;const q=leaves[e];for(const d of DIR){const[r,fn]=nbr(q,d);if(fn!==1)continue;const nc=r.filter(isC).length;if(nc&&nc<4){sp.add(q);break;}}}if(!sp.size)break;nref+=sp.size;const W=[];for(const q of sp)W.push(...split(q));bal(W);}
  for(let ch=1,it=0;ch&&it<20;it++){ch=0;for(let e=0;e<nl;e++){if(!core[e])continue;const q=leaves[e];for(const d of DIR){const[r,fn]=nbr(q,d);if(fn!==1)continue;const nc=r.filter(isC);if(nc.length&&(nc.length<4)){for(const c of nc)core[li.get(c)]=0;ch=1;}}}}
  const ce=[];for(let e=0;e<nl;e++)if(core[e])ce.push(e);const cm=new Uint8Array(nl);for(const e of ce)cm[e]=1;
  const hangOf=alv=>{const H=new Map();leaves.forEach((q,e)=>{if(!alv[e]||lv[q]>=Lmax)return;const s=Lmax-lv[q],z=1<<s,hz=z>>1,I=ci[q]<<s,J=cj[q]<<s,K=ck[q]<<s,c=[0,1,2,3,4,5,6,7].map(a=>E0[8*e+a]);
    for(const[a,b]of[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]){const A=HEX_NODES[a],B=HEX_NODES[b],n=NM.get(nk(I+(A[0]+B[0]+2)*hz/2,J+(A[1]+B[1]+2)*hz/2,K+(A[2]+B[2]+2)*hz/2));if(n!==undefined&&!H.has(n))H.set(n,[[c[a],c[b]],[0.5,0.5]]);}
    for(const f of HEX_FACES){let X=0,Y=0,Z=0;for(const a of f){X+=HEX_NODES[a][0];Y+=HEX_NODES[a][1];Z+=HEX_NODES[a][2];}const n=NM.get(nk(I+(X/4+1)*hz,J+(Y/4+1)*hz,K+(Z/4+1)*hz));if(n!==undefined&&!H.has(n))H.set(n,[f.map(a=>c[a]),[0.25,0.25,0.25,0.25]]);}});
    const used=new Uint8Array(nn0);for(let e=0;e<nl;e++)if(alv[e])for(let a=0;a<8;a++)used[E0[8*e+a]]=1;for(const n of[...H.keys()])if(!used[n])H.delete(n);return H;};
  const H=hangOf(cm),BQ=[],NB=new Float64Array(3*nn0),isB=new Uint8Array(nn0);
  for(const e of ce){const q=leaves[e];DIR.forEach((d,f)=>{const[r]=nbr(q,d);if(r.some(isC))return;const fq=HEX_FACES[f].map(a=>E0[8*e+a]);BQ.push(fq,e);const P=fq.map(n=>3*n),ux=X0[P[2]]-X0[P[0]],uy=X0[P[2]+1]-X0[P[0]+1],uz=X0[P[2]+2]-X0[P[0]+2],wx=X0[P[3]]-X0[P[1]],wy=X0[P[3]+1]-X0[P[1]+1],wz=X0[P[3]+2]-X0[P[1]+2],nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx;for(const n of fq){NB[3*n]+=nx;NB[3*n+1]+=ny;NB[3*n+2]+=nz;isB[n]=1;}});}
  const BA=new Map();for(let b=0;b<BQ.length;b+=2){const fq=BQ[b];for(let k=0;k<4;k++){const a=fq[k],c=fq[(k+1)%4];(BA.get(a)||BA.set(a,new Set()).get(a)).add(c);(BA.get(c)||BA.set(c,new Set()).get(c)).add(a);}}
  for(const n of BA.keys()){const l=Math.hypot(NB[3*n],NB[3*n+1],NB[3*n+2])||1;for(let c=0;c<3;c++)NB[3*n+c]/=l;}
  for(let it=0;it<(opt.nsmooth??6);it++){const nw=new Map();for(const[n,A]of BA){let x=NB[3*n],y=NB[3*n+1],z=NB[3*n+2];for(const m of A){x+=NB[3*m];y+=NB[3*m+1];z+=NB[3*m+2];}const l=Math.hypot(x,y,z)||1;nw.set(n,[x/l,y/l,z/l]);}for(const[n,v]of nw){NB[3*n]=v[0];NB[3*n+1]=v[1];NB[3*n+2]=v[2];}}
  const FT=features(S,opt.crease||30),TL=new Int32Array(nn0).fill(-1),top=new Int32Array(nn0).fill(-1),TX=[],TH=new Map(),hb=new Float64Array(nn0);let ntn=0,nray=0;for(const e of ce){const h=HZ(lv[leaves[e]]);for(let a=0;a<8;a++){const n=E0[8*e+a];hb[n]=Math.max(hb[n],h);}}
  for(let n=0;n<nn0;n++){if(!isB[n])continue;top[n]=ntn++;const hh=H.get(n);if(hh&&hh[0].every(m=>isB[m])){TX.push(0,0,0);TH.set(n,hh);continue;}const px=X0[3*n],py=X0[3*n+1],pz=X0[3*n+2],l=Math.hypot(NB[3*n],NB[3*n+1],NB[3*n+2])||1,dx=NB[3*n]/l,dy=NB[3*n+1]/l,dz=NB[3*n+2]/l;let j=raycast(S,px,py,pz,dx,dy,dz,4*hb[n],null,1e-9),qx,qy,qz;if(j>=0){qx=px+BD*dx;qy=py+BD*dy;qz=pz+BD*dz;}else{j=closest(S,px,py,pz,null,o);qx=o[0];qy=o[1];qz=o[2];nray++;}TX.push(qx,qy,qz);TL[top[n]]=j>=0?FT.patch[j]:-1;}
  const TX0=TX.slice(),mk=new Uint8Array(ntn),fo=new Float64Array(6),fd=i=>nearFeat(S,FT,TX[3*i],TX[3*i+1],TX[3*i+2],fo);let nfe=0,nco=0;if(opt.features!==false&&FT.seg.length){for(const[a,A]of BA)for(const c of A){if(c<a||TH.has(a)||TH.has(c))continue;const ta=top[a],tc=top[c];if(TL[ta]===TL[tc]||TL[ta]<0||TL[tc]<0)continue;const da=fd(ta),dc=fd(tc);if(Math.min(da,dc)<hb[a])mk[da<=dc?ta:tc]=1;}
    const dist=new Float64Array(ntn);for(let i=0;i<ntn;i++)if(mk[i])dist[i]=fd(i);for(let b=0;b<BQ.length;b+=2){const t4=BQ[b].map(n=>top[n]);for(let m=t4.filter(i=>mk[i]);m.length>=3;m=t4.filter(i=>mk[i])){let w=m[0];for(const i of m)if(dist[i]>dist[w])w=i;mk[w]=0;}}
    for(let i=0;i<ntn;i++)if(mk[i]){fd(i);TX[3*i]=fo[0];TX[3*i+1]=fo[1];TX[3*i+2]=fo[2];nfe++;}
    for(const v of FT.corner){let bi=-1,bd2=Infinity;for(let i=0;i<ntn;i++){if(!mk[i])continue;const d=(TX[3*i]-S.V[3*v])**2+(TX[3*i+1]-S.V[3*v+1])**2+(TX[3*i+2]-S.V[3*v+2])**2;if(d<bd2){bd2=d;bi=i;}}if(bi>=0&&bd2<hc*hc){mk[bi]=2;TX[3*bi]=S.V[3*v];TX[3*bi+1]=S.V[3*v+1];TX[3*bi+2]=S.V[3*v+2];nco++;}}}
  const tint=()=>{for(const[n,[m,w]]of TH){let x=0,y=0,z=0;m.forEach((v,i)=>{x+=w[i]*TX[3*top[v]];y+=w[i]*TX[3*top[v]+1];z+=w[i]*TX[3*top[v]+2];});TX[3*top[n]]=x;TX[3*top[n]+1]=y;TX[3*top[n]+2]=z;}};tint();
  const used=new Int32Array(nn0).fill(-1),XO=[],EL=[],cube=[];let nn=0;const rn=n=>{if(used[n]<0){used[n]=nn++;XO.push(X0[3*n],X0[3*n+1],X0[3*n+2]);}return used[n];};
  for(const e of ce){for(let a=0;a<8;a++)EL.push(rn(E0[8*e+a]));cube.push(HZ(lv[leaves[e]]));}for(let n=0;n<nn0;n++)if(isB[n])rn(n);const t0n=nn;for(let i=0;i<ntn;i++)XO.push(0,0,0);for(let n=0;n<nn0;n++)if(isB[n])for(let c=0;c<3;c++)XO[3*(t0n+top[n])+c]=TX[3*top[n]+c];nn+=ntn;
  const nc=ce.length,bf=[];for(let b=0;b<BQ.length;b+=2){const fq=BQ[b];EL.push(...fq.map(rn),...fq.map(n=>t0n+top[n]));cube.push(0);bf.push(6*(nc+b/2)+1);}
  const E=Int32Array.from(EL),XF=Float64Array.from(XO),ne=E.length/8;let nbad=0,nrv=0;for(let p=0;p<(opt.revert??5);p++){nbad=0;let rv=0;for(let e=nc;e<ne;e++){if(hexJac(XF,E,e,true).det>0)continue;nbad++;for(let a=4;a<8;a++){const i=E[8*e+a]-t0n;if(mk[i]){mk[i]=0;rv++;for(let c=0;c<3;c++)TX[3*i+c]=TX0[3*i+c];}}}if(!rv)break;nrv+=rv;tint();XF.set(TX,3*t0n);}
  let nun=0;for(let p=0;p<(opt.untangle??4);p++){const bad=[];for(let e=nc;e<ne;e++)if(hexJac(XF,E,e,false).sj<0.05)bad.push(e);if(!bad.length)break;const inc=new Map();for(const e of bad)for(let a=4;a<8;a++)inc.set(E[8*e+a],[]);for(let e=0;e<ne;e++)for(let a=0;a<8;a++){const l=inc.get(E[8*e+a]);if(l)l.push(e);}const q=n=>{let m=Infinity;for(const e of inc.get(n))m=Math.min(m,hexJac(XF,E,e,false).sj);return m;};let mv=0;
    for(const e of bad)for(let a=4;a<8;a++){const n=E[8*e+a],i=n-t0n;if(i<0||i>=ntn)continue;let cx=0,cy=0,cz=0;for(let b=4;b<8;b++){cx+=XF[3*E[8*e+b]]/4;cy+=XF[3*E[8*e+b]+1]/4;cz+=XF[3*E[8*e+b]+2]/4;}const p0=[XF[3*n],XF[3*n+1],XF[3*n+2]],q0=q(n);for(const w of[0.5,0.25]){closest(S,(1-w)*p0[0]+w*cx,(1-w)*p0[1]+w*cy,(1-w)*p0[2]+w*cz,null,fo);XF[3*n]=fo[0];XF[3*n+1]=fo[1];XF[3*n+2]=fo[2];if(q(n)>q0+1e-6){TX[3*i]=fo[0];TX[3*i+1]=fo[1];TX[3*i+2]=fo[2];mv++;break;}XF[3*n]=p0[0];XF[3*n+1]=p0[1];XF[3*n+2]=p0[2];}}
    if(!mv)break;nun+=mv;tint();XF.set(TX,3*t0n);}
  const hn=[],hm=[],hw=[],HK=8,pushH=(n,m,w)=>{hn.push(n);for(let j=0;j<HK;j++){hm.push(j<m.length?m[j]:-1);hw.push(j<m.length?w[j]:0);}};let hdrop=0;for(const[n,[m,w]]of H)used[n]>=0&&m.length<=HK&&m.every(v=>used[v]>=0)?pushH(used[n],m.map(v=>used[v]),w):hdrop++;for(const[n,[m,w]]of TH)m.length<=HK?pushH(t0n+top[n],m.map(v=>t0n+top[v]),w):hdrop++;
  const CB=Float64Array.from(cube),nsm=smoothNear(XF,E,nc,t0n,hn,hm,hw,CB,opt.vsmooth??4,HK);
  const M={X:XF,E,bf:Int32Array.from(bf)};M.ff=tagFacets(S,XF,E,M.bf);
  const hAt=(x,y,z)=>{for(let l=Lmax;l>=0;l--){const h=HZ(l),q=idx.get(key(l,Math.floor((x-o0[0])/h),Math.floor((y-o0[1])/h),Math.floor((z-o0[2])/h)));if(q!==undefined)return h;}return hc;},TR=[];let At=0;
  for(let t=0;t<nt;t++){if(!isFinite(th[t])||!(S.Ar[t]>0))continue;const e=Math.min(th[t]/2,hsm/4);TR.push([th[t]/hAt(S.C[3*t]-S.N[3*t]*e,S.C[3*t+1]-S.N[3*t+1]*e,S.C[3*t+2]-S.N[3*t+2]*e),S.Ar[t],th[t]]);At+=S.Ar[t];}
  TR.sort((a,b)=>a[0]-b[0]);let acc=0,thr=TR.length?TR[0][0]:null;for(const r of TR){acc+=r[1];if(acc>=0.02*At){thr=r[0];break;}}let tmin=Infinity;for(const r of TR)tmin=Math.min(tmin,r[2]);
  let hmn=Infinity,lmin=99,lmax=0;for(const q of leaves){hmn=Math.min(hmn,HZ(lv[q]));lmin=Math.min(lmin,lv[q]);lmax=Math.max(lmax,lv[q]);}
  return{...M,kind:'hex8',type:'adaptive',hang:hn.length?{node:Int32Array.from(hn),m:Int32Array.from(hm),w:Float64Array.from(hw),k:HK}:null,cube:CB,through:thr,tMin:tmin,size:{h0:hc,hmin:hmn},levels:[lmin,lmax],info:{leaves:leaves.length,boundary:nbd,coreRefined:nref,core:nc,pillow:ne-nc,rayMiss:nray,smoothed:nsm,featNodes:nfe,cornerNodes:nco,featReverted:nrv,untangled:nun,badPillow:nbad,hanging:hn.length,hangDropped:hdrop}};
}
