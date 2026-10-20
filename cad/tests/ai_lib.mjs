import opencascade from '../vendor/replicad_single.js';
import * as K from '../kernel.js';
import {normFeature} from '../normalize.js';
import {defaults} from '../schema.js';
import {expandRecipes} from '../recipes.js';
import {ringRuns,inside} from '../aisee.js';
const oc=await opencascade({locateFile:()=>new URL('../vendor/replicad_single.wasm',import.meta.url).pathname,print:()=>{},printErr:()=>{}});
await K.init(oc);
export{K,ringRuns,inside};
export const newDoc=(units='in')=>({units,params:[],features:[]});
export function apply(doc,actions){
  const x=expandRecipes(actions,doc);
  for(const a of x.actions){
    a.new&&(doc.params=[],doc.features=[],a.units&&(doc.units=a.units));
    if(a.param){const q=doc.params.find(p=>p.name===a.param.name);q?q.expr=String(a.param.expr):doc.params.push({name:a.param.name,expr:String(a.param.expr)});}
    if(a.add){const f={...defaults(a.add.type),...normFeature(a.add,a.add.type).f};f.id='f'+(Math.max(0,...doc.features.map(q=>+q.id.slice(1)))+1);doc.features.push(f);}
    a.set&&Object.assign(doc.features.find(q=>q.id===a.set.id),a.set);
    a.delete&&(doc.features=doc.features.filter(q=>q.id!==(a.delete.id||a.delete)));
  }
  return x;
}
export async function build(doc){K.resetCache();const r=await K.build(doc),m=K.meshBody(r.body);return{r,m,scope:K.resolveParams(doc.params,doc.units).scope,size:m?[0,1,2].map(i=>m.props.bbox.max[i]-m.props.bbox.min[i]):null};}
export const lineRuns=(m,a,b,n=4000)=>{const f=inside(m);let k=0,p=false;for(let i=0;i<n;i++){const t=(i+0.5)/n,v=f(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t+1e-7);v&&!p&&k++;p=v;}return k;};
export const setParam=(doc,n,e)=>{doc.params.find(p=>p.name===n).expr=String(e);};
