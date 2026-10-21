const DB='amnicad-pdm',J=s=>JSON.parse(s),pad=n=>String(n).padStart(12,'0');
let dbp=null;
const db=()=>dbp||(dbp=new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{for(const s of['log','chunk','kv'])r.result.createObjectStore(s);};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);}).catch(e=>{dbp=null;throw e;}));
const tx=async(st,mode,fn)=>{const d=await db();return new Promise((ok,no)=>{const t=d.transaction(st,mode);let out;Promise.resolve(fn(t.objectStore(st),v=>out=v)).catch(no);t.oncomplete=()=>ok(out);t.onerror=t.onabort=()=>no(t.error||new Error('Vault storage failed'));});};
const req=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
export const kvGet=k=>tx('kv','readonly',(s,o)=>req(s.get(k)).then(o));
export const kvSet=(k,v)=>tx('kv','readwrite',s=>{v==null?s.delete(k):s.put(v,k);});
export async function persist(){try{return navigator.storage&&navigator.storage.persist?await navigator.storage.persist():false;}catch{return false;}}
export async function usage(){try{const e=await navigator.storage.estimate();return{used:e.usage||0,quota:e.quota||0};}catch{return{used:0,quota:0};}}
export class LocalClient{
  constructor(vid,ses){this.server='local';this.vid=vid;this.s=ses;this.cache=new Map();this.listeners=new Set();this.live=true;try{this.bc=new BroadcastChannel('amnicad-pdm-'+vid);this.bc.onmessage=()=>this.sync().catch(()=>{});}catch{this.bc=null;}}
  entries(from=0){return tx('log','readonly',(s,o)=>req(s.getAll(IDBKeyRange.bound(this.vid+'|'+pad(from),this.vid+'|~'))).then(o));}
  async sync(){const es=await this.entries(this.s.next()),n=es.length?this.s.ingest(JSON.stringify(es)):0;n&&this.emit();return n;}
  on(f){this.listeners.add(f);return()=>this.listeners.delete(f);}
  emit(){for(const f of this.listeners)try{f();}catch(e){console.error(e);}}
  async loop(onState){onState&&onState('live');}
  stop(){this.live=false;}
  close(){this.stop();try{this.bc&&this.bc.close();}catch{}}
  async upload(ids){const L=[];for(const id of ids){const d=this.s.take_chunk(id);d&&L.push([id,d]);}L.length&&await tx('chunk','readwrite',s=>{for(const[id,d]of L)s.put(d,this.vid+'|'+id);});}
  async append(es){return tx('log','readwrite',s=>{for(const e of es)s.add(e,this.vid+'|'+pad(e.seq));});}
  async push(build){for(let i=0;i<7;i++){await this.sync();const b=J(build());if(b.errors&&b.errors.length){this.s.drop_pending();throw new Error(b.errors.join('\n'));}await this.upload(b.chunks||[]);if(!b.entries.length)return b;try{await this.append(b.entries);}catch(e){if(e&&e.name==='ConstraintError')continue;throw e;}this.s.ingest(JSON.stringify(b.entries));this.emit();this.bc&&this.bc.postMessage(1);return b;}throw new Error('The vault kept changing while saving. Try again.');}
  ops(ops){return this.push(()=>this.s.batch(JSON.stringify(ops),Date.now()));}
  ev(ev){return this.ops([{op:'ev',ev}]);}
  async seal(item,name,mime,bytes){const r=J(this.s.seal(item,name,mime,bytes));await this.upload(r.chunks);return r.file;}
  async file(f){const key=f.sha;if(this.cache.has(key))return this.cache.get(key);const p=(async()=>{const fj=JSON.stringify(f),ids=J(this.s.chunk_ids(fj)),got=await tx('chunk','readonly',(s,o)=>Promise.all(ids.map(id=>req(s.get(this.vid+'|'+id)))).then(o));ids.forEach((id,i)=>{if(!got[i])throw new Error('A file in this vault is missing from this browser');this.s.put_chunk(id,got[i]);});return this.s.open(fj);})();this.cache.set(key,p);if(this.cache.size>200)this.cache.delete(this.cache.keys().next().value);p.catch(()=>this.cache.delete(key));return p;}
  chunkIds(){return tx('chunk','readonly',(s,o)=>req(s.getAllKeys(IDBKeyRange.bound(this.vid+'|',this.vid+'|~'))).then(k=>o(k.map(x=>x.slice(this.vid.length+1)))));}
  chunk(id){return tx('chunk','readonly',(s,o)=>req(s.get(this.vid+'|'+id)).then(o));}
  async backup(){const es=await this.entries(0),ids=await this.chunkIds(),parts=[new TextEncoder().encode('AMNIVAULT1\n'+JSON.stringify({vid:this.vid,entries:es,chunks:ids.length})+'\n')];for(const id of ids){const d=await this.chunk(id),h=new Uint8Array(68);h.set(new TextEncoder().encode(id),0);new DataView(h.buffer).setUint32(64,d.length);parts.push(h,d);}return new Blob(parts,{type:'application/octet-stream'});}
  async drop(){await tx('log','readwrite',s=>s.delete(IDBKeyRange.bound(this.vid+'|',this.vid+'|~')));await tx('chunk','readwrite',s=>s.delete(IDBKeyRange.bound(this.vid+'|',this.vid+'|~')));}
}
export async function restore(buf){const u=new Uint8Array(buf),nl=u.indexOf(10),nl2=u.indexOf(10,nl+1),td=new TextDecoder();if(td.decode(u.subarray(0,nl))!=='AMNIVAULT1')throw new Error('This is not an Amni-CAD vault backup');const H=J(td.decode(u.subarray(nl+1,nl2))),dv=new DataView(u.buffer,u.byteOffset);let o=nl2+1;const C=[];while(o<u.length){const id=td.decode(u.subarray(o,o+64)),n=dv.getUint32(o+64);C.push([id,u.slice(o+68,o+68+n)]);o+=68+n;}
  await tx('log','readwrite',s=>{for(const e of H.entries)s.put(e,H.vid+'|'+pad(e.seq));});for(let i=0;i<C.length;i+=200)await tx('chunk','readwrite',s=>{for(const[id,d]of C.slice(i,i+200))s.put(d,H.vid+'|'+id);});return H.vid;}
export async function genesisOf(vid){const es=await tx('log','readonly',(s,o)=>req(s.get(vid+'|'+pad(0))).then(o));return es||null;}
