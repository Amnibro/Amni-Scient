const PHON_SP={a:'aaa',b:'buh',c:'kuh',d:'duh',e:'ehh',f:'fff',g:'guh',h:'huh',i:'ihh',j:'juh',k:'kuh',l:'lll',m:'mmm',n:'nnn',o:'aww',p:'puh',q:'kwuh',r:'rrr',s:'sss',t:'tuh',u:'uhh',v:'vvv',w:'wuh',x:'ks',y:'yuh',z:'zzz',sh:'shhh',ch:'chuh',ck:'kuh',oo:'ooo',ee:'eee',ai:'ayy',oa:'ohh',ng:'nng',ke:'kuh'};
const _phonSnd=(x)=>{const k=String(x).toLowerCase();return PHON_SP[k]||k;};
function _phonLetterSay(c){const snd=_phonSnd(c.l);return ['This is the letter '+c.l+'. It says '+snd+'. '+c.w+' starts with '+snd+'. Say it with me: '+snd+', '+c.w+'.'];}
function _phonSoundAsk(c){const snd=_phonSnd(c.l);return ['Listen. '+snd+'. Which letter says '+snd+'?'];}
function _phonSoundYes(c){const snd=_phonSnd(c.l);return ['Yes! '+c.l+' says '+snd+'. '+c.w+' starts with '+snd+'.'];}
function _phonBlendSay(cur){const sounds=cur.c.map(_phonSnd);return ['Let us sound out '+cur.w+'. '+sounds.join(', ')+'. '+cur.w+'!'];}
function _ttsBatch(arr){
  if(arr.length<=1)return arr.slice();
  const allShort=arr.every(t=>t.length<=90);
  if(!allShort)return arr.slice();
  const joined=arr.join(' ');
  return joined.length<=320?[joined]:arr.slice();
}
let pass=0,fail=0;
function assert(n,c){if(c){pass++;console.log('PASS',n);}else{fail++;console.error('FAIL',n);}}
const b={l:'B',s:'buh',w:'Ball'};
const line=_phonLetterSay(b);
const joined=line.join(' ');
assert('one dense letter script',line.length===1&&joined.includes('letter B')&&joined.includes('buh')&&joined.includes('Ball'));
assert('batch collapses teach',_ttsBatch(line).length===1);
assert('ask one line',_phonSoundAsk(b).length===1);
assert('blend one line',_phonBlendSay({w:'cat',c:['c','a','t']})[0].includes('kuh')&&_phonBlendSay({w:'cat',c:['c','a','t']})[0].includes('cat!'));
assert('no bah',!joined.includes('bah'));
console.log(JSON.stringify({pass,fail,line}));
if(fail)process.exit(1);
