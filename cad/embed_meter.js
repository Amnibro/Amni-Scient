export const CAP={basic:47,pro:147,enterprise:-1};
const RANK={basic:1,pro:2,enterprise:3};
export const rank=t=>RANK[t]||1;
export function capOf(tier){const c=CAP[tier];return c==null?CAP.basic:c;}
export function decide({tier='basic',used=0,ok=true}={}){
  const cap=capOf(tier);
  if(cap<0)return{allow:true,count:true,unlimited:true,reason:'unlimited',left:null,cap};
  const left=Math.max(0,cap-used);
  if(!ok)return{allow:true,count:false,unlimited:false,reason:'error',left,cap};
  if(used>=cap)return{allow:false,count:false,unlimited:false,reason:'limit',left:0,cap};
  return{allow:true,count:true,unlimited:false,reason:'ok',left:left-1,cap};
}
