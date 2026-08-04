const fs=require('fs');
let h=fs.readFileSync('weather/index.html','utf8');
h=h.replace(/wx-boot\.\d+\.js/g,'wx-boot.134.js');
h=h.replace(/style\.css(\?v=[A-Za-z0-9._-]+)?/g,'style.css?v=b250');
fs.writeFileSync('weather/index.html',h);
const stub="import '/weather/wx-boot.134.js';\n";
for(const f of ['app.js','wx-app.js','wx-boot.133.js','wx-boot.132.js','wx-boot.131.js','wx-boot.130.js']){
fs.writeFileSync('weather/'+f,stub);
}
let s=fs.readFileSync('weather/wx-boot.134.js','utf8');
const idx=s.indexOf('`n');
console.log('backtick-n index',idx);
if(idx>=0)console.log(JSON.stringify(s.slice(idx-30,idx+40)));
console.log('index boot', (h.match(/wx-boot\.\d+\.js/)||[])[0]);
console.log('index style', (h.match(/style\.css\?v=\d+/)||[])[0]);
