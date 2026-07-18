import {writeFileSync,mkdirSync} from 'fs';
import {dirname,join} from 'path';
import {fileURLToPath} from 'url';
const __dir=dirname(fileURLToPath(import.meta.url));
const out=join(__dir,'../data');
mkdirSync(out,{recursive:true});
const W=144,H=72,HOURS=12;
const LAT0=-85,LAT1=85,LON0=-180,LON1=180;
const VARS=['temperature_2m','apparent_temperature','dewpoint_2m','relative_humidity_2m','precipitation','cloud_cover','pressure_msl','wind_speed_10m','wind_direction_10m','wind_u','wind_v','cape','uv_index','visibility'];
function lerp(a,b,t){return a+(b-a)*t;}
function latOf(j){return lerp(LAT1,LAT0,H>1?j/(H-1):0);}
function lonOf(i){return lerp(LON0,LON1,W>1?i/(W-1):0);}
function n2(lat,lon,t,a,b){
const tw=t*0.2618;
return (Math.sin(lat*a+tw)*Math.cos(lon*b-tw*0.7))*0.5+0.5;
}
function fieldAt(key,lat,lon,t){
const bl=Math.max(-1,Math.min(1,lat/90));
const jet=Math.exp(-((lat-45)**2)/200)+Math.exp(-((lat+40)**2)/240);
const n=n2(lat,lon,t,0.11,0.08)*0.55+n2(lat,lon,t,0.27,0.19)*0.45;
const nJet=n*(0.6+0.4*jet);
switch(key){
case 'temperature_2m':return 28-Math.abs(bl)*36+(n-0.5)*14+jet*7+Math.sin(t*0.26)*2;
case 'apparent_temperature':return 26-Math.abs(bl)*34+(n-0.5)*12+jet*5;
case 'dewpoint_2m':return 12-Math.abs(bl)*20+(n-0.5)*8;
case 'relative_humidity_2m':return 35+n*55;
case 'precipitation':return Math.pow(nJet,2.2)*9;
case 'cloud_cover':return Math.pow(n,0.85)*95;
case 'pressure_msl':return 1008+n*22-Math.abs(bl)*6+(1-jet)*4;
case 'wind_speed_10m':return 2+n*12+jet*14;
case 'wind_direction_10m':{
const u=-(lat-20)*0.15+Math.sin(lon*0.04+t*0.1)*8;
const v=Math.cos(lat*0.05)*6+Math.sin(lon*0.03)*4;
return (270-Math.atan2(v,u)*180/Math.PI+360)%360;
}
case 'wind_u':{
const spd=2+n*12+jet*14;
const dir=(270-Math.atan2(Math.cos(lat*0.05)*6+Math.sin(lon*0.03)*4,-(lat-20)*0.15+Math.sin(lon*0.04+t*0.1)*8)*180/Math.PI+360)%360;
const r=((270-dir)*Math.PI)/180;return spd*Math.cos(r);
}
case 'wind_v':{
const spd=2+n*12+jet*14;
const dir=(270-Math.atan2(Math.cos(lat*0.05)*6+Math.sin(lon*0.03)*4,-(lat-20)*0.15+Math.sin(lon*0.04+t*0.1)*8)*180/Math.PI+360)%360;
const r=((270-dir)*Math.PI)/180;return spd*Math.sin(r);
}
case 'cape':return Math.pow(nJet,1.6)*2200;
case 'uv_index':return Math.max(0,n*(1-Math.abs(bl))*11);
case 'visibility':return (1-n)*38000+n*4000;
default:return n*100;
}
}
const hours=[];
const now=new Date();now.setUTCMinutes(0,0,0);
for(let h=0;h<HOURS;h++){
const d=new Date(now.getTime()+h*3600e3);
hours.push(d.toISOString().slice(0,13)+':00');
}
const files={};
for(const key of VARS){
const buf=new Float32Array(HOURS*H*W);
for(let hr=0;hr<HOURS;hr++){
for(let j=0;j<H;j++){
const lat=latOf(j);
for(let i=0;i<W;i++){
const lon=lonOf(i);
buf[hr*H*W+j*W+i]=fieldAt(key,lat,lon,hr);
}
}
}
const name=key.replace(/[^a-z0-9_]/gi,'_')+'.f32';
writeFileSync(join(out,name),Buffer.from(buf.buffer));
files[key]=name;
console.log('wrote',name,buf.length);
}
const manifest={
version:2,
source:'amni-pack-v1',
note:'Prebaked equirectangular fields. Browser streams + renders only. Re-bake: node weather/tools/bake_fields.mjs',
hours,w:W,h:H,lat0:LAT0,lat1:LAT1,lon0:LON0,lon1:LON1,vars:VARS,files,
bakedAt:new Date().toISOString()
};
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest));
console.log('manifest',HOURS,'h',W,'x',H,VARS.length,'vars');
