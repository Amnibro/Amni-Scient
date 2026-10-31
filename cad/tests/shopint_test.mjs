// Shop integrations in Node: quoting rules, request payload/CSV/mapping, branding gate, DXF parts, headless quote with shop rules, shop link round trip, schema.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import * as SR from '../shoprules.js';import * as DX from '../dxfpart.js';import * as SL from '../shoplink.js';import {testRoot} from './testkey.mjs';
const D=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(D,'../..');let fail=0;const ok=(c,m)=>{c||fail++;console.log(c?'PASS':'FAIL',m);};
// validate
ok(SR.validate(null).length===0,'no quoting block is valid');
ok(SR.validate({markup:{material:{al5052:0.1}},round:{to:1,mode:'up'},rules:[{name:'r',when:{qty_min:10},then:{mult:0.9}}]}).length===0,'a good quoting block validates');
const bad=SR.validate({markup:{material:{x:-2}},round:{mode:'sideways'},rules:[{when:{color:'red'},then:{exec:'alert(1)'}}],evil:1});
ok(bad.length>=4&&bad.some(e=>/evil/.test(e))&&bad.some(e=>/exec/.test(e))&&bad.some(e=>/color/.test(e)),'unknown keys and bad values are rejected: '+bad.length);
// prepare
const shop={name:'T',processes:[{id:'laser'},{id:'waterjet'}],materials:[{id:'al5052',procs:['laser','waterjet']},{id:'ss304',procs:['laser']}],finishes:[{id:'pc'},{id:'an'}],brand:{name:'B'},widget:{breakdown:true},quoting:{offer:{processes:['laser'],materials:['al5052'],finishes:['pc']}}};
const pp=SR.prepare(shop);ok(!pp.brand&&!pp.widget&&!pp.quoting&&pp.processes.length===1&&pp.materials.length===1&&pp.materials[0].procs.join()==='laser'&&pp.finishes.length===1,'prepare strips extra keys and filters the offer');
// priceAt
const f={material:'al5052',process:'laser',kind:'sheet',finish:[],expedite:'standard',size:6,t:0.125};
const Q={markup:{material:{al5052:0.1},process:{laser:0.2}},order_fee:20,min_total:100,round:{to:0.05,mode:'up'},lines:[{name:'Deburr',each:1.5}],rules:[{name:'Volume',when:{qty_min:50},then:{mult:0.9,note:'volume'}},{name:'No big',when:{size_min:48},then:{block:'Too big'}}]};
let P=SR.priceAt({},10,10,f,Q);ok(Math.abs(P.unit-(10*1.1*1.2+1.5+2))<0.051&&P.unit*100%5<1e-6||Math.abs(P.unit-15.7)<1e-9,'markups, line item, order fee and rounding: '+P.unit);
P=SR.priceAt({},10,1,f,Q);ok(P.total===100,'minimum order total applies: '+P.total);
P=SR.priceAt({},10,100,f,Q);ok(P.notes.includes('volume')&&P.unit<SR.priceAt({},10,49,f,Q).unit,'quantity rule applies at 50+');
ok(SR.priceAt({},10,1,{...f,size:60},Q).block==='Too big','a block rule fires on size');
// apply
const res={material:'al5052',currency:'USD',quotes:[{ok:true,process:'laser',name:'Laser',qty:10,unit:10,total:100,lead_days:3,breakdown:{material:4,cut:6},breaks:[{qty:1,unit:20},{qty:100,unit:8}]}]};
const A=SR.apply(res,{quoting:Q},{kind:'flat sheet',part:{bbox:[152.4,101.6,3.175]},req:{}});const q=A.quotes[0];
ok(q.unit>10&&Math.abs(q.breakdown.rules-(q.unit-10))<0.011&&q.breaks.length===2&&q.rules.includes('Deburr'),'apply folds rules into unit, breakdown and breaks');
ok(SR.apply(res,{},{})===res,'no quoting block leaves the result alone');
// payload, map, csv
const pl=SR.payload({shop:{name:'T'},res:A,q,ctx:{kind:'flat sheet',part:{bbox:[152.4,101.6,3.175],sheet:{t:3.175}},req:{expedite:'rush'}},contact:{name:'Jo',email:'jo@x.test',notes:'=HYPERLINK("x")'},file:{name:'p.dxf',format:'dxf'}});
const schema=JSON.parse(fs.readFileSync(path.join(ROOT,'cad/api/quote-request.schema.json'),'utf8'));
ok(pl.schema===schema.properties.schema.const&&schema.required.every(k=>k in pl)&&/^q[0-9a-z]+$/.test(pl.id)&&pl.part.size_in.join()==='6,4,0.125'&&pl.part.thickness_in===0.125&&pl.quote.expedite==='rush','payload matches the schema basics');
const unk=[];const walk=(o,s,p)=>{if(!s||!s.properties||!o||typeof o!=='object')return;for(const k in o){if(!(k in s.properties))unk.push(p+k);else walk(o[k],s.properties[k],p+k+'.');}};walk(pl,schema,'');ok(!unk.length,'payload has no keys outside the schema '+unk.join());
const m=SR.mapPayload(pl,{'customer.name':'contact.name','customer.email':'contact.email',price:'quote.total',source:'=amnicad',missing:'nope.x'});
ok(m.customer.name==='Jo'&&m.price===q.total&&m.source==='amnicad'&&m.missing===null,'field mapping with nesting, literals and missing paths');
ok(SR.mapPayload(pl,{})===pl,'an empty map sends the payload as is');
const csv=SR.csv([pl,{...pl,id:'q2',contact:{name:'Sam, "S"',email:''}}]),rows=csv.trim().split(/\r?\n/);
ok(rows.length===3&&rows[0].startsWith('created,id,')&&/"Sam, ""S"""/.test(csv)&&/'=HYPERLINK/.test(csv),'CSV quoting and formula guard');
// branding gate
const bs={name:'Shop',contact:'555',brand:{name:'Acme',logo:'javascript:alert(1)',color:'red',tagline:'Fast',hide_badge:true}};
let b=SR.brand(bs,null);ok(b.name==='Acme'&&b.contact==='555'&&!b.tagline&&b.badge===true,'unlicensed: name and contact only, badge shown');
b=SR.brand(bs,{feat:['brand']});ok(b.tagline==='Fast'&&b.badge===false&&!b.logo&&!b.color,'licensed: paid fields on, unsafe logo and colour dropped');
ok(SR.wantsPaid(bs)&&!SR.wantsPaid({brand:{name:'x'}}),'wantsPaid only for paid fields');
// test licence tokens (throwaway keys)
const R=await testRoot(),tok=await R.token({feat:['brand'],dom:'shop.example'}),parts=tok.split('.');ok(parts[0]==='AMNIPRO2'&&JSON.parse(Buffer.from(parts[1],'base64url')).feat[0]==='brand','test signer mints a brand token');
// DXF part
const dx=fs.readFileSync(path.join(ROOT,'assets/cad/shop/mounting-plate-flat.dxf'),'utf8'),Pt=DX.read(dx,{units:'in'});
ok(!Pt.error&&Pt.outer&&Array.isArray(Pt.holes||[]),'DXF reads an outline'+(Pt.error?': '+Pt.error:''));
const doc0=DX.doc(Pt,0.125),doc=doc0;ok(doc0&&Array.isArray(doc.features)&&doc.features.length>0,'DXF becomes an extrude doc');
ok(/^<svg/.test(DX.svg(Pt)),'DXF preview SVG');
ok(DX.read('0\nSECTION\n0\nEOF\n').error,'empty DXF gives an error');
// shop link round trip
const enc=await SL.encode({name:'T',quoting:Q,widget:{breakdown:false}}),dec=await SL.decode(enc);ok(dec.name==='T'&&dec.quoting.round.mode==='up'&&dec.widget.breakdown===false,'shop link encode/decode ('+enc.length+' chars)');
// headless quote with shop rules
const H=await import('../headless.js');await H.init(path.join(ROOT,'cad/vendor/replicad_single.wasm'));
const base=await H.quote({doc,req:{qty:10,material:'al5052'}}),shopped=await H.quote({doc,req:{qty:10,material:'al5052'},shop:{quoting:{markup:{material:{al5052:0.5}}}}});
const u0=(base.quote.quotes||[]).find(x=>x.ok)?.unit,u1=(shopped.quote.quotes||[]).find(x=>x.ok)?.unit;
ok(base.kind==='flat sheet'&&u0>0&&Math.abs(u1-u0*1.5)<0.02*u0,'headless quote applies a shop markup: '+u0+' -> '+u1);
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
