const OP=['op','Operation','add',['add','cut','intersect']],X=['x','X',0],Y=['y','Y',0],Z=['z','Z',0],AXIS=['axis','Axis','Z',['X','Y','Z']];
const PLANE=[['plane','Sketch on','XY',['XY','XZ','YZ','face']],['face','Face',{side:'+Z'},'face',s=>s.plane==='face'],['offset','Offset',0]];
export const FT={
box:{n:'Box',g:'Solid',i:'▣',f:[['w','Width (X)',40],['d','Depth (Y)',30],['h','Height (Z)',10],['x','Center X',0],['y','Center Y',0],['z','Base Z',0],OP],doc:'axis-aligned box centered on x,y with its base at z'},
cylinder:{n:'Cylinder',g:'Solid',i:'◯',f:[['r','Radius',10],['h','Height',20],X,Y,Z,AXIS,['center','Centered on point',false,'bool'],OP],doc:'cylinder starting at x,y,z going along axis'},
sphere:{n:'Sphere',g:'Solid',i:'●',f:[['r','Radius',10],X,Y,Z,OP]},
cone:{n:'Cone',g:'Solid',i:'△',f:[['r1','Base radius',10],['r2','Top radius',0],['h','Height',20],X,Y,Z,AXIS,OP]},
torus:{n:'Torus',g:'Solid',i:'◎',f:[['r1','Ring radius',20],['r2','Tube radius',3],X,Y,Z,OP]},
extrude:{n:'Extrude',g:'Sketch',i:'⬆',f:[...PLANE,['shapes','Profile',[{k:'rect',w:20,h:10}],'shapes'],['depth','Depth',10],['dir','Direction','+',['+','-','both']],['draft','Draft angle °',0],OP],doc:'2D profile on a plane pushed along the plane normal'},
revolve:{n:'Revolve',g:'Sketch',i:'↻',f:[...PLANE,['shapes','Profile',[{k:'rect',x:15,y:5,w:5,h:10}],'shapes'],['axis','Axis','y',['x','y']],['angle','Angle °',360],OP],doc:'2D profile spun around the sketch x or y axis (profile must stay on one side of the axis)'},
hole:{n:'Hole',g:'Sketch',i:'⊙',f:[...PLANE,['pts','Centers (x, y)',[[0,0]],'pts'],['std','Standard size','custom',['custom','#4','#6','#8','#10','1/4','5/16','3/8','1/2','M2','M2.5','M3','M4','M5','M6','M8','M10','M12','M16','M20']],['fit','Hole type','clearance',['clearance','tapped','cbore','csink'],s=>s.std&&s.std!=='custom'],['d','Diameter',5,null,s=>!s.std||s.std==='custom'],['thru','Through all',true,'bool'],['depth','Depth',10,null,s=>s.thru===false],['cb_d','Counterbore Ø',0,null,s=>!s.std||s.std==='custom'],['cb_h','Counterbore depth',0,null,s=>!s.std||s.std==='custom'],['cs_d','Countersink Ø',0,null,s=>!s.std||s.std==='custom']],doc:'drills into the part from the sketch plane, against its normal; std #4, #6, #8, #10, 1/4, 5/16, 3/8, 1/2 (UNC screws: free-fit clearance, tapped = tap drill, cbore = socket head, csink = 82° flat head) or M2..M20 (ISO 273 medium clearance, ISO 4762 counterbore, ISO 10642 90° countersink) with fit clearance|tapped|cbore|csink sets the sizes in the document units'},
loft:{n:'Loft',g:'Sketch',i:'⏶',f:[...PLANE,['sections','Sections',[{offset:0,shapes:[{k:'rect',w:40,h:40,r:4}]},{offset:30,shapes:[{k:'circle',r:12}]}],'sections'],['ruled','Straight sides',false,'bool'],OP],doc:'blends between 2+ profiles stacked along the plane normal; sections:[{offset,shapes:[one shape]}]'},
sweep:{n:'Sweep',g:'Sketch',i:'〰',f:[['path','Path points (x, y, z)',[[0,0,0],[0,0,40],[30,0,40]],'pts3'],['bend','Bend radius',8],['shapes','Profile',[{k:'circle',r:4}],'shapes'],OP],doc:'pushes a 2D profile (centered on 0,0) along a 3D polyline path with rounded bends; good for pipes, rails, handles, wires'},
coil:{n:'Coil spring',g:'Sketch',i:'➰',f:[['d','Mean diameter',20],['wire','Wire Ø',2],['pitch','Pitch',6],['turns','Turns',5],X,Y,Z,AXIS,['hand','Hand','right',['right','left']],OP],doc:'helical coil spring of round wire'},
thread:{n:'Thread',g:'Modify',i:'🔩',f:[['kind','Type','external',['external','internal']],['std','Standard','custom',['custom','#4-40','#6-32','#8-32','#10-24','#10-32','1/4-20','5/16-18','3/8-16','1/2-13','M3','M4','M5','M6','M8','M10','M12','M16','M20']],['d','Major Ø',10,null,s=>!s.std||s.std==='custom'],['pitch','Pitch',1.5,null,s=>!s.std||s.std==='custom'],['length','Length',15],X,Y,Z,AXIS,['hand','Hand','right',['right','left']]],doc:'Unified (UNC/UNF) or ISO metric 60° modeled thread; std like 1/4-20 or M6 sets diameter and pitch, otherwise d and pitch in document units; cut along the axis from x,y,z; external: on a cylinder of the major diameter; internal: in a hole of the minor diameter (d - 1.0825·pitch)'},
split:{n:'Split / trim',g:'Modify',i:'⫽',f:[['plane','Cut plane','XY',['XY','XZ','YZ']],['offset','Plane offset',0],['keep','Keep side','+',['+','-']]],doc:'cuts the part with a plane and keeps one side'},
scale:{n:'Scale',g:'Modify',i:'⤢',f:[['k','Factor',1],['ox','About X',0],['oy','About Y',0],['oz','About Z',0]]},
fillet:{n:'Fillet',g:'Modify',i:'◜',f:[['r','Radius',2],['edges','Edges',{dir:'Z'},'edges']]},
chamfer:{n:'Chamfer',g:'Modify',i:'◸',f:[['d','Distance',1],['edges','Edges',{side:'+Z'},'edges']]},
shell:{n:'Shell',g:'Modify',i:'▢',f:[['t','Wall thickness',2],['faces','Open faces',{side:'+Z'},'faces']],doc:'hollows the part inward, removing the open faces'},
pattern:{n:'Pattern',g:'Modify',i:'⁘',f:[['of','Repeat features',[],'feats'],['kind','Type','linear',['linear','circular']],['n','Count',4],['dx','Step X',20,null,s=>s.kind!=='circular'],['dy','Step Y',0,null,s=>s.kind!=='circular'],['dz','Step Z',0,null,s=>s.kind!=='circular'],['axis','Axis','Z',['X','Y','Z'],s=>s.kind==='circular'],['angle','Total angle °',360,null,s=>s.kind==='circular'],['ox','Axis through X',0,null,s=>s.kind==='circular'],['oy','Axis through Y',0,null,s=>s.kind==='circular']],doc:'copies earlier solid/cut/hole features; circular with angle 360 spaces them evenly'},
mirror:{n:'Mirror',g:'Modify',i:'⇋',f:[['plane','Mirror plane','YZ',['YZ','XZ','XY']],['offset','Plane offset',0]],doc:'adds a mirrored copy of the whole part'},
move:{n:'Move',g:'Modify',i:'✥',f:[['dx','Move X',0],['dy','Move Y',0],['dz','Move Z',0],['angle','Rotate °',0],['axis','Rotate axis','Z',['X','Y','Z']]]},
import:{n:'Imported STEP',g:'File',i:'⇩',f:[OP],hidden:true}
};
export const SHAPES={rect:{n:'Rectangle',f:[['x','Center x',0],['y','Center y',0],['w','Width',20],['h','Height',10],['r','Corner radius',0],['a','Rotate °',0]]},circle:{n:'Circle',f:[['x','Center x',0],['y','Center y',0],['r','Radius',5]]},poly:{n:'Polygon',f:[['x','Center x',0],['y','Center y',0],['r','Corner radius',10],['n','Sides',6],['a','Rotate °',0]]},slot:{n:'Slot',f:[['x','Center x',0],['y','Center y',0],['l','Length (centers)',20],['h','Width',6],['a','Rotate °',0]]},path:{n:'Polyline',f:[['pts','Points',[[0,0],[20,0],[10,15]],'pts']]},text:{n:'Text',f:[['text','Text','Amni','text'],['x','x',0],['y','y',0],['h','Size',10]]},ellipse:{n:'Ellipse',f:[['x','Center x',0],['y','Center y',0],['rx','Radius x',12],['ry','Radius y',6],['a','Rotate °',0]]},spline:{n:'Spline (closed)',f:[['pts','Points',[[0,0],[20,-5],[25,10],[5,15]],'pts']]}};
export const MATS={
al6061:{n:'Aluminum 6061-T6',E:68900,nu:0.33,rho:2700,sy:276,cost:6},
al7075:{n:'Aluminum 7075-T6',E:71700,nu:0.33,rho:2810,sy:503,cost:9},
steel1018:{n:'Steel 1018 (CR)',E:205000,nu:0.29,rho:7870,sy:370,cost:2.5},
steel4140:{n:'Steel 4140 (Q&T)',E:205000,nu:0.29,rho:7850,sy:655,cost:4},
ss304:{n:'Stainless 304',E:193000,nu:0.29,rho:8000,sy:215,cost:7},
ss316:{n:'Stainless 316',E:193000,nu:0.3,rho:8000,sy:205,cost:9},
ti64:{n:'Titanium Ti-6Al-4V',E:113800,nu:0.34,rho:4430,sy:880,cost:45},
brass:{n:'Brass C360',E:97000,nu:0.31,rho:8500,sy:310,cost:9},
pla:{n:'PLA (printed)',E:3500,nu:0.36,rho:1240,sy:50,cost:20},
petg:{n:'PETG (printed)',E:2100,nu:0.38,rho:1270,sy:45,cost:22},
abs:{n:'ABS',E:2200,nu:0.35,rho:1050,sy:40,cost:22},
nylon:{n:'Nylon PA12',E:1700,nu:0.39,rho:1010,sy:48,cost:60},
pc:{n:'Polycarbonate',E:2400,nu:0.37,rho:1200,sy:62,cost:25}
};
export const EDGE_MODES=[['all','All edges',()=>({by:'all'})],['dir','Parallel to axis',()=>({dir:'Z'})],['side','On a side',()=>({side:'+Z'})],['circle','Circular edges',()=>({type:'CIRCLE'})],['pick','Picked in view',()=>({by:'pick',pts:[]})]];
export const FACE_MODES=[['side','Side of part',()=>({side:'+Z'})],['normal','Facing a direction',()=>({normal:'+Z'})],['type','Surface type',()=>({type:'CYLINDER'})],['pick','Picked in view',()=>({by:'pick',pts:[]})],['all','All faces',()=>({by:'all'})]];
const NOLEN=new Set(['angle','draft','a','n','turns','k','modes','type','std','fit','kind','op','plane','dir','axis','hand','keep','by','side','normal','thru','ruled','center','hole','text']);
const nice=v=>{const a=Math.abs(v);return a===0?0:Math.sign(v)*(a<0.25?Math.max(0.005,Math.round(a/0.005)*0.005):Math.round(a*16)/16);};
export function toInchDefaults(o,key){return Array.isArray(o)?o.map(x=>toInchDefaults(x,key)):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,NOLEN.has(k)?v:toInchDefaults(v,k)])):typeof o==='number'&&!NOLEN.has(key)?+nice(o/25.4).toFixed(4):o;}
export function defaults(type,units){let o={type};for(const f of FT[type].f)o[f[0]]=JSON.parse(JSON.stringify(f[2]));if(o.plane!=='face')delete o.face;if(units==='in')o=toInchDefaults(o);return o;}
export function shapeDefaults(k,units){const o={k};for(const f of SHAPES[k].f)o[f[0]]=JSON.parse(JSON.stringify(f[2]));return units==='in'?toInchDefaults(o):o;}
export function featureDocs(){
  const L=[];
  for(const[k,t]of Object.entries(FT)){if(t.hidden)continue;L.push(`- ${k}: ${t.f.map(f=>f[0]+(Array.isArray(f[3])?'('+f[3].join('|')+')':'')).join(', ')}${t.doc?' — '+t.doc:''}`);}
  return L.join('\n');
}
