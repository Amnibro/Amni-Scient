/* AMNI-CALC v5.2.0 fixes layer
 * Loads after calc-overrides.js to override broken/missing handlers
 * from the obfuscated module. Adds:
 *  - Theme-aware Plotly helpers (read CSS vars per call so dark/light works)
 *  - Beam: typed support input + proper solveBeam with shear/moment/deflection plots
 *  - Section: applyPreset that immediately renders results
 *  - Bolts: live-compute, expanded grade + size lookup
 *  - Springs: type-gated presets + series/parallel + range overlay
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const v=id=>{const e=$(id);return e?parseFloat(e.value):NaN;};
const sv=id=>{const e=$(id);return e?e.value:'';};
function pTheme(){
  const css=getComputedStyle(document.documentElement);
  const isLight=(document.documentElement.getAttribute('data-theme')||'dark')==='light';
  return {
    paper:(css.getPropertyValue('--panel')||(isLight?'#f4efe4':'#111')).trim(),
    plot:(css.getPropertyValue('--panel2')||(isLight?'#ebe4d1':'#0a0a0a')).trim(),
    text:(css.getPropertyValue('--text')||(isLight?'#1f1a12':'#eee')).trim(),
    dim:(css.getPropertyValue('--dim')||(isLight?'#5a5142':'#888')).trim(),
    grid:(isLight?'#c6bba0':'#222'),
    accent:(css.getPropertyValue('--accent')||'#ff6b35').trim()
  };
}
function plot(id,traces,axes){
  const el=$(id);if(!el||!window.Plotly)return;
  const t=pTheme();
  const layout={
    paper_bgcolor:t.paper,plot_bgcolor:t.plot,
    font:{family:'JetBrains Mono,monospace',color:t.text,size:11},
    margin:{l:60,r:18,t:30,b:42},
    xaxis:{gridcolor:t.grid,zerolinecolor:t.dim,linecolor:t.dim,tickfont:{color:t.text,size:10},title:{font:{color:t.text,size:11}}},
    yaxis:{gridcolor:t.grid,zerolinecolor:t.dim,linecolor:t.dim,tickfont:{color:t.text,size:10},title:{font:{color:t.text,size:11}}},
    showlegend:false
  };
  if(axes){
    if(axes.xaxis)layout.xaxis=Object.assign(layout.xaxis,axes.xaxis);
    if(axes.yaxis)layout.yaxis=Object.assign(layout.yaxis,axes.yaxis);
    if(axes.title)layout.title={text:axes.title,font:{color:t.text,size:12}};
    if(axes.shapes)layout.shapes=axes.shapes;
    if(axes.showlegend)layout.showlegend=axes.showlegend;
    if(axes.legend)layout.legend=axes.legend;
  }
  Plotly.react(id,traces,layout,{displayModeBar:false,responsive:true});
}
window.calcFixes={pTheme,plot};
window.addEventListener('DOMContentLoaded',()=>{
  const obs=new MutationObserver(()=>{rethemeAllPlots();rethemeCanvases();});
  obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
});

/* ============================================================
 * BEAM MODULE — proper mechanics, shear/moment/deflection plots
 * ============================================================ */
const LEN_TO_MM={mm:1,m:1000,in:25.4,ft:304.8};
const FORCE_TO_N={N:1,kN:1000,lbf:4.44822,kip:4448.22};
const E_TO_MPA={MPa:1,GPa:1000,psi:0.00689476,ksi:6.89476};
const I_TO_MM4={mm4:1,cm4:1e4,in4:416231};
function getLen(id){const u=sv(id+'-u')||'mm';return v(id)*(LEN_TO_MM[u]||1);}
function getForce(id){const u=sv(id+'-u')||'N';return v(id)*(FORCE_TO_N[u]||1);}
function getE(id){const u=sv(id+'-u')||'MPa';return v(id)*(E_TO_MPA[u]||1);}
function getI(id){const u=sv(id+'-u')||'mm4';return v(id)*(I_TO_MM4[u]||1);}

window.beamSupports=window.beamSupports||[];
window.beamLoads=window.beamLoads||[];

window.addTypedSupport=function(){
  const t=sv('sup-typed-type')||'pin';
  const pos=getLen('sup-typed-pos');
  if(!isFinite(pos)||pos<0){alert('Enter a valid position.');return;}
  window.beamSupports.push({type:t,x:pos});
  renderSupportList();
  if(typeof window.solveBeam==='function')try{window.solveBeam();}catch(e){}
};
window.clearSupports=function(){window.beamSupports=[];renderSupportList();if(typeof window.solveBeam==='function')try{window.solveBeam();}catch(e){}};
function renderSupportList(){
  /* Use our own dedicated container #sup-typed-list to avoid conflict
   * with the obfuscated module which fights for #sup-list. */
  const el=$('sup-typed-list')||$('sup-list');if(!el)return;
  if(window.beamSupports.length===0){
    el.innerHTML='<span style="opacity:.5">No supports placed yet — add at least one above.</span>';
  }else{
    el.innerHTML='<strong style="color:var(--text)">SUPPORTS:</strong> '+window.beamSupports.map((s,i)=>
      `<span class="chip" style="font-size:.72rem;background:rgba(255,107,53,0.12);color:var(--text);padding:3px 8px;border-radius:3px;border:1px solid var(--accent,#ff6b35)">${s.type.toUpperCase()} @ ${s.x.toFixed(0)} mm <a href="#" onclick="window.beamSupports.splice(${i},1);window.renderSupportList();window.solveBeam&&window.solveBeam();return false" style="margin-left:.4rem;color:#f55;text-decoration:none">×</a></span>`
    ).join(' ');
  }
}
window.renderSupportList=renderSupportList;

const _origAddLoad=window.addLoad;
window.addLoad=function(){
  const type=sv('ld-type')||'point';
  const pos=getLen('ld-pos');
  const mag=getForce('ld-mag');
  const endPos=$('ld-end')&&$('ld-end').value?getLen('ld-end'):null;
  if(!isFinite(pos)||!isFinite(mag)){alert('Need position and magnitude.');return;}
  window.beamLoads.push({type,x:pos,mag,xEnd:endPos});
  renderLoadList();
  if(typeof window.solveBeam==='function')try{window.solveBeam();}catch(e){}
};
window.clearLoads=function(){window.beamLoads=[];renderLoadList();if(typeof window.solveBeam==='function')try{window.solveBeam();}catch(e){}};
function renderLoadList(){
  const el=$('load-list');if(!el)return;
  el.innerHTML=window.beamLoads.map((l,i)=>{
    const mN=l.mag,mLbl=Math.abs(mN)>=1000?(mN/1000).toFixed(2)+' kN':mN.toFixed(1)+' N';
    const posLbl=l.xEnd?`${l.x.toFixed(0)}-${l.xEnd.toFixed(0)} mm`:`@ ${l.x.toFixed(0)} mm`;
    return `<span class="chip" style="font-size:.7rem">${l.type.toUpperCase()} ${mLbl} ${posLbl} <a href="#" onclick="window.beamLoads.splice(${i},1);renderLoadList();return false" style="margin-left:.4rem;color:var(--err,#f55)">×</a></span>`;
  }).join('');
}
window.renderLoadList=renderLoadList;

window.solveBeam=function(){
  const L=getLen('bm-len');
  const E=getE('bm-e');
  const I=getI('bm-i');
  const out=$('beam-results');
  if(!out)return;
  if(!isFinite(L)||L<=0){out.innerHTML='<div class="note warn">Beam length required.</div>';return;}
  if(!isFinite(E)||E<=0){out.innerHTML='<div class="note warn">E modulus required.</div>';return;}
  if(!isFinite(I)||I<=0){out.innerHTML='<div class="note warn">I (moment of inertia) required.</div>';return;}
  const supports=window.beamSupports.slice().sort((a,b)=>a.x-b.x);
  const loads=window.beamLoads.slice();
  if(supports.length<1){out.innerHTML='<div class="note warn">Add at least one support (typed input above, or click the canvas).</div>';return;}
  if(loads.length<1){out.innerHTML='<div class="note warn">Add at least one load.</div>';return;}
  const fixedCount=supports.filter(s=>s.type==='fixed').length;
  const rxnCount=supports.reduce((a,s)=>a+(s.type==='fixed'?2:1),0);
  if(rxnCount<2){out.innerHTML='<div class="note warn">Need at least 2 unknown reactions (one fixed support, or two pin/roller).</div>';return;}
  const npts=201;
  const xs=Array.from({length:npts},(_,i)=>i*L/(npts-1));
  let reactions={};let extraNote='';
  if(fixedCount>=1){
    const f=supports.find(s=>s.type==='fixed');
    let RF=0,MF=0;
    loads.forEach(ld=>{
      if(ld.type==='point'){RF+=ld.mag;MF+=ld.mag*(ld.x-f.x);}
      else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);const Rload=w*(b-a);RF+=Rload;MF+=Rload*((a+b)/2-f.x);}
      else if(ld.type==='moment'){MF+=ld.mag;}
    });
    reactions[f.x]={V:-RF,M:-MF,type:'fixed'};
    extraNote='Cantilever (fixed at '+f.x.toFixed(0)+' mm). Other supports ignored.';
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
    if(supports.length>2)extraNote='Solving as simply supported between extreme supports ('+A.x.toFixed(0)+' / '+B.x.toFixed(0)+' mm). Intermediate supports ignored — use a typed pin/roller pair for now.';
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
    for(const sx in reactions){const sxn=parseFloat(sx);if(sxn<=x+1e-6){M+=reactions[sx].V*(x-sxn);if(reactions[sx].type==='fixed'&&Math.abs(sxn-x)<1e-6)M+=reactions[sx].M;else if(reactions[sx].type==='fixed')M+=reactions[sx].M;}}
    loads.forEach(ld=>{
      if(ld.type==='point'){if(ld.x<=x+1e-6)M+=ld.mag*(x-ld.x);}
      else if(ld.type==='distributed'){const a=ld.x,b=ld.xEnd||L;const w=ld.mag/(b-a);if(x>=a){const upTo=Math.min(x,b);const dx=upTo-a;M+=w*dx*(x-(a+upTo)/2);}}
      else if(ld.type==='moment'){if(ld.x<=x+1e-6)M+=ld.mag;}
    });
    return M;
  }
  const Vs=xs.map(shearAt);
  const Ms=xs.map(momentAt);
  const EI=E*I;
  const slope=new Array(npts).fill(0);
  const defl=new Array(npts).fill(0);
  const dx=L/(npts-1);
  for(let i=1;i<npts;i++){slope[i]=slope[i-1]+(Ms[i-1]+Ms[i])/2/EI*dx;}
  for(let i=1;i<npts;i++){defl[i]=defl[i-1]+(slope[i-1]+slope[i])/2*dx;}
  const supXs=Object.keys(reactions).map(parseFloat);
  if(supXs.length>=2&&fixedCount===0){
    const xA=supXs[0],xB=supXs[supXs.length-1];
    const iA=Math.round(xA/L*(npts-1)),iB=Math.round(xB/L*(npts-1));
    const dA=defl[iA],dB=defl[iB];
    const slopeCorr=(dB-dA)/(xB-xA);
    for(let i=0;i<npts;i++){defl[i]-=dA+slopeCorr*(xs[i]-xA);}
  }else if(fixedCount>=1){
    const f=supports.find(s=>s.type==='fixed');
    const iF=Math.round(f.x/L*(npts-1));
    const dF=defl[iF],sF=slope[iF];
    for(let i=0;i<npts;i++){defl[i]-=dF+sF*(xs[i]-f.x);slope[i]-=sF;}
  }
  const Vmax=Vs.reduce((a,b)=>Math.abs(b)>Math.abs(a)?b:a,0);
  const Mmax=Ms.reduce((a,b)=>Math.abs(b)>Math.abs(a)?b:a,0);
  const dmax=defl.reduce((a,b)=>Math.abs(b)>Math.abs(a)?b:a,0);
  const dmaxIdx=defl.findIndex(d=>d===dmax);
  const VmaxKN=Vmax/1000,MmaxNm=Mmax/1000;
  const rxLines=Object.entries(reactions).map(([x,r])=>{
    const xN=parseFloat(x);
    const VkN=(r.V/1000).toFixed(3);
    const MNm=r.type==='fixed'?(r.M/1000).toFixed(3)+' N·m':'-';
    return `<tr><td>${r.type.toUpperCase()} @ ${xN.toFixed(0)} mm</td><td>${VkN} kN</td><td>${MNm}</td></tr>`;
  }).join('');
  out.innerHTML=`
    <div class="result-grid">
      <div class="result-item"><div class="lbl">V_max</div><div class="val">${VmaxKN.toFixed(3)} kN</div></div>
      <div class="result-item"><div class="lbl">M_max</div><div class="val">${MmaxNm.toFixed(3)} N·m</div></div>
      <div class="result-item"><div class="lbl">δ_max</div><div class="val">${dmax.toFixed(3)} mm @ ${xs[dmaxIdx].toFixed(0)} mm</div></div>
      <div class="result-item"><div class="lbl">L/δ</div><div class="val">${(Math.abs(dmax)>1e-9?(L/Math.abs(dmax)).toFixed(0):'∞')}</div></div>
    </div>
    <table class="data" style="margin-top:.6rem;font-size:.78rem">
      <thead><tr><th>SUPPORT</th><th>REACTION (V)</th><th>REACTION (M)</th></tr></thead>
      <tbody>${rxLines}</tbody>
    </table>
    ${extraNote?'<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.75rem">'+extraNote+'</p>':''}
    <p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">Sign: positive shear = upward on left face. Positive moment = sagging. Deflection positive = downward. Stiffness check: L/δ &gt; 360 typical for floors, &gt; 240 for roofs.</p>`;
  const sup_shapes=Object.keys(reactions).map(x=>({type:'line',x0:parseFloat(x),x1:parseFloat(x),y0:Math.min(0,...Vs)*1.1,y1:Math.max(0,...Vs)*1.1,line:{color:pTheme().accent,width:1,dash:'dot'}}));
  plot('p-shear',[
    {x:xs,y:Vs.map(v=>v/1000),mode:'lines',line:{color:'#4a9eff',width:2},fill:'tozeroy',fillcolor:'rgba(74,158,255,0.15)',name:'V'},
    {x:[0,L],y:[0,0],mode:'lines',line:{color:pTheme().dim,width:1,dash:'dash'}}
  ],{xaxis:{title:'x (mm)',range:[0,L]},yaxis:{title:'Shear V (kN)'}});
  plot('p-moment',[
    {x:xs,y:Ms.map(v=>-v/1000),mode:'lines',line:{color:'#ff6b35',width:2},fill:'tozeroy',fillcolor:'rgba(255,107,53,0.15)',name:'M'},
    {x:[0,L],y:[0,0],mode:'lines',line:{color:pTheme().dim,width:1,dash:'dash'}}
  ],{xaxis:{title:'x (mm)',range:[0,L]},yaxis:{title:'Moment M (N·m, sag positive down)'}});
  plot('p-deflection',[
    {x:xs,y:defl,mode:'lines',line:{color:'#22c55e',width:2},name:'δ'},
    {x:[0,L],y:[0,0],mode:'lines',line:{color:pTheme().dim,width:1,dash:'dash'}}
  ],{xaxis:{title:'x (mm)',range:[0,L]},yaxis:{title:'Deflection δ (mm, positive down)'}});
};

/* Init: if no typed supports yet on page load, seed pin/roller for default 3000 mm beam */
window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    if(window.beamSupports.length===0){
      window.beamSupports.push({type:'pin',x:0});
      window.beamSupports.push({type:'roller',x:3000});
      renderSupportList();
    }
    if(window.beamLoads.length===0){
      window.beamLoads.push({type:'point',x:1500,mag:-10000});
      renderLoadList();
    }
  },300);
});

/* ============================================================
 * SECTION PROPERTIES — preset library + auto-display
 * ============================================================ */
const SECTION_PRESETS={
  rect:{label:'Rectangle (b × h)',params:[{id:'b',label:'b (width, mm)',def:50},{id:'h',label:'h (height, mm)',def:100}],calc:p=>{const{b,h}=p,A=b*h,Ix=b*h*h*h/12,Iy=h*b*b*b/12,Sx=b*h*h/6,Sy=h*b*b/6,Zx=b*h*h/4,Zy=h*b*b/4;return{A,Ix,Iy,Sx,Sy,Zx,Zy,rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A),J:b*h*Math.min(b,h)*Math.min(b,h)/3*(1-0.21*Math.min(b,h)/Math.max(b,h)*(1-Math.pow(Math.min(b,h)/Math.max(b,h),4)/12))};}},
  hollow_rect:{label:'Hollow Rectangle (B × H, t)',params:[{id:'B',label:'B (outer width, mm)',def:60},{id:'H',label:'H (outer height, mm)',def:100},{id:'t',label:'t (wall, mm)',def:5}],calc:p=>{const{B,H,t}=p,bi=B-2*t,hi=H-2*t,A=B*H-bi*hi,Ix=(B*H*H*H-bi*hi*hi*hi)/12,Iy=(H*B*B*B-hi*bi*bi*bi)/12,Sx=2*Ix/H,Sy=2*Iy/B;return{A,Ix,Iy,Sx,Sy,rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  circle:{label:'Solid Circle (d)',params:[{id:'d',label:'d (diameter, mm)',def:50}],calc:p=>{const{d}=p,A=Math.PI*d*d/4,I=Math.PI*Math.pow(d,4)/64,S=Math.PI*Math.pow(d,3)/32,Z=Math.pow(d,3)/6,J=Math.PI*Math.pow(d,4)/32;return{A,Ix:I,Iy:I,Sx:S,Sy:S,Zx:Z,Zy:Z,rx:d/4,ry:d/4,J};}},
  hollow_circle:{label:'Hollow Circle / Tube (do, di)',params:[{id:'do',label:'d_o (outer, mm)',def:50},{id:'di',label:'d_i (inner, mm)',def:40}],calc:p=>{const dO=p['do'],dI=p['di'],A=Math.PI*(dO*dO-dI*dI)/4,I=Math.PI*(Math.pow(dO,4)-Math.pow(dI,4))/64,S=2*I/dO,J=Math.PI*(Math.pow(dO,4)-Math.pow(dI,4))/32;return{A,Ix:I,Iy:I,Sx:S,Sy:S,rx:Math.sqrt(I/A),ry:Math.sqrt(I/A),J};}},
  pipe:{label:'Pipe (d_o, t_wall)',params:[{id:'do',label:'d_o (outer, mm)',def:50},{id:'t',label:'t_wall (mm)',def:5}],calc:p=>{const dO=p['do'],t=p.t,dI=dO-2*t,A=Math.PI*(dO*dO-dI*dI)/4,I=Math.PI*(Math.pow(dO,4)-Math.pow(dI,4))/64,S=2*I/dO,J=Math.PI*(Math.pow(dO,4)-Math.pow(dI,4))/32;return{A,Ix:I,Iy:I,Sx:S,Sy:S,rx:Math.sqrt(I/A),ry:Math.sqrt(I/A),J};}},
  i_beam:{label:'I-Beam (b_f, t_f, d, t_w)',params:[{id:'bf',label:'b_f (flange width, mm)',def:100},{id:'tf',label:'t_f (flange thickness, mm)',def:10},{id:'d',label:'d (overall depth, mm)',def:200},{id:'tw',label:'t_w (web thickness, mm)',def:6}],calc:p=>{const{bf,tf,d,tw}=p,h=d-2*tf,A=2*bf*tf+h*tw,Ix=(bf*Math.pow(d,3)-(bf-tw)*Math.pow(h,3))/12,Iy=(2*tf*Math.pow(bf,3)+h*Math.pow(tw,3))/12,Sx=2*Ix/d,Sy=2*Iy/bf,Zx=bf*tf*(d-tf)+tw*h*h/4,Zy=tf*bf*bf/2+h*tw*tw/4;return{A,Ix,Iy,Sx,Sy,Zx,Zy,rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  channel:{label:'Channel (b_f, t_f, d, t_w)',params:[{id:'bf',label:'b_f (flange width, mm)',def:75},{id:'tf',label:'t_f (flange thickness, mm)',def:10},{id:'d',label:'d (overall depth, mm)',def:150},{id:'tw',label:'t_w (web thickness, mm)',def:6}],calc:p=>{const{bf,tf,d,tw}=p,h=d-2*tf,A=2*bf*tf+h*tw,Ix=(bf*Math.pow(d,3)-(bf-tw)*Math.pow(h,3))/12,xC=(2*tf*bf*bf/2+h*tw*tw/2)/A,Iy_full=(2*tf*Math.pow(bf,3)+h*Math.pow(tw,3))/3,Iy=Iy_full-A*xC*xC;return{A,Ix,Iy,Sx:2*Ix/d,xCentroid:xC,rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  angle:{label:'Equal Angle (L, t)',params:[{id:'L',label:'L (leg, mm)',def:50},{id:'t',label:'t (thickness, mm)',def:5}],calc:p=>{const{L,t}=p,A=t*(2*L-t),xC=(L*t*L/2+(L-t)*t*t/2)/A,Ix=(t*Math.pow(L,3)+(L-t)*Math.pow(t,3))/3-A*xC*xC;return{A,Ix,Iy:Ix,xC,rx:Math.sqrt(Ix/A)};}},
  tee:{label:'T-Section (b_f, t_f, d, t_w)',params:[{id:'bf',label:'b_f (flange, mm)',def:100},{id:'tf',label:'t_f (flange thick, mm)',def:10},{id:'d',label:'d (depth, mm)',def:120},{id:'tw',label:'t_w (web thick, mm)',def:6}],calc:p=>{const{bf,tf,d,tw}=p,A1=bf*tf,A2=(d-tf)*tw,A=A1+A2,yC=(A1*tf/2+A2*(tf+(d-tf)/2))/A,Ix1=bf*Math.pow(tf,3)/12+A1*Math.pow(yC-tf/2,2),Ix2=tw*Math.pow(d-tf,3)/12+A2*Math.pow(tf+(d-tf)/2-yC,2),Ix=Ix1+Ix2,Iy=tf*Math.pow(bf,3)/12+(d-tf)*Math.pow(tw,3)/12;return{A,Ix,Iy,yCentroid:yC,Sx_top:Ix/yC,Sx_bot:Ix/(d-yC),rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  trapezoid:{label:'Trapezoid (a, b, h)',params:[{id:'a',label:'a (top width, mm)',def:30},{id:'b',label:'b (bottom width, mm)',def:60},{id:'h',label:'h (height, mm)',def:80}],calc:p=>{const{a,b,h}=p,A=(a+b)*h/2,yC=h*(2*a+b)/(3*(a+b)),Ix=h*h*h*(a*a+4*a*b+b*b)/(36*(a+b));return{A,Ix,yCentroid:yC,Sx_top:Ix/yC,Sx_bot:Ix/(h-yC),rx:Math.sqrt(Ix/A)};}},
  triangle:{label:'Triangle (b, h)',params:[{id:'b',label:'b (base, mm)',def:60},{id:'h',label:'h (height, mm)',def:80}],calc:p=>{const{b,h}=p,A=b*h/2,Ix=b*h*h*h/36,Sx_top=Ix/(2*h/3),Sx_bot=Ix/(h/3);return{A,Ix,Iy:h*b*b*b/48,Sx_top,Sx_bot,rx:Math.sqrt(Ix/A)};}}
};
function populateSecPresets(){
  const sel=$('sec-presets');if(!sel)return;
  sel.innerHTML='';
  Object.entries(SECTION_PRESETS).forEach(([k,p])=>{
    const o=document.createElement('option');o.value=k;o.textContent=p.label;sel.appendChild(o);
  });
  /* Inject snap selector into the presets card */
  const presetCard=sel.closest('.card');
  if(presetCard&&!presetCard.querySelector('#sec-snap')){
    const snapDiv=document.createElement('div');
    snapDiv.style.cssText='margin-top:.5rem;display:flex;gap:.5rem;align-items:center;font-size:.78rem';
    snapDiv.innerHTML='<label for="sec-snap" style="color:var(--dim)">SNAP RESOLUTION:</label><select id="sec-snap" style="padding:3px 6px;background:var(--panel2);color:var(--text);border:1px solid var(--border);border-radius:3px"><option value="0.01">0.01 mm</option><option value="0.1">0.1 mm</option><option value="1" selected>1 mm</option><option value="10">10 mm</option><option value="100">100 mm</option></select><span style="color:var(--dim);font-size:.7rem">arrow keys step by this; values round to nearest snap unit on Tab</span>';
    presetCard.insertBefore(snapDiv,sel.parentElement.nextSibling);
  }
  renderSecParams();
  sel.addEventListener('change',()=>{renderSecParams();applyPreset();});
  const snap=$('sec-snap');
  if(snap)snap.addEventListener('change',()=>{renderSecParams();applyPreset();});
}
function renderSecParams(){
  const sel=$('sec-presets'),wrap=$('sec-preset-params');if(!sel||!wrap)return;
  const preset=SECTION_PRESETS[sel.value];if(!preset)return;
  const snap=parseFloat(($('sec-snap')||{}).value)||1;
  wrap.innerHTML='<div class="row" style="gap:.5rem;flex-wrap:wrap">'+preset.params.map(p=>
    `<div class="field" style="min-width:140px"><label for="secp-${p.id}">${p.label}</label><input type="number" id="secp-${p.id}" value="${p.def}" step="${snap}" oninput="window.applyPreset()" onblur="this.value=(Math.round(parseFloat(this.value||0)/${snap})*${snap}).toFixed(${snap<1?Math.max(0,-Math.log10(snap)):0});window.applyPreset()"></div>`
  ).join('')+'</div>';
}
window.applyPreset=function(){
  const sel=$('sec-presets');if(!sel)return;
  const preset=SECTION_PRESETS[sel.value];if(!preset)return;
  const params={};preset.params.forEach(p=>{const el=$('secp-'+p.id);params[p.id]=el?parseFloat(el.value):p.def;});
  let res;try{res=preset.calc(params);}catch(e){console.warn('[section preset]',e);return;}
  const out=$('sec-results');if(!out)return;
  const fmt=(x,d)=>!isFinite(x)?'—':Math.abs(x)>=1e6?(x/1e6).toFixed(d||3)+'×10⁶':Math.abs(x)>=1e4?(x/1e3).toFixed(d||2)+'×10³':x.toFixed(d||3);
  const items=[];
  if(res.A!==undefined)items.push(['A',fmt(res.A)+' mm²']);
  if(res.Ix!==undefined)items.push(['I_x',fmt(res.Ix)+' mm⁴']);
  if(res.Iy!==undefined)items.push(['I_y',fmt(res.Iy)+' mm⁴']);
  if(res.Sx!==undefined)items.push(['S_x',fmt(res.Sx)+' mm³']);
  if(res.Sy!==undefined)items.push(['S_y',fmt(res.Sy)+' mm³']);
  if(res.Sx_top!==undefined)items.push(['S_x (top)',fmt(res.Sx_top)+' mm³']);
  if(res.Sx_bot!==undefined)items.push(['S_x (bot)',fmt(res.Sx_bot)+' mm³']);
  if(res.Zx!==undefined)items.push(['Z_x (plastic)',fmt(res.Zx)+' mm³']);
  if(res.Zy!==undefined)items.push(['Z_y (plastic)',fmt(res.Zy)+' mm³']);
  if(res.rx!==undefined)items.push(['r_x',fmt(res.rx,3)+' mm']);
  if(res.ry!==undefined)items.push(['r_y',fmt(res.ry,3)+' mm']);
  if(res.J!==undefined)items.push(['J (torsion)',fmt(res.J)+' mm⁴']);
  if(res.yCentroid!==undefined)items.push(['ȳ',fmt(res.yCentroid,3)+' mm']);
  if(res.xCentroid!==undefined)items.push(['x̄',fmt(res.xCentroid,3)+' mm']);
  out.innerHTML='<h3>SECTION PROPERTIES — '+preset.label.toUpperCase()+'</h3>'+
    '<div class="result-grid">'+items.map(i=>`<div class="result-item"><div class="lbl">${i[0]}</div><div class="val">${i[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.7rem">A = area, I = second moment of area, S = elastic section modulus (I/c), Z = plastic section modulus, r = radius of gyration (√(I/A)), J = polar/torsion constant. All bending values are about the centroidal axis. Values change instantly when you edit inputs above.</p>';
};

/* ============================================================
 * BOLTS — full grade + size library, live-compute
 * ============================================================ */
const BOLT_GRADES={
  'SAE-2':{Sp:225,Sy:393,Su:510,std:'SAE J429 — low/medium-carbon'},
  'SAE-5':{Sp:585,Sy:634,Su:827,std:'SAE J429 — medium-carbon Q&T (most common)'},
  'SAE-7':{Sp:725,Sy:896,Su:1034,std:'SAE J429 — medium-carbon alloy Q&T'},
  'SAE-8':{Sp:830,Sy:896,Su:1034,std:'SAE J429 — medium-carbon alloy Q&T (high-strength)'},
  'ISO-4.6':{Sp:225,Sy:240,Su:400,std:'ISO 898-1 class 4.6'},
  'ISO-5.8':{Sp:380,Sy:420,Su:520,std:'ISO 898-1 class 5.8'},
  'ISO-8.8':{Sp:580,Sy:640,Su:800,std:'ISO 898-1 class 8.8 (DIN/EN equivalent of SAE 5)'},
  'ISO-10.9':{Sp:830,Sy:940,Su:1040,std:'ISO 898-1 class 10.9 (≈ SAE 8 strength)'},
  'ISO-12.9':{Sp:970,Sy:1100,Su:1220,std:'ISO 898-1 class 12.9 (highest standard class)'},
  'A325':{Sp:585,Sy:635,Su:825,std:'ASTM A325 / F3125 GR 120 — structural'},
  'A490':{Sp:830,Sy:895,Su:1035,std:'ASTM A490 / F3125 GR 150 — structural'},
  'A307':{Sp:200,Sy:248,Su:413,std:'ASTM A307 — general-purpose carbon steel'},
  '316SS':{Sp:170,Sy:205,Su:515,std:'A2-70/316 austenitic SS (annealed; cold-worked higher)'}
};
const BOLT_SIZES={
  '#0000-160':{d:0.53,p:0.159,At:0.166,kind:'Inch UNC (very fine)'},
  '#000-120':{d:0.86,p:0.212,At:0.452,kind:'Inch UNC'},
  '#00-90':{d:1.19,p:0.282,At:0.85,kind:'Inch UNC'},
  '#0-80':{d:1.52,p:0.318,At:1.50,kind:'Inch UNC'},
  '#1-64':{d:1.85,p:0.397,At:2.30,kind:'Inch UNC'},
  '#2-56':{d:2.18,p:0.454,At:3.10,kind:'Inch UNC'},
  '#3-48':{d:2.51,p:0.529,At:4.20,kind:'Inch UNC'},
  '#4-40':{d:2.84,p:0.635,At:5.42,kind:'Inch UNC'},
  '#5-40':{d:3.17,p:0.635,At:6.78,kind:'Inch UNC'},
  '#6-32':{d:3.51,p:0.794,At:7.81,kind:'Inch UNC'},
  '#8-32':{d:4.17,p:0.794,At:11.0,kind:'Inch UNC'},
  '#10-24':{d:4.83,p:1.058,At:14.2,kind:'Inch UNC'},
  '#12-24':{d:5.49,p:1.058,At:18.6,kind:'Inch UNC'},
  '1/4-20':{d:6.35,p:1.270,At:20.5,kind:'Inch UNC'},
  '5/16-18':{d:7.94,p:1.411,At:33.9,kind:'Inch UNC'},
  '3/8-16':{d:9.53,p:1.587,At:50.3,kind:'Inch UNC'},
  '7/16-14':{d:11.11,p:1.814,At:69.0,kind:'Inch UNC'},
  '1/2-13':{d:12.70,p:1.954,At:91.6,kind:'Inch UNC'},
  '9/16-12':{d:14.29,p:2.117,At:117,kind:'Inch UNC'},
  '5/8-11':{d:15.88,p:2.309,At:146,kind:'Inch UNC'},
  '3/4-10':{d:19.05,p:2.540,At:215,kind:'Inch UNC'},
  '7/8-9':{d:22.23,p:2.822,At:298,kind:'Inch UNC'},
  '1-8':{d:25.40,p:3.175,At:391,kind:'Inch UNC'},
  '1-1/8-7':{d:28.58,p:3.629,At:492,kind:'Inch UNC'},
  '1-1/4-7':{d:31.75,p:3.629,At:625,kind:'Inch UNC'},
  '1-3/8-6':{d:34.93,p:4.233,At:745,kind:'Inch UNC'},
  '1-1/2-6':{d:38.10,p:4.233,At:906,kind:'Inch UNC'},
  '1-3/4-5':{d:44.45,p:5.080,At:1226,kind:'Inch UNC'},
  '2-4.5':{d:50.80,p:5.644,At:1613,kind:'Inch UNC'},
  '2-1/4-4.5':{d:57.15,p:5.644,At:2065,kind:'Inch UNC'},
  '2-1/2-4':{d:63.50,p:6.350,At:2580,kind:'Inch UNC'},
  '2-3/4-4':{d:69.85,p:6.350,At:3168,kind:'Inch UNC'},
  '3-4':{d:76.20,p:6.350,At:3826,kind:'Inch UNC'},
  '3-1/4-4':{d:82.55,p:6.350,At:4555,kind:'Inch UNC'},
  '3-1/2-4':{d:88.90,p:6.350,At:5355,kind:'Inch UNC'},
  '3-3/4-4':{d:95.25,p:6.350,At:6226,kind:'Inch UNC'},
  '4-4':{d:101.60,p:6.350,At:7168,kind:'Inch UNC'},
  'M1.6':{d:1.6,p:0.35,At:1.27,kind:'Metric coarse'},
  'M2':{d:2.0,p:0.40,At:2.07,kind:'Metric coarse'},
  'M2.5':{d:2.5,p:0.45,At:3.39,kind:'Metric coarse'},
  'M3':{d:3.0,p:0.50,At:5.03,kind:'Metric coarse'},
  'M4':{d:4.0,p:0.70,At:8.78,kind:'Metric coarse'},
  'M5':{d:5.0,p:0.80,At:14.2,kind:'Metric coarse'},
  'M6':{d:6.0,p:1.00,At:20.1,kind:'Metric coarse'},
  'M8':{d:8.0,p:1.25,At:36.6,kind:'Metric coarse'},
  'M10':{d:10.0,p:1.50,At:58.0,kind:'Metric coarse'},
  'M12':{d:12.0,p:1.75,At:84.3,kind:'Metric coarse'},
  'M14':{d:14.0,p:2.00,At:115,kind:'Metric coarse'},
  'M16':{d:16.0,p:2.00,At:157,kind:'Metric coarse'},
  'M18':{d:18.0,p:2.50,At:192,kind:'Metric coarse'},
  'M20':{d:20.0,p:2.50,At:245,kind:'Metric coarse'},
  'M22':{d:22.0,p:2.50,At:303,kind:'Metric coarse'},
  'M24':{d:24.0,p:3.00,At:353,kind:'Metric coarse'},
  'M27':{d:27.0,p:3.00,At:459,kind:'Metric coarse'},
  'M30':{d:30.0,p:3.50,At:561,kind:'Metric coarse'},
  'M33':{d:33.0,p:3.50,At:694,kind:'Metric coarse'},
  'M36':{d:36.0,p:4.00,At:817,kind:'Metric coarse'},
  'M39':{d:39.0,p:4.00,At:976,kind:'Metric coarse'},
  'M42':{d:42.0,p:4.50,At:1121,kind:'Metric coarse'},
  'M48':{d:48.0,p:5.00,At:1473,kind:'Metric coarse'},
  'M56':{d:56.0,p:5.50,At:2030,kind:'Metric coarse'},
  'M64':{d:64.0,p:6.00,At:2676,kind:'Metric coarse'}
};
function populateBoltDropdowns(){
  const g=$('bl-grade'),s=$('bl-size');
  if(g){g.innerHTML='';Object.keys(BOLT_GRADES).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k+' (Sp '+BOLT_GRADES[k].Sp+' MPa)';g.appendChild(o);});g.value='SAE-5';}
  if(s){s.innerHTML='';Object.keys(BOLT_SIZES).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k+' (At '+BOLT_SIZES[k].At+' mm²)';s.appendChild(o);});s.value='1/2-13';}
  const gtbl=$('bl-grade-tbl');if(gtbl){gtbl.innerHTML=Object.entries(BOLT_GRADES).map(([k,g])=>`<tr><td>${k}</td><td>${g.Sp}</td><td>${g.Sy}</td><td>${g.Su}</td></tr>`).join('');}
  const stbl=$('bl-size-tbl');if(stbl){stbl.innerHTML=Object.entries(BOLT_SIZES).map(([k,s])=>`<tr><td>${k}</td><td>${s.d}</td><td>${s.p}</td><td>${s.At}</td></tr>`).join('');}
}
window.calcBolt=function(){
  const grade=BOLT_GRADES[sv('bl-grade')]||BOLT_GRADES['SAE-5'];
  const size=BOLT_SIZES[sv('bl-size')]||BOLT_SIZES['1/2-13'];
  const n=Math.max(1,parseInt(v('bl-num'))||1);
  const Fext=getForce('bl-fext');
  const Fshear=v('bl-shear')||0;
  const preloadPct=v('bl-preload')/100;
  const C=v('bl-c');
  const mu=v('bl-mu');
  const out=$('bolt-results');if(!out)return;
  if(!isFinite(Fext)){out.innerHTML='<div class="note warn">External load required.</div>';return;}
  const At=size.At,Sp=grade.Sp,Sy=grade.Sy,Su=grade.Su;
  const Fproof=Sp*At,Fyield=Sy*At;
  const Fi=preloadPct*Fproof;
  const FextPer=Fext/n;
  const Fb=Fi+C*FextPer;
  const Fj=Fi-(1-C)*FextPer;
  const sigma_b=Fb/At,sigma_proof_ratio=sigma_b/Sp;
  const tau=(Fshear/n)/At,IR=Math.pow(sigma_b/Sp,2)+Math.pow(tau/(0.577*Sp),2);
  const T=mu*Fi*size.d/1000;
  const T_K=0.20*Fi*size.d/1000;
  const sepFactor=Fi/(FextPer*(1-C));
  const items=[
    ['F_proof (single)',Math.round(Fproof)+' N'],
    ['F_yield (single)',Math.round(Fyield)+' N'],
    ['F_i preload',Math.round(Fi)+' N ('+(preloadPct*100).toFixed(0)+'% Fp)'],
    ['F_b bolt load',Math.round(Fb)+' N',Fb<Fyield?'ok':'err'],
    ['F_j joint clamp',Math.round(Fj)+' N',Fj>0?'ok':'err'],
    ['σ_b tension',sigma_b.toFixed(1)+' MPa',sigma_b<Sy?'ok':'err'],
    ['Proof use',(sigma_proof_ratio*100).toFixed(1)+'%',sigma_proof_ratio<0.85?'ok':sigma_proof_ratio<1?'warn':'err'],
    ['τ shear',tau.toFixed(1)+' MPa'],
    ['IR (tens+shear)',IR.toFixed(3),IR<1?'ok':'err'],
    ['T = μ·F_i·d',T.toFixed(2)+' N·m'],
    ['T (K=0.20)',T_K.toFixed(2)+' N·m'],
    ['Separation safety',isFinite(sepFactor)?sepFactor.toFixed(2)+'×':'∞',sepFactor>1.5?'ok':sepFactor>1?'warn':'err']
  ];
  out.innerHTML='<h3>JOINT RESULTS — '+sv('bl-size')+' '+sv('bl-grade')+' × '+n+'</h3>'+
    '<div class="result-grid">'+items.map(i=>`<div class="result-item"><div class="lbl">${i[0]}</div><div class="val ${i[2]||''}">${i[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem"><strong>Standard:</strong> '+grade.std+'. <strong>Size:</strong> '+size.kind+', d_nom='+size.d+' mm, pitch='+size.p+' mm, A_t='+size.At+' mm².<br><strong>Method:</strong> Shigley joint stiffness — F_b = F_i + C·F_ext, F_j = F_i − (1−C)·F_ext. Stiffness ratio C = k_bolt/(k_bolt + k_member) — typical 0.2–0.4 for steel-on-steel. Preload 75% of proof for reusable; up to 90% for permanent. Torque T=K·F_i·d with K≈0.20 dry, 0.15 lubricated. Interaction IR = (σ/Sp)² + (τ/0.577·Sp)² &lt; 1.</p>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>Thin-material rule of thumb:</strong> tap depth ≥ 1.0·d in steel, 1.5·d in aluminum, 2.0·d in plastic for full strength. Below 0.5·d the joint will strip the threads before the bolt yields.</p>';
};
/* Live-compute on any input change (debounced) */
function wireLive(viewId,recompute){
  const view=$(viewId);if(!view)return;
  let t=null;const fire=()=>{clearTimeout(t);t=setTimeout(recompute,180);};
  view.querySelectorAll('input,select').forEach(el=>{
    el.addEventListener('input',fire);el.addEventListener('change',fire);
  });
}
/* Universal live-compute: per-CARD scoping so multi-card modules
 * (vibration: NatFreq + Isolator + Resonance; shafts: Torsion +
 * CritSpeed + Key) don't race on a shared results div.
 *
 * For each .card containing a calc* button, wire that card's inputs
 * to fire only THAT card's handler. Cards without a calc button get
 * wired to the view-level fallback (all view handlers fire) — that
 * preserves behavior for modules where a single card has all inputs.
 */
function universalLiveCompute(){
  document.querySelectorAll('.view[id^="v-"]').forEach(view=>{
    const allButtons=Array.from(view.querySelectorAll('button[onclick^="calc"],button[onclick^="solve"],button[onclick^="apply"],button[onclick^="draw"]'));
    if(!allButtons.length)return;
    /* Per-card wiring */
    const cardScopedInputs=new WeakSet();
    view.querySelectorAll('.card').forEach(card=>{
      const cardButtons=Array.from(card.querySelectorAll('button[onclick^="calc"],button[onclick^="solve"],button[onclick^="apply"],button[onclick^="draw"]'));
      if(!cardButtons.length)return;
      const cardHandlers=[];const seen=new Set();
      cardButtons.forEach(b=>{
        const m=b.getAttribute('onclick').match(/^([a-zA-Z_$][\w$]*)\s*\(/);
        if(!m)return;
        const name=m[1];if(seen.has(name))return;seen.add(name);
        cardHandlers.push(name);
      });
      let t=null;
      const fire=()=>{
        clearTimeout(t);
        t=setTimeout(()=>{
          cardHandlers.forEach(name=>{
            const fn=window[name];
            if(typeof fn==='function')try{fn();}catch(e){console.warn('[live-compute]',name,e.message);}
          });
        },220);
      };
      card.querySelectorAll('input,select').forEach(el=>{
        cardScopedInputs.add(el);
        el.addEventListener('input',fire);el.addEventListener('change',fire);
      });
      /* Fire once on init for this card's handlers */
      setTimeout(fire,500);
    });
    /* View-level fallback for inputs OUTSIDE any .card with a calc button
     * (rare — happens when inputs sit at view root level) */
    const viewHandlers=[];const vSeen=new Set();
    allButtons.forEach(b=>{
      const m=b.getAttribute('onclick').match(/^([a-zA-Z_$][\w$]*)\s*\(/);
      if(!m)return;const name=m[1];if(vSeen.has(name))return;vSeen.add(name);viewHandlers.push(name);
    });
    let vt=null;
    const vFire=()=>{
      clearTimeout(vt);
      vt=setTimeout(()=>{
        viewHandlers.forEach(name=>{const fn=window[name];if(typeof fn==='function')try{fn();}catch(e){}});
      },220);
    };
    view.querySelectorAll('input,select').forEach(el=>{
      if(cardScopedInputs.has(el))return;
      el.addEventListener('input',vFire);el.addEventListener('change',vFire);
    });
    /* Hide compute buttons that are now redundant */
    allButtons.forEach(b=>{
      if(b.classList.contains('btn-fill')||b.classList.contains('btn-sm')){
        const onclickName=(b.getAttribute('onclick')||'').match(/^[a-zA-Z_$][\w$]*/)[0];
        if(/^(clear|undo|add|remove)/i.test(onclickName))return;
        b.style.display='none';
      }
    });
  });
}

/* ============================================================
 * LAYOUT FIX: force inputs-left and theme older charts
 * ============================================================ */
function injectStyles(){
  if($('calc-fixes-style'))return;
  const s=document.createElement('style');s.id='calc-fixes-style';
  s.textContent=`
    .view .split{display:flex;flex-direction:row;gap:1rem;align-items:flex-start}
    .view .split>div{flex:1;min-width:0}
    @media(max-width:900px){.view .split{flex-direction:column}}
    .result-item .val.ok{color:#22c55e}.result-item .val.warn{color:#f59e0b}.result-item .val.err{color:#ef4444}
    .note.warn{color:#f59e0b;background:rgba(245,158,11,0.08);padding:.5rem .7rem;border-left:3px solid #f59e0b;border-radius:3px;font-size:.78rem}
  `;
  document.head.appendChild(s);
}
function patchPlotly(){
  if(!window.Plotly||window.Plotly.__themed)return;
  const apply=layout=>{
    const t=pTheme();
    const out=Object.assign({},layout||{});
    out.paper_bgcolor=t.paper;out.plot_bgcolor=t.plot;
    out.font=Object.assign({family:'JetBrains Mono,monospace',size:11},out.font||{},{color:t.text});
    ['xaxis','yaxis','xaxis2','yaxis2'].forEach(ax=>{
      if(out[ax]||ax==='xaxis'||ax==='yaxis'){
        out[ax]=Object.assign({},out[ax]||{},{
          gridcolor:t.grid,zerolinecolor:t.dim,linecolor:t.dim,
          tickfont:Object.assign({size:10},(out[ax]||{}).tickfont||{},{color:t.text})
        });
        if(out[ax].title&&typeof out[ax].title==='object'){
          out[ax].title=Object.assign({},out[ax].title,{font:Object.assign({size:11},out[ax].title.font||{},{color:t.text})});
        }
      }
    });
    if(out.legend){out.legend=Object.assign({},out.legend,{font:Object.assign({size:10},out.legend.font||{},{color:t.text}),bgcolor:'rgba(0,0,0,0)'});}
    if(out.hoverlabel){out.hoverlabel=Object.assign({},out.hoverlabel,{bgcolor:t.plot,bordercolor:t.accent,font:Object.assign({color:t.text},out.hoverlabel.font||{})});}
    return out;
  };
  const _react=window.Plotly.react,_newPlot=window.Plotly.newPlot;
  window.Plotly.react=function(el,traces,layout,config){return _react.call(this,el,traces,apply(layout),config);};
  window.Plotly.newPlot=function(el,traces,layout,config){return _newPlot.call(this,el,traces,apply(layout),config);};
  window.Plotly.__themed=true;
  console.log('[calc-fixes] Plotly themed-middleware installed');
}
function rethemeAllPlots(){
  document.querySelectorAll('.js-plotly-plot').forEach(el=>{
    if(!window.Plotly)return;
    try{
      const t=pTheme();
      window.Plotly.relayout(el,{
        paper_bgcolor:t.paper,plot_bgcolor:t.plot,'font.color':t.text,
        'xaxis.gridcolor':t.grid,'xaxis.linecolor':t.dim,'xaxis.zerolinecolor':t.dim,'xaxis.tickfont.color':t.text,
        'yaxis.gridcolor':t.grid,'yaxis.linecolor':t.dim,'yaxis.zerolinecolor':t.dim,'yaxis.tickfont.color':t.text
      });
    }catch(e){}
  });
}
/* Override theme-aware canvas redraws — re-fire active module's canvas draws on theme change */
function rethemeCanvases(){
  /* Mohr's circle */if(typeof window.drawMohrEnhanced==='function')try{window.drawMohrEnhanced();}catch(e){}
  /* Bolt pattern */if(typeof window.drawBoltPattern==='function')try{window.drawBoltPattern();}catch(e){}
  /* Spring anim */if(typeof window.calcSpring==='function')try{window.calcSpring();}catch(e){}
  /* Beam — re-fire if visible */if(typeof window.solveBeam==='function'&&document.querySelector('#v-beam.active'))try{window.solveBeam();}catch(e){}
}

/* ============================================================
 * SPRINGS — type-gated presets, series/parallel, F-δ chart, anim
 * ============================================================ */
const SPRING_PRESETS={
  compression:{
    label:'COMPRESSION',
    items:{
      'M3 stainless utility':{d:0.5,D:4,na:8,nt:10,fl:14,sy:1100,F:5},
      'Pen / latch return':{d:0.7,D:6,na:10,nt:12,fl:20,sy:1200,F:8},
      'M-size (light duty)':{d:1.2,D:10,na:8,nt:10,fl:30,sy:1200,F:25},
      'Industrial (medium)':{d:3,D:25,na:8,nt:10,fl:60,sy:1100,F:100},
      'Heavy (industrial valve)':{d:5,D:40,na:10,nt:13,fl:120,sy:1300,F:500},
      'Suspension coil':{d:12,D:120,na:8,nt:10,fl:300,sy:1500,F:5000}
    }
  },
  extension:{
    label:'EXTENSION',
    items:{
      'Screen door (light)':{d:1.0,D:8,na:30,nt:32,fl:80,sy:1100,F:15},
      'Garage door (medium)':{d:5,D:50,na:60,nt:62,fl:600,sy:1300,F:300},
      'Trampoline / heavy':{d:3,D:25,na:50,nt:52,fl:200,sy:1300,F:200}
    }
  },
  torsion:{
    label:'TORSION',
    items:{
      'Mousetrap (snap)':{d:1.2,D:10,na:6,nt:8,fl:30,sy:1200,F:5},
      'Hinge return':{d:2.0,D:20,na:8,nt:10,fl:40,sy:1200,F:20},
      'Ratchet pawl':{d:1.0,D:8,na:5,nt:7,fl:20,sy:1200,F:10}
    }
  },
  belleville:{
    label:'BELLEVILLE / DISC',
    items:{
      'B-12 (M3 bolt) light':{d:0.4,D:12,na:1,nt:1,fl:0.55,sy:1500,F:200,bell:{De:12,Di:6.2,h0:0.35,t:0.4}},
      'B-20 (M5)':{d:0.5,D:20,na:1,nt:1,fl:0.95,sy:1500,F:850,bell:{De:20,Di:10.2,h0:0.55,t:0.7}},
      'B-31.5 (M14 / utility)':{d:0.7,D:31.5,na:1,nt:1,fl:1.55,sy:1500,F:2750,bell:{De:31.5,Di:16.3,h0:0.8,t:1.25}},
      'B-50 (heavy industrial)':{d:1.4,D:50,na:1,nt:1,fl:3.0,sy:1500,F:8200,bell:{De:50,Di:25.4,h0:1.4,t:2.0}},
      'B-100 (heavy press)':{d:2.5,D:100,na:1,nt:1,fl:6.0,sy:1500,F:40000,bell:{De:100,Di:51,h0:2.7,t:4.0}}
    }
  },
  die:{
    label:'DIE SPRING',
    items:{
      'Light load (yellow stripe)':{d:5,D:32,na:8,nt:10,fl:64,sy:1500,F:600},
      'Medium (blue stripe)':{d:8,D:40,na:7,nt:9,fl:80,sy:1500,F:2200},
      'Heavy (red stripe)':{d:12,D:50,na:6,nt:8,fl:100,sy:1700,F:6000}
    }
  }
};
function populateSpringPresets(){
  const sel=$('sp-preset');if(!sel)return;
  const type=sv('sp-type')||'compression';
  const set=SPRING_PRESETS[type]||SPRING_PRESETS.compression;
  sel.innerHTML='';
  Object.keys(set.items).forEach(k=>{
    const o=document.createElement('option');o.value=k;o.textContent=k;sel.appendChild(o);
  });
}
window.applySpringPreset=function(){
  const sel=$('sp-preset');if(!sel)return;
  const type=sv('sp-type')||'compression';
  const set=SPRING_PRESETS[type];if(!set)return;
  const p=set.items[sel.value];if(!p)return;
  ['d','D','na','nt','fl','sy','F'].forEach(k=>{const el=$('sp-'+k);if(el)el.value=p[k];});
  if(p.bell){/* Belleville-specific extras would populate here if bell-* inputs exist */}
  window.calcSpring();
};
function unitVal(id,multipliers){const u=sv(id+'-u');return v(id)*(multipliers[u]||1);}
window.calcSpring=function(){
  const type=sv('sp-type')||'compression';
  const dMult={mm:1,'in':25.4};
  const fMult={N:1,lbf:4.44822,kgf:9.80665};
  const gMult={GPa:1e3,MPa:1,psi:6.89476e-3};
  const d=v('sp-d')*(dMult[sv('sp-d-u')]||1);
  const D=v('sp-D')*(dMult[sv('sp-D-u')]||1);
  const na=v('sp-na')||0;
  const nt=v('sp-nt')||0;
  const fl=v('sp-fl')||0;
  const G=v('sp-g')*(gMult[sv('sp-g-u')]||1);
  const F=v('sp-f')*(fMult[sv('sp-f-u')]||1);
  const Sy=v('sp-sy')||0;
  const out=$('spring-results');if(!out)return;
  if(!d||!D){out.innerHTML='<div class="note warn">Wire diameter and coil diameter required.</div>';return;}
  const items=[];let k=0,delta=0,Lsolid=0,Fmax=0;let extra='';
  const C=D/d;
  if(type==='belleville'){
    const De=D,Di=D*0.51,h0=fl||(d*1.5),t=d;
    const E=210000,nu=0.3;
    const a=De/2,b=Di/2,M=6/Math.PI*Math.pow(a/b-1,2)/Math.log(a/b)/Math.pow(a/b,2);
    const C1=6/Math.PI*Math.pow(a/b-1,2)/Math.log(a/b)/Math.pow(a/b,2);
    const ratio=h0/t;
    const F_at_h0=4*E/(1-nu*nu)*Math.pow(t,4)/(M*De*De)*ratio*(ratio-0.5)*ratio;
    k=F_at_h0/h0;delta=F/k;Lsolid=t;Fmax=F_at_h0;
    items.push(['Type','Belleville (Almen-Laszlo)']);
    items.push(['D_e / D_i',De.toFixed(1)+' / '+Di.toFixed(1)+' mm']);
    items.push(['h_0 / t',h0.toFixed(2)+' / '+t.toFixed(2)+' mm (ratio '+ratio.toFixed(2)+')']);
    items.push(['k @ free',k.toFixed(1)+' N/mm']);
    items.push(['F at flat (h_0)',Math.round(F_at_h0)+' N']);
    items.push(['δ at applied F',delta.toFixed(3)+' mm']);
    items.push(['Behavior',ratio<0.4?'~Linear':ratio<1.4?'Progressive':ratio<2.83?'Plateau (snap-through)':'Snap-through']);
    extra='Use stacked in series for more deflection (k_total = k/n) or in parallel for more force (k_total = k·n). Avoid h_0/t > 2.83 unless snap-through is the goal.';
  }else if(type==='compression'||type==='extension'||type==='die'){
    k=G*Math.pow(d,4)/(8*Math.pow(D,3)*na);
    delta=F/k;Lsolid=nt*d;
    const Kw=(4*C-1)/(4*C-4)+0.615/C;
    const tau=Kw*8*F*D/(Math.PI*Math.pow(d,3));
    const tau_allow=0.45*Sy;Fmax=tau_allow*Math.PI*Math.pow(d,3)/(Kw*8*D);
    const delta_solid=fl-Lsolid;
    items.push(['Type',type.toUpperCase()+' (Shigley)']);
    items.push(['Index C = D/d',C.toFixed(2),C>=4&&C<=12?'ok':'warn']);
    items.push(['Wahl K_w',Kw.toFixed(3)]);
    items.push(['k spring rate',k.toFixed(2)+' N/mm']);
    items.push(['δ at applied F',delta.toFixed(2)+' mm']);
    items.push(['τ shear stress',tau.toFixed(0)+' MPa',tau<tau_allow?'ok':'err']);
    items.push(['F_max safe',Math.round(Fmax)+' N']);
    items.push(['L_solid',Lsolid.toFixed(1)+' mm']);
    items.push(['δ to solid',delta_solid>0?delta_solid.toFixed(1)+' mm':'AT SOLID',delta_solid>0?'ok':'err']);
    items.push(['L under load',(fl-delta).toFixed(1)+' mm',fl-delta>Lsolid?'ok':'err']);
    extra='Shigley spring design. C between 4 and 12 is good practice; below 4 the wire is hard to coil, above 12 the spring can buckle. τ < 0.45·Sy for static, τ < 0.30·Sy for fatigue.';
  }else if(type==='torsion'){
    const E=200000;
    k=E*Math.pow(d,4)/(64*D*na);
    delta=F*100/k;Lsolid=nt*d;
    const sigma=32*F*D/(Math.PI*Math.pow(d,3));
    items.push(['Type','TORSION (Shigley)']);
    items.push(['Index C',C.toFixed(2)]);
    items.push(['k angular',k.toFixed(2)+' N·mm/rad']);
    items.push(['Angle at applied moment',delta.toFixed(2)+' °']);
    items.push(['σ bending',sigma.toFixed(0)+' MPa',sigma<Sy*0.78?'ok':'err']);
    extra='Torsion springs use bending stress, not shear. F input acts as moment in N·mm. K_b correction omitted (typical static design).';
  }
  out.innerHTML='<h3>SPRING RESULTS — '+type.toUpperCase()+'</h3>'+
    '<div class="result-grid">'+items.map(i=>`<div class="result-item"><div class="lbl">${i[0]}</div><div class="val ${i[2]||''}">${i[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">'+extra+'</p>';
  /* Series/parallel combiner output */
  const arr=sv('sp-stack-arr')||'series';
  const n=Math.max(1,parseInt(v('sp-stack-n'))||1);
  const k_combined=arr==='series'?k/n:k*n;
  const F_combined=arr==='series'?F:F*n;
  const delta_combined=F_combined/k_combined;
  const so=$('sp-stack-out');if(so){
    so.innerHTML=`<strong>${arr.toUpperCase()} of ${n}</strong> &mdash; combined rate <strong>${k_combined.toFixed(2)} N/mm</strong>, deflection at force <strong>${delta_combined.toFixed(2)} mm</strong>. ${arr==='series'?'Same force, '+n+'× the deflection.':n+'× the force, same deflection per spring.'}`;
  }
  /* Force-deflection chart with ideal range overlay AND series/parallel overlay */
  const Lavail=fl-Lsolid;
  const xMax=Lavail>0?Lavail:fl*0.8;
  const xMaxStack=arr==='series'?xMax*n:xMax;
  const xCharted=Math.max(xMax,xMaxStack);
  const npts=80;const xs=Array.from({length:npts},(_,i)=>i*xCharted/(npts-1));
  const Fs_single=xs.map(x=>x<=xMax?k*x:null);
  const Fs_series=xs.map(x=>x<=xMaxStack?k_combined*x:null);
  const Fs_parallel=xs.map(x=>x<=xMax?k*n*x:null);
  const idealMin=xMax*0.15,idealMax=xMax*0.80;
  const Fmax_chart=Math.max(k*xMax,k_combined*xMaxStack,k*n*xMax);
  const shapes=[
    {type:'rect',x0:idealMin,x1:idealMax,y0:0,y1:Fmax_chart,fillcolor:'rgba(34,197,94,0.12)',line:{width:0}},
    {type:'line',x0:xMax,x1:xMax,y0:0,y1:Fmax_chart*1.05,line:{color:'#ef4444',width:1.5,dash:'dash'}}
  ];
  if(isFinite(delta)&&delta>0&&delta<xMax){
    shapes.push({type:'line',x0:delta,x1:delta,y0:0,y1:F,line:{color:pTheme().accent,width:1,dash:'dot'}});
  }
  const traces=[
    {x:xs,y:Fs_single,mode:'lines',line:{color:pTheme().accent,width:2.5},name:'Single spring (k='+k.toFixed(1)+' N/mm)'}
  ];
  if(n>1){
    const colSeries='#3b82f6',colParallel='#a855f7';
    if(arr==='series')traces.push({x:xs,y:Fs_series,mode:'lines',line:{color:colSeries,width:2,dash:'dash'},name:'Series of '+n+' (k='+k_combined.toFixed(1)+' N/mm)'});
    if(arr==='parallel')traces.push({x:xs,y:Fs_parallel,mode:'lines',line:{color:colParallel,width:2,dash:'dash'},name:'Parallel of '+n+' (k='+(k*n).toFixed(1)+' N/mm)'});
    /* Always show BOTH series and parallel for comparison even if user only picked one */
    if(arr!=='series')traces.push({x:xs,y:Fs_series,mode:'lines',line:{color:colSeries,width:1,dash:'dot'},name:'(if Series of '+n+': k='+k_combined.toFixed(1)+')',opacity:0.5});
    if(arr!=='parallel')traces.push({x:xs,y:Fs_parallel,mode:'lines',line:{color:colParallel,width:1,dash:'dot'},name:'(if Parallel of '+n+': k='+(k*n).toFixed(1)+')',opacity:0.5});
  }
  if(isFinite(delta))traces.push({x:[delta],y:[F],mode:'markers',marker:{color:'#fff',size:11,symbol:'diamond',line:{color:'#000',width:1.5}},name:'Operating point'});
  plot('p-spring-fd',traces,{xaxis:{title:'δ deflection (mm)',range:[0,xCharted*1.05]},yaxis:{title:'F force (N)',range:[0,Fmax_chart*1.1]},shapes,showlegend:n>1,legend:{x:0.02,y:0.98,bgcolor:'rgba(0,0,0,0)',font:{size:9}}});
  /* Compressed vs uncompressed animation */
  drawSpringAnim(d,D,nt,fl,Math.max(0.1,fl-delta),type);
  /* Force 3D update */
  if(window.calc3DUpdate)try{window.calc3DUpdate('springs');}catch(e){}
};
function drawSpringAnim(d,D,nt,fl,deflectedL,type){
  const c=$('c-spring-anim');if(!c)return;
  const ctx=c.getContext('2d');const w=c.width,h=c.height;
  const t=pTheme();
  ctx.fillStyle=t.plot;ctx.fillRect(0,0,w,h);
  function drawCoil(cx,scaleY,len,colorEdge,label){
    const coilW=Math.min(120,D*1.5);
    const yTop=20,yBot=h-30;
    const usable=Math.min(len*scaleY,yBot-yTop);
    ctx.strokeStyle=t.dim;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx-coilW/2-10,yTop);ctx.lineTo(cx+coilW/2+10,yTop);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-coilW/2-10,yTop+usable);ctx.lineTo(cx+coilW/2+10,yTop+usable);ctx.stroke();
    ctx.strokeStyle=colorEdge;ctx.lineWidth=Math.max(1,Math.min(4,d*0.6));
    if(type==='belleville'){
      const layers=Math.max(1,Math.floor(usable/Math.max(2,d*1.5)));
      const layerH=usable/layers;
      for(let i=0;i<layers;i++){
        const y=yTop+i*layerH;
        ctx.beginPath();
        ctx.moveTo(cx-coilW/2,y+layerH);
        ctx.lineTo(cx,y);
        ctx.lineTo(cx+coilW/2,y+layerH);
        ctx.stroke();
      }
    }else{
      const turns=Math.max(3,Math.floor(nt));
      const segPerTurn=12;
      const totalSeg=turns*segPerTurn;
      ctx.beginPath();
      for(let i=0;i<=totalSeg;i++){
        const tt=i/totalSeg;
        const y=yTop+tt*usable;
        const phase=tt*turns*Math.PI*2;
        const x=cx+coilW/2*Math.sin(phase);
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    ctx.fillStyle=t.text;ctx.font='11px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText(label,cx,yBot+15);
    ctx.fillText(usable.toFixed(0)+' px ('+len.toFixed(1)+' mm)',cx,yBot+30);
  }
  const scaleY=Math.min(1.5,(h-80)/Math.max(fl,deflectedL,1));
  drawCoil(w*0.30,scaleY,fl,'#22c55e','FREE');
  drawCoil(w*0.70,scaleY,deflectedL,deflectedL>0.1?(deflectedL<fl*0.2?'#ef4444':'#f59e0b'):'#ef4444','LOADED');
  ctx.strokeStyle=pTheme().accent;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(w*0.43,h/2);ctx.lineTo(w*0.57,h/2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(w*0.55,h/2-4);ctx.lineTo(w*0.57,h/2);ctx.lineTo(w*0.55,h/2+4);ctx.stroke();
}
function gateBellevillePresets(){
  /* Card always visible since every spring type has presets, but the
   * dropdown contents are filtered per type so Belleville items only
   * appear when type=belleville. Update card title label too. */
  const card=$('spring-presets-card');if(card)card.style.display='block';
  const type=sv('sp-type')||'compression';
  const set=SPRING_PRESETS[type]||SPRING_PRESETS.compression;
  const h3=card?card.querySelector('h3'):null;
  if(h3)h3.textContent='PRESETS — '+set.label;
  populateSpringPresets();
}

/* Override drawSealDiagram with theme-aware version (original used hardcoded pLayout from closure) */
window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    if(window.drawSealDiagram&&!window.drawSealDiagram.__themed){
      window.drawSealDiagram=function(id,data,unit,color,opPoint,optRange){
        if(!data||data.length<2)return;
        const xs=data.map(d=>d[0]),ys=data.map(d=>d[1]);
        const t=pTheme();
        const traces=[{x:xs,y:ys,type:'scatter',mode:'lines',name:unit,fill:'tozeroy',fillcolor:color+'15',line:{color,width:2.5,shape:'spline'},hovertemplate:'Compression = %{x:.1f}%<br>'+unit+' = %{y:.2f}<extra></extra>'}];
        const shapes=[];
        const yMax=Math.max(...ys)*1.1;
        if(optRange){
          shapes.push({type:'rect',x0:optRange[0]||15,x1:optRange[1]||30,y0:0,y1:yMax,fillcolor:'rgba(34,197,94,0.12)',line:{width:0}});
          shapes.push({type:'line',x0:optRange[0]||15,x1:optRange[0]||15,y0:0,y1:yMax,line:{color:'#22c55e',width:1,dash:'dash'}});
          shapes.push({type:'line',x0:optRange[1]||30,x1:optRange[1]||30,y0:0,y1:yMax,line:{color:'#22c55e',width:1,dash:'dash'}});
        }
        if(opPoint&&opPoint[0]>0){
          const sqColor=opPoint[0]<10?'#3b82f6':opPoint[0]<=30?'#22c55e':opPoint[0]<=40?'#f59e0b':'#ef4444';
          const opVal=(typeof opPoint[1]==='number'&&isFinite(opPoint[1]))?opPoint[1].toFixed(1):'—';
          traces.push({x:[opPoint[0]],y:[opPoint[1]],type:'scatter',mode:'markers',name:'Operating ('+opVal+' '+unit+')',marker:{color:sqColor,size:11,symbol:'diamond',line:{color:'#fff',width:1.5}}});
        }
        plot(id,traces,{title:'',xaxis:{title:'Compression (%)'},yaxis:{title:unit},shapes,showlegend:!!(opPoint&&opPoint[0]>0)});
      };
      window.drawSealDiagram.__themed=true;
    }
  },500);
});

/* ============================================================
 * VIBRATION — shock pulse calculator (half-sine, sawtooth, terminal-peak)
 * ============================================================ */
function injectShockCard(){
  const view=$('v-vibration');if(!view||$('shock-card'))return;
  const left=view.querySelector('.split>div:first-child');if(!left)return;
  const card=document.createElement('div');card.className='card';card.id='shock-card';
  card.innerHTML='<h3>SHOCK PULSE</h3>'+
    '<div class="row">'+
      '<div class="field"><label for="sh-shape">PULSE SHAPE</label><select id="sh-shape"><option value="half-sine">HALF-SINE (most common)</option><option value="sawtooth">SAWTOOTH (terminal-peak)</option><option value="rectangular">RECTANGULAR (square)</option><option value="haversine">HAVERSINE (gentlest)</option></select></div>'+
      '<div class="field"><label for="sh-amp">PEAK G</label><input type="number" id="sh-amp" value="50" step="any"></div>'+
      '<div class="field"><label for="sh-dur">DURATION (ms)</label><input type="number" id="sh-dur" value="11" step="any"></div>'+
      '<div class="field"><label for="sh-fn">SYSTEM f_n (Hz)</label><input type="number" id="sh-fn" value="50" step="any"></div>'+
    '</div>'+
    '<button class="btn btn-sm" onclick="calcShock()">SHOCK RESPONSE</button>';
  left.appendChild(card);
  /* Add output container in the right column */
  const right=view.querySelector('.split>div:last-child');
  if(right&&!$('p-shock')){
    const outCard=document.createElement('div');outCard.className='card';outCard.style.marginTop='.6rem';
    outCard.innerHTML='<h3>SHOCK RESPONSE SPECTRUM</h3><div id="p-shock" style="width:100%;height:280px"></div><div id="shock-out" style="margin-top:.4rem"></div>';
    right.appendChild(outCard);
  }
}
window.calcShock=function(){
  const shape=sv('sh-shape')||'half-sine';
  const G=v('sh-amp');const tau=v('sh-dur')/1000;const fn=v('sh-fn');
  if(!isFinite(G)||!isFinite(tau)||!isFinite(fn)){return;}
  const a_peak=G*9.81;
  let dV;
  switch(shape){
    case 'half-sine':dV=2*a_peak*tau/Math.PI;break;
    case 'sawtooth':dV=a_peak*tau/2;break;
    case 'rectangular':dV=a_peak*tau;break;
    case 'haversine':dV=a_peak*tau/2;break;
    default:dV=a_peak*tau/2;
  }
  /* Shock response spectrum: max response of an SDOF oscillator at varying f_n
   * Approximation using shock amplification factor curves. */
  const fns=[];const Qs=[];
  for(let i=0;i<60;i++){
    const f=Math.pow(10,Math.log10(0.1)+i*(Math.log10(1000)-Math.log10(0.1))/59);
    fns.push(f);
    const omega=2*Math.PI*f;const omega_pulse=2*Math.PI/tau;const ratio=omega/omega_pulse;
    let Q;
    if(shape==='half-sine'){
      Q=ratio<=0.5?2*ratio*Math.sin(Math.PI/(2*ratio))/(1-Math.pow(2*ratio,2)+1e-9):2*ratio/(Math.pow(2*ratio,2)-1+1e-9)*Math.cos(Math.PI/(2*ratio));
    }else if(shape==='rectangular'){
      Q=2*Math.abs(Math.sin(Math.PI*f*tau));
    }else{
      Q=2*Math.PI*f*tau<2?Math.sin(2*Math.PI*f*tau)/(2*Math.PI*f*tau)*ratio*2:0.5;
    }
    Qs.push(Math.min(2.5,Math.max(0,Math.abs(Q||0)*G)));
  }
  /* Peak response at user's system f_n */
  const ratio_user=2*Math.PI*fn/(2*Math.PI/tau);
  const Q_user=Qs.reduce((best,q,i)=>Math.abs(fns[i]-fn)<Math.abs(fns[best]-fn)?i:best,0);
  const a_response=Qs[Q_user];
  const t=pTheme();
  plot('p-shock',[
    {x:fns,y:Qs,mode:'lines',line:{color:t.accent,width:2.5},name:'SRS'},
    {x:[fn],y:[a_response],mode:'markers+text',marker:{color:'#fff',size:11,symbol:'diamond',line:{color:'#000',width:1.5}},text:[fn+' Hz: '+a_response.toFixed(1)+' G'],textposition:'top right',textfont:{color:t.text,size:10}}
  ],{xaxis:{title:'System f_n (Hz)',type:'log'},yaxis:{title:'Peak response (G)'},showlegend:false});
  const out=$('shock-out');if(out){
    const pulse_label={'half-sine':'half-sine','sawtooth':'sawtooth (terminal-peak)','rectangular':'rectangular (square)','haversine':'haversine'}[shape];
    out.innerHTML='<div class="result-grid">'+
      [['Peak accel',G+' G ('+a_peak.toFixed(0)+' m/s²)'],['Pulse '+pulse_label,(tau*1000).toFixed(1)+' ms'],['ΔV (impulse)',(dV*1000).toFixed(1)+' mm/s ('+dV.toFixed(3)+' m/s)'],['Response @ '+fn+' Hz',a_response.toFixed(2)+' G ('+(a_response*9.81).toFixed(0)+' m/s²)'],['Amplification',(a_response/G).toFixed(2)+'×']].map(([l,v])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')+
      '</div>'+
      '<p style="margin-top:.4rem;color:var(--dim);font-size:.7rem">Half-sine ΔV = 2·a_peak·τ/π. SRS peaks near f_n ≈ 1/(2τ). MIL-STD-810 standard half-sine: 50G/11ms (functional shock), 100G/6ms (crash safety). Equipment design: target SRS amp factor ≤ 1.5 by stiffening (raise f_n) or isolating (lower f_n well below 1/τ).</p>';
  }
};

/* ============================================================
 * NEC AMPACITY — Plotly chart instead of inline text
 * ============================================================ */
const NEC_AMPACITY={
  '14':{60:15,75:20,90:25},
  '12':{60:20,75:25,90:30},
  '10':{60:30,75:35,90:40},
  '8':{60:40,75:50,90:55},
  '6':{60:55,75:65,90:75},
  '4':{60:70,75:85,90:95},
  '3':{60:85,75:100,90:110},
  '2':{60:95,75:115,90:130},
  '1':{60:110,75:130,90:150},
  '1/0':{60:125,75:150,90:170},
  '2/0':{60:145,75:175,90:195},
  '3/0':{60:165,75:200,90:225},
  '4/0':{60:195,75:230,90:260},
  '250':{60:215,75:255,90:290},
  '300':{60:240,75:285,90:320},
  '350':{60:260,75:310,90:350},
  '400':{60:280,75:335,90:380},
  '500':{60:320,75:380,90:430},
  '600':{60:355,75:420,90:475},
  '750':{60:400,75:475,90:535},
  '1000':{60:455,75:545,90:615}
};
function injectNECChart(){
  const view=$('v-nec');if(!view||$('p-nec-amp'))return;
  const right=view.querySelector('.split>div:last-child');if(!right)return;
  /* Find existing AMPACITY TABLE card and replace its <p> with our Plotly */
  const cards=right.querySelectorAll('.card');
  let ampCard=null;
  cards.forEach(c=>{const h=c.querySelector('h3');if(h&&/AMPACITY/i.test(h.textContent))ampCard=c;});
  if(!ampCard){
    ampCard=document.createElement('div');ampCard.className='card';ampCard.style.marginTop='.6rem';
    ampCard.innerHTML='<h3>NEC 310.16 AMPACITY (Cu, °C)</h3>';
    right.appendChild(ampCard);
  }
  /* Remove text paragraph if any */
  const p=ampCard.querySelector('p');if(p)p.remove();
  let plotDiv=ampCard.querySelector('#p-nec-amp');
  if(!plotDiv){
    plotDiv=document.createElement('div');plotDiv.id='p-nec-amp';plotDiv.style.cssText='width:100%;height:340px';
    ampCard.appendChild(plotDiv);
  }
  const awgs=Object.keys(NEC_AMPACITY);
  const xs=awgs.map((_,i)=>i);
  const t=pTheme();
  plot('p-nec-amp',[
    {x:xs,y:awgs.map(a=>NEC_AMPACITY[a][60]),mode:'lines+markers',line:{color:'#3b82f6',width:2},marker:{size:6},name:'60°C'},
    {x:xs,y:awgs.map(a=>NEC_AMPACITY[a][75]),mode:'lines+markers',line:{color:'#f59e0b',width:2},marker:{size:6},name:'75°C'},
    {x:xs,y:awgs.map(a=>NEC_AMPACITY[a][90]),mode:'lines+markers',line:{color:'#ef4444',width:2},marker:{size:6},name:'90°C'}
  ],{
    xaxis:{title:'Conductor size (smaller → larger →)',tickmode:'array',tickvals:xs,ticktext:awgs,tickangle:-45},
    yaxis:{title:'Ampacity (A)',type:'log'},
    showlegend:true,
    legend:{x:0.02,y:0.98,bgcolor:'rgba(0,0,0,0)',font:{size:10,color:t.text}}
  });
}

/* ============================================================
 * ELECTRICAL — phasor diagram, transformer sizing, short-circuit
 * ============================================================ */
function injectElectricalExtras(){
  const view=$('v-electrical');if(!view)return;
  const left=view.querySelector('.split>div:first-child');
  const right=view.querySelector('.split>div:last-child');
  if(!left||!right)return;
  /* Transformer sizing card */
  if(!$('xfmr-card')){
    const card=document.createElement('div');card.className='card';card.id='xfmr-card';
    card.innerHTML='<h3>TRANSFORMER SIZING</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="xf-kva">RATED kVA</label><input type="number" id="xf-kva" value="75" step="any"></div>'+
        '<div class="field"><label for="xf-vp">PRIMARY V (LL)</label><input type="number" id="xf-vp" value="480" step="any"></div>'+
        '<div class="field"><label for="xf-vs">SECONDARY V (LL)</label><input type="number" id="xf-vs" value="208" step="any"></div>'+
        '<div class="field"><label for="xf-z">% IMPEDANCE Z</label><input type="number" id="xf-z" value="5.75" step="0.05"></div>'+
        '<div class="field"><label for="xf-ph">PHASE</label><select id="xf-ph"><option value="3">3-Φ</option><option value="1">1-Φ</option></select></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcXfmr()">FLA / SCC</button>';
    left.appendChild(card);
  }
  /* Phasor diagram chart in right column */
  if(!$('p-phasor')){
    const card=document.createElement('div');card.className='card';card.style.marginTop='.6rem';
    card.innerHTML='<h3>POWER PHASOR DIAGRAM</h3><div id="p-phasor" style="width:100%;height:320px"></div><div id="phasor-out" style="margin-top:.4rem"></div>';
    right.appendChild(card);
  }
}
window.calcXfmr=function(){
  const kva=v('xf-kva'),Vp=v('xf-vp'),Vs=v('xf-vs'),Z=v('xf-z'),ph=parseInt(sv('xf-ph'))||3;
  if(!isFinite(kva)||!isFinite(Vp)||!isFinite(Vs)||!isFinite(Z))return;
  const factor=ph===3?Math.sqrt(3):1;
  const FLA_p=kva*1000/(factor*Vp);
  const FLA_s=kva*1000/(factor*Vs);
  const SCC_s=FLA_s/(Z/100);
  const I2t_thermal=Math.pow(SCC_s,2)*0.1;
  const Z_per_unit=Z/100;
  const turnsRatio=Vp/Vs;
  const out=$('xfmr-card');if(!out)return;
  let html=out.innerHTML.split('<button')[0];
  html+='<button class="btn btn-sm" onclick="calcXfmr()">FLA / SCC</button>';
  html+='<div class="result-grid" style="margin-top:.5rem">'+
    [['Primary FLA',FLA_p.toFixed(1)+' A'],['Secondary FLA',FLA_s.toFixed(1)+' A'],['Turns ratio',turnsRatio.toFixed(2)+':1'],['SCC (sec, 3-cyc)',SCC_s.toFixed(0)+' A',SCC_s>10000?'warn':'ok'],['Z per-unit',Z_per_unit.toFixed(4)],['I²t (~6-cyc, 0.1s)',I2t_thermal.toExponential(2)+' A²·s']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>NEC 240.21 secondary tap rules:</strong> 10-ft tap allows downstream OCPD if conductors ≥ 1/10 of primary OCPD rating; 25-ft tap requires conductors ≥ 1/3 of primary rating. <strong>Short-circuit:</strong> SCC = FLA / (Z/100) — coordinate with branch breaker AIC rating. <strong>Inrush:</strong> typical 8-12× FLA for first cycle, decay over 0.1 s. Use NEMA TP 1 efficiencies for sizing-vs-loss tradeoff.</p>';
  out.innerHTML=html;
};
window.calcACPower=function(){
  /* Override the obfuscated calcACPower to also draw a Plotly phasor */
  const V=v('ac-v'),I=v('ac-i'),PF=v('ac-pf');
  if(!isFinite(V)||!isFinite(I)||!isFinite(PF))return;
  const S=V*I,P=S*PF,Q=Math.sqrt(Math.max(0,S*S-P*P)),angle=Math.acos(Math.max(-1,Math.min(1,PF)))*180/Math.PI;
  const t=pTheme();
  /* Phasor: P along x-axis, Q along y-axis, S as resultant */
  const traces=[
    {x:[0,P],y:[0,0],mode:'lines+markers',line:{color:'#22c55e',width:3},marker:{size:[0,8]},name:'P (Real)','hoverinfo':'name'},
    {x:[P,P],y:[0,Q],mode:'lines+markers',line:{color:'#f59e0b',width:3,dash:'dash'},marker:{size:[0,8]},name:'Q (Reactive)','hoverinfo':'name'},
    {x:[0,P],y:[0,Q],mode:'lines+markers',line:{color:t.accent,width:3.5},marker:{size:[0,10]},name:'S (Apparent)','hoverinfo':'name'},
    {x:[P*0.5,P,P*0.5],y:[Q*0.05,Q*0.5,Q*0.95],mode:'text',text:['P='+P.toFixed(0)+' W','Q='+Q.toFixed(0)+' VAR','S='+S.toFixed(0)+' VA'],textposition:['top center','middle right','bottom right'],textfont:{color:t.text,size:11},showlegend:false}
  ];
  const maxA=Math.max(P,Q,S)*1.15;
  plot('p-phasor',traces,{
    xaxis:{title:'Real power P (W)',range:[0,maxA],zeroline:true,scaleanchor:'y',scaleratio:1},
    yaxis:{title:'Reactive power Q (VAR)',range:[0,maxA],zeroline:true},
    showlegend:false
  });
  const phaseLabel=Q>=0?'Lagging (inductive)':'Leading (capacitive)';
  const out=$('phasor-out');if(out){
    out.innerHTML='<div class="result-grid">'+
      [['S apparent',S.toFixed(0)+' VA'],['P real',P.toFixed(0)+' W'],['Q reactive',Q.toFixed(0)+' VAR'],['PF',PF.toFixed(3)],['φ (angle)',angle.toFixed(1)+'°'],['Type',phaseLabel]].map(([l,v])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')+
      '</div>';
  }
  /* Also write to electrical-results in standard form so other callers see it */
  const er=$('electrical-results');if(er)er.innerHTML='<h3>AC POWER</h3>'+(out?out.innerHTML:'');
};

/* ============================================================
 * MOTORS — torque-speed curves (NEMA A/B/C/D), starting current
 * ============================================================ */
function injectMotorExtras(){
  const view=$('v-motors');if(!view)return;
  const left=view.querySelector('.split>div:first-child');
  const right=view.querySelector('.split>div:last-child');
  if(!left||!right)return;
  if(!$('mt-ts-card')){
    const card=document.createElement('div');card.className='card';card.id='mt-ts-card';
    card.innerHTML='<h3>TORQUE-SPEED (NEMA DESIGN)</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="mt-ts-design">NEMA DESIGN</label><select id="mt-ts-design"><option value="B">B (general purpose, fans/pumps)</option><option value="A">A (high SF, drill presses)</option><option value="C">C (high starting torque, conveyors)</option><option value="D">D (very high torque, low slip)</option></select></div>'+
        '<div class="field"><label for="mt-ts-pfl">RATED kW</label><input type="number" id="mt-ts-pfl" value="7.5" step="any"></div>'+
        '<div class="field"><label for="mt-ts-nfl">FL SPEED (rpm)</label><input type="number" id="mt-ts-nfl" value="1750" step="any"></div>'+
        '<div class="field"><label for="mt-ts-ns">SYNC SPEED (rpm)</label><input type="number" id="mt-ts-ns" value="1800" step="any"></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcMotorTSC()">PLOT</button>';
    left.appendChild(card);
  }
  if(!$('p-motor-ts')){
    const card=document.createElement('div');card.className='card';card.style.marginTop='.6rem';
    card.innerHTML='<h3>TORQUE-SPEED CURVE</h3><div id="p-motor-ts" style="width:100%;height:320px"></div><div id="motor-ts-out" style="margin-top:.4rem"></div>';
    right.appendChild(card);
  }
  if(!$('mt-frame-card')){
    const card=document.createElement('div');card.className='card';card.style.marginTop='.6rem';card.id='mt-frame-card';
    card.innerHTML='<h3>NEMA FRAME LOOKUP</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="mt-fr-hp">HP</label><input type="number" id="mt-fr-hp" value="10" step="0.5"></div>'+
        '<div class="field"><label for="mt-fr-rpm">SYNC RPM</label><select id="mt-fr-rpm"><option>3600</option><option selected>1800</option><option>1200</option><option>900</option></select></div>'+
        '<div class="field"><label for="mt-fr-encl">ENCLOSURE</label><select id="mt-fr-encl"><option value="ODP">ODP (open drip-proof)</option><option value="TEFC">TEFC (totally-enclosed fan-cooled)</option></select></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcNemaFrame()">FRAME</button>';
    left.appendChild(card);
  }
}
const NEMA_DESIGN={
  A:{LRT:1.2,BDT:2.5,PUT:1.8,LRC:7.5,slip:0.04,note:'Hard to start, very high SF, niche use (drill presses)'},
  B:{LRT:1.4,BDT:2.5,PUT:1.6,LRC:6.5,slip:0.04,note:'Most common — general industry: pumps, fans, blowers, machine tools'},
  C:{LRT:2.0,BDT:2.0,PUT:1.5,LRC:5.5,slip:0.05,note:'High starting torque — conveyors, compressors loaded at start'},
  D:{LRT:2.75,BDT:2.75,PUT:0,LRC:4.0,slip:0.10,note:'Very high starting torque, high slip — flywheels, punch presses, hoists'}
};
window.calcMotorTSC=function(){
  const dKey=sv('mt-ts-design')||'B',d=NEMA_DESIGN[dKey];
  const Pkw=v('mt-ts-pfl'),Nfl=v('mt-ts-nfl'),Ns=v('mt-ts-ns');
  if(!isFinite(Pkw)||!isFinite(Nfl)||!isFinite(Ns))return;
  const Tfl=Pkw*9550/Nfl;
  const npts=80;
  const speeds=Array.from({length:npts},(_,i)=>i*Ns/(npts-1));
  /* Approximate normalized torque-speed curve following NEMA shape:
   * locked-rotor torque at s=1, falls slightly to pull-up at s~0.7,
   * climbs to breakdown at s~0.2-0.3, drops to zero at s=0 (sync) */
  const torques=speeds.map(N=>{
    const s=(Ns-N)/Ns;
    if(s<=0)return 0;
    if(s>=1)return Tfl*d.LRT;
    /* Composite curve: pull-up minimum then breakdown peak */
    const pullupS=0.7,breakdownS=0.2;
    let t;
    if(s>=pullupS){
      t=d.PUT+(d.LRT-d.PUT)*((s-pullupS)/(1-pullupS));
    }else if(s>=breakdownS){
      t=d.BDT-(d.BDT-d.PUT)*((s-breakdownS)/(pullupS-breakdownS));
    }else{
      t=d.BDT*(s/breakdownS)*(2-s/breakdownS);
    }
    return t*Tfl;
  });
  const t=pTheme();
  plot('p-motor-ts',[
    {x:speeds,y:torques,mode:'lines',line:{color:t.accent,width:2.5},name:'Motor T-N curve',fill:'tozeroy',fillcolor:'rgba(255,107,53,0.10)'},
    {x:[Nfl],y:[Tfl],mode:'markers+text',marker:{color:'#22c55e',size:11,symbol:'star'},text:['FL: '+Tfl.toFixed(1)+' N·m'],textposition:'top right',textfont:{color:t.text,size:10},name:'FL'},
    {x:[0],y:[Tfl*d.LRT],mode:'markers+text',marker:{color:'#ef4444',size:9,symbol:'square'},text:['LRT'],textposition:'top right',textfont:{color:t.text,size:10},name:'LRT'},
    {x:[Ns*(1-0.20)],y:[Tfl*d.BDT],mode:'markers+text',marker:{color:'#f59e0b',size:9,symbol:'triangle-up'},text:['BDT'],textposition:'top center',textfont:{color:t.text,size:10},name:'Breakdown'}
  ],{xaxis:{title:'Speed (rpm)',range:[0,Ns*1.05]},yaxis:{title:'Torque (N·m)',range:[0,Tfl*d.LRT*1.2]},showlegend:false});
  const out=$('motor-ts-out');if(out){
    out.innerHTML='<div class="result-grid">'+
      [['Design',dKey],['T_FL (full load)',Tfl.toFixed(2)+' N·m'],['T_LR (locked rotor)',(Tfl*d.LRT).toFixed(1)+' N·m ('+(d.LRT*100).toFixed(0)+'% FL)'],['T_BD (breakdown)',(Tfl*d.BDT).toFixed(1)+' N·m ('+(d.BDT*100).toFixed(0)+'%)'],['I_LR / I_FL',(d.LRC).toFixed(1)+'×'],['Rated slip',(d.slip*100).toFixed(1)+'%']].map(([l,v])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')+
      '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>'+dKey+':</strong> '+d.note+'.<br><strong>Starting current:</strong> ~'+d.LRC.toFixed(1)+'× FLA across-the-line. Use soft-start or VFD to limit inrush. <strong>Across-the-line OK</strong> if utility transformer ≥ 5× motor kVA. <strong>Code letter:</strong> NEMA Code G ≈ 6.0 kVA/HP locked rotor; B/C usually fall in F-G.</p>';
  }
};
const NEMA_FRAMES={
  3600:{1:'56','1.5':'56','2':'56','3':'145T','5':'182T','7.5':'184T','10':'213T','15':'215T','20':'254T','25':'256T','30':'284TS','40':'286TS','50':'324TS','60':'326TS','75':'364TS','100':'365TS'},
  1800:{'0.5':'48','0.75':'56','1':'143T','1.5':'145T','2':'145T','3':'182T','5':'184T','7.5':'213T','10':'215T','15':'254T','20':'256T','25':'284T','30':'286T','40':'324T','50':'326T','60':'364T','75':'365T','100':'404T','125':'405T','150':'444T','200':'445T'},
  1200:{1:'145T','1.5':'182T','2':'184T','3':'213T','5':'215T','7.5':'254T','10':'256T','15':'284T','20':'286T','25':'324T','30':'326T','40':'364T','50':'365T','60':'404T','75':'405T','100':'444T'},
  900:{1:'182T','1.5':'184T','2':'213T','3':'215T','5':'254T','7.5':'256T','10':'284T','15':'286T','20':'324T','25':'326T','30':'364T','40':'365T','50':'404T','60':'405T','75':'444T'}
};
window.calcNemaFrame=function(){
  const hp=v('mt-fr-hp'),rpm=parseInt(sv('mt-fr-rpm'))||1800,enc=sv('mt-fr-encl')||'ODP';
  if(!isFinite(hp))return;
  const table=NEMA_FRAMES[rpm];if(!table)return;
  const sizes=Object.keys(table).map(parseFloat).sort((a,b)=>a-b);
  let pick=sizes[sizes.length-1];
  for(const s of sizes){if(s>=hp){pick=s;break;}}
  const frame=table[String(pick)];
  /* TEFC adds typically 1 frame size (e.g. 213T → 215T) */
  const tefcFrame=enc==='TEFC'&&frame?frame.replace(/T$/,'TZ').replace(/(\d{3})/,m=>(parseInt(m)+2)+''):frame;
  const finalFrame=enc==='TEFC'?tefcFrame:frame;
  const card=$('mt-frame-card');if(!card)return;
  let html=card.innerHTML.split('<button')[0];
  html+='<button class="btn btn-sm" onclick="calcNemaFrame()">FRAME</button>';
  html+='<div class="result-grid" style="margin-top:.5rem">'+
    [['Required HP',pick+' HP'],['NEMA frame',finalFrame||'—'],['Speed class',rpm+' rpm sync ('+(rpm===3600?'2-pole':rpm===1800?'4-pole':rpm===1200?'6-pole':'8-pole')+')'],['Enclosure',enc]].map(([l,v])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')+
    '</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">NEMA MG-1 standard frames. T-frame (1964+) replaces older U-frame. TEFC frames typically one size up from ODP for same HP. Shaft and bolt patterns are interchangeable within frame number for OEM swap-out.</p>';
  card.innerHTML=html;
};

/* ============================================================
 * HEAT TRANSFER — fin efficiency curve + Heisler chart
 * ============================================================ */
function injectThermalExtras(){
  const view=$('v-thermal');if(!view)return;
  const right=view.querySelector('.split>div:last-child');if(!right)return;
  if(!$('p-fin-eff')){
    const card=document.createElement('div');card.className='card';card.style.marginTop='.6rem';
    card.innerHTML='<h3>FIN EFFICIENCY CURVE</h3><div id="p-fin-eff" style="width:100%;height:280px"></div>'+
      '<p class="note" style="margin-top:.3rem;color:var(--dim);font-size:.7rem">Rectangular straight fin: η = tanh(mL_c) / (mL_c) where m = √(2h / (k·t)) and L_c = L + t/2. Curve shown for typical aluminum (k=200 W/m·K), t=2 mm, h=25 W/m²·K. Optimal mL_c ≈ 1 (η≈75%).</p>';
    right.appendChild(card);
  }
  setTimeout(plotFinEfficiency,100);
}
function plotFinEfficiency(){
  const k=200,tFin=0.002,h=25,m=Math.sqrt(2*h/(k*tFin));
  const mLcs=[],etas=[];
  for(let i=1;i<=120;i++){const mLc=i*0.05;mLcs.push(mLc);etas.push(Math.tanh(mLc)/mLc);}
  const t=pTheme();
  plot('p-fin-eff',[
    {x:mLcs,y:etas,mode:'lines',line:{color:t.accent,width:2.5},name:'η_fin'},
    {x:[1],y:[Math.tanh(1)/1],mode:'markers+text',marker:{color:'#22c55e',size:10,symbol:'diamond'},text:['mL_c=1, η=76%'],textposition:'top right',textfont:{color:t.text,size:10}},
    {x:[2],y:[Math.tanh(2)/2],mode:'markers+text',marker:{color:'#f59e0b',size:10,symbol:'square'},text:['mL_c=2, η=48%'],textposition:'top right',textfont:{color:t.text,size:10}}
  ],{xaxis:{title:'Fin parameter mL_c'},yaxis:{title:'Fin efficiency η',range:[0,1.05]},showlegend:false});
}

/* ============================================================
 * PUMPS — off-the-shelf curves vs system curve
 * ============================================================ */
const PUMP_MODELS={
  'Goulds 3196 STX (1.5x3-13)':{Qbep:50,Hbep:35,Hmax:42,NPSHr:2.5,Pmax:100,rpm:1750,note:'Std end-suction process pump, ANSI B73.1'},
  'Goulds 3196 MTX (3x4-13)':{Qbep:200,Hbep:32,Hmax:40,NPSHr:3.0,Pmax:300,rpm:1750,note:'Std process, mid-flow'},
  'Goulds 3196 LTX (4x6-13)':{Qbep:500,Hbep:30,Hmax:38,NPSHr:4.5,Pmax:600,rpm:1750,note:'Larger LTX frame'},
  'Goulds 3196 XLT (6x8-15)':{Qbep:1200,Hbep:35,Hmax:43,NPSHr:6.0,Pmax:1500,rpm:1750,note:'Extra-large process pump'},
  'Grundfos CR 5-9 (multistage)':{Qbep:7,Hbep:90,Hmax:115,NPSHr:1.5,Pmax:15,rpm:2900,note:'Vertical multistage 9 stages, 50 Hz'},
  'Grundfos CR 32-2-2':{Qbep:45,Hbep:25,Hmax:32,NPSHr:2.0,Pmax:75,rpm:2900,note:'Higher-flow multistage'},
  'Sulzer AHLSTAR APP 22-200':{Qbep:300,Hbep:50,Hmax:60,NPSHr:3.0,Pmax:400,rpm:1450,note:'Process / pulp & paper'},
  'KSB Etanorm 50-200':{Qbep:80,Hbep:40,Hmax:48,NPSHr:2.5,Pmax:150,rpm:2900,note:'EN 733 std centrifugal'},
  'Crane Deming 5x4-10':{Qbep:400,Hbep:25,Hmax:30,NPSHr:3.5,Pmax:300,rpm:1750,note:'End-suction commercial'}
};
function injectPumpExtras(){
  const view=$('v-pumps');if(!view)return;
  const left=view.querySelector('.split>div:first-child');
  const right=view.querySelector('.split>div:last-child');
  if(!left||!right)return;
  if(!$('pump-system-card')){
    const card=document.createElement('div');card.className='card';card.id='pump-system-card';
    card.innerHTML='<h3>OFF-THE-SHELF PUMP vs SYSTEM CURVE</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="pmp-model">PUMP MODEL</label><select id="pmp-model"></select></div>'+
        '<div class="field"><label for="pmp-hstat">STATIC HEAD (m)</label><input type="number" id="pmp-hstat" value="10" step="any"></div>'+
        '<div class="field"><label for="pmp-kfric">FRICTION COEFF k (m·s²/m⁶)</label><input type="number" id="pmp-kfric" value="0.005" step="any"></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcPumpCurve()">PLOT</button>';
    left.appendChild(card);
  }
  const sel=$('pmp-model');
  if(sel&&!sel.children.length){
    Object.keys(PUMP_MODELS).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k+' — '+PUMP_MODELS[k].Qbep+' m³/h @ '+PUMP_MODELS[k].Hbep+' m';sel.appendChild(o);});
  }
  if(!$('p-pump-curve')){
    const card=document.createElement('div');card.className='card';card.style.marginTop='.6rem';
    card.innerHTML='<h3>PUMP / SYSTEM CURVES</h3><div id="p-pump-curve" style="width:100%;height:340px"></div><div id="pump-op-out" style="margin-top:.4rem"></div>';
    right.appendChild(card);
  }
}
window.calcPumpCurve=function(){
  const model=PUMP_MODELS[sv('pmp-model')]||PUMP_MODELS['Goulds 3196 MTX (3x4-13)'];
  const Hstat=v('pmp-hstat')||10,k=v('pmp-kfric')||0.005;
  /* Pump curve as parabola: H = Hmax - (Hmax-Hbep)*(Q/Qbep)² */
  const Qmax=model.Qbep*1.6;
  const npts=80;
  const Qs=Array.from({length:npts},(_,i)=>i*Qmax/(npts-1));
  const Hpump=Qs.map(Q=>model.Hmax-(model.Hmax-model.Hbep)*Math.pow(Q/model.Qbep,2));
  const Hsys=Qs.map(Q=>Hstat+k*Q*Q);
  /* Find intersection by interpolation */
  let opIdx=0;for(let i=1;i<npts;i++){if(Hsys[i]>=Hpump[i]&&Hsys[i-1]<Hpump[i-1]){opIdx=i;break;}}
  const Qop=Qs[opIdx]||model.Qbep,Hop=Hpump[opIdx]||model.Hbep;
  /* Efficiency proxy: parabola peaking at Qbep */
  const effMax=0.78,effOp=effMax*(1-Math.pow((Qop-model.Qbep)/(model.Qbep*0.7),2));
  /* Brake power: P = ρ·g·Q·H/η; ρ=1000 kg/m³, Q m³/s, H m */
  const Qsi=Qop/3600;
  const Pbrake=1000*9.81*Qsi*Hop/Math.max(0.1,effOp)/1000;
  const t=pTheme();
  plot('p-pump-curve',[
    {x:Qs,y:Hpump,mode:'lines',line:{color:t.accent,width:2.5},name:'Pump H-Q'},
    {x:Qs,y:Hsys,mode:'lines',line:{color:'#3b82f6',width:2.5,dash:'dash'},name:'System curve'},
    {x:[Qop],y:[Hop],mode:'markers+text',marker:{color:'#22c55e',size:13,symbol:'star',line:{color:'#000',width:1}},text:['OP: '+Qop.toFixed(0)+' m³/h, '+Hop.toFixed(1)+' m'],textposition:'top right',textfont:{color:t.text,size:11}},
    {x:[model.Qbep],y:[model.Hbep],mode:'markers+text',marker:{color:'#f59e0b',size:10,symbol:'diamond'},text:['BEP'],textposition:'bottom right',textfont:{color:t.text,size:10}}
  ],{xaxis:{title:'Flow Q (m³/h)',range:[0,Qmax]},yaxis:{title:'Head H (m)',range:[0,model.Hmax*1.1]},showlegend:true,legend:{x:0.65,y:0.98,bgcolor:'rgba(0,0,0,0)',font:{size:10,color:t.text}}});
  const out=$('pump-op-out');if(out){
    const offBep=Math.abs(Qop-model.Qbep)/model.Qbep*100;
    const opStatus=offBep<10?'ok':offBep<30?'warn':'err';
    const opLabel=offBep<10?'In sweet spot':offBep<30?'Off BEP — efficiency drop':'Far from BEP — recirc/cavitation risk';
    out.innerHTML='<div class="result-grid">'+
      [['Operating Q',Qop.toFixed(1)+' m³/h'],['Operating H',Hop.toFixed(1)+' m'],['Off-BEP %',offBep.toFixed(1)+'%',opStatus],['Efficiency',(effOp*100).toFixed(1)+'%'],['Brake power',Pbrake.toFixed(2)+' kW'],['NPSHr (BEP)',model.NPSHr.toFixed(1)+' m']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
      '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>'+opLabel+'</strong>. '+model.note+'. Operate within ±20% of BEP. Verify NPSHa &gt; NPSHr+1m. Below 50% BEP risk: recirculation, vibration, seal failure. Above 120% BEP: low NPSHa margin, cavitation, motor overload.</p>';
  }
};

/* ============================================================
 * PRESSURE VESSELS — head types, nozzle reinforcement, lifting lug
 * ============================================================ */
function injectPVExtras(){
  const view=$('v-pv');if(!view)return;
  const left=view.querySelector('.split>div:first-child');
  const right=view.querySelector('.split>div:last-child');
  if(!left||!right)return;
  if(!$('pv-head-card')){
    const card=document.createElement('div');card.className='card';card.id='pv-head-card';
    card.innerHTML='<h3>HEAD THICKNESS (ASME VIII-1)</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="pvh-type">HEAD TYPE</label><select id="pvh-type"><option value="hemi">HEMISPHERICAL</option><option value="ellip" selected>ELLIPSOIDAL 2:1</option><option value="tori">TORISPHERICAL (F&D)</option><option value="flat">FLAT (gasketed)</option></select></div>'+
        '<div class="field"><label for="pvh-p">P (MPa)</label><input type="number" id="pvh-p" value="1.5" step="any"></div>'+
        '<div class="field"><label for="pvh-d">D (mm, internal)</label><input type="number" id="pvh-d" value="1000" step="any"></div>'+
        '<div class="field"><label for="pvh-sa">S allow (MPa)</label><input type="number" id="pvh-sa" value="120" step="any"></div>'+
        '<div class="field"><label for="pvh-e">E (joint eff)</label><input type="number" id="pvh-e" value="1.0" step="0.05"></div>'+
        '<div class="field"><label for="pvh-ca">C.A. (mm)</label><input type="number" id="pvh-ca" value="3" step="any"></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcPVHead()">t_head</button>';
    left.appendChild(card);
  }
  if(!$('pv-nozzle-card')){
    const card=document.createElement('div');card.className='card';card.id='pv-nozzle-card';
    card.innerHTML='<h3>NOZZLE REINFORCEMENT (UG-37)</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="pvn-do">NOZZLE OD (mm)</label><input type="number" id="pvn-do" value="100" step="any"></div>'+
        '<div class="field"><label for="pvn-tn">NOZZLE t (mm)</label><input type="number" id="pvn-tn" value="6" step="any"></div>'+
        '<div class="field"><label for="pvn-ts">SHELL t (mm)</label><input type="number" id="pvn-ts" value="10" step="any"></div>'+
        '<div class="field"><label for="pvn-tr">SHELL t_req (mm)</label><input type="number" id="pvn-tr" value="6" step="any"></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcPVNozzle()">A_req / Pad?</button>';
    left.appendChild(card);
  }
  if(!$('pv-lug-card')){
    const card=document.createElement('div');card.className='card';card.id='pv-lug-card';
    card.innerHTML='<h3>LIFTING LUG (single-lug)</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="pvl-w">VESSEL WT (kg)</label><input type="number" id="pvl-w" value="2000" step="any"></div>'+
        '<div class="field"><label for="pvl-n"># LUGS</label><input type="number" id="pvl-n" value="2" step="1"></div>'+
        '<div class="field"><label for="pvl-d">PIN HOLE Ø (mm)</label><input type="number" id="pvl-d" value="40" step="any"></div>'+
        '<div class="field"><label for="pvl-t">LUG t (mm)</label><input type="number" id="pvl-t" value="20" step="any"></div>'+
        '<div class="field"><label for="pvl-w2">LUG W (mm)</label><input type="number" id="pvl-w2" value="120" step="any"></div>'+
        '<div class="field"><label for="pvl-sa">S allow (MPa)</label><input type="number" id="pvl-sa" value="120" step="any"></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcPVLug()">CHECK</button>';
    left.appendChild(card);
  }
}
window.calcPVHead=function(){
  const type=sv('pvh-type')||'ellip';
  const P=v('pvh-p'),D=v('pvh-d'),S=v('pvh-sa'),E=v('pvh-e'),CA=v('pvh-ca')||0;
  if(!isFinite(P)||!isFinite(D)||!isFinite(S)||!isFinite(E))return;
  let t,formula;
  switch(type){
    case 'hemi':t=P*D/(2*(2*S*E-0.2*P));formula='t = P·D / (2·(2·S·E − 0.2·P))';break;
    case 'ellip':t=P*D/(2*S*E-0.2*P);formula='t = P·D / (2·S·E − 0.2·P) (K=1 for 2:1)';break;
    case 'tori':t=0.885*P*D/(S*E-0.1*P);formula='t = 0.885·P·L / (S·E − 0.1·P) (M=1.0 for L/r=10:1)';break;
    case 'flat':t=D*Math.sqrt(0.33*P/(S*E));formula='t = D·√(C·P/(S·E)) (C=0.33 gasketed)';break;
  }
  const tTotal=t+CA;
  const pvCard=$('pv-head-card');if(!pvCard)return;
  let html=pvCard.innerHTML.split('<button')[0]+'<button class="btn btn-sm" onclick="calcPVHead()">t_head</button>';
  html+='<div class="result-grid" style="margin-top:.5rem">'+
    [['t_required',t.toFixed(3)+' mm'],['t_total (with C.A.)',tTotal.toFixed(3)+' mm'],['Head type',type==='hemi'?'Hemispherical':type==='ellip'?'Ellipsoidal 2:1':type==='tori'?'Torispherical F&D':'Flat']].map(([l,v])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>Formula:</strong> '+formula+'. <strong>Selection:</strong> Hemi gives thinnest head but tallest profile and most expensive. Ellipsoidal 2:1 is standard process choice. Torispherical (F&D) uses flat-bottom forming, common low-pressure storage. Add corrosion allowance per service. Verify spot-radiography per UW-12 for E (1.0 full RT, 0.85 spot, 0.70 none).</p>';
  pvCard.innerHTML=html;
};
window.calcPVNozzle=function(){
  const dO=v('pvn-do'),tn=v('pvn-tn'),ts=v('pvn-ts'),tr=v('pvn-tr');
  if(!isFinite(dO)||!isFinite(tn)||!isFinite(ts)||!isFinite(tr))return;
  const d=dO-2*tn;
  const A_req=d*tr;
  const A1=d*(ts-tr);
  const A2=2*tn*(2.5*tn);
  const A_avail=A1+A2;
  const pad_needed=A_avail<A_req;
  const A_short=A_req-A_avail;
  const pad_t=pad_needed?A_short/(2*dO):0;
  const card=$('pv-nozzle-card');if(!card)return;
  let html=card.innerHTML.split('<button')[0]+'<button class="btn btn-sm" onclick="calcPVNozzle()">A_req / Pad?</button>';
  html+='<div class="result-grid" style="margin-top:.5rem">'+
    [['Opening d',d.toFixed(1)+' mm'],['A required',A_req.toFixed(1)+' mm²'],['A from shell',A1.toFixed(1)+' mm²'],['A from nozzle',A2.toFixed(1)+' mm²'],['A total available',A_avail.toFixed(1)+' mm²',A_avail>=A_req?'ok':'err'],['Pad needed?',pad_needed?'YES':'NO',pad_needed?'warn':'ok'],['Pad t (min)',pad_needed?pad_t.toFixed(1)+' mm':'—']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">UG-37 area-replacement rule: cross-sectional area removed from shell by the opening (A_req = d·t_r) must be replaced by metal within the reinforcement zone. Available metal = excess shell thickness × d + nozzle wall × 2.5·t_n on each side. If short, add a reinforcement pad. Pad diameter typically d_pad = 2·d for full credit.</p>';
  card.innerHTML=html;
};
window.calcPVLug=function(){
  const W=v('pvl-w'),n=Math.max(1,v('pvl-n')||1),d=v('pvl-d'),t=v('pvl-t'),w=v('pvl-w2'),S=v('pvl-sa');
  if(!isFinite(W))return;
  const F_per=W*9.81/n;
  const factor=2.0;
  const F_design=F_per*factor;
  const A_pin=d*t;
  const sigma_bear=F_design/A_pin;
  const A_tear=2*((w-d)/2)*t;
  const tau_tear=F_design/A_tear;
  const A_net=(w-d)*t;
  const sigma_tens=F_design/A_net;
  const card=$('pv-lug-card');if(!card)return;
  let html=card.innerHTML.split('<button')[0]+'<button class="btn btn-sm" onclick="calcPVLug()">CHECK</button>';
  html+='<div class="result-grid" style="margin-top:.5rem">'+
    [['F per lug (1g)',F_per.toFixed(0)+' N'],['F design (×'+factor+')',F_design.toFixed(0)+' N'],['σ bearing',sigma_bear.toFixed(1)+' MPa',sigma_bear<S?'ok':'err'],['τ tear-out',tau_tear.toFixed(1)+' MPa',tau_tear<0.6*S?'ok':'err'],['σ tensile (net sec)',sigma_tens.toFixed(1)+' MPa',sigma_tens<S?'ok':'err'],['Allowable',S+' MPa']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>ASME B30.20 / OSHA:</strong> Design factor 2× for fixed lugs, 5× for slings. Bearing stress on pin: F/(d·t). Tear-out (double shear): F/(2·a·t) where a = edge distance. Tensile through net section: F/((w-d)·t). All < S_allow. Welded lug to shell: check fillet weld + base metal HAZ separately.</p>';
  card.innerHTML=html;
};

/* ============================================================
 * WELDS — electrode selection, deposition rate, prequalified joints
 * ============================================================ */
const WELD_ELECTRODES={
  'mild_steel':{
    label:'Mild / Carbon Steel (A36, 1018, A572 Gr 50)',
    SMAW:['E6010 (DCEP all-pos, root)','E6011 (AC root)','E6013 (AC light)','E7018 (low-H general)','E7024 (high-dep, fillet only)'],
    GMAW:['ER70S-3','ER70S-6 (Si, 75/25 Ar/CO₂)'],
    FCAW:['E71T-1 (gas-shielded)','E71T-11 (self-shielded)'],
    GTAW:['ER70S-2 (TIG)']
  },
  'stainless_300':{
    label:'Stainless 304 / 304L / 321',
    SMAW:['E308L-16 (304)','E347-16 (321 stabilized)'],
    GMAW:['ER308LSi (98/2 Ar/O₂)'],
    FCAW:['E308LT0-1'],
    GTAW:['ER308L (TIG, Ar)']
  },
  'stainless_316':{
    label:'Stainless 316 / 316L',
    SMAW:['E316L-16'],
    GMAW:['ER316LSi'],
    FCAW:['E316LT0-1'],
    GTAW:['ER316L']
  },
  'aluminum':{
    label:'Aluminum 5xxx / 6xxx',
    SMAW:['Generally not recommended'],
    GMAW:['ER4043 (general 6061)','ER5356 (5xxx, salt-water)'],
    FCAW:['Not used'],
    GTAW:['ER4043 / ER5356 (TIG, Ar or Ar/He)']
  },
  'duplex_2205':{
    label:'Duplex Stainless 2205',
    SMAW:['E2209-16 (slightly over-alloyed)'],
    GMAW:['ER2209'],
    FCAW:['E2209T1-1'],
    GTAW:['ER2209 (control heat input)']
  },
  'inconel_625':{
    label:'Nickel / Inconel 625',
    SMAW:['ENiCrMo-3'],
    GMAW:['ERNiCrMo-3'],
    FCAW:['ENiCrMo3T1-4'],
    GTAW:['ERNiCrMo-3 (TIG, Ar)']
  }
};
function injectWeldExtras(){
  const view=$('v-welds');if(!view)return;
  const left=view.querySelector('.split>div:first-child');
  const right=view.querySelector('.split>div:last-child');
  if(!left||!right)return;
  if(!$('weld-elec-card')){
    const card=document.createElement('div');card.className='card';card.id='weld-elec-card';
    card.innerHTML='<h3>ELECTRODE / FILLER SELECTION</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="we-base">BASE MATERIAL</label><select id="we-base">'+
          Object.entries(WELD_ELECTRODES).map(([k,m])=>`<option value="${k}">${m.label}</option>`).join('')+
        '</select></div>'+
      '</div>'+
      '<div id="weld-elec-out" style="margin-top:.5rem"></div>';
    left.appendChild(card);
  }
  if(!$('weld-rate-card')){
    const card=document.createElement('div');card.className='card';card.id='weld-rate-card';
    card.innerHTML='<h3>DEPOSITION RATE</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="wr-proc">PROCESS</label><select id="wr-proc"><option value="SMAW">SMAW (stick)</option><option value="GMAW">GMAW (MIG)</option><option value="FCAW">FCAW (flux-core)</option><option value="GTAW">GTAW (TIG)</option><option value="SAW">SAW (sub-arc)</option></select></div>'+
        '<div class="field"><label for="wr-amp">CURRENT (A)</label><input type="number" id="wr-amp" value="200" step="any"></div>'+
        '<div class="field"><label for="wr-elec">ELECTRODE Ø (mm)</label><input type="number" id="wr-elec" value="3.2" step="0.1"></div>'+
        '<div class="field"><label for="wr-eff">DEPOSIT EFF</label><input type="number" id="wr-eff" value="0.62" step="0.01"></div>'+
        '<div class="field"><label for="wr-volt">VOLTAGE (V)</label><input type="number" id="wr-volt" value="24" step="0.5"></div>'+
        '<div class="field"><label for="wr-tts">TRAVEL (mm/min)</label><input type="number" id="wr-tts" value="300" step="any"></div>'+
      '</div>'+
      '<button class="btn btn-sm" onclick="calcDeposition()">DEPOSITION + HEAT</button>';
    left.appendChild(card);
  }
  if(!$('weld-prequal-card')){
    const card=document.createElement('div');card.className='card';card.id='weld-prequal-card';card.style.marginTop='.6rem';
    card.innerHTML='<h3>AWS D1.1 PREQUALIFIED JOINTS (REFERENCE)</h3>'+
      '<table class="data" style="font-size:.78rem;width:100%"><thead><tr><th>JOINT</th><th>SYMBOL</th><th>USE</th></tr></thead><tbody>'+
        '<tr><td>CJP (Complete Joint Penetration)</td><td>BTC, BTC-P</td><td>Full strength, dynamic load, code-required equiv. parent</td></tr>'+
        '<tr><td>PJP (Partial Joint Penetration)</td><td>BTC-P5, BTC-P10</td><td>Static-only, stiffened columns, ~75-90% strength</td></tr>'+
        '<tr><td>FILLET (T, lap, corner)</td><td>F, FT</td><td>Most common; throat = 0.707·leg; capacity by AWS</td></tr>'+
        '<tr><td>BACKING-BAR</td><td>B-U2a, B-U4b</td><td>Single-side groove with permanent backing bar</td></tr>'+
        '<tr><td>PARTIAL OPEN ROOT</td><td>B-U3c</td><td>Open-root double-V; needs back-gouging</td></tr>'+
      '</tbody></table>'+
      '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">AWS D1.1 prequalified means WPS does not need PQR if all variables stay within tabulated ranges. Always verify base metal P-number, position (1G-4G or 1F-4F), preheat per Table 5.8.</p>';
    right.appendChild(card);
  }
  /* Wire base-material change to update electrode list */
  const baseSel=$('we-base');
  if(baseSel)baseSel.addEventListener('change',renderElectrodes);
  renderElectrodes();
}
function renderElectrodes(){
  const out=$('weld-elec-out');if(!out)return;
  const k=sv('we-base')||'mild_steel';const set=WELD_ELECTRODES[k];if(!set)return;
  out.innerHTML='<div style="font-size:.78rem">'+
    ['SMAW','GMAW','FCAW','GTAW'].map(proc=>
      `<div style="margin:.3rem 0"><strong style="color:var(--accent)">${proc}:</strong> <span style="color:var(--text)">${set[proc].join(' · ')}</span></div>`
    ).join('')+
    '</div>';
}
window.calcDeposition=function(){
  const proc=sv('wr-proc')||'SMAW',amp=v('wr-amp'),volt=v('wr-volt'),eff=v('wr-eff'),dia=v('wr-elec'),tts=v('wr-tts');
  if(!isFinite(amp)||!isFinite(volt))return;
  const PROC_FACT={SMAW:0.0046,GMAW:0.0058,FCAW:0.0070,GTAW:0.0024,SAW:0.0085};
  const meltRate=(PROC_FACT[proc]||0.005)*amp;
  const depRate=meltRate*eff;
  const depRateLbHr=depRate*2.205;
  const heat=(amp*volt*0.06/tts);
  const card=$('weld-rate-card');if(!card)return;
  let html=card.innerHTML.split('<button')[0]+'<button class="btn btn-sm" onclick="calcDeposition()">DEPOSITION + HEAT</button>';
  html+='<div class="result-grid" style="margin-top:.5rem">'+
    [['Melt rate',meltRate.toFixed(3)+' kg/hr'],['Deposit rate',depRate.toFixed(3)+' kg/hr'],['Deposit rate',depRateLbHr.toFixed(2)+' lb/hr'],['Heat input',heat.toFixed(2)+' kJ/mm',heat>3.5?'warn':heat>1.5?'ok':'warn'],['Process',proc]].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>Heat input:</strong> H = (A·V·0.06)/v_travel kJ/mm. <strong>Limits:</strong> Carbon steel 0.8–3.5 kJ/mm; HSLA 0.8–2.5; Duplex 0.5–2.0 (over-heat embrittlement); aluminum 0.6–2.0. Below 0.8 kJ/mm risks lack of fusion; above max risks HAZ softening / grain growth. <strong>Deposition efficiency:</strong> SMAW 60-65%, GMAW 92-95% (short-arc) / 88% (spray), FCAW 78-85%, GTAW 100% (no spatter), SAW 95-100%.</p>';
  card.innerHTML=html;
};

/* ============================================================
 * GEARS — proper involute 3D + variations + STL export
 * ============================================================ */
function injectGearExtras(){
  const view=$('v-gears');if(!view)return;
  const left=view.querySelector('.split>div:first-child');
  const right=view.querySelector('.split>div:last-child');
  if(!left||!right)return;
  if(!$('gear3d-card')){
    const card=document.createElement('div');card.className='card';card.id='gear3d-card';
    card.innerHTML='<h3>3D INVOLUTE GEAR + STL EXPORT</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="g3d-type">GEAR TYPE</label><select id="g3d-type"><option value="spur">SPUR (straight teeth)</option><option value="helical">HELICAL (angled teeth)</option><option value="herringbone">HERRINGBONE (V-shape)</option><option value="internal">INTERNAL / RING (teeth inside)</option><option value="rack">RACK (linear)</option></select></div>'+
        '<div class="field"><label for="g3d-N">TEETH N</label><input type="number" id="g3d-N" value="24" step="1" min="6" max="200"></div>'+
        '<div class="field"><label for="g3d-m">MODULE m (mm)</label><input type="number" id="g3d-m" value="3" step="0.1" min="0.5" max="20"></div>'+
        '<div class="field"><label for="g3d-phi">PRESSURE φ (°)</label><input type="number" id="g3d-phi" value="20" step="0.5" min="14.5" max="30"></div>'+
        '<div class="field"><label for="g3d-fw">FACE WIDTH (mm)</label><input type="number" id="g3d-fw" value="20" step="0.5" min="3"></div>'+
        '<div class="field" id="g3d-helix-wrap"><label for="g3d-helix">HELIX β (°)</label><input type="number" id="g3d-helix" value="15" step="1" min="0" max="45"></div>'+
        '<div class="field"><label for="g3d-bore">SHAFT BORE Ø (mm)</label><input type="number" id="g3d-bore" value="10" step="0.5" min="0"></div>'+
      '</div>'+
      '<div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">'+
        '<button class="btn btn-sm btn-fill" onclick="rebuildGear3D()">REBUILD</button>'+
        '<button class="btn btn-sm" onclick="exportGearSTL()">⬇ DOWNLOAD STL</button>'+
        '<button class="btn btn-sm" onclick="exportGearJSON()">⬇ JSON SPECS</button>'+
      '</div>'+
      '<div id="gear3d-out" style="margin-top:.5rem;font-size:.78rem;color:var(--dim)"></div>';
    left.appendChild(card);
  }
  if(!$('gear3d-canvas-card')){
    const card=document.createElement('div');card.className='card';card.style.marginTop='.6rem';
    card.innerHTML='<h3>3D PREVIEW</h3>'+
      '<canvas id="g3d-canvas" style="width:100%;height:420px;background:#0a0a0a;border-radius:3px;cursor:grab;display:block"></canvas>'+
      '<p class="note" style="margin-top:.3rem;color:var(--dim);font-size:.7rem">Drag to orbit · scroll to zoom · right-click to pan. STL is ASCII binary, use it directly in your slicer (Cura, PrusaSlicer, Bambu Studio). Print at 0.16 mm layer height with 100% infill for functional gears.</p>';
    right.appendChild(card);
  }
  /* Hide helix-angle field if type=spur */
  const typeSel=$('g3d-type');if(typeSel)typeSel.addEventListener('change',()=>{
    const helixWrap=$('g3d-helix-wrap');if(helixWrap)helixWrap.style.display=(typeSel.value==='spur'||typeSel.value==='internal'||typeSel.value==='rack')?'none':'';
    rebuildGear3D();
  });
}

/* ---- Involute geometry (math only, no Three.js needed) ---- */
function involutePoint(rb,t){return[rb*(Math.cos(t)+t*Math.sin(t)),rb*(Math.sin(t)-t*Math.cos(t))];}
function gearToothProfile(N,m,phi,external){
  const r=m*N/2,ra=r+m,rd=Math.max(r-1.25*m,0.5),rb=r*Math.cos(phi*Math.PI/180);
  if(external===false){
    /* internal gear: teeth point inward, addendum < pitch < dedendum */
    const ri=r-m,rdInt=r+1.25*m;
    const halfTooth=Math.PI/N;
    const pts=[];
    for(let s=-1;s<=1;s+=2){
      const t_top=Math.acos(Math.min(1,Math.max(-1,rb/Math.max(ri,rb))));
      pts.push([rdInt*Math.cos(s*halfTooth),rdInt*Math.sin(s*halfTooth)]);
    }
    return pts;
  }
  const t_max=ra<=rb?0:Math.sqrt((ra/rb)**2-1);
  const inv_pts=[];
  const NSEG=12;
  for(let i=0;i<=NSEG;i++){
    const t=i*t_max/NSEG;
    inv_pts.push(involutePoint(rb,t));
  }
  const halfTooth=Math.PI/(2*N)+(Math.tan(phi*Math.PI/180)-phi*Math.PI/180);
  const tip=inv_pts[inv_pts.length-1];
  const tipAng=Math.atan2(tip[1],tip[0]);
  const rot=halfTooth-tipAng;
  const rotated=inv_pts.map(p=>{
    const c=Math.cos(rot),s=Math.sin(rot);
    return[p[0]*c-p[1]*s,p[0]*s+p[1]*c];
  });
  const mirrored=rotated.slice().reverse().map(p=>[p[0],-p[1]]);
  const profile=[];
  if(rd<rb){
    profile.push([rd*Math.cos(-halfTooth),rd*Math.sin(-halfTooth)]);
  }
  profile.push(...mirrored);
  profile.push(...rotated);
  if(rd<rb){
    profile.push([rd*Math.cos(halfTooth),rd*Math.sin(halfTooth)]);
  }
  return profile;
}
function gearOutlinePoints(N,m,phi){
  const tooth=gearToothProfile(N,m,phi,true);
  const all=[];
  const fillet=2*Math.PI/N;
  for(let i=0;i<N;i++){
    const ang=i*fillet;const c=Math.cos(ang),s=Math.sin(ang);
    tooth.forEach(p=>all.push([p[0]*c-p[1]*s,p[0]*s+p[1]*c]));
  }
  return all;
}

/* ---- Three.js geometry build ---- */
let gear3DScene=null,gear3DMesh=null,gear3DRenderer=null,gear3DCamera=null,gear3DControls=null,gear3DRaf=null;
function buildGearGeometry(){
  const T=window.THREE;if(!T)return null;
  const type=sv('g3d-type')||'spur';
  const N=Math.max(6,Math.round(v('g3d-N')||24));
  const m=Math.max(0.5,v('g3d-m')||3);
  const phi=v('g3d-phi')||20;
  const fw=Math.max(3,v('g3d-fw')||20);
  const helix=type==='helical'||type==='herringbone'?v('g3d-helix')||15:0;
  const bore=Math.max(0,v('g3d-bore')||0);
  if(type==='rack'){
    const len=N*Math.PI*m;
    const teeth=[];
    for(let i=0;i<N;i++){
      const x0=-len/2+i*Math.PI*m;
      const a=Math.PI*m/2,b=m*1.25,top=m,addPos=x0+Math.PI*m/2;
      teeth.push([x0,-b]);teeth.push([x0+a*0.4,top]);teeth.push([x0+Math.PI*m-a*0.4,top]);teeth.push([x0+Math.PI*m,-b]);
    }
    const shape=new T.Shape();shape.moveTo(teeth[0][0],teeth[0][1]);teeth.forEach(p=>shape.lineTo(p[0],p[1]));shape.lineTo(len/2,-m*3);shape.lineTo(-len/2,-m*3);shape.closePath();
    return new T.ExtrudeGeometry(shape,{depth:fw,bevelEnabled:false});
  }
  const isInternal=type==='internal';
  const outline=gearOutlinePoints(N,m,phi);
  const shape=new T.Shape();
  outline.forEach((p,i)=>{i?shape.lineTo(p[0],p[1]):shape.moveTo(p[0],p[1]);});
  shape.closePath();
  if(isInternal){
    /* Internal gear is a ring with teeth on inside; outer = pitch + 4m */
    const outerR=m*N/2+m*3;
    const outer=new T.Shape();
    outer.absarc(0,0,outerR,0,Math.PI*2,false);
    outer.holes.push(shape);
    if(type==='spur'||true){
      return new T.ExtrudeGeometry(outer,{depth:fw,bevelEnabled:false,curveSegments:48});
    }
  }
  if(bore>0){
    const hole=new T.Path();hole.absarc(0,0,bore/2,0,Math.PI*2,false);shape.holes.push(hole);
  }
  if(type==='spur'){
    return new T.ExtrudeGeometry(shape,{depth:fw,bevelEnabled:true,bevelThickness:0.4,bevelSize:0.4,bevelSegments:2,curveSegments:32});
  }
  if(type==='helical'){
    const twistRad=helix*Math.PI/180*(fw/(m*N/2));
    const geom=new T.ExtrudeGeometry(shape,{depth:fw,steps:Math.max(20,Math.floor(fw/2)),bevelEnabled:false,curveSegments:32});
    const pos=geom.attributes.position;
    for(let i=0;i<pos.count;i++){
      const z=pos.getZ(i),ratio=z/fw,a=ratio*twistRad;
      const x=pos.getX(i),y=pos.getY(i);
      pos.setX(i,x*Math.cos(a)-y*Math.sin(a));
      pos.setY(i,x*Math.sin(a)+y*Math.cos(a));
    }
    geom.computeVertexNormals();
    return geom;
  }
  if(type==='herringbone'){
    const half=fw/2;
    const twistRad=helix*Math.PI/180*(half/(m*N/2));
    const geom=new T.ExtrudeGeometry(shape,{depth:fw,steps:Math.max(20,Math.floor(fw/2)),bevelEnabled:false,curveSegments:32});
    const pos=geom.attributes.position;
    for(let i=0;i<pos.count;i++){
      const z=pos.getZ(i);
      const ratio=z<half?z/half:(fw-z)/half;
      const a=ratio*twistRad;
      const x=pos.getX(i),y=pos.getY(i);
      pos.setX(i,x*Math.cos(a)-y*Math.sin(a));
      pos.setY(i,x*Math.sin(a)+y*Math.cos(a));
    }
    geom.computeVertexNormals();
    return geom;
  }
  return new T.ExtrudeGeometry(shape,{depth:fw,bevelEnabled:false,curveSegments:24});
}
window.rebuildGear3D=function(){
  const cv=$('g3d-canvas');if(!cv||!window.THREE)return;
  const T=window.THREE;
  if(!gear3DScene){
    gear3DScene=new T.Scene();gear3DScene.background=new T.Color(0x0a0a0a);
    const w=cv.clientWidth||500,h=cv.clientHeight||420;
    gear3DCamera=new T.PerspectiveCamera(35,w/h,0.1,5000);
    gear3DCamera.position.set(60,80,140);
    gear3DRenderer=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    gear3DRenderer.setPixelRatio(window.devicePixelRatio||1);
    gear3DRenderer.setSize(w,h,false);
    gear3DScene.add(new T.AmbientLight(0xffffff,0.6));
    const dl=new T.DirectionalLight(0xffffff,0.9);dl.position.set(80,140,100);gear3DScene.add(dl);
    const dl2=new T.DirectionalLight(0xff9966,0.35);dl2.position.set(-90,-40,-60);gear3DScene.add(dl2);
    if(T.OrbitControls){
      gear3DControls=new T.OrbitControls(gear3DCamera,cv);
      gear3DControls.enableDamping=true;gear3DControls.dampingFactor=0.08;
    }
    new ResizeObserver(()=>{
      const ww=cv.clientWidth,hh=cv.clientHeight;if(ww<2||hh<2)return;
      gear3DCamera.aspect=ww/hh;gear3DCamera.updateProjectionMatrix();
      gear3DRenderer.setSize(ww,hh,false);
    }).observe(cv);
    function loop(){gear3DRenderer.render(gear3DScene,gear3DCamera);if(gear3DControls)gear3DControls.update();gear3DRaf=requestAnimationFrame(loop);}loop();
  }
  if(gear3DMesh){gear3DScene.remove(gear3DMesh);gear3DMesh.geometry&&gear3DMesh.geometry.dispose();}
  const geom=buildGearGeometry();if(!geom)return;
  geom.center();
  const mat=new T.MeshStandardMaterial({color:0xff9966,metalness:0.85,roughness:0.30,side:T.DoubleSide});
  gear3DMesh=new T.Mesh(geom,mat);
  gear3DScene.add(gear3DMesh);
  /* Auto-zoom: fit pitch diameter in view */
  const N=Math.max(6,Math.round(v('g3d-N')||24)),m=Math.max(0.5,v('g3d-m')||3);
  const r=m*N/2;gear3DCamera.position.set(r*1.5,r*2,r*3);gear3DCamera.lookAt(0,0,0);
  if(gear3DControls)gear3DControls.target.set(0,0,0);
  /* Update info card */
  const out=$('gear3d-out');if(out){
    const phi=v('g3d-phi')||20;
    const fw=v('g3d-fw')||20;
    const ra=r+m,rd=Math.max(r-1.25*m,0.5),rb=r*Math.cos(phi*Math.PI/180);
    const p=Math.PI*m,da=2*ra,db=2*rb,dd=2*rd;
    out.innerHTML='<strong>Computed:</strong> d (pitch) = '+(2*r).toFixed(2)+' mm · d_a (addendum/OD) = '+da.toFixed(2)+' mm · d_b (base) = '+db.toFixed(2)+' mm · d_d (dedendum/root) = '+dd.toFixed(2)+' mm · circular pitch = '+p.toFixed(3)+' mm · face width = '+fw.toFixed(1)+' mm';
  }
};
function geomToSTL(geom,name){
  const pos=geom.attributes.position;
  const idx=geom.index;
  let stl='solid '+name+'\n';
  function tri(a,b,c){
    const ax=pos.getX(a),ay=pos.getY(a),az=pos.getZ(a);
    const bx=pos.getX(b),by=pos.getY(b),bz=pos.getZ(b);
    const cx=pos.getX(c),cy=pos.getY(c),cz=pos.getZ(c);
    const ux=bx-ax,uy=by-ay,uz=bz-az;
    const vx=cx-ax,vy=cy-ay,vz=cz-az;
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    const nlen=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
    nx/=nlen;ny/=nlen;nz/=nlen;
    stl+='facet normal '+nx.toFixed(4)+' '+ny.toFixed(4)+' '+nz.toFixed(4)+'\n outer loop\n';
    stl+='  vertex '+ax.toFixed(4)+' '+ay.toFixed(4)+' '+az.toFixed(4)+'\n';
    stl+='  vertex '+bx.toFixed(4)+' '+by.toFixed(4)+' '+bz.toFixed(4)+'\n';
    stl+='  vertex '+cx.toFixed(4)+' '+cy.toFixed(4)+' '+cz.toFixed(4)+'\n';
    stl+=' endloop\nendfacet\n';
  }
  if(idx){for(let i=0;i<idx.count;i+=3)tri(idx.getX(i),idx.getX(i+1),idx.getX(i+2));}
  else{for(let i=0;i<pos.count;i+=3)tri(i,i+1,i+2);}
  stl+='endsolid '+name+'\n';
  return stl;
}
function downloadFile(filename,content,mime){
  const blob=new Blob([content],{type:mime||'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},200);
}
window.exportGearSTL=function(){
  const geom=buildGearGeometry();if(!geom){alert('No gear geometry. Click REBUILD first.');return;}
  const type=sv('g3d-type')||'spur';
  const N=Math.round(v('g3d-N')||24),m=v('g3d-m')||3;
  const filename='gear_'+type+'_N'+N+'_m'+m+'.stl';
  const stl=geomToSTL(geom,'amni_calc_gear_'+type);
  downloadFile(filename,stl,'application/sla');
};
window.exportGearJSON=function(){
  const N=Math.round(v('g3d-N')||24),m=v('g3d-m')||3,phi=v('g3d-phi')||20;
  const r=m*N/2,ra=r+m,rd=Math.max(r-1.25*m,0.5),rb=r*Math.cos(phi*Math.PI/180);
  const data={
    gear_type:sv('g3d-type')||'spur',
    teeth:N,
    module_mm:m,
    pressure_angle_deg:phi,
    helix_angle_deg:v('g3d-helix')||0,
    face_width_mm:v('g3d-fw')||20,
    bore_mm:v('g3d-bore')||0,
    pitch_diameter_mm:2*r,
    addendum_diameter_mm:2*ra,
    base_diameter_mm:2*rb,
    dedendum_diameter_mm:2*rd,
    circular_pitch_mm:Math.PI*m,
    diametral_pitch_per_in:25.4/m,
    Lewis_Y_form_factor:lewisY(N),
    standard:'AGMA / ISO 53 standard 20° involute',
    generated_by:'Amni-Calc v5.3 (amni-scient.com/calc)',
    iso_date:new Date().toISOString()
  };
  const filename='gear_'+data.gear_type+'_N'+N+'_m'+m+'.json';
  downloadFile(filename,JSON.stringify(data,null,2),'application/json');
};

/* ============================================================
 * GEARS — Lewis form factor auto-lookup by tooth count
 * ============================================================ */
const LEWIS_Y={12:0.245,13:0.261,14:0.277,15:0.290,16:0.296,17:0.303,18:0.309,19:0.314,20:0.322,21:0.328,22:0.331,24:0.337,26:0.346,28:0.353,30:0.359,34:0.371,38:0.384,43:0.397,50:0.409,60:0.422,75:0.435,100:0.447,150:0.460,300:0.472,400:0.480,1000:0.485};
function lewisY(N){
  N=Math.round(N);
  if(N<=12)return 0.245;
  if(N>=1000)return 0.485;
  const keys=Object.keys(LEWIS_Y).map(Number).sort((a,b)=>a-b);
  for(let i=0;i<keys.length-1;i++){
    if(N>=keys[i]&&N<=keys[i+1]){
      const t=(N-keys[i])/(keys[i+1]-keys[i]);
      return LEWIS_Y[keys[i]]+t*(LEWIS_Y[keys[i+1]]-LEWIS_Y[keys[i]]);
    }
  }
  return 0.322;
}
function autoLewisY(){
  const lwY=$('lw-y'),ggN=$('gg-n')||$('gr-np');
  if(lwY&&ggN&&!lwY.dataset.userTouched){
    const N=parseFloat(ggN.value);
    if(isFinite(N)&&N>0)lwY.value=lewisY(N).toFixed(3);
  }
}

/* Init: populate dropdowns + wire live-compute */
window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    /* Wait for Plotly then patch */
    const tryPatch=()=>{if(window.Plotly){patchPlotly();}else{setTimeout(tryPatch,150);}};
    tryPatch();
    injectStyles();
    populateSecPresets();applyPreset();
    populateBoltDropdowns();
    wireLive('v-bolts',window.calcBolt);
    window.calcBolt();
    /* Hide the "ANALYZE JOINT" button since we have live-compute */
    const boltBtn=document.querySelector('#v-bolts button[onclick="calcBolt()"]');
    if(boltBtn)boltBtn.style.display='none';
    /* Springs init */
    gateBellevillePresets();
    const typeEl=$('sp-type');if(typeEl)typeEl.addEventListener('change',()=>{populateSpringPresets();window.calcSpring();});
    wireLive('v-springs',window.calcSpring);
    /* Hide CALCULATE button on springs since live-compute */
    const springBtn=document.querySelector('#v-springs button[onclick="calcSpring()"]');
    if(springBtn)springBtn.style.display='none';
    setTimeout(()=>window.calcSpring(),200);
    /* Universal live-compute pass — covers the rest of the modules */
    setTimeout(()=>{
      universalLiveCompute();
      /* Re-show buttons that should stay visible because they act on
       * non-input UI state (canvas, dynamic lists, etc.) */
      const keepVisible=[
        'button[onclick="solveBeam()"]',
        'button[onclick="calcSection()"]',
        'button[onclick="undoVertex()"]',
        'button[onclick="clearSection()"]',
        'button[onclick="applyPreset()"]',
        'button[onclick="applySpringPreset()"]'
      ];
      keepVisible.forEach(sel=>{const b=document.querySelector(sel);if(b)b.style.display='';});
      /* Gears Lewis Y auto-lookup: when user types in lw-y, mark touched
       * so we don't overwrite. Otherwise auto-fill from teeth count. */
      const lwY=$('lw-y');if(lwY)lwY.addEventListener('input',()=>{lwY.dataset.userTouched='1';});
      const ggN=$('gg-n');if(ggN)ggN.addEventListener('input',autoLewisY);
      autoLewisY();
      /* Move enhanced Mohr's circle inputs to LEFT side of stress split */
      moveMohrToLeft();
      /* Inject vibration shock pulse card */
      injectShockCard();
      /* Inject NEC ampacity Plotly chart */
      injectNECChart();
      /* Inject electrical extras: transformer sizing + phasor diagram */
      injectElectricalExtras();
      /* Inject motor extras: torque-speed + NEMA frames */
      injectMotorExtras();
      /* Inject thermal extras: fin efficiency curve */
      injectThermalExtras();
      /* Inject pump real curves vs system curve */
      injectPumpExtras();
      /* Inject pressure-vessel head + nozzle reinforcement + lifting lug */
      injectPVExtras();
      /* Inject welder helpers: electrode selection + deposition + AWS prequalified joints */
      injectWeldExtras();
      /* Inject 3D gear generator + STL export */
      injectGearExtras();
      /* Build first gear once Three.js loads */
      const tryGear=()=>{if(window.THREE&&$('g3d-canvas')){window.rebuildGear3D();}else{setTimeout(tryGear,300);}};
      tryGear();
      /* Re-run universal sweep so the newly-injected cards get wired */
      setTimeout(()=>{
        universalLiveCompute();
        injectNECChart();
        /* Fire newly-added handlers once so they show defaults */
        if(typeof window.calcXfmr==='function')try{window.calcXfmr();}catch(e){}
        if(typeof window.calcMotorTSC==='function')try{window.calcMotorTSC();}catch(e){}
        if(typeof window.calcNemaFrame==='function')try{window.calcNemaFrame();}catch(e){}
        if(typeof window.calcACPower==='function')try{window.calcACPower();}catch(e){}
        if(typeof window.calcShock==='function')try{window.calcShock();}catch(e){}
        if(typeof window.calcPumpCurve==='function')try{window.calcPumpCurve();}catch(e){}
        if(typeof window.calcPVHead==='function')try{window.calcPVHead();}catch(e){}
        if(typeof window.calcPVNozzle==='function')try{window.calcPVNozzle();}catch(e){}
        if(typeof window.calcPVLug==='function')try{window.calcPVLug();}catch(e){}
        if(typeof window.calcDeposition==='function')try{window.calcDeposition();}catch(e){}
      },400);
    },800);
  },400);
});

/* Move the .mohr-x card (injected by calc-overrides.js into the right
 * side of v-stress) to the LEFT side, so all inputs are together.
 * Also reorganize: inputs go LEFT, Plotly chart goes RIGHT. */
function moveMohrToLeft(){
  const stress=$('v-stress');if(!stress)return;
  const split=stress.querySelector('.split');if(!split||split.children.length<2)return;
  const mohrCard=split.children[1].querySelector('.mohr-x');
  if(mohrCard&&split.children[0]){
    /* Move just the inputs portion; replace canvas with Plotly chart */
    const canvas=mohrCard.querySelector('#c-mohr-x');
    if(canvas){
      const chartDiv=document.createElement('div');chartDiv.id='p-mohr-x';chartDiv.style.cssText='width:100%;height:380px';
      const oldOut=mohrCard.querySelector('#mohr-x-out');
      const chartCard=document.createElement('div');chartCard.className='card';chartCard.innerHTML='<h3>MOHR\'S CIRCLE (PLOTLY)</h3>';chartCard.appendChild(chartDiv);
      split.children[1].appendChild(chartCard);
      canvas.style.display='none';
    }
    split.children[0].appendChild(mohrCard);
  }
  setTimeout(()=>{
    const m=split.children[1].querySelector('.mohr-x');
    if(m)split.children[0].appendChild(m);
  },1500);
}

/* Override drawMohrEnhanced to render a true Plotly chart */
window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    const _orig=window.drawMohrEnhanced;
    window.drawMohrEnhanced=function(){
      const sx=v('mh-sx'),sy=v('mh-sy'),txy=v('mh-txy');
      if(!isFinite(sx)||!isFinite(sy))return;
      const cx=(sx+sy)/2,R=Math.sqrt(Math.pow((sx-sy)/2,2)+txy*txy);
      const s1=cx+R,s2=cx-R,tmax=R;
      const tp=Math.atan2(2*txy,sx-sy)/2*180/Math.PI;
      const sv0=Math.sqrt(s1*s1-s1*s2+s2*s2);
      const tr=Math.max(Math.abs(s1),Math.abs(s2),Math.abs(s1-s2))/2;
      const npts=120;
      const xCircle=Array.from({length:npts},(_,i)=>cx+R*Math.cos(i*2*Math.PI/(npts-1)));
      const yCircle=Array.from({length:npts},(_,i)=>R*Math.sin(i*2*Math.PI/(npts-1)));
      const t=pTheme();
      const traces=[
        {x:xCircle,y:yCircle,mode:'lines',line:{color:t.accent,width:2.5},name:"Mohr's circle",hoverinfo:'skip'},
        {x:[sx,sy],y:[txy,-txy],mode:'lines+markers+text',line:{color:'#ef4444',width:1.5,dash:'dash'},marker:{color:'#ef4444',size:8},text:['X(σx,τxy)','Y(σy,-τxy)'],textposition:'top right',textfont:{color:t.text,size:10},name:'Stress points'},
        {x:[s1],y:[0],mode:'markers+text',marker:{color:'#f59e0b',size:11,symbol:'diamond'},text:['σ₁='+s1.toFixed(1)],textposition:'top right',textfont:{color:t.text,size:10},name:'σ₁'},
        {x:[s2],y:[0],mode:'markers+text',marker:{color:'#f59e0b',size:11,symbol:'diamond'},text:['σ₂='+s2.toFixed(1)],textposition:'top left',textfont:{color:t.text,size:10},name:'σ₂'},
        {x:[cx],y:[R],mode:'markers+text',marker:{color:'#22c55e',size:9,symbol:'triangle-up'},text:['τ_max='+tmax.toFixed(1)],textposition:'top center',textfont:{color:t.text,size:10},name:'τ_max'},
        {x:[cx],y:[-R],mode:'markers',marker:{color:'#22c55e',size:9,symbol:'triangle-down'},name:'-τ_max',hoverinfo:'skip'}
      ];
      const range=R*1.4;
      plot('p-mohr-x',traces,{
        xaxis:{title:'σ (MPa)',range:[Math.min(0,s2)-range*0.1,Math.max(0,s1)+range*0.1],zeroline:true,scaleanchor:'y',scaleratio:1},
        yaxis:{title:'τ (MPa)',range:[-range*1.1,range*1.1],zeroline:true},
        showlegend:false
      });
      const out=$('mohr-x-out');if(out){
        out.innerHTML='<div class="result-grid">'+
          [['σ₁',s1.toFixed(2)+' MPa'],['σ₂',s2.toFixed(2)+' MPa'],['τ_max',tmax.toFixed(2)+' MPa'],['Center σ_avg',cx.toFixed(2)+' MPa'],['Radius R',R.toFixed(2)+' MPa'],['θ_p',tp.toFixed(2)+'°'],['σ_vM (2D)',sv0.toFixed(2)+' MPa'],['τ_Tresca',tr.toFixed(2)+' MPa']].map(([l,v])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')+
          '</div><p style="margin-top:.4rem;color:var(--dim);font-size:.72rem">Principal axes rotate '+tp.toFixed(1)+'° from x-axis. Use σ_vM for ductile-yield FoS, σ₁ for brittle/fatigue. Tresca more conservative than vM by ~15%.</p>';
      }
    };
  },600);
});

console.log('[calc-fixes] v5.2.0 layer loaded');
})();
