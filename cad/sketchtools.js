import * as S2 from './sketch2.js';
import {offsetEdges} from './sketch.js';
export const TOOLS2=[['arc3','Three-point arc: start, end, then a point on the arc','⌒','3'],['slot','Slot: center, end of the slot, then its width','⬭','W'],['trim','Trim: click the piece to remove','✂','T'],['extend','Extend: click near the end of a line or arc','⇥','E'],['fillet','Sketch fillet: click a corner (or select lines first)','◜','G'],['chamfer','Sketch chamfer: click a corner (or select lines first)','◸','H'],['mirror','Mirror: select the entities, then click the mirror line','⇋','M']];
export const ACTS=[['offset','Offset the selected lines, arcs and circles','⧈','O'],['linear','Linear pattern of the selected entities','∷','Shift+L'],['circular','Circular pattern of the selected entities','❂','Shift+R']];
export const CONS2=[['conc','Concentric','◎'],['col','Collinear','≡'],['sym','Symmetric about a line','⇔']];
export const CK=['conc','col','sym'],GLY={conc:'◎',col:'≡',sym:'⇔'};
export const MSG={conc:'Select two circles or arcs',col:'Select two lines',sym:'Select two points and a line to mirror about'};
export const HINT={arc3:'Click the start, the end, then a point the arc passes through.',slot:'Click the center, the end of the slot, then a point for its width.',trim:'Click the piece of a line, arc or circle to remove up to the nearest crossings.',extend:'Click near the end of a line or arc to stretch it to the next entity.',fillet:'Click a corner, or two lines that meet, then type the radius. Select lines first to round every corner between them.',chamfer:'Click a corner, or two lines that meet, then type the distance. Select lines first to cut every corner between them.',mirror:'Select the entities, then click a line to mirror about (a construction line works well). Symmetric relations keep the copy following the original.'};
export const TH={arc3:'Tap the start, the end, then a point on the arc.',slot:'Tap the center, the end, then a point for the width.',trim:'Tap the piece to remove.',extend:'Tap near the end of a line or arc.',fillet:'Tap a corner, then type the radius.',chamfer:'Tap a corner, then type the distance.',mirror:'Select the entities, then tap the mirror line.'};
const LAST={fillet:null,chamfer:null,offset:null,n:3,step:null,ang:360};
const dflt=CX=>CX.UL==='in'?0.125:2;
const num=(CX,v)=>{const x=typeof v==='number'?v:CX.ev(v);return isFinite(x)?+x:NaN;};
const done=(CX,r,sel)=>{r&&r.ok===false?(CX.api.toast(r.msg,3200)):0;CX.resolve();CX.sel.clear();for(const i of r&&r.ids||(r&&r.id!=null?[r.id]:[]))CX.sel.add('e'+i);CX.draw();};
const run=(CX,fn)=>{CX.push();const r=fn(CX.sk);if(!r||!r.ok){CX.hist.pop();CX.api.toast((r&&r.msg)||'Nothing changed',3000);CX.draw();return r;}done(CX,r);r.msg&&CX.api.toast(r.msg,1800);return r;};
const shared=(sk,a,b)=>sk.ents[a].p.filter(q=>sk.ents[b].p.slice(0,2).includes(q)&&(sk.ents[a].k!=='arc'||sk.ents[a].p[2]!==q));
const cornersOf=(sk,ids)=>{const set=new Set(ids),pts=new Map();for(const i of ids){const e=sk.ents[i];if(!e||e.ref||e.cons||!['line','arc'].includes(e.k))continue;for(const q of e.p.slice(0,2))pts.set(q,(pts.get(q)||0)+1);}return[...pts].filter(([q,n])=>n===2&&sk.ents.filter((x,j)=>x.p.slice(0,x.k==='line'?2:2).includes(q)&&!x.ref&&!x.cons).length===2).map(([q])=>q);};
function corner(CX,kind,q,sx,sy){
  const go=v=>{const d=num(CX,v);if(!(d>0)){CX.api.toast('Enter a distance above 0');return;}LAST[kind]=d;run(CX,sk=>kind==='fillet'?S2.fillet(sk,q,d):S2.chamfer(sk,q,d));};
  CX.ask(sx,sy,LAST[kind]||dflt(CX),go,true);
}
export function activate(CX,k){
  const sk=CX.sk,E=CX.selOf('e'),P=CX.selOf('p');
  if((k==='fillet'||k==='chamfer')&&E.length>=2){const cs=cornersOf(sk,E);if(cs.length){CX.ask(CX.W()/2-55,CX.H()/2,LAST[k]||dflt(CX),v=>{const d=num(CX,v);if(!(d>0))return CX.api.toast('Enter a distance above 0');LAST[k]=d;CX.push();let n=0;for(let c=0;c<5000;c++){const cn=cornersOf(CX.sk,E.filter(i=>CX.sk.ents[i]));if(!cn.length)break;const r=k==='fillet'?S2.fillet(CX.sk,cn[0],d):S2.chamfer(CX.sk,cn[0],d);if(!r.ok){CX.api.toast(r.msg,3000);break;}n++;break;}CX.hist.length&&!n&&CX.hist.pop();CX.resolve();CX.sel.clear();CX.draw();},true);return;}}
  if(k==='mirror'&&E.length){const ax=E.filter(i=>sk.ents[i].k==='line'&&sk.ents[i].cons);if(ax.length===1&&E.length>1){run(CX,s=>S2.mirror(s,E.filter(i=>i!==ax[0]),ax[0]));return;}}
  CX.setTool(k);
}
export function down(CX,tool,sx,sy,sp){
  const sk=CX.sk,w=CX.toW(sx,sy),tmp=CX.tmp;
  if(tool==='arc3'){tmp.push(sp.w);(tmp.s=tmp.s||[]).push(sp);if(tmp.length===3){const[a,b,m]=tmp.s;CX.push();const ia=CX.addPt(a),ib=CX.addPt(b),r=S2.arc3(CX.sk,ia,ib,m.w);CX.tmp=[];if(!r.ok){CX.hist.pop();CX.api.toast(r.msg,3000);}else{CX.resolve(null,CX.nf0());}}CX.draw();return;}
  if(tool==='slot'){tmp.push(sp.w);if(tmp.length===3){const c=tmp[0],e=tmp[1],u=[e[0]-c[0],e[1]-c[1]],l=Math.hypot(...u)||1,wd=2*Math.abs((tmp[2][0]-c[0])*u[1]/l-(tmp[2][1]-c[1])*u[0]/l);CX.tmp=[];run(CX,s=>S2.slot(s,c,e,wd));return;}CX.draw();return;}
  if(tool==='trim'||tool==='extend'){const h=CX.pick(sx,sy,false);if(!h||h[0]!=='e'){CX.api.toast(tool==='trim'?'Click a line, arc or circle':'Click a line or arc',1800);return;}const i=+h.slice(1);run(CX,s=>tool==='trim'?S2.trim(s,i,w):S2.extend(s,i,w));return;}
  if(tool==='fillet'||tool==='chamfer'){const h=CX.pick(sx,sy,true);if(!h)return;if(h[0]==='p'){corner(CX,tool,+h.slice(1),sx,sy);return;}if(h[0]==='e'){const i=+h.slice(1);if(tmp.e==null){tmp.e=i;CX.sel.clear();CX.sel.add(h);CX.draw();return;}const q=shared(sk,tmp.e,i);tmp.e=null;CX.sel.clear();if(!q.length){CX.api.toast('Those two do not meet at a corner',2600);CX.draw();return;}corner(CX,tool,q[0],sx,sy);}return;}
  if(tool==='mirror'){const h=CX.pick(sx,sy,false);if(!h||h[0]!=='e'||sk.ents[+h.slice(1)].k!=='line'){CX.api.toast('Click a line to mirror about',2200);return;}const ax=+h.slice(1),src=CX.selOf('e').filter(i=>i!==ax);if(!src.length){CX.api.toast('Select the entities to mirror first, then click the mirror line',3000);return;}run(CX,s=>S2.mirror(s,src,ax));CX.setTool('select');}
}
export function act(CX,k,sx=CX.W()/2-55,sy=CX.H()/2){
  const sk=CX.sk,E=CX.selOf('e').filter(i=>sk.ents[i]&&['line','arc','circle'].includes(sk.ents[i].k));
  if(!E.length){CX.api.toast('Select lines, arcs or circles first',2600);return;}
  if(k==='offset'){CX.ask(sx,sy,LAST.offset||dflt(CX),v=>{const d=num(CX,v);if(!d){CX.api.toast('Enter a distance (negative flips the side)');return;}LAST.offset=Math.abs(d);run(CX,s=>{const r=offsetEdges(s,E,d);return r.ids.length?{ok:true,ids:r.ids,msg:r.bad.length?'Some pieces were too small to offset':''}:{ok:false,msg:'The offset collapses; try a smaller distance'};});},true);return;}
  if(k==='linear')return CX.ask(sx,sy,LAST.n,a=>{const n=Math.round(num(CX,a));if(!(n>=2))return CX.api.toast('Enter a count of 2 or more');LAST.n=n;CX.ask(sx,sy,LAST.step||dflt(CX)*4,b=>{const dx=num(CX,b);CX.ask(sx,sy,0,c=>{const dy=num(CX,c);if(!isFinite(dx)||!isFinite(dy))return;LAST.step=Math.hypot(dx,dy)||LAST.step;run(CX,s=>S2.linear(s,E,n,dx,dy));},true);},true);},false);
  if(k==='circular'){const pc=CX.selOf('p').filter(i=>i>=0)[0],cen=pc!=null?CX.sk.pts[pc].slice():[0,0];CX.ask(sx,sy,LAST.n,a=>{const n=Math.round(num(CX,a));if(!(n>=2))return CX.api.toast('Enter a count of 2 or more');LAST.n=n;CX.ask(sx,sy,LAST.ang,b=>{const t=num(CX,b);if(!(t>0))return;LAST.ang=t;run(CX,s=>S2.circular(s,E,n,t,cen));},false);},false);}
}
export function cons(CX,k,es,ps){
  const sk=CX.sk;
  if(k==='conc'){const R=es.filter(i=>['circle','arc'].includes(sk.ents[i].k));if(R.length!==2)return false;sk.cons.push({k,e:R});return true;}
  if(k==='col'){const R=es.filter(i=>sk.ents[i].k==='line');if(R.length!==2)return false;sk.cons.push({k,e:R});return true;}
  if(k==='sym'){const R=es.filter(i=>sk.ents[i].k==='line');if(ps.length!==2||R.length!==1)return false;sk.cons.push({k,p:ps,e:R[0]});return true;}
  return false;
}
export function preview(CX,ctx,c){
  const t=CX.tool,tmp=CX.tmp,cur=CX.cur(),S=CX.toS,pts=tmp.slice();
  const dash=()=>{ctx.strokeStyle=c.acc;ctx.setLineDash([5,4]);ctx.lineWidth=1.5;},undash=()=>ctx.setLineDash([]);
  if(t==='arc3'&&pts.length>=1){dash();ctx.beginPath();if(pts.length===1){ctx.moveTo(...S(pts[0]));ctx.lineTo(...S(cur));}else{const a=pts[0],b=pts[1],m=pts[2]||cur,d=2*(a[0]*(b[1]-m[1])+b[0]*(m[1]-a[1])+m[0]*(a[1]-b[1]));if(Math.abs(d)<1e-12){ctx.moveTo(...S(a));ctx.lineTo(...S(b));}else{const a2=a[0]**2+a[1]**2,b2=b[0]**2+b[1]**2,m2=m[0]**2+m[1]**2,o=[(a2*(b[1]-m[1])+b2*(m[1]-a[1])+m2*(a[1]-b[1]))/d,(a2*(m[0]-b[0])+b2*(a[0]-m[0])+m2*(b[0]-a[0]))/d],r=Math.hypot(a[0]-o[0],a[1]-o[1]),t0=Math.atan2(a[1]-o[1],a[0]-o[0]),t1=Math.atan2(b[1]-o[1],b[0]-o[0]),ccw=((b[0]-a[0])*(m[1]-b[1])-(b[1]-a[1])*(m[0]-b[0]))>0,so=S(o);ctx.arc(so[0],so[1],r*CX.view.s,-t0,-t1,ccw);}}ctx.stroke();undash();return true;}
  if(t==='slot'&&pts.length>=1){dash();const c0=pts[0],e=pts[1]||cur,u=[e[0]-c0[0],e[1]-c0[1]],l=Math.hypot(...u)||1,n=[-u[1]/l,u[0]/l],wd=pts[1]?Math.abs((cur[0]-c0[0])*u[1]/l-(cur[1]-c0[1])*u[0]/l):0,h=wd,c1=[c0[0]-u[0],c0[1]-u[1]];ctx.beginPath();if(!pts[1]){ctx.moveTo(...S(c1));ctx.lineTo(...S(e));}else{const r=h,sA=S(c1),sB=S(e),ang=Math.atan2(-(e[1]-c0[1]),e[0]-c0[0]);ctx.moveTo(...S([c1[0]+n[0]*r,c1[1]+n[1]*r]));ctx.lineTo(...S([e[0]+n[0]*r,e[1]+n[1]*r]));ctx.arc(sB[0],sB[1],r*CX.view.s,ang-Math.PI/2,ang+Math.PI/2,false);ctx.lineTo(...S([c1[0]-n[0]*r,c1[1]-n[1]*r]));ctx.arc(sA[0],sA[1],r*CX.view.s,ang+Math.PI/2,ang+Math.PI*1.5,false);}ctx.stroke();undash();CX.meter(pts[1]?'W '+(2*h).toFixed(2)+' '+CX.UL:'L '+(2*l).toFixed(2)+' '+CX.UL);return true;}
  return false;
}
