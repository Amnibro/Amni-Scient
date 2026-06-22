const npts=4001,FIXSIGN=-1;
function solve(L,E,I,supports,loads){
  supports=supports.slice().sort((a,b)=>a.x-b.x);
  const fixedCount=supports.filter(s=>s.type==='fixed').length;
  const xs=Array.from({length:npts},(_,i)=>i*L/(npts-1));
  let reactions={};
  if(fixedCount>=1){
    const f=supports.find(s=>s.type==='fixed');let RF=0,MF=0;
    loads.forEach(ld=>{if(ld.type==='point'){RF+=ld.mag;MF+=ld.mag*(ld.x-f.x);}else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);const Rl=w*(b-a);RF+=Rl;MF+=Rl*((a+b)/2-f.x);}else if(ld.type==='moment'){MF+=ld.mag;}});
    reactions[f.x]={V:-RF,M:-MF,type:'fixed'};
  }else if(supports.length>=2){
    const A=supports[0],B=supports[supports.length-1];let MA=0,Ftot=0;
    loads.forEach(ld=>{if(ld.type==='point'){Ftot+=ld.mag;MA+=ld.mag*(ld.x-A.x);}else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);const Rl=w*(b-a);Ftot+=Rl;MA+=Rl*((a+b)/2-A.x);}else if(ld.type==='moment'){MA+=ld.mag;}});
    const RB=-MA/(B.x-A.x),RA=-Ftot-RB;
    reactions[A.x]={V:RA,M:0,type:A.type};reactions[B.x]={V:RB,M:0,type:B.type};
  }
  function shearAt(x){let V=0;for(const sx in reactions)if(parseFloat(sx)<=x+1e-6)V+=reactions[sx].V;loads.forEach(ld=>{if(ld.type==='point'){if(ld.x<=x+1e-6)V+=ld.mag;}else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);if(x>=a){const u=Math.min(x,b);V+=w*(u-a);}}});return V;}
  function momentAt(x){let M=0;for(const sx in reactions){const sxn=parseFloat(sx);if(sxn<=x+1e-6){M+=reactions[sx].V*(x-sxn);if(reactions[sx].type==='fixed')M+=FIXSIGN*reactions[sx].M;}}loads.forEach(ld=>{if(ld.type==='point'){if(ld.x<=x+1e-6)M+=ld.mag*(x-ld.x);}else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);if(x>=a){const u=Math.min(x,b);const dx=u-a;M+=w*dx*(x-(a+u)/2);}}else if(ld.type==='moment'){if(ld.x<=x+1e-6)M+=ld.mag;}});return M;}
  const Vs=xs.map(shearAt),Ms=xs.map(momentAt),EI=E*I,slope=new Array(npts).fill(0),defl=new Array(npts).fill(0),dx=L/(npts-1);
  for(let i=1;i<npts;i++)slope[i]=slope[i-1]+(Ms[i-1]+Ms[i])/2/EI*dx;
  for(let i=1;i<npts;i++)defl[i]=defl[i-1]+(slope[i-1]+slope[i])/2*dx;
  const supXs=Object.keys(reactions).map(parseFloat);
  if(supXs.length>=2&&fixedCount===0){const xA=supXs[0],xB=supXs[supXs.length-1],iA=Math.round(xA/L*(npts-1)),iB=Math.round(xB/L*(npts-1)),dA=defl[iA],dB=defl[iB],sc=(dB-dA)/(xB-xA);for(let i=0;i<npts;i++)defl[i]-=dA+sc*(xs[i]-xA);}
  else if(fixedCount>=1){const f=supports.find(s=>s.type==='fixed'),iF=Math.round(f.x/L*(npts-1)),dF=defl[iF],sF=slope[iF];for(let i=0;i<npts;i++){defl[i]-=dF+sF*(xs[i]-f.x);slope[i]-=sF;}}
  const am=a=>a.reduce((p,c)=>Math.abs(c)>Math.abs(p)?c:p,0);
  return{Mmax:am(Ms),dmax:am(defl),RA:reactions[supXs[0]].V,RB:reactions[supXs[supXs.length-1]]?reactions[supXs[supXs.length-1]].V:null};
}
const L=4000,E=200000,I=5e7,EI=E*I,ok=(a,b)=>Math.abs(a-b)/(Math.abs(b)||1)<0.01?'OK':'**FAIL**';
let r,P=8000;
r=solve(L,E,I,[{type:'pin',x:0},{type:'roller',x:L}],[{type:'point',x:L/4,mag:P}]);
const a=L/4,b=3*L/4,bmin=Math.min(a,b),dExact=P*bmin*(L*L-bmin*bmin)**1.5/(9*Math.sqrt(3)*L*EI);
console.log('SS quarter load: |M|',Math.abs(r.Mmax).toFixed(0),ok(Math.abs(r.Mmax),P*a*b/L),'| RA',(-r.RA).toFixed(0),ok(-r.RA,P*b/L),'| dmax',Math.abs(r.dmax).toFixed(4),'~',dExact.toFixed(4),ok(Math.abs(r.dmax),dExact));
const W=10000;
r=solve(L,E,I,[{type:'pin',x:0},{type:'roller',x:L}],[{type:'distributed',x:0,xEnd:L,mag:W}]);
console.log('SS full UDL: |M|',Math.abs(r.Mmax).toFixed(0),ok(Math.abs(r.Mmax),W*L/8),'(WL/8) | dmax',Math.abs(r.dmax).toFixed(4),ok(Math.abs(r.dmax),5*W*L**3/(384*EI)),'(5WL^3/384EI)');
r=solve(L,E,I,[{type:'fixed',x:0}],[{type:'point',x:L/2,mag:P}]);
console.log('Cantilever mid load: |Mwall|',Math.abs(r.Mmax).toFixed(0),ok(Math.abs(r.Mmax),P*L/2),'(P*L/2) | dmax',Math.abs(r.dmax).toFixed(4),ok(Math.abs(r.dmax),P*(L/2)**2*(3*L-L/2)/(6*EI)),'(end defl)');
r=solve(L,E,I,[{type:'pin',x:0},{type:'roller',x:L}],[{type:'point',x:L/3,mag:P},{type:'point',x:2*L/3,mag:P}]);
console.log('SS two sym loads: |M|',Math.abs(r.Mmax).toFixed(0),ok(Math.abs(r.Mmax),P*L/3),'(P*a=P*L/3) | RA',(-r.RA).toFixed(0),ok(-r.RA,P));
