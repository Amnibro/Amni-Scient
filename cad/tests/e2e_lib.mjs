import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve(new URL('../..',import.meta.url).pathname),SRV=new URL('../mcp/amnicad-mcp.mjs',import.meta.url).pathname,P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),sleep=t=>new Promise(r=>setTimeout(r,t));
export async function startE2E({web=18700,mcp=18701,width=1280,height=800}={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amnicad-e2e-')),ud=fs.mkdtempSync(path.join(os.tmpdir(),'amnicad-e2e-ud-')),srv=spawn('python3',['-m','http.server',String(web),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'}),ch=spawn(process.execPath,[SRV],{cwd:dir,env:{...process.env,AMNICAD_PORT:String(mcp),AMNICAD_PORT_SPAN:'1',AMNICAD_CONFIG:path.join(dir,'cfg')},stdio:['pipe','pipe','pipe']});
  let rid=0,buf='',b=null;const waiters=new Map();
  ch.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){const m=JSON.parse(buf.slice(0,i));buf=buf.slice(i+1);waiters.get(m.id)?.(m);waiters.delete(m.id);}});
  const rpc=(method,params)=>new Promise(r=>{const id=++rid;waiters.set(id,r);ch.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');}),call=async(name,args={})=>(await rpc('tools/call',{name,arguments:args})).result,T=r=>JSON.parse(r.content[0].text);
  const close=async()=>{try{b&&await b.close();}catch{}ch.kill();srv.kill();fs.rmSync(dir,{recursive:true,force:true});fs.rmSync(ud,{recursive:true,force:true});};
  try{
    await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'e2e',version:'1'}});
    for(let i=0;i<40;i++){try{if((await fetch(`http://127.0.0.1:${web}/cad/`)).ok)break;}catch{}await sleep(250);}
    b=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',userDataDir:ud,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await b.newPage();await page.setViewport({width,height});const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(`http://127.0.0.1:${web}/cad/`);
    await page.waitForFunction(()=>window.amnicad&&window.amnicad.S.kernel,{timeout:90000});
    const code=T(await call('connection_status')).pairing_code;
    await page.evaluate(async(c,port)=>{const m=await import('./bridge.js');window.__br=m.connectBridge(window.amnicad.API,{port,span:1,code:c});},code,mcp);
    for(let i=0;i<70&&!T(await call('connection_status')).connected;i++)await sleep(250);
    return{page,call,T,rpc,errs,close,sleep};
  }catch(e){await close();throw e;}
}
