const PHON_SP={a:'ah',b:'buh',c:'kuh',d:'duh',e:'eh',f:'fff',g:'guh',h:'huh',i:'ih',j:'juh',k:'kuh',l:'luh',m:'mmm',n:'nnn',o:'aw',p:'puh',q:'kwuh',r:'rrr',s:'sss',t:'tuh',u:'uh',v:'vvv',w:'wuh',x:'kss',y:'yuh',z:'zzz',sh:'shh',ch:'chuh',ck:'kuh',oo:'ooo',ee:'eee',ai:'ay',oa:'oh',ng:'ing',ke:'kuh'};
const _phonSnd=(x)=>{const k=String(x).toLowerCase();if(PHON_SP[k])return PHON_SP[k];if(/^[a-z]$/.test(k))return 'uh';return k;};
function _phonLetterSay(c){const snd=_phonSnd(c.l);return ['This is the letter '+c.l+'. Its sound is '+snd+'. '+c.w+' starts with '+snd+'. Say '+snd+'. '+c.w+'.'];}
let pass=0,fail=0;
function assert(n,c){if(c){pass++;console.log('PASS',n);}else{fail++;console.error('FAIL',n);}}
const line=_phonLetterSay({l:'A',w:'Apple'})[0];
assert('uses ah not aaa',line.includes('ah')&&!line.includes('aaa'));
assert('not letter-name thrice',!/A["']?\s*A["']?\s*A/.test(line));
assert('sound phrase',line.includes('sound is ah'));
assert('B is buh',_phonLetterSay({l:'B',w:'Ball'})[0].includes('buh'));
assert('no bare letter fallback for a',_phonSnd('a')==='ah'&&_phonSnd('A')==='ah');
console.log(JSON.stringify({pass,fail,line}));
if(fail)process.exit(1);
