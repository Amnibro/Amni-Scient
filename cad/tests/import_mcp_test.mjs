import fs from 'node:fs';import path from 'node:path';import {startE2E} from './e2e_lib.mjs';
let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const FX=new URL('./fixtures/',import.meta.url).pathname,E=await startE2E({web:+process.env.E2E_WEB||18737,mcp:+process.env.E2E_MCP||18738});
const imp=async a=>{const r=await E.call('import_file',a);return r.isError?{err:r.content[0].text}:E.T(r);},fresh=()=>E.call('apply_actions',{actions:[{new:true}]}),feats=()=>E.page.evaluate(()=>window.amnicad.API.doc.features.map(f=>f.type+':'+(f.fmt||'')));
try{const t=(await E.rpc('tools/list',{})).result.tools.find(x=>x.name==='import_file');ok(t&&['path','url','text','name','as'].every(k=>t.inputSchema.properties[k]),'MCP lists import_file with path, url, text, name and as');
  await fresh();const a=await imp({path:FX+'gantry_plate.step'});ok(a.as==='part'&&!a.err&&!(a.errors||[]).length,'a STEP part by path becomes an Import feature',JSON.stringify(a).slice(0,160));
  const f1=await feats();ok(f1.length===1&&f1[0]==='import:step','the design holds one STEP import',f1.join());
  const b=await imp({path:FX+'gantry_asm.step'});ok(b.as==='assembly'&&b.parts>=2&&b.comps>=2,'a STEP assembly by path opens as an assembly',JSON.stringify({as:b.as,parts:b.parts,comps:b.comps,err:b.err}));
  ok(await E.page.evaluate(()=>window.amnicad.API.ws)==='asm','the page switches to the Assembly workspace');
  await fresh();const c=await imp({path:FX+'gantry_asm.step',as:'part'});ok(c.as==='part'&&(await feats()).length===1,'as part loads an assembly file as one Import feature',c.err);
  await fresh();const d=await imp({text:fs.readFileSync(FX+'gantry_plate.step','utf8'),name:'plate.step'});ok(d.as==='part'&&d.imported==='plate.step','STEP text with a name loads',d.err);
  const ex=await E.call('export',{format:'amnicad'}),doc=ex.content[1].resource.text;await fresh();const e=await imp({text:doc,name:'saved.amnicad'});ok(e.as==='document'&&(await feats()).join()==='import:step','an .amnicad document replaces the design',JSON.stringify(e).slice(0,120));
  const u=await imp({url:`http://127.0.0.1:${E.web}/cad/tests/fixtures/gantry_plate.step`});ok(u.as==='part'&&u.imported==='gantry_plate.step','a STEP file by url loads, named from the address',u.err);
  const stl=path.join(E.dir,'tet.stl');fs.writeFileSync(stl,'solid t\n'+[[[0,0,0],[1,0,0],[0,1,0]],[[0,0,0],[0,0,1],[1,0,0]],[[0,0,0],[0,1,0],[0,0,1]],[[1,0,0],[0,0,1],[0,1,0]]].map(f=>' facet normal 0 0 0\n  outer loop\n'+f.map(v=>'   vertex '+v.join(' ')).join('\n')+'\n  endloop\n endfacet').join('\n')+'\nendsolid t\n');
  const m=await imp({path:'tet.stl'});ok(m.as==='mesh'&&m.meshes===1&&m.workspace==='form','an STL mesh by relative path goes into Form',JSON.stringify(m).slice(0,160));
  fs.writeFileSync(path.join(E.dir,'notes.txt'),'hello');const bad=[[{path:'notes.txt'},/Amni-CAD loads step/],[{path:'nope.step'},/There is no file at/],[{path:FX},/Amni-CAD loads/],[{text:'ISO-10303-21;'},/Give the file name with its type/],[{name:'x.step'},/Give the file as path, url or text/],[{text:'',name:'x.step'},/is empty/],[{url:`http://127.0.0.1:${E.web}/cad/tests/fixtures/missing.step`},/could not download.*HTTP 404/],[{text:'not json',name:'x.amnicad'},/not an Amni-CAD document/]];
  for(const[a2,re]of bad){const r=await imp(a2);ok(r.err&&re.test(r.err),'refused: '+JSON.stringify(a2).slice(0,60),r.err&&r.err.slice(0,90));}
  ok(!E.errs.length,'no page errors',E.errs.join(' | ').slice(0,200));
}catch(e){fail++;console.log('FAIL '+e.stack);}finally{await E.close();}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
