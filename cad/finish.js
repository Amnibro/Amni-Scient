import {MATS} from './schema.js'
const METAL=['al','steel','ss','ti','brass'],ALL=[...METAL,'plastic','wood','composite'],LK=m=>MATS[m]&&MATS[m].look;
const BASEL={al6061:['#c4c8ce',1,.38],al7075:['#bfc3c9',1,.36],steel1018:['#7f8388',1,.5],steel4140:['#767a80',1,.46],ss304:['#dadde1',1,.2],ss316:['#dfe2e6',1,.18],ti64:['#a39f97',1,.36],brass:['#d4ac5a',1,.28],pla:['#ece9e0',0,.45],petg:['#6aa0e6',0,.25],abs:['#3a3d43',0,.5],nylon:['#e8e2d3',0,.78],pc:['#eef3f8',0,.05]};
const ANO={clear:'#c9cdd3',black:'#1d1f23',blue:'#2a63c4',red:'#b3262f',gold:'#c9a24a',green:'#2f8a55',purple:'#6a3fa0',orange:'#d9731f'};
const HARD={black:'#1a1c20',gray:'#4a4e55',bronze:'#6b5436'};
const PW={black:'#1b1c1f',white:'#f1f1ee',gray:'#8b9096',red:'#b32a2a',blue:'#2457b5',green:'#2e7d4f',yellow:'#e1b82b',orange:'#e2701f'};
const ZN={clear:'#b9c2cc',yellow:'#c9a83a'};
export const fam=m=>LK(m)?LK(m).kind:/^al/.test(m)?'al':/^steel/.test(m)?'steel':/^ss/.test(m)?'ss':/^ti/.test(m)?'ti':m==='brass'?'brass':'plastic';
export const FINISHES=[
 {id:'machined',n:'As-machined',fams:ALL,note:null,l:b=>b},
 {id:'bead',n:'Bead blast',fams:METAL,q:'bead',note:'bead',l:b=>[b[0],b[1],.76,0]},
 {id:'anodize2',n:'Anodize Type II',fams:['al','ti'],colors:ANO,def:'clear',q:'anodize',note:c=>c==='clear'||c==='black'?c:'color',l:(b,c)=>[ANO[c],c==='clear'?.9:.75,.42,0]},
 {id:'anodize3',n:'Hard anodize Type III',fams:['al'],colors:HARD,def:'gray',q:'anodize3',note:'hard',l:(b,c)=>[HARD[c],.55,.5,0]},
 {id:'powder',n:'Powder coat',fams:METAL,colors:PW,def:'black',q:'powder',note:'powder',l:(b,c)=>[PW[c],0,.55,.25]},
 {id:'oxide',n:'Black oxide',fams:['steel'],q:'oxide',note:'oxide',l:()=>['#202224',.6,.5,0]},
 {id:'zinc',n:'Zinc plating',fams:['steel'],colors:ZN,def:'clear',q:'zinc',note:c=>c==='yellow'?'zincy':'zinc',l:(b,c)=>[ZN[c],.85,.36,0]},
 {id:'nickel',n:'Nickel plating',fams:['al','steel','brass'],q:'nickel',note:'nickel',l:()=>['#c8cacc',1,.14,0]},
 {id:'chromate',n:'Chromate conversion',fams:['al'],q:'chromate',note:'chem',l:()=>['#bdb083',.85,.4,0]},
 {id:'passivate',n:'Passivation',fams:['ss'],q:'passivate',note:'passivate',l:b=>[b[0],b[1],Math.max(.1,b[2]-.04),0]},
 {id:'paint',n:'Paint',fams:ALL,colors:PW,def:'white',q:'paint',note:'paint',l:(b,c)=>[PW[c],0,.38,.6]}
];
export const finishOf=id=>FINISHES.find(f=>f.id===id);
export const finishesFor=m=>FINISHES.filter(f=>f.fams.includes(fam(m)));
export function norm(m,a){if(a==null||a===''||a===false)return null;const s=typeof a==='string'?a.split(/[:,]/).map(x=>x.trim().toLowerCase()):[String(a.id||a.type||'').toLowerCase(),String(a.color||'').toLowerCase()],q=s[0].replace(/[^a-z0-9]/g,''),f=FINISHES.find(x=>x.id===q||x.n.toLowerCase().replace(/[^a-z0-9]/g,'')===q)||FINISHES.find(x=>q.length>2&&(x.id.startsWith(q)||x.n.toLowerCase().replace(/[^a-z0-9]/g,'').startsWith(q)));if(!f||f.id==='machined'||!f.fams.includes(fam(m)))return null;const c=f.colors?(f.colors[s[1]]?s[1]:f.def):undefined;return c?{id:f.id,color:c}:{id:f.id};}
export function appearance(m,fin){const b=BASEL[m]||(LK(m)?[LK(m).color,0,LK(m).rough]:BASEL.al6061),f=fin&&finishOf(fin.id),ok=f&&f.fams.includes(fam(m)),v=ok?f.l(b,fin.color||f.def):b;return{c:v[0],m:v[1],r:v[2],cc:v[3]!==undefined?v[3]:b[1]?0:.25,glass:!ok&&m==='pc'?.92:0};}
export const label=fin=>{const f=fin&&finishOf(fin.id);return f?f.n+(fin.color?' ('+fin.color+')':''):'As-machined';};
export const quoteIds=fin=>{const f=fin&&finishOf(fin.id);return f&&f.q?[f.q]:[];};
export const noteKey=fin=>{const f=fin&&finishOf(fin.id);return f&&f.note?typeof f.note==='function'?f.note(fin.color||f.def):f.note:null;};
export const EXTRA_SHOP=[{id:'anodize3',name:'Hard anodize type III',kind:'area',price:5.5,min:8,fams:['aluminum'],days:5},{id:'oxide',name:'Black oxide',kind:'lb',price:1.2,min:5,fams:['steel'],days:3},{id:'nickel',name:'Nickel plate',kind:'area',price:6,min:10,fams:['steel','aluminum','brass'],days:5},{id:'chromate',name:'Chromate conversion',kind:'area',price:2.2,min:4,fams:['aluminum'],days:3},{id:'paint',name:'Paint (one color)',kind:'area',price:3.5,min:8,fams:['steel','stainless','aluminum','brass','titanium'],days:3}];
