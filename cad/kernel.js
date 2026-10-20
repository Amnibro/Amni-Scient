import * as R from './vendor/replicad.js';
import {evalExpr,resolveParams} from './expr.js';
import {sketchShapes,refit} from './sketch.js';
import {chainShapes} from './sketch2.js';
import {NAMED,reset as datReset,put as datPut,datumPlane,list as datList,axisRef} from './datum.js';
import {pathPolys,ProfileError,selfCross} from './polyfix.js';
import {airfoilPoints} from './airfoil.js';
import {HOLESTD_IN,THREADSTD,HOLESTD} from './standards.js';
import {profile,bitSpec,bitVolume,knifeSpec,flat,edgeFrame} from './cutter.js';
import {MATS,shapeLimits,clean,fixPre} from './schema.js';
import {chamferSides,alongFaces,FEAT2} from './features2.js';
export {evalExpr,resolveParams,HOLESTD_IN,THREADSTD,HOLESTD};
const STRKEYS=new Set(['feature','datum','mode','from','pa','pb','pull','neutral','nface','face','faces','edges','id','type','name','op','plane','dir','kind','axis','side','by','k','text','blob','note','normal','origin','of','material','std','fit','keep','hand','color','fmt','code','prof','shank','brg','spindle','head']);
let UNITS='mm',NOTES=[];
const M=v=>UNITS==='in'?clean(v/25.4):v,fu=(v,u=UNITS)=>+(+v).toFixed(4)+(u==='°'?'°':' '+u),note=(L,pre='')=>{for(const q of L)NOTES.push({...q,field:pre+q.k,fix:(q.fix||[]).map(x=>fixPre(x,pre))});},flo3=v=>{const q=10**(Math.floor(Math.log10(v))-2);return+(Math.floor(v/q+1e-9)*q).toFixed(9);};
const AXV=a=>Array.isArray(a)?nrm(a.map(Number)):AX[a||'Z']||AX.Z,FNAME={top:'+Z',bottom:'-Z',front:'-Y',back:'+Y',right:'+X',left:'-X'};
function upTo(fn,v,steps,label,k,why,u){try{return{r:fn(v)};}catch(e0){let lo=0,hi=v,ok=null;for(let i=0;i<steps;i++){const m=(lo+hi)/2;try{const r=fn(m);ok&&ok.r!==r&&del(ok.r);ok={m,r};lo=m;}catch{hi=m;}}if(!ok)throw e0;let q=flo3(ok.m),r=ok.r;if(q<ok.m){try{const r2=fn(q);del(r);r=r2;}catch{q=ok.m;}}NOTES.push({k,field:k,v:q,msg:label+' limited to '+fu(q,u)+' ('+why+')',fix:[{t:'Use '+fu(q,u),k,v:q}]});return{r};}}
const del=o=>{try{o&&o.delete&&o.delete();}catch{}};
const ucv=(from)=>from===UNITS?1:from==='in'?25.4:1/25.4;
function res(v,scope,k){
  if(Array.isArray(v))return v.map(x=>res(x,scope,k));
  if(v&&typeof v==='object'){const o={};for(const kk in v)o[kk]=res(v[kk],scope,kk);return o;}
  if(typeof v==='string'&&!STRKEYS.has(k))return evalExpr(v,scope);
  return v;
}
const AX={X:[1,0,0],Y:[0,1,0],Z:[0,0,1],'+X':[1,0,0],'+Y':[0,1,0],'+Z':[0,0,1],'-X':[-1,0,0],'-Y':[0,-1,0],'-Z':[0,0,-1]};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l]},dist=(a,b)=>Math.hypot(...sub(a,b));
const V=v=>[v.x,v.y,v.z];
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
  for(const s0 of sels){
    if(typeof s0==='number'){F[s0]&&out.add(s0);continue;}
    const s=typeof s0==='string'?{side:FNAME[s0.toLowerCase()]||s0}:s0,by=s.by||(s.at?'at':s.side?'side':s.pts?'pick':s.normal?'normal':s.dir?'dir':s.type?'type':'all');
    let hit=[];
    if(by==='all')hit=F;
    else if(by==='at'){const nn=nrm(Array.isArray(s.normal)?s.normal.map(Number):AX[s.normal]||[0,0,1]);let best=null,bs=1e18;for(const q of F){if(q.type!=='PLANE'||!q.n||dot(q.n,nn)<0.99)continue;const off=dot(sub(s.at,q.c),q.n),sc=pdist(sub(s.at,q.n.map(v=>v*off)),q.f)*4+Math.abs(off);sc<bs&&(bs=sc,best=q);}best&&hit.push(best);}
    else if(by==='side'){const{ax,i,ext,tol}=sideTest(s.side,shape);hit=F.filter(q=>q.n&&dot(q.n,ax)>0.999&&Math.abs(q.c[i]-ext)<Math.max(tol,1e-3));}
    else if(by==='normal'){const ax=nrm(Array.isArray(s.normal)?s.normal:AX[s.normal]);hit=F.filter(q=>q.n&&dot(q.n,ax)>0.999);}
    else if(by==='dir')hit=alongFaces(R.getOC(),F,nrm(Array.isArray(s.dir)?s.dir.map(Number):AX[s.dir]||AX.Z));
    else if(by==='type')hit=F.filter(q=>q.type===String(s.type).toUpperCase().replace('CYLINDER','CYLINDRE'));
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
    if(typeof s==='number'){E[s]&&out.add(s);continue;}
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
  if(f.plane==='datum')return datumPlane(f);
  if(f.face&&(f.plane===undefined||f.plane==='face')){
    if(!shape)throw new Error('sketch on face needs an existing body');
    const s=f.face,one=x=>{const q=selectFaces(shape,x)[0];if(!q)throw new Error('sketch face not found');if(q.type!=='PLANE')throw new Error('sketch face must be flat');return q;};let n,c,x=null;
    if(s.mid){const[a,b]=s.mid.map(one);if(Math.abs(dot(a.n,b.n))<0.999)throw new Error('a midplane needs two parallel flat faces');n=nrm(a.n);c=a.c.map((v,i)=>v+n[i]*dot(sub(b.c,a.c),n)/2);}
    else if(s.edge){const e=selectEdges(shape,s.edge)[0];if(!e||e.type!=='LINE')throw new Error('an angled plane needs a straight edge');const d=nrm(sub(e.b,e.a)),ad=s.ref?one(s.ref):faceList(shape).find(g=>g.type==='PLANE'&&g.n&&Math.abs(dot(g.n,d))<1e-6&&pdist(e.m,g.f)<sizeOf(shape)*1e-6);if(!ad)throw new Error('no flat face next to that edge to measure the angle from');const t=(+s.angle||0)*Math.PI/180,w=cross(d,ad.n);n=nrm(ad.n.map((v,i)=>v*Math.cos(t)+w[i]*Math.sin(t)));c=e.m;x=d;}
    else{const q=one(s);n=nrm(q.n);c=q.c;}
    x=x||(Math.abs(n[2])>0.9?[1,0,0]:Math.abs(n[0])>0.9?[0,1,0]:[1,0,0]);x=nrm(sub(x,n.map(v=>v*dot(x,n))));
    const o=s.origin==='center'?c:projOnPlane([0,0,0],c,n),off=n.map(v=>v*(f.offset||0));
    return{o:o.map((v,i)=>v+off[i]),n,x,c:c.map((v,i)=>v+off[i])};
  }
  const P=NAMED[f.plane||'XY'];if(!P)throw new Error('plane must be XY, XZ or YZ');
  const o=P.n.map(v=>v*(f.offset||0));return{o,n:P.n,x:P.x,c:o};
}
function projOnPlane(p,o,n){const d=dot(sub(p,o),n);return sub(p,n.map(v=>v*d));}
const circ2=(a,b,c)=>{const d=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]));if(Math.abs(d)<1e-14)return null;const A=a[0]**2+a[1]**2,B=b[0]**2+b[1]**2,C=c[0]**2+c[1]**2;return[(A*(b[1]-c[1])+B*(c[1]-a[1])+C*(a[1]-b[1]))/d,(A*(c[0]-b[0])+B*(a[0]-c[0])+C*(b[0]-a[0]))/d];};
function projRefs(body,P){const y=cross(P.n,P.x),uv=p=>{const d=sub(p,P.o);return[dot(d,P.x),dot(d,y),dot(d,P.n)];},sz=sizeOf(body),tol=sz*1e-5+1e-9,on=[],pr=[],r9=v=>+v.toFixed(9),q2=q=>[r9(q[0]),r9(q[1])];
  for(const e of body.edges){const t=e.geomType,S=t==='LINE'?[uv(V(e.startPoint)),uv(V(e.endPoint))]:Array.from({length:17},(_,i)=>uv(V(e.pointAt(i/16)))),isOn=S.every(q=>Math.abs(q[2])<tol),L=isOn?on:pr,flatW=S.every(q=>Math.abs(q[2]-S[0][2])<tol),cl=Math.hypot(S[0][0]-S[S.length-1][0],S[0][1]-S[S.length-1][1])<tol;
    if(t==='LINE'){Math.hypot(S[0][0]-S[1][0],S[0][1]-S[1][1])>tol&&L.push({k:'line',a:q2(S[0]),b:q2(S[1]),on:isOn});continue;}
    const c=t==='CIRCLE'&&flatW?circ2(S[0],S[5],S[11]):null;if(c){const r=Math.hypot(S[0][0]-c[0],S[0][1]-c[1]);if(cl){L.push({k:'circle',c:q2(c),r:r9(r),on:isOn});continue;}const ccw=(S[8][0]-S[0][0])*(S[16][1]-S[8][1])-(S[8][1]-S[0][1])*(S[16][0]-S[8][0])>0;L.push({k:'arc',a:q2(ccw?S[0]:S[16]),b:q2(ccw?S[16]:S[0]),c:q2(c),r:r9(r),on:isOn});continue;}
    const Q=S.map(q2).filter((q,i,a)=>!i||Math.hypot(q[0]-a[i-1][0],q[1]-a[i-1][1])>tol);Q.length>1&&L.push({k:'poly',p:Q,on:isOn});}
  const key=r=>r.k==='line'?[r.a,r.b].map(q=>q.map(v=>Math.round(v/tol/10)).join(',')).sort().join('|'):r.k==='poly'?'':r.k+(r.c||[]).map(v=>Math.round(v/tol/10)).join(',')+'r'+Math.round((r.r||0)/tol/10)+(r.k==='arc'?r.a.map(v=>Math.round(v/tol/10)).join(','):''),seen=new Set(on.map(key)),out=[...on];
  for(const r of pr){const k=key(r);if(k&&seen.has(k))continue;k&&seen.add(k);out.push(r);if(out.length>420)break;}
  const pc=uv(P.c);out.push({k:'pt',c:[r9(pc[0]),r9(pc[1])],on:true,center:1});return out;}
export function faceBox(refs,all){let u0=1e18,v0=1e18,u1=-1e18,v1=-1e18;for(const r of refs||[]){if(!r.on&&!all)continue;const P=r.k==='circle'?[[r.c[0]-r.r,r.c[1]-r.r],[r.c[0]+r.r,r.c[1]+r.r]]:r.k==='arc'?[r.a,r.b,...[0,1,2,3].map(i=>[r.c[0]+r.r*Math.cos(i*Math.PI/2),r.c[1]+r.r*Math.sin(i*Math.PI/2)]).filter(q=>{const a0=Math.atan2(r.a[1]-r.c[1],r.a[0]-r.c[0]),a1=Math.atan2(r.b[1]-r.c[1],r.b[0]-r.c[0]),t=Math.atan2(q[1]-r.c[1],q[0]-r.c[0]),w=x=>((x%(2*Math.PI))+2*Math.PI)%(2*Math.PI);return w(t-a0)<=w(a1-a0);})]:r.k==='poly'?r.p:r.k==='pt'?[]:[r.a,r.b];for(const q of P){u0=Math.min(u0,q[0]);v0=Math.min(v0,q[1]);u1=Math.max(u1,q[0]);v1=Math.max(v1,q[1]);}}return u1>=u0?{u0,v0,u1,v1}:null;}
function liveSketch(f,body){const has=x=>x&&x.sketch&&x.sketch.ents&&x.sketch.ents.length,sk=has(f),ss=(f.sections||[]).some(has),an=(f.shapes||[]).some(q=>q&&q.from)||(f.pts||[]).some(p=>p&&!Array.isArray(p));if(!sk&&!ss&&!an)return f;f={...f};let refs=null;const RF=()=>{if(refs)return refs;try{refs=body?projRefs(body,planeFrom(f,body)):[];}catch{refs=[];}return refs;},solveSk=x=>{const c=JSON.parse(JSON.stringify(x));c.ents.some(e=>e.ref)&&body&&refit(c,RF());return(f.type==='rib'?chainShapes:sketchShapes)(c);};
  sk&&(f.shapes=solveSk(f.sketch));ss&&(f.sections=f.sections.map(x=>has(x)?{...x,shapes:solveSk(x.sketch)}:x));
  if(an){const B=faceBox(RF(),true);if(!B)throw new Error('distances from edges need the sketch on a flat face of the part');const ax=(o,k0,k1,lo,hi)=>o[k0]!=null?lo+ +o[k0]:o[k1]!=null?hi- +o[k1]:null;f.shapes=f.shapes&&f.shapes.map(q=>{if(!q||!q.from)return q;const o=q.from,x=ax(o,'left','right',B.u0,B.u1),y=ax(o,'bottom','top',B.v0,B.v1),r={...q};delete r.from;x!=null&&(r.x=x);y!=null&&(r.y=y);return r;});f.pts&&(f.pts=f.pts.map(p=>Array.isArray(p)?p:[ax(p,'left','right',B.u0,B.u1)??0,ax(p,'bottom','top',B.v0,B.v1)??0]));}
  return f;}
function okShape(sh){try{const b=bboxOf(sh);return[...b.min,...b.max].every(isFinite)&&isFinite(volOf(sh));}catch{return false;}}
export function frameInfo(f0,body,scope={}){const f=res(f0,scope),P=planeFrom(f,body),y=cross(P.n,P.x),uv=p=>{const d=sub(p,P.o);return[dot(d,P.x),dot(d,y),dot(d,P.n)];},refs=body?projRefs(body,P):[],c=uv(P.c),po=uv(projOnPlane([0,0,0],P.c,P.n));let th=0,ah=0;if(body){const b=bboxOf(body);for(let q=0;q<8;q++){const w=uv([q&1?b.max[0]:b.min[0],q&2?b.max[1]:b.min[1],q&4?b.max[2]:b.min[2]])[2];th=Math.max(th,-w);ah=Math.max(ah,w);}}return{o:P.o,x:P.x,y,n:P.n,refs,face:faceBox(refs.filter(r=>r.k!=='pt')),cuv:[c[0],c[1]],puv:[po[0],po[1]],thick:th,ahead:ah,origin:f.face&&f.face.origin==='center'?'center':'part'};}
export function whichFeature(pt,ids){const tol=(cache.length&&cache[cache.length-1].shape?sizeOf(cache[cache.length-1].shape):1)*2e-3;for(let i=cache.length-1;i>=0;i--){const c=cache[i];if(!c||!c.tool||!ids[i])continue;if(pdist(pt,c.tool)<tol)return ids[i];}return null;}
function ringDraw(pts,bz){
  if(pts.reduce((a,p,i)=>{const q=pts[(i+1)%pts.length];return a+p[0]*q[1]-q[0]*p[1];},0)<0){const n=pts.length,P2=[pts[0]],B2=[];for(let i=n-1;i>=1;i--)P2.push(pts[i]);for(let i=n-1;i>=0;i--)B2.push(-(bz[i]||0));pts=P2;bz=B2;}
  let pen=R.draw(pts[0]);for(let i=1;i<pts.length;i++){const p=pts[i],b=bz[i-1];pen=b?pen.sagittaArcTo(p,b):pen.lineTo(p);}
  return(bz[pts.length-1]?pen.sagittaArcTo(pts[0],bz[pts.length-1]):pen).close();
}
const un=v=>{const l=Math.hypot(v[0],v[1])||1;return[v[0]/l,v[1]/l];};
function bezChain(pen,P,t0,t1){
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1])/3,u=i?un([b[0]-P[i-1][0],b[1]-P[i-1][1]]):t0,v=i+1<P.length-1?un([P[i+2][0]-a[0],P[i+2][1]-a[1]]):t1;pen=pen.cubicBezierCurveTo(b,[a[0]+u[0]*L,a[1]+u[1]*L],[b[0]-v[0]*L,b[1]-v[1]*L]);}
  return pen;
}
function airDraw(s){
  const{up,lo,te}=airfoilPoints(s),n=up.length-1,lr=[...lo].reverse();
  let pen=bezChain(R.draw(up[0]),up,[0,1],un([up[n][0]-up[n-1][0],up[n][1]-up[n-1][1]]));
  pen=te>0?pen.lineTo(lo[n]):pen;
  return bezChain(pen,lr,un([lr[1][0]-lr[0][0],lr[1][1]-lr[0][1]]),[0,1]).close();
}
function splineDraw(s,pre){
  const raw=(s.pts||[]).map(p=>[+p[0],+p[1]]),t=Math.max(1e-9,...raw.map(p=>Math.hypot(...p)))*1e-7,P=raw.filter((p,i)=>i===0||Math.hypot(p[0]-raw[i-1][0],p[1]-raw[i-1][1])>t);P.length>1&&Math.hypot(P[0][0]-P[P.length-1][0],P[0][1]-P[P.length-1][1])<=t&&P.pop();
  if(P.length<3)throw new ProfileError('spline needs 3+ distinct points');if(P.some(p=>!isFinite(p[0])||!isFinite(p[1])))throw new ProfileError('spline has a point that is not a number');
  const n=P.length,T=P.map((p,i)=>{const a=P[(i+n-1)%n],b=P[(i+1)%n];return[(b[0]-a[0])/2,(b[1]-a[1])/2];}),C=P.map((p,i)=>{const q=P[(i+1)%n];return[p,[p[0]+T[i][0]/3,p[1]+T[i][1]/3],[q[0]-T[(i+1)%n][0]/3,q[1]-T[(i+1)%n][1]/3],q];}),smp=[];
  for(const[a,b,c,d]of C)for(let k=0;k<12;k++){const u=k/12,v=1-u;smp.push([v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1]]);}
  const x=selfCross(smp);if(x.bad){NOTES.push({k:'pts',field:pre+'pts',msg:'Spline crosses or touches itself near ('+x.at.map(v=>+v.toFixed(3)).join(', ')+') '+UNITS+'; it was built from its outline instead. Move that point to smooth it.'});return pathPolys({pts:smp},UNITS).map(poly=>poly.map(r=>ringDraw(r.pts,r.bz)).reduce((a,h)=>a.cut(h))).reduce((a,b)=>a.fuse(b));}
  let pen=R.draw(P[0]);for(const[,b,c,d]of C)pen=pen.cubicBezierCurveTo(d,b,c);return pen.close();
}
function drawShape2(s0,pre=''){
  const L=shapeLimits(s0,UNITS),s={...s0};note(L,pre);for(const q of L)s[q.k]=q.v;
  const k=s.k||s.kind||s.type||'rect',pos=(v,nm)=>{if(!(v>0))throw new ProfileError(nm+' must be above 0');return v;};let d;
  if(k==='rect'){d=R.drawRoundedRectangle(pos(s.w,'width'),pos(s.h,'height'),s.r>0?Math.min(s.r,Math.min(s.w,s.h)/2-1e-6):0);}
  else if(k==='circle'){d=R.drawCircle(pos(s.r,'radius'));}
  else if(k==='poly'){d=R.drawPolysides(pos(s.r,'radius'),Math.max(3,Math.round(s.n??6)));}
  else if(k==='slot'){const W=pos(s.h??s.d,'slot width');d=R.drawRoundedRectangle(Math.max(s.l??0,0)+W,W,W/2-1e-6);}
  else if(k==='path'){d=pathPolys(s,UNITS).map(poly=>poly.map(r=>ringDraw(r.pts,r.bz)).reduce((a,h)=>a.cut(h))).reduce((a,b)=>a.fuse(b));}
  else if(k==='airfoil'){d=airDraw({...s,chord:pos(s.chord??M(40),'chord')});}
  else if(k==='text'){d=R.drawText(String(s.text||'A'),{fontSize:pos(s.h??M(10),'text size')});}
  else if(k==='ellipse'){const rx=pos(s.rx??s.ry,'radius x'),ry=pos(s.ry??s.rx,'radius y');d=Math.abs(rx-ry)<=1e-9*Math.max(rx,ry)?R.drawCircle(rx):R.drawEllipse(Math.max(rx,ry),Math.min(rx,ry));if(ry>rx+1e-9*rx)d=d.rotate(90,[0,0]);}
  else if(k==='spline'){d=splineDraw(s,pre);}
  else throw new Error('unknown 2D shape '+k);
  if(s.a)d=d.rotate(s.a,[0,0]);
  return d.translate(s.x||0,s.y||0);
}
function profileDrawing(shapes,pre='',fp='shapes.'){
  if(!shapes||!shapes.length)throw new Error('profile is empty');
  let pos=null;const neg=[];
  for(const[i,s]of shapes.entries()){let d;try{d=drawShape2(s,fp+i+'.');}catch(e){throw e instanceof ProfileError?new ProfileError(pre+'shape '+(i+1)+' '+e.message):e;}if(s.hole)neg.push(d);else pos=pos?pos.fuse(d):d;}
  if(!pos)throw new Error('profile has only holes');
  for(const d of neg)pos=pos.cut(d);
  return pos;
}
function planeObj(P){return new R.Plane(P.o,P.x,P.n);}
function extrudeTool(f,body){
  const P=planeFrom(f,body),dir=f.dir||'+',d0=f.depth??M(10);if(!d0)throw new Error('depth must be above 0');const depth=Math.abs(d0);d0<0&&NOTES.push({k:'depth',field:'depth',v:depth,msg:'Depth '+fu(d0)+' used as '+fu(depth)+'; set Direction to change the side',fix:[{t:'Use '+fu(depth),k:'depth',v:depth}]});
  let o=P.o;
  if(dir==='-')o=o.map((v,i)=>v-P.n[i]*depth);
  else if(dir==='both')o=o.map((v,i)=>v-P.n[i]*depth/2);
  const pl=new R.Plane(o,P.x,P.n);
  const sk=profileDrawing(f.shapes).sketchOnPlane(pl);
  if(!f.draft)return sk.extrude(depth);
  const mk=a=>{const n0=NOTES.length,t=profileDrawing(f.shapes).sketchOnPlane(pl).extrude(depth);NOTES.length=n0;const oc=R.getOC(),xyz=v=>new oc.gp_XYZ(...v),D=new oc.BRepOffsetAPI_DraftAngle(t.wrapped),dr=new oc.gp_Dir(xyz(dir==='-'?P.n.map(v=>-v):P.n)),pln=new oc.gp_Pln(new oc.gp_Pnt(xyz(P.o)),dr);let k=0;for(const fc of t.faces){const q=fc.normalAt();Math.abs(q.x*P.n[0]+q.y*P.n[1]+q.z*P.n[2])<1e-7&&(D.Add(fc.wrapped,dr,a*Math.PI/180,pln,true),k++);}D.Build(new oc.Message_ProgressRange());if(!k||!D.IsDone())throw new Error('draft failed');const r=R.cast(D.Shape());D.delete();return r;},ok=a=>{const t=mk(a);if(!(Math.abs(volOf(t))>1e-12))throw new Error('empty');return t;};
  return f.draft>0?upTo(ok,f.draft,7,'Draft angle','draft','the profile closes up at this depth','°').r:mk(f.draft);
}
function revolveTool(f,body){
  const P=planeFrom(f,body),pl=planeObj(P);
  const sk=profileDrawing(f.shapes).sketchOnPlane(pl);
  const y=cross(P.n,P.x),axis=(f.axis||'y')==='x'?P.x:y;
  return sk.revolve(axis,{origin:P.o,angle:f.angle??360});
}
function primTool(f){
  const t=f.type;
  if(t==='box'){const w=f.w??M(10),d=f.d??w,h=f.h??w;return R.makeBox([(f.x||0)-w/2,(f.y||0)-d/2,f.z||0],[(f.x||0)+w/2,(f.y||0)+d/2,(f.z||0)+h]);}
  if(t==='cylinder'){const ax=AX[f.axis||'Z']||AX.Z,h=f.h??M(10),c=[f.x||0,f.y||0,f.z||0];return R.makeCylinder(f.r??M(5),h,f.center?c.map((v,i)=>v-ax[i]*h/2):c,ax);}
  if(t==='sphere')return R.makeSphere(f.r??M(5)).translate(f.x||0,f.y||0,f.z||0);
  if(t==='cone')return coneSolid(f.r1??M(5),f.r2??0,f.h??M(10),[f.x||0,f.y||0,f.z||0],AX[f.axis||'Z']||AX.Z);
  if(t==='torus'){const c=[f.x||0,f.y||0,f.z||0];return R.drawCircle(f.r2??M(2)).translate(f.r1??M(10),0).sketchOnPlane(new R.Plane(c,[1,0,0],[0,-1,0])).revolve([0,0,1],{origin:c});}
  throw new Error('unknown primitive '+t);
}
export function coneSolid(r1,r2,h,c,ax){
  const x=nrm(Math.abs(ax[2])>0.9?cross(ax,[0,1,0]):cross(ax,[0,0,1])),pts=[[0,0],[r1,0],[r2,h],[0,h]].filter((p,i,a)=>!(i>0&&p[0]===a[i-1][0]&&p[1]===a[i-1][1]));
  let pen=R.draw(pts[0]);for(let i=1;i<pts.length;i++)pen=pen.lineTo(pts[i]);
  return pen.close().sketchOnPlane(new R.Plane(c,x,cross(x,ax))).revolve(ax,{origin:c});
}
function holeStd(f){const inch=HOLESTD_IN[f.std],t0=f.std&&f.std!=='custom'&&(inch||HOLESTD[f.std]);if(!t0)return f;const k=ucv(inch?'in':'mm'),t=t0.map(v=>v*k),fit=f.fit||'clearance';return{...f,d:fit==='tapped'?t[1]:t[0],cb_d:fit==='cbore'?t[2]:0,cb_h:fit==='cbore'?t[3]:0,cs_d:fit==='csink'?t[4]:0,cs_ang:fit==='csink'?(inch?82:90):f.cs_ang};}
function holeTool(f0,body){
  const f=holeStd(f0),P=planeFrom(f,body),d=f.d??M(5),thru=f.thru!==false,depth=thru?sizeOf(body||R.makeBox([0,0,0],[1,1,1]))*3:f.depth??M(10);
  if(!thru&&body){const b=bboxOf(body),th=Math.max(...Array.from({length:8},(_,q)=>dot(sub(P.o,[q&1?b.max[0]:b.min[0],q&2?b.max[1]:b.min[1],q&4?b.max[2]:b.min[2]]),P.n)));depth>th+1e-9*sizeOf(body)&&th>0&&NOTES.push({k:'depth',field:'depth',v:th,msg:'Hole depth '+fu(depth)+' goes past the '+fu(th)+' of part under it, so it cuts through',fix:[{t:'Through all',k:'thru',v:true},{t:'Use '+fu(clean(th,UNITS)),k:'depth',v:clean(th,UNITS)}]});}
  f.cb_d>0&&f.cb_h>0&&f.cb_d<=d&&NOTES.push({k:'cb_d',field:'cb_d',msg:'Counterbore Ø '+fu(f.cb_d)+' is not larger than the '+fu(d)+' hole, so it is left out',fix:[{t:'Use '+fu(clean(d*1.75,UNITS)),k:'cb_d',v:clean(d*1.75,UNITS)}]});f.cs_d>0&&f.cs_d<=d&&NOTES.push({k:'cs_d',field:'cs_d',msg:'Countersink Ø '+fu(f.cs_d)+' is not larger than the '+fu(d)+' hole, so it is left out',fix:[{t:'Use '+fu(clean(d*2,UNITS)),k:'cs_d',v:clean(d*2,UNITS)}]});
  let cbh=f.cb_h;
  if(body&&f.cb_d>d&&f.cb_h>0){const bb=body.boundingBox.bounds,T=Math.abs(P.n.reduce((t,v,i)=>t+v*(bb[1][i]-bb[0][i]),0));if(T>0&&f.cb_h>=T*0.999){cbh=T*0.75;TNOTE='the counterbore ('+f.cb_h.toFixed(3)+' deep) is not shallower than the plate ('+T.toFixed(3)+'), which would turn the hole into a plain Ø'+f.cb_d.toFixed(3)+' through hole. The counterbore depth was limited to '+cbh.toFixed(3)+' so the Ø'+d.toFixed(3)+' hole and the counterbore both stay; make the plate thicker or the counterbore shallower.';}}
  const pts=f.pts&&f.pts.length?f.pts:[[f.x||0,f.y||0]],y=cross(P.n,P.x);if(!(d>0))throw new Error('hole diameter must be above 0');
  let tool=null;
  for(const p of pts){
    const c=[0,1,2].map(i=>P.o[i]+P.x[i]*p[0]+y[i]*p[1]);
    const down=P.n.map(v=>-v),eps=0.01*d;
    const top=c.map((v,i)=>v+P.n[i]*eps);
    let t=R.makeCylinder(d/2,depth+eps,top,down);
    if(f.cb_d>d&&cbh>0)t=t.fuse(R.makeCylinder(f.cb_d/2,cbh+eps,top,down));
    if(f.cs_d>d){const ta=Math.tan((f.cs_ang||90)*Math.PI/360),hh=(f.cs_d-d)/2/ta;t=t.fuse(coneSolid(f.cs_d/2+eps*ta,d/2,hh+eps,top,down));}
    tool=tool?tool.fuse(t):t;
  }
  return tool;
}
function frameAt(o,t){const n=nrm(t),x=nrm(Math.abs(n[2])>0.9?cross([0,1,0],n):cross([0,0,1],n));return new R.Plane(o,x,n);}
function pathWire(pts,rad,nk){
  const P=pts.map(p=>[+p[0],+p[1],+p[2]]);if(P.length<2)throw new Error('path needs 2+ points');const E=[];let cur=P[0];
  for(let i=1;i<P.length;i++){const a=P[i],last=i===P.length-1;
    if(!last&&rad>0){const u=nrm(sub(cur,a)),w=nrm(sub(P[i+1],a)),c=Math.max(-1,Math.min(1,dot(u,w))),th=Math.acos(c);
      if(th>1e-3&&th<Math.PI-1e-3){const t0=rad/Math.tan(th/2),tl=Math.min(t0,dist(cur,a)*0.49,dist(P[i+1],a)*0.49),p1=a.map((v,k)=>v+u[k]*tl),p2=a.map((v,k)=>v+w[k]*tl),bis=nrm(u.map((v,k)=>v+w[k])),rr=tl*Math.tan(th/2),cd=rr/Math.sin(th/2),cen=a.map((v,k)=>v+bis[k]*cd),mid=cen.map((v,k)=>v-bis[k]*rr);nk&&tl<t0-1e-9&&NOTES.push({k:nk,field:nk,v:rr,msg:'Bend radius limited to '+fu(flo3(rr))+' at path point '+(i+1)+' (the segments next to it are too short)',fix:[{t:'Use '+fu(flo3(rr)),k:nk,v:flo3(rr)}]});
        if(dist(cur,p1)>1e-6)E.push(R.makeLine(cur,p1));E.push(R.makeThreePointArc(p1,mid,p2));cur=p2;continue;}}
    E.push(R.makeLine(cur,a));cur=a;}
  return R.assembleWire(E);
}
function sweepTool(f,body){
  const sp=pathWire(f.path||[[0,0,0],[0,0,M(50)]],f.bend||0,'bend'),o=V(sp.startPoint),t=V(sp.tangentAt(1e-6));
  const prof=profileDrawing(f.shapes&&f.shapes.length?f.shapes:[{k:'circle',r:M(3)}]).sketchOnPlane(frameAt(o,t));
  return R.genericSweep(prof.wire,sp,{forceProfileSpineOthogonality:true,transitionMode:'round'});
}
function loftTool(f,body){
  const P=planeFrom(f,body),secs=f.sections&&f.sections.length>1?f.sections:[{offset:0,shapes:[{k:'rect',w:M(40),h:M(40)}]},{offset:M(30),shapes:[{k:'circle',r:M(12)}]}];
  const sk=secs.map((sc,si)=>profileDrawing(sc.shapes,'section '+(si+1)+' ','sections.'+si+'.shapes.').sketchOnPlane(new R.Plane(P.o.map((v,i)=>v+P.n[i]*(sc.offset||0)),P.x,P.n)));
  return sk[0].loftWith(sk.slice(1),{ruled:!!f.ruled});
}
function helixSweep(r,pitch,h,c,ax,left,prof2){
  const n=nrm(ax),hx=R.makeHelix(pitch,h,r,c,n,left),st=V(hx.startPoint),rad=nrm(sub(st,c.map((v,i)=>v+n[i]*dot(sub(st,c),n))));
  return R.genericSweep(prof2.sketchOnPlane(new R.Plane(st,rad,nrm(cross(rad,n)))).wire,hx,{frenet:true,transitionMode:'right'});
}
function coilTool(f){
  const c=[f.x||0,f.y||0,f.z||0],ax=AXV(f.axis),p=f.pitch??M(8),wd=f.wire??M(2);
  if(p<=wd*1.02)throw new Error('pitch must be larger than the wire diameter');
  return helixSweep((f.d??M(20))/2,p,p*(f.turns??5),c,ax,f.hand==='left',R.drawCircle(wd/2));
}
function threadTool(f){
  const ts=f.std&&f.std!=='custom'&&THREADSTD[f.std],k=ts?ucv(ts[2]):1,c=[f.x||0,f.y||0,f.z||0],ax=AX[f.axis||'Z']||AX.Z,p=ts?ts[1]*k:f.pitch??1.5,d=ts?ts[0]*k:f.d??10,L=f.length??15,ext=f.kind!=='internal',h=0.6134*p,hi=0.5413*p;
  const tri=ext?R.draw([0.05*p,-0.4665*p]).lineTo([-h,-0.0835*p]).lineTo([-h,0.0835*p]).lineTo([0.05*p,0.4665*p]).close():R.draw([-0.05*p,-0.404*p]).lineTo([hi,-0.0625*p]).lineTo([hi,0.0625*p]).lineTo([-0.05*p,0.404*p]).close();
  const o=(f.run||1)*p;return helixSweep(ext?d/2:d/2-hi,p,L+2*o,c.map((v,i)=>v-ax[i]*o),ax,f.hand==='left',tri);
}
const pathShape=r=>({k:'path',pts:r.pts,bulge:r.bulge}),KIN=()=>UNITS==='in'?1:25.4,XZ=()=>new R.Plane([0,0,0],[1,0,0],[0,-1,0]);
function moldDrawing(pr){
  if(pr.sec)return profileDrawing([pathShape(pr.sec)]);
  const K=pr.K,T=Math.max(pr.p.T||pr.p.pt||0,pr.h*1.5,0.75*K),W=Math.max(pr.w*2,1.5*K),c=pr.kind==='center';
  return profileDrawing([{k:'rect',x:c?0:-W/2,y:-T/2,w:W,h:T},...pr.rings.map(r=>({...pathShape(r),hole:true}))]);
}
function moldingTool(f){
  const K=KIN(),pr=profile(f.prof||'casing',f.pp,K,{m:0.02*K}),L=Math.abs(f.len??12*K),d=moldDrawing(pr),P=(f.path||[]).map(p=>[+p[0],+p[1],+p[2]]);
  if(P.length>=2){const sp=pathWire(P,f.bend||0),o=V(sp.startPoint),t=nrm(V(sp.tangentAt(1e-6))),x=Math.abs(t[2])>0.95?[0,1,0]:nrm(cross([0,0,1],t));return R.genericSweep(d.sketchOnPlane(new R.Plane(o,x,t)).wire,sp,{forceProfileSpineOthogonality:true,transitionMode:'round'});}
  return d.sketchOnPlane(new R.Plane([f.x||0,f.y||0,f.z||0],[0,1,0],[1,0,0])).extrude(L);
}
function edgeCut(body,f,doc){
  const K=KIN(),es=selectEdges(body,f.edges);if(!es.length)throw new Error('no edges matched');
  const pr=profile(f.prof||'roundover',f.pp,K,{m:0.02*K}),F=faceList(body);let out=body;
  for(const q of es){
    const fs=F.filter(g=>g.type==='PLANE'&&g.n&&g.f.edges.some(e=>e.hashCode===q.e.hashCode));
    if(q.type!=='LINE'||fs.length!==2||Math.abs(dot(fs[0].n,fs[1].n))>1e-3)throw new Error('an edge profile needs a straight edge between two flat faces at 90 degrees');
    let[n1,n2]=fs.map(g=>g.n);(Math.abs(n1[2])>Math.abs(n2[2])+1e-6||Math.abs(Math.abs(n1[2])-Math.abs(n2[2]))<1e-6&&Math.abs(n1[0])>Math.abs(n2[0])+1e-6)&&([n1,n2]=[n2,n1]);f.flip&&([n1,n2]=[n2,n1]);
    const fr=edgeFrame(n1,n2),e=0.02*K,st=dot(fr.n,sub(q.b,q.a))>0?q.a:q.b,o=st.map((v,i)=>v-fr.n[i]*e),pl=new R.Plane(o,fr.x,fr.n);
    out=out.cut(pr.rings.map(r=>profileDrawing([pathShape(r)]).sketchOnPlane(pl).extrude(q.len+2*e)).reduce((a,b)=>a.fuse(b)));
  }
  const m=MATS[doc.material];return{shape:out,warn:m&&m.look&&m.look.kind==='wood'?null:'Edge profiles are meant for wood parts; this part is '+((m&&m.n)||doc.material)+'.'};
}
const centroid=P=>{let A=0,x=0,y=0;P.forEach((p,i)=>{const q=P[(i+1)%P.length],c=p[0]*q[1]-q[0]*p[1];A+=c;x+=(p[0]+q[0])*c;y+=(p[1]+q[1])*c;});return[x/(3*A),y/(3*A)];};
function plate(w,org,t,f,y0=0){
  const P=flat(w,1e-4*KIN(),true),c=centroid(P),d=profileDrawing([pathShape(w)]);let pl;
  try{pl=f<1-1e-6?d.translate(-c[0],-c[1]).sketchOnPlane(new R.Plane(org(c[0],c[1]),[1,0,0],[0,-1,0])).extrude(t,{extrusionProfile:{profile:'linear',endFactor:f}}):d.sketchOnPlane(new R.Plane(org(0,0),[1,0,0],[0,-1,0])).extrude(t);}catch{pl=d.sketchOnPlane(new R.Plane(org(0,0),[1,0,0],[0,-1,0])).extrude(t);}
  return pl.translate(0,t+y0,0);
}
function wingSolid(s,i){
  const zm=s.H/2,cs=Math.cos(s.shear*Math.PI/180),al=s.hook*Math.PI/180,D=s.rmax-s.rin,kk=al&&D>0?(-s.rin*Math.cos(al)+Math.sqrt(s.rin*s.rin*Math.cos(al)**2-s.rin*s.rin+s.rmax*s.rmax))/D:1,tilt=s.shear>0||s.hook>0,org=(u,v)=>[u,0,s.z0+v];
  const poly=P=>({pts:tilt?P.map(q=>[s.rin+(q[0]-s.rin)*kk,(q[1]-zm)/cs+zm]):P,bulge:P.map(()=>0)}),f=s.relief>0?Math.max(0.5,1-s.ct*Math.tan(s.relief*Math.PI/180)/Math.max(s.rmax-s.rin,1e-6)):1;
  const parts=s.body?[...s.carb.map(P=>plate(poly(P),org,s.ct,f)),...s.steel.map(P=>plate(poly(P),org,s.ct+s.wb-s.seatD,1,s.seatD))]:[plate(tilt?poly(flat(s.wing,1e-4*s.K,true)):s.wing,org,s.ct,f)];
  let pl=parts.reduce((a,b)=>a.fuse(b));
  s.hook&&(pl=pl.rotate(-s.hook,[s.rin,0,0],[0,0,1]));s.shear&&(pl=pl.rotate(s.shear,[0,0,s.z0+zm],[1,0,0]));
  return pl.rotate(360*i/s.n,[0,0,0],[0,0,1]);
}
function coreSolid(s,lo,r0){
  const c=s.core;let pen=R.draw([r0,lo+c[0][1]]);pen=c[0][0]>r0+1e-9?pen.lineTo([c[0][0],lo+c[0][1]]):pen;for(const q of c.slice(1))pen=pen.lineTo([q[0],lo+q[1]]);
  pen=c[c.length-1][0]>r0+1e-9?pen.lineTo([r0,lo+c[c.length-1][1]]):pen;return pen.close().sketchOnPlane(XZ()).revolve([0,0,1],{origin:[0,0,0]});
}
let TNOTE=null;
function cutterTool(f,body,retry){
  const K=KIN(),s=bitSpec(f,K),wings=Array.from({length:s.n},(_,i)=>wingSolid(s,i)).reduce((a,b)=>a.fuse(b));let t;
  if(s.kind==='shaper'){
    const kw=(s.bore/K>1?0.25:0.1875)*K,N=Math.max(1,Math.round(f.stack||1)),dz=s.H-0.002*K;t=coreSolid({...s,core:[[s.core[0][0],0],[s.core[0][0],dz*(N-1)+s.H]]},0,s.bore/2).fuse(wings);for(let i=1;i<N;i++)t=t.fuse(wings.clone().translate(0,0,i*dz));
    t=t.cut(R.makeBox([s.bore/2-kw/2,-kw/2,-1],[s.bore/2+kw/2,kw/2,N*s.H+1]));
  }else{
    const zt=s.z0+s.H,rc=s.core[s.core.length-1][0];
    const rc0=s.core[s.core.length-1][0];let cs=coreSolid(s,s.z0,0);s.gw>0&&(cs=Array.from({length:s.n},(_,i)=>R.makeBox([s.g0,-s.gw,s.z0-0.01*K],[rc0+0.02*K,0,s.z0+s.H+0.01*K]).rotate(360*i/s.n,[0,0,0],[0,0,1])).reduce((a,g)=>a.cut(g),cs));
    t=cs.fuse(wings).fuse(coneSolid(rc,s.sd/2,s.neck,[0,0,zt],[0,0,1])).fuse(R.makeCylinder(s.sd/2,s.sl-s.neck,[0,0,zt+s.neck],[0,0,1]));
    s.br&&(t=t.fuse(R.makeCylinder(s.od/2,s.bt,[0,0,0],[0,0,1])));
  }
  if(!retry&&s.relief>0&&Math.abs(volOf(t))<0.9*bitVolume({...s,hook:0,shear:0,relief:0})){TNOTE='relief angle could not be applied with this hook/shear combination and was set to 0°.';return cutterTool({...f,relief:0},body,true);}
  const ax=f.axis||'Z';ax==='X'&&(t=t.rotate(90,[0,0,0],[0,1,0]));ax==='Y'&&(t=t.rotate(-90,[0,0,0],[1,0,0]));
  return t.translate(f.x||0,f.y||0,f.z||0);
}
function knifeTool(f){
  const K=KIN(),s=knifeSpec(f,K);let t=plate({pts:s.outline,bulge:[]},(u,v)=>[u,0,v],s.kt,s.bevel>0?Math.max(0.5,1-s.kt*Math.tan(s.bevel*Math.PI/180)/(s.Hb/2)):1);
  if(s.corr){const xa=s.outline[0][0],n=Math.max(2,Math.floor((s.outline[1][0]-xa)/s.cp)),e=0.02*K,P=[[xa,s.kt+e],[xa,s.kt]];for(let i=0;i<n;i++)P.push([xa+i*s.cp,s.kt],[xa+(i+0.5)*s.cp,s.kt-s.cd]);P.push([xa+n*s.cp,s.kt],[xa+n*s.cp,s.kt+e]);
    t=t.cut(profileDrawing([{k:'path',pts:P,bulge:[]}]).sketchOnPlane(new R.Plane([0,0,-1],[1,0,0],[0,0,1])).extrude(s.Hb+2));}
  return t.translate(f.x||0,f.y||0,f.z||0);
}
const solidsOf=b=>b.solids||[b],nSol=b=>{const L=solidsOf(b),n=L.length;L.forEach(del);return n;},smemo=new WeakMap(),nsol=b=>{let v=smemo.get(b);v===undefined&&smemo.set(b,v=nSol(b));return v;},volOf=b=>R.measureShapeVolumeProperties(b).volume,vmemo=new WeakMap(),vol=b=>{let v=vmemo.get(b);v===undefined&&vmemo.set(b,v=Math.abs(volOf(b)));return v;},cap=t=>t[0].toUpperCase()+t.slice(1);
function threadCut(body,f){if(!body)throw new Error('a thread needs a body');const ts=f.std&&f.std!=='custom'&&THREADSTD[f.std],k=ts?ucv(ts[2]):1,p=ts?ts[1]*k:f.pitch??1.5,d=ts?ts[0]*k:f.d??10,L=f.length??15,ext=f.kind!=='internal',c=[f.x||0,f.y||0,f.z||0],ax=AX[f.axis||'Z']||AX.Z,b=bboxOf(body),pr=[0,1,2,3,4,5,6,7].map(q=>dot([q&1?b.max[0]:b.min[0],q&2?b.max[1]:b.min[1],q&4?b.max[2]:b.min[2]],ax)),lo=Math.min(...pr),hi2=Math.max(...pr),t0=dot(c,ax),a0=Math.max(t0,lo),a1=Math.min(t0+L,hi2);if(a1<=a0)throw new Error('the thread does not reach the part');
  if(p<0.5&&!f.up){const u=25.4,r=threadCut(body.clone().scale(u,[0,0,0]),{...f,up:1,std:'custom',pitch:p*u,d:d*u,length:L*u,x:c[0]*u,y:c[1]*u,z:c[2]*u});return r.scale(1/u,[0,0,0]);}
  const rate=(ext?0.3197*2*Math.PI*(d/2-0.2373*p):0.2369*2*Math.PI*(d/2-0.5413*p+0.2062*p))*p,v0=volOf(body),S=a1-a0+2*p,at=t=>c.map((v,i)=>v+ax[i]*(t-t0)),REV={X:'-X',Y:'-Y',Z:'-Z','+X':'-X','+Y':'-Y','+Z':'-Z','-X':'X','-Y':'Y','-Z':'Z'},seg=(t,h,dir=1)=>threadTool({...f,axis:dir>0?f.axis||'Z':REV[f.axis||'Z'],...Object.fromEntries(['x','y','z'].map((q,i)=>[q,at(t)[i]])),length:h-2*p}),want=rate*(Math.min(hi2,a1+p)-Math.max(lo,a0-p)),err=r=>Math.abs((v0-volOf(r))/want-1);
  for(const dir of[1,-1])for(const a of[0,37])try{const t=seg(dir>0?a0:a1,S,dir),r=body.cut(a?t.rotate(a,at(a0),ax):t);if(err(r)<0.02)return r;}catch{}
  for(const dir of[1,-1])for(const m of[4,1]){try{let r=body;for(let q=0;q<S-1e-9;q+=m*p)r=r.cut(seg(dir>0?a0+q:a1-q,Math.min(m*p,S-q),dir));if(err(r)<0.02)return r;}catch{}}
  throw new Error('could not cut this thread cleanly; try a slightly different length or start');}
function splitBody(body,f){
  const P=planeFrom(f.plane==='face'||f.plane==='datum'?f:{plane:f.plane||'XY',offset:f.offset},body),S=sizeOf(body)*4+10,o=P.o,sgn=f.keep==='-'?-1:1,n=P.n.map(v=>v*sgn),x=P.x;
  const half=R.drawRectangle(S,S).sketchOnPlane(new R.Plane(o,x,n)).extrude(S);return body.intersect(half);
}
function applyOp(body,tool,op){
  if(!body||op==='new'&&!body)return tool;
  if(op==='new')return R.makeCompound([...solidsOf(body),...solidsOf(tool)]);
  if(op==='cut')return body.cut(tool);
  if(op==='intersect')return body.intersect(tool);
  return body.fuse(tool);
}
function patternTools(f,tools){
  const n0=f.n??4,n=Math.max(1,Math.round(n0)),out=[];n!==n0&&NOTES.push({k:'n',field:'n',v:n,msg:'Count '+n0+' used as '+n+' (a whole number, 1 or more)',fix:[{t:'Use '+n,k:'n',v:n}]});
  for(const t of tools){
    for(let k=1;k<n;k++){
      if(f.kind==='circular'){const da=axisRef(f.axis),ax=da?da.d:AXV(f.axis),ang=(f.angle??360)===360?360/n:(f.angle)/(n-1);out.push(t.clone().rotate(ang*k,da?da.p:[f.ox||0,f.oy||0,f.oz||0],ax));}
      else out.push(t.clone().translate((f.dx||0)*k,(f.dy||0)*k,(f.dz||0)*k));
    }
  }
  return out;
}
const HINT={fillet:'the radius is probably too big for these edges; try a smaller radius or fewer edges',chamfer:'the distance is probably too big for these edges',shell:'the wall is probably thicker than a fillet or feature allows; thin the wall or enlarge the fillets',extrude:'check that the profile is closed, has area and does not cross itself',revolve:'the profile must not cross the axis',hole:'check the hole lies on the part',pattern:'a copy may fall outside the part',mirror:'the mirror may not touch the part'};
function friendly(e,f){const m=String(e&&e.message||e);if(e instanceof ProfileError)return(cap(f.type)+" '"+(f.name||f.id)+"': "+m).slice(0,400);if(/WebAssembly|object Object|has been deleted|^\d+$/.test(m)||!m)return 'geometry kernel could not build this '+((f&&f.type)||'feature')+(f&&HINT[f.type]?': '+HINT[f.type]:'');return m.slice(0,300);}
const BATCH=4,PROF=new Set(['extrude','revolve','sweep','loft','molding','bit','shaper','knife']);
const TOOLMAKERS={box:primTool,cylinder:primTool,sphere:primTool,cone:primTool,torus:primTool,extrude:extrudeTool,revolve:revolveTool,hole:holeTool,loft:loftTool,sweep:sweepTool,coil:coilTool,thread:threadTool,molding:moldingTool,bit:cutterTool,shaper:cutterTool,knife:knifeTool};
const KX={R,planeFrom,selectFaces,selectEdges,faceList,edgeList,pdist,sizeOf,bboxOf,volOf,vol,upTo,AXV,M,fu,get NOTES(){return NOTES;},get UNITS(){return UNITS;}};
let cache=[];
function truncate(i,C=cache){const keep=new Set(),gone=new Set();for(let j=0;j<Math.min(i,C.length);j++){keep.add(C[j].shape);keep.add(C[j].tool);}for(let j=i;j<C.length;j++)for(const o of[C[j].shape,C[j].tool])if(o&&!keep.has(o)&&!gone.has(o)){gone.add(o);try{o.delete();}catch{}}C.length=Math.min(C.length,i);}
export function resetCache(C){if(C){truncate(0,C);return;}truncate(0);cache=[];}
export async function build(doc,opt={}){
  const cache=opt.cache||cacheRef();
  const t0=performance.now(),{scope,errors:pErr}=resolveParams(doc.params,doc.units);UNITS=doc.units==='in'?'in':'mm';
  const feats=(doc.features||[]).filter(f=>!f.suppressed),upto=opt.upto??feats.length,errors=[],warnings=[],log=[];
  let body=null,prevKey='',reused=0,sk=0,i0=0,fk=null;
  datReset();
  const tools={},nz=Math.min(feats.length,(doc.features||[]).slice(0,Math.max(0,doc.freeze|0)).filter(f=>!f.suppressed).length);
  if(nz>0&&upto>=nz){try{fk=JSON.stringify([UNITS,doc.material,feats.slice(0,nz).map(f=>res(f,scope))]);}catch{fk=null;}const c=cache[nz-1];if(fk&&cache.fk===fk&&c&&c.shape&&!c.lazy&&cache.length>=nz){for(let j=0;j<nz;j++){const e=cache[j];e.tool&&(tools[feats[j].id]=e.tool);e.err&&errors.push(e.err);Array.isArray(e.warn)?warnings.push(...e.warn):e.warn&&warnings.push(e.warn);}body=c.shape;prevKey=c.key;reused=sk=i0=nz;}}
  cache.fk=null;
  for(let j=0;j<i0;j++)cache[j].dat&&datPut(feats[j].id,cache[j].dat);
  for(let i=i0;i<Math.min(upto,feats.length);i++){
    const raw=feats[i];let f,key,perr=null;
    if(raw.type==='hole'&&body&&i>=sk){
      let k=i;const lim=Math.min(upto,feats.length)-1;while(k+1<lim&&feats[k+1].type==='hole'&&(i>=nz||k+1<nz))k++;
      if(k-i>=BATCH-1){
        const fs=[],ks=[];let pk=prevKey,okb=true;
        for(let j=i;j<=k&&okb;j++)try{const fj=res(feats[j],scope);fs.push(fj);pk+='|'+JSON.stringify(fj);ks.push(pk);}catch{okb=false;}
        if(okb&&ks.every((kk,j)=>cache[i+j]&&cache[i+j].key===kk)&&cache[k].shape){for(let j=i;j<=k;j++){const c2=cache[j];c2.tool&&(tools[feats[j].id]=c2.tool);c2.warn&&warnings.push(c2.warn);}body=cache[k].shape;prevKey=ks[ks.length-1];reused+=k-i+1;i=k;continue;}
        if(okb){
          truncate(i,cache);let ts=[],comp=null;
          try{
            ts=fs.map(fj=>holeTool(fj,body));comp=R.makeCompound(ts.map(t=>t.clone()));const nx=body.cut(comp),v0=vol(body),v1=vol(nx),bb=bboxOf(body),none=Math.abs(v1-v0)<=1e-7*Math.max(v0,1e-12);
            if(!(v1>0))throw new Error('batch cut failed');
            ts.forEach((t,j)=>{const tb=t.boundingBox.bounds,miss=none||tb[1].some((v,a)=>v<bb.min[a]||tb[0][a]>bb.max[a]),w=miss?{id:feats[i+j].id,name:feats[i+j].name,type:'hole',msg:"Hole '"+(feats[i+j].name||feats[i+j].id)+"' changed nothing: it does not touch the part; check offset/plane."}:null;miss&&warnings.push(w);cache[i+j]={key:ks[j],shape:i+j===k?nx:null,tool:t,warn:w,lazy:i+j!==k};tools[feats[i+j].id]=t;});
            try{comp.delete();}catch{}
            body=nx;prevKey=ks[ks.length-1];i=k;continue;
          }catch(e){for(const t of ts)try{t.delete();}catch{}try{comp&&comp.delete();}catch{}truncate(i,cache);sk=k+1;}
        }else sk=k+1;
      }
    }
    try{f=res(raw,scope);key=prevKey+'|'+JSON.stringify(f)+(raw.type==='import'?raw.id:raw.type==='edgeprofile'?doc.material:'');}catch(e){perr={id:raw.id,name:raw.name,type:raw.type,msg:e.message};errors.push(perr);key=prevKey+'|ERR'+i+JSON.stringify(raw);f=null;}
    const c=cache[i];
    if(c&&c.key===key&&!c.lazy){body=c.shape;if(c.tool)tools[raw.id]=c.tool;c.dat&&datPut(raw.id,c.dat);c.err&&errors.push(c.err);c.warn&&warnings.push(...c.warn);prevKey=key;reused++;continue;}
    truncate(i,cache);
    let next=body,tool=null,dat=null,ferr=perr;const fw=[],W=(msg,x)=>fw.push({id:raw.id,name:raw.name,type:raw.type,msg,...x});NOTES=[];
    if(f)try{
      f=liveSketch(f,body);
      if(TOOLMAKERS[f.type]){if(!body&&(f.type==='hole'||f.type!=='thread'&&['cut','intersect'].includes(f.op)))throw new Error(f.type+' needs a body to cut into; add or unsuppress a solid before it');tool=f.type==='thread'?null:TOOLMAKERS[f.type](f,body);if(PROF.has(f.type)&&!(Math.abs(volOf(tool))>1e-12))throw new Error('the profile has no area, so '+f.type+' made nothing; check it is closed and does not cross itself');next=f.type==='thread'?threadCut(body,f):applyOp(body,tool,f.type==='hole'?'cut':(f.op||'add'));}
      else if(f.type==='fillet'||f.type==='chamfer'){
        if(!body)throw new Error(f.type+' needs a body');
        const es=selectEdges(body,f.edges);if(!es.length)throw new Error('no edges matched');
        const set=new Set(es.map(q=>q.e.hashCode)),fil=f.type==='fillet',r=fil?(f.r??M(1)):(f.d??M(1));if(!(r>0))throw new Error((fil?'radius':'distance')+' must be above 0');
        const cs=!fil&&(f.d2||f.angle)?chamferSides(body,es,f):null;
        next=upTo(x=>{const fn=cs?cs(x,r):e=>set.has(e.hashCode)?x:null;return fil?body.fillet(fn):body.chamfer(fn);},r,7,fil?'Fillet radius':'Chamfer distance',fil?'r':'d','the largest these edges allow').r;
      }
      else if(f.type==='edgeprofile'){
        if(!body)throw new Error('edgeprofile needs a body');
        const r=edgeCut(body,f,doc);next=r.shape;r.warn&&W(r.warn);
      }
      else if(f.type==='shell'){
        if(!body)throw new Error('shell needs a body');
        const fs=selectFaces(body,f.faces||{side:'+Z'});if(!fs.length)throw new Error('no faces matched');
        const set=new Set(fs.map(q=>q.f.hashCode));
        const t0=f.t??M(1),t=Math.abs(t0);if(!t)throw new Error('wall thickness must be above 0');t0<0&&NOTES.push({k:'t',field:'t',v:t,msg:'Wall thickness '+fu(t0)+' used as '+fu(t),fix:[{t:'Use '+fu(t),k:'t',v:t}]});
        const v0=volOf(body);next=upTo(x=>{const q=body.shell(x,ff=>ff.when(({element})=>set.has(element.hashCode))),v=volOf(q);if(!(v>0&&v<v0*(1-1e-7)))throw new Error('wall too thick');return q;},t,5,'Wall thickness','t','the thickest wall this part allows').r;
      }
      else if(f.type==='pattern'){
        const src=(f.of||[]).map(id=>tools[id]).filter(Boolean);if(!src.length)throw new Error('pattern: pick features that made a body or cut');
        const ops=(f.of||[]).map(id=>{const r2=feats.find(x=>x.id===id);return r2?(r2.type==='hole'?'cut':r2.op||'add'):'add';});
        let b=body;src.forEach((t,si)=>{const cp=patternTools(f,[t]);if(!cp.length)return;const c=cp.length===1?cp[0]:R.makeCompound(cp);b=applyOp(b,c,ops[si]);});next=b;
      }
      else if(f.type==='mirror'){
        if(!body)throw new Error('mirror needs a body');
        const P=planeFrom(f.plane==='face'||f.plane==='datum'?f:{plane:f.plane||'YZ',offset:f.offset},body),mp=new R.Plane(P.o,P.x,P.n);next=f.only?body.clone().mirror(mp):body.fuse(body.clone().mirror(mp));
      }
      else if(f.type==='split'){if(!body)throw new Error('split needs a body');next=splitBody(body,f);}
      else if(f.type==='scale'){if(!body)throw new Error('scale needs a body');next=body.clone().scale(f.k??1,[f.ox||0,f.oy||0,f.oz||0]);}
      else if(f.type==='move'){
        if(!body)throw new Error('move needs a body');
        let b=body.clone();const da=axisRef(f.axis);if(f.angle)b=b.rotate(f.angle,da?da.p:[f.ox||0,f.oy||0,f.oz||0],da?da.d:AXV(f.axis));b=b.translate(f.dx||0,f.dy||0,f.dz||0);next=f.copy?body.fuse(b):b;
      }
      else if(f.type==='import'){
        const data=opt.blobs&&opt.blobs[raw.blob];if(!data)throw new Error('imported file missing');
        const k=raw.fmt==='brep'||UNITS!=='in'?1:1/25.4;raw.fmt==='brep'||R.getOC().Interface_Static.SetCVal('xstep.cascade.unit','MM');const s0=raw.fmt==='brep'?R.deserializeShape(new TextDecoder().decode(data)):await R.importSTEP(new Blob([data])),sh=k===1?s0:s0.scale(k,[0,0,0]);tool=sh;next=applyOp(body,sh,f.op||'add');
      }
      else if(FEAT2[f.type]){const r=FEAT2[f.type](f,body,KX,doc,tools);next=r.shape;tool=r.tool||null;dat=r.dat||null;dat&&datPut(raw.id,dat);r.warn&&W(cap(f.type)+" '"+(f.name||f.id)+"': "+r.warn);}
      else throw new Error('unknown feature '+f.type);
      if(TNOTE){W(cap(f.type==='bit'?'Router bit':f.type)+" '"+(f.name||f.id)+"': "+TNOTE);TNOTE=null;}
      if(next&&next.isNull)throw new Error('result is empty');
      if(next&&next!==body&&!okShape(next))throw new Error('this '+f.type+' made an invalid solid, so the part before it is kept; check the profile does not cross itself or the part');
      if(body&&next&&next!==body&&f.type!=='combine'){const n0=nsol(body),n1=nsol(next);n1>n0&&W(cap(f.type)+" '"+(f.name||f.id)+"' made "+(n1-n0>1?(n1-n0)+' separate bodies':'a separate body')+(f.op==='new'?' (New body)':(f.op==='cut'||f.type==='hole'?': the cut split the part':': it does not touch the part'))+', so the part now has '+n1+' bodies. '+(f.op==='cut'||f.type==='hole'?'Check the cut.':'Make it touch the part, or add a Combine bodies feature to merge, subtract or intersect them.'),{bodies:n1});if(f.op==='new'&&n1===n0+nsol(tool)){const ov=vol(body.intersect(tool));ov>1e-7*Math.max(vol(body),1e-12)&&W(cap(f.type)+" '"+(f.name||f.id)+"' (New body) overlaps an existing body by "+(+ov.toPrecision(3))+' '+UNITS+'³; mass and volume count the overlap twice. Use Combine bodies to merge or subtract.',{bodies:n1});}}
      if(body&&next!==body&&TOOLMAKERS[f.type]&&f.type!=='thread'&&(f.op||'add')!=='intersect'){const v0=vol(body),v1=vol(next);if(Math.abs(v1-v0)<=1e-7*Math.max(v0,1e-12)){const cut=f.type==='hole'||f.op==='cut';W(cap(f.type)+" '"+(f.name||f.id)+"' changed nothing: "+(cut?'it does not touch the part':'it lies entirely inside existing material')+'; check offset/plane.');}}
    }catch(e){ferr={id:raw.id,name:raw.name,type:raw.type,msg:friendly(e,f)};errors.push(ferr);next=body;tool=null;}
    for(const q of NOTES)W(cap(raw.type)+" '"+(raw.name||raw.id)+"': "+q.msg,{note:q.msg,field:q.field,...(q.v!=null?{limit:q.v}:{}),fix:q.fix});NOTES=[];warnings.push(...fw);
    if(tool)tools[raw.id]=tool;
    cache[i]={key,shape:next,tool,err:ferr,warn:fw,dat};
    body=next;prevKey=key;
  }
  truncate(Math.min(upto,feats.length),cache);
  cache.fk=fk;
  return{body,errors,warnings,paramErrors:pErr,scope,reused,datums:datList(),ms:performance.now()-t0};
}
export function meshBody(body,q=1){
  if(!body)return null;
  const size=sizeOf(body),E=edgeList(body),tol=Math.max(size*2e-4/q,0.002),ang=Math.min(0.3,Math.max(0.12,2*Math.PI*E.length/8000))/q,m=body.mesh({tolerance:tol,angularTolerance:ang}),me=body.meshEdges({tolerance:tol,angularTolerance:ang});
  const F=faceList(body),fh=new Map(F.map(x=>[x.f.hashCode,x.i])),eh=new Map(E.map(x=>[x.e.hashCode,x.i]));
  const faces=F.map(x=>({c:x.c,n:x.n,type:x.type,area:safe(()=>R.measureArea(x.f))}));
  const edges=E.map(x=>({m:x.m,a:x.a,b:x.b,type:x.type,len:x.len}));
  let vp=null;try{const p=R.measureShapeVolumeProperties(body);vp={volume:p.volume,com:p.centerOfMass};}catch{}
  const bb=bboxOf(body);
  return{pos:new Float32Array(m.vertices),nrm:new Float32Array(m.normals),idx:new Uint32Array(m.triangles),groups:m.faceGroups.map(g=>[g.start,g.count,fh.get(g.faceId)??-1]),lines:new Float32Array(me.lines),egroups:me.edgeGroups.map(g=>[g.start,g.count,eh.get(g.edgeId)??-1]),faces,edges,props:{volume:vp?vp.volume:safe(()=>R.measureVolume(body)),com:vp?vp.com:null,area:safe(()=>R.measureArea(body)),bbox:bb,nFaces:F.length,nEdges:E.length,nSolids:body.solids?body.solids.length:1,...(body.solids&&body.solids.length>1?{solids:body.solids.map(sd=>{const p=R.measureShapeVolumeProperties(sd),b2=sd.boundingBox.bounds;return{volume:Math.abs(p.volume),com:V(p.centerOfMass),bbox:{min:b2[0],max:b2[1]}};})}:{})}};
}
function safe(f){try{return f();}catch{return null;}}
export function exportBody(body,fmt,units){
  if(!body)throw new Error('nothing to export');
  if(fmt==='step'){const u=units==='in'?'INCH':'MM';return R.exportSTEP([{shape:body,name:'part',color:'#b8c2cc'}],{unit:u,modelUnit:u});}
  if(fmt==='brep')return new Blob([body.serialize()],{type:'model/vnd.brep'});
  if(fmt==='stl')return body.blobSTL({binary:true,tolerance:Math.max(sizeOf(body)*1e-4,0.001),angularTolerance:0.05});
  throw new Error('unknown format '+fmt);
}
function cacheRef(){return cache;}
export function shapeBefore(i){const c=i>0&&cache[i-1];if(!c)return null;if(c.shape||!c.lazy)return c.shape;let s=i-1;while(s>0&&cache[s-1]&&cache[s-1].lazy)s--;const base=s>0&&cache[s-1].shape;if(!base)return null;try{c.shape=base.cut(R.makeCompound(cache.slice(s,i).map(e=>e.tool.clone())));c.lazy=false;}catch{return null;}return c.shape;}
export function edgePolylines(shape,sel,isFace){const out=[];const list=isFace?selectFaces(shape,sel).flatMap(q=>q.f.outerWire().edges):selectEdges(shape,sel).map(q=>q.e);for(const e of list){const p=[];for(let k=0;k<=24;k++)p.push(V(e.pointAt(k/24)));out.push(p);}return out;}
export async function init(oc){R.setOC(oc);return true;}
