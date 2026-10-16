export const gentE=S=>0.0981*(56+7.62336*S)/(0.137505*(254-2.54*S));
const GENT='Gent, A.N., "On the relation between indentation hardness and Young\'s modulus", Rubber Chem. Technol. 31(4), 896-906 (1958)';
const rub=(n,S,extra)=>{const E=gentE(S);return{n,kind:'hyper',model:'nh',shore:S,E,C10:E/6,C01:0,nu:0.4999,src:'Small-strain modulus from Shore '+S+'A via '+GENT+'. Neo-Hookean C10 = E/6; incompressible-limit bulk (nu 0.4999). Fit your own uniaxial data for strains above about 30 %.',...extra};};
export const HYPER={lsr30:rub('LSR silicone 30A',30),lsr40:rub('LSR silicone 40A',40),lsr50:rub('LSR silicone 50A',50),lsr60:rub('LSR silicone 60A',60),lsr70:rub('LSR silicone 70A',70),epdm70:rub('EPDM 70A',70),fkm75:rub('FKM (fluoroelastomer) 75A',75)};
const KS='Kalpakjian & Schmid, Manufacturing Processes for Engineering Materials, 5th ed. (2008), Table 2.3',HC='Hosford & Caddell, Metal Forming, 4th ed., Cambridge Univ. Press (2011), Table 21.1',AD='Adamus, Winowiecka & Dyner, "Analysis of forming thin titanium panels with stiffeners", Arch. Metall. Mater. 62(1), 173-180 (2017), Table 2, 0.4 mm sheet',A240='ASTM A240 minimum yield (annealed)';
const kFromUts=(uts,n)=>uts*Math.pow(Math.E/n,n);
export const METALS={
  ss316l:{n:'Stainless 316L (annealed)',kind:'plastic',E:193000,nu:0.29,sy0:170,hard:'swift',K:+kFromUts(485,0.45).toFixed(0),nexp:0.45,r:0.95,src:'n and r-bar: class values for austenitic stainless, '+HC+'. K estimated from the ASTM A240 minimum UTS 485 MPa with the Considère condition (K = UTS (e/n)^n); yield '+A240+'. No peer-reviewed 316L K/r table was found: replace with your coil test data.'},
  ss304:{n:'Stainless 304 (annealed)',kind:'plastic',E:193000,nu:0.29,sy0:205,hard:'swift',K:1275,nexp:0.45,r0:1.03,r45:1.31,r90:0.97,src:'K, n: '+KS+'. r0/r45/r90: mid-range of Wu et al., Materials 16, 4321 (2023), Table 2 (0.6 mm sheet). Yield '+A240+'.'},
  ti1:{n:'Titanium grade 1 (CP)',kind:'plastic',E:105000,nu:0.34,sy0:305,hard:'swift',K:529,nexp:0.096,r:3.0,src:'K, n, yield: '+AD+' (0 deg). r-bar: lower end of the alpha-titanium range 3.0-5.0, '+HC+'. E: typical CP-Ti.'},
  ti2:{n:'Titanium grade 2 (CP)',kind:'plastic',E:103000,nu:0.34,sy0:368,hard:'swift',K:644,nexp:0.101,r:3.0,src:'E, K, n, yield: '+AD+' (0 deg). r-bar: lower end of the alpha-titanium range 3.0-5.0, '+HC+'.'},
  al5052:{n:'Aluminum 5052-O',kind:'plastic',E:70300,nu:0.33,sy0:90,hard:'swift',K:210,nexp:0.13,r:0.7,src:'K, n: '+KS+'. r-bar: mid-range 0.6-0.8 for aluminum alloys, '+HC+'. Yield: typical 5052-O.'},
  cu:{n:'Copper C11000 (annealed)',kind:'plastic',E:117000,nu:0.34,sy0:69,hard:'swift',K:315,nexp:0.54,r:0.75,src:'K, n: '+KS+' (annealed copper). r-bar: mid-range 0.6-0.9 for copper, '+HC+'. Yield: typical annealed C11000.'}};
export function matSpec(key,over){const h=HYPER[key],m=METALS[key],o=over||{};if(h)return{...h,...o};if(m){const s={...m,n:m.nexp,name:m.n,...o};return s;}if(o.kind)return o;throw new Error('unknown material '+key);}
export const isMetal=k=>!!METALS[k];
const I1u=l=>l*l+2/l,I1b=l=>2*l*l+Math.pow(l,-4),I1p=l=>l*l+1+1/(l*l);
export function nominal(c,mode,l){const C10=c.C10||0,C01=c.C01||0,C20=c.C20||0,C30=c.C30||0,x=(mode==='biax'?I1b(l):mode==='planar'?I1p(l):I1u(l))-3,W1=C10+2*C20*x+3*C30*x*x;return mode==='biax'?2*(l-Math.pow(l,-5))*(W1+l*l*C01):mode==='planar'?2*(l-Math.pow(l,-3))*(W1+C01):2*(l-1/(l*l))*(W1+C01/l);}
export function fitHyper(model,data){const names=model==='mr'?['C10','C01']:model==='yeoh'?['C10','C20','C30']:['C10'],rows=[],b=[];
  for(const q of data){const l=q.l??1+q.e,mode=q.mode||'uni',x=(mode==='biax'?I1b(l):mode==='planar'?I1p(l):I1u(l))-3,g=mode==='biax'?2*(l-Math.pow(l,-5)):mode==='planar'?2*(l-Math.pow(l,-3)):2*(l-1/(l*l)),g2=mode==='biax'?g*l*l:mode==='planar'?g:2*(1-Math.pow(l,-3));rows.push(names.map(k=>k==='C10'?g:k==='C01'?g2:k==='C20'?g*2*x:g*3*x*x));b.push(q.P);}
  const m=names.length,A=new Float64Array(m*m),r=new Float64Array(m);rows.forEach((row,i)=>{for(let a=0;a<m;a++){r[a]+=row[a]*b[i];for(let c=0;c<m;c++)A[a*m+c]+=row[a]*row[c];}});
  for(let i=0;i<m;i++){let p=i;for(let q=i+1;q<m;q++)if(Math.abs(A[q*m+i])>Math.abs(A[p*m+i]))p=q;for(let c=0;c<m;c++){const t=A[i*m+c];A[i*m+c]=A[p*m+c];A[p*m+c]=t;}const t=r[i];r[i]=r[p];r[p]=t;for(let q=i+1;q<m;q++){const f=A[q*m+i]/A[i*m+i];for(let c=i;c<m;c++)A[q*m+c]-=f*A[i*m+c];r[q]-=f*r[i];}}
  const x=new Float64Array(m);for(let i=m-1;i>=0;i--){let s=r[i];for(let c=i+1;c<m;c++)s-=A[i*m+c]*x[c];x[i]=s/A[i*m+i];}
  const c={model};names.forEach((k,i)=>c[k]=x[i]);let ss=0,st=0;const mean=b.reduce((a,v)=>a+v,0)/b.length;data.forEach((q,i)=>{const p=nominal(c,q.mode||'uni',q.l??1+q.e);ss+=(p-b[i])**2;st+=(b[i]-mean)**2;});
  const lmax=Math.max(...data.map(q=>q.l??1+q.e));let stable=true;for(let l=1.001;l<=lmax*1.5;l+=0.01)if(nominal(c,'uni',l+0.005)<=nominal(c,'uni',l))stable=false;
  return{...c,rms:Math.sqrt(ss/b.length),r2:st>0?1-ss/st:1,stable,G:2*((c.C10||0)+(c.C01||0))};}
export const parseTest=t=>String(t||'').split(/\n/).map(l=>l.trim().split(/[\s,;\t]+/).map(Number)).filter(a=>a.length>=2&&a.every(isFinite)).map(([e,P])=>({e:e>2?e/100:e,P}));
export const flc0=(n,t)=>(23.3+14.13*t)*n/0.21;
export function flc(e2,n,t){const e10=flc0(n,t)/100,a=Math.log(1+e10);return e2<=0?a-e2:Math.log(1+e10+0.6*(Math.exp(e2)-1));}
export const FLC_SRC='FLC0 = (23.3 + 14.13 t[mm]) n/0.21 from Keeler & Brazier, Proc. Microalloying 75 (1977) 517-530, as restated in Keeler, Enhanced Forming Limit Diagram Technology Report, Auto/Steel Partnership (2003). Left side: constant-thickness line in true strain; right side: slope 0.6 in engineering strain (WorldAutoSteel AHSS Guidelines). Fitted to low-carbon steels; extrapolated for stainless, titanium, aluminum and copper.';
export const LINDLEY_SRC='Lindley, P.B., "Load-compression relationships of rubber units", J. Strain Anal. 1(3), 190-195 (1966): F/L = E d (1.25 C^1.5 + 50 C^6) for a laterally unrestrained O-ring cord between flat plates.';
export const lindley=(E,d,C)=>E*d*(1.25*Math.pow(C,1.5)+50*Math.pow(C,6));
