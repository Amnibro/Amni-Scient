import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {runFEA,jacobiEig} from '../fea.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log(c?'ok  ':'FAIL',m);},pct=(a,b)=>((a/b-1)*100).toFixed(2)+'%',only=process.argv[2];
const part=async f=>{const r=await K.build({params:[],features:[{id:'a',...f}]});const m=K.meshBody(r.body);K.resetCache();const fid=n=>m.faces.findIndex(q=>q.n&&Math.abs(q.n[0]-n[0])+Math.abs(q.n[1]-n[1])+Math.abs(q.n[2]-n[2])<1e-6);return{m,fid,base:{pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume}};};
const steel={E:200000,nu:0.3,rho:7850};
const verts=(m,pred)=>{const o=[];for(let i=0;i<m.pos.length/3;i++)if(pred(m.pos[3*i],m.pos[3*i+1],m.pos[3*i+2]))o.push(i);return o;};
{const A=new Float64Array(36);let s=3;for(let i=0;i<6;i++)for(let j=i;j<6;j++){s=(s*1103515245+12345)&0x7fffffff;A[i*6+j]=A[j*6+i]=s/0x7fffffff-0.5;}const A0=A.slice(),{w,V,ord}=jacobiEig(A,6);let e=0;for(let k=0;k<6;k++){const c=ord[k];for(let i=0;i<6;i++){let t=0;for(let j=0;j<6;j++)t+=A0[i*6+j]*V[j*6+c];e=Math.max(e,Math.abs(t-w[k]*V[i*6+c]));}}ok(e<1e-10&&w.every((v,i)=>!i||v>=w[i-1]),'jacobiEig residual '+e.toExponential(1));}
if(!only||only==='torsion'){const R0=10,L=100,T=1e5,{m,fid,base}=await part({type:'cylinder',r:R0,h:L,axis:'X'}),G=steel.E/2/(1+steel.nu),J=Math.PI*R0**4/2,th=T*L/(G*J),vmT=Math.sqrt(3)*T*R0/J;
  const R=await runFEA({...base,mat:steel,fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],M:[T,0,0]}],res:40000});
  const tip=verts(m,(x,y,z)=>x>L-1e-6&&Math.hypot(y,z)>R0*0.5);let tw=0;for(const i of tip){const y=m.pos[3*i+1],z=m.pos[3*i+2];tw+=(y*R.vDisp[3*i+2]-z*R.vDisp[3*i+1])/(y*y+z*z);}tw/=tip.length;
  const fd=R.field,[NX,NY,NZ]=fd.n,ii=Math.round((L/2-fd.o[0])/fd.h);let sv=0,cn=0;for(let k=0;k<NZ;k++)for(let j=0;j<NY;j++){const y=fd.o[1]+j*fd.h,z=fd.o[2]+k*fd.h,rr=Math.hypot(y,z);if(rr>0.4*R0&&rr<R0-1.5*fd.h){sv+=fd.vm[(k*NY+j)*NX+ii]/(Math.sqrt(3)*T*rr/J);cn++;}}sv=sv/cn*vmT;
  console.log('torsion el',R.nEl,'it',R.iters,'ms',R.ms,'twist',tw.toExponential(4),'theory',th.toExponential(4),'interior vm/(√3·Tr/J)·τmax',sv.toFixed(1),'theory',vmT.toFixed(1),'applied',R.applied.map(v=>v.toFixed(3)).join(','));
  ok(Math.abs(tw/th-1)<0.06,'torsion twist '+pct(tw,th));ok(Math.abs(sv/vmT-1)<0.15,'torsion shear stress distribution '+pct(sv,vmT));ok(Math.hypot(...R.applied)<1e-6*T,'torque has no net force');}
if(!only||only==='roller'){const Lx=100,b=10,F=2000,{m,fid,base}=await part({type:'box',w:Lx,d:b,h:b,x:Lx/2,y:b/2,z:b/2}),sg=F/(b*b);
  const R=await runFEA({...base,mat:steel,supports:[{faces:[fid([-1,0,0])],type:'roller'},{faces:[fid([0,-1,0])],type:'roller'},{faces:[fid([0,0,-1])],type:'roller'}],loads:[{faces:[fid([1,0,0])],F:[F,0,0]}],res:20000});
  const ex=verts(m,x=>x>Lx-1e-6),ey=verts(m,(x,y)=>y>b-1e-6),ez=verts(m,(x,y,z)=>z>m.props.bbox.max[2]-1e-6);let ux=0,uy=0;for(const i of ex)ux+=R.vDisp[3*i]/ex.length;for(const i of ey)uy+=R.vDisp[3*i+1]/ey.length/2;for(const i of ez)uy+=R.vDisp[3*i+2]/ez.length/2;
  const fd=R.field,nd=(x,y,z)=>{const i=Math.round((x-fd.o[0])/fd.h),j=Math.round((y-fd.o[1])/fd.h),k=Math.round((z-fd.o[2])/fd.h);return(k*fd.n[1]+j)*fd.n[0]+i;},sv=fd.vm[nd(Lx/2,b/2,b/2)];
  console.log('roller ux',ux.toExponential(4),'theory',(sg*Lx/steel.E).toExponential(4),'lateral',uy.toExponential(4),'theory',(-steel.nu*sg*b/steel.E).toExponential(4),'vm centre',sv.toFixed(2),'theory',sg,'it',R.iters);
  ok(Math.abs(ux/(sg*Lx/steel.E)-1)<0.04,'roller axial stretch '+pct(ux,sg*Lx/steel.E));ok(Math.abs(uy/(-steel.nu*sg*b/steel.E)-1)<0.08,'roller free Poisson contraction (corner avg) '+pct(uy,-steel.nu*sg*b/steel.E));ok(Math.abs(sv/sg-1)<0.03,'uniaxial stress at centre '+pct(sv,sg));}
if(!only||only==='modal'){const L=100,a=10,{fid,base}=await part({type:'box',w:L,d:a,h:a,x:L/2}),I=a**4/12,A=a*a,rho=steel.rho*1e-12,c=Math.sqrt(steel.E*I/(rho*A*L**4)),f1=1.875104**2/(2*Math.PI)*c,f2=4.694091**2/(2*Math.PI)*c;
  const R=await runFEA({...base,type:'modal',mat:steel,fixed:[fid([-1,0,0])],modes:6,res:15000},(it,rel)=>{});
  console.log('modal cantilever el',R.nEl,'it',R.iters,'ms',R.ms,'f',R.freqs.map(v=>v.toFixed(1)).join(', '),'EB f1',f1.toFixed(1),'f2',f2.toFixed(1),'meff',R.modes[0].meff.map(v=>v.toFixed(3)).join(','),'mass kg',R.mass.toFixed(4));
  ok(Math.abs(R.freqs[0]/f1-1)<0.05&&Math.abs(R.freqs[1]/f1-1)<0.05,'cantilever f1 '+pct(R.freqs[0],f1));ok(Math.abs(R.freqs[2]/f2-1)<0.07,'cantilever second bending '+pct(R.freqs[2],f2));ok(Math.abs(R.mass/(7850*1e-5)-1)<0.03,'lumped mass '+pct(R.mass,0.0785));ok(R.modes[0].vDisp.length===base.pos.length&&R.modes[0].u.length===R.field.n[0]*R.field.n[1]*R.field.n[2],'mode shape arrays');
  const ff=await runFEA({...base,type:'modal',mat:steel,modes:4,res:15000}),fF=4.730041**2/(2*Math.PI)*c;
  console.log('modal free-free f',ff.freqs.map(v=>v.toFixed(1)).join(', '),'EB',fF.toFixed(1),'it',ff.iters,'ms',ff.ms);
  ok(ff.freqs[0]>1000&&Math.abs(ff.freqs[0]/fF-1)<0.07,'free-free first flexural, rigid modes deflated '+pct(ff.freqs[0],fF));}
if(!only||only==='thermal'){const L=100,a=10,{m,fid,base}=await part({type:'box',w:L,d:a,h:a,x:L/2}),k=167e-3,A=a*a,mid=verts(m,x=>Math.abs(x-50)<1e-6||Math.abs(x-25)<1e-6);
  const R=await runFEA({...base,type:'thermal',matKey:'al6061',temps:[{faces:[fid([-1,0,0])],T:100},{faces:[fid([1,0,0])],T:0}]}),q=k*A*100/L;
  let lin=0;for(const i of mid)lin=Math.max(lin,Math.abs(R.vT[i]-(100-m.pos[3*i])));
  console.log('thermal el',R.nEl,'it',R.iters,'ms',R.ms,'Q',R.Q.fixed.map(v=>v.toFixed(3)).join(','),'theory',q.toFixed(3),'max |T-linear| at x=25,50',lin.toFixed(3),'Tmin/max',R.Tmin.toFixed(2),R.Tmax.toFixed(2));
  ok(Math.abs(R.Q.fixed[0]/q-1)<0.04&&Math.abs(R.Q.fixed[0]+R.Q.fixed[1])<1e-3*q,'conduction heat flow '+pct(R.Q.fixed[0],q));ok(lin<1.5,'linear temperature profile');
  const F=await runFEA({...base,type:'thermal',mat:{k:167},temps:[{faces:[fid([-1,0,0])],T:20}],flux:[{faces:[fid([1,0,0])],Q:10}]}),tE=20+10*L/(k*A),end=verts(m,x=>x>L-1e-6);let te=0;for(const i of end)te+=F.vT[i]/end.length;
  console.log('flux end T',te.toFixed(2),'theory',tE.toFixed(2),'Q fixed',F.Q.fixed[0].toFixed(3),'balance',F.balance.toExponential(1));
  ok(Math.abs((te-20)/(tE-20)-1)<0.04,'flux end temperature '+pct(te-20,tE-20));ok(Math.abs(F.balance)<1e-3,'heat balance');
  const C=await runFEA({...base,type:'thermal',mat:{k:167},temps:[{faces:[fid([-1,0,0])],T:100}],conv:[{faces:[fid([1,0,0])],h:500,Tinf:20}]}),Qc=80/(L/(k*A)+1/(500e-6*A));
  console.log('convection Q',C.Q.conv[0].toFixed(4),'theory',(-Qc).toFixed(4),'fixed',C.Q.fixed[0].toFixed(4));
  ok(Math.abs(-C.Q.conv[0]/Qc-1)<0.04,'convection heat flow '+pct(-C.Q.conv[0],Qc));}
if(!only||only==='fallback'){const{fid,base}=await part({type:'box',w:20,d:10,h:10,x:10});const R=await runFEA({...base,mat:steel,fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[0,0,-10]}],res:4000,solver:'gpu'});ok(R.backend==='cpu'&&/unavailable/.test(R.gpuError||''),'gpu request falls back to cpu without WebGPU: '+R.gpuError);}
console.log(pass+' passed, '+fail+' failed');process.exitCode=fail?1:0;
