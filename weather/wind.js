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
const N=()=>PERF.mobile?220:420;
function resize(){
const dpr=PERF.dpr;const w=innerWidth,h=innerHeight;
canvas.width=(w*dpr)|0;canvas.height=(h*dpr)|0;
canvas.style.width=w+'px';canvas.style.height=h+'px';
seed();
}
function seed(){
const n=N();particles=new Array(n);
for(let i=0;i<n;i++)particles[i]=spawn(true);
}
function spawn(randAge){
const view=getView();
const lat=view.lat+(Math.random()-0.5)*Math.min(40,90/Math.pow(2,Math.max(0,view.zoom-2)));
const lon=view.lon+(Math.random()-0.5)*Math.min(80,180/Math.pow(2,Math.max(0,view.zoom-2)));
return{lat,lon,age:randAge?Math.random()*70:0,max:50+Math.random()*40,px:NaN,py:NaN};
}
function setFields(uField,vField,w,h,b){
uF=uField;vF=vField;fw=w;fh=h;
if(b)bounds=b;
if(!particles.length)seed();
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
return{x,y,z,scale,dpr};
}
function step(now){
raf=requestAnimationFrame(step);
if(!enabled)return;
const dt=Math.min(0.05,(now-(lastT||now))/1000);lastT=now;
const W=canvas.width,H=canvas.height;
ctx.clearRect(0,0,W,H);
if(!uF||!vF)return;
const view=getView();
const B=view.bm;const zf=clampZoom(view.zoom,B);const z=Math.floor(zf);
const mPerPx=156543.03392*Math.cos(view.lat*Math.PI/180)/Math.pow(2,z);
const speedScale=PERF.mobile?0.55:0.85;
ctx.lineWidth=PERF.mobile?1.1:1.35;
ctx.lineCap='round';
for(let i=0;i<particles.length;i++){
const p=particles[i];
const wind=uvAtLatLon(p.lat,p.lon);
const mps=Math.hypot(wind.u,wind.v)||0.01;
const dLon=(wind.u*dt*speedScale*12)/(111320*Math.max(0.2,Math.cos(p.lat*Math.PI/180)));
const dLat=(wind.v*dt*speedScale*12)/111320;
const lat0=p.lat,lon0=p.lon;
p.lat=Math.max(-85,Math.min(85,p.lat+dLat));
p.lon=((p.lon+dLon+540)%360)-180;
p.age++;
const a=project(lat0,lon0),b=project(p.lat,p.lon);
if(Number.isFinite(a.x)&&Number.isFinite(b.x)){
const t=Math.min(1,mps/22);
ctx.strokeStyle=`rgba(${50+t*170|0},${170+t*50|0},${230-t*90|0},${0.25+t*0.5})`;
ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
}
const off=b.x<-40||b.y<-40||b.x>W+40||b.y>H+40;
if(p.age>p.max||off)particles[i]=spawn(false);
}
}
function start(){if(running)return;running=true;resize();lastT=0;raf=requestAnimationFrame(step);}
function stop(){running=false;cancelAnimationFrame(raf);}
return{resize,setFields,setEnabled,start,stop,seed};
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
export function drawIsoPolylines(ctx,isoLines,projectFn,PERF){
if(!isoLines?.length)return;
ctx.save();
ctx.setLineDash([5,7]);
ctx.lineWidth=1;
ctx.strokeStyle='rgba(255,255,255,0.28)';
for(const band of isoLines){
ctx.beginPath();
for(const seg of band.segs){
const a=projectFn(seg[0].lat,seg[0].lon);
const b=projectFn(seg[1].lat,seg[1].lon);
if(!Number.isFinite(a.x)||!Number.isFinite(b.x))continue;
ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
}
ctx.stroke();
}
ctx.restore();
}
export function drawIsobars(){}
