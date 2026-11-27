import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import {acousticRun,acFluid,acView} from '../acoustic.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});
await K.init(oc);
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean),want=k=>!ONLY.length||ONLY.includes(k);
const build=async features=>{const r=await K.build({units:'mm',params:[],features});if(!r.body)throw new Error(JSON.stringify(r.errors));return K.meshBody(r.body,0.2);};
const fid=(m,s)=>{const ax='XYZ'.indexOf(s[1]),sg=s[0]==='+'?1:-1;return m.faces.map((f,i)=>f.n&&f.n[ax]*sg>0.9&&Math.abs(f.c[ax]-(sg>0?m.props.bbox.max[ax]:m.props.bbox.min[ax]))<1e-3?i:-1).filter(i=>i>=0);};
const walls=(m,ax)=>m.faces.map((f,i)=>f.n&&Math.abs(f.n['XYZ'.indexOf(ax)])<0.1?i:-1).filter(i=>i>=0);
const run=(m,acoustic)=>acousticRun({type:'acoustic',pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,acoustic});
const c=acFluid({}).c,P0=2e-5,spl1=20*Math.log10(1/Math.SQRT2/P0);
if(want('cavity')){
  const Lx=300,Ly=190,Lz=130,m=await build([{id:'b',type:'box',w:Lx,d:Ly,h:Lz}]),t0=Date.now(),r=await run(m,{mode:'modes',modes:7,h:5});
  const ex=[];for(let l=0;l<5;l++)for(let p=0;p<5;p++)for(let q=0;q<5;q++)(l||p||q)&&ex.push(c/2*Math.hypot(l/(Lx*1e-3),p/(Ly*1e-3),q/(Lz*1e-3)));ex.sort((a,b)=>a-b);
  const err=r.modes.map((md,i)=>Math.abs(md.f/ex[i]-1));console.log('  cavity',JSON.stringify({cells:r.nCells,levels:r.levels,steps:r.steps,iters:r.iters,ms:Date.now()-t0,f:r.modes.map(x=>+x.f.toFixed(1)),ex:ex.slice(0,7).map(x=>+x.toFixed(1))}));
  ok(r.modes.length===7,'the rigid box gives the 7 requested modes',r.modes.length);
  ok(Math.max(...err)<0.02,'cavity mode frequencies match c/2 sqrt((l/Lx)^2+(m/Ly)^2+(n/Lz)^2) within 2 %',(100*Math.max(...err)).toFixed(3)+' % worst');
  ok(r.modes.every(md=>md.res<1e-4),'every mode converged',Math.max(...r.modes.map(md=>md.res)).toExponential(1));
  const f1=r.frames[0].val,ij=r.ac.IJ;let lo=0,hi=0,nl=0,nh=0;for(let k=0;k<r.nCells;k++){const i=ij[3*k];i<5?(lo+=f1[k],nl++):i>=57&&i<62?(hi+=f1[k],nh++):0;}ok(lo/nl>0.9&&hi/nh>0.9,'mode 1 peaks at both x ends of the box (the (1,0,0) shape)',(lo/nl).toFixed(3)+', '+(hi/nh).toFixed(3));
  const sk=await acView(r.ac,r.frames[1].val,0,-1,0);ok(sk.idx.length/3===2*2*(60*38+38*26+60*26)&&sk.vm.length===sk.pos.length/3,'the display surface of the whole box has 2 triangles per boundary cell face',sk.idx.length/3);
}
if(want('duct')){
  const m=await build([{id:'d',type:'box',w:400,d:40,h:40}]),t0=Date.now(),r=await run(m,{mode:'sweep',fmin:100,fmax:1500,points:8,h:5,bcs:[{kind:'source',faces:fid(m,'-X'),A:1},{kind:'anechoic',faces:fid(m,'+X')}]});
  console.log('  duct',JSON.stringify({cells:r.nCells,levels:r.levels,iters:r.iters,ms:Date.now()-t0,TL:r.TL.map(v=>+v.toFixed(3)),out:r.spl[1].map(v=>+v.toFixed(2))}));
  ok(r.converged,'every frequency converged',r.worst.toExponential(1));
  ok(r.TL.every(v=>Math.abs(v)<0.3),'a straight duct with an anechoic end has no transmission loss (within 0.3 dB)',Math.max(...r.TL.map(Math.abs)).toFixed(3)+' dB worst');
  ok(r.spl[1].every(v=>Math.abs(v-spl1)<0.3),'the outlet carries the 1 Pa incident wave (91.0 dB SPL)',r.spl[1][0].toFixed(2)+' dB');
  ok(r.ports[0].area_mm2===1600&&r.ports[1].area_mm2===1600,'source and outlet areas are the 40 x 40 mm duct section',r.ports.map(p=>p.area_mm2).join(', '));
}
if(want('open')){
  const L=400,m=await build([{id:'d',type:'box',w:L,d:40,h:40}]),fs=[120,180,214.5,300,380],r=await run(m,{mode:'sweep',fmin:120,fmax:380,points:5,h:5,bcs:[{kind:'source',faces:fid(m,'-X'),A:1},{kind:'open',faces:fid(m,'+X')}]});
  const th=r.f.map(f=>20*Math.log10(2*Math.abs(Math.sin(2*Math.PI*f/c*L*1e-3))/Math.SQRT2/P0)),d=r.spl[0].map((v,i)=>v-th[i]);console.log('  open',JSON.stringify({f:r.f,spl:r.spl[0].map(v=>+v.toFixed(2)),th:th.map(v=>+v.toFixed(2))}));
  ok(d.every(v=>Math.abs(v)<0.5),'an open far end gives the standing wave |p(0)| = 2 A |sin kL| at the source within 0.5 dB',Math.max(...d.map(Math.abs)).toFixed(3)+' dB worst');
  ok(r.TL===null,'transmission loss is left out when there is no anechoic end');
}
if(want('chamber')){
  const m=await build([{id:'a',type:'box',x:-150,w:100,d:40,h:40,z:40},{id:'b',type:'box',w:200,d:120,h:120},{id:'e',type:'box',x:150,w:100,d:40,h:40,z:40}]),L=0.2,mr=9,t0=Date.now(),r=await run(m,{mode:'sweep',fmin:100,fmax:1200,points:23,h:5,bcs:[{kind:'source',faces:fid(m,'-X'),A:1},{kind:'anechoic',faces:fid(m,'+X')}]});
  const th=r.f.map(f=>10*Math.log10(1+0.25*(mr-1/mr)**2*Math.sin(2*Math.PI*f/c*L)**2)),d=r.TL.map((v,i)=>v-th[i]),pk=r.TL.indexOf(Math.max(...r.TL.slice(0,12)));
  console.log('  chamber',JSON.stringify({cells:r.nCells,levels:r.levels,iters:r.iters,ms:Date.now()-t0,f:r.f.map(v=>+v.toFixed(0)),TL:r.TL.map(v=>+v.toFixed(2)),th:th.map(v=>+v.toFixed(2))}));
  ok(r.converged,'every frequency converged',r.worst.toExponential(1));
  ok(Math.abs(r.TL[pk]-13.17)<1&&Math.abs(r.f[pk]/(c/(4*L))-1)<0.12,'the expansion chamber peaks near 13.2 dB at a quarter wave (c/4L = '+(c/(4*L)).toFixed(0)+' Hz)',r.TL[pk].toFixed(2)+' dB at '+r.f[pk].toFixed(0)+' Hz');
  ok(Math.sqrt(d.reduce((s,v)=>s+v*v,0)/d.length)<1.2,'the transmission loss curve follows 10 log10(1 + (m - 1/m)^2 sin^2(kL) / 4) below cut-on (RMS within 1.2 dB)',Math.sqrt(d.reduce((s,v)=>s+v*v,0)/d.length).toFixed(3)+' dB RMS');
  ok(r.frames.length===23&&r.skin.idx.length>0&&r.skin.vm.length===r.skin.pos.length/3,'every frequency keeps a field and the cut view has a surface',r.frames.length+' frames, '+r.skin.idx.length/3+' triangles');
}
if(want('lining')){
  const m=await build([{id:'d',type:'box',w:400,d:40,h:40}]),mk=al=>run(m,{mode:'sweep',fmin:400,fmax:1200,points:3,h:5,bcs:[{kind:'source',faces:fid(m,'-X'),A:1},{kind:'anechoic',faces:fid(m,'+X')},{kind:'lining',faces:walls(m,'X'),alpha:al}]}),lo=await mk(0.3),hi=await mk(0.9);
  console.log('  lining',JSON.stringify({lo:lo.TL.map(v=>+v.toFixed(2)),hi:hi.TL.map(v=>+v.toFixed(2))}));
  ok(lo.TL.every(v=>v>0.2)&&hi.TL.every((v,i)=>v>lo.TL[i]),'absorbing walls add transmission loss, more with a higher absorption coefficient',lo.TL[1].toFixed(2)+' dB at 0.3, '+hi.TL[1].toFixed(2)+' dB at 0.9');
}
if(want('passage')){
  const m=await build([{id:'b',type:'box',w:400,d:100,h:100},{id:'h',type:'hole',plane:'YZ',offset:200,d:40,thru:true,pts:[[0,50]]}]),r=await run(m,{mode:'sweep',region:'passage',fmin:200,fmax:1200,points:4,h:5,bcs:[{kind:'source',faces:fid(m,'-X'),A:1},{kind:'anechoic',faces:fid(m,'+X')}]});
  console.log('  passage',JSON.stringify({cells:r.nCells,TL:r.TL.map(v=>+v.toFixed(3)),area:r.ports.map(p=>p.area_mm2),warn:r.warn}));
  ok(Math.abs(r.nCells-80*Math.PI*20*20/25)<0.12*80*Math.PI*20*20/25,'the air is the 40 mm bore through the block, not the space around it',r.nCells);
  ok(r.TL.every(v=>Math.abs(v)<0.5),'a straight bore with an anechoic end has no transmission loss (within 0.5 dB)',Math.max(...r.TL.map(Math.abs)).toFixed(3)+' dB worst');
}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
