import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ancestors,loadPartners,partnerOf} from './partner.js';
const ROOT=fileURLToPath(new URL('..',import.meta.url)).replace(/[\\/]+$/,'');
const HOST=process.env.CAD_HOST||'127.0.0.1';
const PORT=Number(process.env.CAD_PORT||8778);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.map':'application/json','.txt':'text/plain; charset=utf-8','.amni':'text/plain; charset=utf-8','.step':'application/step','.stl':'model/stl'};
const partners=await loadPartners();
function embedPath(p){const x=p.replace(/\/$/,'');return x==='/cad/embed'||x==='/cad/embed.html';}
function cadPath(p){return p==='/cad'||p.startsWith('/cad/');}
function send(res,code,headers,buf){res.writeHead(code,headers);res.end(buf);}
function frameHeaders(u){
  const h={'Cache-Control':'no-cache'};
  if(embedPath(u.pathname)){
    const p=partnerOf(partners,u.searchParams.get('partner'));
    h['Content-Security-Policy']="frame-ancestors "+(p?ancestors(p):"'none'")+"; default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-6p13ug9Y/2TWPZMF0aIT0xv2TqxNkp62hhuZFDN2uAM='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data: https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'";
    h['Cross-Origin-Opener-Policy']='unsafe-none';
    h['X-Robots-Tag']='noindex, nofollow';
    return h;
  }
  if(cadPath(u.pathname)){
    h['X-Frame-Options']='SAMEORIGIN';
    h['Content-Security-Policy']="frame-ancestors 'self'";
    h['Cross-Origin-Opener-Policy']='same-origin';
    h['Cross-Origin-Embedder-Policy']='credentialless';
  }
  return h;
}
async function resolve(u){
  if(embedPath(u.pathname))return join(ROOT,'cad','embed.html');
  let rel=decodeURIComponent(u.pathname).replace(/^\/+/,'');
  if(!rel||rel.endsWith('/'))rel+='index.html';
  const full=normalize(join(ROOT,rel));
  if(full!==ROOT&&!full.startsWith(ROOT+sep)){const e=new Error('forbidden');e.code=403;throw e;}
  try{const s=await stat(full);return s.isDirectory()?join(full,'index.html'):full;}
  catch{const e=new Error('missing');e.code=404;throw e;}
}
const server=createServer(async(req,res)=>{
  try{
    const u=new URL(req.url||'/',`http://${req.headers.host||HOST+':'+PORT}`);
    if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{'Content-Type':'text/plain'},'Method not allowed');
    const file=await resolve(u);
    const buf=await readFile(file);
    const type=MIME[extname(file).toLowerCase()]||'application/octet-stream';
    send(res,200,{'Content-Type':type,...frameHeaders(u)},req.method==='HEAD'?undefined:buf);
  }catch(e){
    const code=e.code===403?403:e.code===404||e.code==='ENOENT'?404:500;
    send(res,code,{'Content-Type':'text/plain; charset=utf-8'},code===404?'Not found':code===403?'Forbidden':'Server error');
  }
});
server.listen(PORT,HOST,()=>process.stdout.write('Amni-CAD embed '+HOST+':'+PORT+'\n'));
