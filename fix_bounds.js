const fs = require('fs');
let html = fs.readFileSync('learn/index.html', 'utf8');

const regex = /if\(lvl>=3\)\{\s*const cosX[\s\S]*?\}else\{/;
const replacement = `if(lvl>=3){
            const cosX=Math.cos(rotX),sinX=Math.sin(rotX),cosY=Math.cos(rotY),sinY=Math.sin(rotY);
            let maxR=0.01; sh.pts3d.forEach(([x,y,z])=>maxR=Math.max(maxR,Math.hypot(x,y,z)));
            norm=sh.pts3d.map(([x,y,z])=>{
                const nx=x/maxR, ny=y/maxR, nz=z/maxR;
                const x1=nx*cosY-nz*sinY,z1=nx*sinY+nz*cosY;
                const y2=ny*cosX-z1*sinX,z2=ny*sinX+z1*cosX;
                const scale=700/(4+z2);
                return [W/2+x1*scale,H/2+y2*scale];
            });
        }else{`;

if(regex.test(html)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('learn/index.html', html);
    console.log('Fixed bounds!');
} else {
    console.log('Failed to match bounds logic.');
}
