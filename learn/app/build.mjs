import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import vm from 'node:vm';
const WEB=path.resolve(new URL('../..',import.meta.url).pathname),L=path.join(WEB,'learn'),OUT=path.join(L,'app'),MIN_APP=1,HIDE=new Set(['invaders','battleship']);
const sha=b=>crypto.createHash('sha1').update(b).digest('hex').slice(0,12),rd=p=>fs.readFileSync(path.join(L,p),'utf8');
const un=s=>s.replace(/&(amp|lt|gt|quot|#39|nbsp|mdash|ndash|times|divide|rarr|larr|hellip);/g,(_,e)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",nbsp:' ',mdash:'—',ndash:'–',times:'×',divide:'÷',rarr:'→',larr:'←',hellip:'…'})[e]).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)),txt=s=>un(s.replace(/<[^>]+>/g,'')).trim(),slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function statics(){const h=rd('index.html'),js=rd('learn-app.js'),obj=(k,re)=>[...js.match(new RegExp(k+'=\\{([^}]*)\\}'))[1].matchAll(re)];
 const glv=Object.fromEntries(obj('_glv',/'?([a-z0-9:]+)'?:'([1-8]+)'/g).map(m=>[m[1],m[2]])),ln=obj('_ln',/(\d):'([^']+)'/g).map(m=>[+m[1],m[2]]),lc=Object.fromEntries(obj('_lc',/(\d):'(#[0-9a-fA-F]{6})'/g).map(m=>[+m[1],m[2]]));
 const lvOf=(a,base)=>/brain-cat|id="brain-section"/.test(a)?[6]:/destress-cat/.test(a)?[7]:/college-cat/.test(a)?[8]:/id="stem-section"/.test(a)?((base||[4,5]).filter(l=>l===4||l===5).length?(base||[4,5]).filter(l=>l===4||l===5):[4,5]):((base||[1,2,3,4,5]).filter(l=>l<=5).length?(base||[1,2,3,4,5]).filter(l=>l<=5):[1,2,3,4,5]);
 const cats=[],seen={},grid=h.slice(h.indexOf('id="main-game-grid"'));
 for(const [,a,sec] of grid.matchAll(/<section class="game-category([^>]*)>([\s\S]*?)<\/section>/g)){const m=sec.match(/<h2 class="cat-header"[^>]*><span class="cat-header-icon">([\s\S]*?)<\/span>\s*([\s\S]*?)<\/h2>/);if(!m)continue;const games=[];
  for(const b of sec.matchAll(/<button class="game-btn[^"]*"([^>]*)>([\s\S]*?)<\/button>/g)){const d=Object.fromEntries([...b[1].matchAll(/data-([a-z]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])),g=c=>txt((b[2].match(new RegExp(`<span class="${c}">([\\s\\S]*?)</span>`))||[,''])[1]);if(!d.game||HIDE.has(d.game))continue;
   const key=d.game+(d.subgame?':'+d.subgame:d.subject?':'+d.subject:''),v=glv[key]||glv[d.game],lv=lvOf(a,v&&[...v].map(Number));
   seen[key]?seen[key].levels=[...new Set([...seen[key].levels,...lv])].sort():games.push(seen[key]={id:key,game:d.game,subgame:d.subgame||null,subject:d.subject||null,icon:g('btn-icon'),title:g('btn-text'),blurb:g('btn-desc'),isNew:b[2].includes('game-new-badge'),levels:lv})}
  games.length?cats.push({id:slug(txt(m[2])),icon:m[1].trim(),title:txt(m[2]),games}):0}
 return{levels:ln.map(([k,v])=>({id:k,name:v,color:lc[k]||'#4ADE80'})),cats}}
function hubs(cats){const C={},M=[],H={category:c=>C[c.id]=Object.assign(C[c.id]||{},c),register:m=>M.push(m),open(){},close(){},lv:()=>1,mods:M,cats:C},el=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':el,apply:()=>el,construct:()=>el,set:()=>true});
 const ctx=vm.createContext({AmniHub:H,document:el,localStorage:{getItem:()=>null,setItem(){}},navigator:{userAgent:''},location:{search:''},console,setTimeout(){},clearTimeout(){},setInterval(){},matchMedia:()=>({matches:false})});ctx.window=ctx;
 for(const f of [...rd('index.html').matchAll(/<script src="(mod-[a-z0-9-]+\.js)/g)].map(m=>m[1]))try{vm.runInContext(rd(f),ctx,{filename:f,timeout:5000})}catch(e){console.warn('learn app: skipped '+f+': '+e.message)}
 for(const m of M){const c=C[m.cat];if(!c)continue;const id=slug(c.title),cat=cats.find(x=>x.id===id)||(n=>(c.top===true?cats.unshift(n):cats.push(n),n))({id,icon:c.icon,title:c.title,games:[]}),ic=String(m.icon||'');cat.games.push({id:'hub:'+m.id,game:'hub:'+m.id,subgame:null,subject:null,icon:ic.startsWith('<')?c.icon:ic,title:m.title,blurb:m.desc||'',isNew:!!m.isNew,levels:m.levels?[...String(m.levels)].map(Number):[1,2,3,4,5,6,7,8]})}
 return M.length}
const{levels,cats}=statics(),nh=hubs(cats);
fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'catalog.json'),JSON.stringify({levels,categories:cats},null,1));
const top=new Set(fs.readdirSync(L).filter(f=>f.endsWith('.html')&&f!=='index.html')),files={};
const walk=d=>fs.readdirSync(path.join(WEB,d),{withFileTypes:true}).forEach(e=>{const p=d+'/'+e.name;e.isDirectory()?(['learn/tests','learn/vendor'].includes(p)?0:walk(p)):(d==='learn'&&top.has(e.name))||/^learn\/app\/(manifest|version)\.json$/.test(p)||e.name.startsWith('.')?0:(b=>files[p]=[b.length,sha(b)])(fs.readFileSync(path.join(WEB,p)))});
walk('learn');const css=fs.readFileSync(path.join(WEB,'css/style.css'));files['css/style.css']=[css.length,sha(css)];
const keys=Object.keys(files).sort(),v=sha(keys.map(k=>k+files[k][1]).join('\n'));
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({v,minApp:MIN_APP,files:Object.fromEntries(keys.map(k=>[k,files[k]]))}));fs.writeFileSync(path.join(OUT,'version.json'),JSON.stringify({v,minApp:MIN_APP}));
console.log(`learn app content ${v}: ${keys.length} files, ${(keys.reduce((s,k)=>s+files[k][0],0)/1048576).toFixed(1)} MB, ${cats.length} categories, ${cats.reduce((s,c)=>s+c.games.length,0)} games (${nh} hub)`);
