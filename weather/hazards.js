const EQ_URLS={
day:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
week:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
sig:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson'
};
const VOLC_ELEV='https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes';
const VOLC_US='https://volcanoes.usgs.gov/hans-public/api/volcano/getUSVolcanoes';
const NWS_URL='https://api.weather.gov/alerts/active?status=actual';
const GDACS_URL=()=>{const t=new Date(),t0=new Date(t.getTime()-14*864e5);const f=d=>d.toISOString().slice(0,10);return`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromdate=${f(t0)}&todate=${f(t)}&alertlevel=Orange;Red`;};
const FALLBACK_VOLCANOES=[
{name:'Kīlauea',lat:19.421,lon:-155.287,level:'WATCH'},
{name:'Mauna Loa',lat:19.475,lon:-155.608,level:'ADVISORY'},
{name:'Mount St. Helens',lat:46.191,lon:-122.196,level:'NORMAL'},
{name:'Yellowstone',lat:44.428,lon:-110.589,level:'NORMAL'},
{name:'Popocatépetl',lat:19.023,lon:-98.622,level:'WATCH'},
{name:'Etna',lat:37.748,lon:14.999,level:'ADVISORY'},
{name:'Stromboli',lat:38.789,lon:15.213,level:'ADVISORY'},
{name:'Reykjanes',lat:63.85,lon:-22.55,level:'WATCH'},
{name:'Sakurajima',lat:31.585,lon:130.657,level:'WATCH'},
{name:'Merapi',lat:-7.54,lon:110.446,level:'WATCH'}
];
const zoneCache=new Map();
async function fetchJson(url,timeout=15000){
const ctrl=new AbortController();
const t=setTimeout(()=>ctrl.abort(),timeout);
try{
const r=await fetch(url,{signal:ctrl.signal});
clearTimeout(t);
if(!r.ok)throw new Error('HTTP '+r.status);
return await r.json();
}catch(e){clearTimeout(t);throw e;}
}
function lodEq(zoom){
if(zoom<4)return{minMag:5.5,feed:'sig',max:40};
if(zoom<6)return{minMag:4.0,feed:'week',max:80};
if(zoom<9)return{minMag:2.5,feed:'day',max:120};
return{minMag:2.0,feed:'day',max:200};
}
function inView(lat,lon,vb,pad=0.15){
const dlat=(vb.lat1-vb.lat0)*pad,dlon=(vb.lon1-vb.lon0)*pad;
return lat>=vb.lat0-dlat&&lat<=vb.lat1+dlat&&lon>=vb.lon0-dlon&&lon<=vb.lon1+dlon;
}
function ringCentroid(ring){
if(!ring?.length)return null;
let sx=0,sy=0,n=0;
for(const c of ring){if(c&&Number.isFinite(+c[0])&&Number.isFinite(+c[1])){sx+=+c[0];sy+=+c[1];n++;}}
return n?{lon:sx/n,lat:sy/n}:null;
}
function extractRings(geometry){
if(!geometry)return[];
const t=geometry.type;
const c=geometry.coordinates;
if(t==='Polygon'&&Array.isArray(c))return[c[0]].filter(Boolean);
if(t==='MultiPolygon'&&Array.isArray(c))return c.map(p=>p?.[0]).filter(Boolean);
return[];
}
function classifyAlert(event,msgType){
const e=(event||'').toLowerCase();
const m=(msgType||'').toLowerCase();
if(/\bwarning\b/.test(e)||m==='alert'&&/\bwarning\b/.test(e))return'warning';
if(/\bwatch\b/.test(e))return'watch';
if(/\badvisory\b/.test(e)||/\bstatement\b/.test(e))return'advisory';
if(m==='update'||m==='cancel')return'advisory';
return/\bwarning\b|\btornado\b|\bflood\b|\bhurricane\b/.test(e)?'warning':(/\bwatch\b/.test(e)?'watch':'advisory');
}
function alertColor(classif,sev){
if(classif==='warning')return sev==='extreme'?'#ff0033':sev==='severe'?'#ff2244':'#ff5522';
if(classif==='watch')return'#ffcc00';
return'#33aaff';
}
export async function loadEarthquakes(zoom){
const lod=lodEq(zoom);
const url=EQ_URLS[lod.feed]||EQ_URLS.day;
try{
const geo=await fetchJson(url);
const out=[];
for(const f of geo.features||[]){
const m=f.properties?.mag;if(m==null||m<lod.minMag)continue;
const [lon,lat,depth]=f.geometry?.coordinates||[];
if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
out.push({
id:'eq-'+f.id,kind:'earthquake',lat,lon,depth:depth??0,mag:m,
title:f.properties?.title||`M${m}`,
time:f.properties?.time||Date.now(),
ttl:Math.max(2,Math.min(48,m*6))*3600e3,
url:f.properties?.url||'',
pulse:0.4+Math.min(1,m/7)*0.6
});
if(out.length>=lod.max)break;
}
return out;
}catch{return[];}
}
export async function loadVolcanoes(){
const fb=()=>FALLBACK_VOLCANOES.filter(v=>v.level!=='NORMAL').map(v=>({id:'volc-'+v.name,kind:'volcano',...v,title:v.name,time:Date.now(),ttl:72*3600e3,pulse:0.75}));
try{
const [elev,us]=await Promise.all([fetchJson(VOLC_ELEV,10000).catch(()=>[]),fetchJson(VOLC_US,15000).catch(()=>[])]);
const byV=new Map();
for(const u of (Array.isArray(us)?us:[])){if(u?.vnum)byV.set(String(u.vnum),u);if(u?.volcano_cd)byV.set(String(u.volcano_cd),u);}
const out=[];
const list=Array.isArray(elev)&&elev.length?elev:(Array.isArray(us)?us.filter(u=>{const c=(u.color_code||u.alert_level||'').toString().toUpperCase();return c&&c!=='GREEN'&&c!=='NORMAL'&&c!=='UNASSIGNED';}):[]);
for(const p of list){
const meta=byV.get(String(p.vnum||''))||byV.get(String(p.volcano_cd||''))||p;
const lat=+(meta.latitude??p.latitude??p.lat);
const lon=+(meta.longitude??p.longitude??p.lon);
if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
const level=(p.alert_level||p.color_code||meta.alert_level||meta.color_code||'UNKNOWN').toString().toUpperCase();
if(level==='NORMAL'||level==='UNASSIGNED'||level==='GREEN')continue;
out.push({id:'volc-'+(p.vnum||p.volcano_cd||p.volcano_name||`${lat},${lon}`),kind:'volcano',lat,lon,level,title:p.volcano_name||meta.volcano_name||'Volcano',time:(p.sent_unixtime?p.sent_unixtime*1000:Date.now()),ttl:72*3600e3,pulse:level.includes('WARN')||level.includes('RED')||level.includes('ORANGE')?1:0.7,url:p.notice_url||''});
}
return out.length?out:fb();
}catch{return fb();}
}
async function resolveZoneRings(zoneUrls,limit=2){
const rings=[];
for(const z of (zoneUrls||[]).slice(0,limit)){
if(zoneCache.has(z)){const r=zoneCache.get(z);if(r?.length)rings.push(...r);continue;}
try{
const zgeo=await fetchJson(z,8000);
const zr=extractRings(zgeo.geometry||zgeo);
zoneCache.set(z,zr);
if(zr.length)rings.push(...zr);
}catch{zoneCache.set(z,[]);}
}
return rings;
}
export async function loadNwsAlerts(){
try{
const j=await fetchJson(NWS_URL,20000);
const out=[];
for(const f of j.features||[]){
const p=f.properties||{};
const event=p.event||'Weather alert';
const msg=p.messageType||'';
const classif=classifyAlert(event,msg);
const sev=(p.severity||'Unknown').toLowerCase();
let rings=extractRings(f.geometry);
if(!rings.length&&p.geocode?.UGC){/* skip */}
if(!rings.length&&Array.isArray(p.affectedZones)&&p.affectedZones.length){
rings=await resolveZoneRings(p.affectedZones,2);
}
let lat=null,lon=null;
if(rings[0]){const c=ringCentroid(rings[0]);if(c){lat=c.lat;lon=c.lon;}}
else if(f.geometry?.type==='Point'){lon=f.geometry.coordinates[0];lat=f.geometry.coordinates[1];}
if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
const expires=Date.parse(p.expires||0);
out.push({
id:'nws-'+(p.id||`${lat},${lon},${event}`),
kind:'alert',
classif,
lat,lon,
rings,
title:event,
sev,
area:p.areaDesc||'',
headline:p.headline||'',
time:Date.parse(p.sent||p.effective)||Date.now(),
ttl:Math.max(1,Math.min(48,(expires?expires-Date.now():6*3600e3)/3600e3))*3600e3,
pulse:classif==='warning'?1:classif==='watch'?0.85:0.55,
url:p['@id']||p.id||'',
color:alertColor(classif,sev)
});
if(out.length>=180)break;
}
return out;
}catch{return[];}
}
function gdacsClassif(level,etype){
const L=(level||'').toUpperCase();
if(L==='RED')return'warning';
if(L==='ORANGE')return etype==='TC'||etype==='FL'||etype==='WF'?'warning':'watch';
return'advisory';
}
export async function loadGdacsAlerts(){
try{
const j=await fetchJson(GDACS_URL(),20000);
const out=[];
const want=new Set(['TC','FL','VO','WF','DR','TS','ET']);
for(const f of j.features||[]){
const p=f.properties||{};
const et=(p.eventtype||'').toUpperCase();
if(!want.has(et)&&et!=='EQ')continue;
const coords=f.geometry?.coordinates;
const lon=coords?+coords[0]:NaN,lat=coords?+coords[1]:NaN;
if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
const level=(p.alertlevel||p.episodealertlevel||'Green').toString();
const classif=gdacsClassif(level,et);
const name=p.name||p.eventname||p.description||`${et} event`;
const country=p.country||(p.affectedcountries||[]).map(c=>c.countryname||c.iso3).filter(Boolean).join(', ')||'';
const sev=level.toLowerCase()==='red'?'extreme':level.toLowerCase()==='orange'?'severe':'moderate';
const from=Date.parse(p.fromdate||p.datemodified||0)||Date.now();
const to=Date.parse(p.todate||0);
out.push({
id:'gdacs-'+(p.eventtype||'x')+'-'+(p.eventid||`${lat},${lon}`),
kind:'alert',
classif,
lat,lon,
rings:[],
title:`${et} · ${name}`,
sev,
area:country,
headline:p.htmldescription||p.description||name,
time:from,
ttl:Math.max(6,Math.min(72,(to&&to>Date.now()?(to-Date.now()):36*3600e3)/3600e3))*3600e3,
pulse:classif==='warning'?1:classif==='watch'?0.85:0.55,
url:(p.url&&(p.url.report||p.url.details))||'',
color:alertColor(classif,sev),
src:'gdacs'
});
if(out.length>=120)break;
}
return out;
}catch{return[];}
}
export function weatherHazardsFromPack(capeField,precipField,tIndex,zoom){
if(!capeField?.data&&!precipField?.data)return[];
const f=capeField||precipField;
const {data,w,h,lat0,lat1,lon0,lon1}=f;
const step=zoom<5?8:zoom<8?5:3;
const out=[];
const cape=capeField?.data,pr=precipField?.data;
for(let j=step;j<h-step;j+=step){
for(let i=step;i<w-step;i+=step){
const idx=j*w+i;
const c=cape?cape[idx]:0,p=pr?pr[idx]:0;
let kind=null,pulse=0.5,title='';
if(c>2000&&p>1){kind='storm';pulse=0.9;title=`Severe CAPE ${c|0}`;}
else if(c>1500){kind='storm';pulse=0.7;title=`Elevated CAPE ${c|0}`;}
else if(p>8){kind='flood';pulse=0.75;title=`Heavy precip ${p.toFixed(1)}`;}
else if(p>3){kind='flood';pulse=0.5;title=`Precip ${p.toFixed(1)}`;}
if(!kind)continue;
const lat=lat1-(lat1-lat0)*(j/(h-1));
const lon=lon0+(lon1-lon0)*(i/(w-1));
out.push({id:`wx-${kind}-${i}-${j}-${tIndex}`,kind,lat,lon,title,time:Date.now(),ttl:6*3600e3,pulse,mag:c||p});
}
}
return out.slice(0,zoom<5?30:80);
}
export function createHazardLayer(canvas,{lonToX,latToY,clampZoom,getView,PERF}){
const ctx=canvas.getContext('2d',{alpha:true});
let items=[],raf=0,running=false,enabled=true;
let showWarn=true,showWatch=true,showAdvisory=true,showOther=true;
function resize(){
const dpr=PERF.dpr;const w=innerWidth,h=innerHeight;
canvas.width=(w*dpr)|0;canvas.height=(h*dpr)|0;canvas.style.width=w+'px';canvas.style.height=h+'px';
}
function setItems(list){items=list||[];}
function setEnabled(on){enabled=!!on;if(!enabled)ctx.clearRect(0,0,canvas.width,canvas.height);}
function setFilters(f){
if(!f)return;
if(f.warnings!=null)showWarn=!!f.warnings;
if(f.watches!=null)showWatch=!!f.watches;
if(f.advisories!=null)showAdvisory=!!f.advisories;
if(f.other!=null)showOther=!!f.other;
}
function project(lat,lon){
const v=getView();const B=v.bm;const zf=clampZoom(v.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;
const cx=lonToX(v.lon,z)*scale*dpr,cy=latToY(v.lat,z)*scale*dpr;
return{x:lonToX(lon,z)*scale*dpr-cx+canvas.width/2,y:latToY(lat,z)*scale*dpr-cy+canvas.height/2};
}
function color(kind,sev,classif,fallback){
if(fallback)return fallback;
if(kind==='earthquake')return'#ff6b3d';
if(kind==='volcano')return'#ff3355';
if(kind==='alert')return alertColor(classif||'advisory',sev);
if(kind==='storm')return'#c44dff';
if(kind==='flood')return'#33aaff';
if(kind==='report')return'#ffe066';
return'#88ccff';
}
function hexA(hex,a){
if(!hex||hex[0]!=='#')return hex||`rgba(136,204,255,${a})`;
const n=parseInt(hex.slice(1),16);const r=(n>>16)&255,g=(n>>8)&255,b=n&255;
return`rgba(${r},${g},${b},${a})`;
}
function allowed(h){
if(h.kind==='alert'){
const c=h.classif||classifyAlert(h.title,'');
if(c==='warning')return showWarn;
if(c==='watch')return showWatch;
return showAdvisory;
}
return showOther;
}
function drawRing(ring){
if(!ring?.length)return false;
let started=false;
for(const c of ring){
const lon=+c[0],lat=+c[1];
if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
const p=project(lat,lon);
if(!started){ctx.moveTo(p.x,p.y);started=true;}
else ctx.lineTo(p.x,p.y);
}
if(started)ctx.closePath();
return started;
}
function drawZones(nowPulse){
const v=getView();
const maxZones=v.zoom<5?40:v.zoom<8?80:120;
let drawn=0;
for(const h of items){
if(h.kind!=='alert'||!h.rings?.length||!allowed(h))continue;
if(Date.now()-(h.time||0)>(h.ttl||36e5))continue;
const col=color(h.kind,h.sev,h.classif,h.color);
const fillA=h.classif==='warning'?0.16:h.classif==='watch'?0.12:0.08;
const strokeA=0.75+0.2*nowPulse;
ctx.beginPath();
let any=false;
for(const ring of h.rings){if(drawRing(ring))any=true;}
if(!any)continue;
ctx.fillStyle=hexA(col,fillA);ctx.fill();
ctx.strokeStyle=hexA(col,strokeA);
ctx.lineWidth=(h.classif==='warning'?2.4:2)*PERF.dpr;
ctx.setLineDash(h.classif==='watch'?[8*PERF.dpr,6*PERF.dpr]:[]);
ctx.stroke();
ctx.setLineDash([]);
drawn++;if(drawn>=maxZones)break;
}
}
function drawPoints(pulse){
const v=getView();
const vb={lat0:v.lat-40/Math.pow(2,Math.max(0,v.zoom-2)),lat1:v.lat+40/Math.pow(2,Math.max(0,v.zoom-2)),lon0:v.lon-60/Math.pow(2,Math.max(0,v.zoom-2)),lon1:v.lon+60/Math.pow(2,Math.max(0,v.zoom-2))};
const zoom=v.zoom;
let drawn=0,maxDraw=zoom<4?40:zoom<7?90:160;
for(const h of items){
if(!allowed(h))continue;
if(Date.now()-(h.time||0)>(h.ttl||36e5))continue;
if(h.kind==='alert'&&h.rings?.length&&zoom>=4)continue;
if(!inView(h.lat,h.lon,vb,0.2))continue;
const p=project(h.lat,h.lon);
if(p.x<-40||p.y<-40||p.x>canvas.width+40||p.y>canvas.height+40)continue;
const col=color(h.kind,h.sev,h.classif,h.color);
const base=h.kind==='earthquake'?6+Math.min(14,(h.mag||3)*2):h.kind==='volcano'?10:h.kind==='alert'?9:8;
const r=base*(0.85+0.25*pulse*(h.pulse||0.6))*PERF.dpr;
const a=0.35+0.35*pulse*(h.pulse||0.6);
ctx.beginPath();ctx.arc(p.x,p.y,r*2.2,0,Math.PI*2);ctx.fillStyle=hexA(col,0.15*a);ctx.fill();
ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=hexA(col,0.55+0.25*pulse);ctx.fill();
ctx.strokeStyle=hexA('#ffffff',0.55);ctx.lineWidth=1*PERF.dpr;ctx.stroke();
if(zoom>=5.5&&h.title){
ctx.font=`${10*PERF.dpr}px system-ui,sans-serif`;ctx.fillStyle=hexA('#e8f4ff',0.9);
const label=h.kind==='alert'?(h.classif?`[${h.classif[0].toUpperCase()}] `:'')+h.title.slice(0,26):h.title.slice(0,28);
ctx.fillText(label,p.x+r+3*PERF.dpr,p.y+3*PERF.dpr);
}
drawn++;if(drawn>=maxDraw)break;
}
}
function draw(){
if(!running)return;
if(document.hidden){raf=requestAnimationFrame(draw);return;}
const now=performance.now();
const pulse=0.5+0.5*Math.sin(now*0.004);
ctx.clearRect(0,0,canvas.width,canvas.height);
if(enabled){drawZones(pulse);drawPoints(pulse);}
raf=requestAnimationFrame(draw);
}
function start(){if(running)return;running=true;resize();raf=requestAnimationFrame(draw);}
function stop(){running=false;cancelAnimationFrame(raf);}
function counts(){
const c={warning:0,watch:0,advisory:0,other:0,zones:0};
for(const h of items){
if(Date.now()-(h.time||0)>(h.ttl||36e5))continue;
if(h.kind==='alert'){
const cl=h.classif||'advisory';
if(cl==='warning')c.warning++;else if(cl==='watch')c.watch++;else c.advisory++;
if(h.rings?.length)c.zones++;
}else c.other++;
}
return c;
}
return{resize,setItems,setEnabled,setFilters,start,stop,project,inView,counts};
}
export async function refreshHazards({zoom,capeField,precipField,tIndex,reports}){
const [eq,volc,nws,gdacs]=await Promise.all([loadEarthquakes(zoom),loadVolcanoes(),loadNwsAlerts(),loadGdacsAlerts()]);
const wx=weatherHazardsFromPack(capeField,precipField,tIndex,zoom);
const rep=(reports||[]).map(r=>({...r,kind:'report',pulse:0.8}));
return{eq,volc,nws,gdacs,wx,all:[...eq,...volc,...nws,...gdacs,...wx,...rep]};
}
