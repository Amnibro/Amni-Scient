const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','learn','learn-app.js'),'utf8');
function slice(a,b){const s=src.indexOf(a);if(s<0)throw new Error('missing '+a);const e=src.indexOf(b,s);if(e<0)throw new Error('missing '+b);return src.slice(s,e);}
const code=[
  slice('function _ttsClean(t)','\n  let _ttsVoiceCache'),
  slice('function _chunkSpans(text)','\n  let _kkBlobCache'),
  slice('function _ttsBatch(arr)','\n  async function _hdSay'),
  slice('const PHON_LETTERS=[','\n  const _phonSnd='),
  slice('const _phonSnd=','\n  let phonIdx'),
  slice('const STORYBOOKS = [','\n  const STORY_QUIZZES'),
  slice('const STORY_QUIZZES = {','\n  const _storyState')
].join('\n');
const env=new Function(code+'\nreturn {_ttsClean,_chunkSpans,_ttsBatch,PHON_LETTERS,PHON_WORDS,PHON_RHYMES,_phonLetterSay,_phonSoundAsk,_phonSoundYes,_phonBlendSay,_phonRhymeAsk,STORYBOOKS,STORY_QUIZZES};')();
const files=new Map(),manifest={},tasks=[];
function fileFor(text){
  if(files.has(text))return files.get(text);
  const f='v'+String(files.size+1).padStart(4,'0')+'.ogg';
  files.set(text,f);tasks.push({file:f,text});
  return f;
}
function add(items,sp){(Array.isArray(items)?items:[items]).forEach(t=>{env._ttsBatch([env._ttsClean(t)].filter(Boolean)).forEach(p=>{manifest[p+'|'+(sp||1)]=fileFor(p);});});}
env.PHON_LETTERS.forEach(c=>{add(env._phonLetterSay(c));add(env._phonSoundAsk(c));add(env._phonSoundYes(c));add('Not that one. '+env._phonSoundAsk(c));});
env.PHON_WORDS.forEach(w=>add(env._phonBlendSay(w)));
env.PHON_RHYMES.forEach(r=>add(env._phonRhymeAsk(r[0])));
env.STORYBOOKS.forEach(b=>b.pages.forEach(pg=>env._chunkSpans(pg).forEach(ch=>{manifest[ch.t+'|0.95']=fileFor(ch.t);})));
Object.values(env.STORY_QUIZZES).forEach(qs=>qs.forEach(q=>add([q.q,q.a,...q.wrong])));
fs.writeFileSync(path.join(__dirname,'tasks.json'),JSON.stringify(tasks));
const outDir=path.join(__dirname,'..','..','learn','assets','voice');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest));
console.log(JSON.stringify({uniqueFiles:tasks.length,manifestKeys:Object.keys(manifest).length,chars:tasks.reduce((a,t)=>a+t.text.length,0)}));
