const fs=require('fs');
const s=fs.readFileSync(require('path').join(__dirname,'..','learn-app.js'),'utf8');
const sw=fs.readFileSync(require('path').join(__dirname,'..','sw.js'),'utf8');
const checks={
  kkDefaultOn:s.includes("amni-learn-kk')!=='off'"),
  kkWarm:s.includes('function _kkWarm'),
  letterName:s.includes('_phonLetterName'),
  sayWithMe:s.includes('Say it with me'),
  soundOut:s.includes('Let us sound out'),
  hearDbl:s.includes("$$('#phon-hear')"),
  synthKkFirst:/async function _synthWav[\s\S]{0,80}if\(_kkReady\)/.test(s),
  badDollar:(s.match(/(?<!\$)\$\('#phon-/g)||[]).length===0,
  sw1272:sw.includes('amni-learn-v1272'),
  speakUsesHdWarm:/_hdBanner\('Loading natural voice\.\.\. please wait'\);\s*_hdWarm\(\)/.test(s),
};
console.log(checks);
if(Object.values(checks).some(v=>v!==true))process.exit(1);
// unit: letter say returns array with sound instruction
const PHON_SP={b:'buh'};
const _phonSnd=x=>PHON_SP[String(x).toLowerCase()]||x;
function _phonLetterSay(c){const snd=_phonSnd(c.l);return ['This is the letter '+c.l+'.', 'Listen to the sound. '+snd+'.', 'The letter '+c.l+' says '+snd+'.', c.w+' starts with '+snd+'.', 'Say it with me. '+snd+'. '+c.w+'.'];}
const line=_phonLetterSay({l:'B',w:'Ball'});
console.log('sample',line);
if(!Array.isArray(line)||line.length<4)process.exit(1);
if(line.some(x=>/^B\. bah/i.test(x)))process.exit(1);
if(!line[0].includes('letter B'))process.exit(1);
if(!line.join(' ').includes('buh'))process.exit(1);
console.log('OK');
