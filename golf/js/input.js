function createInput(canvas,getBall,onPutt){
const state={dragging:false,sx:0,sy:0,cx:0,cy:0,power:0,dirX:0,dirZ:0,enabled:true,pointerId:null,aimAng:null,fineDeg:0,pullMax:300};
function onDown(e){
if(!state.enabled)return;
if(e.pointerType!=="touch"&&e.button!==0)return;
state.dragging=true;state.pointerId=e.pointerId??0;
state.sx=e.clientX;state.sy=e.clientY;state.cx=e.clientX;state.cy=e.clientY;
state.power=0;state.aimAng=null;state.fineDeg=0;
try{canvas.setPointerCapture(e.pointerId)}catch(_){}
e.preventDefault();
}
function wrapPi(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function onMove(e){
if(!state.dragging||!state.enabled)return;
if(state.pointerId!=null&&e.pointerId!=null&&e.pointerId!==state.pointerId)return;
if(e.pointerType!=="touch"&&(e.buttons&1)===0){cancelPutt();return}
state.cx=e.clientX;state.cy=e.clientY;
const dx=state.sx-state.cx,dy=state.sy-state.cy;
const dist=Math.hypot(dx,dy);
state.power=Math.min(1,Math.max(0,dist/state.pullMax));
if(dist<2){e.preventDefault();return}
const targetAng=Math.atan2(dx,dy);
if(state.aimAng==null)state.aimAng=targetAng;
let dAng=wrapPi(targetAng-state.aimAng);
const follow=0.06+state.power*0.72;
state.aimAng=wrapPi(state.aimAng+dAng*follow);
const ang=state.aimAng+(state.fineDeg*Math.PI/180);
state.dirX=Math.sin(ang);
state.dirZ=Math.cos(ang);
e.preventDefault();
}
function cancelPutt(){
state.dragging=false;state.power=0;state.pointerId=null;state.aimAng=null;state.fineDeg=0;
}
function onUp(e){
if(!state.dragging||!state.enabled)return;
if(state.pointerId!=null&&e.pointerId!=null&&e.pointerId!==state.pointerId)return;
if(e.pointerType!=="touch"&&e.button!==0)return;
const p=state.power,dx=state.dirX,dz=state.dirZ;
cancelPutt();
try{canvas.releasePointerCapture(e.pointerId)}catch(_){}
if(p>0.04)onPutt(dx,dz,p);
e.preventDefault();
}
function nudgeAim(deg){
if(!state.dragging||!state.enabled)return;
state.fineDeg=Math.max(-12,Math.min(12,state.fineDeg+deg));
const ang=(state.aimAng??0)+(state.fineDeg*Math.PI/180);
state.dirX=Math.sin(ang);state.dirZ=Math.cos(ang);
}
function onKey(e){
if(!state.dragging)return;
if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A"||e.key==="q"||e.key==="Q"){nudgeAim(e.shiftKey?-0.15:-0.4);e.preventDefault()}
if(e.key==="ArrowRight"||e.key==="d"||e.key==="D"||e.key==="e"||e.key==="E"){nudgeAim(e.shiftKey?0.15:0.4);e.preventDefault()}
}
canvas.addEventListener("pointerdown",onDown);
canvas.addEventListener("pointermove",onMove);
canvas.addEventListener("pointerup",onUp);
canvas.addEventListener("pointercancel",()=>cancelPutt());
canvas.addEventListener("contextmenu",e=>e.preventDefault());
canvas.addEventListener("lostpointercapture",()=>cancelPutt());
addEventListener("keydown",onKey);
return state;
}
export{createInput};