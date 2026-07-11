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
const v=id=>{const e=$(id);if(!e)return NaN;var r=parseFloat(e.value);return window.__uconv?window.__uconv(e,r):r;};
const sv=id=>{const e=$(id);return e?e.value:'';};
const _mr=(el,h)=>{el&&(window.__morphRes?window.__morphRes(el,h):(el.innerHTML=h));};
function setCardOut(cardId,html){const card=$(cardId);if(!card)return;let out=card.querySelector(':scope > .card-out');if(!out){out=document.createElement('div');out.className='card-out';out.style.marginTop='.5rem';card.appendChild(out);}_mr(out,html);}
function shoelaceProps(pts){if(!pts||pts.length<3)return null;const n=pts.length;let A=0,Cx=0,Cy=0;for(let i=0;i<n;i++){const j=(i+1)%n,xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1];const cr=xi*yj-xj*yi;A+=cr;Cx+=(xi+xj)*cr;Cy+=(yi+yj)*cr;}A=A/2;const sgn=A<0?-1:1;A=Math.abs(A);if(A<1e-9)return null;Cx=Cx*sgn/(6*A);Cy=Cy*sgn/(6*A);let Ixo=0,Iyo=0;for(let i=0;i<n;i++){const j=(i+1)%n,xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1];const cr=xi*yj-xj*yi;Ixo+=(yi*yi+yi*yj+yj*yj)*cr;Iyo+=(xi*xi+xi*xj+xj*xj)*cr;}Ixo=Math.abs(Ixo*sgn)/12;Iyo=Math.abs(Iyo*sgn)/12;const Ix=Ixo-A*Cy*Cy,Iy=Iyo-A*Cx*Cx;let cTop=0,cBot=0,cR=0,cL=0;pts.forEach(p=>{const dy=p[1]-Cy,dx=p[0]-Cx;if(dy>cTop)cTop=dy;if(-dy>cBot)cBot=-dy;if(dx>cR)cR=dx;if(-dx>cL)cL=-dx;});const cy=Math.max(cTop,cBot),cx=Math.max(cR,cL);return{A,Cx,Cy,Ixx:Ix,Iyy:Iy,Sx:cy>0?Ix/cy:0,Sy:cx>0?Iy/cx:0,rx:A>0?Math.sqrt(Ix/A):0,ry:A>0?Math.sqrt(Iy/A):0,J:Ix+Iy};}
function saveCustomSection(props,label){if(!props||!isFinite(props.A))return;const rec={label:label||'CUSTOM',A:props.A,Ix:props.Ix||props.Ixx||null,Iy:props.Iy||props.Iyy||null,Sx:props.Sx||props.Sx_top||null,Sy:props.Sy||null,Zx:props.Zx||null,rx:props.rx||null,ry:props.ry||null,J:props.J||null,yC:props.yCentroid||props.Cy||null,xC:props.xCentroid||props.Cx||null,ts:Date.now()};window.__customSection=rec;try{localStorage.setItem('amni-calc-section',JSON.stringify(rec));}catch(_){}injectSectionImportChip();}
function loadCustomSection(){if(window.__customSection)return window.__customSection;try{const j=localStorage.getItem('amni-calc-section');if(j){const r=JSON.parse(j);window.__customSection=r;return r;}}catch(_){}return null;}
function injectSectionImportChip(){const bm=$('bm-i');if(!bm)return;const wrap=bm.closest('.field');if(!wrap||wrap.querySelector('.sec-import-chip'))return;const chip=document.createElement('button');chip.type='button';chip.className='btn btn-sm sec-import-chip';chip.style.cssText='margin-top:.3rem;font-size:.65rem;padding:3px 8px;background:var(--accent);color:#000;border:0;border-radius:3px;cursor:pointer';chip.textContent='↙ USE CUSTOM SECTION';chip.onclick=()=>{const s=loadCustomSection();if(!s||!s.Ix){cfToast('No custom section saved yet — visit the Sections tab and Calculate first.');return;}bm.value=(s.Ix/1e4).toFixed(3);const u=$('bm-i-u');if(u)u.value='cm4';bm.dispatchEvent(new Event('input',{bubbles:true}));chip.textContent='✅ LOADED '+s.label+' (I_x='+(s.Ix/1e4).toFixed(2)+' cm⁴)';setTimeout(()=>{chip.textContent='↙ USE CUSTOM SECTION';},2200);};wrap.appendChild(chip);}
function injectSectionExportButton(){const out=$('sec-results');if(!out)return;if(out.querySelector('.sec-export-row'))return;const last=window.__customSection;if(!last||!last.Ix)return;const row=document.createElement('div');row.className='sec-export-row';row.style.cssText='margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap';row.innerHTML='<button type="button" class="btn btn-sm" onclick="window.__sectionToBeam()" style="font-size:.7rem">→ LOAD INTO BEAM (I_x)</button><button type="button" class="btn btn-sm" onclick="window.__sectionToColumns()" style="font-size:.7rem">→ LOAD INTO COLUMNS (r, A)</button><button type="button" class="btn btn-sm" onclick="window.__sectionToShaft()" style="font-size:.7rem">→ LOAD INTO SHAFTS (J)</button><span style="font-size:.65rem;color:var(--dim);align-self:center">Saved: '+last.label+'</span>';out.appendChild(row);}
window.__sectionToBeam=function(){const s=loadCustomSection();if(!s||!s.Ix){cfToast('Calculate a section first.');return;}const bm=$('bm-i');if(!bm){cfToast('Open the Beams tab.');return;}bm.value=(s.Ix/1e4).toFixed(3);const u=$('bm-i-u');if(u)u.value='cm4';bm.dispatchEvent(new Event('input',{bubbles:true}));const tab=document.querySelector('[data-v="beam"]');if(tab)tab.click();};
window.__sectionToShaft=function(){const s=loadCustomSection();if(!s||!s.J){cfToast('This section has no J (torsion constant) — works only for closed solid/hollow sections.');return;}const sh=$('sh-do')||$('sh-J');if(!sh){cfToast('Open the Shafts tab.');return;}if(sh.id==='sh-J'){sh.value=s.J.toFixed(2);sh.dispatchEvent(new Event('input',{bubbles:true}));}else cfToast('Shaft tab uses d_outer / d_inner directly. J='+s.J.toFixed(2)+' mm⁴ — set Do/Di to a pipe geometry that matches.');const tab=document.querySelector('[data-v="shafts"]');if(tab)tab.click();};
window.__sectionToColumns=function(){const s=loadCustomSection();if(!s||!isFinite(s.A)){cfToast('Calculate a section first.');return;}const cr=$('cl-r'),ca=$('cl-a');if(!cr||!ca){cfToast('Open the Columns tab.');return;}const rs=[s.rx,s.ry].filter(x=>isFinite(x)&&x>0),rmin=rs.length?Math.min.apply(null,rs):null;rmin&&(cr.value=rmin.toFixed(3),cr.dispatchEvent(new Event('input',{bubbles:true})));ca.value=s.A.toFixed(1);ca.dispatchEvent(new Event('input',{bubbles:true}));const tab=document.querySelector('[data-v="columns"]');if(tab)tab.click();};
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
window.cfToast=function(m){let t=document.getElementById('cf-toast');if(!t){t=document.createElement('div');t.id='cf-toast';t.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:var(--panel,#1d2026);color:var(--text,#eee);border:1px solid var(--accent,#ff6b35);border-radius:8px;padding:10px 16px;font:12px JetBrains Mono,monospace;z-index:99999;max-width:70vw;box-shadow:0 6px 24px rgba(0,0,0,.5)';document.body.appendChild(t);}t.textContent=m;t.style.display='block';clearTimeout(t._h);t._h=setTimeout(()=>{t.style.display='none';},3500);};
window.addEventListener('DOMContentLoaded',()=>{
  const obs=new MutationObserver(()=>{rethemeAllPlots();rethemeCanvases();});
  obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
});

/* ============================================================
 * BEAM MODULE — proper mechanics, shear/moment/deflection plots
 * ============================================================ */
const _UC=(typeof window!=='undefined'&&window.UCORE)||null;
const LEN_TO_MM=(_UC&&_UC.tables.LEN_TO_MM)||{mm:1,cm:10,m:1000,'µm':1e-3,um:1e-3,in:25.4,ft:304.8};
const FORCE_TO_N=(_UC&&_UC.tables.FORCE_TO_N)||{N:1,kN:1000,lbf:4.4482216152605,kip:4448.2216152605,kgf:9.80665};
const E_TO_MPA=(_UC&&_UC.tables.PRESS_TO_MPA)||{Pa:1e-6,kPa:1e-3,MPa:1,GPa:1000,bar:0.1,psi:0.00689475729316836,ksi:6.89475729316836};
const I_TO_MM4=(_UC&&_UC.tables.INERTIA_TO_MM4)||{mm4:1,cm4:1e4,in4:416231.4256};
function getLen(id){const u=sv(id+'-u')||'mm';return v(id)*(LEN_TO_MM[u]||1);}
function getForce(id){const u=sv(id+'-u')||'N';return v(id)*(FORCE_TO_N[u]||1);}
function getE(id){const u=sv(id+'-u')||'MPa';return v(id)*(E_TO_MPA[u]||1);}
function getI(id){const u=sv(id+'-u')||'mm4';return v(id)*(I_TO_MM4[u]||1);}
function _fmtU(val,u){if(!isFinite(val))return '—';const a=Math.abs(val);return(a!==0&&(a>=1e5||a<1e-3)?val.toExponential(3):parseFloat(val.toFixed(3)))+' '+u;}
function _lenDisp(mm,u){u=u||'mm';return _fmtU(mm/(LEN_TO_MM[u]||1),u);}
function _forceDisp(N,u){u=u||'kN';return _fmtU(N/(FORCE_TO_N[u]||1),u);}

window.beamSupports=window.beamSupports||[];
window.beamLoads=window.beamLoads||[];

window.addTypedSupport=function(){
  const t=sv('sup-typed-type')||'pin';
  const pos=getLen('sup-typed-pos');
  if(!isFinite(pos)||pos<0){cfToast('Enter a valid position.');return;}
  window.beamSupports.push({type:t,x:pos,posU:sv('sup-typed-pos-u')||'mm'});
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
      `<span class="chip" style="font-size:.72rem;background:rgba(255,107,53,0.12);color:var(--text);padding:3px 8px;border-radius:3px;border:1px solid var(--accent,#ff6b35)">${s.type.toUpperCase()} @ ${_lenDisp(s.x,s.posU)} <a href="#" onclick="window.beamSupports.splice(${i},1);window.renderSupportList();window.solveBeam&&window.solveBeam();return false" style="margin-left:.4rem;color:#f55;text-decoration:none">×</a></span>`
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
  if(!isFinite(pos)||!isFinite(mag)){cfToast('Need position and magnitude.');return;}
  window.beamLoads.push({type,x:pos,mag,xEnd:endPos,magU:sv('ld-mag-u')||'kN',posU:sv('ld-pos-u')||'mm'});
  renderLoadList();
  if(typeof window.solveBeam==='function')try{window.solveBeam();}catch(e){}
};
window.clearLoads=function(){window.beamLoads=[];renderLoadList();if(typeof window.solveBeam==='function')try{window.solveBeam();}catch(e){}};
function renderLoadList(){
  const el=$('load-list');if(!el)return;
  el.innerHTML=window.beamLoads.map((l,i)=>{
    const mN=l.mag,mLbl=_forceDisp(mN,l.magU);
    const posLbl=l.xEnd?`${_lenDisp(l.x,l.posU)}–${_lenDisp(l.xEnd,l.posU)}`:`@ ${_lenDisp(l.x,l.posU)}`;
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
    for(const sx in reactions){const sxn=parseFloat(sx);if(sxn<=x+1e-6){M+=reactions[sx].V*(x-sxn);if(reactions[sx].type==='fixed')M-=reactions[sx].M;}}
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
  const VmaxKN=Vmax/1000,MmaxNm=-Mmax/1000;
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
      <div class="result-item"><div class="lbl"><span style="text-transform:none">δ</span>_max</div><div class="val">${dmax.toFixed(3)} mm @ ${xs[dmaxIdx].toFixed(0)} mm</div></div>
      <div class="result-item"><div class="lbl">L/<span style="text-transform:none">δ</span></div><div class="val">${(Math.abs(dmax)>1e-9?(L/Math.abs(dmax)).toFixed(0):'∞')}</div></div>
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
function _polyProps(pts){let A=0,Cx=0,Cy=0,Ix=0,Iy=0;const n=pts.length;for(let i=0;i<n;i++){const x0=pts[i][0],y0=pts[i][1],x1=pts[(i+1)%n][0],y1=pts[(i+1)%n][1],cr=x0*y1-x1*y0;A+=cr;Cx+=(x0+x1)*cr;Cy+=(y0+y1)*cr;Ix+=(y0*y0+y0*y1+y1*y1)*cr;Iy+=(x0*x0+x0*x1+x1*x1)*cr;}A/=2;Cx/=6*A;Cy/=6*A;const IX=Math.abs(Ix/12-A*Cy*Cy),IY=Math.abs(Iy/12-A*Cx*Cx);A=Math.abs(A);let ya=-1e12,yi=1e12,xa=-1e12,xi=1e12;for(const q of pts){if(q[1]>ya)ya=q[1];if(q[1]<yi)yi=q[1];if(q[0]>xa)xa=q[0];if(q[0]<xi)xi=q[0];}return{A,Ix:IX,Iy:IY,Sx_top:IX/(ya-Cy),Sx_bot:IX/(Cy-yi),Sy:IY/Math.max(xa-Cx,Cx-xi),rx:Math.sqrt(IX/A),ry:Math.sqrt(IY/A)};}
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
  trapezoid:{label:'Trapezoid (a, b, h)',params:[{id:'a',label:'a (top width, mm)',def:30},{id:'b',label:'b (bottom width, mm)',def:60},{id:'h',label:'h (height, mm)',def:80}],calc:p=>{const{a,b,h}=p,A=(a+b)*h/2,yC=h*(2*a+b)/(3*(a+b)),Ix=h*h*h*(a*a+4*a*b+b*b)/(36*(a+b));return{A,Ix,yCentroid:yC,Sx_top:Ix/(h-yC),Sx_bot:Ix/yC,rx:Math.sqrt(Ix/A)};}},
  triangle:{label:'Triangle (b, h)',params:[{id:'b',label:'b (base, mm)',def:60},{id:'h',label:'h (height, mm)',def:80}],calc:p=>{const{b,h}=p,A=b*h/2,Ix=b*h*h*h/36,Sx_top=Ix/(2*h/3),Sx_bot=Ix/(h/3);return{A,Ix,Iy:h*b*b*b/48,Sx_top,Sx_bot,rx:Math.sqrt(Ix/A)};}},
  square_tube:{label:'Square Tube / HSS (B, t)',params:[{id:'B',label:'B (outer, mm)',def:60},{id:'t',label:'t (wall, mm)',def:5}],calc:p=>{const{B,t}=p,bi=B-2*t,A=B*B-bi*bi,I=(Math.pow(B,4)-Math.pow(bi,4))/12,c=B/2;return{A,Ix:I,Iy:I,Sx:I/c,Sy:I/c,rx:Math.sqrt(I/A),ry:Math.sqrt(I/A),J:t*Math.pow(B-t,3)};}},
  ellipse:{label:'Solid Ellipse (a, b)',params:[{id:'a',label:'a (semi-axis x, mm)',def:60},{id:'b',label:'b (semi-axis y, mm)',def:40}],calc:p=>{const{a,b}=p,A=Math.PI*a*b,Ix=Math.PI*a*b*b*b/4,Iy=Math.PI*a*a*a*b/4;return{A,Ix,Iy,Sx:Ix/b,Sy:Iy/a,rx:b/2,ry:a/2,J:Math.PI*Math.pow(a,3)*Math.pow(b,3)/(a*a+b*b)};}},
  semicircle:{label:'Semicircle (r)',params:[{id:'r',label:'r (radius, mm)',def:50}],calc:p=>{const{r}=p,A=Math.PI*r*r/2,yC=4*r/(3*Math.PI),Ix=Math.pow(r,4)*(9*Math.PI*Math.PI-64)/(72*Math.PI),Iy=Math.PI*Math.pow(r,4)/8;return{A,Ix,Iy,Sx_top:Ix/(r-yC),Sx_bot:Ix/yC,Sy:Iy/r,rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  half_ellipse:{label:'Half Ellipse (a, b)',params:[{id:'a',label:'a (semi-axis x, mm)',def:60},{id:'b',label:'b (semi-axis y, mm)',def:40}],calc:p=>{const{a,b}=p,A=Math.PI*a*b/2,yC=4*b/(3*Math.PI),Ix=a*Math.pow(b,3)*(Math.PI/8-8/(9*Math.PI)),Iy=Math.PI*Math.pow(a,3)*b/8;return{A,Ix,Iy,Sx_top:Ix/(b-yC),Sx_bot:Ix/yC,Sy:Iy/a,rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  rhombus:{label:'Rhombus / Diamond (d1, d2)',params:[{id:'d1',label:'d1 (horiz diagonal, mm)',def:80},{id:'d2',label:'d2 (vert diagonal, mm)',def:120}],calc:p=>{const d1=p.d1,d2=p.d2,A=d1*d2/2,Ix=d1*d2*d2*d2/48,Iy=d2*d1*d1*d1/48;return{A,Ix,Iy,Sx:Ix/(d2/2),Sy:Iy/(d1/2),rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  right_triangle:{label:'Right Triangle (b, h)',params:[{id:'b',label:'b (base, mm)',def:60},{id:'h',label:'h (height, mm)',def:80}],calc:p=>{const{b,h}=p,A=b*h/2,Ix=b*h*h*h/36;return{A,Ix,Iy:h*b*b*b/36,Sx_top:Ix/(2*h/3),Sx_bot:Ix/(h/3),rx:Math.sqrt(Ix/A)};}},
  cruciform:{label:'Cruciform / Plus (w, h, t)',params:[{id:'w',label:'w (width, mm)',def:80},{id:'h',label:'h (height, mm)',def:80},{id:'t',label:'t (arm, mm)',def:20}],calc:p=>{const{w,h,t}=p,A=t*(h+w-t),Ix=t*h*h*h/12+(w-t)*t*t*t/12,Iy=t*w*w*w/12+(h-t)*t*t*t/12;return{A,Ix,Iy,Sx:Ix/(h/2),Sy:Iy/(w/2),rx:Math.sqrt(Ix/A),ry:Math.sqrt(Iy/A)};}},
  hexagon:{label:'Regular Hexagon (across-flats F)',params:[{id:'F',label:'F (across flats, mm)',def:80}],calc:p=>{const R=p.F/Math.sqrt(3),pts=[];for(let i=0;i<6;i++){const a=i*Math.PI/3;pts.push([R*Math.cos(a),R*Math.sin(a)]);}return _polyProps(pts);}},
  octagon:{label:'Regular Octagon (across-flats F)',params:[{id:'F',label:'F (across flats, mm)',def:80}],calc:p=>{const R=p.F/(2*Math.cos(Math.PI/8)),pts=[];for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;pts.push([R*Math.cos(a),R*Math.sin(a)]);}return _polyProps(pts);}},
  unequal_angle:{label:'Unequal Angle (L1, L2, t)',params:[{id:'L1',label:'L1 (long leg, mm)',def:100},{id:'L2',label:'L2 (short leg, mm)',def:65},{id:'t',label:'t (thickness, mm)',def:8}],calc:p=>{const{L1,L2,t}=p;return _polyProps([[0,0],[L2,0],[L2,t],[t,t],[t,L1],[0,L1]]);}},
  wf_unequal:{label:'I-Beam, Unequal Flanges',params:[{id:'d',label:'d (depth, mm)',def:200},{id:'bfb',label:'bf bottom (mm)',def:120},{id:'bft',label:'bf top (mm)',def:80},{id:'tf',label:'tf (flange, mm)',def:12},{id:'tw',label:'tw (web, mm)',def:8}],calc:p=>{const{d,bfb,bft,tf,tw}=p,xc=Math.max(bfb,bft)/2,bl=xc-bfb/2,br=xc+bfb/2,tl=xc-bft/2,tr=xc+bft/2,wl=xc-tw/2,wr=xc+tw/2;return _polyProps([[bl,0],[br,0],[br,tf],[wr,tf],[wr,d-tf],[tr,d-tf],[tr,d],[tl,d],[tl,d-tf],[wl,d-tf],[wl,tf],[bl,tf]]);}}
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
function circlePts(r,cx,cy){const pts=[];for(let i=0;i<48;i++){const a=i/48*2*Math.PI;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return pts;}
function drawPresetOutline(key,p){
  const c=$('c-section');if(!c)return;
  const polys=(()=>{switch(key){
    case 'rect':return [[[0,0],[p.b,0],[p.b,p.h],[0,p.h]]];
    case 'hollow_rect':{const t=p.t;return [[[0,0],[p.b,0],[p.b,p.h],[0,p.h]],[[t,t],[p.b-t,t],[p.b-t,p.h-t],[t,p.h-t]]];}
    case 'circle':{const r=(p.d||0)/2;return [circlePts(r,r,r)];}
    case 'hollow_circle':{const ro=p.do/2;return [circlePts(ro,ro,ro),circlePts((p.di||0)/2,ro,ro)];}
    case 'pipe':{const ro=p.do/2;return [circlePts(ro,ro,ro),circlePts(Math.max(0,ro-(p.t||0)),ro,ro)];}
    case 'i_beam':{const b=p.bf,tf=p.tf,d=p.d,tw=p.tw,cx=b/2;return [[[0,0],[b,0],[b,tf],[cx+tw/2,tf],[cx+tw/2,d-tf],[b,d-tf],[b,d],[0,d],[0,d-tf],[cx-tw/2,d-tf],[cx-tw/2,tf],[0,tf]]];}
    case 'channel':{const b=p.bf,tf=p.tf,d=p.d,tw=p.tw;return [[[0,0],[b,0],[b,tf],[tw,tf],[tw,d-tf],[b,d-tf],[b,d],[0,d]]];}
    case 'tee':{const b=p.bf,tf=p.tf,d=p.d,tw=p.tw,cx=b/2;return [[[0,d],[0,d-tf],[cx-tw/2,d-tf],[cx-tw/2,0],[cx+tw/2,0],[cx+tw/2,d-tf],[b,d-tf],[b,d]]];}
    case 'angle':return [[[0,0],[p.b,0],[p.b,p.t],[p.t,p.t],[p.t,p.h],[0,p.h]]];
    case 'trapezoid':{const off=((p.b||0)-(p.a||0))/2;return [[[0,0],[p.b,0],[p.b-off,p.h],[off,p.h]]];}
    case 'triangle':return [[[0,0],[p.b,0],[p.b/2,p.h]]];
    default:return null;}})();
  if(!polys||!polys[0]||!polys[0].length)return;
  const xs=polys[0].map(q=>q[0]),ys=polys[0].map(q=>q[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const span=Math.max(maxX-minX,maxY-minY,1e-6),sc=320/span,ox=(c.width-(maxX-minX)*sc)/2,oy=(c.height-(maxY-minY)*sc)/2;
  const X=q=>ox+(q[0]-minX)*sc,Y=q=>c.height-(oy+(q[1]-minY)*sc);
  const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
  x.beginPath();
  polys.forEach(poly=>{poly.forEach((q,i)=>{i?x.lineTo(X(q),Y(q)):x.moveTo(X(q),Y(q));});x.closePath();});
  x.fillStyle='rgba(255,107,53,0.18)';x.fill('evenodd');
  x.strokeStyle='#ff6b35';x.lineWidth=2;x.stroke();
  x.fillStyle='#9aa';x.font='11px JetBrains Mono,monospace';x.textAlign='center';
  x.fillText((maxX-minX).toFixed(0)+' mm wide × '+(maxY-minY).toFixed(0)+' mm tall (to scale)',c.width/2,c.height-8);
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
  saveCustomSection(res,preset.label);
  drawPresetOutline(sel.value,params);
  if(window.calc3DUpdate)try{window.calc3DUpdate('sections');}catch(e){}
  injectSectionExportButton();
};

/* ============================================================
 * BOLTS — full grade + size library, live-compute
 * ============================================================ */
const BOLT_GRADES={
  'SAE-2':{Sp:380,Sy:393,Su:510,std:'SAE J429 — low/medium-carbon (≤3/4"; larger dia drops to Sp 228)'},
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
  'A574':{Sp:1170,Sy:1241,Su:1379,std:'ASTM A574 — alloy steel SHCS, ≤ 1/2 in (heat-treated)'},
  'A574-large':{Sp:1034,Sy:1100,Su:1241,std:'ASTM A574 — alloy steel SHCS, > 1/2 in'},
  'A193-B7':{Sp:725,Sy:725,Su:860,std:'ASTM A193 B7 — Cr-Mo, hot service to 510°C'},
  'A193-B8':{Sp:170,Sy:205,Su:515,std:'ASTM A193 B8 (304 SS) — cryogenic & corrosion'},
  'A193-B8M':{Sp:170,Sy:205,Su:515,std:'ASTM A193 B8M (316 SS) — better Cl⁻ resistance'},
  'A286':{Sp:725,Sy:660,Su:895,std:'ASTM A453 Gr 660 (A286) — austenitic, to 700°C'},
  'A453-660':{Sp:725,Sy:660,Su:895,std:'ASTM A453 Gr 660 — high-temp turbine, ≈ A286'},
  '316SS':{Sp:170,Sy:205,Su:515,std:'A2-70/316 austenitic SS (annealed; cold-worked higher)'},
  '316SS-CW':{Sp:450,Sy:520,Su:700,std:'A4-80 / 316 cold-worked — high strength SS'},
  '17-4PH':{Sp:860,Sy:1000,Su:1310,std:'17-4PH H1025 condition — precipitation-hardened SS'},
  'Inconel-625':{Sp:415,Sy:415,Su:830,std:'Inconel 625 — extreme corrosion / 980°C'},
  'Inconel-718':{Sp:1034,Sy:1034,Su:1241,std:'Inconel 718 (aged) — aerospace, to 650°C'},
  'Hastelloy-C276':{Sp:355,Sy:355,Su:790,std:'Hastelloy C-276 — wet-chlorine / acid service'},
  'Monel-400':{Sp:240,Sy:240,Su:550,std:'Monel 400 — seawater, hydrofluoric acid'},
  'Monel-K500':{Sp:620,Sy:690,Su:965,std:'Monel K-500 (aged) — high-strength marine'},
  'Ti-6Al-4V':{Sp:830,Sy:830,Su:895,std:'Ti-6Al-4V Gr5 — strength/weight, biocompat'},
  'Ti-CP-Gr2':{Sp:275,Sy:275,Su:345,std:'Ti CP Gr2 — corrosion (no Al/V)'},
  'CuBe-C17200':{Sp:920,Sy:1100,Su:1310,std:'C17200 BeCu (TH04) — non-sparking, conductive'},
  'Brass-360':{Sp:240,Sy:310,Su:380,std:'C36000 free-cutting brass — low strength, good machinability'},
  'Al-2024-T4':{Sp:280,Sy:325,Su:470,std:'2024-T4 aluminum — aerospace structural (not corrosion)'},
  'Al-7075-T73':{Sp:380,Sy:435,Su:505,std:'7075-T73 aluminum — high strength, SCC-resistant'},
  'NAS-1351-Al':{Sp:380,Sy:435,Su:505,std:'NAS 1351 (7075-T73) — aerospace screws'}
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
  '1/4-28':{d:6.4,p:0.907,At:23.5,kind:'Inch UNF (fine)'},
  '5/16-24':{d:7.9,p:1.058,At:37.5,kind:'Inch UNF (fine)'},
  '3/8-24':{d:9.5,p:1.058,At:56.7,kind:'Inch UNF (fine)'},
  '7/16-20':{d:11.1,p:1.27,At:76.6,kind:'Inch UNF (fine)'},
  '1/2-20':{d:12.7,p:1.27,At:103.2,kind:'Inch UNF (fine)'},
  '9/16-18':{d:14.3,p:1.411,At:131,kind:'Inch UNF (fine)'},
  '5/8-18':{d:15.9,p:1.411,At:165.1,kind:'Inch UNF (fine)'},
  '3/4-16':{d:19,p:1.588,At:240.6,kind:'Inch UNF (fine)'},
  '7/8-14':{d:22.2,p:1.814,At:328.7,kind:'Inch UNF (fine)'},
  '1-12':{d:25.4,p:2.117,At:427.8,kind:'Inch UNF (fine)'},
  'M8x1':{d:8,p:1,At:39.2,kind:'Metric fine'},
  'M10x1.25':{d:10,p:1.25,At:61.2,kind:'Metric fine'},
  'M12x1.25':{d:12,p:1.25,At:92.1,kind:'Metric fine'},
  'M12x1.5':{d:12,p:1.5,At:88.1,kind:'Metric fine'},
  'M14x1.5':{d:14,p:1.5,At:124.5,kind:'Metric fine'},
  'M16x1.5':{d:16,p:1.5,At:167.2,kind:'Metric fine'},
  'M18x1.5':{d:18,p:1.5,At:216.2,kind:'Metric fine'},
  'M20x1.5':{d:20,p:1.5,At:271.5,kind:'Metric fine'},
  'M24x2':{d:24,p:2,At:384.4,kind:'Metric fine'},
  'M56':{d:56.0,p:5.50,At:2030,kind:'Metric coarse'},
  'M64':{d:64.0,p:6.00,At:2676,kind:'Metric coarse'}
};
function orderedBoltSizes(){
  const fam=['Metric coarse','Metric fine','Inch UNC','Inch UNF (fine)','Inch UNC (very fine)'];
  const groups={};
  Object.entries(BOLT_SIZES).forEach(([k,z])=>{(groups[z.kind]=groups[z.kind]||[]).push([k,z]);});
  const order=fam.concat(Object.keys(groups).filter(k=>fam.indexOf(k)<0));
  return order.filter(k=>groups[k]).map(kind=>{const list=groups[kind];list.sort((a,b)=>a[1].d-b[1].d||a[1].p-b[1].p);return[kind,list];});
}
function populateBoltDropdowns(){
  const g=$('bl-grade'),s=$('bl-size');
  if(g){g.innerHTML='';Object.keys(BOLT_GRADES).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k+' (Sp '+BOLT_GRADES[k].Sp+' MPa)';g.appendChild(o);});g.value='SAE-5';}
  const fams=orderedBoltSizes();
  if(s){s.innerHTML='';fams.forEach(([kind,list])=>{const og=document.createElement('optgroup');og.label=kind.toUpperCase()+' ('+list.length+')';list.forEach(([k,z])=>{const o=document.createElement('option');o.value=k;o.textContent=k+' (At '+z.At+' mm²)';og.appendChild(o);});s.appendChild(og);});s.value='1/2-13';}
  const gtbl=$('bl-grade-tbl');if(gtbl){gtbl.innerHTML=Object.entries(BOLT_GRADES).map(([k,g])=>`<tr><td>${k}</td><td>${g.Sp}</td><td>${g.Sy}</td><td>${g.Su}</td></tr>`).join('');}
  const stbl=$('bl-size-tbl');if(stbl){stbl.innerHTML=fams.map(([kind,list])=>`<tr><td colspan="4" style="color:var(--accent);font-size:.65rem;letter-spacing:1px">${kind.toUpperCase()}</td></tr>`+list.map(([k,z])=>`<tr><td>${k}</td><td>${z.d}</td><td>${z.p}</td><td>${z.At}</td></tr>`).join('')).join('');}
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
  _mr(out,'<h3>JOINT RESULTS — '+sv('bl-size')+' '+sv('bl-grade')+' × '+n+'</h3>'+
    '<div class="result-grid">'+items.map(i=>`<div class="result-item"><div class="lbl">${i[0]}</div><div class="val ${i[2]||''}">${i[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem"><strong>Standard:</strong> '+grade.std+'. <strong>Size:</strong> '+size.kind+', d_nom='+size.d+' mm, pitch='+size.p+' mm, A_t='+size.At+' mm².<br><strong>Method:</strong> Shigley joint stiffness — F_b = F_i + C·F_ext, F_j = F_i − (1−C)·F_ext. Stiffness ratio C = k_bolt/(k_bolt + k_member) — typical 0.2–0.4 for steel-on-steel. Preload 75% of proof for reusable; up to 90% for permanent. Torque T=K·F_i·d with K≈0.20 dry, 0.15 lubricated. Interaction IR = (σ/Sp)² + (τ/0.577·Sp)² &lt; 1.</p>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>Thin-material rule of thumb:</strong> tap depth ≥ 1.0·d in steel, 1.5·d in aluminum, 2.0·d in plastic for full strength. Below 0.5·d the joint will strip the threads before the bolt yields.</p>');
  const _bpn=$('bp-n');
  if(_bpn&&_bpn!==document.activeElement&&parseInt(_bpn.value)!==n){_bpn.value=n;if(typeof window.drawBoltPattern==='function')try{window.drawBoltPattern();}catch(e){}}
  const _teb=$('te-sub');
  if(_teb&&_teb!==document.activeElement&&parseFloat(_teb.value)!==Su){_teb.value=Su;if(typeof window.calcThreadEngage==='function')try{window.calcThreadEngage();}catch(e){}}
  const _bsync={'bts-fi':Fi,'bts-d':size.d,'bts-pitch':size.p,'bts-kn':mu,'bts-c':C,'bts-fext':FextPer};
  let _bany=false;
  for(const _bk in _bsync){const _be=$(_bk),_bv=_bsync[_bk];if(_be&&_be!==document.activeElement&&isFinite(_bv)){const _bs=String(Math.round(_bv*1000)/1000);_be.value!==_bs&&(_be.value=_bs,_bany=true);}}
  if(_bany&&typeof window.calcBoltTorqueSeq==='function')try{window.calcBoltTorqueSeq();}catch(e){}
};
const FIT_RANGES=[3,6,10,18,30,50,80,120,180,250,315,400,500];
const FIT_IT={5:[4,5,6,8,9,11,13,15,18,20,23,25,27],6:[6,8,9,11,13,16,19,22,25,29,32,36,40],7:[10,12,15,18,21,25,30,35,40,46,52,57,63],8:[14,18,22,27,33,39,46,54,63,72,81,89,97],9:[25,30,36,43,52,62,74,87,100,115,130,140,155],10:[40,48,58,70,84,100,120,140,160,185,210,230,250],11:[60,75,90,110,130,160,190,220,250,290,320,360,400]};
const FIT_SHAFT={d:{t:'es',v:[-20,-30,-40,-50,-65,-80,-100,-120,-145,-170,-190,-210,-230]},e:{t:'es',v:[-14,-20,-25,-32,-40,-50,-60,-72,-85,-100,-110,-125,-135]},f:{t:'es',v:[-6,-10,-13,-16,-20,-25,-30,-36,-43,-50,-56,-62,-68]},g:{t:'es',v:[-2,-4,-5,-6,-7,-9,-10,-12,-14,-15,-17,-18,-20]},h:{t:'es',v:[0,0,0,0,0,0,0,0,0,0,0,0,0]},k:{t:'ei',v:[0,1,1,1,2,2,2,3,3,4,4,4,5]},m:{t:'ei',v:[2,4,6,7,8,9,11,13,15,17,20,21,23]},n:{t:'ei',v:[4,8,10,12,15,17,20,23,27,31,34,37,40]},p:{t:'ei',v:[6,12,15,18,22,26,32,37,43,50,56,62,68]},c:{t:'es',bp:[[3,-60],[6,-70],[10,-80],[18,-95],[30,-110],[40,-120],[50,-130],[65,-140],[80,-150],[100,-170],[120,-180]]},r:{t:'ei',bp:[[3,10],[6,15],[10,19],[18,23],[30,28],[50,34],[65,41],[80,43],[100,51],[120,54]]},s:{t:'ei',bp:[[3,14],[6,19],[10,23],[18,28],[30,35],[50,43],[65,53],[80,59],[100,71],[120,79]]}};
function fitRangeIdx(D){if(!(D>0)||D>500)return -1;for(let i=0;i<FIT_RANGES.length;i++)if(D<=FIT_RANGES[i])return i;return -1;}
function fitDeviation(letter,D,it){
  if(letter==='js')return{sym:FIT_IT[it]?FIT_IT[it][fitRangeIdx(D)]/2:null};
  const e=FIT_SHAFT[letter];if(!e)return null;
  if(e.bp){for(const[mx,val]of e.bp)if(D<=mx)return{t:e.t,v:val};return null;}
  const ri=fitRangeIdx(D);if(ri<0)return null;
  let v0=e.v[ri];
  if(letter==='k'&&it>=8)v0=0;
  return{t:e.t,v:v0};
}
window.applyPreferredFit=function(){
  const pv=sv('ft-pref');if(!pv)return;
  const m=/^([A-Z]+)(\d+)\/([a-z]+)(\d+)$/.exec(pv);if(!m)return;
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  set('ft-hl',m[1]);set('ft-hg',m[2]);set('ft-sl',m[3]);set('ft-sg',m[4]);
  window.calcFits();
};
window.calcFits=function(){
  const D=v('ft-d'),hl=sv('ft-hl')||'H',hg=parseInt(sv('ft-hg'))||7,sl=sv('ft-sl')||'g',sg=parseInt(sv('ft-sg'))||6;
  const out=$('fits-results');if(!out)return;
  const ri=fitRangeIdx(D);
  if(ri<0){_mr(out,'<h3>FIT RESULTS</h3><div class="note warn">Nominal size must be 0 &lt; Ø ≤ 500 mm.</div>');return;}
  const ITh=FIT_IT[hg]?FIT_IT[hg][ri]:null,ITs=FIT_IT[sg]?FIT_IT[sg][ri]:null;
  if(ITh==null||ITs==null){_mr(out,'<h3>FIT RESULTS</h3><div class="note warn">Grade must be IT5–IT11.</div>');return;}
  let EI,ES;
  if(hl==='JS'){ES=ITh/2;EI=-ITh/2;}
  else if(hl==='H'){EI=0;ES=ITh;}
  else{const sd=fitDeviation(hl.toLowerCase(),D,hg);if(!sd||sd.v==null){_mr(out,'<h3>FIT RESULTS</h3><div class="note warn">Hole class '+hl+' not available at this size.</div>');return;}EI=-sd.v;ES=EI+ITh;}
  let es,ei;
  const dv=fitDeviation(sl,D,sg);
  if(!dv){_mr(out,'<h3>FIT RESULTS</h3><div class="note warn">Shaft class '+sl+sg+' not covered'+(D>120&&(sl==='r'||sl==='s'||sl==='c')?' above 120 mm — consult the ISO 286 table':'')+'.</div>');return;}
  if(dv.sym!=null){es=dv.sym;ei=-dv.sym;}
  else if(dv.t==='es'){es=dv.v;ei=es-ITs;}
  else{ei=dv.v;es=ei+ITs;}
  const cmax=ES-ei,cmin=EI-es;
  const kind=cmin>=0?'CLEARANCE':cmax<=0?'INTERFERENCE':'TRANSITION';
  const f3=n=>(D+n/1000).toFixed(3);
  const rows=[
    ['Fit',hl+hg+' / '+sl+sg+' @ Ø'+D+' mm'],
    ['Hole '+hl+hg,'+'+ES+' / '+(EI>=0?'+':'')+EI+' µm'],
    ['Hole limits',f3(EI)+' – '+f3(ES)+' mm'],
    ['Shaft '+sl+sg,(es>=0?'+':'')+es+' / '+(ei>=0?'+':'')+ei+' µm'],
    ['Shaft limits',f3(ei)+' – '+f3(es)+' mm'],
    ['Type',kind,kind==='CLEARANCE'?'ok':kind==='INTERFERENCE'?'warn':''],
  ];
  kind!=='INTERFERENCE'&&rows.push(['Clearance (max)',cmax+' µm']);
  cmin>=0?rows.push(['Clearance (min)',cmin+' µm']):rows.push(['Interference (max)',(-cmin)+' µm']);
  cmax<=0&&rows.push(['Interference (min)',(-cmax)+' µm']);
  _mr(out,'<h3>FIT RESULTS — '+hl+hg+'/'+sl+sg+'</h3><div class="result-grid">'+rows.map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val ${r[2]||''}">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">ISO 286-1 published IT grades and fundamental deviations (hole letters D–H mirror shafts; JS symmetric). '+(kind==='CLEARANCE'?'Guaranteed running clearance across tolerance extremes.':kind==='INTERFERENCE'?'Guaranteed interference — press/thermal assembly; capacity computed in the press-fit card.':'May assemble loose or tight depending on where parts land in tolerance — typical for keyed locational fits.')+'</p>');
  drawFitDiagram(D,ES,EI,es,ei);
  if(kind!=='CLEARANCE'){
    const iMax=-cmin,iMin=Math.max(0,-cmax);
    [['pf-d',D],['pf-dmin',iMin],['pf-dmax',iMax]].forEach(([id,val])=>{const el=$(id);if(el&&el!==document.activeElement&&parseFloat(el.value)!==val)el.value=val;});
    if(typeof window.calcPressFit==='function')try{window.calcPressFit();}catch(e){}
  }
};
function drawFitDiagram(D,ES,EI,es,ei){
  const c=$('c-fits');if(!c)return;
  const x=c.getContext('2d'),W=c.width,H=c.height,t=pTheme();
  x.fillStyle=t.plot;x.fillRect(0,0,W,H);
  const all=[ES,EI,es,ei,0],hi=Math.max(...all),lo=Math.min(...all),span=Math.max(hi-lo,1);
  const y0=40,y1=H-40,scl=(y1-y0)/span,yOf=u=>y0+(hi-u)*scl;
  x.strokeStyle=t.text;x.lineWidth=1.5;x.beginPath();x.moveTo(30,yOf(0));x.lineTo(W-30,yOf(0));x.stroke();
  x.fillStyle=t.dim;x.font='10px JetBrains Mono,monospace';x.fillText('0 (Ø'+D+' mm)',W-115,yOf(0)-5);
  const zone=(cx,w,top,bot,col,lbl,uTop,uBot)=>{
    const yT=yOf(top),yB=yOf(bot);
    x.fillStyle=col+'30';x.strokeStyle=col;x.lineWidth=1.5;
    x.fillRect(cx-w/2,yT,w,Math.max(2,yB-yT));x.strokeRect(cx-w/2,yT,w,Math.max(2,yB-yT));
    x.fillStyle=t.text;x.textAlign='center';x.fillText(lbl,cx,yT-6);
    x.fillStyle=t.dim;x.fillText((uTop>=0?'+':'')+uTop,cx,yT+12);x.fillText((uBot>=0?'+':'')+uBot,cx,yB-4);x.textAlign='left';
  };
  zone(W*0.33,90,ES,EI,'#3b82f6','HOLE',ES,EI);
  zone(W*0.67,90,es,ei,(/^#[0-9a-f]{6}$/i.test(t.accent)?t.accent:'#ff6b35'),'SHAFT',es,ei);
  x.fillStyle=t.dim;x.fillText('µm',8,y0-8);
}
window.calcPressFit=function(){
  const d=v('pf-d'),dO=v('pf-do'),dI=v('pf-di')||0,L=v('pf-l'),mu=v('pf-mu')||0.15,clr=v('pf-clr')||0;
  const Eh=(v('pf-eh')||200)*1000,Es2=(v('pf-es')||200)*1000,nu=v('pf-nu')||0.3,al=v('pf-al')||11.7;
  const o=$('pf-out');if(!o)return;
  if(!(d>0)||!(dO>d)||!(L>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need d &gt; 0, hub OD &gt; d, L &gt; 0.</div>');return;}
  if(dI>=d){_mr(o,'<div class="note warn" style="margin-top:.5rem">Shaft bore must be smaller than the interface Ø.</div>');return;}
  const bracket=d*((1/Eh)*((dO*dO+d*d)/(dO*dO-d*d)+nu)+(1/Es2)*((d*d+dI*dI)/(d*d-dI*dI)-nu));
  const one=du=>{const p=(du/1000)/bracket;return{p:p,F:mu*p*Math.PI*d*L,T:mu*p*Math.PI*d*d*L/2000,st:p*(dO*dO+d*d)/(dO*dO-d*d)};};
  const dmin=Math.max(0,v('pf-dmin')),dmax=Math.max(dmin,v('pf-dmax'));
  const a=one(dmin),b=one(dmax);
  const dT=(dmax+clr)/(al*d/1000);
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['p contact @ δmin',a.p.toFixed(1)+' MPa'],['p contact @ δmax',b.p.toFixed(1)+' MPa'],
    ['T holding @ δmin',a.T.toFixed(1)+' N·m',a.T>0?'ok':'warn'],['T holding @ δmax',b.T.toFixed(1)+' N·m'],
    ['F axial @ δmin',Math.round(a.F)+' N'],['F axial @ δmax',Math.round(b.F)+' N'],
    ['σ_t hub bore @ δmax',b.st.toFixed(1)+' MPa',b.st<250?'ok':'warn'],['ΔT to slip on (hub heat)',Math.round(dT)+' K']
  ].map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val ${r[2]||''}">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Lamé thick-cylinder contact pressure, diametral interference. Rate holding capacity at δ_min (worst case); check hub bore tangential stress at δ_max against yield with FoS. Heating ΔT includes the assembly clearance; keep below the hub temper temperature.</p>');
};
function injectBeamFnCard(){
  const vw=$('v-vibration');if(!vw||$('bfn-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='bfn-card';
  card.innerHTML='<h3>BEAM NATURAL FREQUENCY (CONTINUOUS)</h3><div class="row">'+
    '<div class="field"><label for="bf2-bc">BOUNDARY</label><select id="bf2-bc"><option value="ss">SIMPLY SUPPORTED</option><option value="cant">CANTILEVER</option><option value="ff">FIXED-FIXED</option><option value="fp">FIXED-PINNED</option></select></div>'+
    '<div class="field"><label for="bf2-e">E (GPa)</label><input type="number" id="bf2-e" value="200" step="any"></div>'+
    '<div class="field"><label for="bf2-i">I (cm⁴)</label><input type="number" id="bf2-i" value="100" step="any"></div>'+
    '<div class="field"><label for="bf2-l">L (m)</label><input type="number" id="bf2-l" value="3" step="any"></div>'+
    '<div class="field"><label for="bf2-m">MASS/LENGTH (kg/m)</label><input type="number" id="bf2-m" value="20" step="any"></div>'+
    '</div><button class="btn btn-fill" onclick="calcBeamFn()" style="margin-top:.75rem">COMPUTE MODES</button>';
  host.appendChild(card);
}
window.calcBeamFn=function(){
  const bc=sv('bf2-bc')||'ss',E=(v('bf2-e')||200)*1e9,I=(v('bf2-i')||0)*1e-8,L=v('bf2-l'),mb=v('bf2-m');
  const out=$('vibration-results');if(!out)return;
  if(!(L>0)||!(mb>0)||!(I>0)){_mr(out,'<h3>BEAM NATURAL FREQUENCY</h3><div class="note warn">Need I, L, mass/length &gt; 0.</div>');return;}
  const LAM={ss:[9.870,39.48,88.83],cant:[3.516,22.03,61.70],ff:[22.37,61.67,120.9],fp:[15.42,49.96,104.2]}[bc];
  const NM={ss:'Simply supported',cant:'Cantilever',ff:'Fixed–fixed',fp:'Fixed–pinned'}[bc];
  const base=Math.sqrt(E*I/(mb*Math.pow(L,4)))/(2*Math.PI);
  const f=LAM.map(l2=>l2*base);
  _mr(out,'<h3>BEAM NATURAL FREQUENCY — '+NM.toUpperCase()+'</h3><div class="result-grid">'+[
    ['f₁ (mode 1)',f[0].toFixed(2)+' Hz'],['f₂ (mode 2)',f[1].toFixed(2)+' Hz'],['f₃ (mode 3)',f[2].toFixed(2)+' Hz'],
    ['N₁ critical',Math.round(f[0]*60)+' rpm'],['λ₁²',LAM[0].toFixed(3)],['√(EI/m̄L⁴)/2π',base.toExponential(3)+' Hz']
  ].map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Euler-Bernoulli continuous beam, f_i = λ_i²/2π·√(EI/m̄L⁴) (Blevins constants). Uniform section, no axial load, no added point masses — first-pass values; shear &amp; rotary inertia (Timoshenko) lower the high modes for deep beams. Keep excitation ≥ ±20% away from each f_i.</p>');
};
let _tsN=0;
window.addTolRow=function(lbl,nom,tol,sgn){
  const host=$('ts-rows');if(!host)return;
  const i=++_tsN,row=document.createElement('div');row.className='row ts-row';row.style.cssText='gap:.5rem;margin-top:.35rem;align-items:flex-end';
  row.innerHTML=`<div class="field" style="min-width:110px"><label for="ts-lbl-${i}">NAME</label><input type="text" id="ts-lbl-${i}" value="${lbl||'Dim '+i}" style="width:100%"></div>`+
    `<div class="field" style="min-width:90px"><label for="ts-nom-${i}">NOMINAL (mm)</label><input type="number" id="ts-nom-${i}" value="${nom!=null?nom:10}" step="any"></div>`+
    `<div class="field" style="min-width:80px"><label for="ts-tol-${i}">± TOL (mm)</label><input type="number" id="ts-tol-${i}" value="${tol!=null?tol:0.1}" step="any" min="0"></div>`+
    `<div class="field" style="min-width:70px"><label for="ts-sgn-${i}">DIR</label><select id="ts-sgn-${i}"><option value="1"${sgn!==-1?' selected':''}>+</option><option value="-1"${sgn===-1?' selected':''}>−</option></select></div>`+
    `<button type="button" class="btn btn-sm" onclick="this.closest('.ts-row').remove();calcTolStack()" title="remove">✕</button>`;
  host.appendChild(row);
};
window.calcTolStack=function(){
  const host=$('ts-rows'),out=$('ts-out');if(!host||!out)return;
  const rows=[].slice.call(host.querySelectorAll('.ts-row')).map(r=>{
    const g=s=>r.querySelector('[id^="ts-'+s+'-"]');
    return{lbl:(g('lbl')||{}).value||'?',nom:parseFloat((g('nom')||{}).value)||0,tol:Math.abs(parseFloat((g('tol')||{}).value)||0),sgn:parseInt((g('sgn')||{}).value)||1};
  });
  if(rows.length<2){_mr(out,'<div class="note warn" style="margin-top:.5rem">Add at least two dimensions.</div>');return;}
  const nom=rows.reduce((a,r)=>a+r.sgn*r.nom,0);
  const wc=rows.reduce((a,r)=>a+r.tol,0);
  const rss=Math.sqrt(rows.reduce((a,r)=>a+r.tol*r.tol,0));
  const big=rows.slice().sort((a,b)=>b.tol-a.tol)[0];
  const pct=rss>0?(big.tol*big.tol/(rss*rss)*100):0;
  _mr(out,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['Nominal gap',nom.toFixed(3)+' mm'],
    ['Worst case','± '+wc.toFixed(3)+' mm'],
    ['WC limits',(nom-wc).toFixed(3)+' – '+(nom+wc).toFixed(3)+' mm',nom-wc<0&&nom>0?'warn':''],
    ['RSS (±3σ)','± '+rss.toFixed(3)+' mm'],
    ['RSS limits',(nom-rss).toFixed(3)+' – '+(nom+rss).toFixed(3)+' mm'],
    ['Top contributor',big.lbl+' ('+pct.toFixed(0)+'% of RSS²)']
  ].map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val ${r[2]||''}">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">WC guarantees assembly at any in-tolerance combination; RSS (√Σtol²) reflects ±3σ statistical stacking when each dimension is an independent, centered ±3σ process — typical for &gt;4-dim chains. Negative WC minimum with a positive nominal gap means worst-case interference: tighten the top contributor first.</p>');
};
function injectTolRows(){const host=$('ts-rows');if(!host||host.children.length)return;window.addTolRow('Housing',50,0.15,1);window.addTolRow('Bearing',20,0.05,-1);window.addTolRow('Shaft shoulder',29.5,0.10,-1);window.calcTolStack();}
const AIR_T=[250,300,350,400,450,500],AIR_NU=[11.44,15.89,20.92,26.41,32.39,38.79],AIR_K=[22.3,26.3,30.0,33.8,37.3,40.7],AIR_PR=[0.720,0.707,0.700,0.690,0.686,0.684];
function airProps(TK){
  const T=Math.max(AIR_T[0],Math.min(AIR_T[AIR_T.length-1],TK));
  let i=0;while(i<AIR_T.length-2&&T>AIR_T[i+1])i++;
  const f=(T-AIR_T[i])/(AIR_T[i+1]-AIR_T[i]);
  const lerp=a=>a[i]+f*(a[i+1]-a[i]);
  return{nu:lerp(AIR_NU)*1e-6,k:lerp(AIR_K)*1e-3,pr:lerp(AIR_PR),beta:1/TK,clamped:TK<AIR_T[0]||TK>AIR_T[AIR_T.length-1]};
}
window.__airProps=airProps;
function injectNatConv(){
  const vw=$('v-thermal');if(!vw||$('nc-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='nc-card';
  card.innerHTML='<h3>NATURAL CONVECTION (CHURCHILL-CHU)</h3><div class="row">'+
    '<div class="field"><label for="nc-geo">GEOMETRY</label><select id="nc-geo"><option value="vplate">VERTICAL PLATE (L = height)</option><option value="hcyl">HORIZONTAL CYLINDER (L = Ø)</option></select></div>'+
    '<div class="field"><label for="nc-l">L characteristic (m)</label><input type="number" id="nc-l" value="0.5" step="any"></div>'+
    '<div class="field"><label for="nc-ts">T_surf (°C)</label><input type="number" id="nc-ts" value="60" step="any"></div>'+
    '<div class="field"><label for="nc-ti">T_inf (°C)</label><input type="number" id="nc-ti" value="20" step="any"></div>'+
    '<div class="field"><label for="nc-fl">FLUID</label><select id="nc-fl" onchange="var m=document.getElementById(\'nc-man\');if(m)m.style.display=this.value===\'manual\'?\'\':\'none\';"><option value="air">AIR (props auto @ film T)</option><option value="manual">MANUAL PROPERTIES</option></select></div>'+
    '</div><div class="row" id="nc-man" style="margin-top:.5rem;display:none">'+
    '<div class="field"><label for="nc-nu">ν (×10⁻⁶ m²/s)</label><input type="number" id="nc-nu" value="15.9" step="any"></div>'+
    '<div class="field"><label for="nc-k">k (W/m·K)</label><input type="number" id="nc-k" value="0.026" step="any"></div>'+
    '<div class="field"><label for="nc-pr">Pr</label><input type="number" id="nc-pr" value="0.71" step="any"></div>'+
    '<div class="field"><label for="nc-b">β (×10⁻³ 1/K)</label><input type="number" id="nc-b" value="3.2" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcNatConv()" style="margin-top:.6rem">COMPUTE h</button>';
  host.appendChild(card);
}
window.calcNatConv=function(){
  const out=$('thermal-results');if(!out)return;
  const geo=sv('nc-geo')||'vplate',L=v('nc-l'),Ts=v('nc-ts'),Ti=v('nc-ti'),man=sv('nc-fl')==='manual';
  if(!(L>0)||!isFinite(Ts)||!isFinite(Ti)||Ts===Ti){_mr(out,'<h3>NATURAL CONVECTION</h3><div class="note warn">Need L &gt; 0 and T_surf ≠ T_inf.</div>');return;}
  const Tf=(Ts+Ti)/2+273.15;
  const pr2=man?{nu:(v('nc-nu')||15.9)*1e-6,k:v('nc-k')||0.026,pr:v('nc-pr')||0.71,beta:(v('nc-b')||3.2)*1e-3,clamped:false}:airProps(Tf);
  const dT=Math.abs(Ts-Ti);
  const Ra=9.81*pr2.beta*dT*Math.pow(L,3)/(pr2.nu*pr2.nu)*pr2.pr;
  const prTerm=c=>Math.pow(1+Math.pow(c/pr2.pr,9/16),8/27);
  let Nu,valid='';
  if(geo==='hcyl'){Nu=Math.pow(0.60+0.387*Math.pow(Ra,1/6)/prTerm(0.559),2);Ra>1e12&&(valid='⚠ Ra &gt; 10¹² — outside Churchill-Chu cylinder validity. ');}
  else{Nu=Math.pow(0.825+0.387*Math.pow(Ra,1/6)/prTerm(0.492),2);}
  const h=Nu*pr2.k/L,q=h*dT;
  const hEl=$('tv-h');if(hEl&&hEl!==document.activeElement){hEl.value=h.toFixed(2);}
  _mr(out,'<h3>NATURAL CONVECTION — '+(geo==='hcyl'?'HORIZONTAL CYLINDER':'VERTICAL PLATE')+'</h3><div class="result-grid">'+[
    ['Ra Rayleigh',Ra.toExponential(3)],['Nu',Nu.toFixed(1)],['h',h.toFixed(2)+' W/m²K'],['q″ = h·ΔT',q.toFixed(1)+' W/m²'],
    ['Film T',(Tf-273.15).toFixed(1)+' °C'],['Regime',Ra<1e9?'Laminar':'Turbulent']
  ].map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">'+valid+(pr2.clamped?'⚠ Film temperature outside the 250–500 K air-property table — props clamped. ':'')+'Churchill-Chu all-Ra correlation; h auto-filled into the CONVECTION card above. Air properties interpolated at film temperature (Incropera Table A.4). For horizontal plates or enclosures use the geometry-specific correlations.</p>');
};
const TEMA_RF=[['Distilled / closed-loop water',0.000088],['Seawater ≤ 52 °C',0.000088],['Treated cooling-tower water',0.000176],['River water',0.000441],['Steam (oil-free)',0.000088],['Refrigerant liquid',0.000176],['Compressed air',0.000176],['Light fuel oil',0.000881],['Lube oil',0.000352]];
function injectFouledU(){
  const vw=$('v-hx');if(!vw||$('fu-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const opts=TEMA_RF.map(([n,r])=>`<option value="${r}">${n} (${r})</option>`).join('')+'<option value="custom">CUSTOM</option>';
  const card=document.createElement('div');card.className='card';card.id='fu-card';
  card.innerHTML='<h3>FOULED U (TEMA)</h3><div class="row">'+
    '<div class="field"><label for="fu-uc">U clean (W/m²K)</label><input type="number" id="fu-uc" value="500" step="any"></div>'+
    '<div class="field"><label for="fu-h">HOT-SIDE SERVICE</label><select id="fu-h">'+opts+'</select></div>'+
    '<div class="field"><label for="fu-hc">Rf hot custom (m²K/W)</label><input type="number" id="fu-hc" value="0.0002" step="any"></div>'+
    '<div class="field"><label for="fu-c">COLD-SIDE SERVICE</label><select id="fu-c">'+opts+'</select></div>'+
    '<div class="field"><label for="fu-cc">Rf cold custom (m²K/W)</label><input type="number" id="fu-cc" value="0.0002" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcFouledU()" style="margin-top:.6rem">COMPUTE FOULED U</button><div id="fu-out"></div>';
  host.appendChild(card);
}
window.calcFouledU=function(){
  const o=$('fu-out');if(!o)return;
  const Uc=v('fu-uc');
  const rf=side=>{const s=sv('fu-'+side);return s==='custom'?(v('fu-'+side+'c')||0):(parseFloat(s)||0);};
  const Rh=rf('h'),Rc=rf('c');
  if(!(Uc>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">U clean must be &gt; 0.</div>');return;}
  const Ud=1/(1/Uc+Rh+Rc),der=(1-Ud/Uc)*100;
  const uEl=$('hx-u');if(uEl&&uEl!==document.activeElement&&Math.abs(parseFloat(uEl.value)-Ud)>0.05){uEl.value=Ud.toFixed(1);if(typeof window.calcLMTD==='function')try{window.calcLMTD();}catch(e){}}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['U dirty',Ud.toFixed(1)+' W/m²K'],['Derate',der.toFixed(1)+' %',der<30?'ok':'warn'],['ΣRf',(Rh+Rc).toExponential(2)+' m²K/W'],['Extra area needed','+'+(Uc/Ud*100-100).toFixed(1)+' %']
  ].map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val ${r[2]||''}">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">U_dirty = 1/(1/U_clean + ΣRf), TEMA typical fouling resistances. The fouled U is written into the LMTD card so Q reflects end-of-service performance; size A for the dirty condition.</p>');
};
function injectAgmaPitting(){
  const vw=$('v-gears');if(!vw||$('ag-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='ag-card';
  card.innerHTML='<h3>AGMA PITTING (SURFACE DURABILITY)</h3><div class="row">'+
    '<div class="field"><label for="ag-wt">W_t (N)</label><input type="number" id="ag-wt" value="1000" step="any"></div>'+
    '<div class="field"><label for="ag-np">PINION TEETH N_p</label><input type="number" id="ag-np" value="16" step="1"></div>'+
    '<div class="field"><label for="ag-m">MODULE m (mm)</label><input type="number" id="ag-m" value="3" step="any"></div>'+
    '<div class="field"><label for="ag-mg">RATIO m_G</label><input type="number" id="ag-mg" value="4" step="any"></div>'+
    '<div class="field"><label for="ag-b">FACE b (mm)</label><input type="number" id="ag-b" value="40" step="any"></div>'+
    '<div class="field"><label for="ag-phi">φ (°)</label><input type="number" id="ag-phi" value="20" step="any"></div>'+
    '</div><div class="row" style="margin-top:.5rem">'+
    '<div class="field"><label for="ag-ze">Z_E (√MPa)</label><select id="ag-ze"><option value="191">STEEL / STEEL (191)</option><option value="custom">CUSTOM →</option></select></div>'+
    '<div class="field"><label for="ag-zec">Z_E custom</label><input type="number" id="ag-zec" value="191" step="any"></div>'+
    '<div class="field"><label for="ag-ko">K_o overload</label><input type="number" id="ag-ko" value="1" step="0.05"></div>'+
    '<div class="field"><label for="ag-kv">K_v dynamic</label><input type="number" id="ag-kv" value="1.2" step="0.05"></div>'+
    '<div class="field"><label for="ag-kh">K_H load dist.</label><input type="number" id="ag-kh" value="1.6" step="0.05"></div>'+
    '<div class="field"><label for="ag-hb">PINION HB</label><input type="number" id="ag-hb" value="300" step="1"></div>'+
    '</div><button class="btn btn-sm" onclick="calcAgmaPitting()" style="margin-top:.6rem">COMPUTE σ_H</button>';
  host.appendChild(card);
}
window.calcAgmaPitting=function(){
  const out=$('gears-results');if(!out)return;
  const Wt=v('ag-wt'),Np=Math.max(6,Math.round(v('ag-np'))||16),m=v('ag-m'),mG=v('ag-mg')||1,b=v('ag-b'),phi=(v('ag-phi')||20)*Math.PI/180;
  const ZE=sv('ag-ze')==='custom'?(v('ag-zec')||191):191;
  const Ko=v('ag-ko')||1,Kv=v('ag-kv')||1,KH=v('ag-kh')||1,HB=v('ag-hb')||300;
  if(!(Wt>0)||!(m>0)||!(b>0)){_mr(out,'<h3>AGMA PITTING</h3><div class="note warn">Need W_t, m, b &gt; 0.</div>');return;}
  const d1=m*Np;
  const ZI=Math.cos(phi)*Math.sin(phi)/2*(mG/(mG+1));
  const sH=ZE*Math.sqrt(Wt*Ko*Kv*KH/(d1*b*ZI));
  const Sc=2.22*HB+200;
  const SH=Sc/sH;
  _mr(out,'<h3>AGMA PITTING — SPUR, EXTERNAL MESH</h3><div class="result-grid">'+[
    ['d_p pinion',d1.toFixed(1)+' mm'],['Z_I geometry',ZI.toFixed(4)],['σ_H contact',sH.toFixed(0)+' MPa',''],
    ['S_c allowable (Gr.1, HB'+HB+')',Sc.toFixed(0)+' MPa'],['S_H = S_c/σ_H',SH.toFixed(2),SH>=1.2?'ok':SH>=1?'warn':'err'],
    ['Status',SH>=1.2?'PITTING OK':SH>=1?'MARGINAL':'PITTING RISK',SH>=1.2?'ok':SH>=1?'warn':'err']
  ].map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val ${r[2]||''}">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Shigley/AGMA 2101: σ_H = Z_E·√(W_t·K_o·K_v·K_H/(d_p·b·Z_I)), Z_I = cosφ·sinφ/2 · m_G/(m_G+1) (spur, m_N=1). S_c = 2.22·HB+200 MPa (Grade 1 through-hardened steel, 10⁷ cycles, 99% reliability); apply Z_N life and Z_W hardness-ratio factors for other conditions. K_s and Z_R taken as 1. Complements the Lewis BENDING card — pitting usually governs hardened industrial gears.</p>');
};
function dsgnCondRow(px){
  return '<div class="row" style="margin-top:.5rem">'+
    '<div class="field"><label for="'+px+'-load2">LOADING</label><select id="'+px+'-load2"><option value="static">STATIC / STEADY</option><option value="dyn">VIBRATION / CYCLIC</option><option value="shock">SHOCK / IMPACT</option></select></div>'+
    '<div class="field"><label for="'+px+'-temp2">SERVICE TEMP (°C)</label><input type="number" id="'+px+'-temp2" value="20" step="any"></div>'+
    '<div class="field"><label for="'+px+'-env2">ENVIRONMENT</label><select id="'+px+'-env2"><option value="dry">DRY / INDOOR</option><option value="wet">WET / OUTDOOR</option><option value="marine">MARINE / SALT</option><option value="chem">CHEMICAL</option></select></div></div>';
}
function dsgnCond(px){return{load:sv(px+'-load2')||'static',temp:isFinite(v(px+'-temp2'))?v(px+'-temp2'):20,env:sv(px+'-env2')||'dry'};}
const BOLT_SE=[[/12\.9/,190],[/10\.9/,162],[/9\.8/,140],[/8\.8/,129],[/SAE-8/,160],[/SAE-7/,142],[/SAE-5/,128]];
function boltSe(gradeKey){for(const[re,se]of BOLT_SE)if(re.test(gradeKey))return se;return null;}
function injectBoltDesigner(){
  const vw=$('v-bolts');if(!vw||$('bd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='bd-card';
  card.innerHTML='<h3>⚡ BOLT DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">How many, what material, what load → the smallest standard bolt that works, what to torque it to, and what to expect.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="bd-n"># BOLTS</label><input type="number" id="bd-n" value="4" min="1" step="1"></div>'+
    '<div class="field"><label for="bd-grade">MATERIAL / GRADE</label><select id="bd-grade"></select></div>'+
    '<div class="field"><label for="bd-fext">TOTAL TENSILE LOAD (N)</label><input type="number" id="bd-fext" value="20000" step="any"></div>'+
    '<div class="field"><label for="bd-shear">TOTAL SHEAR (N)</label><input type="number" id="bd-shear" value="0" step="any"></div>'+
    '</div><div class="row" style="margin-top:.5rem">'+
    '<div class="field"><label for="bd-svc">SERVICE</label><select id="bd-svc"><option value="0.75">REUSABLE (75% proof preload)</option><option value="0.90">PERMANENT (90% proof)</option></select></div>'+
    '<div class="field"><label for="bd-fam">THREAD FAMILY</label><select id="bd-fam"><option value="">ANY</option><option value="Metric coarse">METRIC COARSE</option><option value="Metric fine">METRIC FINE</option><option value="Inch UNC">INCH UNC</option><option value="Inch UNF (fine)">INCH UNF</option></select></div>'+
    '<div class="field"><label for="bd-c">STIFFNESS C</label><input type="number" id="bd-c" value="0.25" step="0.05" min="0" max="1"></div>'+
    '<div class="field"><label for="bd-k">NUT FACTOR K</label><input type="number" id="bd-k" value="0.20" step="0.01"></div>'+
    '</div>'+dsgnCondRow('bd')+'<div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcBoltDesign()">DESIGN IT</button>'+
    '<button class="btn" onclick="applyBoltDesign()" title="load the recommendation into the joint analysis, torque sequence, pattern and stripping cards">APPLY TO FULL ANALYSIS →</button></div><div id="bd-out"></div>';
  host.insertBefore(card,host.firstChild);
  const g=$('bd-grade');
  if(g&&!g.options.length){Object.keys(BOLT_GRADES).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k+' (Sp '+BOLT_GRADES[k].Sp+' MPa)';g.appendChild(o);});g.value='SAE-5';}
}
function boltDesignPick(){
  const n=Math.max(1,Math.round(v('bd-n'))||1),gradeKey=sv('bd-grade'),grade=BOLT_GRADES[gradeKey]||BOLT_GRADES['SAE-5'];
  const cond=dsgnCond('bd');
  const Fext=v('bd-fext')||0,Fsh=v('bd-shear')||0,C=v('bd-c')||0.25,K=v('bd-k')||0.20,fam=sv('bd-fam');
  let pre=parseFloat(sv('bd-svc'))||0.75;
  cond.load==='dyn'&&(pre=0.90);
  const lim=cond.load==='shock'?{use:0.75,sep:2.0,ir:0.7}:{use:0.9,sep:1.5,ir:1};
  const Se=boltSe(gradeKey);
  const FextPer=Fext/n,FshPer=Fsh/n,Sp=grade.Sp,Su=grade.Su;
  const cands=Object.entries(BOLT_SIZES).filter(([k,z])=>!fam||z.kind===fam).sort((a,b)=>a[1].At-b[1].At);
  const evalSize=z=>{
    const Fi=pre*Sp*z.At,Fb=Fi+C*FextPer,sb=Fb/z.At,use=sb/Sp,sep=FextPer>0?Fi/(FextPer*(1-C)):Infinity;
    const tau=FshPer/z.At,IR=Math.pow(sb/Sp,2)+Math.pow(tau/(0.577*Sp),2);
    const sa=C*FextPer/(2*z.At),si=pre*Sp;
    const nf=cond.load==='dyn'&&Se&&sa>0?Se*(Su-si)/(sa*(Su+Se)):null;
    return{Fi,Fb,use,sep,tau,IR,sa,nf,T:K*Fi*z.d/1000,pass:use<=lim.use&&sep>=lim.sep&&IR<lim.ir&&(nf===null||nf>=1.5)};
  };
  let pick=null,next=null;
  for(let i=0;i<cands.length;i++){const r=evalSize(cands[i][1]);if(r.pass){pick={key:cands[i][0],z:cands[i][1],r};const j=i+1<cands.length?cands[i+1]:null;j&&(next={key:j[0],z:j[1],r:evalSize(j[1])});break;}}
  return{n,grade,gradeKey,Fext,Fsh,pre,C,K,cond,Se,pick,next};
}
function boltCondNotes(D){
  const c=D.cond,ss=/A2|A4|austenitic|316/i.test(D.gradeKey),out=[];
  c.load==='dyn'&&out.push('Vibration: preload raised to 90% proof; use a thread-locking method (adhesive, prevailing-torque nut or wedge washers)'+(D.Se?'; Goodman fatigue factor shown uses published Se='+D.Se+' MPa (rolled threads, Shigley T8-17)':'; ⚠ no published Se for this grade — fatigue NOT checked')+'.');
  c.load==='shock'&&out.push('Shock: criteria tightened (proof ≤ 75%, separation ≥ 2×, IR &lt; 0.7) — conservative practice; verify with an impact energy budget for repeated impacts.');
  c.temp>300?out.push('⚠ '+c.temp+' °C: standard property classes are NOT rated here — specify ASTM A193 B7/B16 or equivalent high-temp studs.'):c.temp>150&&out.push('⚠ '+c.temp+' °C exceeds the 150 °C envelope where ISO 898-1/SAE proof loads apply — derate per the fastener standard or move to A193 B7.');
  c.env!=='dry'&&!ss&&out.push(c.env==='wet'?'Wet/outdoor: prefer A2-70 stainless or hot-dip galvanized (then K ≈ 0.25 — retorque spec).':c.env==='marine'?'Marine/salt: use A4-80 (316) stainless; carbon steel even coated will crevice-corrode.':'Chemical service: A4-80 baseline; verify the specific medium (chlorides attack even 316).');
  c.env!=='dry'&&out.push('Check galvanic pairing with the clamped material; isolate dissimilar metals.');
  return out.length?'<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.72rem">'+out.join('<br>')+'</p>':'';
}
window.calcBoltDesign=function(){
  const o=$('bd-out');if(!o)return;
  const D=boltDesignPick();
  if(!D.pick){_mr(o,'<div class="note warn" style="margin-top:.5rem">No standard size passes at this load/count — add bolts, raise the grade, or split the load path.</div>');return;}
  const{key,z,r}=D.pick;
  const Kn=z.d-1.0825*z.p,leSteel=D.grade.Su*z.At/Math.min(0.6*D.grade.Su*0.75*Math.PI*Kn,0.6*D.grade.Su*0.875*Math.PI*z.d),leAl=D.grade.Su*z.At/(0.6*310*0.875*Math.PI*z.d);
  const rows=[
    ['USE',key+' × '+D.n,'ok'],
    ['Torque to',r.T.toFixed(1)+' N·m ('+(r.T*0.7376).toFixed(1)+' lbf·ft)','ok'],
    ['Preload F_i (each)',(r.Fi/1000).toFixed(2)+' kN ('+(D.pre*100).toFixed(0)+'% proof)'],
    ['Proof usage',(r.use*100).toFixed(0)+' %',r.use<0.85?'ok':'warn'],
    ['Separation safety',r.sep===Infinity?'∞':r.sep.toFixed(2)+'×',r.sep>=1.5?'ok':'warn'],
    ['Shear interaction IR',r.IR.toFixed(3),r.IR<1?'ok':'err'],
    ['Min engagement — steel',leSteel.toFixed(1)+' mm'],
    ['Min engagement — aluminum',leAl.toFixed(1)+' mm'],
    ['Next size up',D.next?D.next.key+' (proof '+(D.next.r.use*100).toFixed(0)+'%, T='+D.next.r.T.toFixed(1)+' N·m)':'—']
  ];
  r.nf!==null&&r.nf!==undefined&&rows.splice(6,0,['Fatigue n_f (Goodman)',r.nf.toFixed(2),r.nf>=1.5?'ok':'err']);
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+rows.map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    boltCondNotes(D)+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Smallest '+(sv('bd-fam')||'standard')+' size meeting the criteria for this service (Shigley joint model, C='+D.C+'). Torque T = K·F_i·d with your K='+D.K+' — calibrate K on the real joint for critical work. APPLY loads this pick into every card below (joint, torque sequence, pattern, stripping).</p>');
};
window.applyBoltDesign=function(){
  const D=boltDesignPick();if(!D.pick)return void window.calcBoltDesign();
  const set=(id,val)=>{const el=$(id);if(el){el.value=val;}};
  set('bl-num',D.n);set('bl-grade',sv('bd-grade'));set('bl-size',D.pick.key);
  set('bl-fext',D.Fext);const fu=$('bl-fext-u');fu&&(fu.value='N');
  set('bl-shear',D.Fsh);set('bl-preload',D.pre*100);set('bl-c',D.C);set('bl-mu',D.K);
  window.calcBoltDesign();
  if(typeof window.calcBolt==='function')try{window.calcBolt();}catch(e){}
};
const SPRING_WIRE={auto:{n:'AUTO (pick for me)'},music:{A:2211,m:0.145,G:79300,tmax:120,wet:false,n:'Music wire (A228)'},hd:{A:1783,m:0.190,G:79300,tmax:120,wet:false,n:'Hard-drawn (A227)'},crv:{A:2005,m:0.168,G:79300,tmax:230,wet:false,n:'Chrome-vanadium (A232)'},crsi:{A:1974,m:0.108,G:79300,tmax:245,wet:false,n:'Chrome-silicon (A401)'},ss302:{A:1867,m:0.146,G:69000,tmax:260,wet:true,n:'302 stainless (A313)'}};
const WIRE_STD=[0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.4,1.6,1.8,2.0,2.2,2.5,2.8,3.0,3.5,4.0,4.5,5.0,5.5,6.0,6.5,7.0,8.0,9.0,10,12];
function springDesignPick(F,dfl,C,matKey,cond){
  let mk=matKey;
  if(mk==='auto')mk=cond.env!=='dry'?'ss302':cond.temp>245?'ss302':cond.temp>120?'crsi':'music';
  const M=SPRING_WIRE[mk];
  if(cond.temp>M.tmax)return{fail:'Service temperature '+cond.temp+' °C exceeds '+M.n+' limit ('+M.tmax+' °C). Use '+(cond.temp<=260?'302 stainless (≤260 °C)':'Inconel X-750 / high-temp alloy — outside this catalog')+'.'};
  if(cond.env!=='dry'&&!M.wet)return{fail:M.n+' is not corrosion-resistant — pick 302 stainless (or AUTO) for '+cond.env+' service.'};
  const frac=cond.load==='static'?0.45:0.30;
  const Kw=(4*C-1)/(4*C-4)+0.615/C;
  let d=2;for(let i=0;i<40;i++){const Sut=M.A/Math.pow(d,M.m),ta=frac*Sut;d=Math.sqrt(8*Kw*F*C/(Math.PI*ta));}
  const dStd=WIRE_STD.find(w=>w>=d);
  if(!dStd)return{fail:'Needs wire beyond 12 mm — split load across multiple springs or use a die spring.'};
  const Sut=M.A/Math.pow(dStd,M.m),ta=frac*Sut,D=C*dStd;
  const tau=Kw*8*F*D/(Math.PI*Math.pow(dStd,3));
  const k=F/dfl,na=M.G*Math.pow(dStd,4)/(8*Math.pow(D,3)*k),nt=na+2,Ls=nt*dStd,L0=Ls+1.15*dfl;
  const tauSolid=tau*1.15,buck=L0/D;
  return{mk,M,frac,d:dStd,dCalc:d,D,Kw,Sut,ta,tau,k,na,nt,Ls,L0,tauSolid,buck};
}
function injectSpringDesigner(){
  const vw=$('v-springs');if(!vw||$('spd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='spd-card';
  card.innerHTML='<h3>⚡ SPRING DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">What force at what deflection → wire size, coil size, turns and free length (helical compression).</p>'+
    '<div class="row">'+
    '<div class="field"><label for="spd-f">FORCE (N)</label><input type="number" id="spd-f" value="100" step="any"></div>'+
    '<div class="field"><label for="spd-def">AT DEFLECTION (mm)</label><input type="number" id="spd-def" value="25" step="any"></div>'+
    '<div class="field"><label for="spd-c">INDEX C = D/d</label><input type="number" id="spd-c" value="8" min="4" max="12" step="0.5"></div>'+
    '<div class="field"><label for="spd-mat">MATERIAL</label><select id="spd-mat">'+Object.entries(SPRING_WIRE).map(([k,m])=>`<option value="${k}">${m.n}</option>`).join('')+'</select></div>'+
    '</div>'+dsgnCondRow('spd')+
    '<div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcSpringDesign()">DESIGN IT</button><button class="btn" onclick="applySpringDesign()">APPLY TO ANALYSIS →</button></div><div id="spd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
window.calcSpringDesign=function(){
  const o=$('spd-out');if(!o)return;
  const F=v('spd-f'),dfl=v('spd-def'),C=Math.min(12,Math.max(4,v('spd-c')||8)),cond=dsgnCond('spd');
  if(!(F>0)||!(dfl>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need force and deflection &gt; 0.</div>');return;}
  const R=springDesignPick(F,dfl,C,sv('spd-mat')||'auto',cond);
  if(R.fail){_mr(o,'<div class="note warn" style="margin-top:.5rem">'+R.fail+'</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['USE',R.M.n,'ok'],['Wire d',R.d+' mm (calc '+R.dCalc.toFixed(2)+')','ok'],['Coil D (mean)',R.D.toFixed(1)+' mm'],
    ['Active coils n_a',R.na.toFixed(1)],['Free length L₀',R.L0.toFixed(1)+' mm'],['Rate k',R.k.toFixed(2)+' N/mm'],
    ['τ at F',R.tau.toFixed(0)+' / '+R.ta.toFixed(0)+' MPa allow',R.tau<=R.ta?'ok':'err'],
    ['τ at solid (~1.15F)',R.tauSolid.toFixed(0)+' MPa',R.tauSolid<=R.ta*1.1?'ok':'warn'],
    ['Buckling L₀/D',R.buck.toFixed(2),R.buck<5.2?'ok':'warn']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Shigley sizing at τ_allow = '+(R.frac*100)+'%·S_ut ('+(cond.load==='static'?'static':'cyclic — unpeened; shot-peening buys ~20%')+'), S_ut = A/d^m (Table 10-4: A='+R.M.A+', m='+R.M.m+'), squared-ground ends (n_t = n_a+2), L₀ sized for 15% solid margin. L₀/D ≥ 5.2 risks buckling — guide the spring or split it. APPLY loads this into the spring analysis with S_y set so the module reproduces the same allowable.</p>');
};
window.applySpringDesign=function(){
  const F=v('spd-f'),dfl=v('spd-def'),C=Math.min(12,Math.max(4,v('spd-c')||8)),cond=dsgnCond('spd');
  const R=springDesignPick(F,dfl,C,sv('spd-mat')||'auto',cond);if(R.fail)return void window.calcSpringDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  const tp=$('sp-type');tp&&(tp.value='compression');
  set('sp-d',R.d);set('sp-D',Math.round(R.D*10)/10);set('sp-na',Math.round(R.na*2)/2);set('sp-nt',Math.round(R.na*2)/2+2);set('sp-fl',Math.round(R.L0));set('sp-f',F);set('sp-sy',Math.round(R.Sut));set('sp-g',R.M.G/1000);
  const du=$('sp-d-u'),Du=$('sp-D-u');du&&(du.value='mm');Du&&(Du.value='mm');
  window.calcSpringDesign();
  if(typeof gateBellevillePresets==='function')gateBellevillePresets();
  if(typeof window.calcSpring==='function')try{window.calcSpring();}catch(e){}
};
const SHAFT_STD=[6,8,10,12,14,16,18,20,22,25,28,30,32,35,38,40,45,50,55,60,70,80,90,100,110,125,140,160];
function injectShaftDesigner(){
  const vw=$('v-shafts');if(!vw||$('shd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='shd-card';
  card.innerHTML='<h3>⚡ SHAFT DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Torque + material → the diameter, rounded up to stock sizes.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="shd-t">TORQUE (N·m)</label><input type="number" id="shd-t" value="100" step="any"></div>'+
    '<div class="field"><label for="shd-sy">MATERIAL S_y (MPa)</label><input type="number" id="shd-sy" value="350" step="any"></div>'+
    '<div class="field"><label for="shd-nd">DESIGN FACTOR</label><select id="shd-nd"><option value="1.5">STEADY (1.5)</option><option value="2">MINOR SHOCK / STARTS (2.0)</option><option value="3">HEAVY SHOCK / REVERSING (3.0)</option></select></div>'+
    '<div class="field"><label for="shd-stiff">STIFFNESS LIMIT</label><select id="shd-stiff"><option value="1">θ/L ≤ 0.25°/m (machine practice)</option><option value="0">STRENGTH ONLY</option></select></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcShaftDesign()">DESIGN IT</button><button class="btn" onclick="applyShaftDesign()">APPLY TO ANALYSIS →</button></div><div id="shd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function shaftDesignPick(){
  const T=v('shd-t'),Sy=v('shd-sy')||350,nd=parseFloat(sv('shd-nd'))||1.5,useStiff=sv('shd-stiff')!=='0';
  const tAll=0.4*Sy/nd*1.5;
  const dStr=Math.cbrt(16*T*1000*nd/(Math.PI*0.4*Sy));
  const G=79300,thPerMm=(0.25*Math.PI/180)/1000;
  const Jreq=T*1000/(G*thPerMm),dStiff=useStiff?Math.pow(32*Jreq/Math.PI,0.25):0;
  const dReq=Math.max(dStr,dStiff);
  const d=SHAFT_STD.find(s=>s>=dReq);
  return{T,Sy,nd,useStiff,dStr,dStiff,dReq,d};
}
window.calcShaftDesign=function(){
  const o=$('shd-out');if(!o)return;
  const R=shaftDesignPick();
  if(!(R.T>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Torque required.</div>');return;}
  if(!R.d){_mr(o,'<div class="note warn" style="margin-top:.5rem">Needs Ø &gt; 160 mm — check bending too and consider a hollow section.</div>');return;}
  const J=Math.PI*Math.pow(R.d,4)/32,tau=R.T*1000*(R.d/2)/J,thL=R.T*1000/(79300*J)*1000*180/Math.PI;
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['USE Ø',R.d+' mm','ok'],['Strength needs',R.dStr.toFixed(1)+' mm'],
    ['Stiffness needs',R.useStiff?R.dStiff.toFixed(1)+' mm':'—'],
    ['Governing',R.useStiff&&R.dStiff>R.dStr?'STIFFNESS':'STRENGTH'],
    ['τ actual',tau.toFixed(1)+' MPa vs '+(0.4*R.Sy/R.nd).toFixed(0)+' allow',tau<=0.4*R.Sy/R.nd*1.001?'ok':'err'],
    ['θ/L actual',thL.toFixed(3)+' °/m',thL<=0.25*1.001?'ok':'warn']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Torsion-only sizing: τ_allow = 0.4·S_y/n_d, stiffness per 0.25°/m machine-design practice; rounded up to preferred stock. Combined bending+torsion or keyways need the full shaft analysis (ASME/DE-Goodman) — this is the starting diameter. APPLY loads it into torsion analysis below.</p>');
};
window.applyShaftDesign=function(){
  const R=shaftDesignPick();if(!R.d)return void window.calcShaftDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  set('sh-t',R.T);set('sh-do',R.d);set('sh-di',0);
  window.calcShaftDesign();
  if(typeof window.calcShaftTorsion==='function')try{window.calcShaftTorsion();}catch(e){}
};
function injectBearingDesigner(){
  const vw=$('v-bearings');if(!vw||$('brd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='brd-card';
  card.innerHTML='<h3>⚡ BEARING DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Load + speed + how long it must live → the dynamic capacity C to shop for.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="brd-p">EQUIVALENT LOAD P (kN)</label><input type="number" id="brd-p" value="5" step="any"></div>'+
    '<div class="field"><label for="brd-n">SPEED (rpm)</label><input type="number" id="brd-n" value="1500" step="any"></div>'+
    '<div class="field"><label for="brd-life">LIFE TARGET</label><select id="brd-life"><option value="20000">INTERMITTENT DUTY (20 000 h)</option><option value="50000" selected>CONTINUOUS INDUSTRIAL (50 000 h)</option><option value="100000">CRITICAL / 24-7 (100 000 h)</option><option value="custom">CUSTOM →</option></select></div>'+
    '<div class="field"><label for="brd-h">CUSTOM HOURS</label><input type="number" id="brd-h" value="30000" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcBearingDesign()">DESIGN IT</button><button class="btn" onclick="applyBearingDesign()">APPLY TO ANALYSIS →</button></div><div id="brd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function bearingDesignPick(){
  const P=v('brd-p'),n=v('brd-n'),h=sv('brd-life')==='custom'?v('brd-h'):parseFloat(sv('brd-life'))||50000;
  const L10=60*n*h/1e6;
  return{P,n,h,L10,Cball:P*Math.pow(L10,1/3),Croll:P*Math.pow(L10,0.3)};
}
window.calcBearingDesign=function(){
  const o=$('brd-out');if(!o)return;
  const R=bearingDesignPick();
  if(!(R.P>0)||!(R.n>0)||!(R.h>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need P, rpm and hours &gt; 0.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['L10 required',R.L10.toFixed(0)+' Mrev'],
    ['C required — BALL',R.Cball.toFixed(1)+' kN','ok'],
    ['C required — ROLLER',R.Croll.toFixed(1)+' kN','ok'],
    ['Shop for','catalog C ≥ these at your bore']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">ISO 281: C = P·L10^(1/p), p = 3 ball / 10⁄3 roller, 90% reliability (a₁=1). For 95%+ reliability or marginal lubrication apply a₁/a_ISO from the bearing catalog. APPLY loads C and speed into the L10 card for the inverse check.</p>');
};
window.applyBearingDesign=function(){
  const R=bearingDesignPick();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  set('br-c',R.Cball.toFixed(1));set('br-fr',R.P);set('br-n',R.n);set('br-fa',0);
  window.calcBearingDesign();
  if(typeof window.calcBearing==='function')try{window.calcBearing();}catch(e){}
};
const WELD_LEGS=[3,4,5,6,8,10,12,14,16];
function injectWeldDesigner(){
  const vw=$('v-welds');if(!vw||$('wld-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='wld-card';
  card.innerHTML='<h3>⚡ WELD DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Load + available weld length → the fillet leg size.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="wld-f">LOAD (kN)</label><input type="number" id="wld-f" value="50" step="any"></div>'+
    '<div class="field"><label for="wld-l">TOTAL WELD LENGTH (mm)</label><input type="number" id="wld-l" value="200" step="any"></div>'+
    '<div class="field"><label for="wld-e">ELECTRODE</label><select id="wld-e"><option value="60">E60XX</option><option value="70" selected>E70XX</option><option value="80">E80XX</option><option value="90">E90XX</option><option value="110">E110XX</option></select></div>'+
    '<div class="field"><label for="wld-load2">LOADING</label><select id="wld-load2"><option value="static">STATIC</option><option value="dyn">CYCLIC / FATIGUE</option></select></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcWeldDesign()">DESIGN IT</button><button class="btn" onclick="applyWeldDesign()">APPLY TO ANALYSIS →</button></div><div id="wld-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function weldDesignPick(){
  const F=v('wld-f'),L=v('wld-l'),Fexx=(parseFloat(sv('wld-e'))||70)*6.895;
  const aReq=F*1000/(0.707*L*0.3*Fexx);
  const a=WELD_LEGS.find(x=>x>=aReq);
  return{F,L,Fexx,aReq,a,dyn:sv('wld-load2')==='dyn'};
}
window.calcWeldDesign=function(){
  const o=$('wld-out');if(!o)return;
  const R=weldDesignPick();
  if(!(R.F>0)||!(R.L>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need load and length &gt; 0.</div>');return;}
  if(!R.a){_mr(o,'<div class="note warn" style="margin-top:.5rem">Needs leg &gt; 16 mm — add weld length, use both sides, or move to a groove weld.</div>');return;}
  const tau=R.F*1000/(0.707*R.a*R.L);
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['USE LEG a',R.a+' mm (calc '+R.aReq.toFixed(2)+')','ok'],
    ['τ actual',tau.toFixed(1)+' MPa vs '+(0.3*R.Fexx).toFixed(0)+' allow',tau<=0.3*R.Fexx?'ok':'err'],
    ['Throat',(0.707*R.a).toFixed(2)+' mm'],
    ['Weld metal volume',(R.a*R.a/2*R.L/1000).toFixed(1)+' cm³']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">AISC static allowable 0.30·F_EXX on the throat, parallel loading (conservative for transverse). Leg must also be ≥ plate-thickness minimums (AWS D1.1 Table 5.8) and base metal checked at 0.40·F_y.'+(R.dyn?' <b>⚠ CYCLIC:</b> static sizing is NOT sufficient — size against the AWS fatigue category (stress range) for the detail; expect a substantially larger or full-penetration weld.':'')+'</p>');
};
window.applyWeldDesign=function(){
  const R=weldDesignPick();if(!R.a)return void window.calcWeldDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  set('wl-f',R.F);set('wl-l',R.L);set('wl-a',R.a);
  const we=$('wl-e');we&&[].some.call(we.options,op=>op.value.indexOf(sv('wld-e'))===0&&((we.value=op.value),true));
  window.calcWeldDesign();
  if(typeof window.calcWeld==='function')try{window.calcWeld();}catch(e){}
};
const AMP75={14:20,12:25,10:35,8:50,6:65,4:85,3:100,2:115,1:130,'1/0':150,'2/0':175,'3/0':200,'4/0':230,'250':255,'300':285,'350':310,'400':335,'500':380,'600':420,'750':475};
const AWG_ORDER=['14','12','10','8','6','4','3','2','1','1/0','2/0','3/0','4/0','250','300','350','400','500','600','750'];
function injectWireDesigner(){
  const vw=$('v-nec');if(!vw||$('wrd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='wrd-card';
  card.innerHTML='<h3>⚡ WIRE DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Load + run length → the smallest copper conductor passing ampacity AND voltage drop.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="wrd-i">LOAD (A)</label><input type="number" id="wrd-i" value="30" step="any"></div>'+
    '<div class="field"><label for="wrd-l">ONE-WAY LENGTH (ft)</label><input type="number" id="wrd-l" value="100" step="any"></div>'+
    '<div class="field"><label for="wrd-v">SYSTEM VOLTAGE (V)</label><input type="number" id="wrd-v" value="120" step="any"></div>'+
    '<div class="field"><label for="wrd-drop">MAX DROP (%)</label><input type="number" id="wrd-drop" value="3" step="0.5"></div>'+
    '<div class="field"><label for="wrd-cont">DUTY</label><select id="wrd-cont"><option value="1.25">CONTINUOUS (125% sizing)</option><option value="1">NON-CONTINUOUS</option></select></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcWireDesign()">DESIGN IT</button></div><div id="wrd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
window.calcWireDesign=function(){
  const o=$('wrd-out');if(!o)return;
  const I=v('wrd-i'),L=v('wrd-l'),V=v('wrd-v')||120,dropPct=v('wrd-drop')||3,mult=parseFloat(sv('wrd-cont'))||1.25;
  if(!(I>0)||!(L>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need load and length &gt; 0.</div>');return;}
  const R=window.__NEC_R||{14:3.07,12:1.93,10:1.21,8:0.764,6:0.491,4:0.308,3:0.245,2:0.194,1:0.154,'1/0':0.122,'2/0':0.0967,'3/0':0.0766,'4/0':0.0608,'250':0.0515,'300':0.0429,'350':0.0367,'400':0.0321,'500':0.0258,'600':0.0214,'750':0.0171};
  const Vmax=V*dropPct/100;
  let pick=null;
  for(const awg of AWG_ORDER){
    const amp=AMP75[awg],r=R[awg];if(amp==null||r==null)continue;
    const vd=2*I*r*L/1000;
    if(amp>=I*mult&&vd<=Vmax){pick={awg,amp,vd};break;}
  }
  if(!pick){_mr(o,'<div class="note warn" style="margin-top:.5rem">Nothing ≤ 750 kcmil passes — run parallel conductors or raise the system voltage.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['USE',(isNaN(parseInt(pick.awg))||parseInt(pick.awg)<15?'#':'')+pick.awg+(parseInt(pick.awg)>200?' kcmil':' AWG')+' Cu','ok'],
    ['Ampacity (75 °C)',pick.amp+' A vs '+(I*mult).toFixed(0)+' A required',pick.amp>=I*mult?'ok':'err'],
    ['Voltage drop',pick.vd.toFixed(2)+' V ('+(pick.vd/V*100).toFixed(2)+' %)',pick.vd<=Vmax?'ok':'err'],
    ['V at load',(V-pick.vd).toFixed(1)+' V']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">NEC 310.16 copper @ 75 °C terminations, single-phase 2-wire drop = 2·I·R·L. No conduit-fill or ambient derates applied — for &gt;3 current-carrying conductors or hot locations use the AMPACITY card below with derates, then re-check drop. 3-phase drop ≈ 0.866× this value.</p>');
};
function injectBatteryDesigner(){
  const vw=$('v-battery');if(!vw||$('btd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='btd-card';
  card.innerHTML='<h3>⚡ PACK DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Target voltage + capacity + your cell → the S×P topology.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="btd-v">TARGET V (nominal)</label><input type="number" id="btd-v" value="48" step="any"></div>'+
    '<div class="field"><label for="btd-ah">TARGET CAPACITY (Ah)</label><input type="number" id="btd-ah" value="20" step="any"></div>'+
    '<div class="field"><label for="btd-cv">CELL V nom</label><input type="number" id="btd-cv" value="3.6" step="any"></div>'+
    '<div class="field"><label for="btd-cah">CELL Ah</label><input type="number" id="btd-cah" value="3.5" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcBatteryDesign()">DESIGN IT</button><button class="btn" onclick="applyBatteryDesign()">APPLY TO ANALYSIS →</button></div><div id="btd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function batteryDesignPick(){
  const V=v('btd-v'),Ah=v('btd-ah'),cv=v('btd-cv')||3.6,cah=v('btd-cah')||3.5;
  const S=Math.max(1,Math.round(V/cv)),P=Math.max(1,Math.ceil(Ah/cah));
  return{V,Ah,cv,cah,S,P,Vr:S*cv,Ahr:P*cah,Wh:S*cv*P*cah,cells:S*P};
}
window.calcBatteryDesign=function(){
  const o=$('btd-out');if(!o)return;
  const R=batteryDesignPick();
  if(!(R.V>0)||!(R.Ah>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need target V and Ah.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['USE',R.S+'S'+R.P+'P ('+R.cells+' cells)','ok'],
    ['Pack voltage',R.Vr.toFixed(1)+' V nominal',Math.abs(R.Vr-R.V)/R.V<0.05?'ok':'warn'],
    ['Pack capacity',R.Ahr.toFixed(1)+' Ah'],['Energy',(R.Wh/1000).toFixed(2)+' kWh']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">S rounded to nearest (check charger window: pack max = S·4.2 V for Li-ion), P rounded up. Verify cell max continuous current ≥ pack load / P, and add BMS balancing per S count. APPLY loads the pack card for runtime/Peukert analysis.</p>');
};
window.applyBatteryDesign=function(){
  const R=batteryDesignPick();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['bp-s',R.S],['bp-ns',R.S],['bp-p',R.P],['bp-np',R.P],['bp-qc',R.cah],['bp-vc',R.cv],['bp-v',R.cv]].forEach(([id,val])=>set(id,val));
  window.calcBatteryDesign();
  if(typeof window.calcPack==='function')try{window.calcPack();}catch(e){}
};
function injectIsolatorDesigner(){
  const vw=$('v-vibration');if(!vw||$('isd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='isd-card';
  card.innerHTML='<h3>⚡ ISOLATOR DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Machine mass + disturbing frequency + how much isolation → the mount stiffness to buy.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="isd-m">MASS (kg)</label><input type="number" id="isd-m" value="100" step="any"></div>'+
    '<div class="field"><label for="isd-f">DISTURBING f (Hz)</label><input type="number" id="isd-f" value="30" step="any"></div>'+
    '<div class="field"><label for="isd-iso">ISOLATION</label><select id="isd-iso"><option value="0.8">80 %</option><option value="0.9" selected>90 %</option><option value="0.95">95 %</option></select></div>'+
    '<div class="field"><label for="isd-nm"># MOUNTS</label><input type="number" id="isd-nm" value="4" min="1" step="1"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcIsolatorDesign()">DESIGN IT</button><button class="btn" onclick="applyIsolatorDesign()">APPLY TO ANALYSIS →</button></div><div id="isd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function isolatorDesignPick(){
  const m=v('isd-m'),f=v('isd-f'),iso=parseFloat(sv('isd-iso'))||0.9,nm=Math.max(1,Math.round(v('isd-nm'))||4);
  const TR=1-iso,r=Math.sqrt(1+1/TR),fn=f/r,k=m*Math.pow(2*Math.PI*fn,2);
  return{m,f,iso,nm,TR,r,fn,k,kEach:k/nm,dfl:m*9.81/k*1000};
}
window.calcIsolatorDesign=function(){
  const o=$('isd-out');if(!o)return;
  const R=isolatorDesignPick();
  if(!(R.m>0)||!(R.f>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need mass and disturbing frequency.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['Total k',(R.k/1000).toFixed(1)+' kN/m','ok'],['k per mount ('+R.nm+')',(R.kEach/1000).toFixed(2)+' kN/m','ok'],
    ['Mount f_n',R.fn.toFixed(2)+' Hz'],['f/f_n ratio',R.r.toFixed(2)],
    ['Static deflection',R.dfl.toFixed(1)+' mm',R.dfl<25?'ok':'warn'],['Transmissibility',(R.TR*100).toFixed(0)+' %']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Undamped SDOF: isolation needs f/f_n = √(1+1/TR) &gt; √2. Real elastomer damping (ζ ≈ 0.05–0.1) slightly reduces isolation but tames startup resonance pass-through. Static deflection &gt; 25 mm usually means coil-spring mounts, not pads. APPLY loads m and k into the SDOF card.</p>');
};
window.applyIsolatorDesign=function(){
  const R=isolatorDesignPick();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['nf-m',R.m],['vb-m',R.m],['nf-k',Math.round(R.k)],['vb-k',Math.round(R.k)]].forEach(([id,val])=>set(id,val));
  window.calcIsolatorDesign();
  if(typeof window.calcNatFreq==='function')try{window.calcNatFreq();}catch(e){}
};
const GEAR_MODULES=[1,1.25,1.5,2,2.5,3,4,5,6,8,10,12];
function injectGearDesigner(){
  const vw=$('v-gears');if(!vw||$('grd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='grd-card';
  card.innerHTML='<h3>⚡ GEAR DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Power + speed + ratio + hardness → the module and face width that survive pitting.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="grd-p">POWER (kW)</label><input type="number" id="grd-p" value="5" step="any"></div>'+
    '<div class="field"><label for="grd-n">PINION SPEED (rpm)</label><input type="number" id="grd-n" value="1500" step="any"></div>'+
    '<div class="field"><label for="grd-mg">RATIO m_G</label><input type="number" id="grd-mg" value="4" step="any"></div>'+
    '<div class="field"><label for="grd-hb">HARDNESS (HB)</label><input type="number" id="grd-hb" value="300" step="1"></div>'+
    '<div class="field"><label for="grd-np">PINION TEETH</label><input type="number" id="grd-np" value="18" min="14" step="1"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcGearDesign()">DESIGN IT</button><button class="btn" onclick="applyGearDesign()">APPLY TO ANALYSIS →</button></div><div id="grd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function gearDesignPick(){
  const P=v('grd-p'),n=v('grd-n'),mG=v('grd-mg')||1,HB=v('grd-hb')||300,Np=Math.max(14,Math.round(v('grd-np'))||18);
  const Sc=2.22*HB+200,phi=20*Math.PI/180,ZI=Math.cos(phi)*Math.sin(phi)/2*(mG/(mG+1)),ZE=191,KH=1.6;
  for(const m of GEAR_MODULES){
    const d1=m*Np,b=10*m,V=Math.PI*d1*n/60000,Wt=V>0?P*1000/V:Infinity,Kv=(6.1+V)/6.1;
    const sH=ZE*Math.sqrt(Wt*Kv*KH/(d1*b*ZI)),SH=Sc/sH;
    if(SH>=1.2)return{m,d1,b,V,Wt,Kv,sH,SH,Sc,ZI,Np,mG,found:true};
  }
  return{found:false};
}
window.calcGearDesign=function(){
  const o=$('grd-out');if(!o)return;
  if(!(v('grd-p')>0)||!(v('grd-n')>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need power and speed &gt; 0.</div>');return;}
  const R=gearDesignPick();
  if(!R.found){_mr(o,'<div class="note warn" style="margin-top:.5rem">Even m=12 fails — raise hardness, widen face beyond 10m, split into two stages, or go helical.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['USE MODULE',R.m+' mm','ok'],['Pinion',R.Np+'T, Ø'+R.d1.toFixed(0)+' mm'],['Gear',Math.round(R.Np*R.mG)+'T'],
    ['Face width b',R.b.toFixed(0)+' mm (10·m)'],['Pitch-line V',R.V.toFixed(2)+' m/s'],['W_t',R.Wt.toFixed(0)+' N'],
    ['σ_H / S_c',R.sH.toFixed(0)+' / '+R.Sc.toFixed(0)+' MPa'],['Pitting S_H',R.SH.toFixed(2),'ok']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Smallest standard module with pitting S_H ≥ 1.2 (AGMA contact stress, Barth K_v, K_H = 1.6, Grade-1 steel S_c = 2.22·HB+200, b = 10·m, 20° spur). Bending usually has more margin — APPLY loads both the AGMA and Lewis cards to confirm.</p>');
};
window.applyGearDesign=function(){
  const R=gearDesignPick();if(!R.found)return void window.calcGearDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['ag-wt',Math.round(R.Wt)],['ag-np',R.Np],['ag-m',R.m],['ag-mg',R.mG],['ag-b',R.b],['ag-kv',+(R.Kv.toFixed(2))],['ag-hb',v('grd-hb')||300],['gg-n',R.Np],['gg-m',R.m],['lw-w',Math.round(R.Wt)],['lw-m',R.m],['lw-f',R.b],['lw-v',+(R.V.toFixed(2))]].forEach(([id,val])=>set(id,val));
  window.calcGearDesign();
  if(typeof window.calcAgmaPitting==='function')try{window.calcAgmaPitting();}catch(e){}
};
function injectBeamDesigner(){
  const vw=$('v-beam');if(!vw||$('bmd-card'))return;
  const host=vw.querySelector('.split>div:first-child');
  const card=document.createElement('div');card.className='card';card.id='bmd-card';
  card.innerHTML='<h3>⚡ BEAM DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Load + span + how much sag you can live with → the section properties to shop for.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="bmd-cfg">CONFIGURATION</label><select id="bmd-cfg"><option value="ssp">SIMPLY SUPPORTED — CENTER POINT</option><option value="ssu">SIMPLY SUPPORTED — UDL</option><option value="cp">CANTILEVER — END POINT</option><option value="cu">CANTILEVER — UDL</option></select></div>'+
    '<div class="field"><label for="bmd-w">LOAD (N total)</label><input type="number" id="bmd-w" value="10000" step="any"></div>'+
    '<div class="field"><label for="bmd-l">SPAN (m)</label><input type="number" id="bmd-l" value="4" step="any"></div>'+
    '<div class="field"><label for="bmd-lim">DEFLECTION LIMIT</label><select id="bmd-lim"><option value="240">L/240 (roofs)</option><option value="360" selected>L/360 (floors/general)</option><option value="500">L/500 (machinery)</option><option value="800">L/800 (crane rails)</option></select></div>'+
    '<div class="field"><label for="bmd-sy">MATERIAL S_y (MPa)</label><input type="number" id="bmd-sy" value="250" step="any"></div>'+
    '<div class="field"><label for="bmd-e">E (GPa)</label><input type="number" id="bmd-e" value="200" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcBeamDesign()">DESIGN IT</button><button class="btn" onclick="applyBeamDesign()">APPLY TO BEAM →</button></div><div id="bmd-out"></div>';
  if(host){host.insertBefore(card,host.firstChild);}else{const h2=vw.querySelector('h2');vw.insertBefore(card,h2&&h2.parentElement===vw?h2.nextSibling:vw.firstChild);}
}
function beamDesignPick(){
  const cfg=sv('bmd-cfg')||'ssp',W=v('bmd-w'),L=v('bmd-l'),rat=parseFloat(sv('bmd-lim'))||360,Sy=v('bmd-sy')||250,E=(v('bmd-e')||200)*1e9;
  const dAll=L/rat;
  const M={ssp:W*L/4,ssu:W*L/8,cp:W*L,cu:W*L/2}[cfg];
  const Ireq={ssp:W*Math.pow(L,3)/(48*E*dAll),ssu:5*W*Math.pow(L,3)/(384*E*dAll),cp:W*Math.pow(L,3)/(3*E*dAll),cu:W*Math.pow(L,3)/(8*E*dAll)}[cfg];
  const Sreq=M/(0.6*Sy*1e6);
  return{cfg,W,L,rat,Sy,dAll,M,Ireq,Sreq,Icm4:Ireq*1e8,Scm3:Sreq*1e6};
}
window.calcBeamDesign=function(){
  const o=$('bmd-out');if(!o)return;
  const R=beamDesignPick();
  if(!(R.W>0)||!(R.L>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need load and span &gt; 0.</div>');return;}
  const IfromS=R.Scm3;
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['REQUIRED I_x',R.Icm4.toFixed(0)+' cm⁴','ok'],['REQUIRED S_x',R.Scm3.toFixed(1)+' cm³','ok'],
    ['M_max',(R.M/1000).toFixed(2)+' kN·m'],['δ allowed',(R.dAll*1000).toFixed(1)+' mm (L/'+R.rat+')'],
    ['σ allowable',(0.6*R.Sy).toFixed(0)+' MPa (0.6·S_y)'],
    ['Governs','pick a section meeting BOTH']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Closed-form sizing (self-weight excluded — add ~5-10% or re-run with it in the load). Find a section with I_x and S_x above both requirements in SECTIONS (its → LOAD INTO BEAM button carries it over), or APPLY here to preload span + required I into the beam solver directly.</p>');
};
window.applyBeamDesign=function(){
  const R=beamDesignPick();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  set('bm-len',R.L*1000);const lu=$('bm-len-u');lu&&(lu.value='mm');
  set('bm-i',Math.ceil(R.Icm4));const iu=$('bm-i-u');iu&&(iu.value='cm4');
  set('bm-e',v('bmd-e')||200);const eu=$('bm-e-u');eu&&(eu.value='GPa');
  window.calcBeamDesign();
};
function injectColumnDesigner(){
  const vw=$('v-columns');if(!vw||$('cld-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='cld-card';
  card.innerHTML='<h3>⚡ COLUMN DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Axial load + length + end fixity → the section properties that won\'t buckle.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="cld-p">AXIAL LOAD (kN)</label><input type="number" id="cld-p" value="100" step="any"></div>'+
    '<div class="field"><label for="cld-l">LENGTH (m)</label><input type="number" id="cld-l" value="3" step="any"></div>'+
    '<div class="field"><label for="cld-k">END CONDITION</label><select id="cld-k"><option value="1">PINNED-PINNED (K=1)</option><option value="0.5">FIXED-FIXED (K=0.5)</option><option value="0.7">FIXED-PINNED (K=0.7)</option><option value="2">FIXED-FREE (K=2)</option></select></div>'+
    '<div class="field"><label for="cld-fos">FoS</label><input type="number" id="cld-fos" value="2.5" step="0.1"></div>'+
    '<div class="field"><label for="cld-sy">S_y (MPa)</label><input type="number" id="cld-sy" value="250" step="any"></div>'+
    '<div class="field"><label for="cld-e">E (GPa)</label><input type="number" id="cld-e" value="200" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcColumnDesign()">DESIGN IT</button><button class="btn" onclick="applyColumnDesign()">APPLY TO ANALYSIS →</button></div><div id="cld-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function columnDesignPick(){
  const P=v('cld-p')*1000,L=v('cld-l'),K=parseFloat(sv('cld-k'))||1,fos=v('cld-fos')||2.5,Sy=v('cld-sy')||250,E=(v('cld-e')||200)*1e9;
  const Ireq=fos*P*Math.pow(K*L,2)/(Math.PI*Math.PI*E);
  const Areq=fos*P/(Sy*1e6);
  return{P,L,K,fos,Sy,Ireq,Areq,Icm4:Ireq*1e8,Acm2:Areq*1e4,rMin:Math.sqrt(Ireq/Areq)*100};
}
window.calcColumnDesign=function(){
  const o=$('cld-out');if(!o)return;
  const R=columnDesignPick();
  if(!(R.P>0)||!(R.L>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need load and length &gt; 0.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['REQUIRED I (weak axis)',R.Icm4.toFixed(1)+' cm⁴','ok'],['REQUIRED A',R.Acm2.toFixed(1)+' cm²','ok'],
    ['Effective length',(R.K*R.L).toFixed(2)+' m (K='+R.K+')'],['Implied r at both limits',R.rMin.toFixed(1)+' cm'],
    ['Euler capacity check','P_cr ≥ '+(R.fos*R.P/1000).toFixed(0)+' kN']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Euler sizing (I from elastic buckling with FoS, A from squash). If the section you pick lands in the intermediate range, the COLUMNS card automatically switches to Johnson — APPLY preloads it; use SECTIONS → LOAD INTO COLUMNS to carry a real section\'s r and A here.</p>');
};
window.applyColumnDesign=function(){
  const R=columnDesignPick();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['cl-l',R.L*1000],['cl-k',R.K],['cl-e',v('cld-e')||200],['cl-sy',R.Sy],['cl-p',R.P/1000]].forEach(([id,val])=>set(id,val));
  window.calcColumnDesign();
};
const SEAL_CS=[1.78,2.62,3.53,5.33,6.99];
const SEAL_MAT_RULES=[
  {id:'NBR',tmin:-30,tmax:100,media:['oil','fuel'],n:'NBR (nitrile)'},
  {id:'EPDM',tmin:-45,tmax:130,media:['water','brake'],n:'EPDM'},
  {id:'FKM',tmin:-20,tmax:200,media:['oil','fuel','acid'],n:'FKM (Viton)'},
  {id:'VMQ',tmin:-55,tmax:200,media:['water','food'],n:'VMQ (silicone, static only)'},
  {id:'FFKM',tmin:-15,tmax:275,media:['oil','fuel','acid','solvent','water'],n:'FFKM (Kalrez-class)'}
];
function injectSealDesigner(){
  const vw=$('v-seals');if(!vw||$('sld-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='sld-card';
  card.innerHTML='<h3>⚡ SEAL DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;margin:0 0 .5rem;color:var(--dim)">Bore + pressure + fluid + temperature → cross-section, groove, squeeze and elastomer.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="sld-id">BORE / GLAND Ø (mm)</label><input type="number" id="sld-id" value="25" step="any"></div>'+
    '<div class="field"><label for="sld-p">PRESSURE (MPa)</label><input type="number" id="sld-p" value="10" step="any"></div>'+
    '<div class="field"><label for="sld-t">TEMP (°C)</label><input type="number" id="sld-t" value="80" step="any"></div>'+
    '<div class="field"><label for="sld-med">FLUID</label><select id="sld-med"><option value="oil">OIL / HYDRAULIC</option><option value="fuel">FUEL</option><option value="water">WATER / STEAM</option><option value="acid">ACID / CHEMICAL</option><option value="solvent">SOLVENT / EXOTIC</option></select></div>'+
    '<div class="field"><label for="sld-gl">GLAND TYPE</label><select id="sld-gl"><option value="face">FACE (AXIAL)</option><option value="radial_bore">RADIAL — BORE</option><option value="radial_piston">RADIAL — PISTON</option></select></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcSealDesign()">DESIGN IT</button><button class="btn" onclick="applySealDesign()">APPLY TO ANALYSIS →</button></div><div id="sld-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function sealDesignPick(){
  const id=v('sld-id'),P=v('sld-p'),T=v('sld-t'),med=sv('sld-med')||'oil',gl=sv('sld-gl')||'face';
  const cs=id<15?1.78:id<30?2.62:id<75?3.53:id<150?5.33:6.99;
  const sq=gl==='face'?0.25:0.15;
  const depth=cs*(1-sq),width=cs*1.35;
  const mat=SEAL_MAT_RULES.find(m=>T>=m.tmin&&T<=m.tmax&&m.media.indexOf(med)>=0)||SEAL_MAT_RULES.find(m=>m.id==='FFKM'&&T<=m.tmax);
  const backup=P>8.3;
  return{id,P,T,med,gl,cs,sq,depth,width,mat,backup};
}
window.calcSealDesign=function(){
  const o=$('sld-out');if(!o)return;
  const R=sealDesignPick();
  if(!(R.id>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Bore diameter required.</div>');return;}
  if(!R.mat){_mr(o,'<div class="note warn" style="margin-top:.5rem">No standard elastomer covers '+R.T+' °C with '+R.med+' — metal seal or engineered solution territory.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['CROSS-SECTION',R.cs+' mm (AS568 series)','ok'],['MATERIAL',R.mat.n,'ok'],
    ['Squeeze',(R.sq*100).toFixed(0)+' % ('+(R.gl==='face'?'axial':'radial')+')'],
    ['Groove depth',R.depth.toFixed(2)+' mm'],['Groove width',R.width.toFixed(2)+' mm'],
    ['Backup ring',R.backup?'REQUIRED (P > 8.3 MPa)':'not needed',R.backup?'warn':'ok'],
    ['Material window',R.mat.tmin+' … '+R.mat.tmax+' °C']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Parker O-ring handbook conventions: CS stepped by bore, squeeze 20-30% face / 10-20% radial, groove width ≈ 1.35·CS, backup rings above ~1200 psi at 70 Shore A. EPDM is destroyed by petroleum oils; VMQ is static-only. APPLY runs the full gland analysis (fill %, stretch, extrusion) with these numbers.</p>');
};
window.applySealDesign=function(){
  const R=sealDesignPick();if(!R.mat)return void window.calcSealDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['sl-cord',R.cs],['sl-id',R.id],['sl-depth',+(R.depth.toFixed(2))],['sl-width',+(R.width.toFixed(2))],['sl-press',R.P],['sl-temp',R.T]].forEach(([id,val])=>set(id,val));
  const gl=$('sl-gland');gl&&(gl.value=R.gl);
  const mat=$('sl-mat');mat&&[].some.call(mat.options,op=>new RegExp(R.mat.id,'i').test(op.textContent)&&((mat.value=op.value),true));
  window.calcSealDesign();
  if(typeof window.calcSeal==='function')try{window.calcSeal();}catch(e){}
};
const MOTOR_KW=[0.75,1.1,1.5,2.2,3,4,5.5,7.5,11,15,18.5,22,30,37,45,55,75,90,110,132,160,200];
function injectPumpDesigner(){
  const vw=$('v-pumps');if(!vw||$('ppd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='ppd-card';
  card.innerHTML='<h3>⚡ PUMP DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Flow + head → shaft power, the motor to buy, and the pump type.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="ppd-q">FLOW (m³/h)</label><input type="number" id="ppd-q" value="50" step="any"></div>'+
    '<div class="field"><label for="ppd-h">TOTAL HEAD (m)</label><input type="number" id="ppd-h" value="30" step="any"></div>'+
    '<div class="field"><label for="ppd-rho">ρ (kg/m³)</label><input type="number" id="ppd-rho" value="1000" step="any"></div>'+
    '<div class="field"><label for="ppd-eff">EFFICIENCY EST.</label><input type="number" id="ppd-eff" value="0.7" step="0.05" min="0.2" max="0.95"></div>'+
    '<div class="field"><label for="ppd-n">SPEED (rpm)</label><input type="number" id="ppd-n" value="2900" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcPumpDesign()">DESIGN IT</button><button class="btn" onclick="applyPumpDesign()">APPLY TO ANALYSIS →</button></div><div id="ppd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function pumpDesignPick(){
  const Q=v('ppd-q'),H=v('ppd-h'),rho=v('ppd-rho')||1000,eff=Math.min(0.95,Math.max(0.2,v('ppd-eff')||0.7)),n=v('ppd-n')||2900;
  const Pw=rho*9.81*(Q/3600)*H/1000,Ps=Pw/eff;
  const motor=MOTOR_KW.find(k=>k>=Ps*1.15);
  const NsUS=n*Math.sqrt(Q*4.4029)/Math.pow(H*3.2808,0.75);
  return{Q,H,rho,eff,n,Pw,Ps,motor,NsUS,type:NsUS<1500?'Radial (centrifugal)':NsUS<4000?'Mixed flow':NsUS<10000?'Axial':'Propeller'};
}
window.calcPumpDesign=function(){
  const o=$('ppd-out');if(!o)return;
  const R=pumpDesignPick();
  if(!(R.Q>0)||!(R.H>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need flow and head &gt; 0.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['Hydraulic power',R.Pw.toFixed(2)+' kW'],['Shaft power',R.Ps.toFixed(2)+' kW','ok'],
    ['MOTOR (IEC, +15%)',R.motor?R.motor+' kW':'&gt; 200 kW — engineered drive',R.motor?'ok':'warn'],
    ['Specific speed N_s',R.NsUS.toFixed(0)+' (US)'],['Pump type',R.type]
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">P = ρgQH/η with your efficiency estimate (centrifugal 0.6-0.8 typical at BEP); motor picked with 15% service margin on the IEC frame ladder. Check NPSH_a against the vendor curve in the NPSH card — cavitation kills more pumps than power does. APPLY loads the power card.</p>');
};
window.applyPumpDesign=function(){
  const R=pumpDesignPick();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['pp-q',R.Q],['pp-h',R.H],['pp-rho',R.rho],['pp-eff',R.eff],['ns-n',R.n],['ns-q',R.Q/3600],['ns-h',R.H]].forEach(([id,val])=>set(id,val));
  window.calcPumpDesign();
  if(typeof window.calcPumpPwr==='function')try{window.calcPumpPwr();}catch(e){}
};
const HX_U_TYP=[['Water / water',1200],['Steam / water',2000],['Oil / water',250],['Gas / water',40],['Refrigerant / water',600]];
function injectHxDesigner(){
  const vw=$('v-hx');if(!vw||$('hxd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='hxd-card';
  card.innerHTML='<h3>⚡ HX DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Duty + four temperatures → the area to buy.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="hxd-q">DUTY (kW)</label><input type="number" id="hxd-q" value="100" step="any"></div>'+
    '<div class="field"><label for="hxd-thi">T_h,in (°C)</label><input type="number" id="hxd-thi" value="90" step="any"></div>'+
    '<div class="field"><label for="hxd-tho">T_h,out (°C)</label><input type="number" id="hxd-tho" value="50" step="any"></div>'+
    '<div class="field"><label for="hxd-tci">T_c,in (°C)</label><input type="number" id="hxd-tci" value="20" step="any"></div>'+
    '<div class="field"><label for="hxd-tco">T_c,out (°C)</label><input type="number" id="hxd-tco" value="40" step="any"></div>'+
    '<div class="field"><label for="hxd-u">SERVICE (typical U)</label><select id="hxd-u">'+HX_U_TYP.map(([n2,u])=>`<option value="${u}">${n2} (~${u})</option>`).join('')+'<option value="custom">CUSTOM →</option></select></div>'+
    '<div class="field"><label for="hxd-uc">U custom (W/m²K)</label><input type="number" id="hxd-uc" value="800" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcHxDesign()">DESIGN IT</button><button class="btn" onclick="applyHxDesign()">APPLY TO ANALYSIS →</button></div><div id="hxd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function hxDesignPick(){
  const Q=v('hxd-q')*1000,thi=v('hxd-thi'),tho=v('hxd-tho'),tci=v('hxd-tci'),tco=v('hxd-tco');
  const U=sv('hxd-u')==='custom'?(v('hxd-uc')||800):parseFloat(sv('hxd-u'))||1200;
  const dT1=thi-tco,dT2=tho-tci;
  if(dT1<=0||dT2<=0)return{cross:true};
  const lmtd=Math.abs(dT1-dT2)<1e-9?dT1:(dT1-dT2)/Math.log(dT1/dT2);
  const A=Q/(U*lmtd);
  const mh=Q/(4186*(thi-tho)),mc=Q/(4186*(tco-tci));
  return{Q,U,lmtd,A,mh,mc,thi,tho,tci,tco};
}
window.calcHxDesign=function(){
  const o=$('hxd-out');if(!o)return;
  const R=hxDesignPick();
  if(R.cross){_mr(o,'<div class="note warn" style="margin-top:.5rem">Temperature cross — impossible in pure counterflow with these four temperatures. Re-check ins/outs or split into two exchangers.</div>');return;}
  if(!(R.Q>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Duty required.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['AREA (counterflow)',R.A.toFixed(2)+' m²','ok'],['LMTD',R.lmtd.toFixed(1)+' K'],
    ['Hot flow (if water)',R.mh.toFixed(2)+' kg/s'],['Cold flow (if water)',R.mc.toFixed(2)+' kg/s'],
    ['With 25% fouling margin',(R.A*1.25).toFixed(2)+' m²']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">A = Q/(U·LMTD), true counterflow (apply the F-factor in the LMTD card for shell-and-tube). Typical-U presets are mid-range — the FOULED U card refines U for end-of-service. Flows assume water c_p; scale for other fluids.</p>');
};
window.applyHxDesign=function(){
  const R=hxDesignPick();if(R.cross||!R.A)return void window.calcHxDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['hx-thi',R.thi],['hx-tho',R.tho],['hx-tci',R.tci],['hx-tco',R.tco],['hx-u',R.U],['hx-a',+(R.A.toFixed(2))],['fu-uc',R.U]].forEach(([id,val])=>set(id,val));
  window.calcHxDesign();
  if(typeof window.calcLMTD==='function')try{window.calcLMTD();}catch(e){}
};
const PIPE_SCH40=[['½"','DN15',15.80],['¾"','DN20',20.93],['1"','DN25',26.64],['1¼"','DN32',35.05],['1½"','DN40',40.89],['2"','DN50',52.50],['2½"','DN65',62.71],['3"','DN80',77.93],['4"','DN100',102.26],['5"','DN125',128.19],['6"','DN150',154.05],['8"','DN200',202.72],['10"','DN250',254.51],['12"','DN300',303.23]];
const PIPE_FLUIDS={water20:{n:'Water 20 °C',rho:998,mu:1.0e-3},water60:{n:'Water 60 °C',rho:983,mu:4.66e-4},glycol50:{n:'50% glycol 20 °C',rho:1071,mu:3.8e-3},oil32:{n:'Hyd. oil ISO VG32 40 °C',rho:857,mu:2.75e-2},air20:{n:'Air 20 °C, 1 atm',rho:1.204,mu:1.825e-5}};
const PIPE_SVC={suction:{n:'Pump suction',vmax:1.5},discharge:{n:'Pump discharge / general',vmax:3.0},gravity:{n:'Gravity / drain',vmax:1.2},gas:{n:'Compressed air / gas',vmax:20}};
const PIPE_ROUGH={steel:{n:'Commercial steel',e:4.5e-5},pvc:{n:'PVC (Sch 40)',e:1.5e-6},galv:{n:'Galvanized steel',e:1.5e-4},ss:{n:'Stainless (Sch 40S)',e:1.5e-5}};
function injectPipeDesigner(){
  const vw=$('v-fluids');if(!vw||$('fld-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='fld-card';
  card.innerHTML='<h3>⚡ PIPE DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Flow + run + pressure-drop budget → the pipe size to buy.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="fld-q">FLOW (m³/h)</label><input type="number" id="fld-q" value="10" step="any"></div>'+
    '<div class="field"><label for="fld-l">RUN LENGTH (m)</label><input type="number" id="fld-l" value="50" step="any"></div>'+
    '<div class="field"><label for="fld-dp">ALLOWABLE ΔP (kPa)</label><input type="number" id="fld-dp" value="50" step="any"></div>'+
    '<div class="field"><label for="fld-fl">FLUID</label><select id="fld-fl">'+Object.entries(PIPE_FLUIDS).map(([k,f])=>`<option value="${k}">${f.n}</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="fld-mat">PIPE MATERIAL</label><select id="fld-mat">'+Object.entries(PIPE_ROUGH).map(([k,m])=>`<option value="${k}">${m.n}</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="fld-svc">SERVICE</label><select id="fld-svc">'+Object.entries(PIPE_SVC).map(([k,s])=>`<option value="${k}"${k==='discharge'?' selected':''}>${s.n} (≤${s.vmax} m/s)</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="fld-k">ΣK FITTINGS</label><input type="number" id="fld-k" value="5" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcPipeDesign()">DESIGN IT</button><button class="btn" onclick="applyPipeDesign()">APPLY TO ANALYSIS →</button></div><div id="fld-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function pipeF(Re,rr){return Re<2300?64/Re:0.25/Math.pow(Math.log10(rr/3.7+5.74/Math.pow(Re,0.9)),2);}
function pipeDesignPick(){
  const Q=v('fld-q')/3600,L=v('fld-l'),dpA=v('fld-dp')*1000,K=v('fld-k')||0;
  const fl=PIPE_FLUIDS[sv('fld-fl')]||PIPE_FLUIDS.water20,mat=PIPE_ROUGH[sv('fld-mat')]||PIPE_ROUGH.steel,svc=PIPE_SVC[sv('fld-svc')]||PIPE_SVC.discharge;
  let pick=null,last=null;
  for(const[nps,dn,idmm]of PIPE_SCH40){
    const D=idmm/1000,A=Math.PI*D*D/4,vel=Q/A,Re=fl.rho*vel*D/fl.mu;
    const f=pipeF(Re,mat.e/D),dp=(f*L/D+K)*fl.rho*vel*vel/2;
    last={nps,dn,idmm,vel,Re,f,dp};
    if(dp<=dpA&&vel<=svc.vmax){pick=last;break;}
  }
  return{Q,L,dpA,K,fl,mat,svc,pick,last};
}
window.calcPipeDesign=function(){
  const o=$('fld-out');if(!o)return;
  const R=pipeDesignPick();
  if(!(R.Q>0)||!(R.L>0)||!(R.dpA>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need flow, length and ΔP budget &gt; 0.</div>');return;}
  if(!R.pick){_mr(o,'<div class="note warn" style="margin-top:.5rem">Nothing ≤ 12" passes — even DN300 gives '+(R.last.dp/1000).toFixed(1)+' kPa at '+R.last.vel.toFixed(2)+' m/s. Raise the ΔP budget, shorten the run, split the flow, or go to large-bore (&gt;12") pipe.</div>');return;}
  const P=R.pick,regime=P.Re<2300?'laminar':P.Re<4000?'transitional':'turbulent';
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['PIPE',P.nps+' Sch 40 ('+P.dn+')','ok'],['Inside Ø',P.idmm.toFixed(2)+' mm'],
    ['Velocity',P.vel.toFixed(2)+' m/s (cap '+R.svc.vmax+')','ok'],
    ['Reynolds',P.Re<2300?P.Re.toFixed(0)+' — laminar':(P.Re/1000).toFixed(1)+'k — '+regime],
    ['Friction f',P.f.toFixed(4)],['ΔP actual',(P.dp/1000).toFixed(1)+' kPa of '+(R.dpA/1000).toFixed(0)+' allowed','ok'],
    ['Head loss',(P.dp/(R.fl.rho*9.81)).toFixed(2)+' m of fluid']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Walks ASME B36.10 Sch 40 bores (PVC Sch 40 and stainless Sch 40S share these dimensions); Swamee-Jain friction, 64/Re below Re 2300, ΔP = (fL/D + ΣK)·ρv²/2. Velocity caps are standard practice — keep suction slow to protect NPSH. APPLY loads the Moody card; refine ΣK with your real fitting count there.</p>');
};
window.applyPipeDesign=function(){
  const R=pipeDesignPick();if(!R.pick)return void window.calcPipeDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['fl-d',+(R.pick.idmm/1000).toFixed(5)],['fl-l',R.L],['fl-q',+R.Q.toFixed(6)],['fl-rho',R.fl.rho],['fl-mu',R.fl.mu],['fl-e',R.mat.e],['fl-k',R.K]].forEach(([id,val])=>set(id,val));
  window.calcPipeDesign();
  if(typeof window.calcMoody==='function')try{window.calcMoody();}catch(e){}
};
const NEMA_HP=[1,1.5,2,3,5,7.5,10,15,20,25,30,40,50,60,75,100,125,150,200,250];
const MTR_LOADS={fan:{n:'Fan / blower',des:'B'},pump:{n:'Centrifugal pump',des:'B'},tool:{n:'Machine tool',des:'B'},conv:{n:'Conveyor / compressor (loaded start)',des:'C'},punch:{n:'Punch press / hoist / high inertia',des:'D'}};
function injectMotorDesigner(){
  const vw=$('v-motors');if(!vw||$('mtd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='mtd-card';
  card.innerHTML='<h3>⚡ MOTOR DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Load torque + speed → the motor to buy: kW/HP rating, poles, NEMA design & frame.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="mtd-t">LOAD TORQUE (N·m)</label><input type="number" id="mtd-t" value="40" step="any"></div>'+
    '<div class="field"><label for="mtd-n">SPEED (rpm)</label><input type="number" id="mtd-n" value="1750" step="any"></div>'+
    '<div class="field"><label for="mtd-load">LOAD TYPE</label><select id="mtd-load">'+Object.entries(MTR_LOADS).map(([k,l])=>`<option value="${k}"${k==='pump'?' selected':''}>${l.n}</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="mtd-hz">SUPPLY</label><select id="mtd-hz"><option value="60">60 Hz</option><option value="50">50 Hz</option></select></div>'+
    '<div class="field"><label for="mtd-mg">SIZING MARGIN</label><select id="mtd-mg"><option value="1.15">Standard 15%</option><option value="1.1">Tight 10%</option><option value="1.25">Generous 25%</option></select></div>'+
    '<div class="field"><label for="mtd-v">V_LL (V)</label><input type="number" id="mtd-v" value="460" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcMotorDesign()">DESIGN IT</button><button class="btn" onclick="applyMotorDesign()">APPLY TO ANALYSIS →</button></div><div id="mtd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function motorDesignPick(){
  const T=v('mtd-t'),N=v('mtd-n'),hz=parseInt(sv('mtd-hz'))||60,mg=parseFloat(sv('mtd-mg'))||1.15,V=v('mtd-v')||460;
  const load=MTR_LOADS[sv('mtd-load')]||MTR_LOADS.pump,des=NEMA_DESIGN[load.des];
  const Preq=T*N*2*Math.PI/60000;
  const sy=[2,4,6,8].map(p=>({p,ns:120*hz/p})).filter(s=>s.ns>=N).sort((a,b)=>a.ns-b.ns)[0];
  const kw=MOTOR_KW.find(k=>k>=Preq*mg);
  const hp=NEMA_HP.find(h=>h>=Preq*mg/0.7457);
  const nfl=sy?Math.round(sy.ns*(1-des.slip)):0;
  const fla=kw?kw*1000/(Math.sqrt(3)*V*0.85*0.90):0;
  const tavail=kw&&nfl?kw*9550/nfl:0;
  return{T,N,hz,mg,V,load,des,Preq,sy,kw,hp,nfl,fla,tavail};
}
window.calcMotorDesign=function(){
  const o=$('mtd-out');if(!o)return;
  const R=motorDesignPick();
  if(!(R.T>0)||!(R.N>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need torque and speed &gt; 0.</div>');return;}
  if(!R.sy){_mr(o,'<div class="note warn" style="margin-top:.5rem">'+R.N+' rpm is above the '+(120*R.hz/2)+' rpm 2-pole synchronous ceiling at '+R.hz+' Hz — direct drive is impossible. Use a VFD above base speed, a speed-increasing gearbox, or a different machine.</div>');return;}
  if(!R.kw||!R.hp){_mr(o,'<div class="note warn" style="margin-top:.5rem">'+R.Preq.toFixed(0)+' kW required — beyond the standard ladder (200 kW / 250 HP). Engineered / medium-voltage machine territory.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['Required power',R.Preq.toFixed(2)+' kW ('+(R.Preq/0.7457).toFixed(1)+' HP)'],
    ['MOTOR (IEC)',R.kw+' kW','ok'],['MOTOR (NEMA)',R.hp+' HP','ok'],
    ['Poles / sync',R.sy.p+'-pole — '+R.sy.ns+' rpm'],
    ['Est. FL speed','≈ '+R.nfl+' rpm ('+(R.des.slip*100).toFixed(0)+'% slip)',Math.abs(R.nfl-R.N)/R.N>0.05?'warn':'ok'],
    ['NEMA design',R.load.des+' — LRT '+(R.des.LRT*100).toFixed(0)+'% FL'],
    ['FL torque avail.',R.tavail.toFixed(1)+' N·m vs '+R.T+' needed',R.tavail>=R.T?'ok':'warn'],
    ['Est. FLA @ '+R.V+' V',R.fla.toFixed(1)+' A']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">P = Tω exactly; rating picked with your margin on the IEC kW / NEMA HP ladders; poles = smallest synchronous speed above your rpm (induction runs a few % below sync — need the speed exact? that&#39;s a VFD). Design letter from load type: B general purpose, C loaded starts, D punch/hoist. FLA assumes PF 0.85, η 0.90 — the nameplate governs. APPLY floods the torque, FLA, service-factor, slip, frame and torque-speed cards.</p>');
};
window.applyMotorDesign=function(){
  const R=motorDesignPick();if(!R.sy||!R.kw)return void window.calcMotorDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['mt-pk',R.kw],['mt-n',R.nfl],['fla-p',R.kw],['fla-v',R.V],['sf-p',R.kw],['mt-f',R.hz],['mt-p',R.sy.p],['mt-nr',R.nfl],['mt-fr-hp',R.hp],['mt-ts-pfl',R.kw],['mt-ts-nfl',R.nfl],['mt-ts-ns',R.sy.ns]].forEach(([id,val])=>set(id,val));
  const fr=$('mt-fr-rpm');fr&&[].some.call(fr.options,op=>parseInt(op.textContent)===R.sy.ns&&((fr.value=op.value),true));
  const dsel=$('mt-ts-design');dsel&&(dsel.value=R.load.des);
  window.calcMotorDesign();
  ['calcMotorT','calcFLA','calcSF','calcSync','calcNemaFrame','calcMotorTSC'].forEach(fn=>{if(typeof window[fn]==='function')try{window[fn]();}catch(e){}});
};
const HYD_BORES=[25,32,40,50,63,80,100,125,160,200,250];
const HYD_RODS=[12,14,16,18,20,22,25,28,32,36,40,45,50,56,63,70,80,90,100,110,125,140,160,180];
const HYD_MOUNT={pp:{n:'Pinned both ends',K:1.0},fp:{n:'Fixed-pinned',K:0.7},ff:{n:'Fixed-fixed (rigidly guided)',K:0.5},fr:{n:'Fixed-free (unguided)',K:2.0}};
function injectCylDesigner(){
  const vw=$('v-hydraulics');if(!vw||$('hyd-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='hyd-card';
  card.innerHTML='<h3>⚡ CYLINDER DESIGNER — START HERE</h3>'+
    '<p style="font-size:.72rem;color:var(--dim);margin:0 0 .5rem">Force + pressure + stroke → the bore and rod to buy.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="hyd-f">FORCE NEEDED (kN)</label><input type="number" id="hyd-f" value="50" step="any"></div>'+
    '<div class="field"><label for="hyd-dir">ACTION</label><select id="hyd-dir"><option value="push">PUSH (extend)</option><option value="pull">PULL (retract)</option></select></div>'+
    '<div class="field"><label for="hyd-p">SYSTEM P (bar)</label><input type="number" id="hyd-p" value="160" step="any"></div>'+
    '<div class="field"><label for="hyd-s">STROKE (mm)</label><input type="number" id="hyd-s" value="800" step="any"></div>'+
    '<div class="field"><label for="hyd-mt">MOUNTING</label><select id="hyd-mt">'+Object.entries(HYD_MOUNT).map(([k,m])=>`<option value="${k}">${m.n} (K=${m.K})</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="hyd-v">TARGET SPEED (mm/s)</label><input type="number" id="hyd-v" value="100" step="any"></div>'+
    '</div><div class="row" style="margin-top:.6rem"><button class="btn btn-fill" onclick="calcCylDesign()">DESIGN IT</button><button class="btn" onclick="applyCylDesign()">APPLY TO ANALYSIS →</button></div><div id="hyd-out"></div>';
  host.insertBefore(card,host.firstChild);
}
function cylDesignPick(){
  const F=v('hyd-f')*1000,dir=sv('hyd-dir')||'push',Pb=v('hyd-p'),P=Pb*1e5,S=v('hyd-s')/1000,mt=HYD_MOUNT[sv('hyd-mt')]||HYD_MOUNT.pp,vt=v('hyd-v')||100;
  const eta=0.9,E=2.1e11,FoS=3.5,Areq=F/(P*eta);
  let rodReq;
  if(dir==='push'){const Ireq=FoS*F*Math.pow(mt.K*S,2)/(Math.PI*Math.PI*E);rodReq=Math.pow(64*Ireq/Math.PI,0.25)*1000;}
  else rodReq=Math.sqrt(4*F/(100e6*Math.PI))*1000;
  const rod=HYD_RODS.find(r=>r>=rodReq);
  let pick=null;
  if(rod)for(const b of HYD_BORES){
    if(rod>=b)continue;
    const Ab=Math.PI*b*b/4e6,Aact=dir==='push'?Ab:Ab-Math.PI*rod*rod/4e6;
    if(Aact>=Areq){pick={b,rod};break;}
  }
  if(!pick)return{F,dir,Pb,P,S,mt,vt,eta,Areq,rodReq,rod};
  const Ab=Math.PI*pick.b*pick.b/4e6,Aann=Ab-Math.PI*pick.rod*pick.rod/4e6;
  const Fext=P*Ab*eta,Fret=P*Aann*eta;
  const I=Math.PI*Math.pow(pick.rod/1000,4)/64,Pcr=Math.PI*Math.PI*E*I/Math.pow(mt.K*S,2),fosB=S>0?Pcr/F:Infinity;
  const Aact=dir==='push'?Ab:Aann,Q=Aact*(vt/1000)*60000,Pw=P*Q/60000/1000;
  return{F,dir,Pb,P,S,mt,vt,eta,Areq,rodReq,rod,pick,Ab,Aann,Fext,Fret,fosB,Q,Pw,phi:Ab/Aann};
}
window.calcCylDesign=function(){
  const o=$('hyd-out');if(!o)return;
  const R=cylDesignPick();
  if(!(R.F>0)||!(R.Pb>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need force and pressure &gt; 0.</div>');return;}
  if(!R.rod){_mr(o,'<div class="note warn" style="margin-top:.5rem">Rod would need Ø'+R.rodReq.toFixed(0)+' mm — beyond the 180 mm standard ladder. Shorten the stroke, guide the rod (better mounting K), or use a telescopic/multiple cylinders.</div>');return;}
  if(!R.pick){_mr(o,'<div class="note warn" style="margin-top:.5rem">'+(R.Areq*1e6).toFixed(0)+' mm² of piston needed — beyond a 250 mm bore at '+R.Pb+' bar. Raise system pressure or split across multiple cylinders.</div>');return;}
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['BORE',R.pick.b+' mm (ISO 3320)','ok'],['ROD',R.pick.rod+' mm (ISO 4395)','ok'],
    ['Force available',(R.dir==='push'?R.Fext:R.Fret)/1000>=R.F/1000?((R.dir==='push'?R.Fext:R.Fret)/1000).toFixed(1)+' kN '+R.dir:'—','ok'],
    ['Other direction',(R.dir==='push'?R.Fret:R.Fext)/1000>0?((R.dir==='push'?R.Fret:R.Fext)/1000).toFixed(1)+' kN '+(R.dir==='push'?'pull':'push'):'—'],
    ['Rod buckling FoS',R.dir==='push'?R.fosB.toFixed(1)+' (target 3.5)':'n/a — rod in tension',R.dir==='push'&&R.fosB<3.5?'warn':'ok'],
    ['Flow for '+R.vt+' mm/s',R.Q.toFixed(1)+' L/min'],['Hydraulic power',R.Pw.toFixed(1)+' kW'],
    ['Area ratio φ',R.phi.toFixed(2)]
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">F = P·A with 0.9 mechanical-hydraulic efficiency; push rods sized by Euler P_cr = π²EI/(KL)² at FoS 3.5 over the stroke, pulled rods by tension ≤ 100 MPa (CK45 at FoS ≈ 4). Bore/rod from the ISO 3320 / ISO 4395 series — manufacturers bind specific pairs, so confirm in the catalog. Meter-out on the rod side intensifies pressure by φ — check valve and seal ratings. APPLY loads the analysis card with the flow above; size the supply in PUMPS and the lines in FLUIDS.</p>');
};
window.applyCylDesign=function(){
  const R=cylDesignPick();if(!R.pick)return void window.calcCylDesign();
  const set=(id,val)=>{const el=$(id);if(el)el.value=val;};
  [['hy-bore',R.pick.b],['hy-rod',R.pick.rod],['hy-p',R.Pb],['hy-q',+R.Q.toFixed(1)],['hy-eff',R.eta]].forEach(([id,val])=>set(id,val));
  window.calcCylDesign();
  if(typeof window.calcHyd==='function')try{window.calcHyd();}catch(e){}
};
function drawCylSchematic(bore,rod,stroke){
  const c=$('c-hyd');if(!c||!c.getContext)return;
  const x=c.getContext('2d'),t=pTheme();
  x.clearRect(0,0,c.width,c.height);
  const cy=c.height/2-14,bx=70,bw=300;
  const bh=Math.max(40,Math.min(110,bore*0.8)),rh=Math.max(8,bh*rod/bore);
  x.lineWidth=3;x.strokeStyle=t.accent;x.strokeRect(bx,cy-bh/2,bw,bh);
  x.fillStyle=t.grid;x.fillRect(bx+bw*0.55,cy-bh/2+3,10,bh-6);
  x.fillRect(bx+bw*0.55+10,cy-rh/2,bw*0.45+70,rh);
  x.strokeStyle=t.dim;x.lineWidth=1.5;
  x.strokeRect(bx+18,cy-bh/2-14,10,14);x.strokeRect(bx+bw-38,cy-bh/2-14,10,14);
  x.fillStyle=t.text;x.font='11px monospace';x.textAlign='center';
  x.fillText('Ø'+bore+' bore',bx+bw/2,cy+bh/2+18);
  x.fillText('Ø'+rod+' rod',bx+bw+55,cy+rh/2+16);
  x.fillText('cap port',bx+23,cy-bh/2-20);x.fillText('rod port',bx+bw-33,cy-bh/2-20);
  stroke>0&&x.fillText('stroke '+stroke+' mm',bx+bw/2,cy-bh/2-20);
}
window.calcHyd=function(){
  const bore=v('hy-bore'),rod=v('hy-rod'),Pb=v('hy-p'),Q=v('hy-q'),eta=Math.min(1,Math.max(0.5,v('hy-eff')||0.9));
  const res=$('hydraulics-results');if(!res)return;
  if(!(bore>0)||!(rod>0)||rod>=bore){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need bore &gt; rod &gt; 0.</div>');return;}
  const P=Pb*1e5,Ab=Math.PI*bore*bore/4e6,Aann=Ab-Math.PI*rod*rod/4e6,Qm=Q/60000;
  const Fext=P*Ab*eta/1000,Fret=P*Aann*eta/1000,vext=Qm/Ab*1000,vret=Qm/Aann*1000,phi=Ab/Aann,Pw=P*Qm/1000;
  _mr(res,'<h3>CYLINDER</h3><div class="result-grid">'+[
    ['F extend',Fext.toFixed(1)+' kN'],['F retract',Fret.toFixed(1)+' kN'],
    ['v extend',vext.toFixed(0)+' mm/s'],['v retract',vret.toFixed(0)+' mm/s'],
    ['Area ratio φ',phi.toFixed(2)],['Hydraulic power',Pw.toFixed(1)+' kW'],
    ['Piston area',(Ab*1e6).toFixed(0)+' mm²'],['Annulus area',(Aann*1e6).toFixed(0)+' mm²']
  ].map(([l,val])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${val}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">η = '+eta+' applied to force. Retract is faster but weaker (annulus). <strong>Intensification:</strong> metering out the rod side while extending multiplies rod-side pressure by φ = '+phi.toFixed(2)+' → up to '+(Pb*phi).toFixed(0)+' bar there — check valve and seal ratings.</p>');
  drawCylSchematic(bore,rod,0);
};
window.calcAccum=function(){
  const dv=v('ac-dv'),p1=v('ac-p1'),p2=v('ac-p2'),n=parseFloat(sv('ac-n'))||1.4;
  const res=$('hydraulics-results');if(!res)return;
  if(!(dv>0)||!(p1>0)||!(p2>p1)){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need ΔV &gt; 0 and P_max &gt; P_min &gt; 0.</div>');return;}
  const p0g=0.9*p1,atm=1.013,p0=p0g+atm,p1a=p1+atm,p2a=p2+atm;
  const frac=Math.pow(p0/p1a,1/n)-Math.pow(p0/p2a,1/n);
  const V0=dv/frac;
  _mr(res,'<h3>ACCUMULATOR</h3><div class="result-grid">'+[
    ['GAS VOLUME V₀',V0.toFixed(2)+' L — round UP to catalog size'],
    ['Precharge P₀',p0g.toFixed(0)+' bar g (90% of P_min)'],
    ['Usable ΔV check',dv+' L between '+p1+' and '+p2+' bar'],
    ['Process','n = '+n+(n===1?' (isothermal)':' (adiabatic)')]
  ].map(([l,val])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val">${val}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">Gas-law sizing (P·Vⁿ constant, absolute pressures): V₀ = ΔV / [(P₀/P₁)^(1/n) − (P₀/P₂)^(1/n)]. Slow duty (leakage make-up, thermal expansion) → isothermal; shock/rapid discharge → adiabatic and a bigger shell. Bladder accumulators want P₀ ≈ 0.9·P_min so the bladder never slams the poppet.</p>');
};
const DIN6885=[[8,2,2],[10,3,3],[12,4,4],[17,5,5],[22,6,6],[30,8,7],[38,10,8],[44,12,8],[50,14,9],[58,16,10],[65,18,11],[75,20,12],[85,22,14],[95,25,14],[110,28,16],[130,32,18]];
const KEY_MAT={c45:['C45 / 1045 key steel',340],mild:['Mild steel key',250],alloy:['4140 HT key',655],ss:['Stainless A2 key',205]};
function injectKeyway(){
  const vw=$('v-shafts');if(!vw||$('ky-card'))return;
  const host=vw.querySelector('.split>div:last-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='ky-card';card.style.marginTop='.6rem';
  card.innerHTML='<h3>KEYWAY / PARALLEL KEY (DIN 6885)</h3>'+
    '<div class="row">'+
    '<div class="field"><label for="ky-t">TORQUE (N·m)</label><input type="number" id="ky-t" value="100" step="any"></div>'+
    '<div class="field"><label for="ky-d">SHAFT Ø (mm)</label><input type="number" id="ky-d" value="35" step="any"></div>'+
    '<div class="field"><label for="ky-mat">KEY MATERIAL</label><select id="ky-mat">'+Object.entries(KEY_MAT).map(([k,m])=>`<option value="${k}">${m[0]} (Sy ${m[1]})</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="ky-fos">FoS</label><input type="number" id="ky-fos" value="2" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcKeyway()" style="margin-top:.6rem">SIZE THE KEY</button><div id="ky-out"></div>';
  host.appendChild(card);
}
window.calcKeyway=function(){
  const o=$('ky-out');if(!o)return;
  const T=v('ky-t')*1000,d=v('ky-d'),m=KEY_MAT[sv('ky-mat')]||KEY_MAT.c45,n=Math.max(1,v('ky-fos')||2);
  if(!(T>0)||!(d>5)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need torque &gt; 0 and shaft Ø &gt; 5 mm.</div>');return;}
  const row=DIN6885.find(r=>d<=r[0]);
  if(!row){_mr(o,'<div class="note warn" style="margin-top:.5rem">Ø'+d+' mm is beyond the DIN 6885 table (130 mm) — spline or interference-fit territory.</div>');return;}
  const[,b,h]=row,Sy=m[1];
  const Ls=2*T*n/(d*b*0.577*Sy),Lc=4*T*n/(d*h*Sy);
  const Lreq=Math.max(Ls,Lc),L=Math.ceil(Lreq/5)*5;
  const tooLong=L>1.5*d;
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['KEY SECTION',b+' × '+h+' mm (DIN 6885)','ok'],
    ['Length — shear',Ls.toFixed(1)+' mm'],['Length — crush (governs '+(Lc>=Ls?'✓':'✗')+')',Lc.toFixed(1)+' mm'],
    ['KEY LENGTH',tooLong?L+' mm — TOO LONG':L+' mm stock',tooLong?'warn':'ok'],
    ['L / d',(L/d).toFixed(2)+(tooLong?' > 1.5':' (≤ 1.5 ✓)')]
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    (tooLong?'<div class="note warn" style="margin-top:.4rem">Key longer than 1.5·d can&#39;t load evenly — use TWO keys at 90-120°, a spline, or an interference fit.</div>':'')+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Shigley key checks: shear τ = 2T/(d·b·L) against 0.577·Sy/FoS, crush σ = 4T/(d·h·L) against Sy/FoS on the h/2 bearing face — crush usually governs. Section from the DIN 6885-1 shaft-diameter table; hub material softer than the key? Re-run with the hub&#39;s Sy, the weakest face rules.</p>');
};
const HITCH={vert:['Vertical',1.0],chok:['Choker',0.75],bask:['Basket (legs vertical)',2.0]};
window.calcSling=function(){
  const res=$('rigging-results');if(!res)return;
  const Wt=v('rg-w'),n=Math.max(1,Math.round(v('rg-n')||2)),ang=v('rg-ang'),h=HITCH[sv('rg-hitch')]||HITCH.vert;
  if(!(Wt>0)||!(ang>0)||ang>90){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need load &gt; 0 and angle 0-90°.</div>');return;}
  const W=Wt*9.81;
  if(ang<30){_mr(res,'<h3>SLING TENSION</h3><div class="note warn">'+ang+'° is BELOW the 30° minimum — leg tension is '+(1/Math.sin(ang*Math.PI/180)).toFixed(1)+'× the share it carries and rises toward infinity as the sling flattens. Rigging practice refuses this lift: raise the hook, use longer slings or a spreader beam.</div>');return;}
  const neff=n>2?2:n;
  const T=W/(neff*Math.sin(ang*Math.PI/180)),wll=T/h[1];
  _mr(res,'<h3>SLING TENSION</h3><div class="result-grid">'+[
    ['Load',Wt+' t = '+W.toFixed(1)+' kN'],
    ['PER-LEG TENSION',T.toFixed(2)+' kN ('+(T/9.81).toFixed(2)+' t)','ok'],
    ['Angle factor',(1/Math.sin(ang*Math.PI/180)).toFixed(3)+' at '+ang+'°'],
    ['Legs carrying',neff+(n>2?' of '+n+' (rigid load — assume 2 carry unless a spreader guarantees sharing)':'')],
    ['Hitch',h[0]+' × '+h[1]],
    ['REQUIRED SLING WLL','≥ '+(wll/9.81).toFixed(2)+' t per leg','ok'],
    [ang<45?'CAUTION':'Angle check',ang<45?ang+'° is workable but 45-60° is the comfort zone':ang+'° ✓',ang<45?'warn':'ok']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">T = W/(n·sin θ), θ from HORIZONTAL — at 30° each leg carries its full share ×2. Hitch factors are the standard vertical 1.0 / choker 0.75 / basket 2.0; choker below 120° of wrap derates further. Shoulder eyebolts: 100% in-line, ~30% at 45°, ~25% at 90° — plain eyebolts take NO angular load. Manufacturer charts and a qualified rigger govern every real lift.</p>');
};
window.calcSlingCg=function(){
  const res=$('rigging-results');if(!res)return;
  const Wt=v('rgu-w'),d1=v('rgu-d1'),d2=v('rgu-d2'),hh=v('rgu-h');
  if(!(Wt>0)||!(d1>0)||!(d2>0)||!(hh>0)){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need load, both CoG distances and hook height &gt; 0.</div>');return;}
  const W=Wt*9.81,L1=Math.hypot(d1,hh),L2=Math.hypot(d2,hh);
  const V1=W*d2/(d1+d2),V2=W*d1/(d1+d2);
  const T1=V1*L1/hh,T2=V2*L2/hh;
  const a1=Math.atan2(hh,d1)*180/Math.PI,a2=Math.atan2(hh,d2)*180/Math.PI;
  const low=Math.min(a1,a2)<30;
  _mr(res,'<h3>UNEQUAL LEGS (CoG OFFSET)</h3><div class="result-grid">'+[
    ['Leg 1 (near, d='+d1+' m)',T1.toFixed(2)+' kN @ '+a1.toFixed(1)+'°','ok'],
    ['Leg 2 (far, d='+d2+' m)',T2.toFixed(2)+' kN @ '+a2.toFixed(1)+'°'],
    ['Vertical shares',V1.toFixed(2)+' + '+V2.toFixed(2)+' = '+W.toFixed(2)+' kN ✓'],
    ['Leg lengths',L1.toFixed(2)+' / '+L2.toFixed(2)+' m'],
    ['NEAR LEG WLL','≥ '+(T1/9.81).toFixed(2)+' t',low?'warn':'ok']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    (low?'<div class="note warn" style="margin-top:.4rem">A leg is below 30° — re-rig before lifting.</div>':'')+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">Statics: the leg NEARER the CoG carries more — vertical share V₁ = W·d₂/(d₁+d₂), tension T = V·L/h. Size BOTH slings for the near-leg tension so the load can&#39;t be hooked backwards. Hook must sit plumb over the CoG or the load rotates on pick.</p>');
};
const FR_Y={center:['Center through-crack (wide plate)',1.0],edge:['Edge crack',1.12],penny:['Embedded penny crack',2/Math.PI]};
function injectFracture(){
  const vw=$('v-fatigue');if(!vw||$('fr-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='fr-card';card.style.marginTop='.6rem';
  card.innerHTML='<h3>FRACTURE / CRACK GROWTH (LEFM)</h3>'+
    '<div class="row">'+
    '<div class="field"><label for="fr-geo">CRACK GEOMETRY</label><select id="fr-geo">'+Object.entries(FR_Y).map(([k,g])=>`<option value="${k}">${g[0]} (Y=${g[1].toFixed(2)})</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="fr-s">σ MAX (MPa)</label><input type="number" id="fr-s" value="150" step="any"></div>'+
    '<div class="field"><label for="fr-ds">Δσ RANGE (MPa)</label><input type="number" id="fr-ds" value="100" step="any"></div>'+
    '<div class="field"><label for="fr-a0">CRACK a₀ (mm)</label><input type="number" id="fr-a0" value="1" step="any"></div>'+
    '<div class="field"><label for="fr-kic">K_IC (MPa·√m)</label><input type="number" id="fr-kic" value="100" step="any"></div>'+
    '<div class="field"><label for="fr-c">PARIS C (m/cyc)</label><input type="number" id="fr-c" value="6.9e-12" step="any"></div>'+
    '<div class="field"><label for="fr-m">PARIS m</label><input type="number" id="fr-m" value="3" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcFracture()" style="margin-top:.6rem">K / LIFE</button><div id="fr-out"></div>';
  host.appendChild(card);
}
window.calcFracture=function(){
  const o=$('fr-out');if(!o)return;
  const Y=FR_Y[sv('fr-geo')]?FR_Y[sv('fr-geo')][1]:1,s=v('fr-s'),ds=v('fr-ds'),a0=v('fr-a0')/1000,KIC=v('fr-kic'),Cp=v('fr-c')||6.9e-12,m=v('fr-m')||3;
  if(!(s>0)||!(a0>0)||!(KIC>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need σ, a₀ and K_IC &gt; 0.</div>');return;}
  const K=Y*s*Math.sqrt(Math.PI*a0);
  const ac=Math.pow(KIC/(Y*s),2)/Math.PI;
  const crit=K>=KIC;
  let N=null;
  if(!crit&&ds>0&&Math.abs(m-2)>1e-9&&ac>a0){
    const e=1-m/2;
    N=(Math.pow(ac,e)-Math.pow(a0,e))/(Cp*Math.pow(Y*ds*Math.sqrt(Math.PI),m)*e);
  }
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['K_I at a₀',K.toFixed(1)+' MPa·√m',crit?'err':'ok'],
    ['vs K_IC',(K/KIC*100).toFixed(0)+' % of toughness',crit?'err':K/KIC>0.7?'warn':'ok'],
    ['CRITICAL CRACK a_c',(ac*1000).toFixed(1)+' mm','ok'],
    ['Margin on size',(ac/a0).toFixed(1)+'× current crack',ac/a0<2?'warn':'ok'],
    N!==null?['PARIS LIFE a₀ → a_c','≈ '+(N>=1e6?(N/1e6).toFixed(2)+' M cycles':Math.round(N).toLocaleString()+' cycles'),'ok']:['Paris life',crit?'— ALREADY CRITICAL':'needs Δσ > 0 and m ≠ 2']
  ].filter(Boolean).map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">LEFM: K_I = Y·σ·√(πa); failure when K_I hits the material toughness K_IC, so a_c = (K_IC/Yσ)²/π. Life integrates Paris da/dN = C·ΔK^m in closed form. Y here is the wide-plate value — finite width, surface flaws and corner cracks raise it (Y = √sec(πa/w) for center cracks). Steel ballpark: C ≈ 7×10⁻¹² m/cyc, m ≈ 3 (MPa·√m units); K_IC from certs, not tables, for anything that matters. Most of the life is spent while the crack is SMALL — inspect early, inspect often.</p>');
};
function injectKtCard(){
  const vw=$('v-stress');if(!vw||$('kt-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='kt-card';card.style.marginTop='.6rem';
  card.innerHTML='<h3>STRESS CONCENTRATION K_t</h3>'+
    '<div class="row">'+
    '<div class="field"><label for="kt-case">CASE</label><select id="kt-case"><option value="hole">Circular hole in finite plate (Howland)</option><option value="ellipse">Elliptical hole (Inglis, exact)</option></select></div>'+
    '<div class="field"><label for="kt-d">HOLE Ø d / 2a ACROSS LOAD (mm)</label><input type="number" id="kt-d" value="10" step="any"></div>'+
    '<div class="field"><label for="kt-w">PLATE WIDTH w / 2b ALONG LOAD (mm)</label><input type="number" id="kt-w" value="50" step="any"></div>'+
    '<div class="field"><label for="kt-snom">σ NOMINAL (MPa)</label><input type="number" id="kt-snom" value="100" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcKt()" style="margin-top:.6rem">K_t</button><div id="kt-out"></div>';
  host.appendChild(card);
}
window.calcKt=function(){
  const o=$('kt-out');if(!o)return;
  const cs=sv('kt-case')||'hole',d=v('kt-d'),w=v('kt-w'),sn=v('kt-snom')||0;
  if(!(d>0)||!(w>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Both dimensions required.</div>');return;}
  let Kt,label,note2,warn=false;
  if(cs==='hole'){
    const r=d/w;
    if(r>=1){_mr(o,'<div class="note warn" style="margin-top:.5rem">Hole must be smaller than the plate width.</div>');return;}
    warn=r>0.65;
    Kt=3-3.14*r+3.667*r*r-1.527*r*r*r;
    label='d/w = '+r.toFixed(3);
    note2='Howland polynomial on the NET section: K_t = 3 − 3.14(d/w) + 3.667(d/w)² − 1.527(d/w)³, exact 3.0 in the infinite-plate limit'+(warn?' — d/w &gt; 0.65 is outside the fit&#39;s comfort zone':'')+'. Peak stress sits at the hole edge, transverse to load.';
  }else{
    Kt=1+2*(d/2)/(w/2);
    label='a/b = '+((d/2)/(w/2)).toFixed(3);
    note2='Inglis exact elasticity solution: K_t = 1 + 2a/b with a the semi-axis ACROSS the load. A circle (a = b) gives exactly 3; a slit (b → 0) blows up to infinity — which is precisely why cracks get LEFM instead of K_t (use the FRACTURE card in Fatigue).';
  }
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['K_t',Kt.toFixed(3),warn?'warn':'ok'],['Geometry',label],
    sn>0?['σ PEAK',(Kt*sn).toFixed(0)+' MPa','ok']:null,
    sn>0?['Check','compare '+(Kt*sn).toFixed(0)+' MPa against Sy (static, ductile: local yielding blunts it) or use K_f for fatigue',null]:null
  ].filter(Boolean).map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">'+note2+' Ductile static parts shrug K_t off by local yielding; FATIGUE does not — carry K_f = 1 + q(K_t − 1) into the Fatigue module. Shoulder-fillet and groove cases follow Peterson charts — not reproduced here rather than approximated loosely.</p>');
};
function injectLugCard(){
  const vw=$('v-rigging');if(!vw||$('lg-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='lg-card';card.style.marginTop='.6rem';
  card.innerHTML='<h3>PAD-EYE / LUG CHECK (SIMPLIFIED)</h3>'+
    '<div class="row">'+
    '<div class="field"><label for="lg-p">LEG TENSION P (kN)</label><input type="number" id="lg-p" value="10" step="any"></div>'+
    '<div class="field"><label for="lg-d">PIN / SHACKLE Ø (mm)</label><input type="number" id="lg-d" value="20" step="any"></div>'+
    '<div class="field"><label for="lg-t">PLATE t (mm)</label><input type="number" id="lg-t" value="15" step="any"></div>'+
    '<div class="field"><label for="lg-a">HOLE CTR → EDGE, LOAD DIR (mm)</label><input type="number" id="lg-a" value="35" step="any"></div>'+
    '<div class="field"><label for="lg-w">PLATE WIDTH AT HOLE (mm)</label><input type="number" id="lg-w" value="70" step="any"></div>'+
    '<div class="field"><label for="lg-fy">PLATE F_y (MPa)</label><input type="number" id="lg-fy" value="250" step="any"></div>'+
    '<div class="field"><label for="lg-fos">DESIGN FACTOR</label><select id="lg-fos"><option value="2">2.0 (BTH-1 Cat A basis)</option><option value="3" selected>3.0 (BTH-1 Cat B basis)</option><option value="5">5.0 (unpredictable service)</option></select></div>'+
    '</div><button class="btn btn-sm" onclick="calcLug()" style="margin-top:.6rem">CHECK LUG</button><div id="lg-out"></div>';
  host.appendChild(card);
}
window.calcLug=function(){
  const o=$('lg-out');if(!o)return;
  const P=v('lg-p')*1000,d=v('lg-d'),t=v('lg-t'),a=v('lg-a'),w=v('lg-w'),Fy=v('lg-fy')||250,n=parseFloat(sv('lg-fos'))||3;
  if(!(P>0)||!(d>0)||!(t>0)||!(a>d/2)||!(w>d)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need P, pin Ø, thickness; edge distance &gt; pin radius; width &gt; pin Ø.</div>');return;}
  const sb=P/(d*t),st=P/((w-d)*t),tv=P/(2*t*(a-d/2));
  const ab=Fy/n,at=Fy/n,av=0.577*Fy/n;
  const rows=[['Bearing on pin',sb,ab],['Net-section tension',st,at],['Shear tear-out (2 planes)',tv,av]];
  const worst=Math.max(sb/ab,st/at,tv/av);
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+
    rows.map(([l,sig,al])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${sig<=al?'ok':'err'}">${sig.toFixed(0)} / ${al.toFixed(0)} MPa</div></div>`).join('')+
    `<div class="result-item"><div class="lbl">VERDICT</div><div class="val ${worst<=1?'ok':'err'}">${worst<=1?'PASSES at design factor '+n:'FAILS — utilization '+(worst*100).toFixed(0)+' %'}</div></div>`+
    `<div class="result-item"><div class="lbl">Governing</div><div class="val">${rows.reduce((b2,r)=>r[1]/r[2]>b2[1]/b2[2]?r:b2)[0]}</div></div>`+
    '</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">First-principles checks with a straight-plane tear-out (conservative): bearing P/(d·t), net tension P/((w−d)·t), double-plane shear P/(2t·(a−d/2)); allowables F_y/N and 0.577·F_y/N. Real lifting devices are governed by ASME BTH-1 Chapter 3 (pin-hole effective width, dishing limits t ≥ 0.5·d for narrow lugs, weld checks) — treat this card as the screening pass and BTH-1 as the design document. A loose-fitting shackle pin concentrates bearing — keep pin-to-hole clearance small.</p>');
};
function boltSeq(N){
  if(N<3)return Array.from({length:N},(_,i)=>i+1);
  if(N%4===0)return Array.from({length:N/2},(_,j)=>Math.floor(j/2)+1+(j%2)*(N/4)).flatMap(x=>[x,x+N/2]);
  if(N%2===0)return Array.from({length:N/2},(_,j)=>j+1).flatMap(x=>[x,x+N/2]);
  const step=(N-1)/2,out=[];let p=1;
  for(let i=0;i<N;i++){out.push(p);p=(p-1+step)%N+1;}
  return out;
}
function injectBoltSeq(){
  const vw=$('v-bolts');if(!vw||$('bsq-card'))return;
  const host=vw.querySelector('.split>div:last-child')||vw;
  const card=document.createElement('div');card.className='card bolt-x';card.id='bsq-card';card.style.marginTop='.6rem';
  card.innerHTML='<h3>TIGHTENING SEQUENCE (ASME PCC-1)</h3>'+
    '<div class="row">'+
    '<div class="field"><label for="bsq-n"># BOLTS</label><input type="number" id="bsq-n" value="8" step="1" min="3" max="48"></div>'+
    '<div class="field"><label for="bsq-t">FINAL TORQUE (N·m)</label><input type="number" id="bsq-t" value="180" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcBoltSeq()" style="margin-top:.6rem">SEQUENCE</button><div id="bsq-out"></div>';
  host.appendChild(card);
}
window.calcBoltSeq=function(){
  const o=$('bsq-out');if(!o)return;
  const N=Math.max(3,Math.min(48,Math.round(v('bsq-n')||8))),T=v('bsq-t')||0;
  const seq=boltSeq(N);
  const pass=f=>T>0?' — '+Math.round(T*f)+' N·m':'';
  _mr(o,'<div style="margin-top:.6rem"><div class="result-grid">'+[
    ['STAR ORDER',seq.join(' → '),'ok'],
    ['Pass 1 (20-30%)','star order'+pass(0.25)],
    ['Pass 2 (50-70%)','star order'+pass(0.6)],
    ['Pass 3 (100%)','star order'+pass(1)],
    ['Check passes','ROTATIONAL (1→'+N+' clockwise) at 100% until no nut moves']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div></div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">ASME PCC-1 legacy cross pattern: opposite bolts in rotating quadrants so the flange pulls down flat instead of cocking. Number the bolts clockwise from 12 o&#39;clock. After pass 3, keep circling at full torque until nothing turns — gasket creep gives back preload for several rounds. Lubricate threads AND nut face, and use the K value that matches that lubricant in the JOINT card above.</p>');
};
const DP_CD={orifice:['Sharp-edge orifice',0.61],nozzle:['Flow nozzle',0.96],venturi:['Venturi',0.98],custom:['Custom C_d',0]};
function injectFlowMeter(){
  const vw=$('v-fluids');if(!vw||$('dp-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='dp-card';card.style.marginTop='.6rem';
  card.innerHTML='<h3>FLOW MEASUREMENT (ΔP METER)</h3>'+
    '<div class="row">'+
    '<div class="field"><label for="dp-type">ELEMENT</label><select id="dp-type">'+Object.entries(DP_CD).map(([k,c])=>`<option value="${k}">${c[0]}${c[1]?' (C_d '+c[1]+')':''}</option>`).join('')+'</select></div>'+
    '<div class="field"><label for="dp-cd">C_d CUSTOM</label><input type="number" id="dp-cd" value="0.61" step="any"></div>'+
    '<div class="field"><label for="dp-pd">PIPE ID D (mm)</label><input type="number" id="dp-pd" value="52.5" step="any"></div>'+
    '<div class="field"><label for="dp-td">THROAT d (mm)</label><input type="number" id="dp-td" value="26.25" step="any"></div>'+
    '<div class="field"><label for="dp-dp">ΔP (kPa)</label><input type="number" id="dp-dp" value="25" step="any"></div>'+
    '<div class="field"><label for="dp-rho">ρ (kg/m³)</label><input type="number" id="dp-rho" value="998" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcFlowMeter()" style="margin-top:.6rem">FLOW RATE</button><div id="dp-out"></div>';
  host.appendChild(card);
}
window.calcFlowMeter=function(){
  const o=$('dp-out');if(!o)return;
  const type=sv('dp-type')||'orifice',Cd=type==='custom'?(v('dp-cd')||0.61):DP_CD[type][1];
  const D=v('dp-pd')/1000,d=v('dp-td')/1000,dP=v('dp-dp')*1000,rho=v('dp-rho')||998;
  if(!(d>0)||!(D>d)||!(dP>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Need throat &lt; pipe ID and ΔP &gt; 0.</div>');return;}
  const beta=d/D,At=Math.PI*d*d/4;
  const Q=Cd*At*Math.sqrt(2*dP/rho)/Math.sqrt(1-Math.pow(beta,4));
  const vth=Q/At,loss=type==='venturi'?dP*0.13:dP*(1-beta*beta);
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['FLOW',(Q*3600).toFixed(2)+' m³/h ('+(Q*1000).toFixed(3)+' L/s)','ok'],
    ['Mass flow',(Q*rho).toFixed(3)+' kg/s'],['β = d/D',beta.toFixed(3),beta>=0.2&&beta<=0.75?'ok':'warn'],
    ['Throat velocity',vth.toFixed(2)+' m/s'],['C_d used',Cd.toFixed(3)],
    ['Permanent loss','≈ '+(loss/1000).toFixed(1)+' kPa'+(type==='venturi'?' (venturi recovers most ΔP)':'')]
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Q = C_d·A_t·√(2ΔP/ρ) / √(1−β⁴) — the universal ΔP-metering equation. Defaults are the textbook high-Re coefficients (sharp orifice 0.61, nozzle 0.96, venturi 0.98); ISO 5167 refines C_d with Reynolds and tap geometry — calibrate for custody transfer. Keep β between 0.2 and 0.75. Orifice permanent loss ≈ (1−β²)·ΔP; a venturi recovers all but ~10-15%.</p>');
};
function injectPlanetary(){
  const vw=$('v-gears');if(!vw||$('gt-card'))return;
  const host=vw.querySelector('.split>div:first-child')||vw;
  const card=document.createElement('div');card.className='card';card.id='gt-card';card.style.marginTop='.6rem';
  card.innerHTML='<h3>PLANETARY / EPICYCLIC TRAIN</h3>'+
    '<div class="row">'+
    '<div class="field"><label for="gt-zs">SUN TEETH Z_s</label><input type="number" id="gt-zs" value="24" step="1"></div>'+
    '<div class="field"><label for="gt-zp">PLANET TEETH Z_p</label><input type="number" id="gt-zp" value="18" step="1"></div>'+
    '<div class="field"><label for="gt-np"># PLANETS</label><input type="number" id="gt-np" value="3" step="1"></div>'+
    '<div class="field"><label for="gt-fix">FIXED MEMBER</label><select id="gt-fix"><option value="ring">RING (sun in → carrier out)</option><option value="sun">SUN (ring in → carrier out)</option><option value="carrier">CARRIER (sun in → ring out)</option></select></div>'+
    '<div class="field"><label for="gt-n">INPUT SPEED (rpm)</label><input type="number" id="gt-n" value="1800" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcPlanetary()" style="margin-top:.6rem">RATIOS</button><div id="gt-out"></div>';
  host.appendChild(card);
}
window.calcPlanetary=function(){
  const o=$('gt-out');if(!o)return;
  const Zs=Math.round(v('gt-zs')),Zp=Math.round(v('gt-zp')),np=Math.max(1,Math.round(v('gt-np')||3)),fix=sv('gt-fix')||'ring',N=v('gt-n')||0;
  if(!(Zs>6)||!(Zp>6)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Sun and planet teeth &gt; 6 required.</div>');return;}
  const Zr=Zs+2*Zp;
  const i=fix==='ring'?1+Zr/Zs:fix==='sun'?1+Zs/Zr:-Zr/Zs;
  const Nout=i?N/i:0;
  const asm=(Zs+Zr)%np===0;
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['RING TEETH Z_r',Zr+' (= Z_s + 2·Z_p)'],
    ['RATIO',Math.abs(i).toFixed(3)+' : 1'+(i<0?' (REVERSED)':''),'ok'],
    ['Output speed',Math.abs(Nout).toFixed(1)+' rpm'+(i<0?' opposite':'')],
    ['Assembly',(Zs+Zr)+' / '+np+' = '+((Zs+Zr)/np).toFixed(2)+(asm?' ✓ planets space equally':' ✗ NOT an integer'),asm?'ok':'err'],
    ['Torque multiplication','× '+Math.abs(i).toFixed(2)+' (minus mesh losses ~1-2%/mesh)']
  ].map(x=>`<div class="result-item"><div class="lbl">${x[0]}</div><div class="val ${x[2]||''}">${x[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Willis equation kinematics: ring fixed → i = 1 + Z_r/Z_s (compact reducer, same direction); sun fixed → i = 1 + Z_s/Z_r (mild ratio); carrier fixed → i = −Z_r/Z_s (star arrangement, reverses). Ring teeth follow from the meshing constraint Z_r = Z_s + 2·Z_p. Equal planet spacing needs (Z_s + Z_r) divisible by the planet count; check neighboring-planet tip clearance for big planets. Stage ratios multiply — two 3.5:1 stages give 12.25:1.</p>');
};
const MC_VC={alu:['Aluminum alloys',75,105,240,600],steel1018:['Mild steel (1018)',27,34,90,200],steel4140:['Alloy steel (4140 HT)',20,27,75,150],ss304:['Stainless 304/316',12,18,60,120],ci:['Gray cast iron',20,30,75,150],brass:['Brass',60,90,180,300],cu:['Copper',45,60,150,250],ti:['Ti-6Al-4V',8,12,30,60],acetal:['Plastics (acetal)',90,150,250,450]};
function mcPopulate(){
  const s=$('mc-mat');if(!s||s.options.length)return;
  s.innerHTML=Object.entries(MC_VC).map(([k,m])=>`<option value="${k}"${k==='steel1018'?' selected':''}>${m[0]}</option>`).join('');
}
window.calcSpeeds=function(){
  const res=$('machining-results');if(!res)return;
  const m=MC_VC[sv('mc-mat')]||MC_VC.steel1018,tool=sv('mc-tool')||'carb';
  const lo=tool==='hss'?m[1]:m[3],hi=tool==='hss'?m[2]:m[4],Vc=(lo+hi)/2;
  const D=v('mc-d'),z=Math.max(1,Math.round(v('mc-z')||2)),fz=v('mc-fz'),ap=v('mc-doc')||0,ae=v('mc-woc')||0;
  if(!(D>0)||!(fz>0)){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need tool Ø and chip load &gt; 0.</div>');return;}
  const N=1000*Vc/(Math.PI*D),vf=fz*z*N,MRR=ap*ae*vf/1000;
  _mr(res,'<h3>SPEEDS &amp; FEEDS</h3><div class="result-grid">'+[
    ['Cutting speed V_c',Vc.toFixed(0)+' m/min (band '+lo+'–'+hi+')'],
    ['SPINDLE',N.toFixed(0)+' rpm','ok'],['FEED',vf.toFixed(0)+' mm/min','ok'],
    ['Feed per rev',(fz*z).toFixed(3)+' mm'],['MRR',MRR>0?MRR.toFixed(1)+' cm³/min':'—']
  ].map(([l,val,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${val}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">N = 1000·V_c/(πD), feed = f_z·z·N, computed at MID-band — start there and listen to the cut; slot cuts and long stickout want the low end, finishing passes the high end. Aluminum takes roughly double the steel chip load; halve f_z below Ø4 mm. Bands are standard reference ranges for sharp tools with flood/mist.</p>');
};
window.calcTapDrill=function(){
  const res=$('machining-results');if(!res)return;
  const sys=sv('td-sys')||'m',d=v('td-d'),p=v('td-p'),pct=Math.min(85,Math.max(50,v('td-pct')||75));
  if(!(d>0)||!(p>0)){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need major Ø and pitch/TPI &gt; 0.</div>');return;}
  const drill=sys==='m'?d-p*pct/76.98:d-0.01299*pct/p;
  const mm=sys==='m'?drill:drill*25.4,inch=sys==='m'?drill/25.4:drill;
  _mr(res,'<h3>TAP DRILL</h3><div class="result-grid">'+[
    ['DRILL Ø',mm.toFixed(2)+' mm','ok'],['(inch)',inch.toFixed(4)+' in'],
    ['Thread engagement',pct.toFixed(0)+' %'],['Nearest 0.1 mm',(Math.round(mm*10)/10).toFixed(1)+' mm']
  ].map(([l,val,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${val}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">Machinery&#39;s Handbook percent-of-thread formulas: metric drill = d − p·%/76.98 (the familiar d − p rule ≈ 77%), unified drill = d − 0.01299·%/TPI (¼-20 at 75% → 0.2013″ — the classic #7). 75% is the sweet spot: going 100% doubles tapping torque for ~5% more strength. Use 65-70% in tough stainless/Ti to save taps.</p>');
};
window.calcBend=function(){
  const res=$('machining-results');if(!res)return;
  const t=v('ba-t'),R=v('ba-r'),a=v('ba-a'),K=Math.min(0.5,Math.max(0.2,v('ba-k')||0.33)),L1=v('ba-l1')||0,L2=v('ba-l2')||0;
  if(!(t>0)||!(R>=0)||!(a>0)){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need thickness, radius and angle.</div>');return;}
  const th=a*Math.PI/180,BA=th*(R+K*t);
  const hem=a>170;
  const OSSB=hem?null:(R+t)*Math.tan(th/2),BD=hem?null:2*OSSB-BA,flat=hem?null:L1+L2-BD;
  _mr(res,'<h3>BEND / FLAT PATTERN</h3><div class="result-grid">'+[
    ['Bend allowance BA',BA.toFixed(3)+' mm','ok'],
    ['Setback OSSB',hem?'— (hem: legs+BA directly)':OSSB.toFixed(3)+' mm'],
    ['Bend deduction BD',hem?'—':BD.toFixed(3)+' mm'],
    ['FLAT LENGTH',hem?(L1+L2+BA-2*t).toFixed(2)+' mm (approx)':flat.toFixed(2)+' mm','ok'],
    ['Neutral axis at',(K*t).toFixed(2)+' mm from inside']
  ].map(([l,val,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${val}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">BA = θ·(R + K·t), OSSB = (R+t)·tan(θ/2), BD = 2·OSSB − BA, flat = A + B − BD with legs measured to the apex (mold line). K ≈ 0.33 for air bending R&lt;2t, ≈ 0.40-0.45 for R&gt;2t, 0.50 = pure geometric neutral axis. Your press brake&#39;s real K beats any table — bend a test coupon and back-solve.</p>');
};
const E140=[[65,832,739],[60,697,654],[55,595,560],[50,513,481],[45,446,421],[40,392,371],[35,345,327],[30,302,286],[25,266,253],[20,238,226]];
window.calcHardness=function(){
  const res=$('machining-results');if(!res)return;
  const scale=sv('hc-scale')||'hrc',val=v('hc-val'),col=scale==='hrc'?0:scale==='hv'?1:2;
  if(!isFinite(val)){_mr(res,'<h3>RESULTS</h3><div class="note warn">Enter a hardness value.</div>');return;}
  const t=E140.slice().sort((x,y)=>x[col]-y[col]);
  const lo=t[0][col],hi=t[t.length-1][col];
  const clamped=val<lo||val>hi,cv=Math.min(hi,Math.max(lo,val));
  let i=0;while(i<t.length-2&&t[i+1][col]<cv)i++;
  const f=(cv-t[i][col])/(t[i+1][col]-t[i][col]);
  const out=[0,1,2].map(c=>t[i][c]+f*(t[i+1][c]-t[i][c]));
  const uts=3.45*out[2];
  _mr(res,'<h3>HARDNESS (STEEL)</h3><div class="result-grid">'+[
    ['HRC',out[0].toFixed(1),'ok'],['HV (Vickers)',out[1].toFixed(0),'ok'],['HB (Brinell)',out[2].toFixed(0),'ok'],
    ['UTS estimate','≈ '+uts.toFixed(0)+' MPa ('+(uts/6.895).toFixed(0)+' ksi)']
  ].map(([l,val2,c])=>`<div class="result-item"><div class="lbl">${l}</div><div class="val ${c||''}">${val2}</div></div>`).join('')+'</div>'+
    (clamped?'<div class="note warn" style="margin-top:.4rem">Outside the ASTM E140 table (HRC 20-65) — clamped to the nearest end, not extrapolated.</div>':'')+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">Linear interpolation of the ASTM E140 non-austenitic steel table. Valid for steels only — aluminum, copper and austenitic stainless follow different tables. UTS ≈ 3.45·HB is the standard steel estimate (±10%); it is NOT a substitute for a cert.</p>');
};
window.calcBoltCircle=function(){
  const res=$('machining-results');if(!res)return;
  const n=Math.max(2,Math.round(v('bc-n')||6)),D=v('bc-d'),a0=v('bc-a0')||0;
  if(!(D>0)){_mr(res,'<h3>RESULTS</h3><div class="note warn">Need circle Ø &gt; 0.</div>');return;}
  const r=D/2,pts=Array.from({length:n},(_,i)=>{const th=(a0+i*360/n)*Math.PI/180;return[r*Math.cos(th),r*Math.sin(th),a0+i*360/n];});
  _mr(res,'<h3>BOLT CIRCLE — '+n+' × Ø'+D+'</h3><div style="max-height:260px;overflow-y:auto"><table style="width:100%;font-size:.75rem;border-collapse:collapse">'+
    '<tr style="color:var(--dim)"><th style="text-align:left">#</th><th style="text-align:right">θ°</th><th style="text-align:right">X</th><th style="text-align:right">Y</th></tr>'+
    pts.map((p,i)=>`<tr><td>${i+1}</td><td style="text-align:right">${p[2].toFixed(1)}</td><td style="text-align:right">${p[0].toFixed(3)}</td><td style="text-align:right">${p[1].toFixed(3)}</td></tr>`).join('')+'</table></div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">X = R·cos θ, Y = R·sin θ from circle center, CCW from +X. Chord between adjacent holes = '+(2*r*Math.sin(Math.PI/n)).toFixed(3)+' mm. GD&amp;T true position of an as-drilled hole = 2·√(ΔX² + ΔY²). The BOLTS module&#39;s PATTERN card takes it from here for load analysis.</p>');
  const c=$('c-mach');if(c&&c.getContext){
    const x=c.getContext('2d'),th2=pTheme(),cx=c.width/2,cy=c.height/2,cr=c.width/2-40;
    x.clearRect(0,0,c.width,c.height);
    x.strokeStyle=th2.dim;x.lineWidth=1;x.setLineDash([6,4]);
    x.beginPath();x.arc(cx,cy,cr,0,2*Math.PI);x.stroke();x.setLineDash([]);
    x.beginPath();x.moveTo(cx-8,cy);x.lineTo(cx+8,cy);x.moveTo(cx,cy-8);x.lineTo(cx,cy+8);x.stroke();
    x.font='10px monospace';x.textAlign='center';
    pts.forEach((p,i)=>{
      const px2=cx+p[0]/r*cr,py2=cy-p[1]/r*cr;
      x.strokeStyle=th2.accent;x.lineWidth=2;
      x.beginPath();x.arc(px2,py2,9,0,2*Math.PI);x.stroke();
      x.fillStyle=th2.text;x.fillText(String(i+1),px2,py2-13);
    });
    x.fillStyle=th2.dim;x.fillText('Ø'+D,cx,cy+cr+24>c.height?cy+18:cy+cr+18);
  }
};
function injectThreadEngage(){
  const vw=$('v-bolts');if(!vw||$('te-card'))return;
  const host=vw.querySelector('.split>div:last-child')||vw;
  const card=document.createElement('div');card.className='card bolt-x';card.id='te-card';
  card.innerHTML='<h3>THREAD ENGAGEMENT / STRIPPING</h3>'+
    '<p style="font-size:.7rem;color:var(--dim);margin:0 0 .5rem">Size and A_t follow the JOINT card selection. Basic-size shear areas (FED-STD-H28 simplification): A_ext = 0.75·π·K_n·L_e, A_int = 0.875·π·d·L_e.</p>'+
    '<div class="row">'+
    '<div class="field"><label for="te-le">ENGAGEMENT L_e (mm)</label><input type="number" id="te-le" value="12" step="any"></div>'+
    '<div class="field"><label for="te-sub">BOLT S_u (MPa)</label><input type="number" id="te-sub" value="830" step="any"></div>'+
    '<div class="field"><label for="te-sun">NUT/TAP MATERIAL S_u (MPa)</label><input type="number" id="te-sun" value="830" step="any"></div>'+
    '</div><button class="btn btn-sm" onclick="calcThreadEngage()" style="margin-top:.6rem">CHECK STRIPPING</button><div id="te-out"></div>';
  host.appendChild(card);
}
window.calcThreadEngage=function(){
  const o=$('te-out');if(!o)return;
  const size=BOLT_SIZES[sv('bl-size')]||BOLT_SIZES['1/2-13'];
  const d=size.d,p=size.p,At=size.At;
  const Le=v('te-le'),Sub=v('te-sub')||830,Sun=v('te-sun')||Sub;
  if(!(Le>0)){_mr(o,'<div class="note warn" style="margin-top:.5rem">Engagement length required.</div>');return;}
  const Kn=d-1.0825*p;
  const ASe=0.75*Math.PI*Kn*Le,ASi=0.875*Math.PI*d*Le;
  const Fbreak=Sub*At,FstripB=0.6*Sub*ASe,FstripN=0.6*Sun*ASi;
  const Fmin=Math.min(FstripB,FstripN);
  const LeMin=Fbreak/Math.min(0.6*Sub*0.75*Math.PI*Kn,0.6*Sun*0.875*Math.PI*d);
  const mode=Fbreak<=Fmin?'BOLT BREAKS FIRST (ductile, preferred)':FstripB<FstripN?'BOLT THREADS STRIP':'INTERNAL THREADS STRIP';
  _mr(o,'<div class="result-grid" style="margin-top:.6rem">'+[
    ['Size',sv('bl-size')+' (d='+d+', p='+p+')'],['F bolt break',Math.round(Fbreak/1000)+' kN'],
    ['F strip — bolt threads',Math.round(FstripB/1000)+' kN'],['F strip — internal threads',Math.round(FstripN/1000)+' kN'],
    ['Governing mode',mode,Fbreak<=Fmin?'ok':'err'],
    ['L_e min (break-before-strip)',LeMin.toFixed(1)+' mm',Le>=LeMin?'ok':'err'],
    ['L_e / d',(Le/d).toFixed(2),Le/d>=0.8?'ok':'warn']
  ].map(r=>`<div class="result-item"><div class="lbl">${r[0]}</div><div class="val ${r[2]||''}">${r[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">Thread shear strength taken as 0.6·S_u; basic-size areas (no allowance/tolerance derating) — apply ≥1.5× on L_e_min for production. Soft tapped materials (aluminum ≈ 1.5·d, plastics ≈ 2·d) drive the internal-strip line down fast: drop S_u nut/tap accordingly.</p>');
};
/* ============================================================
 * STRESS MODULE — revive the dead σx card + honor the st-u unit
 * (the obfuscated app never defined calcStress, so the MPa/ksi/
 *  psi/GPa selector did nothing). All six tensor components read
 *  in the st-u unit; results displayed in that same unit.
 *  Principal stresses via Smith's stable symmetric-3x3 eigenvalue
 *  algorithm (magnitude-robust — the old cubic's absolute disc
 *  threshold collapsed to a hydrostatic triple root at high σ).
 * ============================================================ */
const _principal3=(_UC&&_UC.principal3)||function(sx,sy,sz,txy,tyz,txz){const e=[sx,sy,sz];e.sort((a,b)=>b-a);return e;};
window.__principal3=_principal3;
window.calcStress=function(){
  const out=$('stress-results');if(!out)return;
  const U=sv('st-u')||'MPa';
  const s=((_UC&&_UC.factor('pressure',U))||1)||1;
  const sx=v('st-sx')*s,sy=v('st-sy')*s,sz=v('st-sz')*s,txy=v('st-txy')*s,txz=v('st-txz')*s,tyz=v('st-tyz')*s;
  const Sy=v('st-sy-val'),Su=v('st-su-val');
  if(![sx,sy,sz,txy,txz,tyz].every(isFinite)){out.innerHTML='<div class="note warn">Enter the stress components.</div>';return;}
  const pr=_principal3(sx,sy,sz,txy,tyz,txz);
  const s1=pr[0],s2=pr[1],s3=pr[2],tmax=(s1-s3)/2,vM=Math.sqrt(0.5*(Math.pow(s1-s2,2)+Math.pow(s2-s3,2)+Math.pow(s3-s1,2)));
  const dsp=x=>_fmtU(x/s,U),css=n=>n>=2?'ok':n>=1?'warn':'err';
  const rows=[['σ₁',dsp(s1)],['σ₂',dsp(s2)],['σ₃',dsp(s3)],['τ_max (Tresca)',dsp(tmax)],['σ_vM (3D)',dsp(vM)]];
  if(isFinite(Sy)&&Sy>0&&vM>0)rows.push(['FoS yield',(Sy/vM).toFixed(2)+'×',css(Sy/vM)]);
  if(isFinite(Su)&&Su>0&&vM>0)rows.push(['FoS ultimate',(Su/vM).toFixed(2)+'×',css(Su/vM)]);
  const gk=window.GK||(x=>x);
  out.innerHTML='<h3>STRESS ANALYSIS — '+U+'</h3><div class="result-grid">'+rows.map(r=>`<div class="result-item"><div class="lbl">${gk(r[0])}</div><div class="val ${r[2]||''}">${r[1]}</div></div>`).join('')+'</div><p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">The σx unit selector sets the unit for all six stress components (σy, σz, τxy, τxz, τyz); results are shown in <strong>'+U+'</strong>. Yield/ultimate strengths keep their own unit selector. Principal stresses from the cubic invariants — σ_vM for ductile yield, σ₁ for brittle/fatigue, Tresca = (σ₁−σ₃)/2. Aim FoS ≥ 1.5–2.</p>';
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
        if(el.dataset.calcWired)return;
        el.dataset.calcWired='1';
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
      if(el.dataset.calcWired)return;
      el.dataset.calcWired='1';
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
      'Battery contact':{d:0.5,D:6,na:6,nt:8,fl:15,sy:1200,F:3},
      'Ballpoint click (micro)':{d:0.3,D:2.5,na:12,nt:14,fl:12,sy:1400,F:2},
      'Industrial (medium)':{d:3,D:25,na:8,nt:10,fl:60,sy:1100,F:100},
      'Automotive valve spring':{d:4.0,D:28,na:6,nt:8,fl:50,sy:1500,F:300},
      'Furniture / seat':{d:3.5,D:60,na:6,nt:8,fl:120,sy:1200,F:150},
      'Heavy (industrial valve)':{d:5,D:40,na:10,nt:13,fl:120,sy:1300,F:500},
      'Suspension coil':{d:12,D:120,na:8,nt:10,fl:300,sy:1500,F:5000}
    }
  },
  extension:{
    label:'EXTENSION',
    items:{
      'Screen door (light)':{d:1.0,D:8,na:30,nt:32,fl:80,sy:1100,F:15},
      'Brake pedal return':{d:2.0,D:16,na:40,nt:42,fl:150,sy:1300,F:60},
      'Trampoline / heavy':{d:3,D:25,na:50,nt:52,fl:200,sy:1300,F:200},
      'Tailgate assist':{d:4,D:30,na:80,nt:82,fl:400,sy:1300,F:250},
      'Garage door (medium)':{d:5,D:50,na:60,nt:62,fl:600,sy:1300,F:300}
    }
  },
  torsion:{
    label:'TORSION',
    items:{
      'Clothespin':{d:0.9,D:5,na:4,nt:6,fl:10,sy:1300,F:2},
      'Ratchet pawl':{d:1.0,D:8,na:5,nt:7,fl:20,sy:1200,F:10},
      'Mousetrap (snap)':{d:1.2,D:10,na:6,nt:8,fl:30,sy:1200,F:5},
      'Hinge return':{d:2.0,D:20,na:8,nt:10,fl:40,sy:1200,F:20},
      'Hatch counterbalance':{d:4,D:35,na:12,nt:14,fl:80,sy:1400,F:80}
    }
  },
  belleville:{
    label:'BELLEVILLE / DISC (DIN 2093)',
    items:{
      'M3 washer 7×3.2×0.4':{d:0.4,D:7,na:1,nt:1,fl:0.2,sy:1500,F:250,bell:{De:7,Di:3.2,h0:0.2,t:0.4}},
      'A 8×4.2×0.4 (M4)':{d:0.4,D:8,na:1,nt:1,fl:0.2,sy:1500,F:215,bell:{De:8,Di:4.2,h0:0.2,t:0.4}},
      'M5 washer 11×5.2×0.6':{d:0.6,D:11,na:1,nt:1,fl:0.3,sy:1500,F:525,bell:{De:11,Di:5.2,h0:0.3,t:0.6}},
      'M6 washer 14×6.4×0.8':{d:0.8,D:14,na:1,nt:1,fl:0.4,sy:1500,F:1005,bell:{De:14,Di:6.4,h0:0.4,t:0.8}},
      'M12 washer 31×13×1.5':{d:1.5,D:31,na:1,nt:1,fl:0.75,sy:1500,F:2460,bell:{De:31,Di:13,h0:0.75,t:1.5}},
      'B 12×6.2×0.4 (M6)':{d:0.4,D:12,na:1,nt:1,fl:0.35,sy:1500,F:180,bell:{De:12,Di:6.2,h0:0.35,t:0.4}},
      'A 20×10.2×1.1 (M10)':{d:1.1,D:20,na:1,nt:1,fl:0.45,sy:1500,F:1560,bell:{De:20,Di:10.2,h0:0.45,t:1.1}},
      'B 20×10.2×0.7 (M10)':{d:0.7,D:20,na:1,nt:1,fl:0.55,sy:1500,F:525,bell:{De:20,Di:10.2,h0:0.55,t:0.7}},
      'A 31.5×16.3×1.75 (M16)':{d:1.75,D:31.5,na:1,nt:1,fl:0.7,sy:1500,F:3980,bell:{De:31.5,Di:16.3,h0:0.7,t:1.75}},
      'B 31.5×16.3×1.25 (M16)':{d:1.25,D:31.5,na:1,nt:1,fl:0.9,sy:1500,F:1960,bell:{De:31.5,Di:16.3,h0:0.9,t:1.25}},
      'C 31.5×16.3×0.8 (M16)':{d:0.8,D:31.5,na:1,nt:1,fl:1.05,sy:1500,F:705,bell:{De:31.5,Di:16.3,h0:1.05,t:0.8}},
      'A 50×25.4×3 (M24)':{d:3,D:50,na:1,nt:1,fl:1.1,sy:1500,F:12300,bell:{De:50,Di:25.4,h0:1.1,t:3.0}},
      'B 50×25.4×2 (M24)':{d:2,D:50,na:1,nt:1,fl:1.4,sy:1500,F:4890,bell:{De:50,Di:25.4,h0:1.4,t:2.0}},
      'C 50×25.4×1.25 (M24)':{d:1.25,D:50,na:1,nt:1,fl:1.6,sy:1500,F:1590,bell:{De:50,Di:25.4,h0:1.6,t:1.25}},
      'A 63×31×3.5 (M30)':{d:3.5,D:63,na:1,nt:1,fl:1.3,sy:1500,F:14290,bell:{De:63,Di:31,h0:1.3,t:3.5}},
      'B 80×41×3 (M39)':{d:3,D:80,na:1,nt:1,fl:2.3,sy:1500,F:10800,bell:{De:80,Di:41,h0:2.3,t:3.0}},
      'B 100×51×4 (M48)':{d:4,D:100,na:1,nt:1,fl:2.7,sy:1500,F:18800,bell:{De:100,Di:51,h0:2.7,t:4.0}},
      'A 100×51×5.5 (M48)':{d:5.5,D:100,na:1,nt:1,fl:2.2,sy:1500,F:38100,bell:{De:100,Di:51,h0:2.2,t:5.5}},
      'B 125×64×5 (heavy press)':{d:5,D:125,na:1,nt:1,fl:3.5,sy:1500,F:30700,bell:{De:125,Di:64,h0:3.5,t:5.0}}
    }
  },
  die:{
    label:'DIE SPRING (ISO 10243)',
    items:{
      'Extra light (small die)':{d:3,D:20,na:9,nt:11,fl:50,sy:1500,F:150},
      'Light load (yellow stripe)':{d:5,D:32,na:8,nt:10,fl:64,sy:1500,F:600},
      'Medium (blue stripe)':{d:8,D:40,na:7,nt:9,fl:80,sy:1500,F:2200},
      'Heavy (red stripe)':{d:12,D:50,na:6,nt:8,fl:100,sy:1700,F:6000},
      'Extra heavy (large die)':{d:15,D:60,na:5,nt:7,fl:110,sy:1700,F:11000}
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
  if(p.bell)[['de','De'],['di','Di'],['t','t'],['h0','h0']].forEach(([i,k])=>{const el=$('sp-'+i);if(el&&p.bell[k]!=null)el.value=p.bell[k];});
  window.calcSpring();
};
function unitVal(id,multipliers){const u=sv(id+'-u');return v(id)*(multipliers[u]||1);}
window.calcSpring=function(){
  const type=sv('sp-type')||'compression';
  const dMult=(_UC&&_UC.tables.LEN_TO_MM)||{mm:1,'in':25.4};
  const fMult=(_UC&&_UC.tables.FORCE_TO_N)||{N:1,lbf:4.4482216152605,kgf:9.80665};
  const gMult=(_UC&&_UC.tables.PRESS_TO_MPA)||{GPa:1e3,MPa:1,psi:6.89475729316836e-3};
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
  let _bellFs=null,_bellSPk=0,_bellFPk=0,_bellH0=0,_bellT=0,_bellDe=0,_bellDi=0;
  const C=D/d;
  if(type==='belleville'){
    const De=v('sp-de')||D,Di=v('sp-di')||De*0.51,t=v('sp-t')||d,h0=v('sp-h0')||fl||(d*1.5);
    const E=210000,nu=0.3;
    const a=De/2,b=Di/2,M=6/Math.PI*Math.pow(a/b-1,2)/Math.log(a/b)/Math.pow(a/b,2);
    const CAL=4*E/((1-nu*nu)*M*De*De);
    const Fs=s=>CAL*t*t*t*s*((h0-s)*(h0-s/2)/(t*t)+1);
    const ratio=h0/t;
    const F_at_h0=Fs(h0);
    k=CAL*t*t*t*(h0*h0/(t*t)+1);
    let sPk=h0,FPk=F_at_h0,prevF=0;
    for(let i=1;i<=400;i++){const s2=h0*i/400,f2=Fs(s2);if(f2<prevF){sPk=h0*(i-1)/400;FPk=prevF;break;}prevF=f2;}
    const dAt=Ff=>{if(!(Ff>0))return 0;if(Ff>=FPk)return sPk;let lo=0,hi=sPk;for(let i=0;i<80;i++){const m2=(lo+hi)/2;Fs(m2)<Ff?lo=m2:hi=m2;}return(lo+hi)/2;};
    delta=dAt(F);Lsolid=t;Fmax=FPk;
    _bellFs=Fs;_bellSPk=sPk;_bellFPk=FPk;_bellH0=h0;_bellT=t;_bellDe=De;_bellDi=Di;window.__bellDAt=dAt;
    items.push(['Type','Belleville (Almen-Laszlo)']);
    items.push(['D_e / D_i',De.toFixed(1)+' / '+Di.toFixed(1)+' mm']);
    items.push(['h_0 / t',h0.toFixed(2)+' / '+t.toFixed(2)+' mm (ratio '+ratio.toFixed(2)+')']);
    items.push(['k_0 initial rate',k.toFixed(1)+' N/mm']);
    items.push(['F at flat (s=h_0)',Math.round(F_at_h0)+' N']);
    items.push(['F usable peak',Math.round(FPk)+' N (s='+sPk.toFixed(2)+' mm)']);
    items.push(['δ at applied F',delta.toFixed(3)+' mm',F<=FPk?'ok':'err']);
    if(F>FPk)items.push(['Overload','F exceeds peak — disc goes flat','err']);
    items.push(['Behavior',ratio<0.4?'~Linear':ratio<1.42?'Progressive-degressive':ratio<2.83?'Plateau (near-constant force)':'Snap-through (bistable)']);
    extra='Almen-Laszlo load-deflection, E=210 GPa, ν=0.3 (DIN 2092 basis). Work discs at 15–75% of h_0. Build stacks below: series-alternating discs add deflection (k/n_s), parallel-nested discs add force (k·n_p, plus ~2–3% friction per contact surface).';
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
  }else if(type==='conical'){
    const D2=D,D1=Math.min(v('sp-cd1')||D2*0.5,D2);
    k=G*Math.pow(d,4)/(2*na*(D1+D2)*(D1*D1+D2*D2));
    delta=F/k;
    const C2=D2/d,Kw2=(4*C2-1)/(4*C2-4)+0.615/C2;
    const tau=Kw2*8*F*D2/(Math.PI*Math.pow(d,3));
    const tau_allow=0.45*Sy;Fmax=tau_allow*Math.PI*Math.pow(d,3)/(Kw2*8*D2);
    const nest=(D2-D1)/(2*na)>d;
    Lsolid=nest?2*d:(na+2)*d;
    const gap=fl>0?Math.max(0,(fl-(na+2)*d)/na):0;
    const Fg1=gap>0?gap*G*Math.pow(d,4)/(8*Math.pow(D2,3)):0;
    items.push(['Type','CONICAL (SMI constant-pitch)']);
    items.push(['D₁ → D₂',D1.toFixed(1)+' → '+D2.toFixed(1)+' mm']);
    items.push(['k initial rate',k.toFixed(2)+' N/mm']);
    items.push(['δ at applied F',delta.toFixed(2)+' mm',Fg1&&F>Fg1?'warn':'ok']);
    Fg1&&items.push(['Linear up to','≈ '+Math.round(Fg1)+' N (largest coil grounds)',F>Fg1?'warn':'ok']);
    items.push(['τ at largest coil',tau.toFixed(0)+' MPa',tau<tau_allow?'ok':'err']);
    items.push(['F_max safe',Math.round(Fmax)+' N']);
    items.push(['Nesting',nest?'TELESCOPING — solid ≈ '+(2*d).toFixed(1)+' mm':'Non-nesting — solid '+((na+2)*d).toFixed(1)+' mm']);
    extra='k = G·d⁴/[2·N_a·(D₁+D₂)(D₁²+D₂²)] — SMI constant-pitch conical rate; set D₁ = COIL Ø to recover the plain helical formula. Stress governs at the LARGEST coil. Past the linear range the largest coils ground out one by one and the rate rises — that progressive stiffening is why you buy conical. Coils telescope (solid ≈ two wire diameters) when (D₂−D₁)/2N_a > d.';
  }else if(type==='wave'){
    const E=200000,b=v('sp-wb')||10,tw=v('sp-wt')||0.5,Nw=v('sp-wnw')||3.5,Nt2=v('sp-wnt')||nt||4,Dm=D,Kf=3.88;
    k=E*b*Math.pow(tw,3)*Math.pow(Nw,4)/(Kf*Math.pow(Dm,3)*Nt2);
    delta=F/k;Lsolid=Nt2*tw;
    const sig=3*Math.PI*F*Dm/(4*b*tw*tw*Nw*Nw);
    const sig_allow=0.75*(Sy||1200);
    Fmax=sig_allow*4*b*tw*tw*Nw*Nw/(3*Math.PI*Dm);
    items.push(['Type','WAVE — crest-to-crest (Smalley form)']);
    items.push(['b × t / N_w / N_t',b+' × '+tw+' mm / '+Nw+' / '+Nt2]);
    items.push(['k spring rate',k.toFixed(2)+' N/mm']);
    items.push(['δ at applied F',delta.toFixed(2)+' mm']);
    items.push(['σ bending',sig.toFixed(0)+' MPa',sig<sig_allow?'ok':'err']);
    items.push(['F_max (σ ≤ 0.75·Sy)',Math.round(Fmax)+' N']);
    items.push(['L_solid',Lsolid.toFixed(2)+' mm']);
    extra='Smalley design-manual forms: f = P·K·D_m³·N_t/(E·b·t³·N_w⁴) with K = 3.88 (multi-wave), σ = 3π·P·D_m/(4·b·t²·N_w²), E = 200 GPa steel strip. The COIL Ø field is the mean diameter D_m; wire Ø and G are unused for wave. Wave springs buy roughly half the axial space of an equal-force coil — verify work height against the vendor load curve.';
  }else if(type==='torsion'){
    const E=200000;
    k=E*Math.pow(d,4)/(64*D*na);
    delta=F/k*180/Math.PI;Lsolid=nt*d;
    const sigma=32*F*D/(Math.PI*Math.pow(d,3));
    items.push(['Type','TORSION (Shigley)']);
    items.push(['Index C',C.toFixed(2)]);
    items.push(['k angular',k.toFixed(2)+' N·mm/rad']);
    items.push(['Angle at applied moment',delta.toFixed(2)+' °']);
    items.push(['σ bending',sigma.toFixed(0)+' MPa',sigma<Sy*0.78?'ok':'err']);
    extra='Torsion springs use bending stress, not shear. F input acts as moment in N·mm. K_b correction omitted (typical static design).';
  }
  _mr(out,'<h3>SPRING RESULTS — '+type.toUpperCase()+'</h3>'+
    '<div class="result-grid">'+items.map(i=>`<div class="result-item"><div class="lbl">${i[0]}</div><div class="val ${i[2]||''}">${i[1]}</div></div>`).join('')+'</div>'+
    '<p class="note" style="margin-top:.5rem;color:var(--dim);font-size:.72rem">'+extra+'</p>');
  const arr=sv('sp-stack-arr')||'single';
  let ns=Math.max(1,Math.round(v('sp-ns'))||1),np=Math.max(1,Math.round(v('sp-np'))||1);
  arr==='single'?(ns=1,np=1):arr==='series'?(np=1):arr==='parallel'&&(ns=1);
  const bell=type==='belleville';
  const k_eq=k*np/ns;
  const dSt=bell&&window.__bellDAt?ns*window.__bellDAt(F/np):F/k_eq;
  const L0st=bell?ns*(_bellH0+np*_bellT):(ns>1?ns*fl:fl);
  const solidSt=bell?ns*np*_bellT:ns*Lsolid;
  const capSt=np*Fmax;
  const so=$('sp-stack-out');
  if(so)_mr(so,`<strong>${arr==='single'?'SINGLE UNIT':ns+' IN SERIES × '+np+' IN PARALLEL'}</strong> &mdash; k_eq <strong>${k_eq.toFixed(2)} N/mm</strong> · δ_stack at F <strong>${dSt.toFixed(3)} mm</strong> · free ${bell?'stack height L_0':'length'} <strong>${L0st.toFixed(1)} mm</strong> · solid <strong>${solidSt.toFixed(1)} mm</strong> · capacity <strong>${Math.round(capSt)} N</strong>${bell&&np>1?' · parallel nesting adds ~2–3% friction per surface':''}`);
  const stacked=ns*np>1,colStack='#3b82f6';
  let traces,shapes,xTop,yTop;
  if(bell&&_bellFs){
    const npts=90,xs1=[],ys1=[],xsS=[],ysS=[];
    for(let i=0;i<=npts;i++){const s2=_bellSPk*i/npts;xs1.push(s2);ys1.push(_bellFs(s2));xsS.push(s2*ns);ysS.push(_bellFs(s2)*np);}
    xTop=_bellSPk*ns;yTop=_bellFPk*np;
    traces=[{x:xs1,y:ys1,mode:'lines',line:{color:pTheme().accent,width:2.5},name:'Single disc'}];
    stacked&&traces.push({x:xsS,y:ysS,mode:'lines',line:{color:colStack,width:2,dash:'dash'},name:ns+'S×'+np+'P stack'});
    shapes=[{type:'rect',x0:0.15*_bellH0*ns,x1:Math.min(0.75*_bellH0,_bellSPk)*ns,y0:0,y1:yTop,fillcolor:'rgba(34,197,94,0.12)',line:{width:0}}];
    isFinite(dSt)&&dSt>0&&traces.push({x:[dSt],y:[F],mode:'markers',marker:{color:'#fff',size:11,symbol:'diamond',line:{color:'#000',width:1.5}},name:'Operating point'});
  }else{
    const Lavail=fl-Lsolid,xMax=Lavail>0?Lavail:fl*0.8,xMaxStack=xMax*ns;
    xTop=Math.max(xMax,xMaxStack);
    const npts=80,xs=Array.from({length:npts},(_,i)=>i*xTop/(npts-1));
    traces=[{x:xs,y:xs.map(x=>x<=xMax?k*x:null),mode:'lines',line:{color:pTheme().accent,width:2.5},name:'Single (k='+k.toFixed(1)+' N/mm)'}];
    stacked&&traces.push({x:xs,y:xs.map(x=>x<=xMaxStack?k_eq*x:null),mode:'lines',line:{color:colStack,width:2,dash:'dash'},name:ns+'S×'+np+'P (k_eq='+k_eq.toFixed(1)+' N/mm)'});
    yTop=Math.max(k*xMax,k_eq*xMaxStack);
    shapes=[{type:'rect',x0:xMax*0.15,x1:xMax*0.80,y0:0,y1:yTop,fillcolor:'rgba(34,197,94,0.12)',line:{width:0}},{type:'line',x0:xMax,x1:xMax,y0:0,y1:yTop*1.05,line:{color:'#ef4444',width:1.5,dash:'dash'}}];
    isFinite(dSt)&&dSt>0&&traces.push({x:[dSt],y:[F],mode:'markers',marker:{color:'#fff',size:11,symbol:'diamond',line:{color:'#000',width:1.5}},name:'Operating point'});
  }
  plot('p-spring-fd',traces,{xaxis:{title:'δ deflection (mm)',range:[0,xTop*1.05]},yaxis:{title:'F force (N)',range:[0,yTop*1.1]},shapes,showlegend:stacked,legend:{x:0.02,y:0.98,bgcolor:'rgba(0,0,0,0)',font:{size:9}}});
  bell?drawSpringAnim(_bellT,_bellDe,1,_bellH0+_bellT,Math.max(_bellT,_bellH0+_bellT-delta),type):fl>0&&drawSpringAnim(d,D,nt,fl,Math.max(0.1,fl-delta),type);
  drawSpringPack(type,arr,ns,np,{d:d,D:D,fl:fl,nt:nt,delta:delta,De:_bellDe,Di:_bellDi,t:_bellT,h0:_bellH0});
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
      const turns=Math.min(60,Math.max(3,Math.floor(nt)));
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
function drawBellDisc(x,cx,y,ro,ri,h,t,up,th){
  const L1=up?[[cx-ro,y+h],[cx-ri,y],[cx-ri,y+t],[cx-ro,y+h+t]]:[[cx-ro,y],[cx-ri,y+h],[cx-ri,y+h+t],[cx-ro,y+t]];
  const R1=L1.map(p=>[2*cx-p[0],p[1]]);
  [L1,R1].forEach(q=>{x.beginPath();x.moveTo(q[0][0],q[0][1]);q.slice(1).forEach(p=>x.lineTo(p[0],p[1]));x.closePath();x.fillStyle=(/^#[0-9a-f]{6}$/i.test(th.accent)?th.accent+'38':'rgba(255,153,102,0.25)');x.fill();x.strokeStyle=th.accent||'#f96';x.lineWidth=1.5;x.stroke();});
}
function drawCoilMini(x,cx,yTop,w,h,turns,th){
  x.strokeStyle=th.accent||'#f96';x.lineWidth=2;x.beginPath();
  const n=turns*14;
  for(let i=0;i<=n;i++){const t2=i/n,yy=yTop+t2*h,xo=Math.sin(t2*turns*Math.PI*2)*w/2;i===0?x.moveTo(cx+xo,yy):x.lineTo(cx+xo,yy);}
  x.stroke();
  x.strokeStyle=th.dim;x.lineWidth=1.5;
  x.beginPath();x.moveTo(cx-w/2-6,yTop);x.lineTo(cx+w/2+6,yTop);x.moveTo(cx-w/2-6,yTop+h);x.lineTo(cx+w/2+6,yTop+h);x.stroke();
}
function drawSpringPack(type,arr,ns,np,g){
  const c=$('c-spring-pack');if(!c)return;
  const x=c.getContext('2d'),W=c.width,H=c.height,th=pTheme();
  x.fillStyle=th.plot;x.fillRect(0,0,W,H);
  x.font='11px JetBrains Mono,monospace';x.textAlign='left';x.textBaseline='alphabetic';
  x.fillStyle=th.text;
  x.fillText((arr==='single'?'SINGLE':'STACK '+ns+'S × '+np+'P')+' — '+type.toUpperCase(),10,16);
  if(type==='belleville'){
    const h0=g.h0>0?g.h0:1,t=g.t>0?g.t:1,De=g.De>0?g.De:30,Di=g.Di>0?g.Di:De*0.51;
    const unitH=h0+np*t,total=ns*unitH;
    const sc=Math.min((H-70)/total,(W*0.55)/De);
    const cx=W*0.40,y0=(H-46-total*sc)/2+30;
    x.strokeStyle=th.dim;x.setLineDash([4,4]);x.beginPath();x.moveTo(cx,y0-12);x.lineTo(cx,y0+total*sc+12);x.stroke();x.setLineDash([]);
    let y=y0;
    for(let i=0;i<ns;i++){
      const up=arr==='parallel'||i%2===0;
      for(let j=0;j<np;j++){drawBellDisc(x,cx,y+j*t*sc,De*sc/2,Di*sc/2,h0*sc,t*sc,up,th);}
      y+=unitH*sc;
    }
    x.strokeStyle=th.accent||'#f96';x.fillStyle=th.text;x.lineWidth=1;
    const xr=cx+De*sc/2+16;
    x.beginPath();x.moveTo(xr,y0);x.lineTo(xr,y0+total*sc);x.stroke();
    x.beginPath();x.moveTo(xr-4,y0+5);x.lineTo(xr,y0);x.lineTo(xr+4,y0+5);x.moveTo(xr-4,y0+total*sc-5);x.lineTo(xr,y0+total*sc);x.lineTo(xr+4,y0+total*sc-5);x.stroke();
    x.fillText('L0 = '+total.toFixed(1)+' mm',Math.min(xr+8,W-110),y0+total*sc/2);
    x.fillStyle=th.dim;
    x.fillText(arr==='parallel'?np+' discs nested — same orientation (force adds)':ns>1?'alternating ⟨⟩ orientation (deflection adds)'+(np>1?' · '+np+' nested per group':''):np>1?np+' discs nested (parallel)':'single disc',10,H-10);
  }else{
    const cols=Math.min(np,6),rows=Math.min(ns,8);
    const cellW=Math.min(100,(W-80)/cols),cellH=(H-70)/rows;
    const x0=(W-cols*cellW)/2,y0=30;
    for(let r2=0;r2<rows;r2++)for(let c2=0;c2<cols;c2++){drawCoilMini(x,x0+c2*cellW+cellW/2,y0+r2*cellH+5,Math.min(cellW*0.55,60),cellH-14,Math.min(8,Math.max(3,Math.floor(g.nt||6))),th);}
    x.fillStyle=th.dim;
    x.fillText((rows>1?rows+' end-to-end (series — seat plates between)':'')+(rows>1&&cols>1?' · ':'')+(cols>1?cols+' side-by-side (parallel)':rows>1?'':'single spring'),10,H-10);
    if(np>6||ns>8){x.fillText('(showing '+rows+'×'+cols+' of '+ns+'×'+np+')',W-170,16);}
  }
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
  const br=$('sp-bell-row');if(br)br.style.display=type==='belleville'?'':'none';
  const cr=$('sp-con-row');if(cr)cr.style.display=type==='conical'?'':'none';
  const wr=$('sp-wave-row');if(wr)wr.style.display=type==='wave'?'':'none';
  const hideMap={belleville:['sp-d','sp-D','sp-na','sp-nt','sp-fl'],wave:['sp-d','sp-g','sp-na','sp-nt','sp-fl']};
  ['sp-d','sp-D','sp-na','sp-nt','sp-fl','sp-g'].forEach(id=>{const el=$(id),f=el&&el.closest('.field');if(f)f.style.display=(hideMap[type]||[]).indexOf(id)>=0?'none':'';});
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
  /* Shock response spectrum: maximax absolute-acceleration response of a
   * zeta=0.05 SDOF oscillator, integrated numerically (RK4) through the pulse;
   * residual peak taken analytically from the end state. */
  const zeta=0.05;
  const baseA=tt=>a_peak*(shape==='half-sine'?Math.sin(Math.PI*tt/tau):shape==='sawtooth'?tt/tau:shape==='rectangular'?1:0.5*(1-Math.cos(2*Math.PI*tt/tau)));
  const srsAt=f=>{
    const wn=2*Math.PI*f,n=Math.min(20000,Math.max(600,Math.ceil(40*f*tau))),dt=tau/n,der=(z,zd,ab)=>[zd,-2*zeta*wn*zd-wn*wn*z-ab];
    let z=0,zd=0,amax=0;
    for(let s=0;s<n;s++){
      const t0=s*dt,ab0=baseA(t0),abm=baseA(t0+dt/2),ab1=baseA(t0+dt);
      const k1=der(z,zd,ab0),k2=der(z+dt/2*k1[0],zd+dt/2*k1[1],abm),k3=der(z+dt/2*k2[0],zd+dt/2*k2[1],abm),k4=der(z+dt*k3[0],zd+dt*k3[1],ab1);
      z+=dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);zd+=dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);
      const aabs=Math.abs(2*zeta*wn*zd+wn*wn*z);
      aabs>amax&&(amax=aabs);
    }
    return Math.max(amax,wn*wn*Math.hypot(z,zd/wn))/9.81;
  };
  const fns=[];const Qs=[];
  for(let i=0;i<60;i++){const f=Math.pow(10,Math.log10(0.1)+i*4/59);fns.push(f);Qs.push(srsAt(f));}
  const a_response=srsAt(fn);
  const t=pTheme();
  plot('p-shock',[
    {x:fns,y:Qs,mode:'lines',line:{color:t.accent,width:2.5},name:'SRS'},
    {x:[fn],y:[a_response],mode:'markers+text',marker:{color:'#fff',size:11,symbol:'diamond',line:{color:'#000',width:1.5}},text:[fn+' Hz: '+a_response.toFixed(1)+' G'],textposition:'top right',textfont:{color:t.text,size:10}}
  ],{xaxis:{title:'System f_n (Hz)',type:'log'},yaxis:{title:'Peak response (G)'},showlegend:false});
  const out=$('shock-out');if(out){
    const pulse_label={'half-sine':'half-sine','sawtooth':'sawtooth (terminal-peak)','rectangular':'rectangular (square)','haversine':'haversine'}[shape];
    out.innerHTML='<div class="result-grid">'+
      [['Peak accel',G+' G ('+a_peak.toFixed(0)+' m/s²)'],['Pulse '+pulse_label,(tau*1000).toFixed(1)+' ms'],['ΔV (impulse)',(dV*1000).toFixed(1)+' mm/s ('+dV.toFixed(3)+' m/s)'],['Response @ '+fn+' Hz',a_response.toFixed(2)+' G ('+(a_response*9.81).toFixed(0)+' m/s²)'],['Amplification',(a_response/G).toFixed(2)+'×']].map(([l,v])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val">${v}</div></div>`).join('')+
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
  const awgs=['14','12','10','8','6','4','3','2','1','1/0','2/0','3/0','4/0','250','300','350','400','500','600','750','1000'];
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
  setCardOut('xfmr-card','<div class="result-grid">'+
    [['Primary FLA',FLA_p.toFixed(1)+' A'],['Secondary FLA',FLA_s.toFixed(1)+' A'],['Turns ratio',turnsRatio.toFixed(2)+':1'],['SCC (sec, 3-cyc)',SCC_s.toFixed(0)+' A',SCC_s>10000?'warn':'ok'],['Z per-unit',Z_per_unit.toFixed(4)],['I²t (~6-cyc, 0.1s)',I2t_thermal.toExponential(2)+' A²·s']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>NEC 240.21 secondary tap rules:</strong> 10-ft tap allows downstream OCPD if conductors ≥ 1/10 of primary OCPD rating; 25-ft tap requires conductors ≥ 1/3 of primary rating. <strong>Short-circuit:</strong> SCC = FLA / (Z/100) — coordinate with branch breaker AIC rating. <strong>Inrush:</strong> typical 8-12× FLA for first cycle, decay over 0.1 s. Use NEMA TP 1 efficiencies for sizing-vs-loss tradeoff.</p>');
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
      [['S apparent',S.toFixed(0)+' VA'],['P real',P.toFixed(0)+' W'],['Q reactive',Q.toFixed(0)+' VAR'],['PF',PF.toFixed(3)],['φ (angle)',angle.toFixed(1)+'°'],['Type',phaseLabel]].map(([l,v])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val">${v}</div></div>`).join('')+
      '</div>';
  }
  /* Also write to electrical-results in standard form so other callers see it */
  const er=$('electrical-results');if(er)er.innerHTML='<h3>AC POWER</h3>'+(out?out.innerHTML:'');
  typeof window.drawPowerTri==='function'&&window.drawPowerTri(P,Q,S);
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
      [['Design',dKey],['T_FL (full load)',Tfl.toFixed(2)+' N·m'],['T_LR (locked rotor)',(Tfl*d.LRT).toFixed(1)+' N·m ('+(d.LRT*100).toFixed(0)+'% FL)'],['T_BD (breakdown)',(Tfl*d.BDT).toFixed(1)+' N·m ('+(d.BDT*100).toFixed(0)+'%)'],['I_LR / I_FL',(d.LRC).toFixed(1)+'×'],['Rated slip',(d.slip*100).toFixed(1)+'%']].map(([l,v])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val">${v}</div></div>`).join('')+
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
  setCardOut('mt-frame-card','<div class="result-grid">'+
    [['Required HP',pick+' HP'],['NEMA frame',finalFrame||'—'],['Speed class',rpm+' rpm sync ('+(rpm===3600?'2-pole':rpm===1800?'4-pole':rpm===1200?'6-pole':'8-pole')+')'],['Enclosure',enc]].map(([l,v])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val">${v}</div></div>`).join('')+
    '</div>'+
    '<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">NEMA MG-1 standard frames. T-frame (1964+) replaces older U-frame. TEFC frames typically one size up from ODP for same HP. Shaft and bolt patterns are interchangeable within frame number for OEM swap-out.</p>');
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
      [['Operating Q',Qop.toFixed(1)+' m³/h'],['Operating H',Hop.toFixed(1)+' m'],['Off-BEP %',offBep.toFixed(1)+'%',opStatus],['Efficiency',(effOp*100).toFixed(1)+'%'],['Brake power',Pbrake.toFixed(2)+' kW'],['NPSHr (BEP)',model.NPSHr.toFixed(1)+' m']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
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
  setCardOut('pv-head-card','<div class="result-grid">'+
    [['t_required',t.toFixed(3)+' mm'],['t_total (with C.A.)',tTotal.toFixed(3)+' mm'],['Head type',type==='hemi'?'Hemispherical':type==='ellip'?'Ellipsoidal 2:1':type==='tori'?'Torispherical F&D':'Flat']].map(([l,v])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>Formula:</strong> '+formula+'. <strong>Selection:</strong> Hemi gives thinnest head but tallest profile and most expensive. Ellipsoidal 2:1 is standard process choice. Torispherical (F&D) uses flat-bottom forming, common low-pressure storage. Add corrosion allowance per service. Verify spot-radiography per UW-12 for E (1.0 full RT, 0.85 spot, 0.70 none).</p>');
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
  setCardOut('pv-nozzle-card','<div class="result-grid">'+
    [['Opening d',d.toFixed(1)+' mm'],['A required',A_req.toFixed(1)+' mm²'],['A from shell',A1.toFixed(1)+' mm²'],['A from nozzle',A2.toFixed(1)+' mm²'],['A total available',A_avail.toFixed(1)+' mm²',A_avail>=A_req?'ok':'err'],['Pad needed?',pad_needed?'YES':'NO',pad_needed?'warn':'ok'],['Pad t (min)',pad_needed?pad_t.toFixed(1)+' mm':'—']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem">UG-37 area-replacement rule: cross-sectional area removed from shell by the opening (A_req = d·t_r) must be replaced by metal within the reinforcement zone. Available metal = excess shell thickness × d + nozzle wall × 2.5·t_n on each side. If short, add a reinforcement pad. Pad diameter typically d_pad = 2·d for full credit.</p>');
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
  setCardOut('pv-lug-card','<div class="result-grid">'+
    [['F per lug (1g)',F_per.toFixed(0)+' N'],['F design (×'+factor+')',F_design.toFixed(0)+' N'],['σ bearing',sigma_bear.toFixed(1)+' MPa',sigma_bear<S?'ok':'err'],['τ tear-out',tau_tear.toFixed(1)+' MPa',tau_tear<0.6*S?'ok':'err'],['σ tensile (net sec)',sigma_tens.toFixed(1)+' MPa',sigma_tens<S?'ok':'err'],['Allowable',S+' MPa']].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>ASME B30.20 / OSHA:</strong> Design factor 2× for fixed lugs, 5× for slings. Bearing stress on pin: F/(d·t). Tear-out (double shear): F/(2·a·t) where a = edge distance. Tensile through net section: F/((w-d)·t). All < S_allow. Welded lug to shell: check fillet weld + base metal HAZ separately.</p>');
};

/* ============================================================
 * BOLTS — advanced pattern/torque sequence card
 * (multi-pass schedule, K-factor scatter, joint diagram, gasket relax)
 * ============================================================ */
function injectBoltTorqueAdvanced(){
  const view=$('v-bolts');if(!view)return;
  if($('bolt-torque-adv'))return;
  const target=view.querySelector('.split>div:last-child')||(view.querySelector('.bolt-x')?view.querySelector('.bolt-x').parentElement:null);
  if(!target)return;
  const card=document.createElement('div');card.className='card bolt-x';card.id='bolt-torque-adv';card.style.marginTop='.6rem';
  card.innerHTML='<h3>TORQUE SEQUENCE (ADVANCED)</h3>'+
    '<p style="font-size:.7rem;color:var(--dim);margin:0 0 .6rem">F_i, d, pitch, K, C and F_ext are auto-filled from the JOINT RESULTS above — change the bolt/grade/load there and these follow. Tune scatter, passes, ratios &amp; relaxation here.</p>'+
    '<div class="row">'+
      '<div class="field"><label for="bts-method">METHOD</label><select id="bts-method" onchange="calcBoltTorqueSeq()"><option value="torque">TORQUE CONTROL (T = K·F·d)</option><option value="angle">TORQUE + ANGLE (snug + Δθ)</option><option value="yield">YIELD-CONTROL (joint analyzer)</option></select></div>'+
      '<div class="field"><label for="bts-fi">TARGET PRELOAD F_i (N)</label><input type="number" id="bts-fi" value="50000" step="any"></div>'+
      '<div class="field"><label for="bts-d">BOLT d (mm)</label><input type="number" id="bts-d" value="12" step="0.1"></div>'+
    '</div>'+
    '<div class="row" style="margin-top:.5rem">'+
      '<div class="field"><label for="bts-kn">K-FACTOR (NOM)</label><input type="number" id="bts-kn" value="0.20" step="0.01"></div>'+
      '<div class="field"><label for="bts-ks">K-SCATTER ±</label><input type="number" id="bts-ks" value="0.05" step="0.01"></div>'+
      '<div class="field"><label for="bts-passes">PASSES</label><input type="number" id="bts-passes" value="3" min="1" max="6" step="1"></div>'+
      '<div class="field"><label for="bts-ratios">RATIOS (csv %)</label><input type="text" id="bts-ratios" value="30,60,100"></div>'+
    '</div>'+
    '<div class="row" style="margin-top:.5rem">'+
      '<div class="field"><label for="bts-relax">GASKET RELAX %</label><input type="number" id="bts-relax" value="10" step="1"></div>'+
      '<div class="field"><label for="bts-c">JOINT C (k_b/(k_b+k_m))</label><input type="number" id="bts-c" value="0.25" step="0.05"></div>'+
      '<div class="field"><label for="bts-fext">EXT LOAD F_ext (N / bolt)</label><input type="number" id="bts-fext" value="20000" step="any"></div>'+
    '</div>'+
    '<div class="row" style="margin-top:.5rem">'+
      '<div class="field"><label for="bts-pitch">THREAD PITCH p (mm)</label><input type="number" id="bts-pitch" value="1.75" step="0.05"></div>'+
      '<div class="field"><label for="bts-grip">GRIP LENGTH (mm)</label><input type="number" id="bts-grip" value="40" step="1"></div>'+
    '</div>'+
    '<button class="btn btn-sm" onclick="calcBoltTorqueSeq()" style="margin-top:.5rem">COMPUTE SEQUENCE</button>'+
    '<div id="bts-table" style="margin-top:.6rem"></div>'+
    '<div id="p-bts-joint" style="width:100%;height:280px;margin-top:.4rem"></div>';
  target.appendChild(card);
  if(typeof window.calcBolt==='function')try{window.calcBolt();}catch(e){}
  else if(typeof window.calcBoltTorqueSeq==='function')try{window.calcBoltTorqueSeq();}catch(e){}
}
window.calcBoltTorqueSeq=function(){
  const method=sv('bts-method')||'torque';
  const Fi=v('bts-fi'),d=v('bts-d'),Kn=v('bts-kn'),Ks=v('bts-ks');
  const passes=Math.max(1,Math.min(6,Math.round(v('bts-passes'))||3));
  const ratStr=sv('bts-ratios')||'30,60,100';
  const C=v('bts-c'),Fext=v('bts-fext'),relax=v('bts-relax')/100||0;
  if(!isFinite(Fi)||!isFinite(d)||!isFinite(Kn))return;
  let ratios=ratStr.split(',').map(s=>parseFloat(s.trim())).filter(x=>isFinite(x)&&x>0);
  if(ratios.length<passes)while(ratios.length<passes)ratios.push(100);
  ratios=ratios.slice(0,passes);if(ratios[ratios.length-1]<100)ratios[ratios.length-1]=100;
  const T_target=Kn*Fi*d/1000;
  const T_lo=(Kn-Ks)*Fi*d/1000,T_hi=(Kn+Ks)*Fi*d/1000;
  const F_lo=Fi*(Kn/(Kn+Ks)),F_hi=Fi*(Kn/(Math.max(0.05,Kn-Ks)));
  const pitch=Math.max(0.25,v('bts-pitch')||1.75),grip=Math.max(5,v('bts-grip')||40);
  const As=Math.PI/4*Math.pow(Math.max(1,d-0.9382*pitch),2);
  const kb=205000*As/grip;
  const degPerN=360/(pitch*kb*Math.max(0.05,1-C));
  const angleMode=method==='angle';
  const rows=[];rows.push('<tr><th>PASS</th><th>%</th><th>T_target (N·m)</th><th>F_preload (N)</th>'+(angleMode?'<th>Δθ FROM PREV</th>':'')+'<th>NOTE</th></tr>');
  ratios.forEach((r,i)=>{const T=T_target*r/100,F=Fi*r/100;const Fprev=i===0?0:Fi*ratios[i-1]/100;const dTheta=(F-Fprev)*degPerN;const note=i===passes-1?(relax>0?`final pass — re-torque after ${(relax*100).toFixed(0)}% relax`:'final pass'):(i===0?'snug-and-mark':'cross/star, equalize gap');const angCell=angleMode?(i===0?`<td>snug @ ${T.toFixed(1)} N·m</td>`:`<td><b>+${dTheta.toFixed(0)}°</b></td>`):'';rows.push(`<tr><td>${i+1}</td><td>${r.toFixed(0)}%</td><td>${angleMode&&i>0?'(angle-driven)':T.toFixed(2)}</td><td>${F.toFixed(0)}</td>${angCell}<td>${note}</td></tr>`);});
  if(relax>0)rows.push(`<tr><td>RT</td><td>100%</td><td>${angleMode?'re-snug + re-angle':T_target.toFixed(2)}</td><td>${Fi.toFixed(0)}</td>${angleMode?`<td>+${(Fi*relax*degPerN).toFixed(0)}°</td>`:''}<td>re-torque after gasket relaxation</td></tr>`);
  const F_b=Fi+C*Fext,F_j=Fi-(1-C)*Fext;
  const sepMargin=Fi/((1-C)*Math.max(1,Fext));
  const fmt=(n,p)=>isFinite(n)?(p>0?n.toFixed(p):n.toFixed(0)):'—';
  let summary='<table class="data" style="font-size:.74rem;width:100%;margin-top:.3rem"><thead>'+rows[0]+'</thead><tbody>'+rows.slice(1).join('')+'</tbody></table>';
  const snugF=Fi*ratios[0]/100;
  const totalTheta=(Fi-snugF)*degPerN;
  summary+='<div class="result-grid" style="margin-top:.5rem">'+
    [['Method',method.toUpperCase()],
     ...(angleMode?[['Snug torque (pass 1)',fmt(T_target*ratios[0]/100,2)+' N·m'],['θ total snug→100%',fmt(totalTheta,0)+'°'],['k_b bolt stiffness',fmt(kb/1000,0)+' kN/mm'],['Stretch at F_i',fmt(Fi/kb,3)+' mm']]:[]),
     ['T_target',fmt(T_target,2)+' N·m'],
     ['T range (K-scatter)',fmt(T_lo,2)+' – '+fmt(T_hi,2)+' N·m'],
     ['F_preload range',fmt(F_lo,0)+' – '+fmt(F_hi,0)+' N'],
     ['F_bolt @ ext load',fmt(F_b,0)+' N'],
     ['F_joint @ ext load',fmt(F_j,0)+' N',F_j>0?'ok':'err'],
     ['Separation margin',isFinite(sepMargin)?fmt(sepMargin,2)+'×':'∞',sepMargin>1.5?'ok':sepMargin>1?'warn':'err'],
     ['Joint stiffness ratio C',fmt(C,2)]].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+'</div>';
  summary+='<p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>Method notes:</strong> Torque control ±25% preload scatter typical. Torque + angle (e.g. snug then 90°) cuts scatter to ±10%. Yield-control (or ultrasonic) reaches ±5%. <strong>Sequence:</strong> star/cross pattern, opposite bolts in pairs, work outward for circular flanges. <strong>ASME PCC-1</strong> is the canonical assembly guideline. Re-torque after gasket relaxation typically 10–20% of original preload for compressed-fiber sheet, lower for spiral-wound, higher for soft sheet.</p>';
  $('bts-table').innerHTML=summary;
  /* Joint diagram: F_b and F_j vs F_ext */
  const xs=[];const ybolt=[];const yjoint=[];const Fmax=Math.max(Fext*2,Fi*1.2);
  for(let f=0;f<=Fmax;f+=Fmax/80){xs.push(f);ybolt.push(Fi+C*f);yjoint.push(Math.max(0,Fi-(1-C)*f));}
  if(window.Plotly){
    const tt=pTheme();
    plot('p-bts-joint',[
      {x:xs,y:ybolt,mode:'lines',line:{color:tt.accent,width:2.5},name:'F_bolt = F_i + C·F_ext'},
      {x:xs,y:yjoint,mode:'lines',line:{color:'#22c55e',width:2.5},name:'F_joint = F_i − (1−C)·F_ext'},
      {x:[Fext],y:[F_b],mode:'markers',marker:{color:'#f59e0b',size:11,symbol:'diamond'},name:'op'},
      {x:[Fext],y:[F_j],mode:'markers',marker:{color:'#ef4444',size:11,symbol:'diamond'},name:'op'},
      {x:[Fi/(1-C),Fi/(1-C)],y:[0,Fi*1.5],mode:'lines',line:{color:'#ef4444',dash:'dash',width:1.5},name:'separation'}
    ],{xaxis:{title:'F_ext (N)'},yaxis:{title:'Force (N)',range:[0,Fi*1.5]},showlegend:false});
  }
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
  const heat=tts>0?(amp*volt*0.06/tts):NaN;
  setCardOut('weld-rate-card','<div class="result-grid">'+
    [['Melt rate',meltRate.toFixed(3)+' kg/hr'],['Deposit rate',depRate.toFixed(3)+' kg/hr'],['Deposit rate',depRateLbHr.toFixed(2)+' lb/hr'],['Heat input',isFinite(heat)?heat.toFixed(2)+' kJ/mm':'—',heat>3.5?'warn':heat>1.5?'ok':'warn'],['Process',proc]].map(([l,v,c])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val ${c||''}">${v}</div></div>`).join('')+
    '</div><p class="note" style="margin-top:.4rem;color:var(--dim);font-size:.7rem"><strong>Heat input:</strong> H = (A·V·0.06)/v_travel kJ/mm. <strong>Limits:</strong> Carbon steel 0.8–3.5 kJ/mm; HSLA 0.8–2.5; Duplex 0.5–2.0 (over-heat embrittlement); aluminum 0.6–2.0. Below 0.8 kJ/mm risks lack of fusion; above max risks HAZ softening / grain growth. <strong>Deposition efficiency:</strong> SMAW 60-65%, GMAW 92-95% (short-arc) / 88% (spray), FCAW 78-85%, GTAW 100% (no spatter), SAW 95-100%.</p>');
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
  const N=Math.min(200,Math.max(6,Math.round(v('g3d-N')||24)));
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
  const geom=buildGearGeometry();if(!geom){cfToast('No gear geometry. Click REBUILD first.');return;}
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
 * FLUIDS — 2D CFD via Lattice Boltzmann (D2Q9) + drawable obstacle
 * ============================================================ */
function injectFluidsCFD(){
  const view=$('v-fluids');if(!view)return;
  const left=view.querySelector('.split>div:first-child');
  const right=view.querySelector('.split>div:last-child');
  if(!left||!right)return;
  if(!$('cfd-card')){
    const card=document.createElement('div');card.className='card';card.id='cfd-card';
    card.innerHTML='<h3>2D CFD (LATTICE BOLTZMANN)</h3>'+
      '<div class="row">'+
        '<div class="field"><label for="cfd-shape">OBSTACLE SHAPE</label><select id="cfd-shape"><option value="cylinder">CIRCULAR CYLINDER (Karman vortex)</option><option value="square">SQUARE</option><option value="airfoil">NACA-LIKE AIRFOIL</option><option value="cavity">EMPTY (lid-driven cavity)</option><option value="custom">CUSTOM (draw on canvas)</option></select></div>'+
        '<div class="field"><label for="cfd-u0">INLET U₀</label><input type="number" id="cfd-u0" value="0.10" step="0.01" min="0.01" max="0.20"></div>'+
        '<div class="field"><label for="cfd-Re">REYNOLDS Re (target)</label><input type="number" id="cfd-Re" value="100" step="10" min="10" max="1000"></div>'+
        '<div class="field"><label for="cfd-vis">VIZ</label><select id="cfd-vis"><option value="vmag">VELOCITY MAG</option><option value="vorticity">VORTICITY</option><option value="ux">U-x</option><option value="rho">DENSITY</option></select></div>'+
      '</div>'+
      '<div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">'+
        '<button class="btn btn-sm btn-fill" onclick="cfdStart()">▶ START</button>'+
        '<button class="btn btn-sm" onclick="cfdPause()">⏸ PAUSE</button>'+
        '<button class="btn btn-sm" onclick="cfdReset()">⟲ RESET</button>'+
      '</div>'+
      '<div id="cfd-stats" style="margin-top:.4rem;font-size:.75rem;color:var(--dim)">Click START. LBM steady-state takes a few seconds.</div>';
    left.appendChild(card);
  }
  if(!$('cfd-canvas-card')){
    const card=document.createElement('div');card.className='card';card.style.marginTop='.6rem';
    card.innerHTML='<h3>FLOW FIELD</h3>'+
      '<canvas id="cfd-canvas" width="400" height="120" style="width:100%;height:auto;background:#0a0a0a;border-radius:3px;display:block;cursor:crosshair;image-rendering:pixelated"></canvas>'+
      '<div id="cfd-legend" style="margin-top:.3rem;display:flex;align-items:center;gap:.4rem;font-size:.7rem;color:var(--dim)"><span>0</span><div id="cfd-legend-bar" style="flex:1;height:12px;border-radius:2px;background:linear-gradient(90deg,#000080,#0080ff,#00ffff,#80ff80,#ffff00,#ff8000,#ff0000)"></div><span id="cfd-legend-max">u_max</span></div>'+
      '<p class="note" style="margin-top:.3rem;color:var(--dim);font-size:.7rem">D2Q9 BGK lattice Boltzmann, ~400×120 lattice. Inlet: prescribed velocity. Outlet: extrapolation. Top/bottom: no-slip walls. For Karman vortex shedding pick CIRCULAR CYLINDER + Re &gt; 47. CUSTOM: click on canvas to add cells (left-click) or remove (right-click) to the obstacle mask while paused.</p>';
    right.appendChild(card);
  }
}
/* LBM solver state */
const CFD={
  W:400,H:120,running:false,raf:null,step:0,
  f:null,fNew:null,rho:null,ux:null,uy:null,solid:null,
  u0:0.10,tau:0.6,Re:100,
  e:[[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]],
  w:[4/9,1/9,1/9,1/9,1/9,1/36,1/36,1/36,1/36],
  opp:[0,3,4,1,2,7,8,5,6]
};
function cfdInit(){
  const W=CFD.W,H=CFD.H;
  const N=W*H;
  CFD.f=new Float32Array(N*9);CFD.fNew=new Float32Array(N*9);
  CFD.rho=new Float32Array(N);CFD.ux=new Float32Array(N);CFD.uy=new Float32Array(N);
  CFD.solid=new Uint8Array(N);
  /* Equilibrium init: rho=1, u=(u0,0) */
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const i=y*W+x;
      CFD.rho[i]=1.0;CFD.ux[i]=CFD.u0;CFD.uy[i]=0;
      for(let k=0;k<9;k++){
        const usq=CFD.u0*CFD.u0;
        const eu=CFD.e[k][0]*CFD.u0;
        const feq=CFD.w[k]*1.0*(1+3*eu+4.5*eu*eu-1.5*usq);
        CFD.f[i*9+k]=feq;
      }
    }
  }
  /* Wall solid mask: top/bottom rows */
  for(let x=0;x<W;x++){CFD.solid[0*W+x]=1;CFD.solid[(H-1)*W+x]=1;}
  /* Obstacle */
  cfdSetObstacle();
  CFD.step=0;
}
function cfdSetObstacle(){
  const W=CFD.W,H=CFD.H,shape=sv('cfd-shape')||'cylinder';
  /* Clear interior solids first (keep walls) */
  for(let y=1;y<H-1;y++){for(let x=0;x<W;x++)CFD.solid[y*W+x]=0;}
  if(shape==='cavity'){
    /* No obstacle. Lid-driven: top wall moves with U0 — handled in step */
    return;
  }
  if(shape==='cylinder'){
    const cx=W*0.25,cy=H/2,r=H*0.18;
    for(let y=1;y<H-1;y++)for(let x=0;x<W;x++){
      const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<r*r)CFD.solid[y*W+x]=1;
    }
  }else if(shape==='square'){
    const cx=W*0.25,cy=H/2,s=H*0.20;
    for(let y=1;y<H-1;y++)for(let x=0;x<W;x++){
      if(Math.abs(x-cx)<s&&Math.abs(y-cy)<s)CFD.solid[y*W+x]=1;
    }
  }else if(shape==='airfoil'){
    /* NACA-0012-ish: thickness 0.12·c, camber 0 */
    const cx=W*0.25,cy=H/2,chord=H*0.6,thick=H*0.07;
    for(let y=1;y<H-1;y++)for(let x=0;x<W;x++){
      const tt=(x-cx+chord/2)/chord;
      if(tt<0||tt>1)continue;
      const yt=thick*(0.2969*Math.sqrt(tt)-0.126*tt-0.3516*tt*tt+0.2843*tt*tt*tt-0.1015*tt*tt*tt*tt)/0.12;
      if(Math.abs(y-cy)<yt)CFD.solid[y*W+x]=1;
    }
  }
  /* Custom: keeps any cells the user has clicked on (handled in canvas listener) */
}
function cfdStep(){
  const W=CFD.W,H=CFD.H,e=CFD.e,w=CFD.w,opp=CFD.opp,tau=CFD.tau,u0=CFD.u0,solid=CFD.solid,f=CFD.f,fNew=CFD.fNew,rho=CFD.rho,ux=CFD.ux,uy=CFD.uy;
  const shape=sv('cfd-shape')||'cylinder';
  /* COLLISION: f' = f - (f - feq)/tau */
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const i=y*W+x;
      if(solid[i]){
        for(let k=0;k<9;k++)fNew[i*9+k]=f[i*9+opp[k]];
        continue;
      }
      let r=0,vx=0,vy=0;
      for(let k=0;k<9;k++){const fk=f[i*9+k];r+=fk;vx+=e[k][0]*fk;vy+=e[k][1]*fk;}
      vx/=r;vy/=r;rho[i]=r;ux[i]=vx;uy[i]=vy;
      const usq=vx*vx+vy*vy;
      for(let k=0;k<9;k++){
        const eu=e[k][0]*vx+e[k][1]*vy;
        const feq=w[k]*r*(1+3*eu+4.5*eu*eu-1.5*usq);
        fNew[i*9+k]=f[i*9+k]-(f[i*9+k]-feq)/tau;
      }
    }
  }
  /* STREAMING: f_i(x+e_i, t+1) = f'_i(x, t) */
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const i=y*W+x;
      for(let k=0;k<9;k++){
        const xn=x+e[k][0],yn=y+e[k][1];
        if(xn<0||xn>=W||yn<0||yn>=H)continue;
        f[(yn*W+xn)*9+k]=fNew[i*9+k];
      }
    }
  }
  /* INLET (left): prescribed velocity (Zou-He simplified) */
  if(shape!=='cavity'){
    for(let y=1;y<H-1;y++){
      const i=y*W+0;
      const r=1.0;
      for(let k=0;k<9;k++){
        const eu=e[k][0]*u0;
        f[i*9+k]=w[k]*r*(1+3*eu+4.5*eu*eu-1.5*u0*u0);
      }
      rho[i]=r;ux[i]=u0;uy[i]=0;
    }
    /* OUTLET (right): zero-gradient copy from x=W-2 */
    for(let y=1;y<H-1;y++){
      const i=y*W+(W-1),iIn=y*W+(W-2);
      for(let k=0;k<9;k++)f[i*9+k]=f[iIn*9+k];
    }
  }else{
    /* Lid-driven: top wall moves at u0 */
    for(let x=1;x<W-1;x++){
      const i=(H-2)*W+x;
      f[i*9+4]=f[i*9+2];f[i*9+7]=f[i*9+5]-u0/6;f[i*9+8]=f[i*9+6]+u0/6;
    }
  }
  CFD.step++;
}
const COLOR_MAP=[[0,0,128],[0,128,255],[0,255,255],[128,255,128],[255,255,0],[255,128,0],[255,0,0]];
function colorMapInterp(t){
  t=Math.max(0,Math.min(1,t));
  const seg=t*(COLOR_MAP.length-1),i=Math.floor(seg),f=seg-i;
  if(i>=COLOR_MAP.length-1)return COLOR_MAP[COLOR_MAP.length-1];
  const a=COLOR_MAP[i],b=COLOR_MAP[i+1];
  return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
}
function cfdRender(){
  const c=$('cfd-canvas');if(!c)return;
  const ctx=c.getContext('2d');
  if(c.width!==CFD.W||c.height!==CFD.H){c.width=CFD.W;c.height=CFD.H;}
  const img=ctx.createImageData(CFD.W,CFD.H);
  const W=CFD.W,H=CFD.H,vis=sv('cfd-vis')||'vmag';
  let vMax=0;
  const vals=new Float32Array(W*H);
  for(let i=0;i<W*H;i++){
    let v;
    if(vis==='vmag')v=Math.sqrt(CFD.ux[i]*CFD.ux[i]+CFD.uy[i]*CFD.uy[i]);
    else if(vis==='ux')v=CFD.ux[i];
    else if(vis==='rho')v=CFD.rho[i]-1;
    else if(vis==='vorticity'){
      const x=i%W,y=Math.floor(i/W);
      if(x<1||x>=W-1||y<1||y>=H-1)v=0;
      else v=(CFD.uy[(y)*W+(x+1)]-CFD.uy[(y)*W+(x-1)])/2-(CFD.ux[(y+1)*W+x]-CFD.ux[(y-1)*W+x])/2;
    }
    vals[i]=v;
    if(Math.abs(v)>vMax)vMax=Math.abs(v);
  }
  if(vMax<1e-6)vMax=1e-6;
  for(let i=0;i<W*H;i++){
    const j=i*4;
    if(CFD.solid[i]){img.data[j]=80;img.data[j+1]=80;img.data[j+2]=80;img.data[j+3]=255;continue;}
    const v=vals[i];
    let t;
    if(vis==='vorticity'||vis==='ux'||vis==='rho')t=0.5+v/(2*vMax);
    else t=v/vMax;
    const rgb=colorMapInterp(t);
    img.data[j]=rgb[0];img.data[j+1]=rgb[1];img.data[j+2]=rgb[2];img.data[j+3]=255;
  }
  ctx.putImageData(img,0,0);
  const legend=$('cfd-legend-max');if(legend){
    const unit=vis==='rho'?'Δρ':vis==='vorticity'?'ω':vis==='ux'?'u_x':'|u|';
    legend.textContent=unit+' = '+vMax.toFixed(4);
  }
  const stats=$('cfd-stats');if(stats){
    /* Compute a coarse Reynolds based on cylinder diameter */
    const u0_lat=CFD.u0,nu_lat=(CFD.tau-0.5)/3,L_lat=CFD.H*0.36;
    const Re=u0_lat*L_lat/nu_lat;
    stats.innerHTML='Step <strong>'+CFD.step+'</strong> · τ = '+CFD.tau.toFixed(3)+' · Re ≈ <strong>'+Re.toFixed(0)+'</strong> · '+(CFD.running?'<span style="color:#22c55e">RUNNING</span>':'<span style="color:#f59e0b">PAUSED</span>');
  }
}
function cfdLoop(){
  if(!CFD.running)return;
  for(let s=0;s<10;s++)cfdStep();
  cfdRender();
  CFD.raf=requestAnimationFrame(cfdLoop);
}
window.cfdStart=function(){
  if(!CFD.f)cfdInit();
  /* Adjust tau from target Re */
  CFD.u0=Math.max(0.01,Math.min(0.20,v('cfd-u0')||0.10));
  const Re=Math.max(10,v('cfd-Re')||100);
  const L=CFD.H*0.36;
  const nu=CFD.u0*L/Re;
  CFD.tau=3*nu+0.5;
  if(CFD.tau<0.51)CFD.tau=0.51;
  if(CFD.tau>1.99)CFD.tau=1.99;
  cfdSetObstacle();
  CFD.running=true;
  if(CFD.raf)cancelAnimationFrame(CFD.raf);
  cfdLoop();
};
window.cfdPause=function(){CFD.running=false;if(CFD.raf)cancelAnimationFrame(CFD.raf);cfdRender();};
window.cfdReset=function(){CFD.running=false;if(CFD.raf)cancelAnimationFrame(CFD.raf);cfdInit();cfdRender();const stats=$('cfd-stats');if(stats)stats.textContent='Reset. Click START to run.';};
function attachCFDCanvasListeners(){
  const c=$('cfd-canvas');if(!c||c._cfdAttached)return;c._cfdAttached=true;
  function paintAt(e,fillVal){
    const rect=c.getBoundingClientRect();
    const sx=CFD.W/rect.width,sy=CFD.H/rect.height;
    const x=Math.floor((e.clientX-rect.left)*sx),y=Math.floor((e.clientY-rect.top)*sy);
    const r=3;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      const xx=x+dx,yy=y+dy;
      if(xx>=1&&xx<CFD.W-1&&yy>=1&&yy<CFD.H-1)CFD.solid[yy*CFD.W+xx]=fillVal;
    }
    cfdRender();
  }
  c.addEventListener('mousedown',e=>{
    if(!CFD.f)return;
    e.preventDefault();
    const fillVal=e.button===2?0:1;
    paintAt(e,fillVal);
    const move=ev=>paintAt(ev,fillVal);
    const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);};
    document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
  });
  c.addEventListener('contextmenu',e=>e.preventDefault());
  /* Live-update solid mask when shape changes */
  const shapeSel=$('cfd-shape');if(shapeSel)shapeSel.addEventListener('change',()=>{cfdSetObstacle();cfdRender();});
  const visSel=$('cfd-vis');if(visSel)visSel.addEventListener('change',cfdRender);
}

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
    injectBeamFnCard();
    injectTolRows();
    injectNatConv();
    injectFouledU();
    injectAgmaPitting();
    injectThreadEngage();
    injectBoltDesigner();
    injectSpringDesigner();
    injectShaftDesigner();
    injectBearingDesigner();
    injectWeldDesigner();
    injectWireDesigner();
    injectBatteryDesigner();
    injectIsolatorDesigner();
    injectGearDesigner();
    injectBeamDesigner();
    injectColumnDesigner();
    injectSealDesigner();
    injectPumpDesigner();
    injectHxDesigner();
    injectPipeDesigner();
    injectMotorDesigner();
    injectCylDesigner();
    window.calcHyd();
    mcPopulate();
    injectKeyway();
    injectFlowMeter();
    injectPlanetary();
    injectBoltSeq();
    injectFracture();
    injectKtCard();
    injectLugCard();
    window.calcFits();
    const typeEl=$('sp-type');if(typeEl)typeEl.addEventListener('change',()=>{gateBellevillePresets();window.calcSpring();});
    wireLive('v-springs',window.calcSpring);
    /* Hide CALCULATE button on springs since live-compute */
    const springBtn=document.querySelector('#v-springs button[onclick="calcSpring()"]');
    if(springBtn)springBtn.style.display='none';
    setTimeout(()=>window.calcSpring(),200);
    /* Universal live-compute pass — covers the rest of the modules */
    /* Wrap calcSection so custom-drawn sections also save to the global
     * cross-tab store and surface a "LOAD INTO BEAM" button afterwards. */
    setTimeout(()=>{
      const orig=window.calcSection;
      if(typeof orig==='function'&&!orig.__amniWrapped){
        const wrapped=function(){const r=orig.apply(this,arguments);try{const st=window.secSt;if(st&&Array.isArray(st.pts)&&st.pts.length>=3){const props=shoelaceProps(st.pts);if(props)saveCustomSection(props,'CUSTOM POLYGON');}injectSectionExportButton();}catch(e){console.warn('[section export]',e.message);}return r;};
        wrapped.__amniWrapped=true;window.calcSection=wrapped;
      }
      /* Pre-populate handoff chip on Beam if a section is already cached */
      if(loadCustomSection())injectSectionImportChip();
      injectBoltTorqueAdvanced();
    },1200);
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
      /* Inject 2D CFD via Lattice Boltzmann */
      injectFluidsCFD();
      attachCFDCanvasListeners();
      cfdInit();cfdRender();
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
        if(typeof window.calcStress==='function')try{window.calcStress();}catch(e){}
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
  const left=split.children[0],right=split.children[1];
  const mohrCard=right.querySelector('.mohr-x');
  if(mohrCard&&left){
    /* Move just the inputs portion; replace canvas with Plotly chart */
    const canvas=mohrCard.querySelector('#c-mohr-x');
    if(canvas){
      const chartDiv=document.createElement('div');chartDiv.id='p-mohr-x';chartDiv.style.cssText='width:100%;height:380px';
      const chartCard=document.createElement('div');chartCard.className='card';chartCard.innerHTML='<h3>MOHR\'S CIRCLE (PLOTLY)</h3>';chartCard.appendChild(chartDiv);
      right.appendChild(chartCard);
      canvas.style.display='none';
    }
    left.appendChild(mohrCard);
  }
  /* Move 3D principal-stress results panel from right to left so all
   * inputs + scalar results live together; right column = visualizations only */
  const results=$('stress-results');if(results&&left&&!left.contains(results))left.appendChild(results);
  setTimeout(()=>{
    const m=right.querySelector('.mohr-x');if(m)left.appendChild(m);
    const r=$('stress-results');if(r&&!left.contains(r))left.appendChild(r);
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
          [['σ₁',s1.toFixed(2)+' MPa'],['σ₂',s2.toFixed(2)+' MPa'],['τ_max',tmax.toFixed(2)+' MPa'],['Center σ_avg',cx.toFixed(2)+' MPa'],['Radius R',R.toFixed(2)+' MPa'],['θ_p',tp.toFixed(2)+'°'],['σ_vM (2D)',sv0.toFixed(2)+' MPa'],['τ_Tresca',tr.toFixed(2)+' MPa']].map(([l,v])=>`<div class="result-item"><div class="lbl">${window.GK?window.GK(l):l}</div><div class="val">${v}</div></div>`).join('')+
          '</div><p style="margin-top:.4rem;color:var(--dim);font-size:.72rem">Principal axes rotate '+tp.toFixed(1)+'° from x-axis. Use σ_vM for ductile-yield FoS, σ₁ for brittle/fatigue. Tresca more conservative than vM by ~15%.</p>';
      }
    };
  },600);
});

const NANRE=/\bNaN\b|\b-?Infinity\b/;
const scrub=el=>{const v=el&&el.closest&&el.closest('.val,.result-item,.result-grid,td,.note');if(v&&NANRE.test(v.textContent)){v.innerHTML=v.innerHTML.replace(/\b-?Infinity\b|\bNaN\b/g,'—');}};
new MutationObserver(ms=>{for(const m of ms){scrub(m.target.nodeType===3?m.target.parentElement:m.target);m.addedNodes&&m.addedNodes.forEach(n=>{const e=n.nodeType===3?n.parentElement:n;if(e&&e.querySelectorAll&&NANRE.test(e.textContent||'')){scrub(e);e.querySelectorAll('.val,.result-item,td,.note').forEach(scrub);}});}}).observe(document.body,{childList:true,subtree:true,characterData:true});
const deepScrub=el=>{if(!NANRE.test(el.textContent||''))return;for(const n of el.childNodes){n.nodeType===3?(NANRE.test(n.nodeValue)&&(n.nodeValue=n.nodeValue.replace(/\b-?Infinity\b|\bNaN\b/g,'—'))):n.nodeType===1&&deepScrub(n);}};
const addCopy=()=>{document.querySelectorAll('.result-grid').forEach(g=>{const prev=g.previousElementSibling;if(prev&&prev.classList&&prev.classList.contains('cf-copy'))return;const b=document.createElement('button');b.className='cf-copy';b.type='button';b.textContent='📋 COPY';b.style.cssText='float:right;margin:0 0 2px;background:none;border:1px solid var(--border2,#444);color:var(--dim,#9aa);font-size:.6rem;padding:2px 8px;border-radius:3px;cursor:pointer';b.onclick=()=>{const lines=[...g.querySelectorAll('.result-item')].map(it=>{const l=it.querySelector('.lbl'),vv=it.querySelector('.val');return(l?l.textContent.trim():'')+': '+(vv?vv.textContent.trim():'');}).join('\n');navigator.clipboard&&navigator.clipboard.writeText(lines).then(()=>{b.textContent='✓ COPIED';setTimeout(()=>{b.textContent='📋 COPY';},1500);}).catch(()=>{});};g.parentNode.insertBefore(b,g);});};
setInterval(()=>{document.querySelectorAll('[id^="v-"]').forEach(av=>{av.offsetParent&&NANRE.test(av.textContent||'')&&deepScrub(av);});addCopy();},400);
setTimeout(()=>{if(!window.Plotly){const n=document.createElement('div');n.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);background:var(--panel,#222);color:var(--warn,#e0b341);border:1px solid var(--warn,#e0b341);border-radius:6px;padding:6px 14px;font-size:.7rem;z-index:99998';n.textContent='⚠ Charts unavailable (Plotly CDN unreachable) — all calculations still work.';document.body.appendChild(n);setTimeout(()=>n.remove(),12000);}},4000);
console.log('[calc-fixes] v5.20.0 layer loaded (unit-core single source of truth + calcStress)');
})();
