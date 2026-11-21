import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import {runFEA} from '../fea.js';
import {runMeshFEA} from '../fea_mesh.js';
import {snLife,fatigueSF,rainflow,miner,enLife} from '../fea_fatigue.js';
import {FATIGUE} from '../fatigue_data.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});
await K.init(oc);
const only=process.env.ONLY||'',rows=[];
const part=async feats=>{const r=await K.build({params:[],features:feats});const m=K.meshBody(r.body);K.resetCache();const fid=n=>m.faces.findIndex(q=>q.n&&Math.abs(q.n[0]-n[0])+Math.abs(q.n[1]-n[1])+Math.abs(q.n[2]-n[2])<1e-6);return{m,fid,base:{pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume}};};
const err=(a,b)=>b?((a/b-1)*100):NaN;
const row=(name,got,theory,unit)=>{const e=err(got,theory);rows.push({name,got,theory,unit,errPct:+e.toFixed(2)});console.log(name,got.toPrecision(5),theory.toPrecision(5),unit,'err',e.toFixed(2)+'%');};
const want=k=>!only||only.split(',').includes(k);
if(want('life')){
  const cyc=rainflow([0,3,1,4,0]),inner=cyc.filter(c=>c.count===1),outer=cyc.filter(c=>c.count===0.5);
  row('Rainflow inner cycle range',inner[0].range,2,'MPa');
  row('Rainflow outer cycle as two half-cycles',outer.reduce((a,c)=>a+c.count,0),1,'');
  const sn={S1:400,N1:1e3,S2:200,N2:1e6,sut:500,sy:400,knee:false};
  const seq=[-200,200,-200,200,-200],pack=miner(rainflow(seq),amp=>snLife(amp,sn));
  row('Miner damage of two fully reversed cycles',pack.D,2/snLife(200,sn),'');
  const E=200000,en={sf:900,b:-0.1,ef:0.4,c:-0.5},twoN=4e4,ea=(en.sf/E)*Math.pow(twoN,en.b)+en.ef*Math.pow(twoN,en.c);
  row('Coffin-Manson life inversion',enLife(ea,E,en,0),2e4,'cycles');
  row('Gerber safety factor',fatigueSF(100,50,sn,'gerber'),(-0.5+Math.sqrt(0.25+0.04))/0.02,'');
}
const steel={E:200000,nu:0.3,rho:7850,k:50,cp:480,cte:12,sy:370,sn:FATIGUE.steel1018};
if(want('cant')){
  const L=100,b=10,h=10,F=100,I=b*h**3/12,{m,fid,base}=await part([{id:'a',type:'box',w:L,d:b,h,x:L/2}]);
  const dT=F*L**3/(3*steel.E*I),sT=F*L*(h/2)/I;
  const R=await runFEA({...base,mat:steel,fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],res:16000,fields:1,probes:[[L,0,h]],path:{a:[8,0,h],b:[L,0,h],n:9}});
  let tip=0,n=0;for(let i=0;i<m.pos.length/3;i++)if(m.pos[3*i]>L-1e-6){tip+=-R.vDisp[3*i+2];n++;}tip/=n;
  row('Cantilever tip deflection',tip,dT,'mm');
  row('Cantilever reaction vs load',Math.abs(R.reaction[2]),F,'N');
  if(R.path){const ys=R.path.map(p=>p.vm||0);row('Cantilever outer-fiber path stress near the root vs My/I',ys[0],sT*0.92,'MPa');}
}
if(want('modal')){
  const L=100,a=10,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),I=a**4/12,A=a*a,rho=steel.rho*1e-12,c=Math.sqrt(steel.E*I/(rho*A*L**4)),f1=1.875104**2/(2*Math.PI)*c;
  const R=await runFEA({...base,type:'modal',mat:steel,fixed:[fid([-1,0,0])],modes:3,res:12000});
  row('Cantilever first bending frequency',R.freqs[0],f1,'Hz');
}
if(want('cond')){
  const L=100,a=10,{m,fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),k=50e-3,A=a*a,q=k*A*100/L;
  const R=await runFEA({...base,type:'thermal',mat:{k:50},temps:[{faces:[fid([-1,0,0])],T:100},{faces:[fid([1,0,0])],T:0}],res:12000});
  row('1D conduction heat flow',Math.abs(R.Q.fixed[0]),q,'W');
}
if(want('tstress')){
  const L=70,a=7,dT=100,alpha=12e-6,{m,fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),sig=steel.E*alpha*dT;
  const R=await runFEA({...base,type:'tstress',mat:steel,Tuniform:20+dT,Tref:20,supports:[{faces:[fid([-1,0,0])],type:'fixed'},{faces:[fid([1,0,0])],type:'fixed'}],loads:[],res:40000});
  const fd=R.field,at=(x,y,z)=>{const i=Math.round((x-fd.o[0])/fd.h),j=Math.round((y-fd.o[1])/fd.h),k=Math.round((z-fd.o[2])/fd.h);return fd.vm[(k*fd.n[1]+j)*fd.n[0]+i];};
  row('Constrained bar thermal stress at midspan',at(L/2,0,a/2),sig,'MPa');
  const F=await runFEA({...base,type:'tstress',mat:steel,Tuniform:20+dT,Tref:20,supports:[{faces:[fid([-1,0,0])],type:'fixed'}],loads:[],res:40000});
  let tip=0,n=0;for(let i=0;i<m.pos.length/3;i++)if(m.pos[3*i]>L-1e-6){tip+=F.vDisp[3*i];n++;}
  row('Free bar thermal expansion',tip/Math.max(n,1),alpha*dT*L,'mm');
}
if(want('lump')){
  const a=10,{fid,base}=await part([{id:'a',type:'box',w:a,d:a,h:a}]),h=50,Ti=20,Tinf=80,V=a**3,A=6*a*a,rho=7800,cp=480,tau=rho*1e-9*cp*V/(h*1e-6*A),t=tau,Tex=Tinf+(Ti-Tinf)*Math.exp(-1);
  const R=await runFEA({...base,type:'thermal',transient:true,dt:t/8,steps:8,T0:Ti,mat:{k:50,rho,cp},conv:[{faces:[fid([1,0,0])],h,Tinf},{faces:[fid([-1,0,0])],h,Tinf},{faces:[fid([0,1,0])],h,Tinf},{faces:[fid([0,-1,0])],h,Tinf},{faces:[fid([0,0,1])],h,Tinf},{faces:[fid([0,0,-1])],h,Tinf}],res:4000});
  row('Lumped cube, one time constant',R.Tmax,Tex,'C');
}
if(want('rad')){
  const L=20,a=10,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),k=50,eps=0.8,T1=400,Tinf=300,A=a*a;
  const qOf=T2=>k*1e-3*A*(T1-T2)/L,rad=T2=>eps*5.670374419e-8*A*1e-6*(T2**4-Tinf**4);
  let lo=Tinf,hi=T1;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(qOf(m)>rad(m))lo=m;else hi=m;}const T2=(lo+hi)/2;
  const R=await runFEA({...base,type:'thermal',mat:{k},temps:[{faces:[fid([-1,0,0])],T:T1}],rad:[{faces:[fid([1,0,0])],eps,Tinf}],res:8000});
  const end=R.Tmin;row('Rod with a radiating tip',end,T2,'C');
}
if(want('fatigue')){
  const a=10,L=40,s=250,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),F=s*a*a,probe=[[L/2,0,a/2]];
  const R=await runFEA({...base,type:'fatigue',mat:steel,supports:[{faces:[fid([-1,0,0])],type:'fixed'}],loads:[{faces:[fid([1,0,0])],F:[F,0,0]}],res:14000,corr:'goodman',fields:1,probes:probe});
  const lifeHand=snLife(R.stressMax,steel.sn),sfHand=fatigueSF(R.stressMax,0,steel.sn,'goodman'),sec=R.probes&&R.probes[0]?R.probes[0].vm:R.stressP99;
  row('Bolt pretension, section stress vs F/A',sec,s,'MPa');
  row('Fatigue life vs hand calc on the peak FEA stress',R.lifeMin,lifeHand,'cycles');
  row('Goodman safety factor vs hand calc',R.sfMin,sfHand,'');
  const sm=0.25*sec,Se=steel.sn.S2,asme=1/Math.sqrt((sec/Se)**2+(sm/steel.sn.sut)**2);row('ASME-elliptic safety factor',fatigueSF(sec,sm,steel.sn,'asme'),asme,'');
}
if(want('harm')){
  const L=100,a=10,F=20,{m,fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),I=a**4/12,dT=F*L**3/(3*steel.E*I);
  const R=await runFEA({...base,type:'harmonic',mat:steel,supports:[{faces:[fid([-1,0,0])],type:'fixed'}],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],modes:3,res:8000,zeta:0.02,f0:1,f1:20,nFreq:5,at:1});
  row('Harmonic amplitude at 1 Hz vs static tip',R.curve&&R.curve[0]?R.curve[0].amp:R.uMax,dT,'mm');
}
if(want('buckle')){
  const L=80,a=8,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),I=a**4/12,P=Math.PI**2*steel.E*I/(4*L*L);
  const errs=[];
  for(const res of [7000,14000,28000]){
    const R=await runFEA({...base,type:'buckle',mat:steel,fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[-P/7,0,0]}],res});
    errs.push([res,R.nEl,(R.Pcr/P-1)*100]);
    if(res===14000)row('Euler cantilever buckling load',R.Pcr,P,'N');
  }
  console.log('buckle convergence',errs.map(([r,n,e])=>r+':'+e.toFixed(2)+'%/'+n+'el').join(' '));
}
if(want('transient')){
  const L=100,a=10,F=20,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]);
  const R=await runFEA({...base,type:'transient',mat:steel,supports:[{faces:[fid([-1,0,0])],type:'fixed'}],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],modes:3,res:8000,zeta:0,steps:40});
  row('Undamped step-load dynamic factor',R.dlf,2,'');
}
if(want('combine')){
  const a=10,L=40,s1=40,s2=30,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),probe=[[L/2,0,a/2]],sup=[fid([-1,0,0])],face=[fid([1,0,0])];
  const go=F=>runFEA({...base,mat:steel,fixed:sup,loads:[{faces:face,F:[F,0,0]}],res:14000,fields:1,probes:probe});
  const A=await go(s1*a*a),B=await go(s2*a*a),C=await go((s1+s2)*a*a);
  row('Combined section stress vs F/A',C.probes[0].vm,s1+s2,'MPa');
  row('Load-case superposition vs one solve',A.probes[0].vm+B.probes[0].vm,C.probes[0].vm,'MPa');
}
if(want('hole')){
  const W=40,t=4,d=8,L=80,{fid,base}=await part([{id:'a',type:'box',w:L,d:W,h:t,x:L/2},{id:'h',type:'cylinder',r:d/2,h:t+4,z:-2,x:L/2,y:0,axis:'Z',op:'cut'}]);
  const F=400,sNom=F/((W-d)*t),Kt=2+(1-d/W)**3,sMax=Kt*sNom;
  const R=await runMeshFEA({...base,type:'static',mat:steel,mesh:'adaptive',supports:[{faces:[fid([-1,0,0])],type:'fixed'}],loads:[{faces:[fid([1,0,0])],F:[F,0,0]}],res:28000,fields:1});
  let peak=0;const P=R.skin&&R.skin.pos,V=R.skin&&R.skin.vm;if(P&&V)for(let i=0;i<V.length;i++){const x=P[3*i],y=P[3*i+1],rad=Math.hypot(x-L/2,y);if(Math.abs(rad-d/2)<1.4)peak=Math.max(peak,V[i]);}
  row('Plate with a hole, Kt at the hole surface',peak||R.vmP99,sMax,'MPa');
}

if(want('heat')){
  const L=40,a=7,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),k=50,Q=7,V=L*a*a,q=Q/V,kmm=k*1e-3,Tmax=q*L*L/(8*kmm);
  const R=await runFEA({...base,type:'thermal',mat:{k},temps:[{faces:[fid([-1,0,0])],T:0},{faces:[fid([1,0,0])],T:0}],Qvol:Q,res:14000});
  row('Internal heat generation, midspan temperature',R.Tmax,Tmax,'C');
}
if(want('psd')){
  const L=100,a=10,{fid,base}=await part([{id:'a',type:'box',w:L,d:a,h:a,x:L/2}]),I=a**4/12,A=a*a,rho=steel.rho*1e-12,c=Math.sqrt(steel.E*I/(rho*A*L**4)),f1=1.875104**2/(2*Math.PI)*c,S0=1,zeta=0.02;
  const R=await runFEA({...base,type:'psd',mat:steel,fixed:[fid([-1,0,0])],loads:[],res:12000,zeta,psd:S0});
  const wn=2*Math.PI*f1,hand=Math.sqrt(S0*Math.PI/(4*zeta*wn**3));
  row('Random vibration RMS from the first bending frequency',R.rms,hand,'mm');
}
if(want('contact')){
  const L=100,b=10,h=10,F=100,{m,fid,base}=await part([{id:'a',type:'box',w:L,d:b,h,x:L/2}]);
  const tipZ=R=>{let z=0,n=0;for(let i=0;i<m.pos.length/3;i++)if(m.pos[3*i]>L-1e-6){z+=R.vDisp[3*i+2];n++;}return z/n;};
  const R0=await runFEA({...base,mat:steel,supports:[{faces:[fid([-1,0,0])],type:'fixed'}],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],res:12000});
  const g=Math.abs(tipZ(R0))*0.4;
  const R2=await runFEA({...base,mat:steel,supports:[{faces:[fid([-1,0,0])],type:'fixed'},{faces:[fid([0,0,-1])],type:'stop',gap:g}],loads:[{faces:[fid([1,0,0])],F:[0,0,-F]}],res:12000});
  row('Frictionless stop, tip travel vs the gap',-tipZ(R2),g,'mm');
}
console.log('BENCH '+JSON.stringify(rows));
process.exit(0);
