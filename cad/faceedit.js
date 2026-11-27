import * as R from './vendor/replicad.js';
import {heliumSync} from './he/host.js';
import {axisRef} from './datum.js';
const PF=await heliumSync('faceedit');let H=null;
const he=()=>H||(H=PF({}),H.ex.fe_init(),H),MODES={delete:0,offset:1,move:2};
const err=m=>{throw new Error(m);};
function surf(oc,f){const A=new oc.BRepAdaptor_Surface(f.wrapped,true),T=oc.GeomAbs_SurfaceType,g=A.GetType(),t=g===T.GeomAbs_Plane?1:g===T.GeomAbs_Cylinder?2:g===T.GeomAbs_Cone?3:g===T.GeomAbs_Sphere?4:g===T.GeomAbs_Torus?5:0;if(!t){A.delete();return null;}
  const q=t===1?A.Plane():t===2?A.Cylinder():t===3?A.Cone():t===4?A.Sphere():A.Torus(),P=q.Position(),xyz=p=>[p.X(),p.Y(),p.Z()],o=[t,...xyz(P.Location()),...xyz(P.Direction()),...xyz(P.XDirection()),...xyz(P.YDirection()),t===1?0:t===3?q.RefRadius():t===5?q.MajorRadius():q.Radius(),t===3?q.SemiAngle():t===5?q.MinorRadius():0,1];A.delete();return o;}
function sample(oc,f){const loc=new oc.TopLoc_Location(),T=oc.BRep_Tool.Triangulation(f.wrapped,loc,0);if(!T||T.isNull()||!T.HasUVNodes())return null;let bi=0,ba=-1;
  for(let i=1;i<=T.NbTriangles();i++){const t=T.Triangle(i),P=[1,2,3].map(k=>T.Node(t.Value(k))),a=[P[1].X()-P[0].X(),P[1].Y()-P[0].Y(),P[1].Z()-P[0].Z()],b=[P[2].X()-P[0].X(),P[2].Y()-P[0].Y(),P[2].Z()-P[0].Z()],c=Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]);c>ba&&(ba=c,bi=i);}
  if(!bi)return null;const t=T.Triangle(bi),uv=[1,2,3].map(k=>T.UVNode(t.Value(k))),u=(uv[0].X()+uv[1].X()+uv[2].X())/3,v=(uv[0].Y()+uv[1].Y()+uv[2].Y())/3,G=new oc.BRepGProp_Face(f.wrapped,false),p=new oc.gp_Pnt(),n=new oc.gp_Vec();G.Normal(u,v,p,n);const m=n.Magnitude()||1,o=[p.X(),p.Y(),p.Z(),n.X()/m,n.Y()/m,n.Z()/m];[G,p,n,loc].forEach(x=>x.delete());return o;}
function ext(oc,f,b){const s=oc.BRep_Tool.Surface(f.wrapped),m=new oc.BRepBuilderAPI_MakeFace(s,b[0],b[1],b[2],b[3],1e-7);if(!m.IsDone())err('could not extend a face around the edit');const r=new R.Face(m.Face());m.delete();return r;}
function offs(oc,f,d,o=f){const mo=new oc.BRepOffsetAPI_MakeOffsetShape();mo.PerformBySimple(f.wrapped,d*(o.wrapped.Orientation()===oc.TopAbs_Orientation.TopAbs_FORWARD?1:-1));if(!mo.IsDone())err('could not offset a face');const r=R.cast(mo.Shape());mo.delete();return r;}
function split(oc,s,tools){const A=new oc.NCollection_List_TopoDS_Shape(),L=new oc.NCollection_List_TopoDS_Shape(),b=new oc.BRepAlgoAPI_Splitter();A.Append(s.wrapped);tools.forEach(t=>L.Append(t.wrapped));b.SetArguments(A);b.SetTools(L);b.Build(new oc.Message_ProgressRange());if(b.HasErrors())err('could not split the part around the faces');const r=R.cast(b.Shape());[A,L,b].forEach(x=>x.delete());return r.constructor.name==='Solid'?[r]:r.solids||[];}
export function faceEdit(mode,f,body,K){
  if(!body)err('face editing needs a part');if(f.faces&&f.faces.by==='pick'&&!(f.faces.pts||[]).length)return{shape:body,warn:'pick the faces in the view'};const oc=R.getOC(),sel=K.selectFaces(body,f.faces||{side:'+Z'});if(!sel.length)err('no faces matched');
  const bb0=K.bboxOf(body),size=Math.hypot(...bb0.max.map((v,i)=>v-bb0.min[i]))||1,mtol=0.02*size;body.mesh({tolerance:mtol,angularTolerance:0.5});
  const hs=new Set(sel.map(q=>q.f.hashCode)),F=body.faces.filter(g=>hs.has(g.hashCode)),eh=new Set(F.flatMap(g=>g.edges.map(e=>e.hashCode))),N=body.faces.filter(g=>!hs.has(g.hashCode)&&g.edges.some(e=>eh.has(e.hashCode)));
  const d=+f.d||0;if(mode==='offset'&&!d)return{shape:body};
  const ang=+f.angle||0,ax=axisRef(f.axis),aw=ax?ax.d:K.AXV(f.axis||'Z'),ap=ax?ax.p:[+f.ox||0,+f.oy||0,+f.oz||0],tv=[+f.dx||0,+f.dy||0,+f.dz||0];if(mode==='move'&&!ang&&tv.every(v=>!v))return{shape:body};
  const mv=s=>{let q=s;if(ang)q=q.rotate(ang,ap,aw);return tv.some(Boolean)?q.translate(tv):q;};
  const SDs=[...F,...N].map(g=>surf(oc,g));SDs.forEach((s,i)=>s||err('Face editing works on flat, cylindrical, conical, spherical and toroidal faces; '+(i<F.length?'a picked face':'a face next to the pick')+' is a freeform surface'));
  const ORs=[...F,...N].map(g=>sample(oc,g));ORs.some(s=>!s)&&err('a face could not be sampled');
  let bb=R.makeCompound(F.map(g=>g.clone())).boundingBox.bounds;if(mode==='move'){const b2=mv(R.makeCompound(F.map(g=>g.clone()))).boundingBox.bounds;bb=[bb[0].map((v,i)=>Math.min(v,b2[0][i])),bb[1].map((v,i)=>Math.max(v,b2[1][i]))];}
  const dg=Math.hypot(...bb[1].map((v,i)=>v-bb[0][i])),mg=0.5*dg+Math.abs(d)+1e-3*size,lo=bb[0].map(v=>v-mg),hi=bb[1].map(v=>v+mg),nf=F.length,nb=N.length,h=he();
  h.ex.fe_size(nf,nb);const SD=h.v(3),OR=h.v(4),I=h.v(1);SDs.forEach((s,i)=>SD.set(s,16*(i<nf?i:nf+i)));ORs.forEach((s,i)=>OR.set(s,6*i));I.fill(0);I.set([MODES[mode],d,...tv,...ap,...aw,ang,1e-5*size+1e-6,...lo,...hi]);
  const pr=h.ex.fe_prep();pr<0&&err('An offset of '+K.fu(d)+' closes up picked face '+(-pr)+'; use a smaller offset');const BD=Float64Array.from(h.v(5)),bd=k=>Array.from(BD.subarray(4*k,4*k+4));
  const tools=N.map((g,m)=>ext(oc,g,bd(2*nf+m))),FP=mode==='delete'?[]:F.map((g,j)=>mode==='offset'?offs(oc,ext(oc,g,bd(j)),d,g):mv(ext(oc,g,bd(nf+j)))),FPT=mode==='delete'?[]:F.map(g=>mode==='offset'?offs(oc,g,d):mv(g.clone()));
  const Rb=R.makeBox(lo,hi),all=[...tools,...FP,...FPT],ins=split(oc,body.clone().intersect(Rb.clone()),all),outs=split(oc,Rb.cut(body.clone()),all),cells=[...ins.map(c=>[c,1]),...outs.map(c=>[c,0])];
  const S=[];cells.forEach(([c],ci)=>{c.mesh({tolerance:mtol,angularTolerance:0.5});for(const g of c.faces){const s=sample(oc,g);s&&S.push([ci,...s]);}});
  h.ex.fe_cells(S.length,cells.length);const SP=h.v(6);S.forEach((s,i)=>SP.set(s,7*i));h.v(20).set(cells.map(c=>c[1]));h.ex.fe_onsurf();
  const nk=2*nf+nb,OS=h.v(21),tr=[...F,...FPT],tol=1e-5*size+1e-6;for(let i=0;i<S.length;i++)for(let k=0;k<2*nf;k++)if(OS[i*nk+k]&&!(K.pdist(S[i].slice(1,4),tr[k])<tol))OS[i*nk+k]=0;
  const nflip=h.ex.fe_decide(),FL=Array.from(h.v(22));
  if(!nflip)err(mode==='delete'?'The faces around the pick cannot grow to close the gap, so it cannot be deleted; pick the whole feature (for a hole or boss, all of its faces)':'This edit leaves the part unchanged');
  const pick=w=>cells.filter((c,i)=>FL[i]&&c[1]===w).map(c=>c[0]);let r=body.clone();const co=pick(1),ci=pick(0);if(co.length)r=r.cut(R.makeCompound(co));if(ci.length)r=r.fuse(R.makeCompound(ci));
  if(!(K.volOf(r)>0))err('The edit removed the whole part');
  return{shape:r};}
export const FEDIT={face_delete:(f,b,K)=>faceEdit('delete',f,b,K),face_offset:(f,b,K)=>faceEdit('offset',f,b,K),face_move:(f,b,K)=>faceEdit('move',f,b,K)};
