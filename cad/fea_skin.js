const FQ=[[0,2,6,4],[1,3,7,5],[0,1,5,4],[2,3,7,6],[0,1,3,2],[4,5,7,6]];
export function voxSkin(nx,ny,nz,solid,xyz){
  const NX=nx+1,NY=ny+1,re=new Map(),nodes=[],idx=[],at=(i,j,k)=>i<0||j<0||k<0||i>=nx||j>=ny||k>=nz?0:solid[(k*ny+j)*nx+i],id=n=>{let r=re.get(n);if(r===undefined){r=nodes.length;re.set(n,r);nodes.push(n);}return r;};
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){if(!solid[(k*ny+j)*nx+i])continue;const nb=[at(i-1,j,k),at(i+1,j,k),at(i,j-1,k),at(i,j+1,k),at(i,j,k-1),at(i,j,k+1)];
    for(let f=0;f<6;f++){if(nb[f])continue;const q=FQ[f].map(c=>id(((k+(c>>2))*NY+j+((c>>1)&1))*NX+i+(c&1)));idx.push(q[0],q[1],q[2],q[0],q[2],q[3]);}}
  const pos=new Float32Array(3*nodes.length);nodes.forEach((n,i)=>pos.set(xyz(n),3*i));
  return{nodes:Int32Array.from(nodes),pos,idx:Uint32Array.from(idx)};
}
export function wireOf(sk){const I=sk.idx,N=sk.pos.length/3,seen=new Set(),seg=[];for(let t=0;t+5<I.length;t+=6){const q=[I[t],I[t+1],I[t+2],I[t+5]];for(let e=0;e<4;e++){const a=q[e],b=q[(e+1)%4],k=a<b?a*N+b:b*N+a;if(!seen.has(k)){seen.add(k);seg.push(a,b);}}}return Uint32Array.from(seg);}
export const skinU=(sk,u)=>{const o=new Float32Array(3*sk.nodes.length);sk.nodes.forEach((n,i)=>{o[3*i]=u[3*n];o[3*i+1]=u[3*n+1];o[3*i+2]=u[3*n+2];});return o;};
