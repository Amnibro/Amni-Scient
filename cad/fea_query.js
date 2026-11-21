const finite=v=>Number.isFinite(+v)?+v:0;
export function studyQuery(r,q={}){
  const curve=r.curve||r.hist||[],peak=curve.reduce((b,row,i)=>{const v=row.amp!=null?row.amp:row.vm!=null?row.vm:row.Tmax;return v!=null&&Math.abs(v)>Math.abs(b.v)?{i,v,row}:b;},{i:0,v:0,row:curve[0]});
  const time=q.time==null?curve[curve.length-1]:q.time==='peak'?peak.row:curve[q.time|0];
  const node=q.node==null||!r.vDisp?undefined:{node:q.node|0,ux_mm:finite(r.vDisp[3*q.node]),uy_mm:finite(r.vDisp[3*q.node+1]),uz_mm:finite(r.vDisp[3*q.node+2]),vm:r.vStress?finite(r.vStress[q.node]):undefined};
  const element=q.element==null?undefined:{element:q.element|0,vm:r.field&&r.field.vm?finite(r.field.vm[q.element]):undefined};
  return{type:r.type,steps:curve.length,time,node,element,probes:r.probes,path:r.path};
}
function csvOf(r,mesh){
  if(r.curve&&r.curve.length){const keys=Object.keys(r.curve[0]);return ['time-history',keys.join(','),...r.curve.map(row=>keys.map(k=>finite(row[k])).join(','))].join('\n')+'\n';}
  const pos=mesh&&mesh.pos,vm=r.vStress||[],u=r.vDisp||[],n=pos?pos.length/3:0,rows=['x_mm,y_mm,z_mm,vm,ux_mm,uy_mm,uz_mm'];
  for(let i=0;i<n;i++)rows.push([pos[3*i],pos[3*i+1],pos[3*i+2],finite(vm[i]),finite(u[3*i]),finite(u[3*i+1]),finite(u[3*i+2])].map(v=>finite(v)).join(','));
  return rows.join('\n')+'\n';
}
function vtkOf(r,mesh){
  const pos=mesh&&mesh.pos,idx=mesh&&mesh.idx,vm=r.vStress||[];if(!pos||!idx)return '# empty\n';
  const n=pos.length/3,c=idx.length/3,lines=['# vtk DataFile Version 3.0','study','ASCII','DATASET POLYDATA','POINTS '+n+' float'];
  for(let i=0;i<n;i++)lines.push(finite(pos[3*i])+' '+finite(pos[3*i+1])+' '+finite(pos[3*i+2]));
  lines.push('POLYGONS '+c+' '+(c*4));
  for(let i=0;i<c;i++)lines.push('3 '+idx[3*i]+' '+idx[3*i+1]+' '+idx[3*i+2]);
  lines.push('POINT_DATA '+n,'SCALARS von_mises float 1','LOOKUP_TABLE default');
  for(let i=0;i<n;i++)lines.push(String(finite(vm[i])));
  return lines.join('\n')+'\n';
}
export function studyExport(kind,r,mesh){
  const k=String(kind||'json');
  if(k==='csv')return {name:'study.csv',type:'text/csv',text:csvOf(r,mesh)};
  if(k==='vtk')return {name:'study.vtk',type:'application/vnd.vtk',text:vtkOf(r,mesh)};
  const slim={type:r.type,curve:r.curve,hist:r.hist,probes:r.probes,path:r.path,peak:r.vmP99,uMax:r.uMax,freqs:r.freqs,dlf:r.dlf,rms:r.rms,lifeMin:r.lifeMin,damageMax:r.damageMax,factor:r.factor,Pcr:r.Pcr};
  return {name:'study.json',type:'application/json',text:JSON.stringify(slim)};
}
