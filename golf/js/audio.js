function createAudio(){
let ctx=null,muted=false,master=null;
function ensure(){
if(ctx)return ctx;
ctx=new(window.AudioContext||window.webkitAudioContext)();
master=ctx.createGain();master.gain.value=0.35;master.connect(ctx.destination);
return ctx;
}
function unlock(){try{ensure();if(ctx.state==="suspended")ctx.resume()}catch(_){}}
function beep(freq,dur,type="sine",gain=0.2,slide=0){
if(muted)return;unlock();
const t=ctx.currentTime;
const o=ctx.createOscillator(),g=ctx.createGain();
o.type=type;o.frequency.setValueAtTime(freq,t);
if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);
g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02);
}
function noiseBurst(dur,gain=0.12,bp=800){
if(muted)return;unlock();
const t=ctx.currentTime,n=ctx.sampleRate*dur|0;
const buf=ctx.createBuffer(1,n,ctx.sampleRate),d=buf.getChannelData(0);
for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.5);
const src=ctx.createBufferSource();src.buffer=buf;
const f=ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=bp;f.Q.value=0.7;
const g=ctx.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
src.connect(f);f.connect(g);g.connect(master);src.start(t);
}
const api={
unlock,toggleMute(){muted=!muted;return muted},
isMuted(){return muted},
putt(p=0.5){beep(180+p*120,0.08,"triangle",0.12+p*0.1,-40);noiseBurst(0.06,0.06+p*0.05,400)},
wall(spd=1){noiseBurst(0.05,Math.min(0.18,0.05+spd*0.02),900);beep(90,0.04,"square",0.06)},
sink(){beep(520,0.1,"sine",0.14);beep(780,0.18,"sine",0.1,200);beep(1040,0.25,"triangle",0.08)},
holeInOne(){beep(660,0.12,"sine",0.15);beep(880,0.14,"sine",0.12);beep(1320,0.3,"triangle",0.1)},
hazard(kind){kind==="lava"?beep(60,0.2,"sawtooth",0.1,-20):kind==="water"?noiseBurst(0.2,0.1,300):noiseBurst(0.12,0.08,200)},
ui(){beep(440,0.05,"sine",0.06)},
cheer(){beep(523,0.08,"sine",0.1);beep(659,0.1,"sine",0.09);beep(784,0.2,"triangle",0.08)}
};
return api;
}
export{createAudio};