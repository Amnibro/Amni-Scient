import {CLOUD,systemPrompt,stateMessage,parseReply,pastePrompt,openRouterLogin,detectKey,probeLocal,explainError,prettyModel,partialSay} from './ai.js';
import * as REFS from './refs.js';
import * as AISEE from './aisee.js';
const CSS=`#tab-ai.on{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.as-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:9px 10px 4px 12px;flex:none}
.as-chip{flex:1;min-width:0;display:flex;align-items:center;gap:7px;padding:6px 11px;border:1px solid var(--line2);border-radius:calc(99px*var(--rk,1));background:var(--bg2);color:var(--ink);font-size:12.5px;text-align:left}
.as-chip:hover{border-color:var(--acc)}
.as-q{order:9;flex:1 1 100%;min-width:0;padding:5px 7px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2);color:var(--ink);font-size:12px}
.as-chip .d{width:8px;height:8px;border-radius:50%;background:var(--mut);flex:none}
.as-chip.ok .d{background:var(--ok)}.as-chip.wait .d{background:var(--warn)}.as-chip.bad .d{background:var(--err)}
.as-chip .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.as-chip .s{color:var(--mut);white-space:nowrap}
.as-chip u{color:var(--acc);text-decoration:none;font-weight:600;white-space:nowrap}
.as-ib{flex:none;width:30px;height:30px;border-radius:calc(8px*var(--rk,1));color:var(--mut);font-size:14px;display:inline-flex;align-items:center;justify-content:center}
.as-ib:hover{background:var(--acc-soft);color:var(--ink)}
.as-exp,.as-back,.as-info{display:none}
.as-ib svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@media (max-width:699px){.as-exp,.as-info{display:inline-flex}
.as-head{padding:3px 6px 1px 10px}
#tab-ai:not(.as-n-open) .as-note,.as-st p{display:none}
#tab-ai .chips{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;max-height:none;scrollbar-width:none}
#tab-ai .chips button{flex:none}
#right:not([data-snap=tall]):not([data-snap=full]) #tab-ai.as-has .chips{display:none}
#right:not([data-snap=tall]):not([data-snap=full]):has(#tab-ai.on) .rtabs{display:none}}
body.form-mode .as-back,body.asm-mode .as-back,body.tool-mode .as-back{display:inline-flex}
.as-note{padding:0 12px 6px;font-size:11.5px;color:var(--mut);line-height:1.4;flex:none;max-height:38%;overflow-y:auto}
.as-note summary{display:inline;cursor:pointer;color:var(--acc);margin-left:4px}
.as-note details[open] summary{display:block;margin:4px 0 0}
@media (pointer:coarse){.as-note summary{display:inline-flex;align-items:center;min-height:44px;padding:0 8px}}
.as-note details p{margin:5px 0 0}
.as-prog{height:3px;border-radius:2px;background:var(--line);overflow:hidden;margin:2px 12px 4px;display:none;flex:none}
.as-prog i{display:block;height:100%;background:var(--acc);width:0}
.as-setup{flex:1;min-height:0;overflow-y:auto;padding:4px 12px 12px;display:none}
#tab-ai.as-su .as-setup{display:block}
#tab-ai.as-su #chat,#tab-ai.as-su .chips,#tab-ai.as-su .as-ctx,#tab-ai.as-su .compose,#tab-ai.as-su .as-th{display:none}
#tab-ai.as-br .chips,#tab-ai.as-br .as-ctx,#tab-ai.as-br .compose,#tab-ai.as-br .as-th{display:none}
.as-st h3{margin:6px 0 2px;font-size:15px;color:var(--ink)}
.as-st p{margin:0 0 10px;color:var(--mut);font-size:12.5px}
.as-opt{border:1px solid var(--line);border-radius:calc(11px*var(--rk,1));background:var(--bg2);margin-bottom:8px;overflow:hidden}
.as-opt.on{border-color:var(--acc)}
.as-oh{display:grid;gap:2px;width:100%;padding:11px 14px 11px 12px;text-align:left;background:none;color:var(--ink);position:relative}
.as-oh b{font-size:13.5px;padding-right:52px}
.as-oh small{color:var(--mut);font-size:12px;line-height:1.35}
.as-oh em{position:absolute;right:10px;top:10px;font-style:normal;font-size:11px;color:var(--ok);font-weight:700}
.as-ob{padding:2px 12px 12px;display:grid;gap:9px;font-size:12.5px;line-height:1.45}
.as-ob p{margin:0}
.as-cmd{display:flex;gap:6px;align-items:flex-start}
.as-cmd pre{flex:1;min-width:0;margin:0;white-space:pre-wrap;word-break:break-all;background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:7px 9px;font:11.5px/1.4 var(--mono);user-select:all}
.as-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.as-dot{width:9px;height:9px;border-radius:50%;background:var(--mut);flex:none}
.as-dot.ok{background:var(--ok)}.as-dot.wait{background:var(--acc)}.as-dot.warn{background:var(--warn)}
.as-det{color:var(--mut);font-size:12px}
.as-links{color:var(--mut);font-size:12px}
.as-links a,.as-ob a{color:var(--acc)}
.as-more summary{cursor:pointer;color:var(--acc);font-size:12.5px}
.as-more>*+*{margin-top:8px}
.as-srv{display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding:7px 9px;border:1px solid var(--line);border-radius:9px;background:var(--panel)}
.as-srv b{flex:1;min-width:90px}
.as-err{border-color:var(--err)!important}
.as-err b{display:block;color:var(--err);margin-bottom:2px}
.msg.a .as-t{white-space:pre-wrap}
.msg.live .as-t:empty+.as-dots{display:inline}
.as-dots{display:none;color:var(--mut)}
.msg.live::after{content:'';display:inline-block;width:7px;height:13px;margin-left:2px;vertical-align:-2px;background:var(--acc);opacity:.7;animation:asb 1s steps(2) infinite}
@keyframes asb{50%{opacity:0}}
#tab-ai .msg,#tab-ai .as-card,#tab-ai .as-card *{overflow-wrap:anywhere;min-width:0}
.as-card{margin-top:8px;border:1px solid var(--line2);border-radius:calc(9px*var(--rk,1));background:var(--bg2);overflow:hidden}
.as-it{display:flex;gap:8px;align-items:flex-start;width:100%;padding:6px 9px;text-align:left;font-size:12px;line-height:1.35;color:var(--ink2);border-bottom:1px solid var(--line)}
.as-it:hover{background:var(--acc-soft)}
.as-it i{font-style:normal;width:14px;flex:none;text-align:center;color:var(--acc);font-weight:700}
.as-it.del i{color:var(--err)}
.as-ca{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:6px 8px}
.as-card .as-ca{background:var(--panel)}
.as-ua{display:flex;gap:6px;justify-content:flex-end;margin-top:-4px}
.as-ua button{font-size:11.5px;color:var(--mut);padding:2px 7px;border-radius:7px}
.as-ua button:hover{color:var(--ink);background:var(--acc-soft)}
.as-iss{margin-top:7px;padding:7px 9px;border:1px solid var(--err);border-radius:8px;font-size:12px;color:var(--ink2)}
.as-iss b{color:var(--err)}
.as-ctx{display:flex;gap:5px;flex-wrap:wrap;padding:0 12px 6px;flex:none}
.as-ctx:empty,.as-th:empty,.chips:empty{display:none}
.as-ctx:not(:empty)::before{content:'Context';color:var(--mut);font-size:11px;align-self:center;margin-right:2px}
.as-th span{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;padding:2px 3px 2px 2px;border-radius:99px;background:var(--acc-soft);color:var(--ink);border:1px solid var(--line2)}
.as-ctx button{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;padding:3px 9px;border-radius:99px;background:var(--acc-soft);color:var(--ink);border:1px solid var(--line2)}
.as-ctx button:hover{border-color:var(--acc)}
.as-ctx button b{color:var(--mut);font-weight:400;font-size:13px;line-height:1}
.as-th button.x{width:22px;height:22px;border-radius:50%;color:var(--mut);font-size:13px;line-height:1;display:inline-flex;align-items:center;justify-content:center}
.as-th{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 6px;flex:none}
.as-th img{width:26px;height:26px;object-fit:cover;border-radius:6px;background:#fff}
.as-th b{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.as-th button.th{display:inline-flex;align-items:center;gap:5px;color:inherit}
#tab-ai .chips{flex:none;max-height:92px;overflow-y:auto;padding-top:2px}
#tab-ai #chat{min-height:0}
#tab-ai .compose{flex:none;align-items:flex-end;position:relative;padding:8px 10px;gap:6px}
#tab-ai .compose textarea{height:auto;min-height:44px;max-height:132px;line-height:1.4;width:100%}
.as-ta{flex:1;min-width:0;position:relative;display:flex}
.as-clip{flex:none;width:40px;height:40px;border-radius:calc(9px*var(--rk,1));color:var(--mut);display:inline-flex;align-items:center;justify-content:center}
.as-clip:hover{background:var(--acc-soft);color:var(--ink)}
.as-clip svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.as-ac{position:absolute;left:0;right:0;bottom:calc(100% + 5px);background:var(--panel);border:1px solid var(--line2);border-radius:10px;box-shadow:var(--shadow);padding:4px;z-index:5;max-height:210px;overflow-y:auto}
.as-ac button{display:flex;gap:8px;justify-content:space-between;width:100%;padding:6px 9px;border-radius:7px;text-align:left;font-size:12.5px;color:var(--ink)}
.as-ac button.on,.as-ac button:hover{background:var(--acc-soft)}
.as-ac small{color:var(--mut);font-size:11.5px}
#tab-ai #ai-send.stop{background:var(--err);border-color:var(--err);color:#fff}
.as-refs{flex:none;border-top:1px solid var(--line)}
.as-refs>summary{cursor:pointer;padding:7px 12px;font-size:12px;color:var(--acc)}
.as-refs:not(.has)>summary{display:none}
.as-refs #refs{border-bottom:0;max-height:42vh;overflow-y:auto}
body.ask-on.form-mode #right>*:not(#tab-ai):not(.m-grab),body.ask-on.asm-mode #right>*:not(#tab-ai):not(.m-grab),body.ask-on.tool-mode #right>*:not(#tab-ai):not(.m-grab){display:none!important}
html body.ask-on.form-mode #right>#tab-ai.on,html body.ask-on.asm-mode #right>#tab-ai.on,html body.ask-on.tool-mode #right>#tab-ai.on{display:flex!important}
html body.ask-on.form-mode #right,html body.ask-on.asm-mode #right,html body.ask-on.tool-mode #right{display:flex!important}
.feat.as-flash{animation:asf 1.4s}
@keyframes asf{0%,70%{box-shadow:0 0 0 2px var(--acc)}100%{box-shadow:0 0 0 2px transparent}}
.as-chk{display:flex;align-items:center;gap:6px;padding:2px 12px 4px;font-size:11.5px;color:var(--mut);flex:none;cursor:pointer}
.as-chk input{margin:0}
#tab-ai.as-su .as-chk,#tab-ai.as-br .as-chk,#tab-ai.as-pm .as-chk{display:none}
.msg.as-pz{display:grid;gap:7px;max-width:100%}
.as-pz .as-row a{color:var(--acc)}
.as-pz textarea{width:100%;min-height:64px;resize:vertical;font:12px/1.4 var(--mono)}
.as-lnk{justify-self:start;background:none;border:0;padding:0;color:var(--acc);font-size:12px;cursor:pointer;text-decoration:underline}
@media (max-width:699px){#right:not([data-snap=tall]):not([data-snap=full]) #tab-ai .as-chk{display:none}}
.msg.s.as-look{display:flex;gap:8px;align-items:center;text-align:left}
.as-look img{width:92px;flex:none;border-radius:6px;border:1px solid var(--line2);background:#eef1f5}
@media (prefers-reduced-motion:reduce){.msg.live::after,.feat.as-flash{animation:none}}`;
const CK='amnicad.chat.',IK='amnicad.chat.idx',LEN=/^(w|d|h|r|t|l|len|depth|dist|offset|height|width|wall|dia|rx|ry|rc|od|id|x|y|z|thk|thick|size)$/,SW={anthropic:'Anthropic',openai:'OpenAI',gemini:'Google',openrouter:'OpenRouter'};
const lget=k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}},lset=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v));}catch{}};
let A,H,S,h,el=null,cur=null,HP=null;const V={pick:null,setup:false,err:null,busy:null,msg:'',pct:null,probe:null,sig:'',csp:0,ctl:null,ac:null,kk:'',rs:'',tab:'edit',ts:0,open:{}};
const q=s=>document.querySelector(s),$=s=>el&&el.querySelector(s),slot=()=>S.slot||'default',lbl=s=>s.charAt(0).toUpperCase()+s.slice(1);
const keep=()=>S.chat.filter(m=>!m.live&&m.role!=='err').slice(-70).map(m=>({role:m.role,text:String(m.text||'').slice(0,6000),issues:m.issues,card:m.card&&{items:m.card.items,t:m.card.t},...(m.reply?{reply:String(m.reply).slice(0,4000)}:{}),...(m.hist?{hist:String(m.hist).slice(0,1500)}:{}),...(m.thumb&&S.chat.indexOf(m)>=S.chat.length-9?{thumb:m.thumb}:{})}));
function save(){const k=CK+slot();lset(k,{m:keep()});const ix=(lget(IK)||[]).filter(x=>x!==k);ix.push(k);while(ix.length>30)lset(ix.shift(),null);lset(IK,ix);}
function sync(){if(cur===slot())return;cur=slot();S.chat=((lget(CK+cur)||{}).m||[]).map(m=>({...m}));}
const bst=()=>H.bridge.state(),isBr=()=>H.cfg.kind==='bridge'||H.cfg.kind==='remote';
const configured=()=>{const k=H.cfg.kind;return k==='browser'?false:CLOUD[k]?!!H.keys.get(k):k==='local'?!!(H.cfg.lmodel||H.cfg.chosen):isBr()?!!H.cfg.chosen||bst().on:!!H.cfg.chosen;};
const bridgeMode=()=>isBr()&&configured()&&!H.AI.ready,showSu=()=>V.setup||!H.AI.ready&&!configured();
const fx=(e,k)=>explainError(e,k,Date.now()-V.csp<4000&&(e&&e.kind==='net'||e instanceof TypeError));
const kcfg=k=>k==='browser'?{model:H.cfg.model}:k==='local'?{base:H.cfg.base,model:H.cfg.lmodel,key:H.cfg.key}:CLOUD[k]?{key:H.keys.get(k),model:H.cfg.cm[k]}:{};
async function connect0(k){V.busy=k;V.err=null;paint();try{await H.AI.connect(k,kcfg(k));CLOUD[k]&&(H.cfg.cm[k]=H.AI.cfg.model);H.cfg.chosen=true;H.cfg.kind=k;H.save();V.setup=false;V.pick=null;}catch(e){V.err=fx(e,k);V.setup=true;throw e;}finally{V.busy=null;paint();}}
export async function connect(k){try{await connect0(k||H.cfg.kind);return true;}catch{return false;}}
const autoConnect=async()=>H.AI.ready||!V.busy&&configured()&&!isBr()&&await connect(H.cfg.kind);
export function useEngine(k,c){H.cfg.kind=k;c&&Object.assign(H.cfg,c);H.save();paint();}
export function status(m){V.msg=m||'';const p=/(\d+)%/.exec(V.msg);V.pct=p?+p[1]:null;if(!el)return;paintChip();el.querySelectorAll('.as-prog').forEach(b=>{b.style.display=V.pct!=null?'block':'none';b.firstChild.style.width=(V.pct||0)+'%';});}
export function bridge(st){if(!el)return;if(st&&st.state==='connected'&&(V.setup&&V.pick==='app'||!H.AI.ready&&!configured())){const c=((st.clients||[])[0])||'your app';H.AI.kind=null;H.cfg.kind=H.cfg.kind==='remote'?'remote':'bridge';H.cfg.chosen=true;H.save();V.setup=false;V.pick=null;A.toast('Connected to '+c,3000);}paint();}
async function useKey(raw){const key=String(raw||'').trim(),k=detectKey(key);if(!key)return;if(!k){V.err={kind:'key',title:'That does not look like an API key',detail:'Keys start with sk-ant- (Anthropic), sk-or- (OpenRouter), sk- (OpenAI), or AQ. or AIza (Google).',fix:null};return paint();}H.keys.set(k,key);try{await connect0(k);A.toast('Connected to '+SW[k]+' · '+prettyModel(H.AI.cfg.model),3200);}catch(e){V.err&&V.err.kind==='key'&&H.keys.set(k,'');paint();}}
const copy=(t,msg)=>(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t):Promise.reject()).catch(()=>{const x=h('textarea',{style:'position:fixed;opacity:0'});x.value=t;document.body.append(x);x.select();const k=document.execCommand('copy');x.remove();if(!k)throw new Error('copy failed');}).then(()=>(A.toast(msg||'Copied',3600),true),()=>(A.toast('Select the text and copy it'),false));
const dt=(k,a,...kids)=>h('details',{...a,open:V.open[k]??a.open,ontoggle:e=>{V.open[k]=e.target.open;}},...kids),CHATS=[['Claude','https://claude.ai/new'],['ChatGPT','https://chatgpt.com/'],['Gemini','https://gemini.google.com/app']],pzK=()=>'amnicad.paste.'+slot(),hs=s=>{let x=5381;for(let i=0;i<s.length;i++)x=(x*33^s.charCodeAt(i))>>>0;return x.toString(36);};
function pasteTurn(ms,{signal}={}){return new Promise((res,rej)=>{const m=S.chat.filter(x=>x.live).pop(),sig=hs(ms.filter(x=>x.role==='system').map(x=>x.content).join('\n')),seen=()=>lset(pzK(),sig);if(!m)return rej(new Error('nothing is waiting for a reply'));const P=m.paste={full:pastePrompt(ms,true),short:pastePrompt(ms,false),fresh:lget(pzK())!==sig,val:'',seen,done:t=>{P.fresh&&seen();m.paste=null;res(t);}};signal&&signal.addEventListener('abort',()=>{m.paste=null;rej(Object.assign(new Error('stopped'),{name:'AbortError'}));},{once:true});paintChat();});}
function pasteEl(m){const P=m.paste,f=P.fresh,use=()=>{const t=ta.value.trim();t?P.done(t):A.toast('Paste the reply first');},cp=full=>copy(full?P.full:P.short,full?'Copied. Paste it into a new chat.':'Copied. Paste it into the same chat.').then(k=>k&&full&&P.seen()),ta=h('textarea',{class:'inp',id:'ai-paste',rows:'3',placeholder:'Paste the whole reply here. It is used as soon as you paste.','aria-label':'Reply from your chat app',oninput:e=>{P.val=e.target.value;},onpaste:()=>setTimeout(()=>/\{/.test(ta.value)&&use(),0)}),rd=navigator.clipboard&&navigator.clipboard.readText;ta.value=P.val;
  return h('div',{class:'msg a as-pz'},h('b',null,f?'1. Copy this into a new Claude, ChatGPT or Gemini chat':'1. Copy this into the same chat'),h('div',{class:'mut'},f?'It carries the Amni-CAD instructions (about '+Math.round(P.full.length/1000)+' kB), the part and your request. After this, each turn is short.':'Only your new request and the updated part.'),h('div',{class:'as-row'},h('button',{class:'btn sm pri',id:'ai-pz-copy',onclick:()=>cp(f)},'Copy'),h('span',{class:'mut'},'then open'),...CHATS.map(([n,u],i)=>[i?'·':'',h('a',{href:u,target:'_blank',rel:'noopener',onclick:()=>cp(f)},n)])),f?null:h('button',{class:'as-lnk',id:'ai-pz-full',onclick:()=>cp(true)},'Starting a new chat? Copy the full version'),h('b',null,'2. Paste the whole reply here'),ta,h('div',{class:'as-row'},h('button',{class:'btn sm pri',id:'ai-pz-use',onclick:use},'Use this reply'),rd?h('button',{class:'btn sm',onclick:()=>navigator.clipboard.readText().then(t=>{ta.value=t;P.val=t;use();},()=>A.toast('Paste it into the box instead'))},'Paste from clipboard'):null));}
const loadHelp=()=>HP||(HP=import('./bridge.js').then(m=>{HP=m.bridgeHelp();paintSetup();return HP;}).catch(()=>{HP=null;}));
function probe(){V.probe={busy:true};probeLocal().then(r=>{V.probe={list:r};paintSetup();});}
function choose(id){V.pick=id;id==='app'&&(!bst().on&&H.bridge.on(true),loadHelp());id==='local'&&probe();paintSetup();}
export function openSetup(id,keep){V.setup=true;V.err=keep?V.err:null;el&&paint();open({focus:false});id&&choose(id);}
const fixes=m=>({key:[['Change key',()=>openSetup('key')],['Get a key',()=>window.open((CLOUD[H.cfg.kind]||CLOUD.anthropic).keyUrl,'_blank','noopener')]],retry:[['Try again',()=>retryLast()]],model:[['Choose another model',()=>openSetup(null,true)]],local:[['Check this computer',()=>openSetup('local')],['Try again',()=>retryLast()]],bridge:[['Set it up',()=>openSetup('app')]]}[m.fix]||[]);
const errEl=(m,cls)=>h('div',{class:(cls||'')+' as-err',role:'alert'},h('b',null,m.title),m.detail?h('div',null,m.detail):null,fixes(m).length?h('div',{class:'as-ca'},...fixes(m).map(([t,f],i)=>h('button',{class:'btn sm'+(i?'':' pri'),onclick:f},t))):null);
const cmdRow=c=>h('div',{class:'as-cmd'},h('pre',null,c.text),h('button',{class:'btn sm',id:'ai-copy',onclick:()=>copy(c.text)},'Copy'));
function appBody(){const b=bst(),st=b.st||{},dk=window.amnicadDesktop,col=st.state==='connected'?'ok':st.state==='need-code'?'warn':st.state==='off'?'':'wait',code=h('input',{class:'inp',id:'ai-code',inputmode:'numeric',maxlength:'7',placeholder:'6-digit code',style:'width:130px;letter-spacing:.2em;font-family:var(--mono)',onkeydown:e=>e.key==='Enter'&&b.pair(code.value.trim())});
  return[h('p',null,'Connect it once and your Claude, ChatGPT, Grok, Gemini, Codex or opencode app can build in this page while you watch. Your subscription and keys stay in your app.'),dk?h('div',{class:'as-row'},h('button',{class:'btn sm pri',onclick:()=>dk.setupAI('claude').then(t=>A.toast(t)).catch(e=>A.toast(String(e)))},'Add to Claude Code'),h('button',{class:'btn sm',onclick:()=>dk.setupAI('codex').then(t=>A.toast(t)).catch(e=>A.toast(String(e)))},'Add to Codex')):HP&&HP.clients?cmdRow(HP.clients[0]):h('div',{class:'mut'},'Loading the setup command…'),
    h('div',{class:'as-row',id:'ai-bstat'},h('span',{class:'as-dot '+col}),h('span',null,st.text||'Waiting for your app')),st.state==='need-code'?h('div',{class:'as-row'},code,h('button',{class:'btn pri sm',onclick:()=>b.pair(code.value.trim())},'Pair'),h('button',{class:'btn sm ghost',onclick:()=>b.forget()},'Forget pairing')):null,
    dk?null:h('div',{class:'as-row'},h('button',{class:'btn sm',id:'ai-mcpb',onclick:e=>{const b=e.currentTarget;b.disabled=true;import('./bridge.js').then(m=>m.saveMcpb()).then(()=>A.toast('Open Amni-CAD.mcpb to add it to Claude Desktop, click Install, then ask Claude to check the Amni-CAD connection',7000),x=>A.toast('Could not build the extension: '+x.message,5200)).finally(()=>{b.disabled=false;});}},'Get the Claude Desktop extension'),h('span',{class:'mut'},'One file, no Node.js or connector needed')),
    dt('more',{class:'as-more',open:(()=>{try{return localStorage.getItem('amnicad.relay.on')==='1';}catch{return false;}})()},h('summary',null,'Other apps, or an AI app on my phone (Claude, ChatGPT, Grok)'),H.bridge.card(),H.bridge.remote()),
    h('div',{class:'as-links'},'Can\'t add a connector or install anything? ',h('a',{href:'#',id:'ai-pz-link',onclick:e=>{e.preventDefault();choose('paste');}},'Use copy and paste'),' with any chat, on any plan.')];}
function pasteBody(){return[h('p',null,'For when you can\'t add a connector or install anything. Each request becomes a message you copy into Claude, ChatGPT or Gemini, on the web or the phone app. Paste the reply back here and the change is applied. It takes a few more taps than a connector, but it works on every plan, including free and work accounts.'),h('div',{class:'as-row'},h('button',{class:'btn pri sm',id:'ai-pz-go',disabled:!!V.busy,onclick:()=>connect0('paste').catch(()=>{})},'Use copy and paste'))];}
function orBody(){const have=!!H.keys.get('openrouter');return[h('span',null,'Sign in once with OpenRouter and pay as you go. '),h('div',{class:'as-row'},h('button',{class:'btn pri sm',id:'ai-or',onclick:()=>{A.store.set('amnicad.doc',S.doc);openRouterLogin();}},have?'Sign in again with OpenRouter':'Sign in with OpenRouter'),have?h('button',{class:'btn sm',onclick:()=>useKey(H.keys.get('openrouter'))},'Use my saved login'):null)];}
function keyBody(){const dt=h('div',{class:'as-det',id:'ai-detect'},'Claude, OpenAI, Gemini and OpenRouter keys are recognized by how they start.'),inp=h('input',{id:'ai-key',type:'password',class:'inp',placeholder:'Paste your key here',autocomplete:'off',spellcheck:'false',oninput:()=>det(),onpaste:()=>setTimeout(()=>{det();detectKey(inp.value)&&go();},0),onkeydown:e=>e.key==='Enter'&&go()}),det=()=>{const k=detectKey(inp.value);dt.textContent=!inp.value.trim()?'Claude, OpenAI, Gemini and OpenRouter keys are recognized by how they start.':k?'Looks like '+(/^[AEIOU]/.test(SW[k])?'an ':'a ')+SW[k]+' key. I will pick the best model for it.':'Not recognized yet. Keys start with sk-ant-, sk-or-, sk- or AIza.';},go=()=>useKey(inp.value);
  return[inp,dt,h('div',{class:'as-row'},h('button',{class:'btn pri sm',id:'ai-keygo',disabled:!!V.busy,onclick:go},V.busy&&CLOUD[V.busy]?'Checking…':'Connect'),h('label',{class:'as-row',style:'gap:6px;font-size:12px'},h('input',{type:'checkbox',checked:!!H.cfg.remember,onchange:e=>{H.cfg.remember=e.target.checked;H.save();}}),'Remember on this device')),
    h('div',{class:'as-links'},'Get a key: ',...Object.keys(SW).flatMap((k,i)=>[i?' · ':'',h('a',{href:CLOUD[k].keyUrl,target:'_blank',rel:'noopener'},SW[k])])),h('div',{class:'as-links'},'Have Claude Pro/Max or ChatGPT Plus instead? Use the app option above.')];}
function localBody(){const P=V.probe||{},LM=globalThis.LanguageModel||(globalThis.ai&&globalThis.ai.languageModel);
  return[h('p',null,'Nothing you type leaves this computer. Local models are slower and less capable than Claude or GPT, so expect simpler parts.'),
    h('div',{class:'as-row'},h('b',null,'Ollama or LM Studio'),h('button',{class:'btn sm ghost',onclick:probe},'Check again')),
    P.busy?h('div',{class:'mut'},'Looking on this computer…'):(P.list||[]).length?h('div',{class:'as-ob',style:'padding:0'},...P.list.map(s=>{const sel=h('select',{class:'inp',style:'max-width:150px','aria-label':s.name+' model'},...(s.models.length?s.models:['']).map(x=>h('option',{value:x},x||'first model')));return h('div',{class:'as-srv','data-srv':s.name},h('b',null,s.name+' found'),s.models.length>1?sel:h('span',{class:'mut'},s.models[0]||'no models yet'),h('button',{class:'btn sm pri',onclick:()=>{H.cfg.base=s.base;H.cfg.lmodel=s.models.length>1?sel.value:s.models[0]||'';connect0('local').catch(()=>{});}},'Use'));})):h('div',{class:'mut'},'Neither answered on this computer. Start one (Ollama needs OLLAMA_ORIGINS=https://amni-scient.com), then check again.'),
    LM?h('div',{class:'as-row'},h('b',null,'Chrome built-in AI'),h('button',{class:'btn sm',onclick:()=>connect0('chrome').catch(()=>{})},'Use'),h('span',{class:'mut'},'small, instant, offline')):null,
    dt('srv',{class:'as-more'},h('summary',null,'Another server address'),h('div',{class:'fld'},h('label',null,'Server URL'),h('input',{type:'text',value:H.cfg.base,onchange:e=>{H.cfg.base=e.target.value.trim();H.save();}})),h('div',{class:'fld'},h('label',null,'Model'),h('input',{type:'text',value:H.cfg.lmodel,placeholder:'first model on server',onchange:e=>{H.cfg.lmodel=e.target.value.trim();H.save();}})),h('button',{class:'btn sm',onclick:()=>connect0('local').catch(()=>{})},'Connect'),h('div',{class:'mut'},'Works with Ollama (http://localhost:11434/v1, start it with OLLAMA_ORIGINS=https://amni-scient.com), LM Studio (http://localhost:1234/v1) or any OpenAI-compatible server on your machine or network.'))];}
function setupEl(){const k=H.AI.kind,ready=H.AI.ready,used={app:isBr()&&!ready,key:ready&&['anthropic','openai','gemini','openrouter'].includes(k),local:ready&&['local','browser','chrome'].includes(k),paste:ready&&k==='paste'},O=(id,t,d,b)=>h('div',{class:'as-opt'+(V.pick===id?' on':''),'data-o':id},h('button',{class:'as-oh',id:'ai-o-'+id,'aria-expanded':String(V.pick===id),onclick:()=>choose(V.pick===id?null:id)},h('b',null,t),h('small',null,d),used[id]?h('em',null,'In use'):null),V.pick===id?h('div',{class:'as-ob'},...b()):null),back=ready||configured();
  return[h('div',{class:'as-st'},h('h3',null,back?'Switch AI':'Connect an AI'),h('p',null,back?'Pick one. Your choice is remembered.':'Pick one to start. You can switch any time from the chip at the top.')),V.err?errEl(V.err,'msg a'):null,
    ready&&H.AI.models&&H.AI.models.length>1?h('div',{class:'fld'},h('label',null,'Model'),h('select',{id:'ai-model','aria-label':'Model',onchange:e=>pickModel(H.AI.kind+'|'+e.target.value)},...H.AI.models.map(x=>h('option',{value:x,selected:x===H.AI.cfg.model},x)))):null,
    O('app','Use your AI app','Claude, ChatGPT, Gemini, Copilot, Grok, Cursor and more. Your subscription works, no key to paste.',appBody),O('key','Use an API key','Claude, OpenAI, Gemini or OpenRouter.',()=>[...keyBody(),h('div',{class:'as-or'},h('b',null,'No key? '),...orBody())]),O('local','Free and private','Ollama or LM Studio on this computer.',localBody),O('paste','Copy and paste','Any chat app on any plan, even free or work accounts. No connector, no install.',pasteBody),
    back?h('button',{class:'btn sm ghost',id:'ai-back',onclick:()=>{V.setup=false;V.err=null;paint();}},'Back to chat'):null];}
function paintSetup(){const s=$('.as-setup');if(!s)return;const keep=[...s.querySelectorAll('input[id]')].map(i=>[i.id,i.value,i===document.activeElement]);s.replaceChildren(...setupEl().filter(Boolean));for(const[id,v,f]of keep){const i=$('#'+id);i&&v&&(i.value=v,f&&i.focus());}}
function chipEl(){const b=bridgeMode(),st=bst().st||{},ok=H.AI.ready||b&&st.state==='connected',busy=V.busy,nm=busy?(V.msg||'Connecting…'):H.AI.ready?(H.AI.kind==='browser'||H.AI.kind==='chrome'?H.AI.label:prettyModel(H.AI.cfg.model)||H.AI.label):b?(st.state==='connected'?(st.clients||['Your app'])[0]:'Your AI app'):V.err&&configured()?'Not connected':'No AI connected',sw=busy?'':ok?(H.AI.ready&&H.AI.kind==='paste'?'ready':'connected'):b?'waiting':configured()?'not connected':'';
  return h('button',{id:'ai-chip',class:'as-chip '+(busy?'wait':ok?'ok':V.err&&configured()||b?'wait':'bad'),title:'Change the AI engine','aria-label':'AI engine: '+nm+(sw?', '+sw:'')+'. Change',onclick:()=>{V.setup?(V.setup=false,paint()):openSetup();}},h('span',{class:'d'}),h('span',{class:'t'},nm),sw?h('span',{class:'s'},'· '+sw):null,h('u',null,configured()||ok?'Change':'Connect'));}
function paintChip(){const o=$('#ai-chip');o&&o.replaceWith(chipEl());const q=$('#ai-quick'),n=quickEl(),c=$('#ai-chip');q?(n?q.replaceWith(n):q.remove()):n&&c&&c.after(n);}
function pickModel(v){const[k,m]=v.split('|');k===H.AI.kind&&H.AI.ready?(H.cfg.cm[k]=m,H.cfg.lmodel=k==='local'?m:H.cfg.lmodel,H.save(),H.AI.cfg.model=m,H.AI.label=m,paintChip(),paintSetup()):(m&&(H.cfg.cm[k]=m),connect0(k).catch(()=>{}));}
function quickEl(){const L=[...(H.AI.ready&&!bridgeMode()?(H.AI.models||[]).map(m=>[H.AI.kind+'|'+m,(SW[H.AI.kind]?SW[H.AI.kind]+' · ':'')+prettyModel(m)]):[]),...Object.keys(SW).filter(k=>k!==H.AI.kind&&H.keys.get(k)).map(k=>[k+'|'+(H.cfg.cm[k]||''),SW[k]+(H.cfg.cm[k]?' · '+prettyModel(H.cfg.cm[k]):'')])];return L.length>1&&!V.busy?h('select',{id:'ai-quick',class:'as-q','aria-label':'Switch model',title:'Switch model or provider',onchange:e=>pickModel(e.target.value)},...L.map(([v,t])=>h('option',{value:v,selected:v===H.AI.kind+'|'+H.AI.cfg.model},t))):null;}
const SEND='Each request carries your message and the part: its name, material, parameters, features, size, errors, the faces and edges you selected, and the latest stress, flow, mold, toolpath and G-code results. Attached references (notes, PDF text and, for engines that can see, the images) are included while their AI switch is on.';
function noteEl(){const k=H.AI.ready?H.AI.kind:configured()?H.cfg.kind:null,c=CLOUD[k],pn=SW[k],one=c?'Goes straight from this browser to '+pn+', never through Amni-Scient.':k==='browser'?'Runs on this device after a one-time download.':k==='local'?'Stays between this browser and your local server.':k==='chrome'?'Runs inside Chrome on this device.':k==='paste'?'You copy each request into your chat app and paste its reply back.':k&&isBr()?'Your app reaches this page through a connector on your computer.':'',full=c?['Your key and your requests go straight from this browser to '+pn+'. Amni-Scient never sees them. '+SEND,(k==='anthropic'||k==='openai'?'Claude Pro/Max and ChatGPT Plus subscriptions only work inside their own apps, so websites need an API key. OpenRouter is the one-login option. ':'')+'Get a key at '+c.keyUrl.replace(/^https:\/\//,'').split('/')[0]+'.']:k==='browser'?['The first use downloads the runtime from cdn.jsdelivr.net and the model from huggingface.co; neither file is checked against a published hash. After that the model runs on this device (WebGPU if available) and nothing you type is sent anywhere.']:k==='local'?['Requests go to the server address you set, on your machine or network, and nowhere else. '+SEND]:k==='chrome'?['Uses Gemini Nano built into Chrome where available. Small, but instant and fully offline.']:k==='paste'?['This page sends nothing. Each request you copy goes only where you paste it. '+SEND]:k&&isBr()?['Use the assistant you already pay for. Claude Code, Claude Desktop, Codex, Gemini CLI or Cursor drive this page through a tiny bridge on your computer, so your subscription and keys never touch this site. Your assistant sees the part when it asks for it.']:['Nothing is sent anywhere until you connect an AI. Cloud engines get your message and the part, local ones stay on your machine. '+SEND];
  return h('div',{class:'as-note'},one||'Nothing is sent until you connect an AI.',h('details',{class:'as-sent'},h('summary',null,"What's sent?"),...full.map(t=>h('p',null,t))));}
function paintNote(){const n=$('.as-note');n&&n.replaceWith(noteEl());}
const nm0=f=>(A.FT[f.type]||{n:f.type}).n,fnm=f=>nm0(f)+(f.name&&f.name!==nm0(f)?" '"+f.name+"'":''),fv=(k,v,u)=>v==null?'none':typeof v==='number'?+v.toFixed(4)+(LEN.test(k)?' '+u:''):typeof v==='string'?v:'…';
function diffDocs(a,b){const u=b.units==='in'?'in':'mm',ia=new Map(a.features.map(f=>[f.id,f])),ib=new Set(b.features.map(f=>f.id)),o=[],js=JSON.stringify;
  for(const f of b.features){const p=ia.get(f.id);if(!p){const d=['w','d','h','r','len','depth'].filter(k=>f[k]!=null&&typeof f[k]!=='object').slice(0,3).map(k=>k+' '+fv(k,f[k],u));o.push({k:'add',id:f.id,t:'Added '+fnm(f)+(d.length?' '+d.join(', '):'')});}else if(js(p)!==js(f)){const ch=[...new Set([...Object.keys(p),...Object.keys(f)])].filter(k=>k!=='id'&&js(p[k])!==js(f[k])),x=ch.slice(0,2).map(k=>typeof p[k]==='object'||typeof f[k]==='object'?k+' changed':k+' '+fv(k,p[k],u)+' → '+fv(k,f[k],u));o.push({k:'edit',id:f.id,t:'Edited '+fnm(f)+' '+x.join(', ')+(ch.length>2?' +'+(ch.length-2)+' more':'')});}}
  for(const f of a.features)ib.has(f.id)||o.push({k:'del',t:'Deleted '+fnm(f)});
  const pa=new Map((a.params||[]).map(p=>[p.name,p])),pb=new Map((b.params||[]).map(p=>[p.name,p]));
  for(const[n,p]of pb){const x=pa.get(n);x?x.expr!==p.expr&&o.push({k:'param',t:'Changed '+n+' '+x.expr+' → '+p.expr}):o.push({k:'param',t:'Added parameter '+n+' = '+p.expr});}
  for(const n of pa.keys())pb.has(n)||o.push({k:'param',t:'Removed parameter '+n});
  a.material!==b.material&&o.push({k:'set',t:'Material → '+((A.MATS[b.material]||{}).n||b.material)});js(a.finish||null)!==js(b.finish||null)&&o.push({k:'set',t:'Finish → '+(b.finish||'machined')});a.units!==b.units&&o.push({k:'set',t:'Units → '+b.units});
  return o;}
const cardItems=(before,applied)=>{const o=diffDocs(JSON.parse(before),S.doc),ex=applied.filter(x=>!/^(new part|param |\+|edit |delete |material|finish)/.test(x)).map(x=>({k:'run',t:lbl(x)}));return[...ex.filter(x=>/^Recipe /.test(x.t)),...o,...ex.filter(x=>!/^Recipe /.test(x.t))].slice(0,8).concat(o.length+ex.length>8?[{k:'set',t:'+'+(o.length+ex.length-8)+' more changes'}]:[]);};
function show(id){const f=S.doc.features.find(x=>x.id===id);if(!f)return A.toast('That feature no longer exists');A.active=id;const r=q('#tree .feat.on');r&&(r.scrollIntoView({block:'nearest'}),r.classList.add('as-flash'),setTimeout(()=>r.classList.remove('as-flash'),1400));}
function toggle(m){const c=m.card,want=c.undone?c.after:c.before,expect=c.undone?c.before:c.after;if(JSON.stringify(S.doc)!==expect){A.toast('The part changed since this message; use Undo in the toolbar instead',4200);return false;}A.commit(d=>{for(const k of Object.keys(d))delete d[k];Object.assign(d,JSON.parse(want));});c.undone=!c.undone;paintChat();return true;}
function cardEl(m){const c=m.card,live=c.before!=null,can=live&&JSON.stringify(S.doc)===(c.undone?c.before:c.after),ex=x=>x.id&&S.doc.features.some(f=>f.id===x.id),first=(c.items.find(x=>x.k==='add'&&ex(x))||c.items.find(ex)||{}).id;
  return h('div',{class:'as-card'},...c.items.map(x=>h('button',{class:'as-it '+x.k,title:x.id?'Show me':'',onclick:()=>x.id&&show(x.id)},h('i',null,{add:'+',edit:'✎',del:'−',param:'ƒ',run:'▶'}[x.k]||'•'),h('span',null,x.t))),h('div',{class:'as-ca'},live?h('button',{class:'btn sm as-undo',disabled:!can,title:can?'':'The part changed since this message. Use Undo in the toolbar.',onclick:()=>toggle(m)},c.undone?'Redo':'Undo'):null,first?h('button',{class:'btn sm ghost as-show',onclick:()=>show(first)},'Show me'):null,c.t?h('span',{class:'mut',style:'font-size:11.5px'},c.t):null));}
function msgEl(m,lastU){const u=m.role==='user';
  if(m.role==='err')return errEl(m,'msg a');
  if(m.role==='sys')return h('div',{class:'msg s'},m.text);
  if(m.role==='look')return lookEl(m);
  if(m.paste)return pasteEl(m);
  const b=h('div',{class:'msg '+(u?'u':'a')+(m.live?' live':'')},h('span',{class:'as-t'},m.text||''),m.live?h('span',{class:'as-dots'},'Thinking…'):null,m.card&&m.card.items.length?cardEl(m):null,m.issues&&m.issues.length?h('div',{class:'as-iss'},h('b',null,'Still not building. '),m.issues.join(' ')):null);m.live&&(m.node=b);
  return u&&lastU&&!S.aiBusy?h('div',{style:'display:contents'},b,h('div',{class:'as-ua'},h('button',{id:'ai-retry',onclick:()=>retryLast()},'Retry'),h('button',{id:'ai-edit',onclick:()=>retryLast(true)},'Edit and resend'))):b;}
function paintChat(){const c=$('#chat');if(!c)return;sync();el.classList.toggle('as-has',S.chat.length>0);if(bridgeMode()&&!showSu()){const st=bst().st||{};c.replaceChildren(h('div',{class:'msg a'},h('b',null,st.state==='connected'?'Connected to '+(st.clients||['your app'])[0]:'Waiting for your app'),h('div',null,'Ask in your AI app, for example "make this part 20% lighter and show me a screenshot". The changes appear here as you watch.'),!st.state||st.state!=='connected'?h('div',{class:'as-ca'},h('button',{class:'btn sm pri',onclick:()=>openSetup('app')},'Show setup'),h('span',{class:'mut'},st.text||'')):null));return;}
  const L=S.chat;if(!L.length){c.replaceChildren(h('div',{class:'msg s'},'Ask for a new part, or a change to this one. Every change can be undone. Type @ to point at a feature.'));return;}const lu=L.map(m=>m.role).lastIndexOf('user');c.replaceChildren(...L.map((m,i)=>msgEl(m,i===lu)));c.scrollTop=c.scrollHeight;}
function live(m,t){m.text=partialSay(t);V.ts||(V.ts=setTimeout(()=>{V.ts=0;const n=m.node&&m.node.querySelector('.as-t');if(n){n.textContent=m.text;const c=$('#chat');c&&(c.scrollTop=c.scrollHeight);}},40));}
const fl=n=>{const i=n?n.findIndex(v=>Math.abs(v)>0.9):-1;return i<0?null:[['Left','Right'],['Front','Back'],['Bottom','Top']][i][n[i]>0?1:0];};
function selChips(){const m=A.mesh,S2=S.sel;if(!m)return[];const o=[...S2.faces.keys()].slice(0,3).map(i=>{const f=m.faces[i]||{},d=/CYL|CONE|SPHERE|TORUS/i.test(f.type||'')?'Round':f.type&&!/PLANE/i.test(f.type)?'Curved':fl(f.n);return{t:(d||'Flat')+' face',rm:()=>{S2.faces.delete(i);A.refreshSel();}};});S2.faces.size>3&&o.push({t:'+'+(S2.faces.size-3)+' faces',rm:()=>{S2.faces.clear();A.refreshSel();}});S2.edges.size&&o.push({t:S2.edges.size+(S2.edges.size>1?' edges':' edge'),rm:()=>{S2.edges.clear();A.refreshSel();}});return o;}
function paintCtx(){const c=$('.as-ctx');if(!c)return;const L=selChips();c.replaceChildren(...L.map(x=>h('button',{class:'as-c','aria-label':'Remove '+x.t+' from the context',title:'Stop sending this',onclick:()=>{x.rm();paintCtx();paintSugg();}},x.t,h('b',null,'×'))));const ta=$('#ai-in');ta&&(ta.placeholder=L.length?'Ask about the '+L.map(x=>x.t.toLowerCase()).join(' and ')+'…':'Describe a part or change…');}
function suggestions(){const inch=A.units.docUnits(A.doc)==='in',nf=S.sel.faces.size,ne=S.sel.edges.size,F=S.doc.features,ws=A.ws,r=inch?'1/8 in':'3 mm',w=inch?'0.08 in':'2 mm',o=[],R=(S.doc.refs||[]).filter(x=>x.ai!==false);
  if(ws==='asm')return['Which parts interfere with each other?','List the bill of materials','Make this assembly lighter'].map(t=>({t}));if(ws==='form')return['Make the head a little bigger','Add a tail','Give it a friendlier face'].map(t=>({t}));if(ws==='tool')return['Is this part moldable? List the problems','Design the mold for this part','Add 2 degrees of draft to the walls'].map(t=>({t}));
  S.errors.length&&o.push({t:'Fix this error'});ne&&o.push({t:'Fillet '+(ne>1?'these '+ne+' edges ':'this edge ')+r});nf&&o.push({t:nf>1?'Add holes on these '+nf+' faces':'Add holes on this face'});S.lastFea&&o.push({t:'Make it lighter but keep FOS ≥ 2'});R.length&&o.push({t:'Model from my references',text:REFS.PROMPT,force:true});
  F.length?o.push({t:'Round all vertical edges '+r},{t:'Hollow it with '+w+' walls, open on top'},{t:'Add four '+(inch?'#10':'M5')+' mounting holes'},{t:'Test it with '+(inch?'50 lbf':'200 N')+' pushing down on the top'}):o.push(...(inch?['A 4 × 2 in bracket with two 1/4 in holes','A 3D-printable phone stand','A 2 in cube with a 1 in hole through it','A hex nut for a 3/8 in bolt']:['A 100 × 50 mm bracket with two 5 mm holes','A 3D-printable phone stand','A 50 mm cube with a 25 mm hole through it','A hex nut for an M10 bolt']).map(t=>({t})));
  return o.slice(0,4);}
function paintSugg(){const c=$('.chips');if(!c)return;c.replaceChildren(...suggestions().map(x=>h('button',{onclick:()=>send({text:x.text||x.t,force:x.force})},x.t)));}
const sigOf=()=>[...S.sel.faces.keys()].join()+'|'+[...S.sel.edges.keys()].join()+'|'+S.errors.length+'|'+(S.lastFea?1:0)+'|'+S.doc.features.length+'|'+(S.doc.refs||[]).filter(x=>x.ai!==false).length+'|'+A.ws+'|'+A.units.docUnits(A.doc);
function paintThumbs(){const t=$('.as-th'),R=S.doc.refs||[],sg=JSON.stringify(R.map(r=>r.id+r.ai+(REFS.thumb(r.id)?1:0))),d=$('.as-refs');if(d){d.classList.toggle('has',!!R.length);const s=d.firstChild;s&&(s.textContent='References ('+R.length+')');}if(!t||sg===V.rs&&t.childNodes.length===R.length)return;V.rs=sg;t.replaceChildren(...R.map(r=>h('span',{'data-id':r.id},h('button',{class:'th',title:'Manage references',onclick:()=>{const d2=$('.as-refs');d2&&(d2.open=true);}},REFS.thumb(r.id)?h('img',{src:REFS.thumb(r.id),alt:''}):null,h('b',null,String(r.name||'Reference'))),h('button',{class:'x','aria-label':'Remove '+r.name,onclick:()=>A.commit(d=>{d.refs=(d.refs||[]).filter(x=>x.id!==r.id);},{noEdit:true})},'×'))));}
function paintBusy(){const b=$('#ai-send');if(!b)return;b.textContent=S.aiBusy?'Stop':'Send';b.classList.toggle('stop',!!S.aiBusy);b.setAttribute('aria-label',S.aiBusy?'Stop the AI':'Send');}
function paint(){if(!el)return;sync();el.classList.toggle('as-has',S.chat.length>0);const su=showSu();el.classList.toggle('as-su',su);el.classList.toggle('as-br',bridgeMode()&&!su);el.classList.toggle('as-pm',H.AI.kind==='paste');const kk=H.cfg.kind+'|'+H.AI.kind;kk!==V.kk&&(V.kk=kk,REFS.redraw());paintChip();const nk=(H.AI.ready?H.AI.kind:H.cfg.kind)+(configured()?1:0);nk!==V.nk&&(V.nk=nk,paintNote());su?paintSetup():paintChat();paintSugg();paintCtx();paintThumbs();paintBusy();}
function mentionables(){return[...S.doc.features.map(f=>({key:String(f.name||nm0(f)).replace(/\s+/g,'_'),sub:nm0(f),id:f.id,kind:'feature'})),...S.doc.params.map(p=>({key:p.name,sub:'parameter = '+S.scope[p.name],kind:'param'}))];}
function mentionNote(text){const L=[...text.matchAll(/(^|\s)@([\w.-]+)/g)].map(m=>mentionables().find(x=>x.key.toLowerCase()===m[2].toLowerCase())).filter(Boolean);return L.length?'\n\nThe user pointed at: '+L.map(x=>x.kind==='feature'?'"'+x.key.replace(/_/g,' ')+'" is feature id '+x.id+' ('+x.sub+')':'"'+x.key+'" is a parameter').join('; ')+'.':'';}
function hideAc(){V.ac=null;const a=$('.as-ac');a&&a.remove();}
function showAc(){const ta=$('#ai-in'),m=/(^|\s)@([\w.-]*)$/.exec(ta.value.slice(0,ta.selectionStart));if(!m)return hideAc();const qy=m[2].toLowerCase(),L=mentionables().filter(x=>x.key.toLowerCase().includes(qy)).slice(0,7);if(!L.length)return hideAc();V.ac={L,i:Math.min(V.ac?V.ac.i:0,L.length-1),at:ta.selectionStart-m[2].length,len:m[2].length};const box=h('div',{class:'as-ac',role:'listbox'},...L.map((x,i)=>h('button',{class:i===V.ac.i?'on':'',role:'option',onmousedown:e=>{e.preventDefault();pickAc(i);}},h('span',null,'@'+x.key),h('small',null,x.sub))));const o=$('.as-ac');o?o.replaceWith(box):$('.as-ta').append(box);}
function pickAc(i){const ta=$('#ai-in'),a=V.ac,x=a.L[i];ta.value=ta.value.slice(0,a.at)+x.key+' '+ta.value.slice(a.at+a.len);const p=a.at+x.key.length+1;ta.setSelectionRange(p,p);hideAc();ta.focus();grow();}
function grow(){const t=$('#ai-in');t&&(t.style.height='auto',t.style.height=Math.min(132,t.scrollHeight)+'px');}
export function setText(t){const ta=$('#ai-in');ta&&(ta.value=t,grow(),ta.focus(),ta.setSelectionRange(t.length,t.length));}
function retryLast(edit){if(S.aiBusy)return;const L=S.chat,i=L.map(m=>m.role).lastIndexOf('user');if(i<0)return;const um=L[i];for(const am of L.slice(i+1).filter(m=>m.card&&m.card.before!=null&&!m.card.undone).reverse()){if(JSON.stringify(S.doc)!==am.card.after){A.toast('The part changed since that reply, so it was kept. The new reply builds on it.',4200);break;}toggle(am);}S.chat.length=i;paintChat();save();edit?setText(um.text):send({text:um.text});}
const plain=e=>(e.name?"'"+e.name+"' ":'')+((A.FT[(S.doc.features.find(f=>f.id===e.id)||{}).type]||{}).n||'feature')+': '+e.msg;
const geo=()=>JSON.stringify([S.doc.features,S.doc.params,S.doc.units]);
function memory(){const o=[];for(const m of S.chat){if(m.live||m.role==='err'||m.role==='sys'||m.role==='look'&&!m.hist)continue;o.push(m.role==='user'?{role:'user',content:'(earlier request) '+String(m.text).slice(0,900)}:m.role==='look'?{role:'user',content:m.hist}:{role:'assistant',content:m.reply||JSON.stringify({say:m.text,applied:m.card?m.card.items.map(x=>x.t):[]}).slice(0,3500)});}const t=o.slice(-16);while(t.length&&t[0].role!=='user')t.shift();return t;}
const lookEl=m=>h('div',{class:'msg s as-look'},m.thumb?h('img',{src:m.thumb,alt:'What the AI saw: ISO, top, front and right views'}):null,h('span',null,m.text)),chkEl=()=>h('label',{class:'as-chk',title:'After each change the AI looks at pictures (ISO, top, front, right) and numbers of what it built and fixes mistakes, up to '+AISEE.MAX_ROUNDS+' rounds. Turn it off to save time and tokens.'},h('input',{type:'checkbox',id:'ai-check',checked:H.cfg.check!==false,onchange:e=>{H.cfg.check=e.target.checked;H.save();}}),'Check my work');
export async function send(o={}){const inp=$('#ai-in');if(!inp)return;const text=String(o.text!=null?o.text:inp.value).trim();if(!text||S.aiBusy)return;
  if(isBr()&&!H.AI.ready){A.toast('Ask in your AI app. It is connected to this page.',4200);return;}
  if(!H.AI.ready&&!await autoConnect()){V.setup=true;paint();return;}
  if(o.text==null){inp.value='';grow();}hideAc();const history=memory();S.aiBusy=true;const stp=A.steps&&A.steps.begin('AI: '+text.slice(0,70),{kind:'ai',quiet:true});const ac=new AbortController();V.ctl=ac;const um={role:'user',text},am={role:'assistant',text:'',live:true};S.chat.push(um,am);paintChat();paintBusy();
  const rx=REFS.forAI(S.doc,{vision:H.AI.vision,force:!!o.force,text}),chk=H.cfg.check!==false&&H.AI.kind!=='paste';let cm=am,req=text+mentionNote(text),hreq='(earlier request) '+text,imgs=rx.images,first=true,tries=0,round=0,kept=0;
  try{
    if(A.ws==='form'){const r=await(await import('./form.js')).askForm(A,text,{signal:ac.signal,onToken:t=>live(cm,t)});cm.live=false;cm.text=r.say;cm.reply=JSON.stringify({say:r.say});cm.card={items:[{k:'edit',t:'Form scene · '+r.note}]};cm.issues=r.errors.map(e=>'Line '+(e.line+1)+': '+e.msg);}
    else for(;;){
      const msgs=[{role:'system',content:systemPrompt(S.doc.units)},...AISEE.conv(history),{role:'user',content:stateMessage(H.state(),req,first?rx.text:''),images:imgs&&imgs.length?imgs:undefined}],t0=Date.now(),raw=await H.AI.complete(msgs,{signal:ac.signal,onToken:t=>live(cm,t)});first&&rx.sent();
      const rep=parseReply(raw),rj=JSON.stringify({say:rep.say,actions:rep.actions});history.push({role:'user',content:hreq},{role:'assistant',content:rj});cm.reply=rj;
      const pre=JSON.stringify(S.doc),g0=geo(),applied=H.apply(rep.actions),secs=((Date.now()-t0)/1000).toFixed(1)+' s',chg=geo()!==g0;cm.live=false;cm.text=(rep.say||(rep.parseError?'(The model did not return valid JSON.) ':''))||'Done.';cm.card=applied.length?{items:cardItems(pre,applied),before:pre,after:JSON.stringify(S.doc),t:secs}:null;paintChat();first=false;imgs=null;kept+=applied.length?1:0;
      if(!applied.length&&!S.lastWarn.length)break;
      await H.wait();const bad=S.errors.filter(e=>S.lastAiIds&&S.lastAiIds.has(e.id)),wn=(S.warnings||[]).filter(e=>S.lastAiIds&&S.lastAiIds.has(e.id)).map(e=>e.msg).concat(S.lastWarn),hurt=bad.length||wn.length,fixReq=(bad.length?'Your last change failed to build: '+bad.map(e=>e.id+(e.name?" '"+e.name+"'":'')+': '+e.msg).join('; ')+'. Fix it with set/delete actions. ':'')+(wn.length?'Warnings: '+wn.join(' ')+' Fix them with set actions.':'');
      if(!chk){if(!hurt||tries>=1){cm.issues=bad.map(plain);break;}tries++;req=fixReq;hreq='(automatic check) '+req.slice(0,900);S.chat.push({role:'sys',text:(bad.length?'The part did not build ('+bad.map(plain).join('; ')+')':'The part built with warnings')+'. Asking the AI to fix it.'});}
      else{
        if(round>0&&!chg||!chg&&!hurt||round>=AISEE.MAX_ROUNDS||A.ws!=='part'){cm.issues=bad.map(plain);round>0&&S.chat.push({role:'sys',text:round>=AISEE.MAX_ROUNDS&&chg?'I stopped after '+round+' checks. The last change was not looked at again.':'That reply changed nothing, so I stopped checking.'});break;}
        round++;const rv=await AISEE.review(A,{sheet:H.AI.vision});if(ac.signal.aborted)throw Object.assign(new Error('stopped'),{name:'AbortError'});
        rv.findings.unshift(...S.lastWarn.map(w=>'Your last change: '+w));const vis=H.AI.vision&&!!rv.b64;hreq='(automatic check '+round+') '+AISEE.brief(rv)+(rv.findings.length?'; findings: '+rv.findings.join(' | ').slice(0,900):'');
        S.chat.push({role:'look',text:(bad.length?'The part did not build ('+bad.map(plain).join('; ')+'). ':'')+'Check '+round+' of '+AISEE.MAX_ROUNDS+': '+AISEE.brief(rv)+(vis?'':rv.sheet_error?' (no picture: '+rv.sheet_error+')':' (numbers only; this AI cannot see images)'),thumb:vis?rv.thumb:undefined,hist:hreq});
        req=AISEE.reviewText(rv,text,round,vis,S.doc.params.map(p=>p.name));imgs=vis?[{mime:rv.mime,b64:rv.b64}]:null;
      }
      cm={role:'assistant',text:'',live:true};S.chat.push(cm);paintChat();}
  }catch(e){const x=fx(e,H.AI.kind),i=S.chat.indexOf(cm);i>=0&&cm.live&&S.chat.splice(i,1);x.kind==='stop'?S.chat.push({role:'sys',text:kept?'Stopped. Changes from earlier replies were kept; use Undo to revert them.':'Stopped. Nothing from that reply was applied.'}):S.chat.push({role:'err',text:x.title,...x});}
  finally{stp&&stp.end();S.aiBusy=false;V.ctl=null;cm.live=false;save();paintChat();paintBusy();paintSugg();paintCtx();}}
export const stop=()=>V.ctl&&V.ctl.abort();
export function open(o={}){const ws=A.ws;document.body.classList.toggle('ask-on',ws!=='part');S.tab!=='ai'&&(V.tab=S.tab);A.setTab('ai');A.showPanel('R');o.focus!==false&&setTimeout(()=>{const t=$('#ai-in');t&&t.offsetParent&&t.focus();},60);}
export function close(){document.body.classList.remove('ask-on');S.tab==='ai'&&A.ws!=='part'&&A.setTab(V.tab&&V.tab!=='ai'?V.tab:'edit');}
export function ask(o={}){open({focus:false});const f=o.feature&&S.doc.features.find(x=>x.id===o.feature);f&&setText(($('#ai-in').value?$('#ai-in').value+' ':'')+'@'+String(f.name||nm0(f)).replace(/\s+/g,'_')+' ');!f&&$('#ai-in')&&setTimeout(()=>$('#ai-in').focus(),60);paintCtx();}
function build(){el=q('#tab-ai');el.dataset.built='1';
  const ta=h('textarea',{id:'ai-in',rows:'1',placeholder:'Describe a part or change…','aria-label':'Message to the AI',oninput:()=>{grow();showAc();},onclick:showAc,onkeydown:e=>{if(e.isComposing)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();ta.blur();return;}const a=V.ac;if(a){if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();a.i=(a.i+(e.key==='ArrowDown'?1:-1)+a.L.length)%a.L.length;showAc();return;}if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();pickAc(a.i);return;}if(e.key==='Escape'){e.preventDefault();hideAc();return;}}if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}),up=h('input',{type:'file',accept:'image/*,application/pdf,.pdf,.svg',multiple:true,hidden:true,onchange:e=>{A.refs.add(e.target.files);e.target.value='';}});
  el.addEventListener('dragover',e=>{[...(e.dataTransfer?e.dataTransfer.types:[])].includes('Files')&&e.preventDefault();});el.addEventListener('drop',e=>{if(e.defaultPrevented)return;e.preventDefault();A.refs.add(e.dataTransfer.files);});
  const refs=REFS.panel(A,{kind:()=>H.cfg.kind,go:()=>send({text:REFS.PROMPT,force:true})});
  el.replaceChildren(h('div',{class:'as-head'},chipEl(),quickEl(),h('button',{class:'as-ib as-exp',id:'ai-exp',title:'Expand or shrink the panel','aria-label':'Expand or shrink the panel',onclick:()=>{const g=q('#right .m-grab');g&&g.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));}},'⤢'),h('button',{class:'as-ib as-info',id:'ai-info',title:'What is sent?','aria-label':'What is sent?',onclick:()=>{el.classList.toggle('as-n-open');const d=$('.as-sent');d&&(d.open=el.classList.contains('as-n-open'));}},'ⓘ'),h('button',{class:'as-ib',id:'ai-clear',title:'Clear this part\'s conversation','aria-label':'Clear this part\'s conversation',onclick:()=>{S.chat=[];lset(CK+slot(),null);lset(pzK(),null);paintChat();},html:'<svg viewBox="0 0 24 24"><path d="M3 7h18M9 7V4h6v3m-8 0l1 13h8l1-13"/></svg>'}),h('button',{class:'as-ib as-back',id:'ai-close',title:'Back to the workspace panel','aria-label':'Back to the workspace panel',onclick:close},'✕')),h('div',{class:'as-note'}),h('div',{class:'as-prog'},h('i')),h('div',{class:'as-setup',id:'ai-setup'}),h('div',{id:'chat'}),h('div',{class:'chips'}),h('div',{class:'as-ctx'}),h('div',{class:'as-th'}),
    chkEl(),
    h('details',{class:'as-refs'},h('summary',null,'References'),refs),
    h('div',{class:'compose'},h('button',{class:'as-clip',id:'ai-attach',title:'Attach sketches, photos or PDF drawings','aria-label':'Attach sketches, photos or PDF drawings',onclick:()=>up.click(),html:'<svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'}),up,h('div',{class:'as-ta'},ta),h('button',{class:'btn pri',id:'ai-send',onclick:()=>S.aiBusy?stop():send()},'Send')));}
export function render(){el=q('#tab-ai');el.dataset.built||build();!configured()&&(bst().st||{}).state==='connected'&&bridge(bst().st);paint();!H.AI.ready&&!V.busy&&configured()&&!isBr()&&!V.setup&&H.cfg.kind!=='browser'&&V.tried!==H.cfg.kind+H.keys.get(H.cfg.kind)&&(V.tried=H.cfg.kind+H.keys.get(H.cfg.kind),connect(H.cfg.kind));}
export function init(api,host){A=api;H=host;S=api.S;h=api.h;H.AI.paste=pasteTurn;document.head.append(Object.assign(document.createElement('style'),{id:'as-css',textContent:CSS}));document.addEventListener('securitypolicyviolation',e=>{e.disposition!=='report'&&(V.csp=Date.now());});
  const b=q('#b-ask');b&&b.addEventListener('click',()=>open({focus:true}));
  setInterval(()=>{if(!el||!el.classList.contains('on'))return;const s=sigOf();if(s!==V.sig){V.sig=s;paintCtx();paintSugg();}},350);
  A.onChange(()=>{if(!el||!el.isConnected)return;if(cur!==slot()){sync();paint();}else paintThumbs();});
  api.assistant={open,close,ask,send,stop,connect,useEngine,openSetup,bridge,setText,retry:retryLast,render,state:()=>({ready:H.AI.ready,kind:H.cfg.kind,setup:showSu(),busy:!!S.aiBusy,chat:S.chat.length})};return api.assistant;}
