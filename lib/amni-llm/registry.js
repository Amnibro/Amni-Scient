export const DEFAULT_MODELS={
'Qwen3-0.6B-Q4_K_M':{name:'Qwen3 0.6B',hfRepo:'Qwen/Qwen3-0.6B-GGUF',hfFile:'Qwen3-0.6B-Q4_K_M.gguf',sizeMB:480,ctx:32768,quant:'Q4_K_M',tier:'mobile',speedHint:'fastest',blurb:'Latest Qwen, mobile-friendly. Best small SOTA in 2025.'},
'Qwen3-4B-Q4_K_M':{name:'Qwen3 4B',hfRepo:'Qwen/Qwen3-4B-GGUF',hfFile:'Qwen3-4B-Q4_K_M.gguf',sizeMB:2500,ctx:32768,quant:'Q4_K_M',tier:'balanced',speedHint:'medium',blurb:'Sweet spot for general chat on a typical desktop.'},
'DeepSeek-R1-Distill-Qwen-7B-Q4_K_M':{name:'DeepSeek-R1 Distill 7B',hfRepo:'bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF',hfFile:'DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',sizeMB:4700,ctx:131072,quant:'Q4_K_M',tier:'reasoning',speedHint:'slow',blurb:'Strongest in-browser reasoning available right now.'},
'Qwen2.5-Math-7B-Q4_K_M':{name:'Qwen2.5 Math 7B',hfRepo:'Qwen/Qwen2.5-Math-7B-Instruct-GGUF',hfFile:'qwen2.5-math-7b-instruct-q4_k_m.gguf',sizeMB:4700,ctx:4096,quant:'Q4_K_M',tier:'math',speedHint:'slow',blurb:'Math/engineering specialist. Recommended for the calc surface.'}
};
const INSTALLED_KEY='amni-llm-installed';
export function getInstalled(){try{return JSON.parse(localStorage.getItem(INSTALLED_KEY)||'{}');}catch{return{};}}
export function saveInstalled(m){const all=getInstalled();all[m.id]=m;localStorage.setItem(INSTALLED_KEY,JSON.stringify(all));return all;}
export function removeInstalled(id){const all=getInstalled();delete all[id];localStorage.setItem(INSTALLED_KEY,JSON.stringify(all));return all;}
export function getModel(id){if(DEFAULT_MODELS[id])return{id,...DEFAULT_MODELS[id],source:'default',hfUrl:hfResolve(DEFAULT_MODELS[id].hfRepo,DEFAULT_MODELS[id].hfFile)};const inst=getInstalled();if(inst[id])return{...inst[id],source:'installed'};return null;}
export function listAll(){const out=Object.entries(DEFAULT_MODELS).map(([id,m])=>({id,...m,source:'default',hfUrl:hfResolve(m.hfRepo,m.hfFile)}));const inst=getInstalled();Object.values(inst).forEach(m=>out.push({...m,source:'installed'}));return out;}
export function hfResolve(repo,file){return`https://huggingface.co/${repo}/resolve/main/${file}`;}
export async function hfSearchModels(query,limit=20){const u=`https://huggingface.co/api/models?search=${encodeURIComponent(query)}&library=gguf&limit=${limit}&full=false`;const r=await fetch(u);if(!r.ok)throw new Error('HF search failed: '+r.status);return await r.json();}
export async function hfListGgufFiles(repoId){const u=`https://huggingface.co/api/models/${repoId}/tree/main?recursive=true`;const r=await fetch(u);if(!r.ok)throw new Error('HF tree failed: '+r.status);const tree=await r.json();return tree.filter(t=>t.type==='file'&&/\.gguf$/i.test(t.path)).map(t=>({path:t.path,sizeBytes:t.size||0,sizeMB:Math.round((t.size||0)/1048576),quant:detectQuant(t.path)}));}
function detectQuant(p){const m=p.match(/(Q\d_[A-Z0-9_]+|Q\d_K_[A-Z]+|Q\d_K|Q\d|F16|F32|BF16|IQ\d_[A-Z0-9]+)/i);return m?m[1].toUpperCase():'?';}
