import {lonToX,latToY,clampZoom,MOBILE} from './tiles.js?v=131';
const CITIES=[
{n:'Tokyo',la:35.68,lo:139.69,p:37.4,c:1},{n:'Delhi',la:28.61,lo:77.21,p:32.9,c:1},{n:'Shanghai',la:31.23,lo:121.47,p:28.5,c:0},
{n:'São Paulo',la:-23.55,lo:-46.63,p:22.4,c:0},{n:'Mexico City',la:19.43,lo:-99.13,p:22.1,c:1},{n:'Cairo',la:30.04,lo:31.24,p:21.3,c:1},
{n:'Dhaka',la:23.81,lo:90.41,p:21.0,c:1},{n:'Beijing',la:39.90,lo:116.41,p:21.0,c:1},{n:'Mumbai',la:19.08,lo:72.88,p:20.7,c:0},
{n:'Osaka',la:34.69,lo:135.50,p:19.1,c:0},{n:'New York',la:40.71,lo:-74.01,p:18.8,c:0},{n:'Karachi',la:24.86,lo:67.01,p:16.8,c:0},
{n:'Buenos Aires',la:-34.60,lo:-58.38,p:15.4,c:1},{n:'Chongqing',la:29.56,lo:106.55,p:15.3,c:0},{n:'Istanbul',la:41.01,lo:28.98,p:15.2,c:0},
{n:'Kolkata',la:22.57,lo:88.36,p:15.1,c:0},{n:'Manila',la:14.60,lo:120.98,p:14.4,c:1},{n:'Lagos',la:6.52,lo:3.38,p:14.3,c:0},
{n:'Rio de Janeiro',la:-22.91,lo:-43.17,p:13.5,c:0},{n:'Tianjin',la:39.13,lo:117.20,p:13.4,c:0},{n:'Kinshasa',la:-4.32,lo:15.31,p:12.8,c:1},
{n:'Guangzhou',la:23.13,lo:113.26,p:12.7,c:0},{n:'Los Angeles',la:34.05,lo:-118.24,p:12.5,c:0},{n:'Moscow',la:55.76,lo:37.62,p:12.5,c:1},
{n:'Shenzhen',la:22.54,lo:114.06,p:12.4,c:0},{n:'Lahore',la:31.55,lo:74.34,p:12.0,c:0},{n:'Bangalore',la:12.97,lo:77.59,p:11.9,c:0},
{n:'Paris',la:48.86,lo:2.35,p:11.1,c:1},{n:'Bogotá',la:4.71,lo:-74.07,p:11.0,c:1},{n:'Jakarta',la:-6.21,lo:106.85,p:10.8,c:1},
{n:'Chennai',la:13.08,lo:80.27,p:10.7,c:0},{n:'Lima',la:-12.05,lo:-77.04,p:10.7,c:1},{n:'Bangkok',la:13.76,lo:100.50,p:10.5,c:1},
{n:'Seoul',la:37.57,lo:126.98,p:10.0,c:1},{n:'Nagoya',la:35.18,lo:136.91,p:9.5,c:0},{n:'Hyderabad',la:17.39,lo:78.49,p:9.5,c:0},
{n:'London',la:51.51,lo:-0.13,p:9.4,c:1},{n:'Tehran',la:35.69,lo:51.39,p:9.1,c:1},{n:'Chicago',la:41.88,lo:-87.63,p:8.9,c:0},
{n:'Chengdu',la:30.57,lo:104.07,p:8.8,c:0},{n:'Nanjing',la:32.06,lo:118.80,p:8.5,c:0},{n:'Wuhan',la:30.59,lo:114.31,p:8.3,c:0},
{n:'Ho Chi Minh',la:10.82,lo:106.63,p:8.3,c:0},{n:'Luanda',la:-8.84,lo:13.23,p:8.2,c:1},{n:'Ahmedabad',la:23.03,lo:72.58,p:8.0,c:0},
{n:'Kuala Lumpur',la:3.14,lo:101.69,p:7.8,c:1},{n:'Xi\'an',la:34.34,lo:108.94,p:7.7,c:0},{n:'Hong Kong',la:22.32,lo:114.17,p:7.5,c:0},
{n:'Dongguan',la:23.02,lo:113.75,p:7.4,c:0},{n:'Hangzhou',la:30.27,lo:120.16,p:7.2,c:0},{n:'Foshan',la:23.02,lo:113.12,p:7.1,c:0},
{n:'Shenyang',la:41.81,lo:123.43,p:7.0,c:0},{n:'Riyadh',la:24.71,lo:46.68,p:6.9,c:1},{n:'Baghdad',la:33.32,lo:44.37,p:6.8,c:1},
{n:'Santiago',la:-33.45,lo:-70.67,p:6.8,c:1},{n:'Surat',la:21.17,lo:72.83,p:6.6,c:0},{n:'Madrid',la:40.42,lo:-3.70,p:6.6,c:1},
{n:'Suzhou',la:31.30,lo:120.59,p:6.5,c:0},{n:'Pune',la:18.52,lo:73.86,p:6.5,c:0},{n:'Harbin',la:45.80,lo:126.53,p:6.4,c:0},
{n:'Houston',la:29.76,lo:-95.37,p:6.3,c:0},{n:'Dallas',la:32.78,lo:-96.80,p:6.2,c:0},{n:'Toronto',la:43.65,lo:-79.38,p:6.2,c:0},
{n:'Dar es Salaam',la:-6.79,lo:39.21,p:6.1,c:0},{n:'Miami',la:25.76,lo:-80.19,p:6.1,c:0},{n:'Belo Horizonte',la:-19.92,lo:-43.94,p:6.0,c:0},
{n:'Singapore',la:1.35,lo:103.82,p:5.9,c:1},{n:'Philadelphia',la:39.95,lo:-75.17,p:5.8,c:0},{n:'Atlanta',la:33.75,lo:-84.39,p:5.7,c:0},
{n:'Fukuoka',la:33.59,lo:130.40,p:5.6,c:0},{n:'Khartoum',la:15.50,lo:32.56,p:5.5,c:1},{n:'Barcelona',la:41.39,lo:2.17,p:5.5,c:0},
{n:'Johannesburg',la:-26.20,lo:28.05,p:5.5,c:0},{n:'Saint Petersburg',la:59.93,lo:30.34,p:5.4,c:0},{n:'Qingdao',la:36.07,lo:120.38,p:5.4,c:0},
{n:'Dalian',la:38.91,lo:121.61,p:5.3,c:0},{n:'Washington',la:38.91,lo:-77.04,p:5.3,c:1},{n:'Yangon',la:16.87,lo:96.20,p:5.2,c:0},
{n:'Alexandria',la:31.20,lo:29.92,p:5.2,c:0},{n:'Jinan',la:36.65,lo:117.12,p:5.1,c:0},{n:'Guadalajara',la:20.66,lo:-103.35,p:5.1,c:0},
{n:'Ankara',la:39.93,lo:32.86,p:5.1,c:1},{n:'Melbourne',la:-37.81,lo:144.96,p:5.0,c:0},{n:'Sydney',la:-33.87,lo:151.21,p:5.0,c:0},
{n:'Brasília',la:-15.79,lo:-47.88,p:4.7,c:1},{n:'Cape Town',la:-33.92,lo:18.42,p:4.6,c:0},{n:'Monterrey',la:25.69,lo:-100.32,p:4.6,c:0},
{n:'Berlin',la:52.52,lo:13.41,p:4.6,c:1},{n:'Busan',la:35.18,lo:129.08,p:4.5,c:0},{n:'Rome',la:41.90,lo:12.50,p:4.3,c:1},
{n:'Montreal',la:45.50,lo:-73.57,p:4.2,c:0},{n:'Hanoi',la:21.03,lo:105.85,p:4.1,c:1},{n:'Pusan',la:35.18,lo:129.08,p:4.0,c:0},
{n:'Phoenix',la:33.45,lo:-112.07,p:4.0,c:0},{n:'Recife',la:-8.05,lo:-34.90,p:4.0,c:0},{n:'Porto Alegre',la:-30.03,lo:-51.23,p:3.9,c:0},
{n:'Medellín',la:6.25,lo:-75.56,p:3.9,c:0},{n:'Fortaleza',la:-3.73,lo:-38.52,p:3.9,c:0},{n:'Jaipur',la:26.91,lo:75.79,p:3.8,c:0},
{n:'Casablanca',la:33.57,lo:-7.59,p:3.8,c:0},{n:'Nairobi',la:-1.29,lo:36.82,p:3.8,c:1},{n:'Naples',la:40.85,lo:14.27,p:3.7,c:0},
{n:'Addis Ababa',la:9.03,lo:38.74,p:3.7,c:1},{n:'Detroit',la:42.33,lo:-83.05,p:3.7,c:0},{n:'Salvador',la:-12.97,lo:-38.50,p:3.6,c:0},
{n:'San Francisco',la:37.77,lo:-122.42,p:3.6,c:0},{n:'Seattle',la:47.61,lo:-122.33,p:3.5,c:0},{n:'Boston',la:42.36,lo:-71.06,p:3.5,c:0},
{n:'Denver',la:39.74,lo:-104.99,p:3.0,c:0},{n:'Minneapolis',la:44.98,lo:-93.27,p:2.9,c:0},{n:'San Diego',la:32.72,lo:-117.16,p:2.9,c:0},
{n:'Tampa',la:27.95,lo:-82.46,p:2.8,c:0},{n:'Vancouver',la:49.28,lo:-123.12,p:2.6,c:0},{n:'Portland',la:45.52,lo:-122.68,p:2.5,c:0},
{n:'Las Vegas',la:36.17,lo:-115.14,p:2.4,c:0},{n:'Sacramento',la:38.58,lo:-121.49,p:2.3,c:0},{n:'Orlando',la:28.54,lo:-81.38,p:2.2,c:0},
{n:'Austin',la:30.27,lo:-97.74,p:2.1,c:0},{n:'San Antonio',la:29.42,lo:-98.49,p:2.1,c:0},{n:'Charlotte',la:35.23,lo:-80.84,p:2.0,c:0},
{n:'Columbus',la:39.96,lo:-83.00,p:1.9,c:0},{n:'Indianapolis',la:39.77,lo:-86.16,p:1.8,c:0},{n:'Nashville',la:36.16,lo:-86.78,p:1.7,c:0},
{n:'Salt Lake City',la:40.76,lo:-111.89,p:1.3,c:0},{n:'Kansas City',la:39.10,lo:-94.58,p:1.7,c:0},{n:'Milwaukee',la:43.04,lo:-87.91,p:1.5,c:0},
{n:'Oklahoma City',la:35.47,lo:-97.52,p:1.4,c:0},{n:'New Orleans',la:29.95,lo:-90.07,p:1.3,c:0},{n:'Cleveland',la:41.50,lo:-81.69,p:1.8,c:0},
{n:'Pittsburgh',la:40.44,lo:-79.99,p:1.7,c:0},{n:'Cincinnati',la:39.10,lo:-84.51,p:1.7,c:0},{n:'Raleigh',la:35.78,lo:-78.64,p:1.4,c:0},
{n:'Honolulu',la:21.31,lo:-157.86,p:1.0,c:0},{n:'Anchorage',la:61.22,lo:-149.90,p:0.4,c:0},{n:'Albuquerque',la:35.08,lo:-106.65,p:0.9,c:0},
{n:'El Paso',la:31.76,lo:-106.49,p:0.9,c:0},{n:'Memphis',la:35.15,lo:-90.05,p:1.1,c:0},{n:'Louisville',la:38.25,lo:-85.76,p:1.0,c:0},
{n:'Calgary',la:51.05,lo:-114.07,p:1.4,c:0},{n:'Edmonton',la:53.55,lo:-113.49,p:1.3,c:0},{n:'Ottawa',la:45.42,lo:-75.70,p:1.4,c:1},
{n:'Quebec City',la:46.81,lo:-71.21,p:0.8,c:0},{n:'Winnipeg',la:49.90,lo:-97.14,p:0.8,c:0},{n:'Halifax',la:44.65,lo:-63.58,p:0.4,c:0},
{n:'Havana',la:23.11,lo:-82.37,p:2.1,c:1},{n:'Santo Domingo',la:18.49,lo:-69.93,p:3.0,c:1},{n:'San Juan',la:18.47,lo:-66.11,p:2.0,c:0},
{n:'Guatemala City',la:14.63,lo:-90.51,p:2.9,c:1},{n:'Panama City',la:8.98,lo:-79.52,p:1.8,c:1},{n:'Caracas',la:10.48,lo:-66.90,p:2.9,c:1},
{n:'Quito',la:-0.18,lo:-78.47,p:2.7,c:1},{n:'La Paz',la:-16.50,lo:-68.15,p:1.8,c:1},{n:'Asunción',la:-25.26,lo:-57.58,p:2.3,c:1},
{n:'Montevideo',la:-34.90,lo:-56.16,p:1.7,c:1},{n:'Caracas',la:10.49,lo:-66.88,p:2.9,c:1},{n:'Kingston',la:17.97,lo:-76.79,p:1.2,c:1},
{n:'Dublin',la:53.35,lo:-6.26,p:1.2,c:1},{n:'Lisbon',la:38.72,lo:-9.14,p:2.9,c:1},{n:'Amsterdam',la:52.37,lo:4.90,p:2.5,c:1},
{n:'Brussels',la:50.85,lo:4.35,p:2.1,c:1},{n:'Vienna',la:48.21,lo:16.37,p:2.0,c:1},{n:'Prague',la:50.08,lo:14.44,p:1.3,c:1},
{n:'Warsaw',la:52.23,lo:21.01,p:1.8,c:1},{n:'Budapest',la:47.50,lo:19.04,p:1.8,c:1},{n:'Bucharest',la:44.43,lo:26.10,p:1.8,c:1},
{n:'Athens',la:37.98,lo:23.73,p:3.2,c:1},{n:'Sofia',la:42.70,lo:23.32,p:1.2,c:1},{n:'Belgrade',la:44.79,lo:20.45,p:1.4,c:1},
{n:'Zagreb',la:45.81,lo:15.98,p:0.8,c:1},{n:'Stockholm',la:59.33,lo:18.07,p:1.6,c:1},{n:'Oslo',la:59.91,lo:10.75,p:1.0,c:1},
{n:'Copenhagen',la:55.68,lo:12.57,p:1.3,c:1},{n:'Helsinki',la:60.17,lo:24.94,p:1.3,c:1},{n:'Reykjavik',la:64.15,lo:-21.94,p:0.2,c:1},
{n:'Zurich',la:47.38,lo:8.54,p:1.4,c:0},{n:'Geneva',la:46.20,lo:6.14,p:0.6,c:0},{n:'Milan',la:45.46,lo:9.19,p:3.1,c:0},
{n:'Munich',la:48.14,lo:11.58,p:1.5,c:0},{n:'Hamburg',la:53.55,lo:9.99,p:1.8,c:0},{n:'Frankfurt',la:50.11,lo:8.68,p:0.8,c:0},
{n:'Lyon',la:45.76,lo:4.84,p:1.7,c:0},{n:'Marseille',la:43.30,lo:5.37,p:1.6,c:0},{n:'Manchester',la:53.48,lo:-2.24,p:2.7,c:0},
{n:'Birmingham',la:52.48,lo:-1.90,p:2.6,c:0},{n:'Glasgow',la:55.86,lo:-4.25,p:1.0,c:0},{n:'Edinburgh',la:55.95,lo:-3.19,p:0.5,c:0},
{n:'Kyiv',la:50.45,lo:30.52,p:3.0,c:1},{n:'Minsk',la:53.90,lo:27.57,p:2.0,c:1},{n:'Riga',la:56.95,lo:24.11,p:0.6,c:1},
{n:'Vilnius',la:54.69,lo:25.28,p:0.5,c:1},{n:'Tallinn',la:59.44,lo:24.75,p:0.4,c:1},{n:'Tbilisi',la:41.72,lo:44.79,p:1.1,c:1},
{n:'Baku',la:40.41,lo:49.87,p:2.3,c:1},{n:'Yerevan',la:40.18,lo:44.51,p:1.1,c:1},{n:'Tashkent',la:41.30,lo:69.24,p:2.5,c:1},
{n:'Almaty',la:43.24,lo:76.95,p:2.0,c:0},{n:'Astana',la:51.17,lo:71.43,p:1.2,c:1},{n:'Ulaanbaatar',la:47.92,lo:106.92,p:1.5,c:1},
{n:'Islamabad',la:33.68,lo:73.05,p:1.1,c:1},{n:'Kabul',la:34.53,lo:69.17,p:4.4,c:1},{n:'Kathmandu',la:27.72,lo:85.32,p:1.4,c:1},
{n:'Colombo',la:6.93,lo:79.85,p:2.3,c:1},{n:'Dhaka',la:23.81,lo:90.41,p:21.0,c:1},{n:'Yangon',la:16.87,lo:96.20,p:5.2,c:0},
{n:'Phnom Penh',la:11.56,lo:104.92,p:2.1,c:1},{n:'Vientiane',la:17.98,lo:102.63,p:0.8,c:1},{n:'Taipei',la:25.03,lo:121.57,p:2.7,c:0},
{n:'Osaka',la:34.69,lo:135.50,p:19.1,c:0},{n:'Sapporo',la:43.06,lo:141.35,p:2.0,c:0},{n:'Pyongyang',la:39.04,lo:125.76,p:3.0,c:1},
{n:'Ulaanbaatar',la:47.92,lo:106.92,p:1.5,c:1},{n:'Perth',la:-31.95,lo:115.86,p:2.1,c:0},{n:'Brisbane',la:-27.47,lo:153.03,p:2.5,c:0},
{n:'Adelaide',la:-34.93,lo:138.60,p:1.4,c:0},{n:'Auckland',la:-36.85,lo:174.76,p:1.7,c:0},{n:'Wellington',la:-41.29,lo:174.78,p:0.4,c:1},
{n:'Suva',la:-18.14,lo:178.44,p:0.2,c:1},{n:'Port Moresby',la:-9.44,lo:147.18,p:0.4,c:1},{n:'Honolulu',la:21.31,lo:-157.86,p:1.0,c:0},
{n:'Casablanca',la:33.57,lo:-7.59,p:3.8,c:0},{n:'Algiers',la:36.75,lo:3.06,p:2.7,c:1},{n:'Tunis',la:36.81,lo:10.18,p:2.3,c:1},
{n:'Tripoli',la:32.89,lo:13.19,p:1.2,c:1},{n:'Rabat',la:34.02,lo:-6.83,p:1.8,c:1},{n:'Dakar',la:14.72,lo:-17.47,p:3.1,c:1},
{n:'Abidjan',la:5.36,lo:-4.01,p:4.9,c:0},{n:'Accra',la:5.60,lo:-0.19,p:2.5,c:1},{n:'Lagos',la:6.52,lo:3.38,p:14.3,c:0},
{n:'Abuja',la:9.06,lo:7.49,p:3.5,c:1},{n:'Douala',la:4.05,lo:9.70,p:3.0,c:0},{n:'Yaoundé',la:3.87,lo:11.52,p:2.8,c:1},
{n:'Kinshasa',la:-4.32,lo:15.31,p:12.8,c:1},{n:'Brazzaville',la:-4.26,lo:15.28,p:1.9,c:1},{n:'Kampala',la:0.35,lo:32.58,p:3.3,c:1},
{n:'Kigali',la:-1.94,lo:30.06,p:1.1,c:1},{n:'Lusaka',la:-15.39,lo:28.32,p:2.5,c:1},{n:'Harare',la:-17.83,lo:31.05,p:1.5,c:1},
{n:'Maputo',la:-25.97,lo:32.57,p:1.1,c:1},{n:'Antananarivo',la:-18.88,lo:47.51,p:3.4,c:1},{n:'Gaborone',la:-24.63,lo:25.91,p:0.3,c:1},
{n:'Windhoek',la:-22.56,lo:17.08,p:0.4,c:1},{n:'Pretoria',la:-25.75,lo:28.19,p:2.5,c:1},{n:'Durban',la:-29.86,lo:31.02,p:3.1,c:0},
{n:'Dubai',la:25.20,lo:55.27,p:3.4,c:0},{n:'Abu Dhabi',la:24.45,lo:54.38,p:1.5,c:1},{n:'Doha',la:25.29,lo:51.53,p:0.6,c:1},
{n:'Kuwait City',la:29.38,lo:47.99,p:3.1,c:1},{n:'Manama',la:26.23,lo:50.59,p:0.6,c:1},{n:'Muscat',la:23.59,lo:58.41,p:1.4,c:1},
{n:'Sana\'a',la:15.37,lo:44.19,p:2.9,c:1},{n:'Amman',la:31.95,lo:35.91,p:4.0,c:1},{n:'Beirut',la:33.89,lo:35.50,p:2.2,c:1},
{n:'Damascus',la:33.51,lo:36.29,p:2.5,c:1},{n:'Jerusalem',la:31.77,lo:35.22,p:0.9,c:1},{n:'Tel Aviv',la:32.09,lo:34.78,p:4.0,c:0},
{n:'Istanbul',la:41.01,lo:28.98,p:15.2,c:0},{n:'Ankara',la:39.93,lo:32.86,p:5.1,c:1},{n:'Izmir',la:38.42,lo:27.14,p:3.0,c:0},
{n:'Jeddah',la:21.49,lo:39.19,p:4.0,c:0},{n:'Mecca',la:21.39,lo:39.86,p:2.0,c:0},{n:'Medina',la:24.47,lo:39.61,p:1.5,c:0}
];
function cityMinZ(c){
if(c.c&&c.p>=0.3)return 2.8;
if(c.p>=10)return 2.5;
if(c.p>=5)return 3.5;
if(c.p>=2)return 5.0;
if(c.p>=1)return 6.2;
if(c.p>=0.5)return 7.5;
return 9.0;
}
let countries=null,states=null,loadP=null;
function loadBorders(base='/weather/data/'){
if(loadP)return loadP;
loadP=Promise.all([
fetch(base+'ne_countries_110m.geojson').then(r=>r.ok?r.json():null).catch(()=>null),
fetch(base+'ne_states_110m.geojson').then(r=>r.ok?r.json():null).catch(()=>null)
]).then(([c,s])=>{countries=c;states=s;return{countries,states};});
return loadP;
}
function createRefLayer(canvas,opts){
const ctx=canvas.getContext('2d');
const lonToX=opts.lonToX,latToY=opts.latToY,clampZoom=opts.clampZoom,PERF=opts.PERF,getView=opts.getView;
let citiesOn=true,bordersOn=true,enabled=true;
function resize(){
const dpr=PERF.dpr,w=innerWidth,h=innerHeight;
canvas.width=(w*dpr)|0;canvas.height=(h*dpr)|0;canvas.style.width=w+'px';canvas.style.height=h+'px';
}
function project(lat,lon,view){
const B=view.bm,zf=clampZoom(view.zoom,B),z=Math.floor(zf),scale=Math.pow(2,zf-z),dpr=PERF.dpr;
const cx=lonToX(view.lon,z)*scale*dpr,cy=latToY(view.lat,z)*scale*dpr;
return{x:lonToX(lon,z)*scale*dpr-cx+canvas.width/2,y:latToY(lat,z)*scale*dpr-cy+canvas.height/2,z,zf,scale,dpr};
}
function eachRing(geom,fn){
if(!geom)return;
if(geom.type==='Polygon')geom.coordinates.forEach((ring,i)=>{if(i===0||ring.length>40)fn(ring);});
else if(geom.type==='MultiPolygon')geom.coordinates.forEach(poly=>poly.forEach((ring,i)=>{if(i===0||ring.length>40)fn(ring);}));
else if(geom.type==='LineString')fn(geom.coordinates);
else if(geom.type==='MultiLineString')geom.coordinates.forEach(fn);
}
function strokeCoords(coords,view,pad){
if(!coords||coords.length<2)return;
const W=canvas.width,H=canvas.height;
let started=false,px=0,py=0,seg=0;
const step=view.zoom<4?2:1;
for(let i=0;i<coords.length;i+=step){
const lon=coords[i][0],lat=coords[i][1];
const p=project(lat,lon,view);
if(p.x<-pad||p.x>W+pad||p.y<-pad||p.y>H+pad){started=false;continue;}
if(!started){ctx.moveTo(p.x,p.y);started=true;px=p.x;py=p.y;seg=0;continue;}
if((p.x-px)*(p.x-px)+(p.y-py)*(p.y-py)<4)continue;
ctx.lineTo(p.x,p.y);px=p.x;py=p.y;seg++;
if(seg>400){ctx.stroke();ctx.beginPath();ctx.moveTo(px,py);seg=0;}
}
}
function drawBorders(view){
if(!bordersOn||!countries)return;
const zf=view.zoom,pad=40;
ctx.save();
ctx.lineJoin='round';ctx.lineCap='round';
ctx.strokeStyle=view.bm.id==='satellite'||view.bm.id==='topo'?'rgba(255,255,255,0.55)':'rgba(120,180,230,0.55)';
ctx.lineWidth=Math.max(1,PERF.dpr*(zf<4?1.1:1.35));
ctx.beginPath();
const feats=countries.features||[];
const maxF=zf<3?80:feats.length;
for(let i=0;i<Math.min(feats.length,maxF);i++){
const f=feats[i];
const lr=f.properties?.LABELRANK??f.properties?.scalerank??1;
if(zf<3&&lr>3)continue;
if(zf<4&&lr>5)continue;
eachRing(f.geometry,ring=>strokeCoords(ring,view,pad));
}
ctx.stroke();
if(states&&zf>=4.2){
ctx.strokeStyle=view.bm.id==='satellite'||view.bm.id==='topo'?'rgba(255,230,160,0.4)':'rgba(180,200,220,0.4)';
ctx.lineWidth=Math.max(0.8,PERF.dpr*0.9);
ctx.beginPath();
for(const f of states.features||[])eachRing(f.geometry,ring=>strokeCoords(ring,view,pad));
ctx.stroke();
}
ctx.restore();
}
function drawCities(view){
if(!citiesOn)return;
const zf=view.zoom,W=canvas.width,H=canvas.height,pad=20;
const maxN=MOBILE?(zf<5?18:40):(zf<5?28:70);
const sat=view.bm.id==='satellite'||view.bm.id==='topo';
const list=CITIES.filter(c=>zf>=cityMinZ(c)).sort((a,b)=>(b.p+(b.c?2:0))-(a.p+(a.c?2:0)));
const used=[];
ctx.save();
ctx.font=`${Math.max(10,11*PERF.dpr)|0}px "Segoe UI",system-ui,sans-serif`;
ctx.textBaseline='middle';
let n=0;
for(const c of list){
if(n>=maxN)break;
const p=project(c.la,c.lo,view);
if(p.x<-pad||p.x>W+pad||p.y<-pad||p.y>H+pad)continue;
let hit=false;
for(const u of used){if(Math.hypot(u.x-p.x,u.y-p.y)<(MOBILE?48:56)*PERF.dpr){hit=true;break;}}
if(hit)continue;
used.push(p);n++;
const r=(c.c?3.2:2.4)*PERF.dpr;
ctx.beginPath();
ctx.fillStyle=sat?'rgba(255,220,80,0.95)':'rgba(77,184,255,0.95)';
ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
if(c.c){ctx.strokeStyle=sat?'rgba(255,255,255,0.85)':'rgba(200,240,255,0.85)';ctx.lineWidth=PERF.dpr;ctx.stroke();}
const label=c.n;
const tw=ctx.measureText(label).width;
const lx=p.x+r+4*PERF.dpr,ly=p.y;
ctx.fillStyle=sat?'rgba(0,0,0,0.55)':'rgba(4,12,22,0.72)';
ctx.fillRect(lx-2*PERF.dpr,ly-7*PERF.dpr,tw+6*PERF.dpr,14*PERF.dpr);
ctx.fillStyle=sat?'#fff':'#e8f4ff';
ctx.fillText(label,lx,ly);
}
ctx.restore();
}
function draw(probe){
if(!enabled){ctx.clearRect(0,0,canvas.width,canvas.height);return;}
const view=getView();
ctx.clearRect(0,0,canvas.width,canvas.height);
if(view.panning&&MOBILE&&!probe)return;
drawBorders(view);
drawCities(view);
}
return{
resize,draw,loadBorders,
setCities:v=>{citiesOn=!!v;},
setBorders:v=>{bordersOn=!!v;},
setEnabled:v=>{enabled=!!v;},
get citiesOn(){return citiesOn;},
get bordersOn(){return bordersOn;}
};
}
function projectScreen(lat,lon,view,mapEl,PERF){
const B=view.bm,zf=clampZoom(view.zoom,B),z=Math.floor(zf),scale=Math.pow(2,zf-z),dpr=PERF.dpr;
const r=mapEl.getBoundingClientRect();
const cx=lonToX(view.lon,z)*scale*dpr,cy=latToY(view.lat,z)*scale*dpr;
const x=(lonToX(lon,z)*scale*dpr-cx+mapEl.width/2)/dpr+r.left;
const y=(latToY(lat,z)*scale*dpr-cy+mapEl.height/2)/dpr+r.top;
return{x,y,on:x>=r.left-40&&x<=r.right+40&&y>=r.top-40&&y<=r.bottom+40};
}
export{CITIES,cityMinZ,loadBorders,createRefLayer,projectScreen};
