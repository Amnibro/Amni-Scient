import * as R from './vendor/replicad.js';
import {add,mul,dot,cross,vec} from './qmath.js';
import {pullSel} from './schema2.js';
import * as D from './datum.js';
export function chamferSides(body,es,f){
  const a=+f.angle||0,d2=+f.d2||0;if(a<0||a>=90)throw new Error('chamfer angle must be above 0 and below 90 degrees');if(d2<0)throw new Error('second chamfer distance must be 0 or more');
  const hs=new Set(es.map(q=>q.e.hashCode)),adj=new Map();
  for(const fc of body.faces)for(const e of fc.edges)hs.has(e.hashCode)&&adj.set(e.hashCode,(adj.get(e.hashCode)||[]).concat([fc]));
  const first=new Map(es.map(q=>{const fs=adj.get(q.e.hashCode)||[];if(fs.length!==2)return[q.e.hashCode,null];const n=fs.map(g=>vec(g.normalAt(q.m))),c=[2,0,1].map(i=>n[0][i]-n[1][i]).find(d=>Math.abs(d)>1e-7)||0;return[q.e.hashCode,fs[(c<0)!==!!f.flip?1:0].hashCode];}));
  return(x,r)=>{const dd=d2?d2*x/r:x;return e=>{const h=first.get(e.hashCode);return h===undefined?null:h===null?x:{...(a?{distance:x,angle:a}:{distances:[x,dd]}),selectedFace:ff=>ff.when(({element})=>element.hashCode===h)};};};
}
export const alongFaces=(oc,F,ax)=>F.filter(q=>q.type==='PLANE'?q.n&&Math.abs(dot(q.n,ax))<1e-7:q.type==='CYLINDRE'&&Math.abs(Math.abs(dot(D.cylGeom(oc,q.f,'CYLINDRE').d,ax))-1)<1e-7);
function draft(f,body,K){
  const oc=R.getOC(),p=K.AXV(f.pull||'+Z'),a=+f.angle;if(!isFinite(a)||Math.abs(a)>=90)throw new Error('draft angle must be between -90 and 90 degrees');if(!a)return{shape:body};
  const bb=K.bboxOf(body),pr=[0,1,2,3,4,5,6,7].map(q=>dot([q&1?bb.max[0]:bb.min[0],q&2?bb.max[1]:bb.min[1],q&4?bb.max[2]:bb.min[2]],p)),lo=Math.min(...pr),hi=Math.max(...pr),nf=f.neutral==='face'?K.selectFaces(body,f.nface||{side:'-Z'})[0]:null;
  if(f.neutral==='face'&&!nf)throw new Error('the neutral face was not found');
  const h=f.neutral==='top'?hi:f.neutral==='mid'?(lo+hi)/2:f.neutral==='offset'?lo+(+f.offset||0):nf?dot(nf.c,p):lo,o=p.map(v=>v*h);
  const all=K.selectFaces(body,pullSel({faces:f.faces,pull:p})),fs=all.filter(q=>!(q.type==='PLANE'&&q.n&&Math.abs(Math.abs(dot(q.n,p))-1)<1e-7));
  if(!all.length)throw new Error('no faces matched');if(!fs.length)throw new Error('the selected faces face along the pull direction, so they cannot be drafted');
  all.length>fs.length&&K.NOTES.push({k:'faces',field:'faces',msg:(all.length-fs.length)+' selected face(s) are square to the pull direction and were left as they are'});
  const sg=Math.sign(a),run=x=>{const D=new oc.BRepOffsetAPI_DraftAngle(body.wrapped),dir=new oc.gp_Dir(...p),pl=new oc.gp_Pln(new oc.gp_Pnt(...o),dir);try{for(const q of fs){D.Add(q.f.wrapped,dir,x*sg*Math.PI/180,pl,true);if(!D.AddDone())throw new Error('draft could not tilt one of the faces');}D.Build(new oc.Message_ProgressRange());if(!D.IsDone())throw new Error('draft failed');const r=R.cast(D.Shape());if(!(Math.abs(K.volOf(r))>1e-12))throw new Error('empty');return r;}finally{D.delete();dir.delete();pl.delete();}},n0=K.NOTES.length,r=K.upTo(run,Math.abs(a),7,'Draft angle','angle','the faces run into each other beyond this angle','°').r;
  K.NOTES.slice(n0).forEach(q=>{q.v!=null&&(q.v*=sg);(q.fix||[]).forEach(x=>{x.v*=sg;x.t='Use '+x.v+'°';});});
  return{shape:r};
}
function rib(f,body,K){
  if(!body)throw new Error('a rib needs a part to attach to');
  const P=K.planeFrom(f,body),y=cross(P.n,P.x),raw=((f.sketch&&f.shapes&&f.shapes[0]&&f.shapes[0].pts)||f.pts||[]).filter(Array.isArray).map(p=>[+p[0],+p[1]]),size=K.sizeOf(body),pts=raw.filter((p,i)=>!i||Math.hypot(p[0]-raw[i-1][0],p[1]-raw[i-1][1])>size*1e-9);
  if(pts.length<2||pts.some(p=>!isFinite(p[0]+p[1])))throw new Error('a rib needs a line with two or more different points');
  const t=Math.abs(+f.t||0);if(!(t>0))throw new Error('rib thickness must be above 0');
  const sd=f.side==='+'?[0,t]:f.side==='-'?[-t,0]:[-t/2,t/2],W=p=>add(add(P.o,mul(P.x,p[0])),mul(y,p[1])),tn=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[(b[0]-a[0])/l,(b[1]-a[1])/l];};
  const pl=pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]):0,0),D=3*(size+pl),t0=tn(pts[0],pts[1]),t1=tn(pts[pts.length-2],pts[pts.length-1]),n=pts.length,L=pts.map(p=>p.slice());
  L[0]=[pts[0][0]-t0[0]*D,pts[0][1]-t0[1]*D];L[n-1]=[pts[n-1][0]+t1[0]*D,pts[n-1][1]+t1[1]*D];
  const ch=Math.hypot(pts[n-1][0]-pts[0][0],pts[n-1][1]-pts[0][1])>size*1e-7?tn(pts[0],pts[n-1]):t0,left=[-ch[1],ch[0]],base=new R.Plane(add(P.o,mul(P.n,sd[0])),P.x,P.n),tol=size*1e-7+1e-9;
  const mids=pts.slice(1).map((p,i)=>W([(p[0]+pts[i][0])/2,(p[1]+pts[i][1])/2])),lineMax=(d)=>Math.max(...pts.map(p=>dot(W(p),d)));
  const slab=dir=>{const sol=[];for(let i=0;i+1<n;i++){const a=L[i],b=L[i+1],Q=[a,b,[b[0]+dir[0]*D,b[1]+dir[1]*D],[a[0]+dir[0]*D,a[1]+dir[1]*D]],ar=Q.reduce((s,p,j)=>s+p[0]*Q[(j+1)%4][1]-Q[(j+1)%4][0]*p[1],0);if(Math.abs(ar)<1e-12*D*D)continue;const O=ar<0?Q.slice().reverse():Q;let pen=R.draw(O[0]);for(let j=1;j<4;j++)pen=pen.lineTo(O[j]);sol.push(pen.close().sketchOnPlane(base).extrude(sd[1]-sd[0]));}if(!sol.length)throw new Error('the rib line cannot grow in that direction');return sol.reduce((u,v)=>u.fuse(v));};
  const grow=dir=>{const S=slab(dir),rest=S.cut(body),sol=solidsOf(rest),wd=add(mul(P.x,dir[0]),mul(y,dir[1])),lim=lineMax(wd)+0.9*D,hit=sol.filter(s=>mids.some(m=>K.pdist(m,s)<tol)),bb=hit.map(s=>s.boundingBox.bounds),far=bb.some(b=>Math.max(...[0,1,2,3,4,5,6,7].map(q=>dot([q&1?b[1][0]:b[0][0],q&2?b[1][1]:b[0][1],q&4?b[1][2]:b[0][2]],wd)))>lim);S.delete();return{hit,ok:hit.length>0&&!far,vol:hit.reduce((s,h)=>s+Math.abs(K.volOf(h)),0)};};
  const cand=f.dir==='+'?[left]:f.dir==='-'?[[-left[0],-left[1]]]:[left,[-left[0],-left[1]]],res=cand.map(grow),good=res.filter(r=>r.ok),use=f.dir==='both'?good:f.dir==='auto'||!f.dir?good.sort((a,b)=>a.vol-b.vol).slice(0,1):good;
  if(!use.length)throw new Error('the rib does not reach the part: move or lengthen the line, or change Grow toward');
  const picks=use.flatMap(r=>r.hit),out=picks.reduce((acc,h)=>acc.fuse(h),body);return{shape:out,tool:picks.length===1?picks[0]:R.makeCompound(picks)};
}
export const solidsOf=b=>b.solids||[b];
const ivol=(a,b)=>{try{return Math.abs(R.measureShapeVolumeProperties(a.intersect(b)).volume);}catch{return 0;}};
function pickBodies(sel,L,K,tools){
  const out=[];for(const s of Array.isArray(sel)?sel:[sel]){
    if(typeof s==='number'){out.push(s);continue;}if(!s||typeof s!=='object')continue;
    if(s.index!=null)out.push(+s.index);
    else if(s.by==='all')L.forEach((_,i)=>out.push(i));
    else if(s.feature!=null){const t=tools[s.feature];if(!t)throw new Error('feature "'+s.feature+'" made no body to select');const v=L.map(b=>ivol(b,t)),m=Math.max(...v);if(!(m>1e-9))throw new Error('no body contains the geometry of feature "'+s.feature+'" any more');out.push(v.indexOf(m));}
    else if(s.largest||s.smallest){const v=L.map(b=>Math.abs(K.volOf(b))),m=s.largest?Math.max(...v):Math.min(...v);out.push(v.indexOf(m));}
    else if(s.pts||s.by==='pick'){for(const p of s.pts||[]){let bi=-1,bd=1e18;L.forEach((b,i)=>{const d=K.pdist(p,b);d<bd&&(bd=d,bi=i);});bi>=0&&out.push(bi);}}
  }
  return[...new Set(out)];
}
function combine(f,body,K,doc,tools){
  if(!body)throw new Error('combine needs bodies to work on');const L=solidsOf(body);if(L.length<2)throw new Error('the part has only one body, so there is nothing to combine');
  const kind=f.kind||'union',t=pickBodies(f.target===undefined?{largest:true}:f.target,L,K,tools)[0];if(t==null||!L[t])throw new Error('the target body was not found; the part has '+L.length+' bodies (index 0 to '+(L.length-1)+')');
  const ts=pickBodies(f.tools===undefined||f.tools===null||Array.isArray(f.tools)&&!f.tools.length?{by:'all'}:f.tools,L,K,tools).filter(i=>i!==t&&L[i]);if(!ts.length)throw new Error('pick at least one other body to combine with');
  let res=L[t];for(const i of ts)res=kind==='subtract'?res.cut(L[i]):kind==='intersect'?res.intersect(L[i]):res.fuse(L[i]);
  const rs=solidsOf(res);if(!rs.length||!(rs.reduce((a,x)=>a+Math.abs(K.volOf(x)),0)>1e-12))throw new Error(kind==='intersect'?'the bodies do not overlap, so the intersection is empty':'the result is empty');
  const rest=L.filter((_,i)=>i!==t&&(!ts.includes(i)||f.keep&&kind!=='union')),out=[...rs,...rest],warn=kind==='union'&&rs.length>1?'the bodies do not touch, so they stay separate':null;
  return{shape:out.length===1?out[0]:R.makeCompound(out),warn};
}
const datum=(kind,fr)=>(f,body,K)=>({shape:body,dat:{kind,...fr(f,body,K)}});
export const FEAT2={draft,rib,combine,datum_plane:datum('plane',D.frameOfPlane),datum_axis:datum('axis',D.frameOfAxis),datum_point:datum('point',D.frameOfPoint)};
