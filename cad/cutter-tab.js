import {PROFILES,profile,profileSVG,bitSpec,knifeSpec,report,checkBit,maxRpm,copeFit,flat,secArea,SHANKS,BEARINGS,SPINDLES,RPM_SRC,KNIFE_SRC} from './cutter.js';
import {cncPlan,knifeDxf,dxfToProfile} from './cutter_out.js';
import {picker,dims,css,kOf,ulab,safe} from './cutter_field.js';
import {sketchShapes} from './sketch.js';
const DEF=()=>({prof:'roundover',pp:{},type:'bit',bit:{shank:'1/4',brg:'1/2x3/16',hook:0,relief:10,wings:2,shear:0,body:true},shaper:{spindle:'3/4',wings:3,stack:1,hook:10,relief:10,shear:0},knife:{hook:20,head:'auto',bevel:15,corr:false},mold:{},rpm:0,cnc:{mode:'ball',post:'grbl',units:'in'},fid:{}});
export const cfgOf=doc=>{const d=doc.cutter||{},D=DEF();return{...D,...d,pp:{...d.pp},bit:{...D.bit,...d.bit},shaper:{...D.shaper,...d.shaper},knife:{...D.knife,...d.knife},mold:{...D.mold,...d.mold},cnc:{...D.cnc,...d.cnc},fid:{...d.fid}};};
const ST={el:null,API:null,hooked:false,plan:null,busy:false,msg:'',err:'',grp:null,sk:''};
const AUTO=new Set(['dia','len','sl','ct','cw','wb','ak','rc','proj','kt','grip','km','cp','cd','stockW','ball','step','doc','feed','plunge','rpm']),COLORS={ok:'var(--ok,#4fd18b)',warn:'var(--warn,#f5a524)',err:'var(--err,#ff4d4f)'};
const ln=(v,K)=>{const i=v/K;return i.toFixed(3)+' in ('+(i*25.4).toFixed(1)+' mm)';};
const typeName={bit:'router bit',shaper:'shaper cutter',knife:'molder knife',molding:'molding',edge:'edge profile'},FTYPE={bit:'bit',shaper:'shaper',knife:'knife',molding:'molding',edge:'edgeprofile'};
function save(fn){const API=ST.API;API.commit(d=>{d.cutter=cfgOf(d);fn(d.cutter);},{noEdit:true,merge:'cu'});}
export function featureFields(c,type,K){
  const f={prof:c.prof,pp:c.pp},src=type==='bit'||type==='shaper'||type==='knife'?c[type]:type==='molding'?c.mold:{};
  for(const[k,v]of Object.entries(src||{})){if(v===''||v==null||(AUTO.has(k)&&!(+v>0)))continue;f[k]=v;}
  return f;
}
export function place(API,type,extra={}){
  ST.API=API;const c=cfgOf(API.doc),K=kOf(API),f={...featureFields(c,type,K),...extra},id=c.fid[FTYPE[type]],ex=id&&API.doc.features.find(x=>x.id===id&&x.type===FTYPE[type]);
  if(type!=='edge'){const b=API.mesh&&API.mesh.props.bbox;b&&!ex&&(f.x=+(b.max[0]+K*2).toFixed(4));}
  if(ex){API.commit(d=>{const t=d.features.find(x=>x.id===id),keep=new Set(['id','type','name','suppressed','x','y','z','axis','op','edges','flip','path','bend']);for(const k of Object.keys(t))keep.has(k)||k in f||delete t[k];Object.assign(t,f);});return ex;}
  const sel=type==='edge'?API.selPick('edges').length:0,nf=API.addFeature(FTYPE[type],type==='edge'?{...f,_smart:true}:f);save(d=>{d.fid[FTYPE[type]]=nf.id;});type==='edge'&&(API.active=null,!sel&&API.toast('Applied to the top edges. Change the edges in the Edit tab.',4000));API.setTab('cutters');return nf;
}
function sketchPaths(API){
  const out=[];for(const f of API.doc.features){const sh=f.sketch&&f.sketch.ents&&f.sketch.ents.length?(()=>{try{return sketchShapes(f.sketch);}catch{return[];}})():f.shapes;for(const s of sh||[])if(s&&s.k==='path'&&(s.pts||[]).length>=2&&s.pts.every(p=>p.every(v=>isFinite(+v))))out.push({label:(f.name||f.type)+' ('+s.pts.length+' points)',s});}
  return out;
}
const normPts=(P)=>{const mx=Math.max(...P.map(p=>p[0])),my=Math.max(...P.map(p=>p[1]));return P.map(p=>[+(p[0]-mx).toFixed(5),+(p[1]-my).toFixed(5)]);};
function bitSVG(s,K){
  const w=s.wing,P=flat(w,0.0005*K,true),r=s.rmax,top=s.z0+s.H+s.neck+Math.min(s.sl,s.sl),pad=0.1*r,f=v=>+v.toFixed(4),pt=(x,z)=>f(x)+' '+f(-z);
  const prof='M'+P.map(q=>pt(q[0],q[1]+s.z0)).join('L')+'Z',sh='M'+pt(s.sd/2,s.z0+s.H)+'L'+pt(s.sd/2,top)+'L'+pt(-s.sd/2,top)+'L'+pt(-s.sd/2,s.z0+s.H)+'Z',mir='M'+P.map(q=>pt(-q[0],q[1]+s.z0)).join('L')+'Z';
  const brg=s.br?'<rect x="'+f(-s.od/2)+'" y="'+f(-s.bt)+'" width="'+f(s.od)+'" height="'+f(s.bt)+'" style="fill:#8892a655;stroke:var(--mut,#8892a6);stroke-width:'+f(r/70)+'"/>':'';
  return'<svg class="cu-svg" viewBox="'+f(-r-pad)+' '+f(-top-pad)+' '+f(2*r+2*pad)+' '+f(top+2*pad)+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cutter silhouette" style="max-height:270px"><path d="'+sh+'" style="fill:#aab2bf;stroke:none"/><path d="'+prof+'" style="fill:#59b6ff66;stroke:var(--cu-line,#1d6fd8);stroke-width:'+f(r/45)+'"/><path d="'+mir+'" style="fill:#59b6ff66;stroke:var(--cu-line,#1d6fd8);stroke-width:'+f(r/45)+'"/>'+brg+'</svg>';
}
function knifeSVG(ks){
  const O=ks.outline,xs=O.map(p=>p[0]),ys=O.map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys),W=Math.max(...xs)-x0,H=Math.max(...ys)-y0,pad=0.07*Math.max(W,H),f=v=>+v.toFixed(4);
  return'<svg class="cu-svg" viewBox="'+f(x0-pad)+' '+f(-(y0+H)-pad)+' '+f(W+2*pad)+' '+f(H+2*pad)+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Knife blank and ground profile"><path d="M'+O.map(p=>f(p[0])+' '+f(-p[1])).join('L')+'Z" style="fill:#aab2bf88;stroke:var(--cu-line,#1d6fd8);stroke-width:'+f(Math.max(W,H)/180)+'"/></svg>';
}
const fld=(h,label,...k)=>h('label',null,label,...k);
function numIn(h,obj,key,label,ph,set,suffix){return fld(h,label+(suffix?' ('+suffix+')':''),h('input',{type:'text',inputmode:'decimal',value:obj[key]==null||obj[key]===0&&AUTO.has(key)?'':obj[key],placeholder:ph==null?'auto':String(ph),spellcheck:'false','aria-label':label,onchange:e=>{const t=e.target.value.trim();set(t===''?undefined:/^-?\d*\.?\d+$/.test(t)?+t:t);}}));}
function selIn(h,label,opts,cur,set){return fld(h,label,h('select',{'aria-label':label,onchange:e=>set(e.target.value)},...opts.map(o=>{const[v,t]=Array.isArray(o)?o:[o,o];return h('option',{value:v,selected:String(v)===String(cur)},t);})));}
function render(){
  const API=ST.API,el=ST.el;if(!el)return;css();
  const h=API.h,K=kOf(API),u=ulab(API),c=cfgOf(API.doc),pr=safe(c.prof,c.pp,K),re=()=>render(),sv=fn=>{save(fn);re();};
  const hs=[];
  const sk=sketchPaths(API),file=h('input',{type:'file',accept:'.dxf',style:'display:none','aria-label':'Import a DXF outline',onchange:async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const pts=dxfToProfile(await f.text(),K);sv(d=>{d.prof='custom';d.pp={pts};});}catch(er){API.toast(er.message,4000);}}});
  hs.push(h('div',{class:'sec'},h('h3',null,'Profile'),picker(API,c.prof,id=>sv(d=>{d.prof=id;d.pp={};}),K,ST.grp||(PROFILES[c.prof]&&PROFILES[c.prof].group),g=>{ST.grp=g;re();}),pr.err?h('div',{class:'alert err'},pr.err):h('div',{html:profileSVG(pr)}),
    pr.err?null:h('div',{class:'cu-note'},pr.name+' · '+pr.kind+' · '+ln(pr.w,K)+' wide, '+ln(pr.h,K)+' deep'+(pr.sec?' · section area '+(secArea(pr)/K/K).toFixed(3)+' in² ('+(secArea(pr)/K/K*645.16).toFixed(0)+' mm²)':'')),
    dims(API,c.prof,c.pp,o=>sv(d=>{d.pp=o;}),K),
    h('div',{class:'cu-row'},h('button',{class:'btn sm',onclick:()=>file.click(),title:'Draw the finished surface in any drawing program and save it as DXF'},'Import DXF outline…'),file,h('button',{class:'btn sm',id:'cu-sketch',title:'Opens the sketcher on a new profile sketch; draw an open line, finish, then pick it here',onclick:()=>{const f=API.addFeature('extrude',{plane:'XY',offset:0,op:'add',shapes:[],sketch:{pts:[[0,0]],ents:[],cons:[]},suppressed:true,name:'Profile sketch'});API.openSketch(f.id,{fresh:true});}},'Draw in the sketcher'),sk.length?h('select',{'aria-label':'Use a sketch from this part',onchange:e=>{const s=sk[+e.target.value];e.target.value='';if(s)sv(d=>{d.prof='custom';d.pp={pts:normPts(s.s.pts.map(p=>[+p[0],+p[1]])),bulge:(s.s.bulge||[]).map(Number)};});}},h('option',{value:''},'Use a sketch from this part…'),...sk.map((s,i)=>h('option',{value:i},s.label))):null),
    h('div',{class:'cu-note'},'Draw the finished surface as an open line from the top face to the edge; the lower right corner is the part corner.')));
  if(c.prof==='stick'||c.prof==='cope'){const st=safe('stick',c.pp,K),cp=safe('cope',c.pp,K);if(!st.err&&!cp.err){const fit=copeFit(st,cp,K);hs.push(h('div',{class:'sec'},h('h3',null,'Rail and stile fit'),h('div',{class:'cu-ck'},h('i',{style:'background:'+COLORS[fit.ok?'ok':'err']}),h('div',null,'The coped rail end matches the stick profile to '+fit.gap_in.toFixed(4)+' in ('+(fit.gap_in*25.4).toFixed(3)+' mm). Limit 0.002 in (0.05 mm). '+(fit.ok?'They fit.':'They do not fit; check the dimensions.')))));}}
  const T=['bit','shaper','knife','molding','edge'],type=T.includes(c.type)?c.type:'bit',cp=c[type]||c.mold||{},setK=(k)=>v=>sv(d=>{const o=type==='molding'?d.mold:d[type];v===undefined?delete o[k]:o[k]=v;});
  const A=(k,l,ph,suf)=>numIn(h,type==='molding'?c.mold:c[type],k,l,ph,setK(k),suf);
  const g=[];
  if(type==='bit')g.push(selIn(h,'Shank',Object.keys(SHANKS).map(k=>[k,k==='8mm'||k==='12mm'?k.replace('mm',' mm'):k+' in']),c.bit.shank,setK('shank')),selIn(h,'Bearing guide (OD x ID in)',Object.keys(BEARINGS).map(k=>[k,k==='none'?'No bearing':k.replace('x',' x ')]),c.bit.brg,setK('brg')),A('dia','Cutting diameter',null,u),A('len','Cutting length',null,u),A('sl','Shank length',u==='in'?1.25:31.75,u),selIn(h,'Carbide wings',[1,2,3,4],c.bit.wings,setK('wings')),A('ct','Carbide thickness',u==='in'?0.08:2,u),A('shear','Shear angle',0,'°'),A('hook','Hook (rake) angle',0,'°'),A('relief','Relief (clearance) angle',10,'°'),selIn(h,'Steel wing body',[[true,'Steel body with brazed carbide seat'],[false,'Carbide plates only']],String(c.bit.body!==false),v=>setK('body')(v==='true')),A('cw','Carbide seat width',u==='in'?0.12:3,u),A('wb','Body wing thickness',u==='in'?0.1:2.5,u),A('gul','Gullet width (0 = none)',u==='in'?0.07:1.8,u),A('ak','Anti-kickback limit (0 = off)',0,u));
  if(type==='shaper')g.push(selIn(h,'Spindle bore',Object.keys(SPINDLES).map(k=>[k,k+' in']),c.shaper.spindle,setK('spindle')),A('dia','Cutting diameter',u==='in'?3.5:88.9,u),selIn(h,'Wings',[1,2,3,4],c.shaper.wings,setK('wings')),selIn(h,'Stacked cutters',[1,2,3,4],c.shaper.stack,setK('stack')),A('ct','Wing thickness',u==='in'?0.125:3.2,u),A('shear','Shear angle',0,'°'),A('hook','Hook angle',10,'°'),A('relief','Relief angle',10,'°'));
  if(type==='knife')g.push(A('rc','Cutting circle diameter',u==='in'?4:101.6,u),A('hook','Head hook angle',20,'°'),A('proj','Knife projection',u==='in'?0.5:12.7,u),A('kt','Knife thickness',u==='in'?0.1875:4.76,u),A('grip','Grip above projection',u==='in'?0.5:12.7,u),A('km','End margin',u==='in'?0.25:6.35,u),selIn(h,'Head position',['auto','top','side'],c.knife.head,setK('head')),A('bevel','Back bevel',15,'°'),selIn(h,'Back',[[false,'Straight'],[true,'Corrugated']],String(!!c.knife.corr),v=>setK('corr')(v==='true')),A('cp','Corrugation pitch',u==='in'?0.125:3.18,u),A('cd','Corrugation depth',u==='in'?0.03:0.76,u));
  if(type==='molding')g.push(A('len','Length',u==='in'?12:305,u));
  let ck=null,info=null,prev=null;
  try{
    if(type==='bit'||type==='shaper'){const s=bitSpec({type,prof:c.prof,pp:c.pp,...c[type]},K),rep=checkBit(s,+c.rpm||0,K);prev=h('div',{html:bitSVG(s,K)});
      info=h('div',{class:'cu-kv'},h('span',null,'Cutting diameter'),h('span',null,ln(s.dia,K)),h('span',null,'Cutting length'),h('span',null,ln(s.H,K)),h('span',null,'Wings'),h('span',null,s.n+' × '+ln(s.ct,K)+' carbide'),...(s.body?[h('span',null,'Bite per revolution'),h('span',null,s.bite?(s.bite.rev/K).toFixed(4)+' in ('+(s.bite.rev/K*25.4).toFixed(2)+' mm), '+(s.bite.tooth/K).toFixed(4)+' in per wing':'not limited')]:[]),h('span',null,'Rim speed limit'),h('span',null,maxRpm(s.dia/K).toLocaleString('en-US')+' rpm'));
      ck=h('div',null,h('div',{class:'cu-dims'},fld(h,'Spindle speed (rpm)',h('input',{type:'text',inputmode:'numeric',value:c.rpm||'',placeholder:String(maxRpm(s.dia/K)),'aria-label':'Spindle speed',onchange:e=>sv(d=>{d.rpm=+e.target.value||0;})}))),...rep.map(r=>h('div',{class:'cu-ck'},h('i',{style:'background:'+COLORS[r.lvl]}),h('div',null,r.msg))),h('details',null,h('summary',null,'Source of the speed limit'),h('div',{class:'cu-note'},RPM_SRC)));}
    else if(type==='knife'){const ks=knifeSpec({prof:c.prof,pp:c.pp,...c.knife},K),rep=report({...c,type:'knife'},K).checks;prev=h('div',{html:knifeSVG(ks)});
      ck=h('div',null,...rep.map(r=>h('div',{class:'cu-ck'},h('i',{style:'background:'+COLORS[r.lvl]}),h('div',null,r.msg))),h('details',null,h('summary',null,'How the knife profile is corrected'),h('div',{class:'cu-note'},'s = R·cos(h) − √((R−d)² − R²·sin²(h)), where R is the cutting circle radius, h the hook angle and d the molding depth. '+KNIFE_SRC)));}
  }catch(er){ck=h('div',{class:'alert err'},er.message);}
  const bw=(API.S.warnings||[]).filter(x=>x.id===c.fid[FTYPE[type]]);
  hs.push(h('div',{class:'sec'},h('h3',null,'Cutter'),...bw.map(x=>h('div',{class:'alert warn',role:'status'},x.msg)),h('div',{class:'cu-grp',role:'tablist'},...T.map(t=>h('button',{class:t===type?'on':'',role:'tab','data-cu':t,onclick:()=>sv(d=>{d.type=t;})},typeName[t][0].toUpperCase()+typeName[t].slice(1)))),g.length?h('div',{class:'cu-dims'},...g):h('div',{class:'cu-note'},type==='edge'?'Select straight 90° edges of a wood part in the 3D view, then apply the profile to them.':''),prev,info,ck,
    h('div',{class:'cu-row'},h('button',{class:'btn pri',id:'cu-add',onclick:()=>{try{place(API,type);}catch(er){API.toast(er.message,4000);}}},(c.fid[FTYPE[type]]&&API.doc.features.some(f=>f.id===c.fid[FTYPE[type]])?'Update '+typeName[type]+(type==='edge'?' on the part':' in the model'):'Add '+typeName[type]+(type==='edge'?' to selected edges':' to the model'))))));
  hs.push(h('div',{class:'sec'},h('h3',null,'Export'),h('div',{class:'cu-row'},h('button',{class:'btn sm',id:'cu-step',onclick:()=>API.exportFmt('step')},'STEP'),h('button',{class:'btn sm',id:'cu-stl',onclick:()=>API.exportFmt('stl')},'STL'),h('button',{class:'btn sm',id:'cu-dxf',disabled:type!=='knife',title:'Corrected knife blank and grind outline for wire EDM, a grinder or a laser',onclick:()=>exportDxf(API,'knife')},'Knife DXF'),h('button',{class:'btn sm',id:'cu-tpl',disabled:type!=='knife',title:'Template: the molding profile above the corrected knife edge',onclick:()=>exportDxf(API,'template')},'Template DXF'),h('button',{class:'btn sm',id:'cu-draw',onclick:()=>API.setTab('draw'),title:'ANSI drawing with the profile detail'},'Drawing')),h('div',{class:'cu-note'},'The STEP, STL and drawing use the cutter or molding in the model. DXF files are in '+(u==='in'?'inches':'millimeters')+'.')));
  const n=c.cnc,cs=(k)=>v=>sv(d=>{v===undefined?delete d.cnc[k]:d.cnc[k]=v;}),P=ST.plan,bitOK=['bit'].includes(type);
  hs.push(h('div',{class:'sec'},h('h3',null,'Machine the molding on a CNC router'),h('div',{class:'cu-dims'},selIn(h,'Method',[['ball','Ball nose raster along the length'],['bit','Use the bit designed above']],n.mode,cs('mode')),selIn(h,'Post',[['grbl','GRBL'],['linuxcnc','LinuxCNC'],['shopbot','ShopBot (OpenSBP)']],n.post,cs('post')),n.post==='shopbot'?null:selIn(h,'G-code units',[['in','Inch (G20)'],['mm','Millimeter (G21)']],n.units,cs('units')),numIn(h,n,'len','Stock length',u==='in'?12:305,cs('len'),u),numIn(h,n,'stockW','Stock width',null,cs('stockW'),u),n.mode==='ball'?numIn(h,n,'ball','Ball diameter',u==='in'?0.25:6.35,cs('ball'),u):null,n.mode==='ball'?numIn(h,n,'step','Stepover',null,cs('step'),u):null,n.mode==='ball'?numIn(h,n,'doc','Depth per roughing pass',u==='in'?0.125:3.18,cs('doc'),u):null,numIn(h,n,'rpm','Spindle (rpm)',12000,cs('rpm')),numIn(h,n,'feed','Feed ('+u+'/min)',u==='in'?40:1016,cs('feed'))),
    h('div',{class:'cu-row'},h('button',{class:'btn pri',id:'cu-gen',disabled:ST.busy,onclick:()=>runCnc(API).catch(er=>{ST.err=er.message;re();})},ST.busy?'Generating…':'Generate G-code'),P?h('button',{class:'btn',id:'cu-dl',onclick:()=>API.download(new Blob([P.gcode],{type:'text/plain'}),P.file)},'Download '+P.file):null,P?h('button',{class:'btn',id:'cu-sim',onclick:()=>runCnc(API,{simulate:true}).catch(er=>{ST.err=er.message;re();})},'Simulate'):null),
    ST.err?h('div',{class:'alert err'},ST.err):null,P?h('div',{class:'alert ok'},h('b',null,P.passes+' cutting moves · about '+P.time_min.toFixed(1)+' min'),h('div',null,P.tool+' · '+P.dialect+' · '+P.gcode.split('\n').length+' lines · stock '+ln(P.len,K)+' long')):null,...(P?P.warnings.map(w=>h('div',{class:'alert warn'},w)):[]),
    h('div',{class:'cu-note'},n.mode==='bit'?'The simulator cuts the stock with the exact profile of the bit above, so you see the molding the bit makes.':'Roughing passes step down to the finishing surface; the ball radius is compensated so the tip never gouges.')));
  el.replaceChildren(...hs);
}
export async function runCnc(API,o={}){
  ST.API=API;const c=cfgOf(API.doc),K=kOf(API),n=c.cnc,pr=profile(c.prof,c.pp,K);ST.busy=true;ST.err='';ST.el&&render();
  try{
    let spec=null;if(n.mode==='bit'){const t=c.type==='shaper'?'bit':c.type;spec=bitSpec({type:'bit',prof:c.prof,pp:c.pp,...c.bit},K);}
    const plan=cncPlan(pr,{...n,spec,mode:n.mode,units:n.post==='shopbot'?'in':n.units});ST.plan=plan;API.S.lastCutterCnc={ok:true,file:plan.file,post:plan.dialect,mode:plan.mode,passes:plan.passes,time_min:+plan.time_min.toFixed(2),lines:plan.gcode.split('\n').length,tool:plan.tool,warnings:plan.warnings};
    if(o.simulate){const V=await import('./gcode_view.js');await V.open(API,{text:plan.gcode,name:plan.file,dialect:plan.dialect,post:plan.dialect,machine:'',cfg:plan.cfg});}
    return plan;
  }finally{ST.busy=false;ST.el&&render();}
}
async function exportDxf(API,which){
  try{const c=cfgOf(API.doc),K=kOf(API),ks=knifeSpec({prof:c.prof,pp:c.pp,...c.knife},K),r=await knifeDxf(ks,ulab(API)),n=API.safeName()+'-'+c.prof;API.download(new Blob([which==='knife'?r.knife:r.template],{type:'application/dxf'}),n+(which==='knife'?'-knife.dxf':'-template.dxf'));}
  catch(er){API.toast(er.message,4000);}
}
export function mount(el,API){ST.el=el;ST.API=API;if(!ST.hooked){ST.hooked=true;API.onChange(()=>{ST.plan=null;if(ST.el&&ST.el.classList.contains('on'))render();});}render();}
export function unmount(){}
export function design(API,p={}){
  ST.API=API;const K=kOf(API),type=p.type||cfgOf(API.doc).type;
  API.commit(d=>{const c=cfgOf(d);d.cutter=c;for(const k of['prof','pp','rpm','type'])p[k]!==undefined&&(c[k]=k==='pp'?{...p[k]}:p[k]);for(const t of['bit','shaper','knife','mold','cnc'])p[t]&&(c[t]={...c[t],...p[t]});},{noEdit:true});
  return report({...cfgOf(API.doc),type},K);
}
