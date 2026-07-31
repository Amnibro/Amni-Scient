const BIOMES=[
{id:0,name:"Meadow Green",sky:0x7ec8f0,fog:0xb5dcc0,fogNear:55,fogFar:155,grass:0x2f9e4a,fairway:0x3db85a,rough:0x2a6e38,rail:0x6b3e1a,sand:0xe8c878,water:0x2a80b8,hazard:"sand",fric:0.986,bounce:0.55,ambient:0x90b090,ground:0x3d8a4a,accent:0xffd060,soil:0x5a3a20,leaf:0x2a8040},
{id:1,name:"Desert Dunes",sky:0xffc878,fog:0xe8b070,fogNear:45,fogFar:145,grass:0xc9a060,fairway:0xd8b070,rough:0xa88848,rail:0x8a5a38,sand:0xf5dfa0,water:0x4a90a0,hazard:"sand",fric:0.978,bounce:0.5,ambient:0xc8a878,ground:0xc49a58,accent:0xff8844,soil:0x8a6030,leaf:0x6a9040},
{id:2,name:"Icy Peaks",sky:0xc0e4ff,fog:0xd8f0ff,fogNear:40,fogFar:135,grass:0xd0e8f0,fairway:0xe8f4fa,rough:0xa8c4d0,rail:0x6a8898,sand:0xf0f8ff,water:0x3a6a90,hazard:"ice",fric:0.994,bounce:0.65,ambient:0xa0c0d8,ground:0xb8d0e0,accent:0x80c0ff,soil:0x8090a0,leaf:0xd8eef8},
{id:3,name:"Volcano Forge",sky:0x281210,fog:0x3a1814,fogNear:30,fogFar:115,grass:0x3a3230,fairway:0x4a3c38,rough:0x2a2220,rail:0x1a1210,sand:0x5a3020,water:0xff4400,hazard:"lava",fric:0.982,bounce:0.48,ambient:0x804040,ground:0x2a1814,accent:0xff6020,soil:0x1a0c08,leaf:0x4a2020},
{id:4,name:"Coral Lagoon",sky:0x38b8d8,fog:0x58c8e0,fogNear:48,fogFar:148,grass:0x40c888,fairway:0x50d898,rough:0x289868,rail:0xd0a878,sand:0xf0e0b0,water:0x1890c8,hazard:"water",fric:0.986,bounce:0.5,ambient:0x58a8b8,ground:0x2a8870,accent:0xff80a0,soil:0x8a6840,leaf:0x2ea85a},
{id:5,name:"Neon Arcade",sky:0x080414,fog:0x120828,fogNear:28,fogFar:105,grass:0x1a1030,fairway:0x2a1850,rough:0x100820,rail:0xff40c8,sand:0x40ffe0,water:0x4040ff,hazard:"bounce",fric:0.988,bounce:0.85,ambient:0x6030a0,ground:0x080410,accent:0x40ffe0,soil:0x100818,leaf:0xff40c8},
{id:6,name:"Sky Garden",sky:0xa0d4ff,fog:0xc4e4ff,fogNear:50,fogFar:165,grass:0x48c068,fairway:0x58d078,rough:0x38a058,rail:0xe8e0d0,sand:0xf0e8c8,water:0x48b0e0,hazard:"water",fric:0.987,bounce:0.52,ambient:0x90b8c8,ground:0x70b888,accent:0xffc0e0,soil:0x6a5030,leaf:0x40b060},
{id:7,name:"Aqua Dome",sky:0x0a2840,fog:0x124868,fogNear:25,fogFar:95,grass:0x2a90a8,fairway:0x3aa8c0,rough:0x1a6078,rail:0x80e8ff,sand:0xc0e0f0,water:0x20a0e0,hazard:"water",fric:0.984,bounce:0.6,ambient:0x40a0c0,ground:0x0a2030,accent:0x40ffe0,soil:0x1a3040,leaf:0x40e0a0,theme:"aquarium"}
];
const LAYOUTS=["straight","dogleg_l","dogleg_r","s_curve","u_turn","zigzag","long_bend","double_dog","narrow_gate","loop_hint","horseshoe","spiral_hint","split_feel","island_green","switchback","valley","plateau_run","canyon","helix","figure_eight","stair_climb","drop_run","tank_crawl","elevator_hop","bridge_gap","maze_fold"];
const TERRAIN=["flat","gentle_roll","washboard","ramp_up","ramp_down","valley","ridge","stairs","wave","terrace","bowl_mid","drop_shelf"];
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function hashSeed(biome,hole){return ((biome+1)*73856093)^((hole+1)*19349663)^0x9e3779b9}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function pathLen(pts){let s=0;for(let i=1;i<pts.length;i++)s+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);return s}
function catmull(p0,p1,p2,p3,t){
const t2=t*t,t3=t2*t;
return{x:0.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),z:0.5*((2*p1.z)+(-p0.z+p2.z)*t+(2*p0.z-5*p1.z+4*p2.z-p3.z)*t2+(-p0.z+3*p1.z-3*p2.z+p3.z)*t3)};
}
function resample(ctrl,spacing=0.38){
const out=[];
const ext=[ctrl[0],...ctrl,ctrl[ctrl.length-1]];
for(let i=1;i<ext.length-2;i++){
const p0=ext[i-1],p1=ext[i],p2=ext[i+1],p3=ext[i+2];
const seg=Math.hypot(p2.x-p1.x,p2.z-p1.z);
const n=Math.max(4,Math.ceil(seg/spacing));
for(let j=0;j<n;j++)out.push(catmull(p0,p1,p2,p3,j/n));
}
out.push({x:ctrl[ctrl.length-1].x,z:ctrl[ctrl.length-1].z});
return out;
}
function makeCtrl(layout,L,rng){
const pts=[{x:0,z:0}];
const add=(x,z)=>pts.push({x:pts[pts.length-1].x+x,z:pts[pts.length-1].z+z});
if(layout==="straight"){add((rng()-0.5)*1.5,L*0.5);add((rng()-0.5)*1.5,L*0.5)}
else if(layout==="dogleg_l"){add(0,L*0.4);add(-L*0.32,L*0.3);add(-L*0.06,L*0.28)}
else if(layout==="dogleg_r"){add(0,L*0.4);add(L*0.32,L*0.3);add(L*0.06,L*0.28)}
else if(layout==="s_curve"){add(L*0.22,L*0.26);add(-L*0.22,L*0.26);add(L*0.14,L*0.26);add(0,L*0.18)}
else if(layout==="u_turn"){add(0,L*0.34);add(L*0.36,L*0.14);add(L*0.36,-0.04*L);add(0,L*0.18);add(-L*0.12,L*0.22)}
else if(layout==="zigzag"){add(L*0.2,L*0.2);add(-L*0.24,L*0.2);add(L*0.22,L*0.2);add(-L*0.14,L*0.2);add(0,L*0.14)}
else if(layout==="long_bend"){add(L*0.1,L*0.32);add(L*0.2,L*0.32);add(L*0.12,L*0.32)}
else if(layout==="double_dog"){add(0,L*0.26);add(L*0.26,L*0.2);add(L*0.06,L*0.18);add(-L*0.24,L*0.2);add(0,L*0.12)}
else if(layout==="narrow_gate"){add(0,L*0.42);add((rng()-0.5)*0.8,L*0.58)}
else if(layout==="loop_hint"){add(L*0.16,L*0.24);add(L*0.26,L*0.2);add(0,L*0.18);add(-L*0.22,L*0.2);add(0,L*0.14)}
else if(layout==="horseshoe"){add(L*0.08,L*0.3);add(L*0.3,L*0.15);add(L*0.08,L*0.05);add(-L*0.2,L*0.15);add(-L*0.08,L*0.25)}
else if(layout==="spiral_hint"){add(L*0.12,L*0.22);add(L*0.2,L*0.18);add(L*0.08,L*0.16);add(-L*0.1,L*0.18);add(-L*0.05,L*0.2)}
else if(layout==="split_feel"){add(L*0.18,L*0.28);add(-L*0.05,L*0.22);add(-L*0.18,L*0.22);add(0.05*L,L*0.24)}
else if(layout==="island_green"){add(0,L*0.55);add((rng()-0.5)*2,L*0.2);add((rng()-0.5),L*0.2)}
else if(layout==="switchback"){add(L*0.25,L*0.22);add(-L*0.05,L*0.18);add(-L*0.25,L*0.22);add(0.05*L,L*0.18);add(L*0.12,L*0.16)}
else if(layout==="valley"){add((rng()-0.5)*0.5,L*0.33);add((rng()-0.5)*0.5,L*0.33);add((rng()-0.5)*0.5,L*0.34)}
else if(layout==="plateau_run"){add(0,L*0.3);add(L*0.15,L*0.25);add(-L*0.05,L*0.25);add(0,L*0.2)}
else if(layout==="canyon"){add(0,L*0.35);add((rng()-0.5)*0.6,L*0.35);add((rng()-0.5)*0.6,L*0.3)}
else if(layout==="helix"){for(let i=0;i<5;i++){const a=i*1.1;add(Math.cos(a)*L*0.12,L*0.18+Math.sin(a)*L*0.04)}}
else if(layout==="figure_eight"){add(L*0.2,L*0.2);add(0,L*0.15);add(-L*0.2,L*0.2);add(0,L*0.15);add(L*0.15,L*0.15);add(0,L*0.12)}
else if(layout==="stair_climb"){add(0,L*0.2);add(L*0.12,L*0.2);add(-L*0.08,L*0.2);add(L*0.1,L*0.2);add(0,L*0.15)}
else if(layout==="drop_run"){add((rng()-0.5),L*0.35);add((rng()-0.5)*0.8,L*0.35);add(0,L*0.3)}
else if(layout==="tank_crawl"){add(0,L*0.25);add(L*0.22,L*0.2);add(-L*0.1,L*0.2);add(-L*0.15,L*0.2);add(0,L*0.15)}
else if(layout==="elevator_hop"){add(0,L*0.3);add(L*0.25,0.05*L);add(L*0.05,L*0.3);add(-L*0.15,L*0.25)}
else if(layout==="bridge_gap"){add(0,L*0.28);add((rng()-0.5)*0.4,L*0.22);add(0,L*0.28);add((rng()-0.5)*0.3,L*0.22)}
else if(layout==="maze_fold"){add(L*0.18,L*0.15);add(-L*0.05,L*0.15);add(-L*0.18,L*0.15);add(0.05*L,L*0.15);add(L*0.12,L*0.15);add(0,L*0.15)}
else{add(0,L*0.5);add((rng()-0.5)*2,L*0.5)}
const sc=L/Math.max(1e-3,pathLen(pts));
for(let i=1;i<pts.length;i++){pts[i].x*=sc;pts[i].z*=sc}
return pts;
}
function heightAt(terrain,t,phase,scale){
const s=scale||1;
const ph=typeof phase==="function"?phase():(phase||0);
if(terrain==="flat")return 0;
if(terrain==="gentle_roll")return Math.sin(t*Math.PI*2.2)*0.35*s+Math.sin(t*9+ph)*0.08*s;
if(terrain==="washboard")return Math.sin(t*Math.PI*10)*0.12*s;
if(terrain==="ramp_up")return t*2.4*s;
if(terrain==="ramp_down")return(1-t)*2.2*s;
if(terrain==="valley")return Math.sin(t*Math.PI)*-1.1*s;
if(terrain==="ridge")return Math.sin(t*Math.PI)*1.3*s;
if(terrain==="stairs")return Math.floor(t*6)*0.38*s;
if(terrain==="wave")return Math.sin(t*Math.PI*3)*0.7*s+Math.sin(t*Math.PI)*0.3*s;
if(terrain==="terrace")return Math.floor(t*4)*0.85*s;
if(terrain==="bowl_mid")return Math.sin(t*Math.PI)*-0.9*s+(t>0.7?(t-0.7)*2:0);
if(terrain==="drop_shelf")return t<0.55?1.6*s:0.05*s;
return Math.sin(t*4)*0.2*s;
}
function widthProfile(layout,t,base,rng){
let w=base*(1+0.1*Math.sin(t*7+rng()));
if(layout==="narrow_gate")w*=(t>0.32&&t<0.58?0.48:1.08);
if(layout==="canyon"||layout==="tank_crawl")w*=0.72+0.12*Math.sin(t*4);
if(layout==="island_green")w*=(t>0.75?1.4:0.9);
if(layout==="u_turn")w*=0.88+0.18*Math.sin(t*Math.PI);
if(layout==="bridge_gap")w*=(t>0.4&&t<0.6?0.55:1);
if(layout==="maze_fold")w*=0.85;
return w;
}
function buildEdges(center,widths){
const left=[],right=[];
for(let i=0;i<center.length;i++){
const p=center[i];
const a=center[Math.max(0,i-1)],b=center[Math.min(center.length-1,i+1)];
let dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;dx/=len;dz/=len;
const nx=-dz,nz=dx,hw=widths[i]*0.5,y=p.y||0;
left.push({x:p.x+nx*hw,z:p.z+nz*hw,y});
right.push({x:p.x-nx*hw,z:p.z-nz*hw,y});
}
return{left,right};
}
function wallSegs(edge,h=0.55,thick=0.28){
const walls=[];
for(let i=0;i<edge.length-1;i++){
const a=edge[i],b=edge[i+1];
const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
if(len<0.05)continue;
const y=((a.y||0)+(b.y||0))*0.5;
const hh=h*(0.85+0.25*Math.sin(i*0.7));
walls.push({cx:(a.x+b.x)*0.5,cz:(a.z+b.z)*0.5,cy:y,sx:thick,sz:len+0.08,rot:Math.atan2(dx,dz),h:hh+Math.abs((b.y||0)-(a.y||0))*0.5});
}
return walls;
}
function sidePoint(center,widths,t,side,distExtra,rng){
const i=Math.floor(t*(center.length-1));
const p=center[i],a=center[Math.max(0,i-1)],b=center[Math.min(center.length-1,i+1)];
let tx=b.x-a.x,tz=b.z-a.z,tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
const nx=-tz,nz=tx;
const dist=widths[i]*0.5+distExtra;
return{x:p.x+nx*side*dist+(rng()-0.5)*0.4,z:p.z+nz*side*dist+(rng()-0.5)*0.4,y:p.y||0,i};
}
function biomeKinds(id){
if(id===1)return["cactus","rock","rock","bush","dune"];
if(id===2)return["pine","pine","rock","rock","crystal"];
if(id===3)return["rock","ember","ember","rock","spike"];
if(id===4)return["palm","palm","rock","bush","reed"];
if(id===5)return["neon","neon","neon","rock","panel"];
if(id===6)return["tree","bush","flower","rock","cloudrock"];
if(id===7)return["coral","fish","bubble","rock","reed","tube"];
return["tree","tree","bush","bush","rock","flower"];
}
function buildHole(biomeId,holeIndex){
const biome=BIOMES[biomeId%BIOMES.length];
const rng=mulberry32(hashSeed(biomeId,holeIndex)>>>0);
const diff=holeIndex/17;
const isAqua=biome.id===7;
const layoutPool=isAqua?["tank_crawl","elevator_hop","bridge_gap","helix","s_curve","switchback","maze_fold","drop_run","figure_eight","stair_climb"]:LAYOUTS;
const layout=layoutPool[(holeIndex*3+biomeId*5+Math.floor(rng()*3))%layoutPool.length];
const terrainPool=isAqua?["stairs","terrace","ramp_up","ramp_down","drop_shelf","wave","ridge"]:TERRAIN;
const terrain=terrainPool[(holeIndex+biomeId*2+Math.floor(rng()*2))%terrainPool.length];
const elevScale=isAqua?1.35:0.85+diff*0.4;
const length=clamp(24+rng()*16+diff*12+(isAqua?4:0),22,52);
const baseW=clamp(4.0+rng()*1.8-diff*0.45+(layout==="narrow_gate"||layout==="canyon"||layout==="tank_crawl"?-0.7:0),3.1,6.4);
const ctrl=makeCtrl(layout,length,rng);
const center=resample(ctrl,0.38);
for(let i=0;i<center.length;i++){
const t=i/Math.max(1,center.length-1);
center[i].y=heightAt(terrain,t,rng()*6.28,elevScale);
if(isAqua&&layout==="elevator_hop"){
if(t>0.28&&t<0.42)center[i].y=2.4;
if(t>=0.42&&t<0.55)center[i].y=2.4-(t-0.42)*8;
if(t>=0.55)center[i].y=Math.max(0,1.2-(t-0.55)*2);
}
if(layout==="stair_climb")center[i].y=Math.floor(t*7)*0.42;
if(layout==="drop_run")center[i].y=t<0.5?1.8*(1-t*1.2):0.05;
}
const widths=center.map((_,i)=>widthProfile(layout,i/Math.max(1,center.length-1),baseW,rng));
const{left,right}=buildEdges(center,widths);
const wallH=biome.id===5||isAqua?0.75:biome.id===3?0.62:0.55;
const walls=[...wallSegs(left,wallH,0.3),...wallSegs(right,wallH,0.3)];
const c0=center[0],c1=center[1];
let dx=c1.x-c0.x,dz=c1.z-c0.z,dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
const teeY=(c0.y||0)+0.14;
const tee={x:c0.x-dx*0.4,y:teeY,z:c0.z-dz*0.4};
const cupP=center[center.length-1];
const cup={x:cupP.x,y:cupP.y||0,z:cupP.z};
const greenR=1.85+rng()*0.55;
const hazards=[];
const nH=2+Math.floor(diff*3+rng()*3)+(isAqua?1:0);
for(let k=0;k<nH;k++){
const t=0.18+rng()*0.58;
const side=rng()<0.5?1:-1;
const sp=sidePoint(center,widths,t,side,0.15+rng()*0.75,rng);
let type=biome.hazard;
const roll=rng();
if(biome.id===0)type=roll<0.5?"sand":roll<0.75?"water":"sand";
if(biome.id===1)type=roll<0.7?"sand":"water";
if(biome.id===2)type=roll<0.6?"ice":"sand";
if(biome.id===3)type=roll<0.65?"lava":"sand";
if(biome.id===4)type=roll<0.6?"water":"sand";
if(biome.id===5)type=roll<0.5?"bounce":roll<0.75?"sand":"water";
if(biome.id===6)type=roll<0.45?"water":roll<0.7?"sand":"gap";
if(isAqua)type=roll<0.55?"water":roll<0.8?"bounce":"sand";
const r=type==="sand"?0.65+rng()*1.0:0.5+rng()*0.7;
if(Math.hypot(sp.x-cup.x,sp.z-cup.z)<greenR+0.8)continue;
if(Math.hypot(sp.x-tee.x,sp.z-tee.z)<2.2)continue;
hazards.push({x:sp.x,z:sp.z,y:sp.y||0,r,type,depth:type==="sand"?0.16+rng()*0.1:0.12});
}
const obstacles=[];
const nObs=1+Math.floor(diff*2+rng()*3)+(isAqua?2:0);
for(let k=0;k<nObs;k++){
const t=0.25+rng()*0.5;
const i=Math.floor(t*(center.length-1));
const p=center[i],a=center[Math.max(0,i-1)],b=center[Math.min(center.length-1,i+1)];
let tx=b.x-a.x,tz=b.z-a.z,tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
const nx=-tz,nz=tx;
const kind=isAqua?(rng()<0.4?"pillar":rng()<0.7?"bumper":"block"):(rng()<0.35?"bumper":rng()<0.7?"block":"pillar");
const side=(rng()-0.5)*widths[i]*0.35;
const ox=p.x+nx*side,oz=p.z+nz*side,oy=p.y||0;
if(kind==="bumper")obstacles.push({type:"bumper",x:ox,z:oz,y:oy,r:0.35+rng()*0.25,boost:1.1+rng()*0.4});
else if(kind==="pillar"){
const pr=0.28+rng()*0.2,ph=0.9+rng()*0.8;
obstacles.push({type:"pillar",x:ox,z:oz,y:oy,r:pr,h:ph});
walls.push({cx:ox,cz:oz,cy:oy,sx:pr*2,sz:pr*2,rot:0,h:ph});
}else{
const bw=0.35+rng()*0.25,bl=1.1+rng()*0.9,bh=0.55+rng()*0.35;
const rot=Math.atan2(tx,tz)+Math.PI*0.5;
obstacles.push({type:"block",x:ox,z:oz,y:oy,sx:bw,sz:bl,h:bh,rot});
walls.push({cx:ox,cz:oz,cy:oy,sx:bw,sz:bl,rot,h:bh});
}
}
const features=[];
const forces=[];
if(terrain==="ramp_up"||layout==="stair_climb"){
const mid=center[Math.floor(center.length*0.45)];
forces.push({type:"boost",x:mid.x,z:mid.z,r:1.4,fx:0,fz:0,up:0.35});
}
if(isAqua||layout==="elevator_hop"||(rng()<0.25&&diff>0.3)){
const tA=0.3+rng()*0.15,tB=0.55+rng()*0.15;
const iA=Math.floor(tA*(center.length-1)),iB=Math.floor(tB*(center.length-1));
const a=center[iA],b=center[iB];
features.push({type:"elevator",x:a.x,z:a.z,y:a.y||0,r:1.15,yTo:(b.y||0)+0.05,exitX:b.x,exitZ:b.z,exitY:b.y||0,hold:0.55});
features.push({type:"elevator",x:b.x,z:b.z,y:b.y||0,r:1.15,yTo:(a.y||0)+0.05,exitX:a.x,exitZ:a.z,exitY:a.y||0,hold:0.55,reverse:true});
}
if(isAqua||layout==="tank_crawl"||(rng()<0.2&&biome.id===4)){
const t0=0.22,t1=0.72;
const i0=Math.floor(t0*(center.length-1)),i1=Math.floor(t1*(center.length-1));
const p0=center[i0],p1=center[i1];
const mx=(p0.x+p1.x)*0.5,mz=(p0.z+p1.z)*0.5;
const my=((p0.y||0)+(p1.y||0))*0.5;
const span=Math.hypot(p1.x-p0.x,p1.z-p0.z)+4;
features.push({type:"tank",x:mx,z:mz,y:my,w:Math.max(widths[i0],widths[i1])+3.2,d:span*0.55,h:3.2+rng(),rot:Math.atan2(p1.x-p0.x,p1.z-p0.z)});
for(let k=0;k<3;k++){
const tt=0.3+k*0.15;
const ii=Math.floor(tt*(center.length-1));
const pp=center[ii];
features.push({type:"fish",x:pp.x+(rng()-0.5)*2,z:pp.z+(rng()-0.5)*2,y:(pp.y||0)+0.8+rng()*1.2,s:0.3+rng()*0.4,spin:rng()*6});
}
}
if(isAqua||layout==="bridge_gap"||terrain==="drop_shelf"){
const i=Math.floor(0.48*(center.length-1));
const p=center[i];
features.push({type:"bridge",x:p.x,z:p.z,y:(p.y||0)+0.02,w:widths[i]*0.9,len:3.5,rot:0});
}
if(biome.id===5||rng()<0.22){
const t=0.4+rng()*0.2;
const sp=sidePoint(center,widths,t,rng()<0.5?1:-1,0.1,rng);
forces.push({type:"conveyor",x:sp.x,z:sp.z,r:1.3,fx:(rng()-0.5)*2.5,fz:(rng()-0.5)*2.5});
features.push({type:"conveyor",x:sp.x,z:sp.z,y:sp.y||0,r:1.3});
}
if(biome.id===1||biome.id===6||rng()<0.18){
const t=0.35+rng()*0.3;
const p=center[Math.floor(t*(center.length-1))];
const a=center[Math.max(0,Math.floor(t*(center.length-1))-1)];
let fx=p.x-a.x,fz=p.z-a.z,fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;
forces.push({type:"wind",x:p.x,z:p.z,r:3.5,fx:fx*1.2,fz:fz*1.2});
features.push({type:"wind",x:p.x,z:p.z,y:(p.y||0)+0.5,r:3.5,fx,fz});
}
if(layout==="helix"||isAqua&&rng()<0.4){
const mid=center[Math.floor(center.length*0.5)];
features.push({type:"tube",x:mid.x,z:mid.z,y:(mid.y||0)+0.4,r:1.1,len:4.5,rot:rng()*Math.PI});
}
const decor=[];
const nNear=16+Math.floor(rng()*12)+Math.floor(diff*5);
for(let i=0;i<nNear;i++){
const t=rng();const side=rng()<0.5?1:-1;
const sp=sidePoint(center,widths,t,side,1.3+rng()*4.2,rng);
const kinds=biomeKinds(biome.id);
decor.push({x:sp.x,z:sp.z,y:sp.y||0,kind:kinds[Math.floor(rng()*kinds.length)],s:0.55+rng()*0.85,spin:rng()*6.28,var:rng()});
}
const nFar=20+Math.floor(rng()*16);
for(let i=0;i<nFar;i++){
const t=rng();const side=rng()<0.5?1:-1;
const sp=sidePoint(center,widths,t,side,6+rng()*14,rng);
const kinds=biomeKinds(biome.id);
decor.push({x:sp.x,z:sp.z,y:0,kind:kinds[Math.floor(rng()*kinds.length)],s:0.9+rng()*1.5,spin:rng()*6.28,var:rng(),far:true});
}
const hills=[];
for(let i=0;i<(isAqua?3:6)+Math.floor(rng()*4);i++){
const t=rng();const side=rng()<0.5?1:-1;
const sp=sidePoint(center,widths,t,side,12+rng()*20,rng);
hills.push({x:sp.x,z:sp.z,r:4+rng()*8,h:1.5+rng()*4,var:rng()});
}
const pl=pathLen(center);
const elevGain=Math.max(...center.map(p=>p.y||0))-Math.min(...center.map(p=>p.y||0));
const par=clamp(Math.round(2+pl/15+diff+hazards.length*0.12+elevGain*0.35+features.length*0.15),2,7);
let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
for(const p of[...center,...left,...right,...decor,...hills]){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z)}
return{biome,holeIndex,layout,terrain,tee,cup,center,left,right,widths,walls,hazards,obstacles,features,forces,decor,hills,width:baseW,greenR,par,pathLen:pl,elevGain,bounds:{minX:minX-8,maxX:maxX+8,minZ:minZ-8,maxZ:maxZ+8},seed:hashSeed(biomeId,holeIndex),points:center};
}
function sampleSurface(hole,x,z){
const c=hole.center;if(!c||!c.length)return{y:0,gx:0,gz:0,i:0};
let best=0,bd=1e9;
for(let i=0;i<c.length;i++){const d=(c[i].x-x)*(c[i].x-x)+(c[i].z-z)*(c[i].z-z);if(d<bd){bd=d;best=i}}
const i0=Math.max(0,best-1),i1=Math.min(c.length-1,best+1);
const a=c[i0],b=c[i1];
const abx=b.x-a.x,abz=b.z-a.z,abl=Math.hypot(abx,abz)||1;
const t=clamp(((x-a.x)*abx+(z-a.z)*abz)/(abl*abl),0,1);
const y=(a.y||0)*(1-t)+(b.y||0)*t;
const gy=((b.y||0)-(a.y||0))/abl*abx/abl;
const gz=((b.y||0)-(a.y||0))/abl*abz/abl;
return{y,gx:gy,gz:gz,i:best,dist:Math.sqrt(bd)};
}
function courseTitle(b,h){return`${BIOMES[b%BIOMES.length].name} — Hole ${h+1}`}
function totalHoles(){return BIOMES.length*18}
export{BIOMES,LAYOUTS,TERRAIN,buildHole,courseTitle,totalHoles,hashSeed,mulberry32,sampleSurface};