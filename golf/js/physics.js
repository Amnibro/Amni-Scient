import{sampleSurface}from"./courses.js";
const BALL_R=0.11;
const CUP_R=0.15;
const STOP_V=0.045;
const REST=0.55;
const WALL_F=0.98;
const MAX_SPD=32;
const EPS=1e-8;
const POWER_SCALE=28;
function createBallState(tee){return{x:tee.x,y:tee.y??0.12,z:tee.z,vx:0,vy:0,vz:0,moving:false,inCup:false,sunk:false,wallHit:0,lastNx:0,lastNz:0,elevator:null,onFeature:null}}
function resetBall(state,tee){state.x=tee.x;state.y=tee.y??0.12;state.z=tee.z;state.vx=0;state.vy=0;state.vz=0;state.moving=false;state.inCup=false;state.sunk=false;state.wallHit=0;state.elevator=null;state.onFeature=null}
function launch(state,dirX,dirZ,power){
const n=Math.hypot(dirX,dirZ)||1;
const ease=power*power*(3-2*power);
const s=Math.min(ease,1)*POWER_SCALE;
state.vx=(dirX/n)*s;state.vz=(dirZ/n)*s;state.vy=0;
state.moving=true;state.inCup=false;state.sunk=false;state.wallHit=0;state.elevator=null;
}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function clampSpd(state){
const sp=Math.hypot(state.vx,state.vz);
if(sp>MAX_SPD){const k=MAX_SPD/sp;state.vx*=k;state.vz*=k}
}
function resolveWall(state,w){
const cos=Math.cos(w.rot),sin=Math.sin(w.rot);
const dx=state.x-w.cx,dz=state.z-w.cz;
const lx=cos*dx+sin*dz;
const lz=-sin*dx+cos*dz;
const hx=w.sx*0.5,hz=w.sz*0.5;
const cy=w.cy||0,wh=w.h||0.55;
if(state.y>cy+wh+BALL_R+0.15||state.y<cy-0.35)return false;
const cx=clamp(lx,-hx,hx),cz=clamp(lz,-hz,hz);
let ox=lx-cx,oz=lz-cz;
let dist2=ox*ox+oz*oz;
let nx,nz,pen;
if(dist2>EPS){
const dist=Math.sqrt(dist2);
if(dist>=BALL_R)return false;
nx=ox/dist;nz=oz/dist;pen=BALL_R-dist;
}else{
const px=hx-Math.abs(lx),pz=hz-Math.abs(lz);
if(px<pz){nx=lx>=0?1:-1;nz=0;pen=px+BALL_R}
else{nx=0;nz=lz>=0?1:-1;pen=pz+BALL_R}
}
const nlx=lx+nx*(pen+0.002);
const nlz=lz+nz*(pen+0.002);
state.x=w.cx+cos*nlx-sin*nlz;
state.z=w.cz+sin*nlx+cos*nlz;
const rvx=cos*state.vx+sin*state.vz;
const rvz=-sin*state.vx+cos*state.vz;
const vDot=rvx*nx+rvz*nz;
if(vDot<0){
const j=-(1+REST)*vDot;
let nvx=(rvx+nx*j)*WALL_F;
let nvz=(rvz+nz*j)*WALL_F;
const tDot=rvx*(-nz)+rvz*nx;
const friction=0.85;
nvx+=(-nz)*tDot*(friction-1);
nvz+=nx*tDot*(friction-1);
state.vx=cos*nvx-sin*nvz;
state.vz=sin*nvx+cos*nvz;
state.wallHit=Math.max(state.wallHit,Math.min(8,-vDot));
state.lastNx=cos*nx-sin*nz;state.lastNz=sin*nx+cos*nz;
}
return true;
}
function collideWalls(state,walls){
if(!walls||!walls.length)return;
for(let pass=0;pass<3;pass++){
let hit=false;
for(let i=0;i<walls.length;i++)if(resolveWall(state,walls[i]))hit=true;
if(!hit)break;
}
clampSpd(state);
}
function collideBumpers(state,obstacles){
if(!obstacles)return;
for(const o of obstacles){
if(o.type!=="bumper")continue;
const d=Math.hypot(state.x-o.x,state.z-o.z);
const lim=(o.r||0.4)+BALL_R;
if(d>=lim||d<1e-6)continue;
if(Math.abs(state.y-(o.y||0))>1.2)continue;
const nx=(state.x-o.x)/d,nz=(state.z-o.z)/d;
state.x=o.x+nx*lim;state.z=o.z+nz*lim;
const vDot=state.vx*nx+state.vz*nz;
if(vDot<0){
const boost=o.boost||1.2;
state.vx=(state.vx-2*vDot*nx)*boost;
state.vz=(state.vz-2*vDot*nz)*boost;
state.wallHit=Math.max(state.wallHit,1.5);
}
}
}
function applyForces(state,hole,dt){
if(!hole.forces)return;
for(const f of hole.forces){
const d=Math.hypot(state.x-f.x,state.z-f.z);
if(d>(f.r||1.2))continue;
if(f.type==="conveyor"||f.type==="wind"){
const fall=1-d/(f.r||1.2);
state.vx+=(f.fx||0)*fall*dt;
state.vz+=(f.fz||0)*fall*dt;
}
if(f.type==="boost"&&f.up){state.vx*=1+f.up*dt*0.5;state.vz*=1+f.up*dt*0.5}
}
}
function tryElevator(state,hole,dt){
if(state.elevator){
const e=state.elevator;
e.t+=dt;
const u=clamp(e.t/e.hold,0,1);
const s=u*u*(3-2*u);
state.x=e.x0+(e.x1-e.x0)*s;
state.z=e.z0+(e.z1-e.z0)*s;
state.y=e.y0+(e.y1-e.y0)*s+0.12;
state.vx=0;state.vz=0;
if(u>=1){state.elevator=null;state.x=e.x1;state.z=e.z1;state.y=e.y1+0.12;state.moving=true}
return true;
}
if(!hole.features||state.moving===false&&Math.hypot(state.vx,state.vz)<0.2){
/* allow enter when slow or moving into pad */
}
for(const f of hole.features||[]){
if(f.type!=="elevator")continue;
const d=Math.hypot(state.x-f.x,state.z-f.z);
if(d>f.r)continue;
const spd=Math.hypot(state.vx,state.vz);
if(spd>3.5)continue;
state.elevator={x0:f.x,z0:f.z,y0:f.y||0,x1:f.exitX,z1:f.exitZ,y1:f.exitY??f.yTo??0,hold:f.hold||0.55,t:0};
state.vx=0;state.vz=0;state.moving=true;
return true;
}
return false;
}
function hazardEffect(state,hazards,biome,onHazard,surfY){
let inSand=false;
for(const h of hazards){
const d=Math.hypot(state.x-h.x,state.z-h.z);
if(d>h.r+BALL_R)continue;
if(Math.abs((h.y||0)-surfY)>1.5)continue;
if(h.type==="sand"){state.vx*=0.9;state.vz*=0.9;inSand=true}
else if(h.type==="ice"){state.vx*=1.0015;state.vz*=1.0015}
else if(h.type==="water"||h.type==="lava"||h.type==="gap"){onHazard&&onHazard(h.type);return true}
else if(h.type==="bounce"){
const n=Math.hypot(state.x-h.x,state.z-h.z)||0.001;
state.vx+=(state.x-h.x)/n*0.35;state.vz+=(state.z-h.z)/n*0.35;
}
}
return{hit:false,inSand};
}
function integrate(state,hole,dt,onHazard){
if(tryElevator(state,hole,dt))return null;
const surf=sampleSurface(hole,state.x,state.z);
state.vx+=-surf.gx*9.5*dt;
state.vz+=-surf.gz*9.5*dt;
applyForces(state,hole,dt);
state.x+=state.vx*dt;state.z+=state.vz*dt;
const surf2=sampleSurface(hole,state.x,state.z);
state.y=surf2.y+0.12;
collideWalls(state,hole.walls);
collideBumpers(state,hole.obstacles);
const hz=hazardEffect(state,hole.hazards,hole.biome,onHazard,surf2.y);
if(hz===true||hz.hit)return{stopped:true,sunk:false,oob:false,hazard:true};
const b=hole.bounds;
const pad=1.5;
const oob=state.x<b.minX-pad||state.x>b.maxX+pad||state.z<b.minZ-pad||state.z>b.maxZ+pad;
if(oob)return{stopped:true,sunk:false,oob:true,hazard:false};
if(surf2.dist>Math.max(...hole.widths)*0.85+2.5)return{stopped:true,sunk:false,oob:true,hazard:false};
return null;
}
function step(state,hole,dt,onHazard){
if(state.sunk)return{stopped:true,sunk:true,oob:false,hazard:false,wallHit:0};
state.wallHit=0;
const biome=hole.biome;
const spd0=Math.hypot(state.vx,state.vz);
const sub=Math.max(1,Math.min(10,Math.ceil(spd0*dt/0.08)));
const hdt=dt/sub;
for(let i=0;i<sub;i++){
const early=integrate(state,hole,hdt,onHazard);
if(early){state.vx=0;state.vz=0;state.moving=false;return{...early,wallHit:state.wallHit}}
const fricBase=biome.fric*(state.elevator?1:1);
const fric=Math.pow(fricBase,hdt*60);
if(!state.elevator){state.vx*=fric;state.vz*=fric}
}
clampSpd(state);
if(state.elevator)return{stopped:false,sunk:false,oob:false,hazard:false,wallHit:state.wallHit};
const spd=Math.hypot(state.vx,state.vz);
const cupY=hole.cup.y||0;
const dCup=Math.hypot(state.x-hole.cup.x,state.z-hole.cup.z);
const yOk=Math.abs(state.y-(cupY+0.12))<0.55;
if(yOk&&dCup<CUP_R&&spd<2.6){state.inCup=true;state.vx*=0.8;state.vz*=0.8}
if(yOk&&dCup<CUP_R*0.82&&spd<1.15){
state.sunk=true;state.moving=false;state.vx=0;state.vz=0;
state.x=hole.cup.x;state.z=hole.cup.z;state.y=cupY-0.22;
return{stopped:true,sunk:true,oob:false,hazard:false,wallHit:state.wallHit};
}
if(dCup>CUP_R*1.25)state.inCup=false;
if(spd<STOP_V&&!state.elevator){
state.vx=0;state.vz=0;state.moving=false;
const s=sampleSurface(hole,state.x,state.z);
if(!state.inCup)state.y=s.y+0.12;
return{stopped:true,sunk:false,oob:false,hazard:false,wallHit:state.wallHit};
}
state.moving=true;
return{stopped:false,sunk:false,oob:false,hazard:false,wallHit:state.wallHit};
}
export{BALL_R,CUP_R,POWER_SCALE,createBallState,resetBall,launch,step};