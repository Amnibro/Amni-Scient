import {heliumSync} from './he/host.js';
const AMG=await heliumSync('mold_amg');let H=null;
export function amgPcg(n,rp,ci,va,b,x,tol,maxit=500,opt={}){if(!H){H=AMG();setTimeout(()=>{H=null;});}const e=H.ex,nz=rp[n];e.am_alloc(n,nz);H.v(1).set(rp.subarray(0,n+1));H.v(2).set(ci.subarray(0,nz));H.v(3).set(va.subarray(0,nz));H.v(4).set(b.subarray(0,n));H.v(5).set(x.subarray(0,n));const it=e.am_solve(tol,maxit,opt.coarse||160,opt.theta??0.08,opt.w!==false?1:0);x.set(H.v(5));return it;}
