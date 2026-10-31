// Headless CAM audit harness: parses posted G-code, simulates a height-field stock and flags gouges, rapids into material, wrong milling side, over-deep cuts, feed/spindle limits and uncut material.
import {camLib} from '../mfg_kernel.js';
// Minimal ISO G-code interpreter for audit: G0/G1/G2/G3 (G17), G20/G21, G90/G91, G81/G83 canned (G98/G99), G80.
export function parseG(src){
  const mv=[],warn=[];let st={x:NaN,y:NaN,z:NaN,mode:0,abs:true,inch:false,F:0,S:0,plane:17,rp:'G98',cyc:null,R:0,Q:0,Zc:0},ln=0;
  const sc=v=>st.inch?v*25.4:v;
  for(const raw of src.split(/\r?\n/)){ln++;let l=raw.replace(/\(.*?\)/g,'').replace(/;.*$/,'').trim().toUpperCase();if(!l||l==='%')continue;
    const w={},gs=[],ms=[];for(const m of l.matchAll(/([A-Z])\s*([-+]?\d*\.?\d+)/g)){const c=m[1],v=+m[2];if(c==='G')gs.push(v);else if(c==='M')ms.push(v);else w[c]=v;}
    for(const g of gs){if(g===20)st.inch=true;else if(g===21)st.inch=false;else if(g===90)st.abs=true;else if(g===91)st.abs=false;else if([0,1,2,3].includes(g)){st.mode=g;st.cyc=null;}else if(g===81||g===83||g===73){st.cyc=g;st.mode=g;}else if(g===80){st.cyc=null;st.mode=0;}else if(g===98||g===99)st.rp='G'+g;else if(g===17||g===18||g===19)st.plane=g;}
    if(w.F!==undefined)st.F=sc(w.F);if(w.S!==undefined)st.S=w.S;
    const has=['X','Y','Z'].some(k=>w[k]!==undefined);
    const tgt=k=>w[k]===undefined?st[k.toLowerCase()]:st.abs?sc(w[k]):st[k.toLowerCase()]+sc(w[k]);
    if(st.cyc&&has){const x=tgt('X'),y=tgt('Y');if(w.R!==undefined)st.R=sc(w.R);if(w.Z!==undefined)st.Zc=sc(w.Z);if(w.Q!==undefined)st.Q=sc(w.Q);const z0=st.z;
      mv.push({k:0,x,y,z:z0,ln,F:st.F});mv.push({k:0,x,y,z:st.R,ln});let z=st.R;const q=st.cyc===81?Infinity:st.Q||Infinity;while(z>st.Zc+1e-9){z=Math.max(st.Zc,z-q);mv.push({k:1,x,y,z,ln,F:st.F,drill:1});if(z>st.Zc+1e-9){mv.push({k:0,x,y,z:st.R,ln});}}
      mv.push({k:0,x,y,z:st.rp==='G98'?Math.max(z0,st.R):st.R,ln});Object.assign(st,{x,y,z:mv[mv.length-1].z});continue;}
    if(!has)continue;const x=tgt('X'),y=tgt('Y'),z=tgt('Z');
    if(st.mode===2||st.mode===3){if(st.plane!==17){warn.push('arc plane '+st.plane+' line '+ln);}
      let cx,cy;if(w.R!==undefined){warn.push('R arc line '+ln);}const I=sc(w.I||0),J=sc(w.J||0);cx=st.x+I;cy=st.y+J;
      mv.push({k:st.mode,x,y,z,cx,cy,sx:st.x,sy:st.y,sz:st.z,ln,F:st.F,r0:Math.hypot(st.x-cx,st.y-cy),r1:Math.hypot(x-cx,y-cy)});}
    else mv.push({k:st.mode,x,y,z,sx:st.x,sy:st.y,sz:st.z,ln,F:st.F});
    Object.assign(st,{x,y,z});}
  return{mv,warn};
}
// sample points along each move (arcs expanded); returns list of {x,y,z,k,ln,F}
export function samples(mv,step=0.1){const o=[];let p=null;for(const m of mv){if(p==null||!isFinite(p.x)){o.push({...m});p=m;continue;}
  if(m.k===2||m.k===3){const a0=Math.atan2(p.y-m.cy,p.x-m.cx);let a1=Math.atan2(m.y-m.cy,m.x-m.cx);if(m.k===3){while(a1<=a0+1e-9)a1+=2*Math.PI;}else{while(a1>=a0-1e-9)a1-=2*Math.PI;}const sw=a1-a0,r=m.r0,n=Math.max(2,Math.ceil(Math.abs(sw)*r/step));for(let i=1;i<=n;i++){const t=i/n,a=a0+sw*t;o.push({x:m.cx+r*Math.cos(a),y:m.cy+r*Math.sin(a),z:p.z+(m.z-p.z)*t,k:m.k,ln:m.ln,F:m.F});}}
  else{const L=Math.hypot(m.x-p.x,m.y-p.y,m.z-p.z),n=Math.max(1,Math.ceil(L/step));for(let i=1;i<=n;i++){const t=i/n;o.push({x:p.x+(m.x-p.x)*t,y:p.y+(m.y-p.y)*t,z:p.z+(m.z-p.z)*t,k:m.k,ln:m.ln,F:m.F,drill:m.drill});}}
  p=m;}return o;}
// heightfield stock simulator, flat or ball end; checks rapids into stock and gouges against a part height function
export class Stock{constructor(x0,y0,w,h,top,cell){Object.assign(this,{x0,y0,w,h,top,c:cell,nx:Math.ceil(w/cell)+1,ny:Math.ceil(h/cell)+1});this.H=new Float64Array(this.nx*this.ny).fill(top);}
  idx(x,y){const i=Math.round((x-this.x0)/this.c),j=Math.round((y-this.y0)/this.c);return i<0||j<0||i>=this.nx||j>=this.ny?-1:j*this.nx+i;}
  // returns max penetration of tool (bottom at z) into current stock within disc
  stamp(x,y,z,r,cut,ball=false){let pen=0;const n=Math.ceil(r/this.c);const i0=Math.round((x-this.x0)/this.c),j0=Math.round((y-this.y0)/this.c);
    for(let dj=-n;dj<=n;dj++)for(let di=-n;di<=n;di++){const i=i0+di,j=j0+dj;if(i<0||j<0||i>=this.nx||j>=this.ny)continue;const px=this.x0+i*this.c,py=this.y0+j*this.c,d=Math.hypot(px-x,py-y);if(d>r-1e-9)continue;const zt=ball?z+r-Math.sqrt(r*r-d*d):z,k=j*this.nx+i;if(this.H[k]>zt){if(d<r-0.035)pen=Math.max(pen,this.H[k]-zt);if(cut)this.H[k]=zt;}}return pen;}
}
const L=await camLib();const cat=JSON.parse(L.cam_catalog()),D=JSON.parse(L.cam_defaults());
const tool=n=>cat.tools.find(t=>t.name===n),mach=n=>cat.machines.find(m=>m.name.startsWith(n)),mat=n=>cat.materials.find(m=>m.name.startsWith(n));
const pip=(p,x,y)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const segd=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)):0;return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
const bd=(p,x,y)=>{let d=1e9;for(let i=0,j=p.length-1;i<p.length;j=i++)d=Math.min(d,segd(x,y,p[j],p[i]));return d;};
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];const circ=(cx,cy,d,n=180)=>Array.from({length:n},(_,i)=>[cx+d/2*Math.cos(i/n*2*Math.PI),cy+d/2*Math.sin(i/n*2*Math.PI)]);
const rrect=(x,y,w,h,r)=>{if(r<=0)return rect(x,y,w,h);const o=[];for(const[cx,cy,a]of[[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]])for(let k=0;k<=24;k++){const t=(a+90*k/24)*Math.PI/180;o.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}return o;};
function shapePoly(s,ox,oy){let p;if(s.kind==='rect')p=rrect(s.x,s.y,s.w,s.h,s.r||0);else if(s.kind==='circle')p=circ(s.x,s.y,s.d);else if(s.kind==='poly')p=s.pts;return p.map(q=>[q[0]+ox,q[1]+oy]);}
export function partH(job){const ox=job.offset_x,oy=job.offset_y,t=job.stock_t,S=job.shapes.filter(s=>s.role!=='ignore').map(s=>({...s,P:shapePoly(s,ox,oy)}));
  const cuts=S.filter(s=>s.role==='cutout'),dep=d=>d<=0||d>=t-1e-9?Infinity:d;
  return (x,y)=>{if(cuts.length){const n=cuts.filter(c=>pip(c.P,x,y)).length;if(n%2===0)return -Infinity;}let h=0;for(const s of S){if(s.role==='pocket'||s.role==='hole'){if(pip(s.P,x,y))h=Math.min(h,-dep(s.depth));}}return h;};}
export function audit(name,job,o={}){const res=JSON.parse(L.cam_generate(JSON.stringify(job)));const B=[];const bug=(sev,msg)=>B.push({sev,msg});
  if(!res.ok){bug('info','generate failed: '+res.errors.join('; '));return{name,B,res};}
  const g=res.gcode,{mv,warn}=parseG(g);warn.forEach(w=>bug('low','parser: '+w));
  const inch=/\bG20\b/.test(g),u=inch?25.4:1,r=job.tool.dia/2,ball=job.tool.kind==='ball';
  // arcs
  let badArc=0,worst=0;for(const m of mv)if(m.k===2||m.k===3){const e=Math.abs(m.r0-m.r1);worst=Math.max(worst,e);if(e>0.006*u||m.r0<1e-6)badArc++;}
  if(badArc)bug('med',`${badArc} arcs with start/end radius mismatch, worst ${worst.toFixed(4)} mm`);
  // feeds
  const fm=job.machine.max_feed;let noF=0,hiF=0;for(const m of mv)if(m.k>=1){if(!(m.F>0))noF++;if(m.F>fm*1.001)hiF++;}
  if(noF)bug('high',noF+' feed moves without a feed rate');if(hiF)bug('med',hiF+' feed moves above machine max feed');
  const Smax=Math.max(0,...[...g.matchAll(/S(\d+\.?\d*)/g)].map(x=>+x[1]));if(Smax>job.machine.s_max*1.001)bug('med','spindle S'+Smax+' above s_max '+job.machine.s_max);
  // round trip vs preview
  const pv=res.preview.moves,last=mv[mv.length-1];
  // sim
  const H=partH(job),c=o.cell||0.1,st=new Stock(-r-3,-r-3,job.stock_w+2*r+6,job.stock_h+2*r+6,0,c);
  for(let k=0;k<st.H.length;k++){const i=k%st.nx,j=(k/st.nx|0),x=st.x0+i*c,y=st.y0+j*c;if(x<0||y<0||x>job.stock_w||y>job.stock_h)st.H[k]=-1e9;st.H[k]=Math.max(st.H[k],-1e9);}
  for(let k=0;k<st.H.length;k++){const i=k%st.nx,j=(k/st.nx|0),x=st.x0+i*c,y=st.y0+j*c;if(!(x>=0&&y>=0&&x<=job.stock_w&&y<=job.stock_h))st.H[k]=-job.stock_t-50;else st.H[k]=0;}
  const tol=o.tol??0.03;let gouge=[],rapid=[],doc=0,docAt=null,oob=0;
  const PH=new Float64Array(st.H.length);for(let k=0;k<st.H.length;k++){const i=k%st.nx,j=(k/st.nx|0);PH[k]=Math.min(H(st.x0+i*c,st.y0+j*c),o.top??0);}
  const S=samples(mv,o.step||0.1);let side=[0,0];const ph=(x,y)=>{const i=Math.round((x-st.x0)/c),j=Math.round((y-st.y0)/c);return i<0||j<0||i>=st.nx||j>=st.ny?-1e9:PH[j*st.nx+i];};
  for(let q=1;q<S.length;q++){const a=S[q-1],b=S[q];if(b.k===0||a.k===0)continue;const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);if(l<1e-6||Math.abs(b.z-a.z)>1e-6)continue;const nx=-dy/l,ny=dx/l,e=r+0.4,Lh=ph(b.x+nx*e,b.y+ny*e)>b.z+0.2,Rh=ph(b.x-nx*e,b.y-ny*e)>b.z+0.2;if(Lh!==Rh)side[Lh?0:1]++;}
  if(o.dir!==false&&side[0]+side[1]>20){const want=job.climb?1:0,frac=side[want]/(side[0]+side[1]);if(frac<0.9)bug('high',`milling direction: only ${(frac*100).toFixed(0)}% of wall contact is ${job.climb?'climb':'conventional'} (L/R=${side})`);}
  for(const p of S){if(!isFinite(p.x)||!isFinite(p.z))continue;
    if(p.x<-r-job.lead-2||p.y<-r-2||p.x>job.stock_w+r+2||p.y>job.stock_h+r+2)oob++;
    // gouge: part above tool bottom inside disc (r - tol)
    const n=Math.ceil(r/c),i0=Math.round((p.x-st.x0)/c),j0=Math.round((p.y-st.y0)/c);let gp=0;
    for(let dj=-n;dj<=n;dj++)for(let di=-n;di<=n;di++){const i=i0+di,j=j0+dj;if(i<0||j<0||i>=st.nx||j>=st.ny)continue;const d=Math.hypot(st.x0+i*c-p.x,st.y0+j*c-p.y);if(d>r-tol)continue;const zt=ball?p.z+r-Math.sqrt(r*r-d*d):p.z;const ph=PH[j*st.nx+i];if(ph>zt+tol)gp=Math.max(gp,ph-zt);}
    if(gp>0&&!o.engrave)gouge.push([p.ln,gp,p.x,p.y,p.z]);
    if(p.k===0){const pen=st.stamp(p.x,p.y,p.z,r,false,ball);if(pen>tol)rapid.push([p.ln,pen,p.x,p.y,p.z]);}
    else{const pen=st.stamp(p.x,p.y,p.z,r,true,ball);if(pen>doc){doc=pen;docAt=p.ln;}}}
  if(gouge.length){const w=gouge.reduce((a,b)=>b[1]>a[1]?b:a);bug('crit',`gouge: ${gouge.length} samples cut into the part, worst ${w[1].toFixed(3)} mm at line ${w[0]} (${w[2].toFixed(2)},${w[3].toFixed(2)},${w[4].toFixed(2)})`);}
  if(rapid.length){const w=rapid.reduce((a,b)=>b[1]>a[1]?b:a);bug('crit',`rapid through material: ${rapid.length} samples, worst ${w[1].toFixed(3)} mm at line ${w[0]}: ${g.split('\n')[w[0]-1]}`);}
  const fdoc=res.feeds.doc*1;if(o.maxdoc!==false&&doc>Math.max(fdoc,o.maxdoc||0)*1.05+tol)bug('high',`axial engagement ${doc.toFixed(3)} mm exceeds DOC ${fdoc} at line ${docAt}: ${g.split('\n')[docAt-1]}`);
  if(oob)bug('med',oob+' samples outside stock+tool radius');
  // completeness: cells where tool fits must reach part height
  let left=0,cand=0,worstL=0,wAt=null;if(o.complete!==false)for(let k=0;k<st.H.length;k++){const tgt=PH[k];if(!(tgt<0)||tgt===-Infinity&&false)continue;const i=k%st.nx,j=(k/st.nx|0),x=st.x0+i*c,y=st.y0+j*c;if(x<0||y<0||x>job.stock_w||y>job.stock_h)continue;
    if(!o.fits(x,y))continue;cand++;const want=tgt===-Infinity?-job.stock_t:tgt,rem=st.H[k]-want;if(rem>(o.rtol??0.05)){if(o.tabs&&o.tabs(x,y))continue;left++;if(rem>worstL){worstL=rem;wAt=[x,y];}}}
  if(left)bug('high',`${left}/${cand} reachable cells left uncut, worst ${worstL.toFixed(3)} mm at (${wAt.map(v=>v.toFixed(2))})`);
  return{name,B,res,mv,st,g,doc,side};}
export {L,cat,D,tool,mach,mat,bd,pip,rect,circ,rrect};
export function domeMesh(W=60,Lx=50,H=12,A=6,n=40){const v=[],t=[],id=(i,j)=>j*(n+1)+i;
 for(const top of[true,false])for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=W*i/n,y=Lx*j/n;v.push(x,y,top?H+A*Math.cos(Math.PI*(x/W-0.5))*Math.cos(Math.PI*(y/Lx-0.5)):0);}
 const b=(n+1)*(n+1);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=id(i,j),q=id(i+1,j),r=id(i+1,j+1),s=id(i,j+1);t.push(p,q,r,p,r,s,b+p,b+r,b+q,b+p,b+s,b+r);}
 for(let i=0;i<n;i++){t.push(id(i,0),b+id(i,0),b+id(i+1,0),id(i,0),b+id(i+1,0),id(i+1,0));t.push(id(i,n),id(i+1,n),b+id(i+1,n),id(i,n),b+id(i+1,n),b+id(i,n));}
 for(let j=0;j<n;j++){t.push(id(0,j),id(0,j+1),b+id(0,j+1),id(0,j),b+id(0,j+1),b+id(0,j));t.push(id(n,j),b+id(n,j),b+id(n,j+1),id(n,j),b+id(n,j+1),id(n,j+1));}
 return{v,t};}
