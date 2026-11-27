const MODS=new Map(),N=Number,TY={f64:Float64Array,f32:Float32Array,i32:Int32Array,u8:Uint8Array};
const bytes=async u=>u.protocol==='file:'?(await import('node:fs/promises')).readFile(u):new Uint8Array(await(await fetch(u)).arrayBuffer());
const mod=name=>MODS.get(name)||(MODS.set(name,bytes(new URL('./'+name+'.wasm',import.meta.url)).then(b=>WebAssembly.compile(b))),MODS.get(name));
const memOf=m=>{const s=new Uint8Array(WebAssembly.Module.customSections(m,'he.mem')[0]||new ArrayBuffer(5)),initial=s[0]|s[1]<<8|s[2]<<16|s[3]<<24;for(const maximum of[65536,16384])try{return Object.assign(new WebAssembly.Memory({initial,maximum}),{mx:maximum*65536});}catch(e){if(maximum===16384)throw e;}};
const make=(name,m,env,sync)=>{
  const mem=memOf(m),holes=[],err=[],V=new Map(),u8=()=>new Uint8Array(mem.buffer),td=new TextDecoder();
  const mmap=l=>{l=Math.ceil(l/65536)*65536;const k=holes.findIndex(h=>h[1]>=l);if(k>=0){const[a,n]=holes[k];n===l?holes.splice(k,1):holes[k]=[a+l,n-l];u8().fill(0,a,a+l);return a;}try{return mem.grow(l/65536)*65536;}catch{return-12;}};
  const sys=(n,a,b,c)=>{switch(N(n)){case 1:{const t=td.decode(u8().subarray(N(b),N(b)+N(c))).replace(/\n$/,'');N(a)===2?(err.push(t),err.length>7&&err.shift(),console.error(t)):console.log(t);return c;}case 9:return BigInt(mmap(N(b)));case 97:return N(a)===9?BigInt(mem.mx):-38n;case 11:{const p=N(a),l=Math.ceil(N(b)/65536)*65536;if(p%65536===0&&l>0)holes.push([p,l]);return 0n;}case 28:if(N(c)===4)u8().fill(0,N(a),N(a)+N(b));return 0n;case 228:{const t=performance.now()*1e6,w=new DataView(mem.buffer),p=N(b);w.setBigInt64(p,BigInt(Math.floor(t/1e9)),true);w.setBigInt64(p+8,BigInt(Math.floor(t%1e9)),true);return 0n;}case 60:case 231:throw new Error(name+': Helium exited with '+N(a)+(err.length?': '+err.join(' ').replace(/^helium runtime error: /,''):''));case 2:case 4:return-2n;default:return 0n;}};
  const views=Object.fromEntries(WebAssembly.Module.imports(m).map(i=>/_view_(f64|f32|i32|u8)$/.exec(i.name)).filter(Boolean).map(r=>[r.input,(id,p,l)=>V.set(N(id),[TY[r[1]],N(p)>>>0,N(l)>>>0])]));
  const imp={env:{sys,memory:mem,...views,...env}},fin=i=>{i.exports.he_start(0n);const v=id=>{const[T,p,l]=V.get(id);return new T(mem.buffer,p,l);};return{ex:i.exports,mem,v,put:(id,a)=>v(id).set(a),into:(id,a)=>a.set(v(id)),get:id=>v(id).slice()};};
  return sync?fin(new WebAssembly.Instance(m,imp)):WebAssembly.instantiate(m,imp).then(fin);
};
const NAT=new Map();export const setNative=(name,f)=>f?NAT.set(name,f):NAT.delete(name);
export const helium=name=>async(env={})=>NAT.has(name)&&NAT.get(name)(env)||make(name,await mod(name),env,false);
export const heliumSync=async name=>{const m=await mod(name);return(env={})=>make(name,m,env,true);};
