import * as R from './vendor/replicad.js';
const V=v=>[v.x,v.y,v.z],P=p=>[p.X(),p.Y(),p.Z()],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l];};
const safe=(f,d=null)=>{try{return f();}catch{return d;}},d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),TAU=Math.PI*2;
let AC=null,memo={body:null,doc:null,a:null};
export function camLib(){return AC||(AC=(async()=>{const m=await import('./vendor/amni-cam/amni_cam.js'),u=new URL('./vendor/amni-cam/amni_cam_bg.wasm',import.meta.url);await m.default({module_or_path:u.protocol==='file:'?(await import('node:fs')).readFileSync(u):u});return m;})());}
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
  let sheet=null,frame=null;
  if(big){const n=big.n,caps=planes.filter(q=>Math.abs(Math.abs(dot(q.n,n))-1)<1e-4),offs=caps.map(q=>dot(q.c,n)),top=Math.max(...offs),bot=Math.min(...offs),t=top-bot,capSet=new Set(caps.map(q=>q.i));
    const capsOK=offs.every(o=>Math.abs(o-top)<tol*10||Math.abs(o-bot)<tol*10),walls=F.filter(q=>!capSet.has(q.i)),wallsOK=walls.every(q=>{const ns=fn.get(q.h);return ns?ns.every(v=>Math.abs(dot(v,n))<0.03):q.t==='PLANE'&&q.n&&Math.abs(dot(q.n,n))<1e-3;});
    const topA=caps.filter((q,i)=>Math.abs(offs[i]-top)<tol*10).reduce((s,q)=>s+q.ar,0),botA=caps.filter((q,i)=>Math.abs(offs[i]-bot)<tol*10).reduce((s,q)=>s+q.ar,0);
    if(t>tol&&capsOK&&wallsOK&&Math.abs(topA-botA)<0.01*topA&&Math.abs(vol-topA*t)<0.012*vol){const up=caps.find((q,i)=>Math.abs(offs[i]-top)<tol*10&&dot(q.n,n)>0)||big,nn=up.n,o=up.c,ref=Math.abs(nn[2])>0.9?[1,0,0]:[0,0,1],ex=Math.abs(nn[2])>0.9?nrm(sub(ref,nn.map(v=>v*dot(ref,nn)))):nrm(cross(ref,nn)),ey=cross(nn,ex),pr=p=>{const d=sub(p,o);return[dot(d,ex)*k,dot(d,ey)*k];};
      const tops=caps.filter((q,i)=>Math.abs(offs[i]-top)<tol*10),loops=[];for(const q of tops){const ws=[q.f.clone().outerWire(),...q.f.clone().innerWires()];for(const w of ws)loops.push(...chain(w.edges.map(e=>edgeSegs(e,pr,size*k)),size*k*1e-5+1e-6));}
      sheet={t:t*k,loops,bends:0,cut_len:0,blank:topA*k*k,pierces:loops.length};frame={o,ex,ey,n:nn,k};}
    else{const cand=[];for(const a of planes)for(const b of planes){if(a.i>=b.i||dot(a.n,b.n)>-0.9999)continue;const d=dot(sub(a.c,b.c),a.n);if(d>tol*10)cand.push(+(d*k).toFixed(4));}
      const cnt=new Map();cand.forEach(d=>cnt.set(d,(cnt.get(d)||0)+1));const tk=[...cnt.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
      if(tk){const t=tk[0]/k,S=area-2*vol/t,cyl=F.filter(q=>q.cyl&&!q.closedCirc),bends=Math.round(cyl.filter(a=>cyl.some(b=>b!==a&&Math.abs(Math.abs(dot(a.cyl.d,b.cyl.d))-1)<1e-4&&Math.abs(Math.abs(a.cyl.r-b.cyl.r)-t)<0.02*t+tol)).length/2);
        if(bends>0&&S>0&&S<0.35*area)sheet={t:t*k,loops:[],bends,cut_len:S/t*k,blank:vol/t*k*k,pierces:1+F.filter(q=>q.cyl&&q.closedCirc).length/1};}}}
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
  const a={part,frame,kind:sheet?(sheet.bends?'bent sheet':'flat sheet'):'solid',units:doc&&doc.units==='in'?'in':'mm'};memo={body,doc,a};return a;}
export function to3d(fr,uv){return fr?add(add(fr.o,fr.ex,uv[0]/fr.k),fr.ey,uv[1]/fr.k):null;}
export async function quote({body,doc},a={}){if(!body)throw new Error('Build a part first');const t0=Date.now(),an=analyzeBody(body,doc),L=await camLib(),res=JSON.parse(L.quote(JSON.stringify(an.part),JSON.stringify(a.req||{}),a.shop||''));
  for(const q of res.quotes||[])for(const d of q.dfm||[])d.p=d.at?to3d(an.frame,d.at):null;return{...an,res,ms:Date.now()-t0};}
export async function dxf({body,doc},a={}){const an=analyzeBody(body,doc);if(!an.part.sheet||!an.part.sheet.loops.length)throw new Error('DXF needs a flat sheet part');const L=await camLib();return{dxf:L.sheet_dxf(JSON.stringify(an.part.sheet.loops),a.units||'in')};}
export async function toolpath({body,doc},a={}){const an=analyzeBody(body,doc);if(!an.part.sheet||!an.part.sheet.loops.length)throw new Error('Toolpaths need a flat sheet part for now');const L=await camLib(),r=JSON.parse(L.sheet_cam(JSON.stringify(an.part.sheet.loops),an.part.sheet.t,JSON.stringify(a.job||{})));
  return{...r,kind:an.kind};}
export async function catalog(){const L=await camLib();return{cam:JSON.parse(L.cam_catalog()),shop:JSON.parse(L.shop_default())};}
export async function program(_,a={}){const L=await camLib();return JSON.parse(L.cam_program(JSON.stringify(a.jobs||[])));}
export async function simulate(_,a={}){if(!a.gcode)throw new Error('No G-code to simulate');return(await import('./gcode_sim.js')).simulate(a.gcode,a);}
export function sheetLoops({body,doc}){const an=analyzeBody(body,doc),s=an.part.sheet;return s?{t:s.t,loops:s.loops,bends:s.bends,blank:s.blank,aspect:an.part.bbox[0]/(an.part.bbox[1]||1)||1}:null;}
