import {runFEA,lobpcg,rigidModes} from './fea.js';
import {condK} from './thermal_data.js';
import {hexStress,principals,probe,pathPlot,skinOfField,kgMul} from './fea_post.js';
import {fatigueField,modalNewmark,frf} from './fea_fatigue.js';
import {snOf} from './fatigue_data.js';
import {meshSolid,HEX_FACES,surfOf,closest,thicknessStats,detectSheet} from './mesh.js';
import {gpuAMG} from './fea_gpu.js';
import {ADV,bcOf,contactSolve,heldBy,distLoad} from './fea_bc.js';
import {heliumSync} from './he/host.js';
import {maxOf} from './minmax.js';
const FMW=await heliumSync('fea_mesh'),G3=1/Math.sqrt(3);
const find=(ci,a,b,j)=>{let lo=a,hi=b-1;while(lo<=hi){const m=(lo+hi)>>1,v=ci[m];if(v===j)return m;v<j?lo=m+1:hi=m-1;}return-1;};
function facetGeo(X,E,bf,cb){
  const gs=[-G3,G3];for(let i=0;i<bf.length;i++){const e=Math.floor(bf[i]/6),nd=HEX_FACES[bf[i]%6].map(a=>E[8*e+a]),w=[0,0,0,0],nv=[0,0,0,0,0,0,0,0,0,0,0,0];let A=0;
    for(const s of gs)for(const t of gs){const N=[(1-s)*(1-t)/4,(1+s)*(1-t)/4,(1+s)*(1+t)/4,(1-s)*(1+t)/4],ds=[-(1-t)/4,(1-t)/4,(1+t)/4,-(1+t)/4],dt=[-(1-s)/4,-(1+s)/4,(1+s)/4,(1-s)/4],a=[0,0,0],b=[0,0,0];for(let k=0;k<4;k++)for(let c=0;c<3;c++){a[c]+=ds[k]*X[3*nd[k]+c];b[c]+=dt[k]*X[3*nd[k]+c];}const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],da=Math.hypot(...n);A+=da;for(let k=0;k<4;k++){w[k]+=N[k]*da;for(let c=0;c<3;c++)nv[3*k+c]+=N[k]*n[c];}}
    cb(i,nd,w,nv,A);}
}
function systemOf(inp,M,mat){
  const nn=M.X.length/3,ne=M.E.length/8,E=mat.E,nu=mat.nu,lam=E*nu/((1+nu)*(1-2*nu)),mu=E/(2*(1+nu)),W=heOf(M,X=>X.fm_system(lam,mu));
  return{A:{n:nn,m:nn,rb:3,cb:3,rp:W.rp,ci:W.ci,v:W.v},cm:W.cm,lam,mu,nn,ne,dmin:W.dmin,H:W.H};
}
function accOf(M,faces){const acc=new Map();facetGeo(M.X,M.E,M.select(faces).facets,(i,nd,w,nv)=>{for(let k=0;k<4;k++){const v=acc.get(nd[k])||[0,0,0,0];v[0]+=w[k];for(let c=0;c<3;c++)v[1+c]+=nv[3*k+c];acc.set(nd[k],v);}});return acc;}
function supportDofs(inp,M,cm,modal){
  const nn=M.X.length/3,fix=new Uint8Array(3*nn),sup=[...(inp.fixed&&inp.fixed.length?[{faces:inp.fixed,type:'fixed'}]:[]),...(inp.supports||[])].filter(s=>!ADV.has(s.type)||modal&&s.type!=='spring'),AXI={x:0,y:1,z:2,X:0,Y:1,Z:2};
  const mark=(n,c)=>{if(cm&&cm.hq[n]>=0){for(let k=cm.p[n];k<cm.p[n+1];k++)fix[3*cm.i[k]+c]=1;}else fix[3*n+c]=1;};
  for(const s of sup){const sel=M.select(s.faces),acc=new Map();if(!sel.facets.length&&s.faces&&s.faces.region)throw new Error('A support area covers no part of the mesh. Place it on the supported face, make it larger, or use a finer mesh.');facetGeo(M.X,M.E,sel.facets,(i,nd,w,nv)=>{for(let k=0;k<4;k++){const v=acc.get(nd[k])||[0,0,0];for(let c=0;c<3;c++)v[c]+=nv[3*k+c];acc.set(nd[k],v);}});
    const roll=s.type==='roller'||s.type==='slider',dv=s.dir!=null?(typeof s.dir==='string'?AXI[s.dir.replace(/[+-]/,'')]:Array.isArray(s.dir)?[0,1,2].reduce((b,c)=>Math.abs(s.dir[c])>Math.abs(s.dir[b])?c:b,0):null):null;
    const SS=roll&&dv==null?surfOf(inp):null,fs=SS?new Set(sel.faces):null,fm=SS?Uint8Array.from(SS.fid,f=>fs.has(f)?1:0):null,o=new Float64Array(6);for(const[n,v0]of acc){let v=v0;if(SS){const t=closest(SS,M.X[3*n],M.X[3*n+1],M.X[3*n+2],fm,o);if(t>=0)v=[SS.N[3*t],SS.N[3*t+1],SS.N[3*t+2]];}const a=dv!=null?dv:Math.abs(v[0])>=Math.abs(v[1])&&Math.abs(v[0])>=Math.abs(v[2])?0:Math.abs(v[1])>=Math.abs(v[2])?1:2;if(roll)mark(n,a);else for(let c=0;c<3;c++)mark(n,c);}}
  return fix;
}
function loadsOf(inp,M,mat,cm){
  const nn=M.X.length/3,f=new Float64Array(3*nn),ap=[0,0,0],add=(n,F)=>{if(cm&&cm.hq[n]>=0){for(let k=cm.p[n];k<cm.p[n+1];k++)for(let c=0;c<3;c++)f[3*cm.i[k]+c]+=cm.w[k]*F[c];}else for(let c=0;c<3;c++)f[3*n+c]+=F[c];for(let c=0;c<3;c++)ap[c]+=F[c];};
  for(const ld of inp.loads||[]){const sel=M.select(ld.faces);if(!sel.facets.length&&!(ld.faces&&ld.faces.by==='all'&&!sel.faces.length))throw new Error(ld.faces&&ld.faces.region?'A load area covers no part of the mesh. Place it on the loaded face, make it larger, or use a finer mesh.':'load faces '+JSON.stringify(sel.faces)+' have no mesh facets; refine the mesh');distLoad(ld,accOf(M,ld.faces),n=>[M.X[3*n],M.X[3*n+1],M.X[3*n+2]],add);}
  const g=inp.accel||(mat.g?mat.g.map(v=>v*9.80665):null);if(g&&mat.rho){const k=mat.rho*1e-9,vol=nodalVol(M);for(let n=0;n<nn;n++)if(vol[n])add(n,[g[0]*k*vol[n],g[1]*k*vol[n],g[2]*k*vol[n]]);}
  if(inp.nodalF)for(let i=0;i<inp.nodalF.length&&i<f.length;i++){f[i]+=inp.nodalF[i];ap[i%3]+=inp.nodalF[i];}
  return{f,ap};
}
function nodalVol(M){return M.nvol;}
function heOf(M,asm){const H=FMW({fm_prog:(i,r)=>H.pr&&H.pr(i,r,'solve')}),X=H.ex,V=H.v,h=M.hang;X.fm_mesh(M.X.length/3,M.E.length/8,h?h.node.length:0,h?h.k||4:4,(M.type==='sweep'?1:0)|(M.cube?2:0)|(h?8:0));V(201).set(M.X);V(205).set(M.E);if(M.cube)V(202).set(M.cube);if(M.rho)V(203).set(M.rho);if(h){V(204).set(h.w);V(206).set(h.node);V(207).set(h.m);}const dmin=asm(X);if(!M.nvol){X.fm_nvol();M.nvol=V(217).slice();}return{H,dmin,cm:h?{p:V(210).slice(),i:V(211).slice(),w:V(212).slice(),hq:V(213).slice()}:null,rp:V(214),ci:V(215),v:V(216)};}
function reac(P,u,f0){P.v(229).set(u);P.v(230).set(f0);P.ex.fm_reac();return P.v(236).slice();}
function reactions(q,d,fix,grp){const rf=grp?[]:new Array(d).fill(0);for(let k=0;k<q.length;k++){if(!fix[k])continue;const g=grp?grp[k/d|0]:k%d;rf[g]=(rf[g]||0)+q[k];}return rf;}
function nullspace(M,fix){
  const nn=M.X.length/3,X=M.X,sw=M.sweep&&M.sheet&&M.sheet.thin?M.sweep:null;let nb=6,fr=null;
  if(sw){const{nl,N}=sw,nbar=[0,0,0];for(let i=0;i<nl;i++){const p=3*i*(N+1),q=p+3*N,d=[X[q]-X[p],X[q+1]-X[p+1],X[q+2]-X[p+2]],l=Math.hypot(...d)||1;for(let k=0;k<3;k++)nbar[k]+=d[k]/l;}const ln=Math.hypot(...nbar);if(ln>0.3*nl){const e3=nbar.map(v=>v/ln),t=Math.abs(e3[0])<0.9?[1,0,0]:[0,1,0],d=t[0]*e3[0]+t[1]*e3[1]+t[2]*e3[2],e1=[t[0]-d*e3[0],t[1]-d*e3[1],t[2]-d*e3[2]],l1=Math.hypot(...e1);for(let k=0;k<3;k++)e1[k]/=l1;const e2=[e3[1]*e1[2]-e3[2]*e1[1],e3[2]*e1[0]-e3[0]*e1[2],e3[0]*e1[1]-e3[1]*e1[0]];fr={e1,e2,nl,N};nb=9;}}
  const c=[0,0,0];for(let i=0;i<nn;i++)for(let k=0;k<3;k++)c[k]+=X[3*i+k]/nn;const B=new Float64Array(3*nn*nb);
  for(let i=0;i<nn;i++){const x=X[3*i]-c[0],y=X[3*i+1]-c[1],z=X[3*i+2]-c[2],R=[[1,0,0,0,z,-y],[0,1,0,-z,0,x],[0,0,1,y,-x,0]];for(let d=0;d<3;d++)for(let k=0;k<6;k++)B[(3*i+d)*nb+k]=fix&&fix[3*i+d]?0:R[d][k];
    if(fr){const{e1,e2,N}=fr,j=Math.floor(i/(N+1)),kk=i%(N+1),p=3*j*(N+1),q=p+3*N,dv=[X[q]-X[p],X[q+1]-X[p+1],X[q+2]-X[p+2]],t=Math.hypot(...dv)||1,n=dv.map(v=>v/t),m=[(X[p]+X[q])/2-c[0],(X[p+1]+X[q+1])/2-c[1],(X[p+2]+X[q+2])/2-c[2]],s1=m[0]*e1[0]+m[1]*e1[1]+m[2]*e1[2],s2=m[0]*e2[0]+m[1]*e2[1]+m[2]*e2[2],ze=(kk/N-0.5)*t;
      [[s1*s1/2,e1.map(v=>v*s1)],[s2*s2/2,e2.map(v=>v*s2)],[s1*s2,e1.map((v,k)=>v*s2+e2[k]*s1)]].forEach(([w,gr],mo)=>{const gn=gr[0]*n[0]+gr[1]*n[1]+gr[2]*n[2];for(let d=0;d<3;d++)B[(3*i+d)*nb+6+mo]=fix&&fix[3*i+d]?0:w*n[d]-ze*(gr[d]-gn*n[d]);});}}
  return{B,nb};
}
function amg(P,o,tnl,tc,col){const d=o.deg||2,c=o.cdeg||6,g=o.gamma||2;P.ag=[d,c,g];return P.ex.fm_amg(tnl,tc,o.theta??0,o.theta2??0.08,d,c,g,o.coarse||900,col);}
function gpuH(P,nL,eps){const X=P.ex,V=P.v;X.fm_gprep(eps??1e-4);const L=V(231),G=V(232),I=V(233),F=V(234),mat=l=>k=>{X.fm_gx(l,k);const[s,n,rb,cb,rp,ci,va,nz]=G;return s?{n,m:n,rb,cb,rp:V(214).subarray(0,n+1),ci:V(215).subarray(0,nz),v:V(216).subarray(0,nz*rb*cb)}:{n,rb,cb,rp:I.subarray(rp,rp+n+1),ci:I.subarray(ci,ci+nz),v:F.subarray(va,va+nz*rb*cb)};},H=[];for(let l=0;l<nL;l++){const o=8*l,m=mat(l);H.push(l<nL-1?{A:m(0),P:m(1),R:m(2),Ds:F.subarray(L[o+3],L[o+3]+L[o+4]),lmax:L[o+2],sb:L[o+1]}:{A:{n:L[o],rb:1},N:L[o+5]});}H.cinv=V(235);[H.deg,H.cdeg,H.gamma]=P.ag;return H;}
async function solveSys(P,nL,nn,opt,prog){
  const want=opt.solver||'auto',X=P.ex,V=P.v;let gpuError;
  if(want!=='cpu'&&nL>1&&(want==='gpu'||nn>(opt.gpuMin||5000)))try{const r=await gpuAMG(gpuH(P,nL,opt.ceps),V(227).slice(),{tol:opt.tol||1e-8,mv:(x,y)=>{V(229).set(x);X.fm_mvx(0);y.set(V(230));}},prog);if(r){V(228).set(r.u);X.fm_fin();return{...r,u:V(218).slice(),backend:'gpu'};}gpuError='WebGPU unavailable';}catch(e){gpuError=String(e.message||e);}
  P.pr=prog;const iters=X.fm_pcg(opt.tol||1e-8,opt.maxIt||2000);X.fm_fin();return{u:V(218).slice(),iters,rel:X.fm_rel(),backend:'cpu',gpuError,why:gpuError?'':want==='cpu'?'CPU chosen':nL<2?'one-level solve runs on the CPU':opt.gpuMin===Infinity?'this mesh type solves on the CPU':'Auto: small enough that the CPU is quicker'};
}
function skinOf(M){
  const nn=M.X.length/3,re=new Int32Array(nn).fill(-1),nodes=[],idx=[];for(let i=0;i<M.bf.length;i++){const e=Math.floor(M.bf[i]/6),f=HEX_FACES[M.bf[i]%6].map(a=>M.E[8*e+a]);for(const n of f)if(re[n]<0){re[n]=nodes.length;nodes.push(n);}const q=f.map(n=>re[n]);idx.push(q[0],q[1],q[2],q[0],q[2],q[3]);}
  const pos=new Float32Array(3*nodes.length);nodes.forEach((n,i)=>{pos[3*i]=M.X[3*n];pos[3*i+1]=M.X[3*n+1];pos[3*i+2]=M.X[3*n+2];});return{nodes:Int32Array.from(nodes),pos,idx:Uint32Array.from(idx)};
}
function toVerts(sk,pos,fields){
  const S=surfOf({pos:sk.pos,idx:sk.idx,groups:[]}),nv=pos.length/3,o=new Float64Array(6),out=fields.map(([,st])=>new Float32Array(nv*st));
  for(let v=0;v<nv;v++){const t=closest(S,pos[3*v],pos[3*v+1],pos[3*v+2],null,o);if(t<0)continue;const a=S.T[3*t],b=S.T[3*t+1],c=S.T[3*t+2],u=o[4],w=o[5];fields.forEach(([arr,st],fi)=>{for(let k=0;k<st;k++)out[fi][v*st+k]=(1-u-w)*arr[a*st+k]+u*arr[b*st+k]+w*arr[c*st+k];});}
  return out;
}
function meshInfo(M){const q=M.quality||{};return{type:M.type,kind:M.kind,nEl:M.E.length/8,nNode:M.X.length/3,layers:M.layers||null,tMin:M.thickness?M.thickness.min:M.tMin??null,tMax:M.thickness?M.thickness.max:null,h0:M.size?M.size.h0:null,hmin:M.size?M.size.hmin:null,minSJ:q.minSJ,maxAR:q.maxAR,lowSJ:q.lowSJ,volErr:q.volErr,through:M.layers||M.through||null,ms:M.ms,fallback:M.fallback,warn:M.warn||null,info:M.info};}
export function pickMesh(inp){
  const want=inp.mesh||'voxel';if(want==='voxel')return null;if(want!=='auto')return want;
  const res=inp.res||30000,hv=Math.cbrt(Math.max(inp.volume,1e-9)/Math.max(2000,Math.min(res,800000))),st=thicknessStats(inp);
  if(!(st.p02<3*hv))return null;const sh=detectSheet(inp);return sh.ok?'sweep':'adaptive';
}
const SUITE=new Set(['combine']);
export async function runMeshFEA(inp,prog){
  const type=inp.type||'static';if(type==='tstress'||type==='spectrum'||type==='topo'||type==='species'||type==='acoustic'||type==='current'||type==='estatic'||(type==='thermal'&&(inp.transient||(inp.rad&&inp.rad.length)||(inp.steps|0)>1)))return runFEA(inp,prog);
  let kind=pickMesh(inp);if((type==='fatigue'||type==='harmonic'||type==='transient'||type==='buckle'||type==='psd')&&!kind)return runFEA(inp,prog);if(!kind&&SUITE.has(type))kind='adaptive';if(!kind)return runFEA(inp,prog);
  const t0=Date.now();prog&&prog(0,1,'mesh');
  const M=inp.M||meshSolid(inp,{type:kind,res:Math.round((inp.res||30000)*(type==='modal'||type==='harmonic'||type==='transient'?0.6:1)),size:inp.meshSize||inp.size,layers:inp.layers,...(inp.meshOpt||{})}),tm=Date.now()-t0;if(inp.meshOnly){const sk=skinOf(M);return{type:'mesh',skin:{pos:sk.pos,idx:sk.idx},nEl:M.E.length/8,h:M.size?M.size.h0:M.h0,mesh:{...meshInfo(M),ms:tm}};}if(M.E.length/8>(inp.maxEls||600000))throw new Error('The '+M.type+' mesh has '+(M.E.length/8).toLocaleString()+' elements, more than this browser can solve; choose a coarser mesh or a larger element size');
  const r=type==='modal'?await modalMesh(inp,M,prog):type==='thermal'?await thermalMesh(inp,M,prog):type==='harmonic'?await harmonicMesh(inp,M,prog):type==='fatigue'?await fatigueMesh(inp,M,prog):type==='buckle'?await buckleMesh(inp,M,prog):type==='transient'?await transientMesh(inp,M,prog):type==='combine'?await combineMesh(inp,M,prog):await staticMesh(inp,M,prog);
  r.mesh=meshInfo(M);r.mesh.ms=tm;r.ms=Date.now()-t0;return r;
}
async function staticMesh(inp,M,prog){
  const mat=inp.mat,t0=Date.now(),sys=systemOf(inp,M,mat),{cm,lam,mu,nn,ne}=sys,P=sys.H,X=P.ex,V=P.v,fix0=supportDofs(inp,M,cm),B=bcOf(inp,nn,fs=>accOf(M,fs),cm?(n,cb)=>{if(cm.hq[n]>=0)for(let k=cm.p[n];k<cm.p[n+1];k++)cb(cm.i[k],cm.w[k]);else cb(n,1);}:undefined),held=fix0.some(v=>v)||!!B.u0;for(let i=0;i<fix0.length;i++)fix0[i]|=B.dof[i];if(!held&&!B.stops.size&&!B.dadd)throw new Error('add at least one fixed face');if(cm)for(const n of M.hang.node)for(let c=0;c<3;c++)fix0[3*n+c]=1;
  X.fm_bc_in(3);if(B.dadd){V(229).set(B.dadd);X.fm_dadd();}
  const{f:fL,ap}=loadsOf(inp,M,mat,cm),f0=fL,tA=Date.now();if(B.any)X.fm_keep();let fix,nL,tH;
  const go=async act=>{fix=fix0.slice();const u0=B.u0?B.u0.slice():new Float64Array(3*nn);for(const[d,x]of act){fix[d]=1;u0[d]=x;}X.fm_bc_in(3);V(219).set(fix);V(224).set(u0);V(225).set(fL);X.fm_bc(B.any?1:0);const NS=nullspace(M,fix),tt=!B.any&&M.sweep&&M.sheet&&M.sheet.thin&&(inp.colT??true),C=tt?M.sweep.N+1:1;X.fm_amg_in(NS.nb);V(226).set(NS.B);nL=amg(P,inp,tt?M.sweep.nl:0,C,inp.col??C);tH=Date.now();
    const S=await solveSys(P,nL,nn,{tol:inp.tol,solver:inp.solver,gpuMin:inp.gpuMin??(tt||M.type==='adaptive'?Infinity:5000),maxIt:inp.maxIt,ceps:inp.ceps},prog),u=S.u;let rc=null;return{...S,u,R:d=>(rc||(rc=reac(P,u,fL)))[d]||0};};
  const S=B.stops.size?await contactSolve(B,held,go):await go(new Map()),u=S.u,tS=Date.now();
  P.ex.fm_post_in();P.v(218).set(u);P.v(219).set(fix);P.ex.fm_post(lam,mu);u.set(P.v(218));const vm=P.v(220).slice(),[vmMax,vmAway,uMax]=P.v(223);
  const sk=skinOf(M),svm=new Float32Array(sk.nodes.length),su=new Float32Array(3*sk.nodes.length);sk.nodes.forEach((n,i)=>{svm[i]=vm[n];su[3*i]=u[3*n];su[3*i+1]=u[3*n+1];su[3*i+2]=u[3*n+2];});
  const[vStress,vDisp]=toVerts(sk,inp.pos,[[svm,1],[su,3]]);let nFixed=0;for(let n=0;n<nn;n++)if(fix[3*n]||fix[3*n+1]||fix[3*n+2])nFixed++;
  const out={type:'static',vStress,vDisp,vmMax,vmP99:vmAway||vmMax,peakLabel:'Peak von Mises (away from supports)',uMax,h:M.size?M.size.h0:M.h0,nEl:ne,nDof:3*nn,iters:S.iters,rel:S.rel,levels:nL,ms:Date.now()-t0,applied:ap,reaction:reactions(reac(P,u,f0),3,fix),nFixed,backend:S.backend,gpuError:S.gpuError,why:S.why,hist:S.hist,contact:S.contact,held:B.grp.size?heldBy(B,S.R):undefined,skin:{pos:sk.pos,idx:sk.idx,vm:svm,u:su},u:inp.keepU?u:undefined,se:inp.keepU?P.v(237).slice():undefined,nodeVm:inp.keepU||inp.fields?vm:undefined,times:{assemble:tA-t0,amg:tH-tA,solve:tS-tH,post:Date.now()-tS}};
  if(inp.fields||inp.probes||inp.path){const hs=hexStress(M.X,M.E,u,mat.E,mat.nu,P.v(237)),p1=new Float32Array(nn),tr=new Float32Array(nn);for(let n=0;n<nn;n++)if(hs.cnt[n]){const m=principals(hs.node.subarray(6*n,6*n+6));p1[n]=m.p1;tr[n]=m.tresca;}out.p1Max=hs.p1Max;out.p3Min=hs.p3Min;out.trescaMax=hs.trMax;out.vmHex=hs.vmMax;out.skin.p1=skinOfField(sk.nodes,p1,1);out.skin.tr=skinOfField(sk.nodes,tr,1);out.nodeP1=p1;out.nodeTr=tr;if(inp._keepSys)out._sys={P,fix,elem:hs.elem,u};const fields={u:{data:u,stride:3},vm:{data:vm,stride:1},p1:{data:p1,stride:1},tresca:{data:tr,stride:1}};if(inp.probes)out.probes=probe(M.X,fields,inp.probes,(M.size&&M.size.h0)||M.h0||1);if(inp.path)out.path=pathPlot(M.X,fields,inp.path.a,inp.path.b,inp.path.n||21,(M.size&&M.size.h0)||M.h0||1);}
  return out;
}
function hangFill(M,cm,u,d){if(cm)for(const n of M.hang.node)for(let c=0;c<d;c++){let s=0;for(let k=cm.p[n];k<cm.p[n+1];k++)s+=cm.w[k]*u[d*cm.i[k]+c];u[d*n+c]=s;}return u;}
function faceW(M,faces){const W=new Map(),fc=M.select(faces).facets;let tot=0;if(!fc.length&&faces&&faces.region)throw new Error('A thermal area covers no part of the mesh. Place it on its face, make it larger, or use a finer mesh.');facetGeo(M.X,M.E,fc,(i,nd,w,nv,A)=>{tot+=A;for(let k=0;k<4;k++)W.set(nd[k],(W.get(nd[k])||0)+w[k]);});return{W,tot};}
async function modalMesh(inp,M,prog){
  const mat=inp.mat,nev=Math.max(1,Math.min(inp.modes||6,20)),t0=Date.now(),{cm,nn,H:P}=systemOf(inp,M,mat),X=P.ex,V=P.v,fix=supportDofs(inp,M,cm,true),free=!fix.some(v=>v),rho=(mat.rho||7850)*1e-12,vol=nodalVol(M),n=3*nn,Mv=new Float64Array(n);
  if(cm)for(const h of M.hang.node)for(let c=0;c<3;c++)fix[3*h+c]=1;
  for(let q=0;q<nn;q++){const m=vol[q]*rho;if(!m)continue;if(cm&&cm.hq[q]>=0){for(let k=cm.p[q];k<cm.p[q+1];k++)for(let c=0;c<3;c++)Mv[3*cm.i[k]+c]+=cm.w[k]*m;}else for(let c=0;c<3;c++)Mv[3*q+c]+=m;}for(let i=0;i<n;i++)if(fix[i])Mv[i]=0;
  X.fm_bc_in(3);V(219).set(fix);X.fm_bc(0);const NS=nullspace(M,fix);X.fm_amg_in(NS.nb);V(226).set(NS.B);const nL=amg(P,{theta:inp.theta,theta2:inp.theta2},0,0,M.sweep&&M.sheet&&M.sheet.thin?M.sweep.N+1:1);
  const defl=free?rigidModes(nn,q=>[M.X[3*q],M.X[3*q+1],M.X[3*q+2]],Mv):[],ops={A:async x=>{V(229).set(x);X.fm_mvx(1);return V(230).slice();},prec:async r=>{V(229).set(r);X.fm_vcyc();return V(230).slice();}};
  const E=await lobpcg([{fixed:fix}],null,Mv,nev,defl,{tol:inp.tol,maxIt:inp.maxIt},prog,ops),lmax=maxOf([...E.lam.map(Math.abs),1e-30]),sk=skinOf(M);let mt=0;for(let q=0;q<nn;q++)mt+=vol[q]*rho;
  const modes=[];let rigid=0;for(let j=0;j<E.lam.length&&modes.length<nev;j++){const lam=E.lam[j];if(lam<1e-7*lmax&&!free){rigid++;continue;}const x=hangFill(M,cm,E.X[j].slice(),3);let um=0;for(let q=0;q<nn;q++)um=Math.max(um,Math.hypot(x[3*q],x[3*q+1],x[3*q+2]));const gm=[0,0,0];for(let i=0;i<n;i++)gm[i%3]+=Mv[i]*x[i];
    const su=new Float32Array(3*sk.nodes.length),sm=new Float32Array(sk.nodes.length);sk.nodes.forEach((q,i)=>{for(let c=0;c<3;c++)su[3*i+c]=x[3*q+c]/(um||1);sm[i]=Math.hypot(su[3*i],su[3*i+1],su[3*i+2]);});const[vDisp]=toVerts(sk,inp.pos,[[su,3]]);
    const rec={f:Math.sqrt(Math.max(lam,0))/(2*Math.PI),omega:Math.sqrt(Math.max(lam,0)),res:E.res[j],meff:gm.map(g=>g*g/(mt||1)),vDisp,skinU:su,skinMag:sm};if(inp.keepVec)rec.vec=x;modes.push(rec);}
  const m0=modes[0],vMag=new Float32Array(inp.pos.length/3);if(m0)for(let q=0;q<vMag.length;q++)vMag[q]=Math.hypot(m0.vDisp[3*q],m0.vDisp[3*q+1],m0.vDisp[3*q+2]);
  return{type:'modal',modes,freqs:modes.map(m=>m.f),rigid:free?6:rigid,free,mass:mt*1000,vStress:vMag,vDisp:m0?m0.vDisp.slice():new Float32Array(inp.pos.length),vmMax:1,vmP99:1,uMax:1,nEl:M.E.length/8,nDof:n,iters:E.iters,rel:maxOf(E.res.slice(0,nev)),levels:nL,ms:Date.now()-t0,backend:'cpu',skin:{pos:sk.pos,idx:sk.idx,vm:m0?m0.skinMag:new Float32Array(sk.nodes.length),u:m0?m0.skinU:new Float32Array(3*sk.nodes.length)}};
}
async function thermalMesh(inp,M,prog){
  const mat=inp.mat||{},ck=condK(mat,inp.matKey),k=ck.k*1e-3,nn=M.X.length/3,ne=M.E.length/8,t0=Date.now(),W=heOf(M,X=>X.fm_heat(k)),cm=W.cm,P=W.H,X=P.ex,V=P.v,A={n:nn,m:nn,rb:1,cb:1,rp:W.rp,ci:W.ci,v:W.v};
  const ex=(q,f)=>{if(cm&&cm.hq[q]>=0){for(let j=cm.p[q];j<cm.p[q+1];j++)f(cm.i[j],cm.w[j]);}else f(q,1);},addK=(a,b,val)=>ex(a,(i,wi)=>ex(b,(j,wj)=>{const p=find(A.ci,A.rp[i],A.rp[i+1],j);if(p>=0)A.v[p]+=wi*wj*val;}));
  const fix=new Uint8Array(nn),u0=new Float64Array(nn),f=new Float64Array(nn),tg=new Int16Array(nn).fill(-1),temps=inp.temps||[],conv=inp.conv||[],flux=inp.flux||[];
  if(!temps.length&&!conv.length)throw new Error('add a fixed-temperature or convection face');
  temps.forEach((b,bi)=>{for(const q of faceW(M,b.faces).W.keys())ex(q,i=>{fix[i]=1;u0[i]=b.T;tg[i]=bi;});});
  const cv=conv.map(b=>{const{W}=faceW(M,b.faces),hc=(b.h||10)*1e-6;for(const[q,w]of W){addK(q,q,hc*w);ex(q,(i,wi)=>{f[i]+=wi*hc*w*(b.Tinf??20);});}return W;});
  const qin=flux.map(b=>{const{W,tot}=faceW(M,b.faces);let Q=0;for(const[q,w]of W){const v=b.Q!=null?b.Q*w/(tot||1):(b.q||0)*w;ex(q,(i,wi)=>{f[i]+=wi*v;});Q+=v;}return Q;});
  let qv=0;if(inp.Qvol){const vol=nodalVol(M);let vt=0;for(let q=0;q<nn;q++)vt+=vol[q];for(let q=0;q<nn;q++)if(vol[q])ex(q,(i,wi)=>{f[i]+=wi*inp.Qvol*vol[q]/vt;});qv=inp.Qvol;}
  if(cm)for(const h of M.hang.node)if(!fix[h]){fix[h]=1;u0[h]=0;}
  X.fm_bc_in(1);V(219).set(fix);V(224).set(u0);V(225).set(f);X.fm_bc(0);X.fm_amg_in(1);V(226).fill(1);const nL=amg(P,{},0,0,1);
  const S=await solveSys(P,nL,nn,{tol:inp.tol||1e-9,solver:'cpu'},prog),T=S.u;hangFill(M,cm,T,1);
  const rT=reactions(reac(P,T,f),1,fix,tg),qT=temps.map((_,i)=>rT[i]||0),qc=cv.map((W,i)=>{let s=0;const hc=(conv[i].h||10)*1e-6,Ti=conv[i].Tinf??20;for(const[q,w]of W)s+=hc*w*(Ti-T[q]);return s;});
  const sk=skinOf(M),sT=new Float32Array(sk.nodes.length);sk.nodes.forEach((q,i)=>{sT[i]=T[q];});const[vT]=toVerts(sk,inp.pos,[[sT,1]]);let Tmin=Infinity,Tmax=-Infinity;for(let q=0;q<nn;q++){Tmin=Math.min(Tmin,T[q]);Tmax=Math.max(Tmax,T[q]);}
  return{type:'thermal',vT,vStress:vT,vDisp:new Float32Array(inp.pos.length),Tmin,Tmax,vmMax:Tmax,vmP99:Tmax,uMax:0,Q:{fixed:qT,conv:qc,flux:qin,vol:qv},balance:qT.reduce((a,c)=>a+c,0)+qc.reduce((a,c)=>a+c,0)+qin.reduce((a,c)=>a+c,0)+qv,k:k*1e3,warn:ck.warn,nEl:ne,nDof:nn,iters:S.iters,rel:S.rel,levels:nL,ms:Date.now()-t0,backend:S.backend,skin:{pos:sk.pos,idx:sk.idx,vm:sT,u:new Float32Array(3*sk.nodes.length)},T:inp.keepU?T:undefined};
}
function dot(a,b){let s=0;const n=Math.min(a.length,b.length);for(let i=0;i<n;i++)s+=a[i]*b[i];return s;}
function lumpedMass(M,mat){const vol=M.nvol||nodalVol(M),rho=(mat.rho||7850)*1e-12,nn=vol.length,Mv=new Float64Array(3*nn);for(let q=0;q<nn;q++){const m=vol[q]*rho;if(m)Mv[3*q]=Mv[3*q+1]=Mv[3*q+2]=m;}return Mv;}
function mnorm(x,Mv){let s=0;for(let i=0;i<x.length;i++)s+=Mv[i]*x[i]*x[i];return Math.sqrt(s)||1;}
async function reSolve(P,f,fix,opt,prog){for(let i=0;i<f.length;i++)if(fix[i])f[i]=0;P.v(227).set(f);P.pr=prog;const iters=P.ex.fm_pcg(opt.tol||1e-7,opt.maxIt||opt.maxIt||700);P.ex.fm_fin();return{u:P.v(218).slice(),iters,rel:P.ex.fm_rel()};}
function casesOf(inp){if(inp.cases&&inp.cases.length)return inp.cases;const by=new Map();for(const l of inp.loads||[]){const k=l.case||'A';if(!by.has(k))by.set(k,[]);by.get(k).push(l);}const sc=inp.caseK||{};return [...by].map(([name,loads])=>({name,loads,scale:sc[name]!=null?+sc[name]:1}));}
async function harmonicMesh(inp,M,prog){
  const modal=await modalMesh({...inp,type:'modal',keepVec:true,modes:Math.max(1,Math.min(inp.modes||8,16))},M,prog);
  if(!modal.modes.length)throw new Error('no elastic modes; add a support');
  const {f,ap}=loadsOf(inp,M,inp.mat,null),Mv=lumpedMass(M,inp.mat),sk=skinOf(M),zeta=inp.zeta!=null?+inp.zeta:0.02;
  const modes=modal.modes.filter(m=>m.vec).map(m=>{const sc=1/mnorm(m.vec,Mv),mf=dot(m.vec,f)*sc,su=new Float32Array(3*sk.nodes.length);sk.nodes.forEach((q,i)=>{su[3*i]=m.vec[3*q]*sc;su[3*i+1]=m.vec[3*q+1]*sc;su[3*i+2]=m.vec[3*q+2]*sc;});return{f:m.f,omega:m.omega,mf,skinU:su,meff:m.meff};});
  const f0=inp.f0!=null?+inp.f0:modes[0].f*0.15,f1=inp.f1||modes[Math.min(modes.length-1,3)].f*1.25,np=Math.max(2,Math.min(inp.nFreq||31,80)),curve=[];
  const shapeAt=hz=>{const w=2*Math.PI*hz,re=new Float64Array(suLen()),im=new Float64Array(suLen());function suLen(){return modes[0].skinU.length;}for(const m of modes){const q=frf(m.mf,m.omega,w,zeta);for(let i=0;i<q.re===undefined?0:m.skinU.length;i++){re[i]+=q.re*m.skinU[i];im[i]+=q.im*m.skinU[i];}}return{re,im};};
  let peak=0,atF=f0;for(let i=0;i<np;i++){const hz=f0+(f1-f0)*i/(np-1),sh=shapeAt(hz);let a=0;for(let k=0;k<sh.re.length;k+=3)a=Math.max(a,Math.hypot(sh.re[k],sh.im[k],sh.re[k+1],sh.im[k+1],sh.re[k+2],sh.im[k+2]));curve.push({f:hz,amp:a});if(a>peak){peak=a;atF=hz;}}
  const watch=inp.at||atF,sh=shapeAt(watch),su=new Float32Array(sh.re.length),sm=new Float32Array(sh.re.length/3);let um=0;
  for(let i=0;i<sm.length;i++){for(let c=0;c<3;c++)su[3*i+c]=sh.re[3*i+c];const a=Math.hypot(sh.re[3*i],sh.im[3*i],sh.re[3*i+1],sh.im[3*i+1],sh.re[3*i+2],sh.im[3*i+2]);sm[i]=a;um=Math.max(um,Math.hypot(su[3*i],su[3*i+1],su[3*i+2]));}
  const[vStress,vDisp]=toVerts(sk,inp.pos,[[sm,1],[su,3]]);
  return{type:'harmonic',modes:modes.map(m=>({f:m.f,omega:m.omega,mf:m.mf,meff:m.meff,skinU:m.skinU})),curve,zeta,at:watch,applied:ap,freqs:modes.map(m=>m.f),vStress,vDisp,vmMax:peak,vmP99:peak,uMax:um||peak,nEl:modal.nEl,nDof:modal.nDof,iters:modal.iters,rel:modal.rel,levels:modal.levels,ms:modal.ms,backend:modal.backend,skin:{pos:sk.pos,idx:sk.idx,vm:sm,u:su},legendTitle:'Displacement amplitude (mm)',legendUnit:'len',legendLo:0,legendHi:peak};
}
async function fatigueMesh(inp,M,prog){
  const r=await staticMesh({...inp,fields:1},M,prog),sn=inp.mat.sn||snOf(inp.mat);if(!sn||!(sn.sut||sn.S2||sn.se))throw new Error('no fatigue data for this material');
  const sig=r.nodeVm||r.nodeP1,fat=fatigueField(sig,sn,{corr:inp.corr||'goodman',mean:inp.mean,hist:inp.hist,repeats:inp.repeats||1,method:inp.method,E:inp.mat.E,en:inp.method==='en'?{sf:sn.sf,b:sn.b,ef:sn.ef,c:sn.c,swt:!!inp.swt}:null});
  const sk=skinOf(M),life=new Float32Array(sk.nodes.length),dmg=new Float32Array(sk.nodes.length),fs=new Float32Array(sk.nodes.length);
  sk.nodes.forEach((n,i)=>{life[i]=isFinite(fat.life[n])?fat.life[n]:1e12;dmg[i]=fat.damage[n]||0;fs[i]=isFinite(fat.sf[n])?fat.sf[n]:1e6;});
  const show=inp.fatShow||'life',lo=show==='life'?Math.log10(Math.max(fat.lifeMin,1)):0,hi=show==='life'?Math.max(lo+0.5,Math.min(12,lo+3)):show==='damage'?Math.max(fat.damageMax,1e-6):Math.min(20,Math.max(2,(fat.sfMin||1)*3));
  const src=show==='damage'?dmg:show==='sf'?fs:life,painted=Float32Array.from(src,v=>show==='life'?Math.log10(Math.max(v,1)):v);
  const[vStress]=toVerts({pos:sk.pos,idx:sk.idx},inp.pos,[[painted,1]]);
  return{...r,u:undefined,_sys:undefined,nodeP1:undefined,nodeTr:undefined,nodeVm:undefined,type:'fatigue',lifeMin:fat.lifeMin,damageMax:fat.damageMax,sfMin:fat.sfMin,corr:inp.corr||'goodman',sn,vStress,vmMax:hi,vmP99:hi,legendTitle:show==='damage'?'Fatigue damage':show==='sf'?'Fatigue safety factor':'log10 cycles to crack initiation',legendUnit:'raw',legendLo:lo,legendHi:hi,skin:{pos:sk.pos,idx:sk.idx,vm:painted,u:r.skin.u,life,damage:dmg,fsf:fs},fatShow:show};
}
async function buckleMesh(inp,M,prog){
  const ref=await staticMesh({...inp,fields:1,_keepSys:1},M,prog),sys=ref._sys;if(!sys)throw new Error('buckling needs the reference stress');
  const {P,fix,elem,u}=sys,n=u.length,x=new Float64Array(n);for(let i=0;i<n;i++){x[i]=fix[i]?0:((i*17%100)/50-1)*((i%3)?1:0.05);}
  let lam=0,prev=0,it=0,rel=1;const trace=[];
  for(;it<10;it++){const gx=kgMul(M.X,M.E,elem,x);for(let i=0;i<n;i++)gx[i]=-gx[i];const S=await reSolve(P,gx,fix,{tol:1e-5,maxIt:400},prog);const y=S.u;let num=0;const gy=kgMul(M.X,M.E,elem,y);for(let i=0;i<n;i++){gy[i]=-gy[i];num+=y[i]*gx[i];}let den=0;for(let i=0;i<n;i++)den+=y[i]*gy[i];lam=den?num/den:0;let m=0;for(let i=0;i<n;i++)m=Math.max(m,Math.abs(y[i]));if(!(m>0))break;for(let i=0;i<n;i++)x[i]=y[i]/m;trace.push(lam);rel=S.rel;if(it>1&&Math.abs(lam-prev)<1e-3*Math.max(1,Math.abs(lam))){it++;break;}prev=lam;}
  const Pref=Math.hypot(...(ref.applied||[0,0,0]))||1,sk=skinOf(M),su=new Float32Array(3*sk.nodes.length),sm=new Float32Array(sk.nodes.length);
  sk.nodes.forEach((q,i)=>{su[3*i]=x[3*q];su[3*i+1]=x[3*q+1];su[3*i+2]=x[3*q+2];sm[i]=Math.hypot(su[3*i],su[3*i+1],su[3*i+2]);});
  const[vStress,vDisp]=toVerts(sk,inp.pos,[[sm,1],[su,3]]);
  return{type:'buckle',factor:lam,Pcr:lam*Pref,Pref,converged:trace.length>1&&Math.abs(trace[trace.length-1]-trace[trace.length-2])<1e-2*Math.max(1,Math.abs(lam)),trace,iters:it,rel,applied:ref.applied,vStress,vDisp,vmMax:1,vmP99:1,uMax:1,nEl:ref.nEl,nDof:n,ms:ref.ms,backend:ref.backend,skin:{pos:sk.pos,idx:sk.idx,vm:sm,u:su},legendTitle:'Buckling mode (relative)',legendUnit:'raw'};
}
async function transientMesh(inp,M,prog){
  const modal=await modalMesh({...inp,type:'modal',keepVec:true,modes:Math.max(1,Math.min(inp.modes||6,12))},M,prog);if(!modal.modes.length)throw new Error('no elastic modes; add a support');
  const {f,ap}=loadsOf(inp,M,inp.mat,null),Mv=lumpedMass(M,inp.mat),modes=modal.modes.filter(m=>m.vec).map(m=>{const sc=1/mnorm(m.vec,Mv);return{omega:m.omega,f:m.f,mf:dot(m.vec,f)*sc,vec:m.vec,sc};});
  const z=inp.zeta!=null?+inp.zeta:0,dt=inp.dt||(modes[0].f?1/(40*modes[0].f):1e-4),steps=Math.max(4,Math.min(inp.steps|0||80,400));
  const mf=modes.map(m=>m.mf),hist=modalNewmark(modes.map(m=>m.omega),()=>mf,dt,steps,z);
  let peak=0,iat=0,ustat=0;const sk=skinOf(M);
  const ampAt=q=>{let m=0;for(let s=0;s<sk.nodes.length;s++){const n=sk.nodes[s];let x=0,y=0,zz=0;for(let j=0;j<modes.length;j++){const c=q[j]*modes[j].sc;x+=c*modes[j].vec[3*n];y+=c*modes[j].vec[3*n+1];zz+=c*modes[j].vec[3*n+2];}m=Math.max(m,Math.hypot(x,y,zz));}return m;};
  const qstat=modes.map(m=>m.omega>1e-6?m.mf/(m.omega*m.omega):0);ustat=ampAt(qstat);
  hist.forEach((q,i)=>{const a=ampAt(q);if(a>peak){peak=a;iat=i;}});
  const q=hist[iat],su=new Float32Array(3*sk.nodes.length),sm=new Float32Array(sk.nodes.length);
  sk.nodes.forEach((n,i)=>{let x=0,y=0,zz=0;for(let j=0;j<modes.length;j++){const c=q[j]*modes[j].sc;x+=c*modes[j].vec[3*n];y+=c*modes[j].vec[3*n+1];zz+=c*modes[j].vec[3*n+2];}su[3*i]=x;su[3*i+1]=y;su[3*i+2]=zz;sm[i]=Math.hypot(x,y,zz);});
  const[vStress,vDisp]=toVerts(sk,inp.pos,[[sm,1],[su,3]]),curve=hist.map((qq,i)=>({t:(i+1)*dt,amp:i===iat?peak:ampAt(qq)}));
  return{type:'transient',peak:peak,staticAmp:ustat,dlf:ustat?peak/ustat:0,tPeak:(iat+1)*dt,dt,zeta:z,curve:curve.filter((_,i)=>i%Math.ceil(curve.length/40)===0||i===iat),freqs:modes.map(m=>m.f),applied:ap,vStress,vDisp,vmMax:peak,vmP99:peak,uMax:peak,nEl:modal.nEl,iters:modal.iters,rel:modal.rel,ms:modal.ms,backend:modal.backend,skin:{pos:sk.pos,idx:sk.idx,vm:sm,u:su},legendTitle:'Transient displacement (mm)',legendUnit:'len'};
}
async function combineMesh(inp,M,prog){
  const cases=casesOf(inp);if(!cases.length)throw new Error('add at least one load');
  const nn=M.X.length/3,accU=new Float64Array(3*nn),accS=new Float64Array(6*nn);let nEl=0,backend='',applied=[0,0,0];
  for(const c of cases){const r=await staticMesh({...inp,loads:c.loads,keepU:true},M,prog);nEl=r.nEl;backend=r.backend;const sc=c.scale??1,hs=hexStress(M.X,M.E,r.u,inp.mat.E,inp.mat.nu,r.se);for(let i=0;i<accU.length;i++)accU[i]+=sc*r.u[i];for(let i=0;i<accS.length;i++)accS[i]+=sc*(hs.cnt[i/6|0]?hs.node[i]:0);for(let k=0;k<3;k++)applied[k]+=sc*(r.applied[k]||0);}
  const sk=skinOf(M),svm=new Float32Array(sk.nodes.length),su=new Float32Array(3*sk.nodes.length);let vmMax=0,uMax=0;
  sk.nodes.forEach((n,i)=>{const m=principals(accS.subarray(6*n,6*n+6));svm[i]=m.vm;vmMax=Math.max(vmMax,m.vm);su[3*i]=accU[3*n];su[3*i+1]=accU[3*n+1];su[3*i+2]=accU[3*n+2];uMax=Math.max(uMax,Math.hypot(su[3*i],su[3*i+1],su[3*i+2]));});
  const[vStress,vDisp]=toVerts(sk,inp.pos,[[svm,1],[su,3]]);
  return{type:'combine',cases:cases.map(c=>c.name||'case'),vStress,vDisp,vmMax,vmP99:vmMax,uMax,applied,nEl,nDof:3*nn,backend,skin:{pos:sk.pos,idx:sk.idx,vm:svm,u:su},legendTitle:'Combined von Mises (MPa)',legendUnit:'stress'};
}
