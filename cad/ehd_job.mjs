#!/usr/bin/env node
import fs from 'node:fs';
import {submit,status} from './ehd.js';
const file=process.argv[2];
if(!file){process.stderr.write('usage: node ehd_job.mjs job.json\n');process.exit(1);}
const job=JSON.parse(fs.readFileSync(file,'utf8'));
const onp=p=>process.stderr.write('progress '+JSON.stringify(p)+'\n');
let out=job.op==='ehd/status'?status(job):await submit(job,onp);
if(job.async&&out.job){let s=out;for(let i=0;i<70&&s.status==='running';i++){await new Promise(r=>setTimeout(r,70));s=status({id:out.job});}out=s.result||s;}
if(out.file&&out.file.text&&process.argv[3])fs.writeFileSync(process.argv[3],out.file.text);
process.stdout.write(JSON.stringify(out)+'\n');
