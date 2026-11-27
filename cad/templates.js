const P=(name,expr,note)=>({name,expr:String(expr),note});
const fix=(o,f)=>Array.isArray(o)?o.map(x=>fix(x,f)):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,fix(v,f)])):typeof o==='string'?o.replace(/v\(([-\d.]+),([-\d.]+)\)/g,(m,a,b)=>f(+a,+b)):o;
const mk=u=>{const U=(i,m)=>u==='in'?i:m;return[
{key:'gearbox_housing',name:'Gearbox housing',desc:'CNC motor and gearbox housing with a bearing bore, pockets, ribs, bosses, tapped holes and fillets',doc:{name:'Gearbox housing',material:'al6061',params:[P('L',U(5.5,140),'body length'),P('W',U(3.75,95),'body width'),P('H',U(2.6,66),'overall height'),P('t',U(0.12,3),'wall thickness'),P('base',U(0.31,8),'base thickness'),P('flange',U(0.5,12),'base flange'),P('bore',U(1.181,30),'bearing bore'),P('cb',U(1.42,36),'bearing counterbore'),P('cbh',U(0.22,5.5),'counterbore depth'),P('brg',U(1.455,37),'bore height'),P('pr',U(0.1,2.5),'pocket corner radius'),P('rib',U(0.18,4.5),'rib thickness')],features:[
{id:'f1',type:'box',name:'Base flange',w:'L+2*flange',d:'W+2*flange',h:'base'},
{id:'f2',type:'box',name:'Body',w:'L',d:'W',h:'H-base',z:'base'},
{id:'f3',type:'fillet',name:'Outer corners',r:'v(4,0.16)',edges:{dir:'Z'}},
{id:'f4',type:'extrude',name:'Cavity',plane:'XY',offset:'H',dir:'-',depth:'H-base',op:'cut',shapes:[{k:'rect',w:'L-2*t',h:'W-2*t',r:'pr'}]},
{id:'f5',type:'box',name:'Corner post +X+Y',w:U(0.45,11),d:U(0.45,11),h:'H-base-v(0.5,0.02)',x:'L/2-t-v(5.5,0.22)',y:'W/2-t-v(5.5,0.22)',z:'base+v(0.3,0.012)'},
{id:'f6',type:'box',name:'Corner post -X+Y',w:U(0.45,11),d:U(0.45,11),h:'H-base-v(0.5,0.02)',x:'-(L/2-t-v(5.5,0.22))',y:'W/2-t-v(5.5,0.22)',z:'base+v(0.3,0.012)'},
{id:'f7',type:'box',name:'Corner post +X-Y',w:U(0.45,11),d:U(0.45,11),h:'H-base-v(0.5,0.02)',x:'L/2-t-v(5.5,0.22)',y:'-(W/2-t-v(5.5,0.22))',z:'base+v(0.3,0.012)'},
{id:'f8',type:'box',name:'Corner post -X-Y',w:U(0.45,11),d:U(0.45,11),h:'H-base-v(0.5,0.02)',x:'-(L/2-t-v(5.5,0.22))',y:'-(W/2-t-v(5.5,0.22))',z:'base+v(0.3,0.012)'},
{id:'f9',type:'extrude',name:'Side pocket +Y',plane:'XZ',offset:'-W/2',dir:'+',depth:'t*0.55',op:'cut',shapes:[{k:'rect',x:0,y:'(H+base)/2',w:'L-v(30,1.2)',h:'H-base-v(12,0.48)',r:'v(4,0.16)'}]},
{id:'f10',type:'extrude',name:'Side pocket -Y',plane:'XZ',offset:'W/2',dir:'-',depth:'t*0.55',op:'cut',shapes:[{k:'rect',x:0,y:'(H+base)/2',w:'L-v(30,1.2)',h:'H-base-v(12,0.48)',r:'v(4,0.16)'}]},
{id:'f11',type:'cylinder',name:'Bearing boss -Y',r:'cb/2+v(4.5,0.18)',h:'v(10,0.4)+v(2,0.08)',x:0,y:'-(W/2+v(10,0.4))',z:'brg',axis:'Y'},
{id:'f12',type:'cylinder',name:'Bearing boss +Y',r:'cb/2+v(4.5,0.18)',h:'v(10,0.4)+v(2,0.08)',x:0,y:'W/2-v(2,0.08)',z:'brg',axis:'Y'},
{id:'f13',type:'cylinder',name:'Bearing bore',r:'bore/2',h:'W+v(22,0.88)',x:0,y:'-(W/2+v(11,0.44))',z:'brg',axis:'Y',op:'cut'},
{id:'f14',type:'cylinder',name:'Counterbore -Y',r:'cb/2',h:'cbh+v(2,0.08)',x:0,y:'-(W/2+v(10,0.4)+v(2,0.08))',z:'brg',axis:'Y',op:'cut'},
{id:'f15',type:'cylinder',name:'Counterbore +Y',r:'cb/2',h:'cbh+v(2,0.08)',x:0,y:'W/2+v(10,0.4)-cbh',z:'brg',axis:'Y',op:'cut'},
{id:'f16',type:'hole',name:'Mounting holes',plane:'XY',offset:'base',std:'#10',fit:'tapped',thru:true,pts:[['L/2+flange-v(7,0.28)','W/2+flange-v(7,0.28)'],['-(L/2+flange-v(7,0.28))','W/2+flange-v(7,0.28)'],['L/2+flange-v(7,0.28)','-(W/2+flange-v(7,0.28))'],['-(L/2+flange-v(7,0.28))','-(W/2+flange-v(7,0.28))']]},
{id:'f17',type:'hole',name:'Cover screws',plane:'XY',offset:'H',std:'#8',fit:'tapped',thru:false,depth:'v(12,0.47)',pts:[['L/2-t-v(5.5,0.22)','W/2-t-v(5.5,0.22)'],['-(L/2-t-v(5.5,0.22))','W/2-t-v(5.5,0.22)'],['L/2-t-v(5.5,0.22)','-(W/2-t-v(5.5,0.22))'],['-(L/2-t-v(5.5,0.22))','-(W/2-t-v(5.5,0.22))']]},
{id:'f18',type:'extrude',name:'Cable slot',plane:'XY',offset:'H',dir:'-',depth:'v(18,0.7)',op:'cut',shapes:[{k:'slot',x:'L/2-t/2',y:0,l:'v(16,0.62)',h:'v(8,0.32)',a:90}]},
{id:'f20',type:'chamfer',name:'Base chamfer',d:'v(1,0.04)',edges:{side:'-Z'}},
{id:'f21',type:'box',name:'Bearing rib',w:'rib',d:'W-2*t+v(2,0.08)',h:U(0.55,14),z:'base-v(0.2,0.008)',suppressed:true}]},
sim:u=>({type:'static',mesh:'voxel',res:30000,layers:4,label:'8000 N bearing load',supports:[{faces:{side:'-Z'},type:'fixed'}],loads:[{faces:{by:'pick',pts:[[u==='in'?0.59:15,u==='in'?-1.96:-49.8,u==='in'?1.455:37],[u==='in'?0.59:15,u==='in'?1.96:49.8,u==='in'?1.455:37]]},F:[0,0,-8000],dist:'bearing'}]})},
{key:'arm_link',name:'Arm link',desc:'CNC robot arm link with end bosses, a thin web, lightening pockets, fillets and tapped holes',doc:{name:'Arm link',material:'al6061',params:[P('L',U(8,200),'span'),P('t',U(0.2,5),'web thickness'),P('webh',U(1.05,27),'web height'),P('boss',U(1.5,38),'boss diameter'),P('bore',U(0.669,17),'bearing bore'),P('bossh',U(1.25,32),'boss height'),P('pk',U(0.55,14),'pocket diameter')],features:[
{id:'f1',type:'box',name:'Web',w:'L-boss+v(12,0.48)',d:'t',h:'webh',z:'(bossh-webh)/2'},
{id:'f2',type:'box',name:'Top flange',w:'L-boss+v(12,0.48)',d:'boss*0.55',h:'v(4,0.16)',z:'(bossh-webh)/2+webh-v(4,0.16)'},
{id:'f3',type:'box',name:'Bottom flange',w:'L-boss+v(12,0.48)',d:'boss*0.55',h:'v(4,0.16)',z:'(bossh-webh)/2'},
{id:'f4',type:'cylinder',name:'Left boss',r:'boss/2',h:'bossh',x:'-(L/2-boss/2)'},
{id:'f5',type:'cylinder',name:'Right boss',r:'boss/2',h:'bossh',x:'L/2-boss/2'},
{id:'f6',type:'cylinder',name:'Left bore',r:'bore/2',h:'bossh+v(4,0.16)',x:'-(L/2-boss/2)',z:'-v(2,0.08)',op:'cut'},
{id:'f7',type:'cylinder',name:'Right bore',r:'bore/2',h:'bossh+v(4,0.16)',x:'L/2-boss/2',z:'-v(2,0.08)',op:'cut'},
{id:'f8',type:'extrude',name:'Pocket',plane:'XZ',offset:'-t/2',dir:'+',depth:'t+v(2,0.08)',op:'cut',shapes:[{k:'circle',r:'pk/2',x:'v(-58,-2.3)',y:'bossh/2'}]},
{id:'f9',type:'pattern',name:'Lightening pockets',kind:'linear',of:['f8'],n:5,dx:'v(29.2,1.15)'},
{id:'f10',type:'hole',name:'Left pinch',plane:'YZ',offset:'-(L/2-boss/2)',std:'#8',fit:'tapped',thru:true,pts:[[0,'bossh/2']]},
{id:'f11',type:'hole',name:'Right pinch',plane:'YZ',offset:'L/2-boss/2',std:'#8',fit:'tapped',thru:true,pts:[[0,'bossh/2']]},
{id:'f12',type:'chamfer',name:'Bore chamfers',d:'v(1,0.04)',edges:{type:'CIRCLE',side:'+Z'}}]},
sim:u=>({type:'static',mesh:'voxel',res:30000,layers:4,label:'1500 N tip load',supports:[{faces:{by:'pick',pts:[[u==='in'?-3.25:-82.5,u==='in'?0.335:8.5,u==='in'?0.625:16]]},type:'fixed'}],loads:[{faces:{by:'pick',pts:[[u==='in'?3.25:82.5,u==='in'?0.335:8.5,u==='in'?0.625:16]]},F:[0,0,-1500]}]})},
{key:'sheet_chassis',name:'Electronics chassis',desc:'Bent sheet-metal electronics chassis with flanges, a hem, vent slots, connector cutouts and PEM holes',doc:{name:'Electronics chassis',material:'al5052',params:[P('w',U(9,230),'outside width'),P('d',U(6,150),'outside depth'),P('h',U(2.25,57),'wall height'),P('t',U(0.063,1.6),'sheet thickness'),P('rin',U(0.08,2),'inside bend radius'),P('lip',U(0.35,9),'lid lip'),P('hem',U(0.45,11),'rear hem'),P('pem',U(0.166,4.22),'PEM hole'),P('inset',U(0.16,4),'PEM inset')],features:[
{id:'f1',type:'sheet',name:'Chassis',plane:'XY',shapes:[{k:'rect',w:'w',h:'d'},{k:'circle',x:'w/2-inset',y:'d/2-inset',r:'pem/2',hole:true},{k:'circle',x:'-(w/2-inset)',y:'d/2-inset',r:'pem/2',hole:true},{k:'circle',x:'w/2-inset',y:'-(d/2-inset)',r:'pem/2',hole:true},{k:'circle',x:'-(w/2-inset)',y:'-(d/2-inset)',r:'pem/2',hole:true},{k:'circle',x:'w/2-inset',y:0,r:'pem/2',hole:true},{k:'circle',x:'-(w/2-inset)',y:0,r:'pem/2',hole:true},{k:'slot',x:0,y:'v(20,0.8)',l:'v(28,1.1)',h:'v(5,0.2)',a:0,hole:true},{k:'slot',x:0,y:0,l:'v(28,1.1)',h:'v(5,0.2)',a:0,hole:true},{k:'slot',x:0,y:'v(-20,-0.8)',l:'v(28,1.1)',h:'v(5,0.2)',a:0,hole:true},{k:'slot',x:'v(32,1.25)',y:'v(20,0.8)',l:'v(28,1.1)',h:'v(5,0.2)',a:0,hole:true},{k:'slot',x:'v(-32,-1.25)',y:'v(20,0.8)',l:'v(28,1.1)',h:'v(5,0.2)',a:0,hole:true},{k:'slot',x:'v(32,1.25)',y:'v(-20,-0.8)',l:'v(28,1.1)',h:'v(5,0.2)',a:0,hole:true},{k:'slot',x:'v(-32,-1.25)',y:'v(-20,-0.8)',l:'v(28,1.1)',h:'v(5,0.2)',a:0,hole:true},{k:'rect',x:0,y:'d/2-v(18,0.7)',w:'v(22,0.85)',h:'v(12,0.48)',r:'v(2,0.08)',hole:true}],t:'t',r:'rin',dir:'+',corner:'butt',gap:'v(0.4,0.016)',K:0,flanges:[{edge:'front',len:'h',angle:90,dir:'up',then:[{len:'lip',angle:90}]},{edge:'back',len:'h',angle:90,dir:'up',then:[{len:'hem',angle:180}]},{edge:'left',len:'h',angle:90,dir:'up',then:[{len:'lip',angle:90}]},{edge:'right',len:'h',angle:90,dir:'up',then:[{len:'lip',angle:90}]}]},
{id:'f2',type:'extrude',name:'Connector cutouts',plane:'XZ',offset:'d/2',dir:'-',depth:'t+v(2,0.08)',op:'cut',shapes:[{k:'rect',x:'v(-22,-0.85)',y:'v(16,0.62)',w:'v(18,0.7)',h:'v(10,0.4)',r:'v(1.5,0.06)'},{k:'rect',x:'v(22,0.85)',y:'v(16,0.62)',w:'v(18,0.7)',h:'v(10,0.4)',r:'v(1.5,0.06)'}]}]},
sim:u=>({type:'static',mesh:'voxel',res:8000,layers:4,label:'800 N equipment load',supports:[{faces:{by:'pick',pts:[[u==='in'?4.42:112.3,u==='in'?2.84:72.1,u==='in'?0.031:0.8],[u==='in'?-4.42:-112.3,u==='in'?2.84:72.1,u==='in'?0.031:0.8],[u==='in'?4.42:112.3,u==='in'?-2.84:-72.1,u==='in'?0.031:0.8],[u==='in'?-4.42:-112.3,u==='in'?-2.84:-72.1,u==='in'?0.031:0.8]]},type:'fixed'}],loads:[{faces:{by:'pick',pts:[[u==='in'?2.5:63.5,u==='in'?1.5:38.1,u==='in'?0.063:1.6]]},F:[0,0,-800]}]})},
{key:'sheet_multibend',name:'Multi-bend bracket',desc:'Multi-bend sheet-metal bracket with returns, slots and mounting holes',doc:{name:'Multi-bend bracket',material:'al5052',params:[P('w',U(3.5,90),'width'),P('a',U(1.75,45),'base length'),P('b',U(1.5,38),'rise'),P('c',U(1.25,32),'top length'),P('lip',U(0.22,5.5),'return flange'),P('t',U(0.08,2),'sheet thickness'),P('rin',U(0.1,2.5),'inside bend radius'),P('hole',U(0.201,5.1),u==='in'?'#10 clearance':'M5 clearance')],features:[
{id:'f1',type:'sheet',name:'Bracket',plane:'XY',shapes:[{k:'rect',w:'w',h:'a'},{k:'circle',x:'w/3',y:'v(8,0.32)',r:'hole/2',hole:true},{k:'circle',x:'-w/3',y:'v(8,0.32)',r:'hole/2',hole:true},{k:'slot',x:0,y:'a/2-v(10,0.4)',l:'w*0.45',h:'v(6,0.22)',a:0,hole:true}],t:'t',r:'rin',dir:'+',corner:'open',K:0,flanges:[{edge:'front',len:'b',angle:90,dir:'up',then:[{len:'c',angle:-90},{len:'lip',angle:90}]},{edge:'back',len:'v(12,0.45)',angle:90,dir:'up'}]},
{id:'f2',type:'hole',name:'Upright holes',plane:'face',face:{side:'+Z'},d:'hole',thru:true,pts:[['w/3',0],['-w/3',0]]}]},
sim:u=>({type:'static',mesh:'sweep',res:30000,layers:4,label:'200 N mounted load',supports:[{faces:{side:'-Z'},type:'fixed'}],loads:[{faces:{by:'pick',pts:[[0,u==='in'?-1.46:-37,u==='in'?1.575:40]]},F:[0,0,-200]}]})},

{key:'plate',name:'Mounting plate',desc:'Plate with four corner holes and rounded corners',doc:{name:'Mounting plate',material:'al6061',params:[P('w',U(4,100),'width'),P('d',U(2.5,60),'depth'),P('t',U(0.25,6),'thickness'),P('hole',U(0.281,6.6),u==='in'?'1/4 in screw clearance':'M6 clearance'),P('edge',U(0.4,10),'hole inset'),P('rc',U(0.25,6),'corner radius')],features:[
{id:'f1',type:'box',name:'Plate',w:'w',d:'d',h:'t'},
{id:'f2',type:'fillet',name:'Round corners',r:'rc',edges:{dir:'Z'}},
{id:'f3',type:'hole',name:'Corner holes',plane:'face',face:{side:'+Z'},d:'hole',thru:true,pts:[['w/2-edge','d/2-edge'],['-(w/2-edge)','d/2-edge'],['w/2-edge','-(d/2-edge)'],['-(w/2-edge)','-(d/2-edge)']]},
{id:'f4',type:'chamfer',name:'Top chamfer',d:'v(0.6,0.02)',edges:{side:'+Z'}}]}},
{key:'sheet_enclosure',name:'Sheet-metal enclosure',desc:'Bent sheet-metal box with closed corners, inward lips for a lid and mounting holes, ready to unfold for laser and brake',doc:{name:'Sheet-metal enclosure',material:'al5052',params:[P('w',U(6,150),'outside width'),P('d',U(4,100),'outside depth'),P('h',U(2,50),'outside height'),P('t',U(0.06,1.5),'sheet thickness'),P('rin',U(0.06,1.5),'inside bend radius'),P('lip',U(0.375,10),'lid lip'),P('hole',U(0.177,4.5),u==='in'?'#8 screw clearance':'M4 clearance'),P('inset',U(0.5,12),'hole inset')],features:[
{id:'f1',type:'sheet',name:'Enclosure',plane:'XY',shapes:[{k:'rect',w:'w',h:'d'},{k:'circle',x:'w/2-inset',y:'d/2-inset',r:'hole/2',hole:true},{k:'circle',x:'-(w/2-inset)',y:'d/2-inset',r:'hole/2',hole:true},{k:'circle',x:'w/2-inset',y:'-(d/2-inset)',r:'hole/2',hole:true},{k:'circle',x:'-(w/2-inset)',y:'-(d/2-inset)',r:'hole/2',hole:true}],t:'t',r:'rin',dir:'+',corner:'butt',gap:'v(0.01,0.25)',K:0,flanges:[{edge:'front',len:'h',angle:90,dir:'up',then:[{len:'lip',angle:90}]},{edge:'back',len:'h',angle:90,dir:'up',then:[{len:'lip',angle:90}]},{edge:'left',len:'h',angle:90,dir:'up'},{edge:'right',len:'h',angle:90,dir:'up'}]}]}},
{key:'sheet_zbracket',name:'Sheet-metal Z bracket',desc:'Bent Z bracket with a mounting hole, made with the Sheet metal feature',doc:{name:'Z bracket',material:'steel1018',params:[P('w',U(2,50),'width'),P('a',U(1.5,40),'base leg'),P('b',U(1.25,32),'rise'),P('c',U(1,25),'top leg'),P('t',U(0.075,2),'sheet thickness'),P('rin',U(0.075,2),'inside bend radius'),P('hole',U(0.281,6.6),u==='in'?'1/4 in screw clearance':'M6 clearance')],features:[
{id:'f1',type:'sheet',name:'Z bracket',plane:'XY',shapes:[{k:'rect',w:'w',h:'a'},{k:'circle',x:0,y:'a/7',r:'hole/2',hole:true}],t:'t',r:'rin',dir:'+',corner:'open',K:0,flanges:[{edge:'front',len:'b',angle:90,dir:'up',then:[{len:'c',angle:-90}]}]}]}},
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
].map(t=>{const d=fix(t.doc,(m,i)=>String(u==='in'?i:m));d.units=u;if(typeof t.sim==='function')d.sim=t.sim(u);for(const f of d.features)for(const k in f)if(typeof f[k]==='string'&&/^-?[\d.]+$/.test(f[k])&&!['id','type','name','op','plane','axis','kind','dir'].includes(k))f[k]=+f[k];const {sim:_s,...rest}=t;return{...rest,doc:d};});};
export const TEMPLATES=mk('mm');
export const TEMPLATES_IN=mk('in');
export const templatesFor=u=>u==='in'?TEMPLATES_IN:TEMPLATES;
