const fs=require('fs');
const path=require('path');
const p=path.join(__dirname,'..','learn-app.js');
let s=fs.readFileSync(p,'utf8');
const nl=s.includes('\r\n')?'\r\n':'\n';
function flexFind(old){
  const parts=old.split('\n');
  let idx=0,pos=0;
  // try exact first
  if(s.includes(old))return {i:s.indexOf(old),len:old.length,text:old};
  const re=new RegExp(parts.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\r?\\n'));
  const m=re.exec(s);
  if(!m)return null;
  return {i:m.index,len:m[0].length,text:m[0]};
}
function rep(old,neu,label){
  const f=flexFind(old);
  if(!f){console.error('MISSING',label);console.error(JSON.stringify(old.slice(0,100)));process.exit(1);}
  s=s.slice(0,f.i)+neu.split('\n').join(nl)+s.slice(f.i+f.len);
  console.log('ok',label);
}
// Fix bare $('#phon- -> $$('#phon-
{
  const before=(s.match(/(?<!\$)\$\('#phon-/g)||[]).length;
  s=s.replace(/(?<!\$)\$\('#phon-/g,"$$('#phon-");
  console.log('fixed $ phon',before,'->',(s.match(/(?<!\$)\$\('#phon-/g)||[]).length);
}
// Replace phon helper block by markers
{
  const a=s.indexOf('function _phonLetterSay(c){');
  const b=s.indexOf('let phonIdx=0',a);
  if(a<0||b<0){console.error('helper bounds',a,b);process.exit(1);}
  const neu=`function _phonLetterName(c){return 'This is the letter '+c.l+'.';}${nl}  function _phonLetterSound(c){const snd=_phonSnd(c.l);return 'The letter '+c.l+' says '+snd+'.';}${nl}  function _phonLetterSay(c){const snd=_phonSnd(c.l);return [_phonLetterName(c), 'Listen to the sound. '+snd+'.', _phonLetterSound(c), c.w+' starts with '+snd+'.', 'Say it with me. '+snd+'. '+c.w+'.'];}${nl}  function _phonSoundAsk(c){const snd=_phonSnd(c.l);return ['Listen to the sound.', snd+'.', 'Which letter says '+snd+'?'];}${nl}  function _phonSoundYes(c){const snd=_phonSnd(c.l);return ['Yes!', 'The letter '+c.l+' says '+snd+'.', c.w+' starts with '+snd+'.'];}${nl}  function _phonBlendSay(cur){const sounds=cur.c.map(_phonSnd);return ['Let us sound out '+cur.w+'.', ...sounds.map(x=>x+'.'), sounds.join(' ')+'.', cur.w+'!'];}${nl}  function _phonRhymeAsk(w){return ['Listen.', w+'.', 'Which word rhymes with '+w+'?'];}${nl}  `;
  s=s.slice(0,a)+neu+s.slice(b);
  console.log('ok phon helpers');
}
rep(
`function _phonSpeak(text){if(typeof speakSeq==='function')speakSeq([text]);else if(typeof speakText==='function')speakText(text);}`,
`function _phonSpeak(text){const items=Array.isArray(text)?text:[text];if(typeof speakSeq==='function')speakSeq(items);else if(typeof speakText==='function')speakText(items.join(' '));}`,
'phonSpeak arr');
// labels / buttons via unique strings
if(s.includes('Sound: &quot;${cur.s}&quot; · ${cur.w} starts with it')){
  s=s.replace('Sound: &quot;${cur.s}&quot; · ${cur.w} starts with it','Letter ${cur.l} says &quot;${cur.s}&quot; · like ${cur.w}');
  console.log('ok letter label');
}else if(s.includes('Sound: &quot;${cur.s}&quot;')){
  // try unicode middot variants
  s=s.replace(/Sound: &quot;\$\{cur\.s\}&quot;[^<]*/,'Letter ${cur.l} says &quot;${cur.s}&quot; · like ${cur.w}');
  console.log('ok letter label loose');
}else console.log('letter label skip');
s=s.replace(/>🔊 Hear It</g,'>Hear letter sound<');
s=s.replace(/>🔊 Blend It</g,'>Blend the word<');
s=s.replace(/>🔊 Hear It Again</g,'>Hear it again<');
// word card: insert word display if missing
{
  const needle='<div class="phon-word-emoji">${cur.e}</div><div class="phon-blend-row">';
  if(s.includes(needle)){
    s=s.replace(needle,'<div class="phon-word-emoji">${cur.e}</div><div class="pd-letter" style="font-size:2rem;margin:6px 0">${cur.w}</div><div class="pd-sound" style="margin-bottom:8px">Tap each sound, then Blend</div><div class="phon-blend-row">');
    console.log('ok word card teach ui');
  }
}
// chunk click: teach the sound
rep(
`pane.querySelectorAll('.phon-chunk').forEach(btn=>btn.addEventListener('click',()=>{const snd=_phonSnd(btn.dataset.c);_phonSpeak(snd+'. '+snd+'.');}));`,
`pane.querySelectorAll('.phon-chunk').forEach(btn=>btn.addEventListener('click',()=>{const ch=btn.dataset.c;const snd=_phonSnd(ch);_phonSpeak(['This part says '+snd+'.', snd+'.']);}));`,
'chunk teach');
// rhyme
{
  const a=s.indexOf("if(typeof speakSeq==='function')speakSeq([target[0]+'. Which one rhymes with '+target[0]+'?']);");
  if(a>=0){
    const old=`if(typeof speakSeq==='function')speakSeq([target[0]+'. Which one rhymes with '+target[0]+'?']);
    $$('#phon-rhyme-replay').onclick=()=>{if(typeof speakSeq==='function')speakSeq([target[0]+'. '+tiles.map(t=>t[0]).join('. ')]);};`;
    const f=flexFind(old);
    if(f){
      s=s.slice(0,f.i)+`_phonSpeak(_phonRhymeAsk(target[0]));${nl}    $$('#phon-rhyme-replay').onclick=()=>_phonSpeak([..._phonRhymeAsk(target[0]), 'Choices: '+tiles.map(t=>t[0]).join(', ')+'.']);`.split('\n').join(nl)+s.slice(f.i+f.len);
      console.log('ok rhyme script');
    }else console.log('rhyme script miss flex');
  }
}
s=s.replace(`_phonSpeak(btn.dataset.w+'! '+target[0]+' and '+btn.dataset.w+' rhyme!');`,`_phonSpeak([btn.dataset.w+'!', target[0]+' and '+btn.dataset.w+' rhyme!']);`);
s=s.replace(`_phonSpeak(btn.dataset.w+' does not rhyme with '+target[0]+'. Try again!');`,`_phonSpeak([btn.dataset.w+' does not rhyme with '+target[0]+'.', 'Try again!']);`);
s=s.replace(
`if(currentLevel===1&&typeof ttsAuto==='function'&&ttsAuto())_phonSpeak(_phonLetterSay(PHON_LETTERS[0]));`,
`if(currentLevel<=2&&typeof ttsAuto==='function'&&ttsAuto())_phonSpeak(_phonLetterSay(PHON_LETTERS[0]));`
);
// Kokoro primary
rep(
`function _kkCan(){try{return !_kkFailed&&localStorage.getItem('amni-learn-kk')==='on';}catch(e){return false;}}`,
`function _kkCan(){try{return !_kkFailed&&localStorage.getItem('amni-learn-kk')!=='off';}catch(e){return !_kkFailed;}}`,
'kkCan');
rep(
`async function _synthWav(text,speed){if(_hdReady){try{const m=await _hdLoad();return await m.predict({text:text,voiceId:_HDVOICE});}catch(e){}}if(_kkReady||_kkCan()){try{return await _kkWav(text,speed);}catch(e){}}throw new Error('no-synth');}`,
`async function _synthWav(text,speed){if(_kkReady){try{return await _kkWav(text,speed);}catch(e){}}if(_hdReady){try{const m=await _hdLoad();return await m.predict({text:text,voiceId:_HDVOICE});}catch(e){}}if(_kkCan()&&!_kkFailed){try{return await _kkWav(text,speed);}catch(e){}}try{const m=await _hdLoad();return await m.predict({text:text,voiceId:_HDVOICE});}catch(e){}throw new Error('no-synth');}`,
'synth');
// warm block markers
{
  const a=s.indexOf('function _piperWarm(){');
  const b=s.indexOf('function _hdBanner(msg){',a);
  if(a<0||b<0){console.error('warm bounds',a,b);process.exit(1);}
  const neu=`function _piperWarm(){if(_hdReady){_flushHdQueue();return;}_hdBanner('Loading backup voice... please wait');_hdLoad(p=>_hdBanner('Loading backup voice... '+(p||0)+'%')).then(()=>{_hdBanner('Backup voice ready');setTimeout(()=>{if(!_speakWait&&_storyWait==null)_hdBanner(null);},1400);_flushHdQueue();}).catch(()=>{const q=_speakWait;const st=_storyWait;_speakWait=null;_storyWait=null;_hdBanner('Using device voice for now');setTimeout(()=>_hdBanner(null),1800);if(st!=null&&typeof playCurrentPage==='function'){_storyState.webFallback=true;playCurrentPage(true);}else if(q)_webSeq(q);});}${nl}  function _kkWarm(){if(_kkReady){_flushHdQueue();return;}if(_kkFailed||!_kkCan())return _piperWarm();if(_hdWarming)return;_hdWarming=true;_hdBanner('Loading natural voice... please wait');_kkLoad(p=>_hdBanner('Loading natural voice... '+(p||0)+'%')).then(()=>{_hdWarming=false;_hdBanner('Natural voice ready!');setTimeout(()=>{if(!_speakWait&&_storyWait==null)_hdBanner(null);},1400);_flushHdQueue();}).catch(()=>{_hdWarming=false;_hdBanner('Natural voice unavailable — trying backup...');_piperWarm();});}${nl}  function _hdWarm(){if(_kkReady||_hdReady)return;if(_kkCan())_kkWarm();else _piperWarm();}${nl}  `;
  s=s.slice(0,a)+neu+s.slice(b);
  console.log('ok warm kk primary');
}
rep(
`async function _hdSay(items){_hdStop();const gen=_hdGen;if(!_hdReady&&!_kkReady){try{await _hdLoad();}catch(e){if(_kkCan())try{await _kkLoad();}catch(_){}}}if(gen!==_hdGen)return;const arr=(Array.isArray(items)?items:[items]).map(_ttsClean).filter(Boolean);const parts=arr.flatMap(t=>_chunkSpans(t).map(c=>c.t));const pre=t=>{const p=_synthWav(t);p.catch(()=>{});return p;};let next=parts.length?pre(parts[0]):null;for(let i=0;i<parts.length;i++){if(gen!==_hdGen)return;let wav;try{wav=await next;}catch(e){if(gen!==_hdGen)return;_webSeq([parts[i]]);continue;}next=i+1<parts.length?pre(parts[i+1]):null;if(gen!==_hdGen)return;await _hdPlayBlob(wav);}}`,
`async function _hdSay(items){_hdStop();const gen=_hdGen;if(!_kkReady&&!_hdReady){if(_kkCan()){try{await _kkLoad();}catch(e){try{await _hdLoad();}catch(_){}}}else{try{await _hdLoad();}catch(_){}}}if(gen!==_hdGen)return;const arr=(Array.isArray(items)?items:[items]).map(_ttsClean).filter(Boolean);const parts=arr.flatMap(t=>_chunkSpans(t).map(c=>c.t));const pre=t=>{const p=_synthWav(t);p.catch(()=>{});return p;};let next=parts.length?pre(parts[0]):null;for(let i=0;i<parts.length;i++){if(gen!==_hdGen)return;let wav;try{wav=await next;}catch(e){if(gen!==_hdGen)return;_webSeq([parts[i]]);continue;}next=i+1<parts.length?pre(parts[i+1]):null;if(gen!==_hdGen)return;await _hdPlayBlob(wav);}}`,
'hdSay');
// speakSeq and story use _hdWarm
s=s.replace(`_hdBanner('Loading natural voice... please wait');\r\n    _piperWarm();`,`_hdBanner('Loading natural voice... please wait');\r\n    _hdWarm();`);
s=s.replace(`_hdBanner('Loading natural voice... please wait');\n    _piperWarm();`,`_hdBanner('Loading natural voice... please wait');\n    _hdWarm();`);
s=s.replace(`_hdBanner('Loading natural voice... please wait');\r\n      _piperWarm();`,`_hdBanner('Loading natural voice... please wait');\r\n      _hdWarm();`);
s=s.replace(`_hdBanner('Loading natural voice... please wait');\n      _piperWarm();`,`_hdBanner('Loading natural voice... please wait');\n      _hdWarm();`);
console.log('speak/story warm replacements done');
if(s.includes('HD neural voice (Piper)')){
  s=s.replace('HD neural voice (Piper)','HD natural voice (Kokoro + Piper backup)');
  s=s.replace('one-time ~63MB, natural offline speech','Kokoro first; Piper backup if needed');
  console.log('ok profile');
}
const swPath=path.join(__dirname,'..','sw.js');
let sw=fs.readFileSync(swPath,'utf8');
sw=sw.replace('amni-learn-v1271','amni-learn-v1272').replace(/amni-learn-v1272/g,'amni-learn-v1272');
if(!sw.includes('v1272')){
  sw=sw.replace(/const CACHE = 'amni-learn-v\d+';/,"const CACHE = 'amni-learn-v1272';");
}
fs.writeFileSync(swPath,sw);
fs.writeFileSync(p,s);
console.log('written');
console.log('kkCan',s.includes("amni-learn-kk')!=='off'"));
console.log('kkWarm',s.includes('function _kkWarm'));
console.log('letter name',s.includes('_phonLetterName'));
console.log('bad $', (s.match(/(?<!\$)\$\('#phon-/g)||[]).length);
console.log('piperWarm count in speakSeq path', (s.match(/_piperWarm\(\)/g)||[]).length);
