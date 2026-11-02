import {execFileSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const ISS=process.env.PRO_ISSUER||path.join(os.homedir(),'ai/amni-cad-desktop/tools/pro-license.mjs');let K=null;
export const proKey=()=>K||(K=fs.existsSync(ISS)?execFileSync('node',[ISS,'issue','--name','CAD Tests','--org','Amniscient','--plan','pro','--days','1','--no-ledger'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim():'');
export async function asPro(p){const k=proKey();k&&await p.evaluateOnNewDocument(k=>{try{localStorage.getItem('amnicad.pro')||localStorage.setItem('amnicad.pro',k);}catch{}},k);}
