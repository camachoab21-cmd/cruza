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
    if(now-lastDraw<25){frame=requestAnimationFrame(render);return;}
    lastDraw=now;
    ctx.clearRect(0,0,width,height);
    segments=segments.filter(v=>now-v.t<3000);
    dust=dust.filter(v=>now-v.t<1800);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of segments){
      const fade=Math.max(0,1-(now-s.t)/3000);
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
      const fade=Math.max(0,1-(now-p.t)/1800);
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
    if(!prior||now-prior.t>245){prior={x,y,t:now};return;}
    const dist=Math.hypot(x-prior.x,y-prior.y);
    if(dist<1.5||dist>240){prior={x,y,t:now};return;}
    walk+=dist;
    const start=paletteAt(walk/77),end=paletteAt((walk+dist)/77+.22);
    const gradient=ctx.createLinearGradient(prior.x,prior.y,x||prior.x+.01,y||prior.y+.01);
    gradient.addColorStop(0,rgb(start));gradient.addColorStop(1,rgb(end));
    const crayon=mode==='crayon';
    segments.push({x:prior.x,y:prior.y,xx:x,yy:y,start,end,gradient,t:now,crayon,area});
    if(segments.length>95)segments.splice(0,segments.length-95);
    const count=crayon?7:4;
    for(let i=0;i<count;i++){
      const color=paletteAt((walk+i*10)/77);
      dust.push({x:x+(Math.random()-.5)*15,y:y+(Math.random()-.5)*15,
        vx:(Math.random()-.5)*2.4,vy:(Math.random()-.5)*2.4,
        radius:.5+Math.random()*(crayon?2.2:1.45),t:now,color,area,
        star:Math.random()<(crayon?.15:.08),angle:Math.random()*6.28});
    }
    if(dust.length>220)dust.splice(0,dust.length-220);
    prior={x,y,t:now};
    if(!frame)frame=requestAnimationFrame(render);
  }
  function onPointer(e){
    if(e.pointerType!=='mouse'||!canRun()){hide();return;}
    const board=e.target.closest('.board-map');
    const onControl=tooInteractive(e)&&!board;
    boardChange(board);
    if(onControl){hide();return;}
    visible=true;boardActive=!!board;
    cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';
    cursor.classList.add('is-visible');
    cursor.classList.toggle('is-large',boardActive);
    root.classList.add('cruza-art-cursor-on');
    lastPosition={x:e.clientX,y:e.clientY};
    if(board){
      const rect=board.getBoundingClientRect();
      board.style.setProperty('--cruza-x',((e.clientX-rect.left)/rect.width*100).toFixed(1)+'%');
      board.style.setProperty('--cruza-y',((e.clientY-rect.top)/rect.height*100).toFixed(1)+'%');
      const stage=e.target.closest('.map-stage');
      if(stage&&!e.target.closest('button,a,input,textarea,select')){
        const b=stage.getBoundingClientRect(),padding=10;
        const area={x:b.left+padding,y:b.top+padding,w:b.width-padding*2,h:b.height-padding*2};
        if(e.clientX>=area.x&&e.clientX<=area.x+area.w&&e.clientY>=area.y&&e.clientY<=area.y+area.h){
          paint(e.clientX,e.clientY,area);
        }else prior=null;
      }else prior=null;
    }else{
      // El lápiz sigue dibujando sobre papel libre, sin cubrir controles ni texto.
      // El tamaño grande continúa reservado exclusivamente para el crucigrama.
      const blocked=e.target.closest('.auth-copy,.auth-hero-tiles,.brand,.auth-form-area,.sidebar,.topbar,.hint-bar,.card,.page-heading,form,nav,footer,table,article,button,a,input,textarea,select,[role="dialog"],[contenteditable="true"]');
      const background=e.target.closest('.auth-art,.auth-scene,.workspace,.page,.shell');
      const freeSurface=e.target.matches('.auth-art,.auth-scene,.auth-stars,.auth-star,.canvas-grid,.workspace,.page,.shell');
      if(background&&freeSurface&&!blocked){
        paint(e.clientX,e.clientY,{x:0,y:0,w:width,h:height});
      }else prior=null;
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
