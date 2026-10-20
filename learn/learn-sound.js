(function(){
'use strict';
const AC=window.AudioContext||window.webkitAudioContext,OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
const BASE=(document.currentScript&&document.currentScript.src||location.href).replace(/[?#].*$/,'').replace(/[^/]*$/,'')+'assets/';
const R=(lo,hi,st)=>Array.from({length:(hi-lo)/st+1},(_,i)=>lo+i*st);
const INST={piano:R(36,96,3),marimba:R(48,96,3),xylophone:R(60,99,3),glockenspiel:R(72,105,3),musicbox:R(60,99,3),celesta:R(60,99,3),kalimba:R(48,87,3),guitar:R(40,84,4),strings:R(40,80,4)};
const AL={xylo:'xylophone',glock:'glockenspiel',bell:'glockenspiel',bells:'glockenspiel',box:'musicbox',pluck:'guitar',nylon:'guitar',pad:'strings'},LV={strings:.8,glockenspiel:.8,xylophone:.85},REL={piano:.3,strings:.8,guitar:.3,musicbox:.3,celesta:.3};
const KIT=['kick','snare','hat','ohat','clap','tom','tomhi','shaker','tamb','wood','crash'],KA={hihat:'hat',tambourine:'tamb',maracas:'shaker',block:'wood',cymbal:'crash'};
const SFX=['correct','wrong','star','coin','unlock','levelup','win','celebrate','lose','tap','pop','drop','tick','whoosh','flip'],SA={ok:'correct',good:'correct',bad:'wrong',no:'wrong',click:'tap',sparkle:'star',fanfare:'win',place:'drop',count:'tick',swoosh:'whoosh'};
const B=new Map(),P=new Map(),BAD=new Set();
let C=null,IN=null,DEC=null,gest=false,warm=false,res=null;
const ready=new Promise(r=>res=r);
const on=()=>{try{return localStorage.getItem('game-sfx')!=='off'}catch(e){return true}};
const midi=f=>69+12*Math.log2(f/440);
const ctx=()=>{if(!AC)return null;if(!C){try{C=new AC({latencyHint:'interactive'})}catch(e){try{C=new AC()}catch(e2){return null}}
 const cmp=C.createDynamicsCompressor(),lim=C.createDynamicsCompressor(),cv=C.createConvolver(),wet=C.createGain(),sr=C.sampleRate,L=sr*1.4|0,ir=C.createBuffer(2,L,sr),set=(n,o)=>Object.keys(o).forEach(k=>n[k].value=o[k]);
 for(let k=0;k<2;k++){const d=ir.getChannelData(k);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3)*.5}
 IN=C.createGain();set(cmp,{threshold:-18,knee:10,ratio:3,attack:.005,release:.2});set(lim,{threshold:-2,knee:0,ratio:20,attack:.002,release:.1});cv.buffer=ir;wet.gain.value=.1;
 IN.connect(cmp);IN.connect(cv);cv.connect(wet);wet.connect(cmp);cmp.connect(lim);lim.connect(C.destination)}
 gest&&C.state!=='running'?C.resume().catch(()=>{}):0;return C};
const dec=ab=>new Promise((ok,no)=>{const c=C||DEC||(DEC=new OAC(1,1,44100)),p=c.decodeAudioData(ab,ok,no);p&&p.catch&&p.catch(no)});
const url=(d,n)=>BASE+d+'/'+n+'.mp3';
const load=u=>P.get(u)||(P.set(u,fetch(u).then(r=>r.ok?r.arrayBuffer():Promise.reject(r.status)).then(dec).then(b=>(B.set(u,b),b),()=>(BAD.add(u),null))),P.get(u));
const play=(b,o)=>{const c=ctx();if(!c||o.out&&o.out.context!==c)return false;const s=c.createBufferSource(),g=c.createGain(),t=o.at!=null?Math.max(o.at,c.currentTime):c.currentTime+(o.when||0),v=o.vel==null?.8:o.vel,r=o.rate||1,rel=o.rel||.15,nat=t+b.duration/r,end=o.dur!=null?Math.min(nat,t+Math.max(o.dur,.02)+rel*3):nat;
 s.buffer=b;s.playbackRate.value=r;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.003);o.dur!=null&&end<nat?g.gain.setTargetAtTime(0,t+Math.max(o.dur,.02),rel/3):0;
 s.connect(g);g.connect(o.out||IN);s.start(t);s.stop(end+.05);return true};
const near=(L,m)=>L.reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a);
const hit=(k,o={})=>{k=KA[k]||k;if(!KIT.includes(k)||!ctx())return false;const u=url('inst/drums',k),b=B.get(u);return b?play(b,Object.assign({rel:.1},o)):(load(u),false)};
const note=(inst,m,o={})=>{inst=AL[inst]||inst;if(inst==='drums'||inst==='kit')return hit(m,o);const L=INST[inst];if(!L||!isFinite(m)||!ctx())return false;const r=near(L,Math.round(m)),u=url('inst/'+inst,r),b=B.get(u);return b?play(b,Object.assign({},o,{rate:Math.pow(2,(m-r)/12),rel:o.rel||REL[inst]||.15,vel:(o.vel==null?.8:o.vel)*(LV[inst]||1)})):(load(u),preload(inst),false)};
const chord=(inst,ms,o={})=>ms.map((m,i)=>note(inst,m,Object.assign({},o,{when:(o.when||0)+i*(o.strum||0),at:o.at!=null?o.at+i*(o.strum||0):null}))).every(Boolean);
const sfx=(n,o={})=>{n=SA[n]||n;if(!o.force&&!on())return true;if(!SFX.includes(n))return false;const c=ctx();if(!c)return false;const u=url('sfx',n),b=B.get(u),q={vel:o.vol==null?1:o.vol,when:o.when,at:o.at,rate:o.rate,out:o.out};if(b)return play(b,q);if(BAD.has(u))return false;const t=c.currentTime;load(u).then(x=>x&&c.currentTime-t<.35&&play(x,{vel:q.vel,rate:q.rate,out:q.out}));return true};
const files=k=>{const i=AL[k]||k;return k==='sfx'?SFX.map(n=>url('sfx',n)):k==='drums'?KIT.map(n=>url('inst/drums',n)):INST[i]?INST[i].map(m=>url('inst/'+i,m)):SFX.includes(k)?[url('sfx',k)]:[]};
const preload=(list=['sfx'])=>{const us=[].concat(...[].concat(list).map(files));return Promise.all(us.map(load)).then(r=>({ok:r.filter(Boolean).length,fail:us.filter((u,i)=>!r[i]).map(u=>u.slice(BASE.length))}))};
const loaded=k=>files(k).every(u=>B.has(u));
const unlock=()=>{gest=true;const c=ctx();if(!c)return;if(c.state!=='running'){c.resume().catch(()=>{});const s=c.createBufferSource();s.buffer=c.createBuffer(1,1,22050);s.connect(c.destination);s.start(0)}warm?0:(warm=true,preload(['sfx','marimba','celesta']).then(res))};
['pointerdown','touchend','keydown'].forEach(e=>addEventListener(e,unlock,{capture:true,passive:true}));
setTimeout(()=>warm?0:preload(['sfx']).then(res),1500);
window.AmniSound={ctx,get out(){return ctx()?IN:null},sfx,note,chord,hit,preload,loaded,ready,on,midi,list:{inst:Object.keys(INST),kit:KIT,sfx:SFX}};
})();
