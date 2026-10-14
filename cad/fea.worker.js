import {runFEA,wallThickness} from './fea.js';
self.onmessage=e=>{const m=e.data;try{
  if(m.cmd==='fea'){const r=runFEA(m.inp,(it,rel)=>postMessage({id:m.id,progress:{it,rel}}));postMessage({id:m.id,ok:true,r},[r.vStress.buffer,r.vDisp.buffer,r.field.vm.buffer,r.field.u.buffer]);}
  else if(m.cmd==='thickness')postMessage({id:m.id,ok:true,r:wallThickness(m.inp)});
  else throw new Error('unknown '+m.cmd);
}catch(err){postMessage({id:m.id,ok:false,error:String(err.message||err)});}};
