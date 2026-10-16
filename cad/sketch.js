const hyp=Math.hypot;
export function emptySketch(){return{pts:[[0,0]],ents:[],cons:[]};}
function vars(sk){const V=[],at=[];sk.pts.forEach((p,i)=>{if(i===0||sk.cons.some(c=>c.k==='fix'&&c.p===i))return;at.push(['p',i,0],['p',i,1]);V.push(+p[0]||0,+p[1]||0);});sk.ents.forEach((e,i)=>{if(e.k==='circle'){at.push(['r',i]);V.push(+e.r||1);}});return{V,at};}
function load(sk,V,at){const P=sk.pts.map(p=>[+p[0]||0,+p[1]||0]),Rr=sk.ents.map(e=>+e.r||0);at.forEach((a,k)=>a[0]==='p'?P[a[1]][a[2]]=V[k]:Rr[a[1]]=V[k]);return{P,Rr};}
function geo(sk,P,Rr){const E=sk.ents;return{u:e=>{const q=E[e].p;return[P[q[1]][0]-P[q[0]][0],P[q[1]][1]-P[q[0]][1]];},len:e=>{const t=E[e],q=t.p;return t.k==='circle'?Rr[e]:t.k==='arc'?hyp(P[q[0]][0]-P[q[2]][0],P[q[0]][1]-P[q[2]][1]):hyp(P[q[1]][0]-P[q[0]][0],P[q[1]][1]-P[q[0]][1]);},cen:e=>{const t=E[e];return P[t.k==='circle'?t.p[0]:t.p[2]];},rad:e=>{const t=E[e];return t.k==='circle'?Rr[e]:hyp(P[t.p[0]][0]-P[t.p[2]][0],P[t.p[0]][1]-P[t.p[2]][1]);}};}
function resid(sk,P,Rr,L,drag){
  const r=[],G=geo(sk,P,Rr),E=sk.ents,num=v=>+v||0;
  E.forEach((e,i)=>{if(e.k==='arc'){const[a,b,c]=e.p;r.push(hyp(P[a][0]-P[c][0],P[a][1]-P[c][1])-hyp(P[b][0]-P[c][0],P[b][1]-P[c][1]));}});
  for(const c of sk.cons){const k=c.k;
    if(k==='h'||k==='v'){const[a,b]=c.e!=null?E[c.e].p:c.p,i=k==='h'?1:0;r.push(P[b][i]-P[a][i]);}
    else if(k==='dist'){const[a,b]=c.p;r.push(hyp(P[b][0]-P[a][0],P[b][1]-P[a][1])-num(c.v));}
    else if(k==='hd'||k==='vd'){const[a,b]=c.p,i=k==='hd'?0:1;r.push((c.sg||1)*(P[b][i]-P[a][i])-num(c.v));}
    else if(k==='len'||k==='rad'){r.push((k==='rad'?G.rad(c.e):G.len(c.e))-num(c.v));}
    else if(k==='dia'){r.push(2*G.rad(c.e)-num(c.v));}
    else if(k==='eq'){r.push(G.len(c.e[0])-G.len(c.e[1]));}
    else if(k==='par'||k==='perp'||k==='ang'){const u=G.u(c.e[0]),w=G.u(c.e[1]),n=(hyp(...u)*hyp(...w))||1,cr=(u[0]*w[1]-u[1]*w[0])/n,dt=(u[0]*w[0]+u[1]*w[1])/n,t=num(c.v)*Math.PI/180;r.push(L*(k==='par'?cr:k==='perp'?dt:cr*Math.cos(t)-dt*Math.sin(t)));}
    else if(k==='tan'){const[a,b]=c.e,ka=E[a].k,kb=E[b].k;if(ka==='line'||kb==='line'){const ln=ka==='line'?a:b,cc=ka==='line'?b:a,q=E[ln].p,A=P[q[0]],B=P[q[1]],C=G.cen(cc),d=hyp(B[0]-A[0],B[1]-A[1])||1;r.push(Math.abs(((B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]))/d)-G.rad(cc));}else{const C1=G.cen(a),C2=G.cen(b),d=hyp(C1[0]-C2[0],C1[1]-C2[1]);r.push(d-(c.s===-1?Math.abs(G.rad(a)-G.rad(b)):G.rad(a)+G.rad(b)));}}
    else if(k==='mid'){const q=E[c.e].p,A=P[q[0]],B=P[q[1]];r.push(P[c.p][0]-(A[0]+B[0])/2,P[c.p][1]-(A[1]+B[1])/2);}
    else if(k==='on'){const t=E[c.e];if(t.k==='line'){const A=P[t.p[0]],B=P[t.p[1]],d=hyp(B[0]-A[0],B[1]-A[1])||1,Q=P[c.p];r.push(((B[0]-A[0])*(Q[1]-A[1])-(B[1]-A[1])*(Q[0]-A[0]))/d);}else{const C=G.cen(c.e),Q=P[c.p];r.push(hyp(Q[0]-C[0],Q[1]-C[1])-G.rad(c.e));}}
    else if(k==='coin'){const[a,b]=c.p;r.push(P[a][0]-P[b][0],P[a][1]-P[b][1]);}
  }
  if(drag)r.push(P[drag.p][0]-drag.x,P[drag.p][1]-drag.y);
  return r;
}
function lsolve(A,b,n){const M=A.map((row,i)=>[...row,b[i]]);for(let c=0;c<n;c++){let p=c;for(let i=c+1;i<n;i++)if(Math.abs(M[i][c])>Math.abs(M[p][c]))p=i;[M[c],M[p]]=[M[p],M[c]];const d=M[c][c]||1e-12;for(let i=c+1;i<n;i++){const f=M[i][c]/d;if(f)for(let j=c;j<=n;j++)M[i][j]-=f*M[c][j];}}const x=new Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=M[i][n];for(let j=i+1;j<n;j++)s-=M[i][j]*x[j];x[i]=s/(M[i][i]||1e-12);}return x;}
function jac(f,V,r0){const J=r0.map(()=>new Array(V.length).fill(0));for(let j=0;j<V.length;j++){const h=1e-6*Math.max(1,Math.abs(V[j])),o=V[j];V[j]=o+h;const r1=f(V);V[j]=o;for(let i=0;i<r0.length;i++)J[i][j]=(r1[i]-r0[i])/h;}return J;}
export function solve(sk,opt={}){
  const{V,at}=vars(sk),n=V.length,b=bounds(sk),L=Math.max(b.w,b.h,10),V0=V.slice(),nf=opt.newFrom??Infinity,wt=at.map(a=>a[0]==='p'&&(a[1]>=nf||opt.drag&&a[1]===opt.drag.p)?1e-4:opt.drag?3e-2:1e-2),f=X=>{const{P,Rr}=load(sk,X,at),r=resid(sk,P,Rr,L,opt.drag);for(let i=0;i<n;i++)r.push(wt[i]*(X[i]-V0[i]));return r;};
  const lm=(fn,iters)=>{let r=fn(V),err=r.reduce((a,v)=>a+v*v,0),lam=1e-3,it=0,prev=Infinity;
  for(;it<iters&&err>1e-24&&n&&prev-err>1e-15*(1+err);it++){prev=err;const J=jac(fn,V,r),A=[],g=[];for(let i=0;i<n;i++){A.push(new Array(n).fill(0));g.push(0);}for(let k=0;k<r.length;k++){const row=J[k];for(let i=0;i<n;i++){if(!row[i])continue;g[i]-=row[i]*r[k];for(let j=0;j<n;j++)A[i][j]+=row[i]*row[j];}}
    let ok=false;for(let t=0;t<12&&!ok;t++){const A2=A.map((row,i)=>row.map((v,j)=>i===j?v+lam*(v+1e-9)+1e-12:v)),d=lsolve(A2,g,n),V2=V.map((v,i)=>v+d[i]),r2=fn(V2),e2=r2.reduce((a,v)=>a+v*v,0);if(e2<err){V.splice(0,n,...V2);r=r2;err=e2;lam=Math.max(lam/4,1e-9);ok=true;}else lam*=6;}
    if(!ok)break;}
return it;};
  const fh=X=>{const{P,Rr}=load(sk,X,at);return resid(sk,P,Rr,L,opt.drag);},it=lm(f,opt.iters||80)+lm(fh,40);
  const{P,Rr}=load(sk,V,at);sk.pts=P.map(p=>[+p[0].toFixed(9),+p[1].toFixed(9)]);sk.ents.forEach((e,i)=>{if(e.k==='circle')e.r=+Rr[i].toFixed(9);});
  const rr=resid(sk,P,Rr,L,null),res=Math.sqrt(rr.reduce((a,v)=>a+v*v,0));
  return{ok:res<1e-6*L,res,it,dof:opt.dof?dofInfo(sk,f,V,at,L):null};
}
function dofInfo(sk,f0,V,at){
  const{P,Rr}=load(sk,V,at),b=bounds(sk),L=Math.max(b.w,b.h,10),f=X=>{const q=load(sk,X,at);return resid(sk,q.P,q.Rr,L,null);},r0=f(V),n=V.length;if(!n)return{dof:0,free:new Set()};
  const J=r0.length?jac(f,V.slice(),r0):[],M=J.map(r=>r.slice()),piv=[],tol=1e-7;let row=0;
  for(let c=0;c<n&&row<M.length;c++){let p=row;for(let i=row+1;i<M.length;i++)if(Math.abs(M[i][c])>Math.abs(M[p][c]))p=i;if(Math.abs(M[p][c])<tol)continue;[M[row],M[p]]=[M[p],M[row]];for(let i=0;i<M.length;i++){if(i===row)continue;const fct=M[i][c]/M[row][c];if(fct)for(let j=c;j<n;j++)M[i][j]-=fct*M[row][j];}piv.push(c);row++;}
  const pivs=new Set(piv),freeCols=[...Array(n).keys()].filter(c=>!pivs.has(c)),moving=new Set();
  for(const fc of freeCols){const v=new Array(n).fill(0);v[fc]=1;piv.forEach((pc,ri)=>{v[pc]=-M[ri][fc]/M[ri][pc];});v.forEach((x,i)=>{if(Math.abs(x)>1e-6)moving.add(i);});}
  const free=new Set();at.forEach((a,k)=>{if(moving.has(k))free.add(a[0]==='p'?'p'+a[1]:'r'+a[1]);});
  return{dof:freeCols.length,free,over:r0.length>piv.length&&Math.sqrt(r0.reduce((a,v)=>a+v*v,0))>1e-6*L};
}
export function bounds(sk){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const p of sk.pts){a=Math.min(a,+p[0]);b=Math.min(b,+p[1]);c=Math.max(c,+p[0]);d=Math.max(d,+p[1]);}sk.ents.forEach(e=>{if(e.k==='circle'){const C=sk.pts[e.p[0]],r=+e.r||0;a=Math.min(a,C[0]-r);b=Math.min(b,C[1]-r);c=Math.max(c,C[0]+r);d=Math.max(d,C[1]+r);}});return{x0:a,y0:b,x1:c,y1:d,w:c-a,h:d-b};}
function arcInfo(P,e){const[a,b,c]=e.p,A=P[a],B=P[b],C=P[c],r=hyp(A[0]-C[0],A[1]-C[1]),t0=Math.atan2(A[1]-C[1],A[0]-C[0]),t1=Math.atan2(B[1]-C[1],B[0]-C[0]);let sw=t1-t0;while(sw<=0)sw+=2*Math.PI;return{r,t0,sw,C};}
export function arcPoints(P,e,n=24){const{r,t0,sw,C}=arcInfo(P,e),o=[];for(let i=0;i<=n;i++){const t=t0+sw*i/n;o.push([C[0]+r*Math.cos(t),C[1]+r*Math.sin(t)]);}return o;}
function inPoly(pt,poly){let ins=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if(yi>pt[1]!==yj>pt[1]&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi||1e-12)+xi)ins=!ins;}return ins;}
export function loops(sk){
  const P=sk.pts,segs=[];sk.ents.forEach((e,i)=>{if(e.cons)return;if(e.k==='line'||e.k==='arc')segs.push({i,a:e.p[0],b:e.p[1],e});});
  const adj=new Map();for(const s of segs)for(const q of[s.a,s.b])adj.set(q,(adj.get(q)||[]).concat([s]));
  for(const[q,l]of adj)if(l.length!==2)throw new Error('the sketch is open or branches at a point ('+P[q].map(v=>+(+v).toFixed(2)).join(', ')+'): every corner must join exactly two lines or arcs');
  const used=new Set(),out=[];
  for(const s0 of segs){if(used.has(s0))continue;const L=[];let cur=s0,at=s0.a;while(cur&&!used.has(cur)){used.add(cur);const fwd=cur.a===at,to=fwd?cur.b:cur.a;L.push({from:at,to,e:cur.e});at=to;cur=(adj.get(at)||[]).find(x=>!used.has(x));}out.push(L);}
  const shapes=[],polys=[];
  for(const L of out){const pts=[],bulge=[],poly=[];for(const sg of L){pts.push([P[sg.from][0],P[sg.from][1]]);if(sg.e.k==='arc'){const{r,sw}=arcInfo(P,sg.e),ap=arcPoints(P,sg.e,24),fwd=sg.e.p[0]===sg.from,s=r*(1-Math.cos(sw/2));bulge.push(fwd?-s:s);poly.push(...(fwd?ap:ap.reverse()).slice(0,-1));}else{bulge.push(0);poly.push([P[sg.from][0],P[sg.from][1]]);}}polys.push(poly);shapes.push({k:'path',pts,bulge});}
  sk.ents.forEach(e=>{if(e.cons||e.k!=='circle')return;const C=P[e.p[0]],poly=[];for(let i=0;i<32;i++)poly.push([C[0]+e.r*Math.cos(i/32*2*Math.PI),C[1]+e.r*Math.sin(i/32*2*Math.PI)]);polys.push(poly);shapes.push({k:'circle',x:C[0],y:C[1],r:e.r});});
  shapes.forEach((s,i)=>{const p0=polys[i][0],depth=polys.filter((q,j)=>j!==i&&inPoly(p0,q)).length;if(depth%2)s.hole=true;Object.defineProperty(s,'poly',{value:polys[i]});});
  if(!shapes.length)throw new Error('the sketch has no closed profile yet');
  return shapes;
}
export function sketchShapes(sk){const c=JSON.parse(JSON.stringify(sk));solve(c);return loops(c);}
export function fromShapes(shapes){
  const sk=emptySketch(),P=sk.pts,add=(x,y)=>{P.push([x,y]);return P.length-1;},num=v=>typeof v==='number'?v:parseFloat(v)||0;
  for(const s of shapes||[]){const k=s.k||'rect',x=num(s.x),y=num(s.y);
    if(k==='rect'&&!num(s.a)&&!num(s.r)){const w=num(s.w)/2,h=num(s.h)/2,q=[add(x-w,y-h),add(x+w,y-h),add(x+w,y+h),add(x-w,y+h)],e0=sk.ents.length;for(let i=0;i<4;i++)sk.ents.push({k:'line',p:[q[i],q[(i+1)%4]]});sk.cons.push({k:'h',e:e0},{k:'v',e:e0+1},{k:'h',e:e0+2},{k:'v',e:e0+3},{k:'len',e:e0,v:s.w},{k:'len',e:e0+1,v:s.h});}
    else if(k==='circle'){const c=add(x,y);sk.ents.push({k:'circle',p:[c],r:num(s.r)});sk.cons.push({k:'dia',e:sk.ents.length-1,v:typeof s.r==='number'?2*s.r:'2*('+s.r+')'});}
    else if(k==='path'&&!(s.bulge||[]).some(Boolean)){const q=(s.pts||[]).map(p=>add(num(p[0]),num(p[1])));q.forEach((a,i)=>sk.ents.push({k:'line',p:[a,q[(i+1)%q.length]]}));}
    else if(k==='poly'){const n=Math.max(3,Math.round(num(s.n)||6)),r=num(s.r),a0=num(s.a)*Math.PI/180,q=[];for(let i=0;i<n;i++)q.push(add(x+r*Math.cos(a0+i/n*2*Math.PI),y+r*Math.sin(a0+i/n*2*Math.PI)));const e0=sk.ents.length;q.forEach((a,i)=>sk.ents.push({k:'line',p:[a,q[(i+1)%n]]}));for(let i=1;i<n;i++)sk.cons.push({k:'eq',e:[e0,e0+i]});}
    else return null;}
  return sk;
}
