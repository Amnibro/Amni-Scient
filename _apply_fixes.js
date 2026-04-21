const fs=require('fs');
const file='learn/index.html';
let h=fs.readFileSync(file,'utf8');
const orig=h;

// Helper: find balanced closing brace
function findFuncEnd(text,startOfFunc){
  const startBrace=text.indexOf('{',startOfFunc);
  let depth=0,inStr=null,esc=false;
  for(let i=startBrace;i<text.length;i++){
    const c=text[i];
    if(esc){esc=false;continue;}
    if(c==='\\'){esc=true;continue;}
    if(inStr){if(c===inStr&&(inStr!=='`'||c==='`'))inStr=null;continue;}
    if(c==="'"||c==='"'||c==='`'){inStr=c;continue;}
    if(c==='{')depth++;
    if(c==='}'){depth--;if(depth===0)return i;}
  }
  return -1;
}

// ========== 1. Replace SHAPES levels 3-5 with 3D data ==========
console.log('1. Replacing SHAPES levels 3-5...');
const lvl3Anchor="      3:[\n        {name:'Butterfly'";
const i3=h.indexOf(lvl3Anchor);
if(i3===-1){console.error('Cannot find level 3 start');process.exit(1);}
// Find the closing of SHAPES: "      ]\n    };"
// Search for the pattern after level 5
const shapesEndPattern="      ]\n    };";
const iEnd=h.indexOf(shapesEndPattern,i3);
if(iEnd===-1){console.error('Cannot find SHAPES end');process.exit(1);}

const newLevels=`      3:[
        {name:'Cube',pts3d:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[1,-1,1],[1,1,1],[1,1,-1],[1,1,1],[-1,1,1],[-1,1,-1],[-1,1,1],[-1,-1,1]],closed:false,color:'#9b59b6'},
        {name:'Tetrahedron',pts3d:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,1,1],[1,-1,-1],[-1,-1,1],[1,-1,-1],[-1,1,-1]],closed:false,color:'#3498db'},
        {name:'Prism',pts3d:[[0,-1,-1],[0.87,-1,0.5],[-0.87,-1,0.5],[0,-1,-1],[0,1,-1],[0.87,1,0.5],[0.87,-1,0.5],[0.87,1,0.5],[-0.87,1,0.5],[-0.87,-1,0.5],[-0.87,1,0.5],[0,1,-1]],closed:false,color:'#e67e22'},
        {name:'Pyramid',pts3d:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[-1,-1,-1],[0,1,0],[1,-1,-1],[0,1,0],[1,-1,1],[0,1,0],[-1,-1,1]],closed:false,color:'#2ecc71'},
        {name:'Diamond3D',pts3d:[[0,1.2,0],[-1,0,-1],[1,0,-1],[0,1.2,0],[1,0,1],[-1,0,1],[0,1.2,0],[-1,0,-1],[0,-1.2,0],[1,0,-1],[1,0,1],[0,-1.2,0],[-1,0,1],[-1,0,-1]],closed:false,color:'#e74c3c'}
      ],
      4:[
        {name:'Octahedron',pts3d:[[0,1,0],[1,0,0],[0,0,1],[0,1,0],[-1,0,0],[0,0,1],[0,-1,0],[1,0,0],[0,0,-1],[0,1,0],[-1,0,0],[0,0,-1],[0,-1,0],[0,0,1],[1,0,0],[0,-1,0],[-1,0,0]],closed:false,color:'#1abc9c'},
        {name:'PentaPrism',pts3d:[[1,-1,0],[0.309,-1,0.951],[-0.809,-1,0.588],[-0.809,-1,-0.588],[0.309,-1,-0.951],[1,-1,0],[1,1,0],[0.309,1,0.951],[0.309,-1,0.951],[0.309,1,0.951],[-0.809,1,0.588],[-0.809,-1,0.588],[-0.809,1,0.588],[-0.809,1,-0.588],[-0.809,-1,-0.588],[-0.809,1,-0.588],[0.309,1,-0.951],[0.309,-1,-0.951],[0.309,1,-0.951],[1,1,0],[1,-1,0],[1,1,0]],closed:false,color:'#e67e22'},
        {name:'HexPrism',pts3d:[[1,-1,0],[0.5,-1,0.866],[-0.5,-1,0.866],[-1,-1,0],[-0.5,-1,-0.866],[0.5,-1,-0.866],[1,-1,0],[1,1,0],[0.5,1,0.866],[0.5,-1,0.866],[0.5,1,0.866],[-0.5,1,0.866],[-0.5,-1,0.866],[-0.5,1,0.866],[-1,1,0],[-1,-1,0],[-1,1,0],[-0.5,1,-0.866],[-0.5,-1,-0.866],[-0.5,1,-0.866],[0.5,1,-0.866],[0.5,-1,-0.866],[0.5,1,-0.866],[1,1,0],[1,-1,0],[1,1,0]],closed:false,color:'#8e44ad'},
        {name:'Cuboctahedron',pts3d:[[1,1,0],[1,0,1],[0,-1,1],[1,-1,0],[1,0,-1],[1,1,0],[0,1,1],[-1,0,1],[0,-1,1],[-1,-1,0],[-1,0,-1],[0,1,-1],[1,1,0],[1,0,-1],[0,-1,-1],[-1,-1,0],[-1,0,1],[0,1,1],[-1,1,0],[0,1,-1],[-1,0,-1],[0,-1,-1],[1,-1,0],[1,0,1],[-1,0,1],[-1,1,0],[0,1,1],[1,1,0],[0,1,-1],[-1,1,0]],closed:false,color:'#f39c12'}
      ],
      5:[
        {name:'Icosahedron',pts3d:[[0,0.526,0.851],[0,-0.526,0.851],[0.851,0,0.526],[0,0.526,0.851],[0.526,0.851,0],[0.851,0,0.526],[0.526,-0.851,0],[0,-0.526,0.851],[-0.851,0,0.526],[0,0.526,0.851],[-0.526,0.851,0],[0.526,0.851,0],[0.851,0,-0.526],[0,0.526,-0.851],[-0.526,0.851,0],[-0.851,0,0.526],[-0.526,-0.851,0],[0,-0.526,0.851],[0.526,-0.851,0],[0.851,0,-0.526],[0,-0.526,-0.851],[-0.526,-0.851,0],[-0.851,0,-0.526],[0,0.526,-0.851],[0.526,0.851,0],[-0.526,0.851,0],[-0.851,0,-0.526],[0,-0.526,-0.851],[0.526,-0.851,0],[0.851,0,0.526],[0.851,0,-0.526],[0,0.526,-0.851],[0,-0.526,-0.851],[-0.526,-0.851,0],[-0.851,0,0.526],[-0.851,0,-0.526]],closed:false,color:'#27ae60'},
        {name:'Dodecahedron',pts3d:[[-1,-1,-1],[0,-0.618,-1.618],[1,-1,-1],[1.618,0,-0.618],[1,1,-1],[0,0.618,-1.618],[-1,1,-1],[-1.618,0,-0.618],[-1,-1,-1],[-0.618,-1.618,0],[-1,-1,1],[0,-0.618,1.618],[1,-1,1],[0.618,-1.618,0],[1,-1,-1],[0.618,-1.618,0],[-0.618,-1.618,0],[0.618,-1.618,0],[1,-1,1],[1.618,0,0.618],[1,1,1],[0,0.618,1.618],[-1,1,1],[-0.618,1.618,0],[-1,1,-1],[-0.618,1.618,0],[0.618,1.618,0],[1,1,-1],[0.618,1.618,0],[1,1,1],[0.618,1.618,0],[-0.618,1.618,0],[-1,1,1],[-1.618,0,0.618],[-1,-1,1],[-1.618,0,0.618],[-1.618,0,-0.618],[-1.618,0,0.618],[-1,1,1],[0,0.618,1.618],[0,-0.618,1.618],[0,0.618,1.618],[1,1,1],[1.618,0,0.618],[1.618,0,-0.618],[1.618,0,0.618],[1,-1,1],[0,-0.618,1.618],[-1,-1,1],[-0.618,-1.618,0],[-1,-1,-1],[-1.618,0,-0.618],[-1,1,-1],[0,0.618,-1.618],[0,-0.618,-1.618]],closed:false,color:'#e84393'},
        {name:'Antiprism',pts3d:[[1,-0.5,0],[0.809,0.5,0.588],[0.309,-0.5,0.951],[-0.309,0.5,0.951],[-0.809,-0.5,0.588],[-1,0.5,0],[-0.809,-0.5,-0.588],[-0.309,0.5,-0.951],[0.309,-0.5,-0.951],[0.809,0.5,-0.588],[1,-0.5,0],[0.809,0.5,0.588],[-0.309,0.5,0.951],[-1,0.5,0],[-0.309,0.5,-0.951],[0.809,0.5,-0.588]],closed:false,color:'#2980b9'}
      ]`;

h=h.substring(0,i3)+newLevels+h.substring(iEnd);
console.log('  Done. Replaced',iEnd-i3,'chars');

// ========== 2. Add _dotsDraw variable ==========
console.log('2. Adding _dotsDraw variable...');
const addDraw="    let shapeIdx=0,nextDot=0,done=false,hintOn=false;\n    function loadShape(){";
if(!h.includes(addDraw)){console.error('Cannot find shapeIdx line');process.exit(1);}
h=h.replace(addDraw,"    let shapeIdx=0,nextDot=0,done=false,hintOn=false;\n    let _dotsDraw=null;\n    function loadShape(){");
console.log('  Done.');

// ========== 3. Replace loadShape function ==========
console.log('3. Replacing loadShape function...');
const lsMarker="    function loadShape(){";
const lsIdx=h.indexOf(lsMarker);
if(lsIdx===-1){console.error('Cannot find loadShape');process.exit(1);}
const lsEnd=findFuncEnd(h,lsIdx);
if(lsEnd===-1){console.error('Cannot find loadShape end');process.exit(1);}

const newLoadShape=`    function loadShape(){
      const sh=shapeList[shapeIdx];nextDot=0;done=false;hintOn=false;
      const pad=50,W=400,H=400;
      cv.width=W;cv.height=H;
      const ctx=cv.getContext('2d');
      const hitR=lvl<=1?32:lvl<=2?26:22;
      cv.onclick=null;cv.ontouchend=null;cv.onpointerdown=null;cv.onpointermove=null;cv.onpointerup=null;cv.style.touchAction='auto';
      let norm;
      if(sh.pts3d){
        let rotX=0.4,rotY=0.3,hasDrag=false,lpx=0,lpy=0,spx=0,spy=0;
        let maxR=0;sh.pts3d.forEach(([x,y,z])=>{const r=Math.hypot(x,y,z);if(r>maxR)maxR=r;});
        const fit=(Math.min(W,H)/2-pad)/(maxR||1);
        function project(){
          const cx=Math.cos(rotX),sx=Math.sin(rotX),cy=Math.cos(rotY),sy=Math.sin(rotY);
          norm=sh.pts3d.map(([x,y,z])=>{
            const x1=x*cy-z*sy,z1=x*sy+z*cy,y1=y*cx-z1*sx;
            return [Math.round(W/2+x1*fit),Math.round(H/2+y1*fit)];
          });
        }
        project();
        cv.style.touchAction='none';
        cv.onpointerdown=e=>{spx=e.clientX;spy=e.clientY;lpx=e.clientX;lpy=e.clientY;hasDrag=false;cv.setPointerCapture(e.pointerId);};
        cv.onpointermove=e=>{if(!(e.buttons&1))return;if(Math.hypot(e.clientX-spx,e.clientY-spy)>5)hasDrag=true;rotY+=(e.clientX-lpx)*0.01;rotX+=(e.clientY-lpy)*0.01;lpx=e.clientX;lpy=e.clientY;project();draw();};
        cv.onpointerup=e=>{if(!hasDrag)tap(e);};
      } else {
        const xs=sh.pts.map(p=>p[0]),ys=sh.pts.map(p=>p[1]);
        const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
        const sc=Math.min((W-pad*2)/(maxX-minX||1),(H-pad*2)/(maxY-minY||1));
        const offX=pad+(W-pad*2-(maxX-minX)*sc)/2-minX*sc;
        const offY=pad+(H-pad*2-(maxY-minY)*sc)/2-minY*sc;
        norm=sh.pts.map(([x,y])=>[Math.round(x*sc+offX),Math.round(y*sc+offY)]);
        cv.onclick=tap;cv.ontouchend=tap;
      }
      function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#fafafa';ctx.fillRect(0,0,W,H);
        if(sh.pts3d){ctx.fillStyle='#999';ctx.font='11px JetBrains Mono,monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('Drag to rotate',W/2,H-8);}
        if(nextDot>1||done){
          ctx.beginPath();ctx.moveTo(norm[0][0],norm[0][1]);
          const lim=done?norm.length:nextDot;
          for(let i=1;i<lim;i++)ctx.lineTo(norm[i][0],norm[i][1]);
          if(done&&sh.closed)ctx.closePath();
          ctx.strokeStyle=sh.color;ctx.lineWidth=done?5:3;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
          if(done){ctx.fillStyle=sh.color+'55';ctx.fill();}
        }
        norm.forEach(([x,y],i)=>{
          const connected=i<nextDot,isNext=i===nextDot;
          ctx.beginPath();ctx.arc(x,y,connected?8:isNext?13:9,0,6.28);
          ctx.fillStyle=connected?sh.color:isNext?(hintOn?'#e74c3c':'#f1c40f'):'#ccc';
          if(isNext&&hintOn){ctx.shadowColor='#e74c3c';ctx.shadowBlur=20;}
          ctx.fill();ctx.shadowBlur=0;
          ctx.strokeStyle=connected?sh.color:'#999';ctx.lineWidth=2;ctx.stroke();
          if(!done){
            ctx.fillStyle=connected?'#fff':isNext?'#333':'#555';
            ctx.font=\`bold \${i>=9?10:12}px 'JetBrains Mono',monospace\`;
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(i+1,x,y);
          }
        });
        if(done){
          ctx.fillStyle=sh.color;
          ctx.font='bold 20px JetBrains Mono,monospace';
          ctx.textAlign='center';ctx.textBaseline='top';
          ctx.fillText('\\u2b50 '+sh.name+'!',W/2,10);
        }
      }
      draw();
      _dotsDraw=draw;
      function tap(e){
        if(done)return;
        if(e.preventDefault)e.preventDefault();
        const r=cv.getBoundingClientRect();
        const pt=e.changedTouches?e.changedTouches[0]:e;
        const mx=(pt.clientX-r.left)*(W/r.width),my=(pt.clientY-r.top)*(H/r.height);
        const [tx,ty]=norm[nextDot];
        if(Math.hypot(mx-tx,my-ty)<hitR){
          nextDot++;hintOn=false;
          if(nextDot>=norm.length){
            done=true;
            addScore(lvl*10);showFeedback('\\u2b50 '+sh.name+'!','#f1c40f');
            draw();
            setTimeout(()=>{shapeIdx=(shapeIdx+1)%shapeList.length;loadShape();},2200);
          } else draw();
        }
      }
      renderUI(sh);
    }`;

h=h.substring(0,lsIdx)+newLoadShape+h.substring(lsEnd+1);
console.log('  Done.');

// ========== 4. Replace renderUI function ==========
console.log('4. Replacing renderUI function...');
const ruMarker="    function renderUI(sh){";
const ruIdx=h.indexOf(ruMarker);
if(ruIdx===-1){console.error('Cannot find renderUI');process.exit(1);}
const ruEnd=findFuncEnd(h,ruIdx);
if(ruEnd===-1){console.error('Cannot find renderUI end');process.exit(1);}

const newRenderUI=`    function renderUI(sh){
      ui.innerHTML='';
      const info=document.createElement('div');
      info.style.cssText='font-family:JetBrains Mono,monospace;color:#f39c12;font-size:0.9rem;';
      info.innerHTML=\`Shape \${shapeIdx+1}/\${shapeList.length}: <b>\${sh.name}</b>\${sh.pts3d?' <span style="color:#888">(3D)</span>':''}\`;
      const hint=document.createElement('button');hint.className='lab-tool';hint.textContent='\\ud83d\\udca1 Hint';hint.style.padding='6px 14px';
      hint.onclick=()=>{hintOn=true;if(_dotsDraw)_dotsDraw();};
      const skip=document.createElement('button');skip.className='lab-tool';skip.textContent='\\u23ed Skip';skip.style.padding='6px 14px';
      skip.onclick=()=>{shapeIdx=(shapeIdx+1)%shapeList.length;loadShape();};
      ui.append(info,hint,skip);
    }`;

h=h.substring(0,ruIdx)+newRenderUI+h.substring(ruEnd+1);
console.log('  Done.');

// ========== 5. Fix typing keyboard - bigger keys + tappable ==========
console.log('5. Fixing typing keyboard...');
const oldKeyStyle="key.style.cssText = 'width:clamp(22px,5vw,36px);height:clamp(26px,5vw,40px);background:#333;color:#aaa;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:clamp(0.65rem,2vw,0.9rem);font-family:\"JetBrains Mono\",monospace;transition:all 0.15s;';\n        key.className = 'kb-key';\n        rowDiv.appendChild(key);";
const newKeyStyle=`key.style.cssText = 'width:clamp(30px,8vw,46px);height:clamp(36px,8vw,52px);background:#333;color:#aaa;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:clamp(0.8rem,2.5vw,1.1rem);font-family:"JetBrains Mono",monospace;transition:all 0.15s;cursor:pointer;user-select:none;-webkit-user-select:none;';
        key.className = 'kb-key';
        key.onclick = () => { window.dispatchEvent(new KeyboardEvent('keydown', {key: k, bubbles: true})); };
        rowDiv.appendChild(key);`;
if(!h.includes(oldKeyStyle)){console.error('Cannot find keyboard style');process.exit(1);}
h=h.replace(oldKeyStyle,newKeyStyle);

// Also add touch-action to keyboard container
const oldKbStyle="kb.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:10px;';";
const newKbStyle="kb.style.cssText='display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:12px;touch-action:manipulation;';";
h=h.replace(oldKbStyle,newKbStyle);
console.log('  Done.');

// ========== 6. Fix netdebug tutorial ==========
console.log('6. Fixing netdebug tutorial...');
const oldNetTut=`netdebug:{title:'\\ud83e\\udde0 How to Play AI Ethics Debug',steps:[
      'Debug a neural network while considering ethical implications.',
      'Use <b>Add Node</b> to place neurons on the canvas. Drag nodes to reposition.',
      'Use <b>Connect</b> to draw connections between nodes (drag from one node to another).',
      'Use <b>Adjust Bias</b> to modify node biases (click nodes to change values).',
      'Click <b>Test Network</b> to check if the network is working ethically.',
      '<b>Ethics challenge:</b> Ensure the network avoids bias and treats all inputs fairly.'
    ]},`;
const newNetTut=`netdebug:{title:'\\ud83e\\udde0 How to Play AI Ethics Debug',steps:[
      'Each level presents a <b>biased neural network</b> scenario (loans, hiring, etc.).',
      'Use <b>Select</b> to inspect nodes and see how weights affect decisions.',
      'Use <b>Weight+</b> and <b>Weight\\u2212</b> to adjust connection strengths toward fairness.',
      'Use <b>Cut Wire</b> to remove problematic or discriminatory connections.',
      'Click <b>Test</b> to check if the network now treats all inputs fairly.',
      '<b>Goal:</b> Reduce bias in each scenario until the network passes the ethics check!'
    ]},`;
if(!h.includes(oldNetTut)){console.error('Cannot find netdebug tutorial');process.exit(1);}
h=h.replace(oldNetTut,newNetTut);
console.log('  Done.');

// ========== 7. Fix versus tutorial ==========
console.log('7. Fixing versus tutorial...');
const oldVsTut=`versus:{title:'\\ud83e\\udd1d How to Play Team Challenges',steps:[
      'Compete in multiplayer challenges with friends or AI opponents.',
      'Choose a <b>challenge type</b>: Coding puzzles or Geography quizzes.',
      'Create a <b>room</b> and share the code, or join an existing room.',
      'Work together as a team to solve problems and answer questions.',
      'Submit answers and see team scores update in real-time.',
      '<b>Tip:</b> Communication is key! Discuss strategies with your teammates.'
    ]}`;
const newVsTut=`versus:{title:'\\ud83c\\udfc6 How to Play Speed Challenge',steps:[
      'Race against the clock to answer as many questions as you can!',
      'Choose a <b>category</b>: Coding, Science, or Geography.',
      'Type your answer and press <b>Enter</b> or click <b>Submit</b>.',
      'You have <b>60 seconds</b>. Each correct answer earns points!',
      'Use <b>Hint</b> for help, or <b>Skip</b> to move on to the next question.',
      '<b>Tip:</b> Fuzzy matching is enabled \\u2014 close answers still count!'
    ]}`;
if(!h.includes(oldVsTut)){console.error('Cannot find versus tutorial');process.exit(1);}
h=h.replace(oldVsTut,newVsTut);
console.log('  Done.');

// ========== 8. Fix dots tutorial ==========
console.log('8. Fixing dots tutorial...');
const oldDotsTut=`dots:{title:'\\ud83d\\udd22 How to Play Connect the Dots',steps:[
      'Tap or click the dots <b>in number order</b> \\u2014 start at 1, then 2, 3, and so on!',
      'A line will draw between each dot as you connect them. Complete the full picture!',
      'Each level unlocks <b>harder shapes</b> \\u2014 simple polygons early on, complex animals and scenes later.',
      'Press <b>Hint</b> if you get stuck \\u2014 it will highlight the next dot to tap.',
      'Finish the whole shape to reveal the coloured artwork and earn bonus points!'
    ]},`;
const newDotsTut=`dots:{title:'\\ud83d\\udd22 How to Play Connect the Dots',steps:[
      'Tap or click the dots <b>in number order</b> \\u2014 start at 1, then 2, 3, and so on!',
      'A line will draw between each dot as you connect them. Complete the full picture!',
      'Levels 1\\u20132 have flat shapes. Levels 3\\u20135 feature <b>3D geometric shapes</b> \\u2014 drag to rotate them!',
      'Press <b>Hint</b> if you get stuck \\u2014 it will highlight the next dot to tap.',
      'Finish the whole shape to reveal the artwork and earn bonus points!'
    ]},`;
if(!h.includes(oldDotsTut)){console.error('Cannot find dots tutorial');process.exit(1);}
h=h.replace(oldDotsTut,newDotsTut);
console.log('  Done.');

// ========== Write file ==========
fs.writeFileSync(file,h);
console.log('\nAll changes applied successfully!');
console.log('File size: '+orig.length+' -> '+h.length);
