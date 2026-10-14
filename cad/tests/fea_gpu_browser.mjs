import {spawn} from 'child_process';import fs from 'fs';import os from 'os';import path from 'path';
const root=path.resolve(new URL('../..',import.meta.url).pathname),port=+(process.env.PORT||8941),dbg=+(process.env.CDP||9341),hw=process.env.HW==='1',sizes=(process.env.RES||'16000,60000').split(',').map(Number),ud=fs.mkdtempSync(path.join(fs.existsSync('/tmp')?'/tmp':os.tmpdir(),'feagpu-'));
const sleep=t=>new Promise(r=>setTimeout(r,t)),srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const flags=hw?['--enable-unsafe-webgpu','--enable-features=Vulkan,WebGPUService','--use-vulkan=native','--ignore-gpu-blocklist','--use-angle=vulkan']:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-unsafe-webgpu','--enable-features=Vulkan','--use-webgpu-adapter=swiftshader'];
const ch=spawn('google-chrome-stable',['--headless=new','--no-sandbox',...flags,'--remote-debugging-port='+dbg,'--user-data-dir='+ud,'about:blank'],{stdio:process.env.V?'inherit':'ignore',env:{...process.env,HOME:ud,TMPDIR:ud}});
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log(c?'ok  ':'FAIL',m);};
try{
  let tgt;for(let i=0;i<60&&!tgt;i++){await sleep(250);try{tgt=(await(await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find(t=>t.type==='page');}catch{}}
  const ws=new WebSocket(tgt.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pend={};ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id];}};
  const cmd=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
  await cmd('Page.enable');await cmd('Page.navigate',{url:`http://127.0.0.1:${port}/cad/package.json`});await sleep(1500);
  const js=`(async()=>{try{const ad=navigator.gpu?await navigator.gpu.requestAdapter({powerPreference:'high-performance'}):null;
const CW=new Worker('/cad/cad.worker.js',{type:'module'});const m=await new Promise(r=>{CW.onmessage=e=>{if(e.data.mesh)r(e.data.mesh);};CW.postMessage({id:1,cmd:'build',doc:{params:[],features:[{id:'a',type:'box',w:100,d:10,h:10,x:50}]}});});CW.terminate();
const fid=n=>m.faces.findIndex(f=>f.n&&Math.abs(f.n[0]-n[0])+Math.abs(f.n[1]-n[1])+Math.abs(f.n[2]-n[2])<1e-6);
const W=new Worker('/cad/fea.worker.js',{type:'module'});let id=0;const call=inp=>new Promise((res,rej)=>{const my=++id;W.onmessage=e=>{if(e.data.id!==my||e.data.progress)return;e.data.ok?res(e.data.r):rej(e.data.error);};W.postMessage({id:my,cmd:'fea',inp});});
const base={pos:m.pos,idx:m.idx,groups:m.groups,bbox:m.props.bbox,volume:m.props.volume,mat:{E:200000,nu:0.3},fixed:[fid([-1,0,0])],loads:[{faces:[fid([1,0,0])],F:[0,0,-100]}]};
const out={adapter:ad?ad.info.vendor+' '+ad.info.architecture:null,runs:[]};await call({...base,res:3000,solver:'gpu'});
for(const res of ${JSON.stringify(sizes)}){const g=await call({...base,res,solver:'gpu'}),c=await call({...base,res,solver:'cpu'});let dv=0,mx=0;for(let i=0;i<g.vDisp.length;i++){dv=Math.max(dv,Math.abs(g.vDisp[i]-c.vDisp[i]));mx=Math.max(mx,Math.abs(c.vDisp[i]));}
out.runs.push({res,el:g.nEl,backend:g.backend,gpuError:g.gpuError,gpuIt:g.iters,gpuMs:g.ms,cpuIt:c.iters,cpuMs:c.ms,dDisp:dv/mx,dVm:Math.abs(g.vmMax/c.vmMax-1)});}
const mres=+(${JSON.stringify(process.env.MRES||'15000')}),mo={...base,type:'modal',modes:6,res:mres,loads:[],mat:{E:200000,nu:0.3,rho:7850}},mg=await call({...mo,solver:'gpu'}),mc=await call({...mo,solver:'cpu'});out.modal={backend:mg.backend,gpuError:mg.gpuError,el:mg.nEl,fg:mg.freqs,fc:mc.freqs,gpuMs:mg.ms,cpuMs:mc.ms,gpuIt:mg.iters,cpuIt:mc.iters};
W.terminate();return out;}catch(e){return{err:String(e.stack||e)};}})()`;
  const r=(await cmd('Runtime.evaluate',{expression:js,awaitPromise:true,returnByValue:true})).result?.result?.value||{err:'no result'};
  console.log('adapter',r.adapter);if(r.err)ok(false,r.err);
  for(const q of r.runs||[]){console.log(`res ${q.res} el ${q.el} gpu ${q.gpuMs} ms (${q.gpuIt} it) cpu ${q.cpuMs} ms (${q.cpuIt} it) speedup ${(q.cpuMs/q.gpuMs).toFixed(1)}x`);ok(q.backend==='gpu','ran on WebGPU '+(q.gpuError||''));ok(q.dDisp<1e-4&&q.dVm<1e-4,'GPU matches CPU: disp '+q.dDisp.toExponential(1)+' vm '+q.dVm.toExponential(1));}
  const mo=r.modal;if(mo){const d=Math.max(...mo.fg.map((f,i)=>Math.abs(f/mo.fc[i]-1)));console.log(`modal el ${mo.el} gpu ${mo.gpuMs} ms (${mo.gpuIt} it) cpu ${mo.cpuMs} ms (${mo.cpuIt} it) f ${mo.fg.map(f=>f.toFixed(1)).join(', ')}`);ok(mo.backend==='gpu','modal ran on WebGPU '+(mo.gpuError||''));ok(d<1e-3,'modal GPU frequencies match CPU: '+d.toExponential(1));}
  ws.close();
}finally{ch.kill();srv.kill();await sleep(500);fs.rmSync(ud,{recursive:true,force:true});}
console.log(pass+' passed, '+fail+' failed');process.exitCode=fail?1:0;
