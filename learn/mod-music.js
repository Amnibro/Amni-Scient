(function(){
'use strict';
const H=window.AmniHub;if(!H)return;
const $=(s,r)=>r.querySelector(s),$$=(s,r)=>[...r.querySelectorAll(s)],pick=a=>a[Math.random()*a.length|0],shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const NM={C:0,D:2,E:4,F:5,G:7,A:9,B:11},hz=m=>440*2**((m-69)/12);
const toMidi=s=>{const r=/^([A-G])([#b]?)(\d)?$/.exec(s);return 12*(+(r[3]||4)+1)+NM[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)};
const DI=n=>{const r=/^([A-G])(\d)$/.exec(n);return +r[2]*7+'CDEFGAB'.indexOf(r[1])},DN=i=>'CDEFGAB'[i%7]+Math.floor(i/7);
const chord=n=>{const r=/^([A-G])([#b]?)(maj7|m7|m|7)?$/.exec(n);return{p:(NM[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)+12)%12,iv:{maj7:[0,4,7,11],m7:[0,3,7,10],m:[0,3,7],'7':[0,4,7,10]}[r[3]]||[0,4,7]}};
const vc=(pc,lo)=>lo+((pc-lo)%12+12)%12;
const NOI=new WeakMap(),KS=new Map(),ENG=new WeakMap();
const noise=c=>NOI.get(c)||(NOI.set(c,(()=>{const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b})()),NOI.get(c));
const SND=()=>window.AmniSound,SI={box:['musicbox',12,1],bell:['glockenspiel',0,.8],pluck:['guitar',0,.9],pad:['strings',0,.35]},PL=['piano','marimba','guitar','drums'];
const vget=()=>{try{const v=parseFloat(localStorage.getItem('amni-music-vol'));return isNaN(v)?.8:v}catch{return .8}};
function mk(c){
 const G=(v=0)=>{const g=c.createGain();g.gain.value=v;return g},F=(type,f,q=.7)=>{const b=c.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;return b};
 const O=(f,t,e,type='sine',det=0)=>{const o=c.createOscillator();typeof type==='string'?o.type=type:o.setPeriodicWave(type);o.frequency.setValueAtTime(f,t);o.detune.value=det;o.start(t);o.stop(e);return o};
 const Nz=(t,e)=>{const s=c.createBufferSource();s.buffer=noise(c);s.loop=true;s.start(t,Math.random()*1.5);s.stop(e);return s};
 const AD=(t,pk,a,dec)=>{const g=G();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.setTargetAtTime(0,t+a,dec);return g},ch=(...n)=>n.reduce((a,b)=>(a.connect(b),b));
 const PW=c.createPeriodicWave(new Float32Array(10),Float32Array.from([0,1,.55,.3,.2,.11,.07,.05,.03,.02]));
 const ks=m=>{const sr=c.sampleRate,k=sr+':'+m;if(!KS.has(k)){const N=Math.max(2,Math.round(sr/hz(m)-.5)),L=sr*1.7|0,b=c.createBuffer(1,L,sr),d=b.getChannelData(0);let p=0;for(let i=0;i<N;i++)d[i]=p=p*.5+(Math.random()*2-1)*.5;for(let i=N;i<L;i++)d[i]=(d[i-N]+d[i-N-1+(i===N)])*.4985;KS.set(k,b)}return KS.get(k)};
 const bus=G(1),comp=c.createDynamicsCompressor(),mst=G(vget()),lim=c.createDynamicsCompressor(),ws=c.createWaveShaper(),rv=c.createConvolver(),wet=G(.2),set=(n,o)=>Object.entries(o).forEach(([k,v])=>n[k].value=v);
 set(comp,{threshold:-20,knee:12,ratio:3,attack:.01,release:.25});set(lim,{threshold:-3,knee:0,ratio:20,attack:.002,release:.1});
 ws.curve=Float32Array.from({length:2049},(_,i)=>{const x=i/1024-1,a=Math.abs(x);return Math.sign(x)*(a<.7?a:.7+.28*Math.tanh((a-.7)/.28))});
 rv.buffer=(()=>{const sr=c.sampleRate,L=sr*2.2|0,b=c.createBuffer(2,L,sr);for(let k=0;k<2;k++){const d=b.getChannelData(k);let p=0;for(let i=0;i<L;i++)d[i]=(p=p*.7+(Math.random()*2-1)*.3)*Math.pow(1-i/L,4)*Math.min(1,i/(sr*.01))}return b})();
 ch(bus,comp,mst,lim,ws,c.destination);ch(bus,rv,wet,comp);
 const V={
  piano:(m,t,d,v,o)=>{const f=hz(m),dec=Math.max(.7,Math.min(3.5,3.2-(m-48)*.05)),r=t+Math.max(d,.15),e=Math.min(r+.9,t+dec*7),g=G(),lp=F('lowpass',Math.min(f*8+800,17000),.5);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.17,t+.004);g.gain.setTargetAtTime(0,t+.004,dec);g.gain.setTargetAtTime(0,r,.12);lp.frequency.setTargetAtTime(f*2+500,t+.01,.35);[-3,3].forEach(x=>O(f,t,e,PW,x).connect(lp));ch(lp,g,o);ch(Nz(t,t+.1),F('bandpass',Math.min(f*3,5000),1.2),AD(t,v*.05,.001,.015),o)},
  mal:(m,t,v,o,P,dk)=>{const f=hz(m),s=Math.max(.3,1.2-(m-60)*.015);P.forEach(([q,a,k])=>{const dc=dk*k*s;f*q<17000&&ch(O(f*q,t,t+dc*7+.01),AD(t,v*a*.3,.002,dc),o)});ch(Nz(t,t+.05),F('lowpass',3000),AD(t,v*.04,.001,.007),o)},
  marimba:(m,t,d,v,o)=>V.mal(m,t,v,o,[[1,1,1],[3.98,.3,.2],[10.03,.1,.08]],.55),
  box:(m,t,d,v,o)=>V.mal(m+12,t,v*.8,o,[[1,1,1],[2,.2,.5],[5.4,.08,.15]],1.1),
  bell:(m,t,d,v,o)=>{const f=hz(m),e=t+8,car=O(f,t,e);ch(O(f*3.5,t,e),AD(t,f*1.7*v,.001,.35),car.frequency);ch(car,AD(t,v*.2,.002,1.1),o)},
  pad:(m,t,d,v,o)=>{const f=hz(m),a=Math.min(.9,d*.4),r=t+Math.max(d,a),e=r+3.2,g=G(),lp=F('lowpass',Math.min(f*2+400,5000),.5);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.07,t+a);g.gain.setTargetAtTime(0,r,.45);[[1,'sawtooth',-7],[1,'sawtooth',7],[.5,'triangle',0]].forEach(([k,ty,x])=>O(f*k,t,e,ty,x).connect(lp));ch(lp,g,o)},
  pluck:(m,t,d,v,o)=>{const b=ks(m),s=c.createBufferSource(),g=G(),r=t+Math.max(d,.3);s.buffer=b;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.45,t+.002);g.gain.setTargetAtTime(0,r,.1);s.start(t);s.stop(Math.min(t+b.duration,r+.8));ch(s,F('lowpass',Math.min(hz(m)*7,9000),.5),g,o)}};
 const D={
  kick:(t,v,o)=>{const s=O(150,t,t+1);s.frequency.exponentialRampToValueAtTime(47,t+.12);ch(s,AD(t,v*.9,.002,.13),o);ch(Nz(t,t+.03),F('highpass',2000),AD(t,v*.15,.001,.004),o)},
  snare:(t,v,o)=>{ch(Nz(t,t+.5),F('highpass',1500),AD(t,v*.35,.001,.055),o);const s=O(190,t,t+.3,'triangle');s.frequency.exponentialRampToValueAtTime(150,t+.1);ch(s,AD(t,v*.35,.001,.04),o)},
  hat:(t,v,o)=>ch(Nz(t,t+.2),F('highpass',7000),AD(t,v*.2,.001,.022),o),
  clap:(t,v,o)=>{const g=G();[0,.011,.022].forEach(x=>{g.gain.setValueAtTime(0,t+x);g.gain.linearRampToValueAtTime(v*.45,t+x+.001);g.gain.setTargetAtTime(0,t+x+.001,.004)});g.gain.setValueAtTime(0,t+.033);g.gain.linearRampToValueAtTime(v*.35,t+.034);g.gain.setTargetAtTime(0,t+.034,.07);ch(Nz(t,t+.7),F('bandpass',1200,1),g,o)},
  shaker:(t,v,o)=>{const g=G();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.17,t+.025);g.gain.setTargetAtTime(0,t+.025,.03);ch(Nz(t,t+.3),F('highpass',5000),g,o)},
  wood:(t,v,o)=>{ch(O(880,t,t+.3,'triangle'),AD(t,v*.35,.001,.03),o);ch(Nz(t,t+.1),F('bandpass',1700,4),AD(t,v*.3,.001,.012),o)},
  tom:(t,v,o)=>{const s=O(190,t,t+1.3);s.frequency.exponentialRampToValueAtTime(110,t+.2);ch(s,AD(t,v*.7,.002,.17),o)}};
 return{c,bus,noise:()=>noise(c),vol:x=>{mst.gain.setTargetAtTime(x,c.currentTime,.05);try{localStorage.setItem('amni-music-vol',x)}catch{}},note:(i,m,t,d,v,o)=>{const s=SI[i]||[i,0,1];return SND()&&SND().note(s[0],m+s[1],{at:t,dur:d,vel:v*s[2],out:o||bus})||(V[i]&&i!=='mal'?V[i]:V.piano)(m,t,d,v,o||bus)},drum:(k,t,v,o)=>SND()&&SND().hit(k,{at:t,vel:Math.min(1,v*1.2),out:o||bus})||D[k]&&D[k](t,v,o||bus)};
}
const eng=c=>ENG.get(c)||(ENG.set(c,mk(c)),ENG.get(c));
const ses=api=>{api.css('music',CSS);SND()&&SND().preload(PL.concat(api.store.get('inst','marimba')));const c=api.audio(),E=eng(c),out=c.createGain(),q=[],fr=new Set();let raf=0,one=null;out.connect(E.bus);
 const loop=()=>{const n=c.currentTime;while(q.length&&q[0][0]<=n+.01)q.shift()[1]();fr.forEach(f=>f(n));raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
 api.onClose(()=>{cancelAnimationFrame(raf);q.length=0;fr.clear();out.gain.setTargetAtTime(0,c.currentTime,.03);setTimeout(()=>out.disconnect(),500)});
 return{c,E,out,fr,now:()=>c.currentTime,at:(t,f)=>{let i=q.length;while(i&&q[i-1][0]>t)i--;q.splice(i,0,[t,f])},n:(i,m,t,d=.5,v=.7,o)=>E.note(i,m,t??c.currentTime,d,v,o||out),d:(k,t,v=.7,o)=>E.drum(k,t??c.currentTime,v,o||out),
  one:()=>{const p=one;p&&(p.gain.setTargetAtTime(0,c.currentTime,.02),setTimeout(()=>p.disconnect(),300));one=c.createGain();one.connect(out);return one}}};
const clock=(S,api,step,par)=>{const bus=S.c.createGain(),k={bus,dead:0,live:1};bus.connect(par||S.out);let t=S.now()+.1,id=0;
 const fin=h=>{if(!k.live)return;k.live=0;k.dead=h?1:0;clearInterval(id);h&&bus.gain.setTargetAtTime(0,S.now(),.02);setTimeout(()=>bus.disconnect(),h?300:7000)};
 const tick=()=>{const n=S.now();t<n-.3?t=n+.03:0;while(k.live&&t<n+.15){const r=step(Math.max(t,n),bus);r==null?fin():t=r}};
 id=api.every(25,tick);k.stop=()=>fin(1);tick();return k};
const perform=(S,api,ev,spb,end,par)=>{ev.sort((a,b)=>a.b-b.b);let i=0,ab=0,at=S.now()+.12,sp=spb();
 const k=clock(S,api,(t,bus)=>{const n=S.now(),s=spb();s!==sp?(ab+=(n-at)/sp,at=n,sp=s):0;if(i>=ev.length)return null;const e=ev[i++],tt=Math.max(at+(e.b-ab)*sp,n);e.f&&e.f(tt,bus,sp);e.v&&S.at(tt,()=>!k.dead&&e.v());e.end&&S.at(tt,()=>!k.dead&&end&&end());return i<ev.length?at+(ev[i].b-ab)*sp:tt+.01},par);
 k.T=b=>at+(b-ab)*sp;return k};
const cheer=S=>[72,76,79,84].forEach((m,i)=>S.n('bell',m,S.now()+.05+i*.09,.5,.45));
const OMm='G G G D E E D:2 B B A A G:3 D G G G D E E D:2 B B A A G:3 D:.5 D:.5 G G G D:.5 D:.5 G G G:2 G:.5 G:.5 G G:.5 G:.5 G G:.5 G:.5 G:.5 G:.5 G G G G G D E E D:2 B B A A G:4';
const OMw=([a,s])=>`Old Mac-Don-ald had a farm, / E=I=E=I=O! / And on his farm he had a ${a}, / E=I=E=I=O! / With a ${s} ${s} here and a ${s} ${s} there, / here a ${s}, there a ${s}, / ev-ery-where a ${s} ${s}. / Old Mac-Don-ald had a farm, / E=I=E=I=O!`;
const OMA=[['cow','moo'],['duck','quack'],['pig','oink']],YDm='C C D E C E D G3 C C D E C:1 B3:1 C C D E F E D C B3 G3 A3 B3 C:1 C:1',YDw='Yan-kee Doo-dle went to town / a-rid-ing on a po-ny, / stuck a fea-ther in his cap / and called it ma-ca-ro-ni.';
const SONGS=[
 {id:'twinkle',t:'Twinkle, Twinkle, Little Star',sn:'Twinkle',e:'⭐',col:'#F5C518',bpm:100,bar:4,m:'C C G G A A G:2 F F E E D D C:2 G G F F E E D:2 G G F F E E D:2 C C G G A A G:2 F F E E D D C:2',w:'Twin-kle, twin-kle, lit-tle star, / How I won-der what you are! / Up a-bove the world so high, / Like a dia-mond in the sky. / Twin-kle, twin-kle, lit-tle star, / How I won-der what you are!',c:'C F,C F,C G,C C,F C,G C,F C,G C F,C F,C G,C',src:'Words by Jane Taylor (1806), French melody (1761). Public domain.'},
 {id:'mary',t:'Mary Had a Little Lamb',sn:'Mary',e:'🐑',col:'#F472B7',bpm:104,bar:4,m:'E D C D E E E:2 D D D:2 E G G:2 E D C D E E E E D D E D C:4',w:'Ma-ry had a lit-tle lamb, / lit-tle lamb, lit-tle lamb, / Ma-ry had a lit-tle lamb, / its fleece was white as snow.',c:'C C G C C C G C',src:'Words by Sarah Josepha Hale (1830), tune by Lowell Mason. Public domain.'},
 {id:'row',t:'Row, Row, Row Your Boat',sn:'Row Your Boat',e:'🚣',col:'#38BDF8',bpm:72,bar:2,u:3,m:'C:3 C:3 C:2 D E:3 E:2 D E:2 F G:6 C5 C5 C5 G G G E E E C C C G:2 F E:2 D C:6',w:'Row, row, row your boat, / gent-ly down the stream. / Mer-ri-ly, mer-ri-ly, mer-ri-ly, mer-ri-ly, / life is but a dream.',c:'C C C C C C G C',src:'Traditional American song (1852). Public domain.'},
 {id:'farm',t:'Old MacDonald Had a Farm',sn:'Old MacDonald',e:'🐄',col:'#4CB944',bpm:112,bar:4,vs:3,m:Array(3).fill(OMm).join(' '),w:OMA.map(OMw).join(' / '),c:Array(3).fill('G C,G D G G C,G D G G G G G G C,G D G').join(' '),src:'Traditional folk song (printed 1917). Public domain.'},
 {id:'london',t:'London Bridge Is Falling Down',sn:'London Bridge',e:'🌉',col:'#8E5BD9',bpm:112,bar:4,m:'G:1.5 A:.5 G F E F G:2 D E F:2 E F G:2 G:1.5 A:.5 G F E F G:2 D:2 G:2 E C:3',w:'Lon-don Bridge is fall-ing down, / fall-ing down, fall-ing down. / Lon-don Bridge is fall-ing down, / my fair la-dy.',c:'C C G7 C C C G7 C',src:'Traditional nursery rhyme (1600s). Public domain.'},
 {id:'spider',t:'The Itsy Bitsy Spider',sn:'Itsy Bitsy',e:'🕷️',col:'#F28C28',bpm:84,bar:2,u:3,m:'R:5 G3 C:2 C C:2 D E:3 E:2 E D:2 C D:2 E C:6 E:3 E:2 F G:5 G F:2 E F:2 G E:6 C:3 C:2 D E:5 E D:2 C D:2 E C:4 G3 G3 C:2 C C:2 D E:3 E:2 E D:2 C D:2 E C:6',w:'The it-sy bit-sy spi-der climbed up the wa-ter spout. / Down came the rain and washed the spi-der out. / Out came the sun and dried up all the rain, / and the it-sy bit-sy spi-der climbed up the spout a-gain.',c:'- C C G C C C G C C C G C C C G C',src:'Traditional folk rhyme (first printed 1910). Public domain.'},
 {id:'baa',t:'Baa, Baa, Black Sheep',sn:'Baa Baa',e:'🧶',col:'#A3ABBA',bpm:100,bar:4,m:'C C G G A:.5 A:.5 A:.5 A:.5 G:2 F F E E D D C:2 G G:.5 G:.5 F F E E:.5 E:.5 D:2 G:.5 G:.5 G:.5 G:.5 F:.5 F:.5 F E:.5 E:.5 E:.5 E:.5 D:2 C C G G A:.5 A:.5 A:.5 A:.5 G:2 F F E E D D C:2',w:'Baa, baa, black sheep, have you an-y wool? / Yes sir, yes sir, three bags full; / One for the mas-ter, one for the dame, / and one for the lit-tle boy who lives down the lane. / Baa, baa, black sheep, have you an-y wool? / Yes sir, yes sir, three bags full.',c:'C F,C F,C G,C C,F C,G C,F C,G C F,C F,C G,C',src:'Traditional nursery rhyme (1744). Public domain.'},
 {id:'jacques',t:'Are You Sleeping? (Frère Jacques)',sn:'Frère Jacques',e:'🔔',col:'#E8453C',bpm:108,bar:4,m:'C D E C C D E C E F G:2 E F G:2 G:.5 A:.5 G:.5 F:.5 E C G:.5 A:.5 G:.5 F:.5 E C C G3 C:2 C G3 C:2',w:'Are you sleep-ing, are you sleep-ing, / Bro-ther John, Bro-ther John? / Morn-ing bells are ring-ing, morn-ing bells are ring-ing, / Ding, dang, dong. Ding, dang, dong.',c:'C C C C C C C C',src:'Traditional French round (1700s), traditional English words. Public domain.'},
 {id:'buns',t:'Hot Cross Buns',sn:'Hot Cross Buns',e:'🥯',col:'#D9A05B',bpm:100,bar:4,m:'E D C:2 E D C:2 C:.5 C:.5 C:.5 C:.5 D:.5 D:.5 D:.5 D:.5 E D C:2',w:'Hot cross buns! / Hot cross buns! / One a pen-ny, two a pen-ny, / hot cross buns!',c:'C C C,G C',src:'Traditional street cry (1700s). Public domain.'},
 {id:'yankee',t:'Yankee Doodle',sn:'Yankee Doodle',e:'🪶',col:'#22B5A5',bpm:112,bar:4,dd:.5,vs:2,m:YDm+' '+YDm,w:YDw+' / '+YDw,c:'C,G C,G C,G7 G,C C,G C,G C,G7 G,C',src:'Traditional American song (1700s). Public domain.'}];
const prep=x=>{if(x.N)return x;let b=0,k=0,si=0;const u=x.u||1,dd=x.dd||1;
 x.N=x.m.trim().split(/\s+/).map(t=>{const[n,d]=t.split(':'),o={n:n==='R'?null:toMidi(n),b,d:(d?+d:dd)/u};b+=o.d;o.n!=null&&(o.s=k++);return o});x.len=b;
 x.L=[[]];x.w.trim().split(/\s+/).forEach(t=>t==='/'?x.L.push([]):x.L[x.L.length-1].push(t.split(/-|(?<==)/).map(p=>({i:si++,t:p.replace('=','-')}))));x.ns=si;x.lineOf=[];x.L.forEach((l,li)=>l.forEach(w=>w.forEach(s=>x.lineOf[s.i]=li)));
 x.C=x.c.trim().split(/\s+/).map(c=>c.split(','));return x};
const band=(S,x,o)=>{prep(x);const B=x.bar,ci=o.count?B:0,ev=[],N=x.N.slice(0,o.lim||x.N.length),l=N[N.length-1],end=l.b+l.d;
 for(let k=0;k<ci;k++)ev.push({b:k,f:(t,bus)=>S.d('wood',t,k?.4:.7,bus),v:()=>o.cnt&&o.cnt(ci-k)});
 N.forEach((n,i)=>n.n!=null&&ev.push({b:ci+n.b,f:(t,bus,sp)=>{const g=o.mel();g>0&&S.n(o.inst(),n.n,t,n.d*sp*.92,.75*g,bus)},v:()=>o.on&&o.on(n.s,i)}));
 x.C.forEach((cs,k)=>cs.forEach((cn,j)=>{const len=B/cs.length,b0=k*B+j*len;if(cn==='-'||b0>=end)return;const ch=chord(cn);for(let p=0;p<len;p++)ev.push({b:ci+b0+p,f:(t,bus,sp)=>o.ch()&&(p%2?ch.iv.forEach(iv=>S.n('piano',vc(ch.p+iv,55),t,sp*.8,.2,bus)):S.n('pluck',vc(ch.p+(p?7:0),43),t,sp*.95,.55,bus))})}));
 const sub=B===2?1/3:.5;for(let j=0;j*sub<end-.01;j++){const bb=j*sub,ib=Math.round(bb*1000)/1000%B,on=Math.abs(ib-Math.round(ib))<.01,r=Math.round(ib);ev.push({b:ci+bb,f:(t,bus)=>o.beat()&&(on&&(r===0||(B===4&&r===2))?S.d('kick',t,.55,bus):on&&r%2?S.d('clap',t,.22,bus):S.d('shaker',t,on?.35:.22,bus))})}
 ev.push({b:ci+end+.3,end:1});return ev};
const SOL={C:'Do',D:'Re',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Ti'},KC={C:'#E8453C',D:'#F28C28',E:'#F5C518',F:'#4CB944',G:'#22B5A5',A:'#3D7FE0',B:'#8E5BD9'};
const INSTS=[['marimba','🎵 Marimba'],['xylophone','🪵 Xylophone'],['piano','🎹 Piano'],['box','🎁 Music box'],['kalimba','🎶 Kalimba'],['pluck','🎸 Guitar'],['bell','🔔 Bells']];
const xylo=(K,lab,val)=>K.map((k,i)=>`<button type="button" class="mu-k" data-i="${i}"${val?` data-v="${k[0]}"`:''} style="--c:${KC[k[0]]};--h:${100-i*38/Math.max(1,K.length-1)};${'AB'.includes(k[0])?'--kt:#fff':''}" aria-label="${SOL[k[0]]} ${k[0]}"><span class="mu-kn">${lab==='let'?k[0]:lab==='none'?'':SOL[k[0]]}</span><span class="mu-kl">${lab==='both'?k[0]:''}</span></button>`).join('');
const lyr=(x,esc,li,cur=-1)=>(li==null?x.L:[x.L[li]]).map(l=>`<span class="mu-line">${l.map(w=>`<span class="mu-w">${w.map(s=>`<span class="mu-s${s.i<cur?' done':s.i===cur?' on':''}">${esc(s.t)}</span>`).join('')}</span>`).join(' ')}</span>`).join('');
const seg=(k,o,cur,lab,cls='')=>`<div class="mu-seg ${cls}" role="group" aria-label="${lab||k}" data-k="${k}">${o.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${String(v)===String(cur)}">${l}</button>`).join('')}</div>`;
const rng=(k,l,a,b,v,u='')=>`<label class="mu-lab"><span>${l}</span><input type="range" data-k="${k}" data-u="${u}" min="${a}" max="${b}" value="${v}"><output>${v}${u}</output></label>`;
const volUI=()=>rng('vol','🔊 Volume',0,100,Math.round(vget()*100),'%');
const bind=(r,S,m)=>{m.vol=m.vol||(v=>S.E.vol(v/100));$$('.mu-seg',r).forEach(g=>m[g.dataset.k]&&g.addEventListener('click',e=>{const b=e.target.closest('button');b&&([...g.children].forEach(x=>x.setAttribute('aria-pressed',x===b)),m[g.dataset.k](b.dataset.v))}));$$('input[type=range]',r).forEach(i=>m[i.dataset.k]&&i.addEventListener('input',()=>{i.nextElementSibling.textContent=i.value+i.dataset.u;m[i.dataset.k](+i.value)}))};
const starsOf=st=>Object.values(st.get('stars',{})).reduce((a,b)=>a+b,0),star=(st,k,n,add)=>{const s=st.get('stars',{});s[k]=add?Math.min(3,(s[k]||0)+1):Math.max(s[k]||0,n);st.set('stars',s);return s[k]};
const result=(api,el,pct,again,back)=>{const s=pct>=.9?3:pct>=.7?2:pct>=.4?1:0;s>=2&&api.confetti();api.feedback(s>=2?'Amazing! 🎉':s?'Nice work! 🎵':'Keep practicing! 💪',s>0);el.innerHTML=`<div class="mu-res"><div class="hub-big">${'⭐'.repeat(s)}${'☆'.repeat(3-s)}</div><p class="hub-q">${Math.round(pct*100)}% correct</p><div class="hub-row"><button type="button" class="hub-btn primary mu-r1">🔁 Play again</button>${back?'<button type="button" class="hub-btn mu-r2">↩ Choose another</button>':''}</div></div>`;$('.mu-r1',el).onclick=again;back&&($('.mu-r2',el).onclick=back);return s};
const quiz=(api,S,el,o)=>{let i=0,ok=0,q=null;const id=el.qz=Math.random();const play=()=>q.p&&q.p(S.one(),S.now()+.12);
 const next=()=>{if(i>=o.n)return o.done(ok/o.n);q=o.gen(i);let done=0;
  el.innerHTML=`<div class="hub-bar"><i style="width:${i/o.n*100}%"></i></div><p class="hub-q">${q.q}</p>${q.show||''}${q.p?'<div class="hub-row"><button type="button" class="hub-btn mu-hear">🔊 Hear it again</button></div>':''}${q.xy?`<div class="mu-xy mu-small">${q.xy}</div>`:`<div class="mu-ch n${q.ch.length}">${q.ch.map(([v,l,c])=>`<button type="button" class="hub-choice" data-v="${v}"${c?` style="--c:${c}"`:''}>${l}</button>`).join('')}</div>`}`;
  q.p&&($('.mu-hear',el).onclick=play,api.after(350,play));
  $$('[data-v]',el).forEach(b=>b.onclick=()=>{if(done)return;done=1;q.tap&&q.tap(b.dataset.v);const good=b.dataset.v===String(q.a);good?(ok++,api.score(5),S.n('bell',84,S.now()+.25,.3,.3),S.n('bell',91,S.now()+.35,.4,.3)):api.miss();b.classList.add(good?'ok':'bad');$$('[data-v]',el).forEach(x=>x.dataset.v===String(q.a)&&x.classList.add('ok'));api.after(good?1100:1700,()=>{el.qz===id&&(i++,next())})})};
 next()};
H.music={mk,eng,SONGS,prep,band};
H.category({id:'music',icon:'🎵',title:'Music Studio',top:false});
H.register({id:'music-sing',cat:'music',icon:'🎤',title:'Sing-Along',desc:'Sing favorite songs with a friendly band',levels:'1234',isNew:true,open(api){
 const S=ses(api),st=api.store;let P=null,inst=st.get('inst','marimba'),mode=st.get('mode','band'),tempo=st.get('tempo',100);
 const menu=()=>{P&&P.stop();P=null;api.title('Sing-Along');api.status('⭐ '+starsOf(st));const s=st.get('stars',{}),r=api.html(`<div class="mu"><p class="hub-q">Pick a song and sing along! 🎤</p><div class="mu-songs">${SONGS.map(x=>`<button type="button" class="mu-song" data-id="${x.id}" style="--c:${x.col}"><b aria-hidden="true">${x.e}</b><span>${api.esc(x.t)}</span><small>${s[x.id]?'⭐'.repeat(s[x.id]):'♪ New'}</small></button>`).join('')}</div></div>`);$$('.mu-song',r).forEach(b=>b.onclick=()=>play(SONGS.find(x=>x.id===b.dataset.id)))};
 const play=x=>{prep(x);api.title(x.e+' '+x.sn);
  const r=api.html(`<div class="mu"><div class="hub-card"><div class="mu-count" aria-live="polite"></div><div class="mu-lyr">${lyr(x,api.esc)}</div><div class="hub-bar"><i style="width:0%"></i></div><div class="hub-row"><button type="button" class="hub-btn primary mu-go">▶ Sing!</button><button type="button" class="hub-btn mu-back">🎵 All songs</button></div></div><div class="hub-card">${seg('mode',[['band','🎺 Full band'],['mel','🎵 Melody only'],['you','🎤 You sing']],mode,'Mode')}${seg('inst',INSTS,inst,'Instrument')}${rng('tempo','🐢 Speed 🐇',50,140,tempo,'%')}${volUI()}<p class="hub-muted mu-src">${api.esc(x.src)}</p></div></div>`);
  const go=$('.mu-go',r),bar=$('.hub-bar>i',r),box=$('.mu-lyr',r),sy=$$('.mu-s',r),cnt=$('.mu-count',r),lines=$$('.mu-line',r);let ln=-1;
  const reset=()=>{P&&P.stop();P=null;go.textContent='▶ Sing!';cnt.textContent='';sy.forEach(e=>e.classList.remove('on','done'));bar.style.width='0%';ln=-1;box.scrollTop=0};
  const hl=s=>{cnt.textContent='';sy.forEach((e,j)=>{e.classList.toggle('on',j===s);e.classList.toggle('done',j<s)});bar.style.width=(s+1)/x.ns*100+'%';const l=x.lineOf[s];l!==ln&&(ln=l,box.scrollTop=Math.max(0,lines[l].offsetTop-box.clientHeight/3))};
  go.onclick=()=>P?reset():(reset(),go.textContent='⏹ Stop',P=perform(S,api,band(S,x,{inst:()=>inst,mel:()=>mode==='you'?.12:1,ch:()=>mode!=='mel',beat:()=>mode!=='mel',count:1,cnt:n=>cnt.textContent=n,on:hl}),()=>60/(x.bpm*tempo/100),()=>{star(st,x.id,0,1);api.status('⭐ '+starsOf(st));api.score(10);api.confetti();api.feedback(pick(['Beautiful singing! 🌟','What a star! ⭐','Encore! 👏']),true);cheer(S);P=null;go.textContent='▶ Sing again!'}));
  $('.mu-back',r).onclick=menu;
  bind(r,S,{mode:v=>{mode=v;st.set('mode',v)},inst:v=>{inst=v;st.set('inst',v);SND()?SND().preload(v).then(()=>P||S.n(v,72,null,.5,.7)):P||S.n(v,72,null,.5,.7)},tempo:v=>{tempo=v;st.set('tempo',v)}})};
 menu()}});
H.register({id:'music-keys',cat:'music',icon:'🎹',title:'Play-a-Song',desc:'Follow the glowing bars and play real songs',levels:'1234',isNew:true,open(api){
 const S=ses(api),st=api.store,K=api.level>=3?['G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5']:['C4','D4','E4','F4','G4','A4','B4','C5'],KM=K.map(toMidi),list=SONGS.filter(x=>prep(x).N.every(n=>n.n==null||KM.includes(n.n)));
 let inst=st.get('inst','marimba'),lab=st.get('lab',api.level<3?'sol':'both'),x=null,N=[],lim=0,pos=0,miss=0,D=null;const lt={};
 api.status('⭐ '+starsOf(st));
 const r=api.html(`<div class="mu"><div class="hub-card">${seg('song',[['free','🎈 Free play'],...list.map(s=>[s.id,s.e+' '+s.sn])],'free','Song','mu-scroll')}<div class="mu-now" aria-live="polite"></div><div class="hub-row"><button type="button" class="hub-btn primary mu-listen">👂 Listen</button><button type="button" class="hub-btn mu-again">🔁 Start over</button></div></div><div class="mu-xy">${xylo(K,lab)}</div><div class="hub-card">${seg('inst',INSTS,inst,'Instrument')}${seg('lab',[['sol','Do Re Mi'],['let','C D E'],['both','Both'],['none','No labels']],lab,'Labels')}${volUI()}</div></div>`);
 const xy=$('.mu-xy',r),now=$('.mu-now',r),keys=()=>$$('.mu-k',xy),lis=$('.mu-listen',r),ag=$('.mu-again',r);
 const show=()=>{keys().forEach(k=>k.classList.toggle('glow',!!x&&pos<N.length&&KM[+k.dataset.i]===N[pos].n&&!(D&&D.live)));lis.disabled=ag.disabled=!x;if(!x)return now.innerHTML='<p class="hub-q">Tap the bars to make music! Slide your finger across for a glissando ✨</p>';const s=N[Math.min(pos,N.length-1)].s;now.innerHTML=`<div class="mu-lyr mu-one">${lyr(x,api.esc,x.lineOf[s],pos<N.length?s:x.ns)}</div><div class="hub-bar"><i style="width:${pos/N.length*100}%"></i></div>`};
 const flash=i=>{const k=keys()[i];k&&(k.classList.remove('hit'),void k.offsetWidth,k.classList.add('hit'),api.after(170,()=>k.classList.remove('hit')))};
 const demo=full=>{D&&D.stop();D=perform(S,api,band(S,x,{inst:()=>inst,mel:()=>1,ch:()=>full,beat:()=>full,count:full,lim,on:(s,i)=>flash(KM.indexOf(x.N[i].n))}),()=>60/x.bpm,()=>{D=null;full&&(pos=0,miss=0);show()});show()};
 const done=()=>{const sc=miss<=2?3:miss<=7?2:1;star(st,x.id,sc);api.status('⭐ '+starsOf(st));api.score(sc*5);api.confetti();cheer(S);api.feedback(`You played ${x.sn}! ${'⭐'.repeat(sc)}`,true);show();now.insertAdjacentHTML('beforeend','<p class="hub-q">🎉 Now listen to your song with the band!</p>');api.after(1400,()=>x&&demo(1))};
 const tap=i=>{const t=performance.now();if(t-(lt[i]||0)<90)return;lt[i]=t;S.n(inst,KM[i],null,.9,.8);flash(i);if(!x||(D&&D.live)||pos>=N.length)return;KM[i]===N[pos].n?(pos++,pos>=N.length?done():show()):(miss++,keys()[i].classList.add('no'),api.after(350,()=>keys()[i]&&keys()[i].classList.remove('no')))};
 xy.addEventListener('pointerdown',e=>{const b=e.target.closest('.mu-k');b&&(e.preventDefault(),b.hasPointerCapture(e.pointerId)&&b.releasePointerCapture(e.pointerId),tap(+b.dataset.i))});
 xy.addEventListener('pointerover',e=>{const b=e.target.closest('.mu-k');b&&e.buttons&&tap(+b.dataset.i)});
 xy.addEventListener('click',e=>{const b=e.target.closest('.mu-k');b&&e.detail===0&&tap(+b.dataset.i)});
 const kd=e=>{const i='asdfghjkl;\''.indexOf(e.key.toLowerCase());i>=0&&i<K.length&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&tap(i)};document.addEventListener('keydown',kd);api.onClose(()=>document.removeEventListener('keydown',kd));
 lis.onclick=()=>x&&demo(0);ag.onclick=()=>{D&&D.stop();D=null;pos=0;miss=0;show()};
 bind(r,S,{song:v=>{D&&D.stop();D=null;x=SONGS.find(s=>s.id===v)||null;x&&(lim=x.N.length/(x.vs||1),N=x.N.slice(0,lim).filter(n=>n.n!=null));pos=0;miss=0;show();x&&api.speak&&api.level<3&&api.speak("Let's play "+x.sn)},inst:v=>{inst=v;st.set('inst',v);SND()&&SND().preload(v)},lab:v=>{lab=v;st.set('lab',v);xy.innerHTML=xylo(K,lab);show()}});
 show()}});
const TR=[['kick','💥','Boom','#E8453C'],['snare','🥁','Snap','#F28C28'],['hat','✨','Tss','#D9A400'],['clap','👏','Clap','#4CB944'],['shaker','🥚','Shake','#22B5A5'],['wood','🪵','Tok','#3D7FE0'],['tom','🐘','Dum','#8E5BD9'],['bell','🔔','Ding','#D9468F']];
const PRE={rock:{kick:'x.......x.x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',tom:'.............xxx'},hiphop:{kick:'x......x..x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.xx',clap:'....x.......x...',bell:'x.........x.....'},samba:{kick:'x.......x.......',tom:'....x.......x...',snare:'..x...x...x.x.x.',shaker:'xxxxxxxxxxxxxxxx',wood:'x.xx.x.xx.x.x.x.',bell:'x..x..x...x..x..'},march:{kick:'x...x...x...x...',snare:'x.xxx.x.x.xxx.x.',hat:'x.......x.......',wood:'..x...x...x...x.'}},PENT=[72,76,79,81,84,81,79,76];
H.register({id:'music-beats',cat:'music',icon:'🥁',title:'Beat Maker',desc:'Build your own drum grooves',levels:'23457',isNew:true,open(api){
 const S=ses(api),st=api.store,T=(SND()&&SND().preload('bell'),api.level)===2?TR.slice(0,4):TR,pre=n=>Object.fromEntries(TR.map(([k])=>[k,[...(PRE[n]&&PRE[n][k]||'').padEnd(16,'.')].map(c=>c==='x')])),last=st.get('last',null);
 let p=last&&last.p?Object.assign(pre(''),last.p):pre('rock'),bpm=last?last.bpm:100,sw=last?last.sw:0,slot='1',L=null,paint=null;
 const rand=()=>Object.fromEntries(TR.map(([k],j)=>[k,Array.from({length:16},(_,s)=>Math.random()<[s%4?.12:.7,s%8===4?.9:.07,s%2?.3:.8,.1,.3,.17,.1,.2][j])]));
 const r=api.html(`<div class="mu"><div class="hub-card"><div class="hub-row"><button type="button" class="hub-btn primary mu-go">▶ Play</button></div>${seg('pre',[['rock','🎸 Rock'],['hiphop','🧢 Hip-hop'],['samba','🌴 Samba'],['march','🎺 March'],['rand','🎲 Surprise'],['clear','🧹 Clear']],'','Presets')}${rng('bpm','Tempo',70,180,bpm,' bpm')}${rng('sw','Swing',0,70,sw,'%')}${volUI()}</div><div class="hub-card"><div class="mu-grid">${T.map(([k,e,n,c])=>`<button type="button" class="mu-pad" data-k="${k}" style="--c:${c}"><span aria-hidden="true">${e}</span>${n}</button>`+Array.from({length:16},(_,i)=>`<button type="button" class="mu-st${(i>>2)%2?'':' b4'}" data-k="${k}" data-s="${i}" style="--c:${c}" aria-pressed="${!!p[k][i]}" aria-label="${n} step ${i+1}"></button>`).join('')).join('')}</div></div><div class="hub-card"><div class="hub-row">${seg('slot',[['1','Slot 1'],['2','Slot 2'],['3','Slot 3']],'1','Save slot')}<button type="button" class="hub-btn mu-save">💾 Save</button><button type="button" class="hub-btn mu-load">📂 Load</button></div></div></div>`);
 const g=$('.mu-grid',r),go=$('.mu-go',r),cells=$$('.mu-st',r),save=()=>st.set('last',{p,bpm,sw});
 const hit=(k,t,s,bus)=>k==='bell'?S.n('bell',PENT[(s||0)%8],t,.4,.45,bus):S.d(k,t,.8,bus);
 const refresh=()=>{cells.forEach(c=>c.setAttribute('aria-pressed',!!p[c.dataset.k][+c.dataset.s]));[['bpm',bpm,' bpm'],['sw',sw,'%']].forEach(([k,v,u])=>{const i=$(`input[data-k="${k}"]`,r);i.value=v;i.nextElementSibling.textContent=v+u});save()};
 const setc=(b,v)=>{p[b.dataset.k][+b.dataset.s]=v;b.setAttribute('aria-pressed',v);save()};
 const mark=k=>cells.forEach(c=>c.classList.toggle('ph',+c.dataset.s===k));
 const stop=()=>{L&&L.stop();L=null;mark(-1);go.textContent='▶ Play'};
 go.onclick=()=>L?stop():(()=>{let k=0;L=clock(S,api,(t,bus)=>{const d=60/bpm/4,s=k%16,at=t+(s%2?sw/100*d*.5:0);T.forEach(([n])=>p[n][s]&&hit(n,at,s,bus));S.at(at,()=>L&&L.live&&mark(s));k++;return t+d});go.textContent='⏹ Stop'})();
 g.addEventListener('pointerdown',e=>{const b=e.target.closest('.mu-st'),pd=e.target.closest('.mu-pad');pd&&hit(pd.dataset.k,null,0);if(!b)return;e.pointerType==='mouse'&&b.releasePointerCapture&&b.hasPointerCapture(e.pointerId)&&b.releasePointerCapture(e.pointerId);paint=b.getAttribute('aria-pressed')!=='true';setc(b,paint);paint&&!L&&hit(b.dataset.k,null,+b.dataset.s)});
 g.addEventListener('pointerover',e=>{const b=e.target.closest('.mu-st');b&&paint!=null&&e.buttons&&e.pointerType==='mouse'&&setc(b,paint)});
 g.addEventListener('click',e=>{const b=e.target.closest('.mu-st'),pd=e.target.closest('.mu-pad');e.detail===0&&(b?setc(b,b.getAttribute('aria-pressed')!=='true'):pd&&hit(pd.dataset.k,null,0))});
 const up=()=>paint=null;addEventListener('pointerup',up);addEventListener('pointercancel',up);api.onClose(()=>{removeEventListener('pointerup',up);removeEventListener('pointercancel',up)});
 $('.mu-save',r).onclick=()=>{st.set('slot'+slot,{p,bpm,sw});api.feedback('Saved in slot '+slot+' 💾',true)};
 $('.mu-load',r).onclick=()=>{const d=st.get('slot'+slot,null);d?(p=d.p,bpm=d.bpm,sw=d.sw,refresh(),api.feedback('Loaded slot '+slot+' 📂',true)):api.feedback('Slot '+slot+' is empty — save a beat first',false)};
 bind(r,S,{pre:v=>{p=v==='rand'?rand():pre(v==='clear'?'':v);v==='rand'||v==='clear'?0:(bpm={rock:110,hiphop:90,samba:104,march:112}[v],sw=v==='hiphop'?40:0);refresh()},bpm:v=>{bpm=v;save()},sw:v=>{sw=v;save()},slot:v=>slot=v})}});
H.register({id:'music-rhythm',cat:'music',icon:'👏',title:'Rhythm Tap',desc:'Tap along with the beat: Perfect, Good or Miss',levels:'2345',isNew:true,open(api){
 const S=ses(api),st=api.store;let dif=st.get('dif',Math.max(1,Math.min(4,api.level-1))),help=st.get('help',api.level<4?'on':'off'),R=null,notes=[],sc=0,co=0,cnt={p:0,g:0,m:0},bpm=80,C={};
 const VOC={q:[0],r:[],e:[0,.5],o:[.5],s:[0,.25,.5,.75],a:[0,.5,.75],b:[0,.25,.5],d:[0,.75]},LV=['','qqqr','qqqeer','qqeeoodr','qeessabod'],W=()=>[[.075,.17],[.07,.14],[.055,.12],[.045,.1]][dif-1];
 const r=api.html(`<div class="mu"><div class="hub-card">${seg('dif',[['1','🐣 Easy'],['2','🙂 Medium'],['3','😎 Hard'],['4','🔥 Expert']],dif,'Difficulty')}${seg('help',[['on','👂 Helper claps'],['off','🙈 No helper']],help,'Helper')}<div class="mu-stats"><span>Score <b class="s-sc">0</b></span><span>Combo <b class="s-co">0</b></span><span>✨ <b class="s-p">0</b></span><span>👍 <b class="s-g">0</b></span><span>💨 <b class="s-m">0</b></span></div><canvas class="mu-lane" aria-hidden="true"></canvas><div class="mu-jd" aria-live="polite">Press Start, then tap when a dot reaches the line</div><button type="button" class="mu-tap">👏 TAP</button><div class="hub-row"><button type="button" class="hub-btn primary mu-go">▶ Start</button></div><p class="hub-muted mu-src">Tap the big pad or press Space.</p></div></div>`);
 const cv=$('.mu-lane',r),cx=cv.getContext('2d'),jd=$('.mu-jd',r),go=$('.mu-go',r),lat=()=>S.c.outputLatency||S.c.baseLatency||0;
 const upd=()=>[['sc',sc],['co',co],['p',cnt.p],['g',cnt.g],['m',cnt.m]].forEach(([k,v])=>$('.s-'+k,r).textContent=v);
 const bar=()=>Array.from({length:4},(_,j)=>{const c=pick([...LV[dif]]);return VOC[j||!'ro'.includes(c)?c:'q']});
 const judge=(x,k)=>{x.st=k;cnt[k]++;co=k==='m'?0:co+1;sc+=k==='p'?100+co*5:k==='g'?50+co*2:0;jd.textContent={p:'✨ Perfect!',g:'👍 Good',m:'💨 Miss'}[k];jd.className='mu-jd '+k;upd()};
 const tap=()=>{S.d('clap',null,.45);const pd=$('.mu-tap',r);pd.classList.remove('hit');void pd.offsetWidth;pd.classList.add('hit');if(!R||!R.live)return;const tt=S.now()-lat(),w=W(),n=notes.filter(x=>!x.st).map(x=>[x,Math.abs(tt-R.T(x.b))]).sort((a,b)=>a[1]-b[1])[0];n&&n[1]<=w[1]+.07&&judge(n[0],n[1]<=w[0]?'p':n[1]<=w[1]?'g':'m')};
 const fin=()=>{notes.forEach(x=>x.st||judge(x,'m'));const acc=(cnt.p+cnt.g*.5)/Math.max(1,notes.length),s=acc>=.9?3:acc>=.7?2:acc>=.4?1:0,b=st.get('best',{});b[dif]=Math.max(b[dif]||0,s);st.set('best',b);api.status('Best '+'⭐'.repeat(b[dif])||'');jd.className='mu-jd';jd.textContent=`${'⭐'.repeat(s)}${'☆'.repeat(3-s)}  ${Math.round(acc*100)}% on the beat!`;s&&api.score(s*5);s>=2&&(api.confetti(),cheer(S));api.feedback(s>=2?'Great rhythm! 🥁':s?'Nice tapping! 👏':'Keep practicing! 💪',s>0);R=null;go.textContent='▶ Play again'};
 const start=()=>{R&&R.stop();const A=[bar(),bar()],B=[bar(),bar()],bars=[...A,...A,...B,...A],ev=[];bpm=[0,80,90,100,112][dif];notes=[];sc=co=0;cnt={p:0,g:0,m:0};upd();const cs=getComputedStyle(document.body);C={lv:cs.getPropertyValue('--lv').trim()||'#38BDF8',ok:cs.getPropertyValue('--ui-ok').trim()||'#22C55E',mu:cs.getPropertyValue('--ui-muted').trim()||'#A3ABBA',tx:cs.getPropertyValue('--ui-text').trim()||'#EDF0F5',gd:'#F5C518'};
  for(let k=0;k<4;k++)ev.push({b:k,f:(t,bus)=>S.d('wood',t,k?.45:.75,bus),v:()=>{jd.className='mu-jd';jd.textContent=String(4-k)}});
  bars.forEach((br,bi)=>br.forEach((c,j)=>c.forEach(o=>{const b=4+bi*4+j+o;notes.push({b,st:0});ev.push({b,f:(t,bus)=>help==='on'&&S.d('wood',t,.5,bus)})})));
  for(let b=4;b<4+bars.length*4;b+=.5){const ib=(b-4)%4;ev.push({b,f:(t,bus)=>ib===0||ib===2?(S.d('kick',t,.7,bus),S.d('hat',t,.2,bus)):ib%1?S.d('hat',t,.15,bus):(S.d('snare',t,.25,bus),S.d('hat',t,.2,bus))})}
  ev.push({b:4+bars.length*4+.5,end:1});R=perform(S,api,ev,()=>60/bpm,fin);go.textContent='⏹ Stop';go.blur()};
 const draw=n=>{const dpr=devicePixelRatio||1,Wd=Math.round(cv.clientWidth*dpr),Hh=Math.round(cv.clientHeight*dpr);if(!Wd)return;cv.width!==Wd&&(cv.width=Wd);cv.height!==Hh&&(cv.height=Hh);cx.clearRect(0,0,Wd,Hh);const hx=Wd*.17,pps=Math.max(Wd/2.4,300*dpr),t=n-lat(),sp=60/bpm;
  if(R){const b0=Math.floor((t-hx/pps-R.T(0))/sp),b1=Math.ceil((t+(Wd-hx)/pps-R.T(0))/sp);for(let b=Math.max(0,b0);b<=b1;b++){const x=hx+(R.T(b)-t)*pps;cx.fillStyle=C.mu;cx.globalAlpha=b%4===0?.45:.17;cx.fillRect(x-dpr,0,2*dpr,Hh)}cx.globalAlpha=1;const w=W();notes.forEach(o=>{const nt=R.T(o.b),x=hx+(nt-t)*pps;!o.st&&t>nt+w[1]&&R.live&&judge(o,'m');if(x<-40||x>Wd+40)return;cx.fillStyle=o.st==='p'?C.ok:o.st==='g'?C.gd:o.st==='m'?C.mu:C.lv;cx.globalAlpha=o.st?.55:1;cx.beginPath();cx.arc(x,Hh/2,Hh*.13,0,7);cx.fill()});cx.globalAlpha=1}
  cx.fillStyle=C.tx||'#888';cx.fillRect(hx-2*dpr,Hh*.1,4*dpr,Hh*.8)};
 S.fr.add(draw);
 $('.mu-tap',r).addEventListener('pointerdown',e=>{e.preventDefault();tap()});
 const kd=e=>{e.code==='Space'&&!e.repeat&&(e.preventDefault(),tap())};document.addEventListener('keydown',kd);api.onClose(()=>document.removeEventListener('keydown',kd));
 go.onclick=()=>R?(R.stop(),R=null,go.textContent='▶ Start',jd.textContent='Stopped'):start();
 const b=st.get('best',{});api.status(b[dif]?'Best '+'⭐'.repeat(b[dif]):'');
 bind(r,S,{dif:v=>{dif=+v;st.set('dif',dif)},help:v=>{help=v;st.set('help',v)}})}});
const HS=[['Do','✊','Fist, held low','0deg'],['Re','🤚','Flat hand, slanting up','45deg'],['Mi','🤚','Flat hand, level','90deg'],['Fa','👎','Thumb points down','0deg'],['Sol','✋','Flat hand, palm facing you','-90deg'],['La','🤚','Relaxed hand, drooping down','135deg'],['Ti','☝️','Finger points up and across','40deg'],['Do','✊','Fist, held high','0deg']],SC=[0,2,4,5,7,9,11,12],SCC=['#E8453C','#F28C28','#F5C518','#4CB944','#22B5A5','#3D7FE0','#8E5BD9','#E8453C'];
const EG=[
 {id:'hilo',e:'🐦',t:'High or Low',lv:'12',g:(L,S)=>{const a=pick(['hi','lo']),m=a==='hi'?pick([79,81,84]):pick([43,45,48]);return{q:'Is it high like a bird, or low like a bear?',a,ch:[['hi','🐦 High'],['lo','🐻 Low']],p:(b,t)=>[0,.45,.9].forEach(o=>S.n('marimba',m,t+o,.5,.8,b))}}},
 {id:'loud',e:'🦁',t:'Loud or Soft',lv:'123',g:(L,S)=>{const a=pick(['loud','soft']);return{q:'Was that loud like a lion, or soft like a mouse?',a,ch:[['loud','🦁 Loud'],['soft','🐭 Soft']],p:(b,t)=>[60,64,67,72].forEach((m,j)=>S.n('piano',m,t+j*.3,.5,a==='loud'?1:.1,b))}}},
 {id:'fast',e:'🐇',t:'Fast or Slow',lv:'123',g:(L,S)=>{const a=pick(['fast','slow']);return{q:'Is the music fast like a bunny, or slow like a turtle?',a,ch:[['fast','🐇 Fast'],['slow','🐢 Slow']],p:(b,t)=>[60,62,64,65,67,69,71,72].forEach((m,j)=>S.n('marimba',m,t+j*(a==='fast'?.12:.45),.4,.7,b))}}},
 {id:'same',e:'🟰',t:'Same or Different',lv:'12345',g:(L,S)=>{const P=[60,62,64,67,69,72],n=Math.min(7,2+L),m1=Array.from({length:n},()=>pick(P)),a=pick(['same','diff']),m2=m1.slice(),k=Math.random()*n|0;a==='diff'&&(m2[k]=pick(P.filter(x=>x!==m1[k])));return{q:'Listen to both tunes. Are they the same?',a,ch:[['same','🟰 Same'],['diff','🔀 Different']],p:(b,t)=>[m1,m2].forEach((ms,h)=>ms.forEach((m,j)=>S.n('piano',m,t+h*(n*.32+.8)+j*.32,.4,.7,b)))}}},
 {id:'higher',e:'⬆️',t:'Which is Higher',lv:'2345',g:(L,S)=>{const a=pick(['first','second']),m1=55+(Math.random()*15|0),d=[0,7,7,5,3,2][Math.min(L,5)]+(Math.random()*4|0),m2=a==='second'?m1+d:m1-d;return{q:'Which note is higher?',a,ch:[['first','1️⃣ First note'],['second','2️⃣ Second note']],p:(b,t)=>{S.n('piano',m1,t,.7,.7,b);S.n('piano',m2,t+.9,.7,.7,b)}}}},
 {id:'majmin',e:'😊',t:'Major or Minor',lv:'345',g:(L,S)=>{const a=pick(['maj','min']),rt=55+(Math.random()*10|0),iv=a==='maj'?[0,4,7]:[0,3,7];return{q:'Does this chord sound happy (major) or sad (minor)?',a,ch:[['maj','😊 Major (happy)'],['min','😢 Minor (sad)']],p:(b,t)=>{iv.forEach((x,j)=>{S.n('piano',rt+x,t+j*.32,.5,.7,b);S.n('piano',rt+x,t+1.1,1.4,.55,b)})}}}},
 {id:'interval',e:'📏',t:'Name the Interval',lv:'45',g:(L,S)=>{const A=L>=5?[[1,'Half step'],[2,'Whole step'],[3,'Minor 3rd'],[4,'Major 3rd'],[5,'Perfect 4th'],[7,'Perfect 5th'],[9,'Major 6th'],[12,'Octave']]:[[2,'2nd (step)'],[4,'3rd'],[5,'4th'],[7,'5th'],[12,'Octave']],x=pick(A),rt=55+(Math.random()*12|0),ch=L>=5?[x,...shuffle(A.filter(y=>y!==x)).slice(0,3)].sort((p,q)=>p[0]-q[0]):A;return{q:'How far apart are these two notes?',a:x[0],ch:ch.map(([v,l])=>[v,l]),p:(b,t)=>{S.n('piano',rt,t,.7,.7,b);S.n('piano',rt+x[0],t+.8,.7,.7,b);S.n('piano',rt,t+1.7,1.2,.55,b);S.n('piano',rt+x[0],t+1.7,1.2,.55,b)}}}},
 {id:'solfa',e:'✋',t:'Do-Re-Mi Echo',lv:'345',g:(L,S)=>{const set=L<=3?[0,2,4,7]:[0,1,2,3,4,5,6,7],a=pick(set.slice(1)),rt=L>=5?pick([55,57,60,62,64]):60;return{q:'You hear Do first. Which step comes next?',a,ch:set.map(j=>[j,`<span class="mu-hand" style="--r:${HS[j][3]}" aria-hidden="true">${HS[j][1]}</span> ${HS[j][0]}${j===7?'′':''}`,SCC[j]]),p:(b,t)=>{S.n('piano',rt,t,.7,.7,b);S.n('piano',rt+SC[a],t+.9,.9,.7,b)}}}}];
H.register({id:'music-ear',cat:'music',icon:'👂',title:'Ear Games',desc:'High or low, loud or soft, major or minor',levels:'12345',isNew:true,open(api){
 const S=ses(api),st=api.store,L=Math.min(5,api.level),n=L===1?7:10;
 const menu=()=>{api.title('Ear Games');api.status('⭐ '+starsOf(st));const s=st.get('stars',{}),gs=EG.filter(g=>g.lv.includes(String(L))),r=api.html(`<div class="mu"><p class="hub-q">Pick a listening game 👂</p><div class="mu-songs">${gs.map(g=>`<button type="button" class="mu-song" data-id="${g.id}"><b aria-hidden="true">${g.e}</b><span>${g.t}</span><small>${s[g.id]?'⭐'.repeat(s[g.id]):'♪ New'}</small></button>`).join('')}</div></div>`);$$('.mu-song',r).forEach(b=>b.onclick=()=>game(EG.find(g=>g.id===b.dataset.id)))};
 const game=g=>{api.title(g.e+' '+g.t);const r=api.html('<div class="mu"><div class="hub-card mu-qz"></div></div>'),el=$('.mu-qz',r);quiz(api,S,el,{n,gen:()=>g.g(L,S),done:pct=>{const s=result(api,el,pct,()=>game(g),menu);star(st,g.id,s);api.status('⭐ '+starsOf(st))}})};
 menu()}});
const CLEF={tr:'<path d="M31 76c-7 0-7-8 0-9c8-1 11 8 7 13c-7 7-18 3-18-8c0-12 14-20 22-30c7-8 7-20 0-20c-7 0-9 10-8 20l5 58c1 8-4 12-9 11c-5-1-7-7-2-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',ba:'<path d="M17 52c0-9 9-14 17-12c9 2 11 13 5 23c-5 8-14 14-23 18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="19" cy="52" r="5" fill="currentColor"/><circle cx="50" cy="46" r="2.7" fill="currentColor"/><circle cx="50" cy="58" r="2.7" fill="currentColor"/>'};
const staff=(cl,n)=>{const p=DI(n)-DI(cl==='tr'?'E4':'G2'),y=88-p*6,x=170,led=[];for(let k=-2;k>=p;k-=2)led.push(88-k*6);for(let k=10;k<=p;k+=2)led.push(88-k*6);return`<svg class="mu-staff" viewBox="0 0 300 134" role="img" aria-label="A note on the ${cl==='tr'?'treble':'bass'} clef staff">${[0,1,2,3,4].map(i=>`<line x1="8" x2="292" y1="${40+i*12}" y2="${40+i*12}" stroke="currentColor" stroke-width="1.7"/>`).join('')}${CLEF[cl]}${led.map(v=>`<line x1="${x-17}" x2="${x+17}" y1="${v}" y2="${v}" stroke="currentColor" stroke-width="1.7"/>`).join('')}<ellipse cx="${x}" cy="${y}" rx="8.5" ry="7" transform="rotate(-20 ${x} ${y})" fill="var(--lv)" stroke="currentColor" stroke-width="1.2"/><line x1="${p<4?x+7.7:x-7.7}" x2="${p<4?x+7.7:x-7.7}" y1="${y}" y2="${p<4?y-38:y+38}" stroke="currentColor" stroke-width="2"/></svg>`};
H.register({id:'music-notes',cat:'music',icon:'🎼',title:'Note Reading & Do-Re-Mi',desc:'Read notes on the staff and sing with hand signs',levels:'345',isNew:true,open(api){
 const S=ses(api),st=api.store,L=Math.min(5,api.level);let tab='name',cl=st.get('clef','tr'),prev='';
 const RG={tr:L>=5?['G3','C6']:L>=4?['A3','A5']:['C4','G5'],ba:L>=5?['C2','E4']:['F2','C4']},pool=c=>{const out=[];for(let i=DI(RG[c][0]);i<=DI(RG[c][1]);i++)out.push(DN(i));return out};
 const r=api.html(`<div class="mu"><div class="hub-card">${seg('tab',[['name','🎼 Name it'],['play','🎹 Play it'],['solfa','✋ Do-Re-Mi']],tab,'Game')}${L>=4?seg('clef',[['tr','Treble clef'],['ba','Bass clef']].concat(L>=5?[['mix','Both']]:[]),cl,'Clef'):''}</div><div class="hub-card mu-qz"></div></div>`),el=$('.mu-qz',r);
 const pickNote=()=>{const c=L<4?'tr':cl==='mix'?pick(['tr','ba']):cl;let n;do n=pick(pool(c));while(n===prev);prev=n;return[c,n]};
 const done=pct=>{const s=result(api,el,pct,run);star(st,tab+cl,s);api.status('⭐ '+starsOf(st))};
 const ladder=()=>{el.qz=0;el.innerHTML=`<p class="hub-q">Sing up the ladder with hand signs ✋</p><div class="mu-lad">${HS.map(([s,e,d,rt],j)=>`<button type="button" class="mu-rung" data-j="${j}" style="--i:${j};--c:${SCC[j]}"><span class="mu-hand" style="--r:${rt}" aria-hidden="true">${e}</span><b>${s}${j===7?'′':''}</b><small>${j+1} · ${d}</small></button>`).join('')}</div><div class="hub-row"><button type="button" class="hub-btn primary mu-scale">▶ Sing the scale</button><button type="button" class="hub-btn mu-echo">🎯 Echo quiz</button></div>`;
  const rungs=$$('.mu-rung',el),lit=j=>{rungs.forEach((x,k)=>x.classList.toggle('on',k===j))};
  rungs.forEach(b=>b.onclick=()=>{const j=+b.dataset.j;S.n('piano',60+SC[j],null,.8,.75);lit(j);api.after(500,()=>lit(-1))});
  $('.mu-scale',el).onclick=()=>{const b=S.one(),t=S.now()+.1;[0,1,2,3,4,5,6,7,7,6,5,4,3,2,1,0].forEach((j,k)=>{S.n('piano',60+SC[j],t+k*.45,.5,.7,b);S.at(t+k*.45,()=>lit(j))});S.at(t+16*.45,()=>lit(-1))};
  $('.mu-echo',el).onclick=()=>quiz(api,S,el,{n:10,gen:()=>EG.find(g=>g.id==='solfa').g(L,S),done:pct=>{const s=result(api,el,pct,ladder);star(st,'solfa',s);api.status('⭐ '+starsOf(st))}})};
 const run=()=>tab==='solfa'?ladder():quiz(api,S,el,{n:10,gen:()=>{const[c,nn]=pickNote(),oc=nn[1];return{q:tab==='name'?'What is the name of this note?':'Find this note on the xylophone!',a:nn[0],show:staff(c,nn),ch:tab==='name'?'CDEFGAB'.split('').map(k=>[k,k,KC[k]]):null,xy:tab==='play'?xylo(['C4','D4','E4','F4','G4','A4','B4'],'let',1):null,tap:v=>S.n(tab==='play'?'marimba':'piano',toMidi(tab==='play'?v+oc:nn),null,.8,.75)}},done});
 bind(r,S,{tab:v=>{tab=v;run()},clef:v=>{cl=v;st.set('clef',v);run()}});api.status('⭐ '+starsOf(st));run()}});
H.register({id:'music-calm',cat:'music',icon:'🌙',title:'Calm Music',desc:'Gentle lullabies and dreamy sounds with a sleep timer',levels:'17',isNew:true,open(api){
 const S=ses(api),st=api.store;let mood=st.get('mood','lull'),tm=st.get('tm',api.level===1?'15':'0'),rain=st.get('rain','off'),K=null,rn=null,end=0,fad=0,br=0;
 const MO={lull:{bpm:58,B:3,pr:['C','Am','F','G'],sc:[60,62,64,67,69,72,74,76],mi:'box',p:.7},dream:{bpm:52,B:4,pr:['Fmaj7','Em7','Dm7','Cmaj7'],sc:[60,62,64,67,69,72,74,76],mi:'piano',p:.4},star:{bpm:48,B:4,pr:['C','Em','Am','F'],sc:[72,74,76,79,81,84,86,88],mi:'bell',p:.3}};
 const cg=S.c.createGain();cg.connect(S.out);SND()&&SND().preload(['strings','musicbox','glockenspiel']);
 const r=api.html(`<div class="mu"><div class="mu-sky">${Array.from({length:28},()=>`<i class="mu-star" style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${(Math.random()*3).toFixed(2)}s"></i>`).join('')}<div class="mu-moon"><span class="mu-br${api.level===1?' big':''}">${api.level===1?'😴':'🌙'}</span></div></div><div class="hub-card"><div class="hub-row"><button type="button" class="hub-btn primary mu-go">▶ Play</button><span class="hub-tag mu-left">No timer</span></div>${seg('mood',[['lull','🌙 Lullaby'],['dream','☁️ Dreamy'],['star','✨ Starlight']],mood,'Mood')}${seg('tm',[['0','∞ No timer'],['5','5 min'],['10','10 min'],['15','15 min'],['30','30 min']],tm,'Sleep timer')}${seg('rain',[['off','🌙 Quiet night'],['on','🌧️ Soft rain']],rain,'Rain')}${volUI()}</div></div>`);
 const go=$('.mu-go',r),sky=$('.mu-sky',r),left=$('.mu-left',r),bt=$('.mu-br',r);
 const rainOn=()=>{rn&&(rn.stop(),rn=null);if(rain!=='on'||!K)return;const c=S.c,s=c.createBufferSource(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),g=c.createGain();s.buffer=S.E.noise();s.loop=true;hp.type='highpass';hp.frequency.value=400;lp.type='lowpass';lp.frequency.value=2200;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.07,c.currentTime+2);s.connect(hp).connect(lp).connect(g).connect(cg);s.start();rn=s};
 const stop=msg=>{K&&K.stop();K=null;rn&&(rn.stop(),rn=null);sky.classList.remove('on');go.textContent='▶ Play';left.textContent=msg||'No timer';bt.textContent=api.level===1?'😴':'🌙'};
 const start=()=>{K&&K.stop();const M=MO[mood];let b=0,ix=3;cg.gain.cancelScheduledValues(S.now());cg.gain.setValueAtTime(1,S.now());fad=0;end=+tm?Date.now()+tm*60000:0;sky.classList.add('on');go.textContent='⏸ Pause';br=0;
  K=clock(S,api,(t,bus)=>{const sp=60/M.bpm,bar=Math.floor(b/M.B),ib=b%M.B,ch=chord(M.pr[bar%M.pr.length]);
   ib===0&&(ch.iv.forEach(iv=>S.n('pad',vc(ch.p+iv,57),t,sp*M.B+.4,.8,bus)),S.n('pluck',vc(ch.p,40),t,sp*M.B,.3,bus));
   if(!(bar%4===3&&ib>0)&&Math.random()<M.p){const ct=M.sc.map((m,j)=>ch.iv.some(iv=>(ch.p+iv)%12===m%12)?j:-1).filter(j=>j>=0);ix=ib===0?ct.reduce((a,j)=>Math.abs(j-ix)<Math.abs(a-ix)?j:a,ct[0]):Math.max(0,Math.min(M.sc.length-1,ix+pick([-2,-1,-1,1,1,2])));S.n(M.mi,M.sc[ix],t,sp*(Math.random()<.3?2:1),.45,bus)}
   b++;return t+sp},cg);rainOn()};
 const tick=()=>{if(!K)return;if(!end)return left.textContent='No timer';const ms=end-Date.now(),s=Math.max(0,Math.ceil(ms/1000));left.textContent=`⏲ ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} left`;api.status(left.textContent);ms<=30000&&!fad&&(fad=1,cg.gain.setTargetAtTime(0,S.now(),7));ms<=0&&(stop('Sweet dreams 🌙'),api.status(''))};
 go.onclick=()=>K?stop():(start(),tick());api.every(1000,tick);
 api.every(4000,()=>{K&&api.level!==1&&(bt.textContent=(br=!br)?'Breathe out…':'Breathe in…')});
 bind(r,S,{mood:v=>{mood=v;st.set('mood',v);K&&start()},tm:v=>{tm=v;st.set('tm',v);end=+v&&K?Date.now()+v*60000:0;fad&&(fad=0,cg.gain.cancelScheduledValues(S.now()),cg.gain.setTargetAtTime(1,S.now(),.5))},rain:v=>{rain=v;st.set('rain',v);rainOn()}})}});
const CSS=`.mu{width:100%;max-width:62rem;display:flex;flex-direction:column;gap:1rem;align-items:stretch}
.mu .hub-card{display:flex;flex-direction:column;gap:.85rem}
.mu-seg{display:flex;flex-wrap:wrap;gap:.45rem;justify-content:center}
.mu-seg button{font:700 .95rem var(--ui-sans,system-ui);min-height:2.75rem;padding:.45rem .95rem;border-radius:999px;border:1px solid var(--ui-border);background:var(--ui-surface-2);color:var(--ui-text);cursor:pointer}
.mu-seg button[aria-pressed=true]{background:var(--lv);border-color:var(--lv);color:#0E1116}
body.light-mode .mu-seg button[aria-pressed=true]{color:#fff}
.mu-lab{display:flex;align-items:center;gap:.7rem;width:100%;max-width:30rem;margin:0 auto;font:700 .95rem var(--ui-sans,system-ui);color:var(--ui-muted)}
.mu-lab input{flex:1;min-width:0;height:2.75rem;accent-color:var(--lv);cursor:pointer}
.mu-lab>span{min-width:7rem}
.mu-lab output{min-width:4.2rem;text-align:right;color:var(--ui-text)}
.mu-src{font-size:.85rem;text-align:center;margin:0}
.mu-songs{display:grid;gap:.8rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,9.5rem),1fr))}
.mu-song{--c:var(--lv);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;min-height:8.5rem;padding:.9rem .7rem;border-radius:var(--ui-r-lg,20px);border:2px solid color-mix(in srgb,var(--c) 50%,var(--ui-border));background:linear-gradient(160deg,color-mix(in srgb,var(--c) 24%,var(--ui-surface)),var(--ui-surface) 70%);color:var(--ui-text);font:700 1rem/1.2 var(--ui-round,var(--ui-sans));cursor:pointer;box-shadow:0 .2rem 0 color-mix(in srgb,var(--c) 50%,var(--ui-border));transition:transform .15s;text-align:center}
.mu-song b{font-size:2.5rem;line-height:1}
.mu-song small{font:500 .8rem var(--ui-sans,system-ui);color:var(--ui-muted)}
@media (hover:hover){.mu-song:hover{transform:translateY(-.15rem)}}
.mu-song:active{transform:scale(.97)}
.mu-lyr{position:relative;max-height:15rem;overflow:auto;text-align:center;font:700 clamp(1.25rem,4.2vw,1.95rem)/1.55 var(--ui-round,var(--ui-sans));padding:.4rem;scroll-behavior:smooth}
.mu-one{max-height:none;overflow:visible}
.mu-line{display:block;margin:.15rem 0}
.mu-w{display:inline-block;padding:0 .12em;border-radius:.4em;transition:transform .15s,color .15s,background-color .15s}
.mu-w:has(.on){color:var(--lv);background:color-mix(in srgb,var(--lv) 15%,transparent);transform:scale(1.12)}
.mu-s.done{color:var(--ui-muted)}
.mu-s.on{text-decoration:underline .12em;text-underline-offset:.2em}
.mu-count{font:800 3rem/1 var(--ui-round,var(--ui-sans));text-align:center;color:var(--lv)}
.mu-count:empty{display:none}
.mu-now{min-height:5rem;display:flex;flex-direction:column;gap:.5rem;justify-content:center}
.mu-now .hub-q{margin:0 auto}
.mu-xy{display:flex;align-items:center;justify-content:center;gap:clamp(.3rem,1vw,.7rem);height:17rem;padding:1rem;border-radius:var(--ui-r-lg,20px);background:var(--ui-surface-2);border:1px solid var(--ui-border);touch-action:none;user-select:none;-webkit-user-select:none}
.mu-small{height:12rem}
.mu-k{--c:#E8453C;position:relative;flex:1 1 0;max-width:5.5rem;min-width:2.75rem;height:calc(var(--h)*1%);border:0;border-radius:.8rem;background:linear-gradient(180deg,color-mix(in srgb,var(--c) 70%,#fff),var(--c) 35%,color-mix(in srgb,var(--c) 82%,#000));box-shadow:inset 0 -.35rem 0 rgba(0,0,0,.18),0 .25rem .5rem rgba(0,0,0,.25);color:var(--kt,#1B1B1B);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:.1rem;padding:.5rem .15rem;font:800 1rem var(--ui-round,var(--ui-sans));cursor:pointer;transition:transform .08s,filter .08s}
.mu-k::before{content:"";position:absolute;left:50%;top:.7rem;width:.55rem;height:.55rem;margin-left:-.275rem;border-radius:50%;background:rgba(255,255,255,.75);box-shadow:inset 0 .1rem .1rem rgba(0,0,0,.35)}
.mu-k span{pointer-events:none}
.mu-kn{font-size:clamp(.85rem,2.3vw,1.15rem)}
.mu-kl{font-size:.8rem;opacity:.85}
.mu-k.hit{transform:scale(.95) translateY(.15rem);filter:brightness(1.25)}
.mu-k.glow{outline:.25rem solid #fff;outline-offset:.15rem;box-shadow:0 0 1.4rem .45rem var(--c);animation:muGlow 1s ease-in-out infinite}
body.light-mode .mu-k.glow{outline-color:#1B1B1B}
.mu-k.no{animation:muNo .35s}
.mu-k.ok{outline:.25rem solid var(--ui-ok);outline-offset:.15rem}
.mu-k.bad{outline:.25rem solid var(--ui-bad);outline-offset:.15rem}
@keyframes muGlow{50%{transform:translateY(-.4rem) scale(1.04)}}
@keyframes muNo{25%{transform:translateX(-.3rem)}75%{transform:translateX(.3rem)}}
@media (max-width:37.5rem){.mu-xy{flex-direction:column-reverse;height:auto;padding:.7rem}.mu-k{flex:0 0 auto;width:calc(var(--h)*1%);max-width:none;height:2.95rem;min-height:2.75rem;flex-direction:row;justify-content:center;gap:.7rem;padding:0 1rem}.mu-k::before{left:.9rem;top:50%;margin:-.275rem 0 0}.mu-k.glow{animation-name:muGlowX}}
@media (max-width:37.5rem){.mu .mu-ch.n7{grid-template-columns:repeat(4,1fr)}.mu-scroll{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;padding-bottom:.4rem;scrollbar-width:thin}.mu-scroll button{flex:0 0 auto}.mu-xy{gap:.3rem}.mu-k{height:2.75rem}.mu-kn{font-size:1.15rem}.mu-kl{font-size:.95rem}}
@keyframes muGlowX{50%{transform:translateX(.4rem) scale(1.03)}}
.mu-grid{display:grid;grid-template-columns:5.4rem repeat(16,minmax(2.75rem,1fr));gap:.3rem;overflow-x:auto;padding:.2rem .2rem .5rem}
.mu-pad{position:sticky;left:0;z-index:1;display:flex;align-items:center;gap:.3rem;min-height:2.75rem;padding:0 .45rem;border-radius:.7rem;border:2px solid var(--c);background:var(--ui-surface);color:var(--ui-text);font:700 .85rem var(--ui-sans,system-ui);cursor:pointer}
.mu-pad span{font-size:1.15rem}
.mu-st{min-height:2.75rem;border-radius:.6rem;border:2px solid color-mix(in srgb,var(--c) 40%,var(--ui-border));background:var(--ui-surface-2);cursor:pointer;touch-action:manipulation;transition:transform .08s,filter .08s}
.mu-st.b4{background:color-mix(in srgb,var(--ui-text) 9%,var(--ui-surface-2))}
.mu-st[aria-pressed=true]{background:var(--c);border-color:var(--c);box-shadow:inset 0 -.2rem 0 rgba(0,0,0,.2)}
.mu-st.ph{outline:.17rem solid var(--ui-text);outline-offset:-.1rem}
.mu-st.ph[aria-pressed=true]{transform:scale(1.1);filter:brightness(1.2)}
.mu-stats{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;justify-content:center;font:700 .95rem var(--ui-sans,system-ui);color:var(--ui-muted)}
.mu-stats b{color:var(--ui-text);font-size:1.15rem}
.mu .mu-lane{display:block;width:100%;height:8rem!important;border-radius:var(--ui-r,14px);background:var(--ui-surface-2);border:1px solid var(--ui-border)}
.mu-jd{font:800 clamp(1.2rem,4vw,1.7rem) var(--ui-round,var(--ui-sans));text-align:center;min-height:2.2rem}
.mu-jd.p{color:var(--ui-ok)}.mu-jd.g{color:#D9A400}.mu-jd.m{color:var(--ui-muted)}
.mu-tap{min-height:7rem;width:100%;font:800 2rem var(--ui-round,var(--ui-sans));border-radius:var(--ui-r-lg,20px);border:3px solid var(--lv);background:color-mix(in srgb,var(--lv) 18%,var(--ui-surface));color:var(--ui-text);cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.mu-tap.hit{animation:muTap .15s}
@keyframes muTap{50%{transform:scale(.97);background:color-mix(in srgb,var(--lv) 40%,var(--ui-surface))}}
.mu-ch{display:grid;gap:.7rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,8.5rem),1fr));width:100%}
.mu-ch .hub-choice{min-height:4.5rem}
.mu-ch.n7{grid-template-columns:repeat(7,1fr)}
.mu-ch .hub-choice[style*="--c"]{border-color:var(--c);box-shadow:0 3px 0 var(--c)}
.mu-ch .hub-choice.ok{border-color:var(--ui-ok)}.mu-ch .hub-choice.bad{border-color:var(--ui-bad)}
.mu-qz .hub-q,.mu .hub-q{margin:0 auto}
.mu-res{display:flex;flex-direction:column;gap:1rem;align-items:center}
.mu-staff{display:block;width:100%;max-width:26rem;margin:0 auto;color:var(--ui-text)}
.mu-hand{display:inline-block;transform:rotate(var(--r,0deg));font-size:1.5em;line-height:1}
.mu-lad{display:flex;flex-direction:column-reverse;gap:.4rem}
.mu-rung{display:flex;align-items:center;gap:.8rem;min-height:3rem;margin-left:calc(var(--i)*clamp(.4rem,2vw,1.4rem));padding:.3rem 1rem;border-radius:999px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 14%,var(--ui-surface));color:var(--ui-text);font:800 1.15rem var(--ui-round,var(--ui-sans));cursor:pointer;text-align:left;transition:transform .15s,background-color .15s}
.mu-rung b{min-width:2.5rem}
.mu-rung small{font:500 .82rem var(--ui-sans,system-ui);color:var(--ui-muted)}
.mu-rung.on{background:var(--c);transform:scale(1.03);transform-origin:left center}
.mu-rung.on small,.mu-rung.on b{color:#111}
.mu-sky{position:relative;height:15rem;border-radius:var(--ui-r-lg,20px);overflow:hidden;background:radial-gradient(circle at 50% 120%,#3b2f7a,#141434 55%,#0a0b1e);display:grid;place-items:center}
body.light-mode .mu-sky{background:radial-gradient(circle at 50% 120%,#ffd9c2,#b9c7ff 55%,#8fa4e8)}
.mu-moon{width:7.5rem;height:7.5rem;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fffbe7,#f7e7a1 55%,#e8c95b);box-shadow:0 0 3rem 1rem rgba(255,236,170,.3);display:grid;place-items:center;color:#4a3b12;font:700 1rem var(--ui-round,var(--ui-sans));text-align:center;transform:scale(.85)}
.mu-sky.on .mu-moon{animation:muBreath 8s ease-in-out infinite}
.mu-br{font-size:1.05rem;padding:0 .4rem}
.mu-br.big{font-size:2.7rem}
.mu-star{position:absolute;width:.22rem;height:.22rem;border-radius:50%;background:#fff;opacity:.8;animation:muTw 3s ease-in-out infinite}
@keyframes muBreath{0%,100%{transform:scale(.8)}50%{transform:scale(1.1)}}
@keyframes muTw{50%{opacity:.2}}
@media (prefers-reduced-motion:reduce){.mu *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
html.a11y-rm .mu *{animation:none!important;transition:none!important;scroll-behavior:auto!important}`;
})();
