export const G0=9.80665,RU=8314.462,SB=5.670e-8;
export const PROPS={
kerolox:{name:'LOX / RP-1',rho_o:1141,rho_f:810,ofMin:1.8,ofMax:3.4,ofOpt:2.55,of:[1.8,2.27,2.55,2.9,3.4],Tc:[3360,3600,3700,3680,3560],M:[20.6,22.4,23.5,24.6,26.0],g:[1.24,1.215,1.205,1.19,1.17],cpF:2000,tMaxF:450,tInF:290,tInO:90,cryoO:true,cryoF:false,vapO:101325,vapF:2e3,Lstar:1.0,costO:0.2,costF:2.0,ggT:900,ggCp:2200},
hydrolox:{name:'LOX / LH2',rho_o:1141,rho_f:70.8,ofMin:3.5,ofMax:8.0,ofOpt:5.5,of:[3.5,4.5,5.5,6.5,8.0],Tc:[2880,3260,3520,3620,3540],M:[8.7,10.4,12.4,14.2,18.0],g:[1.265,1.24,1.22,1.20,1.165],cpF:14300,tMaxF:600,tInF:20,tInO:90,cryoO:true,cryoF:true,vapO:101325,vapF:101325,Lstar:0.8,costO:0.2,costF:6.0,ggT:1000,ggCp:8000},
methalox:{name:'LOX / CH4',rho_o:1141,rho_f:423,ofMin:2.6,ofMax:4.2,ofOpt:3.55,of:[2.6,3.1,3.55,3.9,4.2],Tc:[3210,3430,3550,3560,3520],M:[17.1,18.9,20.4,21.7,22.8],g:[1.19,1.175,1.165,1.155,1.15],cpF:3500,tMaxF:600,tInF:110,tInO:90,cryoO:true,cryoF:true,vapO:101325,vapF:101325,Lstar:0.9,costO:0.2,costF:1.5,ggT:900,ggCp:3000},
hypergolic:{name:'N2O4 / UDMH',rho_o:1443,rho_f:793,ofMin:1.8,ofMax:3.2,ofOpt:2.6,of:[1.8,2.2,2.6,2.9,3.2],Tc:[3050,3260,3380,3360,3290],M:[21.0,22.6,23.9,24.8,25.6],g:[1.23,1.215,1.205,1.195,1.185],cpF:2700,tMaxF:400,tInF:290,tInO:290,cryoO:false,cryoF:false,vapO:9.6e4,vapF:1.6e4,Lstar:0.75,costO:25,costF:30,ggT:900,ggCp:2300},
ethalox:{name:'LOX / Ethanol',rho_o:1141,rho_f:789,ofMin:1.2,ofMax:2.5,ofOpt:1.8,of:[1.2,1.5,1.8,2.1,2.5],Tc:[2950,3200,3320,3330,3260],M:[20.0,21.6,23.0,24.1,25.5],g:[1.22,1.21,1.20,1.19,1.18],cpF:2400,tMaxF:420,tInF:290,tInO:90,cryoO:true,cryoF:false,vapO:101325,vapF:6e3,Lstar:1.1,costO:0.2,costF:1.0,ggT:850,ggCp:2200},
h2o2ker:{name:'H2O2 (90%) / Kerosene',rho_o:1390,rho_f:810,ofMin:6.0,ofMax:9.0,ofOpt:7.3,of:[6.0,6.8,7.5,8.2,9.0],Tc:[2740,2830,2870,2860,2810],M:[21.4,22.0,22.6,23.1,23.6],g:[1.215,1.21,1.205,1.20,1.195],cpF:2000,tMaxF:450,tInF:290,tInO:290,cryoO:false,cryoF:false,vapO:5e2,vapF:2e3,Lstar:1.3,costO:5,costF:2.0,ggT:1000,ggCp:2600},
hybrid:{name:'N2O / HTPB (hybrid)',rho_o:786,rho_f:920,ofMin:4.5,ofMax:8.5,ofOpt:6.5,of:[4.5,5.5,6.5,7.5,8.5],Tc:[2950,3120,3200,3180,3120],M:[24.4,25.6,26.6,27.3,27.9],g:[1.22,1.21,1.20,1.19,1.185],cpF:0,tMaxF:0,tInF:290,tInO:290,cryoO:false,cryoF:false,vapO:5.0e6,vapF:0,Lstar:1.5,costO:3,costF:4,ggT:900,ggCp:2200,solidFuel:true},
solid:{name:'APCP (solid)',rho_o:1750,rho_f:1750,ofMin:7.0,ofMax:7.0,ofOpt:7.0,of:[7.0],Tc:[3210],M:[27.5],g:[1.18],cpF:0,tMaxF:0,tInF:290,tInO:290,cryoO:false,cryoF:false,vapO:0,vapF:0,Lstar:0,costO:8,costF:8,solid:true}};
export const CYCLES={
pressfed:{name:'Pressure-Fed',pcMax:3.5e6,tw:25,massK:1.0,feedK:1,rel:0.995,costK:0.7},
gasgen:{name:'Gas-Generator',pcMax:1.4e7,tw:85,massK:1.0,feedK:1,ggPR:20,rel:0.985,costK:1.0},
tapoff:{name:'Tap-Off',pcMax:1.2e7,tw:90,massK:0.98,feedK:1,ggPR:15,tapoff:true,rel:0.985,costK:1.05},
expander:{name:'Expander',pcMax:7e6,tw:55,massK:1.05,feedK:1.3,expander:true,rel:0.99,costK:1.3},
staged:{name:'Staged-Combustion',pcMax:3.2e7,tw:110,massK:1.15,feedK:1.7,pbFrac:0.75,pbTmax:900,rel:0.98,costK:1.6},
ffsc:{name:'Full-Flow Staged',pcMax:3.5e7,tw:120,massK:1.22,feedK:1.55,pbFrac:1.0,pbTmax:850,rel:0.975,costK:1.9},
epump:{name:'Electric Pump',pcMax:1.0e7,tw:45,massK:1.1,feedK:1,epump:true,rel:0.99,costK:0.9},
solid:{name:'Solid Motor',pcMax:1.0e7,tw:35,massK:0.7,feedK:0,rel:0.993,costK:0.5}};
export const NOZZLES={
bell:{name:'Bell (de Laval)',cfEff:0.985,massK:1.0,lenK:0.8},
conical:{name:'Conical (15°)',cfEff:0.970,massK:0.88,lenK:1.0},
aerospike:{name:'Aerospike (alt-comp)',cfEff:0.972,massK:1.25,aero:true,lenK:0.3},
dualbell:{name:'Dual-Bell',cfEff:0.978,massK:1.12,aero:true,lenK:1.05}};
export const INJECTORS={
doublet:{name:'Impinging doublet',cs:0.955,dp:0.20,stab:0.9},
triplet:{name:'Impinging triplet',cs:0.965,dp:0.22,stab:1.0},
pintle:{name:'Pintle',cs:0.960,dp:0.15,stab:1.3},
coax:{name:'Coaxial shear',cs:0.975,dp:0.18,stab:1.0},
swirl:{name:'Coaxial swirl',cs:0.980,dp:0.16,stab:1.05},
shower:{name:'Showerhead',cs:0.930,dp:0.10,stab:0.7}};
export const COOLING={
regen:{name:'Regenerative',tw:750,dpK:0.25,qK:1,ispK:1},
regenfilm:{name:'Regen + film',tw:750,dpK:0.22,qK:0.7,ispK:0.975,film:0.05},
ablative:{name:'Ablative liner',tw:2200,dpK:0,qK:1,ispK:1,abl:true},
radiative:{name:'Radiative (C-103)',tw:1650,dpK:0,qK:1,ispK:1,rad:true}};
export const GRAINS={
bates:{name:'BATES (neutral)',k0:1,k1:1},
star:{name:'Star (neutral)',k0:1.05,k1:0.95},
progressive:{name:'Progressive',k0:0.75,k1:1.25},
regressive:{name:'Regressive',k0:1.25,k1:0.75},
finocyl:{name:'Finocyl (boost-sustain)',k0:1.35,k1:0.65}};
export const SOLID_A=2.78e-5,SOLID_N=0.35;
export const solidPc=(Kn,cs,rho=1750)=>Math.pow(Kn*SOLID_A*rho*cs,1/(1-SOLID_N));
export const solidKn=(Pc,cs,rho=1750)=>Math.pow(Pc,1-SOLID_N)/(SOLID_A*rho*cs);
export const STIFFENING={mono:{name:'Monocoque',kb:1,mk:1},stringer:{name:'Skin-stringer',kb:1.9,mk:1.12},isogrid:{name:'Isogrid',kb:2.7,mk:1.2}};
export const DOMES={ell:{name:'2:1 ellipsoidal',h:0.5,aK:1.38,tK:1.0},hemi:{name:'Hemispherical',h:1,aK:2,tK:0.5},tori:{name:'Torispherical',h:0.35,aK:1.25,tK:1.3}};
const interp=(xs,ys,x)=>{if(x<=xs[0])return ys[0];if(x>=xs[xs.length-1])return ys[ys.length-1];let i=1;while(x>xs[i])i++;const t=(x-xs[i-1])/(xs[i]-xs[i-1]);return ys[i-1]+t*(ys[i]-ys[i-1]);};
export const combust=(prop,of)=>{const p=PROPS[prop];const o=p.solid?p.of[0]:Math.max(p.ofMin,Math.min(p.ofMax,of));return{Tc:interp(p.of,p.Tc,o),M:interp(p.of,p.M,o),gam:interp(p.of,p.g,o)};};
export const gammaFn=g=>Math.sqrt(g)*Math.pow(2/(g+1),(g+1)/(2*(g-1)));
export const cstar=(Tc,M,gam)=>Math.sqrt(RU*Tc/M)/gammaFn(gam);
export const arOf=(x,gam)=>gammaFn(gam)/Math.sqrt(2*gam/(gam-1)*Math.pow(x,2/gam)*(1-Math.pow(x,(gam-1)/gam)));
export const peRatio=(eps,gam)=>{const xc=Math.pow(2/(gam+1),gam/(gam-1));let lo=1e-9,hi=xc;for(let k=0;k<80;k++){const mid=0.5*(lo+hi);arOf(mid,gam)>eps?lo=mid:hi=mid;}return 0.5*(lo+hi);};
export const cfOf=(x,eps,gam,Pa,Pc)=>gammaFn(gam)*Math.sqrt(2*gam/(gam-1)*(1-Math.pow(x,(gam-1)/gam)))+(x-Pa/Pc)*eps;
export const momCf=(x,gam)=>gammaFn(gam)*Math.sqrt(2*gam/(gam-1)*(1-Math.pow(x,(gam-1)/gam)));
export const SEP_K=0.4,SKIRT_AR=25;
export function bartz(Dt,Pc,cs,cb,Tw){const mu=1.184e-7*Math.sqrt(cb.M)*Math.pow(cb.Tc,0.6),cp=cb.gam/(cb.gam-1)*RU/cb.M,Pr=4*cb.gam/(9*cb.gam-5);const hg=0.026/Math.pow(Dt,0.2)*Math.pow(mu,0.2)*cp/Math.pow(Pr,0.6)*Math.pow(Pc/cs,0.8)*1.03;const Taw=cb.Tc*(1+0.9*(cb.gam-1)/2)/(1+(cb.gam-1)/2);return{hg,Taw,q:hg*Math.max(0,Taw-Tw),mu,cp,Pr};}
export function analyzeEngine(d){const{prop,of,Pc,eps,cycle='gasgen'}=d;const c=CYCLES[cycle]||CYCLES.gasgen;const nz=NOZZLES[d.nozzle]||NOZZLES.bell;const P=PROPS[prop];const cb=combust(prop,of);const inj=P.solid?{name:'Grain (n/a)',cs:0.955,dp:0,stab:1}:(INJECTORS[d.injector]||INJECTORS.doublet);const cool=P.solid||P.solidFuel?(COOLING[d.cooling]&&COOLING[d.cooling].abl?COOLING.ablative:COOLING.ablative):(COOLING[d.cooling]||COOLING.regen);const pcF=1+0.013*Math.log(Math.max(1,Pc/8e6));const cstarEff=inj.cs*pcF;const cfEff=(d.cfEff||0.985)*(nz.cfEff/0.985)*cool.ispK;const cs=cstar(cb.Tc,cb.M,cb.gam)*cstarEff;const x=peRatio(eps,cb.gam);const xc=Math.pow(2/(cb.gam+1),cb.gam/(cb.gam-1));const cfRaw=Pa=>{if(nz.aero)return Pa/Pc>=x?momCf(Math.min(Pa/Pc,0.999),cb.gam):cfOf(x,eps,cb.gam,Pa,Pc);if(Pa>0&&x*Pc<SEP_K*Pa){const xs=Math.min(xc*0.999,SEP_K*Pa/Pc);return cfOf(xs,arOf(xs,cb.gam),cb.gam,Pa,Pc);}return cfOf(x,eps,cb.gam,Pa,Pc);};const cfVac=cfRaw(0)*cfEff;const cfSL=cfRaw(101325)*cfEff;const thrustTarget=d.thrustVac||d.thrustSL;const refCf=d.thrustVac?cfVac:cfSL;const At=thrustTarget?thrustTarget/(refCf*Pc):(d.At||0.1);const mdotC=Pc*At/cs;const Dt=2*Math.sqrt(At/Math.PI);const De=2*Math.sqrt(At*eps/Math.PI);const cr=d.cr||(At>0.05?2.2:3.2);const Dc=Dt*Math.sqrt(cr);const Lstar=d.Lstar||P.Lstar||1;const Vc=Lstar*At;const Lconv=(Dc-Dt)/2/Math.tan(30*Math.PI/180);const Lc=Math.max(0.05,(Vc-Math.PI/12*Lconv*(Dc*Dc+Dc*Dt+Dt*Dt))/(Math.PI*Dc*Dc/4));const Ln=nz.lenK*(De-Dt)/2/Math.tan(15*Math.PI/180);const Le=Lc+Lconv+Ln;const aC=Math.sqrt(cb.gam*RU/cb.M*cb.Tc);const f1T=1.8412*aC/(Math.PI*Dc);const dpInj=inj.dp*Pc;const chugOk=P.solid||dpInj/Pc>=0.15;const stabRisk=!P.solid&&Dc>0.8&&inj.stab<1;const ofv=P.solid?P.of[0]:Math.max(P.ofMin,Math.min(P.ofMax,of));const mdotF=mdotC/(1+ofv),mdotO=mdotC*ofv/(1+ofv);const bz=bartz(Dt,Pc,cs,cb,cool.tw);const qT=bz.q*cool.qK;const strips=[];const seg=(D0,D1,L,A0,A1)=>{for(let i=0;i<12;i++){const f=(i+0.5)/12;const D=D0+(D1-D0)*f,A=A0+(A1-A0)*f;strips.push({D,dL:L/12,ar:A/At,q:qT*Math.pow(At/Math.max(At,A),0.9)});}};const Ac=Math.PI*Dc*Dc/4,Ae=Math.PI*De*De/4;seg(Dc,Dc,Lc,Ac,Ac);seg(Dc,Dt,Lconv,Ac,At);seg(Dt,De,Ln,At,Ae);const Q=strips.reduce((a,s)=>a+s.q*Math.PI*s.D*s.dL,0);const skirt=cool.dpK>0&&!cool.film&&!c.expander?strips.filter(s=>s.ar>SKIRT_AR):[];const Qskirt=skirt.reduce((a,s)=>a+s.q*Math.PI*s.D*s.dL,0),Askirt=skirt.reduce((a,s)=>a+Math.PI*s.D*s.dL,0),Qcool=Q-Qskirt;const Awall=strips.reduce((a,s)=>a+Math.PI*s.D*s.dL,0);const coolCap=cool.dpK>0&&P.cpF>0?mdotF*(1-(cool.film||0))*P.cpF*(P.tMaxF-P.tInF):0;const coolDT=cool.dpK>0&&P.cpF>0?Qcool/(mdotF*(1-(cool.film||0))*P.cpF):0;const coolOk=cool.dpK>0?Qcool<=coolCap:cool.rad?qT<3e6:true;const radT=Math.pow(qT/(0.85*SB),0.25);const pumpFed=!P.solid&&cycle!=='pressfed';const feedK=c.feedK||1;const PdF=Pc*(1+inj.dp+cool.dpK+0.05)*feedK;const PdO=Pc*(1+inj.dp+0.05)*(c.expander?1:feedK);const etaP=thrustTarget>1e5?0.72:0.6;const PpF=pumpFed?mdotF*PdF/(Math.max(50,P.rho_f)*etaP):0;const PpO=pumpFed?mdotO*PdO/(P.rho_o*etaP):0;const Pt=(PpF+PpO)/0.98;let mdotGG=0,FGG=0,pbT=0,pbOk=true,expOk=true,expAvail=0,motorMass=0;if(pumpFed&&c.ggPR){const w=0.6*P.ggCp*P.ggT*(1-Math.pow(c.ggPR,-0.23));mdotGG=Pt/w;FGG=mdotGG*150*G0;}if(pumpFed&&c.pbFrac){const mpb=mdotC*c.pbFrac;pbT=(P.cryoF?P.tInF+150:P.tInF)+Pt/(mpb*(P.cryoF&&P.rho_f<100?6000:2000)*0.75*0.126);pbOk=pbT<=c.pbTmax;}if(pumpFed&&c.expander){expAvail=mdotF*Math.max(1000,P.cpF)*(P.tInF+coolDT)*0.75*0.161;expOk=expAvail>=Pt&&cool.dpK>0;}if(pumpFed&&c.epump){motorMass=Pt/5000;}const tpMass=pumpFed&&!c.epump?0.8*Math.pow(Pt/1000,0.6):0;const mdot=mdotC+mdotGG;const FVac=cfVac*Pc*At+FGG;const FSL=Math.max(0,cfSL*Pc*At+FGG);const ispVac=FVac/(mdot*G0);const ispSL=FSL/(mdot*G0);const abl=cool.abl&&!P.solid;const ablRate=abl?2e-6*Math.pow(qT/1e7,0.8):0;const engMass=(FVac/G0/c.tw*c.massK*(1+0.05*Math.log(Pc/3.5e6>1?Pc/3.5e6:1))+0.0009*FVac/G0*Math.sqrt(eps)/c.tw)*nz.massK+motorMass;return{prop:cb,propKey:prop,P,cstar:cs,eps,Pc,x,Pe:x*Pc,cfVac,cfSL,ispVac,ispSL,At,Dt,De,Dc,cr,Lstar,Vc,Lc,Lconv,Ln,Le,Awall,mdot,mdotC,mdotF,mdotO,FVac,FSL,engMass,cycle:c.name,cycleKey:cycle,cyc:c,nozzle:nz.name,inj,cool,dpInj,chugOk,f1T,stabRisk,qT,Taw:bz.Taw,hg:bz.hg,Q,Qcool,Qskirt,Askirt,coolCap,coolDT,coolOk,radT,PdF,PdO,PpF,PpO,Pt,mdotGG,ggFrac:mdotGG/mdotC,FGG,pbT,pbOk,expOk,expAvail,tpMass,motorMass,ablRate,sepAt:Pa=>!nz.aero&&x*Pc<SEP_K*Pa,sepMarginalAt:Pa=>!nz.aero&&x*Pc<0.667*Pa,pumpFed,thrustAt:Pa=>Math.max(0,cfRaw(Pa)*cfEff*Pc*At+FGG),ispAt:Pa=>Math.max(0,cfRaw(Pa)*cfEff*Pc*At+FGG)/(mdot*G0)};}
export const MATERIALS={
al2219:{name:'Al-2219',rho:2840,sy:2.9e8,E:7.3e10,tMax:420,cost:12},
alli:{name:'Al-Li 2195',rho:2700,sy:4.5e8,E:7.8e10,tMax:420,cost:30},
steel301:{name:'Stainless 301',rho:7900,sy:8.5e8,E:1.93e11,tMax:800,cost:6},
composite:{name:'CFRP',rho:1600,sy:6.0e8,E:7.0e10,tMax:450,cost:90},
titanium:{name:'Ti-6Al-4V',rho:4430,sy:8.8e8,E:1.14e11,tMax:700,cost:60},
al7075:{name:'Al-7075',rho:2810,sy:5.0e8,E:7.2e10,tMax:400,cost:10},
inconel:{name:'Inconel 718',rho:8190,sy:1.03e9,E:2.0e11,tMax:950,cost:70}};
export const knockdown=(r,t)=>1-0.901*(1-Math.exp(-Math.sqrt(r/t)/16));
export function sizeStage(s,ctx={}){
const e=analyzeEngine(s.engine);const nE=s.nEngines||1;const mat=MATERIALS[s.material]||MATERIALS.alli;const prop=PROPS[s.engine.prop];const st=STIFFENING[s.stiffening]||STIFFENING.mono;const dm=DOMES[s.domes]||DOMES.ell;const sf=s.sf||1.25;const resid=s.residual!=null?s.residual:0.015;
const of=prop.solid?prop.of[0]:Math.max(prop.ofMin,Math.min(prop.ofMax,s.engine.of));const propMass=s.propMass;const usable=propMass*(1-resid);
const oxMass=propMass*of/(1+of),fuelMass=propMass/(1+of);
const Vox=oxMass/prop.rho_o*1.03,Vfuel=fuelMass/prop.rho_f*1.03,Vtot=Vox+Vfuel;
const D=s.diameter,r=D/2;const pumpFed=e.pumpFed;const solidCase=prop.solid;
const npshP=pumpFed?Math.max(prop.vapO+0.025*e.PdO,prop.vapF+0.025*e.PdF)+0.5e5:0;
const tankP=solidCase?e.Pc*1.25:prop.solidFuel?Math.max(prop.vapO,e.Pc*1.35):pumpFed?Math.max(3.0e5,npshP):e.Pc*(1+e.inj.dp+e.cool.dpK+0.05)*1.05;
const sigAllow=mat.sy/sf;const tHoop=tankP*r/sigAllow;const tMin=mat===MATERIALS.composite?0.0015:0.0012;
const domeH=dm.h*r,domeV=(2/3)*Math.PI*r*r*domeH,domeA=dm.aK*Math.PI*r*r;
const cylV=Math.max(0,Vtot-2*domeV*(s.commonBulkhead?1:2)/2);const Lcyl=Math.max(0.2,cylV/(Math.PI*r*r));
const nDomes=solidCase?2:s.commonBulkhead?3:4;
const burnT=usable/(e.mdot*nE);
const above=ctx.above||0;const nMax=ctx.nMax||Math.max(1.5,Math.min(6,e.FVac*nE/((above+propMass*0.15)*G0)));const qMax=ctx.qMax!=null?ctx.qMax:(ctx.P0>0?3.5e4*Math.sqrt(ctx.P0/101325):0);
const A=Math.PI*r*r;const Nax=(above+propMass*0.5)*G0*nMax+qMax*0.4*A;const Mb=qMax*A*2.0*(3*Math.PI/180)*Math.max(1,ctx.Lab||5)*0.5;
const stress=t=>{const sa=Nax/(2*Math.PI*r*t),sb=Mb/(Math.PI*r*r*t),sp=tankP*r/(2*t);return{sa,sb,sc:Math.max(0,sa+sb-sp),sh:tankP*r/t};};
const sCr=t=>0.6*mat.E*t/r*knockdown(r,t)*st.kb;
let t=Math.max(tHoop,tMin),gov=tHoop>=tMin?'pressure':'min gauge';for(let k=0;k<60;k++){const ss=stress(t);if(ss.sc*sf>sCr(t)){t*=1.03;gov='buckling';}else if(Math.max(ss.sh,ss.sa+ss.sb)*sf>mat.sy){t*=1.03;gov='axial';}else break;}
const ss=stress(t);const mosY=mat.sy/(sf*Math.max(ss.sh,ss.sa+ss.sb,1))-1;const mosB=sCr(t)/(sf*Math.max(ss.sc,1))-1;
const tDome=dm.tK*Math.max(tHoop,tMin);
const cylMass=mat.rho*t*2*Math.PI*r*Lcyl*st.mk*1.08;const domeMass=mat.rho*tDome*domeA*nDomes*1.1;
const insulK=(prop.cryoO?1.0:0)+(prop.cryoF?(prop.rho_f<100?2.5:1.2):0);const insul=insulK*(2*Math.PI*r*Lcyl+domeA*2)*(s.commonBulkhead&&(prop.cryoO||prop.cryoF)?1.25:1);
const intertank=solidCase||s.commonBulkhead?0:8*Math.PI*D*(2*domeH+0.3);
const caseIns=solidCase?propMass*0.04:0;
const tankMass=solidCase?cylMass+domeMass+caseIns:cylMass+domeMass+insul+intertank;
const heT=(prop.cryoO||prop.cryoF)?200:280;const pressGas=solidCase||prop.solidFuel?0:tankP*Vtot*1.3/(2077*heT)/(1-tankP/3.5e7);const pressMass=pressGas*4;
const battery=e.cyc.epump?e.Pt*nE*burnT/(0.92*260*3600):0;
const ablMass=e.ablRate>0?1400*e.Awall*(e.ablRate*burnT+0.004)*nE:0;
const engMass=(e.engMass+ablMass/nE)*nE;const tvc=0.03*engMass;const thrustFrame=0.011*propMass+0.02*engMass;const avionics=80+18*D;
const interstage=ctx.isUpper?9*Math.PI*D*(e.Le+0.4):0;
const residMass=propMass*resid;
const budget={engines:engMass-ablMass-Math.min(e.tpMass*nE,0.4*engMass),ablative:ablMass,tvc,turbopumps:Math.min(e.tpMass*nE,0.4*engMass),tankShell:cylMass,domes:domeMass,insulation:insul,intertank,interstage,thrustFrame,pressurant:pressMass,battery,avionics,residual:residMass};
const dry=engMass+tvc+tankMass+thrustFrame+avionics+pressMass+battery+interstage+residMass;const wet=dry+usable;
const length=Lcyl+2*domeH+(solidCase?0:s.commonBulkhead?0:0.3)+e.Le+(ctx.isUpper?0.4:0);
return{e,nE,of,oxMass,fuelMass,Vox,Vfuel,Vtot,wallT:t,tDome,tankP,npshP,gov,stress:ss,sigCr:sCr(t),mosY,mosB,Nax,Mb,nMax,qMax,tankMass,engMass,thrustFrame,avionics,pressMass,pressGas,battery,ablMass,tvc,interstage,insul,intertank,residMass,budget,dry,wet,propMass,usable,burnT,length,Lcyl,domeH,diameter:D,material:mat.name,mat,sf,stiff:st.name,dome:dm.name,commonBulkhead:!!s.commonBulkhead,
thrustVac:e.FVac*nE,thrustSL:e.FSL*nE,mdot:e.mdot*nE,ispVac:e.ispVac,ispSL:e.ispSL,
thrustAtP:Pa=>e.thrustAt(Pa)*nE,ispAtP:Pa=>e.ispAt(Pa),Cd:s.Cd||0.42,grain:GRAINS[s.grain]||GRAINS.bates,solid:solidCase,
rel:Math.pow(e.cyc.rel,nE),cost:{engines:2500*Math.pow(e.FVac/1000,0.55)*e.cyc.costK*nE,structure:25*Math.pow(Math.max(1,dry-engMass),0.8)*(mat.cost/12),propellant:oxMass*prop.costO+fuelMass*prop.costF}};}
export const NOSECONES={
ogive:{name:'Ogive',cd:0.88,massK:1.0,rn:0.35},
cone:{name:'Cone',cd:1.0,massK:0.92,rn:0.15},
blunt:{name:'Blunt (reentry)',cd:1.55,massK:1.35,rn:1.0,tMax:2500},
clamshell:{name:'Clamshell Fairing',cd:0.95,massK:1.5,rn:0.4},
haack:{name:'Von Kármán (Haack)',cd:0.82,massK:1.05,rn:0.3},
parabolic:{name:'Parabolic',cd:0.86,massK:0.98,rn:0.4}};
export const CAPSULES={
none:{name:'None (uncrewed)',mass:0,crew:0},
mini:{name:'Mini Capsule',mass:1200,crew:1},
gemini:{name:'2-Crew Pod',mass:3800,crew:2},
apollo:{name:'Command Module',mass:5800,crew:3},
orion:{name:'Deep-Space Capsule',mass:10400,crew:4},
station:{name:'Station Module',mass:19000,crew:7},
lander:{name:'Lunar Lander',mass:15000,crew:2}};
export function buildVehicle(design,bodyG=G0,bodyP0=101325,loads={}){
const payload=design.payload||0;const fairing=design.fairingMass||0;
const cap=CAPSULES[design.capsule]||CAPSULES.none;const capMass=cap.mass;
const nose=NOSECONES[design.nosecone]||NOSECONES.ogive;const noseCd=nose.cd;const maxD0=Math.max(...design.stages.map(s=>s.diameter));const tpsMass=design.noseTps?5*Math.PI*maxD0*maxD0/2:0;const noseMass=fairing*nose.massK+tpsMass;
const n=design.stages.length;let stages=design.stages.map((s,i)=>sizeStage(s,{isUpper:i>0,P0:bodyP0}));
const rcsMass=design.rcs?(design.rcsMass||0.004*stages.reduce((a,s)=>a+s.wet,0)):0;
const topMass=payload+noseMass+capMass+rcsMass;
for(let pass=0;pass<2;pass++){let above=topMass,Lab=0;const out=[];for(let i=n-1;i>=0;i--){const s=stages[i];const nMax=loads.maxG||Math.min(design.gLimit||9,s.thrustVac/((above+s.dry)*G0));out[i]=sizeStage(design.stages[i],{isUpper:i>0,P0:bodyP0,above,nMax:Math.max(1.2,nMax),qMax:loads.maxQ,Lab:Lab+s.length*0.5});above+=out[i].wet;Lab+=out[i].length;}stages=out;}
const bd=design.boosters;let booster=null;
if(bd&&bd.count>0&&bd.propMass>0){const bs=sizeStage({engine:bd.engine,nEngines:1,propMass:bd.propMass,diameter:bd.diameter||1.5,material:bd.material||'alli',Cd:bd.Cd||0.42,grain:bd.grain},{P0:bodyP0,above:0});booster={count:bd.count,wet:bs.wet*bd.count,dry:bs.dry*bd.count,prop:bs.usable*bd.count,thrustAtP:Pa=>bs.thrustAtP(Pa)*bd.count,thrustVac:bs.thrustVac*bd.count,mdot:bs.mdot*bd.count,ispVac:bs.ispVac,diameter:bd.diameter||1.5,frontalA:bd.count*Math.PI*((bd.diameter||1.5)/2)**2,grain:bs.grain,solid:bs.solid,rel:bs.rel,cost:bs.cost,stage:bs};}
const boosterWet=booster?booster.wet:0;
const totalWet=stages.reduce((a,s)=>a+s.wet,0)+topMass+boosterWet;
let above=topMass,totalDv=0;const dvs=[];
for(let i=n-1;i>=0;i--){const s=stages[i];const m0=above+s.wet,mf=above+s.dry;const dv=G0*s.ispVac*Math.log(m0/mf);dvs[i]=dv;totalDv+=dv;above+=s.wet;}
const bottom=stages[0];const coreThrust=bottom.thrustAtP?bottom.thrustAtP(bodyP0):bottom.thrustSL;const liftoffThrust=coreThrust+(booster?booster.thrustAtP(bodyP0):0);const liftoffTWR=liftoffThrust/(totalWet*bodyG);
const maxD=Math.max(...stages.map(s=>s.diameter));const frontalA=Math.PI*(maxD/2)**2;
const totalLength=stages.reduce((a,s)=>a+s.length,0)+(maxD*1.4);
const engOut=stages.map((s,i)=>{if(s.nE<2)return false;const mAbove=stages.slice(i+1).reduce((a,x)=>a+x.wet,topMass);const m0=mAbove+s.wet+(i===0&&booster?booster.wet:0);const thr=(i===0?s.thrustAtP(bodyP0)+(booster?booster.thrustAtP(bodyP0):0):s.thrustVac)*(s.nE-1)/s.nE;return thr/(m0*(i===0?bodyG:G0))>=(i===0?1.05:0.4);});
const relStages=stages.map((s,i)=>{const R=s.e.cyc.rel,k=s.nE;return (engOut[i]?Math.pow(R,k)+k*Math.pow(R,k-1)*(1-R):Math.pow(R,k))*0.995;});
const reliability=relStages.reduce((a,x)=>a*x,1)*(booster?Math.pow(booster.rel,booster.count)*0.997:1)*(fairing>0?0.998:1);
const cost={engines:stages.reduce((a,s)=>a+s.cost.engines,0)+(booster?booster.cost.engines*booster.count:0),structure:stages.reduce((a,s)=>a+s.cost.structure,0)+(booster?booster.cost.structure*booster.count:0),propellant:stages.reduce((a,s)=>a+s.cost.propellant,0)+(booster?booster.cost.propellant*booster.count:0)};cost.total=cost.engines+cost.structure+cost.propellant;
return{stages,dvs,totalDv,totalWet,payload,fairing,liftoffTWR,frontalA,maxD,totalLength,topMass,capMass,crew:cap.crew,capName:cap.name,rcsMass,noseCd,noseName:nose.name,noseMass,tpsMass,nose,booster,engOut,relStages,reliability,cost};}
export const BODIES={
earth:{name:'Earth',R:6.371e6,mu:3.986e14,rho0:1.225,H:8500,P0:101325,omega:7.292e-5,atmTop:1.4e5,gSurf:9.807,us76:true,gasG:1.4,gasR:287,T0:288},
moon:{name:'Moon',R:1.7374e6,mu:4.903e12,rho0:0,H:1,P0:0,omega:2.66e-6,atmTop:0,gSurf:1.62,gasG:1.4,gasR:287,T0:250},
mars:{name:'Mars',R:3.3895e6,mu:4.283e13,rho0:0.020,H:11100,P0:610,omega:7.088e-5,atmTop:1.0e5,gSurf:3.71,gasG:1.3,gasR:189,T0:210},
venus:{name:'Venus',R:6.0518e6,mu:3.2486e14,rho0:65,H:15900,P0:9.2e6,omega:-2.99e-7,atmTop:2.0e5,gSurf:8.87,gasG:1.3,gasR:189,T0:737},
titan:{name:'Titan',R:2.5747e6,mu:8.978e12,rho0:5.3,H:20600,P0:146700,omega:4.56e-6,atmTop:6.0e5,gSurf:1.352,gasG:1.4,gasR:297,T0:94},
mercury:{name:'Mercury',R:2.4397e6,mu:2.2032e13,rho0:0,H:1,P0:0,omega:1.24e-6,atmTop:0,gSurf:3.70,gasG:1.4,gasR:287,T0:440},
europa:{name:'Europa',R:1.5608e6,mu:3.203e12,rho0:0,H:1,P0:0,omega:2.05e-5,atmTop:0,gSurf:1.315,gasG:1.4,gasR:287,T0:100},
ceres:{name:'Ceres',R:4.697e5,mu:6.263e10,rho0:0,H:1,P0:0,omega:1.923e-4,atmTop:0,gSurf:0.28,gasG:1.4,gasR:287,T0:170}};
const US76=[[0,288.15,-0.0065,101325],[11000,216.65,0,22632.1],[20000,216.65,0.001,5474.89],[32000,228.65,0.0028,868.02],[47000,270.65,0,110.91],[51000,270.65,-0.0028,66.94],[71000,214.65,-0.002,3.956],[86000,186.95,0,0.3734]];
export function us76(alt){const a=Math.max(0,alt);if(a>=86000){const P=0.3734*Math.exp(-(a-86000)/6000);return{T:186.95+Math.min(800,(a-86000)*0.012),P,rho:P/(287*(186.95+Math.min(800,(a-86000)*0.012)))};}let i=US76.length-1;while(a<US76[i][0])i--;const[b,Tb,L,Pb]=US76[i];const T=Tb+L*(a-b);const P=L===0?Pb*Math.exp(-G0*(a-b)/(287*Tb)):Pb*Math.pow(Tb/T,G0/(287*L));return{T,P,rho:P/(287*T)};}
export const atmOf=(B,alt)=>{if(B.us76)return us76(alt);const a=alt<0?0:alt;const T=B.T0*(a<0.6*B.H?1-0.35*a/(0.6*B.H):0.65);return{rho:B.rho0*Math.exp(-a/B.H),P:B.P0*Math.exp(-a/B.H),T};};
export const orbitAltOf=B=>B.atmTop>0?B.atmTop+5.0e4:9.0e4;
export const orbitDvNeed=B=>Math.sqrt(B.mu/(B.R+orbitAltOf(B)))*1.15+440*Math.sqrt(B.P0/101325);
export function launchAzimuth(latDeg,inclDeg){const lat=latDeg*Math.PI/180,inc=inclDeg*Math.PI/180;const c=Math.cos(inc)/Math.max(1e-9,Math.cos(lat));const ok=Math.abs(c)<=1&&inclDeg>=Math.abs(latDeg)-1e-9;const az=ok?Math.asin(Math.max(-1,Math.min(1,c))):Math.PI/2;return{az,azDeg:(az*180/Math.PI+360)%360,ok,planeChange:ok?0:Math.abs(latDeg)-inclDeg};}
export const HEAT_FM=1135;
export function simLaunch(design,bodyKey='earth',opt={}){
const B=BODIES[bodyKey]||BODIES.earth;let v=buildVehicle(design,B.gSurf,B.P0,opt.loads||{});
const orbitAlt=opt.orbitAlt||(design.orbitAltKm?design.orbitAltKm*1000:0)||orbitAltOf(B);const insThresh=B.atmTop>0?B.atmTop*0.9:2.5e4;const turnExp=opt.turnExp||design.turnExp||0.5;const gLimit=opt.gLimit||design.gLimit||0;const qLimit=(design.qLimitKPa||0)*1000;
const lat=design.siteLat!=null?design.siteLat:0;const incl=design.incl!=null?design.incl:Math.abs(lat);const azm=launchAzimuth(lat,incl);
const stages=v.stages.map(s=>({...s,rem:s.usable}));const payload=v.topMass-v.noseMass,fairing=v.noseMass;
let fairingOn=fairing>0,cur=0,rem=stages[0].usable,phase='boost',fairingSepAlt=0,fairingSepT=0;
let bRem=v.booster?v.booster.prop:0,boostAttached=!!v.booster,bsepT=0;
const massNow=()=>{let m=payload+(fairingOn?fairing:0)+(boostAttached?v.booster.dry+bRem:0);for(let i=cur;i<stages.length;i++)m+=stages[i].dry;for(let i=cur+1;i<stages.length;i++)m+=stages[i].usable;return m+rem;}
const m0=massNow();
if((stages[0].thrustAtP(B.P0)+(v.booster?v.booster.thrustAtP(B.P0):0))<=m0*B.gSurf)return{outcome:'NO_LIFTOFF',vehicle:v,telemetry:[],summary:{body:B.name,liftoffTWR:v.liftoffTWR,totalDvIdeal:v.totalDv,reason:'Liftoff thrust below weight (TWR < 1) — add engines, boosters, or shed mass'}};
const OM=B.omega*Math.cos(lat*Math.PI/180)*Math.sin(azm.az),vK=55;
const atmAt=alt=>atmOf(B,alt);
const vatmOf=(x,y)=>({x:OM*y,y:-OM*x});
const orbitOf=(px,py,pvx,pvy)=>{const r=Math.hypot(px,py),vm=Math.hypot(pvx,pvy);const en=vm*vm/2-B.mu/r;const h=Math.abs(px*pvy-py*pvx);const a=-B.mu/(2*en);const e=Math.sqrt(Math.max(0,1+2*en*h*h/(B.mu*B.mu)));return{en,a,e,apo:en<0?a*(1+e)-B.R:Infinity,peri:a*(1-e)-B.R};};
const grainK=(s,frac)=>s.solid?s.grain.k0+(s.grain.k1-s.grain.k0)*Math.max(0,Math.min(1,frac)):1;
function guide(px,py,pvx,pvy){const r=Math.hypot(px,py),alt=r-B.R;const up={x:px/r,y:py/r};const va=vatmOf(px,py);const rvx=pvx-va.x,rvy=pvy-va.y;const sp=Math.hypot(rvx,rvy);const vhat=sp>1?{x:rvx/sp,y:rvy/sp}:up;if(sp<vK&&phase==='boost')return up;const d=rvx*up.x+rvy*up.y;let hdx=rvx-d*up.x,hdy=rvy-d*up.y;const hm=Math.hypot(hdx,hdy);const hdir=hm>1?{x:hdx/hm,y:hdy/hm}:{x:up.y,y:-up.x};const orb=orbitOf(px,py,pvx,pvy);let gc;if(phase==='insert'){const vr2=(px*pvx+py*pvy)/r;const apoOver=Math.max(0,(orb.apo-orbitAlt)/orbitAlt);gc=Math.max(-0.18,Math.min(0.5,2.0*(orbitAlt-alt)/orbitAlt-0.004*vr2-1.3*apoOver));}else{const at=atmAt(alt);const q=0.5*at.rho*sp*sp;if(alt<45000&&q>7000)return vhat;const apoErr=Math.max(0,Math.min(1,(orbitAlt-orb.apo)/orbitAlt));gc=Math.min(86*Math.PI/180,(turnExp===0.5?Math.sqrt(apoErr):Math.pow(apoErr,turnExp))*90*Math.PI/180);}let dir={x:up.x*Math.sin(gc)+hdir.x*Math.cos(gc),y:up.y*Math.sin(gc)+hdir.y*Math.cos(gc)};const dm=Math.hypot(dir.x,dir.y);dir.x/=dm;dir.y/=dm;if(phase==='boost'){const dot=Math.max(-1,Math.min(1,dir.x*vhat.x+dir.y*vhat.y));const ang=Math.acos(dot);const maxA=alt<45000?0.18:0.7;if(ang>maxA){const f=maxA/ang,nx=vhat.x+(dir.x-vhat.x)*f,ny=vhat.y+(dir.y-vhat.y)*f,nm=Math.hypot(nx,ny);return{x:nx/nm,y:ny/nm};}}return dir;}
function accel(px,py,pvx,pvy,mass,thrusting){const r=Math.hypot(px,py),alt=r-B.R;const g=B.mu/(r*r);let ax=-B.mu/(r*r*r)*px,ay=-B.mu/(r*r*r)*py;const at=atmAt(alt);const va=vatmOf(px,py);const rvx=pvx-va.x,rvy=pvy-va.y;const sp=Math.hypot(rvx,rvy);const aS=Math.sqrt(B.gasG*B.gasR*at.T);const mach=sp/aS;const Cd0=(stages[Math.min(cur,stages.length-1)]).Cd*(fairingOn?v.noseCd:0.82);const cd=Cd0*(1+0.9*Math.exp(-(((mach-1.05)/0.4)**2)))*(mach>5?0.78:1);const q=0.5*at.rho*sp*sp;const drag=q*cd*(v.frontalA+(boostAttached?v.booster.frontalA:0));if(sp>0.1){ax-=drag/mass*(rvx/sp);ay-=drag/mass*(rvy/sp);}let Tmag=0,thr=1;if(thrusting&&cur<stages.length){const dir=guide(px,py,pvx,pvy);const s=stages[cur];Tmag=s.thrustAtP(at.P)*grainK(s,1-rem/s.usable);if(boostAttached&&bRem>0&&phase==='boost')Tmag+=v.booster.thrustAtP(at.P)*grainK(v.booster,1-bRem/v.booster.prop);if(gLimit>0&&Tmag>0){const aT=Tmag/mass/G0;if(aT>gLimit){thr=gLimit/aT;}}if(qLimit>0&&q>0.9*qLimit&&!s.solid){thr=Math.min(thr,Math.max(0.5,1-(q-0.9*qLimit)/(0.4*qLimit)));}Tmag*=thr;ax+=dir.x*Tmag/mass;ay+=dir.y*Tmag/mass;}const qs=1.83e-4*Math.sqrt(at.rho/Math.max(0.05,v.nose.rn*v.maxD/2))*sp*sp*sp;return{ax,ay,g,q,mach,Tmag,drag,alt,sp,thr,rho:at.rho,qs};}
let x=0,y=B.R;const v0=vatmOf(0,B.R);let vx=v0.x,vy=v0.y,t=0;
let gLoss=0,dLoss=0,dvUsed=0,maxQ=0,maxQalt=0,maxG=0,outcome=null,meco=0,qsPeak=0,heatLoad=0,qsPeakAlt=0;
const tel=[];const dt=0.1,tMax=2600;let lastS=-10;
while(t<tMax){
const thrusting=(phase==='boost'||phase==='insert')&&cur<stages.length&&rem>0;const mass=massNow();
const k1=accel(x,y,vx,vy,mass,thrusting);
const k2=accel(x+vx*dt/2,y+vy*dt/2,vx+k1.ax*dt/2,vy+k1.ay*dt/2,mass,thrusting);
const k3=accel(x+(vx+k1.ax*dt/2)*dt/2,y+(vy+k1.ay*dt/2)*dt/2,vx+k2.ax*dt/2,vy+k2.ay*dt/2,mass,thrusting);
const k4=accel(x+(vx+k2.ax*dt/2)*dt,y+(vy+k2.ay*dt/2)*dt,vx+k3.ax*dt,vy+k3.ay*dt,mass,thrusting);
x+=dt/6*(6*vx+dt*(k1.ax+k2.ax+k3.ax))/1;y+=dt/6*(6*vy+dt*(k1.ay+k2.ay+k3.ay));
vx+=dt/6*(k1.ax+2*k2.ax+2*k3.ax+k4.ax);vy+=dt/6*(k1.ay+2*k2.ay+2*k3.ay+k4.ay);t+=dt;
if(thrusting){const s=stages[cur];rem-=s.mdot*(k1.thr||1)*grainK(s,1-rem/s.usable)*dt;dvUsed+=k1.Tmag/mass*dt;}
const r=Math.hypot(x,y),alt=r-B.R,vm=Math.hypot(vx,vy);const up={x:x/r,y:y/r};const fpa=Math.asin(Math.max(-1,Math.min(1,(vx*up.x+vy*up.y)/(vm||1))));const vr=(x*vx+y*vy)/r;
gLoss+=k1.g*Math.sin(fpa)*dt;dLoss+=k1.drag/mass*dt;if(k1.q>maxQ&&phase==='boost'){maxQ=k1.q;maxQalt=alt;}const ag=Math.hypot(k1.ax,k1.ay)/G0;if(ag>maxG)maxG=ag;
if(fairingOn){heatLoad+=k1.qs*dt;if(k1.qs>qsPeak){qsPeak=k1.qs;qsPeakAlt=alt;}}
if(thrusting&&rem<=0){if(cur<stages.length-1){cur++;rem=stages[cur].usable;}else cur++;}
if(fairingOn&&alt>B.atmTop*0.3&&0.5*k1.rho*k1.sp**3<HEAT_FM){fairingOn=false;fairingSepAlt=alt;fairingSepT=t;}
const orb=orbitOf(x,y,vx,vy);
if(boostAttached&&phase==='boost'){bRem-=v.booster.mdot*grainK(v.booster,1-bRem/v.booster.prop)*dt;if(bRem<=0){boostAttached=false;bsepT=t;tel.push({t:+t.toFixed(1),alt:Math.round(alt),vorb:Math.round(vm),apo:Math.round(orb.apo),peri:Math.round(orb.peri),stage:cur+1,phase,event:'BOOSTER SEP'});}}
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
const Tnose=Math.min(Math.pow(qsPeak/(0.85*SB),0.25),290+0.85*heatLoad/((design.noseTps?18:12)*1000));
const res={outcome,vehicle:v,telemetry:tel,summary:{body:B.name,liftoffTWR:v.liftoffTWR,totalDvIdeal:v.totalDv,dvUsed,gravityLoss:gLoss,dragLoss:dLoss,maxQ,maxQalt,maxG,flightTime:t,meco,boosterSepT:bsepT,apoAlt:fo.apo,periAlt:fo.peri,ecc:fo.e,orbitAlt,insThresh,fairingSepAlt,fairingSepT,qsPeak,qsPeakAlt,heatLoad,Tnose,noseLimit:v.nose.tMax||(design.noseTps?1500:480),lat,incl,azDeg:azm.azDeg,azOk:azm.ok,planeChange:azm.planeChange,vRot:B.omega*B.R*Math.cos(lat*Math.PI/180)*Math.sin(azm.az)}};
return opt.refine===false||opt.loads?res:simLaunch(design,bodyKey,{...opt,loads:{maxQ,maxG:Math.max(1.2,maxG)}});}
export function missionDv(B,periAlt,apoAlt,opt={}){const r1=B.R+Math.max(periAlt,0),ra=B.R+Math.max(apoAlt,periAlt,0);const a=(r1+ra)/2;const vp=Math.sqrt(B.mu*(2/r1-1/a)),vc=Math.sqrt(B.mu/r1);const circ=Math.abs(vc-vp);const hoh=rt=>{const at=(r1+rt)/2;return Math.abs(Math.sqrt(B.mu/r1)*(Math.sqrt(rt/at)-1))+Math.abs(Math.sqrt(B.mu/rt)*(1-Math.sqrt(r1/at)));};const rows=[{k:'Circularize',dv:circ}];if(opt.targetAlt&&Math.abs(opt.targetAlt-periAlt)>1e3)rows.push({k:'Hohmann to '+Math.round(opt.targetAlt/1000)+' km',dv:hoh(B.R+opt.targetAlt)});if(opt.planeChange>0)rows.push({k:'Plane change '+opt.planeChange.toFixed(1)+'°',dv:2*vc*Math.sin(opt.planeChange*Math.PI/360)});const rs=B.omega>0?Math.cbrt(B.mu/(B.omega*B.omega)):0;if(rs>r1)rows.push({k:(B.name==='Earth'?'GEO':'Synchronous')+' transfer',dv:hoh(rs)});rows.push({k:'Escape (C3=0)',dv:vc*(Math.SQRT2-1)});if(B.name==='Earth'){rows.push({k:'Trans-lunar (C3 -2)',dv:Math.sqrt(-2e6+2*B.mu/r1)-vc});rows.push({k:'Trans-Mars (C3 12)',dv:Math.sqrt(12e6+2*B.mu/r1)-vc});}rows.push({k:'Deorbit burn',dv:B.atmTop>0?Math.abs(vc-Math.sqrt(B.mu*(2/r1-2/(r1+B.R+B.atmTop*0.4)))):Math.abs(vc-Math.sqrt(B.mu*(2/r1-2/(r1+B.R))))});return rows;}
export const maxPayloadToOrbit=(design,body='earth',tol=10)=>{const oc=p=>{const d=structuredClone(design);d.payload=p;const o=simLaunch(d,body,{refine:false}).outcome;return o==='ORBIT'||o==='ESCAPE';};let hi=Math.max(1000,design.payload||1000),g=0;while(oc(hi)&&hi<1e7&&g++<40)hi*=2;let a=0;if(!oc(a)){let f=-1;for(let i=1;i<=40;i++){const p=hi*i/41;if(oc(p)){f=p;break;}}if(f<0)return 0;a=f;}let b=hi;while(b-a>tol){const m=(a+b)/2;oc(m)?a=m:b=m;}return Math.floor(a);};
