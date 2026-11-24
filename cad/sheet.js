import * as R from './vendor/replicad.js';
import {heliumSync} from './he/host.js';
import {add,sub,mul,dot,cross,nrm,vec} from './qmath.js';
import {kFactor} from './dies_press.js';
import {loopArea} from './dies_geo.js';
const SMF=await heliumSync('sheet'),safe=(f,d=null)=>{try{return f();}catch{return d;}},P3=p=>[p.X(),p.Y(),p.Z()],d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),EDGE_DIR={front:[0,-1],right:[1,0],back:[0,1],left:[-1,0]};let SH=null;
const sm=()=>SH||(SH=SMF({}));
export function cylOf(f){return safe(()=>{const ad=f._geomAdaptor(),c=ad.Cylinder(),ax=c.Axis(),o={r:c.Radius(),p:P3(ax.Location()),d:nrm(P3(ax.Direction()))};safe(()=>ad.delete());return o;});}
export function unfoldBody(body,o={}){
  const t=o.t,bb=body.boundingBox.bounds,size=Math.hypot(...sub(bb[1],bb[0]))||1,fs=body.faces,FC=[],ED=[],PT=[],HM=new Map();
  fs.forEach((f,i)=>{const ty=f.geomType,c0=safe(()=>vec(f.center),[0,0,0]),sp=safe(()=>vec(f.pointOnSurface(0.5,0.5)),null)||c0,ar=safe(()=>R.measureArea(f.clone()),0),cy=ty==='CYLINDRE'?cylOf(f):null;
    if(ty==='PLANE')FC.push(0,...c0,...nrm(vec(f.normalAt(c0))),0,0,ar,0,0,...sp,0);
    else if(cy){const rd=nrm(sub(sub(sp,cy.p),mul(cy.d,dot(sub(sp,cy.p),cy.d))));FC.push(1,...cy.p,...cy.d,cy.r,dot(vec(f.normalAt(sp)),rd)>0?1:-1,ar,kFactor(+cy.r.toPrecision(10),t),kFactor(+(cy.r-t).toPrecision(10),t),...sp,0);}
    else FC.push(2,...sp,0,0,1,0,0,ar,0,0,...sp,0);
    for(const e of f.edges){const g=e.geomType,n=g==='LINE'?1:g==='CIRCLE'?8:Math.max(8,Math.min(200,Math.ceil(safe(()=>e.length,size)/(size/300)))),id=ED.length/8,h=e.hashCode;ED.push(i,-1,g==='CIRCLE'?1:0,PT.length/3,n+1,0,0,0);for(let k=0;k<=n;k++)PT.push(...vec(e.pointAt(k/n)));HM.has(h)?HM.get(h).push(id):HM.set(h,[id]);}});
  for(const L of HM.values())if(L.length===2){ED[8*L[0]+1]=L[1];ED[8*L[1]+1]=L[0];}
  const H=sm(),ex=H.ex;ex.sm_load(fs.length,ED.length/8,PT.length/3);H.v(1).set(FC);H.v(2).set(ED);H.v(3).set(PT);H.v(4).set([t,o.K>0?o.K:-1,o.start??-1,0,0,0,0,0,0,0,0,0]);
  const st=ex.sm_unfold(),OI=H.v(7),OS=H.v(5),OB=H.v(6),segs=new Map(),bends=[];
  for(let i=0;i<OS.length;i+=6){const e=OS[i];segs.has(e)||segs.set(e,[]);segs.get(e).push([[OS[i+1],OS[i+2]],[OS[i+3],OS[i+4]],OS[i+5]]);}
  for(let i=0;i<OB.length;i+=12){const b=OB.subarray(i,i+12);bends.push({a:[b[1],b[2]],b:[b[3],b[4]],angle:b[5],dir:b[6]>0?'up':'down',r:b[7],ba:b[8],K:b[9],len:b[10],depth:b[11]});}
  return{status:st,faces:OI[0],area:OI[1],segs:[...segs.values()],bends};
}
export const flatArea=loops=>{const A=loops.map(l=>Math.abs(loopArea(l))).sort((a,b)=>b-a);return A.length?A[0]-A.slice(1).reduce((s,v)=>s+v,0):0;};
const PLAN_MSG=(c,q,o,fu)=>c===1?'flange '+(q.j+1)+' part '+o[17]+' is too short for its bends; it needs at least '+fu(o[18]):c===2?'flange '+(q.j+1)+' is on an edge that does not exist':c===3?'flange '+(q.j+1)+' angles must be above 0 and at most 180 degrees':c===4?'the flange on edge '+q.g+' has no room left between the bends next to it; shorten it, reduce the radius or use open corners':'two flanges are on edge '+q.g+'; use one flange with return segments instead';
export function sheetPart(f,body,KX){
  const P=KX.planeFrom(f,body),t=+f.t,r=+(f.r??t),sg=f.dir==='-'?-1:1,yv=cross(P.n,P.x),fu=KX.fu;if(!(t>0))throw new Error('thickness must be above 0');if(!(r>=0))throw new Error('bend radius must be 0 or more');
  const base=KX.profileDrawing(f.shapes).sketchOnPlane(new R.Plane(sg>0?P.o:add(P.o,mul(P.n,-t)),P.x,P.n)).extrude(t),pr=p=>{const d=sub(p,P.o);return[dot(d,P.x),dot(d,yv)];},to3=(x,y)=>add(add(P.o,mul(P.x,x)),mul(yv,y));
  const cap=base.faces.filter(q=>q.geomType==='PLANE'&&dot(nrm(vec(q.normalAt(q.center))),P.n)>0.999).map(q=>[q,R.measureArea(q.clone())]).sort((a,b)=>b[1]-a[1])[0];if(!cap)throw new Error('the base outline did not make a flat plate');
  const es=cap[0].outerWire().edges.map(e=>({ty:e.geomType,a:pr(vec(e.pointAt(0))),b:pr(vec(e.pointAt(1)))}));let L=[es.shift()];
  while(es.length){const end=L[L.length-1].b;let bi=0,rv=false,bd=Infinity;es.forEach((s,i)=>{const da=d2(s.a,end),db=d2(s.b,end);da<bd&&(bd=da,bi=i,rv=false);db<bd&&(bd=db,bi=i,rv=true);});const s=es.splice(bi,1)[0];L.push(rv?{ty:s.ty,a:s.b,b:s.a}:s);}
  L=L.reduce((s,q)=>s+q.a[0]*q.b[1]-q.b[0]*q.a[1],0)<0?L.reverse().map(s=>({ty:s.ty,a:s.b,b:s.a})):L;
  const n=L.length,G0=L.map((s,i)=>({...s,i})).filter(s=>s.ty==='LINE').map(s=>({a:s.a,b:s.b,ls:L[(s.i-1+n)%n].ty==='LINE',le:L[(s.i+1)%n].ty==='LINE'})),my=s=>(s.a[1]+s.b[1])/2,mx=s=>(s.a[0]+s.b[0])/2;if(!G0.length)throw new Error('the base outline needs straight edges to put flanges on');
  const m0=G0.reduce((bi,s,i)=>my(s)<my(G0[bi])-1e-9||(Math.abs(my(s)-my(G0[bi]))<=1e-9&&mx(s)<mx(G0[bi]))?i:bi,0),GE=[...G0.slice(m0),...G0.slice(0,m0)];
  const eix=v=>{if(v==='all')return GE.map((_,i)=>i);if(typeof v==='number'||/^\d+$/.test(String(v))){const i=+v;if(i<0||i>=GE.length)throw new Error('flange edge '+v+' does not exist; the outline has '+GE.length+' straight edges, numbered from 0');return[i];}const d=EDGE_DIR[v];if(!d)throw new Error('flange edge must be front, right, back, left, all or an edge number');let bi=-1,bl=0;GE.forEach((s,i)=>{const l=d2(s.a,s.b),on=[(s.b[1]-s.a[1])/l,(s.a[0]-s.b[0])/l];on[0]*d[0]+on[1]*d[1]>0.7&&l>bl&&(bl=l,bi=i);});if(bi<0)throw new Error('no straight edge of the outline faces '+v);return[bi];};
  const FS=(f.flanges||[]).flatMap((q,j)=>eix(q.edge??'front').map(g=>({g,j,up:q.dir!=='down',r:+(q.r||0),segs:[[+q.len,Math.abs(+(q.angle??90))],...(q.then||[]).map(s=>[+s.len,+(s.angle??90)])]})));
  FS.forEach(q=>{if(q.segs.length>7)throw new Error('flange '+(q.j+1)+' has more than 7 parts');if(q.segs.some(s=>!(s[0]>0)))throw new Error('flange '+(q.j+1)+' lengths must be above 0');});
  const H=sm(),ex=H.ex;ex.sm_load_plan(GE.length,FS.length);H.v(8).set(GE.flatMap(s=>[s.a[0],s.a[1],s.b[0],s.b[1],s.ls?1:0,s.le?1:0,0,0]));H.v(9).set(FS.flatMap(q=>{const z=Array(20).fill(0);z[0]=q.g;z[1]=q.up?1:-1;z[2]=q.segs.length;z[3]=q.r;q.segs.forEach((s,k)=>{z[4+2*k]=s[0];z[5+2*k]=s[1];});return z;}));H.v(10).set([t,r,f.corner==='open'?0:1,+(f.gap??KX.M(0.25)),0,0,0,0,0,0,0,0]);
  const st=FS.length?ex.sm_plan():0,OF=FS.length?H.v(11).slice():[],OV=FS.length?H.v(12).slice():[];if(st){const i=FS.findIndex((q,i)=>OF[24*i]===st);throw new Error(PLAN_MSG(st,FS[i],OF.slice(24*i,24*i+24),fu));}
  let part=base;const add2=[];FS.forEach((q,i)=>{const o=24*i,s=GE[q.g],a3=to3(...s.a),u=nrm(sub(to3(...s.b),a3)),mo=cross(u,P.n),dU=q.up?1:-1,off=mul(P.n,dU===sg?sg*t:0),at=e=>new R.Plane(add(add(a3,mul(u,e)),off),mo,u),dr=(pts,bz)=>KX.ringDraw(pts.map(p=>[p[0],-dU*p[1]]),bz||pts.map(()=>0)),[SB,e0,e1,x0,x1,vs,vc]=[1,2,3,4,5,6,7].map(k=>OF[o+k]),C=[0,1,2,3].map(k=>[OF[o+8+2*k],OF[o+9+2*k]]);
    part=part.cut(dr([[-SB,-2*t],[t,-2*t],[t,2*t],[-SB,2*t]]).sketchOnPlane(at(0)).extrude(OF[o+16]));
    const pts=Array.from({length:vc},(_,k)=>[OV[3*(vs+k)],OV[3*(vs+k)+1]]);add2.push(dr(pts,pts.map((p,k)=>{const b=OV[3*(vs+k)+2];return b?dU*b*d2(p,pts[(k+1)%vc])/2:0;})).sketchOnPlane(at(e0)).extrude(e1-e0));
    x0>1e-9&&add2.push(dr(C).sketchOnPlane(at(e0-x0)).extrude(x0));x1>1e-9&&add2.push(dr(C).sketchOnPlane(at(e1)).extrude(x1));});
  for(const p of add2)part=part.fuse(p);
  return{shape:body?body.fuse(part):part,tool:part,dat:{sheet:{t,r,K:+f.K||0,flanges:FS.length,edges:GE.length}}};
}
