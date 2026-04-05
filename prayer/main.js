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

let graph, scene, camera, renderer, controls;
let pointsMesh, edgesMesh, raycaster, mouse, tooltip, statsEl;
let hoveredIdx = -1, showEdges = true, kindFilter = 'all';
let baseSizes, baseColors;
let selectedIdx = -1, adj = null;
let fulltext = null;
const bookPanel = () => document.getElementById('book-panel');
const bookBody = () => document.getElementById('book-panel-body');
const bookTitle = () => document.getElementById('book-panel-title');
let silhouettePos=null,waterfallPos=null,timelinePos=null,graphPos=null,solarPos=null,goldenPos=null,crossPos=null,iamPos=null,cleanPos=null;let mode='timeline';let lerpSrc=null,lerpDst=null,lerpT=1.0;const LERP_FRAMES=90;const ease=t=>t<0.5?2*t*t:-1+(4-2*t)*t;const SCALE=1.8;let camSrc=null,camDst=null,camTgtSrc=null,camTgtDst=null,camT=1.0;const CAM_FRAMES=60;let pulsePhase=0;let clickTimer=null;let downX=0,downY=0,wasDrag=false;let tandemActive=false;let userAlpha=1.0;let edgeAlphaBase=0.06;let patternsActive=false;

async function load() {
  await init();
  const resp = await fetch('./data/bible_graph.json');
  graph = await resp.json();
  const ftResp = await fetch('./data/bible_fulltext.json');
  fulltext = await ftResp.json();
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
  console.time('WASM layout');
  const rawSil=JSON.parse(compute_layout(JSON.stringify(layoutInput),45));
  silhouettePos=rawSil.map(p=>({x:p.x*SCALE,y:p.y*SCALE,z:p.z*SCALE}));
  console.timeEnd('WASM layout');
  waterfallPos=computeWaterfallLayout();timelinePos=computeTimelineLayout();
  console.time('Graph layout');graphPos=computeGraphLayout();console.timeEnd('Graph layout');
  console.time('Solar layout');solarPos=computeSolarLayout('solar');goldenPos=computeSolarLayout('golden');crossPos=computeSolarLayout('cross');iamPos=computeSolarLayout('iam');console.timeEnd('Solar layout');
  console.time('Clean layout');cleanPos=computeCleanLayout();console.timeEnd('Clean layout');
  buildBookLegend();setupScene();buildPoints(timelinePos);buildEdges(timelinePos);animate();
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
  const eraGaps = new Set();
  let prevEra = -1;
  for (let bid = 1; bid <= 73; bid++) {
    if (!bookChapters[bid]) continue;
    const era = BOOK_ERA[bid];
    if (prevEra >= 0 && era !== prevEra) { xCursor += 2.5; eraGaps.add(xCursor); }
    prevEra = era;
    bookX[bid] = xCursor;
    const chapters = Object.keys(bookChapters[bid]).map(Number).sort((a,b) => a-b);
    xCursor += Math.max(1.2, chapters.length * 0.12);
  }
  const xScale = 50 / Math.max(xCursor, 1);
  for (let i = 0; i < n; i++) {
    const nd = graph.nodes[i];
    const bx = (bookX[nd.book_id] || 0) * xScale - 25;
    const chapters = Object.keys(bookChapters[nd.book_id]).map(Number).sort((a,b) => a-b);
    const maxCh = chapters.length;
    const chIdx = chapters.indexOf(nd.ch);
    const versesInCh = bookChapters[nd.book_id][nd.ch];
    const vIdx = versesInCh.indexOf(nd.id);
    const vFrac = versesInCh.length > 1 ? vIdx / (versesInCh.length - 1) : 0.5;
    const y = 8 - (chIdx / Math.max(maxCh-1,1)) * 16;
    const mass = nd.mass || 1.0;
    const zBase = (vFrac - 0.5) * 1.5;
    const z = zBase + Math.max(0, mass-1) * 1.2;
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
function computeSolarLayout(m='solar'){const n=graph.nodes.length;const pos=new Array(n);if(m==='cross'){const sz=28;for(let i=0;i<n;i++){const nd=graph.nodes[i];const phase=i/n*6.28;pos[i]={x:(nd.book_id<40?-sz:sz)*Math.sin(phase),y:nd.ch*0.6-12,z:Math.cos(phase)*sz*0.6+(nd.mass||1)*3};}return pos;}if(m==='iam'){const r=25;for(let i=0;i<n;i++){const nd=graph.nodes[i];const a=i*0.1;pos[i]={x:Math.sin(a)*r,y:i/n*35-18,z:Math.cos(a*2.3)*(nd.mass||1)*6};}return pos;}const bookData={};for(const nd of graph.nodes){if(!bookData[nd.book_id])bookData[nd.book_id]={chapters:{},count:0};bookData[nd.book_id].count++;if(!bookData[nd.book_id].chapters[nd.ch])bookData[nd.book_id].chapters[nd.ch]=[];bookData[nd.book_id].chapters[nd.ch].push(nd.id);}const bookIds=Object.keys(bookData).map(Number).sort((a,b)=>a-b);const totalBooks=bookIds.length;const bookCenters={};const goldenAngle=Math.PI*(3-Math.sqrt(5));bookIds.forEach((bid,bi)=>{const era=BOOK_ERA[bid]||0;const spiralR=(m==='golden'?12:8)+bi/totalBooks*(m==='golden'?55:45);const spiralA=bi*goldenAngle;const tilt=(era%2===0?1:-1)*(bi%3)*1.5;bookCenters[bid]={x:Math.cos(spiralA)*spiralR,y:Math.sin(spiralA)*spiralR,z:tilt};});for(let i=0;i<n;i++){const nd=graph.nodes[i];const center=bookCenters[nd.book_id];const bd=bookData[nd.book_id];const chapters=Object.keys(bd.chapters).map(Number).sort((a,b)=>a-b);const chIdx=chapters.indexOf(nd.ch);const chCount=chapters.length;const orbitR=1.5+chIdx/Math.max(chCount-1,1)*3.5;const chAngle=(chIdx/chCount)*Math.PI*2;const chX=center.x+Math.cos(chAngle)*orbitR;const chY=center.y+Math.sin(chAngle)*orbitR;const chZ=center.z+Math.sin(chAngle*2)*0.5;const versesInCh=bd.chapters[nd.ch];const vIdx=versesInCh.indexOf(nd.id);const vCount=versesInCh.length;const moonR=0.3+(vCount>30?0.8:vCount*0.02);const moonAngle=(vIdx/Math.max(vCount,1))*Math.PI*2;const tiltAngle=chAngle*0.3;const mX=Math.cos(moonAngle)*moonR;const mY=Math.sin(moonAngle)*moonR*Math.cos(tiltAngle);const mZ=Math.sin(moonAngle)*moonR*Math.sin(tiltAngle);pos[i]={x:chX+mX,y:chY+mY,z:chZ+mZ};}return pos;}
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
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a12, 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.008);
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2, 35);
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
    renderer.setSize(c.clientWidth, c.clientHeight);
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
  document.getElementById('book-panel-close').addEventListener('click', closeBookPanel);
  document.getElementById('tandemBtn').addEventListener('click', toggleTandem);
  document.getElementById('tandem-close-btn').addEventListener('click', toggleTandem);
  document.getElementById('alphaSlider').addEventListener('input', e => {
    userAlpha = parseFloat(e.target.value);
    if (pointsMesh) pointsMesh.material.uniforms.uAlphaMul.value = userAlpha;
    if (edgesMesh) edgesMesh.material.opacity = Math.min(1.0, edgeAlphaBase * userAlpha);
  });
  document.getElementById('patternsBtn').addEventListener('click', togglePatterns);
}

function getPositionsForMode(m){return m==='timeline'?timelinePos:m==='waterfall'?waterfallPos:m==='graph'?graphPos:m==='solar'?solarPos:m==='golden'?goldenPos:m==='cross'?crossPos:m==='iam'?iamPos:m==='clean'?cleanPos:silhouettePos;}
function setEdgeOpacity(v){edgeAlphaBase=v;if(edgesMesh)edgesMesh.material.opacity=Math.min(1,v*userAlpha);}
function switchMode(newMode){if(newMode===mode)return;mode=newMode;const posAttr=pointsMesh.geometry.attributes.position;lerpSrc=new Float32Array(posAttr.array);lerpDst=getPositionsForMode(newMode);lerpT=0.0;if(edgesMesh)edgesMesh.visible=false;document.getElementById('waterfall-legend').style.display=newMode==='waterfall'?'block':'none';document.getElementById('graph-legend').style.display=newMode==='graph'?'block':'none';document.getElementById('solar-legend').style.display=(newMode==='solar'||newMode==='golden'||newMode==='iam')?'block':'none';document.getElementById('clean-legend').style.display=newMode==='clean'?'block':'none';const isSpecial=newMode==='solar'||newMode==='golden'||newMode==='iam';if(isSpecial){flyCamera(newMode==='golden'?new THREE.Vector3(0,5,90):newMode==='iam'?new THREE.Vector3(0,10,55):new THREE.Vector3(0,0,70),new THREE.Vector3(0,0,0));controls.autoRotate=true;controls.autoRotateSpeed=newMode==='golden'?0.25:0.15;document.getElementById('autoRotate').checked=true;scene.fog.density=0.004;setEdgeOpacity(0.02);pointsMesh.material.uniforms.uAlphaMul.value=0.9;}else if(newMode==='clean'){flyCamera(new THREE.Vector3(0,0,65),new THREE.Vector3(0,0,0));controls.autoRotate=false;controls.autoRotateSpeed=0.15;document.getElementById('autoRotate').checked=false;scene.fog.density=0.003;setEdgeOpacity(0.12);pointsMesh.material.uniforms.uAlphaMul.value=0.7;}else if(newMode==='graph'){flyCamera(new THREE.Vector3(0,0,80),new THREE.Vector3(0,0,0));controls.autoRotate=true;controls.autoRotateSpeed=0.3;document.getElementById('autoRotate').checked=true;scene.fog.density=0.003;setEdgeOpacity(0.06);pointsMesh.material.uniforms.uAlphaMul.value=0.35;}else if(newMode==='timeline'){flyCamera(new THREE.Vector3(0,2,35),new THREE.Vector3(0,0,0));controls.autoRotate=false;controls.autoRotateSpeed=0.3;document.getElementById('autoRotate').checked=false;scene.fog.density=0.008;setEdgeOpacity(0.03);pointsMesh.material.uniforms.uAlphaMul.value=1.0;}else if(newMode==='waterfall'){flyCamera(new THREE.Vector3(-1,0,28),new THREE.Vector3(-1,0,0));controls.autoRotate=false;controls.autoRotateSpeed=0.3;document.getElementById('autoRotate').checked=false;scene.fog.density=0.008;setEdgeOpacity(0.05);pointsMesh.material.uniforms.uAlphaMul.value=1.0;}else{flyCamera(new THREE.Vector3(0,4,16),new THREE.Vector3(0,3.5,0));controls.autoRotate=true;controls.autoRotateSpeed=0.3;document.getElementById('autoRotate').checked=true;scene.fog.density=0.02;setEdgeOpacity(0.02);pointsMesh.material.uniforms.uAlphaMul.value=1.0;}}
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
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; return; }
  const rect = renderer.domElement.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const cy = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  clickTimer = setTimeout(() => {
    clickTimer = null;
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
  if (wasDrag) return;
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
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
  if (tandemActive && selectedIdx >= 0) populateTandem(selectedIdx);
  else if (tandemActive) {
    document.getElementById('tandem-book').innerHTML = '<p style="opacity:0.4;padding:1rem">Click or double-click a verse node to open it here</p>';
    document.getElementById('tandem-connections').innerHTML = '';
  }
  setTimeout(() => {
    camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
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
load().catch(e => console.error('Failed to load:', e));
