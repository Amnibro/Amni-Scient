const npts=2001;
function solve(L,E,I,supports,loads){
  supports=supports.slice().sort((a,b)=>a.x-b.x);
  const fixedCount=supports.filter(s=>s.type==='fixed').length;
  const xs=Array.from({length:npts},(_,i)=>i*L/(npts-1));
  let reactions={};
  if(fixedCount>=1){
    const f=supports.find(s=>s.type==='fixed');
    let RF=0,MF=0;
    loads.forEach(ld=>{
      if(ld.type==='point'){RF+=ld.mag;MF+=ld.mag*(ld.x-f.x);}
      else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);const Rload=w*(b-a);RF+=Rload;MF+=Rload*((a+b)/2-f.x);}
      else if(ld.type==='moment'){MF+=ld.mag;}
    });
    reactions[f.x]={V:-RF,M:-MF,type:'fixed'};
  }else if(supports.length>=2){
    const A=supports[0],B=supports[supports.length-1];
    let MA=0,Ftot=0;
    loads.forEach(ld=>{
      if(ld.type==='point'){Ftot+=ld.mag;MA+=ld.mag*(ld.x-A.x);}
      else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);const Rload=w*(b-a);Ftot+=Rload;MA+=Rload*((a+b)/2-A.x);}
      else if(ld.type==='moment'){MA+=ld.mag;}
    });
    const RB=-MA/(B.x-A.x);
    const RA=-Ftot-RB;
    reactions[A.x]={V:RA,M:0,type:A.type};
    reactions[B.x]={V:RB,M:0,type:B.type};
  }
  function shearAt(x){
    let V=0;
    for(const sx in reactions){if(parseFloat(sx)<=x+1e-6)V+=reactions[sx].V;}
    loads.forEach(ld=>{
      if(ld.type==='point'){if(ld.x<=x+1e-6)V+=ld.mag;}
      else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);if(x>=a){const upTo=Math.min(x,b);V+=w*(upTo-a);}}
    });
    return V;
  }
  function momentAt(x){
    let M=0;
    for(const sx in reactions){const sxn=parseFloat(sx);if(sxn<=x+1e-6){M+=reactions[sx].V*(x-sxn);if(reactions[sx].type==='fixed')M+=FIXSIGN*reactions[sx].M;}}
    loads.forEach(ld=>{
      if(ld.type==='point'){if(ld.x<=x+1e-6)M+=ld.mag*(x-ld.x);}
      else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);if(x>=a){const upTo=Math.min(x,b);const dx=upTo-a;M+=w*dx*(x-(a+upTo)/2);}}
      else if(ld.type==='moment'){if(ld.x<=x+1e-6)M+=ld.mag;}
    });
    return M;
  }
  const Vs=xs.map(shearAt),Ms=xs.map(momentAt);
  const EI=E*I,slope=new Array(npts).fill(0),defl=new Array(npts).fill(0),dx=L/(npts-1);
  for(let i=1;i<npts;i++)slope[i]=slope[i-1]+(Ms[i-1]+Ms[i])/2/EI*dx;
  for(let i=1;i<npts;i++)defl[i]=defl[i-1]+(slope[i-1]+slope[i])/2*dx;
  const supXs=Object.keys(reactions).map(parseFloat);
  if(supXs.length>=2&&fixedCount===0){
    const xA=supXs[0],xB=supXs[supXs.length-1];
    const iA=Math.round(xA/L*(npts-1)),iB=Math.round(xB/L*(npts-1));
    const dA=defl[iA],dB=defl[iB],slopeCorr=(dB-dA)/(xB-xA);
    for(let i=0;i<npts;i++)defl[i]-=dA+slopeCorr*(xs[i]-xA);
  }else if(fixedCount>=1){
    const f=supports.find(s=>s.type==='fixed');
    const iF=Math.round(f.x/L*(npts-1)),dF=defl[iF],sF=slope[iF];
    for(let i=0;i<npts;i++){defl[i]-=dF+sF*(xs[i]-f.x);slope[i]-=sF;}
  }
  const absmax=a=>a.reduce((p,c)=>Math.abs(c)>Math.abs(p)?c:p,0);
  return{Vmax:absmax(Vs),Mmax:absmax(Ms),dmax:absmax(defl),Mfree:Ms[npts-1],M0:Ms[0]};
}
let FIXSIGN=+1;
const L=3000,E=200000,I=8.356e7,P=10000,EI=E*I;
console.log('=== FIXSIGN=+1 (current code) ===');
let r=solve(L,E,I,[{type:'pin',x:0},{type:'roller',x:L}],[{type:'point',x:L/2,mag:P}]);
console.log('SS center load: Mmax=',r.Mmax.toFixed(0),'expect±',(P*L/4).toFixed(0),'| dmax=',r.dmax.toFixed(4),'expect',(P*L**3/(48*EI)).toFixed(4));
r=solve(L,E,I,[{type:'fixed',x:0}],[{type:'point',x:L,mag:P}]);
console.log('Cantilever end load: Mmax=',r.Mmax.toFixed(0),'expect±',(P*L).toFixed(0),'| M0=',r.M0.toFixed(0),'Mfree=',r.Mfree.toFixed(0),'(free must=0) | dmax=',r.dmax.toFixed(4),'expect',(P*L**3/(3*EI)).toFixed(4));
const W=12000;
r=solve(L,E,I,[{type:'fixed',x:0}],[{type:'distributed',x:0,xEnd:L,mag:W}]);
console.log('Cantilever UDL: Mmax=',r.Mmax.toFixed(0),'expect±',(W*L/2).toFixed(0),'| Mfree=',r.Mfree.toFixed(0),'| dmax=',r.dmax.toFixed(4),'expect',(W*L**3/(8*EI)).toFixed(4));
console.log('\n=== FIXSIGN=-1 (proposed fix) ===');
FIXSIGN=-1;
r=solve(L,E,I,[{type:'pin',x:0},{type:'roller',x:L}],[{type:'point',x:L/2,mag:P}]);
console.log('SS center load: Mmax=',r.Mmax.toFixed(0),'expect±',(P*L/4).toFixed(0),'| dmax=',r.dmax.toFixed(4),'expect',(P*L**3/(48*EI)).toFixed(4));
r=solve(L,E,I,[{type:'fixed',x:0}],[{type:'point',x:L,mag:P}]);
console.log('Cantilever end load: Mmax=',r.Mmax.toFixed(0),'expect±',(P*L).toFixed(0),'| M0=',r.M0.toFixed(0),'Mfree=',r.Mfree.toFixed(0),'(free must=0) | dmax=',r.dmax.toFixed(4),'expect',(P*L**3/(3*EI)).toFixed(4));
r=solve(L,E,I,[{type:'fixed',x:0}],[{type:'distributed',x:0,xEnd:L,mag:W}]);
console.log('Cantilever UDL: Mmax=',r.Mmax.toFixed(0),'expect±',(W*L/2).toFixed(0),'| Mfree=',r.Mfree.toFixed(0),'| dmax=',r.dmax.toFixed(4),'expect',(W*L**3/(8*EI)).toFixed(4));
