const fs=require('fs');
const path=require('path');
const p=path.join(__dirname,'..','learn-app.js');
let s=fs.readFileSync(p,'utf8');
const nl=s.includes('\r\n')?'\r\n':'\n';
// Replace PHON_LETTERS sound fields (s:'...') for display+speech agreement
{
  const a=s.indexOf('const PHON_LETTERS=[');
  const b=s.indexOf('const PHON_WORDS=[',a);
  if(a<0||b<0){console.error('letters bounds');process.exit(1);}
  const neu=`const PHON_LETTERS=[
    {l:'A',s:'ah',w:'Apple',e:'🍎'},{l:'B',s:'buh',w:'Ball',e:'⚽'},{l:'C',s:'kuh',w:'Cat',e:'🐱'},
    {l:'D',s:'duh',w:'Dog',e:'🐶'},{l:'E',s:'eh',w:'Egg',e:'🥚'},{l:'F',s:'fff',w:'Fish',e:'🐟'},
    {l:'G',s:'guh',w:'Goat',e:'🐐'},{l:'H',s:'huh',w:'Hat',e:'🎩'},{l:'I',s:'ih',w:'Igloo',e:'🧊'},
    {l:'J',s:'juh',w:'Jam',e:'🍯'},{l:'K',s:'kuh',w:'Kite',e:'🪁'},{l:'L',s:'luh',w:'Lion',e:'🦁'},
    {l:'M',s:'mmm',w:'Moon',e:'🌙'},{l:'N',s:'nnn',w:'Nest',e:'🪺'},{l:'O',s:'aw',w:'Octopus',e:'🐙'},
    {l:'P',s:'puh',w:'Pig',e:'🐷'},{l:'Q',s:'kwuh',w:'Queen',e:'👑'},{l:'R',s:'rrr',w:'Rain',e:'🌧️'},
    {l:'S',s:'sss',w:'Sun',e:'☀️'},{l:'T',s:'tuh',w:'Tree',e:'🌳'},{l:'U',s:'uh',w:'Umbrella',e:'☂️'},
    {l:'V',s:'vvv',w:'Van',e:'🚐'},{l:'W',s:'wuh',w:'Watermelon',e:'🍉'},{l:'X',s:'ks',w:'Fox',e:'🦊'},
    {l:'Y',s:'yuh',w:'Yarn',e:'🧶'},{l:'Z',s:'zzz',w:'Zebra',e:'🦓'}
  ];
  `;
  s=s.slice(0,a)+neu.replace(/\n/g,nl)+s.slice(b);
  console.log('ok PHON_LETTERS');
}
{
  const a=s.indexOf('const PHON_SP=');
  const b=s.indexOf('const _phonSnd=',a);
  if(a<0||b<0){console.error('sp bounds');process.exit(1);}
  // Speak map: never use single letters or aaa/eee (TTS letter-names them)
  const neu=`const PHON_SP={a:'ah',b:'buh',c:'kuh',d:'duh',e:'eh',f:'fff',g:'guh',h:'huh',i:'ih',j:'juh',k:'kuh',l:'luh',m:'mmm',n:'nnn',o:'aw',p:'puh',q:'kwuh',r:'rrr',s:'sss',t:'tuh',u:'uh',v:'vvv',w:'wuh',x:'kss',y:'yuh',z:'zzz',sh:'shh',ch:'chuh',ck:'kuh',oo:'ooo',ee:'eee',ai:'ay',oa:'oh',ng:'ing',ke:'kuh'};
  `;
  s=s.slice(0,a)+neu.replace(/\n/g,nl)+s.slice(b);
  console.log('ok PHON_SP');
}
// Force _phonSnd to never fall back to bare letter names for a-z
{
  const old=`const _phonSnd=(x)=>{const k=String(x).toLowerCase();return PHON_SP[k]||k;};`;
  const neu=`const _phonSnd=(x)=>{const k=String(x).toLowerCase();if(PHON_SP[k])return PHON_SP[k];if(/^[a-z]$/.test(k))return PHON_SP[k]||'uh';return k;};`;
  if(!s.includes(old)){console.error('phonSnd miss');process.exit(1);}
  s=s.replace(old,neu);
  console.log('ok _phonSnd');
}
// Scripts: "sound is ah" not "it says aaa" / not letter-name repeat
{
  const a=s.indexOf('function _phonLetterSay(c){');
  const b=s.indexOf('function _phonRhymeAsk',a);
  if(a<0||b<0){console.error('script bounds',a,b);process.exit(1);}
  // keep through blend, replace up to rhyme
  const end=s.indexOf('function _phonRhymeAsk(w){',a);
  const neu=`function _phonLetterSay(c){const snd=_phonSnd(c.l);return ['This is the letter '+c.l+'. Its sound is '+snd+'. '+c.w+' starts with '+snd+'. Say '+snd+'. '+c.w+'.'];}
  function _phonSoundAsk(c){const snd=_phonSnd(c.l);return ['Listen for the sound '+snd+'. Which letter makes '+snd+'?'];}
  function _phonSoundYes(c){const snd=_phonSnd(c.l);return ['Yes! Letter '+c.l+' makes the sound '+snd+'. '+c.w+' starts with '+snd+'.'];}
  function _phonBlendSay(cur){const sounds=cur.c.map(_phonSnd);return ['Let us sound out '+cur.w+'. '+sounds.join(', then ')+', makes '+cur.w+'.'];}
  `;
  s=s.slice(0,a)+neu.replace(/\n/g,nl)+s.slice(end);
  console.log('ok scripts');
}
// _kkPrep was lowercasing and might mess phonemes - ensure short sound cues get pauses
// Add _phonSpeakCue helper via _phonSnd already
// cache bust
let idx=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
idx=idx.replace(/learn-app\.js\?v=[^"']+/,'learn-app.js?v=v1282');
fs.writeFileSync(path.join(__dirname,'..','index.html'),idx);
let sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
sw=sw.replace(/const CACHE = 'amni-learn-v\d+';/,"const CACHE = 'amni-learn-v1282';");
fs.writeFileSync(path.join(__dirname,'..','sw.js'),sw);
fs.writeFileSync(p,s);
// verify A sound
const hasAh=s.includes("a:'ah'")&&s.includes("s:'ah',w:'Apple'");
const noAaa=!/s:'aaa'/.test(s)&&!/a:'aaa'/.test(s);
const script=s.includes('Its sound is ');
console.log({hasAh,noAaa,script,idx:(idx.match(/learn-app\.js\?v=[^"']+/)||[])[0]});
if(!hasAh||!noAaa||!script)process.exit(1);
