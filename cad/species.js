import {helium} from './he/host.js';
const SP=helium('species'),r=(v,n=7)=>+(+v).toPrecision(n),pick=(a,i)=>(a||[]).filter(b=>(b.sp|0)===i),sum=a=>a.reduce((s,x)=>s+x,0);
export const spList=s=>{const L=((s||{}).list||[]).slice(0,7);return L.length?L:[{name:'A',D:1e-9}];};
export async function speciesRun(inp,P,prog,thermal){
  const sp=inp.species||{},L=spList(sp),phi=sp.phi!=null?+sp.phi:1,nn=P.nn,tr=!!(inp.transient||(inp.steps|0)>1),steps=tr?Math.max(1,inp.steps|0||20):1,dt=+inp.dt||1,t0=Date.now();
  if(!(phi>0&&phi<=1))throw new Error('porosity must be above 0 and at most 1');
  const nm=L.map((s,i)=>s.name||String.fromCharCode(65+i)),par=L.map((s,i)=>{const f=s.from,j=f==null||f===''?-1:typeof f==='number'?f:nm.indexOf(f);if(j>=i||(f!=null&&f!==''&&j<0))throw new Error('species '+nm[i]+' can only form from a species listed above it');return j;});
  L.forEach((s,i)=>{if(!(+s.D>0))throw new Error('species '+nm[i]+' needs a diffusivity D above 0 m²/s');if(!tr&&!pick(inp.conc,i).length&&!pick(inp.mtrans,i).length&&!(+s.k>0))throw new Error('species '+nm[i]+' has no fixed-concentration or mass-transfer face and does not decay, so it has no steady level; add one or run it over time');pick(inp.mtrans,i).forEach(b=>{if(!(+b.km>0))throw new Error('a mass-transfer face of species '+nm[i]+' needs a coefficient above 0 m/s');});});
  const H=await SP({}),x=H.ex;x.sp_init();x.sp_size(nn);H.put(3,P.vol);const zero=new Float64Array(nn),F=L.map(()=>null),need=L.map((_,i)=>par.includes(i)),out=[],views=[];let first=null;
  const setIn=(i,s)=>{const j=par[i];H.put(1,[(+s.k||0)*phi,(+s.R||0)*phi,j>=0?(+L[j].k||0)*(s.y!=null?+s.y:1)*phi:0]);},stats=c=>{H.put(4,c);x.sp_stats();return H.get(2);};
  for(let i=0;i<L.length;i++){
    const s=L[i],j=par[i],hist=[],pf=j<0?null:F[j];if(need[i]&&tr)F[i]=[];let prev=null,last=null;
    const res=await thermal({mat:{k:+s.D*1e9,rho:phi*1e9,cp:1},matKey:'species',temps:pick(inp.conc,i).map(b=>({faces:b.faces,T:+b.c||0})),conv:pick(inp.mtrans,i).map(b=>({faces:b.faces,h:+b.km*1e9,Tinf:+b.cinf||0})),flux:pick(inp.mflux,i).map(b=>({faces:b.faces,Q:(+b.N||0)*1e9})),rad:[],transient:tr,steps,dt,T0:+s.c0||0,tol:inp.tol,mg:inp.mg,keepT:true,
      terms:st=>{setIn(i,s);H.put(5,pf?(tr?pf[st]:pf):zero);x.sp_terms();return{d:H.v(7),q:H.v(8)};},
      onStep:(st,T)=>{need[i]&&tr&&(F[i][st]=Float32Array.from(T));prev=last;last=Float64Array.from(T);setIn(i,s);const o=stats(T);hist.push({t:tr?(st+1)*dt:0,min:r(o[1]),max:r(o[2]),mean:r(o[4]),mol:r(o[3]*phi)});}},P,prog);
    need[i]&&!tr&&(F[i]=res.T);setIn(i,s);H.put(5,pf?(tr?pf[steps-1]:pf):zero);x.sp_terms();const src=H.v(2)[0]*1e-9,o=stats(res.T),amt=o[3]*phi;
    const amt0=prev?stats(prev)[3]*phi:(+s.c0||0)*o[5]*1e-9*phi,store=tr?(amt-amt0)/dt:0,q=res.Q,fx=q.fixed.map(v=>v*1e-9),cv=q.conv.map(v=>v*1e-9),fl=q.flux.map(v=>v*1e-9),dec=o[7];
    out.push({name:nm[i],D:+s.D,k:+s.k||0,from:j<0?null:nm[j],c_min:r(o[1]),c_max:r(o[2]),c_mean:r(o[4]),amount_mol:r(amt),fixed_mol_s:fx.map(v=>r(v)),transfer_mol_s:cv.map(v=>r(v)),flux_mol_s:fl.map(v=>r(v)),source_mol_s:r(src),decay_mol_s:r(dec),storage_mol_s:r(store),balance_mol_s:r(sum(fx)+sum(cv)+sum(fl)+src-dec-store,4),hist,iters:res.iters,ms:res.ms});
    views.push({vT:res.vT,field:res.field,wireVm:res.wire.vm,Tmin:res.Tmin,Tmax:res.Tmax});if(!i)first=res;
  }
  const{T,vol,Q,balance,k,hist,...rest}=first;return{...rest,type:'species',legendUnit:'raw',transient:tr,steps,dt,phi,species:out,views,hist:out[0].hist,ms:Date.now()-t0};
}
