const https=require('https');
const get=u=>new Promise((res,rej)=>https.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej));
(async()=>{
  const d=await get('https://raw.githubusercontent.com/Amnibro/Amni-Scient/main/learn/learn-app.js');
  console.log('raw token=arr',d.includes('const token=arr'));
  console.log('raw letterName',d.includes('_phonLetterName'));
  const a=d.indexOf('function speakSeq');
  console.log(JSON.stringify(d.slice(a,a+450)));
  const sw=await get('https://raw.githubusercontent.com/Amnibro/Amni-Scient/main/learn/sw.js');
  console.log('sw',sw.split('\n')[2]);
  const idx=await get('https://raw.githubusercontent.com/Amnibro/Amni-Scient/main/learn/index.html');
  console.log('script',(idx.match(/learn-app\.js\?v=[^"']+/)||[])[0]);
  // live again
  const live=await get('https://amni-scient.com/learn/learn-app.js?v=v1280&x='+Date.now());
  console.log('live token',live.includes('const token=arr'));
  console.log('live letterName',live.includes('_phonLetterName'));
})().catch(e=>{console.error(e);process.exit(1);});
