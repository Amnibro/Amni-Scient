import {closest} from './normalize.js';
import {suffix} from './units.js';
const r4=v=>+(+v).toFixed(4),KM=u=>u==='in'?1/25.4:1,META=new Set(['recipe','new','units','material','finish','name']),RAD=Math.PI/180,SHAFT={in:[0.125,0.1875,0.25,0.3125,0.375,0.5,0.625,0.75,0.875,1,1.25,1.5,2],mm:[3,4,5,8,10,12,14,16,20,25,30,40,50]};
const S=(n,k,d,lo,hi,doc,al=[])=>({n,k,d,lo,hi,doc,al}),shaft=(u,mx)=>SHAFT[u].filter(x=>x<=mx).pop()??SHAFT[u][0];
const DIN=[[8,2,1],[10,3,1.4],[12,4,1.8],[17,5,2.3],[22,6,2.8],[30,8,3.3],[38,10,3.3],[44,12,3.3],[50,14,3.8],[58,16,4.3],[65,18,4.4],[75,20,4.9],[85,22,5.4],[95,25,5.4]],ANSI=[[0.4375,0.09375],[0.5625,0.125],[0.875,0.1875],[1.25,0.25],[1.375,0.3125],[1.75,0.375],[2.25,0.5],[2.75,0.625],[3.25,0.75]];
const keyFor=(b,u)=>{const t=u==='in'?ANSI.find(x=>b<=x[0]+1e-9)||ANSI[ANSI.length-1]:DIN.find(x=>b<=x[0]+1e-9)||DIN[DIN.length-1];return u==='in'?[t[1],t[1]/2]:[t[1],t[2]];},SCREW=(b,u)=>u==='in'?b<=0.5?0.112:b<=0.875?0.164:0.25:b<=8?3:b<=12?4:b<=20?5:8;
const cd=(a,b)=>Math.abs(((a-b+540)%360)-180),far=(n,L)=>L.map(a=>[n?Math.min(...Array.from({length:n},(_,i)=>cd(a,360*i/n))):180,a]).sort((x,y)=>y[0]-x[0])[0][1],BOOL=x=>x===true||/^(true|yes|on|1)$/i.test(String(x)),NONE=x=>x==null||x===''||/^(auto|default|none|null)$/i.test(String(x));
const frac=t=>{const m=/^\s*(?:(\d+)\s*[- ]\s*)?(\d+)\/(\d+)\s*(mm|cm|in|inch|inches|")?\s*$/i.exec(String(t));return m?[(+m[1]||0)+m[2]/m[3],m[4]]:null;},isLen=s=>s.k==='len'||s.k==='lenopt';
function co(s,raw,u){
  const k=s.k;
  if(k==='bool')return BOOL(raw);
  if(k==='enum'){const x=String(raw).toLowerCase(),h=s.lo.find(y=>String(y).toLowerCase()===x)??s.lo.find(y=>String(y)===String(raw).replace(/\D/g,''));if(h===undefined)throw new Error(`${s.n} must be one of ${s.lo.join(', ')} (got ${JSON.stringify(raw)})`);return h;}
  if(k==='str')return String(raw).trim();
  if(k==='lenopt'&&(typeof raw==='boolean'||/^(true|yes|on|false|no|off)$/i.test(String(raw))))return BOOL(raw)?-1:0;
  if(k==='num'&&typeof raw!=='number'){const x=parseFloat(String(raw));if(!isFinite(x))throw new Error(`${s.n} must be a number (got ${JSON.stringify(raw)})`);return x;}
  let n;
  if(typeof raw==='number')n=raw;else{const f=frac(raw);n=f?+suffix(f[0]+(f[1]?' '+f[1]:''),u):+suffix(String(raw).trim(),u);}
  if(!isFinite(n))throw new Error(`${s.n} must be a number (got ${JSON.stringify(raw)})`);
  if(k==='int'&&n!==Math.round(n))throw new Error(`${s.n} must be a whole number (got ${n})`);
  return n;
}
const rel=(g,val,ref,base)=>g!==undefined?r4(val):`@${ref}*${r4(val/base)}`,show=(v,u)=>+(+v).toFixed(3)+' '+u;
function parse(R,a,u){
  const K=KM(u),v={},W=[],E=[],tab=new Map(R.in.flatMap(s=>[s.n,...s.al].map(x=>[x.toLowerCase().replace(/[^a-z0-9]/g,''),s])));
  for(const[key,raw]of Object.entries(a)){
    if(META.has(key)||NONE(raw))continue;
    const s=tab.get(key.toLowerCase().replace(/[^a-z0-9]/g,''));
    if(!s){const c=closest(key,R.in.map(x=>x.n));W.push(`unknown option "${key}" ignored; ${c?`closest is "${c}"`:'options: '+R.in.map(x=>x.n).join(', ')}`);continue;}
    try{
      const x=co(s,raw,u),L=isLen(s),lo=L?s.lo*K:s.lo,hi=L?s.hi*K:s.hi,dis=y=>L?show(y,u):y;
      if(L&&x<0&&!(s.k==='lenopt'&&x===-1))throw new Error(`${s.n} cannot be negative (got ${x})`);
      if(['len','int','num','lenopt'].includes(s.k)&&typeof lo==='number'&&!(s.k==='lenopt'&&x<=0)&&(x<lo-1e-9||x>hi+1e-9))throw new Error(`${s.n} ${dis(x)} is outside the allowed ${dis(lo)} to ${dis(hi)}`);
      v[s.n]=x;
    }catch(e){E.push(e.message);}
  }
  for(const s of R.in)v[s.n]===undefined&&s.d!=null&&(v[s.n]=typeof s.d==='object'?s.d[u]:s.k==='len'?s.d*K:s.d);
  return{v,W,E};
}
function bore(c,v,o){
  const u=c.u,ps=[['bore',v.bore,'shaft bore diameter']],fs=[{type:'cylinder',name:`${c.t}: bore`,r:'@bore/2',h:o.h,z:o.z,op:'cut'}],sa=v.set_screw?far(o.n||0,[0,90,180,270]):null;
  if(!(v.bore>0))throw new Error('bore must be above 0');
  if(v.bore>=o.hub*0.8)throw new Error(`bore ${show(v.bore,u)} is too large for the ${show(o.hub,u)} ${o.what}; use a bore under ${show(o.hub*0.8,u)} or a bigger ${o.what}`);
  if(v.keyway){
    if(v.bore<(u==='in'?0.3125:7)-1e-9)throw new Error(`a keyway needs a bore of at least ${u==='in'?'5/16 in':'7 mm'} (got ${show(v.bore,u)})`);
    const[kw,kd]=keyFor(v.bore,u);
    if(v.bore/2+kd>=o.hub/2*0.94)throw new Error(`the ${o.what} (${show(o.hub,u)}) is too small for a keyway on a ${show(v.bore,u)} bore; use a bigger ${o.what} or a smaller bore`);
    ps.push(['key_w',r4(kw),'keyway width'],['key_d',r4(kd),'keyway depth above the bore']);
    fs.push({type:'extrude',name:`${c.t}: keyway`,plane:'XY',offset:o.z,depth:o.h,op:'cut',shapes:[{k:'rect',w:'@key_w',h:'@bore/2+@key_d',x:0,y:'(@bore/2+@key_d)/2',a:far(o.n||0,[0,45,90,135,180,225,270,315].filter(a=>sa==null||cd(a,sa)>=60))-90}]});
  }
  if(v.set_screw){
    const L='('+o.he+')/2+@ss_d',Y=sa%180!==0;
    ps.push(['ss_d',SCREW(v.bore,u),'set screw hole diameter']);
    fs.push({type:'cylinder',name:`${c.t}: set screw`,r:'@ss_d/2',h:L,axis:Y?'Y':'X',x:!Y&&sa===180?`-(${L})`:0,y:Y&&sa===270?`-(${L})`:0,z:o.zc,op:'cut'});
  }
  return{ps,fs};
}
const OPT=[S('keyway','bool',false,0,0,'cut a standard keyway in the bore (ANSI B17.1 inch, DIN 6885 metric)'),S('set_screw','bool',false,0,0,'drill a radial set screw hole into the bore')];
function axial(v,c,prop){
  const u=c.u,D=v.diameter,R=D/2,n=v.blades,hub=v.hub??D*(prop?0.16:0.28),pitch=v.pitch??D*(prop?0.7:1),ch=v.chord??D*(prop?0.12:0.2),ct=v.tip_chord??ch*(prop?0.5:0.6),rm=prop?55:45,r0=hub*0.375,code=v.airfoil||(prop?'clarky':'4412');
  if(hub<D*0.1||hub>D*0.6)throw new Error(`hub ${show(hub,u)} must be 0.1 to 0.6 of the diameter (${show(D*0.1,u)} to ${show(D*0.6,u)})`);
  if(!/^(\d{4}|clarky)$/i.test(code))throw new Error(`airfoil must be a NACA 4-digit code such as 4412 or clarky (got ${code})`);
  const an=r=>Math.min(rm,Math.max(5,Math.atan(pitch/(2*Math.PI*r))/RAD)),zx=(q,r)=>q*(Math.sin(an(r)*RAD)+0.14*Math.cos(an(r)*RAD)),hh=v.hub_height??r4(Math.max(zx(ch,r0)*1.1,hub*0.4)),bo=v.bore??shaft(u,hub*0.33);
  const B=bore(c,{...v,bore:bo},{hub,he:'@hub',what:'hub',z:'-@hub_h*0.6',h:'@hub_h*1.2',zc:0,n});
  const T=[0,0.2,0.45,0.72,1],secs=T.map(t=>{const off=`@hub*0.375+(@dia/2-@hub*0.375)*${t}`,CH=`@chord+(@tip_chord-@chord)*${t}`,AN=`min(${rm},max(5,atan(@pitch/(2*PI*(${off})))))`;return{offset:off,shapes:[{k:'airfoil',code,chord:CH,a:AN,x:`-0.25*(${CH})*cos(${AN})`,y:`-0.25*(${CH})*sin(${AN})`,n:10}]};});
  const ps=[['dia',D,'overall diameter'],['blades',n,'blade count'],['hub',rel(v.hub,hub,'dia',D),'hub diameter'],['hub_h',rel(v.hub_height,hh,'dia',D),'hub height'],['chord',rel(v.chord,ch,'dia',D),'root chord'],['tip_chord',rel(v.tip_chord,ct,'dia',D),'tip chord'],['pitch',rel(v.pitch,pitch,'dia',D),'geometric pitch: advance per revolution; sets the blade twist'],...B.ps],fs=[{type:'cylinder',name:`${c.t}: hub`,r:'@hub/2',h:'@hub_h',z:'-@hub_h/2'},{type:'loft',name:`${c.t}: blade`,ref:'blade',plane:'YZ',sections:secs},{type:'pattern',name:`${c.t}: blades`,of:['#blade'],kind:'circular',n:'@blades',axis:'Z',angle:360}];
  if(v.shroud){
    const rw=v.shroud>0?v.shroud:D*0.04,rh=r4(Math.max(zx(ct,R)*1.25,rw*2));
    ps.push(['ring',v.shroud>0?r4(rw):`@dia*${r4(rw/D)}`,'shroud ring wall'],['ring_h',`@dia*${r4(rh/D)}`,'shroud ring height']);
    fs.push({type:'extrude',name:`${c.t}: shroud`,plane:'XY',offset:'-@ring_h/2',depth:'@ring_h',shapes:[{k:'circle',r:'@dia/2+@ring/2'},{k:'circle',r:'@dia/2-@ring/2',hole:true}]});
  }
  return{ps,fs:[...fs,...B.fs]};
}
const AXOPT=[S('diameter','len',{in:8,mm:200},20,2000,'overall diameter, tip to tip',['dia','d','od','size']),S('blades','int',null,2,24,'blade count',['n','blade_count','nblades','num_blades','number_of_blades']),S('hub','len',null,2,1000,'hub diameter (default 0.28 x diameter, propeller 0.16)',['hub_diameter','hub_dia']),S('hub_height','len',null,1,500,'hub height (default fits the blade root)',['hub_h','hub_length']),S('bore','len',null,1,500,'shaft bore (default: standard shaft size that fits the hub)',['shaft','shaft_diameter','bore_diameter']),S('pitch','len',null,5,5000,'geometric pitch (advance per revolution) that sets the blade twist (fan default 1.0 x diameter, propeller 0.7 x)',[]),S('chord','len',null,1,1000,'blade root chord',['root_chord']),S('tip_chord','len',null,0.5,1000,'blade tip chord',[]),S('airfoil','str',null,0,0,'NACA 4-digit code or clarky (fan 4412, propeller clarky)',['naca','foil']),S('shroud','lenopt',0,1,200,'true or a wall thickness: add a ring around the blade tips (default off)',['ring','tip_ring']),...OPT];
function impeller(v,c){
  const u=c.u,D=v.diameter,n=v.blades,b=v.width??D*0.2,eye=v.eye??D*0.5,hub=v.hub??D*0.24,bt=v.blade_thickness??D*0.03,tb=v.plate??D*0.04,ts=v.shroud_thickness??tb,be=v.beta,cl=v.shroud;
  if(eye>D*0.8||eye<hub+bt*3)throw new Error(`eye ${show(eye,u)} must be between ${show(hub+bt*3,u)} (hub plus blade clearance) and ${show(D*0.8,u)} (0.8 of the diameter)`);
  if(hub>D*0.45)throw new Error(`hub ${show(hub,u)} must be under 0.45 of the diameter (${show(D*0.45,u)})`);
  const bo=v.bore??shaft(u,hub*0.4),B=bore(c,{...v,bore:bo},{hub,he:'@hub',what:'hub',z:'-@plate',h:'@plate+@width*0.5+@plate*2',zc:'@plate+@width*0.25',n:0}),M=12,sg=v.rotation==='cw'?'':'-';
  const pt=i=>{const t=r4(i/(M-1)),r=`@r1*(@r2/@r1)^${t}`,th=`${sg}${t}*log(@r2/@r1)/tan(@beta)*180/PI`;return[`${r}*cos(${th})`,`${r}*sin(${th})`];};
  const ps=[['dia',D,'overall diameter'],['blades',n,'blade count'],['width',rel(v.width,b,'dia',D),'blade height between the plates'],['beta',be,'blade exit angle from the tangent (smaller = more backward curved)'],['eye',rel(v.eye,eye,'dia',D),'inlet eye diameter'],['hub',rel(v.hub,hub,'dia',D),'hub diameter'],['blade_t',rel(v.blade_thickness,bt,'dia',D),'blade thickness'],['plate',rel(v.plate,tb,'dia',D),'backplate thickness'],['r1','@eye/2','blade inlet radius'],['r2','@dia/2-@blade_t/2','blade outlet radius'],...B.ps];
  cl&&ps.push(['shroud_t',v.shroud_thickness!==undefined?r4(ts):'@plate','shroud plate thickness']);
  const fs=[{type:'cylinder',name:`${c.t}: backplate`,r:'@dia/2',h:'@plate'},{type:'cylinder',name:`${c.t}: hub`,r:'@hub/2',h:'@plate+@width*0.5'},{type:'extrude',name:`${c.t}: blade`,ref:'blade',plane:'XY',offset:'@plate*0.5',depth:cl?'@width+@plate*0.5+@shroud_t*0.5':'@width+@plate*0.5',shapes:[{k:'path',pts:Array.from({length:M},(_,i)=>pt(i)),stroke:'@blade_t'}]},{type:'pattern',name:`${c.t}: blades`,of:['#blade'],kind:'circular',n:'@blades',axis:'Z',angle:360}];
  cl&&fs.push({type:'extrude',name:`${c.t}: shroud`,plane:'XY',offset:'@plate+@width',depth:'@shroud_t',shapes:[{k:'circle',r:'@dia/2'},{k:'circle',r:'@eye/2',hole:true}]});
  return{ps,fs:[...fs,...B.fs]};
}
function gear(v,c){
  const u=c.u,k=KM(u),z=v.teeth,a=v.pressure,m=v.module!=null?v.module*k:v.dp!=null?(u==='in'?1:25.4)/v.dp:v.pitch_diameter!=null?v.pitch_diameter/z:u==='in'?1/12:2;
  if(!(m>0.3*k&&m<=25*k))throw new Error(`module ${show(m/k,'mm')} is outside 0.3 to 25 mm (diametral pitch ${r4(25.4/(m/k))}); give module in mm, dp, or pitch_diameter`);
  const rp=m*z/2,rb=rp*Math.cos(a*RAD),ra=rp+m,rf=rp-1.25*m,inv=x=>Math.tan(x)-x,pa=Math.PI/(2*z)+inv(a*RAD)-inv(Math.acos(Math.min(1,rb/ra)));
  if(ra*pa*2<0.12*m){let q=z;while(q<400&&ra*(Math.PI/(2*q)+inv(a*RAD)-inv(Math.acos(Math.min(1,Math.cos(a*RAD)*(q*m/2)/(q*m/2+m)))))*2<0.12*m)q++;throw new Error(`${z} teeth at ${a} degrees pressure angle give pointed teeth; use at least ${q} teeth or a larger pressure angle`);}
  const w=v.width??m*8,hubOn=v.hub!=null&&v.hub!==0,hub=v.hub===-1?rf*1.1:v.hub,hl=v.hub_length??(hubOn?m*4:0);
  if(hubOn&&hub/2>rf-m*0.5)throw new Error(`hub ${show(hub,u)} must be under the root diameter ${show((rf-m*0.5)*2,u)}`);
  if(v.set_screw&&!hubOn)throw new Error('set_screw needs a hub: pass "hub":true (or a diameter)');
  const bo=v.bore??shaft(u,(hubOn?hub:rf*2)*0.4),B=bore(c,{...v,bore:bo},{hub:hubOn?hub:(rf-m*0.5)*2,he:'@hub',what:hubOn?'hub':'root diameter',z:'-@m',h:'@w+@hub_l+@m*2',zc:'@w+@hub_l/2',n:0});
  const SL=[0,0.12,0.28,0.46,0.65,0.83,1],R=s=>`(@r0+(@ra-@r0)*${s})`,AN=s=>`acos(min(1,@rb/${R(s)}))`,PH=s=>`(@phi-(tan(${AN(s)})-${AN(s)}*PI/180)*180/PI)`,P=(sg,s)=>[`${R(s)}*cos(${PH(s)})`,`${sg}${R(s)}*sin(${PH(s)})`],RI='(@rf-0.25*@m)',IN=sg=>[`${RI}*cos(${PH(0)})`,`${sg}${RI}*sin(${PH(0)})`];
  const ps=[['teeth',z,'tooth count'],['m',r4(m),'module = pitch diameter / teeth (document units; 1/diametral pitch for inch)'],['pa',a,'pressure angle'],['w',rel(v.width,w,'m',m),'face width'],['rp','@m*@teeth/2','pitch radius'],['rb','@rp*cos(@pa)','base circle radius'],['ra','@rp+@m','tip radius'],['rf','@rp-1.25*@m','root radius'],['r0','max(@rb,@rf)','where the involute flank starts'],['phi','90/@teeth+(tan(@pa)-@pa*PI/180)*180/PI','half tooth angle at the base circle'],...(hubOn?[['hub',r4(hub),'hub diameter'],['hub_l',r4(hl),'hub length above the face']]:[['hub_l',0,'hub length']]),...B.ps];
  const fs=[{type:'cylinder',name:`${c.t}: body`,r:'@rf',h:'@w'},{type:'extrude',name:`${c.t}: tooth`,ref:'tooth',plane:'XY',depth:'@w',shapes:[{k:'path',pts:[IN('-'),...SL.map(s=>P('-',s)),...[...SL].reverse().map(s=>P('',s)),IN('')]}]},{type:'pattern',name:`${c.t}: teeth`,of:['#tooth'],kind:'circular',n:'@teeth',axis:'Z',angle:360}];
  hubOn&&fs.splice(1,0,{type:'cylinder',name:`${c.t}: hub`,r:'@hub/2',h:'@w+@hub_l'});
  return{ps,fs:[...fs,...B.fs]};
}
const CHAIN={25:[0.25,0.13,0.125],35:[0.375,0.2,0.188],40:[0.5,0.312,0.312],50:[0.625,0.4,0.375],60:[0.75,0.469,0.5],80:[1,0.625,0.625]};
function sprocket(v,c){
  const u=c.u,k=u==='in'?1:25.4,ch=CHAIN[v.chain],p=ch[0]*k,dr=ch[1]*k,z=v.teeth,tw=(ch[2]*0.93-0.006)*k,th=v.thickness??tw,rp=p/(2*Math.sin(Math.PI/z)),ro=p*(0.6+1/Math.tan(Math.PI/z))/2,rs=0.5025*dr+0.0015*k,g=17.5*RAD;
  const hubOn=v.hub!=null&&v.hub!==0,hub=v.hub===-1?Math.max(rp*0.9,rp*2-p*1.5):v.hub,hl=v.hub_length??(hubOn?th*1.2:0);
  if(hubOn&&hub/2>rp-p*0.55)throw new Error(`hub ${show(hub,u)} must be under ${show((rp-p*0.55)*2,u)} so it stays inside the tooth roots`);
  if(v.set_screw&&!hubOn)throw new Error('set_screw needs a hub: pass "hub":true (or a diameter)');
  const bo=v.bore??shaft(u,(hubOn?hub:(rp-p*0.55)*2)*0.4),B=bore(c,{...v,bore:bo},{hub:hubOn?hub:(rp-p*0.55)*2,he:'@hub',what:hubOn?'hub':'root diameter',z:'-@thick*0.1',h:'@thick+@hub_l+@thick*0.2',zc:'@thick+@hub_l/2',n:0});
  const tp=[-1,1].map(s=>[rp-rs*Math.sin(g),s*rs*Math.cos(g)]),dv=s=>[Math.cos(g),s*Math.sin(g)],ex=s=>{const T=tp[s>0?1:0],d=dv(s),bq=T[0]*d[0]+T[1]*d[1],cq=T[0]*T[0]+T[1]*T[1]-(ro+0.08*p)**2,t=-bq+Math.sqrt(bq*bq-cq);return[T[0]+d[0]*t,T[1]+d[1]*t];};
  const seat=Array.from({length:11},(_,i)=>{const t=(90+g/RAD+(180-2*(g/RAD))*i/10)*RAD;return[rp+rs*Math.cos(t),rs*Math.sin(t)];}),Pm=ex(-1),Pp=ex(1),far2=ro*0.25;
  if(Math.atan2(Pp[1],Pp[0])>=Math.PI/z*0.92)throw new Error(`${z} teeth is too few for chain ${v.chain}: the tooth tips would vanish; use at least 9 teeth`);
  const pts=[...seat,Pm,[Pm[0]+far2,Pm[1]],[Pp[0]+far2,Pp[1]],Pp].map(q=>q.map(r4)),ps=[['teeth',z,'tooth count (fixed by the tooth profile; re-run the recipe to change it)'],['thick',r4(th),'sprocket thickness'],['ro',r4(ro),'tip radius'],...(hubOn?[['hub',r4(hub),'hub diameter'],['hub_l',r4(hl),'hub length above the face']]:[['hub_l',0,'hub length']]),...B.ps];
  const fs=[{type:'cylinder',name:`${c.t}: body`,r:'@ro',h:'@thick'},{type:'extrude',name:`${c.t}: tooth gap`,ref:'gap',plane:'XY',offset:'-@thick*0.1',depth:'@thick*1.2',op:'cut',shapes:[{k:'path',pts}]},{type:'pattern',name:`${c.t}: tooth gaps`,of:['#gap'],kind:'circular',n:z,axis:'Z',angle:360}];
  hubOn&&fs.splice(1,0,{type:'cylinder',name:`${c.t}: hub`,r:'@hub/2',h:'@thick+@hub_l'});
  return{ps,fs:[...fs,...B.fs]};
}
function heatsink(v,c){
  const u=c.u,k=KM(u),W=v.width,Dp=v.depth,t=v.base??W*0.1,H=v.height??W*0.45,pin=v.style==='pin',hm=v.mount_holes,hd=v.hole??(u==='in'?0.1875:4.5),mg=hm?hd*2.2:0;
  if(hm&&mg*2>=W*0.45)throw new Error(`mount_holes need a wider base: ${show(W,u)} is too narrow for ${show(hd,u)} holes at each end`);
  const ft=v.fin_thickness??Math.max(W*0.02,0.8*k),pd=v.pin_diameter??Math.max(W*0.05,1.5*k),ps=[['w',W,'base width (X)'],['d',Dp,'base depth (Y)'],['t',rel(v.base,t,'w',W),'base thickness'],['h',rel(v.height,H,'w',W),'fin or pin height above the base']],fs=[{type:'box',name:`${c.t}: base`,w:'@w',d:'@d',h:'@t'}];
  if(hm&&!(hd>0))throw new Error('hole must be above 0');
  if(pin){
    const pitch=v.pitch??pd*2.4,fw=W-2*mg,nx=Math.floor((fw-pd)/pitch+1e-9)+1,ny=Math.floor((Dp-pd)/pitch+1e-9)+1;
    if(pitch<=pd*1.05)throw new Error(`pitch ${show(pitch,u)} must be larger than the pin diameter ${show(pd,u)} so pins do not touch`);
    if(nx<2||ny<2)throw new Error(`the ${show(W,u)} x ${show(Dp,u)} base is too small for pins ${show(pd,u)} on a ${show(pitch,u)} pitch`);
    if(nx*ny>600)throw new Error(`${nx*ny} pins is too many; use a larger pitch or pin diameter`);
    ps.push(['pin_d',r4(pd),'pin diameter'],['pitch',r4(pitch),'pin pitch']);
    ps.push(['rows',ny,'pin rows along Y']);
    fs.push({type:'extrude',name:`${c.t}: pin row`,ref:'row',plane:'XY',offset:'@t*0.9',depth:'@h+@t*0.1',shapes:Array.from({length:nx},(_,i)=>({k:'circle',r:'@pin_d/2',x:`(${i}-${(nx-1)/2})*@pitch`,y:'-(@rows-1)*@pitch/2'}))},{type:'pattern',name:`${c.t}: pin rows`,of:['#row'],kind:'linear',n:'@rows',dx:0,dy:'@pitch',dz:0});
  }else{
    const fw=W-2*mg,n=v.fins??Math.max(3,Math.floor((fw-ft)/(ft+Math.max(ft*2,1.8*k)))+1),pitch=(fw-ft)/(n-1);
    if(n<2||n>80)throw new Error(`fins must be 2 to 80 (got ${n})`);
    if(pitch<=ft*1.2)throw new Error(`${n} fins of ${show(ft,u)} do not fit across ${show(fw,u)}: the gap would be ${show(pitch-ft,u)}; use fewer or thinner fins`);
    ps.push(['fin_t',r4(ft),'fin thickness'],['fins',n,'fin count'],['pitch',`(@w-2*${r4(mg)}-@fin_t)/(@fins-1)`,'fin pitch (centre to centre)']);
    fs.push({type:'box',name:`${c.t}: fin`,ref:'fin',w:'@fin_t',d:'@d',h:'@h+@t*0.1',x:`-(@fins-1)*@pitch/2`,y:0,z:'@t*0.9'},{type:'pattern',name:`${c.t}: fins`,of:['#fin'],kind:'linear',n:'@fins',dx:'@pitch',dy:0,dz:0});
  }
  hm&&(ps.push(['hole',hd,'mounting hole diameter']),fs.push({type:'hole',name:`${c.t}: mounting holes`,plane:'XY',offset:'@t',d:'@hole',thru:true,pts:[['@w/2-'+r4(mg/2),'@d/2-'+r4(mg/2)],['-(@w/2-'+r4(mg/2)+')','@d/2-'+r4(mg/2)],['@w/2-'+r4(mg/2),'-(@d/2-'+r4(mg/2)+')'],['-(@w/2-'+r4(mg/2)+')','-(@d/2-'+r4(mg/2)+')']]}));
  return{ps,fs};
}
function flange(v,c){
  const u=c.u,D=v.diameter,t=v.thickness??D*0.1,bo=v.bore??D*0.38,hub=v.hub??D*0.6,hh=v.hub_height??D*0.12,n=v.bolts,bc=v.bolt_circle??D*0.8,bd=v.bolt_hole??Math.min(Math.max(D*0.07,u==='in'?0.17:4.5),0.5*bc*Math.sin(Math.PI/n));
  if(bo>=hub||hub>=bc-bd*1.5)throw new Error(`need bore ${show(bo,u)} < hub ${show(hub,u)} < bolt circle ${show(bc,u)} minus the bolt hole clearance (${show(bc-bd*1.5,u)})`);
  if(bc+bd*1.5>D)throw new Error(`bolt circle ${show(bc,u)} plus holes ${show(bd,u)} does not fit in the ${show(D,u)} flange; use a smaller bolt circle or a bigger diameter`);
  if(n>2&&bc*Math.sin(Math.PI/n)<bd*1.4)throw new Error(`${n} bolt holes of ${show(bd,u)} do not fit on a ${show(bc,u)} bolt circle; use fewer bolts, smaller holes or a bigger circle`);
  const ps=[['od',D,'outer diameter'],['t',rel(v.thickness,t,'od',D),'flange thickness'],['bore',rel(v.bore,bo,'od',D),'bore diameter'],['hub',rel(v.hub,hub,'od',D),'hub diameter'],['hub_h',rel(v.hub_height,hh,'od',D),'hub height above the flange'],['bolts',n,'bolt hole count'],['bc',rel(v.bolt_circle,bc,'od',D),'bolt circle diameter'],['bolt_d',rel(v.bolt_hole,bd,'od',D),'bolt hole diameter']];
  return{ps,fs:[{type:'cylinder',name:`${c.t}: disc`,r:'@od/2',h:'@t'},{type:'cylinder',name:`${c.t}: hub`,r:'@hub/2',h:'@t+@hub_h'},{type:'cylinder',name:`${c.t}: bore`,r:'@bore/2',h:'@t+@hub_h+@t*0.2',z:'-@t*0.1',op:'cut'},{type:'hole',name:`${c.t}: bolt hole`,ref:'bolt',plane:'XY',offset:'@t',d:'@bolt_d',thru:true,pts:[['@bc/2',0]]},{type:'pattern',name:`${c.t}: bolt circle`,of:['#bolt'],kind:'circular',n:'@bolts',axis:'Z',angle:360}]};
}
const BRG={608:[8,22,7],6000:[10,26,8],6001:[12,28,8],6002:[15,32,9],6003:[17,35,10],6004:[20,42,12],6005:[25,47,12],6200:[10,30,9],6201:[12,32,10],6202:[15,35,11],6203:[17,40,12],6204:[20,47,14],6205:[25,52,15],6206:[30,62,16],6207:[35,72,17],6208:[40,80,18],6301:[12,37,12],6302:[15,42,13],6303:[17,47,14],6304:[20,52,15],6305:[25,62,17],6306:[30,72,19]};
function pillow(v,c){
  const u=c.u,k=KM(u);let id,od,bw;
  if(v.bearing!=null){const b=BRG[(/\d{3,4}/.exec(String(v.bearing))||[''])[0]];if(!b)throw new Error(`bearing ${v.bearing} is not in the table; use one of ${Object.keys(BRG).join(', ')} or give bore`);[id,od,bw]=b.map(x=>x*k);}
  else{const want=(v.bore??(u==='in'?0.75:20))/k,b=Object.values(BRG).find(x=>x[0]>=want-1e-7&&x[1]<x[0]*2.7)||Object.values(BRG).find(x=>x[0]>=want-1e-7);if(!b)throw new Error(`no bearing in the table fits a ${show(want*k,u)} shaft (largest ${Math.max(...Object.values(BRG).map(x=>x[0]))} mm)`);[id,od,bw]=b.map(x=>x*k);}
  const wall=v.wall??od*0.2,W=v.width??bw+Math.max(od*0.14,3*k),L=v.length??(od+2*wall)*2.1,t=v.base??od*0.2,hc=t+od/2+wall*0.2,bd=v.bolt_hole??(od>=40*k?9*k:5.5*k),nb=v.bolts,ps=[['bearing_od',r4(od),'bearing outer diameter (the housing bore)'],['bearing_id',r4(id),'bearing inner diameter (the shaft)'],['bearing_w',r4(bw),'bearing width'],['w',v.width!==undefined?r4(W):`@bearing_w+${r4(W-bw)}`,'housing width along the shaft'],['wall',rel(v.wall,wall,'bearing_od',od),'wall around the bearing'],['l',rel(v.length,L,'bearing_od',od),'base length'],['t',rel(v.base,t,'bearing_od',od),'base thickness'],['hc','@t+@bearing_od/2+@wall*0.2','shaft centre height'],['bolt_d',r4(bd),'mounting bolt hole diameter'],['base_w',`max(@w,@bolt_d*${nb===4?3.4:2})`,'base width across the shaft (widens to fit the bolt holes)']];
  if(L<od+2*wall+bd*4.4)throw new Error(`length ${show(L,u)} is too short for the housing and bolts; use at least ${show(od+2*wall+bd*4.4,u)}`);
  const bx=(L/2+(od/2+wall))/2,fs=[{type:'box',name:`${c.t}: base`,w:'@l',d:'@base_w',h:'@t'},{type:'box',name:`${c.t}: neck`,w:'2*(@bearing_od/2+@wall)',d:'@w',h:'@hc-@t*0.5',z:'@t*0.5'},{type:'cylinder',name:`${c.t}: housing`,r:'@bearing_od/2+@wall',h:'@w',x:0,y:0,z:'@hc',axis:'Y',center:true},{type:'cylinder',name:`${c.t}: bearing seat`,r:'@bearing_od/2',h:'@bearing_w+@w*0.01',x:0,y:'-@w/2-@w*0.01',z:'@hc',axis:'Y',op:'cut'},{type:'cylinder',name:`${c.t}: shaft bore`,r:'(@bearing_od+@bearing_id)/4',h:'@w*1.2',x:0,y:0,z:'@hc',axis:'Y',center:true,op:'cut'}];
  const xs=r4(bx);
  fs.push({type:'hole',name:`${c.t}: mounting holes`,plane:'XY',offset:'@t',d:'@bolt_d',thru:true,pts:nb===4?[[xs,'@base_w/2-@bolt_d*1.1'],[-xs,'@base_w/2-@bolt_d*1.1'],[xs,'-(@base_w/2-@bolt_d*1.1)'],[-xs,'-(@base_w/2-@bolt_d*1.1)']]:[[xs,0],[-xs,0]]});
  return{ps,fs};
}
export const RECIPES={
fan:{n:'Fan',al:['axial_fan','cooling_fan','blower_fan','ventilator'],doc:'axial fan: hub, N twisted airfoil blades (chord taper and pitch twist), optional tip shroud ring, bore with optional keyway and set screw',in:AXOPT,ex:{recipe:'fan',diameter:8,blades:7,bore:0.25,shroud:false},gen:(v,c)=>axial({blades:7,...v},c,false)},
propeller:{n:'Propeller',al:['prop','airscrew'],doc:'propeller: small hub and a few high-pitch tapered airfoil blades, bore with optional keyway and set screw',in:AXOPT.map(s=>s.n==='diameter'?{...s,d:{in:10,mm:250}}:s),ex:{recipe:'propeller',diameter:10,blades:3,pitch:7,bore:0.25},gen:(v,c)=>axial({blades:3,...v},c,true)},
impeller:{n:'Impeller',al:['centrifugal_impeller','centrifugal_fan','pump_impeller','blower_impeller','centrifugal'],doc:'centrifugal impeller: backplate, hub, N backward-curved log-spiral blades, optional closed shroud with inlet eye, bore with optional keyway and set screw',in:[S('diameter','len',{in:4,mm:100},20,1000,'outer diameter',['dia','d','od','size']),S('blades','int',7,3,24,'blade count',['n','blade_count']),S('width','len',null,1,300,'blade height between the plates (default 0.2 x diameter)',['blade_height','b']),S('beta','num',35,15,90,'blade exit angle from the tangent in degrees (90 = radial, smaller = more backward curved)',['exit_angle','blade_angle']),S('eye','len',null,5,800,'inlet eye diameter (default 0.5 x diameter)',['inlet','inlet_diameter']),S('hub','len',null,3,400,'hub diameter (default 0.24 x diameter)',[]),S('bore','len',null,1,200,'shaft bore (default: standard shaft that fits the hub)',['shaft']),S('blade_thickness','len',null,0.2,50,'blade thickness (default 0.03 x diameter)',['blade_t']),S('plate','len',null,0.5,50,'backplate thickness (default 0.04 x diameter)',['backplate']),S('shroud','bool',true,0,0,'closed impeller with a shroud plate (false = open impeller)',['closed']),S('shroud_thickness','len',null,0.5,50,'shroud plate thickness (default = backplate)',[]),S('rotation','enum','ccw',['ccw','cw'],0,'direction of rotation seen from +Z; the blades curve backward against it',['direction']),...OPT],ex:{recipe:'impeller',diameter:4,blades:7,beta:35,bore:0.25},gen:impeller},
gear:{n:'Gear',al:['spur_gear','involute_gear','spurgear','pinion'],doc:'spur gear with a true involute tooth profile (full depth, 1.0 m addendum, 1.25 m dedendum), parametric in teeth, module and pressure angle; optional hub, bore, keyway and set screw',in:[S('teeth','int',24,8,200,'tooth count',['z','n','teeth_count','number_of_teeth','tooth_count','num_teeth']),S('module','num',null,0.3,25,'module in millimetres (pitch diameter / teeth); default 2 mm, or 1/12 in for inch parts',['m','mod']),S('dp','num',null,1,200,'diametral pitch in teeth per inch (instead of module)',['diametral_pitch','pitch']),S('pitch_diameter','len',null,2,2000,'pitch diameter (instead of module)',['pd']),S('pressure','num',20,12,30,'pressure angle in degrees',['pressure_angle','alpha']),S('width','len',null,0.5,500,'face width (default 8 x module)',['face_width','thickness']),S('bore','len',null,1,500,'shaft bore (default: standard shaft that fits)',['shaft']),S('hub','lenopt',0,2,1000,'true or a diameter: add a hub (default off)',[]),S('hub_length','len',null,0,500,'hub length above the face (default 4 x module)',[]),...OPT],ex:{recipe:'gear',teeth:24,module:2,pressure:20,bore:0.25},gen:gear},
sprocket:{n:'Sprocket',al:['chain_sprocket','roller_chain_sprocket'],doc:'ANSI roller chain sprocket: seat circles at the pitch diameter with flared tooth flanks (simplified ANSI form); optional hub, bore, keyway and set screw',in:[S('chain','enum','40',['25','35','40','50','60','80'],0,'ANSI chain number: 25, 35, 40, 50, 60 or 80',['chain_number','ansi','size']),S('teeth','int',18,9,120,'tooth count',['z','n']),S('thickness','len',null,0.5,100,'sprocket thickness (default: ANSI tooth width)',['width']),S('bore','len',null,1,200,'shaft bore (default: standard shaft that fits)',['shaft']),S('hub','lenopt',0,2,500,'true or a diameter: add a hub (default off)',[]),S('hub_length','len',null,0,200,'hub length above the face',[]),...OPT],ex:{recipe:'sprocket',chain:'40',teeth:18,bore:0.5,hub:true},gen:sprocket},
heatsink:{n:'Heat sink',al:['heat_sink','finned_heatsink','pin_fin','plate_fin','cooler'],doc:'heat sink: base plate with plate fins (count and pitch are parameters) or a grid of pin fins, optional corner mounting holes; one connected solid',in:[S('width','len',{in:2.5,mm:60},10,500,'base width (X)',['w','length','base_width']),S('depth','len',{in:2.5,mm:60},10,500,'base depth (Y)',['d','base_depth']),S('base','len',null,1,50,'base thickness (default 0.1 x width)',['base_thickness','t']),S('height','len',null,2,300,'fin or pin height above the base (default 0.45 x width)',['fin_height','h']),S('style','enum','plate',['plate','pin'],0,'plate fins along Y, or a grid of round pins',['type','kind']),S('fins','int',null,2,80,'plate fin count (default: fills the width)',['fin_count','n','num_fins','number_of_fins']),S('fin_thickness','len',null,0.2,20,'plate fin thickness',['fin_t']),S('pin_diameter','len',null,0.5,30,'pin diameter',['pin_d']),S('pitch','len',null,1,100,'pin pitch (default 2.4 x pin diameter)',[]),S('mount_holes','bool',false,0,0,'four corner mounting holes outside the fins',['mounting_holes']),S('hole','len',null,1,30,'mounting hole diameter',['hole_diameter'])],ex:{recipe:'heatsink',width:2.5,depth:2.5,style:'plate',fins:14},gen:heatsink},
flange:{n:'Flange',al:['bolt_flange','bolt_circle_flange','pipe_flange','bolt_circle'],doc:'bolt-circle flange: disc, hub, centre bore, N bolt holes on a bolt circle (count is a parameter)',in:[S('diameter','len',{in:7,mm:180},10,2000,'outer diameter',['od','dia','d']),S('thickness','len',null,1,200,'flange thickness (default 0.1 x diameter)',['t']),S('bore','len',null,1,1500,'bore (default 0.38 x diameter)',['id','bore_diameter']),S('hub','len',null,2,1500,'hub diameter (default 0.6 x diameter)',['hub_diameter']),S('hub_height','len',null,0,300,'hub height above the flange (default 0.12 x diameter)',['hub_h']),S('bolts','int',8,3,36,'bolt hole count',['n','bolt_count','holes','num_bolts','number_of_bolts','bolt_holes']),S('bolt_circle','len',null,5,1800,'bolt circle diameter (default 0.8 x diameter)',['bc','pcd']),S('bolt_hole','len',null,1,100,'bolt hole diameter (default 0.07 x diameter)',['bolt_d','hole'])],ex:{recipe:'flange',diameter:7,bolts:8},gen:flange},
pillow_block:{n:'Pillow block',al:['pillowblock','bearing_housing','bearing_block','plummer_block','bearing_mount'],doc:'pillow block bearing housing: base with two or four bolt holes, neck, round housing with a bearing seat sized from the bearing number (608, 6000 to 6208, 6301 to 6306) and a shoulder bore',in:[S('bearing','str',null,0,0,'bearing number such as 6204 (default: the smallest that fits the shaft)',['bearing_number','designation']),S('bore','len',{in:0.75,mm:20},3,60,'shaft diameter when no bearing number is given',['shaft','shaft_diameter']),S('width','len',null,3,200,'housing width along the shaft (default bearing width plus lip)',[]),S('wall','len',null,1,60,'wall around the bearing (default 0.2 x bearing OD)',[]),S('length','len',null,10,500,'base length',['l']),S('base','len',null,1,60,'base thickness',['base_thickness','t']),S('bolts','int',2,2,4,'mounting bolt holes: 2 or 4',['bolt_count']),S('bolt_hole','len',null,1,30,'bolt hole diameter',['bolt_d'])],ex:{recipe:'pillow_block',bearing:'6204',bolts:2},gen:pillow}
};
export const KEYS=Object.keys(RECIPES);
const WORDS={fan:/\b(fans?|blowers?|ventilators?)\b/i,propeller:/\b(propellers?|props?|airscrews?)\b/i,impeller:/\bimpellers?\b/i,gear:/\b(gears?|pinions?)\b/i,sprocket:/\bsprockets?\b/i,heatsink:/\bheat[ -]?sinks?\b/i,flange:/\bflanges?\b/i,pillow_block:/\b(pillow[ -]?blocks?|bearing (housing|block|mount)s?|plummer blocks?)\b/i};
export const recipeFor=t=>KEYS.find(k=>WORDS[k].test(String(t||'')))||null;
const BY=new Map(Object.entries(RECIPES).flatMap(([k,r])=>[k,...r.al].map(a=>[a.replace(/[^a-z0-9]/g,''),k])));
const deep=(o,f)=>Array.isArray(o)?o.map(x=>deep(x,f)):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,deep(v,f)])):typeof o==='string'?f(o):o;
const asRecipe=a=>a&&typeof a==='object'?a.recipe!==undefined?typeof a.recipe==='object'&&a.recipe?{...a,...a.recipe,recipe:a.recipe.name||a.recipe.type||a.recipe.recipe,...(a.params&&typeof a.params==='object'?a.params:{}),...(a.options&&typeof a.options==='object'?a.options:{})}:{...a,...(a.params&&typeof a.params==='object'?a.params:{}),...(a.options&&typeof a.options==='object'?a.options:{})}:a.add&&typeof a.add==='object'&&(a.add.type==='recipe'||a.add.recipe!==undefined)?{...a.add,recipe:a.add.recipe||a.add.name||a.add.kind,name:undefined,...(a.add.type==='recipe'?{type:undefined}:{})}:null:null;
export function expandRecipes(actions,doc){
  const A=Array.isArray(actions)?actions.map(a=>asRecipe(a)||a):actions;
  if(!Array.isArray(A)||!A.some(a=>a&&typeof a==='object'&&a.recipe!==undefined))return{actions,warns:[],done:[]};
  let ids=(doc.features||[]).map(f=>f.id),names=new Set((doc.params||[]).map(p=>p.name)),u=doc.units==='in'?'in':'mm';
  const out=[],warns=[],done=[],nid=()=>'f'+(Math.max(0,...ids.map(i=>+(/^f(\d+)$/.exec(i)||[])[1]||0))+1);
  for(const a of A){
    if(!a||typeof a!=='object'||a.recipe===undefined){
      if(a&&typeof a==='object'){a.new&&(ids=[],names=new Set(),u=a.units==='in'||a.units==='mm'?a.units:u);a.param&&a.param.name&&names.add(String(a.param.name).replace(/[^\w]/g,'_'));a.add&&ids.push(nid());a.delete&&(ids=ids.filter(i=>i!==(a.delete.id||a.delete)));}
      out.push(a);continue;
    }
    const key=BY.get(String(a.recipe).toLowerCase().replace(/[^a-z0-9]/g,'')),R=RECIPES[key];
    if(!R){const c=closest(String(a.recipe),KEYS);warns.push(`Unknown recipe "${a.recipe}"${c?'; closest is "'+c+'"':''}. Recipes: ${KEYS.join(', ')}.`);done.push(`recipe ${a.recipe}: unknown`);continue;}
    try{
      const nu=a.new?(a.units==='in'||a.units==='mm'?a.units:u):u,{v,W,E}=parse(R,a,nu);
      warns.push(...W.map(w=>`Recipe ${key}: ${w}`));
      if(E.length)throw new Error(E.join('; '));
      const nn=a.new?new Set():names;
      let p=key,i=1;while([...nn].some(x=>x.startsWith(p+'_')))p=key+(++i);
      const c={u:nu,p,t:a.name?String(a.name):R.n+(i>1?' '+i:''),x:s=>s.replace(/@(\w+)/g,(m,k)=>p+'_'+k)},g=R.gen(v,c),base=a.new?[]:ids,map={};
      let cur=base;const fa=g.fs.map(f=>{const id='f'+(Math.max(0,...cur.map(q=>+(/^f(\d+)$/.exec(q)||[])[1]||0))+1);cur=[...cur,id];const{ref,...rest}=f;ref&&(map[ref]=id);return rest;});
      const sub=s=>/^#\w+$/.test(s)?map[s.slice(1)]||s:c.x(s);
      a.new&&out.push({new:true,...(a.units==='in'||a.units==='mm'?{units:a.units}:{})});
      a.material&&out.push({material:a.material});a.finish!==undefined&&out.push({finish:a.finish});
      for(const[n,e]of g.ps)out.push({param:{name:p+'_'+n,expr:typeof e==='number'?String(r4(e)):c.x(String(e))}});
      for(const f of fa)out.push({add:deep(f,sub)});
      a.new&&(names=new Set());ids=cur;g.ps.forEach(([n])=>names.add(p+'_'+n));u=nu;
      done.push(`recipe ${key}: ${g.fs.length} features, ${g.ps.length} parameters ${p}_*`);
    }catch(e){warns.push(`Recipe ${key} was not built: ${e.message}`);done.push(`recipe ${key}: not built, see the warnings`);}
  }
  return{actions:out,warns,done};
}
const optInfo=(s,u)=>{const K=KM(u),L=isLen(s),d=s.d==null?null:typeof s.d==='object'?s.d[u]:L?r4(s.d*K):s.d,rg=L?`${r4(s.lo*K)} to ${r4(s.hi*K)} ${u}`:s.k==='int'||s.k==='num'?`${s.lo} to ${s.hi}`:s.k==='enum'?s.lo.join('|'):s.k==='bool'?'true|false':'text';return{name:s.n,type:s.k==='lenopt'?'length or true/false':s.k==='len'?'length ('+u+')':s.k,range:rg,default:d===false?false:d===0&&s.k==='lenopt'?false:d,doc:s.doc,aliases:s.al.length?s.al:undefined};};
export const listRecipes=(units='in')=>KEYS.map(k=>({key:k,name:RECIPES[k].n,summary:RECIPES[k].doc,aliases:RECIPES[k].al,example:RECIPES[k].ex,options:RECIPES[k].in.map(s=>optInfo(s,units))}));
export function recipePrompt(units='in'){
  const u=units==='in'?'in':'mm',lines=KEYS.map(k=>{const R=RECIPES[k];return`- ${k}: ${R.doc}. Options: ${R.in.map(s=>{const o=optInfo(s,u),sh=isLen(s)||s.k==='str'||s.k==='bool'?'':o.range,df=o.default==null||o.default===false?'':o.default;return s.n+(sh||df!==''?'('+[sh,df!==''?'default '+df+(isLen(s)?' '+u:''):''].filter(Boolean).join(', ')+')':'');}).join(', ')}. Example: ${JSON.stringify(R.ex)}`;});
  return`Recipes: one action builds a hard shape correctly, so PREFER a recipe whenever the request matches (fan, propeller, impeller, gear, sprocket, heat sink, flange, pillow block); never hand-model those from primitives. Give {"new":true} first unless you add to an existing part, then ONE action {"recipe":"<name>",...options}. Lengths are in the document units and every option is optional with a sensible default, so the size alone is often enough. A recipe expands into editable parameters (fan_dia, gear_teeth, ...) and grouped features ("Fan: blade") and the result is ONE connected solid. Change it later by setting its parameters ({"param":{"name":"fan_dia","expr":"8"}}) or its features; do not call the recipe again on the same part. An option out of range builds nothing and returns a plain error: read it and retry. Check the picture or numbers you get back against the request.\n${lines.join('\n')}`;
}
