import PC from './vendor/polygon-clipping.js';
const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),area=r=>r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2,same=(a,b,t)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=t,scaleOf=P=>Math.max(1e-9,...P.map(p=>Math.max(Math.abs(p[0]),Math.abs(p[1]))));
const SAG=1;
export class ProfileError extends Error{}
export function arcFlat(a,b,s,n=18){
  const dx=b[0]-a[0],dy=b[1]-a[1],c=Math.hypot(dx,dy),nl=[-dy/c*SAG,dx/c*SAG],m=[(a[0]+b[0])/2,(a[1]+b[1])/2],sg=Math.sign(s),r=(c*c/4+s*s)/(2*Math.abs(s)),ap=[m[0]+nl[0]*s,m[1]+nl[1]*s],C=[ap[0]-nl[0]*sg*r,ap[1]-nl[1]*sg*r],at=p=>Math.atan2(p[1]-C[1],p[0]-C[0]),a0=at(a),w=x=>((x%(2*Math.PI))+2*Math.PI)%(2*Math.PI),d=w(at(b)-a0),sw=w(at(ap)-a0)<d?d:d-2*Math.PI,k=Math.max(8,Math.ceil(Math.abs(sw)/(Math.PI/n))),o=[];
  for(let i=1;i<k;i++)o.push([C[0]+r*Math.cos(a0+sw*i/k),C[1]+r*Math.sin(a0+sw*i/k)]);
  return o;
}
function flatten(pts,bz){const o=[];pts.forEach((p,i)=>{o.push(p);const b=bz[i],q=pts[(i+1)%pts.length];b&&!same(p,q,1e-12)&&o.push(...arcFlat(p,q,b));});return o;}
function clean(pts,bz){
  let P=pts.map(p=>[+p[0],+p[1]]),B=pts.map((_,i)=>+bz[i]||0);const t=scaleOf(P)*1e-9;
  P.length>1&&same(P[0],P[P.length-1],t)&&!B[P.length-1]&&(P.pop(),B.pop());
  const keep=P.map((p,i)=>!(i&&same(p,P[i-1],t)&&!B[i-1]));P=P.filter((_,i)=>keep[i]);B=B.filter((_,i)=>keep[i]);
  if(!B.some(Boolean)){const k=P.map((p,i)=>{const a=P[(i+P.length-1)%P.length],b=P[(i+1)%P.length];return!(Math.abs(cr(a,p,b))<=1e-9*Math.hypot(p[0]-a[0],p[1]-a[1])*Math.hypot(b[0]-p[0],b[1]-p[1])&&(p[0]-a[0])*(b[0]-p[0])+(p[1]-a[1])*(b[1]-p[1])>0);});if(k.filter(Boolean).length>=3){P=P.filter((_,i)=>k[i]);B=P.map(()=>0);}}
  return{P,B};
}
export function selfCross(P){const n=node(P);return{bad:n.bad,at:n.at};}
function node(P){
  const n=P.length,tol=scaleOf(P)*1e-7,sp=P.map(()=>[]);let first=null;
  const hit=(i,p,t)=>{sp[i].push({p,t});first=first||p;};
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
    for(let j=0;j<n;j++){if(j===i)continue;const c=P[j],d=P[(j+1)%n];
      for(const e of[c,d]){const t=((e[0]-a[0])*(b[0]-a[0])+(e[1]-a[1])*(b[1]-a[1]))/(L*L);if(t>1e-9&&t<1-1e-9&&Math.abs(cr(a,b,e))/L<tol)hit(i,e,t);}
      if(j>i){const den=(b[0]-a[0])*(d[1]-c[1])-(b[1]-a[1])*(d[0]-c[0]);if(Math.abs(den)<1e-14*L*L)continue;const t=((c[0]-a[0])*(d[1]-c[1])-(c[1]-a[1])*(d[0]-c[0]))/den,u=((c[0]-a[0])*(b[1]-a[1])-(c[1]-a[1])*(b[0]-a[0]))/den,eps=tol/L;
        if(t>eps&&t<1-eps&&u>eps*L/(Math.hypot(d[0]-c[0],d[1]-c[1])||1)&&u<1-eps){const p=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];hit(i,p,t);hit(j,p,u);}}}}
  const cells=new Map(),V=[],canon=p=>{const gx=Math.round(p[0]/tol),gy=Math.round(p[1]/tol);for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++){const id=cells.get(x+','+y);if(id!==undefined&&same(V[id],p,tol))return id;}V.push(p);cells.set(gx+','+gy,V.length-1);return V.length-1;};
  const ids=[];for(let i=0;i<n;i++){ids.push(canon(P[i]));sp[i].sort((x,y)=>x.t-y.t).forEach(s=>ids.push(canon(s.p)));}
  const ring=ids.filter((v,i)=>v!==ids[(i+ids.length-1)%ids.length]);
  const dup=ring.find((v,i)=>ring.indexOf(v)!==i);
  return{V,ring,bad:sp.some(s=>s.length)||dup!==undefined,at:first||(dup!==undefined?V[dup]:null),tol};
}
function loops(V,ring){
  const st=[],pos=new Map(),out=[];
  for(const v of[...ring,ring[0]]){if(pos.has(v)){const k=pos.get(v),L=st.splice(k+1);L.forEach(q=>pos.delete(q));L.length>=2&&out.push([v,...L].map(q=>V[q]));}else{pos.set(v,st.length);st.push(v);}}
  return out;
}
function windingMP(L){
  let cells=[];
  for(const ring of L){const s=Math.sign(area(ring)),mp=[[[...ring,ring[0]]]];if(!s)continue;let rest=mp;const nx=[];
    for(const c of cells){const a=PC.intersection(c.g,mp),b=PC.difference(c.g,mp);a.length&&nx.push({g:a,w:c.w+s});b.length&&nx.push({g:b,w:c.w});rest=rest.length?PC.difference(rest,c.g):rest;}
    rest.length&&nx.push({g:rest,w:s});cells=nx;}
  const keep=cells.filter(c=>c.w!==0).map(c=>c.g);
  return keep.length?PC.union(keep[0],...keep.slice(1)):[];
}
const toPolys=mp=>mp.map(poly=>poly.map(r=>({pts:r.slice(0,-1),bz:r.slice(0,-1).map(()=>0)})));
const where=(p,s)=>{const a=(s.a||0)*Math.PI/180,x=p[0]*Math.cos(a)-p[1]*Math.sin(a)+(+s.x||0),y=p[0]*Math.sin(a)+p[1]*Math.cos(a)+(+s.y||0);return'('+x.toFixed(2)+', '+y.toFixed(2)+')';};
const HOW='Draw each peak as its own closed path (overlapping paths are merged) or reorder the points.';
function strokeMP(P,w){
  const h=w/2,q=[];
  for(let i=0;i+1<P.length;i++){const a=P[i],b=P[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=[-(b[1]-a[1])/L*h,(b[0]-a[0])/L*h];q.push([[[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]],[b[0]-n[0],b[1]-n[1]],[a[0]-n[0],a[1]-n[1]],[a[0]+n[0],a[1]+n[1]]]]);}
  for(const p of P){const c=[];for(let i=0;i<18;i++)c.push([p[0]+h*Math.cos(i*Math.PI/9),p[1]+h*Math.sin(i*Math.PI/9)]);c.push(c[0]);q.push([c]);}
  return PC.union(q[0],...q.slice(1));
}
export function pathPolys(s,unit='mm'){
  const raw=(s.pts||[]).map(p=>[+p[0],+p[1]]),bz=(s.bulge||[]).map(v=>+v||0),w=+s.stroke||0;
  if(w>0){
    const F=flatten(raw,raw.map((_,i)=>i<raw.length-1?bz[i]||0:0)),t=scaleOf(F)*1e-9,Q=F.filter((p,i)=>!(i&&same(p,F[i-1],t)));
    if(Q.length<2)throw new ProfileError('stroke needs 2+ distinct points');
    const mp=strokeMP(Q,w);if(!mp.length)throw new ProfileError('stroke produced no outline');return toPolys(mp);
  }
  const{P,B}=clean(raw,bz);
  if(P.length<(B.some(Boolean)?2:3))throw new ProfileError('path needs 3+ distinct points');
  const F=B.some(Boolean)?flatten(P,B):P,nd=node(F);
  if(!nd.bad)return[[{pts:P,bz:B}]];
  if(B.some(Boolean))throw new ProfileError('outline with arcs crosses itself near '+where(nd.at||P[0],s)+' '+unit+'. '+HOW);
  const mp=windingMP(loops(nd.V,nd.ring));
  if(!mp.length)throw new ProfileError('outline crosses itself near '+where(nd.at||P[0],s)+' '+unit+' and encloses no area. '+HOW);
  return toPolys(mp);
}
