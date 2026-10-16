import {featureDocs,MATS} from './schema.js';
export const ENGINES={anthropic:'Claude (Anthropic)',openai:'OpenAI',gemini:'Google Gemini',openrouter:'OpenRouter (sign in: Claude, GPT, Gemini, Grok…)',browser:'On this device (Amni-LLM, private)',local:'Local or custom server (Ollama, LM Studio, any OpenAI-compatible URL)',chrome:'Chrome built-in AI'};
export const CLOUD={anthropic:{base:'https://api.anthropic.com/v1',keyUrl:'https://console.anthropic.com/settings/keys',prefer:['claude-opus-5-5','claude-sonnet-5-5','claude-fable-5-1','claude-haiku-5-5']},openai:{base:'https://api.openai.com/v1',keyUrl:'https://platform.openai.com/api-keys',prefer:[/^gpt-5(\.\d+)?$/,/^gpt-5/,/^o\d/,/^gpt-4\.1$/,/^gpt-4o$/]},gemini:{base:'https://generativelanguage.googleapis.com/v1beta',keyUrl:'https://aistudio.google.com/apikey',prefer:[/gemini-[\d.]+-pro$/,/gemini-[\d.]+-pro/,/gemini-[\d.]+-flash$/,/gemini/]},openrouter:{base:'https://openrouter.ai/api/v1',keyUrl:'https://openrouter.ai/keys',prefer:[/^anthropic\/claude-opus-5/,/^anthropic\/claude-sonnet-5/,/^anthropic\/claude/,/^openai\/gpt-5/,/^google\/gemini/]}};
function pick(ids,prefer){for(const p of prefer){const hit=ids.filter(id=>typeof p==='string'?id===p:p.test(id)).sort().reverse()[0];if(hit)return hit;}return ids[0];}
export async function openRouterLogin(){const v=b64u(crypto.getRandomValues(new Uint8Array(48))),ch=b64u(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))));sessionStorage.setItem('amnicad.or.v',v);location.href='https://openrouter.ai/auth?callback_url='+encodeURIComponent(location.origin+location.pathname)+'&code_challenge='+ch+'&code_challenge_method=S256';}
export async function openRouterCallback(){const u=new URL(location.href),code=u.searchParams.get('code'),v=sessionStorage.getItem('amnicad.or.v');if(!code||!v)return null;sessionStorage.removeItem('amnicad.or.v');u.searchParams.delete('code');history.replaceState(null,'',u.pathname+u.search+u.hash);const r=await fetch('https://openrouter.ai/api/v1/auth/keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,code_verifier:v,code_challenge_method:'S256'})});if(!r.ok)throw new Error('OpenRouter sign-in failed ('+r.status+')');return(await r.json()).key;}
export const wire=(ms,k)=>ms.map(m=>({role:m.role,content:!m.images||!m.images.length||k==='text'?m.content:k==='anthropic'?[...m.images.map(i=>({type:'image',source:{type:'base64',media_type:i.mime,data:i.b64}})),{type:'text',text:m.content}]:k==='gemini'?[{text:m.content},...m.images.map(i=>({inline_data:{mime_type:i.mime,data:i.b64}}))]:[{type:'text',text:m.content},...m.images.map(i=>({type:'image_url',image_url:{url:'data:'+i.mime+';base64,'+i.b64}}))]}));
function b64u(u){let s='';for(const b of u)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function systemPrompt(units){const inch=units==='in';return `You are the design assistant inside Amni-CAD, a parametric 3D CAD app. Lengths are in the document units, which are ${inch?'INCHES':'MILLIMETERS'}; Z is up. If the user gives sizes in other units, convert them (1 in = 25.4 mm). In expressions the constants mm and inch convert, e.g. 6*mm in an inch document. Simulation inputs are always SI: force N, pressure MPa, torque N·mm, temperature °C, heat W (1 lbf = 4.448 N, 1 psi = 0.006895 MPa, °C = (°F − 32)/1.8). When you talk to the user, give imperial units first and metric in parentheses, and use US spelling. You change the model by replying with ONE JSON object and nothing else:
{"say":"one or two friendly sentences for the user","actions":[ ... ]}
Actions (applied in order):
 {"add":{feature}}                       append a feature (give it a short "name", never an "id")
 {"set":{"id":"f3", "field":value,...}}  change fields of an existing feature
 {"param":{"name":"w","expr":"120"}}     create or change a parameter; expr may use other parameters
 {"delete":"f3"}                         remove a feature
 {"new":true}                            empty the model first (only when the user wants a new part)
 {"material":"al6061"}                   set the material
 {"sim":{"type":"static","fixed":[face selector],"supports":[{"faces":sel,"type":"fixed"|"roller"}],"loads":[{"faces":sel,"F":[fx,fy,fz]} | {"faces":sel,"p":MPa} | {"faces":sel,"M":[mx,my,mz] N·mm torque}],"gravity":true,"mesh":"auto"|"voxel"|"sweep"|"adaptive","layers":2,"size":mm}}  set up a stress test (N, mm, MPa). mesh: auto (default) uses voxels for chunky parts and switches to a hex mesh when walls are thinner than about 3 voxels; sweep = hex layers through sheet, extruded or formed walls (layers >= 2 through the thickness, size = in-plane element size); adaptive = graded octree hex mesh for general solids with thin ribs. A roller support may add "dir":"x"|"y"|"z" to hold only that direction. mesh, layers and size also apply to modal and thermal
 {"sim":{"type":"modal","modes":6,"supports":[...]}}  natural frequencies (no supports = free part)
 {"sim":{"type":"thermal","temps":[{"faces":sel,"T":°C}],"conv":[{"faces":sel,"h":W/m²K,"Tinf":°C}],"flux":[{"faces":sel,"Q":W}]}}  steady heat flow
 {"run":"fea"}                           run the stress analysis
 {"flow":{"fluid":"air","speed":10,"dir":"+X"}}  set up a wind/water tunnel test (speed in m/s, dir = flow direction)
 {"run":"flow"}                          run the flow analysis (drag, pressure, streamlines)
Numbers may be expressions of parameters such as "w/2-8". Angles are degrees. Trig functions take degrees.
Feature types (type: fields):
${featureDocs()}
Profiles ("shapes") are 2D shapes in sketch coordinates: rect{x,y,w,h,r}, circle{x,y,r}, poly{x,y,r,n}, slot{x,y,l,h}, path{pts:[[x,y],...]}, ellipse{x,y,rx,ry,a}, spline{pts:[[x,y],...]} (smooth closed), text{x,y,text,h}. A shape with "hole":true is subtracted from the others.
Holes: prefer standard sizes with "std":"M3".."M20" and "fit":"clearance"|"tapped"|"cbore"|"csink" instead of raw diameters. Threads are real modeled ISO threads (slow to build, so use them only when asked). For springs use coil. For pipes, rails or handles use sweep with a path. For transitions between two outlines use loft.
Sketch planes: "XY" top (normal +Z), "XZ" front (sketch x = world X, sketch y = world Z), "YZ" right (sketch x = world Y, sketch y = world Z). "offset" moves the plane along its normal. plane "face" plus "face":{"side":"+Z"} sketches on a flat face of the part.
References: the request may include sketches, photos or drawings the user attached (images, PDF pages, the user's notes and text read from PDFs). They are the base for the model. Dimensions written on a reference are authoritative, and a user note such as "top view, units inches" overrides what you infer. Otherwise estimate proportions from the image, put every guessed size in a named parameter, and list your assumptions in "say". Match views to sketch planes: top view = XY, front view = XZ, right view = YZ. For orthographic drawings, read the title block first for units, scale and material, and follow the projection (third angle is the US default).
Hole: drills from its sketch plane against the normal, so put the plane on the top surface (e.g. plane "XY", offset = part height).
Edge selectors: {"by":"all"}, {"dir":"Z"} straight edges parallel to Z, {"side":"+Z"} edges on the top, {"type":"CIRCLE"} round edges, {"by":"pick","pts":[[x,y,z]]} the edge nearest each point. A list of selectors means "any of them".
Face selectors: {"side":"+Z"} outermost face on that side, {"normal":"-Y"} faces pointing that way, {"type":"CYLINDER"}, {"by":"pick","pts":[[x,y,z]]}.
op: "add" union, "cut" subtract, "intersect".
Materials: ${Object.entries(MATS).map(([k,m])=>k+' ('+m.n+')').join(', ')}.
Rules: base solids first, then cuts and holes, then fillets and chamfers last. Keep fillets smaller than half the thinnest wall. Put key dimensions in parameters. Only use feature ids that exist in the model state. If the user only asks a question, answer in "say" with an empty actions list.
Example request: a 80 x 50 x 6 plate with four 5 mm holes 8 mm from the edges and rounded corners
Example reply: {"say":"Here is an 80 × 50 × 6 mm plate with four Ø5 holes and 5 mm corner radii.","actions":[{"param":{"name":"w","expr":"80"}},{"param":{"name":"d","expr":"50"}},{"param":{"name":"t","expr":"6"}},{"add":{"type":"box","name":"Plate","w":"w","d":"d","h":"t"}},{"add":{"type":"hole","name":"Holes","plane":"XY","offset":"t","d":5,"thru":true,"pts":[["w/2-8","d/2-8"],["-(w/2-8)","d/2-8"],["w/2-8","-(d/2-8)"],["-(w/2-8)","-(d/2-8)"]]}},{"add":{"type":"fillet","name":"Corners","r":5,"edges":{"dir":"Z"}}}]}`;}
export function stateMessage(st,text,refs){return 'Model state:\n'+JSON.stringify(st)+'\n\n'+(refs?refs+'\n\n':'')+'User request: '+text+'\n\nReply with the JSON object only. /no_think';}
export function parseReply(txt){
  let s=String(txt||'').replace(/<think>[\s\S]*?<\/think>/g,'').replace(/```(?:json)?/g,'');
  const a=s.indexOf('{');if(a<0)return{say:s.trim(),actions:[]};
  let depth=0,inStr=false,esc=false,end=-1;
  for(let i=a;i<s.length;i++){const c=s[i];if(inStr){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')inStr=false;continue;}if(c==='"')inStr=true;else if(c==='{')depth++;else if(c==='}'){depth--;if(!depth){end=i;break;}}}
  const body=end>0?s.slice(a,end+1):s.slice(a);
  for(const cand of[body,body.replace(/,\s*([}\]])/g,'$1'),body.replace(/'/g,'"').replace(/,\s*([}\]])/g,'$1')]){try{const o=JSON.parse(cand);return{say:String(o.say||o.message||''),actions:Array.isArray(o.actions)?o.actions:[]};}catch{}}
  return{say:s.trim().slice(0,800),actions:[],parseError:true};
}
export class Assistant{
  constructor(onStatus){this.onStatus=onStatus||(()=>{});this.kind=null;this.engine=null;this.cfg={};}
  get ready(){return!!this.kind;}
  get vision(){return!!this.kind&&this.kind!=='browser'&&this.kind!=='chrome'&&!this.noVision;}
  async connect(kind,cfg={}){
    this.kind=null;this.cfg=cfg;this.noVision=false;
    if(kind==='browser'){
      if(this.engine&&this.engine.unload)try{await this.engine.unload();}catch{}
      const m=await import('/lib/amni-llm/amni-llm.js');
      this.engine=await m.createEngine(cfg.model||'Qwen3.5-4B-Q4_K_M',{onProgress:p=>this.onStatus('Downloading model '+(p.pct??'')+'%',p.pct),onStatus:(s,msg)=>this.onStatus(msg||s)});
      const info=this.engine.getModelInfo&&this.engine.getModelInfo();this.label=(info&&info.name||cfg.model)+' · '+(info&&info.backend==='amni-wgpu'?'GPU':'CPU');
    }else if(CLOUD[kind]){
      const C=CLOUD[kind];if(!cfg.key)throw new Error('paste an API key first'+(kind==='openrouter'?' or sign in with OpenRouter':''));this.cfg.base=C.base;
      const hd=this.cloudHeaders(kind,cfg.key),url=kind==='gemini'?C.base+'/models?pageSize=200':C.base+'/models'+(kind==='anthropic'?'?limit=100':'');
      const r=await fetch(url,{headers:hd}).catch(e=>{throw new Error('could not reach '+kind+' ('+e.message+')');});
      if(kind==='openrouter'){const kr=await fetch(C.base+'/key',{headers:hd}).catch(()=>null);if(!kr||!kr.ok)throw new Error('OpenRouter rejected the key'+(kr?' ('+kr.status+')':'')+'. Sign in again or check it at '+C.keyUrl);}
      if(r.status===401||r.status===403||r.status===400&&kind==='gemini')throw new Error('the key was rejected ('+r.status+'). Check it at '+C.keyUrl);if(!r.ok)throw new Error(kind+' answered '+r.status);
      const j=await r.json();let ids=kind==='gemini'?(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>m.name.replace(/^models\//,'')):(j.data||[]).map(m=>m.id);
      if(kind==='openai')ids=ids.filter(id=>/^(gpt|o\d|chatgpt)/.test(id)&&!/audio|realtime|image|tts|transcribe|search|embedding|instruct/.test(id));
      if(!ids.length)throw new Error('no chat models available on this key');this.models=ids;if(!this.cfg.model||!ids.includes(this.cfg.model))this.cfg.model=pick(ids,C.prefer);this.label=this.cfg.model+' · '+(kind==='openrouter'?'OpenRouter':kind==='anthropic'?'Anthropic':kind==='openai'?'OpenAI':'Google');
    }else if(kind==='local'){
      const base=(cfg.base||'http://localhost:11434/v1').replace(/\/+$/,'');this.cfg.base=base;
      const r=await fetch(base+'/models',{headers:this.hdr()}).catch(e=>{throw new Error('could not reach '+base+' ('+e.message+'). Is the server running, and does it allow this site? For Ollama set OLLAMA_ORIGINS=https://amni-scient.com');});
      if(!r.ok)throw new Error('server answered '+r.status);
      const j=await r.json().catch(()=>({data:[]})),ids=(j.data||j.models||[]).map(x=>x.id||x.name).filter(Boolean);
      if(!this.cfg.model)this.cfg.model=ids[0];if(!this.cfg.model)throw new Error('no models on the server; pull one first (e.g. ollama pull qwen3:8b)');
      this.models=ids;this.label=this.cfg.model+' · '+base.replace(/^https?:\/\//,'');
    }else if(kind==='chrome'){
      const LM=globalThis.LanguageModel||(globalThis.ai&&globalThis.ai.languageModel);
      if(!LM)throw new Error('this browser has no built-in AI (Chrome with Gemini Nano)');
      const av=LM.availability?await LM.availability():'available';if(av==='unavailable')throw new Error('built-in AI is unavailable on this device');
      this.engine=LM;this.label='Chrome built-in AI';
    }else throw new Error('unknown engine');
    this.kind=kind;this.onStatus('Ready · '+this.label);return this.label;
  }
  cloudHeaders(kind,key){const h={'Content-Type':'application/json'};if(kind==='anthropic'){h['x-api-key']=key;h['anthropic-version']='2023-06-01';h['anthropic-dangerous-direct-browser-access']='true';}else if(kind==='gemini')h['x-goog-api-key']=key;else{h.Authorization='Bearer '+key;if(kind==='openrouter'){h['HTTP-Referer']='https://amni-scient.com/cad/';h['X-Title']='Amni-CAD';}}return h;}
  hdr(){const h={'Content-Type':'application/json'};if(this.cfg.key)h.Authorization='Bearer '+this.cfg.key;return h;}
  async complete(messages){
    if(this.kind==='browser')return await this.engine.chat(wire(messages,'text'),{max_tokens:1800,temperature:0.2});
    if(this.kind==='anthropic'){
      const sys=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n'),msgs=wire(messages.filter(m=>m.role!=='system'),'anthropic');
      const r=await fetch(this.cfg.base+'/messages',{method:'POST',headers:this.cloudHeaders('anthropic',this.cfg.key),body:JSON.stringify({model:this.cfg.model,max_tokens:8000,system:sys,messages:msgs})});
      if(!r.ok)throw new Error('Claude error '+r.status+' '+(await r.text()).slice(0,240));const j=await r.json();return(j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('');
    }
    if(this.kind==='gemini'){
      const sys=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n'),contents=wire(messages.filter(m=>m.role!=='system'),'gemini').map(m=>({role:m.role==='assistant'?'model':'user',parts:Array.isArray(m.content)?m.content:[{text:m.content}]}));
      const r=await fetch(this.cfg.base+'/models/'+encodeURIComponent(this.cfg.model)+':generateContent',{method:'POST',headers:this.cloudHeaders('gemini',this.cfg.key),body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents,generationConfig:{responseMimeType:'application/json'}})});
      if(!r.ok)throw new Error('Gemini error '+r.status+' '+(await r.text()).slice(0,240));const j=await r.json();return((j.candidates||[])[0]?.content?.parts||[]).map(p=>p.text||'').join('');
    }
    if(this.kind==='openai'||this.kind==='openrouter'){
      const body={model:this.cfg.model,messages:wire(messages,'openai'),response_format:{type:'json_object'}},send=()=>fetch(this.cfg.base+'/chat/completions',{method:'POST',headers:this.cloudHeaders(this.kind,this.cfg.key),body:JSON.stringify(body)});
      let r=await send();if(r.status===400){const t=await r.text();if(/response_format|json_object/i.test(t)){delete body.response_format;r=await send();}else throw new Error('API error 400 '+t.slice(0,240));}
      if(!r.ok)throw new Error('API error '+r.status+' '+(await r.text()).slice(0,240));const j=await r.json();return j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content||'';
    }
    if(this.kind==='local'){
      const img=!this.noVision&&messages.some(m=>m.images&&m.images.length),body={model:this.cfg.model,messages:wire(messages,img?'openai':'text'),temperature:0.2,stream:false,response_format:{type:'json_object'}},go=()=>fetch(this.cfg.base+'/chat/completions',{method:'POST',headers:this.hdr(),body:JSON.stringify(body)});
      let r=await go();if(r.status===400){delete body.response_format;r=await go();}if(!r.ok&&img){body.messages=wire(messages,'text');r=await go();if(r.ok)this.noVision=true;}
      if(!r.ok)throw new Error('server error '+r.status+' '+(await r.text()).slice(0,200));
      const j=await r.json();return j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content||'';
    }
    if(this.kind==='chrome'){const sys=messages.find(m=>m.role==='system'),rest=wire(messages.filter(m=>m.role!=='system'),'text');const s=await this.engine.create({initialPrompts:[{role:'system',content:sys.content},...rest.slice(0,-1)]});try{return await s.prompt(rest[rest.length-1].content);}finally{s.destroy&&s.destroy();}}
    throw new Error('connect an AI engine first');
  }
}
