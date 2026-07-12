const PHON_SP={a:'aaa',b:'buh',c:'kuh',d:'duh',e:'ehh',f:'fff',g:'guh',h:'huh',i:'ihh',j:'juh',k:'kuh',l:'lll',m:'mmm',n:'nnn',o:'aww',p:'puh',q:'kwuh',r:'rrr',s:'sss',t:'tuh',u:'uhh',v:'vvv',w:'wuh',x:'ks',y:'yuh',z:'zzz',sh:'shhh',ch:'chuh',ck:'kuh',oo:'ooo',ee:'eee',ai:'ayy',oa:'ohh',ng:'nng',ke:'kuh'};
const _phonSnd=(x)=>{const k=String(x).toLowerCase();return PHON_SP[k]||k;};
function _phonLetterSay(c){const snd=_phonSnd(c.l);return ['This is the letter '+c.l+'.','Listen to the sound. '+snd+'.','The letter '+c.l+' says '+snd+'.',c.w+' starts with '+snd+'.','Say it with me. '+snd+'. '+c.w+'.'];}
function _phonSoundAsk(c){const snd=_phonSnd(c.l);return ['Listen to the sound.',snd+'.','Which letter says '+snd+'?'];}
function _phonSoundYes(c){const snd=_phonSnd(c.l);return ['Yes!','The letter '+c.l+' says '+snd+'.',c.w+' starts with '+snd+'.'];}
function _phonBlendSay(cur){const sounds=cur.c.map(_phonSnd);return ['Let us sound out '+cur.w+'.',...sounds.map(x=>x+'.'),sounds.join(' ')+'.',cur.w+'!'];}
let pass=0,fail=0;
function assert(n,c){if(c){pass++;console.log('PASS',n);}else{fail++;console.error('FAIL',n);}}
const b={l:'B',s:'buh',w:'Ball'};
const line=_phonLetterSay(b);
const joined=line.join(' ');
assert('multi-step array',Array.isArray(line)&&line.length>=4);
assert('names the letter',line[0].includes('letter B'));
assert('isolates sound',joined.includes('Listen to the sound')&&joined.includes('buh'));
assert('letter says sound',joined.includes('letter B says buh'));
assert('word connection',joined.includes('Ball starts with buh'));
assert('say with me',joined.includes('Say it with me'));
assert('no bah token',!joined.includes('bah'));
assert('ask array',Array.isArray(_phonSoundAsk(b))&&_phonSoundAsk(b)[1]==='buh.');
assert('yes array',_phonSoundYes(b).some(x=>x.includes('letter B says buh')));
const blend=_phonBlendSay({w:'cat',c:['c','a','t']});
assert('blend teach lead',blend[0]==='Let us sound out cat.');
assert('blend sounds',blend.includes('kuh.')&&blend.includes('aaa.')&&blend.includes('tuh.'));
assert('blend word',blend[blend.length-1]==='cat!');
console.log(JSON.stringify({pass,fail,line,blend}));
if(fail)process.exit(1);
