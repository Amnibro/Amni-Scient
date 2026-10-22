import * as R from './vendor/replicad.js';
import {THREADSTD,HOLESTD,HOLESTD_IN} from './standards.js';
import {MATS,matBase} from './schema.js';
export const CAMV='e779f30eb7';
const V=v=>[v.x,v.y,v.z],P=p=>[p.X(),p.Y(),p.Z()],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l];};
const safe=(f,d=null)=>{try{return f();}catch{return d;}},d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),TAU=Math.PI*2;
const QMAP={al6061:['al6061','al6061'],al7075:['al7075','al7075'],steel1018:['steel-cr','st1018'],steel4140:['steel-cr','st4140'],ss304:['ss304','ss303'],ss316:['ss316','ss303'],ti64:['ti-gr2','ti-gr2'],brass:['brass260','brass360'],pla:['pla','pla'],petg:['petg','petg'],abs:['asa','asa'],nylon:['pa12-mjf','pa12-mjf'],pc:['pc','asa'],maple:['ply-bb','ply-bb'],birch:['ply-bb','ply-bb'],whiteoak:['ply-bb','ply-bb'],walnut:['ply-bb','ply-bb'],ash:['ply-bb','ply-bb'],mahogany:['ply-bb','ply-bb'],sitka:['ply-bb','ply-bb'],pine:['ply-bb','ply-bb'],bamboo:['ply-bb','ply-bb'],balticply:['ply-bb','ply-bb'],mdf:['mdf','mdf'],g10:['g10','g10'],p20:['steel-cr','st4140'],h13:['steel-cr','st4140'],s7:['steel-cr','st4140'],d2:['steel-cr','st4140'],a2:['steel-cr','st4140'],o1:['steel-cr','st4140'],m2:['steel-cr','st4140'],ss420m:['ss304','ss303'],becu:['cu110','cu110'],cfrp:null,fiberglass:null,carbide:null},NOSTOCK={cfrp:'Carbon fiber plate',fiberglass:'Fiberglass',carbide:'Tungsten carbide'};
export const quoteMat=(key,sheet)=>{const M=MATS[key],via=!QMAP[key]&&M&&M.q===undefined&&QMAP[matBase(key)],p=QMAP[key]||(M&&M.q!==undefined?M.q:via);return p?{id:sheet?p[0]:p[1],...(via?{note:'There is no exact stock for '+M.n+', so it is priced with the shop catalog stock used for '+MATS[matBase(key)].n+'.'}:{})}:{id:'',note:(NOSTOCK[key]||(M?M.n:'This material'))+' has no stock in the shop catalog, so it cannot be priced. Pick a stocked material in the Make tab, or send the part out for a custom quote.'};};
let AC=null,memo={body:null,doc:null,a:null,F:null};
export function camLib(){return AC||(AC=(async()=>{const m=await import('./vendor/amni-cam/amni_cam.js?v='+CAMV),u=new URL('./vendor/amni-cam/amni_cam_bg.wasm?v='+CAMV,import.meta.url);await m.default({module_or_path:u.protocol==='file:'?(await import('node:fs')).readFileSync(u):u});return m;})());}
export function cylOf(f){return safe(()=>{const ad=f._geomAdaptor(),c=ad.Cylinder(),ax=c.Axis(),o={r:c.Radius(),p:P(ax.Location()),d:nrm(P(ax.Direction()))};safe(()=>ad.delete());return o;});}
export function circOf(e){return safe(()=>{const ad=e._geomAdaptor(),c=ad.Circle(),o={c:P(c.Location()),r:c.Radius()};safe(()=>ad.delete());return o;});}
function edgeSegs(e,pr,sz){const a=V(e.pointAt(0)),b=V(e.pointAt(1)),t=e.geomType,A=pr(a),B=pr(b);
  if(t==='LINE')return[[A,B,0]];
  if(t==='CIRCLE'){const M=pr(V(e.pointAt(0.5))),Q=pr(V(e.pointAt(0.25))),ci=circOf(e);if(d2(A,B)<sz*1e-6){const s=Math.sign((Q[0]-A[0])*(M[1]-A[1])-(Q[1]-A[1])*(M[0]-A[0]))||1;return[[A,M,s],[M,A,s]];}
    const c=ci?pr(ci.c):M,ang=(p,q)=>{const u=[p[0]-c[0],p[1]-c[1]],v=[q[0]-c[0],q[1]-c[1]];return Math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]);},sw=ang(A,M)+ang(M,B);return[[A,B,Math.tan(sw/4)]];}
  const n=Math.max(8,Math.min(200,Math.ceil(safe(()=>e.length,sz)/Math.max(sz/300,1e-3)))),pts=[];for(let k=0;k<=n;k++)pts.push(pr(V(e.pointAt(k/n))));return pts.slice(1).map((q,i)=>[pts[i],q,0]);}
function chain(segLists,tol){const left=segLists.filter(s=>s.length),loops=[];while(left.length){let cur=left.shift();const loop=[...cur];let guard=0;while(left.length&&guard++<5000){const end=loop[loop.length-1][1];if(d2(end,loop[0][0])<tol)break;let bi=-1,rev=false,bd=Infinity;left.forEach((s,i)=>{const da=d2(s[0][0],end),db=d2(s[s.length-1][1],end);if(da<bd){bd=da;bi=i;rev=false;}if(db<bd){bd=db;bi=i;rev=true;}});if(bi<0||bd>tol*50)break;let s=left.splice(bi,1)[0];if(rev)s=s.slice().reverse().map(q=>[q[1],q[0],-q[2]]);loop.push(...s);}loops.push(loop.map(q=>[q[0][0],q[0][1],q[2]]));}return loops;}
export function analyzeBody(body,doc){
  if(memo.body===body&&memo.doc===doc&&memo.a)return memo.a;
  const k=doc&&doc.units==='in'?25.4:1,bb=body.boundingBox.bounds,size=Math.hypot(...sub(bb[1],bb[0]))||1,tol=size*1e-5+1e-7;
  const vol=Math.abs(safe(()=>R.measureVolume(body),0)),area=safe(()=>R.measureArea(body),0);
  const F=body.faces.map((f,i)=>{const t=f.geomType,c0=safe(()=>V(f.center),[0,0,0]),sp=t==='PLANE'?null:safe(()=>f.pointOnSurface(0.5,0.5)),c=sp?V(sp):c0,n=safe(()=>nrm(V(f.normalAt(sp||f.center)))),eh=safe(()=>f.edges.map(e=>e.hashCode),[]);return{f,i,t,c,n,cyl:t==='CYLINDRE'?cylOf(f):null,ar:safe(()=>R.measureArea(f.clone()),0),eh:new Set(eh),closedCirc:safe(()=>f.edges.some(e=>e.geomType==='CIRCLE'&&e.isClosed),false),h:f.hashCode};});
  const msh=safe(()=>body.mesh({tolerance:Math.max(size*4e-4,0.002),angularTolerance:0.2}),null),fn=new Map();
  if(msh){const vn=msh.normals,tri=msh.triangles,vp=msh.vertices;for(const g of msh.faceGroups){const s=new Set();for(let q=g.start;q<g.start+g.count;q++)s.add(tri[q]);fn.set(g.faceId,[...s].map(v=>[vn[3*v],vn[3*v+1],vn[3*v+2]]));}}
  const planes=F.filter(q=>q.t==='PLANE'&&q.n),big=planes.reduce((a,b)=>!a||b.ar>a.ar?b:a,null);
  let sheet=null,frame=null,plate=null;
  if(big){const n=big.n,caps=planes.filter(q=>Math.abs(Math.abs(dot(q.n,n))-1)<1e-4),offs=caps.map(q=>dot(q.c,n)),top=Math.max(...offs),bot=Math.min(...offs),t=top-bot,capSet=new Set(caps.map(q=>q.i));
    const capsOK=offs.every(o=>Math.abs(o-top)<tol*10||Math.abs(o-bot)<tol*10),walls=F.filter(q=>!capSet.has(q.i)),wallsOK=walls.every(q=>{const ns=fn.get(q.h);return ns?ns.every(v=>Math.abs(dot(v,n))<0.03):q.t==='PLANE'&&q.n&&Math.abs(dot(q.n,n))<1e-3;});
    const topA=caps.filter((q,i)=>Math.abs(offs[i]-top)<tol*10).reduce((s,q)=>s+q.ar,0),botA=caps.filter((q,i)=>Math.abs(offs[i]-bot)<tol*10).reduce((s,q)=>s+q.ar,0);
    const fl=(fs,nn,o)=>{const ref=Math.abs(nn[2])>0.9?[1,0,0]:[0,0,1],ex=Math.abs(nn[2])>0.9?nrm(sub(ref,nn.map(v=>v*dot(ref,nn)))):nrm(cross(ref,nn)),ey=cross(nn,ex),pr=p=>{const d=sub(p,o);return[dot(d,ex)*k,dot(d,ey)*k];},loops=[];for(const q of fs){const ws=[q.f.clone().outerWire(),...q.f.clone().innerWires()];for(const w of ws)loops.push(...chain(w.edges.map(e=>edgeSegs(e,pr,size*k)),size*k*1e-5+1e-6));}return{loops,frame:{o,ex,ey,n:nn,k}};};
    if(t>tol&&capsOK&&wallsOK&&Math.abs(topA-botA)<0.01*topA&&Math.abs(vol-topA*t)<0.012*vol){const up=caps.find((q,i)=>Math.abs(offs[i]-top)<tol*10&&dot(q.n,n)>0)||big,g=fl(caps.filter((q,i)=>Math.abs(offs[i]-top)<tol*10),up.n,up.c);
      sheet={t:t*k,loops:g.loops,bends:0,cut_len:0,blank:topA*k*k,pierces:g.loops.length};frame=g.frame;}
    else{const cand=[];for(const a of planes)for(const b of planes){if(a.i>=b.i||dot(a.n,b.n)>-0.9999)continue;const d=dot(sub(a.c,b.c),a.n);if(d>tol*10)cand.push(+(d*k).toFixed(4));}
      const cnt=new Map();cand.forEach(d=>cnt.set(d,(cnt.get(d)||0)+1));const tk=[...cnt.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
      if(tk){const t=tk[0]/k,S=area-2*vol/t,cyl=F.filter(q=>q.cyl&&!q.closedCirc),bends=Math.round(cyl.filter(a=>cyl.some(b=>b!==a&&Math.abs(Math.abs(dot(a.cyl.d,b.cyl.d))-1)<1e-4&&Math.abs(Math.abs(a.cyl.r-b.cyl.r)-t)<0.02*t+tol)).length/2);
        if(bends>0&&S>0&&S<0.35*area)sheet={t:t*k,loops:[],bends,cut_len:S/t*k,blank:vol/t*k*k,pierces:1+F.filter(q=>q.cyl&&q.closedCirc).length/1};}
      const lo=caps.filter((q,i)=>Math.abs(offs[i]-bot)<tol*10).reduce((a,b)=>!a||b.ar>a.ar?b:a,null);if(!sheet&&lo&&t>tol&&Math.abs(vol-lo.ar*t)<0.08*vol){const g=fl([lo],lo.n.map(v=>-v),lo.c);plate={t:t*k,loops:g.loops,blank:lo.ar*k*k,pierces:g.loops.length,trim:+(100*(1-vol/(lo.ar*t))).toFixed(1)};frame=frame||g.frame;}}}
  const holes=[],concR=[];
  for(const q of F){if(!q.cyl||!q.n)continue;const w=sub(q.c,q.cyl.p),wp=sub(w,q.cyl.d.map(v=>v*dot(w,q.cyl.d)));if(dot(q.n,wp)>=0)continue;q.closedCirc?holes.push([2*q.cyl.r*k,q.ar/(TAU*q.cyl.r)*k]):concR.push(q.cyl.r*k);}
  const E=safe(()=>body.edges,[]);let sharp=0;
  for(const e of E){if(e.geomType!=='LINE')continue;const tv=nrm(sub(V(e.pointAt(1)),V(e.pointAt(0))));if(Math.abs(tv[2])<0.999)continue;const h=e.hashCode,adj=F.filter(q=>q.t==='PLANE'&&q.n&&q.eh.has(h));if(adj.length!==2)continue;const m=V(e.pointAt(0.5)),[a,b]=adj;let da=nrm(cross(a.n,tv));if(dot(da,sub(a.c,m))<0)da=da.map(v=>-v);if(dot(da,b.n)>1e-3)sharp++;}
  const ax=[0,1,2],DIRS=[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]],bnd=q=>q.t==='PLANE'&&q.n&&ax.some(j=>Math.abs(q.n[j])>0.999&&Math.abs(q.c[j]-(q.n[j]>0?bb[1][j]:bb[0][j]))<tol*100),need=[];
  for(const q of F){if(bnd(q))continue;if(q.cyl&&q.closedCirc){need.push(new Set(DIRS.map((d,j)=>Math.abs(dot(d,q.cyl.d))>0.999?j:-1).filter(j=>j>=0)));continue;}if(q.n)need.push(new Set(DIRS.map((d,j)=>dot(q.n,d)>-1e-3?j:-1).filter(j=>j>=0)));}
  const cover=new Set();let left=need.filter(x=>x.size);while(left.length){let bj=0,bc=-1;DIRS.forEach((d,j)=>{const c=left.filter(x=>x.has(j)).length;if(c>bc){bc=c;bj=j;}});if(bc<=0)break;cover.add(bj);left=left.filter(x=>!x.has(bj));}
  const setups=Math.max(1,cover.size+(cover.has(1)?0:1));
  let over=0;if(msh){const vp=msh.vertices,tri=msh.triangles,zmin=bb[0][2];for(let q=0;q<tri.length;q+=3){const A=[vp[3*tri[q]],vp[3*tri[q]+1],vp[3*tri[q]+2]],B=[vp[3*tri[q+1]],vp[3*tri[q+1]+1],vp[3*tri[q+1]+2]],C=[vp[3*tri[q+2]],vp[3*tri[q+2]+1],vp[3*tri[q+2]+2]],cr=cross(sub(B,A),sub(C,A)),l=Math.hypot(...cr);if(l<1e-12)continue;if(cr[2]/l<-0.707&&(A[2]+B[2]+C[2])/3>zmin+size*0.002)over+=l/2;}}
  const threads=((doc&&doc.features)||[]).filter(f=>!f.suppressed&&(f.type==='thread'||f.type==='hole'&&(f.tap||f.thread))).reduce((s,f)=>s+Math.max(1,(f.pts&&f.pts.length)||1),0);
  const part={name:(doc&&doc.name)||'part',volume:vol*k**3,area:area*k*k,bbox:[0,1,2].map(i=>(bb[1][i]-bb[0][i])*k),faces:F.length,holes,threads,setups,min_r:concR.length?Math.min(...concR):0,sharp,overhang:over*k*k,sheet};
  const a={part,frame,plate,kind:sheet?(sheet.bends?'bent sheet':'flat sheet'):'solid',units:doc&&doc.units==='in'?'in':'mm'};memo={body,doc,a,F};return a;}
export function to3d(fr,uv){return fr?add(add(fr.o,fr.ex,uv[0]/fr.k),fr.ey,uv[1]/fr.k):null;}
export async function quote({body,doc},a={}){if(!body)throw new Error('Build a part first');const t0=Date.now(),an=analyzeBody(body,doc),L=await camLib(),dm=a.mat||doc&&doc.material,qm=!(a.req&&a.req.material)&&dm?quoteMat(dm,!!an.part.sheet):null,res=JSON.parse(L.quote(JSON.stringify(an.part),JSON.stringify({...(a.req||{}),...(qm?{material:qm.id||'al6061'}:{})}),a.shop||''));qm&&qm.note&&Object.assign(res,{ok:false,quotes:[],best:null,errors:[qm.note],no_stock:true});if(an.plate&&!(qm&&qm.note)){const pm=quoteMat(dm,true),r2=JSON.parse(L.quote(JSON.stringify({...an.part,sheet:{t:an.plate.t,loops:an.plate.loops,bends:0,cut_len:0,blank:an.plate.blank,pierces:an.plate.pierces}}),JSON.stringify({...(a.req||{}),...(pm&&!pm.note?{material:pm.id}:{})}),a.shop||'')),add=(r2.quotes||[]).filter(q=>!(res.quotes||[]).some(x=>x.process===q.process)).map(q=>({...q,notes:[...(q.notes||[]),'Cut as a flat plate'+(an.plate.trim>0.05?'; the edge chamfers and fillets are not included':'')+'.']}));if(add.length){res.quotes=[...(res.quotes||[]),...add].sort((x,y)=>(y.ok-x.ok)||x.unit-y.unit);res.ok=true;res.best=res.quotes[0].process;res.errors=[];}}
  for(const q of res.quotes||[])for(const d of q.dfm||[])d.p=d.at?to3d(an.frame,d.at):null;return{...an,res,ms:Date.now()-t0};}
const bentMsg=(an,m)=>an.part.sheet&&an.part.sheet.bends?'This part is bent sheet metal ('+an.part.sheet.bends+' bend'+(an.part.sheet.bends>1?'s':'')+'); flat patterns of bent parts are not generated yet, so use a flat blank for this output.':m;
export async function dxf({body,doc},a={}){if(!body)throw new Error('Build a part first');const an=analyzeBody(body,doc),fs=flatOf(an);if(!fs)throw new Error(bentMsg(an,'DXF needs a flat sheet or plate-like part'));const L=await camLib();return{dxf:L.sheet_dxf(JSON.stringify(fs.loops),a.units||'in')};}
export const flatOf=an=>an.part.sheet&&an.part.sheet.loops.length?an.part.sheet:an.plate;
export async function toolpath({body,doc},a={}){if(!body)throw new Error('Build a part first');const an=analyzeBody(body,doc),fs=flatOf(an);if(!fs)throw new Error(bentMsg(an,'Toolpaths need a flat sheet or a plate-like part (outline and through-holes cut from one side). This part needs 3D milling, which is not generated yet.'));const L=await camLib(),r=JSON.parse(L.sheet_cam(JSON.stringify(fs.loops),fs.t,JSON.stringify(a.job||{})));if(fs===an.plate)(r.notes=r.notes||[]).push('Cut as a plate: outline and through-holes at full depth from one side'+(fs.trim>0.05?'; edge chamfers and fillets ('+fs.trim+' % of the volume) need a second pass with a chamfer or ball bit':'')+'.');
  return{...r,kind:an.kind};}
const sideAx={'+X':0,'-X':0,'+Y':1,'-Y':1,'+Z':2,'-Z':2},planeAx=f=>f.plane==='XY'?2:f.plane==='XZ'?1:f.plane==='YZ'?0:f.plane==='face'&&f.face&&typeof f.face==='object'&&sideAx[f.face.side]!=null?sideAx[f.face.side]:-1;
const tapOf=(dia,doc,p,d,k)=>{for(const f of(doc&&doc.features)||[]){if(f.suppressed||f.type!=='hole'||f.fit!=='tapped'||!f.std||f.std==='custom')continue;const m=HOLESTD[f.std],i=HOLESTD_IN[f.std],td=m?m[1]:i?i[1]*25.4:0;if(!td||Math.abs(td-dia)>Math.max(0.03,dia*0.015))continue;const ax=planeAx(f),pts=(f.pts||[]).filter(q=>Array.isArray(q)&&q.length>1&&q.every(v=>typeof v==='number'));
  if(ax>=0&&pts.length&&pts.length===(f.pts||[]).length){if(Math.abs(d[ax])<0.9)continue;const o=[0,1,2].filter(j=>j!==ax),mine=o.map(j=>Math.abs(p[j])).sort((x,y)=>x-y);if(!pts.some(q=>{const w=q.map(v=>Math.abs(v)*k).sort((x,y)=>x-y);return Math.abs(w[0]-mine[0])<0.06&&Math.abs(w[1]-mine[1])<0.06;}))continue;}
  const key=THREADSTD[f.std]?f.std:Object.keys(THREADSTD).find(q=>q.startsWith(f.std+'-')),th=THREADSTD[key];if(th)return{name:key,pitch:th[1]*(th[2]==='in'?25.4:1)};}return null;};
export function holeList({body,doc}){
  analyzeBody(body,doc);const F=memo.F,k=doc&&doc.units==='in'?25.4:1,bb=body.boundingBox.bounds,size=Math.hypot(...sub(bb[1],bb[0]))||1,tl=size*1e-4+1e-7,segs=[];
  for(const q of F){if(!q.cyl||!q.n)continue;const w=sub(q.c,q.cyl.p);if(dot(q.n,sub(w,q.cyl.d.map(v=>v*dot(w,q.cyl.d))))>=0)continue;
    const {p,d}=q.cyl,ce=safe(()=>q.f.edges.filter(e=>e.geomType==='CIRCLE'),[]).map(e=>({e,ci:circOf(e)})).filter(x=>x.ci).map(x=>({...x,t:dot(sub(x.ci.c,p),d)}));if(ce.length<2)continue;
    const lo=Math.min(...ce.map(x=>x.t)),hi=Math.max(...ce.map(x=>x.t));if(hi-lo<tl*20)continue;
    const grp=[ce.filter(x=>x.t-lo<tl*20),ce.filter(x=>hi-x.t<tl*20)];if(!grp.every(g=>Math.abs(g.reduce((s2,x)=>s2+safe(()=>x.e.length,0),0)-TAU*q.cyl.r)<TAU*q.cyl.r*2e-3))continue;
    const ends=grp.map((g,i)=>{const hs=new Set(g.map(x=>x.e.hashCode)),adj=F.find(r=>r!==q&&[...r.eh].some(h=>hs.has(h))),hiE=i===1,s2=hiE?d:d.map(v=>-v),t=hiE?hi:lo;let kind='bottom',extra=null;
      if(adj&&adj.t==='PLANE'&&adj.n&&dot(adj.n,s2)>0.5)kind='mouth';
      else if(adj&&adj.t==='CONE'){const o=safe(()=>adj.f.edges.filter(e=>e.geomType==='CIRCLE'&&!hs.has(e.hashCode)).map(circOf).filter(Boolean).sort((m,n)=>n.r-m.r)[0]);if(o&&o.r>q.cyl.r*1.02){kind='csink';extra={t:dot(sub(o.c,p),d),R:o.r,r:q.cyl.r};}}
      return{t,hi:hiE,kind,extra};});
    segs.push({r:q.cyl.r,p,d,t0:lo,t1:hi,ends});}
  const used=new Set(),out=[];
  for(let i=0;i<segs.length;i++){if(used.has(i))continue;const g=[segs[i]],ref=segs[i];used.add(i);
    for(let j=i+1;j<segs.length;j++){if(used.has(j))continue;const o=segs[j],c=cross(ref.d,o.d),dp=sub(o.p,ref.p),off=sub(dp,ref.d.map(v=>v*dot(dp,ref.d)));if(Math.hypot(...c)<1e-3&&Math.hypot(...off)<Math.max(tl*50,1e-3*size)){g.push(o);used.add(j);}}
    const dd=ref.d,sg=g.map(o=>{const sh=dot(sub(o.p,ref.p),dd);return{...o,t0:o.t0+sh,t1:o.t1+sh,ends:o.ends.map(x=>({...x,t:x.t+sh,extra:x.extra&&{...x.extra,t:x.extra.t+sh}}))};});
    const tmin=Math.min(...sg.map(o=>o.t0)),tmax=Math.max(...sg.map(o=>o.t1)),en=sg.flatMap(o=>o.ends.map(x=>({...x,r:o.r}))),top=en.filter(x=>Math.abs(x.t-tmax)<tl*20),bot=en.filter(x=>Math.abs(x.t-tmin)<tl*20),open=a=>a.find(x=>x.kind==='mouth'||x.kind==='csink');
    const oT=open(top),oB=open(bot);if(!oT&&!oB)continue;
    const thru=!!(oT&&oB),atTop=oT&&oB?(sg.find(o=>Math.abs(o.t1-tmax)<tl*20).r>sg.find(o=>Math.abs(o.t0-tmin)<tl*20).r*1.001||Math.abs(sg.find(o=>Math.abs(o.t1-tmax)<tl*20).r-sg.find(o=>Math.abs(o.t0-tmin)<tl*20).r)<=sg.find(o=>Math.abs(o.t0-tmin)<tl*20).r*1e-3&&dot(dd,[0.001,0.01,1])>=0):!!oT,mouthT=atTop?tmax:tmin,sgn=atTop?-1:1,prim=sg.reduce((a,b)=>b.r<a.r?b:a),rr=prim.r;
    const cb=sg.filter(o=>o.r>rr*1.05&&Math.abs((atTop?o.t1:o.t0)-mouthT)<tl*20)[0],cbS=cb&&{dia:2*cb.r*k,depth:(cb.t1-cb.t0)*k};
    const cn=(atTop?top:bot).find(x=>x.kind==='csink'),cnS=cn&&{dia:2*cn.extra.R*k,angle:+(2*Math.atan((cn.extra.R-cn.extra.r)/Math.max(1e-9,Math.abs(cn.extra.t-cn.t)))*180/Math.PI).toFixed(1)};
    const mT=cn&&!cbS?cn.extra.t:mouthT,pt=add(ref.p,dd,mT),dep=(tmax-tmin+Math.abs(mT-mouthT))*k,dia=2*rr*k,pmm=pt.map(v=>v*k),tap=tapOf(dia,doc,pmm,dd.map(v=>v*sgn),k);
    out.push({p:pt.map(v=>+(v*k).toFixed(4)),d:dd.map(v=>+(v*sgn).toFixed(6)),dia:+dia.toFixed(4),depth:+dep.toFixed(4),thru,tap,cbore:cbS||null,csink:cnS||null});}
  return out.sort((a,b)=>a.p[2]-b.p[2]||a.p[1]-b.p[1]||a.p[0]-b.p[0]);}
export function solidJob({body,doc},a={}){
  const an=analyzeBody(body,doc),k=doc&&doc.units==='in'?25.4:1,bb=body.boundingBox.bounds,size=Math.hypot(...sub(bb[1],bb[0]))||1,m=body.mesh({tolerance:Math.max(0.02/k,size*1e-4),angularTolerance:0.1}),q=1e3,wid=new Map(),V=[],T=[];
  const ix=i=>{const x=+(m.vertices[3*i]*k).toFixed(3),y=+(m.vertices[3*i+1]*k).toFixed(3),z=+(m.vertices[3*i+2]*k).toFixed(3),key=Math.round(x*q)+','+Math.round(y*q)+','+Math.round(z*q);let j=wid.get(key);if(j==null){j=V.length/3;wid.set(key,j);V.push(x,y,z);}return j;};
  for(let i=0;i<m.triangles.length;i+=3){const A=ix(m.triangles[i]),B=ix(m.triangles[i+1]),C=ix(m.triangles[i+2]);A!==B&&B!==C&&A!==C&&T.push(A,B,C);}
  return{name:(doc&&doc.name)||'part',mesh:{v:V,t:T},holes:holeList({body,doc}),bbox:[0,1,2].map(i=>(bb[1][i]-bb[0][i])*k),min:bb[0].map(v=>v*k),kind:an.kind};}
export async function solid({body,doc},a={}){
  if(!body)throw new Error('Build a part first');const L=await camLib();if(typeof L.solid_cam!=='function')throw new Error('This build of the CAM engine cannot mill solid parts yet.');
  const j={...solidJob({body,doc}),...(a.job||{})};delete j.kind;return JSON.parse((a.tooling?L.solid_tooling:a.plan?L.solid_plan:L.solid_cam)(JSON.stringify(j)));}
export function analyze({body,doc}){if(!body)throw new Error('Build a part first');const an=analyzeBody(body,doc);return{part:an.part,plate:an.plate,kind:an.kind,units:an.units};}
export async function engine(){const L=await camLib();return{solid:typeof L.solid_cam==='function'&&typeof L.solid_plan==='function',tooling:typeof L.solid_tooling==='function'};}
export async function catalog(){const L=await camLib();return{cam:JSON.parse(L.cam_catalog()),shop:JSON.parse(L.shop_default())};}
export async function program(_,a={}){const L=await camLib();return JSON.parse(L.cam_program(JSON.stringify(a.jobs||[])));}
export async function simulate(_,a={}){if(!a.gcode)throw new Error('No G-code to simulate');return(await import('./gcode_sim.js')).simulate(a.gcode,a);}
export function sheetLoops({body,doc}){const an=analyzeBody(body,doc),s=an.part.sheet;return s?{t:s.t,loops:s.loops,bends:s.bends,blank:s.blank,aspect:an.part.bbox[0]/(an.part.bbox[1]||1)||1}:null;}
