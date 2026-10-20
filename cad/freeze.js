export const MSG='Features above the freeze bar are locked. Unfreeze (or drag the bar up) to edit them.';
export const count=d=>Math.max(0,Math.min((d.features||[]).length,d.freeze|0));
export const frozen=(d,id)=>{const i=(d.features||[]).findIndex(f=>f.id===id);return i>=0&&i<count(d);};
export const snap=d=>{const n=count(d);return{n,s:n?JSON.stringify(d.features.slice(0,n)):''};};
export const hurt=(d,s)=>s.n>0&&(d.freeze|0)>0&&JSON.stringify((d.features||[]).slice(0,s.n))!==s.s;
export const state=d=>{const n=count(d);return n?{freeze:{count:n,through:d.features[n-1].id}}:{};};
export function apply(d,to){
  const n=typeof to==='string'?(d.features.findIndex(f=>f.id===to)+1)||-1:to===null||to===false||to===undefined?0:Math.round(+to);
  return!isFinite(n)||n<0||n>d.features.length?'freeze: "'+to+'" is not a feature id or a count from 0 to '+d.features.length:(n?d.freeze=n:delete d.freeze,'');
}
export const blocked=(d,a)=>{const id=a.set&&a.set.id||(a.delete&&(a.delete.id||a.delete));return typeof id==='string'&&frozen(d,id)?'Feature '+id+' is above the freeze bar, so '+(a.set?'edit':'delete')+' was skipped; unfreeze first with {"freeze":null}.':'';};
