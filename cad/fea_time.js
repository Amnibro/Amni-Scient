export function sampleCurve(curve,t){
  if(!curve||!curve.length)return 1;
  const a=curve[0],z=curve[curve.length-1];
  if(t<=a.t)return a.v;
  if(t>=z.t)return z.v;
  for(let i=1;i<curve.length;i++){const b=curve[i];if(t<=b.t){const p=curve[i-1],k=(t-p.t)/((b.t-p.t)||1);return p.v+(b.v-p.v)*k;}}
  return z.v;
}
export function bcAt(bc,t,key){
  const c=bc&&bc.curve;if(!c||!c.length)return bc?bc[key]:undefined;
  return sampleCurve(c.map(p=>({t:p.t,v:p[key]!=null?p[key]:p.v})),t);
}
function stepModes(omega,q,v,a,dt,f1,f0,zeta,alpha){
  const n=omega.length,beta=(1-alpha)*(1-alpha)/4,gamma=0.5-alpha,a0=1/(beta*dt*dt),a1=gamma/(beta*dt),a2=1/(beta*dt),a3=1/(2*beta)-1,a4=gamma/beta-1,a5=dt*(gamma/(2*beta)-1);
  const qn=new Float64Array(n),vn=new Float64Array(n),an=new Float64Array(n);
  for(let i=0;i<n;i++){
    const w=omega[i],k=w*w,c=2*(zeta||0)*w,ke=(1+alpha)*k+a0+(1+alpha)*c*a1;
    const pe=(1+alpha)*f1[i]-alpha*f0[i]+(a0*q[i]+a2*v[i]+a3*a[i])+c*((1+alpha)*(a1*q[i]+a4*v[i]+a5*a[i])-alpha*v[i])+alpha*k*q[i];
    qn[i]=pe/(ke||1e-30);an[i]=a0*(qn[i]-q[i])-a2*v[i]-a3*a[i];vn[i]=v[i]+dt*((1-gamma)*a[i]+gamma*an[i]);
  }
  return{q:qn,v:vn,a:an};
}
export function decimate(rows,keep){
  const n=rows.length,m=Math.max(2,keep||70);if(n<=m)return rows;
  const peak=rows.reduce((b,r,i)=>Math.abs(r.amp!=null?r.amp:r.q?r.q[0]:0)>Math.abs(b.v)?{i,v:r.amp!=null?r.amp:r.q[0]}:b,{i:0,v:0}).i;
  const pick=new Set([0,n-1,peak]);
  for(let k=1;k<m-2;k++)pick.add(Math.min(n-1,Math.round(k*(n-1)/(m-1))));
  return [...pick].sort((a,b)=>a-b).map(i=>rows[i]);
}
export function integrateModes(omega,forceAt,opt={}){
  const n=omega.length,alpha=opt.method==='hht'?(opt.alpha!=null?+opt.alpha:-0.1):0,zeta=opt.zeta||0,dt0=+opt.dt||1e-4,steps=Math.max(1,opt.steps|0||70);
  const q=new Float64Array(n),v=new Float64Array(n),a=new Float64Array(n);
  for(let i=0;i<n;i++){q[i]=opt.u0&&opt.u0[i]||0;v[i]=opt.v0&&opt.v0[i]||0;}
  const f0=forceAt(0);for(let i=0;i<n;i++)a[i]=f0[i]-omega[i]*omega[i]*q[i]-2*zeta*omega[i]*v[i];
  const rows=[],tol=opt.tol||1e-3;let t=0,dt=dt0,done=0,tries=0,prev=forceAt(0);
  while(done<steps&&tries<(opt.adaptive?700:steps+2)){
    tries++;const f1=forceAt(t+dt),one=stepModes(omega,q,v,a,dt,f1,prev,zeta,alpha);
    let use=one,span=dt;
    if(opt.adaptive){
      const h=dt/2,fm=forceAt(t+h),mid=stepModes(omega,q,v,a,h,fm,prev,zeta,alpha),two=stepModes(omega,mid.q,mid.v,mid.a,h,f1,fm,zeta,alpha);
      let err=0,ref=1e-12;for(let i=0;i<n;i++){err=Math.max(err,Math.abs(two.q[i]-one.q[i]));ref=Math.max(ref,Math.abs(two.q[i]));}
      if(err/ref>tol&&dt>dt0/7){dt*=0.5;continue;}
      use=two;if(err/ref<tol/7)dt=Math.min(dt*1.4,dt0*7);
    }
    q.set(use.q);v.set(use.v);a.set(use.a);t+=span;prev=f1;done++;rows.push({t,q:Float64Array.from(q),dt:span});
    opt.onStep&&tries%7===0&&opt.onStep({step:done,steps,t});
  }
  return decimate(rows,opt.keep||70);
}
