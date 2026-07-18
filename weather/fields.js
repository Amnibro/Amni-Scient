const cache=new Map();
let manifest=null;
export async function loadManifest(base='/weather/data/'){
if(manifest)return manifest;
const r=await fetch(base+'manifest.json',{cache:'force-cache'});
if(!r.ok)throw new Error('field pack missing ('+r.status+')');
manifest=await r.json();
manifest._base=base;
return manifest;
}
export function packHours(){return manifest?.hours||[];}
export function packMeta(){return manifest;}
async function loadVarBuf(key){
if(!manifest)throw new Error('no manifest');
if(cache.has(key))return cache.get(key);
const file=manifest.files[key];
if(!file)throw new Error('no pack file for '+key);
const r=await fetch(manifest._base+file,{cache:'force-cache'});
if(!r.ok)throw new Error('pack fetch '+key+' '+r.status);
const ab=await r.arrayBuffer();
const f32=new Float32Array(ab);
cache.set(key,f32);
return f32;
}
export async function getHourField(key,hourIndex){
const man=manifest||await loadManifest();
const buf=await loadVarBuf(key);
const {w,h,hours}=man;
const hi=Math.max(0,Math.min((hours?.length||1)-1,hourIndex|0));
const slice=buf.subarray(hi*h*w,(hi+1)*h*w);
return{data:slice,w,h,lat0:man.lat0,lat1:man.lat1,lon0:man.lon0,lon1:man.lon1,hour:hours[hi],key};
}
export function sampleField(field,lat,lon){
if(!field?.data)return NaN;
const {data,w,h,lat0,lat1,lon0,lon1}=field;
const u=(lon-lon0)/Math.max(1e-6,lon1-lon0);
const v=(lat1-lat)/Math.max(1e-6,lat1-lat0);
const x=Math.max(0,Math.min(1,((u%1)+1)%1))*(w-1);
const y=Math.max(0,Math.min(1,v))*(h-1);
const x0=x|0,y0=y|0,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
const i=(xx,yy)=>data[yy*w+xx];
return i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx+((i(x0,y1)+(i(x1,y1)-i(x0,y1))*fx)-(i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx))*fy;
}
export function fieldStats(field){
if(!field?.data)return[0,1,0];
let mn=Infinity,mx=-Infinity,s=0,c=0;
const d=field.data;
for(let i=0;i<d.length;i++){const v=d[i];if(Number.isFinite(v)){if(v<mn)mn=v;if(v>mx)mx=v;s+=v;c++;}}
return c?[mn,mx,s/c]:[0,1,0];
}
export async function preloadCore(hourIndex=0){
await loadManifest();
const keys=['temperature_2m','wind_u','wind_v','pressure_msl','wind_speed_10m','cloud_cover','precipitation'];
await Promise.all(keys.map(k=>getHourField(k,hourIndex).catch(()=>null)));
}
