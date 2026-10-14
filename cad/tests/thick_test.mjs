import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {wallThickness} from '../fea.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const r=await K.build({params:[],features:[{id:'a',type:'box',w:60,d:40,h:30},{id:'b',type:'shell',t:2,faces:{side:'+Z'}}]});const m=K.meshBody(r.body);
const t=wallThickness({pos:m.pos,idx:m.idx,bbox:m.props.bbox,volume:m.props.volume,res:80000});console.log('min wall',t.minT.toFixed(2),'(true 2.00) h',t.h.toFixed(2),'at',t.at.map(v=>v.toFixed(1)).join(','));
process.exitCode=Math.abs(t.minT-2)<t.h*1.01?0:1;
