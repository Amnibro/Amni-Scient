function createInput(canvas,getBall,onPutt){
const state={dragging:false,sx:0,sy:0,cx:0,cy:0,power:0,dirX:0,dirZ:0,enabled:true,pointerId:null};
function isPuttButton(e){
if(e.pointerType==="touch")return true;
if(e.pointerType==="pen")return e.buttons===1||e.button===0;
return e.button===0||(e.type==="pointermove"&&(e.buttons&1)===1&&state.dragging);
}
function onDown(e){
if(!state.enabled)return;
if(e.pointerType!=="touch"&&e.button!==0)return;
state.dragging=true;state.pointerId=e.pointerId??0;
state.sx=e.clientX;state.sy=e.clientY;state.cx=e.clientX;state.cy=e.clientY;state.power=0;
try{canvas.setPointerCapture(e.pointerId)}catch(_){}
e.preventDefault();
}
function onMove(e){
if(!state.dragging||!state.enabled)return;
if(state.pointerId!=null&&e.pointerId!=null&&e.pointerId!==state.pointerId)return;
if(e.pointerType!=="touch"&&(e.buttons&1)===0){cancelPutt();return}
state.cx=e.clientX;state.cy=e.clientY;
const dx=state.sx-state.cx,dy=state.sy-state.cy;
const dist=Math.hypot(dx,dy);
state.power=Math.min(1,dist/180);
const ang=Math.atan2(dx,dy);
state.dirX=Math.sin(ang);
state.dirZ=Math.cos(ang);
e.preventDefault();
}
function cancelPutt(){
state.dragging=false;state.power=0;state.pointerId=null;
}
function onUp(e){
if(!state.dragging||!state.enabled)return;
if(state.pointerId!=null&&e.pointerId!=null&&e.pointerId!==state.pointerId)return;
if(e.pointerType!=="touch"&&e.button!==0)return;
const p=state.power,dx=state.dirX,dz=state.dirZ;
cancelPutt();
try{canvas.releasePointerCapture(e.pointerId)}catch(_){}
if(p>0.06)onPutt(dx,dz,p);
e.preventDefault();
}
function onContext(e){e.preventDefault()}
canvas.addEventListener("pointerdown",onDown);
canvas.addEventListener("pointermove",onMove);
canvas.addEventListener("pointerup",onUp);
canvas.addEventListener("pointercancel",()=>cancelPutt());
canvas.addEventListener("contextmenu",onContext);
canvas.addEventListener("lostpointercapture",()=>cancelPutt());
return state;
}
export{createInput};