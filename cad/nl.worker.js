import {runStudy} from './nl_study.js';
import {fitHyper} from './nl_lib.js';
const bufs=r=>{const s=new Set(),walk=o=>{if(!o||typeof o!=='object')return;if(ArrayBuffer.isView(o))return void s.add(o.buffer);for(const k in o)walk(o[k]);};walk(r);return[...s];};
self.onmessage=async e=>{const m=e.data;try{const r=m.cmd==='study'?await runStudy(m.st,q=>postMessage({id:m.id,progress:q})):m.cmd==='fit'?fitHyper(m.model,m.data):(()=>{throw new Error('unknown '+m.cmd);})();postMessage({id:m.id,ok:true,r},bufs(r));}catch(err){postMessage({id:m.id,ok:false,error:String(err.message||err)});}};
