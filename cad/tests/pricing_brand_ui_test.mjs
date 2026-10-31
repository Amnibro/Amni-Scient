// Pricing page branding add-on: the checkbox adds brand + optional domain to the checkout call, yearly plans are
// held back while it is on (branding bills monthly), and errors from the license server show in plain words.
// The license server is faked by route; nothing reaches Stripe.
import {serve,chrome,tally,sleep} from './shop_ui_lib.mjs';
const {ok,done}=tally(),{srv,base}=await serve(),br=await chrome(),shots=process.argv[2];
const c=await br.newContext({viewport:{width:1280,height:900}}),p=await c.newPage(),errs=[],sent=[];p.on('pageerror',e=>errs.push(e.message));
let reply={url:'about:blank#stripe'};
await p.route('https://amni-cad-pro.amnibro7.workers.dev/**',async r=>{sent.push(JSON.parse(r.request().postData()||'{}'));const bad=reply.error;await r.fulfill({status:bad?400:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(reply)});});
await p.goto(base.replace(/cad\/$/,'')+'amni-cad.html#pro');await sleep(600);
ok(await p.isVisible('#branding')&&/\+\$10/.test(await p.textContent('#branding')),'branding add-on card shows the +$10/mo price');
ok(!(await p.isChecked('#pro-brand'))&&!(await p.isDisabled('[data-pro-plan="year"]')),'off by default; yearly plans available');
await p.click('[data-pro-plan="month"]');await sleep(400);ok(sent.length===1&&sent[0].plan==='month'&&!('brand' in sent[0]),'plain monthly checkout sends only the plan');
await p.goto(base.replace(/cad\/$/,'')+'amni-cad.html#pro');await sleep(400);
await p.check('#pro-brand');ok(await p.isDisabled('[data-pro-plan="year"]')&&await p.isDisabled('[data-pro-plan="ent_year"]')&&!(await p.isDisabled('[data-pro-plan="ent_month"]')),'with branding on, yearly buttons are held back and monthly stay live');
await p.fill('#pro-dom','www.acme-laser.com');
if(shots){await sleep(800);await p.evaluate(()=>{const e=document.getElementById('branding');scrollTo(0,e.getBoundingClientRect().top+scrollY-420);});await sleep(500);await p.screenshot({path:shots+'/pricing-branding-addon.png'});}
await p.click('[data-pro-plan="month"]');await sleep(400);ok(sent.at(-1).plan==='month'&&sent.at(-1).brand===true&&sent.at(-1).domain==='www.acme-laser.com','checkout sends plan, brand and the domain');
await p.goto(base.replace(/cad\/$/,'')+'amni-cad.html#pro');await sleep(400);reply={error:'that domain does not look right (example: shop.example.com)'};
await p.check('#pro-brand');await p.fill('#pro-dom','not a domain');await p.click('[data-pro-plan="ent_month"]');await sleep(500);
ok(/domain does not look right/.test(await p.textContent('#pro-err'))&&!(await p.isDisabled('[data-pro-plan="ent_month"]')),'server error shows in plain words and the button comes back');
await p.uncheck('#pro-brand');ok(!(await p.isDisabled('[data-pro-plan="year"]')),'unchecking branding re-enables yearly plans');
ok(!errs.length,'no page errors '+errs.join(' | '));
await br.close();srv.close();done();
