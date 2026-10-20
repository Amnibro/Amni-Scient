import * as R from './vendor/replicad.js';
import * as D from './datum.js';
import {add,sub,mul,dot,cross,len,nrm,vec as V,r9} from './qmath.js';
import {solidsOf} from './features2.js';
const DEG=180/Math.PI,v9=a=>a.map(r9),acute=(a,b)=>Math.acos(Math.min(1,Math.abs(dot(nrm(a),nrm(b)))))*DEG,obt=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(nrm(a),nrm(b)))))*DEG;
const dist=(s1,s2)=>{const oc=R.getOC(),d=new oc.BRepExtrema_DistShapeShape();try{d.LoadS1(s1.wrapped);d.LoadS2(s2.wrapped);d.Perform();if(!d.IsDone()||!d.NbSolution())throw new Error('the distance could not be measured');const a=d.PointOnShape1(1),b=d.PointOnShape2(1),o={d:d.Value(),a:[a.X(),a.Y(),a.Z()],b:[b.X(),b.Y(),b.Z()]};a.delete&&a.delete();b.delete&&b.delete();return o;}finally{d.delete();}};
const big=(K,body)=>{const b=body?body.boundingBox.bounds:[[0,0,0],[1,1,1]];return 40*Math.max(Math.hypot(b[1][0]-b[0][0],b[1][1]-b[0][1],b[1][2]-b[0][2]),1e-3);};
function datumItem(id,d,body,K){
  const S=big(K,body);
  if(d.kind==='plane')return{kind:'plane',id,c:d.o,n:d.n,shape:R.drawRectangle(S,S).sketchOnPlane(new R.Plane(d.o,d.x,d.n)).face(),info:{kind:'datum plane',id,point:v9(d.o),normal:v9(d.n)}};
  if(d.kind==='axis')return{kind:'axis',id,c:d.p,t:d.d,shape:R.makeLine(sub(d.p,mul(d.d,S)),add(d.p,mul(d.d,S))),info:{kind:'datum axis',id,point:v9(d.p),direction:v9(d.d)}};
  return{kind:'point',id,c:d.p,shape:R.makeVertex(d.p),info:{kind:'datum point',id,point:v9(d.p)}};
}
export function item(body,K,ref){
  const oc=R.getOC();
  if(ref.point){const p=ref.point.map(Number);if(p.length<3||p.some(v=>!isFinite(v)))throw new Error('a point needs x, y and z');return{kind:'point',c:p,shape:R.makeVertex(p),info:{kind:'point',point:v9(p)}};}
  if(ref.datum!==undefined){const d=D.get(ref.datum);if(!d)throw new Error('datum "'+ref.datum+'" was not found');return datumItem(ref.datum,d,body,K);}
  if(!body)throw new Error('nothing is built yet');
  if(ref.solid!==undefined){const s=solidsOf(body)[+ref.solid];if(!s)throw new Error('there is no solid '+ref.solid+'; the part has '+solidsOf(body).length);const p=R.measureShapeVolumeProperties(s),c=p.centerOfMass,b=s.boundingBox.bounds;return{kind:'solid',shape:s,c:V(c),info:{kind:'solid',index:+ref.solid,volume:r9(Math.abs(p.volume)),area:r9(R.measureArea(s)),center_of_mass:v9(V(c)),bbox_min:v9(b[0]),bbox_max:v9(b[1]),size:v9(b[1].map((v,i)=>v-b[0][i]))}};}
  if(ref.body){const p=R.measureShapeVolumeProperties(body),c=p.centerOfMass,b=body.boundingBox.bounds;return{kind:'solid',shape:body,c:V(c),info:{kind:'body',solids:solidsOf(body).length,volume:r9(Math.abs(p.volume)),area:r9(R.measureArea(body)),center_of_mass:v9(V(c)),bbox_min:v9(b[0]),bbox_max:v9(b[1]),size:v9(b[1].map((v,i)=>v-b[0][i]))}};}
  if(ref.face!==undefined){
    const q=K.selectFaces(body,ref.face);if(!q.length)throw new Error('no face matched');if(q.length>1)throw new Error(q.length+' faces matched; pick one with {"by":"pick","pts":[[x,y,z]]} or a face id from get_state');const f=q[0],i={kind:'face',type:f.type.toLowerCase(),area:r9(R.measureArea(f.f)),center:v9(f.c)};let n=null,t=null;
    try{i.perimeter=r9(f.f.edges.reduce((a,e)=>a+e.length,0));}catch{}
    if(f.type==='PLANE'&&f.n){n=f.n;i.normal=v9(n);}else if(/CYLINDRE|CONE/.test(f.type)){const g=D.cylGeom(oc,f.f,f.type);i.axis=v9(g.d);i.axis_point=v9(g.p);i.radius=r9(g.r);i.diameter=r9(2*g.r);t=g.d;}
    return{kind:'face',c:f.c,n,t,shape:f.f,info:i};
  }
  if(ref.edge!==undefined){
    const q=K.selectEdges(body,ref.edge);if(!q.length)throw new Error('no edge matched');if(q.length>1)throw new Error(q.length+' edges matched; pick one with {"by":"pick","pts":[[x,y,z]]} or an edge id');const e=q[0],i={kind:'edge',type:e.type.toLowerCase(),length:r9(e.len),start:v9(e.a),end:v9(e.b),midpoint:v9(e.m)};let t=null,n=null;
    if(e.type==='LINE'){t=nrm(sub(e.b,e.a));i.direction=v9(t);}else if(e.type==='CIRCLE'){const c=new oc.BRepAdaptor_Curve(e.e.wrapped),ci=c.Circle(),ax=ci.Axis(),l=ci.Location(),d=ax.Direction();i.radius=r9(ci.Radius());i.diameter=r9(2*ci.Radius());i.center=v9([l.X(),l.Y(),l.Z()]);i.axis=v9([d.X(),d.Y(),d.Z()]);n=[d.X(),d.Y(),d.Z()];t=n;c.delete&&c.delete();}
    return{kind:'edge',c:e.m,t,n,shape:e.e,info:i,line:e.type==='LINE'};
  }
  throw new Error('say what to measure with face, edge, point, datum, solid or body');
}
export function measure(body,K,a,b){
  const A=item(body,K,a),out={a:A.info};
  if(!b)return out;
  const B=item(body,K,b),dd=dist(A.shape,B.shape);out.b=B.info;out.min_distance=r9(dd.d);out.closest_a=v9(dd.a);out.closest_b=v9(dd.b);out.delta=v9(sub(dd.b,dd.a));
  if(A.c&&B.c)out.center_distance=r9(len(sub(B.c,A.c)));
  const pl=x=>x.kind==='plane'||x.kind==='face'&&x.n,ln=x=>x.kind==='axis'||x.kind==='edge'&&(x.line||x.info.type==='circle')||x.kind==='face'&&x.t;
  if(pl(A)&&pl(B)){out.angle_deg=r9(acute(A.n,B.n));out.normals_angle_deg=r9(obt(A.n,B.n));if(out.angle_deg<1e-7){out.parallel=true;out.gap=r9(Math.abs(dot(sub(B.c,A.c),nrm(A.n))));}}
  else if(pl(A)&&ln(B)&&B.t){out.angle_deg=r9(90-acute(A.n,B.t));}
  else if(pl(B)&&ln(A)&&A.t){out.angle_deg=r9(90-acute(B.n,A.t));}
  else if(ln(A)&&ln(B)&&A.t&&B.t){out.angle_deg=r9(acute(A.t,B.t));if(out.angle_deg<1e-7)out.parallel=true;}
  return out;
}
export function run({body,K},args){
  const a=args&&args.a,b=args&&args.b;if(!a)throw new Error('measure needs a');return measure(body,K,a,b);
}
