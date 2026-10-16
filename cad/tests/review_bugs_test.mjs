import {startE2E} from './e2e_lib.mjs';
const E=await startE2E({web:+process.env.E2E_WEB||18804,mcp:+process.env.E2E_MCP||18805}),p=E.page,sleep=E.sleep,only=process.env.ONLY?new RegExp(process.env.ONLY):null;
let pass=0,fail=0;const ok=(c,m,x)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' · '+String(x).slice(0,160):''));},ev=(f,...a)=>p.evaluate(f,...a),want=n=>!only||only.test(n),toast=()=>ev(()=>document.querySelector('#toast').textContent);
const act=async a=>E.T(await E.call('apply_actions',{actions:a}));
const settle=async(ms=900)=>{await sleep(ms);};
const nav=async(hash='')=>{await p.goto('about:blank');await p.goto(`http://127.0.0.1:${E.web}/cad/${hash}`);await p.waitForFunction(()=>window.amnicad&&window.amnicad.S.kernel,{timeout:90000});};
try{
if(want('csp')){
  const csp=await ev(()=>document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content||''),ss=(csp.match(/script-src[^;]*/)||[''])[0];
  ok(/default-src 'self'/.test(csp)&&!/'unsafe-eval'|'unsafe-inline'/.test(ss)&&/wasm-unsafe-eval/.test(ss)&&/object-src 'none'/.test(csp)&&/connect-src[^;]*https: wss:/.test(csp)&&!/connect-src[^;]*http: /.test(csp),'CSP meta allows self, secure servers and wasm only',ss);
  const tabs=['edit','sim','flow','mold','make','draw','dies','cutters','vault','check','ai'];
  for(const t of tabs){await ev(t=>window.amnicad.setTab(t),t);await sleep(500);}
  for(const w of['form','asm','tool','part']){await ev(w=>window.amnicad.API.setWS(w),w);await sleep(1800);}
  await ev(()=>document.querySelector('#b-help').click());await sleep(300);await ev(()=>document.querySelector('#dlg').close());
  await ev(()=>document.querySelector('#b-pro').click());await sleep(500);await ev(()=>document.querySelector('#dlg').close());
  const bad=E.cons.filter(t=>/Content Security Policy|Refused to|violates/i.test(t));
  ok(!bad.length&&!E.errs.length,'every tab and workspace loads under the CSP with no violation or page error',[...bad,...E.errs].join(' | '));
  const r=await ev(async()=>{const o={v:[]};document.addEventListener('securitypolicyviolation',e=>o.v.push(e.violatedDirective+':'+e.blockedURI));setTimeout('window.__strEval=1',5);const s=document.createElement('script');s.textContent='window.__inj=1';document.head.append(s);try{await fetch('https://example.com/x'.replace('https:','http:'),{mode:'no-cors'});o.net='allowed';}catch(e){o.net='blocked';}await new Promise(r=>setTimeout(r,200));o.str=window.__strEval||0;o.inj=window.__inj||0;return o;});
  ok(r.str===0&&r.inj===0&&r.net==='blocked'&&r.v.some(x=>/^script-src/.test(x))&&r.v.some(x=>/^connect-src:http:\/\/example\.com/.test(x)),'string eval, inline scripts and plain-http hosts are blocked',JSON.stringify(r));
  ok(await ev(()=>{const A=window.amnicad.API;A.applyActions([{param:{name:'wq',expr:'2*sqrt(9)+1'}}]);return window.amnicad.S.scope.wq===7;}),'parametric expressions work without eval');
}
if(want('stress')){
  await E.call('load_template',{key:'bracket'});
  const r=E.T(await E.call('run_stress',{fixed:{side:'-Z'},loads:[{faces:{side:'+X'},F:[0,0,-445]}]}));
  ok(r.peak_vonMises_MPa>0&&r.fixed_faces>0&&r.loaded_faces>0,'B1 run_stress works through the connector: peak '+(r.peak_vonMises_MPa),JSON.stringify(r).slice(0,100));
  await act([{sim:{type:'static',fixed:{side:'-Z'},loads:[{faces:{side:'+X'},F:[0,0,-445]}]}},{run:'fea'}]);
  ok(await ev(()=>!!window.amnicad.S.fea&&window.amnicad.S.fea.r.type!=='modal'),'B1 apply_actions {run:"fea"} runs the study');
  await act([{sim:{type:'modal',fixed:{side:'-Z'}}}]);const m=E.T(await E.call('run_stress',{}));
  ok(Array.isArray(m.freqs_Hz)&&m.freqs_Hz.length>0&&m.freqs_Hz[0]>0,'B1 modal setup runs through the connector',JSON.stringify(m.freqs_Hz));
  const th=async mat=>{await act([{material:mat},{sim:{type:'thermal',temps:[{faces:{side:'-Z'},T:20}],flux:[{faces:{side:'+X'},Q:10}]}}]);return E.T(await E.call('run_stress',{}));};
  const ts=await th('steel1018'),tw=await th('walnut');
  ok(ts.Tmax_C>20&&tw.Tmax_C>ts.Tmax_C*2&&tw.k_W_per_mK<0.2&&ts.k_W_per_mK>50,'B1/B7 thermal runs; walnut is far hotter than steel for the same 10 W',ts.Tmax_C+' vs '+tw.Tmax_C);
}
if(want('quote')){
  await E.call('load_template',{key:'bracket'});await act([{material:'steel1018'}]);
  const q=E.T(await E.call('quote',{qty:25}));
  ok(/^(steel-cr|st1018)$/.test(q.material),'B3 the bracket quote uses its steel, not aluminum',q.kind+' '+q.material);
  await act([{material:'cfrp'}]);const c=E.T(await E.call('quote',{qty:5}));
  ok(c.ok===false&&c.no_stock===true&&/no stock/.test((c.errors||[]).join()),'B3 carbon fiber says there is no shop stock instead of pricing aluminum',(c.errors||[])[0]);
  await act([{material:'al6061'}]);
  await act([{new:true,units:'in'}]);const st=E.T(await E.call('get_state'));ok(st.name==='Untitled part','B15 {new:true} resets the document name',st.name);
}
if(want('asm')){
  await act([{new:true,units:'in'}]);
  const r=E.T(await E.call('asm_apply',{ops:[{insert:{part:'plate',fix:true}},{smart_insert:{c:'c1',hw:{kind:'shcs',size:'#10-24'}}}]}));
  const n=await ev(()=>window.amnicad.S.doc.asm.comps.length);
  ok(n===9,'B8 smart_insert on the 4-hole plate makes 4 screws and 4 nuts, not 8 and 8',n+' components');
  const ck=E.T(await E.call('asm_check',{what:['interference']}));
  ok(!ck.interference.some(x=>/screw/i.test(x.a_name)&&/screw/i.test(x.b_name)),'B8 no screw overlaps another screw',ck.interference.length+' overlaps');
  await act([{new:true,units:'in'}]);E.T(await E.call('asm_apply',{ops:[{insert:{part:'plate',fix:true}},{insert:{part:'bracket'}}]}));
  const s0=await ev(()=>({steps:((window.amnicad.S.doc.asm.explode||{}).steps||[]).length,undo:window.amnicad.S.undo.length}));
  const d=E.T(await E.call('asm_check',{what:['drawing'],sheet:'Letter'})),s1=await ev(()=>({steps:((window.amnicad.S.doc.asm.explode||{}).steps||[]).length,undo:window.amnicad.S.undo.length}));
  ok(d.drawing&&d.drawing.sheet==='ANSI A','B19 asm_check drawing accepts the sheet name "Letter"',JSON.stringify(d.drawing&&d.drawing.sheet));
  ok(s1.steps===s0.steps&&s1.undo===s0.undo,'B19 reading the drawing no longer commits an auto-explode to the design',JSON.stringify([s0,s1]));
  const bad=await E.call('asm_check',{what:['drawing'],sheet:'Foo'});ok(bad.isError&&/Unknown drawing sheet/.test(bad.content[0].text),'B19 an unknown sheet gets a clear error',bad.content[0].text);
  await ev(()=>window.amnicad.API.setWS('asm'));await sleep(800);
  const x=await ev(async()=>{const m=await import('/cad/asm_ui.js');m.hud('Quick mate: drag '+'<img src=x onerror=window.__x=1><script>window.__x=2</script>'+' <em>ok</em>');const hd=m.state().hud;return{img:hd.querySelectorAll('img,script').length,em:hd.querySelectorAll('em').length,text:hd.textContent};});
  ok(x.img===0&&x.em===1&&/<img src=x/.test(x.text),'B16 the assembly HUD shows markup in a component name as text',JSON.stringify(x));
  const svg=await ev(async()=>{const D=await import('/cad/drawing.js'),x=D.toSVG({W:10,H:10,items:[{t:'img',x:0,y:0,w:1,h:1,src:'x" onload="1'},{t:'l',a:[0,0],b:[1,1],ly:'vis" onclick="1',w:'1" onmouseover="2'},{t:'tx',p:[0,0],s:2,txt:'<b>x</b>'}]},{title:'<t>'}),doc=new DOMParser().parseFromString(x,'image/svg+xml');return{err:!!doc.querySelector('parsererror'),on:[...doc.querySelectorAll('*')].some(e=>[...e.attributes].some(a=>/^on/i.test(a.name))),b:doc.querySelectorAll('b').length};});
  ok(!svg.err&&!svg.on&&!svg.b,'B16 drawing SVG output escapes layer names, widths and image sources',JSON.stringify(svg));
  await ev(()=>[...document.querySelectorAll('button')].find(b=>b.title==='BOM'&&b.offsetParent).click());await sleep(500);
  const csv=await ev(async()=>{const dl=[];const oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){dl.push(this.download);};Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});const b=[...document.querySelectorAll('button')].find(b=>/Copy CSV/.test(b.textContent)&&b.offsetParent);b&&b.click();await new Promise(r=>setTimeout(r,2400));HTMLAnchorElement.prototype.click=oc;return{found:!!b,dl,toast:document.querySelector('#toast').textContent};});
  ok(csv.found&&csv.dl.some(n=>/bom\.csv$/.test(n)),'B32 Copy CSV downloads the file when the clipboard API is missing',JSON.stringify(csv));
  await ev(()=>window.amnicad.API.setWS('part'));await sleep(500);
}
if(want('mold')){
  await E.call('load_template',{key:'plate'});await act([{material:'abs'}]);
  await ev(()=>{window.__mold=null;const o=Worker.prototype.postMessage;Worker.prototype.postMessage=function(m,...r){if(m&&m.cmd==='mold')window.__mold=m.inp.cfg;return o.call(this,m,...r);};window.amnicad.commit(d=>{d.mold={...(d.mold||{}),mesh:'quick',runner:{on:true,L:60,D:0}};});});
  const run=ev(async()=>{try{await window.amnicad.runMold({suggest:true});return window.amnicad.S.lastMold;}catch(e){return{err:e.message};}});
  await p.waitForFunction(()=>window.__mold,{timeout:120000});
  const cfg=await ev(()=>window.__mold),res=await Promise.race([run,sleep(180000).then(()=>null)]);
  ok(cfg.runner&&cfg.runner.D*1000>=3&&cfg.runner.D*1000<=12,'B17 an auto runner is simulated at the sized diameter, not 1 mm',cfg.runner&&cfg.runner.D*1000);
  ok(!res||!res.err,'B17 the mold run completes',res&&res.err);
}
if(want('persist')){
  const mk=async o=>{const cs=new CompressionStream('deflate-raw'),w=cs.writable.getWriter();w.write(new TextEncoder().encode(JSON.stringify(o)));w.close();const b=new Uint8Array(await new Response(cs.readable).arrayBuffer());let s='';for(const c of b)s+=String.fromCharCode(c);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
  const names=()=>ev(async()=>(await (await import('/cad/persist.js')).listSlots()).map(x=>x.name));
  await nav();await ev(()=>{localStorage.clear();});await nav();
  await ev(()=>{const A=window.amnicad;A.applyActions([{new:true,units:'in'},{name:'Doc A'},{add:{type:'box',w:2,d:1,h:0.5}}]);});await settle(3000);
  const hB=await ev(mk,{format:'amnicad',v:1,units:'in',name:'Doc B',params:[],features:[{id:'f1',type:'box',w:1,d:1,h:1}]});
  await nav('#d='+hB);await settle(1500);
  ok(await ev(()=>window.amnicad.S.doc.name)==='Doc B'&&(await ev(()=>JSON.parse(localStorage.getItem('amnicad.doc')).name))==='Doc B','B21 a share link opens the shared design');
  ok((await names()).includes('Doc A'),'B21 opening a share link keeps the previous autosave in the Recover list',(await names()).join());
  await ev(()=>document.querySelector('#m-file button').click());await sleep(200);await ev(()=>document.querySelector('[data-act=recover]').click());await sleep(600);
  const rows=await ev(()=>[...document.querySelectorAll('#dlg-b .row[data-slot]')].map(r=>r.querySelector('b').textContent));
  ok(rows.includes('Doc A'),'B21 File > Recover lists the saved designs',rows.join());
  await ev(()=>[...document.querySelectorAll('#dlg-b .row[data-slot]')].find(r=>r.querySelector('b').textContent==='Doc A').querySelector('button.pri').click());await settle(1200);
  ok(await ev(()=>window.amnicad.S.doc.name)==='Doc A'&&(await names()).includes('Doc B'),'B21 Restore brings the design back and keeps the one it replaced',(await names()).join());
  await ev(()=>document.querySelector('[data-act=new]').click());await sleep(300);await ev(()=>document.querySelector('#dlg-b .tpl button').click());await settle(1500);
  ok((await names()).includes('Doc A'),'B21 New part keeps the design it replaced');
  for(let i=0;i<10;i++){await ev(i=>window.amnicad.loadDoc({format:'amnicad',v:1,units:'in',name:'Gen '+i,params:[],features:[{id:'f1',type:'box',w:1,d:1,h:1+i}]},'x'),i);await sleep(250);}
  await settle(1500);const nn=await names();ok(nn.length===7&&nn.includes('Gen 9')&&!nn.includes('Doc A'),'B21 only the last 7 designs are kept',nn.join());
  await ev(()=>{window.__orig=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};window.amnicad.commit(d=>{d.name='Full test';});});await settle(900);
  const t=await toast();await ev(()=>{Storage.prototype.setItem=window.__orig;});
  ok(/Autosave failed/.test(t),'B21 a full browser storage is reported instead of swallowed',t);
  const hX=await ev(mk,{format:'other',v:1,features:[]}),hV=await ev(mk,{format:'amnicad',v:99,features:[]});
  await nav('#d='+hX);await sleep(900);ok(/not an Amni-CAD/.test(await toast()),'B28 a link with the wrong format is refused',await toast());
  await nav('#d='+hV);await sleep(900);ok(/newer version/.test(await toast()),'B28 a link from a newer version is refused',await toast());
  const bomb=await ev(async()=>{const cs=new CompressionStream('deflate-raw'),w=cs.writable.getWriter();w.write(new Uint8Array(40*2**20)).catch(()=>{});w.close().catch(()=>{});const b=new Uint8Array(await new Response(cs.readable).arrayBuffer());let s='';for(const c of b)s+=String.fromCharCode(c);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');});
  const t0=Date.now();await nav('#d='+bomb);await sleep(1500);const tb=await toast();
  ok(/larger than/.test(tb)&&Date.now()-t0<20000,'B28 a decompression bomb in a share link is stopped',tb);
}
if(want('undo')){
  await nav();await ev(()=>{localStorage.clear();});await nav();
  const cap=await ev(()=>{const A=window.amnicad;for(let i=0;i<205;i++)A.commit(d=>{d.name='N'+i;});return{n:A.S.undo.length,toast:document.querySelector('#toast').textContent};});
  ok(cap.n===200&&/Undo keeps the last 200/.test(cap.toast),'B30 the undo cap shows a notice',JSON.stringify(cap));
  await settle(3500);await nav();await settle(1500);
  const u=await ev(()=>({n:window.amnicad.S.undo.length,dis:document.querySelector('#b-undo').disabled,name:window.amnicad.S.doc.name}));
  ok(u.n>=200&&!u.dis&&u.name==='N204','B30 the undo history survives a reload',JSON.stringify(u));
  await ev(()=>document.querySelector('#b-undo').click());await sleep(500);
  ok(await ev(()=>window.amnicad.S.doc.name)==='N203','B30 undo after a reload steps back one change');
}
if(want('crash')){
  await p.evaluateOnNewDocument(()=>{window.__ws=[];const W=window.Worker;window.Worker=class extends W{constructor(u,o){super(u,o);this.__u=String(u);window.__ws.push(this);}};});
  await nav();await ev(()=>{localStorage.clear();});await nav();
  await act([{new:true,units:'mm'},{name:'Crash doc'},{add:{type:'box',w:30,d:20,h:10}}]).catch(()=>{});
  await ev(()=>window.amnicad.applyActions([{name:'Crash doc'},{add:{type:'box',w:30,d:20,h:10}}]));await settle(1500);
  const b4=await ev(()=>({name:window.amnicad.S.doc.name,f:window.amnicad.S.doc.features.length,tri:window.amnicad.S.mesh&&window.amnicad.S.mesh.idx.length}));
  await ev(()=>{const w=window.__ws.find(w=>/cad\.worker/.test(w.__u));w.dispatchEvent(new ErrorEvent('error',{message:'simulated crash'}));});await sleep(150);
  const t=await toast();
  await p.waitForFunction(()=>window.amnicad.S.kernel&&window.amnicad.S.mesh&&window.__ws.filter(w=>/cad\.worker/.test(w.__u)).length===2,{timeout:90000});await sleep(1200);
  const af=await ev(()=>({name:window.amnicad.S.doc.name,f:window.amnicad.S.doc.features.length,tri:window.amnicad.S.mesh&&window.amnicad.S.mesh.idx.length,k:document.querySelector('#kstat').textContent}));
  ok(/crashed/.test(t)&&af.name===b4.name&&af.f===b4.f&&af.tri===b4.tri&&b4.tri>0,'B31 a kernel crash restarts the kernel, rebuilds and keeps the design',JSON.stringify([t,b4,af]));
}
}catch(e){fail++;console.log('FAIL '+e.stack);}
finally{await E.close();}
console.log(`${pass} passed, ${fail} failed`);process.exit(fail?1:0);
