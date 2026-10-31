// Customer quote widget (quote.html / quote-embed.js) in a real browser: DXF and STEP parts, shop link rules, branding licence, request sending, embed sizing.
// Needs Chrome and Playwright: PLAYWRIGHT=<dir with node_modules/playwright> CHROME=/usr/bin/google-chrome node cad/tests/quote_ui_test.mjs [shotsDir]
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {createRequire} from 'node:module';
import * as SL from '../shoplink.js';import {testRoot} from './testkey.mjs';
const root=path.resolve(new URL('../..',import.meta.url).pathname),{chromium}=createRequire(path.join(process.env.PLAYWRIGHT||process.cwd(),'x.js'))('playwright'),SHOTS=process.argv[2]||'',sleep=t=>new Promise(r=>setTimeout(r,t));
let fail=0;const ok=(c,m)=>{c||fail++;console.log(c?'PASS':'FAIL',m);};
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const K=await testRoot('t1'),KEY=await K.token({id:'b1',name:'Acme',feat:['brand'],sub:'s1'}),PROKEY=await K.token({id:'p1',name:'Acme',feat:['*'],sub:'s2'});
const srv=http.createServer((q,r)=>{const u=new URL(q.url,'http://x');if(u.pathname==='/cad/pro_keys.json'){r.writeHead(200,{'content-type':'application/json'});return r.end(JSON.stringify(K.keys));}
  const f=path.join(root,decodeURIComponent(u.pathname));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
  r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream','cross-origin-opener-policy':'same-origin','cross-origin-embedder-policy':'credentialless'});fs.createReadStream(f).pipe(r);}).listen(0,'127.0.0.1');
await new Promise(r=>srv.on('listening',r));const BASE='http://127.0.0.1:'+srv.address().port+'/cad/';
const posts=[],shop=http.createServer((q,r)=>{const H={'access-control-allow-origin':'*','access-control-allow-headers':'content-type'};if(q.method==='OPTIONS'){r.writeHead(204,H);return r.end();}
  if(q.url==='/host.html'){r.writeHead(200,{'content-type':'text/html'});return r.end(HOST);}let b='';q.on('data',d=>b+=d);q.on('end',()=>{posts.push({url:q.url,type:q.headers['content-type'],body:b});r.writeHead(200,{...H,'content-type':'application/json'});r.end('{"ok":true}');});}).listen(0,'127.0.0.1');
await new Promise(r=>shop.on('listening',r));const SHOP='http://localhost:'+shop.address().port;
const DXF=path.join(root,'assets/cad/shop/mounting-plate-flat.dxf'),STEP=path.join(root,'cad/tests/fixtures/gantry_plate.step'),ASM=path.join(root,'cad/tests/fixtures/gantry_asm.step');
const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function page(hash='',{w=1200,h=900}={}){const c=await b.newContext({viewport:{width:w,height:h},acceptDownloads:true}),p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto(BASE+'quote.html'+hash);await p.waitForSelector('#q-drop',{timeout:60000});return p;}
const S=(p,f)=>p.evaluate(f);
async function load(p,f){await p.setInputFiles('#q-file',f);await p.waitForFunction(n=>{const s=window.__quote;return s.file&&s.file.name===n&&!s.busy&&(s.r||s.err);},path.basename(f),{timeout:120000});await sleep(150);}
const num=t=>+String(t).replace(/[^0-9.]/g,'');
const shot=async(p,n,o={})=>SHOTS&&p.screenshot({path:path.join(SHOTS,n),fullPage:true,...o});

// 1. Default rates, flat DXF
{const p=await page();ok(await p.textContent('.hd .nm')==='Instant quote','no shop link: neutral title');ok(await p.isVisible('.badge'),'badge shows by default');
 await load(p,DXF);const u1=num(await p.textContent('#q-unit'));ok(u1>0,'DXF prices: '+u1);ok(await p.isVisible('#q-t'),'DXF gets a thickness picker');ok(!(await p.$('#q-bd')),'rate breakdown hidden by default');
 ok(await S(p,()=>window.__quote.r.kind)==='flat sheet','DXF becomes a flat sheet part');
 await p.fill('#q-qty','25');await p.dispatchEvent('#q-qty','change');await p.waitForFunction(()=>!window.__quote.busy&&window.__quote.r&&window.__quote.r.res.qty===25,null,{timeout:30000});const u1b=num(await p.textContent('#q-unit'));
 const opts=await p.$$eval('#q-t option',o=>o.map(x=>x.value));await p.selectOption('#q-t',opts[opts.length-1]);await p.waitForFunction(()=>!window.__quote.busy);await sleep(200);
 const u2=num(await p.textContent('#q-unit'));ok(u2>u1b,'thicker sheet costs more at qty 25: '+u1b+' -> '+u2);
 await p.fill('#q-qty','50');await p.dispatchEvent('#q-qty','change');await p.waitForFunction(()=>!window.__quote.busy&&window.__quote.r&&window.__quote.r.res.qty===50,null,{timeout:30000});
 ok(/for 50/.test(await p.textContent('#q-total')),'quantity 50 quoted');ok(num(await p.textContent('#q-unit'))<u2,'unit price drops at 50');
 const [d]=await Promise.all([p.waitForEvent('download'),p.click('#q-json')]);const J=JSON.parse(fs.readFileSync(await d.path(),'utf8'));
 ok(J.schema==='amnicad.quote-request/1'&&J.quote.qty===50&&J.part.format==='dxf','Download quote gives the request JSON');ok(Math.abs(J.part.size_in[0]-6)<.01&&Math.abs(J.part.size_in[1]-4)<.01,'part size 6 x 4 in');
 ok(!p.errs.length,'no page errors '+p.errs.join('|'));await b.contexts()[0]?.close();}

// 2. Shop link with rules, endpoint, mailto, no licence (paid branding ignored)
const base={name:'Acme Laser',contact:'Dock 4, 12 Main St · (555) 010-2000',email:'quotes@acme.test',
  quoting:{offer:{materials:['al5052','st1018','ss304','al6061'],processes:['laser','cnc3']},markup:{material:{al5052:.1}},order_fee:20,min_total:60,round:{to:.5,mode:'up'},lines:[{name:'Inspection',order:15}],rules:[{name:'Big parts',when:{size_min:5},then:{mult:1.05,note:'Large part handling'}}]},
  widget:{breakdown:true,request:{endpoint:SHOP+'/quote',format:'json',files:true,map:{customer:'contact.name',mail:'contact.email',total:'quote.total',source:'=widget'}}},
  brand:{color:'#2f6fd6',tagline:'Laser and CNC since 1998',footer:'Net 30 for approved accounts.',hide_badge:true}};
{const code=await SL.encode(base),p=await page('#shop='+code);ok(await p.textContent('.hd .nm')==='Acme Laser','shop name in header');
 ok(await p.isVisible('.badge'),'paid branding without a key: badge stays');ok(!/1998/.test(await p.textContent('.hd')),'paid tagline ignored without a key');
 await load(p,DXF);const r=await S(p,()=>window.__quote.r.res);const q=r.quotes.find(x=>x.ok);
 ok(r.quotes.every(x=>['laser','cnc3'].includes(x.process)),'offer limits processes: '+r.quotes.map(x=>x.process));ok(q.total>=60&&Math.round(q.unit*2)===q.unit*2,'min total and round to 0.50: '+q.total);
 ok(q.breakdown.rules>0&&/Inspection/.test(JSON.stringify(q.rules))&&/Big parts/.test(JSON.stringify(q.rules))&&/Large part/.test(JSON.stringify(q.notes)),'rule lines and notes applied');
 ok(await p.isVisible('#q-bd'),'breakdown shown when shop opts in');
 const mats=await p.$$eval('#q-mat option',o=>o.map(x=>x.value).filter(Boolean));ok(mats.every(m=>base.quoting.offer.materials.includes(m)),'material list limited to offer: '+mats);
 await shot(p,'widget-desktop-shop-dxf.png');
 await p.click('#q-send');ok(/name and a valid email/.test(await p.textContent('#q-msg')),'send asks for contact first');
 await p.fill('#q-name','Jo Buyer');await p.fill('#q-email','jo@buyer.test');await p.fill('#q-notes','Need by Friday');
 ok(/with localhost/.test(await p.textContent('#q-consent')),'consent note names the receiving host');
 await p.click('#q-send');await p.waitForFunction(()=>/sent|did not/.test(document.querySelector('#q-msg').textContent),null,{timeout:15000});
 ok(/Request sent to Acme Laser/.test(await p.textContent('#q-msg')),'POST to shop endpoint: '+await p.textContent('#q-msg'));
 const P=posts.length&&JSON.parse(posts[posts.length-1].body);ok(P&&P.customer==='Jo Buyer'&&P.mail==='jo@buyer.test'&&P.source==='widget'&&P.total===q.total,'payload mapping applied');
 ok(P&&P.file&&P.file.name==='mounting-plate-flat.dxf'&&Buffer.from(P.file.base64,'base64').toString().includes('LWPOLYLINE')||P&&P.file&&P.file.base64.length>100,'part file attached when files:true');
 await p.evaluate(()=>{window.__nav=[];HTMLAnchorElement.prototype.click=function(){window.__nav.push(this.href);};});
 if(await p.$('#q-mail')){await p.click('#q-mail');const nav=await p.evaluate(()=>window.__nav);const m=nav.find(u=>u.startsWith('mailto:'));ok(m&&m.startsWith('mailto:quotes%40acme.test?subject=Quote%20request')&&/Jo%20Buyer/.test(m),'mailto draft with summary');ok(nav.some(u=>u.startsWith('blob:')),'quote JSON downloaded alongside mailto');}else ok(false,'Email button present');
 const H=await p.evaluate(()=>JSON.parse(localStorage.getItem('amnicad.quotes')||'[]'));ok(H.length>=2,'requests saved to local history: '+H.length);
 await p.evaluate(()=>{window.print=()=>{};});await p.click('#q-print');await p.emulateMedia({media:'print'});ok(/Acme Laser/.test(await p.textContent('#sheet'))&&/Powered by Amni-CAD/.test(await p.textContent('#sheet')),'print sheet branded, badge kept without key');
 await shot(p,'widget-print-sheet-unlicensed.png');ok(!p.errs.length,'no page errors '+p.errs.join('|'));}

// 3. Licensed branding (test root key with feat brand), STEP solid, phone width
const logo='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#2f6fd6"/><text x="32" y="42" font-size="28" text-anchor="middle" fill="#fff" font-family="sans-serif">A</text></svg>').toString('base64');
const lic={...base,brand:{...base.brand,logo,terms:'Quotes valid 30 days.',key:KEY}};
{const code=await SL.encode(lic),p=await page('#shop='+code);await p.waitForFunction(()=>window.__quote.brand&&window.__quote.brand.paid!==undefined);
 ok(await S(p,()=>window.__quote.brand.paid)===true,'brand key unlocks paid branding');ok(!(await p.$('.badge')),'badge hidden with licence');ok(/1998/.test(await p.textContent('.hd')),'tagline shown');ok(!!(await p.$('.hd img')),'logo shown');
 ok(/2f6fd6/i.test(await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--acc'))),'accent colour applied');
 await load(p,STEP);ok(await S(p,()=>window.__quote.r&&window.__quote.r.kind)==='solid','STEP imports as a solid');ok(num(await p.textContent('#q-unit'))>0,'STEP prices');
 await shot(p,'widget-desktop-branded-step.png');await p.evaluate(()=>{window.print=()=>{};});await p.click('#q-print');const sh=await p.textContent('#sheet');ok(/Quotes valid 30 days/.test(sh)&&!/Powered by/.test(sh),'print sheet has terms, no badge');
 await p.emulateMedia({media:'print'});await shot(p,'widget-print-sheet-branded.png');ok(!p.errs.length,'no page errors '+p.errs.join('|'));}
// 3b. Preview regression: the assembly STEP (base plate, two carriages, four cap screws) once drew with its triangles in reverse depth order, bottom face on top
{const p=await page();await load(p,ASM);const v=await S(p,()=>{const s=window.__quote,m=s.mesh,pv=s.pv,P=m.pos,N=m.nrm,I=m.idx;let down=0,vis=0,hi=0;for(let k=0;k<pv.tid.length;k+=5){const t=pv.tid[k];if(t<0)continue;vis++;let nz=0,zm=-1e9;for(let j=0;j<3;j++){const i=I[3*t+j];nz+=N[3*i+2];zm=Math.max(zm,P[3*i+2]);}nz/3<-.5&&down++;zm>=15.9&&hi++;}return{down,vis,hi};});
 ok(v.vis>1000&&v.down===0,'STEP preview never shows a downward face from above: '+v.down+' of '+v.vis);ok(v.hi>30,'cap screw heads on top are visible: '+v.hi);
 const pl=await page();await load(pl,STEP);const c=await S(pl,()=>{const s=window.__quote,pv=s.pv,P=s.mesh.pos,I=s.mesh.idx,w=pv.w,hh=pv.hh;let x0=w,x1=0,y0=hh,y1=0,n=0,top=0;for(let y=0;y<hh;y++)for(let x=0;x<w;x++){const t=pv.tid[y*w+x];if(t<0)continue;n++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);if(P[3*I[3*t]+2]>11.9&&P[3*I[3*t+1]+2]>11.9&&P[3*I[3*t+2]+2]>11.9)top++;}return{fx:(x1-x0)/w,fy:(y1-y0)/hh,cx:(x0+x1)/2/w,top:top/n};});
 ok(c.fx>.6&&c.fx<.95&&c.fy>.5&&c.fy<.95&&Math.abs(c.cx-.5)<.05,'camera frames the part: '+c.fx.toFixed(2)+' x '+c.fy.toFixed(2));ok(c.top>.35,'top face of the gantry plate dominates the view: '+c.top.toFixed(2));ok(!p.errs.length&&!pl.errs.length,'no page errors in preview checks');}
{const p=await page('#shop='+await SL.encode({...lic,brand:{...lic.brand,key:PROKEY}}));await p.waitForFunction(()=>window.__quote.brand);ok(await S(p,()=>window.__quote.brand.paid)===false,'a Pro key without the brand feature does not unlock branding');}
{const p=await page('#shop='+await SL.encode({...lic,brand:{...lic.brand,key:await K.token({id:'b2',feat:['brand'],dom:['acme.test']})}}));await p.waitForFunction(()=>window.__quote.brand);ok(await S(p,()=>window.__quote.brand.paid)===false,'a domain-bound brand key does not unlock on another host');}
{const p=await page('#shop='+await SL.encode(lic),{w:390,h:844});await load(p,DXF);const w=await p.evaluate(()=>document.documentElement.scrollWidth);ok(w<=392,'phone width has no sideways scroll: '+w);await shot(p,'widget-phone-branded-dxf.png');
 const p2=await page('#shop='+await SL.encode(base)+'&theme=dark',{w:390,h:844});await load(p2,STEP);await shot(p2,'widget-phone-dark-step.png');ok(!p.errs.length&&!p2.errs.length,'no page errors on phone');}

// 4. Script-tag embed on a third-party page sizes its iframe
var HOST='<!doctype html><title>Acme</title><body style="margin:0;font-family:sans-serif"><h1 style="padding:10px">Acme Laser</h1><div id="q"></div><script src="'+BASE+'quote-embed.js" data-shop="'+await SL.encode(base)+'" data-target="#q" async></script>';
{const c=await b.newContext({viewport:{width:1100,height:900}}),p=await c.newPage();await p.goto(SHOP+'/host.html');await p.waitForSelector('#q iframe',{timeout:20000});
 const f=await (await p.$('#q iframe')).contentFrame();await f.waitForSelector('#q-drop',{timeout:60000});await sleep(800);const hgt=await p.$eval('#q iframe',e=>e.getBoundingClientRect().height);
 ok(hgt>300,'embed iframe sized from widget: '+Math.round(hgt));ok((await p.$eval('#q iframe',e=>e.src)).includes('quote.html#shop='),'embed points at quote.html with the shop link');
 await f.setInputFiles('#q-file',DXF);await f.waitForSelector('#q-unit',{timeout:60000});await sleep(800);const h2=await p.$eval('#q iframe',e=>e.getBoundingClientRect().height);ok(h2>=hgt,'iframe grows with the price card: '+Math.round(h2));
 await p.setViewportSize({width:1100,height:Math.min(4000,Math.ceil(await p.evaluate(()=>document.documentElement.scrollHeight)))});await sleep(1200);await shot(p,'widget-embed-script-tag.png',{fullPage:false});}
await b.close();srv.close();shop.close();console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
