const T=new URLSearchParams(location.search).get('tier')||'basic';
const mode=new URLSearchParams(location.search).get('mode')||'cart';
const P=document.documentElement.dataset.partner||'hubs';
const names={hubs:'Protolabs Network',sendcutsend:'SendCutSend'};
const fees={basic:'$497/mo',pro:'$1,497/mo',enterprise:'From $4,997/mo'};
const order=JSON.parse(sessionStorage.getItem('amni-demo-order')||'null');
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0);
document.documentElement.dataset.theme=P==='hubs'?'hubs':'scs';
document.title=names[P]+' checkout · demo';
const h=(tag,a={},...kids)=>{const e=document.createElement(tag);for(const k in a){const v=a[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='href')e.href=v;else if(k==='html')e.innerHTML=v;else e.setAttribute(k,v===true?'':v);}for(const c of kids.flat(9))if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(String(c)));return e;};
const back='/'+P+'/?tier='+T;

const header=h('header',null,h('div',{class:'mark'},names[P]),h('span',{class:'tag'},'Private Amni-CAD demo'),h('div',{class:'pill'},(T[0].toUpperCase()+T.slice(1))+' · '+(fees[T]||'')));
let body;
if(mode==='fallback'){
  body=h('div',{class:'rail',style:'max-width:640px;margin:32px auto;border:1px solid var(--line);border-radius:12px'},
    h('h2',null,'Order on '+names[P]),
    h('p',{class:'note'},'Basic sends the customer to '+names[P]+' to finish the order.'),
    order?h('div',{class:'part'},h('b',null,(order.part&&(order.part.name||order.part.title))||'Part'),h('span',null,(order.process||'')+' · '+(order.material||'')+' · qty '+(order.qty||1)),h('div',null,order.quote?money(order.quote.total)+' estimate':'')):null,
    h('p',{class:'note'},'Nothing is charged in this preview.'),
    h('a',{class:'btn pri',href:back,style:'display:block;text-align:center'},'Return to the demo')
  );
}else{
  const q=order&&order.quote||{unit:0,total:0,lead:7,q:1};
  body=h('div',{class:'rail',style:'max-width:640px;margin:32px auto;border:1px solid var(--line);border-radius:12px'},
    h('h2',null,'Cart · '+names[P]),
    h('div',{class:'part'},h('b',null,(order&&order.part&&(order.part.name||order.part.title))||'Demo part'),h('span',null,((order&&order.part&&(order.part.sizeText||order.part.file))||'')+' · '+(order&&order.process||'')+' · '+(order&&order.material||''))),
    h('div',{class:'price'},h('span',{class:'u'},money(q.total)),h('span',{class:'t'},money(q.unit)+' each · qty '+(q.q||1))),
    h('div',{class:'lead'},'Lead time '+q.lead+' business days'),
    h('p',{class:'note'},'Nothing is charged in this preview.'),
    T==='enterprise'?h('p',{class:'lic'},'Enterprise site license'):null,
    h('button',{class:'btn pri',onclick:()=>alert('Demo only. No payment is taken.')},'Place order (demo)'),
    h('a',{class:'btn',href:back,style:'text-align:center'},'Keep designing')
  );
}
document.body.replaceChildren(header,body);
