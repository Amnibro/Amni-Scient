import {runFEA,wallThickness} from './fea.js';
const bufs=r=>{const s=new Set(),walk=o=>{if(!o||typeof o!=='object')return;if(ArrayBuffer.isView(o))return void s.add(o.buffer);for(const k in o)walk(o[k]);};walk(r);return[...s];};
const handle=async m=>{try{
  if(m.cmd==='fea'){const r=await runFEA(m.inp,(it,rel,phase)=>postMessage({id:m.id,progress:{it,rel,phase}}));postMessage({id:m.id,ok:true,r},bufs(r));}
  else if(m.cmd==='thickness')postMessage({id:m.id,ok:true,r:wallThickness(m.inp)});
  else throw new Error('unknown '+m.cmd);
}catch(err){postMessage({id:m.id,ok:false,error:String(err.message||err)});}};
let queue=Promise.resolve();self.onmessage=e=>{queue=queue.then(()=>handle(e.data));};
