import {bake,transfer} from './bake.js';
onmessage=e=>{const m=e.data;try{if(m.cmd==='transfer'){const r=transfer(m.pos,m.nrm,m.high,m.o||{});postMessage({ok:true,...r},[r.col.buffer]);return;}const r=bake(m.low,m.high,m.o||{});postMessage({ok:true,...r},Object.values(r.maps).map(x=>x.buffer));}catch(err){postMessage({ok:false,error:String(err&&err.message||err)});}};
