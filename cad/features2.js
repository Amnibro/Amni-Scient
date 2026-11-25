import * as R from './vendor/replicad.js';
import {add,mul,dot,cross,vec} from './qmath.js';
import {pullSel} from './schema2.js';
import {sheetPart} from './sheet.js';
import * as D from './datum.js';
import {maxOf,minOf} from './minmax.js';
import {FEDIT} from './faceedit.js';
import {FSURF} from './surfacing.js';
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
  const bb=K.bboxOf(body),pr=[0,1,2,3,4,5,6,7].map(q=>dot([q&1?bb.max[0]:bb.min[0],q&2?bb.max[1]:bb.min[1],q&4?bb.max[2]:bb.min[2]],p)),lo=minOf(pr),hi=maxOf(pr),nf=f.neutral==='face'?K.selectFaces(body,f.nface||{side:'-Z'})[0]:null;
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
  if(Math.abs(+f.h||0)>0)return stand(f,body,K,P,y,pts,t,size);
  const sd=f.side==='+'?[0,t]:f.side==='-'?[-t,0]:[-t/2,t/2],W=p=>add(add(P.o,mul(P.x,p[0])),mul(y,p[1])),tn=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[(b[0]-a[0])/l,(b[1]-a[1])/l];};
  const pl=pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]):0,0),D=3*(size+pl),t0=tn(pts[0],pts[1]),t1=tn(pts[pts.length-2],pts[pts.length-1]),n=pts.length,L=pts.map(p=>p.slice());
  L[0]=[pts[0][0]-t0[0]*D,pts[0][1]-t0[1]*D];L[n-1]=[pts[n-1][0]+t1[0]*D,pts[n-1][1]+t1[1]*D];
  const ch=Math.hypot(pts[n-1][0]-pts[0][0],pts[n-1][1]-pts[0][1])>size*1e-7?tn(pts[0],pts[n-1]):t0,left=[-ch[1],ch[0]],base=new R.Plane(add(P.o,mul(P.n,sd[0])),P.x,P.n),tol=size*1e-7+1e-9;
  const mids=pts.slice(1).map((p,i)=>W([(p[0]+pts[i][0])/2,(p[1]+pts[i][1])/2])),lineMax=(d)=>maxOf(pts.map(p=>dot(W(p),d)));
  const slab=dir=>{const sol=[];for(let i=0;i+1<n;i++){const a=L[i],b=L[i+1],Q=[a,b,[b[0]+dir[0]*D,b[1]+dir[1]*D],[a[0]+dir[0]*D,a[1]+dir[1]*D]],ar=Q.reduce((s,p,j)=>s+p[0]*Q[(j+1)%4][1]-Q[(j+1)%4][0]*p[1],0);if(Math.abs(ar)<1e-12*D*D)continue;const O=ar<0?Q.slice().reverse():Q;let pen=R.draw(O[0]);for(let j=1;j<4;j++)pen=pen.lineTo(O[j]);sol.push(pen.close().sketchOnPlane(base).extrude(sd[1]-sd[0]));}if(!sol.length)throw new Error('the rib line cannot grow in that direction');return sol.reduce((u,v)=>u.fuse(v));};
  const grow=dir=>{const S=slab(dir),rest=S.cut(body),sol=solidsOf(rest),wd=add(mul(P.x,dir[0]),mul(y,dir[1])),lim=lineMax(wd)+0.9*D,hit=sol.filter(s=>mids.some(m=>K.pdist(m,s)<tol)),bb=hit.map(s=>s.boundingBox.bounds),far=bb.some(b=>maxOf([0,1,2,3,4,5,6,7].map(q=>dot([q&1?b[1][0]:b[0][0],q&2?b[1][1]:b[0][1],q&4?b[1][2]:b[0][2]],wd)))>lim);S.delete();return{hit,ok:hit.length>0&&!far,vol:hit.reduce((s,h)=>s+Math.abs(K.volOf(h)),0)};};
  const cand=f.dir==='+'?[left]:f.dir==='-'?[[-left[0],-left[1]]]:[left,[-left[0],-left[1]]],res=cand.map(grow),good=res.filter(r=>r.ok),use=f.dir==='both'?good:f.dir==='auto'||!f.dir?good.sort((a,b)=>a.vol-b.vol).slice(0,1):good;
  if(!use.length)throw new Error('the rib does not reach the part: draw the line across an inside corner or opening so the part closes it off, or set Height to stand the rib on a face');
  const picks=use.flatMap(r=>r.hit),out=picks.reduce((acc,h)=>acc.fuse(h),body);return{shape:out,tool:picks.length===1?picks[0]:R.makeCompound(picks)};
}
function stand(f,body,K,P,y,pts,t,sz){
  const n=pts.length,h=Math.abs(+f.h),W=p=>add(add(P.o,mul(P.x,p[0])),mul(y,p[1])),pl=pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]):0,0),D=3*(sz+pl),tol=sz*1e-7+1e-9,sd=f.side==='+'?[0,t]:f.side==='-'?[-t,0]:[-t/2,t/2],tn=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[(b[0]-a[0])/l,(b[1]-a[1])/l];},nl=(a,b)=>{const d=tn(a,b);return[-d[1],d[0]];},at=(p,m,s)=>[p[0]+m[0]*s,p[1]+m[1]*s],T0=tn(pts[0],pts[1]),T1=tn(pts[n-2],pts[n-1]),wd=v=>add(mul(P.x,v[0]),mul(y,v[1])),d0=wd([-T0[0],-T0[1]]),d1=wd(T1),lim0=dot(W(pts[0]),d0)+D/2,lim1=dot(W(pts[n-1]),d1)+D/2,mids=pts.slice(1).map((p,i)=>W([(p[0]+pts[i][0])/2,(p[1]+pts[i][1])/2])),onPart=mids.some(m=>K.pdist(m,body)<tol),ext=(b,d)=>maxOf([0,1,2,3,4,5,6,7].map(q=>dot([q&1?b[1][0]:b[0][0],q&2?b[1][1]:b[0][1],q&4?b[1][2]:b[0][2]],d)));
  const strip=(up,e0,e1)=>{const base=new R.Plane(add(P.o,mul(P.n,up[0])),P.x,P.n),L=pts.map(p=>p.slice()),sol=[],poly=Q=>{const ar=Q.reduce((s,p,j)=>s+p[0]*Q[(j+1)%Q.length][1]-Q[(j+1)%Q.length][0]*p[1],0);if(Math.abs(ar)<1e-12*D*D)return;const O=ar<0?Q.slice().reverse():Q;let pen=R.draw(O[0]);for(let j=1;j<O.length;j++)pen=pen.lineTo(O[j]);sol.push(pen.close().sketchOnPlane(base).extrude(up[1]-up[0]));};e0&&(L[0]=at(pts[0],T0,-D));e1&&(L[n-1]=at(pts[n-1],T1,D));for(let i=0;i+1<n;i++){const m=nl(pts[i],pts[i+1]);poly([at(L[i],m,sd[0]),at(L[i+1],m,sd[0]),at(L[i+1],m,sd[1]),at(L[i],m,sd[1])]);}for(let i=1;i+1<n;i++){const m1=nl(pts[i-1],pts[i]),m2=nl(pts[i],pts[i+1]);for(const s of sd)s&&poly([pts[i],at(pts[i],m1,s),at(pts[i],m2,s)]);}return sol.reduce((u,v)=>u.fuse(v));};
  const pieces=(up,e0,e1)=>{const S=strip(up,e0,e1);if(!e0&&!e1)return{hit:[S],f0:false,f1:false,e:false};const hit=solidsOf(S.cut(body)).filter(s=>mids.some(m=>K.pdist(m,s)<tol)),bb=hit.map(s=>s.boundingBox.bounds);S.delete();return{hit,f0:!hit.length||bb.some(b=>ext(b,d0)>lim0),f1:!hit.length||bb.some(b=>ext(b,d1)>lim1),e:true};},fit=up=>{let r=pieces(up,true,true);r.f0||r.f1?r=pieces(up,!r.f0,!r.f1):0;r.f0||r.f1?r=pieces(up,false,false):0;return r;};
  const auto=!['-','+','both'].includes(f.dir),inUp=auto&&onPart&&(()=>{const S=strip([0,Math.min(h,sz*1e-2)],false,false),a=Math.abs(K.volOf(S)),v=ivol(S,body);S.delete();return v>a/2;})(),ups=f.dir==='-'?[[-h,0]]:f.dir==='both'?[[-h,h]]:f.dir==='+'?[[0,h]]:inUp?[[-h,0],[0,h]]:[[0,h],[-h,0]];let best=null;for(const up of ups){const r=fit(up);if(onPart||r.e||ups.length===1){best=r;break;}best=best||r;}
  const out=best.hit.reduce((acc,s)=>acc.fuse(s),body);return{shape:out,tool:best.hit.length===1?best.hit[0]:R.makeCompound(best.hit)};
}
export function ribGuess(f,body,K,refs){
  const sz=K.sizeOf(body),e=sz*1e-6,L=refs.filter(r=>r.k==='line'&&r.a&&r.b),eq=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1])<e,c=[],seen=new Set();if(!L.length)return null;const us=L.flatMap(r=>[r.a[0],r.b[0]]),vs=L.flatMap(r=>[r.a[1],r.b[1]]),u0=minOf(us),u1=maxOf(us),v0=minOf(vs),v1=maxOf(vs),edge=P=>Math.abs(P[0]-u0)<e||Math.abs(P[0]-u1)<e||Math.abs(P[1]-v0)<e||Math.abs(P[1]-v1)<e;
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)for(const[P,A]of[[L[i].a,L[i].b],[L[i].b,L[i].a]])for(const[Q,B]of[[L[j].a,L[j].b],[L[j].b,L[j].a]]){if(!eq(P,Q))continue;const la=Math.hypot(A[0]-P[0],A[1]-P[1]),lb=Math.hypot(B[0]-P[0],B[1]-P[1]);if(la<e||lb<e)continue;const ua=[(A[0]-P[0])/la,(A[1]-P[1])/la],ub=[(B[0]-P[0])/lb,(B[1]-P[1])/lb];if(Math.abs(ua[0]*ub[1]-ua[1]*ub[0])<0.1)continue;const d=0.4*Math.min(la,lb),k=[P,ua,ub].flat().map(v=>v.toFixed(5)).join();if(seen.has(k))continue;seen.add(k);c.push({d,o:edge(P)?1:0,pts:[[P[0]+ua[0]*d,P[1]+ua[1]*d],[P[0]+ub[0]*d,P[1]+ub[1]*d]]});}
  for(const g of c.sort((a,b)=>a.o-b.o||b.d-a.d).slice(0,7)){try{const r=rib({...f,pts:g.pts,t:+f.t>0?f.t:g.d/5,side:'both',dir:'auto',h:0},body,K);try{r.shape.delete();}catch{}return{pts:g.pts,t:g.d/4};}catch{}}
  const P=K.planeFrom(f,body),y=cross(P.n,P.x),cu=(u0+u1)/2,cv=(v0+v1)/2,w=(u1-u0)/4,m=add(add(P.o,mul(P.x,cu)),mul(y,cv));return K.pdist(m,body)<sz*1e-7+1e-9?{pts:[[cu-w,cv],[cu+w,cv]],h:Math.min(u1-u0,v1-v0)/4}:null;
}
export const solidsOf=b=>b.solids||[b];
const ivol=(a,b)=>{try{return Math.abs(R.measureShapeVolumeProperties(a.intersect(b)).volume);}catch{return 0;}};
function pickBodies(sel,L,K,tools){
  const out=[];for(const s of Array.isArray(sel)?sel:[sel]){
    if(typeof s==='number'){out.push(s);continue;}if(!s||typeof s!=='object')continue;
    if(s.index!=null)out.push(+s.index);
    else if(s.by==='all')L.forEach((_,i)=>out.push(i));
    else if(s.feature!=null){const t=tools[s.feature];if(!t)throw new Error('feature "'+s.feature+'" made no body to select');const v=L.map(b=>ivol(b,t)),m=maxOf(v);if(!(m>1e-9))throw new Error('no body contains the geometry of feature "'+s.feature+'" any more');out.push(v.indexOf(m));}
    else if(s.largest||s.smallest){const v=L.map(b=>Math.abs(K.volOf(b))),m=s.largest?maxOf(v):minOf(v);out.push(v.indexOf(m));}
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
export const FEAT2={sketch:(f,b)=>({shape:b}),draft,rib,combine,sheet:sheetPart,datum_plane:datum('plane',D.frameOfPlane),datum_axis:datum('axis',D.frameOfAxis),datum_point:datum('point',D.frameOfPoint),...FEDIT,...FSURF};
