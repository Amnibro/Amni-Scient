import {runCFD} from './cfd.js';
import {runInternal} from './flow_lbm.js';
let stop=false;
self.onmessage=async e=>{const m=e.data;if(m.cmd==='stop'){stop=true;return;}if(m.cmd!=='cfd'&&m.cmd!=='iflow')return;stop=false;try{const r=await(m.cmd==='iflow'?runInternal:runCFD)(m.inp,p=>postMessage({id:m.id,progress:p}),()=>stop);postMessage({id:m.id,ok:true,r},[r.cp.buffer,r.sp.buffer,r.vel.buffer,r.solid.buffer]);}catch(err){postMessage({id:m.id,ok:false,error:String(err.message||err)});}};
