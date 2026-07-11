let pass=0,fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL: '+m))};
const ap=(a,b,m,r)=>ok(typeof a==='number'&&isFinite(a)&&Math.abs(a-b)<=Math.abs(b)*(r||1e-9)+1e-12,m+' got '+a+' want '+b);
const SCH40=[['½"','DN15',15.80],['¾"','DN20',20.93],['1"','DN25',26.64],['1¼"','DN32',35.05],['1½"','DN40',40.89],['2"','DN50',52.50],['2½"','DN65',62.71],['3"','DN80',77.93],['4"','DN100',102.26],['5"','DN125',128.19],['6"','DN150',154.05],['8"','DN200',202.72],['10"','DN250',254.51],['12"','DN300',303.23]];
ap(60.33-2*3.91,52.51,'2" Sch40 ID from OD/wall',1e-3);
ap(114.30-2*6.02,102.26,'4" Sch40 ID from OD/wall',1e-3);
ok(SCH40.every((p,i)=>i===0||p[2]>SCH40[i-1][2]),'ID ladder strictly ascending');
const pipeF=(Re,rr)=>Re<2300?64/Re:0.25/Math.pow(Math.log10(rr/3.7+5.74/Math.pow(Re,0.9)),2);
function pick(Qh,L,dpkPa,rho,mu,e,K,vmax){
  const Q=Qh/3600;
  for(const[nps,dn,idmm]of SCH40){
    const D=idmm/1000,vel=Q/(Math.PI*D*D/4),Re=rho*vel*D/mu;
    const f=pipeF(Re,e/D),dp=(f*L/D+K)*rho*vel*vel/2;
    if(dp<=dpkPa*1000&&vel<=vmax)return{dn,vel,Re,f,dp};
  }
  return null;
}
const p1=pick(10,50,50,998,1e-3,4.5e-5,5,3.0);
ok(p1&&p1.dn==='DN50','water 10m3h/50m/50kPa/K5 discharge -> DN50, got '+(p1&&p1.dn));
ok(p1&&p1.dp>20000&&p1.dp<24000,'DN50 dp ~22 kPa, got '+(p1&&(p1.dp/1000).toFixed(1)));
ok(p1&&p1.vel>1.2&&p1.vel<1.35,'DN50 v ~1.28 m/s, got '+(p1&&p1.vel.toFixed(2)));
ok(p1&&p1.Re>60000&&p1.Re<75000,'DN50 Re ~67k turbulent');
const p2d=pick(30,50,100,998,1e-3,4.5e-5,5,3.0),p2s=pick(30,50,100,998,1e-3,4.5e-5,5,1.5);
ok(p2d&&p2d.dn==='DN65','30m3h discharge -> DN65 (2.70 m/s, 77 kPa of 100), got '+(p2d&&p2d.dn));
ok(p2d&&p2d.dp>73000&&p2d.dp<80000,'DN65 dp ~77 kPa, got '+(p2d&&(p2d.dp/1000).toFixed(1)));
ok(p2s&&p2s.dn==='DN100','30m3h suction velocity-gated -> DN100, got '+(p2s&&p2s.dn));
ok(p2s.vel<p2d.vel&&p2s.vel<=1.5,'suction pick slower than discharge and under cap');
const p3=pick(2,20,50,857,2.75e-2,4.5e-5,5,3.0);
ok(p3&&p3.dn==='DN25','VG32 oil 2m3h/20m -> DN25, got '+(p3&&p3.dn));
ok(p3&&p3.Re<2300,'oil pick is laminar, Re='+(p3&&p3.Re.toFixed(0)));
ok(p3&&Math.abs(p3.f-64/p3.Re)<1e-12,'laminar f=64/Re exact');
ok(p3&&p3.dp>24000&&p3.dp<30000,'DN25 oil dp ~27 kPa, got '+(p3&&(p3.dp/1000).toFixed(1)));
ok(pick(2,20,50,857,2.75e-2,4.5e-5,5,3.0).dn!=='DN20','DN20 oil fails dp (~70 kPa > 50)');
ok(pick(500,2000,10,998,1e-3,4.5e-5,0,3.0)===null,'impossible spec returns null verdict');
const swj=pipeF(1e5,1e-3);
ok(swj>0.02&&swj<0.024,'Swamee-Jain sanity at Re 1e5 rr 1e-3, got '+swj.toFixed(4));
const MOTOR_KW=[0.75,1.1,1.5,2.2,3,4,5.5,7.5,11,15,18.5,22,30,37,45,55,75,90,110,132,160,200];
const NEMA_HP=[1,1.5,2,3,5,7.5,10,15,20,25,30,40,50,60,75,100,125,150,200,250];
function motor(T,N,hz,mg,slip){
  const Preq=T*N*2*Math.PI/60000;
  const sy=[2,4,6,8].map(p=>({p,ns:120*hz/p})).filter(s=>s.ns>=N).sort((a,b)=>a.ns-b.ns)[0];
  if(!sy)return{over:true};
  return{Preq,sy,kw:MOTOR_KW.find(k=>k>=Preq*mg),hp:NEMA_HP.find(h=>h>=Preq*mg/0.7457),nfl:Math.round(sy.ns*(1-slip))};
}
const m1=motor(40,1750,60,1.15,0.04);
ap(m1.Preq,7.3304,'40Nm@1750 P=7.33 kW',1e-3);
ok(m1.kw===11,'IEC pick 11 kW (7.33*1.15=8.43), got '+m1.kw);
ok(m1.hp===15,'NEMA pick 15 HP (11.3 required), got '+m1.hp);
ok(m1.sy.p===4&&m1.sy.ns===1800,'4-pole 1800 sync for 1750 rpm');
ap(m1.nfl,1728,'FL est 1728 rpm at 4% slip');
const m2=motor(95,2900,50,1.15,0.04);
ok(m2.Preq>28.7&&m2.Preq<29.0,'95Nm@2900 P~28.85 kW, got '+m2.Preq.toFixed(2));
ok(m2.kw===37&&m2.hp===50,'50Hz pick 37 kW / 50 HP, got '+m2.kw+'/'+m2.hp);
ok(m2.sy.p===2&&m2.sy.ns===3000,'2-pole 3000 sync at 50 Hz for 2900 rpm');
ok(motor(10,4000,60,1.15,0.04).over===true,'4000 rpm at 60 Hz -> over-sync verdict');
ok(motor(10,3100,50,1.15,0.04).over===true,'3100 rpm at 50 Hz -> over-sync verdict');
const fla=11*1000/(Math.sqrt(3)*460*0.85*0.90);
ok(fla>17.5&&fla<18.5,'11 kW @460V FLA ~18 A, got '+fla.toFixed(2));
ap(11*9550/1728,60.79,'11 kW FL torque avail 60.8 Nm > 40 needed',1e-3);
const m3=motor(2000,100,60,1.15,0.10);
ok(m3.kw===30&&m3.sy.ns===900,'2000Nm@100rpm -> 30 kW on 8-pole 900 sync (gearbox implied by slip warn)');
ok(motor(4000,1500,60,1.15,0.04).kw===undefined,'628 kW required -> beyond-ladder verdict');
console.log(pass+' passed, '+fail+' failed');
process.exitCode=fail?1:0;
