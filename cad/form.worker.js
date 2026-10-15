import {mesh,bake} from './form_sdf.js';
let pend=null,busy=false;
const run=()=>{if(busy||!pend)return;const m=pend;pend=null;busy=true;try{const t0=performance.now(),r=mesh(m.text,m.res),bk=bake(m.text);r.ms=performance.now()-t0;const tr=[r.pos.buffer,r.nrm.buffer,r.idx.buffer,r.col.buffer,r.mat.buffer,...(r.skin?[r.skin.joints.buffer,r.skin.weights.buffer]:[])];postMessage({id:m.id,ok:true,mesh:r,bake:bk},tr);}catch(e){postMessage({id:m.id,ok:false,error:String(e&&e.message||e)});}busy=false;setTimeout(run,0);};
onmessage=e=>{const m=e.data;if(pend)postMessage({id:pend.id,ok:false,superseded:true});pend=m;run();};
