const KEY='amni-wx-reports-v1';
const TYPES=[
{id:'flood',label:'Flooding',ttlH:8,icon:'🌊'},
{id:'hail',label:'Hail',ttlH:4,icon:'🧊'},
{id:'tornado',label:'Tornado / funnel',ttlH:3,icon:'🌪️'},
{id:'wind',label:'Damaging wind',ttlH:5,icon:'💨'},
{id:'ice',label:'Ice / slick',ttlH:10,icon:'❄️'},
{id:'snow',label:'Heavy snow',ttlH:12,icon:'🌨️'},
{id:'fire',label:'Wildfire / smoke',ttlH:18,icon:'🔥'},
{id:'quake',label:'Felt earthquake',ttlH:24,icon:'🫨'},
{id:'volcano',label:'Ash / eruption',ttlH:36,icon:'🌋'},
{id:'other',label:'Other hazard',ttlH:6,icon:'⚠️'}
];
function loadRaw(){
try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch{return[];}
}
function saveRaw(list){
try{localStorage.setItem(KEY,JSON.stringify(list.slice(-200)));}catch{}
}
export function reportTypes(){return TYPES;}
export function listReports(now=Date.now()){
const list=loadRaw().filter(r=>now-(r.time||0)<(r.ttl||6*3600e3));
if(list.length!==loadRaw().length)saveRaw(list);
return list;
}
export function addReport({lat,lon,type,note}){
const meta=TYPES.find(t=>t.id===type)||TYPES[TYPES.length-1];
const rec={
id:'rep-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
kind:'report',lat,lon,type:meta.id,title:`${meta.icon} ${meta.label}`,
note:(note||'').slice(0,160),time:Date.now(),ttl:meta.ttlH*3600e3,
icon:meta.icon,confirm:1,lat0:lat,lon0:lon
};
const list=listReports();
list.push(rec);saveRaw(list);
return rec;
}
export function clearExpired(){listReports();}
export function advectReports(windU,windV,meta,dtHours){
if(!windU||!windV||!meta)return listReports();
const {w,h,lat0,lat1,lon0,lon1}=meta;
const list=listReports();
const now=Date.now();
for(const r of list){
const ageH=(now-r.time)/3600e3;
const u=sample(windU,w,h,r.lat0??r.lat,r.lon0??r.lon,lat0,lat1,lon0,lon1);
const v=sample(windV,w,h,r.lat0??r.lat,r.lon0??r.lon,lat0,lat1,lon0,lon1);
const hours=Math.min(ageH,dtHours!=null?dtHours:ageH);
const dlon=(u*hours*3.6)/(111.32*Math.cos((r.lat0??r.lat)*Math.PI/180)||0.2);
const dlat=(v*hours*3.6)/110.57;
r.lon=(r.lon0??r.lon)+dlon*0.35;
r.lat=(r.lat0??r.lat)+dlat*0.35;
r.lat=Math.max(-85,Math.min(85,r.lat));
r.lon=((r.lon+540)%360)-180;
}
saveRaw(list);
return list;
}
function sample(data,w,h,lat,lon,lat0,lat1,lon0,lon1){
const u=(lon-lon0)/Math.max(1e-6,lon1-lon0);
const v=(lat1-lat)/Math.max(1e-6,lat1-lat0);
const x=Math.max(0,Math.min(1,((u%1)+1)%1))*(w-1);
const y=Math.max(0,Math.min(1,v))*(h-1);
const x0=x|0,y0=y|0,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;
const i=(xx,yy)=>data[yy*w+xx]||0;
return i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx+((i(x0,y1)+(i(x1,y1)-i(x0,y1))*fx)-(i(x0,y0)+(i(x1,y0)-i(x0,y0))*fx))*fy;
}
export function reportsInView(list,vb,zoom){
const max=zoom<4?8:zoom<7?25:60;
const out=[];
for(const r of list){
if(r.lat<vb.lat0||r.lat>vb.lat1||r.lon<vb.lon0||r.lon>vb.lon1)continue;
out.push(r);if(out.length>=max)break;
}
return out;
}
