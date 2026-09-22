export const G0=9.80665,RU=8314.462;
export const PROPS={
kerolox:{name:'LOX / RP-1',rho_o:1141,rho_f:810,ofMin:1.8,ofMax:3.4,ofOpt:2.55,of:[1.8,2.27,2.55,2.9,3.4],Tc:[3360,3600,3700,3680,3560],M:[20.6,22.4,23.5,24.6,26.0],g:[1.24,1.215,1.205,1.19,1.17]},
hydrolox:{name:'LOX / LH2',rho_o:1141,rho_f:70.8,ofMin:3.5,ofMax:8.0,ofOpt:5.5,of:[3.5,4.5,5.5,6.5,8.0],Tc:[2880,3260,3520,3620,3540],M:[8.7,10.4,12.4,14.2,18.0],g:[1.265,1.24,1.22,1.20,1.165]},
methalox:{name:'LOX / CH4',rho_o:1141,rho_f:423,ofMin:2.6,ofMax:4.2,ofOpt:3.55,of:[2.6,3.1,3.55,3.9,4.2],Tc:[3210,3430,3550,3560,3520],M:[17.1,18.9,20.4,21.7,22.8],g:[1.19,1.175,1.165,1.155,1.15]},
hypergolic:{name:'N2O4 / UDMH',rho_o:1443,rho_f:793,ofMin:1.8,ofMax:3.2,ofOpt:2.6,of:[1.8,2.2,2.6,2.9,3.2],Tc:[3050,3260,3380,3360,3290],M:[21.0,22.6,23.9,24.8,25.6],g:[1.23,1.215,1.205,1.195,1.185]},
ethalox:{name:'LOX / Ethanol',rho_o:1141,rho_f:789,ofMin:1.2,ofMax:2.5,ofOpt:1.8,of:[1.2,1.5,1.8,2.1,2.5],Tc:[2950,3200,3320,3330,3260],M:[20.0,21.6,23.0,24.1,25.5],g:[1.22,1.21,1.20,1.19,1.18]},
h2o2ker:{name:'H2O2 (90%) / Kerosene',rho_o:1390,rho_f:810,ofMin:6.0,ofMax:9.0,ofOpt:7.3,of:[6.0,6.8,7.5,8.2,9.0],Tc:[2740,2830,2870,2860,2810],M:[21.4,22.0,22.6,23.1,23.6],g:[1.215,1.21,1.205,1.20,1.195]},
hybrid:{name:'N2O / HTPB (hybrid)',rho_o:786,rho_f:920,ofMin:4.5,ofMax:8.5,ofOpt:6.5,of:[4.5,5.5,6.5,7.5,8.5],Tc:[2950,3120,3200,3180,3120],M:[24.4,25.6,26.6,27.3,27.9],g:[1.22,1.21,1.20,1.19,1.185]},
solid:{name:'APCP (solid)',rho_o:1750,rho_f:1750,ofMin:7.0,ofMax:7.0,ofOpt:7.0,of:[7.0],Tc:[3210],M:[27.5],g:[1.18],solid:true}};
export const CYCLES={
pressfed:{name:'Pressure-Fed',pcMax:3.5e6,tw:25,massK:1.0},
gasgen:{name:'Gas-Generator',pcMax:1.4e7,tw:85,massK:1.0,cstarLoss:0.985},
tapoff:{name:'Tap-Off',pcMax:1.2e7,tw:90,massK:0.98,cstarLoss:0.99},
expander:{name:'Expander',pcMax:7e6,tw:55,massK:1.05},
staged:{name:'Staged-Combustion',pcMax:3.2e7,tw:110,massK:1.15},
ffsc:{name:'Full-Flow Staged',pcMax:3.5e7,tw:120,massK:1.22,cstarLoss:0.995},
epump:{name:'Electric Pump',pcMax:1.0e7,tw:45,massK:1.1,cstarLoss:0.99},
solid:{name:'Solid Motor',pcMax:1.0e7,tw:35,massK:0.7}};
export const NOZZLES={
bell:{name:'Bell (de Laval)',cfEff:0.985,massK:1.0},
conical:{name:'Conical (15°)',cfEff:0.970,massK:0.88},
aerospike:{name:'Aerospike (alt-comp)',cfEff:0.972,massK:1.25,aero:true},
dualbell:{name:'Dual-Bell',cfEff:0.978,massK:1.12,aero:true}};
const interp=(xs,ys,x)=>{if(x<=xs[0])return ys[0];if(x>=xs[xs.length-1])return ys[ys.length-1];let i=1;while(x>xs[i])i++;const t=(x-xs[i-1])/(xs[i]-xs[i-1]);return ys[i-1]+t*(ys[i]-ys[i-1]);};
export const combust=(prop,of)=>{const p=PROPS[prop];const o=p.solid?p.of[0]:Math.max(p.ofMin,Math.min(p.ofMax,of));return{Tc:interp(p.of,p.Tc,o),M:interp(p.of,p.M,o),gam:interp(p.of,p.g,o)};};
export const gammaFn=g=>Math.sqrt(g)*Math.pow(2/(g+1),(g+1)/(2*(g-1)));
export const cstar=(Tc,M,gam)=>Math.sqrt(RU*Tc/M)/gammaFn(gam);
export const peRatio=(eps,gam)=>{const xc=Math.pow(2/(gam+1),gam/(gam-1)),Gm=gammaFn(gam),ar=x=>Gm/Math.sqrt(2*gam/(gam-1)*Math.pow(x,2/gam)*(1-Math.pow(x,(gam-1)/gam)));let lo=1e-9,hi=xc;for(let k=0;k<80;k++){const mid=0.5*(lo+hi);ar(mid)>eps?lo=mid:hi=mid;}return 0.5*(lo+hi);};
export const cfOf=(x,eps,gam,Pa,Pc)=>gammaFn(gam)*Math.sqrt(2*gam/(gam-1)*(1-Math.pow(x,(gam-1)/gam)))+(x-Pa/Pc)*eps;
export const momCf=(x,gam)=>gammaFn(gam)*Math.sqrt(2*gam/(gam-1)*(1-Math.pow(x,(gam-1)/gam)));
export function analyzeEngine(d){const{prop,of,Pc,eps,cycle='gasgen'}=d;const c=CYCLES[cycle]||CYCLES.gasgen;const nz=NOZZLES[d.nozzle]||NOZZLES.bell;const cb=combust(prop,of);const pcF=1+0.013*Math.log(Math.max(1,Pc/8e6));const cstarEff=(d.cstarEff||0.975)*(c.cstarLoss||1)*pcF;const cfEff=(d.cfEff||0.985)*(nz.cfEff/0.985);const cs=cstar(cb.Tc,cb.M,cb.gam)*cstarEff;const x=peRatio(eps,cb.gam);const cfRaw=(Pa)=>nz.aero?(Pa/Pc>=x?momCf(Math.min(Pa/Pc,0.999),cb.gam):cfOf(x,eps,cb.gam,Pa,Pc)):cfOf(x,eps,cb.gam,Pa,Pc);const cfVac=cfRaw(0)*cfEff;const cfSL=cfRaw(101325)*cfEff;const ispVac=cs*cfVac/G0;const ispSL=cs*cfSL/G0;const thrustTarget=d.thrustVac||d.thrustSL;const refCf=d.thrustVac?cfVac:cfSL;const At=thrustTarget?thrustTarget/(refCf*Pc):(d.At||0.1);const mdot=Pc*At/cs;const FVac=cfVac*Pc*At;const FSL=Math.max(0,cfSL*Pc*At);const De=2*Math.sqrt(At*eps/Math.PI);const engMass=(FVac/G0/c.tw*c.massK*(1+0.05*Math.log(Pc/3.5e6>1?Pc/3.5e6:1))+0.0009*FVac/G0*Math.sqrt(eps)/c.tw)*nz.massK;return{prop:cb,cstar:cs,eps,Pc,x,cfVac,cfSL,ispVac,ispSL,At,De,mdot,FVac,FSL,engMass,cycle:c.name,nozzle:nz.name,thrustAt:Pa=>Math.max(0,cfRaw(Pa)*cfEff*Pc*At),ispAt:Pa=>cs*cfRaw(Pa)*cfEff/G0};}
export const MATERIALS={
al2219:{name:'Al-2219',rho:2840,sy:2.9e8},
alli:{name:'Al-Li 2195',rho:2700,sy:4.5e8},
steel301:{name:'Stainless 301',rho:7900,sy:8.5e8},
composite:{name:'CFRP',rho:1600,sy:6.0e8},
titanium:{name:'Ti-6Al-4V',rho:4430,sy:8.8e8},
al7075:{name:'Al-7075',rho:2810,sy:5.0e8},
inconel:{name:'Inconel 718',rho:8190,sy:1.03e9}};
export function sizeStage(s){
const e=analyzeEngine(s.engine);const nE=s.nEngines||1;const mat=MATERIALS[s.material]||MATERIALS.alli;const prop=PROPS[s.engine.prop];
const of=prop.solid?prop.of[0]:s.engine.of;const propMass=s.propMass;
const oxMass=propMass*of/(1+of),fuelMass=propMass/(1+of);
const Vox=oxMass/prop.rho_o,Vfuel=fuelMass/prop.rho_f,Vtot=(Vox+Vfuel)*1.03;
const D=s.diameter,r=D/2;const pumpFed=s.engine.cycle!=='pressfed'&&!prop.solid;
const tankP=pumpFed?4.0e5:(prop.solid?2.0e6:e.Pc*1.35);
const sigAllow=mat.sy/1.5;let t=tankP*r/sigAllow;t=Math.max(t,0.0012);
const sphereV=(4/3)*Math.PI*r*r*r;const Lcyl=Math.max(0.2,(Vtot-sphereV)/(Math.PI*r*r));
const wallArea=2*Math.PI*r*Lcyl+4*Math.PI*r*r;
const tankMass=prop.solid?propMass*0.10:mat.rho*t*wallArea*1.18;
const engMass=e.engMass*nE;const thrustFrame=0.011*propMass+0.02*engMass*nE;const avionics=80+18*D;
const dry=engMass+tankMass+thrustFrame+avionics;const wet=dry+propMass;
const length=Lcyl+D*0.85+e.De*1.1;
return{e,nE,of,oxMass,fuelMass,Vtot,wallT:t,tankP,tankMass,engMass,thrustFrame,avionics,dry,wet,propMass,length,diameter:D,material:mat.name,
thrustVac:e.FVac*nE,thrustSL:e.FSL*nE,mdot:e.mdot*nE,ispVac:e.ispVac,ispSL:e.ispSL,
thrustAtP:Pa=>e.thrustAt(Pa)*nE,ispAtP:Pa=>e.ispAt(Pa),Cd:s.Cd||0.42};}
export const NOSECONES={
ogive:{name:'Ogive',cd:0.88,massK:1.0},
cone:{name:'Cone',cd:1.0,massK:0.92},
blunt:{name:'Blunt (reentry)',cd:1.55,massK:1.35},
clamshell:{name:'Clamshell Fairing',cd:0.95,massK:1.5},
haack:{name:'Von Kármán (Haack)',cd:0.82,massK:1.05},
parabolic:{name:'Parabolic',cd:0.86,massK:0.98}};
export const CAPSULES={
none:{name:'None (uncrewed)',mass:0,crew:0},
mini:{name:'Mini Capsule',mass:1200,crew:1},
gemini:{name:'2-Crew Pod',mass:3800,crew:2},
apollo:{name:'Command Module',mass:5800,crew:3},
orion:{name:'Deep-Space Capsule',mass:10400,crew:4},
station:{name:'Station Module',mass:19000,crew:7},
lander:{name:'Lunar Lander',mass:15000,crew:2}};
export function buildVehicle(design,bodyG=G0,bodyP0=101325){
const stages=design.stages.map(sizeStage);const payload=design.payload||0;const fairing=design.fairingMass||0;
const cap=CAPSULES[design.capsule]||CAPSULES.none;const capMass=cap.mass;const rcsMass=design.rcs?(design.rcsMass||0.004*stages.reduce((a,s)=>a+s.wet,0)):0;
const nose=NOSECONES[design.nosecone]||NOSECONES.ogive;const noseCd=nose.cd;const noseMass=fairing*nose.massK;
const topMass=payload+noseMass+capMass+rcsMass;
const bd=design.boosters;let booster=null;
if(bd&&bd.count>0&&bd.propMass>0){const bs=sizeStage({engine:bd.engine,nEngines:1,propMass:bd.propMass,diameter:bd.diameter||1.5,material:bd.material||'alli',Cd:bd.Cd||0.42});booster={count:bd.count,wet:bs.wet*bd.count,dry:bs.dry*bd.count,prop:bs.propMass*bd.count,thrustAtP:Pa=>bs.thrustAtP(Pa)*bd.count,thrustVac:bs.thrustVac*bd.count,mdot:bs.mdot*bd.count,ispVac:bs.ispVac,diameter:bd.diameter||1.5,frontalA:bd.count*Math.PI*((bd.diameter||1.5)/2)**2};}
const boosterWet=booster?booster.wet:0;
const totalWet=stages.reduce((a,s)=>a+s.wet,0)+topMass+boosterWet;
let above=topMass,totalDv=0;const dvs=[];
for(let i=stages.length-1;i>=0;i--){const s=stages[i];const m0=above+s.wet,mf=above+s.dry;const dv=G0*s.ispVac*Math.log(m0/mf);dvs[i]=dv;totalDv+=dv;above+=s.wet;}
const bottom=stages[0];const coreThrust=bottom.thrustAtP?bottom.thrustAtP(bodyP0):bottom.thrustSL;const liftoffThrust=coreThrust+(booster?booster.thrustAtP(bodyP0):0);const liftoffTWR=liftoffThrust/(totalWet*bodyG);
const maxD=Math.max(...stages.map(s=>s.diameter));const frontalA=Math.PI*(maxD/2)**2;
const totalLength=stages.reduce((a,s)=>a+s.length,0)+(maxD*1.4);
return{stages,dvs,totalDv,totalWet,payload,fairing,liftoffTWR,frontalA,maxD,totalLength,topMass,capMass,crew:cap.crew,capName:cap.name,rcsMass,noseCd,noseName:nose.name,noseMass,booster};}
export const BODIES={
earth:{name:'Earth',R:6.371e6,mu:3.986e14,rho0:1.225,H:8500,P0:101325,omega:7.292e-5,atmTop:1.4e5,gSurf:9.807},
moon:{name:'Moon',R:1.7374e6,mu:4.903e12,rho0:0,H:1,P0:0,omega:2.66e-6,atmTop:0,gSurf:1.62},
mars:{name:'Mars',R:3.3895e6,mu:4.283e13,rho0:0.020,H:11100,P0:610,omega:7.088e-5,atmTop:1.0e5,gSurf:3.71},
venus:{name:'Venus',R:6.0518e6,mu:3.2486e14,rho0:65,H:15900,P0:9.2e6,omega:-2.99e-7,atmTop:2.0e5,gSurf:8.87},
titan:{name:'Titan',R:2.5747e6,mu:8.978e12,rho0:5.3,H:20600,P0:146700,omega:4.56e-6,atmTop:6.0e5,gSurf:1.352},
mercury:{name:'Mercury',R:2.4397e6,mu:2.2032e13,rho0:0,H:1,P0:0,omega:1.24e-6,atmTop:0,gSurf:3.70},
europa:{name:'Europa',R:1.5608e6,mu:3.203e12,rho0:0,H:1,P0:0,omega:2.05e-5,atmTop:0,gSurf:1.315},
ceres:{name:'Ceres',R:4.697e5,mu:6.263e10,rho0:0,H:1,P0:0,omega:1.923e-4,atmTop:0,gSurf:0.28}};
export const orbitAltOf=B=>B.atmTop>0?B.atmTop+5.0e4:9.0e4;
export const orbitDvNeed=B=>Math.sqrt(B.mu/(B.R+orbitAltOf(B)))*1.15+440*Math.sqrt(B.P0/101325);
const machT=a=>a<11000?288.15-0.0065*a:a<20000?216.65:a<32000?216.65+0.001*(a-20000):a<47000?228.65+0.0028*(a-32000):270.65;
export function simLaunch(design,bodyKey='earth',opt={}){
const B=BODIES[bodyKey]||BODIES.earth;const v=buildVehicle(design,B.gSurf,B.P0);
const orbitAlt=opt.orbitAlt||orbitAltOf(B);const insThresh=B.atmTop>0?B.atmTop*0.9:2.5e4;const turnExp=opt.turnExp||design.turnExp||0.5;const gLimit=opt.gLimit||design.gLimit||0;
const stages=v.stages.map(s=>({...s,rem:s.propMass}));const payload=v.topMass-v.noseMass,fairing=v.noseMass;
let fairingOn=fairing>0,cur=0,rem=stages[0].propMass,phase='boost';
let bRem=v.booster?v.booster.prop:0,boostAttached=!!v.booster,bsepT=0;
const massNow=()=>{let m=payload+(fairingOn?fairing:0)+(boostAttached?v.booster.dry+bRem:0);for(let i=cur;i<stages.length;i++)m+=stages[i].dry;for(let i=cur+1;i<stages.length;i++)m+=stages[i].propMass;return m+rem;}
const m0=massNow();
if((stages[0].thrustAtP(B.P0)+(v.booster?v.booster.thrustAtP(B.P0):0))<=m0*B.gSurf)return{outcome:'NO_LIFTOFF',vehicle:v,telemetry:[],summary:{liftoffTWR:v.liftoffTWR,totalDvIdeal:v.totalDv,reason:'Liftoff thrust below weight (TWR < 1) — add engines, boosters, or shed mass'}};
const OM=B.omega,vK=55;
const atmAt=alt=>{const a=alt<0?0:alt;return{rho:B.rho0*Math.exp(-a/B.H),P:B.P0*Math.exp(-a/B.H)};};
const vatmOf=(x,y)=>({x:OM*y,y:-OM*x});
const orbitOf=(px,py,pvx,pvy)=>{const r=Math.hypot(px,py),vm=Math.hypot(pvx,pvy);const en=vm*vm/2-B.mu/r;const h=Math.abs(px*pvy-py*pvx);const a=-B.mu/(2*en);const e=Math.sqrt(Math.max(0,1+2*en*h*h/(B.mu*B.mu)));return{en,a,e,apo:en<0?a*(1+e)-B.R:Infinity,peri:a*(1-e)-B.R};};
function guide(px,py,pvx,pvy){const r=Math.hypot(px,py),alt=r-B.R;const up={x:px/r,y:py/r};const va=vatmOf(px,py);const rvx=pvx-va.x,rvy=pvy-va.y;const sp=Math.hypot(rvx,rvy);const vhat=sp>1?{x:rvx/sp,y:rvy/sp}:up;if(sp<vK&&phase==='boost')return up;const d=rvx*up.x+rvy*up.y;let hdx=rvx-d*up.x,hdy=rvy-d*up.y;const hm=Math.hypot(hdx,hdy);const hdir=hm>1?{x:hdx/hm,y:hdy/hm}:{x:up.y,y:-up.x};const orb=orbitOf(px,py,pvx,pvy);let gc;if(phase==='insert'){const vr2=(px*pvx+py*pvy)/r;const apoOver=Math.max(0,(orb.apo-orbitAlt)/orbitAlt);gc=Math.max(-0.18,Math.min(0.5,2.0*(orbitAlt-alt)/orbitAlt-0.004*vr2-1.3*apoOver));}else{const at=atmAt(alt);const q=0.5*at.rho*sp*sp;if(alt<45000&&q>7000)return vhat;const apoErr=Math.max(0,Math.min(1,(orbitAlt-orb.apo)/orbitAlt));gc=Math.min(86*Math.PI/180,(turnExp===0.5?Math.sqrt(apoErr):Math.pow(apoErr,turnExp))*90*Math.PI/180);}let dir={x:up.x*Math.sin(gc)+hdir.x*Math.cos(gc),y:up.y*Math.sin(gc)+hdir.y*Math.cos(gc)};const dm=Math.hypot(dir.x,dir.y);dir.x/=dm;dir.y/=dm;if(phase==='boost'){const dot=Math.max(-1,Math.min(1,dir.x*vhat.x+dir.y*vhat.y));const ang=Math.acos(dot);const maxA=alt<45000?0.18:0.7;if(ang>maxA){const f=maxA/ang,nx=vhat.x+(dir.x-vhat.x)*f,ny=vhat.y+(dir.y-vhat.y)*f,nm=Math.hypot(nx,ny);return{x:nx/nm,y:ny/nm};}}return dir;}
function accel(px,py,pvx,pvy,mass,thrusting){const r=Math.hypot(px,py),alt=r-B.R;const g=B.mu/(r*r);let ax=-B.mu/(r*r*r)*px,ay=-B.mu/(r*r*r)*py;const at=atmAt(alt);const va=vatmOf(px,py);const rvx=pvx-va.x,rvy=pvy-va.y;const sp=Math.hypot(rvx,rvy);const Tk=machT(alt<0?0:alt);const aS=Math.sqrt(1.4*287*Tk);const mach=sp/aS;const Cd0=(stages[Math.min(cur,stages.length-1)]).Cd*(fairingOn?v.noseCd:0.82);const cd=Cd0*(1+0.9*Math.exp(-(((mach-1.05)/0.4)**2)))*(mach>5?0.78:1);const q=0.5*at.rho*sp*sp;const drag=q*cd*(v.frontalA+(boostAttached?v.booster.frontalA:0));if(sp>0.1){ax-=drag/mass*(rvx/sp);ay-=drag/mass*(rvy/sp);}let Tmag=0,thr=1;if(thrusting&&cur<stages.length){const dir=guide(px,py,pvx,pvy);Tmag=stages[cur].thrustAtP(at.P);if(boostAttached&&bRem>0&&phase==='boost')Tmag+=v.booster.thrustAtP(at.P);if(gLimit>0&&Tmag>0){const aT=Tmag/mass/G0;if(aT>gLimit){thr=gLimit/aT;Tmag*=thr;}}ax+=dir.x*Tmag/mass;ay+=dir.y*Tmag/mass;}return{ax,ay,g,q,mach,Tmag,drag,alt,sp,thr};}
let x=0,y=B.R;const v0=vatmOf(0,B.R);let vx=v0.x,vy=v0.y,t=0;
let gLoss=0,dLoss=0,dvUsed=0,maxQ=0,maxQalt=0,maxG=0,outcome=null,meco=0,coastTo=0;
const tel=[];const dt=0.1,tMax=2600;let lastS=-10;
while(t<tMax){
const thrusting=(phase==='boost'||phase==='insert')&&cur<stages.length&&rem>0;const mass=massNow();
const k1=accel(x,y,vx,vy,mass,thrusting);
const k2=accel(x+vx*dt/2,y+vy*dt/2,vx+k1.ax*dt/2,vy+k1.ay*dt/2,mass,thrusting);
const k3=accel(x+(vx+k1.ax*dt/2)*dt/2,y+(vy+k1.ay*dt/2)*dt/2,vx+k2.ax*dt/2,vy+k2.ay*dt/2,mass,thrusting);
const k4=accel(x+(vx+k2.ax*dt/2)*dt,y+(vy+k2.ay*dt/2)*dt,vx+k3.ax*dt,vy+k3.ay*dt,mass,thrusting);
x+=dt/6*(6*vx+dt*(k1.ax+k2.ax+k3.ax))/1;y+=dt/6*(6*vy+dt*(k1.ay+k2.ay+k3.ay));
vx+=dt/6*(k1.ax+2*k2.ax+2*k3.ax+k4.ax);vy+=dt/6*(k1.ay+2*k2.ay+2*k3.ay+k4.ay);t+=dt;
if(thrusting){rem-=stages[cur].mdot*(k1.thr||1)*dt;dvUsed+=k1.Tmag/mass*dt;}
const r=Math.hypot(x,y),alt=r-B.R,vm=Math.hypot(vx,vy);const up={x:x/r,y:y/r};const fpa=Math.asin(Math.max(-1,Math.min(1,(vx*up.x+vy*up.y)/(vm||1))));const vr=(x*vx+y*vy)/r;
gLoss+=k1.g*Math.sin(fpa)*dt;dLoss+=k1.drag/mass*dt;if(k1.q>maxQ&&phase==='boost'){maxQ=k1.q;maxQalt=alt;}const ag=Math.hypot(k1.ax,k1.ay)/G0;if(ag>maxG)maxG=ag;
if(thrusting&&rem<=0){if(cur<stages.length-1){cur++;rem=stages[cur].propMass;}else cur++;}
if(fairingOn&&alt>B.atmTop*0.78)fairingOn=false;
const orb=orbitOf(x,y,vx,vy);
if(boostAttached&&phase==='boost'){bRem-=v.booster.mdot*dt;if(bRem<=0){boostAttached=false;bsepT=t;tel.push({t:+t.toFixed(1),alt:Math.round(alt),vorb:Math.round(vm),apo:Math.round(orb.apo),peri:Math.round(orb.peri),stage:cur+1,phase,event:'BOOSTER SEP'});}}
if(phase==='boost'&&orb.apo>=orbitAlt){phase='insert';meco=t;}
else if(phase==='insert'&&orb.peri>=insThresh)outcome='ORBIT';
if(t-lastS>=2||outcome){lastS=t;tel.push({t:+t.toFixed(1),alt:Math.round(alt),vsurf:Math.round(k1.sp),vorb:Math.round(vm),mass:Math.round(mass),thrust:Math.round(k1.Tmag/1000),g:+ag.toFixed(2),q:Math.round(k1.q),mach:+k1.mach.toFixed(2),fpa:+(fpa*180/Math.PI).toFixed(1),apo:Math.round(orb.apo),peri:Math.round(orb.peri),stage:cur+1,phase,event:outcome});}
if(outcome)break;
if(orb.en>=0){outcome='ESCAPE';break;}
if(alt<0){outcome=vm>3000?'RUD':'SUBORBITAL';break;}
const noFuel=cur>=stages.length;
if(noFuel&&phase==='insert'&&orb.peri<insThresh&&vr<0&&alt<orbitAlt*0.85){outcome='SUBORBITAL';break;}
if(noFuel&&phase==='boost'&&vr<0){outcome='SUBORBITAL';break;}
}
if(!outcome){const o=orbitOf(x,y,vx,vy);outcome=o.en<0&&o.peri>=insThresh?'ORBIT':'SUBORBITAL';}
const fo=orbitOf(x,y,vx,vy);
return{outcome,vehicle:v,telemetry:tel,summary:{body:B.name,liftoffTWR:v.liftoffTWR,totalDvIdeal:v.totalDv,dvUsed,gravityLoss:gLoss,dragLoss:dLoss,maxQ,maxQalt,maxG,flightTime:t,meco,boosterSepT:bsepT,apoAlt:fo.apo,periAlt:fo.peri,ecc:fo.e,orbitAlt,insThresh}};}
export const maxPayloadToOrbit=(design,body='earth',tol=10)=>{const oc=p=>{const d=structuredClone(design);d.payload=p;const o=simLaunch(d,body).outcome;return o==='ORBIT'||o==='ESCAPE';};let hi=Math.max(1000,design.payload||1000),g=0;while(oc(hi)&&hi<1e7&&g++<40)hi*=2;let a=0;if(!oc(a)){let f=-1;for(let i=1;i<=40;i++){const p=hi*i/41;if(oc(p)){f=p;break;}}if(f<0)return 0;a=f;}let b=hi;while(b-a>tol){const m=(a+b)/2;oc(m)?a=m:b=m;}return Math.floor(a);};
