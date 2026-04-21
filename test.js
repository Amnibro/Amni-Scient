function initDots() {
    const cv=$$('#dots-canvas'),ui=$$('#dots-ui');
    const SHAPES={
      1:[
        {name:'Triangle',pts:[[200,80],[350,300],[50,300]],closed:true,color:'#e74c3c'},
        {name:'Square',pts:[[80,80],[320,80],[320,320],[80,320]],closed:true,color:'#3498db'},
        {name:'House',pts:[[200,60],[340,180],[340,340],[60,340],[60,180]],closed:true,color:'#2ecc71'},
        {name:'Diamond',pts:[[200,50],[360,200],[200,350],[40,200]],closed:true,color:'#e67e22'},
        {name:'Arrow',pts:[[60,170],[240,170],[240,100],[360,200],[240,300],[240,230],[60,230]],closed:true,color:'#9b59b6'},
        {name:'Kite',pts:[[200,50],[300,150],[200,350],[100,150]],closed:true,color:'#1abc9c'},
        {name:'Hexagon',pts:[[200,50],[300,100],[300,250],[200,300],[100,250],[100,100]],closed:true,color:'#f1c40f'},
        {name:'Shield',pts:[[100,50],[300,50],[300,200],[200,350],[100,200]],closed:true,color:'#34495e'},
        {name:'Crown',pts:[[50,150],[100,300],[300,300],[350,150],[250,200],[200,100],[150,200]],closed:true,color:'#e84393'},
        {name:'Mug',pts:[[100,100],[250,100],[250,300],[100,300],[100,100],[250,150],[300,150],[300,250],[250,250]],closed:false,color:'#d35400'},
        {name:'Pentagon',pts:[[200,50],[350,150],[290,320],[110,320],[50,150]],closed:true,color:'#8e44ad'},
        {name:'Trapezoid',pts:[[120,100],[280,100],[350,280],[50,280]],closed:true,color:'#d35400'},
        {name:'Parallelogram',pts:[[150,100],[350,100],[250,280],[50,280]],closed:true,color:'#2980b9'},
        {name:'Rhombus',pts:[[200,50],[300,200],[200,350],[100,200]],closed:true,color:'#16a085'}
      ],
      2:[
        {name:'Star',pts:[[200,40],[232,132],[330,132],[252,188],[280,280],[200,228],[120,280],[148,188],[70,132],[168,132]],closed:true,color:'#f1c40f'},
        {name:'Heart',pts:[[200,280],[100,180],[70,130],[90,90],[130,80],[170,90],[200,115],[230,90],[270,80],[310,90],[330,130],[300,180]],closed:true,color:'#e84393'},
        {name:'Cross',pts:[[140,60],[260,60],[260,140],[340,140],[340,260],[260,260],[260,340],[140,340],[140,260],[60,260],[60,140],[140,140]],closed:true,color:'#e74c3c'},
        {name:'Lightning',pts:[[240,40],[120,220],[200,220],[160,360],[320,160],[230,160],[280,40]],closed:true,color:'#f1c40f'},
        {name:'Rocket',pts:[[200,40],[240,110],[260,180],[255,290],[235,320],[200,340],[165,320],[145,290],[140,180],[160,110]],closed:true,color:'#3498db'},
        {name:'Moon',pts:[[200,50],[250,100],[270,180],[250,260],[200,310],[120,280],[170,260],[200,200],[190,130],[120,80]],closed:true,color:'#f39c12'},
        {name:'Cloud',pts:[[100,250],[80,200],[120,150],[160,120],[220,110],[280,140],[320,200],[310,260],[260,300],[160,310]],closed:true,color:'#ecf0f1'},
        {name:'Bowtie',pts:[[50,100],[150,180],[50,260],[50,100],[180,180],[310,100],[310,260],[180,180]],closed:false,color:'#8e44ad'},
        {name:'Sword',pts:[[180,300],[220,300],[220,330],[240,330],[240,350],[160,350],[160,330],[180,330],[180,300],[200,280],[200,50],[180,80],[180,300]],closed:false,color:'#95a5a6'},
        {name:'Flag',pts:[[100,350],[100,50],[300,50],[250,100],[300,150],[100,150]],closed:false,color:'#c0392b'},
        {name:'Tree',pts:[[200,50],[140,150],[180,150],[120,250],[180,250],[150,320],[250,320],[220,250],[280,250],[220,150],[260,150]],closed:true,color:'#2ecc71'},
        {name:'Fish',pts:[[100,200],[250,100],[300,150],[350,100],[350,300],[300,250],[250,300]],closed:true,color:'#f39c12'},
        {name:'Boat',pts:[[100,250],[300,250],[250,320],[150,320],[150,250],[200,100],[250,250]],closed:true,color:'#3498db'},
        {name:'Bone',pts:[[100,150],[130,120],[160,150],[240,150],[270,120],[300,150],[300,200],[270,230],[240,200],[160,200],[130,230],[100,200]],closed:true,color:'#ecf0f1'}
      ],
      3:[
        {name:'Cube',pts3d:[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1]],closed:false,color:'#9b59b6'},
        {name:'Pyramid',pts3d:[[0,-1,0],[-1,1,-1],[1,1,-1],[0,-1,0],[1,1,1],[-1,1,1],[0,-1,0],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]],closed:false,color:'#3498db'},
        {name:'Prism',pts3d:[[-1,-1,-1],[1,-1,-1],[0,-1,1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,1,1],[-1,1,-1],[1,1,-1],[1,-1,-1],[0,-1,1],[0,1,1]],closed:false,color:'#e67e22'},
        {name:'Cylinder',pts3d:[[1.0,-1,0.0],[0.71,-1,0.71],[0.0,-1,1.0],[-0.71,-1,0.71],[-1.0,-1,0.0],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[0.71,-1,-0.71],[1.0,-1,0.0],[1.0,1,0.0],[0.71,1,0.71],[0.0,1,1.0],[-0.71,1,0.71],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.0,1,-1.0],[0.71,1,-0.71],[1.0,1,0.0],[0.71,1,0.71],[0.71,-1,0.71],[0.0,-1,1.0],[0.0,1,1.0],[-0.71,1,0.71],[-0.71,-1,0.71],[-1.0,-1,0.0],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[-0.0,1,-1.0],[0.71,1,-0.71],[0.71,-1,-0.71]],closed:false,color:'#1abc9c'},
        {name:'Cone',pts3d:[[1.0,1,0.0],[0.71,1,0.71],[0.0,1,1.0],[-0.71,1,0.71],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.0,1,-1.0],[0.71,1,-0.71],[1.0,1,0.0],[0,-1,0],[0.71,1,0.71],[0,-1,0],[0.0,1,1.0],[0,-1,0],[-0.71,1,0.71],[0,-1,0],[-1.0,1,0.0],[0,-1,0],[-0.71,1,-0.71],[0,-1,0],[-0.0,1,-1.0],[0,-1,0],[0.71,1,-0.71]],closed:false,color:'#d35400'},
        {name:'Gem',pts3d:[[0,-1,0],[-1,0,-1],[1,0,-1],[0,-1,0],[1,0,1],[-1,0,1],[0,-1,0],[-1,0,-1],[-1,0,1],[0,1,0],[1,0,1],[1,0,-1],[0,1,0],[-1,0,-1]],closed:false,color:'#27ae60'},
        {name:'Stairs',pts3d:[[-1,1,-1],[0,1,-1],[0,0,-1],[1,0,-1],[1,-1,-1],[1,-1,1],[1,0,1],[0,0,1],[0,1,1],[-1,1,1],[-1,1,-1],[-1,1,1],[0,1,1],[0,1,-1],[0,0,-1],[0,0,1],[1,0,1],[1,0,-1],[1,-1,-1],[1,-1,1]],closed:false,color:'#7f8c8d'},
        {name:'Diamond3D',pts3d:[[-1,0,0],[0,-1,-1],[1,0,0],[0,-1,1],[-1,0,0],[0,1,-1],[1,0,0],[0,1,1],[-1,0,0],[0,-1,-1],[0,1,-1],[0,-1,1],[0,1,1]],closed:false,color:'#9b59b6'},
        {name:'Tent',pts3d:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[-1,-1,-1],[-1,1,0],[1,-1,-1],[1,-1,1],[1,1,0],[-1,1,0],[-1,-1,1],[1,1,0]],closed:false,color:'#27ae60'},
        {name:'Wedge',pts3d:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[-1,-1,-1],[-1,1,-1],[1,-1,-1],[1,-1,1],[1,1,-1],[-1,1,-1],[-1,-1,1]],closed:false,color:'#e74c3c'}
      ],
      4:[
        {name:'Octahedron',pts3d:[[0,-1,0],[-1,0,0],[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,1,0],[0,0,1],[0,1,0],[0,0,-1],[0,-1,0],[1,0,0],[0,1,0]],closed:false,color:'#e67e22'},
        {name:'Tetrahedron',pts3d:[[0,-1,0],[-1,1,1],[1,1,1],[0,-1,0],[0,1,-1],[-1,1,1],[1,1,1],[0,1,-1]],closed:false,color:'#1abc9c'},
        {name:'HexPrism',pts3d:[[1.0,-1,0.0],[0.5,-1,0.87],[-0.5,-1,0.87],[-1.0,-1,0.0],[-0.5,-1,-0.87],[0.5,-1,-0.87],[1.0,-1,0.0],[1.0,1,0.0],[0.5,1,0.87],[-0.5,1,0.87],[-1.0,1,0.0],[-0.5,1,-0.87],[0.5,1,-0.87],[1.0,1,0.0],[0.5,1,0.87],[0.5,-1,0.87],[-0.5,-1,0.87],[-0.5,1,0.87],[-1.0,1,0.0],[-1.0,-1,0.0],[-0.5,-1,-0.87],[-0.5,1,-0.87],[0.5,1,-0.87],[0.5,-1,-0.87]],closed:false,color:'#8e44ad'},
        {name:'Dipyramid',pts3d:[[0,-1.5,0],[-1,0,-1],[1,0,-1],[0,-1.5,0],[1,0,1],[-1,0,1],[0,-1.5,0],[-1,0,-1],[-1,0,1],[0,1.5,0],[-1,0,-1],[1,0,-1],[0,1.5,0],[1,0,1],[0,1.5,0],[-1,0,1]],closed:false,color:'#2980b9'},
        {name:'Bipyramid',pts3d:[[0,-1.5,0],[-1,0,-1],[1,0,-1],[0,-1.5,0],[1,0,1],[-1,0,1],[0,-1.5,0],[-1,0,-1],[-1,0,1],[0,1.5,0],[-1,0,-1],[1,0,-1],[0,1.5,0],[1,0,1],[0,1.5,0],[-1,0,1]],closed:false,color:'#f39c12'},
        {name:'Cross3D',pts3d:[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1]],closed:false,color:'#e84393'},
        {name:'OctPrism',pts3d:[[1.0,-1,0.0],[0.71,-1,0.71],[0.0,-1,1.0],[-0.71,-1,0.71],[-1.0,-1,0.0],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[0.71,-1,-0.71],[1.0,-1,0.0],[1.0,1,0.0],[0.71,1,0.71],[0.0,1,1.0],[-0.71,1,0.71],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.0,1,-1.0],[0.71,1,-0.71],[1.0,1,0.0],[0.71,1,0.71],[0.71,-1,0.71],[0.0,-1,1.0],[0.0,1,1.0],[-0.71,1,0.71],[-0.71,-1,0.71],[-1.0,-1,0.0],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[-0.0,1,-1.0],[0.71,1,-0.71],[0.71,-1,-0.71]],closed:false,color:'#34495e'}
      ],
      5:[
        {name:'Dodecahedron',pts3d:[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1]],closed:false,color:'#27ae60'},
        {name:'Icosahedron',pts3d:[[0,-1,0],[-1,0,0],[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,1,0],[0,0,1],[0,1,0],[0,0,-1],[0,-1,0],[1,0,0],[0,1,0]],closed:false,color:'#2980b9'},
        {name:'TruncatedCube',pts3d:[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1]],closed:false,color:'#8e44ad'},
        {name:'Hypercube',pts3d:[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1]],closed:false,color:'#c0392b'},
        {name:'TorusWire',pts3d:[[1.0,-1,0.0],[0.71,-1,0.71],[0.0,-1,1.0],[-0.71,-1,0.71],[-1.0,-1,0.0],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[0.71,-1,-0.71],[1.0,-1,0.0],[1.0,1,0.0],[0.71,1,0.71],[0.0,1,1.0],[-0.71,1,0.71],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.0,1,-1.0],[0.71,1,-0.71],[1.0,1,0.0],[0.71,1,0.71],[0.71,-1,0.71],[0.0,-1,1.0],[0.0,1,1.0],[-0.71,1,0.71],[-0.71,-1,0.71],[-1.0,-1,0.0],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[-0.0,1,-1.0],[0.71,1,-0.71],[0.71,-1,-0.71]],closed:false,color:'#2ecc71'},
        {name:'SphereWire',pts3d:[[0,-1,0],[-1,0,0],[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,1,0],[0,0,1],[0,1,0],[0,0,-1],[0,-1,0],[1,0,0],[0,1,0]],closed:false,color:'#1abc9c'},
        {name:'Tesseract',pts3d:[[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1],[1,-1,1],[1,1,1],[1,1,-1],[1,-1,-1]],closed:false,color:'#9b59b6'},
        {name:'Crystal',pts3d:[[0,-1,0],[-1,0,0],[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,1,0],[0,0,1],[0,1,0],[0,0,-1],[0,-1,0],[1,0,0],[0,1,0]],closed:false,color:'#f1c40f'},
        {name:'Mobius',pts3d:[[1.0,-1,0.0],[0.71,-1,0.71],[0.0,-1,1.0],[-0.71,-1,0.71],[-1.0,-1,0.0],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[0.71,-1,-0.71],[1.0,-1,0.0],[1.0,1,0.0],[0.71,1,0.71],[0.0,1,1.0],[-0.71,1,0.71],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.0,1,-1.0],[0.71,1,-0.71],[1.0,1,0.0],[0.71,1,0.71],[0.71,-1,0.71],[0.0,-1,1.0],[0.0,1,1.0],[-0.71,1,0.71],[-0.71,-1,0.71],[-1.0,-1,0.0],[-1.0,1,0.0],[-0.71,1,-0.71],[-0.71,-1,-0.71],[-0.0,-1,-1.0],[-0.0,1,-1.0],[0.71,1,-0.71],[0.71,-1,-0.71]],closed:false,color:'#e74c3c'}
      ]
    };
    const lvl=Math.min(Math.max(currentLevel,1),5);
    const shapeList=SHAPES[lvl]||SHAPES[1];
    let shapeIdx=0,nextDot=0,done=false,hintOn=false,rotX=0.5,rotY=0.5,isDragging=false,lastX=0,lastY=0,drawFunc=null;
    cv.onmousedown=e=>{isDragging=true;lastX=e.clientX;lastY=e.clientY;};
    cv.onmousemove=e=>{if(isDragging){rotX+=(e.clientY-lastY)*0.01;rotY+=(e.clientX-lastX)*0.01;lastX=e.clientX;lastY=e.clientY;if(drawFunc)drawFunc();}};
    cv.onmouseup=cv.onmouseleave=()=>{isDragging=false;};
    cv.ontouchstart=e=>{isDragging=true;lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;};
    cv.ontouchmove=e=>{if(isDragging){rotX+=(e.touches[0].clientY-lastY)*0.01;rotY+=(e.touches[0].clientX-lastX)*0.01;lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;if(drawFunc)drawFunc();}};
    cv.ontouchend=cv.ontouchcancel=()=>{isDragging=false;};
    function loadShape(){
      const sh=shapeList[shapeIdx];nextDot=0;done=false;hintOn=false;rotX=0.5;rotY=0.5;
      const pad=50,W=400,H=400;cv.width=W;cv.height=H;
      const ctx=cv.getContext('2d');const hitR=lvl<=1?32:lvl<=2?26:22;
      let norm=[],groups=[];
      drawFunc=function(){
        ctx.clearRect(0,0,W,H);ctx.fillStyle='#fafafa';ctx.fillRect(0,0,W,H);
        norm=[];groups=[];
        if(lvl>=3){
            const cosX=Math.cos(rotX),sinX=Math.sin(rotX),cosY=Math.cos(rotY),sinY=Math.sin(rotY);
            norm=sh.pts3d.map(([x,y,z])=>{
                const x1=x*cosY-z*sinY,z1=x*sinY+z*cosY;
                const y2=y*cosX-z1*sinX,z2=y*sinX+z1*cosX;
                const scale=200/(4+z2);
                return [W/2+x1*scale*100,H/2+y2*scale*100];
            });
        }else{
            const xs=sh.pts.map(p=>p[0]),ys=sh.pts.map(p=>p[1]);
            const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
            const sc=Math.min((W-pad*2)/(maxX-minX||1),(H-pad*2)/(maxY-minY||1));
            const offX=pad+(W-pad*2-(maxX-minX)*sc)/2-minX*sc,offY=pad+(H-pad*2-(maxY-minY)*sc)/2-minY*sc;
            norm=sh.pts.map(([x,y])=>[x*sc+offX,y*sc+offY]);
        }
        norm.forEach((p,i)=>{
            let g=groups.find(g=>Math.hypot(g.x-p[0],g.y-p[1])<10);
            if(g){g.ids.push(i);g.x=(g.x+p[0])/2;g.y=(g.y+p[1])/2;if(i===nextDot)g.isNext=true;}
            else groups.push({x:p[0],y:p[1],ids:[i],isNext:i===nextDot});
        });
        if(nextDot>1||done){
          ctx.beginPath();ctx.moveTo(norm[0][0],norm[0][1]);
          const lim=done?norm.length:nextDot;
          for(let i=1;i<lim;i++)ctx.lineTo(norm[i][0],norm[i][1]);
          if(done&&sh.closed)ctx.closePath();
          ctx.strokeStyle=sh.color;ctx.lineWidth=done?5:3;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
          if(done){ctx.fillStyle=sh.color+'55';ctx.fill();}
        }
        groups.forEach(g=>{
          const connected=g.ids.some(id=>id<nextDot),isNext=g.isNext;
          const x=g.x,y=g.y;
          ctx.beginPath();ctx.arc(x,y,connected?8:isNext?13:9,0,6.28);
          ctx.fillStyle=connected?sh.color:isNext?(hintOn?'#e74c3c':'#f1c40f'):'#ccc';
          if(isNext&&hintOn){ctx.shadowColor='#e74c3c';ctx.shadowBlur=20;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#e74c3c';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);}
          else{ctx.fill();ctx.strokeStyle=connected?sh.color:'#999';ctx.lineWidth=2;ctx.stroke();}
          if(!done){
            ctx.fillStyle=connected?'#fff':isNext?'#333':'#555';
            let lbl=g.ids.map(n=>n+1).join(',');
            ctx.font=`bold ${lbl.length>2?8:12}px 'JetBrains Mono',monospace`;
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(lbl,x,y);
          }
        });
        if(done){ctx.fillStyle=sh.color;ctx.font='bold 20px JetBrains Mono,monospace';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('\u2b50 '+sh.name+'!',W/2,10);}
      };
      drawFunc();
      function tap(e){
        if(done||isDragging)return;
        const r=cv.getBoundingClientRect();
        const t=e.changedTouches?e.changedTouches[0]:e;
        const mx=(t.clientX-r.left)*(W/r.width),my=(t.clientY-r.top)*(H/r.height);
        const g=groups.find(g=>g.isNext);
        if(g&&Math.hypot(mx-g.x,my-g.y)<hitR){
          nextDot++;hintOn=false;
          if(nextDot>=norm.length){
            done=true;addScore(lvl*10);showFeedback('\u2b50 '+sh.name+'!','#f1c40f');drawFunc();
            setTimeout(()=>{shapeIdx=(shapeIdx+1)%shapeList.length;loadShape();},2200);
          } else drawFunc();
        }
      }
      cv.onclick=tap;
      cv.addEventListener('touchend',e=>{if(!isDragging){tap(e);}},{passive:false});
      renderUI(sh);
    }
    function renderUI(sh){
      ui.innerHTML='';
      const info=document.createElement('div');
      info.style.cssText='font-family:JetBrains Mono,monospace;color:#f39c12;font-size:0.9rem;';
      info.innerHTML=`Shape ${shapeIdx+1}/${shapeList.length}: <b>${sh.name}</b>`;
      const hint=document.createElement('button');hint.className='lab-tool';hint.textContent='\ud83d\udca1 Hint';hint.style.padding='6px 14px';
      hint.onclick=()=>{hintOn=true;drawFunc();};
      const skip=document.createElement('button');skip.className='lab-tool';skip.textContent='\u23ed Skip';skip.style.padding='6px 14px';
      skip.onclick=()=>{shapeIdx=(shapeIdx+1)%shapeList.length;loadShape();};
      ui.append(info,hint,skip);
    }
    loadShape();}