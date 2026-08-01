const fs=require('fs');
const p='weather/wx-boot.134.js';
let s=fs.readFileSync(p,'utf8');
const broken=/try\{windLayer\.onViewChange&&windLayer\.onViewChange\(\);\}catch\{\}`nschedule\(true\);`nscheduleLiveLod\(\);`nif\(state\.hazOn&&Date\.now\(\)-state\.lastHaz>8000\)reloadHazards\(\)\.catch\(\(\)=>\{\}\);/;
const fixed='try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}\nschedule(true);\nscheduleLiveLod();\nif(state.hazOn&&Date.now()-state.lastHaz>8000)reloadHazards().catch(()=>{});';
if(broken.test(s)){s=s.replace(broken,fixed);console.log('fixed backtick-n zoomAt');}
else{
const i=s.indexOf('scheduleLiveLod');
console.log('sample around first scheduleLiveLod:',JSON.stringify(s.slice(Math.max(0,i-80),i+120)));
const alt=/try\{windLayer\.onViewChange&&windLayer\.onViewChange\(\);\}catch\{\}[\s\S]{0,40}schedule\(true\);[\s\S]{0,40}scheduleLiveLod\(\);[\s\S]{0,40}if\(state\.hazOn&&Date\.now\(\)-state\.lastHaz>8000\)reloadHazards\(\)\.catch\(\(\)=>\{\}\);/;
if(alt.test(s)){s=s.replace(alt,fixed);console.log('fixed via alt');}
else console.log('no zoomAt pattern');
}
s=s.replace(
'if(PERF.mobile&&Math.hypot(state.vel.x,state.vel.y)<0.8){try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);return;}',
'if(PERF.mobile&&Math.hypot(state.vel.x,state.vel.y)<0.8){try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);scheduleLiveLod();return;}'
);
s=s.replace(
'coasting=false;state.panning=false;try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);return;}',
'coasting=false;state.panning=false;try{windLayer.onViewChange&&windLayer.onViewChange();}catch{}schedule(true);scheduleLiveLod();return;}'
);
fs.writeFileSync(p,s);
const lines=s.split(/\n/);
const hits=lines.map((l,i)=>[i+1,l]).filter(([,l])=>l.includes('scheduleLiveLod'));
console.log(hits.map(([n,l])=>n+': '+l.slice(0,140)).join('\n'));
