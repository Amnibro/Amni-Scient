import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLOR = { frame: 0x8d8478, motor: 0xc4554a, prop: 0xd5d0c6, esc: 0x3d6f8f, fc: 0x6f9a78, battery: 0xc89b4e, rx: 0x8f6aab, camera: 0x9aa0a8, vtx: 0xb86b4a, cable: 0x6d747d };
const MAT_PROPS = {
  frame: { metalness: 0.22, roughness: 0.46 },
  motor: { metalness: 0.48, roughness: 0.32 },
  prop: { metalness: 0.08, roughness: 0.28, transparent: true, opacity: 0.88 },
  esc: { metalness: 0.30, roughness: 0.42 },
  fc: { metalness: 0.30, roughness: 0.42 },
  battery: { metalness: 0.15, roughness: 0.52 },
  camera: { metalness: 0.35, roughness: 0.34 },
  vtx: { metalness: 0.42, roughness: 0.36 },
  rx: { metalness: 0.25, roughness: 0.45 }
};

export const klass = n => n.startsWith('phase') ? 'phase' : n.startsWith('pack') ? 'pack' : n.startsWith('cable') ? 'cable' : 'signal';
const wireColor = k => k === 'phase' ? 0xd95f52 : k === 'pack' ? 0xe0a94f : k === 'cable' ? 0x8fb3d9 : 0x4ea0d6;

export function createView(host, hooks) {
  const onPick = (hooks && hooks.onPick) || (() => {}), onHover = (hooks && hooks.onHover) || (() => {});
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x08090b);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 4000);
  camera.up.set(0, 1, 0);
  camera.position.set(190, 170, 280);
  camera.lookAt(0, 24, 0);

  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.HemisphereLight(0xeef4ff, 0x1c2028, 0.78));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.35);
  sun.position.set(95, 240, 150);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9eb4c8, 0.55);
  fill.position.set(-160, 65, -95);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xc89b4e, 0.32);
  rim.position.set(0, -120, -180);
  scene.add(rim);

  const grid = new THREE.GridHelper(480, 24, 0x2a3140, 0x161a22);
  grid.position.y = -1;
  scene.add(grid);

  // Subtle 220x220mm standard FDM build plate reference boundary on the floor
  const bedGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-110, -0.4, -110),
    new THREE.Vector3(110, -0.4, -110),
    new THREE.Vector3(110, -0.4, 110),
    new THREE.Vector3(-110, -0.4, 110),
    new THREE.Vector3(-110, -0.4, -110)
  ]);
  const bedLine = new THREE.Line(bedGeo, new THREE.LineBasicMaterial({ color: 0x2c3b48, transparent: true, opacity: 0.65 }));
  scene.add(bedLine);

  const nose = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 58, -78), 56, 0xc89b4e, 14, 7);
  scene.add(nose);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 24, 0);
  controls.enableDamping = true;

  const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let explode = 0, net = 'all', selected = null, fitted = false;

  const resize = () => {
    const w = host.clientWidth || 800, h = host.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  };

  const meshes = () => group.children.filter(o => o.isMesh);

  const highlight = () => meshes().forEach(o => {
    o.material.emissive && o.material.emissive.setHex(o.name === selected ? 0x5a4318 : 0x000000);
    o.children.forEach(c => c.material && c.material.color && c.material.color.setHex(o.name === selected ? 0xe2bc7c : 0x151921));
  });

  const WIRE_SEGS = 12;
  const applyPose = () => {
    meshes().forEach(o => {
      const dir = o.userData.origin || [0, 0, 0];
      o.position.set(dir[0] * explode, dir[1] * explode, dir[2] * explode);
    });
    group.children.filter(o => o.userData.kind === 'wire').forEach(o => {
      const shift = id => { const m = group.getObjectByName(id); return m ? m.position : new THREE.Vector3(); };
      const a = shift(o.userData.aId), b = shift(o.userData.bId), pa = o.userData.a, pb = o.userData.b;
      const ax = pa[0] + a.x, ay = pa[1] + a.y + 4, az = pa[2] + a.z;
      const bx = pb[0] + b.x, by = pb[1] + b.y + 4, bz = pb[2] + b.z;
      const span = Math.hypot(bx - ax, by - ay, bz - az);
      const arch = Math.min(14, Math.max(3.5, span * 0.14)) + (o.userData.idx % 3) * 1.1;
      const mx = (ax + bx) * 0.5, my = Math.max(ay, by) + arch, mz = (az + bz) * 0.5;
      const arr = o.geometry.attributes.position.array;
      for (let s = 0; s <= WIRE_SEGS; s++) {
        const t = s / WIRE_SEGS, u = 1 - t;
        arr[s * 3] = u * u * ax + 2 * u * t * mx + t * t * bx;
        arr[s * 3 + 1] = u * u * ay + 2 * u * t * my + t * t * by;
        arr[s * 3 + 2] = u * u * az + 2 * u * t * mz + t * t * bz;
      }
      o.geometry.attributes.position.needsUpdate = true;
      o.visible = net !== 'off' && (net === 'all' || klass(o.userData.name) === net);
    });
  };

  const fit = () => {
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), dist = Math.max(size.x, size.y, size.z) * 0.85;
    controls.target.copy(c);
    camera.position.set(c.x + dist * 0.72, c.y + dist * 0.62, c.z + dist);
    camera.lookAt(c);
    fitted = true;
  };

  const setResult = result => {
    group.children.slice().forEach(o => {
      o.traverse(n => { n.geometry && n.geometry.dispose(); n.material && n.material.dispose(); });
      group.remove(o);
    });
    (result.view.parts || []).forEach(part => {
      if (!part.positions.length) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(part.positions, 3));
      const hasVertexColors = part.colors && part.colors.length === part.positions.length;
      if (hasVertexColors) {
        geo.setAttribute('color', new THREE.Float32BufferAttribute(part.colors, 3));
      }
      geo.setIndex(part.indices);
      geo.computeVertexNormals();
      const matCfg = MAT_PROPS[part.role] || { metalness: 0.16, roughness: 0.52 };
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: hasVertexColors ? 0xffffff : (COLOR[part.role] || 0x888888),
        vertexColors: !!hasVertexColors,
        metalness: matCfg.metalness,
        roughness: matCfg.roughness,
        transparent: !!matCfg.transparent,
        opacity: matCfg.opacity ?? 1,
        side: THREE.DoubleSide,
        emissive: 0x000000
      }));
      mesh.name = part.id;
      const placed = (result.placed || []).find(p => p.id === part.id);
      mesh.userData = { id: part.id, role: part.role, origin: placed && placed.origin ? placed.origin : [0, 0, 0] };
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 32), new THREE.LineBasicMaterial({ color: 0x151921, transparent: true, opacity: 0.55 })));
      group.add(mesh);
    });
    (result.wires || []).forEach((w, idx) => {
      if (!w.aAt || !w.bAt) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((WIRE_SEGS + 1) * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: wireColor(klass(w.name)) }));
      line.userData = { kind: 'wire', idx, name: w.name, a: w.aAt.slice(), b: w.bAt.slice(), aId: String(w.a).split(' ')[0], bId: String(w.b || '').split(' ')[0] };
      group.add(line);
    });
    applyPose();
    highlight();
    fitted ? null : fit();
  };

  const hitId = e => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(meshes(), false);
    return hits.length ? hits[0].object.name : null;
  };

  let down = null;
  renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; onPick(hitId(e)); });
  renderer.domElement.addEventListener('pointermove', e => { if (down && e.buttons) return; const id = hitId(e); onHover(id, e.clientX, e.clientY); });
  renderer.domElement.addEventListener('pointerleave', () => onHover(null));

  const frameCheck = () => {
    const dir = new THREE.Vector3();
    camera.updateMatrixWorld();
    camera.getWorldDirection(dir);
    const mesh = group.getObjectByName('m2');
    const box = mesh ? new THREE.Box3().setFromObject(mesh) : null;
    const c = box ? box.getCenter(new THREE.Vector3()) : new THREE.Vector3();
    return { dirZ: dir.z, upY: camera.up.y, rotX: group.rotation.x, m2x: c.x, m2z: c.z };
  };

  const loop = () => { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); };
  resize();
  loop();
  addEventListener('resize', resize);
  return { setResult, resize, frameCheck, fit, camera, group, select: id => { selected = id; highlight(); }, setExplode: v => { explode = v; applyPose(); }, setWireFilter: v => { net = v; applyPose(); } };
}
