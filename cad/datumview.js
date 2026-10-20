const COL=0x59b6ff,AX=0xffb454,PT=0xff7a59;
function tag(T,text,col,size){const cv=document.createElement('canvas'),x=cv.getContext('2d');cv.width=256;cv.height=64;x.font='600 28px system-ui,sans-serif';x.fillStyle='#'+col.toString(16).padStart(6,'0');x.textBaseline='middle';x.fillText(String(text).slice(0,16),6,32);const tx=new T.CanvasTexture(cv),sp=new T.Sprite(new T.SpriteMaterial({map:tx,depthTest:false,transparent:true}));sp.scale.set(size*0.5,size*0.125,1);sp.center.set(0,0.5);sp.renderOrder=11;return sp;}
export function show({THREE:T,model,bbox,list,names,units,prev}){
  if(prev){model.remove(prev);prev.traverse(o=>{o.geometry&&o.geometry.dispose();if(o.material){o.material.map&&o.material.map.dispose();o.material.dispose();}});}
  if(!list||!list.length)return null;
  const g=new T.Group(),b=bbox||{min:[-1,-1,-1].map(v=>v*(units==='in'?1:25)),max:[1,1,1].map(v=>v*(units==='in'?1:25))},c=[0,1,2].map(i=>(b.min[i]+b.max[i])/2),r=Math.max(Math.hypot(b.max[0]-b.min[0],b.max[1]-b.min[1],b.max[2]-b.min[2])/2,1e-7),V=a=>new T.Vector3(...a),dot=(a,u)=>a[0]*u[0]+a[1]*u[1]+a[2]*u[2];
  for(const d of list){
    const nm=names[d.id]||d.id;
    if(d.kind==='plane'){
      const n=d.n,x=d.x,y=[n[1]*x[2]-n[2]*x[1],n[2]*x[0]-n[0]*x[2],n[0]*x[1]-n[1]*x[0]],k=dot([c[0]-d.o[0],c[1]-d.o[1],c[2]-d.o[2]],n),m=[0,1,2].map(i=>c[i]-n[i]*k),s=r*1.25,P=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[0,1,2].map(i=>m[i]+x[i]*u*s+y[i]*v*s));
      const geo=new T.BufferGeometry().setFromPoints([P[0],P[1],P[2],P[0],P[2],P[3]].map(V)),mesh=new T.Mesh(geo,new T.MeshBasicMaterial({color:COL,transparent:true,opacity:0.1,side:T.DoubleSide,depthWrite:false}));mesh.renderOrder=3;
      const ln=new T.LineLoop(new T.BufferGeometry().setFromPoints(P.map(V)),new T.LineBasicMaterial({color:COL,transparent:true,opacity:0.85}));ln.renderOrder=4;
      const tg=tag(T,nm,COL,s);tg.position.set(...P[3]);g.add(mesh,ln,tg);
    }else if(d.kind==='axis'){
      const u=d.d,k=dot([c[0]-d.p[0],c[1]-d.p[1],c[2]-d.p[2]],u),m=[0,1,2].map(i=>d.p[i]+u[i]*k),L=r*1.4,A=[0,1,2].map(i=>m[i]-u[i]*L),B2=[0,1,2].map(i=>m[i]+u[i]*L);
      const ln=new T.Line(new T.BufferGeometry().setFromPoints([V(A),V(B2)]),new T.LineBasicMaterial({color:AX,transparent:true,opacity:0.95}));ln.renderOrder=4;
      const tg=tag(T,nm,AX,r);tg.position.set(...B2);g.add(ln,tg);
    }else if(d.kind==='point'){
      const s=r*0.05,pts=[];for(const a of[[1,0,0],[0,1,0],[0,0,1]])pts.push(V([0,1,2].map(i=>d.p[i]-a[i]*s)),V([0,1,2].map(i=>d.p[i]+a[i]*s)));
      const ln=new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:PT,depthTest:false}));ln.renderOrder=11;
      const tg=tag(T,nm,PT,r*0.5);tg.position.set(...[0,1,2].map(i=>d.p[i]+s));g.add(ln,tg);
    }
  }
  model.add(g);return g;
}
