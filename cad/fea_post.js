const ND=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const GP=1/Math.sqrt(3);
const dN=(xi,et,ze)=>{const g=new Float64Array(24);for(let i=0;i<8;i++){const a=ND[i][0],b=ND[i][1],c=ND[i][2];g[3*i]=a*(1+b*et)*(1+c*ze)/8;g[3*i+1]=b*(1+a*xi)*(1+c*ze)/8;g[3*i+2]=c*(1+a*xi)*(1+b*et)/8;}return g;};
function inv3(J){const a=J[0],b=J[1],c=J[2],d=J[3],e=J[4],f=J[5],g=J[6],h=J[7],i=J[8],A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,det=a*A+b*B+c*C;if(!(Math.abs(det)>1e-18))return null;const s=1/det;return{det,m:[A*s,(c*h-b*i)*s,(b*f-c*e)*s,B*s,(a*i-c*g)*s,(c*d-a*f)*s,C*s,(b*g-a*h)*s,(a*e-b*d)*s]};}
function frame(X,nd,xi,et,ze){
  const g=dN(xi,et,ze),J=new Float64Array(9);
  for(let i=0;i<8;i++){const x=X[3*nd[i]],y=X[3*nd[i]+1],z=X[3*nd[i]+2],dx=g[3*i],dy=g[3*i+1],dz=g[3*i+2];J[0]+=dx*x;J[1]+=dy*x;J[2]+=dz*x;J[3]+=dx*y;J[4]+=dy*y;J[5]+=dz*y;J[6]+=dx*z;J[7]+=dy*z;J[8]+=dz*z;}
  const I=inv3(J);if(!I)return null;
  const G=new Float64Array(24);
  for(let i=0;i<8;i++){const dx=g[3*i],dy=g[3*i+1],dz=g[3*i+2];G[3*i]=I.m[0]*dx+I.m[1]*dy+I.m[2]*dz;G[3*i+1]=I.m[3]*dx+I.m[4]*dy+I.m[5]*dz;G[3*i+2]=I.m[6]*dx+I.m[7]*dy+I.m[8]*dz;}
  return{G,det:I.det};
}
function Dmul(E,nu,ev){const lam=E*nu/((1+nu)*(1-2*nu)),mu=E/(2*(1+nu)),tr=ev[0]+ev[1]+ev[2];return[lam*tr+2*mu*ev[0],lam*tr+2*mu*ev[1],lam*tr+2*mu*ev[2],mu*ev[3],mu*ev[4],mu*ev[5]];}
function strainAt(fr,ue){const e=[0,0,0,0,0,0],G=fr.G;for(let a=0;a<8;a++){const gx=G[3*a],gy=G[3*a+1],gz=G[3*a+2],ux=ue[3*a],uy=ue[3*a+1],uz=ue[3*a+2];e[0]+=gx*ux;e[1]+=gy*uy;e[2]+=gz*uz;e[3]+=gy*ux+gx*uy;e[4]+=gz*uy+gy*uz;e[5]+=gz*ux+gx*uz;}return e;}
export function principals(s){
  const xx=s[0],yy=s[1],zz=s[2],xy=s[3],yz=s[4],zx=s[5],q=(xx+yy+zz)/3,p1=xy*xy+yz*yz+zx*zx;
  if(p1<1e-18*(xx*xx+yy*yy+zz*zz+1)){const p=[xx,yy,zz].sort((a,b)=>b-a);return finish(p,s);}
  const p2=(xx-q)**2+(yy-q)**2+(zz-q)**2+2*p1,p=Math.sqrt(p2/6)||1e-30,B11=(xx-q)/p,B22=(yy-q)/p,B33=(zz-q)/p,B12=xy/p,B23=yz/p,B13=zx/p;
  let r=(B11*B22*B33+2*B12*B23*B13-B11*B23*B23-B22*B13*B13-B33*B12*B12)/2;r=Math.max(-1,Math.min(1,r));
  const phi=Math.acos(r)/3,pA=q+2*p*Math.cos(phi),pC=q+2*p*Math.cos(phi+2*Math.PI/3),pB=3*q-pA-pC;
  return finish([pA,pB,pC].sort((a,b)=>b-a),s);
}
function finish(p,s){const vm=Math.sqrt(Math.max(0,0.5*((s[0]-s[1])**2+(s[1]-s[2])**2+(s[2]-s[0])**2)+3*(s[3]**2+s[4]**2+s[5]**2)));return{p1:p[0],p2:p[1],p3:p[2],vm,tresca:p[0]-p[2]};}
export function strainOf(s,E,nu){const e=(a,b,c)=>(a-nu*(b+c))/E,g=t=>2*(1+nu)*t/E;return[e(s[0],s[1],s[2]),e(s[1],s[0],s[2]),e(s[2],s[0],s[1]),g(s[3]),g(s[4]),g(s[5])];}
function readU(u,nd,ue){for(let a=0;a<8;a++){const n=nd[a];ue[3*a]=u[3*n];ue[3*a+1]=u[3*n+1];ue[3*a+2]=u[3*n+2];}}
export function hexStress(X,Econn,u,Emod,nu,sc){
  const ne=Econn.length/8,nn=X.length/3,elem=new Float64Array(ne*6),node=new Float64Array(nn*6),una=new Float64Array(nn*6),cnt=new Uint16Array(nn),ue=new Float64Array(24),acc=new Float64Array(6);
  let p1Max=-Infinity,p3Min=Infinity,trMax=0,vmMax=0;
  for(let e=0;e<ne;e++){
    const nd=[0,1,2,3,4,5,6,7].map(a=>Econn[8*e+a]);readU(u,nd,ue);const sg=new Float64Array(48);acc.fill(0);
    if(!sc)for(let g=0;g<8;g++){const fr=frame(X,nd,ND[g][0]*GP,ND[g][1]*GP,ND[g][2]*GP);if(!fr)continue;const ev=strainAt(fr,ue),sgv=Dmul(Emod,nu,ev);for(let c=0;c<6;c++){sg[6*g+c]=sgv[c];acc[c]+=sgv[c];}}
    for(let a=0;a<8;a++){const xi=ND[a][0]/GP,et=ND[a][1]/GP,ze=ND[a][2]/GP,s=sc?Array.from(sc.subarray(48*e+6*a,48*e+6*a+6)):[0,0,0,0,0,0];
      if(!sc)for(let g=0;g<8;g++){const w=(1+ND[g][0]*xi)*(1+ND[g][1]*et)*(1+ND[g][2]*ze)/8;for(let c=0;c<6;c++)s[c]+=w*sg[6*g+c];}else for(let c=0;c<6;c++)acc[c]+=s[c];
      const n=nd[a],q=principals(s);p1Max=Math.max(p1Max,q.p1);p3Min=Math.min(p3Min,q.p3);trMax=Math.max(trMax,q.tresca);vmMax=Math.max(vmMax,q.vm);
      for(let c=0;c<6;c++){node[6*n+c]+=s[c];if(q.vm>=(una[6*n]||0))una[6*n+c]=s[c];}cnt[n]++;}
    for(let c=0;c<6;c++)elem[6*e+c]=acc[c]/8;
  }
  for(let n=0;n<nn;n++)if(cnt[n])for(let c=0;c<6;c++)node[6*n+c]/=cnt[n];
  return{elem,node,una,cnt,p1Max,p3Min,trMax,vmMax};
}
export function measuresAt(sig,n){return principals(sig.subarray?sig.subarray(6*n,6*n+6):sig.slice(6*n,6*n+6));}
export function thermalForce(X,Econn,T,Emod,nu,alpha,Tref){
  const f=new Float64Array(X.length),ne=Econn.length/8,ue=new Float64Array(24);
  for(let e=0;e<ne;e++){
    const nd=[0,1,2,3,4,5,6,7].map(a=>Econn[8*e+a]);let Te=0;for(const n of nd)Te+=T[n]||0;Te/=8;const eth=alpha*(Te-(Tref||0));if(!eth)continue;
    const sig=Dmul(Emod,nu,[eth,eth,eth,0,0,0]);
    for(let g=0;g<8;g++){const fr=frame(X,nd,ND[g][0]*GP,ND[g][1]*GP,ND[g][2]*GP);if(!fr)continue;const w=Math.abs(fr.det);
      for(let a=0;a<8;a++){const gx=fr.G[3*a],gy=fr.G[3*a+1],gz=fr.G[3*a+2];
        const fx=(gx*sig[0]+gy*sig[3]+gz*sig[5])*w,fy=(gy*sig[1]+gx*sig[3]+gz*sig[4])*w,fz=(gz*sig[2]+gy*sig[4]+gx*sig[5])*w;
        f[3*nd[a]]+=fx;f[3*nd[a]+1]+=fy;f[3*nd[a]+2]+=fz;}}
  }
  return f;
}
export function kgMul(X,Econn,elemSig,x){
  const f=new Float64Array(x.length),ne=Econn.length/8;
  for(let e=0;e<ne;e++){
    const nd=[0,1,2,3,4,5,6,7].map(a=>Econn[8*e+a]),o=6*e,s00=elemSig[o],s11=elemSig[o+1],s22=elemSig[o+2],s01=elemSig[o+3],s12=elemSig[o+4],s02=elemSig[o+5];
    for(let g=0;g<8;g++){const fr=frame(X,nd,ND[g][0]*GP,ND[g][1]*GP,ND[g][2]*GP);if(!fr)continue;const w=Math.abs(fr.det),G=fr.G;
      for(let a=0;a<8;a++){const gax=G[3*a],gay=G[3*a+1],gaz=G[3*a+2];
        const sx=s00*gax+s01*gay+s02*gaz,sy=s01*gax+s11*gay+s12*gaz,sz=s02*gax+s12*gay+s22*gaz;
        for(let b=0;b<8;b++){const kg=(sx*G[3*b]+sy*G[3*b+1]+sz*G[3*b+2])*w;if(!kg)continue;const ia=3*nd[a],ib=3*nd[b];f[ia]+=kg*x[ib];f[ia+1]+=kg*x[ib+1];f[ia+2]+=kg*x[ib+2];}}}
  }
  return f;
}
function nearest(X,x,y,z,rad){
  const nn=X.length/3,r2=(rad||Infinity)**2;let best=-1,bd=r2,list=[];
  for(let n=0;n<nn;n++){const d=(X[3*n]-x)**2+(X[3*n+1]-y)**2+(X[3*n+2]-z)**2;if(d<bd){bd=d;best=n;}if(rad&&d<=r2)list.push([n,d]);}
  return{best,d:Math.sqrt(bd),list};
}
export function probe(X,fields,pts,rad,one){
  return (pts||[]).map(p=>{const q=nearest(X,p[0],p[1],p[2],rad),out={x:p[0],y:p[1],z:p[2],node:q.best,dist:q.d};if(q.best<0)return out;
    const use=!one&&q.list&&q.list.length?q.list:[[q.best,0]];let sw=0;const acc={};
    for(const[n,d] of use){const w=1/Math.max(Math.sqrt(d),1e-6);sw+=w;for(const k in fields){const a=fields[k],st=a.stride||1,s=acc[k]||(acc[k]=new Float64Array(st));for(let c=0;c<st;c++)s[c]+=w*a.data[n*st+c];}}
    for(const k in acc){const s=acc[k];for(let c=0;c<s.length;c++)s[c]/=sw;out[k]=s.length===1?s[0]:Array.from(s);}
    return out;});
}
export function pathPlot(X,fields,a,b,n,rad,inset){
  const N=Math.max(2,n||21),pts=[],d=inset||[0,0,0];
  for(let i=0;i<N;i++){const t=i/(N-1),p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],s=probe(X,fields,[p],rad,1)[0],q=probe(X,fields,[[p[0]+d[0],p[1]+d[1],p[2]+d[2]]],rad,1)[0],inner=q&&q.vm!=null?q.vm:s.vm;pts.push({...s,vm:s.vm+0.5*(s.vm-inner)});}
  return pts;
}
export function skinOfField(nodes,arr,stride){const o=new Float32Array(nodes.length*stride);nodes.forEach((n,i)=>{for(let c=0;c<stride;c++)o[i*stride+c]=arr[n*stride+c];});return o;}
