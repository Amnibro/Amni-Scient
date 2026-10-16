import{spawn}from'node:child_process';
import net from'node:net';
import crypto from'node:crypto';
import fs from'node:fs';
import os from'node:os';
import path from'node:path';
import assert from'node:assert/strict';
const PORT=41790,DIR=fs.mkdtempSync(path.join(os.tmpdir(),'amnicad-bridge-')),SRV=new URL('../mcp/amnicad-mcp.mjs',import.meta.url).pathname,sleep=t=>new Promise(r=>setTimeout(r,t));
const ch=spawn(process.execPath,[SRV],{cwd:DIR,env:{...process.env,AMNICAD_PORT:String(PORT),AMNICAD_PORT_SPAN:'1',AMNICAD_CONFIG:path.join(DIR,'cfg')},stdio:['pipe','pipe','pipe']});
let errLog='';ch.stderr.on('data',d=>errLog+=d);
let rid=0,lbuf='';const waiters=new Map(),notes=[];
ch.stdout.on('data',d=>{lbuf+=d;let i;while((i=lbuf.indexOf('\n'))>=0){const l=lbuf.slice(0,i);lbuf=lbuf.slice(i+1);const m=JSON.parse(l);if(m.id!=null&&waiters.has(m.id)){waiters.get(m.id)(m);waiters.delete(m.id);}else notes.push(m);}});
const rpc=(method,params)=>new Promise(r=>{const id=++rid;waiters.set(id,r);ch.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});
const call=async(name,args={})=>(await rpc('tools/call',{name,arguments:args})).result;
const T=r=>JSON.parse(r.content[0].text);
function wsConnect({origin='http://127.0.0.1:8943',host='127.0.0.1:'+PORT}={}){return new Promise((res,rej)=>{const s=net.connect(PORT,'127.0.0.1'),key=crypto.randomBytes(16).toString('base64');let buf=Buffer.alloc(0),open=false,parts=[];const c={msgs:[],waits:[],closed:false,pongs:0,s,
    sendRaw(op,p,fin=true){const mask=crypto.randomBytes(4),n=p.length,h=n<126?Buffer.from([(fin?0x80:0)|op,0x80|n]):n<65536?Buffer.from([(fin?0x80:0)|op,0x80|126,n>>8,n&255]):Buffer.alloc(10);if(n>=65536){h[0]=(fin?0x80:0)|op;h[1]=0x80|127;h.writeBigUInt64BE(BigInt(n),2);}const q=Buffer.from(p);for(let i=0;i<n;i++)q[i]^=mask[i&3];s.write(Buffer.concat([h,mask,q]));},
    send(o,frag=0){const b=Buffer.from(JSON.stringify(o));if(!frag)return c.sendRaw(1,b);for(let i=0;i<b.length;i+=frag){c.sendRaw(i?0:1,b.subarray(i,i+frag),i+frag>=b.length);if(i===0)c.sendRaw(9,Buffer.from('hi'));}},
    next(pred=()=>true,ms=5000){const i=c.msgs.findIndex(pred);if(i>=0)return Promise.resolve(c.msgs.splice(i,1)[0]);return new Promise((ok,no)=>{const w={pred,ok};c.waits.push(w);setTimeout(()=>{c.waits=c.waits.filter(x=>x!==w);no(new Error('ws wait timeout'));},ms);});},
    close(){c.sendRaw(8,Buffer.from([3,232]));s.end();}};
  s.on('connect',()=>s.write('GET / HTTP/1.1\r\nHost: '+host+'\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: '+key+'\r\nSec-WebSocket-Version: 13\r\nOrigin: '+origin+'\r\n\r\n'));
  s.on('data',d=>{buf=Buffer.concat([buf,d]);if(!open){const i=buf.indexOf('\r\n\r\n');if(i<0)return;const head=buf.subarray(0,i).toString();buf=buf.subarray(i+4);if(!/^HTTP\/1\.1 101/.test(head)){s.destroy();return res({rejected:head.split('\r\n')[0]});}assert.equal(/Sec-WebSocket-Accept: (\S+)/.exec(head)[1],crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64'));open=true;res(c);}
    while(buf.length>=2){const fin=buf[0]&0x80,op=buf[0]&15;let n=buf[1]&127,o=2;assert.equal(buf[1]&0x80,0);if(n===126){if(buf.length<4)return;n=buf.readUInt16BE(2);o=4;}else if(n===127){if(buf.length<10)return;n=Number(buf.readBigUInt64BE(2));o=10;}if(buf.length<o+n)return;const p=buf.subarray(o,o+n);buf=buf.subarray(o+n);if(op===9){c.sendRaw(10,p);continue;}if(op===10){c.pongs++;continue;}if(op===8){c.closed=true;c.closeCode=n>=2?p.readUInt16BE(0):0;continue;}parts.push(p);if(op===0)c.frags=(c.frags||0)+1;if(fin){const m=JSON.parse(Buffer.concat(parts).toString());parts=[];const w=c.waits.find(x=>x.pred(m));if(w){c.waits=c.waits.filter(x=>x!==w);w.ok(m);}else c.msgs.push(m);}}});
  s.on('close',()=>{c.closed=true;});s.on('error',rej);});}
const res=[];const ok=(n,v=true)=>{res.push(n);console.log('ok',n,v===true?'':v);};
try{
  const init=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'bridge-test',version:'1'}});assert.equal(init.result.protocolVersion,'2025-06-18');assert.equal(init.result.serverInfo.name,'amnicad');ok('initialize echoes protocol');
  const init2=await rpc('initialize',{protocolVersion:'1999-01-01',capabilities:{},clientInfo:{name:'bridge-test',version:'1'}});assert.equal(init2.result.protocolVersion,'2025-11-25');ok('unknown protocol → latest');
  ch.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
  const tl=await rpc('tools/list',{});const names=tl.result.tools.map(t=>t.name);for(const n of['connection_status','get_design_language','get_state','apply_actions','list_templates','load_template','screenshot','run_stress','run_flow','run_injection_molding','export','undo','redo','list_references','get_reference','add_reference_note'])assert.ok(names.includes(n),n);assert.ok(tl.result.tools.every(t=>t.inputSchema.type==='object'&&t.description.length>30));ok('tools/list',names.length+' tools');
  assert.equal((await rpc('nope/x',{})).error.code,-32601);ok('unknown method error');
  const t0=Date.now(),np=await call('get_state');assert.equal(np.isError,true);assert.match(np.content[0].text,/No Amni-CAD page is connected[\s\S]*pairing code|type \d{6}/);ok('no page → helpful error',(Date.now()-t0)+' ms');
  const cs=T(await call('connection_status'));assert.equal(cs.connected,false);assert.match(cs.pairing_code,/^\d{6}$/);const code=cs.pairing_code;ok('connection_status gives code');
  assert.match((await wsConnect({origin:'https://evil.example'})).rejected,/403/);ok('bad origin rejected');
  assert.match((await wsConnect({origin:'null'})).rejected,/403/);ok('null origin rejected');
  assert.match((await wsConnect({host:'evil.example:'+PORT})).rejected,/421/);ok('bad host (DNS rebinding) rejected');
  const g=await wsConnect();g.send({t:'hello',v:1,app:'amnicad'});assert.equal((await g.next()).t,'need-code');g.send({t:'pair',code:code==='000000'?'111111':'000000'});assert.match((await g.next()).reason,/did not match/);
  g.send({t:'req',id:1,method:'x'});assert.ok(T(await call('connection_status')).connected===false);ok('unpaired page cannot act');
  g.send({t:'pair',code});const wel=await g.next();assert.equal(wel.t,'welcome');assert.ok(wel.token.length>=40);assert.equal(wel.client.name,'bridge-test');const tok=wel.token;ok('pairing → token');
  assert.notEqual(T(await call('connection_status')).pairing_code,code);ok('code is single-use');
  const serve=(c,fn)=>{(async()=>{while(!c.closed){let m;try{m=await c.next(x=>x.t==='req',600000);}catch{return;}const r=await fn(m);if(r!==undefined)c.send({t:'res',id:m.id,...r},r.frag);}})();};
  const big=crypto.randomBytes(1536*1024).toString('base64');
  serve(g,async m=>m.method==='get_state'?{ok:true,result:{name:'Test',features:[{id:'f1'}]}}:m.method==='screenshot'?{ok:true,result:{b64:big,width:800,height:600,view:m.params.view},frag:512*1024}:m.method==='apply_actions'?{ok:true,result:{gotBytes:JSON.stringify(m.params).length,n:m.params.actions.length}}:m.method==='export'?{ok:true,result:{name:'part.step',ext:'step',mime:'model/step',b64:Buffer.from('ISO-10303-21;').toString('base64'),bytes:13,text:true}}:m.method==='get_design_language'?{ok:true,result:{text:'REF'}}:m.method==='get_reference'?{ok:true,result:{b64:Buffer.from('JPEGDATA').toString('base64'),mime:'image/jpeg',bytes:8,id:m.params.id,page:m.params.page||1,pages:2,note:'top view, units inches',text:'@1.00,1.00 4.00'}}:m.method==='slow'?undefined:{ok:false,error:'boom '+m.method});
  const gs=T(await call('get_state'));assert.equal(gs.name,'Test');ok('get_state round trip');
  const sc=await call('screenshot',{view:'iso'});assert.equal(sc.content[0].type,'image');assert.equal(sc.content[0].data.length,big.length);assert.equal(sc.content[0].data,big);ok('2 MB fragmented page→server message (with ping mid-message)',(big.length/1048576).toFixed(2)+' MB');
  const acts=Array.from({length:40000},(_,i)=>({param:{name:'p'+i,expr:String(i*1.2345678901234)}}));const aa=T(await call('apply_actions',{actions:acts}));assert.equal(aa.n,40000);assert.ok(aa.gotBytes>2*1048576);assert.ok(g.frags>=1);ok('large server→page message fragmented',(aa.gotBytes/1048576).toFixed(2)+' MB, '+g.frags+' continuation frames');
  const gr=await call('get_reference',{id:'r1',page:2});assert.equal(gr.content[0].type,'image');assert.equal(gr.content[0].mimeType,'image/jpeg');assert.equal(Buffer.from(gr.content[0].data,'base64').toString(),'JPEGDATA');const grt=T({content:[gr.content[1]]});assert.equal(grt.page,2);assert.equal(grt.note,'top view, units inches');assert.ok(!('b64' in grt)&&!('mime' in grt));ok('get_reference → image content + note');
  assert.match((await call('get_design_language')).content[0].text,/apply_actions[\s\S]*REF/);ok('design language wraps page text');
  const er=await call('list_templates');assert.equal(er.isError,true);assert.match(er.content[0].text,/boom list_templates/);ok('page error → isError');
  const ex=await call('export',{format:'step',path:'out/part.step'});assert.equal(T(ex).bytes,13);assert.equal(fs.readFileSync(path.join(DIR,'out/part.step'),'utf8'),'ISO-10303-21;');ok('export writes inside cwd');
  assert.match((await call('export',{format:'step',path:'out/part.step'})).content[0].text,/already exists/);ok('no silent overwrite');
  assert.match((await call('export',{format:'step',path:'../escape.step'})).content[0].text,/must stay inside/);assert.ok(!fs.existsSync(path.join(DIR,'../escape.step')));ok('relative path escape refused');
  const exd=await call('export',{format:'step',path:'out/'});assert.ok(fs.existsSync(path.join(DIR,'out/part.step')));const exr=await call('export',{format:'step'});assert.equal(exr.content[1].type,'resource');assert.equal(exr.content[1].resource.text,'ISO-10303-21;');ok('export without path → embedded resource');
  const g2=await wsConnect({origin:'http://localhost:9999'});g2.send({t:'hello',v:1,app:'amnicad',token:tok});assert.equal((await g2.next()).t,'need-code');g2.close();ok('token bound to origin');
  const g3=await wsConnect();g3.send({t:'hello',v:1,app:'amnicad',token:tok});assert.equal((await g3.next()).t,'welcome');const bye=await g.next(m=>m.t==='bye');assert.match(bye.reason,/Another/);await sleep(100);assert.ok(g.closed);ok('newest page wins, old page told');
  serve(g3,async m=>m.method==='get_state'?{ok:true,result:{name:'Third'}}:undefined);assert.equal(T(await call('get_state')).name,'Third');
  const pr=call('run_stress',{});await sleep(150);g3.close();const prr=await pr;assert.equal(prr.isError,true);assert.match(prr.content[0].text,/disconnected/);ok('in-flight call fails cleanly on disconnect');
  const cfg=JSON.parse(fs.readFileSync(path.join(DIR,'cfg/bridge-tokens.json'),'utf8'));assert.ok(!JSON.stringify(cfg).includes(tok));assert.equal((fs.statSync(path.join(DIR,'cfg/bridge-tokens.json')).mode&0o777),0o600);ok('only token hashes stored, mode 600');
  const c0=T(await call('connection_status')).pairing_code,g4=await wsConnect();g4.send({t:'hello',v:1,app:'amnicad'});await g4.next();for(let i=0;i<5;i++){g4.send({t:'pair',code:String((+c0+1+i)%1e6).padStart(6,'0')});await g4.next();}const c1=T(await call('connection_status')).pairing_code;assert.notEqual(c1,c0);g4.send({t:'pair',code:c1});assert.match((await g4.next()).reason,/Too many/);g4.close();ok('5 wrong codes → new code + 60 s lockout');
  const unk=await call('bogus_tool');assert.equal(unk.isError,true);ok('unknown tool');
  console.log('\nALL',res.length,'PASS');
}catch(e){console.error('FAIL',e);console.error(errLog);process.exitCode=1;}finally{ch.kill();fs.rmSync(DIR,{recursive:true,force:true});setTimeout(()=>process.exit(),100);}
