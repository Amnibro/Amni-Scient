import {css} from './coreui.js';
const KIND={face:'Face',edge:'Edge',point:'Point',solid:'Solid',body:'Body'};
export function install(API){
  const{h,S,units:UN}=API,$=s=>document.querySelector(s),M={on:false,mode:'auto',items:[],res:null,err:'',g:null,seq:0};S.measure=M;
  const L=v=>UN.lenDual(v,S.doc),Lo=v=>UN.lenOne(v,S.doc),a3=v=>'('+v.map(x=>UN.nf(x,4)).join(', ')+')',deg=v=>UN.nf(v,3)+'°';
  const refOf=it=>it.point?{point:it.point}:it.face!=null?{face:it.face}:{edge:it.edge};
  const sync=()=>{S.sel.faces.clear();S.sel.edges.clear();for(const it of M.items){it.face!=null&&S.sel.faces.set(it.face,it.pt);it.edge!=null&&S.sel.edges.set(it.edge,it.pt);}API.refreshSel();};
  const clearG=()=>{if(M.g){API.model.remove(M.g);M.g.traverse(o=>{o.geometry&&o.geometry.dispose();o.material&&(o.material.map&&o.material.map.dispose(),o.material.dispose());});M.g=null;}};
  const draw=r=>{
    clearG();if(!r||!r.closest_a||!S.mesh)return;const T=API.THREE,b=S.mesh.props.bbox,sz=Math.hypot(b.max[0]-b.min[0],b.max[1]-b.min[1],b.max[2]-b.min[2])||1,g=new T.Group(),A=new T.Vector3(...r.closest_a),B=new T.Vector3(...r.closest_b);
    const ln=new T.Line(new T.BufferGeometry().setFromPoints([A,B]),new T.LineBasicMaterial({color:0xffb454,depthTest:false,transparent:true}));ln.renderOrder=12;g.add(ln);
    for(const p of[A,B]){const m=new T.Mesh(new T.SphereGeometry(sz*0.008,14,10),new T.MeshBasicMaterial({color:0xffb454,depthTest:false}));m.position.copy(p);m.renderOrder=13;g.add(m);}
    const cv=document.createElement('canvas');cv.width=256;cv.height=64;const x=cv.getContext('2d');x.font='700 30px system-ui,sans-serif';x.fillStyle='#ffb454';x.textBaseline='middle';x.fillText(UN.nf(r.min_distance,4)+' '+UN.docUnits(S.doc),7,32);const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),depthTest:false,transparent:true}));sp.scale.set(sz*0.3,sz*0.075,1);sp.center.set(0,0);sp.position.copy(A.clone().add(B).multiplyScalar(0.5));sp.renderOrder=14;g.add(sp);
    API.model.add(g);M.g=g;
  };
  const compute=async()=>{
    const my=++M.seq;M.res=null;M.err='';
    if(M.items.length){try{const r=await API.plugin('./measure.js','run',{a:refOf(M.items[0]),b:M.items[1]?refOf(M.items[1]):undefined});if(my!==M.seq)return;M.res=r;}catch(e){if(my!==M.seq)return;M.err=String(e&&e.message||e);}}
    draw(M.res);panel();
  };
  const rows=r=>{
    const o=[],kv=(k,v)=>o.push(h('span',null,k),h('span',null,v)),i=r.a;
    if(!r.b){
      kv('Type',(i.kind==='face'||i.kind==='edge'?i.type+' '+i.kind:i.kind));
      i.area!=null&&kv('Area',UN.dual('area',UN.areaMM2(i.area,S.doc)));i.perimeter!=null&&kv('Boundary length',L(i.perimeter));i.length!=null&&kv('Length',L(i.length));i.volume!=null&&kv('Volume',UN.dual('vol',UN.volMM3(i.volume,S.doc)));
      i.radius!=null&&kv('Radius',L(i.radius));i.diameter!=null&&kv('Diameter',L(i.diameter));i.normal&&kv('Normal',a3(i.normal));i.axis&&kv('Axis',a3(i.axis));i.direction&&kv('Direction',a3(i.direction));i.center&&kv('Center',a3(i.center));i.center_of_mass&&kv('Center of mass',a3(i.center_of_mass));i.size&&kv('Size',i.size.map(v=>UN.nf(v,3)).join(' × ')+' '+UN.docUnits(S.doc));i.start&&kv('From',a3(i.start));i.end&&kv('To',a3(i.end));i.point&&kv('Position',a3(i.point));
      return o;
    }
    kv('Minimum distance',L(r.min_distance));kv('ΔX ΔY ΔZ',r.delta.map(v=>UN.nf(v,4)).join(', ')+' '+UN.docUnits(S.doc));
    r.center_distance!=null&&kv('Center to center',L(r.center_distance));r.angle_deg!=null&&kv('Angle',deg(r.angle_deg)+(r.normals_angle_deg!=null?' (normals '+deg(r.normals_angle_deg)+')':''));r.parallel&&kv('Parallel','yes'+(r.gap!=null?', gap '+L(r.gap):''));
    for(const[k,q]of[['A',r.a],['B',r.b]]){q.radius!=null&&kv(k+' radius',L(q.radius));q.area!=null&&kv(k+' area',UN.dual('area',UN.areaMM2(q.area,S.doc)));q.length!=null&&kv(k+' length',L(q.length));}
    return o;
  };
  const panel=()=>{
    let el=$('#measurep');if(!M.on){el&&el.remove();return;}css();
    const nel=h('div',{id:'measurep',class:'measurep',role:'group','aria-label':'Measure'},
      h('div',{class:'row',style:'align-items:center;gap:7px;margin-bottom:7px'},h('b',null,'Measure'),h('div',{class:'seg',style:'margin-left:auto'},...[['auto','Face / edge'],['point','Point']].map(([k,t])=>h('button',{class:M.mode===k?'on':'',onclick:()=>{M.mode=k;panel();}},t))),h('button',{class:'x',title:'Clear',onclick:()=>{M.items=[];sync();compute();}},'↺'),h('button',{class:'x',title:'Close','aria-label':'Close measure',onclick:()=>toggle(false)},'×')),
      ...M.items.map((it,i)=>h('div',{class:'row mi'},h('span',{class:'mut'},'AB'[i]+': '),h('span',null,KIND[it.face!=null?'face':it.edge!=null?'edge':'point']+(it.point?' '+a3(it.point.map(v=>+v.toFixed(3))):' #'+(it.face!=null?it.face:it.edge))),h('button',{class:'x',title:'Remove','aria-label':'Remove',onclick:()=>{M.items.splice(i,1);sync();compute();}},'×'))),
      M.err?h('div',{class:'alert warn'},M.err):M.res?h('div',{class:'kv'},...rows(M.res)):h('div',{class:'note'},M.mode==='point'?'Click points on the part; edge ends and midpoints snap. Pick two to get the distance.':'Click a face or an edge, then another to measure the distance and angle between them. Click one for its size, radius or area.'),
      h('div',{class:'note',style:'margin-top:7px'},'Esc exits measure.'));
    el?el.replaceWith(nel):$('#vp').append(nel);
  };
  const snap=hh=>{const m=S.mesh;if(hh.kind==='edge'&&m&&m.edges[hh.id]){const q=m.edges[hh.id],P=hh.pt,c=[q.a,q.b,q.m].map(p=>[Math.hypot(p[0]-P[0],p[1]-P[1],p[2]-P[2]),p]).sort((x,y)=>x[0]-y[0])[0];if(c[0]<q.len*0.15+1e-9)return c[1].map(v=>+v.toFixed(7));}return hh.pt.map(v=>+v.toFixed(7));};
  M.click=hh=>{
    if(!hh)return;const it=M.mode==='point'?{point:snap(hh)}:hh.kind==='face'?{face:hh.id,pt:hh.pt}:{edge:hh.id,pt:hh.pt};
    M.items=M.items.length>=2?[it]:[...M.items,it];sync();compute();
  };
  function toggle(on){
    M.on=on===undefined?!M.on:!!on;$('#b-meas')&&$('#b-meas').classList.toggle('on',M.on);if(!M.on){M.items=[];M.res=null;M.err='';sync();clearG();panel();return;}
    S.pick&&API.endPick&&API.endPick(true);panel();API.toast&&API.toast('Measure: click a face, an edge or (Point mode) a spot on the part',3000);
  }
  M.toggle=toggle;M.reset=()=>{if(M.on&&M.items.length){M.items=[];M.res=null;M.err='';clearG();panel();}};
  const bt=h('button',{id:'b-meas',title:'Measure distances, angles, radii and areas',onclick:()=>toggle()},'Measure'),g=$('#g-sec');g&&g.prepend(bt);
  addEventListener('keydown',e=>{if(M.on&&e.key==='Escape'&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')){toggle(false);}},true);
  API.measure=M;
}
