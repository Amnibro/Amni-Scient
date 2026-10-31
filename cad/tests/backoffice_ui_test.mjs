// Manufacture tab shop tools in a real browser: shop.json import, back office rules and branding, widget links, quote history CSV.
// PLAYWRIGHT=<dir with node_modules/playwright> node cad/tests/backoffice_ui_test.mjs [shotsDir]
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {serve,chrome,tally,root,sleep} from './shop_ui_lib.mjs';import {testRoot} from './testkey.mjs';import * as SR from '../shoprules.js';
const {ok,done}=tally(),SHOTS=process.argv[2]||'',K=await testRoot('t1'),KEY=await K.token({id:'b1',name:'Acme',feat:['brand'],sub:'s1'}),{srv,base}=await serve(K.keys),b=await chrome(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bo-'));
const c=await b.newContext({viewport:{width:1280,height:900},acceptDownloads:true}),p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const shot=async(n,o={})=>SHOTS&&p.screenshot({path:path.join(SHOTS,n),...o});
await p.goto(base);await p.waitForFunction(()=>window.amnicad&&window.amnicad.S.kernel,null,{timeout:120000});await sleep(2000);
await p.evaluate(()=>{const A=window.amnicad;A.loadDoc(JSON.parse(JSON.stringify(A.TEMPLATES[0].doc)));});await sleep(1200);
await p.evaluate(()=>window.amnicad.commit(d=>{const set=(n,v)=>{const x=d.params.find(q=>q.name===n);if(x)x.expr=String(v);};set('w',6);set('d',4);set('t',0.125);d.features=d.features.filter(f=>f.type!=='chamfer');}));await sleep(2500);
await p.evaluate(()=>{const A=window.amnicad.API;A.setTab('make');A.showPanel('R');});await p.waitForFunction(()=>document.querySelector('#tab-make .mk-price b'),null,{timeout:90000});await sleep(800);
const price=async()=>{await p.waitForFunction(()=>!/Quoting/.test(document.querySelector('#tab-make .mk-busy')?.textContent||''),null,{timeout:30000});await sleep(600);return+(await p.locator('#tab-make .mk-price b').first().textContent()).replace(/[^0-9.]/g,'');};
const p0=await price();ok(p0>0,'Make tab quotes the plate: '+p0);
// 1. shop.json import
await p.getByRole('button',{name:'Shop rates…'}).click();await sleep(400);ok(await p.isVisible('#mk-shopimport'),'Import button in Shop rates');ok(await p.isVisible('#mk-backoffice'),'Back office button in Shop rates');
fs.writeFileSync(path.join(tmp,'bad.json'),'[1,2]');await p.setInputFiles('#mk-shopfile',path.join(tmp,'bad.json'));await sleep(300);ok(/Not a shop\.json/.test(await p.textContent('body')),'rejects a JSON list');
fs.writeFileSync(path.join(tmp,'badrules.json'),JSON.stringify({name:'X',quoting:{rules:[{when:{colour:'red'},then:{mult:2}}]}}));await p.setInputFiles('#mk-shopfile',path.join(tmp,'badrules.json'));await sleep(300);ok(/colour is not a known key/.test(await p.textContent('body')),'rejects unknown rule keys');
const shopFile={name:'Acme Laser',labor:70,quoting:{order_fee:10,lines:[{name:'Inspection',order:15}]},brand:{contact:'Dock 4 · (555) 010-2000',email:'quotes@acme.test'}};fs.writeFileSync(path.join(tmp,'shop.json'),JSON.stringify(shopFile));
await p.setInputFiles('#mk-shopfile',path.join(tmp,'shop.json'));await sleep(300);const ta=JSON.parse(await p.locator('#dlg textarea').first().inputValue());
ok(ta.name==='Acme Laser'&&ta.labor===70&&ta.quoting.order_fee===10&&Array.isArray(ta.materials),'import merges shop.json over defaults into the editor');
await shot('import-button-shop-rates.png');
await p.getByRole('button',{name:'Save',exact:true}).click();const p1=await price();ok(p1!==p0,'imported rules change the Make tab price '+p0+' -> '+p1);
ok(/Shop adjustments/.test(await p.textContent('#tab-make')),'rule charges shown as Shop adjustments');
// 2. back office
await p.getByRole('button',{name:'Shop rates…'}).click();await sleep(300);await p.click('#mk-backoffice');await p.waitForSelector('#bo',{timeout:10000});
ok(await p.inputValue('#bo-name')==='Acme Laser'&&await p.inputValue('#bo-fee')==='10','back office loads current values');
await p.click('#bo-pricing summary');await p.fill('#bo-min','90');await p.fill('#bo-rto','1');await p.selectOption('#bo-rmode','up');
await p.click('#bo-pricing details summary');await p.fill('#bo-pricing input[data-mk="material"][data-id="ss304"]','20');
await p.click('#bo-offer input[data-k="p"][value="plasma"]');
await p.click('#bo-lead summary');await p.fill('#bo-lead-add','1');
await p.click('#bo-rulesbox summary');await p.fill('#bo-rules','{"rules":[{"name":"bad","when":{"qty_min":"ten"},"then":{"mult":1.1}}]}');await p.click('#bo-check');ok(/qty_min must be a number/.test(await p.textContent('#bo-err')),'rule validation message');
await p.fill('#bo-rules',JSON.stringify({lines:[{name:'Inspection',order:15}],rules:[{name:'Thin sheet',when:{t_max:0.13},then:{add_each:2,note:'Thin sheet handling'}}]}));
await p.click('#bo-brand summary');await p.fill('#bo-tag','Laser and CNC since 1998');await p.fill('#bo-footer','Net 30 for approved accounts.');await p.check('#bo-hide');await p.check('#bo-color-on');await p.fill('#bo-color','#2f6fd6');
const logo=path.join(tmp,'logo.svg');fs.writeFileSync(logo,'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#2f6fd6"/><text x="32" y="42" font-size="28" text-anchor="middle" fill="#fff" font-family="sans-serif">A</text></svg>');
await p.setInputFiles('#bo-brand input[type=file]',logo);await sleep(300);
await p.fill('#bo-key','AMNIPRO2.nope.nope');await sleep(400);ok(/not valid|incomplete/.test(await p.textContent('#bo-keystate')),'bad key reported: '+await p.textContent('#bo-keystate'));
await p.fill('#bo-key',KEY);await p.waitForFunction(()=>/Key valid/.test(document.querySelector('#bo-keystate').textContent),null,{timeout:8000}).catch(()=>{});ok(/Key valid/.test(await p.textContent('#bo-keystate')),'test branding key accepted');
await p.click('#bo-req summary');await p.fill('#bo-ep','http://elsewhere.test/x');await p.click('#bo-save');ok(/must start with https/.test(await p.textContent('#bo-err')),'plain http endpoint refused');
await p.fill('#bo-ep','https://hooks.acme.test/quote');await p.check('#bo-bd');await p.fill('#bo-map','{"customer":"contact.name","price":"quote.total"}');
// history
const req=(i,n)=>({schema:'amnicad.quote-request/1',id:'q'+i,created:'2026-10-2'+i+'T10:00:00Z',shop:{name:'Acme Laser'},contact:{name:n,email:n.toLowerCase()+'@x.test',company:'',notes:i===1?'=HYPERLINK("x")':''},part:{file:'p'+i+'.dxf',format:'dxf',kind:'flat sheet',size_in:[6,4,.125],thickness_in:.125,volume_in3:2.9},quote:{process:'laser',process_name:'Fiber laser',material:'al5052',material_name:'Aluminum 5052',qty:10*i,unit:4.2,total:42*i,currency:'USD',lead_days:3,expedite:'standard',finishes:[],breaks:[],dfm:[],notes:[]}});
fs.writeFileSync(path.join(tmp,'r1.json'),JSON.stringify(req(1,'Jo')));fs.writeFileSync(path.join(tmp,'r2.json'),JSON.stringify([req(2,'Sam'),req(1,'Jo')]));
await p.click('#bo-hist summary');await p.setInputFiles('#bo-hist input[type=file]',[path.join(tmp,'r1.json'),path.join(tmp,'r2.json')]);await sleep(500);ok(/2 saved/.test(await p.textContent('#bo-hcount')),'history import dedupes by id: '+await p.textContent('#bo-hcount'));
const [d]=await Promise.all([p.waitForEvent('download'),p.click('#bo-hcsv')]);const csv=fs.readFileSync(await d.path(),'utf8');ok(/Sam/.test(csv)&&/Jo/.test(csv)&&csv.trim().split('\n').length===3,'CSV export has a header and 2 rows');ok(/'=HYPERLINK/.test(csv),'CSV guards formula cells');
await p.evaluate(()=>{for(const d of document.querySelectorAll('#bo details'))d.open=true;});await sleep(200);
if(SHOTS){await p.setViewportSize({width:1280,height:2600});await sleep(300);await p.locator('#dlg').screenshot({path:path.join(SHOTS,'backoffice-dialog.png')});await p.setViewportSize({width:1280,height:900});}
await p.click('#bo-save');await sleep(800);
const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('amnicad.shop')));const q=saved.quoting;
ok(q.min_total===90&&q.round.to===1&&q.round.mode==='up'&&q.markup.material.ss304===.2&&q.lead_add===1&&!q.offer.processes.includes('plasma')&&q.offer.processes.includes('laser'),'back office saves pricing, markups, offer and lead time');
ok(saved.brand.tagline&&saved.brand.hide_badge===true&&saved.brand.color==='#2f6fd6'&&/^data:image\/svg\+xml;base64,/.test(saved.brand.logo)&&saved.brand.key===KEY,'branding saved with logo as data URI');
ok(saved.widget.breakdown===true&&saved.widget.request.endpoint==='https://hooks.acme.test/quote'&&saved.widget.request.map.price==='quote.total','request routing saved');ok(!SR.validate(q).length,'saved rules validate');
const p2=await price();ok(p2>=90&&Number.isInteger(p2),'Make tab applies minimum order and rounding: '+p2);
// 3. link dialog -> widget
await p.click('#mk-shoplink');await sleep(800);const wurl=await p.inputValue('#mk-widget-url'),tag=await p.inputValue('#mk-widget-script'),ifr=await p.inputValue('#mk-shoplink-code');
ok(/\/cad\/quote\.html#shop=/.test(wurl)&&/quote-embed\.js" data-shop="[\w-]+"/.test(tag)&&/<iframe src="[^"]*quote\.html#shop=/.test(ifr),'quote link dialog gives widget URL, iframe and script tag');
await shot('quote-link-dialog.png');
const w=await c.newPage();await w.goto(wurl);await w.waitForSelector('#q-drop',{timeout:60000});await w.waitForFunction(()=>window.__quote.brand);
ok(await w.textContent('.hd .nm')==='Acme Laser'&&/1998/.test(await w.textContent('.hd'))&&!(await w.$('.badge')),'widget from link is branded (licensed), badge hidden');
await w.setInputFiles('#q-file',path.join(root,'assets/cad/shop/mounting-plate-flat.dxf'));await w.waitForSelector('#q-unit',{timeout:60000});await sleep(400);
const wq=await w.evaluate(()=>window.__quote.r.res.quotes.find(q=>q.ok));ok(wq.total>=90&&wq.unit===Math.ceil(wq.unit)&&/Thin sheet/.test(JSON.stringify(wq.notes)),'widget uses the back office rules: '+wq.total);
ok(await w.isVisible('#q-bd'),'widget shows breakdown when opted in');
await w.close();
ok(!errs.length,'no page errors '+errs.join(' | '));
await b.close();srv.close();process.exit(done()?1:0);
