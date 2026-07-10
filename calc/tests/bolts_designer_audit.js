let pass=0,fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL: '+m))};
const ap=(a,b,m,r)=>ok(typeof a==='number'&&isFinite(a)&&Math.abs(a-b)<=Math.abs(b)*(r||1e-9)+1e-12,m+' got '+a+' want '+b);
const SIZES=[['M4',{d:4,p:0.7,At:8.78}],['M5',{d:5,p:0.8,At:14.2}],['M6',{d:6,p:1.0,At:20.1}],['M8',{d:8,p:1.25,At:36.6}],['M10',{d:10,p:1.5,At:58.0}],['M12',{d:12,p:1.75,At:84.3}],['M16',{d:16,p:2.0,At:157}]];
function pick(n,Sp,Fext,Fsh,pre,C,K){
  const FextPer=Fext/n,FshPer=Fsh/n;
  for(const[key,z]of SIZES){
    const Fi=pre*Sp*z.At,Fb=Fi+C*FextPer,sb=Fb/z.At,use=sb/Sp,sep=FextPer>0?Fi/(FextPer*(1-C)):Infinity;
    const tau=FshPer/z.At,IR=Math.pow(sb/Sp,2)+Math.pow(tau/(0.577*Sp),2);
    if(use<=0.9&&sep>=1.5&&IR<1)return{key,z,Fi,use,sep,IR,T:K*Fi*z.d/1000};
  }
  return null;
}
const r=pick(4,585,20000,0,0.75,0.25,0.20);
ok(r&&r.key==='M6','4x SAE-5, 20kN total -> M6 (M5 proof usage 90.04% just fails), got '+(r&&r.key));
const m5use=(0.75*585*14.2+0.25*5000)/14.2/585;
ok(m5use>0.9&&m5use<0.901,'M5 boundary case verified: proof usage '+(m5use*100).toFixed(2)+'%');
ap(r.Fi,0.75*585*20.1,'M6 preload 8819 N');
ap(r.T,0.20*0.75*585*20.1*6/1000,'M6 torque 10.58 N·m');
ok(r.use<0.9&&r.sep>1.5&&r.IR<1,'all criteria pass on pick');
const r2=pick(8,585,20000,0,0.75,0.25,0.20);
ok(r2.key<=r.key||r2.z.At<=r.z.At,'more bolts -> same or smaller size, got '+r2.key);
const r3=pick(4,310,20000,0,0.75,0.25,0.20);
ok(r3&&r3.z.At>r.z.At,'weaker material (Sp=310) -> bigger bolt, got '+r3.key);
const r4=pick(2,585,0,30000,0.75,0.25,0.20);
ok(r4&&r4.IR<1,'pure-shear design solves via IR, got '+(r4&&r4.key));
const r5=pick(1,585,900000,0,0.75,0.25,0.20);
ok(r5===null,'impossible load returns null (no silent oversize)');
console.log(pass+' passed, '+fail+' failed');
process.exitCode=fail?1:0;
