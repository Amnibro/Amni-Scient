/**
 * Thread library. Basic sizes come from published standards. Nothing here is a guessed pitch.
 *
 * ASME B1.1-2019: UNC, UNF, UNEF and constant 8-UN. Numbered major diameter is 0.060 + 0.013·N in.
 * ASME B1.15: UNJ uses the same basic major diameter and threads per inch as the UN series; the root radius is the B1.15 form, not a different major.
 * ISO 724 / ISO 261: metric coarse and fine basic major and pitch.
 * ISO 5855: MJ uses the same basic major and pitch as the metric series; the root radius is the MJ form.
 * ASME B1.20.1: NPT threads per inch and the basic outside diameter (the ASME B36.10 pipe OD).
 * ASME B1.20.3: NPTF uses that same basic size; the seal interference is the B1.20.3 form.
 * ISO 228-1: parallel pipe G (BSPP), major diameter and threads per inch.
 * ISO 7-1: taper pipe R (BSPT), same nominal size and threads per inch; taper 1:16.
 * ASME B1.5: general-purpose Acme preferred diameter and threads per inch (the sizes listed below).
 * ASME B1.8: Stub Acme uses those same nominal sizes; the thread height is the B1.8 form.
 * ISO 2902: preferred metric trapezoidal Tr sizes listed below. Tolerance class per ISO 2903 (7e external, 7H internal).
 * BS 93: BA series from the published rule pitch = 0.9^n mm and major = 6·pitch, n = 0…10.
 * DIN 40430: PG conduit threads, the sizes listed below.
 *
 * Tap drill: metric recommended drill is major − pitch (M6×1 → 5.00 mm). Unified 75% drill is major − 0.9743/n (Machinery's Handbook). Pipe and BA drills use that same 75% rule and are labeled as calculated, not as a numbered drill.
 *
 * Left out, because a preferred-size table was not verified here: UNS specials, and the ASME B1.9 buttress preferred series.
 */
const numD=n=>+(0.060+0.013*n).toFixed(4);
const FR={'1/4':0.25,'5/16':0.3125,'3/8':0.375,'7/16':0.4375,'1/2':0.5,'9/16':0.5625,'5/8':0.625,'3/4':0.75,'7/8':0.875,'1':1,'1-1/8':1.125,'1-1/4':1.25,'1-3/8':1.375,'1-1/2':1.5,'1-3/4':1.75,'2':2,'2-1/4':2.25,'2-1/2':2.5,'2-3/4':2.75,'3':3};
const sizeIn=s=>s[0]==='#'?numD(+s.slice(1)):FR[s];
const row=(family,size,tpi,major,unit)=>{const pitch=unit==='in'?1/tpi:tpi;return {family,size,tpi:unit==='in'?tpi:null,pitch:+pitch.toFixed(6),major,unit,id:family+':'+size+':'+(unit==='in'?tpi:pitch)};};
const inch=(family,pairs)=>pairs.map(([s,tpi])=>row(family,s,tpi,sizeIn(s),'in'));
const UNC=[[ '#1',64],['#2',56],['#3',48],['#4',40],['#5',40],['#6',32],['#8',32],['#10',24],['#12',24],['1/4',20],['5/16',18],['3/8',16],['7/16',14],['1/2',13],['9/16',12],['5/8',11],['3/4',10],['7/8',9],['1',8],['1-1/8',7],['1-1/4',7],['1-3/8',6],['1-1/2',6],['1-3/4',5],['2',4.5]];
const UNF=[['#0',80],['#1',72],['#2',64],['#3',56],['#4',48],['#5',44],['#6',40],['#8',36],['#10',32],['#12',28],['1/4',28],['5/16',24],['3/8',24],['7/16',20],['1/2',20],['9/16',18],['5/8',18],['3/4',16],['7/8',14],['1',12],['1-1/8',12],['1-1/4',12]];
const UNEF=[['#12',32],['1/4',32],['5/16',32],['3/8',32],['7/16',28],['1/2',28],['9/16',24],['5/8',24],['3/4',20],['7/8',20],['1',20]];
const UN8=['1','1-1/8','1-1/4','1-3/8','1-1/2','1-3/4','2','2-1/4','2-1/2','2-3/4','3'].map(s=>[s,8]);
const MET=[[1,0.25],[1.6,0.35],[2,0.4],[2.5,0.45],[3,0.5],[4,0.7],[5,0.8],[6,1],[8,1.25],[10,1.5],[12,1.75],[14,2],[16,2],[18,2.5],[20,2.5],[22,2.5],[24,3],[27,3],[30,3.5],[33,3.5],[36,4],[42,4.5],[48,5],[56,5.5],[64,6]];
const METF=[[8,1],[10,1.25],[10,1],[12,1.5],[12,1.25],[12,1],[14,1.5],[16,1.5],[16,1],[18,1.5],[20,2],[20,1.5],[22,1.5],[24,2],[27,2],[30,2],[33,2],[36,3]];
const met=(family,pairs)=>pairs.map(([d,p])=>row(family,'M'+d,p,d,'mm'));
const NPT=[['1/16',27,0.3125],['1/8',27,0.405],['1/4',18,0.540],['3/8',18,0.675],['1/2',14,0.840],['3/4',14,1.050],['1',11.5,1.315],['1-1/4',11.5,1.660],['1-1/2',11.5,1.900],['2',11.5,2.375]];
const pipe=(family,rows_)=>rows_.map(([s,tpi,major])=>row(family,s,tpi,major,'in'));
const BSP=[['1/8',28,9.728],['1/4',19,13.157],['3/8',19,16.662],['1/2',14,20.955],['3/4',14,26.441],['1',11,33.249],['1-1/4',11,41.910],['1-1/2',11,47.803],['2',11,59.614]];
const bsp=family=>BSP.map(([s,tpi,major])=>row(family,s,+(25.4/tpi).toFixed(4),major,'mm'));
const ACME=[['1/4',16],['5/16',14],['3/8',12],['1/2',10],['5/8',8],['3/4',6],['1',5],['1-1/4',5],['1-1/2',4],['2',4]];
const TR=[[8,1.5],[10,2],[12,3],[16,4],[20,4],[24,5],[32,6],[40,7]];
const PG=[['7',20,12.5],['9',18,15.2],['11',18,18.6],['13.5',18,20.4],['16',18,22.5],['21',16,28.3],['29',16,37],['36',16,47],['42',16,54],['48',16,59.3]];
const BA=Array.from({length:11},(_,n)=>{const p=Math.pow(0.9,n),d=6*p;return row('BA',n+'BA',+p.toFixed(4),+d.toFixed(4),'mm');});
export const FAMILIES=[
  {id:'UNC',group:'Unified inch',label:'UNC coarse',cls:['2A','2B','3A','3B'],ext:['2A','3A'],int:['2B','3B'],src:'ASME B1.1'},
  {id:'UNF',group:'Unified inch',label:'UNF fine',cls:['2A','2B','3A','3B'],ext:['2A','3A'],int:['2B','3B'],src:'ASME B1.1'},
  {id:'UNEF',group:'Unified inch',label:'UNEF extra fine',cls:['2A','2B','3A','3B'],ext:['2A','3A'],int:['2B','3B'],src:'ASME B1.1'},
  {id:'8UN',group:'Unified inch',label:'8-UN constant pitch',cls:['2A','2B','3A','3B'],ext:['2A','3A'],int:['2B','3B'],src:'ASME B1.1'},
  {id:'UNJ',group:'Unified inch',label:'UNJ (external root)',cls:['3A'],ext:['3A'],int:[],src:'ASME B1.15'},
  {id:'M',group:'ISO metric',label:'M coarse',cls:['6g','6H'],ext:['6g'],int:['6H'],src:'ISO 724'},
  {id:'MF',group:'ISO metric',label:'M fine',cls:['6g','6H'],ext:['6g'],int:['6H'],src:'ISO 724'},
  {id:'MJ',group:'ISO metric',label:'MJ',cls:['4h6h','4H5H'],ext:['4h6h'],int:['4H5H'],src:'ISO 5855'},
  {id:'NPT',group:'Pipe',label:'NPT',cls:[],ext:[],int:[],src:'ASME B1.20.1'},
  {id:'NPTF',group:'Pipe',label:'NPTF',cls:[],ext:[],int:[],src:'ASME B1.20.3'},
  {id:'BSPP',group:'Pipe',label:'BSPP (G)',cls:['A','B'],ext:['A','B'],int:[''],src:'ISO 228-1'},
  {id:'BSPT',group:'Pipe',label:'BSPT (R)',cls:[],ext:[],int:[],src:'ISO 7-1'},
  {id:'ACME',group:'Power',label:'ACME',cls:['2G','3G','4G'],ext:['2G','3G','4G'],int:['2G','3G','4G'],src:'ASME B1.5'},
  {id:'STUB',group:'Power',label:'Stub ACME',cls:['2G','3G'],ext:['2G','3G'],int:['2G','3G'],src:'ASME B1.8'},
  {id:'TR',group:'Power',label:'Trapezoidal Tr',cls:['7e','7H'],ext:['7e'],int:['7H'],src:'ISO 2902'},
  {id:'BA',group:'Other',label:'BA',cls:[],ext:[],int:[],src:'BS 93'},
  {id:'PG',group:'Other',label:'PG conduit',cls:[],ext:[],int:[],src:'DIN 40430'}
];
const UNJ=UNC.concat(UNF).filter((v,i,a)=>a.findIndex(x=>x[0]===v[0]&&x[1]===v[1])===i);
export const THREADS=[
  ...inch('UNC',UNC),...inch('UNF',UNF),...inch('UNEF',UNEF),...inch('8UN',UN8),...inch('UNJ',UNJ),
  ...met('M',MET),...met('MF',METF),...met('MJ',MET.concat(METF)),
  ...pipe('NPT',NPT),...pipe('NPTF',NPT),
  ...bsp('BSPP'),...bsp('BSPT'),
  ...inch('ACME',ACME),...inch('STUB',ACME),
  ...TR.map(([d,p])=>row('TR','Tr'+d,p,d,'mm')),
  ...BA,
  ...PG.map(([s,tpi,major])=>row('PG','PG'+s,+(25.4/tpi).toFixed(4),major,'mm'))
];
const byId=new Map(THREADS.map(t=>[t.id,t]));
export const familyOf=id=>FAMILIES.find(f=>f.id===id);
export function sizes(family){return [...new Set(THREADS.filter(t=>t.family===family).map(t=>t.size))];}
export function pitches(family,size){return THREADS.filter(t=>t.family===family&&t.size===size);}
export function classes(family,internal){const f=familyOf(family);if(!f)return [];return internal?f.int:f.ext;}
export function tapDrill(t){if(!t)return null;if(t.unit==='mm'&&(t.family==='M'||t.family==='MF'||t.family==='MJ'))return +(t.major-t.pitch).toFixed(3);if(t.unit==='in'&&t.tpi)return +(t.major-0.9743/t.tpi).toFixed(4);if(t.unit==='mm'&&t.tpi)return +(t.major-0.9743*(25.4/t.tpi)).toFixed(3);return +(t.major-t.pitch).toFixed(t.unit==='in'?4:3);}
export function callout(t,{internal=false,hand='right',cls}={}){if(!t)return '';const lh=hand==='left'?'-LH':'';const klass=cls||(classes(t.family,internal)[0]||'');
  if(t.family==='M'||t.family==='MF')return 'M'+t.major+'x'+t.pitch+(klass?'-'+klass:'')+lh;
  if(t.family==='MJ')return 'MJ'+t.major+'x'+t.pitch+(klass?'-'+klass:'')+lh;
  if(t.family==='TR')return 'Tr'+t.major+'x'+t.pitch+(klass?'-'+klass:'')+lh;
  if(t.family==='NPT'||t.family==='NPTF')return t.size+'-'+t.tpi+' '+t.family+lh;
  if(t.family==='BSPP')return 'G'+t.size+(internal?'':klass||'A')+lh;
  if(t.family==='BSPT')return (internal?'Rc':'R')+t.size+lh;
  if(t.family==='PG')return t.size+lh;
  if(t.family==='BA')return t.size+lh;
  if(t.family==='ACME'||t.family==='STUB')return t.size+'-'+t.tpi+' '+(t.family==='STUB'?'STUB ACME':'ACME')+(klass?'-'+klass:'')+lh;
  const series=t.family==='8UN'?'8UN':t.family;return t.size+'-'+t.tpi+' '+series+(klass?'-'+klass:'')+lh;}
export function searchThreads(q){const s=String(q||'').trim().toLowerCase();if(!s)return [];return THREADS.filter(t=>callout(t).toLowerCase().includes(s)||t.size.toLowerCase().includes(s)||t.family.toLowerCase().includes(s)).slice(0,40);}
export function threadById(id){return byId.get(id)||null;}
export function lookupThread(f){if(!f)return null;if(f.threadId&&byId.has(f.threadId))return byId.get(f.threadId);const st=f.std&&f.std!=='custom'?String(f.std):'';if(!st)return null;return THREADS.find(t=>callout(t)===st||t.size===st||(t.family==='UNC'&&t.size+'-'+t.tpi===st)||(t.family==='M'&&('M'+t.major===st||'M'+t.major+'x'+t.pitch===st)))||null;}
const REC='amnicad.thread.recent';
export function recentThreads(){try{return JSON.parse(localStorage.getItem(REC)||'[]').map(threadById).filter(Boolean).slice(0,8);}catch{return [];}}
export function rememberThread(id){try{const L=[id,...(JSON.parse(localStorage.getItem(REC)||'[]').filter(x=>x!==id))].slice(0,8);localStorage.setItem(REC,JSON.stringify(L));}catch{}}
export function legacyMap(){const o={};for(const t of THREADS){if(t.family==='UNC'||t.family==='UNF')o[t.size+'-'+t.tpi]=[t.major,t.pitch,'in'];if(t.family==='M')o['M'+t.major]=[t.major,t.pitch,'mm'];}return o;}
