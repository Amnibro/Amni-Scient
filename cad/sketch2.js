import {solve,arcPoints} from './sketch.js';
const r9=v=>+(+v).toFixed(9);
export function chains(sk){
  const P=sk.pts,E=sk.ents,L=E.map((e,i)=>!e.cons&&(e.k==='line'||e.k==='arc')?i:-1).filter(i=>i>=0),adj=new Map(),seen=new Set(),out=[];
  L.forEach(i=>[E[i].p[0],E[i].p[1]].forEach(q=>adj.set(q,(adj.get(q)||[]).concat(i))));
  const deg=q=>(adj.get(q)||[]).length,ends=i=>[deg(E[i].p[0]),deg(E[i].p[1])];
  for(const i of[...L].sort((a,b)=>Math.min(...ends(a))-Math.min(...ends(b)))){
    if(seen.has(i))continue;const e0=E[i];let at=deg(e0.p[0])===1?e0.p[0]:deg(e0.p[1])===1?e0.p[1]:e0.p[0],cur=i;const pts=[];
    while(cur!=null&&!seen.has(cur)){seen.add(cur);const e=E[cur],fwd=e.p[0]===at,q=e.k==='arc'?arcPoints(P,e,16):[P[e.p[0]],P[e.p[1]]],seg=fwd?q:q.slice().reverse();pts.push(...(pts.length?seg.slice(1):seg));at=fwd?e.p[1]:e.p[0];cur=(adj.get(at)||[]).find(x=>!seen.has(x));}
    out.push(pts.map(p=>[r9(p[0]),r9(p[1])]));
  }
  return out;
}
export function chainShapes(sk){const c=JSON.parse(JSON.stringify(sk));solve(c);const L=chains(c);if(!L.length)throw new Error('the sketch has no line yet');return L.map(pts=>({k:'path',pts,open:true}));}
export function fromChain(pts){const sk={pts:[[0,0]],ents:[],cons:[]},ix=(pts||[]).map(p=>{sk.pts.push([+p[0]||0,+p[1]||0]);return sk.pts.length-1;});ix.slice(1).forEach((b,i)=>sk.ents.push({k:'line',p:[ix[i],b]}));return sk;}
