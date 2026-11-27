const FACES=[['Top',[0,0,1],[1,0,0],[0,1,0]],['Bottom',[0,0,-1],[1,0,0],[0,-1,0]],['Front',[0,-1,0],[1,0,0],[0,0,1]],['Back',[0,1,0],[-1,0,0],[0,0,1]],['Right',[1,0,0],[0,1,0],[0,0,1]],['Left',[-1,0,0],[0,-1,0],[0,0,1]]],S=37,A=[-0.78,0,0.78];
const CSS=`#vcube{position:absolute;top:11px;right:11px;width:${2*S+24}px;z-index:7;user-select:none;touch-action:none;display:flex;flex-direction:column;align-items:center;gap:7px}
#vcube .vw{width:${2*S}px;height:${2*S}px;margin:12px;cursor:grab}
#vcube .vw.drag{cursor:grabbing}
#vcube .vc{position:relative;width:100%;height:100%;transform-style:preserve-3d}
#vcube .vf{position:absolute;inset:0;backface-visibility:hidden;display:grid;grid-template:22% 56% 22%/22% 56% 22%;background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--line2,var(--line));box-sizing:border-box;font:650 11px/1 var(--font,system-ui);color:var(--ink2,var(--ink));letter-spacing:.02em}
#vcube .vf>i{display:grid;place-items:center;font-style:normal;cursor:pointer}
#vcube .vf>i:hover{background:color-mix(in srgb,var(--acc) 55%,transparent);color:#fff}
#vcube .vh{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:13px;color:var(--mut);background:color-mix(in srgb,var(--panel) 80%,transparent);border:1px solid var(--line)}
#vcube .vh:hover{color:var(--ink);border-color:var(--acc)}@media (max-width:700px){#vcube .vh{scale:1.25}}
@media (max-width:700px){#vcube{transform:scale(.8);transform-origin:top right}}
@media print{#vcube{display:none}}`;
export function mount(api){const T=api.THREE,vp=document.getElementById('vp');if(!vp||document.getElementById('vcube'))return;const st=document.createElement('style');st.textContent=CSS;document.head.append(st);const el=(t,c,x)=>{const e=document.createElement(t);c&&(e.className=c);x&&(e.textContent=x);return e;},root=el('div'),wv=el('div','vw'),cube=el('div','vc'),home=el('button','vh','⌂');root.id='vcube';root.setAttribute('aria-label','Orientation cube: click a face, edge or corner to look from there, drag to orbit');home.type='button';home.title='Home view';home.onclick=()=>api.view('iso');
  const pick=p=>{const V=api.VS;if(!V)return null;V.ex.vs_cube(p[0],p[1],p[2]);const o=V.v(6);return[o[0],o[1],o[2]];};
  for(const[name,n,r,u]of FACES){const f=el('div','vf'),M=new T.Matrix4().set(r[0],-u[0],n[0],n[0]*S,r[1],-u[1],n[1],n[1]*S,r[2],-u[2],n[2],n[2]*S,0,0,0,1);f.style.transform='matrix3d('+M.elements.join(',')+')';for(let row=0;row<3;row++)for(let col=0;col<3;col++){const c=el('i',null,row===1&&col===1?name:''),a=A[col],b=A[2-row],p=[0,1,2].map(k=>n[k]+a*r[k]+b*u[k]);c.title=row===1&&col===1?name+' view':'Look from this '+(row!==1&&col!==1?'corner':'edge');c.dataset.p=p.join(',');f.append(c);}cube.append(f);}
  wv.append(cube);root.append(wv,home);vp.append(root);
  let drag=null,key='';const orbit=(dx,dy)=>{const c=api.camera,t=api.controls.target,o=c.position.clone().sub(t),Z=new T.Vector3(0,0,1);o.applyAxisAngle(Z,-dx*0.011);const rt=new T.Vector3().crossVectors(Z,o).normalize(),o2=o.clone().applyAxisAngle(rt,-dy*0.011);Math.abs(o2.clone().normalize().z)<0.997&&o.copy(o2);c.position.copy(t).add(o);c.lookAt(t);api.controls.update();api.redraw&&api.redraw();};
  wv.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag={x:e.clientX,y:e.clientY,moved:false,t:e.target};wv.setPointerCapture(e.pointerId);});
  wv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<3)return;drag.moved=true;wv.classList.add('drag');orbit(dx,dy);drag.x=e.clientX;drag.y=e.clientY;});
  wv.addEventListener('pointerup',e=>{const d=drag;drag=null;wv.classList.remove('drag');if(!d||d.moved)return;const c=d.t&&d.t.closest&&d.t.closest('i[data-p]'),dir=c&&pick(c.dataset.p.split(',').map(Number));dir&&api.view(dir);});
  wv.addEventListener('pointercancel',()=>{drag=null;wv.classList.remove('drag');});
  const loop=()=>{if(!root.isConnected)return;const q=api.camera.quaternion,k=q.x.toFixed(4)+q.y.toFixed(4)+q.z.toFixed(4)+q.w.toFixed(4);if(k!==key){key=k;const M=new T.Matrix4().makeScale(1,-1,1).multiply(new T.Matrix4().makeRotationFromQuaternion(q.clone().invert()));cube.style.transform='matrix3d('+M.elements.join(',')+')';}requestAnimationFrame(loop);};loop();}
