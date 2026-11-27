import {solveGrid} from '../fea.js';
import {setNative,helium} from '../he/host.js';
import {register,open,binOf} from '../he/native.js';
import fs from 'node:fs';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));};
const grid=(nx,ny,nz,p)=>{const ne=nx*ny*nz,NX=nx+1,NY=ny+1,nn=NX*NY*(nz+1),G={nx,ny,nz,ox:0,oy:0,oz:0,h:1,solid:new Uint8Array(ne),frac:new Float32Array(ne)},fixed=new Uint8Array(nn*3),f=new Float64Array(nn*3);for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const e=(k*ny+j)*nx+i,s=!p||k<2||i%p<2||j%p<2;G.solid[e]=s?1:0;G.frac[e]=s?1:0;}for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const b=(j*NX+i)*3;fixed[b]=fixed[b+1]=fixed[b+2]=1;f[((nz*NY+j)*NX+i)*3+2]=-1;}return{G,fixed,f};};
const run=async(g,o={})=>{const{G,fixed,f}=grid(...g);const r=await solveGrid(G,{E:2340,nu:0.4},fixed,f,{solver:'cpu',tol:1e-6,...o});return{...r,react:[0,1,2].map(a=>{let s=0;for(let i=a;i<fixed.length;i+=3)if(fixed[i])s+=r.R(i);return s;})};};
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const bin=binOf('fea_grid');
if(!fs.existsSync(bin)){console.log('no native fea_grid for '+process.platform+'-'+process.arch+', skipped');process.exit(0);}
const cases=[[24,24,24],[40,40,7,5],[70,70,1]],W=[];
for(const c of cases)W.push(await run(c));
ok(register().includes('fea_grid'),'register finds fea_grid');
for(let i=0;i<cases.length;i++){const n=await run(cases[i]),w=W[i];ok(n.backend==='native','backend native '+cases[i]);ok(n.iters===w.iters&&n.levels===w.levels,'iters/levels '+cases[i]+' '+n.iters+'/'+w.iters);ok(same(n.u,w.u),'u bit-identical '+cases[i]);ok(same(n.vm,w.vm),'von Mises bit-identical '+cases[i]);ok(same(n.react,w.react),'reactions bit-identical '+cases[i]);}
const u0=await run([20,20,20],{u0:new Float64Array(21*21*21*3).fill(1e-3)});setNative('fea_grid',null);const u0w=await run([20,20,20],{u0:new Float64Array(21*21*21*3).fill(1e-3)});ok(same(u0.u,u0w.u),'u0 start matches');register();
const progs=[];const{G,fixed,f}=grid(30,30,30);await solveGrid(G,{E:2340,nu:0.4},fixed,f,{solver:'cpu',tol:1e-9},(i,r)=>progs.push([i,r]));ok(progs.length>0&&progs.every(([i,r])=>i%5===0&&r>0),'progress frames arrive ('+progs.length+')');
const err=console.error;let warn='';process.stderr.write=(w=>s=>{warn+=s;return true;})(process.stderr.write.bind(process.stderr));setNative('fea_grid',env=>open('fea_grid','/nonexistent/fea_grid',env.fg_prog));const fb=await run([24,24,24]);ok(fb.backend==='cpu'&&same(fb.u,W[0].u),'falls back to wasm when the binary cannot start');ok(/could not start/.test(warn),'fallback is reported once');console.error=err;register();
const a=open('fea_grid',bin),b=open('fea_grid',bin),c=open('fea_grid',bin);let msg='';try{a.ex.fg_rel();}catch(e){msg=e.message;}ok(/released/.test(msg),'oldest instance is released past two');ok(c.ex.fg_rel()===0&&b.ex.fg_rel()===0,'newer instances still answer');b.close();c.close();
const tm=S2=>{const f=bin+'.man.json';fs.writeFileSync(f,JSON.stringify({files:{['he/native/'+bin.split('/').pop()]:S2}}));const r=register(undefined,f);fs.rmSync(f);return r;};ok(!tm('0'.repeat(64)).includes('fea_grid'),'a binary that does not match the manifest is refused');ok(register().includes('fea_grid'),'the shipped manifest matches the binary');
let bad='';const d=open('fea_grid',bin);d.ex.fg_grid(4,4,4,3,0);try{d.put(1,new Float32Array(5));}catch(e){bad=e.message;}ok(/size mismatch/.test(bad),'wrong view size is refused');ok(d.get(1).length===64,'stream stays in sync after a refused write');d.close();
console.log(pass+' passed, '+fail+' failed');process.exit(fail?1:0);
