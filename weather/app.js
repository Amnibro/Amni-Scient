import {BASEMAPS,loadTile,lonToX,latToY,xToLon,yToLat,clampZoom,MOBILE} from './tiles.js?v=1.2.0';
import {createWindLayer,buildIsoPolylines,drawIsoPolylines} from './wind.js?v=1.2.0';
import {loadManifest,getHourField,sampleField,fieldStats,preloadCore,packHours,packMeta} from './fields.js?v=1.2.0';
import {fetchLiveBundle,extractField,lodForZoom} from './meteo.js?v=1.2.0';
const PERF={mobile:MOBILE,dpr:MOBILE?1:Math.min(devicePixelRatio||1,2),ovScale:MOBILE?0.32:0.6};
const LAYERS=[
{key:'temperature_2m',name:'Temperature 2m',unitSi:'°C',unitUs:'°F',kind:'temp',soft:0,pack:true},
{key:'apparent_temperature',name:'Feels like',unitSi:'°C',unitUs:'°F',kind:'temp',soft:0,pack:true},
{key:'dewpoint_2m',name:'Dew point',unitSi:'°C',unitUs:'°F',kind:'temp',soft:0,pack:true},
{key:'relative_humidity_2m',name:'Humidity',unitSi:'%',unitUs:'%',kind:'pct',soft:0,pack:true},
{key:'precipitation',name:'Precipitation',unitSi:'mm',unitUs:'in',kind:'precip',soft:1,pack:true},
{key:'cloud_cover',name:'Cloud cover',unitSi:'%',unitUs:'%',kind:'pct',soft:.4,pack:true},
{key:'pressure_msl',name:'MSL pressure',unitSi:'hPa',unitUs:'inHg',kind:'pres',soft:0,pack:true},
{key:'wind_speed_10m',name:'Wind 10m',unitSi:'m/s',unitUs:'mph',kind:'wind',soft:0,pack:true},
{key:'cape',name:'CAPE',unitSi:'J/kg',unitUs:'J/kg',kind:'cape',soft:.4,pack:true},
{key:'uv_index',name:'UV index',unitSi:'',unitUs:'',kind:'uv',soft:0,pack:true},
{key:'visibility',name:'Visibility',unitSi:'km',unitUs:'mi',kind:'vis',soft:0,pack:true}
];
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
stops:PRESETS.thermal.map(c=>c.slice()),basemap:MOBILE?'cartoDark':'satellite',
lat:39.5,lon:-98.35,zoom:4.2,probe:null,panning:false,windOn:true,isoOn:false,
windU:null,windV:null,isoLines:null,bounds:{lat0:-85,lat1:85,lon0:-180,lon1:180},
lut:null,lutKey:'',gen:0,raf:0,drag:null,vel:{x:0,y:0}
};
const el=id=>document.getElementById(id);
const status=t=>{const s=el('status-text');if(s)s.innerHTML=t;};
const map=el('map'),ov=el('overlay');
const mctx=map.getContext('2d',{alpha:false});
const octx=ov.getContext('2d',{alpha:true});
const getBasemap=()=>BASEMAPS[state.basemap]||BASEMAPS.satellite;
const L=()=>LAYERS[state.layer]||LAYERS[0];
const windLayer=createWindLayer(el('wind'),{
lonToX,latToY,xToLon,yToLat,clampZoom,PERF,
getView:()=>({lat:state.lat,lon:state.lon,zoom:state.zoom,bm:getBasemap()})
});
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
function formatVal(raw){
const meta=L(),toUs=state.units==='us',k=meta.kind;let v=raw,u=meta.unitSi;
if(k==='temp'){v=toUs?raw*9/5+32:raw;u=toUs?'°F':'°C';}
else if(k==='wind'){v=toUs?raw*2.236936:raw;u=toUs?'mph':'m/s';}
else if(k==='precip'){v=toUs?raw/25.4:raw;u=toUs?'in':'mm';}
else if(k==='pres'){v=toUs?raw*0.02953:raw;u=toUs?'inHg':'hPa';}
else if(k==='vis'){const km=raw>200?raw/1000:raw;v=toUs?km*0.621371:km;u=toUs?'mi':'km';}
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
status('Live Open-Meteo (may 429)…');
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
let busy=false,pending=false,pendingFull=false;
async function render(full){
if(busy){pending=true;pendingFull=pendingFull||!!full;return;}
busy=true;const gen=++state.gen;
try{
await drawBasemap(gen);
if(gen===state.gen&&(full||!state.panning))drawOverlay();
else if(gen===state.gen&&state.panning&&PERF.mobile)octx.clearRect(0,0,ov.width,ov.height);
}finally{busy=false;if(pending){const f=pendingFull;pending=false;pendingFull=false;render(f);}}
}
function schedule(full){if(state.raf)return;state.raf=requestAnimationFrame(()=>{state.raf=0;render(!!full||!state.panning);});}
function resize(){
const dpr=PERF.dpr,w=innerWidth,h=innerHeight;
map.width=(w*dpr)|0;map.height=(h*dpr)|0;map.style.width=w+'px';map.style.height=h+'px';
ov.width=(w*dpr*PERF.ovScale)|0;ov.height=(h*dpr*PERF.ovScale)|0;ov.style.width=w+'px';ov.style.height=h+'px';
windLayer.resize();schedule(true);
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
const before=screenToLL(cx,cy);state.zoom=clampZoom(state.zoom+dz,getBasemap());
const after=screenToLL(cx,cy);state.lon+=before.lon-after.lon;state.lat=Math.max(-85,Math.min(85,state.lat+(before.lat-after.lat)));
schedule(true);
}
function setModeUI(){
['go-pack','go-live','go-demo'].forEach(id=>{const b=el(id);if(b)b.classList.toggle('on',(id==='go-pack'&&state.mode==='pack')||(id==='go-live'&&state.mode==='live')||(id==='go-demo'&&state.mode==='demo'));});
}
function showProbe(lat,lon){
const raw=state.field?sampleField(state.field,lat,lon):NaN;
const f=formatVal(raw);
state.probe={lat,lon};
el('probe').classList.add('open');
el('probe-coords').textContent=`${lat.toFixed(3)}°, ${lon.toFixed(3)}°`;
el('probe-val').textContent=Number.isFinite(f.v)?f.v.toFixed(2):'—';
el('probe-unit').textContent=f.u;
el('probe-meta').textContent=`${L().name}\n${getBasemap().label} · z${state.zoom.toFixed(1)}\nmode ${state.mode} · precomputed sample`;
}
function initUI(){
const grid=el('layer-grid');
LAYERS.forEach((meta,i)=>{
const b=document.createElement('button');b.type='button';b.className='lbtn'+(i===0?' active':'');b.textContent=meta.name;
b.onclick=()=>{state.layer=i;grid.querySelectorAll('.lbtn').forEach((x,j)=>x.classList.toggle('active',j===i));
const p=KIND_PRESET[meta.kind]||'thermal';state.preset=p;state.stops=PRESETS[p].map(c=>c.slice());state.lut=null;
const sel=el('preset');if(sel)sel.value=p;refresh();};
grid.appendChild(b);
});
const bmRow=el('basemap-row');
Object.values(BASEMAPS).forEach(B=>{
const b=document.createElement('button');b.type='button';b.className='lbtn'+(B.id===state.basemap?' active':'');b.textContent=B.label;
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
el('units').onclick=e=>{const b=e.target.closest('button[data-u]');if(!b)return;state.units=b.dataset.u;[...el('units').children].forEach(x=>x.classList.toggle('active',x===b));updateLegend();if(state.probe)showProbe(state.probe.lat,state.probe.lon);};
el('go-pack').onclick=()=>{state.mode='pack';setModeUI();refresh();};
el('go-live').onclick=()=>{state.mode='live';setModeUI();refresh();};
el('go-demo').onclick=()=>{state.mode='demo';setModeUI();refresh();};
el('btn-refresh').onclick=()=>refresh();
el('btn-search').onclick=async()=>{
const q=el('q').value.trim();if(!q)return;
const m=q.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
if(m){state.lat=+m[1];state.lon=+m[2];state.zoom=Math.max(state.zoom,7);schedule(true);showProbe(state.lat,state.lon);return;}
try{
const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=1&language=en&format=json');
const j=await r.json();const hit=j.results?.[0];if(!hit){status('<span class="warn">No match</span>');return;}
state.lat=hit.latitude;state.lon=hit.longitude;state.zoom=Math.max(state.zoom,8);status(`<span class="ok">${hit.name}</span>`);schedule(true);showProbe(state.lat,state.lon);
}catch{status('<span class="warn">Search failed</span>');}
};
el('q').addEventListener('keydown',e=>{if(e.key==='Enter')el('btn-search').click();});
el('t-slider').oninput=e=>{state.tIndex=+e.target.value;refresh();};
el('t-prev').onclick=()=>{state.tIndex=Math.max(0,state.tIndex-1);el('t-slider').value=state.tIndex;refresh();};
el('t-next').onclick=()=>{const mx=+el('t-slider').max;state.tIndex=Math.min(mx,state.tIndex+1);el('t-slider').value=state.tIndex;refresh();};
el('t-play').onclick=(()=>{let t=null;return()=>{if(t){clearInterval(t);t=null;el('t-play').textContent='Play';return;}el('t-play').textContent='Pause';t=setInterval(()=>{const mx=+el('t-slider').max;state.tIndex=state.tIndex>=mx?0:state.tIndex+1;el('t-slider').value=state.tIndex;refresh();},600);};})();
el('zin').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,0.55);
el('zout').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,-0.55);
const stage=el('stage');
stage.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,e.deltaY<0?0.3:-0.3);},{passive:false});
let dragged=false,sx=0,sy=0,lt=0,coasting=false;
stage.addEventListener('pointerdown',e=>{if(e.button&&e.button!==0)return;stage.setPointerCapture(e.pointerId);state.drag={x:e.clientX,y:e.clientY};state.panning=true;dragged=false;sx=e.clientX;sy=e.clientY;lt=performance.now();state.vel={x:0,y:0};coasting=false;});
stage.addEventListener('pointermove',e=>{
if(!state.drag)return;
const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
if(Math.hypot(e.clientX-sx,e.clientY-sy)>5)dragged=true;
const now=performance.now(),dt=Math.max(8,now-lt);state.vel={x:dx/dt*16,y:dy/dt*16};lt=now;
state.drag={x:e.clientX,y:e.clientY};panBy(dx*PERF.dpr,dy*PERF.dpr);
});
stage.addEventListener('pointerup',e=>{
if(!state.drag)return;state.drag=null;state.panning=false;
if(!dragged){schedule(true);const ll=screenToLL(e.clientX,e.clientY);showProbe(ll.lat,ll.lon);return;}
if(PERF.mobile&&Math.hypot(state.vel.x,state.vel.y)<0.8){schedule(true);return;}
coasting=true;
const coast=()=>{if(state.drag||!coasting||Math.hypot(state.vel.x,state.vel.y)<0.35){coasting=false;state.panning=false;schedule(true);return;}
state.panning=true;panBy(state.vel.x*PERF.dpr,state.vel.y*PERF.dpr);state.vel.x*=0.88;state.vel.y*=0.88;requestAnimationFrame(coast);};
requestAnimationFrame(coast);
});
stage.addEventListener('pointercancel',()=>{state.drag=null;state.panning=false;coasting=false;schedule(true);});
addEventListener('resize',resize);
setModeUI();
}
(async()=>{
initUI();
resize();
windLayer.setEnabled(state.windOn);
windLayer.start();
el('op-val').textContent='70%';
el('gamma-val').textContent='1.00';
el('soft-val').textContent='auto';
status('Loading field pack…');
try{
await loadManifest('/weather/data/');
await preloadCore(0);
await refresh();
}catch(e){
console.error(e);
status(`<span class="warn">Pack load failed: ${e.message||e}</span>`);
}
if(navigator.geolocation){
navigator.geolocation.getCurrentPosition(
p=>{state.lat=p.coords.latitude;state.lon=p.coords.longitude;state.zoom=Math.max(state.zoom,6.5);schedule(true);},
()=>{},
{enableHighAccuracy:false,timeout:5000,maximumAge:600000}
);
}
})();
