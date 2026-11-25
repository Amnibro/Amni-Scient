import {heliumSync} from './he/host.js';
import {SHAPES,SECTIONS} from './frame.js';
import {profileOf,featSec,ENDS} from './profiles.js';
import {MATS} from './schema.js';
import {planeRef} from './datum.js';
const PF=await heliumSync('frame');let H=null;
const he=()=>H||(H=PF({}),H.ex.fr_init(),H),r=(v,n=7)=>+(+v).toPrecision(n),need=(c,m)=>{if(!c)throw new Error(m);};
export const KINDS=['square','miter','butt, runs through','butt, trimmed','runs straight on'];
const nf=v=>String(+(+v).toPrecision(4));
export function profileName(f,units='mm'){const P=profileOf(f.std);if(P)return f.std;const k=units==='in'?25.4:1,S=featSec(f,k),d=v=>nf(v/k),D={rect:[S.b,S.h],round:[S.b],tube:[S.b,S.t],rtube:[S.b,S.h,S.t],ibeam:[S.h,S.b,S.tf,S.tw],channel:[S.h,S.b,S.tf,S.tw],angle:[S.h,S.b,S.t]}[S.shape]||[S.b];return(SECTIONS[S.shape]||S.shape)+' '+D.map(d).join(' × ')+' '+(units==='in'?'in':'mm');}
function trim(h,f,k){const P=(f.pts||[]).map(p=>p.map(v=>+v*k)),Mb=f.members||[],S=featSec(f,k);for(const[a,c]of Mb)need(P[a-1]&&P[c-1],'Beam frame member '+a+'-'+c+' points at a joint that is not in the list');
  h.ex.fr_size(P.length,Mb.length,1,1);h.v(3).set(P.flat());h.v(5).set([SHAPES[S.shape],S.b,S.h,S.t,S.tf,S.tw]);h.ex.fr_sections();const MB=h.v(20),MW=h.v(4),I=h.v(1);Mb.forEach(([a,c],n)=>{MB.set([a-1,c-1,0,0],4*n);MW[4*n]=f.roll||0;});I.fill(0);I[40]=ENDS[f.ends||'miter']??1;I[41]=15;h.ex.fr_trim();
  const CE=h.v(16);return Mb.map(([a,c],n)=>{const q=24*n;return{i:a,j:c,axis:CE[q+10],len:CE[q+22],vl:CE[q+11],ang:[CE[q+8],CE[q+20]],kind:[CE[q+9],CE[q+21]],reach:[CE[q],CE[q+12]],member:n+1};}).filter(m=>m.axis>1e-9);}
export function cutList(doc,o={}){const k=doc.units==='in'?25.4:1,F=(doc.features||[]).filter(f=>f.type==='frame'&&!f.suppressed&&(!o.feature||f.id===o.feature)),h=he(),m=MATS[doc.material]||MATS.steel1018||{},rho=(o.rho??m.rho??7850)*1e-9,stock=o.stock_mm??(o.stock!=null?o.stock*k:0),kerf=o.kerf_mm??(o.kerf!=null?o.kerf*k:0);
  need(F.length,o.feature?'No Beam frame named "'+o.feature+'"':'Add a Beam frame feature first');need(stock>=0&&kerf>=0,'stock and kerf must be 0 or more');
  const keys=[],secs=[],names=[],pcs=[];for(const f of F){const S=featSec(f,k),key=JSON.stringify(S);let s=keys.indexOf(key);if(s<0){s=keys.push(key)-1;secs.push(S);names.push({name:profileName(f,doc.units),std:(profileOf(f.std)||{}).std||null});}
    trim(h,f,k).forEach(x=>pcs.push({...x,s,feature:f.id}));}
  h.ex.fr_size(0,0,secs.length,1);h.v(5).set(secs.flatMap(S=>[SHAPES[S.shape],S.b,S.h,S.t,S.tf,S.tw,0,0]));h.ex.fr_sections();h.ex.fr_pieces(pcs.length);h.v(23).set(pcs.flatMap(p=>[p.s,p.len,p.ang[0],p.ang[1],p.vl]));const I=h.v(1);I[42]=rho;I[43]=stock;I[44]=kerf;
  const ng=h.ex.fr_cuts(pcs.length),CG=h.v(17),CS=h.v(18),GI=h.v(22),SP=h.v(7);
  const items=Array.from({length:ng},(_,g)=>{const s=CG[8*g]|0,ms=pcs.filter((_,p)=>GI[p]===g);return{item:g+1,qty:CG[8*g+4],profile:names[s].name,standard:names[s].std,length_mm:r(CG[8*g+1]),angle1_deg:r(CG[8*g+2],4),angle2_deg:r(CG[8*g+3],4),mass_kg:r(CG[8*g+5]),total_mass_kg:r(CG[8*g+6]),surface_m2:r(CG[8*g+7]*1e-6,4),members:ms.map(p=>({feature:p.feature,member:p.member}))};});
  const profiles=secs.map((S,s)=>({profile:names[s].name,standard:names[s].std,area_mm2:r(SP[8*s]),pieces:CS[8*s+1],total_length_mm:r(CS[8*s]),mass_kg:r(CS[8*s+3]),...(stock>0?{bars:CS[8*s+2],offcut_mm:r(CS[8*s+4]),too_long:CS[8*s+5]}:{})}));
  return{units:'mm',material:doc.material,stock_mm:stock||null,kerf_mm:kerf,items,profiles,pieces:pcs.length,total_mass_kg:r(profiles.reduce((a,p)=>a+p.mass_kg,0)),
    members:pcs.map((p,n)=>({feature:p.feature,member:p.member,joints:[p.i,p.j],length_mm:r(p.len),axis_mm:r(p.axis),angles_deg:p.ang.map(v=>r(v,4)),ends:p.kind.map(v=>KINDS[v|0]),item:GI[n]+1}))};}
export function sketchSegments(sk){const S=sk.sketch,seg=[];if(S&&S.ents&&S.ents.length){for(const e of S.ents)if(e.k==='line'&&!e.cons)seg.push([...S.pts[e.p[0]],...S.pts[e.p[1]]].map(Number));return seg;}
  for(const s of sk.shapes||[]){const k=s.k||s.kind||'rect',a=(+s.a||0)*Math.PI/180,tf=([x,y])=>[x*Math.cos(a)-y*Math.sin(a)+(+s.x||0),x*Math.sin(a)+y*Math.cos(a)+(+s.y||0)],ring=(Q,cl)=>Q.slice(0,cl?Q.length:-1).forEach((p,i)=>seg.push([...tf(p),...tf(Q[(i+1)%Q.length])])),w=+s.w/2,hh=+s.h/2;
    if(k==='rect')ring([[-w,-hh],[w,-hh],[w,hh],[-w,hh]],true);else if(k==='path'&&!(s.bulge||[]).some(v=>+v))ring((s.pts||[]).map(p=>[+p[0],+p[1]]),s.closed!==false&&!s.open);}
  return seg;}
export function fromSketch(doc,frame,sketch){const fr=(doc.features||[]).find(f=>f.id===frame),sk=(doc.features||[]).find(f=>f.id===sketch);need(fr&&fr.type==='frame','No Beam frame named "'+frame+'"');need(sk,'No sketch named "'+sketch+'"');
  need(['XY','XZ','YZ','datum'].includes(sk.plane||'XY'),'Put the layout sketch on the XY, XZ or YZ plane or a datum plane; a sketch on a face cannot be read here.');
  const PL=planeRef(sk.plane==='datum'?sk.datum:sk.plane||'XY',+sk.offset||0),seg=sketchSegments(sk);need(seg.length,'That sketch has no straight lines to turn into members.');
  const h=he(),P=fr.pts||[];h.ex.fr_size(P.length,0,0,1);h.v(3).set(P.flat().map(Number));h.ex.fr_pieces(seg.length);h.v(23).set(seg.flat());const I=h.v(1);I.set([...PL.o,...PL.x,...PL.n],45);I[54]=1e-6*Math.max(1,...seg.flat().map(Math.abs),...P.flat().map(Math.abs));
  const nm=h.ex.fr_merge(P.length,seg.length),nj=h.v(2)[50]|0,MJ=h.v(24),MM=h.v(25),old=new Set((fr.members||[]).map(([a,b])=>a<b?a+'-'+b:b+'-'+a)),add=[];
  for(let i=0;i<nm;i++){const a=MM[2*i],b=MM[2*i+1],key=a<b?a+'-'+b:b+'-'+a;old.has(key)||(old.add(key),add.push([a,b]));}
  return{pts:Array.from({length:nj},(_,i)=>Array.from(MJ.slice(3*i,3*i+3)).map(v=>r(v,10))),members:[...(fr.members||[]),...add],added:add.length};}
