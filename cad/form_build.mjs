#!/usr/bin/env node
import fs from 'node:fs';
import {init,stress,studyStatus} from './headless.js';
const file=process.argv[2];
if(!file){process.stderr.write('usage: node form_build.mjs job.json\n');process.exit(1);}
const job=JSON.parse(fs.readFileSync(file,'utf8'));
await init(new URL('./vendor/replicad_single.wasm',import.meta.url).pathname);
const onp=p=>process.stderr.write('progress '+JSON.stringify({phase:p&&p.phase,it:p&&p.it,step:p&&p.step,t:p&&p.t})+'\n');
let out=job.op==='stress/status'?studyStatus(job):await stress(job,onp);
if(job.async&&out.job){let s=out;for(let i=0;i<700&&s.status==='running';i++){await new Promise(r=>setTimeout(r,70));s=studyStatus({id:out.job});}out=s.result||s;}
if(out.file&&out.file.text&&process.argv[3])fs.writeFileSync(process.argv[3],out.file.text);
process.stdout.write(JSON.stringify(out)+'\n');
