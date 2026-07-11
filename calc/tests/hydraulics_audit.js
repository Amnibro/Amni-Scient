let pass=0,fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL: '+m))};
const ap=(a,b,m,r)=>ok(typeof a==='number'&&isFinite(a)&&Math.abs(a-b)<=Math.abs(b)*(r||1e-9)+1e-12,m+' got '+a+' want '+b);
const BORES=[25,32,40,50,63,80,100,125,160,200,250];
const RODS=[12,14,16,18,20,22,25,28,32,36,40,45,50,56,63,70,80,90,100,110,125,140,160,180];
const E=2.1e11,FoS=3.5,eta=0.9;
function pick(FkN,dir,Pbar,Smm,K){
  const F=FkN*1000,P=Pbar*1e5,S=Smm/1000,Areq=F/(P*eta);
  let rodReq;
  if(dir==='push'){const Ireq=FoS*F*Math.pow(K*S,2)/(Math.PI*Math.PI*E);rodReq=Math.pow(64*Ireq/Math.PI,0.25)*1000;}
  else rodReq=Math.sqrt(4*F/(100e6*Math.PI))*1000;
  const rod=RODS.find(r=>r>=rodReq);
  if(!rod)return{rodReq};
  for(const b of BORES){
    if(rod>=b)continue;
    const Ab=Math.PI*b*b/4e6,Aact=dir==='push'?Ab:Ab-Math.PI*rod*rod/4e6;
    if(Aact>=Areq)return{b,rod,rodReq,Ab,Aann:Ab-Math.PI*rod*rod/4e6};
  }
  return{rod,rodReq,nobore:true};
}
const c1=pick(50,'push',160,800,1.0);
ap(50000/(160e5*0.9)*1e6,3472.2,'A_req 3472 mm2 for 50kN@160bar eta.9',1e-3);
ok(c1.b===80,'push 50kN@160bar -> bore 80 (63 gives only 44.9kN), got '+c1.b);
ok(c1.rodReq>32&&c1.rodReq<33,'Euler rod req ~32.4mm (800mm pinned FoS3.5), got '+c1.rodReq.toFixed(1));
ok(c1.rod===36,'rounds to rod 36, got '+c1.rod);
const Ab63=Math.PI*63*63/4e6;
ok(160e5*Ab63*0.9/1000<50,'bore 63 fails: '+(160e5*Ab63*0.9/1000).toFixed(1)+' kN < 50');
const Fext=160e5*c1.Ab*0.9/1000,Fret=160e5*c1.Aann*0.9/1000;
ok(Fext>72&&Fext<73,'bore80 extend 72.4 kN, got '+Fext.toFixed(1));
ok(Fret>57&&Fret<59,'bore80/rod36 retract ~58 kN, got '+Fret.toFixed(1));
const I36=Math.PI*Math.pow(0.036,4)/64,Pcr=Math.PI*Math.PI*E*I36/Math.pow(0.8,2);
ok(Pcr/50000>=3.5,'chosen rod 36 achieves FoS>=3.5, got '+(Pcr/50000).toFixed(2));
const I32=Math.PI*Math.pow(0.032,4)/64;
ok(Math.PI*Math.PI*E*I32/0.64/50000<3.5,'rod 32 would MISS FoS 3.5 (ladder pick is minimal)');
const c2=pick(50,'pull',160,800,1.0);
ok(c2.rodReq>25&&c2.rodReq<25.5,'pull rod tension req ~25.2mm at 100MPa, got '+c2.rodReq.toFixed(1));
ok(c2.rod===28&&c2.b===80,'pull -> rod 28 bore 80 (63 annulus 2501mm2 < 3472), got '+c2.rod+'/'+c2.b);
const c3=pick(50,'push',160,3000,2.0);
ok(c3.rodReq>80,'3m stroke fixed-free needs monster rod, got '+c3.rodReq.toFixed(0));
ok(pick(2000,'push',100,500,1.0).nobore===true,'2MN @100bar exceeds bore 250 -> no-bore verdict');
const Q=c1.Ab*0.1*60000;
ok(Q>30&&Q<30.4,'flow for 100mm/s on bore80 ~30.2 L/min, got '+Q.toFixed(1));
ap(160e5*(Q/60000)/1000,8.04,'hydraulic power ~8.0 kW',1e-2);
const vret=(Q/60000)/c1.Aann*1000;
ok(vret>125&&vret<126,'retract speed faster: ~125.5 mm/s, got '+vret.toFixed(1));
ap(c1.Ab/c1.Aann,1.2547,'area ratio phi 1.25',1e-3);
function accum(dv,p1,p2,n){
  const atm=1.013,p0=0.9*p1+atm,p1a=p1+atm,p2a=p2+atm;
  return dv/(Math.pow(p0/p1a,1/n)-Math.pow(p0/p2a,1/n));
}
ap(accum(2,150,210,1),7.8095,'accumulator 2L 150-210bar isothermal -> 7.81 L',1e-3);
ap(accum(2,150,210,1.4),10.140,'adiabatic -> 10.14 L (bigger shell for rapid discharge)',1e-3);
ok(accum(2,150,210,1.4)>accum(2,150,210,1),'adiabatic always larger than isothermal');
ok(accum(1,100,300,1)<accum(2,100,300,1),'V0 scales with dV');
const wide=accum(2,150,160,1),narrow=accum(2,150,210,1);
ok(wide>narrow,'narrow pressure band needs bigger accumulator');
console.log(pass+' passed, '+fail+' failed');
process.exitCode=fail?1:0;
