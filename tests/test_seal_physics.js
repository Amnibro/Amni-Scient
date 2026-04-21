const cordR=40,gW=cordR*2.6,gH=cordR*2.4,gx=100,gy=100,cx=gx+gW/2,cy=gy+gH/2;
function sim(sqPct,xsec='circle',shore=70){
const targetSq=Math.max(0,Math.min(1,sqPct/100));
const floorY=gy+gH-1;const sCx=cx,sCy0=floorY-cordR;
const N=64,ns=[];
const genNode=(px,py)=>({rx:px,ry:py,x:px,y:py,fx:0,fy:0,s:0,rd:0,od:0,cx:0,cy:0});
for(let i=0;i<N;i++){const a=2*Math.PI*i/N,ca=Math.cos(a),sa=Math.sin(a);let m=1;xsec==='quad'?m=Math.pow(Math.pow(Math.abs(ca),4)+Math.pow(Math.abs(sa),4),-0.25):xsec==='x_ring'?m=1-0.38*Math.cos(4*a):0;const px=sCx+cordR*m*ca,py=sCy0+cordR*m*sa;ns.push(genNode(px,py));}
for(let i=0;i<N;i++){const j=(i+1)%N,dx=ns[j].rx-ns[i].rx,dy=ns[j].ry-ns[i].ry;ns[i].rd=Math.sqrt(dx*dx+dy*dy);const k=(i+N/2)%N,ox=ns[k].rx-ns[i].rx,oy=ns[k].ry-ns[i].ry;ns[i].od=Math.sqrt(ox*ox+oy*oy);}
let rA=0;for(let i=0;i<N;i++){const j=(i+1)%N;rA+=ns[i].rx*ns[j].ry-ns[j].rx*ns[i].ry;}rA=Math.abs(rA)/2;
const stiff=0.3+(shore-40)/100,tethK=stiff*0.18;
const Nsteps=8,itersPer=6;
for(let sIdx=1;sIdx<=Nsteps;sIdx++){
const sq=targetSq*sIdx/Nsteps;const cmp=gy+sq*cordR*2,bnd={l:gx+1,r:gx+gW-1,t:cmp+1,b:floorY,cmp},sCy=Math.max((cmp+floorY)/2,floorY-cordR);
for(let it=0;it<itersPer;it++){
for(const n of ns){n.fx=0;n.fy=0;}
for(let i=0;i<N;i++){const j=(i+1)%N,dx=ns[j].x-ns[i].x,dy=ns[j].y-ns[i].y,d=Math.sqrt(dx*dx+dy*dy)||1e-6,lam=Math.max(d/ns[i].rd,0.3),fm=stiff*(lam-1/(lam*lam))*ns[i].rd,nx=dx/d,ny=dy/d;ns[i].fx+=fm*nx;ns[i].fy+=fm*ny;ns[j].fx-=fm*nx;ns[j].fy-=fm*ny;}
for(let i=0;i<N/2;i++){const k=(i+N/2)%N,dx=ns[k].x-ns[i].x,dy=ns[k].y-ns[i].y,d=Math.sqrt(dx*dx+dy*dy)||1e-6,fm=tethK*(d-ns[i].od),nx=dx/d,ny=dy/d;ns[i].fx+=fm*nx;ns[i].fy+=fm*ny;ns[k].fx-=fm*nx;ns[k].fy-=fm*ny;}
for(const n of ns){n.x+=n.fx*0.15;n.y+=n.fy*0.15;}
let mx=0,my=0;for(const n of ns){mx+=n.x;my+=n.y;}mx/=N;my/=N;const dcx=sCx-mx,dcy=sCy-my;for(const n of ns){n.x+=dcx;n.y+=dcy;}
for(const n of ns){n.x=Math.max(bnd.l,Math.min(bnd.r,n.x));n.y=Math.max(bnd.t,Math.min(bnd.b,n.y));}
let cA=0;for(let i=0;i<N;i++){const j=(i+1)%N;cA+=ns[i].x*ns[j].y-ns[j].x*ns[i].y;}cA=Math.abs(cA)/2;
cA>1e-6?(()=>{const sc=Math.sqrt(rA/cA);for(const n of ns){const nxp=sCx+(n.x-sCx)*sc,nyp=sCy+(n.y-sCy)*sc;n.x=Math.max(bnd.l,Math.min(bnd.r,nxp));n.y=Math.max(bnd.t,Math.min(bnd.b,nyp));}})():0;
}
}
const finalCmp=gy+targetSq*cordR*2,bndF={l:gx+1,r:gx+gW-1,t:finalCmp+1,b:floorY};
let topContact=0,botContact=0,leftContact=0,rightContact=0;
for(const n of ns){n.cx=n.x<=bndF.l+0.5?-1:n.x>=bndF.r-0.5?1:0;n.cy=n.y<=bndF.t+0.5?-1:n.y>=bndF.b-0.5?1:0;n.cy===-1&&topContact++;n.cy===1&&botContact++;n.cx===-1&&leftContact++;n.cx===1&&rightContact++;}
let cA=0;for(let i=0;i<N;i++){const j=(i+1)%N;cA+=ns[i].x*ns[j].y-ns[j].x*ns[i].y;}cA=Math.abs(cA)/2;
let mx=0,my=0;for(const n of ns){mx+=n.x;my+=n.y;}mx/=N;my/=N;
const finalSCy=Math.max((finalCmp+floorY)/2,floorY-cordR);return{sqPct,top:topContact,bot:botContact,left:leftContact,right:rightContact,cxOff:mx-sCx,cyOff:my-finalSCy,areaRatio:cA/rA};
}
console.log('xsec=circle shore=65');
for(const sq of [0,5,15,20,25,30,35,39,40,45,50]){const r=sim(sq,'circle',65);console.log(' sq='+String(sq).padStart(5)+'%  top='+r.top+'  bot='+r.bot+'  L='+r.left+'  R='+r.right+'  cxOff='+r.cxOff.toFixed(3)+'  cyOff='+r.cyOff.toFixed(3)+'  area='+(r.areaRatio*100).toFixed(2)+'%');}
console.log('\nxsec=circle shore=70');
for(const sq of [0,15,22.9,30,40]){const r=sim(sq,'circle',70);console.log(' sq='+String(sq).padStart(5)+'%  top='+r.top+'  bot='+r.bot+'  cyOff='+r.cyOff.toFixed(3)+'  area='+(r.areaRatio*100).toFixed(2)+'%');}
console.log('\nxsec=quad');
for(const sq of [10,22.9,40]){const r=sim(sq,'quad');console.log(' sq='+String(sq).padStart(5)+'%  top='+r.top+'  bot='+r.bot+'  cyOff='+r.cyOff.toFixed(3)+'  area='+(r.areaRatio*100).toFixed(2)+'%');}
console.log('\nxsec=x_ring');
for(const sq of [10,22.9,40]){const r=sim(sq,'x_ring');console.log(' sq='+String(sq).padStart(5)+'%  top='+r.top+'  bot='+r.bot+'  cyOff='+r.cyOff.toFixed(3)+'  area='+(r.areaRatio*100).toFixed(2)+'%');}
