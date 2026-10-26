import {voxelize} from './fea.js';
import {sleep} from './tick.js';
export const EX=[0,1,-1,0,0,0,0,1,-1,1,-1,1,-1,1,-1,0,0,0,0],EY=[0,0,0,1,-1,0,0,1,-1,-1,1,0,0,0,0,1,-1,1,-1],EZ=[0,0,0,0,0,1,-1,0,0,0,0,1,-1,-1,1,1,-1,-1,1],OPP=[0,2,1,4,3,6,5,8,7,10,9,12,11,14,13,16,15,18,17],WQ=[1/3,1/18,1/18,1/18,1/18,1/18,1/18,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36,1/36];
export const FLUIDS={air:{n:'Air (20 °C)',rho:1.204,nu:1.516e-5},water:{n:'Water (20 °C)',rho:998,nu:1.004e-6}};
const AXI={'+X':[0,1],'-X':[0,-1],'+Y':[1,1],'-Y':[1,-1],'+Z':[2,1],'-Z':[2,-1]};
export async function gpuDevice(n0){if(typeof navigator==='undefined'||!navigator.gpu)return{why:'this browser has no WebGPU'};const need=Math.ceil(n0/256)*256;try{const ad=await navigator.gpu.requestAdapter({powerPreference:'high-performance'})||await navigator.gpu.requestAdapter();if(!ad)return{why:'WebGPU is present but no GPU adapter started (check chrome://gpu)'};const lim=Math.min(ad.limits.maxStorageBufferBindingSize,ad.limits.maxBufferSize),dev=await ad.requestDevice({requiredLimits:{maxStorageBufferBindingSize:Math.min(ad.limits.maxStorageBufferBindingSize,Math.max(need,1<<27)),maxBufferSize:Math.min(ad.limits.maxBufferSize,Math.max(need,1<<28)),maxComputeWorkgroupsPerDimension:ad.limits.maxComputeWorkgroupsPerDimension}});dev.info=ad.info||{};dev.cap=Math.floor(Math.min(lim,dev.limits.maxStorageBufferBindingSize,dev.limits.maxBufferSize)/76);return dev;}catch(e){return{why:'the GPU refused the solver ('+String(e.message||e).slice(0,120)+')'};}}
export function fillSolid(G,solid,F,passes=3){const N=G.nx*G.ny*G.nz,ok=new Uint8Array(N);for(let c=0;c<N;c++)ok[c]=solid[c]?0:1;
  for(let pass=0;pass<passes;pass++){const nk=ok.slice();for(let k=0;k<G.nz;k++)for(let j=0;j<G.ny;j++)for(let i=0;i<G.nx;i++){const c=(k*G.ny+j)*G.nx+i;if(ok[c])continue;const s=F.map(()=>0);let m=0;for(const[di,dj,dk]of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const a=i+di,b=j+dj,cc=k+dk;if(a<0||b<0||cc<0||a>=G.nx||b>=G.ny||cc>=G.nz)continue;const e=(cc*G.ny+b)*G.nx+a;if(ok[e]){F.forEach((f,q)=>s[q]+=f[e]);m++;}}if(m){F.forEach((f,q)=>f[c]=s[q]/m);nk[c]=1;}}ok.set(nk);}}
export function frame(dir){const[k,s]=AXI[dir]||AXI['+X'],o=[0,1,2].filter(i=>i!==k);return{toL:p=>[s*p[k],p[o[0]],p[o[1]]],toW:q=>{const w=[0,0,0];w[k]=s*q[0];w[o[0]]=q[1];w[o[1]]=q[2];return w;},k,s,o};}
export function setup(inp){
  const{pos,idx,bbox,cells,dir}=inp,F=frame(dir),nv=pos.length/3,lp=new Float32Array(pos.length);
  for(let i=0;i<nv;i++){const q=F.toL([pos[3*i],pos[3*i+1],pos[3*i+2]]);lp[3*i]=q[0];lp[3*i+1]=q[1];lp[3*i+2]=q[2];}
  let mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];for(let i=0;i<nv;i++)for(let c=0;c<3;c++){mn[c]=Math.min(mn[c],lp[3*i+c]);mx[c]=Math.max(mx[c],lp[3*i+c]);}
  const D=Math.max(mx[1]-mn[1],mx[2]-mn[2],(mx[0]-mn[0])*0.5,1e-6),dom={min:[mn[0]-0.9*D,mn[1]-0.95*D,mn[2]-0.95*D],max:[mx[0]+2.6*D,mx[1]+0.95*D,mx[2]+0.95*D]};
  const vol=(dom.max[0]-dom.min[0])*(dom.max[1]-dom.min[1])*(dom.max[2]-dom.min[2]),h=Math.cbrt(vol/cells);
  const G=voxelize(lp,idx,{min:[dom.min[0]+h/2,dom.min[1]+h/2,dom.min[2]+h/2],max:[dom.max[0]-h/2,dom.max[1]-h/2,dom.max[2]-h/2]},h);
  const solid=new Uint32Array(G.nx*G.ny*G.nz);for(let e=0;e<solid.length;e++)solid[e]=G.frac[e]>=0.5?1:0;
  let area=0;for(let k=0;k<G.nz;k++)for(let j=0;j<G.ny;j++){let any=0;for(let i=0;i<G.nx;i++)if(solid[(k*G.ny+j)*G.nx+i]){any=1;break;}area+=any;}
  return{G,solid,F,h,D,area,partMin:mn,partMax:mx};
}
const WGSL=`struct P{nx:u32,ny:u32,nz:u32,n:u32,tau:f32,u:f32,cs:f32,pad:f32};
@group(0)@binding(0) var<uniform> p:P;@group(0)@binding(1) var<storage,read> fa:array<f32>;@group(0)@binding(2) var<storage,read_write> fb:array<f32>;@group(0)@binding(3) var<storage,read> sol:array<u32>;@group(0)@binding(4) var<storage,read_write> frc:array<f32>;@group(0)@binding(5) var<storage,read_write> mac:array<f32>;@group(0)@binding(6) var<storage,read_write> avg:array<f32>;
const EX=array<i32,19>(${EX});const EY=array<i32,19>(${EY});const EZ=array<i32,19>(${EZ});const OP=array<u32,19>(${OPP});const W=array<f32,19>(${WQ.map(v=>v.toFixed(9))});
fn feq(i:u32,r:f32,u:vec3f)->f32{let e=vec3f(f32(EX[i]),f32(EY[i]),f32(EZ[i]));let eu=dot(e,u);return W[i]*r*(1.+3.*eu+4.5*eu*eu-1.5*dot(u,u));}
@compute @workgroup_size(64) fn step(@builtin(global_invocation_id) g:vec3u){let c=g.x;if(c>=p.n){return;}let x=i32(c%p.nx);let y=i32((c/p.nx)%p.ny);let z=i32(c/(p.nx*p.ny));let nx=i32(p.nx);let ny=i32(p.ny);let nz=i32(p.nz);let u0=vec3f(p.u,0.,0.);
if(sol[c]==1u){for(var i=0u;i<19u;i++){fb[i*p.n+c]=0.;}frc[3u*c]=0.;frc[3u*c+1u]=0.;frc[3u*c+2u]=0.;return;}
var f:array<f32,19>;var F=vec3f(0.);
for(var i=0u;i<19u;i++){let sx=x-EX[i];let sy=(y-EY[i]+ny)%ny;let sz=(z-EZ[i]+nz)%nz;
if(sx<0){f[i]=feq(i,1.,u0);}else if(sx>=nx){f[i]=fa[i*p.n+c];}else{let s=u32(sx+nx*(sy+ny*sz));if(sol[s]==1u){let fo=fa[OP[i]*p.n+c];f[i]=fo;F+=2.*fo*vec3f(f32(EX[OP[i]]),f32(EY[OP[i]]),f32(EZ[OP[i]]));}else{f[i]=fa[i*p.n+s];}}}
var r=0.;var m=vec3f(0.);for(var i=0u;i<19u;i++){r+=f[i];m+=f[i]*vec3f(f32(EX[i]),f32(EY[i]),f32(EZ[i]));}
var u=m/max(r,1e-6);let us=length(u);if(us>0.3){u=u*(0.3/us);}if(x==0){r=1.;u=u0;}
var qxx=0.;var qyy=0.;var qzz=0.;var qxy=0.;var qxz=0.;var qyz=0.;for(var i=0u;i<19u;i++){let d=f[i]-feq(i,r,u);let ex=f32(EX[i]);let ey=f32(EY[i]);let ez=f32(EZ[i]);qxx+=d*ex*ex;qyy+=d*ey*ey;qzz+=d*ez*ez;qxy+=d*ex*ey;qxz+=d*ex*ez;qyz+=d*ey*ez;}
let Q=sqrt(qxx*qxx+qyy*qyy+qzz*qzz+2.*(qxy*qxy+qxz*qxz+qyz*qyz));let te=0.5*(p.tau+sqrt(p.tau*p.tau+18.*1.41421356*p.cs*p.cs*Q/max(r,1e-6)));
for(var i=0u;i<19u;i++){var o=f[i]-(f[i]-feq(i,r,u))/te;if(x==0){o=feq(i,1.,u0);}fb[i*p.n+c]=o;}
frc[3u*c]=F.x;frc[3u*c+1u]=F.y;frc[3u*c+2u]=F.z;mac[4u*c]=r;mac[4u*c+1u]=u.x;mac[4u*c+2u]=u.y;mac[4u*c+3u]=u.z;if(p.pad>0.){avg[4u*c]+=r;avg[4u*c+1u]+=u.x;avg[4u*c+2u]+=u.y;avg[4u*c+3u]+=u.z;}}`;
function feqJ(i,r,ux,uy,uz){const eu=EX[i]*ux+EY[i]*uy+EZ[i]*uz;return WQ[i]*r*(1+3*eu+4.5*eu*eu-1.5*(ux*ux+uy*uy+uz*uz));}
function cpuStep(st){const{nx,ny,nz,n,tau,u:U,cs,fa,fb,sol,frc,mac}=st,f=new Float64Array(19);
  for(let c=0;c<n;c++){const x=c%nx,y=Math.floor(c/nx)%ny,z=Math.floor(c/(nx*ny));if(sol[c]){for(let i=0;i<19;i++)fb[i*n+c]=0;frc[3*c]=frc[3*c+1]=frc[3*c+2]=0;continue;}
    let Fx=0,Fy=0,Fz=0;
    for(let i=0;i<19;i++){const sx=x-EX[i],sy=(y-EY[i]+ny)%ny,sz=(z-EZ[i]+nz)%nz;if(sx<0)f[i]=feqJ(i,1,U,0,0);else if(sx>=nx)f[i]=fa[i*n+c];else{const s=sx+nx*(sy+ny*sz);if(sol[s]){const o=OPP[i],fo=fa[o*n+c];f[i]=fo;Fx+=2*fo*EX[o];Fy+=2*fo*EY[o];Fz+=2*fo*EZ[o];}else f[i]=fa[i*n+s];}}
    let r=0,mx=0,my=0,mz=0;for(let i=0;i<19;i++){r+=f[i];mx+=f[i]*EX[i];my+=f[i]*EY[i];mz+=f[i]*EZ[i];}
    let ux=mx/r,uy=my/r,uz=mz/r;const us=Math.hypot(ux,uy,uz);if(us>0.3){ux*=0.3/us;uy*=0.3/us;uz*=0.3/us;}if(x===0){r=1;ux=U;uy=0;uz=0;}
    let qxx=0,qyy=0,qzz=0,qxy=0,qxz=0,qyz=0;for(let i=0;i<19;i++){const d=f[i]-feqJ(i,r,ux,uy,uz);qxx+=d*EX[i]*EX[i];qyy+=d*EY[i]*EY[i];qzz+=d*EZ[i]*EZ[i];qxy+=d*EX[i]*EY[i];qxz+=d*EX[i]*EZ[i];qyz+=d*EY[i]*EZ[i];}
    const Q=Math.sqrt(qxx*qxx+qyy*qyy+qzz*qzz+2*(qxy*qxy+qxz*qxz+qyz*qyz)),te=0.5*(tau+Math.sqrt(tau*tau+18*Math.SQRT2*cs*cs*Q/r));
    for(let i=0;i<19;i++)fb[i*n+c]=x===0?feqJ(i,1,U,0,0):f[i]-(f[i]-feqJ(i,r,ux,uy,uz))/te;
    frc[3*c]=Fx;frc[3*c+1]=Fy;frc[3*c+2]=Fz;mac[4*c]=r;mac[4*c+1]=ux;mac[4*c+2]=uy;mac[4*c+3]=uz;if(st.acc){const A=st.avg;A[4*c]+=r;A[4*c+1]+=ux;A[4*c+2]+=uy;A[4*c+3]+=uz;}}
  st.fa=fb;st.fb=fa;}
function sumF(frc){let x=0,y=0,z=0;for(let i=0;i<frc.length;i+=3){x+=frc[i];y+=frc[i+1];z+=frc[i+2];}return[x,y,z];}
export async function runCFD(inp,prog,shouldStop){const t0=Date.now(),now=()=>performance.now();inp.gpu!==false&&prog&&prog({stage:'Starting the GPU'});const gd=inp.gpu!==false?await gpuDevice(Math.ceil(inp.cells*1.15)*76):{why:'CPU was chosen'},gpu=gd&&gd.createBuffer?gd:null,why=gpu?'':gd.why,cpuOnly=!gpu&&inp.gpu!==false,fit=gpu?Math.min(inp.cells,Math.floor(Math.min(gpu.cap,65535*64)/1.15)):inp.cpuCells||inp.cells;prog&&prog({stage:'Building the tunnel grid'+(cpuOnly?' (on the CPU at a coarser grid: '+why+')':fit<inp.cells?' (trimmed to '+Math.round(fit/1000)+'k cells to fit this GPU)':'')});
  const S=setup({...inp,cells:fit}),{G,solid}=S,n=G.nx*G.ny*G.nz,fl=FLUIDS[inp.fluid]||FLUIDS.air,U=inp.speed||10,Dm=S.D*1e-3,Re=U*Dm/fl.nu;
  const ulb=gpu?0.06:0.08,Dc=S.D/S.h,nulb=ulb*Dc/Re,tau=Math.max(0.5+3*nulb,0.5005),steps=Math.round((inp.flows||2.2)*G.nx/ulb),cs=0.17;
  const fInit=new Float32Array(n*19);for(let c=0;c<n;c++)if(!solid[c])for(let i=0;i<19;i++)fInit[i*n+c]=feqJ(i,1,ulb,0,0);
  let hist=[],mac,frcSum=[0,0,0],backend,tS=now();const live=m=>{if(!inp.live||now()-tS<1500)return null;tS=now();return fin(m);};
  if(gpu){backend='WebGPU';const dev=gpu,mk=(sz,u)=>dev.createBuffer({size:Math.max(16,sz),usage:u}),SU=GPUBufferUsage;
    const ub=mk(32,SU.UNIFORM|SU.COPY_DST),fa=mk(n*76,SU.STORAGE|SU.COPY_DST|SU.COPY_SRC),fb=mk(n*76,SU.STORAGE|SU.COPY_DST|SU.COPY_SRC),sb=mk(n*4,SU.STORAGE|SU.COPY_DST),frc=mk(n*12,SU.STORAGE|SU.COPY_SRC),mb=mk(n*16,SU.STORAGE|SU.COPY_SRC),rb=mk(n*16,SU.MAP_READ|SU.COPY_DST),ab=mk(n*16,SU.STORAGE|SU.COPY_SRC|SU.COPY_DST),rf=mk(n*12,SU.MAP_READ|SU.COPY_DST);
    const pa=new ArrayBuffer(32),pu=new Uint32Array(pa),pf=new Float32Array(pa);pu[0]=G.nx;pu[1]=G.ny;pu[2]=G.nz;pu[3]=n;pf[4]=tau;pf[5]=ulb;pf[6]=cs;dev.queue.writeBuffer(ub,0,pa);dev.queue.writeBuffer(fa,0,fInit);dev.queue.writeBuffer(fb,0,fInit);dev.queue.writeBuffer(sb,0,solid);
    prog&&prog({stage:'Compiling the GPU solver'});const mod=dev.createShaderModule({code:WGSL}),pipe=await dev.createComputePipelineAsync({layout:'auto',compute:{module:mod,entryPoint:'step'}});
    const bg=(a,b)=>dev.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:ub}},{binding:1,resource:{buffer:a}},{binding:2,resource:{buffer:b}},{binding:3,resource:{buffer:sb}},{binding:4,resource:{buffer:frc}},{binding:5,resource:{buffer:mb}},{binding:6,resource:{buffer:ab}}]});
    const B=[bg(fa,fb),bg(fb,fa)],wg=Math.ceil(n/64),gx=Math.min(wg,65535),gy=Math.ceil(wg/65535);
    if(gy>1)throw new Error('grid too large for this GPU; choose a coarser flow mesh');
    let chunk=7,s=0,nAvg=0,tR=0;const accFrom=Math.floor(steps*0.6);
    while(s<steps&&!(shouldStop&&shouldStop())){if(s>=accFrom&&!pf[7]){pf[7]=1;dev.queue.writeBuffer(ub,0,pa);}const enc=dev.createCommandEncoder(),k=Math.min(chunk,steps-s),tc=now();if(s>=accFrom)nAvg+=k;for(let j=0;j<k;j++){const ps=enc.beginComputePass();ps.setPipeline(pipe);ps.setBindGroup(0,B[(s+j)&1]);ps.dispatchWorkgroups(gx,gy);ps.end();}s+=k;
      const rd=s>=steps||tc-tR>700,sn=inp.live&&s<steps&&tc-tS>1500;rd&&enc.copyBufferToBuffer(frc,0,rf,0,n*12);sn&&enc.copyBufferToBuffer(mb,0,rb,0,n*16);dev.queue.submit([enc.finish()]);
      if(rd){await rf.mapAsync(GPUMapMode.READ);frcSum=sumF(new Float32Array(rf.getMappedRange()));rf.unmap();tR=now();hist.push([s,frcSum[0]/(0.5*ulb*ulb*S.area)]);}else await dev.queue.onSubmittedWorkDone();
      let snap=null;if(sn){await rb.mapAsync(GPUMapMode.READ);const m=new Float32Array(rb.getMappedRange()).slice();rb.unmap();snap=live(m);}
      chunk=Math.max(1,Math.min(400,Math.round(k*250/Math.max(1,now()-tc))));prog&&prog({step:s,steps,cd:hist.length?hist[hist.length-1][1]:null,backend,...(snap?{snap}:{})});}
    const enc=dev.createCommandEncoder();enc.copyBufferToBuffer(nAvg?ab:mb,0,rb,0,n*16);dev.queue.submit([enc.finish()]);await rb.mapAsync(GPUMapMode.READ);mac=new Float32Array(rb.getMappedRange()).slice();rb.unmap();if(nAvg)for(let i=0;i<mac.length;i++)mac[i]/=nAvg;
    for(const b of[ub,fa,fb,sb,frc,mb,rb,rf,ab])b.destroy();dev.destroy&&dev.destroy();
  }else{backend=cpuOnly?'CPU ('+why+')':'CPU';let tP=now();const st={nx:G.nx,ny:G.ny,nz:G.nz,n,tau,u:ulb,cs,fa:fInit,fb:fInit.slice(),sol:solid,frc:new Float32Array(n*3),mac:new Float32Array(n*4),avg:new Float32Array(n*4),acc:false};let nAvg=0;const accFrom=Math.floor(steps*0.6);
    for(let s=1;s<=steps;s++){st.acc=s>accFrom;if(st.acc)nAvg++;cpuStep(st);if(now()-tP>250||s===steps){tP=now();frcSum=sumF(st.frc);const cd=frcSum[0]/(0.5*ulb*ulb*S.area);hist.push([s,cd]);const snap=s<steps?live(st.mac):null;prog&&prog({step:s,steps,cd,backend,...(snap?{snap}:{})});await sleep(0);if(shouldStop&&shouldStop())break;}}mac=st.mac;if(nAvg){mac=st.avg;for(let i=0;i<mac.length;i++)mac[i]/=nAvg;}}
  return fin(mac);
  function fin(mac){const tail=hist.slice(Math.floor(hist.length*0.7)),cd=tail.reduce((a,b)=>a+b[1],0)/Math.max(tail.length,1),cl=Math.hypot(frcSum[1],frcSum[2])/(0.5*ulb*ulb*S.area);
  const block=S.area/(G.ny*G.nz),cdRaw=cd,cdC=cd/(1+2.5*cd*block),Aphys=S.area*S.h*S.h*1e-6,drag=cdC*0.5*fl.rho*U*U*Aphys,q=0.5*fl.rho*U*U;
  const N=n,cp=new Float32Array(N),sp=new Float32Array(N),vel=new Float32Array(N*3);
  for(let c=0;c<N;c++){if(solid[c])continue;cp[c]=(mac[4*c]-1)/3/(0.5*ulb*ulb);vel[3*c]=mac[4*c+1]/ulb;vel[3*c+1]=mac[4*c+2]/ulb;vel[3*c+2]=mac[4*c+3]/ulb;sp[c]=Math.hypot(vel[3*c],vel[3*c+1],vel[3*c+2]);}
  fillSolid(G,solid,[cp,sp]);
  return{backend,why,trimmed:gpu&&fit<inp.cells?fit:0,cd:cdC,cdRaw,block,cl,drag,Re,q,U,fluid:inp.fluid,area_mm2:S.area*S.h*S.h,steps:hist.length?hist[hist.length-1][0]:0,ms:Date.now()-t0,hist,grid:{nx:G.nx,ny:G.ny,nz:G.nz,ox:G.ox,oy:G.oy,oz:G.oz,h:G.h},dir:inp.dir,cp,sp,vel,solid:solid,tau,cells:n};}
}
