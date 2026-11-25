import {heliumSync} from './he/host.js';
const PF=await heliumSync('simprep'),C=new WeakMap(),COS=Math.cos(20*Math.PI/180);let H=null;
const he=()=>H||(H=PF({}),H.ex.sr_init(),H);
export function simpleMesh(m,kind){if(!m||(kind!=='box'&&kind!=='hull'))return m;const k=C.get(m)||{};if(k[kind])return k[kind];const P=he(),n=m.pos.length/3;P.ex.sr_size(n);P.v(3).set(m.pos);const I=P.v(1);I.fill(0);I[0]=400;const f=P.ex.sr_hull();P.ex.sr_box();const nt=P.ex.sr_mesh(kind==='hull'&&!f?1:2,COS),O=P.v(2),nl=O[7]|0,r={pos:P.v(6).slice(0,9*nt),nrm:P.v(7).slice(0,9*nt),idx:Uint32Array.from({length:3*nt},(_,i)=>i),lines:P.v(8).slice(0,6*nl),groups:[[0,3*nt,0]],egroups:[],faces:[{type:kind==='hull'&&!f?'HULL':'BOX'}],props:m.props,simple:kind,tris:nt,src:m};k[kind]=r;C.set(m,k);return r;}
