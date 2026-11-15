import{heliumSync}from'./host.js';
const te=new TextEncoder(),td=new TextDecoder('utf-8',{ignoreBOM:true}),CAP=1<<27,enc=s=>typeof s==='string'?te.encode(s):s;
let mk=null,SH=null;
const put=(H,k,b)=>{H.ex.cam_in(k,b.length);b.length&&H.v(k+1).set(b);},txt=(H,n)=>n?td.decode(H.v(0).subarray(0,n)):'',f32=(H,id,n)=>n?H.v(id).slice(0,n):new Float32Array(0);
const call=(f,a=[],...x)=>{const H=SH||(SH=mk());try{a.forEach((s,k)=>put(H,k,enc(s)));const r=txt(H,H.ex[f](...x));H.mem.buffer.byteLength>CAP&&(SH=null);return r;}catch(e){SH=null;throw e;}};
export default async function init(){mk=mk||await heliumSync('amni_cam');}
export class GRun{
  constructor(g,opt){const H=this.H=mk();put(H,0,enc(g));put(H,1,enc(opt));H.ex.w_run_new();}
  summary(){const H=this.H;return txt(H,H.ex.w_run_summary());}
  points(){const H=this.H;return f32(H,4,H.ex.w_run_points());}
  auto_stock(tool){const H=this.H;put(H,2,enc(tool));return txt(H,H.ex.w_run_auto_stock());}
  free(){this.H=null;}
}
export class GStock{
  constructor(run,cfg){if(!(run instanceof GRun))throw new Error('expected instance of GRun');const R=run.H,H=this.H=mk();put(H,0,R.v(1));put(H,1,R.v(2));H.ex.w_run_new();put(H,2,enc(cfg));H.ex.w_stock_new();}
  run_to(to,check){this.H.ex.w_stock_run_to(Math.min(to>>>0,2147483647),check?1:0);}
  heights(){const H=this.H;return f32(H,5,H.ex.w_stock_heights());}
  part(){const H=this.H;return f32(H,7,H.ex.w_stock_part());}
  info(){const H=this.H;return txt(H,H.ex.w_stock_info());}
  removed(){return this.H.ex.w_stock_removed();}
  free(){this.H=null;}
}
export const cam_catalog=()=>call('w_cam_catalog'),cam_defaults=()=>call('w_cam_defaults'),cam_posts=()=>call('w_cam_posts'),shop_default=()=>call('w_shop_default'),cam_generate=job=>call('w_cam_generate',[job]),cam_program=jobs=>call('w_cam_program',[jobs]),cam_lint=(g,job)=>call('w_cam_lint',[g,job]),cam_import=(name,data,section)=>call('w_cam_import',[name,data],section),solid_cam=job=>call('w_solid_cam',[job]),solid_plan=job=>call('w_solid_plan',[job]),solid_tooling=job=>call('w_solid_tooling',[job]),gcode_detect=g=>call('w_gcode_detect',[g]),gcode_simulate=(g,opt,cfg)=>call('w_gcode_simulate',[g,opt,cfg]),quote=(part,req,shop)=>call('w_quote',[part,req,shop]),sheet_cam=(loops,t,job)=>call('w_sheet_cam',[loops,job],t),sheet_dxf=(loops,units)=>call('w_sheet_dxf',[loops,units]);
