import {BASEMAPS,loadTile,lonToX,latToY,xToLon,yToLat,clampZoom,MOBILE} from './tiles.js?v=130';
import {createWindLayer,buildIsoPolylines,drawIsoPolylines} from './wind.js?v=130';
import {loadManifest,getHourField,sampleField,fieldStats,preloadCore,packHours,packMeta} from './fields.js?v=130';
import {fetchLiveBundle,extractField,lodForZoom,isRateBlocked,fetchPointForecast} from './meteo.js?v=130';
import {createHazardLayer,refreshHazards} from './hazards.js?v=130';
import {listReports,addReport,reportTypes,advectReports,clearExpired} from './reports.js?v=130';
import {createRefLayer,loadBorders,projectScreen} from './ref.js?v=130';
import {renderForecastPanel,setForecastLoading,setForecastError} from './forecast.js?v=130';
if(MOBILE)document.body.classList.add('wx-mobile');
const PERF={mobile:MOBILE,dpr:MOBILE?1:Math.min(devicePixelRatio||1,2),ovScale:MOBILE?0.32:0.6};
const LAYERS=[
{key:'temperature_2m',name:'Temperature 2m',unitSi:'°C',unitUs:'°F',kind:'temp',soft:0,pack:true,group:'atmosphere',barMin:-20,barMax:40},
{key:'apparent_temperature',name:'Feels like',unitSi:'°C',unitUs:'°F',kind:'temp',soft:0,pack:true,group:'atmosphere',barMin:-20,barMax:40},
{key:'dewpoint_2m',name:'Dew point',unitSi:'°C',unitUs:'°F',kind:'temp',soft:0,pack:true,group:'atmosphere',barMin:-20,barMax:30},
{key:'relative_humidity_2m',name:'Humidity',unitSi:'%',unitUs:'%',kind:'pct',soft:0,pack:true,group:'atmosphere',barMin:0,barMax:100},
{key:'precipitation',name:'Precipitation',unitSi:'mm',unitUs:'in',kind:'precip',soft:1,pack:true,group:'moisture',barMin:0,barMax:10},
{key:'cloud_cover',name:'Cloud cover',unitSi:'%',unitUs:'%',kind:'pct',soft:.4,pack:true,group:'moisture',barMin:0,barMax:100},
{key:'pressure_msl',name:'MSL pressure',unitSi:'hPa',unitUs:'inHg',kind:'pres',soft:0,pack:true,group:'dynamics',barMin:980,barMax:1040},
{key:'wind_speed_10m',name:'Wind 10m',unitSi:'m/s',unitUs:'mph',kind:'wind',soft:0,pack:true,group:'dynamics',barMin:0,barMax:30},
{key:'cape',name:'CAPE',unitSi:'J/kg',unitUs:'J/kg',kind:'cape',soft:.4,pack:true,group:'dynamics',barMin:0,barMax:3000},
{key:'uv_index',name:'UV index',unitSi:'',unitUs:'',kind:'uv',soft:0,pack:true,group:'solar',barMin:0,barMax:12},
{key:'visibility',name:'Visibility',unitSi:'km',unitUs:'mi',kind:'vis',soft:0,pack:true,group:'solar',barMin:0,barMax:50}
];
const GROUP_ORDER=['atmosphere','moisture','dynamics','solar'];
const KIND_CUE={temp:'Cold ← → Hot',precip:'Dry ← → Wet',pct:'Low ← → High',pres:'Low ← → High',wind:'Calm ← → Strong',cape:'Stable ← → Unstable',uv:'Low ← → Extreme',vis:'Poor ← → Clear'};
const PRESETS={
thermal:[[0.05,0.05,0.35],[0.1,0.25,0.75],[0.2,0.7,0.95],[0.95,0.95,0.55],[0.95,0.45,0.1],[0.7,0.05,0.05]],
precip:[[0.05,0.1,0.25],[0.1,0.4,0.8],[0.2,0.8,0.95],[0.95,0.98,1]],
jet:[[0.1,0.1,0.9],[0,0.9,0.9],[0,0.9,0],[0.95,0.95,0],[0.95,0.1,0]],
turbo:[[0.4,0.05,0.55],[0.1,0.35,0.85],[0.1,0.85,0.55],[0.95,0.9,0.2],[0.95,0.25,0.1]],
inferno:[[0.02,0.02,0.08],[0.15,0.05,0.45],[0.7,0.15,0.55],[0.95,0.55,0.2],[1,0.95,0.7]],
viridis:[[0.27,0,0.33],[0.13,0.37,0.55],[0.16,0.62,0.42],[0.7,0.87,0.17],[0.99,0.91,0.14]],
gray:[[0,0,0],[1,1,1]]
};
const KIND_PRESET={temp:'thermal',precip:'precip',pct:'turbo',pres:'jet',wind:'jet',cape:'inferno',uv:'inferno',vis:'gray'};
const state={
layer:0,preset:'thermal',opacity:0.7,reverse:false,autorange:true,units:'si',
mode:'pack',tIndex:0,hours:[],field:null,vmin:0,vmax:1,gamma:1,soft:null,
stops:PRESETS.thermal.map(c=>c.slice()),basemap:'cartoDark',
lat:39.5,lon:-98.35,zoom:4.2,probe:null,panning:false,windOn:true,isoOn:false,
windU:null,windV:null,isoLines:null,bounds:{lat0:-85,lat1:85,lon0:-180,lon1:180},
lut:null,lutKey:'',gen:0,raf:0,drag:null,vel:{x:0,y:0},hazards:[],hazOn:true,warnOn:true,watchOn:true,advisoryOn:true,otherHazOn:true,hoverOn:true,lastHaz:0,capeF:null,precipF:null,
placeLabel:'',sugIdx:-1,sugHits:[],geoDone:false,citiesOn:true,bordersOn:true,pinOn:true,probeInfo:null,
fcData:null,fcTab:'summary',fcOpen:false,fcTimer:0,fcGen:0,sheet:null,statusT:0,pinching:false,pinch:null,ptrs:new Map()
};
const el=id=>document.getElementById(id);
function softApiMsg(msg){
const m=String(msg||'');
if(/429|rate limited|cooling down|switch to Pack|use Pack|API busy|busy/i.test(m))return state.mode==='pack'?'Forecast delayed (API limit) — map pack OK':'API busy — try Pack mode';
return m;
}
const status=(t,opts={})=>{
const s=el('status-text');const box=el('status');if(!s)return;
let html=t;
if(/warn/.test(t)){const plain=t.replace(/<[^>]+>/g,'');html=`<span class="warn">${softApiMsg(plain)}</span>`;}
s.innerHTML=html;
if(box){box.classList.add('toast');box.classList.remove('hide');}
clearTimeout(state.statusT);
const ms=opts.hold!=null?opts.hold:(/warn/.test(String(t))?4500:3200);
state.statusT=setTimeout(()=>{if(box)box.classList.add('hide');},ms);
};
const map=el('map'),ov=el('overlay');
const mctx=map.getContext('2d',{alpha:false});
const octx=ov.getContext('2d',{alpha:true});
const getBasemap=()=>BASEMAPS[state.basemap]||BASEMAPS.satellite;
const L=()=>LAYERS[state.layer]||LAYERS[0];
const windLayer=createWindLayer(el('wind'),{
lonToX,latToY,xToLon,yToLat,clampZoom,PERF,
getView:()=>({lat:state.lat,lon:state.lon,zoom:state.zoom,bm:getBasemap(),panning:state.panning||state.pinching})
});
const hazLayer=createHazardLayer(el('haz'),{
lonToX,latToY,clampZoom,PERF,
getView:()=>({lat:state.lat,lon:state.lon,zoom:state.zoom,bm:getBasemap()})
});
const refLayer=createRefLayer(el('ref'),{
lonToX,latToY,clampZoom,PERF,
getView:()=>({lat:state.lat,lon:state.lon,zoom:state.zoom,bm:getBasemap(),panning:state.panning||state.pinching})
});
async function reloadHazards(){
clearExpired();
let capeF=state.capeF,precipF=state.precipF;
try{if(!capeF)capeF=await getHourField('cape',state.tIndex);}catch{}
try{if(!precipF)precipF=await getHourField('precipitation',state.tIndex);}catch{}
state.capeF=capeF;state.precipF=precipF;
let windMeta=null,wu=state.windU,wv=state.windV;
try{
const u=await getHourField('wind_u',state.tIndex);const v=await getHourField('wind_v',state.tIndex);
wu=u.data;wv=v.data;windMeta={w:u.w,h:u.h,lat0:u.lat0,lat1:u.lat1,lon0:u.lon0,lon1:u.lon1};
}catch{}
const reps=advectReports(wu,wv,windMeta);
const pack=await refreshHazards({zoom:state.zoom,capeField:capeF,precipField:precipF,tIndex:state.tIndex,reports:reps});
state.hazards=pack.all;hazLayer.setItems(state.hazards);state.lastHaz=Date.now();
const nEq=pack.eq.length,nV=pack.volc.length,nA=pack.nws.length,nR=reps.length;
const nW=(pack.nws||[]).filter(a=>a.classif==='warning').length;
const nWa=(pack.nws||[]).filter(a=>a.classif==='watch').length;
const nAd=(pack.nws||[]).filter(a=>a.classif==='advisory').length;
const nZ=(pack.nws||[]).filter(a=>a.rings&&a.rings.length).length;
if(el('haz-count'))el('haz-count').textContent=`${nW} warn · ${nWa} watch · ${nAd} adv · ${nZ} zones · ${nEq} quake · ${nV} volc · ${nR} report`;
if(el('haz-legend'))el('haz-legend').innerHTML='<span class="hz warn">■ Warning</span><span class="hz watch">■ Watch</span><span class="hz adv">■ Advisory</span><span class="hz other">● Quake/volc</span>';
}
function lerp3(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function colorAt(t){
let x=Math.max(0,Math.min(1,t));if(state.reverse)x=1-x;
if(state.gamma!==1)x=Math.pow(x,1/Math.max(0.2,state.gamma));
const s=state.stops,n=s.length-1,p=x*n,i=Math.min(n-1,p|0),f=p-i,c=lerp3(s[i],s[i+1],f);
return[(c[0]*255)|0,(c[1]*255)|0,(c[2]*255)|0];
}
function ensureLut(){
const key=state.preset+'|'+state.reverse+'|'+state.gamma+'|'+state.stops.map(c=>c.join()).join(';');
if(state.lut&&state.lutKey===key)return state.lut;
const lut=new Uint8Array(256*3);
for(let i=0;i<256;i++){const[r,g,b]=colorAt(i/255);lut[i*3]=r;lut[i*3+1]=g;lut[i*3+2]=b;}
state.lut=lut;state.lutKey=key;return lut;
}
function formatVal(raw,meta){
const m=meta||L(),toUs=state.units==='us',k=m.kind;let v=raw,u=m.unitSi;
if(k==='temp'){v=toUs?raw*9/5+32:raw;u=toUs?'°F':'°C';}
else if(k==='wind'){v=toUs?raw*2.236936:raw;u=toUs?'mph':'m/s';}
else if(k==='precip'){v=toUs?raw/25.4:raw;u=toUs?'in':'mm';}
else if(k==='pres'){v=toUs?raw*0.02953:raw;u=toUs?'inHg':'hPa';}
else if(k==='vis'){const km=raw>200?raw/1000:raw;v=toUs?km*0.621371:km;u=toUs?'mi':'km';}
else u=m.unitSi||'';
return{v,u};
}
function softFactor(){return state.soft!=null?state.soft:(L().soft||0);}
function legendBar(){
const c=document.createElement('canvas');c.width=256;c.height=1;const g=c.getContext('2d');
const img=g.createImageData(256,1);const lut=ensureLut();
for(let i=0;i<256;i++){const o=i*4,l=i*3;img.data[o]=lut[l];img.data[o+1]=lut[l+1];img.data[o+2]=lut[l+2];img.data[o+3]=255;}
g.putImageData(img,0,0);el('leg-bar').style.background=`url(${c.toDataURL()})`;el('leg-bar').style.backgroundSize='100% 100%';
}
function updateLegend(){
const lo=formatVal(state.vmin),hi=formatVal(state.vmax);
el('leg-title').textContent=L().name;
el('leg-lo').textContent=`${lo.v.toFixed(1)} ${lo.u}`;
el('leg-hi').textContent=`${hi.v.toFixed(1)} ${hi.u}`;
const cue=el('leg-cue');if(cue)cue.textContent=KIND_CUE[L().kind]||'';
const mid=el('leg-mid');if(mid){const mv=(state.vmin+state.vmax)/2;const mf=formatVal(mv);mid.title=`mid ${mf.v.toFixed(1)} ${mf.u}`;}
legendBar();
el('attr').textContent=`${getBasemap().attr} · Fields ${state.mode==='pack'?'prebaked pack':state.mode} · Amni-Weather`;
}
function applyField(packField){
state.field=packField;
state.bounds={lat0:packField.lat0,lat1:packField.lat1,lon0:packField.lon0,lon1:packField.lon1};
if(state.autorange){
const st=fieldStats(packField);const pad=(st[1]-st[0])*0.05||1;
state.vmin=st[0]-pad;state.vmax=st[1]+pad;
}else{state.vmin=+el('rmin').value;state.vmax=+el('rmax').value;}
updateLegend();
}
async function loadPackLayer(){
const key=L().key;
const f=await getHourField(key,state.tIndex);
applyField(f);
const u=await getHourField('wind_u',state.tIndex);
const v=await getHourField('wind_v',state.tIndex);
const p=await getHourField('pressure_msl',state.tIndex);
state.windU=u.data;state.windV=v.data;
windLayer.setFields(u.data,v.data,u.w,u.h,{lat0:u.lat0,lat1:u.lat1,lon0:u.lon0,lon1:u.lon1});
state.isoLines=state.isoOn?buildIsoPolylines(p.data,p.w,p.h,{lat0:p.lat0,lat1:p.lat1,lon0:p.lon0,lon1:p.lon1},6):null;
const hours=packHours();
state.hours=hours;
el('t-slider').max=String(Math.max(0,hours.length-1));
el('t-label').textContent=hours[state.tIndex]||`h${state.tIndex}`;
status(`<span class="ok">Pack ${f.w}×${f.h} · ${hours.length}h · stream-only render</span>`);
}
async function refresh(){
try{
if(state.mode==='pack'){
await loadPackLayer();
}else if(state.mode==='live'){
if(typeof isRateBlocked==='function'&&isRateBlocked()){throw new Error('Live map API busy — stay on Pack');}status('Live Open-Meteo…');
const bundle=await fetchLiveBundle({lat:state.lat,lon:state.lon,zoom:state.zoom,activeKey:L().key,onStatus:status});
const pts=extractField(bundle,L().key,Math.min(state.tIndex,Math.max(0,(bundle.hours?.length||1)-1)));
const w=pts.b?Math.max(60,Math.round((pts.b.lon1-pts.b.lon0))):180;
const h=pts.b?Math.max(30,Math.round((pts.b.lat1-pts.b.lat0)/2)):90;
const data=new Float32Array(w*h);
for(let j=0;j<h;j++)for(let i=0;i<w;i++){
const lat=pts.b.lat1+(pts.b.lat0-pts.b.lat1)*(j/(h-1));
const lon=pts.b.lon0+(pts.b.lon1-pts.b.lon0)*(i/(w-1));
let best=0,bd=1e9;
for(let k=0;k<pts.lats.length;k++){
const d=(pts.lats[k]-lat)**2+((pts.lons[k]-lon)*0.7)**2;
if(d<bd){bd=d;best=pts.vals[k];}
}
data[j*w+i]=best;
}
applyField({data,w,h,lat0:pts.b.lat0,lat1:pts.b.lat1,lon0:pts.b.lon0,lon1:pts.b.lon1});
state.hours=bundle.hours||[];
el('t-slider').max=String(Math.max(0,state.hours.length-1));
status(`<span class="ok">Live ${bundle.lats.length} pts</span>`);
}else{
const man=packMeta()||await loadManifest();
const w=man.w,h=man.h;
const data=new Float32Array(w*h);
for(let j=0;j<h;j++)for(let i=0;i<w;i++)data[j*w+i]=Math.sin(i*0.08+state.tIndex)*10+Math.cos(j*0.1)*8+15;
applyField({data,w,h,lat0:man.lat0,lat1:man.lat1,lon0:man.lon0,lon1:man.lon1});
status('<span class="ok">Demo field</span>');
}
if(state.hazOn)reloadHazards().catch(()=>{});
schedule(true);
}catch(e){
console.error(e);
status(`<span class="warn">${e.message||e}</span>`);
if(state.mode!=='pack'){state.mode='pack';setModeUI();await loadPackLayer();schedule(true);}
}
}
function project(lat,lon){
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr*PERF.ovScale;
const cx=lonToX(state.lon,z)*scale*dpr,cy=latToY(state.lat,z)*scale*dpr;
return{x:lonToX(lon,z)*scale*dpr-cx+ov.width/2,y:latToY(lat,z)*scale*dpr-cy+ov.height/2};
}
function drawBasemap(gen){
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;const W=map.width,H=map.height;
const cx=lonToX(state.lon,z)*scale*dpr,cy=latToY(state.lat,z)*scale*dpr;
const left=cx-W/2,top=cy-H/2,ts=256*scale*dpr;
const pad=state.panning?0:1;
const tx0=Math.floor(left/ts)-pad,tx1=Math.floor((left+W)/ts)+pad;
const ty0=Math.floor(top/ts)-pad,ty1=Math.floor((top+H)/ts)+pad;
mctx.fillStyle='#0b121c';mctx.fillRect(0,0,W,H);
const jobs=[];
for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){
jobs.push(loadTile(B,z,tx,ty).then(im=>{
if(gen!==state.gen||!im)return;
mctx.drawImage(im,tx*ts-left,ty*ts-top,ts+0.5,ts+0.5);
}));
}
return Promise.all(jobs);
}
function drawOverlay(){
octx.clearRect(0,0,ov.width,ov.height);
if(!state.field||(state.panning&&PERF.mobile))return;
const f=state.field,{data,w,h,lat0,lat1,lon0,lon1}=f;
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr*PERF.ovScale;const W=ov.width,H=ov.height;
const cx=lonToX(state.lon,z)*scale*dpr,cy=latToY(state.lat,z)*scale*dpr;
const left=cx-W/2,top=cy-H/2,sScale=scale*dpr;
const step=PERF.mobile?3:2;
const img=octx.createImageData(W,H);const px=img.data;
const span=Math.max(Math.abs(state.vmax-state.vmin),1e-6),inv=1/span,lut=ensureLut(),soft=softFactor(),op=state.opacity;
const latSpan=lat1-lat0,lonSpan=lon1-lon0;
for(let py=0;py<H;py+=step){
const lat=yToLat((top+py)/sScale,z);
if(lat<lat0||lat>lat1)continue;
const v=Math.max(0,Math.min(1,(lat1-lat)/latSpan));
for(let px0=0;px0<W;px0+=step){
const lon=xToLon((left+px0)/sScale,z);
let u=(lon-lon0)/lonSpan;u=((u%1)+1)%1;
const x=u*(w-1),y=v*(h-1);
const x0=x|0,y0=y|0,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
const i=(xx,yy)=>data[yy*w+xx];
const val=i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx+((i(x0,y1)+(i(x1,y1)-i(x0,y1))*fx)-(i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx))*fy;
let t=(val-state.vmin)*inv;if(t<0)t=0;else if(t>1)t=1;
const li=(t*255)|0,lo=li*3,r=lut[lo],g=lut[lo+1],b=lut[lo+2];
let a=op;if(soft>0.01){const gate=t<=0.02?0:t>=0.2?1:(t-0.02)/0.18;a*=Math.max(0,Math.min(1,gate));}
const aa=(a*255)|0;if(aa<4)continue;
const yMax=Math.min(step,H-py),xMax=Math.min(step,W-px0);
for(let dy=0;dy<yMax;dy++){let o=((py+dy)*W+px0)*4;for(let dx=0;dx<xMax;dx++){px[o]=r;px[o+1]=g;px[o+2]=b;px[o+3]=aa;o+=4;}}
}
}
octx.putImageData(img,0,0);
if(state.isoOn&&state.isoLines&&!state.panning)drawIsoPolylines(octx,state.isoLines,project,PERF);
}
let busy=false,pending=false,pendingFull=false,schedFull=false;
async function render(full){
if(busy){pending=true;pendingFull=pendingFull||!!full;return;}
busy=true;const gen=++state.gen;
try{
await drawBasemap(gen);
const moving=state.panning||state.pinching;
if(gen===state.gen&&(full||!moving))drawOverlay();
else if(gen===state.gen&&moving&&PERF.mobile)octx.clearRect(0,0,ov.width,ov.height);
if(gen===state.gen){refLayer.draw(state.probe);updateLocMarker();}
}finally{busy=false;if(pending){const f=pendingFull;pending=false;pendingFull=false;render(f);}}
}
function schedule(full){
schedFull=schedFull||!!full;
if(state.raf)return;
state.raf=requestAnimationFrame(()=>{
state.raf=0;
const f=schedFull;schedFull=false;
render(!!f||!(state.panning||state.pinching));
});
}
function resize(){
const dpr=PERF.dpr,w=innerWidth,h=innerHeight;
map.width=(w*dpr)|0;map.height=(h*dpr)|0;map.style.width=w+'px';map.style.height=h+'px';
ov.width=(w*dpr*PERF.ovScale)|0;ov.height=(h*dpr*PERF.ovScale)|0;ov.style.width=w+'px';ov.style.height=h+'px';
windLayer.resize();hazLayer.resize();refLayer.resize();schedule(true);
}
function screenToLL(cx,cy){
const r=map.getBoundingClientRect();const dpr=PERF.dpr;
const px=(cx-r.left)*dpr,py=(cy-r.top)*dpr;
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const cx0=lonToX(state.lon,z)*scale*dpr,cy0=latToY(state.lat,z)*scale*dpr;
return{lat:yToLat((cy0-map.height/2+py)/(scale*dpr),z),lon:xToLon((cx0-map.width/2+px)/(scale*dpr),z)};
}
function panBy(dx,dy){
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;const cx=lonToX(state.lon,z)*scale*dpr-dx,cy=latToY(state.lat,z)*scale*dpr-dy;
state.lon=xToLon(cx/(scale*dpr),z);state.lat=Math.max(-85,Math.min(85,yToLat(cy/(scale*dpr),z)));
schedule(false);
}
function zoomAt(cx,cy,dz){
if(!Number.isFinite(dz)||dz===0)return;
const before=screenToLL(cx,cy);
const prev=state.zoom;
state.zoom=clampZoom(state.zoom+dz,getBasemap());
if(state.zoom===prev){schedule(true);return;}
const after=screenToLL(cx,cy);
state.lon+=before.lon-after.lon;
state.lat=Math.max(-85,Math.min(85,state.lat+(before.lat-after.lat)));
try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}
schedule(true);
if(state.hazOn&&Date.now()-state.lastHaz>8000)reloadHazards().catch(()=>{});
}
function wheelDelta(e){
let dy=e.deltaY;
if(e.deltaMode===1)dy*=16;
if(e.deltaMode===2)dy*=innerHeight;
const mag=Math.min(1.2,Math.abs(dy)/80);
return(dy<0?1:-1)*Math.max(0.12,Math.min(0.55,mag*0.35));
}
function setModeUI(){
['go-pack','go-live','go-demo'].forEach(id=>{const b=el(id);if(b)b.classList.toggle('on',(id==='go-pack'&&state.mode==='pack')||(id==='go-live'&&state.mode==='live')||(id==='go-demo'&&state.mode==='demo'));});
}
function nearHazards(lat,lon,km=80){
const out=[];
for(const h of state.hazards||[]){
const dlat=(h.lat-lat)*111,dlon=(h.lon-lon)*111*Math.cos(lat*Math.PI/180);
const d=Math.hypot(dlat,dlon);if(d<=km)out.push({...h,dist:d});
}
return out.sort((a,b)=>a.dist-b.dist).slice(0,4);
}
function barPct(raw,meta){
const lo=meta.barMin??0,hi=meta.barMax??100,span=hi-lo||1;
return Math.max(0,Math.min(100,((raw-lo)/span)*100));
}
function feelLine(rows){
const t=rows.find(r=>r.key==='temperature_2m'||r.key==='apparent_temperature');
const h=rows.find(r=>r.key==='relative_humidity_2m');
const w=rows.find(r=>r.key==='wind_speed_10m');
const p=rows.find(r=>r.key==='precipitation');
const c=rows.find(r=>r.key==='cape');
const bits=[];
if(t&&Number.isFinite(t.raw))bits.push(t.raw>=28?'Hot':t.raw>=18?'Mild':t.raw>=8?'Cool':'Cold');
if(h&&Number.isFinite(h.raw))bits.push(h.raw>=75?'humid':h.raw>=45?'moderate RH':'dry');
if(w&&Number.isFinite(w.raw))bits.push(w.raw>=12?'windy':w.raw>=5?'breezy':'calm');
if(p&&Number.isFinite(p.raw)&&p.raw>0.2)bits.push('precip');
if(c&&Number.isFinite(c.raw)&&c.raw>1000)bits.push('unstable');
return bits.length?bits.join(' · '):'';
}
async function multiSample(lat,lon){
const keys=['temperature_2m','apparent_temperature','relative_humidity_2m','wind_speed_10m','precipitation','pressure_msl','cloud_cover','cape','dewpoint_2m','uv_index','visibility'];
const rows=[];
for(const k of keys){
try{
const f=k===L().key&&state.field?state.field:await getHourField(k,state.tIndex);
const raw=sampleField(f,lat,lon);if(!Number.isFinite(raw))continue;
const meta=LAYERS.find(x=>x.key===k)||{key:k,kind:'pct',unitSi:'',name:k,barMin:0,barMax:100};
const fv=formatVal(raw,meta);
rows.push({key:k,name:meta.name,raw,v:fv.v,u:fv.u,pct:barPct(raw,meta)});
}catch{}
}
return rows;
}
function renderProbeInfo(rows){
const box=el('probe-info');if(!box)return;
box.innerHTML=rows.map(r=>`<div class="pmet"><span class="pl">${r.name}</span><span class="pv">${r.v.toFixed(1)} ${r.u}</span><div class="pbar"><i style="width:${r.pct.toFixed(0)}%"></i></div></div>`).join('');
const feel=el('probe-feel');if(feel)feel.textContent=feelLine(rows);
}
function updateLocMarker(){
const mk=el('loc-marker');if(!mk)return;
if(!state.pinOn||!state.probe){mk.hidden=true;return;}
const view={lat:state.lat,lon:state.lon,zoom:state.zoom,bm:getBasemap()};
const p=projectScreen(state.probe.lat,state.probe.lon,view,map,PERF);
if(!p.on){mk.hidden=true;return;}
mk.hidden=false;mk.style.left=p.x+'px';mk.style.top=p.y+'px';
const raw=state.field?sampleField(state.field,state.probe.lat,state.probe.lon):NaN;
const f=formatVal(raw);
const title=el('lc-title'),val=el('lc-val'),unit=el('lc-unit'),sub=el('lc-sub');
if(title)title.textContent=state.placeLabel||'Selected location';
if(val)val.textContent=Number.isFinite(f.v)?f.v.toFixed(1):'—';
if(unit)unit.textContent=f.u?` ${f.u}`:'';
if(sub)sub.textContent=`${state.probe.lat.toFixed(3)}°, ${state.probe.lon.toFixed(3)}° · ${L().name}`;
}
function clearPin(){
state.probe=null;state.placeLabel='';state.probeInfo=null;state.fcData=null;
const mk=el('loc-marker');if(mk)mk.hidden=true;
el('probe')?.classList.remove('open','sheet-open');
const pi=el('probe-info');if(pi)pi.innerHTML='';
const pf=el('probe-feel');if(pf)pf.textContent='';
const fc=el('forecast');if(fc){setForecastLoading(fc,'Drop a pin or locate to load forecast');}
if(state.sheet==='probe')closeSheets();
}
function isMobileUI(){return MOBILE||matchMedia('(max-width:720px)').matches;}
function closeSheets(){
state.sheet=null;
document.body.classList.remove('sheet-active');
['layers','probe','forecast'].forEach(id=>{const n=el(id);if(n)n.classList.remove('sheet-open');});
const fc=el('forecast');if(fc&&isMobileUI()){fc.classList.remove('open');state.fcOpen=false;}
const bd=el('sheet-backdrop');if(bd)bd.hidden=true;
document.querySelectorAll('#m-dock .md-btn').forEach(b=>b.classList.remove('on'));
el('md-map')?.classList.add('on');
}
function openSheet(name){
if(!isMobileUI()){
if(name==='forecast'){state.fcOpen=true;el('forecast')?.classList.add('open');scheduleForecast(true);return;}
if(name==='probe')el('probe')?.classList.add('open');
if(name==='layers'){/* desktop always visible */}
return;
}
if(state.sheet===name){closeSheets();return;}
closeSheets();
state.sheet=name;
document.body.classList.add('sheet-active');
const n=el(name);if(n)n.classList.add('sheet-open');
if(name==='forecast'){n?.classList.add('open');state.fcOpen=true;scheduleForecast(true);}
if(name==='probe'&&!state.probe){el('probe')?.classList.add('open');}
const bd=el('sheet-backdrop');if(bd)bd.hidden=false;
document.querySelectorAll('#m-dock .md-btn').forEach(b=>b.classList.toggle('on',b.dataset.sheet===name||(name==null&&b.id==='md-map')));
const mapBtn=el('md-map');if(mapBtn)mapBtn.classList.toggle('on',false);
const active=document.querySelector(`#m-dock .md-btn[data-sheet="${name}"]`);if(active)active.classList.add('on');
}
function forecastTarget(){
return state.probe?{lat:state.probe.lat,lon:state.probe.lon}:{lat:state.lat,lon:state.lon};
}
function paintForecast(){
const root=el('forecast');if(!root)return;
if(state.fcOpen||root.classList.contains('sheet-open'))root.classList.add('open');
else if(!isMobileUI())root.classList.remove('open');
renderForecastPanel(root,state.fcData,{us:state.units==='us',tab:state.fcTab,place:state.placeLabel||undefined});
}
async function loadForecast(force){
const root=el('forecast');if(!root)return;
if(isMobileUI()&&!root.classList.contains('sheet-open')&&!force)return;
const t=forecastTarget();
const gen=++state.fcGen;
if(isRateBlocked()){
setForecastError(root,softApiMsg('API busy'));
if(force||root.classList.contains('sheet-open')){root.classList.add('open');state.fcOpen=true;}
return;
}
setForecastLoading(root,'Loading forecast…');
if(force||!isMobileUI()){root.classList.add('open');state.fcOpen=true;}
try{
const data=await fetchPointForecast(t.lat,t.lon,{days:7,marine:true,air:true});
if(gen!==state.fcGen)return;
state.fcData=data;
paintForecast();
status(`<span class="ok">Forecast ready</span>`);
}catch(e){
if(gen!==state.fcGen)return;
const msg=softApiMsg(e.message||e);
setForecastError(root,msg);
status(`<span class="warn">${msg}</span>`);
}
}
function scheduleForecast(force){
if(isMobileUI()&&!force&&state.sheet!=='forecast'&&!el('forecast')?.classList.contains('sheet-open'))return;
clearTimeout(state.fcTimer);
state.fcTimer=setTimeout(()=>loadForecast(!!force),force?80:450);
}
function showProbe(lat,lon,opts={}){
const hover=!!opts.hover;
const raw=state.field?sampleField(state.field,lat,lon):NaN;
const f=formatVal(raw);
if(!hover){state.probe={lat,lon};if(!opts.keepPlace)state.placeLabel=opts.label||'';}
const chip=el('hover-chip');
if(hover){
if(!state.hoverOn||!chip)return;
chip.classList.add('open');
chip.style.left=Math.min(innerWidth-220,Math.max(8,(opts.x||0)+14))+'px';
chip.style.top=Math.min(innerHeight-120,Math.max(8,(opts.y||0)+14))+'px';
chip.innerHTML=`<b>${lat.toFixed(2)}°, ${lon.toFixed(2)}°</b><div>${L().name}: <strong>${Number.isFinite(f.v)?f.v.toFixed(1):'—'}</strong> ${f.u||''}</div>`;
return;
}
el('probe').classList.add('open');
if(chip)chip.classList.remove('open');
const place=state.placeLabel?` · ${state.placeLabel}`:'';
el('probe-coords').textContent=`${lat.toFixed(3)}°, ${lon.toFixed(3)}°${place}`;
el('probe-val').textContent=Number.isFinite(f.v)?f.v.toFixed(2):'—';
el('probe-unit').textContent=f.u;
const near=nearHazards(lat,lon);
const hz=near.length?('Nearby: '+near.map(h=>`${h.title||h.kind} ${h.dist.toFixed(0)}km`).join(' · ')):'';
el('probe-meta').textContent=`${getBasemap().label} · z${state.zoom.toFixed(1)} · ${state.mode}${hz?'\n'+hz:''}`;
updateLocMarker();
multiSample(lat,lon).then(rows=>{
if(state.probe&&Math.abs(state.probe.lat-lat)<1e-6){renderProbeInfo(rows);state.probeInfo=rows;updateLocMarker();}
}).catch(()=>{});
if(!opts.skipRev&&!opts.label){
reverseLabel(lat,lon).then(name=>{
if(!state.probe||Math.abs(state.probe.lat-lat)>1e-6)return;
if(name){state.placeLabel=name;el('probe-coords').textContent=`${lat.toFixed(3)}°, ${lon.toFixed(3)}° · ${name}`;updateLocMarker();if(state.fcData||state.sheet==='forecast')paintForecast();}
}).catch(()=>{});
}
if(isMobileUI()){
if(opts.openSheet!==false)openSheet('probe');
}else{
scheduleForecast(false);
}
}
function hideSuggest(){
const s=el('suggest');if(!s)return;s.hidden=true;s.innerHTML='';state.sugHits=[];state.sugIdx=-1;
const q=el('q');if(q)q.setAttribute('aria-expanded','false');
}
function renderSuggest(hits){
const s=el('suggest');if(!s)return;
state.sugHits=hits;state.sugIdx=hits.length?0:-1;
if(!hits.length){hideSuggest();return;}
s.hidden=false;el('q')?.setAttribute('aria-expanded','true');
s.innerHTML=hits.map((h,i)=>{
const sub=[h.admin1,h.country].filter(Boolean).join(' · ');
const elev=Number.isFinite(h.elevation)?`<span class="se">${Math.round(h.elevation)} m</span>`:'';
return`<button type="button" class="sug-item${i===state.sugIdx?' active':''}" role="option" data-i="${i}"><span class="sn">${h.name}</span><span class="sd">${sub||`${h.latitude.toFixed(2)}, ${h.longitude.toFixed(2)}`}</span>${elev}</button>`;
}).join('');
s.querySelectorAll('.sug-item').forEach(b=>{
b.onmouseenter=()=>{state.sugIdx=+b.dataset.i;s.querySelectorAll('.sug-item').forEach((x,j)=>x.classList.toggle('active',j===state.sugIdx));};
b.onclick=()=>pickSuggest(+b.dataset.i);
});
}
function pickSuggest(i){
const h=state.sugHits[i];if(!h)return;
goToPlace(h.latitude,h.longitude,h.name,h);
hideSuggest();
}
function goToPlace(lat,lon,label,hit){
state.lat=lat;state.lon=lon;state.zoom=Math.max(state.zoom,hit?.feature_code?.startsWith('PPLC')?9:8);
state.placeLabel=label||'';
if(el('q')&&label)el('q').value=label;
const bits=[label,hit?.admin1,hit?.country].filter(Boolean).join(', ');
status(`<span class="ok">${bits||`${lat.toFixed(3)}, ${lon.toFixed(3)}`}</span>`);
schedule(true);showProbe(lat,lon,{label:label||'',skipRev:!!label,keepPlace:true});
}
let geoAbort=null,geoTimer=0;
async function geocode(q,count=6){
if(geoAbort)geoAbort.abort();
geoAbort=new AbortController();
const url='https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count='+count+'&language=en&format=json';
const r=await fetch(url,{signal:geoAbort.signal});
const j=await r.json();
return j.results||[];
}
function scheduleSuggest(q){
clearTimeout(geoTimer);
if(!q||q.length<2){hideSuggest();return;}
geoTimer=setTimeout(async()=>{
try{
const hits=await geocode(q,6);
if(el('q')?.value.trim()!==q)return;
renderSuggest(hits);
}catch(e){if(e.name!=='AbortError')hideSuggest();}
},280);
}
async function runSearch(){
const q=el('q').value.trim();if(!q)return;
const m=q.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
if(m){goToPlace(+m[1],+m[2],`${(+m[1]).toFixed(3)}, ${(+m[2]).toFixed(3)}`);hideSuggest();return;}
if(state.sugHits.length&&state.sugIdx>=0){pickSuggest(state.sugIdx);return;}
try{
const hits=await geocode(q,6);
if(!hits.length){status('<span class="warn">No match</span>');hideSuggest();return;}
if(hits.length===1){goToPlace(hits[0].latitude,hits[0].longitude,hits[0].name,hits[0]);hideSuggest();return;}
renderSuggest(hits);
goToPlace(hits[0].latitude,hits[0].longitude,hits[0].name,hits[0]);
}catch{status('<span class="warn">Search failed</span>');}
}
async function reverseLabel(lat,lon){
try{
const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
if(!r.ok)return null;
const j=await r.json();
const city=j.city||j.locality||j.principalSubdivision||'';
const reg=j.principalSubdivision||'';
const ctry=j.countryName||'';
if(city&&reg&&city!==reg)return`${city}, ${reg}`;
if(city)return city+(ctry?`, ${ctry}`:'');
if(reg)return reg+(ctry?`, ${ctry}`:'');
return ctry||null;
}catch{return null;}
}
function locateUser(opts={}){
const btn=el('btn-locate');
if(!navigator.geolocation){status('<span class="warn">Geolocation unavailable</span>');return;}
if(btn){btn.classList.add('locating');btn.classList.remove('located');}
navigator.geolocation.getCurrentPosition(
async p=>{
const lat=p.coords.latitude,lon=p.coords.longitude;
state.lat=lat;state.lon=lon;state.zoom=Math.max(state.zoom,opts.zoom||7.2);state.geoDone=true;
if(btn){btn.classList.remove('locating');btn.classList.add('located');}
let label=(await reverseLabel(lat,lon))||'Your location';
state.placeLabel=label;
if(el('q'))el('q').value=label;
status(`<span class="ok">${label} · located</span>`);
schedule(true);
if(opts.probe!==false)showProbe(lat,lon,{label,skipRev:true,keepPlace:true});
else{state.probe={lat,lon};state.placeLabel=label;updateLocMarker();}
},
err=>{
if(btn)btn.classList.remove('locating');
status(`<span class="warn">${err?.code===1?'Location permission denied':'Location failed'}</span>`);
},
{enableHighAccuracy:false,timeout:opts.timeout||8000,maximumAge:opts.maxAge??600000}
);
}
function wireSections(){
document.querySelectorAll('#layers .wx-sec-hd[data-toggle]').forEach(hd=>{
hd.onclick=()=>{const sec=hd.closest('.wx-sec');if(sec)sec.classList.toggle('open');};
});
}
function setActiveLayerButtons(){
document.querySelectorAll('#layers .lbtn[data-li]').forEach(b=>{
b.classList.toggle('active',+b.dataset.li===state.layer);
});
}
function bindLayerBtn(b,i){
b.onpointermove=e=>{const r=b.getBoundingClientRect();b.style.setProperty('--px',((e.clientX-r.left)/r.width*100)+'%');b.style.setProperty('--py',((e.clientY-r.top)/r.height*100)+'%');};
b.onclick=()=>{
state.layer=i;setActiveLayerButtons();
const meta=LAYERS[i];const p=KIND_PRESET[meta.kind]||'thermal';
state.preset=p;state.stops=PRESETS[p].map(c=>c.slice());state.lut=null;
const sel=el('preset');if(sel)sel.value=p;refresh();
};
}
function initUI(){
wireSections();
GROUP_ORDER.forEach(g=>{
const grid=el('grid-'+g);if(!grid)return;
LAYERS.forEach((meta,i)=>{
if(meta.group!==g)return;
const b=document.createElement('button');b.type='button';b.className='lbtn'+(i===0?' active':'');b.textContent=meta.name;b.dataset.li=String(i);
bindLayerBtn(b,i);grid.appendChild(b);
});
});
const bmRow=el('basemap-row');
Object.values(BASEMAPS).forEach(B=>{
const b=document.createElement('button');b.type='button';b.className='lbtn'+(B.id===state.basemap?' active':'');b.textContent=B.label;
b.onpointermove=e=>{const r=b.getBoundingClientRect();b.style.setProperty('--px',((e.clientX-r.left)/r.width*100)+'%');b.style.setProperty('--py',((e.clientY-r.top)/r.height*100)+'%');};
b.onclick=()=>{state.basemap=B.id;bmRow.querySelectorAll('.lbtn').forEach(x=>x.classList.toggle('active',x.textContent===B.label));updateLegend();schedule(true);};
bmRow.appendChild(b);
});
const pre=el('preset');
Object.keys(PRESETS).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;pre.appendChild(o);});
pre.value=state.preset;
pre.onchange=()=>{state.preset=pre.value;state.stops=PRESETS[state.preset].map(c=>c.slice());state.lut=null;const row=el('stops-row');if(row){row.innerHTML='';state.stops.forEach((c,i)=>{const inp=document.createElement('input');inp.type='color';inp.value='#'+[c[0],c[1],c[2]].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');inp.oninput=()=>{const h=inp.value;state.stops[i]=[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];state.lut=null;updateLegend();schedule(true);};row.appendChild(inp);});}updateLegend();schedule(true);};
pre.onchange();
el('opacity').oninput=e=>{state.opacity=(+e.target.value)/100;el('op-val').textContent=e.target.value+'%';schedule(true);};
el('gamma').oninput=e=>{state.gamma=+e.target.value;el('gamma-val').textContent=(+e.target.value).toFixed(2);state.lut=null;updateLegend();schedule(true);};
el('soft').oninput=e=>{state.soft=+e.target.value;el('soft-val').textContent=(+e.target.value).toFixed(2);schedule(true);};
el('reverse').onchange=e=>{state.reverse=e.target.checked;state.lut=null;updateLegend();schedule(true);};
el('autorange').onchange=e=>{state.autorange=e.target.checked;if(state.field){applyField(state.field);schedule(true);}};
el('smooth')&&(el('smooth').onchange=()=>{});
const wOn=el('wind-on');if(wOn){wOn.checked=state.windOn;wOn.onchange=e=>{state.windOn=e.target.checked;windLayer.setEnabled(state.windOn);};}
const iOn=el('iso-on');if(iOn){iOn.checked=state.isoOn;iOn.onchange=async e=>{state.isoOn=e.target.checked;if(state.isoOn&&state.mode==='pack'){const p=await getHourField('pressure_msl',state.tIndex);state.isoLines=buildIsoPolylines(p.data,p.w,p.h,{lat0:p.lat0,lat1:p.lat1,lon0:p.lon0,lon1:p.lon1},6);}else state.isoLines=null;schedule(true);};}
el('units').onclick=e=>{const b=e.target.closest('button[data-u]');if(!b)return;state.units=b.dataset.u;[...el('units').children].forEach(x=>x.classList.toggle('active',x===b));updateLegend();if(state.probe)showProbe(state.probe.lat,state.probe.lon,{skipRev:true,keepPlace:true,label:state.placeLabel,openSheet:false});if(state.fcData)paintForecast();};
const fcRoot=el('forecast');
if(fcRoot){
fcRoot.querySelectorAll('.fc-tabs button').forEach(b=>{b.onclick=()=>{state.fcTab=b.dataset.tab;paintForecast();};});
el('fc-refresh')&&(el('fc-refresh').onclick=()=>scheduleForecast(true));
el('fc-toggle')&&(el('fc-toggle').onclick=()=>{if(isMobileUI())return;fcRoot.classList.toggle('collapsed');el('fc-toggle').textContent=fcRoot.classList.contains('collapsed')?'▸':'▾';});
}
el('btn-forecast')&&(el('btn-forecast').onclick=()=>{if(isMobileUI())openSheet('forecast');else{state.fcOpen=true;el('forecast')?.classList.add('open');scheduleForecast(true);}});
document.querySelectorAll('[data-close-sheet]').forEach(b=>{b.onclick=e=>{e.stopPropagation();closeSheets();};});
el('sheet-backdrop')&&(el('sheet-backdrop').onclick=()=>closeSheets());
const dock=el('m-dock');
if(dock){
el('md-layers')&&(el('md-layers').onclick=()=>openSheet('layers'));
el('md-forecast')&&(el('md-forecast').onclick=()=>openSheet('forecast'));
el('md-probe')&&(el('md-probe').onclick=()=>openSheet('probe'));
el('md-map')&&(el('md-map').onclick=()=>closeSheets());
}
if(isMobileUI()){
document.querySelectorAll('#layers .wx-sec').forEach(sec=>{
const k=sec.dataset.sec;
if(k!=='basemap'&&k!=='atmosphere')sec.classList.remove('open');
});
closeSheets();
}
el('go-pack').onclick=()=>{state.mode='pack';setModeUI();refresh();};
el('go-live').onclick=()=>{state.mode='live';setModeUI();refresh();};
el('go-demo').onclick=()=>{state.mode='demo';setModeUI();refresh();};
el('btn-refresh').onclick=()=>refresh();
el('btn-search').onclick=()=>runSearch();
el('btn-locate').onclick=()=>locateUser({probe:true,zoom:8});
const qi=el('q');
qi.addEventListener('input',()=>{state.placeLabel='';scheduleSuggest(qi.value.trim());});
qi.addEventListener('keydown',e=>{
if(e.key==='ArrowDown'&&state.sugHits.length){e.preventDefault();state.sugIdx=Math.min(state.sugHits.length-1,state.sugIdx+1);el('suggest')?.querySelectorAll('.sug-item').forEach((x,j)=>x.classList.toggle('active',j===state.sugIdx));return;}
if(e.key==='ArrowUp'&&state.sugHits.length){e.preventDefault();state.sugIdx=Math.max(0,state.sugIdx-1);el('suggest')?.querySelectorAll('.sug-item').forEach((x,j)=>x.classList.toggle('active',j===state.sugIdx));return;}
if(e.key==='Escape'){hideSuggest();return;}
if(e.key==='Enter'){e.preventDefault();runSearch();}
});
qi.addEventListener('blur',()=>setTimeout(hideSuggest,180));
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#search-wrap'))hideSuggest();});
el('t-slider').oninput=e=>{state.tIndex=+e.target.value;refresh();};
el('t-prev').onclick=()=>{state.tIndex=Math.max(0,state.tIndex-1);el('t-slider').value=state.tIndex;refresh();};
el('t-next').onclick=()=>{const mx=+el('t-slider').max;state.tIndex=Math.min(mx,state.tIndex+1);el('t-slider').value=state.tIndex;refresh();};
el('t-play').onclick=(()=>{let t=null;return()=>{if(t){clearInterval(t);t=null;el('t-play').textContent='Play';return;}el('t-play').textContent='Pause';t=setInterval(()=>{const mx=+el('t-slider').max;state.tIndex=state.tIndex>=mx?0:state.tIndex+1;el('t-slider').value=state.tIndex;refresh();},600);};})();
el('zin').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,0.6);
el('zout').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,-0.6);
const stage=el('stage');
stage.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,wheelDelta(e));},{passive:false});
let dragged=false,sx=0,sy=0,lt=0,coasting=false;
function pinchDist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function pinchMid(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
function endPointer(e){
const wasPinch=state.pinching||state.ptrs.size>=2;
state.ptrs.delete(e.pointerId);
try{stage.releasePointerCapture(e.pointerId);}catch{}
if(state.ptrs.size<2){state.pinching=false;state.pinch=null;}
if(state.ptrs.size===0){
const wasDrag=!!state.drag;state.drag=null;state.panning=false;state.pinching=false;
if(wasPinch){try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);return;}
if(!wasDrag)return;
if(!dragged){schedule(true);const ll=screenToLL(e.clientX,e.clientY);showProbe(ll.lat,ll.lon);return;}
if(PERF.mobile&&Math.hypot(state.vel.x,state.vel.y)<0.8){try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);return;}
coasting=true;
const coast=()=>{if(state.drag||state.pinching||!coasting||Math.hypot(state.vel.y,state.vel.x)<0.35){coasting=false;state.panning=false;try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);return;}
state.panning=true;panBy(state.vel.x*PERF.dpr,state.vel.y*PERF.dpr);state.vel.x*=0.88;state.vel.y*=0.88;requestAnimationFrame(coast);};
requestAnimationFrame(coast);
}else if(state.ptrs.size===1){
const only=[...state.ptrs.values()][0];
state.drag={x:only.x,y:only.y};state.panning=true;dragged=true;sx=only.x;sy=only.y;state.vel={x:0,y:0};lt=performance.now();
}
}
stage.addEventListener('pointerdown',e=>{
if(e.button&&e.button!==0)return;
coasting=false;
try{stage.setPointerCapture(e.pointerId);}catch{}
state.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(state.ptrs.size>=2){
state.drag=null;state.panning=false;state.pinching=true;
const pts=[...state.ptrs.values()];
const d=pinchDist(pts[0],pts[1]),m=pinchMid(pts[0],pts[1]);
state.pinch={dist:d,zoom:state.zoom,x:m.x,y:m.y};
return;
}
state.drag={x:e.clientX,y:e.clientY};state.panning=true;dragged=false;sx=e.clientX;sy=e.clientY;lt=performance.now();state.vel={x:0,y:0};
});
let hoverT=0;
stage.addEventListener('pointermove',e=>{
if(state.ptrs.has(e.pointerId))state.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(state.pinching&&state.ptrs.size>=2&&state.pinch){
const pts=[...state.ptrs.values()];
const d=pinchDist(pts[0],pts[1]),m=pinchMid(pts[0],pts[1]);
if(state.pinch.dist>8){
const ratio=d/state.pinch.dist;
const target=state.pinch.zoom+Math.log2(Math.max(0.25,Math.min(4,ratio)));
const dz=target-state.zoom;
if(Math.abs(dz)>0.002)zoomAt(m.x,m.y,dz);
}
state.pinch={dist:d,zoom:state.zoom,x:m.x,y:m.y};
return;
}
if(state.drag){
const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
if(Math.hypot(e.clientX-sx,e.clientY-sy)>5)dragged=true;
const now=performance.now(),dt=Math.max(8,now-lt);state.vel={x:dx/dt*16,y:dy/dt*16};lt=now;
state.drag={x:e.clientX,y:e.clientY};panBy(dx*PERF.dpr,dy*PERF.dpr);
return;
}
if(!state.hoverOn||PERF.mobile)return;
clearTimeout(hoverT);
hoverT=setTimeout(()=>{const ll=screenToLL(e.clientX,e.clientY);showProbe(ll.lat,ll.lon,{hover:true,x:e.clientX,y:e.clientY});},40);
});
stage.addEventListener('pointerleave',()=>el('hover-chip')?.classList.remove('open'));
stage.addEventListener('pointerup',endPointer);
stage.addEventListener('pointercancel',e=>{state.ptrs.delete(e.pointerId);state.drag=null;state.panning=false;state.pinching=false;state.pinch=null;coasting=false;try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);});
addEventListener('resize',resize);
const hOn=el('haz-on');if(hOn){hOn.checked=state.hazOn;hOn.onchange=e=>{state.hazOn=e.target.checked;hazLayer.setEnabled(state.hazOn);if(state.hazOn)reloadHazards();};}
function syncHazFilters(){hazLayer.setFilters({warnings:state.warnOn,watches:state.watchOn,advisories:state.advisoryOn,other:state.otherHazOn});}
syncHazFilters();
[['warn-on','warnOn'],['watch-on','watchOn'],['advisory-on','advisoryOn'],['otherhaz-on','otherHazOn']].forEach(([id,key])=>{
const b=el(id);if(!b)return;b.checked=!!state[key];b.onchange=e=>{state[key]=e.target.checked;syncHazFilters();};
});
const cOn=el('cities-on');if(cOn){cOn.checked=state.citiesOn;cOn.onchange=e=>{state.citiesOn=e.target.checked;refLayer.setCities(state.citiesOn);schedule(true);};}
const bOn=el('borders-on');if(bOn){bOn.checked=state.bordersOn;bOn.onchange=e=>{state.bordersOn=e.target.checked;refLayer.setBorders(state.bordersOn);schedule(true);};}
const pOn=el('pin-on');if(pOn){pOn.checked=state.pinOn;pOn.onchange=e=>{state.pinOn=e.target.checked;updateLocMarker();};}
const clr=el('btn-clear-pin');if(clr)clr.onclick=()=>clearPin();
const hv=el('hover-on');if(hv){hv.checked=state.hoverOn;hv.onchange=e=>{state.hoverOn=e.target.checked;if(!state.hoverOn)el('hover-chip')?.classList.remove('open');};}
const repBtn=el('btn-report');if(repBtn)repBtn.onclick=()=>{
const lat=state.probe?.lat??state.lat,lon=state.probe?.lon??state.lon;
const type=el('rep-type')?.value||'other';
const note=el('rep-note')?.value||'';
const r=addReport({lat,lon,type,note});
status(`<span class="ok">Reported ${r.title} @ ${lat.toFixed(2)},${lon.toFixed(2)}</span>`);
if(el('rep-note'))el('rep-note').value='';
reloadHazards();
};
const repTypes=el('rep-type');
if(repTypes&&!repTypes.options.length){reportTypes().forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=`${t.icon} ${t.label}`;repTypes.appendChild(o);});}
setModeUI();
}
(async()=>{
initUI();
resize();
windLayer.setEnabled(state.windOn);
windLayer.start();
hazLayer.setEnabled(state.hazOn);
hazLayer.start();
refLayer.setCities(state.citiesOn);
refLayer.setBorders(state.bordersOn);
el('op-val').textContent='70%';
el('gamma-val').textContent='1.00';
el('soft-val').textContent='auto';
status('Loading field pack…');
loadBorders('/weather/data/').then(()=>schedule(true)).catch(()=>{});
try{
await loadManifest('/weather/data/');
await preloadCore(0);
await refresh();
if(state.hazOn)await reloadHazards().catch(()=>{});
}catch(e){
console.error(e);
status(`<span class="warn">Pack load failed: ${e.message||e}</span>`);
}
locateUser({probe:false,zoom:6.5,timeout:5000,maxAge:600000});
if(!isMobileUI())scheduleForecast(false);
else status(`<span class="ok">Pack ready · use dock for layers / forecast</span>`,{hold:4000});
})();
