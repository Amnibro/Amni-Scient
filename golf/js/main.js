import{BIOMES,buildHole,courseTitle}from"./courses.js";
import{createBallState,resetBall,launch,step}from"./physics.js";
import{THREE,createRenderer,createWorld,disposeGroup,buildHoleMeshes,createBallMesh,createBallShadow,createAimLine,updateAimGraphic,applyBiomeAtmosphere,setupControls}from"./scene.js";
import{createChaseCam}from"./camera.js";
import{createInput}from"./input.js";
import{createHotSeat,createOnlineStub}from"./multiplayer.js";
import{bindUI}from"./ui.js";
import{createAudio}from"./audio.js";
import{createFX,createAmbient}from"./fx.js";
import{getBest,setBest,getSettings,setSetting}from"./storage.js";
const canvas=document.getElementById("c");
const renderer=createRenderer(canvas);
const{scene,camera,sun,hemi}=createWorld();
const controls=setupControls(camera,canvas);
const chase=createChaseCam(camera,controls);
const holeGroup=new THREE.Group();scene.add(holeGroup);
const ballMesh=createBallMesh();scene.add(ballMesh);
const ballShadow=createBallShadow();scene.add(ballShadow);
const aimLine=createAimLine();scene.add(aimLine);
const audio=createAudio();
const fx=createFX(scene);
const online=createOnlineStub();
const settings=getSettings();
if(settings.muted)audio.toggleMute();
let game=null,ball=null,input=null,last=performance.now(),holeMesh=null,ambient=null;
let rollAxis=new THREE.Vector3(1,0,0);
const MAX_STROKES_PAD=5;
const ui=bindUI({
start:cfg=>startGame(cfg),
toMenu:()=>toMenu(),
nextHole:()=>advanceHole(true),
restartHole:()=>restartHole(),
mulligan:()=>doMulligan(),
showScore:()=>showScorecard(),
createRoom:()=>online.createRoom(),
joinRoom:id=>online.joinRoom(id),
unlock:()=>audio.unlock(),
toggleMute:()=>{const m=audio.toggleMute();setSetting("muted",m);return m}
});
online.setHandlers({
message:(d)=>{if(!game||game.mode!=="online")return;if(d.t==="putt"&&online.amHost()){doPutt(d.dx,d.dz,d.p,true)}if(d.t==="state"&&!online.amHost()){applyNetState(d)}if(d.t==="hole"&&d.seed!=null){syncHole(d)}if(d.t==="roster"){ui.updateMp(online.roomId,d.roster,d.host,d.host)}},
roster:(r)=>ui.updateMp(online.roomId,r,r[0],r[0])
});
function fillBiomes(){
const sel=document.getElementById("biome-select");
BIOMES.forEach((b,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`${b.name} (18 holes)`;sel.appendChild(o)});
const all=document.createElement("option");all.value=-1;all.textContent="Championship Tour (all 7×18)";sel.appendChild(all);
}
function startGame(cfg){
audio.unlock();audio.ui();
const tour=cfg.biome===-1;
const players=cfg.mode==="hotseat"?cfg.players:cfg.players||["You"];
const mp=cfg.mode==="hotseat"?createHotSeat(players):cfg.mode==="online"?createHotSeat(players):null;
game={mode:cfg.mode||"solo",biome:tour?0:cfg.biome|0,hole:0,tour,strokes:0,card:[],total:0,mp,net:cfg.mode==="online"?online:null,waiting:false,mulligans:1,snap:null};
ui.showMenu(false);
fx.setFade(1);ui.setFade(1);
loadHole();
ui.showToast(cfg.mode==="hotseat"?`Hot-seat · ${players.join(", ")}`:cfg.mode==="online"?"Online · host rotates each hole":"Good luck — chase cam on!");
}
function toMenu(){audio.ui();game=null;fx.clear();if(ambient){ambient.dispose();ambient=null}ui.showMenu(true);controls.enabled=true}
function loadHole(){
if(!game)return;
const h=buildHole(game.biome,game.hole);
game.holeData=h;game.strokes=0;game.mulligans=1;game.snap=null;game.waiting=false;
if(holeMesh){holeGroup.remove(holeMesh);disposeGroup(holeMesh)}
holeMesh=buildHoleMeshes(h);holeGroup.add(holeMesh);
fx.registerFlags(holeMesh.userData.flags||[]);
if(ambient)ambient.dispose();
ambient=createAmbient(scene,h.biome);
applyBiomeAtmosphere(scene,camera,sun,hemi,h.biome);
ball=createBallState(h.tee);
syncBallMesh();
chase.snapToBall(ball,h);
refreshHud();
ui.drawMinimap(h,ball);
fx.setFade(1);ui.setFade(1);
if(game.net&&game.net.amHost())game.net.send({t:"hole",biome:game.biome,hole:game.hole,seed:h.seed});
}
function syncHole(d){if(!game)return;game.biome=d.biome;game.hole=d.hole;loadHole()}
function refreshHud(){
if(!game)return;
const h=game.holeData;
const pl=game.mp?game.mp.getTurn().name:"You";
const host=game.mp?game.mp.getHost().name:(game.mode==="online"?(online.amHost()?"You":"Peer"):"You");
const best=getBest(game.biome,game.hole);
const vs=game.strokes?game.strokes-h.par:null;
ui.setHud({biome:h.biome.name,hole:game.hole+1,par:h.par,strokes:game.strokes,total:game.total,player:pl,host,layout:`${h.layout}${h.terrain?" · "+h.terrain:""}`,best,vsPar:vs,mulligans:game.mulligans,terrain:h.terrain});
if(game.mp)ui.updateMp(game.mode==="online"?(game.net&&game.net.roomId):"local",game.mp.players.map(p=>p.name),game.mp.getHost().name,game.mp.getTurn().name);
}
function canPutt(){return game&&ball&&!ball.moving&&!ball.sunk&&!game.waiting}
function snapshotBall(){
if(!ball)return null;
return{x:ball.x,y:ball.y,z:ball.z,vx:0,vz:0,strokes:game.strokes};
}
function doPutt(dx,dz,power,fromNet=false){
if(!game||!ball||ball.moving||ball.sunk)return;
if(game.mode==="online"&&!fromNet&&!online.amHost()){online.send({t:"putt",dx,dz,p:power});ui.showToast("Sent putt to host");return}
if(game.mode==="online"&&!fromNet&&online.amHost())online.send({t:"putt",dx,dz,p:power});
const camDir=new THREE.Vector3();camera.getWorldDirection(camDir);
const forward=new THREE.Vector3(camDir.x,0,camDir.z).normalize();
const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
const world=new THREE.Vector3().addScaledVector(right,dx).addScaledVector(forward,-dz);
if(world.lengthSq()<1e-6)world.copy(forward);
game.snap=snapshotBall();
launch(ball,world.x,world.z,power);
game.strokes++;refreshHud();
audio.putt(power);fx.puttDust(ball.x,ball.z,power);
}
function doMulligan(){
if(!game||!ball||game.waiting)return;
if(game.mulligans<=0){ui.showToast("No mulligans left");return}
if(!game.snap||game.strokes<=0){ui.showToast("Nothing to undo");return}
if(ball.moving){ui.showToast("Wait for ball to stop");return}
Object.assign(ball,{x:game.snap.x,y:game.snap.y,z:game.snap.z,vx:0,vz:0,moving:false,sunk:false,inCup:false});
game.strokes=Math.max(0,game.strokes-1);
game.mulligans--;
game.snap=null;
syncBallMesh();refreshHud();
audio.ui();ui.showToast("Mulligan!");
}
function restartHole(){
if(!game)return;
audio.ui();
game.strokes=0;game.mulligans=1;game.snap=null;
resetBall(ball,game.holeData.tee);
syncBallMesh();chase.snapToBall(ball,game.holeData);refreshHud();
ui.showToast("Hole restarted");
}
input=createInput(canvas,()=>ball,(dx,dz,p)=>{if(!canPutt())return;doPutt(dx,dz,p)});
function onHazardOrOob(kind){
const x=ball.x,z=ball.z;
if(kind==="water")fx.waterSplash(x,z);else if(kind==="lava")fx.lavaPop(x,z);else fx.puttDust(x,z,0.5);
audio.hazard(kind==="oob"?"gap":kind);
resetBall(ball,game.holeData.tee);
syncBallMesh();
game.strokes++;
ui.showToast(kind==="oob"?"Out of bounds · +1":kind==="lava"?"Lava! · +1":kind==="gap"?"Into the void · +1":"Splash · +1");
refreshHud();
chase.snapToBall(ball,game.holeData);
}
function finishHole(){
if(!game||game.waiting)return;
game.waiting=true;
const par=game.holeData.par,sc=game.strokes;
game.card.push({par,strokes:sc});game.total+=sc;
if(game.mp)game.mp.addScore(sc);
const isNew=setBest(game.biome,game.hole,sc);
const rel=sc-par;
const msg=sc===1?"Hole in one!!!":rel<=-2?"Eagle!":rel===-1?"Birdie!":rel===0?"Par":rel===1?"Bogey":`+${rel}`;
ui.showToast(`${msg} · ${sc} strokes${isNew?" · NEW BEST":""}`,2600);
audio.sink();
if(sc===1){audio.holeInOne();fx.confettiBurst(game.holeData.cup.x,game.holeData.cup.z)}
else if(rel<=0)audio.cheer();
fx.sinkPop(game.holeData.cup.x,game.holeData.cup.z);
if(game.mp){game.mp.nextTurn();ui.showToast(`Host → ${game.mp.rotateHost().name}`,1600)}
if(game.net&&game.net.amHost()){game.net.rotateHostOnline();game.net.send({t:"state",total:game.total,card:game.card,hole:game.hole,biome:game.biome})}
setTimeout(()=>{game.waiting=false;advanceHole(false)},sc===1?2200:1600);
}
function advanceHole(skip){
if(!game)return;
if(skip&&game.strokes===0){/* free skip */}
else if(skip){game.card.push({par:game.holeData.par,strokes:game.strokes||game.holeData.par+MAX_STROKES_PAD});game.total+=game.strokes||game.holeData.par+MAX_STROKES_PAD}
if(game.hole>=17){
if(game.tour&&game.biome<BIOMES.length-1){game.biome++;game.hole=0;game.card=[];loadHole();ui.showToast(`${BIOMES[game.biome].name}`);return}
showScorecard();ui.showToast("Round complete!");audio.cheer();return;
}
game.hole++;loadHole();
}
function showScorecard(){
if(!game)return;
const title=game.tour?`Tour · ${BIOMES[game.biome].name}`:courseTitle(game.biome,game.hole);
const totals=game.mp?game.mp.players.map(p=>`${p.name}: ${p.total}`).join(" · "):`Total: ${game.total}`;
const best=getBest(game.biome,game.hole);
ui.openScorecard(title,game.card.length?game.card:[{par:game.holeData.par,strokes:game.strokes}],totals,best!=null?`Hole best ${best}`:"");
}
function applyNetState(d){
if(!game)return;
if(d.total!=null)game.total=d.total;
if(d.card)game.card=d.card;
if(d.strokes!=null)game.strokes=d.strokes;
if(d.hole!=null&&d.biome!=null&&(d.hole!==game.hole||d.biome!==game.biome)){game.hole=d.hole;game.biome=d.biome;loadHole()}
if(d.ball&&ball){Object.assign(ball,d.ball);syncBallMesh()}
refreshHud();
}
function broadcastBall(){
if(game&&game.net&&game.net.amHost()&&ball)game.net.send({t:"state",ball:{x:ball.x,y:ball.y,z:ball.z,vx:ball.vx,vz:ball.vz,sunk:ball.sunk},strokes:game.strokes});
}
function syncBallMesh(){
if(!ball)return;
const by=ball.y??0.12;
ballMesh.position.set(ball.x,by,ball.z);
ballShadow.position.set(ball.x,by-0.1,ball.z);
const hid=ball.sunk||ball.elevator;ballShadow.visible=!hid;
ballShadow.material.opacity=hid?0:0.28;
}
function rollBall(dt){
if(!ball||!ball.moving)return;
const spd=Math.hypot(ball.vx,ball.vz);
if(spd<0.01)return;
rollAxis.set(-ball.vz,0,ball.vx).normalize();
ballMesh.rotateOnWorldAxis(rollAxis,spd*dt/0.11);
}
function aimDirFromInput(){
const camDir=new THREE.Vector3();camera.getWorldDirection(camDir);
const forward=new THREE.Vector3(camDir.x,0,camDir.z).normalize();
const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
const world=new THREE.Vector3().addScaledVector(right,input.dirX).addScaledVector(forward,-input.dirZ);
if(world.lengthSq()<1e-6)world.copy(forward);return world.normalize();
}
function forcePickup(){
if(!game||game.waiting)return;
game.waiting=true;
const par=game.holeData.par,sc=Math.max(game.strokes,par+MAX_STROKES_PAD);
game.card.push({par,strokes:sc});game.total+=sc;
if(game.mp)game.mp.addScore(sc);
audio.ui();ui.showToast(`Pick-up · ${sc}`);
setTimeout(()=>{if(game){game.waiting=false;advanceHole(false)}},1200);
}
function tick(now){
const dt=Math.min(0.05,(now-last)/1000);last=now;
if(game&&ball){
const wasMoving=ball.moving;
if(ball.moving||(!ball.sunk&&(Math.abs(ball.vx)+Math.abs(ball.vz))>0)){
let hzType="water";
const res=step(ball,game.holeData,dt,(type)=>{hzType=type});
if(res.wallHit>0.4){audio.wall(res.wallHit);fx.wallSpark(ball.x,ball.z,res.wallHit);fx.kick(0.04+res.wallHit*0.015)}
if(res.hazard)onHazardOrOob(hzType);
else if(res.oob)onHazardOrOob("oob");
else if(res.sunk)finishHole();
else if(res.stopped)broadcastBall();
if(game.net&&game.net.amHost()&&Math.random()<0.2)broadcastBall();
}
const lim=game.holeData.par+MAX_STROKES_PAD;
if(!ball.sunk&&!ball.moving&&game.strokes>=lim&&!game.waiting){ui.showToast(`Stroke limit · ${lim}`);forcePickup()}
syncBallMesh();
rollBall(dt);
fx.pushTrail(ball.x,ballMesh.position.y,ball.z,!!ball.moving);
chase.update(ball,game.holeData,dt,!!ball.moving||wasMoving);
if(input&&input.dragging&&input.power>0&&canPutt()){
const dir=aimDirFromInput();
const aimY=(ball.y??0.12)+0.1;
updateAimGraphic(aimLine,ball.x,aimY,ball.z,dir,input.power);
const fine=input.fineDeg?` · fine ${input.fineDeg>0?"+":""}${input.fineDeg.toFixed(1)}°`:"";
ui.setPower(input.power,fine);
}else{aimLine.visible=false;ui.setPower(0)}
ui.drawMinimap(game.holeData,ball);
if(ambient)ambient.update(dt,ball.x,ball.z);
const glow=holeMesh?.getObjectByName("cupGlow");
if(glow){const d=Math.hypot(ball.x-game.holeData.cup.x,ball.z-game.holeData.cup.z);glow.material.opacity=d<4?0.25+0.45*(1-d/4):0.12;glow.material.emissiveIntensity=d<2?0.55:0.2}
}else{controls.update()}
fx.update(dt);
ui.setFade(fx.getFade());
const sh=fx.getShake();
if(sh.x||sh.y){camera.position.x+=sh.x;camera.position.y+=sh.y}
renderer.render(scene,camera);
requestAnimationFrame(tick);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)});
addEventListener("keydown",e=>{
if(!game)return;
if(e.key==="Escape")toMenu();
else if(e.key==="r"||e.key==="R")restartHole();
else if(e.key==="m"||e.key==="M")doMulligan();
else if(e.key==="n"||e.key==="N")advanceHole(true);
else if(e.key==="Tab"){e.preventDefault();showScorecard()}
else if(e.key==="s"||e.key==="S"){const m=audio.toggleMute();setSetting("muted",m);ui.showToast(m?"Muted":"Sound on")}
});
canvas.addEventListener("pointerdown",()=>audio.unlock(),{once:true});
fillBiomes();
ui.showMenu(true);
requestAnimationFrame(tick);