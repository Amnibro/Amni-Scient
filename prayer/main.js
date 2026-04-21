import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import init, { compute_layout } from './pkg/bible_viz.js';

const ERAS = [
  {name:'Pentateuch', books:[1,2,3,4,5], hueBase:25},
  {name:'Historical', books:[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21], hueBase:45},
  {name:'Wisdom',     books:[22,23,24,25,26,27,28], hueBase:55},
  {name:'Prophets',   books:[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46], hueBase:15},
  {name:'Gospels',    books:[47,48,49,50], hueBase:210},
  {name:'Acts',       books:[51], hueBase:180},
  {name:'Epistles',   books:[52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72], hueBase:240},
  {name:'Revelation', books:[73], hueBase:280},
];
const BOOK_ERA = {};
ERAS.forEach((era, ei) => era.books.forEach(b => BOOK_ERA[b] = ei));
const BOOK_COLORS = {};
ERAS.forEach(era => {
  const n = era.books.length;
  era.books.forEach((bid, i) => {
    const hue = (era.hueBase + (n > 1 ? (i / (n-1)) * 30 - 15 : 0) + 360) % 360;
    BOOK_COLORS[bid] = new THREE.Color().setHSL(hue/360, 0.7, 0.55);
  });
});
const EDGE_OT    = new THREE.Color(0x6b5020);
const EDGE_NT    = new THREE.Color(0x224488);
const EDGE_CROSS = new THREE.Color(0x553366);
const VOICE_GROUPS=[
  {l:'Parable',        c:'#f0c850',m:nd=>nd.kind==='parable'},
  {l:'Praise & Song',  c:'#60ff90',m:nd=>nd.kind==='praise'},
  {l:'Prophecy',       c:'#ff6060',m:nd=>nd.kind==='prophecy'},
  {l:'Vision',         c:'#cc60ff',m:nd=>nd.book_id===73},
  {l:'Apostolic',      c:'#60aaff',m:nd=>nd.book_id>=52&&nd.book_id<=72},
  {l:'Acts',           c:'#40ddcc',m:nd=>nd.book_id===51},
  {l:'Gospel',         c:'#ffa030',m:nd=>nd.book_id>=47&&nd.book_id<=50},
  {l:'Law & Covenant', c:'#ffcc88',m:nd=>BOOK_ERA[nd.book_id]===0||nd.kind==='covenant'},
  {l:'Narrative',      c:'#8899aa',m:_=>true},
];

let graph, scene, camera, renderer, controls;
let pointsMesh, edgesMesh, raycaster, mouse, tooltip, statsEl;
let hoveredIdx = -1, showEdges = true, kindFilter = 'all';
let baseSizes, baseColors;
let selectedIdx = -1, adj = null;
let fulltext = null;
const bookPanel = () => document.getElementById('book-panel');
const bookBody = () => document.getElementById('book-panel-body');
const bookTitle = () => document.getElementById('book-panel-title');
let silhouettePos=null,waterfallPos=null,timelinePos=null,graphPos=null,radialPos=null,spiralPos=null,crossPos=null,iamPos=null,cleanPos=null,voicePos=null,bookPos=null,kindPos=null,degreePos=null,flatPos=null,sabbathPos=null,helixPos=null,crownPos=null;let mode='timeline';let lerpSrc=null,lerpDst=null,lerpT=1.0;const LERP_FRAMES=90;const ease=t=>t<0.5?2*t*t:-1+(4-2*t)*t;const SCALE=1.8;let camSrc=null,camDst=null,camTgtSrc=null,camTgtDst=null,camT=1.0;const CAM_FRAMES=60;let pulsePhase=0;let clickTimer=null;let clickPrevAR=false;let downX=0,downY=0,wasDrag=false;let tandemActive=false;let userAlpha=1.0;let edgeAlphaBase=0.06;let patternsActive=false;let discHistory=[];let adamOnline=null;
const AI_DEFAULTS={url:'http://localhost:7700',model:'qwen3.5-122b'};
const AI_STORAGE_KEY='amni-prayer-ai-config';
const WEBLLM_STORAGE_KEY='amni-prayer-webllm';
const IS_MOBILE=/Android|iPhone|iPad|iPod|Mobile|Opera Mini/i.test(navigator.userAgent)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
const WEBLLM_DEFAULTS={enabled:false,model:IS_MOBILE?'SmolLM2-135M-Instruct-q0f16-MLC':'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'};
const WEBLLM_CDN='https://esm.run/@mlc-ai/web-llm@0.2';
let webllmEngine=null,webllmReady=false,webllmLoading=false,webllmModule=null;
function getAIConfig(){try{const s=localStorage.getItem(AI_STORAGE_KEY);if(!s)return{...AI_DEFAULTS};const p=JSON.parse(s);return{url:(p.url||AI_DEFAULTS.url).trim().replace(/\/+$/,''),model:(p.model||AI_DEFAULTS.model).trim()};}catch{return{...AI_DEFAULTS};}}
function saveAIConfigLS(cfg){try{localStorage.setItem(AI_STORAGE_KEY,JSON.stringify(cfg));}catch{}}
function getWebLLMConfig(){try{const s=localStorage.getItem(WEBLLM_STORAGE_KEY);if(!s)return{...WEBLLM_DEFAULTS};const p=JSON.parse(s);return{enabled:!!p.enabled,model:p.model||WEBLLM_DEFAULTS.model};}catch{return{...WEBLLM_DEFAULTS};}}
function saveWebLLMConfig(cfg){try{localStorage.setItem(WEBLLM_STORAGE_KEY,JSON.stringify(cfg));}catch{}}

const LATIN_PHRASES=[
  {la:'In principio erat Verbum',en:'In the beginning was the Word'},
  {la:'Lux in tenebris lucet',en:'The light shines in the darkness'},
  {la:'Verbum caro factum est',en:'The Word became flesh'},
  {la:'Via, veritas, et vita',en:'The Way, the Truth, and the Life'},
  {la:'Sicut in caelo et in terra',en:'As in heaven and on earth'},
  {la:'Deus caritas est',en:'God is love'},
  {la:'Ad maiorem Dei gloriam',en:'For the greater glory of God'},
  {la:'Fiat lux',en:'Let there be light'},
  {la:'Pax Christi',en:'The peace of Christ'},
  {la:'Soli Deo gloria',en:'Glory to God alone'},
];
let _latinTimer=null;
function startLatinRotator(){
  const el=document.getElementById('intro-latin');if(!el)return;
  let i=0;
  _latinTimer=setInterval(()=>{
    el.classList.add('swap');
    setTimeout(()=>{i=(i+1)%LATIN_PHRASES.length;const p=LATIN_PHRASES[i];el.innerHTML=`${p.la}<span style="display:block;font-size:.65rem;opacity:.55;letter-spacing:.14em;font-style:normal;margin-top:4px;text-transform:uppercase">${p.en}</span>`;el.classList.remove('swap');},650);
  },3800);
  const p=LATIN_PHRASES[0];el.innerHTML=`${p.la}<span style="display:block;font-size:.65rem;opacity:.55;letter-spacing:.14em;font-style:normal;margin-top:4px;text-transform:uppercase">${p.en}</span>`;
}
function setIntroStage(text,pct){
  const s=document.getElementById('intro-stage');if(s)s.textContent=text;
  const f=document.getElementById('intro-progress-fill');if(f)f.style.width=Math.max(0,Math.min(100,pct))+'%';
}
function hideIntroLoader(){
  if(_latinTimer){clearInterval(_latinTimer);_latinTimer=null;}
  const el=document.getElementById('intro-loader');if(el){el.classList.add('fade');setTimeout(()=>{el.remove();},1600);}
}
startLatinRotator();
async function load() {
  setIntroStage('Awakening the engine\u2026',5);
  await init();
  setIntroStage('Unveiling the Scriptures\u2026',15);
  const resp = await fetch('./data/bible_graph.json');
  graph = await resp.json();
  setIntroStage('Gathering verse by verse\u2026',40);
  const ftResp = await fetch('./data/bible_fulltext.json');
  fulltext = await ftResp.json();
  setIntroStage('Weaving cross-references\u2026',60);
  adj = new Array(graph.nodes.length);
  for (let i = 0; i < adj.length; i++) adj[i] = [];
  for (const e of graph.edges) { adj[e.s].push(e.t); adj[e.t].push(e.s); }
  console.log(`Loaded ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
  const kinds = new Set(graph.nodes.map(n => n.kind));
  const sel = document.getElementById('kindFilter');
  [...kinds].sort().forEach(k => {
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = k;
    sel.appendChild(opt);
  });
  const layoutInput=graph.nodes.map(n=>({id:n.id,book_id:n.book_id,region:n.region,mass:n.mass||1.0}));
  setIntroStage('Tracing the canonical constellation\u2026',78);
  console.time('WASM layout');
  const rawSil=JSON.parse(compute_layout(JSON.stringify(layoutInput),45));
  silhouettePos=rawSil.map(p=>({x:p.x*SCALE,y:p.y*SCALE,z:p.z*SCALE}));
  console.timeEnd('WASM layout');
  setIntroStage('Raising the firmament\u2026',90);
  waterfallPos=computeWaterfallLayout();timelinePos=computeTimelineLayout();
  buildBookLegend();setupScene();buildPoints(timelinePos);buildEdges(timelinePos);animate();
  setIntroStage('Ad astra\u2026',100);
  document.getElementById('modeSelect').value='helix';
  setTimeout(()=>{switchMode('helix');hideIntroLoader();},400);
}
function computeWaterfallLayout() {
  const n = graph.nodes.length;
  const pos = new Array(n);
  const bookCounts = {}, bookIdx = {};
  for (const nd of graph.nodes) {
    bookCounts[nd.book_id] = (bookCounts[nd.book_id] || 0) + 1;
    bookIdx[nd.book_id] = 0;
  }
  for (let i = 0; i < n; i++) {
    const nd = graph.nodes[i], bid = nd.book_id;
    const total = bookCounts[bid], idx = bookIdx[bid]++;
    const x = bid <= 46 ? -14 + (bid-1)/45*13 : 1 + (bid-47)/26*12;
    const mass = nd.mass || 1.0;
    const y = 6 - (idx/total)*12 + Math.max(0,mass-1)*1.2;
    const zr = ((i*1664525+1013904223)>>>0)/4294967296;
    const z = (zr*2-1)*0.25 + Math.max(0,mass-1)*0.7;
    pos[i] = {x, y, z};
  }
  return pos;
}

const ERA_Z = [-10, -6.5, -3.5, -0.5, 3, 5.5, 7.5, 10];
const KIND_Z = {parable:0.8,praise:0.6,prophecy:0.4,vision:0.3,covenant:0.2,blessing:0.1,curse:-0.1,command:-0.2,law:-0.3,narrative:0,genealogy:-0.5,iteration:-0.4,loop:-0.4,assertion:0.1,creation:0.5,resurrection:0.7,question:0,woe:-0.2,conditional:0};
function computeTimelineLayout() {
  const n = graph.nodes.length;
  const pos = new Array(n);
  const bookChapters = {};
  for (const nd of graph.nodes) {
    if (!bookChapters[nd.book_id]) bookChapters[nd.book_id] = {};
    if (!bookChapters[nd.book_id][nd.ch]) bookChapters[nd.book_id][nd.ch] = [];
    bookChapters[nd.book_id][nd.ch].push(nd.id);
  }
  let xCursor = 0;
  const bookX = {};
  let prevEra = -1;
  for (let bid = 1; bid <= 73; bid++) {
    if (!bookChapters[bid]) continue;
    const era = BOOK_ERA[bid];
    if (prevEra >= 0 && era !== prevEra) xCursor += 3.5;
    prevEra = era;
    bookX[bid] = xCursor;
    const chapters = Object.keys(bookChapters[bid]).map(Number).sort((a,b) => a-b);
    xCursor += Math.max(1.4, chapters.length * 0.14);
  }
  const xScale = 56 / Math.max(xCursor, 1);
  for (let i = 0; i < n; i++) {
    const nd = graph.nodes[i];
    const bx = (bookX[nd.book_id] || 0) * xScale - 28;
    const chapters = Object.keys(bookChapters[nd.book_id]).map(Number).sort((a,b) => a-b);
    const maxCh = chapters.length;
    const chIdx = chapters.indexOf(nd.ch);
    const versesInCh = bookChapters[nd.book_id][nd.ch];
    const vIdx = versesInCh.indexOf(nd.id);
    const vFrac = versesInCh.length > 1 ? vIdx / (versesInCh.length - 1) : 0.5;
    const y = 9 - (chIdx / Math.max(maxCh-1,1)) * 18;
    const mass = nd.mass || 1.0;
    const eraZ = ERA_Z[BOOK_ERA[nd.book_id]] || 0;
    const kindZ = KIND_Z[nd.kind] || 0;
    const z = eraZ + kindZ * 0.8 + (vFrac - 0.5) * 0.6 + Math.max(0, mass-1) * 0.8;
    pos[i] = {x: bx, y, z};
  }
  return pos;
}

function computeGraphLayout() {
  const n = graph.nodes.length;
  const pos = new Array(n);
  const adj = new Array(n);
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const e of graph.edges) {
    adj[e.s].push(e.t);
    adj[e.t].push(e.s);
  }
  const rng = i => ((i * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < n; i++) {
    const era = BOOK_ERA[graph.nodes[i].book_id] || 0;
    const angle = (era / 8) * Math.PI * 2 + (rng(i) - 0.5) * 1.2;
    const r = 20 + rng(i * 7 + 3) * 30;
    pos[i] = {x: Math.cos(angle) * r, y: Math.sin(angle) * r, z: (rng(i * 13 + 7) - 0.5) * 20};
  }
  const ITERS = 120, COOL = 0.975;
  let temp = 3.0;
  const dx = new Float64Array(n), dy = new Float64Array(n), dz = new Float64Array(n);
  for (let iter = 0; iter < ITERS; iter++) {
    dx.fill(0); dy.fill(0); dz.fill(0);
    const stride = Math.max(1, Math.floor(n / 300));
    for (let i = 0; i < n; i++) {
      for (let j = i + stride; j < n; j += stride) {
        let ex = pos[i].x - pos[j].x, ey = pos[i].y - pos[j].y, ez = pos[i].z - pos[j].z;
        let d2 = ex*ex + ey*ey + ez*ez + 0.01;
        const rep = 50.0 / d2;
        dx[i] += ex * rep; dy[i] += ey * rep; dz[i] += ez * rep;
        dx[j] -= ex * rep; dy[j] -= ey * rep; dz[j] -= ez * rep;
      }
    }
    for (const e of graph.edges) {
      const s = e.s, t = e.t;
      let ex = pos[s].x - pos[t].x, ey = pos[s].y - pos[t].y, ez = pos[s].z - pos[t].z;
      const d = Math.sqrt(ex*ex + ey*ey + ez*ez) + 0.001;
      const ideal = 2.5;
      const att = (d - ideal) * 0.12;
      const fx = (ex/d)*att, fy = (ey/d)*att, fz = (ez/d)*att;
      dx[s] -= fx; dy[s] -= fy; dz[s] -= fz;
      dx[t] += fx; dy[t] += fy; dz[t] += fz;
    }
    for (let i = 0; i < n; i++) {
      const len = Math.sqrt(dx[i]*dx[i] + dy[i]*dy[i] + dz[i]*dz[i]) + 0.001;
      const cap = Math.min(len, temp) / len;
      pos[i].x += dx[i] * cap;
      pos[i].y += dy[i] * cap;
      pos[i].z += dz[i] * cap;
    }
    temp *= COOL;
  }
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += pos[i].x; cy += pos[i].y; cz += pos[i].z; }
  cx /= n; cy /= n; cz /= n;
  let maxR = 0;
  for (let i = 0; i < n; i++) {
    pos[i].x -= cx; pos[i].y -= cy; pos[i].z -= cz;
    maxR = Math.max(maxR, Math.sqrt(pos[i].x*pos[i].x + pos[i].y*pos[i].y + pos[i].z*pos[i].z));
  }
  const sc = 55 / Math.max(maxR, 1);
  for (let i = 0; i < n; i++) { pos[i].x *= sc; pos[i].y *= sc; pos[i].z *= sc; }
  return pos;
}
function computeRadialLayout(){const n=graph.nodes.length;const pos=new Array(n);const eraBooks=Array.from({length:8},()=>[]);for(let bid=1;bid<=73;bid++){const ei=BOOK_ERA[bid];if(ei!==undefined)eraBooks[ei].push(bid);}const bc={},bvc={};for(const nd of graph.nodes){if(!bc[nd.book_id])bc[nd.book_id]={};if(!bc[nd.book_id][nd.ch])bc[nd.book_id][nd.ch]=[];bc[nd.book_id][nd.ch].push(nd.id);bvc[nd.book_id]=(bvc[nd.book_id]||0)+1;}const bAng={},bRad={};for(let ei=0;ei<8;ei++){const bids=eraBooks[ei];const ring=6+ei*6.5;bids.forEach((bid,bi)=>{bAng[bid]=(bi/bids.length)*Math.PI*2-Math.PI/2;bRad[bid]=ring;});}for(let i=0;i<n;i++){const nd=graph.nodes[i];const ba=bAng[nd.book_id]||0,br=bRad[nd.book_id]||20;const chs=Object.keys(bc[nd.book_id]||{}).map(Number).sort((a,b)=>a-b);const chIdx=chs.indexOf(nd.ch),chFr=chs.length>1?chIdx/(chs.length-1):0.5;const vInCh=bc[nd.book_id]?.[nd.ch]||[];const vIdx=vInCh.indexOf(nd.id),vFr=vInCh.length>1?vIdx/(vInCh.length-1):0.5;const rOff=(chFr-0.5)*4,aOff=(vFr-0.5)*0.12;const mass=nd.mass||1;pos[i]={x:Math.cos(ba+aOff)*(br+rOff),y:Math.sin(ba+aOff)*(br+rOff),z:(mass>1.5?mass*1.5:0)+(chFr-0.5)*0.5};}return pos;}
function computeSpiralLayout(){const n=graph.nodes.length;const pos=new Array(n);const GA=Math.PI*(3-Math.sqrt(5));const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>{const na=graph.nodes[a],nb=graph.nodes[b];return na.book_id-nb.book_id||na.ch-nb.ch||na.v-nb.v;});for(let j=0;j<n;j++){const i=order[j];const nd=graph.nodes[i];const t=j/n;const r=Math.sqrt(t)*50;const theta=j*GA;const mass=nd.mass||1;pos[i]={x:Math.cos(theta)*r,y:Math.sin(theta)*r,z:(BOOK_ERA[nd.book_id]||0)*1.2-4+(mass>1.5?mass*2:0)};}return pos;}
function computeCrossLayout(){const n=graph.nodes.length;const pos=new Array(n);const sz=28;for(let i=0;i<n;i++){const nd=graph.nodes[i];const phase=i/n*6.28;pos[i]={x:(nd.book_id<40?-sz:sz)*Math.sin(phase),y:nd.ch*0.6-12,z:Math.cos(phase)*sz*0.6+(nd.mass||1)*3};}return pos;}
function computeIamLayout(){const n=graph.nodes.length;const pos=new Array(n);const r=25;for(let i=0;i<n;i++){const nd=graph.nodes[i];const a=i*0.1;pos[i]={x:Math.sin(a)*r,y:i/n*35-18,z:Math.cos(a*2.3)*(nd.mass||1)*6};}return pos;}
function computeSabbathLayout(){const n=graph.nodes.length;const pos=new Array(n);const DM={prophecy:0,creation:0,resurrection:0,narrative:1,genealogy:1,iteration:1,loop:1,covenant:2,blessing:2,conditional:2,praise:3,command:4,assertion:4,question:5,curse:5,woe:5,parable:6};const bkts=Array.from({length:7},()=>[]);for(let i=0;i<n;i++){bkts[DM[graph.nodes[i].kind]??1].push(i);}bkts.forEach(b=>b.sort((a,c)=>{const na=graph.nodes[a],nc=graph.nodes[c];return na.book_id-nc.book_id||na.ch-nc.ch||na.v-nc.v;}));for(let d=0;d<7;d++){const ids=bkts[d];const ba=d*Math.PI*2/7-Math.PI/2,pa=ba+Math.PI/2;for(let j=0;j<ids.length;j++){const i=ids[j];const nd=graph.nodes[i];const t=ids.length>1?j/(ids.length-1):0.5;const r=3+t*42;const spread=((nd.book_id%12)-6)*0.35;const mass=nd.mass||1;const zr=((j*1664525+1013904223)>>>0)/4294967296;pos[i]={x:Math.cos(ba)*r+Math.cos(pa)*spread,y:Math.sin(ba)*r+Math.sin(pa)*spread,z:(mass>1.5?mass*1.5:0)+(zr-0.5)*1.5};}}return pos;}
function computeHelixLayout(){const n=graph.nodes.length;const pos=new Array(n);const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>{const na=graph.nodes[a],nb=graph.nodes[b];return na.book_id-nb.book_id||na.ch-nb.ch||na.v-nb.v;});const R=18,TURNS=8,H=60;for(let j=0;j<n;j++){const i=order[j];const nd=graph.nodes[i];const t=j/n,phase=t*Math.PI*2*TURNS;const sp=nd.testament==='NT'?phase+Math.PI:phase;const mass=nd.mass||1;const rOff=mass>1.5?(mass-1)*2:0;const jit=((j*1664525+1013904223)>>>0)/4294967296*0.8-0.4;pos[i]={x:Math.cos(sp)*(R+rOff)+jit,y:t*H-H/2,z:Math.sin(sp)*(R+rOff)+jit};}return pos;}
function computeCrownLayout(){const n=graph.nodes.length;const pos=new Array(n);const SEG=12;const bids=[...new Set(graph.nodes.map(nd=>nd.book_id))].sort((a,b)=>a-b);const bSeg={};bids.forEach((bid,bi)=>bSeg[bid]=Math.floor(bi/Math.ceil(bids.length/SEG))%SEG);const sbk=Array.from({length:SEG},()=>[]);for(let i=0;i<n;i++)sbk[bSeg[graph.nodes[i].book_id]].push(i);const CR=28;for(let s=0;s<SEG;s++){const ids=sbk[s];const base=s*Math.PI*2/SEG;const pk=6*Math.cos(s*Math.PI/3)+2;for(let j=0;j<ids.length;j++){const i=ids[j];const nd=graph.nodes[i];const t=ids.length>1?j/(ids.length-1):0.5;const aOff=(t-0.5)*Math.PI*2/SEG*0.85;const mass=nd.mass||1;const chF=nd.ch/151;const rOff=mass>1.5?mass*2:chF*4-2;const gemH=mass>1.5?mass*2:0;pos[i]={x:Math.cos(base+aOff)*(CR+rOff),z:Math.sin(base+aOff)*(CR+rOff),y:pk*(1-Math.abs(t-0.5)*1.5)+gemH+(chF-0.5)*2};}}return pos;}
function computeCleanLayout() {
  const n = graph.nodes.length;
  const pos = new Array(n);
  const deg = new Int32Array(n);
  for (const e of graph.edges) { deg[e.s]++; deg[e.t]++; }
  const order = new Int32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  const visited = new Uint8Array(n);
  const queue = [];
  let maxDeg = 0, seed = 0;
  for (let i = 0; i < n; i++) { if (deg[i] > maxDeg) { maxDeg = deg[i]; seed = i; } }
  visited[seed] = 1; queue.push(seed);
  let ordIdx = 0;
  while (queue.length > 0) {
    const cur = queue.shift();
    order[ordIdx++] = cur;
    const neighbors = adj[cur].slice().sort((a, b) => deg[b] - deg[a]);
    for (const nb of neighbors) { if (!visited[nb]) { visited[nb] = 1; queue.push(nb); } }
  }
  for (let i = 0; i < n; i++) { if (!visited[i]) { order[ordIdx++] = i; } }
  const rank = new Int32Array(n);
  for (let i = 0; i < n; i++) rank[order[i]] = i;
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < n; i++) {
      const node = order[i];
      if (adj[node].length === 0) continue;
      let median = 0;
      for (const nb of adj[node]) median += rank[nb];
      median /= adj[node].length;
      const target = Math.round(median);
      if (target !== rank[node] && target >= 0 && target < n) {
        const other = order[target];
        order[rank[node]] = other; order[target] = node;
        rank[other] = rank[node]; rank[node] = target;
      }
    }
  }
  const cols = Math.ceil(Math.sqrt(n * 1.5));
  const spacing = 0.18;
  for (let i = 0; i < n; i++) {
    const node = order[i];
    const row = Math.floor(i / cols), col = i % cols;
    const nd = graph.nodes[node];
    const mass = nd.mass || 1.0;
    pos[node] = { x: (col - cols / 2) * spacing, y: (row - (n / cols) / 2) * spacing * -1, z: (mass - 1) * 0.3 };
  }
  let cx = 0, cy = 0;
  for (let i = 0; i < n; i++) { cx += pos[i].x; cy += pos[i].y; }
  cx /= n; cy /= n;
  let maxR = 0;
  for (let i = 0; i < n; i++) { pos[i].x -= cx; pos[i].y -= cy; const r2 = pos[i].x * pos[i].x + pos[i].y * pos[i].y; if (r2 > maxR) maxR = r2; }
  const sc = 50 / Math.max(Math.sqrt(maxR), 1);
  for (let i = 0; i < n; i++) { pos[i].x *= sc; pos[i].y *= sc; }
  return pos;
}
function computeVoiceLayout(){
  const n=graph.nodes.length,G=VOICE_GROUPS.length,buckets=Array.from({length:G},()=>[]);
  for(let i=0;i<n;i++){const nd=graph.nodes[i];let g=G-1;for(let gi=0;gi<G-1;gi++){if(VOICE_GROUPS[gi].m(nd)){g=gi;break;}}buckets[g].push(i);}
  const pos=new Array(n);
  const XW=54,ZD=2.0,Y0=(G-1)*2.75;
  for(let gi=0;gi<G;gi++){
    const ids=buckets[gi];
    ids.sort((a,b)=>{const na=graph.nodes[a],nb=graph.nodes[b];return na.book_id-nb.book_id||na.ch-nb.ch||na.v-nb.v;});
    const total=ids.length,yBase=Y0-gi*5.5;
    for(let j=0;j<total;j++){
      const nd=graph.nodes[ids[j]];
      const t=total>1?j/(total-1):0.5;
      const zr=((j*1664525+1013904223)>>>0)/4294967296;
      pos[ids[j]]={x:(t-0.5)*XW,y:yBase+((nd.mass||1)>1.5?1.2:0),z:(zr*2-1)*ZD};
    }
  }
  return pos;
}
function computeBookLayout(){const n=graph.nodes.length;const bmap={};for(let i=0;i<n;i++){const b=graph.nodes[i].book_id;(bmap[b]=bmap[b]||[]).push(i);}const GA=Math.PI*(3-Math.sqrt(5));const pos=new Array(n);const ids=Object.keys(bmap).map(Number).sort((a,b)=>a-b);const otB=ids.filter(b=>b<=46),ntB=ids.filter(b=>b>46);const placeRow=(bids,yBase,xHalf)=>{bids.forEach((bid,bi)=>{const t=bids.length>1?bi/(bids.length-1):0.5;const cx=(t-0.5)*xHalf*2;const nodes=bmap[bid];const r=Math.min(Math.sqrt(nodes.length)*0.09,3.2);nodes.forEach((ni,j)=>{const cr=j===0?0:r*Math.sqrt(j/Math.max(nodes.length-1,1));pos[ni]={x:cx+Math.cos(j*GA)*cr,y:yBase+Math.sin(j*GA)*cr,z:0};});});};placeRow(otB,9,27);placeRow(ntB,-7,18);return pos;}
function computeKindLayout(){const n=graph.nodes.length;const kmap={};for(let i=0;i<n;i++){const k=graph.nodes[i].kind;(kmap[k]=kmap[k]||[]).push(i);}const GA=Math.PI*(3-Math.sqrt(5));const pos=new Array(n);const sorted=Object.entries(kmap).sort((a,b)=>b[1].length-a[1].length);const place=(nodes,cx,cy,sc)=>{const r=Math.min(Math.sqrt(nodes.length)*sc,10);nodes.forEach((ni,j)=>{const cr=j===0?0:r*Math.sqrt(j/Math.max(nodes.length-1,1));pos[ni]={x:cx+Math.cos(j*GA)*cr,y:cy+Math.sin(j*GA)*cr,z:0};});};place(sorted[0][1],0,0,0.07);const rest=sorted.slice(1);const ringR=26;rest.forEach(([k,nodes],ri)=>{const angle=(ri/rest.length)*Math.PI*2-Math.PI/2;place(nodes,Math.cos(angle)*ringR,Math.sin(angle)*ringR,0.15);});return pos;}
function computeDegreeLayout(){const n=graph.nodes.length;const deg=new Int32Array(n);for(const e of graph.edges){deg[e.s]++;deg[e.t]++;}const THRESH=[20,10,5,3,2,1,0];const bkts=THRESH.map(()=>[]);for(let i=0;i<n;i++){let b=THRESH.length-1;for(let t=0;t<THRESH.length;t++){if(deg[i]>=THRESH[t]){b=t;break;}}bkts[b].push(i);}const pos=new Array(n);const BW=2.2;bkts.forEach((nodes,ri)=>{const R=3+ri*7;nodes.forEach((ni,j)=>{const angle=(j/Math.max(nodes.length,1))*Math.PI*2;const rjit=((ni*1013904223+1664525)>>>0)/4294967296;const zr=((ni*1664525+1013904223)>>>0)/4294967296;const rf=R+rjit*BW;pos[ni]={x:Math.cos(angle)*rf,y:Math.sin(angle)*rf,z:(zr*2-1)*0.3};});});return pos;}
function computeFlatLayout(){const n=graph.nodes.length;const pos=graphPos.map(p=>({x:p.x,y:p.y,z:0}));const ITERS=35;let temp=1.5;const dx=new Float64Array(n),dy=new Float64Array(n);for(let iter=0;iter<ITERS;iter++){dx.fill(0);dy.fill(0);const stride=Math.max(1,Math.floor(n/300));for(let i=0;i<n;i++){for(let j=i+stride;j<n;j+=stride){const ex=pos[i].x-pos[j].x,ey=pos[i].y-pos[j].y;const d2=ex*ex+ey*ey+0.01,rep=40/d2;dx[i]+=ex*rep;dy[i]+=ey*rep;dx[j]-=ex*rep;dy[j]-=ey*rep;}}for(const e of graph.edges){const s=e.s,t=e.t;const ex=pos[s].x-pos[t].x,ey=pos[s].y-pos[t].y;const d=Math.sqrt(ex*ex+ey*ey)+0.001,att=(d-2.5)*0.08;dx[s]-=(ex/d)*att;dy[s]-=(ey/d)*att;dx[t]+=(ex/d)*att;dy[t]+=(ey/d)*att;}for(let i=0;i<n;i++){const len=Math.sqrt(dx[i]*dx[i]+dy[i]*dy[i])+0.001,cap=Math.min(len,temp)/len;pos[i].x+=dx[i]*cap;pos[i].y+=dy[i]*cap;}temp*=0.96;}let cx=0,cy=0;for(let i=0;i<n;i++){cx+=pos[i].x;cy+=pos[i].y;}cx/=n;cy/=n;for(let i=0;i<n;i++){pos[i].x-=cx;pos[i].y-=cy;}return pos;}
function buildBookLegend() {
  const container = document.getElementById('book-legend');
  if (!container) return;
  ERAS.forEach(era => {
    const div = document.createElement('div');
    div.className = 'era-group';
    const title = document.createElement('span');
    title.className = 'era-title';
    title.textContent = era.name;
    div.appendChild(title);
    const booksInData = new Set(graph.nodes.map(n => n.book_id));
    era.books.forEach(bid => {
      if (!booksInData.has(bid)) return;
      const nd = graph.nodes.find(n => n.book_id === bid);
      if (!nd) return;
      const c = BOOK_COLORS[bid];
      const dot = document.createElement('span');
      dot.className = 'book-dot';
      dot.style.background = `#${c.getHexString()}`;
      dot.title = nd.book;
      div.appendChild(dot);
    });
    container.appendChild(div);
  });
}

function setupScene() {
  const canvas = document.getElementById('canvas');
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false});
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a12, 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.008);
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2, 55);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.3;
  controls.target.set(0, 0, 0);
  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.35;
  mouse = new THREE.Vector2(-999, -999);
  tooltip = document.getElementById('tooltip');
  statsEl = document.getElementById('stats');
  window.addEventListener('resize', () => {
    const c = document.getElementById('canvas');
    camera.aspect = c.clientWidth / c.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(c.clientWidth, c.clientHeight, false);
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });
  document.getElementById('showEdges').addEventListener('change', e => {
    showEdges = e.target.checked;
    if (edgesMesh && lerpT >= 1.0) edgesMesh.visible = showEdges;
  });
  document.getElementById('autoRotate').addEventListener('change', e => {
    controls.autoRotate = e.target.checked;
  });
  document.getElementById('kindFilter').addEventListener('change', e => {
    kindFilter = e.target.value;
    updateVisibility();
  });
  document.getElementById('modeSelect').addEventListener('change', e => switchMode(e.target.value));
  canvas.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; wasDrag = false; });
  canvas.addEventListener('pointermove', e => {
    if (e.buttons > 0) {
      const dx = e.clientX - downX, dy = e.clientY - downY;
      if (dx*dx + dy*dy > 25) wasDrag = true;
    }
  });
  canvas.addEventListener('click', onSingleClick);
  canvas.addEventListener('dblclick', onDoubleClick);
  let lastTap=0,lastTapX=0,lastTapY=0;
  canvas.addEventListener('touchend', e => {
    if (e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0], now = Date.now();
    const dx=t.clientX-lastTapX, dy=t.clientY-lastTapY;
    if (now-lastTap < 320 && dx*dx+dy*dy < 1600) { e.preventDefault(); onDoubleClick({clientX:t.clientX,clientY:t.clientY}); lastTap=0; }
    else { lastTap=now; lastTapX=t.clientX; lastTapY=t.clientY; }
  }, {passive:false});
  document.getElementById('book-panel-close').addEventListener('click', closeBookPanel);
  document.getElementById('tandemBtn').addEventListener('click', toggleTandem);
  document.getElementById('tandem-close-btn').addEventListener('click', toggleTandem);
  document.getElementById('alphaSlider').addEventListener('input', e => {
    userAlpha = parseFloat(e.target.value);
    if (pointsMesh) pointsMesh.material.uniforms.uAlphaMul.value = userAlpha;
    if (edgesMesh) edgesMesh.material.opacity = Math.min(1.0, edgeAlphaBase * userAlpha);
  });
  document.getElementById('patternsBtn').addEventListener('click', togglePatterns);
  document.getElementById('discussBtn').addEventListener('click', toggleDiscuss);
  document.getElementById('discuss-close').addEventListener('click', toggleDiscuss);
  document.getElementById('prayBtn').addEventListener('click', openPray);
  document.getElementById('pray-close').addEventListener('click', closePray);
  document.getElementById('pray-lang-btn').addEventListener('click', cyclePrayerLang);
  document.getElementById('ai-setup-btn').addEventListener('click', openAISetup);
  document.getElementById('ai-setup-close').addEventListener('click', closeAISetup);
  document.getElementById('ai-test-btn').addEventListener('click', testAIConnection);
  document.getElementById('ai-save-btn').addEventListener('click', handleSaveAI);
  document.getElementById('ai-reset-btn').addEventListener('click', handleResetAI);
  document.getElementById('adam-badge').addEventListener('click', openAISetup);
  document.getElementById('webllm-load-btn').addEventListener('click', () => {
    const model = document.getElementById('webllm-model').value;
    const enabled = document.getElementById('webllm-enable').checked;
    saveWebLLMConfig({enabled, model});
    loadBrowserEngine(model);
  });
  document.getElementById('webllm-unload-btn').addEventListener('click', unloadBrowserEngine);
  document.getElementById('webllm-enable').addEventListener('change', e => {
    const cfg = getWebLLMConfig();
    saveWebLLMConfig({enabled: e.target.checked, model: cfg.model});
  });
  document.getElementById('webllm-model').addEventListener('change', e => {
    const cfg = getWebLLMConfig();
    saveWebLLMConfig({enabled: cfg.enabled, model: e.target.value});
  });
  const wcfg = getWebLLMConfig();
  if (wcfg.enabled && navigator.gpu && !webllmReady && !webllmLoading) {
    setTimeout(() => loadBrowserEngine(wcfg.model), 1500);
  }
  document.getElementById('discuss-send').addEventListener('click', async () => {
    const inp = document.getElementById('discuss-input');
    const q = inp.value.trim(); if (!q) return;
    inp.value = '';
    addDiscussMsg(escHtml(q), 'user');
    const log = document.getElementById('discuss-log');
    const td = document.createElement('div'); td.className = 'msg-ai'; td.innerHTML = '<em style="opacity:0.4">thinking\u2026</em>'; log.appendChild(td); log.scrollTop = log.scrollHeight;
    let html;
    const frustrated = /\b(not what i asked|wrong|that.s not|thats not|no no|try again|didn.t ask|didn.t answer|off topic)\b/i.test(q);
    const adamQ = frustrated ? `The user is unsatisfied with the previous response. They say: "${q}". Please re-read the verse and give a more focused, direct answer.` : q;
    if (adamOnline) html = await askAdam(adamQ, selectedIdx);
    if (!html && webllmReady) html = await askBrowser(adamQ, selectedIdx);
    if (!html) html = generateDiscussResponse(q, selectedIdx);
    td.innerHTML = html;
    log.scrollTop = log.scrollHeight;
  });
  document.getElementById('discuss-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('discuss-send').click(); }
  });
  const si = document.getElementById('search-input');
  document.getElementById('search-btn').addEventListener('click', () => searchVerse(si.value));
  si.addEventListener('keydown', e => { if (e.key === 'Enter') searchVerse(si.value); });
}

function ensureLayout(m){
  if(m==='graph'&&!graphPos){console.time('Graph lazy');graphPos=computeGraphLayout();console.timeEnd('Graph lazy');}
  if(m==='radial'&&!radialPos){console.time('Radial lazy');radialPos=computeRadialLayout();console.timeEnd('Radial lazy');}
  if(m==='spiral'&&!spiralPos){console.time('Spiral lazy');spiralPos=computeSpiralLayout();console.timeEnd('Spiral lazy');}
  if(m==='cross'&&!crossPos){console.time('Cross lazy');crossPos=computeCrossLayout();console.timeEnd('Cross lazy');}
  if(m==='iam'&&!iamPos){console.time('Iam lazy');iamPos=computeIamLayout();console.timeEnd('Iam lazy');}
  if(m==='sabbath'&&!sabbathPos){console.time('Sabbath lazy');sabbathPos=computeSabbathLayout();console.timeEnd('Sabbath lazy');}
  if(m==='helix'&&!helixPos){console.time('Helix lazy');helixPos=computeHelixLayout();console.timeEnd('Helix lazy');}
  if(m==='crown'&&!crownPos){console.time('Crown lazy');crownPos=computeCrownLayout();console.timeEnd('Crown lazy');}
  if(m==='clean'&&!cleanPos){console.time('Clean lazy');cleanPos=computeCleanLayout();console.timeEnd('Clean lazy');}
  if(m==='voice'&&!voicePos){console.time('Voice lazy');voicePos=computeVoiceLayout();console.timeEnd('Voice lazy');}
  if(m==='book'&&!bookPos){console.time('Book lazy');bookPos=computeBookLayout();console.timeEnd('Book lazy');}
  if(m==='kind'&&!kindPos){console.time('Kind lazy');kindPos=computeKindLayout();console.timeEnd('Kind lazy');}
  if(m==='degree'&&!degreePos){console.time('Degree lazy');degreePos=computeDegreeLayout();console.timeEnd('Degree lazy');}
  if(m==='flat'&&!flatPos){console.time('Flat lazy');if(!graphPos){graphPos=computeGraphLayout();}flatPos=computeFlatLayout();console.timeEnd('Flat lazy');}
}
function getPositionsForMode(m){ensureLayout(m);return m==='timeline'?timelinePos:m==='waterfall'?waterfallPos:m==='graph'?graphPos:m==='radial'?radialPos:m==='spiral'?spiralPos:m==='cross'?crossPos:m==='iam'?iamPos:m==='clean'?cleanPos:m==='voice'?voicePos:m==='book'?bookPos:m==='kind'?kindPos:m==='degree'?degreePos:m==='flat'?flatPos:m==='sabbath'?sabbathPos:m==='helix'?helixPos:m==='crown'?crownPos:silhouettePos;}
function setEdgeOpacity(v){edgeAlphaBase=v;if(edgesMesh)edgesMesh.material.opacity=Math.min(1,v*userAlpha);}
function switchMode(newMode){if(newMode===mode)return;mode=newMode;const posAttr=pointsMesh.geometry.attributes.position;lerpSrc=new Float32Array(posAttr.array);lerpDst=getPositionsForMode(newMode);lerpT=0.0;if(edgesMesh)edgesMesh.visible=false;const legs=['waterfall','graph','radial','spiral','clean','voice','book-layout','kind','degree','flat','sabbath','helix','crown','iam'];legs.forEach(l=>{const el=document.getElementById(l+'-legend');if(el)el.style.display='none';});const showLeg=newMode==='waterfall'?'waterfall':newMode==='graph'?'graph':newMode==='radial'?'radial':newMode==='spiral'?'spiral':newMode==='cross'?'iam':newMode==='iam'?'iam':newMode==='clean'?'clean':newMode==='voice'?'voice':newMode==='book'?'book-layout':newMode==='kind'?'kind':newMode==='degree'?'degree':newMode==='flat'?'flat':newMode==='sabbath'?'sabbath':newMode==='helix'?'helix':newMode==='crown'?'crown':null;if(showLeg){const el=document.getElementById(showLeg+'-legend');if(el)el.style.display='block';}const cfg={radial:{cam:[0,15,65],tgt:[0,0,0],spin:true,spd:0.2,fog:0.004,edge:0.02,alpha:0.9},spiral:{cam:[0,10,65],tgt:[0,0,0],spin:true,spd:0.2,fog:0.004,edge:0.02,alpha:0.9},cross:{cam:[0,0,70],tgt:[0,0,0],spin:true,spd:0.15,fog:0.004,edge:0.02,alpha:0.9},iam:{cam:[0,10,55],tgt:[0,0,0],spin:true,spd:0.15,fog:0.004,edge:0.02,alpha:0.9},sabbath:{cam:[0,0,65],tgt:[0,0,0],spin:true,spd:0.15,fog:0.005,edge:0.02,alpha:0.9},helix:{cam:[40,5,40],tgt:[0,0,0],spin:true,spd:0.35,fog:0.004,edge:0.03,alpha:0.85},crown:{cam:[0,25,50],tgt:[0,3,0],spin:true,spd:0.2,fog:0.004,edge:0.02,alpha:0.9},clean:{cam:[0,0,65],tgt:[0,0,0],spin:false,spd:0.15,fog:0.003,edge:0.12,alpha:0.7},graph:{cam:[0,0,80],tgt:[0,0,0],spin:true,spd:0.3,fog:0.003,edge:0.06,alpha:0.35},timeline:{cam:[0,2,55],tgt:[0,0,0],spin:false,spd:0.3,fog:0.008,edge:0.03,alpha:1.0},waterfall:{cam:[-1,0,28],tgt:[-1,0,0],spin:false,spd:0.3,fog:0.008,edge:0.05,alpha:1.0},voice:{cam:[0,2,50],tgt:[0,0,0],spin:false,spd:0.3,fog:0.006,edge:0.03,alpha:1.0},book:{cam:[0,1,50],tgt:[0,1,0],spin:false,spd:0.15,fog:0.005,edge:0.02,alpha:1.0},kind:{cam:[0,0,58],tgt:[0,0,0],spin:true,spd:0.12,fog:0.004,edge:0.02,alpha:1.0},degree:{cam:[0,0,70],tgt:[0,0,0],spin:true,spd:0.15,fog:0.003,edge:0.03,alpha:0.9},flat:{cam:[0,0,72],tgt:[0,0,0],spin:false,spd:0.15,fog:0.003,edge:0.10,alpha:0.75}};const c=cfg[newMode]||{cam:[0,4,16],tgt:[0,3.5,0],spin:true,spd:0.3,fog:0.02,edge:0.02,alpha:1.0};flyCamera(new THREE.Vector3(...c.cam),new THREE.Vector3(...c.tgt));controls.autoRotate=c.spin;controls.autoRotateSpeed=c.spd;document.getElementById('autoRotate').checked=c.spin;scene.fog.density=c.fog;setEdgeOpacity(c.edge);pointsMesh.material.uniforms.uAlphaMul.value=c.alpha;}
function flyCamera(posDst, tgtDst) {
  camSrc = camera.position.clone();
  camDst = posDst;
  camTgtSrc = controls.target.clone();
  camTgtDst = tgtDst;
  camT = 0.0;
}

function buildPoints(positions) {
  const n = graph.nodes.length;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  baseSizes = new Float32Array(n);
  baseColors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const nd = graph.nodes[i];
    pos[i*3]   = positions[i].x;
    pos[i*3+1] = positions[i].y;
    pos[i*3+2] = positions[i].z;
    const mass = nd.mass || 1.0;
    const isPivot = mass > 1.5;
    const c = BOOK_COLORS[nd.book_id] || new THREE.Color(0x888888);
    const bright = isPivot ? c.clone().lerp(new THREE.Color(0xffffff), 0.35) : c;
    col[i*3] = bright.r; col[i*3+1] = bright.g; col[i*3+2] = bright.b;
    baseColors[i*3] = bright.r; baseColors[i*3+1] = bright.g; baseColors[i*3+2] = bright.b;
    const sz = isPivot ? 4.5 + mass * 2.0 : 4.0;
    sizes[i] = sz; baseSizes[i] = sz;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {uPixelRatio: {value: renderer.getPixelRatio()}, uAlphaMul: {value: 1.0}},
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uPixelRatio;
      uniform float uAlphaMul;
      void main(){
        vColor = color;
        vAlpha = (size > 4.0 ? 0.95 : 0.75) * uAlphaMul;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixelRatio * (60.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if(d > 0.5) discard;
        float core = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(vColor, core * vAlpha);
      }
    `,
    transparent: true, vertexColors: true,
    depthWrite: false, depthTest: true,
    blending: THREE.NormalBlending,
  });
  pointsMesh = new THREE.Points(geo, mat);
  scene.add(pointsMesh);
}

function buildEdges(positions) {
  const edges = graph.edges;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(edges.length * 6);
  const col = new Float32Array(edges.length * 6);
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const s = positions[e.s], t = positions[e.t];
    pos[i*6]   = s.x; pos[i*6+1] = s.y; pos[i*6+2] = s.z;
    pos[i*6+3] = t.x; pos[i*6+4] = t.y; pos[i*6+5] = t.z;
    const sT = graph.nodes[e.s].testament, tT = graph.nodes[e.t].testament;
    const c = (sT !== tT) ? EDGE_CROSS : (sT === 'OT' ? EDGE_OT : EDGE_NT);
    col[i*6] = c.r; col[i*6+1] = c.g; col[i*6+2] = c.b;
    col[i*6+3] = c.r; col[i*6+4] = c.g; col[i*6+5] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  edgesMesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(edgesMesh);
}

function syncEdgesToPoints() {
  const p = pointsMesh.geometry.attributes.position.array;
  const ep = edgesMesh.geometry.attributes.position.array;
  for (let i = 0; i < graph.edges.length; i++) {
    const e = graph.edges[i], si = e.s * 3, ti = e.t * 3;
    ep[i*6]=p[si]; ep[i*6+1]=p[si+1]; ep[i*6+2]=p[si+2];
    ep[i*6+3]=p[ti]; ep[i*6+4]=p[ti+1]; ep[i*6+5]=p[ti+2];
  }
  edgesMesh.geometry.attributes.position.needsUpdate = true;
}

function updateVisibility() {
  const sizes = pointsMesh.geometry.attributes.size;
  for (let i = 0; i < graph.nodes.length; i++)
    sizes.array[i] = (kindFilter === 'all' || graph.nodes[i].kind === kindFilter) ? baseSizes[i] : 0.0;
  sizes.needsUpdate = true;
}

function fmtTooltip(nd) {
  const c = BOOK_COLORS[nd.book_id];
  const hex = c ? '#' + c.getHexString() : '#ccc';
  let h = `<div class="ref"><span style="color:${hex}">●</span> ${nd.book} ${nd.ch}:${nd.v}</div>`;
  h += `<div class="kind">${nd.kind} · ${nd.testament} · ${ERAS[BOOK_ERA[nd.book_id]]?.name || ''}`;
  if ((nd.mass||1) > 1.5) h += ` · <b>★ pivotal</b>`;
  if (nd.conflict) h += ` · ⚔ conflict`;
  h += `</div>`;
  if (nd.ppl?.length) h += `<div class="meta">👤 ${nd.ppl.join(', ')}</div>`;
  if (nd.tribe) h += `<div class="meta">🏛 Tribe of ${nd.tribe}</div>`;
  if (nd.loc?.length) h += `<div class="meta">📍 ${nd.loc.join(', ')}</div>`;
  h += `<div class="text">${nd.preview}</div>`;
  return h;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  pulsePhase += 0.04;
  if (camT < 1.0) {
    camT = Math.min(1.0, camT + 1.0 / CAM_FRAMES);
    const t = ease(camT);
    camera.position.lerpVectors(camSrc, camDst, t);
    controls.target.lerpVectors(camTgtSrc, camTgtDst, t);
  }
  if (lerpT < 1.0) {
    lerpT = Math.min(1.0, lerpT + 1.0 / LERP_FRAMES);
    const t = ease(lerpT);
    const posAttr = pointsMesh.geometry.attributes.position;
    for (let i = 0; i < graph.nodes.length; i++) {
      const i3 = i * 3;
      posAttr.array[i3]   = lerpSrc[i3]   + (lerpDst[i].x - lerpSrc[i3])   * t;
      posAttr.array[i3+1] = lerpSrc[i3+1] + (lerpDst[i].y - lerpSrc[i3+1]) * t;
      posAttr.array[i3+2] = lerpSrc[i3+2] + (lerpDst[i].z - lerpSrc[i3+2]) * t;
    }
    posAttr.needsUpdate = true;
    if (lerpT >= 1.0) {
      syncEdgesToPoints();
      if (edgesMesh) edgesMesh.visible = showEdges;
    }
  }
  raycaster.params.Points.threshold = Math.max(0.25, camera.position.distanceTo(controls.target) * 0.011);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(pointsMesh);
  if (hits.length > 0) {
    const idx = hits[0].index;
    if (idx !== hoveredIdx) {
      hoveredIdx = idx;
      tooltip.innerHTML = fmtTooltip(graph.nodes[idx]);
      tooltip.style.display = 'block';
      if (selectedIdx < 0) {
        const sizes = pointsMesh.geometry.attributes.size;
        for (let i = 0; i < sizes.count; i++)
          sizes.array[i] = (kindFilter === 'all' || graph.nodes[i].kind === kindFilter) ? baseSizes[i] : 0.0;
        sizes.array[idx] = Math.max(baseSizes[idx], 10.0);
        sizes.needsUpdate = true;
      }
    }
  } else if (hoveredIdx >= 0) {
    hoveredIdx = -1;
    tooltip.style.display = 'none';
    if (selectedIdx < 0) updateVisibility();
  }
  if (selectedIdx >= 0) {
    const sizes = pointsMesh.geometry.attributes.size;
    const pulse = 1.0 + Math.sin(pulsePhase) * 0.3;
    sizes.array[selectedIdx] = 14.0 * pulse;
    const connSet = adj[selectedIdx];
    const connPulse = 1.0 + Math.sin(pulsePhase * 0.7 + 1.0) * 0.15;
    for (const ci of connSet) sizes.array[ci] = 8.0 * connPulse;
    sizes.needsUpdate = true;
  }
  renderer.render(scene, camera);
  statsEl.textContent = `${graph.nodes.length} verses · ${graph.edges.length} edges · ${mode}`;
}

function onSingleClick(e) {
  if (wasDrag) return;
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; controls.autoRotate = clickPrevAR; controls.enabled = true; return; }
  const rect = renderer.domElement.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const cy = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  clickPrevAR = controls.autoRotate;
  controls.autoRotate = false;
  controls.enabled = false;
  clickTimer = setTimeout(() => {
    clickTimer = null;
    controls.enabled = true;
    controls.autoRotate = clickPrevAR;
    mouse.x = cx; mouse.y = cy;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(pointsMesh);
    if (hits.length > 0) {
      const idx = hits[0].index;
      if (idx === selectedIdx) { deselectNode(); return; }
      selectedIdx = idx;
      highlightNode(idx);
      flyToNode(idx);
    } else {
      deselectNode();
    }
  }, 300);
}

function onDoubleClick(e) {
  wasDrag = false;
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; controls.autoRotate = clickPrevAR; controls.enabled = true; }
  const rect2 = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect2.left) / rect2.width) * 2 - 1;
  mouse.y = -((e.clientY - rect2.top) / rect2.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(pointsMesh);
  if (hits.length > 0) openBookPanel(hits[0].index);
}

function flyToNode(idx) {
  const p = pointsMesh.geometry.attributes.position.array;
  const nx = p[idx*3], ny = p[idx*3+1], nz = p[idx*3+2];
  const tgt = new THREE.Vector3(nx, ny, nz);
  const dir = camera.position.clone().sub(controls.target).normalize();
  const dst = tgt.clone().add(dir.multiplyScalar(8));
  flyCamera(dst, tgt);
}

function deselectNode() {
  if (selectedIdx < 0) return;
  selectedIdx = -1;
  resetHighlight();
  bookPanel().classList.add('hidden');
  document.getElementById('patterns-panel').style.display='none';
  const old=document.getElementById('patterns-inline');if(old)old.remove();
}

function openBookPanel(idx) {
  const nd = graph.nodes[idx];
  const key = `${nd.book_id}:${nd.ch}`;
  const verses = fulltext[key];
  if (!verses) return;
  selectedIdx = idx;
  highlightNode(idx);  flyToNode(idx);  bookTitle().textContent = `${nd.book} — Chapter ${nd.ch}`;
  const chapterIndices = new Map();
  for (let i = 0; i < graph.nodes.length; i++) {
    const n2 = graph.nodes[i];
    if (n2.book_id === nd.book_id && n2.ch === nd.ch) chapterIndices.set(n2.v, i);
  }
  const connectedSet = new Set(adj[idx]);
  let html = '';
  for (let v = 0; v < verses.length; v++) {
    const vNum = v + 1;
    const nodeIdx = chapterIndices.get(vNum);
    const isSelected = (vNum === nd.v);
    const isConnected = nodeIdx !== undefined && connectedSet.has(nodeIdx);
    const cls = isSelected ? 'verse-row highlighted' : isConnected ? 'verse-row connected' : 'verse-row';
    const dataAttr = nodeIdx !== undefined ? ` data-idx="${nodeIdx}"` : '';
    html += `<div class="${cls}"${dataAttr}><span class="verse-num">${vNum}</span><span class="verse-text">${escHtml(verses[v])}</span></div>`;
  }
  bookBody().innerHTML = html;
  if (tandemActive) { populateTandem(idx); bookPanel().classList.add('hidden'); return; }
  bookPanel().classList.remove('hidden');
  const target = bookBody().querySelector('.highlighted');
  if (target) setTimeout(() => target.scrollIntoView({behavior: 'smooth', block: 'center'}), 100);
  bookBody().querySelectorAll('.verse-row[data-idx]').forEach(row => {
    row.addEventListener('click', () => {
      const clickIdx = parseInt(row.dataset.idx);
      selectFromPanel(clickIdx);
    });
  });
}

function selectFromPanel(idx) {
  selectedIdx = idx;
  highlightNode(idx);
  flyToNode(idx);
  const nd = graph.nodes[idx];
  bookBody().querySelectorAll('.verse-row').forEach(r => {
    r.classList.remove('highlighted', 'connected');
    const ri = r.dataset.idx !== undefined ? parseInt(r.dataset.idx) : -1;
    if (ri === idx) r.classList.add('highlighted');
    else if (adj[idx].includes(ri)) r.classList.add('connected');
  });
  const target = bookBody().querySelector('.highlighted');
  if (target) target.scrollIntoView({behavior: 'smooth', block: 'center'});
  bookTitle().textContent = `${nd.book} — Chapter ${nd.ch}`;
}

function highlightNode(idx) {
  const sizes = pointsMesh.geometry.attributes.size;
  const colors = pointsMesh.geometry.attributes.color;
  const connSet = new Set(adj[idx]);
  for (let i = 0; i < graph.nodes.length; i++) {
    const vis = (kindFilter === 'all' || graph.nodes[i].kind === kindFilter);
    if (!vis) { sizes.array[i] = 0; continue; }
    if (i === idx) {
      sizes.array[i] = 12.0;
      colors.array[i*3] = 1; colors.array[i*3+1] = 0.9; colors.array[i*3+2] = 0.3;
    } else if (connSet.has(i)) {
      sizes.array[i] = 7.0;
      colors.array[i*3] = 0.5; colors.array[i*3+1] = 0.7; colors.array[i*3+2] = 1.0;
    } else {
      sizes.array[i] = baseSizes[i] * 0.4;
      colors.array[i*3] = baseColors[i*3] * 0.25;
      colors.array[i*3+1] = baseColors[i*3+1] * 0.25;
      colors.array[i*3+2] = baseColors[i*3+2] * 0.25;
    }
  }
  sizes.needsUpdate = true;
  colors.needsUpdate = true;
  if (edgesMesh) {
    const ec = edgesMesh.geometry.attributes.color.array;
    for (let i = 0; i < graph.edges.length; i++) {
      const e = graph.edges[i];
      const hot = (e.s === idx || e.t === idx);
      ec[i*6]   = hot ? 1.0 : 0; ec[i*6+1] = hot ? 0.85 : 0; ec[i*6+2] = hot ? 0.4 : 0;
      ec[i*6+3] = hot ? 1.0 : 0; ec[i*6+4] = hot ? 0.85 : 0; ec[i*6+5] = hot ? 0.4 : 0;
    }
    edgesMesh.geometry.attributes.color.needsUpdate = true;
    edgesMesh.material.opacity = Math.min(1, 0.7 * userAlpha);
    edgesMesh.visible = true;
  }
  if (tandemActive) populateTandem(idx);
  if (patternsActive) analyzePatterns(idx);
}
function closeBookPanel() {
  bookPanel().classList.add('hidden');
  selectedIdx = -1;
  resetHighlight();
  document.getElementById('patterns-panel').style.display='none';
  const old=document.getElementById('patterns-inline');if(old)old.remove();
}

function resetHighlight() {
  const sizes = pointsMesh.geometry.attributes.size;
  const colors = pointsMesh.geometry.attributes.color;
  for (let i = 0; i < graph.nodes.length; i++) {
    sizes.array[i] = (kindFilter === 'all' || graph.nodes[i].kind === kindFilter) ? baseSizes[i] : 0;
    colors.array[i*3] = baseColors[i*3];
    colors.array[i*3+1] = baseColors[i*3+1];
    colors.array[i*3+2] = baseColors[i*3+2];
  }
  sizes.needsUpdate = true;
  colors.needsUpdate = true;
  if (edgesMesh) {
    const ec = edgesMesh.geometry.attributes.color.array;
    for (let i = 0; i < graph.edges.length; i++) {
      const e = graph.edges[i];
      const sT = graph.nodes[e.s].testament, tT = graph.nodes[e.t].testament;
      const c = (sT !== tT) ? EDGE_CROSS : (sT === 'OT' ? EDGE_OT : EDGE_NT);
      ec[i*6]=c.r; ec[i*6+1]=c.g; ec[i*6+2]=c.b;
      ec[i*6+3]=c.r; ec[i*6+4]=c.g; ec[i*6+5]=c.b;
    }
    edgesMesh.geometry.attributes.color.needsUpdate = true;
    edgesMesh.material.opacity = Math.min(1, edgeAlphaBase * userAlpha);
    edgesMesh.visible = showEdges;
  }
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toggleTandem() {
  tandemActive = !tandemActive;
  const wrapper = document.getElementById('tandem-wrapper');
  const btn = document.getElementById('tandemBtn');
  document.body.classList.toggle('tandem-on', tandemActive);
  wrapper.style.display = tandemActive ? 'flex' : 'none';
  btn.textContent = tandemActive ? '⇦ CLOSE TANDEM' : '⇨ TANDEM';
  if (tandemActive) bookPanel().classList.add('hidden');
  if (tandemActive && selectedIdx >= 0) populateTandem(selectedIdx);
  else if (tandemActive) {
    const tt = document.getElementById('tandem-title');
    if (tt) tt.textContent = 'Tandem Explorer';
    document.getElementById('tandem-book').innerHTML = '<div style="padding:1.5rem;opacity:0.8;line-height:1.6;font-size:13px"><h3 style="margin:0 0 0.8rem;font-size:13px;letter-spacing:1.5px;opacity:0.85">GET STARTED</h3><p style="margin:0 0 0.6rem">\u2022 Click any node in the visualization to load its chapter here.</p><p style="margin:0 0 0.6rem">\u2022 Use the search bar (top-right) to jump to a verse \u2014 e.g. <em>John 3:16</em> or <em>Genesis 1 1</em>.</p><p style="margin:0 0 0.6rem">\u2022 Connected cross-references appear in the panel below.</p><p style="margin:0.8rem 0 0;font-size:12px;opacity:0.6">35,817 Douay-Rheims verses \u00b7 select a node to begin.</p></div>';
    document.getElementById('tandem-connections').innerHTML = '<h3 class="tandem-conn-title">Connected Passages</h3><p style="padding:0.5rem 1rem;opacity:0.5;font-size:12px">Cross-references will appear here once a verse is selected.</p>';
  }
  setTimeout(() => {
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);
  }, 50);
}
function populateTandem(idx) {
  if (!tandemActive || !fulltext) return;
  const nd = graph.nodes[idx];
  const key = `${nd.book_id}:${nd.ch}`;
  const verses = fulltext[key];
  if (!verses) return;
  const titleEl = document.getElementById('tandem-title');
  if (titleEl) titleEl.textContent = `${nd.book} — Ch. ${nd.ch}`;
  const chapterIndices = new Map();
  for (let i = 0; i < graph.nodes.length; i++) {
    const n2 = graph.nodes[i];
    if (n2.book_id === nd.book_id && n2.ch === nd.ch) chapterIndices.set(n2.v, i);
  }
  const connectedSet = new Set(adj[idx]);
  let html = `<h3 class="tandem-chapter-title">${nd.book} — Chapter ${nd.ch}</h3>`;
  for (let v = 0; v < verses.length; v++) {
    const vNum = v + 1;
    const nodeIdx = chapterIndices.get(vNum);
    const isSelected = (vNum === nd.v);
    const isConnected = nodeIdx !== undefined && connectedSet.has(nodeIdx);
    const cls = isSelected ? 'verse-row highlighted' : isConnected ? 'verse-row connected' : 'verse-row';
    const dataAttr = nodeIdx !== undefined ? ` data-idx="${nodeIdx}"` : '';
    html += `<div class="${cls}"${dataAttr}><span class="verse-num">${vNum}</span><span class="verse-text">${escHtml(verses[v])}</span></div>`;
  }
  const bookEl = document.getElementById('tandem-book');
  bookEl.innerHTML = html;
  const target = bookEl.querySelector('.highlighted');
  if (target) setTimeout(() => target.scrollIntoView({behavior:'smooth',block:'center'}), 100);
  bookEl.querySelectorAll('.verse-row[data-idx]').forEach(row => {
    row.addEventListener('click', () => {
      const ci = parseInt(row.dataset.idx);
      selectedIdx = ci;
      highlightNode(ci);
      flyToNode(ci);
      populateTandem(ci);
    });
  });
  let connHtml = '<h3 class="tandem-conn-title">Connected Passages</h3>';
  const connections = adj[idx];
  if (connections.length === 0) {
    connHtml += '<p style="opacity:0.4;padding:0.5rem">No cross-references for this verse</p>';
  } else {
    for (const ci of connections) {
      const cn = graph.nodes[ci];
      const cKey = `${cn.book_id}:${cn.ch}`;
      const cVerses = fulltext[cKey];
      const cText = cVerses ? escHtml(cVerses[cn.v - 1] || '') : cn.preview || '';
      const c = BOOK_COLORS[cn.book_id];
      const hex = c ? '#' + c.getHexString() : '#ccc';
      connHtml += `<div class="conn-passage" data-cidx="${ci}"><div class="conn-ref"><span style="color:${hex}">●</span> ${cn.book} ${cn.ch}:${cn.v} <span class="conn-era">${ERAS[BOOK_ERA[cn.book_id]]?.name||''}</span></div><div class="conn-text">${cText}</div></div>`;
    }
  }
  const connEl = document.getElementById('tandem-connections');
  connEl.innerHTML = connHtml;
  connEl.querySelectorAll('.conn-passage[data-cidx]').forEach(el => {
    el.addEventListener('click', () => {
      const ci = parseInt(el.dataset.cidx);
      selectedIdx = ci;
      highlightNode(ci);
      flyToNode(ci);
      populateTandem(ci);
    });
  });
}

function togglePatterns(){patternsActive=!patternsActive;const btn=document.getElementById('patternsBtn');btn.textContent=patternsActive?'✦ ON':'✦ PATTERNS';btn.style.background=patternsActive?'rgba(180,120,255,0.25)':'rgba(180,120,255,0.08)';if(patternsActive&&selectedIdx>=0)analyzePatterns(selectedIdx);else{document.getElementById('patterns-panel').style.display='none';const old=document.getElementById('patterns-inline');if(old)old.remove();}}
function analyzePatterns(idx){
  if(!patternsActive)return;
  const nd=graph.nodes[idx],conns=adj[idx],connNodes=conns.map(ci=>graph.nodes[ci]),allNodes=[nd,...connNodes];
  const eraCounts={};
  connNodes.forEach(cn=>{const en=ERAS[BOOK_ERA[cn.book_id]]?.name||'Other';eraCounts[en]=(eraCounts[en]||0)+1;});
  const topEras=Object.entries(eraCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const otLinks=connNodes.filter(cn=>cn.testament==='OT').length;
  const ntLinks=connNodes.filter(cn=>cn.testament==='NT').length;
  const people=new Set(allNodes.flatMap(n=>n.ppl||[]));
  const locs=new Set(allNodes.flatMap(n=>n.loc||[]));
  const bookSet=new Set(connNodes.map(cn=>cn.book_id));
  const pivotConns=connNodes.filter(cn=>(cn.mass||1)>1.5).length;
  const conflicts=allNodes.filter(n=>n.conflict).length;
  const isHub=conns.length>=10;
  const themes=[];
  nd.testament==='OT'&&ntLinks>0&&themes.push('Messianic Type');
  nd.testament==='NT'&&otLinks>3&&themes.push('Fulfilled Prophecy');
  ERAS[BOOK_ERA[nd.book_id]]?.name==='Wisdom'&&themes.push('Wisdom Literature');
  ERAS[BOOK_ERA[nd.book_id]]?.name==='Prophets'&&themes.push('Prophetic Voice');
  people.size>3&&themes.push('Character Web');
  locs.size>2&&themes.push('Geographic Trail');
  conflicts>2&&themes.push('Spiritual Conflict');
  isHub&&themes.push('Scriptural Nexus');
  pivotConns>3&&themes.push('Pivotal Cluster');
  bookSet.size>5&&themes.push('Canon-Wide Echo');
  otLinks>0&&ntLinks>0&&themes.push('Covenant Bridge');
  const pType=isHub&&otLinks>0&&ntLinks>0?'Canonical Axis':isHub?'Scriptural Hub':otLinks>0&&ntLinks>0?'Typological Link':ERAS[BOOK_ERA[nd.book_id]]?.name==='Wisdom'?'Sapiential Pattern':ERAS[BOOK_ERA[nd.book_id]]?.name==='Prophets'?'Prophetic Echo':'Scriptural Reference';
  const ins=[];
  otLinks>0&&ntLinks>0&&ins.push('Bridges both Testaments \u2014 '+otLinks+' OT \xb7 '+ntLinks+' NT connections.');
  people.size>0&&ins.push('Figures: '+[...people].slice(0,5).join(', ')+(people.size>5?' +'+(people.size-5)+' more':'')+'.') ;
  isHub&&ins.push('High-degree nexus ('+conns.length+' refs, '+bookSet.size+' books) \u2014 doctrinally central passage.');
  topEras.length>0&&ins.push('Top eras: '+topEras.map(([e,n])=>e+' ('+n+')').join(', ')+'.');
  conflicts>0&&ins.push(conflicts+' conflict-marked passages \u2014 spiritual warfare or doctrinal tension.');
  locs.size>0&&ins.push('Locations: '+[...locs].slice(0,4).join(', ')+'.');
  pivotConns>0&&ins.push(pivotConns+' pivotal verse'+(pivotConns>1?'s':'')+' in network \u2014 high-significance cluster.');
  let html='<div class="pat-ref">'+nd.book+' '+nd.ch+':'+nd.v+'</div>'+'<div class="pat-type">'+pType+'</div>';
  themes.length>0&&(html+='<div class="pat-themes">'+themes.map(t=>'<span class="pat-tag">'+escHtml(t)+'</span>').join('')+'</div>');
  html+='<div class="pat-stats">'+'<span>\u21c4 '+conns.length+'</span>'+'<span>\ud83d\udcd6 '+bookSet.size+'bks</span>'+'<span>'+(otLinks>0&&ntLinks>0?'\u2696 OT+NT':nd.testament==='OT'?'\ud83d\udcdc OT':'\u271d NT')+'</span>'+(people.size>0?'<span>\ud83d\udc64 '+people.size+'</span>':'')+'</div>';
  ins.forEach(s=>html+='<div class="pat-insight">'+escHtml(s)+'</div>');
  tandemActive?(()=>{const ce=document.getElementById('tandem-connections');const old=ce.querySelector('#patterns-inline');if(old)old.remove();ce.insertAdjacentHTML('beforeend','<div id="patterns-inline" class="patterns-inline-wrap"><div class="pat-header">\u2726 PATTERN ANALYSIS</div>'+html+'</div>');})():(document.getElementById('patterns-body').innerHTML=html,document.getElementById('patterns-panel').style.display='block');
}
function searchVerse(q) {
  q = q.trim(); const res = document.getElementById('search-result');
  if (!q) { res.textContent = ''; return; }
  const m = q.match(/^([\w\s']+?)\s+(\d+)[:\s](\d+)$/i);
  let idx = -1;
  if (m) {
    const bl = m[1].toLowerCase().replace(/^(\d+)\s*/, '$1 ').trim();
    const ch = +m[2], v = +m[3];
    idx = graph.nodes.findIndex(n => n.book.toLowerCase().includes(bl) && n.ch === ch && n.v === v);
  }
  if (idx < 0) {
    const ql = q.toLowerCase();
    idx = graph.nodes.findIndex(n => (n.preview||'').toLowerCase().includes(ql) || n.book.toLowerCase().includes(ql));
  }
  if (idx >= 0) {
    selectedIdx = idx; highlightNode(idx); flyToNode(idx);
    tandemActive ? populateTandem(idx) : toggleTandem();
    if (patternsActive) analyzePatterns(idx);
    const n = graph.nodes[idx];
    res.textContent = `→ ${n.book} ${n.ch}:${n.v}`;
    res.style.color = '#f0c850';
  } else { res.textContent = 'not found'; res.style.color = '#888'; }
}
function updateBadge(){
  const badge=document.getElementById('adam-badge');
  if(!badge) return;
  const cfg=getAIConfig();
  adamOnline ? (badge.textContent='\u25CF Adam',badge.title=`Adam local AI connected (${cfg.url})`,badge.style.color='#7dd6a0',badge.style.opacity='0.9')
    : webllmReady ? (badge.textContent='\u25CF Browser',badge.title='In-browser AI active \u2014 running fully on-device',badge.style.color='#8ab4f8',badge.style.opacity='0.9')
    : webllmLoading ? (badge.textContent='\u25CF loading\u2026',badge.title='Loading in-browser model\u2026',badge.style.color='#e0a040',badge.style.opacity='0.75')
    : (badge.textContent='\u25CF offline',badge.title='Using built-in theological guide. Click \u2699 to configure AI.',badge.style.color='',badge.style.opacity='0.55');
}
async function probeAdam() {
  const cfg = getAIConfig();
  const isHttps = location.protocol === 'https:';
  const blocked = isHttps && cfg.url.startsWith('http://');
  adamOnline = false;
  if (!blocked) {
    try {
      const r = await fetch(`${cfg.url}/health`, {signal: AbortSignal.timeout(3000)});
      adamOnline = r.ok;
    } catch { adamOnline = false; }
  }
  updateBadge();
}
function buildTheologicalPrompt(idx){
  const nd = graph.nodes[idx], conns = adj[idx], cns = conns.map(ci => graph.nodes[ci]);
  const vt = fulltext?.[`${nd.book_id}:${nd.ch}`]?.[nd.v-1] || nd.preview || '';
  const era = ERAS[BOOK_ERA[nd.book_id]]?.name || '';
  const ppl = [...new Set([nd,...cns].flatMap(n => n.ppl||[]))].slice(0,5);
  const locs = [...new Set([nd,...cns].flatMap(n => n.loc||[]))].slice(0,4);
  const connRefs = cns.slice(0,5).map(c => `${c.book} ${c.ch}:${c.v}`);
  return `You are a Catholic theological guide for "Imago Nuntii Divini", a Bible visualization of 35,817 Douay-Rheims verses. The user is viewing ${nd.book} ${nd.ch}:${nd.v} (${era} era, ${nd.testament}, kind: ${nd.kind}).\nVerse: "${vt}"\nCross-refs (${conns.length} total): ${connRefs.join(', ')}${conns.length>5?' and more':''}\n${ppl.length?'Figures: '+ppl.join(', '):''}\n${locs.length?'Locations: '+locs.join(', '):''}\nRespond concisely (2-4 sentences). Use Catholic theological tradition. Reference specific cross-references when relevant. Key symbolic numbers: 3=Trinity/divine, 7=completion/sabbath, 8=new creation/circumcision, 12=governance/apostles, 40=trial/testing.`;
}
async function loadBrowserEngine(modelId){
  if (webllmLoading) return;
  const msgEl=document.getElementById('webllm-msg');
  const setMsg=(t,c)=>{if(msgEl){msgEl.className='ai-msg'+(c?' '+c:'');msgEl.innerHTML=t;}};
  if (!window.isSecureContext) { setMsg('Secure context required \u2014 WebGPU + model download only work over <b>https://</b> or <b>localhost</b>. Open this page via one of those.', 'err'); return; }
  if (!navigator.gpu) { setMsg('WebGPU not available \u2014 try Chrome/Edge (desktop or recent Android), or Safari on iOS 18+.', 'err'); return; }
  if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') { setMsg('Mixed-content block likely \u2014 the model weights are fetched over HTTPS from Hugging Face, which a plain-HTTP page cannot load. Serve this page over HTTPS.', 'err'); return; }
  webllmLoading=true; webllmReady=false; updateBadge();
  const wrap=document.getElementById('webllm-progress-wrap');
  const fill=document.getElementById('webllm-progress-fill');
  const ptxt=document.getElementById('webllm-progress-text');
  const loadBtn=document.getElementById('webllm-load-btn');
  const unloadBtn=document.getElementById('webllm-unload-btn');
  if (wrap) wrap.style.display='block';
  if (loadBtn) loadBtn.disabled=true;
  setMsg('Downloading weights\u2026 cached in your browser for future visits.','warn');
  try {
    if (!webllmModule) webllmModule = await import(WEBLLM_CDN);
    webllmEngine = await webllmModule.CreateMLCEngine(modelId, {
      initProgressCallback: (p) => {
        const pct = Math.round((p.progress||0)*100);
        if (fill) fill.style.width = pct + '%';
        if (ptxt) ptxt.textContent = p.text || `${pct}% \u00b7 ${modelId}`;
      }
    });
    webllmReady=true;
    setMsg(`\u2713 ${modelId} ready \u2014 runs fully offline in this tab`,'ok');
    if (loadBtn) loadBtn.style.display='none';
    if (unloadBtn) unloadBtn.style.display='inline-block';
  } catch (e) {
    webllmReady=false;
    const em=(e&&e.message)||String(e);
    const isDriver=/VK_ERROR|CreateComputePipelines|dawn|vulkan|Metal|D3D12|compute.?pipeline|shader.?compil|out.?of.?memory/i.test(em);
    const isMixed=/mixed|blocked:csp|insecure/i.test(em);
    const isGpu=/webgpu|adapter|navigator\.gpu/i.test(em);
    const isNet=/fetch|network|failed to fetch|cors|404|403|500/i.test(em);
    const hint=isDriver?' <br><b>GPU driver rejected the shader.</b> Quick fixes: <br>1. Update your GPU drivers (NVIDIA/AMD/Intel) <br>2. Enable <code>chrome://flags/#enable-unsafe-webgpu</code> and restart <br>3. Try a smaller model (Qwen2.5 0.5B) <br>4. Or use <b>Adam</b> (local HTTP server) via the gear \u2699 icon above \u2014 falls back to built-in responses meanwhile.':isMixed?' \u2014 likely a mixed-content block; serve this page over HTTPS.':isGpu?' \u2014 WebGPU unavailable; check <code>chrome://gpu</code> or enable in browser flags.':isNet?' \u2014 network error fetching model weights; check connection or try again.':' \u2014 unexpected error; built-in responses will be used meanwhile.';
    setMsg(`Load failed: ${em}${hint}`,isDriver?'warn':'err');
    console.warn('[prayer-webllm] load failed:',e);
  } finally {
    webllmLoading=false;
    if (loadBtn) loadBtn.disabled=false;
    updateBadge();
  }
}
async function unloadBrowserEngine(){
  if (webllmEngine) { try { await webllmEngine.unload?.(); } catch {} }
  webllmEngine=null; webllmReady=false;
  const loadBtn=document.getElementById('webllm-load-btn');
  const unloadBtn=document.getElementById('webllm-unload-btn');
  const wrap=document.getElementById('webllm-progress-wrap');
  const msgEl=document.getElementById('webllm-msg');
  if (loadBtn) loadBtn.style.display='inline-block';
  if (unloadBtn) unloadBtn.style.display='none';
  if (wrap) wrap.style.display='none';
  if (msgEl) { msgEl.className='ai-msg'; msgEl.textContent='Unloaded. Weights remain cached for next load.'; }
  updateBadge();
}
async function askBrowser(query, idx){
  if (idx < 0 || !webllmReady || !webllmEngine) return null;
  const sys = buildTheologicalPrompt(idx);
  const messages=[{role:'system',content:sys}];
  discHistory.slice(-6).forEach(h=>messages.push({role:h.role,content:h.content}));
  messages.push({role:'user',content:query});
  try {
    const reply = await webllmEngine.chat.completions.create({messages, temperature:0.7, max_tokens:300});
    const text = reply.choices?.[0]?.message?.content;
    if (!text) return null;
    discHistory.push({role:'user',content:query},{role:'assistant',content:text});
    if (discHistory.length > 20) discHistory = discHistory.slice(-10);
    return escHtml(text).replace(/\n/g,'<br>');
  } catch { return null; }
}
function openAISetup(){
  const cfg=getAIConfig();
  const wcfg=getWebLLMConfig();
  const panel=document.getElementById('ai-setup-panel');
  document.getElementById('ai-url-input').value=cfg.url;
  document.getElementById('ai-model-input').value=cfg.model;
  document.getElementById('ai-setup-msg').textContent='';
  document.getElementById('ai-setup-msg').className='ai-msg';
  document.getElementById('webllm-enable').checked=wcfg.enabled;
  document.getElementById('webllm-model').value=wcfg.model;
  const tag=document.getElementById('webllm-support-tag');
  if(tag) tag.innerHTML=navigator.gpu?'<span class="ai-support-ok">WebGPU ready</span>':'<span class="ai-support-no">WebGPU unavailable</span>';
  if(webllmReady){
    const lb=document.getElementById('webllm-load-btn');const ub=document.getElementById('webllm-unload-btn');
    if(lb) lb.style.display='none'; if(ub) ub.style.display='inline-block';
  }
  panel.style.display='flex';
  refreshAIStatus();
}
function closeAISetup(){document.getElementById('ai-setup-panel').style.display='none';}
async function refreshAIStatus(){
  const cfg=getAIConfig();
  const isHttps=location.protocol==='https:';
  const blocked=isHttps&&cfg.url.startsWith('http://');
  const dot=document.getElementById('ai-status-dot');
  const txt=document.getElementById('ai-status-text');
  const url=document.getElementById('ai-status-url');
  const hint=document.getElementById('ai-status-hint');
  url.textContent=cfg.url;
  dot.className='ai-dot ai-dot-warn';
  txt.textContent='Probing\u2026';
  hint.textContent='Checking reachability of the OpenAI-compatible endpoint.';
  if(blocked){dot.className='ai-dot ai-dot-err';txt.textContent='Blocked (mixed content)';hint.textContent='HTTPS pages cannot call HTTP localhost. Run this page over http:// locally, or point to an HTTPS-reachable endpoint.';return;}
  try{
    const r=await fetch(`${cfg.url}/health`,{signal:AbortSignal.timeout(3500)});
    if(r.ok){dot.className='ai-dot ai-dot-on';txt.textContent='Online \u2014 ready to discuss';hint.textContent=`Engine responding at ${cfg.url}. Model: ${cfg.model}.`;adamOnline=true;}
    else{dot.className='ai-dot ai-dot-err';txt.textContent=`HTTP ${r.status}`;hint.textContent='Server reachable but health check failed. Confirm the engine is fully loaded.';adamOnline=false;}
  }catch(e){dot.className='ai-dot ai-dot-off';txt.textContent='Offline';hint.textContent='No response. Start Amni-Ai (or another OpenAI-compatible server) at the URL above, then hit TEST.';adamOnline=false;}
  updateBadge();
}
async function testAIConnection(){
  const urlIn=document.getElementById('ai-url-input').value.trim().replace(/\/+$/,'')||AI_DEFAULTS.url;
  const msg=document.getElementById('ai-setup-msg');
  msg.className='ai-msg warn';msg.textContent='Testing\u2026';
  const isHttps=location.protocol==='https:';
  if(isHttps&&urlIn.startsWith('http://')){msg.className='ai-msg err';msg.textContent='Mixed content blocked \u2014 HTTPS page cannot call HTTP.';return;}
  try{
    const r=await fetch(`${urlIn}/health`,{signal:AbortSignal.timeout(4000)});
    if(r.ok){msg.className='ai-msg ok';msg.textContent=`\u2713 Reachable at ${urlIn}`;}
    else{msg.className='ai-msg err';msg.textContent=`Reachable but returned HTTP ${r.status}.`;}
  }catch(e){msg.className='ai-msg err';msg.textContent=`Cannot reach ${urlIn} \u2014 is the engine running?`;}
}
function handleSaveAI(){
  const url=document.getElementById('ai-url-input').value.trim().replace(/\/+$/,'')||AI_DEFAULTS.url;
  const model=document.getElementById('ai-model-input').value.trim()||AI_DEFAULTS.model;
  saveAIConfigLS({url,model});
  const msg=document.getElementById('ai-setup-msg');
  msg.className='ai-msg ok';msg.textContent='\u2713 Saved. Re-probing\u2026';
  refreshAIStatus();
}
function handleResetAI(){
  document.getElementById('ai-url-input').value=AI_DEFAULTS.url;
  document.getElementById('ai-model-input').value=AI_DEFAULTS.model;
  const msg=document.getElementById('ai-setup-msg');
  msg.className='ai-msg';msg.textContent='Defaults restored \u2014 hit SAVE to apply.';
}
async function askAdam(query, idx) {
  if (idx < 0 || !adamOnline) return null;
  const sys = buildTheologicalPrompt(idx);
  const messages = [{role:'system',content:sys}];
  discHistory.slice(-8).forEach(h => messages.push({role:h.role,content:h.content}));
  messages.push({role:'user',content:query});
  const cfg = getAIConfig();
  try {
    const resp = await fetch(`${cfg.url}/v1/chat/completions`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:cfg.model, messages, temperature:0.7, max_tokens:300}),
      signal: AbortSignal.timeout(15000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    discHistory.push({role:'user',content:query},{role:'assistant',content:text});
    if (discHistory.length > 20) discHistory = discHistory.slice(-10);
    return escHtml(text).replace(/\n/g,'<br>');
  } catch { return null; }
}
async function toggleDiscuss() {
  const p = document.getElementById('discuss-panel');
  const on = p.style.display !== 'flex';
  p.style.display = on ? 'flex' : 'none';
  document.getElementById('discussBtn').style.background = on ? 'rgba(100,200,140,0.2)' : '';
  if (on) {
    await probeAdam();
    if (selectedIdx >= 0 && !document.getElementById('discuss-log').children.length) {
      let html;
      if (adamOnline) html = await askAdam('Give a brief theological overview of this verse, its era, and its cross-references.', selectedIdx);
      if (!html && webllmReady) html = await askBrowser('Give a brief theological overview of this verse, its era, and its cross-references.', selectedIdx);
      if (!html) html = generateDiscussResponse('', selectedIdx);
      addDiscussMsg(html, 'ai');
    }
  }
}
function addDiscussMsg(html, role) {
  const log = document.getElementById('discuss-log');
  const d = document.createElement('div');
  d.className = role === 'user' ? 'msg-user' : 'msg-ai';
  d.innerHTML = html;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}
function generateDiscussResponse(query, idx) {
  if (idx < 0) return 'Select a verse node first by clicking on a point in the visualization.';
  const nd = graph.nodes[idx], conns = adj[idx], cns = conns.map(ci => graph.nodes[ci]);
  const era = ERAS[BOOK_ERA[nd.book_id]]?.name || '';
  const ot = cns.filter(n => n.testament === 'OT').length;
  const nt = cns.filter(n => n.testament === 'NT').length;
  const ppl = [...new Set([nd,...cns].flatMap(n => n.ppl||[]))].slice(0,5);
  const locs = [...new Set([nd,...cns].flatMap(n => n.loc||[]))].slice(0,4);
  const bks = new Set(cns.map(n => n.book_id)).size;
  const vt = fulltext?.[`${nd.book_id}:${nd.ch}`]?.[nd.v-1] || nd.preview || '';
  const vtS = vt.length > 110 ? vt.slice(0,110)+'\u2026' : vt;
  const pivots = cns.filter(n => (n.mass||1) > 1.5).slice(0,2);
  const isHub = conns.length >= 10;
  const bridgesT = ot > 0 && nt > 0;
  const ref = `<b>${nd.book} ${nd.ch}:${nd.v}</b>`;
  const q = query.toLowerCase();
  const overview = () => `${ref}${vt ? ` \u2014 <em>\u201c${escHtml(vtS)}\u201d</em>` : ''}<br><br>A ${era} text with ${conns.length} cross-reference${conns.length!==1?'s':''} across ${bks} book${bks!==1?'s':''}. ${isHub ? 'As a <em>scriptural nexus</em> it anchors connections across the canon. ' : ''}${bridgesT ? `Its ${ot} OT \xb7 ${nt} NT connections mark it as a <em>covenant bridge</em>, where promise meets fulfillment. ` : ''}${(nd.mass||1) > 1.5 ? 'Designated <em>pivotal</em> \u2014 this verse carries above-average canonical weight. ' : ''}${nd.conflict ? 'It sits at a point of <em>spiritual conflict</em> in the narrative. ' : ''}${ppl.length ? 'Figures: ' + ppl.slice(0,3).join(', ') + '. ' : ''}<br><br>Ask a specific question \u2014 <em>who, where, how does it connect, how to pray</em> \u2014 to go deeper.`;
  if (!q) return overview();
  if (q.length < 4 || q.match(/^(hi|hey|hello|greet|test|ok|okay|yes|no|cool|great|thanks|yo|sup)\b/)) return `I\u2019m here to explore ${ref} with you. Try: <em>who are the figures here, where does this take place, how does it connect, how to pray with it</em> \u2014 or ask about a specific word or theme.`;
  if (q.match(/^what about|^tell me about|^show me|^this one|^this verse|^and this|^what is this|^what\?/)) return overview();
  if (q.match(/who|people|person|figure|name/)) {
    if (!ppl.length) return `${ref} \u2014 no named figures recorded in this passage or its connections. The verse speaks without specific human attribution.`;
    return `${ref} \u2014 figures present: <em>${ppl.join(', ')}</em>.${ppl.length > 2 ? ` This verse participates in a character web across ${bks} book${bks>1?'s':''}.` : ''} ${cns.filter(n=>n.ppl?.includes(ppl[0])).length > 1 ? ppl[0]+' also appears in '+cns.filter(n=>n.ppl?.includes(ppl[0])).length+' connected passages.' : ''}`;
  }
  if (q.match(/where|place|location|land|city|geograph/)) {
    if (!locs.length) return `${ref} \u2014 no specific locations recorded. Its message transcends geography.`;
    return `${ref} \u2014 locations: <em>${locs.join(', ')}</em>. ${era==='Historical'?'Geography is central to the covenant narrative \u2014 land is promise, exile is judgment, return is restoration.':era==='Prophets'?'Prophetic place names carry covenantal weight far beyond mere geography.':'These places anchor the text in salvation history.'}`;
  }
  if (q.match(/connect|relate|link|bridge|passage|other verse|two verse|those verse|other two|three verse|those two|what are the/)) {
    if (!conns.length) return `${ref} \u2014 no cross-references recorded. It stands as a distinct scriptural voice.`;
    const tops = cns.slice(0,4).map(c => {
      const cvt = fulltext?.[`${c.book_id}:${c.ch}`]?.[c.v-1] || c.preview || '';
      const cvtS = cvt.length > 75 ? cvt.slice(0,75)+'\u2026' : cvt;
      return `<em>${c.book} ${c.ch}:${c.v}</em>${cvtS ? ` \u2014 \u201c${escHtml(cvtS)}\u201d` : ''}`;
    });
    return `${ref} connects to:<br><br>${tops.join('<br>')}${conns.length>4?`<br><em>\u2026 and ${conns.length-4} more</em>`:''}.<br><br>${bridgesT?`The ${ot} OT \xb7 ${nt} NT span reveals a typological pattern \u2014 Old Covenant shadow meeting New Covenant substance.`:`All ${conns.length} connection${conns.length!==1?'s':''} lie within the ${nd.testament}.`}${pivots.length?' Notably linked to the pivotal '+pivots.map(p=>`<em>${p.book} ${p.ch}:${p.v}</em>`).join(' and ')+'.':''}`;
  }
  if (q.match(/pray|meditat|how do|how should|guidance|help|practice|lectio/)) {
    return `To pray with ${ref}: <em>\u201c${escHtml(vtS)}\u201d</em><br><br>${era==='Wisdom'?'Wisdom literature invites slow ruminative reading (lectio divina) \u2014 read once for meaning, again for tone, a third time for what surprises you.':era==='Prophets'?'Prophetic texts reward sitting with the discomfort of divine address. Let the call land before seeking comfort.':nd.kind==='praise'||nd.kind==='blessing'?'Psalmic prayer is full-range \u2014 bring the actual emotion (joy, fear, anger, gratitude) before God rather than a cleaned-up version.':bridgesT?'The bridge across both Testaments invites a sweeping gaze \u2014 from promise to fulfillment, shadow to substance.':'Read slowly, then re-read. Note what word or phrase catches you. Sit with the resistance as much as the comfort.'} ${ppl.length?`<br><br>Bring ${ppl[0]} before God, considering their role in this narrative.`:''} Ask: what in this word is alive for me today?`;
  }
  const CONCEPTS=[
    [/\b(revenge|vengeance|retribut|punish|wrath|fury|avenge)\b/,'divine justice','In biblical theology, divine vengeance is not arbitrary anger but the active restoration of covenant order. God\u2019s retribution answers the injustice that human courts cannot reach \u2014 it is the protection of the vulnerable woven into creation\u2019s fabric. The wrath of God and the love of God are not opposites; they are the same holiness responding to two different conditions.'],
    [/\b(mercy|grace|compassion|kindness|tender|lovingkind|favour)\b/,'covenant love (hesed)','The Hebrew <em>hesed</em> and Greek <em>charis</em> define this vocabulary. Mercy is not weakness but the loyal love that holds covenant together \u2014 the choice to remain faithfully present when strict justice would not require it. It is unilateral, initiating, and inexhaustible.'],
    [/\b(father|son|child|children|generation|heir|inherit|adoption)\b/,'covenant lineage','Familial language in Scripture carries covenant weight. Sonship is election; fatherhood is faithfulness; inheritance is promise. What reads as natural family is simultaneously the structure of divine-human relationship \u2014 and the typological core of the Incarnation.'],
    [/\b(people|nation|israel|tribe|congregation|assembly|church|elect|folk)\b/,'covenant community','The corporate dimension is primary: salvation in Scripture is consistently communal before it is individual. \u201cMy people\u201d encodes the entire covenant relationship \u2014 belonging, obligation, mutual protection, and shared identity before God.'],
    [/\b(sword|war|battle|enemy|fight|conquer|strength|victory|warrior|host|army)\b/,'spiritual conflict','Military language operates on multiple registers \u2014 historical warfare, spiritual battle, and the eschatological conflict between the Kingdom and its adversaries all pulse through the same vocabulary. The enemies of God\u2019s people are never merely political.'],
    [/\b(covenant|promis|oath|vow|testament|agreement|bond|seal|pact)\b/,'covenant theology','Covenantal language is the backbone of salvation history. Each covenant \u2014 Noahic, Abrahamic, Mosaic, Davidic, New \u2014 narrows the scope and deepens the relationship, building toward a fulfillment no single covenant could carry alone.'],
    [/\b(bread|wine|water|blood|flesh|body|lamb|sacrifice|offer|altar|priestly)\b/,'sacramental type','Material elements in Scripture bear sacramental weight \u2014 they point beyond themselves to the realities they signify. The physical becomes the vehicle for the divine, and the pattern repeats: what is offered is also received back transformed.'],
    [/\b(light|darkness|shadow|glory|fire|cloud|presence|shekinah|radiance)\b/,'theophanic symbol','Light, fire, cloud, and glory are the grammar of divine presence in Scripture \u2014 not metaphors but the recurring visual register of God\u2019s self-disclosure, from the burning bush to the Transfiguration to the illuminated new creation.'],
    [/\b(heart|soul|spirit|mind|will|desire|inward|innermost|conscience)\b/,'the inner life','Scripture\u2019s anthropology is holistic: heart, soul, mind, and strength are not separate compartments but facets of the whole person standing before God. This language always invites interior examination rather than external performance.'],
    [/\b(human|humanity|man|flesh|mortal|creature|creation|image|imago|dignity)\b/,'human dignity (imago Dei)','Biblical anthropology holds two inseparable realities: the creature made in the divine image (<em>imago Dei</em>) and the dust that returns to dust. Dignity and dependence are not opposing claims but the single true account of what a human person is.'],
    [/\b(king|kingdom|throne|reign|rule|dominion|lord|master|sovereign|authority)\b/,'divine sovereignty','Kingship language gestures toward the question of ultimate authority. Human kings are measured against the divine standard and found wanting. The Kingdom of God is the answer the whole canon is building toward \u2014 the reign entering the world in the person of the King.'],
    [/\b(good|goods|wealth|riches|treasure|possessions|property|gold|silver|mammon|money)\b/,'material theology','Material goods in Scripture are never morally neutral: they are either instruments of covenant faithfulness (stewarded for others and God) or instruments of idolatry (hoarded as substitutes for trust). The question is always one of ultimate allegiance.'],
    [/\b(word|speak|voice|command|say|said|proclaim|declare|tongue|lip|utterance)\b/,'divine speech','When God speaks in Scripture it is performative \u2014 the word does not merely describe reality, it creates it. Divine speech is the hinge on which all of creation and covenant turns; the logos doctrine is the final articulation of what the whole canon already knows.'],
    [/\b(sin|iniquity|transgress|guilt|fail|fall|repent|confess|forgive|pardon|atone)\b/,'sin and redemption','The logic of sin in Scripture is covenantal: to sin is to rupture a relationship, not merely break a rule. Forgiveness is therefore also covenantal \u2014 a relational restoration. The gravity of sin is measured by the worth of the relationship it damages.'],
    [/\b(death|die|dead|grave|tomb|resurrect|rise|risen|live|life|eternal|immortal)\b/,'death and resurrection','Death in Scripture is not merely biological but theological: the consequence of separation from the source of life. Resurrection is transformation \u2014 the old creation passing through death into the new, not bypassing it.'],
    [/\b(fear|afraid|tremble|awe|reverence|dread|terror|holy|sacred|awesome)\b/,'fear of the Lord','Biblical fear of God is not panic but the appropriate posture of a creature before its Creator \u2014 the orientation from which all wisdom, worship, and right action flow. It is simultaneously terrifying and the safest place in the universe.'],
    [/\b(faith|trust|believe|belief|hope|wait|patient|endure|abide|persevere)\b/,'faith and hope','Biblical faith is not intellectual assent but covenantal fidelity \u2014 the orientation of the whole self toward God in the face of what remains unseen. Hope is its future tense: trust extended into the not-yet.'],
    [/\b(holy|holiness|sanctif|pure|purif|clean|sacred|dedicate|consecrat|set apart)\b/,'holiness','Holiness is first an attribute of God before it is a command to humans. \u201cBe holy as I am holy\u201d is a call to participate in the divine nature \u2014 set apart not merely from impurity but for the specific purposes of God.'],
    [/\b(eight|eighth|circumcis|new creation|octave)\b/,'numeric \u2014 8, new creation','The number 8 in Scripture signifies new creation and new beginnings. Circumcision on the 8th day marks entry into covenant. The Resurrection on the 8th day (Sunday) inaugurates the new creation \u2014 the old seven-day cycle is transcended.'],
    [/\b(seven|seventh|sabbath|rest|complete|perfect|seal|week)\b/,'numeric \u2014 7, completion','Seven marks divine completion and covenant rest \u2014 the sabbath structure woven into creation itself. Seven seals, seven churches, seven spirits all point to God\u2019s perfect ordering of all things. To be \u201cfinished\u201d in Scripture is to reach seven.'],
    [/\b(forty|desert|wilderness|tempt|fast|flood|wander)\b/,'numeric \u2014 40, trial','Forty is the number of trial, testing, and preparation: 40 days of flood, 40 years wandering, 40 days on Sinai, 40 days of Christ\u2019s temptation. Every period of 40 ends with a new phase of salvation history \u2014 judgment becomes doorway.'],
    [/\b(three|third|trinity|triune|triple)\b/,'numeric \u2014 3, divine','Three encodes the Trinitarian structure of reality \u2014 Father, Son, Holy Spirit. Peter\u2019s triple denial and restoration, Jonah\u2019s three days, the Resurrection on the third day all participate in this divine pattern of wholeness.'],
    [/\b(twelve|twelfth|tribe|apostle)\b/,'numeric \u2014 12, governance','Twelve is the number of divine governance \u2014 12 tribes of Israel, 12 apostles, 12 gates of the New Jerusalem. It signifies the fullness of God\u2019s ordered rule through chosen representatives among His people.'],
  ];
  if (q.match(/mean|what|explain|interpret|signif|symbol|understand|why|word|term/) && !q.match(/^what about|^what is this|^what do you|^what can/)) {
    for (const [pat,concept,analysis] of CONCEPTS) {
      if (pat.test(q) || (vt && pat.test(vt.toLowerCase()))) return `${ref} \u2014 <em>\u201c${escHtml(vtS)}\u201d</em><br><br><strong>${concept}:</strong> ${analysis}${bridgesT?`<br><br>The ${ot} OT \xb7 ${nt} NT resonances confirm this theme runs the full length of the canon.`:''}${ppl.length?`<br><br>In the context of ${ppl[0]}, this language takes a particularly concrete form.`:''}`;
    }
    const words=(q.match(/\b([a-z]{4,})\b/g)||[]).filter(w=>!['what','does','this','mean','here','that','with','from','about','they','have','verse','text','pass','bible','book','make','just','also','more','some','than','your','their','these','those','tell','give','show','know','where','when','which','word','term','explain','refer'].includes(w)).slice(0,2);
    const focus=words.length?`The term <em>\u201c${words[0]}\u201d</em>`:'This language';
    return `${ref} \u2014 <em>\u201c${escHtml(vtS)}\u201d</em><br><br>${focus} in this ${era} context ${era==='Wisdom'?'carries compressed moral meaning \u2014 the Wisdom tradition consistently reframes observable realities as measures of the soul\u2019s orientation toward God.':era==='Historical'?'encodes covenant standing \u2014 Historical literature insists events carry theological meaning beyond their surface occurrence.':era==='Prophets'?'has been reclaimed by the prophetic voice and loaded with covenantal, eschatological weight far beyond ordinary usage.':era==='Epistles'?'is doing precise theological work within a pastoral argument \u2014 Epistolary writers choose every term to shape the understanding of a living community.':era==='Gospels'?'sits at the center of the Kingdom proclamation \u2014 ordinary language transfigured by the one speaking it.':'merits close attention to both its lexical range and the tradition it inhabits.'}<br><br>${bridgesT?`The OT\u2013NT bridge this verse forms suggests the theme runs from promise to fulfillment. `:''}${conns.length?`Try <em>how does it connect</em> to trace it through ${conns.length} related verse${conns.length>1?'s':''}.`:''}`;
  }
  return `${ref}${vt?` \u2014 <em>\u201c${escHtml(vtS)}\u201d</em>`:''}<br><br>${era==='Wisdom'?'The compression of moral truth into memorable form \u2014 every word load-bearing.':era==='Historical'?'Events becoming theology \u2014 the narrative insists on meaning behind the facts.':era==='Prophets'?'The prophetic voice wedged between divine address and human response \u2014 the tension is the point.':era==='Epistles'?'Pastoral precision \u2014 doctrine shaped to the needs of a real community.':era==='Gospels'?'The Kingdom arriving in the particular \u2014 one encounter, one word at a time.':era==='Acts'?'The Spirit moving through the particular choices of particular people \u2014 history as theology.':'A text worth sitting with at multiple registers.'} ${bridgesT?`The OT\u2013NT bridge it forms points to a typological pattern worth tracing. `:``}${ppl.length?`<br><br>Try: <em>who is ${ppl[0]} here?</em> `:''}${locs.length?`Or: <em>where does ${locs[0]} figure into the larger story?</em>`:`Or: <em>how does this connect across the canon?</em>`}`;
}
const SACRED_WORDS=['Jesus','Jesu','Jesum','Iesu','Iesus','Christ','Christus','Christe','Christi','Christum','Maria','Mariam','Mary','Deus','Dei','Deum','Deo','Domine','Dominus','Dominum','Domini','God','Lord','Spiritus','Spirit','Father','Patris','Pater','Patrem','Filii','Filium','Filius','Son','Son\u2019s','Sancti','Sanctus','Holy','Trinity','Michael','Archangel'];
const SACRED_SET=new Set(SACRED_WORDS.map(w=>w.toLowerCase()));
const PRAYERS=[
  {id:'signum',name:'Sign of the Cross',cross:true,rubric:'Signum Crucis',latin:'In n\u00f3mine Patris, et F\u00edlii, et Sp\u00edritus Sancti. Amen.',english:'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.'},
  {id:'pater',name:'Our Father',rubric:'Pater Noster',latin:'Pater noster, qui es in c\u00e6lis, sanctific\u00e9tur nomen tuum. Adv\u00e9niat regnum tuum. Fiat vol\u00fantas tua, sicut in c\u00e6lo et in terra. Panem nostrum quotidi\u00e1num da nobis h\u00f3die, et dim\u00edtte nobis d\u00e9bita nostra sicut et nos dim\u00edttimus debit\u00f3ribus nostris. Et ne nos ind\u00facas in tentati\u00f3nem, sed l\u00edbera nos a malo. Amen.',english:'Our Father, who art in heaven, hallowed be thy name. Thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us. And lead us not into temptation, but deliver us from evil. Amen.'},
  {id:'ave',name:'Hail Mary',rubric:'Ave Maria',latin:'Ave Mar\u00eda, gr\u00e1tia plena, D\u00f3minus tecum. Benedicta tu in muli\u00e9ribus, et benedictus fructus ventris tui, Iesus. Sancta Mar\u00eda, Mater Dei, ora pro nobis peccat\u00f3ribus, nunc et in hora mortis nostr\u00e6. Amen.',english:'Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.'},
  {id:'gloria',name:'Glory Be',rubric:'Gloria Patri',latin:'Gl\u00f3ria Patri, et F\u00edlio, et Spir\u00edtui Sancto. Sicut erat in princ\u00edpio, et nunc, et semper, et in s\u00e6cula s\u00e6cul\u00f3rum. Amen.',english:'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.'},
  {id:'credo',name:"Apostles' Creed",rubric:'Symbolum Apostolorum',latin:'Credo in Deum, Patrem omnipot\u00e9ntem, Creat\u00f3rem c\u00e6li et terr\u00e6. Et in Iesum Christum, F\u00edlium eius \u00fanicum, D\u00f3minum nostrum: qui conc\u00e9ptus est de Sp\u00edritu Sancto, natus ex Mar\u00eda V\u00edrgine, passus sub P\u00f3ntio Pil\u00e1to, crucif\u00edxus, m\u00f3rtuus, et sep\u00faltus: desc\u00e9ndit ad \u00ednferos; t\u00e9rtia die resurr\u00e9xit a m\u00f3rtuis; asc\u00e9ndit ad c\u00e6los; sedet ad d\u00e9xteram Dei Patris omnipot\u00e9ntis: inde vent\u00farus est iudic\u00e1re vivos et m\u00f3rtuos. Credo in Sp\u00edritum Sanctum, sanctam Eccl\u00e9siam cath\u00f3licam, Sanct\u00f3rum communi\u00f3nem, remissi\u00f3nem peccat\u00f3rum, carnis resurrecti\u00f3nem, vitam \u00e6t\u00e9rnam. Amen.',english:'I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.'},
  {id:'salve',name:'Salve Regina',rubric:'Salve Regina',latin:'Salve, Reg\u00edna, mater miseric\u00f3rdi\u00e6; vita, dulc\u00e9do et spes nostra, salve. Ad te clam\u00e1mus \u00e9xsules f\u00edlii Hev\u00e6. Ad te suspir\u00e1mus, gem\u00e9ntes et flentes in hac lacrim\u00e1rum valle. Eia ergo, advoc\u00e1ta nostra, illos tuos miseric\u00f3rdes \u00f3culos ad nos convert\u00e9rte. Et Iesum, benedictum fructum ventris tui, nobis, post hoc ex\u00edlium, ost\u00e9nde. O clemens, O pia, O dulcis Virgo Mar\u00eda.',english:'Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.'},
  {id:'memorare',name:'Memorare',rubric:'Memorare',latin:'Memor\u00e1re, O pi\u00edssima Virgo Mar\u00eda, non esse aud\u00edtum a s\u00e6culo, quemquam ad tua curr\u00e9ntem pr\u00e6s\u00eddia, tua implor\u00e1ntem aux\u00edlia, tua pet\u00e9ntem suffr\u00e1gia, esse der\u00e9lictum. Ego tali anim\u00e1tus confid\u00e9ntia, ad te, Virgo V\u00edrginum, Mater, curro; ad te v\u00e9nio; coram te gemens peccator ass\u00edsto. Noli, Mater Verbi, verba mea desp\u00edcere, sed \u00e1udi prop\u00edtia et ex\u00e1udi. Amen.',english:'Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession, was left unaided. Inspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother; to thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.'},
  {id:'michael',name:'St. Michael',rubric:'Oratio ad S. Michaelem',latin:'Sancte M\u00edcha\u00ebl Arch\u00e1ngele, def\u00e9nde nos in pr\u00e6lio; contra nequ\u00edtiam et ins\u00eddias di\u00e1boli esto pr\u00e6s\u00eddium. \u00cdmperet illi Deus, s\u00fapplices deprec\u00e1mur: tuque, princeps mil\u00edti\u00e6 c\u00e6l\u00e9stis, S\u00e1tanam ali\u00f3sque sp\u00edritus mal\u00edgnos, qui ad perditi\u00f3nem anim\u00e1rum perv\u00e1gantur in mundo, div\u00edna virt\u00fate in inf\u00e9rnum detr\u00fade. Amen.',english:'St. Michael the Archangel, defend us in battle; be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly host, by the power of God, thrust into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.'},
  {id:'veni',name:'Come Holy Spirit',rubric:'Veni Sancte Spiritus',latin:'Veni, Sancte Sp\u00edritus, reple tu\u00f3rum corda fid\u00e9lium, et tui am\u00f3ris in eis ignem acc\u00e9nde. Emitte Sp\u00edritum tuum et cre\u00e1buntur; et renov\u00e1bis f\u00e1ciem terr\u00e6. Or\u00e9mus: Deus, qui corda fid\u00e9lium Sancti Sp\u00edritus illustrati\u00f3ne docu\u00edsti, da nobis in e\u00f3dem Sp\u00edritu recta s\u00e1pere, et de eius semper consolati\u00f3ne gaud\u00e9re. Per Christum D\u00f3minum nostrum. Amen.',english:'Come, Holy Spirit, fill the hearts of thy faithful and kindle in them the fire of thy love. Send forth thy Spirit and they shall be created, and thou shalt renew the face of the earth. Let us pray: O God, who by the light of the Holy Spirit didst instruct the hearts of the faithful, grant that by the same Spirit we may be truly wise and ever rejoice in his consolation. Through Christ our Lord. Amen.'},
  {id:'contritio',name:'Act of Contrition',rubric:'Actus Contritionis',latin:'Deus meus, ex toto corde p\u00e6nitet me \u00f3mnium me\u00f3rum pecc\u00e1torum, eaque det\u00e9stor, quia peccando, non solum p\u0153nas a te iuste statutas prom\u00e9ritus sum, sed pr\u00e6s\u00e9rtim quia off\u00e9ndi te, summum bonum, ac dignum qui super \u00f3mnia dilig\u00e1ris. Ideo firmiter prop\u00f3no, adiuv\u00e1nte gr\u00e1tia tua, de c\u00e9tero me non peccat\u00farum, pecc\u00e1ndique occasi\u00f3nes pr\u00f3ximas fugit\u00farum. Amen.',english:'O my God, I am heartily sorry for having offended thee, and I detest all my sins, because I dread the loss of heaven and the pains of hell; but most of all because they offend thee, my God, who art all-good and deserving of all my love. I firmly resolve, with the help of thy grace, to confess my sins, to do penance, and to amend my life. Amen.'},
  {id:'anima',name:'Anima Christi',rubric:'Anima Christi',latin:'Anima Christi, sanct\u00edfica me. Corpus Christi, salva me. Sanguis Christi, in\u00e9bria me. Aqua l\u00e1teris Christi, lava me. P\u00e1ssio Christi, conf\u00f3rta me. O bone Iesu, ex\u00e1udi me. Intra tua v\u00falnera absc\u00f3nde me. Ne perm\u00edttas me separ\u00e1ri a te. Ab hoste mal\u00edgno def\u00e9nde me. In hora mortis me\u00e6 voca me, et iube me ven\u00edre ad te, ut cum Sanctis tuis laudem te in s\u00e6cula s\u00e6cul\u00f3rum. Amen.',english:'Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. Within thy wounds, hide me. Permit me not to be separated from thee. From the malignant enemy, defend me. In the hour of my death, call me, and bid me come unto thee, that with thy saints I may praise thee forever and ever. Amen.'},
  {id:'fatima',name:'Fatima Prayer',rubric:'Oratio Fatimensis',latin:'O mi Iesu, dim\u00edtte nobis deb\u00edta nostra, l\u00edbera nos ab igne inf\u00e9rni, conduc in c\u00e6lum omnes \u00e1nimas, pr\u00e6s\u00e9rtim illas qu\u00e6 m\u00e1xime indigent misericordia tua.',english:'O my Jesus, forgive us our sins, save us from the fires of hell, and lead all souls to heaven, especially those in most need of thy mercy.'},
  {id:'angelus',name:'Angelus',rubric:'Angelus Domini',latin:'V. Angelus D\u00f3mini nunti\u00e1vit Mar\u00ed\u00e6. R. Et conc\u00e9pit de Sp\u00edritu Sancto. Ave Maria\u2026 V. Ecce anc\u00edlla D\u00f3mini. R. Fiat mihi sec\u00fandum verbum tuum. Ave Maria\u2026 V. Et Verbum caro factum est. R. Et habit\u00e1vit in nobis. Ave Maria\u2026 V. Ora pro nobis, sancta Dei G\u00e9netrix. R. Ut digni effici\u00e1mur promissi\u00f3nibus Christi.',english:'V. The Angel of the Lord declared unto Mary. R. And she conceived of the Holy Spirit. Hail Mary\u2026 V. Behold the handmaid of the Lord. R. Be it done unto me according to thy word. Hail Mary\u2026 V. And the Word was made flesh. R. And dwelt among us. Hail Mary\u2026 V. Pray for us, O Holy Mother of God. R. That we may be made worthy of the promises of Christ.'},
  {id:'rosary',name:'Rosary (today)',rubric:'Sanctissimum Rosarium',rosary:true,latin:'',english:''}
];
const ROSARY_MYSTERIES={
  joyful:{name:'Joyful Mysteries',latin:'Mysteria Gaudiosa',items:['The Annunciation','The Visitation','The Nativity of Our Lord','The Presentation in the Temple','The Finding of Jesus in the Temple']},
  sorrowful:{name:'Sorrowful Mysteries',latin:'Mysteria Dolorosa',items:['The Agony in the Garden','The Scourging at the Pillar','The Crowning with Thorns','The Carrying of the Cross','The Crucifixion']},
  glorious:{name:'Glorious Mysteries',latin:'Mysteria Gloriosa',items:['The Resurrection','The Ascension','The Descent of the Holy Spirit','The Assumption of Mary','The Coronation of Mary as Queen of Heaven']},
  luminous:{name:'Luminous Mysteries',latin:'Mysteria Luminosa',items:['The Baptism of Jesus','The Wedding at Cana','The Proclamation of the Kingdom','The Transfiguration','The Institution of the Eucharist']}
};
function getRosaryToday(){const d=new Date().getDay();return d===0||d===3?'glorious':d===1||d===6?'joyful':d===2||d===5?'sorrowful':'luminous';}
let activePrayerId='signum',prayerLang='both';
function buildPrayerNav(){const nav=document.getElementById('pray-nav');nav.innerHTML=PRAYERS.map(p=>`<button class="pray-pill${p.id===activePrayerId?' active':''}" data-id="${p.id}">${escHtml(p.name)}</button>`).join('');nav.querySelectorAll('.pray-pill').forEach(b=>b.addEventListener('click',()=>{activePrayerId=b.dataset.id;renderPrayer();}));}
function wrapSacred(text){return escHtml(text);}
function animateWords(container,html){container.innerHTML=html;const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);const texts=[];let n;while(n=walker.nextNode())texts.push(n);let wi=0;for(const t of texts){const parent=t.parentNode;const words=t.textContent.split(/(\s+)/);const frag=document.createDocumentFragment();for(const w of words){if(!w.trim()){frag.appendChild(document.createTextNode(w));continue;}const span=document.createElement('span');span.className='pray-word';span.style.animationDelay=`${Math.min(wi*28,2800)}ms`;const token=w.toLowerCase().replace(/[^ -\p{L}\p{M}]+/gu,'');if(SACRED_SET.has(token)||SACRED_SET.has(token.replace(/s$/,'')))span.classList.add('sacred');span.textContent=w;frag.appendChild(span);wi++;}parent.replaceChild(frag,t);}}
function renderPrayer(){buildPrayerNav();const p=PRAYERS.find(x=>x.id===activePrayerId)||PRAYERS[0];const rub=document.getElementById('pray-rubric'),lat=document.getElementById('pray-text-latin'),eng=document.getElementById('pray-text-english'),foot=document.getElementById('pray-foot');rub.textContent=p.rubric||'';lat.className='pray-text latin';eng.className='pray-text english';if(prayerLang==='latin')eng.classList.add('hidden-lang');if(prayerLang==='english')lat.classList.add('hidden-lang');if(p.rosary){const key=getRosaryToday(),m=ROSARY_MYSTERIES[key];lat.innerHTML=`<div style="font-style:italic;color:#c9b88a;margin-bottom:6px">${escHtml(m.latin)}</div><div class="rosary-today">Today &middot; ${escHtml(m.name)}</div><ul class="mystery-list">${m.items.map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul>`;eng.innerHTML='<em style="color:#8a7a5a;font-size:.72rem">Begin with the Sign of the Cross, the Apostles\u2019 Creed, one Our Father, three Hail Marys, and a Glory Be. Then pray each decade: one Our Father, ten Hail Marys, one Glory Be, and the Fatima Prayer.</em>';foot.innerHTML='<span class="amen">AMEN</span>';return;}if(p.cross){rub.innerHTML=`<svg class="drawn-cross draw" viewBox="0 0 54 68" xmlns="http://www.w3.org/2000/svg"><path d="M27 4 L27 64 M8 22 L46 22"/></svg>${escHtml(p.rubric)}`;}animateWords(lat,wrapSacred(p.latin));animateWords(eng,wrapSacred(p.english));foot.innerHTML=/Amen\.?$/i.test(p.english)?'<span class="amen">AMEN</span>':'';}
function cyclePrayerLang(){const order=['both','latin','english'];prayerLang=order[(order.indexOf(prayerLang)+1)%3];const btn=document.getElementById('pray-lang-btn');btn.textContent=prayerLang.toUpperCase();btn.dataset.lang=prayerLang;renderPrayer();}
function openPray(){const panel=document.getElementById('pray-panel');if(panel.style.display==='flex'){closePray();return;}document.getElementById('discuss-panel').style.display='none';document.getElementById('patterns-panel').style.display='none';document.getElementById('ai-setup-panel').style.display='none';panel.style.display='flex';renderPrayer();}
function closePray(){document.getElementById('pray-panel').style.display='none';}
load().catch(e => console.error('Failed to load:', e));
