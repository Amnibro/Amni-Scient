import {flat,radii,ballSurface,bitTable,bitSpec,knifeSpec,profile,silhouette} from './cutter.js';
const f4=v=>+v.toFixed(4);
const toU=(v,K,u)=>f4(u==='in'?v/K:v*25.4/K);
const dxfOf=async(items,W,H,u)=>(await import('./drawing.js')).toDXF({W,H,items,ins:u==='in'?1:4});
export async function knifeDxf(ks,u='in'){
  const K=ks.K,c=p=>[toU(p[0],K,u),toU(p[1],K,u)],flatPts=P=>P.flatMap(p=>c(p)),Lb=ks.len,pr=ks.pr,sx=ks.outline[0][0],ex=ks.outline[1][0],te=Math.max(Lb,0.5*K),th=0.2*K*(u==='in'?1:1);
  const blank=[[sx,0],[ex,0],[ex,ks.Hb],[sx,ks.Hb]],label=(t,p)=>({t:'tx',p:c(p),txt:t,s:+toU(0.1*K,K,u),ly:'txt',an:'s'}),inch=u==='in';
  const info=[ks.pr.name+' molder knife','Cutting circle diameter '+f4(ks.R*2/K)+' in, hook '+ks.hook+' deg, projection '+f4(ks.proj/K)+' in','Blank '+f4(Lb/K)+' x '+f4(ks.Hb/K)+' x '+f4(ks.kt/K)+' in thick','Profile corrected for hook angle and cutting circle (knife depth is not molding depth)'];
  const knife=await dxfOf([{t:'pl',p:flatPts(blank),ly:'blk',close:true},{t:'pl',p:flatPts(ks.outline),ly:'knf',close:true},...info.map((t,i)=>label(t,[sx,-(0.3+0.2*i)*K]))],+toU(Lb,K,u),+toU(ks.Hb+1.2*K,K,u),u);
  const gap=0.5*K,off=p=>[p[0],p[1]],tpl=[{t:'pl',p:flatPts(flat(pr.cur,0.0005*K).map(q=>[q[0]-pr.bb.minx,q[1]-pr.bb.maxy])),ly:'tpl'},{t:'pl',p:flatPts(ks.V.map(q=>[q[0]-ks.V[0][0],q[1]-ks.Hb-gap])),ly:'knf'},label('Template: molding profile (top) and corrected knife edge (bottom)',[0,-ks.Hb-gap-0.3*K])];
  return{knife,template:await dxfOf(tpl,+toU(pr.w+K,K,u),+toU(pr.h+ks.Hb+2*K,K,u),u)};
}
export function dxfPolys(txt){
  const L=txt.split(/\r?\n/),T=[];for(let i=0;i+1<L.length;i+=2)T.push([L[i].trim(),L[i+1].trim()]);
  const ins=(()=>{const i=T.findIndex(t=>t[1]==='$INSUNITS');return i>=0?+T[i+1][1]:0;})(),out=[];let cur=null,ent=false;
  for(const[c,v]of T){
    if(c==='0'){cur&&out.push(cur);cur=null;if(!ent&&v==='SECTION')continue;if(v==='ENDSEC'){ent=false;continue;}if(v==='LWPOLYLINE')cur={t:'pl',pts:[],closed:false,layer:''};else if(v==='LINE')cur={t:'l',pts:[],closed:false,layer:'',l:[]};continue;}
    if(c==='2'&&v==='ENTITIES'){ent=true;continue;}
    if(!cur||!ent)continue;
    c==='8'&&(cur.layer=v);
    if(cur.t==='pl'){c==='70'&&(cur.closed=(+v&1)===1);c==='10'&&cur.pts.push([+v,0]);c==='20'&&(cur.pts[cur.pts.length-1][1]=+v);}
    else if(cur.t==='l'){['10','20','11','21'].includes(c)&&cur.l.push(+v);}
  }
  cur&&out.push(cur);
  return{units:ins===1?'in':'mm',polys:out.map(e=>e.t==='l'?{layer:e.layer,closed:false,pts:[[e.l[0],e.l[1]],[e.l[2],e.l[3]]]}:{layer:e.layer,closed:e.closed,pts:e.pts})};
}
export function dxfToProfile(txt,K=1){
  const r=dxfPolys(txt),P=r.polys.filter(p=>p.pts.length>=3).sort((a,b)=>b.pts.length-a.pts.length)[0];if(!P)throw new Error('The DXF has no polyline with three or more points.');
  const k=(r.units==='in'?1:1/25.4)*K,pts=P.pts.map(q=>[q[0]*k,q[1]*k]),mx=Math.max(...pts.map(q=>q[0])),my=Math.max(...pts.map(q=>q[1]));
  return pts.map(q=>[+(q[0]-mx).toFixed(5),+(q[1]-my).toFixed(5)]);
}
const nfmt=v=>v.toFixed(4).replace(/\.?0+$/,'')||'0';
export function postGcode(moves,o){
  const d=o.dialect||'grbl',u=o.units==='mm'?'mm':'in',n=nfmt,sf=o.safe,hdr=['Amni-CAD cutter - '+(o.name||'molding'),'Tool: '+(o.tool||'ball nose'),'Zero: X0 front-left of stock, Y0 front edge, Z0 top of stock','Spindle '+o.rpm+' rpm, feed '+n(o.feed)+' '+u+'/min, plunge '+n(o.plunge)+' '+u+'/min','Air-cut this file first on a new setup'],L=[];
  if(d==='shopbot'){
    L.push(...hdr.map(t=>"' "+t),"' Units: INCH",'SA','TR,'+o.rpm,'C6','PAUSE 2','JS,'+n(o.rapid/60)+','+n(o.rapid/120),'MS,'+n(o.feed/60)+','+n(o.plunge/60),'JZ,'+n(sf));
    let p=[0,0,sf];for(const[t,X,Y,Z]of moves){const xy=Math.abs(X-p[0])>1e-9||Math.abs(Y-p[1])>1e-9,zz=Math.abs(Z-p[2])>1e-9,c=xy?n(X)+','+n(Y)+(zz?','+n(Z):''):n(Z);L.push((t==='r'?(xy&&zz?'J3,':xy?'J2,':'JZ,'):(xy&&zz?'M3,':xy?'M2,':'MZ,'))+c);p=[X,Y,Z];}
    L.push('JZ,'+n(sf),'C7','J2,0,0','END');return L.join('\n')+'\n';
  }
  L.push(...hdr.map(t=>'('+t+')'),d==='linuxcnc'?'G17 G'+(u==='mm'?21:20)+' G40 G49 G80 G90 G94':'G'+(u==='mm'?21:20)+'\nG90\nG17\nG94');
  d==='linuxcnc'?L.push('G54','T1 M6','S'+o.rpm+' M3','G43 H1 G0 Z'+n(sf)):L.push('G0 Z'+n(sf),'M3 S'+o.rpm);
  L.push('G4 P2');let p=[null,null,null],last=null;
  for(const[t,x,y,z]of moves){const c=[x,y,z],ax=['X','Y','Z'].map((a,i)=>p[i]===null||Math.abs(c[i]-p[i])>1e-9?a+n(c[i]):'').filter(Boolean),zo=ax.length===1&&ax[0][0]==='Z',fd=t==='f'?(zo&&p[2]!==null&&c[2]<p[2]?o.plunge:o.feed):null;if(ax.length)L.push((t==='r'?'G0 ':'G1 ')+ax.join(' ')+(fd!=null&&fd!==last?' F'+n(fd):''));fd!=null&&(last=fd);p=c;}
  L.push('G0 Z'+n(sf),'M5',d==='linuxcnc'?'G53 G0 Z0':'G0 X0 Y0','M30');return L.join('\n')+'\n';
}
export function cncPlan(pr,o={}){
  const K=pr.K,mode=o.mode==='bit'?'bit':'ball',len=o.len>0?o.len:12*K,Wst=o.stockW>0?o.stockW:pr.kind==='section'?pr.w:Math.max(pr.w*1.5,1.5*K),yo=pr.kind==='center'?Wst/2:Wst,Ts=o.stockT>0?o.stockT:Math.max(pr.p.T||pr.p.pt||0,pr.h*1.25,0.75*K),safe=0.5*K,moves=[],w=[];
  const dialect=['grbl','linuxcnc','shopbot'].includes(o.post)?o.post:'grbl',units=dialect==='shopbot'||o.units!=='mm'?'in':'mm',rpm=o.rpm>0?o.rpm:12000,feed=o.feed>0?o.feed:(40*K),plunge=o.plunge>0?o.plunge:20*K;
  let tool,cfgTools,name;
  if(mode==='bit'){
    const spec=o.spec||bitSpec({type:'bit',prof:pr.id,pp:Object.fromEntries(Object.keys(pr.defs).map(k=>[k,pr.p[k]])),shank:'1/4',brg:'1/2x3/16'},K),ov=spec.rmax+0.07*K,ax=pr.kind==='center'?yo:yo+spec.A+0.001*K,zt=pr.bb.miny-spec.z0,z=zt;
    moves.push(['r',-ov,ax,safe],['f',-ov,ax,z],['f',len+ov,ax,z],['r',len+ov,ax,safe]);
    tool={dia:2*spec.rmax,kind:'profile',tab:bitTable(spec),sil:silhouette(spec),len:spec.H+spec.z0,holder:spec.sd*2};name='custom bit '+pr.name;
    spec.undercut&&w.push('This profile undercuts, and the stock simulator is 2.5D, so the cut shows with straight sides.');
  }else{
    const rb=(o.ball>0?o.ball:0.25*K)/2,hs=ballSurface(pr),b=pr.bb,tip=Y=>{let m=-Infinity;for(let i=0;i<=24;i++){const u=-rb+2*rb*i/24,Yh=Y+u-yo;if(Yh<b.minx-1e-9||Yh>b.maxx+1e-9){if(Y+u>=0&&Y+u<=Wst)m=Math.max(m,-rb+Math.sqrt(Math.max(rb*rb-u*u,0)));continue;}m=Math.max(m,hs(Yh)-rb+Math.sqrt(Math.max(rb*rb-u*u,0)));}return m;};
    const st=o.step>0?o.step:Math.max(0.01*K,rb/10),n=Math.max(1,Math.ceil(pr.w/st)),ys=Array.from({length:n+1},(_,i)=>yo+b.minx+pr.w*i/n),zs=ys.map(tip),zmin=Math.min(...zs),dc=o.doc>0?o.doc:0.125*K,levels=[];
    for(let l=-dc;l>zmin+1e-9;l-=dc)levels.push(l);levels.push(-Infinity);
    const ov=rb+0.1*K;let dir=1,cur=null;moves.push(['r',-ov,ys[0],safe]);
    for(const lv of levels)for(let j=0;j<ys.length;j++){const z=Math.max(zs[j],lv);if(lv>-Infinity&&zs[j]>=lv-1e-9)continue;const xa=dir>0?-ov:len+ov,xb=dir>0?len+ov:-ov;
      cur===null?(moves.push(['r',xa,ys[j],safe],['f',xa,ys[j],z]),0):(moves.push(['f',xa,ys[j],cur]),cur!==z&&moves.push(['f',xa,ys[j],z]));
      moves.push(['f',xb,ys[j],z]);cur=z;dir=-dir;}
    moves.push(['r',moves[moves.length-1][1],moves[moves.length-1][2],safe]);
    tool={dia:2*rb,kind:'ball',len:Math.max(4*rb,0.5*K),holder:Math.max(4*rb,0.5*K)};name='ball nose '+f4(2*rb/K)+' in';
  }
  const co=units==='mm'?25.4/K:1/K,gcode=postGcode(moves.map(m=>[m[0],m[1]*co,m[2]*co,m[3]*co]),{dialect,units,rpm,feed:feed*co,plunge:plunge*co,rapid:feed*co*4,safe:safe*co,name:pr.name,tool:name}),mm=25.4/K;
  let dist=0,t=0;for(let i=1;i<moves.length;i++){const a=moves[i-1],b=moves[i],d=Math.hypot(b[1]-a[1],b[2]-a[2],b[3]-a[3]);if(b[0]==='f'){dist+=d;t+=d/feed;}else t+=d/(feed*4);}
  const T={...tool,dia:tool.dia*mm,len:tool.len*mm,holder:tool.holder*mm},cfg={x0:0,y0:0,w:len*mm,h:Wst*mm,top:0,bot:-Ts*mm,cell:Math.max(pr.w*mm/70,0.005*25.4),tool:T,tools:{1:T}};
  mode==='bit'&&(cfg.tools[1].tab=tool.tab.map(v=>v*mm),cfg.tools[1].sil=tool.sil.map(p=>[p[0]*mm,p[1]*mm]),cfg.tool=cfg.tools[1]);
  return{ok:true,gcode,dialect,mode,units,file:(pr.id+'-'+mode+'.'+(dialect==='shopbot'?'sbp':'nc')),cfg,tool:name,len,Wst,Ts,passes:moves.filter(m=>m[0]==='f').length,feed_dist:dist,time_min:t,warnings:w,machine_units:units};
}
export function drawingDetail(f,ev,units){
  const K=units==='in'?1:25.4,num=v=>typeof v==='string'?ev(v):v,pp=Object.fromEntries(Object.entries(f.pp||{}).map(([k,v])=>[k,Array.isArray(v)?v:num(v)])),pr=profile(f.prof||'roundover',pp,K),u=units==='in'?'IN':'MM',fm=v=>units==='in'?(v/K).toFixed(4)+' IN':v.toFixed(3)+' MM',rows=[],R=radiiOf(pr);
  const Q=flat(pr.cur,0.0005*K),pts=pr.sec?flat(pr.sec,0.0005*K,true):Q;
  for(const[k,v]of Object.entries(pr.defs))if(rows.length<4)rows.push(v[0].toUpperCase()+' '+(v[2]==='a'?pr.p[k].toFixed(1)+' DEG':v[2]==='n'?String(Math.round(pr.p[k])):fm(pr.p[k])));
  R.length&&rows.push('R '+R.slice(0,3).map(r=>fm(r)).join(' / '));
  if(f.type==='bit'||f.type==='shaper'){const fe=Object.fromEntries(Object.entries(f).map(([k,v])=>[k,typeof v==='string'&&!['type','prof','shank','brg','spindle','axis','op','id','name'].includes(k)?ev(v):v])),s=bitSpec({...fe,pp},K);rows.push('CUTTING DIA '+fm(s.dia)+' X '+fm(s.Hp),'WINGS '+s.n+' CARBIDE '+fm(s.ct));}
  if(f.type==='knife'){const ks=knifeSpec({...f,pp,rc:num(f.rc),proj:num(f.proj),kt:num(f.kt),grip:num(f.grip),km:num(f.km)},K);rows.push('CUT CIRCLE DIA '+fm(ks.R*2),'HOOK '+ks.hook+' DEG PROJ '+fm(ks.proj));}
  return{name:pr.name,pts,mm:25.4/K,rows:rows.slice(0,7),w_txt:fm(pr.w)+' X '+fm(pr.h)};
}
const radiiOf=pr=>[...new Set(radii(pr.cur).map(r=>+r.toFixed(5)))];
