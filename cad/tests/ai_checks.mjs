import {inside,ringRuns} from '../aisee.js';
const KU=u=>u==='in'?25.4:1;
export function evalChecks(m,units,checks){
  const P=[],F=[],k=KU(units),put=(ok,t)=>(ok?P:F).push(t);
  if(!m)return{pass:[],fail:['nothing solid was built'],stats:{solids:0}};
  const b=m.props.bbox,E=[0,1,2].map(i=>b.max[i]-b.min[i]),sz=E.map(v=>v*k),cx=m.props.com?m.props.com[0]:(b.min[0]+b.max[0])/2,cy=m.props.com?m.props.com[1]:(b.min[1]+b.max[1])/2,Rm=(()=>{let r=0;for(let i=0;i<m.pos.length;i+=3)r=Math.max(r,Math.hypot(m.pos[i]-cx,m.pos[i+1]-cy));return r||1;})(),zz=f=>b.min[2]+E[2]*f,f3=inside(m),vol=m.props.volume*k**3,fmt=v=>+v.toFixed(1),pt=(fx,fy,fz)=>[(fx==='o'?cx:b.min[0]+E[0]*fx)+0.0123*Rm/50,(fy==='o'?cy:b.min[1]+E[1]*fy)+0.0171*Rm/50,zz(fz)];
  const region=z=>{const N=100,g=[];for(let i=0;i<N;i++)for(let j=0;j<N;j++)g.push(f3(b.min[0]+E[0]*(i+0.5)/N,b.min[1]+E[1]*(j+0.5)/N,z));return{g,N};};
  for(const c of checks){
    if(c.solids!==undefined)put(m.props.nSolids===c.solids,`solids ${m.props.nSolids}, want ${c.solids}`);
    if(c.size)c.size.forEach((r,i)=>put(sz[i]>=r[0]&&sz[i]<=r[1],`size ${'XYZ'[i]} ${fmt(sz[i])} mm, want ${r[0]} to ${r[1]}`));
    if(c.vol)put(vol>=c.vol[0]&&vol<=c.vol[1],`volume ${Math.round(vol)} mm3, want ${c.vol[0]} to ${c.vol[1]}`);
    if(c.ratio){const q=sz[c.ratio[0]]/sz[c.ratio[1]];put(q>=c.ratio[2]&&q<=c.ratio[3],`size ratio ${'XYZ'[c.ratio[0]]}/${'XYZ'[c.ratio[1]]} ${q.toFixed(2)}, want ${c.ratio[2]} to ${c.ratio[3]}`);}
    if(c.runs){let best=0;for(const rf of c.runs.rf)for(const zf of c.runs.zf)best=Math.max(best,ringRuns(m,{inside:f3,r:rf*Rm,z:zz(zf),cx,cy,n:c.runs.n2||720}).runs);put(best===c.runs.n,`blades or teeth counted by section ${best}, want ${c.runs.n}`);}
    if(c.line){const L=c.line,ax=L.axis==='y'?1:0,o=1-ax;let n=0,p=false;for(let i=0;i<4000;i++){const t=(i+0.5)/4000,q=[0,0,0];q[ax]=b.min[ax]+E[ax]*t;q[o]=b.min[o]+E[o]*L.f+0.0123;q[2]=zz(L.zf);const v=f3(q[0],q[1],q[2]);v&&!p&&n++;p=v;}put(n===L.n,`fins or ribs counted along ${L.axis} ${n}, want ${L.n}`);}
    for(const[fx,fy,fz,want,why]of c.probes||[]){const q=pt(fx,fy,fz),v=f3(q[0],q[1],q[2]);put(v===want,`${why||'probe'} is ${v?'solid':'empty'}, want ${want?'solid':'empty'}`);}
    if(c.regions){const{g,N}=region(zz(c.regions.zf)),seen=new Set();let n=0;for(let s=0;s<g.length;s++){if(!g[s]||seen.has(s))continue;n++;const st=[s];seen.add(s);while(st.length){const q=st.pop(),i=Math.floor(q/N),j=q%N;for(const[a,d]of[[i+1,j],[i-1,j],[i,j+1],[i,j-1]]){if(a<0||d<0||a>=N||d>=N)continue;const w=a*N+d;g[w]&&!seen.has(w)&&(seen.add(w),st.push(w));}}}put(n===c.regions.n,`separate regions in the slice at ${Math.round(c.regions.zf*100)} % height ${n}, want ${c.regions.n}`);}
    if(c.area){const hit=c.area.zf.map(zf=>{const{g}=region(zz(zf));return g.filter(Boolean).length/g.length;});put(hit.some(a=>a>=c.area.min&&a<=c.area.max),`slice area fraction at ${c.area.zf.map(z=>Math.round(z*100)+' %').join('/')} height ${hit.map(a=>a.toFixed(2)).join('/')}, want ${c.area.min} to ${c.area.max}`);}
    if(c.radiusAt){let best=0;for(let a=0;a<8;a++){const th=a*Math.PI/4;for(let s=300;s>=0;s--){const r=Rm*1.02*s/300;if(f3(cx+r*Math.cos(th)+0.0123,cy+r*Math.sin(th)+0.0171,zz(c.radiusAt.zf))){best=Math.max(best,r);break;}}}const q=best/Rm;put(q>=(c.radiusAt.min??0)&&q<=(c.radiusAt.max??9),`outer radius at ${Math.round(c.radiusAt.zf*100)} % height is ${q.toFixed(2)} of the widest, want ${c.radiusAt.min??0} to ${c.radiusAt.max??'any'}`);}
    if(c.faces){const n=(m.faces||[]).filter(f=>String(f.type).slice(0,6)===c.faces.type.slice(0,6)).length;put(n>=c.faces.min,`${c.faces.type} faces ${n}, want at least ${c.faces.min}`);}
  }
  return{pass:P,fail:F,stats:{solids:m.props.nSolids,size:sz.map(fmt),volume_mm3:Math.round(vol)}};
}
export const evalPage=checks=>{const S=window.amnicad.S;return evalChecks(S.mesh,S.doc.units,checks);};
const U=(units,...a)=>[{new:true,units},...a],B=(name,w,d,h,x=0,y=0,z=0)=>({add:{type:'box',name,w,d,h,x,y,z}}),LEG=[[-190,-190],[190,-190],[-190,190],[190,190]];
export const CASES=[
{id:'chair',units:'mm',prompt:'Model a simple dining chair: a 420 x 420 mm seat 30 mm thick with its top 450 mm above the floor, four 40 mm square legs, and a 400 mm tall backrest panel above the seat at the rear. One solid piece.',
 bad:U('mm',B('Seat',420,420,30,0,0,420),...LEG.map((p,i)=>B('Leg '+(i+1),40,40,400,p[0],p[1],0)),B('Backrest',420,30,400,0,-195,440)),badSay:'Here is the chair.',fixWhen:'separate pieces',fixSay:'The legs stopped 20 mm short of the seat, so they floated. I made them 430 mm tall so they overlap the seat.',fix:[2,3,4,5].map(i=>({set:{id:'f'+i,h:430}})),
 good:U('mm',B('Seat',420,420,30,0,0,420),...LEG.map((p,i)=>B('Leg '+(i+1),40,40,430,p[0],p[1],0)),B('Backrest',420,30,410,0,-195,440)),
 checks:[{solids:1},{size:[[380,470],[380,470],[800,900]]},{regions:{zf:0.12,n:4}},{area:{zf:[0.5,0.51,0.52],min:0.8,max:1.01}},{area:{zf:[0.8],min:0.03,max:0.3}},{ratio:[2,0,1.8,2.4]}]},
{id:'fan',units:'in',prompt:'Model an 8 inch axial fan with 7 twisted blades on a hub with a 1/4 inch shaft bore.',
 bad:U('in',{add:{type:'cylinder',name:'Hub',r:0.8,h:1}},B('Blade 1',2,0.8,0.05,2.5,0,0.4),B('Blade 2',2,0.8,0.05,-2.5,0,0.4),B('Blade 3',0.8,2,0.05,0,2.5,0.4)),badSay:'A fan with three blades.',fixWhen:'separate pieces',fixSay:'The blades floated away from the hub and there were only three. A fan recipe builds seven twisted blades on a hub as one solid.',fix:U('in',{recipe:'fan',diameter:8,blades:7,bore:0.25}),
 good:U('in',{recipe:'fan',diameter:8,blades:7,bore:0.25}),
 checks:[{solids:1},{size:[[185,208],[185,208],[20,80]]},{runs:{rf:[0.6,0.7,0.8],zf:[0.4,0.5,0.6],n:7}},{probes:[['o','o',0.5,false,'the shaft bore']]},{vol:[60000,260000]}]},
{id:'propeller',units:'mm',prompt:'Make a 3-blade propeller, 250 mm diameter, with an 8 mm shaft bore.',
 bad:U('mm',{recipe:'propeller',diameter:250,blades:3.5,bore:8}),badSay:'Here is a propeller.',fixWhen:'was not built',fixSay:'The blade count must be a whole number, so I used 3 blades.',fix:[{recipe:'propeller',diameter:250,blades:3,bore:8}],
 good:U('mm',{recipe:'propeller',diameter:250,blades:3,bore:8}),
 checks:[{solids:1},{size:[[170,255],[170,255],[10,60]]},{runs:{rf:[0.5,0.6,0.7],zf:[0.4,0.5,0.6],n:3}},{probes:[['o','o',0.5,false,'the shaft bore']]}]},
{id:'gear',units:'mm',prompt:'Spur gear, module 2, 24 teeth, 20 degree pressure angle, 10 mm wide, with a 12 mm bore and a keyway.',
 bad:U('mm',{recipe:'gear',teeth:24,module:2,width:10,bore:5,keyway:true}),badSay:'Here is the gear.',fixWhen:'was not built',fixSay:'A keyway needs a bore of at least 7 mm, so I used the 12 mm bore you asked for.',fix:[{recipe:'gear',teeth:24,module:2,pressure:20,width:10,bore:12,keyway:true}],
 good:U('mm',{recipe:'gear',teeth:24,module:2,pressure:20,width:10,bore:12,keyway:true}),
 checks:[{solids:1},{size:[[50,54],[50,54],[9.5,10.5]]},{runs:{rf:[0.88,0.92,0.95],zf:[0.5],n:24}},{probes:[['o','o',0.5,false,'the bore']]},{vol:[14000,18500]}]},
{id:'heatsink',units:'mm',prompt:'Heat sink with a 60 x 60 mm base 5 mm thick and 12 straight fins, each 25 mm tall and 1.5 mm thick.',
 bad:U('mm',B('Base',60,60,5,0,0,0),B('Fin',1.5,60,25,0,0,7)),badSay:'A base with fins.',fixWhen:'separate pieces',fixSay:'The fin floated above the base and there was only one. A heat sink recipe makes the base and twelve fins as one solid.',fix:U('mm',{recipe:'heatsink',width:60,depth:60,base:5,height:25,fins:12,fin_thickness:1.5}),
 good:U('mm',{recipe:'heatsink',width:60,depth:60,base:5,height:25,fins:12,fin_thickness:1.5}),
 checks:[{solids:1},{size:[[58,62],[58,62],[28,32]]},{line:{axis:'x',f:0.5,zf:0.8,n:12}},{vol:[30000,60000]}]},
{id:'flange',units:'in',prompt:'Flange: 7 inch outside diameter, 3/4 inch thick, 2 inch bore, eight 3/4 inch bolt holes on a 5.5 inch bolt circle.',
 bad:U('in',{add:{type:'cylinder',name:'Disc',r:3.5,h:0.75}},{add:{type:'hole',name:'Bolt holes',plane:'XY',offset:0.75,d:0.75,thru:true,pts:[[5.5,0]]}}),badSay:'A disc with a bolt hole.',fixWhen:'changed nothing',fixSay:'I put the hole at the diameter instead of the radius, so it missed the part. A flange recipe places eight holes on the circle and cuts the bore.',fix:U('in',{recipe:'flange',diameter:7,thickness:0.75,bore:2,bolts:8,bolt_circle:5.5,bolt_hole:0.75}),
 good:U('in',{recipe:'flange',diameter:7,thickness:0.75,bore:2,bolts:8,bolt_circle:5.5,bolt_hole:0.75}),
 checks:[{solids:1},{size:[[174,181],[174,181],[18,60]]},{runs:{rf:[0.55,0.6,0.65,0.7,0.75,0.8],zf:[0.3],n:8}},{probes:[['o','o',0.3,false,'the bore']]}]},
{id:'bracket',units:'in',prompt:'L-bracket: a 3 inch long base and a 3 inch tall upright, both 1.5 inch wide and 1/8 inch thick, with two 1/4 inch holes in the base. One solid piece.',
 bad:U('in',B('Base',3,1.5,0.125,1.5,0,0),B('Upright',0.125,1.5,3,3.5,0,0),{add:{type:'hole',name:'Holes',plane:'XY',offset:0.125,d:0.25,thru:true,pts:[[1.5,0.4],[1.5,-0.4]]}}),badSay:'An L bracket.',fixWhen:'separate pieces',fixSay:'The upright was 3 inches away from the base. I moved it to the end of the base.',fix:[{set:{id:'f2',x:0.0625}}],
 good:U('in',B('Base',3,1.5,0.125,1.5,0,0),B('Upright',0.125,1.5,3,0.0625,0,0),{add:{type:'hole',name:'Holes',plane:'XY',offset:0.125,d:0.25,thru:true,pts:[[1.5,0.4],[1.5,-0.4]]}}),
 checks:[{solids:1},{size:[[74,78],[37,39],[74,78]]},{faces:{type:'CYLINDER',min:2}},{vol:[12000,20000]}]},
{id:'enclosure',units:'mm',prompt:'A 100 x 60 x 40 mm electronics enclosure with 2 mm walls and a flat 2 mm thick lid sitting closed on top of it, all one model.',
 bad:U('mm',B('Body',100,60,38,0,0,0),{add:{type:'shell',name:'Hollow',t:2,faces:{side:'+Z'}}},B('Lid',100,60,2,0,0,48)),badSay:'The enclosure and its lid.',fixWhen:'separate pieces',fixSay:'The lid was floating 10 mm above the box. I lowered it onto the walls.',fix:[{set:{id:'f3',z:38}}],
 good:U('mm',B('Body',100,60,38,0,0,0),{add:{type:'shell',name:'Hollow',t:2,faces:{side:'+Z'}}},B('Lid',100,60,2,0,0,38)),
 checks:[{solids:1},{size:[[98,102],[58,62],[39,41]]},{probes:[[0.5,0.5,0.45,false,'the cavity'],[0.01,0.5,0.4,true,'the side wall']]},{vol:[8000,60000]}]},
{id:'bottle',units:'mm',prompt:'A 250 mm tall water bottle, 70 mm body diameter, 28 mm neck, hollow with 2 mm walls and an open mouth.',
 bad:U('mm',{add:{type:'revolve',name:'Bottle',plane:'XZ',axis:'y',angle:360,shapes:[{k:'path',pts:[[0,0],[889,0],[889,4318],[356,5461],[356,6350],[305,6350],[305,5486],[838,4369],[838,51],[0,51]]}]}}),badSay:'A bottle.',fixWhen:'huge',fixSay:'I used inches by mistake, so the bottle came out 6 metres tall. Redrawn in millimetres.',fix:U('mm',{add:{type:'revolve',name:'Bottle',plane:'XZ',axis:'y',angle:360,shapes:[{k:'path',pts:[[0,0],[35,0],[35,170],[14,215],[14,250],[12,250],[12,216],[33,172],[33,2],[0,2]]}]}}),
 good:U('mm',{add:{type:'revolve',name:'Bottle',plane:'XZ',axis:'y',angle:360,shapes:[{k:'path',pts:[[0,0],[35,0],[35,170],[14,215],[14,250],[12,250],[12,216],[33,172],[33,2],[0,2]]}]}}),
 checks:[{solids:1},{size:[[66,74],[66,74],[240,260]]},{ratio:[2,0,3,4]},{probes:[[0.5,0.5,0.4,false,'the inside of the body']]},{radiusAt:{zf:0.97,max:0.5}},{radiusAt:{zf:0.3,min:0.9}},{vol:[30000,200000]}]},
{id:'impeller',units:'in',prompt:'A 4 inch centrifugal pump impeller with 7 backward curved blades, a closed shroud and a 1/4 inch bore.',
 bad:U('in',{add:{type:'cylinder',name:'Backplate',r:2,h:0.15}},{add:{type:'cylinder',name:'Shroud',r:2,h:0.15,z:1.2}}),badSay:'The two plates of an impeller.',fixWhen:'separate pieces',fixSay:'The plates were two loose discs without blades. An impeller recipe builds the backplate, seven backward curved blades and the shroud as one solid.',fix:U('in',{recipe:'impeller',diameter:4,blades:7,bore:0.25}),
 good:U('in',{recipe:'impeller',diameter:4,blades:7,bore:0.25}),
 checks:[{solids:1},{size:[[98,105],[98,105],[20,40]]},{runs:{rf:[0.6,0.7,0.8],zf:[0.4,0.5,0.6],n:7}},{probes:[['o','o',0.1,false,'the bore']]}]}
];
