import {region,RGE} from './region.js';
import {gpuSolve,gpuContext} from './fea_gpu.js';
import {KCOND,condK} from './thermal_data.js';
import {ADV,bcOf,contactSolve,heldBy,distLoad} from './fea_bc.js';
import {voxSkin,skinU} from './fea_skin.js';
import {helium} from './he/host.js';
import {maxOf} from './minmax.js';
import {principals,probe,pathPlot,kgMul} from './fea_post.js';
import {fatigueField,modalNewmark,frf,miles} from './fea_fatigue.js';
import {snOf} from './fatigue_data.js';
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
export function feThermal(nu){const D=dmat(nu),g=1/Math.sqrt(3),ev=[1,1,1,0,0,0],De=new Float64Array(6),f=new Float64Array(24),w=1/8;for(let r=0;r<6;r++)for(let c=0;c<6;c++)De[r]+=D[r][c]*ev[c];for(const xi of[-g,g])for(const et of[-g,g])for(const ze of[-g,g]){const{B}=bAt(xi,et,ze);for(let i=0;i<24;i++){let s=0;for(let r=0;r<6;r++)s+=B[r][i]*De[r];f[i]+=w*s;}}return f;}
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
const FG=helium('fea_grid'),TP=helium('topo'),EM=helium('em'),LB=helium('lob'),EPS0=8.8541878128e-15;let NSW=1,RES_MAX=800000,CELL_MAX=Infinity;export function setSweeps(n){NSW=n;}export const setResMax=(n,cells=Infinity)=>{RES_MAX=n;CELL_MAX=cells;};
const lev=(H,l,nd)=>{const om=H.ex.fg_level(l),d=k=>H.ex.fg_dim(l,k),nx=d(0),ny=d(1),nz=d(2);return{nx,ny,nz,NX:nx+1,NY:ny+1,NZ:nz+1,nn:d(3),nd,E:H.get(20),sc:H.get(21),...(l?{KE:H.get(22)}:{}),fixed:H.get(23),diag:H.get(24),om};};
async function setup(G,K,nd,fixed,dadd,mg,lazy,dens){let P=null;const H=await FG({fg_prog:(i,r)=>P&&P(i,r)}),x=H.ex;let n;try{x.fg_sweeps(NSW);x.fg_grid(G.nx,G.ny,G.nz,nd,dadd?1:0);H.put(1,dens||densOf(G));H.put(2,K);H.put(3,fixed);dadd&&H.put(4,dadd);n=x.fg_setup(mg===false?0:1,lazy?1:0);}catch(e){throw/address space|past its region/.test(e.message)&&!H.native?new Error('This model is too large for the in-browser solver ('+(G.nx*G.ny*G.nz).toLocaleString('en-US')+' grid cells). Lower the resolution, or run it with the Amni-CAD headless API, which solves natively without the 4 GB browser limit.'):e;}const Ls=Array.from({length:n},(_,l)=>l?null:lev(H,0,nd));H.into(14,fixed);Object.assign(Ls[0],{fixed,dadd:dadd||null});return Object.assign(Ls,{he:H,prog:f=>{P=f;},all:()=>{for(let l=1;l<n;l++)Ls[l]=Ls[l]||lev(H,l,nd);return Ls;}});}
const mv=(Ls,x,y,raw)=>{const H=Ls.he;H.put(12,x);H.ex.fg_matvec(raw?1:0);H.into(13,y);},vcycle=(Ls,r,z)=>{const H=Ls.he;H.put(10,r);H.ex.fg_vcycle();H.into(12,z);},om0=Ls=>{Ls[0].om=Ls.he.ex.fg_om0(Ls[0].om>0?Ls[0].om:0)||undefined;};
function pcg(Ls,f,opt,prog){const H=Ls.he;H.put(10,f);Ls.prog(prog?(i,r)=>prog(i,r,opt.phase||'solve'):null);const iters=H.ex.fg_pcg(opt.tol||0,opt.maxIt||0);Ls.prog(null);return{u:H.get(11),iters,rel:H.ex.fg_rel()};}
async function solve(Ls,K,f,opt={},prog){
  const L=Ls[0],n=L.nn*L.nd,b=new Float64Array(n),want=opt.solver||'auto';for(let i=0;i<n;i++)b[i]=L.fixed[i]?0:f[i]||0;let gpuError;
  if(L.nd===3&&want!=='cpu'&&(want==='gpu'||L.sc.length>(opt.gpuMin||15000)))try{if(!globalThis.navigator?.gpu)throw new Error('WebGPU unavailable');const r=await gpuSolve(Ls.all(),K,b,{tol:opt.tol||1e-6,maxIt:opt.maxIt,nsw:NSW,mv:(x,y)=>mv(Ls,x,y)},prog);if(r)return{...r,backend:'gpu'};gpuError='WebGPU unavailable';}catch(e){gpuError=String(e.message||e);}
  om0(Ls);
  return{...pcg(Ls,b,opt,prog),backend:Ls.he.native?'native':'cpu',gpuError,why:Ls.he.native?'Native 64-bit solver':gpuError?'':want==='cpu'?'CPU chosen':L.nd!==3?'heat solves on the CPU':opt.dadd?'springs solve on the CPU':'Auto: small enough that the CPU is quicker'};
}
export async function solveGrid(G,mat,dof,force,opt={},prog){
  const K=keHex(mat.nu),Eh=mat.E*G.h;for(let i=0;i<576;i++)K[i]*=Eh;
  const sv=opt.dadd?'cpu':opt.solver,Ls=await setup(G,K,3,dof,opt.dadd||null,opt.mg,sv!=='cpu',opt.dens),L=Ls[0],u0=opt.u0,y=u0?new Float64Array(force.length):null;y&&mv(Ls,u0,y,true);const S=await solve(Ls,K,y?force.map((v,i)=>v-y[i]):force,{...opt,solver:sv},prog),u=S.u;if(u0)for(let i=0;i<u.length;i++)u[i]+=u0[i];
  const DB=bCenter(mat.nu),ne=L.sc.length,vm=new Float32Array(ne),sig=new Float32Array(ne*6),ue=new Float64Array(24),s=mat.E/G.h;
  for(let q=0;q<ne;q++){
    for(let a=0;a<8;a++){const nd=L.E[q*8+a]*3;ue[3*a]=u[nd];ue[3*a+1]=u[nd+1];ue[3*a+2]=u[nd+2];}
    const S6=[0,0,0,0,0,0];for(let r2=0;r2<6;r2++){let t=0;for(let j=0;j<24;j++)t+=DB[r2][j]*ue[j];S6[r2]=t*s;}
    sig.set(S6,q*6);vm[q]=Math.sqrt(0.5*((S6[0]-S6[1])**2+(S6[1]-S6[2])**2+(S6[2]-S6[0])**2)+3*(S6[3]**2+S6[4]**2+S6[5]**2));
  }
  let ku=null;return{...S,vm,sig,levels:Ls.length,L0:L,R:d=>{if(!ku){ku=new Float64Array(u.length);mv(Ls,u,ku,true);}return ku[d]-force[d];}};
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
  const{pos,idx,groups,bbox,volume,res}=inp,target=Math.max(2000,Math.min(res||def,RES_MAX)),h=Math.cbrt(Math.max(volume,1e-9)/target),G=voxelize(pos,idx,bbox,h);if(G.nx*G.ny*G.nz>CELL_MAX)throw new Error('This model needs about '+Math.ceil(G.nx*G.ny*G.nz*950/1e9)+' GB at this resolution ('+(G.nx*G.ny*G.nz).toLocaleString('en-US')+' grid cells), more than this computer has. Lower the resolution.');
  let nAct=0;for(const v of G.solid)nAct+=v;if(nAct<8)throw new Error('part too thin for this resolution, raise resolution');
  const mask=activeNodeMask(G),NX=G.nx+1,NY=G.ny+1,NZ=G.nz+1,nn=NX*NY*NZ,dens=densOf(G),vol=new Float64Array(nn),h3=h*h*h/8;
  for(let k=0;k<G.nz;k++)for(let j=0;j<G.ny;j++)for(let i=0;i<G.nx;i++){const w=dens[(k*G.ny+j)*G.nx+i]*h3;if(w)for(let d=0;d<8;d++)vol[((k+(d>>2))*NY+(j+((d>>1)&1)))*NX+i+(d&1)]+=w;}
  const trisOf=ids=>{const out=[];for(const g of groups)if(ids.includes(g[2]))for(let t=g[0]/3;t<(g[0]+g[1])/3;t++)out.push(t);return out;};
  const at=sp=>{const acc=new Map(),rg=region(sp&&sp.region),ids=sp&&!Array.isArray(sp)&&sp.faces?sp.faces:sp;sampleTris(pos,idx,trisOf(ids||[]),h,(p,w,nr)=>{if(rg&&!rg.test(p[0],p[1],p[2],h))return;const n=nearestActive(G,mask,...p);if(n<0)return;const v=acc.get(n)||[0,0,0,0];v[0]+=w;v[1]+=w*nr[0];v[2]+=w*nr[1];v[3]+=w*nr[2];acc.set(n,v);});if(rg&&!acc.size)throw new Error(RGE);return acc;};
  const xyz=n=>[G.ox+(n%NX)*h,G.oy+(Math.floor(n/NX)%NY)*h,G.oz+Math.floor(n/(NX*NY))*h];
  return{G,h,nAct,nn,NX,NY,NZ,at,xyz,vol,pos};
}
function supportMask(inp,P,modal){
  const dof=new Uint8Array(P.nn*3),sup=[...(inp.fixed&&inp.fixed.length?[{faces:inp.fixed,type:'fixed'}]:[]),...(inp.supports||[])];
  for(const s of sup)for(const[n,v]of ADV.has(s.type)&&!(modal&&s.type!=='spring')?[]:P.at(s.faces)){const roll=s.type==='roller'||s.type==='slider',a=Math.abs(v[1])>=Math.abs(v[2])&&Math.abs(v[1])>=Math.abs(v[3])?0:Math.abs(v[2])>=Math.abs(v[3])?1:2;if(roll)dof[3*n+a]=1;else dof[3*n]=dof[3*n+1]=dof[3*n+2]=1;}
  return dof;
}
function loadVec(inp,P,mat){
  const f=new Float64Array(P.nn*3),ap=[0,0,0],add=(n,F)=>{for(let c=0;c<3;c++){f[3*n+c]+=F[c];ap[c]+=F[c];}};
  for(const ld of inp.loads||[]){
    distLoad(ld,P.at(ld.faces),P.xyz,add);
  }
  const g=inp.accel||(mat.g?mat.g.map(v=>v*9.80665):null);
  if(g&&mat.rho){const k=mat.rho*1e-9;for(let n=0;n<P.nn;n++)if(P.vol[n])add(n,[g[0]*k*P.vol[n],g[1]*k*P.vol[n],g[2]*k*P.vol[n]]);}
  if(inp.nodalF)for(let i=0;i<inp.nodalF.length&&i<f.length;i++){f[i]+=inp.nodalF[i];ap[i%3]+=inp.nodalF[i];}
  return{f,ap};
}
function gridOut(P){const G=P.G;return{h:P.h,nEl:P.nAct,grid:{nx:G.nx,ny:G.ny,nz:G.nz}};}
function fieldOut(P,fs){const G=P.G;return{o:[G.ox,G.oy,G.oz],h:G.h,n:[P.NX,P.NY,P.NZ],...fs};}
async function statik(inp,P,prog){
  const{G,pos}=P,mat=inp.mat,dof=supportMask(inp,P),B=bcOf(inp,P.nn,P.at),held=dof.some(v=>v)||!!B.u0;for(let i=0;i<dof.length;i++)dof[i]|=B.dof[i];if(!held&&!B.stops.size&&!B.dadd)throw new Error('add at least one fixed face');
  const{f,ap}=loadVec(inp,P,mat),t0=Date.now(),go=act=>{const d=dof.slice(),u0=B.u0?B.u0.slice():act.size?new Float64Array(3*P.nn):null;for(const[k,v]of act){d[k]=1;u0[k]=v;}return solveGrid(G,mat,d,f,{tol:inp.tol||1e-6,mg:inp.mg,solver:inp.solver,gpuMin:inp.gpuMin,u0,dadd:B.dadd},prog);},S=B.stops.size?await contactSolve(B,held,go):await go(new Map()),ms=Date.now()-t0,wire=voxSkin(G.nx,G.ny,G.nz,G.solid,P.xyz);wire.u=skinU(wire,S.u);
  const{v:vmN,c:cnt}=nodalField(G,S.L0,S.vm),vStress=atVerts(G,S.L0,vmN,1,pos,cnt),vDisp=atVerts(G,S.L0,new Float32Array(S.u),3,pos,cnt);
  const nnod=P.nn,fVm=new Float32Array(nnod),fU=new Float32Array(nnod);
  for(let n=0;n<nnod;n++)if(cnt[n]){fVm[n]=vmN[n];fU[n]=Math.hypot(S.u[3*n],S.u[3*n+1],S.u[3*n+2]);}
  dilate(G,cnt,[fVm,fU]);wire.vm=Float32Array.from(wire.nodes,n=>fVm[n]);
  let vmMax=0,uMax=0;const sorted=Float32Array.from(S.vm).sort();for(const v of S.vm)vmMax=Math.max(vmMax,v);
  for(let i=0;i<S.u.length;i+=3)uMax=Math.max(uMax,Math.hypot(S.u[i],S.u[i+1],S.u[i+2]));
  let nFixed=0;for(let n=0;n<nnod;n++)if(dof[3*n]||dof[3*n+1]||dof[3*n+2])nFixed++;
  const reaction=[0,0,0];for(let i=0;i<dof.length;i++)if(dof[i])reaction[i%3]+=S.R(i);
  let extra={};if(inp.fields&&S.sig){const p1=new Float32Array(nnod),tr=new Float32Array(nnod),cc=new Uint16Array(nnod);for(let q=0;q<S.sig.length/6;q++){const m=principals(S.sig.subarray(q*6,q*6+6));for(let a=0;a<8;a++){const n=S.L0.E[q*8+a];p1[n]+=m.p1;tr[n]+=m.tresca;cc[n]++;}}let p1Max=-Infinity,trMax=0;for(let n=0;n<nnod;n++)if(cc[n]){p1[n]/=cc[n];tr[n]/=cc[n];p1Max=Math.max(p1Max,p1[n]);trMax=Math.max(trMax,tr[n]);}extra={p1,tresca:tr,p1Max,trescaMax:trMax,nodeVm:fVm};}
  if(inp.probes||inp.path){const X=new Float32Array(nnod*3);for(let n=0;n<nnod;n++){const p=P.xyz(n);X[3*n]=p[0];X[3*n+1]=p[1];X[3*n+2]=p[2];}const fields={u:{data:S.u,stride:3},vm:{data:fVm,stride:1},...(extra.p1?{p1:{data:extra.p1,stride:1},tresca:{data:extra.tresca,stride:1}}:{})};if(inp.probes)extra.probes=probe(X,fields,inp.probes,P.h*2);if(inp.path){const a=inp.path.a,b=inp.path.b,mid=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];let cx=0,cy=0,cz=0;for(let n=0;n<nnod;n++){cx+=X[3*n];cy+=X[3*n+1];cz+=X[3*n+2];}cx=cx/nnod-mid[0];cy=cy/nnod-mid[1];cz=cz/nnod-mid[2];const ln=Math.hypot(cx,cy,cz)||1;extra.path=pathPlot(X,fields,a,b,inp.path.n||21,P.h*2,[cx/ln*P.h,cy/ln*P.h,cz/ln*P.h]);}}
  return{type:'static',vStress,vDisp,field:fieldOut(P,{vm:fVm,u:fU,...(extra.p1?{p1:extra.p1,tr:extra.tresca}:{})}),vmMax,vmP99:sorted[Math.floor(sorted.length*0.995)]||vmMax,uMax,...gridOut(P),nDof:nnod*3,iters:S.iters,rel:S.rel,levels:S.levels,ms,applied:ap,reaction,nFixed,backend:S.backend,gpuError:S.gpuError,why:S.why,hist:S.hist,wire,contact:S.contact,held:B.grp.size?heldBy(B,S.R):undefined,u:inp.keepU?S.u:undefined,...extra};
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
  const L=Ls[0],n=Mv.length,fx=L.fixed,bs=nev+Math.max(2,Math.ceil(nev/3)),mg=Ls.length>1,tol=opt.tol||1e-3,maxIt=opt.maxIt||250,nd=defl.length,cap=12*bs+nd+2,dg=!ops&&!mg;
  const Q=await LB(),H=Q.ex;H.lb_init(n,cap,nd,3*bs,dg?1:0);Q.v(2).set(Mv);Q.v(3).set(fx);dg&&Q.v(12).set(L.diag);let VP=Q.v(1);
  const vw=s=>(VP.buffer===Q.mem.buffer||(VP=Q.v(1)),VP.subarray(s*n,s*n+n)),FR=[];for(let s=cap-1;s>=0;s--)FR.push(s);const al=()=>FR.pop(),fr=a=>{for(const s of a)FR.push(s);},ls=(i,a)=>Q.v(i).set(a);
  defl.forEach((v,d)=>{const s=al();vw(s).set(v);Q.v(4)[d]=s;});
  const A=async s=>{const d=al();if(ops&&ops.A)vw(d).set(await ops.A(vw(s)));else{mv(Ls,vw(s),vw(d));H.lb_fx(d);}return d;},T=async s=>{if(ops)vw(s).set(await ops.prec(vw(s)));else if(mg)vcycle(Ls,vw(s),vw(s));else H.lb_dg(s);H.lb_cl(s);return s;},all=async(V,f)=>{const o=[];for(const v of V)o.push(await f(v));return o;};
  const orth=(V,AV,B,AB)=>{ls(5,V);AV&&ls(6,AV);ls(7,B);AB&&ls(8,AB);const k=H.lb_orth(V.length,AV?1:0,B.length),K=Q.v(11).slice(0,k),oV=[],oA=[],kp=new Uint8Array(V.length);for(const j of K){kp[j]=1;oV.push(V[j]);AV&&oA.push(AV[j]);}for(let j=0;j<V.length;j++)if(!kp[j]){FR.push(V[j]);AV&&FR.push(AV[j]);}return[oV,oA];};
  const rr=(S,AS,keepP)=>{const m=S.length,k=Math.min(bs,m),o=[];for(let i=0;i<(keepP?4:2)*k;i++)o.push(al());ls(5,S);ls(6,AS);ls(7,o.slice(0,2*k));keepP&&ls(8,o.slice(2*k));H.lb_rr(m,keepP,k);fr(S);fr(AS);return{X:o.slice(0,k),AX:o.slice(k,2*k),P:keepP?o.slice(2*k,3*k):[],AP:keepP?o.slice(3*k):[],lam:Array.from(Q.v(9).subarray(0,k))};};
  let X=[];for(let j=0;j<bs;j++){const s=al();H.lb_rnd(s);H.lb_cl(s);X.push(await T(s));}
  [X]=orth(X,null,[],null);let AX=await all(X,A),P=[],AP=[],lam=[],res=[],it=0;
  ({X,AX,lam}=rr(X,AX,0));let best=null;const out=V=>V.map(s=>vw(s).slice());
  for(;it<maxIt;it++){
    const R=X.map(()=>al());ls(5,X);ls(6,AX);ls(7,R);H.lb_res(X.length);res=Array.from(Q.v(10).subarray(0,X.length));
    const worst=maxOf(res.slice(0,nev));if(prog&&it%2===0)prog(it,worst,'modal');if(worst<tol)break;if(!best||worst<best.w){const bx=X.map(s=>{const d=al();H.lb_cp(s,d);return d;});best&&fr(best.X);best={w:worst,lam:lam.slice(),X:bx,res:res.slice(),it};}else if(best.w<30*tol&&worst>20*best.w)return{lam:best.lam,X:out(best.X),iters:it,res:best.res};
    const ok=j=>res[j]>=tol*0.1;fr(R.filter((_,j)=>!ok(j)));let[W]=orth(await all(R.filter((_,j)=>ok(j)),T),null,X,null);const AW=await all(W,A);
    [P,AP]=orth(P,AP,[...X,...W],[...AX,...AW]);
    ({X,AX,P,AP,lam}=rr([...X,...W,...P],[...AX,...AW,...AP],X.length));
  }
  return{lam,X:out(X),iters:it,res};
}
async function modal(inp,P,prog){
  const{G,pos}=P,mat=inp.mat,nev=Math.max(1,Math.min(inp.modes||6,20)),K=keHex(mat.nu),Eh=mat.E*G.h;for(let i=0;i<576;i++)K[i]*=Eh;
  const dof=supportMask(inp,P,true),free=!dof.some(v=>v),t0=Date.now(),want=inp.solver||'auto',Ls=await setup(G,K,3,dof,null,inp.mg,want!=='cpu'),L=Ls[0],n=L.nn*3,Mv=new Float64Array(n),rho=(mat.rho||7850)*1e-12;
  for(let q=0;q<P.nn;q++)for(let c=0;c<3;c++)Mv[3*q+c]=L.fixed[3*q+c]?0:P.vol[q]*rho;
  const defl=free?rigidModes(P.nn,P.xyz,Mv):[];
  let ctx=null,gpuError;if(want!=='cpu'&&Ls.length>1&&(want==='gpu'||L.sc.length>(inp.gpuMin||15000))&&globalThis.navigator?.gpu)try{ctx=await gpuContext(Ls.all(),K,{nsw:NSW});if(!ctx)gpuError='WebGPU unavailable';}catch(e){gpuError=String(e.message||e);}
  om0(Ls);
  const lo={tol:inp.tol,maxIt:inp.maxIt};let E,gpu=!!ctx;try{E=await lobpcg(Ls,K,Mv,nev,defl,lo,prog,ctx);}catch(e){if(!ctx)throw e;gpuError=String(e.message||e);gpu=false;E=await lobpcg(Ls,K,Mv,nev,defl,lo,prog,null);}finally{ctx&&ctx.free();}
  const {c:cnt}=nodalField(G,L,null),lmax=maxOf([...E.lam.map(Math.abs),1e-30]);
  let mt=0;for(let q=0;q<P.nn;q++)mt+=P.vol[q]*rho;
  const modes=[],wire=voxSkin(G.nx,G.ny,G.nz,G.solid,P.xyz);let rigid=0;
  for(let j=0;j<E.lam.length&&modes.length<nev;j++){const lam=E.lam[j];if(lam<1e-7*lmax&&!free){rigid++;continue;}const x=E.X[j],u=new Float32Array(P.nn);let um=0;for(let q=0;q<P.nn;q++){u[q]=Math.hypot(x[3*q],x[3*q+1],x[3*q+2]);um=Math.max(um,u[q]);}
    const gm=[0,0,0];for(let q=0;q<P.nn;q++)for(let c=0;c<3;c++)gm[c]+=Mv[3*q+c]*x[3*q+c];
    const ux=new Float32Array(n);for(let i=0;i<n;i++)ux[i]=x[i]/(um||1);for(let q=0;q<P.nn;q++)u[q]/=um||1;
    const rec={f:Math.sqrt(Math.max(lam,0))/(2*Math.PI),omega:Math.sqrt(Math.max(lam,0)),res:E.res[j],meff:gm.map(g=>g*g/(mt||1)),vDisp:atVerts(G,L,ux,3,pos,cnt),u:dilate(G,cnt,[u])[0],wireU:skinU(wire,ux)};if(inp.keepVec)rec.vec=x.slice();modes.push(rec);}
  const m0=modes[0],vMag=new Float32Array(pos.length/3);if(m0)for(let q=0;q<vMag.length;q++)vMag[q]=Math.hypot(m0.vDisp[3*q],m0.vDisp[3*q+1],m0.vDisp[3*q+2]);
  return{type:'modal',modes,freqs:modes.map(m=>m.f),rigid:free?6:rigid,free,mass:mt*1000,vStress:vMag,vDisp:m0?m0.vDisp.slice():new Float32Array(pos.length),field:fieldOut(P,{vm:m0?m0.u.slice():new Float32Array(P.nn),u:m0?m0.u.slice():new Float32Array(P.nn)}),vmMax:1,vmP99:1,uMax:1,...gridOut(P),nDof:n,iters:E.iters,rel:maxOf(E.res.slice(0,nev)),levels:Ls.length,ms:Date.now()-t0,backend:gpu?'gpu':'cpu',gpuError,wire,...(inp.keepVec?{Mv,L,cnt}:{})};
}
const SIGMA=5.670374419e-8;
async function thermal(inp,P,prog){
  const{G,pos}=P,mat=inp.mat||{},ck=condK(mat,inp.matKey),k=ck.k*1e-3,K=keHeat();for(let i=0;i<64;i++)K[i]*=k*G.h;
  const nn=P.nn,temps=inp.temps||[],conv=inp.conv||[],flux=inp.flux||[],rad=inp.rad||[],useC=!!(inp.transient||(inp.steps|0)>1),steps=Math.max(1,useC?(inp.steps|0||20):1),dt=inp.dt||1,rho=(mat.rho||2700)*1e-9,cp=mat.cp||900;
  const C=new Float64Array(nn);if(useC)for(let n=0;n<nn;n++)C[n]=P.vol[n]*rho*cp;
  const areas={temps:temps.map(b=>P.at(b.faces)),conv:conv.map(b=>P.at(b.faces)),flux:flux.map(b=>P.at(b.faces)),rad:rad.map(b=>P.at(b.faces))};
  if(!temps.length&&!conv.length&&!rad.length&&!inp.terms)throw new Error('add a fixed-temperature, convection or radiation face');
  const T0=inp.T0!=null?+inp.T0:(conv[0]&&conv[0].Tinf!=null?conv[0].Tinf:20);let Told=new Float64Array(nn);Told.fill(T0);
  const once=async(Tprev,s)=>{
    const fixed=new Uint8Array(nn),u0=new Float64Array(nn),f=new Float64Array(nn),dadd=new Float64Array(nn),tg=new Int16Array(nn).fill(-1);
    temps.forEach((b,bi)=>{for(const n of areas.temps[bi].keys()){fixed[n]=1;u0[n]=b.T;tg[n]=bi;}});
    const cv=areas.conv.map((acc,i)=>{const hc=(conv[i].h||10)*1e-6;for(const[n,v]of acc){dadd[n]+=hc*v[0];f[n]+=hc*v[0]*(conv[i].Tinf??20);}return acc;});
    areas.rad.forEach((acc,i)=>{const eps=rad[i].eps!=null?+rad[i].eps:0.8,Ti=rad[i].Tinf??20;for(const[n,v]of acc){const Tn=Tprev[n]||Ti,hr=eps*SIGMA*(Tn*Tn+Ti*Ti)*(Tn+Ti)*1e-6;dadd[n]+=hr*v[0];f[n]+=hr*v[0]*Ti;}});
    const qin=areas.flux.map((acc,i)=>{let tot=0;for(const v of acc.values())tot+=v[0];let Q=0;for(const[n,v]of acc){const q=flux[i].Q!=null?flux[i].Q*v[0]/(tot||1):(flux[i].q||0)*v[0];f[n]+=q;Q+=q;}return Q;});
    let qv=0;if(inp.Qvol){let vt=0;for(let n=0;n<nn;n++)vt+=P.vol[n];for(let n=0;n<nn;n++){const q=inp.Qvol*P.vol[n]/(vt||1);f[n]+=q;}qv=inp.Qvol;}if(inp.qNode){for(let n=0;n<nn;n++){f[n]+=inp.qNode[n];qv+=inp.qNode[n];}}if(inp.terms){const t=inp.terms(s,Tprev,P.vol);for(let n=0;n<nn;n++){dadd[n]+=t.d[n];f[n]+=t.q[n];}}
    if(useC)for(let n=0;n<nn;n++)if(C[n]&&!fixed[n]){const a=C[n]/dt;dadd[n]+=a;f[n]+=a*Tprev[n];}
    const Ls=await setup(G,K,1,fixed,dadd,inp.mg),L=Ls[0],y=new Float64Array(nn);mv(Ls,u0,y);const b=new Float64Array(nn);for(let n=0;n<nn;n++)b[n]=L.fixed[n]?0:f[n]-y[n];
    const S=await solve(Ls,K,b,{tol:inp.tol||1e-7,mg:inp.mg,solver:'cpu',phase:'thermal'},prog),Tn=new Float64Array(nn);for(let n=0;n<nn;n++)Tn[n]=S.u[n]+u0[n];
    return{Tn,S,Ls,L,f,tg,cv,qin,qv};
  };
  const t0=Date.now(),pic=rad.length?7:1,hist=[];let last=null,T=Told;
  for(let s=0;s<steps;s++){let guess=Told;for(let p=0;p<pic;p++){last=await once(guess,s);guess=last.Tn;}T=last.Tn;Told=T;inp.onStep&&inp.onStep(s,T);let a=Infinity,b=-Infinity;for(let n=0;n<nn;n++){a=Math.min(a,T[n]);b=Math.max(b,T[n]);}hist.push({t:useC?(s+1)*dt:0,Tmin:a,Tmax:b});}
  const{S,Ls,L,f,tg,cv,qin,qv}=last,y=new Float64Array(nn);mv(Ls,T,y,true);const qT=temps.map(()=>0);for(let n=0;n<nn;n++)if(tg[n]>=0)qT[tg[n]]+=y[n]-f[n];
  const qc=cv.map((acc,i)=>{let s=0;const hc=(conv[i].h||10)*1e-6,Ti=conv[i].Tinf??20;for(const[n,v]of acc)s+=hc*v[0]*(Ti-T[n]);return s;});
  const qr=rad.map((b,i)=>{let s=0;const eps=b.eps!=null?+b.eps:0.8,Ti=b.Tinf??20;for(const[n,v]of areas.rad[i]){const hr=eps*SIGMA*(T[n]*T[n]+Ti*Ti)*(T[n]+Ti)*1e-6;s+=hr*v[0]*(Ti-T[n]);}return s;});
  const{c:cnt}=nodalField(G,L,null),TN=new Float32Array(nn);let Tmin=Infinity,Tmax=-Infinity;for(let n=0;n<nn;n++)if(cnt[n]){TN[n]=T[n];Tmin=Math.min(Tmin,T[n]);Tmax=Math.max(Tmax,T[n]);}
  const vT=atVerts(G,L,TN,1,pos,cnt);dilate(G,cnt,[TN]);
  return{type:'thermal',transient:useC,radiation:!!rad.length,hist,wire:(w=>(w.vm=Float32Array.from(w.nodes,n=>TN[n]),w))(voxSkin(G.nx,G.ny,G.nz,G.solid,P.xyz)),vT,vStress:vT,vDisp:new Float32Array(pos.length),field:fieldOut(P,{T:TN,vm:TN,u:TN}),Tmin,Tmax,vmMax:Tmax,vmP99:Tmax,uMax:0,Q:{fixed:qT,conv:qc,flux:qin,rad:qr,vol:qv},balance:qT.reduce((a,c)=>a+c,0)+qc.reduce((a,c)=>a+c,0)+qin.reduce((a,c)=>a+c,0)+qr.reduce((a,c)=>a+c,0)+qv,k:k*1e3,warn:ck.warn,...gridOut(P),nDof:nn,iters:S.iters,rel:S.rel,levels:Ls.length,ms:Date.now()-t0,backend:S.backend,...(inp.keepT?{T,vol:P.vol}:{})};
}
async function voxelThermal(P,T,mat,alpha,Tref){
  const u=new Float64Array(P.nn*3);for(let n=0;n<P.nn;n++){const x=P.xyz(n),eth=alpha*((T[n]||0)-(Tref||0));u[3*n]=eth*x[0];u[3*n+1]=eth*x[1];u[3*n+2]=eth*x[2];}
  const K=keHex(mat.nu);for(let i=0;i<576;i++)K[i]*=mat.E*P.G.h;const Ls=await setup(P.G,K,3,new Uint8Array(P.nn*3),null,true),ku=new Float64Array(u.length);mv(Ls,u,ku,true);return ku;
}
async function tstress(inp,P,prog){
  const mat=inp.mat||{},alpha=(mat.cte||0)*1e-6,Tref=inp.Tref!=null?+inp.Tref:20;if(!(alpha>0)||!(mat.E>0))throw new Error('the material needs a thermal expansion coefficient and a modulus');
  let T,th=null;if(inp.Tuniform!=null){T=new Float64Array(P.nn);T.fill(+inp.Tuniform);}else{th=await thermal({...inp,keepT:true,type:'thermal'},P,prog);T=th.T;}
  const ft=await voxelThermal(P,T,mat,alpha,Tref),r=await statik({...inp,nodalF:ft,keepU:true,fields:inp.fields!==false},P,prog),ts=voxelStress(P,r.u,mat,T,alpha,Tref);let Tmin=Infinity,Tmax=-Infinity;for(const v of T){Tmin=Math.min(Tmin,v);Tmax=Math.max(Tmax,v);}
  const wire=r.wire;if(wire)wire.vm=Float32Array.from(wire.nodes,n=>ts.vm[n]||0);if(r.field){r.field.vm=ts.vm;r.field.p1=ts.p1;}
  return{...r,u:undefined,type:'tstress',vStress:ts.vStress||r.vStress,vmMax:ts.vmMax,vmP99:ts.vmAway||ts.vmMax,p1Max:ts.p1Max,trescaMax:ts.trescaMax,Tmin,Tmax,Tref,alpha,k:th&&th.k,warn:th&&th.warn,legendTitle:'Von Mises from temperature (MPa)',legendUnit:'stress'};
}
function voxelStress(P,u,mat,T,alpha,Tref){
  const G=P.G,DB=bCenter(mat.nu),s=mat.E/G.h,NX=P.NX,NY=P.NY,vm=new Float32Array(P.nn),p1=new Float32Array(P.nn),tr=new Float32Array(P.nn),cc=new Uint16Array(P.nn),ue=new Float64Array(24);
  const lam=mat.E*mat.nu/((1+mat.nu)*(1-2*mat.nu)),mu=mat.E/(2*(1+mat.nu));
  for(let k=0;k<G.nz;k++)for(let j=0;j<G.ny;j++)for(let i=0;i<G.nx;i++){const e=(k*G.ny+j)*G.nx+i;if(!G.solid[e])continue;
    const nd=[(k*NY+j)*NX+i,(k*NY+j)*NX+i+1,(k*NY+(j+1))*NX+i+1,(k*NY+(j+1))*NX+i,((k+1)*NY+j)*NX+i,((k+1)*NY+j)*NX+i+1,((k+1)*NY+(j+1))*NX+i+1,((k+1)*NY+(j+1))*NX+i];
    for(let a=0;a<8;a++){ue[3*a]=u[3*nd[a]];ue[3*a+1]=u[3*nd[a]+1];ue[3*a+2]=u[3*nd[a]+2];}
    const S6=[0,0,0,0,0,0];for(let r=0;r<6;r++){let t=0;for(let c=0;c<24;c++)t+=DB[r][c]*ue[c];S6[r]=t*s;}
    let Te=0;for(const n of nd)Te+=T[n]||0;const eth=alpha*(Te/8-(Tref||0));if(eth){const trE=3*eth,sx=lam*trE+2*mu*eth;S6[0]-=sx;S6[1]-=sx;S6[2]-=sx;}
    const m=principals(S6);for(const n of nd){vm[n]+=m.vm;p1[n]+=m.p1;tr[n]+=m.tresca;cc[n]++;}}
  let vmMax=0,vmAway=0,p1Max=-Infinity,trMax=0;for(let n=0;n<P.nn;n++)if(cc[n]){vm[n]/=cc[n];p1[n]/=cc[n];tr[n]/=cc[n];vmMax=Math.max(vmMax,vm[n]);p1Max=Math.max(p1Max,p1[n]);trMax=Math.max(trMax,tr[n]);vmAway=vmMax;}
  return{vm,p1,vmMax,vmAway,p1Max,trescaMax:trMax};
}
export async function runFEA(inp,prog){
  const type=inp.type||'static';if(type==='acoustic'&&!inp.meshOnly)return(await import('./acoustic.js')).acousticRun(inp,prog);const P=prep(inp,type==='topo'?25000:type==='current'||type==='estatic'?60000:type==='modal'||type==='spectrum'?15000:type==='thermal'||type==='tstress'||type==='species'?60000:40000);if(inp.meshOnly){const G=P.G;return{type:'mesh',wire:voxSkin(G.nx,G.ny,G.nz,G.solid,P.xyz),nEl:P.nAct,h:P.h,...gridOut(P)};}
  if(type==='species')return(await import('./species.js')).speciesRun(inp,P,prog,thermal);
  if(type==='spectrum')return(await import('./spectrum.js')).spectrumRun(inp,P,prog,{modal,atVerts,dilate,fieldOut,gridOut});if(type==='drop')return(await import('./drop.js')).dropRun(inp,P,prog,{atVerts,dilate,fieldOut,gridOut});
  if(type==='topo')return topoVoxel(inp,P,prog);
  if(type==='current'||type==='estatic')return emVoxel(inp,P,prog);
  if(type==='buckle')return buckleVoxel(inp,P,prog);
  if(type==='psd')return psdVoxel(inp,P,prog);
  if(type==='fatigue')return fatigueVoxel(inp,P,prog);
  if(type==='harmonic')return harmonicVoxel(inp,P,prog);
  if(type==='transient')return transientVoxel(inp,P,prog);
  return type==='modal'?modal(inp,P,prog):type==='thermal'?thermal(inp,P,prog):type==='tstress'?tstress(inp,P,prog):statik(inp,P,prog);
}
async function harmonicVoxel(inp,P,prog){
  const modalR=await modal({...inp,keepVec:true,modes:Math.max(1,Math.min(inp.modes||4,8))},P,prog),{f}=loadVec(inp,P,inp.mat),rho=(inp.mat.rho||7850)*1e-12,zeta=inp.zeta!=null?+inp.zeta:0.02;
  const modes=modalR.modes.filter(m=>m.vec).map(m=>{let s=0;const x=m.vec;for(let q=0;q<P.nn;q++){const mv=P.vol[q]*rho;if(mv)s+=mv*(x[3*q]**2+x[3*q+1]**2+x[3*q+2]**2);}const sc=1/Math.sqrt(s||1);let mf=0;for(let i=0;i<x.length;i++)mf+=x[i]*sc*(f[i]||0);return{f:m.f,omega:m.omega,mf,sc,vec:x};});
  const f0=inp.f0!=null?+inp.f0:1,f1=inp.f1||(modes[0]?modes[0].f*0.5:10),np=Math.max(2,inp.nFreq||8),curve=[];
  const ampAt=hz=>{const w=2*Math.PI*hz;let m=0;
    for(let q=0;q<P.nn;q++){let x=0,y=0,z=0,xi=0,yi=0,zi=0;for(const md of modes){const qq=frf(md.mf,md.omega,w,zeta),c=md.sc;x+=qq.re*c*md.vec[3*q];y+=qq.re*c*md.vec[3*q+1];z+=qq.re*c*md.vec[3*q+2];xi+=qq.im*c*md.vec[3*q];yi+=qq.im*c*md.vec[3*q+1];zi+=qq.im*c*md.vec[3*q+2];}m=Math.max(m,Math.hypot(x,y,z,xi,yi,zi));}return m;};
  for(let i=0;i<np;i++){const hz=f0+(f1-f0)*i/(np-1);curve.push({f:hz,amp:ampAt(hz)});}
  const at=inp.at||f0,a0=ampAt(at);
  return{...modalR,modes:modes.map(m=>({f:m.f,omega:m.omega,mf:m.mf})),type:'harmonic',curve,zeta,at,vmMax:a0,vmP99:a0,uMax:a0,legendTitle:'Displacement amplitude (mm)',legendUnit:'len',legendLo:0,legendHi:Math.max(a0,1e-9)};
}
async function transientVoxel(inp,P,prog){
  const modalR=await modal({...inp,keepVec:true,modes:Math.max(1,Math.min(inp.modes||4,8))},P,prog),{f}=loadVec(inp,P,inp.mat),rho=(inp.mat.rho||7850)*1e-12,z=inp.zeta||0;
  const modes=modalR.modes.filter(m=>m.vec).map(m=>{let s=0;const x=m.vec;for(let q=0;q<P.nn;q++){const mv=P.vol[q]*rho;if(mv)s+=mv*(x[3*q]**2+x[3*q+1]**2+x[3*q+2]**2);}const sc=1/Math.sqrt(s||1);let mf=0;for(let i=0;i<x.length;i++)mf+=x[i]*sc*(f[i]||0);return{omega:m.omega,f:m.f,mf,sc,vec:x};});
  const dt=inp.dt||(modes[0]&&modes[0].f?1/(40*modes[0].f):1e-4),steps=Math.max(4,Math.min(inp.steps|0||50,200));
  const hist=modalNewmark(modes.map(m=>m.omega),()=>modes.map(m=>m.mf),dt,steps,z);
  const amp=q=>{let m=0;for(let n=0;n<P.nn;n+=Math.max(1,P.nn/400|0)){let x=0,y=0,zz=0;for(let j=0;j<modes.length;j++){const c=q[j]*modes[j].sc;x+=c*modes[j].vec[3*n];y+=c*modes[j].vec[3*n+1];zz+=c*modes[j].vec[3*n+2];}m=Math.max(m,Math.hypot(x,y,zz));}return m;};
  const qstat=modes.map(m=>m.omega>1e-8?m.mf/(m.omega*m.omega):0);let peak=0,iat=0;hist.forEach((q,i)=>{const a=amp(q);if(a>peak){peak=a;iat=i;}});
  const ustat=amp(qstat);
  return{...modalR,modes:modalR.modes.map(m=>({f:m.f,omega:m.omega,meff:m.meff})),type:'transient',peak,staticAmp:ustat,dlf:ustat?peak/ustat:0,tPeak:(iat+1)*dt,dt,zeta:z,curve:hist.filter((_,i)=>i%Math.ceil(hist.length/30)===0).map((q,i)=>({t:(i+1)*dt,amp:amp(q)})),vmMax:peak,vmP99:peak,uMax:peak,legendTitle:'Transient displacement (mm)',legendUnit:'len'};
}
async function psdVoxel(inp,P,prog){
  const modalR=await modal({...inp,keepVec:false,modes:1},P,prog),f0=modalR.freqs&&modalR.freqs[0];if(!(f0>0))throw new Error('no elastic mode; add a support');
  const zeta=inp.zeta!=null?+inp.zeta:0.02,S0=inp.psd!=null?+inp.psd:1,rms=miles(f0,zeta,S0),peak=modalR.uMax||1,k=rms/peak;
  const scale=a=>a&&a.length?Float32Array.from(a,v=>v*k):a;
  return{...modalR,type:'psd',freq:f0,zeta,psd:S0,rms,uMax:rms,vmMax:rms,vmP99:rms,vDisp:scale(modalR.vDisp),vStress:scale(modalR.vStress),legendTitle:'RMS displacement (mm)',legendUnit:'len'};
}
const AXI={X:0,Y:1,Z:2};
async function topoVoxel(inp,P,prog){
  const mat=inp.mat,G=P.G,o=inp.topo||{},dof=supportMask(inp,P),{f,ap}=loadVec(inp,P,mat);if(!dof.some(Boolean))throw new Error('add at least one fixed face');if(!(inp.loads||[]).length&&!inp.accel&&!mat.g)throw new Error('add at least one load');
  const T=await TP({}),x=T.ex,ne=x.tp_grid(G.nx,G.ny,G.nz),mk=new Int32Array(ne),nk=new Int32Array(P.nn),vf=Math.min(0.95,Math.max(0.05,o.keep!=null?+o.keep:0.35)),iters=Math.max(3,Math.min(o.iters||40,200)),rmin=Math.max(1.5,o.member?+o.member/P.h:2);
  for(let e=0;e<ne;e++)mk[e]=G.solid[e]?1:0;for(let n=0;n<P.nn;n++)nk[n]=dof[3*n]||dof[3*n+1]||dof[3*n+2]||f[3*n]||f[3*n+1]||f[3*n+2]?1:0;
  T.put(9,mk);T.put(10,nk);T.put(4,keHex(mat.nu));T.put(5,[vf,o.penal||3,rmin,o.move||0.2,o.emin||1e-3,mat.E*P.h,AXI[o.axis]??-1,AXI[o.sym]??-1,G.ox,G.oy,G.oz,P.h,o.sharp??8,0.5,o.step||Math.max(3,Math.round(iters/5)),0]);
  const kept=x.tp_keep(Math.max(1,o.layers||2)),nd=x.tp_start();if(nd<8)throw new Error('nothing left to optimize: the supports and loads cover the whole part');
  const hist=[],t0=Date.now();let u0=null,it=0,c0=0,ch=1;
  for(;it<iters;it++){const S=await solveGrid(G,mat,dof,f,{tol:inp.tol||1e-3,mg:inp.mg,solver:inp.solver,gpuMin:inp.gpuMin,dens:Float32Array.from(T.v(12)),u0},null);T.put(3,S.u);const c=x.tp_sens();ch=x.tp_update();const st=T.get(6);c0||(c0=c);hist.push([+c.toFixed(4),+st[1].toFixed(4),+st[3].toFixed(4)]);prog&&prog(it+1,ch,'shape');u0=S.u;if(it>=Math.min(15,iters-1)&&ch<(o.tol||0.01)&&st[8]>=T.v(5)[12])break;}
  x.tp_mesh(o.iso||0.5,o.smooth??7);const st=T.get(6),pos=Float32Array.from(T.v(7)),idx=Uint32Array.from(T.v(11)),vol=x.tp_volume(),rho=mat.rho||7850;
  if(!idx.length)throw new Error('the optimized shape came out empty; keep more material');
  return{type:'topo',skin:{pos,idx,vm:Float32Array.from(T.v(13))},vStress:new Float32Array(inp.pos.length/3),legendLo:0,legendHi:1,legendUnit:'raw',dens:Float32Array.from(T.v(2)),keep:vf,volFrac:+st[1].toFixed(4),gray:+st[3].toFixed(4),compliance:+(hist.at(-1)?.[0]??0).toFixed(4),compliance0:+c0.toFixed(4),iters:hist.length,converged:ch<(o.tol||0.01),change:+ch.toFixed(4),hist,volume:vol,volume0:inp.volume,mass:vol*1e-9*rho,mass0:(inp.volume||0)*1e-9*rho,nDesign:nd,nKept:kept,member:rmin*P.h,ms:Date.now()-t0,applied:ap,legendTitle:'Load carried (relative)',...gridOut(P)};
}
async function emVoxel(inp,P,prog){
  const{G,pos}=P,cur=inp.type==='current',el=inp.elec||{},c=cur?(el.sigma||0)*1e-3:(el.er||1)*EPS0,nn=P.nn,K=keHeat(),volts=inp.volts||[],amps=cur?inp.amps||[]:[];
  if(!(c>0))throw new Error('this material does not conduct electricity; pick a metal or set a conductivity');
  if(!volts.length)throw new Error(cur?'add a voltage terminal (0 V for ground)':'add two electrodes');
  if(cur?volts.length+amps.length<2:volts.length<2)throw new Error(cur?'add a second terminal: another voltage or a current input':'add a second electrode');
  for(let i=0;i<64;i++)K[i]*=c*G.h;
  const av=volts.map(b=>P.at(b.faces)),aa=amps.map(b=>P.at(b.faces)),fixed=new Uint8Array(nn),u0=new Float64Array(nn),f=new Float64Array(nn),tg=new Int16Array(nn).fill(-1),t0=Date.now();
  const E=await EM({}),x=E.ex,ne=x.em_grid(G.nx,G.ny,G.nz),mk=new Int32Array(ne),EI=new Int32Array(nn).fill(-1),EN=new Float64Array(3*nn);for(let e=0;e<ne;e++)mk[e]=G.solid[e]?1:0;volts.forEach((b,bi)=>{for(const[n,v]of av[bi]){EI[n]=bi;EN[3*n]+=v[1];EN[3*n+1]+=v[2];EN[3*n+2]+=v[3];}});E.put(8,mk);E.put(9,Float64Array.from(G.frac));E.put(12,EI);E.put(10,EN);x.em_prep();const ei=E.get(12);for(let n=0;n<nn;n++)if(ei[n]>=0){fixed[n]=1;u0[n]=+volts[ei[n]].V||0;tg[n]=ei[n];}
  aa.forEach((acc,i)=>{let tot=0;for(const v of acc.values())tot+=v[0];for(const[n,v]of acc)f[n]+=(+amps[i].I||0)*v[0]/(tot||1);});
  const Ls=await setup(G,K,1,fixed,null,inp.mg,false,Float32Array.from(E.v(11))),L=Ls[0],y=new Float64Array(nn);mv(Ls,u0,y);const b=new Float64Array(nn);for(let n=0;n<nn;n++)b[n]=L.fixed[n]?0:f[n]-y[n];
  const S=await solve(Ls,K,b,{tol:inp.tol||1e-9,mg:inp.mg,solver:'cpu',phase:cur?'current':'field'},prog),V=new Float64Array(nn);for(let n=0;n<nn;n++)V[n]=S.u[n]+u0[n];
  mv(Ls,V,y,true);const It=volts.map(()=>0);for(let n=0;n<nn;n++)if(tg[n]>=0)It[tg[n]]+=y[n]-f[n];
  const Va=aa.map(acc=>{let s=0,w=0;for(const[n,v]of acc){s+=V[n]*v[0];w+=v[0];}return w?s/w:0;}),terms=[...volts.map((t,i)=>({kind:'voltage',V:+t.V||0,I:It[i]})),...amps.map((t,i)=>({kind:'current',V:Va[i],I:+t.I||0}))];
  E.put(5,[G.h,c,4096,0,0,0,0,0]);E.put(1,V);const sum=x.em_fields(),st=E.get(6);
  const Vs=terms.map(t=>t.V),dV=Math.max(...Vs)-Math.min(...Vs),Iin=terms.reduce((a,t)=>a+Math.max(0,t.I),0),Pw=terms.reduce((a,t)=>a+t.V*t.I,0),sc=cur?1:1e-3,{c:cnt}=nodalField(G,L,null),NF=new Float32Array(nn),VN=new Float32Array(nn),nf=E.v(3);
  for(let n=0;n<nn;n++){NF[n]=nf[n]*(cur?c:sc);VN[n]=V[n];}const vF=atVerts(G,L,NF,1,pos,cnt),vV=atVerts(G,L,VN,1,pos,cnt);dilate(G,cnt,[NF,VN]);
  const hi=st[1]*(cur?c:sc)||st[0]*(cur?c:sc)||1,ds=el.ds,Ep=st[1]*sc,views={F:{v:vF,f:NF,lo:0,hi,title:cur?'Current density (A/mm²)':'Electric field (kV/mm)'},V:{v:vV,f:VN,lo:Math.min(...Vs),hi:Math.max(...Vs)>Math.min(...Vs)?Math.max(...Vs):Math.min(...Vs)+1,title:'Voltage (V)'}};
  let th=null;if(cur&&((inp.conv||[]).length||(inp.temps||[]).length||(inp.rad||[]).length)){const q=E.v(4),k=sum>0?Pw/sum:0,qNode=new Float64Array(nn);for(let n=0;n<nn;n++)qNode[n]=q[n]*k;th=await thermal({...inp,type:'thermal',flux:[],Qvol:0,qNode},P,prog);views.T={v:th.vT,f:th.field.T,lo:th.Tmin,hi:th.Tmax>th.Tmin?th.Tmax:th.Tmin+1,title:'Temperature (°C)'};}
  const out={type:inp.type,views,view:"F",vStress:vF,vDisp:new Float32Array(pos.length),legendTitle:views.F.title,legendLo:0,legendHi:hi,legendUnit:'raw',vmP99:hi,vmMax:st[0]*(cur?c:sc),uMax:0,terminals:terms,dV,field:fieldOut(P,{vm:NF,T:th?th.field.T:VN,u:VN}),elec:el,...gridOut(P),nDof:nn,iters:S.iters,rel:S.rel,levels:Ls.length,ms:Date.now()-t0,backend:S.backend};
  return cur?{...out,I:Iin,R:Iin>0?dV/Iin:null,P:Pw,Jmax:out.vmMax,Jp99:hi,Jmean:st[4]*c,...(th?{Tmin:th.Tmin,Tmax:th.Tmax,vT:th.vT,Q:th.Q,heatBalance:th.balance}:{})}:{...out,Q:Iin,C:dV>0?Iin/dV:null,W:Pw/2,Emax:out.vmMax,Ep99:Ep,Emean:st[4]*sc,ds,sf:ds&&Ep>0?ds/Ep:null};
}
async function buckleVoxel(inp,P,prog){
  const mat=inp.mat,dof=supportMask(inp,P),{f,ap}=loadVec(inp,P,mat);if(!dof.some(Boolean))throw new Error('add at least one fixed face');
  const S=await solveGrid(P.G,mat,dof,f,{tol:inp.tol||1e-7,solver:'cpu',mg:inp.mg},prog),X=new Float64Array(P.nn*3);
  for(let n=0;n<P.nn;n++){const q=P.xyz(n);X[3*n]=q[0];X[3*n+1]=q[1];X[3*n+2]=q[2];}
  const E=S.L0.E,sig=S.sig,nd=f.length,x=new Float64Array(nd),ne=sig.length/6,sc=S.L0.sc,ax=Math.abs(ap[1])>Math.abs(ap[0])&&Math.abs(ap[1])>=Math.abs(ap[2])?1:Math.abs(ap[2])>Math.abs(ap[0])?2:0,slab=new Map();
  for(let q=0;q<ne;q++){let c0=0;for(let a=0;a<8;a++)c0+=X[3*E[q*8+a]+ax];c0/=8;const k=Math.round(c0/P.h),g=slab.get(k)||[0,0,0,0,0,0,0];for(let c=0;c<6;c++)g[c]+=sig[q*6+c];g[6]++;slab.set(k,g);}
  for(let q=0;q<ne;q++){let c0=0;for(let a=0;a<8;a++)c0+=X[3*E[q*8+a]+ax];const g=slab.get(Math.round(c0/8/P.h)),w=sc[q]||1;for(let c=0;c<6;c++)sig[q*6+c]=c===ax?w*g[c]/g[6]:0;}
  for(let i=0;i<nd;i++)x[i]=dof[i]||i%3===ax?0:Math.sin((i%97)*0.17);
  let lam=0,prev=0,it=0;
  for(;it<7;it++){
    const gx=kgMul(X,E,sig,x);for(let i=0;i<nd;i++)gx[i]=dof[i]?0:-gx[i];
    const Y=await solveGrid(P.G,mat,dof,gx,{tol:1e-7,solver:'cpu',mg:inp.mg},prog),y=Y.u,gy=kgMul(X,E,sig,y);
    let num=0,den=0;for(let i=0;i<nd;i++){const g=dof[i]?0:-gy[i];num+=y[i]*gx[i];den+=y[i]*g;}
    lam=den?num/den:0;let m=0;for(let i=0;i<nd;i++)m=Math.max(m,Math.abs(y[i]));if(!(m>0))break;
    for(let i=0;i<nd;i++)x[i]=y[i]/m;if(it>1&&Math.abs(lam-prev)<1e-3*Math.max(1,Math.abs(lam))){it++;break;}prev=lam;
  }
  const Pref=Math.hypot(ap[0],ap[1],ap[2])||1
  return{type:'buckle',factor:lam,Pcr:lam*Pref,Pref,iters:it,applied:ap,vmMax:1,vmP99:1,uMax:1,nEl:ne,...gridOut(P),legendTitle:'Buckling mode (relative)',legendUnit:'raw'};
}
async function fatigueVoxel(inp,P,prog){
  const r=await statik({...inp,fields:1},P,prog),sn=inp.mat&&(inp.mat.sn||snOf(inp.mat));if(!sn)throw new Error('no fatigue data for this material');
  const sig=r.nodeVm||r.field&&r.field.vm||r.p1,fat=fatigueField(sig,sn,{corr:inp.corr||'goodman',mean:inp.mean,hist:inp.hist,repeats:inp.repeats||1});let sMax=0;if(sig)for(const v of sig)sMax=Math.max(sMax,v);
  const life=Float32Array.from(fat.life,v=>Math.log10(Math.max(isFinite(v)?v:1e12,1))),lo=Math.log10(Math.max(fat.lifeMin,1));
  return{...r,type:'fatigue',stressP99:sMax,stressMax:sMax,lifeMin:fat.lifeMin,damageMax:fat.damageMax,sfMin:fat.sfMin,corr:inp.corr||'goodman',sn,vStress:life,vmMax:lo+3,vmP99:lo+3,legendTitle:'log10 cycles to crack initiation',legendUnit:'raw',legendLo:lo,legendHi:lo+3,field:{...r.field,vm:life}};
}
function edt1(f,n,d,v,z){let k=0;v[0]=0;z[0]=-1e20;z[1]=1e20;for(let q=1;q<n;q++){let s;while(true){const p=v[k];s=((f[q]+q*q)-(f[p]+p*p))/(2*q-2*p);if(s<=z[k]&&k>0){k--;continue;}if(s<=z[k]){k--;}break;}k++;v[k]=q;z[k]=s;z[k+1]=1e20;}k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;const p=v[k];d[q]=(q-p)*(q-p)+f[p];}}
export function wallThickness(inp){
  const{pos,idx,bbox,volume,res}=inp,h=Math.cbrt(Math.max(volume,1e-9)/Math.max(4000,Math.min(res||60000,400000))),G=voxelize(pos,idx,{min:bbox.min.map(v=>v-2*h),max:bbox.max.map(v=>v+2*h)},h),{nx,ny,nz}=G,N=nx*ny*nz,INF=1e12,D=new Float64Array(N);
  for(let e=0;e<N;e++)D[e]=G.solid[e]?INF:0;
  const m=Math.max(nx,ny,nz),f=new Float64Array(m),d=new Float64Array(m),v=new Int32Array(m),z=new Float64Array(m+1);
  const pass=(len,stride,starts)=>{for(const s0 of starts){for(let q=0;q<len;q++)f[q]=D[s0+q*stride];edt1(f,len,d,v,z);for(let q=0;q<len;q++)D[s0+q*stride]=d[q];}};
  const sx=[],sy=[],sz=[];for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)sx.push((k*ny+j)*nx);for(let k=0;k<nz;k++)for(let i=0;i<nx;i++)sy.push(k*ny*nx+i);for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)sz.push(j*nx+i);
  pass(nx,1,sx);pass(ny,nx,sy);pass(nz,nx*ny,sz);
  let minT=Infinity,at=null,hist=[0,0,0,0,0,0,0,0];
  for(let k=1;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){const e=(k*ny+j)*nx+i;if(!G.solid[e])continue;const c=D[e];let ridge=true;for(let dk=-1;dk<=1&&ridge;dk++)for(let dj=-1;dj<=1&&ridge;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj&&!dk)continue;if(D[e+(dk*ny+dj)*nx+di]>c+1e-9){ridge=false;break;}}if(!ridge)continue;const t=2*Math.sqrt(c)*h-h;if(t<minT){minT=t;at=[G.ox+(i+0.5)*h,G.oy+(j+0.5)*h,G.oz+(k+0.5)*h];}hist[Math.min(7,Math.floor(t/(h*2)))]++;}
  return{minT:isFinite(minT)?minT:null,at,h};
}
