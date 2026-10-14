import * as R from './vendor/replicad.js';
import {evalExpr,resolveParams} from './expr.js';
export {evalExpr,resolveParams};
const STRKEYS=new Set(['id','type','name','op','plane','dir','kind','axis','side','by','k','text','blob','note','normal','origin','of','material']);
function res(v,scope,k){
  if(Array.isArray(v))return v.map(x=>res(x,scope,k));
  if(v&&typeof v==='object'){const o={};for(const kk in v)o[kk]=res(v[kk],scope,kk);return o;}
  if(typeof v==='string'&&!STRKEYS.has(k))return evalExpr(v,scope);
  return v;
}
const AX={X:[1,0,0],Y:[0,1,0],Z:[0,0,1],'+X':[1,0,0],'+Y':[0,1,0],'+Z':[0,0,1],'-X':[-1,0,0],'-Y':[0,-1,0],'-Z':[0,0,-1]};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l]},dist=(a,b)=>Math.hypot(...sub(a,b));
const V=v=>[v.x,v.y,v.z];
const NAMED={XY:{n:[0,0,1],x:[1,0,0]},XZ:{n:[0,-1,0],x:[1,0,0]},YZ:{n:[1,0,0],x:[0,1,0]}};
function sizeOf(shape){const b=shape.boundingBox.bounds;return Math.max(dist(b[0],b[1]),1e-6);}
function faceList(shape){return shape.faces.map((f,i)=>{let c,n=null;try{c=V(f.center);}catch{c=[0,0,0];}try{n=V(f.normalAt(f.center));}catch{}return{f,i,c,n,type:f.geomType};});}
function edgeList(shape){return shape.edges.map((e,i)=>{const m=V(e.pointAt(0.5)),a=V(e.startPoint),b=V(e.endPoint);let t=[0,0,0];try{t=V(e.tangentAt(0.5));}catch{}return{e,i,m,a,b,t,type:e.geomType,len:e.length};});}
function bboxOf(shape){const b=shape.boundingBox.bounds;return{min:b[0],max:b[1]};}
function sideTest(side,shape){
  const ax=AX[side.length===1?'+'+side:side];if(!ax)throw new Error('bad side '+side);
  const bb=bboxOf(shape),tol=sizeOf(shape)*1e-4+1e-6,i=ax.findIndex(v=>v!==0),ext=ax[i]>0?bb.max[i]:bb.min[i];
  return{ax,i,ext,tol};
}
export function selectFaces(shape,sel){
  const F=faceList(shape);if(!sel)return[];
  const sels=Array.isArray(sel)?sel:[sel],out=new Set();
  for(const s of sels){
    const by=s.by||(s.side?'side':s.pts?'pick':s.normal?'normal':s.type?'type':'all');
    let hit=[];
    if(by==='all')hit=F;
    else if(by==='side'){const{ax,i,ext,tol}=sideTest(s.side,shape);hit=F.filter(q=>q.n&&dot(q.n,ax)>0.999&&Math.abs(q.c[i]-ext)<Math.max(tol,1e-3));}
    else if(by==='normal'){const ax=nrm(Array.isArray(s.normal)?s.normal:AX[s.normal]);hit=F.filter(q=>q.n&&dot(q.n,ax)>0.999);}
    else if(by==='type')hit=F.filter(q=>q.type===String(s.type).toUpperCase());
    else if(by==='pick'){const tol=sizeOf(shape)*0.02+0.05;for(const p of s.pts||[]){let best=null,bd=1e9;for(const q of F){const d=pdist(p,q.f);if(d<bd){bd=d;best=q;}}if(best&&bd<tol)hit.push(best);}}
    else throw new Error('unknown face selector '+by);
    for(const q of hit)out.add(q.i);
  }
  return[...out].map(i=>F[i]);
}
export function selectEdges(shape,sel){
  const E=edgeList(shape);if(!sel)return[];
  const sels=Array.isArray(sel)?sel:[sel],out=new Set();
  for(const s of sels){
    const by=s.by||(s.side?'side':s.pts?'pick':s.dir?'dir':s.type?'type':'all');
    let hit=[];
    if(by==='all')hit=E;
    else if(by==='dir'){const ax=nrm(Array.isArray(s.dir)?s.dir:AX[s.dir]);hit=E.filter(q=>q.type==='LINE'&&Math.abs(dot(nrm(q.t),ax))>0.999);}
    else if(by==='side'){const{i,ext,tol}=sideTest(s.side,shape),t2=Math.max(tol,1e-3);hit=E.filter(q=>Math.abs(q.a[i]-ext)<t2&&Math.abs(q.b[i]-ext)<t2&&Math.abs(q.m[i]-ext)<t2);}
    else if(by==='type')hit=E.filter(q=>q.type===String(s.type).toUpperCase());
    else if(by==='pick'){const tol=sizeOf(shape)*0.02+0.05;for(const p of s.pts||[]){let best=null,bd=1e9;for(const q of E){const d=pdist(p,q.e);if(d<bd){bd=d;best=q;}}if(best&&bd<tol)hit.push(best);}}
    else throw new Error('unknown edge selector '+by);
    if(s.side&&by!=='side'){const{i,ext,tol}=sideTest(s.side,shape);hit=hit.filter(q=>Math.abs(q.m[i]-ext)<Math.max(tol,1e-3));}
    for(const q of hit)out.add(q.i);
  }
  return[...out].map(i=>E[i]);
}
function pdist(p,sh){const v=R.makeVertex(p);try{return R.measureDistanceBetween(v,sh);}catch{return 1e9;}finally{try{v.delete();}catch{}}}
function planeFrom(f,shape){
  if(f.face&&(f.plane===undefined||f.plane==='face')){
    if(!shape)throw new Error('sketch on face needs an existing body');
    const fs=selectFaces(shape,f.face);if(!fs.length)throw new Error('sketch face not found');
    const q=fs[0];if(q.type!=='PLANE')throw new Error('sketch face must be flat');
    const n=nrm(q.n);let x=Math.abs(n[2])>0.9?[1,0,0]:Math.abs(n[0])>0.9?[0,1,0]:[1,0,0];x=nrm(sub(x,n.map(v=>v*dot(x,n))));
    const o=f.face.origin==='center'?q.c:projOnPlane([0,0,0],q.c,n);
    return{o:o.map((v,i)=>v+n[i]*(f.offset||0)),n,x};
  }
  const P=NAMED[f.plane||'XY'];if(!P)throw new Error('plane must be XY, XZ or YZ');
  return{o:P.n.map(v=>v*(f.offset||0)),n:P.n,x:P.x};
}
function projOnPlane(p,o,n){const d=dot(sub(p,o),n);return sub(p,n.map(v=>v*d));}
function drawShape2(s){
  const k=s.k||s.kind||'rect';let d;
  if(k==='rect'){d=R.drawRoundedRectangle(s.w,s.h,s.r>0?Math.min(s.r,Math.min(s.w,s.h)/2-1e-6):0);}
  else if(k==='circle'){d=R.drawCircle(s.r);}
  else if(k==='poly'){d=R.drawPolysides(s.r,Math.max(3,Math.round(s.n||6)));}
  else if(k==='slot'){const L=Math.max(s.l||s.w,0),W=s.h||s.d||s.w*0.3;d=R.drawRoundedRectangle(L+W,W,W/2-1e-6);}
  else if(k==='path'){
    const pts=(s.pts||[]).map(p=>[+p[0],+p[1]]);if(pts.length<3)throw new Error('path needs 3+ points');
    let pen=R.draw(pts[0]);for(let i=1;i<pts.length;i++){const p=pts[i],b=s.bulge&&s.bulge[i-1];pen=b?pen.sagittaArcTo(p,b):pen.lineTo(p);}
    d=pen.close();
  }
  else if(k==='text'){d=R.drawText(String(s.text||'A'),{fontSize:s.h||10});}
  else throw new Error('unknown 2D shape '+k);
  if(s.a)d=d.rotate(s.a,[0,0]);
  if(k==='text')return d.translate(s.x||0,s.y||0);
  return d.translate(s.x||0,s.y||0);
}
function profileDrawing(shapes){
  if(!shapes||!shapes.length)throw new Error('profile is empty');
  let pos=null,neg=null;
  for(const s of shapes){const d=drawShape2(s);if(s.hole){neg=neg?neg.fuse(d):d;}else{pos=pos?pos.fuse(d):d;}}
  if(!pos)throw new Error('profile has only holes');
  return neg?pos.cut(neg):pos;
}
function planeObj(P){return new R.Plane(P.o,P.x,P.n);}
function extrudeTool(f,body){
  const P=planeFrom(f,body),dir=f.dir||'+',depth=Math.abs(f.depth||10);
  let o=P.o;
  if(dir==='-')o=o.map((v,i)=>v-P.n[i]*depth);
  else if(dir==='both')o=o.map((v,i)=>v-P.n[i]*depth/2);
  const pl=new R.Plane(o,P.x,P.n);
  const sk=profileDrawing(f.shapes).sketchOnPlane(pl);
  const opt=f.draft?{extrusionDirection:P.n,draftAngle:-f.draft}:undefined;
  const solid=sk.extrude(depth,opt);
  return solid;
}
function revolveTool(f,body){
  const P=planeFrom(f,body),pl=planeObj(P);
  const sk=profileDrawing(f.shapes).sketchOnPlane(pl);
  const y=cross(P.n,P.x),axis=(f.axis||'y')==='x'?P.x:y;
  return sk.revolve(axis,{origin:P.o,angle:f.angle??360});
}
function primTool(f){
  const t=f.type;
  if(t==='box'){const w=f.w??10,d=f.d??w,h=f.h??w;return R.makeBox([(f.x||0)-w/2,(f.y||0)-d/2,f.z||0],[(f.x||0)+w/2,(f.y||0)+d/2,(f.z||0)+h]);}
  if(t==='cylinder'){const ax=AX[f.axis||'Z']||AX.Z,h=f.h??10,c=[f.x||0,f.y||0,f.z||0];return R.makeCylinder(f.r??5,h,f.center?c.map((v,i)=>v-ax[i]*h/2):c,ax);}
  if(t==='sphere')return R.makeSphere(f.r??5).translate(f.x||0,f.y||0,f.z||0);
  if(t==='cone')return coneSolid(f.r1??5,f.r2??0,f.h??10,[f.x||0,f.y||0,f.z||0],AX[f.axis||'Z']||AX.Z);
  if(t==='torus'){const c=[f.x||0,f.y||0,f.z||0];return R.drawCircle(f.r2??2).translate(f.r1??10,0).sketchOnPlane(new R.Plane(c,[1,0,0],[0,-1,0])).revolve([0,0,1],{origin:c});}
  throw new Error('unknown primitive '+t);
}
function coneSolid(r1,r2,h,c,ax){
  const x=nrm(Math.abs(ax[2])>0.9?cross(ax,[0,1,0]):cross(ax,[0,0,1])),pts=[[0,0],[r1,0],[r2,h],[0,h]].filter((p,i,a)=>!(i>0&&p[0]===a[i-1][0]&&p[1]===a[i-1][1]));
  let pen=R.draw(pts[0]);for(let i=1;i<pts.length;i++)pen=pen.lineTo(pts[i]);
  return pen.close().sketchOnPlane(new R.Plane(c,x,cross(x,ax))).revolve(ax,{origin:c});
}
function holeTool(f,body){
  const P=planeFrom(f,body),d=f.d??5,thru=f.thru!==false,depth=thru?sizeOf(body||R.makeBox([0,0,0],[1,1,1]))*3:f.depth;
  const pts=f.pts&&f.pts.length?f.pts:[[f.x||0,f.y||0]],y=cross(P.n,P.x);
  let tool=null;
  for(const p of pts){
    const c=[0,1,2].map(i=>P.o[i]+P.x[i]*p[0]+y[i]*p[1]);
    const down=P.n.map(v=>-v),eps=0.01*d;
    const top=c.map((v,i)=>v+P.n[i]*eps);
    let t=R.makeCylinder(d/2,depth+eps,top,down);
    if(f.cb_d>d&&f.cb_h>0)t=t.fuse(R.makeCylinder(f.cb_d/2,f.cb_h+eps,top,down));
    if(f.cs_d>d){const hh=(f.cs_d-d)/2;t=t.fuse(coneSolid(f.cs_d/2+eps,d/2,hh+eps,top,down));}
    tool=tool?tool.fuse(t):t;
  }
  return tool;
}
function applyOp(body,tool,op){
  if(!body||op==='new'&&!body)return tool;
  if(op==='cut')return body.cut(tool);
  if(op==='intersect')return body.intersect(tool);
  return body.fuse(tool);
}
function patternTools(f,tools){
  const out=[],n=Math.max(1,Math.round(f.n||2));
  for(const t of tools){
    for(let k=1;k<n;k++){
      if(f.kind==='circular'){const ax=AX[f.axis||'Z']||AX.Z,ang=(f.angle??360)===360?360/n:(f.angle)/(n-1);out.push(t.clone().rotate(ang*k,[f.ox||0,f.oy||0,f.oz||0],ax));}
      else out.push(t.clone().translate((f.dx||0)*k,(f.dy||0)*k,(f.dz||0)*k));
    }
  }
  return out;
}
const HINT={fillet:'the radius is probably too big for these edges; try a smaller radius or fewer edges',chamfer:'the distance is probably too big for these edges',shell:'the wall is probably thicker than a fillet or feature allows; thin the wall or enlarge the fillets',extrude:'check that the profile is closed and does not cross itself',revolve:'the profile must not cross the axis',hole:'check the hole lies on the part',pattern:'a copy may fall outside the part',mirror:'the mirror may not touch the part'};
function friendly(e,f){const m=String(e&&e.message||e);if(/WebAssembly|object Object|^\d+$/.test(m)||!m)return 'geometry kernel could not build this '+((f&&f.type)||'feature')+(f&&HINT[f.type]?': '+HINT[f.type]:'');return m.slice(0,300);}
const TOOLMAKERS={box:primTool,cylinder:primTool,sphere:primTool,cone:primTool,torus:primTool,extrude:extrudeTool,revolve:revolveTool,hole:holeTool};
let cache=[];
function truncate(i){const keep=new Set(),gone=new Set();for(let j=0;j<Math.min(i,cache.length);j++){keep.add(cache[j].shape);keep.add(cache[j].tool);}for(let j=i;j<cache.length;j++)for(const o of[cache[j].shape,cache[j].tool])if(o&&!keep.has(o)&&!gone.has(o)){gone.add(o);try{o.delete();}catch{}}cache.length=Math.min(cache.length,i);}
export function resetCache(){truncate(0);cache=[];}
export async function build(doc,opt={}){
  const t0=performance.now(),{scope,errors:pErr}=resolveParams(doc.params);
  const feats=(doc.features||[]).filter(f=>!f.suppressed),upto=opt.upto??feats.length,errors=[],log=[];
  let body=null,prevKey='',reused=0;
  const tools={};
  for(let i=0;i<Math.min(upto,feats.length);i++){
    const raw=feats[i];let f,key;
    try{f=res(raw,scope);key=prevKey+'|'+JSON.stringify(f)+(raw.type==='import'?raw.id:'');}catch(e){errors.push({id:raw.id,msg:e.message});key=prevKey+'|ERR'+i;f=null;}
    const c=cache[i];
    if(c&&c.key===key){body=c.shape;if(c.tool)tools[raw.id]=c.tool;prevKey=key;reused++;continue;}
    truncate(i);
    let next=body,tool=null;
    if(f)try{
      if(TOOLMAKERS[f.type]){tool=TOOLMAKERS[f.type](f,body);next=applyOp(body,tool,f.type==='hole'?'cut':(f.op||'add'));}
      else if(f.type==='fillet'||f.type==='chamfer'){
        if(!body)throw new Error(f.type+' needs a body');
        const es=selectEdges(body,f.edges);if(!es.length)throw new Error('no edges matched');
        const set=new Set(es.map(q=>q.e.hashCode)),r=f.type==='fillet'?(f.r??1):(f.d??1);
        const fn=e=>set.has(e.hashCode)?r:null;
        next=f.type==='fillet'?body.fillet(fn):body.chamfer(fn);
      }
      else if(f.type==='shell'){
        if(!body)throw new Error('shell needs a body');
        const fs=selectFaces(body,f.faces||{side:'+Z'});if(!fs.length)throw new Error('no faces matched');
        const set=new Set(fs.map(q=>q.f.hashCode));
        next=body.shell(Math.abs(f.t??1),ff=>ff.when(({element})=>set.has(element.hashCode)));
      }
      else if(f.type==='pattern'){
        const src=(f.of||[]).map(id=>tools[id]).filter(Boolean);if(!src.length)throw new Error('pattern: pick features that made a body or cut');
        const ops=(f.of||[]).map(id=>{const r2=feats.find(x=>x.id===id);return r2?(r2.type==='hole'?'cut':r2.op||'add'):'add';});
        let b=body;src.forEach((t,si)=>{const cp=patternTools(f,[t]);if(!cp.length)return;const c=cp.length===1?cp[0]:R.makeCompound(cp);b=applyOp(b,c,ops[si]);});next=b;
      }
      else if(f.type==='mirror'){
        if(!body)throw new Error('mirror needs a body');
        const P=NAMED[f.plane||'YZ'];next=body.fuse(body.clone().mirror(new R.Plane(P.n.map(v=>v*(f.offset||0)),P.x,P.n)));
      }
      else if(f.type==='move'){
        if(!body)throw new Error('move needs a body');
        let b=body.clone();if(f.angle)b=b.rotate(f.angle,[f.ox||0,f.oy||0,f.oz||0],AX[f.axis||'Z']);next=b.translate(f.dx||0,f.dy||0,f.dz||0);
      }
      else if(f.type==='import'){
        const data=opt.blobs&&opt.blobs[raw.blob];if(!data)throw new Error('imported file missing');
        const sh=await R.importSTEP(new Blob([data]));tool=sh;next=applyOp(body,sh,f.op||'add');
      }
      else throw new Error('unknown feature '+f.type);
      if(next&&next.isNull)throw new Error('result is empty');
    }catch(e){errors.push({id:raw.id,msg:friendly(e,f)});next=body;tool=null;}
    if(tool)tools[raw.id]=tool;
    cache[i]={key,shape:next,tool};
    body=next;prevKey=key;
  }
  truncate(Math.min(upto,feats.length));
  return{body,errors,paramErrors:pErr,scope,reused,ms:performance.now()-t0};
}
export function meshBody(body,q=1){
  if(!body)return null;
  const size=sizeOf(body),tol=Math.max(size*2e-4/q,0.002),m=body.mesh({tolerance:tol,angularTolerance:0.12/q}),me=body.meshEdges({tolerance:tol,angularTolerance:0.12/q});
  const F=faceList(body),E=edgeList(body),fh=new Map(F.map(x=>[x.f.hashCode,x.i])),eh=new Map(E.map(x=>[x.e.hashCode,x.i]));
  const faces=F.map(x=>({c:x.c,n:x.n,type:x.type,area:safe(()=>R.measureArea(x.f))}));
  const edges=E.map(x=>({m:x.m,a:x.a,b:x.b,type:x.type,len:x.len}));
  let vp=null;try{const p=R.measureShapeVolumeProperties(body);vp={volume:p.volume,com:p.centerOfMass};}catch{}
  const bb=bboxOf(body);
  return{pos:new Float32Array(m.vertices),nrm:new Float32Array(m.normals),idx:new Uint32Array(m.triangles),groups:m.faceGroups.map(g=>[g.start,g.count,fh.get(g.faceId)??-1]),lines:new Float32Array(me.lines),egroups:me.edgeGroups.map(g=>[g.start,g.count,eh.get(g.edgeId)??-1]),faces,edges,props:{volume:vp?vp.volume:safe(()=>R.measureVolume(body)),com:vp?vp.com:null,area:safe(()=>R.measureArea(body)),bbox:bb,nFaces:F.length,nEdges:E.length,nSolids:body.solids?body.solids.length:1}};
}
function safe(f){try{return f();}catch{return null;}}
export function exportBody(body,fmt){
  if(!body)throw new Error('nothing to export');
  if(fmt==='step')return body.blobSTEP();
  if(fmt==='stl')return body.blobSTL({binary:true,tolerance:Math.max(sizeOf(body)*1e-4,0.001),angularTolerance:0.05});
  throw new Error('unknown format '+fmt);
}
export function shapeBefore(i){return i>0&&cache[i-1]?cache[i-1].shape:null;}
export function edgePolylines(shape,sel,isFace){const out=[];const list=isFace?selectFaces(shape,sel).flatMap(q=>q.f.outerWire().edges):selectEdges(shape,sel).map(q=>q.e);for(const e of list){const p=[];for(let k=0;k<=24;k++)p.push(V(e.pointAt(k/24)));out.push(p);}return out;}
export async function init(oc){R.setOC(oc);return true;}
