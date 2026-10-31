// DXF flat pattern to a sheet part: closed outer profile plus holes, extruded to the chosen thickness (inches).
import{layoutFromDxf}from'./dies_geo.js';
const area=p=>{let a=0;for(let i=0;i<p.length;i++){const q=p[i],r=p[(i+1)%p.length];a+=q[0]*r[1]-r[0]*q[1];}return a/2;};
const inside=(pt,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>pt[1])!==(b[1]>pt[1])&&pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const r5=v=>Math.round(v*1e5)/1e5;
export function read(text,o={}){const L=layoutFromDxf(text,o.units),loops=L.paths.filter(p=>p.closed&&p.pts.length>1).map(p=>({pts:p.pts.map(q=>[r5(q[0]),r5(q[1])]),bulge:p.pts.map(q=>+q[2]||0)})),open=L.paths.length-loops.length;
  if(!loops.length)return{error:'No closed outline found in the DXF',open};
  loops.forEach(l=>l.a=Math.abs(area(l.pts))+bulgeArea(l));loops.sort((a,b)=>b.a-a.a);const out=loops[0],holes=loops.slice(1).filter(l=>inside(l.pts[0],out.pts)),stray=loops.length-1-holes.length;
  let x0=1/0,y0=1/0,x1=-1/0,y1=-1/0;for(const[x,y]of out.pts){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  return{units:L.srcUnits,size:[r5(x1-x0),r5(y1-y0)],outer:out,holes,open,stray,warn:[open&&open+' open path'+(open>1?'s':'')+' ignored',stray&&stray+' closed loop'+(stray>1?'s':'')+' outside the outline ignored'].filter(Boolean)};}
function bulgeArea(l){let a=0;for(let i=0;i<l.pts.length;i++){const b=l.bulge[i];if(!b)continue;const p=l.pts[i],q=l.pts[(i+1)%l.pts.length],c=Math.hypot(q[0]-p[0],q[1]-p[1]),th=4*Math.atan(Math.abs(b)),r=c/(2*Math.sin(th/2));a+=(r*r/2)*(th-Math.sin(th))*Math.sign(b)*Math.sign(area(l.pts)||1);}return a;}
// Kernel path arcs take a signed sagitta in model units; DXF stores bulge=tan(sweep/4), so sagitta=-bulge*chord/2 (sign checked against a known rounded plate in tests/shopint_test.mjs).
const sag=l=>l.bulge.map((b,i)=>{if(!b)return 0;const p=l.pts[i],q=l.pts[(i+1)%l.pts.length];return r5(-b*Math.hypot(q[0]-p[0],q[1]-p[1])/2);});
const shape=(l,hole)=>{if(l.pts.length===2&&Math.abs(Math.abs(l.bulge[0])-1)<1e-6&&Math.abs(Math.abs(l.bulge[1])-1)<1e-6){const[a,b]=l.pts;return{k:'circle',r:r5(Math.hypot(b[0]-a[0],b[1]-a[1])/2),x:r5((a[0]+b[0])/2),y:r5((a[1]+b[1])/2),...(hole?{hole:true}:{})};}return{k:'path',pts:l.pts,bulge:sag(l),...(hole?{hole:true}:{})};};
export function doc(P,t=0.125,o={}){return{name:o.name||'Flat part',units:'in',...(o.material?{material:o.material}:{}),params:[],features:[{id:'flat',type:'extrude',plane:'XY',depth:+t,shapes:[shape(P.outer,false),...P.holes.map(h=>shape(h,true))]}]};}
export function svg(P,o={}){const W=P.size[0]||1,H=P.size[1]||1,pad=Math.max(W,H)*.04,seg=l=>{let d='';l.pts.forEach((p,i)=>{const q=l.pts[(i+1)%l.pts.length],b=l.bulge[i];if(!i)d+='M'+p[0]+' '+(-p[1]);if(b){const c=Math.hypot(q[0]-p[0],q[1]-p[1]),th=4*Math.atan(Math.abs(b)),r=c/(2*Math.sin(th/2));d+='A'+r5(r)+' '+r5(r)+' 0 '+(th>Math.PI?1:0)+' '+(b>0?0:1)+' '+q[0]+' '+(-q[1]);}else d+='L'+q[0]+' '+(-q[1]);});return d+'Z';};
  return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+[-pad,-H-pad,W+2*pad,H+2*pad].map(r5).join(' ')+'"><path fill-rule="evenodd" fill="'+(o.fill||'currentColor')+'" fill-opacity=".14" stroke="'+(o.stroke||'currentColor')+'" stroke-width="'+r5(Math.max(W,H)/220)+'" d="'+[P.outer,...P.holes].map(seg).join('')+'"/></svg>';}
