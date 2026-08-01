const fs=require('fs');
const path=require('path');
const files=[
  path.join(__dirname,'..','learn-app.js'),
  path.join(__dirname,'..','sw.js'),
  path.join(__dirname,'..','..','changelog.md'),
  path.join(__dirname,'..','..','architecture_map.md'),
];
const bad=[
  [/\uFFFD/g,'U+FFFD replacement'],
  [/Ã./g,'latin1-as-utf8 (Ã.)'],
  [/â€[™œ˜]/g,'smart-quote mojibake'],
  [/â€¦/g,'ellipsis mojibake'],
  [/ðŸ[\u0080-\u00BF]/g,'emoji UTF-8 read as latin1'],
  [/ï¸/g,'VS16 mojibake'],
  [/\?\?\? Loading/g,'emoji collapsed to ???'],
  [/Loading HD voice\?\?\?/g,'trailing ???'],
];
let issues=0;
for(const f of files){
  if(!fs.existsSync(f)){console.log('skip missing',f);continue;}
  const buf=fs.readFileSync(f);
  const s=buf.toString('utf8');
  console.log('\n==',path.basename(f),'bytes',buf.length,'utf8len',s.length);
  for(const [re,name] of bad){
    const m=s.match(re);
    if(m){issues+=m.length;console.log('  BAD',name,m.length,'eg',JSON.stringify(m[0]));}
  }
  // TTS banner strings must be real emoji not ???
  if(f.endsWith('learn-app.js')){
    const want=['Loading HD voice','HD voice ready','Loading experimental Kokoro','Kokoro ready','HD neural voice (Piper)'];
    for(const w of want){
      const i=s.indexOf(w);
      if(i<0){issues++;console.log('  MISSING phrase',w);continue;}
      const ctx=s.slice(Math.max(0,i-8),i+w.length+8);
      const hasMic=/[\u{1F399}\u{1F3A4}\u{1F50A}]/u.test(ctx)||ctx.includes('\uD83C\uDF99')||ctx.includes('🎙️')||ctx.includes('🎤')||ctx.includes('🔊');
      const hasQ=/\?{2,}/.test(ctx);
      console.log('  phrase',JSON.stringify(w),'ctx',JSON.stringify(ctx),'mic?',!!hasMic,'qmarks?',hasQ);
      if(hasQ){issues++;console.log('  BAD qmark collapse near',w);}
    }
    // verify mic emoji bytes around Loading HD voice
    const i=s.indexOf('Loading HD voice');
    if(i>0){
      const slice=buf.subarray(Math.max(0,i-12),i);
      console.log('  pre-Loading HD voice bytes',Buffer.from(slice).toString('hex'));
    }
  }
}
console.log('\nissues',issues);
process.exit(issues?1:0);
