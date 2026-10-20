import * as R from './vendor/replicad.js';
export function list({body,doc,K},{fid}={}){
  const feats=(doc.features||[]).filter(f=>!f.suppressed),i=fid?feats.findIndex(f=>f.id===fid):-1,sh=i>0?K.shapeBefore(i):i===0?null:body;
  return sh?(sh.solids||[sh]).map((s,n)=>{const p=R.measureShapeVolumeProperties(s),b=s.boundingBox.bounds,c=p.centerOfMass;return{index:n,volume:Math.abs(p.volume),com:[c.x,c.y,c.z],bbox:{min:b[0],max:b[1]}};}):[];
}
