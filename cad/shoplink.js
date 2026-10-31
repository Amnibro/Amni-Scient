const K='amnicad.shoplink',MAX=262144;
const b64u=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=s=>{const b=atob(s.replace(/-/g,'+').replace(/_/g,'/'));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
const pipe=async(bytes,S)=>new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new S('deflate-raw'))).arrayBuffer());
export function get(){try{return sessionStorage.getItem(K)||'';}catch{return'';}}
export function set(t){try{sessionStorage.setItem(K,t);}catch{}}
export function name(){try{const o=JSON.parse(get());return typeof o.name==='string'?o.name.slice(0,80):'';}catch{return'';}}
export function diff(text,base){const o=JSON.parse(text);if(!o||typeof o!=='object'||Array.isArray(o))throw new Error('Shop rates must be a JSON object');const out={};for(const k of Object.keys(o))if(!base||JSON.stringify(o[k])!==JSON.stringify(base[k]))out[k]=o[k];if(base&&base.name&&!('name' in out))out.name=o.name||base.name;return out;}
export async function link(text,base){const o=diff(text,base);return location.origin+location.pathname+'#shop='+b64u(await pipe(new TextEncoder().encode(JSON.stringify(o)),CompressionStream));}
export const embed=url=>'<iframe src="'+url.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" title="Instant quote" width="100%" height="760" style="border:0;max-width:1400px" allow="clipboard-write"></iframe>';
export async function boot(){const m=/(?:^#|&)shop=([\w-]+)/.exec(location.hash);if(!m)return false;
  try{if(m[1].length>MAX)throw new Error('too large');const t=new TextDecoder().decode(await pipe(unb64u(m[1]),DecompressionStream)),o=JSON.parse(t);if(!o||typeof o!=='object'||Array.isArray(o))throw new Error('not an object');set(JSON.stringify(o));}
  catch{return'bad';}
  try{const rest=location.hash.replace(/(?:^#|&)shop=[\w-]+/,'').replace(/^&/,'');history.replaceState(null,'',location.pathname+location.search+(rest?'#'+rest:''));}catch{}
  return true;}
