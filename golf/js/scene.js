import*as THREE from"three";
import{OrbitControls}from"three/addons/controls/OrbitControls.js";
const texCache=new Map();
function createRenderer(canvas){
const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
r.setPixelRatio(Math.min(devicePixelRatio,2));
r.setSize(innerWidth,innerHeight,false);
r.shadowMap.enabled=true;
r.shadowMap.type=THREE.PCFSoftShadowMap;
r.outputColorSpace=THREE.SRGBColorSpace;
r.toneMapping=THREE.ACESFilmicToneMapping;
r.toneMappingExposure=1.08;
return r;
}
function createWorld(){
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,0.1,400);
camera.position.set(0,10,14);
const hemi=new THREE.HemisphereLight(0xffffff,0x3a5a40,0.8);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2d8,1.25);
sun.position.set(22,32,14);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.near=1;sun.shadow.camera.far=100;
sun.shadow.camera.left=-50;sun.shadow.camera.right=50;
sun.shadow.camera.top=50;sun.shadow.camera.bottom=-50;
sun.shadow.bias=-0.00025;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xa0c0ff,0.28);
fill.position.set(-12,9,-10);
scene.add(fill);
const amb=new THREE.AmbientLight(0xffffff,0.12);
scene.add(amb);
return{scene,camera,sun,hemi};
}
function disposeGroup(g){
g.traverse(o=>{
if(o.geometry)o.geometry.dispose();
if(o.material){
const mats=Array.isArray(o.material)?o.material:[o.material];
mats.forEach(m=>{if(m.map){}m.dispose()});
}
});
g.clear();
}
function hexRgb(hex){
const h=typeof hex==="number"?hex:parseInt(String(hex).replace("#",""),16);
return[(h>>16)&255,(h>>8)&255,h&255];
}
function makeNoiseTex(key,baseHex,altHex,mode="grass",size=256,rep=10){
const ck=`${key}_${baseHex}_${altHex}_${mode}_${size}`;
if(texCache.has(ck))return texCache.get(ck);
const c=document.createElement("canvas");c.width=c.height=size;
const ctx=c.getContext("2d");
const[br,bg,bb]=hexRgb(baseHex);
const[ar,ag,ab]=hexRgb(altHex);
ctx.fillStyle=`rgb(${br},${bg},${bb})`;
ctx.fillRect(0,0,size,size);
const n=mode==="grass"?9000:mode==="sand"?5000:mode==="rock"?3500:mode==="dirt"?4000:mode==="neon"?2000:4500;
for(let i=0;i<n;i++){
const x=Math.random()*size,y=Math.random()*size;
const t=Math.random();
const r=br+(ar-br)*t|0,g=bg+(ag-bg)*t|0,b=bb+(ab-bb)*t|0;
if(mode==="grass"){
ctx.strokeStyle=`rgba(${r},${g},${b},${0.35+Math.random()*0.45})`;
ctx.beginPath();
ctx.moveTo(x,y);
ctx.lineTo(x+(Math.random()-0.5)*3,y-2-Math.random()*4);
ctx.lineWidth=0.6+Math.random();
ctx.stroke();
}else if(mode==="sand"){
const s=0.8+Math.random()*1.8;
ctx.fillStyle=`rgba(${r},${g},${b},${0.25+Math.random()*0.4})`;
ctx.fillRect(x,y,s,s);
}else if(mode==="rock"){
ctx.fillStyle=`rgba(${r},${g},${b},${0.3+Math.random()*0.5})`;
ctx.beginPath();ctx.arc(x,y,1+Math.random()*3,0,6.28);ctx.fill();
}else if(mode==="neon"){
ctx.fillStyle=`rgba(${r},${g},${b},${0.4+Math.random()*0.5})`;
ctx.fillRect(x,y,2+Math.random()*6,1);
if(Math.random()<0.08){ctx.fillStyle=`rgba(255,255,255,0.5)`;ctx.fillRect(x,y,8,1)}
}else{
ctx.fillStyle=`rgba(${r},${g},${b},${0.2+Math.random()*0.5})`;
ctx.fillRect(x,y,1+Math.random()*2,1+Math.random()*2);
}
}
if(mode==="grass"){
for(let i=0;i<40;i++){
ctx.fillStyle=`rgba(${ar},${ag},${ab},0.15)`;
ctx.beginPath();ctx.ellipse(Math.random()*size,Math.random()*size,8+Math.random()*20,4+Math.random()*10,Math.random()*3,0,6.28);ctx.fill();
}
}
const tex=new THREE.CanvasTexture(c);
tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
tex.repeat.set(rep,rep);
tex.colorSpace=THREE.SRGBColorSpace;
tex.anisotropy=4;
texCache.set(ck,tex);
return tex;
}
function M(color,o={}){
const mat=new THREE.MeshStandardMaterial({
color,roughness:o.rough??0.85,metalness:o.metal??0.04,
emissive:o.em??0x000000,emissiveIntensity:o.emi??0,
transparent:!!o.tr,opacity:o.op??1,side:o.side??THREE.FrontSide,
map:o.map||null,normalScale:o.nscale?new THREE.Vector2(o.nscale,o.nscale):undefined
});
if(o.map)mat.map=o.map;
return mat;
}
function flatRibbon(left,right,yOff,mat){
const n=Math.min(left.length,right.length);
if(n<2)return null;
const pos=new Float32Array(n*2*3);
const uv=new Float32Array(n*2*2);
const idx=[];
let dist=0;
const yo=yOff||0;
for(let i=0;i<n;i++){
if(i>0)dist+=Math.hypot(left[i].x-left[i-1].x,left[i].z-left[i-1].z);
const u=dist*0.28;
const L=left[i],R=right[i];
const y=((L.y||0)+(R.y||0))*0.5+yo;
const i0=i*2,i1=i*2+1;
pos[i0*3]=L.x;pos[i0*3+1]=y;pos[i0*3+2]=L.z;
pos[i1*3]=R.x;pos[i1*3+1]=y;pos[i1*3+2]=R.z;
uv[i0*2]=0;uv[i0*2+1]=u;
uv[i1*2]=1;uv[i1*2+1]=u;
if(i<n-1){const a=i0,b=i1,c=i0+2,d=i1+2;idx.push(a,b,c,b,d,c)}
}
const geo=new THREE.BufferGeometry();
geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));
geo.setIndex(idx);
geo.computeVertexNormals();
if(mat){mat.flatShading=false;mat.polygonOffset=true;mat.polygonOffsetFactor=-1;mat.polygonOffsetUnits=-1}
const mesh=new THREE.Mesh(geo,mat);
mesh.receiveShadow=true;
return mesh;
}
function expand(left,right,extra){
const L=[],R=[];
const n=Math.min(left.length,right.length);
for(let i=0;i<n;i++){
const lx=left[i].x,lz=left[i].z,rx=right[i].x,rz=right[i].z;
const mx=(lx+rx)*0.5,mz=(lz+rz)*0.5,y=((left[i].y||0)+(right[i].y||0))*0.5;
let dx=lx-mx,dz=lz-mz,len=Math.hypot(dx,dz)||1;
const s=(len+extra)/len;
L.push({x:mx+dx*s,z:mz+dz*s,y});
R.push({x:mx-dx*s,z:mz-dz*s,y});
}
return{L,R};
}
function smoothRailMesh(edge,railH,thick,mat){
const n=edge.length;
if(n<2)return null;
const half=thick*0.5;
const verts=[],uvs=[],idx=[];
let dist=0;
for(let i=0;i<n;i++){
if(i>0)dist+=Math.hypot(edge[i].x-edge[i-1].x,edge[i].z-edge[i-1].z);
const a=edge[Math.max(0,i-1)],b=edge[Math.min(n-1,i+1)];
let tx=b.x-a.x,tz=b.z-a.z,tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
const nx=-tz,nz=tx;
const p=edge[i],y=p.y||0,h=railH;
const ox=nx*half,oz=nz*half;
const base=verts.length/3;
verts.push(p.x+ox,y,p.z+oz,p.x-ox,y,p.z-oz,p.x-ox,y+h,p.z-oz,p.x+ox,y+h,p.z+oz);
const u=dist*0.4;
uvs.push(0,u,1,u,1,u+0.2,0,u+0.2);
if(i<n-1){
const b0=base,b1=base+4;
idx.push(b0,b0+1,b1,b0+1,b1+1,b1);
idx.push(b0+1,b0+2,b1+1,b0+2,b1+2,b1+1);
idx.push(b0+2,b0+3,b1+2,b0+3,b1+3,b1+2);
idx.push(b0+3,b0,b1+3,b0,b1,b1+3);
}
}
const geo=new THREE.BufferGeometry();
geo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
geo.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
geo.setIndex(idx);
geo.computeVertexNormals();
if(mat){mat.flatShading=false}
const mesh=new THREE.Mesh(geo,mat);
mesh.castShadow=true;mesh.receiveShadow=true;
return mesh;
}
function smoothRailCap(edge,railH,thick,mat){
const n=edge.length;
if(n<2)return null;
const half=thick*0.58;
const pos=new Float32Array(n*2*3);
const uv=new Float32Array(n*2*2);
const idx=[];
let dist=0;
for(let i=0;i<n;i++){
if(i>0)dist+=Math.hypot(edge[i].x-edge[i-1].x,edge[i].z-edge[i-1].z);
const a=edge[Math.max(0,i-1)],b=edge[Math.min(n-1,i+1)];
let tx=b.x-a.x,tz=b.z-a.z,tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
const nx=-tz,nz=tx;
const p=edge[i],y=(p.y||0)+railH+0.02;
const i0=i*2,i1=i*2+1;
pos[i0*3]=p.x+nx*half;pos[i0*3+1]=y;pos[i0*3+2]=p.z+nz*half;
pos[i1*3]=p.x-nx*half;pos[i1*3+1]=y;pos[i1*3+2]=p.z-nz*half;
uv[i0*2]=0;uv[i0*2+1]=dist*0.4;uv[i1*2]=1;uv[i1*2+1]=dist*0.4;
if(i<n-1)idx.push(i0,i1,i0+2,i1,i1+2,i0+2);
}
const geo=new THREE.BufferGeometry();
geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));
geo.setIndex(idx);geo.computeVertexNormals();
const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;return mesh;
}
function sandDivotGeo(radius,depth){
const pts=[];
const steps=14;
for(let i=0;i<=steps;i++){
const t=i/steps;
const r=radius*t;
const y=-depth*Math.sin(t*Math.PI*0.5)*Math.sin(t*Math.PI*0.5);
const yy=t<0.08?-depth:y;
pts.push(new THREE.Vector2(r,yy));
}
pts.push(new THREE.Vector2(radius*1.02,0.002));
pts.push(new THREE.Vector2(radius*1.08,0.01));
return new THREE.LatheGeometry(pts,40);
}
function addWall(g,w,biome,railMap){
const baseY=w.cy||0;
const m=M(biome.rail,{rough:biome.id===5||biome.id===7?0.28:0.72,metal:biome.id===5||biome.id===7?0.72:0.08,em:biome.id===5||biome.id===7?biome.rail:0,emi:biome.id===5||biome.id===7?0.45:0,map:railMap});
const body=new THREE.Mesh(new THREE.BoxGeometry(w.sx,w.h,w.sz),m);
body.position.set(w.cx,baseY+w.h*0.5,w.cz);
body.rotation.y=w.rot;
body.castShadow=true;body.receiveShadow=true;
g.add(body);
const capCol=biome.id===5||biome.id===7?biome.accent:biome.id===2?0xa8c8d8:0x8a5528;
const cap=new THREE.Mesh(new THREE.BoxGeometry(w.sx*1.18,0.08,w.sz),M(capCol,{rough:0.45,metal:biome.id===5||biome.id===7?0.55:0.12,em:biome.id===5||biome.id===7?biome.accent:0,emi:biome.id===5||biome.id===7?0.3:0}));
cap.position.set(w.cx,baseY+w.h+0.04,w.cz);
cap.rotation.y=w.rot;
cap.castShadow=true;
g.add(cap);
}
function addCup(g,hole,b,greenMap){
const gx=hole.cup.x,gz=hole.cup.z,gy=hole.cup.y||0,gr=hole.greenR;
const CUP_R=0.155,CUP_D=0.38;
const apron=new THREE.Mesh(new THREE.CylinderGeometry(gr+0.65,gr+0.85,0.04,48),M(b.fairway,{rough:0.78,map:greenMap}));
apron.position.set(gx,gy+0.02,gz);apron.receiveShadow=true;g.add(apron);
const green=new THREE.Mesh(new THREE.CylinderGeometry(gr,gr,0.05,48),M(b.grass,{rough:0.62,map:greenMap}));
green.position.set(gx,gy+0.045,gz);green.receiveShadow=true;g.add(green);
const collar=new THREE.Mesh(new THREE.RingGeometry(CUP_R+0.01,CUP_R+0.09,32),M(b.grass,{rough:0.55,side:THREE.DoubleSide,map:greenMap}));
collar.rotation.x=-Math.PI/2;collar.position.set(gx,gy+0.072,gz);g.add(collar);
const wall=new THREE.Mesh(new THREE.CylinderGeometry(CUP_R,CUP_R*0.92,CUP_D,28,1,true),M(0x1a1a1a,{rough:0.95,side:THREE.DoubleSide}));
wall.position.set(gx,gy-CUP_D*0.5+0.04,gz);g.add(wall);
const liner=new THREE.Mesh(new THREE.CylinderGeometry(CUP_R*0.98,CUP_R*0.9,CUP_D*0.85,28,1,true),M(0x2a2a28,{rough:0.35,metal:0.55}));
liner.position.set(gx,gy-CUP_D*0.42+0.04,gz);g.add(liner);
const bottom=new THREE.Mesh(new THREE.CircleGeometry(CUP_R*0.9,24),M(0x0a0a0a,{rough:1}));
bottom.rotation.x=-Math.PI/2;bottom.position.set(gx,gy-CUP_D+0.05,gz);g.add(bottom);
const voidFill=new THREE.Mesh(new THREE.CircleGeometry(CUP_R*0.99,24),M(0x050505,{rough:1}));
voidFill.rotation.x=-Math.PI/2;voidFill.position.set(gx,gy+0.068,gz);g.add(voidFill);
const lip=new THREE.Mesh(new THREE.TorusGeometry(CUP_R+0.01,0.012,8,28),M(0x333330,{metal:0.35,rough:0.4}));
lip.rotation.x=Math.PI/2;lip.position.set(gx,gy+0.07,gz);g.add(lip);
const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.022,1.55,8),M(0xf0f0f0,{metal:0.55,rough:0.28}));
pole.position.set(gx+0.14,gy+0.85,gz);pole.castShadow=true;g.add(pole);
const flag=new THREE.Mesh(new THREE.PlaneGeometry(0.48,0.3),M(0xff2040,{side:THREE.DoubleSide,em:0x440010,emi:0.12}));
flag.position.set(gx+0.4,gy+1.45,gz);g.add(flag);
const flag2=new THREE.Mesh(new THREE.PlaneGeometry(0.48,0.3),M(0xff2040,{side:THREE.DoubleSide}));
flag2.position.copy(flag.position);flag2.rotation.y=Math.PI;g.add(flag2);
g.userData.flags=g.userData.flags||[];g.userData.flags.push(flag,flag2);
const cupGlow=new THREE.Mesh(new THREE.RingGeometry(0.2,0.35,24),M(0x5dff9a,{em:0x2a8a4a,emi:0.25,side:THREE.DoubleSide,tr:true,op:0.35}));
cupGlow.rotation.x=-Math.PI/2;cupGlow.position.set(gx,gy+0.075,gz);cupGlow.name="cupGlow";g.add(cupGlow);
}
function addFeatures(g,hole,b){
for(const f of hole.features||[]){
if(f.type==="tank"){
const glass=new THREE.Mesh(new THREE.BoxGeometry(f.w,f.h,f.d),M(0x40c0e0,{rough:0.1,metal:0.2,tr:true,op:0.18,em:0x104060,emi:0.15,side:THREE.DoubleSide}));
glass.position.set(f.x,f.y+f.h*0.45,f.z);glass.rotation.y=f.rot||0;g.add(glass);
const frame=new THREE.Mesh(new THREE.BoxGeometry(f.w+0.15,0.12,f.d+0.15),M(0x80e8ff,{metal:0.6,rough:0.3,em:0x40a0c0,emi:0.2}));
frame.position.set(f.x,f.y+0.06,f.z);frame.rotation.y=f.rot||0;g.add(frame);
const water=new THREE.Mesh(new THREE.BoxGeometry(f.w*0.92,f.h*0.7,f.d*0.92),M(b.water,{rough:0.15,metal:0.25,tr:true,op:0.28,em:b.water,emi:0.12}));
water.position.set(f.x,f.y+f.h*0.38,f.z);water.rotation.y=f.rot||0;g.add(water);
}else if(f.type==="elevator"){
const pad=new THREE.Mesh(new THREE.CylinderGeometry(f.r,f.r,0.12,24),M(0x40ffe0,{em:0x20c0a0,emi:0.55,metal:0.4,rough:0.3}));
pad.position.set(f.x,(f.y||0)+0.06,f.z);pad.castShadow=true;g.add(pad);
const ring=new THREE.Mesh(new THREE.TorusGeometry(f.r*0.95,0.05,8,28),M(0x80ffff,{em:0x40e0ff,emi:0.7}));
ring.rotation.x=Math.PI/2;ring.position.set(f.x,(f.y||0)+0.14,f.z);g.add(ring);
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,Math.abs((f.yTo??f.exitY??0)-(f.y||0))+1.2,8),M(0xa0e8ff,{metal:0.5,rough:0.35,tr:true,op:0.5}));
shaft.position.set(f.x,((f.y||0)+(f.exitY??f.yTo??0))*0.5+0.6,f.z);g.add(shaft);
}else if(f.type==="bridge"){
const br=new THREE.Mesh(new THREE.BoxGeometry(f.w||2,0.12,f.len||3),M(0xc0a878,{rough:0.8}));
br.position.set(f.x,(f.y||0)+0.06,f.z);br.receiveShadow=true;g.add(br);
}else if(f.type==="tube"){
const tube=new THREE.Mesh(new THREE.CylinderGeometry(f.r,f.r,f.len||4,16,1,true),M(0x60e0ff,{tr:true,op:0.25,rough:0.15,metal:0.3,side:THREE.DoubleSide,em:0x2080a0,emi:0.2}));
tube.position.set(f.x,(f.y||0)+0.5,f.z);tube.rotation.z=Math.PI*0.5;tube.rotation.y=f.rot||0;g.add(tube);
}else if(f.type==="conveyor"){
const c=new THREE.Mesh(new THREE.CylinderGeometry(f.r,f.r,0.08,20),M(0xffb84d,{em:0xaa6020,emi:0.35,rough:0.5}));
c.position.set(f.x,(f.y||0)+0.04,f.z);g.add(c);
}else if(f.type==="wind"){
const w=new THREE.Mesh(new THREE.ConeGeometry(0.25,1.2,6),M(0xa0d0ff,{tr:true,op:0.35,em:0x60a0ff,emi:0.2}));
w.position.set(f.x,(f.y||0)+0.8,f.z);g.add(w);
}else if(f.type==="fish"){
const body=new THREE.Mesh(new THREE.SphereGeometry(0.15*f.s,8,8),M(0xff8060,{em:0x802010,emi:0.2}));
body.position.set(f.x,f.y,f.z);body.scale.set(1.6,0.7,0.8);g.add(body);
}
}
for(const o of hole.obstacles||[]){
if(o.type==="bumper"){
const m=new THREE.Mesh(new THREE.CylinderGeometry(o.r,o.r,0.45,16),M(0xff4060,{em:0xaa1020,emi:0.45,metal:0.3,rough:0.4}));
m.position.set(o.x,(o.y||0)+0.25,o.z);m.castShadow=true;g.add(m);
}else if(o.type==="pillar"){
const m=new THREE.Mesh(new THREE.CylinderGeometry(o.r,o.r*1.05,o.h,12),M(b.id===7?0x80e0ff:0x686860,{rough:0.7,metal:b.id===7?0.4:0.1}));
m.position.set(o.x,(o.y||0)+o.h*0.5,o.z);m.castShadow=true;g.add(m);
}
}
}
function addHazard(g,h,b,sandMap){
if(h.type==="sand"){
const depth=h.depth||0.2;
const geo=sandDivotGeo(h.r,depth);
const mat=M(b.sand,{rough:0.96,map:sandMap});
const bowl=new THREE.Mesh(geo,mat);
const hy=h.y||0;
bowl.position.set(h.x,hy+0.02,h.z);
bowl.receiveShadow=true;
bowl.castShadow=false;
g.add(bowl);
const rim=new THREE.Mesh(new THREE.TorusGeometry(h.r*0.98,0.04,6,28),M(b.soil||0x6a4a28,{rough:0.95,map:sandMap}));
rim.rotation.x=Math.PI/2;rim.position.set(h.x,hy+0.015,h.z);rim.receiveShadow=true;g.add(rim);
return;
}
let col=b.water,em=0,emi=0,rough=0.2,metal=0.25,depth=h.depth||0.14;
if(h.type==="lava"){col=0xff3a00;em=0xff2200;emi=0.6;rough=0.45;metal=0.1}
else if(h.type==="ice"){col=0xd8f4ff;em=0x90d0ff;emi=0.12;rough=0.1;metal=0.45}
else if(h.type==="bounce"){col=0x40ffe0;em=0x20c0a0;emi=0.55;rough=0.28;metal=0.5}
else if(h.type==="gap"){col=0x050508;em=0;emi=0;rough=1;metal=0;depth=0.35}
else if(h.type==="water"){col=b.water;em=b.water;emi=0.18;rough=0.12;metal=0.35}
const hy=h.y||0;
if(h.type==="gap"||h.type==="water"||h.type==="lava"){
const geo=sandDivotGeo(h.r,depth);
const mat=M(col,{rough,metal,em,emi,tr:h.type==="water",op:h.type==="water"?0.82:1,side:THREE.DoubleSide});
const bowl=new THREE.Mesh(geo,mat);
bowl.position.set(h.x,hy+0.015,h.z);bowl.receiveShadow=true;g.add(bowl);
}else{
const pad=new THREE.Mesh(new THREE.CylinderGeometry(h.r,h.r,0.06,24),M(col,{rough,metal,em,emi}));
pad.position.set(h.x,hy+0.03,h.z);pad.receiveShadow=true;g.add(pad);
}
}
function addProp(g,d,biome){
const x=d.x,z=d.z,s=d.s,v=d.var||0,by=d.y||0;
if(d.kind==="coral"||d.kind==="bubble"||d.kind==="tube"||d.kind==="fish"){
if(d.kind==="bubble"){const m=new THREE.Mesh(new THREE.SphereGeometry(0.12*s,8,8),M(0xa0e8ff,{tr:true,op:0.4,em:0x40a0c0,emi:0.2}));m.position.set(x,by+0.5+s,z);g.add(m);return}
if(d.kind==="coral"){const m=new THREE.Mesh(new THREE.ConeGeometry(0.2*s,0.7*s,5),M(0xff6080,{em:0x801020,emi:0.2}));m.position.set(x,by+0.35*s,z);g.add(m);return}
if(d.kind==="tube"){const m=new THREE.Mesh(new THREE.TorusGeometry(0.35*s,0.08*s,6,12),M(0x40ffe0,{em:0x20a080,emi:0.3}));m.position.set(x,by+0.4,z);m.rotation.x=Math.PI*0.5;g.add(m);return}
const body=new THREE.Mesh(new THREE.SphereGeometry(0.14*s,8,8),M(0xffb040,{em:0x804010,emi:0.15}));body.position.set(x,by+0.6,z);body.scale.set(1.5,0.6,0.8);g.add(body);return;
}
if(d.kind==="tree"){
const t=new THREE.Mesh(new THREE.CylinderGeometry(0.07*s,0.11*s,0.9*s,6),M(biome.soil||0x5a3820,{rough:0.95}));
t.position.set(x,by+0.45*s,z);t.castShadow=true;g.add(t);
const leafCol=biome.leaf||0x2f8a44;
for(let i=0;i<3;i++){
const leaf=new THREE.Mesh(new THREE.SphereGeometry((0.42-i*0.05)*s,8,8),M(leafCol,{rough:0.92}));
leaf.position.set(x+(v-0.5)*0.15*s,by+(0.95+i*0.28)*s,z+(v-0.3)*0.12*s);
leaf.scale.set(1.1+i*0.05,0.85,1.05);leaf.castShadow=true;g.add(leaf);
}
}else if(d.kind==="pine"){
const t=new THREE.Mesh(new THREE.CylinderGeometry(0.06*s,0.09*s,0.75*s,6),M(0x4a3020));
t.position.set(x,by+0.38*s,z);t.castShadow=true;g.add(t);
for(let i=0;i<4;i++){
const c=new THREE.Mesh(new THREE.ConeGeometry((0.5-i*0.08)*s,0.55*s,8),M(biome.id===2?0xd8eef5:0x2a6840,{rough:0.9}));
c.position.set(x,by+(0.75+i*0.35)*s,z);c.castShadow=true;g.add(c);
}
}else if(d.kind==="palm"){
const t=new THREE.Mesh(new THREE.CylinderGeometry(0.05*s,0.1*s,1.35*s,6),M(0x8a6a30));
t.position.set(x,by+0.65*s,z);t.rotation.z=0.08+v*0.1;t.castShadow=true;g.add(t);
for(let i=0;i<6;i++){
const f=new THREE.Mesh(new THREE.ConeGeometry(0.07*s,0.95*s,4),M(biome.leaf||0x2ea85a));
f.position.set(x,by+1.4*s,z);f.rotation.set(0.9,i*1.05+d.spin,0.1);f.castShadow=true;g.add(f);
}
}else if(d.kind==="cactus"){
const b=new THREE.Mesh(new THREE.CylinderGeometry(0.12*s,0.14*s,1.05*s,8),M(0x3a9a50,{rough:0.8}));
b.position.set(x,by+0.52*s,z);b.castShadow=true;g.add(b);
if(v>0.4){
const a=new THREE.Mesh(new THREE.CylinderGeometry(0.06*s,0.07*s,0.45*s,6),M(0x3a9a50));
a.position.set(x+0.18*s,by+0.7*s,z);a.rotation.z=-0.9;a.castShadow=true;g.add(a);
}
}else if(d.kind==="bush"){
const b=new THREE.Mesh(new THREE.SphereGeometry(0.34*s,8,8),M(biome.leaf||0x3a8a40,{rough:0.95}));
b.position.set(x,by+0.24*s,z);b.scale.set(1.35,0.72,1.15);b.castShadow=true;g.add(b);
}else if(d.kind==="rock"||d.kind==="dune"){
const r=new THREE.Mesh(new THREE.DodecahedronGeometry((d.kind==="dune"?0.5:0.3)*s,0),M(biome.id===2?0xc0d0e0:biome.id===1?0xc8a878:0x686860,{rough:0.98}));
r.position.set(x,by+(d.kind==="dune"?0.12:0.16)*s,z);r.rotation.y=d.spin||0;r.scale.set(1.2,d.kind==="dune"?0.55:0.9,1);r.castShadow=true;g.add(r);
}else if(d.kind==="ember"){
const r=new THREE.Mesh(new THREE.DodecahedronGeometry(0.28*s,0),M(0x3a2020,{em:0xff4010,emi:0.4}));
r.position.set(x,by+0.15*s,z);r.castShadow=true;g.add(r);
}else if(d.kind==="neon"||d.kind==="panel"){
const p=new THREE.Mesh(new THREE.BoxGeometry(0.2*s,d.kind==="panel"?0.6*s:1.1*s,0.2*s),M(biome.accent,{em:biome.accent,emi:0.75,metal:0.45,rough:0.28}));
p.position.set(x,by+(d.kind==="panel"?0.3:0.55)*s,z);p.castShadow=true;g.add(p);
}else if(d.kind==="flower"){
const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.02*s,0.025*s,0.35*s,4),M(0x2a8030));
stem.position.set(x,by+0.18*s,z);g.add(stem);
const col=[0xff6080,0xffd040,0xff80ff,0x80c0ff][Math.floor(v*4)%4];
const fl=new THREE.Mesh(new THREE.SphereGeometry(0.1*s,6,6),M(col,{em:col,emi:0.15}));
fl.position.set(x,by+0.38*s,z);g.add(fl);
}else if(d.kind==="tuft"){
for(let i=0;i<5;i++){
const blade=new THREE.Mesh(new THREE.ConeGeometry(0.03*s,0.28*s,3),M(biome.leaf||biome.grass,{rough:1}));
blade.position.set(x+(i-2)*0.04*s,by+0.14*s,z+(v-0.5)*0.06);
blade.rotation.z=(i-2)*0.15;g.add(blade);
}
}else if(d.kind==="crystal"){
const c=new THREE.Mesh(new THREE.OctahedronGeometry(0.28*s,0),M(0xa0e0ff,{em:0x60c0ff,emi:0.35,metal:0.3,rough:0.2,tr:true,op:0.85}));
c.position.set(x,by+0.28*s,z);c.castShadow=true;g.add(c);
}else if(d.kind==="spike"){
const c=new THREE.Mesh(new THREE.ConeGeometry(0.15*s,0.7*s,5),M(0x2a1810,{rough:0.9}));
c.position.set(x,by+0.35*s,z);c.castShadow=true;g.add(c);
}else if(d.kind==="reed"){
for(let i=0;i<4;i++){
const r=new THREE.Mesh(new THREE.CylinderGeometry(0.015*s,0.02*s,0.7*s,4),M(0x4a9040));
r.position.set(x+(i-1.5)*0.06,by+0.35*s,z);r.rotation.z=(i-1.5)*0.08;g.add(r);
}
}else if(d.kind==="cloudrock"){
const c=new THREE.Mesh(new THREE.SphereGeometry(0.55*s,8,8),M(0xf0f4ff,{rough:1,tr:true,op:0.75}));
c.position.set(x,by+1.2+s,z);g.add(c);
}
}
function addHill(g,h,b,groundMap){
const mesh=new THREE.Mesh(new THREE.SphereGeometry(h.r,12,10,0,Math.PI*2,0,Math.PI*0.5),M(b.ground,{rough:0.98,map:groundMap}));
mesh.position.set(h.x,-0.05,h.z);
mesh.scale.set(1,h.h/h.r,1);
mesh.receiveShadow=true;mesh.castShadow=true;
g.add(mesh);
}
function buildHoleMeshes(hole){
const g=new THREE.Group();g.userData.flags=[];
const b=hole.biome;
const grassMap=makeNoiseTex("g"+b.id,b.grass,b.fairway,"grass",256,12);
const fairMap=makeNoiseTex("f"+b.id,b.fairway,b.grass,"grass",256,10);
const roughMap=makeNoiseTex("r"+b.id,b.rough,b.ground,"grass",256,8);
const groundMap=makeNoiseTex("d"+b.id,b.ground,b.soil||b.rough,"dirt",256,6);
const sandMap=makeNoiseTex("s"+b.id,b.sand,b.soil||0x6a4a28,"sand",256,4);
const railMap=makeNoiseTex("w"+b.id,b.rail,b.id===5?b.accent:0x4a2810,b.id===5?"neon":"rock",128,2);
const rockMap=makeNoiseTex("k"+b.id,0x686860,0x404038,"rock",128,3);
const bb=hole.bounds;
const cx=(bb.minX+bb.maxX)*0.5,cz=(bb.minZ+bb.maxZ)*0.5;
const gw=Math.max(70,bb.maxX-bb.minX+40);
const gd=Math.max(70,bb.maxZ-bb.minZ+40);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(gw,gd,1,1),M(b.ground,{rough:0.99,map:groundMap}));
ground.rotation.x=-Math.PI/2;ground.position.set(cx,-0.04,cz);ground.receiveShadow=true;g.add(ground);
for(const hill of(hole.hills||[]))addHill(g,hill,b,groundMap);
const outer=expand(hole.left,hole.right,2.2);
const rough=flatRibbon(outer.L,outer.R,-0.01,M(b.rough,{rough:0.95,map:roughMap}));
if(rough)g.add(rough);
const fair=flatRibbon(hole.left,hole.right,0.012,M(b.fairway,{rough:0.76,map:fairMap}));
if(fair)g.add(fair);
const inner=expand(hole.left,hole.right,-Math.max(0.28,hole.width*0.14));
const lane=flatRibbon(inner.L,inner.R,0.02,M(b.grass,{rough:0.7,map:grassMap}));
if(lane)g.add(lane);
const skirtL=flatRibbon(outer.L,hole.left,-0.02,M(b.ground,{rough:0.98,map:groundMap}));
const skirtR=flatRibbon(hole.right,outer.R,-0.02,M(b.ground,{rough:0.98,map:groundMap}));
if(skirtL)g.add(skirtL);if(skirtR)g.add(skirtR);
const railH=b.id===5||b.id===7?0.68:0.52;
const railMat=M(b.rail,{rough:b.id===5||b.id===7?0.28:0.65,metal:b.id===5||b.id===7?0.7:0.1,em:b.id===5||b.id===7?b.rail:0,emi:b.id===5||b.id===7?0.4:0,map:railMap});
const capMat=M(b.id===5||b.id===7?b.accent:b.id===2?0xa8c8d8:0x8a5528,{rough:0.4,metal:b.id===5||b.id===7?0.55:0.12,em:b.id===5||b.id===7?b.accent:0,emi:b.id===5||b.id===7?0.28:0});
const railL=smoothRailMesh(hole.left,railH,0.32,railMat.clone());
const railR=smoothRailMesh(hole.right,railH,0.32,railMat.clone());
if(railL)g.add(railL);if(railR)g.add(railR);
const capL=smoothRailCap(hole.left,railH,0.32,capMat.clone());
const capR=smoothRailCap(hole.right,railH,0.32,capMat.clone());
if(capL)g.add(capL);if(capR)g.add(capR);
for(const w of hole.walls){
if(Math.abs(w.sx-0.3)<0.05&&w.sz>0.5)continue;
addWall(g,w,b,railMap);
}
addCup(g,hole,b,grassMap);
const teeY=(hole.tee.y||0.14)-0.1;
const teeMat=M(0xb8956a,{rough:0.88,map:makeNoiseTex("tee",0xb8956a,0x8a6840,"dirt",128,2)});
const tee=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.05,1.5),teeMat);
tee.position.set(hole.tee.x,teeY,hole.tee.z);tee.receiveShadow=true;g.add(tee);
const marker=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.05,10),M(b.accent,{em:b.accent,emi:0.2}));
marker.position.set(hole.tee.x,teeY+0.04,hole.tee.z);g.add(marker);
for(const h of hole.hazards)addHazard(g,h,b,sandMap);
for(const d of hole.decor)addProp(g,d,b);
addFeatures(g,hole,b);
if(b.id===5){
const gx=hole.cup.x,gz=hole.cup.z;
const nr=new THREE.Mesh(new THREE.TorusGeometry(hole.greenR+0.2,0.05,6,40),M(b.accent,{em:b.accent,emi:0.85}));
nr.rotation.x=Math.PI/2;nr.position.set(gx,0.09,gz);g.add(nr);
}
if(b.id===6){
for(let i=0;i<10;i++){
const cloud=new THREE.Mesh(new THREE.SphereGeometry(1.4+Math.random(),8,8),M(0xffffff,{rough:1,tr:true,op:0.55}));
cloud.position.set(bb.minX+Math.random()*(bb.maxX-bb.minX),5+Math.random()*4,bb.minZ+Math.random()*(bb.maxZ-bb.minZ));
cloud.scale.set(1.6,0.7,1.2);g.add(cloud);
}
}
if(b.id===2){
for(let i=0;i<8;i++){
const drift=new THREE.Mesh(new THREE.SphereGeometry(1.2+Math.random(),8,6),M(0xe8f4ff,{rough:1,tr:true,op:0.4}));
drift.position.set(cx+(Math.random()-0.5)*40,0.3,cz+(Math.random()-0.5)*40);
drift.scale.set(1.5,0.25,1.2);g.add(drift);
}
}
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(180,24,16),new THREE.MeshBasicMaterial({color:b.sky,side:THREE.BackSide,fog:false,depthWrite:false}));
skyDome.position.set(cx,0,cz);g.add(skyDome);
return g;
}
function createBallMesh(){
const canvas=document.createElement("canvas");canvas.width=canvas.height=64;
const ctx=canvas.getContext("2d");
ctx.fillStyle="#f2f2f2";ctx.fillRect(0,0,64,64);
for(let i=0;i<80;i++){ctx.beginPath();ctx.arc(Math.random()*64,Math.random()*64,1.2,0,6.28);ctx.fillStyle="rgba(0,0,0,0.08)";ctx.fill()}
const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
const m=new THREE.Mesh(new THREE.SphereGeometry(0.11,32,32),M(0xf7f7f7,{rough:0.32,metal:0.14,map}));
m.castShadow=true;return m;
}
function createBallShadow(){
const m=new THREE.Mesh(new THREE.CircleGeometry(0.14,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false}));
m.rotation.x=-Math.PI/2;m.position.y=0.02;return m;
}
function createAimLine(){
const g=new THREE.Group();
const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,1)]);
const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x5dff9a,transparent:true,opacity:0.95}));
const cone=new THREE.Mesh(new THREE.ConeGeometry(0.08,0.28,8),new THREE.MeshBasicMaterial({color:0x5dff9a,transparent:true,opacity:0.9}));
cone.rotation.x=Math.PI/2;cone.position.z=1;
const dots=[];
for(let i=0;i<6;i++){
const d=new THREE.Mesh(new THREE.SphereGeometry(0.035,6,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5}));
d.position.z=0.2+i*0.25;dots.push(d);g.add(d);
}
g.add(line);g.add(cone);g.userData={line,cone,dots};g.visible=false;return g;
}
function updateAimGraphic(aim,ox,oy,oz,dir,power){
if(!aim||!dir)return;
const len=1.5+power*9;
const d=dir.clone().normalize();
aim.position.set(ox,oy,oz);
aim.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d);
const col=power<0.35?0x5dff9a:power<0.7?0xffb84d:0xff5d7a;
aim.userData.line.material.color.setHex(col);
aim.userData.cone.material.color.setHex(col);
aim.userData.cone.position.z=len;
const pos=aim.userData.line.geometry.attributes.position;
pos.setXYZ(0,0,0,0);pos.setXYZ(1,0,0,len);pos.needsUpdate=true;
aim.userData.dots.forEach((dot,i)=>{dot.position.z=(i+1)*(len/7);dot.material.opacity=0.25+power*0.5;dot.material.color.setHex(col)});
aim.visible=power>0.02;
}
function applyBiomeAtmosphere(scene,camera,sun,hemi,biome){
scene.background=new THREE.Color(biome.sky);
scene.fog=new THREE.Fog(biome.fog,biome.fogNear,biome.fogFar);
hemi.color=new THREE.Color(biome.ambient);
hemi.groundColor=new THREE.Color(biome.ground);
sun.intensity=biome.id===3?0.95:biome.id===5?0.72:1.25;
sun.color=new THREE.Color(biome.id===3?0xff8844:biome.id===5?0xcc88ff:0xfff2d8);
}
function setupControls(camera,dom){
const c=new OrbitControls(camera,dom);
c.enableDamping=true;
c.dampingFactor=0.1;
c.maxPolarAngle=Math.PI*0.48;
c.minDistance=4;
c.maxDistance=36;
c.enablePan=false;
c.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
c.touches={ONE:null,TWO:THREE.TOUCH.DOLLY_ROTATE};
return c;
}
function focusHole(camera,controls,hole){
controls.target.set(hole.tee.x,0.2,hole.tee.z);
const dx=hole.cup.x-hole.tee.x,dz=hole.cup.z-hole.tee.z;
const dist=Math.max(10,Math.hypot(dx,dz)*0.55);
camera.position.set(hole.tee.x-dz*0.15+3,7,hole.tee.z+dist*0.4+4);
controls.update();
}
function followBall(controls,ball,s=0.15){
controls.target.x+=(ball.x-controls.target.x)*s;
controls.target.y+=(0.25-controls.target.y)*s;
controls.target.z+=(ball.z-controls.target.z)*s;
}
export{THREE,createRenderer,createWorld,disposeGroup,buildHoleMeshes,createBallMesh,createBallShadow,createAimLine,updateAimGraphic,applyBiomeAtmosphere,setupControls,focusHole,followBall};