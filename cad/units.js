export const MM_PER={in:25.4,mm:1};
let SYS='us';try{SYS=localStorage.getItem('amnicad.sys')||'us';}catch{}
export const sys=()=>SYS;
export function setSys(s){SYS=s==='si'?'si':'us';try{localStorage.setItem('amnicad.sys',SYS);}catch{}}
export const docUnits=doc=>doc&&doc.units==='in'?'in':'mm';
export const mmPer=doc=>MM_PER[docUnits(doc)];
export function nf(v,d){if(v==null||!isFinite(v))return'—';const a=Math.abs(v),dd=d??(a>=1000?0:a>=100?1:a>=10?2:a>=1?3:a>=0.01?4:5);return((+v.toFixed(dd))||0).toLocaleString('en-US',{maximumFractionDigits:dd});}
export const Q={
len:{si:['mm',1],us:['in',1/25.4]},
area:{si:['mm²',1],us:['in²',1/645.16]},
vol:{si:['cm³',1e-3],us:['in³',1/16387.064]},
mass:{si:['kg',1],us:['lb',2.2046226]},
force:{si:['N',1],us:['lbf',0.22480894]},
press:{si:['MPa',1],us:['psi',145.03774]},
stress:{si:['MPa',1],us:['psi',145.03774]},
modulus:{si:['GPa',1e-3],us:['Msi',1.4503774e-4]},
torque:{si:['N·mm',1],us:['lbf·in',0.0088507458]},
temp:{si:['°C',1,0],us:['°F',1.8,32]},
dtemp:{si:['K',1],us:['°F',1.8]},
power:{si:['W',1],us:['BTU/hr',3.4121416]},
film:{si:['W/m²K',1],us:['BTU/hr·ft²·°F',0.17611016]},
cond:{si:['W/m·K',1],us:['BTU/hr·ft·°F',0.57782155]},
speed:{si:['m/s',1],us:['mph',2.2369363]},
dens:{si:['kg/m³',1],us:['lb/in³',3.6127292e-5]},
accel:{si:['m/s²',1],us:['ft/s²',3.2808399]},
freq:{si:['Hz',1],us:['Hz',1]},
dpress:{si:['kPa',1e-3],us:['psi',1.4503774e-4]},
vflow:{si:['mL/min',6e7],us:['gal/min',15850.323]},
mflow:{si:['g/s',1e3],us:['lb/hr',7936.6414]},
vel:{si:['m/s',1],us:['ft/s',3.2808399]},
perm:{si:['m²',1],us:['darcy',1.01325e12]},
beta:{si:['1/m',1],us:['1/ft',0.3048]},
pa:{si:['Pa',1],us:['psf',0.020885434]},
lineload:{si:['N/mm',1],us:['lbf/in',5.7101471]}};
export function conv(q,v,to){const u=Q[q][to];return v*u[1]+(u[2]||0);}
export function back(q,v,from){const u=Q[q][from];return(v-(u[2]||0))/u[1];}
export const unitOf=(q,s=SYS)=>Q[q][s][0];
export const toSI=(q,v)=>back(q,v,SYS);
export const fromSI=(q,v)=>conv(q,v,SYS);
export function one(q,vSI,s=SYS,d){return nf(conv(q,vSI,s),d)+' '+Q[q][s][0];}
export function dual(q,vSI,d){const a=SYS,b=a==='us'?'si':'us';return one(q,vSI,a,d)+' ('+one(q,vSI,b,d)+')';}
export function lenDual(vDoc,doc,d){const u=docUnits(doc),mm=vDoc*MM_PER[u],o=u==='in'?'mm':'in';return nf(vDoc,d)+' '+u+' ('+nf(o==='in'?mm/25.4:mm,d)+' '+o+')';}
export function lenOne(vDoc,doc,d){return nf(vDoc,d)+' '+docUnits(doc);}
export const volMM3=(vDoc3,doc)=>vDoc3*Math.pow(mmPer(doc),3);
export const areaMM2=(vDoc2,doc)=>vDoc2*Math.pow(mmPer(doc),2);
export const massKg=(vDoc3,doc,rho)=>volMM3(vDoc3,doc)*rho*1e-9;
export function massDual(kg){const lb=kg*2.2046226,us=lb<1?nf(lb*16,2)+' oz':nf(lb,3)+' lb',si=kg<1?nf(kg*1000,1)+' g':nf(kg,3)+' kg';return SYS==='us'?us+' ('+si+')':si+' ('+us+')';}
export function bboxDual(b,doc){const u=docUnits(doc),s=[0,1,2].map(i=>b.max[i]-b.min[i]),o=u==='in'?'mm':'in',k=u==='in'?25.4:1/25.4;return s.map(v=>nf(v)).join(' × ')+' '+u+' ('+s.map(v=>nf(v*k)).join(' × ')+' '+o+')';}
const NOLENK=new Set(['angle','draft','a','n','turns','k','modes','id','type','name','op','plane','dir','axis','kind','hand','keep','by','side','normal','std','fit','of','material','text','blob','fmt','note','thru','ruled','center','hole','suppressed']);
const EXPRNL=new Set(['angle','draft','a','n','turns','k','modes']);
export function convLen(v,k){if(typeof v==='number')return+(v*k).toPrecision(10);if(typeof v!=='string')return v;const t=v.trim();if(/^-?\d*\.?\d+(e-?\d+)?$/i.test(t))return+(+t*k).toPrecision(10);return t.replace(/(^|[+\-(,]\s*)(\d*\.?\d+)(?=\s*($|[+\-),]))/g,(m,pre,num,_,off,str)=>{const before=str.slice(0,off+pre.length).replace(/\s+$/,'');if(/[A-Za-z_]\w*\s*\($/.test(before)||/[*/^]\s*$/.test(before))return m;const after=str.slice(off+m.length).trimStart();if(/^[*/^]/.test(after))return m;return pre+String(+(+num*k).toPrecision(10));});}
export function convertDoc(d,to){const from=docUnits(d);if(from===to)return[];const k=from==='mm'?1/25.4:25.4,warn=[],nonLen=new Set();const scan=(o,key)=>{if(Array.isArray(o))o.forEach(x=>scan(x,key));else if(o&&typeof o==='object')for(const kk in o)scan(o[kk],kk);else if(typeof o==='string'&&EXPRNL.has(key))for(const id of o.match(/[A-Za-z_]\w*/g)||[])nonLen.add(id);};scan(d.features,'');
  for(const p of d.params){if(nonLen.has(p.name)||/^(n|count|num|qty|flutes|teeth|z|ang|angle)\w*$/i.test(p.name)&&!/[a-z]{4,}_?(w|d|h)$/.test(p.name))continue;p.expr=String(convLen(p.expr,k));}
  const walk=(o,key)=>Array.isArray(o)?o.map(x=>walk(x,key)):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([kk,v])=>[kk,kk==='sketch'?convSketch(v):NOLENK.has(kk)?v:walk(v,kk)])):NOLENK.has(key)?o:convLen(o,k);
  const convSketch=sk=>{if(!sk)return sk;const c=JSON.parse(JSON.stringify(sk));c.pts=c.pts.map(p=>p.map(v=>v*k));c.ents.forEach(e=>{if(e.r!=null)e.r*=k;});c.cons.forEach(q=>{if(q.v!==undefined&&q.k!=='ang')q.v=convLen(q.v,k);});return c;};
  d.features=walk(d.features,'');if(d.sim)for(const key of['supports','loads','temps','conv','flux'])if(d.sim[key])d.sim[key]=d.sim[key].map(x=>({...x,faces:walk(x.faces,'faces')}));
  if(d.tol&&d.tol.params)for(const t of Object.values(d.tol.params))if(t&&t.k==='pm'){t.up=convLen(t.up,k);t.lo=convLen(t.lo,k);}
  d.units=to;return warn;}
