import opencascade from './vendor/replicad_single.js';
import * as K from './kernel.js';
const blobs={};
let ghostMemo={shape:null,mesh:null};
let ready=null,last=null,lastDoc=null,lastScope={};
async function boot(){const oc=await opencascade({locateFile:()=>new URL('./vendor/replicad_single.wasm',import.meta.url).href,print:()=>{},printErr:()=>{}});await K.init(oc);return true;}
ready=boot();
const chain=[];let busy=false;
async function pump(){if(busy)return;busy=true;while(chain.length){const j=chain.shift();try{await j();}catch(e){}}busy=false;}
self.onmessage=e=>{
  const m=e.data;
  if(m.cmd==='build'){
    for(let i=chain.length-1;i>=0;i--)if(chain[i].kind==='build'){postMessage({id:chain[i].mid,ok:false,superseded:true});chain.splice(i,1);}
  }
  const job=async()=>{
    try{
      await ready;
      if(m.cmd==='ping')return postMessage({id:m.id,ok:true});
      if(m.cmd==='blob'){blobs[m.key]=m.buf;return postMessage({id:m.id,ok:true});}
      if(m.cmd==='build'){
        const r=await K.build(m.doc,{blobs,upto:m.upto});last=r.body;lastDoc=m.doc;lastScope=r.scope||{};
        const gi=m.ghost?m.doc.features.filter(f=>!f.suppressed).findIndex(f=>f.id===m.ghost):-1,gs=gi>0?K.shapeBefore(gi):null;
        if(gs&&ghostMemo.shape!==gs)ghostMemo={shape:gs,mesh:K.meshBody(gs,m.q||1)};
        const mesh=gs?ghostMemo.mesh:K.meshBody(r.body,m.q||1),preview=gs?K.meshBody(r.body,m.q||1):null;
        const tr=gs?(preview?[preview.pos.buffer,preview.nrm.buffer,preview.idx.buffer,preview.lines.buffer]:[]):mesh?[mesh.pos.buffer,mesh.nrm.buffer,mesh.idx.buffer,mesh.lines.buffer]:[];
        return postMessage({id:m.id,ok:true,mesh,preview,errors:r.errors,warnings:r.warnings,paramErrors:r.paramErrors,scope:r.scope,ms:r.ms,reused:r.reused},tr);
      }
      if(m.cmd==='export'){
        const b=K.exportBody(last,m.fmt,lastDoc&&lastDoc.units),buf=await b.arrayBuffer();
        return postMessage({id:m.id,ok:true,buf,mime:b.type||'application/octet-stream'},[buf]);
      }
      if(m.cmd==='probe'){
        const feats=(lastDoc&&lastDoc.features||[]).filter(f=>!f.suppressed),i=feats.findIndex(f=>f.id===m.fid),sh=i>=0?K.shapeBefore(i):last;
        if(!sh)return postMessage({id:m.id,ok:true,lines:[],n:0});
        const lines=K.edgePolylines(sh,m.sel,m.faces);return postMessage({id:m.id,ok:true,lines,n:lines.length});
      }
      if(m.cmd==='frame'||m.cmd==='which'){const feats=(lastDoc&&lastDoc.features||[]).filter(f=>!f.suppressed),i=m.fid?feats.findIndex(f=>f.id===m.fid):-1,sh=i>0?K.shapeBefore(i)||last:i===0?null:last;return postMessage({id:m.id,ok:true,r:m.cmd==="frame"?K.frameInfo(m.f,sh,lastScope):K.whichFeature(m.pt,feats.map(f=>f.id))});}
      if(m.cmd==='plugin'){const mod=await import(new URL(m.module,import.meta.url).href);const r=await mod[m.fn]({body:last,doc:lastDoc,K,blobs},m.args||{});return postMessage({id:m.id,ok:true,r},r&&r.transfer||[]);}
      throw new Error('unknown command '+m.cmd);
    }catch(err){postMessage({id:m.id,ok:false,error:String(err&&err.message||err)});}
  };
  job.kind=m.cmd;job.mid=m.id;chain.push(job);pump();
};
ready.then(()=>postMessage({id:0,ready:true})).catch(e=>postMessage({id:0,ready:false,error:String(e.message||e)}));
