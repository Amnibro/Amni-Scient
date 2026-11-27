const T=new URLSearchParams(location.search).get('tier')||document.documentElement.dataset.tier||'basic';
const P=document.documentElement.dataset.partner||'hubs';
const TIERS={basic:{name:'Basic',fee:'$497/mo'},pro:{name:'Pro',fee:'$1,497/mo'},enterprise:{name:'Enterprise',fee:'From $4,997/mo'}};
const PARTNERS={
  hubs:{theme:'hubs',name:'Protolabs Network',short:'Hubs',nav:['CNC machining','3D printing','Sheet metal','Injection molding','Instant quote'],processes:{basic:[['cnc','CNC machining'],['print','3D printing'],['sheet','Sheet metal']],pro:[['cnc','CNC machining'],['print','3D printing'],['sheet','Sheet metal']],enterprise:[['cnc','CNC machining'],['print','3D printing'],['sheet','Sheet metal'],['mold','Injection molding']]},materials:{cnc:[['al6061','6061-T6 aluminum'],['ss304','304 stainless'],['abs','ABS']],print:[['pa12','Nylon PA12 (MJF/SLS)'],['resin','Tough resin (SLA)'],['pla','PLA (FDM)']],sheet:[['al5052','5052-H32 aluminum'],['al6061','6061-T6 aluminum'],['ss304','304 stainless']],mold:[['abs','ABS'],['pcabs','PC+ABS'],['pp','Polypropylene']]},checkout:'cart.html'},
  sendcutsend:{theme:'scs',name:'SendCutSend',short:'SendCutSend',nav:['Laser cutting','Bending','CNC','Materials','Instant pricing'],processes:{basic:[['laser','Laser cutting'],['waterjet','Waterjet'],['route','CNC routing']],pro:[['laser','Laser cutting'],['waterjet','Waterjet'],['route','CNC routing'],['bend','Laser + bending']],enterprise:[['laser','Laser cutting'],['waterjet','Waterjet'],['route','CNC routing'],['bend','Laser + bending']]},materials:{laser:[['al5052','5052-H32 aluminum'],['al6061','6061-T6 aluminum'],['ss304','304 stainless'],['acrylic','Acrylic']],waterjet:[['al5052','5052-H32 aluminum'],['al6061','6061-T6 aluminum'],['cf','Carbon fiber'],['cu','Copper']],route:[['delrin','Delrin'],['acrylic','Acrylic'],['al6061','6061-T6 aluminum'],['al5052','5052-H32 aluminum']],bend:[['al5052','5052-H32 aluminum'],['al6061','6061-T6 aluminum'],['ss304','304 stainless']]},checkout:'cart.html'}
};
const S={process:'',material:'',qty:1,finish:'as-machined',expedite:'standard',use:'',email:'',prompt:'',busy:'',err:'',editing:false,recs:[],analyze:null,opt:null,infer:null,selSug:null,hovSug:null,canUndo:false,dfmOpen:false,dfmFocus:null};
const CAD=document.documentElement.dataset.cad||(location.port==='8777'?'http://127.0.0.1:8778':location.origin);
let MODEL=null,METER=null,TOKENS={},UI=null,READY=false,HOOKED=false,CLEARED=false;
const CAN_AI=T!=='basic',CAN_FEA=T!=='basic',CAN_OPT=T==='enterprise';
function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)}
async function loadTokens(){const baked=document.documentElement.dataset.key;if(baked){TOKENS={[P]:baked};return;}const r=await fetch('/embed-tokens.json',{cache:'no-store'});if(!r.ok)throw new Error('Demo license tokens are missing');TOKENS=await r.json();}
function embedUrl(){const u=new URL('/cad/embed',CAD);u.searchParams.set('partner',P);u.searchParams.set('tier',T);if(TOKENS[P])u.searchParams.set('key',TOKENS[P]);if(/127\.0\.0\.1|localhost/.test(u.hostname))u.searchParams.set('three','1');return u.href;}
function post(msg,tf){try{UI&&UI.iframe&&UI.iframe.contentWindow.postMessage(msg,CAD,tf||[]);}catch{}}
function waitCad(type,ms){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('Timed out waiting for '+type)),ms||180000);const on=ev=>{if(ev.origin!==CAD)return;const m=ev.data;if(!m||m.amnicad!==type)return;removeEventListener('message',on);clearTimeout(t);res(m);};addEventListener('message',on);});}
function hookCad(){
  if(HOOKED)return;HOOKED=true;
  addEventListener('message',ev=>{
    if(ev.origin!==CAD)return;
    const m=ev.data;if(!m||typeof m.amnicad!=='string')return;
    if(m.meter)METER=m.meter;
    if(m.amnicad==='ready'){READY=true;post({amnicad:'chrome',lite:true});post({amnicad:'clear'});return;}
    if(m.amnicad==='clear'){CLEARED=true;if(!(MODEL&&MODEL.ok)){MODEL=null;paint();}return;}
    if(m.amnicad==='model'&&m.ok){if(!CLEARED)return;MODEL={ok:true,...m};pickProcess();paint();return;}
    if(m.amnicad==='denied'){MODEL={ok:false,error:m.reason};S.err=m.reason;paint();}
    if(m.amnicad==='ghostEvent'){if(m.type==='hover'&&S.hovSug!==m.id){S.hovSug=m.id;paint();}if(m.type==='select'&&m.id){S.selSug=m.id;paint();}}
  });
}
function pickProcess(force){
  const {C,procs}=catalog();
  if(!force&&S.procLock&&S.process&&procs.some(p=>p[0]===S.process))return;
  const kind=MODEL&&MODEL.kind,map=P==='hubs'?{'flat sheet':'sheet','bent sheet':'sheet',solid:'cnc'}:{'flat sheet':'laser','bent sheet':'bend',solid:'route'};
  const want=map[kind]||procs[0][0];
  S.process=procs.some(p=>p[0]===want)?want:procs[0][0];
}
function catalog(){
  const C=PARTNERS[P],procs=C.processes[T]||C.processes.basic;
  if(!S.process)S.process=procs[0][0];
  let mats=[...(C.materials[S.process]||C.materials[procs[0][0]]||[])];
  if(MODEL&&MODEL.matId&&!mats.some(m=>m[0]===MODEL.matId))mats=[[MODEL.matId,MODEL.matName],...mats];
  if(!S.material||!mats.some(m=>m[0]===S.material))S.material=(S.recs[0]&&S.recs[0].id)||(mats[0]&&mats[0][0])||'';
  return{C,procs,mats};
}
function inferUse(){
  const typed=S.use.trim();
  if(typed)return{text:typed,via:'prompt'};
  const host=(S.email.split('@')[1]||'').toLowerCase();
  const rules=[[/\b(ford|gm|tesla|toyota|stellantis|honda|bmw)\./,'automotive bracket'],[/\b(boeing|airbus|spacex|lockheed|northrop|blueorigin)\./,'aerospace fitting'],[/\b(medtronic|jnj|stryker|gehealthcare|siemens-health)\./,'medical device housing'],[/\b(caterpillar|john.deere|komatsu)\./,'heavy-equipment bracket'],[/\.(navy|army|af|mil)$/,'defense hardware'],[/\b(garmin|navico|brunswick)\./,'marine hardware']];
  const hit=host&&rules.find(([re])=>re.test(host));
  if(hit)return{text:hit[1],via:'email',domain:host};
  const kind=MODEL&&MODEL.kind;
  const text=kind==='bent sheet'?'sheet-metal bracket':kind==='flat sheet'?'mounting plate':'machined part';
  return{text,via:'geometry'};
}
function recsFor(use,process){
  const {C}=catalog(),mats=C.materials[process]||C.materials[Object.keys(C.materials)[0]]||[],u=String(use||'').toLowerCase();
  const score=([id,name])=>{
    let s=1,reason='Available in this process.';
    if(/marine|outdoor|corrosion|food|medical|chemical/.test(u)&&(id==='ss304'||id==='ss316')){s=7;reason='Resists corrosion in this environment.';}
    else if(/aero|aircraft|flight|satellite/.test(u)&&(id==='al6061'||id==='al7075'||id==='al5052')){s=7;reason='Light and strong enough for flight hardware.';}
    else if(/auto|vehicle|bracket|structural|load|mount/.test(u)&&id==='al6061'){s=6;reason='Machines cleanly and holds fastener loads.';}
    else if(/auto|vehicle|bracket|structural|load|mount|enclos/.test(u)&&id==='al5052'){s=6;reason='Bends cleanly and holds up outdoors.';}
    else if(/gear|motor|bearing|arm link|machin/.test(u)&&(id==='al6061')){s=7;reason='Machines cleanly and holds bearing and fastener loads.';}
    else if(/enclos|electronics|consumer/.test(u)&&(id==='abs'||id==='pcabs')){s=6;reason='Tough, common for housings.';}
    else if(/prototype|cheap|draft/.test(u)&&(id==='pla'||id==='abs'||id==='resin'||id==='pa12')){s=6;reason='Fast and inexpensive for prototypes.';}
    else if(/decor|sign|display|panel/.test(u)&&id==='acrylic'){s=7;reason='Cuts clean on a laser and shows well.';}
    else if(id==='al6061'){s=4;reason='General-purpose, easy to machine or cut.';}
    else if(id==='al5052'){s=4;reason='Standard sheet alloy for laser and brake work.';}
    else if(id==='ss304'){s=3;reason='Stronger in corrosion than aluminum.';}
    else if(id==='pa12'){s=3;reason='Strong nylon for printed end-use parts.';}
    else if(id==='abs'){s=3;reason='Common, tough plastic.';}
    else if(id==='acrylic'){s=3;reason='Clear or colored sheet, laser-ready.';}
    return{id,name,s,reason};
  };
  return mats.map(score).sort((a,b)=>b.s-a.s).slice(0,3);
}
function quote(){
  const p=MODEL&&MODEL.ok?MODEL:{volCm3:0,areaIn2:0,tIn:0,bends:0};
  const q=Math.max(1,S.qty|0),live=T!=='basic';
  let unit=0,lead=7,rows=[],tool=0;
  const vol=p.volCm3,area=p.areaIn2,bends=p.bends||0;
  if(P==='hubs'){
    if(S.process==='cnc'){const cut=vol*1.17;unit=47+cut+(S.material==='ss304'?18:0);lead=7;rows=[['Setup',47],['Machine time',cut]];if(S.finish==='anodize'){unit+=17;rows.push(['Anodize type II',17]);}}
    else if(S.process==='print'){const r=S.material==='pa12'?0.77:S.material==='resin'?0.97:0.47;unit=Math.max(17,vol*r);lead=S.material==='pla'?3:5;rows=[['Build volume',unit]];}
    else if(S.process==='sheet'){unit=27+area*0.17;lead=7;rows=[['Blank + cut',unit]];if(bends){const b=7+(bends-1)*1.7;unit+=b;rows.push(['Bending × '+bends,b]);}}
    else{tool=T==='enterprise'?1497:0;unit=2.47+vol*0.17;lead=17;rows=[['Tooling (one-time)',tool],['Piece price',unit]];}
  }else{
    if(S.process==='laser'||S.process==='bend'){unit=Math.max(7,4.07+area*(S.material==='ss304'?0.47:0.17)+(p.tIn>0.2?p.tIn*2.7:0));rows=[['Laser cut',unit]];if(bends&&(S.process==='bend'||T!=='basic')){const b=7+(bends-1)*1.7;unit+=b;rows.push(['Bending × '+bends,b]);}lead=3;}
    else if(S.process==='waterjet'){unit=Math.max(17,11.7+area*1.27);lead=5;rows=[['Waterjet',unit]];}
    else{unit=Math.max(17,9.7+area*0.77+vol*0.47);lead=5;rows=[['CNC routing',unit]];}
    if(T!=='basic'&&S.finish==='anodize'){unit+=17;rows.push(['Class II anodize',17]);}
    if(T==='enterprise'&&S.expedite==='rush'){unit*=1.47;lead=1;rows.push(['Rush production','+47%']);}
  }
  if(T==='enterprise'&&q>=10){unit*=0.87;rows.push(['Volume break, 10+','−13%']);}
  if(T==='enterprise'&&q>=50){unit*=0.87;rows.push(['Volume break, 50+','−13%']);}
  unit=Math.round(unit*100)/100;const total=Math.round((unit*q+tool)*100)/100;
  return{unit,total,tool,lead,rows,q,live};
}
function h(tag,a={},...kids){const e=document.createElement(tag);for(const k in a){const v=a[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}for(const c of kids.flat(9))if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(String(c)));return e;}
function goto(tier){const u=new URL(location.href);u.searchParams.set('tier',tier);location.href=u.pathname+u.search;}
function addCart(){
  const Q=quote(),{C}=catalog();
  const payload={partner:P,tier:T,process:S.process,material:S.material,qty:S.qty,finish:S.finish,expedite:S.expedite,part:MODEL,quote:Q,use:inferUse()};
  sessionStorage.setItem('amni-demo-order',JSON.stringify(payload));post({amnicad:'checkout',order:payload,quote:Q});
  sessionStorage.setItem('amni-demo-partner',P);location.href=C.checkout+'?partner='+encodeURIComponent(P)+'&tier='+T+'&mode='+(T==='basic'?'fallback':'cart');
}
function takeFiles(files){
  const f=[...files].find(x=>/\.(step|stp|brep|stl|obj|glb|gltf|3mf|ply)$/i.test(x.name));
  const img=CAN_AI?[...files].find(x=>/^image\//.test(x.type)||/\.(png|jpe?g|webp|gif|svg)$/i.test(x.name)):null;
  if(f)return importFile(f);
  if(img)return makePart('',img);
  S.err='Drop a STEP or STL'+(CAN_AI?', or an image of the part':'')+'.';paint();
}
async function importFile(file){
  S.busy='Opening '+file.name;S.err='';paint();
  try{
    const buf=await file.arrayBuffer();
    const m=await (post({amnicad:'import',name:file.name,mime:file.type,buf},[buf]),waitCad('import',180000));
    if(!m.ok)throw new Error(m.reason||'Import failed');
    MODEL={ok:true,...m.part};S.process='';S.procLock=false;pickProcess(true);S.infer=inferUse();S.recs=recsFor(S.infer.text,S.process);if(S.recs[0])S.material=S.recs[0].id;
    if(CAN_FEA)await runAnalyze();
  }catch(e){S.err=e.message||'Import failed';}
  finally{S.busy='';paint();}
}
function loadSample(name){S.prompt=name;return makePart(name,null,true);}
async function makePart(text,image,sample){
  const q=(text||S.prompt||'').trim();
  if(!CAN_AI&&!sample){S.err='AI-to-part is on Pro and Enterprise.';paint();return;}
  if(!q&&!image){S.err='Describe the part, or drop a photo.';paint();return;}
  S.busy=image&&!q?'Reading the image':'Building the part';S.err='';paint();
  try{
    let images;
    if(image){const buf=await image.arrayBuffer();images=[{name:image.name,mime:image.type,buf}];}
    const tf=images&&images[0]?[images[0].buf]:[];
    const m=await (post({amnicad:'make',text:q,images},tf),waitCad('make',180000));
    if(!m.ok){const why={ 'no-ai':'Image and free-form prompts need a connected Amni-CAD AI engine. Try a known part name such as “gearbox housing” or “electronics chassis”, or upload a STEP or STL.','no-match':'No recipe or template matched that prompt. Try “gearbox housing”, “arm link”, “electronics chassis”, or “multi-bend bracket”, or upload a STEP or STL.','missing-template':'That template could not be loaded from Amni-CAD.'};throw new Error(why[m.reason]||m.reason||'Could not build the part');}
    MODEL={ok:true,...m.part};S.process='';S.procLock=false;pickProcess(true);if(!S.use&&q)S.use=q;S.infer=inferUse();S.recs=recsFor(S.infer.text,S.process);if(S.recs[0])S.material=S.recs[0].id;
    if(CAN_FEA)await runAnalyze();
  }catch(e){S.err=e.message||'Make failed';}
  finally{S.busy='';paint();}
}
function quoteWith(part){const prev=MODEL;MODEL={ok:true,...MODEL,...part};const q=quote();MODEL=prev;return q;}
function deltaLine(s){const b=s.before||{},a=s.after||{};const bits=[];if(b.massKg!=null&&a.massKg!=null)bits.push((b.massKg*1000).toFixed(1)+' g → '+(a.massKg*1000).toFixed(1)+' g');if(b.sf!=null&&a.sf!=null)bits.push('SF '+b.sf.toFixed(1)+' → '+a.sf.toFixed(1));if(b.vm!=null&&a.vm!=null)bits.push(b.vm.toFixed(1)+' → '+a.vm.toFixed(1)+' MPa');if(b.defl!=null&&a.defl!=null)bits.push(b.defl.toFixed(3)+' → '+a.defl.toFixed(3)+' mm');try{const qb=quoteWith({volCm3:b.volCm3,areaIn2:b.areaIn2,tIn:b.tIn,bends:b.bends}),qa=quoteWith({volCm3:a.volCm3,areaIn2:a.areaIn2,tIn:a.tIn,bends:a.bends});if(qb&&qa&&qb.unit!==qa.unit)bits.push(money(qb.unit)+' → '+money(qa.unit));}catch{}return bits.join(' · ');}
async function runAnalyze(opt){
  if(!CAN_FEA||!MODEL||!MODEL.ok)return;
  S.busy='Analyzing';S.selSug=null;S.hovSug=null;paint();
  try{
    const r=await (post({amnicad:'analyze',process:S.process,skipFea:!!(opt&&opt.skipFea)}),waitCad('analyze',420000));
    hushDfm();S.analyze=r;S.opt=null;S.selSug=null;S.dfmFocus=null;
  }catch(e){S.analyze={ok:false,reason:e.message||'Analyze failed'};}
  finally{S.busy='';paint();}
}
async function applyFix(sug){
  const fix=sug&&sug.apply||sug;if(!fix)return;
  hushDfm();S.busy='Applying';S.err='';paint();
  try{
    const r=await (post({amnicad:'apply',fix,id:sug&&sug.id,animate:true,process:S.process}),waitCad('apply',420000));
    if(!r.ok)throw new Error(r.reason||'Could not apply');
    if(r.part&&r.part.ok){MODEL={ok:true,...r.part};S.process='';pickProcess();}
    else if(r.after){MODEL={ok:true,...MODEL,massKg:r.after.massKg,volCm3:r.after.volCm3,areaIn2:r.after.areaIn2,tIn:r.after.tIn,bends:r.after.bends,massText:r.after.massKg!=null?(r.after.massKg*1000).toFixed(1)+' g':MODEL.massText,volText:MODEL.volText};}
    const applied={before:r.before,after:r.after,feaBefore:S.analyze&&S.analyze.fea,feaAfter:r.fea,title:sug&&sug.title};
    S.canUndo=true;
    if(CAN_FEA)await runAnalyze({skipFea:true});
    if(S.analyze)S.analyze.applied=applied;else S.analyze={ok:true,suggestions:[],applied};
  }catch(e){S.err=e.message||'Apply failed';}
  finally{S.busy='';paint();}
}
function selectSug(id,html){hushDfm();S.selSug=id;post({amnicad:'ghost',op:'select',id,html});paint();}
async function keepAsIs(){hushDfm();S.busy='';await (post({amnicad:'acceptAsIs'}),waitCad('acceptAsIs',20000));if(S.analyze)S.analyze.suggestions=[];S.selSug=null;paint();}
async function undoFix(){hushDfm();S.busy='Undoing';S.err='';paint();try{const r=await (post({amnicad:'undo'}),waitCad('undo',420000));if(!r.ok)throw new Error(r.reason||'Nothing to undo');if(r.part&&r.part.ok){MODEL={ok:true,...r.part};S.process='';pickProcess();}S.canUndo=!!r.remaining;if(CAN_FEA)await runAnalyze({skipFea:true});}catch(e){S.err=e.message||'Undo failed';}finally{S.busy='';paint();}}

function toggleEdit(on){
  S.editing=on!==undefined?on:!S.editing;
  post({amnicad:'chrome',lite:!S.editing});
  if(!S.editing)post({amnicad:'view',v:'iso'});
  document.body.classList.toggle('editing',S.editing);
  paint();
}
function startView(){
  const drop=h('div',{class:'drop',tabindex:'0',ondragover:e=>{e.preventDefault();e.currentTarget.classList.add('hot');},ondragleave:e=>e.currentTarget.classList.remove('hot'),ondrop:e=>{e.preventDefault();e.currentTarget.classList.remove('hot');takeFiles(e.dataTransfer.files);},onclick:()=>UI.file.click()},
    h('b',null,'Drop a STEP or STL'),
    h('span',null,CAN_AI?'Or a photo, or describe the part below.':'Upload the part you already have.')
  );
  const prompt=CAN_AI?h('form',{class:'ask',onsubmit:e=>{e.preventDefault();makePart(S.prompt);}},
    h('input',{class:'inp',type:'text',placeholder:'A gearbox housing, arm link, electronics chassis…','aria-label':'Describe the part',value:S.prompt,oninput:e=>{S.prompt=e.target.value;}}),
    h('button',{class:'btn pri',type:'submit',disabled:!!S.busy},'Build')
  ):null;
  return h('div',{class:'start'},drop,prompt,S.err?h('p',{class:'err'},S.err):null,S.busy?h('p',{class:'note'},S.busy+'…'):null);
}
function massLine(o){if(!o)return'';if(o.massKg!=null)return (o.massKg*1000).toFixed(1)+' g';if(o.mass!=null)return String(o.mass);return'';}
function feaLine(f){if(!f||f.safety_factor==null)return'';return 'SF '+f.safety_factor+(f.peak_vonMises_MPa!=null?' · peak '+f.peak_vonMises_MPa+' MPa':'')+(f.max_disp_mm!=null?' · defl '+f.max_disp_mm+' mm':'');}
function appliedLine(a){const b=[massLine(a.before),feaLine(a.feaBefore)].filter(Boolean).join(' · '),c=[massLine(a.after),feaLine(a.feaAfter)].filter(Boolean).join(' · ');if(!b&&!c)return'';return 'Before '+b+' → after '+c+(a.drop?' ('+a.drop+'% lighter)':'');}
const DFM_TIT={reach:'Deep pocket',narrow:'Narrow gap',corner:'Sharp inside corner',radius:'Tight corner radius',thin:'Thin wall',deep:'Deep hole',bend_radius:'Bend radius',flange:'Short flange',hole_bend:'Hole near bend',sheet_hole:'Small hole'};
function dfmTitle(d){return DFM_TIT[d&&d.code]||(d&&d.msg)||'Note';}
function hushDfm(){if(!S.dfmOpen)return;S.dfmOpen=false;S.dfmFocus=null;post({amnicad:'dfm',op:'close'});}
function closeDfm(){hushDfm();paint();}
function openDfm(){const dfm=(S.analyze&&S.analyze.dfm)||[];if(!dfm.length)return;S.dfmOpen=true;if(S.dfmFocus==null)S.dfmFocus=0;post({amnicad:'dfm',op:'open',items:dfm,i:S.dfmFocus});paint();}
function focusDfm(i,hov){S.dfmFocus=i;post({amnicad:'dfm',op:hov?'hover':'focus',i});if(!hov)paint();}
function dfmShort(d){const c=d.code;if(c==='reach'||c===1||c==='deep'||c===6||c==='radius'||c===4)return(d.v!=null?d.v.toFixed(1)+'×':'')+(d.from?' from '+d.from:'');if(c==='flange'||c===8)return d.v!=null?'flat '+Number(d.v).toFixed(2):'';return '';}
function dfmWindow(){
  const dfm=(S.analyze&&S.analyze.dfm)||[],worst=dfm.some(d=>d.sev==='error')?'error':'warn';
  return h('div',{class:'dfm-win',role:'dialog','aria-label':'DFM report'},
    h('header',null,h('b',null,'DFM report'),h('span',{class:'n '+worst},String(dfm.length)),h('button',{class:'x',type:'button','aria-label':'Close',onclick:closeDfm},'×')),
    h('ul',null,...dfm.map((d,i)=>h('li',{class:(d.sev||'warn')+(i===S.dfmFocus?' on':''),onmouseenter:()=>focusDfm(i,true),onclick:()=>focusDfm(i,false)},h('span',{class:'dot '+(d.sev||'warn')}),h('div',null,h('b',null,dfmTitle(d)),h('span',null,dfmShort(d))))))
  );
}
function railView(){
  const {C,procs}=catalog();const Q=quote();const has=MODEL&&MODEL.ok;
  if(!has){
    const steps=CAN_AI?[['1','Drop a part, a photo, or try a sample'],['2','We check stress and manufacturability'],['3','Pick a material and get a quote']]:[['1','Drop a STEP or STL, or try a sample'],['2','Pick a process and a material'],['3','Get a quote']];
    const samples=P==='hubs'?[['gearbox housing','Gearbox housing'],['arm link','Arm link']]:[['electronics chassis','Electronics chassis'],['multi-bend bracket','Multi-bend bracket']];
    return[h('div',{class:'rail-scroll'},
      h('h2',null,'How it works'),
      h('ol',{class:'how'},...steps.map(([n,label])=>h('li',null,h('span',{class:'n'},n),h('span',null,label)))),
      h('h2',null,'Processes'),
      h('div',{class:'chips'},...procs.map(([id,n])=>h('button',{class:id===S.process?'on':'',onclick:()=>{S.process=id;paint();}},n))),
      h('h2',null,'Try a sample'),
      h('div',{class:'samples'},...samples.map(([q,n])=>h('button',{class:'btn',type:'button',onclick:()=>loadSample(q),disabled:!!S.busy},n))),
      h('div',{class:'fld'},h('span',null,'Work email'),h('input',{class:'inp',type:'email',placeholder:'Optional',value:S.email,oninput:e=>{S.email=e.target.value;}}))
    )];
  }
  S.infer=S.infer||inferUse();
  S.recs=S.recs.length?S.recs:recsFor(S.infer.text,S.process);
  const finishes=P==='hubs'?[['as-machined','As machined'],['anodize','Anodize type II']]:[['raw','As cut'],...(T==='basic'?[]:[['anodize','Class II anodize']])];
  if(!finishes.some(f=>f[0]===S.finish))S.finish=finishes[0][0];
  const sug=(S.analyze&&S.analyze.suggestions)||[];
  const applied=S.analyze&&S.analyze.applied;
  const scroll=[
    h('h2',null,'Part'),
    h('div',{class:'part',id:'q-part','data-price':String(Q.unit),'data-mat':MODEL.matId},h('b',null,MODEL.name||'Part'),h('span',null,MODEL.sizeText),h('span',null,[MODEL.volText,MODEL.massText].filter(Boolean).join(' · '))),
    h('h2',null,'Application'),
    h('input',{class:'inp',type:'text',placeholder:"What's it for?",value:S.use,'aria-label':'Application',oninput:e=>{S.use=e.target.value;S.infer=inferUse();S.recs=recsFor(S.infer.text,S.process);if(S.recs[0]&&!S.use)S.material=S.recs[0].id;paint();}}),
    !S.use&&S.infer?h('p',{class:'note'},S.infer.via==='email'?'From '+S.infer.domain+': '+S.infer.text:'Assumed from the geometry: '+S.infer.text):null,
    CAN_FEA?h('h2',null,'Analyze'):null,
    CAN_FEA&&S.busy==='Analyzing'?h('p',{class:'note'},'Running stress checks and design changes…'):null,
    CAN_FEA&&S.analyze&&S.analyze.ok&&S.analyze.fea?h('p',{class:'fea-line'},feaLine(S.analyze.fea)):null,
    CAN_FEA&&S.analyze&&S.analyze.ok&&S.analyze.fea?h('div',{class:'fea-scale'},h('span',null,'von Mises'),h('div',{class:'bar'}),h('span',{class:'lo'},'0'),h('span',{class:'hi'},'high')):null,
    CAN_FEA&&applied?h('p',{class:'after'},appliedLine(applied)):null,
    CAN_FEA&&sug.length?h('div',{class:'sug'},...sug.map(s=>h('button',{class:'sug-card'+(s.tint?' '+s.tint:'')+(s.id===S.selSug?' on':'')+(s.id===S.hovSug?' hov':''),type:'button',onclick:()=>selectSug(s.id,s.html)},h('b',null,s.title||s.label),h('span',{class:'why'},s.label),h('span',{class:'delta'},deltaLine(s)),s.apply?h('span',{class:'btn sm',onclick:e=>{e.stopPropagation();applyFix(s);}},'Accept'):null))):null,
    CAN_FEA&&S.analyze&&S.analyze.ok?h('div',{class:'sug-acts'},h('button',{class:'btn',type:'button',onclick:keepAsIs},'Accept as is'),S.canUndo?h('button',{class:'btn',type:'button',onclick:undoFix},'Undo'):null):null,
    CAN_FEA&&((S.analyze&&S.analyze.dfm)||[]).length?h('button',{class:'btn dfm-btn'+(S.dfmOpen?' on':''),type:'button',onclick:()=>S.dfmOpen?closeDfm():openDfm()},h('span',{class:'dot '+(((S.analyze.dfm||[]).some(d=>d.sev==='error')?'error':'warn'))}),'DFM report ('+S.analyze.dfm.length+')'):null,
    CAN_FEA&&S.analyze&&!S.analyze.ok?h('p',{class:'err'},S.analyze.reason||'Analysis could not run.'):null,
    CAN_FEA&&S.analyze&&S.analyze.ok&&!sug.length?h('p',{class:'note'},'No further design changes to show. Accept as is keeps this part.'):null,
    h('h2',null,'Materials'),
    h('div',{class:'mats'},...S.recs.map(r=>h('button',{class:'mat'+(r.id===S.material?' on':''),onclick:()=>{S.material=r.id;post({amnicad:'setConfig',material:r.id});paint();}},h('b',null,r.name),h('span',null,r.reason)))),
    h('div',{class:'chips'},...procs.map(([id,n])=>h('button',{class:id===S.process?'on':'',onclick:()=>{S.process=id;S.procLock=true;S.recs=recsFor((S.infer||inferUse()).text,id);if(S.recs[0])S.material=S.recs[0].id;if(CAN_FEA&&MODEL&&MODEL.ok)runAnalyze({skipFea:true});else paint();}},n))),
    h('div',{class:'fld'},h('span',null,'Finish'),h('select',{class:'inp',onchange:e=>{S.finish=e.target.value;paint();}},...finishes.map(([id,n])=>h('option',{value:id,selected:id===S.finish},n)))),
    h('div',{class:'fld'},h('span',null,'Quantity'),h('input',{class:'inp',type:'number',min:'1',value:String(S.qty),oninput:e=>{S.qty=Math.max(1,+e.target.value||1);paint();}})),
    T==='enterprise'&&P==='sendcutsend'?h('div',{class:'fld'},h('span',null,'Speed'),h('select',{class:'inp',onchange:e=>{S.expedite=e.target.value;paint();}},h('option',{value:'standard',selected:S.expedite==='standard'},'Standard'),h('option',{value:'rush',selected:S.expedite==='rush'},'Rush'))):null,
    (T!=='basic'&&Q.rows.length)?h('table',null,...Q.rows.map(([k,v])=>h('tr',null,h('td',null,k),h('td',{class:'n'},typeof v==='number'?money(v):v)))):null
  ];
  const foot=[
    S.dfmOpen?dfmWindow():null,
    h('div',{class:'price',id:'q-price'},h('span',{class:'u'},money(Q.unit)),h('span',{class:'t'},'each · '+money(Q.total)+' for '+Q.q)),
    h('div',{class:'lead'},'Ships in '+Q.lead+' business day'+(Q.lead===1?'':'s')),
    h('button',{class:'btn pri',onclick:addCart,disabled:!!S.busy},T==='basic'?'Order on '+C.short:'Add to '+C.short+' cart'),
    T==='enterprise'?h('p',{class:'lic'},'Enterprise site license · API included'):null,
    T==='basic'?h('div',{class:'badge'},'Powered by Amni-CAD'):null
  ];
  return[h('div',{class:'rail-scroll'},...scroll.filter(Boolean)),h('div',{class:'rail-foot'},...foot.filter(Boolean))];
}
function paint(){
  if(!UI)return;
  document.body.classList.toggle('has-part',!!(MODEL&&MODEL.ok));
  document.body.classList.toggle('editing',S.editing);
  document.body.classList.toggle('busy',!!S.busy);
  document.body.classList.toggle('dfm-open',!!S.dfmOpen);
  const sc=UI.rail&&UI.rail.querySelector('.rail-scroll'),y=sc?sc.scrollTop:0;
  if(UI.start&&!(MODEL&&MODEL.ok))UI.start.replaceWith(UI.start=startView());
  if(UI.rail)UI.rail.replaceChildren(...railView());
  const sc2=UI.rail&&UI.rail.querySelector('.rail-scroll');
  if(sc2){sc2.scrollTop=y;if(S.dfmOpen){const b=sc2.querySelector('.dfm-btn');if(b)b.scrollIntoView({block:'end',inline:'nearest'});}}
  if(UI.edit)UI.edit.hidden=!(MODEL&&MODEL.ok);
  if(UI.status)UI.status.textContent=S.busy?S.busy+'…':'';
}
function render(){
  const {C}=catalog();const tier=TIERS[T]||TIERS.basic;
  document.documentElement.dataset.theme=C.theme;
  document.title=C.name+' + Amni-CAD · '+tier.name+' demo';
  const header=h('header',null,
    h('div',{class:'mark'},C.name),
    h('nav',null,...C.nav.map(n=>h('span',null,n))),
    h('span',{class:'tag'},'Private Amni-CAD demo'),
    h('div',{class:'tiers'},...['basic','pro','enterprise'].map(k=>h('a',{href:'?tier='+k,class:k===T?'on':'',onclick:e=>{e.preventDefault();goto(k);}},TIERS[k].name)))
  );
  const file=h('input',{type:'file',class:'sr',accept:'.step,.stp,.brep,.stl,.obj,.glb,.gltf,.3mf,.ply,.png,.jpg,.jpeg,.webp,.gif,.svg,image/*',onchange:e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(f)takeFiles([f]);}});
  const iframe=h('iframe',{src:embedUrl(),title:C.name+' preview',allow:'clipboard-write'});
  const start=startView();
  const edit=h('button',{class:'btn edit',hidden:true,onclick:()=>toggleEdit(true)},'Edit');
  const status=h('p',{class:'status'});
  const preview=h('div',{class:'preview'},iframe,edit,status);const stage=h('div',{class:'stage'},start,preview);
  const rail=h('aside',{class:'rail'},...railView());
  const drawer=h('div',{class:'drawer',onclick:e=>{if(e.target===e.currentTarget)toggleEdit(false);}},h('div',{class:'drawer-bar'},h('b',null,'Edit'),h('button',{class:'btn',onclick:()=>toggleEdit(false)},'Close')));
  UI={rail,stage,preview,iframe,start,edit,status,file,drawer};
  iframe.addEventListener('load',()=>{hookCad();});
  document.body.replaceChildren(header,h('main',null,stage,rail),drawer,file);
  paint();
}
loadTokens().then(()=>{hookCad();render();}).catch(e=>{document.body.textContent=e.message||'The demo could not load license tokens.';});
