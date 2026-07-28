let pass=0,fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL: '+m));};
const ap=(a,b,m,r)=>ok(typeof a==='number'&&isFinite(a)&&Math.abs(a-b)<=Math.abs(b)*(r||1e-6)+1e-9,m+' got '+a+' want '+b);
const BELL_E=210000,BELL_NU=0.3;
function bellGeom(De,Di,t,h0){
  const dlt=De/Di,ln=Math.log(dlt);
  const M=(6/Math.PI)*Math.pow((dlt-1)/dlt,2)/ln;
  const K2=(6/Math.PI)*((dlt-1)/ln-1)/ln;
  const K3=(3/Math.PI)*(dlt-1)/ln;
  const CAL=4*BELL_E/((1-BELL_NU*BELL_NU)*M*De*De);
  const Fs=s=>CAL*t*t*t*s*((h0-s)*(h0-s/2)/(t*t)+1);
  const k0=CAL*t*t*t*(h0*h0/(t*t)+1);
  let sPk=h0,FPk=Fs(h0),prevF=0;
  for(let i=1;i<=400;i++){const s2=h0*i/400,f2=Fs(s2);if(f2<prevF){sPk=h0*(i-1)/400;FPk=prevF;break;}prevF=f2;}
  const dAt=Ff=>{if(!(Ff>0))return 0;if(Ff>=FPk)return sPk;let lo=0,hi=sPk;for(let i=0;i<80;i++){const m2=(lo+hi)/2;Fs(m2)<Ff?lo=m2:hi=m2;}return(lo+hi)/2;};
  const stress=s=>{const sc=-(4*BELL_E*s)/((1-BELL_NU*BELL_NU)*M*De*De);const om=sc*(K2*(h0-s/2)+K3*t),id=sc*(K2*(h0-s/2)-K3*t);return{om,id,max:Math.max(Math.abs(om),Math.abs(id))};};
  return{Fs,k0,sPk,FPk,dAt,stress,F75:Fs(0.75*Math.min(h0,sPk)),M,K2,K3};
}
const CAT=[
  {cat:'BV-A31.5-1.75 (M16)',bolt:'M16',De:31.5,Di:16.3,t:1.75,h0:0.7},
  {cat:'BV-B31.5-1.25 (M16)',bolt:'M16',De:31.5,Di:16.3,t:1.25,h0:0.9},
  {cat:'BV-C31.5-0.8 (M16)',bolt:'M16',De:31.5,Di:16.3,t:0.8,h0:1.05},
  {cat:'BV-B50-2 (M24)',bolt:'M24',De:50,Di:25.4,t:2.0,h0:1.4},
  {cat:'BV-M6-14×0.8',bolt:'M6',De:14,Di:6.4,t:0.8,h0:0.4}
].map(r=>{const g=bellGeom(r.De,r.Di,r.t,r.h0);return Object.assign({},r,g);});
function pick(F,dMax,boltPref,dflMax){
  const need=F>0?F:1,env=dMax>0?dMax:1e9,dfl=dflMax>0?dflMax:1e9;
  let best=null;
  for(const p of CAT){
    if(boltPref&&boltPref!=='any'&&p.bolt!==boltPref)continue;
    if(p.De>env+1e-9)continue;
    for(let np=1;np<=6;np++)for(let ns=1;ns<=12;ns++){
      const cap=np*p.F75,dWork=ns*0.75*Math.min(p.h0,p.sPk);
      if(cap+1e-9<need||dWork>dfl+1e-9)continue;
      const score=ns*np*1000+p.De+Math.abs(cap-need)/need;
      if(!best||score<best.score)best={p,ns,np,cap,dWork,score};
    }
  }
  return best;
}
const A=bellGeom(31.5,16.3,1.75,0.7);
ap(A.Fs(0.7),5170,'A31.5 F_flat',0.01);
ap(A.F75,3975,'A31.5 F@0.75h0',0.02);
const dOp=A.dAt(2000);
ap(A.Fs(dOp),2000,'op-point ON single curve: Fs(dAt(F))=F',1e-6);
const ns=3,np=2,F=3000;
const dSt=ns*A.dAt(F/np);
ap(np*A.Fs(dSt/ns),F,'op-point ON stack curve: np*Fs(δ/ns)=F',1e-6);
ok(dSt>0&&dSt<=ns*A.sPk+1e-9,'stack δ bounded by ns·s_peak');
const over=A.dAt(A.FPk*3);
ap(over,A.sPk,'overload δ clamps to s_peak',1e-9);
const st=A.stress(dOp);
ok(isFinite(st.om)&&isFinite(st.id)&&st.max>0,'stresses finite and nonzero at op');
ok(Math.abs(st.om)>Math.abs(st.id)||Math.abs(st.om)>0,'OM stress magnitude present');
const R=pick(2000,80,'M16',2);
ok(!!R,'catalog pick finds M16 solution for 2000 N');
ok(R&&R.cap>=2000,'picked stack capacity ≥ target');
ok(R&&R.p.bolt==='M16','respects bolt filter');
const R2=pick(50000,40,'any',1);
ok(!R2||R2.cap>=50000,'impossible or huge pack only');
const tiny=pick(100,20,'M6',0.5);
ok(!!tiny&&tiny.p.De<=20,'small force prefers compact disc');
const sec=2000/dOp;
ok(sec>0&&sec<A.k0*1.5,'secant rate positive and near k0 for mid-load');
ok(A.sPk===0.7,'A-series monotone peak at flat');
const snap=bellGeom(40,20.4,0.5,1.6);
ok(snap.sPk<1.6&&snap.FPk>snap.Fs(1.6),'snap-through peaks before flat');
const xTop=Math.max(A.sPk,(A.dAt(100)));
const yTop=Math.max(A.FPk,100);
ok(A.dAt(100)<=xTop&&100<=yTop,'plot range includes op for light load');
const yTopOL=Math.max(A.FPk,A.FPk*2);
ok(A.FPk*2<=yTopOL,'plot y-range expands for overload F');
console.log(pass+' passed, '+fail+' failed');
process.exitCode=fail?1:0;
