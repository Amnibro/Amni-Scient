const FORECAST='https://api.open-meteo.com/v1/forecast';
const AIR='https://air-quality-api.open-meteo.com/v1/air-quality';
const MARINE='https://marine-api.open-meteo.com/v1/marine';
const CORE_VARS=['temperature_2m','dewpoint_2m','apparent_temperature','relative_humidity_2m','pressure_msl','cloud_cover','weather_code','precipitation','precipitation_probability','wind_speed_10m','wind_direction_10m','wind_gusts_10m'];
const EXT_VARS=['surface_pressure','cloud_cover_low','cloud_cover_mid','cloud_cover_high','rain','showers','snowfall','snow_depth','wind_speed_80m','wind_speed_120m','temperature_80m','shortwave_radiation','direct_radiation','diffuse_radiation','uv_index','sunshine_duration','soil_temperature_0cm','soil_moisture_0_to_1cm','cape','lifted_index','convective_inhibition','visibility','freezing_level_height','boundary_layer_height','total_column_integrated_water_vapour','vapour_pressure_deficit','et0_fao_evapotranspiration','is_day'];
const AIR_VARS=['pm10','pm2_5','carbon_monoxide','nitrogen_dioxide','sulphur_dioxide','ozone','us_aqi','european_aqi'];
const MARINE_VARS=['wave_height','wave_direction','wave_period','swell_wave_height','ocean_current_velocity'];
const FORECAST_VARS=CORE_VARS.concat(EXT_VARS);
const IS_MOBILE=/Mobi|Android|iPhone|iPad/i.test(typeof navigator!=='undefined'?navigator.userAgent:'')||(typeof navigator!=='undefined'&&navigator.maxTouchPoints>1&&typeof screen!=='undefined'&&Math.min(screen.width,screen.height)<900);
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function lodForZoom(zoom){
const z=Math.max(1,zoom||3);
if(z<3.5)return{name:'global',gw:6,gh:4,localW:0,localH:0,days:2,vars:CORE_VARS.slice(),air:false,marine:false,chunk:IS_MOBILE?10:14,gap:180};
if(z<5.5)return{name:'synoptic',gw:8,gh:5,localW:6,localH:4,days:3,vars:CORE_VARS.concat(['rain','snowfall','cape','uv_index','shortwave_radiation','visibility']),air:false,marine:false,chunk:12,gap:200};
if(z<8)return{name:'regional',gw:6,gh:4,localW:8,localH:6,days:5,vars:CORE_VARS.concat(EXT_VARS.slice(0,14)),air:IS_MOBILE?false:true,marine:false,chunk:12,gap:240};
if(z<11)return{name:'meso',gw:0,gh:0,localW:10,localH:8,days:5,vars:FORECAST_VARS,air:true,marine:true,chunk:12,gap:260};
return{name:'local',gw:0,gh:0,localW:12,localH:10,days:7,vars:FORECAST_VARS,air:true,marine:true,chunk:10,gap:280};
}
async function fetchJson(url,tries=4){
let last;
for(let i=0;i<tries;i++){
try{
const ctrl=new AbortController();
const to=setTimeout(()=>ctrl.abort(),45000);
const r=await fetch(url,{signal:ctrl.signal,headers:{'Accept':'application/json'}});
clearTimeout(to);
if(r.status===429||r.status===503){await sleep(1200*Math.pow(2,i)+Math.random()*300);continue;}
if(!r.ok){let body='';try{body=(await r.text()).slice(0,160);}catch{}throw new Error(`HTTP ${r.status}${body?': '+body:''}`);}
return await r.json();
}catch(e){last=e;if(i<tries-1)await sleep(400*(i+1));}
}
throw last||new Error('fetch failed');
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
if(lod.gw>0){const g=buildLattice(-70,70,-180,180,lod.gw,lod.gh);lats=lats.concat(g.lats);lons=lons.concat(g.lons);}
if(lod.localW>0){const d=buildLattice(vb.lat0,vb.lat1,vb.lon0,vb.lon1,lod.localW,lod.localH);lats=lats.concat(d.lats);lons=lons.concat(d.lons);}
const pts=dedupePoints(lats,lons);
return{...pts,bounds:{lat0:-85,lat1:85,lon0:-180,lon1:180},view:vb,lod};
}
function forecastUrl(lats,lons,hourly,days){
const q=new URLSearchParams();
q.set('latitude',lats.join(','));
q.set('longitude',lons.join(','));
q.set('hourly',hourly.join(','));
q.set('forecast_days',String(days||3));
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
q.set('forecast_days','3');
q.set('timezone','UTC');
return`${AIR}?${q.toString()}`;
}
function marineUrl(lats,lons){
const q=new URLSearchParams();
q.set('latitude',lats.join(','));
q.set('longitude',lons.join(','));
q.set('hourly',MARINE_VARS.join(','));
q.set('forecast_days','3');
q.set('timezone','UTC');
return`${MARINE}?${q.toString()}`;
}
async function fetchLocations(urlBuilder,lats,lons,chunkSize,onProg,gapMs=240){
const rows=new Array(lats.length);
for(let i=0;i<lats.length;i+=chunkSize){
const sl=lats.slice(i,i+chunkSize),so=lons.slice(i,i+chunkSize);
const data=await fetchJson(urlBuilder(sl,so));
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
async function fetchLiveBundle({lat,lon,zoom,activeKey,onStatus,onPartial}){
const status=m=>onStatus&&onStatus(m);
const errors=[];
const plan=makeSamplePlan(lat,lon,zoom);
const lod=plan.lod;
const vars=[...new Set(lod.vars.concat(activeKey&&!lod.vars.includes(activeKey)?[activeKey]:[]).concat(['wind_speed_10m','wind_direction_10m','pressure_msl','temperature_2m']))];
const bundle=emptyBundle(plan);
const n=plan.lats.length;
status(`Live ${lod.name} · 0/${n} pts…`);
try{
const rows=await fetchLocations(
(sl,so)=>forecastUrl(sl,so,vars,lod.days),
plan.lats,plan.lons,lod.chunk,
(d,t)=>status(`Live ${lod.name} · ${d}/${t}…`),
lod.gap
);
mergeHourly(bundle.rows,rows);
Object.assign(bundle,summarizeVars(bundle.rows));
bundle.fetchedAt=Date.now();
if(onPartial)onPartial({...bundle,rows:bundle.rows});
}catch(e){errors.push(`forecast: ${e.message||e}`);}
if(lod.air){
try{
const step=Math.max(2,Math.floor(n/24));
const al=[],ao=[],mapIdx=[];
for(let i=0;i<n;i+=step){al.push(plan.lats[i]);ao.push(plan.lons[i]);mapIdx.push(i);}
if(al.length){
status(`Air quality ${al.length}…`);
const airRows=await fetchLocations((sl,so)=>airUrl(sl,so),al,ao,10,null,300);
const mapped=new Array(n).fill(null);
mapIdx.forEach((idx,j)=>{mapped[idx]=airRows[j];});
mergeHourly(bundle.rows,mapped);
Object.assign(bundle,summarizeVars(bundle.rows));
if(onPartial)onPartial({...bundle,rows:bundle.rows});
}
}catch(e){errors.push(`air: ${e.message||e}`);}
}
if(lod.marine){
try{
const ol=[],oo=[],mapIdx=[];
for(let i=0;i<n;i++){
if(i%5!==0)continue;
ol.push(plan.lats[i]);oo.push(plan.lons[i]);mapIdx.push(i);
if(ol.length>=24)break;
}
if(ol.length>=4){
status(`Marine ${ol.length}…`);
const mRows=await fetchLocations((sl,so)=>marineUrl(sl,so),ol,oo,8,null,300);
const mapped=new Array(n).fill(null);
mapIdx.forEach((idx,j)=>{mapped[idx]=mRows[j];});
mergeHourly(bundle.rows,mapped);
Object.assign(bundle,summarizeVars(bundle.rows));
}
}catch(e){errors.push(`marine: ${e.message||e}`);}
}
bundle.errors=errors;
bundle.fetchedAt=Date.now();
const ok=bundle.rows.some(r=>r?.hourly?.time?.length);
if(!ok)throw new Error(errors.join('; ')||'no forecast data');
Object.assign(bundle,summarizeVars(bundle.rows));
bundle.lod=lod;
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
async function fetchPointDetail(lat,lon){
const url=forecastUrl([+lat.toFixed(4)],[+lon.toFixed(4)],FORECAST_VARS,3);
const data=await fetchJson(url);
const row=asRows(data)[0];
let air=null,marine=null;
try{air=asRows(await fetchJson(airUrl([lat],[lon])))[0];}catch{}
try{marine=asRows(await fetchJson(marineUrl([lat],[lon])))[0];}catch{}
return{forecast:row,air,marine};
}
export{FORECAST_VARS,CORE_VARS,AIR_VARS,MARINE_VARS,lodForZoom,fetchLiveBundle,extractField,fetchPointDetail,viewBounds,makeSamplePlan};
