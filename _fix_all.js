const fs=require('fs');
let h=fs.readFileSync('learn/index.html','utf8');
const log=m=>console.log(m);
let fixes=0;
function rep(old,nw,label){
  if(!h.includes(old)){console.error('FAIL: '+label+' — anchor not found');console.error('Looking for: '+JSON.stringify(old.substring(0,120)));process.exit(1);}
  const count=h.split(old).length-1;
  if(count>1){console.warn('WARN: '+label+' — '+count+' matches, replacing ALL');}
  h=h.split(old).join(nw);fixes++;log('OK: '+label+' ('+count+' replaced)');
}

// ============ FIX 0: Remove shape data from melodies (music section) ============
// The melodies variable in renderMelodyChallenge has levels 3-5 overwritten with shape data
// Replace it with proper melodies for levels 3-5
const melodiesShapeJunk = `{name:'Twinkle Twinkle',notes:['C4','C4','G4','G4','A4','A4','G4']}],`;
const melodiesEnd = `\r\n    };`;
const junkStart = h.indexOf(melodiesShapeJunk);
if(junkStart<0){console.error('FAIL: melodies junk anchor not found');process.exit(1);}
const junkAfterAnchor = junkStart + melodiesShapeJunk.length;
const junkEndPos = h.indexOf('};', junkAfterAnchor);
if(junkEndPos<0){console.error('FAIL: melodies end not found');process.exit(1);}
// Replace everything between the anchor and }; with proper melodies for levels 3-5
const oldMelodiesChunk = h.substring(junkAfterAnchor, junkEndPos);
const newMelodies = `\r\n      3:[{name:'Fr\\u00e8re Jacques',notes:['C4','D4','E4','C4','C4','D4','E4','C4','E4','F4','G4','E4','F4','G4']},{name:'Ode to Joy',notes:['E4','E4','F4','G4','G4','F4','E4','D4','C4','C4','D4','E4','E4','D4','D4']},{name:'London Bridge',notes:['G4','A4','G4','F4','E4','F4','G4','D4','E4','F4','E4','F4','G4']}],\r\n      4:[{name:'Jingle Bells',notes:['E4','E4','E4','E4','E4','E4','E4','G4','C4','D4','E4','F4','F4','F4','F4','F4','E4','E4','E4','E4','D4','D4','E4','D4','G4']},{name:'Happy Birthday',notes:['G4','G4','A4','G4','C5','B4','G4','G4','A4','G4','D5','C5']},{name:'Oh Susanna',notes:['C4','D4','E4','G4','G4','A4','G4','E4','C4','D4','E4','E4','D4','C4','D4']}],\r\n      5:[{name:'Fur Elise',notes:['E5','D#5','E5','D#5','E5','B4','D5','C5','A4','C4','E4','A4','B4','E4','G#4','B4','C5']},{name:'Canon in D',notes:['F#5','E5','D5','C#5','B4','A4','B4','C#5','D5','C#5','B4','A4','G4','F#4','G4','A4']},{name:'Greensleeves',notes:['A4','C5','D5','E5','F5','E5','D5','B4','G4','A4','B4','C5','A4','A4','G#4','A4','B4','G#4','E4']}]`;
h = h.substring(0, junkAfterAnchor) + newMelodies + h.substring(junkEndPos);
fixes++;log('OK: Fix melodies — removed shape junk, added proper melodies for levels 3-5');

// ============ FIX 1: Dodecahedron — proper edge-traced path ============
// Now only ONE instance remains (in initDots SHAPES)
rep(
  `{name:'Dodecahedron', pts3d:[[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],[0,0.618,1.618],[0,-0.618,1.618],[0,0.618,-1.618],[0,-0.618,-1.618],[0.618,1.618,0],[-0.618,1.618,0],[0.618,-1.618,0],[-0.618,-1.618,0],[1.618,0,0.618],[-1.618,0,0.618],[1.618,0,-0.618],[-1.618,0,-0.618],[-1,-1,-1]], closed:false, color:'#27ae60'}`,
  `{name:'Dodecahedron', pts3d:[[1,1,1],[0,0.618,1.618],[0,-0.618,1.618],[1,-1,1],[1.618,0,0.618],[1,1,1],[0.618,1.618,0],[-0.618,1.618,0],[-1,1,1],[0,0.618,1.618],[-1,1,1],[-1.618,0,0.618],[-1,-1,1],[0,-0.618,1.618],[1,-1,1],[0.618,-1.618,0],[-0.618,-1.618,0],[-1,-1,1],[-1,-1,-1],[-1.618,0,-0.618],[-1.618,0,0.618],[-1,1,1],[-0.618,1.618,0],[0.618,1.618,0],[1,1,-1],[0,0.618,-1.618],[0,-0.618,-1.618],[1,-1,-1],[1.618,0,-0.618],[1.618,0,0.618],[1,-1,1],[0.618,-1.618,0],[1,-1,-1],[0,-0.618,-1.618],[-1,-1,-1],[-0.618,-1.618,0],[0.618,-1.618,0],[1,-1,-1],[1.618,0,-0.618],[1,1,-1],[1,1,1],[0.618,1.618,0],[1,1,-1],[0,0.618,-1.618],[-1,1,-1],[-0.618,1.618,0],[-1,1,-1],[-1.618,0,-0.618],[-1,-1,-1],[0,-0.618,-1.618],[-1,1,-1],[0,0.618,-1.618]], closed:false, color:'#27ae60'}`,
  'Dodecahedron edge-traced path'
);

// ============ FIX 2: Icosahedron — proper edge-traced path ============
rep(
  `{name:'Icosahedron', pts3d:[[0,1,1.618],[0,-1,1.618],[0,1,-1.618],[0,-1,-1.618],[1,1.618,0],[-1,1.618,0],[1,-1.618,0],[-1,-1.618,0],[1.618,0,1],[-1.618,0,1],[1.618,0,-1],[-1.618,0,-1],[0,1,1.618]], closed:false, color:'#2980b9'}`,
  `{name:'Icosahedron', pts3d:[[0,1,1.618],[1.618,0,1],[0,-1,1.618],[-1.618,0,1],[0,1,1.618],[-1,1.618,0],[-1.618,0,1],[-1,-1.618,0],[0,-1,1.618],[1,-1.618,0],[1.618,0,1],[1,1.618,0],[0,1,1.618],[-1,1.618,0],[0,1,-1.618],[1,1.618,0],[1.618,0,-1],[1.618,0,1],[1,-1.618,0],[1.618,0,-1],[0,-1,-1.618],[0,1,-1.618],[-1.618,0,-1],[-1,1.618,0],[0,1,-1.618],[-1.618,0,-1],[-1,-1.618,0],[0,-1,-1.618],[1,-1.618,0],[-1,-1.618,0],[-1.618,0,-1],[0,-1,-1.618],[1.618,0,-1],[1,1.618,0],[-1,1.618,0]], closed:false, color:'#2980b9'}`,
  'Icosahedron edge-traced path'
);

// ============ FIX 3: TruncatedCube — proper edge path ============
rep(
  `{name:'TruncatedCube', pts3d:[[-1,-0.7,-0.7],[-0.7,-1,-0.7],[-0.7,-0.7,-1],[-1,-0.7,0.7],[-0.7,-1,0.7],[-0.7,-0.7,1],[-1,0.7,-0.7],[-0.7,1,-0.7],[-0.7,0.7,-1],[-1,0.7,0.7],[-0.7,1,0.7],[-0.7,0.7,1],[1,-0.7,-0.7],[0.7,-1,-0.7],[0.7,-0.7,-1],[1,-0.7,0.7],[0.7,-1,0.7],[0.7,-0.7,1],[1,0.7,-0.7],[0.7,1,-0.7],[0.7,0.7,-1],[1,0.7,0.7],[0.7,1,0.7],[0.7,0.7,1],[-1,-0.7,-0.7]], closed:false, color:'#8e44ad'}`,
  `{name:'TruncatedCube', pts3d:[[-0.7,-1,-0.7],[0.7,-1,-0.7],[1,-0.7,-0.7],[1,-0.7,0.7],[0.7,-1,0.7],[-0.7,-1,0.7],[-1,-0.7,0.7],[-1,-0.7,-0.7],[-0.7,-1,-0.7],[-0.7,-0.7,-1],[0.7,-0.7,-1],[0.7,-1,-0.7],[1,-0.7,-0.7],[1,0.7,-0.7],[0.7,1,-0.7],[-0.7,1,-0.7],[-1,0.7,-0.7],[-1,-0.7,-0.7],[-0.7,-0.7,-1],[-0.7,0.7,-1],[0.7,0.7,-1],[0.7,-0.7,-1],[1,-0.7,-0.7],[1,-0.7,0.7],[1,0.7,0.7],[0.7,0.7,1],[0.7,-0.7,1],[1,-0.7,0.7],[0.7,-1,0.7],[0.7,-1,-0.7],[-0.7,-1,0.7],[-0.7,-0.7,1],[0.7,-0.7,1],[0.7,0.7,1],[0.7,1,0.7],[-0.7,1,0.7],[-0.7,0.7,1],[-0.7,-0.7,1],[-1,-0.7,0.7],[-1,0.7,0.7],[-0.7,0.7,1],[-0.7,1,0.7],[0.7,1,0.7],[0.7,1,-0.7],[0.7,0.7,-1],[-0.7,0.7,-1],[-0.7,1,-0.7],[-1,0.7,-0.7],[-1,0.7,0.7],[-1,-0.7,0.7],[-1,-0.7,-0.7],[-1,0.7,-0.7],[1,0.7,-0.7],[1,0.7,0.7],[1,-0.7,0.7]], closed:false, color:'#8e44ad'}`,
  'TruncatedCube edge-traced path'
);

// ============ FIX 4: Tesseract — make different from Hypercube ============
// Hypercube is outer+inner cube with connecting edges
// Replace Tesseract with 16-cell (cross-polytope): 8 vertices at ±1 on each axis
rep(
  `{name:'Tesseract', pts3d:[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1],[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5],[-0.5,0.5,0.5],[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[0.5,-0.5,-0.5],[-1,-1,-1],[-0.5,-0.5,-0.5],[-1,-1,1],[-0.5,-0.5,0.5],[1,-1,1],[0.5,-0.5,0.5],[1,-1,-1],[0.5,-0.5,-0.5],[-1,-1,-1],[-0.5,-0.5,-0.5],[-1,1,-1],[-0.5,0.5,-0.5],[-1,1,1],[-0.5,0.5,0.5],[1,1,1],[0.5,0.5,0.5]], closed:false, color:'#9b59b6'}`,
  `{name:'Tesseract', pts3d:[[1,0,0],[0,1,0],[-1,0,0],[0,-1,0],[1,0,0],[0,0,1],[0,1,0],[0,0,-1],[-1,0,0],[0,0,1],[0,-1,0],[0,0,-1],[1,0,0],[0,0,-1],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,1],[0,1,0],[0,-1,0],[0,0,-1]], closed:false, color:'#9b59b6'}`,
  'Tesseract → 16-cell (cross-polytope)'
);

// ============ FIX 5: 3D projection — switch to orthographic with bounding sphere ============
rep(
  `const cosX=Math.cos(rotX),sinX=Math.sin(rotX),cosY=Math.cos(rotY),sinY=Math.sin(rotY);\n            let maxR=0.01; sh.pts3d.forEach(([x,y,z])=>maxR=Math.max(maxR,Math.hypot(x,y,z)));\n            norm=sh.pts3d.map(([x,y,z])=>{\n                const nx=x/maxR, ny=y/maxR, nz=z/maxR;\n                const x1=nx*cosY-nz*sinY,z1=nx*sinY+nz*cosY;\n                const y2=ny*cosX-z1*sinX,z2=ny*sinX+z1*cosX;\n                const scale=460/(4+z2);\n                return [W/2+x1*scale,H/2+y2*scale];\n            });`,
  `const cosX=Math.cos(rotX),sinX=Math.sin(rotX),cosY=Math.cos(rotY),sinY=Math.sin(rotY);\n            let maxR=0.01; sh.pts3d.forEach(([x,y,z])=>maxR=Math.max(maxR,Math.hypot(x,y,z)));\n            const fitScale=(Math.min(W,H)/2-pad)/maxR;\n            norm=sh.pts3d.map(([x,y,z])=>{\n                const x1=x*cosY-z*sinY,z1=x*sinY+z*cosY;\n                const y2=y*cosX-z1*sinX;\n                return [W/2+x1*fitScale,H/2+y2*fitScale];\n            });`,
  '3D projection: orthographic with bounding sphere fit'
);

// ============ FIX 6: Typing keyboard — bigger keys + tappable ============
rep(
  `key.style.cssText = 'width:clamp(22px,5vw,36px);height:clamp(26px,5vw,40px);background:#333;color:#aaa;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:clamp(0.65rem,2vw,0.9rem);font-family:"JetBrains Mono",monospace;transition:all 0.15s;';`,
  `key.style.cssText = 'width:clamp(30px,8vw,46px);height:clamp(36px,8vw,52px);background:#333;color:#aaa;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:clamp(0.8rem,2.5vw,1.1rem);font-family:"JetBrains Mono",monospace;transition:all 0.15s;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;';\r\n        key.addEventListener('pointerdown',function(ev){ev.preventDefault();window.dispatchEvent(new KeyboardEvent('keydown',{key:this.dataset.key,bubbles:true}));});`,
  'Typing keyboard bigger + tappable'
);

// ============ FIX 7: Fix netdebug tutorial ============
rep(
  `netdebug:{title:'\\ud83e\\udde0 How to Play AI Ethics Debug',steps:[\r\n      'Debug a neural network while considering ethical implications.',\r\n      'Use <b>Add Node</b> to place neurons on the canvas. Drag nodes to reposition.',\r\n      'Use <b>Connect</b> to draw connections between nodes (drag from one node to another).',\r\n      'Use <b>Adjust Bias</b> to modify node biases (click nodes to change values).',\r\n      'Click <b>Test Network</b> to check if the network is working ethically.',\r\n      '<b>Ethics challenge:</b> Ensure the network avoids bias and treats all inputs fairly.'\r\n    ]}`,
  `netdebug:{title:'\\ud83e\\udde0 How to Play AI Ethics Debug',steps:[\r\n      'Investigate a neural network to find and fix ethical issues across <b>3 levels</b>.',\r\n      'Use the tools at the top: <b>Select</b> nodes to inspect, <b>Weight+/Weight\\u2212</b> to adjust connection strengths, <b>Cut Wire</b> to remove biased connections.',\r\n      'Click <b>Test</b> to run test cases through the network and check for fairness.',\r\n      'The network shows <b>input nodes</b> (left), <b>hidden layers</b> (middle), and <b>output</b> (right). Connections glow based on weight strength.',\r\n      'Each level introduces harder ethical scenarios \\u2014 unfair weighting, biased routing, and hidden discrimination.',\r\n      '<b>Tip:</b> Look for connections with extreme weights \\u2014 they often indicate bias that needs correction.'\r\n    ]}`,
  'Fix netdebug tutorial'
);

// ============ FIX 8: Fix versus tutorial ============
rep(
  `versus:{title:'\\ud83e\\udd1d How to Play Team Challenges',steps:[\r\n      'Compete in multiplayer challenges with friends or AI opponents.',\r\n      'Choose a <b>challenge type</b>: Coding puzzles or Geography quizzes.',\r\n      'Create a <b>room</b> and share the code, or join an existing room.',\r\n      'Work together as a team to solve problems and answer questions.',\r\n      'Submit answers and see team scores update in real-time.',\r\n      '<b>Tip:</b> Communication is key! Discuss strategies with your teammates.'\r\n    ]}`,
  `versus:{title:'\\u2694\\ufe0f How to Play Knowledge Battle',steps:[\r\n      'Answer <b>timed quiz questions</b> across science, coding, math, and geography!',\r\n      'Read the question and tap the correct answer from the <b>4 choices</b> before time runs out.',\r\n      'Correct answers earn points \\u2014 <b>faster answers score more</b>! Build a streak for bonus multipliers.',\r\n      'Wrong answers or timeouts break your streak. The timer bar at top shows remaining time.',\r\n      'After all questions, see your <b>final score</b>, accuracy %, and average speed.',\r\n      '<b>Tip:</b> Read all options before answering \\u2014 some are tricky! Speed matters but accuracy matters more.'\r\n    ]}`,
  'Fix versus tutorial'
);

// ============ FIX 9: Fix dots tutorial for 3D shapes ============
rep(
  `dots:{title:'\\ud83d\\udd22 How to Play Connect the Dots',steps:[\r\n      'Tap or click the dots <b>in number order</b> \\u2014 start at 1, then 2, 3, and so on!',\r\n      'A line will draw between each dot as you connect them. Complete the full picture!',\r\n      'Each level unlocks <b>harder shapes</b> \\u2014 simple polygons early on, complex animals and scenes later.',\r\n      'Press <b>Hint</b> if you get stuck \\u2014 it will highlight the next dot to tap.',\r\n      'Finish the whole shape to reveal the coloured artwork and earn bonus points!'\r\n    ]}`,
  `dots:{title:'\\ud83d\\udd22 How to Play Connect the Dots',steps:[\r\n      'Tap or click the dots <b>in number order</b> \\u2014 start at 1, then 2, 3, and so on!',\r\n      'A line will draw between each dot as you connect them. Complete the full picture!',\r\n      '<b>Levels 1\\u20132:</b> Flat 2D shapes like stars, hearts, and rockets.',\r\n      '<b>Levels 3\\u20135:</b> 3D shapes that you can <b>drag to rotate</b>! Spin them around to find the next dot.',\r\n      'Press <b>Hint</b> if you get stuck \\u2014 it highlights and pulses the next dot to tap.',\r\n      'Press <b>Skip</b> to jump to another shape if one is too tricky.'\r\n    ]}`,
  'Fix dots tutorial for 3D shapes'
);

fs.writeFileSync('learn/index.html',h);
log(`\nDone! ${fixes} fixes applied.`);
