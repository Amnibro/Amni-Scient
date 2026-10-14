import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {runCFD,FLUIDS} from '../cfd.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const r=await K.build({params:[],features:[{id:'s',type:'sphere',r:10}]});const m=K.meshBody(r.body,0.5);
const D=0.02,Re=+(process.argv[2]||100),U=Re*FLUIDS.air.nu/D,cells=+(process.argv[3]||120000);
const t0=Date.now();const R=await runCFD({pos:m.pos,idx:m.idx,bbox:m.props.bbox,cells,dir:'+X',fluid:'air',speed:U,gpu:false,flows:+(process.argv[4]||1.6)},p=>{if(p.step%1000===0)console.log(' step',p.step,'/',p.steps,'cd',p.cd.toFixed(3));});
console.log('Re',R.Re.toFixed(0),'grid',JSON.stringify(R.grid),'D cells',(20/R.grid.h).toFixed(1),'tau',R.tau.toFixed(4),'Cd',R.cd.toFixed(3),'raw',R.cdRaw.toFixed(3),'block',(R.block*100).toFixed(1)+'%','Cl',R.cl.toFixed(3),'drag N',R.drag.toExponential(2),'ms',Date.now()-t0);
