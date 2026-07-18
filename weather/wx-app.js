import {BASEMAPS,loadTile,lonToX,latToY,xToLon,yToLat,clampZoom,MOBILE} from './tiles.js?v=20260718b';
import {fetchLiveBundle,extractField,fetchPointDetail,lodForZoom} from './meteo.js?v=20260718b';
import {createWindLayer,drawIsobars} from './wind.js?v=20260718b';
const PERF={
mobile:MOBILE,
dpr:MOBILE?1:Math.min(devicePixelRatio||1,2),
ovScale:MOBILE?0.28:0.55,
fieldW:MOBILE?360:720,
fieldH:MOBILE?180:360,
gridW:MOBILE?12:16,
gridH:MOBILE?7:10,
smoothDefault:!MOBILE,
basemapDefault:MOBILE?'cartoDark':'satellite'
};
const LAYERS=[
{id:0,key:'temperature_2m',name:'Temperature 2m',unitSi:'°C',unitUs:'°F',kind:0,soft:0},
{id:1,key:'apparent_temperature',name:'Feels like',unitSi:'°C',unitUs:'°F',kind:14,soft:0},
{id:2,key:'dewpoint_2m',name:'Dew point',unitSi:'°C',unitUs:'°F',kind:12,soft:0},
{id:3,key:'relative_humidity_2m',name:'Humidity 2m',unitSi:'%',unitUs:'%',kind:3,soft:0},
{id:4,key:'precipitation',name:'Precipitation',unitSi:'mm',unitUs:'in',kind:1,soft:1},
{id:5,key:'precipitation_probability',name:'Precip probability',unitSi:'%',unitUs:'%',kind:3,soft:.5},
{id:6,key:'rain',name:'Rain',unitSi:'mm',unitUs:'in',kind:1,soft:1},
{id:7,key:'showers',name:'Showers',unitSi:'mm',unitUs:'in',kind:1,soft:1},
{id:8,key:'snowfall',name:'Snowfall',unitSi:'cm',unitUs:'in',kind:6,soft:1},
{id:9,key:'snow_depth',name:'Snow depth',unitSi:'m',unitUs:'in',kind:6,soft:.6},
{id:10,key:'cloud_cover',name:'Cloud cover',unitSi:'%',unitUs:'%',kind:5,soft:.4},
{id:11,key:'cloud_cover_low',name:'Cloud low',unitSi:'%',unitUs:'%',kind:5,soft:.4},
{id:12,key:'cloud_cover_mid',name:'Cloud mid',unitSi:'%',unitUs:'%',kind:5,soft:.4},
{id:13,key:'cloud_cover_high',name:'Cloud high',unitSi:'%',unitUs:'%',kind:5,soft:.4},
{id:14,key:'pressure_msl',name:'MSL pressure',unitSi:'hPa',unitUs:'inHg',kind:4,soft:0},
{id:15,key:'surface_pressure',name:'Surface pressure',unitSi:'hPa',unitUs:'inHg',kind:4,soft:0},
{id:16,key:'wind_speed_10m',name:'Wind 10m',unitSi:'m/s',unitUs:'mph',kind:2,soft:0},
{id:17,key:'wind_gusts_10m',name:'Wind gusts',unitSi:'m/s',unitUs:'mph',kind:10,soft:0},
{id:18,key:'wind_direction_10m',name:'Wind direction',unitSi:'°',unitUs:'°',kind:2,soft:0},
{id:19,key:'wind_speed_80m',name:'Wind 80m',unitSi:'m/s',unitUs:'mph',kind:2,soft:0},
{id:20,key:'wind_speed_120m',name:'Wind 120m',unitSi:'m/s',unitUs:'mph',kind:2,soft:0},
{id:21,key:'temperature_80m',name:'Temp 80m',unitSi:'°C',unitUs:'°F',kind:0,soft:0},
{id:22,key:'shortwave_radiation',name:'Shortwave rad.',unitSi:'W/m²',unitUs:'W/m²',kind:8,soft:0},
{id:23,key:'direct_radiation',name:'Direct radiation',unitSi:'W/m²',unitUs:'W/m²',kind:8,soft:0},
{id:24,key:'diffuse_radiation',name:'Diffuse radiation',unitSi:'W/m²',unitUs:'W/m²',kind:8,soft:0},
{id:25,key:'uv_index',name:'UV index',unitSi:'',unitUs:'',kind:11,soft:0},
{id:26,key:'sunshine_duration',name:'Sunshine',unitSi:'s',unitUs:'s',kind:8,soft:.3},
{id:27,key:'visibility',name:'Visibility',unitSi:'km',unitUs:'mi',kind:7,soft:0},
{id:28,key:'cape',name:'CAPE',unitSi:'J/kg',unitUs:'J/kg',kind:9,soft:.45},
{id:29,key:'lifted_index',name:'Lifted index',unitSi:'K',unitUs:'K',kind:9,soft:0},
{id:30,key:'convective_inhibition',name:'CIN',unitSi:'J/kg',unitUs:'J/kg',kind:9,soft:.4},
{id:31,key:'freezing_level_height',name:'Freezing level',unitSi:'m',unitUs:'ft',kind:7,soft:0},
{id:32,key:'boundary_layer_height',name:'Boundary layer',unitSi:'m',unitUs:'ft',kind:7,soft:0},
{id:33,key:'total_column_integrated_water_vapour',name:'TCWV',unitSi:'kg/m²',unitUs:'kg/m²',kind:3,soft:0},
{id:34,key:'vapour_pressure_deficit',name:'VPD',unitSi:'kPa',unitUs:'kPa',kind:3,soft:0},
{id:35,key:'et0_fao_evapotranspiration',name:'ET₀',unitSi:'mm',unitUs:'in',kind:1,soft:.35},
{id:36,key:'soil_temperature_0cm',name:'Soil temp 0cm',unitSi:'°C',unitUs:'°F',kind:13,soft:0},
{id:37,key:'soil_moisture_0_to_1cm',name:'Soil moisture',unitSi:'m³/m³',unitUs:'m³/m³',kind:3,soft:0},
{id:38,key:'weather_code',name:'Weather code',unitSi:'',unitUs:'',kind:5,soft:0},
{id:39,key:'pm2_5',name:'PM2.5',unitSi:'µg/m³',unitUs:'µg/m³',kind:7,soft:.3},
{id:40,key:'pm10',name:'PM10',unitSi:'µg/m³',unitUs:'µg/m³',kind:7,soft:.3},
{id:41,key:'us_aqi',name:'US AQI',unitSi:'',unitUs:'',kind:5,soft:0},
{id:42,key:'european_aqi',name:'EU AQI',unitSi:'',unitUs:'',kind:5,soft:0},
{id:43,key:'ozone',name:'Ozone',unitSi:'µg/m³',unitUs:'µg/m³',kind:5,soft:0},
{id:44,key:'nitrogen_dioxide',name:'NO₂',unitSi:'µg/m³',unitUs:'µg/m³',kind:5,soft:0},
{id:45,key:'wave_height',name:'Wave height',unitSi:'m',unitUs:'ft',kind:2,soft:.4},
{id:46,key:'swell_wave_height',name:'Swell height',unitSi:'m',unitUs:'ft',kind:2,soft:.4},
{id:47,key:'ocean_current_velocity',name:'Ocean current',unitSi:'m/s',unitUs:'kn',kind:2,soft:.3}
];
const GRID_W=PERF.gridW,GRID_H=PERF.gridH,TEX_W=PERF.fieldW,TEX_H=PERF.fieldH;
const GLOBAL={lat0:-85,lat1:85,lon0:-180,lon1:180};
const PRESETS={
thermal:[[0.05,0.05,0.35],[0.1,0.25,0.75],[0.2,0.7,0.95],[0.95,0.95,0.55],[0.95,0.45,0.1],[0.7,0.05,0.05]],
precip:[[0.05,0.1,0.25],[0.1,0.4,0.8],[0.2,0.8,0.95],[0.95,0.98,1]],
jet:[[0.1,0.1,0.9],[0,0.9,0.9],[0,0.9,0],[0.95,0.95,0],[0.95,0.1,0]],
turbo:[[0.4,0.05,0.55],[0.1,0.35,0.85],[0.1,0.85,0.55],[0.95,0.9,0.2],[0.95,0.25,0.1]],
inferno:[[0.02,0.02,0.08],[0.15,0.05,0.45],[0.7,0.15,0.55],[0.95,0.55,0.2],[1,0.95,0.7]],
viridis:[[0.27,0.0,0.33],[0.13,0.37,0.55],[0.16,0.62,0.42],[0.7,0.87,0.17],[0.99,0.91,0.14]],
gray:[[0,0,0],[1,1,1]],
custom:[[0.05,0.1,0.4],[0.2,0.85,0.6],[1,0.95,0.2]]
};
const state={
layer:0,preset:'thermal',opacity:0.68,reverse:false,autorange:true,smooth:PERF.smoothDefault,units:'si',
mode:'live',playing:false,tIndex:0,hours:[],field:null,fw:TEX_W,fh:TEX_H,vmin:0,vmax:1,
gamma:1,soft:null,stops:PRESETS.thermal.map(c=>c.slice()),
basemap:PERF.basemapDefault,lat:39.5,lon:-98.35,zoom:4.2,
probe:null,wasm:null,lastFetch:0,cache:null,drag:null,vel:{x:0,y:0},gen:0,raf:0,viewFetchT:0,
panning:false,needOverlay:true,lut:null,lutKey:'',windOn:true,isoOn:true,
windSpd:null,windDir:null,presField:null,lastLod:''
};
let windLayer=null;
function maybeRefetchView(){
if(state.mode!=='live')return;
clearTimeout(state.viewFetchT);
state.viewFetchT=setTimeout(()=>{
if(state.mode!=='live')return;
const key=cacheKeyForView();
const lodChanged=state.lastLod&&state.lastLod.split('|')[0]!==key.split('|')[0];
if(!lodChanged&&Date.now()-(state.lastFetch||0)<45000)return;
refreshField({force:true});
},1200);
}
function applyLiveBundle(bundle){
state.cache=bundle;
state.hours=bundle.hours||[];
state.lastFetch=Date.now();
el('t-slider').max=String(Math.max(0,state.hours.length-1));
const key=layerMeta().key;
if(!layerAvailable(key))return false;
const pts=extractField(state.cache,key,state.tIndex);
const field=buildFieldFromPoints(pts);
applyRange(field);
state.field=field instanceof Float32Array?field:Float32Array.from(field);
state.fw=TEX_W;state.fh=TEX_H;
rebuildWindPressure();
updateLegend();schedule(true);
const t=state.hours[state.tIndex];
el('t-label').textContent=t?new Date(t+'Z').toLocaleString():'—';
return true;
}
const el=id=>document.getElementById(id);
const status=t=>{const s=el('status-text');if(s)s.innerHTML=t;};
const map=el('map'),ov=el('overlay');
const mctx=map.getContext('2d',{alpha:false});
const octx=ov.getContext('2d',{alpha:true});
function getBasemap(){return BASEMAPS[state.basemap]||BASEMAPS.satellite;}
windLayer=createWindLayer(el('wind'),{
lonToX,latToY,xToLon,yToLat,clampZoom,PERF,
getView:()=>({lat:state.lat,lon:state.lon,zoom:state.zoom,bm:getBasemap()})
});
const jsFallback={
version:()=>'js-fallback',
palette_count:()=>7,
palette_name:id=>['Thermal','Precipitation','Jet','Turbo','Inferno','Viridis','Grayscale'][id|0]||'Thermal',
sample_bilinear:(values,w,h,u,v)=>{
if(!w||!h||!values?.length)return 0;
const x=Math.max(0,Math.min(1,u))*(w-1),y=Math.max(0,Math.min(1,v))*(h-1);
const x0=x|0,y0=y|0,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
const i=(xx,yy)=>values[yy*w+xx];
return i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx+((i(x0,y1)+(i(x1,y1)-i(x0,y1))*fx)-(i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx))*fy;
},
smooth_box:(values,w,h,radius)=>{
const r=radius|0,out=new Float32Array(w*h);if(!r){out.set(values);return out;}
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
const x0=Math.max(0,x-r),y0=Math.max(0,y-r),x1=Math.min(w-1,x+r),y1=Math.min(h-1,y+r);
let s=0,c=0;for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){s+=values[yy*w+xx];c++;}
out[y*w+x]=s/Math.max(1,c);
}return out;
},
idw_grid:(lats,lons,vals,gw,gh,lat0,lat1,lon0,lon1,power)=>{
const n=Math.min(lats.length,lons.length,vals.length),out=new Float32Array(gw*gh),p=Math.max(0.5,power);
const lerp=(a,b,t)=>a+(b-a)*t;
for(let y=0;y<gh;y++){const v=gh>1?y/(gh-1):0,lat=lerp(lat1,lat0,v);
for(let x=0;x<gw;x++){const u=gw>1?x/(gw-1):0,lon=lerp(lon0,lon1,u);let num=0,den=0,exact=null;
for(let i=0;i<n;i++){const dlat=lats[i]-lat,dlon=(lons[i]-lon)*Math.max(0.15,Math.abs(Math.cos(lat*0.01745329252))),d2=dlat*dlat+dlon*dlon;
if(d2<1e-12){exact=vals[i];break;}const ww=1/Math.pow(d2,p*0.5);num+=ww*vals[i];den+=ww;}
out[y*gw+x]=exact!=null?exact:(den>0?num/den:0);}}
return out;
},
upsample_bilinear:(src,sw,sh,dw,dh)=>{const out=new Float32Array(dw*dh);for(let y=0;y<dh;y++){const v=dh>1?y/(dh-1):0;for(let x=0;x<dw;x++)out[y*dw+x]=jsFallback.sample_bilinear(src,sw,sh,dw>1?x/(dw-1):0,v);}return out;},
field_stats:values=>{let mn=Infinity,mx=-Infinity,s=0,c=0;for(const v of values){if(Number.isFinite(v)){mn=Math.min(mn,v);mx=Math.max(mx,v);s+=v;c++;}}return c?[mn,mx,s/c]:[0,0,0];},
synthetic_field:(kind,w,h,t)=>{
const out=new Float32Array(w*h),tw=t*0.01745329252;
for(let y=0;y<h;y++){const v=h>1?y/(h-1):0,lat=85-v*170;
for(let x=0;x<w;x++){const u=w>1?x/(w-1):0,lon=-180+u*360;
const n1=(Math.sin(lat*0.11+tw)*Math.cos(lon*0.08-tw*0.6))*0.5+0.5;
const n2=(Math.sin(lat*0.28-tw*0.35)+Math.cos(lon*0.22+tw))*0.25+0.5;
const n=Math.max(0,Math.min(1,n1*0.65+n2*0.35)),bl=Math.max(-1,Math.min(1,lat/90));
const jet=Math.exp(-((lat-45)**2)/180)+Math.exp(-((lat+40)**2)/220);
const map={0:28-Math.abs(bl)*36+(n-0.5)*14+jet*6,1:Math.pow(n,2.1)*10*jet,2:3+n*14+jet*8,3:35+n*50,4:1008+n*22-Math.abs(bl)*6,5:Math.pow(n,0.85)*95,6:Math.pow(n,2.4)*6*(lat>40?1:0.2),7:(1-n)*38000+n*4000,8:n*850,9:Math.pow(n,1.5)*2200*jet,10:4+n*28,11:n*10,12:10-Math.abs(bl)*20+(n-0.5)*7,13:8+n*28,14:26-Math.abs(bl)*34+(n-0.5)*12};
out[y*w+x]=map[kind]??n*100;}}
return out;
},
default_range:kind=>({0:[-40,45],1:[0,12],2:[0,28],3:[0,100],4:[980,1040],5:[0,100],6:[0,8],7:[0,50000],8:[0,1000],9:[0,3000],10:[0,45],11:[0,12],12:[-30,35],13:[0,40],14:[-40,48]}[kind]||[0,1]),
default_palette:kind=>({0:'thermal',1:'precip',2:'jet',3:'turbo',4:'jet',5:'turbo',6:'precip',7:'gray',8:'inferno',9:'inferno',10:'jet',11:'inferno',12:'thermal',13:'turbo',14:'thermal'}[kind]||'turbo'),
convert_temp:(v,toF)=>toF?v*9/5+32:v,
convert_speed:(v,u)=>u===1?v*3.6:u===2?v*2.236936:u===3?v*1.943844:v,
convert_precip:(v,toIn)=>toIn?v/25.4:v,
convert_pressure:(v,u)=>u===1?v*0.02953:u===2?v*0.75006:v
};
async function loadWasm(){
try{
const mod=await import('./pkg/amni_weather_wasm.js');
await mod.default();
state.wasm={
...jsFallback,
version:()=>mod.version(),
sample_bilinear:(...a)=>mod.sample_bilinear(...a),
smooth_box:(...a)=>mod.smooth_box(...a),
idw_grid:(...a)=>mod.idw_grid(...a),
upsample_bilinear:(...a)=>mod.upsample_bilinear(...a),
field_stats:(...a)=>[...mod.field_stats(...a)],
synthetic_field:(k,w,h,t)=>mod.synthetic_field(k,w,h,t,0,0),
default_range:k=>[...mod.default_range(k)],
convert_temp:(v,f)=>mod.convert_temp(v,f),
convert_speed:(v,u)=>mod.convert_speed(v,u),
convert_precip:(v,i)=>mod.convert_precip(v,i),
convert_pressure:(v,u)=>mod.convert_pressure(v,u)
};
status(`<span class="ok">WASM ${mod.version()}</span>`);
}catch{
state.wasm=jsFallback;
status('<span class="warn">JS engine</span>');
}
return state.wasm;
}
const W=()=>state.wasm||jsFallback;
const layerMeta=()=>LAYERS[state.layer]||LAYERS[0];
function formatVal(raw){
const L=layerMeta(),toUs=state.units==='us',k=L.key;let v=raw,u=L.unitSi;
if(k.includes('temperature')||k.includes('dewpoint')||k==='apparent_temperature'||k.includes('soil_temperature')){v=W().convert_temp(raw,toUs);u=toUs?L.unitUs:L.unitSi;}
else if(k.includes('wind_speed')||k.includes('wind_gust')||k==='ocean_current_velocity'){v=toUs?(k==='ocean_current_velocity'?raw*1.943844:W().convert_speed(raw,2)):raw;u=toUs?(k==='ocean_current_velocity'?'kn':L.unitUs):L.unitSi;}
else if(k==='precipitation'||k==='rain'||k==='showers'||k==='et0_fao_evapotranspiration'){v=W().convert_precip(raw,toUs);u=toUs?'in':'mm';}
else if(k==='snowfall'){v=toUs?raw/2.54:raw;u=toUs?'in':'cm';}
else if(k==='snow_depth'){v=toUs?raw*39.3701:raw;u=toUs?'in':'m';}
else if(k==='pressure_msl'||k==='surface_pressure'){v=W().convert_pressure(raw,toUs?1:0);u=toUs?'inHg':'hPa';}
else if(k==='visibility'){const km=raw>200?raw/1000:raw;v=toUs?km*0.621371:km;u=toUs?'mi':'km';}
else if(k==='freezing_level_height'||k==='boundary_layer_height'){v=toUs?raw*3.28084:raw;u=toUs?'ft':'m';}
else if(k==='wave_height'||k==='swell_wave_height'){v=toUs?raw*3.28084:raw;u=toUs?'ft':'m';}
else if(k==='sunshine_duration'){v=raw/3600;u='h';}
return {v,u};
}
function lerp3(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function colorAt(t){
let x=Math.max(0,Math.min(1,t));
if(state.reverse)x=1-x;
if(state.gamma!==1)x=Math.pow(x,1/Math.max(0.2,state.gamma));
const stops=state.stops;const n=stops.length-1;const p=x*n;const i=Math.min(n-1,p|0);const f=p-i;
const c=lerp3(stops[i],stops[i+1],f);
return [(c[0]*255)|0,(c[1]*255)|0,(c[2]*255)|0];
}
function ensureLut(){
const key=`${state.preset}|${state.reverse}|${state.gamma}|${state.stops.map(c=>c.join()).join(';')}`;
if(state.lut&&state.lutKey===key)return state.lut;
const lut=new Uint8Array(256*3);
for(let i=0;i<256;i++){const[r,g,b]=colorAt(i/255);const o=i*3;lut[o]=r;lut[o+1]=g;lut[o+2]=b;}
state.lut=lut;state.lutKey=key;return lut;
}
function sampleFieldFast(field,fw,fh,u,v){
const x=Math.max(0,Math.min(1,u))*(fw-1),y=Math.max(0,Math.min(1,v))*(fh-1);
const x0=x|0,y0=y|0,x1=x0+1<fw?x0+1:x0,y1=y0+1<fh?y0+1:y0,fx=x-x0,fy=y-y0;
const i00=field[y0*fw+x0],i10=field[y0*fw+x1],i01=field[y1*fw+x0],i11=field[y1*fw+x1];
return i00+(i10-i00)*fx+((i01+(i11-i01)*fx)-(i00+(i10-i00)*fx))*fy;
}
function legendBar(){
const c=document.createElement('canvas');c.width=256;c.height=1;const g=c.getContext('2d');
const img=g.createImageData(256,1);
for(let i=0;i<256;i++){const[r,g0,b]=colorAt(i/255);const o=i*4;img.data[o]=r;img.data[o+1]=g0;img.data[o+2]=b;img.data[o+3]=255;}
g.putImageData(img,0,0);
el('leg-bar').style.background=`url(${c.toDataURL()})`;
el('leg-bar').style.backgroundSize='100% 100%';
}
function resize(){
const dpr=PERF.dpr;
const w=innerWidth,h=innerHeight;
map.width=(w*dpr)|0;map.height=(h*dpr)|0;map.style.width=w+'px';map.style.height=h+'px';
const os=PERF.ovScale;
ov.width=(w*dpr*os)|0;ov.height=(h*dpr*os)|0;ov.style.width=w+'px';ov.style.height=h+'px';
octx.imageSmoothingEnabled=true;octx.imageSmoothingQuality=PERF.mobile?'low':'medium';
windLayer.resize();
schedule(true);
}
function softFactor(){return state.soft!=null?state.soft:(layerMeta().soft||0);}
function sampleField(lat,lon){
if(!state.field)return NaN;
const u=(lon-GLOBAL.lon0)/360;
const v=(GLOBAL.lat1-lat)/(GLOBAL.lat1-GLOBAL.lat0);
return W().sample_bilinear(state.field,state.fw,state.fh,((u%1)+1)%1,Math.max(0,Math.min(1,v)));
}
function cacheKeyForView(){
const lod=lodForZoom(state.zoom);
return`${lod.name}|${state.lat.toFixed(1)}|${state.lon.toFixed(1)}|${layerMeta().key}`;
}
async function fetchLive(force=false){
const key=cacheKeyForView();
if(!force&&state.cache&&state.lastLod===key&&Date.now()-state.lastFetch<10*60*1000)return state.cache;
const lod=lodForZoom(state.zoom);
const bundle=await fetchLiveBundle({
lat:state.lat,lon:state.lon,zoom:state.zoom,activeKey:layerMeta().key,
onStatus:m=>status(m),
onPartial:partial=>{
try{applyLiveBundle(partial);status(`<span class="ok">${lod.name} partial · ${partial.lats.length} pts · ${partial.vars?.length||0} vars</span>`);}catch(e){console.warn(e);}
}
});
applyLiveBundle(bundle);
state.lastLod=key;
const cov=bundle.vars?.length||0;
const errN=bundle.errors?.length||0;
status(errN
?`<span class="ok">Live ${lod.name} · ${bundle.lats.length} pts · ${cov} vars</span> <span class="warn">(${errN})</span>`
:`<span class="ok">Live ${lod.name} · ${bundle.lats.length} pts · ${cov} vars · ${bundle.hours.length}h</span>`);
return bundle;
}
function rebuildWindPressure(){
if(!windLayer)return;
if(!state.cache){state.windSpd=null;state.windDir=null;state.presField=null;windLayer.setFields(null,null,0,0);return;}
const ti=state.tIndex;
try{
const sp=extractField(state.cache,'wind_speed_10m',ti);
const dr=extractField(state.cache,'wind_direction_10m',ti);
const pr=extractField(state.cache,'pressure_msl',ti);
state.windSpd=buildFieldFromPoints(sp);
state.windDir=buildFieldFromPoints(dr);
state.presField=buildFieldFromPoints(pr);
windLayer.setFields(state.windSpd,state.windDir,TEX_W,TEX_H);
}catch(e){console.warn('wind fields',e);}
}
function buildFieldFromPoints(pts){
const w=W(),b=pts.b||GLOBAL;
const gw=GRID_W*2,gh=GRID_H*2;
let g;
try{g=w.idw_grid(pts.lats,pts.lons,pts.vals,gw,gh,b.lat0,b.lat1,b.lon0,b.lon1,1.7);}
catch{g=jsFallback.idw_grid(pts.lats,pts.lons,pts.vals,gw,gh,b.lat0,b.lat1,b.lon0,b.lon1,1.7);}
if(state.smooth){try{g=w.smooth_box(g,gw,gh,1);}catch{g=jsFallback.smooth_box(g,gw,gh,1);}}
let hi;try{hi=w.upsample_bilinear(g,gw,gh,TEX_W,TEX_H);}catch{hi=jsFallback.upsample_bilinear(g,gw,gh,TEX_W,TEX_H);}
if(state.smooth){try{hi=w.smooth_box(hi,TEX_W,TEX_H,2);}catch{hi=jsFallback.smooth_box(hi,TEX_W,TEX_H,2);}}
return hi instanceof Float32Array?hi:Float32Array.from(hi);
}
function layerAvailable(key){
if(!state.cache?.rows)return false;
return state.cache.rows.some(r=>r?.hourly&&Array.isArray(r.hourly[key]));
}
function applyRange(field){
if(state.autorange){const st=W().field_stats(field);const pad=(st[1]-st[0])*0.05||1;state.vmin=st[0]-pad;state.vmax=st[1]+pad;}
else{state.vmin=+el('rmin').value;state.vmax=+el('rmax').value;}
const dr=W().default_range(layerMeta().kind);if(state.autorange&&Math.abs(state.vmax-state.vmin)<1e-3){state.vmin=dr[0];state.vmax=dr[1];}
}
function updateLegend(){
const L=layerMeta(),lo=formatVal(state.vmin),hi=formatVal(state.vmax);
el('leg-title').textContent=L.name;
el('leg-lo').textContent=`${lo.v.toFixed(1)} ${lo.u}`;
el('leg-hi').textContent=`${hi.v.toFixed(1)} ${hi.u}`;
legendBar();
el('rmin-l').textContent=state.autorange?'auto':state.vmin.toFixed(1);
el('rmax-l').textContent=state.autorange?'auto':state.vmax.toFixed(1);
el('attr').textContent=`${getBasemap().attr} · Weather fields Open-Meteo · Amni-Weather`;
}
async function refreshField(opts={}){
const force=!!opts.force;
try{
let field;
if(state.mode==='live'){
try{
await fetchLive(force);
const key=layerMeta().key;
if(!layerAvailable(key)){
status(`<span class="warn">No ${key} yet — pick another layer or ↻</span>`);
}
const pts=extractField(state.cache,key,state.tIndex);
field=buildFieldFromPoints(pts);
if(pts.coverage!=null&&pts.coverage<0.2)status(`<span class="warn">Sparse ${key} (${(pts.coverage*100)|0}% pts)</span>`);
}catch(liveErr){
console.error('live',liveErr);
status(`<span class="warn">Live error: ${(liveErr&&liveErr.message)||liveErr}</span>`);
if(!state.cache)throw liveErr;
const pts=extractField(state.cache,layerMeta().key,state.tIndex);
field=buildFieldFromPoints(pts);
}
}else{
field=W().synthetic_field(layerMeta().kind,TEX_W,TEX_H,state.tIndex*2.5);
if(state.smooth)field=W().smooth_box(field,TEX_W,TEX_H,2);
}
applyRange(field);state.field=field instanceof Float32Array?field:Float32Array.from(field);state.fw=TEX_W;state.fh=TEX_H;
if(state.mode==='demo'){
state.windSpd=W().synthetic_field(2,TEX_W,TEX_H,state.tIndex*2.5);
state.windDir=W().synthetic_field(5,TEX_W,TEX_H,state.tIndex*1.7);
state.presField=W().synthetic_field(4,TEX_W,TEX_H,state.tIndex);
windLayer.setFields(state.windSpd,state.windDir,TEX_W,TEX_H);
}else rebuildWindPressure();
updateLegend();schedule(true);
const t=state.hours[state.tIndex];
el('t-label').textContent=t?new Date(t+'Z').toLocaleString():(state.mode==='demo'?`Demo h${state.tIndex}`:'—');
if(state.probe)showProbe(state.probe.lat,state.probe.lon);
}catch(e){
console.error(e);
status(`<span class="warn">Live failed: ${(e&&e.message)||e} — demo field</span>`);
state.mode='demo';el('go-live').classList.remove('on');el('go-demo').classList.add('on');
const field=W().synthetic_field(layerMeta().kind,TEX_W,TEX_H,state.tIndex*2.5);
applyRange(field);state.field=field instanceof Float32Array?field:Float32Array.from(field);state.fw=TEX_W;state.fh=TEX_H;
state.windSpd=W().synthetic_field(2,TEX_W,TEX_H,0);state.windDir=W().synthetic_field(5,TEX_W,TEX_H,1);
state.presField=W().synthetic_field(4,TEX_W,TEX_H,0);
windLayer.setFields(state.windSpd,state.windDir,TEX_W,TEX_H);
updateLegend();schedule(true);
}
}
function drawBasemap(gen){
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;const Wpx=map.width,Hpx=map.height;
const cx=lonToX(state.lon,z)*scale*dpr,cy=latToY(state.lat,z)*scale*dpr;
const left=cx-Wpx/2,top=cy-Hpx/2,ts=256*scale*dpr;
const pad=state.panning?0:1;
const tx0=Math.floor(left/ts)-pad,tx1=Math.floor((left+Wpx)/ts)+pad;
const ty0=Math.floor(top/ts)-pad,ty1=Math.floor((top+Hpx)/ts)+pad;
mctx.fillStyle='#0b121c';mctx.fillRect(0,0,Wpx,Hpx);
const jobs=[];
for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){
jobs.push(loadTile(B,z,tx,ty).then(im=>{
if(gen!==state.gen||!im)return;
const dx=tx*ts-left,dy=ty*ts-top;
mctx.drawImage(im,dx,dy,ts+0.5,ts+0.5);
}));
}
return Promise.all(jobs);
}
function drawOverlay(){
if(state.panning&&PERF.mobile){octx.clearRect(0,0,ov.width,ov.height);return;}
if(!state.field){octx.clearRect(0,0,ov.width,ov.height);return;}
const Wpx=ov.width,Hpx=ov.height;
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr*PERF.ovScale;
const cx=lonToX(state.lon,z)*scale*dpr,cy=latToY(state.lat,z)*scale*dpr;
const left=cx-Wpx/2,top=cy-Hpx/2;
const step=PERF.mobile?3:2;
const img=octx.createImageData(Wpx,Hpx);
const data=img.data;
const span=Math.max(Math.abs(state.vmax-state.vmin),1e-6);const invSpan=1/span;
const soft=softFactor();const op=state.opacity;
const sample=state.field;const fw=state.fw,fh=state.fh;
const lut=ensureLut();
const lat1=GLOBAL.lat1,latSpan=GLOBAL.lat1-GLOBAL.lat0;
const sScale=scale*dpr;
for(let py=0;py<Hpx;py+=step){
const lat=yToLat((top+py)/sScale,z);
if(lat<-85||lat>85)continue;
const v=Math.max(0,Math.min(1,(lat1-lat)/latSpan));
for(let px=0;px<Wpx;px+=step){
const lon=xToLon((left+px)/sScale,z);
let u=(lon+180)/360;u=u-Math.floor(u);
const val=sampleFieldFast(sample,fw,fh,u,v);
let t=(val-state.vmin)*invSpan;if(t<0)t=0;else if(t>1)t=1;
const li=(t*255)|0;const lo=li*3;
const r=lut[lo],g=lut[lo+1],b=lut[lo+2];
let a=op;
if(soft>0.01){const gate=t<=0.02?0:t>=0.15+soft*0.3?1:(t-0.02)/(0.13+soft*0.3);a*=gate<0?0:gate>1?1:gate;}
const aa=(a*255)|0;if(aa<4)continue;
const yMax=py+step<Hpx?step:Hpx-py,xMax=px+step<Wpx?step:Wpx-px;
for(let dy=0;dy<yMax;dy++){
let o=((py+dy)*Wpx+px)*4;
for(let dx=0;dx<xMax;dx++){data[o]=r;data[o+1]=g;data[o+2]=b;data[o+3]=aa;o+=4;}
}
}
}
octx.putImageData(img,0,0);
if(state.isoOn&&state.presField&&!state.panning){
drawIsobars(octx,state.presField,state.fw,state.fh,{lat:state.lat,lon:state.lon,zoom:state.zoom,bm:getBasemap()},{lonToX,latToY,xToLon,yToLat,clampZoom,PERF},PERF.mobile?5:7);
}
}
let mapBusy=false,pendingRender=false,pendingFull=false;
async function render(full){
if(mapBusy){pendingRender=true;pendingFull=pendingFull||!!full;return;}
mapBusy=true;
const gen=++state.gen;
const wantOverlay=full||state.needOverlay||!state.panning;
try{
await drawBasemap(gen);
if(gen===state.gen&&wantOverlay){drawOverlay();state.needOverlay=false;}
else if(gen===state.gen&&state.panning&&PERF.mobile)octx.clearRect(0,0,ov.width,ov.height);
}finally{
mapBusy=false;
if(pendingRender){const f=pendingFull;pendingRender=false;pendingFull=false;render(f);}
}
}
function schedule(full){
state.needOverlay=state.needOverlay||!!full||!state.panning;
if(state.raf)return;
state.raf=requestAnimationFrame(()=>{state.raf=0;render(!!full||!state.panning);});
}
async function showProbe(lat,lon){
const raw=sampleField(lat,lon);const f=formatVal(raw);
state.probe={lat,lon};
el('probe').classList.add('open');
el('probe-coords').textContent=`${lat.toFixed(3)}°, ${lon.toFixed(3)}°`;
el('probe-val').textContent=Number.isFinite(f.v)?f.v.toFixed(2):'—';
el('probe-unit').textContent=f.u;
el('probe-meta').textContent=`${layerMeta().name}\n${getBasemap().label} · z${state.zoom.toFixed(1)}\n${state.mode} · loading station…`;
if(state.mode!=='live'){el('probe-meta').textContent=`${layerMeta().name}\n${getBasemap().label} · demo · ${W().version()}`;return;}
try{
const det=await fetchPointDetail(lat,lon);
const h=det.forecast?.hourly;const ti=state.tIndex;
const lines=[layerMeta().name,`${getBasemap().label} · z${state.zoom.toFixed(1)}`];
if(h){
const pick=(k,lab,fmt=x=>x?.toFixed?.(1)??x)=>{const a=h[k];if(!a||a[ti]==null)return;lines.push(`${lab}: ${fmt(+a[ti])}`);};
pick('temperature_2m','T °C');pick('apparent_temperature','Feels °C');pick('dewpoint_2m','Td °C');
pick('relative_humidity_2m','RH %',x=>x.toFixed(0));pick('precipitation','Precip mm');
pick('precipitation_probability','PoP %',x=>x.toFixed(0));pick('cloud_cover','Cloud %',x=>x.toFixed(0));
pick('pressure_msl','MSLP hPa',x=>x.toFixed(1));pick('wind_speed_10m','Wind m/s');
pick('wind_gusts_10m','Gust m/s');pick('wind_direction_10m','Wind dir °',x=>x.toFixed(0));
pick('cape','CAPE',x=>x.toFixed(0));pick('visibility','Vis m',x=>x.toFixed(0));
pick('weather_code','WMO code',x=>x.toFixed(0));pick('uv_index','UV',x=>x.toFixed(1));
}
const ah=det.air?.hourly;
if(ah){
const a=k=>ah[k]?.[Math.min(ti,ah[k].length-1)];
if(a('us_aqi')!=null)lines.push(`US AQI: ${a('us_aqi')}`);
if(a('pm2_5')!=null)lines.push(`PM2.5: ${(+a('pm2_5')).toFixed(1)}`);
if(a('ozone')!=null)lines.push(`O₃: ${(+a('ozone')).toFixed(1)}`);
}
const mh=det.marine?.hourly;
if(mh?.wave_height?.[0]!=null)lines.push(`Waves: ${(+mh.wave_height[Math.min(ti,mh.wave_height.length-1)]).toFixed(2)} m`);
lines.push(`Open-Meteo station pull · ${W().version()}`);
if(state.probe&&state.probe.lat===lat&&state.probe.lon===lon)el('probe-meta').textContent=lines.join('\n');
}catch(e){
if(state.probe&&state.probe.lat===lat&&state.probe.lon===lon)
el('probe-meta').textContent=`${layerMeta().name}\nstation detail failed\n${(e&&e.message)||e}`;
}
}
function screenToLL(clientX,clientY){
const r=map.getBoundingClientRect();
const dpr=PERF.dpr;
const px=(clientX-r.left)*dpr,py=(clientY-r.top)*dpr;
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const cx=lonToX(state.lon,z)*scale*dpr,cy=latToY(state.lat,z)*scale*dpr;
const x=(cx-map.width/2+px)/(scale*dpr),y=(cy-map.height/2+py)/(scale*dpr);
return {lat:yToLat(y,z),lon:xToLon(x,z)};
}
function panBy(dx,dy){
const B=getBasemap();const zf=clampZoom(state.zoom,B);const z=Math.floor(zf);const scale=Math.pow(2,zf-z);
const dpr=PERF.dpr;
const cx=lonToX(state.lon,z)*scale*dpr-dx,cy=latToY(state.lat,z)*scale*dpr-dy;
state.lon=xToLon(cx/(scale*dpr),z);state.lat=Math.max(-85,Math.min(85,yToLat(cy/(scale*dpr),z)));
schedule(false);maybeRefetchView();
}
function zoomAt(clientX,clientY,dz){
const before=screenToLL(clientX,clientY);
state.zoom=clampZoom(state.zoom+dz,getBasemap());
const after=screenToLL(clientX,clientY);
state.lon+=before.lon-after.lon;state.lat=Math.max(-85,Math.min(85,state.lat+(before.lat-after.lat)));
schedule(true);maybeRefetchView();
}
async function geocode(q){
const t=q.trim();if(!t)return null;
const m=t.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
if(m)return {lat:+m[1],lon:+m[2],name:`${m[1]}, ${m[2]}`};
const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(t)}&count=1&language=en&format=json`);
const j=await r.json();const hit=j.results?.[0];
return hit?{lat:hit.latitude,lon:hit.longitude,name:`${hit.name}${hit.admin1?', '+hit.admin1:''}${hit.country?', '+hit.country:''}`}:null;
}
function syncStopsUI(){
const row=el('stops-row');if(!row)return;row.innerHTML='';
state.stops.forEach((c,i)=>{
const inp=document.createElement('input');inp.type='color';
const hex='#'+[c[0],c[1],c[2]].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
inp.value=hex;inp.title=`Stop ${i+1}`;
inp.oninput=()=>{const h=inp.value;state.stops[i]=[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];state.preset='custom';el('preset').value='custom';state.lut=null;updateLegend();schedule(true);};
row.appendChild(inp);
});
}
function initUI(){
const grid=el('layer-grid');
LAYERS.forEach((L,i)=>{
const b=document.createElement('button');b.type='button';b.className='lbtn'+(i===0?' active':'');b.textContent=L.name;b.dataset.i=i;
b.onclick=()=>{state.layer=i;grid.querySelectorAll('.lbtn').forEach(x=>x.classList.toggle('active',+x.dataset.i===i));
const p=W().default_palette(L.kind);const key=typeof p==='string'?p:['thermal','precip','jet','turbo','inferno','viridis','gray'][p]||'thermal';
state.preset=key in PRESETS?key:'thermal';state.stops=PRESETS[state.preset].map(c=>c.slice());el('preset').value=state.preset;syncStopsUI();refreshField();};
grid.appendChild(b);
});
const bmRow=el('basemap-row');
Object.values(BASEMAPS).forEach(B=>{
const b=document.createElement('button');b.type='button';b.className='lbtn'+(B.id===state.basemap?' active':'');b.textContent=B.label;b.dataset.b=B.id;
b.onclick=()=>{state.basemap=B.id;bmRow.querySelectorAll('.lbtn').forEach(x=>x.classList.toggle('active',x.dataset.b===B.id));updateLegend();schedule();};
bmRow.appendChild(b);
});
const pre=el('preset');
Object.keys(PRESETS).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k[0].toUpperCase()+k.slice(1);pre.appendChild(o);});
pre.value=state.preset;pre.onchange=()=>{state.preset=pre.value;state.stops=PRESETS[state.preset].map(c=>c.slice());state.lut=null;syncStopsUI();updateLegend();schedule(true);};
syncStopsUI();
el('opacity').value=String(Math.round(state.opacity*100));
el('opacity').oninput=e=>{state.opacity=(+e.target.value)/100;el('op-val').textContent=`${e.target.value}%`;schedule(true);};
el('gamma').oninput=e=>{state.gamma=+e.target.value;el('gamma-val').textContent=(+e.target.value).toFixed(2);state.lut=null;updateLegend();schedule(true);};
el('soft').oninput=e=>{state.soft=+e.target.value;el('soft-val').textContent=(+e.target.value).toFixed(2);schedule(true);};
el('reverse').onchange=e=>{state.reverse=e.target.checked;state.lut=null;updateLegend();schedule(true);};
el('autorange').onchange=e=>{state.autorange=e.target.checked;if(state.field){applyRange(state.field);updateLegend();schedule(true);}};
el('smooth').checked=state.smooth;
el('smooth').onchange=e=>{state.smooth=e.target.checked;refreshField();};
const wOn=el('wind-on');if(wOn){wOn.checked=state.windOn;wOn.onchange=e=>{state.windOn=e.target.checked;windLayer.setEnabled(state.windOn);};}
const iOn=el('iso-on');if(iOn){iOn.checked=state.isoOn;iOn.onchange=e=>{state.isoOn=e.target.checked;schedule(true);};}
el('rmin').oninput=()=>{if(!state.autorange&&state.field){applyRange(state.field);updateLegend();schedule(true);}};
el('rmax').oninput=()=>{if(!state.autorange&&state.field){applyRange(state.field);updateLegend();schedule(true);}};
el('units').onclick=e=>{const b=e.target.closest('button[data-u]');if(!b)return;state.units=b.dataset.u;[...el('units').children].forEach(x=>x.classList.toggle('active',x===b));updateLegend();if(state.probe)showProbe(state.probe.lat,state.probe.lon);};
el('go-live').onclick=async()=>{state.mode='live';el('go-live').classList.add('on');el('go-demo').classList.remove('on');await refreshField({force:true});};
el('go-demo').onclick=()=>{state.mode='demo';el('go-demo').classList.add('on');el('go-live').classList.remove('on');refreshField();};
const refBtn=el('btn-refresh');if(refBtn)refBtn.onclick=()=>refreshField({force:true});
el('btn-search').onclick=async()=>{
try{const hit=await geocode(el('q').value);if(!hit){status('<span class="warn">No match</span>');return;}
state.lat=hit.lat;state.lon=hit.lon;state.zoom=Math.max(state.zoom,8);status(`<span class="ok">${hit.name}</span>`);showProbe(hit.lat,hit.lon);schedule();}
catch{status('<span class="warn">Search failed</span>');}
};
el('q').addEventListener('keydown',e=>{if(e.key==='Enter')el('btn-search').click();});
el('t-slider').oninput=e=>{state.tIndex=+e.target.value;refreshField();};
el('t-prev').onclick=()=>{state.tIndex=Math.max(0,state.tIndex-1);el('t-slider').value=state.tIndex;refreshField();};
el('t-next').onclick=()=>{const mx=+el('t-slider').max;state.tIndex=Math.min(mx,state.tIndex+1);el('t-slider').value=state.tIndex;refreshField();};
let playTimer=null;
el('t-play').onclick=()=>{state.playing=!state.playing;el('t-play').textContent=state.playing?'Pause':'Play';if(playTimer){clearInterval(playTimer);playTimer=null;}
if(state.playing)playTimer=setInterval(()=>{const mx=+el('t-slider').max;state.tIndex=state.tIndex>=mx?0:state.tIndex+1;el('t-slider').value=state.tIndex;refreshField();},500);};
el('zin').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,0.6);
el('zout').onclick=()=>zoomAt(innerWidth/2,innerHeight/2,-0.6);
addEventListener('resize',resize);
const stage=el('stage');
stage.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,e.deltaY<0?0.35:-0.35);},{passive:false});
let dragged=false,sx=0,sy=0,lt=0,coasting=false;
stage.addEventListener('pointerdown',e=>{if(e.button&&e.button!==0)return;stage.setPointerCapture(e.pointerId);state.drag={x:e.clientX,y:e.clientY};state.panning=true;dragged=false;sx=e.clientX;sy=e.clientY;lt=performance.now();state.vel={x:0,y:0};coasting=false;});
stage.addEventListener('pointermove',e=>{
if(!state.drag)return;
const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
if(Math.hypot(e.clientX-sx,e.clientY-sy)>5)dragged=true;
const now=performance.now(),dt=Math.max(8,now-lt);
state.vel={x:dx/dt*16,y:dy/dt*16};lt=now;
state.drag={x:e.clientX,y:e.clientY};
panBy(dx*PERF.dpr,dy*PERF.dpr);
});
stage.addEventListener('pointerup',e=>{
if(!state.drag)return;state.drag=null;state.panning=false;
if(!dragged){schedule(true);const ll=screenToLL(e.clientX,e.clientY);showProbe(ll.lat,ll.lon);return;}
if(PERF.mobile&&Math.hypot(state.vel.x,state.vel.y)<0.8){schedule(true);return;}
coasting=true;
const coast=()=>{
if(state.drag||!coasting||Math.hypot(state.vel.x,state.vel.y)<0.35){coasting=false;state.panning=false;schedule(true);return;}
state.panning=true;
panBy(state.vel.x*PERF.dpr,state.vel.y*PERF.dpr);
state.vel.x*=PERF.mobile?0.86:0.92;state.vel.y*=PERF.mobile?0.86:0.92;
requestAnimationFrame(coast);
};
requestAnimationFrame(coast);
});
stage.addEventListener('pointercancel',()=>{state.drag=null;state.panning=false;coasting=false;schedule(true);});
}
if(PERF.mobile){
document.documentElement.classList.add('wx-mobile');
const hint=el('hint');if(hint)hint.textContent='pan · pinch zoom · tap probe · mobile mode';
}
(async()=>{
await loadWasm();
initUI();
resize();
windLayer.setEnabled(state.windOn);
windLayer.start();
el('op-val').textContent=`${Math.round(state.opacity*100)}%`;
el('gamma-val').textContent='1.00';
el('soft-val').textContent='auto';
try{await refreshField();}catch{state.mode='demo';await refreshField();}
if(navigator.geolocation){
navigator.geolocation.getCurrentPosition(
p=>{state.lat=p.coords.latitude;state.lon=p.coords.longitude;state.zoom=Math.max(state.zoom,6.5);schedule(true);if(state.mode==='live')refreshField({force:true});},
()=>{},
{enableHighAccuracy:false,timeout:5000,maximumAge:600000}
);
}
})();
