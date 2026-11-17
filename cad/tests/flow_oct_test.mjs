// Adaptive octree 3D internal flow (he/flow_oct): pressure drop against Hagen-Poiseuille and duct theory,
// cell counts against the uniform bounding-box grid, and mass balance.
// Run from cad/: node tests/flow_oct_test.mjs   (ONLY=bore,big to pick cases)
import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import * as P from '../porous.js';
import {buildOctree,solveOctree} from '../flow_oct.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});
await K.init(oc);
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean),want=k=>!ONLY.length||ONLY.includes(k);
const build=async doc=>{const r=await K.build(doc);if(!r.body)throw new Error(JSON.stringify(r.errors));return K.meshBody(r.body,0.2);};
const tris=(m,fid)=>{const o=[];for(const[s,c,f]of m.groups)if(f===fid)for(let t=s/3;t<(s+c)/3;t++)o.push(t);return o;};
const side=(m,s)=>{const ax='XYZ'.indexOf(s[1]),sg=s[0]==='+'?1:-1,ids=m.faces.map((f,i)=>f.n&&f.n[ax]*sg>0.9&&Math.abs(f.c[ax]-(sg>0?m.props.bbox.max[ax]:m.props.bbox.min[ax]))<1e-3?i:-1).filter(i=>i>=0);return{tris:ids.flatMap(i=>tris(m,i)),n:[0,0,0].map((_,i)=>i===ax?sg:0),area:ids.reduce((a,i)=>a+(m.faces[i].area||0),0)};};
const port=(m,s,kind,spec,value)=>{const f=side(m,s),o={name:kind+' '+s,kind,spec,value,tris:f.tris,planar:true,normal:f.n,area:f.area};if(spec!=='pressure')o.Q=value;return o;};
const water=P.fluidAt('water',25);
const run=async(m,ports,o={})=>{const O=buildOctree({pos:m.pos,idx:m.idx,ports,fluid:water,...o});const S=await solveOctree(O,{yield:false,...o});return{O,S};};

if(want('bore')){
  // A 6 mm bore through a 20 mm block at Re about 0.5, so the entrance length is a small part of the bore and
  // Hagen-Poiseuille holds. (At Re 50 the uniform inflow needs most of this bore to develop and adds about 25 %.)
  const L=20,D=6,m=await build({units:'mm',params:[],features:[{id:'b',type:'box',w:L,d:14,h:14},{id:'h',type:'hole',plane:'YZ',offset:L/2,d:D,thru:true,pts:[[0,7]]}]});
  const Aopen=Math.max(14*14-side(m,'-X').area,1),De=2*Math.sqrt(Aopen/Math.PI),Q=2e-9;
  for(const[across,tol]of[[8,0.15],[14,0.06]]){
    const t0=Date.now(),{O,S}=await run(m,[port(m,'-X','inlet','flow',Q),port(m,'+X','outlet','pressure',0)],{cellsAcross:across,dpEst:128*water.mu*L*1e-3*Q/(Math.PI*(De*1e-3)**4)});
    const dp=S.P[0]-S.P[1],dpEx=128*water.mu*(L*1e-3)*Q/(Math.PI*(De*1e-3)**4);
    console.log('  bore',across,'across',JSON.stringify({cells:O.stats.cells,levels:O.stats.levels,h:[+O.stats.h_min_mm.toFixed(3),+O.stats.h_max_mm.toFixed(3)],it:S.iterations,conv:S.converged,res:+S.res.toExponential(2),Qin:+S.Q[0].toExponential(4),Qout:+S.Q[1].toExponential(4),dp:+dp.toExponential(4),dpEx:+dpEx.toExponential(4),ms:Date.now()-t0}));
    ok(S.converged,'bore at '+across+' cells across converges',S.iterations+' iterations');
    ok(Math.abs(S.Q[0]/Q-1)<2e-3&&Math.abs(S.Q[0]+S.Q[1])/Q<2e-3,'the inlet delivers the set flow and the outlet returns it',(S.Q[0]/Q).toFixed(5)+', imbalance '+((S.Q[0]+S.Q[1])/Q).toExponential(2));
    ok(Math.abs(dp/dpEx-1)<tol,'bore pressure drop matches Hagen-Poiseuille within '+tol*100+' % at '+across+' cells across',(100*(dp/dpEx-1)).toFixed(2)+' %');
  }
}

if(want('fast')){
  // Re 2000 in the 6 mm bore: the enstrophy-feedback continuation (Master Momentum closure, Eq. 11') must cut the
  // iterations without moving the answer, because its viscosity is zero before convergence is accepted.
  const L=20,D=6,m=await build({units:'mm',params:[],features:[{id:'b',type:'box',w:L,d:14,h:14},{id:'h',type:'hole',plane:'YZ',offset:L/2,d:D,thru:true,pts:[[0,7]]}]});
  const A=(14*14-side(m,'-X').area)*1e-6,Q=2000*water.mu/(water.rho*D*1e-3)*A,ports=[port(m,'-X','inlet','flow',Q),port(m,'+X','outlet','pressure',0)];
  const plain=await run(m,ports,{glob:false,maxIter:4000}),fast=await run(m,ports,{maxIter:4000}),dp0=plain.S.P[0]-plain.S.P[1],dp1=fast.S.P[0]-fast.S.P[1];
  console.log('  Re 2000',JSON.stringify({plain:{it:plain.S.iterations,ms:plain.S.ms,dp:+dp0.toPrecision(6)},continuation:{it:fast.S.iterations,ms:fast.S.ms,dp:+dp1.toPrecision(6),...fast.S.continuation}}));
  ok(plain.S.converged&&fast.S.converged&&fast.S.continuation.used,'at Re 2000 the continuation switches on and both runs converge',fast.S.iterations+' vs '+plain.S.iterations+' iterations');
  ok(fast.S.iterations<0.5*plain.S.iterations,'the continuation needs under half the iterations',(plain.S.iterations/fast.S.iterations).toFixed(1)+'× fewer');
  ok(Math.abs(dp1/dp0-1)<1e-3,'and gives the same pressure drop',(100*(dp1/dp0-1)).toExponential(1)+' %');
}

if(want('long')){
  // A 2 mm bore 100 mm long (50 diameters) at Re about 5: fully developed over nearly its whole length.
  const L=100,D=2,m=await build({units:'mm',params:[],features:[{id:'b',type:'box',w:L,d:20,h:20},{id:'h',type:'hole',plane:'YZ',offset:L/2,d:D,thru:true,pts:[[0,10]]}]});
  const Aopen=Math.max(400-side(m,'-X').area,0.01),De=2*Math.sqrt(Aopen/Math.PI),Q=1e-8,dpEx=128*water.mu*(L*1e-3)*Q/(Math.PI*(De*1e-3)**4),t0=Date.now();
  const{O,S}=await run(m,[port(m,'-X','inlet','flow',Q),port(m,'+X','outlet','pressure',0)],{dpEst:dpEx});const dp=S.P[0]-S.P[1];
  console.log('  long bore',JSON.stringify({cells:O.stats.cells,it:S.iterations,conv:S.converged,dp:+dp.toFixed(3),dpEx:+dpEx.toFixed(3),ms:Date.now()-t0}));
  ok(S.converged&&Math.abs(dp/dpEx-1)<0.05,'a 50-diameter bore matches Hagen-Poiseuille within 5 %',(100*(dp/dpEx-1)).toFixed(2)+' %');
}

if(want('big')){
  // A 1 mm bore through a 300 x 300 x 100 mm block: the uniform bounding-box grid at 1/8 mm needs billions of cells.
  const m=await build({units:'mm',params:[],features:[{id:'b',type:'box',w:300,d:300,h:100},{id:'h',type:'hole',plane:'YZ',offset:150,d:1,thru:true,pts:[[0,50]]}]});
  const Q=1e-9,h=1/8,uniform=Math.round(300/h)*Math.round(300/h)*Math.round(100/h),t0=Date.now();
  const{O,S}=await run(m,[port(m,'-X','inlet','flow',Q),port(m,'+X','outlet','pressure',0)],{dpEst:128*water.mu*0.3*Q/(Math.PI*(1e-3)**4),maxIter:4000});
  const Aopen=Math.max(300*100-side(m,'-X').area,1e-3),De=2*Math.sqrt(Aopen/Math.PI),dp=S.P[0]-S.P[1],dpEx=128*water.mu*0.3*Q/(Math.PI*(De*1e-3)**4);
  console.log('  big block',JSON.stringify({uniform_cells:uniform,octree_cells:O.stats.cells,nodes:O.stats.nodes,h:[+O.stats.h_min_mm.toFixed(3),+O.stats.h_max_mm.toFixed(3)],build_ms:O.ms,it:S.iterations,conv:S.converged,dp:+dp.toFixed(2),dpEx:+dpEx.toFixed(2),ms:Date.now()-t0}));
  ok(O.stats.cells<uniform/1000,'a 1 mm bore through a 300 mm block needs a thousandth of the uniform grid',O.stats.cells+' cells vs '+(uniform/1e9).toFixed(1)+' billion');
  ok(S.converged&&Math.abs(dp/dpEx-1)<0.1,'and still matches Hagen-Poiseuille within 10 %',(100*(dp/dpEx-1)).toFixed(2)+' %');
}
if(want('turb')){
  const L=120,D=6,m=await build({units:'mm',params:[],features:[{id:'b',type:'box',w:L,d:14,h:14},{id:'h',type:'hole',plane:'YZ',offset:L/2,d:D,thru:true,pts:[[0,7]]}]});
  const A=(14*14-side(m,'-X').area)*1e-6,Dm=2*Math.sqrt(A/Math.PI);
  const colebrook=Re=>{let f=0.02;for(let i=0;i<50;i++)f=Math.pow(-2*Math.log10(2.51/(Re*Math.sqrt(f))),-2);return f;};
  for(const Re of(process.env.RE?process.env.RE.split(',').map(Number):[2e4,1e5])){
    const U=Re*water.mu/(water.rho*Dm),Q=U*A,t0=Date.now();
    const{O,S}=await run(m,[port(m,'-X','inlet','flow',Q),port(m,'+X','outlet','pressure',0)],{maxIter:+(process.env.MAXIT||3000),dpEst:0.03*L/D*0.5*water.rho*U*U});
    const{octFields}=await import('../flow_oct.js'),F=octFields(O);let x0=1e9,x1=-1e9;for(let a=0;a<F.n;a++)if(F.kind[a]<0){x0=Math.min(x0,F.xc[3*a]);x1=Math.max(x1,F.xc[3*a]);}
    const slab=xs=>{let s=0,v=0;for(let a=0;a<F.n;a++)if(F.kind[a]<0&&Math.abs(F.xc[3*a]-xs)<0.6*F.h[a]){const w=F.h[a]**3;s+=w*F.p[a];v+=w;}return s/v;};
    const xa=x0+0.5*(x1-x0),xb=x0+0.9*(x1-x0),g=(slab(xa)-slab(xb))/((xb-xa)*1e-3),f=g*Dm/(0.5*water.rho*U*U),fc=colebrook(Re),fb=0.316*Math.pow(Re,-0.25),T=S.turbulence;
    console.log('  turb Re',Re,JSON.stringify({cells:O.stats.cells,it:S.iterations,conv:S.converged,res:+S.res.toExponential(2),f:+f.toFixed(5),colebrook:+fc.toFixed(5),blasius:+fb.toFixed(5),yplus:T.yplus&&[+T.yplus.mean.toFixed(1),+T.yplus.max.toFixed(1)],nut:T.nut_ratio&&[+T.nut_ratio.mean.toFixed(1),+T.nut_ratio.max.toFixed(1)],model:T.model,ms:Date.now()-t0}));
    ok(T.model==='k-omega SST','Re '+Re+' switches the octree to k-omega SST on its own',T.model);
    ok(S.converged,'the turbulent bore converges at Re '+Re,S.iterations+' iterations');
    ok(Math.abs(f/fc-1)<0.15,'developed Darcy factor matches Colebrook within 15 % at Re '+Re,(100*(f/fc-1)).toFixed(1)+' %');
  }
}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
