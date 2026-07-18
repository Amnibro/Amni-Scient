const MOBILE=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&Math.min(screen.width,screen.height)<900);
const BASEMAPS={
satellite:{id:'satellite',label:'Satellite',attr:'Imagery © Esri',url:(z,x,y)=>`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`},
osm:{id:'osm',label:'OpenStreetMap',attr:'© OpenStreetMap contributors',url:(z,x,y)=>`https://tile.openstreetmap.org/${z}/${x}/${y}.png`},
cartoDark:{id:'cartoDark',label:'CARTO Dark',attr:'© CARTO © OpenStreetMap',url:(z,x,y)=>MOBILE?`https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`:`https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png`},
cartoLight:{id:'cartoLight',label:'CARTO Light',attr:'© CARTO © OpenStreetMap',url:(z,x,y)=>MOBILE?`https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`:`https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}@2x.png`},
topo:{id:'topo',label:'Terrain',attr:'© OpenTopoMap © OSM',url:(z,x,y)=>`https://a.tile.opentopomap.org/${z}/${x}/${y}.png`}
};
const cache=new Map();
const inflight=new Map();
const MAX_CACHE=MOBILE?80:160;
function isPlaceholder(im){
if(MOBILE)return false;
try{
const c=document.createElement('canvas');c.width=c.height=8;
const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,8,8);
const d=g.getImageData(0,0,8,8).data;let s=0,q=0,n=0;
for(let i=0;i<d.length;i+=4){const v=(d[i]+d[i+1]+d[i+2])/3;s+=v;q+=v*v;n++;}
const m=s/n;return Math.sqrt(Math.max(0,q/n-m*m))<10&&m>140;
}catch{return false;}
}
function loadTile(bm,z,x,y){
const n=1<<z;const xx=((x%n)+n)%n;if(y<0||y>=n)return Promise.resolve(null);
const key=`${bm.id}_${z}_${xx}_${y}`;
if(cache.has(key))return Promise.resolve(cache.get(key));
if(inflight.has(key))return inflight.get(key);
const p=new Promise(res=>{
const im=new Image();
im.crossOrigin='anonymous';
im.decoding='async';
im.onload=()=>{
const ok=im&&!isPlaceholder(im)?im:null;
if(ok){if(cache.size>=MAX_CACHE){const first=cache.keys().next().value;cache.delete(first);}cache.set(key,ok);}
inflight.delete(key);res(ok);
};
im.onerror=()=>{inflight.delete(key);res(null);};
im.src=bm.url(z,xx,y);
});
inflight.set(key,p);
return p;
}
function lonToX(lon,z){return (lon+180)/360*(1<<z)*256;}
function latToY(lat,z){const la=Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/180;return (1-Math.log(Math.tan(la)+1/Math.cos(la))/Math.PI)/2*(1<<z)*256;}
function xToLon(x,z){return x/((1<<z)*256)*360-180;}
function yToLat(y,z){const t=Math.PI*(1-2*y/((1<<z)*256));return Math.atan(Math.sinh(t))*180/Math.PI;}
function clampZoom(z,bm){const max=bm.id==='satellite'?(MOBILE?17:19):bm.id==='topo'?17:19;return Math.max(2,Math.min(max,z));}
export {BASEMAPS,loadTile,lonToX,latToY,xToLon,yToLat,clampZoom,cache,MOBILE};
