// Shared browser harness for the shop tests: static server for the repo (COOP/COEP, test pro_keys.json) plus Chrome through Playwright.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
export const root=path.resolve(new URL('../..',import.meta.url).pathname),sleep=t=>new Promise(r=>setTimeout(r,t));
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.step':'text/plain','.dxf':'text/plain'};
export async function serve(keys){const s=http.createServer((q,r)=>{const u=new URL(q.url,'http://x');if(keys&&u.pathname==='/cad/pro_keys.json'){r.writeHead(200,{'content-type':'application/json'});return r.end(JSON.stringify(keys));}
  let f=path.join(root,decodeURIComponent(u.pathname));if(f.endsWith('/'))f+='index.html';if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream','cross-origin-opener-policy':'same-origin','cross-origin-embedder-policy':'credentialless'});fs.createReadStream(f).pipe(r);}).listen(0,'127.0.0.1');
  await new Promise(r=>s.on('listening',r));return{srv:s,base:'http://127.0.0.1:'+s.address().port+'/cad/'};}
export async function chrome(){const {chromium}=createRequire(path.join(process.env.PLAYWRIGHT||process.cwd(),'x.js'))('playwright');return chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});}
export function tally(){let fail=0;const ok=(c,m)=>{c||fail++;console.log(c?'PASS':'FAIL',m);};return{ok,done:()=>{console.log(fail?fail+' FAILED':'ALL PASS');return fail;}};}
