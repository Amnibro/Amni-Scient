import opencascade from '../vendor/replicad_single.js';import * as K from '../kernel.js';import {toOBJ,toPLY,toGLB,to3MF} from '../exporters.js';import {execFileSync} from 'node:child_process';import {writeFileSync,mkdtempSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});await K.init(oc);
const r=await K.build({params:[],features:[{id:'a',type:'box',w:20,d:10,h:5},{id:'b',type:'hole',plane:'XY',offset:5,pts:[[0,0]],d:4}]}),m=K.meshBody(r.body),dir=mkdtempSync(join(process.env.TMPDIR||tmpdir(),'exp'));let bad=0;
for(const[n,f]of[['obj',toOBJ],['ply',toPLY],['glb',toGLB],['3mf',to3MF]]){const b=Buffer.from(await f(m,'Test part').arrayBuffer());writeFileSync(join(dir,'t.'+n),b);console.log(n,b.length,'bytes');}
const g=Buffer.from(await toGLB(m,'t').arrayBuffer());if(g.readUInt32LE(0)!==0x46546C67||g.readUInt32LE(8)!==g.length){bad++;console.log('glb header bad');}
try{const out=execFileSync('python3',['-c','import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip(),len(z.read("3D/3dmodel.model")))',join(dir,'t.3mf')]).toString().trim();console.log('3mf zip',out);if(!out.startsWith('None'))bad++;}catch(e){bad++;console.log('3mf zip bad',e.message);}
const ply=Buffer.from(await toPLY(m,'t').arrayBuffer()).toString('latin1');const nv=+ply.match(/element vertex (\d+)/)[1],nf=+ply.match(/element face (\d+)/)[1];console.log('ply welded verts',nv,'faces',nf,'euler',nv-nf*3/2+nf);
const s=await K.exportBody(r.body,'step').text();console.log('step',s.length,s.includes('ISO-10303-21'));
console.log(bad?'FAILED':'exports ok');process.exitCode=bad;
