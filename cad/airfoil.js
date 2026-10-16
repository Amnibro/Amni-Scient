const CLARKY={x:[0.0,0.0005,0.001,0.002,0.004,0.008,0.012,0.02,0.03,0.04,0.05,0.06,0.08,0.1,0.12,0.14,0.16,0.18,0.2,0.22,0.24,0.26,0.28,0.3,0.32,0.34,0.36,0.38,0.4,0.42,0.44,0.46,0.48,0.5,0.52,0.54,0.56,0.58,0.6,0.62,0.64,0.66,0.68,0.7,0.72,0.74,0.76,0.78,0.8,0.82,0.84,0.86,0.88,0.9,0.92,0.94,0.96,0.97,0.98,0.99,1.0],u:[0.0,0.0023,0.0037,0.0058,0.0089,0.0137,0.0179,0.0254,0.033,0.0391,0.0443,0.0488,0.0564,0.063,0.0686,0.0734,0.0776,0.0811,0.0839,0.0861,0.0878,0.0891,0.09,0.0907,0.0912,0.0915,0.0916,0.0915,0.0912,0.0906,0.0897,0.0886,0.0874,0.0859,0.0842,0.0824,0.0803,0.0781,0.0758,0.0732,0.0705,0.0676,0.0646,0.0614,0.0582,0.0548,0.0513,0.0476,0.0439,0.04,0.0361,0.032,0.0278,0.0235,0.0191,0.0146,0.01,0.0077,0.0053,0.003,0.0006],l:[0.0,-0.0047,-0.0059,-0.0078,-0.0105,-0.0143,-0.017,-0.0203,-0.0226,-0.0245,-0.026,-0.0271,-0.0285,-0.0294,-0.03,-0.0302,-0.0303,-0.03,-0.0297,-0.0291,-0.0285,-0.0278,-0.0271,-0.0263,-0.0256,-0.0248,-0.0241,-0.0234,-0.0226,-0.0219,-0.0212,-0.0204,-0.0197,-0.019,-0.0182,-0.0175,-0.0168,-0.016,-0.0153,-0.0146,-0.0138,-0.0131,-0.0124,-0.0116,-0.0109,-0.0101,-0.0094,-0.0087,-0.0079,-0.0072,-0.0065,-0.0057,-0.005,-0.0043,-0.0035,-0.0028,-0.0021,-0.0017,-0.0013,-0.001,-0.0006]};
const CLASSICS={clarky:CLARKY};
const interp=(X,Y,x)=>{const s=Math.sqrt(x);let i=1;while(i<X.length-1&&Math.sqrt(X[i])<s)i++;const a=Math.sqrt(X[i-1]),b=Math.sqrt(X[i]),t=b>a?(s-a)/(b-a):0;return Y[i-1]+(Y[i]-Y[i-1])*t;};
export const AIRFOILS=['NACA 4-digit code such as 4412, 2412 or 0012','clarky'];
export function airfoilPoints(s){
  const c=+s.chord||10,n=Math.max(8,Math.min(80,Math.round(+s.n||20))),te=Math.max(0,+s.te||0)/c,code=String(s.code||'4412').toLowerCase().replace(/[^a-z0-9]/g,'').replace(/^naca/,''),cl=CLASSICS[code],xs=[...Array(n+1).keys()].map(i=>(1-Math.cos(Math.PI*i/n))/2);
  if(!cl&&!/^\d{4}$/.test(code))throw new Error('airfoil code must be a NACA 4-digit code (e.g. 4412) or one of: clarky');
  let up,lo;
  if(cl){up=xs.map(x=>[x,interp(cl.x,cl.u,x)+te/2*x]);lo=xs.map(x=>[x,interp(cl.x,cl.l,x)-te/2*x]);}
  else{
    const m=+code[0]/100,p=+code[1]/10,t=+code.slice(2)/100;up=[];lo=[];
    for(const x of xs){const yt=5*t*(0.2969*Math.sqrt(x)-0.126*x-0.3516*x*x+0.2843*x**3-0.1036*x**4)+te/2*x,yc=m&&p?(x<p?m/(p*p)*(2*p*x-x*x):m/((1-p)**2)*(1-2*p+2*p*x-x*x)):0,dy=m&&p?(x<p?2*m/(p*p)*(p-x):2*m/((1-p)**2)*(p-x)):0,th=Math.atan(dy);up.push([x-yt*Math.sin(th),yc+yt*Math.cos(th)]);lo.push([x+yt*Math.sin(th),yc-yt*Math.cos(th)]);}
    up[0]=[0,0];lo[0]=[0,0];
  }
  lo[0]=[0,0];up[0]=[0,0];te||(lo[n]=up[n]);
  const f=p=>[(p[0]-0.25)*c,p[1]*c];
  return{up:up.map(f),lo:lo.map(f),te:te*c};
}
export const AIRFOIL_SOURCES='NACA 4-digit: Abbott and von Doenhoff, Theory of Wing Sections (1959), closed trailing edge coefficient -0.1036. Clark Y: UIUC Airfoil Coordinates Database (m-selig.ae.illinois.edu/ads/coord_database.html), clarky.dat.';
