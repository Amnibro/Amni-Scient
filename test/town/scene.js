// Test Town: the three.js scene. A low-poly floating island with districts that mirror
// the tester's data. No game state lives here: town.js calls update(data) and we diff.
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RANKS, AVATAR_COLORS } from './shared.js';

// ---------------------------------------------------------------- constants
const RX = 17, RZ = 21;          // island ellipse radii
const TOP_DEPTH = 1.4;
const C = {
  grass: '#AABD8B', soil: '#B88E63', soil2: '#9E7652', soil3: '#82614A', soil4: '#6D5242',
  stone: '#E4DCCD', stone2: '#CBC1AE', path: '#EADFC8', wood: '#A47B53', woodDark: '#77583B',
  cream: '#F5EEE1', paper: '#FBFAF8', ink: '#22252B', gold: '#C89B4E', goldSoft: '#E2BC7C',
  clay: '#C27759', slate: '#5F6E80', sage: '#7FA07A', water: '#7FB2B6', roofRed: '#B5654B',
};
const CANOPY = ['#C89B4E', '#B5654B', '#6F9A6A', '#5F6E80', '#8D5E9B', '#3F9C95', '#D9A441', '#C46F52', '#7E8C5A'];
const LEAF = ['#7FA36A', '#93B07A', '#6C9460', '#A3B77E', '#86A86F'];

// Districts (world coordinates, y up, camera starts on the +z side).
export const PLACES = {
  plaza: { x: 0, z: 1, r: 4.4, label: 'Plaza' },
  market: { x: -3.5, z: -11.5, r: 7, label: 'Market' },
  workshop: { x: 2.5, z: 13, r: 6, label: 'Your Workshop' },
  quests: { x: -7.6, z: 4.2, r: 2.2, label: 'Quest Board' },
  beacon: { x: 13.2, z: 1.5, r: 2.4, label: 'Streak Beacon' },
  trophies: { x: 9.2, z: -9.5, r: 4.2, label: 'Trophy Hall' },
};
const STALL_SLOTS = [[-11, -8.2], [-7.4, -8.2], [-3.8, -8.2], [-0.2, -8.2], [3.4, -8.2], [-9.4, -12.6], [-5.8, -12.6], [-2.2, -12.6], [1.4, -12.6]];
const TOWER_RUN = [[0.4, 11.2], [-2.6, 12.0], [-5.6, 11.0]];
const TOWER_DONE = [[-3.6, 15.4], [-0.6, 16.0], [-6.6, 14.4], [2.4, 17.0], [-8.8, 11.8], [-1.6, 18.6]];
const HOUSE = [6.2, 12.6];
const POND = [-11.2, -1.8];

// ---------------------------------------------------------------- helpers
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const edgeF = (a) => 1 + 0.055 * Math.sin(3 * a + 1.3) + 0.035 * Math.sin(7 * a + 0.4) + 0.02 * Math.sin(13 * a + 2.1);
const normR = (x, z) => { const a = Math.atan2(z / RZ, x / RX); return Math.hypot(x / RX, z / RZ) / edgeF(a); };
function edgePoint(a, k = 1) { const f = edgeF(a) * k; return [Math.cos(a) * RX * f, Math.sin(a) * RZ * f]; }
const col = (hex) => new THREE.Color(hex);
const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// One colour per part; parts are merged into one draw call per object.
function part(geo, color, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.deleteAttribute('uv');
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));
  g.applyMatrix4(m);
  const c = col(color), n = g.getAttribute('position').count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
function merge(parts) { const g = mergeGeometries(parts.filter(Boolean)); parts.forEach((p) => p && p.dispose()); return g; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, n = 8) => new THREE.CylinderGeometry(rt, rb, h, n);
function gable(w, h, d) { // triangular prism roof, ridge along x
  const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.lineTo(-d / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); return g;
}
function starShape(outer, inner, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i <= n * 2; i++) { const a = Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? inner : outer; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  return s;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const FONT = '"Archivo","Segoe UI",system-ui,-apple-system,Roboto,sans-serif';
function fitText(ctx, text, maxW, size, weight = 800) {
  let s = size; ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && s > 18) { s -= 2; ctx.font = `${weight} ${s}px ${FONT}`; }
  if (ctx.measureText(text).width > maxW) { while (text.length > 2 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1); text += '…'; }
  return text;
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// ---------------------------------------------------------------- avatar
export function avatarHex(id) { return AVATAR_COLORS[id] || AVATAR_COLORS.c0; }
const AV_GEO = {};
function avGeo(shape) {
  if (AV_GEO[shape]) return AV_GEO[shape];
  let g;
  if (shape === 'capsule') { g = new THREE.CapsuleGeometry(0.42, 0.46, 3, 10); g.translate(0, 0.65, 0); }
  else if (shape === 'cone') { g = new THREE.ConeGeometry(0.58, 1.2, 9); g.translate(0, 0.6, 0); }
  else if (shape === 'star') { g = new THREE.ExtrudeGeometry(starShape(0.68, 0.32), { depth: 0.36, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 1 }); g.translate(0, 0.72, -0.18); }
  else { g = new THREE.BoxGeometry(0.86, 0.86, 0.86); g.translate(0, 0.45, 0); }
  return (AV_GEO[shape] = g);
}
const AV_TOP = { cube: 0.88, capsule: 1.29, cone: 1.08, star: 1.38 };
const AV_EYE = { cube: [0.62, 0.44], capsule: [0.86, 0.41], cone: [0.62, 0.36], star: [0.72, 0.27] };

export function buildAvatar(av, mats, scale = 1) {
  av = av || {};
  const shape = ['cube', 'capsule', 'cone', 'star'].includes(av.shape) ? av.shape : 'cube';
  const g = new THREE.Group(); g.name = 'avatar';
  const body = new THREE.Group(); g.add(body); g.userData.body = body;
  const m = new THREE.MeshLambertMaterial({ color: avatarHex(av.color), flatShading: true });
  const mesh = new THREE.Mesh(avGeo(shape), m); mesh.castShadow = true; body.add(mesh);
  const [ey, ez] = AV_EYE[shape];
  const eyeG = new THREE.SphereGeometry(0.075, 6, 4);
  for (const sx of [-0.17, 0.17]) { const e = new THREE.Mesh(eyeG, mats.ink); e.position.set(sx, ey, ez); body.add(e); }
  const top = AV_TOP[shape];
  const hat = new THREE.Group(); hat.position.y = top; body.add(hat);
  const hatColor = av.color === 'c1' ? C.cream : C.ink;
  switch (av.hat) {
    case 'cap': {
      const cm = new THREE.MeshLambertMaterial({ color: hatColor, flatShading: true });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), cm); dome.position.y = -0.04; hat.add(dome);
      const brim = new THREE.Mesh(cyl(0.26, 0.26, 0.04, 8), cm); brim.scale.set(1, 1, 0.8); brim.position.set(0, -0.02, 0.3); hat.add(brim);
      break;
    }
    case 'crown': {
      const base = new THREE.Mesh(cyl(0.34, 0.32, 0.18, 10), mats.goldMetal); base.position.y = 0.06; hat.add(base);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const s = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), mats.goldMetal); s.position.set(Math.cos(a) * 0.29, 0.25, Math.sin(a) * 0.29); hat.add(s); }
      break;
    }
    case 'goggles': {
      hat.position.y = ey + 0.02;
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.04, 4, 14), mats.ink); band.rotation.x = Math.PI / 2; band.scale.set(1, shape === 'cube' ? 1 : 0.92, 1); hat.add(band);
      for (const sx of [-0.17, 0.17]) { const l = new THREE.Mesh(cyl(0.13, 0.13, 0.08, 10), mats.lens); l.rotation.x = Math.PI / 2; l.position.set(sx, 0, ez + 0.03); hat.add(l); }
      break;
    }
    case 'hardhat': {
      const hm = new THREE.MeshLambertMaterial({ color: '#E8B23A', flatShading: true });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), hm); hat.add(dome);
      const brim = new THREE.Mesh(cyl(0.46, 0.46, 0.04, 10), hm); brim.position.y = 0.01; hat.add(brim);
      break;
    }
    case 'halo': {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 6, 18), mats.halo); h.rotation.x = Math.PI / 2; h.position.y = 0.32; hat.add(h); g.userData.halo = h;
      break;
    }
    default: break;
  }
  g.scale.setScalar(scale);
  g.userData.trail = av.trail || 'none';
  g.userData.key = JSON.stringify([av.color, shape, av.hat, av.trail]);
  return g;
}

// ---------------------------------------------------------------- scene
export function createScene(canvas, labelsEl, opts = {}) {
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // baked: re-rendered only when buildings change

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 400);
  const clock = new THREE.Clock();
  const uTime = { value: 0 };
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- materials
  const vc = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const mats = {
    vc,
    ink: new THREE.MeshLambertMaterial({ color: C.ink }),
    goldMetal: new THREE.MeshLambertMaterial({ color: '#D7A74F', emissive: '#5A3D10', flatShading: true }),
    lens: new THREE.MeshLambertMaterial({ color: '#9FD3E0', emissive: '#244850', flatShading: true }),
    halo: new THREE.MeshBasicMaterial({ color: '#FFE3A1' }),
    glow: new THREE.MeshLambertMaterial({ color: '#F6D58F', emissive: '#F2B85A', emissiveIntensity: 0.15, flatShading: true }),
    locked: new THREE.MeshLambertMaterial({ color: '#B9B4AA', transparent: true, opacity: 0.55, flatShading: true }),
    water: new THREE.MeshLambertMaterial({ color: C.water, flatShading: true, transparent: true, opacity: 0.88, emissive: '#1C3C40', emissiveIntensity: 0.25 }),
    hidden: new THREE.MeshBasicMaterial({ visible: false }),
    grass: new THREE.MeshLambertMaterial({ color: C.grass, flatShading: true }),
    soil: new THREE.MeshLambertMaterial({ color: C.soil, flatShading: true }),
  };
  function sway(m, amt) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        #else
          vec4 ip = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        #endif
        float k = max(position.y, 0.0);
        transformed.x += sin(uTime * 1.2 + ip.x * 0.6 + ip.z * 0.4) * ${amt.toFixed(3)} * k;
        transformed.z += cos(uTime * 0.9 + ip.z * 0.5) * ${(amt * 0.6).toFixed(3)} * k;`);
    };
  }
  const leafMat = new THREE.MeshLambertMaterial({ flatShading: true, vertexColors: false });
  sway(leafMat, 0.05);
  const flagMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  flagMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = modelMatrix[3].x * 1.7 + modelMatrix[3].z;
      float d = max(position.x, 0.0);
      transformed.z += sin(uTime * 4.0 - d * 3.2 + ph) * 0.16 * d;
      transformed.y += cos(uTime * 3.0 - d * 2.0 + ph) * 0.04 * d;`);
  };

  // ---------- sky, fog, lights
  const skyU = { top: { value: col('#C9D9DE') }, mid: { value: col('#FBF6EC') }, bot: { value: col('#EBDDC2') } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.55, h)) : mix(mid, bot, smoothstep(0.0, 0.35, -h)); gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  }));
  scene.add(sky);
  scene.fog = new THREE.Fog('#F3EADB', 70, 190);
  const hemi = new THREE.HemisphereLight('#FFF8EC', '#B7A07F', 1.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF1DA', 2.3);
  sun.position.set(14, 30, 18); sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 5, far: 80 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  const flameLight = new THREE.PointLight('#FFB25A', 0, 22, 1.6); scene.add(flameLight);

  // ---------- the island
  const world = new THREE.Group(); scene.add(world);
  const shadowsDirty = () => { renderer.shadowMap.needsUpdate = true; };
  (function island() {
    const N = 64, shape = new THREE.Shape();
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2; const [x, z] = edgePoint(a); i ? shape.lineTo(x, -z) : shape.moveTo(x, -z); }
    const top = new THREE.ExtrudeGeometry(shape, { depth: TOP_DEPTH, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.35, bevelSegments: 1, curveSegments: 1 });
    top.rotateX(-Math.PI / 2); top.translate(0, -TOP_DEPTH - 0.3, 0); // bevel top sits at y = 0
    const m = new THREE.Mesh(top, [mats.grass, mats.soil]); m.receiveShadow = true; world.add(m);
    // rock underside: tapering strata
    const R = rng(7), layers = [[1.0, 0.84, 2.0, C.soil2], [0.84, 0.64, 2.4, C.soil3], [0.64, 0.4, 2.8, C.soil2], [0.4, 0.17, 2.8, C.soil4], [0.17, 0.02, 2.4, C.soil3]];
    let y = -TOP_DEPTH - 0.55; const parts = [];
    for (const [rt, rb, h, c] of layers) {
      const g = new THREE.CylinderGeometry(rt * 0.99, rb, h, 22, 2);
      const p = g.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i); const a = Math.atan2(z, x); const r = Math.hypot(x, z);
        if (r < 1e-4) continue;
        const j = 1 + (R() - 0.5) * 0.16;
        p.setXYZ(i, Math.cos(a) * r * RX * edgeF(a) * j, p.getY(i) + (R() - 0.5) * 0.35, Math.sin(a) * r * RZ * edgeF(a) * j);
      }
      parts.push(part(g, c, [0, y - h / 2, 0])); g.dispose(); y -= h * 0.92;
    }
    const rock = new THREE.Mesh(merge(parts), vc); world.add(rock);
  })();

  // floating islets
  const islets = [];
  [[-27, -4, 8, 2.2], [24, 1, -14, 1.7], [19, -7, 23, 1.3]].forEach(([x, y, z, s], i) => {
    const g = merge([part(cyl(1.6, 1.4, 0.5, 9), C.grass, [0, 0, 0]), part(new THREE.ConeGeometry(1.4, 2.6, 7), C.soil3, [0, -1.55, 0], [Math.PI, 0, 0]),
      part(cyl(0.12, 0.15, 0.7, 5), C.wood, [0.3, 0.6, 0.1]), part(new THREE.IcosahedronGeometry(0.6, 0), LEAF[i], [0.3, 1.25, 0.1])]);
    const m = new THREE.Mesh(g, vc); m.position.set(x, y, z); m.scale.setScalar(s); m.userData.y0 = y; m.userData.ph = i * 2.1; scene.add(m); islets.push(m);
  });

  // ---------- plaza, paths, pond
  (function ground() {
    const parts = [];
    const P = PLACES.plaza;
    parts.push(part(cyl(P.r, P.r + 0.15, 0.16, 20), C.stone, [P.x, 0.08, P.z]));
    parts.push(part(cyl(P.r - 1.1, P.r - 1.1, 0.18, 20), C.stone2, [P.x, 0.09, P.z]));
    parts.push(part(cyl(P.r - 1.35, P.r - 1.35, 0.2, 20), C.stone, [P.x, 0.1, P.z]));
    const pathTo = (x, z, w = 1.3) => {
      const dx = x - P.x, dz = z - P.z, L = Math.hypot(dx, dz) - P.r + 0.4; const a = Math.atan2(dx, dz);
      const mx = P.x + Math.sin(a) * (P.r - 0.2 + L / 2), mz = P.z + Math.cos(a) * (P.r - 0.2 + L / 2);
      parts.push(part(box(w, 0.1, L), C.path, [mx, 0.05, mz], [0, a, 0]));
    };
    pathTo(-3.5, -7.5); pathTo(PLACES.workshop.x, PLACES.workshop.z - 2.6); pathTo(PLACES.quests.x + 1, PLACES.quests.z - 0.2, 1.1);
    pathTo(PLACES.beacon.x - 1.8, PLACES.beacon.z, 1.1); pathTo(PLACES.trophies.x - 1.4, PLACES.trophies.z + 2.4, 1.1);
    // market lane
    parts.push(part(box(17, 0.1, 1.5), C.path, [-4, 0.05, -10.4]));
    // workshop yard
    parts.push(part(cyl(4.2, 4.2, 0.12, 14), '#D8CBA6', [-2.6, 0.06, 13.6], [0, 0, 0], [1.25, 1, 1]));
    // pond bank
    parts.push(part(cyl(3.1, 3.3, 0.14, 14), C.stone2, [POND[0], 0.05, POND[1]], [0, 0, 0], [1, 1, 0.8]));
    // lighthouse mound
    parts.push(part(cyl(1.8, 2.8, 1.0, 9), C.stone2, [PLACES.beacon.x, 0.45, PLACES.beacon.z]));
    parts.push(part(new THREE.DodecahedronGeometry(0.8, 0), C.stone, [PLACES.beacon.x + 1.9, 0.3, PLACES.beacon.z + 1.4]));
    parts.push(part(new THREE.DodecahedronGeometry(0.6, 0), C.stone2, [PLACES.beacon.x - 1.2, 0.2, PLACES.beacon.z + 2.3]));
    const m = new THREE.Mesh(merge(parts), vc); m.receiveShadow = true; m.castShadow = true; world.add(m);
  })();

  // lamps around the plaza (glow at dusk)
  (function lamps() {
    const posts = [], bulbs = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5, x = PLACES.plaza.x + Math.cos(a) * (PLACES.plaza.r + 0.2), z = PLACES.plaza.z + Math.sin(a) * (PLACES.plaza.r + 0.2);
      posts.push(part(cyl(0.06, 0.09, 2.2, 6), C.ink, [x, 1.1, z]));
      bulbs.push(part(new THREE.OctahedronGeometry(0.2, 0), '#FFE0A0', [x, 2.35, z]));
    }
    world.add(new THREE.Mesh(merge(posts), vc));
    world.add(new THREE.Mesh(merge(bulbs), mats.glow));
  })();

  // water: pond + stream + waterfall
  const pondGeo = new THREE.RingGeometry(0.05, 2.75, 16, 3); pondGeo.rotateX(-Math.PI / 2);
  const streamGeo = new THREE.PlaneGeometry(1, 1, 10, 2); streamGeo.rotateX(-Math.PI / 2);
  const water = [];
  {
    const pond = new THREE.Mesh(pondGeo.toNonIndexed(), mats.water); pond.position.set(POND[0], 0.2, POND[1]); pond.scale.set(1, 1, 0.78); world.add(pond); water.push(pond);
    const a = Math.atan2(-0.6 / RZ, -1 / RX), [ex, ez] = edgePoint(Math.PI + 0.03, 1.0);
    const sx = POND[0] - 2.4, L = Math.abs(ex - sx) + 0.6;
    const st = new THREE.Mesh(streamGeo.toNonIndexed(), mats.water); st.scale.set(L, 1, 1.1); st.position.set(sx - L / 2 + 0.3, 0.16, POND[1] - 0.3); world.add(st); water.push(st);
    const tex = canvasTex(64, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(225,240,240,.95)'); g.addColorStop(1, 'rgba(225,240,240,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect((i * 37) % w, (i * 53) % h, 3 + (i % 4), 18 + (i % 5) * 6); }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 1);
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 11), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true }));
    fall.position.set(ex - 0.45, -5.4, POND[1] - 0.3); fall.rotation.y = Math.PI / 2; world.add(fall);
    water.fall = tex; void a;
  }
  water.forEach((m) => { m.userData.base = m.geometry.getAttribute('position').array.slice(); });

  // ---------- trees (instanced)
  const trees = (function () {
    const R = rng(42), spots = [];
    const blocked = [[0, 1, 6.6], [-3.5, -10.5, 9.2], [9.2, -9.5, 5.8], [13.2, 1.5, 4.2], [-7.6, 4.2, 3], [-11.2, -1.8, 4], [-1.5, 13.8, 8.4], [6.2, 12.6, 4.6], [7, -1, 3]];
    let guard = 0;
    while (spots.length < 40 && guard++ < 4000) {
      const a = R() * Math.PI * 2, rr = Math.sqrt(0.18 + R() * 0.74) * 0.93; const [x, z] = edgePoint(a, rr);
      if (blocked.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br)) continue;
      if (Math.abs(z - -10.4) < 1.6 && x > -13 && x < 5) continue;
      if (spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 1.7)) continue;
      spots.push([x, z, 0.75 + R() * 0.55, R() < 0.45 ? 1 : 0, Math.floor(R() * LEAF.length), R() * 6]);
    }
    const trunkG = cyl(0.13, 0.2, 1, 5); trunkG.translate(0, 0.5, 0);
    const roundG = new THREE.IcosahedronGeometry(0.85, 0); roundG.translate(0, 1.55, 0);
    const pineG = merge([part(new THREE.ConeGeometry(0.9, 1.3, 6), '#fff', [0, 1.25, 0]), part(new THREE.ConeGeometry(0.66, 1.1, 6), '#fff', [0, 1.95, 0])]);
    pineG.deleteAttribute('color');
    const nRound = spots.filter((s) => !s[3]).length, nPine = spots.length - nRound;
    const trunk = new THREE.InstancedMesh(trunkG, new THREE.MeshLambertMaterial({ color: C.woodDark, flatShading: true }), spots.length);
    const round = new THREE.InstancedMesh(roundG, leafMat, nRound), pine = new THREE.InstancedMesh(pineG, leafMat, nPine);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let ir = 0, ip = 0;
    spots.forEach(([x, z, s, isPine, ci, ry], i) => {
      M.compose(new THREE.Vector3(x, 0, z), q.setFromEuler(e.set(0, ry, 0)), new THREE.Vector3(s, s * (isPine ? 1.1 : 1), s));
      trunk.setMatrixAt(i, M);
      if (isPine) { pine.setMatrixAt(ip, M); pine.setColorAt(ip++, col(['#5F8A63', '#6E9A6C', '#577F5C'][ci % 3])); }
      else { round.setMatrixAt(ir, M); round.setColorAt(ir++, col(LEAF[ci])); }
    });
    for (const m of [trunk, round, pine]) { m.castShadow = true; m.receiveShadow = true; world.add(m); }
    // bushes & rocks, merged
    const parts = [];
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2, rr = 0.35 + R() * 0.58; const [x, z] = edgePoint(a, rr);
      if (blocked.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br - 0.8)) continue;
      if (R() < 0.5) parts.push(part(new THREE.IcosahedronGeometry(0.42 + R() * 0.2, 0), LEAF[i % LEAF.length], [x, 0.25, z], [R(), R(), 0], [1, 0.7, 1]));
      else parts.push(part(new THREE.DodecahedronGeometry(0.3 + R() * 0.25, 0), R() < 0.5 ? C.stone : C.stone2, [x, 0.12, z], [R(), R(), R()], [1, 0.6, 1]));
    }
    // flowers near the workshop
    for (let i = 0; i < 18; i++) { const x = 8.2 + R() * 3, z = 9 + R() * 6; parts.push(part(new THREE.OctahedronGeometry(0.1, 0), ['#E8C04A', '#F2EEE6', '#D9576B'][i % 3], [x, 0.18, z])); }
    const deco = new THREE.Mesh(merge(parts), vc); deco.castShadow = true; world.add(deco);
    return { trunk, round, pine };
  })();

  // ---------- clouds
  const clouds = [];
  {
    const R = rng(3);
    const cloudMat = new THREE.MeshLambertMaterial({ color: '#FFFFFF', flatShading: true, emissive: '#FFFFFF', emissiveIntensity: 0.18 });
    for (let i = 0; i < 9; i++) {
      const ps = [], n = 3 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) ps.push(part(new THREE.IcosahedronGeometry(1.2 + R() * 1.2, 1), '#fff', [k * 1.6 - n * 0.8, R() * 0.6, (R() - 0.5) * 1.4], [0, 0, 0], [1, 0.72, 1]));
      const m = new THREE.Mesh(merge(ps), cloudMat);
      const low = i % 3 !== 0;
      const ang = R() * Math.PI * 2, rad = low ? 24 + R() * 18 : 70 + R() * 30, y = low ? -10 - R() * 9 : 6 + R() * 14;
      m.material = cloudMat.clone(); m.material.transparent = true;
      m.userData = { ang, rad, y, speed: 0.008 + R() * 0.01 }; m.scale.setScalar(low ? 0.9 + R() * 0.9 : 2 + R() * 1.5); scene.add(m); clouds.push(m);
    }
  }

  // ---------- fireflies (dusk only)
  const fireflies = (function () {
    const n = 46, pos = new Float32Array(n * 3), base = [];
    const R = rng(11);
    for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2; const [x, z] = edgePoint(a, 0.25 + R() * 0.7); base.push([x, 0.6 + R() * 2.4, z, R() * 6]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFD98A', size: 0.28, map: dotTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.userData.base = base; pts.visible = false; scene.add(pts); return pts;
  })();
  function dotTex() {
    return canvasTex(64, 64, (ctx) => { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); });
  }
  const DOT = dotTex();

  // ---------- pick registry
  const pickables = []; // { mesh, data, anchor }
  function addPick(parent, data, size, anchorY = 1) {
    const [w, h, d] = size;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.hidden); m.position.y = h / 2; m.visible = false;
    m.userData.pick = data; parent.add(m);
    const rec = { mesh: m, data, parent, anchorY }; pickables.push(rec); return rec;
  }
  function removePicks(parent) { for (let i = pickables.length - 1; i >= 0; i--) if (pickables[i].parent === parent) { pickables[i].mesh.geometry.dispose(); pickables.splice(i, 1); } }

  // ---------- labels (HTML)
  const labels = {};
  function addLabel(key, x, y, z, onClick, cls = '') {
    const el = document.createElement('button'); el.type = 'button'; el.tabIndex = -1; el.className = 'tw-label ' + cls; el.dataset.label = key;
    el.addEventListener('click', (e) => { e.stopPropagation(); onClick && onClick(); });
    labelsEl.appendChild(el);
    labels[key] = { el, pos: new THREE.Vector3(x, y, z), obj: null };
    return labels[key];
  }
  const pickCb = { fn: null };
  const emit = (data) => { if (pickCb.fn) pickCb.fn(data); };
  for (const [k, p] of Object.entries(PLACES)) {
    const y = { plaza: 4.6, market: 4.4, workshop: 6.2, quests: 3.6, beacon: 9.4, trophies: 4.6 }[k];
    const z = k === 'market' ? -9.4 : k === 'workshop' ? 12.2 : p.z;
    addLabel(k, k === 'workshop' ? 5.2 : p.x, y, z, () => emit({ kind: k === 'plaza' ? 'leaderboard' : k === 'workshop' ? 'workshop' : k }), 'tw-label--place');
  }

  // ---------- market
  const market = (function () {
    const g = new THREE.Group(); world.add(g);
    const bodyParts = [
      part(box(2.4, 0.9, 1.0), C.wood, [0, 0.45, 0.15]), part(box(2.5, 0.08, 1.1), C.cream, [0, 0.94, 0.15]),
      ...[[-1.1, -0.35], [1.1, -0.35], [-1.1, 0.62], [1.1, 0.62]].map(([x, z]) => part(box(0.1, 2.3, 0.1), C.woodDark, [x, 1.15, z])),
      part(box(0.42, 0.3, 0.32), '#E7D3A7', [-0.6, 1.12, 0.2]), part(box(0.34, 0.24, 0.3), C.sage, [0.1, 1.1, 0.25]),
      part(new THREE.IcosahedronGeometry(0.17, 0), C.clay, [0.62, 1.12, 0.22]), part(new THREE.IcosahedronGeometry(0.15, 0), C.goldSoft, [0.82, 1.1, 0.0]),
      part(box(0.08, 1.5, 0.08), C.woodDark, [0, 2.95, -0.4]),
    ];
    const bodyGeo = merge(bodyParts);
    const stripes = [];
    for (let i = 0; i < 6; i++) stripes.push(part(box(2.6 / 6, 0.07, 1.5), i % 2 ? '#FFFFFF' : '#C9C4BA', [-1.3 + (i + 0.5) * (2.6 / 6), 0, 0]));
    const canopyGeo = merge(stripes); canopyGeo.rotateX(0.28); canopyGeo.translate(0, 2.35, 0.2);
    const valance = []; for (let i = 0; i < 6; i++) valance.push(part(new THREE.ConeGeometry(0.22, 0.32, 3), i % 2 ? '#FFFFFF' : '#C9C4BA', [-1.3 + (i + 0.5) * (2.6 / 6), 2.06, 0.93], [Math.PI, 0, 0]));
    const valGeo = merge(valance);
    const canopyAll = merge([canopyGeo, valGeo]);
    const MAX = STALL_SLOTS.length;
    const bodies = new THREE.InstancedMesh(bodyGeo, vc, MAX), canopies = new THREE.InstancedMesh(canopyAll, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), MAX);
    bodies.castShadow = canopies.castShadow = true; bodies.receiveShadow = true; bodies.count = canopies.count = 0;
    g.add(bodies, canopies);
    for (let i = 0; i < MAX; i++) canopies.setColorAt(i, col(CANOPY[i % CANOPY.length]));
    const stalls = []; // per slot: { key, banner, holder, pick }
    const bannerGeo = new THREE.PlaneGeometry(3.0, 1.5);
    // "more" signpost / empty sign
    const sign = new THREE.Group(); sign.position.set(5.6, 0, -12.6); g.add(sign);
    sign.add(new THREE.Mesh(merge([part(box(0.12, 2.2, 0.12), C.woodDark, [0, 1.1, 0])]), vc));
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.05), new THREE.MeshLambertMaterial({ transparent: true })); signMesh.position.y = 2.0; signMesh.position.z = 0.08; sign.add(signMesh);
    addPick(sign, { kind: 'market' }, [2.4, 2.8, 1.2]);
    let signKey = '';
    function banner(t) {
      return canvasTex(512, 256, (ctx, w, h) => {
        ctx.fillStyle = '#FBFAF8'; rrect(ctx, 4, 4, w - 8, h - 8, 18); ctx.fill();
        ctx.lineWidth = 8; ctx.strokeStyle = '#C89B4E'; rrect(ctx, 8, 8, w - 16, h - 16, 16); ctx.stroke();
        ctx.fillStyle = '#16181C'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const name = fitText(ctx, t.appName || 'App', w - 60, 70, 800); ctx.fillText(name, w / 2, 86);
        ctx.font = `700 30px ${FONT}`; ctx.fillStyle = '#6D747D';
        ctx.fillText(t.slotsLeft + (t.slotsLeft === 1 ? ' slot left' : ' slots left'), w / 2 - 70, 186);
        ctx.fillStyle = '#C89B4E'; rrect(ctx, w / 2 + 40, 152, 150, 68, 12); ctx.fill();
        ctx.fillStyle = '#120C03'; ctx.font = `800 44px ${FONT}`; ctx.fillText('$' + (t.yourPriceCents / 100).toFixed(t.yourPriceCents % 100 ? 2 : 0), w / 2 + 115, 188);
      });
    }
    function signTex(text, sub) {
      return canvasTex(512, 256, (ctx, w, h) => {
        ctx.fillStyle = '#A47B53'; rrect(ctx, 4, 4, w - 8, h - 8, 14); ctx.fill();
        ctx.fillStyle = '#FBFAF8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(fitText(ctx, text, w - 50, 58, 800), w / 2, 100);
        ctx.font = `600 32px ${FONT}`; ctx.fillStyle = '#F5E6C8'; ctx.fillText(sub, w / 2, 180);
      });
    }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3();
    function update(list, animate) {
      const show = list.slice(0, MAX);
      // keep stall slot order stable: tests already shown keep their slot
      const prev = stalls.map((s) => s && s.id);
      const order = new Array(MAX).fill(null);
      show.forEach((t) => { const i = prev.indexOf(t.id); if (i >= 0 && i < MAX) order[i] = t; });
      show.forEach((t) => { if (order.includes(t)) return; const j = order.indexOf(null); if (j >= 0) order[j] = t; });
      // compact: instanced count must cover the highest used slot; empty slots get scaled to 0
      let n = 0; order.forEach((t, i) => { if (t) n = i + 1; });
      bodies.count = canopies.count = n;
      for (let i = 0; i < MAX; i++) {
        const t = order[i], s = stalls[i];
        const key = t ? [t.id, t.appName, t.yourPriceCents, t.slotsLeft].join('|') : '';
        const [x, z] = STALL_SLOTS[i];
        if (!t) {
          if (s) { g.remove(s.holder); s.banner.material.map.dispose(); s.banner.material.dispose(); removePicks(s.holder); stalls[i] = null; }
          if (i < n) { M.compose(V.set(x, 0, z), Q.identity(), new THREE.Vector3(0.0001, 0.0001, 0.0001)); bodies.setMatrixAt(i, M); canopies.setMatrixAt(i, M); }
          continue;
        }
        M.compose(V.set(x, 0, z), Q.identity(), new THREE.Vector3(1, 1, 1)); bodies.setMatrixAt(i, M); canopies.setMatrixAt(i, M);
        if (s && s.key === key) continue;
        if (s) { s.banner.material.map.dispose(); s.banner.material.map = banner(t); s.banner.material.needsUpdate = true; s.key = key; s.id = t.id; s.holder.userData.test = t; continue; }
        const holder = new THREE.Group(); holder.position.set(x, 0, z); g.add(holder);
        const bm = new THREE.Mesh(bannerGeo, new THREE.MeshLambertMaterial({ map: banner(t), transparent: true, side: THREE.DoubleSide }));
        bm.position.set(0, 3.95, -0.4); holder.add(bm);
        const rec = addPick(holder, { kind: 'stall', id: t.id }, [2.8, 4.4, 2.2], 3.6);
        stalls[i] = { key, id: t.id, holder, banner: bm, pick: rec };
        if (animate) grow(holder, 0.6, i * 0.05);
      }
      bodies.instanceMatrix.needsUpdate = canopies.instanceMatrix.needsUpdate = true;
      if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
      bodies.computeBoundingSphere(); canopies.computeBoundingSphere();
      const extra = list.length - show.length;
      const sk = list.length ? (extra > 0 ? 'more' + extra : '') : 'empty';
      if (sk !== signKey) {
        signKey = sk; sign.visible = !!sk;
        if (signMesh.material.map) signMesh.material.map.dispose();
        signMesh.material.map = sk === 'empty' ? signTex('Quiet market', 'No open tests right now') : sk ? signTex('+' + extra + ' more', 'open tests: tap to see all') : null;
        signMesh.material.needsUpdate = true;
        sign.position.set(sk === 'empty' ? -3 : 5.6, 0, sk === 'empty' ? -11 : -12.6);
      }
      shadowsDirty();
    }
    function faceCamera() { for (const s of stalls) if (s) { const dx = camera.position.x - s.holder.position.x, dz = camera.position.z - s.holder.position.z; s.banner.rotation.y = Math.atan2(dx, dz); } signMesh.rotation.y = Math.atan2(camera.position.x - sign.position.x, camera.position.z - sign.position.z); }
    function pos(id) { const s = stalls.find((x) => x && x.id === id); return s ? s.holder.position.clone() : null; }
    return { update, faceCamera, pos };
  })();

  // entrance flags
  (function flags() {
    const flagGeo = new THREE.PlaneGeometry(1.3, 0.75, 8, 1); flagGeo.translate(0.65, 0, 0);
    [[-13.6, -9.6, C.gold], [6.0, -9.6, C.clay], [-2.0, -5.3, C.gold], [2.0, -5.3, C.sage]].forEach(([x, z, c]) => {
      world.add(new THREE.Mesh(part(cyl(0.06, 0.08, 3.4, 6), C.woodDark, [x, 1.7, z]), vc));
      const f = new THREE.Mesh(part(flagGeo, c), flagMat); f.position.set(x + 0.05, 3.0, z); world.add(f);
    });
  })();

  // ---------- plaza: podium + leaderboard board
  const plaza = (function () {
    const P = PLACES.plaza, g = new THREE.Group(); g.position.set(P.x, 0.2, P.z - 0.4); world.add(g);
    const steps = [[0, 1.25, C.gold], [-1.55, 0.85, C.cream], [1.55, 0.55, C.cream]];
    const pod = merge(steps.flatMap(([x, h, c]) => [part(box(1.5, h, 1.5), C.stone, [x, h / 2, 0]), part(box(1.52, 0.12, 1.52), c, [x, h - 0.06, 0])]));
    const pm = new THREE.Mesh(pod, vc); pm.castShadow = pm.receiveShadow = true; g.add(pm);
    // board
    const board = new THREE.Group(); board.position.set(0, 0, -2.6); g.add(board);
    board.add(new THREE.Mesh(merge([part(box(0.18, 3.4, 0.18), C.woodDark, [-2.1, 1.7, 0]), part(box(0.18, 3.4, 0.18), C.woodDark, [2.1, 1.7, 0]), part(box(4.6, 2.3, 0.14), C.woodDark, [0, 2.45, -0.05]), part(gable(4.9, 0.5, 0.6), C.gold, [0, 3.6, 0])]), vc));
    const boardMat = new THREE.MeshLambertMaterial({ emissive: '#ffffff', emissiveIntensity: 0.05 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.05), boardMat); face.position.set(0, 2.45, 0.04); board.add(face);
    addPick(board, { kind: 'leaderboard' }, [4.8, 4, 1]);
    addPick(g, { kind: 'leaderboard' }, [4.8, 2, 2]);
    let key = null, avs = [];
    function update(rows, me) {
      const k = JSON.stringify(rows.map((r) => [r.nickname, r.avatar, r.xp]));
      if (k === key) return; key = k;
      avs.forEach((a) => g.remove(a)); avs = [];
      rows.slice(0, 3).forEach((r, i) => {
        const a = buildAvatar(r.avatar, mats, 0.85); a.position.set(steps[i][0], steps[i][1], 0.1); a.userData.ph = i * 1.3; g.add(a); avs.push(a);
      });
      if (boardMat.map) boardMat.map.dispose();
      boardMat.map = canvasTex(512, 248, (ctx, w, h) => {
        ctx.fillStyle = '#1D2026'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#C89B4E'; ctx.font = `800 30px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('THIS WEEK', 26, 34);
        ctx.fillStyle = '#6D747D'; ctx.font = `700 22px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText('XP', w - 26, 34);
        if (!rows.length) { ctx.textAlign = 'center'; ctx.fillStyle = '#A7ADB6'; ctx.font = `600 28px ${FONT}`; ctx.fillText('No one yet. Set a nickname', w / 2, 120); ctx.fillText('and be first on the board.', w / 2, 160); }
        rows.slice(0, 3).forEach((r, i) => {
          const y = 88 + i * 54;
          ctx.fillStyle = i === 0 ? '#E2BC7C' : '#EDEFF2'; ctx.textAlign = 'left'; ctx.font = `800 30px ${FONT}`;
          ctx.fillText(i + 1 + '', 26, y);
          ctx.fillStyle = avatarHex(r.avatar && r.avatar.color); ctx.fillRect(62, y - 12, 24, 24);
          ctx.fillStyle = '#EDEFF2'; ctx.font = `700 30px ${FONT}`; ctx.fillText(fitText(ctx, r.nickname, 300, 30, 700), 100, y);
          ctx.textAlign = 'right'; ctx.fillStyle = '#A7ADB6'; ctx.font = `700 28px ${FONT}`; ctx.fillText(String(r.xp), w - 26, y);
        });
        if (me && me.place) { ctx.textAlign = 'left'; ctx.fillStyle = '#C89B4E'; ctx.font = `700 22px ${FONT}`; ctx.fillText('You: #' + me.place, 26, h - 18); }
      });
      boardMat.needsUpdate = true;
      shadowsDirty();
    }
    return { update, avatars: () => avs };
  })();

  // ---------- quest board
  const questBoard = (function () {
    const P = PLACES.quests, g = new THREE.Group(); g.position.set(P.x, 0, P.z); g.rotation.y = 0.5; world.add(g);
    const frame = new THREE.Mesh(merge([part(box(0.16, 2.6, 0.16), C.woodDark, [-1.2, 1.3, 0]), part(box(0.16, 2.6, 0.16), C.woodDark, [1.2, 1.3, 0]),
      part(box(2.6, 1.7, 0.12), '#C9A97C', [0, 1.75, 0]), part(gable(2.9, 0.42, 0.5), C.roofRed, [0, 2.6, 0])]), vc);
    frame.castShadow = true; g.add(frame);
    const noteGeo = new THREE.PlaneGeometry(0.66, 0.62);
    const notes = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(noteGeo, new THREE.MeshLambertMaterial({ color: C.paper })); m.position.set(-0.8 + (i % 3) * 0.8, 2.15 - Math.floor(i / 3) * 0.75, 0.075); m.rotation.z = ((i * 37) % 7 - 3) * 0.03; g.add(m);
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 3), mats.ink); pin.position.set(0, 0.24, 0.02); m.add(pin);
      notes.push(m);
    }
    addPick(g, { kind: 'quests' }, [3, 3, 1.4]);
    function update(quests) {
      quests.slice(0, 6).forEach((q, i) => { const m = notes[i]; m.material.color.set(q.done ? '#E2BC7C' : q.period === 'daily' ? C.paper : '#EFE6D6'); m.children[0].material = q.done ? mats.goldMetal : mats.ink; });
    }
    return { update };
  })();

  // ---------- streak beacon (lighthouse)
  const beacon = (function () {
    const P = PLACES.beacon, g = new THREE.Group(); g.position.set(P.x, 0.95, P.z); world.add(g);
    const parts = [];
    const H = [[1.05, 0.9, 1.4, C.cream], [0.9, 0.78, 1.3, C.clay], [0.78, 0.66, 1.3, C.cream], [0.66, 0.58, 1.2, C.clay]];
    let y = 0; for (const [rb, rt, h, c] of H) { parts.push(part(cyl(rt, rb, h, 10), c, [0, y + h / 2, 0])); y += h; }
    parts.push(part(cyl(0.95, 0.95, 0.14, 12), C.ink, [0, y + 0.07, 0]));
    parts.push(part(cyl(0.12, 0.14, 0.6, 6), C.ink, [0, y + 0.45, 0]));
    parts.push(part(new THREE.TorusGeometry(0.62, 0.05, 4, 14), C.gold, [0, y + 0.8, 0], [Math.PI / 2, 0, 0]));
    parts.push(part(new THREE.ConeGeometry(0.85, 0.7, 10), C.ink, [0, y + 2.25, 0]));
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; parts.push(part(box(0.08, 1.35, 0.08), C.ink, [Math.cos(a) * 0.74, y + 1.25, Math.sin(a) * 0.74])); }
    parts.push(part(box(0.5, 0.75, 0.08), C.woodDark, [0, 0.38, 1.0]));
    const tower = new THREE.Mesh(merge(parts), vc); tower.castShadow = true; g.add(tower);
    const flame = new THREE.Group(); flame.position.y = y + 0.85; g.add(flame);
    const fo = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 7), new THREE.MeshBasicMaterial({ color: '#F2A23A' })); fo.position.y = 0.45; flame.add(fo);
    const fi = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.75, 6), new THREE.MeshBasicMaterial({ color: '#FFE08A' })); fi.position.y = 0.33; flame.add(fi);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: '#FFC46B', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(3.2); halo.position.y = 0.5; flame.add(halo);
    addPick(g, { kind: 'beacon' }, [2.6, y + 3, 2.6]);
    flameLight.position.set(P.x, y + 2, P.z);
    let target = 0.3, cur = 0.3, streak = 0;
    function update(n) { streak = n; target = n <= 0 ? 0.22 : 0.45 + Math.min(1, n / 30) * 1.15; }
    function tick(t, dt) {
      cur += (target - cur) * Math.min(1, dt * 2.5);
      const f = reduced ? 1 : 1 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.06;
      flame.scale.set(cur * (2 - f), cur * f, cur * (2 - f)); flame.rotation.y = t * 0.6;
      halo.material.opacity = (streak > 0 ? 0.5 : 0.18) * (isDusk ? 1.2 : 0.7);
      flameLight.intensity = (isDusk ? 14 : 2) * cur;
    }
    return { update, tick, top: () => new THREE.Vector3(P.x, y + 2.2, P.z), get cur() { return cur; } };
  })();

  // ---------- trophy hall
  const hall = (function () {
    const P = PLACES.trophies, g = new THREE.Group(); g.position.set(P.x, 0, P.z); g.rotation.y = -0.45; world.add(g);
    const parts = [part(box(7.4, 0.35, 4.2), C.stone2, [0, 0.17, 0]), part(box(7.0, 0.12, 3.8), C.stone, [0, 0.4, 0]), part(box(7.6, 0.3, 4.4), C.cream, [0, 3.3, 0]), part(gable(7.8, 0.9, 4.6), C.gold, [0, 3.45, 0])];
    for (let i = 0; i < 5; i++) for (const z of [-1.8, 1.8]) parts.push(part(cyl(0.16, 0.2, 2.8, 8), C.cream, [-3.3 + i * 1.65, 1.85, z]));
    parts.push(part(box(7.0, 2.6, 0.12), '#E9E1D2', [0, 1.75, -1.95]));
    const m = new THREE.Mesh(merge(parts), vc); m.castShadow = true; m.receiveShadow = true; g.add(m);
    const pedG = cyl(0.26, 0.3, 0.55, 6); pedG.translate(0, 0.275, 0);
    const shapes = [new THREE.OctahedronGeometry(0.22, 0), new THREE.ExtrudeGeometry(starShape(0.24, 0.11), { depth: 0.08, bevelEnabled: false }), new THREE.IcosahedronGeometry(0.2, 0), merge([part(cyl(0.2, 0.08, 0.28, 8), '#fff', [0, 0.1, 0]), part(cyl(0.12, 0.12, 0.05, 8), '#fff', [0, -0.08, 0])])];
    shapes[1].translate(0, 0, -0.04);
    const peds = new THREE.InstancedMesh(pedG, new THREE.MeshLambertMaterial({ color: C.stone, flatShading: true }), 12); peds.castShadow = true; g.add(peds);
    const trophies = [];
    const M = new THREE.Matrix4();
    for (let i = 0; i < 12; i++) {
      const x = -2.9 + (i % 6) * 1.16, z = i < 6 ? -0.75 : 0.75, py = i < 6 ? 0.6 : 0.46;
      M.makeTranslation(x, py - 0.12, z); peds.setMatrixAt(i, M);
      const t = new THREE.Mesh(shapes[i % 4], mats.locked); t.position.set(x, py + 0.65, z); g.add(t); trophies.push(t);
    }
    addPick(g, { kind: 'trophies' }, [7.6, 3.6, 4.4]);
    let earned = null;
    function update(badges, animate) {
      const now = badges.map((b) => !!b.earnedAt);
      badges.slice(0, 12).forEach((b, i) => {
        trophies[i].material = b.earnedAt ? mats.goldMetal : mats.locked;
        if (animate && earned && !earned[i] && now[i]) { const p = new THREE.Vector3(); trophies[i].getWorldPosition(p); burst(p, { n: 50, colors: ['#FFE08A', '#C89B4E'] }); }
      });
      earned = now;
    }
    function tick(t) { trophies.forEach((m, i) => { m.rotation.y = t * 0.8 + i; m.position.y += Math.sin(t * 2 + i) * 0.0015; }); }
    return { update, tick };
  })();

  // ---------- workshop: house by rank + test towers
  const workshop = (function () {
    const g = new THREE.Group(); world.add(g);
    const houseG = new THREE.Group(); houseG.position.set(HOUSE[0], 0, HOUSE[1]); houseG.rotation.y = -0.35; g.add(houseG);
    addPick(houseG, { kind: 'workshop' }, [5.5, 5, 4.6]);
    let rankIdx = -1;
    function houseParts(r) {
      const p = [], w = [];
      const win = (x, y, z, ry = 0, s = 1) => w.push(part(box(0.42 * s, 0.5 * s, 0.06), '#FFE1A0', [x, y, z], [0, ry, 0]));
      if (r === 0) { // a tidy shed and a crate
        p.push(part(box(2.0, 1.3, 1.7), '#D8C6A6', [0, 0.65, 0]), part(gable(2.3, 0.9, 2.0), C.wood, [0, 1.3, 0]), part(box(0.55, 0.9, 0.06), C.woodDark, [0, 0.45, 0.86]));
        p.push(part(box(0.6, 0.5, 0.6), C.wood, [1.6, 0.25, 0.6], [0, 0.4, 0]));
        win(-0.6, 0.85, 0.86, 0, 0.8);
        return [p, w];
      }
      const H1 = 1.7, wallC = r >= 5 ? C.paper : C.cream, roofC = r >= 6 ? C.gold : r >= 3 ? C.slate : C.roofRed;
      p.push(part(box(3.0, H1, 2.4), wallC, [0, H1 / 2, 0]), part(box(3.1, 0.18, 2.5), C.stone2, [0, 0.09, 0]));
      p.push(part(box(0.62, 1.1, 0.07), C.woodDark, [0, 0.55, 1.22]));
      win(-0.9, 1.05, 1.22); win(0.9, 1.05, 1.22);
      let top = H1;
      if (r >= 3) { p.push(part(box(2.6, 1.4, 2.1), wallC, [0, H1 + 0.7, 0]), part(box(3.2, 0.12, 2.6), C.woodDark, [0, H1 + 0.02, 0])); win(-0.7, H1 + 0.75, 1.07); win(0.7, H1 + 0.75, 1.07); top += 1.4; }
      p.push(part(gable(r >= 3 ? 2.9 : 3.3, 1.2, r >= 3 ? 2.5 : 2.8), roofC, [0, top, 0]));
      if (r >= 2) { p.push(part(box(0.4, 1.3, 0.4), C.stone2, [0.9, top + 0.5, -0.4])); p.push(part(box(1.4, 0.7, 0.6), C.wood, [-2.3, 0.35, 1.0])); p.push(part(box(0.2, 0.25, 0.2), C.slate, [-2.5, 0.82, 1.0])); p.push(part(cyl(0.12, 0.12, 0.3, 6), C.clay, [-2.05, 0.85, 1.0])); }
      if (r >= 4) { // side tower
        p.push(part(cyl(0.8, 0.85, top + 1.0, 8), wallC, [2.1, (top + 1.0) / 2, -0.3]), part(new THREE.ConeGeometry(1.05, 1.5, 8), roofC, [2.1, top + 1.75, -0.3]));
        win(2.1, top - 0.2, 0.52); p.push(part(box(1.4, 0.1, 0.6), C.woodDark, [0, H1 + 0.06, 1.35]));
      }
      if (r >= 5) { // wing + garden arch
        p.push(part(box(2.0, 1.5, 2.0), wallC, [-2.6, 0.75, -0.3]), part(gable(2.2, 0.9, 2.2), roofC, [-2.6, 1.5, -0.3])); win(-2.6, 0.95, 0.72);
        for (const x of [-0.8, 0.8]) p.push(part(box(0.14, 1.6, 0.14), C.woodDark, [x, 0.8, 2.4]));
        p.push(part(new THREE.TorusGeometry(0.8, 0.08, 4, 10, Math.PI), LEAF[0], [0, 1.6, 2.4]));
      }
      if (r >= 6) { p.push(part(new THREE.SphereGeometry(0.55, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), C.gold, [2.1, top + 2.45, -0.3]), part(cyl(0.04, 0.04, 1.2, 4), C.ink, [2.1, top + 3.3, -0.3])); }
      // fence for Scout+
      for (let i = 0; i < 7; i++) p.push(part(box(0.1, 0.55, 0.1), C.wood, [-1.8 + i * 0.6, 0.28, 2.0]));
      p.push(part(box(3.8, 0.08, 0.06), C.wood, [-0.0, 0.42, 2.0]));
      return [p, w];
    }
    let houseMeshes = [], houseFlag = null;
    function setRank(r, animate) {
      if (r === rankIdx) return; rankIdx = r;
      houseMeshes.forEach((m) => { houseG.remove(m); m.geometry.dispose(); }); houseMeshes = [];
      const [p, w] = houseParts(r);
      const body = new THREE.Mesh(merge(p), vc); body.castShadow = body.receiveShadow = true; houseG.add(body); houseMeshes.push(body);
      if (w.length) { const wm = new THREE.Mesh(merge(w), mats.glow); houseG.add(wm); houseMeshes.push(wm); }
      if (houseFlag) houseG.remove(houseFlag);
      houseFlag = new THREE.Group();
      const fh = r >= 4 ? (r >= 6 ? 7.6 : 6.0) : r >= 3 ? 5.1 : 3.4;
      houseFlag.add(new THREE.Mesh(part(cyl(0.04, 0.05, 1.4, 5), C.ink, [0, 0.7, 0]), vc));
      const f = new THREE.Mesh(part(new THREE.PlaneGeometry(0.9, 0.5, 6, 1).translate(0.45, 0, 0), r >= 6 ? C.gold : C.goldSoft), flagMat); f.position.y = 1.15; houseFlag.add(f);
      houseFlag.position.set(r >= 4 ? 2.1 : -0.9, fh, r >= 4 ? -0.3 : 0); houseG.add(houseFlag);
      if (animate) grow(houseG, 0.9, 0, true);
      shadowsDirty();
    }
    // towers
    const floorG = merge([part(box(1.3, 1.0, 1.3), C.cream, [0, 0.5, 0]), part(box(1.38, 0.1, 1.38), C.gold, [0, 0.02, 0])]);
    const winG = merge([part(box(0.32, 0.4, 0.04), '#FFE1A0', [-0.3, 0.55, 0.66]), part(box(0.32, 0.4, 0.04), '#FFE1A0', [0.3, 0.55, 0.66]), part(box(0.04, 0.4, 0.32), '#FFE1A0', [0.66, 0.55, 0])]);
    const baseG = part(box(1.8, 0.24, 1.8), C.stone2, [0, 0.12, 0]);
    const roofG = merge([part(new THREE.ConeGeometry(1.15, 1.2, 4), C.gold, [0, 0.6, 0], [0, Math.PI / 4, 0])]);
    const scafParts = [];
    for (const [x, z] of [[-0.82, -0.82], [0.82, -0.82], [-0.82, 0.82], [0.82, 0.82]]) scafParts.push(part(box(0.07, 3.6, 0.07), C.wood, [x, 1.8, z]));
    for (let l = 1; l <= 3; l++) for (const [x, z, ry] of [[0, 0.82, 0], [0, -0.82, 0], [0.82, 0, Math.PI / 2], [-0.82, 0, Math.PI / 2]]) scafParts.push(part(box(1.7, 0.06, 0.06), C.wood, [x, l * 1.08 + 0.2, z], [0, ry, 0]));
    scafParts.push(part(box(1.7, 0.06, 0.06), C.woodDark, [0, 1.6, 0.84], [0, 0, 0.9]));
    const scafG = merge(scafParts);
    const crateG = merge([part(box(0.5, 0.45, 0.5), C.wood, [1.15, 0.22, 0.75]), part(box(0.38, 0.34, 0.38), C.woodDark, [1.2, 0.62, 0.72], [0, 0.4, 0])]);
    const pennantG = merge([part(cyl(0.03, 0.03, 1.0, 4), C.ink, [0, 0.5, 0])]);
    const pennFlagG = new THREE.PlaneGeometry(0.7, 0.36, 5, 1).translate(0.35, 0, 0);
    const towers = new Map();
    const icons = {};
    function icon(kind) {
      if (icons[kind]) return icons[kind];
      const tex = canvasTex(128, 128, (ctx) => {
        const c = { ok: '#3E9C68', warn: '#E0A43A', pen: '#C89B4E', wait: '#8C939C' }[kind];
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(66, 68, 52, 0, 7); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(64, 64, 52, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (kind === 'ok') { ctx.beginPath(); ctx.moveTo(40, 66); ctx.lineTo(57, 82); ctx.lineTo(88, 48); ctx.stroke(); }
        if (kind === 'warn') { ctx.beginPath(); ctx.moveTo(64, 36); ctx.lineTo(64, 72); ctx.stroke(); ctx.beginPath(); ctx.arc(64, 92, 7, 0, 7); ctx.fill(); }
        if (kind === 'pen') { ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(44, 84); ctx.lineTo(80, 48); ctx.stroke(); ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(48, 88); ctx.stroke(); }
        if (kind === 'wait') { ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(64, 64, 26, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(64, 50); ctx.lineTo(64, 66); ctx.lineTo(76, 72); ctx.stroke(); }
      });
      return (icons[kind] = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    }
    const RUN = ['accepted', 'invited', 'active', 'exit_pending'];
    const DONE = ['completed', 'completed_pending', 'excused'];
    function update(list, installed, animate) {
      const running = list.filter((a) => RUN.includes(a.status)).slice(0, 3);
      const done = list.filter((a) => DONE.includes(a.status)).slice(0, TOWER_DONE.length);
      const want = new Map();
      running.forEach((a, i) => want.set(a.id, { a, slot: TOWER_RUN[i] }));
      done.forEach((a, i) => want.set(a.id, { a, slot: TOWER_DONE[i] }));
      for (const [id, t] of towers) if (!want.has(id)) { g.remove(t.g); removePicks(t.g); towers.delete(id); }
      for (const [id, { a, slot }] of want) {
        let t = towers.get(id);
        const finished = DONE.includes(a.status);
        const floors = finished ? 3 : a.status === 'active' || a.status === 'exit_pending' ? Math.min(3, a.filedDays.length) : 0;
        const inst = installed ? installed[a.campaign.package] : undefined;
        const ico = a.status === 'active' && a.openCheckin ? 'pen' : (a.status === 'active' || a.status === 'invited') && inst !== undefined ? (inst > 0 ? 'ok' : a.status === 'active' ? 'warn' : null) : a.status === 'accepted' || a.status === 'completed_pending' || a.status === 'exit_pending' ? 'wait' : null;
        const key = [a.status, floors, ico].join('|');
        if (!t) {
          t = { g: new THREE.Group(), floors: [], key: '', a }; t.g.position.set(slot[0], 0, slot[1]); g.add(t.g); towers.set(id, t);
          t.g.add(new THREE.Mesh(baseG, vc));
          t.scaf = new THREE.Mesh(scafG, vc); t.g.add(t.scaf);
          t.crate = new THREE.Mesh(crateG, vc); t.g.add(t.crate);
          t.roof = new THREE.Mesh(roofG, vc); t.g.add(t.roof);
          t.pole = new THREE.Mesh(pennantG, vc); t.g.add(t.pole);
          t.flag = new THREE.Mesh(part(pennFlagG, C.gold), flagMat); t.g.add(t.flag);
          t.icon = new THREE.Sprite(icon('ok')); t.icon.scale.setScalar(0.9); t.icon.renderOrder = 10; t.g.add(t.icon);
          addPick(t.g, { kind: 'tower', id }, [2.2, 4.6, 2.2], 3.4);
          t.g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
          if (animate) grow(t.g, 0.6, 0);
        }
        t.a = a; t.g.position.set(slot[0], 0, slot[1]);
        if (t.key === key) continue;
        const prevFloors = t.floors.length;
        while (t.floors.length < floors) {
          const f = new THREE.Group(); f.add(new THREE.Mesh(floorG, vc)); f.add(new THREE.Mesh(winG, mats.glow));
          f.position.y = 0.24 + t.floors.length * 1.08; f.children[0].castShadow = true; t.g.add(f); t.floors.push(f);
          if (animate && t.key) { grow(f, 0.7, (t.floors.length - prevFloors - 1) * 0.25); const p = t.g.position.clone(); p.y = f.position.y + 1; burst(p, { n: 40 }); }
        }
        while (t.floors.length > floors) t.g.remove(t.floors.pop());
        const H = 0.24 + floors * 1.08;
        t.scaf.visible = !finished; t.crate.visible = !finished && floors < 3;
        t.roof.visible = finished || floors >= 3; t.roof.position.y = H;
        t.pole.visible = t.flag.visible = finished;
        t.pole.position.y = H + 1.05; t.flag.position.y = H + 1.85;
        t.flag.material = flagMat; t.flag.geometry.dispose(); t.flag.geometry = part(pennFlagG, a.status === 'completed' ? C.gold : a.status === 'excused' ? '#B8B2A6' : C.paper);
        if (ico) { t.icon.material = icon(ico); t.icon.visible = true; } else t.icon.visible = false;
        t.icon.position.y = Math.max(H, 3.7) + (finished ? 2.2 : 0.8);
        t.key = key;
      }
      shadowsDirty();
    }
    function tick(t) { for (const tw of towers.values()) if (tw.icon.visible) tw.icon.position.y += Math.sin(t * 3 + tw.g.position.x) * 0.004; }
    function pos(id) { const t = towers.get(id); return t ? t.g.position.clone().setY(2) : null; }
    return { setRank, update, tick, pos, housePos: () => new THREE.Vector3(HOUSE[0], 2.5, HOUSE[1]) };
  })();

  // ---------- my avatar
  const blob = canvasTex(64, 64, (ctx) => { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); });
  const me = { g: new THREE.Group(), av: null, target: null, speed: 4.2, trailT: 0, hist: [] };
  me.g.position.set(-1.6, 0, 7.6); scene.add(me.g);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; me.g.add(shadow);
  const mePick = addPick(me.g, { kind: 'avatar' }, [1.4, 2, 1.4], 2.2);
  const meLabel = addLabel('me', 0, 0, 0, () => emit({ kind: 'avatar' }), 'tw-label--me'); meLabel.obj = me.g; meLabel.offY = 2.2;
  const comet = (function () { // comet trail: fading orbs following the path
    const n = 12, arr = [];
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: '#FFD98A', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 * (1 - i / n) })); s.scale.setScalar(0.7 * (1 - i / n) + 0.15); s.visible = false; scene.add(s); arr.push(s); }
    return arr;
  })();
  function setAvatar(av) {
    av = av || {};
    const shape = ['cube', 'capsule', 'cone', 'star'].includes(av.shape) ? av.shape : 'cube';
    if (me.av && me.av.userData.key === JSON.stringify([av.color, shape, av.hat, av.trail])) return;
    const rotY = me.av ? me.av.rotation.y : 0;
    if (me.av) me.g.remove(me.av);
    me.av = buildAvatar(av, mats); me.av.rotation.y = rotY; me.g.add(me.av);
    comet.forEach((s) => (s.visible = me.av.userData.trail === 'comet'));
    me.hist = [];
    wake();
  }
  function walkTo(x, z) {
    const r = normR(x, z); if (r > 0.9) { x *= 0.9 / r; z *= 0.9 / r; }
    me.target = new THREE.Vector3(x, 0, z); wake(1500);
  }

  // ---------- particles (one pooled system)
  const parts = (function () {
    const N = 700, pos = new Float32Array(N * 3), colr = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), max = new Float32Array(N);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.34, vertexColors: true, map: DOT, transparent: true, depthWrite: false, blending: THREE.NormalBlending }));
    pts.frustumCulled = false; scene.add(pts);
    let head = 0, alive = 0;
    for (let i = 0; i < N; i++) pos[i * 3 + 1] = -999;
    function emitAt(p, o = {}) {
      const n = o.n || 60, colors = (o.colors || ['#C89B4E', '#FFE08A', '#F5EEE1', '#E2BC7C']).map(col), sp = o.speed || 5;
      for (let k = 0; k < n; k++) {
        const i = head; head = (head + 1) % N;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        const a = Math.random() * Math.PI * 2, u = Math.random(); const s = sp * (0.4 + Math.random() * 0.6);
        vel[i * 3] = Math.cos(a) * s * (o.ring ? 1 : u); vel[i * 3 + 1] = (o.ring ? 0.3 : 0.6 + Math.random()) * s * (o.up || 1); vel[i * 3 + 2] = Math.sin(a) * s * (o.ring ? 1 : u);
        const c = colors[k % colors.length]; colr[i * 3] = c.r; colr[i * 3 + 1] = c.g; colr[i * 3 + 2] = c.b;
        life[i] = max[i] = (o.life || 1.3) * (0.6 + Math.random() * 0.5);
      }
      alive = Math.max(alive, 3); wake(2500);
    }
    function tick(dt) {
      if (!alive) return false;
      let any = false;
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt; any = true;
        if (life[i] <= 0) { pos[i * 3 + 1] = -999; continue; }
        vel[i * 3 + 1] -= 7 * dt; vel[i * 3] *= 0.985; vel[i * 3 + 2] *= 0.985;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
      if (!any) alive = 0;
      return any;
    }
    return { emit: emitAt, tick, get alive() { return alive; } };
  })();
  function burst(p, o) { parts.emit(p, o); }
  // sparks trail
  let sparkT = 0;

  // ---------- grow animations
  const anims = [];
  function grow(obj, dur, delay = 0, squash = false) {
    obj.scale.setScalar(0.001);
    anims.push({ obj, t: -delay, dur, squash }); wake(2000);
  }

  // ---------- camera & controls
  const controls = new MapControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.screenSpacePanning = false;
  controls.minPolarAngle = 0.42; controls.maxPolarAngle = 1.2;
  controls.minDistance = 9; controls.maxDistance = 95;
  controls.zoomSpeed = 1.1; controls.rotateSpeed = 0.6;
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  const HOME = { az: 0.32, polar: 0.96, target: new THREE.Vector3(0, 0, 2.5) };
  function homeView() { // portrait phones: look more from the south and from higher, so the long island fits
    return camera.aspect < 0.8 ? { az: 0.16, polar: 0.82, target: new THREE.Vector3(1.2, 0, 2.2) } : HOME;
  }
  function homeDistance() {
    const a = camera.aspect, v = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(v) * a);
    const W = a < 0.8 ? 31 : 40, H = 30;
    return THREE.MathUtils.clamp(Math.max(W / 2 / Math.tan(hf), H / 2 / Math.tan(v)), 20, 90);
  }
  function placeCamera(target, dist, az, polar) {
    const off = new THREE.Vector3().setFromSphericalCoords(dist, polar, az);
    camera.position.copy(target).add(off); controls.target.copy(target); camera.lookAt(target);
  }
  let fly = null;
  function flyTo(target, dist, az) {
    const cur = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    let toAz = az == null ? cur.theta : az; while (toAz - cur.theta > Math.PI) toAz -= Math.PI * 2; while (toAz - cur.theta < -Math.PI) toAz += Math.PI * 2;
    fly = { t: 0, dur: reduced ? 0.01 : 0.85, from: { target: controls.target.clone(), dist: cur.radius, az: cur.theta, polar: cur.phi }, to: { target: target.clone(), dist: dist || cur.radius, az: toAz, polar: THREE.MathUtils.clamp(cur.phi, 0.75, 1.05) } };
    if (az != null && Math.abs(dist - homeDistance()) < 0.01) fly.to.polar = homeView().polar;
    wake(1200);
  }
  function rotate(dir) {
    const cur = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    flyTo(controls.target, cur.radius, cur.theta + dir * Math.PI / 4);
  }
  function home() { const hv = homeView(); flyTo(hv.target, homeDistance(), hv.az); }
  // gold ring under whatever the open panel is about
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.85, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#E2BC7C', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.position.y = 0.12; ring.visible = false; ring.renderOrder = 2; scene.add(ring);
  const RING_R = { stall: 1.0, tower: 0.9, workshop: 2.2, quests: 1.3, beacon: 1.6, trophies: 2.6, plaza: 2.6, market: 0 };
  function select(kind, id) {
    const r = RING_R[kind]; const p = r ? (kind === 'workshop' ? new THREE.Vector3(HOUSE[0], 0, HOUSE[1]) : worldPos(kind, id)) : null;
    if (!p) { ring.visible = false; wake(); return; }
    ring.position.set(p.x, 0.12, p.z); ring.scale.setScalar(r); ring.visible = true; ring.userData.until = performance.now() + 3500; wake();
  }
  function focusOn(kind, id) {
    select(kind, id);
    let p = null, d = 24;
    if (kind === 'stall') { p = market.pos(id); d = 22; }
    else if (kind === 'tower') { p = workshop.pos(id); d = 22; }
    else if (PLACES[kind]) { p = new THREE.Vector3(PLACES[kind].x, 0, PLACES[kind].z); d = kind === 'market' ? 30 : kind === 'workshop' ? 26 : 22; }
    else if (kind === 'leaderboard') { p = new THREE.Vector3(0, 0, 0); }
    if (!p) return;
    p.y = 0;
    if (camera.aspect < 1) d *= THREE.MathUtils.clamp(0.6 / camera.aspect, 1, 1.5); // keep a similar width in view on tall screens
    flyTo(p, d); // panels shift the view centre with setInset(), so the object stays in the uncovered part
  }
  const _d = new THREE.Vector3();
  controls.addEventListener('change', () => {
    const t = controls.target; t.y = 0;
    const r = normR(t.x, t.z);
    if (r > 0.82) { _d.set(t.x, 0, t.z).multiplyScalar(0.82 / r).sub(t); t.add(_d); camera.position.add(_d); }
    wake();
  });
  controls.addEventListener('start', () => { fly = null; wake(); });

  // two-finger twist rotates (pinch zoom and two-finger pan come from the controls)
  const touches = new Map(); let twistA = null;
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') touches.set(e.pointerId, [e.clientX, e.clientY]); });
  canvas.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size !== 2) { twistA = null; return; }
    const [[x1, y1], [x2, y2]] = [...touches.values()]; const a = Math.atan2(y2 - y1, x2 - x1);
    if (twistA != null) {
      let d = a - twistA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) < 0.3) { const off = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), -d); camera.position.copy(controls.target).add(off); controls.update(); }
    }
    twistA = a;
  });
  const endTouch = (e) => { touches.delete(e.pointerId); if (touches.size < 2) twistA = null; };
  canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);

  // ---------- tap vs drag, picking
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null, multi = false;
  canvas.addEventListener('pointerdown', (e) => {
    if (!down || e.isPrimary) { down = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType }; multi = false; } else multi = true;
    if (touches.size > 1) multi = true;
    wake();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || !e.isPrimary) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    const tap = !multi && moved < (down.type === 'touch' ? 12 : 6) && dt < 650;
    down = null;
    if (tap && (e.button === 0 || e.pointerType !== 'mouse')) handleTap(e.clientX, e.clientY, e.pointerType);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || down) return;
    const hit = pickObj(e.clientX, e.clientY, false);
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  function pickObj(cx, cy, finger) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables.map((p) => p.mesh), false);
    if (hits.length) return hits[0].object.userData.pick;
    if (!finger) return null;
    // fingers: nearest anchor on screen within 40px
    let best = null, bd = 40;
    const v = new THREE.Vector3();
    for (const p of pickables) {
      p.mesh.getWorldPosition(v); v.y = p.parent.getWorldPosition(new THREE.Vector3()).y + p.anchorY; v.project(camera);
      if (v.z > 1) continue;
      const sx = (v.x + 1) / 2 * rect.width + rect.left, sy = (1 - v.y) / 2 * rect.height + rect.top;
      const d = Math.hypot(sx - cx, sy - cy); if (d < bd) { bd = d; best = p.data; }
    }
    return best;
  }
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function handleTap(cx, cy, type) {
    const hit = pickObj(cx, cy, type !== 'mouse');
    if (hit) { emit(hit); return; }
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(ground, p) && normR(p.x, p.z) < 1) { walkTo(p.x, p.z); emit({ kind: 'ground' }); }
    else emit({ kind: 'sky' });
  }

  // ---------- theme
  let isDusk = false;
  function setTheme(dark) {
    isDusk = !!dark;
    if (isDusk) {
      skyU.top.value.set('#07080B'); skyU.mid.value.set('#3B2D2A'); skyU.bot.value.set('#0C0D12');
      scene.fog.color.set('#1E1A1B'); scene.fog.near = 60; scene.fog.far = 170;
      hemi.color.set('#7482AA'); hemi.groundColor.set('#33261B'); hemi.intensity = 1.2;
      sun.color.set('#F2AA66'); sun.intensity = 1.5; sun.position.set(-22, 14, 14);
      mats.glow.emissiveIntensity = 1.6; fireflies.visible = true;
      clouds.forEach((c) => { c.material.color.set('#8E93A8'); c.material.emissiveIntensity = 0.02; });
    } else {
      skyU.top.value.set('#C6D7DD'); skyU.mid.value.set('#FBF6EC'); skyU.bot.value.set('#EADBC0');
      scene.fog.color.set('#F2E9DA'); scene.fog.near = 70; scene.fog.far = 190;
      hemi.color.set('#FFF8EC'); hemi.groundColor.set('#B7A07F'); hemi.intensity = 1.7;
      sun.color.set('#FFF1DA'); sun.intensity = 2.3; sun.position.set(14, 30, 18);
      mats.glow.emissiveIntensity = 0.12; fireflies.visible = false;
      clouds.forEach((c) => { c.material.color.set('#FFFFFF'); c.material.emissiveIntensity = 0.18; });
    }
    shadowsDirty(); wake();
  }

  // ---------- data in
  let first = true;
  function update(d, extra = {}) {
    const animate = !first;
    const state = d.me || {};
    const r = Math.max(0, RANKS.indexOf(state.rank && state.rank.name));
    workshop.setRank(r, animate);
    market.update(d.market || [], animate);
    workshop.update(d.myTests || [], extra.installed || null, animate);
    plaza.update(d.podium || [], extra.boardMe || null);
    questBoard.update(state.quests || []);
    beacon.update((state.streak && state.streak.current) || 0);
    hall.update(state.badges || [], animate);
    if (state.profile) setAvatar(state.profile.avatar);
    first = false; wake(800);
  }
  function setLabel(key, html, hidden) { const l = labels[key]; if (!l) return; l.el.innerHTML = html; l.el.hidden = !!hidden; }
  function worldPos(kind, id) {
    if (kind === 'stall') return market.pos(id);
    if (kind === 'tower') return workshop.pos(id);
    if (kind === 'house' || kind === 'workshop') return workshop.housePos();
    if (kind === 'beacon') return beacon.top();
    if (kind === 'avatar') return me.g.position.clone().setY(1.2);
    if (PLACES[kind]) return new THREE.Vector3(PLACES[kind].x, 2, PLACES[kind].z);
    return new THREE.Vector3(0, 2, 0);
  }
  function celebrate(o = {}) {
    const p = o.at ? worldPos(o.at, o.id) || me.g.position.clone().setY(1.3) : me.g.position.clone().setY(1.3);
    if (o.big) {
      burst(p, { n: 160, speed: 8, life: 1.8 });
      burst(workshop.housePos(), { n: 140, speed: 7, life: 2 });
      burst(me.g.position.clone().setY(0.4), { n: 90, speed: 6, ring: true, life: 1.2, colors: ['#FFE08A', '#C89B4E'] });
    } else burst(p, { n: o.n || 70 });
  }

  // ---------- inset: while a panel covers part of the screen, move the projection centre into the free area
  const inset = { x: 0, y: 0, tx: 0, ty: 0 };
  function setInset(tx, ty) { inset.tx = tx; inset.ty = ty; wake(900); }
  function applyInset(dt) {
    if (inset.x === inset.tx && inset.y === inset.ty) return;
    const k = reduced ? 1 : Math.min(1, dt * 8);
    inset.x += (inset.tx - inset.x) * k; inset.y += (inset.ty - inset.y) * k;
    if (Math.abs(inset.x - inset.tx) < 0.5 && Math.abs(inset.y - inset.ty) < 0.5) { inset.x = inset.tx; inset.y = inset.ty; }
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    if (!inset.x && !inset.y) camera.clearViewOffset(); else camera.setViewOffset(w, h, inset.x, inset.y, w, h);
    wake(100);
  }

  // ---------- loop
  let raf = 0, lastRender = 0, wakeUntil = 0, lastInput = performance.now(), paused = false, prevT = 0;
  function wake(ms = 600) { lastInput = performance.now(); wakeUntil = Math.max(wakeUntil, lastInput + ms); if (!raf && !paused) raf = requestAnimationFrame(frame); }
  const tmpV = new THREE.Vector3();
  function frame(now) {
    raf = 0; if (paused) return;
    const idle = now - lastInput;
    const busy = now < wakeUntil || fly || anims.length || me.target || parts.alive;
    const interval = busy ? 0 : reduced ? Infinity : idle < 6000 ? 0 : idle < 45000 ? 1000 / 24 : Infinity;
    if (interval === Infinity && !busy) { renderOnce(now); return; } // fully idle: stop until something wakes us
    raf = requestAnimationFrame(frame);
    if (now - lastRender < interval - 2) return;
    renderOnce(now);
  }
  function renderOnce(now) {
    const dt = Math.min(0.05, prevT ? (now - prevT) / 1000 : 0.016); prevT = now; lastRender = now;
    const t = clock.getElapsedTime(); uTime.value = t;
    // camera fly
    if (fly) {
      fly.t += dt / fly.dur; const k = ease(Math.min(1, fly.t));
      const tg = fly.from.target.clone().lerp(fly.to.target, k);
      const dist = THREE.MathUtils.lerp(fly.from.dist, fly.to.dist, k), az = THREE.MathUtils.lerp(fly.from.az, fly.to.az, k), pol = THREE.MathUtils.lerp(fly.from.polar, fly.to.polar, k);
      placeCamera(tg, dist, az, pol);
      if (fly.t >= 1) fly = null;
    }
    applyInset(dt);
    if (controls.update()) wake(120);
    // ambient
    if (!reduced) {
      clouds.forEach((c) => { c.userData.ang += c.userData.speed * dt; c.position.set(Math.cos(c.userData.ang) * c.userData.rad, c.userData.y + Math.sin(t * 0.3 + c.userData.rad) * 0.4, Math.sin(c.userData.ang) * c.userData.rad * 0.9); c.rotation.y = -c.userData.ang; const dc = c.position.distanceTo(camera.position); c.material.opacity = THREE.MathUtils.clamp((dc - 14) / 16, 0, 1) * (c.userData.y < 0 ? (isDusk ? 0.4 : 0.78) : 1); c.visible = c.material.opacity > 0.02; });
      islets.forEach((m) => { m.position.y = m.userData.y0 + Math.sin(t * 0.6 + m.userData.ph) * 0.5; m.rotation.y = t * 0.05 + m.userData.ph; });
      for (const m of water) {
        const p = m.geometry.getAttribute('position'), b = m.userData.base;
        for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; p.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(t * 2.2 + x * 3.1 + z * 2.3) * 0.035 + Math.cos(t * 1.7 + z * 4.1) * 0.02; }
        p.needsUpdate = true; m.geometry.computeVertexNormals();
      }
      if (water.fall) water.fall.offset.y = (t * 0.9) % 1;
      if (fireflies.visible) { const p = fireflies.geometry.getAttribute('position'); fireflies.userData.base.forEach(([x, y, z, ph], i) => p.setXYZ(i, x + Math.sin(t * 0.5 + ph) * 0.8, y + Math.sin(t * 0.9 + ph * 2) * 0.4, z + Math.cos(t * 0.4 + ph) * 0.8)); p.needsUpdate = true; }
      plaza.avatars().forEach((a) => { a.userData.body.position.y = Math.abs(Math.sin(t * 2 + a.userData.ph)) * 0.12; a.rotation.y = Math.sin(t * 0.5 + a.userData.ph) * 0.4; });
      hall.tick(t); workshop.tick(t);
    }
    beacon.tick(t, dt);
    if (ring.visible) { const live = !reduced && now < ring.userData.until; ring.material.opacity = live ? 0.6 + Math.sin(t * 4) * 0.3 : 0.85; if (live) wake(100); }
    market.faceCamera();
    // grow animations
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i]; a.t += dt; const k = Math.max(0, Math.min(1, a.t / a.dur));
      const s = Math.max(0.001, easeBack(k)); a.obj.scale.set(s, a.squash ? s * (1 + Math.sin(k * Math.PI) * 0.1) : s, s);
      if (k >= 1) { a.obj.scale.setScalar(1); anims.splice(i, 1); shadowsDirty(); }
    }
    // my avatar
    if (me.av) {
      const body = me.av.userData.body;
      if (me.target) {
        tmpV.subVectors(me.target, me.g.position); tmpV.y = 0; const dist = tmpV.length();
        if (dist < 0.08) me.target = null;
        else {
          const step = Math.min(dist, me.speed * dt); tmpV.normalize();
          me.g.position.addScaledVector(tmpV, step);
          const want = Math.atan2(tmpV.x, tmpV.z); let d = want - me.av.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; me.av.rotation.y += d * Math.min(1, dt * 10);
          body.position.y = Math.abs(Math.sin(t * 11)) * 0.22; body.rotation.x = 0.12;
        }
      } else { body.position.y = reduced ? 0 : (Math.sin(t * 2.4) + 1) * 0.05; body.rotation.x *= 0.9; }
      if (me.av.userData.halo) me.av.userData.halo.rotation.z = t;
      const trail = me.av.userData.trail;
      if (trail === 'sparks') { sparkT -= dt; if (sparkT <= 0 && !reduced) { sparkT = me.target ? 0.05 : 0.35; parts.emit(me.g.position.clone().setY(0.5 + Math.random() * 0.6), { n: me.target ? 3 : 1, speed: 1.4, life: 0.8, colors: ['#FFE08A', '#F2A23A'] }); } }
      if (trail === 'comet') {
        me.hist.unshift(me.g.position.clone().setY(0.75 + body.position.y)); if (me.hist.length > 40) me.hist.length = 40;
        comet.forEach((s, i) => { const h = me.hist[Math.min(me.hist.length - 1, i * 3)]; if (h) s.position.copy(h); });
      }
    }
    if (parts.alive) parts.tick(dt);
    // labels
    const rect = canvas.getBoundingClientRect();
    for (const l of Object.values(labels)) {
      if (l.el.hidden) continue;
      if (l.obj) tmpV.copy(l.obj.position).setY(l.obj.position.y + (l.offY || 0)); else tmpV.copy(l.pos);
      tmpV.project(camera);
      const off = tmpV.z > 1 || Math.abs(tmpV.x) > 1.15 || Math.abs(tmpV.y) > 1.15;
      l.el.style.visibility = off ? 'hidden' : 'visible';
      if (!off) l.el.style.transform = `translate(${((tmpV.x + 1) / 2) * rect.width}px,${((1 - tmpV.y) / 2) * rect.height}px) translate(-50%,-100%)`;
    }
    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = camera.aspect < 0.8 ? 48 : 40;
    if (inset.x || inset.y) camera.setViewOffset(w, h, inset.x, inset.y, w, h); else camera.updateProjectionMatrix();
    controls.maxDistance = homeDistance() * 1.35;
    wake();
  }
  window.addEventListener('resize', resize);
  resize();
  { const hv = homeView(); placeCamera(hv.target, homeDistance(), hv.az, hv.polar); }
  controls.update();
  shadowsDirty();
  wake(1000);

  // keyboard: Q/E rotate when the canvas area has focus (the page body)
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(e.target.tagName)) return;
    if (e.key === 'q' || e.key === 'Q') rotate(-1);
    if (e.key === 'e' || e.key === 'E') rotate(1);
  });

  return {
    update, setTheme, setLabel, setInset, focus: focusOn, select, rotate, home, celebrate, walkTo,
    previewAvatar: setAvatar,
    screenPos(kind, id) { // client coordinates of a thing in the scene (used by tests and the tutorial)
      const p = worldPos(kind, id); if (!p) return null;
      if (kind === 'stall' || kind === 'tower') p.y = 1.6;
      p.project(camera); const r = canvas.getBoundingClientRect();
      return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height, visible: p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1 };
    },
    onPick(fn) { pickCb.fn = fn; },
    walkNear(kind, id) { const p = worldPos(kind, id); if (!p) return; const v = new THREE.Vector3(p.x, 0, p.z); const dir = v.clone().sub(new THREE.Vector3(0, 0, 2)).normalize(); v.addScaledVector(dir, -2.4); walkTo(v.x, v.z); },
    setPaused(p) { paused = p; if (p) { if (raf) cancelAnimationFrame(raf); raf = 0; } else { prevT = 0; wake(500); } },
    wake, renderer, debug: { scene, camera, controls, pickables },
  };
}
