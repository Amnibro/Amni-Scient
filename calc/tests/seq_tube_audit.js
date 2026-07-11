let pass=0,fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log('FAIL: '+m))};
const ap=(a,b,m,r)=>ok(typeof a==='number'&&isFinite(a)&&Math.abs(a-b)<=Math.abs(b)*(r||1e-9)+1e-12,m+' got '+a+' want '+b);
const C=require('../calc-cad.js');
const tb=C.tube(20,15,40,32),mp=C.massProps(tb);
const Vexact=0.5*32*Math.sin(2*Math.PI/32)*(400-225)*40;
ap(mp.volume,Vexact,'tube volume = inscribed-prism annulus exactly',1e-6);
ok(Math.abs(mp.volume-Math.PI*175*40)/(Math.PI*175*40)<0.01,'within 1% of pi(ro2-ri2)h');
ok(Math.abs(mp.centroid.y)<1e-9,'tube centroid centered');
const cut=C.massProps(C.csgSubtract(tb,C.cube(100,100,8)));
ok(cut.volume>0&&cut.volume<mp.volume,'slot cut through tube wall works');
const stl=C.toSTL(tb);
ok(new DataView(stl).getUint32(80,true)*50+84===stl.byteLength,'tube STL layout');
function boltSeq(N){
  if(N<3)return Array.from({length:N},(_,i)=>i+1);
  if(N%4===0)return Array.from({length:N/2},(_,j)=>Math.floor(j/2)+1+(j%2)*(N/4)).flatMap(x=>[x,x+N/2]);
  if(N%2===0)return Array.from({length:N/2},(_,j)=>j+1).flatMap(x=>[x,x+N/2]);
  const step=(N-1)/2,out=[];let p=1;
  for(let i=0;i<N;i++){out.push(p);p=(p-1+step)%N+1;}
  return out;
}
ok(boltSeq(8).join()==='1,5,3,7,2,6,4,8','N8 = PCC-1 classic 1-5-3-7-2-6-4-8');
ok(boltSeq(4).join()==='1,3,2,4','N4 cross');
ok(boltSeq(12).join()==='1,7,4,10,2,8,5,11,3,9,6,12','N12 star');
ok(boltSeq(6).join()==='1,4,2,5,3,6','N6 opposite pairs');
ok(boltSeq(5).join()==='1,3,5,2,4','N5 odd star (step 2)');
for(const N of[3,4,5,6,7,8,10,12,16,20,24,48]){
  const s=boltSeq(N);
  ok(new Set(s).size===N&&Math.min(...s)===1&&Math.max(...s)===N,'N'+N+' visits every bolt exactly once');
}
const s16=boltSeq(16);
ok(Math.abs(s16[0]-s16[1])===8&&Math.abs(s16[2]-s16[3])===8,'even patterns always pair opposite bolts');
console.log(pass+' passed, '+fail+' failed');
process.exitCode=fail?1:0;
