import {KCOND,runFEA,lobpcg,rigidModes} from './fea.js';
import {meshSolid,HEX_FACES,HEX_NODES,surfOf,closest,thicknessStats,detectSheet} from './mesh.js';
import {gpuAMG} from './fea_gpu.js';
const G3=1/Math.sqrt(3),HN=HEX_NODES,GQ=HN.map(n=>n.map(v=>v*G3)),DN=new Float64Array(192),NG=new Float64Array(64),EXT=new Float64Array(64),GB=new Float64Array(264),WB=new Float64Array(8),KF=new Float64Array(1089),YB=new Float64Array(216),LB=new Float64Array(81);
for(let g=0;g<8;g++){const[x,y,z]=GQ[g];for(let a=0;a<8;a++){const[p,q,r]=HN[a];DN[g*24+3*a]=p*(1+q*y)*(1+r*z)/8;DN[g*24+3*a+1]=q*(1+p*x)*(1+r*z)/8;DN[g*24+3*a+2]=r*(1+p*x)*(1+q*y)/8;NG[g*8+a]=(1+p*x)*(1+q*y)*(1+r*z)/8;}}
for(let a=0;a<8;a++)for(let g=0;g<8;g++){let w=1;for(let k=0;k<3;k++)w*=(1+HN[g][k]*HN[a][k]*Math.sqrt(3))/2;EXT[a*8+g]=w;}
function grads(x,nm){
  let a00=0,a01=0,a02=0,a10=0,a11=0,a12=0,a20=0,a21=0,a22=0;for(let a=0;a<8;a++){const[p,q,r]=HN[a],X=x[3*a]/8,Y=x[3*a+1]/8,Z=x[3*a+2]/8;a00+=X*p;a01+=X*q;a02+=X*r;a10+=Y*p;a11+=Y*q;a12+=Y*r;a20+=Z*p;a21+=Z*q;a22+=Z*r;}
  const d0=a00*(a11*a22-a12*a21)-a01*(a10*a22-a12*a20)+a02*(a10*a21-a11*a20),I0=[(a11*a22-a12*a21)/d0,(a02*a21-a01*a22)/d0,(a01*a12-a02*a11)/d0,(a12*a20-a10*a22)/d0,(a00*a22-a02*a20)/d0,(a02*a10-a00*a12)/d0,(a10*a21-a11*a20)/d0,(a01*a20-a00*a21)/d0,(a00*a11-a01*a10)/d0];let dmin=Infinity;
  for(let g=0;g<8;g++){let j00=0,j01=0,j02=0,j10=0,j11=0,j12=0,j20=0,j21=0,j22=0;const o=g*24;for(let a=0;a<8;a++){const p=DN[o+3*a],q=DN[o+3*a+1],r=DN[o+3*a+2],X=x[3*a],Y=x[3*a+1],Z=x[3*a+2];j00+=X*p;j01+=X*q;j02+=X*r;j10+=Y*p;j11+=Y*q;j12+=Y*r;j20+=Z*p;j21+=Z*q;j22+=Z*r;}
    const d=j00*(j11*j22-j12*j21)-j01*(j10*j22-j12*j20)+j02*(j10*j21-j11*j20),b00=(j11*j22-j12*j21)/d,b01=(j02*j21-j01*j22)/d,b02=(j01*j12-j02*j11)/d,b10=(j12*j20-j10*j22)/d,b11=(j00*j22-j02*j20)/d,b12=(j02*j10-j00*j12)/d,b20=(j10*j21-j11*j20)/d,b21=(j01*j20-j00*j21)/d,b22=(j00*j11-j01*j10)/d,go=g*33;
    for(let a=0;a<8;a++){const p=DN[o+3*a],q=DN[o+3*a+1],r=DN[o+3*a+2];GB[go+3*a]=p*b00+q*b10+r*b20;GB[go+3*a+1]=p*b01+q*b11+r*b21;GB[go+3*a+2]=p*b02+q*b12+r*b22;}
    for(let m=0;m<3;m++){const c=nm?-2*GQ[g][m]*d0/d:0;GB[go+24+3*m]=c*I0[3*m];GB[go+25+3*m]=c*I0[3*m+1];GB[go+26+3*m]=c*I0[3*m+2];}
    WB[g]=d;if(d<dmin)dmin=d;}
  return dmin;
}
const BB=new Float64Array(1584),TY=new Float64Array(384),DQ=new Float64Array(24),GC=new Float64Array(9),DBb=new Float64Array(198);
function dNat(xi,et,ze,o){for(let a=0;a<8;a++){const[p,q,r]=HN[a];o[3*a]=p*(1+q*et)*(1+r*ze)/8;o[3*a+1]=q*(1+p*xi)*(1+r*ze)/8;o[3*a+2]=r*(1+p*xi)*(1+q*et)/8;}return o;}
function gcov(x,d,g){g.fill(0);for(let a=0;a<8;a++)for(let i=0;i<3;i++){const w=d[3*a+i];g[3*i]+=w*x[3*a];g[3*i+1]+=w*x[3*a+1];g[3*i+2]+=w*x[3*a+2];}return g;}
const TYP=[[0,-1,0],[0,1,0],[-1,0,1],[1,0,1],[-1,-1,2],[1,-1,2],[1,1,2],[-1,1,2]],CV=[[0,0],[1,1],[2,2],[0,1],[1,2],[2,0]],CO=[[0,0],[1,1],[2,2],[0,1],[1,2],[0,2]];
function bmat(x,shell){
  const dm=grads(x,true);BB.fill(0);
  for(let g=0;g<8;g++){const o=g*198,go=g*33;for(let p=0;p<11;p++){const gx=GB[go+3*p],gy=GB[go+3*p+1],gz=GB[go+3*p+2],c=3*p;BB[o+c]=gx;BB[o+34+c]=gy;BB[o+68+c]=gz;BB[o+99+c]=gy;BB[o+100+c]=gx;BB[o+133+c]=gz;BB[o+134+c]=gy;BB[o+165+c]=gz;BB[o+167+c]=gx;}}
  if(!shell)return dm;
  for(let s=0;s<2;s++){const ze=s?G3:-G3;TYP.forEach(([xi,et,k],slot)=>{dNat(xi,et,ze,DQ);gcov(x,DQ,GC);const o=(s*8+slot)*24;for(let a=0;a<8;a++)for(let c=0;c<3;c++)TY[o+3*a+c]=k===0?GC[c]*DQ[3*a+2]+GC[6+c]*DQ[3*a]:k===1?GC[3+c]*DQ[3*a+2]+GC[6+c]*DQ[3*a+1]:GC[6+c]*DQ[3*a+2];});}
  const Bc=new Float64Array(144),Tm=new Float64Array(36);
  for(let g=0;g<8;g++){const[xi,et,ze]=GQ[g],s=ze>0?1:0,d=DN.subarray(g*24,g*24+24);gcov(x,d,GC);const g1=[GC[0],GC[1],GC[2]],g2=[GC[3],GC[4],GC[5]],g3=[GC[6],GC[7],GC[8]],det=g1[0]*(g2[1]*g3[2]-g2[2]*g3[1])-g2[0]*(g1[1]*g3[2]-g1[2]*g3[1])+g3[0]*(g1[1]*g2[2]-g1[2]*g2[1]),cr=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],a=[cr(g2,g3),cr(g3,g1),cr(g1,g2)].map(v=>v.map(q=>q/det));
    for(let q=0;q<8;q++)for(let c=0;c<3;c++){const k=3*q+c,T=(sl)=>TY[(s*8+sl)*24+k];Bc[k]=g1[c]*d[3*q];Bc[24+k]=g2[c]*d[3*q+1];Bc[72+k]=g1[c]*d[3*q+1]+g2[c]*d[3*q];Bc[120+k]=0.5*(1-et)*T(0)+0.5*(1+et)*T(1);Bc[96+k]=0.5*(1-xi)*T(2)+0.5*(1+xi)*T(3);Bc[48+k]=0.25*((1-xi)*(1-et)*T(4)+(1+xi)*(1-et)*T(5)+(1+xi)*(1+et)*T(6)+(1-xi)*(1+et)*T(7));}
    for(let R=0;R<6;R++){const[k,l]=CV[R],sc=k===l?1:2;for(let S=0;S<6;S++){const[i,j]=CO[S];Tm[6*R+S]=sc*(i===j?a[i][k]*a[i][l]:(a[i][k]*a[j][l]+a[j][k]*a[i][l])/2);}}
    const o=g*198;for(let R=0;R<6;R++)for(let k=0;k<24;k++){let v=0;for(let S=0;S<6;S++)v+=Tm[6*R+S]*Bc[24*S+k];BB[o+33*R+k]=v;}}
  return dm;
}
function kfull(x,lam,mu,shell){
  const dm=bmat(x,shell);KF.fill(0);
  for(let g=0;g<8;g++){const w=WB[g],o=g*198;for(let p=0;p<33;p++){const b0=BB[o+p],b1=BB[o+33+p],b2=BB[o+66+p],tr=lam*(b0+b1+b2);DBb[p]=w*(2*mu*b0+tr);DBb[33+p]=w*(2*mu*b1+tr);DBb[66+p]=w*(2*mu*b2+tr);DBb[99+p]=w*mu*BB[o+99+p];DBb[132+p]=w*mu*BB[o+132+p];DBb[165+p]=w*mu*BB[o+165+p];}
    for(let p=0;p<33;p++){const r0=BB[o+p],r1=BB[o+33+p],r2=BB[o+66+p],r3=BB[o+99+p],r4=BB[o+132+p],r5=BB[o+165+p];if(!(r0||r1||r2||r3||r4||r5))continue;for(let q=p;q<33;q++)KF[p*33+q]+=r0*DBb[q]+r1*DBb[33+q]+r2*DBb[66+q]+r3*DBb[99+q]+r4*DBb[132+q]+r5*DBb[165+q];}}
  for(let p=0;p<33;p++)for(let q=p+1;q<33;q++)KF[q*33+p]=KF[p*33+q];
  for(let i=0;i<9;i++)for(let j=0;j<9;j++)LB[9*i+j]=KF[(24+i)*33+24+j];chol(LB,9);
  for(let j=0;j<24;j++){for(let m=0;m<9;m++)YB[m*24+j]=KF[(24+m)*33+j];}cholSolveCols(LB,9,YB,24);
  return dm;
}
export function isThin(x){dNat(0,0,0,DQ);gcov(x,DQ,GC);const l1=Math.hypot(GC[0],GC[1],GC[2]),l2=Math.hypot(GC[3],GC[4],GC[5]),l3=Math.hypot(GC[6],GC[7],GC[8]);return l3<0.6*Math.min(l1,l2);}
function chol(A,n){for(let j=0;j<n;j++){let s=A[j*n+j];for(let k=0;k<j;k++)s-=A[j*n+k]*A[j*n+k];const d=s>1e-300?Math.sqrt(s):1e-150;A[j*n+j]=d;for(let i=j+1;i<n;i++){let t=A[i*n+j];for(let k=0;k<j;k++)t-=A[i*n+k]*A[j*n+k];A[i*n+j]=t/d;}}}
function cholSolveCols(Lm,n,Y,m){for(let c=0;c<m;c++){for(let i=0;i<n;i++){let s=Y[i*m+c];for(let k=0;k<i;k++)s-=Lm[i*n+k]*Y[k*m+c];Y[i*m+c]=s/Lm[i*n+i];}for(let i=n-1;i>=0;i--){let s=Y[i*m+c];for(let k=i+1;k<n;k++)s-=Lm[k*n+i]*Y[k*m+c];Y[i*m+c]=s/Lm[i*n+i];}}}
export function keQM6(x,lam,mu,K,shell){const dm=kfull(x,lam,mu,shell);for(let i=0;i<24;i++)for(let j=0;j<24;j++){let s=KF[i*33+j];for(let m=0;m<9;m++)s-=KF[i*33+24+m]*YB[m*24+j];K[i*24+j]=s;}for(let i=0;i<24;i++)for(let j=0;j<i;j++){const v=(K[i*24+j]+K[j*24+i])/2;K[i*24+j]=K[j*24+i]=v;}return dm;}
export function stressQM6(x,u,lam,mu,out,shell){
  kfull(x,lam,mu,shell);const q=new Float64Array(33);for(let j=0;j<24;j++)q[j]=u[j];for(let m=0;m<9;m++){let s=0;for(let j=0;j<24;j++)s+=YB[m*24+j]*u[j];q[24+m]=-s;}const sg=new Float64Array(48);
  for(let g=0;g<8;g++){const o=g*198,e=[0,0,0,0,0,0];for(let r=0;r<6;r++){let s=0;for(let p=0;p<33;p++)s+=BB[o+33*r+p]*q[p];e[r]=s;}const tr=lam*(e[0]+e[1]+e[2]);sg[6*g]=tr+2*mu*e[0];sg[6*g+1]=tr+2*mu*e[1];sg[6*g+2]=tr+2*mu*e[2];sg[6*g+3]=mu*e[3];sg[6*g+4]=mu*e[4];sg[6*g+5]=mu*e[5];}
  for(let a=0;a<8;a++)for(let c=0;c<6;c++){let s=0;for(let g=0;g<8;g++)s+=EXT[a*8+g]*sg[6*g+c];out[6*a+c]=s;}
  return sg;
}
export function keHeat8(x,k,K){const dm=grads(x,false);K.fill(0);for(let g=0;g<8;g++){const w=WB[g]*k,o=g*33;for(let a=0;a<8;a++)for(let b=a;b<8;b++){const v=w*(GB[o+3*a]*GB[o+3*b]+GB[o+3*a+1]*GB[o+3*b+1]+GB[o+3*a+2]*GB[o+3*b+2]);K[a*8+b]+=v;if(b!==a)K[b*8+a]+=v;}}return dm;}
export function nodeVol(x,out){grads(x,false);for(let a=0;a<8;a++){let s=0;for(let g=0;g<8;g++)s+=NG[g*8+a]*WB[g];out[a]=s;}return out;}
const vmOf=s=>Math.sqrt(0.5*((s[0]-s[1])**2+(s[1]-s[2])**2+(s[2]-s[0])**2)+3*(s[3]**2+s[4]**2+s[5]**2));
function masters(M){
  const nn=M.X.length/3,h=M.hang;if(!h)return null;const p=new Int32Array(nn+1),cnt=new Int32Array(nn).fill(1);for(let q=0;q<h.node.length;q++){let c=0;for(let j=0;j<4;j++)if(h.m[4*q+j]>=0)c++;cnt[h.node[q]]=c;}
  for(let i=0;i<nn;i++)p[i+1]=p[i]+cnt[i];const mi=new Int32Array(p[nn]),mw=new Float64Array(p[nn]),hq=new Int32Array(nn).fill(-1);for(let q=0;q<h.node.length;q++)hq[h.node[q]]=q;
  for(let i=0;i<nn;i++){const q=hq[i];if(q<0){mi[p[i]]=i;mw[p[i]]=1;continue;}let c=0;for(let j=0;j<4;j++)if(h.m[4*q+j]>=0){mi[p[i]+c]=h.m[4*q+j];mw[p[i]+c]=h.w[4*q+j];c++;}}
  return{p,i:mi,w:mw,hq};
}
function pattern(nn,E,cm){
  const ne=E.length/8,ms=(n,f)=>{if(!cm)return f(n,1);for(let k=cm.p[n];k<cm.p[n+1];k++)f(cm.i[k],cm.w[k]);},ec=new Int32Array(nn+1);
  for(let e=0;e<ne;e++)for(let a=0;a<8;a++)ms(E[8*e+a],m=>{ec[m+1]++;});for(let i=0;i<nn;i++)ec[i+1]+=ec[i];const el=new Int32Array(ec[nn]),fp=ec.slice(0,nn);
  for(let e=0;e<ne;e++)for(let a=0;a<8;a++)ms(E[8*e+a],m=>{el[fp[m]++]=e;});
  const mark=new Int32Array(nn).fill(-1),rp=new Int32Array(nn+1),cols=[],row=[];
  for(let i=0;i<nn;i++){row.length=0;for(let k=ec[i];k<ec[i+1];k++){const e=el[k];for(let b=0;b<8;b++)ms(E[8*e+b],m=>{if(mark[m]!==i){mark[m]=i;row.push(m);}});}if(!row.length)row.push(i);if(mark[i]!==i){row.push(i);}row.sort((x,y)=>x-y);for(const c of row)cols.push(c);rp[i+1]=cols.length;}
  return{rp,ci:Int32Array.from(cols)};
}
const find=(ci,a,b,j)=>{let lo=a,hi=b-1;while(lo<=hi){const m=(lo+hi)>>1,v=ci[m];if(v===j)return m;v<j?lo=m+1:hi=m-1;}return-1;};
function scatter(A,E,e,Ke,nd,cm,sc){
  const bb=nd*nd,m=8*nd;for(let a=0;a<8;a++){const na=E[8*e+a],ka0=cm?cm.p[na]:0,ka1=cm?cm.p[na+1]:1;for(let ia=ka0;ia<ka1;ia++){const ma=cm?cm.i[ia]:na,wa=(cm?cm.w[ia]:1)*sc,r0=A.rp[ma],r1=A.rp[ma+1];
    for(let b=0;b<8;b++){const nb=E[8*e+b],kb0=cm?cm.p[nb]:0,kb1=cm?cm.p[nb+1]:1;for(let ib=kb0;ib<kb1;ib++){const mb=cm?cm.i[ib]:nb,w=wa*(cm?cm.w[ib]:1),pos=find(A.ci,r0,r1,mb)*bb;for(let i=0;i<nd;i++)for(let j=0;j<nd;j++)A.v[pos+i*nd+j]+=w*Ke[(nd*a+i)*m+nd*b+j];}}}}
}
export function mv(A,x,y,add){
  const{n,rb,cb,rp,ci,v}=A,bb=rb*cb;
  if(rb===3&&cb===3){for(let i=0;i<n;i++){let s0=0,s1=0,s2=0;for(let k=rp[i];k<rp[i+1];k++){const j=3*ci[k],o=9*k,x0=x[j],x1=x[j+1],x2=x[j+2];s0+=v[o]*x0+v[o+1]*x1+v[o+2]*x2;s1+=v[o+3]*x0+v[o+4]*x1+v[o+5]*x2;s2+=v[o+6]*x0+v[o+7]*x1+v[o+8]*x2;}if(add){y[3*i]+=s0;y[3*i+1]+=s1;y[3*i+2]+=s2;}else{y[3*i]=s0;y[3*i+1]=s1;y[3*i+2]=s2;}}return y;}
  const s=new Float64Array(rb);for(let i=0;i<n;i++){s.fill(0);for(let k=rp[i];k<rp[i+1];k++){const j=ci[k]*cb,o=k*bb;for(let r=0;r<rb;r++){let t=0;for(let c=0;c<cb;c++)t+=v[o+r*cb+c]*x[j+c];s[r]+=t;}}for(let r=0;r<rb;r++)y[i*rb+r]=add?y[i*rb+r]+s[r]:s[r];}
  return y;
}
function transpose(A){
  const{n,m,rb,cb,rp,ci,v}=A,bb=rb*cb,c=new Int32Array(m+1);for(let k=0;k<rp[n];k++)c[ci[k]+1]++;for(let j=0;j<m;j++)c[j+1]+=c[j];const f=c.slice(0,m),ti=new Int32Array(rp[n]),tv=new Float64Array(rp[n]*bb);
  for(let i=0;i<n;i++)for(let k=rp[i];k<rp[i+1];k++){const j=ci[k],q=f[j]++;ti[q]=i;for(let r=0;r<rb;r++)for(let s=0;s<cb;s++)tv[q*bb+s*rb+r]=v[k*bb+r*cb+s];}
  return{n:m,m:n,rb:cb,cb:rb,rp:c,ci:ti,v:tv};
}
function spgemm(A,B){
  const n=A.n,ra=A.rb,ca=A.cb,cb=B.cb,ab=ra*ca,bbb=B.rb*cb,ob=ra*cb,mark=new Int32Array(B.m).fill(-1),rp=new Int32Array(n+1),CI=[],CV=[];let acc=new Float64Array(64*ob);const cols=[];
  for(let i=0;i<n;i++){cols.length=0;for(let k=A.rp[i];k<A.rp[i+1];k++){const kk=A.ci[k];for(let l=B.rp[kk];l<B.rp[kk+1];l++){const j=B.ci[l];let p=mark[j];if(p<0){p=mark[j]=cols.length;cols.push(j);if(acc.length<cols.length*ob){const t=new Float64Array(acc.length*2);t.set(acc);acc=t;}acc.fill(0,p*ob,p*ob+ob);}
    const ao=k*ab,bo=l*bbb,co=p*ob;for(let r=0;r<ra;r++)for(let q=0;q<ca;q++){const av=A.v[ao+r*ca+q];if(av===0)continue;for(let s=0;s<cb;s++)acc[co+r*cb+s]+=av*B.v[bo+q*cb+s];}}}
    const ord=cols.map((j,p)=>p).sort((x,y)=>cols[x]-cols[y]);for(const p of ord){CI.push(cols[p]);for(let t=0;t<ob;t++)CV.push(acc[p*ob+t]);mark[cols[p]]=-1;}rp[i+1]=CI.length;}
  return{n,m:B.m,rb:ra,cb,rp,ci:Int32Array.from(CI),v:Float64Array.from(CV)};
}
function rap(P,A,R){
  const m=P.m,nb=P.cb,bs=P.rb,bc=nb*nb,mark=new Int32Array(m).fill(-1),rp=new Int32Array(m+1),CI=[];
  for(let K=0;K<m;K++){const st=CI.length;for(let q=R.rp[K];q<R.rp[K+1];q++){const i=R.ci[q];for(let k=A.rp[i];k<A.rp[i+1];k++){const kk=A.ci[k];for(let l=P.rp[kk];l<P.rp[kk+1];l++){const J=P.ci[l];if(mark[J]!==K){mark[J]=K;CI.push(J);}}}}const sub=CI.slice(st).sort((x,y)=>x-y);for(let t=0;t<sub.length;t++)CI[st+t]=sub[t];rp[K+1]=CI.length;}
  const ci=Int32Array.from(CI),v=new Float64Array(ci.length*bc),pm=new Int32Array(m).fill(-1),cols=[],ob=bs*nb;let acc=new Float64Array(64*ob);
  for(let i=0;i<P.n;i++){if(P.rp[i]===P.rp[i+1])continue;cols.length=0;for(let k=A.rp[i];k<A.rp[i+1];k++){const kk=A.ci[k],ao=k*bs*bs;for(let l=P.rp[kk];l<P.rp[kk+1];l++){const J=P.ci[l];let p=pm[J];if(p<0){p=pm[J]=cols.length;cols.push(J);if(acc.length<cols.length*ob){const t=new Float64Array(acc.length*2);t.set(acc);acc=t;}acc.fill(0,p*ob,p*ob+ob);}const bo=l*ob,co=p*ob;for(let r=0;r<bs;r++)for(let q=0;q<bs;q++){const av=A.v[ao+r*bs+q];if(av===0)continue;for(let s=0;s<nb;s++)acc[co+r*nb+s]+=av*P.v[bo+q*nb+s];}}}
    for(let l=P.rp[i];l<P.rp[i+1];l++){const K=P.ci[l],po=l*ob,r0=rp[K],r1=rp[K+1];for(let p=0;p<cols.length;p++){const pos=find(ci,r0,r1,cols[p])*bc,co=p*ob;for(let a=0;a<nb;a++)for(let r=0;r<bs;r++){const pv=P.v[po+r*nb+a];if(pv===0)continue;for(let s=0;s<nb;s++)v[pos+a*nb+s]+=pv*acc[co+r*nb+s];}}}
    for(const J of cols)pm[J]=-1;}
  const C={n:m,m,rb:nb,cb:nb,rp,ci,v};let dmax=0;for(let i=0;i<m;i++){const d=find(ci,rp[i],rp[i+1],i)*bc;for(let a=0;a<nb;a++)dmax=Math.max(dmax,Math.abs(v[d+a*nb+a]));}
  for(let i=0;i<m;i++){const d=find(ci,rp[i],rp[i+1],i)*bc;for(let a=0;a<nb;a++)if(Math.abs(v[d+a*nb+a])<1e-13*dmax){let z=true;for(let k=rp[i];k<rp[i+1]&&z;k++)for(let s=0;s<nb;s++)if(Math.abs(v[k*bc+a*nb+s])>1e-13*dmax){z=false;break;}if(z)v[d+a*nb+a]=dmax*1e-6;}}
  return C;
}
function binv(A,g=1){
  const{n,rb,rp,ci,v}=A,bb=rb*rb,sb=g*rb,ns=Math.ceil(n/g),D=new Float64Array(ns*sb*sb),M=new Float64Array(sb*2*sb),w=2*sb;
  for(let s=0;s<ns;s++){M.fill(0);const n0=s*g,n1=Math.min(n,n0+g),m=(n1-n0)*rb;let sc=0;
    for(let i=n0;i<n1;i++)for(let k=rp[i];k<rp[i+1];k++){const j=ci[k];if(j<n0||j>=n1)continue;for(let r=0;r<rb;r++)for(let c=0;c<rb;c++)M[((i-n0)*rb+r)*w+(j-n0)*rb+c]=v[k*bb+r*rb+c];}
    for(let r=0;r<m;r++){M[r*w+sb+r]=1;sc=Math.max(sc,Math.abs(M[r*w+r]));}
    for(let c=0;c<m;c++){let p=c;for(let r=c+1;r<m;r++)if(Math.abs(M[r*w+c])>Math.abs(M[p*w+c]))p=r;if(p!==c)for(let t=0;t<w;t++){const x=M[c*w+t];M[c*w+t]=M[p*w+t];M[p*w+t]=x;}const d=M[c*w+c];if(Math.abs(d)<1e-14*(sc||1)){for(let t=0;t<w;t++)M[c*w+t]=t===c||t===sb+c?1:0;continue;}for(let t=0;t<w;t++)M[c*w+t]/=d;for(let r=0;r<m;r++)if(r!==c){const f=M[r*w+c];if(f)for(let t=0;t<w;t++)M[r*w+t]-=f*M[c*w+t];}}
    for(let r=0;r<sb;r++)for(let c=0;c<sb;c++)D[s*sb*sb+r*sb+c]=r<m&&c<m?M[r*w+sb+c]:0;}
  return D;
}
function dapply(D,sb,r,z){const n=r.length,ns=Math.ceil(n/sb),bb=sb*sb;for(let s=0;s<ns;s++){const o=s*sb,m=Math.min(sb,n-o);for(let a=0;a<m;a++){let t=0;for(let b=0;b<m;b++)t+=D[s*bb+a*sb+b]*r[o+b];z[o+a]=t;}}}
function lamMax(A,D,sb=A.rb){const n=A.n*A.rb;let x=new Float64Array(n),y=new Float64Array(n),z=new Float64Array(n),l=1,s=7;for(let i=0;i<n;i++){s=(s*1103515245+12345)&0x7fffffff;x[i]=s/0x7fffffff-0.5;}for(let it=0;it<12;it++){mv(A,x,y);dapply(D,sb,y,z);let nr=0,dt=0;for(let i=0;i<n;i++){nr+=z[i]*z[i];dt+=z[i]*x[i];}l=Math.sqrt(nr)/Math.sqrt(x.reduce((a,v)=>a+v*v,0)||1);const q=Math.sqrt(nr)||1;for(let i=0;i<n;i++)x[i]=z[i]/q;}return l;}
function aggregate(A,th){
  const{n,rb,rp,ci,v}=A,bb=rb*rb,fn=k=>{let s=0;for(let t=0;t<bb;t++)s+=v[k*bb+t]**2;return Math.sqrt(s);},dg=new Float64Array(n);for(let i=0;i<n;i++){const k=find(ci,rp[i],rp[i+1],i);dg[i]=k>=0?fn(k):0;}
  const sp=new Int32Array(n+1),sl=[],sw=[];for(let i=0;i<n;i++){for(let k=rp[i];k<rp[i+1];k++){const j=ci[k];if(j===i)continue;const s=fn(k);if(s>0&&s>=th*Math.sqrt(dg[i]*dg[j])){sl.push(j);sw.push(s);}}sp[i+1]=sl.length;}
  const agg=new Int32Array(n).fill(-1);let na=0;
  for(let i=0;i<n;i++){if(agg[i]>=0||sp[i]===sp[i+1])continue;let free=true;for(let k=sp[i];k<sp[i+1];k++)if(agg[sl[k]]>=0){free=false;break;}if(!free)continue;agg[i]=na;for(let k=sp[i];k<sp[i+1];k++)agg[sl[k]]=na;na++;}
  const a1=agg.slice();for(let i=0;i<n;i++){if(agg[i]>=0||sp[i]===sp[i+1])continue;let best=-1,bw=0;for(let k=sp[i];k<sp[i+1];k++)if(a1[sl[k]]>=0&&sw[k]>bw){bw=sw[k];best=a1[sl[k]];}if(best>=0)agg[i]=best;}
  for(let i=0;i<n;i++){if(agg[i]>=0||sp[i]===sp[i+1])continue;agg[i]=na;for(let k=sp[i];k<sp[i+1];k++)if(agg[sl[k]]<0)agg[sl[k]]=na;na++;}
  return{agg,na};
}
function tentative(n,bs,agg,na,B,nb){
  const cnt=new Int32Array(na+1);for(let i=0;i<n;i++)if(agg[i]>=0)cnt[agg[i]+1]++;for(let a=0;a<na;a++)cnt[a+1]+=cnt[a];const nodes=new Int32Array(cnt[na]),f=cnt.slice(0,na);for(let i=0;i<n;i++)if(agg[i]>=0)nodes[f[agg[i]]++]=i;
  const rp=new Int32Array(n+1),ci=new Int32Array(cnt[na]),v=new Float64Array(cnt[na]*bs*nb),Bc=new Float64Array(na*nb*nb),pos=new Int32Array(n).fill(-1);let q=0;for(let i=0;i<n;i++){if(agg[i]>=0){pos[i]=q;ci[q]=agg[i];q++;}rp[i+1]=q;}
  for(let a=0;a<na;a++){const ns=nodes.subarray(cnt[a],cnt[a+1]),m=ns.length*bs,Q=new Float64Array(m*nb),Rr=new Float64Array(nb*nb);for(let r=0;r<ns.length;r++)for(let d=0;d<bs;d++)for(let c=0;c<nb;c++)Q[(r*bs+d)*nb+c]=B[(ns[r]*bs+d)*nb+c];
    for(let c=0;c<nb;c++){let n0=0;for(let r=0;r<m;r++)n0+=Q[r*nb+c]**2;n0=Math.sqrt(n0);for(let pass=0;pass<2;pass++)for(let k=0;k<c;k++){let s=0;for(let r=0;r<m;r++)s+=Q[r*nb+k]*Q[r*nb+c];Rr[k*nb+c]+=s;for(let r=0;r<m;r++)Q[r*nb+c]-=s*Q[r*nb+k];}let nr=0;for(let r=0;r<m;r++)nr+=Q[r*nb+c]**2;nr=Math.sqrt(nr);
      if(nr>1e-9*n0&&nr>0){Rr[c*nb+c]=nr;for(let r=0;r<m;r++)Q[r*nb+c]/=nr;}else{for(let r=0;r<m;r++)Q[r*nb+c]=0;for(let k=0;k<c;k++)Rr[k*nb+c]=Rr[k*nb+c];}}
    for(let r=0;r<ns.length;r++){const o=pos[ns[r]]*bs*nb;for(let d=0;d<bs;d++)for(let c=0;c<nb;c++)v[o+d*nb+c]=Q[(r*bs+d)*nb+c];}Bc.set(Rr,a*nb*nb);}
  return{P:{n,m:na,rb:bs,cb:nb,rp,ci,v},Bc};
}
function smoothP(A,D,Pt,om){
  const AP=spgemm(A,Pt),bs=A.rb,nb=Pt.cb,ob=bs*nb,bb=bs*bs,t=new Float64Array(ob);
  for(let i=0;i<AP.n;i++){for(let k=AP.rp[i];k<AP.rp[i+1];k++){const o=k*ob;for(let r=0;r<bs;r++)for(let s=0;s<nb;s++){let x=0;for(let q=0;q<bs;q++)x+=D[i*bb+r*bs+q]*AP.v[o+q*nb+s];t[r*nb+s]=-om*x;}AP.v.set(t,o);}
    for(let l=Pt.rp[i];l<Pt.rp[i+1];l++){const k=find(AP.ci,AP.rp[i],AP.rp[i+1],Pt.ci[l]),o=k*ob;for(let x=0;x<ob;x++)AP.v[o+x]+=Pt.v[l*ob+x];}}
  return AP;
}
function denseOf(A){const N=A.n*A.rb,M=new Float64Array(N*N),bb=A.rb*A.rb;for(let i=0;i<A.n;i++)for(let k=A.rp[i];k<A.rp[i+1];k++){const j=A.ci[k];for(let r=0;r<A.rb;r++)for(let c=0;c<A.rb;c++)M[(i*A.rb+r)*N+j*A.rb+c]=A.v[k*bb+r*A.rb+c];}return{M,N};}
function cholDense(M,N){let mx=0;for(let i=0;i<N;i++)mx=Math.max(mx,Math.abs(M[i*N+i]));for(let j=0;j<N;j++){let s=M[j*N+j];for(let k=0;k<j;k++)s-=M[j*N+k]*M[j*N+k];const d=s>1e-12*mx?Math.sqrt(s):Math.sqrt(mx);M[j*N+j]=d;for(let i=j+1;i<N;i++){let t=M[i*N+j];for(let k=0;k<j;k++)t-=M[i*N+k]*M[j*N+k];M[i*N+j]=t/d;}}return M;}
function cholSolve(Lm,N,b,x){for(let i=0;i<N;i++){let s=b[i];for(let k=0;k<i;k++)s-=Lm[i*N+k]*x[k];x[i]=s/Lm[i*N+i];}for(let i=N-1;i>=0;i--){let s=x[i];for(let k=i+1;k<N;k++)s-=Lm[k*N+i]*x[k];x[i]=s/Lm[i*N+i];}}
export function amgSetup(A,B,nb,opt={}){
  const H=[],th=opt.theta??0,coarse=opt.coarse||900,t0=Date.now();let L={A,B,nb};
  for(;;){const n=L.A.n,bs=L.A.rb,g=H.length===0&&opt.col>1?opt.col:1;L.D=binv(L.A);L.lmaxP=lamMax(L.A,L.D);L.sb=g*bs;L.Ds=g>1?binv(L.A,g):L.D;L.lmax=g>1?lamMax(L.A,L.Ds,L.sb):L.lmaxP;for(const k of['t1','t2','t3','t4','b','x'])L[k]=new Float64Array(n*bs);H.push(L);
    if(n*bs<=coarse||H.length>=(opt.levels||12))break;const{agg,na}=aggregate(L.A,H.length===1?th:(opt.theta2??0.08));if(!na||na*L.nb>=0.85*n*bs)break;
    const{P:Pt,Bc}=tentative(n,bs,agg,na,L.B,L.nb),P=smoothP(L.A,L.D,Pt,4/3/L.lmaxP),R=transpose(P),Ac=rap(P,L.A,R);L.P=P;L.R=R;L={A:Ac,B:Bc,nb:L.nb};}
  const C=H[H.length-1],{M,N}=denseOf(C.A);C.N=N;C.Lc=cholDense(M,N);H.ms=Date.now()-t0;H.deg=opt.deg||2;H.cdeg=opt.cdeg||6;H.gamma=opt.gamma||2;
  return H;
}
function cheb(L,b,x,zero,deg){
  const n=b.length,r=L.t1,z=L.t2,d=L.t3,lmax=L.lmax*1.1,lmin=lmax/30,th=(lmax+lmin)/2,de=(lmax-lmin)/2,sg=th/de;let rho=1/sg;
  if(zero)r.set(b);else{mv(L.A,x,r);for(let i=0;i<n;i++)r[i]=b[i]-r[i];}dapply(L.Ds,L.sb,r,z);for(let i=0;i<n;i++){d[i]=z[i]/th;x[i]=zero?d[i]:x[i]+d[i];}
  for(let k=1;k<deg;k++){mv(L.A,x,r);for(let i=0;i<n;i++)r[i]=b[i]-r[i];dapply(L.Ds,L.sb,r,z);const r1=1/(2*sg-rho);for(let i=0;i<n;i++){d[i]=r1*rho*d[i]+2*r1/de*z[i];x[i]+=d[i];}rho=r1;}
}
export function vcycle(H,l,b,x){
  const L=H[l];if(l===H.length-1){cholSolve(L.Lc,L.N,b,x);return;}
  const dg=l?H.cdeg:H.deg,C=H[l+1];cheb(L,b,x,true,dg);for(let c=0;c<(l?H.gamma:1);c++){mv(L.A,x,L.t4);for(let i=0;i<b.length;i++)L.t4[i]=b[i]-L.t4[i];mv(L.R,L.t4,C.b);vcycle(H,l+1,C.b,C.x);mv(L.P,C.x,x,true);}cheb(L,b,x,false,dg);
}
export function pcg(A,H,f,opt={},prog){
  const n=f.length,u=opt.x0?opt.x0.slice():new Float64Array(n),r=f.slice(),z=new Float64Array(n),p=new Float64Array(n),Ap=new Float64Array(n),tol=opt.tol||1e-8,maxIt=opt.maxIt||2000;
  if(opt.x0){mv(A,u,Ap);for(let i=0;i<n;i++)r[i]-=Ap[i];}
  const fn=Math.sqrt(f.reduce((a,v)=>a+v*v,0))||1;vcycle(H,0,r,z);p.set(z);let rz=0;for(let i=0;i<n;i++)rz+=r[i]*z[i];let it=0,rel=Math.sqrt(r.reduce((a,v)=>a+v*v,0))/fn;
  for(;it<maxIt&&rel>tol;it++){mv(A,p,Ap);let pAp=0;for(let i=0;i<n;i++)pAp+=p[i]*Ap[i];if(!(pAp>0))break;const al=rz/pAp;let rr=0;for(let i=0;i<n;i++){u[i]+=al*p[i];r[i]-=al*Ap[i];rr+=r[i]*r[i];}rel=Math.sqrt(rr)/fn;if(prog&&it%5===0)prog(it,rel,opt.phase||'solve');if(rel<tol){it++;break;}
    vcycle(H,0,r,z);let rz2=0;for(let i=0;i<n;i++)rz2+=r[i]*z[i];const be=rz2/rz;rz=rz2;for(let i=0;i<n;i++)p[i]=z[i]+be*p[i];}
  return{u,iters:it,rel};
}
function facetGeo(X,E,bf,cb){
  const gs=[-G3,G3];for(let i=0;i<bf.length;i++){const e=Math.floor(bf[i]/6),nd=HEX_FACES[bf[i]%6].map(a=>E[8*e+a]),w=[0,0,0,0],nv=[0,0,0,0,0,0,0,0,0,0,0,0];let A=0;
    for(const s of gs)for(const t of gs){const N=[(1-s)*(1-t)/4,(1+s)*(1-t)/4,(1+s)*(1+t)/4,(1-s)*(1+t)/4],ds=[-(1-t)/4,(1-t)/4,(1+t)/4,-(1+t)/4],dt=[-(1-s)/4,-(1+s)/4,(1+s)/4,(1-s)/4],a=[0,0,0],b=[0,0,0];for(let k=0;k<4;k++)for(let c=0;c<3;c++){a[c]+=ds[k]*X[3*nd[k]+c];b[c]+=dt[k]*X[3*nd[k]+c];}const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],da=Math.hypot(...n);A+=da;for(let k=0;k<4;k++){w[k]+=N[k]*da;for(let c=0;c<3;c++)nv[3*k+c]+=N[k]*n[c];}}
    cb(i,nd,w,nv,A);}
}
function systemOf(inp,M,mat){
  const nn=M.X.length/3,ne=M.E.length/8,cm=masters(M),E=mat.E,nu=mat.nu,lam=E*nu/((1+nu)*(1-2*nu)),mu=E/(2*(1+nu)),pt=pattern(nn,M.E,cm),A={n:nn,m:nn,rb:3,cb:3,rp:pt.rp,ci:pt.ci,v:new Float64Array(pt.ci.length*9)},Ke=new Float64Array(576),x=new Float64Array(24),rho=M.rho;let cube=null,dmin=Infinity;
  for(let e=0;e<ne;e++){for(let a=0;a<8;a++){const p=3*M.E[8*e+a];x[3*a]=M.X[p];x[3*a+1]=M.X[p+1];x[3*a+2]=M.X[p+2];}
    if(M.cube&&M.cube[e]>0){const h=M.cube[e];if(!cube){const u=new Float64Array(24);for(let a=0;a<8;a++)for(let k=0;k<3;k++)u[3*a+k]=(HN[a][k]+1)/2;cube=new Float64Array(576);keQM6(u,lam,mu,cube);}for(let i=0;i<576;i++)Ke[i]=cube[i]*h;}
    else dmin=Math.min(dmin,keQM6(x,lam,mu,Ke,M.type==='sweep'&&isThin(x)));
    scatter(A,M.E,e,Ke,3,cm,rho?rho[e]:1);}
  return{A,cm,lam,mu,nn,ne,dmin};
}
function supportDofs(inp,M,cm){
  const nn=M.X.length/3,fix=new Uint8Array(3*nn),sup=[...(inp.fixed&&inp.fixed.length?[{faces:inp.fixed,type:'fixed'}]:[]),...(inp.supports||[])],AXI={x:0,y:1,z:2,X:0,Y:1,Z:2};
  const mark=(n,c)=>{if(cm&&cm.hq[n]>=0){for(let k=cm.p[n];k<cm.p[n+1];k++)fix[3*cm.i[k]+c]=1;}else fix[3*n+c]=1;};
  for(const s of sup){const sel=M.select(s.faces),acc=new Map();facetGeo(M.X,M.E,sel.facets,(i,nd,w,nv)=>{for(let k=0;k<4;k++){const v=acc.get(nd[k])||[0,0,0];for(let c=0;c<3;c++)v[c]+=nv[3*k+c];acc.set(nd[k],v);}});
    const roll=s.type==='roller'||s.type==='slider',dv=s.dir!=null?(typeof s.dir==='string'?AXI[s.dir.replace(/[+-]/,'')]:Array.isArray(s.dir)?[0,1,2].reduce((b,c)=>Math.abs(s.dir[c])>Math.abs(s.dir[b])?c:b,0):null):null;
    for(const[n,v]of acc){const a=dv!=null?dv:Math.abs(v[0])>=Math.abs(v[1])&&Math.abs(v[0])>=Math.abs(v[2])?0:Math.abs(v[1])>=Math.abs(v[2])?1:2;if(roll)mark(n,a);else for(let c=0;c<3;c++)mark(n,c);}}
  return fix;
}
function loadsOf(inp,M,mat,cm){
  const nn=M.X.length/3,f=new Float64Array(3*nn),ap=[0,0,0],add=(n,F)=>{if(cm&&cm.hq[n]>=0){for(let k=cm.p[n];k<cm.p[n+1];k++)for(let c=0;c<3;c++)f[3*cm.i[k]+c]+=cm.w[k]*F[c];}else for(let c=0;c<3;c++)f[3*n+c]+=F[c];for(let c=0;c<3;c++)ap[c]+=F[c];};
  for(const ld of inp.loads||[]){const sel=M.select(ld.faces),W=new Map(),Nv=new Map();let tot=0;if(!sel.facets.length&&!(ld.faces&&ld.faces.by==='all'&&!sel.faces.length))throw new Error('load faces '+JSON.stringify(sel.faces)+' have no mesh facets; refine the mesh');facetGeo(M.X,M.E,sel.facets,(i,nd,w,nv,A)=>{tot+=A;for(let k=0;k<4;k++){W.set(nd[k],(W.get(nd[k])||0)+w[k]);const v=Nv.get(nd[k])||[0,0,0];for(let c=0;c<3;c++)v[c]+=nv[3*k+c];Nv.set(nd[k],v);}});if(!tot)continue;
    if(ld.M){const Mv=ld.M,c=[0,0,0];for(const[n,w]of W)for(let k=0;k<3;k++)c[k]+=w*M.X[3*n+k]/tot;const mn=Math.hypot(...Mv)||1,m=Mv.map(q=>q/mn),rq=new Map();let J=0;for(const[n,w]of W){const r=[M.X[3*n]-c[0],M.X[3*n+1]-c[1],M.X[3*n+2]-c[2]],d=r[0]*m[0]+r[1]*m[1]+r[2]*m[2],q=[r[0]-d*m[0],r[1]-d*m[1],r[2]-d*m[2]];J+=w*(q[0]**2+q[1]**2+q[2]**2);rq.set(n,q);}
      if(J>0)for(const[n,w]of W){const q=rq.get(n),s=w/J;add(n,[(Mv[1]*q[2]-Mv[2]*q[1])*s,(Mv[2]*q[0]-Mv[0]*q[2])*s,(Mv[0]*q[1]-Mv[1]*q[0])*s]);}}
    else if(ld.p!=null)for(const[n,v]of Nv)add(n,[-ld.p*v[0],-ld.p*v[1],-ld.p*v[2]]);else for(const[n,w]of W)add(n,[ld.F[0]*w/tot,ld.F[1]*w/tot,ld.F[2]*w/tot]);}
  const g=inp.accel||(mat.g?mat.g.map(v=>v*9.80665):null);if(g&&mat.rho){const k=mat.rho*1e-9,vol=nodalVol(M);for(let n=0;n<nn;n++)if(vol[n])add(n,[g[0]*k*vol[n],g[1]*k*vol[n],g[2]*k*vol[n]]);}
  return{f,ap};
}
function nodalVol(M){if(M.nvol)return M.nvol;const nn=M.X.length/3,ne=M.E.length/8,vol=new Float64Array(nn),x=new Float64Array(24),o=new Float64Array(8);for(let e=0;e<ne;e++){for(let a=0;a<8;a++){const p=3*M.E[8*e+a];x[3*a]=M.X[p];x[3*a+1]=M.X[p+1];x[3*a+2]=M.X[p+2];}nodeVol(x,o);const s=M.rho?M.rho[e]:1;for(let a=0;a<8;a++)vol[M.E[8*e+a]]+=o[a]*s;}return M.nvol=vol;}
function applyBC(A,fix,f){
  const{n,rp,ci,v}=A,rows=[];for(let i=0;i<n;i++){let any=false;for(let c=0;c<3;c++)if(fix[3*i+c])any=true;if(!any)continue;rows.push(i);}
  const R={rows,rp:new Int32Array(rows.length+1),ci:[],v:[]};rows.forEach((i,q)=>{for(let k=rp[i];k<rp[i+1];k++){R.ci.push(ci[k]);for(let t=0;t<9;t++)R.v.push(v[9*k+t]);}R.rp[q+1]=R.ci.length;});
  for(let i=0;i<n;i++)for(let k=rp[i];k<rp[i+1];k++){const j=ci[k];for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(fix[3*i+a]||fix[3*j+b])v[9*k+3*a+b]=i===j&&a===b?1:0;}
  for(let i=0;i<f.length;i++)if(fix[i])f[i]=0;
  for(let i=0;i<n;i++){const k=find(ci,rp[i],rp[i+1],i);for(let a=0;a<3;a++)if(v[9*k+4*a]===0)v[9*k+4*a]=1;}
  return R;
}
function reactions(R,u,fix,f0){const rf=[0,0,0];R.rows.forEach((i,q)=>{for(let a=0;a<3;a++){if(!fix[3*i+a])continue;let s=0;for(let k=R.rp[q];k<R.rp[q+1];k++){const j=R.ci[k];for(let b=0;b<3;b++)s+=R.v[9*k+3*a+b]*u[3*j+b];}rf[a]+=s-f0[3*i+a];}});return rf;}
function nullspace(M,fix){
  const nn=M.X.length/3,X=M.X,sw=M.sweep&&M.sheet&&M.sheet.thin?M.sweep:null;let nb=6,fr=null;
  if(sw){const{nl,N}=sw,nbar=[0,0,0];for(let i=0;i<nl;i++){const p=3*i*(N+1),q=p+3*N,d=[X[q]-X[p],X[q+1]-X[p+1],X[q+2]-X[p+2]],l=Math.hypot(...d)||1;for(let k=0;k<3;k++)nbar[k]+=d[k]/l;}const ln=Math.hypot(...nbar);if(ln>0.3*nl){const e3=nbar.map(v=>v/ln),t=Math.abs(e3[0])<0.9?[1,0,0]:[0,1,0],d=t[0]*e3[0]+t[1]*e3[1]+t[2]*e3[2],e1=[t[0]-d*e3[0],t[1]-d*e3[1],t[2]-d*e3[2]],l1=Math.hypot(...e1);for(let k=0;k<3;k++)e1[k]/=l1;const e2=[e3[1]*e1[2]-e3[2]*e1[1],e3[2]*e1[0]-e3[0]*e1[2],e3[0]*e1[1]-e3[1]*e1[0]];fr={e1,e2,nl,N};nb=9;}}
  const c=[0,0,0];for(let i=0;i<nn;i++)for(let k=0;k<3;k++)c[k]+=X[3*i+k]/nn;const B=new Float64Array(3*nn*nb);
  for(let i=0;i<nn;i++){const x=X[3*i]-c[0],y=X[3*i+1]-c[1],z=X[3*i+2]-c[2],R=[[1,0,0,0,z,-y],[0,1,0,-z,0,x],[0,0,1,y,-x,0]];for(let d=0;d<3;d++)for(let k=0;k<6;k++)B[(3*i+d)*nb+k]=fix&&fix[3*i+d]?0:R[d][k];
    if(fr){const{e1,e2,N}=fr,j=Math.floor(i/(N+1)),kk=i%(N+1),p=3*j*(N+1),q=p+3*N,dv=[X[q]-X[p],X[q+1]-X[p+1],X[q+2]-X[p+2]],t=Math.hypot(...dv)||1,n=dv.map(v=>v/t),m=[(X[p]+X[q])/2-c[0],(X[p+1]+X[q+1])/2-c[1],(X[p+2]+X[q+2])/2-c[2]],s1=m[0]*e1[0]+m[1]*e1[1]+m[2]*e1[2],s2=m[0]*e2[0]+m[1]*e2[1]+m[2]*e2[2],ze=(kk/N-0.5)*t;
      [[s1*s1/2,e1.map(v=>v*s1)],[s2*s2/2,e2.map(v=>v*s2)],[s1*s2,e1.map((v,k)=>v*s2+e2[k]*s1)]].forEach(([w,gr],mo)=>{const gn=gr[0]*n[0]+gr[1]*n[1]+gr[2]*n[2];for(let d=0;d<3;d++)B[(3*i+d)*nb+6+mo]=fix&&fix[3*i+d]?0:w*n[d]-ze*(gr[d]-gn*n[d]);});}}
  return{B,nb};
}
function coarseInv(H){const C=H[H.length-1],N=C.N;if(H.cinv)return H.cinv;const M=new Float32Array(N*N),e=new Float64Array(N),x=new Float64Array(N);for(let j=0;j<N;j++){e.fill(0);e[j]=1;cholSolve(C.Lc,N,e,x);for(let i=0;i<N;i++)M[i*N+j]=x[i];}return H.cinv=M;}
async function solveSys(A,H,f,opt,prog){
  const want=opt.solver||'auto';let gpuError;
  if(want!=='cpu'&&H.length>1&&(want==='gpu'||A.n>(opt.gpuMin||5000)))try{coarseInv(H);const r=await gpuAMG(H,f,{tol:opt.tol||1e-8,mv:(x,y)=>mv(A,x,y)},prog);if(r)return{...r,backend:'gpu'};gpuError='WebGPU unavailable';}catch(e){gpuError=String(e.message||e);}
  return{...pcg(A,H,f,{tol:opt.tol||1e-8,maxIt:opt.maxIt},prog),backend:'cpu',gpuError};
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
function meshInfo(M){const q=M.quality||{};return{type:M.type,kind:M.kind,nEl:M.E.length/8,nNode:M.X.length/3,layers:M.layers||null,tMin:M.thickness?M.thickness.min:M.tMin??null,tMax:M.thickness?M.thickness.max:null,h0:M.size?M.size.h0:null,hmin:M.size?M.size.hmin:null,minSJ:q.minSJ,maxAR:q.maxAR,lowSJ:q.lowSJ,volErr:q.volErr,through:M.layers||M.through||null,ms:M.ms,fallback:M.fallback,info:M.info};}
export function pickMesh(inp){
  const want=inp.mesh||'voxel';if(want==='voxel')return null;if(want!=='auto')return want;
  const res=inp.res||30000,hv=Math.cbrt(Math.max(inp.volume,1e-9)/Math.max(2000,Math.min(res,800000))),st=thicknessStats(inp);
  if(!(st.p02<3*hv))return null;const sh=detectSheet(inp);return sh.ok?'sweep':'adaptive';
}
export async function runMeshFEA(inp,prog){
  const kind=pickMesh(inp);if(!kind)return runFEA(inp,prog);
  const type=inp.type||'static',t0=Date.now();prog&&prog(0,1,'mesh');
  const M=inp.M||meshSolid(inp,{type:kind,res:Math.round((inp.res||30000)*(type==='modal'?0.6:1)),size:inp.meshSize||inp.size,layers:inp.layers}),tm=Date.now()-t0;
  const r=type==='modal'?await modalMesh(inp,M,prog):type==='thermal'?await thermalMesh(inp,M,prog):await staticMesh(inp,M,prog);
  r.mesh=meshInfo(M);r.mesh.ms=tm;r.ms=Date.now()-t0;return r;
}
async function staticMesh(inp,M,prog){
  const mat=inp.mat,t0=Date.now(),sys=systemOf(inp,M,mat),{A,cm,lam,mu,nn,ne}=sys,fix=supportDofs(inp,M,cm);if(!fix.some(v=>v))throw new Error('add at least one fixed face');if(cm)for(const n of M.hang.node)for(let c=0;c<3;c++)fix[3*n+c]=1;
  const{f,ap}=loadsOf(inp,M,mat,cm),f0=f.slice(),R=applyBC(A,fix,f),tA=Date.now(),NS=nullspace(M,fix),H=amgSetup(A,NS.B,NS.nb,{theta:inp.theta,theta2:inp.theta2,deg:inp.deg,cdeg:inp.cdeg,gamma:inp.gamma,coarse:inp.coarse,col:inp.col??(M.sweep&&M.sheet&&M.sheet.thin?M.sweep.N+1:1)}),tH=Date.now();
  const S=await solveSys(A,H,f,{tol:inp.tol,solver:inp.solver,gpuMin:inp.gpuMin,maxIt:inp.maxIt},prog),u=S.u,tS=Date.now();
  if(cm)for(let q=0;q<M.hang.node.length;q++){const n=M.hang.node[q];for(let c=0;c<3;c++){let s=0;for(let k=cm.p[n];k<cm.p[n+1];k++)s+=cm.w[k]*u[3*cm.i[k]+c];u[3*n+c]=s;}}
  const sig=new Float64Array(6*nn),cnt=new Uint16Array(nn),x=new Float64Array(24),ue=new Float64Array(24),o48=new Float64Array(48),evm=new Float32Array(ne);
  for(let e=0;e<ne;e++){for(let a=0;a<8;a++){const n=M.E[8*e+a];for(let k=0;k<3;k++){x[3*a+k]=M.X[3*n+k];ue[3*a+k]=u[3*n+k];}}stressQM6(x,ue,lam,mu,o48,!M.cube&&M.type==='sweep'&&isThin(x));let m=0;for(let a=0;a<8;a++){const n=M.E[8*e+a];for(let c=0;c<6;c++)sig[6*n+c]+=o48[6*a+c];cnt[n]++;m=Math.max(m,vmOf(o48.subarray(6*a,6*a+6)));}evm[e]=m;}
  const vm=new Float32Array(nn),um=new Float32Array(nn),sup=new Uint8Array(nn);let vmMax=0,vmAway=0,uMax=0;for(let n=0;n<nn;n++){if(fix[3*n]||fix[3*n+1]||fix[3*n+2])sup[n]=1;}
  for(let n=0;n<nn;n++){if(!cnt[n])continue;for(let c=0;c<6;c++)sig[6*n+c]/=cnt[n];vm[n]=vmOf(sig.subarray(6*n,6*n+6));um[n]=Math.hypot(u[3*n],u[3*n+1],u[3*n+2]);vmMax=Math.max(vmMax,vm[n]);uMax=Math.max(uMax,um[n]);if(!sup[n]&&!(cm&&cm.hq[n]>=0))vmAway=Math.max(vmAway,vm[n]);}
  const sk=skinOf(M),svm=new Float32Array(sk.nodes.length),su=new Float32Array(3*sk.nodes.length);sk.nodes.forEach((n,i)=>{svm[i]=vm[n];su[3*i]=u[3*n];su[3*i+1]=u[3*n+1];su[3*i+2]=u[3*n+2];});
  const[vStress,vDisp]=toVerts(sk,inp.pos,[[svm,1],[su,3]]);let nFixed=0;for(let n=0;n<nn;n++)if(sup[n])nFixed++;
  return{type:'static',vStress,vDisp,vmMax,vmP99:vmAway||vmMax,peakLabel:'Peak von Mises (away from supports)',uMax,h:M.size?M.size.h0:M.h0,nEl:ne,nDof:3*nn,iters:S.iters,rel:S.rel,levels:H.length,lvl:H.map(L=>L.A.n+"x"+L.A.rb).join(" "),ms:Date.now()-t0,applied:ap,reaction:reactions(R,u,fix,f0),nFixed,backend:S.backend,gpuError:S.gpuError,hist:S.hist,skin:{pos:sk.pos,idx:sk.idx,vm:svm,u:su},u:inp.keepU?u:undefined,nodeVm:inp.keepU?vm:undefined,times:{assemble:tA-t0,amg:tH-tA,solve:tS-tH,post:Date.now()-tS}};
}
async function modalMesh(inp,M,prog){throw new Error('modal on mesh not available yet');}
async function thermalMesh(inp,M,prog){throw new Error('thermal on mesh not available yet');}
