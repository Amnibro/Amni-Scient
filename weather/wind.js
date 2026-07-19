function sampleBilin(field,fw,fh,u,v){
if(!field||!fw||!fh)return 0;
const x=Math.max(0,Math.min(1,u))*(fw-1),y=Math.max(0,Math.min(1,v))*(fh-1);
const x0=x|0,y0=y|0,x1=Math.min(fw-1,x0+1),y1=Math.min(fh-1,y0+1),fx=x-x0,fy=y-y0;
const i=(xx,yy)=>field[yy*fw+xx];
return i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx+((i(x0,y1)+(i(x1,y1)-i(x0,y1))*fx)-(i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx))*fy;
}
function meteoToUV(spd,dirFromDeg){
const r=dirFromDeg*Math.PI/180;
return{u:-spd*Math.sin(r),v:-spd*Math.cos(r)};
}
export function createWindLayer(canvas,{lonToX,latToY,xToLon,yToLat,clampZoom,getView,PERF}){
const ctx=canvas.getContext('2d',{alpha:true});
let particles=[],running=false,raf=0,uF=null,vF=null,fw=0,fh=0,enabled=true;
let lastT=0,bounds={lat0:-85,lat1:85,lon0:-180,lon1:180};
let lastView={lat:NaN,lon:NaN,zoom:NaN},skipTrails=0;
const N=()=>PERF.mobile?160:380;
function resize(){
const dpr=PERF.dpr;const w=innerWidth,h=innerHeight;
canvas.width=(w*dpr)|0;canvas.height=(h*dpr)|0;
canvas.style.width=w+'px';canvas.style.height=h+'px';
seed(true);
}
function seed(hard){
const n=N();
if(hard||particles.length!==n)particles=new Array(n);
for(let i=0;i<n;i++)particles[i]=spawn(true);
lastT=0;skipTrails=2;
const v=getView();lastView={lat:v.lat,lon:v.lon,zoom:v.zoom};
}
function spawn(randAge){
const view=getView();
const spanLat=Math.min(50,70/Math.pow(2,Math.max(0,view.zoom-1.5)));
const spanLon=Math.min(100,140/Math.pow(2,Math.max(0,view.zoom-1.5)));
const lat=view.lat+(Math.random()-0.5)*spanLat;
const lon=view.lon+(Math.random()-0.5)*spanLon;
return{lat:Math.max(-85,Math.min(85,lat)),lon:((lon+540)%360)-180,age:randAge?Math.random()*60:0,max:40+Math.random()*35};
}
function setFields(uField,vField,w,h,b){
uF=uField;vF=vField;fw=w;fh=h;
if(b)bounds=b;
if(!particles.length)seed(true);
}
function setEnabled(on){enabled=!!on;if(!enabled)ctx.clearRect(0,0,canvas.width,canvas.height);}
function uvAtLatLon(lat,lon){
if(!uF||!vF)return{u:0,v:0,spd:0};
const uu=((lon-bounds.lon0)/Math.max(1e-6,bounds.lon1-bounds.lon0));
const vv=(bounds.lat1-lat)/Math.max(1e-6,bounds.lat1-bounds.lat0);
const u=sampleBilin(uF,fw,fh,((uu%1)+1)%1,Math.max(0,Math.min(1,vv)));
const v=sampleBilin(vF,fw,fh,((uu%1)+1)%1,Math.max(0,Math.min(1,vv)));
return{u,v,spd:Math.hypot(u,v)};
}
function project(lat,lon){
const view=getView();const B=view.bm;
const zf=clampZoom(view.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;
const cx=lonToX(view.lon,z)*scale*dpr,cy=latToY(view.lat,z)*scale*dpr;
const x=lonToX(lon,z)*scale*dpr-cx+canvas.width/2;
const y=latToY(lat,z)*scale*dpr-cy+canvas.height/2;
return{x,y};
}
function viewShifted(view){
if(!Number.isFinite(lastView.zoom))return true;
const dz=Math.abs(view.zoom-lastView.zoom);
const dlat=Math.abs(view.lat-lastView.lat);
const dlon=Math.abs(((view.lon-lastView.lon+540)%360)-180);
const thrLat=12/Math.pow(2,Math.max(0,view.zoom-2));
const thrLon=20/Math.pow(2,Math.max(0,view.zoom-2));
return dz>0.08||dlat>thrLat||dlon>thrLon;
}
function step(now){
raf=requestAnimationFrame(step);
if(!enabled)return;
const view=getView();
if(view.panning){ctx.clearRect(0,0,canvas.width,canvas.height);lastT=now;return;}
if(viewShifted(view)){seed(false);lastView={lat:view.lat,lon:view.lon,zoom:view.zoom};}
const dt=Math.min(0.033,(now-(lastT||now))/1000);lastT=now;
const W=canvas.width,H=canvas.height;
ctx.clearRect(0,0,W,H);
if(!uF||!vF)return;
if(skipTrails>0){skipTrails--;for(let i=0;i<particles.length;i++){const p=particles[i];const b=project(p.lat,p.lon);if(b.x<-20||b.y<-20||b.x>W+20||b.y>H+20)particles[i]=spawn(false);}return;}
const speedScale=PERF.mobile?0.45:0.75;
const maxStep=PERF.mobile?0.35:0.55;
ctx.lineWidth=PERF.mobile?1:1.25;
ctx.lineCap='round';
const maxSeg=PERF.mobile?28:48;
for(let i=0;i<particles.length;i++){
const p=particles[i];
const wind=uvAtLatLon(p.lat,p.lon);
const mps=Math.hypot(wind.u,wind.v)||0.01;
let dLon=(wind.u*dt*speedScale*10)/(111320*Math.max(0.2,Math.cos(p.lat*Math.PI/180)));
let dLat=(wind.v*dt*speedScale*10)/111320;
const stepMag=Math.hypot(dLon,dLat);
if(stepMag>maxStep*0.01){const s=(maxStep*0.01)/stepMag;dLon*=s;dLat*=s;}
const lat0=p.lat,lon0=p.lon;
p.lat=Math.max(-85,Math.min(85,p.lat+dLat));
p.lon=((p.lon+dLon+540)%360)-180;
p.age++;
const a=project(lat0,lon0),b=project(p.lat,p.lon);
const seg=Math.hypot(b.x-a.x,b.y-a.y);
if(Number.isFinite(a.x)&&Number.isFinite(b.x)&&seg>0.4&&seg<maxSeg){
const t=Math.min(1,mps/22);
ctx.strokeStyle=`rgba(${50+t*170|0},${170+t*50|0},${230-t*90|0},${0.22+t*0.45})`;
ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
}
const off=b.x<-50||b.y<-50||b.x>W+50||b.y>H+50;
if(p.age>p.max||off||seg>=maxSeg)particles[i]=spawn(false);
}
lastView={lat:view.lat,lon:view.lon,zoom:view.zoom};
}
function start(){if(running)return;running=true;resize();lastT=0;raf=requestAnimationFrame(step);}
function stop(){running=false;cancelAnimationFrame(raf);}
function onViewChange(){seed(false);}
return{resize,setFields,setEnabled,start,stop,seed,onViewChange};
}
export function buildIsoPolylines(field,fw,fh,bounds,levels=6){
if(!field||!fw||!fh)return[];
let mn=Infinity,mx=-Infinity;
for(let i=0;i<field.length;i++){const v=field[i];if(v<mn)mn=v;if(v>mx)mx=v;}
if(!Number.isFinite(mn)||mx-mn<1e-3)return[];
const lines=[];
const step=Math.max(2,Math.floor(Math.min(fw,fh)/48));
for(let li=1;li<=levels;li++){
const thr=mn+(mx-mn)*(li/(levels+1));
const segs=[];
for(let j=0;j<fh-1;j+=step){
for(let i=0;i<fw-1;i+=step){
const a=field[j*fw+i],b=field[j*fw+Math.min(fw-1,i+step)];
const c=field[Math.min(fh-1,j+step)*fw+i],d=field[Math.min(fh-1,j+step)*fw+Math.min(fw-1,i+step)];
const bits=(a>thr?1:0)|(b>thr?2:0)|(c>thr?4:0)|(d>thr?8:0);
if(!bits||bits===15)continue;
const lon=x=>{const u=x/(fw-1);return bounds.lon0+(bounds.lon1-bounds.lon0)*u;};
const lat=y=>{const v=y/(fh-1);return bounds.lat1+(bounds.lat0-bounds.lat1)*v;};
const edge=(v0,v1,x0,y0,x1,y1)=>{const t=(thr-v0)/((v1-v0)||1e-6);return{lat:lat(y0+(y1-y0)*t),lon:lon(x0+(x1-x0)*t)};};
const pts=[];
if((bits&1)!==((bits&2)>>1))pts.push(edge(a,b,i,j,i+step,j));
if(((bits&2)>>1)!==((bits&8)>>3))pts.push(edge(b,d,i+step,j,i+step,j+step));
if(((bits&4)>>2)!==((bits&8)>>3))pts.push(edge(c,d,i,j+step,i+step,j+step));
if((bits&1)!==((bits&4)>>2))pts.push(edge(a,c,i,j,i,j+step));
if(pts.length>=2)segs.push([pts[0],pts[1]]);
}
}
lines.push({thr,segs});
}
return lines;
}
export function drawIsoPolylines(ctx,lines,project,PERF){
if(!lines?.length)return;
ctx.save();
ctx.lineWidth=(PERF.mobile?0.9:1.15)* (PERF.dpr||1);
ctx.strokeStyle='rgba(220,235,255,0.45)';
for(const L of lines){
for(const seg of L.segs){
const a=project(seg[0].lat,seg[0].lon),b=project(seg[1].lat,seg[1].lon);
if(!Number.isFinite(a.x)||!Number.isFinite(b.x))continue;
ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
}
}
ctx.restore();
}
export{meteoToUV};
