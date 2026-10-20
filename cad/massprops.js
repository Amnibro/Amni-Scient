import * as R from './vendor/replicad.js';
import {eig3} from './qmath.js';
const DIRS=[[1,0,0],[0,1,0],[0,0,1],[1,1,0],[0,1,1],[1,0,1]].map(d=>{const l=Math.hypot(...d);return d.map(v=>v/l);}),NAMES=['Ixx','Iyy','Izz','Ixy','Iyz','Ixz'];
export function props(body){
  const oc=R.getOC(),g=new oc.GProp_GProps(),s=new oc.GProp_GProps();
  try{
    oc.BRepGProp.VolumeProperties(body.wrapped,g,false,false,false);oc.BRepGProp.SurfaceProperties(body.wrapped,s,false,false);
    const c=g.CentreOfMass(),com=[c.X(),c.Y(),c.Z()],I=DIRS.map(d=>{const dr=new oc.gp_Dir(...d),ax=new oc.gp_Ax1(c,dr),v=g.MomentOfInertia(ax);ax.delete();dr.delete();return v;});c.delete();
    const[xx,yy,zz,a,b,cc]=I,z=v=>Math.abs(v)<1e-9*Math.max(xx,yy,zz)?0:v,xy=z(a-(xx+yy)/2),yz=z(b-(yy+zz)/2),xz=z(cc-(xx+zz)/2),T=[[xx,xy,xz],[xy,yy,yz],[xz,yz,zz]];
    return{volume:g.Mass(),area:s.Mass(),com,T,principal:eig3(T).map(e=>({I:e.val,axis:e.vec}))};
  }finally{g.delete();s.delete();}
}
export const run=({body})=>body?props(body):null;
