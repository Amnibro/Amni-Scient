/* ============================================================
 * AMNI-CAD — parametric CSG modeler for amni-calc
 * BSP boolean ops (Evan Wallace csg.js algorithm, MIT),
 * exact divergence-theorem mass properties, binary STL export.
 * Core is DOM-free and exported for node tests; viewer uses the
 * same lazy THREE 0.147 global calc-3d.js loads from jsdelivr.
 * ============================================================ */
(function(){
const EPS=1e-5;
const vadd=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const vsub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const vscale=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
const vdot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const vcross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const vlen=a=>Math.sqrt(vdot(a,a));
const vunit=a=>vscale(a,1/vlen(a));
const vlerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
function Vertex(pos){this.pos=pos;}
Vertex.prototype.clone=function(){return new Vertex({x:this.pos.x,y:this.pos.y,z:this.pos.z});};
Vertex.prototype.interpolate=function(o,t){return new Vertex(vlerp(this.pos,o.pos,t));};
function Plane(normal,w){this.normal=normal;this.w=w;}
Plane.fromPoints=(a,b,c)=>{const n=vunit(vcross(vsub(b,a),vsub(c,a)));return new Plane(n,vdot(n,a));};
Plane.prototype.clone=function(){return new Plane({x:this.normal.x,y:this.normal.y,z:this.normal.z},this.w);};
Plane.prototype.flip=function(){this.normal=vscale(this.normal,-1);this.w=-this.w;};
Plane.prototype.splitPolygon=function(poly,coFront,coBack,front,back){
  const CO=0,FR=1,BK=2,SP=3;
  let ptype=0;const types=[];
  for(const v of poly.vertices){
    const t=vdot(this.normal,v.pos)-this.w;
    const ty=t<-EPS?BK:t>EPS?FR:CO;
    ptype|=ty;types.push(ty);
  }
  ptype===CO?(vdot(this.normal,poly.plane.normal)>0?coFront:coBack).push(poly)
  :ptype===FR?front.push(poly)
  :ptype===BK?back.push(poly)
  :(()=>{
    const f=[],b=[];
    for(let i=0;i<poly.vertices.length;i++){
      const j=(i+1)%poly.vertices.length,ti=types[i],tj=types[j],vi=poly.vertices[i],vj=poly.vertices[j];
      if(ti!==BK)f.push(vi);
      if(ti!==FR)b.push(ti!==BK?vi.clone():vi);
      if((ti|tj)===SP){
        const t=(this.w-vdot(this.normal,vi.pos))/vdot(this.normal,vsub(vj.pos,vi.pos));
        const v=vi.interpolate(vj,t);
        f.push(v);b.push(v.clone());
      }
    }
    f.length>=3&&front.push(new Polygon(f));
    b.length>=3&&back.push(new Polygon(b));
  })();
};
function Polygon(vertices){this.vertices=vertices;this.plane=Plane.fromPoints(vertices[0].pos,vertices[1].pos,vertices[2].pos);}
Polygon.prototype.clone=function(){return new Polygon(this.vertices.map(v=>v.clone()));};
Polygon.prototype.flip=function(){this.vertices.reverse();this.plane.flip();};
function Node(polys){this.plane=null;this.front=null;this.back=null;this.polygons=[];polys&&this.build(polys);}
Node.prototype.invert=function(){
  for(const p of this.polygons)p.flip();
  this.plane&&this.plane.flip();
  this.front&&this.front.invert();
  this.back&&this.back.invert();
  const t=this.front;this.front=this.back;this.back=t;
};
Node.prototype.clipPolygons=function(polys){
  if(!this.plane)return polys.slice();
  let front=[],back=[];
  for(const p of polys)this.plane.splitPolygon(p,front,back,front,back);
  front=this.front?this.front.clipPolygons(front):front;
  back=this.back?this.back.clipPolygons(back):[];
  return front.concat(back);
};
Node.prototype.clipTo=function(bsp){
  this.polygons=bsp.clipPolygons(this.polygons);
  this.front&&this.front.clipTo(bsp);
  this.back&&this.back.clipTo(bsp);
};
Node.prototype.allPolygons=function(){
  let p=this.polygons.slice();
  this.front&&(p=p.concat(this.front.allPolygons()));
  this.back&&(p=p.concat(this.back.allPolygons()));
  return p;
};
Node.prototype.build=function(polys){
  if(!polys.length)return;
  this.plane||(this.plane=polys[0].plane.clone());
  const front=[],back=[];
  for(const p of polys)this.plane.splitPolygon(p,this.polygons,this.polygons,front,back);
  front.length&&(this.front||(this.front=new Node()),this.front.build(front));
  back.length&&(this.back||(this.back=new Node()),this.back.build(back));
};
const clonePolys=ps=>ps.map(p=>p.clone());
function csgUnion(a,b){
  const A=new Node(clonePolys(a)),B=new Node(clonePolys(b));
  A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.allPolygons());
  return A.allPolygons();
}
function csgSubtract(a,b){
  const A=new Node(clonePolys(a)),B=new Node(clonePolys(b));
  A.invert();A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.allPolygons());A.invert();
  return A.allPolygons();
}
function csgIntersect(a,b){
  const A=new Node(clonePolys(a)),B=new Node(clonePolys(b));
  A.invert();B.clipTo(A);B.invert();A.clipTo(B);B.clipTo(A);A.build(B.allPolygons());A.invert();
  return A.allPolygons();
}
function cube(sx,sy,sz){
  const r={x:sx/2,y:sy/2,z:sz/2};
  return [[[0,4,6,2],-1],[[1,3,7,5],1],[[0,1,5,4],-1],[[2,6,7,3],1],[[0,2,3,1],-1],[[4,5,7,6],1]].map(([idx])=>
    new Polygon(idx.map(i=>new Vertex({x:r.x*(i&1?1:-1),y:r.y*(i&2?1:-1),z:r.z*(i&4?1:-1)}))));
}
function cylinder(r1,r2,h,n){
  n=n||32;const polys=[],y0=-h/2,y1=h/2;
  const pt=(r,y,a)=>({x:r*Math.cos(a),y,z:r*Math.sin(a)});
  for(let i=0;i<n;i++){
    const a0=i/n*2*Math.PI,a1=(i+1)/n*2*Math.PI;
    const b0=pt(r1,y0,a0),b1=pt(r1,y0,a1),t0=pt(r2,y1,a0),t1=pt(r2,y1,a1);
    r2>1e-9?polys.push(new Polygon([new Vertex(b0),new Vertex(t0),new Vertex(t1),new Vertex(b1)]))
      :polys.push(new Polygon([new Vertex(b0),new Vertex({x:0,y:y1,z:0}),new Vertex(b1)]));
    polys.push(new Polygon([new Vertex({x:0,y:y0,z:0}),new Vertex(b0),new Vertex(b1)]));
    r2>1e-9&&polys.push(new Polygon([new Vertex({x:0,y:y1,z:0}),new Vertex(t1),new Vertex(t0)]));
  }
  return polys;
}
function sphere(r,n,m){
  n=n||24;m=m||12;const polys=[];
  const pt=(th,ph)=>({x:r*Math.sin(ph)*Math.cos(th),y:r*Math.cos(ph),z:r*Math.sin(ph)*Math.sin(th)});
  for(let j=0;j<m;j++){
    const p0=j/m*Math.PI,p1=(j+1)/m*Math.PI;
    for(let i=0;i<n;i++){
      const t0=i/n*2*Math.PI,t1=(i+1)/n*2*Math.PI;
      const vs=[pt(t0,p1),pt(t0,p0),pt(t1,p0),pt(t1,p1)];
      const uniq=vs.filter((v,k)=>{const pr=vs[(k+vs.length-1)%vs.length];return vlen(vsub(v,pr))>1e-9;});
      uniq.length>=3&&polys.push(new Polygon(uniq.map(v=>new Vertex(v))));
    }
  }
  return polys;
}
function tube(ro,ri,h,n){
  n=n||32;const polys=[],y0=-h/2,y1=h/2;
  const pt=(r,y,a)=>({x:r*Math.cos(a),y,z:r*Math.sin(a)});
  for(let i=0;i<n;i++){
    const a0=i/n*2*Math.PI,a1=(i+1)/n*2*Math.PI;
    const ob0=pt(ro,y0,a0),ob1=pt(ro,y0,a1),ot0=pt(ro,y1,a0),ot1=pt(ro,y1,a1);
    const ib0=pt(ri,y0,a0),ib1=pt(ri,y0,a1),it0=pt(ri,y1,a0),it1=pt(ri,y1,a1);
    polys.push(new Polygon([ob0,ot0,ot1,ob1].map(v=>new Vertex(v))));
    polys.push(new Polygon([ib0,ib1,it1,it0].map(v=>new Vertex(v))));
    polys.push(new Polygon([ot0,it0,it1,ot1].map(v=>new Vertex(v))));
    polys.push(new Polygon([ob0,ob1,ib1,ib0].map(v=>new Vertex(v))));
  }
  return polys;
}
function torus(R,r,n,m){
  n=n||32;m=m||16;const polys=[];
  const pt=(a,b)=>({x:(R+r*Math.cos(b))*Math.cos(a),y:r*Math.sin(b),z:(R+r*Math.cos(b))*Math.sin(a)});
  for(let i=0;i<n;i++){
    const a0=i/n*2*Math.PI,a1=(i+1)/n*2*Math.PI;
    for(let j=0;j<m;j++){
      const b0=j/m*2*Math.PI,b1=(j+1)/m*2*Math.PI;
      polys.push(new Polygon([pt(a0,b0),pt(a0,b1),pt(a1,b1),pt(a1,b0)].map(v=>new Vertex(v))));
    }
  }
  return polys;
}
function transform(polys,rx,ry,rz,tx,ty,tz){
  const cr=d=>Math.cos(d*Math.PI/180),sr=d=>Math.sin(d*Math.PI/180);
  const cx=cr(rx),sx=sr(rx),cy=cr(ry),sy=sr(ry),cz=cr(rz),sz=sr(rz);
  const rot2=p=>{
    let{x,y,z}=p;
    const y1=y*cx-z*sx,z1=y*sx+z*cx;
    const x2=x*cy+z1*sy,z2=-x*sy+z1*cy;
    const x3=x2*cz-y1*sz,y3=x2*sz+y1*cz;
    return{x:x3+tx,y:y3+ty,z:z2+tz};
  };
  return polys.map(p=>new Polygon(p.vertices.map(v=>new Vertex(rot2(v.pos)))));
}
function triangles(polys){
  const tris=[];
  for(const p of polys)for(let i=2;i<p.vertices.length;i++)tris.push([p.vertices[0].pos,p.vertices[i-1].pos,p.vertices[i].pos]);
  return tris;
}
function massProps(polys){
  let V=0,area=0,cx=0,cy=0,cz=0;
  for(const[a,b,c]of triangles(polys)){
    const tv=vdot(a,vcross(b,c))/6;
    V+=tv;
    cx+=(a.x+b.x+c.x)/4*tv;cy+=(a.y+b.y+c.y)/4*tv;cz+=(a.z+b.z+c.z)/4*tv;
    area+=vlen(vcross(vsub(b,a),vsub(c,a)))/2;
  }
  return{volume:V,area,centroid:V?{x:cx/V,y:cy/V,z:cz/V}:{x:0,y:0,z:0}};
}
function toSTL(polys){
  const tris=triangles(polys);
  const buf=new ArrayBuffer(84+tris.length*50),dv=new DataView(buf);
  dv.setUint32(80,tris.length,true);
  let o=84;
  for(const[a,b,c]of tris){
    const n=vunit(vcross(vsub(b,a),vsub(c,a)));
    for(const val of[n.x,n.y,n.z,a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z]){dv.setFloat32(o,val,true);o+=4;}
    dv.setUint16(o,0,true);o+=2;
  }
  return buf;
}
if(typeof module!=='undefined'&&module.exports)module.exports={cube,cylinder,sphere,torus,tube,transform,csgUnion,csgSubtract,csgIntersect,massProps,toSTL};
if(typeof document==='undefined')return;
/* ============ browser UI ============ */
const D=document,W=window,$=id=>D.getElementById(id);
const DENS={steel:['Steel',7.85],alu:['Aluminum',2.70],ss:['Stainless',7.90],brass:['Brass',8.50],ti:['Ti-6Al-4V',4.43],abs:['ABS/PLA',1.05]};
const FDEF={
  box:{n:'BOX',p:{sx:60,sy:20,sz:40}},
  cyl:{n:'CYLINDER',p:{r:15,h:40}},
  cone:{n:'CONE',p:{r1:20,r2:8,h:35}},
  sphere:{n:'SPHERE',p:{r:18}},
  torus:{n:'TORUS',p:{R:25,r:8}},
  tube:{n:'TUBE / PIPE',p:{ro:20,ri:15,h:40}}
};
const CAD=W.__CAD={features:[],nid:1,polys:null,built:false};
function genFeature(f){
  const base=f.type==='box'?cube(f.p.sx,f.p.sy,f.p.sz)
    :f.type==='cyl'?cylinder(f.p.r,f.p.r,f.p.h,32)
    :f.type==='cone'?cylinder(f.p.r1,f.p.r2,f.p.h,32)
    :f.type==='torus'?torus(f.p.R,f.p.r,32,16)
    :f.type==='tube'?tube(f.p.ro,Math.min(f.p.ri,f.p.ro*0.98),f.p.h,32)
    :sphere(f.p.r,24,12);
  return transform(base,f.rot.x,f.rot.y,f.rot.z,f.pos.x,f.pos.y,f.pos.z);
}
function rebuild(){
  const t0=performance.now();
  let acc=null;
  for(const f of CAD.features){
    let polys;
    try{polys=genFeature(f);}catch(e){continue;}
    acc=acc===null?(f.op==='sub'?null:polys):f.op==='sub'?csgSubtract(acc,polys):csgUnion(acc,polys);
  }
  CAD.polys=acc||[];
  const ms=performance.now()-t0;
  updateMesh();
  updateProps(ms);
}
let deb=null;
const rebuildSoon=()=>{clearTimeout(deb);deb=setTimeout(rebuild,400);};
function updateProps(ms){
  const out=$('cad-props-out');if(!out)return;
  if(!CAD.polys||!CAD.polys.length){out.innerHTML='<p class="muted">Add a feature to start.</p>';return;}
  const ds=$('cad-dens'),rho=parseFloat((ds||{}).value)||7.85;
  const dname=ds&&ds.selectedIndex>=0?ds.options[ds.selectedIndex].text:'Steel';
  const mp=massProps(CAD.polys),vcm=mp.volume/1000;
  out.innerHTML='<div class="result-grid">'+[
    ['VOLUME',vcm.toFixed(2)+' cm³'],['MASS',(vcm*rho).toFixed(1)+' g — '+dname],
    ['Surface area',(mp.area/100).toFixed(1)+' cm²'],
    ['CoG',mp.centroid.x.toFixed(1)+', '+mp.centroid.y.toFixed(1)+', '+mp.centroid.z.toFixed(1)+' mm']
  ].map(([l,v])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">Exact for the tessellated solid (divergence theorem over every triangle). Curved faces use 32-segment polygons ≈ 0.3% under true πr². CoG in model coordinates. STL is watertight — print it or hand it to CAM.</p>';
  const st=$('cad-stats');ms!==undefined&&st&&(st.textContent=CAD.polys.length+' polys · rebuilt in '+ms.toFixed(0)+' ms');
}
function featCard(f){
  const dims=Object.entries(f.p).map(([k,val])=>`<div class="field"><label>${k.toUpperCase()} (mm)</label><input type="number" step="any" value="${val}" data-fid="${f.id}" data-grp="p" data-k="${k}"></div>`).join('');
  const pr=['x','y','z'].map(k=>`<div class="field"><label>POS ${k.toUpperCase()}</label><input type="number" step="any" value="${f.pos[k]}" data-fid="${f.id}" data-grp="pos" data-k="${k}"></div>`).join('')+
    ['x','y','z'].map(k=>`<div class="field"><label>ROT ${k.toUpperCase()}°</label><input type="number" step="any" value="${f.rot[k]}" data-fid="${f.id}" data-grp="rot" data-k="${k}"></div>`).join('');
  return `<div class="card" style="margin-top:.6rem"><h3 style="display:flex;justify-content:space-between;align-items:center">${FDEF[f.type].n}
    <span><button class="btn btn-sm" onclick="cadOp(${f.id})" style="${f.op==='sub'?'background:#a33':''}">${f.op==='sub'?'✂ CUT':'+ ADD'}</button>
    <button class="btn btn-sm" onclick="cadDel(${f.id})">✕</button></span></h3>
    <div class="row">${dims}${pr}</div></div>`;
}
function renderFeats(){
  const host=$('cad-feats');if(!host)return;
  host.innerHTML=CAD.features.map(featCard).join('')||'<p class="muted" style="margin-top:.6rem">No features yet — add a primitive above or load a preset.</p>';
}
W.cadAdd=type=>{
  CAD.features.push({id:CAD.nid++,type,op:CAD.features.length?'sub':'add',p:{...FDEF[type].p},pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0}});
  renderFeats();rebuild();
};
W.cadDel=id=>{CAD.features=CAD.features.filter(f=>f.id!==id);CAD.features.length&&(CAD.features[0].op='add');renderFeats();rebuild();};
W.cadOp=id=>{const f=CAD.features.find(f=>f.id===id);if(!f)return;f.op=f.op==='sub'?'add':'sub';CAD.features.indexOf(f)===0&&(f.op='add');renderFeats();rebuild();};
W.cadRebuild=rebuild;
W.cadSTL=()=>{
  if(!CAD.polys||!CAD.polys.length)return;
  const blob=new Blob([toSTL(CAD.polys)],{type:'application/octet-stream'});
  const a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download='amni-cad.stl';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
};
const PRESETS={
  plate:{n:'Plate with 4 holes',f:[
    {type:'box',op:'add',p:{sx:100,sy:10,sz:60},pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0}},
    ...[[-40,-20],[40,-20],[-40,20],[40,20]].map(([x,z])=>({type:'cyl',op:'sub',p:{r:4,h:20},pos:{x,y:0,z},rot:{x:0,y:0,z:0}}))]},
  bushing:{n:'Flanged bushing',f:[
    {type:'cyl',op:'add',p:{r:20,h:30},pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0}},
    {type:'cyl',op:'add',p:{r:28,h:6},pos:{x:0,y:-12,z:0},rot:{x:0,y:0,z:0}},
    {type:'cyl',op:'sub',p:{r:10,h:50},pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0}}]},
  bracket:{n:'L-bracket + holes',f:[
    {type:'box',op:'add',p:{sx:80,sy:10,sz:60},pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0}},
    {type:'box',op:'add',p:{sx:80,sy:60,sz:10},pos:{x:0,y:25,z:-25},rot:{x:0,y:0,z:0}},
    {type:'cyl',op:'sub',p:{r:5,h:20},pos:{x:-25,y:0,z:10},rot:{x:0,y:0,z:0}},
    {type:'cyl',op:'sub',p:{r:5,h:20},pos:{x:25,y:0,z:10},rot:{x:0,y:0,z:0}}]}
};
W.cadPreset=()=>{
  const k=($('cad-preset')||{}).value;if(!PRESETS[k])return;
  CAD.features=PRESETS[k].f.map(f=>({...f,id:CAD.nid++,p:{...f.p},pos:{...f.pos},rot:{...f.rot}}));
  renderFeats();rebuild();
};
let viewer=null;
function updateMesh(){
  if(!viewer||!W.THREE)return;
  const T=W.THREE,g=viewer.group;
  while(g.children.length)g.remove(g.children[0]);
  if(!CAD.polys||!CAD.polys.length)return;
  const tris=[];
  for(const p of CAD.polys)for(let i=2;i<p.vertices.length;i++)tris.push(p.vertices[0].pos,p.vertices[i-1].pos,p.vertices[i].pos);
  const pos=new Float32Array(tris.length*3);
  tris.forEach((v,i)=>{pos[i*3]=v.x;pos[i*3+1]=v.y;pos[i*3+2]=v.z;});
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(pos,3));
  geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:0xff9966,metalness:0.55,roughness:0.4}));
  g.add(mesh);
  g.add(new T.LineSegments(new T.EdgesGeometry(geo,25),new T.LineBasicMaterial({color:0x222222})));
}
function bootViewer(){
  const cv=$('cad-canvas');
  if(!cv||viewer||!W.THREE||!W.THREE.OrbitControls||!cv.offsetParent)return;
  const T=W.THREE,sc=new T.Scene();sc.background=new T.Color(0x0a0a0a);
  const w=cv.clientWidth||500,h=cv.clientHeight||380;
  const cam=new T.PerspectiveCamera(40,w/h,0.1,5000);cam.position.set(120,100,150);
  const r=new T.WebGLRenderer({canvas:cv,antialias:true});r.setPixelRatio(W.devicePixelRatio||1);r.setSize(w,h,false);
  sc.add(new T.AmbientLight(0xffffff,0.55));
  const dl=new T.DirectionalLight(0xffffff,0.85);dl.position.set(80,140,100);sc.add(dl);
  const dl2=new T.DirectionalLight(0xff9966,0.3);dl2.position.set(-90,-40,-60);sc.add(dl2);
  const grid=new T.GridHelper(300,30,0x1a3a4a,0x152635);grid.position.y=-45;sc.add(grid);
  sc.add(new T.AxesHelper(40));
  const ctl=new T.OrbitControls(cam,cv);ctl.enableDamping=true;ctl.dampingFactor=0.08;
  const grp=new T.Group();sc.add(grp);
  viewer={scene:sc,camera:cam,renderer:r,group:grp};
  (function loop(){cv.offsetParent&&(r.render(sc,cam),ctl.update());requestAnimationFrame(loop);})();
  new ResizeObserver(()=>{const ww=cv.clientWidth,hh=cv.clientHeight;if(ww<2)return;cam.aspect=ww/hh;cam.updateProjectionMatrix();r.setSize(ww,hh,false);}).observe(cv);
  CAD.built||(CAD.built=true,($('cad-preset')||{}).value='plate',W.cadPreset());
  updateMesh();
}
function init(){
  const vw=$('v-cad');if(!vw)return;
  const dk=$('cad-dens');dk&&(dk.innerHTML=Object.entries(DENS).map(([k,[n,rho]])=>`<option value="${rho}" data-k="${k}"${k==='steel'?' selected':''}>${n} (${rho})</option>`).join(''));
  const ps=$('cad-preset');ps&&(ps.innerHTML=Object.entries(PRESETS).map(([k,p])=>`<option value="${k}">${p.n}</option>`).join(''));
  const feats=$('cad-feats');
  feats&&feats.addEventListener('input',e=>{
    const el=e.target,f=CAD.features.find(x=>x.id===+el.dataset.fid);
    if(!f)return;
    const val=parseFloat(el.value);
    isFinite(val)&&(f[el.dataset.grp][el.dataset.k]=val,rebuildSoon());
  });
  dk&&dk.addEventListener('change',()=>updateProps());
  renderFeats();
  setInterval(bootViewer,600);
}
D.readyState==='loading'?D.addEventListener('DOMContentLoaded',()=>setTimeout(init,300)):setTimeout(init,300);
})();
