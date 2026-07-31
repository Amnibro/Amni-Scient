import*as THREE from"three";
function createChaseCam(camera,controls){
const st={yaw:0.9,pitch:0.52,dist:13,userOrbit:0,look:new THREE.Vector3(),ideal:new THREE.Vector3(),vel:new THREE.Vector3()};
controls.enableDamping=true;
controls.enablePan=false;
controls.minDistance=5;
controls.maxDistance=28;
controls.maxPolarAngle=Math.PI*0.46;
controls.minPolarAngle=0.18;
controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
controls.touches={ONE:null,TWO:THREE.TOUCH.DOLLY_ROTATE};
const el=controls.domElement;
const onDown=(e)=>{if(e.button===2||(e.touches&&e.touches.length===2))st.userOrbit=1.2};
el.addEventListener("pointerdown",onDown);
el.addEventListener("touchstart",onDown,{passive:true});
function snapToBall(ball,hole){
if(!ball)return;
const toCup=new THREE.Vector3(ball.x-hole.cup.x,0,ball.z-hole.cup.z);
if(toCup.lengthSq()<0.01)toCup.set(0,0,1);
toCup.normalize();
st.yaw=Math.atan2(toCup.x,toCup.z);
st.pitch=0.58;st.dist=12;
st.look.set(ball.x,0.2,ball.z);
const cp=Math.cos(st.pitch),sp=Math.sin(st.pitch);
st.ideal.set(ball.x+Math.sin(st.yaw)*cp*st.dist,0.3+sp*st.dist,ball.z+Math.cos(st.yaw)*cp*st.dist);
camera.position.copy(st.ideal);
controls.target.copy(st.look);
controls.update();
}
function update(ball,hole,dt,moving){
if(!ball)return;
st.dist=controls.getDistance?controls.getDistance():st.dist;
st.look.set(ball.x,0.28+Math.min(0.4,Math.hypot(ball.vx,ball.vz)*0.05),ball.z);
controls.target.x+=(st.look.x-controls.target.x)*Math.min(1,12*dt);
controls.target.y+=(st.look.y-controls.target.y)*Math.min(1,12*dt);
controls.target.z+=(st.look.z-controls.target.z)*Math.min(1,12*dt);
st.userOrbit=Math.max(0,st.userOrbit-dt);
if(st.userOrbit<=0){
let tx=0,tz=1;
const spd=Math.hypot(ball.vx,ball.vz);
if(moving&&spd>0.15){tx=-ball.vx;tz=-ball.vz}
else if(hole){tx=ball.x-hole.cup.x;tz=ball.z-hole.cup.z}
const tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
const want=Math.atan2(tx,tz);
let dy=want-st.yaw;
while(dy>Math.PI)dy-=Math.PI*2;
while(dy<-Math.PI)dy+=Math.PI*2;
const turn=moving?3.2:1.6;
st.yaw+=dy*Math.min(1,turn*dt);
const off=new THREE.Vector3().subVectors(camera.position,controls.target);
const flat=Math.hypot(off.x,off.z)||st.dist;
st.dist=THREE.MathUtils.clamp(flat,6,26);
st.pitch=THREE.MathUtils.clamp(Math.atan2(off.y,flat),0.42,0.72);
const cp=Math.cos(st.pitch),sp=Math.sin(st.pitch);
const d=THREE.MathUtils.clamp(st.dist*(moving?0.95:1),8,20);
st.ideal.set(controls.target.x+Math.sin(st.yaw)*cp*d,sp*d+1.5,controls.target.z+Math.cos(st.yaw)*cp*d);
const k=moving?6.5:4.5;
const a=1-Math.exp(-k*dt);
camera.position.x+=(st.ideal.x-camera.position.x)*a;
camera.position.y+=(st.ideal.y-camera.position.y)*a;
camera.position.z+=(st.ideal.z-camera.position.z)*a;
}else{
const off=new THREE.Vector3().subVectors(camera.position,controls.target);
st.yaw=Math.atan2(off.x,off.z);
st.dist=Math.hypot(off.x,off.z)||st.dist;
st.pitch=Math.atan2(off.y,st.dist);
}
controls.update();
}
return{update,snapToBall,st};
}
export{createChaseCam};