const P=(name,expr,note)=>({name,expr:String(expr),note});
export const TEMPLATES=[
{key:'plate',name:'Mounting plate',desc:'Plate with four corner holes and rounded corners',doc:{name:'Mounting plate',material:'al6061',params:[P('w',100,'width'),P('d',60,'depth'),P('t',6,'thickness'),P('hole',6.6,'M6 clearance'),P('edge',10,'hole inset'),P('rc',6,'corner radius')],features:[
{id:'f1',type:'box',name:'Plate',w:'w',d:'d',h:'t'},
{id:'f2',type:'fillet',name:'Round corners',r:'rc',edges:{dir:'Z'}},
{id:'f3',type:'hole',name:'Corner holes',plane:'face',face:{side:'+Z'},d:'hole',thru:true,pts:[['w/2-edge','d/2-edge'],['-(w/2-edge)','d/2-edge'],['w/2-edge','-(d/2-edge)'],['-(w/2-edge)','-(d/2-edge)']]},
{id:'f4',type:'chamfer',name:'Top chamfer',d:0.6,edges:{side:'+Z'}}]}},
{key:'bracket',name:'L-bracket',desc:'Angle bracket with gusset fillet and slots',doc:{name:'L-bracket',material:'steel1018',params:[P('w',50,'width'),P('a',60,'base leg'),P('b',50,'upright leg'),P('t',5,'thickness'),P('rin',6,'inside bend radius'),P('hole',6.6,'hole Ø')],features:[
{id:'f1',type:'box',name:'Base',w:'a',d:'w',h:'t',x:'a/2'},
{id:'f2',type:'box',name:'Upright',w:'t',d:'w',h:'b',x:'t/2'},
{id:'f3',type:'fillet',name:'Inside bend',r:'rin',edges:{by:'pick',pts:[['t',0,'t']]}},
{id:'f4',type:'hole',name:'Base holes',plane:'XY',offset:'t',d:'hole',thru:true,pts:[['a*0.65','w/4'],['a*0.65','-w/4']]},
{id:'f5',type:'hole',name:'Upright holes',plane:'YZ',offset:'t',d:'hole',thru:true,pts:[['w/4','b*0.65'],['-w/4','b*0.65']]},
{id:'f6',type:'fillet',name:'Outer corners',r:4,edges:[{by:'pick',pts:[['a',"w/2",'t/2'],['a',"-w/2",'t/2'],['t/2','w/2','b'],['t/2','-w/2','b']]}]}]}},
{key:'flange',name:'Pipe flange',desc:'Raised-face flange with bolt circle',doc:{name:'Pipe flange',material:'ss304',params:[P('od',150,'outer Ø'),P('bore',60,'bore Ø'),P('t',16,'thickness'),P('bc',120,'bolt circle Ø'),P('bolt',14,'bolt hole Ø'),P('n',8,'bolt count'),P('hub',90,'hub Ø'),P('hubh',12,'hub height')],features:[
{id:'f1',type:'cylinder',name:'Disc',r:'od/2',h:'t'},
{id:'f2',type:'cylinder',name:'Hub',r:'hub/2',h:'hubh',z:'t'},
{id:'f3',type:'cylinder',name:'Bore',r:'bore/2',h:'t+hubh+2',z:-1,op:'cut'},
{id:'f4',type:'hole',name:'Bolt hole',plane:'XY',offset:'t',d:'bolt',thru:true,pts:[['bc/2',0]]},
{id:'f5',type:'pattern',name:'Bolt circle',kind:'circular',of:['f4'],n:'n',axis:'Z',angle:360},
{id:'f6',type:'fillet',name:'Hub fillet',r:3,edges:{by:'pick',pts:[['hub/2',0,'t']]}},
{id:'f7',type:'chamfer',name:'Bore chamfer',d:1.5,edges:{by:'pick',pts:[['bore/2',0,'t+hubh']]}}]}},
{key:'enclosure',name:'Electronics enclosure',desc:'Shelled box with rounded corners and mounting bosses',doc:{name:'Enclosure',material:'petg',params:[P('w',120,'outside width'),P('d',80,'outside depth'),P('h',40,'outside height'),P('wall',2.4,'wall'),P('rc',8,'corner radius'),P('boss',7,'boss Ø'),P('pilot',2.5,'screw pilot Ø')],features:[
{id:'f1',type:'box',name:'Body',w:'w',d:'d',h:'h'},
{id:'f2',type:'fillet',name:'Corners',r:'rc',edges:{dir:'Z'}},
{id:'f3',type:'fillet',name:'Bottom edge',r:'wall+2',edges:{side:'-Z'}},
{id:'f4',type:'shell',name:'Hollow',t:'wall',faces:{side:'+Z'}},
{id:'f5',type:'extrude',name:'Bosses',plane:'XY',offset:'wall',depth:'h-wall-3',shapes:[{k:'circle',r:'boss/2',x:'w/2-rc',y:'d/2-rc'},{k:'circle',r:'boss/2',x:'-(w/2-rc)',y:'d/2-rc'},{k:'circle',r:'boss/2',x:'w/2-rc',y:'-(d/2-rc)'},{k:'circle',r:'boss/2',x:'-(w/2-rc)',y:'-(d/2-rc)'}]},
{id:'f6',type:'hole',name:'Pilot holes',plane:'XY',offset:'h-3',d:'pilot',thru:false,depth:'h-6',pts:[['w/2-rc','d/2-rc'],['-(w/2-rc)','d/2-rc'],['w/2-rc','-(d/2-rc)'],['-(w/2-rc)','-(d/2-rc)']]}]}},
{key:'standoff',name:'Hex standoff',desc:'Hex spacer with tapped-size bore and chamfers',doc:{name:'Hex standoff',material:'brass',params:[P('af',8,'across flats'),P('L',20,'length'),P('bore',4.2,'M5 tap drill')],features:[
{id:'f1',type:'extrude',name:'Hex',plane:'XY',depth:'L',shapes:[{k:'poly',r:'af/2/cos(30)',n:6}]},
{id:'f2',type:'hole',name:'Bore',plane:'XY',offset:'L',d:'bore',thru:true},
{id:'f3',type:'chamfer',name:'End chamfers',d:0.5,edges:[{side:'+Z'},{side:'-Z'}]}]}},
{key:'pulley',name:'V-belt pulley',desc:'Revolved pulley with keyway bore',doc:{name:'V-belt pulley',material:'al6061',params:[P('D',80,'outer Ø'),P('W',20,'width'),P('groove',10,'groove depth'),P('bore',16,'bore Ø'),P('key',5,'key width')],features:[
{id:'f1',type:'revolve',name:'Body',plane:'XZ',axis:'y',angle:360,shapes:[{k:'path',pts:[['bore/2',0],['D/2',0],['D/2','W*0.15'],['D/2-groove','W/2'],['D/2','W*0.85'],['D/2','W'],['bore/2','W']]}]},
{id:'f2',type:'extrude',name:'Keyway',plane:'XY',offset:-1,depth:'W+2',op:'cut',shapes:[{k:'rect',w:'key',h:'key',x:0,y:'bore/2'}]},
{id:'f3',type:'chamfer',name:'Bore chamfer',d:0.8,edges:{type:'CIRCLE',side:'+Z'}}]}},
{key:'knob',name:'Knurled knob',desc:'Grip knob with flutes and D-shaft bore',doc:{name:'Knob',material:'abs',params:[P('D',30,'diameter'),P('H',16,'height'),P('flutes',18,'flute count'),P('fr',1.6,'flute radius'),P('shaft',6.2,'shaft Ø')],features:[
{id:'f1',type:'cylinder',name:'Body',r:'D/2',h:'H'},
{id:'f2',type:'fillet',name:'Top round',r:2.5,edges:{side:'+Z'}},
{id:'f3',type:'cylinder',name:'Flute',r:'fr',h:'H+2',x:'D/2',z:-1,op:'cut'},
{id:'f4',type:'pattern',name:'Flutes',kind:'circular',of:['f3'],n:'flutes',axis:'Z',angle:360},
{id:'f5',type:'extrude',name:'D-shaft',plane:'XY',offset:-0.01,depth:'H*0.75',op:'cut',shapes:[{k:'circle',r:'shaft/2'},{k:'rect',w:'shaft',h:'shaft',x:0,y:'shaft*0.85',hole:true}]}]}}
];
