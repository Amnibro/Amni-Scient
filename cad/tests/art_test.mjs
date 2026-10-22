import * as SDF from '../form_sdf.js';
import * as ART from '../art.js';
import * as RIG from '../rig.js';
import * as H from '../headless.js';
import {bake,bvh} from '../bake.js';
import {tangents} from '../uv.js';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL',m));},perf={},t=(k,f)=>{const a=Date.now(),r=f();perf[k]=Date.now()-a;return r;},ta=async(k,f)=>{const a=Date.now(),r=await f();perf[k]=Date.now()-a;return r;};
const glbJ=u=>{const v=new DataView(u.buffer,u.byteOffset,u.byteLength),jl=v.getUint32(12,true),bl=v.getUint32(20+jl,true);return{ok:v.getUint32(0,true)===0x46546c67&&v.getUint32(8,true)===u.length&&28+jl+bl===u.length&&v.getUint32(24+jl,true)===0x004e4942,J:JSON.parse(new TextDecoder().decode(u.subarray(20,20+jl)))};};
const px=new Uint8Array(64*32*4).map((_,i)=>i%4===3?255:i%4===0?((i>>2)%64)*4:i%4===1?((i>>2)/64|0)*8:77),png=ART.encodePNG(px,64,32),dp=ART.decodePNG(png);
ok(dp.w===64&&dp.h===32&&dp.data.every((v,i)=>v===px[i]),'PNG encode and decode round-trip exactly');
ok(ART.decodePNG(ART.encodePNG(Uint8Array.from({length:16},(_,i)=>i%4===3?128:200),2,2)).data[3]===128,'PNG keeps alpha when it is not opaque');
const HUM=`units m
torso capsule 0,0,.95 0,0,1.45 r.17 @spine m:matte #2f4f8f
head sphere 0,0,1.62 r.11 @head m:skin #c99a77
armL capsule .2,0,1.42 .62,0,1.32 r.05 @armL m:matte #2f4f8f
armR capsule -.2,0,1.42 -.62,0,1.32 r.05 @armR m:matte #2f4f8f
legL capsule .1,0,.95 .12,0,.06 r.07 @legL m:matte #333333
legR capsule -.1,0,.95 -.12,0,.06 r.07 @legR m:matte #333333
spine bone 0,0,.9 0,0,1.5
head bone 0,0,1.5 0,0,1.75 ^spine
armL bone .2,0,1.42 .62,0,1.32 ^spine
armR bone -.2,0,1.42 -.62,0,1.32 ^spine
legL bone .1,0,.95 .12,0,.06
legR bone -.1,0,.95 -.12,0,.06
walk:legL.rot anim 0:-20,0,0 .5:20,0,0 1:-20,0,0 loop`;
const m=t('form-mesh',()=>SDF.mesh(SDF.compile(HUM),150)),src={pos:m.pos,idx:m.idx,nrm:m.nrm,col:m.col};
const fit=RIG.fitHumanoid(m.pos),bn=n=>fit.bones.find(b=>b.name===n);
ok(fit.bones.length===22&&fit.bones.filter(b=>b.parent<0).length===1,'the humanoid skeleton has 22 bones and one root');
ok(bn('LeftHand').head[0]>.45&&bn('RightHand').head[0]<-.45,'T-pose hands are found at the arm tips');
ok(Math.abs(bn('LeftUpLeg').head[0]-.1)<.05&&Math.abs(bn('RightUpLeg').head[0]+.1)<.05,'legs are found inside the leg columns');
ok(bn('Head').tail[2]>1.7&&bn('Hips').head[2]>.8&&bn('Hips').head[2]<1.1,'the spine runs from the hips to the top of the head');
const sk=t('skin',()=>RIG.skin(m.pos,m.idx,fit.bones,{}));let sumOk=true,armL=0,armBad=0;const iA=fit.bones.findIndex(b=>b.name==='LeftForeArm'),iR=fit.bones.findIndex(b=>b.name.startsWith('Right')&&b.name.includes('Arm'));
for(let v=0;v<m.pos.length/3;v++){const s=sk.weights[4*v]+sk.weights[4*v+1]+sk.weights[4*v+2]+sk.weights[4*v+3];Math.abs(s-1)>1e-3&&(sumOk=false);const x=m.pos[3*v],dom=sk.joints[4*v];x>.45&&(armL++,dom!==iA&&!fit.bones[dom].name.startsWith('LeftHand')&&!fit.bones[dom].name.startsWith('LeftForeArm')&&armBad++);x<-.45&&fit.bones[dom].name.startsWith('Left')&&armBad++;}
ok(sumOk,'every vertex has weights that sum to 1');ok(armL>50&&armBad<armL*.05,'outer left-arm vertices follow the left forearm and hand ('+armBad+'/'+armL+' wrong)');
const R=t('autorig',()=>RIG.autoRig(src,{kind:'humanoid'})),bk=R.bk,walk=bk.actions.find(a=>a.name==='walk');
ok(['idle','walk','run','attack','cast','aim','hit','death'].every(a=>R.actions.includes(a)),'the humanoid clip library covers idle to death');
ok(walk&&walk.loop&&walk.tracks.every(tr=>tr.values.every(Number.isFinite)),'walk is a loop with finite keys');
const p0=RIG.pose(src,R.skin,bk,'walk',0),p1=RIG.pose(src,R.skin,bk,'walk',.55),lowL=v=>m.pos[3*v]>.05&&m.pos[3*v+2]<.2;let dy0=0,dy1=0,n0=0;for(let v=0;v<m.pos.length/3;v++)if(lowL(v)){dy0+=p0.pos[3*v+1]-m.pos[3*v+1];dy1+=p1.pos[3*v+1]-m.pos[3*v+1];n0++;}
ok(n0&&dy0/n0<-.05&&dy1/n0>.05,'the left foot swings forward then back during walk');
const ar=RIG.relaxOf(fit.bones).R[fit.bones.findIndex(b=>b.name==='LeftArm')];ok(ar[3]<.95,'T-pose arms are relaxed toward the body for the clips');
const quad=RIG.fitQuadruped(SDF.mesh(SDF.compile(`units m
body capsule 0,-.6,1 0,.6,1 r.25
neck capsule 0,-.6,1.1 0,-.9,1.5 r.1
legFL capsule .15,-.5,.9 .15,-.5,0 r.06
legFR capsule -.15,-.5,.9 -.15,-.5,0 r.06
legBL capsule .15,.5,.9 .15,.5,0 r.06
legBR capsule -.15,.5,.9 -.15,.5,0 r.06`),100).pos);ok(quad.bones.length===19&&quad.bones.find(b=>b.name==='FootFL').head[1]<0,'the quadruped skeleton finds four legs with the front at -Y');
const r=await ta('asset',()=>ART.asset({...src,pos:Float32Array.from(src.pos),nrm:Float32Array.from(src.nrm)},{kind:'humanoid',name:'hero',size:512,budgets:[3000,1200,400],samples:7})),g=glbJ(r.glb),J=g.J;
ok(g.ok,'the asset GLB is well formed');ok(r.report.tris<=3000&&r.report.lods.length===2&&r.report.lods[0].tris<=1200&&r.report.lods[1].tris<=400,'LOD0 to LOD2 meet their triangle budgets');
ok(J.images.length>=3&&J.materials[0].normalTexture&&J.materials[0].pbrMetallicRoughness.baseColorTexture&&J.materials[0].occlusionTexture,'the asset carries base color, normal and ORM textures');
ok(J.meshes[0].primitives[0].attributes.TANGENT!=null&&J.meshes[0].primitives[0].attributes.TEXCOORD_0!=null,'the asset has UVs and tangents for normal mapping');
ok(J.skins[0].joints.length===22&&J.animations.length>=8,'the asset is skinned with 22 joints and 8 clips');
const P=J.accessors[J.meshes[0].primitives[0].attributes.POSITION];ok(Math.abs(P.max[1]-P.min[1]-1.8)<.02,'humanoids are scaled to 1.8 m tall');
ok(r.report.bake.miss_pct<1,'the bake hits the source for nearly every texel ('+r.report.bake.miss_pct+'%)');
ok(r.lods.every(l=>glbJ(l.glb).ok&&glbJ(l.glb).J.skins),'every LOD is a skinned GLB');
const back=await ART.readGLB(r.glb);ok(back.textured&&back.idx.length/3===r.report.tris&&back.mats[0].base.w===512,'Amni-CAD reads its own textured GLB back');
const rv=await ta('review',()=>ART.review(r.glb,{size:96,views:[0,90]}));ok(ART.decodePNG(rv.png).w===192,'review renders a contact sheet');
const fr=RIG.pose(r.mesh,r.rig.skin,r.rig.bk,'attack',.28),img=Object.fromEntries(Object.entries(r.png).map(([k,v])=>[k,ART.decodePNG(v)])),A=ART.render(r.mesh,img,{size:64}),B=ART.render({...r.mesh,pos:fr.pos,nrm:fr.nrm},img,{size:64});let diff=0;for(let i=0;i<A.rgba.length;i++)diff+=Math.abs(A.rgba[i]-B.rgba[i]);ok(diff>1000,'posed renders differ from the rest pose');
const tri=(n,c)=>{const pos=[],idx=[],uv=[];for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){pos.push(i/n-.5,0,j/n);uv.push(i/n,j/n);}for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i;idx.push(a,a+1,a+n+2,a,a+n+2,a+n+1);}return{pos:Float32Array.from(pos),idx:Uint32Array.from(idx),uv:Float32Array.from(uv),nrm:Float32Array.from({length:pos.length},(_,i)=>i%3===1?-1:0)};},hi=tri(20),lo=tri(4),texd=new Uint8Array(8*8*4).map((_,i)=>i%4===3?255:i%4===0?((i>>2)%8<4?250:5):i%4===2?((i>>2)%8<4?5:250):5);
hi.mats=[{base:{data:texd,w:8,h:8},factor:[1,1,1,1],rough:.3,metal:1}];hi.tmat=new Uint16Array(hi.idx.length/3);const bb=bake({...lo,tan:tangents(lo.pos,lo.nrm,lo.uv,lo.idx)},hi,{size:16,maps:['color','mr'],T:bvh(hi.pos,hi.idx)}),C=bb.maps.color,MR=bb.maps.mr,at=(x,y)=>4*(y*16+x);
ok(C[at(2,8)]>200&&C[at(2,8)+2]<40&&C[at(13,8)+2]>200&&C[at(13,8)]<40,'color bakes sample the source texture');ok(Math.abs(MR[at(8,8)+1]-77)<7&&MR[at(8,8)+2]>245,'roughness and metal bake from the source material');
const z=await ta('headless',()=>H.art({glb:r.glb,kind:'prop',name:'crate',size:256,budgets:[800,300]}));ok(z.type==='application/zip'&&z.bytes.length>1000&&z.report.lods.length===1&&z.report.bones===0,'the headless API returns a zip with the asset, its LODs and a report');
let threw='';try{await H.art({glb:r.glb,kind:'dragon'});}catch(e){threw=e.message;}ok(/kind must be/.test(threw),'unknown kinds are refused');
const AP=`units m
torso capsule 0,0,.95 0,0,1.45 r.17
head sphere 0,0,1.62 r.11
armL capsule .2,0,1.42 .5,0,.95 r.05
armR capsule -.2,0,1.42 -.5,0,.95 r.05
legL capsule .1,0,.95 .12,0,.06 r.07
legR capsule -.1,0,.95 -.12,0,.06 r.07
sword capsule .17,0,.95 .3,0,.35 r.02`,am=SDF.mesh(SDF.compile(AP),150),af=RIG.fitHumanoid(am.pos),ab=n=>af.bones.find(b=>b.name===n);
ok(ab('LeftHand').head[0]>.35&&ab('LeftHand').tail[2]>.8,'A-pose hands are found at the arm tips, not at a sword hanging from the hip');
const red=ART.encodePNG(new Uint8Array(64*64*4).map((_,i)=>i%4===0||i%4===3?255:0),64,64),pr=await ART.asset({pos:Float32Array.from(am.pos),idx:am.idx,nrm:Float32Array.from(am.nrm),col:am.col},{kind:'humanoid',name:'proj',size:256,budgets:[2000],samples:7,project:red}),pb=ART.decodePNG(pr.png.base).data;let reds=0;for(let i=0;i<pb.length;i+=4)pb[i]>200&&pb[i+1]<60&&reds++;
ok(pr.report.project&&pr.report.project.texels>50&&reds>50,'concept projection paints the front of the head ('+reds+' texels)');
console.log('\nperformance',JSON.stringify(perf));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
