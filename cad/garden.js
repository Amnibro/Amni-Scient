import {GEO,chaoGLB} from './creature.js';
const {G0,fin,sph,loft,tubeG,card,bez,vnorm,sub,add,mul,len,nrm,crs,dot,lerp}=GEO,TAU=2*Math.PI,Y=(x,y,z)=>[x,z,-y];
export const SW=[['leaf',[74,170,60]],['leaf_dark',[44,120,46]],['leaf_light',[130,204,82]],['moss',[96,164,64]],['trunk',[170,114,66]],['trunk_dark',[122,80,46]],['wood',[218,154,74]],['wood_dark',[164,102,50]],
 ['straw',[234,184,92]],['straw_dark',[196,142,62]],['cream',[250,238,210]],['marble',[242,240,234]],['gold',[238,188,66]],['gold_dark',[192,142,42]],['stone',[152,152,158]],['stone_light',[192,192,198]],
 ['stone_dark',[112,112,120]],['tan',[208,182,142]],['soil',[122,82,52]],['red',[222,56,48]],['yellow',[250,206,60]],['orange',[246,140,40]],['purple',[150,84,196]],['pink',[248,128,168]],
 ['blue',[70,112,224]],['teal',[52,190,178]],['green',[120,200,80]],['white',[255,251,246]],['berry_blue',[64,92,214]],['berry_red',[218,42,58]],['portal_blue',[84,124,244]],['portal_violet',[152,92,232]],
 ['cyan',[96,232,242]],['peach',[255,190,170]],['gold_pale',[255,232,140]],['dark_purple',[90,36,92]],['brown',[150,96,60]],['sky',[150,206,250]],['black',[38,34,40]],['grey_blue',[120,140,170]]];
const SI=Object.fromEntries(SW.map(([k],i)=>[k,i])),U=k=>[((SI[k]%8)+.5)/8,((SI[k]>>3)+.5)/8];
export function gardenPalette(){const w=64,d=new Uint8Array(w*w*4);for(let y=0;y<w;y++)for(let x=0;x<w;x++){const k=(y>>3)*8+(x>>3);d.set([...(SW[k]?SW[k][1]:[255,0,255]),255],4*(y*w+x));}return{w,h:w,data:d};}
const H=(x,y,z)=>{const s=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;return s-Math.floor(s);},bump=(d,f=9)=>Math.sin(f*d[0])*Math.sin(f*d[1]+1)*Math.sin(f*d[2]+2);
const R3=(lv,a)=>a[lv];
const blob=(g,c,r,lv,uv,k=.1,f=9,sq=[1,1,1])=>sph(g,R3(lv,[3,4,6]),R3(lv,[6,8,10]),180,d=>add(c,[d[0]*r*sq[0]*(1+k*bump(d,f)),d[1]*r*sq[1]*(1+k*bump(d,f)),d[2]*r*sq[2]*(1+k*bump(d,f))]),()=>U(uv));
const rbox=(g,c,s,lv,uv,e=.35,res=[[2,4],[3,6],[4,8]])=>sph(g,res[lv][0],res[lv][1],180,d=>add(c,d.map((v,i)=>Math.sign(v)*Math.abs(v)**e*s[i])),()=>U(uv));
const tube=(g,C,r,S,uv)=>tubeG(g,C,r,S,U(uv));
const leaf=(g,b,dir,N,ln,w,lv,uv='leaf')=>{const K=R3(lv,[2,3,4]),tip=add(b,mul(dir,ln));card(g,bez(b,add(lerp(b,tip,.5),mul(N,ln*.18)),tip,K),N,[...Array(K+1)].map((_,k)=>k===K?0:w*Math.sin(Math.PI*(.12+.88*k/K))**.7),.004,()=>U(uv),R3(lv,[3,3,4]));};
const M=(name,g,x={})=>{const m=fin(g);return{name,slot:name,...m,nrm:vnorm(m.pos,m.idx),x};};
const TREE=[{h:.35,tr:.025,cr:.12,fruit:0},{h:.8,tr:.055,cr:.22,fruit:0},{h:1.3,tr:.1,cr:.7,ring:5,fruit:3},{h:1.8,tr:.14,cr:.85,ring:7,fruit:7}];
export function tree(stage,lv){const g=G0(),T=TREE[stage],sock=[];
  if(stage===0){blob(g,[0,0,0],.09,lv,'soil',.08,11,[1,1,.35]);const st=[[0,0,0],[.01,0,.12],[0,0,.22]];tube(g,st,[.016,.013,.011],R3(lv,[3,4,6]),'leaf_light');for(const s of[1,-1])leaf(g,st[2],nrm([s,0,.55]),[0,1,0],.15,.07,R3(lv,[1,2,2]),'leaf_light');return{g,sock};}
  const th=stage===1?T.h:T.h*.62,n=R3(lv,[4,6,9]),C=[...Array(n+1)].map((_,i)=>{const t=i/n;return[.08*th*Math.sin(t*3),0,t*th];});tube(g,C,C.map((_,i)=>T.tr*(1-.4*i/n)*(1+1.1*Math.max(0,1-i/n*4)**2)),R3(lv,[4,6,8]),'trunk');
  const top=C[n];
  if(stage===1){for(let i=0;i<3;i++){const a=i*TAU/3+.4,c=add(top,[Math.cos(a)*T.cr*.8,Math.sin(a)*T.cr*.8,T.cr*.55]);tube(g,[top,lerp(top,c,.6)],[T.tr*.6,T.tr*.4],R3(lv,[3,4,5]),'trunk');blob(g,c,T.cr,lv,'leaf_light',.03,5);}return{g,sock};}
  const cc=add(top,[0,0,T.cr*.5]),N=lv===0?Math.max(3,T.ring-3):T.ring;blob(g,cc,T.cr*.78,lv,'leaf',.05,9);blob(g,add(cc,[0,0,T.cr*.45]),T.cr*.55,lv,'leaf_light',.06,11);
  for(let i=0;i<N;i++){const a=i*TAU/N+.3,z=(i%2?.12:-.18)*T.cr,c=add(cc,[Math.cos(a)*T.cr*.62,Math.sin(a)*T.cr*.62,z]),r=T.cr*(.5+.06*(i%3));blob(g,c,r,lv,i%2?'leaf_light':'leaf',.07,11);
    if(sock.length<T.fruit){const o=nrm([Math.cos(a),Math.sin(a),-.45]);sock.push(add(c,mul(o,r*1.02)));}}
  for(const a of[0,2.1,4.2])leaf(g,[Math.cos(a)*T.tr*1.7,Math.sin(a)*T.tr*1.7,0],nrm([Math.cos(a),Math.sin(a),1.2]),[-Math.sin(a),Math.cos(a),0],.14,.04,lv,'leaf');
  return{g,sock};}
export function nest(lv){const g=G0(),R=.2,N=R3(lv,[10,20,34]),pt=(a,dn,dz)=>[Math.cos(a)*(R+dn),Math.sin(a)*(R+dn),.075+dz];
  sph(g,R3(lv,[2,3,4]),R3(lv,[6,10,14]),100,d=>[d[0]*R*1.05,d[1]*R*1.05,.075-d[2]*.07],()=>U('straw_dark'));
  if(lv===0)tube(g,[...Array(N+1)].map((_,i)=>pt(i*TAU/N,0,0)),.05,4,'straw');else{const k=lv===1?5:8;for(const ph of[0,Math.PI])tube(g,[...Array(N+1)].map((_,i)=>{const a=i*TAU/N,t=k*a+ph;return pt(a,.026*Math.cos(t),.026*Math.sin(t));}),.032,R3(lv,[3,3,5]),ph?'straw_dark':'straw');}
  sph(g,R3(lv,[2,3,4]),R3(lv,[6,10,14]),180,d=>[d[0]*.17,d[1]*.17,.06+d[2]*.045*(1+.08*Math.cos(6*Math.atan2(d[1],d[0])))],()=>U('cream'));return{g};}
export function trough(lv){const g=G0(),hi=lv>0;for(const sy of[1,-1]){if(hi&&lv===2){rbox(g,[0,sy*.17,.12],[.5,.04,.045],lv,'wood');rbox(g,[0,sy*.17,.21],[.5,.04,.045],lv,'wood');}else rbox(g,[0,sy*.17,.165],[.5,.04,.09],lv,'wood');}
  for(const sx of[1,-1])rbox(g,[sx*.47,0,.165],[.045,.2,.095],lv,'wood_dark');rbox(g,[0,0,.08],[.45,.15,.035],lv,'wood_dark');
  if(lv>0)for(const sx of[1,-1])for(const sy of[1,-1])rbox(g,[sx*.38,sy*.12,.03],[.05,.05,.035],lv,'wood_dark',.4,[[2,4],[2,4],[3,6]]);return{g};}
export function gate(lv){const g=G0(),p=G0(),A=.95,Ra=.55,S=R3(lv,[4,5,6]),n=R3(lv,[6,8,14]);
  rbox(g,[0,0,.04],[.78,.3,.04],lv,'marble');for(const sx of[1,-1]){rbox(g,[sx*Ra,0,.48],[.11,.13,.46],lv,'marble',.3);rbox(g,[sx*Ra,0,.95],[.14,.16,.05],lv,'gold');}
  tube(g,[...Array(n+1)].map((_,i)=>{const a=Math.PI*i/n;return[Math.cos(a)*Ra,0,A+Math.sin(a)*Ra];}),.1,S,'marble');
  tube(g,[...Array(n+1)].map((_,i)=>{const a=Math.PI*i/n;return[Math.cos(a)*(Ra-.1),-.1,A+Math.sin(a)*(Ra-.1)];}),.022,R3(lv,[3,3,4]),'gold');
  const gem=[0,-.06,A+Ra+.09];sph(g,2,4,180,d=>add(gem,[d[0]*.08,d[1]*.05,d[2]*.11]),()=>U('cyan'));rbox(g,add(gem,[0,.02,-.07]),[.06,.05,.03],lv,'gold');
  if(lv>0)for(const sx of[1,-1])for(let i=0;i<R3(lv,[0,1,3]);i++){const z=.35+i*.28,b=[sx*(Ra+.1),-.12,z];leaf(g,b,nrm([sx,-.3,.6]),[0,1,0],.1,.04,lv);sph(g,2,R3(lv,[4,5,6]),180,d=>add(add(b,[sx*.02,-.03,.06]),mul(d,.028)),()=>U(i%2?'pink':'white'));}
  const RR=Ra-.1,cz=A,bot=.08,Kr=R3(lv,[2,3,5]),Na=R3(lv,[8,14,20]),Rb=a=>Math.sin(a)>=0?RR:Math.min(RR/Math.max(1e-6,Math.abs(Math.cos(a))),(cz-bot)/Math.max(1e-6,-Math.sin(a))),uv2=[];
  p.p.push(0,0,cz);p.t.push(.5,.5-(0)/(2*RR));uv2.push(0,0);const id=(k,j)=>1+(k-1)*Na+(j%Na);
  for(let k=1;k<=Kr;k++)for(let j=0;j<Na;j++){const a=j*TAU/Na,r=Rb(a)*k/Kr,q=[Math.cos(a)*r,0,cz+Math.sin(a)*r];p.p.push(...q);p.t.push(.5+q[0]/(2*RR),1-(q[2]-bot)/(cz+RR-bot));uv2.push(j/Na,k/Kr);}
  p.t[0]=.5;p.t[1]=1-(cz-bot)/(cz+RR-bot);for(let j=0;j<Na;j++)p.i.push(0,id(1,j+1),id(1,j));for(let k=1;k<Kr;k++)for(let j=0;j<Na;j++)p.i.push(id(k,j),id(k,j+1),id(k+1,j+1),id(k,j),id(k+1,j+1),id(k+1,j));
  return{g,portal:p,uv2:Float32Array.from(uv2)};}
const stem=(g,top,lv,lean=.2)=>{const b=sub(top,[0,0,.006]),t=add(top,[lean*.03,0,.028]);tube(g,[b,t],[.006,.004],R3(lv,[3,4,5]),'trunk_dark');leaf(g,lerp(b,t,.6),nrm([1,.3,.5]),[0,1,0],.05,.022,lv,'leaf');};
const heart=d=>{const x=d[0]*1.18,z=d[2],t=z<0?1+z*.8:1;return[x*t,d[1]*.72*t,z-.32*Math.exp(-((x/.28)**2))*Math.max(0,z)+(z<0?z*.15:0)];};
const FR={round:['orange',d=>mul(d,1+.04*Math.cos(5*Math.atan2(d[1],d[0]))*(1-d[2]*d[2]))],triangle:['teal',d=>{const a=Math.atan2(d[1],d[0]),k=1+.28*Math.cos(3*a)*(1-d[2]*d[2]);return[d[0]*k,d[1]*k,d[2]*.9];}],square:['purple',d=>d.map(v=>Math.sign(v)*Math.abs(v)**.45*.88)],
 hero:['gold_pale',d=>mul(d,1+.07*Math.cos(6*Math.atan2(d[1],d[0]))*(1-d[2]*d[2]))],dark:['dark_purple',d=>mul(d,1+.35*Math.max(0,Math.max(...[[0,0,1],[.94,0,-.33],[-.47,.82,-.33],[-.47,-.82,-.33]].map(a=>dot(d,a))))**12)],strong:['red',d=>mul(d,1+.1*Math.max(0,bump(d,7)))],
 tasty:['pink',heart],heart:['red',heart],elder:['cream',d=>mul(d,1+.06*Math.cos(8*Math.atan2(d[1],d[0]))*(1-d[2]*d[2]))],gentle:['peach',d=>{const k=1-.08*Math.exp(-((d[0]/.15)**2))*(d[1]<0?1:.3);return[d[0]*k,d[1]*k,d[2]*1.05];}]};
const MUSH={stamina:['brown','cream'],brain:['grey_blue','cream'],clover:['green','cream']};
export function fruit(id,lv,r=.07){const g=G0();if(id.startsWith('mushroom_')){const [cap,st]=MUSH[id.slice(9)];tube(g,[[0,0,-r],[0,0,-r*.2],[0,0,r*.1]],[r*.32,r*.36,r*.3],R3(lv,[4,5,8]),st);sph(g,R3(lv,[2,4,5]),R3(lv,[6,8,12]),95,d=>[d[0]*r*1.05*(1+(id==='mushroom_brain'?.08*bump(d,13):0)),d[1]*r*1.05*(1+(id==='mushroom_brain'?.08*bump(d,13):0)),r*.05+d[2]*r*.7],()=>U(cap));
   if(lv>0&&id!=='mushroom_brain')for(let i=0;i<R3(lv,[0,3,5]);i++){const a=i*2.4,q=nrm([Math.cos(a)*.6,Math.sin(a)*.6,.7]);sph(g,2,5,180,d=>add([q[0]*r*1.05,q[1]*r*1.05,r*.05+q[2]*r*.7],mul(d,r*.14)),()=>U(id==='mushroom_clover'?'white':'cream'));}return{g};}
  const k=id.replace('fruit_',''),[col,f]=FR[k];sph(g,R3(lv,[3,5,8]),R3(lv,[6,9,16]),180,d=>mul(f(d),r),()=>U(col));stem(g,[0,0,r*(k==='heart'||k==='tasty'?.7:k==='square'?.9:1)],lv);return{g};}
export const FRUITS=['fruit_round','fruit_triangle','fruit_square','fruit_hero','fruit_dark','fruit_strong','fruit_tasty','fruit_heart','fruit_elder','fruit_gentle','mushroom_stamina','mushroom_brain','mushroom_clover'];
const LV=[2,1,0],MAT={garden:{name:'garden_palette',tex:'garden',rough:.45},portal:{name:'gate_portal',tex:'garden',rough:.3,emit:[.45,.5,1],es:1.5,double:true}},TX=()=>({garden:gardenPalette()});
const glb=(name,lods,ex={},matOf=()=>"garden")=>chaoGLB({lods:lods.map(L=>({rings:{},...L}))},{name,flat:true,morphs:[],merged:false,mats:MAT,matOf,tex:TX(),extras:{kind:'garden_prop',units:'meters, Y-up, pivot at base center',...ex}});
export function gardenGLBs(){const out={},ys=s=>s.map(q=>Y(...q).map(v=>+v.toFixed(4)));
  out.trees=glb('tree',LV.map(lv=>({lv,meshes:['sprout','sapling','young','full'].map((n,s)=>{const t=tree(s,lv);return M(`tree_${n}`,t.g,{fruit_sockets:ys(t.sock),stage:s});})})),{stages:['tree_sprout','tree_sapling','tree_young','tree_full']});
  out.nest=glb('nest',LV.map(lv=>({lv,meshes:[M('nest',nest(lv).g)]})));out.trough=glb('trough',LV.map(lv=>({lv,meshes:[M('trough',trough(lv).g)]})));
  out.gate=glb('gate',LV.map(lv=>{const q=gate(lv),pm=M('gate_portal',q.portal,{uv:'TEXCOORD_0 planar 0..1 over the opening (center of rotation 0.5,0.5 of the round top), TEXCOORD_1 polar (u=angle/2pi, v=radius 0..1 from the arch center) for swirl scroll'});pm.uv2=q.uv2;return{lv,meshes:[M('gate',q.g),pm]};}),{portal:'separate mesh gate_portal on material gate_portal; arch static'},n=>n==='gate_portal'?'portal':'garden');
  out.fruits=glb('fruit',LV.map(lv=>({lv,meshes:FRUITS.map(id=>M(id,fruit(id,lv).g,{pivot:'center',hand_held:true}))})),{pivot:'fruit center (sockets are fruit centers)'});
  return out;}
