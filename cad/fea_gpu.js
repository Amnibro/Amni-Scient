const IDX='let n=g.x+g.y*nw.x*64u;';
const EL=(b,body)=>`struct U{n:u32,m:u32,a:u32,b:u32,c:u32,d:u32,e:u32,f:u32};
@group(0)@binding(0) var<uniform> u:U;
${b}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g:vec3u,@builtin(num_workgroups) nw:vec3u){${IDX}if(n>=u.n){return;}${body}}`;
const RED=`var<workgroup> s1:array<f32,256>;var<workgroup> s2:array<f32,256>;
fn red(li:u32){var s=128u;loop{if(s==0u){break;}if(li<s){s1[li]+=s1[li+s];s2[li]+=s2[li+s];}workgroupBarrier();s=s>>1u;}}`;
const WGSL={
mv:`struct P{NX:u32,NY:u32,NZ:u32,nx:u32,ny:u32,nz:u32,ke:u32,mode:u32,om:f32,q0:u32,q1:u32,q2:u32,q3:u32,q4:u32,q5:u32,q6:u32};
@group(0)@binding(0) var<uniform> p:P;
@group(0)@binding(1) var<storage,read> K:array<f32>;
@group(0)@binding(2) var<storage,read> sc:array<f32>;
@group(0)@binding(3) var<storage,read> cq:array<i32>;
@group(0)@binding(4) var<storage,read> x:array<f32>;
@group(0)@binding(5) var<storage,read> b:array<f32>;
@group(0)@binding(6) var<storage,read> d:array<f32>;
@group(0)@binding(7) var<storage,read_write> y:array<f32>;
fn lo(a:u32)->vec3u{let c=a&3u;return vec3u(((c+1u)>>1u)&1u,(c>>1u)&1u,a>>2u);}
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g:vec3u,@builtin(num_workgroups) nw:vec3u){${IDX}
 if(n>=p.NX*p.NY*p.NZ){return;}
 let i=n%p.NX;let j=(n/p.NX)%p.NY;let k=n/(p.NX*p.NY);var ac=vec3f(0.0);let ur=select(vec3f(0.0),vec3f(x[3u*n],x[3u*n+1u],x[3u*n+2u]),p.ke==0u);
 if(p.mode!=3u){for(var a=0u;a<8u;a++){let l=lo(a);if(i<l.x||j<l.y||k<l.z){continue;}let ci=i-l.x;let cj=j-l.y;let ck=k-l.z;if(ci>=p.nx||cj>=p.ny||ck>=p.nz){continue;}
  let q=cq[(ck*p.ny+cj)*p.nx+ci];if(q<0){continue;}
  let kb=select(0u,u32(q)*576u,p.ke==1u);let s=select(sc[u32(q)],1.0,p.ke==1u);let n0=(ck*p.NY+cj)*p.NX+ci;var t=vec3f(0.0);
  for(var e=0u;e<8u;e++){let m=lo(e);let nb=3u*(n0+m.x+m.y*p.NX+m.z*p.NX*p.NY);let v=vec3f(x[nb],x[nb+1u],x[nb+2u])-ur;let r=kb+72u*a+3u*e;
   t+=vec3f(dot(vec3f(K[r],K[r+1u],K[r+2u]),v),dot(vec3f(K[r+24u],K[r+25u],K[r+26u]),v),dot(vec3f(K[r+48u],K[r+49u],K[r+50u]),v));}
  ac+=s*t;}}
 for(var c=0u;c<3u;c++){let id=3u*n+c;let dd=d[id];let fx=dd<0.0;var o=0.0;
  if(p.mode==0u){o=select(ac[c],x[id],fx);}else if(p.mode==1u){o=select(b[id]-ac[c],0.0,fx);}else if(p.mode==2u){o=select(x[id]+p.om*(b[id]-ac[c])/dd,0.0,fx);}else{o=select(p.om*b[id]/dd,0.0,fx);}
  y[id]=o;}}`,
rs:EL(`@group(0)@binding(1) var<storage,read> tf:array<f32>;
@group(0)@binding(2) var<storage,read> df:array<f32>;
@group(0)@binding(3) var<storage,read> dc:array<f32>;
@group(0)@binding(4) var<storage,read_write> bc:array<f32>;`,`let I=n%u.d;let J=(n/u.d)%u.e;let Kc=n/(u.d*u.e);var ac=vec3f(0.0);
 for(var dk=-1;dk<=1;dk++){let fk=i32(2u*Kc)+dk;if(fk<0||fk>=i32(u.c)){continue;}let wk=select(0.5,1.0,dk==0);
  for(var dj=-1;dj<=1;dj++){let fj=i32(2u*J)+dj;if(fj<0||fj>=i32(u.b)){continue;}let wj=wk*select(0.5,1.0,dj==0);
   for(var di=-1;di<=1;di++){let fi=i32(2u*I)+di;if(fi<0||fi>=i32(u.a)){continue;}let w=wj*select(0.5,1.0,di==0);let f=3u*((u32(fk)*u.b+u32(fj))*u.a+u32(fi));
    for(var c=0u;c<3u;c++){if(df[f+c]>=0.0){ac[c]+=w*tf[f+c];}}}}}
 for(var c=0u;c<3u;c++){bc[3u*n+c]=select(ac[c],0.0,dc[3u*n+c]<0.0);}`),
pl:EL(`@group(0)@binding(1) var<storage,read> xc:array<f32>;
@group(0)@binding(2) var<storage,read> df:array<f32>;
@group(0)@binding(3) var<storage,read_write> xf:array<f32>;`,`let i=n%u.a;let j=(n/u.a)%u.b;let k=n/(u.a*u.b);var ac=vec3f(0.0);
 let wi=select(1.0,0.5,(i&1u)==1u);let wj=select(1.0,0.5,(j&1u)==1u);let wk=select(1.0,0.5,(k&1u)==1u);
 for(var c2=0u;c2<=(k&1u);c2++){for(var b2=0u;b2<=(j&1u);b2++){for(var a2=0u;a2<=(i&1u);a2++){let q=3u*((((k>>1u)+c2)*u.e+(j>>1u)+b2)*u.d+(i>>1u)+a2);ac+=wi*wj*wk*vec3f(xc[q],xc[q+1u],xc[q+2u]);}}}
 for(var c=0u;c<3u;c++){let id=3u*n+c;if(df[id]>=0.0){xf[id]+=ac[c];}}`),
dot:`struct U{n:u32,m:u32,a:u32,b:u32};
@group(0)@binding(0) var<uniform> u:U;
@group(0)@binding(1) var<storage,read> A:array<f32>;
@group(0)@binding(2) var<storage,read> B:array<f32>;
@group(0)@binding(3) var<storage,read_write> part:array<f32>;
${RED}
@compute @workgroup_size(256) fn main(@builtin(local_invocation_index) li:u32,@builtin(workgroup_id) wid:vec3u){var t1=0.0;var t2=0.0;var i=wid.x*256u+li;loop{if(i>=u.n){break;}let a=A[i];t1+=a*B[i];t2+=a*a;i+=65536u;}s1[li]=t1;s2[li]=t2;workgroupBarrier();red(li);if(li==0u){part[2u*wid.x]=s1[0];part[2u*wid.x+1u]=s2[0];}}`,
fin:`struct U{n:u32,m:u32,a:u32,b:u32};
@group(0)@binding(0) var<uniform> u:U;
@group(0)@binding(1) var<storage,read> part:array<f32>;
@group(0)@binding(2) var<storage,read_write> S:array<f32>;
${RED}
@compute @workgroup_size(256) fn main(@builtin(local_invocation_index) li:u32){s1[li]=part[2u*li];s2[li]=part[2u*li+1u];workgroupBarrier();red(li);
 if(li==0u){let ab=s1[0];let aa=s2[0];
  if(u.m==0u){let bad=S[5]>0.0||!(ab>0.0);S[1]=ab;S[2]=select(S[0]/ab,0.0,bad);if(bad){S[5]=1.0;}}
  else if(u.m==1u){S[3]=select(ab/S[0],0.0,S[0]==0.0||S[5]>0.0);S[0]=ab;S[4]=aa;}
  else if(u.m==2u){S[0]=ab;S[4]=aa;S[3]=0.0;S[5]=0.0;}else{S[4]=aa;S[6]=sqrt(aa);}}}`,
axpy:EL(`@group(0)@binding(1) var<storage,read> S:array<f32>;
@group(0)@binding(2) var<storage,read> p:array<f32>;
@group(0)@binding(3) var<storage,read> Ap:array<f32>;
@group(0)@binding(4) var<storage,read_write> x:array<f32>;
@group(0)@binding(5) var<storage,read_write> r:array<f32>;`,`let al=S[2];x[n]+=al*p[n];r[n]-=al*Ap[n];`),
pu:EL(`@group(0)@binding(1) var<storage,read> S:array<f32>;
@group(0)@binding(2) var<storage,read> z:array<f32>;
@group(0)@binding(3) var<storage,read_write> p:array<f32>;`,`p[n]=select(z[n]+S[3]*p[n],z[n]*inverseSqrt(max(S[4],1e-30)),u.m==1u);`)};
let devP=null;const pipes=new WeakMap();
export function gpuDevice(){return devP||(devP=(async()=>{const g=globalThis.navigator&&navigator.gpu;if(!g)return null;const a=await g.requestAdapter({powerPreference:'high-performance'});if(!a)return null;const l=a.limits,d=await a.requestDevice({requiredLimits:{maxStorageBufferBindingSize:l.maxStorageBufferBindingSize,maxBufferSize:l.maxBufferSize}});d.lost.then(()=>{devP=null;});return d;})().catch(()=>null));}
function pipesOf(d){let P=pipes.get(d);if(!P){P={};for(const k in WGSL)P[k]=d.createComputePipeline({layout:'auto',compute:{module:d.createShaderModule({code:WGSL[k]}),entryPoint:'main'}});pipes.set(d,P);}return P;}
const wg=c=>[Math.min(c,65535),Math.ceil(c/65535)];
export async function gpuContext(Ls,K,opt={}){
  const d=await gpuDevice();if(!d)return null;
  d.pushErrorScope('out-of-memory');d.pushErrorScope('validation');let popped=false;const pop=async()=>{popped=true;const a=await d.popErrorScope(),c=await d.popErrorScope();if(a||c)throw new Error('WebGPU: '+(a||c).message);};
  const all=[],US=GPUBufferUsage,ids=new Map(),lim=d.limits.maxStorageBufferBindingSize;let P;
  const sb=(data,extra=0)=>{const sz=typeof data==='number'?data*4:data.byteLength;if(sz>lim)throw new Error('GPU buffer limit ('+Math.round(sz/1048576)+' MB)');const B=d.createBuffer({size:Math.max(16,Math.ceil(sz/16)*16),usage:US.STORAGE|US.COPY_DST|US.COPY_SRC|extra});if(typeof data!=='number')d.queue.writeBuffer(B,0,data);all.push(B);ids.set(B,ids.size);return B;};
  const ub=a=>{const B=d.createBuffer({size:a.byteLength,usage:US.UNIFORM|US.COPY_DST});d.queue.writeBuffer(B,0,a);all.push(B);return B;};
  const memo=new Map(),bg=(pipe,key,bufs)=>{const k=key+':'+bufs.map(x=>ids.get(x)??'u').join(',');let g=memo.get(k);if(!g){g=d.createBindGroup({layout:P[pipe].getBindGroupLayout(0),entries:bufs.map((buffer,binding)=>({binding,resource:{buffer}}))});memo.set(k,g);}return g;};const free=()=>{for(const B of all)B.destroy();all.length=0;};
  try{
    P=pipesOf(d);
    const K32=Float32Array.from(K),f2u=v=>new Uint32Array(new Float32Array([v]).buffer)[0];
    const GL=Ls.map(L=>{const n=L.nn*3,cq=new Int32Array(L.nx*L.ny*L.nz).fill(-1);for(let q=0;q<L.sc.length;q++){const n0=L.E[q*8],i=n0%L.NX,j=Math.floor(n0/L.NX)%L.NY,k=Math.floor(n0/(L.NX*L.NY));cq[(k*L.ny+j)*L.nx+i]=q;}const dg=new Float32Array(n);for(let i=0;i<n;i++)dg[i]=L.fixed[i]?-1:L.diag[i];
      return{L,n,cq:sb(cq),d:sb(dg),K:L.KE?sb(L.KE):sb(K32),sc:sb(L.KE?new Float32Array(4):Float32Array.from(L.sc)),X:[sb(n),sb(n)],T:sb(n),B:null,ke:L.KE?1:0,om:L.om||0.5,wN:wg(Math.ceil(L.nn/64)),cur:0};});
    const g0=GL[0],n=g0.n,r=sb(n),p=sb(n),Ap=sb(n),u=sb(n),S=sb(8),part=sb(512),wD=wg(Math.ceil(n/64)),uE=ub(new Uint32Array([n,0,0,0,0,0,0,0]));g0.B=r;for(let l=1;l<GL.length;l++)GL[l].B=sb(GL[l].n);
    const Sst=d.createBuffer({size:32,usage:US.MAP_READ|US.COPY_DST}),Ust=d.createBuffer({size:n*4,usage:US.MAP_READ|US.COPY_DST});all.push(Sst,Ust);
    const mvU=new Map(),mvb=(l,mode,x,bb,y,om)=>{const g=GL[l],L=g.L,w=om??(mode===3&&GL.length===1?1:g.om),key=l+'.'+mode+'.'+w;let U=mvU.get(key);if(!U)mvU.set(key,U=ub(new Uint32Array([L.NX,L.NY,L.NZ,L.nx,L.ny,L.nz,g.ke,mode,f2u(w),0,0,0,0,0,0,0])));return bg('mv',key,[U,g.K,g.sc,g.cq,x,bb,g.d,y]);};
    const tU=(f,c)=>ub(new Uint32Array([c.L.NX*c.L.NY*c.L.NZ,0,f.L.NX,f.L.NY,f.L.NZ,c.L.NX,c.L.NY,c.L.NZ])),tUp=(f,c)=>ub(new Uint32Array([f.L.NX*f.L.NY*f.L.NZ,0,f.L.NX,f.L.NY,f.L.NZ,c.L.NX,c.L.NY,c.L.NZ]));
    const rsU=GL.map((g,l)=>l+1<GL.length?tU(g,GL[l+1]):null),plU=GL.map((g,l)=>l+1<GL.length?tUp(g,GL[l+1]):null);
    const pre=[],D=(L,pipe,g,c)=>L.push([P[pipe],g,c]),nsw=opt.nsw||1,fU=[0,1,2,3].map(m=>ub(new Uint32Array([0,m,0,0]))),dU=ub(new Uint32Array([n,0,0,0])),uS=ub(new Uint32Array([n,1,0,0,0,0,0,0]));
    const run=async(list,reps)=>{const e=d.createCommandEncoder(),ps=e.beginComputePass();for(let k=0;k<reps;k++)for(const[pp,g,c]of list){ps.setPipeline(pp);ps.setBindGroup(0,g);ps.dispatchWorkgroups(c[0],c[1]||1);}ps.end();e.copyBufferToBuffer(S,0,Sst,0,32);d.queue.submit([e.finish()]);await Sst.mapAsync(GPUMapMode.READ);const s=new Float32Array(Sst.getMappedRange().slice(0));Sst.unmap();return s;};
    if(GL.length>1&&!(g0.L.om>0)){const zb=sb(n),x0=new Float32Array(n),pw=[];let q=12345;for(let i=0;i<n;i++){q=(q*1103515245+12345)&0x7fffffff;x0[i]=g0.L.fixed[i]?0:q/0x7fffffff-0.5;}d.queue.writeBuffer(p,0,x0);
      D(pw,'mv',mvb(0,1,p,zb,Ap,0),g0.wN);D(pw,'mv',mvb(0,3,p,Ap,g0.X[0],1),g0.wN);D(pw,'dot',bg('dot','pw',[dU,g0.X[0],g0.X[0],part]),[256]);D(pw,'fin',bg('fin','f3',[fU[3],part,S]),[1]);D(pw,'pu',bg('pu','ps',[uS,S,g0.X[0],p]),wD);
      const lam=(await run(pw,14))[6];g0.om=g0.L.om=Math.min(0.8,1.15/(lam*1.05));}
    const vc=l=>{const g=GL[l],sw=()=>{D(pre,'mv',mvb(l,2,g.X[g.cur],g.B,g.X[1-g.cur]),g.wN);g.cur^=1;};D(pre,'mv',mvb(l,3,g.X[1],g.B,g.X[0]),g.wN);g.cur=0;
      if(l===GL.length-1){for(let s=1;s<40;s++)sw();return;}
      for(let s=1;s<nsw;s++)sw();D(pre,'mv',mvb(l,1,g.X[g.cur],g.B,g.T),g.wN);const c=GL[l+1];
      D(pre,'rs',bg('rs','r'+l,[rsU[l],g.T,g.d,c.d,c.B]),c.wN);vc(l+1);D(pre,'pl',bg('pl','p'+l,[plU[l],c.X[c.cur],g.d,g.X[g.cur]]),g.wN);sw();};
    if(GL.length>1)vc(0);else{D(pre,'mv',mvb(0,3,Ap,r,g0.X[0]),g0.wN);g0.cur=0;}
    const z=g0.X[g0.cur];
    const init=[...pre],iter=[];D(init,'dot',bg('dot','rz',[dU,r,z,part]),[256]);D(init,'fin',bg('fin','f2',[fU[2],part,S]),[1]);D(init,'pu',bg('pu','pu',[uE,S,z,p]),wD);
    D(iter,'mv',mvb(0,0,p,r,Ap),g0.wN);D(iter,'dot',bg('dot','pa',[dU,p,Ap,part]),[256]);D(iter,'fin',bg('fin','f0',[fU[0],part,S]),[1]);D(iter,'axpy',bg('axpy','ax',[uE,S,p,Ap,u,r]),wD);iter.push(...pre);D(iter,'dot',bg('dot','rz',[dU,r,z,part]),[256]);D(iter,'fin',bg('fin','f1',[fU[1],part,S]),[1]);D(iter,'pu',bg('pu','pu',[uE,S,z,p]),wD);
    const rd=async B=>{const e=d.createCommandEncoder();e.copyBufferToBuffer(B,0,Ust,0,n*4);d.queue.submit([e.finish()]);await Ust.mapAsync(GPUMapMode.READ);const v=new Float32Array(Ust.getMappedRange().slice(0));Ust.unmap();return v;},io=async(list,inB,x,outB)=>{d.queue.writeBuffer(inB,0,Float32Array.from(x));await run(list,1);return Float64Array.from(await rd(outB));};
    await run(init,1);await run(iter,1);await pop();
    const solve=async(b,prog)=>{
      const tol=opt.tol||1e-6,maxIt=opt.maxIt||(GL.length>1?400:20000),CH=GL.length>1?10:100,fn=Math.sqrt(b.reduce((a,v)=>a+v*v,0))||1,U=new Float64Array(n),y=new Float64Array(n),t0=Date.now();
      let rhs=b,rel=1,its=0,outer=0;const hist=[];
      for(;outer<4;outer++){
        const fr=Math.sqrt(rhs.reduce((a,v)=>a+v*v,0))||1,itol=outer?1e-3:Math.max(tol,1e-5);
        d.queue.writeBuffer(r,0,Float32Array.from(rhs));const e=d.createCommandEncoder();e.clearBuffer(u);e.clearBuffer(p);d.queue.submit([e.finish()]);
        let s=await run(init,1),it=0,best=Infinity,stall=0,ir=Math.sqrt(s[4])/fr;
        while(it<maxIt&&ir>itol){s=await run(iter,CH);it+=CH;ir=Math.sqrt(Math.max(s[4],0))/fr;if(prog)prog(its+it,ir*fr/fn,'gpu');if(s[5]>0||!isFinite(ir))break;ir<best*0.8?(best=ir,stall=0):stall++;if(stall>=4)break;}
        its+=it;const v=await rd(u);
        let cn=0,un=0;for(let i=0;i<n;i++){U[i]+=isFinite(v[i])?v[i]:0;cn+=v[i]*v[i];un+=U[i]*U[i];}opt.mv(U,y);const res=new Float64Array(n);for(let i=0;i<n;i++)res[i]=b[i]-y[i];rel=Math.sqrt(res.reduce((a,v2)=>a+v2*v2,0))/fn;const dU=Math.sqrt(cn/(un||1));hist.push({it,ir,rel,dU});
        if(rel<tol||outer&&dU<1e-3)break;if(outer&&!(dU<0.5))throw new Error('GPU solver did not converge');rhs=res;
      }
      return{u:U,iters:its,rel,outer:outer+1,hist,gpuMs:Date.now()-t0,levels:GL.length};
    };
    return{n,levels:GL.length,solve,mv:x=>io([iter[0]],p,x,Ap),prec:x=>io(pre,r,x,z),free};
  }catch(e){if(!popped){d.popErrorScope().catch(()=>{});d.popErrorScope().catch(()=>{});}free();throw e;}
}
export async function gpuSolve(Ls,K,b,opt={},prog){const c=await gpuContext(Ls,K,opt);if(!c)return null;try{return await c.solve(b,prog);}finally{c.free();}}
