import {startE2E} from './e2e_lib.mjs';
export const STUB=()=>{
  const F=window.fetch.bind(window),enc=new TextEncoder(),J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
  window.__calls=[];window.__model=null;
  const tx=m=>typeof m.content==='string'?m.content:Array.isArray(m.content)?m.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'):(m.parts||[]).map(p=>p.text||'').join('\n'),im=m=>[...(Array.isArray(m.content)?m.content:[]),...(m.parts||[])].filter(c=>c.type==='image'||c.type==='image_url'||c.inline_data).map(c=>c.source?c.source.media_type:c.inline_data?c.inline_data.mime_type:'image/*'),
    sse=(t,mk)=>new Response(new ReadableStream({async start(c){const n=4,k=Math.max(1,Math.ceil(t.length/n));for(let i=0;i<t.length;i+=k){await new Promise(r=>setTimeout(r,20));c.enqueue(enc.encode(mk(t.slice(i,i+k))));}c.close();}}),{status:200,headers:{'content-type':'text/event-stream'}});
  window.fetch=async(u,o={})=>{
    const s=String(u&&u.url||u);if(!/anthropic\.com|openai\.com|googleapis\.com|openrouter\.ai|localhost:/.test(s))return F(u,o);
    if(/\/models/.test(s)&&!/:generate|:stream/.test(s))return/generativelanguage/.test(s)?J({models:[{name:'models/gemini-3-pro',supportedGenerationMethods:['generateContent']},{name:'models/gemini-3-flash',supportedGenerationMethods:['generateContent']}]}):/localhost:11434/.test(s)?J({data:[{id:'qwen3:8b'},{id:'qwen2.5vl:7b'}]}):/anthropic/.test(s)?J({data:[{id:'claude-sonnet-5-5'},{id:'claude-opus-5-5'},{id:'claude-haiku-5-5'}]}):J({data:[{id:'gpt-5'},{id:'gpt-4o'}]});
    if(/\/key$/.test(s))return J({data:{}});
    const b=o.body?JSON.parse(o.body):{},raw=b.messages||b.contents||[],msgs=raw.map(m=>({role:m.role,text:tx(m),images:im(m)})),an=/anthropic/.test(s),gm=/generativelanguage/.test(s);
    window.__calls.push({u:s,msgs,stream:!!b.stream||/stream/.test(s),system:typeof b.system==='string'?b.system:b.systemInstruction?tx(b.systemInstruction):(msgs.find(m=>m.role==='system')||{}).text||''});
    const idx=window.__calls.length;let r=window.__model?window.__model({msgs,call:idx,calls:window.__calls}):{say:'ok',actions:[]};
    if(r&&typeof r.then==='function')r=await new Promise((res,rej)=>{o.signal&&o.signal.addEventListener('abort',()=>rej(new DOMException('aborted','AbortError')));r.then(res,rej);});
    if(o.signal&&o.signal.aborted)throw new DOMException('aborted','AbortError');
    const body=typeof r==='string'?r:JSON.stringify(r),st=!!b.stream||/stream/.test(s);
    if(st)return sse(body,t=>an?'event: content_block_delta\ndata: '+JSON.stringify({type:'content_block_delta',delta:{text:t}})+'\n\n':gm?'data: '+JSON.stringify({candidates:[{content:{parts:[{text:t}]}}]})+'\n\n':'data: '+JSON.stringify({choices:[{delta:{content:t}}]})+'\n\n');
    return an?J({content:[{type:'text',text:body}]}):gm?J({candidates:[{content:{parts:[{text:body}]}}]}):J({choices:[{message:{content:body}}]});
  };
};
export async function boot({engine='anthropic',model,key='sk-ant-good',width=1280,height=800,extra={},stub=true}={}){
  const E=await startE2E({width,height});
  stub&&await E.page.evaluateOnNewDocument(STUB);
  const kind={anthropic:'anthropic',openai:'openai',gemini:'gemini',local:'local'}[engine]||'anthropic',cfg={kind,model:'x',base:'http://localhost:11434/v1',lmodel:model||'',remember:true,cm:model&&kind!=='local'?{[kind]:model}:{},chosen:true,...extra};
  await E.page.evaluate((c,k,kd)=>{localStorage.setItem('amnicad.ai',JSON.stringify(c));kd!=='local'&&localStorage.setItem('amnicad.key.'+kd,k);},cfg,key,kind);
  await E.page.reload();
  await E.page.waitForFunction(()=>window.amnicad&&window.amnicad.S.kernel&&window.amnicad.API.assistant,{timeout:150000,polling:150});
  await E.page.evaluate(()=>{window.amnicad.API.setTab('ai');window.amnicad.API.showPanel('R');});
  await E.sleep(800);
  const ev=(f,...a)=>E.page.evaluate(f,...a),until=async(f,a,ms=30000)=>{const t=Date.now();while(Date.now()-t<ms){if(await ev(f,a))return true;await E.sleep(100);}return false;};
  const send=async(text,ms=90000)=>{const n0=await ev(()=>window.amnicad.S.chat.length);await ev(t=>{const i=document.querySelector('#ai-in');i.value=t;document.querySelector('#ai-send').click();},text);await until(n=>window.amnicad.S.aiBusy||window.amnicad.S.chat.length>n,n0,8000);await until(()=>!window.amnicad.S.aiBusy,null,ms);};
  return{...E,ev,until,send,calls:()=>ev(()=>window.__calls),chat:()=>ev(()=>window.amnicad.S.chat.map(m=>({role:m.role,text:m.text,thumb:!!m.thumb,reply:m.reply,card:m.card&&m.card.items.length}))),model:fn=>ev(f=>{window.__model=new Function('return '+f)();},fn.toString()),reset:()=>ev(()=>{window.__calls&&(window.__calls.length=0);window.__model=null;})};
}
