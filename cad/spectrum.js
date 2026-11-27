import {heliumSync} from './he/host.js';
import {bCenter} from './fea.js';
import {skinU} from './fea_skin.js';
const PF=await heliumSync('spectrum');let H=null;
const he=()=>H||(H=PF({}),H.ex.sp_init(),H),need=(c,m)=>{if(!c)throw new Error(m);};
export const DIRS=['X','Y','Z'],G0=9806.65;
export function specOf(s={}){const kind=s.kind||'asce7',dir=String(s.dir||'X').toUpperCase().replace(/^[+-]/,''),combine=String(s.combine||'cqc').toLowerCase(),num=(v,d)=>v==null||v===''?d:+v;
  need(['asce7','constant','table'].includes(kind),'spectrum.kind must be asce7, constant or table');need(DIRS.includes(dir),'spectrum.dir must be X, Y or Z');need(['cqc','srss'].includes(combine),'spectrum.combine must be cqc or srss');
  const o={kind,dir,combine,scale:num(s.scale,1),sds:num(s.sds,1),sd1:num(s.sd1,0.6),tl:num(s.tl,8),g:num(s.g,1),table:[]};need(o.scale>0,'spectrum.scale must be above 0');
  if(kind==='asce7')need(o.sds>0&&o.sd1>0&&o.tl>0,'ASCE 7 needs SDS, SD1 and TL above 0');if(kind==='constant')need(o.g>=0,'spectrum.g must be 0 or more');
  if(kind==='table'){const T=(typeof s.table==='string'?s.table.split(/\n/).map(l=>l.trim()).filter(l=>l&&!/^[a-z#]/i.test(l)).map(l=>l.split(/[\s,;\t]+/).map(Number)):(s.table||[]).map(p=>Array.isArray(p)?p.map(Number):[+p.f,+p.g])).sort((a,b)=>a[0]-b[0]);
    need(T.length>=2,'A spectrum table needs at least 2 rows of frequency (Hz) and acceleration (g)');need(T.every(([f,g])=>f>0&&g>=0&&isFinite(f)&&isFinite(g)),'Spectrum rows need a frequency above 0 Hz and an acceleration of 0 g or more');need(T.every((p,i)=>!i||p[0]>T[i-1][0]),'Spectrum frequencies must all differ');o.table=T;}
  return o;}
const load=(h,o)=>{const I=h.v(1);I.fill(0);I[0]=o.kind==='asce7'?1:o.kind==='constant'?2:0;I[1]=o.sds;I[2]=o.sd1;I[3]=o.tl;I[4]=o.g;I[5]=DIRS.indexOf(o.dir);I[7]=o.combine==='srss'?0:1;I[8]=G0;I[9]=o.scale;return I;};
export function curve(s,f0=0.1,f1=100,n=40){const o=specOf(s),h=he();h.ex.sp_size(1,1,o.table.length,0,0,0);h.v(6).set(o.table.map(t=>t[0]));h.v(7).set(o.table.map(t=>t[1]));const I=load(h,o);I[10]=f0;I[11]=f1;h.ex.sp_curve(n);const C=h.v(14);return Array.from({length:n},(_,i)=>({f:+C[2*i].toPrecision(5),g:+C[2*i+1].toPrecision(5)}));}
export async function spectrumRun(inp,P,prog,X){const o=specOf(inp.spectrum||{}),mat=inp.mat,{G,pos}=P,zeta=inp.zeta!=null?Math.max(1e-4,+inp.zeta):0.05;
  const R=await X.modal({...inp,keepVec:true,modes:Math.max(1,Math.min(inp.modes||12,20))},P,prog);need(!R.free,'Add a support: the response spectrum shakes the part through its supports');
  const M=R.modes.filter(m=>m.vec),nm=M.length,n3=3*P.nn;need(nm,'no elastic mode; add a support');need(R.Mv.length===n3,'mode shape size does not match the grid');
  const h=he(),t0=Date.now();h.ex.sp_size(nm,P.nn,o.table.length,G.nx,G.ny,G.nz);h.v(3).set(M.map(m=>m.omega));const PH=h.v(4);M.forEach((m,j)=>PH.set(m.vec,j*n3));h.v(5).set(R.Mv);h.v(6).set(o.table.map(t=>t[0]));h.v(7).set(o.table.map(t=>t[1]));h.v(20).set(G.solid);
  const D=h.v(9),k=mat.E/G.h;bCenter(mat.nu).forEach((r,i)=>{for(let c=0;c<24;c++)D[24*i+c]=r[c]*k;});const I=load(h,o);I[6]=zeta;h.ex.sp_run();
  const O=Array.from(h.v(2)),MT=h.v(8),U=Float32Array.from(h.v(10)),fU=Float32Array.from(h.v(11)),fVm=Float32Array.from(h.v(12)),cnt=R.cnt,act=fVm.filter((_,i)=>cnt[i]).sort();
  const vDisp=X.atVerts(G,R.L,U,3,pos,cnt),vStress=X.atVerts(G,R.L,fVm,1,pos,cnt);X.dilate(G,cnt,[fVm,fU]);const wire=R.wire;wire.u=skinU(wire,U);wire.vm=Float32Array.from(wire.nodes,q=>fVm[q]);
  const rows=M.map((_,j)=>({f:MT[8*j],gamma:MT[8*j+1],frac:MT[8*j+2],cum:MT[8*j+3],sa:MT[8*j+4],disp:MT[8*j+5],force:MT[8*j+6]})),fs=rows.map(r=>r.f).filter(f=>f>0),f0=Math.min(0.1,...fs.map(f=>f/3)),f1=Math.max(100,...fs.map(f=>f*3));
  const warn=[O[3]<0.9?'The '+nm+' modes carry '+(O[3]*100).toFixed(0)+'% of the mass along '+o.dir+'; ASCE 7 asks for at least 90%. Raise the number of modes.':'',o.kind==='table'&&(fs.some(f=>f<o.table[0][0]||f>o.table[o.table.length-1][0]))?'Some modes fall outside the spectrum table; the end values were held flat.':''].filter(Boolean);
  return{...X.gridOut(P),type:'spectrum',vStress,vDisp,field:X.fieldOut(P,{vm:fVm,u:fU}),wire,vmMax:O[1],vmP99:act[Math.floor(act.length*0.995)]||O[1],vmElem:O[4],uMax:O[0],baseShear:O[2],massFrac:O[3],massDir:O[5]*1000,modes:rows,freqs:fs,dir:o.dir,combine:o.combine,zeta,spectrum:o,curve:curve(o,f0,f1),nDof:R.nDof,iters:R.iters,ms:R.ms+Date.now()-t0,backend:R.backend,gpuError:R.gpuError,warnings:warn};}
