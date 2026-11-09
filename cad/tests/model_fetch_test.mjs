import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {CAD_TRAINED,BONSAI_OPTIONAL,packStatus} from '../model_pack.js';
import {fetchPack,discover,health,manifest,cli} from '../api/model_fetch.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
ok(!packStatus(CAD_TRAINED).ready&&!CAD_TRAINED.url&&CAD_TRAINED.bytes===3892652160&&CAD_TRAINED.sha256==='199839613fbf80d775a0d30000dc0592c62f38f0cf83ef352f6069e823349613'&&CAD_TRAINED.serve.ctx===24576&&CAD_TRAINED.serve.parallel===1&&CAD_TRAINED.ollamaTag==='amni-cad-3b:latest'&&!/qwen|huggingface|174080|home\//i.test(JSON.stringify(CAD_TRAINED)),'the CAD pack is pinned by digest, has no download URL, and uses a bounded serve profile',CAD_TRAINED);
ok(!packStatus(BONSAI_OPTIONAL).ready&&BONSAI_OPTIONAL.role==='optional','Bonsai stays an optional unreleased slot');
let un='';try{await fetchPack(CAD_TRAINED,{dest:'/tmp/nope.gguf'});}catch(e){un=e.code;}
ok(un==='unreleased','fetch refuses the unreleased pack before any network',un);
const body=crypto.randomBytes(200000),digest=sha(body),dir=fs.mkdtempSync(path.join(os.tmpdir(),'mdl-'));
const srv=http.createServer((q,r)=>{const start=q.headers.range?+String(q.headers.range).replace(/\D/g,'').split('-')[0]:0;if(q.url==='/slow'){r.writeHead(200,{'content-length':body.length});let i=0;const t=setInterval(()=>{if(i>=body.length){clearInterval(t);r.end();return;}const n=Math.min(8000,body.length-i);r.write(body.subarray(i,i+n));i+=n;},15);q.on('close',()=>clearInterval(t));return;}
  if(start>0&&start<body.length){r.writeHead(206,{'content-range':'bytes '+start+'-'+(body.length-1)+'/'+body.length,'content-length':body.length-start});r.end(body.subarray(start));return;}
  r.writeHead(200,{'content-length':body.length});r.end(body);});
await new Promise(res=>srv.listen(0,'127.0.0.1',res));
const port=srv.address().port,url='http://127.0.0.1:'+port+'/file';
const pack={id:'fixture',status:'ready',bytes:body.length,sha256:digest,url,runtime:'test-runtime'};
const dest=path.join(dir,'model.gguf');
const ac=new AbortController();
let cancelled='';
const slow={...pack,url:'http://127.0.0.1:'+port+'/slow'};
const p=fetchPack(slow,{dest,signal:ac.signal,onProgress:({loaded})=>{if(loaded>1000)ac.abort();}});
try{await p;}catch(e){cancelled=e.code||e.name;}
ok(cancelled==='cancelled'&&fs.existsSync(dest+'.part')&&fs.statSync(dest+'.part').size<body.length,'cancel keeps a partial file',{cancelled,part:fs.existsSync(dest+'.part')&&fs.statSync(dest+'.part').size});
fs.rmSync(dest+'.part',{force:true});
const t0=Date.now();
let prog=[];
const got=await fetchPack(pack,{dest,onProgress:x=>prog.push(x.loaded)});
ok(got.sha256===digest&&got.bytes===body.length&&prog.at(-1)===body.length,'a ready local fixture downloads, checks the digest, and reports progress',{ms:Date.now()-t0,n:prog.length});
const cut=body.subarray(0,50000);fs.writeFileSync(dest+'.part',cut);
fs.rmSync(dest,{force:true});
const t1=Date.now();
const resumed=await fetchPack(pack,{dest});
ok(resumed.bytes===body.length&&resumed.sha256===digest,'resume continues from the partial file',{ms:Date.now()-t1});
const bad={...pack,sha256:'0'.repeat(64),url:'http://127.0.0.1:'+port+'/bad'};
const badDest=path.join(dir,'bad.gguf');
let dig='';try{await fetchPack(bad,{dest:badDest});}catch(e){dig=e.code;}
ok(dig==='digest'&&!fs.existsSync(badDest)&&!fs.existsSync(badDest+'.part'),'a digest mismatch deletes the partial and does not install',dig);
ok(discover(dir,digest)===dest,'discovery finds the installed file by digest');
const known={...CAD_TRAINED,sha256:digest,bytes:body.length},hk=health(known,dir);
ok(health(pack,dir).ok&&!health(CAD_TRAINED,dir).ok&&!hk.ok&&hk.installed===dest,'a released pack is healthy only when its digest is on disk; an unavailable pack can be found by digest and still cannot be installed');
const man=path.join(dir,'manifest.json');
fs.writeFileSync(man,JSON.stringify({cad:{status:'unreleased',url:null,sha256:null,bytes:null}}));
const lines=[];const code=process.exitCode;process.exitCode=0;
await cli(['status','--manifest',man,'--dir',dir],m=>lines.push(m));
ok(/No download|not released|Identified by digest/i.test(lines.join('\n'))&&!/https?:\/\//.test(lines.join('\n')),'status prints the unavailable reason and no URL',lines.join(' '));
process.exitCode=code||0;
srv.close();
console.log(fail?fail+' FAILED':'ALL PASS');
process.exit(fail?1:0);
