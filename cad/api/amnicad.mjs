#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const ORIGIN=process.env.AMNI_CAD_ORIGIN||'https://amni-scient.com/cad/',PORT=41800;
const home=os.homedir(),plat=process.platform,cfgDir=()=>process.env.AMNI_CAD_CONFIG||(plat==='win32'?path.join(process.env.APPDATA||home,'amni-cad'):plat==='darwin'?path.join(home,'Library','Application Support','amni-cad'):path.join(process.env.XDG_CONFIG_HOME||path.join(home,'.config'),'amni-cad')),cacheDir=()=>process.env.AMNI_CAD_CACHE||(plat==='win32'?path.join(process.env.LOCALAPPDATA||home,'amni-cad','engine'):plat==='darwin'?path.join(home,'Library','Caches','amni-cad','engine'):path.join(process.env.XDG_CACHE_HOME||path.join(home,'.cache'),'amni-cad','engine'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),say=m=>process.stderr.write(m+'\n'),bad=(m,code=400)=>Object.assign(new Error(m),{code});
const rd=f=>{try{return fs.readFileSync(f,'utf8').trim();}catch{return'';}},wr=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s,{mode:0o600});try{fs.chmodSync(f,0o600);}catch{}};
export async function sync(origin=ORIGIN,dir=cacheDir(),log=say){const get=async u=>{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(u+' → HTTP '+r.status);return Buffer.from(await r.arrayBuffer());};let man;try{man=JSON.parse(await get(new URL('api/engine.json?t='+Date.now(),origin)));}catch(e){if(fs.existsSync(path.join(dir,'engine.json'))){log('Offline: using the engine already on this computer ('+e.message+')');return dir;}throw new Error('Could not download the Amni-CAD engine: '+e.message);}
  const pass=async all=>{let n=0,bytes=0,stale=false;for(const[f,h]of Object.entries(man.files)){const p=path.join(dir,...f.split('/'));if(!path.resolve(p).startsWith(path.resolve(dir)+path.sep))throw new Error('bad path in manifest: '+f);if(!all&&fs.existsSync(p)&&sha(fs.readFileSync(p))===h)continue;const b=await get(new URL(f+'?h='+h.slice(0,12),origin));stale=stale||sha(b)!==h;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p+'.part',b);fs.renameSync(p+'.part',p);n++;bytes+=b.length;}return{n,bytes,stale};};
  let r=await pass(false);r.stale&&(r=await pass(true));wr(path.join(dir,'engine.json'),JSON.stringify(man));r.n&&log('Engine updated: '+r.n+' files, '+(r.bytes/1048576).toFixed(1)+' MB');return dir;}
export async function engine(o={}){const dir=o.dir||process.env.AMNI_CAD_DIR||await sync(o.origin,o.cache,o.log),E=await import(pathToFileURL(path.join(dir,'headless.js')).href),P=await import(pathToFileURL(path.join(dir,'pro.js')).href);await E.init(path.join(dir,'vendor','replicad_single.wasm'));return{dir,E,P};}
export function licenser(P,o={}){const file=path.join(o.config||cfgDir(),'license'),verify=o.verify||(t=>P.check(t));let L=null,at=0;
  const load=async(force)=>{if(L&&!force&&Date.now()-at<36e5)return L;const t=rd(file);if(!t)throw bad('No Amni-CAD Pro license on this computer. Run: amnicad activate <your AMNIPRO key>',402);let x;try{x=await verify(t);}catch(e){if(!e.renew)throw bad(e.message,402);x={...e.lic,token:t,expired:true};}
    if(o.renew!==false&&P.due(x))try{const n=o.renewKey?await o.renewKey(x.token):await P.renewKey(x.token);wr(file,n.token);x=n;}catch(e){if(x.expired)throw bad('Your Pro subscription could not be renewed: '+e.message,402);}
    if(x.expired)throw bad('This license has expired. Renew it from the billing page in Amni-CAD',402);if(!P.allows(x,'api'))throw bad('This license does not include the headless API',403);L=x;at=Date.now();return L;};
  return{file,load,activate:async t=>{const x=await verify(String(t).replace(/\s+/g,''));if(!P.allows(x,'api'))throw bad('This license does not include the headless API',403);wr(file,x.token);L=x;at=Date.now();return x;},remove:()=>{try{fs.unlinkSync(file);}catch{}L=null;},info:x=>({name:x.name||'',org:x.org||'',email:x.email||'',plan:x.plan||'pro',seats:x.seats||1,expires:x.exp?new Date(x.exp).toISOString():null,subscription:!!x.sub})};}
export const apiToken=(config=cfgDir())=>{const f=path.join(config,'api-token');let t=rd(f);if(!t){t='amk_'+crypto.randomBytes(24).toString('base64url');wr(f,t);}return t;};
const ROUTES={'POST /v1/build':'build','POST /v1/export':'exportPart','POST /v1/stress':'stress','POST /v1/flow':'flow','POST /v1/nonlinear':'nonlinear','POST /v1/quote':'quote','POST /v1/dxf':'dxf','POST /v1/toolpath':'toolpath','POST /v1/art':'art','POST /v1/art/review':'artReview'};
export function job(body,type,q){if(/json/.test(type)||body[0]===0x7b)return JSON.parse(body.toString('utf8'));if(/gltf/.test(type)||body.subarray(0,4).toString('latin1')==='glTF'){const o={glb:new Uint8Array(body)};for(const[k,v]of q)o[k]=/^(tris|size|height|yaw|samples)$/.test(k)?+v:k==='budgets'||k==='views'?v.split(',').map(Number):v;return o;}const fmt=q.get('fmt')==='brep'||/brep/.test(type)?'brep':'step';return{doc:{name:q.get('name')||'part',units:q.get('units')||'mm',material:q.get('material')||'al6061',params:[],features:[{id:'i',type:'import',blob:'b',fmt}]},blobs:{b:new Uint8Array(body)},format:q.get('format')||undefined,faces:q.get('faces')==='1'};}
export async function serve(o={}){const{E,P,dir}=o.engine||await engine(o),lic=o.lic||licenser(P,o),token=o.token||apiToken(o.config),host=o.host||'127.0.0.1',port=o.port??PORT,loop=/^(127\.|localhost$|::1$)/.test(host),MAX=(o.maxMB||128)*1048576;
  const send=(res,code,body,type='application/json',extra={})=>{const b=Buffer.isBuffer(body)||body instanceof Uint8Array||typeof body==='string'?body:JSON.stringify(body,null,1);res.writeHead(code,{'content-type':type,'cache-control':'no-store',...(o.cors?{'access-control-allow-origin':o.cors,'access-control-allow-headers':'authorization, content-type'}:{}),...extra});res.end(b);};
  const read=req=>new Promise((ok,no)=>{const parts=[];let n=0;req.on('data',c=>{n+=c.length;if(n>MAX){no(bad('Request is larger than '+(MAX>>20)+' MB',413));req.destroy();}else parts.push(c);});req.on('end',()=>ok(Buffer.concat(parts)));req.on('error',no);});
  const srv=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://x'),k=req.method+' '+u.pathname;if(req.method==='OPTIONS')return send(res,o.cors?204:403,'');
      if(loop&&!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(req.headers.host||''))return send(res,421,{ok:false,error:'This API only answers on localhost'});
      if(k==='GET /v1/health')return send(res,200,{ok:true,service:'amni-cad',api:1,engine:path.basename(dir)});
      if(req.headers.authorization!=='Bearer '+token)return send(res,401,{ok:false,error:'Send the local API token as "Authorization: Bearer <token>" (run: amnicad token)'});
      const L=await lic.load();if(k==='GET /v1/license')return send(res,200,{ok:true,...lic.info(L)});if(k==='GET /v1/catalog')return send(res,200,await E.catalog());
      const fn=ROUTES[k];if(!fn)return send(res,404,{ok:false,error:'Routes: GET /v1/health, /v1/license, /v1/catalog; POST '+Object.keys(ROUTES).map(r=>r.slice(5)).join(', ')});
      const body=await read(req);if(!body.length)return send(res,400,{ok:false,error:'Send a JSON job ({"doc":{...}}) or a STEP file as the request body'});const j=job(body,req.headers['content-type']||'',u.searchParams),r=await E[fn](j);
      if(r.bytes)return u.searchParams.get('json')?send(res,200,{ok:true,name:r.name,type:r.type,base64:Buffer.from(r.bytes).toString('base64')}):send(res,200,Buffer.from(r.bytes),r.type,{'content-disposition':'attachment; filename="'+r.name.replace(/[^\w.-]/g,'_')+'"'});
      if(r.text!=null)return send(res,200,r.text,r.type);send(res,200,{ok:true,...r});}
    catch(e){send(res,e.code>=400&&e.code<600?e.code:500,{ok:false,error:String(e&&e.message||e)});}});
  await new Promise((ok,no)=>{srv.once('error',no);srv.listen(port,host,ok);});return{srv,port:srv.address().port,token,close:()=>new Promise(r=>srv.close(r))};}
const HELP=`Amni-CAD headless API (included with Amni-CAD Pro)
  amnicad activate <AMNIPRO key>   store your license key on this computer
  amnicad status                   show the license and engine
  amnicad serve [--port 41800] [--host 127.0.0.1] [--cors <origin>]
                                   run the local HTTP API (Bearer token: amnicad token)
  amnicad token                    print the local API token
  amnicad run <job.json> [--out <file>]
                                   run one job without a server; job.op is build, export,
                                   stress, flow, nonlinear, quote, dxf, toolpath, art
                                   (game-ready GLB + LODs from a sculpt) or review
  amnicad vault <command>          Enterprise: team vault automation (amnicad vault help)
  amnicad update                   download the latest engine
  amnicad deactivate               remove the license from this computer
Docs: https://amni-scient.com/amni-cad-api.html`;
export async function main(argv=process.argv.slice(2)){const[cmd,...a]=argv,opt=n=>{const i=a.indexOf('--'+n);return i>=0?a[i+1]:undefined;};
  if(!cmd||cmd==='help'||cmd==='--help')return say(HELP);if(cmd==='token')return console.log(apiToken());
  if(cmd==='update')return void await sync();
  const{E,P,dir}=await engine(),lic=licenser(P);
  if(cmd==='activate'){const x=await lic.activate(a[0]||'');return say('Amni-CAD Pro is active for '+(x.org||x.name||x.email)+(x.exp?' until '+new Date(x.exp).toLocaleDateString('en-US'):''));}
  if(cmd==='deactivate'){lic.remove();return say('License removed from this computer');}
  if(cmd==='status'){let s;try{s=lic.info(await lic.load(true));}catch(e){s={error:e.message};}return console.log(JSON.stringify({license:s,engine:dir,api_token_file:path.join(cfgDir(),'api-token')},null,1));}
  if(cmd==='serve'){const s=await serve({engine:{E,P,dir},lic,port:opt('port')!=null?+opt('port'):PORT,host:opt('host'),cors:opt('cors')});await lic.load();return say('Amni-CAD API on http://'+(opt('host')||'127.0.0.1')+':'+s.port+'/v1/ · token: amnicad token');}
  if(cmd==='run'){await lic.load();const j=JSON.parse(fs.readFileSync(a[0],'utf8')),fn={build:'build',export:'exportPart',stress:'stress',flow:'flow',nonlinear:'nonlinear',quote:'quote',dxf:'dxf',toolpath:'toolpath',art:'art',review:'artReview'}[j.op];if(!fn)throw new Error('job.op must be build, export, stress, flow, nonlinear, quote, dxf, toolpath, art or review');for(const k of['glb','paint'])typeof j[k]==='string'&&fs.existsSync(path.resolve(path.dirname(a[0]),j[k]))&&(j[k]=new Uint8Array(fs.readFileSync(path.resolve(path.dirname(a[0]),j[k]))));const r=await E[fn](j),out=opt('out');
  if(cmd==='vault'){const L=await lic.load();if(!P.allows(L,'team'))throw new Error('Vault automation comes with Amni-CAD Enterprise');const V=await import(pathToFileURL(path.join(dir,'api','vault_node.mjs')).href);return V.cli(a,{config:cfgDir(),E,log:say});}
    if(r.bytes||r.text!=null){const f=out||(r.name||'part.dxf');fs.writeFileSync(f,r.bytes?Buffer.from(r.bytes):r.text);return say('Wrote '+f);}const t=JSON.stringify(r,null,1);out?fs.writeFileSync(out,t):console.log(t);return;}
  throw new Error('Unknown command "'+cmd+'"\n'+HELP);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{say('amnicad: '+e.message);process.exit(1);});
