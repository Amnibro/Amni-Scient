import {recipeFor,RECIPES} from './recipes.js';
const TILES=[['iso','ISO'],['top','TOP x→ y↑'],['front','FRONT x→ z↑'],['right','RIGHT y→ z↑']],BG='#eef1f5',r2=v=>+(+v).toFixed(3),r4=v=>+(+v).toFixed(4),sleep=t=>new Promise(r=>setTimeout(r,t)),MAXR=3;
export const MAX_ROUNDS=MAXR;
export function inside(m){
  const P=m.pos,I=m.idx,n=I.length/3;let x0=1e30,y0=1e30,x1=-1e30,y1=-1e30;
  for(let i=0;i<P.length;i+=3){x0=Math.min(x0,P[i]);x1=Math.max(x1,P[i]);y0=Math.min(y0,P[i+1]);y1=Math.max(y1,P[i+1]);}
  const G=Math.max(8,Math.min(128,Math.round(Math.sqrt(n)/2))),sx=G/Math.max(x1-x0,1e-9),sy=G/Math.max(y1-y0,1e-9),B=Array.from({length:G*G},()=>[]),cl=(v,k)=>Math.max(0,Math.min(G-1,Math.floor(v*k)));
  for(let t=0;t<n;t++){const a=I[3*t]*3,b=I[3*t+1]*3,c=I[3*t+2]*3,xa=Math.min(P[a],P[b],P[c]),xb=Math.max(P[a],P[b],P[c]),ya=Math.min(P[a+1],P[b+1],P[c+1]),yb=Math.max(P[a+1],P[b+1],P[c+1]);for(let i=cl(xa-x0,sx);i<=cl(xb-x0,sx);i++)for(let j=cl(ya-y0,sy);j<=cl(yb-y0,sy);j++)B[i*G+j].push(t);}
  const S0=Math.max(x1-x0,y1-y0,1e-9),jx=1.2345e-7*S0,jy=2.3456e-7*S0;
  return(x,y,z)=>{
    x+=jx;y+=jy;
    if(x<x0||x>x1||y<y0||y>y1)return false;
    let k=0;
    for(const t of B[cl(x-x0,sx)*G+cl(y-y0,sy)]){
      const a=I[3*t]*3,b=I[3*t+1]*3,c=I[3*t+2]*3,ax=P[a],ay=P[a+1],bx=P[b],by=P[b+1],cx=P[c],cy=P[c+1],d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
      if(Math.abs(d)<1e-14)continue;
      const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/d,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/d,w=1-u-v;
      if(u<0||v<0||w<0)continue;
      P[a+2]*u+P[b+2]*v+P[c+2]*w>z&&k++;
    }
    return k%2===1;
  };
}
export function ringRuns(mesh,o={}){
  const f=o.inside||inside(mesh),n=o.n||720,r=o.r,z=o.z,cx=o.cx||0,cy=o.cy||0,s=Array.from({length:n},(_,i)=>f(cx+r*Math.cos(2*Math.PI*(i+0.37)/n),cy+r*Math.sin(2*Math.PI*(i+0.37)/n),z+1e-7)),k=s.filter((v,i)=>v&&!s[(i+n-1)%n]).length;
  return{runs:s.every(Boolean)?0:k,solid:s.filter(Boolean).length/n,all:s.every(Boolean)};
}
export function pieces(m){
  const P=m.pos,I=m.idx,nv=P.length/3,bb=m.props.bbox,q=1e-5*Math.max(1e-9,Math.hypot(bb.max[0]-bb.min[0],bb.max[1]-bb.min[1],bb.max[2]-bb.min[2])),H=new Map(),V=new Int32Array(nv);
  for(let i=0;i<nv;i++){const k=Math.round(P[i*3]/q)+','+Math.round(P[i*3+1]/q)+','+Math.round(P[i*3+2]/q);let h=H.get(k);h===undefined&&H.set(k,h=H.size);V[i]=h;}
  const par=Int32Array.from({length:H.size},(_,i)=>i),fd=a=>{while(par[a]!==a){par[a]=par[par[a]];a=par[a];}return a;},C=new Map();
  for(let t=0;t<I.length;t+=3){const a=fd(V[I[t]]);for(let j=1;j<3;j++){const b=fd(V[I[t+j]]);b!==a&&(par[b]=a);}}
  for(let t=0;t<I.length;t+=3){
    const r=fd(V[I[t]]),[a,b,c]=[0,1,2].map(j=>I[t+j]*3);let o=C.get(r);o||C.set(r,o={min:[1e30,1e30,1e30],max:[-1e30,-1e30,-1e30],vol:0});
    for(const x of[a,b,c])for(let k=0;k<3;k++){o.min[k]=Math.min(o.min[k],P[x+k]);o.max[k]=Math.max(o.max[k],P[x+k]);}
    o.vol+=(P[a]*(P[b+1]*P[c+2]-P[b+2]*P[c+1])-P[a+1]*(P[b]*P[c+2]-P[b+2]*P[c])+P[a+2]*(P[b]*P[c+1]-P[b+1]*P[c]))/6;
  }
  return[...C.values()].map(o=>({volume:Math.abs(o.vol),min:o.min,max:o.max})).sort((a,b)=>b.volume-a.volume);
}
export function report(API){
  const S=API.S,m=S.mesh,u=S.doc.units==='in'?'in':'mm',K=u==='in'?25.4:1,mat=API.MATS[S.doc.material]||API.MATS.al6061,fe=id=>(S.doc.features.find(f=>f.id===id)||{}).name,w=S.warnings||[],noop=w.filter(e=>/changed nothing/.test(e.msg)),o={units:u,material:S.doc.material,features:S.doc.features.length,errors:S.errors.map(e=>({id:e.id,name:e.name||fe(e.id),msg:e.msg})),changed_nothing:noop.map(e=>({id:e.id,name:e.name||fe(e.id),msg:e.msg})),warnings:w.filter(e=>!/changed nothing/.test(e.msg)).map(e=>e.msg),param_errors:S.paramErrors&&Object.keys(S.paramErrors).length?S.paramErrors:undefined};
  if(!m)return{...o,empty:true,solids:0,volume:0};
  const b=m.props.bbox,sz=[0,1,2].map(i=>r4(b.max[i]-b.min[i])),vmm=m.props.volume*K**3,ns=m.props.nSolids;
  Object.assign(o,{bbox:{min:b.min.map(r4),max:b.max.map(r4)},size:sz,volume:r4(m.props.volume),volume_mm3:r2(vmm),mass_g:r2(vmm*mat.rho*1e-6),mass_lb:r4(vmm*mat.rho*1e-9*2.2046226),solids:ns,faces:m.props.nFaces});
  if(ns>1){const p=pieces(m),tot=p.reduce((a,x)=>a+x.volume,0)||1;o.pieces=p.slice(0,7).map((x,i)=>({n:i+1,volume_pct:r2(x.volume/tot*100),bbox_min:x.min.map(r4),bbox_max:x.max.map(r4)}));}
  return o;
}
export async function thin(API,ms=2500){
  const m=API.S.mesh;if(!m||!API.fea)return null;
  try{const r=await Promise.race([API.fea('thickness',{inp:{pos:m.pos,idx:m.idx,bbox:m.props.bbox,volume:m.props.volume,res:40000}}),sleep(ms).then(()=>null)]);return r&&r.r&&r.r.minT!=null?{t:r4(r.r.minT),at:(r.r.at||[]).map(r2)}:null;}catch{return null;}
}
export function findings(o){
  const u=o.units,F=[],big=u==='in'?120:3000,small=u==='in'?0.04:0.5;
  if(o.empty)F.push('The model is empty: nothing solid was built.');
  for(const e of o.errors||[])F.push(`Feature ${e.id}${e.name?" '"+e.name+"'":''} failed to build and was skipped: ${e.msg}`);
  if(o.solids>1)F.push(`The model is ${o.solids} separate pieces. A real part should be ONE connected solid, so something floats or only touches: ${(o.pieces||[]).map(p=>`piece ${p.n} (${p.volume_pct}% of the volume, from [${p.bbox_min}] to [${p.bbox_max}])`).join('; ')}. Overlap the pieces with the main body or move them until they intersect.`);
  for(const e of o.changed_nothing||[])F.push(`${e.name?"'"+e.name+"' ":''}(${e.id}) changed nothing: ${e.msg.replace(/^.*changed nothing: /,'')}`);
  for(const w of o.warnings||[])F.push('Build warning: '+w);
  for(const[k,v]of Object.entries(o.param_errors||{}))F.push(`Parameter ${k} is broken: ${v}`);
  if(o.size){const mx=Math.max(...o.size),mn=Math.min(...o.size);mx>big&&F.push(`The model is ${mx} ${u} across, which is huge; check the units (the document is in ${u}).`);mx<small&&F.push(`The model is only ${mx} ${u} across, which is tiny; check the units (the document is in ${u}).`);mn>0&&mx/mn>60&&F.push(`The smallest dimension is ${mn} ${u} against ${mx} ${u}; confirm it is meant to be that thin.`);mn===0&&F.push('One dimension of the bounding box is zero: the solid is flat.');}
  if(o.thin&&o.thin.t<(u==='in'?0.015:0.4))F.push(`Thinnest wall is about ${o.thin.t} ${u} near [${o.thin.at}]; fine for knife edges and airfoil trailing edges, thin for anything machined or printed.`);
  return F;
}
function tile(API,v,g,x,y,w,h,o){
  const T=API.THREE,R=API.renderer,cv=R.domElement,b=o.bbox||API.S.mesh.props.bbox,c=new T.Vector3(...[0,1,2].map(i=>(b.min[i]+b.max[i])/2)),E=[0,1,2].map(i=>b.max[i]-b.min[i]),r=Math.max(1e-7,Math.hypot(...E)/2),asp=cv.width/cv.height,d=new T.Vector3(...API.VIEWS[v]).normalize(),ax={top:[0,1],front:[0,2],right:[1,2]}[v];
  let cam;
  if(v==='iso'){
    cam=new T.PerspectiveCamera(30,asp,r/100,r*200);cam.up.set(0,0,1);let k=r*5;
    for(let n=0;n<4;n++){cam.position.copy(c).addScaledVector(d,k);cam.lookAt(c);cam.updateProjectionMatrix();cam.updateMatrixWorld(true);let m=0;for(let q=0;q<8;q++){const p=new T.Vector3(q&1?b.max[0]:b.min[0],q&2?b.max[1]:b.min[1],q&4?b.max[2]:b.min[2]).project(cam);m=Math.max(m,Math.abs(p.x),Math.abs(p.y));}k*=Math.max(0.2,m/0.8);}
  }else{const hw=E[ax[0]]/2,hh=E[ax[1]]/2,q=Math.max(hh*1.12,hw*1.12/asp,r*0.02);cam=new T.OrthographicCamera(-q*asp,q*asp,q,-q,-r*40,r*40);cam.position.copy(c).addScaledVector(d,r*8);}
  cam.up.set(0,Math.abs(d.z)>0.99?1:0,Math.abs(d.z)>0.99?0:1);cam.lookAt(c);cam.updateProjectionMatrix();cam.updateMatrixWorld();
  R.setScissorTest(false);R.setViewport(0,0,cv.width/R.getPixelRatio(),cv.height/R.getPixelRatio());R.render(API.scene,cam);
  const k=Math.min(w/cv.width,h/cv.height),dw=cv.width*k,dh=cv.height*k;g.drawImage(cv,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  g.strokeStyle='#9aa5b4';g.lineWidth=1;g.strokeRect(x+0.5,y+0.5,w-1,h-1);
  const ex={iso:'',top:[0,1],front:[0,2],right:[1,2]}[v],cap=TILES.find(t=>t[0]===v)[1]+(ex?'   '+ex.map(i=>'xyz'[i]+' '+r2(b.max[i]-b.min[i])).join(' × ')+' '+o.units:'');
  g.font='bold '+Math.round(w/38)+'px system-ui,sans-serif';g.textBaseline='top';g.fillStyle='rgba(255,255,255,0.8)';g.fillRect(x+7,y+7,g.measureText(cap).width+12,Math.round(w/38)+10);g.fillStyle='#1b2330';g.fillText(cap,x+12,y+11);
}
export async function sheet(API,o={}){
  const S=API.S,R=API.renderer,cv=R.domElement,W=Math.max(400,Math.min(+o.width||1000,2000)),hid=document.visibilityState==='hidden';
  const fb=S.ws==='form'&&API.hooks.bounds?API.hooks.bounds():null;
  if(S.ws==='form'&&!fb)throw new Error('The form is empty; there is nothing to look at yet.');
  if(!fb&&!S.mesh)throw new Error('There is no solid to look at yet.');
  if(!fb&&S.ws&&S.ws!=='part')throw new Error('The contact sheet is for the Part and Form workspaces; the page is showing '+S.ws+'.');
  try{if(R.getContext().isContextLost())throw 0;}catch{throw new Error(hid?'The Amni-CAD page is in the background; bring it on screen and try again.':'The 3D view lost its WebGL context and could not be read. Reload the Amni-CAD page and try again.');}
  if(cv.width<2||cv.height<2)throw new Error('The 3D viewport has no size (the page is minimized or its layout collapsed). Bring the Amni-CAD page on screen and try again.');
  const tw=Math.floor(W/2),th=Math.max(160,Math.min(Math.round(tw*cv.height/cv.width),Math.round(tw*1.1))),c=document.createElement('canvas');c.width=tw*2;c.height=th*2;
  const g=c.getContext('2d');g.fillStyle=BG;g.fillRect(0,0,c.width,c.height);
  const ui={units:S.doc.units==='in'?'in':'mm',bbox:fb&&{min:fb.min,max:fb.max}};
  try{TILES.forEach(([v],i)=>tile(API,v,g,(i%2)*tw,Math.floor(i/2)*th,tw,th,ui));}finally{API.redraw();}
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',+o.quality||0.82)),tn=document.createElement('canvas');tn.width=Math.min(320,c.width);tn.height=Math.round(c.height*tn.width/c.width);tn.getContext('2d').drawImage(c,0,0,tn.width,tn.height);
  const b64=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]);fr.onerror=rej;fr.readAsDataURL(blob);});
  return{b64,mime:'image/jpeg',bytes:blob.size,width:c.width,height:c.height,thumb:tn.toDataURL('image/jpeg',0.6),views:TILES.map(t=>t[0])};
}
export async function review(API,o={}){
  if(API.S.ws==='form')return formReview(API,o);
  await API.waitBuild();
  const rep=report(API);rep.thin=o.thin===false?null:await thin(API);
  const F=findings(rep),out={report:{...rep,thin:rep.thin?{t:rep.thin.t,at:rep.thin.at}:undefined},findings:F};
  if(o.sheet===false||rep.empty)return out;
  try{Object.assign(out,await sheet(API,o));}catch(e){out.sheet_error=e.message;}
  return out;
}
async function formReview(API,o){const fm=await import('./form.js');await fm.whenMeshed(API).catch(()=>{});const info=await fm.sceneInfo(API),m=info.mesh,u=info.units,F=info.errors.slice(0,7).map(e=>'Scene line '+(e.line+1)+': '+e.msg),ev=await(await import('./poly_io.js')).evalScene(API.doc,API.doc.form||'',{rd:false}).catch(e=>(F.push(e.message),[]));if(!m||!m.triangles)F.push('The form is empty.');for(const x of info.meshes||[])x.missing&&F.push('Mesh object '+x.name+' has no data (%'+x.data+'); undo or reopen the saved file.');for(const x of ev){const s=x.stats;s&&(s.boundary||s.nonManifold)&&F.push('Mesh object '+x.it.name+' is not watertight ('+(s.boundary?s.boundary+' open edges':'')+(s.boundary&&s.nonManifold?', ':'')+(s.nonManifold?s.nonManifold+' edges shared by 3+ faces':'')+'); fine for games and renders, fix it before 3D printing.');x.warn&&x.warn.length&&F.push(x.it.name+': '+x.warn.join('; '));}
  const size=m&&m.bbox?m.bbox.max.map((v,i)=>+(v-m.bbox.min[i]).toFixed(4)):null,out={report:{workspace:'form',units:u,size,bbox:m&&m.bbox,volume:m&&m.volume,triangles:m&&m.triangles,lines:info.lines,meshes:info.meshes,animation:info.animation,empty:!m||!m.triangles},findings:F};if(o.sheet===false||out.report.empty)return out;try{Object.assign(out,await sheet(API,o));}catch(e){out.sheet_error=e.message;}return out;}
export const brief=o=>{const r=o.report||o,u=r.units;return r.empty?'nothing is built':`${r.solids} solid${r.solids===1?'':'s'}, ${r.size.join(' × ')} ${u}`+(r.errors&&r.errors.length?`, ${r.errors.length} feature error${r.errors.length===1?'':'s'}`:'')+(o.findings&&o.findings.length?`, ${o.findings.length} finding${o.findings.length===1?'':'s'}`:', no findings');};
export function reviewText(o,req,round,image,params=[]){
  const rk=recipeFor(req),tip=rk&&!params.some(p=>String(p).startsWith(rk+'_'))?`\nTip: this request is a ${RECIPES[rk].n.toLowerCase()}. A recipe builds it correctly in one action, for example {"new":true} then ${JSON.stringify(RECIPES[rk].ex)}; hand-modeled versions usually come out wrong. Use the recipe and keep the sizes the user asked for.`:'';
  const r=o.report,num={units:r.units,size:r.size,bbox:r.bbox,volume:r.volume,mass_g:r.mass_g,solids:r.solids,features:r.features,faces:r.faces,pieces:r.pieces,thinnest_wall:r.thin};
  return `Here is what you built (check ${round} of ${MAXR}). `+(image?'The attached image is a contact sheet of the model right now: ISO (top left), TOP, FRONT and RIGHT, each labelled with its axes and extent. Look at it carefully. ':'This AI cannot see images, so judge from the numbers. ')+`\nNumbers: ${JSON.stringify(num)}\nAutomated findings: ${o.findings.length?'\n- '+o.findings.join('\n- '):'none'}\nCompare it with the original request: "${req}". If it matches, reply with an empty actions list and say it matches. Otherwise say plainly what is wrong and give corrective actions (set, add, delete, or {"new":true} followed by a corrected rebuild; use a recipe when one fits). Do not repeat actions that already worked. If a disconnected piece or a failed feature is listed, fixing that comes first.${tip}`;
}
export function conv(h){
  const o=[];
  for(const m of h){const p=o[o.length-1];p&&p.role===m.role?(p.content+='\n\n'+m.content,m.images&&(p.images=[...(p.images||[]),...m.images])):o.push({...m});}
  return o;
}
