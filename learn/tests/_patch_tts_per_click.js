const fs=require('fs');
const path=require('path');
const p=path.join(__dirname,'..','learn-app.js');
let s=fs.readFileSync(p,'utf8');
const nl=s.includes('\r\n')?'\r\n':'\n';
function rep(old,neu,label){
  if(s.includes(old)){s=s.replace(old,neu);console.log('ok',label);return;}
  const re=new RegExp(old.split('\n').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\r?\\n'));
  if(!re.test(s)){console.error('MISS',label);console.error(JSON.stringify(old.slice(0,100)));process.exit(1);}
  s=s.replace(re,neu.split('\n').join(nl));console.log('ok flex',label);
}
// 1) Per-utt gate was killing Kokoro on short phonics ("buh") every click
rep(
`async function _kkWav(text,speed){const t=await _kkLoad();const a=await t.generate(_kkPrep(text),{voice:_KKVOICE,speed:speed||1});if(!_kkAudioOk(a)){_kkFailed=true;_kkReady=false;try{t.model&&t.model.dispose&&t.model.dispose();}catch(e){}throw new Error('kk-garbage-utt');}return a.toBlob();}`,
`let _kkBlobCache=new Map();
  async function _kkWav(text,speed){
    const key=_kkPrep(text)+'|'+(speed||1);
    if(_kkBlobCache.has(key))return _kkBlobCache.get(key);
    const t=await _kkLoad();
    const a=await t.generate(_kkPrep(text),{voice:_KKVOICE,speed:speed||1});
    if(!a||!a.audio||!a.audio.length)throw new Error('kk-empty');
    const blob=a.toBlob();
    if(_kkBlobCache.size>80)_kkBlobCache.clear();
    _kkBlobCache.set(key,blob);
    return blob;
  }`,
'kkWav cache no kill-gate');
// 2) Batch many short teach lines into one synth (huge win per click)
rep(
`async function _hdSay(items){_hdStop();const gen=_hdGen;if(!_kkReady&&!_hdReady){if(_kkCan()){try{await _kkLoad();}catch(e){try{await _hdLoad();}catch(_){}}}else{try{await _hdLoad();}catch(_){}}}if(gen!==_hdGen)return;const arr=(Array.isArray(items)?items:[items]).map(_ttsClean).filter(Boolean);const parts=arr.flatMap(t=>_chunkSpans(t).map(c=>c.t));const pre=t=>{const p=_synthWav(t);p.catch(()=>{});return p;};let next=parts.length?pre(parts[0]):null;for(let i=0;i<parts.length;i++){if(gen!==_hdGen)return;let wav;try{wav=await next;}catch(e){if(gen!==_hdGen)return;_webSeq([parts[i]]);continue;}next=i+1<parts.length?pre(parts[i+1]):null;if(gen!==_hdGen)return;await _hdPlayBlob(wav);}}`,
`function _ttsBatch(arr){
    if(arr.length<=1)return arr.slice();
    const allShort=arr.every(t=>t.length<=90);
    if(!allShort)return arr.flatMap(t=>_chunkSpans(t).map(c=>c.t));
    const joined=arr.join(' ');
    return joined.length<=320?[joined]:arr.flatMap(t=>_chunkSpans(t).map(c=>c.t));
  }
  async function _hdSay(items){
    _hdStop();const gen=_hdGen;
    if(!_kkReady&&!_hdReady){if(_kkCan()){try{await _kkLoad();}catch(e){try{await _hdLoad();}catch(_){}}}else{try{await _hdLoad();}catch(_){}}}
    if(gen!==_hdGen)return;
    const arr=(Array.isArray(items)?items:[items]).map(_ttsClean).filter(Boolean);
    const parts=_ttsBatch(arr);
    const pre=t=>{const p=_synthWav(t);p.catch(()=>{});return p;};
    let next=parts.length?pre(parts[0]):null;
    for(let i=0;i<parts.length;i++){
      if(gen!==_hdGen)return;
      let wav;try{wav=await next;}catch(e){if(gen!==_hdGen)return;_webSeq([parts[i]]);continue;}
      next=i+1<parts.length?pre(parts[i+1]):null;
      if(gen!==_hdGen)return;
      await _hdPlayBlob(wav);
    }
  }`,
'hdSay batch short lines');
// 3) Teach scripts: fewer, denser lines so batching works well
rep(
`function _phonLetterSay(c){const snd=_phonSnd(c.l);return [_phonLetterName(c), 'Listen to the sound. '+snd+'.', _phonLetterSound(c), c.w+' starts with '+snd+'.', 'Say it with me. '+snd+'. '+c.w+'.'];}
  function _phonSoundAsk(c){const snd=_phonSnd(c.l);return ['Listen to the sound.', snd+'.', 'Which letter says '+snd+'?'];}
  function _phonSoundYes(c){const snd=_phonSnd(c.l);return ['Yes!', 'The letter '+c.l+' says '+snd+'.', c.w+' starts with '+snd+'.'];}
  function _phonBlendSay(cur){const sounds=cur.c.map(_phonSnd);return ['Let us sound out '+cur.w+'.', ...sounds.map(x=>x+'.'), sounds.join(' ')+'.', cur.w+'!'];}
  function _phonRhymeAsk(w){return ['Listen.', w+'.', 'Which word rhymes with '+w+'?'];}`,
`function _phonLetterSay(c){const snd=_phonSnd(c.l);return ['This is the letter '+c.l+'. It says '+snd+'. '+c.w+' starts with '+snd+'. Say it with me: '+snd+', '+c.w+'.'];}
  function _phonSoundAsk(c){const snd=_phonSnd(c.l);return ['Listen. '+snd+'. Which letter says '+snd+'?'];}
  function _phonSoundYes(c){const snd=_phonSnd(c.l);return ['Yes! '+c.l+' says '+snd+'. '+c.w+' starts with '+snd+'.'];}
  function _phonBlendSay(cur){const sounds=cur.c.map(_phonSnd);return ['Let us sound out '+cur.w+'. '+sounds.join(', ')+'. '+cur.w+'!'];}
  function _phonRhymeAsk(w){return ['Which word rhymes with '+w+'?'];}`,
'phon denser scripts');
// remove unused helpers if they remain (optional - leave _phonLetterName if still referenced)
// 4) shorten device-voice fallback wait when model already ready path is fine
// bump cache
let idx=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
idx=idx.replace(/learn-app\.js\?v=[^"']+/,'learn-app.js?v=v1281');
fs.writeFileSync(path.join(__dirname,'..','index.html'),idx);
let sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
sw=sw.replace(/const CACHE = 'amni-learn-v\d+';/,"const CACHE = 'amni-learn-v1281';");
fs.writeFileSync(path.join(__dirname,'..','sw.js'),sw);
fs.writeFileSync(p,s);
console.log('written',{
  cache:s.includes('_kkBlobCache'),
  batch:s.includes('_ttsBatch'),
  denser:s.includes('Say it with me:'),
  noKill: !s.includes('kk-garbage-utt'),
  idx:(idx.match(/learn-app\.js\?v=[^"']+/)||[])[0],
  sw:(sw.match(/amni-learn-v\d+/)||[])[0]
});
