const D=Math.PI/180;
export const SHANKS={'1/4':6.35,'1/2':12.7,'8mm':8,'12mm':12};
export const BEARINGS={none:null,'3/8x1/8':[0.375,0.125],'1/2x3/16':[0.5,0.1875],'5/8x1/4':[0.625,0.25],'3/4x1/4':[0.75,0.25],'1x1/4':[1,0.25]};
export const SPINDLES={'3/4':0.75,'1-1/4':1.25};
export const RPM_CHART=[[1,24000],[2,18000],[2.5,16000],[3.5,12000]];
export const RPM_SRC='Router bit speed chart, Loughborough University workshop guide (lbas.lboro.ac.uk/chart/router-bit-profile-chart.html): up to 1 in 24,000 rpm; 1-1/4 to 2 in 18,000; 2-1/4 to 2-1/2 in 16,000; 2-3/4 to 3-1/2 in 12,000. Beyond 3-1/2 in the rim speed is held at the 3-1/2 in value. Always follow the bit maker\'s rating.';
export const KNIFE_SRC='Plane geometry (law of cosines): the knife face makes the hook angle with the radial line through the cutting circle; an edge point at radius R-d lies s = R cos(h) - sqrt((R-d)^2 - R^2 sin^2(h)) down the face. Compensation of knives for hook angle and cutting diameter is the practice described in the WoodWeb Knowledge Base article "Hook Angle for Large Radius Cutters".';
export const maxRpm=d=>d>0?(RPM_CHART.find(r=>d<=r[0]+1e-9)||[0,Math.round(12000*3.5/d)])[1]:0;
export const rimSpeed=(d,rpm)=>Math.PI*d/12*rpm;
export function tp(x,y,h=0){const P=[[x,y]],B=[],C=[];let a=h*D;const L=()=>P[P.length-1],o={
  f:(l,c=1)=>{const p=L();P.push([p[0]+l*Math.cos(a),p[1]+l*Math.sin(a)]);B.push(0);C.push(c);return o;},
  t:d=>{a+=d*D;return o;},
  h:d=>{a=d*D;return o;},
  a:(r,d,c=1)=>{const p=L(),s=Math.sign(d),w=d*D,cx=p[0]-Math.sin(a)*s*r,cy=p[1]+Math.cos(a)*s*r,v=[p[0]-cx,p[1]-cy];P.push([cx+v[0]*Math.cos(w)-v[1]*Math.sin(w),cy+v[0]*Math.sin(w)+v[1]*Math.cos(w)]);B.push(-s*r*(1-Math.cos(Math.abs(w)/2)));C.push(c);a+=w;return o;},
  to:(x,y,s=0,c=1)=>{const p=L(),ch=Math.hypot(x-p[0],y-p[1]),r=s?(ch*ch/4+s*s)/(2*Math.abs(s)):0;a=Math.atan2(y-p[1],x-p[0])-(s?Math.sign(s)*Math.asin(Math.min(1,ch/(2*r))):0);P.push([x,y]);B.push(s);C.push(c);return o;},
  done:()=>({pts:P,bulge:B,cut:C})};return o;}
export const rev=p=>({pts:[...p.pts].reverse(),bulge:[...p.bulge].reverse().map(b=>-b),cut:[...p.cut].reverse()});
export const xf=(p,f,fl)=>({pts:p.pts.map(f),bulge:fl?p.bulge.map(b=>-b):p.bulge,cut:p.cut});
const mirX=(p,c)=>xf(p,q=>[2*c-q[0],q[1]],true),cat=(a,b)=>({pts:[...a.pts,...b.pts.slice(1)],bulge:[...a.bulge,...b.bulge],cut:[...a.cut,...b.cut]}),ring=(p,e)=>({pts:[...p.pts,...e],bulge:[...p.bulge,...Array(e.length+1).fill(0)]}),full=h=>cat(rev(mirX(h,0)),h);
export function flat(p,tol=1e-3,closed=false){const n=p.pts.length,o=[],m=closed?n:n-1;for(let i=0;i<n;i++){o.push(p.pts[i]);const s=i<m&&p.bulge[i]||0;if(s){const a=p.pts[i],b=p.pts[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],c=Math.hypot(dx,dy),r=(c*c/4+s*s)/(2*Math.abs(s)),th=2*Math.asin(Math.min(1,c/(2*r))),sg=Math.sign(s),k=Math.max(2,Math.ceil(th/(2*Math.acos(Math.max(0,1-tol/r))))),e=r-Math.abs(s),cx=(a[0]+b[0])/2+dy/c*sg*e,cy=(a[1]+b[1])/2-dx/c*sg*e,a0=Math.atan2(a[1]-cy,a[0]-cx);for(let j=1;j<k;j++){const q=a0-sg*th*j/k;o.push([cx+r*Math.cos(q),cy+r*Math.sin(q)]);}}}return o;}
export const polyArea=P=>P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;
export const ringArea=(r,tol=1e-5)=>Math.abs(polyArea(flat(r,tol,true)));
export const radii=p=>p.bulge.map((s,i)=>{if(!s)return null;const a=p.pts[i],b=p.pts[(i+1)%p.pts.length],c=Math.hypot(b[0]-a[0],b[1]-a[1]);return(c*c/4+s*s)/(2*Math.abs(s));}).filter(v=>v);
const dd=r=>{const P=[],B=[];r.pts.forEach((q,i)=>{const pv=P[P.length-1];if(pv&&Math.hypot(q[0]-pv[0],q[1]-pv[1])<1e-9){B.pop();B.push(r.bulge[i]);}else{P.push(q);B.push(r.bulge[i]);}});const f=P[0],l=P[P.length-1];P.length>2&&Math.hypot(f[0]-l[0],f[1]-l[1])<1e-9&&(P.pop(),B.pop());return{pts:P,bulge:B};};
const E=m=>(x,y)=>[x>-1e-9?x+m:x,y>-1e-9?y+m:y],ends=c=>[c.pts[0],c.pts[c.pts.length-1]];
const eR=(c,m)=>{const e=E(m),[a,b]=ends(c);return ring(c,[e(b[0],b[1]),e(0,0),e(a[0],a[1])]);},uR=(c,m)=>{const[a,b]=ends(c);return ring(c,[[b[0],m],[a[0],m]]);},fR=(c,m,T)=>{const[a,b]=ends(c);return ring(c,[[b[0],-T-m],[m,-T-m],[m,m],[a[0],m]]);};
const secOf=(c,W,T)=>{const r=rev(c);return ring(r,[[-W,-T],[0,-T]]);};
const S=(label,v,t)=>[label,v,t];
const OG={r1:S('Cove radius',0.1875),r2:S('Bead radius',0.1875),lg:S('Ledge',0),fl:S('Land',0.075)};
const og=p=>{const w=p.r1+p.lg+p.r2,cur=tp(-w,0,-90).a(p.r1,90).f(p.lg).a(p.r2,-90).f(p.fl).done();return{cur};};
const stick=p=>{const y0=(p.T-p.gw)/2,ya=y0-p.pr;return tp(-p.pr,0,-90).a(p.pr,90).t(-90).f(ya,0).t(-90).f(p.gd).t(90).f(p.gw).t(90).f(p.gd).t(-90).f(p.T-y0-p.gw,0).done();};
const stickRings=(p,m)=>{const y0=(p.T-p.gw)/2;return[eR(tp(-p.pr,0,-90).a(p.pr,90).done(),m),ring(tp(0,-y0,180).f(p.gd).t(90).f(p.gw).t(90).f(p.gd).done(),[[m,-y0-p.gw],[m,-y0]])];};
const panel=(p,m,kind)=>{const h=p.pt-p.tt,x0=-(p.bw+p.tl),th=2*Math.atan(p.bw/h),r=h/(2*Math.sin(th)),q=Math.min(p.bw,h),b=tp(x0,0,kind==='straight'?0:-90);kind==='ogee'?b.a(r,th/D).a(r,-th/D):kind==='cove'?b.f(h-q).a(q,90).f(p.bw-q):b.to(-p.tl,-h);return{cur:b.h(0).f(p.tl).done()};};
const cap=(p,w)=>{const yf=-(p.rc+p.lg+p.rb),need=p.ro+p.rc+p.lg+p.rb;p.T<need+0.25*(p.K)&&(w.push('Stock thickness raised to '+(need+0.25*p.K).toFixed(3)),p.T=need+0.25*p.K);const cur=tp(-p.W,yf-p.ro,90).a(p.ro,-90).f(p.W-p.ro-p.rc-p.rb).a(p.rc,90).f(p.lg).a(p.rb,-90).done();return{cur,sec:secOf(cur,p.W,p.T)};};
const P=(name,group,kind,defs,fn)=>({name,group,kind,defs,fn});
export const PROFILES={
roundover:P('Roundover','Edge','edge',{r:S('Radius',0.25)},(p,m)=>{const cur=tp(-p.r,0,0).a(p.r,-90).done();return{cur,rings:[eR(cur,m)]};}),
chamfer:P('Chamfer','Edge','edge',{d:S('Width',0.25),ang:S('Angle',45,'a')},(p,m)=>{const cur=tp(-p.d,0,-p.ang).f(p.d/Math.cos(p.ang*D)).done();return{cur,rings:[eR(cur,m)]};}),
cove:P('Cove','Edge','edge',{r:S('Radius',0.25)},(p,m)=>{const cur=tp(-p.r,0,-90).a(p.r,90).done();return{cur,rings:[eR(cur,m)]};}),
ogee_roman:P('Roman ogee','Edge','edge',OG,(p,m)=>{const r=og(p);return{...r,rings:[eR(r.cur,m)]};}),
ogee_classic:P('Classical ogee','Edge','edge',{...OG,r1:S('Cove radius',0.25),r2:S('Bead radius',0.125),lg:S('Ledge',0.075)},(p,m)=>{const r=og(p);return{...r,rings:[eR(r.cur,m)]};}),
cove_bead:P('Cove and bead','Edge','edge',{rc:S('Cove radius',0.1875),q:S('Quirk depth',0.075),lg:S('Ledge',0.075),rb:S('Bead radius',0.125)},(p,m)=>{const cur=tp(-(p.rc+p.lg+p.rb),0,-90).a(p.rc,90).t(-90).f(p.q).t(90).f(p.lg).a(p.rb,-90).done();return{cur,rings:[eR(cur,m)]};}),
beading:P('Beading','Edge','edge',{rb:S('Bead radius',0.125),q:S('Quirk',0.075)},(p,m)=>{const cur=tp(-(p.rb+p.q),0,-90).f(p.q).t(90).f(p.q).a(p.rb,-90).done();return{cur,rings:[eR(cur,m)]};}),
rabbet:P('Rabbet','Edge','edge',{w:S('Width',0.375),dp:S('Depth',0.375)},(p,m)=>{const cur=tp(-p.w,0,-90).f(p.dp).t(90).f(p.w).done();return{cur,rings:[eR(cur,m)]};}),
vgroove:P('V-groove','Groove','center',{ang:S('Included angle',90,'a'),D:S('Depth',0.25)},(p,m)=>{const half=tp(0,-p.D,0).to(p.D*Math.tan(p.ang*D/2),0).done(),cur=full(half);return{cur,half,rings:[uR(cur,m)]};}),
corebox:P('Core box','Groove','center',{r:S('Radius',0.25)},(p,m)=>{const half=tp(0,-p.r,0).a(p.r,90).done(),cur=full(half);return{cur,half,rings:[uR(cur,m)]};}),
dovetail:P('Dovetail','Groove','center',{ang:S('Angle',14,'a'),D:S('Depth',0.5),dia:S('Widest diameter',0.5)},(p,m)=>{const half=tp(0,-p.D,0).f(p.dia/2).to(p.dia/2-p.D*Math.tan(p.ang*D),0).done(),cur=full(half);return{cur,half,rings:[uR(cur,m)]};}),
groove:P('Groove (tongue and groove)','Joint','center',{gw:S('Slot width',0.25),gd:S('Depth',0.375)},(p,m)=>{const half=tp(0,-p.gd,0).f(p.gw/2).t(90).f(p.gd).done(),cur=full(half);return{cur,half,rings:[uR(cur,m)]};}),
tongue:P('Tongue (tongue and groove)','Joint','edge',{T:S('Stock thickness',0.75),tt:S('Tongue thickness',0.25),tl:S('Tongue length',0.375)},(p,m)=>{const s=(p.T-p.tt)/2,cur=tp(-p.tl,0,-90).f(s).t(90).f(p.tl).t(-90).f(p.tt,0).t(-90).f(p.tl).t(90).f(s).done();return{cur,rings:[ring(tp(-p.tl,0,-90).f(s).t(90).f(p.tl).done(),[[m,-s],[m,m],[-p.tl,m]]),ring(tp(0,-s-p.tt,180).f(p.tl).t(90).f(s).done(),[[-p.tl,-p.T-m],[m,-p.T-m],[m,-s-p.tt]])]};}),
panel_straight:P('Raised panel, straight','Joint','edge',{pt:S('Panel thickness',0.75),tt:S('Tongue thickness',0.25),tl:S('Tongue length',0.375),bw:S('Bevel width',1)},(p,m)=>{const r=panel(p,m,'straight');return{...r,rings:[eR(r.cur,m)]};}),
panel_ogee:P('Raised panel, ogee','Joint','edge',{pt:S('Panel thickness',0.75),tt:S('Tongue thickness',0.25),tl:S('Tongue length',0.375),bw:S('Bevel width',1)},(p,m)=>{const r=panel(p,m,'ogee');return{...r,rings:[eR(r.cur,m)]};}),
panel_cove:P('Raised panel, cove','Joint','edge',{pt:S('Panel thickness',0.75),tt:S('Tongue thickness',0.25),tl:S('Tongue length',0.375),bw:S('Bevel width',1)},(p,m)=>{const r=panel(p,m,'cove');return{...r,rings:[eR(r.cur,m)]};}),
stick:P('Rail and stile, stick','Joint','edge',{T:S('Stock thickness',0.75),pr:S('Profile radius',0.25),gw:S('Panel groove width',0.25),gd:S('Groove depth',0.375)},(p,m)=>({cur:stick(p),rings:stickRings(p,m)})),
cope:P('Rail and stile, cope','Joint','edge',{T:S('Stock thickness',0.75),pr:S('Profile radius',0.25),gw:S('Panel groove width',0.25),gd:S('Groove depth',0.375),clr:S('Glue clearance',0.001)},(p,m)=>{const g=Math.max(p.gd,p.pr),cur=xf(stick(p),q=>[-q[0]-g-p.clr,q[1]],true);return{cur,rings:[fR(cur,m,p.T)]};}),
finger:P('Finger joint','Joint','edge',{fw:S('Finger width',0.25),fd:S('Finger depth',0.5),n:S('Notches',3,'n')},(p,m)=>{const n=Math.max(1,Math.round(p.n)),t=tp(0,0,-90),rings=[];for(let i=0;i<n;i++){const y=-2*i*p.fw;rings.push(ring(tp(0,y,180).f(p.fd).t(90).f(p.fw).t(90).f(p.fd).done(),[[m,y-p.fw],[m,y]]));t.t(-90).f(p.fd).t(90).f(p.fw).t(90).f(p.fd).t(-90).f(p.fw,0);}return{cur:t.done(),rings};}),
lockmiter:P('Lock miter','Joint','edge',{T:S('Stock thickness',0.75),sd:S('Lock depth',0.1875),sw:S('Lock width',0.125)},(p,m)=>{const L=p.T/2*Math.SQRT2,a=(L-p.sw)/2,cur=tp(-p.T/2,0,-45).f(a).t(-90).f(p.sd).t(90).f(p.sw).t(90).f(p.sd).t(-90).f(a).done();return{cur,rings:[eR(cur,m)]};}),
drawerlock:P('Drawer lock','Joint','edge',{d1:S('Step 1 depth',0.25),w1:S('Step 1 width',0.25),d2:S('Step 2 depth',0.25),w2:S('Step 2 width',0.25)},(p,m)=>{const cur=tp(-(p.w1+p.w2),0,-90).f(p.d1).t(90).f(p.w1).t(-90).f(p.d2).t(90).f(p.w2).done();return{cur,rings:[eR(cur,m)]};}),
gluejoint:P('Glue joint','Joint','edge',{pitch:S('Tooth pitch',0.25),fd:S('Tooth depth',0.125),n:S('Teeth',3,'n')},(p,m)=>{const n=Math.max(1,Math.round(p.n)),t=tp(0,0,0),rings=[];for(let i=0;i<n;i++){const y=-i*p.pitch;rings.push(ring(tp(0,y,0).to(-p.fd,y-p.pitch/2).to(0,y-p.pitch).done(),[[m,y-p.pitch],[m,y]]));t.to(-p.fd,y-p.pitch/2).to(0,y-p.pitch);}return{cur:t.done(),rings};}),
casing:P('Casing','Molding','section',{W:S('Width',3.25),T:S('Thickness',0.75),ro:S('Edge roundover',0.25),rb:S('Bead radius',0.125),rc:S('Cove radius',0.25)},(p,m,K,w)=>{const cur=tp(-p.W,-p.ro,90).a(p.ro,-90).f(p.W-p.ro-p.rb-p.rc).a(p.rb,-90).a(p.rc,90).done();return{cur,sec:secOf(cur,p.W,p.T),rings:[uR(cur,m)]};}),
base:P('Base molding','Molding','section',{W:S('Height',5.25),T:S('Thickness',1),ro:S('Foot roundover',0.125),rc:S('Cap cove radius',0.375),rb:S('Cap bead radius',0.25),lg:S('Cap land',0)},(p,m,K,w)=>{const r=cap({...p,K},w);return{...r,rings:[uR(r.cur,m)]};}),
crown:P('Crown molding','Molding','section',{W:S('Face width',4.5),T:S('Stock thickness',1.625),ro:S('Foot roundover',0.125),rc:S('Cove radius',0.75),rb:S('Bead radius',0.25),lg:S('Cove land',0.25),spring:S('Spring angle',38,'a')},(p,m,K,w)=>{const r=cap({...p,K},w);return{...r,rings:[uR(r.cur,m)]};}),
custom:P('Custom outline','Custom','edge',{},(p,m,K,w,pp)=>{const Q=(pp.pts||[]).map(q=>[+q[0],+q[1]]);if(Q.length<2)throw new Error('A custom profile needs 2 or more points: import a DXF outline or pick a sketch.');const bz=Array.from({length:Q.length-1},(_,i)=>+(pp.bulge||[])[i]||0),cur={pts:Q,bulge:bz,cut:bz.map(()=>1)};return{cur,rings:[eR(cur,m)]};}),
chairrail:P('Chair rail','Molding','section',{W:S('Width',3.5),T:S('Thickness',0.875),ro:S('Edge roundover',0.25),rc:S('Groove radius',0.25),gw:S('Groove width',0.5)},(p,m)=>{const cx=-p.W/2,L=tp(-p.W,-p.ro,90).a(p.ro,-90).f(p.W/2-p.ro-2*p.rc-p.gw/2).a(p.rc,-90).a(p.rc,90).f(p.gw/2).done(),cur=cat(L,rev(mirX(L,cx)));return{cur,sec:secOf(cur,p.W,p.T),rings:[uR(cur,m)]};})
};
export const PROFILE_GROUPS=['Edge','Groove','Joint','Molding','Custom'];
export function profile(id,pp={},K=1,o={}){
  const d=PROFILES[id];if(!d)throw new Error('unknown profile "'+id+'"; known: '+Object.keys(PROFILES).join(', '));
  const p={},w=[];for(const[k,v]of Object.entries(d.defs)){const x=pp&&pp[k]!=null&&pp[k]!==''?+pp[k]:v[2]?v[1]:v[1]*K;if(!isFinite(x)||x<0)throw new Error(d.name+': '+v[0]+' must be a number of zero or more');p[k]=x;}
  const r=d.fn(p,o.m||0,K,w,pp||{}),Q=flat(r.cur,1e-4),xs=Q.map(q=>q[0]),ys=Q.map(q=>q[1]),bb={minx:Math.min(...xs),maxx:Math.max(...xs),miny:Math.min(...ys),maxy:Math.max(...ys)};
  return{id,name:d.name,group:d.group,kind:d.kind,p,defs:d.defs,K,cur:r.cur,half:r.half||null,rings:(r.rings||[]).map(dd),sec:r.sec?dd(r.sec):null,bb,w:bb.maxx-bb.minx,h:bb.maxy-bb.miny,warns:w};
}
export const secArea=pr=>pr.sec?ringArea(pr.sec):null;
export const cutArea=pr=>pr.rings.reduce((s,r)=>s+ringArea(r),0);
function segDist(q,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dy)/l)):0;return Math.hypot(q[0]-a[0]-t*dx,q[1]-a[1]-t*dy);}
const dens=(P,h)=>{const o=[];for(let i=0;i+1<P.length;i++){const n=Math.max(1,Math.ceil(Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1])/h));for(let j=0;j<n;j++)o.push([P[i][0]+(P[i+1][0]-P[i][0])*j/n,P[i][1]+(P[i+1][1]-P[i][1])*j/n]);}o.push(P[P.length-1]);return o;};
export const hausdorff=(A,B,h=0.001)=>{const d=(X,Y)=>Math.max(...dens(X,h).map(q=>Math.min(...Y.slice(1).map((b,i)=>segDist(q,Y[i],b)))));return Math.max(d(A,B),d(B,A));};
export function copeFit(stickPr,copePr,K=1){const g=Math.max(copePr.p.gd,copePr.p.pr),A=flat(stickPr.cur,1e-4),B=flat(copePr.cur,1e-4).map(q=>[-q[0]-g,q[1]]),gap=hausdorff(A,B,0.001*K);return{gap,gap_in:gap/K,clr_in:copePr.p.clr/K,ok:gap/K<=0.002+1e-9};}
export function bitCurve(pr,mode='router',A=0,Rmax=0){
  const k=pr.kind,mx=pr.bb.minx,my=pr.bb.miny,fl=c=>({pts:c.pts,bulge:c.bulge});
  if(mode==='router'&&k==='center'){const c=pr.half;return{path:xf(c,q=>[q[0],q[1]-my]),A:0};}
  if(mode==='shaper'&&(k==='center'||k==='section')){const a=Rmax+my;return{path:xf(pr.cur,q=>[a-q[1],q[0]-mx]),A:a};}
  return{path:xf(pr.cur,q=>[A-q[0],q[1]-my],true),A};
}
export const stdShank=(f,K=1)=>(SHANKS[f.shank]||SHANKS['1/4'])/25.4*K;
export function bitSpec(f,K=1){
  const kind=f.type==='shaper'?'shaper':'router',pr=profile(f.prof||'roundover',f.pp,K),w=[...pr.warns],sd=stdShank(f,K),br=kind==='router'&&pr.kind!=='center'?BEARINGS[f.brg&&BEARINGS[f.brg]!==undefined?f.brg:'none']:null,ct=f.ct>0?+f.ct:0.08*K,n=Math.max(1,Math.round(f.wings||2)),od=br?br[0]*K:0,bid=br?br[1]*K:0,bt=br?0.17*K:0;
  const edge=pr.kind!=='center'&&!(kind==='shaper'&&pr.kind==='section'),wx=-pr.bb.minx;
  let A=0,Rmax=0,bore=0;
  if(kind==='shaper'){bore=(SPINDLES[f.spindle]||0.75)*K;Rmax=(f.dia>0?+f.dia:3.5*K)/2;A=edge?Rmax-wx:0;}
  else if(pr.kind!=='center'){A=br?od/2:f.dia>0?f.dia/2-wx:sd/2+0.07*K;br&&f.dia>0&&Math.abs(f.dia/2-wx-A)>1e-6*K&&w.push('The bearing sets the pilot radius, so the cutting diameter follows the profile.');}
  const bc=bitCurve(pr,kind,A,Rmax),Q=flat(bc.path,1e-4*K),zs=Q.map(q=>q[1]),rs=Q.map(q=>q[0]),zmax=Math.max(...zs),rmin=Math.min(...rs),rmax=Math.max(...rs),H=zmax,flute=Math.max(0,(f.len>0?+f.len:0)-H);
  kind==='shaper'&&rmin<bore/2+0.1*K&&w.push('The cutter leaves under 1/10 in of body around the bore; increase the diameter.');
  const wc=0.1*K,Rc0=kind==='shaper'?Math.max(bore/2+0.05*K,rmin-wc):sd/2+0.03*K,z0=kind==='shaper'?0:bt,rin=Math.min(kind==='shaper'?Math.max(bore/2+0.02*K,Rc0-0.1*K):0.5*Rc0,rmin);
  const zv=[...new Set(Q.map(q=>+q[1].toFixed(7)))].sort((a,b)=>a-b),env=zv.map(z=>[Math.max(...Q.filter(q=>Math.abs(q[1]-z)<1e-6).map(q=>q[0])),z]),core=[];
  for(const q of kind==='shaper'?[[Rc0+wc,0],[Rc0+wc,H+flute]]:[...env,...(flute>0?[[env[env.length-1][0],H+flute]]:[])]){const r=Math.max(0,Math.min(Rc0,q[0]-wc)),a=core[core.length-2],b=core[core.length-1];b&&a&&Math.abs((b[0]-a[0])*(q[1]-a[1])-(r-a[0])*(b[1]-a[1]))<1e-9?core[core.length-1]=[r,q[1]]:core.push([r,q[1]]);}
  const clean=core,ord=Q,undercut=env.some((e,i)=>i&&e[0]<env[i-1][0]-1e-6);
  const last=bc.path.pts[bc.path.pts.length-1],first=bc.path.pts[0],hi=last[1]>=first[1]?last:first,lo=hi===last?first:last;
  const ext=flute>0?[[hi[0],H+flute]]:[],cl=[[rin,(flute>0?H+flute:hi[1])],[rin,lo[1]]];
  const wing=dd(hi===last?{pts:[...bc.path.pts,...ext,...cl],bulge:[...bc.path.bulge,...Array(ext.length+cl.length+1).fill(0)]}:{pts:[...rev(bc.path).pts,...ext,...cl],bulge:[...rev(bc.path).bulge,...Array(ext.length+cl.length+1).fill(0)]});
  const hook=+f.hook||0,shear=+f.shear||0,relief=+f.relief||0;
  (hook<0||hook>30)&&w.push('Hook angle outside 0 to 30 degrees.');(shear<0||shear>30)&&w.push('Shear angle outside 0 to 30 degrees.');(relief<0||relief>30)&&w.push('Relief angle outside 0 to 30 degrees.');
  ct>Rc0*1.2&&w.push('Carbide is thicker than the steel body can hold; thin the carbide or enlarge the shank.');
  const sl=f.sl>0?+f.sl:1.25*K,neck=Math.max(0.1*K,Math.abs(Rc0-sd/2)*2);
  return{kind,pr,K,sd,br,od,bid,bt,ct,n,A,Rmax,bore,H:H+flute,Hp:H,flute,rmin,rmax,dia:2*rmax,Rc0,z0,rin,core:clean,undercut,wing,hook,shear,relief,sl,neck,warns:w,path:bc.path,ord:Q};
}
export function bitVolume(s){
  const I=(R,t)=>0.5*(t*Math.sqrt(R*R-t*t)+R*R*Math.asin(t/R)),Q=s.ord,zs=[...new Set(Q.map(q=>+q[1].toFixed(7)))].sort((a,b)=>a-b),rho=z=>{let m=0;for(let i=0;i+1<Q.length;i++){const a=Q[i],b=Q[i+1];if(Math.abs(b[1]-a[1])<1e-9)continue;const lo=Math.min(a[1],b[1]),hi=Math.max(a[1],b[1]);if(z>=lo-1e-9&&z<=hi+1e-9)m=Math.max(m,a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]));}return m;},core=z=>{const c=s.core;for(let i=0;i+1<c.length;i++)if(z>=c[i][1]-1e-9&&z<=c[i+1][1]+1e-9)return c[i][0]+(c[i+1][0]-c[i][0])*((z-c[i][1])/(c[i+1][1]-c[i][1]||1));return c[c.length-1][0];};
  let v=0;const N=2000,Z=s.Hp;for(let i=0;i<N;i++){const z=(i+0.5)*Z/N,Rc=core(z);v+=(Math.PI*Rc*Rc+s.n*(rho(z)*s.ct-I(Rc,Math.min(s.ct,Rc*0.999))))*Z/N;}
  const Rc=s.core[s.core.length-1][0],Rs=s.sd/2;v+=Math.PI*s.neck/3*(Rc*Rc+Rc*Rs+Rs*Rs)+Math.PI*Rs*Rs*(s.sl-s.neck)+(s.br?Math.PI*(s.od/2)**2*s.bt:0);
  return v;
}
export function checkBit(s,rpm,K=1){
  const o=[],dIn=s.dia/K,lim=maxRpm(dIn),want=rpm>0?rpm:lim,rim=rimSpeed(dIn,want),minR=0.03125*K,rr=radii(s.path).filter(r=>r<minR-1e-9);
  o.push({lvl:want>lim?'err':'ok',key:'rpm',msg:(want>lim?'Too fast: ':'Rim speed ')+Math.round(rim).toLocaleString('en-US')+' ft/min ('+(rim*0.3048).toFixed(0)+' m/min) at '+want.toLocaleString('en-US')+' rpm. Limit for a '+dIn.toFixed(3)+' in ('+(dIn*25.4).toFixed(1)+' mm) cutter is '+lim.toLocaleString('en-US')+' rpm.'});
  s.kind==='router'&&o.push({lvl:s.sl/K<Math.max(0.625,1.5*s.sd/K)?'err':'ok',key:'shank',msg:'Shank engagement '+(s.sl/K).toFixed(3)+' in ('+(s.sl/K*25.4).toFixed(1)+' mm); keep at least '+Math.max(0.625,1.5*s.sd/K).toFixed(3)+' in in the collet.'});
  s.kind==='router'&&s.dia>4*s.sd&&o.push({lvl:'warn',key:'shankdia',msg:'A shank this size is light for a cutter this wide; use a 1/2 in or 12 mm shank above '+(4*s.sd/K).toFixed(2)+' in diameter.'});
  o.push({lvl:rr.length?'err':'ok',key:'minr',msg:rr.length?'Profile radius '+(Math.min(...rr)/K).toFixed(4)+' in is below the 1/32 in minimum a carbide wing can be ground to.':'Smallest profile radius is at least 1/32 in.'});
  o.push({lvl:s.ct>s.Rc0*1.2?'warn':'ok',key:'carbide',msg:'Carbide '+(s.ct/K).toFixed(3)+' in ('+(s.ct/K*25.4).toFixed(1)+' mm) on a '+(s.Rc0*2/K).toFixed(3)+' in body.'});
  for(const w of s.warns)o.push({lvl:'warn',key:'note',msg:w});
  return o;
}
export const knifeS=(R,hook,d)=>{const t=hook*D,u=R-d,q=u*u-R*R*Math.sin(t)**2;if(q<0)throw new Error('The profile is too deep for this hook angle and cutting circle.');return R*Math.cos(t)-Math.sqrt(q);};
export function knifeSpec(f,K=1){
  const pr=profile(f.prof||'roundover',f.pp,K),R=(f.rc>0?+f.rc:4*K)/2,hook=f.hook!=null&&f.hook!==''?+f.hook:20,proj=f.proj>0?+f.proj:0.5*K,kt=f.kt>0?+f.kt:0.1875*K,grip=f.grip>0?+f.grip:0.5*K,km=f.km>0?+f.km:0.25*K,w=[...pr.warns],Q=flat(pr.cur,0.0005*K);
  const mono=(P,i)=>P.every((q,j)=>!j||q[i]>=P[j-1][i]-1e-7*K),top=Q.map(q=>[q[0],-q[1]]),side=Q.map(q=>[-q[1],-q[0]]),mode=f.head==='side'?'side':f.head==='top'?'top':mono(top,0)?'top':mono(side,0)?'side':'top',U=mode==='top'?top:side;
  !mono(U,0)&&w.push('This profile undercuts, so a knife cannot cut it in one pass. Use the cope and stick bits instead.');
  const dmax=Math.max(...U.map(q=>q[1])),Hb=knifeS(R,hook,proj)+grip,V=U.map(q=>[q[0],Hb-knifeS(R,hook,Math.max(0,q[1]))]);
  dmax>proj-0.03*K&&w.push('The profile is '+(dmax/K).toFixed(3)+' in deep but the knife projects '+(proj/K).toFixed(3)+' in; raise the projection.');
  (hook<0||hook>35)&&w.push('Hook angle outside 0 to 35 degrees.');
  const u0=V[0][0],u1=V[V.length-1][0],outline=[[u0-km,0],[u1+km,0],[u1+km,V[V.length-1][1]],...[...V].reverse(),[u0-km,V[0][1]]];
  return{pr,K,R,hook,proj,kt,grip,km,mode,Hb,V,outline,dmax,smax:knifeS(R,hook,dmax),sproj:knifeS(R,hook,proj),Rb:R-proj,len:u1-u0+2*km,warns:w,bevel:f.bevel!=null&&f.bevel!==''?+f.bevel:15,corr:!!f.corr,cp:f.cp>0?+f.cp:0.125*K,cd:f.cd>0?+f.cd:0.03*K};
}
export function edgeFrame(n1,n2,e){
  const x=n1,cr=[n1[1]*n2[2]-n1[2]*n2[1],n1[2]*n2[0]-n1[0]*n2[2],n1[0]*n2[1]-n1[1]*n2[0]],l=Math.hypot(...cr);
  return{x,y:n2,n:cr.map(v=>v/l)};
}
export function ballSurface(pr){const Q=flat(pr.cur,0.0005*pr.K),x0=pr.bb.minx,x1=pr.bb.maxx;return x=>{if(x<x0-1e-9||x>x1+1e-9)return 0;let m=1e9;for(let i=0;i+1<Q.length;i++){const a=Q[i],b=Q[i+1],lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);if(x<lo-1e-9||x>hi+1e-9)continue;const t=hi-lo<1e-12?0:(x-a[0])/(b[0]-a[0]);m=Math.min(m,hi-lo<1e-12?Math.min(a[1],b[1]):a[1]+(b[1]-a[1])*t);}return m>1e8?0:m;};}
export function bitTable(s,N=129){
  const Q=s.ord,r=s.rmax,t=[];for(let i=0;i<N;i++){const d=r*i/(N-1);let z=Infinity;for(let j=0;j<Q.length;j++){if(Q[j][0]>=d-1e-9)z=Math.min(z,Q[j][1]);if(j+1<Q.length){const a=Q[j],b=Q[j+1];if(Math.min(a[0],b[0])<d&&Math.max(a[0],b[0])>d){const u=(d-a[0])/(b[0]-a[0]);z=Math.min(z,a[1]+(b[1]-a[1])*u);}}}t.push(z===Infinity?0:z);}
  const gap=s.pr.kind!=='center'&&s.rmin>0?s.rmin-1.5*r/(N-1):-1;return t.map((v,i)=>r*i/(N-1)<gap?1000*s.K:+(v+s.z0).toFixed(5));
}
const f4=v=>+v.toFixed(4);
export function profileSVG(pr){
  const Q=flat(pr.cur,0.0005*pr.K),k=pr.K,pad=0.12*Math.max(pr.w,pr.h,0.25*k),b=pr.bb,x0=b.minx-pad,y0=-b.maxy-pad,W=pr.w+2*pad,H=pr.h+2*pad,path=P=>P.map((p,i)=>(i?'L':'M')+f4(p[0])+' '+f4(-p[1])).join(''),sw=Math.max(W,H)/150;
  const fill=r=>'<path d="'+path(flat(r,0.0005*k,true))+'Z" style="fill:var(--cu-fill,#59b6ff44);stroke:none"/>',body=pr.sec?fill(pr.sec).replace('#59b6ff44','#c8a56a77'):pr.rings.map(fill).join('');
  return'<svg class="cu-svg" viewBox="'+f4(x0)+' '+f4(y0)+' '+f4(W)+' '+f4(H)+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+pr.name+' profile">'+body+'<path d="'+path(Q)+'" style="fill:none;stroke:var(--cu-line,#1d6fd8);stroke-width:'+f4(sw*1.6)+';stroke-linejoin:round;stroke-linecap:round"/><line x1="'+f4(x0)+'" y1="0" x2="'+f4(x0+W)+'" y2="0" style="stroke:var(--mut,#8892a6);stroke-width:'+f4(sw/2)+';stroke-dasharray:'+f4(sw*3)+' '+f4(sw*2)+'"/></svg>';
}
export function checkKnife(ks){
  const K=ks.K,o=[{lvl:'ok',key:'corr',msg:'Knife depth at the deepest point is '+(ks.smax/K).toFixed(4)+' in ('+(ks.smax/K*25.4).toFixed(2)+' mm) for a molding depth of '+(ks.dmax/K).toFixed(4)+' in ('+(ks.dmax/K*25.4).toFixed(2)+' mm): '+((ks.smax/ks.dmax-1)*100).toFixed(1)+' % more.'},{lvl:ks.dmax>ks.proj-0.03*K?'err':'ok',key:'proj',msg:'Projection '+(ks.proj/K).toFixed(3)+' in ('+(ks.proj/K*25.4).toFixed(1)+' mm) radial, '+(ks.sproj/K).toFixed(3)+' in ('+(ks.sproj/K*25.4).toFixed(1)+' mm) along the knife face; head body radius '+(ks.Rb/K).toFixed(3)+' in.'},{lvl:'ok',key:'blank',msg:'Blank '+(ks.len/K).toFixed(3)+' x '+(ks.Hb/K).toFixed(3)+' x '+(ks.kt/K).toFixed(3)+' in ('+(ks.len/K*25.4).toFixed(1)+' x '+(ks.Hb/K*25.4).toFixed(1)+' x '+(ks.kt/K*25.4).toFixed(1)+' mm).'}];
  for(const w of ks.warns)o.push({lvl:'warn',key:'note',msg:w});return o;
}
export function report(c,K=1){
  const type=c.type||'bit',o={prof:c.prof||'roundover',pp:c.pp||{}},pr=profile(o.prof,o.pp,K),dims=Object.fromEntries(Object.keys(pr.defs).map(k=>[k,+(pr.p[k]/(pr.defs[k][2]?1:K)).toFixed(5)])),out={profile:{id:pr.id,name:pr.name,group:pr.group,kind:pr.kind,width_in:+(pr.w/K).toFixed(5),height_in:+(pr.h/K).toFixed(5),cut_area_in2:+(cutArea(pr)/K/K).toFixed(6),section_area_in2:pr.sec?+(secArea(pr)/K/K).toFixed(5):undefined,dims_in_deg:dims,notes:pr.warns}};
  if(type==='bit'||type==='shaper'){const f={type,...o,...(c[type]||{})},s=bitSpec(f,K);out.cutter={kind:s.kind,cutting_diameter_in:+(s.dia/K).toFixed(4),cutting_diameter_mm:+(s.dia/K*25.4).toFixed(2),cutting_length_in:+(s.H/K).toFixed(4),wings:s.n,carbide_in:+(s.ct/K).toFixed(4),shank_in:+(s.sd/K).toFixed(4),bearing:s.br?{od_in:s.br[0],id_in:s.br[1]}:null,hook:s.hook,shear:s.shear,relief:s.relief,volume_in3:+(bitVolume(s)/K**3).toFixed(5)};out.checks=checkBit(s,+c.rpm||0,K);}
  else if(type==='knife'){const ks=knifeSpec({...o,...(c.knife||{})},K);out.knife={cutting_circle_dia_in:+(ks.R*2/K).toFixed(3),hook:ks.hook,projection_in:+(ks.proj/K).toFixed(4),knife_depth_at_max_in:+(ks.smax/K).toFixed(5),molding_depth_at_max_in:+(ks.dmax/K).toFixed(5),blank_in:[+(ks.len/K).toFixed(4),+(ks.Hb/K).toFixed(4),+(ks.kt/K).toFixed(4)],head:ks.mode,points:ks.V.length};out.checks=checkKnife(ks);}
  if(pr.id==='stick'||pr.id==='cope'){const st=profile('stick',o.pp,K),cp=profile('cope',c.cope_pp||o.pp,K);out.fit=copeFit(st,cp,K);}
  return out;
}
export function silhouette(s){
  const Q=s.ord,zv=[...new Set(Q.map(q=>+q[1].toFixed(7)))].sort((a,b)=>a-b),env=zv.map(z=>[Math.max(...Q.filter(q=>Math.abs(q[1]-z)<1e-6).map(q=>q[0])),z+s.z0]),rc=s.core[s.core.length-1][0],zt=s.z0+s.H,P=[[0,0]];
  s.br&&P.push([s.od/2,0],[s.od/2,s.bt]);P.push([env[0][0],env[0][1]]);for(const e of env)P.push(e);P.push([env[env.length-1][0],zt],[rc,zt],[s.sd/2,zt+s.neck],[s.sd/2,zt+s.sl]);return P;
}
