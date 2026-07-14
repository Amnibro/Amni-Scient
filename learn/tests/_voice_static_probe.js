const {chromium}=require('playwright');
const http=require('http');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.png':'image/png','.webmanifest':'application/manifest+json'};
(async()=>{
let voiceReqs=0,vendorReqs=0;
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent((req.url||'/').split('?')[0]);
  if(u.includes('/vendor/')){vendorReqs++;res.writeHead(404,{'content-type':'text/plain'});res.end('vendor blocked');return;}
  if(u.includes('/assets/voice/')&&u.endsWith('.ogg'))voiceReqs++;
  if(u==='/'||u==='/learn'||u==='/learn/')u='/learn/index.html';
  let rel=u.replace(/^\/learn\//,'').replace(/^\//,'');
  const fp=path.join(root,rel);
  if(!fp.startsWith(root)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end('no '+u);return;}
  res.writeHead(200,{'content-type':mime[path.extname(fp)]||'application/octet-stream','cache-control':'no-store'});
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e.message||e)));
await page.addInitScript(()=>{
  localStorage.setItem('profile-name','Probe');
  localStorage.setItem('amni-learn-tts','on');
  localStorage.setItem('amni-learn-tts-hd','on');
  window.__played=[];
  const op=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=async function(){window.__played.push(this.src.slice(0,80));setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return;};
});
await page.goto(`http://127.0.0.1:${port}/learn/index.html?level=1`,{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof speakSeq==='function',null,{timeout:30000});
await page.waitForFunction(()=>{try{return typeof playCurrentPage==='function';}catch(e){return false;}},null,{timeout:15000});
await page.waitForTimeout(1200);
const opened=await page.evaluate(()=>{
  const b=document.querySelector('[data-game="storybook"]');
  if(!b)return null;
  b.click();
  return 'storybook';
});
await page.waitForTimeout(600);
await page.evaluate(()=>{const c=document.querySelector('.storybook-card');c&&c.click();});
await page.waitForTimeout(4000);
const midVoice=voiceReqs;
await page.evaluate(()=>{if(typeof stopSpeech==='function')stopSpeech();});
await page.evaluate(()=>{speakSeq(_phonLetterSay(PHON_LETTERS[1]));});
await page.waitForTimeout(2500);
const st=await page.evaluate(()=>({played:window.__played.length,banner:!!document.getElementById('hd-tts-banner'),man:typeof _voiceMan!=='undefined'&&!!_voiceMan}));
const result={opened,storyVoiceReqs:midVoice,totalVoiceReqs:voiceReqs,vendorReqs,played:st.played,banner:st.banner,manifestLoaded:st.man,errors};
console.log(JSON.stringify(result,null,2));
const ok=opened==='storybook'&&midVoice>=2&&voiceReqs>midVoice&&vendorReqs===0&&st.played>=3&&st.man&&!errors.length;
console.log(ok?'PROBE PASS':'PROBE FAIL');
await browser.close();
server.close();
process.exit(ok?0:1);
})();
