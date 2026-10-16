import * as DR from './drawing.js';
const {textW,SHEETS}=DR,segX=DR.segX;
const hit=(a,b,r)=>!(a[0]>r[2]||b[0]>r[2]&&a[0]>r[2]||Math.max(a[0],b[0])<r[0]||Math.min(a[0],b[0])>r[2]||Math.max(a[1],b[1])<r[1]||Math.min(a[1],b[1])>r[3]);
export function layoutFrame(sheet){const[W,H]=SHEETS[sheet],ansi=/ANSI/.test(sheet),M=ansi?{l:12.7,r:12.7,t:12.7,b:12.7}:{l:20,r:10,t:10,b:10},F=[M.l,M.b,W-M.r,H-M.t],th=W<300?3:3.5,tbW=Math.min(180,F[2]-F[0]);return{W,H,F,th,nth:th*0.85,tbW,tbH:36};}
export function bomTable(res,rows,o={}){const L=layoutFrame(res.sheet),rh=L.nth*1.55,cols=[['ITEM',12,'m'],['QTY',12,'m'],['PART NUMBER',34,'s'],['DESCRIPTION',L.tbW-12-12-34-30,'s'],['MATERIAL',30,'s']],x0=L.F[2]-L.tbW,y0=L.F[1]+L.tbH+2.5,fit=(t,w,s)=>{t=String(t??'');while(t.length>2&&textW(t,s)>w-1.6)t=t.slice(0,-2)+'…';return t;},it=res.items,ln=(a,b)=>it.push({t:'l',a,b,ly:'thin'}),tx=(p,t,s,an,b)=>it.push({t:'tx',p,txt:t,s,an,b,ly:'txt'});
  const n=rows.length+1,top=y0+n*rh;ln([x0,y0],[x0+L.tbW,y0]);ln([x0,top],[x0+L.tbW,top]);let x=x0;ln([x,y0],[x,top]);for(const[,w]of cols){x+=w;ln([x,y0],[x,top]);}
  for(let r=1;r<n;r++)ln([x0,y0+r*rh],[x0+L.tbW,y0+r*rh]);
  const put=(r,vals,b)=>{let cx=x0;cols.forEach(([,w,an],i)=>{const s=fit(vals[i],w,L.nth);s&&tx(an==='m'?[cx+w/2,y0+(n-1-r)*rh+rh*0.28]:[cx+0.8,y0+(n-1-r)*rh+rh*0.28],s,L.nth,an==='m'?'m':'s',b);cx+=w;});};
  put(0,cols.map(c=>c[0]),true);rows.forEach((q,i)=>put(i+1,[q.item,q.qty,q.number||q.part.toUpperCase(),q.name+(q.desc&&q.desc!==q.name?' · '+q.desc:''),q.matName||q.material||'']));
  res.bomRect=[x0,y0,x0+L.tbW,top];return res.bomRect;}
export function extraLines(rows,sheet){const L=layoutFrame(sheet),pitch=L.nth*1.55;return Array.from({length:rows+1},()=>' ');}
export function compose(P,rows,o={}){const sheet=o.sheet||(o.units==='in'?(rows.length>14?'ANSI C':'ANSI B'):(rows.length>14?'A2':'A3')),view=(o.views&&o.views[0])||'iso',res=DR.compose(P,{sheet,units:o.units,views:o.views||['iso'],hidden:o.hidden,dims:{overall:false,holes:false,radii:false,chamfers:false,centers:false,gdt:false,autogdt:false},extraNotes:extraLines(rows.length,sheet),title:{name:o.name||'Assembly',number:o.number||'',material:'ASSEMBLY',mass:o.mass||'',author:o.author||'',rev:o.rev||'A'},sheetTxt:o.sheetTxt});
  const V=res.views.find(v=>v.n===view);if(!V)throw new Error('The assembly view did not fit on the sheet');const vb=P.views[view].bb,s=V.s,r=V.rect,X=p=>[r[0]+s*(p[0]-vb[0]),r[1]+s*(p[1]-vb[1])],A=o.anchors&&o.anchors[view]||{},it=res.items,L=layoutFrame(res.sheet);
  bomTable(res,rows,o);const out={lines:[],balloons:[]};
  for(const id in A){const a=A[id];if(a.c0&&a.c&&Math.hypot(a.c[0]-a.c0[0],a.c[1]-a.c0[1])*s>1.5){const p=X(a.c0),q=X(a.c);it.push({t:'l',a:p,b:q,ly:'cen'});out.lines.push({c:id,a:p,b:q});}}
  const rb=4.5,boxes=[res.bomRect,...res.keep,...res.views.map(v=>v.rect)],cen=[(r[0]+r[2])/2,(r[1]+r[3])/2],placed=[],lead=[];
  const ok=(E,P0)=>{if(E[0]-rb<L.F[0]+2||E[0]+rb>L.F[2]-2||E[1]-rb<L.F[1]+2||E[1]+rb>L.F[3]-2)return false;if(boxes.some((b,i)=>i<res.keep.length+1&&E[0]+rb>b[0]&&E[0]-rb<b[2]&&E[1]+rb>b[1]&&E[1]-rb<b[3]))return false;if(placed.some(q=>Math.hypot(q[0]-E[0],q[1]-E[1])<2*rb+2))return false;if(lead.some(([a,b])=>segX(a,b,P0,E)))return false;return true;};
  for(const row of rows){const cid=row.comps.find(c=>A[c]);if(!cid)continue;const a=A[cid],P0=X(a.c),dir0=Math.atan2(P0[1]-cen[1],P0[0]-cen[0]);let best=null;
    for(const dl of[0,0.35,-0.35,0.7,-0.7,1.05,-1.05,1.4,-1.4,1.75,-1.75,2.1,-2.1,2.5,-2.5,3]){for(const len of[12,18,26,36,48,64,84]){const E=[P0[0]+Math.cos(dir0+dl)*len,P0[1]+Math.sin(dir0+dl)*len];if(ok(E,P0)){best={E,pen:len+Math.abs(dl)*8};break;}}if(best)break;}
    if(!best){out.balloons.push({item:row.item,c:cid,placed:false});continue;}
    const E=best.E,u=[(P0[0]-E[0]),(P0[1]-E[1])],l=Math.hypot(...u)||1,e=[E[0]+u[0]/l*rb,E[1]+u[1]/l*rb];it.push({t:'c',c:E,r:rb,ly:'thin'});it.push({t:'tx',p:[E[0],E[1]-L.th*0.36],txt:String(row.item),s:L.th,an:'m',ly:'txt'});it.push({t:'l',a:e,b:P0,ly:'thin'});
    it.push({t:'fi',p:Array.from({length:8},(_,k)=>[P0[0]+0.7*Math.cos(k*Math.PI/4),P0[1]+0.7*Math.sin(k*Math.PI/4)]).flat()});if(row.qty>1)it.push({t:'tx',p:[E[0]+rb+1,E[1]-L.th*0.3],txt:row.qty+'X',s:L.nth,an:'s',ly:'txt'});
    placed.push(E);lead.push([e,P0]);out.balloons.push({item:row.item,c:cid,placed:true,center:E,tip:P0,rect:[X([a.r[0],a.r[1]]),X([a.r[2],a.r[3]])].flatMap(p=>p)});}
  return{sheet:res,balloons:out.balloons,lines:out.lines,svg:()=>DR.toSVG(res,{title:o.name||'Assembly drawing'}),pdf:()=>DR.toPDF(res,{title:o.name||'Assembly drawing'}),dxf:()=>DR.toDXF(res)};}
