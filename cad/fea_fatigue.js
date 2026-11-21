export function reversals(x){const o=[];for(let i=0;i<x.length;i++){if(i>0&&x[i]===x[i-1])continue;if(o.length>=2){const a=o[o.length-2],b=o[o.length-1],c=x[i];if((b-a)*(c-b)>0)o.pop();}o.push(x[i]);}return o;}
export function rainflow(series){
  const p=reversals(series),s=[],cycles=[];
  for(const v of p){s.push(v);while(s.length>=3){const n=s.length,a=s[n-3],b=s[n-2],c=s[n-1],Y=Math.abs(b-a),Z=Math.abs(c-b);if(Z<Y-1e-12)break;cycles.push({range:Y,amp:Y/2,mean:(a+b)/2,count:n===3?0.5:1});if(n===3)s.shift();else s.splice(n-3,2);}}
  for(let i=0;i+1<s.length;i++){const Y=Math.abs(s[i+1]-s[i]);cycles.push({range:Y,amp:Y/2,mean:(s[i]+s[i+1])/2,count:0.5});}
  return cycles;
}
export function snPoints(sn){const Sut=sn.sut||sn.Sut||0,S1=sn.S1!=null?sn.S1:0.9*Sut,N1=sn.N1||1e3,S2=sn.S2!=null?sn.S2:(sn.se!=null?sn.se:sn.Se),N2=sn.N2||sn.Nse||1e6;return{S1,N1,S2,N2,knee:sn.knee!==false,sut:Sut,sy:sn.sy||sn.Sy||Sut,sf:sn.sf||sn.sfPrime||Sut};}
export function snLife(sa,sn){
  if(!(sa>0))return Infinity;const{S1,N1,S2,N2,knee}=snPoints(sn);if(!(S1>0)||!(S2>0)||!(N2>N1))return sa>0?1:Infinity;
  const b=Math.log(S2/S1)/Math.log(N2/N1);if(sa>=S1)return Math.max(1,N1*Math.pow(sa/S1,1/b));if(knee&&sa<=S2)return Infinity;return N1*Math.pow(sa/S1,1/b);
}
export function equivAmp(sa,sm,sn,corr){
  const{sut,sy,sf}=snPoints(sn),m=Math.max(0,sm||0),name=corr||'goodman';
  if(name==='none'||!(m>0))return sa;
  const den=name==='gerber'?1-Math.min(0.999,(m/sut)**2):name==='soderberg'?1-Math.min(0.999,m/sy):name==='morrow'?1-Math.min(0.999,m/sf):1-Math.min(0.999,m/sut);
  return den<=0?Infinity:sa/den;
}
export function fatigueSF(sa,sm,sn,corr){
  const{S2,sut,sy,sf}=snPoints(sn),m=Math.max(0,sm||0),Se=S2,name=corr||'goodman';if(!(sa>0))return Infinity;if(!(Se>0))return 0;
  if(name==='none'||!(m>0))return Se/sa;
  if(name==='gerber'){const A=(m/sut)**2,B=sa/Se;if(A<1e-14)return 1/B;return (-B+Math.sqrt(B*B+4*A))/(2*A);}
  const den=name==='soderberg'?sa/Se+m/sy:name==='morrow'?sa/Se+m/sf:sa/Se+m/sut;return den>0?1/den:0;
}
export function miner(cycles,lifeOf){let D=0;const rows=[];for(const c of cycles){const N=lifeOf(c.amp,c.mean),d=!isFinite(N)?0:c.count*(c.repeats||1)/N;D+=d;rows.push({range:c.range,amp:c.amp,mean:c.mean,count:c.count,N,d});}return{D,rows,life:D>0?1/D:Infinity};}
function enEq(twoN,E,p,sm){const sf=p.sf,b=p.b,ef=p.ef,c=p.c,mor=p.swt?1:Math.max(0,1-(sm||0)/sf);return (sf/E)*Math.pow(twoN,b)*mor+ef*Math.pow(twoN,c);}
export function enLife(ea,E,p,sm){
  if(!(ea>0)||!p||!(E>0))return Infinity;if(p.swt)return swtLife(ea,E,p,sm);
  let lo=1,hi=1e16;if(enEq(lo,E,p,sm)<ea)return 0.5;if(enEq(hi,E,p,sm)>ea)return Infinity;
  for(let i=0;i<70;i++){const m=Math.sqrt(lo*hi);enEq(m,E,p,sm)>ea?lo=m:hi=m;}return 0.5*Math.sqrt(lo*hi);
}
function swtLife(ea,E,p,smax){const sig=Math.max(smax||0,0);if(!(sig>0))return Infinity;const target=sig*ea*E,f=twoN=>{const t=Math.pow(twoN,p.b);return p.sf*p.sf*t*t+p.sf*p.ef*E*Math.pow(twoN,p.b+p.c);};let lo=1,hi=1e16;if(f(lo)<target)return 0.5;if(f(hi)>target)return Infinity;for(let i=0;i<70;i++){const m=Math.sqrt(lo*hi);f(m)>target?lo=m:hi=m;}return 0.5*Math.sqrt(lo*hi);}
export function cycleLife(sa,sm,sn,opt){
  const corr=(opt&&opt.corr)||'goodman',sar=equivAmp(sa,sm,sn,corr),method=opt&&opt.method;
  if(method==='en'&&opt.en&&opt.E){const ea=sar/opt.E+(opt.efTerm||0);return enLife(opt.ea!=null?opt.ea:sar/opt.E,opt.E,opt.en,sm);}
  return snLife(sar,sn);
}
export function historyDamage(stress,hist,sn,opt){
  const h=hist&&hist.length?hist:[0,1,0],series=h.map(s=>stress*s),cycles=rainflow(series),rep=(opt&&opt.repeats)||1;
  const lifeOf=(amp,mean)=>cycleLife(amp,mean,sn,opt),m=miner(cycles.map(c=>({...c,repeats:rep})),lifeOf);
  return{...m,cycles:m.rows,sf:fatigueSF(Math.abs(stress)/2,Math.abs(stress)/2,sn,(opt&&opt.corr)||'goodman')};
}
export function fatigueField(sig,sn,opt){
  const n=sig.length,life=new Float32Array(n),dmg=new Float32Array(n),sf=new Float32Array(n);let lifeMin=Infinity,dmgMax=0,sfMin=Infinity,hot=0;
  const corr=(opt&&opt.corr)||'goodman',meanK=opt&&opt.mean!=null?opt.mean:0,hist=opt&&opt.hist;
  for(let i=0;i<n;i++){
    const s=sig[i];if(!(s>0)){life[i]=Infinity;sf[i]=Infinity;continue;}
    let N,D,nSF;
    if(hist&&hist.length){const r=historyDamage(s,hist,sn,{...opt,corr});N=r.life;D=r.D;const amps=r.rows;let a=0,m=0;for(const c of amps){a=Math.max(a,c.amp);m=c.mean;}nSF=fatigueSF(a,Math.max(0,m),sn,corr);}
    else{const sa=Math.abs(s),sm=meanK?meanK*sa:0;N=cycleLife(sa,sm,sn,{...opt,corr});D=isFinite(N)?((opt&&opt.repeats)||1)/N:0;nSF=fatigueSF(sa,sm,sn,corr);}
    life[i]=N;dmg[i]=D;sf[i]=nSF;if(N<lifeMin){lifeMin=N;hot=i;}if(D>dmgMax)dmgMax=D;if(nSF<sfMin)sfMin=nSF;
  }
  return{life,damage:dmg,sf,lifeMin,damageMax:dmgMax,sfMin,hot};
}
export function modalNewmark(omega,force,dt,steps,zeta){
  const m=omega.length,q=new Float64Array(m),v=new Float64Array(m),a=new Float64Array(m),b=0.25,g=0.5,out=[];
  const a0=1/(b*dt*dt),a1=g/(b*dt),a2=1/(b*dt),a3=1/(2*b)-1,a4=g/b-1,a5=dt*(g/(2*b)-1);
  for(let i=0;i<m;i++)a[i]=force(0)[i];
  for(let s=0;s<steps;s++){
    const f=force(s+1),qn=new Float64Array(m);
    for(let i=0;i<m;i++){const w=omega[i],k=w*w,c=2*(zeta||0)*w,ke=k+a0+a1*c,pe=f[i]+(a0*q[i]+a2*v[i]+a3*a[i])+c*(a1*q[i]+a4*v[i]+a5*a[i]);qn[i]=pe/ke;}
    for(let i=0;i<m;i++){const an=a0*(qn[i]-q[i])-a2*v[i]-a3*a[i],vn=v[i]+dt*((1-g)*a[i]+g*an);q[i]=qn[i];v[i]=vn;a[i]=an;}
    out.push(q.slice());
  }
  return out;
}
export function frf(mf,wN,w,zeta){const w2=wN*wN,d=w2-w*w,c=2*(zeta||0)*w*wN,den=d*d+c*c||1e-30;return{re:mf*d/den,im:-mf*c/den,amp:Math.abs(mf)/Math.sqrt(den)};}
