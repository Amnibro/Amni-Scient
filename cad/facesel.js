const AXS={'+X':[1,0,0],'-X':[-1,0,0],'+Y':[0,1,0],'-Y':[0,-1,0],'+Z':[0,0,1],'-Z':[0,0,-1]};
export function triFace(m,t){const g=m.groups,i3=t*3;let lo=0,hi=g.length-1;while(lo<hi){const mid=(lo+hi+1)>>1;if(g[mid][0]<=i3)lo=mid;else hi=mid-1;}return g.length?g[lo][2]:-1;}
export function nearestFace(m,p){const pos=m.pos,idx=m.idx;let best=-1,bd=1e18;for(let t=0;t<idx.length;t+=3){let cx=0,cy=0,cz=0;for(let k=0;k<3;k++){const v=idx[t+k]*3;cx+=pos[v];cy+=pos[v+1];cz+=pos[v+2];}const d=(cx/3-p[0])**2+(cy/3-p[1])**2+(cz/3-p[2])**2;if(d<bd){bd=d;best=t/3;}}return best<0?-1:triFace(m,best);}
export function faceIds(m,sel){if(!m)return[];const F=m.faces,list=Array.isArray(sel)?sel:[sel],out=new Set(),b=m.props.bbox,size=Math.hypot(b.max[0]-b.min[0],b.max[1]-b.min[1],b.max[2]-b.min[2]);
  for(const s of list){if(s==null)continue;if(typeof s==='number'){out.add(s);continue;}
    if(s.by==='pick'||s.pts){for(const p of s.pts||[]){let best=-1,bd=1e18;F.forEach((q,i)=>{const d=Math.hypot(q.c[0]-p[0],q.c[1]-p[1],q.c[2]-p[2]);if(d<bd){bd=d;best=i;}});const tri=nearestFace(m,p);if(tri>=0)out.add(tri);else if(best>=0)out.add(best);}}
    else if(s.side){const ax=AXS[s.side.length===1?'+'+s.side:s.side],i=ax.findIndex(v=>v),ext=ax[i]>0?b.max[i]:b.min[i];F.forEach((q,j)=>{if(q.n&&q.n[i]*ax[i]>0.999&&Math.abs(q.c[i]-ext)<size*1e-3+1e-3)out.add(j);});}
    else if(s.normal){const ax=AXS[s.normal];F.forEach((q,j)=>{if(q.n&&q.n[0]*ax[0]+q.n[1]*ax[1]+q.n[2]*ax[2]>0.999)out.add(j);});}
    else if(s.type)F.forEach((q,j)=>{if(q.type===String(s.type).toUpperCase())out.add(j);});}
  return[...out];}
