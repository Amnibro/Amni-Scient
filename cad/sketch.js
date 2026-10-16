const hyp=Math.hypot;
export function emptySketch(){return{pts:[[0,0]],ents:[],cons:[]};}
const refPts=sk=>{const s=new Set();sk.ents.forEach(e=>e.ref&&e.p.forEach(i=>s.add(i)));return s;};
function vars(sk){const V=[],at=[],fx=refPts(sk);sk.pts.forEach((p,i)=>{if(i===0||fx.has(i)||sk.cons.some(c=>c.k==='fix'&&c.p===i))return;at.push(['p',i,0],['p',i,1]);V.push(+p[0]||0,+p[1]||0);});sk.ents.forEach((e,i)=>{if(e.k==='circle'&&!e.ref){at.push(['r',i]);V.push(+e.r||1);}});return{V,at};}
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
    else if(k==='on'||k==='pl'){const t=E[c.e],Q=P[c.p];if(t.k==='line'){const A=P[t.p[0]],B=P[t.p[1]],d=hyp(B[0]-A[0],B[1]-A[1])||1;r.push((c.sg||1)*((B[0]-A[0])*(Q[1]-A[1])-(B[1]-A[1])*(Q[0]-A[0]))/d-num(c.v));}else{const C=G.cen(c.e);r.push(hyp(Q[0]-C[0],Q[1]-C[1])-G.rad(c.e)-num(c.v));}}
    else if(k==='coin'){const[a,b]=c.p;r.push(P[a][0]-P[b][0],P[a][1]-P[b][1]);}
  }
  if(drag)r.push(P[drag.p][0]-drag.x,P[drag.p][1]-drag.y);
  return r;
}
export function lsolve(A,b,n){const M=A.map((row,i)=>[...row,b[i]]);for(let c=0;c<n;c++){let p=c;for(let i=c+1;i<n;i++)if(Math.abs(M[i][c])>Math.abs(M[p][c]))p=i;[M[c],M[p]]=[M[p],M[c]];const d=M[c][c]||1e-12;for(let i=c+1;i<n;i++){const f=M[i][c]/d;if(f)for(let j=c;j<=n;j++)M[i][j]-=f*M[c][j];}}const x=new Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=M[i][n];for(let j=i+1;j<n;j++)s-=M[i][j]*x[j];x[i]=s/(M[i][i]||1e-12);}return x;}
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
export function nullInfo(J,n,tol=1e-7){const M=J.map(r=>Array.from(r)),piv=[];let row=0;
  for(let c=0;c<n&&row<M.length;c++){let p=row;for(let i=row+1;i<M.length;i++)if(Math.abs(M[i][c])>Math.abs(M[p][c]))p=i;if(Math.abs(M[p][c])<tol)continue;[M[row],M[p]]=[M[p],M[row]];for(let i=0;i<M.length;i++){if(i===row)continue;const fct=M[i][c]/M[row][c];if(fct)for(let j=c;j<n;j++)M[i][j]-=fct*M[row][j];}piv.push(c);row++;}
  const pivs=new Set(piv),free=[...Array(n).keys()].filter(c=>!pivs.has(c));return{rank:piv.length,free,basis:free.map(fc=>{const v=new Array(n).fill(0);v[fc]=1;piv.forEach((pc,ri)=>{v[pc]=-M[ri][fc]/M[ri][pc];});return v;})};}
function dofInfo(sk,f0,V,at){
  const{P,Rr}=load(sk,V,at),b=bounds(sk),L=Math.max(b.w,b.h,10),f=X=>{const q=load(sk,X,at);return resid(sk,q.P,q.Rr,L,null);},r0=f(V),n=V.length;if(!n)return{dof:0,free:new Set()};
  const N=nullInfo(r0.length?jac(f,V.slice(),r0):[],n),moving=new Set();for(const v of N.basis)v.forEach((x,i)=>{if(Math.abs(x)>1e-6)moving.add(i);});
  const free=new Set();at.forEach((a,k)=>{if(moving.has(k))free.add(a[0]==='p'?'p'+a[1]:'r'+a[1]);});
  return{dof:N.free.length,free,over:r0.length>N.rank&&Math.sqrt(r0.reduce((a,v)=>a+v*v,0))>1e-6*L};
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
const d2=(a,b)=>hyp(a[0]-b[0],a[1]-b[1]),kq=q=>Math.round(q[0]*1e6)+','+Math.round(q[1]*1e6),flatRefs=R=>(R||[]).flatMap(r=>r.k==='poly'?r.p.slice(1).map((q,i)=>({k:'line',a:r.p[i],b:q,on:r.on,poly:1})):[r]);
export function refit(sk,refs){const P=sk.pts,R=flatRefs(refs),used=new Set();sk.ents.forEach(e=>{if(!e.ref)return;let bi=-1,bs=Infinity;R.forEach((r,i)=>{if(used.has(i)||r.k!==e.k||!r.on!==!e.ref.on)return;let s=Infinity;if(e.k==='line'){const A=P[e.p[0]],B=P[e.p[1]],u=[B[0]-A[0],B[1]-A[1]],w=[r.b[0]-r.a[0],r.b[1]-r.a[1]],L1=hyp(...u)||1,L2=hyp(...w)||1;Math.abs(u[0]*w[1]-u[1]*w[0])/(L1*L2)<0.02&&(s=d2([(A[0]+B[0])/2,(A[1]+B[1])/2],[(r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2])+Math.abs(L1-L2)*0.5);}else{const C=P[e.p[e.k==='arc'?2:0]];s=d2(C,r.c)+(e.k==='pt'?0:Math.abs((e.k==='circle'?e.r:d2(P[e.p[0]],C))-r.r))+(e.k==='arc'?d2(P[e.p[0]],r.a)*0.5:0);}s<bs&&(bs=s,bi=i);});if(bi<0)return;used.add(bi);const r=R[bi],set=(i,q)=>{P[i]=[q[0],q[1]];};if(e.k==='line'){const A=P[e.p[0]],B=P[e.p[1]],sw=d2(A,r.a)+d2(B,r.b)>d2(A,r.b)+d2(B,r.a);set(e.p[0],sw?r.b:r.a);set(e.p[1],sw?r.a:r.b);}else if(e.k==='arc'){set(e.p[0],r.a);set(e.p[1],r.b);set(e.p[2],r.c);}else{set(e.p[0],r.c);e.k==='circle'&&(e.r=r.r);}});return used;}
export function withRefs(sk,refs){const R=flatRefs(refs),used=refit(sk,refs),P=sk.pts,M=new Map();sk.ents.forEach(e=>e.ref&&e.p.forEach(i=>M.set(kq(P[i]),i)));const pt=q=>{const k=kq(q);if(M.has(k))return M.get(k);P.push([q[0],q[1]]);M.set(k,P.length-1);return P.length-1;};
  R.forEach((r,i)=>{if(used.has(i))return;const ref={on:r.on?1:0,...(r.poly?{poly:1}:{}),...(r.center?{center:1}:{})};sk.ents.push(r.k==='line'?{k:'line',p:[pt(r.a),pt(r.b)],cons:true,ref}:r.k==='arc'?{k:'arc',p:[pt(r.a),pt(r.b),pt(r.c)],cons:true,ref}:r.k==='circle'?{k:'circle',p:[pt(r.c)],r:r.r,cons:true,ref}:{k:'pt',p:[pt(r.c)],cons:true,ref});});return sk;}
export function useEdges(sk,ids){const E=sk.ents,L=(ids&&ids.length?ids:E.map((e,i)=>e.ref&&e.ref.on&&e.k!=='pt'?i:-1)).filter(i=>i>=0&&E[i]&&E[i].ref&&E[i].k!=='pt'),out=[];for(const i of L){const e=E[i];if(E.some(x=>!x.ref&&x.k===e.k&&x.p.join()===e.p.join()))continue;E.push({k:e.k,p:[...e.p],...(e.k==='circle'?{r:e.r}:{})});out.push(E.length-1);e.k==='circle'&&sk.cons.push({k:'eq',e:[E.length-1,i]});}return out;}
const area=Q=>Q.reduce((a,p,i)=>{const q=Q[(i+1)%Q.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2;
export function offsetEdges(sk,ids,d){const P=sk.pts,E=sk.ents,L=(ids&&ids.length?ids:E.map((e,i)=>e.ref&&e.ref.on&&e.k!=='pt'?i:-1)).filter(i=>i>=0&&E[i]&&['line','arc','circle'].includes(E[i].k)),adj=new Map(),seen=new Set(),chains=[];
  L.forEach(i=>E[i].k!=='circle'&&[E[i].p[0],E[i].p[1]].forEach(q=>adj.set(q,(adj.get(q)||[]).concat(i))));
  const walk=(i,at)=>{const C=[];let cur=i,q=at;while(cur!=null&&!seen.has(cur)){seen.add(cur);const e=E[cur],f=e.p[0]===q;C.push({i:cur,f});q=f?e.p[1]:e.p[0];cur=(adj.get(q)||[]).find(x=>!seen.has(x));}return{C,end:q};};
  for(const i of[...L].sort((a,b)=>(E[a].k==='circle'?0:Math.min(...[0,1].map(j=>(adj.get(E[a].p[j])||[]).length)))-(E[b].k==='circle'?0:Math.min(...[0,1].map(j=>(adj.get(E[b].p[j])||[]).length))))){if(seen.has(i))continue;if(E[i].k==='circle'){seen.add(i);chains.push({C:[{i,f:true}],closed:true});continue;}const e=E[i],st=(adj.get(e.p[0])||[]).length===1?e.p[0]:(adj.get(e.p[1])||[]).length===1?e.p[1]:e.p[0],w=walk(i,st);chains.push({C:w.C,closed:w.end===st});}
  const poly=ch=>ch.C.flatMap(({i,f})=>{const e=E[i];if(e.k==='circle'){const c=P[e.p[0]];return Array.from({length:24},(_,k)=>[c[0]+e.r*Math.cos(k/24*2*Math.PI),c[1]+e.r*Math.sin(k/24*2*Math.PI)]);}const q=e.k==='arc'?arcPoints(P,e,12):[P[e.p[0]],P[e.p[1]]];return(f?q:q.slice().reverse()).slice(0,-1);});
  const PL=chains.map(poly),out=[],bad=[];chains.forEach((ch,ci)=>{const Q=PL[ci],A=ch.closed?area(Q):1,depth=ch.closed?PL.filter((q,j)=>j!==ci&&chains[j].closed&&inPoly(Q[0],q)).length:0,sL=(A>=0?1:-1)*(depth%2?-1:1),seg=ch.C.map(({i,f})=>{const e=E[i];if(e.k==='line'){const a=P[e.p[f?0:1]],b=P[e.p[f?1:0]],l=d2(a,b)||1,n=[-(b[1]-a[1])/l*sL*d,(b[0]-a[0])/l*sL*d];return{i,f,k:'line',a:[a[0]+n[0],a[1]+n[1]],b:[b[0]+n[0],b[1]+n[1]]};}const c=P[e.k==='circle'?e.p[0]:e.p[2]],r=e.k==='circle'?e.r:d2(P[e.p[0]],c),r2=r-(f?1:-1)*sL*d;if(r2<=1e-9){bad.push(i);return null;}if(e.k==='circle')return{i,f,k:'circle',c:e.p[0],r:r2};const sc=q=>[c[0]+(q[0]-c[0])*r2/r,c[1]+(q[1]-c[1])*r2/r];return{i,f,k:'arc',a:sc(P[e.p[f?0:1]]),b:sc(P[e.p[f?1:0]]),c:e.p[2],r:r2};});if(seg.some(x=>!x))return;
    if(seg[0].k==='circle'){E.push({k:'circle',p:[seg[0].c],r:seg[0].r});sk.cons.push({k:'dia',e:E.length-1,v:+(2*seg[0].r).toFixed(9)});out.push(E.length-1);return;}
    const n=seg.length,J=[];for(let k=0;k<n;k++){const s1=seg[k],s2=seg[(k+1)%n];if(k===n-1&&!ch.closed){J.push(null);continue;}let q=[(s1.b[0]+s2.a[0])/2,(s1.b[1]+s2.a[1])/2];if(s1.k==='line'&&s2.k==='line'){const u=[s1.b[0]-s1.a[0],s1.b[1]-s1.a[1]],w=[s2.b[0]-s2.a[0],s2.b[1]-s2.a[1]],den=u[0]*w[1]-u[1]*w[0];if(Math.abs(den)>1e-12){const t=((s2.a[0]-s1.a[0])*w[1]-(s2.a[1]-s1.a[1])*w[0])/den;q=[s1.a[0]+u[0]*t,s1.a[1]+u[1]*t];}}P.push(q);J.push(P.length-1);}
    const ps=k=>k===0&&!ch.closed?(P.push(seg[0].a),P.length-1):J[(k-1+n)%n],pe=k=>J[k]!=null?J[k]:(P.push(seg[k].b),P.length-1);
    seg.forEach((s,k)=>{const a=ps(k),b=pe(k);if(s.k==='line'){E.push({k:'line',p:[a,b]});const ei=E.length-1,R0=E[s.i],A=P[R0.p[0]],B=P[R0.p[1]],l=d2(A,B)||1;for(const q of[a,b]){const cr=((B[0]-A[0])*(P[q][1]-A[1])-(B[1]-A[1])*(P[q][0]-A[0]))/l;sk.cons.push({k:'pl',p:q,e:s.i,v:+Math.abs(d).toFixed(9),sg:cr<0?-1:1});}out.push(ei);}else{E.push({k:'arc',p:s.f?[a,b,s.c]:[b,a,s.c]});sk.cons.push({k:'rad',e:E.length-1,v:+s.r.toFixed(9)});out.push(E.length-1);}});});
  return{ids:out,bad};}
