const https=require('https');
const get=u=>new Promise((res,rej)=>https.get(u,{headers:{'Cache-Control':'no-cache'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res({status:r.statusCode,body:d,headers:r.headers}));}).on('error',rej));
(async()=>{
  const ts=Date.now();
  const idx=await get('https://amni-scient.com/learn/?cb='+ts);
  const m=idx.body.match(/learn-app\.js\?v=([^"']+)/);
  console.log('index status',idx.status,'script',m&&m[1]);
  const sw=await get('https://amni-scient.com/learn/sw.js?cb='+ts);
  const line=(sw.body.split(/\n/)[2]||'').trim();
  console.log('sw',line);
  const app=await get('https://amni-scient.com/learn/learn-app.js?v=v1280');
  console.log({
    status:app.status,
    letterName:app.body.includes('_phonLetterName'),
    say:app.body.includes('Say it with me'),
    timeout:app.body.includes('Still loading natural voice'),
    letterUi:app.body.includes('Letter ${cur.l} says')||app.body.includes('Letter ${cur.l} says'),
    len:app.body.length
  });
})().catch(e=>{console.error(e);process.exit(1);});
