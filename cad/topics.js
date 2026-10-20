import {systemPrompt} from './ai.js';
import {FT} from './schema.js';
import {recipePrompt,listRecipes} from './recipes.js';
import {SPEC} from './form_lang.js';
const TOPICS={
  recipes:{about:'ready-made generators (fan, propeller, impeller, gear, sprocket, heat sink, flange, pillow block) with their options'},
  sketch:{about:'feature types and fields, 2D profile shapes, sketch planes, holes, face and edge selectors, parameters and rules',re:/^(Feature types|Profiles \(|Sketch planes:|Hole:|Holes:|Edge selectors|Face selectors|op: |Numbers may be|Rules:|Example request|Example reply|Limits:|Tooling \(wood\))/},
  assembly:{about:'assemblies: insert, mates, mechanical mates, patterns, configurations, motion studies',re:/^ \{"asm"/},
  sim:{about:'stress, modal, thermal, seal, forming, nonlinear, flow and injection molding setup and run actions',re:/^ \{"(sim|flow|mold)"|^ \{"run":"(fea|flow|mold)"\}/},
  tooling:{about:'steel rule, stamping, extrusion and forging dies, mold, die-casting and casting tooling, CNC toolpaths, cutters',re:/^ \{"(steel_rule_die|stamping_die|extrusion_die|forging_die|tool|cam|cutter)"|^ \{"run":"(mold_design|die_cast_design|casting_pattern|toolpath|simulate|cutter_cnc)/},
  materials:{about:'materials and part finishes',re:/^(Materials:|Finishes depend|Wood and composite)/},
  references:{about:'working from attached sketches, photos and drawings',re:/^References:/},
  actions:{about:'only the basic actions: add, set, param, delete, new, material, finish'},
  form:{about:'the Form workspace scene text (form_get, form_set, form_key, form_render): organic shapes, sculpting, bones, IK and constraints, actions and NLA, bezier keys, lights, cameras and rendering'}
};
const FTRE=new RegExp('^- ('+Object.keys(FT).join('|')+'):'),CORE=/^(You are the design assistant|Actions \(applied|\{"say"| \{"(add|set|param|delete|new|material|finish)"|Numbers may be expressions)/;
export const TOPIC_LIST=Object.entries(TOPICS).map(([k,v])=>({topic:k,about:v.about}));
export function language(units,topic){
  const t=topic==null||topic===''||/^(all|full)$/i.test(String(topic))?null:String(topic).toLowerCase().replace(/[^a-z]/g,'');
  if(!t)return{text:systemPrompt(units),topics:TOPIC_LIST,recipes:listRecipes(units).map(r=>({key:r.key,summary:r.summary,aliases:r.aliases,example:r.example})),note:'Full reference. Pass topic (recipes, sketch, assembly, sim, tooling, materials, references, actions or form) for a short section.'};
  const T=TOPICS[t==='recipe'?'recipes':t==='simulation'?'sim':t];
  if(t==='form')return{topic:'form',text:'Form workspace (use form_get, form_set, form_key and form_render, not apply_actions):\n'+SPEC,topics:TOPIC_LIST};
  if(!T)return{text:'Unknown topic "'+topic+'". Topics: '+Object.keys(TOPICS).join(', ')+'.',topics:TOPIC_LIST};
  const out=[];let on=false;
  for(const ln of systemPrompt(units).split('\n')){
    if(/^\s/.test(ln)&&!/^ \{"/.test(ln)){on&&out.push(ln);continue;}
    on=CORE.test(ln)||!!(T.re&&T.re.test(ln))||t==='sketch'&&FTRE.test(ln);
    if(/^Tooling \(wood\)/.test(ln)&&t!=='tooling'&&t!=='sketch')on=false;
    on&&out.push(ln);
  }
  const r=t==='recipe'||t==='recipes';
  return{topic:r?'recipes':t,text:out.join('\n')+'\n'+(r?recipePrompt(units):''),...(r?{recipes:listRecipes(units)}:{}),topics:TOPIC_LIST};
}
