const PHON_SP={a:'aaa',b:'buh',c:'kuh',d:'duh',e:'ehh',f:'fff',g:'guh',h:'huh',i:'ihh',j:'juh',k:'kuh',l:'lll',m:'mmm',n:'nnn',o:'aww',p:'puh',q:'kwuh',r:'rrr',s:'sss',t:'tuh',u:'uhh',v:'vvv',w:'wuh',x:'ks',y:'yuh',z:'zzz',sh:'shhh',ch:'chuh',ck:'kuh',oo:'ooo',ee:'eee',ai:'ayy',oa:'ohh',ng:'nng',ke:'kuh'};
const _phonSnd=(x)=>{const k=String(x).toLowerCase();return PHON_SP[k]||k;};
function _phonLetterSay(c){const snd=_phonSnd(c.l);return c.w+'. '+c.w+' starts with '+snd+'. The letter '+c.l+' says '+snd+'.';}
function _phonSoundAsk(c){const snd=_phonSnd(c.l);return 'Listen. '+snd+'. Which letter says '+snd+'?';}
function _phonSoundYes(c){const snd=_phonSnd(c.l);return 'Yes! '+c.l+' says '+snd+'. '+c.w+' starts with '+snd+'.';}
function _phonBlendSay(cur){return [...cur.c.map(_phonSnd), 'That makes '+cur.w+'!'];}
let pass=0,fail=0;
function assert(n,c){if(c){pass++;console.log('PASS',n);}else{fail++;console.error('FAIL',n);}}
const b={l:'B',s:'buh',w:'Ball'};
const line=_phonLetterSay(b);
assert('no letter-name-first bah pattern',!/^B\. bah/i.test(line)&&!line.includes('bah'));
assert('word first',line.startsWith('Ball.'));
assert('starts with sound',line.includes('starts with buh'));
assert('letter says sound',line.includes('letter B says buh'));
assert('ask listen',_phonSoundAsk(b).startsWith('Listen. buh'));
assert('yes connects word',_phonSoundYes(b).includes('Ball starts with buh'));
const blend=_phonBlendSay({w:'cat',c:['c','a','t']});
assert('blend sounds',blend[0]==='kuh'&&blend[1]==='aaa'&&blend[2]==='tuh');
assert('blend close',blend[3]==='That makes cat!');
assert('no stock B bah like',!line.includes('B. bah')&&!line.includes('like Ball'));
console.log(JSON.stringify({pass,fail,line,blend}));
if(fail)process.exit(1);
