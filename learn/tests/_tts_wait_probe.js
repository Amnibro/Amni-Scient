const {chromium}=require('playwright');
const http=require('http');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.webmanifest':'application/manifest+json'};
(async()=>{
let resolveDownload;
const downloadGate=new Promise(r=>{resolveDownload=r;});
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent((req.url||'/').split('?')[0]);
  if(u==='/learn/vendor/vits-web/vits-web.js'){
    const body=`export async function stored(){return window.__piperStored||[];}
export async function download(id,onProg){
  window.__piperDownloads=(window.__piperDownloads||0)+1;
  window.__downloadStarted=true;
  await new Promise(r=>{window.__releaseDownload=r;});
  if(onProg){onProg({loaded:50,total:100});onProg({loaded:100,total:100});}
  window.__piperStored=['en_US-hfc_female-medium'];
}
export async function predict({text,voiceId}){
  window.__piperPredicts=(window.__piperPredicts||0)+1;
  window.__piperLastText=text;
  const sr=22050,n=sr;const buf=new ArrayBuffer(44+n*2);const v=new DataView(buf);
  const s='RIFF';for(let i=0;i<4;i++)v.setUint8(i,s.charCodeAt(i));v.setUint32(4,36+n*2,true);
  const w='WAVEfmt ';for(let i=0;i<8;i++)v.setUint8(8+i,w.charCodeAt(i));
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  const d='data';for(let i=0;i<4;i++)v.setUint8(36+i,d.charCodeAt(i));v.setUint32(40,n*2,true);
  return new Blob([buf],{type:'audio/wav'});
}`;
    res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'});res.end(body);return;
  }
  if(u.startsWith('/learn/vendor/kokoro/')){res.writeHead(404);res.end('no');return;}
  if(u==='/'||u==='/learn'||u==='/learn/')u='/learn/index.html';
  let rel=u.replace(/^\/learn\//,'').replace(/^\//,'');
  const fp=path.join(root,rel);
  if(!fp.startsWith(root)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end('no');return;}
  res.writeHead(200,{'content-type':mime[path.extname(fp)]||'application/octet-stream','cache-control':'no-store'});
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
await page.addInitScript(()=>{
  localStorage.setItem('profile-name','Probe');
  localStorage.setItem('amni-learn-tts','on');
  localStorage.setItem('amni-learn-tts-hd','on');
  localStorage.removeItem('amni-learn-kk');
  window.__webSpeakCount=0;
  const Orig=window.SpeechSynthesisUtterance;
  // count speak calls
  const proto=window.speechSynthesis;
  const origSpeak=proto.speak.bind(proto);
  proto.speak=function(u){window.__webSpeakCount=(window.__webSpeakCount||0)+1;window.__lastWeb=u&&u.text;return origSpeak(u);};
  HTMLMediaElement.prototype.play=async function(){this.dispatchEvent(new Event('ended'));return;};
});
await page.goto(`http://127.0.0.1:${port}/learn/index.html?level=1`,{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof speakSeq==='function',null,{timeout:30000});
await page.evaluate(()=>{const b=document.querySelector('[data-game="phonics"]');if(b)b.click();});
await page.waitForTimeout(800);
// trigger speak while download blocked
await page.evaluate(()=>{if(typeof speakSeq==='function')speakSeq(['Ball. Ball starts with buh. The letter B says buh.']);});
await page.waitForTimeout(600);
const mid=await page.evaluate(()=>({
  banner:(document.getElementById('hd-tts-banner')||{}).textContent||'',
  web:window.__webSpeakCount||0,
  predicts:window.__piperPredicts||0,
  downloading:!!window.__downloadStarted||!!window.__releaseDownload
}));
// release download
await page.evaluate(()=>{if(window.__releaseDownload)window.__releaseDownload();});
await page.waitForTimeout(2500);
const end=await page.evaluate(()=>({
  banner:(document.getElementById('hd-tts-banner')||{}).textContent||'',
  web:window.__webSpeakCount||0,
  predicts:window.__piperPredicts||0,
  last:window.__piperLastText||''
}));
console.log(JSON.stringify({mid,end,errors},null,2));
await browser.close();server.close();
const realErr=errors.filter(e=>!/\$ is not defined/.test(e));
if(realErr.length){console.error('pageerrors',realErr);process.exit(1);}
if(mid.web>0){console.error('stock TTS spoke during load',mid);process.exit(1);}
if(!/Loading natural voice/i.test(mid.banner)){console.error('missing wait banner',mid);process.exit(1);}
if(end.predicts<1){console.error('piper never ran',end);process.exit(1);}
console.log('PROBE OK wait-for-hd');
})().catch(e=>{console.error(e);process.exit(1);});
