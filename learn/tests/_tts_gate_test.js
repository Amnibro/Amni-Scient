function _kkAudioOk(a){
  const x=a&&a.audio;if(!x||!x.length)return false;
  let clip=0,zcr=0,prev=0;
  for(let i=0;i<x.length;i++){const v=x[i];if(v!==v)return false;if(v>0.98||v<-0.98)clip++;if(i&&((prev>=0&&v<0)||(prev<0&&v>=0)))zcr++;prev=v;}
  if(clip/x.length>0.08)return false;
  const fr=480,rms=[];let maxR=0,sumR=0;
  for(let o=0;o+fr<=x.length;o+=fr){let s2=0;for(let i=o;i<o+fr;i++)s2+=x[i]*x[i];const r=Math.sqrt(s2/fr);rms.push(r);if(r>maxR)maxR=r;sumR+=r;}
  if(!rms.length||maxR<1e-4)return false;
  let quiet=0;const thr=Math.max(0.015,maxR*0.08);for(const r of rms)if(r<thr)quiet++;
  const quietFrac=quiet/rms.length;if(quietFrac<0.08)return false;
  const meanR=sumR/rms.length;if(meanR/maxR>0.55)return false;
  const sr=(a.sampling_rate||a.sample_rate||24000);const dur=x.length/sr;const zcrRate=zcr/Math.max(0.01,dur);
  if(zcrRate>12000||zcrRate<200)return false;
  let varR=0;for(const r of rms)varR+=(r-meanR)*(r-meanR);varR/=rms.length;
  if(varR<1e-6&&meanR>0.01)return false;
  return true;
}
function makeSpeech(sec=2,sr=24000){
  const n=Math.floor(sec*sr);const x=new Float32Array(n);
  for(let i=0;i<n;i++){
    const t=i/sr;
    const env=Math.sin(Math.PI*Math.min(1,Math.max(0,(t%0.4)/0.35)))* (t%0.55<0.35?1:0.02);
    x[i]=0.35*env*Math.sin(2*Math.PI*180*t)*(1+0.3*Math.sin(2*Math.PI*3*t));
  }
  return {audio:x,sampling_rate:sr};
}
function makeBuzz(sec=2,sr=24000){
  const n=Math.floor(sec*sr);const x=new Float32Array(n);
  for(let i=0;i<n;i++){const t=i/sr;x[i]=0.55*Math.sin(2*Math.PI*400*t)+0.25*Math.sin(2*Math.PI*1300*t)+0.08*(Math.random()*2-1);}
  return {audio:x,sampling_rate:sr};
}
function makeSilence(sec=1,sr=24000){return {audio:new Float32Array(Math.floor(sec*sr)),sampling_rate:sr};}
function makeNaN(){const x=new Float32Array(4800);x[100]=NaN;return {audio:x,sampling_rate:24000};}
function makeClip(sec=1,sr=24000){const n=Math.floor(sec*sr);const x=new Float32Array(n);for(let i=0;i<n;i++)x[i]=i%2?1:-1;return {audio:x,sampling_rate:sr};}
let pass=0,fail=0;
function assert(name,cond){if(cond){pass++;console.log('PASS',name);}else{fail++;console.error('FAIL',name);}}
assert('speech ok',_kkAudioOk(makeSpeech(3))===true);
assert('buzz reject',_kkAudioOk(makeBuzz(2))===false);
assert('silence reject',_kkAudioOk(makeSilence(1))===false);
assert('nan reject',_kkAudioOk(makeNaN())===false);
assert('clip reject',_kkAudioOk(makeClip(1))===false);
assert('empty reject',_kkAudioOk({audio:new Float32Array(0)})===false);
assert('null reject',_kkAudioOk(null)===false);
console.log(JSON.stringify({pass,fail}));
if(fail)process.exit(1);
