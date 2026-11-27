import {voxelize} from './fea.js';
import {sleep} from './tick.js';
import {helium,heliumSync} from './he/host.js';
const LB=helium('cfd_lbm');export const FLW=await heliumSync('flow_lbm');
export const EX=[0,1,-1,0,0,0,0,1,-1,1,-1,1,-1,1,-1,0,0,0,0],EY=[0,0,0,1,-1,0,0,1,-1,-1,1,0,0,0,0,1,-1,1,-1],EZ=[0,0,0,0,0,1,-1,0,0,0,0,1,-1,-1,1,1,-1,-1,1],OPP=[0,2,1,4,3,6,5,8,7,10,9,12,11,14,13,16,15,18,17],WQ=[1/3,1/18,1/18,1/18,1/18,1/18,1/18,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36];
export const FLUIDS={air:{n:'Air (20 °C)',rho:1.204,nu:1.516e-5},water:{n:'Water (20 °C)',rho:998,nu:1.004e-6}};
const AXI={'+X':[0,1],'-X':[0,-1],'+Y':[1,1],'-Y':[1,-1],'+Z':[2,1],'-Z':[2,-1]};
export async function gpuDevice(n0){if(typeof navigator==='undefined'||!navigator.gpu)return{why:'this browser has no WebGPU'};const need=Math.ceil(n0/256)*256;try{const ad=await navigator.gpu.requestAdapter({powerPreference:'high-performance'})||await navigator.gpu.requestAdapter();if(!ad)return{why:'WebGPU is present but no GPU adapter started (check chrome://gpu)'};const lim=Math.min(ad.limits.maxStorageBufferBindingSize,ad.limits.maxBufferSize),dev=await ad.requestDevice({requiredLimits:{maxStorageBufferBindingSize:Math.min(ad.limits.maxStorageBufferBindingSize,Math.max(need,1<<27)),maxBufferSize:Math.min(ad.limits.maxBufferSize,Math.max(need,1<<28)),maxComputeWorkgroupsPerDimension:ad.limits.maxComputeWorkgroupsPerDimension}});dev.info=ad.info||{};dev.cap=Math.floor(Math.min(lim,dev.limits.maxStorageBufferBindingSize,dev.limits.maxBufferSize)/76);return dev;}catch(e){return{why:'the GPU refused the solver ('+String(e.message||e).slice(0,120)+')'};}}
export function fillSolid(G,solid,F,passes=3){const N=G.nx*G.ny*G.nz,H=FLW(),X=H.ex,V=H.v;X.fl_fill_in(N,F.length);V(10).set(solid);F.forEach((f,q)=>V(11).set(f,q*N));X.fl_fill(G.nx,G.ny,G.nz,F.length,passes);const R=V(11);F.forEach((f,q)=>f.set(R.subarray(q*N,q*N+N)));}
export function frame(dir){const[k,s]=AXI[dir]||AXI['+X'],o=[0,1,2].filter(i=>i!==k);return{toL:p=>[s*p[k],p[o[0]],p[o[1]]],toW:q=>{const w=[0,0,0];w[k]=s*q[0];w[o[0]]=q[1];w[o[1]]=q[2];return w;},k,s,o};}
export function setup(inp){
  const{pos,idx,bbox,cells,dir}=inp,F=frame(dir),nv=pos.length/3,lp=new Float32Array(pos.length);
  for(let i=0;i<nv;i++){const q=F.toL([pos[3*i],pos[3*i+1],pos[3*i+2]]);lp[3*i]=q[0];lp[3*i+1]=q[1];lp[3*i+2]=q[2];}
  let mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];for(let i=0;i<nv;i++)for(let c=0;c<3;c++){mn[c]=Math.min(mn[c],lp[3*i+c]);mx[c]=Math.max(mx[c],lp[3*i+c]);}
  const D=Math.max(mx[1]-mn[1],mx[2]-mn[2],(mx[0]-mn[0])*0.5,1e-6),T=inp.tun||(cells>=1.5e6?[1.5,2,3.5]:[0.9,0.95,2.6]),dom={min:[mn[0]-T[0]*D,mn[1]-T[1]*D,mn[2]-T[1]*D],max:[mx[0]+T[2]*D,mx[1]+T[1]*D,mx[2]+T[1]*D]};
  const vol=(dom.max[0]-dom.min[0])*(dom.max[1]-dom.min[1])*(dom.max[2]-dom.min[2]),h=Math.cbrt(vol/cells);
  const G=voxelize(lp,idx,{min:[dom.min[0]+h/2,dom.min[1]+h/2,dom.min[2]+h/2],max:[dom.max[0]-h/2,dom.max[1]-h/2,dom.max[2]-h/2]},h);
  const solid=new Uint32Array(G.nx*G.ny*G.nz);for(let e=0;e<solid.length;e++)solid[e]=G.frac[e]>=0.5?1:0;
  const area=projArea(lp,idx,G),W=inp.links?links(lp,idx,G,solid):null;
  return{G,solid,F,h,D,area,partMin:mn,partMax:mx,W};
}
function projArea(lp,idx,G){const SS=4,hs=G.h/SS,NY=G.ny*SS,NZ=G.nz*SS,m=new Uint8Array(NY*NZ);let cnt=0;
  for(let t=0;t<idx.length;t+=3){const a=idx[t]*3,b=idx[t+1]*3,c=idx[t+2]*3,ay=lp[a+1],az=lp[a+2],by=lp[b+1],bz=lp[b+2],cy=lp[c+1],cz=lp[c+2],d=(bz-cz)*(ay-cy)+(cy-by)*(az-cz);if(Math.abs(d)<1e-12)continue;
    const j0=Math.max(0,Math.floor((Math.min(ay,by,cy)-G.oy)/hs)),j1=Math.min(NY-1,Math.floor((Math.max(ay,by,cy)-G.oy)/hs)),k0=Math.max(0,Math.floor((Math.min(az,bz,cz)-G.oz)/hs)),k1=Math.min(NZ-1,Math.floor((Math.max(az,bz,cz)-G.oz)/hs));
    for(let k=k0;k<=k1;k++){const pz=G.oz+(k+0.5)*hs;for(let j=j0;j<=j1;j++){const e=k*NY+j;if(m[e])continue;const py=G.oy+(j+0.5)*hs,l1=((bz-cz)*(py-cy)+(cy-by)*(pz-cz))/d,l2=((cz-az)*(py-cy)+(ay-cy)*(pz-cz))/d;if(l1>=0&&l2>=0&&l1+l2<=1){m[e]=1;cnt++;}}}}
  return cnt/(SS*SS);}
export function links(lp,idx,G,solid){const{nx,ny,nz,h}=G,o=[G.ox,G.oy,G.oz],N=[nx,ny,nz],n=nx*ny*nz,nt=idx.length/3,bins=new Map();
  for(let t=0;t<nt;t++){const a=idx[3*t]*3,b=idx[3*t+1]*3,c=idx[3*t+2]*3,lo=[],hi=[];for(let d=0;d<3;d++){lo[d]=Math.max(0,Math.floor((Math.min(lp[a+d],lp[b+d],lp[c+d])-o[d])/h));hi[d]=Math.min(N[d]-1,Math.floor((Math.max(lp[a+d],lp[b+d],lp[c+d])-o[d])/h));}
    const e1=[0,1,2].map(d=>lp[b+d]-lp[a+d]),e2=[0,1,2].map(d=>lp[c+d]-lp[a+d]),nm=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]],lim=0.87*h*(Math.hypot(...nm)||1);
    for(let k=lo[2];k<=hi[2];k++)for(let j=lo[1];j<=hi[1];j++)for(let i=lo[0];i<=hi[0];i++){if(Math.abs((o[0]+(i+0.5)*h-lp[a])*nm[0]+(o[1]+(j+0.5)*h-lp[a+1])*nm[1]+(o[2]+(k+0.5)*h-lp[a+2])*nm[2])>lim)continue;const e=i+nx*(j+ny*k);let l=bins.get(e);l||bins.set(e,l=[]);l.push(t);}}
  const cand=new Uint8Array(n);for(const e of bins.keys()){const i=e%nx,j=Math.floor(e/nx)%ny,k=Math.floor(e/(nx*ny));for(let dk=-1;dk<=1;dk++)for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const I=i+di,J=j+dj,K=k+dk;if(I<0||J<0||K<0||I>=nx||J>=ny||K>=nz)continue;const f=I+nx*(J+ny*K);solid[f]||(cand[f]=1);}}
  const hit=(t,O,V)=>{const a=idx[3*t]*3,b=idx[3*t+1]*3,c=idx[3*t+2]*3,e1x=lp[b]-lp[a],e1y=lp[b+1]-lp[a+1],e1z=lp[b+2]-lp[a+2],e2x=lp[c]-lp[a],e2y=lp[c+1]-lp[a+1],e2z=lp[c+2]-lp[a+2],px=V[1]*e2z-V[2]*e2y,py=V[2]*e2x-V[0]*e2z,pz=V[0]*e2y-V[1]*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-14)return 2;
    const iv=1/det,tx=O[0]-lp[a],ty=O[1]-lp[a+1],tz=O[2]-lp[a+2],u=(tx*px+ty*py+tz*pz)*iv;if(u<0||u>1)return 2;const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(V[0]*qx+V[1]*qy+V[2]*qz)*iv;if(v<0||u+v>1)return 2;const s=(e2x*qx+e2y*qy+e2z*qz)*iv;return s>=0&&s<=1?s:2;};
  const sq=Uint32Array.from(solid),Q=[],stamp=new Int32Array(nt).fill(-1),row=new Float32Array(19);let qn=0,K=0,cut=0;
  for(let c=0;c<n;c++){if(!cand[c])continue;const x=c%nx,y=Math.floor(c/nx)%ny,z=Math.floor(c/(nx*ny)),O=[o[0]+(x+0.5)*h,o[1]+(y+0.5)*h,o[2]+(z+0.5)*h];let any=0;row.fill(0);
    for(let i=1;i<19;i++){const sx=x-EX[i],sy=y-EY[i],sz=z-EZ[i];if(sx<0||sx>=nx||sy<0||sy>=ny||sz<0||sz>=nz)continue;const s=sx+nx*(sy+ny*sz),V=[-EX[i]*h,-EY[i]*h,-EZ[i]*h];qn++;let best=2;
      for(let kk=Math.min(z,sz);kk<=Math.max(z,sz);kk++)for(let jj=Math.min(y,sy);jj<=Math.max(y,sy);jj++)for(let ii=Math.min(x,sx);ii<=Math.max(x,sx);ii++){const l=bins.get(ii+nx*(jj+ny*kk));if(!l)continue;for(const t of l){if(stamp[t]===qn)continue;stamp[t]=qn;const q=hit(t,O,V);q<best&&(best=q);}}
      if(best<=1){row[i]=Math.max(best,1e-3);any=1;solid[s]||cut++;}else if(solid[s]){row[i]=0.5;any=1;}}
    if(any){sq[c]=2+K++;for(let i=0;i<19;i++)Q.push(row[i]);}}
  return{sq,Q:Float32Array.from(Q.length?Q:[0,0,0,0]),K,cut};}
const WGSL=`struct P{nx:u32,ny:u32,nz:u32,n:u32,tau:f32,u:f32,cs:f32,pad:f32,reg:f32,wx:u32,a:f32,b:f32};
@group(0)@binding(0) var<uniform> p:P;@group(0)@binding(1) var<storage,read> fa:array<f32>;@group(0)@binding(2) var<storage,read_write> fb:array<f32>;@group(0)@binding(3) var<storage,read> sol:array<u32>;@group(0)@binding(4) var<storage,read_write> frc:array<f32>;@group(0)@binding(5) var<storage,read_write> mac:array<f32>;@group(0)@binding(6) var<storage,read_write> avg:array<f32>;
@group(0)@binding(7) var<storage,read_write> fav:array<f32>;@group(0)@binding(8) var<storage,read> QB:array<f32>;
const EX=array<i32,19>(${EX});const EY=array<i32,19>(${EY});const EZ=array<i32,19>(${EZ});const OP=array<u32,19>(${OPP});const W=array<f32,19>(${WQ.map(v=>v.toFixed(9))});
fn feq(i:u32,r:f32,u:vec3f)->f32{let e=vec3f(f32(EX[i]),f32(EY[i]),f32(EZ[i]));let eu=dot(e,u);return W[i]*r*(1.+3.*eu+4.5*eu*eu-1.5*dot(u,u));}
@compute @workgroup_size(64) fn step(@builtin(global_invocation_id) g:vec3u){let c=g.x+g.y*p.wx;if(c>=p.n){return;}let x=i32(c%p.nx);let y=i32((c/p.nx)%p.ny);let z=i32(c/(p.nx*p.ny));let nx=i32(p.nx);let ny=i32(p.ny);let nz=i32(p.nz);let u0=vec3f(p.u,0.,0.);
if(sol[c]==1u){for(var i=0u;i<19u;i++){fb[i*p.n+c]=0.;}frc[3u*c]=0.;frc[3u*c+1u]=0.;frc[3u*c+2u]=0.;return;}
var f:array<f32,19>;var F=vec3f(0.);let sv=sol[c];var nw=false;
for(var i=0u;i<19u;i++){let sx=x-EX[i];let sy=(y-EY[i]+ny)%ny;let sz=(z-EZ[i]+nz)%nz;var q=0.;if(sv>=2u){q=QB[(sv-2u)*19u+i];}
if(sx<0){f[i]=feq(i,1.,u0);}else if(sx>=nx){f[i]=fa[i*p.n+c];}else{let s=u32(sx+nx*(sy+ny*sz));if(q>0.||sol[s]==1u){let fo=fa[OP[i]*p.n+c];var fw=fo;
if(q>0.&&q<0.5){let xn=x+EX[i];if(xn>=0&&xn<nx){let cn=u32(xn+nx*((y+EY[i]+ny)%ny+ny*((z+EZ[i]+nz)%nz)));if(sol[cn]!=1u){fw=2.*q*fo+(1.-2.*q)*fa[OP[i]*p.n+cn];}}}else if(q>=0.5){fw=(fo+(2.*q-1.)*fa[i*p.n+c])/(2.*q);}
nw=true;f[i]=fw;F+=(fo+fw)*vec3f(f32(EX[OP[i]]),f32(EY[OP[i]]),f32(EZ[OP[i]]));}else{f[i]=fa[i*p.n+s];}}}
var r=0.;var m=vec3f(0.);for(var i=0u;i<19u;i++){r+=f[i];m+=f[i]*vec3f(f32(EX[i]),f32(EY[i]),f32(EZ[i]));}
var u=m/max(r,1e-6);let us=length(u);if(us>0.3){u=u*(0.3/us);}if(x==0){r=1.;u=u0;}
var qxx=0.;var qyy=0.;var qzz=0.;var qxy=0.;var qxz=0.;var qyz=0.;for(var i=0u;i<19u;i++){let d=f[i]-feq(i,r,u);let ex=f32(EX[i]);let ey=f32(EY[i]);let ez=f32(EZ[i]);qxx+=d*ex*ex;qyy+=d*ey*ey;qzz+=d*ez*ez;qxy+=d*ex*ey;qxz+=d*ex*ez;qyz+=d*ey*ez;}
let Q=sqrt(qxx*qxx+qyy*qyy+qzz*qzz+2.*(qxy*qxy+qxz*qxz+qyz*qyz));let te=0.5*(p.tau+sqrt(p.tau*p.tau+18.*1.41421356*p.cs*p.cs*select(1.,p.a*p.a,nw)*Q/max(r,1e-6)));
let om=1.-1./te;for(var i=0u;i<19u;i++){let ex=f32(EX[i]);let ey=f32(EY[i]);let ez=f32(EZ[i]);let fe=feq(i,r,u);let fr=fe+om*W[i]*4.5*((ex*ex-1./3.)*qxx+(ey*ey-1./3.)*qyy+(ez*ez-1./3.)*qzz+2.*(ex*ey*qxy+ex*ez*qxz+ey*ez*qyz));var o=select(f[i]-(f[i]-fe)/te,fr,p.reg>0.);if(x==0){o=feq(i,1.,u0);}fb[i*p.n+c]=o;}
frc[3u*c]=F.x;frc[3u*c+1u]=F.y;frc[3u*c+2u]=F.z;mac[4u*c]=r;mac[4u*c+1u]=u.x;mac[4u*c+2u]=u.y;mac[4u*c+3u]=u.z;if(p.pad>0.){avg[4u*c]+=r;avg[4u*c+1u]+=u.x;avg[4u*c+2u]+=u.y;avg[4u*c+3u]+=u.z;if(any(F!=vec3f(0.))){fav[3u*c]+=F.x;fav[3u*c+1u]+=F.y;fav[3u*c+2u]+=F.z;}}}`;
function sumF(frc){let x=0,y=0,z=0;for(let i=0;i<frc.length;i+=3){x+=frc[i];y+=frc[i+1];z+=frc[i+2];}return[x,y,z];}
const forceLive=f=>{if(!f)return false;for(let i=0;i<f.length;i++)if(f[i]!==0)return true;return false;};
export async function runCFD(inp,prog,shouldStop){if(inp&&forceLive(inp.force))return (await import('./ehd.js')).runForced(inp,prog,shouldStop);const t0=Date.now(),now=()=>performance.now();inp.gpu!==false&&prog&&prog({stage:'Starting the GPU'});const gd=inp.gpu!==false?await gpuDevice(Math.ceil(inp.cells*1.15)*76):{why:'CPU was chosen'},gpu=gd&&gd.createBuffer?gd:null,why=gpu?'':gd.why,cpuOnly=!gpu&&inp.gpu!==false,fit=gpu?Math.min(inp.cells,Math.floor(Math.min(gpu.cap,inp.maxCells||3e7,((typeof navigator!=='undefined'&&navigator.deviceMemory)||8)*3.5e6)/1.15)):inp.cpuCells||inp.cells;prog&&prog({stage:'Building the tunnel grid'+(cpuOnly?' (on the CPU at a coarser grid: '+why+')':fit<inp.cells?' (trimmed to '+Math.round(fit/1000)+'k cells to fit this GPU)':'')});
  const S=setup({...inp,cells:fit,links:inp.wall!=='bb'}),{G,solid}=S,n=G.nx*G.ny*G.nz,fl=FLUIDS[inp.fluid]||FLUIDS.air,U=inp.speed||10,Dm=S.D*1e-3,Re=U*Dm/fl.nu;
  const ulb=inp.ulb||(gpu?0.06:0.08),Dc=S.D/S.h,nulb=ulb*Dc/Re,tau=Math.max(0.5+3*nulb,inp.tauMin||0.5005),steps=Math.round((inp.flows||3)*G.nx/ulb),cs=0.17;
  let H,L,hist=[],mac,frcSum=[0,0,0],fMean=null,backend,tS=now();const live=m=>{if(!inp.live||now()-tS<1500)return null;tS=now();return fin(m);};
  if(gpu){backend='WebGPU';const dev=gpu,mk=(sz,u)=>dev.createBuffer({size:Math.max(16,sz),usage:u}),SU=GPUBufferUsage;
    const ub=mk(48,SU.UNIFORM|SU.COPY_DST),fa=mk(n*76,SU.STORAGE|SU.COPY_DST|SU.COPY_SRC),fb=mk(n*76,SU.STORAGE|SU.COPY_DST|SU.COPY_SRC),sb=mk(n*4,SU.STORAGE|SU.COPY_DST),frc=mk(n*12,SU.STORAGE|SU.COPY_SRC),mb=mk(n*16,SU.STORAGE|SU.COPY_SRC),rb=mk(n*16,SU.MAP_READ|SU.COPY_DST),ab=mk(n*16,SU.STORAGE|SU.COPY_SRC|SU.COPY_DST),fv=mk(n*12,SU.STORAGE|SU.COPY_SRC|SU.COPY_DST),rf=mk(n*12,SU.MAP_READ|SU.COPY_DST),QW=S.W?S.W.Q:new Float32Array(4),qb=mk(QW.byteLength,SU.STORAGE|SU.COPY_DST);
    const pa=new ArrayBuffer(48),pu=new Uint32Array(pa),pf=new Float32Array(pa);pf[8]=inp.reg===false?0:1;pu[0]=G.nx;pu[1]=G.ny;pu[2]=G.nz;pu[3]=n;pf[4]=tau;pf[5]=ulb;pf[6]=cs;pf[10]=inp.wallCs??1;dev.queue.writeBuffer(ub,0,pa);dev.queue.writeBuffer(sb,0,S.W?S.W.sq:solid);dev.queue.writeBuffer(qb,0,QW);
    const fi=new Float32Array(n);for(let i=0;i<19;i++){const e=EX[i]*ulb,w=Math.fround(WQ[i]*(1+3*e+4.5*e*e-1.5*ulb*ulb));for(let c=0;c<n;c++)fi[c]=solid[c]?0:w;dev.queue.writeBuffer(fa,i*n*4,fi);dev.queue.writeBuffer(fb,i*n*4,fi);}
    prog&&prog({stage:'Compiling the GPU solver'});const mod=dev.createShaderModule({code:WGSL}),pipe=await dev.createComputePipelineAsync({layout:'auto',compute:{module:mod,entryPoint:'step'}});
    const bg=(a,b)=>dev.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:ub}},{binding:1,resource:{buffer:a}},{binding:2,resource:{buffer:b}},{binding:3,resource:{buffer:sb}},{binding:4,resource:{buffer:frc}},{binding:5,resource:{buffer:mb}},{binding:6,resource:{buffer:ab}},{binding:7,resource:{buffer:fv}},{binding:8,resource:{buffer:qb}}]});
    const B=[bg(fa,fb),bg(fb,fa)],wg=Math.ceil(n/64),gx=Math.min(wg,65535),gy=Math.ceil(wg/65535);
    pu[9]=gx*64;dev.queue.writeBuffer(ub,0,pa);
    let chunk=7,s=0,nAvg=0,tR=0;const accFrom=Math.floor(steps*(inp.acc||0.5));
    while(s<steps&&!(shouldStop&&shouldStop())){if(s>=accFrom&&!pf[7]){pf[7]=1;dev.queue.writeBuffer(ub,0,pa);}const enc=dev.createCommandEncoder(),k=Math.min(chunk,steps-s),tc=now();if(s>=accFrom)nAvg+=k;for(let j=0;j<k;j++){const ps=enc.beginComputePass();ps.setPipeline(pipe);ps.setBindGroup(0,B[(s+j)&1]);ps.dispatchWorkgroups(gx,gy);ps.end();}s+=k;
      const rd=s>=steps||tc-tR>700,sn=inp.live&&s<steps&&tc-tS>1500;rd&&enc.copyBufferToBuffer(frc,0,rf,0,n*12);sn&&enc.copyBufferToBuffer(mb,0,rb,0,n*16);dev.queue.submit([enc.finish()]);
      if(rd){await rf.mapAsync(GPUMapMode.READ);frcSum=sumF(new Float32Array(rf.getMappedRange()));rf.unmap();tR=now();hist.push([s,frcSum[0]/(0.5*ulb*ulb*S.area)]);}else await dev.queue.onSubmittedWorkDone();
      let snap=null;if(sn){await rb.mapAsync(GPUMapMode.READ);const m=new Float32Array(rb.getMappedRange()).slice();rb.unmap();snap=live(m);}
      chunk=Math.max(1,Math.min(400,Math.round(k*250/Math.max(1,now()-tc))));prog&&prog({step:s,steps,cd:hist.length?hist[hist.length-1][1]:null,backend,...(snap?{snap}:{})});}
    const enf=dev.createCommandEncoder();enf.copyBufferToBuffer(fv,0,rf,0,n*12);dev.queue.submit([enf.finish()]);await rf.mapAsync(GPUMapMode.READ);nAvg&&(fMean=sumF(new Float32Array(rf.getMappedRange())).map(v=>v/nAvg));rf.unmap();const enc=dev.createCommandEncoder();enc.copyBufferToBuffer(nAvg?ab:mb,0,rb,0,n*16);dev.queue.submit([enc.finish()]);await rb.mapAsync(GPUMapMode.READ);mac=new Float32Array(rb.getMappedRange()).slice();rb.unmap();if(nAvg)for(let i=0;i<mac.length;i++)mac[i]/=nAvg;
    for(const b of[ub,fa,fb,sb,frc,mb,rb,rf,ab,fv,qb])b.destroy();dev.destroy&&dev.destroy();
  }else{backend=cpuOnly?'CPU ('+why+')':'CPU';H=await LB();L=H.ex;L.lb_alloc(G.nx,G.ny,G.nz);H.v(1).set(solid);if(S.W){L.lb_walls(1);const qd=H.v(6),{sq,Q}=S.W,n=sq.length;for(let c=0;c<n;c++)if(sq[c]>=2){const k=(sq[c]-2)*19;for(let i=0;i<19;i++)qd[i*n+c]=Q[k+i];}}L.lb_init(ulb);let tP=now(),nAvg=0;const ev=Math.max(1,Math.round(steps/400));const accFrom=Math.floor(steps*(inp.acc||0.5));let fAcc=[0,0,0];
    for(let s=1;s<=steps;s++){const acc=s>accFrom;if(acc)nAvg++;L.lb_step(tau,ulb,cs,acc?1:0,inp.wallCs??1);const rec=s%ev===0||s===steps;(rec||acc)&&(frcSum=sumF(H.v(3)));acc&&(fAcc=fAcc.map((v,q)=>v+frcSum[q]));rec&&hist.push([s,frcSum[0]/(0.5*ulb*ulb*S.area)]);if(now()-tP>250||s===steps){tP=now();rec||(frcSum=sumF(H.v(3)));const cd=frcSum[0]/(0.5*ulb*ulb*S.area);const snap=s<steps?live(H.v(4)):null;prog&&prog({step:s,steps,cd,backend,...(snap?{snap}:{})});if(inp.yield!==false)await sleep(0);if(shouldStop&&shouldStop())break;}}mac=H.v(4).slice();if(nAvg){fMean=fAcc.map(v=>v/nAvg);mac=H.v(5).slice();for(let i=0;i<mac.length;i++)mac[i]/=nAvg;}}
  return fin(mac);
  function fin(mac){const tail=hist.slice(Math.floor(hist.length*0.7)),fq=0.5*ulb*ulb*S.area,cd=fMean?fMean[0]/fq:tail.reduce((a,b)=>a+b[1],0)/Math.max(tail.length,1),cl=Math.hypot(...(fMean||frcSum).slice(1))/fq,cf=Array.from(fMean||frcSum,v=>v/fq);
  const block=S.area/(G.ny*G.nz),cdRaw=cd,cdC=cd/(1+2.5*cd*block),Aphys=S.area*S.h*S.h*1e-6,drag=cdC*0.5*fl.rho*U*U*Aphys,q=0.5*fl.rho*U*U;
  const N=n,cp=new Float32Array(N),sp=new Float32Array(N),vel=new Float32Array(N*3);
  for(let c=0;c<N;c++){if(solid[c])continue;cp[c]=(mac[4*c]-1)/3/(0.5*ulb*ulb);vel[3*c]=mac[4*c+1]/ulb;vel[3*c+1]=mac[4*c+2]/ulb;vel[3*c+2]=mac[4*c+3]/ulb;sp[c]=Math.hypot(vel[3*c],vel[3*c+1],vel[3*c+2]);}
  fillSolid(G,solid,[cp,sp]);
  return{backend,why,trimmed:gpu&&fit<inp.cells?fit:0,cd:cdC,cdRaw,block,cl,cf,drag,Re,q,U,fluid:inp.fluid,area_mm2:S.area*S.h*S.h,steps:hist.length?hist[hist.length-1][0]:0,ms:Date.now()-t0,hist,grid:{nx:G.nx,ny:G.ny,nz:G.nz,ox:G.ox,oy:G.oy,oz:G.oz,h:G.h},dir:inp.dir,cp,sp,vel,solid:solid,tau,cells:n,wall:S.W?{links:S.W.K,cut:S.W.cut}:null};}
}
