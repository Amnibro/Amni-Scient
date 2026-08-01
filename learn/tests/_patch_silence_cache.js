const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const app=path.join(root,'learn-app.js');
let s=fs.readFileSync(app,'utf8');
const nl=s.includes('\r\n')?'\r\n':'\n';
const a=s.indexOf('function speakSeq(items){');
const b=s.indexOf('function stopSpeech()',a);
if(a<0||b<0){console.error('speakSeq bounds',a,b);process.exit(1);}
const neu=`function speakSeq(items){
    const arr=(Array.isArray(items)?items:[items]).filter(t=>t!=null&&String(t).trim());
    if(!arr.length)return;
    const wantHd=hdOn()||_hdCtx();
    if(!wantHd)return _webSeq(arr);
    if(_hdReady||_kkReady)return void _hdSay(arr).catch(()=>_webSeq(arr));
    _speakWait=arr;_storyWait=null;
    try{if('speechSynthesis' in window)window.speechSynthesis.cancel();}catch(e){}
    _hdBanner('Loading natural voice... please wait');
    _hdWarm();
    const token=arr;
    setTimeout(()=>{
      if(_speakWait!==token)return;
      if(_kkReady||_hdReady)return;
      _speakWait=null;
      _hdBanner('Still loading natural voice — using device voice for now');
      setTimeout(()=>{if(!(_kkReady||_hdReady))_hdBanner(null);},2200);
      _webSeq(token);
    },8000);
  }
  `;
s=s.slice(0,a)+neu.replace(/\n/g,nl)+s.slice(b);
// story wait timeout too - find story wait block and ensure it doesn't hang forever silently
// if story uses _storyWait, add timeout in _hdWarm catch already exists
fs.writeFileSync(app,s);
console.log('speakSeq timeout ok');
let idx=fs.readFileSync(path.join(root,'index.html'),'utf8');
const before=(idx.match(/learn-app\.js\?v=[^"']+/)||[])[0];
idx=idx.replace(/learn-app\.js\?v=[^"']+/,'learn-app.js?v=v1280');
fs.writeFileSync(path.join(root,'index.html'),idx);
console.log('index',before,'->',(idx.match(/learn-app\.js\?v=[^"']+/)||[])[0]);
let sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
sw=sw.replace(/const CACHE = 'amni-learn-v\d+';/,"const CACHE = 'amni-learn-v1280';");
fs.writeFileSync(path.join(root,'sw.js'),sw);
console.log('sw',(sw.match(/amni-learn-v\d+/)||[])[0]);
// quick sanity
const s2=fs.readFileSync(app,'utf8');
console.log({
  timeout:s2.includes('Still loading natural voice'),
  letterName:s2.includes('_phonLetterName'),
  hear:s2.includes("$$('#phon-hear')"),
});
