import {add,sub,mul,dot,cross,len,nrm} from './qmath.js';
export const NAMED={XY:{n:[0,0,1],x:[1,0,0]},XZ:{n:[0,-1,0],x:[1,0,0]},YZ:{n:[1,0,0],x:[0,1,0]}};
let DAT={};
export const reset=()=>{DAT={};};
export const put=(id,d)=>{d?DAT[id]=d:delete DAT[id];};
export const get=id=>DAT[id];
export const list=()=>Object.entries(DAT).map(([id,d])=>({id,...d}));
const miss=(id,k)=>new Error('datum '+k+' "'+id+'" was not found; add it before this feature and keep it unsuppressed');
export function datumPlane(f){const d=DAT[f.datum];if(!d||d.kind!=='plane')throw miss(f.datum,'plane');const o=add(d.o,mul(d.n,+f.offset||0));return{o,n:d.n,x:d.x,c:o};}
export const planeRef=(v,off=0)=>NAMED[v]?(({n,x})=>({o:mul(n,off),n,x}))(NAMED[v]):datumPlane({datum:v,offset:off});
export const axisRef=a=>{if(a&&typeof a==='object'&&!Array.isArray(a)&&a.p&&a.d)return{p:a.p.map(Number),d:nrm(a.d.map(Number))};const d=typeof a==='string'&&DAT[a];return d&&d.kind==='axis'?{p:d.p,d:d.d}:null;};
export const rot=(v,u,t)=>{const c=Math.cos(t),s=Math.sin(t),k=dot(u,v)*(1-c),w=cross(u,v);return[v[0]*c+w[0]*s+u[0]*k,v[1]*c+w[1]*s+u[1]*k,v[2]*c+w[2]*s+u[2]*k];};
export const lineOf=(n1,h1,n2,h2)=>{const d=cross(n1,n2),dd=dot(d,d);if(dd<1e-12)throw new Error('the two planes are parallel, so they have no line of intersection');const a=mul(cross(n2,d),h1/dd),b=mul(cross(d,n1),h2/dd);return{p:add(a,b),d:nrm(d)};};
export function frameOfPlane(f,body,K){
  const off=+f.offset||0,m=f.plane||'XY';
  if(NAMED[m]||m==='face'||m==='datum'){const P=K.planeFrom({plane:m,face:f.face,datum:f.datum,offset:off},body);return{o:P.o,n:P.n,x:P.x};}
  if(m==='points'){const q=(f.pts||[]).map(p=>p.map(Number));if(q.length<3||q.some(p=>p.length<3||p.some(v=>!isFinite(v))))throw new Error('a plane through points needs 3 points with x, y and z');const a=sub(q[1],q[0]),n0=cross(a,sub(q[2],q[0]));if(len(n0)<1e-9*(len(a)||1)*(len(sub(q[2],q[0]))||1))throw new Error('the 3 points lie on one line, so they do not define a plane');const n=nrm(n0);return{o:add(q[0],mul(n,off)),n,x:nrm(a)};}
  if(m==='angle'){const ax=axisRef(f.axis);if(!ax)throw miss(f.axis,'axis');const B=planeRef(f.from||'XY'),t=(+f.angle||0)*Math.PI/180,n=rot(B.n,ax.d,t),x=rot(B.x,ax.d,t),o=add(ax.p,rot(sub(B.o,ax.p),ax.d,t));return{o:add(o,mul(n,off)),n,x};}
  if(m==='mid'){const [a,b]=[f.fa,f.fb].map(s=>K.selectFaces(body,s)[0]);if(!a||!b)throw new Error('both faces of a mid-plane must exist');if(a.type!=='PLANE'||b.type!=='PLANE'||Math.abs(Math.abs(dot(a.n,b.n))-1)>1e-7)throw new Error('a mid-plane needs two parallel flat faces');const n=nrm(a.n),o=add(a.c,mul(n,dot(sub(b.c,a.c),n)/2));return{o:add(o,mul(n,off)),n,x:Math.abs(n[2])>0.9?[1,0,0]:nrm(cross([0,0,1],n))};}
  throw new Error('a datum plane is defined by XY, XZ, YZ, face, datum, points, angle or mid, not "'+m+'"');
}
export function frameOfAxis(f,body,K){
  const m=f.mode||'points';
  if(m==='points'){const q=(f.pts||[]).map(p=>p.map(Number));if(q.length<2||q.some(p=>p.length<3||p.some(v=>!isFinite(v))))throw new Error('an axis through points needs 2 points with x, y and z');const d=sub(q[1],q[0]);if(len(d)<1e-9)throw new Error('the 2 points are the same point');return{p:q[0],d:nrm(d)};}
  if(m==='planes'){const A=planeRef(f.pa||'XY'),Bp=planeRef(f.pb||'XZ');return lineOf(A.n,dot(A.n,A.o),Bp.n,dot(Bp.n,Bp.o));}
  if(!body)throw new Error('this axis needs a part to measure from');
  if(m==='edge'){const e=K.selectEdges(body,f.edges)[0];if(!e||e.type!=='LINE')throw new Error('pick a straight edge for the axis');return{p:e.a,d:nrm(sub(e.b,e.a))};}
  if(m==='cylinder'){const q=K.selectFaces(body,f.faces)[0];if(!q||!/CYLINDRE|CONE/.test(q.type))throw new Error('pick a round face (cylinder or cone) for the axis');const oc=K.R.getOC(),s=new oc.BRepAdaptor_Surface(q.f.wrapped,true),a=(q.type==='CONE'?s.Cone():s.Cylinder()).Axis(),l=a.Location(),d=a.Direction(),r={p:[l.X(),l.Y(),l.Z()],d:[d.X(),d.Y(),d.Z()]};s.delete&&s.delete();return r;}
  throw new Error('an axis is defined by points, cylinder, planes or edge, not "'+m+'"');
}
export function frameOfPoint(f,body,K){
  const m=f.mode||'xyz';
  if(m==='xyz')return{p:[+f.x||0,+f.y||0,+f.z||0]};
  if(!body)throw new Error('this point needs a part to measure from');
  if(m==='edge'){const e=K.selectEdges(body,f.edges)[0];if(!e)throw new Error('the edge was not found');return{p:e.m};}
  if(m==='face'){const q=K.selectFaces(body,f.faces)[0];if(!q)throw new Error('the face was not found');return{p:q.c};}
  throw new Error('a point is defined by xyz, edge or face, not "'+m+'"');
}
