import * as MF from './moldflow.js';
let M=null,key='';
const bufs=r=>{const s=new Set(),walk=o=>{if(!o||typeof o!=='object')return;if(ArrayBuffer.isView(o))return void s.add(o.buffer);for(const k in o)walk(o[k]);};walk(r);return[...s];};
self.onmessage=e=>{const m=e.data,pg=q=>postMessage({id:m.id,progress:q});try{
  if(m.cmd!=='mold')throw new Error('unknown '+m.cmd);const{mesh,cfg,gates,suggest}=m.inp;
  if(!M||key!==m.inp.key){M=MF.prep(mesh,pg);key=m.inp.key;}
  const mat=cfg.custom||MF.MATERIALS[cfg.matKey];if(!mat||mat.noData)throw new Error(mat&&mat.noData||'Unknown material');
  const c={...cfg,mat},gn=gates.map(p=>MF.nearestNode(M,p)).filter(g=>g>=0);let sg=null;
  if(suggest||!gn.length){sg=MF.suggestGates(M,{...c,gates:[]},pg);if(!gn.length)gn.push(sg.best.node);}
  const r=MF.simulate(M,{...c,gates:gn},pg);
  const out={r,sg:sg&&{best:sg.best,cand:sg.cand.map(x=>({...x,p:x.p})),pos:sg.cand.map(x=>Array.from(M.P.slice(3*x.node,3*x.node+3)))},gates:gn,gpos:gn.map(g=>Array.from(M.P.slice(3*g,3*g+3))),mesh:{P:Float32Array.from(M.P),T:Int32Array.from(M.T),hn:Float32Array.from(M.hn),La:M.La,Lb:M.Lb,stats:M.stats,nv:M.nv,nt:M.nt,ncon:M.ncon,vscale:M.vscale,vcad:M.vcad}};
  postMessage({id:m.id,ok:true,out},bufs(out.r).concat([out.mesh.P.buffer,out.mesh.T.buffer,out.mesh.hn.buffer]));
}catch(err){postMessage({id:m.id,ok:false,error:String(err&&err.message||err)});}};
