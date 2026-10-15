import init,{Session} from './pkg/vault_core.js';
export const ready=init();
export {Session};
const J=s=>JSON.parse(s);
export class ApiError extends Error{constructor(m,code,body){super(m);this.code=code;this.body=body;}}
export async function raw(server,path,{method='GET',body,headers={}}={}){const r=await fetch(server.replace(/\/$/,'')+path,{method,body,headers,cache:'no-store'});const t=r.headers.get('content-type')||'';const b=t.includes('json')?await r.json():new Uint8Array(await r.arrayBuffer());if(!r.ok)throw new ApiError(b&&b.error||('HTTP '+r.status),r.status,b);return b;}
export class Client{
  constructor(server,vid,ses){this.server=server.replace(/\/$/,'');this.vid=vid;this.s=ses;this.cache=new Map();this.listeners=new Set();this.live=false;}
  req(method,path,body,headers={}){return raw(this.server,path,{method,body,headers:{'x-av-auth':this.s.auth(this.vid,method,path,Date.now()),...headers}});}
  async sync(wait=0){const r=await this.req('GET',`/api/v/${this.vid}/log?from=${this.s.next()}${wait?'&wait='+wait:''}`);const n=r.entries.length?this.s.ingest(JSON.stringify(r.entries)):0;if(n)this.emit();return n;}
  on(f){this.listeners.add(f);return()=>this.listeners.delete(f);}
  emit(){for(const f of this.listeners)try{f();}catch(e){console.error(e);}}
  async loop(onState){this.live=true;let back=1000;while(this.live){try{onState&&onState('live');await this.sync(25);back=1000;}catch(e){if(e.code===403||e.code===401){onState&&onState('denied',e);this.live=false;return;}onState&&onState('offline',e);await new Promise(r=>setTimeout(r,back));back=Math.min(back*2,30000);}}}
  stop(){this.live=false;}
  async upload(ids,progress){if(!ids.length)return;const {missing}=await this.req('POST',`/api/v/${this.vid}/have`,JSON.stringify(ids),{'content-type':'application/json'});let done=0;const q=[...missing];const work=async()=>{while(q.length){const id=q.shift(),d=this.s.take_chunk(id);if(!d)continue;await this.req('PUT',`/api/v/${this.vid}/c/${id}`,d,{'content-type':'application/octet-stream'});progress&&progress(++done,missing.length);}};await Promise.all([0,1,2,3].map(work));for(const id of ids)this.s.take_chunk(id);}
  async push(build,progress){for(let i=0;i<6;i++){await this.sync(0);const b=J(build());if(b.errors&&b.errors.length){this.s.drop_pending();throw new ApiError(b.errors.join('\n'),422);}await this.upload(b.chunks||[],progress);if(!b.entries.length)return b;try{await this.req('POST',`/api/v/${this.vid}/log`,JSON.stringify(b.entries),{'content-type':'application/json'});this.s.ingest(JSON.stringify(b.entries));this.emit();return b;}catch(e){if(e.code!==409)throw e;}}throw new ApiError('The vault kept changing while saving. Try again.',409);}
  ops(ops){return this.push(()=>this.s.batch(JSON.stringify(ops),Date.now()));}
  ev(ev){return this.ops([{op:'ev',ev}]);}
  async seal(item,name,mime,bytes){const r=J(this.s.seal(item,name,mime,bytes));await this.upload(r.chunks);return r.file;}
  async file(f){const key=f.sha;if(this.cache.has(key))return this.cache.get(key);const p=(async()=>{const fj=JSON.stringify(f),ids=J(this.s.chunk_ids(fj)),q=[...ids];const work=async()=>{while(q.length){const id=q.shift();this.s.put_chunk(id,await this.req('GET',`/api/v/${this.vid}/c/${id}`));}};await Promise.all([0,1,2,3].map(work));return this.s.open(fj);})();this.cache.set(key,p);if(this.cache.size>200)this.cache.delete(this.cache.keys().next().value);p.catch(()=>this.cache.delete(key));return p;}
}
let W=null;
export function cad(){if(W)return W;const base=new URL(document.querySelector('meta[name=amni-cad]')?.content||'./cad/',location.href);const w=new Worker(new URL('cad.worker.js',base),{type:'module'});let id=1;const pend=new Map();const ready=new Promise((ok,no)=>{pend.set(0,{ok:m=>m.ready?ok(true):no(new Error(m.error||'CAD kernel failed to start')),no});});
  w.onmessage=e=>{const m=e.data,p=pend.get(m.id);if(!p)return;pend.delete(m.id);m.id===0?p.ok(m):m.ok?p.ok(m):p.no(new Error(m.error||'worker error'));};w.onerror=e=>{for(const p of pend.values())p.no(new Error(e.message||'CAD kernel unavailable'));pend.clear();W=null;};
  const call=(cmd,extra={},tr=[])=>new Promise((ok,no)=>{const i=id++;pend.set(i,{ok,no});w.postMessage({id:i,cmd,...extra},tr);});
  const plugin=new URL('./plugin.js',location.href).href;
  W={ready,async solids(bytes,fmt){await ready;await call('blob',{key:'vault',buf:bytes});return(await call('plugin',{module:plugin,fn:'solids',args:{blob:'vault',fmt}})).r.solids;},async quotes(indices,req,qtys={}){await ready;return(await call('plugin',{module:plugin,fn:'quotes',args:{indices,req,qtys}})).r;}};
  ready.catch(()=>{W=null;});return W;}
export function matchSolids(solids,parts){return solids.map(s=>{let best=null;parts.forEach((p,i)=>{const e=p.sig&&p.sig.ext;if(!e)return;const err=Math.max(...[0,1,2].map(k=>Math.abs(e[k]-s.ext[k])/Math.max(e[k],s.ext[k],.5)));if(!best||err<best.err)best={i,err};});return best&&best.err<.06?best.i:-1;});}
