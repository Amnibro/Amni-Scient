import {solve} from './mold_core.js';
const C={};
const bufs=r=>{const s=new Set(),walk=o=>{if(!o||typeof o!=='object')return;if(ArrayBuffer.isView(o))return void s.add(o.buffer);for(const k in o)walk(o[k]);};walk(r);return[...s];};
self.onmessage=e=>{const m=e.data,pg=q=>postMessage({id:m.id,progress:q});try{
  if(m.cmd!=='mold')throw new Error('unknown '+m.cmd);const out=solve(m.inp,pg,C);
  postMessage({id:m.id,ok:true,out},bufs(out.r).concat([out.mesh.P.buffer,out.mesh.T.buffer,out.mesh.hn.buffer]));
}catch(err){postMessage({id:m.id,ok:false,error:String(err&&err.message||err)});}};
