const MATH={PI:Math.PI,pi:Math.PI,e:Math.E,sqrt:Math.sqrt,abs:Math.abs,min:Math.min,max:Math.max,pow:Math.pow,round:Math.round,floor:Math.floor,ceil:Math.ceil,exp:Math.exp,log:Math.log,sin:d=>Math.sin(d*Math.PI/180),cos:d=>Math.cos(d*Math.PI/180),tan:d=>Math.tan(d*Math.PI/180),asin:x=>Math.asin(x)*180/Math.PI,acos:x=>Math.acos(x)*180/Math.PI,atan:x=>Math.atan(x)*180/Math.PI,atan2:(y,x)=>Math.atan2(y,x)*180/Math.PI,hypot:Math.hypot};
const fnCache=new Map(),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function compile(s){
  const bad=()=>new Error(`bad expression "${s}"`),T=[],re=/\s*(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|\*\*|[-+*/%^(),])/y;
  for(let p=0;p<s.length;){re.lastIndex=p;const m=re.exec(s);if(!m){if(/^\s*$/.test(s.slice(p)))break;throw bad();}T.push(m[1]);p=re.lastIndex;}
  let i=0;const peek=()=>T[i],eat=t=>T[i]===t?(i++,true):false,need=t=>{if(!eat(t))throw bad();};
  const primary=()=>{const t=T[i++];if(t===undefined)throw bad();
    if(/^[\d.]/.test(t)){const v=+t;return()=>v;}
    if(/^[A-Za-z_]/.test(t)){if(eat('(')){const a=[];if(!eat(')')){do a.push(add());while(eat(','));need(')');}return sc=>{const f=MATH[t];if(!own(MATH,t)||typeof f!=='function')throw new Error(`"${t}" is not a function in "${s}"`);return f(...a.map(g=>g(sc)));};}return sc=>own(sc,t)?sc[t]:MATH[t];}
    if(t==='('){const e=add();need(')');return e;}
    throw bad();};
  const pow=()=>{const b=primary();if(eat('^')||eat('**')){const e=unary();return sc=>Math.pow(b(sc),e(sc));}return b;};
  const unary=()=>{if(eat('-')){const u=unary();return sc=>-u(sc);}if(eat('+'))return unary();return pow();};
  const mul=()=>{let l=unary();for(;;){const o=peek();if(o!=='*'&&o!=='/'&&o!=='%')return l;i++;const r=unary(),a=l;l=o==='*'?sc=>a(sc)*r(sc):o==='/'?sc=>a(sc)/r(sc):sc=>a(sc)%r(sc);}};
  function add(){let l=mul();for(;;){const o=peek();if(o!=='+'&&o!=='-')return l;i++;const r=mul(),a=l;l=o==='+'?sc=>a(sc)+r(sc):sc=>a(sc)-r(sc);}}
  const f=add();if(i<T.length)throw bad();return f;
}
export function evalExpr(v,scope){
  if(typeof v==='number')return v;
  if(typeof v==='boolean')return v?1:0;
  const s=String(v??'').trim();if(!s)return 0;
  if(/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(s))return +s;
  if(!/^[\w\s+\-*/%^().,]*$/.test(s))throw new Error(`bad expression "${s}"`);
  for(const id of new Set(s.match(/[A-Za-z_]\w*/g)||[]))if(!own(scope,id)&&!own(MATH,id))throw new Error(`unknown name "${id}" in "${s}"`);
  let f=fnCache.get(s);
  if(!f){f=compile(s);fnCache.set(s,f);}
  const r=f(scope);
  if(typeof r!=='number'||!isFinite(r))throw new Error(`"${s}" is not a finite number`);
  return r;
}
export function resolveParams(params,units){
  const scope={mm:units==='in'?1/25.4:1,inch:units==='in'?1:25.4},errors={};
  for(const p of params||[]){try{scope[p.name]=evalExpr(p.expr,scope);}catch(e){errors[p.name]=e.message;scope[p.name]=0;}}
  return{scope,errors};
}
