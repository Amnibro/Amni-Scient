import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import * as I from '../pdm_import.js';
const CAD=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),FIX=path.join(CAD,'tests/fixtures');
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+(typeof x==='string'?x:JSON.stringify(x))+')':''));};
const pk=await import(pathToFileURL(path.join(CAD,'vendor/amni-vault/pkg/vault_core.js')).href);
pk.initSync({module:fs.readFileSync(path.join(CAD,'vendor/amni-vault/pkg/vault_core_bg.wasm'))});
const net=await import(pathToFileURL(path.join(CAD,'vendor/amni-vault/net.js')).href);
function vault(){const s=new net.Session();s.generate();const es=JSON.parse(s.create('Import semantics',4,Date.now()));s.reset();s.ingest(JSON.stringify(es));
  const chunks=new Map();
  const cli={s,async upload(ids){for(const id of ids||[]){const d=s.take_chunk(id);d&&chunks.set(id,d);}},
    async push(build){const b=JSON.parse(build());if(b.errors&&b.errors.length){s.drop_pending();throw new Error(b.errors.join('\n'));}await this.upload(b.chunks||[]);if(!b.entries.length)return b;s.ingest(JSON.stringify(b.entries));return b;},
    ops(ops){return this.push(()=>s.batch(JSON.stringify(ops),Date.now()));},
    async seal(item,name,mime,bytes){const r=JSON.parse(s.seal(item,name,mime,bytes));await this.upload(r.chunks);return r.file;}};
  const rows=()=>JSON.parse(s.search('',false,5000)).filter(r=>!r.lib);
  const find=n=>((rows().find(r=>String(r.number).toUpperCase()===String(n).toUpperCase())||{}).id)||null;
  const findKey=k=>{const r=rows().map(x=>JSON.parse(s.item(x.id))).find(x=>x&&!x.hidden&&x.props&&x.props.import_key===k&&!x.props.drawing_of&&!x.props.files_of);return r?r.id:null;};
  const ctx={newId:()=>crypto.randomBytes(9).toString('base64url'),item:id=>JSON.parse(s.item(id)),ops:o=>cli.ops(o),eco:()=>!!JSON.parse(s.state()).require_eco,me:()=>JSON.parse(s.state()).me.key,ecoNumber:e=>(JSON.parse(s.state()).ecos.find(x=>x.id===e)||{}).number||'',file:(id,n,m,b)=>cli.seal(id,n,m,b),find,findKey,companion:(n,k)=>{const r=rows().map(x=>JSON.parse(s.item(x.id))).find(x=>x&&!x.hidden&&x.props&&x.props[k==='drawing'?'drawing_of':'files_of']===n);return r?r.id:null;},
    step:async(name,data,o)=>{const b=await cli.push(()=>{const p=JSON.parse(s.plan(name,data)),root=p.analysis.root??0,rp=p.parts.find(x=>x.idx===root),cur=o.target&&JSON.parse(s.item(o.target));if(rp&&cur&&!cur.hidden){rp.action='revise';rp.target=cur.id;}else if(rp&&(rp.action==='lib'||o.number)){rp.action='new';rp.target=null;o.number&&(rp.number=o.number);}if(rp)rp.name=o.name||o.title||rp.name;if(rp&&o.category)rp.category=o.category;if(rp&&o.props)rp.props={...(rp.props||{}),...o.props};return s.checkin(name,data,JSON.stringify(p),o.note||'',Date.now());});const id=b.items[JSON.parse(s.analyze(name,data)).root??0];if(!id)throw new Error(name+' is not a valid STEP file, so nothing was stored');return id;}};
  return{s,ctx,rows,item:n=>{const id=find(n);return id?JSON.parse(s.item(id)):null;}};}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'imp-sem-'));
const step=fs.readFileSync(path.join(FIX,'gantry_asm.step')),plate=fs.readFileSync(path.join(FIX,'gantry_plate.step')),pdf=fs.readFileSync(path.join(FIX,'drawings/7731-A2.pdf'));
const W=(n,b)=>fs.writeFileSync(path.join(dir,n),b);
W('pdm-export.csv','Part Number,Revision,Description,State,File Name,Material,Category\n500-100,C,Gantry frame,Released,500-100_C.step,6061-T6,Weldment\n500-100,A,Gantry frame old,Obsolete,500-100_A_notes.txt,6061-T6,Weldment\nPLT-7,B,Cover plate,In Work,PLT-7.step,Al 6061,Machined\n');
W('500-100_C.step',step);W('500-100_A_notes.txt','rev A note units were mm');W('500-100_C.SLDASM','native-solidworks-bytes');W('PLT-7.step',plate);W('BAD-1.step','this is not a real solid\n');W('mesh.stl','solid x\nendsolid x\n');W('scan_7731.pdf',pdf);
const files=()=>fs.readdirSync(dir).map(n=>({name:n,arrayBuffer:async()=>{const b=fs.readFileSync(path.join(dir,n));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}}));
const t0=Date.now();
const V=vault();
const read1=await I.read(files());
const g1=I.plan(read1.files,read1.rows,()=>null);
const gan=g1.find(x=>x.number==='500-100');
ok(gan&&gan.name==='Gantry frame'&&gan.state==='released'&&gan.rev==='C'&&gan.material==='6061-T6','highest spreadsheet revision wins name, lifecycle and material',gan&&{name:gan.name,state:gan.state,rev:gan.rev});
ok(g1.find(x=>x.files.some(f=>/SLDASM/.test(f.f.name)&&f.kind==='document'))&&g1.find(x=>x.files.some(f=>/\.stl$/.test(f.f.name)&&f.kind!=='model')),'SLDASM and STL stay stored, not parsed as solids');
const tA=Date.now();
const res=await I.apply(V.ctx,g1);
const applyMs=Date.now()-tA;
const bad=res.find(x=>/BAD-1/.test(x.name||'')||/not a valid STEP/.test(x.err||''));
ok(bad&&bad.err&&/not a valid STEP/.test(bad.err)&&!V.item('BAD-1'),'a fake STEP is an error and creates no item',bad);
const it=V.item('500-100'),row=V.rows().find(r=>r.number==='500-100');
ok(it&&row&&row.kind==='assembly'&&row.state==='released'&&it.name==='Gantry frame'&&it.props.material==='6061-T6'&&it.props.old_rev==='C'&&it.props.imported_from==='list'&&it.revs.length===1,'assembly keeps rev C geometry with the released row, not the older obsolete name',{name:it&&it.name,state:row&&row.state,rev:it&&it.props.old_rev,revs:it&&it.revs.length});
const bom=JSON.parse(V.s.flat_bom(it.id));
ok(bom.some(x=>x.name==='Base Plate'&&x.qty===1)&&bom.some(x=>x.name==='Mounting Bracket'&&x.qty===2)&&bom.some(x=>x.number==='FST-101505'&&x.qty===4),'BOM quantities match the STEP planner',bom.map(x=>x.number+':'+x.name+':'+x.qty));
const pl=V.item('PLT-7');
ok(pl&&pl.props.material==='Al 6061'&&pl.props.envelope_in&&pl.category==='Machined'&&pl.props.old_rev==='B','plate keeps CSV material and category and the parser envelope',{mat:pl&&pl.props.material,cat:pl&&pl.category,env:pl&&pl.props.envelope_in});
let tb=null;try{const r=await I.pdfText(new Uint8Array(pdf),{scan:false,pages:1});tb=I.titleBlock(r.text,r.boxes);}catch(e){tb={err:e.message};}
ok(tb&&tb.number==='7731-A2'&&tb.rev==='C'&&/gearbox cover/i.test(tb.title),'text-layer PDF title block is deterministic',tb);
const nItems=V.rows().length,revs=it.revs.length;
const t2=Date.now();
const again=await I.apply(V.ctx,g1);
const reMs=Date.now()-t2;
const it2=V.item('500-100');
ok(again.every(x=>x.err||x.added===0)&&it2.revs.length===revs&&V.rows().length===nItems,'applying the same plan again adds no revision and no item',{added:again.map(x=>({n:x.number||x.name,added:x.added,err:x.err&&x.err.slice(0,50)})),revs:it2.revs.length,items:V.rows().length,before:nItems,ms:reMs});
const read2=await I.read(files());
const g2=I.plan(read2.files,read2.rows,n=>{const r=V.rows().find(y=>y.number===n);return r?r.id:null;});
const third=await I.apply(V.ctx,g2);
ok(third.filter(x=>!x.err).every(x=>x.added===0)&&V.item('500-100').revs.length===1,'a fresh plan of the same folder also adds nothing',third.map(x=>({n:x.number||x.name,added:x.added,err:x.err&&x.err.slice(0,60)})));
console.log('TIMINGS read+plan+apply first batch '+applyMs+' ms, reimport '+(Date.now()-t0)+' ms wall');
console.log(fail?fail+' FAILED':'ALL PASS');
process.exit(fail?1:0);
