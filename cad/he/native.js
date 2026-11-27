import {Worker,MessageChannel,receiveMessageOnPort} from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {setNative} from './host.js';
const TY={f64:Float64Array,f32:Float32Array,i32:Int32Array,u8:Uint8Array},KEEP=2,LIVE=[],warned=new Set();
export const SPEC={fea_grid:{calls:['fg_grid','fg_setup','fg_level','fg_dim','fg_om0','fg_sweeps','fg_matvec','fg_vcycle','fg_pcg','fg_rel','fg_views'],views:{1:'f32',2:'f64',3:'u8',4:'f64',10:'f64',11:'f64',12:'f64',13:'f64',14:'u8',15:'f64',16:'i32',17:'f64',20:'i32',21:'f64',22:'f32',23:'u8',24:'f64'},prog:'fg_prog',probe:'fg_rel'}};
const gone=new FinalizationRegistry(k=>k());
let hooked=false;
export const binOf=(name,dir=fileURLToPath(new URL('./native/',import.meta.url)))=>path.join(dir,name+'-'+process.platform+'-'+process.arch+(process.platform==='win32'?'.exe':''));
export function open(name,bin,prog){
  const S=SPEC[name],sab=new SharedArrayBuffer(4),F=new Int32Array(sab),{port1,port2}=new MessageChannel(),w=new Worker(new URL('./native_worker.js',import.meta.url),{workerData:{bin,sab,port:port2},transferList:[port2]});w.unref();
  let dead=null,pid=0;
  const me={kill:()=>{if(!dead)dead=name+': native engine released';try{port1.postMessage({k:1});}catch{}try{pid&&process.kill(pid,'SIGKILL');}catch{}setTimeout(()=>{port1.close();w.terminate();},50).unref();const i=LIVE.indexOf(me);i>=0&&LIVE.splice(i,1);}};
  const wait=()=>{for(;;){const s=Atomics.load(F,0),m=receiveMessageOnPort(port1);if(!m){Atomics.wait(F,0,s);continue;}const x=m.message;if(x.pid){pid=x.pid;continue;}if(x.p){prog&&prog(x.p[0],x.p[1]);continue;}if(x.e){const e=name+': native engine '+x.e;me.kill();dead=e;throw new Error(e);}return x;}};
  const rpc=(op,id,a=[],d)=>{if(dead)throw new Error(dead);const i=LIVE.indexOf(me);i>=0&&i<LIVE.length-1&&(LIVE.splice(i,1),LIVE.push(me));const h=new Float64Array(6);a.forEach((v,j)=>h[j+1]=+v);new Uint8Array(h.buffer).set([op,id]);port1.postMessage({h:h.buffer,d:d&&d.buffer},d?[h.buffer,d.buffer]:[h.buffer]);return wait();};
  const get=id=>{const T=TY[S.views[id]],r=rpc(103,id);if(!T||r.bad!=null)throw new Error(name+': unknown view '+id);return new T(r.d);};
  const put=(id,a)=>{const T=TY[S.views[id]];if(!T)throw new Error(name+': unknown view '+id);const c=a instanceof T?a.slice():T.from(a);if(rpc(119,id,[c.byteLength],c).r<0)throw new Error(name+': view '+id+' size mismatch');};
  const H={native:true,ex:Object.fromEntries(S.calls.map((n,i)=>[n,(...a)=>rpc(99,i,a).r])),get,put,into:(id,a)=>a.set(get(id)),v:get,close:()=>me.kill()};
  LIVE.push(me);gone.register(H,me.kill);hooked||(hooked=true,process.on('exit',()=>[...LIVE].forEach(k=>k.kill())));
  try{H.ex[S.probe]();}catch(e){warned.has(name)||(warned.add(name),process.stderr.write(e.message+'; using WebAssembly\n'));return null;}
  while(LIVE.length>KEEP)LIVE[0].kill();
  return H;
}
const MAN=['../engine.json','../api/engine.json'].map(f=>fileURLToPath(new URL(f,import.meta.url)));
export function register(dir,man=MAN.find(f=>fs.existsSync(f))){const on=[],files=man?JSON.parse(fs.readFileSync(man,'utf8')).files||{}:null;for(const name of Object.keys(SPEC)){const bin=binOf(name,dir);if(!fs.existsSync(bin))continue;if(files&&files['he/native/'+path.basename(bin)]!==createHash('sha256').update(fs.readFileSync(bin)).digest('hex')){warned.has(name)||(warned.add(name),process.stderr.write(name+': native engine does not match the engine manifest; using WebAssembly\n'));continue;}try{fs.accessSync(bin,fs.constants.X_OK);}catch{try{fs.chmodSync(bin,0o755);}catch{continue;}}setNative(name,env=>open(name,bin,env[SPEC[name].prog]));on.push(name);}return on;}
