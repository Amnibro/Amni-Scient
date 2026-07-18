function sampleBilin(field,fw,fh,u,v){
if(!field||!fw||!fh)return 0;
const x=Math.max(0,Math.min(1,u))*(fw-1),y=Math.max(0,Math.min(1,v))*(fh-1);
const x0=x|0,y0=y|0,x1=Math.min(fw-1,x0+1),y1=Math.min(fh-1,y0+1),fx=x-x0,fy=y-y0;
const i=(xx,yy)=>field[yy*fw+xx];
return i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx+((i(x0,y1)+(i(x1,y1)-i(x0,y1))*fx)-(i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx))*fy;
}
function degToUV(spd,dirDeg){
const r=((270-dirDeg)*Math.PI)/180;
return{u:spd*Math.cos(r),v:spd*Math.sin(r)};
}
export function createWindLayer(canvas,{lonToX,latToY,xToLon,yToLat,clampZoom,getView,PERF}){
const ctx=canvas.getContext('2d',{alpha:true});
let particles=[],running=false,raf=0,spdF=null,dirF=null,fw=0,fh=0,enabled=true,fade=0.88;
const N=()=>PERF.mobile?280:520;
function resize(){
const dpr=PERF.dpr;
const w=innerWidth,h=innerHeight;
canvas.width=(w*dpr)|0;canvas.height=(h*dpr)|0;
canvas.style.width=w+'px';canvas.style.height=h+'px';
seed();
}
function seed(){
const n=N();particles=new Array(n);
for(let i=0;i<n;i++)particles[i]=spawn(true);
}
function spawn(rand){
const v=getView();
const W=canvas.width,H=canvas.height;
return{
x:Math.random()*W,
y:Math.random()*H,
age:rand?Math.random()*80:0,
max:40+Math.random()*50,
px:0,py:0,ok:false
};
}
function setFields(speed,dir,w,h){spdF=speed;dirF=dir;fw=w;fh=h;if(!particles.length)seed();}
function setEnabled(on){enabled=!!on;if(!enabled){ctx.clearRect(0,0,canvas.width,canvas.height);}}
function llAt(px,py){
const v=getView();
const B=v.bm;const zf=clampZoom(v.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;
const cx=lonToX(v.lon,z)*scale*dpr,cy=latToY(v.lat,z)*scale*dpr;
const x=(cx-canvas.width/2+px)/(scale*dpr),y=(cy-canvas.height/2+py)/(scale*dpr);
return{lat:yToLat(y,z),lon:xToLon(x,z),z,scale,dpr};
}
function uvAt(px,py){
if(!spdF||!dirF)return{u:0,v:0,spd:0};
const {lat,lon}=llAt(px,py);
const u=((lon+180)/360%1+1)%1;
const vv=Math.max(0,Math.min(1,(85-lat)/170));
const spd=sampleBilin(spdF,fw,fh,u,vv);
const dir=sampleBilin(dirF,fw,fh,u,vv);
const w=degToUV(spd,dir);
return{...w,spd};
}
function step(){
if(!enabled||!spdF){raf=requestAnimationFrame(step);return;}
const W=canvas.width,H=canvas.height;
ctx.globalCompositeOperation='destination-in';
ctx.fillStyle=`rgba(0,0,0,${fade})`;
ctx.fillRect(0,0,W,H);
ctx.globalCompositeOperation='lighter';
const v=getView();
const B=v.bm;const zf=clampZoom(v.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const scalePx=0.9*scale*PERF.dpr*(PERF.mobile?0.55:0.75);
for(let i=0;i<particles.length;i++){
const p=particles[i];
const wind=uvAt(p.x,p.y);
const mag=Math.hypot(wind.u,wind.v)||0.01;
const nx=p.x+wind.u*scalePx*0.35;
const ny=p.y-wind.v*scalePx*0.35;
const t=Math.min(1,mag/25);
const col=`rgba(${40+t*180|0},${160+t*60|0},${220-t*80|0},${0.18+t*0.45})`;
if(p.ok){
ctx.beginPath();
ctx.strokeStyle=col;
ctx.lineWidth=PERF.mobile?1:1.25;
ctx.moveTo(p.px,p.py);
ctx.lineTo(p.x,p.y);
ctx.stroke();
}
p.px=p.x;p.py=p.y;p.x=nx;p.y=ny;p.age++;p.ok=true;
if(p.age>p.max||p.x<0||p.y<0||p.x>W||p.y>H){particles[i]=spawn(false);}
}
raf=requestAnimationFrame(step);
}
function start(){if(running)return;running=true;resize();raf=requestAnimationFrame(step);}
function stop(){running=false;cancelAnimationFrame(raf);}
function drawBarbs(ctx2,getSample,viewHelpers){}
return{resize,setFields,setEnabled,start,stop,seed};
}
export function drawIsobars(ctx,field,fw,fh,view,helpers,levels=6){
if(!field||!fw||!fh)return;
const {lonToX,latToY,yToLat,xToLon,clampZoom,PERF}=helpers;
const B=view.bm;const zf=clampZoom(view.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;const W=ctx.canvas.width,H=ctx.canvas.height;
const cx=lonToX(view.lon,z)*scale*dpr,cy=latToY(view.lat,z)*scale*dpr;
const left=cx-W/2,top=cy-H/2;
let mn=Infinity,mx=-Infinity;
const step=PERF.mobile?18:12;
const gridW=Math.ceil(W/step)+1,gridH=Math.ceil(H/step)+1;
const g=new Float32Array(gridW*gridH);
for(let j=0;j<gridH;j++){
for(let i=0;i<gridW;i++){
const px=i*step,py=j*step;
const lon=xToLon((left+px)/(scale*dpr),z);
const lat=yToLat((top+py)/(scale*dpr),z);
const u=((lon+180)/360%1+1)%1;
const v=Math.max(0,Math.min(1,(85-lat)/170));
const val=sampleBilin(field,fw,fh,u,v);
g[j*gridW+i]=val;
if(val<mn)mn=val;if(val>mx)mx=val;
}
}
if(!Number.isFinite(mn)||mx-mn<1e-3)return;
ctx.save();
ctx.strokeStyle='rgba(255,255,255,0.22)';
ctx.lineWidth=1;
ctx.setLineDash([4,6]);
for(let li=1;li<=levels;li++){
const thr=mn+(mx-mn)*(li/(levels+1));
ctx.beginPath();
for(let j=0;j<gridH-1;j++){
for(let i=0;i<gridW-1;i++){
const a=g[j*gridW+i],b=g[j*gridW+i+1],c=g[(j+1)*gridW+i],d=g[(j+1)*gridW+i+1];
const bits=(a>thr?1:0)|(b>thr?2:0)|(c>thr?4:0)|(d>thr?8:0);
if(!bits||bits===15)continue;
const x0=i*step,y0=j*step;
const lerp=(p,q,t)=>p+(q-p)*t;
const edge=(v0,v1,xA,yA,xB,yB)=>{const t=(thr-v0)/((v1-v0)||1e-6);return[lerp(xA,xB,t),lerp(yA,yB,t)];};
const pts=[];
if((bits&1)!==(bits&2)>>1)pts.push(edge(a,b,x0,y0,x0+step,y0));
if((bits&2)>>1!==(bits&8)>>3)pts.push(edge(b,d,x0+step,y0,x0+step,y0+step));
if((bits&4)>>2!==(bits&8)>>3)pts.push(edge(c,d,x0,y0+step,x0+step,y0+step));
if((bits&1)!==(bits&4)>>2)pts.push(edge(a,c,x0,y0,x0,y0+step));
if(pts.length>=2){ctx.moveTo(pts[0][0],pts[0][1]);ctx.lineTo(pts[1][0],pts[1][1]);}
}
}
ctx.stroke();
}
ctx.restore();
}
