import*as THREE from"three";
function createFX(scene){
const group=new THREE.Group();scene.add(group);
const particles=[];
const trail=[];
const TRAIL_N=18;
let shake=0,fade=0,flagRefs=[];
const confetti=[];
function spawn(x,y,z,n,col,spd=1.2,life=0.6,size=0.06){
for(let i=0;i<n;i++){
const m=new THREE.Mesh(new THREE.SphereGeometry(size*(0.5+Math.random()),4,4),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.9}));
m.position.set(x,y,z);
const v=new THREE.Vector3((Math.random()-0.5)*spd,(0.4+Math.random())*spd,(Math.random()-0.5)*spd);
particles.push({m,v,life,max:life});
group.add(m);
}
}
function puttDust(x,z,p){spawn(x,0.12,z,4+Math.floor(p*6),0xc8b890,0.6+p,0.35,0.04)}
function wallSpark(x,z,spd){spawn(x,0.2,z,5+Math.floor(spd),0xffe8a0,1.2,0.3,0.035)}
function sinkPop(x,z){spawn(x,0.15,z,14,0x5dff9a,1.4,0.7,0.05);spawn(x,0.2,z,8,0xffffff,0.9,0.5,0.03)}
function waterSplash(x,z){spawn(x,0.1,z,12,0x40a0e0,1.1,0.55,0.05)}
function lavaPop(x,z){spawn(x,0.15,z,16,0xff6020,1.5,0.65,0.05)}
function confettiBurst(x,z){
for(let i=0;i<40;i++){
const col=[0xff4060,0x40ff90,0xffd040,0x60c0ff,0xff80ff][i%5];
const m=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.1,0.02),new THREE.MeshBasicMaterial({color:col}));
m.position.set(x,0.8,z);
confetti.push({m,v:new THREE.Vector3((Math.random()-0.5)*3,2+Math.random()*3,(Math.random()-0.5)*3),life:1.8,spin:(Math.random()-0.5)*8});
group.add(m);
}
}
function kick(amt=0.12){shake=Math.max(shake,amt)}
function getShake(){if(shake<=0)return{x:0,y:0};const s=shake;shake*=0.85;if(shake<0.002)shake=0;return{x:(Math.random()-0.5)*s,y:(Math.random()-0.5)*s}}
function setFade(v){fade=v}
function getFade(){return fade}
function pushTrail(x,y,z,moving){
if(!moving){while(trail.length){const t=trail.pop();group.remove(t.m);t.m.geometry.dispose();t.m.material.dispose()}return}
const m=new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.35}));
m.position.set(x,y,z);group.add(m);trail.push({m,life:0.35});
while(trail.length>TRAIL_N){const t=trail.shift();group.remove(t.m);t.m.geometry.dispose();t.m.material.dispose()}
}
function registerFlags(arr){flagRefs=arr||[]}
function update(dt){
for(let i=particles.length-1;i>=0;i--){
const p=particles[i];
p.life-=dt;p.v.y-=2.5*dt;
p.m.position.addScaledVector(p.v,dt);
p.m.material.opacity=Math.max(0,p.life/p.max);
if(p.life<=0){group.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();particles.splice(i,1)}
}
for(let i=trail.length-1;i>=0;i--){
const t=trail[i];t.life-=dt;t.m.material.opacity=Math.max(0,t.life*0.9);t.m.scale.multiplyScalar(0.97);
if(t.life<=0){group.remove(t.m);t.m.geometry.dispose();t.m.material.dispose();trail.splice(i,1)}
}
for(let i=confetti.length-1;i>=0;i--){
const c=confetti[i];c.life-=dt;c.v.y-=6*dt;c.m.position.addScaledVector(c.v,dt);c.m.rotation.x+=c.spin*dt;c.m.rotation.z+=c.spin*0.7*dt;
if(c.life<=0){group.remove(c.m);c.m.geometry.dispose();c.m.material.dispose();confetti.splice(i,1)}
}
const t=performance.now()*0.001;
for(const f of flagRefs){if(f)f.rotation.y=Math.sin(t*2.2+f.position.x)*0.25}
if(fade>0)fade=Math.max(0,fade-dt*1.2);
}
function clear(){
while(particles.length){const p=particles.pop();group.remove(p.m);p.m.geometry.dispose();p.m.material.dispose()}
while(trail.length){const t=trail.pop();group.remove(t.m);t.m.geometry.dispose();t.m.material.dispose()}
while(confetti.length){const c=confetti.pop();group.remove(c.m);c.m.geometry.dispose();c.m.material.dispose()}
flagRefs=[];
}
return{puttDust,wallSpark,sinkPop,waterSplash,lavaPop,confettiBurst,kick,getShake,setFade,getFade,pushTrail,registerFlags,update,clear,group};
}
function createAmbient(scene,biome){
const g=new THREE.Group();scene.add(g);
const bits=[];
const n=biome.id===5?40:biome.id===2?30:biome.id===3?25:20;
const col=biome.id===3?0xff6020:biome.id===2?0xffffff:biome.id===5?biome.accent:biome.id===4?0x80e0ff:0xc0ff90;
for(let i=0;i<n;i++){
const m=new THREE.Mesh(new THREE.SphereGeometry(0.04+Math.random()*0.05,4,4),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.55}));
m.position.set((Math.random()-0.5)*50,0.5+Math.random()*4,(Math.random()-0.5)*50);
bits.push({m,o:Math.random()*6,s:0.4+Math.random()*0.8,baseY:m.position.y});
g.add(m);
}
function update(dt,cx,cz){
const t=performance.now()*0.001;
for(const b of bits){
b.m.position.x+=Math.sin(t*b.s+b.o)*0.01;
b.m.position.z+=Math.cos(t*b.s*0.8+b.o)*0.01;
b.m.position.y=b.baseY+Math.sin(t*2+b.o)*0.15;
b.m.material.opacity=0.25+0.35*(0.5+0.5*Math.sin(t*3+b.o));
if(Math.hypot(b.m.position.x-cx,b.m.position.z-cz)>40){b.m.position.x=cx+(Math.random()-0.5)*30;b.m.position.z=cz+(Math.random()-0.5)*30}
}
}
function dispose(){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()})}
return{update,dispose,group:g};
}
export{createFX,createAmbient};