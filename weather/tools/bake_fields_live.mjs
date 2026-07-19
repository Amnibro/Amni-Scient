import {writeFileSync,mkdirSync,readFileSync,existsSync} from 'fs';
import {dirname,join} from 'path';
import {fileURLToPath} from 'url';
const __dir=dirname(fileURLToPath(import.meta.url));
const out=join(__dir,'../data');
mkdirSync(out,{recursive:true});
const args=new Set(process.argv.slice(2));
const QUICK=args.has('--quick');
const W=QUICK?24:48;
const H=QUICK?12:24;
const HOURS=QUICK?12:24;
const CHUNK=QUICK?6:8;
const GAP_MS=QUICK?900:1400;
const RETRY_429=4;
const LAT0=-85,LAT1=85,LON0=-180,LON1=180;
const FORECAST='https://api.open-meteo.com/v1/forecast';
const API_VARS=['temperature_2m','apparent_temperature','dewpoint_2m','relative_humidity_2m','precipitation','cloud_cover','pressure_msl','wind_speed_10m','wind_direction_10m','cape','uv_index','visibility'];
const OUT_VARS=[...API_VARS,'wind_u','wind_v'];
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function lerp(a,b,t){return a+(b-a)*t;}
function latOf(j){return lerp(LAT1,LAT0,H>1?j/(H-1):0);}
function lonOf(i){return lerp(LON0,LON1,W>1?i/(W-1):0);}
function buildPoints(){
const pts=[];
for(let j=0;j<H;j++)for(let i=0;i<W;i++)pts.push({i,j,lat:+latOf(j).toFixed(3),lon:+lonOf(i).toFixed(3),idx:j*W+i});
return pts;
}
async function fetchChunk(lats,lons,attempt=0){
const q=new URLSearchParams();
q.set('latitude',lats.join(','));
q.set('longitude',lons.join(','));
q.set('hourly',API_VARS.join(','));
q.set('forecast_days',String(Math.ceil(HOURS/24)));
q.set('timezone','UTC');
q.set('temperature_unit','celsius');
q.set('wind_speed_unit','ms');
q.set('precipitation_unit','mm');
const url=`${FORECAST}?${q}`;
const r=await fetch(url,{headers:{Accept:'application/json'}});
if(r.status===429||r.status===503){
if(attempt>=RETRY_429)throw new Error(`HTTP ${r.status} after ${attempt+1} tries`);
const wait=Math.min(120000,8000*Math.pow(2,attempt));
console.warn(`rate ${r.status}, wait ${Math.round(wait/1000)}s…`);
await sleep(wait);
return fetchChunk(lats,lons,attempt+1);
}
if(!r.ok){
const body=await r.text().catch(()=> '');
throw new Error(`HTTP ${r.status}: ${body.slice(0,160)}`);
}
const data=await r.json();
return Array.isArray(data)?data:[data];
}
function windUV(spd,dirDeg){
const sp=Number.isFinite(spd)?spd:0;
const dir=Number.isFinite(dirDeg)?dirDeg:0;
const rad=((270-dir)*Math.PI)/180;
return{u:sp*Math.cos(rad),v:sp*Math.sin(rad)};
}
async function main(){
const pts=buildPoints();
const n=pts.length;
console.log(`bake live pack ${W}x${H} · ${HOURS}h · ${n} pts · chunk ${CHUNK}`);
const grids=Object.fromEntries(OUT_VARS.map(k=>[k,new Float32Array(HOURS*H*W)]));
let hours=null;
let fetched=0;
for(let c=0;c<n;c+=CHUNK){
const slice=pts.slice(c,c+CHUNK);
const lats=slice.map(p=>p.lat);
const lons=slice.map(p=>p.lon);
let rows;
try{
rows=await fetchChunk(lats,lons);
}catch(e){
console.error('chunk failed',c,e.message||e);
throw e;
}
for(let k=0;k<slice.length;k++){
const row=rows[k];
const p=slice[k];
if(!row?.hourly?.time?.length){
console.warn('empty row',p.lat,p.lon);
continue;
}
if(!hours)hours=row.hourly.time.slice(0,HOURS);
const T=Math.min(HOURS,row.hourly.time.length);
for(const key of API_VARS){
const arr=row.hourly[key];
if(!arr)continue;
for(let h=0;h<T;h++){
const v=arr[h];
grids[key][h*H*W+p.idx]=Number.isFinite(+v)?+v:0;
}
}
const spdA=row.hourly.wind_speed_10m||[];
const dirA=row.hourly.wind_direction_10m||[];
for(let h=0;h<T;h++){
const{u,v}=windUV(spdA[h],dirA[h]);
grids.wind_u[h*H*W+p.idx]=u;
grids.wind_v[h*H*W+p.idx]=v;
}
}
fetched+=slice.length;
const pct=((fetched/n)*100).toFixed(1);
console.log(`  ${fetched}/${n} (${pct}%)`);
if(c+CHUNK<n)await sleep(GAP_MS);
}
if(!hours||!hours.length){
const now=new Date();now.setUTCMinutes(0,0,0);
hours=[];
for(let h=0;h<HOURS;h++)hours.push(new Date(now.getTime()+h*3600e3).toISOString().slice(0,13)+':00');
}
const files={};
for(const key of OUT_VARS){
const name=key.replace(/[^a-z0-9_]/gi,'_')+'.f32';
writeFileSync(join(out,name),Buffer.from(grids[key].buffer));
files[key]=name;
console.log('wrote',name,grids[key].length);
}
const bakedAt=new Date().toISOString();
const validHours=Math.max(6,Math.min(HOURS,48));
const validUntil=new Date(Date.now()+validHours*3600e3).toISOString();
const manifest={
version:4,
source:'open-meteo',
model:'open-meteo-forecast',
note:'Real Open-Meteo global lattice pack. Re-bake: node weather/tools/bake_fields_live.mjs [--quick]',
hours,
w:W,
h:H,
lat0:LAT0,
lat1:LAT1,
lon0:LON0,
lon1:LON1,
vars:OUT_VARS,
files,
bakedAt,
validUntil,
maxAgeHours:validHours,
grid:`${W}x${H}`,
points:n
};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest));
console.log('manifest OK',bakedAt,W,'x',H,HOURS,'h',OUT_VARS.length,'vars');
}
main().catch(e=>{
console.error(e);
process.exit(1);
});
