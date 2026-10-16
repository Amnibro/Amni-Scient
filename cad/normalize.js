import {FT,SHAPES} from './schema.js';
const FKEEP=['id','type','name','suppressed','sketch','note','color','blob','fmt','material','face'],SKEEP=['k','hole','a','x','y','bulge','stroke','closed','kind','from'],XTRA={hole:['x','y','cs_ang','depth'],thread:['run','length'],pattern:['oz']},SKIND={rectangle:'rect',square:'rect',polygon:'poly',line:'path',polyline:'path',naca:'airfoil',wing:'airfoil'},PLN={XY:['z',1],XZ:['y',-1],YZ:['x',1]},SEC=['offset','shapes'];
const lev=(a,b)=>{const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];};
export const closest=(k,L)=>{let best=null,bd=1e9;for(const c of L){const d=lev(String(k).toLowerCase(),c.toLowerCase());d<bd&&(bd=d,best=c);}return bd<=Math.max(2,Math.ceil(String(k).length/2))?best:null;};
const cap=t=>t[0].toUpperCase()+t.slice(1),ALI=[['points','pts'],['radius','r'],['width','w'],['height','h']];
const unk=(lab,k,L)=>{const U=[...new Set(L)],al=ALI.filter(x=>U.includes(x[1])),c0=closest(k,[...U,...al.map(x=>x[0])]),c=(al.find(x=>x[0]===c0)||[])[1]||c0;return lab+': unknown field "'+k+'" was ignored; '+(c?'closest valid field is "'+c+'"':'valid fields: '+U.join(', '))+'.';};
function shape(s,lab,W){
  if(!s||typeof s!=='object'||Array.isArray(s))return s;
  const o={...s};
  o.k===undefined&&o.type!==undefined&&(o.k=o.type,delete o.type);
  typeof o.k==='string'&&(o.k=SKIND[o.k.toLowerCase()]||o.k.toLowerCase());
  for(const[a,b]of ALI)if(o[a]!==undefined){o[b]===undefined&&(o[b]=o[a]);delete o[a];}
  delete o.closed;o.k===undefined&&(o.k='rect');
  if(!SHAPES[o.k]){W.push(lab+': unknown shape kind "'+o.k+'"; closest valid kind is "'+closest(o.k,Object.keys(SHAPES))+'".');return o;}
  const ok=[...SHAPES[o.k].f.map(f=>f[0]),...SKEEP];
  for(const k of Object.keys(o))ok.includes(k)||W.push(unk(lab,k,ok));
  return o;
}
const shapes=(L,lab,W)=>Array.isArray(L)?L.map((s,i)=>shape(s,lab+' shape '+(i+1),W)):L;
export function normFeature(a,type,cur={}){
  const f={...a},W=[],lab=cap(type)+(f.name||cur.name?" '"+(f.name||cur.name)+"'":''),T=FT[type];
  if(!T)return{f,warns:W};
  const known=[...T.f.map(x=>x[0]),...FKEEP,...(XTRA[type]||[])];
  for(const[x,y]of ALI)if(f[x]!==undefined&&known.includes(y)){f[y]===undefined&&(f[y]=f[x]);delete f[x];}
  type==='box'&&f.depth!==undefined&&(f.d===undefined&&(f.d=f.depth),delete f.depth);
  const pl=PLN[f.plane||cur.plane||'XY'];
  if(pl&&known.includes('offset')&&!known.includes(pl[0])&&f[pl[0]]!==undefined){f.offset===undefined&&(f.offset=typeof f[pl[0]]==='number'?f[pl[0]]*pl[1]:pl[1]<0?'-('+f[pl[0]]+')':f[pl[0]]);delete f[pl[0]];}
  delete f.closed;
  f.shapes=shapes(f.shapes,lab,W);f.shapes===undefined&&delete f.shapes;
  Array.isArray(f.sections)&&(f.sections=f.sections.map((sc,i)=>{if(!sc||typeof sc!=='object')return sc;const o={...sc};o.shape&&!o.shapes&&(o.shapes=[o.shape],delete o.shape);o.shapes=shapes(o.shapes,lab+' section '+(i+1),W);for(const k of Object.keys(o))SEC.includes(k)||W.push(unk(lab+' section '+(i+1),k,SEC));return o;}));
  for(const k of Object.keys(f))known.includes(k)||W.push(unk(lab,k,known.filter(x=>!FKEEP.includes(x)||x==='name')));
  return{f,warns:W};
}
