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
bsr:`struct U{n:u32,rb:u32,cb:u32,mode:u32};
@group(0)@binding(0) var<uniform> u:U;
@group(0)@binding(1) var<storage,read> rp:array<u32>;
@group(0)@binding(2) var<storage,read> ci:array<u32>;
@group(0)@binding(3) var<storage,read> v:array<f32>;
@group(0)@binding(4) var<storage,read> x:array<f32>;
@group(0)@binding(5) var<storage,read> b:array<f32>;
@group(0)@binding(6) var<storage,read_write> y:array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g:vec3u,@builtin(num_workgroups) nw:vec3u){${IDX}if(n>=u.n){return;}var a:array<f32,9>;
 for(var k=rp[n];k<rp[n+1u];k++){let j=ci[k]*u.cb;let o=k*u.rb*u.cb;for(var r=0u;r<u.rb;r++){var s=0.0;for(var c=0u;c<u.cb;c++){s+=v[o+r*u.cb+c]*x[j+c];}a[r]+=s;}}
 for(var r=0u;r<u.rb;r++){let id=n*u.rb+r;if(u.mode==0u){y[id]=a[r];}else if(u.mode==1u){y[id]=b[id]-a[r];}else{y[id]=y[id]+a[r];}}}`,
chb:`struct U{n:u32,sb:u32,asg:u32,q:u32,c1:f32,c2:f32,q2:f32,q3:f32};
@group(0)@binding(0) var<uniform> u:U;
@group(0)@binding(1) var<storage,read> D:array<f32>;
@group(0)@binding(2) var<storage,read> r:array<f32>;
@group(0)@binding(3) var<storage,read_write> d:array<f32>;
@group(0)@binding(4) var<storage,read_write> x:array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g:vec3u,@builtin(num_workgroups) nw:vec3u){${IDX}if(n>=u.n){return;}let s=n/u.sb;let a=n%u.sb;let o=s*u.sb;let m=min(u.sb,u.n-o);var z=0.0;let ro=(s*u.sb+a)*u.sb;
 for(var c=0u;c<m;c++){z+=D[ro+c]*r[o+c];}let dd=select(u.c1*d[n],0.0,u.asg==1u)+u.c2*z;d[n]=dd;x[n]=select(x[n]+dd,dd,u.asg==1u);}`,
dmv:`struct U{n:u32,m:u32,a:u32,b2:u32};
@group(0)@binding(0) var<uniform> u:U;
@group(0)@binding(1) var<storage,read> M:array<f32>;
@group(0)@binding(2) var<storage,read> x:array<f32>;
@group(0)@binding(3) var<storage,read_write> y:array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) g:vec3u,@builtin(num_workgroups) nw:vec3u){${IDX}if(n>=u.n){return;}var s=0.0;let o=n*u.n;for(var j=0u;j<u.n;j++){s+=M[o+j]*x[j];}y[n]=s;}`,
pu:EL(`@group(0)@binding(1) var<storage,read> S:array<f32>;
@group(0)@binding(2) var<storage,read> z:array<f32>;
@group(0)@binding(3) var<storage,read_write> p:array<f32>;`,`p[n]=select(z[n]+S[3]*p[n],z[n]*inverseSqrt(max(S[4],1e-30)),u.m==1u);`),
csr:EL(`@group(0)@binding(1) var<storage,read> rp:array<u32>;
@group(0)@binding(2) var<storage,read> ci:array<u32>;
@group(0)@binding(3) var<storage,read> va:array<f32>;
@group(0)@binding(4) var<storage,read> x:array<f32>;
@group(0)@binding(5) var<storage,read_write> y:array<f32>;`,`var s=0.0;for(var k=rp[n];k<rp[n+1u];k++){s+=va[k]*x[ci[k]];}y[n]=s;`),
jac:EL(`@group(0)@binding(1) var<storage,read> di:array<f32>;
@group(0)@binding(2) var<storage,read> r:array<f32>;
@group(0)@binding(3) var<storage,read_write> z:array<f32>;`,`z[n]=r[n]*di[n];`)};
let devP=null;const pipes=new WeakMap();
export function gpuDevice(){return devP||(devP=(async()=>{const g=globalThis.navigator&&navigator.gpu;if(!g)return null;const a=await g.requestAdapter({powerPreference:'high-performance'});if(!a)return null;const l=a.limits,d=await a.requestDevice({requiredLimits:{maxStorageBufferBindingSize:l.maxStorageBufferBindingSize,maxBufferSize:l.maxBufferSize}});d.lost.then(()=>{devP=null;});return d;})().catch(()=>null));}
function pipesOf(d){let P=pipes.get(d);if(!P){P={};for(const k in WGSL)P[k]=d.createComputePipeline({layout:'auto',compute:{module:d.createShaderModule({code:WGSL[k]}),entryPoint:'main'}});pipes.set(d,P);}return P;}
const wg=c=>[Math.min(c,65535),Math.ceil(c/65535)];
function kit(d){const all=[],US=GPUBufferUsage,ids=new Map(),lim=d.limits.maxStorageBufferBindingSize,K={all,US};
  K.sb=(data,extra=0)=>{const sz=typeof data==='number'?data*4:data.byteLength;if(sz>lim)throw new Error('GPU buffer limit ('+Math.round(sz/1048576)+' MB)');const B=d.createBuffer({size:Math.max(16,Math.ceil(sz/16)*16),usage:US.STORAGE|US.COPY_DST|US.COPY_SRC|extra});if(typeof data!=='number')d.queue.writeBuffer(B,0,data);all.push(B);ids.set(B,ids.size);return B;};
  K.ub=a=>{const B=d.createBuffer({size:a.byteLength,usage:US.UNIFORM|US.COPY_DST});d.queue.writeBuffer(B,0,a);all.push(B);return B;};
  const memo=new Map();K.bg=(pipe,key,bufs)=>{const k=pipe+key+':'+bufs.map(x=>ids.get(x)??'u').join(',');let g=memo.get(k);if(!g){g=d.createBindGroup({layout:K.P[pipe].getBindGroupLayout(0),entries:bufs.map((buffer,binding)=>({binding,resource:{buffer}}))});memo.set(k,g);}return g;};K.free=()=>{for(const B of all)B.destroy();all.length=0;};return K;}
function runner(d,S,n,all,US){const Sst=d.createBuffer({size:32,usage:US.MAP_READ|US.COPY_DST}),Ust=d.createBuffer({size:n*4,usage:US.MAP_READ|US.COPY_DST});all.push(Sst,Ust);
  const run=async(list,reps)=>{const e=d.createCommandEncoder(),ps=e.beginComputePass();for(let k=0;k<reps;k++)for(const[pp,g,c]of list){ps.setPipeline(pp);ps.setBindGroup(0,g);ps.dispatchWorkgroups(c[0],c[1]||1);}ps.end();e.copyBufferToBuffer(S,0,Sst,0,32);d.queue.submit([e.finish()]);await Sst.mapAsync(GPUMapMode.READ);const s=new Float32Array(Sst.getMappedRange().slice(0));Sst.unmap();return s;};
  const rd=async B=>{const e=d.createCommandEncoder();e.copyBufferToBuffer(B,0,Ust,0,n*4);d.queue.submit([e.finish()]);await Ust.mapAsync(GPUMapMode.READ);const v=new Float32Array(Ust.getMappedRange().slice(0));Ust.unmap();return v;};return{run,rd};}
function pcgLoop(d,c){const n=c.n;return async(b,prog)=>{
      const tol=c.tol||1e-6,maxIt=c.maxIt||(c.multi?400:20000),CH=c.multi?10:100,fn=Math.sqrt(b.reduce((a,v)=>a+v*v,0))||1,U=new Float64Array(n),y=new Float64Array(n),t0=Date.now();
      let rhs=b,rel=1,its=0,outer=0;const hist=[];
      for(;outer<4;outer++){
        const fr=Math.sqrt(rhs.reduce((a,v)=>a+v*v,0))||1,itol=outer?1e-3:Math.max(tol,1e-5);
        d.queue.writeBuffer(c.r,0,Float32Array.from(rhs));const e=d.createCommandEncoder();e.clearBuffer(c.u);e.clearBuffer(c.p);d.queue.submit([e.finish()]);
        let s=await c.run(c.init,1),it=0,best=Infinity,stall=0,ir=Math.sqrt(s[4])/fr;
        while(it<maxIt&&ir>itol){s=await c.run(c.iter,CH);it+=CH;ir=Math.sqrt(Math.max(s[4],0))/fr;if(prog)prog(its+it,ir*fr/fn,'gpu');if(s[5]>0||!isFinite(ir))break;ir<best*0.8?(best=ir,stall=0):stall++;if(stall>=4)break;}
        its+=it;const v=await c.rd(c.u);
        let cn=0,un=0;for(let i=0;i<n;i++){U[i]+=isFinite(v[i])?v[i]:0;cn+=v[i]*v[i];un+=U[i]*U[i];}await c.mv(U,y);const res=new Float64Array(n);for(let i=0;i<n;i++)res[i]=b[i]-y[i];rel=Math.sqrt(res.reduce((a,v2)=>a+v2*v2,0))/fn;const dU=Math.sqrt(cn/(un||1));hist.push({it,ir,rel,dU});
        if(rel<tol||outer&&dU<1e-3)break;if(outer&&!(dU<0.5))throw new Error('GPU solver did not converge');rhs=res;
      }
      return{u:U,iters:its,rel,outer:outer+1,hist,gpuMs:Date.now()-t0,levels:c.levels};
    };}
export async function gpuContext(Ls,K,opt={}){
  const d=await gpuDevice();if(!d)return null;
  d.pushErrorScope('out-of-memory');d.pushErrorScope('validation');let popped=false;const pop=async()=>{popped=true;const a=await d.popErrorScope(),c=await d.popErrorScope();if(a||c)throw new Error('WebGPU: '+(a||c).message);};
  const kt=kit(d),{all,US,sb,ub,bg,free}=kt;let P;
  try{
    P=kt.P=pipesOf(d);
    const K32=Float32Array.from(K),f2u=v=>new Uint32Array(new Float32Array([v]).buffer)[0];
    const GL=Ls.map(L=>{const n=L.nn*3,cq=new Int32Array(L.nx*L.ny*L.nz).fill(-1);for(let q=0;q<L.sc.length;q++){const n0=L.E[q*8],i=n0%L.NX,j=Math.floor(n0/L.NX)%L.NY,k=Math.floor(n0/(L.NX*L.NY));cq[(k*L.ny+j)*L.nx+i]=q;}const dg=new Float32Array(n);for(let i=0;i<n;i++)dg[i]=L.fixed[i]?-1:L.diag[i];
      return{L,n,cq:sb(cq),d:sb(dg),K:L.KE?sb(L.KE):sb(K32),sc:sb(L.KE?new Float32Array(4):Float32Array.from(L.sc)),X:[sb(n),sb(n)],T:sb(n),B:null,ke:L.KE?1:0,om:L.om||0.5,wN:wg(Math.ceil(L.nn/64)),cur:0};});
    const g0=GL[0],n=g0.n,r=sb(n),p=sb(n),Ap=sb(n),u=sb(n),S=sb(8),part=sb(512),wD=wg(Math.ceil(n/64)),uE=ub(new Uint32Array([n,0,0,0,0,0,0,0]));g0.B=r;for(let l=1;l<GL.length;l++)GL[l].B=sb(GL[l].n);
    const{run,rd}=runner(d,S,n,all,US);
    const mvU=new Map(),mvb=(l,mode,x,bb,y,om)=>{const g=GL[l],L=g.L,w=om??(mode===3&&GL.length===1?1:g.om),key=l+'.'+mode+'.'+w;let U=mvU.get(key);if(!U)mvU.set(key,U=ub(new Uint32Array([L.NX,L.NY,L.NZ,L.nx,L.ny,L.nz,g.ke,mode,f2u(w),0,0,0,0,0,0,0])));return bg('mv',key,[U,g.K,g.sc,g.cq,x,bb,g.d,y]);};
    const tU=(f,c)=>ub(new Uint32Array([c.L.NX*c.L.NY*c.L.NZ,0,f.L.NX,f.L.NY,f.L.NZ,c.L.NX,c.L.NY,c.L.NZ])),tUp=(f,c)=>ub(new Uint32Array([f.L.NX*f.L.NY*f.L.NZ,0,f.L.NX,f.L.NY,f.L.NZ,c.L.NX,c.L.NY,c.L.NZ]));
    const rsU=GL.map((g,l)=>l+1<GL.length?tU(g,GL[l+1]):null),plU=GL.map((g,l)=>l+1<GL.length?tUp(g,GL[l+1]):null);
    const pre=[],D=(L,pipe,g,c)=>L.push([P[pipe],g,c]),nsw=opt.nsw||1,fU=[0,1,2,3].map(m=>ub(new Uint32Array([0,m,0,0]))),dU=ub(new Uint32Array([n,0,0,0])),uS=ub(new Uint32Array([n,1,0,0,0,0,0,0]));
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
    const io=async(list,inB,x,outB)=>{d.queue.writeBuffer(inB,0,Float32Array.from(x));await run(list,1);return Float64Array.from(await rd(outB));};
    await run(init,1);await run(iter,1);await pop();
    const solve=pcgLoop(d,{n,r,u,p,init,iter,run,rd,mv:opt.mv,tol:opt.tol,maxIt:opt.maxIt,multi:GL.length>1,levels:GL.length});
    return{n,levels:GL.length,solve,mv:x=>io([iter[0]],p,x,Ap),prec:x=>io(pre,r,x,z),free};
  }catch(e){if(!popped){d.popErrorScope().catch(()=>{});d.popErrorScope().catch(()=>{});}free();throw e;}
}
export async function gpuSolve(Ls,K,b,opt={},prog){const c=await gpuContext(Ls,K,opt);if(!c)return null;try{return await c.solve(b,prog);}finally{c.free();}}
export async function gpuAMG(H,b,opt={},prog){
  const d=await gpuDevice();if(!d)return null;
  d.pushErrorScope('out-of-memory');d.pushErrorScope('validation');let popped=false;const pop=async()=>{popped=true;const a=await d.popErrorScope(),c=await d.popErrorScope();if(a||c)throw new Error('WebGPU: '+(a||c).message);};
  const kt=kit(d),{all,US,sb,ub,bg,free}=kt,P=kt.P=pipesOf(d);
  try{
    const f32=a=>Float32Array.from(a),u32=a=>Uint32Array.from(a),nL=H.length,C=H[nL-1],GL=H.map((L,l)=>{const n=L.A.n*L.A.rb,g={L,n,x:sb(n),b:l?sb(n):null,t1:sb(n),t4:sb(n),d:sb(n),w:wg(Math.ceil(n/64))};if(l<nL-1){g.A={rp:sb(u32(L.A.rp)),ci:sb(u32(L.A.ci)),v:sb(f32(L.A.v)),n:L.A.n,rb:L.A.rb,cb:L.A.cb};g.P={rp:sb(u32(L.P.rp)),ci:sb(u32(L.P.ci)),v:sb(f32(L.P.v)),n:L.P.n,rb:L.P.rb,cb:L.P.cb};g.R={rp:sb(u32(L.R.rp)),ci:sb(u32(L.R.ci)),v:sb(f32(L.R.v)),n:L.R.n,rb:L.R.rb,cb:L.R.cb};g.D=sb(f32(L.Ds));}return g;});
    const g0=GL[0],n=g0.n,r=sb(n),p=sb(n),Ap=sb(n),u=sb(n),S=sb(8),part=sb(512),wD=wg(Math.ceil(n/64)),uE=ub(new Uint32Array([n,0,0,0,0,0,0,0])),Mi=sb(f32(H.cinv)),uM=ub(new Uint32Array([C.N,0,0,0]));g0.b=r;g0.A0=g0.A;
    const{run,rd}=runner(d,S,n,all,US);
    const uB=new Map(),bu=(M,mode)=>{const k=M.n+'.'+M.rb+'.'+M.cb+'.'+mode;let U=uB.get(k);if(!U)uB.set(k,U=ub(new Uint32Array([M.n,M.rb,M.cb,mode])));return U;},D=(L,pipe,g,c)=>L.push([P[pipe],g,c]);
    const spmv=(list,M,x,bb,y,mode,key)=>D(list,'bsr',bg('bsr',key+'.'+mode,[bu(M,mode),M.rp,M.ci,M.v,x,bb||x,y]),wg(Math.ceil(M.n/64)));
    const uC=new Map(),cu=(n2,sbz,asg,c1,c2)=>{const k=[n2,sbz,asg,c1,c2].join(',');let U=uC.get(k);if(!U){const a=new ArrayBuffer(32),iv=new Uint32Array(a),fv=new Float32Array(a);iv[0]=n2;iv[1]=sbz;iv[2]=asg;fv[4]=c1;fv[5]=c2;uC.set(k,U=ub(new Uint8Array(a)));}return U;};
    const cheb=(list,l,bb,post)=>{const g=GL[l],L=g.L,deg=l?H.cdeg:H.deg,lmax=L.lmax*1.1,lmin=lmax/30,th=(lmax+lmin)/2,de=(lmax-lmin)/2,sg=th/de;let rho=1/sg;
      const step=(c1,c2,asg,rr)=>D(list,'chb',bg('chb',l+':'+c1+':'+c2+':'+asg,[cu(g.n,L.sb,asg,c1,c2),g.D,rr,g.d,g.x]),g.w);
      if(post){spmv(list,g.A,g.x,bb,g.t1,1,'A'+l);step(0,1/th,0,g.t1);}else step(0,1/th,1,bb);
      for(let k=1;k<deg;k++){spmv(list,g.A,g.x,bb,g.t1,1,'A'+l);const r1=1/(2*sg-rho);step(r1*rho,2*r1/de,0,g.t1);rho=r1;}};
    const vc=(list,l,bb)=>{const g=GL[l];if(l===nL-1){D(list,'dmv',bg('dmv','c',[uM,Mi,bb,g.x]),g.w);return;}const c=GL[l+1];cheb(list,l,bb,false);
      for(let k=0;k<(l?H.gamma:1);k++){spmv(list,g.A,g.x,bb,g.t4,1,'A'+l);spmv(list,g.R,g.t4,null,c.b,0,'R'+l);vc(list,l+1,c.b);spmv(list,g.P,c.x,null,g.x,2,'P'+l);}cheb(list,l,bb,true);};
    const pre=[];vc(pre,0,r);const z=g0.x;
    const fU=[0,1,2,3].map(m=>ub(new Uint32Array([0,m,0,0]))),dU=ub(new Uint32Array([n,0,0,0])),init=[...pre],iter=[];
    D(init,'dot',bg('dot','rz',[dU,r,z,part]),[256]);D(init,'fin',bg('fin','f2',[fU[2],part,S]),[1]);D(init,'pu',bg('pu','pu',[uE,S,z,p]),wD);
    spmv(iter,g0.A0,p,null,Ap,0,'A0x');D(iter,'dot',bg('dot','pa',[dU,p,Ap,part]),[256]);D(iter,'fin',bg('fin','f0',[fU[0],part,S]),[1]);D(iter,'axpy',bg('axpy','ax',[uE,S,p,Ap,u,r]),wD);iter.push(...pre);D(iter,'dot',bg('dot','rz',[dU,r,z,part]),[256]);D(iter,'fin',bg('fin','f1',[fU[1],part,S]),[1]);D(iter,'pu',bg('pu','pu',[uE,S,z,p]),wD);
    await run(init,1);await pop();
    const tol=opt.tol||1e-8,maxIt=opt.maxIt||3000,CH=10,fn=Math.sqrt(b.reduce((a,v)=>a+v*v,0))||1,U=new Float64Array(n),y=new Float64Array(n),t0=Date.now(),hist=[];let rhs=b,rel=1,its=0,outer=0;
    for(;outer<8;outer++){
      const fr=Math.sqrt(rhs.reduce((a,v)=>a+v*v,0))||1,sc=1/fr,itol=Math.max(1e-5,Math.min(1e-2,tol*fn/fr*0.5));d.queue.writeBuffer(r,0,Float32Array.from(rhs,v=>v*sc));const e=d.createCommandEncoder();e.clearBuffer(u);e.clearBuffer(p);d.queue.submit([e.finish()]);
      let s=await run(init,1),it=0,best=Infinity,stall=0,ir=Math.sqrt(s[4]);
      while(it<maxIt&&ir>itol){s=await run(iter,CH);it+=CH;ir=Math.sqrt(Math.max(s[4],0));if(prog)prog(its+it,ir*fr/fn,'gpu');if(s[5]>0||!isFinite(ir))break;ir<best*0.7?(best=ir,stall=0):stall++;if(stall>=8)break;}
      its+=it;const v=await rd(u);let cn=0,un=0;for(let i=0;i<n;i++){const dv=isFinite(v[i])?v[i]*fr:0;U[i]+=dv;cn+=dv*dv;un+=U[i]*U[i];}opt.mv(U,y);const res=new Float64Array(n);for(let i=0;i<n;i++)res[i]=b[i]-y[i];rel=Math.sqrt(res.reduce((a,q)=>a+q*q,0))/fn;hist.push({it,ir,rel,dU:Math.sqrt(cn/(un||1))});
      if(rel<tol)break;if(outer>1&&!(rel<hist[outer-1].rel*0.9))break;rhs=res;}
    if(!(rel<Math.max(tol*100,1e-5)))throw new Error('GPU solver did not converge (residual '+rel.toExponential(1)+')');
    return{u:U,iters:its,rel,outer:outer+1,hist,gpuMs:Date.now()-t0,levels:nL};
  }catch(e){if(!popped){d.popErrorScope().catch(()=>{});d.popErrorScope().catch(()=>{});}throw e;}finally{free();}
}
export async function gpuCsr(rp,ci,va,diag,opt={}){const d=await gpuDevice();if(!d)return null;const n=diag.length,kt=kit(d),{all,US,sb,ub,bg,free}=kt;d.pushErrorScope('out-of-memory');d.pushErrorScope('validation');let popped=false;
  try{const P=kt.P=pipesOf(d),D=(L,pipe,g,c)=>L.push([P[pipe],g,c]),wD=wg(Math.ceil(n/64)),rpB=sb(Uint32Array.from(rp)),ciB=sb(Uint32Array.from(ci)),vaB=sb(Float32Array.from(va)),di=sb(Float32Array.from(diag,v=>v?1/v:0)),r=sb(n),z=sb(n),p=sb(n),Ap=sb(n),u=sb(n),S=sb(8),part=sb(512),uE=ub(new Uint32Array([n,0,0,0,0,0,0,0])),dU=ub(new Uint32Array([n,0,0,0])),fU=[0,1,2].map(m=>ub(new Uint32Array([0,m,0,0])));
    const{run,rd}=runner(d,S,n,all,US),pre=[],init=[],iter=[];D(pre,'jac',bg('jac','j',[uE,di,r,z]),wD);
    init.push(...pre);D(init,'dot',bg('dot','rz',[dU,r,z,part]),[256]);D(init,'fin',bg('fin','f2',[fU[2],part,S]),[1]);D(init,'pu',bg('pu','pu',[uE,S,z,p]),wD);
    D(iter,'csr',bg('csr','mv',[uE,rpB,ciB,vaB,p,Ap]),wD);D(iter,'dot',bg('dot','pa',[dU,p,Ap,part]),[256]);D(iter,'fin',bg('fin','f0',[fU[0],part,S]),[1]);D(iter,'axpy',bg('axpy','ax',[uE,S,p,Ap,u,r]),wD);iter.push(...pre);D(iter,'dot',bg('dot','rz',[dU,r,z,part]),[256]);D(iter,'fin',bg('fin','f1',[fU[1],part,S]),[1]);D(iter,'pu',bg('pu','pu',[uE,S,z,p]),wD);
    await run(init,1);popped=true;const a=await d.popErrorScope(),c2=await d.popErrorScope();if(a||c2)throw new Error('WebGPU: '+(a||c2).message);
    const mv=(x,y)=>{for(let i=0;i<n;i++){let s2=0;for(let k=rp[i];k<rp[i+1];k++)s2+=va[k]*x[ci[k]];y[i]=s2;}};
    return{n,solve:pcgLoop(d,{n,r,u,p,init,iter,run,rd,mv,tol:opt.tol,maxIt:opt.maxIt,multi:false,levels:1}),free};
  }catch(e){if(!popped){d.popErrorScope().catch(()=>{});d.popErrorScope().catch(()=>{});}free();throw e;}}
