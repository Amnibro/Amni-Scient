const WMO={0:['Clear','☀'],1:['Mainly clear','🌤'],2:['Partly cloudy','⛅'],3:['Overcast','☁'],45:['Fog','🌫'],48:['Rime fog','🌫'],51:['Light drizzle','🌦'],53:['Drizzle','🌦'],55:['Heavy drizzle','🌧'],56:['Freezing drizzle','🌧'],57:['Freezing drizzle','🌧'],61:['Light rain','🌧'],63:['Rain','🌧'],65:['Heavy rain','🌧'],66:['Freezing rain','🌧'],67:['Freezing rain','🌧'],71:['Light snow','🌨'],73:['Snow','🌨'],75:['Heavy snow','🌨'],77:['Snow grains','🌨'],80:['Rain showers','🌦'],81:['Rain showers','🌧'],82:['Heavy showers','🌧'],85:['Snow showers','🌨'],86:['Heavy snow sh.','🌨'],95:['Thunderstorm','⛈'],96:['Storm + hail','⛈'],99:['Storm + hail','⛈']};
function wmo(code){const c=WMO[code|0]||['—','·'];return{label:c[0],icon:c[1],code:code|0};}
function fmtHour(t){try{const d=new Date(t);return d.toLocaleString(undefined,{weekday:'short',hour:'numeric',hour12:true});}catch{return String(t).slice(5,16);}}
function fmtDay(t){try{return new Date(t+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}catch{return t;}}
function tempF(c,us){return us?c*9/5+32:c;}
function windU(ms,us){return us?ms*2.236936:ms;}
function precipU(mm,us){return us?mm/25.4:mm;}
function visU(m,us){const km=m>200?m/1000:m;return us?km*0.621371:km;}
function uvBand(u){return u==null||!Number.isFinite(u)?'—':u<3?'Low':u<6?'Moderate':u<8?'High':u<11?'Very high':'Extreme';}
function uvColor(u){return u==null?'#6a8aaa':u<3?'#3ddea0':u<6?'#e8d44d':u<8?'#ff9a3c':u<11?'#ff5a3c':'#c44dff';}
function aqiBand(a){return a==null||!Number.isFinite(a)?'—':a<=50?'Good':a<=100?'Moderate':a<=150?'USG':a<=200?'Unhealthy':a<=300?'Very unhealthy':'Hazardous';}
function aqiColor(a){return a==null?'#6a8aaa':a<=50?'#3ddea0':a<=100?'#e8d44d':a<=150?'#ff9a3c':a<=200?'#ff5a3c':a<=300?'#c44dff':'#7a1020';}
function surfScore(h,per,windMs){
if(!Number.isFinite(h)||h<=0)return{score:0,label:'No surf / inland',stars:0};
const p=Number.isFinite(per)?per:8;
const w=Number.isFinite(windMs)?windMs:5;
let s=0;
if(h>=0.4&&h<=3.5)s+=40;else if(h>0&&h<0.4)s+=15;else if(h>3.5&&h<5)s+=25;else s+=5;
if(p>=8&&p<=16)s+=35;else if(p>=6)s+=20;else s+=8;
if(w<6)s+=25;else if(w<10)s+=15;else if(w<14)s+=5;else s+=0;
s=Math.max(0,Math.min(100,s));
const stars=s>=80?5:s>=65?4:s>=50?3:s>=35?2:s>=15?1:0;
const label=stars>=4?'Good':stars===3?'Fair':stars===2?'Poor':'Flat / rough';
return{score:s,label,stars};
}
function idxNow(times){
if(!times?.length)return 0;
const now=Date.now();
let best=0,bd=1e18;
for(let i=0;i<times.length;i++){const d=Math.abs(new Date(times[i]).getTime()-now);if(d<bd){bd=d;best=i;}}
return best;
}
function pick(arr,i){return arr&&arr[i]!=null&&Number.isFinite(+arr[i])?+arr[i]:null;}
function spark(vals,w=120,h=28,color='#4db8ff'){
if(!vals?.length)return'';
const nums=vals.map(v=>Number.isFinite(+v)?+v:null).filter(v=>v!=null);
if(!nums.length)return'';
const lo=Math.min(...nums),hi=Math.max(...nums),span=hi-lo||1;
const pts=vals.map((v,i)=>{const x=i/(Math.max(1,vals.length-1))*w;const y=v==null||!Number.isFinite(+v)?h/2:h-2-((+v-lo)/span)*(h-4);return`${x.toFixed(1)},${y.toFixed(1)}`;}).join(' ');
return`<svg class="fc-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline fill="none" stroke="${color}" stroke-width="1.6" points="${pts}"/></svg>`;
}
function starsHtml(n){return'★'.repeat(n)+'☆'.repeat(Math.max(0,5-n));}
function unitLabels(us){return{t:us?'°F':'°C',w:us?'mph':'m/s',p:us?'in':'mm',v:us?'mi':'km'};}
function renderSummary(data,us){
const h=data.hourly,d=data.daily,u=unitLabels(us);
if(!h?.time?.length)return`<div class="fc-empty">No hourly data</div>`;
const i=idxNow(h.time);
const code=wmo(pick(h.weather_code,i));
const t=pick(h.temperature_2m,i),app=pick(h.apparent_temperature,i);
const rh=pick(h.relative_humidity_2m,i),pr=pick(h.precipitation,i),pp=pick(h.precipitation_probability,i);
const ws=pick(h.wind_speed_10m,i),wg=pick(h.wind_gusts_10m,i),wd=pick(h.wind_direction_10m,i);
const uv=pick(h.uv_index,i),vis=pick(h.visibility,i),cape=pick(h.cape,i),pres=pick(h.pressure_msl,i);
const tMax=d?.temperature_2m_max?.[0],tMin=d?.temperature_2m_min?.[0],uvMax=d?.uv_index_max?.[0];
const mi=data.marine?idxNow(data.marine.time||h.time):0;
const wh=data.marine?pick(data.marine.wave_height,mi):null;
const wp=data.marine?pick(data.marine.wave_period,mi):null;
const surf=surfScore(wh,wp,ws);
const tDisp=v=>v==null?'—':tempF(v,us).toFixed(1);
const wDisp=v=>v==null?'—':windU(v,us).toFixed(1);
return`<div class="fc-now">
<div class="fc-now-main"><span class="fc-ico">${code.icon}</span><div><div class="fc-temp">${tDisp(t)}<small>${u.t}</small></div><div class="fc-cond">${code.label}</div><div class="fc-feel">Feels ${tDisp(app)}${u.t}</div></div></div>
<div class="fc-grid">
<div class="fc-card"><span>Humidity</span><b>${rh==null?'—':rh.toFixed(0)}%</b></div>
<div class="fc-card"><span>Precip</span><b>${pr==null?'—':precipU(pr,us).toFixed(2)} ${u.p}</b>${pp!=null?`<i>${pp.toFixed(0)}%</i>`:''}</div>
<div class="fc-card"><span>Wind</span><b>${wDisp(ws)} ${u.w}</b>${wd!=null?`<i>${wd.toFixed(0)}°</i>`:''}</div>
<div class="fc-card"><span>Gusts</span><b>${wDisp(wg)} ${u.w}</b></div>
<div class="fc-card"><span>UV now</span><b style="color:${uvColor(uv)}">${uv==null?'—':uv.toFixed(1)}</b><i>${uvBand(uv)}</i></div>
<div class="fc-card"><span>UV max</span><b style="color:${uvColor(uvMax)}">${uvMax==null?'—':(+uvMax).toFixed(1)}</b></div>
<div class="fc-card"><span>Pressure</span><b>${pres==null?'—':(us?pres*0.02953:pres).toFixed(us?2:0)} ${us?'inHg':'hPa'}</b></div>
<div class="fc-card"><span>Vis</span><b>${vis==null?'—':visU(vis,us).toFixed(1)} ${u.v}</b></div>
<div class="fc-card"><span>CAPE</span><b>${cape==null?'—':cape.toFixed(0)}</b></div>
<div class="fc-card"><span>Hi / Lo</span><b>${tDisp(tMax)} / ${tDisp(tMin)}</b></div>
<div class="fc-card"><span>Surf</span><b>${starsHtml(surf.stars)}</b><i>${surf.label}${wh!=null?` · ${wh.toFixed(1)}m`:''}</i></div>
</div>
<div class="fc-spark-row"><span>24h temp</span>${spark((h.temperature_2m||[]).slice(i,i+24).map(v=>tempF(v,us)),160,30,'#4db8ff')}</div>
<div class="fc-spark-row"><span>24h UV</span>${spark((h.uv_index||[]).slice(i,i+24),160,30,'#ff9a3c')}</div>
</div>`;
}
function renderHourly(data,us){
const h=data.hourly,u=unitLabels(us);
if(!h?.time?.length)return`<div class="fc-empty">No hourly data</div>`;
const i0=idxNow(h.time);
const n=Math.min(h.time.length,i0+48);
let rows='';
for(let i=i0;i<n;i++){
const code=wmo(pick(h.weather_code,i));
const t=pick(h.temperature_2m,i),pp=pick(h.precipitation_probability,i),pr=pick(h.precipitation,i);
const ws=pick(h.wind_speed_10m,i),uv=pick(h.uv_index,i);
rows+=`<div class="fc-hrow"><span class="fc-ht">${fmtHour(h.time[i])}</span><span class="fc-hi">${code.icon}</span><span class="fc-hv">${t==null?'—':tempF(t,us).toFixed(0)}°</span><span class="fc-hp">${pp==null?'—':pp.toFixed(0)}%<small>${pr!=null&&pr>0?precipU(pr,us).toFixed(2)+u.p:''}</small></span><span class="fc-hw">${ws==null?'—':windU(ws,us).toFixed(0)}${u.w}</span><span class="fc-hu" style="color:${uvColor(uv)}">${uv==null?'—':uv.toFixed(1)}</span></div>`;
}
return`<div class="fc-hhead"><span>Time</span><span></span><span>Temp</span><span>Rain</span><span>Wind</span><span>UV</span></div><div class="fc-hlist">${rows}</div>`;
}
function renderDaily(data,us){
const d=data.daily,u=unitLabels(us);
if(!d?.time?.length)return`<div class="fc-empty">No daily data</div>`;
let rows='';
for(let i=0;i<d.time.length;i++){
const code=wmo(pick(d.weather_code,i));
const hi=pick(d.temperature_2m_max,i),lo=pick(d.temperature_2m_min,i);
const uv=pick(d.uv_index_max,i),ps=pick(d.precipitation_sum,i),pp=pick(d.precipitation_probability_max,i);
const ws=pick(d.wind_speed_10m_max,i);
rows+=`<div class="fc-drow"><span class="fc-dd">${fmtDay(d.time[i])}</span><span class="fc-di">${code.icon}</span><span class="fc-dr">${code.label}</span><span class="fc-dt"><b>${hi==null?'—':tempF(hi,us).toFixed(0)}°</b> / ${lo==null?'—':tempF(lo,us).toFixed(0)}°</span><span class="fc-du" style="color:${uvColor(uv)}">UV ${uv==null?'—':(+uv).toFixed(1)}</span><span class="fc-dp">${pp==null?'—':pp.toFixed(0)}% · ${ps==null?'—':precipU(ps,us).toFixed(2)}${u.p}</span><span class="fc-dw">${ws==null?'—':windU(ws,us).toFixed(0)} ${u.w}</span></div>`;
}
return`<div class="fc-dlist">${rows}</div>`;
}
function renderSurf(data,us){
const m=data.marine,h=data.hourly,u=unitLabels(us);
if(!m?.time?.length)return`<div class="fc-empty">No marine data at this point (inland or unavailable). Try a coastal pin.</div>`;
const i0=idxNow(m.time);
const wh=pick(m.wave_height,i0),wp=pick(m.wave_period,i0),wd=pick(m.wave_direction,i0);
const sh=pick(m.swell_wave_height,i0),sp=pick(m.swell_wave_period,i0),sd=pick(m.swell_wave_direction,i0);
const sst=pick(m.sea_surface_temperature,i0),ww=pick(m.wind_wave_height,i0);
const wi=h?idxNow(h.time):i0;
const wind=h?pick(h.wind_speed_10m,wi):null;
const surf=surfScore(wh,wp,wind);
let rows='';
const n=Math.min(m.time.length,i0+36);
for(let i=i0;i<n;i+=1){
if((i-i0)%2&&i!==i0)continue;
const hh=pick(m.wave_height,i),pp=pick(m.wave_period,i);
const sc=surfScore(hh,pp,wind);
rows+=`<div class="fc-srow"><span>${fmtHour(m.time[i])}</span><span>${hh==null?'—':hh.toFixed(1)} m</span><span>${pp==null?'—':pp.toFixed(0)} s</span><span class="fc-stars">${starsHtml(sc.stars)}</span></div>`;
}
return`<div class="fc-surf-hero"><div class="fc-stars big">${starsHtml(surf.stars)}</div><div><b>${surf.label}</b><div class="fc-sub">score ${surf.score}/100</div></div></div>
<div class="fc-grid">
<div class="fc-card"><span>Wave height</span><b>${wh==null?'—':wh.toFixed(2)} m</b></div>
<div class="fc-card"><span>Wave period</span><b>${wp==null?'—':wp.toFixed(1)} s</b></div>
<div class="fc-card"><span>Wave dir</span><b>${wd==null?'—':wd.toFixed(0)}°</b></div>
<div class="fc-card"><span>Swell</span><b>${sh==null?'—':sh.toFixed(2)} m</b><i>${sp!=null?sp.toFixed(0)+'s':''}${sd!=null?' · '+sd.toFixed(0)+'°':''}</i></div>
<div class="fc-card"><span>Wind waves</span><b>${ww==null?'—':ww.toFixed(2)} m</b></div>
<div class="fc-card"><span>SST</span><b>${sst==null?'—':tempF(sst,us).toFixed(1)} ${u.t}</b></div>
<div class="fc-card"><span>Wind</span><b>${wind==null?'—':windU(wind,us).toFixed(1)} ${u.w}</b></div>
</div>
<div class="fc-spark-row"><span>Waves</span>${spark((m.wave_height||[]).slice(i0,i0+36),180,30,'#3ddea0')}</div>
<div class="fc-shead"><span>Time</span><span>Ht</span><span>Per</span><span>Score</span></div>
<div class="fc-slist">${rows}</div>`;
}
function renderUvAir(data,us){
const h=data.hourly,a=data.air;
const i=h?idxNow(h.time):0;
const uv=h?pick(h.uv_index,i):null;
const rad=h?pick(h.shortwave_radiation,i):null;
const d=data.daily;
let dayUv='';
if(d?.uv_index_max){
for(let j=0;j<d.uv_index_max.length;j++){
const u=d.uv_index_max[j];
const pct=Math.max(0,Math.min(100,(+u/12)*100));
dayUv+=`<div class="fc-uvday"><span>${fmtDay(d.time[j])}</span><div class="pbar"><i style="width:${pct}%;background:${uvColor(u)}"></i></div><b style="color:${uvColor(u)}">${u==null?'—':(+u).toFixed(1)}</b><i>${uvBand(u)}</i></div>`;
}
}
const ai=a?.time?idxNow(a.time):0;
const pm25=a?pick(a.pm2_5,ai):null,pm10=a?pick(a.pm10,ai):null,aqi=a?pick(a.us_aqi,ai):null,o3=a?pick(a.ozone,ai):null;
return`<div class="fc-grid">
<div class="fc-card wide"><span>UV index now</span><b style="color:${uvColor(uv)};font-size:22px">${uv==null?'—':uv.toFixed(1)}</b><i>${uvBand(uv)}</i></div>
<div class="fc-card"><span>Solar radiation</span><b>${rad==null?'—':rad.toFixed(0)} W/m²</b></div>
<div class="fc-card"><span>US AQI</span><b style="color:${aqiColor(aqi)}">${aqi==null?'—':aqi.toFixed(0)}</b><i>${aqiBand(aqi)}</i></div>
<div class="fc-card"><span>PM2.5</span><b>${pm25==null?'—':pm25.toFixed(1)} µg/m³</b></div>
<div class="fc-card"><span>PM10</span><b>${pm10==null?'—':pm10.toFixed(1)} µg/m³</b></div>
<div class="fc-card"><span>Ozone</span><b>${o3==null?'—':o3.toFixed(0)} µg/m³</b></div>
</div>
<div class="fc-spark-row"><span>UV 48h</span>${spark((h?.uv_index||[]).slice(i,i+48),180,32,'#ff9a3c')}</div>
${a?.us_aqi?`<div class="fc-spark-row"><span>AQI 48h</span>${spark((a.us_aqi||[]).slice(ai,ai+48),180,32,'#c44dff')}</div>`:''}
<h4 class="fc-h4">Daily UV max</h4>
<div class="fc-uvlist">${dayUv||'<div class="fc-empty">No daily UV</div>'}</div>`;
}
function renderTab(tab,data,us){
if(!data)return`<div class="fc-empty">No forecast yet — drop a pin or enable location</div>`;
if(tab==='hourly')return renderHourly(data,us);
if(tab==='daily')return renderDaily(data,us);
if(tab==='surf')return renderSurf(data,us);
if(tab==='uv')return renderUvAir(data,us);
return renderSummary(data,us);
}
function setForecastLoading(root,msg){
const body=root.querySelector('#fc-body');
if(body)body.innerHTML=`<div class="fc-empty">${msg||'Loading forecast…'}</div>`;
}
function setForecastError(root,msg){
const body=root.querySelector('#fc-body');
if(body)body.innerHTML=`<div class="fc-empty warn">${msg}</div>`;
}
function renderForecastPanel(root,data,opts={}){
if(!root)return;
const us=!!opts.us;
const tab=opts.tab||root.dataset.tab||'summary';
root.dataset.tab=tab;
const place=root.querySelector('#fc-place');
if(place)place.textContent=opts.place||(data?`${data.lat.toFixed(2)}°, ${data.lon.toFixed(2)}°`:'—');
const src=root.querySelector('#fc-src');
if(src)src.textContent=data?`${data.source||'open-meteo'} · ${data.timezone||''} · ${new Date(data.fetchedAt||Date.now()).toLocaleTimeString()}`:'';
root.querySelectorAll('.fc-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
const body=root.querySelector('#fc-body');
if(body)body.innerHTML=renderTab(tab,data,us);
root.classList.add('open');
}
export{wmo,surfScore,uvBand,renderForecastPanel,setForecastLoading,setForecastError,renderTab,idxNow};
