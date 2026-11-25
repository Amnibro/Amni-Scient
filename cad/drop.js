import {heliumSync} from './he/host.js';
import {keHex,bCenter} from './fea.js';
import {voxSkin,skinU} from './fea_skin.js';
const PF=await heliumSync('drop');let H=null;
const he=()=>H||(H=PF({}),H.ex.dr_init(),H),need=(c,m)=>{if(!c)throw new Error(m);},NH=4000,SMAX=40000;
export const G0=9806.65,FACES={'-Z':[0,0,-1],'+Z':[0,0,1],'-X':[-1,0,0],'+X':[1,0,0],'-Y':[0,-1,0],'+Y':[0,1,0]};
export function dropOf(s={}){const d=s.dir==null?'-Z':s.dir,v=Array.isArray(d)?d.map(Number):FACES[String(d).toUpperCase()];need(v&&v.length===3&&v.every(Number.isFinite)&&Math.hypot(...v)>0,'drop.dir must be -Z, +Z, -X, +X, -Y, +Y or a direction [x, y, z]');
  const n=Math.hypot(...v),sp=s.speed!=null&&s.speed!=='',height=sp?(+s.speed)**2*1e6/(2*G0):s.height==null||s.height===''?1000:+s.height,speed=sp?+s.speed:Math.sqrt(2*G0*height)/1000;
  need(speed>0&&isFinite(speed),'drop.height (mm) or drop.speed (m/s) must be above 0');need(s.duration==null||s.duration===''||+s.duration>0,'drop.duration must be above 0 seconds');
  return{dir:v.map(x=>x/n),label:Array.isArray(d)?v.map(x=>+(x/n).toFixed(3)).join(', '):String(d).toUpperCase(),height,speed,duration:s.duration==null||s.duration===''?null:+s.duration,gravity:s.gravity!==false};}
export async function dropRun(inp,P,prog,X){const o=dropOf(inp.drop||{}),mat=inp.mat,{G,pos}=P,nn=P.nn,rho=(mat.rho||7850)*1e-12,h=he(),t0=Date.now(),c=Math.sqrt(mat.E/rho);
  h.ex.dr_size(nn,G.nx,G.ny,G.nz,NH);const K=keHex(mat.nu),Eh=mat.E*G.h,KE=h.v(3);for(let i=0;i<576;i++)KE[i]=K[i]*Eh;const D=h.v(4),k=mat.E/G.h;bCenter(mat.nu).forEach((r,i)=>{for(let j=0;j<24;j++)D[24*i+j]=r[j]*k;});
  const M=h.v(5),XV=h.v(6),cnt=new Uint8Array(nn);let lo=[1e30,1e30,1e30],hi=[-1e30,-1e30,-1e30];for(let q=0;q<nn;q++){M[q]=P.vol[q]*rho;const p=P.xyz(q);XV.set(p,3*q);if(M[q]>0){cnt[q]=1;for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],p[a]);hi[a]=Math.max(hi[a],p[a]);}}}h.v(20).set(G.solid);
  const L=Math.max(...hi.map((v,a)=>v-lo[a])),I=h.v(1);I.fill(0);o.dir.forEach((v,a)=>I[a]=v);I[3]=o.speed*1000;I[4]=o.gravity?G0:0;I[5]=Eh;I[6]=0.9;I[8]=2*L/c;h.ex.dr_start();
  const dt=h.v(2)[0],want=o.duration||40*L/c,tmax=Math.min(want,SMAX*dt);I[7]=tmax;I[9]=Math.max(1,Math.ceil(tmax/dt/NH));h.ex.dr_start();
  let done=0,i=0;while(!done){done=h.ex.dr_step(50);const O=h.v(2);prog&&prog(O[1]|0,O[2],'explicit');if(++i%4===0)await new Promise(r=>setTimeout(r,0));}h.ex.dr_finish();
  const O=Array.from(h.v(2)),VN=Float32Array.from(h.v(10)),UD=Float32Array.from(h.v(11)),UP=Float32Array.from(h.v(13)),HI=Array.from(h.v(12).subarray(0,7*(O[15]|0))),LV={NX:G.nx+1,NY:G.ny+1},act=Float32Array.from(VN.filter((_,q)=>cnt[q])).sort();
  const vStress=X.atVerts(G,LV,VN,1,pos,cnt),vDisp=X.atVerts(G,LV,UP,3,pos,cnt);X.dilate(G,cnt,[VN,UD]);const wire=voxSkin(G.nx,G.ny,G.nz,G.solid,P.xyz);wire.u=skinU(wire,UP);wire.vm=Float32Array.from(wire.nodes,q=>VN[q]);
  const mt=O[11],hist=Array.from({length:HI.length/7},(_,r)=>({t:HI[7*r],F:HI[7*r+1],v:HI[7*r+2]/1000,ke:HI[7*r+3]/1000,se:HI[7*r+4]/1000,ce:HI[7*r+5]/1000,pen:HI[7*r+6]})),vmP99=act[Math.floor(act.length*0.995)]||O[9],still=O[6]>=O[2]-1.5*dt;
  const warn=[still?'The part was still touching the floor when the run stopped'+(o.duration?'; raise drop.duration.':' at the '+SMAX.toLocaleString()+' step limit; coarsen the mesh or set drop.duration.'):'',O[12]>0.07?'Energy drifted '+(O[12]*100).toFixed(0)+'% during the run; refine the mesh for a steadier answer.':'',mat.sy&&vmP99>mat.sy?'The peak stress passes yield, so the part would dent. This run keeps the material elastic, so stresses past yield are overstated.':''].filter(Boolean);
  return{...X.gridOut(P),type:'drop',vStress,vDisp,field:X.fieldOut(P,{vm:VN,u:UD}),wire,vmMax:O[9],vmP99,vmElem:O[8],uMax:O[10],peakForce:O[3],tPeak:O[4],tFirst:O[5],tLast:O[6],contactTime:O[6]-O[5]+dt,gPeak:mt>0?O[3]/(mt*G0):0,gMean:(o.speed-O[7]/1000)/(O[6]-O[5]+dt)/9.80665,vIn:o.speed,vOut:-O[7]/1000,restitution:-O[7]/1000/o.speed,energyErr:O[12],penetration:O[14],dt,steps:O[1]|0,tEnd:O[2],mass:mt*1000,hist,drop:o,nDof:3*nn,ms:Date.now()-t0,backend:'cpu',warnings:warn};}
