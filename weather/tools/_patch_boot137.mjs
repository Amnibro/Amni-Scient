import fs from 'fs';
const path='weather/wx-boot.137.js';
fs.copyFileSync('weather/wx-boot.136.js',path);
let s=fs.readFileSync(path,'utf8');
s=s.replace(/\?v=136/g,'?v=137');
s=s.replace(
"import {loadManifest,getHourField,sampleField,fieldStats,preloadCore,packHours,packMeta,enhanceField,upsampleBilinear,smoothBox} from './fields.js?v=137';",
"import {loadManifest,getHourField,sampleField,fieldStats,preloadCore,packHours,packMeta,packAgeMs,packIsStale,enhanceField,upsampleBilinear,smoothBox} from './fields.js?v=137';"
);
s=s.replace("mode:'live'","mode:'pack'");
s=s.replace('wantLive:true','wantLive:false');
const newRefresh=`async function refresh(opts={}){
const force=!!opts.force;
const boot=!!opts.boot;
const wantLive=!!opts.live;
try{
if(boot)showLoader('Pack','Loading global field pack…',15);
try{
await loadManifest('/weather/data/',{force:force||boot});
await preloadCore(state.tIndex|0);
await loadPackLayer();
updatePackAge();
schedule(true);
if(boot)showLoader('Pack','Global fields ready',90);
}catch(pe){
console.warn(pe);
status('<span class="warn">Pack load failed: '+(pe.message||pe)+'</span>');
}
if(wantLive&&!isRateBlocked()){
if(boot)showLoader('Live','Optional live upgrade…',92);
else setLiveChip(true,'Fetching live stations…');
try{
const onStatus=m=>{
const mm=String(m||'');
const prog=mm.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
const pct=prog?35+Math.round(55*(+prog[1]/Math.max(1,+prog[2]))):55;
if(boot)showLoader('Live',mm,pct);else liveProgress('<span class="ok">'+mm+'</span>',pct);
};
const bundle=await fetchLiveBundle({lat:state.lat,lon:state.lon,zoom:state.zoom,activeKey:L().key,onStatus,force:!!opts.force});
state.liveBundle=bundle;state.liveKey=viewLiveKey();
const field=await applyLiveBundle(bundle);
status('<span class="ok">Live · '+bundle.lats.length+' stations · '+field.w+'×'+field.h+'</span>');
}catch(liveErr){
console.warn(liveErr);
status('<span class="warn">'+softApiMsg(liveErr.message||liveErr)+' · pack map OK</span>',{hold:4500});
}
setLiveChip(false);
}
if(boot){showLoader('Ready','Pack online',100);setTimeout(hideLoader,280);}
if(state.hazOn)reloadHazards().catch(()=>{});
schedule(true);
updatePackAge();
}catch(e){
console.error(e);
status('<span class="warn">'+softApiMsg(e.message||e)+'</span>');
setLiveChip(false);
if(boot)hideLoader();
}
}
function updatePackAge(){
const chip=el('pack-age');if(!chip)return;
const man=packMeta();
if(!man){chip.hidden=true;return;}
const age=packAgeMs();
const stale=packIsStale();
const baked=man.bakedAt?new Date(man.bakedAt):null;
let when='—';
if(baked&&Number.isFinite(baked.getTime())){
const h=Math.floor((age||0)/3600e3),m=Math.floor(((age||0)%3600e3)/60000);
when=h>=48?Math.floor(h/24)+'d ago':h>=1?h+'h ago':m+'m ago';
}
const src=man.source==='open-meteo'?'Open-Meteo':(man.source||'pack');
chip.hidden=false;
chip.classList.toggle('stale',!!stale);
chip.innerHTML=stale
?'<span class="pa-dot"></span><b>Pack stale</b> · '+when+' · '+src
:'<span class="pa-dot"></span><b>Pack</b> · updated '+when+' · '+src;
chip.title=man.bakedAt?('Baked '+man.bakedAt+(man.validUntil?' · valid until '+man.validUntil:'')+' · '+(man.grid||(man.w+'x'+man.h))):'Field pack';
const sub=document.querySelector('#brand .sub');
if(sub)sub.textContent=stale?'pack stale · next bake soon':'pack · hazards · reports';
}
function scheduleLiveLod(){}
`;
const a=s.indexOf('async function refresh(opts={}){');
const b=s.indexOf('function project(lat,lon){');
if(a<0||b<0)throw new Error('markers '+a+' '+b);
s=s.slice(0,a)+newRefresh+s.slice(b);
s=s.replace(
/el\('btn-refresh'\)&&\(el\('btn-refresh'\)\.onclick=\(\)=>refresh\(\{[^}]*\}\)\);/,
"el('btn-refresh')&&(el('btn-refresh').onclick=()=>refresh({force:true,boot:false,live:false}));"
);
s=s.replace(
/await refresh\(\{boot:true,packFirst:true,force:false\}\);/,
'await refresh({boot:true,force:true,live:false});updatePackAge();'
);
s=s.replace(
/function setModeUI\(\)\{const b=el\('btn-refresh'\);if\(b\)b\.title='Reload live fields';\}/,
"function setModeUI(){const b=el('btn-refresh');if(b){b.title='Reload field pack';b.textContent='↻ Pack';}}"
);
s=s.replace(/if\(!isMobileUI\(\)\)setTimeout\(\(\)=>scheduleForecast\(false\),2500\);/,'/* forecast on demand only */');
s=s.replace(/ · Live · Amni-Weather/g,' · Pack · Amni-Weather');
s=s.replace(/Live fields · Amni-Weather/g,'Pack · Amni-Weather');
s=s.replace(
/const sel=el\('preset'\);if\(sel\)sel\.value=p;refresh\(\{force:false,packFirst:true,quiet:false\}\);/,
"const sel=el('preset');if(sel)sel.value=p;refresh({force:false,live:false});"
);
s=s.replace(
/const sel=el\('preset'\);if\(sel\)sel\.value=p;refresh\(\);/,
"const sel=el('preset');if(sel)sel.value=p;refresh({force:false,live:false});"
);
// fix double-escaped regex in onStatus from template - we used \\d in template string which is correct as \d in output
fs.writeFileSync(path,s);
let body=s.replace(/^import .+;$/gm,'').replace(/^export .+;$/gm,'');
try{new Function(body);console.log('OK 137');}catch(e){console.log('FAIL',e.message);}
console.log('has updatePackAge',s.includes('function updatePackAge'));
console.log('wantLive',s.includes('wantLive:false'));
console.log('mode pack',s.includes("mode:'pack'"));
