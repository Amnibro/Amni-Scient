const OP=['op','Operation','add',['add','cut','intersect']],X=['x','X',0],Y=['y','Y',0],Z=['z','Z',0],AXIS=['axis','Axis','Z',['X','Y','Z']];
const PLANE=[['plane','Sketch on','XY',['XY','XZ','YZ','face']],['face','Face',{side:'+Z'},'face',s=>s.plane==='face'],['offset','Offset',0]];
export const FT={
box:{n:'Box',g:'Solid',i:'▣',f:[['w','Width (X)',40],['d','Depth (Y)',30],['h','Height (Z)',10],['x','Center X',0],['y','Center Y',0],['z','Base Z',0],OP],doc:'axis-aligned box centred on x,y with its base at z'},
cylinder:{n:'Cylinder',g:'Solid',i:'◯',f:[['r','Radius',10],['h','Height',20],X,Y,Z,AXIS,['center','Centred on point',false,'bool'],OP],doc:'cylinder starting at x,y,z going along axis'},
sphere:{n:'Sphere',g:'Solid',i:'●',f:[['r','Radius',10],X,Y,Z,OP]},
cone:{n:'Cone',g:'Solid',i:'△',f:[['r1','Base radius',10],['r2','Top radius',0],['h','Height',20],X,Y,Z,AXIS,OP]},
torus:{n:'Torus',g:'Solid',i:'◎',f:[['r1','Ring radius',20],['r2','Tube radius',3],X,Y,Z,OP]},
extrude:{n:'Extrude',g:'Sketch',i:'⬆',f:[...PLANE,['shapes','Profile',[{k:'rect',w:20,h:10}],'shapes'],['depth','Depth',10],['dir','Direction','+',['+','-','both']],['draft','Draft angle °',0],OP],doc:'2D profile on a plane pushed along the plane normal'},
revolve:{n:'Revolve',g:'Sketch',i:'↻',f:[...PLANE,['shapes','Profile',[{k:'rect',x:15,y:5,w:5,h:10}],'shapes'],['axis','Axis','y',['x','y']],['angle','Angle °',360],OP],doc:'2D profile spun around the sketch x or y axis (profile must stay on one side of the axis)'},
hole:{n:'Hole',g:'Sketch',i:'⊙',f:[...PLANE,['pts','Centres (x, y)',[[0,0]],'pts'],['d','Diameter',5],['thru','Through all',true,'bool'],['depth','Depth',10,null,s=>s.thru===false],['cb_d','Counterbore Ø',0],['cb_h','Counterbore depth',0],['cs_d','Countersink Ø',0]],doc:'drills into the part from the sketch plane, against its normal'},
fillet:{n:'Fillet',g:'Modify',i:'◜',f:[['r','Radius',2],['edges','Edges',{dir:'Z'},'edges']]},
chamfer:{n:'Chamfer',g:'Modify',i:'◸',f:[['d','Distance',1],['edges','Edges',{side:'+Z'},'edges']]},
shell:{n:'Shell',g:'Modify',i:'▢',f:[['t','Wall thickness',2],['faces','Open faces',{side:'+Z'},'faces']],doc:'hollows the part inward, removing the open faces'},
pattern:{n:'Pattern',g:'Modify',i:'⁘',f:[['of','Repeat features',[],'feats'],['kind','Type','linear',['linear','circular']],['n','Count',4],['dx','Step X',20,null,s=>s.kind!=='circular'],['dy','Step Y',0,null,s=>s.kind!=='circular'],['dz','Step Z',0,null,s=>s.kind!=='circular'],['axis','Axis','Z',['X','Y','Z'],s=>s.kind==='circular'],['angle','Total angle °',360,null,s=>s.kind==='circular'],['ox','Axis through X',0,null,s=>s.kind==='circular'],['oy','Axis through Y',0,null,s=>s.kind==='circular']],doc:'copies earlier solid/cut/hole features; circular with angle 360 spaces them evenly'},
mirror:{n:'Mirror',g:'Modify',i:'⇋',f:[['plane','Mirror plane','YZ',['YZ','XZ','XY']],['offset','Plane offset',0]],doc:'adds a mirrored copy of the whole part'},
move:{n:'Move',g:'Modify',i:'✥',f:[['dx','Move X',0],['dy','Move Y',0],['dz','Move Z',0],['angle','Rotate °',0],['axis','Rotate axis','Z',['X','Y','Z']]]},
import:{n:'Imported STEP',g:'File',i:'⇩',f:[OP],hidden:true}
};
export const SHAPES={rect:{n:'Rectangle',f:[['x','Centre x',0],['y','Centre y',0],['w','Width',20],['h','Height',10],['r','Corner radius',0],['a','Rotate °',0]]},circle:{n:'Circle',f:[['x','Centre x',0],['y','Centre y',0],['r','Radius',5]]},poly:{n:'Polygon',f:[['x','Centre x',0],['y','Centre y',0],['r','Corner radius',10],['n','Sides',6],['a','Rotate °',0]]},slot:{n:'Slot',f:[['x','Centre x',0],['y','Centre y',0],['l','Length (centres)',20],['h','Width',6],['a','Rotate °',0]]},path:{n:'Polyline',f:[['pts','Points',[[0,0],[20,0],[10,15]],'pts']]},text:{n:'Text',f:[['text','Text','Amni','text'],['x','x',0],['y','y',0],['h','Size',10]]}};
export const MATS={
al6061:{n:'Aluminium 6061-T6',E:68900,nu:0.33,rho:2700,sy:276,cost:6},
al7075:{n:'Aluminium 7075-T6',E:71700,nu:0.33,rho:2810,sy:503,cost:9},
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
export function defaults(type){const o={type};for(const f of FT[type].f)o[f[0]]=JSON.parse(JSON.stringify(f[2]));if(o.plane!=='face')delete o.face;return o;}
export function featureDocs(){
  const L=[];
  for(const[k,t]of Object.entries(FT)){if(t.hidden)continue;L.push(`- ${k}: ${t.f.map(f=>f[0]+(Array.isArray(f[3])?'('+f[3].join('|')+')':'')).join(', ')}${t.doc?' — '+t.doc:''}`);}
  return L.join('\n');
}
