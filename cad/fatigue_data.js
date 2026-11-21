const SRC='Approximate room-temperature fatigue data (Shigley endurance estimate for steel; published fully-reversed strengths for aluminum and titanium; typical strain-life coefficients). Not a certified allowables table.';
export const FATIGUE={
  al6061:{sut:310,sy:276,S1:279,N1:1e3,S2:96,N2:5e8,knee:false,sf:917,b:-0.106,ef:0.35,c:-0.69,src:SRC},
  al7075:{sut:572,sy:503,S1:515,N1:1e3,S2:159,N2:5e8,knee:false,sf:1317,b:-0.126,ef:0.26,c:-0.52,src:SRC},
  steel1018:{sut:440,sy:370,S1:396,N1:1e3,S2:220,N2:1e6,knee:true,sf:860,b:-0.09,ef:0.45,c:-0.51,src:SRC},
  steel4140:{sut:1020,sy:655,S1:900,N1:1e3,S2:510,N2:1e6,knee:true,sf:1560,b:-0.09,ef:0.58,c:-0.57,src:SRC},
  ss304:{sut:505,sy:215,S1:455,N1:1e3,S2:240,N2:1e6,knee:false,sf:1260,b:-0.114,ef:0.53,c:-0.53,src:SRC},
  ss316:{sut:580,sy:205,S1:520,N1:1e3,S2:270,N2:1e6,knee:false,sf:1180,b:-0.11,ef:0.5,c:-0.5,src:SRC},
  ti64:{sut:950,sy:880,S1:855,N1:1e3,S2:510,N2:1e7,knee:false,sf:1800,b:-0.10,ef:0.58,c:-0.52,src:SRC},
  brass:{sut:470,sy:310,S1:420,N1:1e3,S2:140,N2:1e8,knee:false,sf:900,b:-0.10,ef:0.4,c:-0.55,src:SRC}
};
export function snOf(mat){
  if(!mat)return null;if(mat.sn)return mat.sn;
  const sut=mat.su||mat.sut||(mat.sy?mat.sy*1.2:0),sy=mat.sy||sut;if(!(sut>0))return null;
  const steel=sut>sy*1.05&&(mat.g==='Carbon and alloy steel'||mat.g==='Tool steel'||/steel|iron/i.test(mat.n||''));
  const se=mat.se||(steel?Math.min(0.5*sut,700):0.3*sut);
  return{sut,sy,S1:0.9*sut,N1:1e3,S2:se,N2:steel?1e6:5e8,knee:!!steel,src:'Estimated from yield and tensile strength. '+SRC,estimated:true};
}
