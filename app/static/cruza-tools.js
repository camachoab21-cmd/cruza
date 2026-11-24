/* CRUZA 3 | Lápiz y crayón compartidos por la app FastAPI y la vista pública.
   Sin dependencias. La punta coincide con el puntero y los controles siguen operativos. */
(function(){
  'use strict';
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const root=document.documentElement;
  const canvas=document.getElementById('ambient-canvas')||document.getElementById('preview-ink-canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  canvas.classList.add('cruza-pigment-layer');
  const cursor=document.createElement('div');
  cursor.id='cruza-art-cursor';cursor.className='cruza-art-cursor';
  cursor.setAttribute('aria-hidden','true');
  cursor.innerHTML=
    '<svg class="tool-pencil" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="cruzaPencilBody" x1="0" x2="1"><stop stop-color="#f9e59d"/><stop offset=".5" stop-color="#ffc266"/><stop offset="1" stop-color="#e98f64"/></linearGradient></defs>'+
    '<path d="M27 12 Q27 6 33 6 H47 Q53 6 53 12 V85 L40 116 L27 85Z" fill="url(#cruzaPencilBody)" stroke="#80684f" stroke-width="2"/>'+
    '<path d="M27 83L40 116L53 83Z" fill="#efdbb1" stroke="#9d8761" stroke-width="1.4"/>'+
    '<path d="M35.5 105L40 116L44.5 105Z" fill="#263b37"/>'+
    '<path d="M34 7 V88M46 7V88" stroke="#fff8d0" stroke-width="3" opacity=".75"/>'+
    '<rect x="27" y="4" width="26" height="17" rx="6" fill="#ceaff9" stroke="#9478c5" stroke-width="2"/>'+
    '<path d="M27 25 H53" stroke="#b9805c" stroke-width="2"/></svg>'+
    '<svg class="tool-crayon" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="cruzaCrayonBody" x1="0" y1="0" x2="1" y2="1">'+
    '<stop stop-color="#bff54b"/><stop offset=".26" stop-color="#61e6cc"/>'+
    '<stop offset=".59" stop-color="#a888fe"/><stop offset=".85" stop-color="#ffb786"/>'+
    '<stop offset="1" stop-color="#ffd96c"/></linearGradient></defs>'+
    '<path d="M27 25 Q27 18 40 13 Q53 18 53 25 V101 Q53 107 47 110 L40 116 L33 110 Q27 107 27 101Z" fill="url(#cruzaCrayonBody)" stroke="#705f87" stroke-width="2"/>'+
    '<path d="M27 27H53M27 41H53M27 92H53" stroke="#fff4d0" stroke-width="3" opacity=".8"/>'+
    '<rect x="26" y="46" width="28" height="39" rx="3" fill="#fff9df" stroke="#9077ae" stroke-width="1.5"/>'+
    '<path d="M30 70Q38 51 49 63Q43 77 30 70Z" fill="#b28ee9"/>'+
    '<path d="M33 105L40 116L47 105" fill="#f8b36d" stroke="#885783" stroke-width="1.4"/></svg>';
  document.body.appendChild(cursor);
  const palettes={
    light:[[187,243,67],[58,225,194],[170,116,255],[255,150,102],[255,234,123]],
    dark:[[203,255,103],[68,245,213],[193,163,255],[255,184,132],[255,238,158]]
  };
  let mode='pencil',activeBoard=null,prior=null,segments=[],dust=[],frame=0,walk=0;
  let width=0,height=0,visible=false,boardActive=false,lastPosition={x:0,y:0};
  const canRun=()=>fine.matches&&!reduce.matches;
  const rgb=(c,a=1)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.25);
    width=innerWidth;height=innerHeight;
    canvas.width=Math.max(1,Math.floor(width*dpr));
    canvas.height=Math.max(1,Math.floor(height*dpr));
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    segments=[];dust=[];prior=null;
  }
  resize();addEventListener('resize',resize,{passive:true});
  function paletteAt(step){
    const values=palettes[root.dataset.theme==='dark'?'dark':'light'];
    const offset=((step%values.length)+values.length)%values.length,idx=Math.floor(offset);
    const a=values[idx],b=values[(idx+1)%values.length],t=offset-idx;
    return a.map((v,k)=>Math.round(v+(b[k]-v)*t));
  }
  function setMode(next){
    mode=next==='crayon'?'crayon':'pencil';
    cursor.dataset.tool=mode;
    const preview=document.getElementById('preview-tool');
    if(preview){
      preview.textContent=mode==='pencil'?'✎ Lápiz':'🖍 Crayón';
      preview.setAttribute('aria-pressed',String(mode==='crayon'));
      preview.setAttribute('aria-label','Herramienta '+mode+'. Pulsar para cambiar');
    }
    const appButton=document.querySelector('[data-action="tool"]');
    if(appButton){
      appButton.textContent=mode==='pencil'?'✎ Lápiz':'🖍 Crayón';
      appButton.setAttribute('aria-label','Herramienta '+mode+'. Pulsar para cambiar');
      appButton.setAttribute('aria-pressed',String(mode==='crayon'));
    }
    return mode;
  }
  function toggle(){return setMode(mode==='pencil'?'crayon':'pencil');}
  const tooInteractive=e=>!!e.target.closest('button,input,textarea,select,a,[role="button"],[contenteditable="true"],.dialog,.overlay,.toast-region');
  function boardChange(board){
    if(activeBoard===board)return;
    if(activeBoard)activeBoard.classList.remove('cruza-map-has-cursor');
    activeBoard=board;
    if(activeBoard)activeBoard.classList.add('cruza-map-has-cursor');
    prior=null;
  }
  function hide(){
    visible=false;boardActive=false;
    root.classList.remove('cruza-art-cursor-on');
    cursor.classList.remove('is-visible','is-large');
    boardChange(null);prior=null;
  }
  let lastDraw=0;
  function render(now){
    frame=0;
    if(document.hidden)return;
    // 40 FPS máximos para el pigmento: el cursor del ratón se mueve independientemente.
    if(now-lastDraw<16){frame=requestAnimationFrame(render);return;}
    lastDraw=now;
    ctx.clearRect(0,0,width,height);
    segments=segments.filter(v=>now-v.t<1000);
    dust=dust.filter(v=>now-v.t<700);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of segments){
      const fade=Math.max(0,1-(now-s.t)/1000);
      if(fade<=0)continue;
      const a=s.area;
      const clipped=a.w<width-1||a.h<height-1;
      ctx.save();
      if(clipped){ctx.beginPath();ctx.rect(a.x,a.y,a.w,a.h);ctx.clip();}
      ctx.globalAlpha=fade*(s.crayon?.85:.91);
      ctx.strokeStyle=s.gradient;
      ctx.lineWidth=s.crayon?8.5:2.8;
      ctx.shadowBlur=s.crayon?5:3;
      ctx.shadowColor=rgb(s.end,.38);
      ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.xx,s.yy);ctx.stroke();
      if(s.crayon){
        ctx.shadowBlur=0;
        ctx.globalAlpha=fade*.17;
        ctx.strokeStyle=rgb(s.start);
        ctx.lineWidth=12;
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.xx,s.yy);ctx.stroke();
      }
      ctx.restore();
    }
    // Las motas granuladas son ligeras: sin clip, filtros y save/restore por partícula.
    ctx.shadowBlur=0;
    for(const p of dust){
      const fade=Math.max(0,1-(now-p.t)/700);
      const elapsed=(now-p.t)*.013;
      const x=p.x+p.vx*elapsed,y=p.y+p.vy*elapsed,a=p.area;
      if(x<a.x||x>a.x+a.w||y<a.y||y>a.y+a.h)continue;
      ctx.fillStyle=p.star?rgb([255,248,207],fade*.8):rgb(p.color,fade*.72);
      if(p.star){
        ctx.save();ctx.translate(x,y);ctx.rotate(p.angle);
        const r=p.radius;
        ctx.beginPath();ctx.moveTo(0,-r*2);ctx.lineTo(r*.6,0);
        ctx.lineTo(0,r*2);ctx.lineTo(-r*.6,0);ctx.closePath();ctx.fill();
        ctx.restore();
      }else{
        ctx.beginPath();ctx.arc(x,y,p.radius,0,Math.PI*2);ctx.fill();
      }
    }
    if((segments.length||dust.length)&&!document.hidden)frame=requestAnimationFrame(render);
  }
  function paint(x,y,area){
    const now=performance.now();
    if(!prior||now-prior.t>500){prior={x,y,t:now};return;}
    const dist=Math.hypot(x-prior.x,y-prior.y);
    if(dist<1.5){return;}
    const crayon=mode==='crayon';
    const maxStep=crayon?28:20;
    const steps=Math.max(1,Math.min(24,Math.ceil(dist/maxStep)));
    const stepDx=(x-prior.x)/steps;
    const stepDy=(y-prior.y)/steps;
    const stepDist=dist/steps;
    let currX=prior.x,currY=prior.y;
    for(let k=1;k<=steps;k++){
      const nextX=k===steps?x:currX+stepDx;
      const nextY=k===steps?y:currY+stepDy;
      walk+=stepDist;
      const start=paletteAt(walk/77),end=paletteAt((walk+stepDist)/77+.22);
      const gradient=ctx.createLinearGradient(currX,currY,nextX||currX+.01,nextY||currY+.01);
      gradient.addColorStop(0,rgb(start));gradient.addColorStop(1,rgb(end));
      segments.push({x:currX,y:currY,xx:nextX,yy:nextY,start,end,gradient,t:now,crayon,area});
      currX=nextX;
      currY=nextY;
    }
    if(segments.length>380)segments.splice(0,segments.length-380);
    const count=crayon?7:4;
    for(let i=0;i<count;i++){
      const color=paletteAt((walk+i*10)/77);
      dust.push({x:x+(Math.random()-.5)*15,y:y+(Math.random()-.5)*15,
        vx:(Math.random()-.5)*2.4,vy:(Math.random()-.5)*2.4,
        radius:.5+Math.random()*(crayon?2.2:1.45),t:now,color,area,
        star:Math.random()<(crayon?.15:.08),angle:Math.random()*6.28});
    }
    if(dust.length>300)dust.splice(0,dust.length-300);
    prior={x,y,t:now};
    if(!frame)frame=requestAnimationFrame(render);
  }
  function onPointer(e){
    if(e.pointerType!=='mouse'||!canRun()){hide();return;}
    const board=e.target.closest('.board-map');
    const onControl=tooInteractive(e)&&!board;
    boardChange(board);
    if(onControl){
      visible=false;
      root.classList.remove('cruza-art-cursor-on');
      cursor.classList.remove('is-visible','is-large');
    }else{
      visible=true;boardActive=!!board;
      cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-large',boardActive);
      root.classList.add('cruza-art-cursor-on');
    }
    lastPosition={x:e.clientX,y:e.clientY};
    if(board){
      const rect=board.getBoundingClientRect();
      board.style.setProperty('--cruza-x',((e.clientX-rect.left)/rect.width*100).toFixed(1)+'%');
      board.style.setProperty('--cruza-y',((e.clientY-rect.top)/rect.height*100).toFixed(1)+'%');
    }
    // Dibuja el trazo continuo sobre una capa frontal (z-index 45), pasando
    // por encima de textos, títulos grandes y tarjetas sin cortarse ni desaparecer.
    const modal=e.target.closest('[role="dialog"],.dialog,.overlay');
    if(!modal){
      paint(e.clientX,e.clientY,{x:0,y:0,w:width,h:height});
    }else{
      prior=null;
    }
  }
  document.addEventListener('pointermove',onPointer,{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget)hide();},{passive:true});
  document.addEventListener('mouseleave',hide,{passive:true});
  window.addEventListener('blur',hide);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){hide();cancelAnimationFrame(frame);frame=0;}});
  const preview=document.getElementById('preview-tool');
  if(preview)preview.addEventListener('click',toggle);
  window.CruzaTools={
    setMode,toggle,getMode:()=>mode,
    debug:()=>({mode,visible,insideMap:boardActive,width:cursor.getBoundingClientRect().width,
      segments:segments.length,particles:dust.length,x:lastPosition.x,y:lastPosition.y,
      pencilHidden:!!activeBoard?.classList.contains('cruza-map-has-cursor'),
      colors:segments.slice(-5).map(seg=>seg.start)})
  };
  setMode('pencil');
})();
