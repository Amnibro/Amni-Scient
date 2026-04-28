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
  const obs=new MutationObserver(()=>{
    document.querySelectorAll('[id^="p-"]').forEach(el=>{
      if(el._fullLayout&&window.Plotly){
        const t=pTheme();
        try{Plotly.relayout(el,{paper_bgcolor:t.paper,plot_bgcolor:t.plot,'font.color':t.text,'xaxis.gridcolor':t.grid,'yaxis.gridcolor':t.grid});}catch(e){}
      }
    });
  });
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
};
window.clearSupports=function(){window.beamSupports=[];renderSupportList();};
function renderSupportList(){
  const el=$('sup-list');if(!el)return;
  el.innerHTML=window.beamSupports.map((s,i)=>
    `<span class="chip" style="font-size:.7rem">${s.type.toUpperCase()} @ ${s.x.toFixed(0)} mm <a href="#" onclick="window.beamSupports.splice(${i},1);renderSupportList();return false" style="margin-left:.4rem;color:var(--err,#f55)">×</a></span>`
  ).join('');
  if(typeof window._renderSupportListNative==='function')try{window._renderSupportListNative();}catch(e){}
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
  if(typeof _origAddLoad==='function')try{_origAddLoad();}catch(e){}
};
window.clearLoads=function(){window.beamLoads=[];renderLoadList();};
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
  renderSecParams();
  sel.addEventListener('change',()=>{renderSecParams();applyPreset();});
}
function renderSecParams(){
  const sel=$('sec-presets'),wrap=$('sec-preset-params');if(!sel||!wrap)return;
  const preset=SECTION_PRESETS[sel.value];if(!preset)return;
  wrap.innerHTML='<div class="row" style="gap:.5rem;flex-wrap:wrap">'+preset.params.map(p=>
    `<div class="field" style="min-width:140px"><label for="secp-${p.id}">${p.label}</label><input type="number" id="secp-${p.id}" value="${p.def}" step="any" oninput="window.applyPreset()"></div>`
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
  '#6-32':{d:3.51,p:0.794,At:7.81,kind:'Inch UNC'},
  '#8-32':{d:4.17,p:0.794,At:11.0,kind:'Inch UNC'},
  '#10-24':{d:4.83,p:1.058,At:14.2,kind:'Inch UNC'},
  '1/4-20':{d:6.35,p:1.270,At:20.5,kind:'Inch UNC'},
  '5/16-18':{d:7.94,p:1.411,At:33.9,kind:'Inch UNC'},
  '3/8-16':{d:9.53,p:1.587,At:50.3,kind:'Inch UNC'},
  '7/16-14':{d:11.11,p:1.814,At:69.0,kind:'Inch UNC'},
  '1/2-13':{d:12.70,p:1.954,At:91.6,kind:'Inch UNC'},
  '5/8-11':{d:15.88,p:2.309,At:146,kind:'Inch UNC'},
  '3/4-10':{d:19.05,p:2.540,At:215,kind:'Inch UNC'},
  '7/8-9':{d:22.23,p:2.822,At:298,kind:'Inch UNC'},
  '1-8':{d:25.40,p:3.175,At:391,kind:'Inch UNC'},
  '1-1/4-7':{d:31.75,p:3.629,At:625,kind:'Inch UNC'},
  '1-1/2-6':{d:38.10,p:4.233,At:906,kind:'Inch UNC'},
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
  'M36':{d:36.0,p:4.00,At:817,kind:'Metric coarse'}
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

/* ============================================================
 * LAYOUT FIX: force inputs-left and theme older charts
 * ============================================================ */
function injectStyles(){
  if($('calc-fixes-style'))return;
  const s=document.createElement('style');s.id='calc-fixes-style';
  s.textContent=`
    .view#v-bolts .split,.view#v-stress .split,.view#v-springs .split,.view#v-section .split{display:flex;flex-direction:row;gap:1rem;align-items:flex-start}
    .view#v-bolts .split>div,.view#v-stress .split>div,.view#v-springs .split>div,.view#v-section .split>div{flex:1;min-width:0}
    @media(max-width:900px){.view#v-bolts .split,.view#v-stress .split,.view#v-springs .split,.view#v-section .split{flex-direction:column}}
    .result-item .val.ok{color:#22c55e}.result-item .val.warn{color:#f59e0b}.result-item .val.err{color:#ef4444}
    .note.warn{color:#f59e0b;background:rgba(245,158,11,0.08);padding:.5rem .7rem;border-left:3px solid #f59e0b;border-radius:3px;font-size:.78rem}
  `;
  document.head.appendChild(s);
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
  /* Force-deflection chart with ideal range overlay */
  const Lavail=fl-Lsolid;
  const xMax=Lavail>0?Lavail:fl*0.8;
  const npts=50;const xs=Array.from({length:npts},(_,i)=>i*xMax/(npts-1));
  const Fs=xs.map(x=>k*x);
  const idealMin=xMax*0.15,idealMax=xMax*0.80;
  const Fmax_chart=k*xMax;
  const shapes=[
    {type:'rect',x0:idealMin,x1:idealMax,y0:0,y1:Fmax_chart,fillcolor:'rgba(34,197,94,0.12)',line:{width:0}},
    {type:'line',x0:xMax,x1:xMax,y0:0,y1:Fmax_chart*1.05,line:{color:'#ef4444',width:1.5,dash:'dash'}}
  ];
  if(isFinite(delta)&&delta>0&&delta<xMax){
    shapes.push({type:'line',x0:delta,x1:delta,y0:0,y1:F,line:{color:pTheme().accent,width:1,dash:'dot'}});
  }
  plot('p-spring-fd',[
    {x:xs,y:Fs,mode:'lines',line:{color:pTheme().accent,width:2.5},name:'F = k·δ'},
    isFinite(delta)?{x:[delta],y:[F],mode:'markers',marker:{color:'#fff',size:11,symbol:'diamond',line:{color:'#000',width:1.5}},name:'Operating'}:{x:[],y:[]}
  ],{xaxis:{title:'δ deflection (mm)',range:[0,xMax*1.05]},yaxis:{title:'F force (N)',range:[0,Fmax_chart*1.1]},shapes,showlegend:false});
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
  /* Hide the presets card if no presets for current type? Always show — presets exist for all types now. */
  const card=$('spring-presets-card');if(card)card.style.display='block';
  populateSpringPresets();
}

/* Init: populate dropdowns + wire live-compute */
window.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
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
  },400);
});

console.log('[calc-fixes] v5.2.0 layer loaded');
})();
