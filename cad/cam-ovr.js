// Amni-CAM output: Beta notice and manual overrides. Pure functions (no DOM), shared by the Make tab, the API bridge and node tests.
export const BETA='Beta: verify toolpaths in simulation and dry-run before cutting.';
export const BETA_LONG='Toolpaths and G-code from Amni-CAD are in beta. Verify every program in the simulator, then dry-run it above the stock before cutting material. Check work offsets, tool lengths, clamps and limits at the machine.';
const BETA_LINE='BETA: VERIFY TOOLPATHS IN SIMULATION AND DRY-RUN BEFORE CUTTING';
const HAS_BETA=/beta: verify toolpaths in simulation/i;
const NUM=/^(\s*)(\d+)(\s|$)/;
// Renumber Heidenhain-style block numbers ("0 BEGIN PGM ...") after lines were added or removed.
export function renumber(lines){if(!lines.length||!NUM.test(lines[0])||!/BEGIN PGM/i.test(lines[0]))return lines;let n=+lines[0].match(NUM)[2];return lines.map(l=>NUM.test(l)?l.replace(NUM,(m,a,b,c)=>a+(n++)+c):l);}
// Comment line in the same style as a reference comment line of the program.
function commentLike(ref,msg){const t=msg,m=ref.match(/^(\s*\d+\s+)?;/);if(m)return(m[1]?'0 ':'')+'; '+t;if(/^\s*'/.test(ref))return"' "+t;return'('+t.replace(/[()]/g,'')+')';}
function styleRef(L){const i=L.findIndex(l=>/amni-cam/i.test(l));if(i>=0)return i;const j=L.findIndex(l=>/^\s*(\d+\s+)?[(;']/.test(l));return j;}
// Insert the Beta notice as a comment right after the program title, in the post's own comment syntax. Idempotent.
export function betaHeader(text){if(!text||HAS_BETA.test(text.slice(0,4000)))return text;const L=text.split('\n'),i=styleRef(L);let line,at;
  if(i>=0){const up=/[a-z]/.test(L[i])?0:1;line=commentLike(L[i],up?BETA_LINE:BETA.replace(/\.$/,''));at=i+1;}
  else{line='('+BETA_LINE+')';at=/^%/.test(L[0])?1:0;}
  L.splice(at,0,line);return renumber(L).join('\n');}
// ---- Job-level parameter overrides (all lengths mm, feeds mm/min, stored in doc.make.cam.ovr.p) ----
export const PARAMS={
  flat:[{k:'rpm',lb:'Spindle speed',u:'rpm',mill:1},{k:'feed',lb:'Cutting feed',u:'feed'},{k:'plunge',lb:'Plunge feed',u:'feed',mill:1},{k:'doc',lb:'Stepdown (depth per pass)',u:'len',mill:1},{k:'stepover',lb:'Stepover',u:'len',mill:1},{k:'ramp_deg',lb:'Ramp-in angle',u:'deg',mill:1},
    {k:'lead',lb:'Lead-in / lead-out',u:'len',kerf:1},{k:'safe_z',lb:'Safe height',u:'len'},{k:'clear',lb:'Retract height above stock',u:'len'},{k:'overcut',lb:'Cut-through below stock',u:'len',mill:1},{k:'leave',lb:'Leave for finish pass',u:'len',mill:1},
    {k:'finish_pass',lb:'Finish pass',u:'bool',mill:1},{k:'climb',lb:'Cut direction',u:'dir'},{k:'tab_w',lb:'Tab width',u:'len',mill:1},{k:'tab_h',lb:'Tab height',u:'len',mill:1},
    {k:'pierce_h',lb:'Pierce height',u:'len',kerf:1},{k:'pierce_s',lb:'Pierce delay',u:'s',kerf:1},{k:'cut_h',lb:'Cut height',u:'len',kerf:1},{k:'power',lb:'Laser power (0-1)',u:'frac',kerf:1}],
  solid:[{k:'safe',lb:'Safe / retract height above stock',u:'len'},{k:'ramp_deg',lb:'Ramp-in angle',u:'deg'},{k:'rough_leave',lb:'Roughing stock to leave',u:'len'},{k:'finish_leave',lb:'Finish stock to leave',u:'len'},{k:'scallop',lb:'3D finish scallop height',u:'len'},{k:'face_top',lb:'Face the top',u:'bool'},{k:'coolant',lb:'Coolant',u:'bool'}]};
export const paramsFor=(route,kerf)=>(PARAMS[route]||[]).filter(p=>!(kerf&&p.mill)&&!(!kerf&&p.kerf));
const okVal=(p,v)=>p.u==='bool'||p.u==='dir'?typeof v==='boolean':typeof v==='number'&&isFinite(v)&&(p.u==='frac'?v>=0&&v<=1:p.u==='deg'?v>=0&&v<=45:v>=0);
export function cleanParams(route,p){const o={};for(const d of PARAMS[route]||[])if(p&&p[d.k]!=null&&okVal(d,p[d.k]))o[d.k]=p[d.k];return o;}
// Merge parameter overrides into the engine job. The engine still clamps feeds and spindle to the machine limits.
export function applyParams(route,job,ovr){const p=cleanParams(route,ovr&&ovr.p);if(!Object.keys(p).length)return job;return route==='solid'?{...job,opts:{...(job.opts||{}),...p}}:{...job,...p};}
// ---- Per-operation overrides on the posted program (solid route: ops carry line_start/line_end) ----
const isCmt=l=>/^\s*(\d+\s+)?[(;']/.test(l);
const strip=l=>l.replace(/\([^)]*\)/g,'').replace(/;.*$/,'');
const dialectOf=t=>/^\s*0\s+BEGIN PGM/m.test(t.slice(0,300))?'heidenhain':/^\s*'|^\s*SA\s*$|^\s*&Tool|^\s*TR,/m.test(t.slice(0,3000))?'sbp':'gcode';
const motion={gcode:l=>{const s=strip(l);return!/G53|G43|G28|G30/.test(s)&&(/\bG0*[0123]\b/.test(s)||/(^|\s)[XYZIJK]-?[\d.]/.test(s))&&!/\bM0*6\b|\bT\d/.test(s);},
  sbp:l=>/^\s*(M[XYZ2345]|J[XYZ2345]|CG)\s*,/i.test(l),heidenhain:l=>/^\s*\d+\s+(L|C|CC|CR|CT|RND|CHF)\b/.test(l)&&!/TOOL/.test(l)};
export const opKey=(si,ops,j)=>{const o=ops[j],n=ops.slice(0,j).filter(x=>x.kind===o.kind).length;return si+':'+(o.kind||'op')+':'+n;};
const fmt=(v,ref)=>{const d=(String(ref).split('.')[1]||'').length;return d?v.toFixed(d):String(Math.round(v))+(String(ref).endsWith('.')?'.':'');};
function scaleWord(l,W,k,cap){if(isCmt(l))return l;const i=l.search(/[(;]/),code=i>=0?l.slice(0,i):l,rest=i>=0?l.slice(i):'';return code.replace(new RegExp('(^|[^A-Z])'+W+'(\\d+\\.?\\d*)','g'),(m,a,v)=>a+W+fmt(Math.min(cap||Infinity,+v*k),v))+rest;}
// Apply per-op feed %, spindle % and skip. Returns {text, notes}. Lines before an op's start keep their numbering because ops are processed from the end.
export function applyOps(text,ops,ovr,si=0,mc={}){const O=(ovr&&ovr.ops)||{},notes=[];if(!text||!ops||!ops.length||!Object.keys(O).length)return{text,notes};
  const dl=dialectOf(text),L=text.split('\n'),idx=ops.map((o,j)=>({o,j,k:opKey(si,ops,j)})).filter(x=>O[x.k]&&x.o.line_start>0&&x.o.line_end>=x.o.line_start).sort((a,b)=>b.o.line_start-a.o.line_start);
  for(const{o,k}of idx){const v=O[k],a=o.line_start-1,b=Math.min(L.length-1,o.line_end-1);let seg=L.slice(a,b+1);
    if(v.skip){const last=seg.length-1;seg=seg.filter((l,i)=>i===last||!motion[dl](l));notes.push('Skipped: '+o.name+'. Its material is left on the part.');L.splice(a,b-a+1,...seg);continue;}
    const fk=+v.feed_pct>0?+v.feed_pct/100:1,sk=+v.rpm_pct>0?+v.rpm_pct/100:1;
    if(fk!==1){if(dl==='sbp'){const MS=/^\s*MS\s*,/i,sc=l=>l.replace(/(-?\d+\.?\d*)/g,m=>fmt(+m*fk,m));if(seg.some(l=>MS.test(l)))seg=seg.map(l=>MS.test(l)?sc(l):l);else{let prev=null;for(let i=a-1;i>=0&&prev==null;i--)if(MS.test(L[i]))prev=L[i].trim();if(prev){const fi=seg.findIndex(l=>!isCmt(l));seg.splice(fi<0?seg.length:fi,0,sc(prev));seg.push(prev);}}}
      else seg=seg.map(l=>scaleWord(l,'F',fk));notes.push(o.name+': feed '+Math.round(fk*100)+' %.');}
    if(sk!==1){if(dl==='heidenhain'){notes.push(o.name+': spindle override is not available for Heidenhain programs; edit the TOOL CALL S value in the G-code editor.');}
      else{const W=dl==='sbp'?null:'S',has=dl==='sbp'?seg.some(l=>/^\s*TR\s*,/i.test(l)):seg.some(l=>!isCmt(l)&&/(^|[^A-Z])S\d/.test(strip(l)));
        let prev=null;for(let i=a-1;i>=0&&prev==null;i--){const l=L[i];if(isCmt(l))continue;const m=dl==='sbp'?l.match(/^\s*TR\s*,\s*(\d+\.?\d*)/i):strip(l).match(/(?:^|[^A-Z])S(\d+\.?\d*)/);if(m)prev=m[1];}
        const cap=dl==='sbp'?(mc.max_rpm||Infinity):(mc.s_max||Infinity);
        if(has)seg=seg.map(l=>dl==='sbp'?l.replace(/^(\s*TR\s*,\s*)(\d+\.?\d*)/i,(m,p,x)=>p+fmt(Math.min(cap,+x*sk),x)):scaleWord(l,W,sk,cap));
        else if(prev!=null){const nv=fmt(Math.min(cap,+prev*sk),prev),put=dl==='sbp'?'TR,'+nv:'S'+nv,back=dl==='sbp'?'TR,'+prev:'S'+prev;const fi=seg.findIndex(l=>!isCmt(l));seg.splice(fi<0?seg.length:fi,0,put);seg.push(back);}
        notes.push(o.name+': spindle '+Math.round(sk*100)+' %'+(+prev*sk>cap?' (held at the machine maximum)':'')+'.');}}
    L.splice(a,b-a+1,...seg);}
  return{text:renumber(L).join('\n'),notes};}
// ---- Line diff and patches for the raw G-code editor ----
export function diff(a,b){const A=a.split('\n'),B=b.split('\n');let s=0;while(s<A.length&&s<B.length&&A[s]===B[s])s++;let e=0;while(e<A.length-s&&e<B.length-s&&A[A.length-1-e]===B[B.length-1-e])e++;
  const a1=A.slice(s,A.length-e),b1=B.slice(s,B.length-e),out=[];if(!a1.length&&!b1.length)return[];
  if(a1.length*b1.length>4e6){out.push({a:s,del:a1,ins:b1});return out;}
  const n=a1.length,m=b1.length,W=m+1,T=new Uint32Array((n+1)*(m+1));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)T[i*W+j]=a1[i]===b1[j]?T[(i+1)*W+j+1]+1:Math.max(T[(i+1)*W+j],T[i*W+j+1]);
  let i=0,j=0,cur=null;const flush=()=>{cur&&out.push(cur);cur=null;};
  while(i<n||j<m){if(i<n&&j<m&&a1[i]===b1[j]){flush();i++;j++;}else if(j<m&&(i>=n||T[i*W+j+1]>=T[(i+1)*W+j])){cur=cur||{a:s+i,del:[],ins:[]};cur.ins.push(b1[j++]);}else{cur=cur||{a:s+i,del:[],ins:[]};cur.del.push(a1[i++]);}}
  flush();return out;}
const CTX=3;
export function makePatch(base,edited){const A=base.split('\n');return diff(base,edited).map(h=>({...h,pre:A.slice(Math.max(0,h.a-CTX),h.a),post:A.slice(h.a+h.del.length,h.a+h.del.length+CTX)}));}
const at=(A,i,seq)=>i>=0&&i+seq.length<=A.length&&seq.every((x,k)=>A[i+k]===x);
// Re-apply saved edits to freshly generated code. A hunk applies where its removed lines and context still match (nearest to the old spot); otherwise it is reported as stale.
function locate(A,want,seq,win){for(let d=0;d<=win;d++){if(at(A,want+d,seq))return want+d;if(d&&at(A,want-d,seq))return want-d;if(want+d>A.length&&want-d<0)break;}return -1;}
export function applyPatch(base,hunks){const A=base.split('\n'),stale=[];let off=0,applied=0;
  for(const h of hunks||[]){const want=h.a+off;let p=-1;
    // exact context anywhere first, then reduced context that matches exactly once within 200 lines of the old spot
    const p1=h.pre.slice(-1),q1=h.post.slice(0,1);
    for(const[pre,post,win,uniq]of[[h.pre,h.post,A.length,0],[p1,q1,200,1],[p1,[],200,1],[[],q1,200,1],[[],[],200,1]]){const sq=[...pre,...h.del,...post];if(!sq.length||(uniq&&!h.del.length&&(!pre.length||!post.length)))continue;
      const q=locate(A,want-pre.length,sq,win);if(q<0)continue;if(uniq){let n=0;for(let i=Math.max(0,want-pre.length-win);i<=Math.min(A.length,want+win);i++)if(at(A,i,sq))n++;if(n!==1)continue;}p=q+pre.length;break;}
    if(p<0&&!h.del.length&&!h.pre.length&&!h.post.length)p=Math.min(A.length,Math.max(0,want));
    if(p<0){stale.push(h);continue;}A.splice(p,h.del.length,...h.ins);off=p-h.a+h.ins.length-h.del.length;applied++;}
  return{text:A.join('\n'),applied,stale};}
// Side-by-side style unified diff for display: [{t:' '|'-'|'+', l, n}]
export function diffView(base,edited,ctx=2){const A=base.split('\n'),H=diff(base,edited),out=[];let last=0;
  for(const h of H){const s=Math.max(last,h.a-ctx);if(s>last&&out.length)out.push({t:'…',l:''});for(let i=s;i<h.a;i++)out.push({t:' ',l:A[i],n:i+1});h.del.forEach((l,k)=>out.push({t:'-',l,n:h.a+k+1}));h.ins.forEach(l=>out.push({t:'+',l}));last=h.a+h.del.length;const e=Math.min(A.length,last+ctx);for(let i=last;i<e;i++)out.push({t:' ',l:A[i],n:i+1});last=e;}
  return out;}
// ---- Whole-result finalization ----
export const fileKey=(s,i)=>String(i)+':'+(s.file||'');
// r: normalized CAM result; ovr: doc.make.cam.ovr. Keeps the engine output in s.gen and writes the exported program to s.gcode.
export function finalize(r,ovr){if(!r||!r.setups)return r;const E=(ovr&&ovr.edits)||{};
  r.setups.forEach((s,i)=>{if(s.gen==null)s.gen=s.gcode||'';if(!s.gen){s.ovr={notes:[],stale:0,edited:false};return;}
    const o=applyOps(s.gen,s.ops,ovr,i,r.machine||{}),ed=E[fileKey(s,i)],p=ed&&ed.hunks&&ed.hunks.length?applyPatch(o.text,ed.hunks):{text:o.text,applied:0,stale:[]};
    s.opsText=o.text;s.gcode=betaHeader(p.text);s.ovr={notes:o.notes,edited:p.applied>0,applied:p.applied,stale:p.stale.length,staleHunks:p.stale};});
  r.beta=BETA;return r;}
export const hasOvr=o=>!!o&&(Object.keys(o.p||{}).length>0||Object.values(o.ops||{}).some(v=>v&&(v.skip||(+v.feed_pct>0&&+v.feed_pct!==100)||(+v.rpm_pct>0&&+v.rpm_pct!==100)))||Object.values(o.edits||{}).some(e=>e&&e.hunks&&e.hunks.length));
