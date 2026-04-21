const cordR=40,gW=cordR*2.6,gH=cordR*2.4;
function run(sqPct,xsec,shore){
const gx=10,gy=10,cx=gx+gW/2;
const targetSq=Math.max(0,Math.min(1,sqPct/100));
const floorY=gy+gH-1;const sCx=cx,sCy0=floorY-cordR;
const N=64,ns=[];
const gen=(px,py)=>({rx:px,ry:py,x:px,y:py,fx:0,fy:0,rd:0,od:0});
for(let i=0;i<N;i++){const a=2*Math.PI*i/N,ca=Math.cos(a),sa=Math.sin(a);let m=1;xsec==='quad'?m=Math.pow(Math.pow(Math.abs(ca),4)+Math.pow(Math.abs(sa),4),-0.25):xsec==='x_ring'?m=1-0.38*Math.cos(4*a):0;ns.push(gen(sCx+cordR*m*ca,sCy0+cordR*m*sa));}
for(let i=0;i<N;i++){const j=(i+1)%N,dx=ns[j].rx-ns[i].rx,dy=ns[j].ry-ns[i].ry;ns[i].rd=Math.sqrt(dx*dx+dy*dy);const k=(i+N/2)%N,ox=ns[k].rx-ns[i].rx,oy=ns[k].ry-ns[i].ry;ns[i].od=Math.sqrt(ox*ox+oy*oy);}
let rA=0;for(let i=0;i<N;i++){const j=(i+1)%N;rA+=ns[i].rx*ns[j].ry-ns[j].rx*ns[i].ry;}rA=Math.abs(rA)/2;
const stiff=0.3+(shore-40)/100,tethK=stiff*0.18;
const Nsteps=8,itersPer=6;
for(let sIdx=1;sIdx<=Nsteps;sIdx++){
const sq=targetSq*sIdx/Nsteps;const cmp=gy+sq*cordR*2,bnd={l:gx+1,r:gx+gW-1,t:cmp+1,b:floorY},sCy=Math.max((cmp+floorY)/2,floorY-cordR);
for(let it=0;it<itersPer;it++){
for(const n of ns){n.fx=0;n.fy=0;}
for(let i=0;i<N;i++){const j=(i+1)%N,dx=ns[j].x-ns[i].x,dy=ns[j].y-ns[i].y,d=Math.sqrt(dx*dx+dy*dy)||1e-6,lam=Math.max(d/ns[i].rd,0.3),fm=stiff*(lam-1/(lam*lam))*ns[i].rd,nx=dx/d,ny=dy/d;ns[i].fx+=fm*nx;ns[i].fy+=fm*ny;ns[j].fx-=fm*nx;ns[j].fy-=fm*ny;}
for(let i=0;i<N/2;i++){const k=(i+N/2)%N,dx=ns[k].x-ns[i].x,dy=ns[k].y-ns[i].y,d=Math.sqrt(dx*dx+dy*dy)||1e-6,fm=tethK*(d-ns[i].od),nx=dx/d,ny=dy/d;ns[i].fx+=fm*nx;ns[i].fy+=fm*ny;ns[k].fx-=fm*nx;ns[k].fy-=fm*ny;}
for(const n of ns){n.x+=n.fx*0.15;n.y+=n.fy*0.15;}
let mx=0,my=0;for(const n of ns){mx+=n.x;my+=n.y;}mx/=N;my/=N;const dcx=sCx-mx,dcy=sCy-my;for(const n of ns){n.x+=dcx;n.y+=dcy;}
for(const n of ns){n.x=Math.max(bnd.l,Math.min(bnd.r,n.x));n.y=Math.max(bnd.t,Math.min(bnd.b,n.y));}
let cA=0;for(let i=0;i<N;i++){const j=(i+1)%N;cA+=ns[i].x*ns[j].y-ns[j].x*ns[i].y;}cA=Math.abs(cA)/2;
cA>1e-6&&(()=>{const sc=Math.sqrt(rA/cA);for(const n of ns){const nxp=sCx+(n.x-sCx)*sc,nyp=sCy+(n.y-sCy)*sc;n.x=Math.max(bnd.l,Math.min(bnd.r,nxp));n.y=Math.max(bnd.t,Math.min(bnd.b,nyp));}})();
}
}
const finalCmp=gy+targetSq*cordR*2;
return{ns,gx,gy,cmp:finalCmp,floorY};
}
function panel(r,title,x0,y0){
const {ns,gx,gy,cmp,floorY}=r;const ox=x0-gx,oy=y0-gy;
const pts=ns.map(n=>(n.x+ox).toFixed(1)+','+(n.y+oy).toFixed(1)).join(' ');
const grove='<rect x="'+(gx+ox)+'" y="'+(gy+oy)+'" width="'+gW+'" height="'+gH+'" fill="rgba(255,255,255,0.03)" stroke="#444" stroke-width="1.5"/>';
const face='<line x1="'+(gx+ox)+'" y1="'+(cmp+oy)+'" x2="'+(gx+ox+gW)+'" y2="'+(cmp+oy)+'" stroke="#888" stroke-width="1" stroke-dasharray="3,3"/>';
const faceFill='<rect x="'+(gx+ox)+'" y="'+(gy+oy)+'" width="'+gW+'" height="'+(cmp-gy)+'" fill="rgba(120,120,140,0.18)"/>';
const floor='<rect x="'+(gx+ox)+'" y="'+(floorY+oy-2)+'" width="'+gW+'" height="2" fill="rgba(100,200,255,0.18)"/>';
const poly='<polygon points="'+pts+'" fill="rgba(255,107,53,0.27)" stroke="#ff6b35" stroke-width="1.5"/>';
const lbl='<text x="'+(x0+gW/2)+'" y="'+(y0-4)+'" text-anchor="middle" font-family="monospace" font-size="11" fill="#e0e0e0">'+title+'</text>';
return grove+faceFill+poly+face+floor+lbl;
}
const cases=[['10% squeeze',10],['22.9% squeeze',22.9],['39% squeeze',39]];
let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 170" font-family="monospace"><rect width="400" height="170" fill="#0a0e14"/>';
svg+='<text x="200" y="16" text-anchor="middle" font-size="12" fill="#4af">v4.7.1 — Symmetric physics + floor-rest base</text>';
cases.forEach((c,i)=>{const r=run(c[1],'circle',65);svg+=panel(r,c[0],20+i*130,45);});
svg+='</svg>';
require('fs').writeFileSync('/sessions/nifty-adoring-clarke/mnt/ai/amni-scient-site/tests/fixtures/seal_comparison_v4.7.1.svg',svg);
require('fs').writeFileSync('/sessions/nifty-adoring-clarke/mnt/outputs/seal_comparison.svg',svg);
console.log('SVG written (',svg.length,'chars)');
