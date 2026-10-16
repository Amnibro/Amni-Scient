import {gpuSolve,gpuContext} from './fea_gpu.js';
import {KCOND,condK} from './thermal_data.js';
export {KCOND};
const NODES=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
function dmat(nu){const c=1/((1+nu)*(1-2*nu)),a=c*(1-nu),b=c*nu,g=c*(1-2*nu)/2;return[[a,b,b,0,0,0],[b,a,b,0,0,0],[b,b,a,0,0,0],[0,0,0,g,0,0],[0,0,0,0,g,0],[0,0,0,0,0,g]];}
function bAt(xi,et,ze){
  const B=Array.from({length:6},()=>new Float64Array(24)),Ba=Array.from({length:6},()=>new Float64Array(9));
  for(let i=0;i<8;i++){const[a,b,c]=NODES[i],dx=a*(1+b*et)*(1+c*ze)/4,dy=b*(1+a*xi)*(1+c*ze)/4,dz=c*(1+a*xi)*(1+b*et)/4;
    B[0][3*i]=dx;B[1][3*i+1]=dy;B[2][3*i+2]=dz;B[3][3*i]=dy;B[3][3*i+1]=dx;B[4][3*i+1]=dz;B[4][3*i+2]=dy;B[5][3*i]=dz;B[5][3*i+2]=dx;}
  const dp=[-4*xi,-4*et,-4*ze];
  for(let m=0;m<3;m++){const g=[0,0,0];g[m]=dp[m];for(let c=0;c<3;c++){const k=3*m+c,[gx,gy,gz]=g;if(c===0){Ba[0][k]+=gx;Ba[3][k]+=gy;Ba[5][k]+=gz;}if(c===1){Ba[1][k]+=gy;Ba[3][k]+=gx;Ba[4][k]+=gz;}if(c===2){Ba[2][k]+=gz;Ba[4][k]+=gy;Ba[5][k]+=gx;}}}
  return{B,Ba};
}
function inv(M){const n=M.length,A=M.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];const d=A[i][i];for(let j=0;j<2*n;j++)A[i][j]/=d;for(let r=0;r<n;r++)if(r!==i){const f=A[r][i];if(f)for(let j=0;j<2*n;j++)A[r][j]-=f*A[i][j];}}return A.map(r=>r.slice(n));}
export function keHex(nu){
  const D=dmat(nu),g=1/Math.sqrt(3),Kuu=Array.from({length:24},()=>new Float64Array(24)),Kua=Array.from({length:24},()=>new Float64Array(9)),Kaa=Array.from({length:9},()=>new Float64Array(9)),w=1/8;
  for(const xi of[-g,g])for(const et of[-g,g])for(const ze of[-g,g]){
    const{B,Ba}=bAt(xi,et,ze),DB=B.map((_,r)=>new Float64Array(24)),DBa=Ba.map(()=>new Float64Array(9));
    for(let r=0;r<6;r++)for(let k=0;k<6;k++){const d=D[r][k];if(!d)continue;for(let j=0;j<24;j++)DB[r][j]+=d*B[k][j];for(let j=0;j<9;j++)DBa[r][j]+=d*Ba[k][j];}
    for(let i=0;i<24;i++)for(let r=0;r<6;r++){const b=B[r][i];if(!b)continue;for(let j=0;j<24;j++)Kuu[i][j]+=w*b*DB[r][j];for(let j=0;j<9;j++)Kua[i][j]+=w*b*DBa[r][j];}
    for(let i=0;i<9;i++)for(let r=0;r<6;r++){const b=Ba[r][i];if(!b)continue;for(let j=0;j<9;j++)Kaa[i][j]+=w*b*DBa[r][j];}
  }
  const Ki=inv(Kaa.map(r=>[...r])),K=new Float64Array(576);
  for(let i=0;i<24;i++)for(let j=0;j<24;j++){let s=Kuu[i][j];for(let a=0;a<9;a++){let t=0;for(let b=0;b<9;b++)t+=Ki[a][b]*Kua[j][b];s-=Kua[i][a]*t;}K[i*24+j]=s;}
  for(let i=0;i<24;i++)for(let j=0;j<i;j++){const m=(K[i*24+j]+K[j*24+i])/2;K[i*24+j]=K[j*24+i]=m;}
  return K;
}
export function bCenter(nu){const{B}=bAt(0,0,0),D=dmat(nu);const DB=Array.from({length:6},()=>new Float64Array(24));for(let r=0;r<6;r++)for(let k=0;k<6;k++)for(let j=0;j<24;j++)DB[r][j]+=D[r][k]*B[k][j];return DB;}
export function voxelize(pos,idx,bb,h,triMask){
  const ox=bb.min[0]-h*0.5,oy=bb.min[1]-h*0.5,oz=bb.min[2]-h*0.5,nx=Math.max(1,Math.ceil((bb.max[0]-ox)/h+0.5)),ny=Math.max(1,Math.ceil((bb.max[1]-oy)/h+0.5)),nz=Math.max(1,Math.ceil((bb.max[2]-oz)/h+0.5));
  const solid=new Uint8Array(nx*ny*nz),nt=idx.length/3,bins=new Map();
  for(let t=0;t<nt;t++){
    const a=idx[3*t]*3,b=idx[3*t+1]*3,c=idx[3*t+2]*3;
    const x0=Math.min(pos[a],pos[b],pos[c]),x1=Math.max(pos[a],pos[b],pos[c]),y0=Math.min(pos[a+1],pos[b+1],pos[c+1]),y1=Math.max(pos[a+1],pos[b+1],pos[c+1]);
    const i0=Math.max(0,Math.floor((x0-ox)/h-0.5)),i1=Math.min(nx-1,Math.ceil((x1-ox)/h-0.5)),j0=Math.max(0,Math.floor((y0-oy)/h-0.5)),j1=Math.min(ny-1,Math.ceil((y1-oy)/h-0.5));
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i*ny+j;let l=bins.get(k);if(!l)bins.set(k,l=[]);l.push(t);}
  }
  const SS=3,frac=new Float32Array(nx*ny*nz),zs=[];
  for(const[k,l]of bins){
    const i=Math.floor(k/ny),j=k%ny;
    for(let si=0;si<SS;si++)for(let sj=0;sj<SS;sj++){
      const px=ox+(i+(si+0.5)/SS)*h+h*1.37e-5,py=oy+(j+(sj+0.5)/SS)*h+h*2.91e-5;zs.length=0;
      for(const t of l){
        const a=idx[3*t]*3,b=idx[3*t+1]*3,c=idx[3*t+2]*3,ax=pos[a],ay=pos[a+1],bx=pos[b],by=pos[b+1],cx=pos[c],cy=pos[c+1];
        const d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(d)<1e-18)continue;
        const l1=((by-cy)*(px-cx)+(cx-bx)*(py-cy))/d,l2=((cy-ay)*(px-cx)+(ax-cx)*(py-cy))/d,l3=1-l1-l2;
        if(l1<0||l2<0||l3<0)continue;
        zs.push(l1*pos[a+2]+l2*pos[b+2]+l3*pos[c+2]);
      }
      if(zs.length<2)continue;zs.sort((p,q)=>p-q);
      for(let s=0;s+1<zs.length;s+=2){const z0=(zs[s]-oz)/h,z1=(zs[s+1]-oz)/h,k0=Math.max(0,Math.floor(z0)),k1=Math.min(nz-1,Math.floor(z1));for(let kk=k0;kk<=k1;kk++){const cov=Math.min(z1,kk+1)-Math.max(z0,kk);if(cov>0)frac[(kk*ny+j)*nx+i]+=cov/(SS*SS);}}
    }
  }
  for(let e=0;e<frac.length;e++){const f=Math.min(1,frac[e]);frac[e]=f;if(f>=0.12)solid[e]=1;}
  return{nx,ny,nz,ox,oy,oz,h,solid,frac};
}
export function keHeat(){const g=1/Math.sqrt(3),K=new Float64Array(64);for(const xi of[-g,g])for(const et of[-g,g])for(const ze of[-g,g]){const D=NODES.map(([a,b,c])=>[a*(1+b*et)*(1+c*ze)/4,b*(1+a*xi)*(1+c*ze)/4,c*(1+a*xi)*(1+b*et)/4]);for(let a=0;a<8;a++)for(let b=0;b<8;b++)K[a*8+b]+=(D[a][0]*D[b][0]+D[a][1]*D[b][1]+D[a][2]*D[b][2])/8;}return K;}
function densOf(G){const d=new Float32Array(G.nx*G.ny*G.nz);for(let e=0;e<d.length;e++)d[e]=G.solid[e]?Math.max(G.frac[e],0.12):0;return d;}
function makeLevel(nx,ny,nz,dens,nd){
  const NX=nx+1,NY=ny+1,NZ=nz+1,nn=NX*NY*NZ,els=[],sc=[];
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const e=(k*ny+j)*nx+i;if(dens[e]>0){els.push(e);sc.push(dens[e]);}}
  const E=new Int32Array(els.length*8);
  for(let q=0;q<els.length;q++){const e=els[q],i=e%nx,j=Math.floor(e/nx)%ny,k=Math.floor(e/(nx*ny)),n0=(k*NY+j)*NX+i;E.set([n0,n0+1,n0+NX+1,n0+NX,n0+NX*NY,n0+NX*NY+1,n0+NX*NY+NX+1,n0+NX*NY+NX],q*8);}
  return{nx,ny,nz,NX,NY,NZ,nn,E,sc:new Float64Array(sc),dens,nd};
}
function matvec(L,K,x,y,raw){
  const nd=L.nd,m=8*nd,mm=m*m,E=L.E,sc=L.sc,ne=sc.length,ue=new Float64Array(m),KE=L.KE;y.fill(0);
  for(let q=0;q<ne;q++){
    const o=q*8,s=KE?1:sc[q],Kq=KE?KE.subarray(q*mm,q*mm+mm):K;
    if(nd===3){for(let a=0;a<8;a++){const n=E[o+a]*3;ue[3*a]=x[n];ue[3*a+1]=x[n+1];ue[3*a+2]=x[n+2];}for(let a=0;a<8;a++){const n=E[o+a]*3;for(let c=0;c<3;c++){const r=(3*a+c)*24;let t=0;for(let j=0;j<24;j++)t+=Kq[r+j]*ue[j];y[n+c]+=s*t;}}continue;}
    for(let a=0;a<8;a++)ue[a]=x[E[o+a]];
    for(let a=0;a<8;a++){const r=a*8;let t=0;for(let j=0;j<8;j++)t+=Kq[r+j]*ue[j];y[E[o+a]]+=s*t;}
  }
  const da=L.dadd;if(da)for(let i=0;i<y.length;i++)y[i]+=da[i]*x[i];
  if(!raw){const f=L.fixed;for(let i=0;i<y.length;i++)if(f[i])y[i]=x[i];}
}
const LN=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
function childW(di,dj,dk){const W=new Float64Array(64);for(let a=0;a<8;a++){const u=[(di+LN[a][0])/2,(dj+LN[a][1])/2,(dk+LN[a][2])/2];for(let b=0;b<8;b++)W[a*8+b]=(LN[b][0]?u[0]:1-u[0])*(LN[b][1]?u[1]:1-u[1])*(LN[b][2]?u[2]:1-u[2]);}return W;}
const CW=[];for(let c=0;c<8;c++)CW.push(childW(c&1,(c>>1)&1,(c>>2)&1));
function galerkin(Kf,W,out,scale,nd){const m=8*nd,T=new Float64Array(m*m);for(let pi=0;pi<m;pi++)for(let b=0;b<8;b++)for(let j=0;j<nd;j++){let t=0;for(let q=0;q<8;q++){const w=W[q*8+b];if(w)t+=Kf[pi*m+nd*q+j]*w;}T[pi*m+nd*b+j]=t;}for(let a=0;a<8;a++)for(let i=0;i<nd;i++){const r=(nd*a+i)*m;for(let p=0;p<8;p++){const w=W[p*8+a];if(!w)continue;const rr=(nd*p+i)*m;for(let k=0;k<m;k++)out[r+k]+=scale*w*T[rr+k];}}}
function coarsen(F,K,MC){
  const nd=F.nd,m=8*nd,mm=m*m,nx=Math.ceil(F.nx/2),ny=Math.ceil(F.ny/2),nz=Math.ceil(F.nz/2),NX=nx+1,NY=ny+1,NZ=nz+1,nn=NX*NY*NZ,emap=new Int32Array(F.nx*F.ny*F.nz).fill(-1);
  const fne=F.sc.length;for(let q=0;q<fne;q++){const n0=F.E[q*8],i=n0%F.NX,j=Math.floor(n0/F.NX)%F.NY,k=Math.floor(n0/(F.NX*F.NY));emap[(k*F.ny+j)*F.nx+i]=q;}
  const cells=new Map();for(let k=0;k<F.nz;k++)for(let j=0;j<F.ny;j++)for(let i=0;i<F.nx;i++){const q=emap[(k*F.ny+j)*F.nx+i];if(q<0)continue;const ce=((k>>1)*ny+(j>>1))*nx+(i>>1);let l=cells.get(ce);if(!l)cells.set(ce,l=[]);l.push([q,(i&1)|((j&1)<<1)|((k&1)<<2)]);}
  const ids=[...cells.keys()].sort((a,b)=>a-b),ne=ids.length,E=new Int32Array(ne*8),KE=new Float32Array(ne*mm),acc=new Float64Array(mm),Km=new Float64Array(mm),fm=F.fixed;
  for(let e=0;e<ne;e++){const ce=ids[e],i=ce%nx,j=Math.floor(ce/nx)%ny,k=Math.floor(ce/(nx*ny)),n0=(k*NY+j)*NX+i;E.set([n0,n0+1,n0+NX+1,n0+NX,n0+NX*NY,n0+NX*NY+1,n0+NX*NY+NX+1,n0+NX*NY+NX],e*8);acc.fill(0);
    for(const[q,c]of cells.get(ce)){
      if(F.KE){galerkin(F.KE.subarray(q*mm,q*mm+mm),CW[c],acc,1,nd);continue;}
      let masked=false;for(let a=0;a<8&&!masked;a++){const d0=F.E[q*8+a]*nd;for(let cc=0;cc<nd;cc++)if(fm[d0+cc])masked=true;}
      const s=F.sc[q];if(!masked){const M=MC[c];for(let t=0;t<mm;t++)acc[t]+=s*M[t];continue;}
      Km.set(K);for(let a=0;a<8;a++){const d0=F.E[q*8+a]*nd;for(let cc=0;cc<nd;cc++)if(fm[d0+cc]){const r=nd*a+cc;for(let t=0;t<m;t++){Km[r*m+t]=0;Km[t*m+r]=0;}}}galerkin(Km,CW[c],acc,s,nd);}
    KE.set(acc,e*mm);}
  const L={nx,ny,nz,NX,NY,NZ,nn,E,sc:new Float64Array(ne).fill(1),KE,nd,fixed:new Uint8Array(nn*nd)};
  if(F.dadd){L.dadd=new Float64Array(nn*nd);transfer(F,L,F.dadd,L.dadd,false);}
  return L;
}
function diagOf(L,K){const nd=L.nd,m=8*nd,mm=m*m,d=new Float64Array(L.nn*nd),E=L.E,sc=L.sc,KE=L.KE;for(let q=0;q<sc.length;q++)for(let a=0;a<8;a++){const n=E[q*8+a]*nd;for(let c=0;c<nd;c++)d[n+c]+=KE?KE[q*mm+(nd*a+c)*(m+1)]:sc[q]*K[(nd*a+c)*(m+1)];}if(L.dadd)for(let i=0;i<d.length;i++)d[i]+=L.dadd[i];for(let i=0;i<d.length;i++)if(Math.abs(d[i])<1e-12*K[0])d[i]=0;for(let i=0;i<d.length;i++)if(L.fixed[i]||d[i]===0){d[i]=1;L.fixed[i]=1;}return d;}
function tmap(NF,NC){const a0=new Int32Array(NF),a1=new Int32Array(NF),w=new Float64Array(NF);for(let i=0;i<NF;i++){a0[i]=i>>1;a1[i]=Math.min((i>>1)+(i&1),NC-1);w[i]=i&1?0.5:1;}return{a0,a1,w};}
function maps(Lf,Lc){return Lf.mp||(Lf.mp=[tmap(Lf.NX,Lc.NX),tmap(Lf.NY,Lc.NY),tmap(Lf.NZ,Lc.NZ)]);}
function transfer(Lf,Lc,xf,xc,up){
  const nd=Lf.nd,[mx,my,mz]=maps(Lf,Lc),{NX,NY,NZ}=Lf,cX=Lc.NX,cY=Lc.NY,mf=Lf.fixed;
  if(up)xf.fill(0);else xc.fill(0);
  for(let k=0;k<NZ;k++){const nk=k&1?2:1;
    for(let j=0;j<NY;j++){const nj=j&1?2:1;
      for(let i=0;i<NX;i++){const ni=i&1?2:1,f=((k*NY+j)*NX+i)*nd;
        if(!up){let z=true;for(let c=0;c<nd;c++)if(xf[f+c])z=false;if(z)continue;}
        for(let a=0;a<nk;a++){const kk=a?mz.a1[k]:mz.a0[k],wk=mz.w[k];
          for(let b=0;b<nj;b++){const jj=b?my.a1[j]:my.a0[j],wj=wk*my.w[j];
            for(let c=0;c<ni;c++){const ii=c?mx.a1[i]:mx.a0[i],w=wj*mx.w[i],q=((kk*cY+jj)*cX+ii)*nd;
              for(let t=0;t<nd;t++)up?xf[f+t]+=w*xc[q+t]:mf[f+t]||(xc[q+t]+=w*xf[f+t]);
            }}}
      }}}
  if(up){for(let i=0;i<xf.length;i++)if(mf[i])xf[i]=0;}else{const mc=Lc.fixed;for(let i=0;i<xc.length;i++)if(mc[i])xc[i]=0;}
}
function prolong(Lc,Lf,xc,xf){transfer(Lf,Lc,xf,xc,true);}
function restrict(Lf,Lc,rf,rc){transfer(Lf,Lc,rf,rc,false);}
function smooth(L,K,b,x,iters,tmp){const om=L.om||0.5;for(let s=0;s<iters;s++){matvec(L,K,x,tmp);for(let i=0;i<x.length;i++)x[i]+=om*(b[i]-tmp[i])/L.diag[i];}}
function lamMax(L,K){const n=L.nn*L.nd;let x=new Float64Array(n),y=new Float64Array(n),lam=1;let seed=12345;for(let i=0;i<n;i++){seed=(seed*1103515245+12345)&0x7fffffff;x[i]=L.fixed[i]?0:seed/0x7fffffff-0.5;}for(let it=0;it<14;it++){matvec(L,K,x,y);let num=0,den=0;for(let i=0;i<n;i++){if(L.fixed[i]){y[i]=0;continue;}y[i]/=L.diag[i];num+=y[i]*y[i]*L.diag[i];den+=x[i]*y[i]*L.diag[i];}lam=num/Math.max(den,1e-300);let nr=0;for(let i=0;i<n;i++)nr+=y[i]*y[i];nr=Math.sqrt(nr)||1;for(let i=0;i<n;i++)x[i]=y[i]/nr;}return lam;}
let NSW=1;export function setSweeps(n){NSW=n;}
const omOf=(L,K)=>Math.min(0.8,1.15/(lamMax(L,K)*1.05));
function vcycle(Ls,K,l,b,x){
  const L=Ls[l];x.fill(0);
  if(l===Ls.length-1){smooth(L,K,b,x,40,L.t1);return;}
  smooth(L,K,b,x,NSW,L.t1);
  matvec(L,K,x,L.t1);for(let i=0;i<b.length;i++)L.t2[i]=b[i]-L.t1[i];
  const C=Ls[l+1];restrict(L,C,L.t2,C.b);vcycle(Ls,K,l+1,C.b,C.x);prolong(C,L,C.x,L.t2);
  for(let i=0;i<x.length;i++)x[i]+=L.t2[i];
  smooth(L,K,b,x,NSW,L.t1);
}
function setup(G,K,nd,fixed,dadd,mg,lazy){
  const Ls=[makeLevel(G.nx,G.ny,G.nz,densOf(G),nd)],mm=64*nd*nd;Ls[0].fixed=fixed;Ls[0].dadd=dadd||null;
  const MC=CW.map(W=>{const o=new Float64Array(mm);galerkin(K,W,o,1,nd);return o;});
  while(Ls.length<7&&mg!==false){const F=Ls[Ls.length-1];if(F.sc.length<400||Math.min(F.nx,F.ny,F.nz)<2)break;Ls.push(coarsen(F,K,MC));}
  for(const L of Ls){const n=L.nn*nd;L.diag=diagOf(L,K);L.t1=new Float64Array(n);L.t2=new Float64Array(n);L.b=new Float64Array(n);L.x=new Float64Array(n);}
  if(Ls.length>1&&mg!==false)for(const L of Ls)if(!(lazy&&L===Ls[0]))L.om=omOf(L,K);
  return Ls;
}
const nrm=v=>{let s=0;for(let i=0;i<v.length;i++)s+=v[i]*v[i];return Math.sqrt(s);};
function pcg(Ls,K,f,opt,prog){
  const L=Ls[0],n=f.length,u=new Float64Array(n),r=f.slice(),z=new Float64Array(n),p=new Float64Array(n),Ap=new Float64Array(n),useMG=Ls.length>1,pre=(rr,zz)=>{if(useMG)vcycle(Ls,K,0,rr,zz);else for(let i=0;i<n;i++)zz[i]=rr[i]/L.diag[i];};
  pre(r,z);p.set(z);let rz=0;for(let i=0;i<n;i++)rz+=r[i]*z[i];
  const fn=nrm(f)||1,tol=opt.tol||1e-6,maxIt=opt.maxIt||(useMG?400:6000);let it=0,rel=1;
  for(;it<maxIt;it++){
    matvec(L,K,p,Ap);let pAp=0;for(let i=0;i<n;i++)pAp+=p[i]*Ap[i];
    if(!(pAp>0))break;const al=rz/pAp;let rr=0;
    for(let i=0;i<n;i++){u[i]+=al*p[i];r[i]-=al*Ap[i];rr+=r[i]*r[i];}
    rel=Math.sqrt(rr)/fn;if(prog&&it%5===0)prog(it,rel,opt.phase||'solve');if(rel<tol)break;
    pre(r,z);let rz2=0;for(let i=0;i<n;i++)rz2+=r[i]*z[i];const be=rz2/rz;rz=rz2;for(let i=0;i<n;i++)p[i]=z[i]+be*p[i];
  }
  return{u,iters:it,rel};
}
async function solve(Ls,K,f,opt={},prog){
  const L=Ls[0],n=L.nn*L.nd,b=new Float64Array(n),want=opt.solver||'auto';for(let i=0;i<n;i++)b[i]=L.fixed[i]?0:f[i]||0;let gpuError;
  if(L.nd===3&&want!=='cpu'&&(want==='gpu'||L.sc.length>(opt.gpuMin||15000)))try{const r=await gpuSolve(Ls,K,b,{tol:opt.tol||1e-6,maxIt:opt.maxIt,nsw:NSW,mv:(x,y)=>matvec(L,K,x,y)},prog);if(r)return{...r,backend:'gpu'};gpuError='WebGPU unavailable';}catch(e){gpuError=String(e.message||e);}
  if(Ls.length>1&&!(L.om>0))L.om=omOf(L,K);
  return{...pcg(Ls,K,b,opt,prog),backend:'cpu',gpuError};
}
export async function solveGrid(G,mat,dof,force,opt={},prog){
  const K=keHex(mat.nu),Eh=mat.E*G.h;for(let i=0;i<576;i++)K[i]*=Eh;
  const Ls=setup(G,K,3,dof,null,opt.mg,opt.solver!=='cpu'),S=await solve(Ls,K,force,opt,prog),L=Ls[0],u=S.u;
  const DB=bCenter(mat.nu),ne=L.sc.length,vm=new Float32Array(ne),sig=new Float32Array(ne*6),ue=new Float64Array(24),s=mat.E/G.h;
  for(let q=0;q<ne;q++){
    for(let a=0;a<8;a++){const nd=L.E[q*8+a]*3;ue[3*a]=u[nd];ue[3*a+1]=u[nd+1];ue[3*a+2]=u[nd+2];}
    const S6=[0,0,0,0,0,0];for(let r2=0;r2<6;r2++){let t=0;for(let j=0;j<24;j++)t+=DB[r2][j]*ue[j];S6[r2]=t*s;}
    sig.set(S6,q*6);vm[q]=Math.sqrt(0.5*((S6[0]-S6[1])**2+(S6[1]-S6[2])**2+(S6[2]-S6[0])**2)+3*(S6[3]**2+S6[4]**2+S6[5]**2));
  }
  return{...S,vm,sig,levels:Ls.length,L0:L};
}
export function nodalField(G,L,elemVal){
  const v=new Float32Array(L.nn),c=new Uint16Array(L.nn);
  for(let q=0;q<L.sc.length;q++)for(let a=0;a<8;a++){const n=L.E[q*8+a];v[n]+=elemVal?elemVal[q]:0;c[n]++;}
  for(let i=0;i<L.nn;i++)if(c[i])v[i]/=c[i];
  return{v,c};
}
export function sampleAt(G,L,arr,stride,x,y,z,out,cnt){
  const fx=(x-G.ox)/G.h,fy=(y-G.oy)/G.h,fz=(z-G.oz)/G.h,i=Math.min(G.nx-1,Math.max(0,Math.floor(fx))),j=Math.min(G.ny-1,Math.max(0,Math.floor(fy))),k=Math.min(G.nz-1,Math.max(0,Math.floor(fz))),tx=Math.min(1,Math.max(0,fx-i)),ty=Math.min(1,Math.max(0,fy-j)),tz=Math.min(1,Math.max(0,fz-k));
  for(let c=0;c<stride;c++)out[c]=0;let ws=0;
  for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const n=((k+dz)*L.NY+(j+dy))*L.NX+(i+dx);if(cnt&&!cnt[n])continue;const w=(dx?tx:1-tx)*(dy?ty:1-ty)*(dz?tz:1-tz);ws+=w;for(let c=0;c<stride;c++)out[c]+=w*arr[n*stride+c];}
  if(ws>1e-9)for(let c=0;c<stride;c++)out[c]/=ws;
  return ws;
}
function atVerts(G,L,arr,stride,pos,cnt){const nv=pos.length/3,o=new Float32Array(nv*stride),t=new Float64Array(stride);for(let q=0;q<nv;q++){sampleAt(G,L,arr,stride,pos[3*q],pos[3*q+1],pos[3*q+2],t,cnt);for(let c=0;c<stride;c++)o[q*stride+c]=t[c];}return o;}
function dilate(G,cnt,fs){const NX=G.nx+1,NY=G.ny+1,NZ=G.nz+1,ok=new Uint8Array(NX*NY*NZ);for(let n=0;n<ok.length;n++)ok[n]=cnt[n]?1:0;for(let pass=0;pass<2;pass++){const nk=ok.slice();for(let k=0;k<NZ;k++)for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const n=(k*NY+j)*NX+i;if(ok[n])continue;const s=fs.map(()=>0);let c=0;for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const a2=i+di,b2=j+dj,c2=k+dk;if(a2<0||b2<0||c2<0||a2>=NX||b2>=NY||c2>=NZ)continue;const m2=(c2*NY+b2)*NX+a2;if(ok[m2]){for(let t=0;t<fs.length;t++)s[t]+=fs[t][m2];c++;}}if(c){for(let t=0;t<fs.length;t++)fs[t][n]=s[t]/c;nk[n]=1;}}ok.set(nk);}return fs;}
function activeNodeMask(G){const NX=G.nx+1,NY=G.ny+1,m=new Uint8Array(NX*NY*(G.nz+1));for(let k=0;k<G.nz;k++)for(let j=0;j<G.ny;j++)for(let i=0;i<G.nx;i++)if(G.solid[(k*G.ny+j)*G.nx+i])for(let d=0;d<8;d++)m[((k+(d>>2))*NY+(j+((d>>1)&1)))*NX+i+(d&1)]=1;return m;}
function nearestActive(G,mask,x,y,z){
  const NX=G.nx+1,NY=G.ny+1,NZ=G.nz+1,fi=(x-G.ox)/G.h,fj=(y-G.oy)/G.h,fk=(z-G.oz)/G.h,i=Math.round(fi),j=Math.round(fj),k=Math.round(fk);let best=-1,bd=1e9;
  for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const a=i+di,b=j+dj,c=k+dk;if(a<0||b<0||c<0||a>=NX||b>=NY||c>=NZ)continue;const n=(c*NY+b)*NX+a;if(!mask[n])continue;const d=(a-fi)**2+(b-fj)**2+(c-fk)**2;if(d<bd){bd=d;best=n;}}
  return bd<=2.3?best:-1;
}
function sampleTris(pos,idx,tris,h,cb){
  for(const t of tris){
    const a=idx[3*t]*3,b=idx[3*t+1]*3,c=idx[3*t+2]*3,A=[pos[a],pos[a+1],pos[a+2]],B=[pos[b],pos[b+1],pos[b+2]],C=[pos[c],pos[c+1],pos[c+2]];
    const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[C[0]-A[0],C[1]-A[1],C[2]-A[2]],cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]],ar=Math.hypot(...cr)/2;if(ar<=0)continue;
    const nrm=cr.map(v=>v/(2*ar)),m=Math.max(1,Math.ceil(Math.sqrt(ar)/(h*0.35))),pts=[];
    for(let i=0;i<m;i++)for(let j=0;j<m-i;j++){const u=(i+1/3)/m,v=(j+1/3)/m;if(u+v>1)continue;pts.push([A[0]+u*e1[0]+v*e2[0],A[1]+u*e1[1]+v*e2[1],A[2]+u*e1[2]+v*e2[2]]);}
    for(const p of pts)cb(p,ar/pts.length,nrm);
  }
}
export function prep(inp,def){
  const{pos,idx,groups,bbox,volume,res}=inp,target=Math.max(2000,Math.min(res||def,800000)),h=Math.cbrt(Math.max(volume,1e-9)/target),G=voxelize(pos,idx,bbox,h);
  let nAct=0;for(const v of G.solid)nAct+=v;if(nAct<8)throw new Error('part too thin for this resolution, raise resolution');
  const mask=activeNodeMask(G),NX=G.nx+1,NY=G.ny+1,NZ=G.nz+1,nn=NX*NY*NZ,dens=densOf(G),vol=new Float64Array(nn),h3=h*h*h/8;
  for(let k=0;k<G.nz;k++)for(let j=0;j<G.ny;j++)for(let i=0;i<G.nx;i++){const w=dens[(k*G.ny+j)*G.nx+i]*h3;if(w)for(let d=0;d<8;d++)vol[((k+(d>>2))*NY+(j+((d>>1)&1)))*NX+i+(d&1)]+=w;}
  const trisOf=ids=>{const out=[];for(const g of groups)if(ids.includes(g[2]))for(let t=g[0]/3;t<(g[0]+g[1])/3;t++)out.push(t);return out;};
  const at=ids=>{const acc=new Map();sampleTris(pos,idx,trisOf(ids||[]),h,(p,w,nr)=>{const n=nearestActive(G,mask,...p);if(n<0)return;const v=acc.get(n)||[0,0,0,0];v[0]+=w;v[1]+=w*nr[0];v[2]+=w*nr[1];v[3]+=w*nr[2];acc.set(n,v);});return acc;};
  const xyz=n=>[G.ox+(n%NX)*h,G.oy+(Math.floor(n/NX)%NY)*h,G.oz+Math.floor(n/(NX*NY))*h];
  return{G,h,nAct,nn,NX,NY,NZ,at,xyz,vol,pos};
}
function supportMask(inp,P){
  const dof=new Uint8Array(P.nn*3),sup=[...(inp.fixed&&inp.fixed.length?[{faces:inp.fixed,type:'fixed'}]:[]),...(inp.supports||[])];
  for(const s of sup)for(const[n,v]of P.at(s.faces)){const roll=s.type==='roller'||s.type==='slider',a=Math.abs(v[1])>=Math.abs(v[2])&&Math.abs(v[1])>=Math.abs(v[3])?0:Math.abs(v[2])>=Math.abs(v[3])?1:2;if(roll)dof[3*n+a]=1;else dof[3*n]=dof[3*n+1]=dof[3*n+2]=1;}
  return dof;
}
function loadVec(inp,P,mat){
  const f=new Float64Array(P.nn*3),ap=[0,0,0],add=(n,F)=>{for(let c=0;c<3;c++){f[3*n+c]+=F[c];ap[c]+=F[c];}};
  for(const ld of inp.loads||[]){
    const acc=P.at(ld.faces);let tot=0;for(const v of acc.values())tot+=v[0];if(!tot)continue;
    if(ld.M){const M=ld.M,c=[0,0,0];for(const[n,v]of acc){const x=P.xyz(n);for(let k=0;k<3;k++)c[k]+=v[0]*x[k]/tot;}const mn=Math.hypot(...M)||1,m=M.map(q=>q/mn),rp=new Map();let J=0;
      for(const[n,v]of acc){const x=P.xyz(n),r=[x[0]-c[0],x[1]-c[1],x[2]-c[2]],d=r[0]*m[0]+r[1]*m[1]+r[2]*m[2],q=[r[0]-d*m[0],r[1]-d*m[1],r[2]-d*m[2]];J+=v[0]*(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]);rp.set(n,q);}
      if(J>0)for(const[n,v]of acc){const q=rp.get(n),s=v[0]/J;add(n,[(M[1]*q[2]-M[2]*q[1])*s,(M[2]*q[0]-M[0]*q[2])*s,(M[0]*q[1]-M[1]*q[0])*s]);}}
    else for(const[n,v]of acc)add(n,ld.p?[-ld.p*v[1],-ld.p*v[2],-ld.p*v[3]]:[ld.F[0]*v[0]/tot,ld.F[1]*v[0]/tot,ld.F[2]*v[0]/tot]);
  }
  const g=inp.accel||(mat.g?mat.g.map(v=>v*9.80665):null);
  if(g&&mat.rho){const k=mat.rho*1e-9;for(let n=0;n<P.nn;n++)if(P.vol[n])add(n,[g[0]*k*P.vol[n],g[1]*k*P.vol[n],g[2]*k*P.vol[n]]);}
  return{f,ap};
}
function gridOut(P){const G=P.G;return{h:P.h,nEl:P.nAct,grid:{nx:G.nx,ny:G.ny,nz:G.nz}};}
function fieldOut(P,fs){const G=P.G;return{o:[G.ox,G.oy,G.oz],h:G.h,n:[P.NX,P.NY,P.NZ],...fs};}
async function statik(inp,P,prog){
  const{G,pos}=P,mat=inp.mat,dof=supportMask(inp,P);if(!dof.some(v=>v))throw new Error('add at least one fixed face');
  const{f,ap}=loadVec(inp,P,mat),t0=Date.now(),S=await solveGrid(G,mat,dof,f,{tol:inp.tol||1e-6,mg:inp.mg,solver:inp.solver,gpuMin:inp.gpuMin},prog),ms=Date.now()-t0;
  const{v:vmN,c:cnt}=nodalField(G,S.L0,S.vm),vStress=atVerts(G,S.L0,vmN,1,pos,cnt),vDisp=atVerts(G,S.L0,new Float32Array(S.u),3,pos,cnt);
  const nnod=P.nn,fVm=new Float32Array(nnod),fU=new Float32Array(nnod);
  for(let n=0;n<nnod;n++)if(cnt[n]){fVm[n]=vmN[n];fU[n]=Math.hypot(S.u[3*n],S.u[3*n+1],S.u[3*n+2]);}
  dilate(G,cnt,[fVm,fU]);
  let vmMax=0,uMax=0;const sorted=Float32Array.from(S.vm).sort();for(const v of S.vm)vmMax=Math.max(vmMax,v);
  for(let i=0;i<S.u.length;i+=3)uMax=Math.max(uMax,Math.hypot(S.u[i],S.u[i+1],S.u[i+2]));
  let nFixed=0;for(let n=0;n<nnod;n++)if(dof[3*n]||dof[3*n+1]||dof[3*n+2])nFixed++;
  return{type:'static',vStress,vDisp,field:fieldOut(P,{vm:fVm,u:fU}),vmMax,vmP99:sorted[Math.floor(sorted.length*0.995)]||vmMax,uMax,...gridOut(P),nDof:nnod*3,iters:S.iters,rel:S.rel,levels:S.levels,ms,applied:ap,nFixed,backend:S.backend,gpuError:S.gpuError,hist:S.hist};
}
export function jacobiEig(A,m,Vo){
  const V=Vo?Vo.fill(0):new Float64Array(m*m);for(let i=0;i<m;i++)V[i*m+i]=1;let nf=0;for(let i=0;i<m*m;i++)nf+=A[i]*A[i];
  for(let sw=0;sw<80;sw++){let off=0;for(let p=0;p<m;p++)for(let q=p+1;q<m;q++)off+=A[p*m+q]**2;if(off<=1e-30*nf)break;
    for(let p=0;p<m;p++)for(let q=p+1;q<m;q++){const apq=A[p*m+q];if(!apq)continue;const th=(A[q*m+q]-A[p*m+p])/(2*apq),t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
      for(let k=0;k<m;k++){const x=A[k*m+p],y=A[k*m+q];A[k*m+p]=c*x-s*y;A[k*m+q]=s*x+c*y;}
      for(let k=0;k<m;k++){const x=A[p*m+k],y=A[q*m+k];A[p*m+k]=c*x-s*y;A[q*m+k]=s*x+c*y;}
      for(let k=0;k<m;k++){const x=V[k*m+p],y=V[k*m+q];V[k*m+p]=c*x-s*y;V[k*m+q]=s*x+c*y;}}}
  if(Vo)return Vo;const ord=[...Array(m).keys()].sort((a,b)=>A[a*m+a]-A[b*m+b]);return{w:ord.map(i=>A[i*m+i]),V,ord};
}
export function rigidModes(nn,xyz,Mv){const n=3*nn,c=[0,0,0],defl=[];let mt=0;for(let q=0;q<nn;q++)if(Mv[3*q]){const x=xyz(q);mt+=Mv[3*q];for(let k=0;k<3;k++)c[k]+=Mv[3*q]*x[k];}for(let k=0;k<3;k++)c[k]/=mt||1;
  const raw=[];for(let d=0;d<6;d++){const v=new Float64Array(n);for(let q=0;q<nn;q++)if(Mv[3*q]){const x=xyz(q),r=[x[0]-c[0],x[1]-c[1],x[2]-c[2]];if(d<3)v[3*q+d]=1;else{const a=d-3,b=(a+1)%3,e=(a+2)%3;v[3*q+b]=-r[e];v[3*q+e]=r[b];}}raw.push(v);}
  for(const v of raw){for(const R of defl){let s=0;for(let i=0;i<n;i++)s+=R[i]*v[i]*Mv[i];for(let i=0;i<n;i++)v[i]-=s*R[i];}let s=0;for(let i=0;i<n;i++)s+=v[i]*v[i]*Mv[i];s=Math.sqrt(s);if(s>0){for(let i=0;i<n;i++)v[i]/=s;defl.push(v);}}return defl;}
export async function lobpcg(Ls,K,Mv,nev,defl,opt,prog,ops){
  const L=Ls[0],n=Mv.length,fx=L.fixed,bs=nev+Math.max(2,Math.ceil(nev/3)),mg=Ls.length>1,tol=opt.tol||1e-3,maxIt=opt.maxIt||250;
  const A=ops&&ops.A||(async x=>{const y=new Float64Array(n);matvec(L,K,x,y);for(let i=0;i<n;i++)if(fx[i])y[i]=0;return y;});
  const md=(a,b)=>{let s=0;for(let i=0;i<n;i++)s+=a[i]*b[i]*Mv[i];return s;},dt=(a,b)=>{let s=0;for(let i=0;i<n;i++)s+=a[i]*b[i];return s;};
  const ax=(y,c,x)=>{for(let i=0;i<n;i++)y[i]-=c*x[i];};
  const cl=x=>{for(let i=0;i<n;i++)if(fx[i])x[i]=0;for(const R of defl)ax(x,md(R,x),R);return x;};
  const T=async r=>{let z=new Float64Array(n);if(ops)z=await ops.prec(r);else if(mg)vcycle(Ls,K,0,r,z);else for(let i=0;i<n;i++)z[i]=r[i]/L.diag[i];return cl(z);},all=async(V,f)=>{const o=[];for(const v of V)o.push(await f(v));return o;};
  const orth=(V,AV,B,AB)=>{const oV=[],oA=[];for(let j=0;j<V.length;j++){const v=V[j],av=AV?AV[j]:null,n0=Math.sqrt(md(v,v));if(!(n0>0))continue;for(let ps=0;ps<2;ps++){for(let i=0;i<B.length;i++){const c=md(B[i],v);ax(v,c,B[i]);if(av)ax(av,c,AB[i]);}for(let i=0;i<oV.length;i++){const c=md(oV[i],v);ax(v,c,oV[i]);if(av)ax(av,c,oA[i]);}}const nr=Math.sqrt(md(v,v));if(!(nr>1e-9*n0))continue;for(let i=0;i<n;i++)v[i]/=nr;if(av)for(let i=0;i<n;i++)av[i]/=nr;oV.push(v);oA.push(av);}return[oV,oA];};
  const comb=(S,C,m,j,from)=>{const y=new Float64Array(n);for(let i=from;i<S.length;i++){const c=C[i*m+j];if(c)for(let k=0;k<n;k++)y[k]+=c*S[i][k];}return y;};
  let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff-0.5;
  let X=[];for(let j=0;j<bs;j++){const v=new Float64Array(n);for(let i=0;i<n;i++)v[i]=fx[i]||!Mv[i]?0:rnd();X.push(await T(cl(v)));}
  [X]=orth(X,null,[],null);let AX=await all(X,A),P=[],AP=[],lam=[],res=[],it=0;
  const rr=(S,AS,keepP)=>{const m=S.length,G=new Float64Array(m*m);for(let i=0;i<m;i++)for(let j=i;j<m;j++)G[i*m+j]=G[j*m+i]=(dt(S[i],AS[j])+dt(S[j],AS[i]))/2;const{w,V,ord}=jacobiEig(G,m),C=new Float64Array(m*m);for(let i=0;i<m;i++)for(let j=0;j<m;j++)C[i*m+j]=V[i*m+ord[j]];const k=Math.min(bs,m),nx=[],nax=[],np=[],nap=[];for(let j=0;j<k;j++){nx.push(comb(S,C,m,j,0));nax.push(comb(AS,C,m,j,0));if(keepP){np.push(comb(S,C,m,j,keepP));nap.push(comb(AS,C,m,j,keepP));}}return{X:nx,AX:nax,P:np,AP:nap,lam:w.slice(0,k)};};
  ({X,AX,lam}=rr(X,AX,0));let best=null;
  for(;it<maxIt;it++){
    const R=X.map((x,j)=>{const r=AX[j].slice();for(let i=0;i<n;i++)r[i]-=lam[j]*Mv[i]*x[i];return r;});
    res=R.map((r,j)=>{let s=0;for(let i=0;i<n;i++)if(Mv[i])s+=r[i]*r[i]/Mv[i];return Math.sqrt(s)/Math.max(Math.abs(lam[j]),1e-30);});
    const worst=Math.max(...res.slice(0,nev));if(prog&&it%2===0)prog(it,worst,'modal');if(worst<tol)break;if(!best||worst<best.w)best={w:worst,lam:lam.slice(),X:X.map(v=>v.slice()),res:res.slice(),it};else if(best.w<30*tol&&worst>20*best.w)return{lam:best.lam,X:best.X,iters:it,res:best.res};
    let[W]=orth(await all(R.filter((_,j)=>res[j]>=tol*0.1),T),null,X,null);const AW=await all(W,A);
    [P,AP]=orth(P,AP,[...X,...W],[...AX,...AW]);
    const S=[...X,...W,...P],AS=[...AX,...AW,...AP];({X,AX,P,AP,lam}=rr(S,AS,X.length));
  }
  return{lam,X,iters:it,res};
}
async function modal(inp,P,prog){
  const{G,pos}=P,mat=inp.mat,nev=Math.max(1,Math.min(inp.modes||6,20)),K=keHex(mat.nu),Eh=mat.E*G.h;for(let i=0;i<576;i++)K[i]*=Eh;
  const dof=supportMask(inp,P),free=!dof.some(v=>v),t0=Date.now(),want=inp.solver||'auto',Ls=setup(G,K,3,dof,null,inp.mg,want!=='cpu'),L=Ls[0],n=L.nn*3,Mv=new Float64Array(n),rho=(mat.rho||7850)*1e-12;
  for(let q=0;q<P.nn;q++)for(let c=0;c<3;c++)Mv[3*q+c]=L.fixed[3*q+c]?0:P.vol[q]*rho;
  const defl=free?rigidModes(P.nn,P.xyz,Mv):[];
  let ctx=null,gpuError;if(want!=='cpu'&&Ls.length>1&&(want==='gpu'||L.sc.length>(inp.gpuMin||15000)))try{ctx=await gpuContext(Ls,K,{nsw:NSW});if(!ctx)gpuError='WebGPU unavailable';}catch(e){gpuError=String(e.message||e);}
  if(Ls.length>1&&!(L.om>0))L.om=omOf(L,K);
  const lo={tol:inp.tol,maxIt:inp.maxIt};let E,gpu=!!ctx;try{E=await lobpcg(Ls,K,Mv,nev,defl,lo,prog,ctx);}catch(e){if(!ctx)throw e;gpuError=String(e.message||e);gpu=false;E=await lobpcg(Ls,K,Mv,nev,defl,lo,prog,null);}finally{ctx&&ctx.free();}
  const {c:cnt}=nodalField(G,L,null),lmax=Math.max(...E.lam.map(Math.abs),1e-30);
  let mt=0;for(let q=0;q<P.nn;q++)mt+=P.vol[q]*rho;
  const modes=[];let rigid=0;
  for(let j=0;j<E.lam.length&&modes.length<nev;j++){const lam=E.lam[j];if(lam<1e-7*lmax&&!free){rigid++;continue;}const x=E.X[j],u=new Float32Array(P.nn);let um=0;for(let q=0;q<P.nn;q++){u[q]=Math.hypot(x[3*q],x[3*q+1],x[3*q+2]);um=Math.max(um,u[q]);}
    const gm=[0,0,0];for(let q=0;q<P.nn;q++)for(let c=0;c<3;c++)gm[c]+=Mv[3*q+c]*x[3*q+c];
    const ux=new Float32Array(n);for(let i=0;i<n;i++)ux[i]=x[i]/(um||1);for(let q=0;q<P.nn;q++)u[q]/=um||1;
    modes.push({f:Math.sqrt(Math.max(lam,0))/(2*Math.PI),omega:Math.sqrt(Math.max(lam,0)),res:E.res[j],meff:gm.map(g=>g*g/(mt||1)),vDisp:atVerts(G,L,ux,3,pos,cnt),u:dilate(G,cnt,[u])[0]});}
  const m0=modes[0],vMag=new Float32Array(pos.length/3);if(m0)for(let q=0;q<vMag.length;q++)vMag[q]=Math.hypot(m0.vDisp[3*q],m0.vDisp[3*q+1],m0.vDisp[3*q+2]);
  return{type:'modal',modes,freqs:modes.map(m=>m.f),rigid:free?6:rigid,free,mass:mt*1000,vStress:vMag,vDisp:m0?m0.vDisp.slice():new Float32Array(pos.length),field:fieldOut(P,{vm:m0?m0.u.slice():new Float32Array(P.nn),u:m0?m0.u.slice():new Float32Array(P.nn)}),vmMax:1,vmP99:1,uMax:1,...gridOut(P),nDof:n,iters:E.iters,rel:Math.max(...E.res.slice(0,nev)),levels:Ls.length,ms:Date.now()-t0,backend:gpu?'gpu':'cpu',gpuError};
}
async function thermal(inp,P,prog){
  const{G,pos}=P,mat=inp.mat||{},ck=condK(mat,inp.matKey),k=ck.k*1e-3,K=keHeat();for(let i=0;i<64;i++)K[i]*=k*G.h;
  const nn=P.nn,fixed=new Uint8Array(nn),u0=new Float64Array(nn),f=new Float64Array(nn),dadd=new Float64Array(nn),tg=new Int16Array(nn).fill(-1),temps=inp.temps||[],conv=inp.conv||[],flux=inp.flux||[];
  temps.forEach((b,bi)=>{for(const n of P.at(b.faces).keys()){fixed[n]=1;u0[n]=b.T;tg[n]=bi;}});
  const cv=conv.map(b=>{const acc=P.at(b.faces),hc=(b.h||10)*1e-6;for(const[n,v]of acc){dadd[n]+=hc*v[0];f[n]+=hc*v[0]*(b.Tinf??20);}return acc;});
  const qin=flux.map(b=>{const acc=P.at(b.faces);let tot=0;for(const v of acc.values())tot+=v[0];let Q=0;for(const[n,v]of acc){const q=b.Q!=null?b.Q*v[0]/(tot||1):(b.q||0)*v[0];f[n]+=q;Q+=q;}return Q;});
  let qv=0;if(inp.Qvol){let vt=0;for(let n=0;n<nn;n++)vt+=P.vol[n];for(let n=0;n<nn;n++){const q=inp.Qvol*P.vol[n]/(vt||1);f[n]+=q;}qv=inp.Qvol;}
  if(!temps.length&&!conv.length)throw new Error('add a fixed-temperature or convection face');
  const t0=Date.now(),Ls=setup(G,K,1,fixed,dadd,inp.mg),L=Ls[0],y=new Float64Array(nn);matvec(L,K,u0,y);const b=new Float64Array(nn);for(let n=0;n<nn;n++)b[n]=L.fixed[n]?0:f[n]-y[n];
  const S=await solve(Ls,K,b,{tol:inp.tol||1e-7,mg:inp.mg,solver:'cpu',phase:'thermal'},prog),T=new Float64Array(nn);for(let n=0;n<nn;n++)T[n]=S.u[n]+u0[n];
  matvec(L,K,T,y,true);const qT=temps.map(()=>0);for(let n=0;n<nn;n++)if(tg[n]>=0)qT[tg[n]]+=y[n]-f[n];
  const qc=cv.map((acc,i)=>{let s=0;const hc=(conv[i].h||10)*1e-6,Ti=conv[i].Tinf??20;for(const[n,v]of acc)s+=hc*v[0]*(Ti-T[n]);return s;});
  const{c:cnt}=nodalField(G,L,null),TN=new Float32Array(nn);let Tmin=Infinity,Tmax=-Infinity;for(let n=0;n<nn;n++)if(cnt[n]){TN[n]=T[n];Tmin=Math.min(Tmin,T[n]);Tmax=Math.max(Tmax,T[n]);}
  const vT=atVerts(G,L,TN,1,pos,cnt);dilate(G,cnt,[TN]);
  return{type:'thermal',vT,vStress:vT,vDisp:new Float32Array(pos.length),field:fieldOut(P,{T:TN,vm:TN,u:TN}),Tmin,Tmax,vmMax:Tmax,vmP99:Tmax,uMax:0,Q:{fixed:qT,conv:qc,flux:qin,vol:qv},balance:qT.reduce((a,c)=>a+c,0)+qc.reduce((a,c)=>a+c,0)+qin.reduce((a,c)=>a+c,0)+qv,k:k*1e3,warn:ck.warn,...gridOut(P),nDof:nn,iters:S.iters,rel:S.rel,levels:Ls.length,ms:Date.now()-t0,backend:S.backend};
}
export async function runFEA(inp,prog){
  const type=inp.type||'static',P=prep(inp,type==='modal'?15000:type==='thermal'?60000:40000);
  return type==='modal'?modal(inp,P,prog):type==='thermal'?thermal(inp,P,prog):statik(inp,P,prog);
}
function edt1(f,n,d,v,z){let k=0;v[0]=0;z[0]=-1e20;z[1]=1e20;for(let q=1;q<n;q++){let s;while(true){const p=v[k];s=((f[q]+q*q)-(f[p]+p*p))/(2*q-2*p);if(s<=z[k]&&k>0){k--;continue;}if(s<=z[k]){k--;}break;}k++;v[k]=q;z[k]=s;z[k+1]=1e20;}k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;const p=v[k];d[q]=(q-p)*(q-p)+f[p];}}
export function wallThickness(inp){
  const{pos,idx,bbox,volume,res}=inp,h=Math.cbrt(Math.max(volume,1e-9)/Math.max(4000,Math.min(res||60000,400000))),G=voxelize(pos,idx,bbox,h),{nx,ny,nz}=G,N=nx*ny*nz,INF=1e12,D=new Float64Array(N);
  for(let e=0;e<N;e++)D[e]=G.solid[e]?INF:0;
  const m=Math.max(nx,ny,nz),f=new Float64Array(m),d=new Float64Array(m),v=new Int32Array(m),z=new Float64Array(m+1);
  const pass=(len,stride,starts)=>{for(const s0 of starts){for(let q=0;q<len;q++)f[q]=D[s0+q*stride];edt1(f,len,d,v,z);for(let q=0;q<len;q++)D[s0+q*stride]=d[q];}};
  const sx=[],sy=[],sz=[];for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)sx.push((k*ny+j)*nx);for(let k=0;k<nz;k++)for(let i=0;i<nx;i++)sy.push(k*ny*nx+i);for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)sz.push(j*nx+i);
  pass(nx,1,sx);pass(ny,nx,sy);pass(nz,nx*ny,sz);
  let minT=Infinity,at=null,hist=[0,0,0,0,0,0,0,0];
  for(let k=1;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){const e=(k*ny+j)*nx+i;if(!G.solid[e])continue;const c=D[e];let ridge=true;for(let dk=-1;dk<=1&&ridge;dk++)for(let dj=-1;dj<=1&&ridge;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj&&!dk)continue;if(D[e+(dk*ny+dj)*nx+di]>c+1e-9){ridge=false;break;}}if(!ridge)continue;const t=2*Math.sqrt(c)*h-h*0;if(t<minT){minT=t;at=[G.ox+(i+0.5)*h,G.oy+(j+0.5)*h,G.oz+(k+0.5)*h];}hist[Math.min(7,Math.floor(t/(h*2)))]++;}
  return{minT:isFinite(minT)?minT:null,at,h};
}
