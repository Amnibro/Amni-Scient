const P=(name,expr,note)=>({name,expr:String(expr),note});
const fix=(o,f)=>Array.isArray(o)?o.map(x=>fix(x,f)):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,fix(v,f)])):typeof o==='string'?o.replace(/v\(([-\d.]+),([-\d.]+)\)/g,(m,a,b)=>f(+a,+b)):o;
const mk=u=>{const U=(i,m)=>u==='in'?i:m;return[
{key:'plate',name:'Mounting plate',desc:'Plate with four corner holes and rounded corners',doc:{name:'Mounting plate',material:'al6061',params:[P('w',U(4,100),'width'),P('d',U(2.5,60),'depth'),P('t',U(0.25,6),'thickness'),P('hole',U(0.281,6.6),u==='in'?'1/4 in screw clearance':'M6 clearance'),P('edge',U(0.4,10),'hole inset'),P('rc',U(0.25,6),'corner radius')],features:[
{id:'f1',type:'box',name:'Plate',w:'w',d:'d',h:'t'},
{id:'f2',type:'fillet',name:'Round corners',r:'rc',edges:{dir:'Z'}},
{id:'f3',type:'hole',name:'Corner holes',plane:'face',face:{side:'+Z'},d:'hole',thru:true,pts:[['w/2-edge','d/2-edge'],['-(w/2-edge)','d/2-edge'],['w/2-edge','-(d/2-edge)'],['-(w/2-edge)','-(d/2-edge)']]},
{id:'f4',type:'chamfer',name:'Top chamfer',d:'v(0.6,0.02)',edges:{side:'+Z'}}]}},
{key:'bracket',name:'L-bracket',desc:'Angle bracket with gusset fillet and slots',doc:{name:'L-bracket',material:'steel1018',params:[P('w',U(2,50),'width'),P('a',U(2.5,60),'base leg'),P('b',U(2,50),'upright leg'),P('t',U(0.1875,5),'thickness'),P('rin',U(0.25,6),'inside bend radius'),P('hole',U(0.281,6.6),u==='in'?'1/4 in screw clearance':'hole Ø')],features:[
{id:'f1',type:'box',name:'Base',w:'a',d:'w',h:'t',x:'a/2'},
{id:'f2',type:'box',name:'Upright',w:'t',d:'w',h:'b',x:'t/2'},
{id:'f3',type:'fillet',name:'Inside bend',r:'rin',edges:{by:'pick',pts:[['t',0,'t']]}},
{id:'f4',type:'hole',name:'Base holes',plane:'XY',offset:'t',d:'hole',thru:true,pts:[['a*0.65','w/4'],['a*0.65','-w/4']]},
{id:'f5',type:'hole',name:'Upright holes',plane:'YZ',offset:'t',d:'hole',thru:true,pts:[['w/4','b*0.65'],['-w/4','b*0.65']]},
{id:'f6',type:'fillet',name:'Outer corners',r:'v(4,0.15)',edges:[{by:'pick',pts:[['a',"w/2",'t/2'],['a',"-w/2",'t/2'],['t/2','w/2','b'],['t/2','-w/2','b']]}]}]}},
{key:'flange',name:'Pipe flange',desc:'Raised-face flange with bolt circle',doc:{name:'Pipe flange',material:'ss304',params:[P('od',U(6,150),'outer Ø'),P('bore',U(2.375,60),'bore Ø'),P('t',U(0.625,16),'thickness'),P('bc',U(4.75,120),'bolt circle Ø'),P('bolt',U(0.625,14),'bolt hole Ø'),P('n',8,'bolt count'),P('hub',U(3.5,90),'hub Ø'),P('hubh',U(0.5,12),'hub height')],features:[
{id:'f1',type:'cylinder',name:'Disc',r:'od/2',h:'t'},
{id:'f2',type:'cylinder',name:'Hub',r:'hub/2',h:'hubh',z:'t'},
{id:'f3',type:'cylinder',name:'Bore',r:'bore/2',h:'t+hubh+v(2,0.08)',z:'-v(1,0.04)',op:'cut'},
{id:'f4',type:'hole',name:'Bolt hole',plane:'XY',offset:'t',d:'bolt',thru:true,pts:[['bc/2',0]]},
{id:'f5',type:'pattern',name:'Bolt circle',kind:'circular',of:['f4'],n:'n',axis:'Z',angle:360},
{id:'f6',type:'fillet',name:'Hub fillet',r:'v(3,0.125)',edges:{by:'pick',pts:[['hub/2',0,'t']]}},
{id:'f7',type:'chamfer',name:'Bore chamfer',d:'v(1.5,0.06)',edges:{by:'pick',pts:[['bore/2',0,'t+hubh']]}}]}},
{key:'enclosure',name:'Electronics enclosure',desc:'Shelled box with rounded corners and mounting bosses',doc:{name:'Enclosure',material:'petg',params:[P('w',U(4.75,120),'outside width'),P('d',U(3.25,80),'outside depth'),P('h',U(1.5,40),'outside height'),P('wall',U(0.1,2.4),'wall'),P('rc',U(0.3,8),'corner radius'),P('boss',U(0.28,7),'boss Ø'),P('pilot',U(0.1,2.5),u==='in'?'#4 screw pilot':'screw pilot Ø')],features:[
{id:'f1',type:'box',name:'Body',w:'w',d:'d',h:'h'},
{id:'f2',type:'fillet',name:'Corners',r:'rc',edges:{dir:'Z'}},
{id:'f3',type:'fillet',name:'Bottom edge',r:'wall+v(2,0.08)',edges:{side:'-Z'}},
{id:'f4',type:'shell',name:'Hollow',t:'wall',faces:{side:'+Z'}},
{id:'f5',type:'extrude',name:'Bosses',plane:'XY',offset:'wall',depth:'h-wall-v(3,0.12)',shapes:[{k:'circle',r:'boss/2',x:'w/2-rc',y:'d/2-rc'},{k:'circle',r:'boss/2',x:'-(w/2-rc)',y:'d/2-rc'},{k:'circle',r:'boss/2',x:'w/2-rc',y:'-(d/2-rc)'},{k:'circle',r:'boss/2',x:'-(w/2-rc)',y:'-(d/2-rc)'}]},
{id:'f6',type:'hole',name:'Pilot holes',plane:'XY',offset:'h-v(3,0.12)',d:'pilot',thru:false,depth:'h-v(6,0.24)',pts:[['w/2-rc','d/2-rc'],['-(w/2-rc)','d/2-rc'],['w/2-rc','-(d/2-rc)'],['-(w/2-rc)','-(d/2-rc)']]}]}},
{key:'standoff',name:'Hex standoff',desc:'Hex spacer with tapped-size bore and chamfers',doc:{name:'Hex standoff',material:'brass',params:[P('af',U(0.3125,8),u==='in'?'across flats (5/16 in)':'across flats'),P('L',U(0.75,20),'length'),P('bore',U(0.159,4.2),u==='in'?'#10-32 tap drill (#21)':'M5 tap drill')],features:[
{id:'f1',type:'extrude',name:'Hex',plane:'XY',depth:'L',shapes:[{k:'poly',r:'af/2/cos(30)',n:6}]},
{id:'f2',type:'hole',name:'Bore',plane:'XY',offset:'L',d:'bore',thru:true},
{id:'f3',type:'chamfer',name:'End chamfers',d:'v(0.5,0.02)',edges:[{side:'+Z'},{side:'-Z'}]}]}},
{key:'pulley',name:'V-belt pulley',desc:'Revolved pulley with keyway bore',doc:{name:'V-belt pulley',material:'al6061',params:[P('D',U(3.25,80),'outer Ø'),P('W',U(0.8,20),'width'),P('groove',U(0.4,10),'groove depth'),P('bore',U(0.625,16),'bore Ø'),P('key',U(0.1875,5),'key width')],features:[
{id:'f1',type:'revolve',name:'Body',plane:'XZ',axis:'y',angle:360,shapes:[{k:'path',pts:[['bore/2',0],['D/2',0],['D/2','W*0.15'],['D/2-groove','W/2'],['D/2','W*0.85'],['D/2','W'],['bore/2','W']]}]},
{id:'f2',type:'extrude',name:'Keyway',plane:'XY',offset:'-v(1,0.04)',depth:'W+v(2,0.08)',op:'cut',shapes:[{k:'rect',w:'key',h:'key',x:0,y:'bore/2'}]},
{id:'f3',type:'chamfer',name:'Bore chamfer',d:'v(0.8,0.03)',edges:{type:'CIRCLE',side:'+Z'}}]}},
{key:'knob',name:'Knurled knob',desc:'Grip knob with flutes and D-shaft bore',doc:{name:'Knob',material:'abs',params:[P('D',U(1.25,30),'diameter'),P('H',U(0.625,16),'height'),P('flutes',18,'flute count'),P('fr',U(0.0625,1.6),'flute radius'),P('shaft',U(0.25,6.2),u==='in'?'1/4 in D-shaft':'shaft Ø')],features:[
{id:'f1',type:'cylinder',name:'Body',r:'D/2',h:'H'},
{id:'f2',type:'fillet',name:'Top round',r:'v(2.5,0.1)',edges:{side:'+Z'}},
{id:'f3',type:'cylinder',name:'Flute',r:'fr',h:'H+v(2,0.08)',x:'D/2',z:'-v(1,0.04)',op:'cut'},
{id:'f4',type:'pattern',name:'Flutes',kind:'circular',of:['f3'],n:'flutes',axis:'Z',angle:360},
{id:'f5',type:'extrude',name:'D-shaft',plane:'XY',offset:'-v(0.01,0.0004)',depth:'H*0.75',op:'cut',shapes:[{k:'circle',r:'shaft/2'},{k:'rect',w:'shaft',h:'shaft',x:0,y:'shaft*0.85',hole:true}]}]}}
].map(t=>{const d=fix(t.doc,(m,i)=>String(u==='in'?i:m));d.units=u;for(const f of d.features)for(const k in f)if(typeof f[k]==='string'&&/^-?[\d.]+$/.test(f[k])&&!['id','type','name','op','plane','axis','kind','dir'].includes(k))f[k]=+f[k];return{...t,doc:d};});};
export const TEMPLATES=mk('mm');
export const TEMPLATES_IN=mk('in');
export const templatesFor=u=>u==='in'?TEMPLATES_IN:TEMPLATES;
