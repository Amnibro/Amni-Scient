const FORECAST='https://api.open-meteo.com/v1/forecast';
const AIR='https://air-quality-api.open-meteo.com/v1/air-quality';
const MARINE='https://marine-api.open-meteo.com/v1/marine';
const CORE_VARS=['temperature_2m','dewpoint_2m','apparent_temperature','relative_humidity_2m','pressure_msl','cloud_cover','weather_code','precipitation','precipitation_probability','wind_speed_10m','wind_direction_10m','wind_gusts_10m'];
const EXT_VARS=['surface_pressure','cloud_cover_low','cloud_cover_mid','cloud_cover_high','rain','showers','snowfall','snow_depth','shortwave_radiation','uv_index','cape','visibility','is_day'];
const AIR_VARS=['pm10','pm2_5','us_aqi','ozone'];
const MARINE_VARS=['wave_height','wave_direction','wave_period','wind_wave_height','swell_wave_height','swell_wave_period','swell_wave_direction','sea_surface_temperature'];
const FORECAST_VARS=CORE_VARS.concat(EXT_VARS);
const POINT_HOURLY=['temperature_2m','apparent_temperature','dewpoint_2m','relative_humidity_2m','precipitation','precipitation_probability','weather_code','cloud_cover','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','uv_index','visibility','cape','is_day','shortwave_radiation'];
const POINT_DAILY=['weather_code','temperature_2m_max','temperature_2m_min','apparent_temperature_max','apparent_temperature_min','uv_index_max','precipitation_sum','precipitation_probability_max','precipitation_hours','wind_speed_10m_max','wind_gusts_10m_max','wind_direction_10m_dominant','sunrise','sunset'];
const pointCache=new Map();
const liveCache=new Map();
const IS_MOBILE=/Mobi|Android|iPhone|iPad/i.test(typeof navigator!=='undefined'?navigator.userAgent:'')||(typeof navigator!=='undefined'&&navigator.maxTouchPoints>1&&typeof screen!=='undefined'&&Math.min(screen.width,screen.height)<900);
const rate={blockedUntil:0,lastAt:0,minGap:1600,failStreak:0,queue:Promise.resolve()};
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function circuitOpen(){return Date.now()<rate.blockedUntil;}
function tripCircuit(ms){rate.blockedUntil=Date.now()+(ms||180000);rate.failStreak++;}
function circuitRemaining(){return Math.max(0,rate.blockedUntil-Date.now());}
function lodForZoom(zoom){
const z=Math.max(1,zoom||3);
const mob=IS_MOBILE;
const lite=CORE_VARS.slice(0,6).concat(['wind_speed_10m','wind_direction_10m','pressure_msl','visibility']);
if(z<4)return{name:'global',gw:mob?5:6,gh:mob?3:4,localW:0,localH:0,days:1,vars:lite,air:false,marine:false,chunk:6,gap:mob?1400:1200};
if(z<6.5)return{name:'synoptic',gw:mob?4:5,gh:mob?3:3,localW:mob?4:5,localH:mob?3:4,days:1,vars:lite.concat(['rain','cape']),air:false,marine:false,chunk:6,gap:mob?1300:1100};
if(z<9)return{name:'regional',gw:0,gh:0,localW:mob?5:6,localH:mob?4:5,days:1,vars:CORE_VARS.concat(['rain','cape','visibility','uv_index']),air:false,marine:false,chunk:6,gap:1000};
return{name:'local',gw:0,gh:0,localW:mob?6:7,localH:mob?5:6,days:2,vars:CORE_VARS.concat(['rain','cape','visibility','uv_index']),air:false,marine:false,chunk:6,gap:1000};
}
async function fetchJson(url,opts={}){
const tries=opts.tries!=null?opts.tries:1;
const allowRetry429=opts.retry429===true;
if(circuitOpen())throw new Error('Forecast API busy — try again shortly');
const run=async()=>{
let last;
for(let i=0;i<tries;i++){
const waitGap=Math.max(0,rate.minGap-(Date.now()-rate.lastAt));
if(waitGap)await sleep(waitGap);
rate.lastAt=Date.now();
try{
const ctrl=new AbortController();
const to=setTimeout(()=>ctrl.abort(),20000);
const r=await fetch(url,{signal:ctrl.signal,headers:{'Accept':'application/json'}});
clearTimeout(to);
if(r.status===429||r.status===503){
tripCircuit(r.status===429?180000:90000);
if(!allowRetry429||i>=tries-1)throw new Error('Forecast API busy — try again shortly');
await sleep(4000*Math.pow(2,i));
continue;
}
if(!r.ok){let body='';try{body=(await r.text()).slice(0,120);}catch{}throw new Error(`HTTP ${r.status}${body?': '+body:''}`);}
rate.failStreak=0;
return await r.json();
}catch(e){
last=e;
const msg=String(e&&e.message||e);
if(/429|rate limited|cooling down|busy/i.test(msg))throw e;
if(i<tries-1)await sleep(800*(i+1));
}
}
throw last||new Error('fetch failed');
};
const p=rate.queue.then(run,run);
rate.queue=p.catch(()=>{});
return p;
}
function asRows(data){return Array.isArray(data)?data:[data];}
function buildLattice(lat0,lat1,lon0,lon1,gw,gh){
const lats=[],lons=[];
if(gw<1||gh<1)return{lats,lons};
for(let y=0;y<gh;y++){
const v=gh>1?y/(gh-1):0;const lat=lat1+(lat0-lat1)*v;
for(let x=0;x<gw;x++){
const u=gw>1?x/(gw-1):0;const lon=lon0+(lon1-lon0)*u;
lats.push(+lat.toFixed(3));
lons.push(+(((lon+540)%360)-180).toFixed(3));
}
}
return{lats,lons};
}
function dedupePoints(lats,lons){
const seen=new Set(),ol=[],oo=[];
for(let i=0;i<lats.length;i++){
const k=`${lats[i].toFixed(2)},${lons[i].toFixed(2)}`;
if(seen.has(k))continue;seen.add(k);ol.push(lats[i]);oo.push(lons[i]);
}
return{lats:ol,lons:oo};
}
function viewBounds(lat,lon,zoom){
const spanLon=Math.min(360,720/Math.pow(2,Math.max(1,zoom-1)));
const spanLat=Math.min(140,spanLon*0.65);
return{lat0:Math.max(-85,lat-spanLat/2),lat1:Math.min(85,lat+spanLat/2),lon0:lon-spanLon/2,lon1:lon+spanLon/2};
}
function makeSamplePlan(mapLat,mapLon,mapZoom){
const lod=lodForZoom(mapZoom);
const vb=viewBounds(mapLat,mapLon,mapZoom);
let lats=[],lons=[];
if(lod.gw>0){const g=buildLattice(-65,65,-180,180,lod.gw,lod.gh);lats=lats.concat(g.lats);lons=lons.concat(g.lons);}
if(lod.localW>0){const d=buildLattice(vb.lat0,vb.lat1,vb.lon0,vb.lon1,lod.localW,lod.localH);lats=lats.concat(d.lats);lons=lons.concat(d.lons);}
const pts=dedupePoints(lats,lons);
return{...pts,bounds:{lat0:-85,lat1:85,lon0:-180,lon1:180},view:vb,lod};
}
function forecastUrl(lats,lons,hourly,days){
const q=new URLSearchParams();
q.set('latitude',lats.join(','));
q.set('longitude',lons.join(','));
q.set('hourly',hourly.join(','));
q.set('forecast_days',String(days||2));
q.set('timezone','UTC');
q.set('temperature_unit','celsius');
q.set('wind_speed_unit','ms');
q.set('precipitation_unit','mm');
return`${FORECAST}?${q.toString()}`;
}
function airUrl(lats,lons){
const q=new URLSearchParams();
q.set('latitude',lats.join(','));
q.set('longitude',lons.join(','));
q.set('hourly',AIR_VARS.join(','));
q.set('forecast_days','2');
q.set('timezone','UTC');
return`${AIR}?${q.toString()}`;
}
function marineUrl(lats,lons){
const q=new URLSearchParams();
q.set('latitude',lats.join(','));
q.set('longitude',lons.join(','));
q.set('hourly',MARINE_VARS.join(','));
q.set('forecast_days','2');
q.set('timezone','UTC');
return`${MARINE}?${q.toString()}`;
}
async function fetchLocations(urlBuilder,lats,lons,chunkSize,onProg,gapMs=500){
const rows=new Array(lats.length);
for(let i=0;i<lats.length;i+=chunkSize){
if(circuitOpen())throw new Error('Forecast API busy — try again in a minute');
const sl=lats.slice(i,i+chunkSize),so=lons.slice(i,i+chunkSize);
const data=await fetchJson(urlBuilder(sl,so),{tries:1,retry429:false});
const part=asRows(data);
for(let j=0;j<part.length;j++)rows[i+j]=part[j];
if(onProg)onProg(Math.min(lats.length,i+chunkSize),lats.length);
if(i+chunkSize<lats.length)await sleep(gapMs);
}
return rows;
}
function mergeHourly(targetRows,srcRows){
if(!srcRows)return;
for(let i=0;i<targetRows.length;i++){
const t=targetRows[i],s=srcRows[i];
if(!t||!s||!s.hourly)continue;
if(!t.hourly)t.hourly={};
if(s.hourly.time&&(!t.hourly.time||!t.hourly.time.length))t.hourly.time=s.hourly.time;
for(const k of Object.keys(s.hourly)){if(k==='time')continue;t.hourly[k]=s.hourly[k];}
if(s.latitude!=null)t.latitude=s.latitude;
if(s.longitude!=null)t.longitude=s.longitude;
}
}
function summarizeVars(rows){
const have=new Set();let hours=[];
for(const r of rows){
if(!r?.hourly)continue;
if(r.hourly.time?.length&&!hours.length)hours=r.hourly.time;
for(const k of Object.keys(r.hourly))if(k!=='time')have.add(k);
}
return{vars:[...have],hours};
}
function emptyBundle(plan){
return{
rows:plan.lats.map((la,i)=>({latitude:la,longitude:plan.lons[i],hourly:{}})),
lats:plan.lats,lons:plan.lons,hours:[],bounds:plan.bounds,view:plan.view,lod:plan.lod,vars:[],errors:[],fetchedAt:Date.now()
};
}
function liveCacheKey(lat,lon,zoom,activeKey){
const lod=lodForZoom(zoom);
const qLat=Math.round(lat*2)/2,qLon=Math.round(lon*2)/2;
return lod.name+'|'+qLat+'|'+qLon+'|'+(activeKey||'');
}
async function fetchLiveBundle({lat,lon,zoom,activeKey,onStatus,onPartial,force}){
const ck=liveCacheKey(lat,lon,zoom,activeKey);
const cached=liveCache.get(ck);
if(!force&&cached&&Date.now()-cached.at<12*60*1000)return cached.bundle;
if(circuitOpen()){
if(cached)return cached.bundle;
throw new Error('Live map API busy — using cached fields');
}
const status=m=>onStatus&&onStatus(m);
const errors=[];
const plan=makeSamplePlan(lat,lon,zoom);
const lod=plan.lod;
const vars=[...new Set(lod.vars.concat(activeKey?[activeKey]:[]).concat(['wind_speed_10m','wind_direction_10m','pressure_msl','temperature_2m']))];
const bundle=emptyBundle(plan);
const n=plan.lats.length;
status(`Live ${lod.name} · 0/${n} stations`);
try{
const rows=await fetchLocations(
(sl,so)=>forecastUrl(sl,so,vars,lod.days),
plan.lats,plan.lons,lod.chunk,
(d,t)=>status(`Live ${lod.name} · ${d}/${t} stations`),
lod.gap
);
mergeHourly(bundle.rows,rows);
Object.assign(bundle,summarizeVars(bundle.rows));
bundle.fetchedAt=Date.now();
if(onPartial)onPartial({...bundle,rows:bundle.rows});
}catch(e){
errors.push(`forecast: ${e.message||e}`);
if(cached)return cached.bundle;
throw e;
}
bundle.errors=errors;
bundle.fetchedAt=Date.now();
const ok=bundle.rows.some(r=>r?.hourly?.time?.length);
if(!ok){
if(cached)return cached.bundle;
throw new Error(errors.join('; ')||'no forecast data');
}
Object.assign(bundle,summarizeVars(bundle.rows));
bundle.lod=lod;
if(liveCache.size>12){const first=liveCache.keys().next().value;liveCache.delete(first);}
liveCache.set(ck,{at:Date.now(),bundle});
return bundle;
}
function extractField(cache,key,tIndex){
const {rows,lats,lons,bounds}=cache;
const vals=new Float32Array(lats.length);
let hit=0,sum=0;
for(let i=0;i<rows.length;i++){
const arr=rows[i]?.hourly?.[key];
const v=arr&&arr[tIndex]!=null&&Number.isFinite(+arr[tIndex])?+arr[tIndex]:NaN;
vals[i]=v;
if(Number.isFinite(v)){hit++;sum+=v;}
}
const fill=hit?sum/hit:0;
for(let i=0;i<vals.length;i++)if(!Number.isFinite(vals[i]))vals[i]=fill;
return{lats:Float32Array.from(lats),lons:Float32Array.from(lons),vals,b:bounds||{lat0:-85,lat1:85,lon0:-180,lon1:180},coverage:hit/Math.max(1,lats.length)};
}
function pointUrl(lat,lon,days){
const q=new URLSearchParams();
q.set('latitude',String(+lat.toFixed(4)));
q.set('longitude',String(+lon.toFixed(4)));
q.set('hourly',POINT_HOURLY.join(','));
q.set('daily',POINT_DAILY.join(','));
q.set('forecast_days',String(days||7));
q.set('timezone','auto');
q.set('temperature_unit','celsius');
q.set('wind_speed_unit','ms');
q.set('precipitation_unit','mm');
return`${FORECAST}?${q.toString()}`;
}
function pointAirUrl(lat,lon){
const q=new URLSearchParams();
q.set('latitude',String(+lat.toFixed(4)));
q.set('longitude',String(+lon.toFixed(4)));
q.set('hourly',AIR_VARS.join(','));
q.set('forecast_days','3');
q.set('timezone','auto');
return`${AIR}?${q.toString()}`;
}
function pointMarineUrl(lat,lon,days){
const q=new URLSearchParams();
q.set('latitude',String(+lat.toFixed(4)));
q.set('longitude',String(+lon.toFixed(4)));
q.set('hourly',MARINE_VARS.join(','));
q.set('forecast_days',String(Math.min(days||7,7)));
q.set('timezone','auto');
return`${MARINE}?${q.toString()}`;
}
function cacheKey(lat,lon){return`${(Math.round(lat*20)/20).toFixed(2)},${(Math.round(lon*20)/20).toFixed(2)}`;}
async function fetchPointDetail(lat,lon){
return fetchPointForecast(lat,lon,{days:2,marine:false,air:false});
}
async function fetchPointForecast(lat,lon,opts={}){
const days=opts.days||7;
const wantMarine=opts.marine===true;
const wantAir=opts.air===true;
const key=cacheKey(lat,lon)+'|'+days+(wantMarine?'m':'')+(wantAir?'a':'');
const hit=pointCache.get(key);
if(hit&&Date.now()-hit.at<20*60*1000)return hit.data;
if(circuitOpen()){
if(hit)return hit.data;
throw new Error('Forecast API busy — try again shortly');
}
const la=+lat.toFixed(4),lo=+lon.toFixed(4);
const fcRaw=await fetchJson(pointUrl(la,lo,days),{tries:1,retry429:false});
let air=null,marine=null;
if(wantAir&&!circuitOpen()){
try{const airRaw=await fetchJson(pointAirUrl(la,lo),{tries:1,retry429:false});air=asRows(airRaw)[0]||airRaw;}catch{}
}
if(wantMarine&&!circuitOpen()){
try{const marRaw=await fetchJson(pointMarineUrl(la,lo,days),{tries:1,retry429:false});marine=asRows(marRaw)[0]||marRaw;}catch{}
}
const fc=asRows(fcRaw)[0]||fcRaw;
const data={lat:la,lon:lo,timezone:fc.timezone||'auto',utcOffset:fc.utc_offset_seconds||0,hourly:fc.hourly||null,daily:fc.daily||null,air:air?.hourly||null,marine:marine?.hourly||null,fetchedAt:Date.now(),source:'open-meteo'};
if(pointCache.size>40){const first=pointCache.keys().next().value;pointCache.delete(first);}
pointCache.set(key,{at:Date.now(),data});
return data;
}
function isRateBlocked(){return circuitOpen();}
export{FORECAST_VARS,CORE_VARS,AIR_VARS,MARINE_VARS,POINT_HOURLY,POINT_DAILY,lodForZoom,fetchLiveBundle,extractField,fetchPointDetail,fetchPointForecast,viewBounds,makeSamplePlan,isRateBlocked,circuitOpen,circuitRemaining,cacheKey,liveCacheKey};
