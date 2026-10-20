const V3=v=>[v.x,v.y,v.z];
export function chamferSides(body,es,f){
  const a=+f.angle||0,d2=+f.d2||0;if(a<0||a>=90)throw new Error('chamfer angle must be above 0 and below 90 degrees');if(d2<0)throw new Error('second chamfer distance must be 0 or more');
  const hs=new Set(es.map(q=>q.e.hashCode)),adj=new Map();
  for(const fc of body.faces)for(const e of fc.edges)hs.has(e.hashCode)&&adj.set(e.hashCode,(adj.get(e.hashCode)||[]).concat([fc]));
  const first=new Map(es.map(q=>{const fs=adj.get(q.e.hashCode)||[];if(fs.length!==2)return[q.e.hashCode,null];const n=fs.map(g=>V3(g.normalAt(q.m))),c=[2,0,1].map(i=>n[0][i]-n[1][i]).find(d=>Math.abs(d)>1e-7)||0;return[q.e.hashCode,fs[(c<0)!==!!f.flip?1:0].hashCode];}));
  return(x,r)=>{const dd=d2?d2*x/r:x;return e=>{const h=first.get(e.hashCode);return h===undefined?null:h===null?x:{...(a?{distance:x,angle:a}:{distances:[x,dd]}),selectedFace:ff=>ff.when(({element})=>element.hashCode===h)};};};
}
