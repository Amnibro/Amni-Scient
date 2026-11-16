import {zipSync} from './vendor/fflate.module.js';
import {maxOf,minOf} from './minmax.js';
const ramp=t=>{t=Math.min(1,Math.max(0,t));const C=[[43,89,195],[43,181,195],[63,208,122],[242,210,46],[242,131,46],[224,50,46]];const x=t*5,i=Math.min(4,Math.floor(x)),f=x-i,a=C[i],b=C[i+1];return[0,1,2].map(k=>(a[k]+(b[k]-a[k])*f)/255);};
export function fieldOf(r){return r&&r.field;}
export function exportCSV(r){const f=r.field;if(!f)throw new Error('This result has no field to export. Run an internal flow first.');
  const {Na,Nb,dx,a0,b0}=f,rows=['i,j,x_mm,y_mm,mask,gap_mm,p_Pa,u_m_s,v_m_s,shear_Pa,port'];
  for(let j=0;j<Nb;j++)for(let i=0;i<Na;i++){const p=j*Na+i;rows.push([i,j,(a0+(i+0.5)*dx).toFixed(5),(b0+(j+0.5)*dx).toFixed(5),f.mask[p],f.gap[p].toExponential(4),f.p[p].toExponential(5),f.u[p].toExponential(4),f.v[p].toExponential(4),f.shear[p].toExponential(4),f.port[p]].join(','));}
  return rows.join('\n')+'\n';}
function npy(name,arr,shape,descr){const dict=`{'descr':'${descr}','fortran_order':False,'shape':(${shape.join(',')}${shape.length<2?',':''}), }`;
  let h=dict;const base=10+h.length+1,pad=(64-(base%64))%64;h=h+' '.repeat(pad)+'\n';const o=new Uint8Array(10+h.length+arr.byteLength),dv=new DataView(o.buffer);
  o.set([0x93,0x4e,0x55,0x4d,0x50,0x59,1,0]);dv.setUint16(8,h.length,true);o.set(new TextEncoder().encode(h),10);o.set(new Uint8Array(arr.buffer,arr.byteOffset,arr.byteLength),10+h.length);return o;}
export function exportNPZ(r){const f=r.field;if(!f)throw new Error('This result has no field to export.');
  const files={'mask.npy':npy('mask',f.mask,[f.Nb,f.Na],'|u1'),'gap.npy':npy('gap',f.gap,[f.Nb,f.Na],'<f4'),'p.npy':npy('p',f.p,[f.Nb,f.Na],'<f4'),'u.npy':npy('u',f.u,[f.Nb,f.Na],'<f4'),'v.npy':npy('v',f.v,[f.Nb,f.Na],'<f4'),'shear.npy':npy('shear',f.shear,[f.Nb,f.Na],'<f4'),'port.npy':npy('port',f.port,[f.Nb,f.Na],'<i2')};
  return zipSync(files);}
export function exportVTK(r){const f=r.field;if(!f)throw new Error('This result has no field to export.');
  const N=f.Na*f.Nb,head=['# vtk DataFile Version 3.0','Amni-CAD internal flow','ASCII','DATASET STRUCTURED_POINTS','DIMENSIONS '+f.Na+' '+f.Nb+' 1','ORIGIN '+f.a0+' '+f.b0+' 0','SPACING '+f.dx+' '+f.dx+' 1','POINT_DATA '+N];
  const scl=(n,a)=>['SCALARS '+n+' float 1','LOOKUP_TABLE default',...[...a].map(v=>Number.isFinite(v)?v.toExponential(6):'0')];
  return [...head,...scl('mask',f.mask),...scl('gap',f.gap),...scl('p',f.p),...scl('u',f.u),...scl('v',f.v),...scl('shear',f.shear),...scl('port',f.port)].join('\n')+'\n';}
function locate(f,x,y){const i=(x-f.a0)/f.dx-0.5,j=(y-f.b0)/f.dx-0.5,i0=Math.floor(i),j0=Math.floor(j);if(i0<0||j0<0||i0>=f.Na-1||j0>=f.Nb-1)return null;const tx=i-i0,ty=j-j0;return{i0,j0,tx,ty};}
function rangeOf(f,key,o){let lo=o.min,hi=o.max;if(lo==null||hi==null){let a=Infinity,b=-Infinity;
    for(let i=0;i<f.mask.length;i++)if(f.mask[i]){const s=key==='speed'?Math.hypot(f.u[i],f.v[i]):key==='shear'?f.shear[i]:f.p[i];if(s<a)a=s;if(s>b)b=s;}
    if(lo==null)lo=Number.isFinite(a)?a:0;if(hi==null)hi=Number.isFinite(b)?b:1;}
  if(!(hi>lo))hi=lo+1;return{lo,hi};}
function sample(f,key,x,y){const L=locate(f,x,y);if(!L)return null;const{i0,j0,tx,ty}=L,at=(i,j)=>f[key][j*f.Na+i],m=at(i0,j0)*(1-tx)*(1-ty)+at(i0+1,j0)*tx*(1-ty)+at(i0,j0+1)*(1-tx)*ty+at(i0+1,j0+1)*tx*ty;return m;}
export function probePoints(r,pts){const f=r.field;if(!f)throw new Error('No flow field. Run an internal flow first.');
  return pts.map(p=>{const x=+p[0],y=+p[1],z=p[2]!=null?+p[2]:null,u=sample(f,'u',x,y),v=sample(f,'v',x,y),pr=sample(f,'p',x,y),s=sample(f,'shear',x,y),mk=sample(f,'mask',x,y);
    return{x,y,z,in_fluid:mk!=null&&mk>0.5,u,v,speed:u==null?null:Math.hypot(u,v),p:pr,shear:s};});}
export function probeLine(r,a,b,n=40){const f=r.field;if(!f)throw new Error('No flow field. Run an internal flow first.');const N=Math.max(2,n|0),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,dl=len/(N-1),pts=[];
  let flow=0,sp=0,ns=0;const mm=f.mm||1;
  for(let i=0;i<N;i++){const t=i/(N-1),x=a[0]+dx*t,y=a[1]+dy*t;pts.push([x,y]);const m=sample(f,'mask',x,y),gap=sample(f,'gap',x,y)||0,u=sample(f,'u',x,y)||0,v=sample(f,'v',x,y)||0;
    if(m>0.5){const un=u*nx+v*ny;flow+=un*(gap*mm*1e-3)*(dl*mm*1e-3);sp+=Math.hypot(u,v);ns++;}}
  return{points:probePoints(r,pts),samples:ns,mean_speed_m_s:ns?sp/ns:0,flow_m3_s:flow};}
function scalarKey(o){return o.scalar==='u'||o.scalar==='speed'?'speed':o.scalar==='shear'?'shear':'p';}
function legendFor(key,lo,hi){const unit=key==='p'?'Pa':key==='shear'?'Pa':'m/s',title=key==='p'?'Pressure':key==='shear'?'Wall shear':'Speed';return{t:title,min:0,max:1,l0:fmt(lo)+' '+unit,l1:fmt(hi)+' '+unit,lo,hi,scalar:key};}
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
  const key=scalarKey(o),rg=f?rangeOf(f,key,o):{lo:0,hi:1},lo=rg.lo,hi=rg.hi;
  const ax=r.axes||[[0,1],[1,1],[2,1]],toL=w=>{const q=[0,0,0];ax.forEach(([k,sg],j)=>q[j]=sg*w[k]);return q;};
  for(let i=0;i<n;i++){const w=[pos[3*i],pos[3*i+1],pos[3*i+2]],q=toL(w);let x=q[0],y=q[1];
    if(f){const pr=sample(f,'p',x,y),uu=sample(f,'u',x,y),vv=sample(f,'v',x,y),sh=sample(f,'shear',x,y),mk=sample(f,'mask',x,y),po=sample(f,'port',x,y);
      if(mk!=null&&mk>0.4){const val=key==='shear'?sh:key==='speed'?Math.hypot(uu||0,vv||0):pr;const t=(val-lo)/(hi-lo),c=ramp(t);
        if(po!=null&&po>=-0.2){const pc=po<0.5?[0.2,0.85,0.95]:[0.95,0.45,0.15];c[0]=c[0]*0.55+pc[0]*0.45;c[1]=c[1]*0.55+pc[1]*0.45;c[2]=c[2]*0.55+pc[2]*0.45;}
        col[3*i]=c[0];col[3*i+1]=c[1];col[3*i+2]=c[2];continue;}}
    col[3*i]=base[0];col[3*i+1]=base[1];col[3*i+2]=base[2];}
  const unit=key==='p'?'Pa':key==='shear'?'Pa':'m/s',title=key==='p'?'Pressure':key==='shear'?'Wall shear':'Speed';
  return{colors:col,legend:{t:title,min:0,max:1,l0:fmt(lo)+' '+unit,l1:fmt(hi)+' '+unit,lo,hi,scalar:key}};}
const fmt=v=>Math.abs(v)>=1000|| (Math.abs(v)>0&&Math.abs(v)<0.01)?v.toExponential(2):v.toPrecision(4);
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
