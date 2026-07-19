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
export function upsampleBilinear(src,sw,sh,dw,dh){
const out=new Float32Array(dw*dh);
const xDen=Math.max(1,dw-1),yDen=Math.max(1,dh-1);
for(let j=0;j<dh;j++){
const y=j/yDen*(sh-1),y0=y|0,y1=Math.min(sh-1,y0+1),fy=y-y0;
for(let i=0;i<dw;i++){
const x=i/xDen*(sw-1),x0=x|0,x1=Math.min(sw-1,x0+1),fx=x-x0;
const i00=src[y0*sw+x0],i10=src[y0*sw+x1],i01=src[y1*sw+x0],i11=src[y1*sw+x1];
out[j*dw+i]=i00+(i10-i00)*fx+((i01+(i11-i01)*fx)-(i00+(i10-i00)*fx))*fy;
}
}
return out;
}
export function smoothBox(src,w,h,radius=1){
const r=Math.max(0,radius|0);if(!r)return src;
const out=new Float32Array(w*h);
for(let j=0;j<h;j++){
for(let i=0;i<w;i++){
let s=0,c=0;
for(let dy=-r;dy<=r;dy++){
const yy=j+dy;if(yy<0||yy>=h)continue;
for(let dx=-r;dx<=r;dx++){
const xx=i+dx;if(xx<0||xx>=w)continue;
const v=src[yy*w+xx];if(Number.isFinite(v)){s+=v;c++;}
}
}
out[j*w+i]=c?s/c:src[j*w+i];
}
}
return out;
}
export function enhanceField(field,opts={}){
if(!field?.data)return field;
const maxW=opts.maxW||720,maxH=opts.maxH||360;
const scale=opts.scale||4;
const tw=Math.min(maxW,Math.max(field.w,field.w*scale|0));
const th=Math.min(maxH,Math.max(field.h,field.h*scale|0));
let data=field.data,w=field.w,h=field.h;
if(tw>w||th>h){data=upsampleBilinear(data,w,h,tw,th);w=tw;h=th;}
const passes=opts.smooth!=null?opts.smooth:2;
for(let p=0;p<passes;p++)data=smoothBox(data,w,h,1);
return{...field,data,w,h};
}
