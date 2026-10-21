#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const CAD=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ROOTS=['headless.js','pro.js','pro_keys.json'],EXTRA=['vendor/replicad_single.wasm'];
const SPEC=/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|new URL\(\s*)(['"])(\.{1,2}\/[^'"?#]+)/g;
export function crawl(dir=CAD){const seen=new Set(),todo=[...ROOTS,...EXTRA];while(todo.length){const f=todo.pop();if(seen.has(f))continue;const p=path.join(dir,f);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())continue;seen.add(f);if(!/\.m?js$/.test(f))continue;const src=fs.readFileSync(p,'utf8');for(const m of src.matchAll(SPEC)){const r=path.posix.normalize(path.posix.join(path.posix.dirname(f),m[2]));r.startsWith('..')||todo.push(r);}const near=f.replace(/\.js$/,'_bg.wasm');fs.existsSync(path.join(dir,near))&&todo.push(near);}return[...seen].sort();}
export function manifest(dir=CAD){const files=Object.fromEntries(crawl(dir).map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex')]));return{api:1,files};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const m=manifest(),out=path.join(CAD,'api','engine.json'),t=JSON.stringify(m,null,0)+'\n',old=fs.existsSync(out)?fs.readFileSync(out,'utf8'):'';process.argv.includes('--check')?(old===t?console.log('engine.json is current'):(console.error('engine.json is stale: run node cad/api/manifest.mjs'),process.exit(1))):(fs.writeFileSync(out,t),console.log(Object.keys(m.files).length+' files, '+(Object.keys(m.files).reduce((a,f)=>a+fs.statSync(path.join(CAD,f)).size,0)/1048576).toFixed(1)+' MB'));}
