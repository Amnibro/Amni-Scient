const fs=require('fs');
const p=require('path').join(__dirname,'..','learn-app.js');
let s=fs.readFileSync(p,'utf8');
const before=(s.match(/(?<!\$)\$\('#phon-/g)||[]).length;
s=s.replace(/(?<!\$)\$\('#phon-/g,"$$"+"('#phon-");
// wait - in replace replacement $$ = $. Use function replacer instead.
s=fs.readFileSync(p,'utf8');
s=s.replace(/(?<!\$)\$\('#phon-/g,()=>"$$('#phon-");
const after=(s.match(/(?<!\$)\$\('#phon-/g)||[]).length;
fs.writeFileSync(p,s);
console.log({before,after,hasDouble:s.includes("$$('#phon-hear')"),hasSingle:/(?<!\$)\$\('#phon-hear'/.test(s)});
