const W=400, H=400, rotX=0.5, rotY=0.5;
const cosX=Math.cos(rotX),sinX=Math.sin(rotX),cosY=Math.cos(rotY),sinY=Math.sin(rotY);
let norm = [];
[[-1,-1,-1], [1,1,1]].forEach(([x,y,z])=>{
    const x1=x*cosY-z*sinY,z1=x*sinY+z*cosY;
    const y2=y*cosX-z1*sinX,z2=y*sinX+z1*cosX;
    const scale=600/(4+z2);
    norm.push([W/2+x1*scale,H/2+y2*scale]);
});
console.log(norm);
