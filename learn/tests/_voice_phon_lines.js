const fs=require('fs'),R=require('path').resolve(__dirname,'..')+'/',app=fs.readFileSync(R+'learn-app.js','utf8'),sl=(a,b)=>{const i=app.indexOf(a);return app.slice(i,app.indexOf(b,i))};
const P=Function(sl('const PHON_LETTERS=','function _phonLetterName')+'return {PHON_WORDS,PHON_RHYMES,_phonSnd};')();
global.window={};eval(fs.readFileSync(R+'learn-standards.js','utf8'));const S=window.AmniStd;
const out=new Set(['Choices','Try again!']),snd=new Set();P.PHON_WORDS.forEach(w=>w.c.forEach(c=>snd.add(P._phonSnd(c,w.c))));snd.forEach(s=>{out.add('This part says '+s+'.');out.add(s+'.')});
const G=P.PHON_RHYMES.map(g=>g.filter((x,i)=>i%2===0)),U=[...new Set(G.flat())];
G.forEach(g=>g.forEach(T=>{out.add('Which word rhymes with '+T+'?');U.forEach(x=>{out.add(x+'!');out.add(x);g.includes(x)?x!==T&&out.add(T+' and '+x+' rhyme!'):out.add(x+' does not rhyme with '+T+'.')})}));
[1,2].forEach(l=>(S.sightWords(S.grade(l))||[]).forEach(w=>out.add('Find the word: '+w+'.')));
fs.writeFileSync(process.argv[2]||'phon_extra.json',JSON.stringify([...out]));console.log(out.size);
