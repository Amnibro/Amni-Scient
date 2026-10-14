const MATH={PI:Math.PI,pi:Math.PI,e:Math.E,sqrt:Math.sqrt,abs:Math.abs,min:Math.min,max:Math.max,pow:Math.pow,round:Math.round,floor:Math.floor,ceil:Math.ceil,exp:Math.exp,log:Math.log,sin:d=>Math.sin(d*Math.PI/180),cos:d=>Math.cos(d*Math.PI/180),tan:d=>Math.tan(d*Math.PI/180),asin:x=>Math.asin(x)*180/Math.PI,acos:x=>Math.acos(x)*180/Math.PI,atan:x=>Math.atan(x)*180/Math.PI,atan2:(y,x)=>Math.atan2(y,x)*180/Math.PI,hypot:Math.hypot};
const fnCache=new Map();
export function evalExpr(v,scope){
  if(typeof v==='number')return v;
  if(typeof v==='boolean')return v?1:0;
  const s=String(v??'').trim();if(!s)return 0;
  if(/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(s))return +s;
  if(!/^[\w\s+\-*/%^().,]*$/.test(s))throw new Error(`bad expression "${s}"`);
  const ids=[...new Set(s.match(/[A-Za-z_]\w*/g)||[])];
  for(const id of ids)if(!(id in scope)&&!(id in MATH))throw new Error(`unknown name "${id}" in "${s}"`);
  const key=s+'|'+ids.join(',');
  let f=fnCache.get(key);
  if(!f){f=new Function(...ids,'return ('+s.replace(/\^/g,'**')+')');fnCache.set(key,f);}
  const r=f(...ids.map(id=>id in scope?scope[id]:MATH[id]));
  if(typeof r!=='number'||!isFinite(r))throw new Error(`"${s}" is not a finite number`);
  return r;
}
export function resolveParams(params){
  const scope={},errors={};
  for(const p of params||[]){try{scope[p.name]=evalExpr(p.expr,scope);}catch(e){errors[p.name]=e.message;scope[p.name]=0;}}
  return{scope,errors};
}
