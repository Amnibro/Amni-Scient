import * as ASM from './assembly.js';
import * as HF from './hwfit.js';
import * as IC from './incontext.js';
export function flush(d,meshOf){const A=ASM.ensure(d),q=A.pending||[],out=[];A.pending=[];A.log=A.log||[];
  for(const{op,args}of q){try{if(op==='smart_insert'){const hw=args.hw||{},r=HF.smartInsert(d,meshOf,{...args,kind:args.kind||hw.kind,size:args.size||hw.size,len:args.len||hw.len});out.push('inserted '+r.inserted.length+' '+(r.inserted[0]?r.inserted[0].kind+' '+r.inserted[0].size+' × '+r.inserted[0].len:'')+(r.errors.length?'; '+r.errors.join('; '):'')+r.inserted.flatMap(x=>x.warnings).map(w=>' ⚠ '+w).join(''));}
    else if(op==='aligned_holes'){const r=HF.alignedHoles(d,meshOf,args);out.push('holes '+r.holes.map(h=>h.name+' '+h.fit).join(', ')+r.warnings.map(w=>' ⚠ '+w).join(''));}
    else if(op==='pattern'){const p=ASM.pattern(d,args,meshOf);ASM.syncPatterns(d,meshOf);out.push('pattern '+p.id+' follows '+p.follow.c+' holes Ø'+p.follow.d);}
    else if(op==='xref'){const x=IC.addXref(d,args);out.push('reference '+x.name+' ('+x.kind+')');}
    else if(op==='update_xrefs'){const u=IC.updateXrefs(d,meshOf);out.push('references '+(u.changed?'updated':'unchanged')+u.log.map(l=>' ⚠ '+l.ref+': '+l.error).join(''));}}catch(e){out.push('⚠ '+op+': '+e.message);}}
  const x=IC.updateXrefs(d,meshOf);x.changed&&out.push('references updated');ASM.syncPatterns(d,meshOf);A.log.push(...out);A.log=A.log.slice(-20);return out;}
export const hasWork=d=>{const A=d.asm;return!!(A&&(A.pending&&A.pending.length||A.patterns&&A.patterns.length||A.parts&&Object.values(A.parts).some(p=>p.doc&&p.doc.xrefs&&p.doc.xrefs.length)||d.xrefs&&d.xrefs.length));};
