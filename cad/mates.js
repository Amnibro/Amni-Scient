import {lsolve,nullInfo} from './sketch.js';
export const ORIGIN='@origin';
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(a[0],a[1],a[2]),nrm=a=>mul(a,1/(len(a)||1)),mid=(a,b)=>mul(add(a,b),0.5),ss=r=>r.reduce((s,v)=>s+v*v,0);
export const V3={add,sub,mul,dot,cross,len,nrm,mid};
export const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],qconj=q=>[-q[0],-q[1],-q[2],q[3]],qn=q=>{const l=Math.hypot(q[0],q[1],q[2],q[3])||1;return[q[0]/l,q[1]/l,q[2]/l,q[3]/l];};
export const qrot=(q,v)=>{const u=[q[0],q[1],q[2]],t=mul(cross(u,v),2);return add(add(v,mul(t,q[3])),cross(u,t));};
export const qexp=w=>{const a=len(w);if(a<1e-12)return qn([w[0]/2,w[1]/2,w[2]/2,1]);const s=Math.sin(a/2)/a;return[w[0]*s,w[1]*s,w[2]*s,Math.cos(a/2)];};
export const qlog=q=>{const p=q[3]<0?q.map(v=>-v):q,s=Math.hypot(p[0],p[1],p[2]);if(s<1e-12)return[2*p[0],2*p[1],2*p[2]];const a=2*Math.atan2(s,p[3]);return[p[0]/s*a,p[1]/s*a,p[2]/s*a];};
export const qaxis=(ax,deg)=>qexp(mul(nrm(ax),deg*Math.PI/180)),qeuler=e=>{const[x,y,z]=(e||[0,0,0]).map(v=>(+v||0)*Math.PI/360),c1=Math.cos(x),c2=Math.cos(y),c3=Math.cos(z),s1=Math.sin(x),s2=Math.sin(y),s3=Math.sin(z);return[s1*c2*c3+c1*s2*s3,c1*s2*c3-s1*c2*s3,c1*c2*s3+s1*s2*c3,c1*c2*c3-s1*s2*s3];};
export const qbetween=(a,b)=>{const d=dot(nrm(a),nrm(b));if(d<-0.999999){const p=nrm(cross(a,Math.abs(a[0])<0.9?[1,0,0]:[0,1,0]));return[p[0],p[1],p[2],0];}return qn([...cross(nrm(a),nrm(b)),1+d]);};
export const xf=(P,v)=>add(qrot(P.q,v),P.p),inv=P=>{const q=qconj(P.q);return{p:mul(qrot(q,P.p),-1),q};},compose=(A,B)=>({p:xf(A,B.p),q:qn(qmul(A.q,B.q))});
export const poseOf=c=>({p:(c.p||[0,0,0]).map(Number),q:qn((c.q||[0,0,0,1]).map(Number))});
export function eig3(A){const a=A.map(r=>r.slice()),v=[[1,0,0],[0,1,0],[0,0,1]];for(let it=0;it<60;it++){let p=0,q=1,m=Math.abs(a[0][1]);if(Math.abs(a[0][2])>m){m=Math.abs(a[0][2]);q=2;}if(Math.abs(a[1][2])>m){m=Math.abs(a[1][2]);p=1;q=2;}if(m<1e-18)break;const th=(a[q][q]-a[p][p])/(2*a[p][q]),t=(th<0?-1:1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
  for(let k=0;k<3;k++){const x=a[k][p],y=a[k][q];a[k][p]=c*x-s*y;a[k][q]=s*x+c*y;}for(let k=0;k<3;k++){const x=a[p][k],y=a[q][k];a[p][k]=c*x-s*y;a[q][k]=s*x+c*y;}for(let k=0;k<3;k++){const x=v[k][p],y=v[k][q];v[k][p]=c*x-s*y;v[k][q]=s*x+c*y;}}
  return[0,1,2].map(i=>({val:a[i][i],vec:[v[0][i],v[1][i],v[2][i]]})).sort((x,y)=>x.val-y.val);}
const basis=d=>{const u=nrm(cross(d,Math.abs(d[0])<0.9?[1,0,0]:[0,1,0]));return[u,cross(d,u)];};
export function circle3(P,d){const o=P.reduce((s,p)=>add(s,p),[0,0,0]).map(v=>v/(P.length||1)),[u,w]=basis(nrm(d)),A=[[0,0,0],[0,0,0],[0,0,0]],b=[0,0,0];for(const p of P){const q=sub(p,o),x=dot(q,u),y=dot(q,w),z=x*x+y*y,r=[x,y,1];for(let i=0;i<3;i++){b[i]-=r[i]*z;for(let j=0;j<3;j++)A[i][j]+=r[i]*r[j];}}const s=lsolve(A,b,3),cx=-s[0]/2,cy=-s[1]/2;return{c:add(o,add(mul(u,cx),mul(w,cy))),r:Math.sqrt(Math.max(0,cx*cx+cy*cy-s[2]))};}
export function sphere3(P){const A=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],b=[0,0,0,0];for(const p of P){const r=[p[0],p[1],p[2],1],z=dot(p,p);for(let i=0;i<4;i++){b[i]-=r[i]*z;for(let j=0;j<4;j++)A[i][j]+=r[i]*r[j];}}const s=lsolve(A,b,4),c=[-s[0]/2,-s[1]/2,-s[2]/2];return{c,r:Math.sqrt(Math.max(0,dot(c,c)-s[3]))};}
const tri=(m,t)=>{const P=m.pos,I=m.idx,a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3;return[[P[a],P[a+1],P[a+2]],[P[b],P[b+1],P[b+2]],[P[c],P[c+1],P[c+2]]];};
const groupsOf=(m,fid)=>m.groups.filter(g=>g[2]===fid);
export function faceGeom(m,fid){const gs=groupsOf(m,fid);if(!gs.length)return null;const ty=String((m.faces[fid]||{}).type||''),M=[[0,0,0],[0,0,0],[0,0,0]],I=m.idx,vs=new Set();let A=0,C=[0,0,0],N=[0,0,0];
  for(const g of gs)for(let t=g[0];t+2<g[0]+g[1];t+=3){const[pa,pb,pc]=tri(m,t),n=cross(sub(pb,pa),sub(pc,pa)),ar=len(n)/2;if(!ar)continue;const u=mul(n,1/(2*ar));A+=ar;C=add(C,mul(add(add(pa,pb),pc),ar/3));N=add(N,mul(u,ar));for(let i=0;i<3;i++)for(let j=0;j<3;j++)M[i][j]+=ar*u[i]*u[j];vs.add(I[t]);vs.add(I[t+1]);vs.add(I[t+2]);}
  C=mul(C,1/(A||1));const pts=[...vs].map(i=>[m.pos[3*i],m.pos[3*i+1],m.pos[3*i+2]]),flat=len(N)/(A||1);
  if(ty==='SPHERE'){const s=sphere3(pts);return{k:'sphere',p:s.c,r:s.r,area:A,f:fid};}
  if(/CYLIND|CONE|TORUS|REVOLUTION/.test(ty)&&flat<0.999){const d=nrm(eig3(M)[0].vec),c=circle3(pts,d);return{k:'line',p:c.c,d,r:c.r,round:true,area:A,f:fid,t:ty};}
  return flat>0.995||ty==='PLANE'?{k:'plane',p:C,n:nrm(N),area:A,f:fid}:{k:'point',p:C,area:A,f:fid};}
export function edgeGeom(m,eid){const g=m.egroups.find(x=>x[2]===eid),q=m.edges[eid];if(!g||!q)return null;const L=m.lines,P=[];for(let k=g[0];k<g[0]+g[1];k++)P.push([L[3*k],L[3*k+1],L[3*k+2]]);
  if(q.type==='LINE')return{k:'line',p:q.a,d:nrm(sub(q.b,q.a)),e:eid};
  if(/CIRCLE|ELLIPSE/.test(q.type)&&P.length>3){const o=P.reduce((s,p)=>add(s,p),[0,0,0]).map(v=>v/P.length),M=[[0,0,0],[0,0,0],[0,0,0]];for(const p of P){const d=sub(p,o);for(let i=0;i<3;i++)for(let j=0;j<3;j++)M[i][j]+=d[i]*d[j];}const d=nrm(eig3(M)[0].vec),c=circle3(P,d);return{k:'line',p:c.c,d,r:c.r,round:true,e:eid};}
  return{k:'point',p:q.m,e:eid};}
function cpt(p,a,b,c){const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);if(d1<=0&&d2<=0)return a;const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return b;const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0)return add(a,mul(ab,d1/(d1-d3)));const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return c;const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0)return add(a,mul(ac,d2/(d2-d6)));const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0)return add(b,mul(sub(c,b),(d4-d3)/((d4-d3)+(d5-d6))));const dn=1/(va+vb+vc);return add(a,add(mul(ab,vb*dn),mul(ac,vc*dn)));}
const BOX=new WeakMap();
function boxes(m){let B=BOX.get(m);if(B)return B;B=m.groups.map(g=>{const lo=[1e18,1e18,1e18],hi=[-1e18,-1e18,-1e18];for(let t=g[0];t<g[0]+g[1];t++){const v=m.idx[t]*3;for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],m.pos[v+k]);hi[k]=Math.max(hi[k],m.pos[v+k]);}}return{g,lo,hi};});BOX.set(m,B);return B;}
export function nearestFace(m,p,ty){const bd=b=>Math.hypot(...[0,1,2].map(k=>Math.max(0,b.lo[k]-p[k],p[k]-b.hi[k]))),L=boxes(m).filter(b=>!ty||(m.faces[b.g[2]]||{}).type===ty).map(b=>({b,lb:bd(b)})).sort((x,y)=>x.lb-y.lb);let best=-1,d=Infinity;for(const{b,lb}of L){if(lb>d)break;for(let t=b.g[0];t+2<b.g[0]+b.g[1];t+=3){const[a,bb,c]=tri(m,t),q=len(sub(cpt(p,a,bb,c),p));if(q<d){d=q;best=b.g[2];}}}return ty&&best<0?nearestFace(m,p):best;}
export function nearestEdge(m,p){const L=m.lines;let best=-1,bd=Infinity;for(const g of m.egroups)for(let k=g[0];k+1<g[0]+g[1];k++){const a=[L[3*k],L[3*k+1],L[3*k+2]],b=[L[3*k+3],L[3*k+4],L[3*k+5]],ab=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),ab)/(dot(ab,ab)||1e-18))),d=len(sub(add(a,mul(ab,t)),p));if(d<bd){bd=d;best=g[2];}}return best;}
const FTY=t=>{const u=String(t||'').toUpperCase();return u==='CYLINDER'?'CYLINDRE':u;},AXN={'+X':[1,0,0],'-X':[-1,0,0],'+Y':[0,1,0],'-Y':[0,-1,0],'+Z':[0,0,1],'-Z':[0,0,-1],X:[1,0,0],Y:[0,1,0],Z:[0,0,1]};
export function findFace(m,s){if(!m||!s)return-1;if(typeof s==='number')return s<m.faces.length?s:-1;const pk=s.pick||s.near,F=m.faces.map((q,i)=>({q,i,a:q.area||0})),b=m.props.bbox,sz=Math.hypot(...sub(b.max,b.min))||1;let C=F;
  if(s.side){const ax=AXN[s.side.length===1?'+'+s.side:s.side]||[0,0,1],i=ax.findIndex(v=>v),ext=ax[i]>0?b.max[i]:b.min[i];C=C.filter(x=>x.q.n&&dot(x.q.n,ax)>0.999&&Math.abs(x.q.c[i]-ext)<sz*1e-3+1e-6);}
  if(s.normal){const ax=Array.isArray(s.normal)?nrm(s.normal):AXN[s.normal];C=C.filter(x=>x.q.n&&dot(x.q.n,ax)>0.999);}
  if(s.type)C=C.filter(x=>x.q.type===FTY(s.type));
  if(s.r!=null){const r=+s.r;C=C.filter(x=>{const g=faceGeom(m,x.i);return g&&g.r!=null&&Math.abs(g.r-r)<Math.max(1e-3,r*0.02);});}
  if(pk&&!s.side&&!s.normal&&s.r==null){return nearestFace(m,pk,FTY(s.t||s.type)||undefined);}
  if(!C.length)return-1;if(pk)return C.map(x=>({i:x.i,d:len(sub(x.q.c,pk))})).sort((x,y)=>x.d-y.d)[0].i;C.sort((x,y)=>y.a-x.a);return C[Math.min(C.length-1,+s.i||0)].i;}
export function findEdge(m,s){if(!m||!s)return-1;if(typeof s==='number')return s<m.edges.length?s:-1;const pk=s.pick||s.near;if(pk&&!s.type)return nearestEdge(m,pk);let C=m.edges.map((q,i)=>({q,i})).filter(x=>!s.type||x.q.type===FTY(s.type));if(!C.length)return-1;if(pk)C.sort((x,y)=>len(sub(x.q.m,pk))-len(sub(y.q.m,pk)));else C.sort((x,y)=>y.q.len-x.q.len);return C[Math.min(C.length-1,+s.i||0)].i;}
const scl=(e,k)=>e&&(k===1?e:{...e,p:mul(e.p,k),...(e.r!=null?{r:e.r*k}:{})});
export function localEnt(m,ref,k=1){if(!ref)return null;if(ref.plane){const n={XY:[0,0,1],XZ:[0,-1,0],YZ:[1,0,0],FRONT:[0,-1,0],TOP:[0,0,1],RIGHT:[1,0,0]}[String(ref.plane).toUpperCase()];return n?{k:'plane',p:[0,0,0],n}:null;}if(ref.axis){const d=AXN[String(ref.axis).toUpperCase()];return d?{k:'line',p:[0,0,0],d}:null;}if(ref.point==='origin')return{k:'point',p:[0,0,0]};if(Array.isArray(ref.point))return{k:'point',p:mul(ref.point,k)};if(!m)return null;
  if(ref.face){const f=findFace(m,ref.face);return f<0?null:scl(faceGeom(m,f),k);}
  if(ref.edge){const e=findEdge(m,ref.edge);return e<0?null:scl(edgeGeom(m,e),k);}
  if(ref.vertex){const p=ref.vertex.pick||ref.vertex,e=nearestEdge(m,p),q=m.edges[e];if(!q)return null;return scl({k:'point',p:len(sub(q.a,p))<len(sub(q.b,p))?q.a:q.b},k);}
  return null;}
export function worldEnt(P,e){return e&&{...e,p:xf(P,e.p),...(e.n?{n:qrot(P.q,e.n)}:{}),...(e.d?{d:qrot(P.q,e.d)}:{})};}
export const MATES={coincident:'Coincident',concentric:'Concentric',distance:'Distance',angle:'Angle',parallel:'Parallel',perpendicular:'Perpendicular',tangent:'Tangent',lock:'Lock',width:'Width',symmetric:'Symmetric'};
export const EXTRA={width:['a','a2','b','b2'],symmetric:['a','b','s']};
export const refKeys=m=>EXTRA[m.type]||(m.type==='lock'?['a','b']:['a','b']);
const RK={plane:0,line:1,sphere:2,point:3},DIRK=e=>e.k==='plane'?e.n:e.k==='line'?e.d:null,bad=t=>{throw new Error(t);};
const mirror=(v,n)=>sub(v,mul(n,2*dot(v,n)));
export function mres(m,E,L=1){const t=m.type,s=m.align==='aligned'?-1:1,sg=m.flip?-1:1,v=+m.v||0;
  if(t==='lock'){const r=m.rel||{p:[0,0,0],q:[0,0,0,1]},ex=compose(E.Pa,r);return[...mul(sub(E.Pb.p,ex.p),1/L),...qlog(qmul(E.Pb.q,qconj(ex.q)))];}
  if(t==='width'){const{a,a2,b,b2}=E;if(![a,a2,b,b2].every(e=>e&&e.k==='plane'))bad('Width needs four flat faces: the two sides of the slot on one part and the two sides of the tab on the other.');return[...cross(a.n,b.n),dot(sub(mid(b.p,b2.p),mid(a.p,a2.p)),a.n)/L];}
  if(t==='symmetric'){const{a,b,s:S}=E;if(!S||S.k!=='plane')bad('Symmetric needs a flat face or plane to mirror about.');if(a.k!==b.k)bad('Symmetric needs two entities of the same kind (two faces, two points or two axes).');
    if(a.k==='plane')return[...cross(b.n,mirror(a.n,S.n)),(dot(sub(a.p,S.p),S.n)+dot(sub(b.p,S.p),S.n))/L];if(a.k==='line'){const pa=sub(a.p,mul(S.n,2*dot(sub(a.p,S.p),S.n)));return[...cross(b.d,mirror(a.d,S.n)),...mul(cross(sub(b.p,pa),b.d),1/L)];}return[dot(sub(mid(a.p,b.p),S.p),S.n)/L,...mul(cross(sub(b.p,a.p),S.n),1/L)];}
  let a=E.a,b=E.b;if(!a||!b)bad('Pick two entities.');if(RK[a.k]>RK[b.k])[a,b]=[b,a];const pk=a.k+'-'+b.k,P=e=>e.k==='sphere'?'point':e.k,q=P(a)+'-'+P(b),dl=(x,y)=>len(cross(sub(y.p,x.p),x.d));
  if(t==='parallel'||t==='perpendicular'||t==='angle'){const x=DIRK(a),y=DIRK(b);if(!x||!y)bad(MATES[t]+' needs flat faces, straight edges or axes.');if(t==='parallel')return cross(x,y);if(t==='perpendicular')return[dot(x,y)];const ang=Math.atan2(len(cross(x,y)),dot(x,y)),want=(m.flip?180-v:v)*Math.PI/180;return[ang-want];}
  if(t==='concentric'){if(a.k==='plane')bad('Concentric needs round faces, round edges, axes or points.');if(q==='line-line')return[...cross(a.d,b.d),...mul(cross(sub(b.p,a.p),a.d),1/L)];if(q==='line-point')return mul(cross(sub(b.p,a.p),a.d),1/L);return mul(sub(a.p,b.p),1/L);}
  if(t==='tangent'){if(pk==='plane-plane')return[...(s>0?add(a.n,b.n):sub(a.n,b.n)),dot(sub(b.p,a.p),a.n)/L];if(pk==='plane-line'&&b.round)return[dot(b.d,a.n),(dot(sub(b.p,a.p),a.n)-sg*b.r)/L];if(pk==='plane-sphere')return[(dot(sub(b.p,a.p),a.n)-sg*b.r)/L];if(pk==='line-line'&&a.round&&b.round)return[...cross(a.d,b.d),(dl(a,b)-(m.flip?Math.abs(a.r-b.r):a.r+b.r))/L];if(pk==='line-sphere'&&a.round)return[(dl(a,b)-(a.r+b.r))/L];if(pk==='sphere-sphere')return[(len(sub(a.p,b.p))-(m.flip?Math.abs(a.r-b.r):a.r+b.r))/L];bad('Tangent needs a round face (cylinder or sphere) and a flat or round face.');}
  if(t!=='coincident'&&t!=='distance')bad('Unknown mate type '+t);const D=t==='distance',dv=D?v*sg:0,av=D?Math.abs(v):0;
  if(pk==='plane-plane')return[...(s>0?add(a.n,b.n):sub(a.n,b.n)),(dot(sub(b.p,a.p),a.n)-dv)/L];
  if(a.k==='plane'&&b.k==='line')return[dot(b.d,a.n),(dot(sub(b.p,a.p),a.n)-dv)/L];
  if(a.k==='plane')return[(dot(sub(b.p,a.p),a.n)-dv)/L];
  if(q==='line-line')return D?[...cross(a.d,b.d),(dl(a,b)-av)/L]:[...cross(a.d,b.d),...mul(cross(sub(b.p,a.p),a.d),1/L)];
  if(q==='line-point')return D?[(dl(a,b)-av)/L]:mul(cross(sub(b.p,a.p),a.d),1/L);
  return D?[(len(sub(a.p,b.p))-av)/L]:mul(sub(a.p,b.p),1/L);}
export function guess(m,E){const t=m.type;if(t==='lock'&&E.Pa&&E.Pb&&!m.rel){const r=compose(inv(E.Pa),E.Pb);m.rel={p:r.p.map(v=>+v.toFixed(9)),q:r.q.map(v=>+v.toFixed(12))};return m;}let a=E.a,b=E.b;if(!a||!b)return m;if(RK[a.k]>RK[b.k])[a,b]=[b,a];
  if(a.k==='plane'&&b.k==='plane'&&['coincident','distance','tangent'].includes(t)&&m.align==null)m.align=dot(a.n,b.n)>0?'aligned':'anti';
  if(t==='distance'&&m.v==null){const d=a.k==='plane'?dot(sub(b.p,a.p),a.n):a.k==='line'&&b.k!=='plane'?len(cross(sub(b.p,a.p),a.d)):len(sub(a.p,b.p));m.v=+Math.abs(d).toFixed(6);if(a.k==='plane'&&d<0)m.flip=true;}
  if(t==='tangent'&&a.k==='plane'&&(b.k==='sphere'||b.round)&&m.flip==null&&dot(sub(b.p,a.p),a.n)<0)m.flip=true;
  if(t==='angle'&&m.v==null){const x=DIRK(a),y=DIRK(b);if(x&&y)m.v=+(Math.atan2(len(cross(x,y)),dot(x,y))*180/Math.PI).toFixed(4);}
  return m;}
export function suggest(a,b){const r=e=>e&&(e.round||e.k==='sphere');return!a||!b?[]:a.k==='plane'&&b.k==='plane'?['coincident','distance','parallel','perpendicular','angle','lock']:r(a)&&r(b)?['concentric','tangent','coincident','distance','parallel','lock']:r(a)&&b.k==='plane'||r(b)&&a.k==='plane'?['tangent','coincident','distance','perpendicular','parallel','lock']:a.k==='point'||b.k==='point'?['coincident','distance','concentric','lock']:['coincident','distance','parallel','perpendicular','angle','lock'];}
function lm(n,rf,jf,x,iters){let r=rf(x),err=ss(r),lam=1e-3,it=0,prev=Infinity;for(;it<iters&&err>1e-28&&prev-err>1e-18*(1+err);it++){prev=err;const J=jf(x,r),A=Array.from({length:n},()=>new Float64Array(n)),g=new Float64Array(n);for(let k=0;k<J.length;k++){const row=J[k],nz=[];for(let i=0;i<n;i++)if(row[i])nz.push(i);for(const i of nz){g[i]-=row[i]*r[k];for(const j of nz)A[i][j]+=row[i]*row[j];}}
    let ok=false;for(let t=0;t<14&&!ok;t++){const A2=[...A].map((row,i)=>{const o=Array.from(row);o[i]+=lam*(o[i]+1e-9)+1e-14;return o;}),d=lsolve(A2,Array.from(g),n),x2=x.map((v,i)=>v+d[i]),r2=rf(x2),e2=ss(r2);if(e2<err&&isFinite(e2)){x=x2;r=r2;err=e2;lam=Math.max(lam/5,1e-12);ok=true;}else lam*=8;}if(!ok)break;}return{x,err,it};}
export function solve(st,opt={}){const t0=performance.now(),L=st.L||1,C=new Map(st.comps.map(c=>[c.id,c])),pose=new Map(st.comps.map(c=>[c.id,poseOf(c)])),ground=id=>id===ORIGIN||C.has(id)&&!!C.get(id).fix,errors=[],live=[],tol=opt.tol||1e-7;pose.set(ORIGIN,{p:[0,0,0],q:[0,0,0,1]});
  for(const m of st.mates||[]){if(m.off)continue;const ks=refKeys(m),R={};let bad2=null;for(const k of ks){const ref=m[k];if(!ref){bad2='Pick '+(ks.length>2?ks.length+' entities':'two entities')+'.';break;}if(ref.c!==ORIGIN&&!C.has(ref.c)){bad2='A component this mate uses was deleted.';break;}const e=st.ent(ref);if(!e){bad2='The '+(ref.face?'face':ref.edge?'edge':'entity')+' on '+((C.get(ref.c)||{}).name||ref.c)+' that this mate uses is gone (the part changed). Edit the mate and pick it again.';break;}R[k]={c:ref.c,e};}
    if(!bad2){const cs=[...new Set(ks.map(k=>R[k].c))];if(m.type!=='symmetric'&&cs.length<2&&!m.self)bad2='Both entities are on the same component. Pick entities on two different components.';else try{const E=world(m,R,pose);guess(m,E);const r=mres(m,E,L);if(r.some(v=>!isFinite(v)))bad2='This mate has degenerate geometry.';else live.push({m,R,cs,free:cs.filter(c=>!ground(c)),nr:r.length});}catch(e){bad2=e.message;}}
    if(bad2)errors.push({id:m.id,msg:bad2});}
  const par=new Map(),find=x=>{while(par.get(x)!==x){par.set(x,par.get(par.get(x)));x=par.get(x);}return x;};for(const l of live)for(const c of l.free)par.has(c)||par.set(c,c);for(const l of live)for(let i=1;i<l.free.length;i++)par.set(find(l.free[i]),find(l.free[0]));
  const clusters=new Map();for(const c of par.keys()){const r=find(c);clusters.has(r)||clusters.set(r,{comps:[],mates:[]});clusters.get(r).comps.push(c);}for(const l of live)if(l.free.length)clusters.get(find(l.free[0])).mates.push(l);
  const conflicts=[],redundant=[],dof={},info={};let iters=0,ok=true;
  for(const l of live)if(!l.free.length){const r=mres(l.m,world(l.m,l.R,pose),L);if(Math.sqrt(ss(r))>tol*10){ok=false;conflicts.push({id:l.m.id,with:[],msg:'Both components are fixed, so this mate cannot move them. Float one of them.'});}else if(opt.analyze)redundant.push(l.m.id);}
  for(const cl of clusters.values()){const res=solveCluster(cl,pose,L,opt,tol);iters+=res.it;cl.comps.forEach((c,i)=>pose.set(c,res.P[i]));if(!res.ok){ok=false;for(const k of res.conflicts)conflicts.push(k);}redundant.push(...res.redundant);Object.assign(dof,res.dof);Object.assign(info,res.info);}
  for(const c of st.comps)if(!(c.id in dof))dof[c.id]=c.fix?0:6;
  return{ok:ok&&!conflicts.length,poses:pose,dof,info,total:Object.values(dof).reduce((a,b)=>a+b,0),errors,conflicts,redundant,it:iters,ms:performance.now()-t0,clusters:clusters.size};}
function world(m,R,pose){const E={};for(const k in R)E[k]=worldEnt(pose.get(R[k].c),R[k].e);if(m.type==='lock'){E.Pa=pose.get(R.a.c);E.Pb=pose.get(R.b.c);}return E;}
function solveCluster(cl,pose,L,opt,tol){const K=cl.comps.length,n=6*K,ix=new Map(cl.comps.map((c,i)=>[c,i])),base=cl.comps.map(c=>pose.get(c)),dr=opt.drag&&ix.has(opt.drag.c)?opt.drag:null,tg=opt.target&&ix.has(opt.target.c)?opt.target:null;
  const P=(x,i)=>({p:add(base[i].p,[x[6*i],x[6*i+1],x[6*i+2]]),q:qn(qmul(qexp([x[6*i+3],x[6*i+4],x[6*i+5]]),base[i].q))}),pm=x=>{const M=new Map(pose);cl.comps.forEach((c,i)=>M.set(c,P(x,i)));return M;},one=(x,i)=>{const M=new Map(pose);M.set(cl.comps[i],P(x,i));return M;};
  const mk=(mates,extra)=>{const B=[];let off=0;for(const l of mates){B.push({cs:l.free.map(c=>ix.get(c)),n:l.nr,off,f:x=>mres(l.m,world(l.m,l.R,l.free.length>1?pm(x):one(x,ix.get(l.free[0]))),L)});off+=l.nr;}
    if(extra){const w=opt.reg??1e-3;for(let i=0;i<K;i++){B.push({cs:[i],n:6,off,f:x=>[0,1,2,3,4,5].map(j=>w*x[6*i+j]*(j<3?1/L:1))});off+=6;}
      if(dr){const i=ix.get(dr.c),w2=opt.wdrag??3e-2;B.push({cs:[i],n:3,off,f:x=>mul(sub(xf(P(x,i),dr.lp),dr.wp),w2/L)});off+=3;}
      if(tg){const i=ix.get(tg.c),w2=opt.wdrag??3e-2;B.push({cs:[i],n:6,off,f:x=>{const q=P(x,i);return[...mul(sub(q.p,tg.p),w2/L),...mul(qlog(qmul(q.q,qconj(tg.q))),w2)];}});off+=6;}}
    const T=Array.from({length:K},()=>[]);B.forEach(b=>b.cs.forEach(i=>T[i].push(b)));return{B,T,rows:off};};
  const sys=S=>({rf:x=>{const r=new Array(S.rows);for(const b of S.B){const v=b.f(x);for(let k=0;k<b.n;k++)r[b.off+k]=v[k];}return r;},jf:(x,r0)=>{const J=Array.from({length:S.rows},()=>new Float64Array(n)),y=x.slice();for(let i=0;i<K;i++)for(let j=6*i;j<6*i+6;j++){const h=1e-7;y[j]=x[j]+h;for(const b of S.T[i]){const v=b.f(y);for(let k=0;k<b.n;k++)J[b.off+k][j]=(v[k]-r0[b.off+k])/h;}y[j]=x[j];}return J;}});
  const S1=mk(cl.mates,true),S0=mk(cl.mates,false),A1=sys(S1),A0=sys(S0),it=opt.iters||(dr||tg?24:60);let x=new Array(n).fill(0),R1=lm(n,A1.rf,A1.jf,x,it);x=R1.x;const R0=lm(n,A0.rf,A0.jf,x,it);x=R0.x;
  const err=Math.sqrt(R0.err),ok=err<tol,out={P:cl.comps.map((c,i)=>P(x,i)),ok,it:R1.it+R0.it,err,conflicts:[],redundant:[],dof:{},info:{}};
  if(opt.fast&&ok)return out;
  const J=A0.jf(x,A0.rf(x)),N=nullInfo(J,n,1e-6);cl.comps.forEach((c,i)=>{const sub6=(a,b)=>N.basis.map(v=>v.slice(6*i+a,6*i+b)),rk=M=>M.length?nullInfo(M,M[0].length,1e-6).rank:0;out.dof[c]=rk(sub6(0,6));out.info[c]={trans:rk(sub6(0,3)),rot:rk(sub6(3,6))};});
  if(opt.analyze&&ok)for(const l of cl.mates){const S=mk(cl.mates.filter(z=>z!==l),false);if(!S.rows)continue;const Jm=sys(S).jf(x,sys(S).rf(x));if(nullInfo(Jm,n,1e-6).rank===N.rank)out.redundant.push(l.m.id);}
  if(!ok){const r=A0.rf(x),by=S0.B.map((b,k)=>({l:cl.mates[k],e:Math.sqrt(ss(r.slice(b.off,b.off+b.n)))})).sort((p,q)=>q.e-p.e),bad3=[];for(const{l}of by.slice(0,40)){const S=mk(cl.mates.filter(z=>z!==l),false),Q=sys(S),R=lm(n,Q.rf,Q.jf,x.slice(),40);if(Math.sqrt(R.err)<tol)bad3.push(l);}const list=bad3.length?bad3:by.filter(z=>z.e>tol).map(z=>z.l);
    for(const l of list)out.conflicts.push({id:l.m.id,with:cl.mates.filter(z=>z!==l&&z.cs.some(c=>l.cs.includes(c))).map(z=>z.m.id),err:by.find(z=>z.l===l).e});}
  return out;}
