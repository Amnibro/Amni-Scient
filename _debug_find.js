const h=require('fs').readFileSync('learn/index.html','utf8');
const pat="name:'Butterfly'";
const i=h.indexOf(pat);
console.log('found at',i);
if(i>0){
  console.log(JSON.stringify(h.substring(i-80,i+40)));
}
// Also check for line endings
const sample=h.substring(0,200);
console.log('Line ending type:', sample.includes('\r\n') ? 'CRLF' : 'LF');

// Find shape level 3 start
const pat2="3:[\r\n        {name:'Butterfly'";
const i2=h.indexOf(pat2);
console.log('level 3 pattern with CRLF at',i2);

// Find by a more flexible approach
const pat3="3:[";
let idx=0;
while((idx=h.indexOf(pat3,idx))>-1){
  console.log('  3:[ at',idx,':',JSON.stringify(h.substring(idx-20,idx+60)));
  idx+=3;
}
