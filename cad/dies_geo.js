const d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),dot=(a,b)=>a[0]*b[0]+a[1]*b[1],r4=v=>+(+v).toFixed(4);
export const PRI={cut:4,kiss:3,perf:2,crease:1},DXFCOL={cut:1,crease:5,perf:3,kiss:2};
export function arcOf(a,b,bu){const c=d2(a,b),th=4*Math.atan(Math.abs(bu)),r=bu&&c?c/(2*Math.sin(th/2)):Infinity,s=Math.sign(bu),m=[(a[0]+b[0])/2,(a[1]+b[1])/2],h=bu&&c?s*r*Math.cos(th/2):0,n=c?[-(b[1]-a[1])/c,(b[0]-a[0])/c]:[0,0];return{c,th,r,s,ctr:[m[0]+n[0]*h,m[1]+n[1]*h],len:bu?r*th:c};}
export const segLen=(a,b,bu)=>arcOf(a,b,bu).len;
export const plen=(pts,closed)=>pts.reduce((s,p,i)=>s+(i<pts.length-1||closed?segLen(p,pts[(i+1)%pts.length],p[2]||0):0),0);
export function polyArc(a,b,bu,tol=0.002){const A=arcOf(a,b,bu);if(!bu||!isFinite(A.r))return[];const n=Math.max(2,Math.ceil(A.th/(2*Math.acos(Math.max(0,1-tol/A.r))))),a0=Math.atan2(a[1]-A.ctr[1],a[0]-A.ctr[0]),o=[];for(let i=1;i<n;i++){const t=a0+A.s*A.th*i/n;o.push([A.ctr[0]+A.r*Math.cos(t),A.ctr[1]+A.r*Math.sin(t)]);}return o;}
export const toPoly=(pts,closed,tol=0.002)=>{const o=[];pts.forEach((p,i)=>{o.push([p[0],p[1]]);(i<pts.length-1||closed)&&o.push(...polyArc(p,pts[(i+1)%pts.length],p[2]||0,tol));});return o;};
export const area=P=>P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;
export const loopArea=pts=>{let s=0;const n=pts.length;for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n],bu=p[2]||0,A=arcOf(p,q,bu);s+=p[0]*q[1]-q[0]*p[1];bu&&isFinite(A.r)&&(s+=A.s*(A.r*A.r*(A.th-Math.sin(A.th))));}return s/2;};
export const bbox=paths=>{let x0=1e30,y0=1e30,x1=-1e30,y1=-1e30;for(const p of paths)for(const q of toPoly(p.pts,p.closed)){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}return{x0,y0,x1,y1,w:x1-x0,h:y1-y0};};
export const shift=(paths,dx,dy)=>paths.map(p=>({...p,pts:p.pts.map(q=>[q[0]+dx,q[1]+dy,q[2]||0])}));
export const dedupe=P=>P.filter((p,i)=>!i||d2(p,P[i-1])>1e-7);
export function offsetPoly(P,d,closed){P=dedupe(P);closed&&P.length>1&&d2(P[0],P[P.length-1])<1e-7&&P.pop();const n=P.length,nr=(a,b)=>{const L=d2(a,b)||1;return[-(b[1]-a[1])/L,(b[0]-a[0])/L];};return P.map((p,i)=>{const u=i||closed?nr(P[(i-1+n)%n],p):null,v=i<n-1||closed?nr(p,P[(i+1)%n]):null;if(!u)return[p[0]+v[0]*d,p[1]+v[1]*d];if(!v)return[p[0]+u[0]*d,p[1]+u[1]*d];const m=[u[0]+v[0],u[1]+v[1]],ml=Math.hypot(...m)||1,c=Math.max(0.3,dot(m,u)/ml);return[p[0]+m[0]/ml*d/c,p[1]+m[1]/ml*d/c];});}
export const slotOutline=(P,closed,d)=>closed?[offsetPoly(P,d,true),offsetPoly(P,-d,true)]:[[...offsetPoly(P,d,false),...offsetPoly(P,-d,false).reverse()]];
export function cum(P,closed){const s=[0],n=P.length,m=closed?n:n-1;for(let i=0;i<m;i++)s.push(s[i]+d2(P[i],P[(i+1)%n]));return s;}
export function ptAt(P,closed,s){const c=cum(P,closed),L=c[c.length-1],n=P.length;s=closed?((s%L)+L)%L:Math.max(0,Math.min(L,s));let i=0;while(i<c.length-2&&c[i+1]<s)i++;const t=(s-c[i])/((c[i+1]-c[i])||1),a=P[i],b=P[(i+1)%n];return{p:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],i,dir:[(b[0]-a[0])/((c[i+1]-c[i])||1),(b[1]-a[1])/((c[i+1]-c[i])||1)]};}
export function sliceRun(P,closed,s0,s1){const c=cum(P,closed),L=c[c.length-1],e=closed&&s1<s0?s1+L:s1,o=[ptAt(P,closed,s0).p],ext=closed?[...c.slice(0,-1),...c.slice(0,-1).map(v=>v+L)]:c.slice(),n=P.length;ext.forEach((sv,i)=>{sv>s0+1e-9&&sv<e-1e-9&&o.push([P[i%n][0],P[i%n][1]]);});o.push(ptAt(P,closed,e).p);return dedupe(o);}
export const ptSeg=(p,a,b)=>{const L2=(b[0]-a[0])**2+(b[1]-a[1])**2,t=L2?Math.max(0,Math.min(1,((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/L2)):0;return Math.hypot(p[0]-a[0]-t*(b[0]-a[0]),p[1]-a[1]-t*(b[1]-a[1]));};
export const inPoly=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)(P[i][1]>p[1])!==(P[j][1]>p[1])&&p[0]<(P[j][0]-P[i][0])*(p[1]-P[i][1])/(P[j][1]-P[i][1])+P[i][0]&&(c=!c);return c;};
export const toSegs=paths=>paths.flatMap(p=>{const n=p.pts.length,m=p.closed?n:n-1;return Array.from({length:Math.max(0,m)},(_,i)=>({a:[p.pts[i][0],p.pts[i][1]],b:[p.pts[(i+1)%n][0],p.pts[(i+1)%n][1]],bu:p.pts[i][2]||0,t:p.t||'cut'}));});
export function mergeCommon(segs,tol=2e-4){const out=[],A=new Map(),G=new Map(),hi=(t,u)=>(PRI[t]||0)>(PRI[u]||0);
  for(const s of segs){if(s.bu){const f=s.a[0]+s.a[1]<s.b[0]+s.b[1],p=f?s:{a:s.b,b:s.a,bu:-s.bu,t:s.t},k=[...p.a,...p.b,p.bu].map(v=>Math.round(v/tol)).join(',');(!A.has(k)||hi(s.t,A.get(k).t))&&A.set(k,p);continue;}
    const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],l=Math.hypot(dx,dy);if(l<1e-9)continue;let ux=dx/l,uy=dy/l;(ux<-1e-9||(Math.abs(ux)<1e-9&&uy<0))&&(ux=-ux,uy=-uy);
    const k=Math.round(Math.atan2(uy,ux)*2000)+':'+Math.round((-uy*s.a[0]+ux*s.a[1])/tol/2),p0=ux*s.a[0]+uy*s.a[1],p1=ux*s.b[0]+uy*s.b[1];let g=G.get(k);g||G.set(k,g={u:[ux,uy],o:s.a,s0:p0,L:[]});g.L.push({lo:Math.min(p0,p1),hi:Math.max(p0,p1),t:s.t});}
  for(const g of G.values()){const B=[...new Set(g.L.flatMap(q=>[q.lo,q.hi]).map(v=>+v.toFixed(6)))].sort((a,b)=>a-b),pt=s=>[g.o[0]+g.u[0]*(s-g.s0),g.o[1]+g.u[1]*(s-g.s0)];let cur=null;
    const put=()=>cur&&out.push({a:pt(cur.lo),b:pt(cur.hi),bu:0,t:cur.t});
    for(let i=0;i<B.length-1;i++){const p=B[i],q=B[i+1];if(q-p<1e-7)continue;let best=null;for(const e of g.L)e.lo<=p+1e-6&&e.hi>=q-1e-6&&(!best||hi(e.t,best))&&(best=e.t);
      if(best&&cur&&cur.t===best&&Math.abs(cur.hi-p)<1e-6)cur.hi=q;else{put();cur=best?{lo:p,hi:q,t:best}:null;}}put();}
  return[...out,...A.values()];}
export function chainSegs(segs,tol=2e-4){const key=p=>Math.round(p[0]/tol)+','+Math.round(p[1]/tol),N=new Map(),add=(k,i)=>N.has(k)?N.get(k).push(i):N.set(k,[i]),used=new Set(),out=[],flip=s=>({a:s.b,b:s.a,bu:-s.bu,t:s.t});segs.forEach((s,i)=>{add(key(s.a),i);add(key(s.b),i);});
  const nxt=(k,i)=>{const l=N.get(k);return l.length===2?l.find(j=>j!==i&&!used.has(j)&&segs[j].t===segs[i].t):undefined;};
  segs.forEach((s0,i0)=>{if(used.has(i0))return;used.add(i0);const ch=[s0];let i=i0,j;for(;;){const k=key(ch[ch.length-1].b);j=nxt(k,i);if(j===undefined)break;used.add(j);ch.push(key(segs[j].a)===k?segs[j]:flip(segs[j]));i=j;}i=i0;for(;;){const k=key(ch[0].a);j=nxt(k,i);if(j===undefined)break;used.add(j);ch.unshift(key(segs[j].b)===k?segs[j]:flip(segs[j]));i=j;}const closed=ch.length>1&&key(ch[0].a)===key(ch[ch.length-1].b),pts=ch.map(q=>[q.a[0],q.a[1],q.bu]);closed||pts.push([ch[ch.length-1].b[0],ch[ch.length-1].b[1],0]);out.push({t:s0.t,pts,closed});});
  return out;}
const KIND=[[/crease|score|fold|bend/i,'crease'],[/perf/i,'perf'],[/kiss|partial|half|slit/i,'kiss'],[/cut|die|outline|blank|knife|trim/i,'cut']],LT=[[/dash|hidden/i,'crease'],[/dot|phantom/i,'perf'],[/center|divide/i,'kiss']];
export const classify=e=>{const L=String(e.layer||''),k=KIND.find(([r])=>r.test(L)),l=LT.find(([r])=>r.test(String(e.ltype||'')));return k?k[1]:l?l[1]:({1:'cut',5:'crease',4:'crease',3:'perf',2:'kiss'})[e.color]||'cut';};
export function dxfWrite(ents,units='in'){const layers=[...new Set(ents.map(e=>e.layer))],o=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1015','9','$INSUNITS','70',units==='mm'?'4':'1','0','ENDSEC','0','SECTION','2','TABLES','0','TABLE','2','LTYPE','70','1','0','LTYPE','2','CONTINUOUS','70','0','3','Solid line','72','65','73','0','40','0','0','ENDTAB','0','TABLE','2','LAYER','70',String(layers.length)];for(const l of layers){const c=(ents.find(e=>e.layer===l)||{}).color||7;o.push('0','LAYER','2',l,'70','0','62',String(c),'6','CONTINUOUS');}o.push('0','ENDTAB','0','ENDSEC','0','SECTION','2','ENTITIES');for(const e of ents){o.push('0','LWPOLYLINE','8',e.layer,'62',String(e.color||256),'90',String(e.pts.length),'70',e.closed?'1':'0');for(const p of e.pts){o.push('10',String(r4(p[0])),'20',String(r4(p[1])));p[2]&&o.push('42',String(+(+p[2]).toFixed(6)));}}o.push('0','ENDSEC','0','EOF');return o.join('\n')+'\n';}
export function dxfRead(text){const L=String(text).split(/\r?\n/),pr=[];for(let i=0;i+1<L.length;i+=2)pr.push([parseInt(L[i].trim(),10),L[i+1].trim()]);let units='in',sec='',ents=[],cur=null,poly=null;
  const flush=()=>{cur&&(cur.kind==='VERTEX'?poly&&poly.pts.push([cur.x,cur.y,cur.b]):ents.push(cur));cur=null;};
  for(let i=0;i<pr.length;i++){const[c,v]=pr[i];
    if(c===9&&v==='$INSUNITS'){const u=pr[i+1]&&pr[i+1][1];units=u==='4'?'mm':u==='2'?'ft':u==='5'?'cm':'in';}
    if(c===0&&v==='SECTION'){sec=(pr[i+1]||[])[1];continue;}
    if(c===0&&v==='ENDSEC'){flush();poly&&ents.push(poly);poly=null;sec='';continue;}
    if(sec!=='ENTITIES')continue;
    if(c===0){flush();if(v==='SEQEND'){poly&&ents.push(poly);poly=null;}else if(v==='POLYLINE')poly={kind:'POLYLINE',layer:'0',pts:[],closed:false};else if(v==='VERTEX')cur={kind:'VERTEX',x:0,y:0,b:0};else{poly&&ents.push(poly);poly=null;cur={kind:v,layer:'0',pts:[],closed:false};}continue;}
    const t=cur||poly;if(!t)continue;
    if(c===8&&t.kind!=='VERTEX')t.layer=v;else if(c===62&&t.kind!=='VERTEX')t.color=Math.abs(parseInt(v,10));else if(c===6)t.ltype=v;
    else if(t.kind==='LWPOLYLINE'){if(c===70)t.closed=(parseInt(v,10)&1)===1;else if(c===10)t.pts.push([+v,0,0]);else if(c===20&&t.pts.length)t.pts[t.pts.length-1][1]=+v;else if(c===42&&t.pts.length)t.pts[t.pts.length-1][2]=+v;}
    else if(t.kind==='LINE'){if(c===10)t.x1=+v;else if(c===20)t.y1=+v;else if(c===11)t.x2=+v;else if(c===21)t.y2=+v;}
    else if(t.kind==='CIRCLE'||t.kind==='ARC'){if(c===10)t.cx=+v;else if(c===20)t.cy=+v;else if(c===40)t.r=+v;else if(c===50)t.a0=+v;else if(c===51)t.a1=+v;}
    else if(t.kind==='VERTEX'){if(c===10)t.x=+v;else if(c===20)t.y=+v;else if(c===42)t.b=+v;}
    else if(t.kind==='POLYLINE'&&c===70)t.closed=(parseInt(v,10)&1)===1;}
  flush();poly&&ents.push(poly);
  const out=[];for(const e of ents){const base={layer:e.layer,color:e.color,ltype:e.ltype};
    if(e.kind==='LINE')out.push({...base,pts:[[e.x1,e.y1,0],[e.x2,e.y2,0]],closed:false});
    else if(e.kind==='CIRCLE')out.push({...base,pts:[[e.cx+e.r,e.cy,1],[e.cx-e.r,e.cy,1]],closed:true});
    else if(e.kind==='ARC'){const a0=e.a0*Math.PI/180;let a1=e.a1*Math.PI/180;a1<=a0&&(a1+=Math.PI*2);out.push({...base,pts:[[e.cx+e.r*Math.cos(a0),e.cy+e.r*Math.sin(a0),Math.tan((a1-a0)/4)],[e.cx+e.r*Math.cos(a1),e.cy+e.r*Math.sin(a1),0]],closed:false});}
    else if((e.kind==='LWPOLYLINE'||e.kind==='POLYLINE')&&e.pts.length>1)out.push({...base,pts:e.pts,closed:e.closed});}
  return{units,ents:out};}
export const K_IN={in:1,mm:1/25.4,ft:12,cm:1/2.54};
export function layoutFromDxf(text,units){const r=dxfRead(text),k=K_IN[units||r.units]||1,ps=r.ents.map(e=>({t:classify(e),pts:e.pts.map(p=>[p[0]*k,p[1]*k,p[2]||0]),closed:e.closed})),b=bbox(ps);return{units:'in',srcUnits:units||r.units,paths:chainSegs(mergeCommon(toSegs(shift(ps,-b.x0,-b.y0))))};}
