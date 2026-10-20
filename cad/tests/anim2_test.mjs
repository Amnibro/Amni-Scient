import {spawn,execFileSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
import {parse,lineOf,scaleText} from '../form_lang.js';import {mesh,bake,sampleAnim,quatXYZ} from '../form_sdf.js';import {toAnimGLB} from '../form_glb.js';import {handles,bez,chanAt,poseAt,stripTime,sampleQuat,eulerXYZ,qrot,lightsAt,camAt} from '../form_pose.js';import {FORM_TEMPLATES} from '../form_templates.js';
const root=path.resolve(new URL('../..',import.meta.url).pathname),port=process.env.PORT||'18793',shots=process.env.SHOTS||null,sleep=t=>new Promise(r=>setTimeout(r,t)),near=(a,b,e=1e-6)=>Math.abs(a-b)<e;let fail=0;const ok=(c,m,x)=>{c||fail++;console.log((c?'PASS ':'FAIL ')+m+(x!==undefined?' ('+x+')':''));};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),glbJ=async b=>{const u=new Uint8Array(await b.arrayBuffer()),jl=new DataView(u.buffer).getUint32(12,true);return{u,J:JSON.parse(new TextDecoder().decode(u.slice(20,20+jl)))};};
const G=`a sphere 0,0,0 r.5
a.loc anim 0:0,0,0/bez 1:0,0,1/bez:f:-.2,0,.1,0;-.2,0,.1,0;-.1,-.4,.5,.6 2:0,0,0/bez:v 3:1,1,1/linear:al:-.3,0,.3,0;-.3,0,.3,0;-.3,.2,.3,-.2 4:0,0,.5/step extend
a.rot anim 0:0,0,0 1:0,0,90/bez 2:0,0,0 loop`;
const sc=parse(G),L=sc.items.find(x=>x.name==='a.loc');ok(!sc.errors.length,'bezier keys with handle types parse',JSON.stringify(sc.errors));
ok(lineOf(L)===G.split('\n')[1]&&lineOf(parse(lineOf(L)).items[0]||L)===G.split('\n')[1],'graph-editor keys and handles round-trip through the scene text',lineOf(L));
const reread=parse(sc.items.map(lineOf).join('\n')).items.find(x=>x.name==='a.loc');let worst=0;for(let t=-0.5;t<=5;t+=0.05)sampleAnim(L,t).forEach((v,c)=>{worst=Math.max(worst,Math.abs(v-sampleAnim(reread,t)[c]));});ok(worst<1e-12,'saved and reloaded curves sample identically',worst);
const ref=(t,P0,P1,P2,P3)=>{let lo=0,hi=1;for(let i=0;i<60;i++){const s=(lo+hi)/2,x=(1-s)**3*P0[0]+3*(1-s)**2*s*P1[0]+3*(1-s)*s*s*P2[0]+s**3*P3[0];x<t?lo=s:hi=s;}const s=(lo+hi)/2;return(1-s)**3*P0[1]+3*(1-s)**2*s*P1[1]+3*(1-s)*s*s*P2[1]+s**3*P3[1];};
const H=handles(L);let bz=0;for(const t of[1.1,1.3,1.5,1.77,1.95]){const e=ref(t,[1,1],[1+0.5,1+0.6],[2+H[2][2][0],0+H[2][2][1]],[2,0]);bz=Math.max(bz,Math.abs(sampleAnim(L,t)[2]-e));}ok(bz<1e-6&&near(H[1][2][2],0.5)&&near(H[1][2][3],0.6),'free handles drive the bezier segment exactly',bz.toExponential(2));
ok(near(H[2][2][0],-1/3)&&near(H[2][2][1],(1-0)/3)&&near(H[2][2][2],1/3)&&near(H[2][2][3],(1-0)/3),'vector handles point a third of the way to the neighbors',H[2][2].map(v=>v.toFixed(3)).join(','));
const AC=parse('a sphere 0,0,0 r1\na.loc anim 0:0,0,0/bez 1:0,0,1/bez 2:0,0,3/bez 3:0,0,2/bez').items[1],Hc=handles(AC);let ov=0;for(let t=0;t<=3;t+=0.01){const v=sampleAnim(AC,t)[2];ov=Math.max(ov,v-3,-v);}ok(near(Hc[0][2][3],0)&&near(Hc[3][2][1],0)&&!near(Hc[1][2][3],0)&&near(Hc[2][2][3],0)&&ov<1e-9,'auto-clamped handles flatten ends and extremes',Hc.map(h=>h[2].map(v=>v.toFixed(2)).join(',')).join(' | '));
const SP=parse('a sphere 0,0,0 r1\na.loc anim 0:0,0,0/step 1:0,0,1').items[1];ok(sampleAnim(SP,0.99)[2]===0&&sampleAnim(SP,1)[2]===1&&near(sampleAnim(L,4.5)[2],0.25)&&near(sampleAnim(L,-1)[2],0,1e-9),'constant interpolation holds and extend follows the end slope',sampleAnim(L,4.5)[2]+' '+sampleAnim(L,-1)[2]);
const EX=parse('a sphere 0,0,0 r1\na.loc anim 0:0,0,0 1:0,0,1 linear extend').items[1];ok(near(sampleAnim(EX,3)[2],3)&&near(sampleAnim(EX,-1)[2],-1),'linear extrapolation continues past both ends');
const R=sc.items.find(x=>x.name==='a.rot');ok(near(sampleAnim(R,2.5)[2],sampleAnim(R,0.5)[2],1e-9),'cyclic extrapolation repeats the keys');
const Q=parse('a sphere 0,0,0 r1\na.rot anim 0:0,0,170 1:0,0,-170 quat linear\nb sphere 0,0,0 r1\nb.rot anim 0:0,0,170 1:0,0,-170 linear').items;let qmax=0,emax=0;const ang=q=>2*Math.acos(Math.min(1,Math.abs(q[3])))*180/Math.PI;for(let i=0;i<20;i++){const q0=sampleQuat(Q[1],i/20),q1=sampleQuat(Q[1],(i+1)/20),d=q0[0]*q1[0]+q0[1]*q1[1]+q0[2]*q1[2]+q0[3]*q1[3];qmax=Math.max(qmax,2*Math.acos(Math.min(1,Math.abs(d)))*180/Math.PI);const e0=quatXYZ(sampleAnim(Q[3],i/20)),e1=quatXYZ(sampleAnim(Q[3],(i+1)/20)),de=e0[0]*e1[0]+e0[1]*e1[1]+e0[2]*e1[2]+e0[3]*e1[3];emax=Math.max(emax,2*Math.acos(Math.min(1,Math.abs(de)))*180/Math.PI);}
ok(near(qmax,1,1e-3)&&Math.abs(Math.abs(sampleAnim(Q[1],0.5)[2])-180)<1e-6&&near(emax,17,1e-3),'quaternion tracks slerp the short way (20° total) while Euler keeps the long way (340°)',qmax.toFixed(3)+'°/step vs '+emax.toFixed(3)+'°/step');
const N=parse(`a sphere 0,0,0 r1
walk:a.loc anim 0:0,0,0 1:2,0,0 linear
idle:a.loc anim 0:0,0,0 1:0,0,1 linear
s1 strip walk at1 x2 n2
s2 strip idle at6 in1 tr1
s3 strip idle at9 mute
a.rot anim 0:0,0,0 9:0,0,90 linear
@len 10`);ok(!N.errors.length,'actions and strips parse',JSON.stringify(N.errors));const loc=t=>(chanAt(N,t).get('a|loc')||{v:[NaN,NaN,NaN]}).v;
ok(!chanAt(N,0.5).has('a|loc')&&near(loc(1)[0],0)&&near(loc(2)[0],1)&&near(loc(2.999)[0],1.999,1e-3)&&near(loc(3.5)[0],0.5)&&near(loc(5)[0],2),'strip start, speed scale and repeat map scene time to action time',[2,3.5,5].map(t=>loc(t)[0].toFixed(3)).join(' '));
ok(near(loc(6.5)[2],0.25)&&near(loc(6.5)[0],0)&&near(loc(7)[2],1)&&!chanAt(N,9.5).has('a|loc')&&near(stripTime({at:6,in:1,out:1},0,1,6.5).w,0.25),'blend in ramps influence; muted strips do nothing',loc(6.5).map(v=>v.toFixed(3)).join(','));
ok(near(chanAt(N,4).get('a|rot').v[2],40),'unprefixed tracks play on top of the NLA');
const st=stripTime({at:2,x:0.5,n:3,in:0.25,out:0.25},0,1,2.125);ok(near(st.lt,0.25)&&near(st.w,0.5)&&near(stripTime({at:2,x:0.5,n:3},0,1,3.5).end,3.5)&&stripTime({at:2},0,1,1)===null&&near(stripTime({at:2,hold:true},0,1,1).lt,0),'stripTime: local time, blend weight, end and hold',JSON.stringify(st));
const AD=parse(`a sphere 0,0,0 r1
up:a.loc anim 0:0,0,1 1:0,0,1
s1 strip up add w.5
a.loc anim 0:1,0,0 1:1,0,0
@len 1`);ok(near(chanAt(AD,.5,{action:null}).get('a|loc').v[0],1),'unprefixed tracks replace strip results');
const IK=`upper bone 0,0,0 1,0,0
lower bone 1,0,0 2,0,0 ^upper
tg empty 1.2,.9,.3
pole empty 1,-2,0
ik1 ik lower tg pole
tg.loc anim 0:0,0,0 1:.3,-.2,.4 2:-.5,.2,0
@len 2`,IS=parse(IK);let ikw=0,pl=0;for(const t of[0,0.4,1,1.6,2]){const P=poseAt(IS,t),T0=P.pos('tg'),u=T0.map(v=>v/Math.hypot(...T0)),pj=v=>{const d=v[0]*u[0]+v[1]*u[1]+v[2]*u[2];return v.map((x,i)=>x-u[i]*d);},a=pj(P.W.get('lower').p),b=pj(P.pos('pole'));ikw=Math.max(ikw,dist(P.tail('lower'),T0));pl=Math.max(pl,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]>0?0:1);}ok(ikw<1e-6&&!pl,'two-bone IK reaches the moving target and bends toward the pole',ikw.toExponential(2));
const FB=parse(`b0 bone 0,0,0 0,0,1
b1 bone 0,0,1 0,0,2 ^b0
b2 bone 0,0,2 0,0,3 ^b1
b3 bone 0,0,3 0,0,4 ^b2
tg empty 1.5,.5,2
ik1 ik b3 tg n4 fabrik`),fp=poseAt(FB,0),lens=['b0','b1','b2'].map((b,i)=>dist(fp.W.get(b).p,fp.W.get(['b1','b2','b3'][i]).p));ok(dist(fp.tail('b3'),[1.5,.5,2])<1e-3&&lens.every(l=>near(l,1,1e-9)),'FABRIK chain reaches the target and keeps bone lengths',dist(fp.tail('b3'),[1.5,.5,2]).toExponential(2));
const far=parse(IK.replace('tg empty 1.2,.9,.3','tg empty 5,0,0')),fpo=poseAt(far,0);ok(dist(fpo.tail('lower'),[2,0,0])<1e-3,'an unreachable target stretches the chain straight toward it');
const half=parse(IK+'\nik1.inf anim 0:1 2:0 linear'),p0=poseAt(half,0),p2=poseAt(half,2);ok(dist(p0.tail('lower'),p0.pos('tg'))<1e-6&&dist(p2.tail('lower'),[2,0,0])<1e-9,'animated influence blends IK to FK');
const C=parse(`a bone 0,0,0 0,0,1
b bone 2,0,0 2,0,1
t empty 1,1,3
tt trackto a t
cr copyrot b a
lim limitrot a z-10,10
@len 1`),cp=poseAt(C,0),dir=(()=>{const h=cp.W.get('a').p,tl=cp.tail('a'),v=tl.map((x,i)=>x-h[i]),l=Math.hypot(...v);return v.map(x=>x/l);})(),want=[1,1,3].map(v=>v/Math.hypot(1,1,3)),qa=cp.W.get('a').q,qb=cp.W.get('b').q;ok(dist(dir,want)<1e-9,'track-to points the bone at its target');ok(Math.abs(qa[0]*qb[0]+qa[1]*qb[1]+qa[2]*qb[2]+qa[3]*qb[3])>1-1e-9,'copy rotation matches the source bone');
const lim=poseAt(parse('a bone 0,0,0 0,0,1\na.rot anim 0:30,0,80 1:0,0,0\nlim limitrot a x-10,10 z0,45\n@len 1'),0),le=eulerXYZ(lim.L.get('a').q);ok(near(le[0],10,1e-6)&&near(le[2],45,1e-6),'limit rotation clamps local angles',le.map(v=>v.toFixed(2)).join(','));
const bk=bake(IK);ok(bk&&bk.tracks.some(t=>t.bone==='upper'&&t.ch==='rot')&&bk.tracks.some(t=>t.bone==='lower'&&t.ch==='rot'),'IK rotations are baked into the playback tracks',bk.tracks.map(t=>t.bone+'.'+t.ch).join(' '));
{const fk=i=>{const q=(b)=>bk.tracks.find(t=>t.bone===b&&t.ch==='rot').values.slice(4*i,4*i+4),mul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],qu=q('upper'),ql=mul(qu,q('lower')),el=qrot(qu,[1,0,0]),tip=el.map((v,k)=>v+qrot(ql,[1,0,0])[k]);return tip;},i=Math.round(1.6*30),tg=poseAt(IS,bk.times[i]).pos('tg');ok(dist(fk(i),tg)<1e-5,'baked IK quaternions put the chain tip on the target',dist(fk(i),tg).toExponential(2));}
const base=JSON.parse(fs.readFileSync(new URL('./fixtures/form_anim_baseline.json',import.meta.url)));let bw=0,bad=[];for(const o of base){const b=bake(o.text);if(!o.bake){if(b)bad.push(o.key);continue;}if(b.times.length!==o.bake.n||b.tracks.length!==o.bake.tracks.length)bad.push(o.key+' shape');for(const t of o.bake.tracks){const r=b.tracks.find(x=>x.bone===t.bone&&x.ch===t.ch);if(!r){bad.push(o.key+' '+t.bone);continue;}t.values.forEach((v,i)=>{bw=Math.max(bw,Math.abs(v-r.values[i]));});}if(o.cam){const cm=parse(o.text).items.find(x=>x.name==='@cam');o.cam.forEach((v,i)=>sampleAnim(cm,i*0.1).forEach((x,j)=>{bw=Math.max(bw,Math.abs(x-v[j]));}));}}
ok(!bad.length&&bw<1e-6,'old scenes and templates sample the same poses as before ('+base.length+' scenes)',bw.toExponential(2)+(bad.length?' '+bad.join(','):''));
ok(FORM_TEMPLATES.every(t=>!parse(t.text).errors.length),'every template still parses');
ok(scaleText('k light spot 1,2,3 0,0,0 w5 sz1,2\nc camera 1,1,1 0,0,0 cl.1,10 or2\nik1 ik a 1,0,0\na.loc anim 0:0,0,0/bez:f:-.1,1,.1,1 1:1,1,1',10)==='k light spot 10,20,30 0,0,0 w5 sz10,20\nc camera 10,10,10 0,0,0 cl1,100 or20\nik1 ik a 10,0,0\na.loc anim 0:0,0,0/bez:f:-.1,10,.1,10 1:10,10,10','unit conversion scales lights, cameras, IK points and handle values');
ok(['k light lamp 0,0,0','k light spot','ik1 ik a','s1 strip','zz.power anim 0:1','a sphere 0,0,0 r1\na.loc anim 0:0,0,0/bez:f:1,2 1:1,1,1','a sphere 0,0,0 r1\ns1 strip nope','walk:a sphere 0,0,0 r1'].every(t=>parse(t).errors.length),'bad light, constraint, strip, handle and action lines report errors');
const LS=parse('k light spot 0,0,5 0,0,0 w10 k3000 c30\nk.power anim 0:10 1:30 linear\nk.loc anim 0:0,0,0 1:1,0,0 linear\nk.rot anim 0:0,0,0 1:90,0,0 linear\n@len 1'),l1=lightsAt(LS,1)[0],l0=lightsAt(LS,0)[0];ok(near(l1.power,30)&&near(l1.pos[0],1)&&near(l0.dir[2],-1)&&near(l1.dir[1],1,1e-9)&&l0.color[2]<l0.color[0],'lights animate power, position and aim; kelvin warms the color',JSON.stringify({p:l1.power,d:l1.dir.map(v=>+v.toFixed(3)),c:l0.color.map(v=>+v.toFixed(2))}));
const CM=parse('c1 camera 0,-5,1 0,0,0 mm35\nc2 camera 5,0,1 0,0,0 or4\nc1.cam anim 0:0,-5,1,0,0,0 1:0,-8,1,0,0,0,50\n@markers 0:c1 1.5:c2\n@len 2');ok(camAt(CM,0.5).name==='c1'&&near(camAt(CM,1)[6],50)&&camAt(CM,1.7).name==='c2'&&camAt(CM,1.7).ortho===4,'camera markers switch the active camera over time');
const tdir=process.env.THREE_DIR||path.join(os.tmpdir(),'amni-three-0.180.0');if(!fs.existsSync(path.join(tdir,'node_modules/three/package.json'))){fs.mkdirSync(path.join(tdir,'node_modules'),{recursive:true});execFileSync('npm',['pack','three@0.180.0','--silent'],{cwd:tdir});execFileSync('tar',['xzf','three-0.180.0.tgz','-C','node_modules'],{cwd:tdir});fs.renameSync(path.join(tdir,'node_modules/package'),path.join(tdir,'node_modules/three'));}
const TH=await import(pathToFileURL(path.join(tdir,'node_modules/three/build/three.module.js')).href),{GLTFLoader}=await import(pathToFileURL(path.join(tdir,'node_modules/three/examples/jsm/loaders/GLTFLoader.js')).href),load=u=>new Promise((res,rej)=>new GLTFLoader().parse(u.buffer.slice(0),'',res,rej));
const CH=`body capsule 0,0,0 0,0,1 r.3
arm capsule .3,0,.8 .8,0,.8 r.08 @arm
arm bone .3,0,.8 .8,0,.8
idle:arm.rot anim 0:0,0,0 1:0,0,10 2:0,0,0
walk:arm.rot anim 0:0,0,0 .5:0,0,40 1:0,0,0
walk:arm.loc anim 0:0,0,0 .5:0,0,.1 1:0,0,0
run:arm.rot anim 0:0,0,0 .25:0,0,60 .5:0,0,0
arm.scale anim 0:1 3:1.2
@len 3
@start .5`,cm=mesh(CH,40),cbk=bake(CH),{u:cu,J:cj}=await glbJ(await toAnimGLB(cm,cbk,{units:'in',name:'hero'})),cg=await load(cu),byName=Object.fromEntries(cg.animations.map(a=>[a.name,a]));
ok(['idle','walk','run','Action'].every(n=>byName[n])&&cg.animations.length===4,'each action is its own named glTF animation',cg.animations.map(a=>a.name).join(', '));
ok(near(byName.idle.duration,2,1e-4)&&near(byName.walk.duration,1,1e-4)&&near(byName.run.duration,0.5,1e-4)&&near(byName.Action.duration,2.5,1e-4),'animation durations follow each action, and @start trims the main one',cg.animations.map(a=>a.name+' '+a.duration.toFixed(3)).join(', '));
ok(byName.idle.tracks.length===1&&byName.walk.tracks.length===2&&byName.run.tracks.length===1&&byName.Action.tracks.length===1,'channel counts per action',cg.animations.map(a=>a.name+':'+a.tracks.length).join(' '));
const CU=`a sphere 0,0,0 r.4
b sphere 2,0,0 r.3
b.loc anim 0:0,0,0/bez 1:0,.5,1/bez:f:-.333333,0,.333333,.3;-.333333,0,.333333,.3;-.333333,-.2,.333333,.2 2:1,0,0/linear 3:0,0,0/out 4:0,0,1
b.scale anim 0:1 2:2/in 4:1
@len 4
@gltf cubic`,ub=bake(CU),{u:uu,J:uj}=await glbJ(await toAnimGLB(mesh(CU,40),ub,{units:'mm',name:'cu'})),ug=await load(uu),ua=ug.animations[0];
ok(uj.animations[0].samplers.filter(s=>s.interpolation==='CUBICSPLINE').length===2,'@gltf cubic writes CUBICSPLINE samplers for bezier and eased loc/scale',uj.animations[0].samplers.map(s=>s.interpolation).join(','));
{const tp=ua.tracks.find(t=>t.name.endsWith('.position')),ts=ua.tracks.find(t=>t.name.endsWith('.scale')),ip=tp.createInterpolant(),is=ts.createInterpolant(),node=ug.scene.getObjectByName('b'),r0=node.position.clone(),bl=parse(CU).items.find(x=>x.name==='b.loc'),bs=parse(CU).items.find(x=>x.name==='b.scale');let w=0;for(let t=0;t<=4;t+=0.07){const v=ip.evaluate(t),e=sampleAnim(bl,t),y=[r0.x+e[0]*0.001,r0.y+e[2]*0.001,r0.z-e[1]*0.001];w=Math.max(w,...[0,1,2].map(k=>Math.abs(v[k]-y[k])/0.001));const s=is.evaluate(t),se=sampleAnim(bs,t);w=Math.max(w,Math.abs(s[0]-se[0]),Math.abs(s[1]-se[2]));}ok(w<1e-4,'cubic glTF curves re-read by GLTFLoader match the scene curves (bezier, linear, ease out, ease in)',w.toExponential(2));}
const ST=bake(CU.replace('@gltf cubic','@gltf step')),{J:sj}=await glbJ(await toAnimGLB(mesh(CU,40),ST,{units:'mm'}));ok(sj.animations[0].samplers.every(s=>s.interpolation==='STEP'),'@gltf step writes stepped samplers');
const LT=`a sphere 0,0,0 r.5
key light spot 2,-2,3 0,0,0 w40 k5000 c50
sun1 light sun 0,0,10 1,1,0 w3
bulb light point 0,0,2 w10 #ff8800
soft light area -2,0,2 0,0,0 w20 sz1,1
cam1 camera 4,-4,2 0,0,.5 mm35
cam2 camera 0,-6,0 0,0,0 or3
key.loc anim 0:0,0,0 1:0,0,1
cam1.cam anim 0:4,-4,2,0,0,.5 1:-4,-4,2,0,0,.5
@len 1`,lb=bake(LT),{u:lu,J:lj}=await glbJ(await toAnimGLB(mesh(LT,40),lb,{units:'in'})),lg=await load(lu),lights=[];lg.scene.traverse(o=>{if(o.isLight)lights.push(o.type);});
ok(lj.extensionsUsed.includes('KHR_lights_punctual')&&lj.extensions.KHR_lights_punctual.lights.length===4&&lj.extensions.KHR_lights_punctual.lights.map(l=>l.type).sort().join()==='directional,point,spot,spot','KHR_lights_punctual carries point, spot, sun and area (as a spot) lights',lj.extensions.KHR_lights_punctual.lights.map(l=>l.name+':'+l.type).join(' '));
ok(lights.filter(t=>t!=='Object3D').length>=4&&lg.cameras.length===2&&lj.cameras.some(c=>c.type==='orthographic')&&lj.cameras.find(c=>c.name==='cam1').perspective.yfov>0.3,'GLTFLoader rebuilds the lights and both cameras',lights.join(',')+' · '+lg.cameras.length+' cameras');
{const sa=lj.animations.find(a=>a.name==='Scene');ok(sa&&sa.channels.some(c=>lj.nodes[c.target.node].name==='cam1'&&c.target.path==='rotation')&&sa.channels.some(c=>lj.nodes[c.target.node].name==='key'&&c.target.path==='translation'),'camera and light motion is exported as its own Scene animation',lj.animations.map(a=>a.name).join(','));}
const SL=bake('k light point 0,0,2 w5\nc camera 1,1,1 0,0,0');ok(SL&&SL.static&&SL.len===0&&SL.lights.length===1,'scenes with only lights and cameras still export them');
const P=createRequire(import.meta.url)(process.env.PUPPETEER||path.join(os.homedir(),'.npm/_npx/8003d8991b0d346b/node_modules/puppeteer-core')),ud=fs.mkdtempSync(path.join(os.tmpdir(),'anim2-')),srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});let br;
try{br=await P.launch({executablePath:'/usr/bin/google-chrome-stable',headless:'new',userDataDir:ud,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await br.newPage();await p.setViewport({width:1440,height:900});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await sleep(400);await p.goto(`http://127.0.0.1:${port}/cad/#form`);await p.waitForFunction(()=>window.amnicad&&window.amnicad.API.hooks.formState&&window.amnicad.API.hooks.formState.mesh,{timeout:60000});await p.evaluate(()=>{document.querySelector('main').style.setProperty('--rwc','352px');});
  const setS=t=>p.evaluate(async t=>{const A=window.amnicad.API,F=A.hooks.formState,m0=F.mesh;A.commit(d=>{d.form=t;});for(let i=0;i<300&&F.mesh===m0;i++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,300));},t),txt=()=>p.evaluate(()=>window.amnicad.API.doc.form),line=async n=>(await txt()).split('\n').find(l=>l.startsWith(n+' '))||'',tab=n=>p.evaluate(n=>[...document.querySelectorAll('.ftabs button')].find(b=>b.textContent===n).click(),n),view=v=>p.evaluate(v=>{const F=window.amnicad.API.hooks.formState;F.tlView=v;[...document.querySelectorAll('#ftl .seg button')].find(b=>b.textContent===({dope:'Dope sheet',graph:'Graph',nla:'NLA'})[v]).click();},v),wait=async(fn,ms=6000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await fn())return true;await sleep(150);}return false;};
  await setS(`ball sphere 0,0,0 r.5 #f2a541
ball.loc anim 0:0,0,0/bez 1:0,0,1/bez 2:0,0,0/bez
@len 2`);await tab('Animate');await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;F.sel={name:'ball',bone:false};F.selection=['ball'];});await sleep(200);await view('graph');await sleep(600);
  ok(await p.evaluate(()=>document.querySelectorAll('#ftl .fge circle.k').length===9&&document.querySelectorAll('#ftl .fge path').length===3),'graph editor draws three curves with their keys');if(shots)await p.screenshot({path:path.join(shots,'graph-desktop.png')});
  const kz=await p.evaluate(()=>{const c=[...document.querySelectorAll('#ftl .fge circle.k')].find(c=>c.dataset.id==='ball.loc|1|2'),r=c.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});await p.mouse.move(kz.x,kz.y);await p.mouse.down();await p.mouse.move(kz.x,kz.y+40,{steps:5});await p.mouse.up();await wait(async()=>!/1:0,0,1\//.test(await line('ball.loc')));const l1=await line('ball.loc');const z1=+(l1.match(/ 1:0,0,(-?[\d.]+)/)||[])[1];ok(z1<0.98&&z1>0.3,'dragging a key in the graph changes its value',l1);
  const hd=await p.evaluate(()=>{const h=[...document.querySelectorAll('#ftl .fge rect.hd')].find(r=>r.dataset.id==='ball.loc|1|2|R'),r=h&&h.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null;});if(hd){await p.mouse.move(hd.x,hd.y);await p.mouse.down();await p.mouse.move(hd.x+25,hd.y-35,{steps:5});await p.mouse.up();await wait(async()=>/1:0,0,[\d.]+\/bez:al:/.test(await line('ball.loc')));}const l2=await line('ball.loc'),m2=l2.match(/1:0,0,[\d.]+\/bez:al:([^ ]+)/);ok(!!hd&&!!m2&&m2[1].split(';').length===3,'dragging a handle stores aligned handles in the scene text',l2);
  if(m2){const g=m2[1].split(';')[2].split(',').map(Number);ok(near(g[1]/g[0],g[3]/g[2],1e-3)&&g[3]>0,'aligned handles stay collinear',m2[1].split(';')[2]);}
  const bx=await p.evaluate(()=>{const s=document.querySelector('#ftl .fge svg').getBoundingClientRect();return{x:s.x,y:s.y,w:s.width,h:s.height};});await p.mouse.move(bx.x+4,bx.y+22);await p.mouse.down();await p.mouse.move(bx.x+bx.w-4,bx.y+bx.h-4,{steps:4});await p.mouse.up();await sleep(200);ok(await p.evaluate(()=>window.amnicad.API.hooks.formState.ge.sel.size===9),'box select picks every visible key');
  await p.evaluate(()=>{[...document.querySelectorAll('#ftl select')].find(s=>[...s.options].some(o=>o.textContent==='Constant')).value='linear';[...document.querySelectorAll('#ftl select')].find(s=>[...s.options].some(o=>o.textContent==='Constant')).dispatchEvent(new Event('change'));});await wait(async()=>/linear/.test(await line('ball.loc')));ok(/0:0,0,0\/linear 1:[^ ]+\/linear:al:/.test(await line('ball.loc')),'interpolation menu sets every selected key',await line('ball.loc'));
  await p.evaluate(()=>{const s=[...document.querySelectorAll('#ftl select')].find(s=>[...s.options].some(o=>o.textContent==='Cyclic'));s.value='cycle';s.dispatchEvent(new Event('change'));});await wait(async()=>/ loop$/.test(await line('ball.loc')));ok(/ loop$/.test(await line('ball.loc')),'extrapolation menu sets cyclic',await line('ball.loc'));
  const vw=await p.evaluate(()=>{const G=window.amnicad.API.hooks.formState.ge,v0={...G.view};[...document.querySelectorAll('#ftl button')].find(b=>b.textContent.includes('Frame all')).click();const v1={...G.view};document.querySelector('#ftl .fge input[type=checkbox],#ftl input[type=checkbox]');return{v0,v1};});ok(vw.v1.t0<=0&&vw.v1.t1>=2,'Frame all fits the keys',JSON.stringify(vw.v1));
  await p.evaluate(()=>{const c=[...document.querySelectorAll('#ftl label')].find(l=>l.textContent.includes('Normalize')).querySelector('input');c.click();});await sleep(500);ok(await p.evaluate(()=>{const G=window.amnicad.API.hooks.formState.ge;return G.norm&&G.view.v0>=-1.5&&G.view.v1<=1.5;}),'Normalize maps curves to -1..1');
  await p.setViewport({width:390,height:844});await sleep(600);if(shots)await p.screenshot({path:path.join(shots,'graph-phone.png')});ok(await p.evaluate(()=>{const e=document.querySelector('#ftl .fge');return e&&e.getBoundingClientRect().right<=390&&document.documentElement.scrollWidth<=392;}),'graph editor fits a 390 px phone');await p.setViewport({width:1440,height:900});await p.evaluate(()=>{document.querySelector('main').style.setProperty('--rwc','352px');});
  await setS(`body capsule 0,0,0 0,0,1 r.3
armL capsule .3,0,.8 .8,0,.8 r.08 @armL
armR capsule -.3,0,.8 -.8,0,.8 r.08 @armR
armL bone .3,0,.8 .8,0,.8
armR bone -.3,0,.8 -.8,0,.8
armL.rot anim 0:0,10,30 1:0,0,0
armL.loc anim 0:.1,0,0 1:0,0,0
@len 1`);await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;F.t=0;F.sel={name:'armL',bone:true};F.selection=['armL'];[...document.querySelectorAll('.ftabs button')].find(b=>b.textContent==='Model').click();[...document.querySelectorAll('.ftabs button')].find(b=>b.textContent==='Animate').click();});await sleep(300);
  await p.evaluate(()=>[...document.querySelectorAll('#fright button')].find(b=>b.textContent==='Copy pose').click());await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;F.t=0.5;});await p.evaluate(()=>[...document.querySelectorAll('#fright button')].find(b=>b.textContent==='Paste flipped').click());await wait(async()=>/armR\.rot/.test(await txt()));ok(/armR\.rot anim \.5:0,-10,-30/.test(await txt())&&/armR\.loc anim \.5:-\.1,0,0/.test(await txt()),'paste flipped mirrors the pose onto the other side',(await line('armR.rot'))+' | '+(await line('armR.loc')));
  await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;F.t=0.5;F.onion=true;F.mixer&&F.mixer.setTime(0.5);});await p.evaluate(()=>window.amnicad.API.hooks.formState&&document.querySelector('#ftl'));await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;[...document.querySelectorAll('.ftabs button')].find(b=>b.textContent==='Model').click();[...document.querySelectorAll('.ftabs button')].find(b=>b.textContent==='Animate').click();});await sleep(800);const gh=await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;return F.ghosts.children.map(c=>c.userData.t);});ok(gh.length===2&&near(gh[0],0)&&near(gh[1],1),'onion skin shows ghosts at the previous and next keys',JSON.stringify(gh));
  await p.evaluate(()=>{window.amnicad.API.hooks.formState.onion=false;});
  await p.evaluate(()=>[...document.querySelectorAll('#fright button')].find(b=>b.textContent.includes('New action')).click());await wait(async()=>/^@action action1/m.test(await txt()));const ta=await txt();ok(/^action1:armL\.rot anim/m.test(ta)&&/^@action action1/m.test(ta),'New action copies the playing action under a new name and plays it',ta.split('\n').filter(l=>l.startsWith('action1')).length+' tracks');
  await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;F.t=0.2;F.sel={name:'armL',bone:true};F.selection=['armL'];});await p.keyboard.press('i');await wait(async()=>/action1:armL\.rot anim [^\n]*\.2:/.test(await txt()));ok(/action1:armL\.rot anim [^\n]*\.2:/.test(await txt())&&!/^armL\.rot anim [^\n]*\.2:/m.test(await txt()),'I keys into the playing action only');
  await view('nla');await sleep(300);await p.evaluate(()=>[...document.querySelectorAll('#ftl button')].find(b=>b.textContent.includes('Add strip')).click());await wait(async()=>/ strip /.test(await txt()));ok(/^strip1 strip action1 at\.2\b/m.test(await txt()),'Add strip puts the action on the NLA at the current time',await line('strip1'));
  await sleep(500);const sd=await p.evaluate(()=>{const s=document.querySelector('#ftl .fnla .st'),r=s&&s.getBoundingClientRect();return r?{x:r.x+r.width*0.4,y:r.y+r.height/2,w:document.querySelector('#ftl .fnla .nt').getBoundingClientRect().width}:null;});if(sd){await p.mouse.move(sd.x,sd.y);await p.mouse.down();await p.mouse.move(sd.x+sd.w*0.2,sd.y,{steps:5});await p.mouse.up();await wait(async()=>!/ at\.2\b/.test(await line('strip1')));}ok(sd&&/ at(?!\.2\b)[\d.]+/.test(await line('strip1')),'dragging a strip retimes it',await line('strip1'));
  if(shots){await p.screenshot({path:path.join(shots,'nla-desktop.png')});}
  const ms=await p.evaluate(()=>{const s=document.querySelector('#ftl .fnla .st').getBoundingClientRect();return{x:s.x+5,y:s.y+5};});await p.mouse.click(ms.x,ms.y,{button:'right'});await sleep(200);await p.evaluate(()=>[...document.querySelectorAll('.fkm button')].find(b=>b.textContent==='Mute').click());await wait(async()=>/ mute/.test(await line('strip1')));ok(/ mute/.test(await line('strip1')),'strip menu mutes a strip');
  await setS(`upper bone 0,0,1 1,0,1
lower bone 1,0,1 2,0,1 ^upper
arm capsule 0,0,1 1,0,1 r.1 @upper
fore capsule 1,0,1 2,0,1 r.08 @lower
tg empty 1.3,.8,1.4
ik1 ik lower tg
tg.loc anim 0:0,0,0 1:.2,-.3,.2
@len 1`);const ikv=await p.evaluate(async()=>{const A=window.amnicad.API,F=A.hooks.formState,T=A.THREE;for(let i=0;i<100&&!F.mixer;i++)await new Promise(r=>setTimeout(r,50));const res=[];for(const t of[0,0.5,0.97]){F.t=t;F.mixer.setTime(t);F.obj.updateMatrixWorld(true);const b=F.bones[F.mesh.skin.bones.findIndex(x=>x.name==='lower')],tip=b.localToWorld(new T.Vector3(1,0,0));res.push(tip.toArray());}return res;});const tgs=[0,0.5,0.97].map(t=>[1.3+0.2*t,0.8-0.3*t,1.4+0.2*t]);
  ok(ikv.every((v,i)=>dist(v,tgs[i])<0.03),'IK drives the skinned bones in the viewport playback',ikv.map((v,i)=>dist(v,tgs[i]).toFixed(4)).join(' '));
  await setS(`ball sphere 0,0,0 r.5
lamp light spot 2,-2,2 0,0,0 w5 c40
cam1 camera 4,-4,2 0,0,0 mm35
tgt empty 0,0,1`);await p.evaluate(()=>{const A=window.amnicad.API;A.camera.position.set(6,-6,4);A.controls.target.set(0,0,0.5);A.camera.lookAt(0,0,0.5);A.camera.updateMatrixWorld();window.amnicad.API.hooks.formState.t=0;});await tab('Render');await sleep(500);const gz=await p.evaluate(()=>{const A=window.amnicad.API,F=A.hooks.formState,T=A.THREE,v=new T.Vector3(2,-2,2).project(A.camera),r=A.renderer.domElement.getBoundingClientRect();return{n:F.giz.geometry.attributes.position.count,x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height};});ok(gz.n>40,'lights, cameras and empties draw viewport gizmos',gz.n+' vertices');
  await p.mouse.click(gz.x,gz.y);await sleep(300);ok(await p.evaluate(()=>{const F=window.amnicad.API.hooks.formState;return F.sel&&F.sel.name==='lamp';}),'clicking a light gizmo selects the light');if(shots)await p.screenshot({path:path.join(shots,'gizmos-render-tab.png')});
  await p.evaluate(()=>[...document.querySelectorAll('#fright .flgt button')].find(b=>b.textContent.includes('Area')).click());await wait(async()=>/softbox1 light area/.test(await txt()));ok(/softbox1 light area [^\n]* w[\d.]+ sz/.test(await txt()),'Add Area places a sized softbox aimed at the model',await line('softbox1'));
  await p.evaluate(()=>[...document.querySelectorAll('#fright button')].find(b=>b.textContent.includes('Camera from view')).click());await wait(async()=>/camera1 camera/.test(await txt()));ok(/^camera1 camera 6,-6,4 0,0,\.5 mm/m.test(await txt()),'Camera from view adds a named camera at the view',await line('camera1'));
  const ak=await p.evaluate(async()=>{const A=window.amnicad.API,FA=await import('/cad/form_anim.js');return FA.agentKey(A,{keys:[{object:'lamp',channel:'power',time:0,value:5},{object:'lamp',channel:'power',frame:30,value:25,interpolation:'bezier',handle:'vector'},{object:'ball',channel:'rot',time:1,value:[0,0,180],action:'spin',rotation_mode:'quat'}]});});await sleep(1200);const tk=await txt();ok(!ak.errors.length&&/^lamp\.power anim 0:5 1:25\/bez:v/m.test(tk)&&/^spin:ball\.rot anim 1:0,0,180 quat/m.test(tk),'agent keys by object, channel, frame, value and interpolation, creating actions',ak.lines.join(' | '));
  await p.setViewport({width:390,height:844});await sleep(500);await tab('Animate');await sleep(300);await view('nla');await sleep(300);if(shots)await p.screenshot({path:path.join(shots,'nla-phone.png')});ok(await p.evaluate(()=>document.documentElement.scrollWidth<=392),'NLA view fits a phone without sideways scrolling');
  ok(!errs.length,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
}catch(e){fail++;console.log('FAIL',e.stack||e.message);}finally{try{await br?.close();}catch{}srv.kill();fs.rmSync(ud,{recursive:true,force:true});}
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
