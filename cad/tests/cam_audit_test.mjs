import {audit,D,tool,mach,mat,bd,pip,cat,L,rect,rrect,circ,domeMesh} from './cam_harness.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const mk=(shapes,o={})=>({...D,shapes,stock_w:80,stock_h:60,stock_t:6,offset_x:10,offset_y:10,...o});
const S=(kind,role,o)=>({name:role+' '+kind,kind,role,depth:0,x:0,y:0,w:0,h:0,r:0,d:0,x2:0,y2:0,pts:[],closed:true,layer:'',...o});
function fitsFor(regs,r){// regs: [{P, inside:true|false(ring outside), ring:max}] in gcode coords
  return(x,y)=>{const R=regs.filter(R=>!R.inside||pip(R.P,x,y)).pop();if(!R)return false;return (R=>{const inR=(px,py)=>R.inside?pip(R.P,px,py):!pip(R.P,px,py);if(!inR(x,y))return false;const d=bd(R.P,x,y);if(!R.inside&&(d>2*r-0.2||d<0.2))return false;if(R.inside&&d<0.12)return false;if(d>=r)return R.inside;
    const e=0.01,gx=(bd(R.P,x+e,y)-bd(R.P,x-e,y))/(2*e),gy=(bd(R.P,x,y+e)-bd(R.P,x,y-e))/(2*e),gl=Math.hypot(gx,gy)||1,s=r-d+0.03,qx=x+gx/gl*s,qy=y+gy/gl*s;return inR(qx,qy)&&bd(R.P,qx,qy)>=r-0.02;})(R);};}
const T=n=>tool(n);const off=(P,ox=10,oy=10)=>P.map(p=>[p[0]+ox,p[1]+oy]);
const cases=[];
const t3=T('Flat 3.175 mm 2F (1/8 in)'),t6=T('Flat 6.0 mm 2F');
for(const climb of[false,true])for(const tl of[t3,t6]){
 cases.push(['pocket 30x20 d3 '+tl.dia+(climb?' climb':''),mk([S('rect','pocket',{x:10,y:10,w:30,h:20,depth:3})],{tool:tl,climb,tabs:0}),{fits:fitsFor([{P:off(rect(10,10,30,20)),inside:true}],tl.dia/2)}]);
 cases.push(['circle pocket d20 d2.5 '+tl.dia+(climb?' climb':''),mk([S('circle','pocket',{x:30,y:20,d:20,depth:2.5})],{tool:tl,climb,tabs:0}),{fits:fitsFor([{P:off(circ(30,20,20)),inside:true}],tl.dia/2)}]);
 const Lp=[[0,0],[50,0],[50,15],[20,15],[20,40],[0,40]];
 cases.push(['L cutout tabs0 '+tl.dia+(climb?' climb':''),mk([S('poly','cutout',{pts:Lp})],{tool:tl,climb,tabs:0}),{fits:fitsFor([{P:off(Lp),inside:false}],tl.dia/2)}]);
 cases.push(['L pocket d4 '+tl.dia+(climb?' climb':''),mk([S('poly','pocket',{pts:Lp,depth:4})],{tool:tl,climb,tabs:0}),{fits:fitsFor([{P:off(Lp),inside:true}],tl.dia/2)}]);
 const tabsfn=null;
 cases.push(['rect cutout r3 tabs4 '+tl.dia+(climb?' climb':''),mk([S('rect','cutout',{x:0,y:0,w:50,h:30,r:3})],{tool:tl,climb,tabs:4}),{fits:fitsFor([{P:off(rrect(0,0,50,30,3)),inside:false}],tl.dia/2),rtol:1.0+0.3}]);
 cases.push(['plate with holes+inner cutout '+tl.dia+(climb?' climb':''),mk([S('rect','cutout',{x:0,y:0,w:60,h:40}),S('circle','hole',{x:8,y:8,d:5}),S('circle','hole',{x:52,y:8,d:8}),S('circle','hole',{x:30,y:20,d:16}),S('rect','cutout',{x:40,y:25,w:12,h:8,name:'win'})],{tool:tl,climb,tabs:0}),{fits:(x,y)=>false}]);
 cases.push(['pocket depth groups '+tl.dia+(climb?' climb':''),mk([S('rect','pocket',{x:5,y:5,w:50,h:30,depth:2}),S('rect','pocket',{x:15,y:12,w:20,h:12,depth:5})],{tool:tl,climb,tabs:0}),{fits:fitsFor([{P:off(rect(5,5,50,30)),inside:true},{P:off(rect(15,12,20,12)),inside:true}],tl.dia/2)}]);
}
cases.push(['face',mk([],{tool:t6,face:true,face_depth:0.5,tabs:0}),{complete:false,top:-0.5}]);
cases.push(['drill holes',mk([S('circle','hole',{x:10,y:10,d:5}),S('circle','hole',{x:30,y:10,d:5,depth:3})],{tool:T('Drill 5 mm'),tabs:0}),{complete:false,maxdoc:false}]);
cases.push(['engrave vbit',mk([S('poly','engrave',{pts:[[5,5],[40,5],[40,30]],closed:false,depth:1})],{tool:T('V-bit 60 deg'),tabs:0}),{complete:false,engrave:true}]);
for(const[n,j,o]of cases){const a=audit(n,j,{fits:()=>false,...o});ok(!a.B.length,"2.5D "+n+": no gouge, no rapid into stock, correct side, DOC and limits respected, reachable stock cleared",a.B.map(b=>b.sev+" "+b.msg).join("; ")||undefined);}
// ShopBot (OpenSBP) metric files used to fail their own check and carried no unit guard.
for(const u of['mm','in']){const m=mach('ShopBot Desktop');const j={...D,units:u,machine:m,post:m.post,material:mat('Plywood')||cat.materials[0],tool:tool('Flat 3.175 mm 2F (1/8 in)'),stock_w:80,stock_h:60,stock_t:6,offset_x:10,offset_y:10,tabs:0,shapes:[{name:'p',kind:'rect',role:'pocket',x:10,y:10,w:30,h:20,r:0,d:0,depth:3,x2:0,y2:0,pts:[],closed:true,layer:''}]};
 const r=JSON.parse(L.cam_generate(JSON.stringify(j)));
 ok(r.ok&&r.gcode.includes(`IF %(25)=${u==='mm'?0:1} THEN GOTO UNIT_ERROR`),`ShopBot ${u} file passes its own check and refuses to run with the machine in the other unit`,r.ok?undefined:(r.errors||[]).slice(0,2).join('; '));}
// Solid milling: thin part with a curved top must be roughed (block), never plate-finished straight into solid stock.
{const m=mach('Haas VF-2'),mt=mat('Aluminum 6061 (VMC');const run=s=>JSON.parse(L.solid_cam(JSON.stringify({name:'dome',units:'mm',machine:m,material:mt,mesh:domeMesh(),holes:[],opts:{strategy:s}})));
 const a=run('auto'),s0=a.setups&&a.setups[0];
 ok(a.ok&&a.strategy==='block'&&s0.ops.some(o=>o.kind==='rough')&&a.setups.every(s=>s.sim.gouge_cells===0)&&s0.sim.rapid_hits<=1,'curved-top 18 mm part: auto picks block, roughs before the ball finish, no gouges, no rapid plunge into stock',a.strategy+' rapid_hits '+(s0&&s0.sim.rapid_hits));
 const p=run('plate');ok(!p.ok&&/plate cannot rough/i.test((p.errors||[]).join(' ')),'strategy plate refuses a deep curved top instead of plunging the ball finish',(p.errors||[])[0]);}
console.log(fail?`${fail} FAILED`:'ALL PASS');process.exit(fail?1:0);
