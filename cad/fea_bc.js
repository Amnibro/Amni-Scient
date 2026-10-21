const AX={x:0,y:1,z:2},dom=v=>Math.abs(v[0])>=Math.abs(v[1])&&Math.abs(v[0])>=Math.abs(v[2])?0:Math.abs(v[1])>=Math.abs(v[2])?1:2,cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const ADV=new Set(['disp','spring','stop']);
export const axisOf=(d,v)=>d==null?dom(v):typeof d==='string'?AX[d.replace(/[+-]/,'').toLowerCase()]??dom(v):dom(d);
export function bcOf(inp,nn,at,ex=(n,cb)=>cb(n,1)){
  const dof=new Uint8Array(3*nn),u0=new Float64Array(3*nn),da=new Float64Array(3*nn),stops=new Map(),grp=new Map();let pre=0,spr=0;
  (inp.supports||[]).forEach((s,si)=>{if(!ADV.has(s.type))return;const acc=at(s.faces);let tot=0;for(const v of acc.values())tot+=v[0];
    for(const[n,v]of acc){const nv=[v[1],v[2],v[3]],a=axisOf(s.dir,nv),sg=typeof s.dir==='string'&&/^[+-]/.test(s.dir)?(s.dir[0]==='-'?-1:1):Math.sign(nv[a])||1;
      ex(n,(m,w)=>{if(s.type==='disp')for(let c=0;c<3;c++){if(s.d&&s.d[c]!=null){dof[3*m+c]=1;u0[3*m+c]=+s.d[c];grp.set(3*m+c,si);pre=1;}}
        else if(s.type==='spring'){const k=(+s.k||0)*v[0]/(tot||1)*w;for(const c of s.normal?[a]:[0,1,2])da[3*m+c]+=k;spr=1;}
        else{stops.set(3*m+a,{s:sg,g:Math.max(0,+s.gap||0)});grp.set(3*m+a,si);}});}});
  return{dof,u0:pre?u0:null,dadd:spr?da:null,stops,grp,any:!!(pre||spr||stops.size)};
}
export async function contactSolve(B,held,once){
  const act=new Map();for(const[d,q]of B.stops)if(!q.g||!held)act.set(d,q.s*q.g);let r=null,it=0,ch=true;
  for(;it<24&&ch;it++){r=await once(act);ch=false;let um=1e-30,rm=1e-30;for(let i=0;i<r.u.length;i++)um=Math.max(um,Math.abs(r.u[i]));for(const d of act.keys())rm=Math.max(rm,Math.abs(r.R(d)));
    const off=[],on=[];let pm=0;for(const[d,q]of B.stops)act.has(d)?q.s*r.R(d)>1e-6*rm&&off.push(d):pm=Math.max(pm,q.s*r.u[d]-q.g);for(const[d,q]of B.stops)!act.has(d)&&q.s*r.u[d]-q.g>Math.max(1e-6*um,0.7*pm)&&on.push(d);
    if(off.length&&off.length===act.size&&!on.length&&!held){let b=off[0];for(const d of off)if(B.stops.get(d).s*r.R(d)<B.stops.get(b).s*r.R(b))b=d;off.splice(off.indexOf(b),1);}
    for(const d of off)act.delete(d);for(const d of on)act.set(d,B.stops.get(d).s*B.stops.get(d).g);ch=!!(off.length||on.length);}
  return{...r,contact:{nodes:new Set([...act.keys()].map(d=>d/3|0)).size,of:new Set([...B.stops.keys()].map(d=>d/3|0)).size,iters:it,settled:!ch}};
}
export function heldBy(B,R){const out=[];for(const[d,si]of B.grp){const o=out[si]||(out[si]=[0,0,0]);o[d%3]+=R(d);}return out;}
export function distLoad(ld,acc,X,add){
  let tot=0;const c=[0,0,0];for(const[n,v]of acc){tot+=v[0];const x=X(n);for(let k=0;k<3;k++)c[k]+=v[0]*x[k];}if(!tot)return 0;for(let k=0;k<3;k++)c[k]/=tot;
  if(ld.p!=null)for(const[n,v]of acc)add(n,[-ld.p*v[1],-ld.p*v[2],-ld.p*v[3]]);
  const F=ld.F||null,Fm=F?Math.hypot(...F):0,Mv=[0,0,0];ld.M&&ld.M.forEach((v,k)=>Mv[k]+=+v||0);if(F&&ld.at){const m=cr([ld.at[0]-c[0],ld.at[1]-c[1],ld.at[2]-c[2]],F);for(let k=0;k<3;k++)Mv[k]+=m[k];}
  if(F&&Fm){const W=new Map();let sw=0;if(ld.dist==='bearing')for(const[n,v]of acc){const l=Math.hypot(v[1],v[2],v[3])||1,w=v[0]*Math.max(0,-(v[1]*F[0]+v[2]*F[1]+v[3]*F[2])/(l*Fm));if(w>0){W.set(n,w);sw+=w;}}
    if(!sw)for(const[n,v]of acc){W.set(n,v[0]);sw+=v[0];}for(const[n,w]of W)add(n,[F[0]*w/sw,F[1]*w/sw,F[2]*w/sw]);}
  const mm=Math.hypot(...Mv);if(mm){const m=Mv.map(q=>q/mm),rq=new Map();let J=0;for(const[n,v]of acc){const x=X(n),r=[x[0]-c[0],x[1]-c[1],x[2]-c[2]],d=r[0]*m[0]+r[1]*m[1]+r[2]*m[2],q=[r[0]-d*m[0],r[1]-d*m[1],r[2]-d*m[2]];J+=v[0]*(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]);rq.set(n,q);}
    if(J>0)for(const[n,v]of acc){const q=rq.get(n),s=v[0]/J;add(n,[(Mv[1]*q[2]-Mv[2]*q[1])*s,(Mv[2]*q[0]-Mv[0]*q[2])*s,(Mv[0]*q[1]-Mv[1]*q[0])*s]);}}
  return tot;
}
