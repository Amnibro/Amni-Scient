export const RU=8.314462618,PSTD=101325,TSTD=273.15;
const WT=[[0,999.84,1.793],[5,999.97,1.519],[10,999.70,1.307],[15,999.10,1.138],[20,998.21,1.002],[25,997.05,0.890],[30,995.65,0.798],[35,994.03,0.719],[40,992.22,0.653],[45,990.21,0.596],[50,988.04,0.547],[55,985.69,0.504],[60,983.20,0.467],[65,980.55,0.433],[70,977.76,0.404],[75,974.84,0.378],[80,971.79,0.355],[85,968.61,0.333],[90,965.31,0.315],[95,961.89,0.297],[100,958.35,0.282]];
const SUTH={air:[1.716e-5,111,28.9647],h2:[8.411e-6,97,2.01588],o2:[1.919e-5,139,31.9988],n2:[1.663e-5,107,28.0134]};
const GSRC='Viscosity: Sutherland law with White, Viscous Fluid Flow 3rd ed. (2006) Table 1-2 constants, about ±2 %. Density: ideal gas, molar mass from NIST.';
export const IFLUIDS={water:{n:'Water (liquid)',rng:[0,100],src:'Density and viscosity at 1 atm tabulated every 5 °C from the CRC Handbook of Chemistry and Physics (IAPWS-95 / IAPWS 2008 values), interpolated (log for viscosity). About ±0.2 %.'},air:{n:'Air (dry)',gas:1,rng:[-100,500],src:GSRC},h2:{n:'Hydrogen (H₂)',gas:1,rng:[-100,500],src:GSRC},o2:{n:'Oxygen (O₂)',gas:1,rng:[-100,500],src:GSRC},n2:{n:'Nitrogen (N₂)',gas:1,rng:[-100,500],src:GSRC}};
export function fluidAt(k,T=20,p=PSTD){const F=IFLUIDS[k]||IFLUIDS.water,key=IFLUIDS[k]?k:'water',warn=T<F.rng[0]||T>F.rng[1]?'Temperature is outside the data range ('+F.rng.join('–')+' °C).':'';
  if(!F.gas){const t=Math.min(100,Math.max(0,T)),i=Math.min(WT.length-2,Math.floor(t/5)),a=WT[i],b=WT[i+1],f=(t-a[0])/5,rho=a[1]+(b[1]-a[1])*f,mu=1e-3*Math.exp(Math.log(a[2])+(Math.log(b[2])-Math.log(a[2]))*f);return{key,n:F.n,rho,mu,nu:mu/rho,T,p,gas:false,src:F.src,warn};}
  const[m0,S,M]=SUTH[key],TK=T+273.15,mu=m0*Math.pow(TK/273,1.5)*(273+S)/(TK+S),rho=p*M*1e-3/(RU*TK);return{key,n:F.n,rho,mu,nu:mu/rho,T,p,gas:true,M,rhoStd:PSTD*M*1e-3/(RU*TSTD),src:F.src,warn};}
export function ductQ(w,h,K=Infinity,mr=1){if(!(w>0&&h>0))return 0;const a=Math.min(w,h),b=Math.max(w,h),d=isFinite(K)?1/(mr*K):0,c=Math.PI*Math.PI/(a*a),N=401,M=N+1,z=d?M*Math.sqrt(c/d):0;let s=0;
  for(let n=1;n<=N;n+=2){const l=Math.sqrt(c*n*n+d),x=l*b/2;s+=8/(n*n*Math.PI*Math.PI*mr*l*l)*(1-(x>20?1:Math.tanh(x))/x);}
  return a*b*(s+4/(Math.PI*Math.PI*mr)*(d?(1/M-Math.sqrt(c/d)*Math.atan(1/z))/d:1/(3*c*M**3)));}
export const pipeQ=D=>Math.PI*Math.pow(D/2,4)/8;
export const fReSL=al=>{const a=Math.min(al,1/al);return 24*(1-1.3553*a+1.9467*a*a-1.7012*a**3+0.9564*a**4-0.2537*a**5);};
export const KinfSL=al=>{const a=Math.min(al,1/al);return 0.6796+1.2197*a+3.3089*a*a-9.5921*a**3+8.9089*a**4-2.9959*a**5;};
export const BEND={miter90:{K1:1000,Kinf:1.15,src:'Hooper (1981) 2-K method, mitered 90° elbow; the pipe-size term is dropped for mini channels'}};
export const bendK=(Re,deg=90)=>deg/90*(BEND.miter90.K1/Math.max(Re,1e-9)+BEND.miter90.Kinf);
export function brinkPlates(H,K,mr=1){const l=Math.sqrt(mr*K),x=H/(2*l);return H*K*(1-(x>20?1:Math.tanh(x))/x);}
export const kozenyFiber=(d,e,k=4.28)=>d*d*e*e*e/(16*k*(1-e)*(1-e));
export function tsFiber(d,e,dir='normal'){const ep=0.11,al=dir==='normal'?0.785:0.521;return e*d*d*Math.pow(e-ep,al+2)/(32*Math.log(e)**2*Math.pow(1-ep,al)*((al+1)*e-ep)**2);}
export const ergunK=(d,e)=>d*d*e*e*e/(150*(1-e)*(1-e)),ergunB=(d,e)=>1.75*(1-e)/(e*e*e*d);
export const liuBeta=(K,e)=>2.88e-6*Math.pow(e,-0.5)/(K*e);
export function calmidi(ppi,e){const dp=0.0254/ppi,r=1.18*Math.sqrt((1-e)/(3*Math.PI))/(1-Math.exp(-(1-e)/0.04)),K=dp*dp*0.00073*Math.pow(1-e,-0.224)*Math.pow(r,-1.11),CF=0.00212*Math.pow(1-e,-0.132)*Math.pow(r,-1.63);return{K,beta:CF/Math.sqrt(K),dp,CF};}
export const forch=(u,mu,rho,K,beta)=>mu*u/K+beta*rho*u*Math.abs(u);
export const ergunDp=(u,mu,rho,d,e)=>150*mu*(1-e)**2*u/(e**3*d*d)+1.75*rho*(1-e)*u*Math.abs(u)/(e**3*d);
const TS='Tomadakis–Sotirchos random-fiber model (AIChE J. 1993; validated on carbon papers by Gostick et al., J. Power Sources 162 (2006) 228)',LIU='Forchheimer β from Liu et al. (1994) as used by Gostick et al. (2006)',ERG='Ergun (1952): K = d²ε³/150(1−ε)², β = 1.75(1−ε)/ε³d',UNC='Uncompressed. Compression to 75 % of the thickness typically lowers K 2–10× (Gostick 2006); measure your stack when it matters.';
const fib=(n,t,e,d,extra={})=>({n,t,eps:e,Kip:tsFiber(d,e,'parallel'),Ktp:tsFiber(d,e,'normal'),beta:liuBeta(tsFiber(d,e,'parallel'),e),basis:'model',...extra});
const ti=ergunK(50e-6,0.35),ss=ergunK(40e-6,0.40),nf=calmidi(110,0.95),nf40=calmidi(40,0.92),bd=ergunK(1e-3,0.38);
export const POROUS={
toray060:{n:'Carbon paper, Toray TGP-H-060 class',t:190e-6,eps:0.78,Kip:kozenyFiber(9.2e-6,0.78,4.07),Ktp:1900*2.8325e-10*1.85e-5,beta:8.22e4,basis:'datasheet + measured',src:'Thickness 190 µm, porosity 78 % and through-plane gas permeability 1900 mL·mm/(cm²·h·mmAq) from the Toray TGP-H datasheet (converted with μ_air = 1.85×10⁻⁵ Pa·s). In-plane K: Carman–Kozeny with the Toray constant k = 4.07 and 9.2 µm fibers (Gostick et al. 2006, Table 3). β: in-plane value measured on Toray 090 (Gostick 2006). '+UNC},
toray090:{n:'Carbon paper, Toray TGP-H-090 class',t:290e-6,eps:0.80,Kip:kozenyFiber(9.2e-6,0.80,4.07),Ktp:8.99e-12,beta:8.22e4,basis:'measured',src:'Gostick et al., J. Power Sources 162 (2006) 228: porosity 0.80, thickness 290 µm, through-plane K = 8.99×10⁻¹² m² (Table 2), in-plane Carman–Kozeny k = 4.07 (Table 3), β = 8.22×10⁴ m⁻¹. '+UNC},
felt:fib('Carbon / graphite felt (≈ 4.6 mm, ε 0.94)',4.6e-3,0.94,9.5e-6,{src:'Porosity 0.94 and fiber diameter ≈ 9.5 µm typical of PAN graphite felts. K from the '+TS+'. '+LIU+'. '+UNC}),
tiFiber:fib('Titanium fiber felt PTL (ε 0.70, 20 µm fibers)',250e-6,0.70,20e-6,{src:'Sintered titanium fiber felt, porosity 0.70, fiber diameter 20 µm. K from the '+TS+'. '+LIU+'. Values vary widely between grades; enter the vendor value when you have it.'}),
tiPowder:{n:'Sintered titanium powder PTL (ε 0.35, 50 µm)',t:1e-3,eps:0.35,Kip:ti,Ktp:ti,beta:ergunB(50e-6,0.35),basis:'model',src:ERG+' with 50 µm spherical-equivalent powder and porosity 0.35. Sintering necks lower K; published sintered Ti PTLs span about 10⁻¹³–10⁻¹¹ m².'},
ssPowder:{n:'Sintered stainless powder (ε 0.40, 40 µm)',t:1.5e-3,eps:0.40,Kip:ss,Ktp:ss,beta:ergunB(40e-6,0.40),basis:'model',src:ERG+' with 40 µm powder and porosity 0.40 (filter-grade sintered 316L). Use the vendor permeability for a given media grade.'},
niFoam:{n:'Nickel foam, 110 PPI, ε 0.95',t:1.6e-3,eps:0.95,Kip:nf.K,Ktp:nf.K,beta:nf.beta,basis:'correlation',src:'Calmidi & Mahajan, J. Heat Transfer 122 (2000) 557 metal-foam correlation (K/d_p² = 0.00073(1−ε)^−0.224(d_f/d_p)^−1.11, C_F = 0.00212(1−ε)^−0.132(d_f/d_p)^−1.63) at 110 PPI. Fitted on aluminum foams; ±30 % for nickel foams.'},
foam40:{n:'Metal foam, 40 PPI, ε 0.92',t:5e-3,eps:0.92,Kip:nf40.K,Ktp:nf40.K,beta:nf40.beta,basis:'correlation',src:'Calmidi & Mahajan (2000) metal-foam correlation at 40 PPI, porosity 0.92. ±30 %.'},
bed:{n:'Packed bed, 1 mm spheres, ε 0.38',t:10e-3,eps:0.38,Kip:bd,Ktp:bd,beta:ergunB(1e-3,0.38),basis:'correlation',src:ERG+' with 1 mm spheres, porosity 0.38. Wall channeling in narrow beds (D/d < 10) is not included.'}};
export function zoneProps(z){const m=POROUS[z.mat]||{},g=(k,d)=>z[k]!=null&&z[k]!==''&&isFinite(+z[k])?+z[k]:m[k]!=null?m[k]:d;return{eps:g('eps',0.8),Kip:g('Kip',1e-11),Ktp:g('Ktp',g('Kip',1e-11)),beta:g('beta',0),t:g('t',2e-4),n:m.n||'Custom porous medium',src:m.src||'User values.'};}
