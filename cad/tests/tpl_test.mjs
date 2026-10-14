import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {TEMPLATES,TEMPLATES_IN} from '../templates.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
let bad=0;for(const t of[...TEMPLATES,...TEMPLATES_IN]){K.resetCache();const t0=Date.now(),r=await K.build(t.doc),m=K.meshBody(r.body);if(r.errors.length)bad++;console.log((t.key+' '+t.doc.units).padEnd(13),'ms',String(Date.now()-t0).padStart(4),'vol',(m.props.volume*(t.doc.units==='in'?16387.064:1)).toFixed(0).padStart(7),'mm³','faces',m.props.nFaces,'solids',m.props.nSolids,r.errors.length?'ERR '+JSON.stringify(r.errors):'');}
process.exitCode=bad?1:0;
