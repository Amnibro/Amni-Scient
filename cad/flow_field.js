import {zipSync} from './vendor/fflate.module.js';
import {maxOf,minOf} from './minmax.js';
import {dual} from './units.js';
const FT=3.2808399,PSI=1.4503774e-4,PSF=0.020885434;
const ramp=t=>{t=Math.min(1,Math.max(0,t));const C=[[43,89,195],[43,181,195],[63,208,122],[242,210,46],[242,131,46],[224,50,46]];const x=t*5,i=Math.min(4,Math.floor(x)),f=x-i,a=C[i],b=C[i+1];return[0,1,2].map(k=>(a[k]+(b[k]-a[k])*f)/255);};
export function fieldOf(r){return r&&r.field;}
export function exportCSV(r){const f=r.field;if(!f&&r.octree)return octCSV(r);if(!f)throw new Error('This result has no field to export. Run an internal flow first.');
  const {Na,Nb,dx,a0,b0}=f,rows=['i,j,x_mm,y_mm,x_in,y_in,mask,gap_mm,gap_in,p_Pa,p_psi,u_m_s,u_ft_s,v_m_s,v_ft_s,shear_Pa,shear_psf,port'];
  for(let j=0;j<Nb;j++)for(let i=0;i<Na;i++){const p=j*Na+i,x=a0+(i+0.5)*dx,y=b0+(j+0.5)*dx;rows.push([i,j,x.toFixed(5),y.toFixed(5),(x/25.4).toFixed(6),(y/25.4).toFixed(6),f.mask[p],f.gap[p].toExponential(4),(f.gap[p]/25.4).toExponential(4),f.p[p].toExponential(5),(f.p[p]*PSI).toExponential(4),f.u[p].toExponential(4),(f.u[p]*FT).toExponential(4),f.v[p].toExponential(4),(f.v[p]*FT).toExponential(4),f.shear[p].toExponential(4),(f.shear[p]*PSF).toExponential(4),f.port[p]].join(','));}
  return rows.join('\n')+'\n';}
function npy(name,arr,shape,descr){const dict=`{'descr':'${descr}','fortran_order':False,'shape':(${shape.join(',')}${shape.length<2?',':''}), }`;
  let h=dict;const base=10+h.length+1,pad=(64-(base%64))%64;h=h+' '.repeat(pad)+'\n';const o=new Uint8Array(10+h.length+arr.byteLength),dv=new DataView(o.buffer);
  o.set([0x93,0x4e,0x55,0x4d,0x50,0x59,1,0]);dv.setUint16(8,h.length,true);o.set(new TextEncoder().encode(h),10);o.set(new Uint8Array(arr.buffer,arr.byteOffset,arr.byteLength),10+h.length);return o;}
export function exportNPZ(r){const f=r.field;if(!f&&r.octree){const o=r.octree;return zipSync({'center_mm.npy':npy('c',Float32Array.from(o.xc,v=>v*(r.L||1)),[o.n,3],'<f4'),'size_mm.npy':npy('h',Float32Array.from(o.h,v=>v*(r.L||1)),[o.n],'<f4'),'u.npy':npy('u',o.u,[o.n],'<f4'),'v.npy':npy('v',o.v,[o.n],'<f4'),'w.npy':npy('w',o.w,[o.n],'<f4'),'p.npy':npy('p',o.p,[o.n],'<f4'),'port.npy':npy('port',o.kind,[o.n],'<i2')});}if(!f)throw new Error('This result has no field to export.');
  const files={'mask.npy':npy('mask',f.mask,[f.Nb,f.Na],'|u1'),'gap.npy':npy('gap',f.gap,[f.Nb,f.Na],'<f4'),'p.npy':npy('p',f.p,[f.Nb,f.Na],'<f4'),'u.npy':npy('u',f.u,[f.Nb,f.Na],'<f4'),'v.npy':npy('v',f.v,[f.Nb,f.Na],'<f4'),'shear.npy':npy('shear',f.shear,[f.Nb,f.Na],'<f4'),'port.npy':npy('port',f.port,[f.Nb,f.Na],'<i2')};
  return zipSync(files);}
export function exportVTK(r){const f=r.field;if(!f&&r.octree)return octVTK(r);if(!f)throw new Error('This result has no field to export.');
  const N=f.Na*f.Nb,head=['# vtk DataFile Version 3.0','Amni-CAD internal flow','ASCII','DATASET STRUCTURED_POINTS','DIMENSIONS '+f.Na+' '+f.Nb+' 1','ORIGIN '+f.a0+' '+f.b0+' 0','SPACING '+f.dx+' '+f.dx+' 1','POINT_DATA '+N];
  const scl=(n,a)=>['SCALARS '+n+' float 1','LOOKUP_TABLE default',...[...a].map(v=>Number.isFinite(v)?v.toExponential(6):'0')];
  return [...head,...scl('mask',f.mask),...scl('gap',f.gap),...scl('p',f.p),...scl('u',f.u),...scl('v',f.v),...scl('shear',f.shear),...scl('port',f.port)].join('\n')+'\n';}
function locate(f,x,y){const i=(x-f.a0)/f.dx-0.5,j=(y-f.b0)/f.dx-0.5,i0=Math.floor(i),j0=Math.floor(j);if(i0<0||j0<0||i0>=f.Na-1||j0>=f.Nb-1)return null;const tx=i-i0,ty=j-j0;return{i0,j0,tx,ty};}
function rangeOf(f,key,o){let lo=o.min,hi=o.max;if(lo==null||hi==null){let a=Infinity,b=-Infinity;
    for(let i=0;i<f.mask.length;i++)if(f.mask[i]){const s=key==='speed'?Math.hypot(f.u[i],f.v[i]):key==='shear'?f.shear[i]:f.p[i];if(s<a)a=s;if(s>b)b=s;}
    if(lo==null)lo=Number.isFinite(a)?a:0;if(hi==null)hi=Number.isFinite(b)?b:1;}
  if(!(hi>lo))hi=lo+1;return{lo,hi};}
function sample(f,key,x,y){const L=locate(f,x,y);if(!L)return null;const{i0,j0,tx,ty}=L,at=(i,j)=>f[key][j*f.Na+i],m=at(i0,j0)*(1-tx)*(1-ty)+at(i0+1,j0)*tx*(1-ty)+at(i0,j0+1)*(1-tx)*ty+at(i0+1,j0+1)*tx*ty;return m;}
export function probePoints(r,pts){const f=r.field;if(!f&&r.octree)return octProbe(r,pts);if(!f)throw new Error('No flow field. Run an internal flow first.');
  return pts.map(p=>{const x=+p[0],y=+p[1],z=p[2]!=null?+p[2]:null,u=sample(f,'u',x,y),v=sample(f,'v',x,y),pr=sample(f,'p',x,y),s=sample(f,'shear',x,y),mk=sample(f,'mask',x,y);
    const sp=u==null?null:Math.hypot(u,v);return{x,y,z,in_fluid:mk!=null&&mk>0.5,u,v,speed:sp,speed_m_s:sp,speed_ft_s:sp==null?null:sp*FT,p:pr,p_Pa:pr,p_psi:pr==null?null:pr*PSI,shear:s,shear_Pa:s,shear_psf:s==null?null:s*PSF};});}
export function probeLine(r,a,b,n=40){const f=r.field;if(!f&&r.octree){const N=Math.max(2,n|0),pts=[];for(let i=0;i<N;i++){const t=i/(N-1);pts.push([0,1,2].map(d=>(+a[d]||0)+((+b[d]||0)-(+a[d]||0))*t));}const P=octProbe(r,pts),w=P.filter(q=>q.in_fluid),ms=w.length?w.reduce((s,q)=>s+q.speed,0)/w.length:0;return{points:P,samples:w.length,mean_speed_m_s:ms,mean_speed_ft_s:ms*FT,flow_m3_s:null,note:'3D result: give 3D points; flow through a line is not defined in 3D.'};}if(!f)throw new Error('No flow field. Run an internal flow first.');const N=Math.max(2,n|0),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,dl=len/(N-1),pts=[];
  let flow=0,sp=0,ns=0;const mm=f.mm||1;
  for(let i=0;i<N;i++){const t=i/(N-1),x=a[0]+dx*t,y=a[1]+dy*t;pts.push([x,y]);const m=sample(f,'mask',x,y),gap=sample(f,'gap',x,y)||0,u=sample(f,'u',x,y)||0,v=sample(f,'v',x,y)||0;
    if(m>0.5){const un=u*nx+v*ny;flow+=un*(gap*mm*1e-3)*(dl*mm*1e-3);sp+=Math.hypot(u,v);ns++;}}
  const ms=ns?sp/ns:0;return{points:probePoints(r,pts),samples:ns,mean_speed_m_s:ms,mean_speed_ft_s:ms*FT,flow_m3_s:flow};}
function scalarKey(o){return o.scalar==='u'||o.scalar==='speed'?'speed':o.scalar==='shear'?'shear':'p';}
function legendFor(key,lo,hi){const q=key==='speed'?'vel':key==='shear'?'pa':'dpress',title=key==='p'?'Pressure':key==='shear'?'Wall shear':'Speed';return{t:title,min:0,max:1,l0:dual(q,lo),l1:dual(q,hi),lo,hi,scalar:key};}
export function fieldSurface(r,o={}){const f=r.field;if(!f||!f.mask)return null;const key=scalarKey(o),{lo,hi}=rangeOf(f,key,o),ax=r.axes||[[0,1],[1,1],[2,1]],toW=(a,b,h)=>{const q=[a,b,h],w=[0,0,0];ax.forEach(([k,sg],j)=>w[k]=sg*q[j]);return w;};
  const {Na,Nb,dx,a0,b0,zc}=f,pos=[],col=[],inl=new Set();(r.ports||[]).forEach((p,k)=>{if(p.kind==='inlet')inl.add(k);});
  const lift=(gap,k)=>zc-(gap||0)+dx*k;
  for(let j=0;j<Nb;j++)for(let i=0;i<Na;i++){const p=j*Na+i;if(!f.mask[p])continue;const a=a0+(i+0.5)*dx,b=b0+(j+0.5)*dx,h=lift(f.gap[p],0.15),po=f.port[p],pc=po>=0?(inl.has(po)?[0.15,0.9,0.98]:[0.98,0.42,0.12]):null,t=( (key==='speed'?Math.hypot(f.u[p],f.v[p]):key==='shear'?f.shear[p]:f.p[p]) -lo)/(hi-lo),c=pc||ramp(t);
    const cs=[[a-dx/2,b-dx/2],[a+dx/2,b-dx/2],[a+dx/2,b+dx/2],[a-dx/2,b+dx/2]].map(([x,y])=>toW(x,y,h));
    for(const k of[0,1,2,0,2,3]){pos.push(...cs[k]);col.push(...c);}}
  const lines=[],lineColor=[],seeds=[],seen=new Set();
  const take=(list)=>{if(!list.length)return;const step=Math.max(1,Math.ceil(list.length/6));for(let i=step/2;i<list.length;i+=step)seeds.push(list[Math.floor(i)]);};
  const bins=new Map(),put=(q,k,x,y)=>{if(seen.has(q))return;seen.add(q);(bins.get(k)||bins.set(k,[]).get(k)).push([x,y]);};
  for(let p=0;p<f.mask.length;p++)if(f.mask[p]&&inl.has(f.port[p])){const i=p%Na,j=(p-i)/Na;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj,q=b*Na+a;if(a>=0&&b>=0&&a<Na&&b<Nb&&f.mask[q]&&f.port[q]<0){put(q,Math.round(b/Math.max(1,Nb/8)),a0+(a+0.5)*dx,b0+(b+0.5)*dx);break;}}}
  if(bins.size)for(const list of bins.values())take(list);else{const mid=[];for(let j=0;j<Nb;j++){for(let i=0;i<Na;i++)if(f.mask[j*Na+i]&&f.port[j*Na+i]<0){mid.push([a0+(i+0.5)*dx,b0+(j+0.5)*dx]);break;}}take(mid);}
  const ink=[0.05,0.06,0.08];
  for(const[x0,y0] of seeds){let x=x0,y=y0;for(let s=0;s<480;s++){const u=sample(f,'u',x,y),v=sample(f,'v',x,y),m=sample(f,'mask',x,y);if(u==null||!(m>0.5))break;const sp=Math.hypot(u,v);if(sp<1e-5)break;const ds=dx*0.55,x2=x+u/sp*ds,y2=y+v/sp*ds,g0=sample(f,'gap',x,y)||0,g1=sample(f,'gap',x2,y2)||g0;lines.push(...toW(x,y,lift(g0,0.4)),...toW(x2,y2,lift(g1,0.4)));lineColor.push(...ink,...ink);x=x2;y=y2;}}
  return{pos:new Float32Array(pos),color:new Float32Array(col),lines:new Float32Array(lines),lineColor:new Float32Array(lineColor),legend:legendFor(key,lo,hi)};}
export function flowColors(pos,r,o={}){const f=r.field,n=pos.length/3,col=new Float32Array(n*3),base=o.base||[0.75,0.78,0.82];
  if(!f&&r.octree)return octColors(pos,r,o,col,base);
  const key=scalarKey(o),rg=f?rangeOf(f,key,o):{lo:0,hi:1},lo=rg.lo,hi=rg.hi;
  const ax=r.axes||[[0,1],[1,1],[2,1]],toL=w=>{const q=[0,0,0];ax.forEach(([k,sg],j)=>q[j]=sg*w[k]);return q;};
  for(let i=0;i<n;i++){const w=[pos[3*i],pos[3*i+1],pos[3*i+2]],q=toL(w);let x=q[0],y=q[1];
    if(f){const pr=sample(f,'p',x,y),uu=sample(f,'u',x,y),vv=sample(f,'v',x,y),sh=sample(f,'shear',x,y),mk=sample(f,'mask',x,y),po=sample(f,'port',x,y);
      if(mk!=null&&mk>0.4){const val=key==='shear'?sh:key==='speed'?Math.hypot(uu||0,vv||0):pr;const t=(val-lo)/(hi-lo),c=ramp(t);
        if(po!=null&&po>=-0.2){const pc=po<0.5?[0.2,0.85,0.95]:[0.95,0.45,0.15];c[0]=c[0]*0.55+pc[0]*0.45;c[1]=c[1]*0.55+pc[1]*0.45;c[2]=c[2]*0.55+pc[2]*0.45;}
        col[3*i]=c[0];col[3*i+1]=c[1];col[3*i+2]=c[2];continue;}}
    col[3*i]=base[0];col[3*i+1]=base[1];col[3*i+2]=base[2];}
  return{colors:col,legend:legendFor(key,lo,hi)};}
function friction(Q,area,Dh,L,K,rho,mu){const V=Q/Math.max(area,1e-12),Re=rho*Math.abs(V)*Dh/Math.max(mu,1e-12),f=Re<1e-6?0:Re<2300?64/Math.max(Re,1):0.316*Math.pow(Re,-0.25);
  return (f*L/Math.max(Dh,1e-9)+K)*0.5*rho*V*Math.abs(V);}
export function solveNetwork(spec){const N=Math.max(1,spec.cells|0),fl=spec.fluid;if(!fl||!(fl.rho>0))throw new Error('The network needs a fluid (rho, mu).');
  const R=+spec.cellR;if(!(R>0))throw new Error('Each cell needs a resistance cellR in Pa per (m³/s).');
  const sink=+spec.sink||0,man=spec.manifold||{},A=man.area||1e-3,Dh=man.Dh||Math.sqrt(4*A/Math.PI),Lm=+man.L||0.02,Km=+man.K||0;
  const dual=!!spec.dual,arr=spec.arrangement==='Z'?'Z':'U',pFeed=spec.pIn!=null?+spec.pIn:null,Qin=spec.Qin!=null?+spec.Qin:null,pDown=+spec.pOut||0;
  const valve=spec.valve||null,rho=fl.rho,mu=fl.mu;
  if(pFeed==null&&Qin==null)throw new Error('Set pIn (gauge Pa at the feed) or Qin (m³/s into the stack).');
  const q=new Float64Array(N);let Q=Qin!=null?Qin:Math.max(N*(pFeed||1000)/R,1e-12);for(let i=0;i<N;i++)q[i]=Math.max(Q/N-sink,0);
  const half=dual?Math.ceil(N/2):N;
  const headerDP=(flow)=>friction(flow,A,Dh,Lm,Km,rho,mu);
  for(let it=0;it<50;it++){
    const Pin=new Float64Array(N),Pout=new Float64Array(N);
    const fill=(i0,i1,dir)=>{let F=0;for(let i=i0;i!==i1;i+=dir)F+=q[i];let p=pFeed!=null?pFeed:0,acc=F;for(let i=i0;i!==i1;i+=dir){Pin[i]=p;acc-=q[i];p-=headerDP(acc);}return F;};
    if(!dual){fill(0,N,1);let G=0,p=0;if(arr==='U'){for(let i=N-1;i>=0;i--){G+=q[i]-sink;Pout[i]=p;p+=headerDP(G);}}else{for(let i=0;i<N;i++){Pout[i]=p;G+=q[i]-sink;p+=headerDP(G);}}}
    else{fill(0,half,1);let G=0,p=0;for(let i=half-1;i>=0;i--){G+=q[i]-sink;Pout[i]=p;p+=headerDP(G);}fill(N-1,half-1,-1);G=0;p=0;for(let i=half;i<N;i++){G+=q[i]-sink;Pout[i]=p;p+=headerDP(G);}}
    const Qout=q.reduce((a,b)=>a+b,0)-sink*N;let pExit=pDown;if(valve&&valve.area>0){const Cd=valve.Cd||0.65,Vv=Qout/Math.max(valve.area,1e-12);pExit=pDown+0.5*rho*Vv*Math.abs(Vv)/(Cd*Cd);} 
    for(let i=0;i<N;i++)Pout[i]+=pExit;
    if(pFeed==null){const scale=Qin/Math.max(q.reduce((a,b)=>a+b,0),1e-30);for(let i=0;i<N;i++)q[i]*=scale;}
    else{for(let i=0;i<N;i++){const qq=Math.max((Pin[i]-Pout[i])/R,0);q[i]=q[i]*0.5+qq*0.5;}}
  }
  const flows=[...q],mean=flows.reduce((a,b)=>a+b,0)/N,sd=Math.sqrt(flows.reduce((a,b)=>a+(b-mean)**2,0)/N),mn=minOf(flows),mx=maxOf(flows);
  const Qthrough=flows.reduce((a,b)=>a+b,0);
  return{cells:N,arrangement:dual?'dual-'+arr:arr,flow_m3_s:flows,min_m3_s:mn,max_m3_s:mx,mean_m3_s:mean,cv:mean?sd/Math.abs(mean):0,range:(mx-mn)/Math.max(Math.abs(mean),1e-30),inlet_m3_s:Qthrough,outlet_m3_s:Qthrough-sink*N,sink_m3_s:sink,consumed_m3_s:sink*N};}

// Point lookup in an octree result: the active cell containing (x, y, z), or -1. Built once per result.
export function octSampler(r){const o=r.octree;if(!o)return null;if(o._s)return o._s;const{root,n,xc,h}=o,M=new Map(),L=Math.round(root.lmax);
  const lvOf=hh=>Math.round(Math.log2(root.ext/hh));for(let a=0;a<n;a++){const l=lvOf(h[a]),hl=root.ext/2**l,i=Math.floor((xc[3*a]-root.ox)/hl),j=Math.floor((xc[3*a+1]-root.oy)/hl),k=Math.floor((xc[3*a+2]-root.oz)/hl);M.set(l+':'+i+':'+j+':'+k,a);}
  const at=(x,y,z)=>{for(let l=L;l>=0;l--){const hl=root.ext/2**l,i=Math.floor((x-root.ox)/hl),j=Math.floor((y-root.oy)/hl),k=Math.floor((z-root.oz)/hl),a=M.get(l+':'+i+':'+j+':'+k);if(a!==undefined)return a;}return-1;};
  let hmin=Infinity;for(let a=0;a<n;a++)hmin=Math.min(hmin,h[a]);
  // A wall point: the first active cell found a little way off it along the six axis directions.
  const near=(x,y,z)=>{let a=at(x,y,z);if(a>=0)return a;const d=0.5*hmin;for(const[dx,dy,dz]of[[d,0,0],[-d,0,0],[0,d,0],[0,-d,0],[0,0,d],[0,0,-d]]){a=at(x+dx,y+dy,z+dz);if(a>=0)return a;}return-1;};
  return o._s={at,near,hmin};}
// Part colors from a 3D octree result: each vertex takes the value of the flow cell beside it.
function octColors(pos,r,o,col,base){const O=r.octree,S=octSampler(r),n=pos.length/3,key=scalarKey(o)==='p'?'p':'speed',val=a=>key==='p'?O.p[a]:Math.hypot(O.u[a],O.v[a],O.w[a]);
  let lo=o.min,hi=o.max;if(lo==null||hi==null){let a0=Infinity,b0=-Infinity;for(let a=0;a<O.n;a++){if(O.kind[a]>=0&&key!=='p')continue;const s=val(a);if(s<a0)a0=s;if(s>b0)b0=s;}if(lo==null)lo=Number.isFinite(a0)?a0:0;if(hi==null)hi=Number.isFinite(b0)?b0:1;}if(!(hi>lo))hi=lo+1;
  for(let i=0;i<n;i++){const a=S.near(pos[3*i],pos[3*i+1],pos[3*i+2]);if(a<0){col[3*i]=base[0];col[3*i+1]=base[1];col[3*i+2]=base[2];continue;}const c=ramp((val(a)-lo)/(hi-lo)),k=O.kind[a];
    if(k>=0){const pt=(r.ports||[])[k],pc=pt&&pt.kind==='inlet'?[0.2,0.85,0.95]:[0.95,0.45,0.15];for(let d=0;d<3;d++)c[d]=c[d]*0.55+pc[d]*0.45;}col[3*i]=c[0];col[3*i+1]=c[1];col[3*i+2]=c[2];}
  return{colors:col,legend:legendFor(key,lo,hi)};}
// Probes, CSV and VTK for a 3D octree result. Points are [x, y, z] in document units.
function octProbe(r,pts){const O=r.octree,S=octSampler(r);return pts.map(p=>{const x=+p[0],y=+p[1],z=p[2]!=null?+p[2]:NaN,a=Number.isFinite(z)?S.at(x,y,z):-1;
  if(a<0)return{x,y,z,in_fluid:false,u:null,v:null,w:null,speed:null,speed_m_s:null,speed_ft_s:null,p:null,p_Pa:null,p_psi:null,shear:null};const u=O.u[a],v=O.v[a],w=O.w[a],sp=Math.hypot(u,v,w),pr=O.p[a];
  return{x,y,z,in_fluid:true,port:O.kind[a]>=0?O.kind[a]:undefined,cell_mm:O.h[a]*(r.L||1),u,v,w,speed:sp,speed_m_s:sp,speed_ft_s:sp*FT,p:pr,p_Pa:pr,p_psi:pr*PSI,shear:null};});}
function octCSV(r){const O=r.octree,L=r.L||1,rows=['x_mm,y_mm,z_mm,cell_mm,u_m_s,v_m_s,w_m_s,speed_m_s,p_Pa,p_psi,port'];for(let a=0;a<O.n;a++){const sp=Math.hypot(O.u[a],O.v[a],O.w[a]);rows.push([O.xc[3*a]*L,O.xc[3*a+1]*L,O.xc[3*a+2]*L,O.h[a]*L].map(v=>v.toFixed(5)).concat([O.u[a],O.v[a],O.w[a],sp,O.p[a]].map(v=>v.toExponential(5)),[(O.p[a]*PSI).toExponential(4),O.kind[a]]).join(','));}return rows.join('\n')+'\n';}
function octVTK(r){const O=r.octree,L=r.L||1,n=O.n,head=['# vtk DataFile Version 3.0','Amni-CAD 3D internal flow (adaptive octree cell centers)','ASCII','DATASET POLYDATA','POINTS '+n+' float'],pts=[],ver=['VERTICES '+n+' '+2*n];for(let a=0;a<n;a++){pts.push((O.xc[3*a]*L).toFixed(5)+' '+(O.xc[3*a+1]*L).toFixed(5)+' '+(O.xc[3*a+2]*L).toFixed(5));ver.push('1 '+a);}
  const scl=(nm,f)=>['SCALARS '+nm+' float 1','LOOKUP_TABLE default',...Array.from({length:n},(_,a)=>f(a).toExponential(6))],vec=['VECTORS velocity float',...Array.from({length:n},(_,a)=>O.u[a].toExponential(6)+' '+O.v[a].toExponential(6)+' '+O.w[a].toExponential(6))];
  return[...head,...pts,...ver,'POINT_DATA '+n,...scl('p',a=>O.p[a]),...scl('cell_mm',a=>O.h[a]*L),...scl('port',a=>O.kind[a]),...vec].join('\n')+'\n';}
