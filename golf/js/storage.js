const KEY="amni_minigolf_v1";
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(_){return{}}}
function save(data){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){}}
function bestKey(biome,hole){return`b${biome}_h${hole}`}
function getBest(biome,hole){const d=load();return d[bestKey(biome,hole)]??null}
function setBest(biome,hole,strokes){
const d=load();const k=bestKey(biome,hole);const prev=d[k];
if(prev==null||strokes<prev){d[k]=strokes;save(d);return true}
return false;
}
function getBestsForBiome(biome){
const d=load(),out=[];
for(let h=0;h<18;h++)out.push(d[bestKey(biome,h)]??null);
return out;
}
function getSettings(){const d=load();return{muted:!!d.muted,mulligans:d.mulligans!==false}}
function setSetting(k,v){const d=load();d[k]=v;save(d)}
export{getBest,setBest,getBestsForBiome,getSettings,setSetting};