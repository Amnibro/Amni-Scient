// 3D internal flow on an adaptive octree, solved in Helium (he/flow_oct).
// Cells follow the passages: each wall gets about `cellsAcross` cells across the gap in front of it, cells grow
// 2:1 away from walls, and only cells in the flow region are stored. The cell budget scales every size together.
import {heliumSync} from './he/host.js';
const FOF=await heliumSync('flow_oct');
const BUDGET={quick:150000,standard:500000,fine:1500000};
const ERR={'-1':'The part has no surface to mesh.','-2':'The flow region cannot fit the cell budget even with the coarsest cells.','-3':'No closed passage was found. Put a port on every opening; an uncapped hole is treated as the outside and is removed.'};
export function octBudget(q){return typeof q==='number'?q:BUDGET[q]||BUDGET.standard;}

export function buildOctree(inp){
  const X=FOF({ms_acos:Math.acos,ms_log2:Math.log2}),ex=X.ex,V=X.v,pos=inp.pos,idx=inp.idx,np=pos.length/3,nt=idx.length/3,ports=inp.ports||[];
  ex.ms_init();ex.ms_bin(np,nt);V(1).set(pos);V(2).set(idx);ex.ms_surf(np,nt);const R=V(15),diag=R[14];
  ex.fo_setup(ports.length,nt);const CF=V(101),PT=V(103),PP=V(104),fl=inp.fluid;
  const across=inp.cellsAcross||14,hmin=inp.hmin||Math.max(diag*2e-5,0.005),hmax=inp.hmax||diag/12;
  CF[0]=across;CF[1]=hmin;CF[2]=hmax;CF[3]=octBudget(inp.budget);CF[4]=fl.rho;CF[5]=fl.mu;CF[6]=inp.alphaU||0.95;CF[7]=inp.alphaP||1;CF[8]=inp.sweeps||2;CF[9]=inp.amgTol||0.1;CF[10]=Math.max(inp.dpEst||1,1e-6);CF[14]=inp.inletRelax||0.5;CF[16]=inp.simplec===false?0:1;
  ports.forEach((p,k)=>{for(const t of p.tris||[])PT[t]=k+1;const b=16*k,lo=[1e30,1e30,1e30],hi=[-1e30,-1e30,-1e30];for(const t of p.tris||[])for(let q=0;q<3;q++)for(let d=0;d<3;d++){const v=pos[3*idx[3*t+q]+d];lo[d]=Math.min(lo[d],v);hi[d]=Math.max(hi[d],v);}
    const t0=(p.tris||[])[0],p0=t0!=null?[0,1,2].map(d=>pos[3*idx[3*t0]+d]):[0,0,0],n=p.normal||[0,0,0];PP[b]=p.planar&&p.normal?1:0;PP.set(p0,b+1);PP.set(n,b+4);PP.set(lo,b+7);PP.set(hi,b+10);
    const flow=p.spec!=='pressure';PP[b+13]=flow?1:0;PP[b+14]=flow?(p.kind==='outlet'?-1:1)*Math.abs(+p.Q||0):(+p.value||0);PP[b+15]=p.kind==='inlet'?0:p.kind==='outlet'?1:2;});
  const t0=Date.now(),n=ex.fo_build(),ST=V(102);
  if(n<0)throw new Error(ERR[n]||(n<=-10?'Port "'+((ports[-n-10]||{}).name||'port '+(-n-9))+'" does not touch the flow region.':'Octree build failed ('+n+').'));
  return{X,ex,V,ports,diag,fluid:fl,ms:Date.now()-t0,stats:{nodes:ST[0],leaves:ST[1],cells:ST[2],unknowns:ST[3],faces:ST[4],scale:ST[5],rebuilds:ST[6],h_min_mm:ST[7],h_max_mm:ST[8],levels:[ST[9],ST[10]],outside_removed:ST[15],dead_removed:ST[16],port_cells:ST[17],wall_faces:ST[18]},across,hmin,hmax};}

// Runs SIMPLE iterations until the mass residual, the velocity change and the flow-port flows settle.
export async function solveOctree(O,inp={},prog,stop){
  const{ex,V,ports}=O,maxIt=inp.maxIter||3000,chunk=inp.chunk||10,tol=inp.tol||1e-4,t0=Date.now(),maxMs=inp.maxMs||600000,hist=[];let it=0,conv=false,lastQ=null,ST=V(102),PV=V(105);
  // Enstrophy-feedback continuation (Master Momentum closure, Eq. 11'): a uniform viscosity nu_glob = c l^2 w_rms,
  // with w_rms the rms vorticity and l the narrowest passage, damps the early iterations; c falls with the residual
  // and is zero before convergence is accepted, so the converged answer is plain Navier-Stokes.
  // Measured on a 6 mm bore: 2.1x fewer iterations at Re 1000 and 4.2x at Re 2000 with the same pressure drop, and
  // about 10 % more at Re 500, so by default it switches on above Re 700 (from the inlet flow after the first chunk).
  const G=inp.glob===false?null:{c0:0.05,decay:0.7,minRe:700,...(inp.glob||{})},force=!!inp.glob,ell=(O.across||14)*(O.stats.h_min_mm||1)*1e-3,fl=O.fluid;
  let gc=0,goff=true,decided=!G,glob=0,reEst=null,globIt=0;
  while(it<maxIt){if(!goff){ex.fo_omega();ST=V(102);glob=gc*ell*ell*ST[36];globIt+=chunk;}else glob=0;V(101)[17]=glob;ex.fo_iter(chunk);it+=chunk;ST=V(102);PV=V(105);
    if(!decided){decided=true;let Qi=0,Ai=0;ports.forEach((p,k)=>{if(PV[8*k+1]>0){Qi+=PV[8*k+1];Ai+=PV[8*k+3];}});const Dh=2*Math.sqrt(Math.max(Ai,1e-18)/Math.PI);reEst=fl?fl.rho*Qi/Math.max(Ai,1e-18)*Dh/Math.max(fl.mu,1e-12):0;if(force||reEst>=G.minRe){gc=G.c0;goff=false;}}
    else if(!goff){gc*=G.decay;if(gc<0.01*G.c0){goff=true;V(101)[17]=0;}}const Q=ports.map((_,k)=>PV[8*k+1]),res=ST[11],du=ST[12],dq=lastQ?Math.max(...Q.map((q,k)=>Math.abs(q-lastQ[k])/Math.max(Math.abs(ST[20]),1e-300))):1;lastQ=Q;
    const tgt=ports.map((p,k)=>p.spec==='pressure'?0:Math.abs(Math.abs(Q[k])/Math.max(Math.abs(+p.Q||0),1e-300)-1)),tq=Math.max(0,...tgt);hist.push({it,res,du,dq,tq,glob});
    if(prog)prog({stage:'3D octree',it,res,du});if(goff&&res<tol&&du<tol*10&&dq<tol&&tq<2e-3){conv=true;break;}if(stop&&stop())break;if(Date.now()-t0>maxMs)break;if(inp.yield!==false)await new Promise(r=>setTimeout(r,0));}
  ST=V(102);PV=V(105);const P=ports.map((_,k)=>PV[8*k]),Q=ports.map((_,k)=>PV[8*k+1]),A=ports.map((_,k)=>PV[8*k+3]);
  return{iterations:it,converged:conv,ms:Date.now()-t0,P,Q,A,res:ST[11],du:ST[12],amgIt:ST[14],hist,continuation:{used:globIt>0,iterations:globIt,Re_estimate:reEst}};}

// Cell centers (mm), sizes (mm), velocity (m/s), pressure (Pa) and cell kind (-1 fluid, k port k) of the solved region.
export function octFields(O){const{V,ex}=O;ex.fo_fin();const xc=V(110),n=xc.length/3,ux=V(116),an=V(117),pk=V(118),kind=new Int32Array(n);for(let a=0;a<n;a++)kind[a]=ux[a]>=0?-1:pk[an[a]];
  return{n,xc:xc.slice(),h:V(111).slice(),u:V(112).slice(),v:V(113).slice(),w:V(114).slice(),p:V(115).slice(),kind,ws:V(124).slice(),vfluid:V(102)[35]};}

// Closed-passage internal flow on the octree, returning the same summary fields as the uniform 3D run
// plus `octree` (cell centers, sizes and fields) for display.
export async function runClosedOct(inp,prog,stop){
  const fl=inp.fluid,t0=Date.now(),warn=[],ports=inp.ports||[],budget=octBudget(inp.octBudget||inp.quality||'standard');
  const O=buildOctree({...inp,budget,cellsAcross:inp.cellsAcross||14});const st=O.stats;
  if(st.scale>1.0001)warn.push('The cell budget of '+(budget/1e3).toFixed(0)+' k cells is too small for '+O.across+' cells across every passage, so every cell is '+st.scale.toFixed(2)+'× larger than asked ('+(O.across/st.scale).toFixed(1)+' cells across the narrowest passage). Choose a finer quality for more.');
  prog&&prog({stage:'3D octree mesh',cells:st.cells});
  const S=await solveOctree(O,{maxIter:inp.maxIter||4000,maxMs:inp.maxMs||1800000,yield:inp.yield,tol:inp.tol},prog,stop);
  if(!S.converged)warn.push('The 3D solution stopped after '+S.iterations+' iterations before it settled (mass residual '+S.res.toExponential(1)+'); treat the numbers as approximate.');
  const F=octFields(O),ST=O.V(102),root={ox:ST[30],oy:ST[31],oz:ST[32],ext:ST[33],lmax:ST[34]};
  const Qp=S.Q,Pp=S.P,inK=ports.map((p,k)=>p.kind==='inlet'||p.kind==='boundary'&&Qp[k]>0),pin=Pp.filter((_,k)=>inK[k]),pout=Pp.filter((_,k)=>!inK[k]);
  const dp=pin.length&&pout.length?Math.max(...pin)-Math.min(...pout):Math.max(...Pp)-Math.min(...Pp),Qin=Qp.filter((_,k)=>inK[k]).reduce((a,b)=>a+b,0),Qout=-Qp.filter((_,k)=>!inK[k]).reduce((a,b)=>a+b,0);
  const Ain=S.A.filter((_,k)=>inK[k]).reduce((a,b)=>a+b,0),Dh=2*Math.sqrt(Math.max(Ain,1e-18)/Math.PI),U=Qin/Math.max(Ain,1e-18),Re=fl.rho*U*Dh/Math.max(fl.mu,1e-12);
  let umax=0;for(let a=0;a<F.n;a++)if(F.kind[a]<0)umax=Math.max(umax,Math.hypot(F.u[a],F.v[a],F.w[a]));
  const nw=F.ws.length/2,wi=[...Array(nw).keys()].sort((a,b)=>F.ws[2*a]-F.ws[2*b]);let wa=0,wt=0;for(let e=0;e<nw;e++){wa+=F.ws[2*e]*F.ws[2*e+1];wt+=F.ws[2*e+1];}let acc=0,p99=0;for(const e of wi){acc+=F.ws[2*e+1];if(acc>=0.99*wt){p99=F.ws[2*e];break;}}
  const shear={mean:wt?wa/wt:0,p99},lenmm=F.vfluid/Math.max(Ain,1e-18)*1e3;
  const cS=fl.c||Math.sqrt((fl.gamma||1.4)*Math.max(fl.p||101325,1)/Math.max(fl.rho,1e-9)),Ma=umax/cS;
  if(Ma>0.3)warn.push('Mach '+Ma.toFixed(2)+' is above the low-Mach limit of about 0.3, so density change along the passage is not solved.');
  let turbulent=null;if(Re>2300){const fT=0.316*Math.pow(Re,-0.25),fL=64/Re;turbulent={model:'Blasius',Re,Dh_mm:Dh*1e3,U_m_s:U,dp_laminar_Pa:dp,dp_turbulent_Pa:dp*fT/fL,f_laminar:fL,f_turbulent:fT};warn.push('Inlet Re '+Re.toFixed(0)+' is above 2300; this solve is laminar. Blasius turbulent pressure drop '+turbulent.dp_turbulent_Pa.toFixed(3)+' Pa ('+(turbulent.dp_turbulent_Pa*1.4503774e-4).toFixed(4)+' psi).');}
  const seeds=[],inC=[];for(let a=0;a<F.n;a++){const k=F.kind[a];if(k>=0&&inK[k])inC.push(a);}const stp=Math.max(1,Math.floor(inC.length/300));for(let i=0;i<inC.length;i+=stp){const a=inC[i];seeds.push([F.xc[3*a],F.xc[3*a+1],F.xc[3*a+2]]);}
  const f32=x=>Float32Array.from(x);
  return{mode:'octree',internal:true,cover:'none',dp,P:Pp,ports:ports.map((pt,k)=>({name:pt.name,kind:pt.kind==='boundary'?(inK[k]?'inlet':'outlet'):pt.kind,spec:pt.spec,Q:Qp[k],target:pt.Q,p:Pp[k],cells:Math.round(O.V(105)[8*k+2]),area_mm2:S.A[k]*1e6,U:Qp[k]/Math.max(S.A[k],1e-18),window:false})),
    Qin,Qout,imbalance:Qin?Math.abs(Qin-Qout)/Math.abs(Qin):0,Re:{max:Re},mach:Ma,turbulent,Umean:U,fluid:fl,warn,ms:Date.now()-t0,
    passage:{fluid_cells:st.unknowns,Dh_mm:Dh*1e3,length_mm:lenmm,area_mm2:Ain*1e6,Re,U_m_s:U,cells_across:O.across/Math.max(st.scale,1)},cut:{segs:[],layerQ:0},maldist:{n:0,mean:0,min:0,max:0,range:0,sd:0},shear,porous:[],
    octree:{...st,iterations:S.iterations,converged:S.converged,residual:S.res,solve_ms:S.ms,build_ms:O.ms,continuation:S.continuation,root,n:F.n,xc:f32(F.xc),h:f32(F.h),u:f32(F.u),v:f32(F.v),w:f32(F.w),p:f32(F.p),kind:Int16Array.from(F.kind),umax},
    hist:S.hist,seeds,lineSteps:4000};}

