function $(sel){return document.querySelector(sel)}
function bindUI(handlers){
const menu=$("#menu"),hud=$("#hud"),power=$("#power-wrap"),toast=$("#toast"),score=$("#scorecard"),mp=$("#mp-bar"),aimHint=$("#aim-hint"),fade=$("#fade"),minimap=$("#minimap");
$("#btn-solo").onclick=()=>{handlers.unlock?.();handlers.start({mode:"solo",biome:+$("#biome-select").value,players:["You"]})};
$("#btn-hotseat").onclick=()=>{
handlers.unlock?.();
const n=Math.max(2,Math.min(4,+$("#player-count").value||2));
const players=Array.from({length:n},(_,i)=>`Player ${i+1}`);
handlers.start({mode:"hotseat",biome:+$("#biome-select").value,players});
};
$("#btn-create-room").onclick=async()=>{try{handlers.unlock?.();const id=await handlers.createRoom();$("#room-code").value=id;showToast(`Room ${id.slice(0,8)}… share this code`);updateMp(id,["you (host)"])}catch(e){showToast(String(e.message||e))}};
$("#btn-join-room").onclick=async()=>{try{handlers.unlock?.();const id=$("#room-code").value.trim();if(!id)return showToast("Enter room code");await handlers.joinRoom(id);showToast("Joined room");}catch(e){showToast(String(e.message||e))}};
$("#btn-online-start").onclick=()=>{handlers.unlock?.();handlers.start({mode:"online",biome:+$("#biome-select").value,players:["You"]})};
$("#btn-menu").onclick=()=>handlers.toMenu();
$("#btn-next").onclick=()=>handlers.nextHole();
$("#btn-restart")?.addEventListener("click",()=>handlers.restartHole?.());
$("#btn-mulligan")?.addEventListener("click",()=>handlers.mulligan?.());
$("#btn-mute")?.addEventListener("click",()=>{const m=handlers.toggleMute?.();$("#btn-mute").textContent=m?"Unmute":"Mute"});
$("#btn-close-score").onclick=()=>score.classList.remove("open");
$("#btn-show-score").onclick=()=>handlers.showScore();
function showMenu(v){menu.classList.toggle("hidden",!v);hud.classList.toggle("hidden",v);power.classList.toggle("hidden",v);aimHint.classList.toggle("hidden",v);if(minimap)minimap.classList.toggle("hidden",v)}
function setHud({biome,hole,par,strokes,total,player,host,layout,best,vsPar,mulligans}){
$("#h-biome").textContent=biome;
$("#h-hole").textContent=`Hole ${hole}/18`;
$("#h-par").textContent=`Par ${par}`;
$("#h-strokes").textContent=String(strokes);
$("#h-total").textContent=String(total);
$("#h-player").textContent=player||"—";
$("#h-host").textContent=host||"—";
if($("#h-layout"))$("#h-layout").textContent=layout?String(layout).replace(/_/g," "):"—";
if($("#h-terrain")&&arguments[0].terrain)$("#h-terrain").textContent=String(arguments[0].terrain).replace(/_/g," ");
if($("#h-best"))$("#h-best").textContent=best!=null?`Best ${best}`:"Best —";
if($("#h-vs")){
const el=$("#h-vs");
if(vsPar==null||strokes===0){el.textContent="E";el.className="vs even"}
else if(vsPar===0){el.textContent="E";el.className="vs even"}
else if(vsPar<0){el.textContent=String(vsPar);el.className="vs under"}
else{el.textContent=`+${vsPar}`;el.className="vs over"}
}
if($("#h-mull"))$("#h-mull").textContent=mulligans!=null?`Mulligan ${mulligans}`:"";
}
function setPower(p){
$("#power-fill").style.width=`${Math.round(p*100)}%`;
const label=p>0.02?(p<0.35?"Tap":p<0.7?"Firm":"Crush")+` · ${Math.round(p*100)}%`:"Drag to aim · release to putt";
$("#power-label").textContent=label;
$("#power-fill").style.filter=p>0.7?"brightness(1.15)":"none";
}
let toastT=0;
function showToast(msg,ms=2200){toast.textContent=msg;toast.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>toast.classList.remove("show"),ms)}
function openScorecard(title,rows,totals,bestLine){
$("#score-title").textContent=title;
const grid=$("#score-grid");grid.innerHTML="";
rows.forEach((r,i)=>{const d=document.createElement("div");d.className="score-cell"+(r.strokes<r.par?" under":r.strokes>r.par?" over":"");d.innerHTML=`<div class="n">${i+1}</div><b>${r.strokes??"—"}</b><div class="n">p${r.par}</div>`;grid.appendChild(d)});
$("#score-totals").textContent=totals+(bestLine?` · ${bestLine}`:"");
score.classList.add("open");
}
function updateMp(code,names,hostName,turnName){
if(!code&&(!names||!names.length)){mp.classList.add("hidden");return}
mp.classList.remove("hidden");
$("#mp-code").textContent=code||"—";
const box=$("#mp-players");box.innerHTML="";
(names||[]).forEach(n=>{const s=document.createElement("span");s.className="pill"+(n===hostName?" host":"")+(n===turnName?" turn":"");s.textContent=n;box.appendChild(s)});
}
function setFade(a){if(fade){fade.style.opacity=String(a);fade.classList.toggle("on",a>0.02)}}
function drawMinimap(hole,ball){
if(!minimap||!hole)return;
const ctx=minimap.getContext("2d");
const W=minimap.width,H=minimap.height;
ctx.clearRect(0,0,W,H);
ctx.fillStyle="rgba(0,0,0,0.45)";ctx.fillRect(0,0,W,H);
const b=hole.bounds;
const pad=2;
const sx=(W-8)/(b.maxX-b.minX+pad*2),sz=(H-8)/(b.maxZ-b.minZ+pad*2);
const s=Math.min(sx,sz);
const ox=W/2-((b.minX+b.maxX)/2)*s,oz=H/2-((b.minZ+b.maxZ)/2)*s;
const tx=x=>ox+x*s,tz=z=>oz+z*s;
ctx.strokeStyle="rgba(90,200,120,0.85)";ctx.lineWidth=2.5;ctx.beginPath();
for(let i=0;i<hole.center.length;i++){const p=hole.center[i];i?ctx.lineTo(tx(p.x),tz(p.z)):ctx.moveTo(tx(p.x),tz(p.z))}
ctx.stroke();
ctx.fillStyle="#ff4060";ctx.beginPath();ctx.arc(tx(hole.cup.x),tz(hole.cup.z),4,0,6.28);ctx.fill();
ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(tx(hole.tee.x),tz(hole.tee.z),3,0,6.28);ctx.fill();
if(ball){ctx.fillStyle="#5dff9a";ctx.beginPath();ctx.arc(tx(ball.x),tz(ball.z),3.5,0,6.28);ctx.fill()}
for(const h of hole.hazards){
ctx.fillStyle=h.type==="sand"?"#c8a050":h.type==="water"?"#3080c0":h.type==="lava"?"#ff4020":"rgba(255,255,255,0.3)";
ctx.beginPath();ctx.arc(tx(h.x),tz(h.z),Math.max(2,h.r*s*0.5),0,6.28);ctx.fill();
}
}
return{showMenu,setHud,setPower,showToast,openScorecard,updateMp,setFade,drawMinimap};
}
export{bindUI,$};