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
function makeLevel(nx,ny,nz,dens){
  const NX=nx+1,NY=ny+1,NZ=nz+1,nn=NX*NY*NZ,els=[],sc=[];
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const e=(k*ny+j)*nx+i;if(dens[e]>0){els.push(e);sc.push(dens[e]);}}
  const E=new Int32Array(els.length*8);
  for(let q=0;q<els.length;q++){const e=els[q],i=e%nx,j=Math.floor(e/nx)%ny,k=Math.floor(e/(nx*ny)),n0=(k*NY+j)*NX+i;E.set([n0,n0+1,n0+NX+1,n0+NX,n0+NX*NY,n0+NX*NY+1,n0+NX*NY+NX+1,n0+NX*NY+NX],q*8);}
  return{nx,ny,nz,NX,NY,NZ,nn,E,sc:new Float64Array(sc),dens};
}
function matvec(L,K,x,y){
  y.fill(0);const E=L.E,sc=L.sc,ne=sc.length,ue=new Float64Array(24),KE=L.KE;
  for(let q=0;q<ne;q++){
    const o=q*8,s=KE?1:sc[q],Kq=KE?KE.subarray(q*576,q*576+576):K;
    for(let a=0;a<8;a++){const n=E[o+a]*3;ue[3*a]=x[n];ue[3*a+1]=x[n+1];ue[3*a+2]=x[n+2];}
    for(let a=0;a<8;a++){const n=E[o+a]*3;for(let c=0;c<3;c++){const r=(3*a+c)*24;let t=0;for(let j=0;j<24;j++)t+=Kq[r+j]*ue[j];y[n+c]+=s*t;}}
  }
  const m=L.fixed;for(let i=0;i<y.length;i++)if(m[i])y[i]=x[i];
}
const LN=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
function childW(di,dj,dk){const W=new Float64Array(64);for(let a=0;a<8;a++){const u=[(di+LN[a][0])/2,(dj+LN[a][1])/2,(dk+LN[a][2])/2];for(let b=0;b<8;b++)W[a*8+b]=(LN[b][0]?u[0]:1-u[0])*(LN[b][1]?u[1]:1-u[1])*(LN[b][2]?u[2]:1-u[2]);}return W;}
const CW=[];for(let c=0;c<8;c++)CW.push(childW(c&1,(c>>1)&1,(c>>2)&1));
function galerkin(Kf,W,out,scale){const T=new Float64Array(576);for(let pi=0;pi<24;pi++){const p=pi/3|0,i=pi%3;for(let b=0;b<8;b++)for(let j=0;j<3;j++){let t=0;for(let q=0;q<8;q++){const w=W[q*8+b];if(w)t+=Kf[pi*24+3*q+j]*w;}T[pi*24+3*b+j]=t;}}for(let a=0;a<8;a++)for(let i=0;i<3;i++){const r=(3*a+i)*24;for(let p=0;p<8;p++){const w=W[p*8+a];if(!w)continue;const rr=(3*p+i)*24;for(let k=0;k<24;k++)out[r+k]+=scale*w*T[rr+k];}}}
function coarsen(F,K,MC){
  const nx=Math.ceil(F.nx/2),ny=Math.ceil(F.ny/2),nz=Math.ceil(F.nz/2),NX=nx+1,NY=ny+1,NZ=nz+1,nn=NX*NY*NZ,emap=new Int32Array(F.nx*F.ny*F.nz).fill(-1);
  const fne=F.sc.length;for(let q=0;q<fne;q++){const n0=F.E[q*8],i=n0%F.NX,j=Math.floor(n0/F.NX)%F.NY,k=Math.floor(n0/(F.NX*F.NY));emap[(k*F.ny+j)*F.nx+i]=q;}
  const cells=new Map();for(let k=0;k<F.nz;k++)for(let j=0;j<F.ny;j++)for(let i=0;i<F.nx;i++){const q=emap[(k*F.ny+j)*F.nx+i];if(q<0)continue;const ce=((k>>1)*ny+(j>>1))*nx+(i>>1);let l=cells.get(ce);if(!l)cells.set(ce,l=[]);l.push([q,(i&1)|((j&1)<<1)|((k&1)<<2)]);}
  const ids=[...cells.keys()].sort((a,b)=>a-b),ne=ids.length,E=new Int32Array(ne*8),KE=new Float32Array(ne*576),acc=new Float64Array(576),Km=new Float64Array(576);
  for(let e=0;e<ne;e++){const ce=ids[e],i=ce%nx,j=Math.floor(ce/nx)%ny,k=Math.floor(ce/(nx*ny)),n0=(k*NY+j)*NX+i;E.set([n0,n0+1,n0+NX+1,n0+NX,n0+NX*NY,n0+NX*NY+1,n0+NX*NY+NX+1,n0+NX*NY+NX],e*8);acc.fill(0);
    for(const[q,c]of cells.get(ce)){
      if(F.KE){galerkin(F.KE.subarray(q*576,q*576+576),CW[c],acc,1);continue;}
      let masked=false;const fm=F.fixed;for(let a=0;a<8&&!masked;a++){const nd=F.E[q*8+a]*3;if(fm[nd]||fm[nd+1]||fm[nd+2])masked=true;}
      if(!masked){const s=F.sc[q],M=MC[c];for(let t=0;t<576;t++)acc[t]+=s*M[t];continue;}
      const s=F.sc[q];for(let t=0;t<576;t++)Km[t]=K[t];for(let a=0;a<8;a++){const nd=F.E[q*8+a]*3;for(let cc=0;cc<3;cc++)if(fm[nd+cc]){const r=3*a+cc;for(let t=0;t<24;t++){Km[r*24+t]=0;Km[t*24+r]=0;}}}galerkin(Km,CW[c],acc,s);}
    KE.set(acc,e*576);}
  const L={nx,ny,nz,NX,NY,NZ,nn,E,sc:new Float64Array(ne).fill(1),KE};L.fixed=new Uint8Array(nn*3);return L;
}
function diagOf(L,K){const d=new Float64Array(L.nn*3),E=L.E,sc=L.sc,KE=L.KE;for(let q=0;q<sc.length;q++)for(let a=0;a<8;a++){const n=E[q*8+a]*3;for(let c=0;c<3;c++)d[n+c]+=KE?KE[q*576+(3*a+c)*25]:sc[q]*K[(3*a+c)*25];}for(let i=0;i<d.length;i++)if(Math.abs(d[i])<1e-12*K[0])d[i]=0;for(let i=0;i<d.length;i++)if(L.fixed[i]||d[i]===0){d[i]=1;L.fixed[i]=1;}return d;}
function tmap(NF,NC){const a0=new Int32Array(NF),a1=new Int32Array(NF),w=new Float64Array(NF);for(let i=0;i<NF;i++){a0[i]=i>>1;a1[i]=Math.min((i>>1)+(i&1),NC-1);w[i]=i&1?0.5:1;}return{a0,a1,w,odd:i=>i&1};}
function maps(Lf,Lc){return Lf.mp||(Lf.mp=[tmap(Lf.NX,Lc.NX),tmap(Lf.NY,Lc.NY),tmap(Lf.NZ,Lc.NZ)]);}
function transfer(Lf,Lc,xf,xc,up){
  const[mx,my,mz]=maps(Lf,Lc),{NX,NY,NZ}=Lf,cX=Lc.NX,cY=Lc.NY,mf=Lf.fixed;
  if(up)xf.fill(0);else xc.fill(0);
  for(let k=0;k<NZ;k++){const nk=k&1?2:1;
    for(let j=0;j<NY;j++){const nj=j&1?2:1;
      for(let i=0;i<NX;i++){const ni=i&1?2:1,f=((k*NY+j)*NX+i)*3;
        if(!up&&!xf[f]&&!xf[f+1]&&!xf[f+2])continue;
        for(let a=0;a<nk;a++){const kk=a?mz.a1[k]:mz.a0[k],wk=mz.w[k];
          for(let b=0;b<nj;b++){const jj=b?my.a1[j]:my.a0[j],wj=wk*my.w[j];
            for(let c=0;c<ni;c++){const ii=c?mx.a1[i]:mx.a0[i],w=wj*mx.w[i],q=((kk*cY+jj)*cX+ii)*3;
              if(up){xf[f]+=w*xc[q];xf[f+1]+=w*xc[q+1];xf[f+2]+=w*xc[q+2];}else{if(!mf[f])xc[q]+=w*xf[f];if(!mf[f+1])xc[q+1]+=w*xf[f+1];if(!mf[f+2])xc[q+2]+=w*xf[f+2];}
            }}}
      }}}
  if(up){for(let i=0;i<xf.length;i++)if(mf[i])xf[i]=0;}else{const mc=Lc.fixed;for(let i=0;i<xc.length;i++)if(mc[i])xc[i]=0;}
}
function prolong(Lc,Lf,xc,xf){transfer(Lf,Lc,xf,xc,true);}
function restrict(Lf,Lc,rf,rc){transfer(Lf,Lc,rf,rc,false);}
function smooth(L,K,b,x,iters,tmp){const om=L.om||0.5;for(let s=0;s<iters;s++){matvec(L,K,x,tmp);for(let i=0;i<x.length;i++)x[i]+=om*(b[i]-tmp[i])/L.diag[i];}}
function lamMax(L,K){const n=L.nn*3;let x=new Float64Array(n),y=new Float64Array(n),lam=1;let seed=12345;for(let i=0;i<n;i++){seed=(seed*1103515245+12345)&0x7fffffff;x[i]=L.fixed[i]?0:seed/0x7fffffff-0.5;}for(let it=0;it<14;it++){matvec(L,K,x,y);let num=0,den=0;for(let i=0;i<n;i++){if(L.fixed[i]){y[i]=0;continue;}y[i]/=L.diag[i];num+=y[i]*y[i]*L.diag[i];den+=x[i]*y[i]*L.diag[i];}lam=num/Math.max(den,1e-300);let nr=0;for(let i=0;i<n;i++)nr+=y[i]*y[i];nr=Math.sqrt(nr)||1;for(let i=0;i<n;i++)x[i]=y[i]/nr;}return lam;}
let NSW=1;export function setSweeps(n){NSW=n;}
function vcycle(Ls,K,l,b,x){
  const L=Ls[l];x.fill(0);
  if(l===Ls.length-1){smooth(L,K,b,x,40,L.t1);return;}
  smooth(L,K,b,x,NSW,L.t1);
  matvec(L,K,x,L.t1);for(let i=0;i<b.length;i++)L.t2[i]=b[i]-L.t1[i];
  const C=Ls[l+1];restrict(L,C,L.t2,C.b);vcycle(Ls,K,l+1,C.b,C.x);prolong(C,L,C.x,L.t2);
  for(let i=0;i<x.length;i++)x[i]+=L.t2[i];
  smooth(L,K,b,x,NSW,L.t1);
}
export function solveGrid(G,mat,fixedNodes,force,opt={},prog){
  const K=keHex(mat.nu),Eh=mat.E*G.h;for(let i=0;i<576;i++)K[i]*=Eh;
  const nEl=G.nx*G.ny*G.nz,dens0=new Float32Array(nEl);for(let e=0;e<nEl;e++)dens0[e]=G.solid[e]?Math.max(G.frac[e],0.12):0;
  const Ls=[makeLevel(G.nx,G.ny,G.nz,dens0)];
  Ls[0].fixed=new Uint8Array(Ls[0].nn*3);Ls[0].scale=1;for(const n of fixedNodes){Ls[0].fixed[3*n]=Ls[0].fixed[3*n+1]=Ls[0].fixed[3*n+2]=1;}
  const MC=CW.map(W=>{const o=new Float64Array(576);galerkin(K,W,o,1);return o;});
  while(Ls.length<7&&opt.mg!==false){
    const F=Ls[Ls.length-1];if(F.sc.length<400||Math.min(F.nx,F.ny,F.nz)<2)break;
    Ls.push(coarsen(F,K,MC));
  }
  for(const L of Ls){L.diag=diagOf(L,K);L.t1=new Float64Array(L.nn*3);L.t2=new Float64Array(L.nn*3);L.b=new Float64Array(L.nn*3);L.x=new Float64Array(L.nn*3);}
  if(Ls.length>1&&opt.mg!==false)for(const L of Ls)L.om=Math.min(0.8,1.15/(lamMax(L,K)*1.05));
  const L=Ls[0],n=L.nn*3,f=new Float64Array(n);for(let i=0;i<n;i++)f[i]=L.fixed[i]?0:force[i]||0;
  const u=new Float64Array(n),r=f.slice(),z=new Float64Array(n),p=new Float64Array(n),Ap=new Float64Array(n);
  const useMG=Ls.length>1&&opt.mg!==false,pre=(rr,zz)=>{if(useMG)vcycle(Ls,K,0,rr,zz);else for(let i=0;i<n;i++)zz[i]=rr[i]/L.diag[i];};
  pre(r,z);p.set(z);let rz=0;for(let i=0;i<n;i++)rz+=r[i]*z[i];
  let fn=0;for(let i=0;i<n;i++)fn+=f[i]*f[i];fn=Math.sqrt(fn)||1;
  const tol=opt.tol||1e-6,maxIt=opt.maxIt||(useMG?400:6000);let it=0,rel=1;
  for(;it<maxIt;it++){
    matvec(L,K,p,Ap);let pAp=0;for(let i=0;i<n;i++)pAp+=p[i]*Ap[i];
    if(!(pAp>0))break;const al=rz/pAp;let rr=0;
    for(let i=0;i<n;i++){u[i]+=al*p[i];r[i]-=al*Ap[i];rr+=r[i]*r[i];}
    rel=Math.sqrt(rr)/fn;if(prog&&it%5===0)prog(it,rel);if(rel<tol)break;
    pre(r,z);let rz2=0;for(let i=0;i<n;i++)rz2+=r[i]*z[i];const be=rz2/rz;rz=rz2;for(let i=0;i<n;i++)p[i]=z[i]+be*p[i];
  }
  const DB=bCenter(mat.nu),ne=L.sc.length,vm=new Float32Array(ne),sig=new Float32Array(ne*6),ue=new Float64Array(24),s=mat.E/G.h;
  for(let q=0;q<ne;q++){
    for(let a=0;a<8;a++){const nd=L.E[q*8+a]*3;ue[3*a]=u[nd];ue[3*a+1]=u[nd+1];ue[3*a+2]=u[nd+2];}
    const S=[0,0,0,0,0,0];for(let r2=0;r2<6;r2++){let t=0;for(let j=0;j<24;j++)t+=DB[r2][j]*ue[j];S[r2]=t*s;}
    sig.set(S,q*6);vm[q]=Math.sqrt(0.5*((S[0]-S[1])**2+(S[1]-S[2])**2+(S[2]-S[0])**2)+3*(S[3]**2+S[4]**2+S[5]**2));
  }
  return{u,vm,sig,levels:Ls.length,iters:it,rel,L0:L};
}
export function nodalField(G,L,elemVal){
  const v=new Float32Array(L.nn),c=new Uint16Array(L.nn);
  for(let q=0;q<L.sc.length;q++)for(let a=0;a<8;a++){const n=L.E[q*8+a];v[n]+=elemVal[q];c[n]++;}
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
export function runFEA(inp,prog){
  const{pos,idx,groups,bbox,volume,mat,fixed,loads,res}=inp,target=Math.max(2000,Math.min(res||40000,800000));
  const h=Math.cbrt(Math.max(volume,1e-9)/target),G=voxelize(pos,idx,bbox,h);
  let nAct=0;for(const v of G.solid)nAct+=v;if(nAct<8)throw new Error('part too thin for this resolution, raise resolution');
  const mask=activeNodeMask(G),trisOf=ids=>{const out=[];for(const g of groups)if(ids.includes(g[2]))for(let t=g[0]/3;t<(g[0]+g[1])/3;t++)out.push(t);return out;};
  const fixedSet=new Set();sampleTris(pos,idx,trisOf(fixed||[]),h,p=>{const n=nearestActive(G,mask,...p);if(n>=0)fixedSet.add(n);});
  if(!fixedSet.size)throw new Error('add at least one fixed face');
  const nn=(G.nx+1)*(G.ny+1)*(G.nz+1),force=new Float64Array(nn*3);let applied=[0,0,0];
  for(const ld of loads||[]){
    const tris=trisOf(ld.faces||[]),acc=new Map();let tot=0;
    sampleTris(pos,idx,tris,h,(p,w,nr)=>{const n=nearestActive(G,mask,...p);if(n<0)return;const v=acc.get(n)||[0,0,0,0];v[0]+=w;v[1]+=w*nr[0];v[2]+=w*nr[1];v[3]+=w*nr[2];acc.set(n,v);tot+=w;});
    if(!tot)continue;
    for(const[n,v]of acc){const F=ld.p?[-ld.p*v[1],-ld.p*v[2],-ld.p*v[3]]:[ld.F[0]*v[0]/tot,ld.F[1]*v[0]/tot,ld.F[2]*v[0]/tot];for(let c=0;c<3;c++){force[3*n+c]+=F[c];applied[c]+=F[c];}}
  }
  if(mat.g){const gv=mat.g,mE=mat.rho*1e-9*h*h*h*9.80665/8;for(let k=0;k<G.nz;k++)for(let j=0;j<G.ny;j++)for(let i=0;i<G.nx;i++)if(G.solid[(k*G.ny+j)*G.nx+i])for(let d=0;d<8;d++){const n=((k+(d>>2))*(G.ny+1)+(j+((d>>1)&1)))*(G.nx+1)+i+(d&1);for(let c=0;c<3;c++){force[3*n+c]+=gv[c]*mE;applied[c]+=gv[c]*mE;}}}
  const t0=Date.now(),S=solveGrid(G,mat,fixedSet,force,{tol:inp.tol||1e-6,mg:inp.mg},prog),ms=Date.now()-t0;
  const{v:vmN,c:cnt}=nodalField(G,S.L0,S.vm),nv=pos.length/3,vStress=new Float32Array(nv),vDisp=new Float32Array(nv*3),tmp=new Float64Array(3),t1=new Float64Array(1);
  const uN=new Float32Array(S.u);
  for(let q=0;q<nv;q++){const x=pos[3*q],y=pos[3*q+1],z=pos[3*q+2];sampleAt(G,S.L0,vmN,1,x,y,z,t1,cnt);vStress[q]=t1[0];sampleAt(G,S.L0,uN,3,x,y,z,tmp,cnt);vDisp[3*q]=tmp[0];vDisp[3*q+1]=tmp[1];vDisp[3*q+2]=tmp[2];}
  const NX=G.nx+1,NY=G.ny+1,NZ=G.nz+1,nnod=NX*NY*NZ,fVm=new Float32Array(nnod),fU=new Float32Array(nnod),ok=new Uint8Array(nnod);
  for(let n=0;n<nnod;n++)if(cnt[n]){ok[n]=1;fVm[n]=vmN[n];fU[n]=Math.hypot(S.u[3*n],S.u[3*n+1],S.u[3*n+2]);}
  for(let pass=0;pass<2;pass++){const nk=ok.slice();for(let k=0;k<NZ;k++)for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const n=(k*NY+j)*NX+i;if(ok[n])continue;let sv=0,su=0,c=0;for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const a2=i+di,b2=j+dj,c2=k+dk;if(a2<0||b2<0||c2<0||a2>=NX||b2>=NY||c2>=NZ)continue;const m2=(c2*NY+b2)*NX+a2;if(ok[m2]){sv+=fVm[m2];su+=fU[m2];c++;}}if(c){fVm[n]=sv/c;fU[n]=su/c;nk[n]=1;}}ok.set(nk);}
  let vmMax=0,uMax=0;const sorted=Float32Array.from(S.vm).sort();for(const v of S.vm)vmMax=Math.max(vmMax,v);
  for(let i=0;i<S.u.length;i+=3)uMax=Math.max(uMax,Math.hypot(S.u[i],S.u[i+1],S.u[i+2]));
  const p99=sorted[Math.floor(sorted.length*0.995)]||vmMax;
  return{vStress,vDisp,field:{vm:fVm,u:fU,o:[G.ox,G.oy,G.oz],h:G.h,n:[NX,NY,NZ]},vmMax,vmP99:p99,uMax,h,nEl:nAct,nDof:nn*3,iters:S.iters,rel:S.rel,levels:S.levels,ms,applied,nFixed:fixedSet.size,grid:{nx:G.nx,ny:G.ny,nz:G.nz}};
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
